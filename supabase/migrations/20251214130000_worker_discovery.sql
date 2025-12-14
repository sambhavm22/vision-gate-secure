-- Migration: Worker Discovery & Booking Acceptance
-- Generated: 2025-12-14

-- 1. RPC: Get available bookings for a worker
create or replace function public.get_market_bookings(
  p_worker_id uuid
)
returns table (
  id uuid,
  service_name text,
  base_price numeric,
  address_line1 text,
  city text,
  dist_meters float,
  scheduled_at timestamptz,
  duration_minutes int,
  total_amount numeric,
  notes text,
  status text
)
language plpgsql
security definer
as $$
declare
  v_worker_loc geography(Point, 4326);
  v_worker_services text[];
begin
  -- Get worker details
  select location, service_types 
  into v_worker_loc, v_worker_services
  from public.workers_public
  where id = p_worker_id;

  if not found then
    raise exception 'Worker profile not found';
  end if;

  return query
  select
    b.id,
    s.name as service_name,
    s.base_price,
    a.address_line1,
    a.city,
    st_distance(a.location, v_worker_loc) as dist_meters,
    b.scheduled_at,
    b.duration_minutes,
    b.total_amount,
    b.notes,
    b.status
  from public.bookings b
  join public.services s on b.service_id = s.id
  join public.addresses a on b.address_id = a.id
  where b.status = 'requested'
    and s.name = ANY(v_worker_services)
    and st_dwithin(a.location, v_worker_loc, 25000) -- Hardcoded 25km for now, or use worker preference
  order by b.scheduled_at asc;
end;
$$;


-- 2. RPC: Accept a booking
create or replace function public.accept_booking(
  p_booking_id uuid,
  p_worker_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_booking_record record;
  v_conflict_count int;
begin
  -- Lock the booking row
  select * into v_booking_record
  from public.bookings
  where id = p_booking_id
  for update; -- Lock to prevent race conditions

  if not found then
    raise exception 'Booking not found';
  end if;

  if v_booking_record.status <> 'requested' then
    raise exception 'Booking is no longer available';
  end if;

  -- Check for double booking (overlapping time)
  -- Logic: New booking starts at S1, ends at E1. 
  -- Warning: Simple overlap check.
  select count(*)
  into v_conflict_count
  from public.bookings
  where worker_id = p_worker_id
    and status in ('matched', 'accepted', 'en_route', 'in_progress')
    and (
      (scheduled_at, scheduled_at + (duration_minutes || ' minutes')::interval)
      OVERLAPS
      (v_booking_record.scheduled_at, v_booking_record.scheduled_at + (v_booking_record.duration_minutes || ' minutes')::interval)
    );

  if v_conflict_count > 0 then
    raise exception 'You have a conflicting booking at this time';
  end if;

  -- Update booking
  update public.bookings
  set 
    worker_id = p_worker_id,
    status = 'accepted', -- Or 'matched' if you want user confirmation? User req said "Worker accepts -> Assigned". 
                        -- Status flow usually: requested -> matched (by system) OR accepted (by worker picking).
                        -- Let's use 'accepted' to show worker commitment.
    updated_at = now()
  where id = p_booking_id;

  return true;
end;
$$;
