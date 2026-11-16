// ---- 01_util.js ----
// =====================================================================
// UTILIDADES — matemáticas, RNG con semilla, almacenamiento, eventos
// =====================================================================
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));
const smooth01 = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const wrapAngle = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const dampAngle = (a, b, lambda, dt) => a + wrapAngle(b - a) * (1 - Math.exp(-lambda * dt));
const now = () => performance.now() / 1000;

// --- RNG determinista (mulberry32) ---
function hash32(...parts) {
  let h = 0x811c9dc5 >>> 0;
  for (const p of parts) {
    const s = typeof p === 'number' ? String(p | 0) + ':' + String(Math.round((p % 1) * 1e6)) : String(p);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    h ^= 0x9e3779b9; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  }
  return h >>> 0;
}
class RNG {
  constructor(seed = 1) { this.s = seed >>> 0 || 1; }
  next() {
    let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(a, b) { return a + (b - a) * this.next(); }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length) % arr.length]; }
  chance(p) { return this.next() < p; }
  sign() { return this.next() < 0.5 ? -1 : 1; }
  fork(tag) { return new RNG(hash32(this.s, tag)); }
}
// RNG cosmético (partículas, sonidos) — no afecta gameplay
const FX_RNG = new RNG((Date.now() & 0xffffff) ^ 0x5eed);
const frand = (a = 0, b = 1) => a + (b - a) * FX_RNG.next();

// --- vectores temporales reutilizables (evita basura en el loop) ---
const _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const _v5 = new THREE.Vector3(), _v6 = new THREE.Vector3(), _v7 = new THREE.Vector3(), _v8 = new THREE.Vector3();
const _q1 = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion();
const _m1 = new THREE.Matrix4(), _m2 = new THREE.Matrix4();
const _e1 = new THREE.Euler();
const _c1 = new THREE.Color(), _c2 = new THREE.Color();
const UP = new THREE.Vector3(0, 1, 0);

function dirFromYawPitch(yaw, pitch, out = new THREE.Vector3()) {
  const cp = Math.cos(pitch);
  return out.set(-Math.sin(yaw) * cp, Math.sin(pitch), -Math.cos(yaw) * cp);
}
function yawPitchFromDir(d) {
  return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(clamp(d.y / (d.length() || 1), -1, 1)) };
}
// dispersión determinista dentro de un cono
function spreadDir(dir, spread, rng, out = new THREE.Vector3()) {
  if (spread <= 0) return out.copy(dir);
  const a = rng.next() * TAU, r = Math.sqrt(rng.next()) * spread;
  _v7.copy(Math.abs(dir.y) > 0.95 ? _v8.set(1, 0, 0) : UP).cross(dir).normalize();
  _v8.copy(dir).cross(_v7).normalize();
  return out.copy(dir).addScaledVector(_v7, Math.cos(a) * r).addScaledVector(_v8, Math.sin(a) * r).normalize();
}

// --- almacenamiento seguro ---
const Store = {
  get(key, def) {
    try { const v = localStorage.getItem('cow.' + key); return v == null ? def : JSON.parse(v); } catch (e) { return def; }
  },
  set(key, val) { try { localStorage.setItem('cow.' + key, JSON.stringify(val)); } catch (e) { /* sin almacenamiento */ } },
};

// --- bus de eventos simple ---
class Emitter {
  constructor() { this.h = new Map(); }
  on(t, fn) { if (!this.h.has(t)) this.h.set(t, new Set()); this.h.get(t).add(fn); return () => this.h.get(t)?.delete(fn); }
  emit(t, a, b, c) { const s = this.h.get(t); if (s) for (const fn of [...s]) { try { fn(a, b, c); } catch (e) { reportError(e); } } }
}
const BUS = new Emitter();

// --- errores visibles, nunca pantalla en blanco ---
const ERRORS = [];
function reportError(e) {
  const msg = (e && (e.stack || e.message)) || String(e);
  ERRORS.push(msg);
  if (ERRORS.length > 20) ERRORS.shift();
  console.error('[COW]', msg);
  try { if (typeof UI !== 'undefined' && UI.showError) UI.showError(msg); } catch (_) { }
}

// --- i18n ---
let LANG = 'es';
function T(key, vars) {
  const d = (typeof STR !== 'undefined' && STR[key]) || null;
  let s = d ? (d[LANG] ?? d.es ?? key) : key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}
const L = (obj) => (obj && typeof obj === 'object' ? (obj[LANG] ?? obj.es) : obj);

// --- pool genérico ---
class Pool {
  constructor(make, size) { this.items = []; for (let i = 0; i < size; i++) this.items.push(make(i)); this.i = 0; }
  next() { const it = this.items[this.i]; this.i = (this.i + 1) % this.items.length; return it; }
}

// --- montículo mínimo (A* de la navegación) ---
class MinHeap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  clear() { this.k.length = 0; this.v.length = 0; }
  push(key, val) {
    const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
    k[i] = key; v[i] = val;
  }
  pop() {
    const k = this.k, v = this.v, top = v[0], lk = k.pop(), lv = v.pop(), n = k.length;
    if (n) {
      let i = 0;
      for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; }
      k[i] = lk; v[i] = lv;
    }
    return top;
  }
}
// distancia mínima entre un rayo (o, d normalizado, hasta maxT) y un punto
function rayPointDist(o, d, maxT, p) {
  const px = p.x - o.x, py = p.y - o.y, pz = p.z - o.z;
  const t = clamp(px * d.x + py * d.y + pz * d.z, 0, maxT);
  const qx = px - d.x * t, qy = py - d.y * t, qz = pz - d.z * t;
  return { dist: Math.sqrt(qx * qx + qy * qy + qz * qz), t };
}
function fmtTime(s) { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function shuffleInPlace(arr, rng) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(rng.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose();
    if (o.material) {
      const ms = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of ms) if (!m.userData.shared) { if (m.map && !m.map.userData?.shared) m.map.dispose(); m.dispose(); }
    }
  });
}

