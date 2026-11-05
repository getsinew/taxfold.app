// Runs against dist/ — `npm test` builds first.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertFullHistory,
  firstPublished,
  GUIDE_URL_CAP_PER_MONTH,
  GUIDES_DIR,
  guideCapViolations,
  guideFiles,
  lastEdited,
  lastmodForPath,
} from '../src/lib/lastmod.mjs';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://taxfold.app';
const STATIC_PATHS = ['/', '/about/', '/contact/', '/how-we-write/', '/privacy/'];

const read = (rel: string) => readFileSync(join(DIST, rel), 'utf8');
const html = (path: string) => read(join(path, 'index.html'));
const text = (path: string) =>
  html(path)
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
const guidePaths = () => guideFiles(ROOT).map((f) => `/guides/${f.split('/').pop()!.replace(/\.md$/, '')}/`);
const allPaths = () => [...STATIC_PATHS, ...guidePaths()];

const sitemapEntries = () =>
  [...read('sitemap-0.xml').matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, body]) => ({
    loc: body.match(/<loc>(.*?)<\/loc>/)?.[1],
    lastmod: body.match(/<lastmod>(.*?)<\/lastmod>/)?.[1],
  }));

describe('sitemap', () => {
  it('index points at the child sitemap and robots.txt names the index', () => {
    expect(read('sitemap-index.xml')).toContain(`${SITE}/sitemap-0.xml`);
    expect(read('robots.txt')).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  });

  it('lists exactly the public pages and guides, never the 404', () => {
    const locs = sitemapEntries().map((e) => e.loc);
    expect([...locs].sort()).toEqual(allPaths().map((p) => SITE + p).sort());
  });

  it('dates every URL from its source edits, not from the build', () => {
    for (const { loc, lastmod } of sitemapEntries()) {
      const path = new URL(loc!).pathname;
      expect(lastmod, loc).toBe(lastmodForPath(path, ROOT).toISOString());
    }
  });

  it('dates the landing page by its own file and the guides directory, deletions included', () => {
    const repo = mkdtempSync(join(tmpdir(), 'taxfold-landing-'));
    const g = (iso: string, ...args: string[]) =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
        cwd: repo,
        env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
      });
    try {
      g('2026-01-01T00:00:00Z', 'init', '--quiet', '-b', 'main');
      mkdirSync(join(repo, 'src/pages'), { recursive: true });
      mkdirSync(join(repo, GUIDES_DIR), { recursive: true });
      writeFileSync(join(repo, 'src/pages/index.astro'), 'landing');
      writeFileSync(join(repo, GUIDES_DIR, 'a.md'), 'a');
      writeFileSync(join(repo, GUIDES_DIR, 'b.md'), 'b');
      g('2026-01-01T00:00:00Z', 'add', '.');
      g('2026-01-01T00:00:00Z', 'commit', '--quiet', '-m', 'one');
      writeFileSync(join(repo, GUIDES_DIR, 'b.md'), 'b edited');
      g('2026-02-01T00:00:00Z', 'commit', '--quiet', '-am', 'edit b');
      expect(lastmodForPath('/', repo).toISOString()).toBe('2026-02-01T00:00:00.000Z');
      g('2026-03-01T00:00:00Z', 'rm', '--quiet', join(GUIDES_DIR, 'b.md'));
      g('2026-03-01T00:00:00Z', 'commit', '--quiet', '-m', 'delete b');
      expect(lastmodForPath('/', repo).toISOString()).toBe('2026-03-01T00:00:00.000Z');
      expect(lastEdited(join(GUIDES_DIR, 'a.md'), repo).toISOString()).toBe('2026-01-01T00:00:00.000Z');
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

describe('lastmod helper fails closed', () => {
  it('refuses a source file that does not exist', () => {
    expect(() => lastEdited('src/pages/nope.astro', ROOT)).toThrow(/no such source file/);
    expect(() => lastmodForPath('/nope/', ROOT)).toThrow(/no such source file/);
  });

  it('dates each file by its own last change, and a merged change by the merge', () => {
    const repo = mkdtempSync(join(tmpdir(), 'taxfold-dates-'));
    const at = (iso: string) => ({ ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso });
    const g = (iso: string, ...args: string[]) =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd: repo, env: at(iso) });
    try {
      g('2026-01-01T00:00:00Z', 'init', '--quiet', '-b', 'main');
      writeFileSync(join(repo, 'a.md'), 'a');
      g('2026-01-01T00:00:00Z', 'add', 'a.md');
      g('2026-01-01T00:00:00Z', 'commit', '--quiet', '-m', 'a');
      g('2026-01-02T00:00:00Z', 'checkout', '--quiet', '-b', 'draft');
      writeFileSync(join(repo, 'b.md'), 'b');
      g('2026-01-02T00:00:00Z', 'add', 'b.md');
      g('2026-01-02T00:00:00Z', 'commit', '--quiet', '-m', 'b drafted');
      g('2026-02-10T00:00:00Z', 'checkout', '--quiet', 'main');
      g('2026-02-10T00:00:00Z', 'merge', '--quiet', '--no-ff', '-m', 'b published', 'draft');
      expect(lastEdited('a.md', repo).toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(lastEdited('b.md', repo).toISOString()).toBe('2026-02-10T00:00:00.000Z');
      expect(firstPublished('b.md', repo).toISOString()).toBe('2026-02-10T00:00:00.000Z');
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it('refuses a shallow clone, where every file would share one date', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'taxfold-shallow-'));
    const origin = join(tmp, 'origin');
    const clone = join(tmp, 'clone');
    const g = (cwd: string, ...args: string[]) =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], { cwd });
    try {
      execFileSync('git', ['init', '--quiet', origin]);
      g(origin, 'commit', '--quiet', '--allow-empty', '-m', 'one');
      g(origin, 'commit', '--quiet', '--allow-empty', '-m', 'two');
      g(tmp, 'clone', '--quiet', '--depth', '1', `file://${origin}`, clone);
      expect(() => assertFullHistory(origin)).not.toThrow();
      expect(() => assertFullHistory(clone)).toThrow(/shallow clone/);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});

describe('every page', () => {
  it.each(allPaths())('%s has a title, a description and a taxfold.app canonical', (path) => {
    const page = html(path);
    expect(page).toMatch(/<title>[^<]{10,}<\/title>/);
    expect(page).toMatch(/<meta name="description" content="[^"]{50,}"/);
    expect(page).toContain(`<link rel="canonical" href="${SITE}${path}"`);
  });

  it('keeps a space between a word and the inline element after it', () => {
    for (const path of allPaths()) {
      const body = html(path).split('<body')[1];
      expect(body.match(/[A-Za-z0-9,.:;"')]<(a|strong|em|code|time)\b/g), path).toBeNull();
    }
  });

  it('carries no App Store badge or link before approval', () => {
    for (const path of allPaths()) {
      expect(html(path), path).not.toMatch(/apps\.apple\.com|Download on the App Store|apple-itunes-app/i);
    }
  });
});

describe('trust pages', () => {
  it('how-we-write discloses AI assistance, human review and the entity byline', () => {
    const t = text('/how-we-write/');
    expect(t).toMatch(/AI writing tools/);
    expect(t).toMatch(/Human review/);
    expect(t).toMatch(/Nothing publishes until that person approves it/);
    expect(t).toContain('Taxfold team');
  });

  it('privacy names both halves: the app collects nothing, the site runs cookieless Cloudflare Web Analytics', () => {
    const t = text('/privacy/');
    expect(html('/privacy/')).toMatch(/<h2 id="app">The app: we collect nothing<\/h2>/);
    expect(t).toContain('Data Not Collected');
    expect(t).toContain('Cloudflare Web Analytics');
    expect(t).toContain('No cookies.');
    expect(t).toContain('for the purpose of displaying analytics');
    expect(t).toContain('We see these only as aggregate counts');
    expect(t).toContain('without telling us who you are');
  });

  it('contact gives hello@taxfold.app', () => {
    expect(html('/contact/')).toContain('href="mailto:hello@taxfold.app"');
  });

  it('every guide is bylined "Taxfold team", linked to about, and dated', () => {
    for (const path of guidePaths()) {
      const page = html(path);
      expect(page, path).toMatch(/By the <a href="\/about\/">Taxfold team<\/a>/);
      expect(page, path).toMatch(/Last updated <time datetime="/);
      expect(page, path).toContain('"@type":"Article"');
    }
  });
});

describe('internal links and launch status', () => {
  it('every internal link resolves to a built page and, for a fragment, to an id on it', () => {
    const pages = [...allPaths(), '/404.html'];
    for (const path of pages) {
      const page = path.endsWith('.html') ? read(path.slice(1)) : html(path);
      for (const [, href] of page.matchAll(/href="(\/[^"]*|#[^"]+)"/g)) {
        const [target, fragment] = href.startsWith('#') ? [path, href.slice(1)] : href.split('#');
        if (/\.[a-z0-9]+$/i.test(target)) {
          expect(existsSync(join(DIST, target)), `${path} → ${href}`).toBe(true);
          continue;
        }
        expect(existsSync(join(DIST, target, 'index.html')), `${path} → ${href}`).toBe(true);
        if (fragment) expect(html(target), `${path} → ${href}`).toContain(`id="${fragment}"`);
      }
    }
  });

  it('the guides links never point at an empty guides section', () => {
    const landing = html('/');
    if (guidePaths().length === 0) {
      expect(landing).not.toMatch(/href="(\/)?#guides"/);
      expect(landing).toMatch(/href="\/how-we-write\/" class="btn-primary"/);
    } else {
      expect(landing).toMatch(/href="#guides" class="btn-primary"/);
      expect(landing).toMatch(/href="\/#guides" class="nav-link"/);
    }
  });

  it('launch-status wording lives only in src/lib/launch-state.mjs', () => {
    const files = readdirSync(join(ROOT, 'src'), { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.(astro|mjs|ts|md)$/.test(f) && !f.endsWith('launch-state.mjs'));
    for (const f of files) {
      const src = readFileSync(join(ROOT, 'src', f), 'utf8');
      expect(src, f).not.toMatch(/in development|not (yet )?on the App Store|will read/i);
    }
  });
});

describe('lexical caps', () => {
  it('holds no locale directory (EN only until a locale is added on purpose)', () => {
    for (const dir of [join(ROOT, 'src/pages'), DIST]) {
      const locales = readdirSync(dir).filter((d) => /^[a-z]{2}(-[a-z]{2})?$/i.test(d));
      expect(locales, dir).toEqual([]);
    }
  });

  it(`adds at most ${GUIDE_URL_CAP_PER_MONTH} new guide URLs in any calendar month`, () => {
    expect(GUIDE_URL_CAP_PER_MONTH).toBe(8);
    expect(guideCapViolations(ROOT)).toEqual([]);
  });

  it('counts the cap per calendar month of publication: 8 passes, a 9th in the same month fails', () => {
    const repo = mkdtempSync(join(tmpdir(), 'taxfold-cap-'));
    const g = (iso: string, ...args: string[]) =>
      execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
        cwd: repo,
        env: { ...process.env, GIT_AUTHOR_DATE: iso, GIT_COMMITTER_DATE: iso },
      });
    const addGuide = (iso: string, name: string) => {
      writeFileSync(join(repo, GUIDES_DIR, `${name}.md`), name);
      g(iso, 'add', '.');
      g(iso, 'commit', '--quiet', '-m', name);
    };
    try {
      g('2026-01-01T00:00:00Z', 'init', '--quiet', '-b', 'main');
      mkdirSync(join(repo, GUIDES_DIR), { recursive: true });
      for (let i = 1; i <= 8; i++) addGuide('2026-03-10T00:00:00Z', `march-${i}`);
      addGuide('2026-04-01T00:00:00Z', 'april-1');
      expect(guideCapViolations(repo)).toEqual([]);
      addGuide('2026-03-31T23:00:00Z', 'march-9');
      expect(guideCapViolations(repo)).toEqual(['2026-03: 9 new guides (cap 8)']);
    } finally {
      rmSync(repo, { recursive: true, force: true });
    }
  });

  it('the build itself refuses a shallow clone (astro.config calls the guard)', () => {
    expect(readFileSync(join(ROOT, 'astro.config.mjs'), 'utf8')).toMatch(/^assertFullHistory\(\);$/m);
  });

  it('serves the pages.dev copies with noindex', () => {
    expect(read('_headers')).toMatch(/^https:\/\/:project\.pages\.dev\/\*\n\s+X-Robots-Tag: noindex$/m);
    expect(read('_headers')).toMatch(/^https:\/\/:version\.:project\.pages\.dev\/\*\n\s+X-Robots-Tag: noindex$/m);
    expect(read('_headers')).not.toMatch(/taxfold\.app/);
  });

  it('builds no page outside the declared routes', () => {
    const built = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('index.html'))
      .map((f) => `/${f.replace(/index\.html$/, '')}`);
    expect(built.sort()).toEqual(allPaths().sort());
    expect(existsSync(join(DIST, '404.html'))).toBe(true);
  });
});
