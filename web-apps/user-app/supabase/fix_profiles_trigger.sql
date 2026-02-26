-- =============================================================================
-- Fix: Missing Profiles Trigger & Backfill
-- =============================================================================

-- 0. Ensure profiles table has necessary columns
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists full_name text;

-- 1. Create a Trigger Function to handle new user signups
--    This function is called automatically whenever a new user is inserted into auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- 2. Create the Trigger on auth.users
--    Ensures all FUTURE users get a profile row
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Backfill Script for EXISTING Users
--    Run this to fix the "Key is not present in table profiles" error for your current user
insert into public.profiles (id, email, full_name, avatar_url)
select 
  id, 
  email, 
  raw_user_meta_data->>'full_name', -- Assumes metadata has this field
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) 
do update set 
  email = excluded.email,
  full_name = coalesce(public.profiles.full_name, excluded.full_name),
  avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);

-- =============================================================================
-- Verification:
-- After running this, try: select * from profiles; 
-- You should see your user row there.
-- =============================================================================
