-- Migration: Fix Search Path for PostGIS Functions
-- The following functions use 'geography' type or PostGIS functions but were restricted to 'public' schema only.
-- We enter 'extensions' to the search_path so they can resolve the geography type.

-- 1. notify_new_booking_to_workers
DROP FUNCTION IF EXISTS public.notify_new_booking_to_workers() CASCADE;
CREATE OR REPLACE FUNCTION public.notify_new_booking_to_workers()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path = public, extensions
AS $function$
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
    wp.user_id IS NOT NULL 
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
$function$;

-- Re-create trigger dropped by CASCADE
DROP TRIGGER IF EXISTS tr_notify_new_booking ON public.bookings;
CREATE TRIGGER tr_notify_new_booking
    AFTER INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_booking_to_workers();


-- 2. assign_worker_to_booking
DROP FUNCTION IF EXISTS public.assign_worker_to_booking(uuid);
CREATE OR REPLACE FUNCTION public.assign_worker_to_booking(p_booking_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
    v_booking RECORD;
    v_worker_id uuid;
    v_service_name text;
    v_radius_meters int := 20000; -- 20km
BEGIN
    -- Get booking details
    SELECT b.*, s.name as service_name
    INTO v_booking
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.id = p_booking_id;

    IF v_booking.id IS NULL THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Update status to searching immediately if not already
    UPDATE bookings SET status = 'searching' WHERE id = p_booking_id;

    -- Find nearest available worker, prioritizing preferred ones
    SELECT w.id INTO v_worker_id
    FROM workers_public w
    LEFT JOIN customer_preferred_workers cpw ON w.id = cpw.worker_id AND cpw.customer_id = v_booking.customer_id
    WHERE
        w.is_online = true
        -- Service Type Match
        AND v_booking.service_name = ANY(w.service_types)
        -- Not rejected
        AND (v_booking.rejected_worker_ids IS NULL OR NOT (w.id = ANY(v_booking.rejected_worker_ids)))
        -- Distance Check
        AND ST_DWithin(w.location, v_booking.location, v_radius_meters)
        -- Integrated Availability Check (Bookings + Blocks)
        AND public.is_worker_available(
            w.id, 
            v_booking.scheduled_at, 
            (v_booking.scheduled_at + (v_booking.duration_minutes || ' minutes')::interval)
        )
    ORDER BY 
        (cpw.id IS NOT NULL) DESC, -- Preferred workers first
        ST_Distance(w.location, v_booking.location) ASC
    LIMIT 1;

    -- Assign or Keep Searching
    IF v_worker_id IS NOT NULL THEN
        UPDATE bookings
        SET
            worker_id = v_worker_id,
            status = 'assigned',
            updated_at = NOW()
        WHERE id = p_booking_id;

        -- Notify Worker
        PERFORM public.send_notification(
            (SELECT user_id FROM workers_public WHERE id = v_worker_id),
            'New Job Assigned',
            'You have a new job assignment near ' || v_booking.city,
            jsonb_build_object('booking_id', p_booking_id, 'type', 'booking_assigned')
        );
    ELSE
        -- No worker found, stay in 'searching'
        UPDATE bookings
        SET
            worker_id = NULL,
            status = 'searching',
            updated_at = NOW()
        WHERE id = p_booking_id;
    END IF;
END;
$function$;

-- 3. get_market_bookings_v2
DROP FUNCTION IF EXISTS public.get_market_bookings_v2(uuid, integer, integer);
CREATE OR REPLACE FUNCTION public.get_market_bookings_v2(p_worker_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50, p_radius_km integer DEFAULT 50)
 RETURNS TABLE(id uuid, booking_id uuid, service_name text, status text, total_amount numeric, scheduled_at timestamp with time zone, duration_minutes integer, address_line1 text, city text, dist_meters double precision, notes text, is_location_estimated boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
DECLARE
    v_worker_loc geography(Point, 4326);
BEGIN
    -- Get worker's location
    SELECT location INTO v_worker_loc
    FROM workers_public
    WHERE workers_public.id = p_worker_id;

    RETURN QUERY
    SELECT 
        b.id,
        b.id as booking_id,
        s.name as service_name,
        b.status::text,
        b.total_amount,
        b.scheduled_at,
        b.duration_minutes,
        COALESCE(a.address_line1, 'Location via Map') as address_line1,
        COALESCE(a.city, 'Unknown') as city,
        CASE 
            WHEN v_worker_loc IS NOT NULL AND b.location IS NOT NULL 
            THEN ST_Distance(b.location, v_worker_loc)
            ELSE NULL 
        END as dist_meters,
        b.notes,
        (b.address_id IS NULL) as is_location_estimated
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    LEFT JOIN addresses a ON b.address_id = a.id
    WHERE 
        -- include bookings assigned to ME
        (b.status = 'assigned' AND b.worker_id = p_worker_id)
        OR
        -- OR include requested bookings in radius (legacy/fallback)
        (
            b.status = 'requested' 
            AND b.worker_id IS NULL
            AND (p_radius_km IS NULL OR ST_DWithin(b.location, v_worker_loc, p_radius_km * 1000))
        )
    ORDER BY b.scheduled_at ASC
    LIMIT p_limit;
END;
$function$;

-- 4. nearby_workers
DROP FUNCTION IF EXISTS public.nearby_workers(double precision, double precision, text, integer);
CREATE OR REPLACE FUNCTION public.nearby_workers(lat double precision, lng double precision, service_filter text DEFAULT NULL::text, radius_meters integer DEFAULT 10000)
 RETURNS TABLE(id uuid, full_name text, rating numeric, hourly_rate numeric, dist_meters double precision, is_verified boolean, profile_image_url text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path = public, extensions
AS $function$
  select
    id,
    full_name,
    rating,
    hourly_rate,
    st_distance(location, st_point(lng, lat)::geography) as dist_meters,
    is_verified,
    profile_image_url
  from
    public.workers_public
  where
    st_dwithin(location, st_point(lng, lat)::geography, radius_meters)
    and (service_filter is null or service_types @> array[service_filter])
  order by
    dist_meters asc;
$function$;
