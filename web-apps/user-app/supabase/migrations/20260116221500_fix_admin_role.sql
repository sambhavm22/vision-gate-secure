-- Update the admin user role to super_admin
-- This runs in a separate transaction from the enum update.
do $$
begin
  if exists (select 1 from auth.users where email = 'admin@helperhub.com') then
    update public.profiles
    set role = 'super_admin'
    where id = (select id from auth.users where email = 'admin@helperhub.com');
  end if;
end $$;

-- Create checker function
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role::text in ('admin', 'super_admin')
  );
$$;
