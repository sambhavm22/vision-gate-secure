-- ==========================================
-- WORKER MATCHING LOGIC VALIDATION SCRIPT
-- ==========================================
-- Run this entire script in the Supabase SQL Editor.
-- It works by:
-- 1. Cleaning up previous test data
-- 2. Creating a test scenario (Service, Workers, User, Address, Booking)
-- 3. Mocking a logged-in user
-- 4. Running the matching function
-- 5. Verifying the result

BEGIN;

-- ---------------------------------------------------------
-- 1. SETUP: Variables & Cleanup
-- ---------------------------------------------------------
DO $$
DECLARE
  v_customer_id uuid := '00000000-0000-0000-0000-000000000001';
  v_address_id uuid := '00000000-0000-0000-0000-000000000002';
  v_service_id bigint;
  v_booking_id uuid;
  v_worker_verified_id uuid;
  v_worker_closer_unverified_id uuid;
  v_matched_id uuid;
BEGIN
  RAISE NOTICE 'Starting Validation...';

  -- Cleanup old test data (optional, be careful in prod)
  DELETE FROM public.bookings WHERE customer_id = v_customer_id;
  DELETE FROM public.addresses WHERE id = v_address_id;
  DELETE FROM public.workers_public WHERE full_name LIKE 'TEST_WORKER_%';
  
  -- Create Test Service
  INSERT INTO public.services (name, base_price, is_active)
  VALUES ('Test Cleaning Service', 100.00, true)
  RETURNING id INTO v_service_id;

  -- Create Test Profile for Customer (if profiles table exists and is needed due to FK)
  -- Note: We assume profiles exists from schema. If validation fails on FK, ensure this ID exists in auth.users or profiles.
  -- For this test, we skip inserting to auth.users (cant do from here usually) but insert to profiles if needed.
  -- INSERT INTO public.profiles (id, full_name) VALUES (v_customer_id, 'Test Customer') ON CONFLICT (id) DO NOTHING;

  -- Create Test Address (Location: Mumbai Central)
  INSERT INTO public.addresses (id, customer_id, address_line1, location)
  VALUES (
    v_address_id, 
    v_customer_id, 
    'Test Address, Mumbai', 
    st_point(72.8777, 19.0760)::geography
  );

  -- ---------------------------------------------------------
  -- 2. CREATE WORKERS
  -- ---------------------------------------------------------
  
  -- Worker A: VERIFIED, High Rating, but 5km away (Winner because Verified > Distance)
  INSERT INTO public.workers_public (full_name, service_types, rating, is_verified, location)
  VALUES (
    'TEST_WORKER_A_VERIFIED', 
    ARRAY['Test Cleaning Service'], 
    5.0, 
    true, -- Verified
    st_point(72.8777, 19.1200)::geography -- ~5km away (North)
  ) RETURNING id INTO v_worker_verified_id;
  
  -- Worker B: UNVERIFIED, High Rating, Very Close (Loser because Unverified)
  INSERT INTO public.workers_public (full_name, service_types, rating, is_verified, location)
  VALUES (
    'TEST_WORKER_B_CLOSE_UNVERIFIED', 
    ARRAY['Test Cleaning Service'], 
    5.0, 
    false, -- Unverified
    st_point(72.8777, 19.0770)::geography -- ~100m away
  ) RETURNING id INTO v_worker_closer_unverified_id;

  RAISE NOTICE 'Created Workers: Verified=% (Far), Unverified=% (Close)', v_worker_verified_id, v_worker_closer_unverified_id;

  -- ---------------------------------------------------------
  -- 3. CREATE BOOKING
  -- ---------------------------------------------------------
  INSERT INTO public.bookings (customer_id, service_id, address_id, status, scheduled_at, duration_minutes)
  VALUES (
    v_customer_id,
    v_service_id,
    v_address_id,
    'requested',
    now() + interval '1 day',
    60
  ) RETURNING id INTO v_booking_id;
  
  RAISE NOTICE 'Created Booking: %', v_booking_id;

  -- ---------------------------------------------------------
  -- 4. EXECUTE MATCHING (MOCKING AUTH)
  -- ---------------------------------------------------------
  
  -- Mock the request.jwt.claim.sub to match our test customer
  -- This tricks auth.uid() into returning our ID
  PERFORM set_config('request.jwt.claim.sub', v_customer_id::text, true);
  
  -- Call the function
  v_matched_id := public.match_worker_for_booking(v_booking_id);
  
  -- ---------------------------------------------------------
  -- 5. VERIFY RESULT
  -- ---------------------------------------------------------
  IF v_matched_id = v_worker_verified_id THEN
    RAISE NOTICE 'SUCCESS: Correct worker matched (Verified worker preferred over closer unverified one).';
  ELSE
    RAISE EXCEPTION 'FAILURE: Incorrect match. Expected %, Got %', v_worker_verified_id, v_matched_id;
  END IF;

END $$;

ROLLBACK; -- Rollback everything so we don't pollute the DB
-- Change ROLLBACK to COMMIT if you want to keep the test data to inspect manually.
