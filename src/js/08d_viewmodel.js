// ---- 08d_viewmodel.js ----
// =====================================================================
// PRIMERA PERSONA — arma y manos propias en una escena aparte con su
// propia cámara: se dibujan encima del mundo (nunca atraviesan paredes)
// y al apuntar la mira queda exactamente en el centro de la pantalla
// =====================================================================
// hip: posición de la empuñadura a la cadera (espacio de cámara, -Z adelante)
// adsZ: distancia de la empuñadura al ojo al apuntar; sy: altura de la línea de mira
const VM_POSE = {
  rifle: { hip: [0.14, -0.16, -0.45], adsZ: 0.37, kick: 0.06, rot: 0.1 },
  smg: { hip: [0.14, -0.15, -0.34], adsZ: 0.33, kick: 0.03, rot: 0.045 },
  shotgun: { hip: [0.15, -0.165, -0.4], adsZ: 0.37, kick: 0.07, rot: 0.13 },
  sniper: { hip: [0.16, -0.17, -0.4], adsZ: 0.16, kick: 0.08, rot: 0.14 },
  pistol: { hip: [0.13, -0.13, -0.42], adsZ: 0.42, kick: 0.03, rot: 0.11 },
  rocket: { hip: [0.2, -0.19, -0.02], ads: [0.07, -0.185, -0.17], kick: 0.05, rot: 0.05 },
  // 3.1.0: fusiles de época con culata larga (la mano derecha va en la garganta, más atrás que en una empuñadura de pistola)
  dmr: { hip: [0.14, -0.16, -0.45], adsZ: 0.37, kick: 0.06, rot: 0.1 }, battle: { hip: [0.15, -0.165, -0.4], adsZ: 0.37, kick: 0.05, rot: 0.08 },
  mk2: { hip: [0.16, -0.17, -0.4], adsZ: 0.16, kick: 0.08, rot: 0.14 }, mg2: { hip: [0.15, -0.17, -0.4], adsZ: 0.37, kick: 0.04, rot: 0.06 },
  dbl: { hip: [0.14, -0.16, -0.45], adsZ: 0.37, kick: 0.07, rot: 0.13 }, tsmg: { hip: [0.14, -0.15, -0.34], adsZ: 0.33, kick: 0.028, rot: 0.04 },
  hp45: { hip: [0.13, -0.13, -0.42], adsZ: 0.42, kick: 0.03, rot: 0.11 }, magnum: { hip: [0.13, -0.13, -0.42], adsZ: 0.42, kick: 0.05, rot: 0.16 },
  knife: { hip: [0.16, -0.15, -0.36], kick: 0, rot: 0 },
};
const _vmV3 = new THREE.Vector3(), _vmV = new THREE.Vector3(), _vmV2 = new THREE.Vector3(), _vmQ = new THREE.Quaternion(), _vmQ2 = new THREE.Quaternion(), _vmE = new THREE.Euler(0, 0, 0, 'YXZ');
const GRIP_CURL = [1.15, 1.55, 1.7], _vmBasisCup = new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0)), _vmQcup = new THREE.Quaternion().setFromRotationMatrix(_vmBasisCup);
const _vmWhite = new THREE.Color(), _vmPouch = new THREE.Vector3(-0.17, -0.2, -0.5), _vmZ = new THREE.Vector3(0, 0, 1), _vmGripDef = { y: -0.03, z: 0.03, tilt: -0.26, w: 0.034 }, _vmEject = new THREE.Vector3(0.03, 0.09, -0.06);
// guante táctico de primera persona (2.11.3): palma acolchada, placa de nudillos, cuatro dedos de tres falanges curvadas hacia el arma, pulgar de dos y muñequera con tira.
// Marco de la mano: dedos hacia -Z, pulgar hacia +Y, palma mirando a -X en la mano derecha (sd = 1); la izquierda es el espejo.
function gloveHandGeo(sd, base, o = {}) {
  const B = new PartBatch(), V = THREE.Vector3, Q = new THREE.Quaternion(), E = new THREE.Euler(), UP = new V(0, 1, 0);
  // o.bare: mano desnuda (ropa civil de la Cárcel): piel sin protector de nudillos ni muñequera
  const bare = !!o.bare, leather = bare ? shade(base, -0.08) : shade(base, -0.28), body = base, tip = bare ? shade(base, 0.06) : shade(base, -0.16), guard = bare ? shade(base, -0.1) : shade(base, -0.5), strap = shade(base, -0.55), seam = shade(base, -0.38);
  // hueso redondeado de p0 a p1 (radio r0→r1) con esfera en la articulación: las falanges quedan unidas sin huecos
  const bone = (p0, p1, r0, r1, color) => {
    const d = p1.clone().sub(p0), len = d.length(), c = p0.clone().add(p1).multiplyScalar(0.5);
    Q.setFromUnitVectors(UP, d.normalize()); E.setFromQuaternion(Q, 'XYZ');
    B.add(GEO.cyl(r1, r0, len, 14), sd * c.x, c.y, c.z, color, { rx: E.x, ry: sd * E.y, rz: sd * E.z });
    B.add(GEO.sphere(r1, 14, 10), sd * p1.x, p1.y, p1.z, color);
    return p1;
  };
  const box = (w, h, d, x, y, z, color, r = 0.006) => B.add(GEO.rbox(w, h, d, r), sd * x, y, z, color);
  // palma (cuero) con dorso acolchado y protector rígido de nudillos
  box(0.024, 0.084, 0.076, -0.003, 0, 0.002, leather, 0.011); box(0.009, 0.078, 0.064, 0.0105, 0, 0.006, body, 0.0045);
  if (!bare) box(0.01, 0.082, 0.016, 0.0145, 0, -0.033, guard, 0.0045);
  for (const y of [0.032, 0.0107, -0.0107, -0.032]) B.add(GEO.sphere(bare ? 0.0105 : 0.0095, 12, 8), sd * (bare ? 0.009 : 0.015), y, -0.046, guard);
  // dedos: índice a meñique (de arriba abajo); tres falanges que se doblan hacia la palma (−X)
  const dir = (a) => new V(-Math.sin(a), 0, -Math.cos(a));
  const A = o.a || [0.15, 0.95, 1.65];
  const fingers = [[0.032, 0.92, 0.0112], [0.0107, 1.0, 0.0116], [-0.0107, 0.93, 0.011], [-0.032, 0.74, 0.01]];
  for (const [y, k, r] of fingers) {
    let p = new V(0.001, y, -0.045);
    p = bone(p, p.clone().addScaledVector(dir(A[0]), 0.036 * k), r, r * 0.95, body);
    p = bone(p, p.clone().addScaledVector(dir(A[1]), 0.026 * k), r * 0.95, r * 0.9, body);
    bone(p, p.clone().addScaledVector(dir(A[2]), 0.022 * k), r * 0.9, r * 0.82, tip);
    // costura en la articulación
  }
  // pulgar: metacarpiano desde la base de la palma + dos falanges
  { let p = new V(-0.008, 0.034, 0.022); p = bone(p, p.clone().add(new V(-0.01, 0.012, -0.02)), 0.0145, 0.0135, leather);
    p = bone(p, p.clone().add(new V(-0.016, 0.006, -0.02)), 0.0132, 0.0122, body); bone(p, p.clone().add(new V(-0.018, 0.0, -0.012)), 0.0122, 0.0112, tip); }
  // muñequera con tira (desnuda: solo la muñeca)
  if (bare) B.add(GEO.cyl(0.031, 0.035, 0.05, 16), 0, 0, 0.07, body, { rx: Math.PI / 2 });
  else { B.add(GEO.cyl(0.037, 0.04, 0.036, 16), 0, 0, 0.07, leather, { rx: Math.PI / 2 }); box(0.026, 0.058, 0.022, 0.034, 0, 0.066, strap, 0.006); box(0.01, 0.07, 0.01, 0.0, 0, 0.052, seam, 0.004); }
  return B.build();
}
// muñeca de la mano (z local, antes de escalar) y punto de la manga donde encaja con ella
const VM_WRIST = HAND_WRIST, VM_WRIST_ARM = 0.062;
const VM = {
  active: false, inited: false, models: {}, fits: {}, cur: null, curId: null, armKey: '',
  kz: 0, krx: 0, kry: 0, krz: 0, land: 0, latK: 0, vyK: 0, swayX: 0, swayY: 0, lastYaw: null, lastPitch: 0,
  sprintK: 0, reloadK: 0, hideK: 0, shadeK: 1, skyK: 1, shadeT: 0, flashT: 0, baseFov: 54,
  init() {
    const S = this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(this.baseFov, 1, 0.01, 30);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.1); S.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 1.5); S.add(this.sun);
    this.flashL = new THREE.PointLight(0xffc070, 0, 3, 2); S.add(this.flashL);
    this.amb = new THREE.AmbientLight(0xffffff, 0.35); S.add(this.amb);
    this.rig = new THREE.Group(); S.add(this.rig);
    // manos y antebrazos (se construyen con el camuflaje del jugador)
    this.handR = new THREE.Group(); this.handL = new THREE.Group(); this.armR = new THREE.Group(); this.armL = new THREE.Group();
    this.rig.add(this.handR, this.handL, this.armR, this.armL);
    this.nade = buildHandGrenade(); this.nade.scale.setScalar(0.72); this.rig.add(this.nade);
    this.props = buildReloadProps(); this.rig.add(this.props.clip, this.props.shells);   // 3.2.2: peine y cartuchos en la mano al recargar
    // fogonazo propio
    const fc = document.createElement('canvas'); fc.width = fc.height = 64; const x = fc.getContext('2d');
    const g = x.createRadialGradient(32, 32, 1, 32, 32, 30); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(0.25, 'rgba(255,200,110,0.9)'); g.addColorStop(1, 'rgba(255,140,40,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,220,150,0.8)';
    for (let i = 0; i < 4; i++) { x.save(); x.translate(32, 32); x.rotate(i * Math.PI / 4); x.fillRect(-30, -1.5, 60, 3); x.restore(); }
    const tex = new THREE.CanvasTexture(fc); tex.colorSpace = THREE.SRGBColorSpace;
    this.flash = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.flash.visible = false; this.rig.add(this.flash);
    BUS.on('fire', (f, shot) => { if (f === G.local) this.onFire(shot); });
    this.inited = true;
  },
  resize(aspect) { if (this.cam) { this.cam.aspect = aspect; this.cam.updateProjectionMatrix(); } },
  buildArms(c) {
    const civ = !!(c.outfit && OUTFITS[c.camo]), camo = CAMOS[c.camo] || civ ? c.camo : 'woodland', key = camo + '|' + (c.skin | 0) + '|' + (c.outfit || '');
    if (key === this.armKey) return; this.armKey = key;
    for (const grp of [this.handR, this.handL, this.armR, this.armL]) for (const m of [...grp.children]) { grp.remove(m); m.traverse((q) => { if (q.geometry) q.geometry.dispose(); }); }
    if (civ) { this.buildCivArms(c, camo); return; }
    const mat = MAT.soldier(camo), skin = SKINS[(c.skin | 0) % SKINS.length];
    // 3.1.0: manga de paño con puño abotonado y la muñeca desnuda (nada de guantes tácticos en 1940)
    // 3.2.2: el puño llega casi hasta la muñeca (antes quedaban seis centímetros de antebrazo desnudo que, de cerca, parecían un bloque)
    const sleeve = () => new PartBatch().add(GEO.cyl(0.047, 0.041, 0.6, 16), 0, 0, 0.385, 0, { rx: Math.PI / 2, camo: true })
      .add(GEO.cyl(0.043, 0.042, 0.04, 16), 0, 0, 0.093, 0, { rx: Math.PI / 2, camo: true }).add(GEO.box(0.012, 0.012, 0.006), 0.029, 0.029, 0.09, 0x6a5a3a)
      .add(GEO.cyl(0.03, 0.034, 0.06, 14), 0, 0, 0.065, skin, { rx: Math.PI / 2 }).build();
    if (!this.gloveMat) this.gloveMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x24221a });
    this.armR.add(new THREE.Mesh(sleeve(), mat)); this.armL.add(new THREE.Mesh(sleeve(), mat));
    for (const [grp, sd] of [[this.handR, 1], [this.handL, -1]]) {   // [0] abierta (granada, trepar) · [1] cerrada sobre la empuñadura
      grp.add(buildArtHand(sd, skin, this.gloveMat)); grp.scale.setScalar(1);
    }
  },
  // brazos de la ropa civil: antebrazo desnudo (paciente, con pulsera y vía) o manga naranja remangada (recluso)
  buildCivArms(c, camo) {
    const mat = MAT.soldier(camo), OF = OUTFITS[camo], skin = SKINS[(c.skin | 0) % SKINS.length], white = 0xdedbd2;
    if (!this.gloveMat) this.gloveMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0x24221a });
    for (const [grp, sd] of [[this.armR, 1], [this.armL, -1]]) {
      const B = new PartBatch();
      if (c.outfit === 'reo') B.add(GEO.cyl(0.043, 0.04, 0.48, 16), 0, 0, 0.47, 0, { rx: Math.PI / 2, camo: true }).add(GEO.cyl(0.045, 0.043, 0.05, 16), 0, 0, 0.22, shade(OF.gear, -0.25), { rx: Math.PI / 2 })
        .add(GEO.cyl(0.034, 0.03, 0.16, 16), 0, 0, 0.12, skin, { rx: Math.PI / 2 });
      else {
        B.add(GEO.cyl(0.036, 0.029, 0.62, 16), 0, 0, 0.36, skin, { rx: Math.PI / 2 }).add(GEO.box(0.004, 0.012, 0.25), sd * 0.03, -0.01, 0.4, shade(skin, -0.12), { ry: sd * 0.1 });
        if (sd < 0) B.add(GEO.cyl(0.037, 0.037, 0.016, 16), 0, 0, 0.1, white, { rx: Math.PI / 2 }).add(GEO.box(0.016, 0.012, 0.022), 0, 0.036, 0.1, 0xd8c84a)
          .add(GEO.box(0.03, 0.006, 0.05), 0.0, 0.034, 0.24, white).add(GEO.box(0.012, 0.004, 0.012), 0.0, 0.038, 0.24, 0x8a3a30);
      }
      grp.add(new THREE.Mesh(B.build(), mat));
    }
    for (const [grp, sd] of [[this.handR, 1], [this.handL, -1]]) {
      grp.add(buildArtHand(sd, skin, this.gloveMat)); grp.scale.setScalar(1);
    }
  },
  // 3.1.4: construye por adelantado (ocultas) las armas del equipo del jugador para que cambiar de arma no dé tirón
  prewarm() {
    const f = G.local; if (!f || !f.loadout) return;
    for (const id of [f.loadout.primary, f.loadout.secondary, 'knife']) {
      if (!id || !CONFIG.WEAPONS[id]) continue;
      const att = f.attFor ? f.attFor(id) : null, key = id + ':' + attKey(att);
      if (!this.models[key]) { try { const m = buildWeaponModel(id, true, att); m.visible = false; this.rig.add(m); this.models[key] = m; } catch (e) { } }
    }
  },
  setModel(id, att) {
    const key = id + ':' + attKey(att);
    if (this.curKey === key && this.cur) return;
    for (const k in this.models) this.models[k].visible = false;
    let m = this.models[key];
    if (!m) { m = buildWeaponModel(id, true, att); this.rig.add(m); this.models[key] = m; }
    m.visible = true; this.cur = m; this.curId = id; this.curKey = key;
  },
  onFire(shot) {
    if (!this.active || this.replay) return;
    this.kick(shot.weapon);
  },
  kick(weapon) {
    const P = VM_POSE[this.curId] || VM_POSE.rifle, W = (G.local && !this.replay ? G.local.wstat(weapon) : CONFIG.WEAPONS[weapon]) || {};
    if (W.kind === 'melee') return;
    const f = this.replay ? Replay.vmState : G.local, ads = f ? smooth01(f.adsT) : 0, k = 1 - 0.45 * ads;
    this.kz = Math.min(0.16, this.kz + P.kick * k); this.krx = Math.min(0.5, this.krx + P.rot * (0.6 + 0.4 * k)); this.kry += frand(-1, 1) * P.rot * 0.25; this.krz += frand(-1, 1) * P.rot * 0.6;
    this.trigK = 1;
    this.flashT = 0.05; this.flash.rotation.z = frand(0, TAU); this.flash.scale.setScalar(frand(0.09, 0.13) * (W.flash ?? 1) * (weapon === 'shotgun' ? 1.4 : 1));
  },
  // punto local del arma (o el expulsor) → mundo, conservando la posición en pantalla
  muzzleLocal() { return this.cur ? this.cur.userData.muzzle : _vmEject; },
  mapLocal(local, out) {
    const M = this.cur;
    if (!M) return out.copy(G.camera.position);
    const p = _vmV.copy(local).applyMatrix4(M.matrix);
    const k = Math.tan((G.camera.fov * Math.PI) / 360) / Math.tan((this.cam.fov * Math.PI) / 360);
    return out.set(p.x * k, p.y * k, p.z).applyMatrix4(G.camera.matrixWorld);
  },
  ejectWorld(out) { return this.mapLocal(_vmEject, out); },

  update(dt) {
    // en la cámara de derribo se ve el arma del asesino desde sus ojos
    const rs = Replay.playing ? Replay.vmState : null;
    let f = G.local;
    if (rs) f = rs;
    const on = !!(this.inited && f && (rs ? rs.on : (f.alive && f.view && !f.hidden && CAM.isFP && !CAM.scoped && !CAM.override && f.state === 'stand' && !Replay.playing)) && !G.attract);
    this.active = on;
    this.replay = !!rs;
    if (!on) { this.lastYaw = null; return; }
    this.buildArms(f.custom || {});
    const stab = f.meleeT > 0, nade = !!f.grenadeCook || f.throwT > 0, mantle = !!f.mantle;
    const id = stab ? 'knife' : f.weapon;
    this.setModel(id, rs ? rs.att && rs.att[id] : f.attFor ? f.attFor(id) : null);
    const M = this.cur, U = M.userData, P = VM_POSE[id] || VM_POSE.rifle;
    // 3.2.2: recarga por tipo de arma (cargador, peine, cartuchos); si el arma no tiene datos se usa la animación antigua
    const isSecW = CONFIG.WEAPONS[id] && CONFIG.WEAPONS[id].slot === 'secondary';
    const RL = id !== 'knife' && rlInfo(M, isSecW) ? (f.reloadT > 0 ? vmReload(M, clamp(1 - f.reloadT / Math.max(0.01, f.reloadTotal), 0, 1), isSecW, this._rl || (this._rl = {})) : (vmReloadRest(M), null)) : (animMag(M, f), null);
    this.props.clip.visible = !!(RL && RL.clip); this.props.shells.visible = !!(RL && RL.shells);
    if (RL && (RL.clip || RL.shells)) { const pr = RL.clip ? this.props.clip : this.props.shells; pr.position.copy(RL.propP); pr.quaternion.copy(RL.propQ); pr.updateMatrix(); if (RL.clip) pr.userData.rounds.position.y = -RL.push * 0.058, pr.userData.rounds.visible = RL.push < 0.97; }
    const ads = smooth01(f.adsT);
    this.sprintK = damp(this.sprintK, f.sprinting && !f.sliding ? 1 : 0, 10, dt);
    this.reloadK = damp(this.reloadK, f.reloadT > 0 ? 1 : 0, 10, dt);
    const ra = reloadAnim(f, this._ra || (this._ra = {}));
    this.reloadTilt = damp(this.reloadTilt || 0, ra.tilt * (RL ? RL.tiltK : 1), 14, dt);
    if (RL) { ra.mw = 0; ra.pw = 0; ra.mo = 0; ra.slap = RL.seat; }
    this.hideK = damp(this.hideK, nade || mantle ? 1 : 0, 14, dt);
    // inercia al girar la vista
    const yaw = f.input.yaw, pitch = f.input.pitch;
    if (this.lastYaw == null) { this.lastYaw = yaw; this.lastPitch = pitch; }
    const dyaw = wrapAngle(yaw - this.lastYaw), dp = pitch - this.lastPitch; this.lastYaw = yaw; this.lastPitch = pitch;
    const inv = dt > 1e-4 ? 1 / dt : 0, swK = 1 - ads * 0.8;
    this.swayX = damp(this.swayX, clamp(dyaw * inv * 0.0055, -0.035, 0.035) * swK, 9, dt);
    this.swayY = damp(this.swayY, clamp(-dp * inv * 0.0055, -0.03, 0.03) * swK, 9, dt);
    // el retroceso vuelve con resorte (rebote corto) y el arma acompaña saltos, caídas y el movimiento lateral
    spring(this, 'kz', 0, 520, 31, dt); spring(this, 'krx', 0, 380, 26, dt); spring(this, 'kry', 0, 300, 24, dt); spring(this, 'krz', 0, 300, 24, dt);
    spring(this, 'land', 0, 220, 17, dt);
    const lat = f.grounded ? (f.vel.x * Math.cos(yaw) - f.vel.z * Math.sin(yaw)) : 0;
    this.latK = damp(this.latK, clamp(lat / 6, -1, 1), 8, dt);
    this.vyK = damp(this.vyK, f.grounded ? 0 : clamp(f.vel.y / 7, -1.2, 1), 10, dt);
    // balanceo al caminar (mismo ritmo que la cabeza) y respiración
    const hs = Math.hypot(f.vel.x, f.vel.z), bobA = (f.grounded ? Math.min(1, hs / 6) : 0) * (1 - ads * 0.85) * (f.sprinting ? 1.8 : 1);
    const bx = Math.sin(CAM.bob) * 0.012 * bobA, by = -Math.abs(Math.sin(CAM.bob)) * 0.011 * bobA + Math.sin(G.realTime * 1.6) * 0.0022 * (1 - ads * 0.85);
    // pose: cadera ↔ mira
    const hip = P.hip, ap = P.ads || [0, -(P.sy ?? U.sightY), -((U.adsZ || P.adsZ || 0.22) - (U.att && U.att.optic === 'x2' ? 0.07 : 0))];
    let px = lerp(hip[0], ap[0], ads), py = lerp(hip[1], ap[1], ads), pz = lerp(hip[2], ap[2], ads);
    let rx = 0, ry = lerp(0.035, 0, ads), rz = lerp(-0.035, 0, ads);
    if (f.crouching && !f.sliding) { py += 0.006 * (1 - ads); rz -= 0.05 * (1 - ads); }
    if (f.sliding) { rz += 0.22; px -= 0.02; }
    if (id === 'knife' && !stab) { rx += 0.4; ry += 0.3; rz -= 0.3; }
    if (stab) {
      const k = 1 - f.meleeT / 0.42, s = k < 0.32 ? smooth01(k / 0.32) : 1 - smooth01((k - 0.32) / 0.68);
      px = lerp(0.17, 0.035, s); py = lerp(-0.2, -0.1, s); pz = lerp(-0.32, -0.64, s); rx = 0.3 * (1 - s); ry = lerp(0.35, 0.06, s); rz = -0.35 * (1 - s);
    }
    const sk = this.sprintK * (1 - ads) * (stab ? 0 : 1);
    px -= 0.05 * sk; py -= 0.07 * sk; pz += 0.06 * sk; rx -= 0.4 * sk; ry += 0.75 * sk; rz += 0.32 * sk;
    if (sk > 0.001) { const sn = Math.sin(CAM.bob), bn = Math.abs(sn), mv = f.grounded ? Math.min(1, hs / 6) : 0; px += sn * 0.018 * sk * mv; py -= bn * 0.02 * sk * mv; rz += sn * 0.06 * sk * mv; rx += bn * 0.04 * sk * mv; }
    const rk = this.reloadK, rt = this.reloadTilt;
    px -= 0.03 * rt; py += 0.025 * rt; rx += 0.16 * rt; ry += 0.1 * rt; rz -= 0.38 * rt;
    py -= 0.012 * ra.slap; rx += 0.06 * ra.slap; if (RL) { rx += RL.rx; py += RL.py; }
    const isSec = CONFIG.WEAPONS[id] && CONFIG.WEAPONS[id].slot === 'secondary', swT = f.switchTotal || (isSec ? 0.32 : id === 'rocket' ? 0.6 : id === 'knife' ? 0.22 : 0.45), swk = drawEase(clamp(f.switchT / swT, 0, 1));
    py -= 0.24 * swk; rx -= 0.95 * swk; rz += 0.22 * swk; px += 0.04 * swk;
    const hk = this.hideK; py -= 0.32 * hk; rx -= 0.8 * hk;
    py -= CAM.dip * 0.45 + this.land * 0.55 - this.vyK * 0.018 * (1 - ads * 0.7);
    rx += this.land * 0.35 - this.vyK * 0.05 * (1 - ads * 0.7);
    px -= this.latK * 0.012 * (1 - ads * 0.8); rz -= this.latK * 0.035 * (1 - ads * 0.8);
    py -= 0.01 * Math.sin(Math.PI * ads); rz += 0.03 * Math.sin(Math.PI * ads);   // al subir el arma a la cara se cuela un pequeño giro
    if (ads > 0.95) { const t = G.realTime; px += Math.sin(t * 0.9) * 0.0007; py += Math.sin(t * 1.3 + 1) * 0.0006; }
    pz += this.kz; rx += this.krx; ry += this.kry; py += this.krx * 0.04;
    rz += this.krz; px += this.swayX + bx; py += this.swayY + by; rz += this.swayX * 1.4; ry += this.swayX * 0.7; rx += this.swayY * 0.7;
    M.position.set(px, py, pz); M.rotation.set(rx, ry, rz, 'YXZ'); M.updateMatrix();
    M.visible = !(nade || mantle) || hk < 0.5;
    // manos
    let showL = true;
    const hR = this.handR, hL = this.handL;
    this.nade.visible = false;
    if (nade) {
      const k = f.grenadeCook ? 0 : smooth01(1 - f.throwT / 0.38);
      hR.position.set(0.2 - 0.14 * k, -0.11 + 0.06 * k + by, -0.3 - 0.36 * k); hR.rotation.set(0.25 - 0.9 * k, 0.2, -1.35 + 1.15 * k, 'YXZ');   // palma hacia arriba con la granada encima
      hL.position.set(-0.16, -0.19 + by, -0.48 + 0.06 * k); hL.rotation.set(0.15, -0.3, 0.35, 'YXZ');
      if (f.grenadeCook) { this.nade.visible = true; this.nade.position.copy(hR.position).add(_vmV.set(0, 0.05, -0.03)); }
    } else if (mantle) {
      hR.position.set(0.19, -0.13, -0.44); hR.rotation.set(-0.4, 0, -0.2, 'YXZ');
      hL.position.set(-0.19, -0.13, -0.44); hL.rotation.set(-0.4, 0, 0.2, 'YXZ');
    } else {
      // mano derecha: la palma sobre el lado derecho de la empuñadura, los dedos rodeando el frente
      const gp = U.grip || _vmGripDef;
      const groll = gp.roll || 0, goff = gp.w / 2 + 0.0155;   // 3.2.2: roll = la mano gira sobre su eje para abrazar por debajo la garganta de una culata recta
      hR.position.set(goff * Math.cos(groll), gp.y + goff * Math.sin(groll), gp.z + 0.02).applyMatrix4(M.matrix); hR.quaternion.copy(M.quaternion).multiply(_vmQ.setFromEuler(_vmE.set(gp.tilt, 0, groll)));
      if (!isSec && !U.proto && gp.tilt >= -0.5 && ads > 0.001 && id !== 'knife') hR.position.add(_vmV.set(0.035 * ads, -0.065 * ads, 0.02 * ads));
      else if (gp.tilt < -0.5 && !isSec && ads > 0.001 && id !== 'knife') hR.position.add(_vmV.set(0.03 * ads, -0.13 * ads, 0.04 * ads));   // 3.2.2: con el ojo sobre la culata la mano derecha queda bajo la cara, fuera de la vista   // 3.1.2: al apuntar la mano derecha baja hacia el guardamonte y deja libre el centro
      if (U.fore && id !== 'knife') {
        const fore = _vmV2.copy(U.fore);
        if (f.reloadT > 0 && U.mag) { fore.lerp(U.mag, ra.mw); fore.y -= ra.mo; fore.x -= 0.02 * ra.mw; if (ra.slap > 0.001) fore.y += 0.03 * ra.slap; }
        const vert = !isSec && U.att && (U.att.grip === 'vgrip' || U.att.grip === 'agrip');
        if (isSec) {   // pistola: la mano de apoyo envuelve el lado izquierdo de la empuñadura, por delante de la derecha
          hL.position.set(-(gp.w / 2 + 0.0155), gp.y - 0.012, gp.z + 0.0).add(_vmV.copy(fore).sub(U.fore)).applyMatrix4(M.matrix);
          hL.quaternion.copy(M.quaternion).multiply(_vmQ.setFromEuler(_vmE.set(gp.tilt, 0, 0)));
        } else if (vert) {   // empuñadura vertical o angulada: se agarra como una pistola
          hL.position.set(fore.x - 0.0305, fore.y + 0.02, fore.z + 0.0).applyMatrix4(M.matrix);
          hL.quaternion.copy(M.quaternion);
        } else {   // guardamanos: la palma abajo, los dedos suben por el costado derecho
          hL.position.set(fore.x + (U.foreW != null ? U.foreW + 0.013 - 0.045 : -0.02), (U.foreY ?? fore.y - 0.03) - 0.017 + (fore.y - U.fore.y), fore.z).applyMatrix4(M.matrix);
          hL.quaternion.copy(M.quaternion).multiply(_vmQcup).multiply(_vmQ.setFromEuler(_vmE.set(0, 0.25, 0)));
        }
        if (ra.pw > 0.001) hL.position.lerp(_vmPouch, ra.pw);
      } else showL = false;
    }
    if (RL && !nade && !mantle) {   // 3.2.2: las manos van a la pieza de la recarga (en coordenadas del arma)
      if (RL.Lw > 0.001 && showL) { hL.position.lerp(_vmV.copy(RL.Lp).applyMatrix4(M.matrix), RL.Lw); hL.quaternion.slerp(_vmQ.copy(M.quaternion).multiply(RL.Lq), RL.Lw); }
      if (RL.Rw > 0.001) { hR.position.lerp(_vmV.copy(RL.Rp).applyMatrix4(M.matrix), RL.Rw); hR.quaternion.slerp(_vmQ.copy(M.quaternion).multiply(RL.Rq), RL.Rw); }
      for (const pr of [this.props.clip, this.props.shells]) if (pr.visible) { pr.position.applyMatrix4(M.matrix); pr.quaternion.premultiply(M.quaternion); }
    }
    hL.visible = showL; this.armL.visible = showL;
    const openHand = nade || mantle;
    // 3.2.1: posturas de las manos articuladas. Derecha: empuñando con el índice en el gatillo (fuera de él al correr, recargar o cambiar de arma);
    // izquierda: bajo el guardamanos, envolviendo la empuñadura de la pistola o yendo a por el cargador en la recarga
    this.trigK = damp(this.trigK || 0, 0, 16, dt);
    const noTrig = id === 'knife' || this.sprintK > 0.4 || f.reloadT > 0 || f.switchT > 0, vertL = !isSec && U.att && (U.att.grip === 'vgrip' || U.att.grip === 'agrip');
    // 3.2.2: con el arma quieta en las manos se mide una vez (por arma y accesorios) hasta dónde cierra cada dedo sin atravesarla
    const HR = hR.children[0].userData.hand, HL = hL.children[0].userData.hand, calm = !nade && !mantle && !stab && f.reloadT <= 0;
    let fit = this.fits[this.curKey];
    if (!fit && calm && id !== 'knife' && (U.proto || ads < 0.001)) {
      this.rig.updateMatrixWorld(true);
      const tg = []; M.traverse((q) => { if (q.isMesh && q.material === MAT.gun()) tg.push(q); }); const TH = HAND_TH;
      fit = this.fits[this.curKey] = {};
      fit.R = fitHandPose(hR.children[0], HAND_POSES.grip, tg, { index: HAND_POSES.grip.f[0], thumbs: [TH.wrap, TH.along, TH.out] });
      fit.Roff = { f: fit.R.f.map((a, i) => (i === 0 ? [Math.min(a[0], 0.1), Math.min(a[1], 0.1), Math.min(a[2], 0.06)] : a)), sp: 0, th: fit.R.th };
      if (U.fore) { HR.raw(fit.R.f, fit.R.th); hR.updateMatrixWorld(true); const tgL = isSec ? tg.concat(hR.children[0].children.filter((q) => q.isMesh), ...HR.F.map((J) => J.map((j) => j.children[0]))) : tg;
        fit.L = fitHandPose(hL.children[0], isSec ? HAND_POSES.wrap : vertL ? HAND_POSES.fist : HAND_POSES.cup, tgL, { thumbs: [TH.along, TH.out] }); }
    }
    const pR = mantle ? 'flat' : nade ? 'hold' : id === 'knife' ? 'fist' : RL && RL.Rpose ? RL.Rpose : fit ? (noTrig ? fit.Roff : fit.R) : noTrig ? 'gripOff' : 'grip';
    const pL = mantle ? 'flat' : nade ? 'open' : RL && RL.Lpose ? (RL.Lpose === 'M' ? 'wrap' : RL.Lpose) : (ra.pw > 0.25 || ra.mw > 0.25) ? 'pinch' : fit && fit.L ? fit.L : isSec ? 'wrap' : vertL ? 'fist' : 'cup';
    HR.set(pR, dt, openHand ? 0 : this.trigK); HL.set(pL, dt, 0, 12);
    // antebrazos: de la muñeca hacia el codo (fuera de la pantalla)
    // culata recta (mano muy inclinada): el antebrazo baja hacia el codo y la muñeca hace el quiebro, como al empuñar un fusil de verdad
    const steep = !openHand && id !== 'knife' && U.grip && U.grip.tilt < -0.5 && !isSec;
    if (steep) this.placeArm(this.armR, hR, _vmV.set(lerp(0.2, 0.3, ads), lerp(-0.35, -0.8, ads), lerp(0.3, 0.05, ads)), lerp(0.3, 0.05, ads)); else
    this.placeArm(this.armR, hR, _vmV.set(lerp(0.08, 0.1, ads), lerp(-0.22, -0.3, ads), 0.3), 0.5 - 0.35 * this.reloadK);   // al recargar el antebrazo baja hacia el codo aunque el arma gire
    if (showL) this.placeArm(this.armL, hL, _vmV.set(lerp(-0.16, -0.12, ads), lerp(-0.2, -0.24, ads), 0.28), 0.12);
    // fogonazo
    this.flashT -= dt;
    const fl = this.flashT > 0 && M.visible;
    this.flash.visible = fl;
    if (fl) { this.flash.position.copy(U.muzzle).applyMatrix4(M.matrix); this.flash.position.z -= 0.03; }
    this.flashL.position.copy(this.flash.position); this.flashL.intensity = fl ? 1.6 : 0;
    // luces: el sol y el cielo en espacio de cámara; a la sombra el arma se oscurece
    const iq = _vmQ2.copy(G.camera.quaternion).invert();
    this.sun.position.copy(G.sunDir).applyQuaternion(iq).multiplyScalar(5);
    this.hemi.position.copy(UP).applyQuaternion(iq);
    this.shadeT -= dt;
    if (this.shadeT <= 0) {
      this.shadeT = 0.2;
      const eye = G.camera.position;
      this._sunHit = !!PHYS.raycast(eye, G.sunDir, 70, this._hit || (this._hit = {}));
      this._roofHit = !!PHYS.raycast(eye, UP, 30, this._hit);
    }
    this.shadeK = damp(this.shadeK, this._sunHit ? 0.12 : 1, 6, dt);
    this.skyK = damp(this.skyK, this._roofHit ? 0.55 : 1, 6, dt);
    this.sun.color.copy(G.sun.color); this.sun.intensity = G.sun.intensity * 0.8 * this.shadeK;
    this.hemi.color.copy(G.hemi.color); this.hemi.groundColor.copy(G.hemi.groundColor); this.hemi.intensity = G.hemi.intensity * this.skyK; this.amb.intensity = 0.4 * this.skyK;
    MAT.gun().envMapIntensity = 0.35 + 0.85 * this.skyK * (0.35 + 0.65 * this.shadeK);
    // campo de visión propio (un poco de zoom al apuntar)
    const fov = this.baseFov + 10 * ads;   // 3.1.2: al apuntar el arma y las manos se ven algo más pequeñas (la mira sigue en el centro)
    if (Math.abs(this.cam.fov - fov) > 0.01) { this.cam.fov = fov; this.cam.updateProjectionMatrix(); }
  },
  placeArm(arm, hand, off, wk = 0.5) {
    // el antebrazo sale de la muñequera: mitad en la dirección del puño de la mano y mitad hacia el codo (abajo y atrás).
    // Gira alrededor de la muñeca (no de la palma) para que mano y manga queden pegadas aunque el ángulo cambie.
    const wz = _vmV3.set(0, 0, 1).applyQuaternion(hand.quaternion);
    off.normalize().multiplyScalar(1 - wk).addScaledVector(wz, wk);
    arm.quaternion.setFromUnitVectors(_vmZ, off.normalize());
    _vmV2.copy(hand.position).addScaledVector(wz, VM_WRIST * hand.scale.z);
    arm.position.copy(_vmV2).addScaledVector(_vmV.set(0, 0, 1).applyQuaternion(arm.quaternion), -VM_WRIST_ARM);
  },
  render(r) {
    if (!this.active) return;
    r.autoClear = false; r.clearDepth(); r.render(this.scene, this.cam); r.autoClear = true;
  },
};

// ---------------- láseres (visibles para todos) ----------------
// Un haz fino que se desvanece a pocos metros del arma (como un láser real con algo
// de polvo en el aire) y un punto pequeño donde pega. Antes el haz cruzaba todo el
// mapa y engrosaba con la distancia: con varios bots parecía una fiesta de láseres.
const _lzA = new THREE.Vector3(), _lzB = new THREE.Vector3(), _lzD = new THREE.Vector3(), _lzE = new THREE.Vector3();
const LASER = { beamLen: 7.5, beamW: 0.0055, dotR: 0.016, dotMax: 2.2, dotRange: 42 };
let _lzMat = null, _lzDotMat = null, _lzGeo = null;
function laserBeamGeo() {
  // caja de 1×1×1 a lo largo de +Z (de 0 a 1) con color por vértice: rojo en el origen, negro al final
  const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0, 0.5);
  const p = g.attributes.position, c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const k = 1 - p.getZ(i); c[i * 3] = 1.0 * k; c[i * 3 + 1] = 0.16 * k; c[i * 3 + 2] = 0.08 * k; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
function updateLasers() {
  if (!_lzMat) {
    _lzGeo = laserBeamGeo();
    _lzMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    _lzDotMat = new THREE.MeshBasicMaterial({ color: 0xff3a22, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  }
  const cam = G.camera.position;
  for (const f of G.fighters) {
    const v = f.view;
    const W = f.wstat ? f.wstat() : null;
    const on = !!(v && W && W.laser && f.alive && !f.hidden && f.state === 'stand' && !f.sprinting && !f.mantle && f.switchT <= 0 && !f.grenadeCook && f.meleeT <= 0 && !Replay.playing && !G.attract && v.curModel && v.curModel.userData.laser);
    if (!on) { if (v && v.laserBeam) { v.laserBeam.visible = false; v.laserDot.visible = false; } continue; }
    if (!v.laserBeam) {
      v.laserBeam = new THREE.Mesh(_lzGeo, _lzMat); v.laserBeam.frustumCulled = false; v.laserBeam.renderOrder = 4;
      v.laserDot = new THREE.Mesh(GEO.sphere(1, 6, 4), _lzDotMat); v.laserDot.renderOrder = 4;
      G.root.add(v.laserBeam, v.laserDot);
    }
    // origen: el emisor del arma (en primera persona, el del arma de la vista propia)
    const mine = f === G.local;
    if (mine && VM.active && VM.cur && VM.cur.userData.laser) VM.mapLocal(VM.cur.userData.laser, _lzA);
    else { v.curModel.updateWorldMatrix(true, false); _lzA.copy(v.curModel.userData.laser).applyMatrix4(v.curModel.matrixWorld); }
    // destino: hacia donde apunta (punto de impacto real)
    const eye = eyePosOf(f, _lzE, f.input.yaw), dir = dirFromYawPitch(f.input.yaw, f.input.pitch, _lzD);
    const wh = PHYS.raycast(eye, dir, 90, v._lzHit || (v._lzHit = {}));
    let t = wh ? wh.t : 90;
    const fh = Combat.rayFighters(eye, dir, t, f); if (fh) t = fh.t;
    _lzB.copy(eye).addScaledVector(dir, t);
    const len = _lzA.distanceTo(_lzB);
    // con la mira puesta el haz propio estorba: solo queda el punto
    const beam = !(mine && f.adsT > 0.4) && len > 0.05;
    v.laserBeam.visible = beam;
    if (beam) {
      v.laserBeam.position.copy(_lzA);
      _lzE.copy(_lzB).sub(_lzA).normalize();
      v.laserBeam.quaternion.setFromUnitVectors(_vmZ, _lzE);
      v.laserBeam.scale.set(LASER.beamW, LASER.beamW, Math.min(len, LASER.beamLen));
    }
    const dCam = cam.distanceTo(_lzB);
    v.laserDot.visible = !!(wh || fh) && dCam < LASER.dotRange;
    if (v.laserDot.visible) {
      v.laserDot.position.copy(_lzB).addScaledVector(dir, -0.02);
      v.laserDot.scale.setScalar(LASER.dotR * clamp(1 + dCam * 0.035, 1, LASER.dotMax));
    }
  }
}

