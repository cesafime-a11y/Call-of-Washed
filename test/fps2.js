const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(undefined, { norender: true });
  await page.evaluate((n) => { window.__N = n; }, +process.env.N || 11);
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI, Combat, PHYS, Grenades, THREE: T } = C;
    UI.launch({ mode: 'ffa', map: 'pueblo', bots: 11, difficulty: 'normal', team: 0 });
    C.simulate(4);
    const me = G.local, out = {};
    const cnt = () => { let dyn = 0, awake = 0; for (const b of PHYS.world.bodies) if (b.type === 1) { dyn++; if (b.sleepState !== 2) awake++; } return dyn + '/' + awake; };
    out.before_dyn_awake = cnt();
    const c = me.pos.clone();
    const N = +(window.__N || 11); G.fighters.forEach((f, i) => { if (f !== me && i <= N) { f.pos.set(c.x + 3 + (i % 4) * 0.7, c.y, c.z + 3 + Math.floor(i / 4) * 0.7); f.vel.set(0, 0, 0); f.invulnT = 0; } });
    me.pos.set(c.x - 8, c.y, c.z - 8);
    // acumular tiempo de PHYS.step
    let phys = 0; const orig = PHYS.step.bind(PHYS); PHYS.step = (dt) => { const a = performance.now(); orig(dt); phys += performance.now() - a; };
    Combat.explode({ pos: new T.Vector3(c.x + 4, c.y + 0.3, c.z + 4), radius: 40, damage: 500, push: 20, owner: me, weapon: 'frag', authoritative: true });
    out.after_explode_dyn_awake = cnt();
    const a = performance.now(); C.simulate(1, 1); out.sim1s = +(performance.now() - a).toFixed(0); out.phys1s = +phys.toFixed(0);
    out.after1s_dyn_awake = cnt();
    phys = 0; const b = performance.now(); C.simulate(3, 1); out.sim3s = +(performance.now() - b).toFixed(0); out.phys3s = +phys.toFixed(0); out.after4s_dyn_awake = cnt();
    return out;
  });
  console.log(JSON.stringify(r)); await browser.close();
})();
