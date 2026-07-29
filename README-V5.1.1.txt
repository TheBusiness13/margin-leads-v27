MarginBusiness Leads v5.1.1

Fixes:
- Removes contradictory Brevo status wording.
- Distinguishes a workspace-specific provider key from the platform-admin server fallback.
- Explains that the Brevo API key and PROVIDER_ENCRYPTION_KEY are different values.
- Shows a precise Vercel setup message when the encryption key is missing or shorter than 32 characters.
- Keeps long Brevo API keys valid.
- No new SQL migration is required beyond the v5.1 migration.

Vercel:
PROVIDER_ENCRYPTION_KEY must be at least 32 characters.
Do not change it after provider credentials have been encrypted.
