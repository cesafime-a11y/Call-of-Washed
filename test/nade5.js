const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, {});
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C; G.settings.cam = 'first';
    UI.launch({ mode: 'tdm', map: 'pueblo', bots: 1, difficulty: 'normal', team: 0 }); C.simulate(9);
    const me = G.local; G.fighters.forEach(f => { if (f !== me) f.pos.set(me.pos.x + 60, 0, me.pos.z + 60); });
    me.input.pitch = 0.25; C.Input.state.pitch = 0.25; me.grenades = 3; C.Input.mouseL = false; C.Input.state.grenade = true; C.Input.is = (k) => k === 'grenade' ? true : false; 
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/home/claude/test/nade5_preview.png' });
  // soltar y ver la granada en el suelo cerca
  await page.evaluate(() => { const C = window.__COW, me = C.G.local; C.Input.state.grenade = false; C.Input.is = () => false; me.grenadeCook = null; C.Input.state.pitch = -0.35; me.input.pitch = -0.35; C.Grenades.throwFrom(me, 8, 'frag', true); });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: '/home/claude/test/nade5_ground.png' });
  console.log(await page.evaluate(() => window.__COW.Grenades.list.length + ' nades'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 5).join('\n'));
  await browser.close();
})();
