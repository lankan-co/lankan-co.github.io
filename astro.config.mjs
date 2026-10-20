// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * GitHub Pages
 * ------------------------------------------------------------------
 * SITE_URL  → the origin, e.g. https://<user>.github.io (or your custom domain)
 * BASE_PATH → "/" for a user/org site or custom domain,
 *             "/<repo-name>" for a project site.
 * The included GitHub Actions workflow sets both automatically.
 */
const site = process.env.SITE_URL ?? 'https://lankan-co.github.io';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [react(), sitemap()],
  build: {
    // Inline CSS to remove the render-blocking stylesheet request (better FCP/LCP).
    inlineStylesheets: 'always',
  },
  prefetch: { prefetchAll: false },
  image: {
    // Responsive images default for <Image>/<Picture>
    layout: 'constrained',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
