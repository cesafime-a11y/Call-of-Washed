const { chromium } = require('playwright');
const path = require('path');
const DEPS = process.env.COW_DEPS || (__dirname + '/../deps/node_modules/');
async function open(file, opts = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: opts.w || 1280, height: opts.h || 720 } });
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (r) => { const u = r.request().url().split('three@0.160.0/')[1]; r.fulfill({ path: DEPS + 'three/' + u, contentType: 'text/javascript' }); });
  await page.route('https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/**', (r) => { const u = r.request().url().split('cannon-es@0.20.0/')[1]; r.fulfill({ path: DEPS + 'cannon-es/' + u, contentType: 'text/javascript' }); });
  await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  if (opts.norender) await page.addInitScript(() => { window.__COW_NORENDER = true; });
  await page.goto('file://' + path.resolve(file || (__dirname + '/../dist/Call of Washed.html')));
  await page.waitForFunction(() => window.__cowBooted && window.__COW && window.__COW.G, null, { timeout: 120000 });
  return { browser, page, logs };
}
module.exports = { open };
