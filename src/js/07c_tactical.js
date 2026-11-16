// ---- 07c_tactical.js ----
// =====================================================================
// TÁCTICO — nubes de humo (tapan la vista a jugadores y bots) y rachas de
// bajas: reconocimiento aéreo, mortero y ataque aéreo
// =====================================================================
const Smoke = {
  list: [],
  spawn(pos, owner) {
    const S = CONFIG.SMOKE;
    const gy = FX.groundAt ? FX.groundAt(pos) : pos.y;
    const base = new THREE.Vector3(pos.x, gy > -900 ? Math.max(gy, pos.y - 0.6) : pos.y, pos.z);
    const grp = new THREE.Group(); G.root.add(grp);
    const mat = new THREE.SpriteMaterial({ map: puffTexture(), color: 0xbdbab0, transparent: true, depthWrite: false, opacity: 0 });
    const rng = new RNG(hash32('smoke', Math.round(pos.x * 10), Math.round(pos.z * 10), this.list.length));
    const puffs = [];
    for (let i = 0; i < 34; i++) {
      const sp = new THREE.Sprite(mat); grp.add(sp);
      puffs.push({ sp, a: rng.range(0, TAU), r: Math.sqrt(rng.next()) * 0.85, h: rng.range(0.05, 1), s: rng.range(0.7, 1.15), ph: rng.range(0, TAU) });
    }
    const can = buildSmokeMesh(); if (can.userData.glow) { can.userData.glow.visible = false; can.userData.led.visible = false; } can.position.set(base.x, base.y + 0.05, base.z); can.rotation.z = Math.PI / 2; G.root.add(can);
    const c = { pos: base, owner, t: 0, grp, mat, puffs, can, R: 0.5, dense: 0 };
    this.list.push(c);
    BUS.emit('smoke', c);
    return c;
  },
  tick(dt) {
    const S = CONFIG.SMOKE;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const c = this.list[i];
      c.t += dt;
      const k = smooth01(c.t / S.grow), fade = clamp((S.duration - c.t) / 3.5, 0, 1);
      c.R = S.radius * (0.3 + 0.7 * k);
      c.dense = Math.min(1, k * 1.25) * fade;
      if (c.t >= S.duration) this.remove(i);
    }
  },
  animate(dt) {
    for (const c of this.list) {
      const R = c.R, wind = c.t * 0.12;
      for (const p of c.puffs) {
        const a = p.a + wind * 0.2, r = p.r * R, y = 0.6 + p.h * p.h * R * 0.9 + Math.sin(c.t * 0.4 + p.ph) * 0.12;
        p.sp.position.set(c.pos.x + Math.cos(a) * r + wind * 0.3, c.pos.y + y, c.pos.z + Math.sin(a) * r);
        const sc = R * (1.25 + 0.3 * p.h) * p.s; p.sp.scale.set(sc, sc, 1);
      }
      c.mat.opacity = 0.96 * c.dense;
    }
  },
  // ¿el humo tapa la línea entre a y b? (cuenta cuántos metros de humo atraviesa)
  blocks(a, b) {
    if (!this.list.length) return false;
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, L = Math.hypot(dx, dy, dz) || 1e-6;
    const ux = dx / L, uy = dy / L, uz = dz / L;
    for (const c of this.list) {
      if (c.dense < 0.25) continue;
      const R = c.R * 0.92, cx = c.pos.x, cy = c.pos.y + c.R * 0.5, cz = c.pos.z;
      const ox = a.x - cx, oy = a.y - cy, oz = a.z - cz;
      const bq = ox * ux + oy * uy + oz * uz, cq = ox * ox + oy * oy + oz * oz - R * R, disc = bq * bq - cq;
      if (disc <= 0) continue;
      const sq = Math.sqrt(disc), t0 = Math.max(0, -bq - sq), t1 = Math.min(L, -bq + sq);
      if ((t1 - t0) * c.dense > CONFIG.SMOKE.blockLen) return true;
    }
    return false;
  },
  remove(i) {
    const c = this.list[i];
    G.root.remove(c.grp); G.root.remove(c.can); c.mat.dispose();
    this.list.splice(i, 1);
  },
  clear() { for (let i = this.list.length - 1; i >= 0; i--) this.remove(i); },
};

// ---------------- rachas de bajas ----------------
const STREAK_CODE = { uav: 0, mortar: 1, air: 2, supply: 3, jam: 4 }, STREAK_IDS = ['uav', 'mortar', 'air', 'supply', 'jam'];
const STREAK_INSTANT = { uav: 1, supply: 1, jam: 1 };
const _skV = new THREE.Vector3(), _skD = new THREE.Vector3(), _skHit = {};
const Streaks = {
  uav: {}, strikes: [], jets: [], flares: [], marker: null, jams: [], crates: [],
  reset() { this.clear(); },
  clear() {
    this.uav = {}; this.strikes = []; this.jams = []; if (this.recon) { G.root.remove(this.recon); this.recon = null; }
    for (const c of this.crates) this.removeCrate(c); this.crates = [];
    for (const j of this.jets) G.root.remove(j.mesh); this.jets = [];
    for (const fl of this.flares) { G.root.remove(fl.grp); fl.mat.dispose(); } this.flares = [];
    if (this.marker) this.marker.visible = false;
  },
  allowed(id) { if (G.mode && G.mode.ladder) return false; return id === 'uav' || id === 'jam' || !(G.mode && G.mode.rounds); },
  // ¿el radar de este jugador está interferido por un enemigo?
  jammed(viewer) { return !!viewer && this.jams.some((j) => j.until > G.time && j.owner !== viewer && Rules.isEnemy(j.owner, viewer)); },
  // la racha llega a un umbral: se gana la recompensa (se guarda aunque mueras)
  onStreak(f) {
    if (!f || G.attract) return;
    const ids = (f.loadout && f.loadout.streaks) || CONFIG.STREAK_ORDER;
    for (const id of ids) {
      if (CONFIG.STREAKS[id] && f.stats.streak === streakKills(f, id) && this.allowed(id)) { f.rewards.push(id); BUS.emit('streakEarned', f, id); }
    }
  },
  revealed(viewer, o) {
    if (!viewer || o.hasPerk && o.hasPerk('quiet') || this.jammed(viewer)) return false;
    const key = G.mode.teams ? 't' + viewer.team : 's' + viewer.slot;
    return (this.uav[key] || 0) > G.time;
  },
  uavActive(f) { const key = G.mode.teams ? 't' + f.team : 's' + f.slot; return (this.uav[key] || 0) > G.time; },
  // tecla 5 (o el bot): usar la primera recompensa disponible
  tickFighter(f, inp) {
    if (inp.streakCount !== f.seenStreak) {
      f.seenStreak = inp.streakCount;
      if (f.targeting) { f.targeting = null; BUS.emit('targeting', f, null); }
      else if (f.rewards.length && f.alive && !G.freeze) {
        const id = f.rewards[0];
        if (STREAK_INSTANT[id]) this.activate(f, id, f.pos.x - Math.sin(f.input.yaw) * 1.6, f.pos.z - Math.cos(f.input.yaw) * 1.6, f.input.yaw);
        else { f.targeting = { id, seenFire: inp.fireCount, pt: null }; BUS.emit('targeting', f, id); }
      }
    }
    const tg = f.targeting;
    if (!tg) return;
    if (!f.alive) { f.targeting = null; return; }
    // punto marcado: donde apunta la mira
    const ray = aimRay(f);
    const h = PHYS.raycast(ray.origin, ray.dir, 170, _skHit);
    tg.pt = h ? (tg.pt || new THREE.Vector3()).copy(h.point) : null;
    if (inp.fireCount !== tg.seenFire) {
      tg.seenFire = inp.fireCount; f.seenFire = inp.fireCount; f.fireBlockT = 0.45; // el clic de marcar no dispara el arma
      if (tg.pt) { this.activate(f, tg.id, tg.pt.x, tg.pt.z, f.input.yaw); f.targeting = null; BUS.emit('targeting', f, null); }
      else BUS.emit('targetFail', f);
    }
  },
  activate(f, id, x, z, yaw) {
    const i = f.rewards.indexOf(id); if (i < 0) return;
    f.rewards.splice(i, 1);
    const seed = (Math.random() * 1e9) >>> 0;
    if (NET.active) NET.queue('ks', [f.slot, STREAK_CODE[id], r2(x), r2(z), r3(yaw), seed]);
    this.start(f, id, x, z, yaw, seed, true);
  },
  remote(e) {
    const f = NET.bySlot(e[1]); if (!f) return;
    this.start(f, STREAK_IDS[e[2]] || 'uav', e[3], e[4], e[5], e[6], false);
  },
  start(f, id, x, z, yaw, seed, auth) {
    const S = CONFIG.STREAKS[id], rng = new RNG(seed || 1);
    f.stats.score += 50;
    if (id === 'uav') {
      const key = G.mode.teams ? 't' + f.team : 's' + f.slot;
      this.uav[key] = Math.max(this.uav[key] || 0, G.time) + S.dur;
      BUS.emit('streakUsed', f, id, null);
      return;
    }
    if (id === 'jam') { this.jams.push({ owner: f, until: G.time + S.dur }); BUS.emit('streakUsed', f, id, null); return; }
    if (id === 'supply') { this.dropCrate(f, x, z); BUS.emit('streakUsed', f, id, null); return; }
    const target = new THREE.Vector3(x, 0, z);
    this.flare(target, S.delay + (id === 'mortar' ? S.shells * S.every : 1.2) + 1.5);
    if (id === 'mortar') {
      for (let k = 0; k < S.shells; k++) {
        const a = rng.range(0, TAU), r = Math.sqrt(rng.next()) * S.spread * (k === 0 ? 0.3 : 1);
        this.strikes.push({ t: G.time + S.delay + k * S.every + rng.range(0, 0.12), x: x + Math.cos(a) * r, z: z + Math.sin(a) * r, kind: id, owner: f, auth, warned: false });
      }
    } else {
      // avión: pasa sobre el objetivo en la dirección en que miraba quien lo pidió
      const dx = -Math.sin(yaw), dz = -Math.cos(yaw), pass = G.time + S.delay - 0.55;
      for (let k = 0; k < S.bombs; k++) {
        const o = (k - (S.bombs - 1) / 2) * S.spacing;
        this.strikes.push({ t: pass + 0.55 + (o / 85) + k * 0.03, x: x + dx * o + rng.range(-0.8, 0.8), z: z + dz * o + rng.range(-0.8, 0.8), kind: id, owner: f, auth, warned: true });
      }
      this.jets.push({ mesh: buildJetMesh(), x, z, dx, dz, pass, sound: false });
      G.root.add(this.jets[this.jets.length - 1].mesh);
    }
    BUS.emit('streakUsed', f, id, target);
  },
  // caja de suministros: cae en paracaídas y recarga munición y vida a los aliados cercanos
  dropCrate(f, x, z) {
    const S = CONFIG.STREAKS.supply;
    const gh = PHYS.raycast(_skV.set(x, 60, z), _skD.set(0, -1, 0), 120, _skHit), gy = gh ? gh.point.y : 0;
    const g = new THREE.Group();
    const B = new PartBatch();
    B.add(GEO.box(0.8, 0.55, 0.55), 0, 0.28, 0, 0x7a5a36).add(GEO.box(0.84, 0.06, 0.59), 0, 0.57, 0, 0x5e4228).add(GEO.box(0.06, 0.57, 0.57), -0.37, 0.28, 0, 0x5e4228).add(GEO.box(0.06, 0.57, 0.57), 0.37, 0.28, 0, 0x5e4228)
      .add(GEO.box(0.82, 0.05, 0.57), 0, 0.03, 0, 0x5e4228).add(GEO.box(0.04, 0.6, 0.6), 0, 0.28, 0, 0x2a2a26, { rz: 0.6 })
      .add(GEO.box(0.3, 0.1, 0.02), 0, 0.3, 0.285, 0xe8e4da).add(GEO.box(0.1, 0.3, 0.02), 0, 0.3, 0.286, 0xb02a22);
    const crate = new THREE.Mesh(B.build(), MAT.vcol()); crate.castShadow = true; g.add(crate);
    const cg = new THREE.Group(); g.add(cg);
    const chute = new THREE.Mesh(GEO.dome(1.5, 10, 4), MAT.lam(0xd8d2b4, { side: THREE.DoubleSide })); chute.position.y = 3.4; chute.scale.y = 0.7; cg.add(chute);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.7; const ln = new THREE.Mesh(GEO.box(0.015, 3.1, 0.015), MAT.basic(0x2a2a22)); ln.position.set(Math.cos(a) * 0.55, 1.95, Math.sin(a) * 0.55); ln.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); cg.add(ln); }
    const ring = new THREE.Mesh(new THREE.RingGeometry(S.radius - 0.1, S.radius, 40), new THREE.MeshBasicMaterial({ color: 0x5ab8ff, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
    g.position.set(x, gy + 26, z); G.root.add(g);
    this.crates.push({ g, cg, ring, x, z, gy, owner: f, team: f.team, t: 0, until: G.time + S.dur + 1.6, tickT: 0 });
    this.flare(new THREE.Vector3(x, 0, z), 4);
  },
  removeCrate(c) { G.root.remove(c.g); c.ring.geometry.dispose(); c.ring.material.dispose(); },
  tickCrates(dt) {
    const S = CONFIG.STREAKS.supply;
    for (let i = this.crates.length - 1; i >= 0; i--) {
      const c = this.crates[i];
      c.t += dt;
      if (G.time >= c.until) { this.removeCrate(c); this.crates.splice(i, 1); continue; }
      if (c.t < 1.6) continue;
      c.tickT -= dt; if (c.tickT > 0) continue; c.tickT = 0.6;
      for (const o of G.fighters) {
        if (!o.alive || (NET.active && !NET.isAuthorityFor(o))) continue;
        const friendly = G.mode.teams ? o.team === c.team : o === c.owner;
        if (!friendly || Math.hypot(o.pos.x - c.x, o.pos.z - c.z) > S.radius || Math.abs(o.pos.y - c.gy) > 2.4) continue;
        let gave = false;
        for (const w of [o.primary, o.secondary]) {
          const W = o.ws[w], inv = o.inv[w]; if (!W || !inv) continue;
          const fullMag = W.mag + W.reserve;
          if (inv.mag + inv.reserve < fullMag) { inv.reserve = Math.min(W.reserve, inv.reserve + Math.ceil(W.mag * 0.6)); gave = true; }
        }
        const gMax = o.loadout.frags ?? CONFIG.GRENADE.count; if (o.grenades < gMax) { o.grenades++; gave = true; }
        if (o.hp < CONFIG.FIGHTER.hp) { o.hp = Math.min(CONFIG.FIGHTER.hp, o.hp + 18); gave = true; }
        if (gave && o === G.local) BUS.emit('supplyUsed', o);
      }
    }
  },
  tick(dt) {
    this.tickCrates(dt);
    for (let i = this.jams.length - 1; i >= 0; i--) if (this.jams[i].until <= G.time) this.jams.splice(i, 1);
    for (let i = this.strikes.length - 1; i >= 0; i--) {
      const s = this.strikes[i];
      if (!s.warned && G.time >= s.t - 1.15) { s.warned = true; BUS.emit('shellIncoming', _skV.set(s.x, 2, s.z)); }
      if (G.time < s.t) continue;
      this.strikes.splice(i, 1);
      // cae desde el cielo: explota en lo primero que toque (los techos protegen)
      const o = _skV.set(s.x, 75, s.z), h = PHYS.raycast(o, _skD.set(0, -1, 0), 120, _skHit);
      const pos = h ? h.point.clone().addScaledVector(h.normal, 0.15) : new THREE.Vector3(s.x, 0.2, s.z);
      const S = CONFIG.STREAKS[s.kind];
      Combat.explode({ pos, radius: S.radius, damage: S.damage, push: S.push, owner: s.owner, weapon: s.kind, authoritative: s.auth });
    }
  },
  animate(dt) {
    // avioneta de reconocimiento: da vueltas sobre el mapa mientras dura alguna racha de reconocimiento
    const anyUav = Object.values(this.uav).some((t) => t > G.time);
    if (anyUav && !this.recon) { this.recon = buildReconMesh(); G.root.add(this.recon); this.reconA = 0; }
    if (this.recon) {
      if (!anyUav) { G.root.remove(this.recon); this.recon = null; }
      else { const R = 70; this.reconA += dt * 30 / R; const a = this.reconA; this.recon.position.set(Math.cos(a) * R, 55, Math.sin(a) * R); this.recon.rotation.set(0, -a, -0.28); this.recon.props[0].rotation.z += dt * 45; }
    }
    for (const c of this.crates) {
      const k = clamp(c.t / 1.6, 0, 1);
      c.g.position.y = c.gy + 26 * (1 - k * k);
      c.cg.visible = c.t < 1.6;
      c.ring.material.opacity = (0.25 + Math.sin(G.realTime * 4) * 0.1) * k;
    }
    for (let i = this.jets.length - 1; i >= 0; i--) {
      const j = this.jets[i], tt = G.time - j.pass, d = tt * 85;
      j.mesh.position.set(j.x + j.dx * d, 62, j.z + j.dz * d);
      for (const pr of j.mesh.props) pr.rotation.z += dt * 40;
      j.mesh.rotation.set(0, Math.atan2(-j.dx, -j.dz), 0);
      if (!j.sound && tt > -3.2) { j.sound = true; BUS.emit('jet', j); }
      if (tt > 6) { G.root.remove(j.mesh); this.jets.splice(i, 1); }
    }
    for (let i = this.flares.length - 1; i >= 0; i--) {
      const fl = this.flares[i]; fl.t += dt;
      fl.parts.forEach((p, k) => { const q = (fl.t * 0.35 + k / fl.parts.length) % 1; p.position.set(fl.x + Math.sin(k * 2.1 + fl.t) * 0.3 * q, fl.y + q * 7, fl.z + Math.cos(k * 1.7) * 0.3 * q); const s = 0.6 + q * 2.6; p.scale.set(s, s, 1); });
      fl.mat.opacity = 0.75 * clamp((fl.life - fl.t) / 1.5, 0, 1) * clamp(fl.t / 0.4, 0, 1);
      if (fl.t >= fl.life) { G.root.remove(fl.grp); fl.mat.dispose(); this.flares.splice(i, 1); }
    }
    // marcador del objetivo mientras el jugador elige dónde
    const me = G.local, tg = me && me.targeting;
    if (!this.marker) {
      // anillo fino del área + cruz central (se ve sin tapar la vista)
      const mat = new THREE.MeshBasicMaterial({ color: 0xff4a2a, transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide, fog: false });
      this.marker = new THREE.Group(); this._mkGeo = {};
      this.markerRing = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 8), mat); this.markerRing.rotation.x = -Math.PI / 2; this.markerRing.renderOrder = 5; this.marker.add(this.markerRing);
      for (const r of [0, Math.PI / 2]) { const bar = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.16), mat); bar.rotation.set(-Math.PI / 2, 0, r); bar.renderOrder = 5; this.marker.add(bar); }
      G.root.add(this.marker);
    }
    this.marker.visible = !!(tg && tg.pt);
    if (this.marker.visible) {
      // anillo de ancho fijo (0.2 m) del radio de la zona de impacto
      const R = tg.id === 'mortar' ? CONFIG.STREAKS.mortar.spread : CONFIG.STREAKS.air.spacing * 0.5 * CONFIG.STREAKS.air.bombs;
      if (!this._mkGeo[tg.id]) this._mkGeo[tg.id] = new THREE.RingGeometry(R - 0.2, R, 56);
      this.markerRing.geometry = this._mkGeo[tg.id];
      this.marker.position.set(tg.pt.x, tg.pt.y + 0.08, tg.pt.z);
      this.marker.rotation.y = tg.id === 'air' ? Math.atan2(-Math.sin(me.input.yaw), -Math.cos(me.input.yaw)) : 0;
      this.markerRing.material.opacity = 0.42 + Math.sin(G.realTime * 6) * 0.12;
    }
  },
  flare(p, life) {
    const gy = FX.groundAt ? FX.groundAt(_skV.set(p.x, 60, p.z)) : 0;
    const mat = new THREE.SpriteMaterial({ map: smokeTexture(), color: 0xc8402e, transparent: true, depthWrite: false, opacity: 0 });
    const grp = new THREE.Group(); G.root.add(grp);
    const parts = []; for (let k = 0; k < 7; k++) { const s = new THREE.Sprite(mat); grp.add(s); parts.push(s); }
    this.flares.push({ grp, mat, parts, x: p.x, y: gy > -900 ? gy : 0, z: p.z, t: 0, life });
  },
};
// bombardero bimotor de hélice (época): fuselaje, alas rectas, dos motores con hélices que giran, morro acristalado y doble deriva
function buildJetMesh(scale = 1) {
  const B = new PartBatch(), c = 0x5a5e4c, d = 0x3a3d32, gl = 0x2c3640, m = 0x262624;
  B.add(GEO.cyl(0.75, 0.6, 12, 8), 0, 0, 0, c, { rx: Math.PI / 2 }).add(GEO.cone(0.75, 1.6, 8), 0, 0, -6.8, gl, { rx: -Math.PI / 2 })
    .add(GEO.cone(0.6, 2.2, 8), 0, 0.05, 7.1, c, { rx: Math.PI / 2 })
    .add(GEO.box(18, 0.24, 2.6), 0, -0.15, -0.6, c).add(GEO.box(18.2, 0.06, 0.5), 0, -0.02, -1.75, d)
    .add(GEO.box(6, 0.16, 1.5), 0, 0.15, 7.2, c).add(GEO.box(0.18, 1.9, 1.4), -2.9, 0.75, 7.3, d).add(GEO.box(0.18, 1.9, 1.4), 2.9, 0.75, 7.3, d)
    .add(GEO.box(0.9, 0.55, 1.6), 0, 0.72, -3.6, gl).add(GEO.box(0.5, 0.4, 0.5), 0, 0.85, 1.8, gl)
    .add(GEO.box(2.4, 0.3, 0.3), 0, -0.82, 0.2, m);
  for (const sx of [-3.4, 3.4]) B.add(GEO.cyl(0.55, 0.48, 3.4, 8), sx, -0.1, -1.4, d, { rx: Math.PI / 2 }).add(GEO.cyl(0.5, 0.5, 0.3, 8), sx, -0.1, -3.15, m, { rx: Math.PI / 2 }).add(GEO.cone(0.22, 0.5, 6), sx, -0.1, -3.45, m, { rx: -Math.PI / 2 });
  const mesh = new THREE.Mesh(B.build(), MAT.vcol()); mesh.castShadow = true;
  const g = new THREE.Group(); g.add(mesh); g.props = [];
  for (const sx of [-3.4, 3.4]) {
    const pb = new PartBatch(); pb.add(GEO.box(3.0, 0.22, 0.05), 0, 0, 0, 0x1c1c1a).add(GEO.box(0.22, 3.0, 0.05), 0, 0, 0, 0x1c1c1a);
    const pm = new THREE.Mesh(pb.build(), MAT.vcol()); pm.position.set(sx, -0.1, -3.62); g.add(pm); g.props.push(pm);
  }
  g.scale.setScalar(scale);
  return g;
}
// avioneta de reconocimiento (racha de reconocimiento): monoplano de ala alta, una hélice
function buildReconMesh() {
  const B = new PartBatch(), c = 0x6a6e58, d = 0x44473a;
  B.add(GEO.box(0.9, 1.0, 6.2), 0, 0, 0, c).add(GEO.box(11, 0.14, 1.5), 0, 0.62, -0.6, c).add(GEO.box(3.4, 0.1, 0.9), 0, 0.1, 3.0, c).add(GEO.box(0.1, 1.1, 0.9), 0, 0.6, 3.0, d)
    .add(GEO.box(0.8, 0.5, 1.2), 0, 0.45, -1.2, 0x2c3640).add(GEO.cyl(0.4, 0.45, 0.6, 8), 0, 0, -3.35, d, { rx: Math.PI / 2 })
    .add(GEO.box(0.06, 0.9, 0.06), -0.45, -0.8, -1.4, d).add(GEO.box(0.06, 0.9, 0.06), 0.45, -0.8, -1.4, d).add(GEO.box(0.12, 0.3, 0.4), -0.5, -1.25, -1.4, 0x1c1c1a).add(GEO.box(0.12, 0.3, 0.4), 0.5, -1.25, -1.4, 0x1c1c1a);
  const mesh = new THREE.Mesh(B.build(), MAT.vcol()); mesh.castShadow = true;
  const g = new THREE.Group(); g.add(mesh);
  const pb = new PartBatch(); pb.add(GEO.box(2.2, 0.18, 0.05), 0, 0, 0, 0x1c1c1a);
  const pm = new THREE.Mesh(pb.build(), MAT.vcol()); pm.position.set(0, 0, -3.7); g.add(pm); g.props = [pm];
  return g;
}

// textura de bocanada de humo: varias manchas suaves superpuestas (más "algodón" que un degradado)
let _puffTex = null;
function puffTexture() {
  if (_puffTex) return _puffTex;
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const rng = new RNG(77);
  for (let i = 0; i < 26; i++) {
    const a = rng.range(0, TAU), r = Math.sqrt(rng.next()) * 34, cx = 64 + Math.cos(a) * r, cy = 64 + Math.sin(a) * r * 0.85, rad = rng.range(16, 30);
    const g = x.createRadialGradient(cx, cy, 1, cx, cy, rad);
    const sh = Math.round(rng.range(205, 255));
    g.addColorStop(0, `rgba(${sh},${sh},${sh},0.8)`); g.addColorStop(0.6, `rgba(${sh},${sh},${sh},0.42)`); g.addColorStop(1, `rgba(${sh},${sh},${sh},0)`);
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, TAU); x.fill();
  }
  // borde suave para que no se note el cuadrado
  x.globalCompositeOperation = 'destination-in';
  const m = x.createRadialGradient(64, 64, 30, 64, 64, 63); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = m; x.fillRect(0, 0, 128, 128);
  _puffTex = new THREE.CanvasTexture(c); _puffTex.colorSpace = THREE.SRGBColorSpace;
  return _puffTex;
}

