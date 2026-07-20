MARGINBUSINESS LEADS v3.0 — PRIVATE BETA LAUNCH CANDIDATE

CORE UPGRADES
- OpenAI Responses API connection for structured lead intelligence.
- Premium customer login with Supabase email/password, password recovery and optional Google sign-in.
- Workspace-aware role enforcement and secure server-side sending.
- Exact connection diagnostics instead of the generic workspace warning.
- Safe, repeatable Supabase migration that can be run more than once.
- AI usage logging and workspace-level beta controls.
- Flexible sequence logic from v2.8.1 remains preserved.

VERCEL ENVIRONMENT VARIABLES
Required:
  SUPABASE_URL
  SUPABASE_ANON_KEY
  SUPABASE_SERVICE_ROLE_KEY
  BREVO_API_KEY
  OPENAI_API_KEY

Recommended:
  OPENAI_MODEL=gpt-5-mini
  DEFAULT_PROVIDER=brevo
  DAILY_LIMIT=100
  MAX_PER_REQUEST=100
  ALLOW_LEGACY_BRIDGE_TOKEN=false
  APP_URL=https://app.marginleads.online

DEPLOYMENT
1. Keep v2.9 as the rollback deployment.
2. Upload the ROOT FILES into the current active GitHub app folder.
3. Open the existing api folder in GitHub and upload the contents of this package's api folder.
4. Open the existing assets folder and upload its contents.
5. Commit: Release v3.0.0 — private beta launch candidate
6. Run supabase-v3.0-safe-migration.sql in Supabase SQL Editor. It is repeat-safe.
7. In Supabase Auth, keep email/password enabled. Enable Google only if you want the Google button active.
8. In Supabase URL Configuration, add the production app URL and / as an allowed redirect.
9. Test: login, password recovery, workspace connection, AI status, one AI analysis, bridge test, one email.

SECURITY
- OPENAI_API_KEY, BREVO_API_KEY and SUPABASE_SERVICE_ROLE_KEY must stay server-side in Vercel.
- Never commit environment variables or .env files to GitHub.
- The browser receives only the Supabase publishable/anon key, which is protected by RLS.
