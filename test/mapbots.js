// partidas rápidas con bots en cada mapa: muertes, bots atascados y errores
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(null, { norender: true });
  const maps = (process.argv[2] || 'pueblo,base,muelle,estacion,corcovado,patio,bunker,cruce').split(',');
  for (const map of maps) {
    const r = await page.evaluate((map) => { const C = window.__COW, { G, UI } = C; UI.launch({ mode: 'tdm', map, bots: 7, difficulty: 'normal', team: 0, env: 'day' });
      const st = G.fighters.map((f) => f.pos.clone()); let kills = 0; const off = C.BUS ? null : null;
      const d0 = G.fighters.map((f) => f.deaths || 0); C.simulate(45);
      const deaths = G.fighters.reduce((a, f, i) => a + ((f.deaths || 0) - d0[i]), 0);
      const moved = G.fighters.filter((f, i) => f !== G.local && f.pos.distanceTo(st[i]) > 4).length;
      const below = G.fighters.filter((f) => f.pos.y < -3.5).length;
      return { map, deaths, moved, bots: G.fighters.length - 1, below, score: G.match && G.match.score ? JSON.stringify(G.match.score) : '' }; }, map);
    console.log(JSON.stringify(r));
  }
  console.log(JSON.stringify(logs.filter((l) => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 8)));
  await browser.close();
})();
