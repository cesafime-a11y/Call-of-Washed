// ---- 09_maps.js ----
// =====================================================================
// MAPAS (sistema) — material de bloques con patrones procedurales, carga,
// constructor de estructuras (casas, muros con huecos, escaleras, sacos
// de arena, contenedores, vehículos destruidos, alambre de púas), objetos
// destructibles, barriles explosivos, banderas de Dominio, navegación
// automática para bots (con puntos de cobertura) y minimapa
// =====================================================================

// ---------------- material de bloques ----------------
const BLOCK_BUMP = { value: 1 };   // 0 = sin relieve (calidad baja)
function makeBlockMaterial() {
  const m = new THREE.MeshLambertMaterial({ color: 0xffffff });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBump = BLOCK_BUMP; sh.uniforms.uWet = BLOCK_ENV.wet; sh.uniforms.uTime = BLOCK_ENV.time; sh.uniforms.uRefl = BLOCK_ENV.refl;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aPattern;\nvarying vec3 vObj; varying vec3 vObjN; varying vec3 vScl; varying vec3 vLW; varying float vPat;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position; vObjN = normal; vPat = aPattern;\nvScl = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));\nvLW = (instanceMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vObj; varying vec3 vObjN; varying vec3 vScl; varying vec3 vLW; varying float vPat;
uniform float uBump; uniform float uWet; uniform float uTime; uniform vec3 uRefl;
float gPud = 0.0;
vec3 bumpPerturb(vec3 sp, vec3 sn, vec2 dH, float fd) {
  vec3 sx = normalize(dFdx(sp)), sy = normalize(dFdy(sp));
  vec3 r1 = cross(sy, sn), r2 = cross(sn, sx);
  float det = dot(sx, r1) * fd;
  vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
  vec3 nn = abs(det) * sn - grad;
  float ln = dot(nn, nn);
  return (ln > 1e-8 && abs(det) > 1e-6) ? nn * inversesqrt(ln) : sn;
}
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ return 0.6 * vn(p) + 0.3 * vn(p * 2.1 + 3.7) + 0.1 * vn(p * 4.3 + 7.1); }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
      vec3 an = abs(vObjN);
      vec2 uvw; vec2 sz; vec2 gp;
      bool top = vObjN.y > 0.5, side = an.y < 0.5;
      if (an.y > 0.5) { uvw = vObj.xz; sz = vScl.xz; gp = vLW.xz; }
      else if (an.x > 0.5) { uvw = vObj.zy; sz = vScl.zy; gp = vec2(vLW.z, vLW.y); }
      else { uvw = vObj.xy; sz = vScl.xy; gp = vLW.xy; }
      vec2 de = (0.5 - abs(uvw)) * sz;
      float edge = min(de.x, de.y);
      vec3 base = diffuseColor.rgb, col = base;
      float n1 = fbm(gp * 1.7), n2 = vn(gp * 9.0);
      float bumpH = 0.3 * n1;
      int P = int(vPat + 0.5); float tileK = step(0.1, fract(vPat));
      if (P == 1 || P == 14) { // tierra / pasto
        col *= 0.78 + 0.38 * fbm(gp * 0.45) + 0.08 * n2;
        if (P == 14 && top) col = mix(col, col * vec3(0.8, 1.08, 0.7), smoothstep(0.35, 0.75, fbm(gp * 0.3 + 9.0)));
        if (side) col *= 0.82;
        bumpH = 0.55 * fbm(gp * 2.6) + 0.45 * n2;
      } else if (P == 2) { // franjas de peligro
        float st = step(0.5, fract((vLW.x + vLW.z) * 1.1 + vLW.y * 1.1));
        col = side ? mix(vec3(0.08), vec3(0.85, 0.66, 0.1), st) : col * (0.9 + 0.1 * n2);
      } else if (P == 3) { // caja de madera
        float pl = smoothstep(0.42, 0.48, abs(fract(gp.y * 3.2) - 0.5));
        col *= (0.86 + 0.14 * vn(vec2(gp.x * 30.0, floor(gp.y * 3.2)))) * (1.0 - 0.3 * pl);
        float fr = 1.0 - smoothstep(0.07, 0.1, edge);
        col = mix(col, col * 0.62, fr);
        bumpH = 0.5 * (1.0 - pl) + 0.7 * fr;
      } else if (P == 4) { // concreto
        col *= 0.84 + 0.16 * n1 + 0.06 * n2;
        vec2 pn = abs(fract(gp / 2.0) - 0.5);
        col *= 1.0 - 0.2 * smoothstep(0.475, 0.5, max(pn.x, pn.y));
        bumpH = 0.9 * (1.0 - smoothstep(0.47, 0.5, max(pn.x, pn.y))) + 0.55 * n2 + 0.3 * n1;
        if (side) col *= 0.9 - 0.12 * smoothstep(0.4, 0.0, vLW.y - (vLW.y - (vObj.y + 0.5) * vScl.y));
      } else if (P == 5) { // ladrillo
        float row = floor(gp.y / 0.22), off = mod(row, 2.0) * 0.25;
        vec2 bq = vec2(fract((gp.x + off) / 0.5), fract(gp.y / 0.22));
        float mortar = step(bq.x, 0.04) + step(bq.y, 0.09);
        float bv = h21(vec2(floor((gp.x + off) / 0.5), row));
        col *= (0.82 + 0.25 * bv) * (0.92 + 0.12 * n2);
        col = mix(col, vec3(0.62, 0.58, 0.52) * 0.85, clamp(mortar, 0.0, 1.0) * (side ? 0.8 : 0.0));
        bumpH = 1.5 * (1.0 - clamp(mortar, 0.0, 1.0)) + 0.35 * n2 + 0.3 * bv;
      } else if (P == 6) { // yeso / estuco
        col *= 0.86 + 0.14 * n1 + 0.04 * n2;
        if (side) { float b = clamp((vObj.y + 0.5) * vScl.y, 0.0, 9.0); col *= 0.72 + 0.28 * smoothstep(0.0, 0.9, b); col = mix(col, col * vec3(0.8, 0.74, 0.66), smoothstep(0.55, 0.85, fbm(gp * 0.6 + 4.0)) * 0.6); }
        bumpH = 0.8 * n2 + 0.5 * n1;
      } else if (P == 7) { // sacos de arena
        float row = floor(gp.y / 0.2), off = mod(row, 2.0) * 0.3;
        vec2 bq = vec2(fract((gp.x + off) / 0.6), fract(gp.y / 0.2));
        float bulge = sin(bq.x * 3.14159) * sin(bq.y * 3.14159);
        col *= (0.62 + 0.45 * bulge) * (0.9 + 0.1 * n2) * (0.92 + 0.12 * h21(vec2(floor((gp.x + off) / 0.6), row)));
        if (top) col = base * (0.8 + 0.25 * vn(gp * 3.0));
        bumpH = 1.7 * bulge + 0.3 * n2;
      } else if (P == 8) { // metal corrugado (contenedores)
        float rib = smoothstep(0.2, 0.8, abs(fract(gp.x * 3.5) - 0.5) * 2.0);
        col *= side ? (0.82 + 0.22 * rib) : (0.9 + 0.1 * n2);
        col = mix(col, vec3(0.42, 0.25, 0.14), smoothstep(0.62, 0.9, fbm(gp * 0.9 + 2.0)) * 0.55);
        col *= 1.0 - 0.25 * (1.0 - smoothstep(0.03, 0.09, edge));
        bumpH = side ? 1.9 * rib + 0.2 * n2 : 0.4 * n2;
      } else if (P == 9) { // asfalto
        col *= 0.8 + 0.2 * n1 + 0.1 * n2;
        col = mix(col, col * 0.7, smoothstep(0.6, 0.85, fbm(gp * 0.25)));
        bumpH = 0.9 * n2 + 0.4 * n1;
      } else if (P == 10) { // tablones
        float pl = smoothstep(0.44, 0.5, abs(fract(gp.y * 5.0) - 0.5));
        col *= (0.82 + 0.2 * vn(vec2(gp.x * 2.0, floor(gp.y * 5.0) * 7.0))) * (1.0 - 0.3 * pl) * (0.94 + 0.08 * n2);
        bumpH = 1.3 * (1.0 - pl) + 0.45 * n2;
      } else if (P == 11) { // tejas
        float row = floor(gp.y / 0.25);
        float t = fract((gp.x + mod(row, 2.0) * 0.15) / 0.3);
        col *= (0.8 + 0.2 * smoothstep(0.0, 0.2, fract(gp.y / 0.25))) * (0.9 + 0.1 * h21(vec2(floor(gp.x / 0.3), row))) * (1.0 - 0.15 * step(0.92, t));
        bumpH = 1.3 * smoothstep(0.0, 0.2, fract(gp.y / 0.25)) - 0.9 * step(0.92, t) + 0.3 * n2;
      } else if (P == 12) { // empedrado
        float row = floor(gp.y / 0.32), off = mod(row, 2.0) * 0.2;
        vec2 bq = vec2(fract((gp.x + off) / 0.4), fract(gp.y / 0.32));
        float gap = smoothstep(0.0, 0.12, min(min(bq.x, 1.0 - bq.x), min(bq.y, 1.0 - bq.y)));
        col *= (0.55 + 0.45 * gap) * (0.85 + 0.25 * h21(vec2(floor((gp.x + off) / 0.4), row)));
        bumpH = 1.8 * gap + 0.5 * h21(vec2(floor((gp.x + off) / 0.4), row)) + 0.3 * n2;
      } else if (P == 13) { // rejilla
        vec2 g2 = abs(fract(gp * 4.0) - 0.5);
        col *= 0.55 + 0.5 * step(0.38, max(g2.x, g2.y));
        bumpH = 0.6 * smoothstep(0.33, 0.43, max(g2.x, g2.y));
      } else {
        col *= 0.9 + 0.12 * n1;
      }
      if (!top && vObjN.y < -0.5) col *= 0.7;
      col *= 1.0 - (1.0 - (0.8 + 0.2 * smoothstep(0.0, 0.14, edge))) * (1.0 - 0.7 * tileK);
      if (uWet > 0.0) { // lluvia: superficies oscuras, charcos en el suelo y pie de pared empapado
        gPud = top ? smoothstep(0.44, 0.64, fbm(gp * 0.3 + 17.0)) * (1.0 - smoothstep(0.6, 2.4, vLW.y)) : 0.0;
        float wetM = top ? 0.45 + 0.55 * gPud : 0.28 * (1.0 - smoothstep(0.0, 1.3, vLW.y));
        col *= 1.0 - 0.4 * wetM * uWet;
        vec2 rp = gp * 2.4, ri = floor(rp), rf = fract(rp) - 0.5; float ph = h21(ri), rt = fract(uTime * 0.8 + ph), rr = length(rf);
        bumpH += uWet * gPud * step(0.45, ph) * sin((rr - rt * 0.5) * 42.0) * smoothstep(0.5, 0.0, rr) * (1.0 - rt) * 0.7;
        gPud *= uWet;
      }
      diffuseColor.rgb = col;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      { float bk = uBump * (1.0 - smoothstep(12.0, 38.0, length(vViewPosition))) * 0.24;
        vec2 dH = vec2(dFdx(bumpH), dFdy(bumpH)) * bk;
        if (bk > 0.0) normal = bumpPerturb(-vViewPosition, normal, dH, faceDirection); }`)
      .replace('#include <opaque_fragment>', `if (gPud > 0.0) { float fr = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 3.0); outgoingLight += uRefl * gPud * (0.1 + 0.9 * fr); }
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'cowblocks5';
  return m;
}

// ---------------- sistema de mapa ----------------
const MapSys = {
  id: null, def: null, inst: null, mat: null, decor: null, decoBatch: null, nav: null, center: new THREE.Vector3(),
  spawns: { 0: [], 1: [], ffa: [] }, lamps: [], stations: [], dom: [], standDefs: [], wires: [], barrels: [], flags: [], anim: [], bounds: { x0: -40, z0: -40, x1: 40, z1: 40 }, minimap: null,

  load(id) {
    this.unload();
    const def = MAPS[id] || MAPS[MAP_ORDER[0]];
    this.id = MAPS[id] ? id : MAP_ORDER[0]; this.def = def;
    PHYS.clear();
    this.spawns = { 0: [], 1: [], ffa: [] }; this.stations = []; this.dom = []; this.standDefs = []; this.wires = []; this.barrels = []; this.flags = []; this.anim = []; this.propDefs = []; this.lamps = [];
    this.decor = new THREE.Group(); G.root.add(this.decor);
    const B = makeBuilder(this);
    def.build(B);
    B.finish();
    PHYS.finalize();
    this.buildMesh();
    this.buildDecor();
    WorldItems.buildStands(G.mode && G.mode.ladder ? [] : this.standDefs);
    if (typeof Props !== 'undefined') Props.build(this.propDefs);
    applyTheme(envTheme(def.theme, G.matchCfg && G.matchCfg.env));
    const b = this.bounds; this.center.set((b.x0 + b.x1) / 2, 0, (b.z0 + b.z1) / 2);
    this.nav = buildNav();
    this.minimap = buildMinimap();
    if (!this.spawns.ffa.length) this.spawns.ffa = [...this.spawns[0], ...this.spawns[1]];
    this.fixSpawns();
  },
  // aleja los puntos de aparición de bloques cercanos (una caja a medio metro de la cámara tapa la pantalla al reaparecer)
  fixSpawns(minD = 1.35) {
    const seen = new Set(), solid = PHYS.blocks.filter((bl) => bl.kind !== 'floor' && bl.kind !== 'bound' && !bl.noCollide);
    const near = (x, y, z) => {
      let best = 99, bb = null;
      for (const bl of solid) {
        if (bl.max.y < y + 0.15 || bl.min.y > y + 1.9) continue;
        const dx = Math.max(bl.min.x - x, 0, x - bl.max.x), dz = Math.max(bl.min.z - z, 0, z - bl.max.z), d = Math.hypot(dx, dz);
        if (d < best) { best = d; bb = bl; }
      }
      return { d: best, b: bb };
    };
    const bd = this.bounds;
    for (const key of Object.keys(this.spawns)) for (const sp of this.spawns[key]) {
      if (seen.has(sp)) continue; seen.add(sp);
      const d0 = near(sp.x, sp.y, sp.z).d; if (d0 >= minD) continue;
      // busca el punto más cercano al original con espacio libre (anillos de 0.35 m, 16 direcciones); si no hay, el de más espacio
      let best = null;
      for (let r = 0.35; r <= 3 && !(best && best.d >= minD); r += 0.35) for (let k = 0; k < 16; k++) {
        const a = k / 16 * TAU, x = sp.x + Math.cos(a) * r, z = sp.z + Math.sin(a) * r;
        if (x < bd.x0 + 1 || x > bd.x1 - 1 || z < bd.z0 + 1 || z > bd.z1 - 1) continue;
        const g = PHYS.groundBelow(x, z, sp.y + 0.6, 3); if (!g || Math.abs(g.y - sp.y) > 0.3) continue;
        const d = near(x, sp.y, z).d; if (d > d0 + 0.15 && (!best || (d >= minD && best.d < minD) || (best.d < minD && d > best.d))) best = { x, z, d };
      }
      if (best) { sp.x = best.x; sp.z = best.z; }
    }
  },
  unload() {
    if (this.inst) { G.root.remove(this.inst); this.inst.geometry.dispose(); this.inst.dispose(); this.inst = null; }
    if (this.decor) { G.root.remove(this.decor); this.decor.traverse((o) => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.material && !o.material.userData?.shared) o.material.dispose(); }); this.decor = null; }
    WorldItems.clear(); if (typeof Env !== 'undefined') Env.clear();
    if (typeof Props !== 'undefined') Props.clear();
    if (typeof Rubble !== 'undefined') Rubble.dispose();
  },
  buildMesh() {
    const blocks = PHYS.blocks.filter((b) => !b.noRender);
    if (!this.mat) this.mat = makeBlockMaterial();
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const pat = new Float32Array(Math.max(1, blocks.length));
    blocks.forEach((b, i) => { pat[i] = b.pattern + (b.tile ? 0.25 : 0); });
    geo.setAttribute('aPattern', new THREE.InstancedBufferAttribute(pat, 1));
    const im = new THREE.InstancedMesh(geo, this.mat, Math.max(1, blocks.length));
    im.castShadow = G.quality.shadows; im.receiveShadow = G.quality.shadows;
    blocks.forEach((b, i) => { b.instance = i; this.writeInstance(b); im.setColorAt(i, _c1.set(b.color)); });
    im.count = blocks.length;
    this.inst = im; this.renderBlocks = blocks;
    im.instanceMatrix.needsUpdate = true;
    G.root.add(im);
  },
  // pulido gráfico: hierba, piedras y matojos esparcidos sobre tierra y pasto (solo visual, sin colisión)
  scatterGround() {
    const D = this.decoBatch, b = this.bounds; if (!D || !b) return;
    const q = G.quality || {}; if (q.dust === 0) return;
    const rng = new RNG(hash32('scatter', this.id)), area = Math.max(1, (b.x1 - b.x0) * (b.z1 - b.z0));
    const n = Math.min(520, Math.round(area / 9));
    for (let i = 0; i < n; i++) {
      const x = rng.range(b.x0, b.x1), z = rng.range(b.z0, b.z1);
      const g = PHYS.groundBelow(x, z, 3, 6);
      if (!g || g.block.ramp || (g.block.pattern !== PAT.DIRT && g.block.pattern !== PAT.GRASS) || g.y > 0.3) continue;
      const y = g.y;
      if (PHYS.overlapAABB(x - 0.3, y + 0.03, z - 0.3, x + 0.3, y + 0.5, z + 0.3)) continue;
      const grassy = g.block.pattern === PAT.GRASS, roll = rng.next();
      if (roll < (grassy ? 0.7 : 0.32)) {
        const base = shade(rng.pick(grassy ? [0x7a8140, 0x8a8c4a, 0x6d7638] : [0x9a8a58, 0xa8985f, 0x8a7a4a]), rng.range(-0.06, 0.03)), tip = shade(base, 0.05);
        const h = rng.range(0.22, 0.5) * (grassy ? 1.15 : 0.8);
        for (let k = 0; k < 4; k++) {
          const a = k * 1.6 + rng.range(0, 1);
          D.add(GEO.cone(0.035, h * rng.range(0.7, 1), 4), x + Math.cos(a) * 0.05, y + h * 0.45, z + Math.sin(a) * 0.05, k & 1 ? tip : base, { rz: Math.cos(a) * 0.22, rx: Math.sin(a) * 0.22, order: 'YXZ' });
        }
      } else if (roll < 0.9) {
        const r = rng.range(0.06, 0.2), c = shade(rng.pick([0x7d776a, 0x8a8478, 0x6c6860]), rng.range(-0.1, 0.06));
        D.add(GEO.sphere(1, 5, 3), x, y + r * 0.3, z, c, { sx: r * rng.range(0.9, 1.5), sy: r * 0.6, sz: r * rng.range(0.9, 1.4), ry: rng.range(0, 3) });
        if (rng.next() < 0.4) D.add(GEO.sphere(1, 5, 3), x + r * 1.2, y + r * 0.15, z + r * 0.5, shade(c, -0.08), { sx: r * 0.5, sy: r * 0.32, sz: r * 0.5 });
      } else {
        const h = rng.range(0.25, 0.5);
        D.add(GEO.cyl(0.012, 0.014, h, 4), x, y + h / 2, z, 0x6f5c40, { rz: rng.range(-0.3, 0.3) });
        D.add(GEO.sphere(1, 5, 3), x, y + h, z, 0x7a6a3c, { sx: 0.04, sy: 0.05, sz: 0.04 });
      }
    }
  },
  buildDecor() {
    try { this.scatterGround(); } catch (e) { reportError(e); }
    const g = this.decoBatch.build();
    const m = new THREE.Mesh(g, MAT.vcol()); m.castShadow = G.quality.shadows; m.receiveShadow = G.quality.shadows;
    this.decor.add(m); this.decoMesh = m;
    this.decoBatch = null;
  },
  writeInstance(b) {
    if (b.instance < 0 || !this.inst) return;
    const im = this.inst;
    if (!b.active) { im.setMatrixAt(b.instance, _m1.makeScale(0, 0, 0)); return; }
    _v1.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
    _v2.set(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
    if (b.ramp) {
      const r = b.ramp, len = r.axis === 'x' ? _v2.x : _v2.z, h = _v2.y;
      const slope = Math.hypot(len, h), ang = Math.atan2(h, len);
      if (r.axis === 'x') { _q1.setFromAxisAngle(_v3.set(0, 0, 1), ang * r.dir); _v2.set(slope, 0.3, _v2.z); }
      else { _q1.setFromAxisAngle(_v3.set(1, 0, 0), -ang * r.dir); _v2.set(_v2.x, 0.3, slope); }
      const n = rampNormal(b, _v4);
      _v1.addScaledVector(n, -0.15);
    } else _q1.identity();
    im.setMatrixAt(b.instance, _m1.compose(_v1, _q1, _v2));
  },
  reset() {
    PHYS.resetBlocks();
    for (const b of PHYS.blocks) { this.writeInstance(b); if (b._stage) { b._stage = 0; this.setTint(b, 0); } }
    if (this.inst) this.inst.instanceMatrix.needsUpdate = true;
    for (const br of this.barrels) br.mesh.visible = true;
    PHYS.rebuildStatic();
  },
  update(dt) {
    for (const a of this.anim) a(G.realTime, dt);
  },
  slowAt(p) {
    for (const w of this.wires) if (p.x > w.x0 && p.x < w.x1 && p.z > w.z0 && p.z < w.z1 && p.y < w.y + 1.2 && p.y > w.y - 0.6) return CONFIG.MOVE.wireSlow;
    return 1;
  },
  inWire(x, z, y) { for (const w of this.wires) if (x > w.x0 - 0.3 && x < w.x1 + 0.3 && z > w.z0 - 0.3 && z < w.z1 + 0.3 && Math.abs(y - w.y) < 1.2) return true; return false; },
  // daño a destructibles: las balas apenas hacen mella en sacos y muros
  damageBlock(b, dmg, point, attacker, explosive) {
    if (!b || !b.destructible || !b.active) return;
    const wallMul = b.surface === 'wood' ? 0.5 : b.surface === 'metal' ? 0.4 : 0.12;
    const mul = explosive ? (b.tile ? 1.0 : b.kind === 'sandbag' ? 0.7 : 1.4) : (b.kind === 'barrel' ? 1 : b.kind === 'crate' ? 0.9 : b.kind === 'wood' ? 0.6 : b.kind === 'sandbag' ? 0.1 : wallMul);
    b.hp -= dmg * mul;
    if (b.hp <= 0) { this.destroyBlock(b, attacker, false); return; }
    // desgaste visible: el panel se oscurece y suelta polvo al cruzar cada umbral
    const r = b.hp / b.maxHp, st = r < 0.34 ? 2 : r < 0.67 ? 1 : 0;
    if (st !== b._stage) {
      b._stage = st; this.setTint(b, st);
      if (point) { FX.dust(point, 3, 0x9a948a, 0.2, 0.9); FX.debris(point, b.color, b.surface, 3, 0.07); }
    }
  },
  setTint(b, stage) {
    if (b.instance < 0 || !this.inst || !this.inst.instanceColor) return;
    _c1.set(b.color).multiplyScalar(stage === 0 ? 1 : stage === 1 ? 0.84 : 0.66);
    this.inst.setColorAt(b.instance, _c1); this.inst.instanceColor.needsUpdate = true;
  },
  destroyBlock(b, attacker, fromNet) {
    if (!b.active) return;
    PHYS.setActive(b, false);
    this.writeInstance(b); if (this.inst) this.inst.instanceMatrix.needsUpdate = true;
    const c = _v5.set((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
    if (b.kind === 'barrel') {
      const br = this.barrels.find((x) => x.block === b); if (br) br.mesh.visible = false;
      const B = CONFIG.BARREL;
      Combat.explode({ pos: c.clone(), radius: B.radius, damage: B.damage, push: B.push, owner: attacker || null, weapon: 'barrel', authoritative: !fromNet });
    } else {
      const size = Math.cbrt((b.max.x - b.min.x) * (b.max.y - b.min.y) * (b.max.z - b.min.z));
      FX.debris(c, b.color, b.surface, Math.min(16, 5 + Math.round(size * 6)), Math.max(0.12, size * 0.22));
      Rubble.spawn(c, b.color, b.tile ? 3 : 4, Math.max(0.14, size * 0.16), 2.4);
    }
    BUS.emit('blockBroken', b);
    if (NET.active && !fromNet) NET.queue('bb', [b.id, attacker ? attacker.slot : -1]);
  },
  explodeBlocks(pos, r, dmg, owner) {
    const list = PHYS.query(pos.x - r, pos.y - r, pos.z - r, pos.x + r, pos.y + r, pos.z + r, []);
    for (const b of list) {
      if (!b.destructible || !b.active) continue;
      const cx = clamp(pos.x, b.min.x, b.max.x), cy = clamp(pos.y, b.min.y, b.max.y), cz = clamp(pos.z, b.min.z, b.max.z);
      const d = Math.hypot(cx - pos.x, cy - pos.y, cz - pos.z);
      if (d < r) this.damageBlock(b, dmg * (1 - d / r) * 1.6, null, owner, true);
    }
  },
  blockById(id) { return PHYS.blocks.find((b) => b.id === id); },
};

// ---------------- utilidades geométricas ----------------
// rectángulo menos huecos → lista de rectángulos (fusionados por filas)
function rectMinus(r, holes) {
  const xs = new Set([r[0], r[2]]), zs = new Set([r[1], r[3]]);
  for (const h of holes) { for (const x of [h[0], h[2]]) if (x > r[0] && x < r[2]) xs.add(x); for (const z of [h[1], h[3]]) if (z > r[1] && z < r[3]) zs.add(z); }
  const X = [...xs].sort((a, b) => a - b), Z = [...zs].sort((a, b) => a - b);
  const rows = [];
  for (let j = 0; j < Z.length - 1; j++) {
    const runs = []; let cur = null;
    for (let i = 0; i < X.length - 1; i++) {
      const cx = (X[i] + X[i + 1]) / 2, cz = (Z[j] + Z[j + 1]) / 2;
      const inHole = holes.some((h) => cx > h[0] && cx < h[2] && cz > h[1] && cz < h[3]);
      if (!inHole) { if (cur && Math.abs(cur[2] - X[i]) < 1e-6) cur[2] = X[i + 1]; else { cur = [X[i], Z[j], X[i + 1], Z[j + 1]]; runs.push(cur); } }
      else cur = null;
    }
    rows.push(runs);
  }
  // fusionar verticalmente
  const out = [], open = [];
  for (const runs of rows) {
    for (const rr of runs) {
      const m = open.find((o) => Math.abs(o[0] - rr[0]) < 1e-6 && Math.abs(o[2] - rr[2]) < 1e-6 && Math.abs(o[3] - rr[1]) < 1e-6);
      if (m) m[3] = rr[3]; else { const n = rr.slice(); open.push(n); out.push(n); }
    }
  }
  return out;
}

// ---------------- constructor de mapas ----------------
const OPEN = { door: { w: 1.25, y0: 0, y1: 2.3 }, win: { w: 1.15, y0: 0.95, y1: 2.05 }, big: { w: 3.2, y0: 0, y1: 3.0 }, hole: { w: 2.2, y0: 0.35, y1: 2.5 }, slit: { w: 1.6, y0: 1.0, y1: 1.35 }, arch: { w: 2.0, y0: 0, y1: 2.6 } };
function makeBuilder(ms) {
  const D = (ms.decoBatch = new PartBatch());
  const rng = new RNG(hash32('map', ms.id));
  const blk = (x0, y0, z0, x1, y1, z1, o = {}) => PHYS.addBlock(makeBlock(x0, y0, z0, x1, y1, z1, o));
  const C = { // paleta
    plaster: [0xcdbb9c, 0xc4ae8a, 0xd6c8ad, 0xb9a88c, 0xc9b49a], brick: [0x9a5b44, 0x8c5240, 0xa36a50], concrete: 0x9a978f, concreteD: 0x7e7b74,
    sand: 0xa8915f, dirt: 0x8a7553, grass: 0x6d7445, asphalt: 0x4c4a47, cobble: 0x8c8478, wood: 0x7a5a3a, crate: 0x8a6a40, roof: 0x8a4a34, metal: 0x6b6e70,
  };
  const B = {
    rng, C,
    box: blk,
    deco(geo, x, y, z, color, o) { D.add(geo, x, y, z, color, o); },
    decoBox(x0, y0, z0, x1, y1, z1, color, o = {}) { D.add(GEO.box(1, 1, 1), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, color, { ...o, sx: Math.abs(x1 - x0), sy: Math.abs(y1 - y0), sz: Math.abs(z1 - z0) }); },
    ground(x0, z0, x1, z1, o = {}) {
      const y = o.y ?? 0, depth = o.depth ?? 2.2;
      for (const r of rectMinus([x0, z0, x1, z1], o.holes || [])) blk(r[0], y - depth, r[1], r[2], y, r[3], { pattern: o.pattern ?? PAT.DIRT, color: o.color ?? C.dirt, kind: 'floor' });
    },
    // placa (losa) con huecos
    slab(x0, z0, x1, z1, y0, y1, o = {}) { for (const r of rectMinus([x0, z0, x1, z1], o.holes || [])) blk(r[0], y0, r[1], r[2], y1, r[3], { pattern: o.pattern ?? PAT.CONCRETE, color: o.color ?? C.concrete, kind: o.kind || 'floor', hp: o.hp }); },
    // muro recto con huecos. axis 'x': de a0 a a1 en z=c; 'z': de a0 a a1 en x=c
    wall(axis, a0, a1, c, y0, h, t, o = {}) {
      const opens = (o.open || []).map((op) => { const T = OPEN[op.type] || OPEN.door; const w = op.w ?? T.w; return { s: op.at - w / 2, e: op.at + w / 2, y0: op.y0 ?? T.y0, y1: Math.min(h, op.y1 ?? T.y1) }; }).sort((a, b) => a.s - b.s);
      const mk = (s0, s1, ya, yb) => {
        if (s1 - s0 < 0.02 || yb - ya < 0.02) return;
        const opt = { pattern: o.pattern ?? PAT.PLASTER, color: o.color ?? C.plaster[0], kind: o.kind || 'wall', hp: o.hp };
        const put = (a, b2, y0_, y1_) => { if (axis === 'x') blk(a, y0_, c - t / 2, b2, y1_, c + t / 2, opt); else blk(c - t / 2, y0_, a, c + t / 2, y1_, b2, opt); };
        if (o.hp && o.hp < Infinity) {
          // muro destructible: paneles de ~1.5 m con vida propia; los explosivos abren huecos
          opt.tile = true;
          const T = CONFIG.DESTRUCT.tile, nx = Math.max(1, Math.round((s1 - s0) / T)), ny = Math.max(1, Math.round((yb - ya) / T));
          for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) put(s0 + (s1 - s0) * i / nx, s0 + (s1 - s0) * (i + 1) / nx, ya + (yb - ya) * j / ny, ya + (yb - ya) * (j + 1) / ny);
        } else put(s0, s1, ya, yb);
      };
      const full = (s0, s1) => {
        if (!o.jag) { mk(s0, s1, y0, y0 + h); return; }
        // borde superior roto (ruinas)
        for (let s = s0; s < s1 - 1e-3; s += 1.4) { const e = Math.min(s1, s + 1.4); mk(s, e, y0, y0 + h * (rng.next() < 0.5 ? rng.range(0.45, 0.85) : 1)); }
      };
      let cur = a0;
      for (const op of opens) {
        const s = clamp(op.s, a0, a1), e = clamp(op.e, a0, a1);
        if (s > cur) full(cur, s);
        if (e > s) { if (op.y0 > 0) mk(s, e, y0, y0 + op.y0); if (op.y1 < h && !o.jag) mk(s, e, y0 + op.y1, y0 + h); }
        cur = Math.max(cur, e);
      }
      if (cur < a1) full(cur, a1);
    },
    // escalera de peldaños sólidos. dir: '+x','-x','+z','-z' (hacia donde sube)
    stairs(x, z, dir, w, y0, y1, o = {}) {
      const n = Math.max(1, Math.ceil((y1 - y0) / (o.rise || 0.3))), rise = (y1 - y0) / n, run = o.run || 0.32;
      const sx = dir === '+x' ? 1 : dir === '-x' ? -1 : 0, sz = dir === '+z' ? 1 : dir === '-z' ? -1 : 0;
      for (let i = 0; i < n; i++) {
        const a = i * run, b = (i + 1) * run, top = y0 + rise * (i + 1);
        const opt = { pattern: o.pattern ?? PAT.CONCRETE, color: o.color ?? C.concreteD, kind: 'stairs' };
        const base = o.solidBase === false ? Math.max(y0, top - 0.4) : y0;
        if (sx) blk(x + Math.min(sx * a, sx * b), base, z - w / 2, x + Math.max(sx * a, sx * b), top, z + w / 2, opt);
        else blk(x - w / 2, base, z + Math.min(sz * a, sz * b), x + w / 2, top, z + Math.max(sz * a, sz * b), opt);
      }
      return { x: x + sx * n * run, z: z + sz * n * run, len: n * run };
    },
    // casa: x0<x1, z0<z1; lados n(-z) s(+z) w(-x) e(+x); open: {n:[[tipo, fracción, piso]], ...}
    house(x0, z0, x1, z1, o = {}) {
      const floors = o.floors || 1, H = o.h || 3.1;
      const pat = o.pattern ?? PAT.PLASTER, col = o.color ?? rng.pick(C.plaster);
      // madera y lámina son delgadas (las balas las atraviesan) y se rompen más fácil que el ladrillo
      const thin = pat === PAT.WOOD || pat === PAT.METAL, t = o.t || (thin ? 0.14 : 0.3);
      const D = CONFIG.DESTRUCT, whp = o.wallHp ?? (o.solidWalls ? undefined : pat === PAT.WOOD ? D.woodHp : pat === PAT.METAL ? D.sheetHp : D.wallHp);
      const sides = { n: ['x', x0, x1, z0 + t / 2], s: ['x', x0, x1, z1 - t / 2], w: ['z', z0 + t, z1 - t, x0 + t / 2], e: ['z', z0 + t, z1 - t, x1 - t / 2] };
      for (let fl = 0; fl < floors; fl++) {
        const y = fl * H, top = fl === floors - 1;
        for (const k of ['n', 's', 'w', 'e']) {
          const [ax, a0, a1, c] = sides[k];
          const open = (o.open && o.open[k] || []).filter((op) => (op[2] || 0) === fl).map((op) => ({ type: op[0], at: lerp(a0, a1, op[1]), w: op[3], y0: op[4], y1: op[5] }));
          B.wall(ax, a0, a1, c, y, H, t, { open, pattern: pat, color: col, jag: o.ruin && top, hp: whp });
        }
      }
      // pisos interiores y escaleras
      const fp = o.floorPat ?? PAT.WOOD, fc = o.floorColor ?? 0x6e5236;
      if (o.floorH !== 0) blk(x0 + t, 0, z0 + t, x1 - t, 0.06, z1 - t, { pattern: fp, color: fc, kind: 'floor' });   // floorH:0 → el suelo lo pone el terreno (sin escalón)
      if (floors > 1) {
        const st = o.stairs || { side: 'e', from: 'n' };
        const sw = 1.15, run = Math.ceil(H / 0.3) * 0.32;
        let hole, sx, sz, dir;
        if (st.side === 'e' || st.side === 'w') {
          const xa = st.side === 'e' ? x1 - t - sw : x0 + t, xb = xa + sw;
          sx = (xa + xb) / 2;
          if (st.from === 'n') { sz = z0 + t + 0.5; dir = '+z'; hole = [xa - 0.05, sz - 0.2, xb + 0.05, sz + run + 0.1]; }
          else { sz = z1 - t - 0.5; dir = '-z'; hole = [xa - 0.05, sz - run - 0.1, xb + 0.05, sz + 0.2]; }
          B.stairs(sx, sz, dir, sw, 0.06, H, { pattern: PAT.WOOD, color: 0x5e4630 });
        } else {
          const za = st.side === 's' ? z1 - t - sw : z0 + t, zb = za + sw;
          sz = (za + zb) / 2;
          if (st.from === 'w') { sx = x0 + t + 0.5; dir = '+x'; hole = [sx - 0.2, za - 0.05, sx + run + 0.1, zb + 0.05]; }
          else { sx = x1 - t - 0.5; dir = '-x'; hole = [sx - run - 0.1, za - 0.05, sx + 0.2, zb + 0.05]; }
          B.stairs(sx, sz, dir, sw, 0.06, H, { pattern: PAT.WOOD, color: 0x5e4630 });
        }
        for (let fl = 1; fl < floors; fl++) B.slab(x0 + t, z0 + t, x1 - t, z1 - t, fl * H - 0.25, fl * H, { holes: [hole], pattern: fp, color: fc });
      }
      // techo
      const rh = floors * H;
      if (o.roof !== false) {
        if (o.ruin) {
          const cut = rng.range(0.35, 0.6), hz = z0 + (z1 - z0) * cut;
          B.slab(x0, z0, x1, hz, rh - 0.05, rh + 0.25, { pattern: PAT.CONCRETE, color: C.concreteD });
          B.rubble((x0 + x1) / 2 + rng.range(-1, 1), (hz + z1) / 2, 1.6);
        } else {
          B.slab(x0, z0, x1, z1, rh - 0.05, rh + 0.25, { pattern: o.roofPat ?? PAT.CONCRETE, color: o.roofColor ?? C.concreteD });
          if (o.parapet !== false) {
            const ph = 0.55, pt = 0.22, pc = shade(col, -0.1);
            B.decoBox(x0, rh + 0.25, z0, x1, rh + 0.25 + ph, z0 + pt, pc); B.decoBox(x0, rh + 0.25, z1 - pt, x1, rh + 0.25 + ph, z1, pc);
            B.decoBox(x0, rh + 0.25, z0, x0 + pt, rh + 0.25 + ph, z1, pc); B.decoBox(x1 - pt, rh + 0.25, z0, x1, rh + 0.25 + ph, z1, pc);
          }
        }
      }
      // marcos de ventanas y daño visible
      B.decoBox(x0 - 0.02, 0, z0 - 0.02, x1 + 0.02, 0.35, z1 + 0.02, shade(col, -0.35));
      if (o.ruin) for (let i = 0; i < 3; i++) B.rubble(rng.range(x0 + 1, x1 - 1), rng.range(z0 + 1, z1 - 1), rng.range(0.7, 1.2));
    },
    // escombros caminables (bloques bajos)
    rubble(x, z, r, y = 0) {
      const n = 3 + Math.floor(r * 2);
      for (let i = 0; i < n; i++) {
        const a = rng.range(0, TAU), d = rng.range(0, r), s = rng.range(0.3, 0.7) * Math.min(1, r);
        const cx = x + Math.cos(a) * d, cz = z + Math.sin(a) * d, h = rng.range(0.12, 0.42);
        blk(cx - s, y, cz - s * 0.8, cx + s, y + h, cz + s * 0.8, { pattern: PAT.CONCRETE, color: rng.pick([0x8f8a80, 0x9d968a, 0x7b766d, 0xa08f78]), kind: 'deco' });
      }
      for (let i = 0; i < n * 2; i++) { const a = rng.range(0, TAU), d = rng.range(0, r * 1.3); D.add(GEO.box(1, 1, 1), x + Math.cos(a) * d, y + 0.05, z + Math.sin(a) * d, rng.pick([0x8f8a80, 0x6e6a62, 0x9a7a5a]), { sx: rng.range(0.1, 0.35), sy: rng.range(0.06, 0.2), sz: rng.range(0.1, 0.35), ry: rng.range(0, 3), rx: rng.range(-0.3, 0.3) }); }
    },
    sandbags(x0, z0, x1, z1, o = {}) {
      const h = o.h ?? 1.05, y = o.y ?? 0, t = o.t ?? 0.62;
      const along = Math.abs(x1 - x0) >= Math.abs(z1 - z0) ? 'x' : 'z';
      const a0 = along === 'x' ? Math.min(x0, x1) : Math.min(z0, z1), a1 = along === 'x' ? Math.max(x0, x1) : Math.max(z0, z1), c = along === 'x' ? (z0 + z1) / 2 : (x0 + x1) / 2;
      const n = Math.max(1, Math.round((a1 - a0) / 1.4)), seg = (a1 - a0) / n;
      for (let i = 0; i < n; i++) {
        const s = a0 + i * seg, e = s + seg, opt = { pattern: PAT.SANDBAG, color: o.color ?? rng.pick([0xa8946a, 0x9c8a62, 0xb09c72]), kind: 'sandbag', hp: 260 };
        if (along === 'x') blk(s, y, c - t / 2, e, y + h, c + t / 2, opt); else blk(c - t / 2, y, s, c + t / 2, y + h, e, opt);
      }
    },
    crate(x, y, z, s = 1.1, o = {}) { return blk(x - s / 2, y, z - s / 2, x + s / 2, y + (o.h ?? s), z + s / 2, { color: o.color ?? rng.pick([0x8a6a40, 0x7d6038, 0x6b5a3a, 0x5a5f3a]), kind: 'crate', hp: o.hp ?? 120, pattern: PAT.CRATE }); },
    // contenedor de carga (6.1 × 2.6 × 2.44)
    container(x, y, z, axis, color) {
      // época: caja de madera de un vagón de mercancías (tablas, flejes y puerta corredera), no un contenedor moderno
      const L = 6.1, W = 2.44, H = 2.6, col = rng.pick([0x6e4a2c, 0x5e3f26, 0x7a5232, 0x5a4a32, 0x6a3a2a]);
      const b = axis === 'x' ? blk(x - L / 2, y, z - W / 2, x + L / 2, y + H, z + W / 2, { pattern: PAT.WOOD, color: col, kind: 'container' }) : blk(x - W / 2, y, z - L / 2, x + W / 2, y + H, z + L / 2, { pattern: PAT.WOOD, color: col, kind: 'container' });
      // puertas y esquineros
      const dk = shade(col, -0.35);
      if (axis === 'x') { B.decoBox(x + L / 2, y + 0.05, z - W / 2 + 0.05, x + L / 2 + 0.04, y + H - 0.05, z + W / 2 - 0.05, dk); for (const zz of [z - 0.5, z + 0.5]) B.decoBox(x + L / 2 + 0.04, y + 0.2, zz - 0.02, x + L / 2 + 0.08, y + H - 0.2, zz + 0.02, 0x2e2c28); }
      else { B.decoBox(x - W / 2 + 0.05, y + 0.05, z + L / 2, x + W / 2 - 0.05, y + H - 0.05, z + L / 2 + 0.04, dk); for (const xx of [x - 0.5, x + 0.5]) B.decoBox(xx - 0.02, y + 0.2, z + L / 2 + 0.04, xx + 0.02, y + H - 0.2, z + L / 2 + 0.08, 0x2e2c28); }
      for (const k of [0.25, 0.75]) { if (axis === 'x') { B.decoBox(x - L / 2 + L * k - 0.04, y + H, z - W / 2, x - L / 2 + L * k + 0.04, y + H + 0.03, z + W / 2, 0x2e2c28); } else { B.decoBox(x - W / 2, y + H, z - L / 2 + L * k - 0.04, x + W / 2, y + H + 0.03, z - L / 2 + L * k + 0.04, 0x2e2c28); } }
      return b;
    },
    barrel(x, y, z) {
      const b = blk(x - 0.3, y, z - 0.3, x + 0.3, y + 0.92, z + 0.3, { kind: 'barrel', hp: CONFIG.BARREL.hp, pattern: PAT.METAL, color: 0x9a2a1e, noRender: true, surface: 'metal' });
      const pb = new PartBatch();
      pb.add(GEO.cyl(0.29, 0.29, 0.9, 10), 0, 0.45, 0, 0x9a2a1e).add(GEO.cyl(0.3, 0.3, 0.05, 10), 0, 0.2, 0, 0x5a1810).add(GEO.cyl(0.3, 0.3, 0.05, 10), 0, 0.7, 0, 0x5a1810)
        .add(GEO.box(0.3, 0.16, 0.02), 0, 0.5, -0.29, 0xd8b030).add(GEO.cyl(0.04, 0.04, 0.03, 6), 0.12, 0.915, 0.05, 0x3a3a3a);
      const m = new THREE.Mesh(pb.build(), MAT.vcol()); m.position.set(x, y, z); m.rotation.y = rng.range(0, TAU); m.castShadow = true;
      ms.decor.add(m);
      ms.barrels.push({ block: b, mesh: m });
      return b;
    },
    wire(x0, z0, x1, z1, y = 0) {
      const ax = Math.abs(x1 - x0) >= Math.abs(z1 - z0) ? 'x' : 'z';
      const a0 = ax === 'x' ? Math.min(x0, x1) : Math.min(z0, z1), a1 = ax === 'x' ? Math.max(x0, x1) : Math.max(z0, z1), c = ax === 'x' ? (z0 + z1) / 2 : (x0 + x1) / 2;
      ms.wires.push(ax === 'x' ? { x0: a0, x1: a1, z0: c - 0.55, z1: c + 0.55, y } : { x0: c - 0.55, x1: c + 0.55, z0: a0, z1: a1, y });
      for (let s = a0; s <= a1; s += 0.38) {
        const px = ax === 'x' ? s : c + Math.sin(s * 3) * 0.05, pz = ax === 'x' ? c + Math.sin(s * 3) * 0.05 : s;
        D.add(GEO.torus(0.42, 0.012, 10, 3), px, y + 0.42, pz, 0x5e5a52, { ry: ax === 'x' ? Math.PI / 2 : 0, rz: 0.25 });
      }
      for (let s = a0; s <= a1; s += 2.2) { const px = ax === 'x' ? s : c, pz = ax === 'x' ? c : s; D.add(GEO.box(0.06, 1.0, 0.06), px, y + 0.5, pz, 0x4a3a28, { rz: 0.1 }); }
    },
    // vehículos destruidos: sólidos bajos + detalles
    car(x, z, rot = 0, color = 0x4a4038) {
      const L = 4.2, W = 1.8, burnt = shade(color, -0.45);
      const ex = rot ? W / 2 : L / 2, ez = rot ? L / 2 : W / 2;
      blk(x - ex, 0.28, z - ez, x + ex, 0.98, z + ez, { pattern: PAT.METAL, color: burnt, kind: 'vehicle' });
      const cx = rot ? W / 2 - 0.1 : 1.1, cz = rot ? 1.1 : W / 2 - 0.1;
      blk(x - cx, 0.98, z - cz, x + cx, 1.45, z + cz, { pattern: PAT.METAL, color: shade(burnt, -0.15), kind: 'vehicle' });
      for (const [wx, wz] of [[-1.35, -0.85], [1.35, -0.85], [-1.35, 0.85], [1.35, 0.85]]) D.add(GEO.cyl(0.33, 0.33, 0.22, 8), x + (rot ? wz : wx), 0.33, z + (rot ? wx : wz), 0x1a1918, { rx: rot ? 0 : Math.PI / 2, rz: rot ? Math.PI / 2 : 0 });
      D.add(GEO.box(1, 1, 1), x, 1.2, z, 0x111111, { sx: rot ? W - 0.15 : 2.0, sy: 0.32, sz: rot ? 2.0 : W - 0.15 });
    },
    // caja en coordenadas locales de un vehículo (a: a lo largo, c: a lo ancho); rot=1 gira 90°
    lbox(x, z, rot, a0, y0, c0, a1, y1, c1, opt, solid = true) {
      const X0 = rot ? x + Math.min(c0, c1) : x + Math.min(a0, a1), X1 = rot ? x + Math.max(c0, c1) : x + Math.max(a0, a1);
      const Z0 = rot ? z + Math.min(a0, a1) : z + Math.min(c0, c1), Z1 = rot ? z + Math.max(a0, a1) : z + Math.max(c0, c1);
      if (solid) return blk(X0, y0, Z0, X1, y1, Z1, opt);
      B.decoBox(X0, y0, Z0, X1, y1, Z1, opt.color);
    },
    wheel(x, z, rot, a, c, r, w) { D.add(GEO.cyl(r, r, w, 8), x + (rot ? c : a), r, z + (rot ? a : c), 0x1a1918, { rx: rot ? 0 : Math.PI / 2, rz: rot ? Math.PI / 2 : 0 }); },
    truck(x, z, rot = 0, color = 0x4d5236) {
      const V = { pattern: PAT.METAL, kind: 'vehicle' };
      B.lbox(x, z, rot, -3.6, 0.5, -1.2, 3.6, 1.3, 1.2, { ...V, color: shade(color, -0.3) });
      B.lbox(x, z, rot, -3.6, 1.3, -1.15, -1.65, 2.75, 1.15, { ...V, color });
      B.lbox(x, z, rot, -1.45, 1.3, -1.22, 3.6, 2.55, 1.22, { ...V, pattern: PAT.PLAIN, color: shade(color, 0.12) });
      B.lbox(x, z, rot, -3.62, 1.9, -1.0, -3.58, 2.5, 1.0, { color: 0x151515 }, false);
      for (const a of [-2.6, 0.9, 2.6]) for (const c of [-1.05, 1.05]) B.wheel(x, z, rot, a, c, 0.5, 0.34);
    },
    tank(x, z, rot = 0) {
      const col = 0x4a4e36, V = { pattern: PAT.METAL, kind: 'vehicle' };
      B.lbox(x, z, rot, -3.3, 0.35, -1.45, 3.3, 1.35, 1.45, { ...V, color: shade(col, -0.25) });
      B.lbox(x, z, rot, -3.4, 0, -1.8, 3.4, 0.9, -1.42, { ...V, color: 0x26261f });
      B.lbox(x, z, rot, -3.4, 0, 1.42, 3.4, 0.9, 1.8, { ...V, color: 0x26261f });
      B.lbox(x, z, rot, -1.3, 1.35, -1.2, 1.3, 2.15, 1.2, { ...V, color: shade(col, -0.15) });
      const ang = rng.range(-0.7, 0.7) + (rot ? 0 : Math.PI / 2);
      D.add(GEO.cyl(0.09, 0.11, 3.6, 8), x + Math.sin(ang) * 2.7, 1.8, z + Math.cos(ang) * 2.7, 0x2c2e24, { rx: Math.PI / 2 - 0.1, ry: ang, order: 'YXZ' });
    },
    tree(x, z, s = 1) {
      blk(x - 0.18 * s, 0, z - 0.18 * s, x + 0.18 * s, 2.6 * s, z + 0.18 * s, { pattern: PAT.WOOD, color: 0x4a3a28, kind: 'tree', noRender: true });
      D.add(GEO.cyl(0.14 * s, 0.22 * s, 2.8 * s, 6), x, 1.4 * s, z, 0x4a3a28);
      const g = rng.pick([0x4d5a2c, 0x56602f, 0x435027]);
      D.add(GEO.cone(1.7 * s, 2.2 * s, 8), x, 2.5 * s, z, shade(g, -0.12), { ry: rng.range(0, 3) });
      D.add(GEO.cone(1.45 * s, 2.4 * s, 8), x, 3.4 * s, z, g, { ry: rng.range(0, 3) });
      D.add(GEO.cone(1.1 * s, 2.0 * s, 8), x, 4.45 * s, z, shade(g, 0.06), { ry: rng.range(0, 3) });
      D.add(GEO.cone(0.7 * s, 1.5 * s, 7), x, 5.4 * s, z, shade(g, 0.12), { ry: rng.range(0, 3) });
      D.add(GEO.cyl(0.26 * s, 0.34 * s, 0.35 * s, 6), x, 0.15 * s, z, 0x3e3022);
    },
    deadTree(x, z, s = 1) {
      blk(x - 0.15 * s, 0, z - 0.15 * s, x + 0.15 * s, 3.2 * s, z + 0.15 * s, { pattern: PAT.WOOD, color: 0x3a2e22, kind: 'tree', noRender: true });
      D.add(GEO.cyl(0.1 * s, 0.2 * s, 3.4 * s, 5), x, 1.7 * s, z, 0x3a2e22);
      for (let i = 0; i < 3; i++) D.add(GEO.cyl(0.03, 0.06, 1.4 * s, 4), x + Math.cos(i * 2.1) * 0.4, 2.4 * s + i * 0.3, z + Math.sin(i * 2.1) * 0.4, 0x3a2e22, { rz: Math.cos(i * 2.1) * 0.9, rx: Math.sin(i * 2.1) * 0.9 });
    },
    lamp(x, z) { ms.lamps.push({ x: x + 0.2, y: 4.5, z }); blk(x - 0.08, 0, z - 0.08, x + 0.08, 4.5, z + 0.08, { pattern: PAT.METAL, color: 0x3a3c3e, kind: 'pole', noRender: true }); D.add(GEO.cyl(0.06, 0.08, 4.6, 6), x, 2.3, z, 0x3a3c3e); D.add(GEO.box(0.5, 0.12, 0.25), x + 0.2, 4.55, z, 0x2a2c2e); },
    // luz de techo para interiores: sin poste; el ambiente la enciende (th.lamps) y la apaga con el mapa
    light(x, y, z) { ms.lamps.push({ x, y: y + 0.2, z }); },
    pole(x, z, h = 7) { D.add(GEO.cyl(0.1, 0.13, h, 6), x, h / 2, z, 0x4a3a28); D.add(GEO.box(1.6, 0.08, 0.08), x, h - 0.4, z, 0x4a3a28); },
    fence(x0, z0, x1, z1, h = 2.2) {
      const ax = Math.abs(x1 - x0) >= Math.abs(z1 - z0) ? 'x' : 'z', len = ax === 'x' ? Math.abs(x1 - x0) : Math.abs(z1 - z0);
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      D.add(GEO.box(1, 1, 1), cx, h / 2, cz, 0x7a7c78, { sx: ax === 'x' ? len : 0.03, sy: h, sz: ax === 'x' ? 0.03 : len });
      for (let s = 0; s <= len; s += 2.5) D.add(GEO.cyl(0.04, 0.04, h + 0.2, 5), ax === 'x' ? Math.min(x0, x1) + s : cx, (h + 0.2) / 2, ax === 'x' ? cz : Math.min(z0, z1) + s, 0x55585a);
      if (ax === 'x') blk(Math.min(x0, x1), 0, cz - 0.05, Math.max(x0, x1), h, cz + 0.05, { kind: 'fence', noRender: true, pattern: PAT.GRATE, color: 0x7a7c78 }); else blk(cx - 0.05, 0, Math.min(z0, z1), cx + 0.05, h, Math.max(z0, z1), { kind: 'fence', noRender: true, pattern: PAT.GRATE, color: 0x7a7c78 });
    },
    // torre de vigilancia con escalera
    tower(x, z, h = 6, dir = '+z') {
      const s = 1.6;
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) blk(x + dx * s - 0.15, 0, z + dz * s - 0.15, x + dx * s + 0.15, h, z + dz * s + 0.15, { pattern: PAT.WOOD, color: 0x5e4630, kind: 'pole' });
      blk(x - s - 0.2, h - 0.25, z - s - 0.2, x + s + 0.2, h, z + s + 0.2, { pattern: PAT.WOOD, color: 0x6b5236, kind: 'floor' });
      const ph = 1.05, pt = 0.15;
      B.wall('x', x - s - 0.2, x + s + 0.2, z - s - 0.12, h, ph, pt, { pattern: PAT.WOOD, color: 0x6b5236, kind: 'cover', hp: CONFIG.DESTRUCT.woodHp, open: dir === '-z' ? [{ type: 'door', at: x, w: 1.1 }] : [] });
      B.wall('x', x - s - 0.2, x + s + 0.2, z + s + 0.12, h, ph, pt, { pattern: PAT.WOOD, color: 0x6b5236, kind: 'cover', hp: CONFIG.DESTRUCT.woodHp, open: dir === '+z' ? [{ type: 'door', at: x, w: 1.1 }] : [] });
      B.wall('z', z - s, z + s, x - s - 0.12, h, ph, pt, { pattern: PAT.WOOD, color: 0x6b5236, kind: 'cover', hp: CONFIG.DESTRUCT.woodHp, open: dir === '-x' ? [{ type: 'door', at: z, w: 1.1 }] : [] });
      B.wall('z', z - s, z + s, x + s + 0.12, h, ph, pt, { pattern: PAT.WOOD, color: 0x6b5236, kind: 'cover', hp: CONFIG.DESTRUCT.woodHp, open: dir === '+x' ? [{ type: 'door', at: z, w: 1.1 }] : [] });
      B.decoBox(x - s - 0.4, h + 2.1, z - s - 0.4, x + s + 0.4, h + 2.25, z + s + 0.4, 0x4a3a28);
      for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.decoBox(x + dx * s - 0.06, h + 1.05, z + dz * s - 0.06, x + dx * s + 0.06, h + 2.1, z + dz * s + 0.06, 0x4a3a28);
      // escalera exterior hacia el hueco
      const sx = dir === '+x' ? 1 : dir === '-x' ? -1 : 0, sz = dir === '+z' ? 1 : dir === '-z' ? -1 : 0;
      const n = Math.ceil(h / 0.3), len = n * 0.32;
      const ex = x + sx * (s + 0.32 + len), ez = z + sz * (s + 0.32 + len);
      B.stairs(ex, ez, sx > 0 ? '-x' : sx < 0 ? '+x' : sz > 0 ? '-z' : '+z', 1.1, 0, h, { pattern: PAT.WOOD, color: 0x5e4630, solidBase: false });
      return { x, y: h, z };
    },
    bounds(x0, z0, x1, z1, h = 16) {
      ms.bounds = { x0, z0, x1, z1 };
      const t = 1;
      blk(x0 - t, -3, z0 - t, x1 + t, h, z0, { noRender: true, kind: 'bound' }); blk(x0 - t, -3, z1, x1 + t, h, z1 + t, { noRender: true, kind: 'bound' });
      blk(x0 - t, -3, z0, x0, h, z1, { noRender: true, kind: 'bound' }); blk(x1, -3, z0, x1 + t, h, z1, { noRender: true, kind: 'bound' });
    },
    station(x, z, yaw, o = {}) { ms.stations.push({ x, y: 0, z, yaw, ...o }); },
    // panel plano con textura dibujada en código (carteles, relojes, tablones, pintadas). draw(ctx, w, h) sobre un lienzo de px × px·alto/ancho
    panel(x, y, z, ry, w, h, draw, o = {}) {
      const px = o.px || 256, cv = document.createElement('canvas'); cv.width = px; cv.height = Math.max(8, Math.round(px * h / w));
      draw(cv.getContext('2d'), cv.width, cv.height);
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: t, transparent: !!o.alpha, depthWrite: !o.alpha, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      m.position.set(x, y, z); m.rotation.y = ry; if (o.rz) m.rotation.z = o.rz; m.receiveShadow = true; ms.decor.add(m);
      return m;
    },
    sign(x, z, text, h = 3.1) { D.add(GEO.cyl(0.05, 0.06, h, 6), x, h / 2, z, 0x4a3a28); const sp = rangeSign(text); sp.position.set(x, h + 0.55, z); ms.decor.add(sp); },
    spawn(team, x, y, z, yaw) { ms.spawns[team].push({ x, y, z, yaw: yaw ?? Math.atan2(x - ms.center.x, z - ms.center.z) }); },
    dom(id, x, y, z, r = 4.2) { ms.dom.push({ id, x, y, z, r }); },
    stand(x, y, z, weapon) { ms.standDefs.push({ x, y, z, weapon }); },
    prop(type, x, y, z) { ms.propDefs.push({ type, x, y, z }); },
    // paisaje lejano (colinas y ruinas en la niebla)
    horizon(color = 0x7a7466, n = 22, r0 = 95, r1 = 150, o = {}) {
      // terreno exterior (que el paisaje no flote sobre la nada)
      const bd = ms.bounds, R = 260, gc = o.groundColor ?? shade(color, -0.12), skip = o.skip || '';
      const strip = (x0, z0, x1, z1) => D.add(GEO.box(1, 1, 1), (x0 + x1) / 2, -0.08, (z0 + z1) / 2, gc, { sx: x1 - x0, sy: 0.1, sz: z1 - z0 });
      if (bd) {
        if (!skip.includes('n')) strip(-R, -R, R, bd.z0);
        if (!skip.includes('s')) strip(-R, bd.z1, R, R);
        strip(-R, bd.z0, bd.x0, bd.z1);
        strip(bd.x1, bd.z0, R, bd.z1);
      }
      for (let i = 0; i < n; i++) {
        // colinas: su base nunca entra al área de juego ni a la franja de ruinas
        const a = (i / n) * TAU + rng.range(-0.1, 0.1), s = rng.range(14, 34), R = s * 1.25, r = Math.max(rng.range(r0, r1), R + 84);
        if ((skip.includes('s') && Math.sin(a) > 0.35) || (skip.includes('n') && Math.sin(a) < -0.35)) continue;
        D.add(GEO.cone(1, 1, 5), Math.cos(a) * r, s * 0.3 - 2, Math.sin(a) * r, shade(color, rng.range(-0.1, 0.08)), { sx: R, sy: s * 0.7, sz: R, ry: rng.range(0, 3) });
      }
      for (let i = 0; i < 26; i++) {
        const a = rng.range(0, TAU), r = rng.range(66, 80), w = rng.range(3, 9), h = rng.range(3, 14);
        if (bd && skip.includes('n') && Math.sin(a) * r < bd.z0) continue;
        if (bd && skip.includes('s') && Math.sin(a) * r > bd.z1) continue;
        D.add(GEO.box(1, 1, 1), Math.cos(a) * r, h / 2 - 1, Math.sin(a) * r, shade(color, rng.range(-0.25, -0.05)), { sx: w, sy: h, sz: rng.range(3, 8), ry: rng.range(0, 3) });
      }
    },
    smoke(x, z, scale = 1) { ms.anim.push(makeSmokePlume(ms.decor, x, z, scale, rng)); },
    finish() { },
  };
  return B;
}

// columna de humo lejana (puramente visual)
let _smokeTex = null;
function smokeTexture() {
  if (_smokeTex) return _smokeTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  _smokeTex = new THREE.CanvasTexture(c); _smokeTex.userData.shared = true; return _smokeTex;
}
function makeSmokePlume(parent, x, z, scale, rng) {
  const parts = [];
  for (let i = 0; i < 9; i++) {
    const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTexture(), color: 0x4a4540, transparent: true, depthWrite: false, opacity: 0.5 }));
    parent.add(m); parts.push({ m, t: i / 9, sx: rng.range(-1, 1) });
  }
  return (t, dt) => {
    for (const p of parts) {
      p.t = (p.t + dt * 0.035) % 1;
      const k = p.t, h = k * 38 * scale;
      p.m.position.set(x + p.sx * 2 + k * 9 * scale, h + 2, z + k * 4 * scale);
      const s = (4 + k * 18) * scale; p.m.scale.set(s, s, 1);
      p.m.material.opacity = Math.sin(k * Math.PI) * 0.55;
    }
  };
}

// ---------------- tema: cielo, niebla, luces ----------------
function applyTheme(th) {
  const sky = G.sky;
  if (!sky) return;
  sky.material.uniforms.top.value.set(th.skyTop); sky.material.uniforms.mid.value.set(th.skyMid); sky.material.uniforms.bot.value.set(th.skyBot);
  G.scene.fog.color.set(th.fog); G.scene.fog.near = th.fogNear ?? 40; G.scene.fog.far = th.fogFar ?? 210;
  G.hemi.color.set(th.hemiTop); G.hemi.groundColor.set(th.hemiBot); G.hemi.intensity = th.hemiI ?? 1.25;
  G.sun.color.set(th.sun); G.sun.intensity = th.sunI ?? 2.2;
  G.sunDir.set(...th.sunDir).normalize();
  G.baseExposure = th.exposure ?? 1.05; if (G.renderer) G.renderer.toneMappingExposure = G.baseExposure * (G.settings.bright || 1.12);   // 3.1.3: ajuste de brillo
  sky.material.uniforms.cloud.value = th.cloud ?? 0.65; sky.material.uniforms.sunCol.value.set(th.sun);
  if (typeof Dust !== 'undefined') Dust.tint(th);
  if (typeof Env !== 'undefined') Env.apply(th);
  // relleno y contorno de los soldados con el color del cielo de cada mapa
  if (typeof SOLDIER_LIGHT !== 'undefined') {
    SOLDIER_LIGHT.fill.value.set(th.hemiTop).multiplyScalar(th.soldFill ?? 0.5);
    SOLDIER_LIGHT.rim.value.set(th.hemiTop).lerp(_c2.set(th.sun), 0.35).multiplyScalar(th.soldRim ?? 0.85);
  }
}

// ---------------- navegación para bots (generada automáticamente) ----------------
const NAV_CELL = 2.5;
function buildNav() {
  const t0 = performance.now();
  const nodes = [], H = CONFIG.FIGHTER.height, hw = CONFIG.FIGHTER.radius;
  const hash = new Map(), key = (x, z) => Math.floor(x / NAV_CELL) + ',' + Math.floor(z / NAV_CELL);
  const bnd = MapSys.bounds;
  const tryAdd = (x, y, z, b) => {
    if (x < bnd.x0 + 0.6 || x > bnd.x1 - 0.6 || z < bnd.z0 + 0.6 || z > bnd.z1 - 0.6) return;
    const g = PHYS.groundBelow(x, z, y + 0.1, 0.6);
    if (!g || Math.abs(g.y - y) > 0.05) return;
    if (PHYS.overlapAABB(x - hw, y + 0.05, z - hw, x + hw, y + H, z + hw)) return;
    if (MapSys.inWire(x, z, y)) return;
    const k = key(x, z);
    let arr = hash.get(k); if (!arr) hash.set(k, arr = []);
    for (const n of arr) if (Math.abs(n.y - y) < 0.4 && Math.hypot(n.x - x, n.z - z) < 0.9) return;
    const n = { id: nodes.length, x, y, z, links: [], block: b, cover: 0, high: 0 };
    nodes.push(n); arr.push(n);
  };
  for (const b of PHYS.blocks) {
    if (!b.active || !b.solid || b.kind === 'bound' || b.kind === 'barrel' || b.kind === 'pole' || b.kind === 'tree' || b.kind === 'fence') continue;
    if (b.ramp) continue;
    const w = b.max.x - b.min.x, d = b.max.z - b.min.z;
    if (w < 0.25 || d < 0.25) continue;
    const step = b.kind === 'stairs' ? 0.32 : 2.0;
    const nx = Math.max(1, Math.round((w - 0.5) / step)), nz = Math.max(1, Math.round((d - 0.5) / step));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = b.min.x + (nx === 1 ? w / 2 : 0.25 + (i + 0.5) * ((w - 0.5) / nx)), z = b.min.z + (nz === 1 ? d / 2 : 0.25 + (j + 0.5) * ((d - 0.5) / nz));
      tryAdd(x, b.max.y, z, b);
    }
  }
  const walkable = (a, b) => {
    const dx = b.x - a.x, dz = b.z - a.z, dist = Math.hypot(dx, dz), n = Math.max(2, Math.ceil(dist / 0.4));
    let prevY = a.y;
    for (let i = 1; i < n; i++) {
      const k = i / n, x = a.x + dx * k, z = a.z + dz * k;
      const g = PHYS.groundBelow(x, z, prevY + 0.5, 1.0, 0.2);
      if (!g || g.y - prevY > 0.47 || prevY - g.y > 0.6) return false;
      if (PHYS.overlapAABB(x - 0.2, g.y + 0.5, z - 0.2, x + 0.2, g.y + H - 0.1, z + 0.2)) return false;
      if (MapSys.inWire(x, z, g.y)) return false;
      prevY = g.y;
    }
    return Math.abs(prevY - b.y) < 0.5;
  };
  const neighbors = (n, r) => {
    const out = [], cx = Math.floor(n.x / NAV_CELL), cz = Math.floor(n.z / NAV_CELL), rc = Math.ceil(r / NAV_CELL);
    for (let i = -rc; i <= rc; i++) for (let j = -rc; j <= rc; j++) { const arr = hash.get((cx + i) + ',' + (cz + j)); if (arr) for (const m of arr) if (m !== n) out.push(m); }
    return out;
  };
  let checks = 0;
  for (const a of nodes) {
    for (const b of neighbors(a, 3.2)) {
      if (b.id < a.id) continue;
      const dh = Math.hypot(a.x - b.x, a.z - b.z), dy = b.y - a.y;
      if (dh > 3.0 || Math.abs(dy) > 5) continue;
      checks++;
      if (Math.abs(dy) < 1.0 && dh > 0.05) {
        if (walkable(a, b)) { a.links.push({ to: b.id, type: 'walk', cost: dh + Math.abs(dy) }); b.links.push({ to: a.id, type: 'walk', cost: dh + Math.abs(dy) }); continue; }
      }
      // trepar bordes / bajar de un salto
      const lo = dy > 0 ? a : b, hi = dy > 0 ? b : a, up = Math.abs(dy);
      if (up > 0.45 && dh < 2.4 && dh > 0.4) {
        _v1.set(lo.x, hi.y + 1.0, lo.z); _v2.set(hi.x, hi.y + 1.0, hi.z);
        if (!PHYS.lineOfSight(_v1, _v2)) continue;
        _v1.set(lo.x, lo.y + 0.5, lo.z); _v2.set(lo.x, hi.y + 1.0, lo.z);
        if (!PHYS.lineOfSight(_v1, _v2)) continue;
        if (up <= CONFIG.MOVE.mantleMax - 0.05) lo.links.push({ to: hi.id, type: 'mantle', cost: dh + up * 2 });
        if (up < 4.2) hi.links.push({ to: lo.id, type: 'drop', cost: dh + up });
      }
    }
  }
  // cobertura: obstáculos bajos (agachado) o altos alrededor de cada nodo
  const dirs = [];
  for (let i = 0; i < 8; i++) dirs.push([Math.cos(i * Math.PI / 4), Math.sin(i * Math.PI / 4)]);
  for (const n of nodes) {
    for (let i = 0; i < 8; i++) {
      const [dx, dz] = dirs[i];
      _v1.set(n.x, n.y + 0.75, n.z); _v2.set(dx, 0, dz);
      const low = PHYS.raycast(_v1, _v2, 1.2, PHYS._losOut);
      if (!low) continue;
      _v1.set(n.x, n.y + 1.6, n.z);
      const high = PHYS.raycast(_v1, _v2, 1.4, PHYS._losOut);
      if (high) n.high |= 1 << i; else n.cover |= 1 << i;
    }
  }
  const nav = { nodes, hash, ms: performance.now() - t0, checks };
  return nav;
}
function navNearest(nav, p, maxD = 6) {
  if (!nav) return null;
  let best = null, bd = maxD * maxD;
  const cx = Math.floor(p.x / NAV_CELL), cz = Math.floor(p.z / NAV_CELL), rc = Math.ceil(maxD / NAV_CELL);
  for (let i = -rc; i <= rc; i++) for (let j = -rc; j <= rc; j++) {
    const arr = nav.hash.get((cx + i) + ',' + (cz + j)); if (!arr) continue;
    for (const n of arr) { const d = (n.x - p.x) ** 2 + ((n.y - p.y) * 2.5) ** 2 + (n.z - p.z) ** 2; if (d < bd && (!n.block || n.block.active)) { bd = d; best = n; } }
  }
  return best;
}
// nodo más cercano al que se puede llegar en línea recta (no uno detrás de una pared)
const _nrA = new THREE.Vector3(), _nrB = new THREE.Vector3(), _nrList = [];
function navNearestReach(nav, p, maxD = 6) {
  if (!nav) return null;
  _nrList.length = 0;
  const cx = Math.floor(p.x / NAV_CELL), cz = Math.floor(p.z / NAV_CELL), rc = Math.ceil(maxD / NAV_CELL), m2 = maxD * maxD;
  for (let i = -rc; i <= rc; i++) for (let j = -rc; j <= rc; j++) {
    const arr = nav.hash.get((cx + i) + ',' + (cz + j)); if (!arr) continue;
    for (const n of arr) { const d = (n.x - p.x) ** 2 + ((n.y - p.y) * 2.5) ** 2 + (n.z - p.z) ** 2; if (d < m2 && (!n.block || n.block.active)) _nrList.push({ n, d }); }
  }
  if (!_nrList.length) return null;
  _nrList.sort((a, b) => a.d - b.d);
  for (let k = 0; k < Math.min(6, _nrList.length); k++) {
    const n = _nrList[k].n;
    _nrA.set(p.x, p.y + 0.55, p.z); _nrB.set(n.x, n.y + 0.55, n.z);
    if (PHYS.lineOfSight(_nrA, _nrB)) return n;
  }
  return _nrList[0].n;
}
const _navHeap = new MinHeap();
let _navG = null, _navCame = null, _navLink = null, _navStamp = null, _navStampN = 0;
function navPath(nav, from, to, avoid) {
  if (!from || !to || !nav) return null;
  if (from === to) return [{ node: to, link: null }];
  const N = nav.nodes, n = N.length;
  if (!_navG || _navG.length < n) { _navG = new Float32Array(n); _navCame = new Int32Array(n); _navLink = new Array(n); _navStamp = new Int32Array(n); }
  const st = ++_navStampN, closed = st * 2 + 1;
  const h = (k) => Math.hypot(N[k].x - to.x, (N[k].y - to.y) * 1.5, N[k].z - to.z);
  const heap = _navHeap; heap.clear();
  _navStamp[from.id] = st * 2; _navG[from.id] = 0; _navCame[from.id] = -1; heap.push(h(from.id), from.id);
  let iter = 0;
  while (heap.size && iter++ < 4000) {
    const cur = heap.pop();
    if (_navStamp[cur] === closed) continue;
    if (cur === to.id) {
      const path = []; let c = cur;
      while (c >= 0) { path.unshift({ node: N[c], link: _navLink[c] }); c = _navCame[c]; }
      path[0].link = null;
      return path;
    }
    _navStamp[cur] = closed;
    for (const l of N[cur].links) {
      const k = l.to; if (_navStamp[k] === closed) continue;
      const blk = N[k].block; if (blk && !blk.active) continue;
      let c = l.cost; if (avoid) c += avoid(N[k]);
      const ng = _navG[cur] + c;
      if (_navStamp[k] !== st * 2 || ng < _navG[k]) { _navStamp[k] = st * 2; _navG[k] = ng; _navCame[k] = cur; _navLink[k] = l; heap.push(ng + h(k), k); }
    }
  }
  return null;
}

// ---------------- minimapa (vista cenital pre-renderizada) ----------------
function buildMinimap() {
  const b = MapSys.bounds, W = b.x1 - b.x0, Hh = b.z1 - b.z0;
  const px = 3, cv = document.createElement('canvas'); cv.width = Math.ceil(W * px); cv.height = Math.ceil(Hh * px);
  const x = cv.getContext('2d');
  x.fillStyle = '#1e1c17'; x.fillRect(0, 0, cv.width, cv.height);
  const list = PHYS.blocks.filter((k) => k.solid && k.kind !== 'bound').sort((p, q) => p.max.y - q.max.y);
  for (const k of list) {
    const top = k.max.y;
    if (k.kind === 'floor' && top <= 0.1 && top > -0.5) { x.fillStyle = k.pattern === PAT.ASPHALT ? '#2c2a24' : '#36332a'; }
    else if (top < -0.5) x.fillStyle = '#16140f';
    else { const l = clamp(80 + top * 15, 80, 196); x.fillStyle = `rgb(${l | 0},${(l * 0.9) | 0},${(l * 0.72) | 0})`; }
    x.fillRect((k.min.x - b.x0) * px, (k.min.z - b.z0) * px, Math.max(1, (k.max.x - k.min.x) * px), Math.max(1, (k.max.z - k.min.z) * px));
  }
  return { canvas: cv, px, x0: b.x0, z0: b.z0, w: W, h: Hh };
}

// ---------------- banderas de Dominio ----------------
function buildFlags() {
  for (const fl of MapSys.flags) { MapSys.decor.remove(fl.group); fl.cloth.material.dispose(); fl.ring.material.dispose(); }
  MapSys.flags = [];
  for (const d of MapSys.dom) {
    const g = new THREE.Group(); g.position.set(d.x, d.y, d.z);
    mesh(GEO.cyl(0.05, 0.06, 4.2, 6), MAT.lam(0x8a8a86), 0, 2.1, 0, g).castShadow = true;
    mesh(GEO.cyl(0.5, 0.6, 0.18, 8), MAT.lam(0x4a4a46), 0, 0.09, 0, g);
    const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.85, 6, 2), new THREE.MeshLambertMaterial({ color: 0xdddddd, side: THREE.DoubleSide }));
    cloth.position.set(0.72, 3.7, 0); cloth.castShadow = true; g.add(cloth);
    const ring = new THREE.Mesh(new THREE.RingGeometry(d.r - 0.18, d.r, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06; g.add(ring);
    const letter = makeLetterSprite(d.id); letter.position.set(0, 4.8, 0); g.add(letter);
    MapSys.decor.add(g);
    const base = cloth.geometry.attributes.position.array.slice();
    MapSys.flags.push({ d, group: g, cloth, ring, letter, base });
  }
}
function makeLetterSprite(t) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  x.font = '700 44px "Barlow Condensed", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,.7)'; x.strokeText(t, 32, 34); x.fillStyle = '#fff'; x.fillText(t, 32, 34);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false })); s.scale.set(0.9, 0.9, 1); s.renderOrder = 5;
  return s;
}
function animateFlags(t) {
  for (const fl of MapSys.flags) {
    const p = fl.cloth.geometry.attributes.position, a = p.array, base = fl.base;
    for (let i = 0; i < p.count; i++) { const bx = base[i * 3] + 0.7; a[i * 3 + 2] = Math.sin(t * 4 + bx * 4) * 0.08 * bx; }
    p.needsUpdate = true; fl.cloth.geometry.computeVertexNormals();
  }
}

