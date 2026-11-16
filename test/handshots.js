// manos en primera persona: node handshots.js "rifle;smg;pistol" carpeta  → cadera, apuntando, recarga (2 momentos) por arma
const { open } = require('./lib');
(async () => {
  const list = (process.argv[2] || 'rifle').split(';'), dir = process.argv[3];
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2); document.getElementById('hud').style.display = 'none'; });
  const clip = process.env.FULL ? { x: 0, y: 0, width: 1280, height: 720 } : { x: 240, y: 180, width: 960, height: 540 }; let n = 0;
  const shot = async (name) => { await page.waitForTimeout(450); await page.screenshot({ path: `${dir}/${name}.png`, clip }); };
  for (const it of list) {
    const k = it.indexOf(':'), id = k < 0 ? it : it.slice(0, k), att = k < 0 ? {} : JSON.parse(it.slice(k + 1)); n++;
    await page.evaluate(([id, att]) => {
      const C = window.__COW, { G } = C, me = G.local, sec = C.CONFIG.SECONDARIES.includes(id);
      me.loadout = C.classLoadout('custom', { primary: sec ? 'rifle' : id, secondary: sec ? id : 'pistol', att, perk: 'ammo' }, 99); me.resetState();
      me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 999; me.pos.set(0, 0.06, 12); me.vel.set(0, 0, 0);
      C.Input.state.yaw = 0; C.Input.state.pitch = -0.02; C.Input.mouseR = false; C.Input.state.aim = false; C.simulate(1.2);
    }, [id, att]);
    await shot(`${n}_${id}_1hip`);
    if (process.env.ONLY === 'hip') { const t = await page.evaluate(() => { const VM = window.__COW.VM, k = VM.curKey, f = VM.fits && VM.fits[k]; const U = VM.cur.userData; return f ? JSON.stringify({ g: U.grip, s: U.gripSlice, R: f.R.f.map(a => a.map(v => +v.toFixed(2))), L: f.L && f.L.f.map(a => a.map(v => +v.toFixed(2))) }) : 'sin ajuste'; }); console.log(id, t); continue; }
    await page.evaluate(() => { const C = window.__COW; C.Input.mouseR = true; C.Input.state.aim = true; C.simulate(1.2); });
    await shot(`${n}_${id}_2ads`);
    await page.evaluate(() => { const C = window.__COW; C.Input.mouseR = false; C.Input.state.aim = false; C.simulate(0.6); });
    if (process.env.EXTRA) {
      await page.evaluate(() => { const C = window.__COW; C.Input.state.fire = true; C.Input.mouseL = true; C.simulate(0.05); C.Input.state.fire = false; C.Input.mouseL = false; });
      await page.waitForTimeout(30); await page.screenshot({ path: `${dir}/${n}_${id}_5fire.png`, clip });
      await page.evaluate(() => { const C = window.__COW; C.simulate(1.5); C.Input.state.grenade = true; C.simulate(0.5); });
      await shot(`${n}_${id}_6nade`);
      await page.evaluate(() => { const C = window.__COW; C.Input.state.grenade = false; C.simulate(2.5); });
    }
    for (const [tag, fr] of [['3rel', 0.36], ['4rel', 0.66]]) {
      const info = await page.evaluate(([id, fr]) => { const C = window.__COW, me = C.G.local; const w = me.inv && me.inv[id] || me.ws && me.ws[id]; if (w && 'mag' in w) w.mag = 1; C.Weapons.startReload(me); C.simulate(0.02); const tot = me.reloadTotal || 0; if (me.reloadT > 0) { const target = tot * (1 - fr); let g = 0; while (me.reloadT > target && g++ < 400) C.simulate(0.016); } return [tot, me.reloadT]; }, [id, fr]);
      if (tag === '3rel') console.log(id, 'reload', JSON.stringify(info));
      await shot(`${n}_${id}_${tag}`);
      await page.evaluate(() => { const C = window.__COW; C.simulate(4); });
    }
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
