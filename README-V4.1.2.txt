MarginBusiness Leads v4.1.2

Fixes:
- Admin Console now opens as a modal and no longer depends on hidden dashboard sections.
- Non-admin accounts still cannot see or access it.
- Every customer workspace must connect its own Brevo/SendGrid/Resend/Mailgun account.
- Customer workspaces can no longer use the global MarginBusiness provider key.
- Provider API keys are encrypted server-side with AES-256-GCM.

Required setup:
1. Run supabase-v4.1.2-private-provider-connections.sql in Supabase.
2. Add PROVIDER_ENCRYPTION_KEY in Vercel. Use a strong random value of at least 32 characters.
3. Redeploy.
4. Each customer opens Integrations & Settings and saves their own provider API key.

The global Vercel Brevo key is used only as an admin fallback for a registered platform-admin account.
