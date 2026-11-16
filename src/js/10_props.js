// ---- 10_props.js ----
// =====================================================================
// OBJETOS SUELTOS — llantas, bidones y cubetas con física real. Son solo
// ambiente: reaccionan a explosiones y a los soldados, no afectan el juego.
// =====================================================================
const PROP_TYPES = {
  tire: { mass: 9, shape: () => new CANNON.Cylinder(0.36, 0.36, 0.24, 8), rot: [Math.PI / 2, 0, 0], h: 0.36,
    mesh() { const b = new PartBatch(); b.add(GEO.cyl(0.36, 0.36, 0.24, 10), 0, 0, 0, 0x1c1b1a).add(GEO.cyl(0.18, 0.18, 0.25, 8), 0, 0, 0, 0x5a5a56); return b.build(); } },
  can: { mass: 6, shape: () => new CANNON.Box(new CANNON.Vec3(0.17, 0.24, 0.09)), h: 0.24,
    mesh() { const b = new PartBatch(); b.add(GEO.box(0.34, 0.48, 0.18), 0, 0, 0, 0x4d5a2e).add(GEO.box(0.12, 0.05, 0.05), 0.08, 0.26, 0, 0x2a2a2a).add(GEO.box(0.3, 0.04, 0.19), 0, 0.1, 0, 0x3a4424); return b.build(); } },
  bucket: { mass: 2, shape: () => new CANNON.Cylinder(0.17, 0.14, 0.32, 8), h: 0.16,
    mesh() { const b = new PartBatch(); b.add(GEO.cyl(0.17, 0.14, 0.32, 10), 0, 0, 0, 0x6a6e70); return b.build(); } },
};
const Props = {
  list: [], defs: [],
  build(defs) {
    this.clear(); this.defs = defs || [];
    for (const d of this.defs) {
      const T = PROP_TYPES[d.type]; if (!T) continue;
      const body = new CANNON.Body({ mass: T.mass, shape: T.shape(), linearDamping: 0.2, angularDamping: 0.4, collisionFilterGroup: CG.PROP, collisionFilterMask: CG.STATIC | CG.PROP | CG.FIGHTER | RAG_ALL | CG.DEBRIS, allowSleep: true, sleepSpeedLimit: 0.3 });
      const m = new THREE.Mesh(T.mesh(), MAT.vcol()); m.castShadow = true;
      G.root.add(m);
      const p = { type: d.type, def: d, body, mesh: m, T };
      this.place(p);
      PHYS.world.addBody(body);
      this.list.push(p);
    }
  },
  place(p) {
    const d = p.def, T = p.T;
    p.body.position.set(d.x, d.y + T.h + 0.02, d.z);
    if (T.rot) p.body.quaternion.setFromEuler(T.rot[0], T.rot[1], T.rot[2]); else p.body.quaternion.set(0, 0, 0, 1);
    p.body.velocity.set(0, 0, 0); p.body.angularVelocity.set(0, 0, 0);
    p.body.sleep();
  },
  reset() { for (const p of this.list) this.place(p); },
  tick() {
    for (const p of this.list) {
      const b = p.body.position;
      if (b.y < CONFIG.KILL_Y) this.place(p);
    }
  },
  animate() { for (const p of this.list) { const b = p.body.position, q = p.body.quaternion; p.mesh.position.set(b.x, b.y, b.z); p.mesh.quaternion.set(q.x, q.y, q.z, q.w); } },
  radial(pos, r, push) {
    for (const p of this.list) {
      const b = p.body.position, dx = b.x - pos.x, dy = b.y - pos.y, dz = b.z - pos.z, d = Math.hypot(dx, dy, dz);
      if (d > r) continue;
      const k = (1 - d / r) * push / (d || 1);
      p.body.wakeUp();
      p.body.velocity.x += dx * k; p.body.velocity.y += Math.abs(dy) * k + push * 0.4 * (1 - d / r); p.body.velocity.z += dz * k;
      p.body.angularVelocity.set(frand(-8, 8), frand(-8, 8), frand(-8, 8));
    }
  },
  clear() { for (const p of this.list) { PHYS.world.removeBody(p.body); G.root.remove(p.mesh); p.mesh.geometry.dispose(); } this.list = []; },
};

// =====================================================================
// ESCOMBROS — pedazos con física real que salen de paneles, cajas y sacos rotos.
// Rebotan, chocan con soldados y cadáveres y desaparecen solos.
// =====================================================================
const Rubble = {
  max: 40, list: [], mesh: null, cur: 0, ready: false,
  init() {
    if (this.ready || !PHYS.world) return;
    this.ready = true; this.list = []; this.cur = 0; this.max = (G.quality && G.quality.rubble) || 14;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    this.mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0xffffff }), this.max);
    this.mesh.frustumCulled = false; this.mesh.count = 0; this.mesh.castShadow = !!(G.quality && G.quality.shadows);
    this.mesh.setColorAt(0, _c1.set(0xffffff)); G.root.add(this.mesh);
    for (let i = 0; i < this.max; i++) {
      const body = new CANNON.Body({ mass: 1.2, shape: new CANNON.Box(new CANNON.Vec3(0.11, 0.11, 0.11)), linearDamping: 0.15, angularDamping: 0.3, collisionFilterGroup: CG.DEBRIS, collisionFilterMask: CG.STATIC | CG.PROP | CG.FIGHTER | RAG_ALL, allowSleep: true, sleepSpeedLimit: 0.4, sleepTimeLimit: 0.6 });
      this.list.push({ body, active: false, t: 0, life: 6, s: 0.2 });
    }
  },
  spawn(c, color, n, size, speed) {
    if (!this.ready) this.init();
    if (!this.ready || (G.quality && G.quality.rubble === 0)) return;
    for (let i = 0; i < n; i++) {
      const p = this.list[this.cur]; this.cur = (this.cur + 1) % this.max;
      const b = p.body;
      if (!p.active) { PHYS.world.addBody(b); p.active = true; }
      b.position.set(c.x + frand(-0.35, 0.35), c.y + frand(-0.3, 0.3), c.z + frand(-0.35, 0.35));
      b.quaternion.setFromEuler(frand(0, 3), frand(0, 3), frand(0, 3));
      b.velocity.set(frand(-1, 1) * speed, frand(0.4, 1.4) * speed, frand(-1, 1) * speed);
      b.angularVelocity.set(frand(-9, 9), frand(-9, 9), frand(-9, 9));
      b.wakeUp(); p.t = 0; p.life = frand(5, 8); p.s = clamp(size * frand(0.8, 1.4), 0.14, 0.27);
      this.mesh.setColorAt(this.list.indexOf(p), _c1.set(color).multiplyScalar(frand(0.7, 1.05)));
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  },
  tick(dt) {
    if (!this.ready) return;
    for (const p of this.list) {
      if (!p.active) continue;
      p.t += dt;
      if (p.t > p.life || p.body.position.y < CONFIG.KILL_Y) { PHYS.world.removeBody(p.body); p.active = false; }
    }
  },
  animate() {
    if (!this.ready) return;
    const m = this.mesh;
    for (let i = 0; i < this.max; i++) {
      const p = this.list[i];
      if (!p.active) { _m1.makeScale(0, 0, 0); m.setMatrixAt(i, _m1); continue; }
      const b = p.body.position, q = p.body.quaternion, fade = clamp((p.life - p.t) / 0.8, 0, 1), s = p.s * (0.4 + 0.6 * fade) * 2;
      _m1.compose(_v1.set(b.x, b.y, b.z), _q1.set(q.x, q.y, q.z, q.w), _v2.set(s, s * 0.7, s * 0.9));
      m.setMatrixAt(i, _m1);
    }
    m.count = this.max; m.instanceMatrix.needsUpdate = true;
  },
  clear() { if (!this.ready) return; for (const p of this.list) if (p.active) { PHYS.world.removeBody(p.body); p.active = false; } },
  dispose() { if (!this.ready) return; this.clear(); G.root.remove(this.mesh); this.mesh.geometry.dispose(); this.mesh.material.dispose(); this.mesh = null; this.list = []; this.ready = false; },
};

