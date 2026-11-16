const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { norender: true });
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI, Combat, THREE: T, PHYS, CONFIG } = C;
    UI.launch({ mode: 'ffa', map: 'pueblo', bots: 11, difficulty: 'normal', team: 0 });
    C.simulate(9);
    const me = G.local, c = me.pos.clone(), bots = G.fighters.filter(f => f !== me), out = {};
    bots.forEach((f, i) => { f.pos.set(c.x + 6 + (i % 4) * 1.2, c.y, c.z + 6 + Math.floor(i / 4) * 1.2); f.vel.set(0, 0, 0); f.invulnT = 0; f.brain = null; });
    C.simulate(0.5);
    let phys = 0, n = 0; const orig = PHYS.step.bind(PHYS); PHYS.step = (dt) => { const a = performance.now(); orig(dt); phys += performance.now() - a; n++; };
    const run = (sec) => { phys = 0; n = 0; C.simulate(sec, 1); return +(phys / n).toFixed(2); };
    out.idle = run(1);
    const kill = (v) => Combat.hit({ target: v, attacker: me, damage: 999, kind: 'bullet', weapon: 'rifle', part: 'torso', point: v.pos.clone().setY(1.2), impulse: new T.Vector3(3, 0, 3), shot: 1 });
    kill(bots[0]); out.k1_first1s = run(1); out.k1_1to2 = run(1); out.k1_2to3 = run(1); out.k1_3to4 = run(1); out.k1_4to5 = run(1);
    for (let i = 1; i < 4; i++) kill(bots[i]); out.k4_first1s = run(1); out.k4_1to2 = run(1); out.k4_2to3 = run(1); out.k4_3to4 = run(1);
    out.bodies = PHYS.world.bodies.length; out.stat = PHYS.world.bodies.filter(b => b.type === 2).length;
    return out;
  });
  console.log(JSON.stringify(r)); console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 5).join('\n'));
  await browser.close();
})();
