-- Migration: create_booking_notification_trigger
-- Creates a trigger to insert notifications when booking status changes

-- Function: notify on booking status change
CREATE OR REPLACE FUNCTION public.handle_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_title TEXT;
    v_message TEXT;
    v_target_user_id UUID;
    v_notification_type TEXT;
BEGIN
    -- Only fire on status changes
    IF OLD.status = NEW.status THEN
        RETURN NEW;
    END IF;

    -- Determine notification based on new status
    CASE NEW.status
        WHEN 'accepted', 'assigned' THEN
            -- Notify the customer
            v_target_user_id := NEW.customer_id;
            v_title := 'Worker Assigned';
            v_message := 'A worker has been assigned to your booking and will be on the way soon.';
            v_notification_type := 'booking_accepted';

        WHEN 'en_route' THEN
            -- Notify the customer
            v_target_user_id := NEW.customer_id;
            v_title := 'Worker Arrived';
            v_message := 'Your worker has arrived at the location.';
            v_notification_type := 'worker_arrived';

        WHEN 'in_progress' THEN
            -- Notify the customer
            v_target_user_id := NEW.customer_id;
            v_title := 'Work Started';
            v_message := 'Your worker has started working on the job.';
            v_notification_type := 'work_started';

        WHEN 'completed' THEN
            -- Notify the customer
            v_target_user_id := NEW.customer_id;
            v_title := 'Job Completed';
            v_message := 'Your job has been completed. Please rate your experience!';
            v_notification_type := 'job_completed';

        WHEN 'cancelled' THEN
            -- Notify the worker (if assigned)
            IF NEW.worker_id IS NOT NULL THEN
                v_target_user_id := NEW.worker_id;
                v_title := 'Booking Cancelled';
                v_message := 'A booking assigned to you has been cancelled.';
                v_notification_type := 'booking_cancelled';
            END IF;

            -- Also notify the customer
            INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
            VALUES (NEW.customer_id, 'Booking Cancelled', 'Your booking has been cancelled.', 'booking_cancelled', false, NOW());

        ELSE
            -- No notification for other statuses
            RETURN NEW;
    END CASE;

    -- Insert notification for the target user
    IF v_target_user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
        VALUES (v_target_user_id, v_title, v_message, v_notification_type, false, NOW());
    END IF;

    RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_booking_status_change ON bookings;

-- Create trigger
CREATE TRIGGER on_booking_status_change
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION handle_booking_status_change();
