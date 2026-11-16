// recarga paso a paso: node reloadshots.js "smg;rifle" carpeta [fracciones]  → una captura por momento de la recarga
const { open } = require('./lib');
(async () => {
  const list = (process.argv[2] || 'rifle').split(';'), dir = process.argv[3], frs = (process.argv[4] || '0.1,0.22,0.36,0.5,0.62,0.85').split(',').map(Number);
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2); document.getElementById('hud').style.display = 'none'; });
  const clip = { x: 240, y: 180, width: 1040, height: 540 }; let n = 0;
  for (const id of list) { n++;
    await page.evaluate(([id]) => { const C = window.__COW, { G } = C, me = G.local, sec = C.CONFIG.SECONDARIES.includes(id);
      me.loadout = C.classLoadout('custom', { primary: sec ? 'rifle' : id, secondary: sec ? id : 'pistol', att: {}, perk: 'ammo' }, 99); me.resetState();
      me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 999; me.pos.set(0, 0.06, 12); me.vel.set(0, 0, 0);
      C.Input.state.yaw = 0; C.Input.state.pitch = -0.02; C.Input.mouseR = false; C.Input.state.aim = false; C.simulate(1.2); }, [id]);
    let m = 0;
    for (const fr of frs) { m++;
      const r = await page.evaluate(([id, fr]) => { const C = window.__COW, me = C.G.local; C.G.paused = false; const w = me.inv && me.inv[id]; if (w && 'mag' in w) w.mag = 0; if (!(me.reloadT > 0)) { C.Weapons.startReload(me); C.simulate(0.02); } const tot = me.reloadTotal || 0; const target = tot * (1 - fr); let g = 0; while (me.reloadT > target && g++ < 600) C.simulate(0.016); C.G.paused = true; return me.reloadT > 0; }, [id, fr]);
      await page.waitForTimeout(250); await page.screenshot({ path: `${dir}/${n}_${id}_${m}.png`, clip });
      if (!r) console.log(id, 'recarga terminada antes de', fr);
    }
    await page.evaluate(() => { const C = window.__COW; C.G.paused = false; C.simulate(4); });
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
