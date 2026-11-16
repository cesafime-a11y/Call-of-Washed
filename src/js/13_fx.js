// ---- 13_fx.js ----
// =====================================================================
// EFECTOS — partículas billboard (humo, polvo, fuego, chispas, sangre),
// trazadoras, destellos de boca con luz, casquillos, escombros, agujeros
// de bala y salpicaduras (decals), explosiones. Todo con pools y límites.
// =====================================================================
function fxTexture(kind) {
  const S = 64, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const rng = new RNG(hash32('fx', kind));
  if (kind === 'soft') {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.45, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  } else if (kind === 'puff') {
    for (let i = 0; i < 14; i++) {
      const cx = 32 + rng.range(-12, 12), cy = 32 + rng.range(-12, 12), r = rng.range(8, 18);
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, S, S);
    }
  } else if (kind === 'flash') {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,240,200,0.8)'); g.addColorStop(1, 'rgba(255,200,120,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'lighter'; x.fillStyle = 'rgba(255,230,180,0.7)';
    for (let i = 0; i < 6; i++) { x.save(); x.translate(32, 32); x.rotate(i / 6 * TAU + rng.range(-0.2, 0.2)); x.beginPath(); x.moveTo(0, -3); x.lineTo(rng.range(20, 31), 0); x.lineTo(0, 3); x.fill(); x.restore(); }
  } else if (kind === 'splat') {
    x.fillStyle = '#fff';
    x.beginPath(); x.arc(32, 32, 13, 0, TAU); x.fill();
    for (let i = 0; i < 11; i++) { const a = rng.range(0, TAU), d = rng.range(10, 26), r = rng.range(2, 6); x.beginPath(); x.arc(32 + Math.cos(a) * d, 32 + Math.sin(a) * d, r, 0, TAU); x.fill(); }
  } else if (kind === 'hole') {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 30); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.28, 'rgba(255,255,255,0.95)'); g.addColorStop(0.45, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = rng.range(20, 30); i ? x.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r) : x.moveTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
    x.fill();
  } else if (kind === 'scorch') {
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.6, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  const t = new THREE.CanvasTexture(c); t.userData.shared = true;
  return t;
}

// ---------- sistema de billboards instanciados (swap-remove: siempre compacto) ----------
class Billboards {
  constructor(max, tex, additive) {
    this.max = max; this.n = 0; this.additive = additive;
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0]), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    this.aPos = new THREE.InstancedBufferAttribute(new Float32Array(max * 3), 3); this.aPos.setUsage(THREE.DynamicDrawUsage);
    this.aCol = new THREE.InstancedBufferAttribute(new Float32Array(max * 4), 4); this.aCol.setUsage(THREE.DynamicDrawUsage);
    this.aSR = new THREE.InstancedBufferAttribute(new Float32Array(max * 2), 2); this.aSR.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('iPos', this.aPos); g.setAttribute('iCol', this.aCol); g.setAttribute('iSR', this.aSR);
    g.instanceCount = 0;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: tex }, fogColor: { value: new THREE.Color() }, fogNear: { value: 40 }, fogFar: { value: 200 } },
      vertexShader: `attribute vec3 iPos; attribute vec4 iCol; attribute vec2 iSR; varying vec2 vUv; varying vec4 vCol; varying float vFog; uniform float fogNear; uniform float fogFar;
        void main(){ vUv = uv; vCol = iCol; vec4 mv = modelViewMatrix * vec4(iPos, 1.0); float c = cos(iSR.y), s = sin(iSR.y); vec2 p = position.xy * iSR.x; mv.xy += vec2(c*p.x - s*p.y, s*p.x + c*p.y);
          gl_Position = projectionMatrix * mv; vFog = smoothstep(fogNear, fogFar, -mv.z); }`,
      fragmentShader: `uniform sampler2D map; uniform vec3 fogColor; varying vec2 vUv; varying vec4 vCol; varying float vFog;
        void main(){ vec4 t = texture2D(map, vUv); float a = t.a * vCol.a; if (a < 0.004) discard;
          ${additive ? 'gl_FragColor = vec4(vCol.rgb * t.rgb * (1.0 - vFog), a);' : 'gl_FragColor = vec4(mix(vCol.rgb * t.rgb, fogColor, vFog), a);'}
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.frustumCulled = false; this.mesh.renderOrder = additive ? 3 : 2;
    this.geo = g;
    // estado por partícula
    this.p = new Float32Array(max * 3); this.v = new Float32Array(max * 3);
    this.d = new Float32Array(max * 10); // size, grow, life, maxLife, r, g, b, alpha, rot, rotVel
    this.f = new Float32Array(max * 4); // grav, drag, groundY, flags
  }
  spawn(x, y, z, vx, vy, vz, size, grow, life, color, alpha, o) {
    let i = this.n;
    if (i >= this.max) i = (this._rr = ((this._rr || 0) + 1) % this.max); else this.n++;
    const p = this.p, v = this.v, d = this.d, f = this.f;
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; v[i * 3] = vx; v[i * 3 + 1] = vy; v[i * 3 + 2] = vz;
    _c1.set(color);
    const k = i * 10; d[k] = size; d[k + 1] = grow; d[k + 2] = life; d[k + 3] = life; d[k + 4] = _c1.r; d[k + 5] = _c1.g; d[k + 6] = _c1.b; d[k + 7] = alpha; d[k + 8] = frand(0, TAU); d[k + 9] = o && o.rv != null ? o.rv : frand(-1, 1);
    f[i * 4] = o && o.grav != null ? o.grav : 0; f[i * 4 + 1] = o && o.drag != null ? o.drag : 1; f[i * 4 + 2] = o && o.gy != null ? o.gy : -999; f[i * 4 + 3] = o && o.flags || 0;
    return i;
  }
  kill(i) {
    const n = --this.n; if (i === n) return;
    this.p.copyWithin(i * 3, n * 3, n * 3 + 3); this.v.copyWithin(i * 3, n * 3, n * 3 + 3); this.d.copyWithin(i * 10, n * 10, n * 10 + 10); this.f.copyWithin(i * 4, n * 4, n * 4 + 4);
  }
  update(dt, onLand) {
    const p = this.p, v = this.v, d = this.d, f = this.f;
    for (let i = this.n - 1; i >= 0; i--) {
      const k = i * 10;
      d[k + 2] -= dt;
      if (d[k + 2] <= 0) { this.kill(i); continue; }
      const dk = Math.exp(-f[i * 4 + 1] * dt);
      v[i * 3] *= dk; v[i * 3 + 1] = v[i * 3 + 1] * dk - 22 * f[i * 4] * dt; v[i * 3 + 2] *= dk;
      p[i * 3] += v[i * 3] * dt; p[i * 3 + 1] += v[i * 3 + 1] * dt; p[i * 3 + 2] += v[i * 3 + 2] * dt;
      d[k] += d[k + 1] * dt; d[k + 8] += d[k + 9] * dt;
      if (f[i * 4 + 3] && p[i * 3 + 1] < f[i * 4 + 2]) { if (onLand) onLand(p[i * 3], f[i * 4 + 2], p[i * 3 + 2], d[k], f[i * 4 + 3]); this.kill(i); continue; }
    }
    const P = this.aPos.array, Cc = this.aCol.array, SR = this.aSR.array;
    for (let i = 0; i < this.n; i++) {
      const k = i * 10, t = d[k + 2] / d[k + 3];
      P[i * 3] = p[i * 3]; P[i * 3 + 1] = p[i * 3 + 1]; P[i * 3 + 2] = p[i * 3 + 2];
      const a = d[k + 7] * Math.min(1, t * 2.2) * Math.min(1, (1 - t) * 12 + 0.25);
      Cc[i * 4] = d[k + 4]; Cc[i * 4 + 1] = d[k + 5]; Cc[i * 4 + 2] = d[k + 6]; Cc[i * 4 + 3] = a;
      SR[i * 2] = Math.max(0.001, d[k]); SR[i * 2 + 1] = d[k + 8];
    }
    this.geo.instanceCount = this.n;
    this.aPos.needsUpdate = this.aCol.needsUpdate = this.aSR.needsUpdate = true;
    if (G.scene && G.scene.fog) { this.mat.uniforms.fogColor.value.copy(G.scene.fog.color); this.mat.uniforms.fogNear.value = G.scene.fog.near; this.mat.uniforms.fogFar.value = G.scene.fog.far; }
  }
  clear() { this.n = 0; this.geo.instanceCount = 0; }
  dispose() { this.geo.dispose(); this.mat.dispose(); }
}

const BLOOD = [0x6a0d0d, 0x7d1212, 0x560a0a];
const FX = {
  inited: false,
  init(q) {
    this.disposeAll();
    this.q = q;
    if (!this.tex) this.tex = { soft: fxTexture('soft'), puff: fxTexture('puff'), flash: fxTexture('flash'), splat: fxTexture('splat'), hole: fxTexture('hole'), scorch: fxTexture('scorch') };
    this.smoke = new Billboards(Math.round(q.soft * 0.7), this.tex.puff, false);
    this.soft = new Billboards(Math.round(q.soft * 0.5), this.tex.soft, false);
    this.glow = new Billboards(Math.round(q.particles * 0.6), this.tex.flash, true);
    for (const s of [this.smoke, this.soft, this.glow]) G.root.add(s.mesh);
    // decals: agujeros (oscuros) y salpicaduras / quemaduras
    const mkDecals = (tex, n) => {
      const m = new THREE.InstancedMesh(GEO.plane(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), n);
      m.frustumCulled = false; m.count = 0; m.setColorAt(0, _c1.set(0xffffff)); m.renderOrder = 1; G.root.add(m);
      return { m, n, cur: 0, grow: [] };
    };
    this.holes = mkDecals(this.tex.hole, q.decals);
    this.splats = mkDecals(this.tex.splat, Math.round(q.decals * 0.6));
    this.scorches = mkDecals(this.tex.scorch, 24);
    // trazadoras
    this.maxTr = 40;
    const tg = new THREE.BoxGeometry(1, 1, 1); tg.translate(0, 0, -0.5);
    this.tm = new THREE.InstancedMesh(tg, new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }), this.maxTr);
    this.tm.frustumCulled = false; this.tm.renderOrder = 3;
    this.T = []; for (let i = 0; i < this.maxTr; i++) { this.T.push({ t: 1, a: new THREE.Vector3(), b: new THREE.Vector3(), len: 0, dur: 0.05, w: 0.02 }); this.tm.setMatrixAt(i, _m1.makeScale(0, 0, 0)); }
    this.tCursor = 0; G.root.add(this.tm);
    // casquillos y escombros (física simple contra el suelo)
    this.maxC = q.casings; this.maxF = 90;
    this.cm = new THREE.InstancedMesh(GEO.box(0.014, 0.014, 0.042), MAT.lam(0xc9a24a), this.maxC);
    this.fm = new THREE.InstancedMesh(GEO.box(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0xffffff, flatShading: true }), this.maxF);
    for (const m of [this.cm, this.fm]) { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); G.root.add(m); }
    this.fm.setColorAt(0, _c1.set(0xffffff)); this.fm.castShadow = q.shadows;
    this.C = []; for (let i = 0; i < this.maxC; i++) { this.C.push({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Vector3(), gy: -999, rest: false, b: 0 }); this.cm.setMatrixAt(i, _m1.makeScale(0, 0, 0)); }
    this.F = []; for (let i = 0; i < this.maxF; i++) { this.F.push({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Vector3(), rv: new THREE.Vector3(), s: 0.1, gy: -999, rest: false }); this.fm.setMatrixAt(i, _m1.makeScale(0, 0, 0)); }
    this.cCursor = 0; this.fCursor = 0;
    // luces de destello (pool)
    this.lights = [];
    if (q.lights) for (let i = 0; i < 3; i++) { const l = new THREE.PointLight(0xffc880, 0, 12, 1.6); l.position.set(0, -300, 0); G.root.add(l); this.lights.push({ l, t: 0, dur: 0.05, i0: 0, on: false }); }
    this.lCursor = 0;
    this.inited = true;
  },
  disposeAll() {
    if (!this.inited) return;
    for (const s of [this.smoke, this.soft, this.glow]) { G.root.remove(s.mesh); s.dispose(); }
    for (const d of [this.holes, this.splats, this.scorches]) { G.root.remove(d.m); d.m.material.dispose(); d.m.dispose(); }
    for (const m of [this.tm, this.cm, this.fm]) { G.root.remove(m); if (!m.geometry.userData.shared) m.geometry.dispose(); if (!m.material.userData.shared) m.material.dispose(); m.dispose(); }
    for (const L of this.lights) G.root.remove(L.l);
    this.inited = false;
  },
  clear() {
    if (!this.inited) return;
    this.smoke.clear(); this.soft.clear(); this.glow.clear();
    for (const d of [this.holes, this.splats, this.scorches]) { d.m.count = 0; d.cur = 0; d.grow.length = 0; }
    for (const L of this.lights) { L.on = false; L.l.intensity = 0; }
    for (const c of this.C) c.life = 0; for (const f of this.F) f.life = 0; for (const t of this.T) t.t = 1;
  },
  get gore() { return CONFIG.GORE[G.settings.gore] || CONFIG.GORE.low; },
  groundAt(pos) { const q = PHYS.groundBelow(pos.x, pos.z, pos.y + 0.2, 30); return q ? q.y : -999; },

  update(dt) {
    if (!this.inited) return;
    const onLand = (x, y, z, size, flags) => { if (flags === 1) this.decal(this.splats, _v6.set(x, y, z), UP, size * frand(1.6, 2.6), BLOOD[(Math.random() * 3) | 0]); };
    this.smoke.update(dt); this.soft.update(dt, onLand); this.glow.update(dt);
    // trazadoras: un destello corto que viaja por la trayectoria
    for (let i = 0; i < this.maxTr; i++) {
      const t = this.T[i]; if (t.t >= 1) continue;
      t.t += dt / t.dur;
      if (t.t >= 1) { this.tm.setMatrixAt(i, _m1.makeScale(0, 0, 0)); continue; }
      const L = t.len, seg = Math.min(L, 5.5), head = Math.min(L, seg + (L - seg) * t.t), tail = Math.max(0, head - seg);
      _v1.copy(t.b).sub(t.a).multiplyScalar(1 / (L || 1));
      _v2.copy(t.a).addScaledVector(_v1, head);
      _q1.setFromUnitVectors(_v3.set(0, 0, -1), _v1);
      this.tm.setMatrixAt(i, _m1.compose(_v2, _q1, _v4.set(t.w, t.w, Math.max(0.01, head - tail))));
    }
    this.tm.instanceMatrix.needsUpdate = true;
    // casquillos
    for (let i = 0; i < this.maxC; i++) {
      const c = this.C[i]; if (c.life <= 0) continue;
      c.life -= dt;
      if (c.life <= 0) { this.cm.setMatrixAt(i, _m1.makeScale(0, 0, 0)); continue; }
      if (!c.rest) {
        c.v.y -= 22 * dt; c.p.addScaledVector(c.v, dt); c.r.x += dt * 18; c.r.y += dt * 11;
        if (c.p.y < c.gy + 0.01 && c.v.y < 0) { c.p.y = c.gy + 0.01; c.v.y *= -0.35; c.v.x *= 0.5; c.v.z *= 0.5; if (c.b++ < 1) BUS.emit('casing', c.p); if (Math.abs(c.v.y) < 0.6) { c.rest = true; c.r.x = Math.PI / 2; } }
      }
      _e1.set(c.r.x, c.r.y, 0); _q1.setFromEuler(_e1);
      this.cm.setMatrixAt(i, _m1.compose(c.p, _q1, _v1.set(1, 1, 1)));
    }
    this.cm.instanceMatrix.needsUpdate = true;
    // escombros
    for (let i = 0; i < this.maxF; i++) {
      const f = this.F[i]; if (f.life <= 0) continue;
      f.life -= dt;
      if (f.life <= 0) { this.fm.setMatrixAt(i, _m1.makeScale(0, 0, 0)); continue; }
      if (!f.rest) {
        f.v.y -= 22 * dt; f.p.addScaledVector(f.v, dt); f.r.addScaledVector(f.rv, dt);
        if (f.p.y < f.gy + f.s * 0.5 && f.v.y < 0) { f.p.y = f.gy + f.s * 0.5; f.v.y *= -0.3; f.v.x *= 0.5; f.v.z *= 0.5; f.rv.multiplyScalar(0.5); if (Math.abs(f.v.y) < 1) f.rest = true; }
      }
      const s = f.s * Math.min(1, f.life / 0.8);
      _e1.set(f.r.x, f.r.y, f.r.z); _q1.setFromEuler(_e1);
      this.fm.setMatrixAt(i, _m1.compose(f.p, _q1, _v1.set(s, s * 0.7, s)));
    }
    this.fm.instanceMatrix.needsUpdate = true;
    // charcos que crecen
    for (const d of [this.splats]) for (let i = d.grow.length - 1; i >= 0; i--) {
      const g = d.grow[i]; g.t += dt; const k = Math.min(1, g.t / g.dur);
      d.m.setMatrixAt(g.i, _m1.compose(g.p, g.q, _v1.set(g.s * (0.2 + 0.8 * Math.sqrt(k)), g.s * (0.2 + 0.8 * Math.sqrt(k)) * 0.85, 1)));
      d.m.instanceMatrix.needsUpdate = true;
      if (k >= 1) d.grow.splice(i, 1);
    }
    // luces
    for (const L of this.lights) { if (!L.on) continue; L.t += dt; const k = 1 - L.t / L.dur; if (k <= 0) { L.on = false; L.l.intensity = 0; } else L.l.intensity = L.i0 * k * k; }
  },

  decal(D, pos, normal, size, color, grow) {
    const i = D.cur; D.cur = (D.cur + 1) % D.n;
    _q1.setFromUnitVectors(_v2.set(0, 0, 1), normal);
    _q2.setFromAxisAngle(_v2.set(0, 0, 1), frand(0, TAU)); _q1.multiply(_q2);
    _v3.copy(pos).addScaledVector(normal, 0.008 + (D === this.splats ? 0.002 : 0));
    D.m.setMatrixAt(i, _m1.compose(_v3, _q1, _v1.set(size, size * frand(0.75, 1.05), 1)));
    D.m.setColorAt(i, _c1.set(color));
    D.m.count = Math.max(D.m.count, i + 1);
    D.m.instanceMatrix.needsUpdate = true; if (D.m.instanceColor) D.m.instanceColor.needsUpdate = true;
    if (grow) D.grow.push({ i, p: _v3.clone(), q: _q1.clone(), s: size, t: 0, dur: grow });
    else { const gi = D.grow.findIndex((g) => g.i === i); if (gi >= 0) D.grow.splice(gi, 1); }
  },
  flashLight(pos, color, intensity, dist, dur) {
    if (!this.lights.length) return;
    const L = this.lights[this.lCursor]; this.lCursor = (this.lCursor + 1) % this.lights.length;
    L.l.position.copy(pos); L.l.color.set(color); L.l.distance = dist; L.i0 = intensity; L.l.intensity = intensity; L.t = 0; L.dur = dur; L.on = true;
  },
  tracer(a, b, k = 1) {
    if (!this.inited) return;
    const t = this.T[this.tCursor]; this.tCursor = (this.tCursor + 1) % this.maxTr;
    t.a.copy(a); t.b.copy(b); t.len = a.distanceTo(b); t.t = 0; t.dur = clamp(t.len / 420, 0.025, 0.2); t.w = 0.018 * (0.6 + 0.4 * k);
  },
  muzzle(pos, dir, W) {
    if (!this.inited) return;
    const k = W && W.flash != null ? W.flash : 1;
    this.glow.spawn(pos.x, pos.y, pos.z, dir.x * 2, dir.y * 2, dir.z * 2, 0.32 * k, 1.2, 0.05, 0xffd8a0, 1);
    this.glow.spawn(pos.x + dir.x * 0.12, pos.y + dir.y * 0.12, pos.z + dir.z * 0.12, dir.x * 6, dir.y * 6, dir.z * 6, 0.18 * k, 0.6, 0.04, 0xffb060, 0.9);
    this.smoke.spawn(pos.x, pos.y, pos.z, dir.x * 0.8 + frand(-0.2, 0.2), 0.3 + dir.y * 0.8, dir.z * 0.8 + frand(-0.2, 0.2), 0.12 * k, 0.9, frand(0.5, 0.8), 0xb8b4ac, 0.22);
    this.flashLight(pos, 0xffc070, 2.2 * k, 9, 0.06);
  },
  casing(f) {
    if (!this.inited || !f.view) return;
    const c = this.C[this.cCursor]; this.cCursor = (this.cCursor + 1) % this.maxC;
    const right = _v1.set(Math.cos(f.yaw), 0, -Math.sin(f.yaw)), fwd = _v2.set(-Math.sin(f.yaw), 0, -Math.cos(f.yaw));
    if (VM.active && f === G.local) VM.ejectWorld(c.p);
    else { f.view.muzzleWorld(c.p); c.p.addScaledVector(fwd, -0.45).addScaledVector(right, 0.06); }
    c.v.copy(right).multiplyScalar(frand(2.2, 3.4)).add(_v3.set(0, frand(1.8, 3), 0)).add(_v4.copy(f.vel).multiplyScalar(0.7));
    c.r.set(0, f.yaw, 0); c.life = 4; c.rest = false; c.b = 0;
    c.gy = this.groundAt(c.p);
  },
  // escombros por material
  chunks(pos, color, n, size, speed, dir) {
    const gy = this.groundAt(pos);
    for (let i = 0; i < n; i++) {
      const f = this.F[this.fCursor]; this.fm.setColorAt(this.fCursor, _c1.set(color).multiplyScalar(frand(0.75, 1.1))); this.fCursor = (this.fCursor + 1) % this.maxF;
      f.p.copy(pos).add(_v1.set(frand(-0.1, 0.1), frand(-0.1, 0.1), frand(-0.1, 0.1)));
      f.v.set(frand(-1, 1), frand(0.2, 1.3), frand(-1, 1)).multiplyScalar(speed); if (dir) f.v.addScaledVector(dir, speed * 0.8);
      f.r.set(frand(0, 3), frand(0, 3), frand(0, 3)); f.rv.set(frand(-10, 10), frand(-10, 10), frand(-10, 10));
      f.s = size * frand(0.5, 1.2); f.life = frand(2.5, 4.5); f.rest = false; f.gy = gy;
    }
    if (this.fm.instanceColor) this.fm.instanceColor.needsUpdate = true;
  },
  dust(pos, n, color, size, speed, up = 0.6, life = 1.4) {
    for (let i = 0; i < n; i++) this.smoke.spawn(pos.x + frand(-0.1, 0.1), pos.y + frand(-0.05, 0.1), pos.z + frand(-0.1, 0.1), frand(-1, 1) * speed, frand(0.2, 1) * speed * up + 0.3, frand(-1, 1) * speed, size * frand(0.7, 1.3), size * 1.6, life * frand(0.7, 1.2), color, 0.45, { drag: 2.6, grav: -0.02, rv: frand(-0.6, 0.6) });
  },
  sparks(pos, n, dir, speed = 7) {
    for (let i = 0; i < n; i++) {
      const vx = frand(-1, 1) + (dir ? dir.x * 1.5 : 0), vy = frand(-0.3, 1) + (dir ? dir.y * 1.5 : 0), vz = frand(-1, 1) + (dir ? dir.z * 1.5 : 0);
      this.glow.spawn(pos.x, pos.y, pos.z, vx * speed * frand(0.4, 1), vy * speed * frand(0.4, 1), vz * speed * frand(0.4, 1), frand(0.035, 0.06), -0.05, frand(0.12, 0.35), 0xffc070, 1, { grav: 0.6, drag: 1.5 });
    }
  },
  // impacto de bala en el escenario
  impact(pos, normal, surface, k = 1) {
    if (!this.inited) return;
    const n = normal || UP;
    const p = _v5.copy(pos).addScaledVector(n, 0.03);
    switch (surface) {
      case 'metal': this.sparks(p, Math.ceil(6 * k), n, 6); this.dust(p, 1, 0x6a6a68, 0.12, 0.6, 0.6, 0.6); break;
      case 'wood': this.chunks(p, 0x8a6a42, Math.ceil(2 * k), 0.05, 2.2, n); this.dust(p, Math.ceil(2 * k), 0xa08a6a, 0.16, 0.8); break;
      case 'dirt': this.dust(p, Math.ceil(3 * k), 0x7a6a50, 0.22, 1.2, 1.2); this.chunks(p, 0x5a4a34, Math.ceil(2 * k), 0.04, 2.5, n); break;
      case 'sand': this.dust(p, Math.ceil(3 * k), 0xb8a47a, 0.24, 1.0, 1.0); break;
      default: this.dust(p, Math.ceil(2 * k), 0x9a968e, 0.18, 1.0); this.chunks(p, 0x8a867e, Math.ceil(2 * k), 0.035, 2.4, n); if (FX_RNG.next() < 0.4) this.sparks(p, 2, n, 4);
    }
    if (k >= 0.45) this.decal(this.holes, pos, n, 0.07 + 0.03 * k, surface === 'metal' ? 0x2a2a2a : surface === 'wood' ? 0x2a1d12 : 0x1e1c1a);
  },
  debris(c, color, surface, n, size) {
    if (!this.inited) return;
    this.chunks(c, color, n, size, 4.5);
    this.dust(c, 6, surface === 'sand' ? 0xb8a47a : surface === 'wood' ? 0xa08a6a : 0x9a948a, 0.5, 2.2, 0.6, 2.2);
  },
  rocketTrail(pos, vel) {
    if (!this.inited) return;
    this.smoke.spawn(pos.x, pos.y, pos.z, frand(-0.3, 0.3) - vel.x * 0.02, frand(0, 0.4), frand(-0.3, 0.3) - vel.z * 0.02, 0.22, 1.4, frand(0.9, 1.5), 0xc8c4bc, 0.5, { drag: 1.2, grav: -0.02 });
    this.glow.spawn(pos.x, pos.y, pos.z, -vel.x * 0.05, -vel.y * 0.05, -vel.z * 0.05, 0.3, -0.6, 0.06, 0xffa040, 1);
  },
  explosion(pos, r, weapon) {
    if (!this.inited) return;
    const s = r / 6;
    // bola de fuego y destello
    this.glow.spawn(pos.x, pos.y + 0.2, pos.z, 0, 0.5, 0, 2.4 * s, 9 * s, 0.14, 0xfff0c8, 1);
    for (let i = 0; i < 9; i++) this.glow.spawn(pos.x + frand(-0.4, 0.4) * s, pos.y + frand(0, 0.6) * s, pos.z + frand(-0.4, 0.4) * s, frand(-4, 4) * s, frand(1, 5) * s, frand(-4, 4) * s, frand(1.0, 1.8) * s, 2.2 * s, frand(0.25, 0.5), FX_RNG.pick([0xff9a3a, 0xffb050, 0xff7a2a]), 0.9, { drag: 3 });
    // humo denso que sube y se queda
    for (let i = 0; i < 12; i++) this.smoke.spawn(pos.x + frand(-1, 1) * s, pos.y + frand(0, 1) * s, pos.z + frand(-1, 1) * s, frand(-2, 2) * s, frand(1.5, 4) * s, frand(-2, 2) * s, frand(1.2, 2.2) * s, 1.6 * s, frand(2.6, 4.2), FX_RNG.pick([0x5a554e, 0x6a645c, 0x48443e]), 0.6, { drag: 1.8, grav: -0.04, rv: frand(-0.4, 0.4) });
    // anillo de polvo a ras de suelo
    const gy = this.groundAt(pos);
    if (gy > -900 && pos.y - gy < r * 0.7) {
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; this.smoke.spawn(pos.x + Math.cos(a) * 0.5, gy + 0.25, pos.z + Math.sin(a) * 0.5, Math.cos(a) * 9 * s, 0.4, Math.sin(a) * 9 * s, 0.8 * s, 2.4 * s, frand(1.2, 1.9), 0x8a7e6a, 0.55, { drag: 3.2 }); }
      this.decal(this.scorches, _v4.set(pos.x, gy, pos.z), UP, r * 0.7, 0x141210);
    }
    this.chunks(pos, 0x4a4640, 10, 0.12 * s + 0.05, 7 * s);
    this.sparks(pos, 18, null, 12 * s);
    this.flashLight(_v4.copy(pos).setY(pos.y + 0.8), 0xffa850, 9, 22 * s, 0.35);
  },
  // sangre sobria (o polvo si está desactivada)
  hitFx(info) {
    if (!this.inited) return;
    const g = this.gore, p = info.point || info.target.centerPos(_v5);
    const k = clamp((info.damage || 10) / 30, 0.4, 2.2) * (info.part === 'head' ? 1.4 : 1);
    const dir = info.impulse && info.impulse.lengthSq() > 1e-6 ? _v6.copy(info.impulse).normalize() : null;
    if (g.blood <= 0) { this.dust(p, 2, 0x8a8478, 0.14, 0.7, 0.8, 0.6); return; }
    const b = g.blood;
    // mancha en el uniforme (se queda en el soldado y en su cadáver)
    const tv = info.target && (info.target.view || (info.target.corpse && info.target.corpse.view));
    if (tv && tv.addWound && info.point && (info.kind === 'bullet' || info.kind === 'explosion')) tv.addWound(info.point, info.kind === 'bullet' ? dir : null, 0.07 + 0.045 * k);
    this.soft.spawn(p.x, p.y, p.z, dir ? dir.x * 0.6 : 0, 0.15, dir ? dir.z * 0.6 : 0, 0.22 * k, 0.9 * k, 0.32, 0x5a0808, 0.75);
    if (b > 1) this.soft.spawn(p.x, p.y, p.z, dir ? dir.x * 1.4 : 0, 0.3, dir ? dir.z * 1.4 : 0, 0.18 * k, 1.4 * k, 0.45, 0x4a0606, 0.6);
    const n = Math.round(3 * k * b);
    const gy = this.groundAt(p);
    for (let i = 0; i < n; i++) {
      const vx = (dir ? dir.x * 2.5 : 0) + frand(-1, 1), vy = frand(0.2, 2), vz = (dir ? dir.z * 2.5 : 0) + frand(-1, 1);
      this.soft.spawn(p.x, p.y, p.z, vx, vy, vz, frand(0.03, 0.05), 0, frand(0.6, 1.1), BLOOD[i % 3], 0.95, { grav: 1, drag: 0.4, gy, flags: 1 });
    }
    // salpicadura en la pared detrás del objetivo
    if (dir && FX_RNG.next() < 0.5 * b) {
      const h = PHYS.raycast(p, dir, 2.2, {});
      if (h) this.decal(this.splats, h.point, h.normal, 0.35 * k * (b > 1 ? 1.4 : 1), BLOOD[1]);
    }
  },
  fleshHit(p, d, k) { if (this.gore.blood > 0 && this.inited) this.soft.spawn(p.x, p.y, p.z, d.x * 0.4, 0.1, d.z * 0.4, 0.16 * k, 0.6, 0.3, 0x5a0808, 0.65); else this.dust(p, 1, 0x8a8478, 0.12, 0.5); },
  bloodPool(pos) {
    if (!this.inited || !this.gore.pools) return;
    const gy = this.groundAt(pos); if (gy < -900 || pos.y - gy > 0.7) return;
    this.decal(this.splats, _v4.set(pos.x, gy, pos.z), UP, frand(0.9, 1.3), 0x3e0606, 4.5);
  },
  gibs() { },
};

