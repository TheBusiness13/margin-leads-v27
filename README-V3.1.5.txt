v3.1.5 — Entitlements and Cache Consistency Fix

- Existing customer-owned workspaces are now checked for a missing trial subscription and credit balance on every workspace bootstrap.
- Missing trial entitlements are created once with 10 protected trial credits.
- Trial grant is recorded in the credit ledger.
- API and login display report v3.1.5 consistently.
- HTML is served with no-cache headers to prevent old login builds appearing intermittently.
