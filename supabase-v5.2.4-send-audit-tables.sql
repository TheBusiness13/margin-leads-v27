-- MarginBusiness Leads v5.2.4 — send audit tables patch
-- Run once in Supabase SQL Editor. Repeat-safe.

create table if not exists public.ml_send_jobs(
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id text references public.ml_campaigns(id) on delete set null,
  campaign_name text,
  provider text not null,
  sequence_step text not null,
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

create table if not exists public.ml_send_job_items(
  id bigserial primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  job_id text not null references public.ml_send_jobs(id) on delete cascade,
  campaign_id text references public.ml_campaigns(id) on delete set null,
  lead_id text references public.ml_leads(id) on delete set null,
  recipient text,
  subject text,
  status text not null default 'ready',
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists ml_send_jobs_workspace_idx
on public.ml_send_jobs(workspace_id, created_at desc);

create index if not exists ml_send_job_items_job_idx
on public.ml_send_job_items(workspace_id, job_id);

alter table public.ml_send_jobs enable row level security;
alter table public.ml_send_job_items enable row level security;

drop policy if exists "workspace members read ml_send_jobs" on public.ml_send_jobs;
drop policy if exists "workspace members insert ml_send_jobs" on public.ml_send_jobs;
drop policy if exists "workspace members update ml_send_jobs" on public.ml_send_jobs;
drop policy if exists "workspace members delete ml_send_jobs" on public.ml_send_jobs;

create policy "workspace members read ml_send_jobs"
on public.ml_send_jobs for select to authenticated
using(public.is_workspace_member(workspace_id));

create policy "workspace members insert ml_send_jobs"
on public.ml_send_jobs for insert to authenticated
with check(public.is_workspace_member(workspace_id));

create policy "workspace members update ml_send_jobs"
on public.ml_send_jobs for update to authenticated
using(public.is_workspace_member(workspace_id))
with check(public.is_workspace_member(workspace_id));

create policy "workspace members delete ml_send_jobs"
on public.ml_send_jobs for delete to authenticated
using(public.is_workspace_member(workspace_id));

drop policy if exists "workspace members read ml_send_job_items" on public.ml_send_job_items;
drop policy if exists "workspace members insert ml_send_job_items" on public.ml_send_job_items;
drop policy if exists "workspace members update ml_send_job_items" on public.ml_send_job_items;
drop policy if exists "workspace members delete ml_send_job_items" on public.ml_send_job_items;

create policy "workspace members read ml_send_job_items"
on public.ml_send_job_items for select to authenticated
using(public.is_workspace_member(workspace_id));

create policy "workspace members insert ml_send_job_items"
on public.ml_send_job_items for insert to authenticated
with check(public.is_workspace_member(workspace_id));

create policy "workspace members update ml_send_job_items"
on public.ml_send_job_items for update to authenticated
using(public.is_workspace_member(workspace_id))
with check(public.is_workspace_member(workspace_id));

create policy "workspace members delete ml_send_job_items"
on public.ml_send_job_items for delete to authenticated
using(public.is_workspace_member(workspace_id));
