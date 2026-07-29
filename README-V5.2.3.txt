MarginBusiness Leads v5.2.3

Critical fix:
- Adds missing provider status loader.
- Replaces the split provider save flow with one atomic server endpoint.
- The server resolves the authenticated workspace and saves the encrypted API key and sender profile together.
- Removes the runtime path that produced "workspace is not defined".
- No additional SQL migration beyond v5.2.
- Deploy the complete package, including /api/provider-bundle.js.
