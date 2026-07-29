MarginBusiness Leads v5.1.0 — Persistent Sending Engine

This release replaces browser-only business-state authority with normalized Supabase persistence.

Required deployment:
1. Run supabase-v5.1-persistent-sending-engine.sql in Supabase SQL Editor.
2. Upload/deploy the full package to Vercel.
3. Keep PROVIDER_ENCRYPTION_KEY unchanged across deployments.
4. Test with one campaign and one email before opening live access.

Core changes:
- Campaigns and leads are persisted in dedicated Supabase tables.
- Existing legacy campaigns are migrated automatically on first login.
- Provider credentials remain encrypted server-side and no longer depend on browser storage.
- Sender identity is persisted per workspace.
- Every send creates a permanent send job before provider delivery starts.
- Send results and provider message IDs are stored permanently.
- Completed send batches remain visible instead of deleting themselves.
- Campaign deletion is explicit and isolated from provider settings.
- Local storage is now a cache/interface layer, not the source of truth for campaigns and sends.

Validation performed:
- All inline and API JavaScript syntax checked with Node.
- Existing authentication, Admin Console, providers, credits, smart import and workspace isolation preserved.

Operational note:
No software can honestly be guaranteed to have zero defects. This build removes the identified structural failure points and includes permanent records and recovery paths.
