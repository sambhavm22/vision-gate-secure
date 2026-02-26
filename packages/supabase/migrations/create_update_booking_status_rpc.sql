-- Migration: create_update_booking_status_rpc
-- Creates an RPC for workers to update booking status with validation

-- RPC: update_booking_status
-- Validates worker owns the booking and enforces status transitions
CREATE OR REPLACE FUNCTION public.update_booking_status(
    p_booking_id UUID,
    p_worker_id UUID,
    p_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_status TEXT;
    v_booking_worker_id UUID;
BEGIN
    -- Lock the booking row
    SELECT status, worker_id INTO v_current_status, v_booking_worker_id
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    -- Validate worker owns the booking
    IF v_booking_worker_id IS NULL OR v_booking_worker_id != p_worker_id THEN
        RAISE EXCEPTION 'You are not assigned to this booking';
    END IF;

    -- Validate status transitions
    IF p_status = 'en_route' AND v_current_status NOT IN ('accepted', 'assigned') THEN
        RAISE EXCEPTION 'Cannot mark as arrived from status: %', v_current_status;
    END IF;

    IF p_status = 'in_progress' AND v_current_status != 'en_route' THEN
        RAISE EXCEPTION 'Cannot start work from status: %', v_current_status;
    END IF;

    IF p_status = 'completed' AND v_current_status != 'in_progress' THEN
        RAISE EXCEPTION 'Cannot complete from status: %', v_current_status;
    END IF;

    -- Validate the status value
    IF p_status NOT IN ('en_route', 'in_progress', 'completed') THEN
        RAISE EXCEPTION 'Invalid status: %. Allowed: en_route, in_progress, completed', p_status;
    END IF;

    -- Update booking status
    UPDATE bookings
    SET
        status = p_status,
        updated_at = NOW()
    WHERE id = p_booking_id;

END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.update_booking_status(UUID, UUID, TEXT) TO authenticated;
