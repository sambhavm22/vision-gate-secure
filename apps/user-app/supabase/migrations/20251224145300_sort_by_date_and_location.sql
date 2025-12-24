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
  notes text
)
language plpgsql
security definer
as $$
declare
  v_worker_services text[];
  v_worker_location geography(Point, 4326);
begin
  -- Get worker services and location
  select wp.service_types, wp.location into v_worker_services, v_worker_location
  from public.workers_public wp
  where wp.id = p_worker_id;

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
    -- Calculate distance if worker has location
    case 
      when v_worker_location is not null and a.location is not null then
        st_distance(a.location, v_worker_location)
      else
        null
    end as dist_meters,
    b.notes
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
