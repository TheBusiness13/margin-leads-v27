MARGINBUSINESS LEAD RADAR OS v2.6 — PREMIUM CONNECTED

WHAT IS NEW
- Premium connected activity center
- System diagnostics for frontend, Vercel API, bridge token, provider and database
- Persistent send/failure/provider logs when Postgres is connected
- Server-side daily send counters when Postgres is connected
- Exportable activity log
- Existing browser campaigns and lead storage remain compatible

DEPLOY
1. Upload this complete folder or ZIP to the existing Vercel project.
2. Keep your existing variables: BRIDGE_TOKEN, DEFAULT_PROVIDER, BREVO_API_KEY.
3. Redeploy.
4. Open Lead Radar and run Connected Activity Center > Run diagnostics.

ENABLE PERSISTENT LOGS
1. In Vercel, open Storage or Marketplace.
2. Add a Postgres provider (for example Neon through the Vercel Marketplace).
3. Connect it to this project. The integration should inject POSTGRES_URL or DATABASE_URL.
4. Redeploy once.
5. Lead Radar creates its own lead_radar_events table automatically on first use.

WITHOUT POSTGRES
Sending still works and the existing browser-side history remains available. The diagnostics panel will clearly show 'Local fallback'.

SECURITY
Never place API keys in index.html. Keep BRIDGE_TOKEN and provider keys in Vercel Environment Variables.

CORRECTED BUILD: 2026-07-14 — all active version identifiers are v2.6.0.
