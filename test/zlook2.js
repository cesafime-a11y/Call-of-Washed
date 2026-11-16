const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const outfit = process.env.OUTFIT || 'paciente';
  await page.evaluate((outfit) => {
    const C = window.__COW, { G, UI } = C;
    G.settings.cam = 'first'; G.settings.storyOutfit = outfit;
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(6); document.getElementById('storyFade').style.display = 'none';
    const me = G.local; me.limpT = 0; me.dazeT = 0; me.pos.set(0.5, 0.06, 0); me.input.yaw = -Math.PI / 2; C.Input.state.yaw = -Math.PI / 2; C.Input.state.pitch = -0.02;
    window.__zs = [];
    for (let i = 0; i < 4; i++) { const z = C.Zombies.spawnOne(); z.pos.set(4.6, 0.06, -2.4 + i * 1.6); z.history.length = 0; z.brain.st = 'idle'; z.yaw = Math.PI / 2; z.brain.aimYaw = Math.PI / 2; z.brain.atkCd = 99; window.__zs.push(z); }
    for (const z of window.__zs) { z.brain.update = function (dt) { const f = this.f; f.input.mx = f.input.mz = 0; f.input.prone = !!f.crawler; this.writeAim(); }; }
    window.__zs[1].brain.st = 'chase'; window.__zs[2].brain.st = 'chase';
    window.__zs[3].crawler = true;
    C.Zombies.flashOn = true;
  }, outfit);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'zl2_a.png' });
  // ataque: zarpazo y agarre congelados a mitad
  await page.evaluate(() => { const zs = window.__zs; zs[0].zAtk = { kind: 'swipe', t: 0.3, dur: 99, hit: 99, side: 1 }; zs[1].zAtk = { kind: 'swipe', t: 0.5, dur: 99, hit: 99, side: -1 }; zs[2].zGrab = true; zs[2].zBiteK = 1; zs[1].zAtk.t = 0.5; for (const z of zs) z.zAtk && (z.zAtk.freeze = 1); });
  await page.evaluate(() => { const zs = window.__zs; for (const z of zs) if (z.zAtk) { const A = z.zAtk; const tt = A.t; Object.defineProperty(A, 't', { get: () => tt, set: () => {} }); } });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'zl2_b.png' });
  // tercera persona: el jugador con su ropa
  await page.evaluate(() => { const C = window.__COW; for (const z of window.__zs) z.pos.set(40, 0, 40); C.G.settings.cam = 'third'; C.CAM.mode = 'third'; C.Input.state.yaw = Math.PI / 2 + 2.6; C.G.local.pos.set(-1, 0.06, 0.5); });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'zl2_c.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
