// ---- 12c_zombies.js ----
// =====================================================================
// MODO CÁRCEL (historia) — bloque 1: la enfermería. El jugador despierta
// herido y con casi nada; los infectados oyen, ven poco y no se rinden.
//   · ZombieBrain: percepción (vista corta en la oscuridad, oído por ruido),
//     persecución, investigación del último ruido y golpe cuerpo a cuerpo.
//   · Zombies: guion de la partida (introducción, avisos, entrada del
//     primer infectado, refuerzos), linterna, botiquines y munición.
// =====================================================================
MODES.carcel = { id: 'carcel', name: { es: 'Cárcel (historia)', en: 'Prison (story)' }, desc: { es: 'Despiertas herido en la enfermería de una cárcel sin energía. Sobrevive y escapa.', en: 'You wake wounded in a powerless prison infirmary. Survive and escape.' }, teams: true, respawn: false, story: true, time: Infinity };

// ropa de los infectados: reclusos (la mayoría), pacientes y guardias; el jugador viste de paciente o de recluso
const ZOMBIE_LOOKS = ['reo', 'reo', 'paciente', 'guardia', 'reo', 'paciente'];
const civLook = (outfit, zombie, skin) => ({ camo: zombie ? outfit + '_z' : outfit, outfit, zombie: !!zombie, helmet: 'none', face: 'none', vest: 'none', skin, pack: 'none', pads: 'none', op: null });
// ataques: zarpazo (golpe con la mano), agarre con mordiscos y, si repta, agarrar el tobillo
const ZATK = {
  swipe: { dur: 1.0, hit: 0.46, range: 1.75, dmg: [15, 21] },
  grab: { dur: 0.7, hit: 0.38, range: 1.45 },
  ankle: { dur: 0.9, hit: 0.45, range: 1.35, dmg: [6, 9] },
  bite: { every: 1.1, dmg: 9 }, escape: 6,
};

class ZombieBrain extends BotBrain {
  constructor(f) { super(f, 'normal'); }
  reset() {
    super.reset();
    this.st = 'idle'; this.alertT = 0; this.lastSeen = null; this.lastSeenT = -99; this.atkCd = 0.5; this.wanderT = frand(2, 5); this.noiseSeen = -99; this.groanT = frand(4, 9);
    this.stk = 0; this.sinceHit = 0; this.vis = false;
  }
  // ¿lo veo? la visión depende de la luz: linterna encendida o cerca → te ven de lejos
  sense() {
    const f = this.f, me = G.local;
    this.vis = false;
    if (!me || !me.alive) return;
    const dx = me.pos.x - f.pos.x, dz = me.pos.z - f.pos.z, d = Math.hypot(dx, dz);
    const lit = Zombies.flashOn && Zombies.flashLevel > 0.1;
    const range = (lit ? 17 : 5.5) * (me.crouching ? 0.7 : me.sprinting ? 1.25 : 1) + (f.hp < 100 ? 1 : 0);
    if (d < range && Math.abs(me.pos.y - f.pos.y) < 2.2) {
      const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw);
      if ((dx * fx + dz * fz) / (d || 1) > (d < 2.2 ? -1 : 0.25)) {
        const a = eyePosOf(f, _v1), b = me.centerPos(_v2);
        if (PHYS.lineOfSight(a, b)) this.vis = true;
      }
    }
    if (this.vis) { this.lastSeen = me.pos.clone(); this.lastSeenT = G.time; }
    // oído: disparos y pasos recientes del jugador
    for (const n of BotNoise.list) {
      if (n.f !== me || n.t <= this.noiseSeen || G.time - n.t > 1.6) continue;
      const nd = Math.hypot(n.pos.x - f.pos.x, n.pos.z - f.pos.z);
      if (nd < n.r * 30) { this.noiseSeen = n.t; this.lastSeen = n.pos.clone(); this.lastSeenT = G.time; this.heard = true; if (this.st !== 'chase') this.alertT = 1; }
    }
    const was = this.st;
    if (this.vis) this.st = 'chase';
    else if (this.st === 'chase' && G.time - this.lastSeenT > 6) this.st = 'investigate';
    else if (this.st !== 'chase' && this.lastSeen && G.time - this.lastSeenT < 1.2) this.st = 'investigate';
    if (this.st !== was && this.st === 'chase') { Zombies.snd('groan', f.pos, 1); this.groanT = frand(5, 9); this.setGoal(me.pos, 'chase'); }
  }
  update(dt) {
    const f = this.f, inp = f.input, me = G.local;
    this.thinkT -= dt; this.repathT -= dt; this.atkCd -= dt; this.wanderT -= dt; this.groanT -= dt; this.alertT -= dt; this.jumpT -= dt; this.sinceHit += dt;
    inp.fire = false; inp.aim = false; inp.crouch = false; inp.sprint = false; inp.jump = false; inp.grenade = false; inp.lean = 0; inp.prone = false;
    if (!f.alive || f.state === 'ragdoll' || f.state === 'getup' || G.freeze) { inp.mx = inp.mz = 0; this.writeAim(); return; }
    if (f.crawler) inp.prone = true;
    if (f.zStag > 0) f.zStag -= dt;
    // ataque en curso: se queda plantado (el agarre da un paso hacia delante) y el golpe llega a mitad del gesto
    const A = f.zAtk;
    if (A) {
      A.t += dt;
      if (!A.done && A.t >= A.hit) { A.done = true; Zombies.strike(f, A); }
      if (A.kind === 'grab' && A.t < A.hit && me) { const dx = me.pos.x - f.pos.x, dz = me.pos.z - f.pos.z, d = Math.hypot(dx, dz) || 1; this.setMove(dx / d, dz / d, 1); }
      else { inp.mx = inp.mz = 0; }
      if (A.t >= A.dur) f.zAtk = null;
      this.writeAim(); return;
    }
    // agarrando al jugador: lo arrastra hacia atrás mientras muerde
    if (f.zGrab) {
      if (me && me.alive) { const dx = me.pos.x - f.pos.x, dz = me.pos.z - f.pos.z, d = Math.hypot(dx, dz) || 1; this.aimYaw = dampAngle(this.aimYaw, Math.atan2(-dx, -dz), 10, dt); this.setMove(-dx / d, -dz / d, 0.5); }
      else { inp.mx = inp.mz = 0; }
      this.writeAim(); return;
    }
    if (f.staggerT > 0 || f.flinchT > 0.15 || f.zStag > 0) { inp.mx = inp.mz = 0; this.writeAim(); return; }
    if (this.thinkT <= 0) { this.sense(); this.thinkT = 0.16 + FX_RNG.next() * 0.08; }
    if (this.groanT <= 0) { Zombies.snd('groan', f.pos, this.st === 'chase' ? 1 : 0.6); this.groanT = frand(6, 14); }
    let mx = 0, mz = 0, k = 0;
    if (this.st === 'chase' && me && me.alive) {
      const dx = me.pos.x - f.pos.x, dz = me.pos.z - f.pos.z, d = Math.hypot(dx, dz);
      const want = Math.atan2(-dx, -dz);
      this.aimYaw = dampAngle(this.aimYaw, want, 7, dt); this.aimPitch = damp(this.aimPitch, 0, 4, dt);
      const aligned = Math.abs(wrapAngle(want - this.aimYaw)) < 0.5;
      if (d < (f.crawler ? 1.25 : 1.5) && aligned && Math.abs(me.pos.y - f.pos.y) < 1.5) {
        if (this.atkCd <= 0) { Zombies.attack(f, me); this.atkCd = 1.3 + FX_RNG.next() * 0.6; }
        k = 0;
      } else if (this.vis && d < 6 && G.time > (this.navUntil || 0) && PHYS.lineOfSight(eyePosOf(f, _v1), me.centerPos(_v2))
        && PHYS.lineOfSight(_v1.set(f.pos.x, f.pos.y + 0.45, f.pos.z), _v2.set(me.pos.x, me.pos.y + 0.45, me.pos.z))) {
        // directo solo con paso libre a la altura de la cadera (no a través de ventanas con barrotes); si no avanza, vuelve a la malla
        mx = dx / d; mz = dz / d; k = 1;
        if (this.lastD != null && d > this.lastD - 0.4 * dt * 0.5) this.stuckT = (this.stuckT || 0) + dt; else this.stuckT = 0;
        if (this.stuckT > 1.5) { this.navUntil = G.time + 3; this.stuckT = 0; this.repathT = 0; }
        this.lastD = d;
      }
      else { if (this.repathT <= 0) { this.setGoal(me.pos, 'chase'); this.repathT = 0.8; } const r = this.follow(dt); mx = r[0]; mz = r[1]; k = r[2]; }
    } else if (this.st === 'investigate' && this.lastSeen) {
      if (!this.goal || this.repathT <= 0) { this.setGoal(this.lastSeen, 'noise'); this.repathT = 1.2; }
      const r = this.follow(dt); mx = r[0]; mz = r[1]; k = r[2] * 0.85;
      if (k > 0) this.lookDir(mx, mz, dt); else this.idleLook(dt);
      if (!this.goal && Math.hypot(this.lastSeen.x - f.pos.x, this.lastSeen.z - f.pos.z) < 2.5) { this.st = 'idle'; this.lastSeen = null; this.wanderT = frand(1, 3); }
      else if (!this.goal) { this.st = 'idle'; this.lastSeen = null; }
    } else {
      // deambula despacio entre puntos del mapa
      if (this.goal && this.goalKind === 'wander') { const r = this.follow(dt); mx = r[0]; mz = r[1]; k = r[2] * 0.55; if (k > 0) this.lookDir(mx, mz, dt); else this.idleLook(dt); }
      else {
        this.idleLook(dt);
        if (this.wanderT <= 0 && MapSys.nav) {
          const ns = MapSys.nav.nodes.filter((n) => Math.hypot(n.x - f.pos.x, n.z - f.pos.z) < 9 && Math.hypot(n.x - f.pos.x, n.z - f.pos.z) > 3);
          if (ns.length) { const n = ns[(Math.random() * ns.length) | 0]; this.setGoal(n, 'wander'); }
          this.wanderT = frand(5, 11);
        }
      }
    }
    // atascado: rehace la ruta
    this.progressT += dt;
    if (this.progressT > 1.1) {
      const moved = Math.hypot(f.pos.x - this.lastPos.x, f.pos.z - this.lastPos.z);
      if (k > 0 && moved < 0.25) { this.stk++; this.path = null; this.repathT = 0; if (this.stk > 2) { this.escapeDir = Math.atan2(-mz, -mx) + (FX_RNG.next() < 0.5 ? -1 : 1) * 1.1; this.escapeT = 0.6; this.stk = 0; } }
      else this.stk = 0;
      this.lastPos.copy(f.pos); this.progressT = 0;
    }
    this.escapeT -= dt;
    if (this.escapeT > 0) { mx = Math.cos(this.escapeDir); mz = Math.sin(this.escapeDir); k = 1; }
    if (k > 0 && this.st !== 'chase') this.lookDir(mx, mz, dt);
    else if (k > 0 && this.vis === false) this.lookDir(mx, mz, dt);
    this.setMove(mx, mz, k);
    this.writeAim();
  }
}

const Zombies = {
  S: null, flash: null, flashOn: true, flashLevel: 1, _fx: 0, _keyBound: false,
  ENTRY: 38, GAP: 55, MAX_ALIVE: 3,

  roster(cfg) {
    const s = G.settings, outfit = STORY_OUTFITS.includes(s.storyOutfit) ? s.storyOutfit : 'paciente';
    const list = [{ slot: 0, kind: 'local', name: s.name || 'Soldado', custom: civLook(outfit, false, s.custom.skin | 0), team: 0, loadout: localLoadout(), level: Progress.level() }];
    for (let i = 1; i <= 6; i++) list.push({ slot: i, kind: 'bot', zombie: true, name: L({ es: 'Infectado', en: 'Infected' }), team: 1, difficulty: 'normal', loadout: classLoadout('rifleman'), level: 1, custom: civLook(ZOMBIE_LOOKS[i - 1], true, i % ZSKINS.length) });
    return list;
  },
  // se llama al cargar cada ronda de la partida
  reset() {
    this.S = { entered: 0, nextT: this.ENTRY, intro: false, obj: false, cue: -1, deadAt: null, stepT: 0, hint: false };
    this.grab = null; this.hookBus();
    this.flashOn = true; this.flashLevel = 1;
    this.buildFlash(); Inv.reset();
    this.fadeIn();
  },
  clear() {
    this.release(false);
    if (this.flash) { G.scene.remove(this.flash); G.scene.remove(this.flash.target); this.flash = null; }
    Inv.clear(); this.S = null;
  },
  // el jugador despierta herido y casi sin equipo; los infectados son golpeadores lentos
  onSpawn(f) {
    if (f.zombie) {
      f.equipLadder('knife'); f.invulnT = 0; f.hp = 90; f.speedMul = 0.3 + Math.random() * 0.06;
      f.zAtk = null; f.zGrab = false; f.zStag = 0; f.zLegDmg = 0; f.crawler = false; f.zBiteK = 0; f.zGait = f.slot % 3;
      return;
    }
    if (f !== G.local) return;
    f.equipLadder('pistol');
    const ws = f.ws.pistol; f.inv.pistol.mag = ws.mag; f.inv.pistol.reserve = ws.mag;
    f.grenades = 0; f.smokes = 0; f.hp = 62; f.limpT = 16; f.dazeT = 3.2; f.invulnT = 0; f.zGrabCd = 0;
  },
  // un infectado se levanta en el fondo del pasillo y se dirige a la enfermería
  spawnOne(opts = {}) {
    const pool = G.fighters.filter((f) => f.zombie && !f.alive);
    if (!pool.length) return null;
    // prefiere el que lleva más tiempo muerto
    pool.sort((a, b) => (a.deathTime || 0) - (b.deathTime || 0));
    const f = pool[0], sp = MapSys.spawns[1][(Math.random() * MapSys.spawns[1].length) | 0] || { x: 26, y: 0.06, z: 0, yaw: Math.PI / 2 };
    f.spawn(sp.x, sp.y, sp.z, sp.yaw); this.onSpawn(f);
    if (opts.speed) f.speedMul = opts.speed;
    if (f.brain) { f.brain.reset(); f.brain.aimYaw = sp.yaw; const tgt = opts.goal || { x: 5, y: 0.06, z: 0 }; f.brain.lastSeen = new THREE.Vector3(tgt.x, tgt.y, tgt.z); f.brain.lastSeenT = G.time; f.brain.st = 'investigate'; }
    return f;
  },
  alive() { return G.fighters.filter((f) => f.zombie && f.alive).length; },

  tick(dt) {
    const m = G.match, S = this.S; if (!m || !S || m.phase !== 'fight') return;
    const t = m.time, me = G.local;
    // pasos del jugador: se oyen cerca (agacharse los apaga)
    if (me && me.alive) {
      S.stepT -= dt;
      const sp = Math.hypot(me.vel.x, me.vel.z);
      if (S.stepT <= 0 && me.grounded && sp > 2.4 && !me.crouching && !me.prone) { BotNoise.add(me, me.pos, me.sprinting ? 0.5 : 0.24); S.stepT = me.sprinting ? 0.32 : 0.48; }
    }
    if (!S.obj && t > 5) { S.obj = true; UI.toast(L({ es: 'OBJETIVO: sal de la cárcel · L = linterna', en: 'OBJECTIVE: escape the prison · L = flashlight' }), 5200); }
    // aviso 5 s antes: golpes lejanos en el pasillo
    if (S.cue < S.entered && t > S.nextT - 5) { S.cue = S.entered; this.snd('bang', _v1.set(24, 1.2, 0), 1); setTimeout(() => this.snd('groan', _v1.set(22, 1, 0), 1), 1800); }
    if (t >= S.nextT) {
      if (this.alive() < this.MAX_ALIVE) { if (this.spawnOne({ goal: S.entered === 0 ? { x: 5, y: 0.06, z: 0 } : { x: me ? me.pos.x : 0, y: 0.06, z: me ? me.pos.z : 0 } })) S.entered++; }
      S.nextT = t + this.GAP * (S.entered >= 4 ? 0.7 : 1);
    }
    Inv.tick(dt);
    this.grabTick(dt);
    // derrota al caer el jugador
    if (me && !me.alive && S.deadAt == null) S.deadAt = G.time;
  },

  // ---------------- ataques del infectado ----------------
  attack(z, me) {
    let kind = 'swipe';
    if (z.crawler) kind = 'ankle';
    else if (!this.grab && (me.zGrabCd || 0) <= 0 && !me.prone && Math.random() < (Inv.armor() < 1 ? 0.25 : 0.38)) kind = 'grab';
    const D = ZATK[kind];
    z.zAtk = { kind, t: 0, dur: D.dur, hit: D.hit, done: false, side: Math.random() < 0.5 ? -1 : 1 };
    if (kind === 'grab') { const d = _v1.set(me.pos.x - z.pos.x, 0, me.pos.z - z.pos.z).normalize(); z.vel.x += d.x * 1.8; z.vel.z += d.z * 1.8; this.snd('grab', z.pos, 0.9); }
    else this.snd('groan', z.pos, 0.7);
  },
  // el golpe llega: ¿sigue al alcance y delante?
  strike(z, A) {
    const me = G.local; if (!me || !me.alive || !z.alive) return;
    const D = ZATK[A.kind], dx = me.pos.x - z.pos.x, dz = me.pos.z - z.pos.z, d = Math.hypot(dx, dz);
    const fx = -Math.sin(z.yaw), fz = -Math.cos(z.yaw), front = (dx * fx + dz * fz) / (d || 1);
    this.snd('swipe', z.pos, 1);
    if (d > D.range || front < 0.35 || Math.abs(me.pos.y - z.pos.y) > 1.3 || !PHYS.lineOfSight(eyePosOf(z, _v1), me.centerPos(_v2))) return;
    if (A.kind === 'grab') { if (!this.grab && me.state === 'stand') this.startGrab(z, me); return; }
    const dmg = frand(D.dmg[0], D.dmg[1]), imp = new THREE.Vector3(dx / (d || 1), 0.2, dz / (d || 1)).multiplyScalar(A.kind === 'swipe' ? 2.6 : 0.5);
    Combat.hit({ attacker: z, target: me, damage: dmg * Inv.armor(), impulse: imp, point: me.centerPos(new THREE.Vector3()), part: A.kind === 'ankle' ? 'legs' : 'body', weapon: 'zclaw', kind: 'melee', dist: d, shotTime: G.time });
    if (A.kind === 'ankle') { me.limpT = Math.max(me.limpT, 4); me.vel.multiplyScalar(0.2); }
    CAM.addShake(A.kind === 'swipe' ? 0.45 : 0.2);
    this.scratch(A.kind === 'swipe' ? (A.side || 1) : 0);
  },
  startGrab(z, me) {
    this.grab = { z, t: 0, biteT: 0.55, n: 0, seen: me.input.meleeCount, seenI: me.input.interactCount, decayT: 0 };
    z.zGrab = true; z.zBiteK = 0; me.zGrabbed = true;
    me.sprinting = false; me.adsT = 0; me.reloadT = 0; Inv.close(false);
    CAM.addShake(0.6); this.snd('grab', z.pos, 1.2);
    this.grabUI(true);
  },
  release(escaped) {
    const g = this.grab; this.grab = null;
    if (!g) { this.grabUI(false); return; }
    const z = g.z, me = G.local;
    z.zGrab = false; z.zBiteK = 0;
    if (me) { me.zGrabbed = false; me.zGrabCd = escaped ? 3.5 : 1.5; }
    if (escaped && z.alive && me) {
      // empujón: el infectado retrocede tambaleándose y queda un momento aturdido
      const d = _v1.set(z.pos.x - me.pos.x, 0, z.pos.z - me.pos.z).normalize();
      z.vel.x += d.x * 3.2; z.vel.z += d.z * 3.2; z.zStag = 1.3; if (z.brain) z.brain.atkCd = 1.8;
      UI.toast(L({ es: 'TE ZAFASTE', en: 'YOU BROKE FREE' }), 1400);
    }
    this.grabUI(false);
  },
  grabTick(dt) {
    const me = G.local;
    if (me) me.zGrabCd = Math.max(0, (me.zGrabCd || 0) - dt);
    const g = this.grab; if (!g) return;
    const z = g.z;
    if (!me || !me.alive || !z.alive || z.state !== 'stand' || z.pos.distanceTo(me.pos) > 2.6) { this.release(false); return; }
    g.t += dt;
    // forcejeo: cada pulsación de F (o E) suma; si se deja de pulsar, se pierde fuerza
    const inp = me.input;
    if (inp.meleeCount !== g.seen) { g.n += inp.meleeCount - g.seen; g.seen = inp.meleeCount; g.decayT = 0; CAM.addShake(0.08); }
    if (inp.interactCount !== g.seenI) { g.n += inp.interactCount - g.seenI; g.seenI = inp.interactCount; g.decayT = 0; }
    g.decayT += dt; if (g.decayT > 0.7 && g.n > 0) { g.n -= 1; g.decayT = 0.35; }
    me.seenMelee = inp.meleeCount; me.meleeCd = Math.max(me.meleeCd, 0.2); me.controlLock = Math.max(me.controlLock, 0.12); me.fireBlockT = Math.max(me.fireBlockT || 0, 0.12); me.sprinting = false;
    // la cámara se gira hacia el infectado y te arrastra con él
    const dx = z.pos.x - me.pos.x, dz = z.pos.z - me.pos.z, d = Math.hypot(dx, dz) || 1;
    if (me === G.local) { Input.state.yaw = dampAngle(Input.state.yaw, Math.atan2(-dx, -dz), 6, dt); Input.state.pitch = damp(Input.state.pitch, 0.05, 4, dt); }
    const want = 0.72, pull = clamp((d - want) * 5, -2, 2.2);
    me.vel.x = dx / d * pull + z.vel.x * 0.9; me.vel.z = dz / d * pull + z.vel.z * 0.9;
    z.zBiteK = damp(z.zBiteK, 1, 3, dt);
    g.biteT -= dt;
    if (g.biteT <= 0) {
      g.biteT = ZATK.bite.every;
      this.snd('bite', z.pos, 1); CAM.addShake(0.35); this.scratch(0);
      Combat.hit({ attacker: z, target: me, damage: ZATK.bite.dmg * (Inv.armor() < 1 ? 0.5 : 1), impulse: null, point: me.headPos(new THREE.Vector3()), part: 'body', weapon: 'zbite', kind: 'melee', dist: d, shotTime: G.time });
    }
    const need = ZATK.escape - (Inv.armor() < 1 ? 2 : 0);
    if (g.n >= need) { this.release(true); return; }
    this.grabUI(true, g.n / need);
  },
  // tambaleo al recibir disparos; si le destrozan las piernas, cae y se arrastra
  hookBus() {
    if (this._bus) return; this._bus = true;
    BUS.on('damaged', (t, info, dmg) => {
      if (!t.zombie || !t.alive || !G.mode || !G.mode.story) return;
      if (info.kind === 'bullet' || info.kind === 'melee') {
        t.zStag = Math.max(t.zStag || 0, info.part === 'head' ? 0.75 : 0.22 + Math.min(0.5, dmg / 90));
        if (t.zAtk && !t.zAtk.done && dmg >= 18) t.zAtk = null;
        if (t.zGrab && dmg >= 30) this.release(true);
      }
      if (info.part === 'legs') {
        t.zLegDmg = (t.zLegDmg || 0) + dmg;
        if (!t.crawler && t.zLegDmg >= 38) { t.crawler = true; t.zStag = 0.9; t.speedMul = 0.8; t.zAtk = null; this.snd('groan', t.pos, 1); }
      }
    });
  },
  // marcas de zarpazo en la pantalla (side: -1 izquierda, 1 derecha, 0 mordisco)
  scratch(side) {
    let el = document.getElementById('zScratch');
    if (!el) {
      el = document.createElement('div'); el.id = 'zScratch';
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9;opacity:0';
      el.innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:100%"><g fill="rgba(150,10,8,.75)"><path d="M18 8 Q34 40 58 88 L60 86 Q38 40 21 7Z"/><path d="M28 6 Q44 40 68 86 L70 84 Q48 40 31 5Z"/><path d="M38 7 Q54 38 76 80 L77 78 Q57 38 41 6Z"/></g></svg>';
      document.body.appendChild(el);
    }
    const bite = side === 0;
    el.style.background = bite ? 'radial-gradient(ellipse at center, rgba(0,0,0,0) 35%, rgba(120,0,0,.55) 100%)' : 'none';
    el.firstChild.style.transform = bite ? 'scale(0)' : `scaleX(${side})`;
    el.animate([{ opacity: 1 }, { opacity: 0.85, offset: 0.3 }, { opacity: 0 }], { duration: bite ? 650 : 900, easing: 'ease-out' });
  },
  grabUI(on, k = 0) {
    let el = document.getElementById('zGrab');
    if (!on) { if (el) el.style.display = 'none'; return; }
    if (!el) {
      el = document.createElement('div'); el.id = 'zGrab';
      el.style.cssText = 'position:fixed;left:50%;top:62%;transform:translateX(-50%);z-index:12;pointer-events:none;text-align:center;font:700 22px/1.2 "Barlow Condensed",sans-serif;letter-spacing:.14em;color:#f2e6dc;text-shadow:0 2px 6px #000';
      el.innerHTML = `<div class="zgt"></div><div style="margin:8px auto 0;width:240px;height:8px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.35)"><i style="display:block;height:100%;width:0;background:#e0d4c4"></i></div>`;
      document.body.appendChild(el);
    }
    el.style.display = '';
    const t = L({ es: '¡TE AGARRÓ!', en: 'GRABBED!' }) + `<br><small style="font-size:15px;letter-spacing:.2em;opacity:.85">${L({ es: 'pulsa', en: 'mash' })} <kbd>${Input.keyName(Input.bindings.melee[0])}</kbd> ${L({ es: 'repetidamente para zafarte', en: 'to break free' })}</small>`;
    const h = el.firstChild; if (h._t !== t) { h._t = t; h.innerHTML = t; }
    el.lastChild.firstChild.style.width = Math.round(clamp(k, 0, 1) * 100) + '%';
  },

  // ---------------- linterna ----------------
  buildFlash() {
    if (this.flash) { G.scene.remove(this.flash); G.scene.remove(this.flash.target); }
    const L_ = new THREE.SpotLight(0xfff0d0, 40, 28, 0.56, 1, 0.9);   // caída suave: de cerca no quema la imagen y de lejos alcanza igual
    L_.castShadow = false; G.scene.add(L_); G.scene.add(L_.target); this.flash = L_;
    if (!this._keyBound) { this._keyBound = true; window.addEventListener('keydown', (e) => { if (e.code === 'KeyL' && !e.repeat && G.mode && G.mode.story && G.local && G.local.alive && !G.paused) { if (Inv.battery <= 0 && !this.flashOn) { UI.toast(L({ es: 'SIN PILAS', en: 'NO BATTERY' }), 1400); AUDIO.play && AUDIO.play('dry', null, 0.5); return; } this.flashOn = !this.flashOn; AUDIO.play && AUDIO.play('swing', null, 0.3); } }); }
  },
  frame(dt) {
    const sb = UI.el['streak-box']; if (sb && sb.style.display !== 'none') sb.style.display = 'none';
    const L_ = this.flash; if (!L_ || !G.camera) return;
    const me = G.local, on = this.flashOn && me && me.alive;
    this.flashLevel = damp(this.flashLevel, on ? 1 : 0, 18, dt);
    // parpadeo ocasional de la linterna cuando hay infectados cerca
    let fl = 1;
    if (on && this.alive() > 0) { this._fx -= dt; const near = G.fighters.some((z) => z.zombie && z.alive && z.pos.distanceTo(me.pos) < 5); if (near) fl = 0.75 + 0.25 * Math.sin(G.realTime * 37) * Math.sin(G.realTime * 11); }
    const c = G.camera.position; G.camera.getWorldDirection(_v1);
    // pegado a una pared el haz no quema la imagen: se atenúa según la distancia a lo que alumbra
    if ((this._rcT = (this._rcT || 0) - dt) <= 0) { this._rcT = 0.08; const h = PHYS.raycast(c, _v1, 3, {}); this._near = h ? clamp(0.3 + h.t / 3, 0.3, 1) : 1; }
    this._nearK = damp(this._nearK || 1, this._near || 1, 10, dt);
    // pilas gastadas: menos luz y tirones
    const bat = Inv.battery; if (bat < 0.15) fl *= 0.45 + 0.55 * (bat / 0.15) * (Math.sin(G.realTime * 23) > -0.6 ? 1 : 0.2);
    L_.intensity = 40 * this.flashLevel * fl * this._nearK; L_.visible = this.flashLevel > 0.01;
    L_.position.set(c.x + _v1.x * 0.1, c.y - 0.1, c.z + _v1.z * 0.1); L_.target.position.set(c.x + _v1.x * 8, c.y + _v1.y * 8, c.z + _v1.z * 8);
    // luces de techo: parpadeo de emergencia en tono verdoso/ámbar
    if (Env.lampLights && Env.lampLights.length) {
      const t = G.realTime;
      Env.lampLights.forEach((ll, i) => { ll.color.set(i ? 0xff9a60 : 0xb8e0c0); ll.intensity = (i ? 10 : 18) * (Math.sin(t * 2.1 + i) > -0.85 ? 1 : 0.15) * (0.85 + 0.15 * Math.sin(t * 29 + i * 3)); });
    }
    if (Env.lampGlow) { Env.lampGlow.material.size = 1.5; Env.lampGlow.material.opacity = 0.45 + 0.2 * Math.sin(G.realTime * 3); }
  },

  // ---------------- ambiente ----------------
  fadeIn() {
    let el = document.getElementById('storyFade');
    if (!el) { el = document.createElement('div'); el.id = 'storyFade'; el.style.cssText = 'position:fixed;inset:0;background:#000;z-index:60;pointer-events:none;opacity:1;transition:opacity 4.5s ease-in 1.6s;display:flex;align-items:center;justify-content:center;color:#cfd3c6;font:600 15px/1.6 "Barlow Condensed",sans-serif;letter-spacing:.28em;text-transform:uppercase;text-align:center'; document.body.appendChild(el); }
    el.style.transition = 'none'; el.style.opacity = '1';
    el.innerHTML = L({ es: 'Penitenciaría Kestrel · Enfermería<br><span style="opacity:.6;letter-spacing:.18em;font-weight:400">Tercer día. Despiertas con el cuerpo roto.</span>', en: 'Kestrel Penitentiary · Infirmary<br><span style="opacity:.6;letter-spacing:.18em;font-weight:400">Day three. You wake with a broken body.</span>' });
    void el.offsetWidth;
    el.style.transition = 'opacity 4.5s ease-in 1.8s'; el.style.opacity = '0';
  },
  snd(kind, pos, vol = 1) {
    if (!AUDIO.ok || AUDIO.ctx.state !== 'running') return;
    const o = AUDIO.out(pos, vol, 0.6); if (!o) return;
    const t = AUDIO.ctx.currentTime + 0.004;
    if (kind === 'bang') { AUDIO.nz(o, t, 0.5, 0.9, 'lowpass', 520, 70, 0.8, 0.003); AUDIO.osc(o, 'sine', 90, 38, t, 0.4, 0.9); AUDIO.nz(o, t + 0.28, 0.35, 0.5, 'lowpass', 420, 60, 0.8, 0.003); AUDIO.osc(o, 'sine', 80, 35, t + 0.28, 0.3, 0.6); }
    else if (kind === 'swipe') { AUDIO.nz(o, t, 0.22, 0.5, 'bandpass', 900, 2600, 1.2, 0.02); }
    else if (kind === 'bite') { for (let i = 0; i < 3; i++) AUDIO.nz(o, t + i * 0.05, 0.07, 0.7, 'bandpass', 1500 - i * 300, 600, 2, 0.002); AUDIO.osc(o, 'sawtooth', 140, 70, t, 0.35, 0.12, 0.02); }
    else if (kind === 'grab') { const f0 = 180 + Math.random() * 60; AUDIO.osc(o, 'sawtooth', f0, f0 * 1.8, t, 0.5, 0.18, 0.05); AUDIO.osc(o, 'square', f0 * 1.5, f0 * 2.2, t + 0.05, 0.4, 0.06, 0.05); AUDIO.nz(o, t, 0.5, 0.3, 'bandpass', 1200, 800, 1.5, 0.05); }
    else if (kind === 'groan') { const f0 = 85 + Math.random() * 40; AUDIO.osc(o, 'sawtooth', f0, f0 * 0.55, t, 1.5, 0.16, 0.25); AUDIO.osc(o, 'sawtooth', f0 * 1.51, f0 * 0.8, t + 0.05, 1.3, 0.07, 0.3); AUDIO.nz(o, t, 1.4, 0.22, 'bandpass', 700, 350, 1.4, 0.3); }
  },
};
