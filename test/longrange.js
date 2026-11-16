// galería larga: tiro a 626 m con caída y viento; comprueba que con el alza correcta se acierta
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const t0 = Date.now();
  await page.evaluate(() => { const C = window.__COW; C.G.settings.cam = 'first'; C.UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.Rules.rangeReset && C.Rules.rangeReset(); C.simulate(1); });
  console.log('load ms', Date.now() - t0);
  const r = await page.evaluate(async () => {
    const C = window.__COW, { G, Ballistics, BAL } = C, me = G.local;
    me.invulnT = 999; me.pos.set(0, 12.06, 21); me.vel.set(0, 0, 0);
    // arma: Kehlmann con mira
    me.loadout.primary = 'sniper'; if (me.giveLoadout) me.giveLoadout(me.loadout);
    const tgt = G.fighters.find((f) => f.station && f.station.name === '626 m');
    const out = { tgt: !!tgt, drop: {}, wind: null };
    // caída sin viento con alza 100 frente a 626 m (en m)
    for (const Z of [100, 300, 600, 626]) out.drop[Z] = +(Ballistics.dropAt(760, Ballistics.zeroAngle(760, 100), Z)).toFixed(2);
    out.th626 = Ballistics.zeroAngle(760, 600);
    const w = Ballistics.wind(); out.wind = [w.x.toFixed(2), w.z.toFixed(2)];
    return out;
  });
  console.log(JSON.stringify(r));
  // simula una bala real a 626 m (sin dispersión) y mide dónde cae respecto al blanco
  const s = await page.evaluate(() => {
    const C = window.__COW, { G, Ballistics, THREE, CONFIG } = C, me = G.local;
    const tgt = G.fighters.find((f) => f.station && f.station.name === '626 m');
    const W = CONFIG.WEAPONS.sniper;
    const res = []; let lh = null; C.BUS.on('longHit', (f, d) => { lh = +d.toFixed(1); }); C.BUS.on('longImpact', (f, wh, d) => { lh = 'world@' + d.toFixed(1) + ' y' + wh.point.y.toFixed(2) + ' z' + wh.point.z.toFixed(1); });
    for (const [zero, windOn] of [[100, false], [600, false], [600, true]]) {
      G.matchCfg.wind = windOn ? 4 : 0;
      me.zero = zero;
      const o = new THREE.Vector3(0, 13.6, 21), aim = new THREE.Vector3(tgt.pos.x, tgt.pos.y + 1.2, tgt.pos.z);
      const d = aim.clone().sub(o).normalize();
      const before = tgt.hp; lh = null;
      Ballistics.spawn(me, W, { origin: o, dir: d, seed: 1 }, d, o, true);
      const b = Ballistics.list[Ballistics.list.length - 1];
      let minD = 1e9, yAt = null;
      for (let i = 0; i < 400 && Ballistics.list.includes(b); i++) {
        const p0 = b.pos.clone(); Ballistics.tick(1 / 60);
        if (p0.z >= aim.z && b.pos.z <= aim.z) { const k = (p0.z - aim.z) / (p0.z - b.pos.z); yAt = [ (p0.x + (b.pos.x - p0.x) * k - aim.x).toFixed(2), (p0.y + (b.pos.y - p0.y) * k - aim.y).toFixed(2) ]; }
      }
      res.push({ zero, windOn, offsetXY: yAt, tof: +b.t.toFixed(2), hit: lh });
      tgt.hp = 100; 
    }
    return res;
  });
  console.log(JSON.stringify(s));
  await page.evaluate(() => { const C = window.__COW, { G } = C, me = G.local; G.matchCfg.wind = null; me.pos.set(0, 12.06, 21); C.Input.state.yaw = 0; C.Input.state.pitch = -0.018; me.input.aim = true; });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/claude-0/w/shots/range_tower.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
