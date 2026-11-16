const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C;
    G.settings.cam = 'first';
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(8); document.getElementById('storyFade').style.display = 'none';
    G.local.limpT = 0; G.local.dazeT = 0;
  });
  const shots = [
    ['ward_west', -2.0, 0, 'W', 1], ['ward_beds', 1.0, 1.0, 'N', 1], ['corridor', 9.6, 0, 'E', 1], ['storage', 18, 2.8, 'S', 1], ['ward_dark', -3, 0.5, 'E', 0], ['ward_door', -6, 3, 'E', 1],
  ];
  for (const [name, x, z, dir, fl] of shots) {
    await page.evaluate(([x, z, dir, fl]) => {
      const C = window.__COW, { G, Zombies } = C, me = G.local;
      me.pos.set(x, 0.06, z); me.vel.set(0, 0, 0); const yaw = { E: -Math.PI / 2, W: Math.PI / 2, N: 0, S: Math.PI }[dir]; me.yaw = yaw; me.input.yaw = yaw; me.input.pitch = -0.08; Zombies.flashOn = !!fl;
      for (const q of G.fighters) if (q.zombie && q.alive) q.pos.set(40, 0, 40);
      C.simulate(0.3);
    }, [x, z, dir, fl]);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `zs_${name}.png` });
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
