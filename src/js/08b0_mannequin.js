// ---- 08b0_mannequin.js ----
// =====================================================================
// MANIQUÍ (v2.9) — cuerpo con malla suave y piel (SkinnedMesh) para los soldados.
// La malla viene de tools/make_mannequin.py (data_mannequin.js) ya ajustada al esqueleto del juego; el equipo,
// los cascos y las caras siguen siendo cajas pegadas a cada articulación. Los huesos son las mismas articulaciones
// que usan la IK, el ragdoll, los cadáveres y las repeticiones, así que todo eso funciona sin cambios.
// Geometría y textura se comparten entre todos los soldados; cada soldado solo tiene su material (colores) y su esqueleto.
// =====================================================================
// ---------- uniforme: tubos suaves con piel (jerarquía de huesos = PART_NAMES) ----------
function buildUniform() {
  const SEG = 12, pos = [], sIdx = [], sW = [], tag = [], shade = [], idx = [];
  const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // pesos por zona: lista [hueso, peso]; la transición se reparte alrededor de cada articulación
  const torsoW = (y) => { const t = sm(1.0, 1.12, y); return [[0, 1 - t], [1, t]]; };
  const armW = (sd, y) => { const up = sd < 0 ? 3 : 5, lo = up + 1, t = sm(1.22, 1.1, y), ch = sm(1.36, 1.47, y) * 0.7; return [[1, ch], [up, (1 - t) * (1 - ch)], [lo, t * (1 - ch)]]; };
  const legW = (sd, y) => { const th = sd < 0 ? 7 : 9, sh = th + 1, t = sm(0.56, 0.4, y), pe = sm(0.88, 0.98, y) * 0.6; return [[0, pe], [th, (1 - t) * (1 - pe)], [sh, t * (1 - pe)]]; };
  const tube = (rings, cx, tg, wf, cap) => {
    const b0 = pos.length / 3;
    for (const r of rings) for (let k = 0; k < SEG; k++) {
      const a = (k / SEG) * TAU; pos.push(cx + Math.cos(a) * r.rx, r.y, Math.sin(a) * r.rz);
      let w = wf(r.y, cx + Math.cos(a) * r.rx).filter((e) => e[1] > 1e-4).sort((p, q) => q[1] - p[1]).slice(0, 4); const sum = w.reduce((q, e) => q + e[1], 0);
      for (let i = 0; i < 4; i++) { sIdx.push(w[i] ? w[i][0] : 0); sW.push(w[i] ? w[i][1] / sum : 0); }
      tag.push(tg); shade.push(r.f == null ? 1 : r.f);
    }
    for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < SEG; k++) {
      const a = b0 + i * SEG + k, b = b0 + i * SEG + (k + 1) % SEG, c = b0 + (i + 1) * SEG + k, d = b0 + (i + 1) * SEG + (k + 1) % SEG;
      idx.push(a, c, b, b, c, d);
    }
    if (cap) { const r = rings[0], ci = pos.length / 3; pos.push(cx, r.y, 0); const w = wf(r.y, cx)[0]; sIdx.push(w[0], 0, 0, 0); sW.push(1, 0, 0, 0); tag.push(tg); shade.push(0.9);
      for (let k = 0; k < SEG; k++) idx.push(ci, b0 + k, b0 + (k + 1) % SEG); }
    return b0;
  };
  const R = (y, rx, rz, f) => ({ y, rx, rz: rz == null ? rx : rz, f });
  // chaqueta: faldón, cintura, pecho, hombros y cuello
  tube([R(0.97, .172, .118), R(1.03, .178, .124), R(1.09, .168, .116, .9), R(1.17, .178, .12), R(1.26, .2, .125), R(1.34, .222, .126), R(1.4, .212, .112), R(1.44, .15, .095), R(1.47, .08, .072), R(1.49, .066, .062)], 0, 0, torsoW, false);
  // mangas (de arriba abajo, con un pliegue en el codo y el puño ceñido)
  for (const sd of [-1, 1]) tube([R(1.488, .03), R(1.465, .066), R(1.43, .086), R(1.36, .079), R(1.28, .072), R(1.2, .066, null, .92), R(1.16, .068, null, 1), R(1.12, .06, null, .86), R(1.04, .058), R(0.96, .056), R(0.93, .051, null, .85)], sd * 0.265, 0, (y) => armW(sd, y), true);
  // pantalón: cadera y piernas holgadas, pliegues en la rodilla y bajos sueltos sobre las botas
  tube([R(1.06, .178, .12), R(1.0, .188, .124), R(0.94, .19, .128), R(0.88, .18, .124)], 0, 4, (y, x) => { const th = x < 0 ? 7 : 9, t = sm(0.92, 0.84, y) * 0.6; return [[0, 1 - t], [th, t]]; }, false);
  for (const sd of [-1, 1]) tube([R(0.96, .108), R(0.9, .104), R(0.8, .098), R(0.7, .094), R(0.6, .09), R(0.54, .084, null, .9), R(0.5, .088, null, 1), R(0.46, .082, null, .84), R(0.4, .08), R(0.3, .078), R(0.2, .082), R(0.13, .09), R(0.105, .094, null, .88)], sd * 0.105, 4, (y) => legW(sd, y), false);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  // las caras salen hacia fuera: si el primer triángulo mira hacia dentro se invierte todo el orden
  const a = g.attributes.position, n = g.attributes.normal; let flip = false;
  { const v = new THREE.Vector3(a.getX(0) - 0, 0, a.getZ(0)); const nn = new THREE.Vector3(n.getX(0), 0, n.getZ(0)); flip = nn.dot(v.sub(new THREE.Vector3(0.0, 0, 0))) < 0; }
  if (flip) { for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
  return { pos: new Float32Array(pos), nor: g.attributes.normal.array, sIdx: new Uint16Array(sIdx), sW: new Float32Array(sW), tag: new Float32Array(tag), shade: new Float32Array(shade), idx: new Uint16Array(idx) };
}
const Mannequin = {
  geo: null, ok: false, tex: {},
  // tag de vértice: 0 uniforme (camuflaje), 1 piel, 2 guantes, 3 botas
  decode() {
    if (this.geo) return this.geo;
    try {
      const bin = atob(MANNEQUIN_B64), u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      const dv = new DataView(u8.buffer), nv = dv.getUint16(0, true), ni = dv.getUint32(2, true);
      let o = 6;
      const f32 = (n) => { const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = dv.getFloat32(o + i * 4, true); o += n * 4; return a; };
      const pos = f32(nv * 3);
      const nor = new Float32Array(nv * 3); for (let i = 0; i < nv * 3; i++) nor[i] = dv.getInt8(o + i) / 127; o += nv * 3;
      const sIdx = new Uint16Array(nv * 4); for (let i = 0; i < nv * 4; i++) sIdx[i] = u8[o + i]; o += nv * 4;
      const sW = new Float32Array(nv * 4); for (let i = 0; i < nv * 4; i++) sW[i] = u8[o + i] / 255; o += nv * 4;
      const tag = new Float32Array(nv); for (let i = 0; i < nv; i++) tag[i] = u8[o + i]; o += nv;
      // pantalón (etiqueta 4): piernas y parte baja de la cadera; chaqueta y pantalón no comparten el mismo tono ni el mismo dibujo
      for (let i = 0; i < nv; i++) { const j = sIdx[i * 4]; if (tag[i] === 0 && (j >= 7 || (j === 0 && pos[i * 3 + 1] < 1.02))) tag[i] = 4; }
      const idx = new Uint16Array(ni); for (let i = 0; i < ni; i++) idx[i] = dv.getUint16(o + i * 2, true);
      // ropa (v2.9.2): el maniquí solo aporta cuello, manos y pies; chaqueta, mangas y pantalón son tubos suaves y holgados
      // (buildUniform) con los mismos huesos, así se ven como tela suelta y no como un cuerpo musculoso pegado a la piel
      const U = buildUniform(), keepV = new Int32Array(nv).fill(-1); let kv = 0; const kt = [];
      for (let t = 0; t < ni; t += 3) {
        const a = idx[t], b = idx[t + 1], c = idx[t + 2];
        if (tag[a] === 0 || tag[a] === 4 || tag[b] === 0 || tag[b] === 4 || tag[c] === 0 || tag[c] === 4) continue;
        for (const v of [a, b, c]) if (keepV[v] < 0) keepV[v] = kv++;
        kt.push(keepV[a], keepV[b], keepV[c]);
      }
      const un = U.pos.length / 3, tot = kv + un;
      const P2 = new Float32Array(tot * 3), N2 = new Float32Array(tot * 3), I2 = new Uint16Array(tot * 4), W2 = new Float32Array(tot * 4), T2 = new Float32Array(tot), S2 = new Float32Array(tot).fill(1);
      for (let v = 0; v < nv; v++) { const k = keepV[v]; if (k < 0) continue;
        P2.set(pos.subarray(v * 3, v * 3 + 3), k * 3); N2.set(nor.subarray(v * 3, v * 3 + 3), k * 3); I2.set(sIdx.subarray(v * 4, v * 4 + 4), k * 4); W2.set(sW.subarray(v * 4, v * 4 + 4), k * 4); T2[k] = tag[v]; }
      P2.set(U.pos, kv * 3); N2.set(U.nor, kv * 3); I2.set(U.sIdx, kv * 4); W2.set(U.sW, kv * 4); T2.set(U.tag, kv); S2.set(U.shade, kv);
      const I3 = new Uint16Array(kt.length + U.idx.length); I3.set(kt); for (let i = 0; i < U.idx.length; i++) I3[kt.length + i] = U.idx[i] + kv;
      // uv continuas (sin costuras) a partir de la posición: el camuflaje se repite cada 0,45 m y no se estira en los lados
      const uv = new Float32Array(tot * 2);
      for (let i = 0; i < tot; i++) { const x = P2[i * 3], y = P2[i * 3 + 1], z = P2[i * 3 + 2]; uv[i * 2] = (x * 0.8 + z * 0.55 + y * 0.3) / 0.32; uv[i * 2 + 1] = (y * 0.85 - x * 0.35 + z * 0.4) / 0.32; }
      // base compartida (cuello, manos y uniforme); cada soldado le suma su equipo en una sola malla con piel
      this.base = { pos: P2, nor: N2, sIdx: I2, sW: W2, tag: T2, shade: S2, uv, idx: I3, n: tot };
      this.geo = this.base; this.ok = true;
    } catch (e) { console.warn('maniquí no disponible', e); this.geo = null; this.ok = false; }
    return this.geo;
  },
  // mano enguantada del maniquí para los brazos de primera persona: origen en la empuñadura, dedos hacia -Z, pulgar hacia +Y
  handGeo(sd) {
    const B = this.decode(); if (!B) return null;
    const j = sd > 0 ? 6 : 4, map = new Int32Array(B.n).fill(-1), pos = [], nor = [], idx = [], K = 0.95;
    const put = (v) => {
      if (map[v] >= 0) return map[v];
      const x = B.pos[v * 3] - sd * 0.251, y = B.pos[v * 3 + 1] - 0.88, z = B.pos[v * 3 + 2];
      pos.push(x * K, -z * K, y * K); nor.push(B.nor[v * 3], -B.nor[v * 3 + 2], B.nor[v * 3 + 1]);
      return (map[v] = pos.length / 3 - 1);
    };
    const ok = (v) => B.tag[v] === 2 && B.sIdx[v * 4] === j;
    for (let t = 0; t < B.idx.length; t += 3) { const a = B.idx[t], b = B.idx[t + 1], c = B.idx[t + 2]; if (ok(a) && ok(b) && ok(c)) idx.push(put(a), put(b), put(c)); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    g.computeBoundingSphere();
    return g;
  },
  // una baldosa de camuflaje que se repite (la mitad izquierda del atlas de camuflaje de las cajas)
  tile(camo) {
    let t = this.tex[camo];
    if (!t) {
      const src = camoTexture(camo).image, cv = document.createElement('canvas'); cv.width = cv.height = 128;
      cv.getContext('2d').drawImage(src, 0, 0, 128, 128, 0, 0, 128, 128);
      t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; t.userData.shared = true;
      this.tex[camo] = t;
    }
    return t;
  },
  // material propio de cada soldado (colores de piel, guantes y botas); todos comparten el mismo programa de sombreado
  material(camo, skin, glove, boot, pants) {
    const m = new THREE.MeshLambertMaterial({ map: this.tile(camo), vertexColors: true });
    const U = { uSkin: { value: new THREE.Color(skin) }, uGlove: { value: new THREE.Color(glove) }, uBoot: { value: new THREE.Color(boot) }, uPants: { value: new THREE.Color(pants) } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U); sh.uniforms.uSoldFill = SOLDIER_LIGHT.fill; sh.uniforms.uSoldRim = SOLDIER_LIGHT.rim;
      // el tag se resuelve por vértice (color de piel/guante/bota, cuánto camuflaje y cuánto pantalón) para que las uniones se mezclen suave
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aTag; attribute float aShade; uniform vec3 uSkin; uniform vec3 uGlove; uniform vec3 uBoot; varying vec3 vTint; varying vec3 vKit;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
        vKit = vec3(0.0, 0.0, aShade); vTint = vec3(1.0);
        if (aTag < 0.5) vKit.xy = vec2(1.0, 0.0); else if (aTag < 1.5) vTint = uSkin; else if (aTag < 2.5) vTint = uGlove; else if (aTag < 3.5) vTint = uBoot; else if (aTag < 4.5) vKit.xy = vec2(1.0, 1.0); else if (aTag < 5.5) vKit.xy = vec2(0.0, 0.0); else vKit.xy = vec2(1.0, 0.0);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform vec3 uPants; uniform vec3 uSoldFill; uniform vec3 uSoldRim; varying vec3 vTint; varying vec3 vKit;')
        .replace('#include <map_fragment>', `
        { vec3 cj = texture2D(map, vMapUv).rgb, cp = texture2D(map, vMapUv + vec2(0.37, 0.23)).rgb * uPants;
          vec3 camo = mix(cj, cp, vKit.y); diffuseColor.rgb *= mix(vTint, camo, vKit.x) * vKit.z; }`)
        .replace('#include <envmap_fragment>', `#include <envmap_fragment>
      { vec3 vdir = normalize(vViewPosition); float fr = 1.0 - clamp(abs(dot(normal, vdir)), 0.0, 1.0);
        float up = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
        outgoingLight += diffuseColor.rgb * (uSoldFill * (0.75 + 0.35 * up) + uSoldRim * pow(fr, 2.2)); }`);
    };
    m.customProgramCacheKey = () => 'cowmannequin6';
    return m;
  },
  // estilo cuadrado: las mismas piezas rígidas de siempre, fusionadas en UNA malla con piel (cada pieza pesa 1 sobre su hueso) y con el material de soldado de toda la vida
  skinnedBox(joints, gear, mat) {
    let tot = 0; for (const e of gear) tot += e.geo.attributes.position.count;
    const pos = new Float32Array(tot * 3), nor = new Float32Array(tot * 3), uv = new Float32Array(tot * 2), col = new Float32Array(tot * 3), sI = new Uint16Array(tot * 4), sW = new Float32Array(tot * 4);
    const idx = tot > 65000 ? new Uint32Array(tot) : new Uint16Array(tot);
    let o = 0;
    for (const e of gear) {
      const g = e.geo, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color, off = SKEL[PART_NAMES[e.j]].P, n = P.count;
      for (let i = 0; i < n; i++, o++) {
        pos[o * 3] = P.getX(i) + off.x; pos[o * 3 + 1] = P.getY(i) + off.y; pos[o * 3 + 2] = P.getZ(i) + off.z;
        nor[o * 3] = N.getX(i); nor[o * 3 + 1] = N.getY(i); nor[o * 3 + 2] = N.getZ(i);
        uv[o * 2] = U.getX(i); uv[o * 2 + 1] = U.getY(i); col[o * 3] = C.getX(i); col[o * 3 + 1] = C.getY(i); col[o * 3 + 2] = C.getZ(i);
        sI[o * 4] = e.j; sW[o * 4] = 1; idx[o] = o;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(sI, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sW, 4));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
    const bones = [], inv = [];
    for (const n of PART_NAMES) { bones.push(joints[n]); inv.push(new THREE.Matrix4().makeTranslation(-SKEL[n].P.x, -SKEL[n].P.y, -SKEL[n].P.z)); }
    const sm = new THREE.SkinnedMesh(g, mat);
    sm.bind(new THREE.Skeleton(bones, inv), new THREE.Matrix4());
    sm.frustumCulled = false; sm.castShadow = true; sm.receiveShadow = false; sm.name = 'cuerpo';
    return sm;
  },
  // malla con piel enlazada a las articulaciones (que ya son THREE.Bone): cuerpo + equipo de todas las articulaciones en UNA sola malla
  // (una llamada de dibujo por soldado en vez de once). gear = [{ j: índice de hueso, geo: PartBatch.build() en coordenadas de la articulación }]
  skinned(joints, camo, skin, glove, boot, pants, gear) {
    const B = this.decode(); if (!B) return null;
    const bones = [], inv = [];
    for (const n of PART_NAMES) { bones.push(joints[n]); inv.push(new THREE.Matrix4().makeTranslation(-SKEL[n].P.x, -SKEL[n].P.y, -SKEL[n].P.z)); }
    let gv = 0, gi = 0; for (const e of gear) { gv += e.geo.attributes.position.count; gi += e.geo.attributes.position.count; }
    const nb = B.n, tot = nb + gv;
    const pos = new Float32Array(tot * 3), nor = new Float32Array(tot * 3), uv = new Float32Array(tot * 2), col = new Float32Array(tot * 3).fill(1), tag = new Float32Array(tot), shade = new Float32Array(tot).fill(1);
    const sI = new Uint16Array(tot * 4), sW = new Float32Array(tot * 4), idx = tot > 65000 ? new Uint32Array(B.idx.length + gi) : new Uint16Array(B.idx.length + gi);
    pos.set(B.pos); nor.set(B.nor); uv.set(B.uv); tag.set(B.tag); shade.set(B.shade); sI.set(B.sIdx); sW.set(B.sW); idx.set(B.idx);
    let o = nb, io = B.idx.length;
    for (const e of gear) {
      const g = e.geo, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color, off = SKEL[PART_NAMES[e.j]].P, n = P.count;
      for (let i = 0; i < n; i++, o++) {
        pos[o * 3] = P.getX(i) + off.x; pos[o * 3 + 1] = P.getY(i) + off.y; pos[o * 3 + 2] = P.getZ(i) + off.z;
        nor[o * 3] = N.getX(i); nor[o * 3 + 1] = N.getY(i); nor[o * 3 + 2] = N.getZ(i);
        col[o * 3] = C.getX(i); col[o * 3 + 1] = C.getY(i); col[o * 3 + 2] = C.getZ(i);
        const u = U.getX(i); if (u < 0.5) { tag[o] = 6; uv[o * 2] = u * 2; uv[o * 2 + 1] = U.getY(i); } else tag[o] = 5;   // camuflaje del atlas / color plano
        sI[o * 4] = e.j; sW[o * 4] = 1;
        idx[io++] = o;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('skinIndex', new THREE.BufferAttribute(sI, 4)); g.setAttribute('skinWeight', new THREE.BufferAttribute(sW, 4));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aTag', new THREE.BufferAttribute(tag, 1)); g.setAttribute('aShade', new THREE.BufferAttribute(shade, 1));
    g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
    const sm = new THREE.SkinnedMesh(g, this.material(camo, skin, glove, boot, pants));
    sm.bind(new THREE.Skeleton(bones, inv), new THREE.Matrix4());
    sm.frustumCulled = false; sm.castShadow = true; sm.receiveShadow = false; sm.name = 'maniqui';
    return sm;
  },
};
