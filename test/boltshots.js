// cerrojo tras el disparo: node boltshots.js "rifle;mk2" carpeta → capturas a lo largo del ciclo
const { open } = require('./lib');
(async () => {
  const list = process.argv[2].split(';'), dir = process.argv[3], ks = (process.argv[4] || '0.15,0.3,0.5,0.7,0.9').split(',').map(Number);
  const { browser, page } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2); document.getElementById('hud').style.display = 'none'; });
  let n = 0;
  for (const id of list) { n++;
    await page.evaluate(([id]) => { const C = window.__COW, { G } = C, me = G.local; me.loadout = C.classLoadout('custom', { primary: id, secondary: 'pistol', att: {}, perk: 'ammo' }, 99); me.resetState(); me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 999; me.pos.set(0, 0.06, 12); C.Input.state.yaw = 0; C.Input.state.pitch = -0.02; C.simulate(1.2); }, [id]);
    await page.waitForTimeout(300);
    let m = 0;
    for (const k of ks) { m++;
      await page.evaluate((k) => { const C = window.__COW, VM = C.VM; C.G.paused = true; VM.cycId = VM.curId; VM.cycHold = true; VM.cycT = 0.1 + k * 0.62; }, k);
      await page.waitForTimeout(40); await page.screenshot({ path: `${dir}/${n}_${id}_${m}.png`, clip: { x: 240, y: 180, width: 1040, height: 540 } });
    }
    await page.evaluate(() => { const C = window.__COW; C.G.paused = false; C.VM.cycT = null; C.VM.cycHold = false; });
  }
  await browser.close();
})();
