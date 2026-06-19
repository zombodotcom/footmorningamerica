import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Footy's news/posts — SFW brand content. Each post is a Markdown file in
// src/content/news/. This content drives shareable traffic AND keeps adult
// links well under the legal one-third-of-site threshold.
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { news };
