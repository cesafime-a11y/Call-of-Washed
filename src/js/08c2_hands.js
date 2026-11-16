// ---- 08c2_hands.js ----
// =====================================================================
// MANOS ARTICULADAS DE PRIMERA PERSONA (3.2.1)
// Sustituyen a las dos mallas fijas (abierta / cerrada) de gloveHandGeo:
// cada dedo son tres falanges con su articulación y el pulgar otras tres,
// así la mano cambia de postura con suavidad (empuñar, dedo en el gatillo,
// apretar al disparar, soltar para recargar, abrir para trepar o lanzar).
// Mismo marco que antes: dedos hacia -Z, pulgar hacia +Y, palma mirando a
// -X en la mano derecha (sd = 1); la izquierda es el espejo.
// =====================================================================
// posturas: f = flexión de cada articulación [nudillo, media, punta] para índice, corazón, anular y meñique;
// sp = separación de los dedos; th = dirección de los tres huesos del pulgar (mano derecha)
const HAND_TH = {
  wrap: [[-0.012, 0.014, -0.016], [-0.021, 0.005, -0.013], [-0.02, -0.005, -0.006]],      // cruzado sobre la empuñadura
  along: [[-0.008, 0.014, -0.02], [-0.008, 0.008, -0.024], [-0.006, 0.002, -0.024]],  // tendido hacia delante por el costado
  out: [[-0.004, 0.018, -0.016], [-0.002, 0.018, -0.02], [0.0, 0.012, -0.022]],       // abierto
  pinch: [[-0.012, 0.01, -0.02], [-0.02, 0.002, -0.016], [-0.02, -0.006, -0.008]],    // opuesto a los dedos
};
const HAND_POSES = {
  open: { f: [[0.1, 0.18, 0.12], [0.08, 0.18, 0.12], [0.1, 0.2, 0.15], [0.14, 0.26, 0.18]], sp: 1, th: HAND_TH.out },
  flat: { f: [[-0.12, 0.1, 0.06], [-0.14, 0.1, 0.06], [-0.12, 0.1, 0.08], [-0.08, 0.14, 0.1]], sp: 1.3, th: HAND_TH.out },
  grip: { f: [[0.42, 0.85, 0.45], [1.15, 0.42, 0.16], [1.17, 0.42, 0.16], [1.2, 0.44, 0.18]], sp: 0, th: HAND_TH.wrap },
  gripOff: { f: [[0.1, 0.1, 0.06], [1.15, 0.42, 0.16], [1.17, 0.42, 0.16], [1.2, 0.44, 0.18]], sp: 0, th: HAND_TH.wrap },
  fist: { f: [[1.2, 0.5, 0.22], [1.2, 0.5, 0.22], [1.22, 0.5, 0.22], [1.25, 0.52, 0.24]], sp: 0, th: HAND_TH.wrap },
  cup: { f: [[1.38, 0.72, 0.55], [1.4, 0.75, 0.6], [1.42, 0.75, 0.6], [1.45, 0.78, 0.6]], sp: 0.2, th: HAND_TH.along },
  wrap: { f: [[1.05, 0.46, 0.2], [1.1, 0.46, 0.2], [1.12, 0.46, 0.2], [1.16, 0.48, 0.22]], sp: 0, th: HAND_TH.along },
  pinch: { f: [[0.95, 0.7, 0.4], [1.0, 0.7, 0.4], [1.04, 0.72, 0.42], [1.1, 0.74, 0.44]], sp: 0.1, th: HAND_TH.pinch },
  push: { f: [[0.5, 0.6, 0.35], [0.6, 0.65, 0.4], [0.7, 0.7, 0.4], [0.8, 0.7, 0.42]], sp: 0.2, th: HAND_TH.out },   // pulgar tendido para empujar los cartuchos del peine
  hold: { f: [[0.6, 0.5, 0.3], [0.64, 0.5, 0.3], [0.68, 0.5, 0.3], [0.76, 0.52, 0.32]], sp: 0.5, th: HAND_TH.pinch },
};
const HAND_WRIST = 0.062, HAND_MAX = [1.5, 1.65, 1.2];
const _hdZ = new THREE.Vector3(0, 0, -1), _hdV = new THREE.Vector3(), _hdQ = new THREE.Quaternion(), _hdQ2 = new THREE.Quaternion();
// volumen por secciones a lo largo de z: h = alto (eje del pulgar, Y), t = grosor (X), x = desplazamiento hacia el dorso, e = exponente (más alto, más cuadrado)
function handLoft(st, sd, seg = 16) {
  const pos = [], idx = [], N = st.length;
  for (let i = 0; i < N; i++) { const s = st[i], e = 2 / (s.e || 2.6);
    for (let k = 0; k <= seg; k++) { const a = k / seg * TAU, c = Math.cos(a), sn = Math.sin(a); pos.push(sd * (s.x + Math.sign(c) * Math.pow(Math.abs(c), e) * s.t / 2), Math.sign(sn) * Math.pow(Math.abs(sn), e) * s.h / 2, s.z); } }
  const quad = (a, b, c, d) => { if (sd < 0) idx.push(a, b, c, c, b, d); else idx.push(a, c, b, c, d, b); };
  for (let i = 0; i < N - 1; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, b = a + seg + 1; quad(a, a + 1, b, b + 1); }
  for (const [i, flip] of [[0, false], [N - 1, true]]) { const s = st[i], c0 = pos.length / 3; pos.push(sd * s.x, 0, s.z); for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k; if ((sd < 0) !== flip) idx.push(c0, a, a + 1); else idx.push(c0, a + 1, a); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function buildArtHand(sd, base, mat, o = {}) {
  const bare = o.bare !== false, X = Math.PI / 2;
  const leather = shade(base, bare ? -0.08 : -0.28), body = base, tip = shade(base, bare ? 0.06 : -0.16), knuck = shade(base, bare ? -0.1 : -0.5), nail = shade(base, 0.22), crease = shade(base, -0.2);
  const H = new THREE.Group();
  const mesh = (B, par) => { const m = new THREE.Mesh(B.build(), mat); par.add(m); return m; };
  // palma y muñeca: un solo volumen redondeado por secciones (de la muñeca a los nudillos), con la eminencia del pulgar y los nudillos encima
  { const B = new PartBatch();
    B.add(handLoft([{ z: 0.064, h: 0.04, t: 0.028, x: 0, e: 2.2 }, { z: 0.056, h: 0.054, t: 0.033, x: 0.0005, e: 2.3 }, { z: 0.04, h: 0.064, t: 0.032, x: 0.001, e: 2.5 }, { z: 0.02, h: 0.078, t: 0.029, x: 0.002, e: 2.8 },
      { z: -0.01, h: 0.086, t: 0.028, x: 0.003, e: 3 }, { z: -0.035, h: 0.088, t: 0.026, x: 0.003, e: 3 }, { z: -0.05, h: 0.084, t: 0.021, x: 0.003, e: 2.6 }], sd, 18), 0, 0, 0, body);
    B.add(GEO.sphere(0.0335, 16, 12), 0, 0, HAND_WRIST, body, { sy: 0.86, sx: 0.98 });   // articulación de la muñeca: tapa el giro entre la mano y el antebrazo
    B.add(GEO.sphere(0.017, 12, 10), sd * -0.012, 0.026, 0.02, leather, { sz: 1.7, sy: 1.1 });   // eminencia tenar (base del pulgar)
    B.add(GEO.sphere(0.012, 10, 8), sd * -0.011, -0.026, 0.012, leather, { sz: 2.2 });           // canto de la palma
    for (const y of [0.032, 0.0107, -0.0107, -0.032]) B.add(GEO.sphere(0.0112, 12, 8), sd * 0.0075, y, -0.046, knuck);
    mesh(B, H); }
  // hueso a lo largo de -Z con esfera en la articulación de origen (tapa el hueco al doblarse)
  const bone = (par, len, r0, r1, color, nailK) => {
    const B = new PartBatch();
    B.add(GEO.sphere(r0 * 1.02, 12, 8), 0, 0, 0, color).add(GEO.cyl(r1, r0, len, 12), 0, 0, -len / 2, color, { rx: -X }).add(GEO.sphere(r1, 12, 8), 0, 0, -len, color);
    if (nailK) B.add(GEO.rbox(0.0035, r1 * 1.45, len * 0.56, 0.0015), sd * r1 * 0.72, 0, -len * 0.62, nail);
    else B.add(GEO.box(0.002, r0 * 1.5, 0.0016), sd * r0 * 0.9, 0, -0.003, crease);   // pliegue del nudillo en el dorso
    return mesh(B, par);
  };
  const fingers = [[0.032, 0.92, 0.0112], [0.0107, 1.0, 0.0116], [-0.0107, 0.93, 0.011], [-0.032, 0.74, 0.01]], F = [];
  for (const [y, k, r] of fingers) {
    const j0 = new THREE.Group(), j1 = new THREE.Group(), j2 = new THREE.Group();
    j0.position.set(sd * 0.001, y, -0.045); j1.position.z = -0.036 * k; j2.position.z = -0.026 * k; H.add(j0); j0.add(j1); j1.add(j2);
    bone(j0, 0.036 * k, r, r * 0.95, body); bone(j1, 0.026 * k, r * 0.95, r * 0.9, body); bone(j2, 0.022 * k, r * 0.9, r * 0.82, tip, true);
    F.push([j0, j1, j2]);
  }
  // pulgar: tres huesos desde la base de la palma
  const T = []; { let par = H; const L = [0.0245, 0.0263, 0.0216], R = [[0.0145, 0.0135], [0.0132, 0.0122], [0.0122, 0.0112]], C = [leather, body, tip];
    for (let i = 0; i < 3; i++) { const j = new THREE.Group(); if (i === 0) j.position.set(sd * -0.008, 0.034, 0.022); else j.position.z = -L[i - 1]; par.add(j); bone(j, L[i], R[i][0], R[i][1], C[i], i === 2); T.push(j); par = j; } }
  // estado: postura actual (se acerca a la pedida con suavidad) y apretón del gatillo
  const cur = { f: HAND_POSES.grip.f.map((a) => a.slice()), sp: 0, th: HAND_TH.wrap.map((a) => a.slice()) }; let tgt = HAND_POSES.grip, first = true;
  const apply = (trig) => {
    for (let i = 0; i < 4; i++) { const a = cur.f[i], J = F[i], tk = i === 0 ? trig : 0;
      J[0].rotation.set(0, sd * (a[0] + tk * 0.14), 0); J[0].rotation.x = -(1.5 - i) * 0.07 * cur.sp; J[1].rotation.y = sd * (a[1] + tk * 0.3); J[2].rotation.y = sd * (a[2] + tk * 0.12); }
    _hdQ2.identity();
    for (let i = 0; i < 3; i++) { const d = cur.th[i]; _hdQ.setFromUnitVectors(_hdZ, _hdV.set(sd * d[0], d[1], d[2]).normalize()); T[i].quaternion.copy(_hdQ2).invert().multiply(_hdQ); _hdQ2.copy(_hdQ); }
  };
  H.userData.hand = {
    // name: postura de HAND_POSES · trig: apretón del dedo índice (0..1) · rate: rapidez del cambio
    set(name, dt, trig = 0, rate = 16) {
      tgt = (typeof name === 'object' && name) || HAND_POSES[name] || HAND_POSES.grip; const k = first ? 1 : 1 - Math.exp(-rate * dt); first = false;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) cur.f[i][j] += (tgt.f[i][j] - cur.f[i][j]) * k;
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cur.th[i][j] += (tgt.th[i][j] - cur.th[i][j]) * k;
      cur.sp += (tgt.sp - cur.sp) * k; apply(trig);
    },
    snap(name) { first = true; this.set(name, 0); },
    // pone la mano en una postura exacta sin suavizar (para medir el contacto con el arma)
    raw(f, th) { for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) cur.f[i][j] = f[i][j]; if (th) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cur.th[i][j] = th[i][j]; cur.sp = 0; apply(0); first = true; },
    F, T, sd, len: fingers.map(([y, k]) => [0.036 * k, 0.026 * k, 0.022 * k]), rad: fingers.map(([y, k, r]) => [r, r * 0.95, r * 0.9]), tlen: [0.0245, 0.0263, 0.0216], trad: [0.014, 0.0127, 0.0117],
  };
  H.userData.hand.snap('grip');
  return H;
}

// ---------------------------------------------------------------------
// AJUSTE DE LA MANO AL ARMA (3.2.2): cada dedo se cierra articulación por articulación hasta que toca el arma y se queda ahí,
// así rodea la pieza que tenga debajo (culata, empuñadura, camisa del cañón, cargador…) sin atravesarla, sea cual sea el arma o el accesorio.
// H = mano ya colocada (con sus matrices al día) · base = postura de partida · targets = mallas contra las que se mide
// o.index = flexión máxima del índice (dedo del gatillo), o null para tratarlo como los demás
// ---------------------------------------------------------------------
const _hfRay = new THREE.Raycaster(), _hfO = new THREE.Vector3(), _hfD = new THREE.Vector3(), _hfN = new THREE.Vector3(), _hfQ = new THREE.Quaternion(), _hfHits = [], _hfSling = new THREE.Color(0x5a3a22);
function fitHandPose(H, base, targets, o = {}) {
  const hd = H.userData.hand, sd = hd.sd, f = base.f.map((a) => [0, 0, 0]), ths = o.thumbs || [base.th];
  // la correa portafusil no cuenta: cuelga bajo la culata y los dedos la apartan
  const anyHit = () => { _hfHits.length = 0; _hfRay.intersectObjects(targets, false, _hfHits);
    for (const h of _hfHits) { const c = h.object.geometry.attributes.color; if (!c || !h.face) return true; if (Math.abs(c.getX(h.face.a) - _hfSling.r) > 0.004 || Math.abs(c.getY(h.face.a) - _hfSling.g) > 0.004 || Math.abs(c.getZ(h.face.a) - _hfSling.b) > 0.004) return true; }
    return false; };
  const hitBone = (J, len, r, lift = 0.75) => {
    J.updateWorldMatrix(true, false); J.getWorldQuaternion(_hfQ); _hfD.set(0, 0, -1).applyQuaternion(_hfQ); _hfN.set(-sd, 0, 0).applyQuaternion(_hfQ);
    for (const k of [lift, 0]) {   // cara interior del dedo y eje
      _hfO.setFromMatrixPosition(J.matrixWorld).addScaledVector(_hfN, r * k).addScaledVector(_hfD, 0.002);
      _hfRay.set(_hfO, _hfD); _hfRay.near = 0; _hfRay.far = len + r * 0.6;
      if (anyHit()) return true;
    }
    return false;
  };
  // ¿la punta de la falange queda ya pegada a la pieza por su cara interior? (el dedo ha dado la vuelta y abraza)
  const tipNear = (J, len, r) => {
    J.updateWorldMatrix(true, false); J.getWorldQuaternion(_hfQ); _hfD.set(0, 0, -1).applyQuaternion(_hfQ); _hfN.set(-sd, 0, 0).applyQuaternion(_hfQ);
    _hfO.setFromMatrixPosition(J.matrixWorld).addScaledVector(_hfD, len); _hfRay.set(_hfO, _hfN); _hfRay.near = 0; _hfRay.far = r + 0.006;
    return anyHit();
  };
  hd.raw(f, ths[0]); H.updateMatrixWorld(true);
  for (let i = 0; i < 4; i++) {
    const J = hd.F[i], lim = i === 0 && o.index ? o.index : HAND_MAX; let touched = false;
    for (let j = 0; j < 3; j++) {
      const set = (a) => { J[j].rotation.y = sd * a; f[i][j] = a; }, L = hd.len[i][j], R = hd.rad[i][j];
      set(0);
      if (hitBone(J[j], L, R)) { touched = true; continue; }   // ya apoyado: esta falange se queda tendida sobre la pieza
      let lo = 0, hi = -1; const st = 0.11;
      let wrapped = false;
      for (let a = st; a <= lim[j] + 1e-6; a += st) { set(a); if (hitBone(J[j], L, R)) { hi = a; break; } lo = a; if (a > 0.3 && tipNear(J[j], L, R)) { wrapped = true; touched = true; break; } }
      if (wrapped) continue;
      if (hi < 0) {   // sin contacto: la flexión de la postura base, más lo que no pudieron doblar las articulaciones anteriores
        if (i === 0 && o.index) set(lim[j]); else { let prev = 0, rest = 0, tot = 0; for (let q = 0; q < 3; q++) { tot += base.f[i][q]; if (q < j) prev += f[i][q]; if (q > j) rest += base.f[i][q]; } set(Math.min(lim[j], Math.max(base.f[i][j], tot - prev - rest))); }
        continue; }
      for (let n = 0; n < 3; n++) { const m = (lo + hi) / 2; set(m); if (hitBone(J[j], L, R)) hi = m; else lo = m; }
      set(lo); touched = true;
    }
  }
  // pulgar: la primera postura candidata que no atraviesa nada
  let th = ths[ths.length - 1];
  for (const c of ths) { hd.raw(f, c); H.updateMatrixWorld(true); let bad = false; for (let i = 0; i < 3 && !bad; i++) bad = hitBone(hd.T[i], hd.tlen[i] * 0.9, hd.trad[i], 0); if (!bad) { th = c; break; } }
  return { f, sp: 0, th };
}
