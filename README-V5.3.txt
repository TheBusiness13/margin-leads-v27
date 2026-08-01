MarginBusiness Leads v5.3.0 — AI Ark Lead Finder

WHAT IS NEW
- New AI Ark Lead Finder page in the left navigation.
- Secure server-side AI Ark API integration through /api/ai-ark.
- People search and company search previews.
- Asynchronous verified-email export using AI Ark track IDs.
- Export status polling and result retrieval.
- Select and import verified prospects directly into the active Margin Leads campaign.
- One Margin Credit is reserved per requested verified-email export record; beta requests are capped at 10.
- The AI Ark API key is never exposed to the browser.

DEPLOYMENT
1. Upload the CONTENTS of this folder to the GitHub repository root.
2. In Vercel add AI_ARK_API_KEY under Settings > Environment Variables > Production.
3. Redeploy without using the old build cache.
4. Open app.marginleads.online and use AI Ark Lead Finder.

IMPORTANT
- Search filters are passed as official AI Ark account/contact JSON. Use the filter structure available in your AI Ark API panel/documentation.
- Search previews do not consume Margin Credits.
- Verified-email exports use existing Margin Credits.
- The existing 10-credit trial bootstrap remains unchanged.
- This release does not change DNS, Supabase campaign tables, or email-provider settings.
- Keep AI_ARK_API_KEY only in Vercel. Never put it in GitHub or index.html.
