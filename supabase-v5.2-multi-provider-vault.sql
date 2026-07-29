-- MarginBusiness Leads v5.2 — multi-provider sender profiles
-- Run once after the v5.1 migration. Repeat-safe.

create table if not exists public.ml_provider_profiles(
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
  primary key(workspace_id,provider)
);

alter table public.ml_provider_profiles enable row level security;

drop policy if exists "workspace members read ml_provider_profiles" on public.ml_provider_profiles;
drop policy if exists "workspace members insert ml_provider_profiles" on public.ml_provider_profiles;
drop policy if exists "workspace members update ml_provider_profiles" on public.ml_provider_profiles;
drop policy if exists "workspace members delete ml_provider_profiles" on public.ml_provider_profiles;

create policy "workspace members read ml_provider_profiles"
on public.ml_provider_profiles for select to authenticated
using(public.is_workspace_member(workspace_id));

create policy "workspace members insert ml_provider_profiles"
on public.ml_provider_profiles for insert to authenticated
with check(public.is_workspace_member(workspace_id));

create policy "workspace members update ml_provider_profiles"
on public.ml_provider_profiles for update to authenticated
using(public.is_workspace_member(workspace_id))
with check(public.is_workspace_member(workspace_id));

create policy "workspace members delete ml_provider_profiles"
on public.ml_provider_profiles for delete to authenticated
using(public.is_workspace_member(workspace_id));
