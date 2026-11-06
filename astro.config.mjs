// @ts-check
import { fileURLToPath } from 'node:url';
import { satteri } from '@astrojs/markdown-satteri';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { taxfoldHastPlugin } from './src/lib/hast-taxfold.mjs';
import { assertFullHistory, lastmodForPath } from './src/lib/lastmod.mjs';
import { CACHE_PREFIX, launchCacheKey, pruneStaleLaunchCaches } from './src/lib/launch-cache.mjs';

assertFullHistory();

const cacheKey = launchCacheKey();
pruneStaleLaunchCaches(fileURLToPath(new URL('./node_modules', import.meta.url)), cacheKey);

export default defineConfig({
  site: 'https://taxfold.app',
  trailingSlash: 'always',
  cacheDir: `./node_modules/${CACHE_PREFIX}${cacheKey}`,
  // Astro 7's default compression drops the newline between a word and the inline tag after it ("and<a"),
  // which renders as run-together words. The adjacency test in tests/site.test.ts pins it.
  compressHTML: false,
  // Astro 7 renders Markdown with Sätteri; markdown.rehypePlugins would throw without @astrojs/markdown-remark.
  markdown: {
    syntaxHighlight: false,
    processor: satteri({ hastPlugins: [taxfoldHastPlugin()] }),
  },
  integrations: [
    sitemap({
      serialize(item) {
        item.lastmod = lastmodForPath(new URL(item.url).pathname).toISOString();
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
