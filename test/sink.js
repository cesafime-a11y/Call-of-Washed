const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(undefined, { w: 800, h: 450, norender: true });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI, Combat } = C; C.Rules = C.Rules, out = [];
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(1);
    const z = C.Zombies.spawnOne({ goal: { x: -2, y: 0.06, z: 0 } }); 
    const f = G.fighters.find(q => q.zombie && q.alive);
    f.pos.set(-2, 0.06, 0); f.vel.set(0,0,0);
    C.simulate(1);
    out.push('stand y=' + f.pos.y.toFixed(3));
    Combat.hit && 0;
    f.hp = 0; try { C.Rules.kill(f, { kind: 'gun', weapon: 'p9', killer: G.local }); } catch (e) { out.push('err ' + e.message); }
    C.simulate(0.2); out.push('state=' + f.state + ' alive=' + f.alive);
    C.simulate(3);
    const rg = f.ragdoll || (f.view && f.view.ragdoll);
    out.push('keys=' + Object.keys(f).filter(k => /rag|corp|dead/i.test(k)).join(','));
    const ys = [];
    for (const b of (C.PHYS.world.bodies)) if (b.type !== 2 && b.mass > 0) ys.push(b.position.y.toFixed(3));
    out.push('dyn body y: ' + ys.slice(0, 20).join(' '));
    return out;
  });
  console.log(r.join('\n')); await browser.close();
})();
