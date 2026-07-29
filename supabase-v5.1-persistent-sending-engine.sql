-- MarginBusiness Leads v5.1 — persistent campaigns, leads, sequences and send jobs
-- Run once in Supabase SQL Editor. Repeat-safe.

create extension if not exists pgcrypto;

create table if not exists public.ml_campaigns(
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  source text not null default 'Manual',
  profile text not null default 'Standard',
  status text not null default 'active',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ml_leads(
  id text primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id text not null references public.ml_campaigns(id) on delete cascade,
  row_number integer,
  company text,
  contact text,
  role text,
  email text,
  website text,
  linkedin text,
  category text,
  product text,
  revenue numeric not null default 0,
  revenue_raw text,
  source text,
  import_profile text,
  status text not null default 'New',
  sequence_step text not null default 'email1',
  last_sent_step text,
  last_sent_at timestamptz,
  next_send_at timestamptz,
  reply_status text,
  stopped boolean not null default false,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ml_campaign_sequences(
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  campaign_id text primary key references public.ml_campaigns(id) on delete cascade,
  steps jsonb not null default '[
    {"key":"email1","label":"Email 1","delayDays":0},
    {"key":"follow2","label":"Email 2","delayDays":4},
    {"key":"follow3","label":"Email 3","delayDays":5},
    {"key":"follow4","label":"Email 4","delayDays":7}
  ]'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

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

create table if not exists public.ml_sender_profiles(
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

create index if not exists ml_campaigns_workspace_idx on public.ml_campaigns(workspace_id, updated_at desc);
create index if not exists ml_leads_campaign_idx on public.ml_leads(workspace_id, campaign_id, updated_at desc);
create index if not exists ml_leads_due_idx on public.ml_leads(workspace_id, next_send_at) where stopped=false;
create index if not exists ml_send_jobs_workspace_idx on public.ml_send_jobs(workspace_id, created_at desc);
create index if not exists ml_send_job_items_job_idx on public.ml_send_job_items(workspace_id, job_id);

alter table public.ml_campaigns enable row level security;
alter table public.ml_leads enable row level security;
alter table public.ml_campaign_sequences enable row level security;
alter table public.ml_send_jobs enable row level security;
alter table public.ml_send_job_items enable row level security;
alter table public.ml_sender_profiles enable row level security;

do $$
declare t text;
begin
  foreach t in array array['ml_campaigns','ml_leads','ml_campaign_sequences','ml_send_jobs','ml_send_job_items','ml_sender_profiles']
  loop
    execute format('drop policy if exists "workspace members read %I" on public.%I',t,t);
    execute format('drop policy if exists "workspace members insert %I" on public.%I',t,t);
    execute format('drop policy if exists "workspace members update %I" on public.%I',t,t);
    execute format('drop policy if exists "workspace members delete %I" on public.%I',t,t);
    execute format('create policy "workspace members read %I" on public.%I for select to authenticated using(public.is_workspace_member(workspace_id))',t,t);
    execute format('create policy "workspace members insert %I" on public.%I for insert to authenticated with check(public.is_workspace_member(workspace_id))',t,t);
    execute format('create policy "workspace members update %I" on public.%I for update to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id))',t,t);
    execute format('create policy "workspace members delete %I" on public.%I for delete to authenticated using(public.is_workspace_member(workspace_id))',t,t);
  end loop;
end $$;
