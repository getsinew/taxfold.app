# Taxfold design spec (taxfold.app) — and the Taxfold brand source

Status: draft for implementation, 2026-11-05. Owner: design stage (designer employee). The frontend-engineer
implements against this file and `FRONTEND.md`; the iOS app designer inherits the **values** in **§ Brand tokens** (token names follow the app's own conventions).

Inputs read: the site on branch `site-skeleton` (`src/layouts/Base.astro`, `src/styles/global.css`, every page in
`src/pages/`), the five guides on `pillars-batch-1`, the lane decisions (OS `context/products/simple-app-seo-lane-2026-11-04.md`
§ Decisions taken 2026-11), the site kickoff, the funnel doctrine (`indie-ios-lifetime-pricing-and-web-to-app-funnel.md`),
and the designcraft corpus (`context/dev-skills/design/`). The site already had a token seed (`paper`, `ink`, `brand`
`#1f5135`, …). This spec keeps that seed and extends it. It does not replace it.

---

## 1. Competitor teardown

Fetched with `curl` on 2026-11-05. The hero, proof and CTA text below were pulled from the served HTML.

| Site (URL opened) | Hero message | Proof elements | CTA | Brand colour (from CSS) |
|---|---|---|---|---|
| Foreceipt — https://www.foreceipt.com/ | "Never Miss a Tax Deduction Again" | "Thousands of 5 Stars Reviews" + quoted App Store reviews. A "Your Receipt Data, Protected Like a Bank's" block: hosted on AWS, Google-secured sign-in, encrypted in transit | App Store + Google Play badges, "Sign up for free" | not inline |
| Shoeboxed — https://www.shoeboxed.com/ | "The #1 receipt scanner app loved by over a million businesses" | "1M+ users", testimonials, "Always be audit ready", the mail-in "Magic Envelope" service | "Get Started Today", "Schedule a Demo", "Try Shoeboxed Risk-Free" | sky blue `#4aa4cf` + leaf green `#70bb4d` |
| Dext — https://dext.com/en | "Intelligent bookkeeping automation. Get hours back" | "700,000 businesses", "99%+ accuracy", an ROI estimator, a split between business and accounting firm | "Start a free trial", "Book a demo", "Start a 14-day trial" | orange-red `#ff4102` |
| Smart Receipts — https://www.smartreceipts.co/ | "Nobody likes receipts. We deal with them for you" | "Over 500,000 people", App Store ratings. "Your data stays yours": TLS + AES-256, read-only bank connections, "we never sell your data" | "Get started", "Get Pro" ($99.99/yr), "Get Max" | violet `#9b82ff` on zinc `#27272a` |
| SparkReceipt — https://sparkreceipt.com/ | "Would you pay $10.75 a month to make bookkeeping a 10-minute job?" | Founder-signed support ("Ask Joel, one of the founders"), "5 hours vs. 10 minutes a month", bank-line matching | "Get Started", 7-day trial | near-black `#0b0e17` |
| Expensify — https://www.expensify.com/ | *not read*: 403 bot challenge ("One moment while we perform some security checks…") | — | — | — |

**The pattern.** Every competitor proves **scale**: users, businesses, ratings. Each one's security section describes how well
**it guards its own copy** of your receipts. Every CTA **opens an account or starts a trial**. Their colours are SaaS
saturates (orange-red, violet, sky blue) or SaaS black.

**What Taxfold does differently, on purpose:**

- 🟢 **The proof is what's missing, and anyone can check it.** We have no copy to guard, so we don't describe guarding one. The
  landing page lists what the app leaves out (account, server, bank connection, analytics, subscription). The privacy
  page makes the same claim in the words of the App Store label.
- 🟢 **We show no scale we don't have.** No user counts, no "#1", no star ratings, no accuracy percentage. Text recognition
  misreads faint digits, and the copy says so ("you correct any field it gets wrong").
- 🟢 **We earn competence with citations, not superlatives.** "Audit ready" is argued in the guides by quoting IRS
  Publication 583 and Rev. Proc. 97-22, with a link at the point of each claim. The public GitHub review record is the
  provenance proof.
- 🟢 **The CTA opens no account.** Before the beta it is "read the guides". During the beta it is a TestFlight link. After
  approval it is the App Store badge. No waitlist and no email capture, ever (§ 4.1).
- 🟢 **We borrow SparkReceipt's candour, not its personality.** Price stated up front and plain sentences, yes. The byline
  stays an entity ("Taxfold team", lane decision 5), so the candour lives on `/how-we-write/`, not in a founder persona.
- 🟢 **Colour sits where nobody else is:** deep ledger green ink on warm paper. Shoeboxed's green is a bright leaf green at
  a different value and saturation. Nobody in the set uses a warm neutral ground.

---

## 2. Positioning → visual principles

Positioning: *for people who keep receipts for a tax return, Taxfold is the iPhone receipt log that keeps the archive
on the phone, because there is no account, no server and no subscription.* Archetype: **Sage**, with Caregiver second.
Aaker personality: **Sincerity + Competence**, low Excitement.

| # | Principle | What it decides |
|---|---|---|
| P1 | **Paper, not platform** | Warm paper ground and ink text. One deep green accent. No gradients, no glassmorphism, no stock photos of laptops. Serif display headings carry the editorial and archival tone. |
| P2 | **Show the absence** | The proof section is a two-column "What it does / What it leaves out" ledger. The difference is carried by headings and words, never by colour alone. |
| P3 | **Cite, don't claim** | Long tables and quotes are first-class, readable components (horizontal scroll, tabular numbers, quote blocks). Links are always underlined. |
| P4 | **The page has manners** | No pop-ups, no cookie banner (none is needed: no cookies and no analytics script; the Cloudflare beacon was removed 2026-11-06 because ePrivacy Art. 5(3) would require consent for it), no chat widget, no autoplay, no scroll-jacking. The only JavaScript is the optional copy button. |
| P5 | **One accent, used for action** | Brand green appears only on links, the one primary button, the focus ring, the current-page marker, the status pill and the maker note. Never on non-interactive text that could pass for a link. |

**Brand voice** (it carries over to the app's microcopy):

| Adjective | In practice | Not |
|---|---|---|
| Plain | Short sentences in the reader's words: "receipt", "tax year", "export" | Dumbed-down or chatty |
| Exact | Names the form, the line and the source. States limits ("in development", "US federal") | Hedged into mush, or legalistic |
| Calm | Tax time is stressful, and the copy doesn't add urgency | Cheerful ("Amazing!"), alarmist ("Never miss…!") |
| Candid | Says who made it, how the guides were written and what the site measures | Self-deprecating, or a confessional brand persona |

---

## Brand tokens

**This section is the brand SSOT for both the site and the iOS app** (seat directive 2026-11-05: the site's DESIGN.md is
the brand source; the app design inherits it). Hex values are normative. The app's DesignSpec (`getsinew/taxfold` `docs/design/DESIGN.md` §3, reconciled 2026-11-05) inherits every value below and parity-checks them with `docs/design/tools/contrast-brand-reconcile.py`. The app keeps its own token *names* (Asset Catalog conventions); only the values come from here. Every contrast ratio below
is WCAG 2.x relative luminance, computed 2026-11-05 (script: sRGB linearisation, `(L1+0.05)/(L2+0.05)`). AA thresholds:
text 4.5:1, large text and UI parts 3:1.

### Colour — light (`prefers-color-scheme: light`, the default)

| Token | Hex | Usage | Contrast |
|---|---|---|---|
| `paper` | `#f6f4ee` | Page background (60%) | — (the ground) |
| `surface` | `#fcfbf8` | Raised blocks: guide cards, the TOC panel on mobile | — |
| `sunk` | `#edeae1` | Inset blocks: code blocks, the table header row, inline code | — |
| `ink` | `#1c1f1d` | Body text, headings | 15.12 on paper · 16.07 on surface · 13.82 on sunk · 13.77 on brand-soft |
| `ink-soft` | `#4a514c` | Secondary text: byline, descriptions, footer, disclaimer | 7.42 on paper · 7.89 on surface · 6.79 on sunk |
| `rule` | `#d9d5ca` | Decorative dividers and table row lines. **Never the only boundary of an interactive thing** | 1.33 on paper (decorative, exempt) |
| `rule-strong` | `#7f7b70` | Boundaries that carry meaning: card hover border, table-scroll region border, the `<details>` TOC border | 3.84 on paper · 4.08 on surface · 3.51 on sunk |
| `brand` | `#1f5135` | Links, primary button fill, focus ring, current-page bar, status pill text | 8.35 on paper · 8.87 on surface · 7.63 on sunk · 7.61 on brand-soft |
| `brand-strong` | `#163d28` | Hover/active of brand links and button | 11.02 on paper |
| `brand-soft` | `#e3ece5` | Status-pill background, maker-note background | — (ground for brand 7.61, ink 13.77) |
| `on-brand` | `#f6f4ee` | Text on a `brand` fill (the primary button) | 8.35 on brand · 11.02 on brand-strong |
| `success` | `#1d6b3a` | App: "Exported", "Saved". The site has no success state | 5.94 on paper |
| `success-soft` | `#e3ece5` | App: success banner ground | success 5.41 on it |
| `warning` | `#8a5300` | App: "Check this total" (low OCR confidence) | 5.75 on paper |
| `warning-soft` | `#f6ead6` | App: warning banner ground | warning 5.32 on it |
| `danger` | `#b3261e` | App: delete, failed export | 5.94 on paper |
| `danger-soft` | `#f7e3e1` | App: error banner ground | danger 5.30 on it |
| `info` | `#1f5a8a` | App: neutral notices. Site: unused | 6.61 on paper |
| `info-soft` | `#e2ebf3` | App: info banner ground | info 6.03 on it |

### Colour — dark (`prefers-color-scheme: dark`)

Elevation goes **up in lightness**, not by shadow. Brand is lighter and a little desaturated. Text is never pure white.

| Token | Hex | Usage | Contrast |
|---|---|---|---|
| `paper` | `#131614` | Page background (green-tinted near-black) | — |
| `surface` | `#1b1f1c` | Raised blocks | — |
| `sunk` | `#0e100f` | Inset blocks that should read as sunk: the privacy summary. Code blocks, inline code and table header rows use `surface` instead in dark mode, because a block that is darker than the page reads as a hole, not as content | — |
| `ink` | `#e7e5dd` | Body text, headings | 14.45 on paper · 13.22 on surface · 15.14 on sunk · 10.66 on brand-soft |
| `ink-soft` | `#a9b0aa` | Secondary text | 8.22 on paper · 7.53 on surface · 8.62 on sunk · 6.07 on brand-soft |
| `rule` | `#2e342f` | Decorative dividers | 1.43 on paper (decorative) |
| `rule-strong` | `#6c736d` | Meaningful boundaries (paper/surface only) | 3.74 on paper · 3.42 on surface · 3.92 on sunk |
| `brand` | `#8fcaa4` | Links, button fill, focus ring, current marker | 9.68 on paper · 8.86 on surface · 7.14 on brand-soft |
| `brand-strong` | `#b0dcc0` | Hover/active | 12.01 on paper |
| `brand-soft` | `#1f3328` | Pill and maker-note ground | — |
| `on-brand` | `#0f1a13` | Text on a `brand` fill | 9.47 on brand · 11.76 on brand-strong |
| `success` / `success-soft` | `#7fd19b` / `#1f3328` | App only | 9.97 on paper · 7.36 on soft |
| `warning` / `warning-soft` | `#e8b467` / `#33281a` | App only | 9.68 on paper · 7.64 on soft |
| `danger` / `danger-soft` | `#f2a097` / `#3a2220` | App only | 8.89 on paper · 7.17 on soft |
| `info` / `info-soft` | `#8ec1ea` / `#1a2a38` | App only | 9.51 on paper · 7.66 on soft |

**Colour rules**

- 🔴 **Link vs body text is 1.81:1 in light mode and 1.49:1 in dark**, below the 3:1 that would let a link go without an
  underline. So **every link in running text is underlined** in every state (WCAG 1.4.1). Only nav items and card titles
  drop the underline at rest, because their position and enclosure already mark them as links.
- 🟢 Semantic colours keep their meaning everywhere: green = success, orange-brown = warning, red = danger, blue = info. They
  always come with an icon and a text label, never colour alone. The site uses none of them today, and they exist so the app
  inherits one system.
- 🟢 `brand` and `success` are both green but sit at different lightness (8.35 vs 5.94 on paper). In the app, `success` only
  appears with a ✓ glyph and a label, so the two never collide.
- 🟡 No saturated warm colour covers a large area, ever. The soft grounds stay under 20% saturation.

### Typography (system fonts only, no webfont downloads)

| Role | Stack | Why |
|---|---|---|
| `font-display`: H1, H2, wordmark | `ui-serif, "New York", "Iowan Old Style", Georgia, Cambria, "Times New Roman", serif` | P1: editorial and archival. On Apple devices this resolves to **New York**, the same face as SwiftUI's `.serif` design, which links the site to the app. Elsewhere it falls back to Georgia or Cambria. Every option is a hinted screen serif |
| `font-sans`: body, H3, UI | `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | SF Pro on Apple, matching the app's body text. Native everywhere else |
| `font-mono`: code, formulas | `ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | Spreadsheet formulas and filenames |

**Scale: a major third (×1.25) anchored at 17px**, the iOS Dynamic Type *Body* size, rounded to whole pixels. All sizes are
in `rem`, so they follow the user's browser font setting.

| Token | rem | px @100% | Line height | Weight | Use | iOS text style it lines up with |
|---|---|---|---|---|---|---|
| `text-sm` | 0.875 | 14 | 1.5 | 400 / 500 | Byline, footer, disclaimer, table cells, code | Footnote (13) / Subheadline (15) |
| `text-base` | 1.0625 | 17 | 1.7 | 400 | Body prose, nav, buttons | **Body (17)** |
| `text-lg` | 1.3125 | 21 | 1.35 | 600 (sans) | H3 ≥768. Hero lede (400) | Title 3 (20) |
| `text-xl` | 1.625 | 26 | 1.25 | 700 (serif) | H2 ≥768. H1 <768 | Title 1 (28) |
| `text-2xl` | 2.0625 | 33 | 1.15 | 700 (serif) | Page H1 ≥768. Hero H1 768–1023 | Large Title (34) |
| `text-3xl` | 2.5625 | 41 | 1.1 | 700 (serif) | Landing hero H1 ≥1024 only | — (web only) |

- **On mobile (<768) headings drop one step**: H1 `text-xl`, H2 `text-lg` in serif 700, H3 `text-base` in sans 700. Body stays 17px.
- Measure: body text is capped at **35rem** (≈ 70 characters at 17px; the earlier 42.5rem gave ≈ 87). The guide column stays 42.5rem wide so tables, code blocks and the maker note have room. Numbers in tables and amounts use `font-variant-numeric: tabular-nums`.
- Display headings get `letter-spacing: -0.01em` at `text-2xl` and above. Body tracking stays at 0. The one uppercase label
  (the maker-note label) is `text-sm`, weight 600, `letter-spacing: 0.06em`.
- Heading spacing: the gap above a heading is 2–3× the gap below it, so each heading groups with the section it opens.

### Spacing (4px unit)

Base unit **4px** (`0.25rem`; Tailwind 4's `--spacing` default, kept). Allowed steps: **4, 8, 12, 16, 20, 24, 32, 40, 48,
64, 80, 96** (Tailwind `1 2 3 4 5 6 8 10 12 16 20 24`). Fixed rhythm:

| Use | Value |
|---|---|
| Label to its own content, icon to label | 4–8 |
| Paragraph and list gap in prose | 16–20 |
| Card padding, callout padding | 20 (mobile) / 24 (≥768) |
| Gap between cards | 16 / 24 |
| Above an H2 / below an H2 | 40 / 12 |
| Between landing sections | 64 (mobile) / 96 (≥1024) |
| Page gutter | 20 (<768) / 32 (768–1023) / 40 (≥1024) |

### Radius, border, shadow

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 4px | Inline code, focus-ring corner |
| `radius-md` | 8px | Cards, callouts, code blocks, table wrapper, buttons |
| `radius-lg` | 12px | Reserved for app sheets. Unused on the site |
| `radius-full` | 9999px | Status pill |
| Border | 1px `rule` (decorative) / 1px `rule-strong` (meaningful) | — |
| Accent bar | 4px `brand`, left edge | Maker note only |
| `shadow-raised` | `0 1px 2px rgb(28 31 29 / 0.08), 0 2px 8px rgb(28 31 29 / 0.06)`, **light mode only** | The skip link only. Nothing else casts a shadow. Dark mode uses `surface` lightness instead |
| Focus ring | `2px solid brand`, `outline-offset: 2px` | Every focusable element (8.35:1 light / 9.68:1 dark on paper) |

### Motion

Hover colour transitions run 120ms ease-out. Nothing else animates. Under `prefers-reduced-motion: reduce`, transitions
are 0 and anchor scrolling is instant. No parallax, no entrance animations.

### Handing the tokens to the iOS app

- **Colours:** one Asset Catalog colour set per token, with *Any Appearance* set to the light hex and *Dark* to the dark hex.
  Set names follow the app's own conventions (e.g. AccentColor for `brand`); the values come from the tables above. The app adds high-contrast variants if Increase Contrast
  testing calls for them (open item).
- **Type:** use the Dynamic Type text styles named in the scale table, not fixed points. Large titles use `.serif` (New York)
  to match the site's serif H1/H2. Body and controls use the default SF.
- **Spacing:** a 4pt grid. **Radius:** 8 / 12 with continuous corners. **Targets:** 44×44pt minimum.
- **Voice:** § 2 table. Button labels name the outcome ("Export 2026", not "OK").

---

## 3. Navigation model and global chrome

**Mental model the site must build:** *"Taxfold is a small company that writes careful receipt guides and makes an iPhone
app that keeps receipts on the phone."* Readers mostly land on a guide from search. The chrome has to answer three
questions from any page, in this order: what is this, who made it, can I trust it.

**Primary nav: 4 items, no hamburger.**

| Item | Target | Current-state rule |
|---|---|---|
| Guides | `/#guides` (until `/guides/` exists, see below) | `aria-current="true"` on any `/guides/*` page |
| About | `/about/` | `aria-current="page"` |
| Privacy | `/privacy/` | `aria-current="page"` |
| Contact | `/contact/` | `aria-current="page"` |

- **Change from the skeleton:** "How we write" leaves the top nav and "Guides" takes its slot. The guides are the site's
  content, and the nav currently has no way to reach them. "How we write" is still linked from every guide's byline, which
  is where the question "who wrote this?" comes up, and from the footer and About.
- The wordmark (receipt mark + "Taxfold" in `font-display` 700, `brand`) links to `/`.
- **A `/guides/` index page** is deferred. Trigger: more than 8 guides, or the first second-level cluster. At that point
  "Guides" points to it and the test's `STATIC_PATHS` gains the URL.
- The footer is not a second nav. It holds the site statement, the disclaimer, © Opal Harmony P.C., and links to *How we
  write* · *Privacy* · `hello@taxfold.app`.

---

## 4. Information architecture per page (≤4 top-level sections each)

Every page has one H1. Headings never skip a level. Landmarks: `header` › `nav[aria-label=Main]`, `main#main`, `footer`.

### 4.1 Landing `/`

| # | Section | Content |
|---|---|---|
| 1 | **Hero + CTA** | H1 (proposed copy below). A lede (`text-lg` 400, `ink-soft`, ≤2 sentences). The **launch-state CTA** (§ 5.6). The status pill. One decorative "receipt tear" rule under the section (the favicon's zigzag edge as an 8px SVG), used **once** on the whole site (`aria-hidden`) |
| 2 | **Proof: "What it does / What it leaves out"** | Two-column ledger. *Does*: scan on the phone, file by tax year, export CSV/PDF. *Leaves out*: account, sync server, bank connection, analytics, subscription, each with a one-line consequence. A link to `/privacy/#app` |
| 3 | **Guides** (`id="guides"`, the nav target) | Guide cards (§ 5.4) in a contents-page list, sorted by title, not by date |
| 4 | **Who makes it** | Opal Harmony P.C., a small company in Greece. Links to About, How we write, Privacy. "The site's source and every review are public on GitHub" |

- **Hero copy, proposed:** H1 *"Receipts for tax time, kept on your iPhone."* (43 chars, against the skeleton's 76). It
  gives 2–3 lines at 375px instead of 4–5. Never "nowhere else" or "nothing leaves the phone": app data is part of the
  user's own iCloud or computer backup and leaves the phone on export (blind review 2026-11-05, round 1). The
  local-only fact is carried by the "What it leaves out" list. The `<title>` stays as the SEO string. The writer or
  operator owns the final words.
- **The hero CTA, pre-beta (now):** the primary button is **"Read the receipt guides"**, which jumps to `#guides`. The
  secondary is a text link, **"What the app will and won't collect"**, which goes to `/privacy/#app`. Next to them, the status
  pill reads **"In development · not on the App Store yet"**, and a sentence reads "One-time purchase when it ships. No subscription."
  Why the CTA is the guides: the only valuable thing a visitor can do today is read. That is also the SEO loop's
  engagement signal, and it opens no account. Neither a waitlist nor email capture is allowed (funnel doctrine).
- **The price figure ($39.99)** stays off the site until the App Store listing exists. It is an operator call to publish
  earlier. The slot is "One-time purchase", which becomes "$39.99 once. No subscription." when the state flips to `released`.

### 4.2 Guide article `/guides/<slug>/` (template)

| # | Section | Content |
|---|---|---|
| 1 | **Article header** | H1 (title). A byline row: "By the Taxfold team" (→ /about/) · "Last updated *Nov 5, 2026*" (always shown, because `/how-we-write/` promises it and `tests/site.test.ts` pins the string `Last updated <time datetime="`) · "First published *…*" (only when it differs) · "How we write these guides" (→ /how-we-write/). Every date is a `<time datetime>`, formatted `en-US` medium in UTC |
| 2 | **On this page (TOC)** | `nav[aria-label="On this page"]`, H2s only, from Astro's `render()` → `headings` (depth 2). Below 1024 it is a native `<details>` placed under the byline, **closed by default**, with the summary "On this page · N sections". At 1024 and up it is a sticky right rail (`top: 32px`) with no toggle. No scroll-spy, no JS |
| 3 | **Body** | Prose in the 35rem text measure (≈70 characters; tables, code and the maker note use the 42.5rem guide column): tables (§ 5.5), code blocks (§ 5.7), quotes (§ 5.8), lists, then the **maker note** (§ 5.9) wrapping the guide's "Where Taxfold fits" section |
| 4 | **After the article** | The disclaimer (§ 5.9, quiet variant), then "More guides": the other guides as compact links, at most 4 |

**Content conventions this template needs from the writer** (they change the markdown, which is not part of this spec's
edit; flagged for the writer's next PR):

- 🟢 **One Taxfold section per guide, H2 text exactly `Where Taxfold fits`, as the last H2.** Met by all five guides
  since the content-fix pass (`receipt-scanner-iphone` split its mixed section into a generic "What a receipt app adds"
  and the Taxfold section; `expense-tracker-spreadsheet`, formerly `expense-spreadsheet-export`, renamed its heading).
  The rehype step wraps the section by that exact heading. A build test asserts exactly one per guide.
- 🟢 **No launch-status sentences in the markdown.** Removed from every guide in the content-fix pass. The day the app
  ships, such a sentence would be false on every page at once. The maker note appends the status line from the single
  launch-state constant (§ 5.6). Keep it out of the prose.
- 🟡 **Long primary-source quotes** (more than about 40 words, or more than one sentence) go in a `>` blockquote, after a
  sentence that names and links the source; short quotes stay inline. Batch 1 does not follow this yet: six quoted
  passages run past one sentence inline (final review 2026-11-05). Converting them is the next content pass.
- 🟢 **Checklists are ordinary lists.** GFM task-list syntax (`- [ ]`) is not used: it renders disabled checkboxes that look
  interactive and read as "checkbox, not checked, dimmed" to screen readers. A test fails on `<input` inside a guide.
- 🟢 Numeric table columns are right-aligned with `---:`.

### 4.3 About `/about/`

The skeleton's structure is kept: **Why local-only · The guides · Contact**, after the H1 + intro paragraph. That is 4 blocks
counting the intro. Layout: the 35rem text column on the logo's left edge, no rail.

### 4.4 How we write `/how-we-write/`

Kept: **AI assistance, stated plainly · Checked before it is published (ordered list) · What the guides are, and are not
· Updates and corrections**, which is exactly 4 H2s. The numbered review steps render as a stepped list, with the step
number in a 32px `sunk` circle and the step title in bold. That keeps it readable as a process without a diagram.

### 4.5 Privacy `/privacy/`

Kept: **The app: we collect nothing (`#app`) · This website: cookieless analytics · Email · Legal basis, recipients and
your rights**, which is 4 H2s. One addition: an **"In short" summary** above the first H2. It is a 2-row definition list
(App: sends us nothing / Website: counts visits without cookies) in a `surface` callout. The writer drafts the wording, and
the component is § 5.9 (neutral variant). Last-updated stays at the foot.

### 4.6 Contact `/contact/`

One section: the email address shown as large text (`text-lg`, an underlined `mailto:`), then the three-item purpose list
(corrections / privacy / the app), then the no-advice line. **There are no forms on this site**, so the forms corpus
doesn't apply. Its one transferable rule, "explain why we need it", is already met: there is nothing to ask for.

### 4.7 404

| # | Section | Content |
|---|---|---|
| 1 | Message | H1 "Page not found", plus one sentence: "The link may be old, or the address mistyped." |
| 2 | Ways forward | The guide list (compact cards), so the reader recovers with content, not just "home" |
| 3 | Report | "Tell us which link brought you here: hello@taxfold.app" |

The page is `noindex` and stays out of the sitemap (already tested).

### 4.8 Page states (static-site interpretation of the gate's four states)

| Page | Loading | Empty | Error | Populated |
|---|---|---|---|---|
| Landing | N/A: static HTML, no client fetch | 0 guides: § 3 renders "The first guides are in review." and the nav's "Guides" points to `/how-we-write/`. The build test already fails on an empty guide set, so this state can't ship today | 404 page | § 4.1 |
| Guide | N/A | N/A: a guide exists or its URL doesn't | 404 | § 4.2 |
| About / How we write / Privacy / Contact | N/A | N/A (fixed copy) | 404 | as specced |
| 404 | N/A | 0 guides: the section-2 list is omitted | — (it *is* the error state) | § 4.7 |
| Copy button (the only runtime UI) | N/A: the clipboard write is instant | — | "Press Ctrl+C to copy" (§ 5.7) | "Copied" |

---

## 5. Components (props · states · interactions · accessibility)

All interactive components have default / hover / focus-visible / active states. **Disabled and loading states don't exist
on this site**: nothing is ever gated and nothing loads. Focus is always the § Brand-tokens ring, which shows on
`:focus-visible` only and appears instantly.

### 5.1 Skip link

- First focusable element: "Skip to content" → `#main`.
- Hidden until focused. On focus it sits at top-left (16px inset), `brand` fill, `on-brand` text, `radius-md`,
  `shadow-raised`, 44px tall, above everything else.
- `main` has `tabindex="-1"` so focus lands there in every browser.

### 5.2 Primary nav item

| State | Treatment |
|---|---|
| Default | `text-base` 500, `ink-soft`, no underline. Hit area ≥44px tall (vertical padding) and ≥44px wide |
| Hover | `ink` text with a 2px `rule-strong` bar under the label, 120ms |
| Focus-visible | Ring around the full hit area |
| Active (pressed) | `brand-strong` text |
| Current | `ink` text, weight 600, a **2px `brand` bar** under the label (shape plus colour, so it's not colour-only), plus `aria-current` |

### 5.3 Links

| Variant | Default | Hover | Focus-visible | Active | Visited |
|---|---|---|---|---|---|
| Prose link | `brand`, underline 1px, offset 3px | `brand-strong`, underline 2px | Ring, `radius-sm` | `brand-strong` | Same as default (a reference site; visited colour adds noise) |
| External link (other origin) | Same, plus a trailing ↗ added by CSS with empty alt text (`content: "\2197" / ""`), so it is decorative. **Same tab**, no `target=_blank`, so there's nothing to announce | as above | as above | as above | — |
| Footer link | `ink-soft`, underline | `ink` | Ring | — | — |

Inline prose links fall under the WCAG 2.5.8 inline exception. Footer and byline links are inline text at `text-sm`, with
line height giving ≥24px vertical pitch.

### 5.4 Guide card (landing § 3, 404, "More guides")

- Cards in a grid have equal heights, and an odd count gives the first card the full row (no orphan in the last row). Card titles are `text-base` on phones and `text-lg` from 768, so a card title never outweighs the section heading above it.

- Props: `title`, `description`, `href`, `variant: full | compact` (compact = title only).
- Structure: `li` › `article` › `h3 > a` (the only link) plus a `p` description. The whole card is clickable through
  `a::after { position:absolute; inset:0 }`. The card is `position:relative`.

| State | Treatment |
|---|---|
| Default | `surface` ground, 1px `rule` border, `radius-md`, padding 20/24. Title `text-base` 600 `brand` on phones, `text-lg` from 768, no underline. Description `ink-soft` |
| Hover | Border becomes `rule-strong` and the title gets an underline, 120ms. No lift, no shadow |
| Focus-visible | Ring on the **card** through `.card:has(a:focus-visible)`; the link's own ring is suppressed |
| Active | Title `brand-strong` |

The screen reader reads the title link, then the description. No "Read more" duplicate links.

### 5.5 Table (GFM, up to 8 columns)

- The rehype step wraps every `<table>` in `<div class="table-scroll" role="region" tabindex="0" aria-label="<label>">`. The
  label is the nearest preceding heading's text plus " (table)". If the table has a `caption`, that is used instead.
- **Below 600px each row becomes a card** (first cell = bold title band, every other cell a label and value line from `data-label`; the header row stays in the accessibility tree; table roles are explicit because a block layout drops native semantics). From 600px: **horizontal scroll** when the table is wider than the 42.5rem column. Nothing breaks out of the column (the
  rail sits beside it on desktop).
- Scroll affordance without JS: CSS scroll shadows (`background-attachment: local` gradients) on the left and right edges.
  They show only when there is content to scroll toward.
- Wrapper: 1px `rule-strong` border, `radius-md`. Header row: `sunk` ground, weight 600. Rows separated by a 1px `rule`.
  Cell padding 12/16 (8/12 below 768).
- Cells: `text-sm` at every width (one size; the scale has no 15px step), `min-width: 8rem`, `max-width: 22rem`,
  top-aligned. Numeric columns right-aligned, `tabular-nums`. Filenames and formulas in cells use `font-mono`.
- States: default / focus-visible (ring on the region, so the keyboard can scroll it with the arrow keys). No hover: the
  table isn't interactive.

### 5.6 Launch-state CTA (single source)

One constant decides it: `LAUNCH_STATE = 'pre-beta' | 'beta' | 'released'`, plus `TESTFLIGHT_URL`, `APP_STORE_ID` and the optional `APP_STORE_PT`. It
drives the hero CTA, the status pill, the maker-note status line, the Smart App Banner meta, and the "One-time purchase" line.

| State | Primary | Secondary | Status pill | Extra |
|---|---|---|---|---|
| `pre-beta` (now) | Button "Read the receipt guides" → `#guides` | Link "What the app will and won't collect" → `/privacy/#app` | "In development · not on the App Store yet" | — |
| `beta` | Button "Join the TestFlight beta" → `TESTFLIGHT_URL` (↗, same tab) | "Read the receipt guides" | "Public beta · free while in testing" | Helper below the button: "Needs an iPhone with iOS <min> and Apple's free TestFlight app." |
| `released` | Apple's official "Download on the App Store" badge (black on light, white on dark, unmodified artwork, 48px tall, ≥40px is Apple's minimum), campaign link `…/id<ID>?pt=<pt>&ct=site&mt=8`. Without `pt` (launch day) the link is `https://apps.apple.com/app/id<ID>` with no query | "Read the receipt guides" | Pill removed | `<meta name="apple-itunes-app" content="app-id=<ID>, app-argument=<canonical>">` on every page. Price line "$39.99 once. No subscription." A guide's maker-note button carries the campaign token of its cluster (the first `cluster` entry without `core:`), not a per-page one |

`APP_STORE_PT` is optional: Apple issues it only once App Store Connect shows the Campaigns tab, at least 24 hours after release.
Apple's badge rules (App Store marketing guidelines): one badge per layout, never modified, minimum clear space ¼ of the
badge height, minimum 40px on screen; the black badge is preferred and the white one is the alternative for a layout where
it complements the colours and no other platform's badge appears. The white badge is used on the dark scheme.
Apple asks for credit lines once per site, where legal copy goes. The footer carries one in every state, naming the Apple marks the pages use (`creditLine` in `launch-state.mjs`). A test fails when a page names a mark from its hand-kept list of 23 that the line omits; a mark outside that list is not caught, so extend the list when copy starts using a new one.

Primary button states:

| State | Treatment |
|---|---|
| Default | `brand` fill, `on-brand` text `text-base` 600, 48px tall, padding 0/24, `radius-md` |
| Hover | `brand-strong` fill, 120ms |
| Focus-visible | Ring, offset 2px, over `paper` |
| Active | `brand-strong` fill, `translateY(1px)` (0 under reduced motion) |

The button is an `<a>` styled as a button, because it navigates. The badge `img` alt is "Download Taxfold on the App Store".

### 5.7 Code block (spreadsheet formulas)

- `pre > code`: `sunk` ground, `font-mono` `text-sm`, line height 1.6, padding 16, `radius-md`, `white-space: pre-wrap` with `overflow-wrap: anywhere` (formulas wrap instead of clipping), `overflow-x: auto` as the fallback,
  `tabindex="0"` (a scrollable region needs keyboard access), `role="group"` and `aria-label="Code"`.
- Inline `code`: `sunk` ground, padding 2/6, `radius-sm`, 0.9em.
- No syntax highlighting. These are one-line formulas, and colour would be noise. Turn off Shiki/Prism highlighting.
- **Copy button (progressive enhancement, the only site JS):** a script inserts
  `<button type="button">Copy</button>` in a strip at the top-right of each code block's `.code-block` wrapper (the `pre` scrolls
  horizontally, so a button inside it would scroll away and cover the code). Without JS, no button exists.

| State | Treatment |
|---|---|
| Default | `text-sm` 500, `ink-soft` on `surface`, 1px `rule-strong`, 44×44px minimum, padding 0/12, to the right of the first line of code |
| Hover | `ink` text |
| Focus-visible | Ring |
| Active | `sunk` ground |
| Success | Label "Copied" for 2s, announced through a shared `aria-live="polite"` region, then back to "Copy" |
| Error (clipboard denied) | Label "Press Ctrl+C to copy" (⌘C on Apple), and the code text gets selected |

### 5.8 Blockquote (IRS and other primary-source passages)

- A 3px left border in `rule-strong`, padding-left 20, `ink` text (not `ink-soft`: a quote is evidence, not a footnote), in
  normal style (italics hurt reading at length).
- The source is named and linked in the sentence before the quote (the citing convention). The quote doesn't repeat it.
- Hover and focus: none.

### 5.9 Callouts

| Variant | Use | Treatment | Semantics |
|---|---|---|---|
| **Maker note** | Wraps the guide's `## Where Taxfold fits` section | `brand-soft` ground, 4px `brand` left bar, `radius-md`, padding 20/24. Above the H2, a label "FROM THE MAKERS OF TAXFOLD" (`text-sm` 600, tracking 0.06em, `brand`). After the prose, the launch-state status line in `ink-soft` and, in `beta`/`released`, a compact primary CTA | `<aside aria-labelledby="<h2 id>">`. The H2 stays in the TOC. This puts the how-we-write promise ("read those mentions as coming from its maker") on screen |
| **Neutral / summary** | Privacy "In short" | `sunk` ground, 3px `rule-strong` left rule, no full border (a bordered `surface` box reads as a clickable guide card) | `<section aria-label="In short">` |
| **Disclaimer (quiet)** | Foot of every guide | Not a box. A 1px `rule` above, `text-sm` `ink-soft`, padding-top 16 | `<p>`, plain text |

### 5.10 Status pill

`brand-soft` ground, `brand` text `text-sm` 500, `radius-full`, padding 4/12. It is plain text, not interactive: no hover, no
pointer cursor (P5).

### 5.11 Header and footer

- Header: no sticky positioning, so nothing can hide a focused element (WCAG 2.4.11 holds by construction). A 1px `rule`
  bottom border. Wordmark mark (the favicon receipt glyph at 24px) + "Taxfold".
- Footer: `text-sm` `ink-soft`, three short lines (§ 3). A 1px `rule` top border. The links are a list: stacked with 12px vertical padding below 600px, one row from 600px. On a guide page the footer drops the no-advice line, because the guide already ends with it.

---

## 6. Responsive behaviour

Breakpoints: **375** (the baseline phone), **768**, **1024**, **1440**. Container `page` = 70rem (1120px) max. Guide column
= 42.5rem (tables, code, maker note); text measure = 35rem (≈70 characters at 17px). TOC rail = 15rem.

| Element | 375 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| Header | Two rows: the wordmark, then the 4 nav items spread across the full width (each ≥44px tall) | One row: wordmark left, nav right | same | same, container 1120 centred |
| Landing hero | H1 `text-xl`, lede `text-base`, CTA full width, secondary link below it | H1 `text-2xl`, CTA auto width, secondary inline beside it | H1 `text-3xl`, hero text max 40rem, left-aligned (Z-pattern: the CTA sits at the end of the reading line) | same |
| Landing proof ledger | Stacked: "Does" list, then "Leaves out" list | Two columns, 24 gap | Two columns, 48 gap | same |
| Landing guides | 1 column of cards | 1 column | 2 columns | 2 columns |
| Guide layout | Single column. TOC = `<details>` under the byline | same, gutter 32 | Grid `42.5rem 15rem`, 64 gap, TOC sticky in the rail | same, centred in 1120 |
| Guide H1 / H2 / H3 | 26 / 21 / 17 | 33 / 26 / 21 | same | same |
| Tables | Below 600px each row is a card (first cell = title band, other cells = label/value lines) | from 600px: horizontal scroll inside the column, scroll shadows, only if wider than the column | same | same |
| Code blocks | Wrap (`pre-wrap`, break anywhere), Copy (44×44) right of the first line | same | same | same |
| Static pages | Prose column, gutter 20 | gutter 32 | 35rem text column on the same left edge as the logo and the guide template, no rail | same |
| 404 | Message, then compact card list | same | same, cards in 2 columns | same |

There are no fixed or bottom elements, so no safe-area insets and no `viewport-fit=cover`. Body is never below 17px, so
iOS doesn't zoom.

---

## 7. Dark mode

- **Mechanism: `prefers-color-scheme` only, no toggle.** Why: (1) the OS setting is the user's own choice, already made; (2) a
  toggle has to remember its state in `localStorage` or a cookie. The privacy page promises a site with no client-side
  state, and a toggle would put that sentence at risk. (3) A toggle needs a blocking
  head script to avoid a flash. **Reopen if** a real user asks for it.
- `<meta name="color-scheme" content="light dark">`, plus two `theme-color` metas (`#f6f4ee` light / `#131614` dark) with
  `media` queries.
- Every token flips at `:root`. Markup never uses `dark:` variants (FRONTEND.md).
- Future screenshots of the app use `<picture>` with a `prefers-color-scheme: dark` source showing the app's own dark mode.
  No CSS image filters.
- The favicon (a green tile with a paper glyph) reads on both browser-chrome themes. No dark variant is needed.

---

## 8. Keyboard and target requirements

- 🟢 **Tab order = DOM order = visual order:** skip link → wordmark → Guides / About / Privacy / Contact → (guide) byline
  links → TOC summary or links → body links and scroll regions in reading order → maker-note CTA → "More guides" → footer
  links.
- 🟢 Every interactive element is a native `a`, `button` or `summary`. No `div` click handlers, no positive `tabindex`.
- 🟢 The TOC `<details>` toggles with Enter or Space. A TOC link jumps to its heading, and the next Tab continues from that
  heading (anchor navigation moves the sequential-focus start point). Headings get `scroll-margin-top: 24px`.
- 🟢 Table and code scroll regions take focus and scroll with ←/→ (native).
- 🟢 Focus is visible on every focusable element (2px ring, ≥3:1, never `outline: none` without the ring).
- 🟢 Targets: nav items and the CTA ≥44px tall (CTA 48). Copy button 44×44. Footer and byline links ≥24px pitch. Inline prose
  links are exempt under WCAG 2.5.8 (inline). This is a stated deviation from the employee checklist's "48×48 everything".
- 🟢 No keyboard traps. No focus moves on page load.

---

## 9. Data model / API spec

**N/A: a static content site.** There is no database, no server and no endpoint. The only structured data is the content
collection schema in `src/content.config.ts` (`title` ≤70, `description` 50–160, `cluster`). Each guide's Article JSON-LD
already comes from it. The only "endpoint" is `mailto:hello@taxfold.app`. The gate items "data_model ≥1 table",
"api_spec ≥1 endpoint" and "auth_required" don't apply, and inventing a schema to pass them would be design theatre.
The app's data model belongs to the build kickoff's DesignSpec, not this one.

---

## 10. Open items

- 🟡 **The writer owes content edits** for the template: standardise `Where Taxfold fits` in 2 guides, and strip the
  launch-status sentences from all 5 (§ 4.2).
- 🟡 The hero H1 rewrite and the privacy "In short" wording are proposals. The writer and operator own them.
- 🟡 **Logo:** the wordmark plus the favicon glyph stand in. A logo exploration goes after this strategy is approved
  (brand-identity sequence). The app icon derives from it.
- 🟡 OG/social image in the tokens. Not specced.
- 🟡 iOS Increase Contrast variants of the tokens.
- 🟡 Publishing $39.99 before the listing is an operator call (§ 4.1).

---

## Blind critique

A second designer saw only the screenshots of `2eea1e8` (file: `/tmp/taxfold-briefs/blind-critique.md`). Each item is folded or answered.

| # | Finding | Outcome |
|---|---|---|
| 1 must | Decision table clips the answer column at 375 | **Folded.** Below 600px every row is a card: first cell as a title band, other cells as label and value lines from `data-label` on each cell. Table roles are explicit and the header row stays for screen readers. From 600px it is still a scroll region. Tests: unit (roles and labels), dist (every `td` has role and label), CSS (mobile block). |
| 2 must | Formula code blocks clip at 375, no scroll cue | **Folded.** `pre-wrap` with `overflow-wrap: anywhere`, so a formula wraps at its spaces instead of clipping. The Copy button moved from its own row to the right of the first line. The copied text is unchanged. Tests: CSS. |
| 3 | Mobile headings weaker than content below | **Partly folded.** Card titles are 17px on phones (21px from 768) and H2 gets 48px above it on phones. **Answered:** H2 stays 21px and H3 17px bold on phones. The type scale is the shared SSOT with the iOS text styles, and a 22px or 19px step would be a one-off. Bold lead-ins in the guides are the writer's markup, not a heading problem. |
| 4 | Line length about 87 characters at 768 and up | **Folded.** Body text is capped at 35rem (≈70 characters). The guide column stays 42.5rem so tables, code and callouts keep their width. The original spec's "≈68ch" was wrong for 17px system sans. Test: CSS. |
| 5 | Left edge jumps between page types at 1440 | **Folded.** Single-column pages are left-aligned on the logo's edge, the same as landing and guides. This reverses the spec's "centred column". Test: no `mx-auto` on those pages. |
| 6 | Landing hero about 55% empty on the right, H1 about 40px | **Answered, not changed.** The suggested artifact is a sample export with CSV rows. The app's export does not exist yet, so any such artifact is a mock of the unbuilt app, and it states column names and content nobody has approved. The right-hand emptiness is the Z-pattern's resting space and stays honest. Revisit when TestFlight screenshots exist; the slot is the top right of the hero. The H1 stays at `text-3xl` (41px): the scale is shared with the app. |
| 7 | Privacy summary looks like a clickable card | **Folded.** It is now a `sunk` ground with a 3px left rule and no border or full radius. Spec § 5.9 updated. Test: CSS. |
| 8 | Product mentions styled inconsistently across guides | **Folded** by the writer's content pass (every guide ends in `Where Taxfold fits`) and by the maker-note component, which wraps it. The existing test now expects exactly one labelled note in all five guides, with the awaiting-list empty. |
| 9 | Small tap targets at 375 (Copy, footer links) | **Folded.** Copy is 44×44. Footer links are a list, stacked below 600px with 12px vertical padding. Tests: CSS. |
| 10 | Long function signature as inline code inside a link wraps over four underlined lines | **Folded in PR #2** (guide markup): both SUMIFS signatures are code blocks, each with a plain link to its vendor page above it. Inline code also breaks anywhere inside a link so it cannot overflow. |
| 11 | Card grids uneven | **Folded.** Cards in a row have equal heights. An odd count gives the first card the full row, so the landing's five cards read as one wide plus two rows of two. Tests: CSS and markup. |
| 12 | Dark mode: table header and code darker than the page | **Folded.** In dark mode code blocks, inline code and table header rows use `surface`. The `sunk` token is unchanged because the app inherits it. Test: CSS. |
| 13 | Bold active nav item shifts neighbours | **Folded.** An invisible bold copy of the label reserves the bold width (`data-text`). Test: CSS and markup. |
| 14 | Guide TOC sidebar heavy | **Partly folded.** No underline at rest (it is a nav list), `ink-soft`, underline on hover, sticky at 24px. **Answered:** the current-section bar needs scroll-spy JavaScript, which the spec rules out (no JS beyond the copy button). |
| 15 | Repeated messages | **Folded.** The ledger's "one-time purchase" line became "Nothing to renew or cancel", so the purchase line appears once. The writer pass removed the status prose from the guides, so the maker note says it once. A guide's footer drops the no-advice line that the guide itself ends with. Tests: dist text counts. |
| 16 | Title Case, straight and curly quotes, spelling | **Folded.** The guide title is sentence case (writer). Apostrophes and quotation marks on the site's own pages are curly, and a build helper curls apostrophes in guide titles and descriptions that come from frontmatter. "organising" became "organizing". Test: no straight apostrophe in any page's visible text. |
| 17 | Zigzag divider narrower than the section below | **Folded.** The tear is its own element across the full page width, outside the hero. Test: markup. |
