const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(undefined, { w: 1100, h: 600 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C; G.settings.cam = 'first';
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(8); document.getElementById('storyFade').style.display = 'none';
    const me = G.local; me.limpT = 0; me.invulnT = 999; me.hp = 100;
    const zs = G.fighters.filter(q => q.zombie);
    C.Zombies.spawnOne({ goal: { x: 0, y: 0.06, z: 0 } }); C.Zombies.spawnOne({ goal: { x: 0, y: 0.06, z: 0 } });
    const a = G.fighters.filter(q => q.zombie && q.alive);
    a[0].pos.set(-2.5, 0.06, 0.8); a[0].crawler = true; a[0].speedMul = 0; a[0].hp = 90;
    a[1].pos.set(-2.5, 0.06, -0.8); a[1].vel.set(0,0,0);
    me.pos.set(-4.5, 0.2, 0.0); C.Input.state.yaw = -Math.PI / 2; C.Input.state.pitch = -0.02; a[1].pos.set(-2.5, 0.06, -0.4); a[0].pos.set(-2.5, 0.06, 0.5);
    C.simulate(1);
    C.Rules.kill(a[1], { kind: 'gun', weapon: 'p9', killer: me });
    C.simulate(2.5);
  });
  await page.waitForTimeout(1200); await page.screenshot({ path: 'sink2.png' });
  await browser.close();
})();
