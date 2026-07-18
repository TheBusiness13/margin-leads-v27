-- MarginBusiness Leads v3.2 — true workspace data isolation and trial bootstrap
-- Repeat-safe. Does not delete existing customer data.
create table if not exists public.workspace_app_state(
  workspace_id uuid primary key references public.workspaces(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.workspace_app_state enable row level security;
drop policy if exists "workspace members read app state" on public.workspace_app_state;
drop policy if exists "workspace members insert app state" on public.workspace_app_state;
drop policy if exists "workspace members update app state" on public.workspace_app_state;
create policy "workspace members read app state" on public.workspace_app_state for select to authenticated using(public.is_workspace_member(workspace_id));
create policy "workspace members insert app state" on public.workspace_app_state for insert to authenticated with check(public.is_workspace_member(workspace_id));
create policy "workspace members update app state" on public.workspace_app_state for update to authenticated using(public.is_workspace_member(workspace_id)) with check(public.is_workspace_member(workspace_id));

-- Repair missing trial subscriptions and balances without changing existing paid/admin balances.
insert into public.workspace_subscriptions(workspace_id,plan_code,status,trial_ends_at)
select id,'trial','trialing',coalesce(trial_ends_at,now()+interval '14 days') from public.workspaces
on conflict(workspace_id) do nothing;
insert into public.workspace_credit_balances(workspace_id,balance,lifetime_granted,period_granted,period_ends_at)
select id,10,10,10,coalesce(trial_ends_at,now()+interval '14 days') from public.workspaces
on conflict(workspace_id) do nothing;

create index if not exists workspace_app_state_updated_idx on public.workspace_app_state(updated_at desc);
