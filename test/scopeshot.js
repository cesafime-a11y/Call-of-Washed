const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => {
    const C = window.__COW, { G, UI, CONFIG } = C; G.settings.cam = 'first'; G.settings.goreChosen = true;
    UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2);
    const me = G.local; me.invulnT = 999; me.inv.sniper = { mag: 5, reserve: 25 }; me.weapon = null; me.setWeapon('sniper'); me.switchT = 0;
    me.pos.set(0, 12.06, 21); me.vel.set(0, 0, 0); me.zero = 600;
    const t = G.fighters.find((f) => f.station && f.station.name === '626 m');
    const dx = t.pos.x - 0, dz = t.pos.z - 21; C.Input.state.yaw = Math.atan2(-dx, -dz); C.Input.state.pitch = Math.atan2(t.pos.y + 1.2 - 13.6, Math.hypot(dx, dz));
    C.Input.mouseR = true; C.Input.state.aim = true; C.simulate(1.2);
  });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/claude-0/w/shots/scope_626.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
