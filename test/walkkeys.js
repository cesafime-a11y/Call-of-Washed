// andar con teclas reales en una misión de campaña: node walkkeys.js  (env FILE, MISSION)
const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(process.env.FILE, { w: 640, h: 360 });
  await page.evaluate((M) => { const C = window.__COW; C.G.settings.goreChosen = true; C.UI.closeOverlay && C.UI.closeOverlay(); window.__COW_SCENE_SPEED = 4; C.Campaign.start(M); }, process.env.MISSION || 'P1-M1');
  for (let i = 0; i < 400; i++) {
    const st = await page.evaluate(() => { const C = window.__COW, S = C.Scenes.S; if (S.line) { C.Scenes.advance(); C.Scenes.advance(); } return { i: S.i, walk: !!(S.walk && S.walk.on), line: !!S.line, kind: S.step && S.step.kind }; });
    if (st.walk && !st.line && st.i >= 4) break;
    await page.waitForTimeout(150);
  }
  const p0 = await page.evaluate(() => { const W = window.__COW.Scenes.S.walk; return [W.p.x, W.p.z, window.__COW.Scenes.S.i, window.__COW.SceneWalk ? 1 : 0]; });
  await page.mouse.click(320, 180);
  for (const k of ['KeyW', 'KeyD', 'KeyS', 'KeyA']) { await page.keyboard.down(k); await page.waitForTimeout(900); await page.keyboard.up(k); }
  const p1 = await page.evaluate(() => { const C = window.__COW, W = C.Scenes.S.walk; return [W.p.x, W.p.z, C.G.paused, C.UI.screen, C.Input.keys.size, !!C.Scenes.S.line, C.Scenes.S.i, C.Scenes.S.busy]; });
  console.log('antes', JSON.stringify(p0), 'después', JSON.stringify(p1));
  await browser.close();
})();
