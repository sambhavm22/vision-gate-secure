-- 1. Create user_devices table
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    platform TEXT, -- 'ios', 'android', 'web'
    last_seen_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, device_token)
);

-- 2. Enable RLS on user_devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for user_devices
CREATE POLICY "Users can manage their own device tokens" 
    ON public.user_devices
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. Central send_notification function (Internal RPC)
-- This function handles both in-app notification insertion and (placeholder) push notification triggering.
CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id UUID,
    p_title TEXT,
    p_body TEXT,
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
    -- 4a. Insert into notifications table (for Realtime in-app view)
    INSERT INTO public.notifications (user_id, title, message, metadata, priority)
    VALUES (p_user_id, p_title, p_body, p_data, 'High');

    -- 4b. Placeholder for Push Notification (Edge Function Trigger)
    -- In a real scenario, this could trigger a webhook or an edge function via pg_net or similar
    -- For now, we rely on the notifications table for Realtime and we'll implement the Edge Function listener.
    PERFORM pg_notify('push_notifications', json_build_object(
        'user_id', p_user_id,
        'title', p_title,
        'body', p_body,
        'data', p_data
    )::text);

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Booking Event Notification Trigger Function
CREATE OR REPLACE FUNCTION public.notify_booking_event()
RETURNS TRIGGER AS $$
DECLARE
    v_service_name TEXT;
    v_customer_id UUID;
    v_worker_id UUID;
    v_worker_user_id UUID;
BEGIN
    -- Get common data
    SELECT name INTO v_service_name FROM public.services WHERE id = NEW.service_id;
    v_customer_id := NEW.customer_id;
    v_worker_id := NEW.worker_id;

    -- Resolve worker's user_id if worker is assigned
    IF v_worker_id IS NOT NULL THEN
        SELECT user_id INTO v_worker_user_id FROM public.workers_public WHERE id = v_worker_id;
    END IF;

    -- Handle Status Changes
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR (TG_OP = 'INSERT') THEN
        
        -- WORKER ASSIGNED (Initial matching or reassignment)
        IF NEW.status = 'assigned' AND v_worker_user_id IS NOT NULL THEN
            PERFORM public.send_notification(
                v_worker_user_id,
                'New Job Assigned',
                'You have been assigned a new ' || v_service_name || ' booking.',
                jsonb_build_object('booking_id', NEW.id, 'type', 'new_assignment')
            );
        END IF;

        -- WORKER ACCEPTED
        IF NEW.status = 'accepted' AND OLD.status = 'requested' THEN
            PERFORM public.send_notification(
                v_customer_id,
                'Worker Accepted',
                'A provider has accepted your ' || v_service_name || ' booking request.',
                jsonb_build_object('booking_id', NEW.id, 'type', 'booking_accepted')
            );
        END IF;

        -- WORKER ON THE WAY (en_route)
        IF NEW.status = 'en_route' THEN
            PERFORM public.send_notification(
                v_customer_id,
                'Worker is On the Way',
                'Your provider is heading to your location for ' || v_service_name || '.',
                jsonb_build_object('booking_id', NEW.id, 'type', 'worker_en_route')
            );
        END IF;

        -- JOB COMPLETED
        IF NEW.status = 'completed' THEN
            PERFORM public.send_notification(
                v_customer_id,
                'Job Completed',
                'Your ' || v_service_name || ' booking has been marked as completed.',
                jsonb_build_object('booking_id', NEW.id, 'type', 'booking_completed')
            );
        END IF;

        -- BOOKING CANCELLED BY USER (Notify Worker)
        IF NEW.status = 'cancelled' AND v_worker_user_id IS NOT NULL THEN
            PERFORM public.send_notification(
                v_worker_user_id,
                'Booking Cancelled',
                'The ' || v_service_name || ' booking has been cancelled by the user.',
                jsonb_build_object('booking_id', NEW.id, 'type', 'booking_cancelled')
            );
        ELSIF NEW.status = 'cancelled' AND v_worker_user_id IS NULL THEN
            -- Notify User if it was cancelled for some other reason (system?)
            PERFORM public.send_notification(
                v_customer_id,
                'Booking Cancelled',
                'Your ' || v_service_name || ' booking has been cancelled.',
                jsonb_build_object('booking_id', NEW.id, 'type', 'booking_cancelled')
            );
        END IF;

    END IF;

    -- Special case for Re-assignment during update
    IF TG_OP = 'UPDATE' AND OLD.worker_id IS DISTINCT FROM NEW.worker_id AND NEW.worker_id IS NOT NULL THEN
         SELECT user_id INTO v_worker_user_id FROM public.workers_public WHERE id = NEW.worker_id;
         IF v_worker_user_id IS NOT NULL THEN
            PERFORM public.send_notification(
                v_worker_user_id,
                'Job Re-assigned',
                'A ' || v_service_name || ' booking has been re-assigned to you.',
                jsonb_build_object('booking_id', NEW.id, 'type', 'job_reassigned')
            );
         END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach Trigger to bookings table
DROP TRIGGER IF EXISTS tr_notify_booking_event ON public.bookings;
CREATE TRIGGER tr_notify_booking_event
AFTER INSERT OR UPDATE OF status, worker_id ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_event();
