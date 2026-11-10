import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Set SITE / BASE env vars when deploying under a sub-path (e.g. GitHub Pages project sites).
export default defineConfig({
  site: process.env.SITE || undefined,
  base: process.env.BASE || '/',
  trailingSlash: 'always',
  integrations: [mdx()],
});
