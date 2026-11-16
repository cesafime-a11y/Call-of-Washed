// ---- 03_physics.js ----
// =====================================================================
// FISICA — mundo de bloques (colisión AABB/rampas, rayos) con cuadrícula
// espacial + mundo cannon-es para ragdolls, granadas y objetos sueltos
// =====================================================================
const CG = { STATIC: 1, PROP: 2, FIGHTER: 4, DEBRIS: 8, RAG: 16 }; // RAG<<slot (slots 0..7)
const RAG_ALL = 0xff << 4;
const ragGroup = (slot) => CG.RAG << (slot & 7);

// patrones del material de bloques (también deciden la superficie: sonido de pasos e impactos)
const PAT = { PLAIN: 0, DIRT: 1, HAZARD: 2, CRATE: 3, CONCRETE: 4, BRICK: 5, PLASTER: 6, SANDBAG: 7, METAL: 8, ASPHALT: 9, WOOD: 10, ROOF: 11, COBBLE: 12, GRATE: 13, GRASS: 14 };
function surfaceFor(p) {
  if (p === PAT.DIRT || p === PAT.GRASS) return 'dirt';
  if (p === PAT.CRATE || p === PAT.WOOD) return 'wood';
  if (p === PAT.METAL || p === PAT.GRATE || p === PAT.HAZARD) return 'metal';
  if (p === PAT.SANDBAG) return 'sand';
  return 'concrete';
}

let _blockId = 0;
function makeBlock(x0, y0, z0, x1, y1, z1, opt = {}) {
  const pattern = opt.pattern ?? PAT.PLAIN;
  const b = {
    id: _blockId++,
    min: new THREE.Vector3(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)),
    max: new THREE.Vector3(Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)),
    ramp: opt.ramp || null,              // {axis:'x'|'z', dir:1|-1}
    color: opt.color ?? 0x8a8478,
    kind: opt.kind || 'solid',           // floor | wall | cover | crate | barrel | deco | platform | ramp
    active: true, solid: opt.solid !== false,
    hp: opt.hp ?? Infinity, maxHp: opt.hp ?? Infinity, destructible: !!opt.hp && opt.hp < Infinity,
    pattern, surface: opt.surface || surfaceFor(pattern),
    tag: opt.tag || null, tile: !!opt.tile, _stage: 0,
    instance: -1, noPhys: !!opt.noPhys, noRender: !!opt.noRender,
    _st: 0, body: null, bodyIn: false,
  };
  return b;
}
function rampHeight(b, x, z) {
  const r = b.ramp;
  let t = r.axis === 'x' ? (x - b.min.x) / (b.max.x - b.min.x) : (z - b.min.z) / (b.max.z - b.min.z);
  if (r.dir < 0) t = 1 - t;
  return b.min.y + clamp(t, 0, 1) * (b.max.y - b.min.y);
}
function rampNormal(b, out) {
  const r = b.ramp, len = r.axis === 'x' ? b.max.x - b.min.x : b.max.z - b.min.z, h = b.max.y - b.min.y;
  if (r.axis === 'x') out.set(-r.dir * h, len, 0); else out.set(0, len, -r.dir * h);
  return out.normalize();
}

// broadphase con cuadrícula: solo cuerpos dinámicos despiertos contra estáticos cercanos
// (el SAP de cannon es cuadrático con losas largas y cientos de colisionadores estáticos)
class GridBroadphase extends CANNON.Broadphase {
  constructor() { super(); this.cell = 4; this.cells = new Map(); this.staticDirty = true; this.nStatic = -1; this._seen = 1; this._list = []; }
  rebuild(world) {
    this.rebuilds = (this.rebuilds || 0) + 1;
    this.cells.clear(); this.staticDirty = false; let n = 0;
    for (const b of world.bodies) {
      if (b.type !== CANNON.Body.STATIC) continue;
      b.updateAABB(); n++;
      const a = b.aabb, c = this.cell;
      const x0 = Math.floor(a.lowerBound.x / c), x1 = Math.floor(a.upperBound.x / c), z0 = Math.floor(a.lowerBound.z / c), z1 = Math.floor(a.upperBound.z / c);
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) { const k = x * 73856093 ^ z * 19349663; let arr = this.cells.get(k); if (!arr) this.cells.set(k, arr = []); arr.push(b); }
    }
    this.nStatic = n;
  }
  collisionPairs(world, p1, p2) {
    if (this.staticDirty) this.rebuild(world);
    const bodies = world.bodies, movers = this._list; movers.length = 0;
    const DYN = CANNON.Body.DYNAMIC, STA = CANNON.Body.STATIC, SLEEP = CANNON.Body.SLEEPING;
    for (const b of bodies) if (b.type !== STA) { if (b.aabbNeedsUpdate) b.updateAABB(); movers.push(b); }
    const c = this.cell;
    for (let i = 0; i < movers.length; i++) {
      const a = movers[i];
      const awake = a.type === DYN && a.sleepState !== SLEEP;
      if (awake) {
        const bb = a.aabb, stamp = ++this._seen;
        const x0 = Math.floor(bb.lowerBound.x / c), x1 = Math.floor(bb.upperBound.x / c), z0 = Math.floor(bb.lowerBound.z / c), z1 = Math.floor(bb.upperBound.z / c);
        for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
          const arr = this.cells.get(x * 73856093 ^ z * 19349663); if (!arr) continue;
          for (const s of arr) {
            if (s._bp === stamp || !s.world) continue; s._bp = stamp;
            if (!bb.overlaps(s.aabb) || !this.needBroadphaseCollision(a, s)) continue;
            p1.push(a); p2.push(s);
          }
        }
      }
      for (let j = i + 1; j < movers.length; j++) {
        const b = movers[j];
        const bAwake = b.type === DYN && b.sleepState !== SLEEP;
        if (!awake && !bAwake) continue;
        if (!a.aabb.overlaps(b.aabb) || !this.needBroadphaseCollision(a, b)) continue;
        p1.push(a); p2.push(b);
      }
    }
  }
}

// ragdolls de combatientes vivos (derribados) simulándose ahora mismo
function Fighters_ragN() { let n = 0; for (const f of G.fighters) if (f.state === 'ragdoll' && f.ragdoll && !f.ragdoll.frozen) n++; return n; }
const PHYS = {
  blocks: [], world: null, staticBodies: [], materials: {},
  grid: null, _stamp: 1, _qa: [], _qb: [],

  init() {
    const w = new CANNON.World({ gravity: new CANNON.Vec3(0, -CONFIG.MOVE.gravity, 0) });
    w.broadphase = new GridBroadphase(); w.broadphase.setWorld(w);
    // matriz de colisiones dispersa: la de arreglo es O(n²) por paso con ~900 cuerpos estáticos
    w.collisionMatrix = new CANNON.ObjectCollisionMatrix(); w.collisionMatrixPrevious = new CANNON.ObjectCollisionMatrix();
    w.allowSleep = true;
    w.solver.iterations = CONFIG.RAGDOLL.iterations;
    w.solver.tolerance = 0.0005;
    const dc = w.defaultContactMaterial;
    dc.friction = CONFIG.RAGDOLL.friction; dc.restitution = CONFIG.RAGDOLL.restitution;
    dc.contactEquationStiffness = CONFIG.RAGDOLL.stiffness; dc.contactEquationRelaxation = CONFIG.RAGDOLL.relaxation;
    dc.frictionEquationStiffness = CONFIG.RAGDOLL.stiffness; dc.frictionEquationRelaxation = CONFIG.RAGDOLL.relaxation;
    this.world = w;
    const gm = new CANNON.Material('grenade');
    this.materials.grenade = gm;
    w.addContactMaterial(new CANNON.ContactMaterial(gm, w.defaultMaterial, { friction: 0.35, restitution: 0.38 }));
    w.addContactMaterial(new CANNON.ContactMaterial(gm, gm, { friction: 0.3, restitution: 0.3 }));
  },
  applyRagdollTuning() {
    const R = CONFIG.RAGDOLL, w = this.world, dc = w.defaultContactMaterial;
    w.solver.iterations = R.iterations | 0;
    dc.friction = R.friction; dc.restitution = R.restitution;
    dc.contactEquationStiffness = R.stiffness; dc.contactEquationRelaxation = R.relaxation;
  },

  bpDirty() { if (this.world && this.world.broadphase) this.world.broadphase.staticDirty = true; },
  clear() {
    this.bpDirty();
    for (const b of this.staticBodies) this.world.removeBody(b);
    for (const b of this.blocks) if (b.body && b.bodyIn) this.world.removeBody(b.body);
    this.staticBodies = [];
    this.blocks = []; this.grid = null;
  },
  addBlock(b) { this.blocks.push(b); return b; },

  // ---- cuadrícula espacial (XZ) ----
  finalize() { this.buildGrid(); this.rebuildStatic(); },
  buildGrid() {
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (const b of this.blocks) { if (!b.solid) continue; x0 = Math.min(x0, b.min.x); z0 = Math.min(z0, b.min.z); x1 = Math.max(x1, b.max.x); z1 = Math.max(z1, b.max.z); }
    if (!Number.isFinite(x0)) { x0 = z0 = -10; x1 = z1 = 10; }
    const cell = 4;
    x0 -= cell; z0 -= cell; x1 += cell; z1 += cell;
    const nx = Math.max(1, Math.ceil((x1 - x0) / cell)), nz = Math.max(1, Math.ceil((z1 - z0) / cell));
    const cells = new Array(nx * nz); for (let i = 0; i < cells.length; i++) cells[i] = [];
    const g = { cell, x0, z0, x1: x0 + nx * cell, z1: z0 + nz * cell, nx, nz, cells };
    for (const b of this.blocks) {
      if (!b.solid) continue;
      const ix0 = clamp(Math.floor((b.min.x - x0) / cell), 0, nx - 1), ix1 = clamp(Math.floor((b.max.x - x0) / cell), 0, nx - 1);
      const iz0 = clamp(Math.floor((b.min.z - z0) / cell), 0, nz - 1), iz1 = clamp(Math.floor((b.max.z - z0) / cell), 0, nz - 1);
      for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) cells[iz * nx + ix].push(b);
    }
    this.grid = g;
  },
  // bloques activos cuya caja toca el volumen (sin duplicados)
  query(x0, y0, z0, x1, y1, z1, out) {
    out.length = 0;
    const g = this.grid; if (!g) return out;
    const st = ++this._stamp, c = g.cell;
    const ix0 = clamp(Math.floor((x0 - g.x0) / c), 0, g.nx - 1), ix1 = clamp(Math.floor((x1 - g.x0) / c), 0, g.nx - 1);
    const iz0 = clamp(Math.floor((z0 - g.z0) / c), 0, g.nz - 1), iz1 = clamp(Math.floor((z1 - g.z0) / c), 0, g.nz - 1);
    for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) {
      const list = g.cells[iz * g.nx + ix];
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        if (b._st === st) continue; b._st = st;
        if (!b.active) continue;
        if (x1 < b.min.x || x0 > b.max.x || z1 < b.min.z || z0 > b.max.z || y1 < b.min.y || y0 > b.max.y) continue;
        out.push(b);
      }
    }
    return out;
  },

  // ---- colliders estáticos de cannon (fusiona bloques contiguos: menos costuras = ragdoll estable) ----
  rebuildStatic() {
    this.bpDirty();
    for (const b of this.staticBodies) this.world.removeBody(b);
    this.staticBodies = [];
    const boxes = [];
    for (const b of this.blocks) {
      if (!b.solid || b.noPhys) continue;
      if (b.ramp) { this.addRampBody(b); continue; }
      if (b.destructible) {
        // los destructibles tienen cuerpo propio para poder quitarlo sin reconstruir todo
        if (!b.body) {
          b.body = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC, collisionFilterGroup: CG.STATIC, collisionFilterMask: -1 });
          b.body.addShape(new CANNON.Box(new CANNON.Vec3((b.max.x - b.min.x) / 2, (b.max.y - b.min.y) / 2, (b.max.z - b.min.z) / 2)));
          b.body.position.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
        }
        if (b.active && !b.bodyIn) { this.world.addBody(b.body); b.bodyIn = true; }
        continue;
      }
      boxes.push({ x0: b.min.x, y0: b.min.y, z0: b.min.z, x1: b.max.x, y1: b.max.y, z1: b.max.z });
    }
    const merge = (list, axis) => {
      const o = axis === 'x' ? ['y0', 'y1', 'z0', 'z1'] : ['y0', 'y1', 'x0', 'x1'];
      const a0 = axis + '0', a1 = axis + '1';
      const groups = new Map();
      for (const bx of list) {
        const k = o.map((p) => bx[p].toFixed(3)).join(',');
        if (!groups.has(k)) groups.set(k, []);
        groups.get(k).push(bx);
      }
      const out = [];
      for (const gr of groups.values()) {
        gr.sort((p, q) => p[a0] - q[a0]);
        let cur = { ...gr[0] };
        for (let i = 1; i < gr.length; i++) {
          if (Math.abs(gr[i][a0] - cur[a1]) < 1e-3) cur[a1] = Math.max(cur[a1], gr[i][a1]);
          else { out.push(cur); cur = { ...gr[i] }; }
        }
        out.push(cur);
      }
      return out;
    };
    const merged = merge(merge(boxes, 'x'), 'z');
    for (const m of merged) {
      const body = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC, collisionFilterGroup: CG.STATIC, collisionFilterMask: -1 });
      body.addShape(new CANNON.Box(new CANNON.Vec3((m.x1 - m.x0) / 2, (m.y1 - m.y0) / 2, (m.z1 - m.z0) / 2)));
      body.position.set((m.x0 + m.x1) / 2, (m.y0 + m.y1) / 2, (m.z0 + m.z1) / 2);
      this.world.addBody(body);
      this.staticBodies.push(body);
    }
  },
  addRampBody(b) {
    const r = b.ramp, len = r.axis === 'x' ? b.max.x - b.min.x : b.max.z - b.min.z, h = b.max.y - b.min.y;
    const wid = r.axis === 'x' ? b.max.z - b.min.z : b.max.x - b.min.x;
    const slope = Math.sqrt(len * len + h * h), ang = Math.atan2(h, len), th = 0.6;
    const body = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC, collisionFilterGroup: CG.STATIC, collisionFilterMask: -1 });
    const he = r.axis === 'x' ? new CANNON.Vec3(slope / 2, th / 2, wid / 2) : new CANNON.Vec3(wid / 2, th / 2, slope / 2);
    body.addShape(new CANNON.Box(he));
    const n = rampNormal(b, _v1);
    const cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2, cy = (b.min.y + b.max.y) / 2;
    body.position.set(cx - n.x * th / 2, cy - n.y * th / 2, cz - n.z * th / 2);
    if (r.axis === 'x') body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 0, 1), ang * r.dir);
    else body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -ang * r.dir);
    this.world.addBody(body);
    this.staticBodies.push(body);
    if (h > 0.8) {
      const fill = new CANNON.Body({ mass: 0, type: CANNON.Body.STATIC, collisionFilterGroup: CG.STATIC, collisionFilterMask: -1 });
      const hh = h * 0.4;
      fill.addShape(new CANNON.Box(r.axis === 'x' ? new CANNON.Vec3(len * 0.25, hh / 2, wid / 2) : new CANNON.Vec3(wid / 2, hh / 2, len * 0.25)));
      const off = len * 0.25 * r.dir;
      fill.position.set(cx + (r.axis === 'x' ? off : 0), b.min.y + hh / 2, cz + (r.axis === 'z' ? off : 0));
      this.world.addBody(fill); this.staticBodies.push(fill);
    }
  },
  setActive(b, on) {
    if (b.active === on) return;
    b.active = on;
    if (b.body) {
      if (!on && b.bodyIn) { this.world.removeBody(b.body); b.bodyIn = false; }
      else if (on && !b.bodyIn) { this.world.addBody(b.body); b.bodyIn = true; this.bpDirty(); }
    }
    if (!on) for (const body of this.world.bodies) if (body.type === CANNON.Body.DYNAMIC && body.sleepState) body.wakeUp();
    BUS.emit('blockChanged', b);
  },
  resetBlocks() {
    for (const b of this.blocks) {
      b.hp = b.maxHp;
      if (!b.active) { b.active = true; if (b.body && !b.bodyIn) { this.world.addBody(b.body); b.bodyIn = true; this.bpDirty(); } }
    }
  },

  // ---- paso de cannon ----
  step(dt) {
    // con muchos ragdolls simulándose a la vez baja la precisión del solver: pasos y iteraciones (se nota mucho menos que un bajón de fps)
    const busy = (Corpses.liveN || 0) + (Fighters_ragN()) ;
    const sub = busy > 5 ? 1 : CONFIG.PHYS_SUBSTEPS, h = dt / sub, R = CONFIG.RAGDOLL;
    const it = busy > 5 ? Math.max(6, (R.iterations * 0.55) | 0) : R.iterations | 0; if (this.world.solver.iterations !== it) this.world.solver.iterations = it;
    for (let s = 0; s < sub; s++) {
      this.world.step(h);
      for (const body of this.world.bodies) {
        if (body.type !== CANNON.Body.DYNAMIC || body.sleepState === CANNON.Body.SLEEPING) continue;
        const v = body.velocity, w = body.angularVelocity;
        const vl = v.length(); if (vl > R.maxLinVel) v.scale(R.maxLinVel / vl, v);
        const wl = w.length(); if (wl > R.maxAngVel) w.scale(R.maxAngVel / wl, w);
        if (!Number.isFinite(body.position.x + body.position.y + body.position.z)) { body.position.set(0, 4, 0); v.set(0, 0, 0); w.set(0, 0, 0); }
      }
    }
  },

  // ---- consultas ----
  overlapAABB(x0, y0, z0, x1, y1, z1, skip) {
    const list = this.query(x0, y0, z0, x1, y1, z1, this._qa);
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (b === skip) continue;
      if (x1 <= b.min.x || x0 >= b.max.x || z1 <= b.min.z || z0 >= b.max.z || y1 <= b.min.y || y0 >= b.max.y) continue;
      if (b.ramp) { const h = rampHeight(b, clamp((x0 + x1) / 2, b.min.x, b.max.x), clamp((z0 + z1) / 2, b.min.z, b.max.z)); if (y0 >= h - 0.02) continue; }
      return b;
    }
    return null;
  },
  // altura del suelo bajo (x,z) por debajo de yFrom
  groundBelow(x, z, yFrom, maxDrop = 60, half = 0) {
    let best = -Infinity, bb = null;
    const list = this.query(x - half, yFrom - maxDrop - 0.1, z - half, x + half, yFrom + 0.06, z + half, this._qb);
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if (x + half < b.min.x || x - half > b.max.x || z + half < b.min.z || z - half > b.max.z) continue;
      const top = b.ramp ? rampHeight(b, clamp(x, b.min.x, b.max.x), clamp(z, b.min.z, b.max.z)) : b.max.y;
      if (top <= yFrom + 0.05 && top > best && top >= yFrom - maxDrop) { best = top; bb = b; }
    }
    return bb ? { y: best, block: bb } : null;
  },
  // rayo contra un bloque; devuelve t o Infinity (y deja la normal en _rnHit)
  _rayBlock(b, o, d, ix, iy, iz, bestT) {
    let t1 = (b.min.x - o.x) * ix, t2 = (b.max.x - o.x) * ix;
    let tmin = Math.min(t1, t2), tmax = Math.max(t1, t2), ax = 0;
    t1 = (b.min.y - o.y) * iy; t2 = (b.max.y - o.y) * iy;
    let a = Math.min(t1, t2), c = Math.max(t1, t2);
    if (a > tmin) { tmin = a; ax = 1; } if (c < tmax) tmax = c;
    t1 = (b.min.z - o.z) * iz; t2 = (b.max.z - o.z) * iz;
    a = Math.min(t1, t2); c = Math.max(t1, t2);
    if (a > tmin) { tmin = a; ax = 2; } if (c < tmax) tmax = c;
    if (tmax < Math.max(tmin, 0) || tmin >= bestT) return Infinity;
    const n = this._rnHit;
    if (b.ramp) {
      const rn = rampNormal(b, this._rn1);
      const top = this._rn2.set(b.ramp.axis === 'x' ? (b.ramp.dir > 0 ? b.max.x : b.min.x) : (b.min.x + b.max.x) / 2, b.max.y, b.ramp.axis === 'z' ? (b.ramp.dir > 0 ? b.max.z : b.min.z) : (b.min.z + b.max.z) / 2);
      const den = rn.dot(d);
      let hitT = Infinity;
      if (Math.abs(den) > 1e-6) {
        const tp = top.sub(o).dot(rn) / den;
        if (tp >= 0 && tp < bestT) {
          const px = o.x + d.x * tp, pz = o.z + d.z * tp;
          if (px >= b.min.x - 1e-3 && px <= b.max.x + 1e-3 && pz >= b.min.z - 1e-3 && pz <= b.max.z + 1e-3) { hitT = tp; n.copy(rn); }
        }
      }
      if (tmin >= 0 && tmin < hitT) {
        const px = o.x + d.x * tmin, py = o.y + d.y * tmin, pz = o.z + d.z * tmin;
        if (ax !== 1 && py <= rampHeight(b, px, pz) + 1e-3) { hitT = tmin; n.set(ax === 0 ? -Math.sign(d.x) : 0, 0, ax === 2 ? -Math.sign(d.z) : 0); }
      }
      return hitT < bestT ? hitT : Infinity;
    }
    if (tmin < 0) return Infinity; // origen dentro
    n.set(ax === 0 ? -Math.sign(d.x) : 0, ax === 1 ? -Math.sign(d.y) : 0, ax === 2 ? -Math.sign(d.z) : 0);
    return tmin;
  },
  // rayo contra bloques (recorre la cuadrícula con DDA): devuelve {t, point, normal, block} o null
  raycast(o, d, maxT, out = {}) {
    const g = this.grid; if (!g) return null;
    const st = ++this._stamp, c = g.cell;
    const ix = 1 / (d.x || 1e-9), iy = 1 / (d.y || 1e-9), iz = 1 / (d.z || 1e-9);
    let tEnter = 0, tExit = maxT;
    if (Math.abs(d.x) < 1e-9) { if (o.x < g.x0 || o.x > g.x1) return null; }
    else { let ta = (g.x0 - o.x) * ix, tb = (g.x1 - o.x) * ix; if (ta > tb) { const s = ta; ta = tb; tb = s; } tEnter = Math.max(tEnter, ta); tExit = Math.min(tExit, tb); }
    if (Math.abs(d.z) < 1e-9) { if (o.z < g.z0 || o.z > g.z1) return null; }
    else { let ta = (g.z0 - o.z) * iz, tb = (g.z1 - o.z) * iz; if (ta > tb) { const s = ta; ta = tb; tb = s; } tEnter = Math.max(tEnter, ta); tExit = Math.min(tExit, tb); }
    if (tEnter > tExit) return null;
    const px = o.x + d.x * tEnter, pz = o.z + d.z * tEnter;
    let cx = clamp(Math.floor((px - g.x0) / c), 0, g.nx - 1), cz = clamp(Math.floor((pz - g.z0) / c), 0, g.nz - 1);
    const stepX = d.x > 0 ? 1 : -1, stepZ = d.z > 0 ? 1 : -1;
    let tMaxX = Math.abs(d.x) < 1e-9 ? Infinity : ((g.x0 + (cx + (stepX > 0 ? 1 : 0)) * c) - o.x) * ix;
    let tMaxZ = Math.abs(d.z) < 1e-9 ? Infinity : ((g.z0 + (cz + (stepZ > 0 ? 1 : 0)) * c) - o.z) * iz;
    const tDX = Math.abs(d.x) < 1e-9 ? Infinity : Math.abs(c * ix), tDZ = Math.abs(d.z) < 1e-9 ? Infinity : Math.abs(c * iz);
    let bestT = maxT, bestB = null; const n = this._rn0;
    for (let guard = 0; guard < 4096; guard++) {
      const list = g.cells[cz * g.nx + cx];
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        if (b._st === st) continue; b._st = st;
        if (!b.active || (out.skipBound && b.kind === 'bound')) continue;
        const ht = this._rayBlock(b, o, d, ix, iy, iz, bestT);
        if (ht < bestT) { bestT = ht; bestB = b; n.copy(this._rnHit); }
      }
      const tNext = Math.min(tMaxX, tMaxZ);
      if (bestT <= tNext || tNext > tExit) break;
      if (tMaxX < tMaxZ) { cx += stepX; tMaxX += tDX; if (cx < 0 || cx >= g.nx) break; }
      else { cz += stepZ; tMaxZ += tDZ; if (cz < 0 || cz >= g.nz) break; }
    }
    if (!bestB) return null;
    out.t = bestT; out.block = bestB;
    out.point = (out.point || new THREE.Vector3()).copy(o).addScaledVector(d, bestT);
    out.normal = (out.normal || new THREE.Vector3()).copy(n);
    return out;
  },
  // distancia a la que el rayo sale del bloque (para medir cuánto espesor atraviesa una bala)
  rayExit(b, o, d) {
    let tmax = Infinity;
    const sl = (oo, dd, a, c) => { if (Math.abs(dd) < 1e-9) return; const t0 = (a - oo) / dd, t1 = (c - oo) / dd; const hi = Math.max(t0, t1); if (hi < tmax) tmax = hi; };
    sl(o.x, d.x, b.min.x, b.max.x); sl(o.y, d.y, b.min.y, b.max.y); sl(o.z, d.z, b.min.z, b.max.z);
    return tmax;
  },
  lineOfSight(a, b) {
    const d = this._losD.copy(b).sub(a); const len = d.length(); if (len < 1e-4) return true;
    d.multiplyScalar(1 / len);
    return !this.raycast(a, d, len - 0.05, PHYS._losOut);
  },
  _losOut: {}, _rn0: new THREE.Vector3(), _rn1: new THREE.Vector3(), _rn2: new THREE.Vector3(), _rnHit: new THREE.Vector3(), _losD: new THREE.Vector3(),
};

