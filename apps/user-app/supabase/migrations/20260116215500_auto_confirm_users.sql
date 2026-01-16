-- Trigger to auto-confirm users so they don't get an email and can login immediately
create or replace function public.handle_new_user_auto_confirm()
returns trigger as $$
begin
  new.email_confirmed_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to be safe
drop trigger if exists on_auth_user_created_auto_confirm on auth.users;

create trigger on_auth_user_created_auto_confirm
  before insert on auth.users
  for each row execute procedure public.handle_new_user_auto_confirm();
