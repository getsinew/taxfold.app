# FRONTEND.md — implementation contract for taxfold.app

**What** the site looks like is in `docs/DESIGN.md`. This file says **how** it is built in this repo (Astro 7.4.5 +
Tailwind 4.3.4, static, Cloudflare Pages) and how a change is verified before its PR is ready for the operator.

- 🔴 **Precedence:** `docs/DESIGN.md` § Brand tokens is the SSOT. A token change edits DESIGN.md and `src/styles/global.css`
  **in the same PR**. A token found anywhere else is a bug.
- 🔴 **A PR that changes anything visible is not ready** until the § 5 verification evidence is in its body.

---

## 1. How tokens map into Tailwind 4

There is one file, `src/styles/global.css`, in three layers:

1. **Raw values** live as `--tf-*` custom properties on `:root`. They are flipped under `@media (prefers-color-scheme: dark)`.
2. **`@theme inline`** maps each Tailwind theme variable to a raw value. With `inline`, utilities emit `var(--tf-…)`
   directly, so `bg-paper` follows the media query with no `dark:` variant. Support: the `inline` theme option is parsed
   in `node_modules/tailwindcss/dist/lib.js` @4.3.4.
3. **Defaults are reset** (`--color-*: initial`, `--text-*: initial`, `--font-*: initial`, `--radius-*: initial`,
   `--breakpoint-*: initial`), so `text-gray-500`, `text-4xl` or `xl:` can't be used and only DESIGN.md tokens exist.
   `--spacing` keeps Tailwind's default `0.25rem` (= the 4px unit, `node_modules/tailwindcss/theme.css:325`).

The canonical top of `global.css` (copy as-is; values = DESIGN.md § Brand tokens):

```css
@import "tailwindcss";

:root {
  color-scheme: light dark;
  --tf-paper: #f6f4ee;  --tf-surface: #fcfbf8;  --tf-sunk: #edeae1;
  --tf-ink: #1c1f1d;    --tf-ink-soft: #4a514c;
  --tf-rule: #d9d5ca;   --tf-rule-strong: #7f7b70;
  --tf-brand: #1f5135;  --tf-brand-strong: #163d28;  --tf-brand-soft: #e3ece5;  --tf-on-brand: #f6f4ee;
  --tf-success: #1d6b3a; --tf-success-soft: #e3ece5;
  --tf-warning: #8a5300; --tf-warning-soft: #f6ead6;
  --tf-danger: #b3261e;  --tf-danger-soft: #f7e3e1;
  --tf-info: #1f5a8a;    --tf-info-soft: #e2ebf3;
  --tf-shadow-raised: 0 1px 2px rgb(28 31 29 / 0.08), 0 2px 8px rgb(28 31 29 / 0.06);
}

@media (prefers-color-scheme: dark) {
  :root {
    --tf-paper: #131614;  --tf-surface: #1b1f1c;  --tf-sunk: #0e100f;
    --tf-ink: #e7e5dd;    --tf-ink-soft: #a9b0aa;
    --tf-rule: #2e342f;   --tf-rule-strong: #6c736d;
    --tf-brand: #8fcaa4;  --tf-brand-strong: #b0dcc0;  --tf-brand-soft: #1f3328;  --tf-on-brand: #0f1a13;
    --tf-success: #7fd19b; --tf-success-soft: #1f3328;
    --tf-warning: #e8b467; --tf-warning-soft: #33281a;
    --tf-danger: #f2a097;  --tf-danger-soft: #3a2220;
    --tf-info: #8ec1ea;    --tf-info-soft: #1a2a38;
    --tf-shadow-raised: none;
  }
}

@theme inline {
  --color-*: initial;
  --color-paper: var(--tf-paper);   --color-surface: var(--tf-surface);   --color-sunk: var(--tf-sunk);
  --color-ink: var(--tf-ink);       --color-ink-soft: var(--tf-ink-soft);
  --color-rule: var(--tf-rule);     --color-rule-strong: var(--tf-rule-strong);
  --color-brand: var(--tf-brand);   --color-brand-strong: var(--tf-brand-strong);
  --color-brand-soft: var(--tf-brand-soft);  --color-on-brand: var(--tf-on-brand);
  --color-success: var(--tf-success); --color-success-soft: var(--tf-success-soft);
  --color-warning: var(--tf-warning); --color-warning-soft: var(--tf-warning-soft);
  --color-danger: var(--tf-danger);   --color-danger-soft: var(--tf-danger-soft);
  --color-info: var(--tf-info);       --color-info-soft: var(--tf-info-soft);
  --shadow-raised: var(--tf-shadow-raised);
}

@theme {
  --font-*: initial;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-display: ui-serif, "New York", "Iowan Old Style", Georgia, Cambria, "Times New Roman", serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;

  --text-*: initial;
  --text-sm: 0.875rem;    --text-sm--line-height: 1.5;
  --text-base: 1.0625rem; --text-base--line-height: 1.7;
  --text-lg: 1.3125rem;   --text-lg--line-height: 1.35;
  --text-xl: 1.625rem;    --text-xl--line-height: 1.25;
  --text-2xl: 2.0625rem;  --text-2xl--line-height: 1.15;
  --text-3xl: 2.5625rem;  --text-3xl--line-height: 1.1;

  --radius-*: initial;
  --radius-sm: 0.25rem;  --radius-md: 0.5rem;  --radius-lg: 0.75rem;

  --breakpoint-*: initial;
  --breakpoint-md: 48rem;   /* 768 */
  --breakpoint-lg: 64rem;   /* 1024 */

  --container-measure: 42.5rem;  /* ≈68ch prose */
  --container-hero: 40rem;
  --container-rail: 15rem;
  --container-page: 70rem;       /* 1120 */
}
```

- `rounded-full` is a static Tailwind utility and needs no token.
- The 1440 viewport has no breakpoint of its own: the 1120 `page` container just centres (DESIGN.md § 6).
- Base element styles (`html` font and colours, the focus ring, `.prose`) go in `@layer base` / `@layer components` below
  this block, written only with `var(--tf-*)` or theme utilities.
- The focus ring is global: `:focus-visible { outline: 2px solid var(--tf-brand); outline-offset: 2px; border-radius: var(--radius-sm); }`.
  Never use `outline: none` on its own.
- Under `@media (prefers-reduced-motion: reduce)`: `*, *::before, *::after { transition-duration: 0s !important; scroll-behavior: auto !important; }`.
- `@media print`: hide the header nav, TOC and copy buttons, force `ink` on white, and print link URLs after external links.

---

## 2. Dark mode mechanism

- **`prefers-color-scheme` only.** The tokens flip at `:root` (§ 1), so markup never says `dark:`. No toggle, no
  `localStorage`, no head script (DESIGN.md § 7 has the reasons).
- `Base.astro` `<head>` carries:
  `<meta name="color-scheme" content="light dark">`,
  `<meta name="theme-color" content="#f6f4ee" media="(prefers-color-scheme: light)">`,
  `<meta name="theme-color" content="#131614" media="(prefers-color-scheme: dark)">`.
- The only allowed exception is an image that must swap: `<picture><source media="(prefers-color-scheme: dark)" srcset="…">`.

## 3. File conventions

| Path | Holds | Rule |
|---|---|---|
| `src/styles/global.css` | Tokens (§ 1), base and component classes (`.prose`, `.table-scroll`, `.maker-note`, `.callout`, `.pill`, `.btn-primary`, `.card`, `.skip-link`, `.nav-link`) | The **only** place a hex value or raw length lives |
| `src/layouts/Base.astro` | `<head>`, skip link, `<Header>`, `<main id="main" tabindex="-1">`, `<Footer>` | One layout for every page |
| `src/components/*.astro` | `Header`, `Footer`, `LaunchCta`, `StatusPill`, `GuideCard` (`variant`), `Toc`, `MoreGuides` | One component per DESIGN.md § 5 entry. Props as specced there |
| `src/lib/launch-state.mjs` | `LAUNCH_STATE` (`'pre-beta'` today), `TESTFLIGHT_URL`, `APP_STORE_ID`, `APP_STORE_PT` | The single switch for DESIGN.md § 5.6. Pages never test the state themselves; they render `<LaunchCta>` / `<StatusPill>` |
| `src/lib/rehype-taxfold.mjs` | A rehype plugin, no new dependency (hand-written tree walk) | (a) wraps each `table` in `div.table-scroll[role=region][tabindex=0][aria-label]`, (b) gives each `pre` `tabindex=0` + `aria-label="Code"`, (c) wraps the H2 `Where Taxfold fits` and its siblings up to the next H2 or the end in `aside.maker-note[aria-labelledby]` and injects the label |
| `src/scripts/copy-code.ts` | The copy-button enhancement (DESIGN.md § 5.7) | Loaded only by the guide template, through Astro's bundled `<script>`. The page must work fully without it |
| `astro.config.mjs` | `markdown: { syntaxHighlight: false, rehypePlugins: [rehypeTaxfold] }` | `syntaxHighlight: false` is a valid value in Astro 7.4.5 (`node_modules/astro/dist/core/config/schemas/base.d.ts:124`) |
| `src/pages/guides/[slug].astro` | The guide template (DESIGN.md § 4.2) | Its TOC comes from `const { Content, headings } = await render(guide)` (headings typed at `node_modules/astro/dist/content/runtime.d.ts:74`), filtered to `depth === 2` |

**Class and markup rules** (each one gets a test in § 4):

- 🔴 No hex, `rgb()` or `hsl()` outside `global.css`.
- 🔴 No `dark:` variant, no arbitrary values (`text-[0.95rem]`, `p-[13px]`, `bg-[#fff]`), no `bg-white` (the skeleton's
  `bg-white/60` and `focus:bg-white` both go).
- 🔴 One `<h1>` per page. Heading levels never skip.
- 🔴 No `target="_blank"`. No `outline: none` / `outline-0` without the ring.
- 🟢 Every interactive element is a native `a` / `button` / `summary`. No positive `tabindex`.
- 🟢 Dates render through one helper: `Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' })` inside
  `<time datetime={iso}>`. Keep the literal "Last updated" (it is pinned by `tests/site.test.ts`).
- 🟢 Spacing uses only the steps in DESIGN.md § Spacing (`1 2 3 4 5 6 8 10 12 16 20 24`).

## 4. Structural tests to add (in `tests/site.test.ts`, against `dist/`)

| Test | Asserts |
|---|---|
| tokens-only-in-global-css | No `#[0-9a-f]{3,8}\b` or `rgb(` in `src/**/*.astro` / `*.ts` / `*.mjs` (the favicon in `public/` is exempt) |
| no-dark-variant / no-arbitrary-values | No `dark:` and no `-\[` inside `class=` / `class:list` strings in `src/` |
| one-h1 | Every built page has exactly one `<h1` |
| tables-are-focusable-regions | Every `<table` in a guide is inside `div.table-scroll` with `role="region"`, `tabindex="0"` and a non-empty `aria-label` |
| one-maker-note | Every guide has exactly one `aside class="maker-note"`, and it is the last H2 section |
| no-task-list-inputs | No `<input` in any guide page |
| no-blank-targets | No `target="_blank"` anywhere in `dist/` |
| nav-is-four | The main nav has exactly 4 links, plus the wordmark |
| launch-state-single-source | The string "App Store" appears in guide markdown only inside link URLs, never as status prose (this one waits for the writer's content edit, DESIGN.md § 4.2) |

Each test gets an anti-vacuity case: a fixture that **must** fail it (the repo's existing cap test already follows this pattern).

---

## 5. Verification checklist (before the PR is "ready for the operator")

Build and serve the built site. From an OS session, run through the heavy slice
(`scripts/os heavy -- bash -c 'cd ~/dev/taxfold.app && npm test'`), then `npx astro preview --port 4321`.

**Page types (7):** `/`, `/about/`, `/how-we-write/`, `/privacy/`, `/contact/`, `/guides/expense-spreadsheet-export/`
(8-column table + code blocks), `/guides/which-receipts-to-keep-for-taxes/` (wide decision table), and `/no-such-page/` for the 404.
Once a guide has a blockquote, add it as the quote fixture.

### 5.1 Screenshots: 4 widths × 2 schemes × every page type

| Viewport | Size (w×h) |
|---|---|
| Desktop wide | 1440×900 |
| Laptop / tablet landscape | 1024×768 |
| Tablet portrait | 768×1024 |
| Phone | 375×812 |

- **Tool: Chrome DevTools MCP** (the kickoff's named instrument): open the page, set the viewport, emulate
  `prefers-color-scheme` light then dark, take a **full-page** screenshot. *The MCP's exact emulation parameter name is
  unverified (not read).* If it can't emulate the colour scheme, use CDP `Emulation.setEmulatedMedia` with
  `features: [{ name: 'prefers-color-scheme', value: 'dark' }]`.
- **Headless CLI fallback:** `google-chrome --headless=new --window-size=375,812 --screenshot=out.png <url>`. It captures the
  viewport only, not the full page. `--force-dark-mode` for dark is *unverified (training prior)*, so check the dark capture
  by sampling a background pixel (`#131614`) before trusting it.
- Name files `<page>-<width>-<light|dark>.png`. Push them to a `screenshots/<pr-number>` branch, **never main's tree**, and
  embed the raw URLs in the PR body as a grid: rows = page type, columns = width × scheme.
- What to look for, per shot: no horizontal page scroll at 375 (only table and code regions scroll); the header is 2 rows at
  375 and 1 row from 768; the TOC is a `<details>` below 1024 and a rail from 1024; the hero CTA is full width at 375; dark
  mode has no white flash areas, no unreadable `rule`-only boundaries, and the brand reads as links.

### 5.2 Lighthouse: accessibility ≥ 95 and SEO ≥ 95

- Per page type, run both the mobile (default) and desktop presets:
  `npx --yes lighthouse@<pinned> http://localhost:4321/<path> --only-categories=accessibility,seo --preset=desktop --output=json --output-path=./lh-<page>-desktop.json --chrome-flags="--headless=new"`
  (drop `--preset` for mobile). State the pinned version in the PR body.
- Run accessibility once more in dark mode (emulated) on `/` and the spreadsheet guide, as the contrast check for the dark tokens.
- 🟡 **Known localhost caveat:** every page's canonical points to `https://taxfold.app/…`, so a run from `localhost` may mark
  the canonical audit as cross-origin. *Whether Lighthouse fails it is unverified.* If it does, list the audit by name as
  the only exception and re-read SEO on `https://taxfold.app` after merge and deploy. The `*.pages.dev` preview is not a
  substitute: it sends `X-Robots-Tag: noindex` (`public/_headers`), which fails the crawlability audit by design.
- The PR body gets a score table (page × preset × category), plus any failing audit IDs with a reason.

### 5.3 Keyboard walk-through (manual; record it as a checklist in the PR body)

Do this per page type at 1440 and 375, starting from the address bar:

- [ ] The first Tab shows the skip link. Enter lands focus in `main`, and the next Tab goes to the first link in the content.
- [ ] Tab order follows DESIGN.md § 8: wordmark → 4 nav items → byline → TOC → body in reading order → maker note → more
      guides → footer.
- [ ] Every focus stop shows the 2px ring, in light and dark, and nothing hides it.
- [ ] The TOC `<details>` (375) opens and closes with Enter or Space. A TOC link jumps to its heading, and the next Tab
      continues from there.
- [ ] Table and code regions take focus and scroll with ← / →.
- [ ] The copy button works with Enter or Space, and a screen reader announces "Copied" (VoiceOver or Orca spot check).
- [ ] Shift+Tab reverses cleanly. No trap anywhere. Nothing focusable is invisible.
- [ ] At 200% browser zoom on a 1280 window (≈640 CSS px) nothing is clipped. At a 320px viewport, the only horizontal
      scroll is inside tables and code (WCAG 1.4.10).
- [ ] Targets: nav items ≥44px tall, CTA 48px, copy button ≥24px (check in the DevTools box model).
- [ ] With reduced motion on, no transitions run.

### 5.4 Token-contrast regression

When any token changes, recompute the DESIGN.md contrast column (WCAG relative luminance) and update it in the same PR.
Every text pair stays ≥4.5:1 and every meaningful boundary or focus ring ≥3:1.

---

## 6. Gaps from the skeleton (what implementing DESIGN.md changes)

- 🟡 `Base.astro`: nav items become Guides / About / Privacy / Contact, the skip link drops `focus:bg-white`, `main` gets
  `tabindex="-1"`, plus the color-scheme and theme-color metas.
- 🟡 `index.astro`: drop `bg-white/60` and `text-[0.95rem]`. Use the proof ledger, `<LaunchCta>`, and `GuideCard`.
- 🟡 `global.css`: replace the 6-colour `@theme` with § 1 (the seed values are kept, so nothing shifts in light mode
  except the added tokens).
- 🟡 `guides/[slug].astro`: byline per DESIGN.md § 4.2, the TOC, the "More guides" list, and the copy script.
- 🟡 Content (writer, separate PR): the `Where Taxfold fits` heading in 2 guides, and launch-status sentences out of all 5.
