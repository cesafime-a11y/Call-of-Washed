// ---- 08a_fighter.js ----
// =====================================================================
// SOLDADO — estado de simulación (separado de la vista)
// =====================================================================
let _fighterId = 0;
const WEAPON_IDS = Object.keys(CONFIG.WEAPONS);
class Fighter {
  constructor(opt) {
    this.id = _fighterId++;
    this.slot = opt.slot ?? 0;
    this.kind = opt.kind || 'bot';           // local | bot | remote
    this.name = opt.name || 'Bot';
    this.custom = Object.assign({ camo: 'woodland', helmet: 'adrian', face: 'none', vest: 'webbing', skin: 1, pack: 'none', pads: 'shin', op: null }, opt.custom || {});
    this.team = opt.team ?? -1;
    // partidas por equipos: cada bando viste la tela de su ejército (no afecta a Cárcel ni a la campaña)
    if (this.team >= 0 && G.mode && G.mode.teams && !G.mode.story && !G.mode.campaign && !this.custom.outfit) {
      const F = facOf(this.team).look; this.custom = { ...this.custom, camo: F.camo, fx: this.custom.op ? null : (this.custom.fx || F.extra || null) };
    }
    this.owner = opt.peer || null;
    this.difficulty = opt.difficulty || 'normal';
    // equipo: clase (o equipo completo); compatibilidad con el arma principal suelta
    this.loadout = opt.loadout && opt.loadout.primary ? opt.loadout : classLoadout(opt.cls || CLASS_FOR_PRIMARY[opt.primary] || 'rifleman');
    this.level = opt.level || 1;
    this.rewards = []; this.streakKills = 0;
    this.input = new InputState();
    this.pos = new THREE.Vector3(); this.prevPos = new THREE.Vector3(); this.vel = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.flinchDir = new THREE.Vector3();
    this.history = [];
    this.stats = this.freshStats();
    this.shotIndex = 0;
    this.alive = false; this.state = 'dead'; this.hidden = true;
    this.resetState();
  }
  freshStats() { return { kills: 0, deaths: 0, assists: 0, damage: 0, shots: 0, hits: 0, headshots: 0, score: 0, captures: 0, tags: 0, denies: 0, streak: 0, bestStreak: 0, knife: 0, nades: 0, longest: 0, medals: {} }; }
  resetState() {
    const inp = this.input;
    this.state = 'stand'; this.stateT = 0; this.hp = CONFIG.FIGHTER.hp;
    this.grounded = false; this.groundBlock = null; this.coyote = 0; this.jumpBufferT = 0; this.landTime = -1; this.justJumped = false;
    this.crouching = false; this.sliding = false; this.crouchHeld = false; this.sprinting = false; this.slideT = 0; this.slideCd = 0; this.slideDist = 0;
    this.knockT = 0; this.controlLock = 0; this.sprintOut = 0; this.sprintBlockT = 0; this.stepSmooth = 0; this.rampClimb = 0; this.wallHit = null; this.mantle = null;
    this.fireCd = 0; this.switchT = 0; this.meleeCd = 0; this.meleeT = 0; this.meleeDone = true; this.sprayT = 0; this.sprayN = 0; this.throwT = 0;
    this.bloom = 0; this.recoilAcc = 0; this.lastShotT = -9; this.adsT = 0; this.autoReloadT = 0; this.reloadT = 0; this.reloadTotal = 1; this.reloadTac = false;
    this.grenadeCook = null; this.grenadeHeldPrev = !!inp.grenade;
    this.prone = false; this.proneT = 0; this.proneBlockT = 0; this.lean = 0; this.leanOff = 0; this.seenTac = inp.tacticalCount; this.seenStreak = inp.streakCount;
    this.limpT = 0; this.armT = 0; this.dazeT = 0; this.invulnT = 0; this.staggerT = 0; this.flinchT = 0; this.lastDamageT = -99; this.lastAttacker = null; this.lastAttackerT = -99; this.damagers = new Map();
    this.ragdollDur = 0; this.deathTime = this.deathTime || 0;
    this.seenJump = inp.jumpCount; this.seenFire = inp.fireCount; this.seenReload = inp.reloadCount; this.seenSlot = inp.slotCount; this.seenCycle = inp.cycleCount;
    this.seenInteract = inp.interactCount; this.seenMelee = inp.meleeCount;
    this.vel.set(0, 0, 0);
    // equipo: principal (con accesorios) + pistola + cuchillo + granadas según la clase
    const lo = this.loadout, P = lo.primary, perk = lo.perk;
    const S = CONFIG.WEAPONS[lo.secondary] && CONFIG.WEAPONS[lo.secondary].slot === 'secondary' ? lo.secondary : 'pistol';
    const WP = weaponStats(P, lo.att, perk), WS = weaponStats(S, null, perk);
    this.ws = { [P]: WP, [S]: WS, knife: CONFIG.WEAPONS.knife };
    this.primary = P; this.secondary = S; this.burstN = 0;
    this.inv = { [P]: { mag: WP.mag, reserve: WP.reserve }, [S]: { mag: WS.mag, reserve: WS.reserve }, knife: { mag: Infinity, reserve: Infinity } };
    this.weapon = P;
    this.grenades = (lo.frags ?? CONFIG.GRENADE.count) + (perk === 'ammo' ? 1 : 0);
    this.smokes = lo.smokes ?? 1;
  }
  wstat(id = this.weapon) { return (this.ws && this.ws[id]) || CONFIG.WEAPONS[id] || CONFIG.WEAPONS.rifle; }
  attFor(id) { const w = this.ws && this.ws[id]; return w && w.att ? w.att : defaultAtt(id); }
  hasPerk(k) { return this.loadout && this.loadout.perk === k; }
  setWeapon(id) {
    if (!id || !this.inv[id] || this.weapon === id) return;
    this.weapon = id; this.reloadT = 0; this.autoReloadT = 0; this.adsT = 0;
    this.switchT = (id === 'knife' ? 0.22 : (CONFIG.WEAPONS[id] && CONFIG.WEAPONS[id].slot === 'secondary') ? 0.32 : id === 'rocket' ? 0.6 : 0.45) * (this.hasPerk('fast') ? 0.75 : 1);
    this.switchTotal = this.switchT;
    if (this.view) this.view.setWeapon(id);
    BUS.emit('weaponSwitch', this, id);
  }
  spawn(x, y, z, yaw) {
    // el jugador reaparece con la clase elegida (puede cambiarla mientras está muerto)
    if (this.kind === 'local' && !G.attract && typeof localLoadout === 'function' && G.settings) this.loadout = localLoadout();
    this.resetState();
    this.alive = true; this.hidden = false;
    this.pos.set(x, y, z); this.prevPos.copy(this.pos);
    this.yaw = yaw; this.pitch = 0; this.input.yaw = yaw; this.input.pitch = 0;
    if (this.brain) { this.brain.aimYaw = yaw; this.brain.aimPitch = 0; }
    this.history.length = 0;
    if (this.ragdoll && !this.corpse) this.ragdoll.dispose();
    this.ragdoll = null; this.corpse = null;
    if (!this.view) this.view = new SoldierView(this);
    this.view.reset(); this.view.setWeapon(this.weapon);
    this.invulnT = CONFIG.FIGHTER.spawnProtect;
    this.setProxy(true);
    BUS.emit('spawn', this);
  }
  centerPos(out) { return out.set(this.pos.x, this.pos.y + fHeight(this) * 0.55, this.pos.z); }
  headPos(out) {
    if (this.state === 'ragdoll' && this.ragdoll) return this.ragdoll.headPos(out);
    const z = Combat.zones(this, this.pos); return out.set(z.hx, z.hy, z.hz);
  }
  eyePos(out) { return eyePosOf(this, out); }

  // cuerpo cinemático para que granadas, cadáveres y objetos choquen con el soldado
  setProxy(on) {
    if (!PHYS.world) return;
    if (!this.proxy) {
      this.proxy = new CANNON.Body({ mass: 0, type: CANNON.Body.KINEMATIC, collisionFilterGroup: CG.FIGHTER, collisionFilterMask: CG.PROP | RAG_ALL | CG.DEBRIS });
      this.proxy.addShape(new CANNON.Box(new CANNON.Vec3(0.3, 0.9, 0.3)));
      this.proxy.userData = { fighter: this };
      PHYS.world.addBody(this.proxy);
    }
    this.proxy.collisionResponse = on;
    if (!on) this.proxy.position.set(0, -500, 0);
  }
  syncProxy() {
    if (!this.proxy || !this.proxy.collisionResponse) return;
    const h = fHeight(this);
    this.proxy.position.set(this.pos.x, this.pos.y + h / 2, this.pos.z);
    this.proxy.velocity.set(this.vel.x, this.vel.y, this.vel.z);
  }
  removeProxy() { if (this.proxy) { PHYS.world.removeBody(this.proxy); this.proxy = null; } }

  recordHistory(t) {
    const h = this.history;
    h.push({ t, x: this.pos.x, y: this.pos.y, z: this.pos.z, c: this.crouching || this.sliding ? 1 : 0 });
    while (h.length && t - h[0].t > CONFIG.HISTORY_SEC) h.shift();
  }
  posAt(t, out) {
    const h = this.history;
    if (!h.length) return out.copy(this.pos);
    if (t <= h[0].t) return out.set(h[0].x, h[0].y, h[0].z);
    for (let i = h.length - 1; i > 0; i--) {
      if (h[i - 1].t <= t) { const a = h[i - 1], b = h[i], k = (t - a.t) / Math.max(1e-6, b.t - a.t); return out.set(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.z, b.z, k)); }
    }
    return out.copy(this.pos);
  }

  // ---------- derribo (explosión cercana que no mata) ----------
  startRagdoll(impulse, point, dur) {
    if (!this.alive) return;
    if (this.state === 'ragdoll' && this.ragdoll) {
      if (impulse) this.ragdoll.applyImpulse(impulse, point);
      if (dur) this.ragdollDur = Math.max(this.ragdollDur, this.stateT + dur);
      return;
    }
    if (!this.view) return;
    if (this.sliding) endSlide(this);
    this.mantle = null; this.sprinting = false; this.reloadT = 0; this.adsT = 0;
    const pose = this.view.captureWorldPose();
    this.ragdoll = new Ragdoll(this, pose, this.vel);
    if (impulse) this.ragdoll.applyImpulse(impulse, point);
    this.state = 'ragdoll'; this.stateT = 0; this.ragdollDur = dur || CONFIG.RAGDOLL.knockTime;
    this.setProxy(false);
    this.view.onRagdoll(true);
    BUS.emit('ragdoll', this, true);
  }
  updateRagdoll(dt) {
    const R = CONFIG.RAGDOLL, rd = this.ragdoll;
    if (!rd) { this.state = 'stand'; return; }
    rd.update(dt);
    const pl = rd.pelvis.position;
    this.pos.set(pl.x, pl.y - 0.25, pl.z);
    rd.velocity(this.vel);
    this.yaw = this.input.yaw; this.pitch = this.input.pitch;
    if (this.stateT > this.ragdollDur && (rd.isSettled() || this.stateT > R.hardMaxTime)) this.tryGetUp();
  }
  tryGetUp() {
    const rd = this.ragdoll, tp = rd.partPos('pelvis', _v1);
    const hw = fHalfW(), H = CONFIG.FIGHTER.height;
    const q = PHYS.groundBelow(tp.x, tp.z, tp.y + 0.6, 4, 0.15);
    let x = tp.x, z = tp.z, feet = q ? q.y : tp.y - 0.3;
    if (!q || PHYS.overlapAABB(x - hw, feet + 0.02, z - hw, x + hw, feet + H, z + hw)) {
      let found = false;
      for (let r = 0.5; r <= 2.5 && !found; r += 0.5) for (let a = 0; a < 8 && !found; a++) {
        const xx = x + Math.cos(a * TAU / 8) * r, zz = z + Math.sin(a * TAU / 8) * r;
        const g2 = PHYS.groundBelow(xx, zz, tp.y + 0.8, 4, 0.2);
        if (g2 && !PHYS.overlapAABB(xx - hw, g2.y + 0.02, zz - hw, xx + hw, g2.y + H, zz + hw)) { x = xx; z = zz; feet = g2.y; found = true; }
      }
      if (!found) { if (this.stateT > CONFIG.RAGDOLL.hardMaxTime + 2) { const sp = Rules.pickSpawn(this); x = sp.x; z = sp.z; feet = sp.y; } else return; }
    }
    this.endRagdoll(x, feet, z);
    this.vel.set(0, 0, 0);
    this.state = 'getup'; this.stateT = 0; this.controlLock = CONFIG.RAGDOLL.getupTime;
  }
  endRagdoll(x, y, z) {
    const rd = this.ragdoll;
    if (this.view && rd) this.view.beginGetup(rd, x, y, z, this.yaw);
    if (rd) rd.dispose();
    this.ragdoll = null;
    this.pos.set(x, y, z); this.prevPos.copy(this.pos);
    this.crouching = false; this.sliding = false;
    this.setProxy(true);
    if (this.view) this.view.onRagdoll(false);
    BUS.emit('ragdoll', this, false);
  }

  // ---------- muerte: el cuerpo se queda en el mapa ----------
  die(info) {
    const wasCook = this.grenadeCook;
    this.alive = false; this.state = 'dead'; this.hp = 0; this.deathTime = G.time; this._deadAt = performance.now();
    this.sprinting = false; this.sliding = false; this.mantle = null; this.reloadT = 0; this.adsT = 0; this.grenadeCook = null;
    // granada cocinada: cae al suelo con la mecha que le quedaba
    if (wasCook && Rules.canAuthor(this)) {
      const left = Math.max(0.15, CONFIG.GRENADE.fuse - (G.time - wasCook.t0));
      const p = new THREE.Vector3(this.pos.x, this.pos.y + 1.1, this.pos.z);
      const id = Grenades.newId(this), v = new THREE.Vector3(this.vel.x * 0.4, 1, this.vel.z * 0.4);
      Grenades.spawn(this, p, v, left, true, id);
      if (NET.active) NET.queue('g', [this.slot, id, r2(p.x), r2(p.y), r2(p.z), r2(v.x), r2(v.y), r2(v.z), r2(left)]);
    }
    const view = this.view;
    if (!view) return;
    let rd = this.ragdoll;
    if (!rd) rd = new Ragdoll(this, view.captureWorldPose(), this.vel, { death: true });
    else rd.active = 0;
    // impulso de muerte: el cuerpo sale en la dirección del último impacto
    const imp = _v5.set(0, 0, 0);
    if (info.impulse && info.impulse.lengthSq() > 1e-6) imp.copy(info.impulse);
    else if (info.attacker && info.attacker !== this) imp.copy(this.pos).sub(info.attacker.pos).setY(0).normalize().multiplyScalar(2);
    const kind = info.kind || 'bullet';
    if (kind === 'bullet') {
      // impacto fuerte pero con tope: las balas potentes (francotirador) tumban al soldado cerca, no lo lanzan por los aires
      const l = imp.length();
      if (l > 0) { let v = 2.4 + l * 0.7; if (v > 3.6) v = Math.min(4.4, 3.6 + (v - 3.6) * 0.2); imp.multiplyScalar(v / l); }
    }
    else if (kind === 'melee') imp.multiplyScalar(0.9);
    imp.multiplyScalar(CONFIG.RAGDOLL.deathPush);
    const part = info.part === 'head' ? 'head' : info.part === 'legs' ? (info.point ? rd.nearestPart(info.point) : 'thighL') : info.point ? rd.nearestPart(info.point) : 'chest';
    if (imp.lengthSq() > 0) rd.applyImpulse(imp, info.point || null, part);
    this.setProxy(false);
    view.onDeath();
    // en primera persona el cuerpo propio estaba oculto: el cadáver sí debe verse (también en la repetición)
    view.root.visible = true;
    this.corpse = Corpses.add(this, view, rd);
    this.ragdoll = rd;
    this.view = null;
  }
}

