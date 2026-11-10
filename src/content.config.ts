import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/lessons' }),
  schema: z.object({
    title: z.string(),
    module: z.number(), // 0 = introduction, 1–10 = modules, 11 = appendices
    number: z.string().optional(), // "1.1", "A"…
    summary: z.string().optional(),
  }),
});

export const collections = { lessons };
