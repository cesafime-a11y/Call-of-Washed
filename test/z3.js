const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 640, h: 360 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(async () => {
    const C = window.__COW, { G, UI } = C; const out = [];
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(1);
    const me = G.local;
    for (let i = 0; i < 40; i++) {
      C.simulate(2);
      const z = G.fighters.filter(f => f.zombie && f.alive);
      out.push(`t=${G.match.time.toFixed(0)} hp=${me.hp.toFixed(0)} alive=${me.alive} ph=${G.match.phase} z=` + z.map(f => `${f.pos.x.toFixed(1)},${f.pos.z.toFixed(1)}:${f.brain.st}`).join(' | '));
      if (G.match.phase === 'matchEnd') break;
    }
    return out;
  });
  console.log(r.join('\n'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
