const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.evaluate(() => { const C = window.__COW; C.G.settings.goreChosen = true; C.UI.closeOverlay && C.UI.closeOverlay(); C.UI.show('main'); }); await page.waitForTimeout(1500);
  const shot = async (n) => { await page.waitForTimeout(700); await page.screenshot({ path: `/tmp/claude-0/w/shots/menu_${n}.png` }); };
  await shot('main');
  for (const s of ['play', 'campaign', 'soldier', 'settings']) { await page.evaluate((s) => window.__COW.UI.show(s), s); await shot(s); }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
