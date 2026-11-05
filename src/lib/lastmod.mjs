// Sitemap <lastmod> and the on-page "Last updated" date come from git, never from build time:
// Google uses lastmod only when it is "consistently and verifiably accurate", so a date that moves on
// every deploy would teach it to ignore ours.
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const git = (cwd, args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

export function assertFullHistory(cwd = process.cwd()) {
  if (git(cwd, ['rev-parse', '--is-shallow-repository']) === 'true') {
    throw new Error(
      'lastmod: shallow clone — every page would carry the clone commit date. Check out with fetch-depth: 0.',
    );
  }
}

// A file with uncommitted edits is dated today (UTC midnight, so the build and the tests agree): it is being
// edited, and CI builds a clean tree.
export function lastEdited(file, cwd = process.cwd()) {
  if (!existsSync(join(cwd, file))) throw new Error(`lastmod: no such source file ${file}`);
  if (git(cwd, ['status', '--porcelain', '--', file]) !== '') return new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  const iso = git(cwd, ['log', '-1', '--format=%cI', '--', file]);
  if (!iso) throw new Error(`lastmod: ${file} has no commit`);
  return new Date(iso);
}

export const GUIDES_DIR = 'src/content/guides';

export const guideFiles = (cwd = process.cwd()) => {
  const dir = join(cwd, GUIDES_DIR);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => `${GUIDES_DIR}/${f}`);
};

// The landing page lists every guide, so a new or edited guide changes the landing page too.
export function sourcesForPath(pathname, cwd = process.cwd()) {
  const path = pathname.replace(/^\/|\/$/g, '');
  if (path === '') return ['src/pages/index.astro', ...guideFiles(cwd)];
  const guide = path.match(/^guides\/([^/]+)$/);
  if (guide) return [`${GUIDES_DIR}/${guide[1]}.md`];
  return [`src/pages/${path}.astro`];
}

export function lastmodForPath(pathname, cwd = process.cwd()) {
  const dates = sourcesForPath(pathname, cwd).map((f) => lastEdited(f, cwd));
  return new Date(Math.max(...dates.map((d) => d.getTime())));
}
