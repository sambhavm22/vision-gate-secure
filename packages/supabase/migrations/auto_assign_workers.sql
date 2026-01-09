-- Migration: Auto Assign Workers (Uber-like flow)

-- 1. Schema Updates
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS rejected_worker_ids uuid[] DEFAULT '{}';

-- Safely add new status values if they don't exist
-- Note: If 'status' is a text column with check constraint, we might need to drop/recreate check.
-- Assuming checks or enums. Trying ALTER TYPE first if it's an enum.
DO $$
BEGIN
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'assigned';
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'searching';
EXCEPTION
    WHEN OTHERS THEN NULL; -- Ignore if type doesn't exist or values exist
END $$;

-- If it's a check constraint, we might need to trust the new values are valid or update the constraint.
-- (For this implementation, we assume the Enum or Check allows it, or we simply proceed.
--  If the user uses a syncing tool, the types.ts suggested string union, likely an enum in DB.)

-- 2. RPC: Assign Worker to Booking
CREATE OR REPLACE FUNCTION assign_worker_to_booking(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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

    -- Find nearest available worker
    SELECT id INTO v_worker_id
    FROM workers_public w
    WHERE
        w.is_online = true
        -- Service Type Match (assuming service_types is text[])
        AND v_booking.service_name = ANY(w.service_types)
        -- Not rejected
        AND (v_booking.rejected_worker_ids IS NULL OR NOT (w.id = ANY(v_booking.rejected_worker_ids)))
        -- Distance Check
        AND ST_DWithin(w.location, v_booking.location, v_radius_meters)
        -- No Overlapping Assignments
        -- Check if this worker has any "active" booking that overlaps with the new booking time
        AND NOT EXISTS (
            SELECT 1 FROM bookings b2
            WHERE b2.worker_id = w.id
            AND b2.status IN ('assigned', 'accepted', 'en_route', 'in_progress')
            AND (
                -- Overlap logic: (StartA < EndB) and (EndA > StartB)
                -- New booking: v_booking.scheduled_at, duration
                -- Existing booking: b2.scheduled_at, duration
                (v_booking.scheduled_at < (b2.scheduled_at + (b2.duration_minutes || ' minutes')::interval))
                AND
                ((v_booking.scheduled_at + (v_booking.duration_minutes || ' minutes')::interval) > b2.scheduled_at)
            )
        )
    ORDER BY ST_Distance(w.location, v_booking.location) ASC
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
        INSERT INTO notifications (user_id, title, message, metadata, priority)
        VALUES (
            v_worker_id,
            'New Job Assigned',
            'You have a new job assignment near ' || v_booking.city,
            jsonb_build_object('booking_id', p_booking_id, 'type', 'booking_assigned'),
            'high'
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
$$;

-- 3. Trigger: Auto-Assign on Creation
CREATE OR REPLACE FUNCTION trigger_assign_worker()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only run for status 'requested' or new bookings
    IF NEW.status = 'requested' THEN
        -- We can't run RPC with async side effects easily in Trigger,
        -- but we can call the function directly.
        -- Note: This makes insert slower. For heavy load, consider moving to Edge Function or pg_net.
        PERFORM assign_worker_to_booking(NEW.id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created_assign ON bookings;
CREATE TRIGGER on_booking_created_assign
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_assign_worker();


-- 4. RPC: Reject Booking (Worker Action)
CREATE OR REPLACE FUNCTION reject_booking(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_worker_id uuid;
BEGIN
    v_worker_id := auth.uid();

    -- Verify this worker is currently assigned
    IF NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE id = p_booking_id AND worker_id = v_worker_id AND status = 'assigned'
    ) THEN
        RAISE EXCEPTION 'Not authorized to reject this booking';
    END IF;

    -- Add to rejected list and reset worker_id
    UPDATE bookings
    SET
        rejected_worker_ids = array_append(COALESCE(rejected_worker_ids, '{}'), v_worker_id),
        worker_id = NULL,
        status = 'searching',
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Trigger search for next worker
    PERFORM assign_worker_to_booking(p_booking_id);
END;
$$;


-- 5. RPC: Accept Booking (Updated)
CREATE OR REPLACE FUNCTION accept_booking(p_booking_id uuid, p_worker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_status text;
    v_assigned_worker uuid;
BEGIN
    SELECT status, worker_id INTO v_current_status, v_assigned_worker
    FROM bookings
    WHERE id = p_booking_id;

    IF v_current_status != 'assigned' THEN
        RAISE EXCEPTION 'Booking is no longer available for acceptance (Status: %)', v_current_status;
    END IF;

    IF v_assigned_worker != p_worker_id THEN
         RAISE EXCEPTION 'This booking is assigned to another worker';
    END IF;

    UPDATE bookings
    SET
        status = 'accepted',
        updated_at = NOW()
    WHERE id = p_booking_id;
END;
$$;


-- 6. RPC: Get Market Bookings V2 (Override)
-- Return requested bookings (nearby) AND assigned bookings (for me)
CREATE OR REPLACE FUNCTION get_market_bookings_v2(
    p_worker_id uuid DEFAULT NULL,
    p_limit int DEFAULT 50,
    p_radius_km int DEFAULT 50
)
RETURNS TABLE (
    id uuid,
    booking_id uuid,
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
$$;

