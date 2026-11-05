// @ts-check
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { assertFullHistory, lastmodForPath } from './src/lib/lastmod.mjs';

assertFullHistory();

export default defineConfig({
  site: 'https://taxfold.app',
  trailingSlash: 'always',
  // Astro 7's default compression drops the newline between a word and the inline tag after it ("and<a"),
  // which renders as run-together words. The adjacency test in tests/site.test.ts pins it.
  compressHTML: false,
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
