// mide el coste de cada paso de simulación en una partida con bots (sin dibujar): picos = tirones
const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(undefined, { norender: true, w: 800, h: 450 });
  const r = await page.evaluate(() => {
    window.__COW_TEST = true; const C = window.__COW, { G, UI } = C; G.settings.goreChosen = true;
    const out = {};
    for (const [mode, map] of [['tdm', 'pueblo'], ['ffa', 'patio'], ['dom', 'muelle']]) {
      UI.launch({ mode, map, bots: 9, difficulty: 'normal', team: 0 }); C.simulate(2);
      const ts = [];
      for (let i = 0; i < 60 * 40; i++) { const t0 = performance.now(); C.simulate(1 / 60); ts.push(performance.now() - t0); }
      ts.sort((a, b) => a - b);
      const q = (p) => +ts[Math.floor(p * (ts.length - 1))].toFixed(2);
      out[mode + '/' + map] = { p50: q(0.5), p95: q(0.95), p99: q(0.99), max: q(1), over16: ts.filter((t) => t > 16).length, over33: ts.filter((t) => t > 33).length };
      UI.quitToMenu();
    }
    return out;
  });
  console.log(JSON.stringify(r, null, 1));
  await browser.close();
})();
