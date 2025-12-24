-- Enable PostGIS if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Add location column to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS bookings_location_idx ON bookings USING GIST (location);

-- 2. RPC: Get Market Bookings (Nearby & Requested)
DROP FUNCTION IF EXISTS get_market_bookings(uuid);
DROP FUNCTION IF EXISTS get_market_bookings(uuid, int);
CREATE OR REPLACE FUNCTION get_market_bookings(p_worker_id uuid, p_radius_meters int DEFAULT 20000)
RETURNS TABLE (
    booking_id uuid,
    service_name text,
    status text,
    total_amount numeric,
    scheduled_at timestamptz,
    duration_minutes int,
    address_line1 text,
    city text,
    dist_meters float,
    notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_loc geography(Point, 4326);
BEGIN
    -- Get worker's location
    SELECT wp.location INTO v_worker_loc
    FROM workers_public wp
    WHERE wp.id = p_worker_id;

    IF v_worker_loc IS NULL THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        b.id as booking_id,
        s.name as service_name,
        b.status::text,
        b.total_amount,
        b.scheduled_at,
        b.duration_minutes,
        COALESCE(a.address_line1, 'Location via Map') as address_line1,
        COALESCE(a.city, 'Unknown') as city,
        ST_Distance(b.location, v_worker_loc) as dist_meters,
        b.notes
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    LEFT JOIN addresses a ON b.address_id = a.id
    WHERE b.status = 'requested'
    AND (b.worker_id IS NULL OR b.worker_id = p_worker_id)
    AND ST_DWithin(b.location, v_worker_loc, p_radius_meters)
    ORDER BY b.scheduled_at ASC;
END;
$$;

-- 3. RPC: Accept Booking
DROP FUNCTION IF EXISTS accept_booking(uuid, uuid);
CREATE OR REPLACE FUNCTION accept_booking(p_booking_id uuid, p_worker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_booking_status text;
    v_worker_active_count int;
BEGIN
    -- Check booking status
    SELECT status INTO v_booking_status
    FROM bookings
    WHERE id = p_booking_id;

    IF v_booking_status != 'requested' THEN
        RAISE EXCEPTION 'Booking is no longer available';
    END IF;

    -- Check if worker has overlapping jobs (Simple check: is he currently working?)
    -- Only allow 1 'in_progress' or 'en_route'. 'accepted' might be future.
    -- For MVP: Strict "One Active Job" policy could be:
    -- SELECT count(*) INTO v_worker_active_count FROM bookings WHERE worker_id = p_worker_id AND status IN ('accepted', 'en_route', 'in_progress');
    -- IF v_worker_active_count > 0 THEN RAISE EXCEPTION 'You already have an active job'; END IF;
    
    -- Assign worker
    UPDATE bookings
    SET 
        worker_id = p_worker_id,
        status = 'accepted',
        updated_at = NOW()
    WHERE id = p_booking_id;
END;
$$;

-- 4. RLS Policies
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- User can see their own bookings
DROP POLICY IF EXISTS "Users view own bookings" ON bookings;
CREATE POLICY "Users view own bookings" ON bookings
    FOR SELECT
    USING (auth.uid() = customer_id);

-- Workers can see bookings they are assigned to
DROP POLICY IF EXISTS "Workers view assigned bookings" ON bookings;
CREATE POLICY "Workers view assigned bookings" ON bookings
    FOR SELECT
    USING (auth.uid() = worker_id);

-- Workers can see 'requested' bookings (Public Market)
DROP POLICY IF EXISTS "Workers view requested bookings" ON bookings;
CREATE POLICY "Workers view requested bookings" ON bookings
    FOR SELECT
    USING (status = 'requested' AND worker_id IS NULL);

-- Users can insert bookings
DROP POLICY IF EXISTS "Users insert bookings" ON bookings;
CREATE POLICY "Users insert bookings" ON bookings
    FOR INSERT
    WITH CHECK (auth.uid() = customer_id);
