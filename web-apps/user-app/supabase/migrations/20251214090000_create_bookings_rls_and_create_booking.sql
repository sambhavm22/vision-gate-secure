-- Migration: Create strict RLS for bookings and a secure create_booking RPC
-- Generated: 2025-12-14

-- Ensure RLS is enabled
alter table if exists public.bookings enable row level security;

-- Drop existing policies if present and recreate stricter ones
drop policy if exists "Users see own bookings" on public.bookings;
create policy "Users see own bookings"
  on public.bookings
  for select
  using (auth.uid() = customer_id);

drop policy if exists "Users insert own bookings" on public.bookings;
create policy "Users insert own bookings"
  on public.bookings
  for insert
  with check (
    auth.uid() = customer_id
    and exists (select 1 from public.services s where s.id = service_id and s.is_active = true)
    and exists (select 1 from public.addresses a where a.id = address_id and a.customer_id = auth.uid())
    and scheduled_at > now()
    and duration_minutes > 0
  );

-- Optional: restrict updates to cancellations by owner (keep existing behavior)
drop policy if exists "Users can cancel requested bookings" on public.bookings;
create policy "Users can cancel requested bookings"
  on public.bookings
  for update
  using (auth.uid() = customer_id and status = 'requested')
  with check (status in ('requested','cancelled'));

-- Create a secure RPC to validate and insert bookings atomically
create or replace function public.create_booking(
  service_id_input bigint,
  address_id_input uuid,
  scheduled_at_input timestamptz,
  duration_minutes_input int,
  notes_input text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_customer uuid := auth.uid();
  v_price numeric;
  v_total numeric;
  new_booking_id uuid;
begin
  if v_customer is null then
    raise exception 'Authentication required';
  end if;

  if duration_minutes_input is null or duration_minutes_input <= 0 then
    raise exception 'Invalid duration_minutes: must be > 0';
  end if;

  if scheduled_at_input <= now() then
    raise exception 'Invalid scheduled_at: must be in the future';
  end if;

  select base_price into v_price
    from public.services
   where id = service_id_input
     and is_active = true
   limit 1;
  if not found then
    raise exception 'Invalid service_id';
  end if;

  perform 1
    from public.addresses a
   where a.id = address_id_input
     and a.customer_id = v_customer;
  if not found then
    raise exception 'Invalid address_id or address not owned by user';
  end if;

  v_total := round((v_price * (duration_minutes_input::numeric / 60.0))::numeric, 2);

  insert into public.bookings (
    customer_id,
    service_id,
    address_id,
    scheduled_at,
    duration_minutes,
    notes,
    worker_id,
    total_amount,
    status
  ) values (
    v_customer,
    service_id_input,
    address_id_input,
    scheduled_at_input,
    duration_minutes_input,
    notes_input,
    null,
    v_total,
    'requested'
  )
  returning id into new_booking_id;

  return new_booking_id;
end;
$$;

-- End migration
