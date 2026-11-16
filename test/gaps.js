// busca piezas sueltas (huecos) en todas las armas y todas sus variantes de accesorios, por proximidad real de superficies (vóxeles de 2 mm)
const { open } = require('./lib');
(async () => {
  const ids0 = (process.env.IDS || '').split(',').filter(Boolean);
  const all = [];
  const { browser: b0, page: p0 } = await open(process.env.FILE, { norender: true });
  const ids = ids0.length ? ids0 : await p0.evaluate(() => Object.keys(window.__COW.CONFIG.WEAPONS).filter((k) => window.__COW.CONFIG.ATTACH.slots[k]));
  await b0.close();
  for (const id of ids) {
  const { browser, page, logs } = await open(process.env.FILE, { norender: true });
  const res = await page.evaluate((onlyId) => {
    const C = window.__COW, T = C.THREE, VOX = 0.002;
    const key = (x, y, z) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
    function surf(it) {
      const g = it.geo, pos = g.attributes.position, idx = g.index, out = [];
      const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), p = new T.Vector3();
      const n = idx ? idx.count : pos.count;
      for (let i = 0; i < n; i += 3) {
        const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
        a.fromBufferAttribute(pos, i0).applyMatrix4(it.m); b.fromBufferAttribute(pos, i1).applyMatrix4(it.m); c.fromBufferAttribute(pos, i2).applyMatrix4(it.m);
        const L = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)), N = Math.min(40, Math.max(1, Math.ceil(L / (VOX * 0.7))));
        for (let u = 0; u <= N; u++) for (let v = 0; v <= N - u; v++) { const s = u / N, t = v / N; p.set(a.x + (b.x - a.x) * s + (c.x - a.x) * t, a.y + (b.y - a.y) * s + (c.y - a.y) * t, a.z + (b.z - a.z) * s + (c.z - a.z) * t); out.push(key(Math.floor(p.x / VOX), Math.floor(p.y / VOX), Math.floor(p.z / VOX))); }
      }
      return new Set(out);
    }
    function analyse(parts) {
      const sets = parts.map(surf), n = parts.length, par = [...Array(n).keys()];
      const f = (x) => par[x] === x ? x : (par[x] = f(par[x]));
      const map = new Map();
      sets.forEach((st, i) => st.forEach((k) => { let l = map.get(k); if (!l) map.set(k, l = []); l.push(i); }));
      const offs = []; for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) offs.push(dx * 1024 * 1024 + dy * 1024 + dz);
      for (const [k, l] of map) { for (const o of offs) { const m = map.get(k + o); if (m) for (const j of m) for (const i of l) { const a = f(i), b = f(j); if (a !== b) par[a] = b; } } }
      const comps = new Map(); parts.forEach((p, i) => { const r = f(i); (comps.get(r) || comps.set(r, []).get(r)).push(i); });
      return [...comps.values()].sort((a, b) => b.length - a.length);
    }
    const out = [];
    for (const id of [onlyId]) {
      const slots = C.CONFIG.ATTACH.slots[id] || {};
      const variants = [{}];
      for (const sl of Object.keys(slots)) for (const o of slots[sl].slice(1)) variants.push({ [sl]: o });
      for (const att of variants) for (const vm of [false]) {
        const r = C.weaponGeometry(id, vm, att);
        const comps = analyse(r.parts);
        if (comps.length > 1) {
          const info = comps.slice(1).map((c) => { const bb = new T.Box3(); c.forEach((i) => { const it = r.parts[i]; const g = it.geo; if (!g.boundingBox) g.computeBoundingBox(); bb.union(g.boundingBox.clone().applyMatrix4(it.m)); }); const ct = bb.getCenter(new T.Vector3()); return c.length + 'p@' + [ct.x, ct.y, ct.z].map((v) => v.toFixed(3)).join(',') + ' tag=' + (r.parts[c[0]].tag || '-') + ' col=' + r.parts[c[0]].color.toString(16); });
          out.push(id + ' ' + JSON.stringify(att) + (vm ? ' VM' : '') + ' => ' + info.join(' | '));
        }
      }
    }
    return out;
  }, id);
  all.push(...res); console.log(id + ': ' + res.length + ' con piezas sueltas'); res.slice(0, 6).forEach((l) => console.log('   ' + l.slice(0, 220)));
  await browser.close();
  }
  console.log('TOTAL variantes con piezas sueltas: ' + all.length);
})();
