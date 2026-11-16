const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 800, h: 450 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => { const C = window.__COW; C.UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' }); C.simulate(7); const me = C.G.local; me.hp = 50; C.Inv.add('med', 1); C.Inv.startUse('med'); });
  for (let i = 0; i < 4; i++) { await page.waitForTimeout(400); console.log(await page.evaluate(() => { const C = window.__COW, u = C.Inv.use, el = document.getElementById('invUse'); return JSON.stringify({ u, disp: el && el.style.display, parent: el && el.parentElement.id, phase: C.G.match.phase, hud: document.getElementById('hud').hidden, rect: el && el.getBoundingClientRect() }); })); }
  await browser.close();
})();
