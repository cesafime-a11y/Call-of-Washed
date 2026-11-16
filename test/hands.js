const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(undefined, { w: 960, h: 540 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C; G.settings.cam = 'first';
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 2, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(7); document.getElementById('storyFade').style.display = 'none';
    const me = G.local; me.limpT = 0; me.invulnT = 999; for (const q of G.fighters) if (q.zombie) q.pos.set(40, 0, 40);
    C.Input.state.pitch = -0.1;
  });
  await page.waitForTimeout(1500); await page.screenshot({ path: 'hands_paciente.png' });
  await page.evaluate(() => { const C = window.__COW, me = C.G.local; me.weaponId = 'knife'; });
  await browser.close();
  const b2 = await open(undefined, { w: 960, h: 540 });
  await b2.page.evaluate(() => { window.__COW_TEST = true; });
  await b2.page.evaluate(() => {
    const C = window.__COW, { G, UI } = C; G.settings.cam = 'first';
    UI.launch({ mode: 'tdm', map: 'patio', bots: 2, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(8);
  });
  await b2.page.waitForTimeout(1500); await b2.page.screenshot({ path: 'hands_soldado.png' });
  await b2.browser.close();
})();
