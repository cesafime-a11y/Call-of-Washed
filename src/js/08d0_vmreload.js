// ---- 08d0_vmreload.js ----
// =====================================================================
// RECARGAS DE PRIMERA PERSONA POR TIPO DE ARMA (3.2.2)
// Antes todas las armas recargaban igual: el cargador bajaba solo y la mano izquierda iba y venía por su cuenta.
// Ahora la mano se coloca sobre la pieza, la agarra y la pieza viaja pegada a la mano:
//   bottom / side / grip → cargador (abajo, lateral o dentro de la empuñadura): sacar, guardar, traer otro, meter, montar
//   clip   → fusil de cerrojo: abrir el cerrojo, traer el peine, empujar los cartuchos con el pulgar, cerrar
//   shells → escopeta de dos cañones: abrir por la bisagra, meter dos cartuchos, cerrar
// Todo en coordenadas del arma; VM.update lo pasa a la vista.
// =====================================================================
const _rlV = new THREE.Vector3(), _rlV2 = new THREE.Vector3(), _rlQ = new THREE.Quaternion(), _rlE = new THREE.Euler(), _rlAx = new THREE.Vector3(), _rlUp = new THREE.Vector3();
const rss = (a, b, t) => smooth01(clamp((t - a) / (b - a), 0, 1));
const _rlBasis = (x, y, z) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...x), new THREE.Vector3(...y), new THREE.Vector3(...z)));
const RL_QUP = _rlBasis([0, 1, 0], [-1, 0, 0], [0, 0, 1]);      // mano izquierda: palma arriba, dedos al frente, pulgar a la izquierda
const RL_QPUSH = _rlBasis([0, 0, 1], [0, -1, 0], [1, 0, 0]);    // mano derecha sobre el cajón: pulgar hacia abajo (empuja el peine), dedos hacia la izquierda
const RL_POUCH_R = new THREE.Vector3(0.16, -0.34, 0.22), RL_AUTO = { battle: 1, lmg: 1 };
// interpolación suave entre posiciones clave [t, Vector3, Quaternion]
function rlTrack(t, K, p, q) {
  let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++;
  const a = K[i], b = K[i + 1], k = smooth01(clamp((t - a[0]) / Math.max(1e-5, b[0] - a[0]), 0, 1));
  p.lerpVectors(a[1], b[1], k); q.copy(a[2]).slerp(b[2], k);
}
function rlInfo(M, isSec) {
  const U = M.userData; if (U._rl !== undefined) return U._rl;
  const mm = U.magMesh; let st = U.rl || null, bb = null;
  if (mm) { mm.geometry.computeBoundingBox(); bb = mm.geometry.boundingBox; }
  if (!st && bb && RL_AUTO[U.id]) st = bb.max.x - bb.min.x > (bb.max.y - bb.min.y) * 1.2 && bb.min.x < -0.05 ? 'side' : 'bottom';
  if ((st === 'bottom' || st === 'side' || st === 'grip' || st === 'cyl') && !bb) st = null;
  if (st === 'clip' && !(U.parts && U.parts.bolt && U.knob)) st = null;
  if (st === 'shells' && !(U.parts && U.parts.barrels)) st = null;
  if (!st) return (U._rl = null);
  const I = { st, charge: U.charge || null };
  if (bb) {
    I.c = bb.getCenter(new THREE.Vector3());
    if (st === 'bottom') { I.G = new THREE.Vector3(bb.min.x - 0.0155, bb.min.y + Math.min(0.05, (bb.max.y - bb.min.y) * 0.45), bb.min.z + 0.04); I.Q = new THREE.Quaternion(); I.O1 = new THREE.Vector3(0, -0.1, 0.012); I.O2 = new THREE.Vector3(-0.07, -0.16, 0.1); I.R2 = [0.35, 0, -0.4]; }
    else if (st === 'side') { I.G = new THREE.Vector3(bb.min.x + Math.min(0.05, (bb.max.x - bb.min.x) * 0.45), bb.min.y - 0.0155, bb.min.z + 0.04); I.Q = RL_QUP.clone(); I.O1 = new THREE.Vector3(-0.07, -0.015, 0); I.O2 = new THREE.Vector3(-0.02, -0.2, 0.1); I.R2 = [0.3, 0, 0.6]; }
    else if (st === 'cyl') { I.G = new THREE.Vector3(bb.min.x - 0.014, I.c.y - 0.008, I.c.z + 0.01); I.Q = RL_QUP.clone(); I.O1 = new THREE.Vector3(-0.03, -0.014, 0); }
    else { I.G = new THREE.Vector3(I.c.x, bb.min.y - 0.017, bb.max.z - 0.012); I.Q = RL_QUP.clone(); I.O1 = new THREE.Vector3(0, -0.092, 0.039); I.O2 = new THREE.Vector3(-0.05, -0.3, 0.1); I.R2 = [0.3, 0, -0.3]; }
  }
  return (U._rl = I);
}
// piezas en reposo (fuera de la recarga)
function vmReloadRest(M) {
  const U = M.userData, mm = U.magMesh, P = U.parts || {};
  if (mm) { mm.position.set(0, 0, 0); mm.rotation.set(0, 0, 0); mm.visible = true; }
  if (P.bolt) { P.bolt.position.copy(U.pivots.bolt); P.bolt.rotation.set(0, 0, 0); }
  if (P.barrels) P.barrels.rotation.set(0, 0, 0);
}
// t = avance de la recarga (0..1). Devuelve en o: Lw/Lp/Lq y Rw/Rp/Rq (peso, posición y giro de cada mano en el arma), Lpose/Rpose, tiltK, seat, clip, shells
function vmReload(M, t, isSec, o) {
  const U = M.userData, I = rlInfo(M, isSec); if (!I) return null;
  if (!o.Lp) { o.Lp = new THREE.Vector3(); o.Rp = new THREE.Vector3(); o.Lq = new THREE.Quaternion(); o.Rq = new THREE.Quaternion(); o.propP = new THREE.Vector3(); o.propQ = new THREE.Quaternion(); o.K = []; for (let i = 0; i < 12; i++) o.K.push([0, new THREE.Vector3(), new THREE.Quaternion()]); }
  o.Lw = o.Rw = 0; o.Lpose = o.Rpose = null; o.tiltK = 1; o.py = 0; o.seat = 0; o.clip = o.shells = false; o.barTh = 0; o.push = 0; o.rx = 0;
  const mm = U.magMesh, P = U.parts || {}, gp = U.grip, st = I.st;
  let boltZ = 0, boltR = 0;
  const key = (i, tt, x, y, z, q) => { const k = o.K[i]; k[0] = tt; k[1].set(x, y, z); k[2].copy(q); };
  if (st === 'cyl') {   // revólver: el tambor sale a la izquierda, la mano lo vacía, trae los cartuchos y lo cierra
    const out = rss(0.08, 0.18, t) - rss(0.78, 0.86, t), po = rss(0.3, 0.4, t) - rss(0.52, 0.64, t);
    mm.position.copy(I.O1).multiplyScalar(out); mm.rotation.set(0, 0, 0); mm.visible = true;
    o.Lp.copy(I.G).addScaledVector(I.O1, out).lerp(_rlV.set(-0.12, -0.24, 0.16), po); o.Lq.copy(I.Q); o.Lw = rss(0.02, 0.1, t) - rss(0.84, 0.92, t);
    o.Lpose = o.Lw > 0.45 ? 'pinch' : null; o.shells = po > 0.05 && t > 0.4; o.propP.copy(o.Lp).add(_rlV2.set(0.012, 0.03, -0.03)); o.propQ.identity();
    o.seat = t > 0.84 && t < 0.9 ? Math.sin((t - 0.84) / 0.06 * Math.PI) : 0;
    const k = rss(0.02, 0.14, t) - rss(0.8, 0.92, t); o.rx = -0.3 * k; o.py = -0.03 * k; o.tiltK = 0.2;
  } else if (st === 'bottom' || st === 'side' || st === 'grip') {
    const w = rss(0.03, 0.12, t) - rss(0.68, 0.76, t), sx = rss(0.12, 0.2, t) - rss(0.56, 0.66, t), dn = rss(0.2, 0.32, t) - rss(0.44, 0.56, t);
    _rlE.set(I.R2[0] * dn, I.R2[1] * dn, I.R2[2] * dn); _rlQ.setFromEuler(_rlE);
    // el cargador gira sobre su centro y se desplaza: primero sale de su alojamiento, luego baja a la cartuchera
    _rlV.copy(I.O1).multiplyScalar(sx).addScaledVector(I.O2, dn);
    mm.rotation.copy(_rlE); mm.position.copy(I.c).add(_rlV).sub(_rlV2.copy(I.c).applyQuaternion(_rlQ)); mm.visible = true;
    // la mano va pegada al cargador (en la pistola espera debajo y el cargador le cae en la palma)
    const hs = st === 'grip' && t < 0.2 ? 1 : sx;
    _rlV.copy(I.O1).multiplyScalar(hs).addScaledVector(I.O2, dn);
    o.Lp.copy(I.G).sub(I.c).applyQuaternion(_rlQ).add(I.c).add(_rlV); o.Lq.copy(_rlQ).multiply(I.Q); o.Lw = w;
    o.Lpose = w > 0.45 ? (st === 'grip' && sx < 0.5 ? 'flat' : 'M') : null;
    o.seat = t > 0.63 && t < 0.72 ? Math.sin((t - 0.63) / 0.09 * Math.PI) : 0;
    if (I.charge) {   // montar: la derecha suelta la empuñadura, tira de la palanca y vuelve
      const ck = rss(0.76, 0.82, t) - rss(0.92, 0.98, t), pull = rss(0.82, 0.87, t) - rss(0.88, 0.92, t);
      boltZ = pull * 0.06; o.Rw = ck; o.Rp.set(I.charge.x + 0.03, I.charge.y - 0.012, I.charge.z + 0.05 + boltZ); o.Rq.setFromEuler(_rlE.set(-0.35, 0, 0.35, 'YXZ')); if (ck > 0.4) o.Rpose = 'pinch';
      _rlE.order = 'XYZ';
    } else if (U.boltKind === 'slide') boltZ = (rss(0.76, 0.8, t) - rss(0.84, 0.86, t)) * 0.03;
    o.tiltK = st === 'grip' ? 0.25 : st === 'side' ? 0.35 : 0.7;
    { const k = rss(0.02, 0.14, t) - rss(0.72, 0.86, t); if (st === 'grip') { o.rx = -0.3 * k; o.py = 0.05 * k; } else o.py = 0.05 * k; }   // el arma sube y se inclina para que se vea el cambio de cargador   // la pistola se inclina hacia delante para ver la culata
  } else if (st === 'clip') {
    boltR = rss(0.08, 0.12, t) - rss(0.86, 0.9, t); boltZ = (rss(0.12, 0.18, t) - rss(0.78, 0.86, t)) * 0.095;
    const by = U.by, q0 = _rlQ.setFromEuler(_rlE.set(gp.tilt, 0, 0, 'YXZ')).clone(); _rlE.order = 'XYZ';
    // pomo del cerrojo: gira con el cerrojo (r) y retrocede con él (z); la mano lo coge por detrás
    const qk = new THREE.Quaternion().setFromEuler(_rlE.set(-0.15, 0, 0.35, 'YXZ')); _rlE.order = 'XYZ';
    const hb = (i, tt, r, z) => { const a = r * 1.05, c = Math.cos(a), s = Math.sin(a), kx = U.knob.x * c - U.knob.y * s, ky = U.knob.x * s + U.knob.y * c; key(i, tt, kx + 0.028, by + ky - 0.004, U.knob.z + z * 0.095 + 0.032, tt <= 0.08 || tt >= 0.9 ? q0 : qk); };
    const sx = 0, syy = by + 0.016, sz = -0.012;   // asiento del peine en las guías del puente
    hb(0, 0.08, 0, 0); hb(1, 0.12, 1, 0); hb(2, 0.18, 1, 1);
    key(3, 0.33, RL_POUCH_R.x, RL_POUCH_R.y, RL_POUCH_R.z, q0);
    key(4, 0.48, sx + 0.03, syy + 0.155, sz + 0.012, RL_QPUSH); key(5, 0.56, sx + 0.03, syy + 0.155, sz + 0.012, RL_QPUSH); key(6, 0.66, sx + 0.03, syy + 0.1, sz + 0.012, RL_QPUSH);
    hb(7, 0.77, 1, 1); hb(8, 0.86, 1, 0); hb(9, 0.9, 0, 0); hb(10, 0.91, 0, 0); hb(11, 0.92, 0, 0);
    rlTrack(clamp(t, 0.08, 0.9), o.K, o.Rp, o.Rq); o.Rw = rss(0, 0.08, t) - rss(0.9, 1, t);
    o.Rpose = t > 0.26 && t < 0.72 ? 'push' : o.Rw > 0.4 ? 'pinch' : null;
    o.push = rss(0.57, 0.66, t); const fl = clamp((t - 0.685) / 0.05, 0, 1);
    // el peine llega en la mano, se queda en las guías mientras el pulgar empuja y salta al cerrar
    o.clip = t > 0.3 && t < 0.735; o.propQ.identity();
    if (t < 0.48) { o.propP.set(sx, syy, sz).sub(_rlV.set(sx + 0.03, syy + 0.155, sz + 0.012)).applyQuaternion(_rlQ.copy(RL_QPUSH).invert()).applyQuaternion(o.Rq).add(o.Rp); o.propQ.copy(o.Rq).multiply(_rlQ); }
    else { o.propP.set(sx + fl * 0.1, syy + fl * 0.07 - fl * fl * 0.05, sz); o.propQ.setFromEuler(_rlE.set(0, 0, -fl * 2.2)); }
    o.tiltK = 0.3; o.rx = 0.1 * (rss(0.1, 0.2, t) - rss(0.8, 0.9, t));
  } else {   // shells
    const op = rss(0.04, 0.14, t) - rss(0.74, 0.82, t), th = -op * 0.62, piv = U.pivots.barrels; o.barTh = th;
    P.barrels.rotation.set(th, 0, 0);
    const ax = _rlAx.set(0, Math.sin(th), -Math.cos(th)), up = _rlUp.set(0, Math.cos(th), Math.sin(th));
    const q0 = _rlQ.setFromEuler(_rlE.set(gp.tilt, 0, 0, 'YXZ')).clone(), qI = new THREE.Quaternion().setFromEuler(_rlE.set(th - 0.3, 0, 0.25, 'YXZ')); _rlE.order = 'XYZ';
    // recámaras: sobre la bisagra; la mano llega por detrás con los dos cartuchos en la punta de los dedos
    const C = _rlV.copy(piv).addScaledVector(up, 0.03), pS = _rlV2.copy(C).addScaledVector(ax, -0.11); pS.x += 0.03; pS.y -= 0.01;
    key(0, 0.14, 0, 0, 0, q0); o.K[0][1].set(gp.w / 2 + 0.0155, gp.y, gp.z + 0.02);
    key(1, 0.3, RL_POUCH_R.x, RL_POUCH_R.y, RL_POUCH_R.z, qI);
    key(2, 0.44, pS.x, pS.y + up.y * 0.03 - ax.y * 0.08, pS.z + up.z * 0.03 - ax.z * 0.08, qI); key(3, 0.56, pS.x, pS.y, pS.z, qI); key(4, 0.62, pS.x, pS.y, pS.z, qI);
    key(5, 0.74, o.K[0][1].x, o.K[0][1].y, o.K[0][1].z, q0); for (let i = 6; i < 12; i++) key(i, 0.75 + i * 0.001, o.K[0][1].x, o.K[0][1].y, o.K[0][1].z, q0);
    rlTrack(clamp(t, 0.14, 0.74), o.K, o.Rp, o.Rq); o.Rw = rss(0.14, 0.2, t) - rss(0.68, 0.76, t);
    o.Rpose = t > 0.2 && t < 0.68 ? 'pinch' : null;
    o.shells = t > 0.27 && t < 0.565; o.propP.set(-0.03, 0.01, 0).applyQuaternion(o.Rq).add(o.Rp).addScaledVector(_rlV.set(0, 0, -1).applyQuaternion(o.Rq), 0.085); o.propQ.copy(o.Rq);
    o.tiltK = 0.5; o.rx = 0.12 * op;
  }
  if (P.bolt) { P.bolt.position.copy(U.pivots.bolt); P.bolt.position.z += boltZ; P.bolt.rotation.set(0, 0, boltR * 1.05); }
  return o;
}
// peine de cinco cartuchos y par de cartuchos de escopeta (se ven en la mano durante la recarga)
function buildReloadProps() {
  const brass = new THREE.MeshLambertMaterial({ color: 0xb8923a, emissive: 0x1c1608 }), red = new THREE.MeshLambertMaterial({ color: 0x8a2a20, emissive: 0x140605 }), steel = new THREE.MeshLambertMaterial({ color: 0x55585c });
  const clip = new THREE.Group(), rounds = new THREE.Group(); clip.add(rounds);
  for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0058, 0.006, 0.056, 8), brass); c.rotation.x = Math.PI / 2; c.position.set(0, 0.006 + i * 0.0122, -0.03); const b = new THREE.Mesh(new THREE.ConeGeometry(0.0042, 0.026, 8), brass); b.rotation.x = -Math.PI / 2; b.position.set(0, 0.006 + i * 0.0122, -0.07); rounds.add(c, b); }
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.064, 0.004), steel); strip.position.set(0, 0.03, 0); clip.add(strip); clip.userData.rounds = rounds;
  const shells = new THREE.Group();
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0088, 0.0088, 0.05, 10), red); c.rotation.x = Math.PI / 2; c.position.set(s * 0.0118, 0, 0); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.0092, 0.0092, 0.012, 10), brass); h.rotation.x = Math.PI / 2; h.position.set(s * 0.0118, 0, 0.03); shells.add(c, h); }
  clip.visible = shells.visible = false;
  return { clip, shells };
}
// accionar el cerrojo tras cada disparo (fusiles de cerrojo): k = avance 0..1. La mano derecha suelta la garganta, sube la manilla,
// tira hacia atrás (sale la vaina), empuja, la baja y vuelve. Devuelve en o lo mismo que vmReload (solo la mano derecha).
function vmBoltCycle(M, k, o) {
  const U = M.userData, P = U.parts || {}; if (!P.bolt || !U.knob) return null;
  if (!o.Rp) { o.Lp = new THREE.Vector3(); o.Rp = new THREE.Vector3(); o.Lq = new THREE.Quaternion(); o.Rq = new THREE.Quaternion(); }
  const r = rss(0.08, 0.24, k) - rss(0.78, 0.92, k), z = rss(0.24, 0.45, k) - rss(0.55, 0.76, k), a = r * 1.05, c = Math.cos(a), s = Math.sin(a);
  P.bolt.position.copy(U.pivots.bolt); P.bolt.position.z += z * 0.095; P.bolt.rotation.set(0, 0, a);
  const kx = U.knob.x * c - U.knob.y * s, ky = U.knob.x * s + U.knob.y * c;
  o.Rp.set(kx + 0.028, U.by + ky - 0.004, U.knob.z + z * 0.095 + 0.032); o.Rq.setFromEuler(_rlE.set(-0.15, 0, 0.35, 'YXZ')); _rlE.order = 'XYZ';
  o.Rw = rss(0, 0.1, k) - rss(0.88, 1, k); o.Rpose = o.Rw > 0.4 ? 'pinch' : null;
  o.Lw = 0; o.Lpose = null; o.tiltK = 0; o.py = 0; o.seat = 0; o.clip = o.shells = false; o.push = 0;
  o.rx = 0.05 * (r + z) * 0.5; o.eject = k > 0.4 && k < 0.5;
  return o;
}
