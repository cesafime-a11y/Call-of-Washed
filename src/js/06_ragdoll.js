// ---- 06_ragdoll.js ----
// =====================================================================
// RAGDOLL — esqueleto humano de 11 segmentos (pelvis, pecho, cabeza, brazos
// y antebrazos, muslos y espinillas). Rodillas y codos solo doblan como los
// humanos (bisagra + cono limitado). Al morir hay una fase breve de "cuerpo
// activo" antes de desplomarse. Nunca se sincroniza por red: solo el impulso.
// =====================================================================
const PART_NAMES = ['pelvis', 'chest', 'head', 'upperArmL', 'foreArmL', 'upperArmR', 'foreArmR', 'thighL', 'shinL', 'thighR', 'shinR'];
const JOINT_NAMES = [...PART_NAMES, 'gun'];
const SKEL = {
  pelvis:    { parent: null,        pivot: [0, 0.94, 0],      size: [0.34, 0.24, 0.22], center: [0, 0.06, 0] },
  chest:     { parent: 'pelvis',    pivot: [0, 1.06, 0],      size: [0.42, 0.44, 0.25], center: [0, 0.22, 0] },
  head:      { parent: 'chest',     pivot: [0, 1.5, 0],       size: [0.21, 0.25, 0.24], center: [0, 0.165, -0.01] },
  upperArmL: { parent: 'chest',     pivot: [-0.265, 1.44, 0], size: [0.12, 0.31, 0.12], center: [0, -0.145, 0] },
  foreArmL:  { parent: 'upperArmL', pivot: [-0.265, 1.15, 0], size: [0.1, 0.3, 0.1],    center: [0, -0.14, 0] },
  upperArmR: { parent: 'chest',     pivot: [0.265, 1.44, 0],  size: [0.12, 0.31, 0.12], center: [0, -0.145, 0] },
  foreArmR:  { parent: 'upperArmR', pivot: [0.265, 1.15, 0],  size: [0.1, 0.3, 0.1],    center: [0, -0.14, 0] },
  thighL:    { parent: 'pelvis',    pivot: [-0.105, 0.93, 0], size: [0.16, 0.45, 0.17], center: [0, -0.22, 0] },
  shinL:     { parent: 'thighL',    pivot: [-0.105, 0.48, 0], size: [0.13, 0.47, 0.15], center: [0, -0.23, 0] },
  thighR:    { parent: 'pelvis',    pivot: [0.105, 0.93, 0],  size: [0.16, 0.45, 0.17], center: [0, -0.22, 0] },
  shinR:     { parent: 'thighR',    pivot: [0.105, 0.48, 0],  size: [0.13, 0.47, 0.15], center: [0, -0.23, 0] },
};
for (const n of PART_NAMES) {
  const s = SKEL[n];
  s.P = new THREE.Vector3(...s.pivot); s.C = new THREE.Vector3(...s.center); s.S = new THREE.Vector3(...s.size);
  s.off = s.parent ? s.P.clone().sub(new THREE.Vector3(...SKEL[s.parent].pivot)) : s.P.clone();
}
const ARM_UP = SKEL.foreArmL.P.distanceTo(SKEL.upperArmL.P);  // hombro → codo
const ARM_LO = 0.27;                                          // codo → empuñadura
const LEG_UP = SKEL.shinL.P.distanceTo(SKEL.thighL.P), LEG_LO = 0.47;
const PART_RADIUS = { pelvis: 0.17, chest: 0.22, head: 0.14, upperArmL: 0.08, foreArmL: 0.07, upperArmR: 0.08, foreArmR: 0.07, thighL: 0.1, shinL: 0.085, thighR: 0.1, shinR: 0.085 };

class Ragdoll {
  // pose: {name: {pos: Vector3 (articulación, espacio del mundo), quat}}
  constructor(fighter, pose, vel, opts = {}) {
    const R = CONFIG.RAGDOLL, w = PHYS.world;
    this.f = fighter; this.parts = {}; this.constraints = []; this.t = 0; this.frozen = false;
    this.active = opts.death ? R.activeTime : 0;
    const group = ragGroup(fighter.slot);
    this.group = group;
    const mask = CG.STATIC | CG.PROP | CG.FIGHTER | CG.DEBRIS | (RAG_ALL & ~group);
    const V = (a) => new CANNON.Vec3(a.x, a.y, a.z);
    for (const n of PART_NAMES) {
      const s = SKEL[n], p = pose[n];
      const c = _v1.copy(s.C).applyQuaternion(p.quat).add(p.pos);
      const he = new CANNON.Vec3(s.S.x * 0.46, s.S.y * 0.46, s.S.z * 0.46);
      const body = new CANNON.Body({
        mass: R.mass[n] || 1, shape: new CANNON.Box(he), linearDamping: R.linearDamping, angularDamping: R.angularDamping,
        collisionFilterGroup: group, collisionFilterMask: mask, allowSleep: true, sleepSpeedLimit: 0.22, sleepTimeLimit: 0.6,
      });
      body.position.set(c.x, c.y, c.z);
      body.quaternion.set(p.quat.x, p.quat.y, p.quat.z, p.quat.w);
      body.velocity.set(vel.x, vel.y, vel.z);
      body.userData = { ragdoll: this, part: n };
      w.addBody(body);
      this.parts[n] = { body };
    }
    // articulaciones
    const cone = (child, axisA, angle, twist) => {
      const c = SKEL[child], p = SKEL[c.parent];
      const pivotA = V(c.P.clone().sub(p.P).sub(p.C)), pivotB = V(c.C.clone().negate());
      const k = new CANNON.ConeTwistConstraint(this.parts[c.parent].body, this.parts[child].body, {
        pivotA, pivotB, axisA: V(axisA.normalize()), axisB: new CANNON.Vec3(0, child === 'chest' || child === 'head' ? 1 : -1, 0),
        angle, twistAngle: twist, collideConnected: false, maxForce: 1e6,
      });
      w.addConstraint(k); this.constraints.push(k);
      return { pivotA, pivotB };
    };
    const hinge = (child, piv) => {
      const c = SKEL[child];
      const k = new CANNON.HingeConstraint(this.parts[c.parent].body, this.parts[child].body, {
        pivotA: piv.pivotA, pivotB: piv.pivotB, axisA: new CANNON.Vec3(1, 0, 0), axisB: new CANNON.Vec3(1, 0, 0), collideConnected: false, maxForce: 1e6,
      });
      w.addConstraint(k); this.constraints.push(k);
    };
    const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
    cone('chest', v3(0, 1, 0), 0.42, 0.35);
    cone('head', v3(0, 1, 0.05), 0.55, 0.7);
    cone('upperArmL', v3(-0.45, -0.85, -0.25), 1.25, 0.8);
    cone('upperArmR', v3(0.45, -0.85, -0.25), 1.25, 0.8);
    hinge('foreArmL', cone('foreArmL', v3(0, -Math.cos(1.2), -Math.sin(1.2)), 1.25, 0.15));
    hinge('foreArmR', cone('foreArmR', v3(0, -Math.cos(1.2), -Math.sin(1.2)), 1.25, 0.15));
    cone('thighL', v3(-0.1, -Math.cos(0.45), -Math.sin(0.45)), 0.95, 0.25);
    cone('thighR', v3(0.1, -Math.cos(0.45), -Math.sin(0.45)), 0.95, 0.25);
    hinge('shinL', cone('shinL', v3(0, -Math.cos(1.1), Math.sin(1.1)), 1.15, 0.05));
    hinge('shinR', cone('shinR', v3(0, -Math.cos(1.1), Math.sin(1.1)), 1.15, 0.05));
    this.torso = this.parts.chest.body; this.head = this.parts.head.body; this.pelvis = this.parts.pelvis.body;
    this.totalMass = PART_NAMES.reduce((a, n) => a + this.parts[n].body.mass, 0);
    this._f = new CANNON.Vec3();
  }

  // impulso como cambio de velocidad (m/s): una parte se reparte en todo el cuerpo, el resto va a la zona golpeada
  applyImpulse(imp, point, part) {
    if (this.frozen) this.unfreeze();
    for (const n of PART_NAMES) {
      const b = this.parts[n].body; b.wakeUp();
      b.velocity.x += imp.x * 0.32; b.velocity.y += imp.y * 0.32; b.velocity.z += imp.z * 0.32;
    }
    const name = part && this.parts[part] ? part : point ? this.nearestPart(point) : 'chest';
    const b = this.parts[name].body;
    const m = b.mass * 1.5;
    const J = new CANNON.Vec3(imp.x * m, imp.y * m, imp.z * m);
    const pt = point ? new CANNON.Vec3(point.x, point.y, point.z) : b.position;
    b.applyImpulse(J, pt);
  }
  nearestPart(p) {
    let best = 'chest', bd = Infinity;
    for (const n of PART_NAMES) { const bp = this.parts[n].body.position; const d = (bp.x - p.x) ** 2 + (bp.y - p.y) ** 2 + (bp.z - p.z) ** 2; if (d < bd) { bd = d; best = n; } }
    return best;
  }
  // fase de cuerpo activo: el torso aguanta un instante y luego las piernas ceden
  update(dt) {
    this.t += dt;
    if (this.active > 0 && !this.frozen) {
      const R = CONFIG.RAGDOLL;
      this.active -= dt;
      const k = clamp(this.active / R.activeTime, 0, 1);
      const F = CONFIG.MOVE.gravity * this.totalMass * R.activeSupport * k;
      this._f.set(0, F * 0.62, 0); this.torso.applyForce(this._f, this.torso.position);
      this._f.set(0, F * 0.38, 0); this.pelvis.applyForce(this._f, this.pelvis.position);
      const damp = Math.max(0, 1 - R.activeDamping * k * dt * 12);
      for (const n of PART_NAMES) this.parts[n].body.angularVelocity.scale(damp, this.parts[n].body.angularVelocity);
    }
  }
  torsoPos(out) { const p = this.torso.position; return out.set(p.x, p.y, p.z); }
  headPos(out) { const p = this.head.position; return out.set(p.x, p.y, p.z); }
  speed() { return this.torso.velocity.length(); }
  velocity(out) { const v = this.torso.velocity; return out.set(v.x, v.y, v.z); }
  partPos(name, out) { const p = this.parts[name].body.position; return out.set(p.x, p.y, p.z); }
  isSettled() {
    if (this.frozen) return true;
    const S = CONFIG.RAGDOLL.settleSpeed;
    return this.torso.velocity.length() < S && this.pelvis.velocity.length() < S && this.head.velocity.length() < S * 1.6;
  }
  // deja de simular (los cuerpos quietos no cuestan nada) y se reactiva si le pegan
  freeze() {
    if (this.frozen) return;
    const w = PHYS.world;
    for (const c of this.constraints) w.removeConstraint(c);
    for (const n of PART_NAMES) w.removeBody(this.parts[n].body);
    this.frozen = true;
  }
  unfreeze() {
    if (!this.frozen || this.disposed) return;
    const w = PHYS.world;
    for (const n of PART_NAMES) { const b = this.parts[n].body; w.addBody(b); b.wakeUp(); }
    for (const c of this.constraints) w.addConstraint(c);
    this.frozen = false; this.t = Math.min(this.t, 1);
  }
  // transformaciones de articulación (para la vista)
  writePose(out) {
    for (const n of PART_NAMES) {
      const b = this.parts[n].body, q = b.quaternion, p = b.position;
      const o = out[n] || (out[n] = { pos: new THREE.Vector3(), quat: new THREE.Quaternion() });
      o.quat.set(q.x, q.y, q.z, q.w);
      o.pos.copy(SKEL[n].C).applyQuaternion(o.quat).multiplyScalar(-1).add(_v1.set(p.x, p.y, p.z));
    }
    return out;
  }
  dispose() {
    if (this.disposed) return;
    if (!this.frozen) {
      const w = PHYS.world;
      for (const c of this.constraints) w.removeConstraint(c);
      for (const n of PART_NAMES) w.removeBody(this.parts[n].body);
    }
    this.constraints = []; this.disposed = true;
  }
}

