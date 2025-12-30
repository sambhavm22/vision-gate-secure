-- Function to create a recurring booking
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

    -- Create recurring booking
    INSERT INTO public.recurring_bookings (
        user_id, service_ids, address_id, preferred_worker_id,
        rrule, timezone, start_date, end_date, max_occurrences,
        preferred_time_start, preferred_time_end, duration_minutes,
        price_snapshot, total_per_occurrence, notes,
        stripe_customer_id, stripe_payment_method_id
    ) VALUES (
        p_user_id, p_service_ids, p_address_id, p_preferred_worker_id,
        p_rrule, p_timezone, p_start_date, p_end_date, p_max_occurrences,
        p_preferred_time_start, p_preferred_time_end, p_duration_minutes,
        v_price_snapshot, round(v_total, 2), p_notes,
        p_stripe_customer_id, p_stripe_payment_method_id
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

-- Function to pause/resume/cancel recurring booking
CREATE OR REPLACE FUNCTION public.manage_recurring_booking(
    p_recurring_id UUID,
    p_action TEXT  -- 'pause', 'resume', 'cancel'
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_current_status TEXT;
    v_new_status TEXT;
BEGIN
    -- Get current state
    SELECT user_id, status::text INTO v_user_id, v_current_status
    FROM public.recurring_bookings
    WHERE id = p_recurring_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recurring booking not found';
    END IF;

    IF v_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    -- Determine new status
    CASE p_action
        WHEN 'pause' THEN
            IF v_current_status <> 'active' THEN
                RAISE EXCEPTION 'Can only pause active bookings';
            END IF;
            v_new_status := 'paused';
        WHEN 'resume' THEN
            IF v_current_status <> 'paused' THEN
                RAISE EXCEPTION 'Can only resume paused bookings';
            END IF;
            v_new_status := 'active';
        WHEN 'cancel' THEN
            IF v_current_status IN ('cancelled', 'completed') THEN
                RAISE EXCEPTION 'Booking already cancelled/completed';
            END IF;
            v_new_status := 'cancelled';
        ELSE
            RAISE EXCEPTION 'Invalid action: %', p_action;
    END CASE;

    -- Update status
    UPDATE public.recurring_bookings
    SET status = v_new_status::public.recurring_booking_status,
        updated_at = now()
    WHERE id = p_recurring_id;

    -- Audit log
    INSERT INTO public.recurring_booking_audit_log (
        recurring_booking_id, action, old_state, new_state, created_by
    ) VALUES (
        p_recurring_id, p_action,
        jsonb_build_object('status', v_current_status),
        jsonb_build_object('status', v_new_status),
        auth.uid()
    );

    RETURN TRUE;
END;
$$;

-- Function to skip a specific occurrence
CREATE OR REPLACE FUNCTION public.skip_occurrence(
    p_occurrence_id UUID,
    p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_recurring_id UUID;
    v_user_id UUID;
    v_status TEXT;
BEGIN
    -- Get occurrence details
    SELECT o.recurring_booking_id, o.status::text, rb.user_id
    INTO v_recurring_id, v_status, v_user_id
    FROM public.recurring_booking_occurrences o
    JOIN public.recurring_bookings rb ON rb.id = o.recurring_booking_id
    WHERE o.id = p_occurrence_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Occurrence not found';
    END IF;

    IF v_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_status NOT IN ('pending', 'scheduled') THEN
        RAISE EXCEPTION 'Cannot skip occurrence in status: %', v_status;
    END IF;

    -- Update status
    UPDATE public.recurring_booking_occurrences
    SET status = 'skipped',
        failure_reason = p_reason,
        updated_at = now()
    WHERE id = p_occurrence_id;

    -- Audit log
    INSERT INTO public.recurring_booking_audit_log (
        recurring_booking_id, occurrence_id, action, new_state, created_by
    ) VALUES (
        v_recurring_id, p_occurrence_id, 'skipped',
        jsonb_build_object('reason', p_reason),
        auth.uid()
    );

    RETURN TRUE;
END;
$$;
