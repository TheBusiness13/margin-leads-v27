MarginBusiness Leads v3.1.1 — Workspace Isolation Hotfix

Fixes a critical tenant-isolation bug in v3.1. Campaigns, leads, lead states, provider settings, metrics, journals, onboarding state and batch state are now namespaced by verified Supabase workspace ID. Legacy browser data is migrated only into the platform administrator workspace. Customer accounts never inherit old global browser data.

This hotfix provides strict same-browser workspace isolation. Full cross-device persistence of campaigns and leads still requires moving those records into Supabase tables in a later release.
