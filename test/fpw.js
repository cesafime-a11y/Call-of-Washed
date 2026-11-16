// vista en primera persona por arma: node fpw.js id1,id2 prefijo   (ATT='{"optic":"x2"}' opcional)
const { open } = require('./lib');
(async () => {
  const ids = (process.argv[2] || 'pistol,sniper').split(',');
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => { const C = window.__COW, { G, UI } = C; G.settings.cam = 'first'; UI.launch({ mode: 'tdm', map: 'pueblo', bots: 1, difficulty: 'normal', team: 0 }); C.simulate(9); const me = G.local; G.fighters.forEach(f => { if (f !== me) f.pos.set(me.pos.x + 60, 0, me.pos.z + 60); }); document.getElementById('hud').style.display = 'none'; });
  for (const id of ids) {
    await page.evaluate((id) => { const C = window.__COW, me = C.G.local; if (!me.inv[id]) me.inv[id] = { mag: 20, reserve: 60 }; me.weapon = null; me.setWeapon(id); me.switchT = 0; me.input.pitch = 0; C.simulate(1.2, 1); }, id);
    await page.waitForTimeout(600);
    await page.screenshot({ path: `/home/claude/test/fp_${process.argv[3] || 'w'}_${id}.png`, clip: { x: 480, y: 260, width: 800, height: 460 } });
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 5).join('\n'));
  await browser.close();
})();
