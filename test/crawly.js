const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(undefined, { w: 800, h: 450, norender: true });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C, out = [];
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(1);
    C.Zombies.spawnOne({ goal: { x: -2, y: 0.06, z: 0 } });
    const f = G.fighters.find(q => q.zombie && q.alive);
    f.pos.set(-2, 0.06, 0); f.crawler = true; f.speedMul = 0;
    C.simulate(4);
    out.push('pos.y=' + f.pos.y.toFixed(3) + ' proneT=' + (f.proneT||0).toFixed(2) + ' view keys: ' + Object.keys(f.view||{}).slice(0,12).join(','));
    const v = f.view; if (!v) return out;
    v.root && out.push('root y=' + v.root.position.y.toFixed(3));
    const J = v.J || v.joints; 
    if (J) { for (const k of Object.keys(J)) { const o = J[k]; const p = new C.THREE.Vector3(); o.getWorldPosition(p); out.push(k + ' ' + p.y.toFixed(3)); } }
    return out;
  });
  console.log(r.join('\n')); await browser.close();
})();
