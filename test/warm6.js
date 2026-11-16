const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(process.env.FILE, { w: 640, h: 360 });
  const r = await page.evaluate(async () => {
    window.__COW_TEST = true; const C = window.__COW, { G, UI } = C; G.settings.goreChosen = true; G.settings.cam = 'third';
    UI.launch({ mode: 'ffa', map: 'patio', bots: 7, difficulty: 'normal', team: 0 });
    const out = [];
    for (let i = 0; i < 8; i++) { await new Promise((res) => setTimeout(res, 1000)); out.push([C.Renderer.warmed || 0, C.Renderer.warmIn, C.Renderer.frames, G.renderer.info.programs.length]); }
    return out;
  });
  console.log(JSON.stringify(r)); await browser.close();
})();
