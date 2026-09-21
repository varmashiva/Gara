// Runs after `vite build` (postbuild, see package.json) — reads the routes
// already written to dist/sitemap.xml by generate-sitemap.mjs, loads each
// one in headless Chromium against a local static server for the build we
// just produced, and overwrites dist/<route>/index.html with the rendered
// HTML (script/link tags survive, since they're part of the live DOM
// puppeteer serializes — the client bundle still loads and takes over
// exactly as before). This is purely for crawlers/link-preview bots that
// don't execute JS; real users get the same SPA, just painted immediately
// instead of from an empty <div id="root">.
//
// This must NEVER fail the build — if Chromium can't launch (missing
// system libs in Hostinger's build container, out of memory, etc.) or any
// route fails to render, log it and exit 0 so the plain, un-prerendered
// build still ships. A broken build here would mean no deploy at all,
// which is strictly worse than shipping without prerendering.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const PORT = 4600;

function getRoutesFromSitemap() {
  const xml = readFileSync(path.join(DIST, 'sitemap.xml'), 'utf8');
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((m) => new URL(m[1]).pathname);
}

function outputPathFor(route) {
  if (route === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, route.replace(/^\//, ''), 'index.html');
}

async function main() {
  const routes = getRoutesFromSitemap();
  console.log(`[prerender] ${routes.length} routes to render: ${routes.join(', ')}`);

  const { preview } = await import('vite');
  const puppeteer = (await import('puppeteer')).default;

  const server = await preview({ root: ROOT, preview: { port: PORT, strictPort: true } });
  const baseUrl = `http://localhost:${PORT}`;

  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      // The app calls the production API (api.garafoods.com) from this
      // local preview origin, which the API's CORS policy correctly
      // rejects for real browsers — but there's no real user here, just
      // an automated snapshot of our own site, so disabling it is safe
      // in this one-off, non-interactive build context.
      '--disable-web-security',
    ],
  });

  let rendered = 0;
  try {
    const page = await browser.newPage();
    for (const route of routes) {
      try {
        await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 30000 });
        const html = await page.content();
        const outPath = outputPathFor(route);
        mkdirSync(path.dirname(outPath), { recursive: true });
        writeFileSync(outPath, html);
        rendered++;
      } catch (err) {
        console.warn(`[prerender] Skipping ${route}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.httpServer.close(resolve));
  }

  console.log(`[prerender] Rendered ${rendered}/${routes.length} routes`);
}

main().catch((err) => {
  console.warn(`[prerender] Skipped entirely, build continues without it: ${err.message}`);
});
