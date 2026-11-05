// Sätteri hast plugin for the guide pages (FRONTEND.md § 3). Astro 7 renders Markdown with Sätteri, so this is a
// hast plugin, not a rehype one. All the logic is in transformRoot(), a pure tree-in/tree-out function over plain
// hast objects with no Sätteri import, so tests/site.test.ts can feed it fixtures.
import { launchView } from './launch-state.mjs';

export const MAKER_HEADING = 'Where Taxfold fits';
export const MAKER_HEADING_ID = 'where-taxfold-fits';
const MAKER_LABEL = 'From the makers of Taxfold';

const isElement = (node, tagName) => node.type === 'element' && (tagName === undefined || node.tagName === tagName);
const isHeading = (node) => node.type === 'element' && /^h[1-6]$/.test(node.tagName);

export const textOf = (node) =>
  node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join('');

const el = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });

const elementChildren = (node) => node.children.filter((child) => child.type === 'element');
const cellsOf = (row) => elementChildren(row).filter((cell) => cell.tagName === 'th' || cell.tagName === 'td');

function headerLabels(table) {
  const head = elementChildren(table).find((child) => child.tagName === 'thead');
  const headRow = head && elementChildren(head).find((child) => child.tagName === 'tr');
  return headRow ? cellsOf(headRow).map((cell) => textOf(cell).trim()) : [];
}

const withProperties = (node, extra) => ({ ...node, properties: { ...node.properties, ...extra } });

// Below 600px the stylesheet lays each row out as a card, which drops native table semantics in some browsers,
// so the roles are explicit and every body cell carries its column header as data-label.
function semanticRow(row, labels) {
  const cells = row.children.map((child) => {
    if (child.type !== 'element') return child;
    const column = cellsOf(row).indexOf(child);
    if (child.tagName === 'th') return withProperties(child, { role: 'columnheader' });
    return withProperties(child, { role: 'cell', dataLabel: labels[column] ?? '' });
  });
  return withProperties({ ...row, children: cells }, { role: 'row' });
}

function semanticTable(table) {
  const labels = headerLabels(table);
  const groups = table.children.map((child) => {
    if (child.type !== 'element' || !['thead', 'tbody'].includes(child.tagName)) return child;
    const rows = child.children.map((row) => (isElement(row, 'tr') ? semanticRow(row, labels) : row));
    return withProperties({ ...child, children: rows }, { role: 'rowgroup' });
  });
  return withProperties({ ...table, children: groups }, { role: 'table' });
}

function tableLabel(table, nearestHeading) {
  const caption = table.children.find((child) => isElement(child, 'caption'));
  if (caption && textOf(caption).trim()) return textOf(caption).trim();
  return nearestHeading ? `${nearestHeading} (table)` : 'Table';
}

function wrapTable(table, nearestHeading) {
  return el(
    'div',
    { className: ['table-scroll'], role: 'region', tabIndex: 0, ariaLabel: tableLabel(table, nearestHeading) },
    [semanticTable(table)],
  );
}

function wrapCode(pre) {
  const focusablePre = { ...pre, properties: { ...pre.properties, role: 'group', tabIndex: 0, ariaLabel: 'Code' } };
  return el('div', { className: ['code-block'] }, [focusablePre]);
}

// Walks in document order so each table sees the heading that precedes it.
function wrapScrollRegions(children, state) {
  return children.map((child) => {
    if (isHeading(child)) {
      state.nearestHeading = textOf(child).trim();
      return child;
    }
    if (isElement(child, 'table')) return wrapTable(child, state.nearestHeading);
    if (isElement(child, 'pre')) return wrapCode(child);
    if (child.type === 'element') return { ...child, children: wrapScrollRegions(child.children, state) };
    return child;
  });
}

function makerNoteFooter(view) {
  const footer = [el('p', { className: ['maker-note-status'] }, [text(view.makerStatus)])];
  if (view.makerCta) {
    const link = el('a', { className: ['btn-primary', 'btn-compact'], href: view.makerCta.href }, [text(view.makerCta.label)]);
    footer.push(el('p', { className: ['maker-note-cta'] }, [link]));
  }
  return footer;
}

function wrapMakerNote(children, view) {
  const start = children.findIndex((child) => isElement(child, 'h2') && textOf(child).trim() === MAKER_HEADING);
  if (start === -1) return children;
  const after = children.slice(start + 1);
  const nextH2 = after.findIndex((child) => isElement(child, 'h2'));
  const section = nextH2 === -1 ? after : after.slice(0, nextH2);
  const rest = nextH2 === -1 ? [] : after.slice(nextH2);
  const heading = { ...children[start], properties: { ...children[start].properties, id: MAKER_HEADING_ID } };
  const note = el('aside', { className: ['maker-note'], ariaLabelledBy: MAKER_HEADING_ID }, [
    el('p', { className: ['maker-note-label'] }, [text(MAKER_LABEL)]),
    heading,
    ...section,
    ...makerNoteFooter(view),
  ]);
  return [...children.slice(0, start), note, ...rest];
}

export function transformRoot(root, view = launchView()) {
  const scrollable = wrapScrollRegions(root.children, { nearestHeading: '' });
  return { ...root, children: wrapMakerNote(scrollable, view) };
}

export function taxfoldHastPlugin(view = launchView()) {
  return {
    name: 'taxfold',
    after(root, ctx) {
      ctx.replaceNode(root, transformRoot(root, view));
    },
  };
}
