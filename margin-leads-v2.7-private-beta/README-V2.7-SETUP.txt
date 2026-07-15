MARGIN LEADS v2.7 — PRIVATE BETA SETUP

1. Deploy this complete folder to the existing Vercel project.
2. Keep existing variables:
   BRIDGE_TOKEN
   DEFAULT_PROVIDER=brevo
   BREVO_API_KEY
3. Create a Supabase project and add these Vercel variables:
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY  (server only; sensitive)
   BETA_ADMIN_TOKEN           (long random secret; sensitive)
4. Optional AI beta:
   OPENAI_API_KEY             (sensitive)
   OPENAI_MODEL=gpt-4.1-mini  (or another supported model)
5. In Supabase SQL Editor, run supabase-schema.sql.
6. In Supabase Authentication > URL Configuration:
   Site URL: https://app.marginleads.online
   Redirect URL: https://app.marginleads.online/**
7. In Vercel Domains, add app.marginleads.online and follow the DNS record shown by Vercel.
8. Invite users from Supabase Authentication > Users > Invite user for the first beta. The included /api/invite-user endpoint is ready for a future owner console.
9. Redeploy after environment-variable changes.

IMPORTANT
- The existing v2.6 browser campaigns/leads remain compatible in the same browser.
- v2.7 adds real authentication now. The SQL schema prepares server workspaces, campaigns, leads and logs.
- A controlled migration from local browser storage to Supabase should be completed before inviting multiple external customer workspaces.
- Never expose SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, BREVO_API_KEY, or BETA_ADMIN_TOKEN in index.html.
