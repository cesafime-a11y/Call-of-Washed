const { open } = require('./lib');
(async () => {
  const map = process.argv[2] || 'pueblo';
  const { browser, page } = await open(undefined, { norender: true });
  const r = await page.evaluate((map) => {
    const C = window.__COW, { G, UI, PHYS, Grenades, MapSys, THREE: T } = C;
    UI.launch({ mode: 'tdm', map, bots: 1, difficulty: 'normal', team: 0 });
    C.simulate(3);
    const me = G.local, bd = MapSys.bounds, res = { thrown: 0, lost: 0, under: 0, indoors: 0, ex: [] };
    G.fighters.forEach(f => { if (f !== me) f.pos.set(0, -50, 0); });
    let rr = 7; const rnd = () => (rr = (rr * 1664525 + 1013904223) >>> 0) / 4294967296;
    const spots = [];
    for (let x = bd.x0 + 3; x < bd.x1 - 3; x += 2.5) for (let z = bd.z0 + 3; z < bd.z1 - 3; z += 2.5) {
      for (const y0 of [8, 3.2]) {
        const dn = PHYS.raycast(new T.Vector3(x, y0, z), new T.Vector3(0, -1, 0), y0 + 1, {}); if (!dn) continue;
        const up = PHYS.raycast(new T.Vector3(x, dn.point.y + 0.3, z), new T.Vector3(0, 1, 0), 6, {});
        if (up && up.t < 4.5) spots.push({ x, y: dn.point.y, z });
      }
    }
    res.spots = spots.length;
    const step = Math.max(1, Math.floor(spots.length / 90));
    for (let k = 0; k < spots.length; k += step) {
      const s = spots[k]; Grenades.clear();
      me.pos.set(s.x, s.y + 0.02, s.z); me.vel.set(0, 0, 0); me.input.yaw = rnd() * 6.28; me.input.pitch = -1.2 + rnd() * 1.0; me.grenades = 3; me.alive = true; me.state = 'stand';
      Grenades.throwFrom(me, 8); const g = Grenades.list[0]; if (!g) continue; res.thrown++; res.indoors++;
      for (let t = 0; t < 180; t++) C.stepOnce();
      const b = g.body.position;
      const inb = b.x > bd.x0 && b.x < bd.x1 && b.z > bd.z0 && b.z < bd.z1;
      let bad = null;
      if (inb && b.y < s.y - 4) bad = 'lost';
      else { const h = PHYS.raycast(new T.Vector3(b.x, b.y + 2.5, b.z), new T.Vector3(0, -1, 0), 6, {}); if (h && h.point.y > b.y + 0.12 && h.t > 2.4) bad = 'under'; }
      if (bad) { res[bad]++; if (res.ex.length < 6) res.ex.push([bad, s.x.toFixed(1), s.y.toFixed(1), s.z.toFixed(1), 'yaw', me.input.yaw.toFixed(2), 'pit', me.input.pitch.toFixed(2), 'end', b.x.toFixed(1), b.y.toFixed(2), b.z.toFixed(1)].join(' ')); }
    }
    return res;
  }, map);
  console.log(map, JSON.stringify(r));
  await browser.close();
})();
