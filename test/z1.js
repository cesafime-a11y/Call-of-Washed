const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(async () => {
    const C = window.__COW, { G, UI } = C;
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(3);
    const me = G.local; document.getElementById('storyFade').style.display = 'none';
    return { pos: me.pos.toArray(), hp: me.hp, w: me.weapon, fighters: G.fighters.length, alive: G.fighters.filter(f => f.alive).length, nav: C.MapSys.nav && C.MapSys.nav.nodes.length };
  });
  console.log(JSON.stringify(r));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: 'z1_a.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
