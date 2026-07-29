-- MarginBusiness Leads v5.2.6 — complete schema repair
-- Safe to run repeatedly in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.ml_sender_profiles (
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  provider text not null default 'brevo',
  from_name text,
  from_email text,
  reply_to text,
  opt_out_email text,
  compliance_line text not null default 'soft',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.ml_provider_profiles (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  from_name text,
  from_email text,
  reply_to text,
  opt_out_email text,
  compliance_line text not null default 'soft',
  domain text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, provider)
);

create table if not exists public.ml_send_jobs (
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id text,
  campaign_name text,
  provider text not null default 'brevo',
  sequence_step text not null default 'email1',
  status text not null default 'draft',
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.ml_send_job_items (
  id bigserial primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  job_id text not null references public.ml_send_jobs(id) on delete cascade,
  campaign_id text,
  lead_id text,
  recipient text,
  subject text,
  status text not null default 'ready',
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ml_provider_profiles_workspace_idx on public.ml_provider_profiles(workspace_id, provider);
create index if not exists ml_send_jobs_workspace_idx on public.ml_send_jobs(workspace_id, created_at desc);
create index if not exists ml_send_job_items_job_idx on public.ml_send_job_items(workspace_id, job_id);

alter table public.ml_sender_profiles enable row level security;
alter table public.ml_provider_profiles enable row level security;
alter table public.ml_send_jobs enable row level security;
alter table public.ml_send_job_items enable row level security;

do $$
declare tbl text; pol record;
begin
  foreach tbl in array array['ml_sender_profiles','ml_provider_profiles','ml_send_jobs','ml_send_job_items']
  loop
    for pol in select policyname from pg_policies where schemaname='public' and tablename=tbl
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

create policy ml_sender_profiles_select on public.ml_sender_profiles
for select to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_sender_profiles.workspace_id and wm.user_id=auth.uid())
);
create policy ml_sender_profiles_insert on public.ml_sender_profiles
for insert to authenticated with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_sender_profiles.workspace_id and wm.user_id=auth.uid())
);
create policy ml_sender_profiles_update on public.ml_sender_profiles
for update to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_sender_profiles.workspace_id and wm.user_id=auth.uid())
) with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_sender_profiles.workspace_id and wm.user_id=auth.uid())
);
create policy ml_sender_profiles_delete on public.ml_sender_profiles
for delete to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_sender_profiles.workspace_id and wm.user_id=auth.uid())
);

create policy ml_provider_profiles_select on public.ml_provider_profiles
for select to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_provider_profiles.workspace_id and wm.user_id=auth.uid())
);
create policy ml_provider_profiles_insert on public.ml_provider_profiles
for insert to authenticated with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_provider_profiles.workspace_id and wm.user_id=auth.uid())
);
create policy ml_provider_profiles_update on public.ml_provider_profiles
for update to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_provider_profiles.workspace_id and wm.user_id=auth.uid())
) with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_provider_profiles.workspace_id and wm.user_id=auth.uid())
);
create policy ml_provider_profiles_delete on public.ml_provider_profiles
for delete to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_provider_profiles.workspace_id and wm.user_id=auth.uid())
);

create policy ml_send_jobs_select on public.ml_send_jobs
for select to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_jobs.workspace_id and wm.user_id=auth.uid())
);
create policy ml_send_jobs_insert on public.ml_send_jobs
for insert to authenticated with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_jobs.workspace_id and wm.user_id=auth.uid())
);
create policy ml_send_jobs_update on public.ml_send_jobs
for update to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_jobs.workspace_id and wm.user_id=auth.uid())
) with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_jobs.workspace_id and wm.user_id=auth.uid())
);
create policy ml_send_jobs_delete on public.ml_send_jobs
for delete to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_jobs.workspace_id and wm.user_id=auth.uid())
);

create policy ml_send_job_items_select on public.ml_send_job_items
for select to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_job_items.workspace_id and wm.user_id=auth.uid())
);
create policy ml_send_job_items_insert on public.ml_send_job_items
for insert to authenticated with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_job_items.workspace_id and wm.user_id=auth.uid())
);
create policy ml_send_job_items_update on public.ml_send_job_items
for update to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_job_items.workspace_id and wm.user_id=auth.uid())
) with check (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_job_items.workspace_id and wm.user_id=auth.uid())
);
create policy ml_send_job_items_delete on public.ml_send_job_items
for delete to authenticated using (
  exists (select 1 from public.workspace_members wm where wm.workspace_id=ml_send_job_items.workspace_id and wm.user_id=auth.uid())
);

grant select,insert,update,delete on public.ml_sender_profiles to authenticated;
grant select,insert,update,delete on public.ml_provider_profiles to authenticated;
grant select,insert,update,delete on public.ml_send_jobs to authenticated;
grant select,insert,update,delete on public.ml_send_job_items to authenticated;
grant usage,select on sequence public.ml_send_job_items_id_seq to authenticated;

notify pgrst, 'reload schema';

select
  to_regclass('public.ml_sender_profiles') as sender_profiles,
  to_regclass('public.ml_provider_profiles') as provider_profiles,
  to_regclass('public.ml_send_jobs') as send_jobs,
  to_regclass('public.ml_send_job_items') as send_job_items;
