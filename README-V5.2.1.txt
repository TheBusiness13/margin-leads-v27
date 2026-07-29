MarginBusiness Leads v5.2.1

Fixes:
- Saves the provider API key before saving provider-specific email settings.
- If the v5.2 Supabase migration is missing, the API key can still be stored and the interface shows the exact missing migration.
- Replaces endless Checking/Unknown states with explicit API errors.
- Keeps all v5.2 multi-provider vault functionality.

Required:
Run marginleads-v5.2-multi-provider-vault-migration.sql in Supabase SQL Editor.
