const { chromium } = require('playwright'); const path = require('path');
const DEPS = __dirname + '/../deps/node_modules/';
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 2 });
  await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (r) => r.fulfill({ path: DEPS + 'three/' + r.request().url().split('three@0.160.0/')[1], contentType: 'text/javascript' }));
  await page.route('https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/**', (r) => r.fulfill({ path: DEPS + 'cannon-es/' + r.request().url().split('cannon-es@0.20.0/')[1], contentType: 'text/javascript' }));
  await page.goto('file://' + path.resolve(__dirname + '/../dist/Call of Washed.html'));
  await page.waitForFunction(() => window.__cowBooted, null, { timeout: 120000 });
  const O = process.env.OUT;
  const rd = await page.evaluate(() => { const C = window.__COW, r = {}; for (const n of [1, 2, 3, 6]) { C.Camp.setRead(n); C.UI.show('campaign'); r[n] = [...document.querySelectorAll('.cm-part h3')].map((e) => e.textContent).join(' | '); } C.Camp.setRead(2); C.G.settings.goreChosen = true; C.UI.closeOverlay(); C.UI.show('main'); return r; });
  console.log(JSON.stringify(rd, null, 1));
  await page.waitForTimeout(1500); await page.screenshot({ path: O + '/menu_principal.png' });
  await page.evaluate(() => window.__COW.UI.show('campaign')); await page.waitForTimeout(600); await page.screenshot({ path: O + '/campana_modo_lector.png' });
  await page.evaluate(() => window.__COW.Campaign.start('P0-I')); await page.waitForTimeout(2200); await page.screenshot({ path: O + '/cabecera_lugar_fecha_hora.png' });
  await page.evaluate(() => { window.__COW_SCENE_SPEED = 3; });
  for (let k = 0; k < 600; k++) {
    const st = await page.evaluate(() => { const C = window.__COW, S = C.Scenes.S, step = S.step || {}, I = C.Input.state;
      const aim = (p) => { const d = p.clone().sub(S.eye).normalize(); I.yaw = Math.atan2(-d.x, -d.z); I.pitch = Math.asin(d.y); };
      if (S.marks.length && S.marks.length >= 5) { window.__COW_SCENE_SPEED = 1; I.yaw = -Math.PI / 2 - 0.02; I.pitch = -0.25; S.lookKey = true; return 'look'; }
      if (S.line) { C.Scenes.advance(); C.Scenes.advance(); } else if (S.choice && step.kind === 'choice') C.Scenes.pick(step.ok + 1); else if (step.kind === 'gaze') aim(step.at(S));
      return S.i; });
    if (st === 'look') break; await page.waitForTimeout(150);
  }
  await page.waitForTimeout(2000); await page.screenshot({ path: O + '/mirar_en_el_furgon.png' });
  await browser.close();
})();
