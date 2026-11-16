const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => { const g = document.querySelector('[data-act="gore"][data-v="1"], .gore button, [data-act^="gore"]'); if (g) g.click(); }); await page.waitForTimeout(300); await page.evaluate(() => { const b = document.querySelector('[data-s="story"]'); b && b.click(); });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'menu_carcel.png' });
  for (const outfit of ['paciente', 'reo']) {
    await page.evaluate((outfit) => {
      const C = window.__COW, { G, UI } = C;
      G.settings.storyOutfit = outfit; G.settings.cam = 'third';
      UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
      C.simulate(6); document.getElementById('storyFade').style.display = 'none';
      const me = G.local; me.limpT = 0; me.dazeT = 0; me.invulnT = 999; me.pos.set(-3.5, 0.06, 0.3);
      if (outfit === 'reo') { C.Inv.equipItem('vest'); C.Inv.equipItem('backpack'); } else C.Inv.equipItem('satchel');
      C.CAM.mode = 'third'; C.Input.state.yaw = Math.PI / 2 + Math.PI * 0.85; C.Input.state.pitch = -0.15; C.Zombies.flashOn = true;
      for (const q of G.fighters) if (q.zombie && q.alive) q.pos.set(40, 0, 40);
    }, outfit);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `jugador_${outfit}.png` });
  }
  // bengala en la oscuridad
  await page.evaluate(() => {
    const C = window.__COW, { G } = C, me = G.local;
    C.CAM.mode = 'first'; G.settings.cam = 'first'; me.pos.set(-1, 0.06, 0); C.Input.state.yaw = -Math.PI / 2; C.Input.state.pitch = 0.05; C.Zombies.flashOn = false;
    C.Inv.add('flare', 1); C.Inv.ready = 'flare'; C.Inv.throwReady();
    const z = C.Zombies.spawnOne(); z.pos.set(7.5, 0.06, 1.5); z.history.length = 0;
  });
  await page.waitForTimeout(3500);
  await page.evaluate(() => { window.__COW.Input.state.pitch = -0.1; });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'bengala.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
