// Astro caches rendered Markdown (the maker note) under node_modules/.astro without knowing the note depends on the
// launch state, so astro.config.mjs puts that cache under a directory named by launchCacheKey(): the effective
// launch values plus the source of the code that renders the note.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { effectiveLaunch } from './launch-state.mjs';

export const CACHE_PREFIX = '.astro-';
const RENDERING_SOURCES = ['launch-state.mjs', 'hast-taxfold.mjs'];
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

const renderingSources = () => RENDERING_SOURCES.map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'));

export function launchCacheKey(sources = renderingSources()) {
  return createHash('sha256').update(JSON.stringify([effectiveLaunch(), sources])).digest('hex').slice(0, 12);
}

// Every distinct key leaves a directory behind. Age, not "not the current key", decides: a build running the
// other launch state beside this one must keep its cache.
export function pruneStaleLaunchCaches(root, keepKey, staleAfterMs = STALE_AFTER_MS) {
  for (const entry of readdirSync(root)) {
    if (!entry.startsWith(CACHE_PREFIX) || entry === `${CACHE_PREFIX}${keepKey}`) continue;
    // A concurrent build's prune may have removed it between the listing and now.
    const stats = statSync(join(root, entry), { throwIfNoEntry: false });
    if (stats && Date.now() - stats.mtimeMs > staleAfterMs) rmSync(join(root, entry), { recursive: true, force: true });
  }
}
