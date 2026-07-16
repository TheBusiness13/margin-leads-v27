-- MarginBusiness Leads v2.9 Secure Beta migration
-- Run once in Supabase SQL Editor after the original v2.7 schema.

alter table public.workspaces add column if not exists daily_send_limit integer not null default 100;
alter table public.workspaces add column if not exists monthly_ai_limit integer not null default 250;
alter table public.workspaces add column if not exists sender_name text;
alter table public.workspaces add column if not exists sender_email text;
alter table public.workspaces add column if not exists updated_at timestamptz not null default now();

create index if not exists workspace_members_user_idx on public.workspace_members(user_id);
create index if not exists campaigns_workspace_idx on public.campaigns(workspace_id, updated_at desc);
create index if not exists leads_workspace_idx on public.leads(workspace_id, updated_at desc);
create index if not exists leads_campaign_idx on public.leads(campaign_id);
create index if not exists activity_logs_workspace_created_idx on public.activity_logs(workspace_id, created_at desc);
create index if not exists activity_logs_workspace_event_idx on public.activity_logs(workspace_id, event_type, created_at desc);

create or replace function public.workspace_role(wid uuid)
returns text language sql stable security definer set search_path=public as $$
  select coalesce(
    (select role from public.workspace_members where workspace_id=wid and user_id=auth.uid() limit 1),
    (select 'owner' from public.workspaces where id=wid and owner_id=auth.uid() limit 1)
  )
$$;

-- Allow workspace owners/admins to manage membership while keeping normal users isolated.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='workspace_members' and policyname='owners and admins manage memberships') then
    create policy "owners and admins manage memberships" on public.workspace_members
    for all using (public.workspace_role(workspace_id) in ('owner','admin'))
    with check (public.workspace_role(workspace_id) in ('owner','admin'));
  end if;
end $$;

-- Reviewers can read; operators/admins/owners can write campaigns and leads.
drop policy if exists "members manage campaigns" on public.campaigns;
create policy "members read campaigns" on public.campaigns for select using(public.is_workspace_member(workspace_id));
create policy "operators manage campaigns" on public.campaigns for all
using(public.workspace_role(workspace_id) in ('owner','admin','operator'))
with check(public.workspace_role(workspace_id) in ('owner','admin','operator'));

drop policy if exists "members manage leads" on public.leads;
create policy "members read leads" on public.leads for select using(public.is_workspace_member(workspace_id));
create policy "operators manage leads" on public.leads for all
using(public.workspace_role(workspace_id) in ('owner','admin','operator'))
with check(public.workspace_role(workspace_id) in ('owner','admin','operator'));
