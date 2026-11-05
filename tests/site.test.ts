// Runs against dist/ — `npm test` builds first.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertFullHistory, firstPublished, guideFiles, lastEdited, lastmodForPath } from '../src/lib/lastmod.mjs';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://taxfold.app';
const STATIC_PATHS = ['/', '/about/', '/contact/', '/how-we-write/', '/privacy/'];
const GUIDE_URL_CAP_PER_MONTH = 8;

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

  it('dates the landing page from its newest source, guides included', () => {
    const newest = Math.max(
      lastEdited('src/pages/index.astro', ROOT).getTime(),
      ...guideFiles(ROOT).map((f) => lastEdited(f, ROOT).getTime()),
    );
    expect(lastmodForPath('/', ROOT).getTime()).toBe(newest);
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
    expect(t).toContain('we collect nothing');
    expect(t).toContain('Data Not Collected');
    expect(t).toContain('Cloudflare Web Analytics');
    expect(t).toContain('No cookies.');
    expect(t).toContain('for the purpose of displaying analytics');
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

describe('lexical caps', () => {
  it('holds no locale directory (EN only until a locale is added on purpose)', () => {
    for (const dir of [join(ROOT, 'src/pages'), DIST]) {
      const locales = readdirSync(dir).filter((d) => /^[a-z]{2}(-[a-z]{2})?$/i.test(d));
      expect(locales, dir).toEqual([]);
    }
  });

  it(`adds at most ${GUIDE_URL_CAP_PER_MONTH} new guide URLs in any calendar month`, () => {
    const perMonth = new Map<string, number>();
    for (const file of guideFiles(ROOT)) {
      const month = firstPublished(file, ROOT).toISOString().slice(0, 7);
      perMonth.set(month, (perMonth.get(month) ?? 0) + 1);
    }
    for (const [month, n] of perMonth) expect(n, month).toBeLessThanOrEqual(GUIDE_URL_CAP_PER_MONTH);
  });

  it('builds no page outside the declared routes', () => {
    const built = readdirSync(DIST, { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('index.html'))
      .map((f) => `/${f.replace(/index\.html$/, '')}`);
    expect(built.sort()).toEqual(allPaths().sort());
    expect(existsSync(join(DIST, '404.html'))).toBe(true);
  });
});
