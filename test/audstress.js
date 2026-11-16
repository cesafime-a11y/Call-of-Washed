const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(undefined, { w: 640, h: 360, norender: true });
  const r = await page.evaluate(async () => {
    const A = window.__COW.AUDIO; if (!A) return 'no AUDIO export: ' + Object.keys(window.__COW).join(',');
    try{A.init();}catch(e){} await new Promise(r => setTimeout(r, 300));
    if (!A.ok) return 'audio not ok';
    let nodes = 0; const oc = A.ctx.createGain.bind(A.ctx);
    const P = window.__COW.G.local ? window.__COW.G.local.pos : null;
    let played = 0;
    const t0 = performance.now();
    for (let i = 0; i < 400; i++) { A.ctx.currentTime; A.play(['rifle','smg','pistol','kal'][i%4], P ? { x: P.x + (i % 30), y: P.y, z: P.z + (i % 7), distanceTo(q){return 0;} } : null, 1); }
    return 'win=' + (A.win ? A.win.length : '-') + ' ms=' + (performance.now() - t0).toFixed(1);
  });
  console.log(r); await browser.close();
})();
