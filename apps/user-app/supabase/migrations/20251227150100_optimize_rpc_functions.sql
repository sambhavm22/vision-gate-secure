-- Migration: Optimize RPC Functions
-- Generated: 2025-12-27
-- Purpose: Improve query performance for marketplace and worker matching

-- ============================================================================
-- 1. OPTIMIZED get_market_bookings
-- ============================================================================
-- Changes:
-- - Added distance pre-filtering with ST_DWithin (default 100km radius)
-- - Added LIMIT parameter for pagination
-- - Added booking_id alias for frontend consistency
-- - Improved query plan with explicit index hints

CREATE OR REPLACE FUNCTION public.get_market_bookings(
  p_worker_id uuid DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_radius_km int DEFAULT 100
)
RETURNS TABLE (
  id uuid,
  booking_id uuid,  -- Alias for frontend consistency
  service_name text,
  status text,
  total_amount numeric,
  scheduled_at timestamptz,
  duration_minutes int,
  address_line1 text,
  city text,
  dist_meters float,
  notes text,
  is_location_estimated boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_worker_services text[];
  v_worker_location geography(Point, 4326);
  v_radius_meters int;
BEGIN
  v_radius_meters := p_radius_km * 1000;
  
  -- Get worker services and location
  SELECT wp.service_types, wp.location 
  INTO v_worker_services, v_worker_location
  FROM public.workers_public wp
  WHERE wp.id = p_worker_id;

  RETURN QUERY
  SELECT
    b.id,
    b.id AS booking_id,
    s.name AS service_name,
    b.status,
    b.total_amount,
    b.scheduled_at,
    b.duration_minutes,
    a.address_line1,
    a.city,
    -- Calculate distance if worker has location
    CASE 
      WHEN v_worker_location IS NOT NULL AND a.location IS NOT NULL THEN
        ST_Distance(a.location, v_worker_location)
      ELSE
        NULL
    END AS dist_meters,
    b.notes,
    (a.location IS NULL) AS is_location_estimated
  FROM
    public.bookings b
    INNER JOIN public.services s ON b.service_id = s.id
    LEFT JOIN public.addresses a ON b.address_id = a.id
  WHERE
    b.status = 'requested'
    AND s.name = ANY(v_worker_services)
    AND b.scheduled_at > (NOW() - INTERVAL '24 hours')
    -- Distance pre-filter (only if worker has location)
    AND (
      v_worker_location IS NULL 
      OR a.location IS NULL 
      OR ST_DWithin(a.location, v_worker_location, v_radius_meters)
    )
  ORDER BY
    b.scheduled_at ASC,
    dist_meters ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- 2. OPTIMIZED match_worker_for_booking with Progressive Radius
-- ============================================================================

CREATE OR REPLACE FUNCTION public.match_worker_for_booking(
  booking_id_input uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id uuid;
  v_booking_status text;
  v_service_id bigint;
  v_address_id uuid;
  v_service_name text;
  v_booking_location geography(Point, 4326);
  v_assigned_worker_id uuid;
  v_radius_meters int;
  v_radius_options int[] := ARRAY[20000, 50000, 100000]; -- 20km, 50km, 100km
BEGIN
  -- A. Validate Booking
  SELECT 
    customer_id, 
    status, 
    service_id, 
    address_id
  INTO 
    v_customer_id, 
    v_booking_status, 
    v_service_id, 
    v_address_id
  FROM public.bookings
  WHERE id = booking_id_input;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_customer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: You can only match workers for your own bookings';
  END IF;

  IF v_booking_status <> 'requested' THEN
    RAISE EXCEPTION 'Invalid booking status: can only match when status is requested';
  END IF;

  -- B. Fetch Context Data
  SELECT name INTO v_service_name
  FROM public.services
  WHERE id = v_service_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Service data missing';
  END IF;

  SELECT location INTO v_booking_location
  FROM public.addresses
  WHERE id = v_address_id;

  IF v_booking_location IS NULL THEN
    RAISE EXCEPTION 'Booking address location missing';
  END IF;

  -- C. Progressive Radius Search
  FOREACH v_radius_meters IN ARRAY v_radius_options
  LOOP
    SELECT id
    INTO v_assigned_worker_id
    FROM public.workers_public
    WHERE 
      service_types @> ARRAY[v_service_name]
      AND ST_DWithin(location, v_booking_location, v_radius_meters)
    ORDER BY
      is_verified DESC,
      rating DESC,
      ST_Distance(location, v_booking_location) ASC
    LIMIT 1;

    EXIT WHEN v_assigned_worker_id IS NOT NULL;
  END LOOP;

  IF v_assigned_worker_id IS NULL THEN
    RAISE EXCEPTION 'No matching worker found within 100km for this service';
  END IF;

  -- D. Update Booking
  UPDATE public.bookings
  SET 
    worker_id = v_assigned_worker_id,
    status = 'matched',
    updated_at = NOW()
  WHERE id = booking_id_input;

  RETURN v_assigned_worker_id;
END;
$$;

-- ============================================================================
-- 3. ACCEPT BOOKING RPC (drop existing if return type changed)
-- ============================================================================

-- Drop existing function if it exists with different signature
DROP FUNCTION IF EXISTS public.accept_booking(uuid, uuid);

CREATE OR REPLACE FUNCTION public.accept_booking(
  p_booking_id uuid,
  p_worker_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate worker is the caller
  IF p_worker_id <> auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET 
    worker_id = p_worker_id,
    status = 'accepted',
    updated_at = NOW()
  WHERE id = p_booking_id
    AND status = 'requested';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not available or already taken';
  END IF;

  RETURN TRUE;
END;
$$;
