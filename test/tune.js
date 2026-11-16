// ajuste en vivo de la mano derecha: node tune.js rifle '[{"tilt":-0.75,"roll":0,"dy":0,"dz":0}, ...]' carpeta
const { open } = require('./lib');
(async () => {
  const id = process.argv[2], sets = JSON.parse(process.argv[3]), dir = process.argv[4];
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(([id]) => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.simulate(2); document.getElementById('hud').style.display = 'none';
    const { G } = C, me = G.local, sec = C.CONFIG.SECONDARIES.includes(id);
    me.loadout = C.classLoadout('custom', { primary: sec ? 'rifle' : id, secondary: sec ? id : 'pistol', att: {}, perk: 'ammo' }, 99); me.resetState();
    me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 999; me.pos.set(0, 0.06, 12); me.vel.set(0, 0, 0);
    C.Input.state.yaw = 0; C.Input.state.pitch = -0.02; C.Input.mouseR = false; C.Input.state.aim = false; C.simulate(1.2); }, [id]);
  await page.waitForTimeout(600); await page.evaluate(() => { window.__g0 = Object.assign({}, window.__COW.VM.cur.userData.grip); });
  const view = async (name, v, fov) => { await page.evaluate(([v, fov]) => { const VM = window.__COW.VM; if (!v) { VM.baseFov = 54; VM.cam.position.set(0, 0, 0); VM.cam.rotation.set(0, 0, 0); return; } const p = VM.handR.position.clone(); VM.baseFov = fov || 40; VM.cam.position.set(p.x + v[0], p.y + v[1], p.z + v[2]); VM.cam.lookAt(p); }, [v, fov]); await page.waitForTimeout(350);
    await page.screenshot({ path: `${dir}/${name}.png`, clip: v ? { x: 320, y: 60, width: 640, height: 600 } : { x: 560, y: 120, width: 640, height: 600 } }); };
  let n = 0;
  for (const s of sets) { n++;
    await page.evaluate((s) => { const C = window.__COW, VM = C.VM, g = VM.cur.userData.grip, g0 = window.__g0;
      g.tilt = s.tilt ?? g0.tilt; g.roll = s.roll ?? 0; g.y = g0.y + (s.dy || 0); g.z = g0.z + (s.dz || 0); if (s.w) g.w = s.w; delete VM.fits[VM.curKey]; }, s);
    await page.waitForTimeout(500); const fit = await page.evaluate(() => { const VM = window.__COW.VM, f = VM.fits[VM.curKey]; return f && JSON.stringify(f.R.f.map((a) => a.map((x) => +x.toFixed(2)))); });
    console.log(n, JSON.stringify(s), fit);
    await view(`${n}_a_izq`, [-0.34, 0.12, -0.16]); await view(`${n}_b_abajo`, [-0.1, -0.36, 0.05]); await view(`${n}_d_fp`, null);
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
