MARGINBUSINESS LEADS v5.3.2 — CLEAN VERCEL PACKAGE

UPLOAD THESE ITEMS DIRECTLY TO THE GITHUB REPOSITORY ROOT:

api/
assets/
index.html
package.json
vercel.json
BUILD-VERSION.txt

IMPORTANT:
1. Do not upload the outer ZIP as a file into GitHub.
2. Do not place these files inside another version folder.
3. GitHub root must directly show api, assets, index.html, package.json and vercel.json.
4. In Vercel, Root Directory must remain ./
5. Keep AI_ARK_API_KEY only in Vercel Environment Variables.
6. AI Ark is hidden from normal users and the API returns 403 for non-admin accounts.
7. No new Supabase SQL is required for this package.

RECOMMENDED DEPLOYMENT:
- Remove/replace the current root api folder, assets folder, index.html, package.json and vercel.json with this package.
- Commit changes.
- Let Vercel deploy automatically.
- Do not use the old build cache when manually redeploying.
