MarginBusiness Leads v3.2.0

This release moves workspace application state to Supabase. Each authenticated user receives a personal workspace and the server loads/saves only that workspace state. Fresh customer workspaces begin empty. Existing platform-admin browser data is migrated once into the admin workspace.

Run supabase-v3.2-multitenant-migration.sql before testing. Upload api/state.js and all other changed files.
