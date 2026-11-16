const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 800, h: 450, norender: true });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI, Zombies } = C, out = [];
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    const me = () => G.local;
    // jugador quieto en la sala de curas, linterna encendida: ¿lo encuentran?
    C.simulate(1); me().pos.set(-10.3, 0.06, 2.6); me().invulnT = 9999;
    let first = null;
    for (let t = 0; t < 150; t += 1) {
      C.simulate(1); me().pos.set(-10.3, 0.06, 2.6); me().vel.set(0, 0, 0); me().hp = 100; if (t % 8 === 0) C.BotNoise.add(me(), me().pos, 1.2);
      const zs = G.fighters.filter((f) => f.zombie && f.alive);
      if (t % 10 === 0) out.push(`t=${G.match.time.toFixed(0)} ` + zs.map((z) => `[${z.pos.x.toFixed(1)},${z.pos.z.toFixed(1)} ${z.brain.st} p${z.brain.path ? z.brain.path.length + "/" + z.brain.pi : "-"}${z.zAtk ? ' ' + z.zAtk.kind : ''}${z.zGrab ? ' GRAB' : ''}]`).join(' '));
      if (!first && zs.some((z) => z.pos.distanceTo(me().pos) < 1.8)) first = G.match.time;
    }
    out.push('first contact at ' + first);
    return out;
  });
  console.log(r.join('\n'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
