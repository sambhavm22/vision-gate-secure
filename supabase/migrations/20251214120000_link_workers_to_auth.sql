-- Migration: Link workers_public to auth.users
-- Generated: 2025-12-14

-- 1. Add user_id column to workers_public if it doesn't exist
alter table public.workers_public 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Add Unique constraint (One public worker profile per user)
alter table public.workers_public
add constraint workers_public_user_id_key unique (user_id);

-- 3. Update RLS policies for workers_public
-- Allow users to insert their own profile
create policy "Users can insert own worker profile"
on public.workers_public
for insert
with check (auth.uid() = user_id);

-- Allow users to update their own profile
create policy "Users can update own worker profile"
on public.workers_public
for update
using (auth.uid() = user_id);

-- (Existing select policy is likely "All authenticated users can view", which is fine)
