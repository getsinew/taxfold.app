// The guide transform and the launch-state switch, run on hand-built hast trees (no build needed).
import { describe, expect, it } from 'vitest';
import { transformRoot } from '../src/lib/hast-taxfold.mjs';
import { launchView } from '../src/lib/launch-state.mjs';

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

  it('beta and released refuse to render without their identifiers', () => {
    expect(() => launchView('beta', NO_IDS)).toThrow(/TESTFLIGHT_URL/);
    expect(() => launchView('released', NO_IDS)).toThrow(/APP_STORE_ID/);
    expect(() => launchView('launched' as never)).toThrow(/unknown LAUNCH_STATE/);
  });

  it('released carries the price line, the campaign link and the Smart App Banner value', () => {
    const state = launchView('released', { TESTFLIGHT_URL: '', APP_STORE_ID: '123', APP_STORE_PT: 'pt9' });
    expect(state.priceLine).toBe('$39.99 once. No subscription.');
    expect(state.pill).toBeNull();
    expect(state.makerCta?.href).toBe('https://apps.apple.com/app/id123?pt=pt9&ct=guide&mt=8');
    expect(state.itunesMeta?.('https://taxfold.app/')).toBe('app-id=123, app-argument=https://taxfold.app/');
  });
});
