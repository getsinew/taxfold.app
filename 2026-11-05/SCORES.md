# taxfold.app — verification record, round 2 (blind critique folded)

Tip under test: `pillars-batch-1` @ `5fd24a2`, on `site-skeleton` @ `c7eb850`. `npm test`: 83 tests green on the pillars tip
(78 on `site-skeleton`, which has no guides). Served with `astro preview` (127.0.0.1:4399). Playwright Chromium 1248 for
screenshots and axe-core; Lighthouse 13.6.0 (`npx lighthouse@13.6.0`, `--headless=new`) from localhost.

## Lighthouse

| Page | Preset | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|---|
| `/` | desktop | 100 | 100 | 100 | 100 |
| `/` | mobile | 100 | 100 | 100 | 100 |
| `/guides/which-receipts-to-keep-for-taxes/` | desktop | 100 | 100 | 100 | 100 |
| `/guides/which-receipts-to-keep-for-taxes/` | mobile | 100 | 100 | 100 | 100 |
| `/guides/expense-tracker-spreadsheet/` (8-col table, code) | desktop | 100 | 100 | 100 | 100 |
| `/guides/expense-tracker-spreadsheet/` (8-col table, code) | mobile | 100 | 100 | 100 | 100 |
| `/privacy/` | desktop | 100 | 100 | 100 | 100 |
| `/privacy/` | mobile | 100 | 100 | 100 | 100 |

JSON in `lh/`. Canonical and crawlable audits pass on localhost, so no SEO exception.

## axe-core, light and dark

20 runs (10 page/width combos x light and dark, backgrounds confirmed): **0 violations.** `color-contrast` "needs review" on 6
runs, for the same two reasons as round 1 (text over the table scroll-shadow gradient, step-number pseudo-element). The mobile
table cards are not among them.

## Screenshots (62 PNGs, `<page>-<width>-<light|dark>.png`)

- Widths 1440 / 1024 / 768 / 375 for landing, guide (which-receipts), privacy, how-we-write, about, contact, 404; 375 for the
  spreadsheet guide (`guide-spreadsheet-375-*`, now `expense-tracker-spreadsheet`); 320 for landing and one guide.
- **No horizontal page scroll in any of the 62.** All looked at; points checked per critique item:
  - Decision table and the 8-column spreadsheet table render as cards at 375 (title band, label and value lines), light and dark.
  - Formula blocks wrap; Copy sits to the right of the first line at 44px.
  - Single-column pages start at the logo's left edge at 1440/1024; text measure about 70 characters; guide rail at the right edge.
  - Landing: full-width tear, first guide card on a full row then 2x2 at 1440; 404 grid equal heights.
  - Privacy summary is a left-ruled tinted block, distinct from the guide cards.
  - Dark: code blocks, inline code and table headers are lighter than the page.
- Known cosmetic, not fixed: at 320 the status pill wraps to two lines inside its pill shape.

## Keyboard walk (scripted Tab, light; dark ring sample)

- First Tab: skip link at 16/16 px, 44 px tall; Enter lands on `MAIN`; next Tab goes to the first content link; Shift+Tab reverses.
- Landing 1440 and 375: 21 stops, same order: skip, wordmark, 4 nav, hero CTA, secondary link, privacy link, 5 cards (one link
  each), 4 who-makes-it links, 3 footer links. None invisible.
- Guide 1440: skip, wordmark, 4 nav, 2 byline links, 7 rail links, then body in reading order with each table region, Copy button
  and `pre` taking focus. Guide 375: same, with the `summary` "On this page" (48 px) in place of the rail.
- All 122 recorded focus stops show a computed `2px solid` ring; Copy buttons are 44 px tall (`h=44`); nav 44 px; CTA 48 px.
- Observation: at 375 the table region (`div`, `tabindex=0`) is still a Tab stop although the card layout does not scroll. It is
  harmless but redundant below 600px; CSS cannot remove a tab stop, so it would need script or a different markup split.
- Not checked: screen-reader announcement, 200% zoom, print.
