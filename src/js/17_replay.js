// ---- 17_replay.js ----
// =====================================================================
// KILLCAM — búfer circular (30 Hz) con la pose de cada soldado y cuerpo,
// la mirada de cada uno y los efectos. Al morir se repiten los últimos
// segundos desde los ojos de quien te mató, con cámara lenta al final.
// Funciona igual en línea: se graba lo que este cliente ya está viendo.
// =====================================================================
const REPLAY_HZ = 30, REPLAY_SEC = 5, REPLAY_LEN = REPLAY_SEC * REPLAY_HZ, RV = 24, RF = 97;
const Replay = {
  frames: [], head: 0, count: 0, acc: 0, fxLog: [], playing: false, play: null,
  init() {
    this.frames = [];
    for (let i = 0; i < REPLAY_LEN; i++) this.frames.push({ t: 0, n: 0, views: new Array(RV), d: new Float32Array(RV * RF), eyes: new Float32Array(8 * 8), eyeN: 0, ids: new Int32Array(8) });
    let depth = 0;
    for (const name of ['tracer', 'muzzle', 'impact', 'explosion', 'hitFx', 'rocketTrail', 'debris']) {
      if (FX['_orig_' + name]) continue;
      const orig = FX[name].bind(FX); FX['_orig_' + name] = orig;
      FX[name] = (...args) => {
        if (depth === 0 && !this.playing && G.match && !G.attract) {
          const a = args.map((x) => (x && x.isVector3 ? x.clone() : x && typeof x === 'object' && x.target ? { point: x.point ? x.point.clone() : x.target.centerPos(new THREE.Vector3()), impulse: x.impulse ? x.impulse.clone() : null, damage: x.damage, part: x.part, target: x.target } : x));
          this.fxLog.push({ t: G.time, name, args: a });
          if (this.fxLog.length > 600) this.fxLog.shift();
        }
        depth++;
        try { return orig(...args); } finally { depth--; }
      };
    }
  },
  reset() { this.head = 0; this.count = 0; this.fxLog = []; this.acc = 0; this.stop(); },
  record(dt) {
    if (this.playing || !G.match || G.attract) return;
    this.acc += dt;
    if (this.acc < 1 / REPLAY_HZ) return;
    this.acc = 0;
    const fr = this.frames[this.head]; this.head = (this.head + 1) % REPLAY_LEN; this.count = Math.min(REPLAY_LEN, this.count + 1);
    fr.t = G.time; fr.n = 0;
    const add = (v) => {
      if (!v || fr.n >= RV) return;
      const o = fr.n * RF, a = fr.d, r = v.root;
      fr.views[fr.n] = v;
      a[o] = r.position.x; a[o + 1] = r.position.y; a[o + 2] = r.position.z; a[o + 3] = r.quaternion.x; a[o + 4] = r.quaternion.y; a[o + 5] = r.quaternion.z; a[o + 6] = r.quaternion.w;
      let k = o + 7;
      for (const n of PART_NAMES) { const j = v.joints[n]; a[k++] = j.position.x; a[k++] = j.position.y; a[k++] = j.position.z; a[k++] = j.quaternion.x; a[k++] = j.quaternion.y; a[k++] = j.quaternion.z; a[k++] = j.quaternion.w; }
      const m = v.curModel, wh = v.weaponHolder;
      if (m) { a[k++] = m.position.x; a[k++] = m.position.y; a[k++] = m.position.z; a[k++] = m.quaternion.x; a[k++] = m.quaternion.y; a[k++] = m.quaternion.z; a[k++] = m.quaternion.w; } else k += 7;
      // el jugador local se oculta en primera persona o con mira telescópica: en la repetición sí debe verse
      const own = v.f && v.f === G.local && (v.f.view === v || (v.f.corpse && v.f.corpse.view === v));
      a[o + 91] = (own ? (v.f.view === v ? !v.f.hidden : true) : r.visible) ? 1 : 0; a[o + 92] = wh.visible ? 1 : 0; a[o + 93] = WEAPON_IDS.indexOf(v.curWeapon); a[o + 94] = wh.parent === r ? 0 : 1; a[o + 95] = v.handGrenade.visible ? 1 : 0; a[o + 96] = v.ragdollMode || v.dead ? 1 : 0;
      fr.n++;
    };
    for (const f of G.fighters) if (f.view && !f.hidden) add(f.view);
    for (const c of Corpses.list) add(c.view);
    // mirada de cada soldado (para la cámara del asesino)
    fr.eyeN = 0;
    for (const f of G.fighters) {
      if (fr.eyeN >= 8) break;
      const o = fr.eyeN * 8, e = fr.eyes;
      fr.ids[fr.eyeN] = f.id;
      eyePosOf(f, _v1); e[o] = _v1.x; e[o + 1] = _v1.y; e[o + 2] = _v1.z; e[o + 3] = f.input.yaw; e[o + 4] = f.input.pitch; e[o + 5] = f.adsT; e[o + 6] = WEAPON_IDS.indexOf(f.weapon); e[o + 7] = f.alive ? 1 : 0;
      fr.eyeN++;
    }
  },
  snapshot(sec) {
    // por tiempo (no por cantidad): con pocos FPS se graban menos cuadros pero la duración es la misma
    const out = [], tMin = G.time - sec;
    let n = 0;
    while (n < this.count && this.frames[(this.head - n - 1 + REPLAY_LEN * 2) % REPLAY_LEN].t >= tMin) n++;
    for (let i = n; i >= 1; i--) {
      const fr = this.frames[(this.head - i + REPLAY_LEN * 2) % REPLAY_LEN];
      out.push({ t: fr.t, n: fr.n, views: fr.views.slice(0, fr.n), d: fr.d.slice(0, fr.n * RF), eyes: fr.eyes.slice(0, fr.eyeN * 8), ids: fr.ids.slice(0, fr.eyeN) });
    }
    const t0 = out.length ? out[0].t : G.time;
    return { frames: out, fx: this.fxLog.filter((e) => e.t >= t0 - 0.05) };
  },
  onKill(ev) {
    if (G.attract || !G.match || ev.victim !== G.local || !ev.killer || ev.killer === G.local || (G.mode && G.mode.story)) return;
    const killer = ev.killer, killT = G.time;
    setTimeout(() => {
      const me = G.local;
      if (!G.match || G.match.phase !== 'fight' || !me || me.alive || this.playing || G.paused) return;
      const snap = this.snapshot(CONFIG.ROUND.killcamLen);
      if (snap.frames.length < 10) return;
      this.start(snap, killer, killT, me.corpse ? me.corpse.view : null);
    }, CONFIG.ROUND.killcamDelay * 1000);
  },
  vmState: { on: false, weapon: 'rifle', adsT: 0, custom: {}, input: { yaw: 0, pitch: 0 }, vel: new THREE.Vector3(), grounded: true, alive: true, state: 'stand',
    sprinting: false, sliding: false, crouching: false, reloadT: 0, reloadTotal: 1, switchT: 0, meleeT: 0, grenadeCook: null, throwT: 0, mantle: null },
  // dos partes: 1) desde los ojos de quien te mató; 2) tu caída en cámara lenta, en tercera persona
  start(snap, killer, killT, victimView) {
    this.playing = true;
    this.play = { snap, i: 0, t: snap.frames[0].t, killer, killT, fxI: 0, cam: new THREE.Vector3(), tgt: new THREE.Vector3(), init: false, phase: 'killer', vv: victimView || null, orbit: 0 };
    for (const c of Corpses.list) c.replayDriven = true;
    // arrancar desde la cámara actual: si no hay vista del asesino ni de la víctima, nunca queda en (0,0,0)
    CAM.override = { pos: G.camera.position.clone(), target: G.camera.position.clone().add(new THREE.Vector3(0, 0, -1).applyQuaternion(G.camera.quaternion)), fov: G.settings.fov || 78 };
    this.play.wall = 0;
    this._seenJump = Input.state.jumpCount;
    BUS.emit('replayStart', killer);
  },
  stop() {
    if (!this.playing) return;
    const P = this.play;
    this.playing = false; this.play = null; CAM.override = null; this.scoped = false;
    for (const c of Corpses.list) c.replayDriven = false;
    for (const f of G.fighters) if (f.view) { f.view.root.visible = !f.hidden; f.view.joints.head.visible = true; if (f.view.body) f.view.body.visible = true; }
    for (const c of Corpses.list) { c.view.root.visible = true; c.view.weaponHolder.visible = false; c.view.handGrenade.visible = false; c.view.joints.head.visible = true; if (c.view.body) c.view.body.visible = true; }
    if (P && P.snap) for (const fr of P.snap.frames) for (const v of fr.views) if (v && v.f && v.f.view === v) { v.reset(); if (v.ragdollMode) v.onRagdoll(true); }
    BUS.emit('replayDone');
  },
  skip() { if (this.playing) this.stop(); },
  toVictim() {
    const P = this.play, fr = P.snap.frames;
    P.phase = 'victim'; P.t = Math.max(fr[0].t, P.killT - 0.35); P.i = 0; P.init = false;
    while (P.i < fr.length - 2 && fr[P.i + 1].t <= P.t) P.i++;
    // los efectos se repiten desde ese momento (disparos, sangre, polvo)
    P.fxI = 0; while (P.fxI < P.snap.fx.length && P.snap.fx[P.fxI].t < P.t) P.fxI++;
    this.vmState.on = false;
    // velocidad: que la caída dure unos 3 s aunque haya pocos cuadros grabados tras la muerte
    P.vSpeed = clamp((fr[fr.length - 1].t - P.t) / 3, 0.3, 0.6);
    // ángulo inicial: de lado respecto al asesino y con la vista más despejada (sin paredes delante)
    const vf = P.vv.f, k = P.killer, c = vf.corpse && vf.corpse.rd ? vf.corpse.rd.torsoPos(_v3) : _v3.copy(vf.pos).setY(vf.pos.y + 1);
    const base = k && vf ? Math.atan2(k.pos.x - c.x, k.pos.z - c.z) + 1.9 : 0;
    let best = base, bs = -Infinity;
    for (let i = 0; i < 12; i++) {
      const ang = base + i * Math.PI / 6, d = _v4.set(Math.sin(ang), 0.33, Math.cos(ang)).normalize();
      const h = PHYS.raycast(c, d, 4, this._hit || (this._hit = {}));
      const free = h ? h.t : 4, sc = free - Math.min(Math.abs(wrapAngle(ang - base)), 2.4) * 0.35;
      if (sc > bs) { bs = sc; best = ang; }
    }
    P.orbit = best;
    BUS.emit('replayPhase', 'victim');
  },
  victimCam(dt, a) {
    const P = this.play, o = CAM.override, vv = P.vv;
    let c;
    if (vv && a.views.indexOf(vv) >= 0 && vv.root.visible) {
      vv.root.updateMatrixWorld(true);
      c = vv.joints.chest.getWorldPosition(_v3);
      (P.lastC || (P.lastC = new THREE.Vector3())).copy(c);
    } else if (P.lastC) c = _v3.copy(P.lastC);          // la víctima no se ve en este cuadro: seguir donde estuvo
    else if (G.local) c = _v3.set(G.local.pos.x, G.local.pos.y + 1, G.local.pos.z);
    else return;
    P.orbit += dt * 0.32;
    const dist = 3.3, want = _v4.set(c.x + Math.sin(P.orbit) * dist, c.y + 1.15, c.z + Math.cos(P.orbit) * dist);
    // que la pared no se interponga
    const d = _v5.copy(want).sub(c), L = d.length(); d.multiplyScalar(1 / (L || 1));
    const h = PHYS.raycast(c, d, L + 0.2, this._hit || (this._hit = {}));
    if (h) want.copy(c).addScaledVector(d, Math.max(0.7, h.t - 0.25));
    if (!P.init) { P.cam.copy(want); P.tgt.copy(c); P.init = true; }
    P.cam.lerp(want, 1 - Math.exp(-4 * dt)); P.tgt.lerp(c, 1 - Math.exp(-6 * dt));
    o.pos.copy(P.cam); o.target.copy(P.tgt); o.fov = 58;
  },
  update(dt) {
    const P = this.play; if (!P) return;
    if (Input.state.jumpCount !== this._seenJump) { this._seenJump = Input.state.jumpCount; this.stop(); return; }
    // vigilante: una repetición nunca debe durar más que su grabación (si se atasca, volver al juego)
    P.wall = (P.wall || 0) + dt;
    if (P.wall > CONFIG.ROUND.killcamLen * 3 + 4) { this.stop(); return; }
    const fr = P.snap.frames;
    if (P.phase === 'killer') {
      // cámara lenta alrededor del momento de la baja
      const near = Math.abs(P.t - P.killT) < 0.25;
      P.t += dt * (near ? 0.35 : 1);
      // terminado el disparo: segunda parte, tu caída
      if (P.t >= P.killT + 0.25 && P.vv && fr.some((f) => f.views.includes(P.vv))) this.toVictim();
    } else P.t += dt * (P.vSpeed || 0.55);
    while (P.i < fr.length - 2 && fr[P.i + 1].t <= P.t) P.i++;
    if (P.t >= fr[fr.length - 1].t) { this.stop(); return; }
    const a = fr[P.i], b = fr[P.i + 1] || a, k = clamp((P.t - a.t) / Math.max(1e-4, b.t - a.t), 0, 1);
    // ocultar todo y mostrar solo lo grabado
    for (const f of G.fighters) if (f.view) f.view.root.visible = false;
    for (const c of Corpses.list) c.view.root.visible = false;
    for (let j = 0; j < a.n; j++) {
      const v = a.views[j]; if (!v || !v.root) continue;
      const jb = b.views.indexOf(v);
      let A = a.d, B = jb >= 0 ? b.d : a.d, oa = j * RF, ob = jb >= 0 ? jb * RF : oa;
      // de pie ↔ ragdoll: las poses están en espacios distintos (local vs mundo); no se mezclan
      if (A[oa + 96] !== B[ob + 96]) { if (k < 0.5) { B = A; ob = oa; } else { A = B; oa = ob; } }
      const r = v.root;
      r.visible = A[oa + 91] > 0.5;
      r.position.set(lerp(A[oa], B[ob], k), lerp(A[oa + 1], B[ob + 1], k), lerp(A[oa + 2], B[ob + 2], k));
      _q1.set(A[oa + 3], A[oa + 4], A[oa + 5], A[oa + 6]); _q2.set(B[ob + 3], B[ob + 4], B[ob + 5], B[ob + 6]); r.quaternion.copy(_q1.slerp(_q2, k));
      let ka = oa + 7, kb = ob + 7;
      for (const n of PART_NAMES) {
        const jn = v.joints[n];
        jn.position.set(lerp(A[ka], B[kb], k), lerp(A[ka + 1], B[kb + 1], k), lerp(A[ka + 2], B[kb + 2], k));
        _q1.set(A[ka + 3], A[ka + 4], A[ka + 5], A[ka + 6]); _q2.set(B[kb + 3], B[kb + 4], B[kb + 5], B[kb + 6]); jn.quaternion.copy(_q1.slerp(_q2, k));
        ka += 7; kb += 7;
      }
      // arma
      const wid = WEAPON_IDS[A[oa + 93] | 0];
      if (wid && v.curWeapon !== wid) v.setWeapon(wid);
      const inHand = A[oa + 94] > 0.5;
      if (inHand && v.weaponHolder.parent !== v.joints.foreArmR) { v.joints.foreArmR.add(v.weaponHolder); v.weaponHolder.position.set(0, -0.27, -0.01); v.weaponHolder.rotation.set(-Math.PI / 2, 0, 0); }
      if (!inHand && v.weaponHolder.parent !== r) { r.add(v.weaponHolder); v.weaponHolder.position.set(0, 0, 0); v.weaponHolder.quaternion.identity(); }
      v.weaponHolder.visible = A[oa + 92] > 0.5; v.handGrenade.visible = A[oa + 95] > 0.5;
      const m = v.curModel;
      if (m && !inHand) { m.position.set(lerp(A[ka], B[kb], k), lerp(A[ka + 1], B[kb + 1], k), lerp(A[ka + 2], B[kb + 2], k)); _q1.set(A[ka + 3], A[ka + 4], A[ka + 5], A[ka + 6]); _q2.set(B[kb + 3], B[kb + 4], B[kb + 5], B[kb + 6]); m.quaternion.copy(_q1.slerp(_q2, k)); }
      else if (m) { m.position.set(0, 0, 0); m.quaternion.identity(); }
      v.joints.head.visible = true; if (v.body) v.body.visible = true;
    }
    // efectos
    const fx = P.snap.fx;
    while (P.fxI < fx.length && fx[P.fxI].t <= P.t) {
      const e = fx[P.fxI++];
      try {
        // disparos del asesino: retroceso y fogonazo en su arma de primera persona
        if (e.name === 'muzzle' && VM.active && VM.replay && P.lastEye && e.args[0].distanceTo(P.lastEye) < 1.4) { VM.kick(this.vmState.weapon); FX.flashLight(e.args[0], 0xffc070, 2.2, 9, 0.06); continue; }
        FX['_orig_' + e.name](...e.args);
      } catch (err) { }
    }
    // cámara: los ojos del asesino (o tu cuerpo en la segunda parte)
    const id = P.killer.id, ia = Array.prototype.indexOf.call(a.ids, id), ib = Array.prototype.indexOf.call(b.ids, id);
    if (P.phase === 'victim' || ia < 0) { this.vmState.on = false; this.scoped = false; this.victimCam(dt, a); return; }
    if (ia >= 0) {
      const E = a.eyes, F = ib >= 0 ? b.eyes : a.eyes, oa = ia * 8, ob = (ib >= 0 ? ib : ia) * 8;
      const yaw = E[oa + 3] + wrapAngle(F[ob + 3] - E[oa + 3]) * k, pitch = lerp(E[oa + 4], F[ob + 4], k);
      _v1.set(lerp(E[oa], F[ob], k), lerp(E[oa + 1], F[ob + 1], k), lerp(E[oa + 2], F[ob + 2], k));
      const fwd = dirFromYawPitch(yaw, pitch, _v2);
      const o = CAM.override;
      o.pos.copy(_v1).addScaledVector(fwd, 0.12);
      o.target.copy(o.pos).add(fwd);
      const W = P.killer.wstat ? P.killer.wstat(WEAPON_IDS[E[oa + 6] | 0] || 'rifle') : CONFIG.WEAPONS.rifle;
      const ads = smooth01(lerp(E[oa + 5], F[ob + 5], k));
      // con mira telescópica: la vista de la mira (sin el modelo del arma pegado a la cara)
      const scoped = !!W.scope && ads > 0.85; this.scoped = scoped;
      o.fov = zoomFov(G.settings.fov || 78, scoped ? (W.zoom || 4) : lerp(1, Math.min(W.zoom || 1, 2.2), ads));
      // ocultar el cuerpo del asesino: se ven sus manos y su arma en primera persona
      for (let j = 0; j < a.n; j++) { const v = a.views[j]; if (v && v.f === P.killer && v.f.view === v) v.root.visible = false; }
      const vs = this.vmState;
      vs.on = E[oa + 7] > 0.5 && !scoped; vs.weapon = WEAPON_IDS[E[oa + 6] | 0] || 'rifle'; vs.adsT = ads; vs.custom = P.killer.custom || {};
      vs.att = vs.att || {}; vs.att[vs.weapon] = P.killer.attFor ? P.killer.attFor(vs.weapon) : null;
      vs.input.yaw = yaw; vs.input.pitch = pitch;
      if (P.lastEye) { vs.vel.set((_v1.x - P.lastEye.x) / Math.max(1e-3, P.dtEye), 0, (_v1.z - P.lastEye.z) / Math.max(1e-3, P.dtEye)); if (vs.vel.lengthSq() > 100) vs.vel.set(0, 0, 0); }
      P.lastEye = (P.lastEye || new THREE.Vector3()).copy(_v1); P.dtEye = dt;
    } else this.vmState.on = false;
  },
};

