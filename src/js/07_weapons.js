// ---- 07_weapons.js ----
// =====================================================================
// ARMAS — disparo con dispersión y retroceso por patrón, mira con zoom,
// zonas de daño, recarga táctica, cuchillo, granadas con cocinado,
// cohetes, armas tiradas en el suelo, y COMBATE (daño y explosiones)
// =====================================================================
const RECOIL_PAT = {};
for (const id in CONFIG.WEAPONS) {
  CONFIG.WEAPONS[id].id = id;
  // patrón horizontal fijo por arma: se puede aprender a compensar
  const rng = new RNG(hash32('recoil', id)); let x = 0.35; const arr = [];
  for (let i = 0; i < 40; i++) { x = clamp(x * 0.72 + rng.range(-0.75, 0.75), -1, 1); arr.push(x); }
  RECOIL_PAT[id] = arr;
}

const Weapons = {
  _mz: new THREE.Vector3(), _d: new THREE.Vector3(), _wh: { skipBound: true }, _end: new THREE.Vector3(),

  tick(f, dt) {
    const inp = f.input;
    Streaks.tickFighter(f, inp);
    let W = f.wstat(), inv = f.inv[f.weapon];
    f.fireBlockT = (f.fireBlockT || 0) - dt;
    f.fireCd -= dt; f.switchT -= dt; f.meleeCd -= dt; f.sprayT -= dt; f.throwT -= dt;
    f.bloom = Math.max(0, f.bloom - (W.bloomDecay || 0.1) * dt);
    if (f.sprayT <= 0) f.sprayN = 0;
    // el retroceso vuelve poco a poco al soltar el gatillo
    if (f.recoilAcc > 0 && G.time - f.lastShotT > 0.1) {
      const r = Math.min(f.recoilAcc, dt * 0.45);
      f.recoilAcc -= r;
      const back = r * (W.recoilRecover || 0.5);
      inp.pitch = clamp(inp.pitch - back, -1.45, 1.45);
      if (f.brain) f.brain.aimPitch -= back;
    }
    // apuntar con mira
    const proneMove = f.proneT > 0.05 && f.proneT < 0.95;
    const busy = f.state !== 'stand' || !!f.mantle || f.meleeT > 0 || !!f.grenadeCook || f.throwT > 0 || proneMove;
    const canAds = inp.aim && !f.sprinting && !busy && W.kind !== 'melee' && f.switchT <= 0.05 && !(f.reloadT > 0);   // 3.2.3: al recargar se baja la mira (antes el arma tapaba la pantalla)
    f.adsT = clamp(f.adsT + (canAds ? 1 : -1.4) * dt / ((W.adsTime || 0.2) * (f.armT > 0 ? CONFIG.WOUND.armAdsMul : 1)), 0, 1);
    // brazo herido o aturdido: la mira tiembla
    if (f.armT > 0 || f.dazeT > 0) {
      const sw = (f.armT > 0 ? Math.min(1, f.armT) * 0.0011 : 0) + (f.dazeT > 0 ? Math.min(1, f.dazeT) * 0.0016 : 0), ty = Math.sin(G.time * 8.3 + f.slot) * sw, tp = Math.cos(G.time * 6.7 + f.slot) * sw * 0.8;
      inp.yaw += ty; inp.pitch = clamp(inp.pitch + tp, -1.45, 1.45);
      if (f.brain) { f.brain.aimYaw += ty; f.brain.aimPitch += tp; }
    }
    if (inp.aim && f.sprinting) f.sprintBlockT = 0.22;

    // cambio de arma
    if (inp.slotCount !== f.seenSlot) {
      f.seenSlot = inp.slotCount;
      const id = inp.slot === 1 ? f.primary : inp.slot === 2 ? f.secondary : inp.slot === 3 ? 'knife' : null;
      if (id && f.inv[id]) f.setWeapon(id);
    }
    if (inp.cycleCount !== f.seenCycle) {
      f.seenCycle = inp.cycleCount;
      const list = [f.primary, f.secondary, 'knife'].filter((w) => w && f.inv[w]);
      const i = Math.max(0, list.indexOf(f.weapon));
      f.setWeapon(list[(i + inp.cycleDir + list.length) % list.length]);
    }
    W = f.wstat(); inv = f.inv[f.weapon];
    // recoger armas del suelo (E)
    if (inp.interactCount !== f.seenInteract) { f.seenInteract = inp.interactCount; if (f.state === 'stand' && !f.mantle && !(G.mode && G.mode.story && Inv.tryPickup(f))) WorldItems.tryPickup(f); }
    // cuchillo rápido (F)
    if (inp.meleeCount !== f.seenMelee) { f.seenMelee = inp.meleeCount; if (f.state === 'stand' && !f.mantle && !f.grenadeCook && !G.freeze) this.startMelee(f); }
    this.tickMelee(f, dt);
    // granada: mantener G cocina, soltar lanza; 4 lanza humo
    this.tickGrenade(f, dt);
    if (inp.tacticalCount !== f.seenTac) { f.seenTac = inp.tacticalCount; this.throwSmoke(f); }
    // recarga
    if (inp.reloadCount !== f.seenReload) { f.seenReload = inp.reloadCount; this.startReload(f); }
    if (f.autoReloadT > 0) { f.autoReloadT -= dt; if (f.autoReloadT <= 0) this.startReload(f); }
    if (f.reloadT > 0) {
      f.reloadT -= dt;
      if (f.reloadT <= 0) {
        const take = Math.min(W.mag - inv.mag, inv.reserve);
        inv.mag += take; if (Number.isFinite(inv.reserve)) inv.reserve -= take;
        BUS.emit('reloaded', f);
      }
    }
    if (f.state !== 'stand' || G.freeze || !f.alive || f.mantle || f.grenadeCook || f.throwT > 0 || f.meleeT > 0 || f.switchT > 0 || proneMove || f.targeting || f.fireBlockT > 0) { if (W.auto || f.switchT <= 0 || f.targeting || f.fireBlockT > 0) f.seenFire = inp.fireCount; return; }
    // disparo
    const want = (W.burst && f.burstN > 0) || (W.auto ? (inp.fire || inp.fireCount !== f.seenFire) : inp.fireCount !== f.seenFire);
    if (!want) return;
    if (f.sprinting) { f.sprintBlockT = 0.3; return; }
    if (f.sprintOut > 0) return;
    if (f.fireCd > 0) { if (!W.auto && f.fireCd > 0.25) f.seenFire = inp.fireCount; return; }
    f.seenFire = inp.fireCount;
    if (W.kind === 'melee') { this.startMelee(f); return; }
    if (W.burst && f.burstN <= 0) f.burstN = 0;
    if (inv.mag <= 0) { f.burstN = 0; if (inv.reserve > 0) this.startReload(f); else { BUS.emit('dryfire', f); this.autoSwitch(f); } f.fireCd = 0.25; return; }
    if (f.reloadT > 0) f.reloadT = 0; // recarga táctica: disparar la cancela si queda cargador
    this.fire(f, W, inv);
  },
  autoSwitch(f) {
    const sc = f.secondary;
    if (f.weapon !== sc && f.inv[sc] && (f.inv[sc].mag > 0 || f.inv[sc].reserve > 0)) f.setWeapon(sc);
    else if (f.weapon !== 'knife') f.setWeapon('knife');
  },
  startReload(f) {
    const W = f.wstat(), inv = f.inv[f.weapon];
    if (!inv || W.kind === 'melee' || f.reloadT > 0 || inv.mag >= W.mag || inv.reserve <= 0 || f.meleeT > 0) return;
    f.reloadTotal = f.reloadT = inv.mag > 0 ? W.reloadTac : W.reload;
    f.reloadTac = inv.mag > 0;
    f.adsT = Math.min(f.adsT, W.scope ? 0 : 1);
    BUS.emit('reload', f);
  },
  currentSpread(f, W) {
    const hs = Math.hypot(f.vel.x, f.vel.z);
    let s = lerp(W.hip, W.ads, smooth01(f.adsT)) + f.bloom;
    s += (W.moveSpread || 0) * clamp(hs / 5, 0, 1.4) * (1 - 0.6 * f.adsT);
    if (!f.grounded) s += W.airSpread || 0;
    if (f.crouching && !f.sliding) s *= 0.82;
    if (f.prone) s *= 0.6;
    if (f.armT > 0) s += CONFIG.WOUND.armSpread * Math.min(1, f.armT);
    if (W.scope && f.adsT < 0.95) s = Math.max(s, W.hip * (1 - f.adsT));
    return s;
  },

  fire(f, W, inv) {
    inv.mag--; f.fireCd = 1 / W.fireRate; f.shotIndex++;
    if (W.burst) { f.burstN = (f.burstN || 0) + 1; if (f.burstN >= W.burst) { f.burstN = 0; f.fireCd = W.burstCd; } } f.stats.shots++; f.lastShotT = G.time; f.invulnT = 0;
    const ray = aimRay(f);
    const seed = hash32(f.id, f.shotIndex, G.roundSeed || 1);
    const shot = { origin: ray.origin.clone(), dir: ray.dir.clone(), seed, weapon: W.id, spread: this.currentSpread(f, W) };
    this.resolveShot(f, W, shot, true);
    // retroceso con patrón aprendible
    const i = f.sprayN++; f.sprayT = 0.28;
    const k = lerp(1, 0.8, f.adsT) * (f.crouching && !f.sliding ? 0.85 : 1) * (f.prone ? 0.6 : 1) * (f.armT > 0 ? CONFIG.WOUND.armRecoilMul : 1) * (W.bipod && (f.prone || f.crouching) ? 0.5 : 1);
    const kv = W.recoilV * k * (i < 3 ? 1.15 : 1);
    const kh = W.recoilH * k * RECOIL_PAT[W.id][i % 40];
    f.input.pitch = clamp(f.input.pitch + kv, -1.45, 1.45); f.input.yaw -= kh;
    if (f.brain) { f.brain.aimPitch += kv; f.brain.aimYaw -= kh; }
    f.recoilAcc += kv;
    f.bloom = Math.min(W.bloomMax || 0, f.bloom + (W.bloom || 0));
    if (f.kind === 'local') { CAM.punch += kv * 0.8; CAM.punchYaw -= kh * 0.4; CAM.addShake(W.recoilV * 1.2); }
    if (f.view) f.view.recoilK = 1;
    BUS.emit('fire', f, shot);
    NET.onLocalFire(f, shot);
    if (inv.mag <= 0 && inv.reserve > 0) f.autoReloadT = 0.32;
  },

  // determinista: con el mismo disparo (origen, dirección, dispersión, semilla) todos calculan las mismas balas
  resolveShot(f, W, shot, authoritative) {
    const rng = new RNG(shot.seed);
    const muzzle = f.view ? f.view.muzzleWorld(this._mz) : this._mz.copy(shot.origin);
    if (W.kind === 'projectile') {
      const wh = PHYS.raycast(shot.origin, shot.dir, W.range, {});
      let maxT = wh ? wh.t : W.range;
      const fh = Combat.rayFighters(shot.origin, shot.dir, maxT, f);
      if (fh) maxT = fh.t;
      const aimPt = shot.origin.clone().addScaledVector(shot.dir, Math.max(maxT, 2));
      const md = aimPt.clone().sub(muzzle); md.normalize();
      const block = PHYS.raycast(shot.origin, _v3.copy(muzzle).sub(shot.origin).normalize(), shot.origin.distanceTo(muzzle), {});
      const start = block ? shot.origin.clone() : muzzle.clone();
      const vdir = block ? shot.dir.clone() : md;
      Projectiles.spawnRocket(f, start, vdir.multiplyScalar(W.projSpeed), W.id, authoritative);
      return;
    }
    // fusiles con mira: bala balística con tiempo de vuelo, caída y viento (07d_ballistics)
    if (W.longRange && W.pellets === 1) { spreadDir(shot.dir, shot.spread, rng, this._d); Ballistics.spawn(f, W, shot, this._d, muzzle, authoritative); return; }
    const hits = new Map();
    const d = this._d;
    const lp = G.local && G.local.alive && G.local !== f ? _v7.set(G.local.pos.x, G.local.pos.y + 1.55, G.local.pos.z) : null;
    let whizzed = false, hitLocal = false;
    const PN = CONFIG.PEN;
    for (let i = 0; i < W.pellets; i++) {
      spreadDir(shot.dir, shot.spread, rng, d);
      // la bala puede atravesar madera y lámina delgadas (hasta PN.maxPass veces) perdiendo daño
      let o = shot.origin, tOff = 0, dmgMul = 1, pen = false, end = null, totalT = W.range;
      for (let pass = 0; pass <= PN.maxPass; pass++) {
        const rem = W.range - tOff;
        const wh = PHYS.raycast(o, d, rem, this._wh);
        const maxT = wh ? wh.t : rem;
        const fh = Combat.rayFighters(o, d, maxT, f);
        const ch = !fh ? Corpses.raycast(o, d, maxT) : null;
        end = fh ? fh.point : ch ? ch.point : wh ? wh.point : this._end.copy(o).addScaledVector(d, rem);
        totalT = tOff + (fh ? fh.t : maxT);
        if (fh) {
          if (fh.fighter === G.local) hitLocal = true;
          const dist = tOff + fh.t;
          const fall = dist <= W.fall0 ? 1 : dist >= W.fall1 ? W.fallMin : lerp(1, W.fallMin, (dist - W.fall0) / (W.fall1 - W.fall0));
          const zone = fh.part === 'head' ? W.headMul : fh.part === 'legs' ? W.legMul : fh.part === 'arms' ? (W.armMul ?? 0.95) : 1;
          const h = hits.get(fh.fighter) || { damage: 0, imp: new THREE.Vector3(), point: fh.point.clone(), part: fh.part, n: 0, dist, pen: false };
          h.damage += W.damage * fall * zone * dmgMul; h.imp.addScaledVector(d, W.push * (pen ? 0.6 : 1)); h.n++;
          if (pen) h.pen = true;
          if (fh.part === 'head') { h.part = 'head'; h.point.copy(fh.point); }
          else if (fh.part !== 'body' && h.part !== 'head') { h.part = fh.part; h.point.copy(fh.point); }
          hits.set(fh.fighter, h);
        } else if (ch) {
          ch.ragdoll.applyImpulse(_v4.copy(d).multiplyScalar(Math.min(W.push * 1.6, 4)), ch.point, ch.part);
          FX.fleshHit(ch.point, d, 0.6);
        } else if (wh) {
          const b = wh.block, light = W.pellets > 1 ? 0.45 : 1;
          FX.impact(wh.point, wh.normal, b.surface, light);
          if (authoritative) MapSys.damageBlock(b, W.damage * (W.pellets > 1 ? 0.5 : 0.8), wh.point, f);
          const k = PN.mat[b.surface] || 0;
          if (W.pen > 0 && pass < PN.maxPass && k > 0 && !b.ramp && b.kind !== 'floor' && b.kind !== 'barrel' && b.active) {
            const thick = PHYS.rayExit(b, o, d) - wh.t, eff = thick / k;
            if (thick > 0.001 && eff <= W.pen) {
              // sale por el otro lado: orificio, astillas y la bala sigue con menos daño
              const ex = new THREE.Vector3().copy(wh.point).addScaledVector(d, thick + 0.02);
              FX.impact(ex, d.clone(), b.surface, 0.55);
              dmgMul *= Math.max(0.3, PN.keep * (1 - 0.35 * eff / W.pen));
              pen = true; tOff = totalT + thick + 0.02; o = ex;
              continue;
            }
          }
        }
        break;
      }
      if (W.pellets === 1 || i % 3 === 0) FX.tracer(muzzle, end, W.pellets > 1 ? 0.6 : 1);
      // bala que pasa zumbando cerca de tu cabeza
      if (lp && !whizzed && !hitLocal) {
        const r = rayPointDist(shot.origin, d, totalT, lp);
        if (r.dist < 1.3 && r.t > 2.5) { whizzed = true; BUS.emit('whiz', _v8.copy(shot.origin).addScaledVector(d, r.t)); }
      }
    }
    if (!authoritative) return;
    for (const [target, h] of hits) {
      f.stats.hits++;
      Combat.hit({ attacker: f, target, damage: h.damage, impulse: h.imp, point: h.point, part: h.part, weapon: W.id, kind: 'bullet', dist: h.dist, shotTime: G.time, shot: shot.seed, pen: h.pen || false });
    }
  },

  // ---------------- cuchillo ----------------
  startMelee(f) {
    if (f.meleeCd > 0 || f.meleeT > 0) return;
    const W = CONFIG.WEAPONS.knife;
    f.meleeT = 0.42; f.meleeCd = 0.72; f.meleeDone = false; f.reloadT = 0; f.sprinting = false; f.sprintBlockT = 0.3; f.adsT = 0;
    if (f.view) f.view.swing = 1;
    const fwd = dirFromYawPitch(f.input.yaw, f.input.pitch, new THREE.Vector3());
    const flat = _v2.set(fwd.x, 0, fwd.z).normalize();
    const bay = f.wstat && f.wstat().bayonet ? 0.7 : 0;   // con la bayoneta calada se llega más lejos
    const tgt = this.meleeTarget(f, W.range + 1.4 + bay);
    if (tgt && f.grounded) f.vel.addScaledVector(flat, W.lunge);
    BUS.emit('swing', f);
    NET.onLocalFire(f, { weapon: 'knife', origin: f.pos, dir: fwd, seed: 0, spread: 0 });
  },
  tickMelee(f, dt) {
    if (f.meleeT <= 0) return;
    f.meleeT -= dt;
    if (!f.meleeDone && f.meleeT <= 0.42 - CONFIG.WEAPONS.knife.hitDelay) { f.meleeDone = true; if (f.alive) this.meleeHit(f); }
  },
  meleeTarget(f, range) {
    const c = _v5.set(f.pos.x, f.pos.y + 1.2, f.pos.z), fwd = dirFromYawPitch(f.input.yaw, 0, _v6);
    let best = null, bd = Infinity;
    for (const t of G.fighters) {
      if (t === f || !t.alive || t.hidden || (G.mode.teams && t.team === f.team)) continue;
      const tp = t.centerPos(_v3), dx = tp.x - c.x, dz = tp.z - c.z, dy = tp.y - c.y, dist = Math.hypot(dx, dz);
      if (dist > range + 0.3 || Math.abs(dy) > 1.6) continue;
      if ((dx * fwd.x + dz * fwd.z) / (dist || 1) < Math.cos(CONFIG.WEAPONS.knife.arc) && dist > 0.8) continue;
      if (!PHYS.lineOfSight(c, tp)) continue;
      if (dist < bd) { bd = dist; best = t; }
    }
    return best;
  },
  meleeHit(f) {
    const W = CONFIG.WEAPONS.knife;
    const t = this.meleeTarget(f, W.range + (f.wstat && f.wstat().bayonet ? 0.7 : 0));
    const fwd = dirFromYawPitch(f.input.yaw, f.input.pitch, new THREE.Vector3());
    if (t) {
      f.stats.hits++;
      const imp = new THREE.Vector3(fwd.x, 0, fwd.z).normalize().multiplyScalar(W.push).setY(0.8);
      if (Rules.canAuthor(f) || NET.isAuthorityFor(f)) Combat.hit({ attacker: f, target: t, damage: f.meleeDmg ?? W.damage, impulse: imp, point: t.centerPos(new THREE.Vector3()), part: 'body', weapon: 'knife', kind: 'melee', dist: 1, shotTime: G.time });
      BUS.emit('stab', f, t);
      return;
    }
    const eye = eyePosOf(f, _v4);
    const wh = PHYS.raycast(eye, fwd, W.range, {});
    if (wh) { FX.impact(wh.point, wh.normal, wh.block.surface, 0.5); BUS.emit('knifeWall', wh.point); }
  },

  // ---------------- humo (4): se lanza al instante, sin cocinar ----------------
  throwSmoke(f) {
    if (f.smokes <= 0 || f.state !== 'stand' || f.mantle || f.grenadeCook || f.throwT > 0 || f.meleeT > 0 || G.freeze || !f.alive) return;
    f.smokes--; f.reloadT = 0; f.sprinting = false; f.sprintBlockT = 0.3; f.adsT = 0; f.throwT = 0.38;
    Grenades.throwFrom(f, CONFIG.SMOKE.fuse, 'smoke', !!(f.input.aim || f.crouching));
  },
  // ---------------- granadas ----------------
  tickGrenade(f, dt) {
    const inp = f.input, GR = CONFIG.GRENADE;
    if (f.grenadeCook) {
      const held = G.time - f.grenadeCook.t0;
      if (held >= GR.fuse || !f.alive || f.state !== 'stand') {
        // se cocinó demasiado (o lo derribaron): explota en la mano
        const p = f.state === 'ragdoll' && f.ragdoll ? f.ragdoll.torsoPos(new THREE.Vector3()) : new THREE.Vector3(f.pos.x, f.pos.y + 1.2, f.pos.z);
        f.grenadeCook = null; f.grenades = Math.max(0, f.grenades - 1);
        Grenades.spawn(f, p, new THREE.Vector3(0, 0, 0), Math.max(0, GR.fuse - held), true, Grenades.newId(f));
        return;
      }
      if (!inp.grenade) { const left = GR.fuse - held; f.grenadeCook = null; Grenades.throwFrom(f, left, 'frag', !!(inp.aim || f.crouching)); f.throwT = 0.38; }
      return;
    }
    if (inp.grenade && !f.grenadeHeldPrev && f.grenades > 0 && f.state === 'stand' && !f.mantle && f.meleeT <= 0 && !G.freeze && f.alive) {
      f.grenadeCook = { t0: G.time }; f.reloadT = 0; f.sprinting = false; f.sprintBlockT = 0.3; f.adsT = 0;
      BUS.emit('pin', f);
    }
    f.grenadeHeldPrev = inp.grenade;
  },
};

// ---------------- GRANADAS (física real con rebotes) ----------------
const Grenades = {
  list: [], _n: 0,
  newId(f) { return (f.slot + 1) * 100000 + (++this._n % 100000); },
  // parámetros de lanzamiento compartidos por el lanzamiento real y la trayectoria de vista previa
  // soft: lanzamiento suave por debajo (apuntando con el botón derecho o agachado): menos velocidad y arco más alto, para rodar granadas por esquinas y puertas
  launch(f, type = 'frag', soft = false, out = {}) {
    const GR = CONFIG.GRENADE;
    const fwd = dirFromYawPitch(f.input.yaw, f.input.pitch, out.fwd || (out.fwd = new THREE.Vector3()));
    const eye = eyePosOf(f, out.eye || (out.eye = new THREE.Vector3())); eye.y -= 0.05;
    const right = new THREE.Vector3(Math.cos(f.input.yaw), 0, -Math.sin(f.input.yaw));
    const want = eye.clone().addScaledVector(fwd, 0.45).addScaledVector(right, 0.15);
    const dd = want.clone().sub(eye), L = dd.length(); dd.multiplyScalar(1 / L);
    const blk = PHYS.raycast(eye, dd, L + 0.1, {});
    const origin = blk ? eye.clone().addScaledVector(dd, Math.max(0, blk.t - 0.15)) : want;
    const sp = (type === 'smoke' ? CONFIG.SMOKE.throwSpeed : GR.throwSpeed) * (soft ? 0.52 : 1);
    const vel = fwd.clone().multiplyScalar(sp).add(new THREE.Vector3(0, soft ? GR.upBoost * 0.55 : GR.upBoost, 0)).addScaledVector(f.vel, 0.5);
    return { origin, vel };
  },
  throwFrom(f, fuseLeft, type = 'frag', soft = false) {
    const GR = CONFIG.GRENADE;
    if (type === 'frag') f.grenades = Math.max(0, f.grenades - 1);
    const { origin, vel } = this.launch(f, type, soft);
    const id = this.newId(f);
    this.spawn(f, origin, vel, fuseLeft, true, id, type);
    BUS.emit('throw', f);
    if (NET.active) NET.queue('g', [f.slot, id, r2(origin.x), r2(origin.y), r2(origin.z), r2(vel.x), r2(vel.y), r2(vel.z), r2(fuseLeft), type === 'smoke' ? 1 : 0]);
  },
  // trayectoria de vista previa mientras se sostiene la granada: misma física (gravedad, freno del aire, hasta 3 rebotes)
  _pv: null,
  preview(f, show) {
    let P = this._pv;
    if (!P) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(100 * 3), 3));
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }));
      line.frustumCulled = false; line.renderOrder = 6;
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.22, 24), new THREE.MeshBasicMaterial({ color: 0xffb040, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
      ring.renderOrder = 6;
      P = this._pv = { line, ring, v: new THREE.Vector3(), p: new THREE.Vector3(), n: new THREE.Vector3(), d: new THREE.Vector3(), added: false };
    }
    if (!show) { if (P.added) { G.root.remove(P.line); G.root.remove(P.ring); P.added = false; } return; }
    if (!P.added) { G.root.add(P.line); G.root.add(P.ring); P.added = true; }
    const GR = CONFIG.GRENADE, soft = !!(f.input.aim || f.crouching), { origin, vel } = this.launch(f, 'frag', soft, P);
    const pos = P.p.copy(origin), v = P.v.copy(vel), arr = P.line.geometry.attributes.position.array, dt = 1 / 30;
    let k = 0, bounces = 0, endN = null;
    arr[k++] = pos.x; arr[k++] = pos.y; arr[k++] = pos.z;
    for (let i = 0; i < 98 && bounces < 3; i++) {
      v.y -= CONFIG.MOVE.gravity * dt; v.multiplyScalar(1 - 0.12 * dt);
      const step = v.length() * dt, d = P.d.copy(v).normalize();
      const h = PHYS.raycast(pos, d, step + 0.08, {});
      if (h) {
        pos.copy(h.point).addScaledVector(h.normal, 0.08); endN = h.normal;
        const vn = v.dot(h.normal); v.addScaledVector(h.normal, -(1 + 0.38) * vn).multiplyScalar(0.8); bounces++;
        arr[k++] = pos.x; arr[k++] = pos.y; arr[k++] = pos.z;
        if (v.length() < 1.2) break;
      } else { pos.addScaledVector(v, dt); arr[k++] = pos.x; arr[k++] = pos.y; arr[k++] = pos.z; }
    }
    P.line.geometry.setDrawRange(0, k / 3); P.line.geometry.attributes.position.needsUpdate = true;
    P.ring.position.copy(pos); P.n.copy(endN || P.n.set(0, 1, 0)); P.ring.lookAt(pos.x + P.n.x, pos.y + P.n.y, pos.z + P.n.z);
    P.ring.material.color.setHex(soft ? 0x7ad0ff : 0xffb040); P.line.material.color.setHex(soft ? 0x9adcff : 0xffffff);
  },
  spawn(owner, pos, vel, fuse, authoritative, id, type = 'frag') {
    const body = new CANNON.Body({ mass: 0.45, shape: new CANNON.Sphere(0.075), material: PHYS.materials.grenade, linearDamping: 0.12, angularDamping: 0.4,
      collisionFilterGroup: CG.DEBRIS, collisionFilterMask: CG.STATIC | CG.PROP | CG.FIGHTER | RAG_ALL, allowSleep: false });
    body.position.set(pos.x, pos.y, pos.z); body.velocity.set(vel.x, vel.y, vel.z);
    body.angularVelocity.set(frand(-8, 8), frand(-8, 8), frand(-8, 8));
    const g = { id, owner, body, fuse, authoritative, type, mesh: type === 'smoke' ? buildSmokeMesh() : buildGrenadeMesh(), lastBounce: 0, age: 0, cooked: type === 'frag' && fuse <= 1.5 };
    body.addEventListener('collide', (e) => { const v = Math.abs(e.contact.getImpactVelocityAlongNormal()); if (v > 1.5 && G.time - g.lastBounce > 0.08) { g.lastBounce = G.time; BUS.emit('nadeBounce', body.position, v); } });
    PHYS.world.addBody(body);
    G.root.add(g.mesh);
    this.list.push(g);
    return g;
  },
  tick(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const g = this.list[i];
      g.fuse -= dt; g.age += dt;
      const p = g.body.position;
      if (p.y < CONFIG.KILL_Y) { this.remove(i); continue; }
      if (g.fuse <= 0 && (g.authoritative || g.fuse < -0.7)) { this.explode(g, g.authoritative); this.remove(i); }
    }
  },
  animate() {
    for (const g of this.list) {
      const p = g.body.position, q = g.body.quaternion; g.mesh.position.set(p.x, p.y, p.z); g.mesh.quaternion.set(q.x, q.y, q.z, q.w);
      // la luz parpadea más rápido según se acaba la mecha; el resplandor se queda mirando siempre hacia arriba del mundo (no gira con la granada)
      const U = g.mesh.userData, per = g.fuse > 2 ? 0.5 : g.fuse > 1 ? 0.26 : 0.12, on = (g.age % per) < per * 0.5;
      if (U.led) { U.led.material.color.copy(U.col).multiplyScalar(on ? 1 : 0.25); U.glow.material.opacity = on ? 0.9 : 0.22; U.glow.scale.setScalar(on ? 0.7 : 0.5); }
    }
  },
  explode(g, authoritative) {
    const GR = CONFIG.GRENADE, p = g.body.position;
    const pos = new THREE.Vector3(p.x, p.y + 0.05, p.z);
    if (g.type === 'smoke') Smoke.spawn(pos, g.owner);
    else Combat.explode({ pos, radius: GR.radius, damage: GR.damage, push: GR.push, owner: g.owner, weapon: 'frag', authoritative, cooked: g.cooked });
    if (authoritative && NET.active) NET.queue('gx', [g.id, r2(pos.x), r2(pos.y), r2(pos.z), g.type === 'smoke' ? 1 : 0]);
  },
  remoteExplode(id, x, y, z, smoke) {
    const i = this.list.findIndex((g) => g.id === id);
    if (i < 0) { if (smoke) Smoke.spawn(new THREE.Vector3(x, y, z), null); else Combat.explode({ pos: new THREE.Vector3(x, y, z), radius: CONFIG.GRENADE.radius, damage: CONFIG.GRENADE.damage, push: CONFIG.GRENADE.push, owner: null, weapon: 'frag', authoritative: false }); return; }
    const g = this.list[i]; g.body.position.set(x, y - 0.05, z);
    this.explode(g, false); this.remove(i);
  },
  near(p, r) { return this.list.filter((g) => { const b = g.body.position; return (b.x - p.x) ** 2 + (b.y - p.y) ** 2 + (b.z - p.z) ** 2 < r * r; }); },
  remove(i) { const g = this.list[i]; PHYS.world.removeBody(g.body); G.root.remove(g.mesh); this.list.splice(i, 1); },
  clear() { for (let i = this.list.length - 1; i >= 0; i--) this.remove(i); },
};
// resplandor suave (textura radial generada una sola vez): hace visible la granada aunque caiga en un interior oscuro
let _nadeGlowTex = null;
function nadeGlowTex() {
  if (_nadeGlowTex) return _nadeGlowTex;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const x = cv.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  _nadeGlowTex = new THREE.CanvasTexture(cv); _nadeGlowTex.userData = { shared: true };
  return _nadeGlowTex;
}
// luz de aviso y resplandor propios de cada granada (materiales sin iluminación: siempre se ven)
function nadeBeacon(g, color, y) {
  const led = new THREE.Mesh(GEO.sphere(0.026, 8, 6), new THREE.MeshBasicMaterial({ color, fog: false })); led.position.set(0, y, 0); g.add(led);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: nadeGlowTex(), color, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.scale.set(0.62, 0.62, 1); glow.position.set(0, y, 0); g.add(glow);
  g.userData.led = led; g.userData.glow = glow; g.userData.col = new THREE.Color(color);
}
function buildSmokeMesh() {
  const g = new THREE.Group();
  const b = mesh(GEO.cyl(0.062, 0.062, 0.2, 10), MAT.lam(0x8a9096), 0, 0, 0, g); b.castShadow = true;
  mesh(GEO.cyl(0.064, 0.064, 0.04, 10), MAT.basic(0xe8e8e0), 0, 0.04, 0, g);
  mesh(GEO.cyl(0.064, 0.064, 0.025, 10), MAT.basic(0xe8e8e0), 0, -0.05, 0, g);
  mesh(GEO.cyl(0.033, 0.04, 0.045, 8), MAT.lam(0x5a5c60), 0, 0.12, 0, g);
  nadeBeacon(g, 0x7ad0ff, 0.15);
  return g;
}
function buildGrenadeMesh() {
  const g = new THREE.Group();
  const b = mesh(GEO.sphere(0.088, 10, 8), MAT.lam(0x59703a), 0, 0, 0, g); b.scale.set(1, 1.18, 1); b.castShadow = true;
  const band = mesh(GEO.cyl(0.09, 0.09, 0.03, 10), MAT.basic(0xd8b83a), 0, 0.01, 0, g); band.scale.set(1, 1, 1);
  mesh(GEO.cyl(0.033, 0.04, 0.055, 8), MAT.lam(0x8a8d90), 0, 0.11, 0, g);
  mesh(GEO.box(0.022, 0.085, 0.034), MAT.lam(0x8a8d90), 0.036, 0.085, 0, g);
  nadeBeacon(g, 0xff4a2a, 0.15);
  return g;
}

// ---------------- COHETES ----------------
const Projectiles = {
  list: [],
  spawnRocket(owner, pos, vel, weapon, authoritative) {
    const g = new THREE.Group();
    const body = mesh(GEO.cyl(0.055, 0.055, 0.5, 8), MAT.lam(0x4a5236), 0, 0, 0, g); body.rotation.x = Math.PI / 2;
    const tip = mesh(GEO.cone(0.07, 0.22, 8), MAT.lam(0x2d3322), 0, 0, -0.35, g); tip.rotation.x = -Math.PI / 2;
    for (let i = 0; i < 4; i++) { const fin = mesh(GEO.box(0.015, 0.12, 0.12), MAT.lam(0x2d3322), 0, 0, 0.22, g); fin.rotation.z = (i / 4) * TAU; fin.position.set(Math.sin(i / 4 * TAU) * 0.06, Math.cos(i / 4 * TAU) * 0.06, 0.22); }
    G.root.add(g);
    g.position.copy(pos); g.lookAt(_v1.copy(pos).sub(vel));
    this.list.push({ owner, pos: pos.clone(), vel: vel.clone(), life: 6, mesh: g, weapon, authoritative, age: 0 });
  },
  tick(dt) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const r = this.list[i];
      r.age += dt; r.life -= dt;
      r.vel.y -= CONFIG.MOVE.gravity * 0.05 * dt;
      const step = r.vel.length() * dt;
      const d = _v1.copy(r.vel).normalize();
      let hitT = Infinity, hitP = null, direct = null;
      const wh = PHYS.raycast(r.pos, d, step + 0.15, {});
      if (wh) { hitT = wh.t; hitP = wh.point.clone().addScaledVector(wh.normal, 0.1); }
      const fh = Combat.rayFighters(r.pos, d, Math.min(hitT, step + 0.3), r.age < 0.12 ? r.owner : null, 0.15);
      if (fh && fh.t < hitT) { hitT = fh.t; hitP = fh.point.clone(); direct = fh.fighter; }
      if (hitP || r.life <= 0 || r.pos.y < CONFIG.KILL_Y) {
        const W = CONFIG.WEAPONS[r.weapon];
        Combat.explode({ pos: (hitP || r.pos).clone(), radius: W.radius, damage: W.damage, push: W.push, owner: r.owner, weapon: r.weapon, authoritative: r.authoritative, direct });
        this.remove(i); continue;
      }
      r.pos.addScaledVector(r.vel, dt);
      r.mesh.position.copy(r.pos);
      r.mesh.lookAt(_v2.copy(r.pos).sub(r.vel));
      FX.rocketTrail(r.pos, r.vel);
    }
  },
  remove(i) { const r = this.list[i]; G.root.remove(r.mesh); this.list.splice(i, 1); },
  clear() { for (let i = this.list.length - 1; i >= 0; i--) this.remove(i); },
};

// ---------------- COMBATE ----------------
const Combat = {
  _o: new THREE.Vector3(), _c: new THREE.Vector3(), _imp: new THREE.Vector3(), _zero: new THREE.Vector3(), _ec: new THREE.Vector3(), _ed: new THREE.Vector3(), _hp: new THREE.Vector3(),
  raySphere(o, d, c, r) {
    const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z;
    const b = ox * d.x + oy * d.y + oz * d.z, cc = ox * ox + oy * oy + oz * oz - r * r;
    const disc = b * b - cc; if (disc < 0) return Infinity;
    const t = -b - Math.sqrt(disc);
    return t >= 0 ? t : (cc < 0 ? 0 : Infinity);
  },
  // cápsula vertical entre y0..y1
  rayCapsule(o, d, cx, cz, y0, y1, r) {
    let best = Infinity;
    const dx = d.x, dz = d.z, ox = o.x - cx, oz = o.z - cz;
    const a = dx * dx + dz * dz;
    if (a > 1e-8) {
      const b = ox * dx + oz * dz, c = ox * ox + oz * oz - r * r, disc = b * b - a * c;
      if (disc >= 0) {
        const t = (-b - Math.sqrt(disc)) / a;
        if (t >= 0) { const y = o.y + d.y * t; if (y >= y0 && y <= y1) best = t; }
      }
    }
    if (best === Infinity) best = Math.min(this.raySphere(o, d, this._c.set(cx, y0, cz), r), this.raySphere(o, d, this._c.set(cx, y1, cz), r));
    return best;
  },
  // cápsula entre dos puntos (aprox.: esfera en el punto del segmento más cercano al rayo)
  raySeg(o, d, ax, ay, az, bx, by, bz, r) {
    const ux = bx - ax, uy = by - ay, uz = bz - az, wx = o.x - ax, wy = o.y - ay, wz = o.z - az;
    const B = d.x * ux + d.y * uy + d.z * uz, C = ux * ux + uy * uy + uz * uz, D = d.x * wx + d.y * wy + d.z * wz, E = ux * wx + uy * wy + uz * wz;
    const den = C - B * B;
    let k = den > 1e-8 ? clamp((E - B * D) / den, 0, 1) : 0;
    return this.raySphere(o, d, this._c.set(ax + ux * k, ay + uy * k, az + uz * k), r);
  },
  // zonas de impacto (cabeza, torso y piernas como cápsulas) según la postura de la simulación
  zones(t, p, out = this._z) {
    const fx = -Math.sin(t.yaw), fz = -Math.cos(t.yaw), rx = -fz, rz = fx;
    const seg = (k, x0, y0, z0, x1, y1, z1, r) => {
      const A = out[k + 'a'] || (out[k + 'a'] = [0, 0, 0]), B = out[k + 'b'] || (out[k + 'b'] = [0, 0, 0]);
      A[0] = x0; A[1] = y0; A[2] = z0; B[0] = x1; B[1] = y1; B[2] = z1; out[k + 'r'] = r;
    };
    if (t.prone || t.proneT > 0.5) {
      out.hx = p.x + fx * 0.62; out.hy = p.y + 0.32; out.hz = p.z + fz * 0.62;
      seg('t', p.x + fx * 0.42, p.y + 0.24, p.z + fz * 0.42, p.x - fx * 0.22, p.y + 0.22, p.z - fz * 0.22, 0.22);
      seg('l', p.x - fx * 0.25, p.y + 0.14, p.z - fz * 0.25, p.x - fx * 1.05, p.y + 0.12, p.z - fz * 1.05, 0.15);
      out.arms = false;
      return out;
    }
    let hy, hf, t0, t1, tr, tf, l0, l1, lr, lf;
    if (t.sliding) { hy = 0.74; hf = -0.2; t0 = 0.32; t1 = 0.62; tr = 0.27; tf = -0.05; l0 = 0.05; l1 = 0.32; lr = 0.26; lf = 0.35; }
    else if (t.crouching) { hy = 1.1; hf = 0.12; t0 = 0.62; t1 = 0.94; tr = 0.27; tf = 0.07; l0 = 0.05; l1 = 0.58; lr = 0.25; lf = 0; }
    else if (t.mantle) { hy = 1.42; hf = 0.15; t0 = 0.75; t1 = 1.25; tr = 0.27; tf = 0.1; l0 = 0.1; l1 = 0.75; lr = 0.22; lf = 0; }
    else { hy = 1.665; hf = 0.02; t0 = 0.98; t1 = 1.44; tr = 0.25; tf = 0; l0 = 0.08; l1 = 0.96; lr = 0.19; lf = 0; }
    // asomarse: cabeza y hombros se desplazan de lado
    const lo = t.leanOff || 0;
    out.hx = p.x + fx * hf + rx * lo * 0.85; out.hy = p.y + hy - Math.abs(lo) * 0.12; out.hz = p.z + fz * hf + rz * lo * 0.85;
    seg('t', p.x + fx * tf, p.y + t0, p.z + fz * tf, p.x + fx * tf + rx * lo * 0.5, p.y + t1, p.z + fz * tf + rz * lo * 0.5, tr);
    seg('l', p.x + fx * lf, p.y + l0, p.z + fz * lf, p.x + fx * lf, p.y + l1, p.z + fz * lf, lr);
    // brazos: del hombro a la mano que sostiene el arma (delante del pecho)
    const sy = p.y + t1 - 0.05, hy2 = p.y + t1 - 0.2, bx = p.x + fx * (tf + 0.2) + rx * lo * 0.5, bz = p.z + fz * (tf + 0.2) + rz * lo * 0.5;
    seg('r', bx + rx * 0.27 - fx * 0.2, sy, bz + rz * 0.27 - fz * 0.2, bx + rx * 0.13 + fx * 0.2, hy2, bz + rz * 0.13 + fz * 0.2, 0.072);
    seg('m', bx - rx * 0.27 - fx * 0.2, sy, bz - rz * 0.27 - fz * 0.2, bx - rx * 0.1 + fx * 0.28, hy2, bz - rz * 0.1 + fz * 0.28, 0.072);
    out.arms = true;
    return out;
  },
  _z: {},
  // impacto contra soldados vivos (opcional: posición histórica para compensación de latencia)
  rayFighters(o, d, maxT, exclude, pad = 0, posFn) {
    let best = null, bestT = maxT;
    for (const t of G.fighters) {
      if (t === exclude || !t.view || t.hidden || !t.alive) continue;
      if (t.state === 'ragdoll' && t.ragdoll) {
        for (const n of PART_NAMES) {
          const pp = t.ragdoll.partPos(n, _v8);
          const tt = this.raySphere(o, d, pp, PART_RADIUS[n] * 1.25 + pad);
          if (tt < bestT) { bestT = tt; best = { fighter: t, t: tt, part: n === 'head' ? 'head' : (n.startsWith('thigh') || n.startsWith('shin')) ? 'legs' : (n.startsWith('upperArm') || n.startsWith('foreArm')) ? 'arms' : 'body' }; }
        }
        continue;
      }
      const p = posFn ? posFn(t, this._o) : t.pos;
      // descarte rápido
      if (rayPointDist(o, d, bestT, _v8.set(p.x, p.y + 0.8, p.z)).dist > 1.9) continue;
      const z = this.zones(t, p);
      const th = this.raySphere(o, d, this._hp.set(z.hx, z.hy, z.hz), CONFIG.FIGHTER.headRadius + pad);
      if (th < bestT) { bestT = th; best = { fighter: t, t: th, part: 'head' }; }
      const ta = z.ta, tb_ = z.tb, la = z.la, lb = z.lb;
      const tb = this.raySeg(o, d, ta[0], ta[1], ta[2], tb_[0], tb_[1], tb_[2], z.tr + pad);
      if (tb < bestT) { bestT = tb; best = { fighter: t, t: tb, part: 'body' }; }
      const tl = this.raySeg(o, d, la[0], la[1], la[2], lb[0], lb[1], lb[2], z.lr + pad);
      if (tl < bestT) { bestT = tl; best = { fighter: t, t: tl, part: 'legs' }; }
      if (z.arms) {
        const ra = z.ra, rb = z.rb, ma = z.ma, mb = z.mb;
        const tr = Math.min(this.raySeg(o, d, ra[0], ra[1], ra[2], rb[0], rb[1], rb[2], z.rr + pad), this.raySeg(o, d, ma[0], ma[1], ma[2], mb[0], mb[1], mb[2], z.mr + pad));
        // el brazo cuenta solo si es lo primero que toca la bala (de frente el torso lo tapa)
        if (tr < bestT && tr < tb - 0.01) { bestT = tr; best = { fighter: t, t: tr, part: 'arms' }; }
      }
    }
    if (best) best.point = new THREE.Vector3().copy(o).addScaledVector(d, best.t);
    return best;
  },

  // punto de entrada único para daño: offline aplica directo; online lo enruta el NET
  hit(info) {
    const t = info.target;
    if (!t || !t.alive) return;
    // registro del atacante: primer impacto, cuántos y con qué (medallas; funciona igual en línea)
    const a = info.attacker;
    if (a && a !== t) {
      const hl = a.hitLog || (a.hitLog = new Map());
      let e = hl.get(t);
      if (!e || G.time - e.t > 2.5) { e = { t0: G.time, n: 0, t: G.time, full: t.hp >= CONFIG.FIGHTER.hp - 0.5 }; hl.set(t, e); }
      e.n++; e.t = G.time;
      if (info.shot != null) e.shot = info.shot; if (info.pen) e.pen = true; if (info.cooked) e.cooked = true; if (info.boom != null) e.boom = info.boom; if (info.direct === t) e.direct = true;
    }
    if (NET.active) {
      if (NET.isAuthorityFor(t)) { this.apply(info); return; }
      if (info.attacker && NET.isAuthorityFor(info.attacker)) { NET.sendHitClaim(info); this.localFeedback(info); }
      return;
    }
    this.apply(info);
  },
  // heridas por zona: solo si la bala no mató. Se aplican en quien tiene la autoridad del objetivo
  wound(t, info, dmg) {
    const Wd = CONFIG.WOUND; let zone = null;
    if (info.kind === 'bullet') {
      if (info.part === 'legs' && dmg >= Wd.limpMinDmg) { t.limpT = Wd.limpTime; zone = 'legs'; }
      else if (info.part === 'arms' && dmg >= Wd.armMinDmg) { t.armT = Wd.armTime; zone = 'arms'; }
      else if (info.part === 'head' && dmg >= Wd.dazeMinDmg) { t.dazeT = Wd.dazeTime; zone = 'head'; }
    } else if (info.kind === 'explosion') {
      if (dmg >= 16) { t.dazeT = Math.max(t.dazeT, Wd.dazeTime * 0.9); zone = 'blast'; }
      if (dmg >= 40) { t.limpT = Math.max(t.limpT, Wd.limpTime * 0.8); }
    } else if (info.kind === 'fall' && dmg >= 8) { t.limpT = Math.max(t.limpT, 2.2); zone = 'legs'; }
    if (zone && t.hasPerk && t.hasPerk('medic')) { t.limpT *= 0.65; t.armT *= 0.65; t.dazeT *= 0.65; }
    if (zone) BUS.emit('wounded', t, zone, dmg);
  },
  localFeedback(info) {
    if (info.attacker && info.attacker.kind === 'local' && !(G.mode.teams && info.target.team === info.attacker.team)) BUS.emit('hitmarker', info, false);
    FX.hitFx(info);
  },
  apply(info) {
    const t = info.target, a = info.attacker;
    if (!t.alive) return;
    if (t.invulnT > 0 && info.kind !== 'fall') { if (a && a.kind === 'local' && info.kind === 'bullet' && !(G.mode.teams && a.team === t.team)) BUS.emit('hitblocked', info); return; }
    if (G.match && G.match.phase !== 'fight') return;
    if (G.mode && G.mode.teams && a && a !== t && a.team === t.team) return; // sin fuego amigo
    let dmg = info.damage;
    if (a === t && info.kind === 'explosion') dmg *= info.weapon === 'rocket' ? CONFIG.WEAPONS.rocket.selfDamageMul : 1;
    if (info.kind === 'explosion') { if (t.hasPerk && t.hasPerk('vest')) dmg *= 0.6; if (t.prone) dmg *= 0.8; }
    if (G.mode && G.mode.campaign && t === G.local && a !== t) dmg *= Camp.diff().taken;   // dificultad de campaña
    t.hp -= dmg; t.lastDamageT = G.time;
    if (a && a !== t) {
      t.lastAttacker = a; t.lastAttackerT = G.time; a.stats.damage += dmg;
      const prev = t.damagers.get(a); t.damagers.set(a, { d: (prev ? prev.d : 0) + dmg, t: G.time });
    }
    const imp = info.impulse ? this._imp.copy(info.impulse) : this._imp.set(0, 0, 0);
    const mag = imp.length();
    if (t.hp > 0) {
      if (info.kind === 'explosion' && (info.k || 0) > CONFIG.FIGHTER.knockdownK && t.state === 'stand' && !t.prone && !(t.hasPerk && t.hasPerk('vest'))) {
        t.startRagdoll(imp, info.point, CONFIG.RAGDOLL.knockTime);
      } else if (t.state === 'ragdoll' && t.ragdoll) {
        t.ragdoll.applyImpulse(imp.multiplyScalar(0.5), info.point);
      } else if (mag > 0) {
        // sin vuelos: solo un empujón y, si es fuerte, un tropiezo
        t.vel.x += imp.x * 0.22; t.vel.z += imp.z * 0.22;
        if (info.kind === 'explosion') t.vel.y += Math.min(3, imp.y * 0.2);
        t.knockT = 0.12;
        if (mag > CONFIG.FIGHTER.staggerImpulse) t.staggerT = CONFIG.FIGHTER.staggerTime;
      }
      t.flinchT = 0.22;
      if (mag > 0) t.flinchDir.copy(imp).normalize(); else if (a) t.flinchDir.copy(t.pos).sub(a.pos).normalize();
    }
    if (t.hp > 0) this.wound(t, info, dmg);
    BUS.emit('damaged', t, info, dmg, mag);
    if (NET.active && !info.fromNet && !info.noEcho) NET.sendApplied(info, dmg);
    if (t.hp <= 0) Rules.kill(t, info);
  },

  _boomN: 0,
  explode(e) {
    const { pos, radius, damage, push, owner } = e;
    e.id = ++this._boomN;
    FX.explosion(pos, radius, e.weapon);
    BUS.emit('explosion', e);
    const GR = CONFIG.GRENADE;
    for (const t of G.fighters) {
      if (!t.view || !t.alive) continue;
      const c = t.state === 'ragdoll' && t.ragdoll ? t.ragdoll.torsoPos(this._ec) : t.centerPos(this._ec);
      const d = this._ed.copy(c).sub(pos); const dist = d.length();
      if (dist > radius) continue;
      let cover = 1;
      if (!PHYS.lineOfSight(pos, c)) { const hd = t.headPos(_v6); cover = PHYS.lineOfSight(pos, hd) ? 0.5 : (dist < 1.6 ? 0.35 : 0); }
      if (cover <= 0) continue;
      const k = clamp(1 - dist / radius, 0, 1);
      let dmg = damage * Math.pow(k, 1.25) * cover;
      if (dist < GR.radiusKill * (radius / GR.radius) && cover >= 0.5) dmg = Math.max(dmg, 105);
      d.multiplyScalar(1 / (dist || 1)); d.y = Math.max(d.y, 0) + 0.45; d.normalize();
      const imp = d.multiplyScalar(push * (0.35 + 0.65 * k));
      if (e.authoritative === false) continue;
      if (NET.active && !NET.isAuthorityFor(t) && !(owner && NET.isAuthorityFor(owner))) continue;
      Combat.hit({ attacker: owner, target: t, damage: dmg, impulse: imp.clone(), point: pos.clone(), part: 'body', weapon: e.weapon, kind: 'explosion', k: k * cover, ragdoll: true, dist: owner ? owner.pos.distanceTo(t.pos) : 0, boom: e.id, cooked: !!e.cooked, direct: e.direct || null });
    }
    Corpses.radial(pos, radius * 1.2, push * 0.9);
    Props.radial(pos, radius + 1, push * 0.8);
    if (e.authoritative !== false) MapSys.explodeBlocks(pos, radius, damage, owner);
    const lp = G.camera ? G.camera.position : null;
    if (lp) CAM.addShake(clamp(1.3 - lp.distanceTo(pos) / 22, 0, 1));
  },
};

// ---------------- ARMAS EN EL SUELO y armas pesadas del mapa ----------------
const WorldItems = {
  drops: [], stands: [], prompt: null, _n: 0,
  buildStands(defs) {
    this.clearStands();
    defs.forEach((d, i) => {
      const g = new THREE.Group(); g.position.set(d.x, d.y, d.z);
      const crate = mesh(GEO.box(1.3, 0.5, 0.6), MAT.lam(0x4b5233), 0, 0.25, 0, g); crate.castShadow = true; crate.receiveShadow = true;
      mesh(GEO.box(1.32, 0.06, 0.62), MAT.lam(0x2d3322), 0, 0.5, 0, g);
      mesh(GEO.box(0.5, 0.08, 0.02), MAT.lam(0xc9b458), 0, 0.3, -0.31, g);
      const holder = new THREE.Group(); holder.position.set(0, 0.72, 0); g.add(holder);
      const model = buildWeaponModel(d.weapon); model.rotation.y = Math.PI / 2; holder.add(model);
      G.root.add(g);
      this.stands.push({ i, x: d.x, y: d.y, z: d.z, weapon: d.weapon, group: g, holder, active: true, t: 0 });
    });
  },
  resetStands() { for (const s of this.stands) { s.active = true; s.t = 0; s.holder.visible = true; } },
  drop(weapon, pos, vel, ammo, id, att) {
    if (G.mode && G.mode.ladder) return null;
    if (!weapon || weapon === 'knife' || !CONFIG.WEAPONS[weapon] || CONFIG.WEAPONS[weapon].slot === 'secondary') return null;
    att = att && att.optic ? att : defaultAtt(weapon);
    while (this.drops.length >= 12) this.removeDrop(0);
    const W = CONFIG.WEAPONS[weapon];
    const body = new CANNON.Body({ mass: 2, shape: new CANNON.Box(new CANNON.Vec3(0.12, 0.06, 0.42)), linearDamping: 0.1, angularDamping: 0.5,
      collisionFilterGroup: CG.PROP, collisionFilterMask: CG.STATIC | CG.PROP | RAG_ALL, allowSleep: true, sleepSpeedLimit: 0.3 });
    body.position.set(pos.x, pos.y, pos.z); body.velocity.set(vel.x, vel.y, vel.z);
    body.angularVelocity.set(frand(-3, 3), frand(-2, 2), frand(-3, 3));
    PHYS.world.addBody(body);
    const m = buildWeaponModel(weapon, false, att); m.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    const holder = new THREE.Group(); holder.add(m); m.position.z = 0.15;
    G.root.add(holder);
    const d = { id: id || ('x' + (++this._n)), weapon, att, body, mesh: holder, life: CONFIG.DROP_LIFE, mag: ammo ? ammo.mag : W.mag, reserve: ammo ? ammo.reserve : W.mag * 2 };
    this.drops.push(d);
    return d;
  },
  tick(dt) {
    for (let i = this.drops.length - 1; i >= 0; i--) { const d = this.drops[i]; d.life -= dt; if (d.life <= 0 || d.body.position.y < CONFIG.KILL_Y) this.removeDrop(i); }
    for (const s of this.stands) { if (!s.active) { s.t -= dt; if (s.t <= 0) { s.active = true; s.holder.visible = true; } } }
    // aviso para el jugador local
    const f = G.local;
    this.prompt = f && f.alive && f.state === 'stand' ? this.nearest(f) : null;
  },
  animate(dt) {
    for (const d of this.drops) { const p = d.body.position, q = d.body.quaternion; d.mesh.position.set(p.x, p.y, p.z); d.mesh.quaternion.set(q.x, q.y, q.z, q.w); if (d.life < 1) d.mesh.scale.setScalar(Math.max(0.01, d.life)); }
    for (const s of this.stands) if (s.active) { s.holder.rotation.y += dt * 0.8; s.holder.position.y = 0.72 + Math.sin(G.realTime * 2 + s.i) * 0.04; }
  },
  nearest(f) {
    if (G.mode && G.mode.ladder) return null;
    let best = null, bd = 1.9 * 1.9;
    const px = f.pos.x, py = f.pos.y, pz = f.pos.z;
    for (const d of this.drops) { const p = d.body.position; const dd = (p.x - px) ** 2 + (p.z - pz) ** 2; if (dd < bd && Math.abs(p.y - py) < 1.6) { bd = dd; best = { kind: 'drop', item: d, weapon: d.weapon }; } }
    for (const s of this.stands) { if (!s.active) continue; const dd = (s.x - px) ** 2 + (s.z - pz) ** 2; if (dd < bd * 1.3 && Math.abs(s.y - py) < 1.6) { bd = dd; best = { kind: 'stand', item: s, weapon: s.weapon }; } }
    return best;
  },
  tryPickup(f) {
    const n = this.nearest(f); if (!n) return false;
    const nAtt = n.kind === 'drop' ? n.item.att : defaultAtt(n.weapon);
    const W = n.weapon === f.primary ? f.wstat(f.primary) : weaponStats(n.weapon, nAtt, f.loadout.perk);
    let mag = W.mag, reserve = W.reserve;
    if (n.kind === 'drop') { mag = n.item.mag; reserve = n.item.reserve; }
    if (n.weapon === f.primary && f.inv[f.primary]) {
      const inv = f.inv[f.primary]; inv.reserve = Math.min(W.reserve * 1.5, inv.reserve + mag + reserve);
    } else {
      // soltar el arma principal actual y tomar la nueva
      if (f.primary && f.inv[f.primary]) {
        const old = f.inv[f.primary], id = 's' + f.slot + '_' + (++this._n), oldAtt = f.attFor(f.primary);
        const pos = new THREE.Vector3(f.pos.x, f.pos.y + 1.1, f.pos.z), vel = dirFromYawPitch(f.input.yaw, 0.3, new THREE.Vector3()).multiplyScalar(2.5);
        this.drop(f.primary, pos, vel, { mag: old.mag, reserve: old.reserve }, id, oldAtt);
        if (NET.active) NET.queue('wd', [id, f.primary, r2(pos.x), r2(pos.y), r2(pos.z), old.mag, Number.isFinite(old.reserve) ? old.reserve : 0, attKey(oldAtt)]);
        delete f.inv[f.primary];
      }
      f.primary = n.weapon; f.inv[n.weapon] = { mag, reserve }; f.ws[n.weapon] = W;
      if (f.view) f.view.dropModel(n.weapon);
      f.weapon = null; f.setWeapon(n.weapon);
    }
    if (n.kind === 'drop') { const idx = this.drops.indexOf(n.item); if (NET.active) NET.queue('wp', [n.item.id]); this.removeDrop(idx); }
    else { n.item.active = false; n.item.t = CONFIG.POWER_RESPAWN; n.item.holder.visible = false; if (NET.active) NET.queue('sp', [n.item.i]); }
    BUS.emit('pickup', f, n.weapon);
    return true;
  },
  remoteTake(id) { const i = this.drops.findIndex((d) => d.id === id); if (i >= 0) this.removeDrop(i); },
  remoteStand(i) { const s = this.stands[i]; if (s && s.active) { s.active = false; s.t = CONFIG.POWER_RESPAWN; s.holder.visible = false; } },
  removeDrop(i) { const d = this.drops[i]; if (!d) return; PHYS.world.removeBody(d.body); G.root.remove(d.mesh); this.drops.splice(i, 1); },
  clearDrops() { for (let i = this.drops.length - 1; i >= 0; i--) this.removeDrop(i); },
  clearStands() { for (const s of this.stands) { G.root.remove(s.group); } this.stands = []; },
  clear() { this.clearDrops(); this.clearStands(); },
};

