// ---- 11_ai.js ----
// =====================================================================
// IA TÁCTICA — los bots ven (campo de visión y línea de vista) y oyen
// disparos, recuerdan dónde vieron al enemigo, usan cobertura (se agachan
// y se asoman), recargan a cubierto, flanquean, lanzan granadas al último
// punto conocido, esquivan granadas y juegan el objetivo del modo.
// Escriben en un InputState igual que el jugador.
// =====================================================================
const BotNoise = {
  list: [],
  add(f, pos, r) { this.list.push({ f, pos: pos.clone(), t: G.time, r }); if (this.list.length > 40) this.list.shift(); },
  prune() { while (this.list.length && G.time - this.list[0].t > 5) this.list.shift(); },
};

class BotBrain {
  constructor(f, diff) { this.f = f; this.setDifficulty(diff); this.reset(); }
  setDifficulty(d) { this.diff = d; this.D = CONFIG.BOTS[d] || CONFIG.BOTS.normal; }
  reset() {
    const f = this.f;
    this.target = null; this.known = new Map(); this.hunt = null;
    this.path = null; this.pi = 0; this.goal = null; this.goalKind = 'none'; this.repathT = 0; this.thinkT = frand(0, 0.2);
    this.aimYaw = f.yaw; this.aimPitch = 0; this.reactT = 0; this.err = new THREE.Vector3(); this.errT = 0; this.errK = 1; this.aimHead = false;
    this.burstT = 0; this.pauseT = 0; this.semiT = 0; this.wantAds = false; this.crouchFire = false;
    this.strafe = FX_RNG.sign(); this.strafeT = 0; this.cover = null; this.coverT = 0; this.peekT = 0; this.peekUp = true; this.coverSearchT = 0;
    this.nadeCd = frand(6, 14); this.cook = 0; this.nadeTarget = null; this.dangerT = 0; this.dangerDir = new THREE.Vector3();
    this.stuckT = 0; this.lastPos = f.pos.clone(); this.progressT = 0; this.escapeT = 0; this.escapeDir = 0;
    this.holdT = 0; this.switchCd = 0; this.lookT = 0; this.lookYaw = f.yaw; this.flank = FX_RNG.next() < this.D.flank;
    this.lane = f.slot % 3; this.role = f.slot % 2 ? 'defend' : 'attack'; this.meleeCd = 0; this.jumpT = 0;
    this.smokeCd = frand(6, 12); this.smokeT = 0; this.smokeTarget = null; this.proneWant = false; this.proneT = 0; this.streakT = frand(2, 5); this.leanWant = 0;
  }
  press(k) { this.f.input[k]++; }
  eye(out) { return eyePosOf(this.f, out); }

  // blanco del campo de tiro: no dispara ni reacciona; los móviles pasean de lado a lado
  dummyTick(dt) {
    const f = this.f, inp = f.input, st = f.station;
    inp.fire = false; inp.aim = false; inp.crouch = false; inp.sprint = false; inp.jump = false; inp.grenade = false; inp.lean = 0;
    this.aimYaw = st.yaw; this.aimPitch = 0;
    if (!f.alive || f.state === 'ragdoll' || f.state === 'getup' || G.freeze || !st.move) { inp.mx = inp.mz = 0; this.writeAim(); return; }
    if (this.dd == null) this.dd = (st.ph | 0) % 2 ? 1 : -1;
    if (f.pos.x > st.x + st.amp) this.dd = -1; else if (f.pos.x < st.x - st.amp) this.dd = 1;
    this.setMove(this.dd, 0, 0.42); this.writeAim();
  }
  update(dt) {
    const f = this.f, inp = f.input, D = this.D;
    if (f.dummy) { this.dummyTick(dt); return; }
    this.thinkT -= dt; this.repathT -= dt; this.strafeT -= dt; this.reactT -= dt; this.burstT -= dt; this.pauseT -= dt; this.semiT -= dt; this.nadeCd -= dt;
    this.smokeCd -= dt; this.proneT -= dt; this.streakT -= dt;
    this.dangerT -= dt; this.escapeT -= dt; this.holdT -= dt; this.switchCd -= dt; this.coverT -= dt; this.peekT -= dt; this.lookT -= dt; this.meleeCd -= dt; this.jumpT -= dt; this.coverSearchT -= dt;
    inp.fire = false; inp.aim = false; inp.crouch = false; inp.sprint = false; inp.jump = false;
    if (!f.alive || f.state === 'ragdoll' || f.state === 'getup' || G.freeze) { inp.mx = inp.mz = 0; inp.grenade = false; inp.lean = 0; this.cook = 0; this.smokeT = 0; this.writeAim(); return; }
    this.leanWant = 0;
    // rachas: usarlas poco después de ganarlas
    if (f.rewards.length && this.streakT <= 0) { this.useStreak(); this.streakT = frand(4, 9); }
    // humo: apuntar un instante y lanzarlo
    if (this.smokeT > 0) {
      this.smokeT -= dt;
      this.aimAt(this.smokeTarget, dt, 'smoke', 1.4);
      if (this.smokeT <= 0) { this.press('tacticalCount'); this.smokeCd = frand(18, 30); }
      this.setMove(0, 0, 0); inp.lean = 0; this.writeAim();
      return;
    }
    if (this.thinkT <= 0) { this.think(); this.thinkT = 0.16 + FX_RNG.next() * 0.1; }

    let mvx = 0, mvz = 0, mvK = 0, sprint = false, crouch = false;
    const t = this.target;
    // ---- granada en la mano ----
    if (this.cook > 0) {
      this.cook -= dt;
      inp.grenade = true;
      this.aimAt(this.nadeTarget, dt, true);
      if (this.cook <= 0) { inp.grenade = false; this.nadeCd = frand(12, 20) / Math.max(0.3, D.nade); }
      this.setMove(0, 0, 0); this.writeAim();
      return;
    }
    inp.grenade = false;

    if (this.dangerT > 0) {
      // escapar de una granada
      mvx = this.dangerDir.x; mvz = this.dangerDir.z; mvK = 1; sprint = true;
    } else if (t && this.vis) {
      const r = this.engage(dt, t);
      mvx = r[0]; mvz = r[1]; mvK = r[2]; crouch = r[3];
    } else {
      if (!this.goal || this.repathT <= 0) this.chooseGoal();
      if (this.goal) {
        const dGoal = Math.hypot(this.goal.x - f.pos.x, this.goal.z - f.pos.z);
        const r = this.follow(dt);
        mvx = r[0]; mvz = r[1]; mvK = r[2];
        sprint = mvK > 0 && this.goalKind !== 'hold' && !(this.hunt && dGoal < 14);
        // mirar hacia donde camina, o hacia el último punto conocido del enemigo
        if (this.hunt && dGoal < 22) this.aimAt(this.hunt.pos, dt, false, 0.6);
        else if (mvK > 0) this.lookDir(mvx, mvz, dt);
        else this.idleLook(dt);
        if (this.goalKind === 'hold') { crouch = this.holdCrouch; }
      } else this.idleLook(dt);
    }
    // atascado: saltar / trepar, y si sigue, escapar a un lado
    this.progressT += dt;
    if (this.progressT > 0.9) {
      const moved = Math.hypot(f.pos.x - this.lastPos.x, f.pos.z - this.lastPos.z);
      // (en el aire también cuenta: saltar contra una pared no es avanzar)
      if (mvK > 0 && moved < 0.35 && !crouch && this.escapeT <= 0) { this.stuckT += this.progressT; if (f.grounded && this.jumpT <= 0) { this.press('jumpCount'); this.jumpT = 0.6; } }
      else if (moved >= 0.35 || mvK === 0) { this.stuckT = 0; if (moved >= 0.8) this.stuckN = 0; }
      if (this.stuckT > 2.2) {
        // escapar hacia atrás y a un lado de lo que bloquea; si se repite, cambiar de objetivo
        this.stuckN = (this.stuckN || 0) + 1;
        this.path = null; this.repathT = 0; this.stuckT = 0;
        this.escapeDir = Math.atan2(-mvz, -mvx) + (FX_RNG.next() < 0.5 ? -1 : 1) * frand(0.6, 1.4); this.escapeT = 0.7 + 0.25 * Math.min(3, this.stuckN);
        if (this.stuckN >= 3) { this.goal = null; this.stuckN = 0; }
      }
      this.lastPos.copy(f.pos); this.progressT = 0;
    }
    if (this.escapeT > 0) { mvx = Math.cos(this.escapeDir); mvz = Math.sin(this.escapeDir); mvK = 1; }
    // tumbarse: solo el tirador quieto a distancia; cualquier desplazamiento largo lo levanta
    if (this.proneWant && (mvK > 0.6 || this.escapeT > 0 || this.dangerT > 0 || this.proneT <= 0)) this.proneWant = false;
    inp.prone = this.proneWant;
    if (this.proneWant) crouch = false;
    inp.lean = this.leanWant;
    inp.crouch = crouch;
    inp.sprint = sprint && !crouch && mvK > 0;
    this.setMove(mvx, mvz, mvK);
    this.writeAim();
  }

  // ---------------- percepción y decisiones ----------------
  think() {
    const f = this.f, D = this.D, now = G.time;
    const eye = this.eye(_v1);
    const fx = -Math.sin(this.aimYaw), fz = -Math.cos(this.aimYaw);
    let best = null, bs = Infinity;
    for (const o of G.fighters) {
      if (!o.alive || o.hidden || !Rules.isEnemy(f, o)) continue;
      const d = o.pos.distanceTo(f.pos);
      if (d > 105) continue;
      const dx = o.pos.x - f.pos.x, dz = o.pos.z - f.pos.z, dl = Math.hypot(dx, dz) || 1;
      const cosA = (dx * fx + dz * fz) / dl;
      const hitByIt = f.lastAttacker === o && now - f.lastAttackerT < 1.6;
      const inFov = cosA > 0.42 - D.view || d < 3.5 || hitByIt;
      let vis = false;
      if (inFov) {
        const hp = o.headPos(_v2);
        vis = PHYS.lineOfSight(eye, hp) && !Smoke.blocks(eye, hp);
        if (!vis) { const cp = o.centerPos(_v3); vis = PHYS.lineOfSight(eye, cp) && !Smoke.blocks(eye, cp); }
        // tumbado y quieto a lo lejos: muy difícil de ver
        if (vis && d > 30 && o.prone && Math.hypot(o.vel.x, o.vel.z) < 0.5 && G.time - (o.lastLoudT ?? -9) > 1.5 && FX_RNG.next() < 0.7) vis = false;
        // de lejos, un enemigo agachado y quieto cuesta verlo
        if (vis && d > 45 && o.crouching && Math.hypot(o.vel.x, o.vel.z) < 1 && G.time - o.lastShotT > 1.5 && FX_RNG.next() < 0.6) vis = false;
      }
      if (vis) {
        const k = this.known.get(o) || {};
        k.pos = (k.pos || new THREE.Vector3()).copy(o.pos); k.t = now; k.vis = true;
        this.known.set(o, k);
        let s = d + (o === this.target ? -10 : 0) + (hitByIt ? -12 : 0) + (o.kind !== 'bot' ? -3 : 0);
        if (s < bs) { bs = s; best = o; }
      } else { const k = this.known.get(o); if (k) k.vis = false; }
    }
    // oído: disparos cercanos revelan la posición
    BotNoise.prune();
    for (const n of BotNoise.list) {
      if (!n.f || !n.f.alive || !Rules.isEnemy(f, n.f) || now - n.t > 1.6) continue;
      if (n.pos.distanceTo(f.pos) > D.hearing * n.r) continue;
      const k = this.known.get(n.f) || {};
      if (!k.t || k.t < n.t) { k.pos = (k.pos || new THREE.Vector3()).copy(n.pos); k.t = n.t; k.vis = k.vis || false; k.heard = true; this.known.set(n.f, k); }
    }
    // reconocimiento aéreo del equipo: se conoce dónde están los enemigos
    if (Streaks.uavActive(f)) for (const o of G.fighters) {
      if (!o.alive || !Rules.isEnemy(f, o) || (o.hasPerk && o.hasPerk('quiet'))) continue;
      const k = this.known.get(o) || {};
      if (!k.vis) { k.pos = (k.pos || new THREE.Vector3()).copy(o.pos); k.t = now - 1; k.vis = false; k.heard = true; this.known.set(o, k); }
    }
    for (const [o, k] of this.known) if (!o.alive || now - k.t > 12) this.known.delete(o);
    if (best !== this.target && best) {
      this.reactT = D.reaction * frand(0.8, 1.35) * (this.target ? 0.6 : 1);
      this.errK = 1; this.aimHead = FX_RNG.next() < D.headChance;
      const d = best.pos.distanceTo(f.pos);
      this.wantAds = d > 9 && FX_RNG.next() < D.ads;
      this.crouchFire = d > 22 && FX_RNG.next() < 0.45;
      this.cover = null;
    }
    this.target = best; this.vis = !!best;
    // a quién cazar si no hay nadie a la vista
    this.hunt = null;
    if (!best) { let bt = -Infinity; for (const [o, k] of this.known) if (k.t > bt) { bt = k.t; this.hunt = { f: o, pos: k.pos, t: k.t }; } }
    // granadas cercanas: huir
    for (const g of Grenades.list) {
      const p = g.body.position, dd = Math.hypot(p.x - f.pos.x, p.z - f.pos.z);
      if (dd < 5.5 && Math.abs(p.y - f.pos.y) < 3 && g.fuse < 2.6 && FX_RNG.next() < 0.5 + D.cover * 0.5) {
        this.dangerT = 1.4; this.dangerDir.set(f.pos.x - p.x, 0, f.pos.z - p.z).normalize();
        if (this.dangerDir.lengthSq() < 0.5) this.dangerDir.set(Math.cos(f.slot), 0, Math.sin(f.slot));
      }
    }
    this.manageWeapons();
    // granada al último punto conocido (enemigo a cubierto)
    if (!best && this.hunt && f.grenades > 0 && this.nadeCd <= 0 && G.time - this.hunt.t < 5 && this.dangerT <= 0) {
      const d = this.hunt.pos.distanceTo(f.pos);
      if (d > 7 && d < 26 && FX_RNG.next() < D.nade && !G.fighters.some((o) => o !== f && o.alive && !Rules.isEnemy(f, o) && o.pos.distanceTo(this.hunt.pos) < 6)) {
        this.nadeTarget = this.hunt.pos.clone(); this.cook = frand(0.35, 1.0);
      } else this.nadeCd = frand(2, 5);
    }
    // humo: cubrir el avance a un punto enemigo, o la retirada con poca vida
    if (f.smokes > 0 && this.smokeCd <= 0 && this.smokeT <= 0 && this.cook <= 0 && this.dangerT <= 0) {
      let tgt = null;
      if (best && f.hp < 50 && best.pos.distanceTo(f.pos) > 12 && !this.cover) tgt = _v4.copy(f.pos).lerp(best.pos, 0.3);
      else if (this.goalKind === 'obj' && this.goal) {
        const d = this.goal.distanceTo(f.pos);
        const enemyNear = [...this.known].some(([o, k]) => now - k.t < 6 && k.pos.distanceTo(this.goal) < 12);
        if (d > 12 && d < 30 && enemyNear) tgt = _v4.copy(f.pos).lerp(this.goal, 0.6);
      }
      if (tgt && FX_RNG.next() < 0.5 + this.D.cover * 0.3) { this.smokeTarget = tgt.clone(); this.smokeT = 0.55; }
      else this.smokeCd = frand(3, 6);
    }
  }
  // rachas: el reconocimiento al instante; mortero y avión sobre el enemigo conocido al aire libre
  useStreak() {
    const f = this.f, id = f.rewards[0];
    if (id === 'uav' || id === 'jam') { Streaks.activate(f, id, f.pos.x, f.pos.z, f.yaw); return; }
    if (id === 'supply') { Streaks.activate(f, id, f.pos.x - Math.sin(f.yaw) * 1.6, f.pos.z - Math.cos(f.yaw) * 1.6, f.yaw); return; }
    const cands = [];
    for (const [o, k] of this.known) if (o.alive && G.time - k.t < 8) cands.push(k.pos);
    if (!cands.length) for (const o of G.fighters) if (o.alive && Rules.isEnemy(f, o) && FX_RNG.next() < 0.5) cands.push(o.pos);
    for (const p of cands) {
      if (p.distanceTo(f.pos) < 14) continue;
      if (G.fighters.some((o) => o.alive && !Rules.isEnemy(f, o) && o.pos.distanceTo(p) < 9)) continue;
      const up = _v5.set(p.x, p.y + 1.6, p.z);
      if (PHYS.raycast(up, _v6.set(0, 1, 0), 40, {})) continue;
      const yaw = Math.atan2(-(p.x - f.pos.x), -(p.z - f.pos.z));
      Streaks.activate(f, id, p.x + frand(-2, 2), p.z + frand(-2, 2), yaw);
      return;
    }
  }
  manageWeapons() {
    const f = this.f;
    if (this.switchCd > 0 || f.reloadT > 0 || f.switchT > 0) return;
    const has = (w) => f.inv[w] && (f.inv[w].mag > 0 || f.inv[w].reserve > 0);
    const d = this.target ? this.target.pos.distanceTo(f.pos) : 30;
    let want = f.weapon;
    const sc = f.secondary;
    if (has(f.primary)) want = f.primary; else if (has(sc)) want = sc; else want = 'knife';
    if (f.primary === 'rocket' && d < 7 && has(sc)) want = sc;
    if ((f.primary === 'sniper' || f.primary === 'dmr' || f.primary === 'mk2' || f.primary === 'lmg' || f.primary === 'mg2') && d < 9 && has(sc)) want = sc;
    if (want !== f.weapon) { f.input.slot = want === f.primary ? 1 : want === sc ? 2 : 3; f.input.slotCount++; this.switchCd = 1.2; return; }
    const W = f.wstat(), inv = f.inv[f.weapon];
    if (W.kind !== 'melee' && inv.reserve > 0 && (inv.mag === 0 || (!this.vis && inv.mag < W.mag * 0.5))) this.press('reloadCount');
  }
  chooseGoal() {
    const f = this.f, m = G.match, M = G.mode;
    this.repathT = 3 + FX_RNG.next() * 2;
    if (this.hunt) { this.setGoal(this.hunt.pos, 'hunt'); return; }
    if (M.tags && Tags.list.length) { const tg = Tags.nearestFor(f, 26); if (tg) { this.setGoal(_v4.set(tg.x, tg.y, tg.z), 'obj'); this.repathT = 1.2; return; } }
    if (M.dom && m && MapSys.dom.length) {
      // atacantes van al punto no propio más cercano; defensores cuidan lo propio
      let best = -1, bs = Infinity;
      for (let i = 0; i < MapSys.dom.length; i++) {
        const d = MapSys.dom[i], st = m.dom[i];
        let s = Math.hypot(d.x - f.pos.x, d.z - f.pos.z);
        if (st.owner === f.team) s += this.role === 'defend' ? -5 : 45; else s -= 10;
        if (st.contested) s -= 15;
        if (i === 1) s -= 4;
        if (s < bs) { bs = s; best = i; }
      }
      const d = MapSys.dom[best];
      const inside = Math.hypot(d.x - f.pos.x, d.z - f.pos.z) < d.r * 0.8;
      if (inside) { const a = frand(0, TAU), r = frand(0.5, d.r * 0.7); this.setGoal(_v4.set(d.x + Math.cos(a) * r, d.y, d.z + Math.sin(a) * r), 'hold'); this.holdCrouch = FX_RNG.next() < 0.5; this.repathT = frand(2.5, 4.5); }
      else this.setGoal(_v4.set(d.x, d.y, d.z), 'obj');
      return;
    }
    // ruido reciente de enemigos
    let n = null;
    for (const e of BotNoise.list) if (e.f && Rules.isEnemy(f, e.f) && G.time - e.t < 5 && (!n || e.t > n.t)) n = e;
    if (n && n.pos.distanceTo(f.pos) < 70) { this.setGoal(n.pos, 'noise'); return; }
    // carriles: primero el punto de su carril, luego hacia el lado enemigo
    const nav = MapSys.nav;
    if (MapSys.dom.length && (FX_RNG.next() < 0.6 || M.rounds)) {
      const d = MapSys.dom[this.lane % MapSys.dom.length];
      if (Math.hypot(d.x - f.pos.x, d.z - f.pos.z) > 8) { this.setGoal(_v4.set(d.x, d.y, d.z), 'lane'); return; }
      if (M.teams) { const sp = MapSys.spawns[1 - f.team]; if (sp && sp.length) { const p = sp[(f.slot * 3) % sp.length]; this.setGoal(_v4.set(p.x, p.y, p.z), 'push'); this.lane = (this.lane + 1 + (f.slot & 1)) % 3; return; } }
    }
    if (nav && nav.nodes.length) {
      for (let i = 0; i < 8; i++) { const nd = nav.nodes[(Math.random() * nav.nodes.length) | 0]; if (Math.hypot(nd.x - f.pos.x, nd.z - f.pos.z) > 15) { this.setGoal(nd, 'roam'); return; } }
    }
  }
  setGoal(p, kind) {
    this.goal = new THREE.Vector3(p.x, p.y, p.z); this.goalKind = kind; this.path = null; this.pi = 0;
    const nav = MapSys.nav; if (!nav) return;
    const a = navNearestReach(nav, this.f.pos, 5), b = navNearest(nav, this.goal, 8);
    if (!a || !b) return;
    // flanqueo: castigar nodos cerca de la línea directa
    let avoid = null;
    if (this.flank && (kind === 'hunt' || kind === 'noise') && FX_RNG.next() < 0.6) {
      const ax = a.x, az = a.z, bx = b.x, bz = b.z, L = Math.hypot(bx - ax, bz - az) || 1;
      avoid = (n) => { const t = clamp(((n.x - ax) * (bx - ax) + (n.z - az) * (bz - az)) / (L * L), 0, 1); const px = ax + (bx - ax) * t, pz = az + (bz - az) * t; const dd = Math.hypot(n.x - px, n.z - pz); return dd < 6 && t > 0.15 && t < 0.85 ? 4 : 0; };
    }
    this.path = navPath(nav, a, b, avoid);
    this.pi = this.path && this.path.length > 1 ? 1 : 0;
  }
  follow(dt) {
    const f = this.f, g = this.goal;
    if (!g) return [0, 0, 0];
    const dGoal = Math.hypot(g.x - f.pos.x, g.z - f.pos.z);
    if (dGoal < 1.0 && Math.abs(g.y - f.pos.y) < 1.5) { if (this.goalKind !== 'hold') { this.goal = null; this.repathT = 0; } return [0, 0, 0]; }
    if (!this.path || this.pi >= this.path.length) { const dx = g.x - f.pos.x, dz = g.z - f.pos.z, l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l, 1]; }
    let step = this.path[this.pi];
    let n = step.node, dx = n.x - f.pos.x, dz = n.z - f.pos.z, dh = Math.hypot(dx, dz);
    while (dh < 0.75 && Math.abs(n.y - f.pos.y) < 1.4 && this.pi < this.path.length - 1) { this.pi++; step = this.path[this.pi]; n = step.node; dx = n.x - f.pos.x; dz = n.z - f.pos.z; dh = Math.hypot(dx, dz); }
    if (this.pi === this.path.length - 1 && dh < 0.75) { dx = g.x - f.pos.x; dz = g.z - f.pos.z; dh = Math.hypot(dx, dz); }
    // trepar
    if (step.link && step.link.type === 'mantle' && dh < 1.7 && f.grounded && this.jumpT <= 0 && n.y - f.pos.y > 0.4) { this.press('jumpCount'); this.jumpT = 0.7; f.input.jump = true; }
    const l = dh || 1;
    return [dx / l, dz / l, 1];
  }

  // ---------------- combate ----------------
  engage(dt, t) {
    const f = this.f, D = this.D, inp = f.input, W = f.wstat();
    const d = t.pos.distanceTo(f.pos);
    let mvx = 0, mvz = 0, mvK = 0, crouch = false;
    // apuntar
    const aimP = this.aimPoint(t, _v6);
    const aligned = this.aimAt(aimP, dt, false);
    // usar la mira
    if ((this.wantAds || (W.scope && d > 6)) && W.kind !== 'melee') inp.aim = true;
    // recarga o vida baja: cubrirse
    const inv = f.inv[f.weapon];
    const needCover = (f.reloadT > 0 || f.hp < 45 || (inv && inv.mag === 0)) && D.cover > 0.3;
    if ((needCover || (this.crouchFire && D.cover > 0.6)) && this.coverSearchT <= 0 && (!this.cover || this.cover.used)) { this.cover = this.findCover(t, needCover); this.coverSearchT = 1.2; }
    if (this.cover) {
      const c = this.cover, dc = Math.hypot(c.node.x - f.pos.x, c.node.z - f.pos.z);
      if (dc > 0.7) { const l = dc || 1; mvx = (c.node.x - f.pos.x) / l; mvz = (c.node.z - f.pos.z) / l; mvK = 1; }
      else {
        // en cobertura: agacharse y asomarse
        if (this.peekT <= 0) { this.peekUp = !this.peekUp; this.peekT = this.peekUp ? frand(0.9, 2.0) : frand(0.6, 1.4); }
        crouch = needCover || !this.peekUp || (c.low && !this.peekUp);
        if (c.high && !needCover && this.peekUp) { // asomarse por el lado (inclinándose, sin salir del todo)
          const sd = this.strafe; mvx = -Math.cos(this.aimYaw) * sd * 0.25; mvz = Math.sin(this.aimYaw) * sd * 0.25; mvK = 0.3;
          this.leanWant = -sd;
        }
        if (!needCover && f.hp > 70 && d < 14 && FX_RNG.next() < dt * 0.3) this.cover = null; // salir a empujar
      }
    } else if (W.kind === 'melee') {
      const l = d || 1; mvx = (t.pos.x - f.pos.x) / l; mvz = (t.pos.z - f.pos.z) / l; mvK = 1;
      inp.sprint = d > 4;
    } else {
      // desplazamiento lateral, acercarse o alejarse según el arma
      if (this.strafeT <= 0) { this.strafe = FX_RNG.next() < 0.5 ? -1 : 1; this.strafeT = frand(0.5, 1.5); }
      const nx = (t.pos.x - f.pos.x) / (d || 1), nz = (t.pos.z - f.pos.z) / (d || 1);
      const pref = { rifle: 22, smg: 11, shotgun: 6, sniper: 38, pistol: 12, rocket: 20, knife: 1 }[f.weapon] || 15;
      const s = D.strafe * (this.crouchFire ? 0 : 1);
      mvx = -nz * this.strafe * s; mvz = nx * this.strafe * s; mvK = s > 0 ? 0.8 : 0;
      if (d > pref + 8) { const r = this.pathToward(t.pos); mvx += r[0]; mvz += r[1]; mvK = 1; }
      else if (d < pref - 5 && f.weapon !== 'shotgun') { mvx -= nx * 0.8; mvz -= nz * 0.8; mvK = 1; }
      if (this.crouchFire && mvK < 0.9) { crouch = true; mvK = 0; }
      // tirador a distancia: tumbarse para ganar estabilidad y ocultarse
      if (W.scope && d > 28 && f.hp > 50 && mvK < 0.9) { if (!this.proneWant && FX_RNG.next() < dt * 0.8) { this.proneWant = true; this.proneT = frand(6, 14); } }
      if (this.proneWant) { mvK = 0; crouch = false; }
    }
    // cuchillo si está encima
    if (d < 2.3 && this.meleeCd <= 0 && aligned) { this.press('meleeCount'); this.meleeCd = 0.9; }
    // disparar en ráfagas controladas
    if (this.reactT <= 0 && aligned && W.kind !== 'melee' && !this.friendInLine(t, d)) {
      if (W.auto) {
        if (this.burstT > 0) inp.fire = true;
        else if (this.pauseT <= 0) { this.burstT = frand(0.18, d < 12 ? 0.75 : 0.45) * (0.6 + D.burst * 0.6); this.pauseT = this.burstT + frand(0.12, 0.42) * (1.4 - D.burst * 0.6); inp.fire = true; }
      } else if (this.semiT <= 0 && f.fireCd <= 0) {
        this.press('fireCount'); this.semiT = (1 / W.fireRate) + frand(0.05, 0.3) * (1.3 - D.burst * 0.5);
        if (W.scope) this.semiT += frand(0.2, 0.6);
      }
    }
    return [mvx, mvz, mvK, crouch];
  }
  aimPoint(t, out) {
    const f = this.f, D = this.D;
    if (t.state === 'ragdoll' && t.ragdoll) t.ragdoll.torsoPos(out);
    else if (f.weapon === 'rocket') out.set(t.pos.x, t.pos.y + 0.25, t.pos.z);
    else if (this.aimHead) t.headPos(out);
    else t.centerPos(out);
    const d = out.distanceTo(f.pos);
    // anticipación y error humano que se corrige mientras sigue al objetivo
    const lead = f.weapon === 'rocket' ? d / CONFIG.WEAPONS.rocket.projSpeed : 0.05;
    out.addScaledVector(t.vel, lead * (0.6 + this.D.aimSpeed * 0.03));
    this.errT -= 0.016;
    if (this.errT <= 0) { this.errT = frand(0.35, 0.8); this.err.set(frand(-1, 1), frand(-0.6, 0.6), frand(-1, 1)).normalize().multiplyScalar(frand(0.3, 1)); }
    this.errK = Math.max(0.35, this.errK - 0.016 * 0.9);
    const moveK = 1 + Math.hypot(t.vel.x, t.vel.z) / 6;
    out.addScaledVector(this.err, D.aimNoise * d * this.errK * moveK * 1.6);
    return out;
  }
  aimAt(p, dt, grenade, speedK = 1) {
    const f = this.f, eye = this.eye(_v7);
    const dx = p.x - eye.x, dz = p.z - eye.z, dy = p.y - eye.y, hd = Math.hypot(dx, dz) || 0.01;
    const yaw = Math.atan2(-dx, -dz);
    let pitch = Math.atan2(dy, hd);
    if (grenade) pitch = this.throwPitch(hd, dy, grenade === 'smoke' ? CONFIG.SMOKE.throwSpeed : CONFIG.GRENADE.throwSpeed);
    const sp = this.D.aimSpeed * speedK * (f.dazeT > 0 ? 0.45 : 1) * (f.armT > 0 ? 0.8 : 1);
    this.aimYaw = dampAngle(this.aimYaw, yaw, sp, dt);
    this.aimPitch = damp(this.aimPitch, clamp(pitch, -1.3, 1.3), sp, dt);
    const ey = Math.abs(wrapAngle(yaw - this.aimYaw)), ep = Math.abs(pitch - this.aimPitch);
    const W = f.wstat();
    const tol = 0.035 + (W.pellets > 1 ? 0.05 : 0) + 0.6 / Math.max(4, hd);
    return ey < tol && ep < tol;
  }
  throwPitch(d, h, v = CONFIG.GRENADE.throwSpeed) {
    const GR = CONFIG.GRENADE, g = CONFIG.MOVE.gravity;
    let best = 0.5, be = Infinity;
    for (let th = 0.05; th <= 1.05; th += 0.05) {
      const vy = v * Math.sin(th) + GR.upBoost, vx = v * Math.cos(th);
      const disc = vy * vy - 2 * g * h; if (disc < 0) continue;
      const tt = (vy + Math.sqrt(disc)) / g, x = vx * tt;
      const e = Math.abs(x - d * 0.82);
      if (e < be) { be = e; best = th; }
    }
    return best;
  }
  lookDir(x, z, dt) { if (Math.abs(x) + Math.abs(z) < 1e-3) return; this.aimYaw = dampAngle(this.aimYaw, Math.atan2(-x, -z), 5, dt); this.aimPitch = damp(this.aimPitch, -0.05, 4, dt); }
  idleLook(dt) {
    if (this.lookT <= 0) { this.lookT = frand(1.2, 3); this.lookYaw = this.aimYaw + frand(-1.2, 1.2); }
    this.aimYaw = dampAngle(this.aimYaw, this.lookYaw, 3, dt); this.aimPitch = damp(this.aimPitch, 0, 3, dt);
  }
  pathToward(p) {
    const f = this.f;
    if (!this.goal || this.goal.distanceTo(p) > 4 || this.repathT <= 0) { this.setGoal(p, 'chase'); this.repathT = 1.5; }
    return this.follow(0.016);
  }
  friendInLine(t, d) {
    const f = this.f, eye = this.eye(_v7), dir = dirFromYawPitch(this.aimYaw, this.aimPitch, _v8);
    for (const o of G.fighters) {
      if (o === f || !o.alive || Rules.isEnemy(f, o)) continue;
      const r = rayPointDist(eye, dir, d, _v5.set(o.pos.x, o.pos.y + 1.1, o.pos.z));
      if (r.dist < 0.55 && r.t > 0.5 && r.t < d) return true;
    }
    return false;
  }
  // cobertura: nodo cercano con obstáculo entre él y la amenaza
  findCover(t, full) {
    const f = this.f, nav = MapSys.nav; if (!nav) return null;
    let best = null, bs = Infinity;
    const cx = Math.floor(f.pos.x / NAV_CELL), cz = Math.floor(f.pos.z / NAV_CELL);
    for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) {
      const arr = nav.hash.get((cx + i) + ',' + (cz + j)); if (!arr) continue;
      for (const n of arr) {
        if (!n.cover && !n.high) continue;
        if (Math.abs(n.y - f.pos.y) > 1.2) continue;
        const dd = Math.hypot(n.x - f.pos.x, n.z - f.pos.z); if (dd > 7.5) continue;
        const a = Math.atan2(t.pos.z - n.z, t.pos.x - n.x);
        const di = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8, mask = (1 << di) | (1 << ((di + 1) % 8)) | (1 << ((di + 7) % 8));
        const low = !!(n.cover & mask), high = !!(n.high & mask);
        if (!low && !high) continue;
        if (full && !high && !low) continue;
        // ¿se puede asomar? (cobertura baja: de pie ve al enemigo)
        let s = dd + (Math.hypot(t.pos.x - n.x, t.pos.z - n.z) < 6 ? 20 : 0);
        if (low && !full) { _v1.set(n.x, n.y + 1.6, n.z); _v2.set(t.pos.x, t.pos.y + 1.4, t.pos.z); if (!PHYS.lineOfSight(_v1, _v2)) s += 6; }
        if (high && !full) s += 2;
        if (s < bs) { bs = s; best = { node: n, low, high }; }
      }
    }
    return best;
  }
  setMove(wx, wz, k) {
    const inp = this.f.input, y = this.aimYaw;
    const l = Math.hypot(wx, wz);
    if (l < 1e-4 || k <= 0) { inp.mx = 0; inp.mz = 0; return; }
    wx /= l; wz /= l;
    const s = Math.sin(y), c = Math.cos(y);
    inp.mz = clamp((-wx * s - wz * c) * Math.min(1, k * 1.2), -1, 1);
    inp.mx = clamp((wx * c - wz * s) * Math.min(1, k * 1.2), -1, 1);
  }
  writeAim() { const inp = this.f.input; inp.yaw = this.aimYaw; inp.pitch = clamp(this.aimPitch, -1.45, 1.45); }
}

