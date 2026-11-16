// retratos del jugador (paciente/recluso) y de los infectados en tercera persona + primera persona
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const outfit = process.env.OUTFIT || 'paciente';
  await page.evaluate((outfit) => {
    const C = window.__COW, { G, UI } = C;
    G.settings.cam = 'third'; G.settings.storyOutfit = outfit;
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(6); document.getElementById('storyFade').style.display = 'none';
    const me = G.local; me.limpT = 0; me.dazeT = 0; me.pos.set(2, 0.06, 0);
    window.__zs = [];
    for (let i = 0; i < 3; i++) { const z = C.Zombies.spawnOne(); z.pos.set(4.5, 0.06, -1.6 + i * 1.6); z.history.length = 0; z.brain.st = 'idle'; z.yaw = Math.PI / 2 - 0.0; z.brain.aimYaw = Math.PI / 2; window.__zs.push(z); }
    C.Zombies.flashOn = true;
  }, outfit);
  const pose = async (name, fn, arg) => { await page.evaluate(fn, arg); await page.waitForTimeout(1600); await page.screenshot({ path: name }); };
  // infectados vistos de frente (cámara del jugador mirando al este)
  await pose('zl_zombies.png', () => { const C = window.__COW, me = C.G.local; C.G.settings.cam = 'first'; C.CAM.mode = 'first'; me.input.yaw = -Math.PI / 2; C.Input.state.yaw = -Math.PI / 2; C.Input.state.pitch = -0.05; for (const z of window.__zs) { z.brain.st = 'idle'; } });
  await pose('zl_zombies_chase.png', () => { const C = window.__COW; for (const z of window.__zs) { z.brain.st = 'chase'; } C.simulate(0.8); for (const [i, z] of window.__zs.entries()) { z.pos.set(4.5, 0.06, -1.6 + i * 1.6); z.vel.set(0,0,0); } });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
