// alinea a los soldados de una partida por equipos delante de la cámara (uniformes de facción)
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  for (const fac of (process.env.FACS || 'sv,av,ts,at').split(',')) {
    await page.evaluate((fac) => {
      const C = window.__COW, { G, UI } = C;
      G.settings.cam = 'third';
      UI.launch({ mode: 'tdm', map: 'campo', bots: 9, difficulty: 'normal', team: 0, fac, env: 'day', seed: 11 });
      C.simulate(4);
      const me = G.local; me.invulnT = 999;
      const others = G.fighters.filter((f) => f !== me).sort((a, b) => a.team - b.team);
      me.pos.set(0, 0.06, 12); C.CAM.mode = 'third'; C.Input.state.yaw = 0; C.Input.state.pitch = -0.05;
      others.forEach((f, i) => { f.dummy = true; f.station = { yaw: Math.PI, move: false }; f.invulnT = 999; f.pos.set(-2.7 + i * 0.9, 0.06, 9.3); f.yaw = Math.PI; f.vel && f.vel.set(0, 0, 0); });
      window.__line = others.map((f) => f.team + ':' + f.custom.camo + '/' + f.custom.helmet + '/' + f.custom.vest + '/' + (f.custom.fx || ''));
    }, fac);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { const C = window.__COW, { G } = C; G.fighters.filter((f) => f !== G.local).forEach((f, i) => { f.pos.set(-2.7 + i * 0.9, 0.06, 9.3); f.yaw = Math.PI; }); });
    await page.evaluate(() => { const C = window.__COW; C.G.local.view.root.visible = false; C.Input.state.pitch = -0.02; }); await page.waitForTimeout(300);
    console.log(fac, await page.evaluate(() => window.__line.join(' ')));
    await page.screenshot({ path: `/tmp/claude-0/w/shots/line_${fac}.png` });
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
