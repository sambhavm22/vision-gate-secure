-- Fix for null value in column "user_id" of relation "notifications" violation
-- This occurs when a worker exists in workers_public but has no linked user_id in auth.users

CREATE OR REPLACE FUNCTION public.notify_new_booking_to_workers()
RETURNS TRIGGER AS $$
DECLARE
  v_service_name TEXT;
  v_booking_location GEOGRAPHY;
BEGIN
  -- 1. Get service name
  SELECT name INTO v_service_name FROM public.services WHERE id = NEW.service_id;

  -- 2. Ensure we have a location
  v_booking_location := NEW.location;
  IF v_booking_location IS NULL THEN
     SELECT location INTO v_booking_location FROM public.addresses WHERE id = NEW.address_id;
  END IF;

  IF v_booking_location IS NULL THEN
     RETURN NEW;
  END IF;

  -- 3. Find nearby, eligible, and AVAILABLE workers
  INSERT INTO public.notifications (user_id, title, message, priority, metadata)
  SELECT 
    wp.user_id,
    'New Booking Available',
    v_service_name || ' booking available near you!',
    'Medium',
    jsonb_build_object(
      'booking_id', NEW.id,
      'service_name', v_service_name,
      'scheduled_at', NEW.scheduled_at,
      'type', 'new_booking_available'
    )
  FROM public.workers_public wp
  WHERE 
    wp.user_id IS NOT NULL -- Exclude workers with no linked user account
    AND wp.is_online = true
    AND v_service_name = ANY(wp.service_types)
    AND st_dwithin(wp.location, v_booking_location, 20000)
    AND NOT EXISTS (
      SELECT 1 FROM public.bookings b2
      WHERE b2.worker_id = wp.id
      AND b2.status IN ('accepted', 'en_route', 'in_progress')
      AND (
        (NEW.scheduled_at, NEW.scheduled_at + (NEW.duration_minutes || ' minutes')::interval)
        OVERLAPS
        (b2.scheduled_at, b2.scheduled_at + (b2.duration_minutes || ' minutes')::interval)
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
