const { chromium } = require('playwright'); const path = require('path');
const DEPS = process.env.COW_DEPS;
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 640, height: 360 }, deviceScaleFactor: 2 });
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (r) => { const u = r.request().url().split('three@0.160.0/')[1]; r.fulfill({ path: DEPS + 'three/' + u, contentType: 'text/javascript' }); });
  await page.route('https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/**', (r) => { const u = r.request().url().split('cannon-es@0.20.0/')[1]; r.fulfill({ path: DEPS + 'cannon-es/' + u, contentType: 'text/javascript' }); });
  await page.route(/fonts\.(googleapis|gstatic)/, (r) => r.abort());
  await page.goto('file://' + path.resolve(process.env.FILE));
  await page.waitForFunction(() => window.__cowBooted && window.__COW && window.__COW.G, null, { timeout: 120000 });
  const r = await page.evaluate(async () => { const C = window.__COW, { G, UI } = C; G.settings.goreChosen = true; UI.launch({ mode: 'tdm', map: 'pueblo', bots: 5, difficulty: 'normal', team: 0 }); G.local.pos.set(0,0.06,0); C.simulate(1); const a = G.renderer.getPixelRatio(); await new Promise((res) => setTimeout(res, 4000)); return { start: a, after20s: G.renderer.getPixelRatio(), dyn: JSON.stringify(C.Renderer.dyn), scr: UI.screen, fr: C.Renderer.frames, canvas: [G.renderer.domElement.width, G.renderer.domElement.height] }; });
  console.log(JSON.stringify(r)); await page.screenshot({ path: process.env.OUT }); await browser.close();
})();
