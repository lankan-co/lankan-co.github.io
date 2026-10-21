import type { APIRoute } from 'astro';

/** robots.txt with an absolute sitemap URL that respects SITE_URL + BASE_PATH. */
export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const sitemap = new URL(`${base}sitemap-index.xml`, site);
  // The invoice studio (public/invoice/) is an internal tool, so keep crawlers out of it
  return new Response(`User-agent: *\nAllow: /\nDisallow: ${base}invoice/\n\nSitemap: ${sitemap.href}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
