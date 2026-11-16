// dispara cada arma en el campo de tiro y en un duelo por equipos: munición baja y sin errores
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { w: 960, h: 540 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  for (const mode of ['range', 'tdm']) {
    const r = await page.evaluate((mode) => {
      const C = window.__COW, { G, UI, CONFIG } = C;
      UI.launch(mode === 'range' ? { mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 } : { mode: 'tdm', map: 'pueblo', bots: 5, difficulty: 'normal', team: 0, fac: 'av' });
      C.simulate(4); const me = G.local, out = {};
      for (const id of [...CONFIG.PRIMARIES, ...CONFIG.SECONDARIES]) {
        me.inv[id] = { mag: CONFIG.WEAPONS[id].mag, reserve: 50 }; me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 99; me.hp = 100;
        C.simulate(1); const m0 = me.inv[id].mag; me.input.fireCount++; C.simulate(0.4); out[id] = m0 - me.inv[id].mag;
      }
      return out;
    }, mode);
    console.log(mode, JSON.stringify(r));
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
