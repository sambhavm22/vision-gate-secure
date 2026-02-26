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
  is_location_estimated boolean
)
language plpgsql
security definer
as $$
declare
  v_worker_services text[];
  v_worker_location geography(Point, 4326);
  v_worker_zip text;
  v_is_estimated boolean := false;
  v_search_radius_meters int := 50000; -- Default 50km radius for performance
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
    -- PERFORMANCE OPTIMIZATION: Use GIST index for spatial filtering
    and (
      v_worker_location is null 
      or a.location is null
      or ST_DWithin(a.location, v_worker_location, v_search_radius_meters)
    )
  order by
    b.scheduled_at asc,
    dist_meters asc nulls last;
end;
$$;
