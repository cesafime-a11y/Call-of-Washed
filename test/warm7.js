const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(process.env.FILE, { w: 640, h: 360 });
  const r = await page.evaluate(async () => {
    window.__COW_TEST = true; const C = window.__COW, { G, UI } = C; G.settings.goreChosen = true; G.settings.cam = 'third';
    UI.launch({ mode: 'ffa', map: 'patio', bots: 7, difficulty: 'normal', team: 0 });
    await new Promise((res) => setTimeout(res, 4000));
    const P = G.renderer.info.programs, base = P.map((p) => p.cacheKey);
    await new Promise((res) => setTimeout(res, 30000));
    const fresh = P.slice(base.length).map((p) => p.cacheKey);
    const diff = (a, b) => { const A = a.split(','), B = b.split(','); const d = []; for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) d.push(i + ':' + A[i] + '→' + B[i]); return d; };
    return fresh.map((k) => { let best = null, bd = 1e9; for (const b of base) { const d = diff(b, k); if (d.length < bd) { bd = d.length; best = d; } } return k.split(',')[0] + ' ' + best.slice(0, 6).join(' '); });
  });
  console.log(r.join('\n')); await browser.close();
})();
