-- Rename/Create unique function to avoid overloading ambiguity
create or replace function public.get_market_bookings_v2(
  p_worker_id uuid default null,
  p_limit int default 50,
  p_radius_km int default 100
)
returns table (
  id uuid,
  booking_id uuid,  -- Alias for frontend consistency
  service_name text,
  status text,
  total_amount numeric,
  scheduled_at timestamptz,
  duration_minutes int,
  address_line1 text,
  city text,
  dist_meters float,
  notes text,
  is_location_estimated boolean
)
language plpgsql
security definer
as $$
declare
  v_worker_services text[];
  v_worker_location geography(Point, 4326);
  v_radius_meters int;
begin
  v_radius_meters := p_radius_km * 1000;
  
  -- Get worker details
  select wp.service_types, wp.location 
  into v_worker_services, v_worker_location
  from public.workers_public wp
  where wp.id = p_worker_id;

  return query
  select
    b.id,
    b.id as booking_id,
    s.name as service_name,
    b.status,
    b.total_amount,
    b.scheduled_at,
    b.duration_minutes,
    a.address_line1,
    a.city,
    -- Calculate distance if worker has location
    case 
      when v_worker_location is not null and a.location is not null then
        st_distance(a.location, v_worker_location)
      else
        null
    end as dist_meters,
    b.notes,
    (a.location is null) as is_location_estimated
  from
    public.bookings b
    inner join public.services s on b.service_id = s.id
    left join public.addresses a on b.address_id = a.id
  where
    b.status = 'requested'
    and s.name = any(v_worker_services)
    and b.scheduled_at > (now() - interval '24 hours')
    -- Distance pre-filter (only if worker has location)
    and (
      v_worker_location is null 
      or a.location is null 
      or st_dwithin(a.location, v_worker_location, v_radius_meters)
    )
  order by
    b.scheduled_at asc,
    dist_meters asc nulls last
  limit p_limit;
end;
$$;
