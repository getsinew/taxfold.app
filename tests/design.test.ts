// FRONTEND.md § 4 structural tests. Runs against dist/ (npm test builds first) plus pure fixtures, so each
// rule has a case that must fail it: a rule that cannot fail is not a test.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { formatDate } from '../src/lib/format-date.mjs';
import { GUIDES_DIR, guideFiles } from '../src/lib/lastmod.mjs';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

const read = (path: string) => readFileSync(join(DIST, path), 'utf8');
const builtPages = () =>
  readdirSync(DIST, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.html'))
    .map((file) => ({ file, html: read(file) }));
const guideSlugs = () => guideFiles(ROOT).map((file) => file.split('/').pop()!.replace(/\.md$/, ''));
const guideHtml = (slug: string) => read(join('guides', slug, 'index.html'));
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(astro|ts|mjs)$/.test(entry.name) ? [path] : [];
  });
const markupFiles = () => sourceFiles(join(ROOT, 'src')).filter((file) => file.endsWith('.astro'));

// Guides whose Markdown still predates the template. They fail the rules below until the writer's content pass
// lands; the tests demand the entry be removed the moment a guide passes, so these lists can only shrink.
const AWAITING_MAKER_HEADING = ['expense-spreadsheet-export', 'receipt-scanner-iphone'];
const AWAITING_STATUS_PROSE_REMOVAL = [
  'expense-spreadsheet-export',
  'how-to-organize-receipts',
  'receipt-scanner-iphone',
  'self-employed-expense-tracking',
  'which-receipts-to-keep-for-taxes',
];

// ──────────────────────────────────────────────
// Rule helpers, each exercised by a fixture that must trip it
// ──────────────────────────────────────────────

// The two theme-color metas carry literal hex by necessity (the attribute cannot read a custom property).
const withoutThemeColorMetas = (source: string) => source.replace(/<meta name="theme-color"[^>]*>/g, '');
const rawColorsIn = (source: string) => withoutThemeColorMetas(source).match(/#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/g) ?? [];
const forbiddenClassesIn = (source: string) => source.match(/\bdark:[\w-]+|\b[a-z-]+-\[[^\]\s]+\]|\bbg-white\b/g) ?? [];
const h1Count = (html: string) => (html.match(/<h1[\s>]/g) ?? []).length;
const headingLevels = (html: string) => [...html.matchAll(/<h([1-6])[\s>]/g)].map(([, level]) => Number(level));
const skippedHeadingLevels = (html: string) =>
  headingLevels(html).filter((level, index, all) => index > 0 && level > all[index - 1] + 1);
const SCROLL_REGION_OPEN = /<div class="table-scroll" role="region" tabindex="0" aria-label="[^"]+">\s*$/;
const tablesOutsideScrollRegions = (html: string) => {
  const parts = html.split('<table');
  return parts.slice(0, -1).filter((before) => !SCROLL_REGION_OPEN.test(before));
};

describe('tokens live in global.css only', () => {
  it('finds no hex, rgb() or hsl() in markup, scripts or helpers', () => {
    for (const file of sourceFiles(join(ROOT, 'src'))) {
      expect(rawColorsIn(readFileSync(file, 'utf8')), file).toEqual([]);
    }
  });

  it('would catch a raw colour (anti-vacuity)', () => {
    expect(rawColorsIn('<p style="color: #1f5135">')).toEqual(['#1f5135']);
    expect(rawColorsIn('fill: rgb(0 0 0)')).toHaveLength(1);
    expect(rawColorsIn('<meta name="theme-color" content="#f6f4ee" media="(prefers-color-scheme: light)" />')).toEqual([]);
  });

  it('uses no dark: variant, no arbitrary value and no bg-white in markup', () => {
    for (const file of markupFiles()) {
      expect(forbiddenClassesIn(readFileSync(file, 'utf8')), file).toEqual([]);
    }
  });

  it('would catch each forbidden class form (anti-vacuity)', () => {
    expect(forbiddenClassesIn('class="dark:bg-ink"')).toHaveLength(1);
    expect(forbiddenClassesIn('class="text-[0.95rem]"')).toHaveLength(1);
    expect(forbiddenClassesIn('class="bg-white/60"')).toHaveLength(1);
  });

  it('carries both colour schemes and the inline theme mapping', () => {
    const css = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
    expect(css).toMatch(/--tf-paper: #f6f4ee;/);
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{[^}]*--tf-paper: #131614;/);
    expect(css).toMatch(/@theme inline \{\s*--color-\*: initial;/);
  });
});

describe('every built page', () => {
  it('has exactly one h1', () => {
    for (const { file, html } of builtPages()) expect(h1Count(html), file).toBe(1);
  });

  it('would catch a missing or doubled h1 (anti-vacuity)', () => {
    expect(h1Count('<h2>x</h2>')).toBe(0);
    expect(h1Count('<h1>a</h1><h1 id="b">b</h1>')).toBe(2);
  });

  it('never skips a heading level', () => {
    for (const { file, html } of builtPages()) expect(skippedHeadingLevels(html), file).toEqual([]);
  });

  it('would catch a skipped heading level (anti-vacuity)', () => {
    expect(skippedHeadingLevels('<h1>a</h1><h3>b</h3>')).toEqual([3]);
    expect(skippedHeadingLevels('<h1>a</h1><h2>b</h2><h3>c</h3><h2>d</h2>')).toEqual([]);
  });

  it('opens a new tab nowhere', () => {
    for (const { file, html } of builtPages()) expect(html, file).not.toMatch(/target="_blank"/);
  });

  it('puts the skip link first and gives main a focus target', () => {
    for (const { file, html } of builtPages()) {
      const body = html.split('<body')[1];
      expect(body.match(/<a\b[^>]*>/)?.[0], file).toContain('href="#main"');
      expect(body, file).toMatch(/<main id="main" tabindex="-1"/);
    }
  });

  it('declares both colour schemes and a theme colour per scheme, with no storage access', () => {
    for (const { file, html } of builtPages()) {
      expect(html, file).toContain('<meta name="color-scheme" content="light dark">');
      expect(html, file).toMatch(/<meta name="theme-color" content="#f6f4ee" media="\(prefers-color-scheme: light\)"/);
      expect(html, file).toMatch(/<meta name="theme-color" content="#131614" media="\(prefers-color-scheme: dark\)"/);
      const scriptBodies = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(([, body]) => body).join('\n');
      expect(scriptBodies, file).not.toMatch(/localStorage|sessionStorage|document\.cookie/);
    }
  });

  it('keeps the main nav at four links plus the wordmark, with the current page marked', () => {
    for (const { file, html } of builtPages()) {
      const nav = html.match(/<nav aria-label="Main"[\s\S]*?<\/nav>/)![0];
      expect(nav.match(/<a\b/g), file).toHaveLength(5);
      expect(nav.match(/<li\b/g), file).toHaveLength(4);
    }
    expect(read('about/index.html')).toMatch(/<a href="\/about\/" class="nav-link" aria-current="page">/);
    expect(read('privacy/index.html')).toMatch(/<a href="\/privacy\/" class="nav-link" aria-current="page">/);
  });

  it('ships script only where the copy button needs it', () => {
    for (const { file, html } of builtPages()) {
      const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map(([, attrs]) => attrs.trim());
      const isGuide = file.startsWith('guides/');
      for (const attrs of scripts) {
        expect(attrs.includes('application/ld+json') || (isGuide && attrs.includes('type="module"')), `${file}: ${attrs}`).toBe(true);
      }
    }
  });

  it('never claims "nowhere else" or "nothing leaves the phone", and shows no price on the pages it wrote', () => {
    for (const { file, html } of builtPages()) {
      expect(html, file).not.toMatch(/nowhere else|nothing leaves the phone/i);
      if (!file.startsWith('guides/')) expect(html, file).not.toMatch(/\$\s?\d|39\.99/);
    }
  });
});

describe('landing page', () => {
  it('leads with the pre-beta CTA to the guides, the status pill and the price-free line', () => {
    const html = read('index.html');
    expect(html).toMatch(
      guideSlugs().length > 0
        ? /<a href="#guides" class="btn-primary">Read the receipt guides<\/a>/
        : /<a href="\/how-we-write\/" class="btn-primary">How we write the guides<\/a>/,
    );
    expect(html).toContain('href="/privacy/#app"');
    expect(html).toContain('In development · not on the App Store yet');
    expect(html).toContain('One-time purchase when it ships. No subscription.');
    expect(html).toMatch(/<section[^>]*id="guides"/);
  });

  it('links every guide as a card with a single link', () => {
    const html = read('index.html');
    for (const slug of guideSlugs()) expect(html).toContain(`href="/guides/${slug}/"`);
    for (const card of html.match(/<article class="card">[\s\S]*?<\/article>/g) ?? []) {
      expect(card.match(/<a\b/g)).toHaveLength(1);
    }
  });
});

describe('privacy page', () => {
  it('opens with the in-short summary before the first section', () => {
    const html = read('privacy/index.html');
    expect(html.indexOf('aria-label="In short"')).toBeGreaterThan(0);
    expect(html.indexOf('aria-label="In short"')).toBeLessThan(html.indexOf('<h2'));
  });
});

describe('guide pages', () => {
  it('wrap every table in a focusable, named scroll region', () => {
    for (const slug of guideSlugs()) expect(tablesOutsideScrollRegions(guideHtml(slug)), slug).toEqual([]);
  });

  it('would catch a bare table (anti-vacuity)', () => {
    expect(tablesOutsideScrollRegions('<p>x</p><table><tr></tr></table>')).toHaveLength(1);
    const wrapped = '<div class="table-scroll" role="region" tabindex="0" aria-label="Decision table (table)"><table></table></div>';
    expect(tablesOutsideScrollRegions(wrapped)).toEqual([]);
  });

  it('give every code block a focusable, labelled pre inside a code-block wrapper', () => {
    for (const slug of guideSlugs()) {
      const html = guideHtml(slug);
      const wrapped = html.match(/<div class="code-block"><pre role="group" tabindex="0" aria-label="Code">/g)?.length ?? 0;
      expect(html.match(/<pre\b/g)?.length ?? 0, slug).toBe(wrapped);
    }
  });

  it('carry no input element (task-list syntax is not used)', () => {
    for (const slug of guideSlugs()) expect(guideHtml(slug), slug).not.toContain('<input');
  });

  it('hold exactly one maker note, last in the article, once the guide has the Taxfold heading', () => {
    for (const slug of guideSlugs()) {
      const article = guideHtml(slug).match(/<article[\s\S]*?<\/article>/)![0];
      const expected = AWAITING_MAKER_HEADING.includes(slug) ? 0 : 1;
      expect(article.match(/<aside class="maker-note"/g)?.length ?? 0, slug).toBe(expected);
      if (expected === 1) {
        expect(article.slice(article.indexOf('</aside>')), slug).not.toContain('<h2');
        expect(article, slug).toMatch(/<aside class="maker-note" aria-labelledby="where-taxfold-fits">/);
      }
    }
  });

  it('build the on-this-page list from the guide H2s, in both presentations', () => {
    for (const slug of guideSlugs()) {
      const html = guideHtml(slug);
      const sections = (html.match(/<article[\s\S]*?<\/article>/)![0].match(/<h2 id=/g) ?? []).length;
      const navs = [...html.matchAll(/<nav aria-label="On this page"[\s\S]*?<\/nav>/g)].map(([nav]) => nav);
      expect(navs, slug).toHaveLength(2);
      for (const nav of navs) expect(nav.match(/<li>/g), slug).toHaveLength(sections);
      expect(html, slug).toContain(`On this page · ${sections} sections`);
    }
  });

  it('keep App Store wording out of the Markdown prose once the writer pass is done', () => {
    const mentionsStoreInProse = (markdown: string) => /App Store/.test(markdown.replace(/\]\([^)]*\)/g, '](url)'));
    expect(mentionsStoreInProse('We are not on the App Store yet.')).toBe(true);
    expect(mentionsStoreInProse('[the store](https://apps.apple.com/app/id1)')).toBe(false);
    for (const slug of guideSlugs()) {
      const markdown = readFileSync(join(ROOT, GUIDES_DIR, `${slug}.md`), 'utf8');
      expect(mentionsStoreInProse(markdown), slug).toBe(AWAITING_STATUS_PROSE_REMOVAL.includes(slug));
    }
  });
});

describe('dates', () => {
  it('render as en-US medium in UTC', () => {
    expect(formatDate(new Date('2026-11-05T00:00:00Z'))).toBe('Nov 5, 2026');
    expect(formatDate(new Date('2026-12-31T23:30:00Z'))).toBe('Dec 31, 2026');
  });
});

// ──────────────────────────────────────────────
// Blind-critique fixes (docs/DESIGN.md § Blind critique): the checkable ones
// ──────────────────────────────────────────────

const css = () => readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');
const ruleBody = (selector: string) => css().match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
const visibleBodyText = (html: string) =>
  html
    .split('<body')[1]
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ');
const straightApostrophes = (text: string) => text.match(/[A-Za-z]'[a-z]/g) ?? [];

describe('mobile tables become cards', () => {
  it('give every body cell its column label and explicit table roles', () => {
    for (const slug of guideSlugs()) {
      const html = guideHtml(slug);
      const cells = html.match(/<td\b[^>]*>/g) ?? [];
      for (const cell of cells) expect(cell, slug).toMatch(/role="cell"[^>]*data-label="[^"]+"|data-label="[^"]+"[^>]*role="cell"/);
      expect(html.match(/<table\b[^>]*>/g)?.every((table) => table.includes('role="table"')) ?? true, slug).toBe(true);
      expect(html.match(/<tr\b[^>]*>/g)?.every((row) => row.includes('role="row"')) ?? true, slug).toBe(true);
    }
  });

  it('lays rows out as cards below 600px, with the header row kept for screen readers', () => {
    const mobile = css().match(/@media \(max-width: 37\.4375rem\) \{[\s\S]*?\n  \}\n/)?.[0] ?? '';
    expect(mobile).toMatch(/\.table-scroll td::before[\s\S]*content: attr\(data-label\)/);
    expect(mobile).toMatch(/\.table-scroll thead \{[^}]*clip-path/);
    expect(mobile).not.toMatch(/\.table-scroll thead \{[^}]*display: none/);
  });
});

describe('code blocks', () => {
  it('wrap long formulas instead of clipping them', () => {
    expect(ruleBody('.code-block pre')).toMatch(/white-space: pre-wrap/);
    expect(ruleBody('.code-block pre')).toMatch(/overflow-wrap: anywhere/);
  });

  it('keep the Copy button at a 44px target, beside the first line', () => {
    expect(ruleBody('.copy-btn')).toMatch(/min-height: calc\(var\(--spacing\) \* 11\)/);
    expect(ruleBody('.copy-btn')).toMatch(/min-width: calc\(var\(--spacing\) \* 11\)/);
    expect(ruleBody('.code-block')).toMatch(/display: flex/);
    expect(ruleBody('.code-tools')).toMatch(/order: 2/);
  });
});

describe('reading measure and alignment', () => {
  it('caps body text near 70 characters (35rem) while the guide column stays wider for tables', () => {
    const text = Number(css().match(/--container-text: ([\d.]+)rem/)?.[1]);
    const column = Number(css().match(/--container-measure: ([\d.]+)rem/)?.[1]);
    expect(text).toBeLessThanOrEqual(36);
    expect(column).toBeGreaterThan(text);
    expect(css()).toMatch(/\.prose :where\(p, ul, ol, dl, blockquote\) \{ max-width: var\(--container-text\); \}/);
  });

  it('starts single-column pages at the same left edge as the logo (no centring)', () => {
    for (const page of ['about', 'how-we-write', 'privacy', 'contact', '404']) {
      expect(readFileSync(join(ROOT, 'src/pages', `${page}.astro`), 'utf8'), page).not.toMatch(/\bmx-auto\b/);
    }
  });
});

describe('tap targets', () => {
  it('stacks footer links below 600px with 12px of vertical padding', () => {
    expect(ruleBody('.footer-link')).toMatch(/py-3/);
    expect(ruleBody('.footer-links')).toMatch(/flex-direction: column/);
    expect(css()).toMatch(/@media \(min-width: 37\.5rem\) \{\s*\.footer-links \{ flex-direction: row;/);
  });

  it('reserves bold width in the nav so the current item does not shift its neighbours', () => {
    expect(ruleBody('.nav-link-label::after')).toMatch(/content: attr\(data-text\)/);
    expect(ruleBody('.nav-link-label::after')).toMatch(/font-weight: 600/);
    for (const { file, html } of builtPages()) {
      for (const [, text, label] of html.matchAll(/class="nav-link-label" data-text="([^"]+)">([^<]+)</g)) expect(text, file).toBe(label);
    }
  });
});

describe('cards and callouts', () => {
  it('give cards equal heights and let an odd count lead with a full-width card', () => {
    expect(ruleBody('.card')).toMatch(/height: 100%/);
    expect(css()).toMatch(/\.card-grid > :first-child:nth-last-child\(odd\) \{ grid-column: 1 \/ -1; \}/);
    if (guideSlugs().length > 0) expect(read('index.html')).toContain('<ul class="card-grid">');
  });

  it('keeps card titles at body size on phones', () => {
    expect(ruleBody('.card-title')).toMatch(/text-base[^;]*md:text-lg/);
  });

  it('draws the privacy summary as a left-ruled callout, not a bordered card', () => {
    const body = ruleBody('.callout');
    expect(body).toMatch(/border-left: 3px solid/);
    expect(body).not.toMatch(/border-rule/);
  });

  it('lifts code blocks and table headers above the page in dark mode', () => {
    const dark = css().match(/@media \(prefers-color-scheme: dark\) \{\s*\.code-block,[\s\S]*?\n\}/)?.[0] ?? '';
    expect(dark).toMatch(/^@media \(prefers-color-scheme: dark\) \{\s*\.code-block, \.table-scroll th, \.prose code \{\s*background-color: var\(--tf-surface\);/);
    // The phone-card title band is dark-only AND phone-only, on brand-soft, never on the surface the card body uses.
    expect(dark).toMatch(/@media \(max-width: 37\.4375rem\) \{\s*\.table-scroll td:first-child \{ background-color: var\(--tf-brand-soft\); \}/);
    expect(dark.match(/td:first-child/g)).toHaveLength(1);
  });

  it('draws the receipt tear once, outside the hero, across the full page width', () => {
    const html = read('index.html');
    expect(html.match(/class="tear"/g)).toHaveLength(1);
    expect(html.indexOf('class="tear"')).toBeGreaterThan(html.indexOf('</section>'));
  });
});

describe('say it once per screen', () => {
  it('shows the no-advice sentence once on a guide (footer drops its copy) and in the footer elsewhere', () => {
    for (const slug of guideSlugs()) {
      const text = visibleBodyText(guideHtml(slug)).replace(/\s+/g, ' ');
      expect(text.match(/not tax, legal or accounting advice/gi), slug).toHaveLength(1);
    }
    for (const page of ['index.html', 'privacy/index.html']) {
      expect(visibleBodyText(read(page)).match(/not tax, legal or accounting advice/gi), page).toHaveLength(1);
    }
  });

  it('keeps the one-time purchase line out of the leaves-out ledger', () => {
    expect(visibleBodyText(read('index.html')).match(/one-time purchase/gi)).toHaveLength(1);
  });
});

describe('typography', () => {
  it('uses curly apostrophes in visible text on every page', () => {
    expect(straightApostrophes("you're")).toEqual(["u'r"]);
    for (const { file, html } of builtPages()) expect(straightApostrophes(visibleBodyText(html)), file).toEqual([]);
  });
});
