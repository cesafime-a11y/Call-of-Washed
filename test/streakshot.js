const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C;
    UI.launch({ mode: 'tdm', map: 'campo', bots: 3, difficulty: 'normal', team: 0, env: 'day', seed: 3 });
    C.simulate(4); const me = G.local; me.invulnT = 999; me.pos.set(0, 0.06, 12);
    C.Streaks.start(me, 'air', 0, -30, 0, 5, true); C.Streaks.start(me, 'uav', 0, 0, 0, 1, true); C.Streaks.start(me, 'supply', 3, 6, 0, 1, true);
    C.CAM.mode = 'third'; C.Input.state.yaw = 0; C.Input.state.pitch = 0.55;
  });
  await page.waitForTimeout(3700);
  await page.screenshot({ path: '/tmp/claude-0/w/shots/streak_air.png' });
  await page.evaluate(() => { const C = window.__COW; C.Input.state.pitch = -0.2; });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/claude-0/w/shots/streak_crate.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
