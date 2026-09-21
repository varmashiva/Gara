// Runs before `vite build` (see package.json) and writes public/sitemap.xml
// so Vite copies it into dist/ like any other static asset. Pulls the live
// product/category list from the API so new products show up in the
// sitemap on the next deploy without a code change — but on any failure
// (API down, network hiccup during CI) this must never fail the build, so
// it falls back to just the static routes instead of throwing.
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const SITE_URL = 'https://garafoods.com';
const API_URL = 'https://api.garafoods.com/api/v1';

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/products', changefreq: 'daily', priority: '0.9' },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function getProductRoutes() {
  const res = await fetchJson(`${API_URL}/products?limit=100`);
  return res.data.items.map((p) => ({
    path: `/products/${p._id}`,
    changefreq: 'weekly',
    priority: '0.7',
  }));
}

function toXml(routes) {
  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${SITE_URL}${r.path}</loc>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  let routes = [...STATIC_ROUTES];
  try {
    routes = routes.concat(await getProductRoutes());
  } catch (err) {
    console.warn(`[generate-sitemap] Skipping product URLs, API fetch failed: ${err.message}`);
  }

  const outPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/sitemap.xml');
  writeFileSync(outPath, toXml(routes));
  console.log(`[generate-sitemap] Wrote ${routes.length} URLs to public/sitemap.xml`);
}

main();
