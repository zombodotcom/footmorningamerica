// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  adapter: netlify(),
  site: process.env.PUBLIC_SITE_URL ?? 'https://footmorningamerica.com',
  vite: {
    plugins: [tailwindcss()],
  },
});
