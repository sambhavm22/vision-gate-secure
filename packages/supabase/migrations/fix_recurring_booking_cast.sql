-- Fix recurring booking creation error (42804)
-- Issue: Default value 'active' (text) not automatically casting to ENUM in some contexts.
-- Fix: Explicitly insert status with cast.

CREATE OR REPLACE FUNCTION public.create_recurring_booking(
    p_user_id UUID,
    p_service_ids BIGINT[],
    p_address_id UUID,
    p_preferred_worker_id UUID,
    p_rrule TEXT,
    p_timezone TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_max_occurrences INTEGER,
    p_preferred_time_start TIME,
    p_preferred_time_end TIME,
    p_duration_minutes INTEGER,
    p_notes TEXT DEFAULT NULL,
    p_stripe_customer_id TEXT DEFAULT NULL,
    p_stripe_payment_method_id TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
    v_recurring_id UUID;
    v_price_snapshot JSONB := '{}';
    v_total NUMERIC := 0;
    v_service_id BIGINT;
    v_service_price NUMERIC;
BEGIN
    -- Verify caller is the user
    IF auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Validate address ownership
    IF NOT EXISTS (SELECT 1 FROM public.addresses WHERE id = p_address_id AND customer_id = p_user_id) THEN
        RAISE EXCEPTION 'Invalid address';
    END IF;

    -- Build price snapshot
    FOREACH v_service_id IN ARRAY p_service_ids
    LOOP
        SELECT base_price INTO v_service_price
        FROM public.services
        WHERE id = v_service_id AND is_active = true;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Invalid service_id: %', v_service_id;
        END IF;
        
        v_price_snapshot := v_price_snapshot || jsonb_build_object(v_service_id::text, v_service_price);
        v_total := v_total + (v_service_price * (p_duration_minutes::numeric / 60.0));
    END LOOP;

    -- Create recurring booking with EXPLICIT STATUS CAST
    INSERT INTO public.recurring_bookings (
        user_id, service_ids, address_id, preferred_worker_id,
        rrule, timezone, start_date, end_date, max_occurrences,
        preferred_time_start, preferred_time_end, duration_minutes,
        price_snapshot, total_per_occurrence, notes,
        stripe_customer_id, stripe_payment_method_id,
        status -- Explicit column
    ) VALUES (
        p_user_id, p_service_ids, p_address_id, p_preferred_worker_id,
        p_rrule, p_timezone, p_start_date, p_end_date, p_max_occurrences,
        p_preferred_time_start, p_preferred_time_end, p_duration_minutes,
        v_price_snapshot, round(v_total, 2), p_notes,
        p_stripe_customer_id, p_stripe_payment_method_id,
        'active'::public.recurring_booking_status -- Explicit cast
    ) RETURNING id INTO v_recurring_id;

    -- Log audit
    INSERT INTO public.recurring_booking_audit_log (
        recurring_booking_id, action, new_state, created_by
    ) VALUES (
        v_recurring_id, 'created', 
        jsonb_build_object('status', 'active', 'rrule', p_rrule),
        p_user_id
    );

    RETURN v_recurring_id;
END;
$$;
