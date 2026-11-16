// ---- 05_camera.js ----
// =====================================================================
// CAMARA — tercera persona sobre el hombro (cambio de hombro suave), primera
// persona, mira con zoom, cámara de derribo, espectador y cámara de menú
// =====================================================================
function eyeHeight(f) {
  const C = CONFIG.CAMERA;
  let h = f.sliding ? C.slideEye : f.mantle ? C.firstEye * 0.82 : f.crouching ? C.crouchEye : C.firstEye;
  if (f.proneT > 0) h = lerp(h, C.proneEye, smooth01(f.proneT));
  return h;
}
// posición de los ojos: tumbado van adelante del centro; al asomarse, de lado
function eyePosOf(f, out, yaw = f.yaw) {
  const pk = f.proneT > 0 ? smooth01(f.proneT) * CONFIG.CAMERA.proneFwd : 0, lo = f.leanOff || 0;
  const sy = Math.sin(yaw), cy = Math.cos(yaw);
  return out.set(f.pos.x - sy * pk + cy * lo, f.pos.y + eyeHeight(f), f.pos.z - cy * pk - sy * lo);
}
function zoomFov(fov, zoom) { return (2 * Math.atan(Math.tan((fov * Math.PI) / 360) / Math.max(1, zoom)) * 180) / Math.PI; }

const CAM = {
  mode: 'third', shoulder: 1, shoulderT: 1, aimT: 0,
  shake: 0, punch: 0, punchYaw: 0, roll: 0, dip: 0, bob: 0,
  fov: 78, eyeH: 1.63, spK: 0, slK: 0, latV: 0,
  pivot: new THREE.Vector3(), pivotInit: false,
  dist: 2.9,
  localPos: new THREE.Vector3(), localTarget: new THREE.Vector3(),
  override: null,           // {pos, target, fov} para killcam/repetición/menú
  _goodPos: new THREE.Vector3(0, 2, 0), _goodTgt: new THREE.Vector3(0, 2, -1),   // última cámara válida (red de seguridad)
  spectate: null, specT: 0, specMode: 0, specPos: new THREE.Vector3(), specTgt: new THREE.Vector3(), specInit: false,
  fpHideFor: null, isFP: false, scoped: false,
  _ray: { origin: new THREE.Vector3(), dir: new THREE.Vector3() },
  _hit: {},

  // ---- rayo de mira (misma fórmula en 1ª y 3ª persona) ----
  aimOriginFor(f, yaw, pitch, out) {
    const fwd = dirFromYawPitch(yaw, pitch, _v1);
    const eh = eyeHeight(f);
    if (this.mode === 'first' || f.kind !== 'local' || this.scoped) return eyePosOf(f, out, yaw);
    const C = CONFIG.CAMERA;
    const side = lerp(C.thirdRight, C.aimRight, this.aimT) * this.shoulderT;
    const rx = Math.cos(yaw), rz = -Math.sin(yaw);
    const upx = -rz * fwd.y, upy = rz * fwd.x - rx * fwd.z, upz = rx * fwd.y;
    const py = f.pos.y + C.pivotHeight * (eh / C.firstEye);
    const up = C.thirdUp, lo = f.leanOff || 0, pf = f.proneT > 0 ? smooth01(f.proneT) * C.proneFwd * 0.6 : 0;
    const bx = f.pos.x + rx * lo - Math.sin(yaw) * pf, bz = f.pos.z + rz * lo - Math.cos(yaw) * pf;
    out.set(bx + rx * side + upx * up, py + upy * up, bz + rz * side + upz * up);
    // no dejar que el origen del rayo quede dentro de una pared
    const P = this._tA.set(bx, py, bz), d = this._tB.copy(out).sub(P), Ln = d.length();
    if (Ln > 1e-4) {
      d.multiplyScalar(1 / Ln);
      const h = PHYS.raycast(P, d, Ln + 0.1, this._hit2);
      if (h) out.copy(P).addScaledVector(d, Math.max(0, h.t - 0.12));
    }
    return out;
  },
  _tA: new THREE.Vector3(), _tB: new THREE.Vector3(), _hit2: {},
  aimRay(f) {
    const r = this._ray;
    const yaw = f.input.yaw, pitch = f.input.pitch;
    this.aimOriginFor(f, yaw, pitch, r.origin);
    dirFromYawPitch(yaw, pitch, r.dir);
    return r;
  },

  addShake(a) { this.shake = Math.min(1.2, this.shake + a); },
  toggleMode() { this.mode = this.mode === 'third' ? 'first' : 'third'; G.settings.cam = this.mode; saveSettings(); BUS.emit('camMode', this.mode); },
  swapShoulder() { this.shoulder = -this.shoulder; G.settings.shoulder = this.shoulder; saveSettings(); BUS.emit('shoulder', this.shoulder); },

  update(dt, alpha) {
    const C = CONFIG.CAMERA, cam = G.camera;
    this.shake = Math.max(0, this.shake - dt * C.shakeDecay * (0.4 + this.shake));
    this.punch = damp(this.punch, 0, 12, dt); this.punchYaw = damp(this.punchYaw, 0, 12, dt);
    spring(this, 'dip', 0, 190, 15, dt);   // la caída y el salto rebotan en vez de volver sin más
    // asomarse en 3ª persona lleva la cámara al hombro de ese lado
    const lf = G.local && G.local.alive ? G.local.lean : 0;
    this.shoulderT = damp(this.shoulderT, Math.abs(lf) > 0.3 ? Math.sign(lf) : this.shoulder, C.shoulderSpeed, dt);
    let fovTarget = G.settings.fov || C.fov;
    const f = G.local;
    let pos = this.localPos, tgt = this.localTarget, rollTarget = 0;
    let usedFP = false;
    this.scoped = false;

    if (this.override) {
      pos.copy(this.override.pos); tgt.copy(this.override.target);
      if (this.override.fov) fovTarget = this.override.fov;
      G.aimZoomSens = 1;
    } else if (f && f.alive && f.view) {
      const W = f.wstat();
      this.aimT = f.adsT;
      const scoped = !!W.scope && this.aimT > 0.85 && f.state === 'stand';
      this.scoped = scoped;
      const zoom = lerp(1, W.zoom || 1, smooth01(this.aimT));
      G.aimZoomSens = lerp(1, (G.settings.adsSens || 0.8) / Math.max(1, W.zoom || 1) * (W.scope ? 1.15 : 1.35), smooth01(this.aimT));
      fovTarget = zoomFov(fovTarget, zoom);
      this.spK = damp(this.spK || 0, f.sprinting ? 1 : 0, 5, dt); this.slK = damp(this.slK || 0, f.sliding ? 1 : 0, 7, dt);
      fovTarget += C.sprintFov * this.spK + 4 * this.slK;
      const yaw = f.input.yaw + this.punchYaw, pitch = f.input.pitch + this.punch;
      const fwd = dirFromYawPitch(yaw, pitch, _v1);
      const rp = f.view.renderPos;
      this.eyeH = damp(this.eyeH, eyeHeight(f), 14, dt);
      const ragdoll = f.state === 'ragdoll' || f.state === 'getup';
      const hs = Math.hypot(f.vel.x, f.vel.z);
      if ((this.mode === 'first' || scoped) && !ragdoll) {
        usedFP = true;
        // balanceo de la cabeza al caminar
        if (f.grounded && hs > 0.5) this.bob += dt * hs * (f.sprinting ? 1.25 : 1.45); else this.bob = damp(this.bob, Math.round(this.bob / Math.PI) * Math.PI, 6, dt);
        const bobA = (f.grounded ? Math.min(1, hs / 6) : 0) * (1 - this.aimT * 0.85) * (f.sprinting ? 1.6 : 1);
        const right = _v2.set(Math.cos(yaw), 0, -Math.sin(yaw));
        const pk = f.proneT > 0 ? smooth01(f.proneT) * C.proneFwd : 0;
        this.pivot.set(rp.x - Math.sin(f.yaw) * pk, rp.y + this.eyeH - f.stepSmooth - this.dip + Math.abs(Math.sin(this.bob)) * 0.04 * bobA, rp.z - Math.cos(f.yaw) * pk)
          .addScaledVector(right, Math.sin(this.bob) * 0.025 * bobA + (f.leanOff || 0));
        rollTarget -= (f.lean || 0) * C.leanRoll;
        pos.copy(this.pivot);
        tgt.copy(pos).add(fwd);
        if (f.sliding) rollTarget += 0.06;
        // al moverse de lado la cámara se inclina un poco hacia ese lado
        this.latV = damp(this.latV || 0, (f.vel.x * Math.cos(yaw) - f.vel.z * Math.sin(yaw)) * f.grounded, 9, dt);
        rollTarget -= clamp(this.latV * 0.0045, -0.03, 0.03) * (1 - this.aimT * 0.7);
        rollTarget += Math.sin(this.bob) * 0.006 * bobA;
        this.pivotInit = true;
      } else if (ragdoll && f.ragdoll && this.mode === 'first') {
        usedFP = true;
        const hp = f.ragdoll.headPos(_v2);
        this.pivot.lerp(hp, 1 - Math.exp(-10 * dt));
        pos.copy(this.pivot);
        tgt.copy(pos).add(fwd);
      } else {
        if (ragdoll && f.ragdoll) {
          const tp = f.ragdoll.torsoPos(_v2); tp.y += 0.5;
          if (!this.pivotInit) { this.pivot.copy(tp); this.pivotInit = true; }
          this.pivot.lerp(tp, 1 - Math.exp(-C.ragdollFollow * dt));
        } else {
          const lo = f.leanOff || 0, pf = f.proneT > 0 ? smooth01(f.proneT) * C.proneFwd * 0.6 : 0;
          _v2.set(rp.x + Math.cos(f.yaw) * lo - Math.sin(f.yaw) * pf, rp.y + C.pivotHeight * (this.eyeH / C.firstEye) - f.stepSmooth - this.dip, rp.z - Math.sin(f.yaw) * lo - Math.cos(f.yaw) * pf);
          if (!this.pivotInit) { this.pivot.copy(_v2); this.pivotInit = true; }
          this.pivot.x = _v2.x; this.pivot.z = _v2.z;
          this.pivot.y = damp(this.pivot.y, _v2.y, 22, dt);
        }
        const side = lerp(C.thirdRight, C.aimRight, this.aimT) * this.shoulderT;
        const back = lerp(C.thirdBack, C.aimBack, smooth01(this.aimT)) * (ragdoll ? 1.3 : 1) + (f.sprinting ? 0.25 : 0);
        const up = C.thirdUp;
        const rx = Math.cos(yaw), rz = -Math.sin(yaw);
        const upx = -rz * fwd.y, upy = rz * fwd.x - rx * fwd.z, upz = rx * fwd.y;
        // punto al hombro (con colisión lateral)
        _v3.set(this.pivot.x + rx * side + upx * up, this.pivot.y + upy * up, this.pivot.z + rz * side + upz * up);
        _v4.copy(_v3).sub(this.pivot); let sl = _v4.length(); _v4.multiplyScalar(1 / (sl || 1));
        const hs1 = PHYS.raycast(this.pivot, _v4, sl + C.collideRadius, this._hit);
        if (hs1) { sl = Math.max(0, hs1.t - C.collideRadius); _v3.copy(this.pivot).addScaledVector(_v4, sl); }
        // hacia atrás
        _v5.copy(fwd).multiplyScalar(-1);
        let want = back;
        const hb = PHYS.raycast(_v3, _v5, back + C.collideRadius, this._hit);
        if (hb) want = Math.max(0.3, hb.t - C.collideRadius);
        this.dist = want < this.dist ? want : damp(this.dist, want, 7, dt);
        pos.copy(_v3).addScaledVector(_v5, this.dist);
        tgt.copy(_v3).add(fwd);
        if (this.dist < 0.75) this.fpHideFor = f;
      }
    } else {
      this.updateSpectator(dt, pos, tgt);
      G.aimZoomSens = 1;
    }

    // sacudida
    if (this.shake > 0.001) {
      const a = this.shake * 0.1;
      pos.x += (FX_RNG.next() - 0.5) * a; pos.y += (FX_RNG.next() - 0.5) * a; pos.z += (FX_RNG.next() - 0.5) * a;
    }
    this.roll = damp(this.roll, rollTarget, 8, dt);
    this.fov = damp(this.fov, fovTarget, this.aimT > 0.01 ? 18 : 10, dt);
    if (Math.abs(cam.fov - this.fov) > 0.01) { cam.fov = this.fov; cam.updateProjectionMatrix(); }
    // un NaN en pivote/espectador/física nunca se recupera solo y deja la pantalla negra: restablecer
    if (!Number.isFinite(pos.x + pos.y + pos.z + tgt.x + tgt.y + tgt.z + this.fov + this.roll)) {
      console.warn('Cámara con valores inválidos: se restablece');
      this.pivotInit = false; this.specInit = false; this.dist = C.thirdBack; this.eyeH = C.firstEye; this.roll = 0; this.bob = 0;
      this.shake = 0; this.punch = 0; this.punchYaw = 0; this.dip = 0; this.fov = G.settings.fov || C.fov;
      this.pivot.copy(this._goodPos); this.specPos.copy(this._goodPos); this.specTgt.copy(this._goodTgt);
      pos.copy(this._goodPos); tgt.copy(this._goodTgt);
      cam.fov = this.fov; cam.updateProjectionMatrix();
    } else { this._goodPos.copy(pos); this._goodTgt.copy(tgt); }
    if (pos.distanceToSquared(tgt) < 1e-8) tgt.z -= 1;   // lookAt con el mismo punto deja la cámara degenerada
    cam.position.copy(pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(tgt);
    if (this.roll) cam.rotateZ(this.roll);
    this.isFP = usedFP;
  },

  // espectador: cámara de persecución sobre un compañero (o cinematográfica en el menú)
  updateSpectator(dt, pos, tgt) {
    this.specT -= dt;
    const me = G.local;
    let pool = G.fighters.filter((x) => x.alive && x.view && !x.hidden);
    if (me && G.mode && G.mode.teams) { const mates = pool.filter((x) => x.team === me.team); if (mates.length) pool = mates; }
    // al morir: primero mirar el propio cuerpo un momento
    if (me && !me.alive && me.ragdoll && G.time - (me.deathTime || 0) < 1.6 && !G.attract) {
      const c = me.ragdoll.torsoPos(_v2);
      if (!this.specInit) { this.specPos.set(c.x + 2, c.y + 3, c.z + 2); this.specInit = true; }
      _v3.set(c.x + Math.sin(G.time * 0.3) * 3.2, c.y + 2.6, c.z + Math.cos(G.time * 0.3) * 3.2);
      this.specPos.lerp(_v3, 1 - Math.exp(-3 * dt)); this.specTgt.lerp(c, 1 - Math.exp(-6 * dt));
      pos.copy(this.specPos); tgt.copy(this.specTgt);
      return;
    }
    if (!this.spectate || !this.spectate.alive || !pool.includes(this.spectate) || this.specT <= 0) {
      if (pool.length) this.spectate = G.attract ? FX_RNG.pick(pool) : (pool.find((x) => x !== this.spectate) || pool[0]);
      this.specT = G.attract ? frand(6, 9) : 9999;
      if (G.attract) this.specMode = FX_RNG.next() < 0.65 ? 0 : 1;
    }
    const t = this.spectate;
    if (!t) { pos.set(30, 22, 30); tgt.set(0, 0, 0); return; }
    const rp = t.state === 'ragdoll' && t.ragdoll ? t.ragdoll.torsoPos(_v2) : _v2.copy(t.view.renderPos);
    if (this.specMode === 1 && G.attract) {
      // órbita alta y lenta
      const a = G.realTime * 0.08;
      _v3.set(rp.x + Math.sin(a) * 16, rp.y + 9, rp.z + Math.cos(a) * 16);
      _v4.set(rp.x, rp.y + 1, rp.z);
    } else {
      // persecución sobre el hombro
      const yaw = t.input.yaw, fwd = dirFromYawPitch(yaw, clamp(t.input.pitch, -0.5, 0.4) * 0.6, _v5);
      const rx = Math.cos(yaw), rz = -Math.sin(yaw);
      _v4.set(rp.x + rx * 0.5, rp.y + 1.6, rp.z + rz * 0.5);
      let back = 3.4;
      _v6.copy(fwd).multiplyScalar(-1);
      const hb = PHYS.raycast(_v4, _v6, back + 0.2, this._hit); if (hb) back = Math.max(0.6, hb.t - 0.2);
      _v3.copy(_v4).addScaledVector(_v6, back).setY(_v4.y + 0.25);
      _v4.addScaledVector(fwd, 6);
    }
    if (!this.specInit || this.specPos.distanceTo(_v3) > 30) { this.specPos.copy(_v3); this.specTgt.copy(_v4); this.specInit = true; }
    this.specPos.lerp(_v3, 1 - Math.exp(-5 * dt)); this.specTgt.lerp(_v4, 1 - Math.exp(-7 * dt));
    pos.copy(this.specPos); tgt.copy(this.specTgt);
    this.specCenter = rp;
  },
  cycleSpectate() {
    const me = G.local;
    let pool = G.fighters.filter((x) => x.alive && x.view && !x.hidden);
    if (me && G.mode && G.mode.teams) { const mates = pool.filter((x) => x.team === me.team); if (mates.length) pool = mates; }
    if (!pool.length) return;
    const i = pool.indexOf(this.spectate);
    this.spectate = pool[(i + 1) % pool.length];
  },
};
function aimRay(f) {
  if (f.kind === 'local') return CAM.aimRay(f);
  const r = f._aimRay || (f._aimRay = { origin: new THREE.Vector3(), dir: new THREE.Vector3() });
  eyePosOf(f, r.origin, f.input.yaw);
  dirFromYawPitch(f.input.yaw, f.input.pitch, r.dir);
  return r;
}

