import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const guides = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/guides' }),
  schema: z.object({
    title: z.string().max(70),
    description: z.string().min(50).max(160),
    cluster: z.string(),
  }),
});

export const collections = { guides };
