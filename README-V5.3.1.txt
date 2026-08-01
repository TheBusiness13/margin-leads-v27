MarginBusiness Leads v5.3.1 — AI Ark Admin-Only Test Mode

Changes:
- AI Ark menu and page are visible only to platform administrators.
- /api/ai-ark enforces platform-admin access server-side.
- Non-admin direct attempts return HTTP 403 ADMIN_ONLY.
- AI Ark automatic connection check runs only for platform administrators.
- No Supabase migration is required if Omar is already registered in public.platform_admins.

Deployment:
1. Upload the contents of this folder to the repository root.
2. Keep AI_ARK_API_KEY in Vercel environment variables.
3. Redeploy without build cache.
4. Log in as omar@marginbusiness.com and confirm AI Ark Lead Finder appears.
5. Log in with a test customer account and confirm the AI Ark menu is absent.
