const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => { const C = window.__COW, { G, UI } = C; G.settings.showFps = true; G.settings.cam = 'first'; UI.launch({ mode: 'ffa', map: 'pueblo', bots: 5, difficulty: 'normal', team: 0 }); UI.el.fps.hidden = false; C.simulate(9); });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: '/home/claude/test/ovl.png', clip: { x: 0, y: 150, width: 640, height: 260 } });
  console.log(await page.evaluate(() => window.__COW.UI.el.fps.textContent));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 5).join('\n'));
  await browser.close();
})();
