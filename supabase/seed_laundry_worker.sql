-- SQL Script to Add a Laundry Worker
-- Run this in your Supabase SQL Editor

-- 1. Ensure the 'Laundry' service exists
INSERT INTO public.services (name, base_price, is_active)
VALUES ('Laundry', 20.00, true)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert the Worker
-- IMPORTANT: You must replace 'YOUR_EXISTING_USER_ID_HERE' with a valid UUID from auth.users.
-- If you want to create a new user, you should do that via the Authentication tab or an 'INSERT INTO auth.users' (if you have permissions).

-- Replace the UUID below:
WITH user_ref AS (
    -- SELECT '00000000-0000-0000-0000-000000000000'::uuid as id -- UNCOMMENT AND REPLACE THIS
    -- OR, to pick a random existing user who isn't a worker yet (be careful!):
    SELECT id FROM auth.users 
    WHERE id NOT IN (SELECT id FROM public.workers_public)
    LIMIT 1
)
INSERT INTO public.workers_public (
    id,
    full_name,
    bio,
    hourly_rate,
    service_types,
    location,
    is_verified,
    rating
)
SELECT 
    id,
    'Laundry Pro',
    'Expert in laundry, dry cleaning, and fabric care.',
    25.00,
    ARRAY['Laundry'],
    ST_SetSRID(ST_MakePoint(77.2090, 28.6139), 4326), -- Approximate location (New Delhi)
    true,
    5.0
FROM user_ref;
