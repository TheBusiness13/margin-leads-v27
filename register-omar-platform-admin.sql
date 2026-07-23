-- MarginBusiness Leads v4.1.1
-- Register the current Omar account as a platform administrator.
-- Run in Supabase > SQL Editor.

insert into public.platform_admins(user_id)
select au.id
from auth.users au
where lower(au.email) = lower('omar@marginbusiness.com')
on conflict (user_id) do nothing;

-- Confirm the registered account.
select pa.user_id, au.email, pa.created_at
from public.platform_admins pa
join auth.users au on au.id = pa.user_id
order by pa.created_at desc;
