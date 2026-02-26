-- Migration: Implement worker matching logic
-- Generated: 2025-12-14

-- 1. Index for performance on service_types array
create index if not exists idx_workers_service_types on public.workers_public using gin (service_types);

-- 2. RPC: Match a worker for a specific booking
create or replace function public.match_worker_for_booking(
  booking_id_input uuid
)
returns uuid
language plpgsql
security definer -- Elevated privileges to update booking and read worker details
as $$
declare
  v_customer_id uuid;
  v_booking_status text;
  v_service_id bigint;
  v_address_id uuid;
  v_service_name text;
  v_booking_location geography(Point, 4326);
  v_assigned_worker_id uuid;
  v_search_radius_meters int := 20000; -- Default 20km radius
begin
  -- A. Validate Booking
  select 
    customer_id, 
    status, 
    service_id, 
    address_id
  into 
    v_customer_id, 
    v_booking_status, 
    v_service_id, 
    v_address_id
  from public.bookings
  where id = booking_id_input;

  if not found then
    raise exception 'Booking not found';
  end if;

  -- Security check: ensure caller owns the booking (or is exempt via security definer, but good to check user intent)
  -- Since this is security definer, auth.uid() is still the caller.
  if v_customer_id <> auth.uid() then
    raise exception 'Unauthorized: You can only match workers for your own bookings';
  end if;

  if v_booking_status <> 'requested' then
    raise exception 'Invalid booking status: can only match when status is requested';
  end if;

  -- B. Fetch Context Data
  -- Get Service Name
  select name into v_service_name
  from public.services
  where id = v_service_id;

  if not found then
    raise exception 'Service data missing';
  end if;

  -- Get Booking Location
  select location into v_booking_location
  from public.addresses
  where id = v_address_id;

  if v_booking_location is null then
    raise exception 'Booking address location missing';
  end if;

  -- C. Find Best Worker
  -- Logic:
  -- 1. Service Type match
  -- 2. Within Radius
  -- 3. Verified first
  -- 4. High Rating
  -- 5. Closest distance
  select id
  into v_assigned_worker_id
  from public.workers_public
  where 
    service_types @> array[v_service_name]
    and st_dwithin(location, v_booking_location, v_search_radius_meters)
  order by
    is_verified desc,       -- Prefer verified
    rating desc,            -- Then highest rating
    st_distance(location, v_booking_location) asc -- Then closest
  limit 1;

  if v_assigned_worker_id is null then
    raise exception 'No matching worker found nearby for this service';
  end if;

  -- D. Update Booking
  update public.bookings
  set 
    worker_id = v_assigned_worker_id,
    status = 'matched',
    updated_at = now()
  where id = booking_id_input;

  return v_assigned_worker_id;
end;
$$;
