const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(process.env.FILE, { w: 640, h: 360 });
  const r = await page.evaluate(async () => {
    window.__COW_TEST = true; const C = window.__COW, { G, UI } = C; G.settings.goreChosen = true; G.settings.cam = 'third';
    UI.launch({ mode: 'ffa', map: 'patio', bots: 7, difficulty: 'normal', team: 0 });
    await new Promise((res) => setTimeout(res, 2500));
    const log = [G.renderer.info.programs.length]; let lastN = log[0]; const at = [];
    for (let i = 0; i < 45; i++) { await new Promise((res) => setTimeout(res, 1000)); const P = G.renderer.info.programs, n = P.length; if (n !== lastN) { at.push(i + 's:' + P.slice(lastN).map((p) => p.name + '|' + (p.cacheKey || '').slice(0, 60)).join(' ; ')); lastN = n; } }
    return { start: log[0], end: lastN, at, kills: G.fighters.reduce((a, f) => a + f.stats.kills, 0), deaths: G.local.stats.deaths };
  });
  console.log(JSON.stringify(r)); await browser.close();
})();
