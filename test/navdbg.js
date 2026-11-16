const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(undefined, { w: 800, h: 450, norender: true });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C;
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(1);
    const nav = C.MapSys && C.MapSys.nav;
    if (!nav) return 'no nav; keys=' + Object.keys(C).join(',');
    const near = nav.nodes.filter(n => n.x > 5 && n.x < 13 && n.z > -3 && n.z < 4 && n.y < 1).map(n => `(${n.x.toFixed(2)},${n.z.toFixed(2)} y${n.y.toFixed(2)} L${(n.links||n.edges||[]).length})`);
    return 'nodes ' + nav.nodes.length + '\n' + near.join(' ');
  });
  console.log(r); await browser.close();
})();
