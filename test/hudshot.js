// capturas del HUD en partida (MP) y en el campo de tiro
const { open } = require('./lib');
(async () => {
  const OUT = process.env.OUT || '/home/user/shots';
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720, fonts: true, dpr: +(process.env.DPR || 1) });
  await page.evaluate(() => { const C = window.__COW; C.G.settings.goreChosen = true; C.UI.launch({ mode: 'tdm', map: 'pueblo', bots: 7, difficulty: 'normal', team: 0, env: 'day' }); C.simulate(6); });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: OUT + '/hud_tdm.png' });
  await page.evaluate(() => { const C = window.__COW; const f = C.G.local; f.hp = 35; f.lastDamageT = C.G.time; });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '/hud_herido.png' });
  console.log(JSON.stringify(logs.slice(0, 8)));
  await browser.close();
})();
