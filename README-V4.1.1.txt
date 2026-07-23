MarginBusiness Leads v4.1.1

Fixes:
1. Admin Console remains completely hidden for non-platform-admin accounts.
2. Platform admin verification is shared by /api/workspace and /api/admin.
3. Optional PLATFORM_ADMIN_EMAILS Vercel variable is supported as a safe fallback.
4. Existing platform_admins database authorization remains supported.

Recommended:
- In Vercel add PLATFORM_ADMIN_EMAILS=omar@marginbusiness.com
  or run the included Supabase SQL to register the Google-login user ID.
- Deploy as Preview and test with one admin and one normal customer account.
