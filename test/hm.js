const { open } = require('./lib');
(async () => {
  const { browser, page } = await open();
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => { const C = window.__COW; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.Rules.rangeReset(); C.simulate(2); });
  await page.waitForTimeout(1500);
  for (const k of [false, true]) {
    await page.evaluate((k) => { const U = window.__COW.UI; U._killMarkT = null; U.hitmarker(k); document.getAnimations().forEach(a => { a.pause(); a.currentTime = 60; }); }, k);
    await page.screenshot({ path: `/home/claude/test/hm_${k ? 'kill' : 'hit'}.png`, clip: { x: 560, y: 280, width: 160, height: 160 } });
  }
  await browser.close();
})();
