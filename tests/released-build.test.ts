// Builds the site in the `released` launch state (through the TAXFOLD_* override) into a scratch directory and
// checks the pages it writes. LAUNCH_STATE stays 'pre-beta' in the repo; this proves the flip works before launch day.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { guideFiles } from '../src/lib/lastmod.mjs';

const ROOT = join(import.meta.dirname, '..');
const APP_ID = '1234567890';
const APP_URL = `https://apps.apple.com/app/id${APP_ID}`;
const scratch: string[] = [];

const GUIDES = guideFiles(ROOT).map((file) => {
  const slug = file.split('/').pop()!.replace(/\.md$/, '');
  const cluster = readFileSync(join(ROOT, file), 'utf8').split('---')[1].match(/^cluster:\s*"(.*)"\s*$/m)![1];
  return { slug, token: cluster.split(',')[0].trim().replace(/^core:/, '') };
});

// Every seam variable is set on every build, an empty value meaning "empty", so what a build renders never depends
// on the constants committed in launch-state.mjs (which the launch-day flip changes).
const SEAM = { TAXFOLD_LAUNCH_STATE: 'released', TAXFOLD_APP_STORE_ID: '', TAXFOLD_APP_STORE_PT: '', TAXFOLD_TESTFLIGHT_URL: '' };
const BUILD_TIMEOUT = 120_000;

function buildReleased(overrides: Record<string, string>) {
  const outDir = mkdtempSync(join(tmpdir(), 'taxfold-released-'));
  scratch.push(outDir);
  const env = { ...process.env, ...SEAM, ...overrides };
  const run = spawnSync('npx', ['astro', 'build', '--outDir', outDir], { cwd: ROOT, env, encoding: 'utf8' });
  const page = (path: string) => readFileSync(join(outDir, path, 'index.html'), 'utf8');
  return { run, outDir, page };
}

afterAll(() => scratch.forEach((dir) => rmSync(dir, { recursive: true, force: true })));

describe('released state, launch day: an App Store id and no provider token yet', () => {
  let build: ReturnType<typeof buildReleased>;
  beforeAll(() => {
    build = buildReleased({ TAXFOLD_APP_STORE_ID: APP_ID });
  }, BUILD_TIMEOUT);

  it('builds', () => {
    expect(build.run.status, build.run.stderr).toBe(0);
  });

  it('shows Apple’s badge on the landing page, in both colour schemes, linking to the plain store page', () => {
    const landing = build.page('/');
    expect(landing).toMatch(
      new RegExp(
        `<a href="${APP_URL}" class="store-badge">\\s*<picture>\\s*` +
          `<source srcset="/app-store-badge-white\\.svg" media="\\(prefers-color-scheme: dark\\)"\\s*/?>\\s*` +
          `<img src="/app-store-badge-black\\.svg" alt="Download Taxfold on the App Store"`,
      ),
    );
    expect(landing).toMatch(/<img[^>]*\sheight="48"/);
    expect(landing).not.toMatch(/class="btn-primary"[^>]*>\s*Read the receipt guides/);
    expect(landing).toContain('Read the receipt guides');
    expect(landing).toContain('$39.99 once. No subscription.');
    expect(landing).not.toContain('In development');
    expect(existsSync(join(build.outDir, 'app-store-badge-black.svg'))).toBe(true);
    expect(existsSync(join(build.outDir, 'app-store-badge-white.svg'))).toBe(true);
  });

  it('puts the Smart App Banner and the Apple credit line on every page', () => {
    for (const path of ['/', '/about/', '/contact/', '/privacy/', '/how-we-write/', ...GUIDES.map(({ slug }) => `/guides/${slug}/`)]) {
      const page = build.page(path);
      expect(page, path).toMatch(new RegExp(`<meta name="apple-itunes-app" content="app-id=${APP_ID}, app-argument=https://taxfold\\.app${path}"`));
      expect(page, path).toContain('Apple, the Apple logo, iPhone, iPad, iCloud, Live Text, Safari, TestFlight and App Store are trademarks of Apple Inc.');
    }
  });

  it('links each guide’s maker note to the plain store page, with no pt or ct', () => {
    for (const { slug } of GUIDES) {
      const page = build.page(`/guides/${slug}/`);
      expect(page, slug).toContain(`href="${APP_URL}"`);
      expect(page, slug).toContain('Get Taxfold on the App Store');
      expect(page, slug).not.toMatch(/[?&](pt|ct)=/);
    }
  });
});

describe('released state, once the provider token exists', () => {
  let build: ReturnType<typeof buildReleased>;
  beforeAll(() => {
    build = buildReleased({ TAXFOLD_APP_STORE_ID: APP_ID, TAXFOLD_APP_STORE_PT: 'pt9' });
  }, BUILD_TIMEOUT);

  it('builds', () => {
    expect(build.run.status, build.run.stderr).toBe(0);
  });

  it('tags the landing badge with the site token', () => {
    expect(build.page('/')).toContain(`href="${APP_URL}?pt=pt9&amp;ct=site&amp;mt=8"`);
  });

  it('tags each guide with its own cluster token, never one shared bucket', () => {
    for (const { slug, token } of GUIDES) {
      const page = build.page(`/guides/${slug}/`);
      expect(page, slug).toContain(`href="${APP_URL}?pt=pt9&amp;ct=${token}&amp;mt=8"`);
      expect(page, slug).not.toContain('ct=guide&');
    }
  });
});

describe('the maker note button inside a guide', () => {
  // `.prose a` (link colour, underline, ↗ marker on http links) outranks `.btn-primary`, which painted brand text on
  // the brand fill (invisible label) the first time the CTA rendered in the released state.
  const css = readFileSync(join(ROOT, 'src/styles/global.css'), 'utf8');

  it('overrides the prose link colour, underline and external marker', () => {
    expect(css).toMatch(/\.prose a\.btn-primary\s*\{[^}]*text-on-brand[^}]*text-decoration:\s*none/);
    expect(css).toMatch(/\.prose a\.btn-primary:hover[^{]*\{[^}]*text-on-brand/);
    expect(css).toMatch(/\.prose a\.btn-primary\s*\{[^}]*transition:\s*background-color/);
    expect(css).toMatch(/\.prose a\.btn-primary::after\s*\{[^}]*content:\s*none/);
  });
});

describe('released state without an App Store id', () => {
  let run: ReturnType<typeof buildReleased>['run'];
  beforeAll(() => {
    run = buildReleased({ TAXFOLD_APP_STORE_ID: '', TAXFOLD_APP_STORE_PT: 'pt9' }).run;
  }, BUILD_TIMEOUT);

  it('fails the build instead of rendering a dead badge, even when an id is committed', () => {
    expect(run.status).not.toBe(0);
    expect(`${run.stdout}${run.stderr}`).toMatch(/APP_STORE_ID/);
  });
});

describe('Apple badge artwork', () => {
  // SHA-256 of the files as Apple served them on 2026-11-06 (toolbox.marketingtools.apple.com, en-us); Apple’s
  // guidelines forbid modifying the artwork, so any edit to these files must fail here.
  const APPLE_ARTWORK = {
    'app-store-badge-black.svg': 'a26fc5b38380272c92e9019a2eb8b45542a66814b3e2b203772db8904b9fb99f',
    'app-store-badge-white.svg': '056de2f81ff61b778a0c192dbb098f9b0416e7e8f79b119e43d11248155e597f',
  };

  it.each(Object.entries(APPLE_ARTWORK))('%s is byte-identical to the file Apple served', (name, sha256) => {
    const bytes = readFileSync(join(ROOT, 'public', name));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(sha256);
  });

  it('is rendered at least 40px tall (Apple’s on-screen minimum)', () => {
    for (const name of Object.keys(APPLE_ARTWORK)) {
      expect(readFileSync(join(ROOT, 'public', name), 'utf8')).toMatch(/viewBox="0 0 119\.66407 40"/);
    }
    expect(readdirSync(join(ROOT, 'public'))).toEqual(expect.arrayContaining(Object.keys(APPLE_ARTWORK)));
  });
});
