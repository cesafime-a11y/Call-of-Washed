// primer plano de las manos (cámara de depuración sobre la escena de primera persona): node handclose.js "rifle;smg" carpeta
const { open } = require('./lib');
(async () => {
  const list = (process.argv[2] || 'rifle').split(';'), dir = process.argv[3];
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2); document.getElementById('hud').style.display = 'none'; });
  let n = 0;
  const view = async (name, which, v) => { await page.evaluate(([which, v]) => { const C = window.__COW, VM = C.VM, T = C.THREE; const h = which === 'R' ? VM.handR : VM.handL; const p = h.position.clone(); VM.baseFov = 40; VM.cam.position.set(p.x + v[0], p.y + v[1], p.z + v[2]); VM.cam.lookAt(p); }, [which, v]); await page.waitForTimeout(450); await page.screenshot({ path: `${dir}/${name}.png`, clip: { x: 320, y: 60, width: 640, height: 600 } }); };
  const reset = () => page.evaluate(() => { const VM = window.__COW.VM; VM.baseFov = 54; VM.cam.position.set(0, 0, 0); VM.cam.rotation.set(0, 0, 0); });
  for (const it of list) {
    const id = it; n++;
    await page.evaluate(([id]) => {
      const C = window.__COW, { G } = C, me = G.local, sec = C.CONFIG.SECONDARIES.includes(id);
      me.loadout = C.classLoadout('custom', { primary: sec ? 'rifle' : id, secondary: sec ? id : 'pistol', att: {}, perk: 'ammo' }, 99); me.resetState();
      me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 999; me.pos.set(0, 0.06, 12); me.vel.set(0, 0, 0);
      C.Input.state.yaw = 0; C.Input.state.pitch = -0.02; C.Input.mouseR = false; C.Input.state.aim = false; C.simulate(1.2);
    }, [id]);
    await view(`${n}_${id}_aR_der`, 'R', [0.36, 0.1, 0.14]); await view(`${n}_${id}_bR_izq`, 'R', [-0.34, 0.12, -0.16]); await view(`${n}_${id}_cL_izq`, 'L', [-0.36, 0.1, 0.14]); await view(`${n}_${id}_dL_abajo`, 'L', [0.14, -0.36, 0.12]);
    await reset();
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
