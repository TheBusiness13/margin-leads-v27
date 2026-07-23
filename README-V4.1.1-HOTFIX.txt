MarginBusiness Leads v4.1.1 Admin Hotfix

Fixes:
- Adds the missing Admin Console section that the button was trying to open.
- Opens Settings before displaying the Admin Console.
- Clears admin state whenever a different account loads or signs out.
- Removes email/environment admin fallback; platform_admins is now the only authority.
- Includes SQL to remove accidental admin access from the other account.

Run fix-platform-admin-access.sql in Supabase after deploying.
