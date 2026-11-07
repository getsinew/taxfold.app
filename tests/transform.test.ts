// The guide transform and the launch-state switch, run on hand-built hast trees (no build needed).
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { transformRoot } from '../src/lib/hast-taxfold.mjs';
import { guideFiles } from '../src/lib/lastmod.mjs';
import { launchCacheKey, pruneStaleLaunchCaches } from '../src/lib/launch-cache.mjs';
import { appStoreUrl, ctFromCluster, LAUNCH_STATE, launchView, SITE_CT } from '../src/lib/launch-state.mjs';

type Node = { type: string; tagName?: string; value?: string; properties?: Record<string, unknown>; children?: Node[] };

const text = (value: string): Node => ({ type: 'text', value });
const element = (tagName: string, children: Node[] = [], properties: Record<string, unknown> = {}): Node => ({
  type: 'element',
  tagName,
  properties,
  children,
});
const rootOf = (...children: Node[]) => ({ type: 'root', children });
const tagsOf = (nodes: Node[]) => nodes.map((node) => node.tagName);
const NO_IDS = { TESTFLIGHT_URL: '', APP_STORE_ID: '', APP_STORE_PT: '' };
const ROOT = join(import.meta.dirname, '..');

describe('guide transform', () => {
  const preBeta = launchView('pre-beta');

  it('wraps a table in a labelled region named after the heading before it', () => {
    const tree = transformRoot(rootOf(element('h2', [text('Decision table')]), element('table')), preBeta);
    const wrapper = tree.children[1] as Node;
    expect(wrapper.tagName).toBe('div');
    expect(wrapper.properties).toMatchObject({ className: ['table-scroll'], role: 'region', tabIndex: 0, ariaLabel: 'Decision table (table)' });
    expect(wrapper.children?.[0].tagName).toBe('table');
  });

  it('prefers the table caption, and falls back to a plain label with no heading before it', () => {
    const captioned = transformRoot(rootOf(element('table', [element('caption', [text('Receipts by year')])])), preBeta);
    expect((captioned.children[0] as Node).properties?.ariaLabel).toBe('Receipts by year');
    const bare = transformRoot(rootOf(element('table')), preBeta);
    expect((bare.children[0] as Node).properties?.ariaLabel).toBe('Table');
  });

  it('wraps a table nested in a list item', () => {
    const tree = transformRoot(rootOf(element('ul', [element('li', [element('table')])])), preBeta);
    const item = (tree.children[0] as Node).children![0];
    expect(item.children![0].properties?.role).toBe('region');
  });

  it('makes each pre focusable and labelled inside a code-block wrapper', () => {
    const tree = transformRoot(rootOf(element('pre', [element('code', [text('=MONTH(A2)')])])), preBeta);
    const wrapper = tree.children[0] as Node;
    expect(wrapper.properties?.className).toEqual(['code-block']);
    expect(wrapper.children![0].properties).toMatchObject({ role: 'group', tabIndex: 0, ariaLabel: 'Code' });
  });

  it('wraps "Where Taxfold fits" and its siblings up to the next h2 in one labelled aside', () => {
    const tree = transformRoot(
      rootOf(
        element('h2', [text('Intro')]),
        element('p'),
        element('h2', [text('Where Taxfold fits')]),
        element('p', [text('one')]),
        element('p', [text('two')]),
        element('h2', [text('Afterword')]),
        element('p'),
      ),
      preBeta,
    );
    expect(tagsOf(tree.children)).toEqual(['h2', 'p', 'aside', 'h2', 'p']);
    const aside = tree.children[2] as Node;
    expect(aside.properties).toMatchObject({ className: ['maker-note'], ariaLabelledBy: 'where-taxfold-fits' });
    expect(tagsOf(aside.children!)).toEqual(['p', 'h2', 'p', 'p', 'p']);
    expect(aside.children![1].properties?.id).toBe('where-taxfold-fits');
    expect(aside.children![0].children![0].value).toBe('From the makers of Taxfold');
    expect(aside.children!.at(-1)!.children![0].value).toBe(preBeta.makerStatus);
  });

  it('leaves a guide with no such heading without an aside', () => {
    const tree = transformRoot(rootOf(element('h2', [text('Using Taxfold with a spreadsheet')]), element('p')), preBeta);
    expect(tagsOf(tree.children)).toEqual(['h2', 'p']);
  });

  it('adds the TestFlight call to action to the maker note in the beta state only', () => {
    const beta = launchView('beta', { ...NO_IDS, TESTFLIGHT_URL: 'https://testflight.apple.com/join/x' });
    const source = () => rootOf(element('h2', [text('Where Taxfold fits')]), element('p'));
    expect(JSON.stringify(transformRoot(source(), beta))).toContain('https://testflight.apple.com/join/x');
    expect(JSON.stringify(transformRoot(source(), preBeta))).not.toContain('btn-primary');
  });
});

describe('launch state', () => {
  it('pre-beta points at the guides and the privacy page, with no store link and no price', () => {
    const state = launchView('pre-beta');
    expect(state.primary).toMatchObject({ label: 'Read the receipt guides', href: '#guides' });
    expect(state.secondary.href).toBe('/privacy/#app');
    expect(JSON.stringify(state)).not.toMatch(/apps\.apple\.com|\$\d/);
    expect(state.itunesMeta).toBeNull();
  });

  it('beta and released refuse to render without their required identifiers', () => {
    expect(() => launchView('beta', NO_IDS)).toThrow(/TESTFLIGHT_URL/);
    expect(() => launchView('released', NO_IDS)).toThrow(/APP_STORE_ID/);
    expect(() => launchView('released', { ...NO_IDS, APP_STORE_PT: 'pt9' })).toThrow(/APP_STORE_ID/);
    expect(() => launchView('launched' as never)).toThrow(/unknown LAUNCH_STATE/);
  });

  it('released refuses an App Store id that is not all digits, naming the variable (a pasted `id…` would ship a broken link)', () => {
    for (const bad of ['id6739000000', 'ID6739000000', 'abc', '6739 000', '6739000000/', '']) {
      expect(() => launchView('released', { ...NO_IDS, APP_STORE_ID: bad }), bad).toThrow(/APP_STORE_ID/);
    }
    expect(() => launchView('released', { ...NO_IDS, APP_STORE_ID: 'id6739000000' })).toThrow(/digits/);
    expect(launchView('released', { ...NO_IDS, APP_STORE_ID: '6739000000' }).primary).toMatchObject({ href: 'https://apps.apple.com/app/id6739000000' });
  });

  it('released renders without a provider token, the launch-day shape: plain store links, no query', () => {
    const state = launchView('released', { ...NO_IDS, APP_STORE_ID: '123' });
    expect(state.priceLine).toBe('Free for your first 40 receipts, then $39.99 once. No subscription.');
    expect(state.pill).toBeNull();
    expect(state.primary).toMatchObject({ kind: 'badge', alt: 'Download Taxfold on the App Store', href: 'https://apps.apple.com/app/id123' });
    expect(state.makerCta?.hrefFor('receipt-scan-ocr')).toBe('https://apps.apple.com/app/id123');
    expect(state.itunesMeta?.('https://taxfold.app/')).toBe('app-id=123, app-argument=https://taxfold.app/');
  });

  it('released with a provider token carries the site token on the badge and the cluster token on a guide', () => {
    const state = launchView('released', { ...NO_IDS, APP_STORE_ID: '123', APP_STORE_PT: 'pt9' });
    expect(state.primary).toMatchObject({ href: 'https://apps.apple.com/app/id123?pt=pt9&ct=site&mt=8' });
    expect(state.makerCta?.hrefFor('receipt-scan-ocr')).toBe('https://apps.apple.com/app/id123?pt=pt9&ct=receipt-scan-ocr&mt=8');
  });

  it('released names the Apple-supplied badge artwork in both colour schemes', () => {
    const state = launchView('released', { ...NO_IDS, APP_STORE_ID: '123' });
    expect(state.primary).toMatchObject({ art: { light: '/app-store-badge-black.svg', dark: '/app-store-badge-white.svg' } });
  });

  it('carries one Apple credit line in every state, because every state names Apple marks', () => {
    const lines = [
      launchView('pre-beta').creditLine,
      launchView('beta', { ...NO_IDS, TESTFLIGHT_URL: 'https://t' }).creditLine,
      launchView('released', { ...NO_IDS, APP_STORE_ID: '123' }).creditLine,
    ];
    expect(new Set(lines).size).toBe(1);
    for (const mark of ['Apple', 'Apple logo', 'iPhone', 'iPad', 'iCloud', 'Live Text', 'App Store', 'TestFlight']) {
      expect(lines[0], mark).toContain(mark);
    }
    expect(lines[0]).toContain('registered in the U.S. and other countries');
    expect(lines[0]).toContain('Cisco');
  });
});

describe('App Store link', () => {
  it('is a campaign link only when a provider token exists (Apple issues ct and pt together)', () => {
    expect(appStoreUrl('123', 'pt9', 'site')).toBe('https://apps.apple.com/app/id123?pt=pt9&ct=site&mt=8');
    expect(appStoreUrl('123', '', 'site')).toBe('https://apps.apple.com/app/id123');
    expect(appStoreUrl('123', undefined, 'site')).toBe('https://apps.apple.com/app/id123');
  });

  it('encodes a campaign token that carries reserved characters', () => {
    expect(appStoreUrl('123', 'pt9', 'a b&c')).toBe('https://apps.apple.com/app/id123?pt=pt9&ct=a%20b%26c&mt=8');
  });

  it('still requires the app id, as digits only', () => {
    expect(() => appStoreUrl('', 'pt9', 'site')).toThrow(/APP_STORE_ID/);
    expect(() => appStoreUrl('id123', 'pt9', 'site')).toThrow(/APP_STORE_ID/);
  });
});

describe('campaign tokens', () => {
  const guideClusters = () =>
    guideFiles(ROOT).map((file) => {
      const frontmatter = readFileSync(join(ROOT, file), 'utf8').split('---')[1];
      const cluster = frontmatter.match(/^cluster:\s*"(.*)"\s*$/m)?.[1];
      return { file, cluster: cluster as string };
    });

  it('takes the first cluster entry and drops the core: prefix', () => {
    expect(ctFromCluster('core:receipt-scan-ocr, core:receipt-app-generic')).toBe('receipt-scan-ocr');
    expect(ctFromCluster('core:self-employed-expenses')).toBe('self-employed-expenses');
    expect(ctFromCluster('receipts-for-taxes')).toBe('receipts-for-taxes');
  });

  it('refuses a cluster that cannot be a valid Apple campaign token', () => {
    expect(() => ctFromCluster(undefined)).toThrow(/cluster/);
    expect(() => ctFromCluster('')).toThrow(/cluster/);
    expect(() => ctFromCluster('core:')).toThrow(/cluster/);
    expect(() => ctFromCluster(`core:${'x'.repeat(31)}`)).toThrow(/30/);
    expect(() => ctFromCluster('core:bad\ttab')).toThrow(/cluster/);
    expect(() => ctFromCluster('core:café')).toThrow(/cluster/);
  });

  it('keeps the site-wide token valid by the same rule', () => {
    expect(ctFromCluster(SITE_CT)).toBe(SITE_CT);
  });

  it('maps every current guide to a token of at most 30 characters, none padded with a space', () => {
    const guides = guideClusters();
    expect(guides.length).toBeGreaterThan(0);
    for (const { file, cluster } of guides) {
      expect(cluster, file).toBeTruthy();
      const token = ctFromCluster(cluster);
      expect(token.length, file).toBeLessThanOrEqual(30);
      expect(token, file).toBe(token.trim());
    }
  });

  // Guides sharing a first cluster entry share a token on purpose (DESIGN.md § 5.6); a collision is two different
  // first entries that map to one token.
  const tokenCollisions = (clusters: string[]) => {
    const firstEntries = new Map<string, Set<string>>();
    for (const cluster of clusters) {
      const token = ctFromCluster(cluster);
      firstEntries.set(token, (firstEntries.get(token) ?? new Set()).add(cluster.split(',')[0].trim()));
    }
    return [...firstEntries].filter(([, entries]) => entries.size > 1).map(([token]) => token);
  };

  it('gives no two distinct first entries one token, and none the site token', () => {
    const clusters = guideClusters().map(({ cluster }) => cluster);
    expect(tokenCollisions(clusters)).toEqual([]);
    expect(clusters.map(ctFromCluster)).not.toContain(SITE_CT);
  });

  it('lets guides share a first entry, whatever follows it', () => {
    expect(tokenCollisions(['core:a-b, core:c', 'core:a-b, core:d', 'core:a-b'])).toEqual([]);
  });

  it('would catch a collision (anti-vacuity)', () => {
    expect(tokenCollisions(['core:a', 'a'])).toEqual(['a']);
    expect(tokenCollisions(['core:a, core:x', 'a, core:y'])).toEqual(['a']);
  });

  it('puts the guide cluster token on the maker note call to action', () => {
    const released = launchView('released', { ...NO_IDS, APP_STORE_ID: '123', APP_STORE_PT: 'pt9' });
    const tree = transformRoot(rootOf(element('h2', [text('Where Taxfold fits')]), element('p')), released, 'core:receipts-for-taxes, core:expense-tax-deductions');
    expect(JSON.stringify(tree)).toContain('"href":"https://apps.apple.com/app/id123?pt=pt9&ct=receipts-for-taxes&mt=8"');
  });

  it('refuses to build a released maker note CTA for a guide with no cluster', () => {
    const released = launchView('released', { ...NO_IDS, APP_STORE_ID: '123' });
    expect(() => transformRoot(rootOf(element('h2', [text('Where Taxfold fits')]), element('p')), released)).toThrow(/cluster/);
  });
});

describe('launch override (build-test seam)', () => {
  const KEYS = ['TAXFOLD_LAUNCH_STATE', 'TAXFOLD_APP_STORE_ID', 'TAXFOLD_APP_STORE_PT', 'TAXFOLD_TESTFLIGHT_URL'];
  afterEach(() => KEYS.forEach((key) => delete process.env[key]));

  it('is off unless set: the committed constants render', () => {
    expect(launchView().state).toBe(LAUNCH_STATE);
  });

  it('selects released from the environment, whatever state is committed', () => {
    process.env.TAXFOLD_LAUNCH_STATE = 'released';
    process.env.TAXFOLD_APP_STORE_ID = '555';
    expect(launchView().primary).toMatchObject({ kind: 'badge', href: 'https://apps.apple.com/app/id555' });
    process.env.TAXFOLD_APP_STORE_PT = 'ptX';
    expect(launchView().primary).toMatchObject({ href: 'https://apps.apple.com/app/id555?pt=ptX&ct=site&mt=8' });
  });

  it('selects pre-beta from the environment too, whatever state is committed', () => {
    process.env.TAXFOLD_LAUNCH_STATE = 'pre-beta';
    process.env.TAXFOLD_APP_STORE_ID = '';
    expect(launchView()).toMatchObject({ state: 'pre-beta', primary: { href: '#guides' } });
  });

  it('honours an explicit empty value, so a missing id stays testable once an id is committed', () => {
    process.env.TAXFOLD_LAUNCH_STATE = 'released';
    process.env.TAXFOLD_APP_STORE_ID = '';
    process.env.TAXFOLD_APP_STORE_PT = '';
    expect(() => launchView()).toThrow(/APP_STORE_ID/);
  });

  it('is ignored outside Vitest, so an .env file Astro loads mid-build cannot split a site across two states', () => {
    const inVitest = process.env.VITEST;
    delete process.env.VITEST;
    try {
      process.env.TAXFOLD_LAUNCH_STATE = LAUNCH_STATE === 'released' ? 'pre-beta' : 'released';
      process.env.TAXFOLD_APP_STORE_ID = '555';
      expect(launchView().state).toBe(LAUNCH_STATE);
    } finally {
      process.env.VITEST = inVitest;
    }
  });
});

describe('content cache key', () => {
  const KEYS = ['TAXFOLD_LAUNCH_STATE', 'TAXFOLD_APP_STORE_ID', 'TAXFOLD_APP_STORE_PT', 'TAXFOLD_TESTFLIGHT_URL'];
  afterEach(() => KEYS.forEach((key) => delete process.env[key]));

  it('changes with the launch state and ids, because Astro caches rendered Markdown (the maker note) across builds', () => {
    const committed = launchCacheKey();
    process.env.TAXFOLD_LAUNCH_STATE = 'released';
    process.env.TAXFOLD_APP_STORE_ID = '555';
    const launchDay = launchCacheKey();
    process.env.TAXFOLD_APP_STORE_PT = 'ptX';
    const withToken = launchCacheKey();
    expect(new Set([committed, launchDay, withToken]).size).toBe(3);
    expect(launchCacheKey()).toBe(withToken);
    expect(withToken).toMatch(/^[0-9a-f]{12}$/);
  });

  it('changes with the code that renders the maker note, not only with its inputs', () => {
    expect(launchCacheKey(['launch-state v1', 'hast v1'])).not.toBe(launchCacheKey(['launch-state v2', 'hast v1']));
    expect(launchCacheKey(['launch-state v1', 'hast v1'])).not.toBe(launchCacheKey(['launch-state v1', 'hast v2']));
    expect(launchCacheKey(['launch-state v1', 'hast v1'])).toBe(launchCacheKey(['launch-state v1', 'hast v1']));
  });

  it('skips an entry that vanishes between the listing and the stat (a concurrent prune)', () => {
    const root = mkdtempSync(join(tmpdir(), 'taxfold-cache-'));
    try {
      symlinkSync(join(root, 'nowhere'), join(root, '.astro-dangling'));
      expect(() => pruneStaleLaunchCaches(root, 'current00000', 0)).not.toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('prunes stale keyed cache directories, never the current one, a recent one, or anything else', () => {
    const root = mkdtempSync(join(tmpdir(), 'taxfold-cache-'));
    const DAY = 24 * 60 * 60 * 1000;
    const dir = (name: string, ageDays: number) => {
      mkdirSync(join(root, name));
      const when = new Date(Date.now() - ageDays * DAY);
      utimesSync(join(root, name), when, when);
    };
    try {
      dir('.astro-aaaaaaaaaaaa', 30);
      dir('.astro-current00000', 30);
      dir('.astro-recent000000', 1);
      dir('.astro', 30);
      dir('other', 30);
      pruneStaleLaunchCaches(root, 'current00000', 14 * DAY);
      expect(existsSync(join(root, '.astro-aaaaaaaaaaaa'))).toBe(false);
      for (const kept of ['.astro-current00000', '.astro-recent000000', '.astro', 'other']) {
        expect(existsSync(join(root, kept)), kept).toBe(true);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

