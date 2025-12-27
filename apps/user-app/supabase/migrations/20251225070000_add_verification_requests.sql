-- Create verification_requests table
create table if not exists public.verification_requests (
  id uuid default gen_random_uuid() primary key,
  worker_id uuid references public.workers_public(id) not null,
  provider text not null default 'digilocker',
  status text not null check (status in ('pending', 'verified', 'failed')),
  request_id text,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.verification_requests enable row level security;

-- Policies for verification_requests

-- Workers can view their own requests
create policy "Workers can view own verification requests"
  on public.verification_requests for select
  using (auth.uid() = worker_id);

-- Workers can insert their own requests (usually triggered via Edge Function, but if client does it directly)
create policy "Workers can insert own verification requests"
  on public.verification_requests for insert
  with check (auth.uid() = worker_id);
  
-- Only service role can update status (usually) but for now let's allow read only for users
-- or maybe the Edge Function uses service_role key to update.
-- If Edge Function uses service role, we don't need update policy for authenticated users.


