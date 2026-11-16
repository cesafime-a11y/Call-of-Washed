// explosión junto al jugador en tercera persona: capturas durante el derribo y al levantarse
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { w: 960, h: 540 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'third'; C.UI.launch({ mode: 'range', map: 'campo', bots: 4, difficulty: 'normal', team: 0 }); C.simulate(2);
    const me = C.G.local; me.pos.set(0, 0.06, 12); C.Input.state.yaw = 0.6; C.Input.state.pitch = -0.15; C.simulate(0.5);
    if(window.__BOOM)C.Combat.explode({ pos: me.pos.clone().add(new C.THREE.Vector3(3.2, 0.3, 1.0)), radius: 6, damage: 25, push: 9, owner: null, weapon: 'barrel' });
  });
  const ts = [0.1, 0.5, 1.2, 2.5, 4];
  let prev = 0;
  for (const t of ts) {
    const info = await page.evaluate((dt) => { const C = window.__COW, me = C.G.local; C.simulate(dt); return { st: me.state, hp: Math.round(me.hp), alive: me.alive }; }, t - prev); prev = t;
    await page.waitForTimeout(500);
    await page.screenshot({ path: `/tmp/claude-0/w/shots/base_${t}.png` }); console.log(t, JSON.stringify(info));
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
