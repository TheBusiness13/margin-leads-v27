MarginBusiness Leads v5.2.4

Fixes:
- Missing ml_send_jobs or ml_send_job_items no longer breaks workspace loading.
- The permanent send-job audit layer now degrades gracefully if its tables are missing.
- Clears stale workspace error banners after a successful authenticated load.
- Includes a repeat-safe SQL patch to create the missing send audit tables.

Recommended:
Run supabase-v5.2.4-send-audit-tables.sql in Supabase SQL Editor.
