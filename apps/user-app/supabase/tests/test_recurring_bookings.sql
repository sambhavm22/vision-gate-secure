-- ==========================================
-- RECURRING BOOKING LOGIC VALIDATION SCRIPT
-- ==========================================
-- Run this in Supabase SQL Editor

BEGIN;

DO $$
DECLARE
  v_customer_id uuid := '4c13a0b8-1430-4089-97b5-c2d7bcb0b937';
  v_address_id uuid := gen_random_uuid();
  v_worker_id uuid;
  v_service_id bigint;
  v_recurring_id uuid;
  v_rrule text := 'FREQ=WEEKLY;BYDAY=MO,WE,FR';
  v_check_status text;
  v_check_rrule text;
BEGIN
  RAISE NOTICE 'Starting Recurring Booking Validation...';

  -- 1. SETUP DATA
  -- Create Service
  INSERT INTO public.services (name, base_price, is_active)
  VALUES ('Test Recurring Service', 50.00, true)
  RETURNING id INTO v_service_id;

  -- Create Address (User ownership mocked via customer_id)
  INSERT INTO public.addresses (id, customer_id, address_line1, location)
  VALUES (
    v_address_id, 
    v_customer_id, 
    'Recurring Test Addr', 
    st_point(0,0)::geography
  );
  
  -- Create Worker
  INSERT INTO public.workers_public (full_name, service_types, rating, is_verified)
  VALUES ('Recurring Worker', ARRAY['Test Recurring Service'], 4.8, true)
  RETURNING id INTO v_worker_id;

  -- 2. CREATE RECURRING BOOKING
  -- Mock Auth
  PERFORM set_config('request.jwt.claim.sub', v_customer_id::text, true);

  v_recurring_id := public.create_recurring_booking(
     p_user_id => v_customer_id,
     p_service_ids => ARRAY[v_service_id],
     p_address_id => v_address_id,
     p_preferred_worker_id => v_worker_id,
     p_rrule => v_rrule,
     p_timezone => 'UTC',
     p_start_date => (now() + interval '1 day')::date,
     p_end_date => (now() + interval '30 days')::date,
     p_max_occurrences => null,
     p_preferred_time_start => '09:00:00',
     p_preferred_time_end => '11:00:00',
     p_duration_minutes => 120,
     p_notes => 'Test notes'
  );

  RAISE NOTICE 'Created Recurring Booking ID: %', v_recurring_id;

  -- 3. VERIFY CREATION
  SELECT status, rrule INTO v_check_status, v_check_rrule
  FROM public.recurring_bookings
  WHERE id = v_recurring_id;

  IF v_check_status IS NULL THEN
     RAISE EXCEPTION 'Booking not found in DB';
  END IF;

  IF v_check_rrule <> v_rrule THEN
     RAISE EXCEPTION 'RRULE mismatch. Expected %, Got %', v_rrule, v_check_rrule;
  END IF;

  -- 4. TEST PAUSE
  PERFORM public.manage_recurring_booking(v_recurring_id, 'pause');
  
  SELECT status INTO v_check_status FROM public.recurring_bookings WHERE id = v_recurring_id;
  IF v_check_status <> 'paused' THEN
     RAISE EXCEPTION 'Failed to pause. Status: %', v_check_status;
  END IF;
  RAISE NOTICE 'Pause Test: PASSED';

  -- 5. TEST RESUME
  PERFORM public.manage_recurring_booking(v_recurring_id, 'resume');
  
  SELECT status INTO v_check_status FROM public.recurring_bookings WHERE id = v_recurring_id;
  IF v_check_status <> 'active' THEN
     RAISE EXCEPTION 'Failed to resume. Status: %', v_check_status;
  END IF;
  RAISE NOTICE 'Resume Test: PASSED';

  -- 6. TEST CANCEL
  PERFORM public.manage_recurring_booking(v_recurring_id, 'cancel');
  
  SELECT status INTO v_check_status FROM public.recurring_bookings WHERE id = v_recurring_id;
  IF v_check_status <> 'cancelled' THEN
     RAISE EXCEPTION 'Failed to cancel. Status: %', v_check_status;
  END IF;
  RAISE NOTICE 'Cancel Test: PASSED';

  RAISE NOTICE 'ALL TESTS PASSED SUCCESSFULLY.';

END $$;

ROLLBACK;
