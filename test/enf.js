const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C;
    G.settings.cam = 'first';
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(8); document.getElementById('storyFade').style.display = 'none';
    G.local.limpT = 0; G.local.dazeT = 0; G.local.invulnT = 999;
  });
  const shots = (process.env.SHOTS || 'a').split(',');
  const all = { a: ['enf_oeste', 7.5, 0.3, 'W', 1, -0.12], b: ['enf_camas', 1.0, 2.8, 'N', 1, -0.1], c: ['enf_curas', -6.5, 0.3, 'W', 1, -0.1], d: ['enf_puerta', -2, -0.6, 'E', 1, -0.08], e: ['enf_sur', 0, -3.4, 'S', 1, -0.12], f: ['enf_oscura', -2, 0.4, 'W', 0, -0.05], g: ['enf_curas2', -9.6, 1.2, 'N', 1, -0.22], h: ['enf_escritorio', -9.3, 2.0, 'S', 1, -0.2] };
  for (const k of shots) {
    const [name, x, z, dir, fl, pitch] = all[k];
    await page.evaluate(([x, z, dir, fl, pitch]) => {
      const C = window.__COW, { G, Zombies } = C, me = G.local;
      me.pos.set(x, 0.06, z); me.vel.set(0, 0, 0); const yaw = { E: -Math.PI / 2, W: Math.PI / 2, N: 0, S: Math.PI }[dir]; C.Input.state.yaw = yaw; C.Input.state.pitch = pitch; Zombies.flashOn = !!fl;
      for (const q of G.fighters) if (q.zombie && q.alive) q.pos.set(40, 0, 40);
      C.simulate(0.3);
    }, [x, z, dir, fl, pitch]);
    await page.waitForTimeout(1600);
    await page.screenshot({ path: `${name}.png` });
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
