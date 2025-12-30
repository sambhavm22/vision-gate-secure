-- =============================================
-- RECURRING BOOKING NOTIFICATION TRIGGERS
-- =============================================

-- 1. Trigger Function: Recurring Booking Created
CREATE OR REPLACE FUNCTION public.notify_recurring_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    metadata
  ) VALUES (
    NEW.user_id,
    'Recurring Booking Setup',
    'Your recurring booking series has been successfully created.',
    jsonb_build_object('recurring_booking_id', NEW.id, 'type', 'recurring_created')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger Function: Occurrence Status Changed
CREATE OR REPLACE FUNCTION public.notify_occurrence_processed()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_details JSONB;
BEGIN
  -- Only care about status changes to 'created' (Success) or 'failed'
  IF NEW.status = OLD.status OR NEW.status NOT IN ('created', 'failed') THEN
    RETURN NEW;
  END IF;

  -- Get User ID from parent recurring booking
  SELECT user_id INTO v_user_id
  FROM public.recurring_bookings
  WHERE id = NEW.recurring_booking_id;

  IF NEW.status = 'created' THEN
     INSERT INTO public.notifications (
        user_id,
        title,
        message,
        metadata
     ) VALUES (
        v_user_id,
        'Upcoming Booking Scheduled',
        FORMAT('A new booking for %s has been scheduled.', TO_CHAR(NEW.scheduled_for, 'Mon DD, HH:MI AM')),
        jsonb_build_object(
            'recurring_booking_id', NEW.recurring_booking_id,
            'booking_id', NEW.booking_id,
            'occurrence_id', NEW.id,
            'type', 'occurrence_success'
        )
     );
  ELSIF NEW.status = 'failed' THEN
     INSERT INTO public.notifications (
        user_id,
        title,
        message,
        metadata
     ) VALUES (
        v_user_id,
        'Booking Schedule Failed',
        COALESCE(NEW.failure_reason, 'We could not schedule your upcoming booking. Please check your payment method.'),
        jsonb_build_object(
            'recurring_booking_id', NEW.recurring_booking_id,
            'occurrence_id', NEW.id,
            'type', 'occurrence_failed'
        )
     );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Attach Triggers

DROP TRIGGER IF EXISTS tr_notify_recurring_created ON public.recurring_bookings;
CREATE TRIGGER tr_notify_recurring_created
AFTER INSERT ON public.recurring_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_recurring_created();

DROP TRIGGER IF EXISTS tr_notify_occurrence_procesed ON public.recurring_booking_occurrences;
CREATE TRIGGER tr_notify_occurrence_procesed
AFTER UPDATE ON public.recurring_booking_occurrences
FOR EACH ROW
EXECUTE FUNCTION public.notify_occurrence_processed();
