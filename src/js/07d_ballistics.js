// ---- 07d_ballistics.js ----
// Balística de tiro largo (fusiles con mira: W.longRange). La bala no es instantánea: vuela con gravedad,
// rozamiento del aire y viento, y cada paso de simulación se comprueba como un segmento contra el mundo,
// los combatientes y los cuerpos. El alza (100–1000 m) inclina el cañón para que la trayectoria cruce la
// línea de mira a esa distancia. Con la mira puesta, Mayús contiene la respiración (unos 5 s, luego fatiga);
// el pulso hace oscilar la mira. Determinista: la misma semilla da la misma bala en todas las máquinas.
const BAL = { g: 9.81, k: 0.0007, zMin: 100, zMax: 1000, zStep: 100, hold: 5, rest: 4, tired: 3.5, life: 4 };
const _bA = new THREE.Vector3(), _bB = new THREE.Vector3(), _bD = new THREE.Vector3(), _bW = new THREE.Vector3(), _bR = new THREE.Vector3(), _bU = new THREE.Vector3(), _bHit = {};
const Ballistics = {
  list: [], _zc: new Map(),
  clear() { this.list.length = 0; },
  // viento de la partida: dirección y fuerza salen de la semilla; rachas lentas y deterministas según el reloj de juego
  wind(out = _bW) {
    const cfg = G.matchCfg || {};
    if (cfg.wind === 0 || (G.mode && G.mode.story)) return out.set(0, 0, 0);
    const seed = (cfg.seed || 1) >>> 0, b = (hash32('wind', seed) % 1000) / 1000;
    const spd = cfg.wind != null ? cfg.wind : 1 + ((hash32('windS', seed) % 1000) / 1000) * 5;   // 1–6 m/s
    const t = G.time, gust = 1 + 0.25 * Math.sin(t * 0.21 + b * 9) + 0.12 * Math.sin(t * 0.67 + b * 3), a = b * TAU + 0.15 * Math.sin(t * 0.09 + b * 5);
    return out.set(Math.cos(a) * spd * gust, 0, Math.sin(a) * spd * gust);
  },
  // trayectoria plana sin viento (para calcular el ángulo del alza)
  dropAt(mv, th, X) {
    let x = 0, y = 0, vx = mv * Math.cos(th), vy = mv * Math.sin(th); const h = 1 / 400;
    for (let i = 0; i < 4000; i++) {
      const v = Math.hypot(vx, vy), a = BAL.k * v;
      vx -= a * vx * h; vy -= (BAL.g + a * vy) * h;
      const nx = x + vx * h, ny = y + vy * h;
      if (nx >= X) return y + (ny - y) * (X - x) / (nx - x);
      x = nx; y = ny;
    }
    return -1e9;
  },
  zeroAngle(mv, Z) {
    const key = mv + '|' + Z; let th = this._zc.get(key);
    if (th != null) return th;
    let lo = 0, hi = 0.08;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (this.dropAt(mv, m, Z) < 0) lo = m; else hi = m; }
    th = (lo + hi) / 2; this._zc.set(key, th); return th;
  },
  zeroOf(f) { return clamp(f.zero || BAL.zMin, BAL.zMin, BAL.zMax); },
  // dispara una bala balística a partir de la dirección ya dispersada
  spawn(f, W, shot, dir, muzzle, auth) {
    // los bots ajustan el alza a la distancia de lo que apuntan (redondeada como un tirador de verdad)
    let Z = this.zeroOf(f);
    if (f.kind !== 'local') { const h = PHYS.raycast(shot.origin, shot.dir, BAL.zMax, _bHit), d = h ? h.t : BAL.zMax; Z = clamp(Math.round(d / 25) * 25, BAL.zMin, BAL.zMax); }
    const mv = W.mv || 740, th = this.zeroAngle(mv, Z);
    _bR.crossVectors(dir, THREE.Object3D.DEFAULT_UP); if (_bR.lengthSq() < 1e-6) _bR.set(1, 0, 0); _bR.normalize();
    _bU.crossVectors(_bR, dir).normalize();
    const v = dir.clone().multiplyScalar(Math.cos(th)).addScaledVector(_bU, Math.sin(th)).multiplyScalar(mv);
    this.list.push({ f, W, pos: shot.origin.clone(), vel: v, dist: 0, t: 0, auth, seed: shot.seed, muzzle: muzzle.clone(), first: true, whiz: false });
  },
  tick(dt) {
    const wind = this.wind(), lp = G.local && G.local.alive ? _v7.set(G.local.pos.x, G.local.pos.y + 1.55, G.local.pos.z) : null;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const b = this.list[i]; let done = false;
      for (let s = 0; s < 2 && !done; s++) {
        const h = dt / 2; b.t += h;
        _bA.copy(b.vel).sub(wind); const a = BAL.k * _bA.length();
        b.vel.x -= a * _bA.x * h; b.vel.y -= (BAL.g + a * _bA.y) * h; b.vel.z -= a * _bA.z * h;
        const L = b.vel.length() * h; _bD.copy(b.vel).normalize();
        done = this.segment(b, b.pos, _bD, L, lp);
        if (!done) b.pos.addScaledVector(_bD, L);
        b.dist += L;
        if (b.dist > b.W.range || b.t > BAL.life || b.pos.y < -60) done = true;
      }
      if (done) this.list.splice(i, 1);
    }
  },
  segment(b, o, d, L, lp) {
    const W = b.W, f = b.f;
    const wh = PHYS.raycast(o, d, L, _bHit), maxT = wh ? wh.t : L;
    const fh = Combat.rayFighters(o, d, maxT, f), ch = !fh ? Corpses.raycast(o, d, maxT) : null;
    const end = _bB.copy(fh ? fh.point : ch ? ch.point : wh ? wh.point : _bB.copy(o).addScaledVector(d, L));
    // estela visible: el primer tramo desde la boca y luego un trazo tenue cada paso
    if (b.first) { b.first = false; FX.tracer(b.muzzle, end, 1); } else if (b.t < 1.6) FX.tracer(o, end, 0.35);
    if (lp && !b.whiz && f !== G.local) { const r = rayPointDist(o, d, maxT, lp); if (r.dist < 1.3) { b.whiz = true; BUS.emit('whiz', _v8.copy(o).addScaledVector(d, r.t)); } }
    if (fh) {
      const dist = b.dist + fh.t;
      const fall = dist <= W.fall0 ? 1 : dist >= W.fall1 ? W.fallMin : lerp(1, W.fallMin, (dist - W.fall0) / (W.fall1 - W.fall0));
      const zone = fh.part === 'head' ? W.headMul : fh.part === 'legs' ? W.legMul : fh.part === 'arms' ? (W.armMul ?? 0.95) : 1;
      if (b.auth) { f.stats.hits++; Combat.hit({ attacker: f, target: fh.fighter, damage: W.damage * fall * zone, impulse: d.clone().multiplyScalar(W.push), point: fh.point.clone(), part: fh.part, weapon: W.id, kind: 'bullet', dist, shotTime: G.time, shot: b.seed, pen: false }); }
      BUS.emit('longHit', f, dist);
      return true;
    }
    if (ch) { ch.ragdoll.applyImpulse(_v4.copy(d).multiplyScalar(Math.min(W.push * 1.6, 4)), ch.point, ch.part); FX.fleshHit(ch.point, d, 0.6); return true; }
    if (wh) {
      FX.impact(wh.point, wh.normal, wh.block.surface, 1);
      if (b.auth) MapSys.damageBlock(wh.block, W.damage * 0.8, wh.point, f);
      BUS.emit('longImpact', f, wh, b.dist + wh.t);
      return true;
    }
    return false;
  },
  // jugador local con fusil de mira: alza con la rueda, respiración con Mayús y oscilación por el pulso
  pre(f, dt) {
    const W = f.wstat(), inp = f.input;
    const prevY = f._swY || 0, prevP = f._swP || 0;
    let ny = 0, np = 0;
    if (f.breath == null) { f.breath = 1; f.fatigueT = 0; f.zero = BAL.zMin; }
    const lr = !!(W && W.longRange) && f.alive, aiming = lr && inp.aim && f.adsT > 0.3, scoped = aiming && f.adsT > 0.85;
    if (aiming && inp.cycleCount !== f.seenCycle) {
      f.seenCycle = inp.cycleCount;
      const z = clamp((f.zero || BAL.zMin) + (inp.cycleDir < 0 ? BAL.zStep : -BAL.zStep), BAL.zMin, BAL.zMax);
      if (z !== f.zero) { f.zero = z; BUS.emit('zero', f); }
    }
    const hold = scoped && (inp.breath ?? inp.sprint) && f.fatigueT <= 0 && f.breath > 0;   // 3.3.0: tecla cruda (inp.sprint se borra en el primer paso del fotograma)
    if (aiming) inp.sprint = false;
    if (hold) { f.breath -= dt / BAL.hold; if (f.breath <= 0) { f.breath = 0; f.fatigueT = BAL.tired; BUS.emit('breathOut', f); } }
    else { if (f.fatigueT > 0) f.fatigueT -= dt; else f.breath = Math.min(1, f.breath + dt / BAL.rest); }
    f.holding = hold;
    if (scoped) {
      const t = G.time, D = (typeof Camp !== 'undefined' && G.mode && G.mode.campaign && Camp.diff) ? Camp.diff() : null;
      f.holdK = damp(f.holdK || 0, hold ? 1 : 0, 7, dt); f.tiredK = damp(f.tiredK || 0, f.fatigueT > 0 ? 1 : 0, 3, dt);
      const amp = 0.0025 * lerp(lerp(1, 2.2, f.tiredK), 0.06, f.holdK) * (W.swayMul || 1) * (f.prone ? 0.35 : f.crouching ? 0.65 : 1) * (W.bipod && (f.prone || f.crouching) ? 0.45 : 1) * (D ? D.sway : 1);
      const bpm = lerp(lerp(74, 112, f.tiredK), 62, f.holdK); f.pph = ((f.pph || 0) + dt * bpm / 60) % 1; const pulse = Math.exp(-f.pph * 14) * (1 - f.holdK * 0.7);
      f.pulse = pulse;
      ny = amp * (Math.sin(t * 0.9) + 0.5 * Math.sin(t * 2.3 + 1));
      np = amp * (0.75 * Math.sin(t * 1.3 + 2) + 0.35 * Math.sin(t * 0.5)) + amp * 0.6 * pulse;
    } else f.pulse = 0;
    inp.yaw += ny - prevY; inp.pitch += np - prevP; f._swY = ny; f._swP = np;
  },
};
