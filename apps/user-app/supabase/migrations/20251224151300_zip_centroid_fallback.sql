-- 1. Drop the existing function first to allow return type change
drop function if exists public.get_market_bookings(uuid);

-- 2. Add postal_code to workers_public if not exists
alter table public.workers_public add column if not exists postal_code text;

-- 3. Create a lookup table for postal code centroids
create table if not exists public.zip_centroids (
  postal_code text primary key,
  location geography(Point, 4326)
);

-- Enable RLS (public read)
alter table public.zip_centroids enable row level security;
create policy "Public view zip centroids" on public.zip_centroids for select using (true);

-- 4. Seed some sample data (Mumbai area)
insert into public.zip_centroids (postal_code, location) values
  ('400001', st_point(72.8347, 18.9220)::geography), -- Mumbai Fort
  ('400050', st_point(72.8258, 19.0596)::geography), -- Bandra
  ('122001', st_point(77.0266, 28.4595)::geography)  -- Gurgaon (Example)
on conflict (postal_code) do nothing;

-- 5. Recreate the function with the new return type
create or replace function public.get_market_bookings(
  p_worker_id uuid default null
)
returns table (
  id uuid,
  service_name text,
  status text,
  total_amount numeric,
  scheduled_at timestamptz,
  duration_minutes int,
  address_line1 text,
  city text,
  dist_meters float,
  notes text,
  is_location_estimated boolean -- New column added here
)
language plpgsql
security definer
as $$
declare
  v_worker_services text[];
  v_worker_location geography(Point, 4326);
  v_worker_zip text;
  v_is_estimated boolean := false;
begin
  -- Get worker details
  select wp.service_types, wp.location, wp.postal_code 
  into v_worker_services, v_worker_location, v_worker_zip
  from public.workers_public wp
  where wp.id = p_worker_id;

  -- Fallback logic
  if v_worker_location is null and v_worker_zip is not null then
    select location into v_worker_location
    from public.zip_centroids
    where postal_code = v_worker_zip;
    
    if v_worker_location is not null then
      v_is_estimated := true;
    end if;
  end if;

  return query
  select
    b.id,
    s.name as service_name,
    b.status,
    b.total_amount,
    b.scheduled_at,
    b.duration_minutes,
    a.address_line1,
    a.city,
    -- Calculate distance
    case 
      when v_worker_location is not null and a.location is not null then
        st_distance(a.location, v_worker_location)
      else
        null
    end as dist_meters,
    b.notes,
    v_is_estimated as is_location_estimated
  from
    public.bookings b
    left join public.services s on b.service_id = s.id
    left join public.addresses a on b.address_id = a.id
  where
    b.status = 'requested'
    and s.name = any(v_worker_services)
    and b.scheduled_at > (now() - interval '24 hours')
  order by
    b.scheduled_at asc,
    dist_meters asc nulls last;
end;
$$;
