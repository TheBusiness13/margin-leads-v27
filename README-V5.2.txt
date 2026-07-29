MarginBusiness Leads v5.2.0 — Multi-Provider Vault

Required:
1. Run supabase-v5.2-multi-provider-vault.sql after the v5.1 migration.
2. Deploy the complete package.
3. Keep PROVIDER_ENCRYPTION_KEY unchanged.

Fixes:
- Brevo, SendGrid, Resend and Mailgun can all remain connected at the same time.
- Each provider has its own permanent sender name, sender email, reply-to, unsubscribe email and domain.
- Switching providers loads that provider's saved sender profile.
- Blank API-key field keeps the already encrypted key.
- A new key is required only for first connection or replacement.
- Disconnecting one provider does not affect the others.
- Fixes the unsubscribe-email field ID mismatch that prevented it from being saved.
- Provider cards show connection and sender status at a glance.
- API keys remain encrypted server-side and are never returned to the browser.

The v5.1.2 send receipt and verification safeguards remain included.
