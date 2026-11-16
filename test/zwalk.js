// tira de cuadros: infectado caminando hacia la cámara, uno reptando y el agarre
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 960, h: 540 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C;
    G.settings.cam = 'first';
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(6); document.getElementById('storyFade').style.display = 'none';
    const me = G.local; me.limpT = 0; me.dazeT = 0; me.pos.set(-1, 0.06, 0); C.Input.state.yaw = -Math.PI / 2; C.Input.state.pitch = -0.05; me.invulnT = 999;
    const a = C.Zombies.spawnOne(); a.pos.set(6, 0.06, -0.8); a.history.length = 0; a.brain.st = 'chase';
    const b = C.Zombies.spawnOne(); b.pos.set(6.5, 0.06, 1.2); b.history.length = 0; b.brain.st = 'chase'; b.crawler = true; b.speedMul = 0.8;
    window.__a = a; window.__b = b; C.Zombies.flashOn = true;
    const aim = () => { C.Input.state.yaw = -Math.PI / 2; requestAnimationFrame(aim); }; aim();
  });
  for (let i = 0; i < 8; i++) { await page.waitForTimeout(700); await page.screenshot({ path: `zw_${i}.png` }); }
  const st = await page.evaluate(() => { const a = window.__a, b = window.__b, me = window.__COW.G.local; return { a: a.pos.x.toFixed(2), b: b.pos.x.toFixed(2), bprone: b.prone, hp: me.hp, grab: !!window.__COW.Zombies.grab }; });
  console.log(JSON.stringify(st));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
