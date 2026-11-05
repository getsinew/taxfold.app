# taxfold.app

Guides for keeping receipts and tracking expenses, published by Taxfold. Astro static site on Cloudflare Pages.

- **Build + test:** `npm test` (builds `dist/`, then checks the sitemap, trust pages and lexical caps in `tests/site.test.ts`).
- **Guides:** one Markdown file per guide in `src/content/guides/`, served at `/guides/<file-name>/`. At most 8 new guide URLs per calendar month (a test enforces it); no locale directories.
- **Dates:** sitemap `lastmod` and each page's "Last updated" come from the git commit date of the page's source (`src/lib/lastmod.mjs`), so builds need full history.
- **Publishing:** every change is a pull request; main is protected (one approval, required check `test`, squash-only). A push to main builds, tests and deploys to the Cloudflare Pages project `taxfold-app`, then checks the live page for the Web Analytics beacon (`.github/workflows/site.yml`).
- **Secrets:** `CLOUDFLARE_API_TOKEN` (Account → Cloudflare Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID` live in the GitHub environment `production`, which only `main` may deploy to. Never add them as repository secrets: a pull request from a branch of this repo receives repository secrets and could deploy before review.
- **One-time Cloudflare setup (done 2026-11-05):** Pages project `taxfold-app` (Direct Upload, production branch `main`), custom domain `taxfold.app` attached, apex `CNAME taxfold.app → taxfold-app.pages.dev` (proxied), Web Analytics enabled on the zone.
