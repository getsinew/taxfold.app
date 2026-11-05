// @ts-check
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { assertFullHistory, lastmodForPath } from './src/lib/lastmod.mjs';

assertFullHistory();

export default defineConfig({
  site: 'https://taxfold.app',
  trailingSlash: 'always',
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
