-- Function to sync lat/lng to location column
create or replace function public.sync_address_location()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.lat is not null and new.lng is not null then
    new.location := st_setsrid(st_makepoint(new.lng, new.lat), 4326)::geography;
  end if;
  return new;
end;
$$;

-- Create trigger
drop trigger if exists sync_address_location_trigger on public.addresses;
create trigger sync_address_location_trigger
before insert or update on public.addresses
for each row
execute function public.sync_address_location();

-- Backfill lat/lng from location for existing rows
-- Using safe cast to geometry to get coordinates
update public.addresses
set 
  lat = st_y(location::geometry),
  lng = st_x(location::geometry)
where location is not null and (lat is null or lng is null);
