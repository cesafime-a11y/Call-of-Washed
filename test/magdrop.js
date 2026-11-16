// 3.4.1: el cargador vacío cae al suelo al recargar. node magdrop.js "smg;pistol" carpeta → capturas durante la caída y en el suelo
const { open } = require('./lib');
(async () => {
  const list = (process.argv[2] || 'smg').split(';'), dir = process.argv[3];
  const { browser, page, logs } = await open(process.env.FILE, { w: 960, h: 540 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 0, difficulty: 'normal', team: 0 }); C.simulate(2); document.getElementById('hud').style.display = 'none'; });
  await page.waitForTimeout(2500);
  const step = (fr) => page.evaluate((fr) => { const C = window.__COW, me = C.G.local; C.G.paused = false; let g = 0; while (me.reloadT > me.reloadTotal * (1 - fr) && g++ < 900) { C.simulate(0.016); C.VM.update(0.016); C.FX.update(0.016); } C.G.paused = true; }, fr);
  for (const id of list) {
    await page.evaluate((id) => { const C = window.__COW, { G } = C, me = G.local, sec = C.CONFIG.SECONDARIES.includes(id);
      if (C.FX.D) { for (const d of C.FX.D) G.root.remove(d.obj); C.FX.D.length = 0; }
      me.loadout = C.classLoadout('custom', { primary: sec ? 'rifle' : id, secondary: sec ? id : 'pistol', att: {}, perk: 'ammo' }, 99); me.resetState();
      me.weapon = null; me.setWeapon(id); me.switchT = 0; me.invulnT = 999; me.pos.set(0, 0.06, 12); me.vel.set(0, 0, 0);
      C.Input.state.yaw = 0.5; C.Input.state.pitch = -0.6; G.paused = false; C.simulate(1.2); C.VM.update(0.016);
      me.inv[id].mag = 0; C.Weapons.startReload(me); }, id);
    for (const fr of [0.3, 0.42]) { await step(fr); await page.waitForTimeout(250); await page.screenshot({ path: `${dir}/drop_${id}_${fr}.png` }); }
    await step(1);
    const r = await page.evaluate(() => { const C = window.__COW, me = C.G.local; C.G.paused = false; for (let i = 0; i < 120; i++) { C.simulate(0.016); C.FX.update(0.016); }
      const d = (C.FX.D || [])[0]; if (d) { me.pos.set(d.obj.position.x - 0.3, me.pos.y, d.obj.position.z + 0.6); C.Input.state.yaw = -Math.atan2(0.3, 0.6); C.Input.state.pitch = -1.05; C.Input.state.aim = false; } C.simulate(0.05); C.G.paused = true;
      return (C.FX.D || []).map((d) => { const s = new C.THREE.Box3().setFromObject(d.obj).getSize(new C.THREE.Vector3()); return { y: +d.obj.position.y.toFixed(3), rest: d.rest, size: [s.x, s.y, s.z].map((v) => +v.toFixed(3)), dist: +d.obj.position.distanceTo(C.G.camera.position).toFixed(2) }; }); });
    await page.waitForTimeout(400); await page.screenshot({ path: `${dir}/drop_${id}_suelo.png` });
    console.log(id, JSON.stringify(r));
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
