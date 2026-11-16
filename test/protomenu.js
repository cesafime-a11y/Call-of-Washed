const { open } = require('./lib');
(async () => {
  const dir = process.argv[2];
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW, s = C.G.settings; s.goreChosen = true; C.UI.closeOverlay && C.UI.closeOverlay(); s.cls = 'custom'; s.loadout = { ...(s.loadout || {}), primary: 'rifle', secondary: 'pistol', att: { muzzle: 'bayo', grip: 'sling' } }; C.UI.show('gunsmith'); });
  await page.waitForTimeout(2500); await page.screenshot({ path: dir + '/gs_rifle.png' });
  await page.evaluate(() => { const C = window.__COW, s = C.G.settings; s.loadout.primary = 'smg'; s.loadout.att = {}; C.UI.show('gunsmith'); });
  await page.waitForTimeout(2500); await page.screenshot({ path: dir + '/gs_smg.png' });
  await page.evaluate(() => { const C = window.__COW; C.G.settings.cam = 'third'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2); const me = C.G.local; me.invulnT = 999; me.pos.set(0, 0.06, 12); C.Input.state.yaw = 2.6; C.simulate(1); });
  await page.waitForTimeout(900); await page.screenshot({ path: dir + '/tp.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
