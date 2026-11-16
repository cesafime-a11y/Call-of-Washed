const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { w: 640, h: 360 });
  const r = await page.evaluate(async () => {
    window.__COW_TEST = true; const C = window.__COW, { G, UI } = C; G.settings.goreChosen = true; G.settings.cam = 'third';
    UI.launch({ mode: 'ffa', map: 'patio', bots: 7, difficulty: 'normal', team: 0 });
    const a = G.renderer.info.programs.length;
    await new Promise((res) => setTimeout(res, 8000));
    const b = G.renderer.info.programs.length;
    const W = []; const ow = console.warn; console.warn = (...x) => { W.push(String(x[0]) + ' ' + String(x[1] && x[1].stack || x[1]).slice(0, 300)); ow(...x); }; C.Renderer.warm(); const c = G.renderer.info.programs.length; window.__W = W;
    return { W: window.__W, a, b, c, hasWarm: !!C.Renderer.warm, tex: !!(C.FX && C.FX.tex && C.FX.tex.splat) };
  });
  console.log(JSON.stringify(r), logs.slice(0, 5).join('\n')); await browser.close();
})();
