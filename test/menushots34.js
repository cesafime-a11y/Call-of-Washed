const { open } = require('./lib');
(async () => {
  const OUT = process.env.OUT || '/home/user/shots';
  const { browser, page } = await open(process.env.FILE, { w: 1280, h: 720, fonts: true, dpr: +(process.env.DPR || 1) });
  await page.evaluate(() => { const C = window.__COW; C.G.settings.goreChosen = true; C.UI.closeOverlay && C.UI.closeOverlay(); C.UI.show('main'); });
  await page.waitForTimeout(1500); await page.screenshot({ path: OUT + '/menu_main.png' });
  const shots = (process.env.SCREENS || 'play,soldier,look,parts,gunsmith,campaign').split(',');
  for (const s of shots) {
    await page.evaluate((s) => { const C = window.__COW, U = C.UI;
      if (s === 'look' || s === 'parts') { U.soldierTab = 'look'; U.lookTab = s === 'parts' ? 'parts' : 'ops'; U.show('soldier'); return; }
      U.soldierTab = 'kit';
      if (s === 'gunsmith') { C.G.settings.cls = 'custom'; }
      U.show(s); }, s);
    await page.waitForTimeout(1500); await page.screenshot({ path: OUT + '/menu_' + s + '.png' });
  }
  await browser.close();
})();
