MarginBusiness Leads v3.1 — Customer Access, Credits and Admin Foundation

Includes:
- Email/password and Google login through Supabase
- Customer workspace isolation
- Server-enforced Margin Credits for OpenAI actions
- One-time protected trial credits
- Daily AI safety limits
- Platform-admin customer console
- Credit grants and workspace suspension
- Subscription-ready database foundation

Deployment:
1. Upload root files.
2. Upload api folder contents separately.
3. Run supabase-v3.1-access-credits-migration.sql once in Supabase SQL Editor.
4. Add the MarginBusiness owner user to public.platform_admins using the Supabase user UUID.
5. Redeploy Vercel and sign in again.

Important: billing collection is intentionally not live yet. Credits and plans are enforced, while Stripe can be connected after beta validation.
