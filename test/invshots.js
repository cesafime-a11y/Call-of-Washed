const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C, Inv = C.Inv;
    G.settings.cam = 'first';
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(7); document.getElementById('storyFade').style.display = 'none';
    const me = G.local; me.limpT = 0; me.dazeT = 0; me.invulnT = 999;
    // delante del botiquín del puesto de enfermería
    const w = Inv.world.find((q) => q.id === 'med' && q.x < 9);
    me.pos.set(w.x, 0.06, w.z - 0.9); C.Input.state.yaw = 0 + Math.PI; C.Input.state.pitch = -0.45;
  });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'inv_prompt.png' });
  await page.evaluate(() => {
    const C = window.__COW, Inv = C.Inv, me = C.G.local;
    Inv.equipItem('satchel'); Inv.add('med', 1); Inv.add('pills', 1); Inv.add('bottle', 1); Inv.add('flare', 2); Inv.add('battery', 1); Inv.battery = 0.42;
    Inv.openInv(); Inv.select(1);
  });
  await page.keyboard.press('Tab'); await page.waitForTimeout(300);
  const st = await page.evaluate(() => window.__COW.Inv.open);
  await page.keyboard.press('Tab'); await page.waitForTimeout(300);
  const st2 = await page.evaluate(() => window.__COW.Inv.open);
  console.log('tab toggles: ', st, st2);
  await page.evaluate(() => { const Inv = window.__COW.Inv; if (!Inv.open) Inv.openInv(); Inv.select(2); });
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'inv_screen.png' });
  await page.evaluate(() => { const C = window.__COW, Inv = C.Inv, me = C.G.local; Inv.close(false); me.hp = 50; Inv.startUse('med'); C.Input.state.pitch = -0.05; C.Input.state.yaw = Math.PI / 2; });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'inv_use.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
