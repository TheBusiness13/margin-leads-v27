-- MarginBusiness Leads v4.1.2
-- Private per-workspace provider credentials.
-- Run once in Supabase > SQL Editor.

create table if not exists public.workspace_mail_providers (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null,
  secret_cipher text not null,
  settings jsonb not null default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, provider)
);

alter table public.workspace_mail_providers enable row level security;

-- No client-side SELECT/INSERT/UPDATE policies are created.
-- Credentials are accessed only by Vercel server functions using the service-role key.

revoke all on public.workspace_mail_providers from anon, authenticated;
