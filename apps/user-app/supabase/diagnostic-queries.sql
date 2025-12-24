-- Quick Diagnostic Queries for User Registration Issues
-- Run these in Supabase SQL Editor to diagnose the problem

-- ============================================
-- 1. CHECK ALL USERS (including unconfirmed)
-- ============================================
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  raw_user_meta_data,
  CASE 
    WHEN email_confirmed_at IS NULL THEN '❌ Unconfirmed'
    ELSE '✅ Confirmed'
  END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 2. CHECK PROFILES TABLE
-- ============================================
SELECT 
  p.*,
  u.email,
  u.email_confirmed_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC
LIMIT 20;

-- ============================================
-- 3. CHECK IF TRIGGER EXISTS
-- ============================================
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================
-- 4. CHECK IF FUNCTION EXISTS
-- ============================================
SELECT 
  routine_name, 
  routine_type,
  routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user'
AND routine_schema = 'public';

-- ============================================
-- 5. FIND ORPHANED USERS (users without profiles)
-- ============================================
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  CASE 
    WHEN p.id IS NULL THEN '❌ No Profile'
    ELSE '✅ Has Profile'
  END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email_confirmed_at IS NOT NULL
ORDER BY u.created_at DESC;

-- ============================================
-- 6. COUNT USERS BY STATUS
-- ============================================
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- ============================================
-- 7. MANUALLY CREATE PROFILE FOR ORPHANED USER
-- (Replace USER_ID with actual user ID)
-- ============================================
-- INSERT INTO public.profiles (id, full_name)
-- SELECT 
--   id,
--   COALESCE(raw_user_meta_data->>'full_name', email)
-- FROM auth.users
-- WHERE id = 'USER_ID_HERE'
-- ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 8. FIX ALL ORPHANED USERS AT ONCE
-- (Creates profiles for all confirmed users without profiles)
-- ============================================
-- INSERT INTO public.profiles (id, full_name)
-- SELECT 
--   u.id,
--   COALESCE(u.raw_user_meta_data->>'full_name', u.email)
-- FROM auth.users u
-- LEFT JOIN public.profiles p ON u.id = p.id
-- WHERE p.id IS NULL
-- AND u.email_confirmed_at IS NOT NULL
-- ON CONFLICT (id) DO NOTHING;
