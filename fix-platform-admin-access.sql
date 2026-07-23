-- MarginBusiness Leads v4.1.1 admin correction
-- Run in Supabase > SQL Editor.
-- This removes accidental platform-admin access from every account except Omar.

do $$
declare
  v_admin_id uuid;
begin
  select id into v_admin_id
  from auth.users
  where lower(email)=lower('omar@marginbusiness.com')
  order by created_at desc
  limit 1;

  if v_admin_id is null then
    raise exception 'No Supabase auth user found for omar@marginbusiness.com';
  end if;

  delete from public.platform_admins
  where user_id <> v_admin_id;

  insert into public.platform_admins(user_id)
  values(v_admin_id)
  on conflict (user_id) do nothing;
end $$;

select pa.user_id, au.email, pa.created_at
from public.platform_admins pa
join auth.users au on au.id=pa.user_id;
