# taxfold.app

Guides for keeping receipts and tracking expenses, published by Taxfold. Astro static site on Cloudflare Pages.

- **Build + test:** `npm test` (builds `dist/`, then checks the sitemap, trust pages and lexical caps in `tests/site.test.ts`).
- **Guides:** one Markdown file per guide in `src/content/guides/`, served at `/guides/<file-name>/`. At most 8 new guide URLs per calendar month (a test enforces it); no locale directories.
- **Dates:** sitemap `lastmod` and each page's "Last updated" come from the git commit date of the page's source (`src/lib/lastmod.mjs`), so builds need full history.
- **Publishing:** every change is a pull request; main is protected and needs one approval. A push to main builds and deploys to the Cloudflare Pages project `taxfold-app` (`.github/workflows/site.yml`, secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`).
