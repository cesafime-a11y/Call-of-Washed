// ---- 08h_proto_bridge.js ----
// =====================================================================
// PUENTE DE ARMAS (3.2.0) — monta los diseños del prototipo v4 (PROTO, en
// 08g_proto_guns.js) dentro del sistema de armas de la 3.1.4: misma malla
// única con colores por vértice, mismos accesorios, mismos datos de disparo.
// weaponGeometry() llama a protoGun() en lugar de periodGun() para las
// armas de PROTO_MAP; el resto del juego no nota la diferencia.
// =====================================================================
const PROTO_MAP = { rifle: 'ferran', dmr: 'vardenes', smg: 'subfusil', tsmg: 'subfusilV', dbl: 'escopeta', mg2: 'ametrallador', pistol: 'orbea', hp45: 'pistolaV' };
// ajustes por arma: bore = altura del ánima en el diseño; tilt/w = inclinación y ancho de la empuñadura para la mano derecha
const PROTO_FIT = {
  rifle: { bore: 0.03, tilt: -0.6, gup: 0.006, gz: 0.035, w: 0.036, band: -0.33, opticZ: -0.02 }, dmr: { bore: 0.03, tilt: -0.6, gup: 0.006, gz: 0.035, w: 0.036, band: -0.33, opticZ: -0.02 },
  smg: { bore: 0.03, tilt: -0.25, w: 0.03, band: -0.2 }, tsmg: { bore: 0.03, tilt: -0.3, w: 0.03, band: -0.2 },
  dbl: { bore: 0.03, tilt: -0.6, gup: 0.006, gz: 0.035, w: 0.036, band: -0.3, sy: 0.012 }, mg2: { bore: 0.03, tilt: -0.25, w: 0.032, band: -0.42, opticZ: 0.0 },
  pistol: { bore: 0.034, tilt: -0.22, w: 0.03 }, hp45: { bore: 0.03, tilt: -0.45, w: 0.03 },
};
const _protoM = {}; for (const k of ['wood', 'steel', 'steelW', 'brass', 'leather', 'dark', 'bak']) _protoM[k] = { k };
const _protoBox = new THREE.Box3();
function protoGun(id, H, u0) {
  const { B, X, GUN, u, att, vm, bx, tb, muzzleAtt, barrelAtt, gripAtt, stockAtt, opticAtt } = H;
  const pid = PROTO_MAP[id], PG = PROTO.GUNS[pid], F = PROTO_FIT[id];
  const COL = { wood: GUN.wood, steel: GUN.metal, steelW: GUN.steel, brass: 0xc9a24a, leather: 0x5a3a22, dark: 0x0e0f10, bak: 0x2b1e17 };
  PROTO.setLOD(vm ? 1 : 0.5);
  const g = PROTO.buildGun(pid, _protoM), P = g.userData.parts;
  // el diseño se coloca con el ánima a la misma altura que tenía el arma de la 3.1.4: así valen sus posturas de cadera y de hombro
  const dy = u0.muzzle.y - F.bore, by = F.bore + dy;
  g.position.y = dy;
  if (P.bipod) P.bipod.visible = true;
  if (att.barrel === 'short' && P.tubes) P.tubes.scale.z = 0.58;
  if (P.mag && att.mag === 'ext') { if (pid === 'subfusil') P.mag.scale.x = 1.3; else P.mag.scale.y = 1.4; }
  const drum = att.mag === 'drum' && P.mag;
  g.updateMatrixWorld(true);
  const inPart = (o, q) => { if (!q) return false; for (let p = o; p; p = p.parent) if (p === q) return true; return false; };
  const inMag = (o) => inPart(o, P.mag);
  const shown = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  g.traverse((o) => {
    if (!o.isMesh || !shown(o)) return;
    const mag = !!P.mag && inMag(o); if (mag && drum) return;
    const geo = o.geometry; if (!geo.attributes.normal) geo.computeVertexNormals();
    // primera persona: las piezas sueltas de la culata que quedarían pegadas al ojo al apuntar (varillas, cantonera de esqueleto) no se dibujan
    if (vm) { if (!geo.boundingBox) geo.computeBoundingBox(); _protoBox.copy(geo.boundingBox).applyMatrix4(o.matrixWorld); if (_protoBox.min.z > 0.27 || (_protoBox.max.z > 0.33 && _protoBox.min.z > 0.05 && o.material.k !== 'wood')) return; }
    B.items.push({ geo, m: o.matrixWorld.clone(), color: COL[o.material.k] ?? GUN.metal, tag: mag ? 'mag' : vm && inPart(o, P.bolt) ? 'bolt' : vm && inPart(o, P.barrels) ? 'barrels' : null, camo: false, body: false, ou: 0, ov: 0 });
  });
  // medidas del diseño: boca, culata y cargador
  let zb = -1e9, yb0 = 1e9, yb1 = -1e9; const bb = new THREE.Box3(), bbs = [];
  for (const it of B.items) { if (!it.geo.boundingBox) it.geo.computeBoundingBox(); const b = it.geo.boundingBox.clone().applyMatrix4(it.m); bbs.push(b); bb.union(b); }
  zb = bb.max.z; for (const b of bbs) if (b.max.z > zb - 0.012) { yb0 = Math.min(yb0, b.min.y); yb1 = Math.max(yb1, b.max.y); }
  let mz0 = PG.muzzle; if (att.barrel === 'short' && P.tubes) mz0 = -0.46;
  const magPos = P.mag ? P.mag.getWorldPosition(new THREE.Vector3()) : u0.mag.clone();
  if (drum) { B.tag = 'mag'; const mp = magPos; B.add(GEO.cyl(0.075, 0.075, 0.045, 18), mp.x + 0.07, mp.y, mp.z, GUN.metal, { rz: X }).add(GEO.cyl(0.03, 0.03, 0.05, 12), mp.x + 0.07, mp.y, mp.z, GUN.steel, { rz: X }).add(GEO.box(0.06, 0.024, 0.038), mp.x + 0.115, mp.y, mp.z, GUN.steel); B.tag = null; }
  // accesorios de la 3.1.4 sobre el diseño nuevo
  let sy = F.opticZ != null ? opticAtt(by + 0.02, F.opticZ) : null;
  if (sy == null) sy = PG.sightY + dy + (F.sy || 0);
  if (att.mag === 'fast' && PG.type === 'bolt') for (let i = 0; i < 5; i++) tb(0.0045, 0.03, 0, by + 0.024, -0.07 + i * 0.0095, 0xc9a23a, 6);
  const mz = muzzleAtt(by, barrelAtt(by, mz0, 0.0098));
  if (att.stock === 'pad') bx(0.044, (yb1 - yb0) * 0.98, 0.012, 0, (yb0 + yb1) / 2, zb + 0.005, 0x1d1a17);
  const lh = PG.lh, rh = PG.rh;
  let fore = new THREE.Vector3(0, lh[1] + dy, lh[2]);
  if (att.grip === 'vgrip') { const fz = lh[2] - 0.02, fy = by - 0.07; H.rb(0.03, 0.09, 0.044, 0, fy, fz, GUN.wood, 0.012, { rx: -0.15 }); for (let i = 0; i < 4; i++) bx(0.032, 0.006, 0.046, 0, fy + 0.03 - i * 0.02, fz + i * 0.003, shade(GUN.wood, -0.3)); fore = new THREE.Vector3(0, fy - 0.01, fz); }
  if (att.grip === 'bipod') gripAtt(F.band - 0.08, by - 0.03);
  if (att.grip === 'sling' && F.band != null) H.sling(by - 0.05, F.band, yb0 + 0.02, zb - 0.06);
  const isSec = CONFIG.WEAPONS[id].slot === 'secondary';
  // mano derecha: centro de la garganta de la culata (fusiles y escopeta) o de la empuñadura de pistola
  const pg = F.pg !== false && (isSec || ['smg', 'tsmg', 'mg2'].includes(id)), gy = rh[1] + (pg ? 0.01 : 0.021), gz = rh[2] + (pg ? 0 : 0.015);
  Object.assign(u, { sightY: sy, fore: isSec ? new THREE.Vector3(-0.03, gy + dy - 0.02, gz - 0.02) : fore, mag: magPos, muzzle: new THREE.Vector3(0, by, mz), adsDist: u0.adsDist,
    grip: { y: gy + dy, z: gz - 0.02, tilt: F.tilt, w: F.w }, adsZ: isSec ? -PG.adsZ : Math.min(-PG.adsZ, pg && id !== 'mg2' ? zb + 0.06 : Math.max(0.2, zb - 0.09)), proto: pid });   // 3.2.2: el ojo queda sobre el lomo de la culata, no detrás de la cantonera (así no se ve el arma cortada por detrás)
  // empuñadura de pistola: la mano se coloca midiendo la pieza (nudillos en la cara delantera, palma pegada al costado)
  if (pg) { const sg = sliceGrip(B, gy + dy, gz); if (sg) { u.grip.z = sg.z0 + 0.04 - 0.02; u.grip.w = sg.w * 2; u.gripSlice = sg; } }
  else { u.grip.roll = F.roll ?? 0; u.grip.y += F.gup ?? 0; u.grip.z += F.gz ?? 0; }
  // 3.2.2: datos para la recarga de primera persona: tipo de carga, ejes de las piezas móviles, pomo del cerrojo o palanca de montar
  const wp = (o) => o.getWorldPosition(new THREE.Vector3());
  u.rl = PG.rl; u.pivots = { bolt: P.bolt ? wp(P.bolt) : null, barrels: P.barrels ? wp(P.barrels) : null }; u.by = by;
  u.boltKind = PG.type === 'bolt' ? 'bolt' : isSec ? 'slide' : 'charge';
  if (PG.type === 'bolt') u.knob = new THREE.Vector3(0.055, -0.028, 0.085);   // respecto al eje del ánima
  else if (PG.charge) u.charge = new THREE.Vector3(PG.charge[0], PG.charge[1] + dy, PG.charge[2]);
  else if (!isSec && P.bolt && P.bolt.children.length && PG.rl !== 'shells') u.charge = wp(P.bolt);
  return sy;
}
