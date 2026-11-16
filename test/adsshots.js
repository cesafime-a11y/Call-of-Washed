// vista apuntando por arma y mira: node adsshots.js id:optic,id2 prefijo
const { open } = require('./lib');
(async () => {
  const list = (process.argv[2] || 'rifle:x2').split(',');
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2); });
  for (const it of list) {
    const [id, optic] = it.split(':');
    const info = await page.evaluate(([id, optic]) => {
      const C = window.__COW, { G } = C, me = G.local;
      const sec = C.CONFIG.SECONDARIES.includes(id);
      me.loadout = C.classLoadout('custom', { primary: sec ? 'rifle' : id, secondary: sec ? id : 'pistol', att: optic ? { optic } : {}, perk: 'ammo' }); me.resetState();
      me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 999; me.pos.set(0, 0.06, 12); me.vel.set(0, 0, 0);
      C.Input.state.yaw = 0; C.Input.state.pitch = -0.02; C.Input.mouseR = true; C.Input.state.aim = true; C.simulate(1.5);
      const W = me.wstat(); return { adsT: +me.adsT.toFixed(2), id, optic: W.id && me.ws[id] && me.ws[id].scope, zoom: W.zoom, scoped: C.CAM.scoped, att: JSON.stringify((me.ws[id] || {}).att || null) };
    }, [id, optic]);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/tmp/claude-0/w/shots/ads_${process.argv[3] || 'a'}_${id}_${optic || 'iron'}.png` });
    console.log(JSON.stringify(info));
    await page.evaluate(() => { const C = window.__COW; C.Input.mouseR = false; C.Input.state.aim = false; C.simulate(0.6); });
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
