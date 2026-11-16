// cadera y apuntando por arma: node protoshots.js id[:att json],id2 carpeta
const { open } = require('./lib');
(async () => {
  const list = (process.argv[2] || 'rifle').split(';'), dir = process.argv[3];
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2); });
  let n = 0;
  for (const it of list) {
    const k = it.indexOf(':'), id = k < 0 ? it : it.slice(0, k), att = k < 0 ? {} : JSON.parse(it.slice(k + 1)); n++;
    await page.evaluate(([id, att]) => {
      const C = window.__COW, { G } = C, me = G.local;
      const sec = C.CONFIG.SECONDARIES.includes(id);
      me.loadout = C.classLoadout('custom', { primary: sec ? 'rifle' : id, secondary: sec ? id : 'pistol', att, perk: 'ammo' }, 99); me.resetState();
      me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 999; me.pos.set(0, 0.06, 12); me.vel.set(0, 0, 0);
      C.Input.state.yaw = 0; C.Input.state.pitch = -0.02; C.Input.mouseR = false; C.Input.state.aim = false; C.simulate(1.2);
    }, [id, att]);
    await page.waitForTimeout(700); await page.screenshot({ path: `${dir}/${n}_${id}_hip.png`, clip: { x: 320, y: 180, width: 960, height: 540 } });
    await page.evaluate(() => { const C = window.__COW; C.Input.mouseR = true; C.Input.state.aim = true; C.simulate(1.5); });
    await page.waitForTimeout(700); await page.screenshot({ path: `${dir}/${n}_${id}_ads.png`, clip: { x: 320, y: 90, width: 640, height: 540 } });
    await page.evaluate(() => { const C = window.__COW; C.Input.mouseR = false; C.Input.state.aim = false; C.simulate(0.6); });
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
