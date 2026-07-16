MARGINBUSINESS LEADS v2.9 — SECURE BETA GATEWAY

WHAT CHANGED
- Every mail-bridge request now uses the signed-in Supabase session.
- The server verifies the user, workspace membership, and role before sending.
- Owner, Admin, and Operator can send. Reviewer cannot send.
- Daily limits are calculated per workspace.
- Sends and failures are written to Supabase activity_logs.
- Activity and diagnostics are filtered to the signed-in workspace.
- Flexible sequence mode from v2.8.1 is preserved.
- Legacy BRIDGE_TOKEN remains an optional migration fallback.

DEPLOYMENT
1. Keep v2.8.1 as the rollback deployment.
2. Upload the CONTENTS of this folder into the same active GitHub app folder.
3. Commit: Release v2.9.0 — secure workspace sending
4. Let Vercel deploy automatically.
5. Run supabase-v2.9-migration.sql in Supabase SQL Editor.
6. Confirm Vercel variables:
   SUPABASE_URL
   SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   BREVO_API_KEY
   DEFAULT_PROVIDER=brevo
   DAILY_LIMIT=100 (optional)
   MAX_PER_REQUEST=100 (optional)
   ALLOW_LEGACY_BRIDGE_TOKEN=true during transition (optional)
7. Test Login → Activity → Run diagnostics → Test bridge → one test email.
8. After v2.9 is confirmed stable, set ALLOW_LEGACY_BRIDGE_TOKEN=false and redeploy.

SECURITY NOTE
BREVO_API_KEY and SUPABASE_SERVICE_ROLE_KEY must remain Sensitive Vercel Environment Variables and must never be committed to GitHub.
