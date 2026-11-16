const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(process.env.FILE, { w: 640, h: 360 });
  const r = await page.evaluate(async () => {
    window.__COW_TEST = true; const C = window.__COW, { G, UI, THREE } = C; G.settings.goreChosen = true; G.settings.cam = 'third';
    UI.launch({ mode: 'ffa', map: 'patio', bots: 7, difficulty: 'normal', team: 0 });
    await new Promise((res) => setTimeout(res, 2500));
    let lastN = G.renderer.info.programs.length; const at = [];
    const desc = (o) => { const p = []; let x = o; for (let i = 0; x && i < 4; i++, x = x.parent) p.push((x.name || x.type) + (x.userData && x.userData.kind ? ':' + x.userData.kind : '')); return p.join('<'); };
    const known = new Set(); G.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => known.add(m.uuid)); });
    for (let i = 0; i < 45; i++) {
      await new Promise((res) => setTimeout(res, 1000));
      const n = G.renderer.info.programs.length;
      if (n !== lastN) {
        const fresh = []; G.scene.traverse((o) => { if (o.material && o.visible) [].concat(o.material).forEach((m) => { if (!known.has(m.uuid)) { known.add(m.uuid); fresh.push(m.type + ' ' + desc(o) + (o.castShadow ? ' sh' : '')); } }); });
        at.push(i + 's +' + (n - lastN) + ': ' + fresh.slice(0, 4).join(' | ')); lastN = n;
      }
    }
    return at;
  });
  console.log(r.join('\n')); await browser.close();
})();
