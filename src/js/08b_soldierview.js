// ---- 08b_soldierview.js ----
// =====================================================================
// VISTA DEL SOLDADO — esqueleto jerárquico igual al del ragdoll; brazos
// y piernas con IK de dos huesos (las manos van al arma, los pies al piso)
// =====================================================================
const _q0 = new THREE.Quaternion(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _qd = new THREE.Quaternion();
const _ea = new THREE.Euler(0, 0, 0, 'YXZ');
const _rv = new THREE.Vector3();
const _P0 = new THREE.Vector3(), _P1 = new THREE.Vector3(), _P2 = new THREE.Vector3(), _A = new THREE.Vector3(), _Bv = new THREE.Vector3(), _Cv = new THREE.Vector3(), _Dv = new THREE.Vector3();
const _ik = { d: new THREE.Vector3(), dir: new THREE.Vector3(), perp: new THREE.Vector3(), E: new THREE.Vector3(), T: new THREE.Vector3(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), w: new THREE.Vector3(), m: new THREE.Matrix4() };
// IK de dos huesos: S hombro/cadera, T objetivo; devuelve rotaciones (espacio raíz) del hueso superior e inferior.
// bend=+1: el hueso inferior dobla hacia -Z local (codo); bend=-1: hacia +Z (rodilla)
function solveIK2(S, T, a, b, pole, bend, qUp, qLo) {
  const K = _ik, d = K.d.copy(T).sub(S);
  let L = d.length();
  const maxL = a + b - 1e-3;
  if (L < 1e-4) { d.set(0, -1, 0); L = 1e-4; }
  if (L > maxL) { d.multiplyScalar(maxL / L); L = maxL; }
  const dir = K.dir.copy(d).multiplyScalar(1 / L);
  const x = (a * a - b * b + L * L) / (2 * L), h = Math.sqrt(Math.max(0, a * a - x * x));
  const perp = K.perp.copy(pole).addScaledVector(dir, -pole.dot(dir));
  if (perp.lengthSq() < 1e-8) perp.set(0, 0, -bend); perp.normalize();
  const E = K.E.copy(S).addScaledVector(dir, x).addScaledVector(perp, h);
  const Tt = K.T.copy(S).add(d);
  const yA = K.y.copy(S).sub(E).normalize();
  const w = K.w.copy(Tt).sub(E); w.addScaledVector(yA, -w.dot(yA));
  if (w.lengthSq() < 1e-8) w.copy(perp);
  w.normalize();
  const zA = K.z.copy(w).multiplyScalar(bend > 0 ? -1 : 1);
  const xA = K.x.copy(yA).cross(zA).normalize();
  zA.copy(xA).cross(yA).normalize();
  qUp.setFromRotationMatrix(K.m.makeBasis(xA, yA, zA));
  const y2 = yA.copy(E).sub(Tt).normalize();
  xA.addScaledVector(y2, -xA.dot(y2)).normalize();
  const z2 = zA.copy(xA).cross(y2);
  qLo.setFromRotationMatrix(K.m.makeBasis(xA, y2, z2));
}

let _viewId = 0, _woundMat = null, _woundGeo = null;
// 3.1.4: mancha de herida de muestra (para compilar su material al empezar la partida)
function woundSample() { if (!FX.tex || !FX.tex.splat) return null; if (!_woundMat) _woundMat = new THREE.MeshBasicMaterial({ map: FX.tex.splat, color: 0x7a1010, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, opacity: 0.9 }); if (!_woundGeo) _woundGeo = new THREE.PlaneGeometry(1, 1); return new THREE.Mesh(_woundGeo, _woundMat); }
const _fr = { t: -1, m: new THREE.Matrix4(), f: new THREE.Frustum(), s: new THREE.Sphere() };
class SoldierView {
  constructor(f, parent) {
    this.f = f; this.vid = ++_viewId;
    this.root = new THREE.Group();
    this.renderPos = new THREE.Vector3();
    this.joints = {}; this.meshes = {};
    this.phase = 0; this.eyeY = CONFIG.CAMERA.firstEye; this.lean = 0.04; this.sprintK = 0; this.reloadK = 0; this.recoilK = 0; this.swing = 0; this.landK = 0; this.landKV = 0; this.latK = 0; this._lt = f.landTime;
    this.footUp = [false, false]; this.getup = null; this.ragPose = {}; this.ragdollMode = false; this.dead = false;
    this.wq = new THREE.Quaternion(); this.wp = new THREE.Vector3();
    this.build();
    (parent || G.root).add(this.root);
  }
  build() {
    const f = this.f, c = f.custom;
    const civ = !!(c.outfit && OUTFITS[c.camo]);   // ropa civil del modo Cárcel (paciente, recluso, guardia; también infectados)
    const camo = CAMOS[c.camo] || civ ? c.camo : 'woodland', CM = CAMOS[camo] || OUTFITS[camo];
    let skin = SKINS[(c.skin | 0) % SKINS.length], hair = HAIR[f.slot % HAIR.length];
    const gear = CM.gear, gearD = shade(gear, -0.35), boot = 0x2a231b, glove = 0x24221d, dark = 0x1c1d1a;
    const team = f.team >= 0 ? new THREE.Color(CONFIG.TEAM_COLORS[f.team]).getHex() : null;
    this.color = team ?? 0xb0a080;
    const P = {}; for (const n of PART_NAMES) P[n] = new PartBatch();
    const cam = { camo: true }, bcam = { camo: true, body: true }, bd = { body: true };
    // piezas con aristas biseladas: lo que sea más grueso que un par de centímetros se redondea (chalecos, mochilas, cascos, cabeza); lo fino queda plano
    const box = (w, h, d) => { const m = Math.min(w, h, d); return m >= 0.03 ? GEO.rbox(w, h, d, Math.min(0.04, Math.max(0.006, m * 0.24))) : GEO.box(w, h, d); }, cyl = (rt, rb, h) => GEO.cyl(rt, rb, h, 6);
    let civLook = null;
    if (civ) civLook = outfitParts(P, c, f, { box, cyl, cam, bcam, bd });
    else {
    // pelvis
    P.pelvis.add(box(0.33, 0.2, 0.21), 0, 0.04, 0, 0, bcam).add(box(0.345, 0.05, 0.225), 0, 0.13, 0, gearD).add(box(0.05, 0.035, 0.012), 0, 0.13, -0.115, 0x8a8a7a)
      .add(box(0.07, 0.08, 0.05), -0.17, 0.09, 0.03, gear).add(box(0.07, 0.08, 0.05), 0.17, 0.09, 0.03, gear).add(box(0.14, 0.08, 0.18), 0, -0.06, 0, 0, bcam);
    // pecho
    P.chest.add(box(0.34, 0.21, 0.21), 0, 0.1, 0, 0, bcam).add(box(0.42, 0.24, 0.235), 0, 0.31, 0, 0, bcam)
      .add(cyl(0.055, 0.062, 0.12), 0, 0.45, 0, skin).add(box(0.2, 0.05, 0.2), 0, 0.43, 0, 0, bcam);
    switch (c.vest) {
      // abrigo de cuero largo (Dienststelle Grau): cuerpo, solapas, cinturón y faldones hasta la rodilla
      case 'coat':
        P.chest.add(box(0.4, 0.42, 0.25), 0, 0.22, 0, 0x3e4042).add(box(0.1, 0.24, 0.02), -0.06, 0.32, -0.127, 0x2e3032, { rz: -0.2 }).add(box(0.1, 0.24, 0.02), 0.06, 0.32, -0.127, 0x2e3032, { rz: 0.2 })
          .add(box(0.24, 0.07, 0.24), 0, 0.46, 0, 0x2e3032);
        for (let i = 0; i < 3; i++) P.chest.add(box(0.016, 0.016, 0.01), -0.05, 0.28 - i * 0.07, -0.128, 0x1a1a1a);
        P.pelvis.add(box(0.37, 0.06, 0.24), 0, 0.12, 0, 0x1c1c1c).add(box(0.05, 0.04, 0.02), 0, 0.12, -0.125, 0x9a9a8a).add(box(0.38, 0.22, 0.25), 0, 0.0, 0, 0x3e4042);
        for (const sd of ['L', 'R']) P['thigh' + sd].add(box(0.2, 0.3, 0.2), 0, -0.14, 0.0, 0x3e4042);
        break;
      case 'webbing':
        P.chest.add(box(0.05, 0.42, 0.25), -0.11, 0.25, 0, gearD, { rz: 0.12 }).add(box(0.05, 0.42, 0.25), 0.11, 0.25, 0, gearD, { rz: -0.12 });
        for (let i = 0; i < 4; i++) P.chest.add(box(0.07, 0.1, 0.05), -0.12 + i * 0.08, 0.14, -0.14, gear);
        P.chest.add(box(0.2, 0.12, 0.06), 0, 0.14, 0.14, gear);
        break;
      case 'radio':
        P.chest.add(box(0.39, 0.3, 0.25), 0, 0.25, 0, gear).add(box(0.25, 0.32, 0.13), 0, 0.24, 0.2, gearD).add(GEO.cyl(0.006, 0.006, 0.55, 4), 0.08, 0.62, 0.22, dark)
          .add(box(0.07, 0.1, 0.045), -0.07, 0.17, -0.15, gearD).add(box(0.07, 0.1, 0.045), 0.07, 0.17, -0.15, gearD);
        break;
      case 'light':
        P.chest.add(box(0.39, 0.3, 0.25), 0, 0.25, 0, gear).add(box(0.08, 0.1, 0.04), 0.09, 0.2, -0.14, gearD);
        break;
      case 'bandolier':
        P.chest.add(box(0.39, 0.3, 0.25), 0, 0.25, 0, gearD).add(box(0.05, 0.5, 0.26), -0.06, 0.26, 0, 0x3a3328, { rz: 0.62 }).add(box(0.05, 0.5, 0.26), 0.06, 0.26, 0, 0x3a3328, { rz: -0.62 });
        for (let i = 0; i < 6; i++) P.chest.add(box(0.02, 0.05, 0.02), -0.12 + i * 0.048, 0.38 - i * 0.07, -0.135, 0xc9a23a).add(box(0.02, 0.05, 0.02), 0.12 - i * 0.048, 0.38 - i * 0.07, -0.135, 0xc9a23a);
        break;
      case 'harness':
        P.chest.add(box(0.05, 0.4, 0.25), -0.1, 0.26, 0, 0x3a2c20).add(box(0.05, 0.4, 0.25), 0.1, 0.26, 0, 0x3a2c20).add(box(0.4, 0.04, 0.26), 0, 0.13, 0, 0x3a2c20)
          .add(box(0.4, 0.035, 0.26), 0, 0.36, 0, 0x2e231a).add(box(0.05, 0.05, 0.02), 0, 0.2, -0.13, 0xc9a23a).add(box(0.08, 0.1, 0.05), -0.12, 0.2, -0.15, gearD).add(box(0.08, 0.1, 0.05), 0.12, 0.2, -0.15, gearD);
        break;
      default: break;
    }
    // mochila / equipo a la espalda
    switch (c.pack) {
      case 'small': P.chest.add(box(0.26, 0.26, 0.12), 0, 0.27, 0.22, gearD).add(box(0.2, 0.05, 0.13), 0, 0.41, 0.22, gear); break;
      case 'assault': P.chest.add(box(0.32, 0.34, 0.16), 0, 0.27, 0.24, gearD).add(box(0.08, 0.16, 0.1), -0.2, 0.22, 0.24, gear).add(box(0.08, 0.16, 0.1), 0.2, 0.22, 0.24, gear).add(GEO.cyl(0.05, 0.05, 0.34, 12), 0, 0.1, 0.25, gear, { rz: Math.PI / 2 }); break;
      case 'large': P.chest.add(box(0.36, 0.52, 0.2), 0, 0.3, 0.26, gearD).add(box(0.3, 0.14, 0.12), 0, 0.2, 0.39, gear).add(box(0.1, 0.2, 0.1), -0.22, 0.32, 0.27, gear).add(box(0.1, 0.2, 0.1), 0.22, 0.32, 0.27, gear).add(GEO.cyl(0.05, 0.05, 0.38, 12), 0, 0.6, 0.27, gear, { rz: Math.PI / 2 }); break;
      case 'medic': P.chest.add(box(0.34, 0.4, 0.17), 0, 0.28, 0.25, 0xd8d6cc).add(box(0.2, 0.05, 0.02), 0, 0.3, 0.345, 0xc63a2e).add(box(0.05, 0.2, 0.02), 0, 0.3, 0.345, 0xc63a2e); break;
      case 'tube': P.chest.add(GEO.cyl(0.055, 0.055, 0.75, 12), -0.08, 0.28, 0.24, gear, { rx: 0.1, rz: 0.22 }).add(GEO.cyl(0.058, 0.058, 0.06, 12), -0.17, 0.62, 0.23, dark, { rz: 0.22, rx: 0.1 }).add(GEO.cyl(0.058, 0.058, 0.06, 12), 0.0, -0.08, 0.27, dark, { rz: 0.22, rx: 0.1 }).add(box(0.34, 0.07, 0.07), 0, 0.2, 0.2, gearD); break;
      case 'bedroll': P.chest.add(box(0.3, 0.3, 0.14), 0, 0.23, 0.23, gearD).add(GEO.cyl(0.07, 0.07, 0.38, 12), 0, 0.46, 0.25, 0x4a5a6a, { rz: Math.PI / 2 }).add(box(0.03, 0.12, 0.17), -0.1, 0.46, 0.25, 0x3a2c20).add(box(0.03, 0.12, 0.17), 0.1, 0.46, 0.25, 0x3a2c20)
        .add(GEO.cyl(0.035, 0.035, 0.06, 6), 0.19, 0.2, 0.25, 0xb8bcc0).add(GEO.cyl(0.05, 0.05, 0.3, 12), 0, 0.06, 0.25, 0x7a7a5a, { rz: Math.PI / 2 }); break;
      case 'antenna': P.chest.add(box(0.28, 0.3, 0.14), 0, 0.26, 0.22, gearD).add(box(0.2, 0.06, 0.02), 0, 0.3, 0.3, dark).add(box(0.04, 0.03, 0.02), 0.06, 0.3, 0.315, 0x3affc8).add(GEO.cyl(0.006, 0.006, 0.8, 4), 0.1, 0.75, 0.26, dark, { rz: 0.06 })
        .add(GEO.cyl(0.005, 0.005, 0.55, 4), -0.1, 0.6, 0.26, dark, { rz: -0.1 }).add(box(0.07, 0.14, 0.06), 0.18, 0.22, 0.22, gear); break;
      default: break;
    }
    // cabeza
    P.head.add(GEO.rbox(0.18, 0.21, 0.2, 0.05), 0, 0.15, -0.005, skin).add(box(0.15, 0.06, 0.16), 0, 0.055, -0.025, skin).add(box(0.035, 0.05, 0.04), 0, 0.135, -0.115, shade(skin, -0.12))
      .add(box(0.03, 0.05, 0.04), -0.095, 0.15, 0, shade(skin, -0.08)).add(box(0.03, 0.05, 0.04), 0.095, 0.15, 0, shade(skin, -0.08))
      .add(box(0.035, 0.018, 0.01), -0.045, 0.175, -0.106, 0x141414).add(box(0.035, 0.018, 0.01), 0.045, 0.175, -0.106, 0x141414)
      .add(box(0.05, 0.012, 0.012), -0.045, 0.196, -0.107, hair).add(box(0.05, 0.012, 0.012), 0.045, 0.196, -0.107, hair);
    switch (c.face) {
      case 'balaclava': P.head.add(box(0.192, 0.21, 0.212), 0, 0.14, -0.005, 0x23241f).add(box(0.12, 0.032, 0.01), 0, 0.177, -0.112, skin)
        .add(box(0.03, 0.016, 0.01), -0.045, 0.177, -0.118, 0x141414).add(box(0.03, 0.016, 0.01), 0.045, 0.177, -0.118, 0x141414); break;
      case 'goggles': P.head.add(box(0.195, 0.022, 0.212), 0, 0.24, -0.003, 0x3a2416).add(GEO.cyl(0.028, 0.028, 0.02, 10), -0.042, 0.245, -0.11, 0x6a6a5a, { rx: Math.PI / 2 }).add(GEO.cyl(0.028, 0.028, 0.02, 10), 0.042, 0.245, -0.11, 0x6a6a5a, { rx: Math.PI / 2 }); break;
      case 'mustache': P.head.add(box(0.075, 0.016, 0.014), 0, 0.112, -0.104, hair).add(box(0.02, 0.016, 0.012), -0.04, 0.104, -0.103, hair).add(box(0.02, 0.016, 0.012), 0.04, 0.104, -0.103, hair); break;
      case 'shades': P.head.add(GEO.torus(0.022, 0.003, 12, 4), -0.045, 0.176, -0.108, 0x9a8a5a).add(GEO.torus(0.022, 0.003, 12, 4), 0.045, 0.176, -0.108, 0x9a8a5a).add(box(0.024, 0.004, 0.004), 0, 0.178, -0.108, 0x9a8a5a).add(box(0.004, 0.004, 0.2), -0.096, 0.18, -0.01, 0x9a8a5a).add(box(0.004, 0.004, 0.2), 0.096, 0.18, -0.01, 0x9a8a5a); break;
      case 'paint': P.head.add(box(0.16, 0.014, 0.006), 0, 0.155, -0.106, 0x3a4628).add(box(0.15, 0.014, 0.006), 0, 0.118, -0.11, 0x22281a).add(box(0.12, 0.012, 0.006), 0, 0.2, -0.106, 0x22281a); break;
      case 'beard': P.head.add(box(0.16, 0.08, 0.17), 0, 0.06, -0.035, hair).add(box(0.08, 0.02, 0.01), 0, 0.105, -0.115, hair); break;
      case 'shemagh': P.head.add(box(0.2, 0.1, 0.215), 0, 0.075, -0.003, 0xc2ae80).add(box(0.22, 0.05, 0.22), 0, 0.01, -0.005, 0xb09c70).add(box(0.1, 0.16, 0.05), 0, -0.04, 0.12, 0xb09c70); break;
      case 'gas': P.head.add(box(0.2, 0.16, 0.214), 0, 0.12, -0.003, 0x2a2c26).add(box(0.05, 0.05, 0.08), 0, 0.08, -0.14, 0x3a3d34).add(GEO.cyl(0.035, 0.035, 0.07, 12), -0.06, 0.08, -0.14, dark, { rx: Math.PI / 2 })
        .add(box(0.05, 0.035, 0.014), -0.045, 0.175, -0.114, 0x6a9a8a).add(box(0.05, 0.035, 0.014), 0.045, 0.175, -0.114, 0x6a9a8a); break;
      case 'scar': P.head.add(box(0.012, 0.11, 0.008), -0.055, 0.155, -0.107, 0xb8665a, { rz: 0.35 }).add(box(0.03, 0.008, 0.008), -0.06, 0.185, -0.108, 0xa05048).add(box(0.03, 0.008, 0.008), -0.05, 0.15, -0.108, 0xa05048).add(box(0.03, 0.008, 0.008), -0.04, 0.12, -0.108, 0xa05048); break;
      case 'bandit': P.head.add(box(0.194, 0.105, 0.214), 0, 0.075, -0.004, 0x23211f).add(box(0.2, 0.02, 0.218), 0, 0.127, -0.004, 0x23211f).add(box(0.07, 0.07, 0.05), 0, 0.1, 0.12, 0x23211f, { rx: 0.4 }).add(box(0.03, 0.03, 0.01), 0.04, 0.09, -0.11, 0x6a1c18); break;
      case 'eyepatch': P.head.add(box(0.05, 0.045, 0.012), 0.045, 0.175, -0.109, 0x111111).add(box(0.2, 0.01, 0.213), 0, 0.2, -0.004, 0x111111, { rz: 0.12 }); break;
      default: break;
    }
    const ex = c.op && OPERATORS[c.op] ? OPERATORS[c.op].extra : (c.fx || null);
    const hcol = c.camo === 'arctic' ? 0xc9cfd1 : gear;
    switch (c.helmet) {
      // casco de cresta (Sanmarcial): cúpula, ala corta delante y detrás y la cresta longitudinal
      case 'adrian': case 'netted':
        P.head.add(GEO.dome(0.13, 14, 6), 0, 0.212, 0, c.helmet === 'netted' ? 0 : hcol, { sy: 0.82, sz: 1.06, camo: c.helmet === 'netted' })
          .add(GEO.cyl(0.15, 0.158, 0.014, 14), 0, 0.212, 0.0, hcol, { sz: 1.18 }).add(box(0.026, 0.03, 0.2), 0, 0.316, 0, shade(hcol, -0.15))
          .add(box(0.012, 0.1, 0.012), -0.09, 0.15, 0, dark).add(box(0.012, 0.1, 0.012), 0.09, 0.15, 0, dark);
        if (c.helmet === 'netted') for (let i = 0; i < 6; i++) P.head.add(box(0.04, 0.012, 0.05), Math.cos(i) * 0.09, 0.3 - (i % 2) * 0.03, Math.sin(i * 1.7) * 0.08, shade(CM.gear, -0.2), { ry: i });
        break;
      // casco de acero vardenés: cúpula alta con faldón que cae sobre orejas y nuca
      case 'stahl':
        P.head.add(GEO.dome(0.135, 14, 7), 0, 0.2, 0, hcol, { sy: 0.92, sz: 1.08 }).add(GEO.cyl(0.14, 0.16, 0.07, 14), 0, 0.17, 0.012, hcol, { sz: 1.1 })
          .add(GEO.cyl(0.16, 0.168, 0.02, 14), 0, 0.13, 0.02, shade(hcol, -0.1), { sz: 1.1 }).add(box(0.02, 0.02, 0.02), -0.12, 0.24, -0.02, shade(hcol, -0.2)).add(box(0.02, 0.02, 0.02), 0.12, 0.24, -0.02, shade(hcol, -0.2))
          .add(box(0.012, 0.09, 0.012), -0.1, 0.1, -0.03, dark).add(box(0.012, 0.09, 0.012), 0.1, 0.1, -0.03, dark);
        break;
      // casco de plato atlántico: cúpula baja y ala ancha
      case 'brodie':
        P.head.add(GEO.dome(0.12, 14, 5), 0, 0.235, 0, hcol, { sy: 0.62, sz: 1.08 }).add(GEO.cyl(0.2, 0.2, 0.012, 16), 0, 0.235, 0, hcol, { sz: 1.08 })
          .add(box(0.012, 0.1, 0.012), -0.085, 0.16, 0, 0x3a2c20).add(box(0.012, 0.1, 0.012), 0.085, 0.16, 0, 0x3a2c20).add(box(0.13, 0.012, 0.012), 0, 0.045, -0.095, 0x3a2c20);
        break;
      // gorra de plato (oficiales, guardias, la Dienststelle): copa ancha, cinta y visera de charol
      case 'peaked':
        P.head.add(GEO.cyl(0.13, 0.108, 0.07, 14), 0, 0.29, 0.01, hcol, { sz: 1.08 }).add(GEO.cyl(0.11, 0.11, 0.035, 14), 0, 0.247, 0, 0x1a1a1a)
          .add(box(0.16, 0.01, 0.07), 0, 0.235, -0.12, 0x101010, { rx: 0.2 }).add(box(0.03, 0.03, 0.012), 0, 0.29, -0.13, 0xc9a23a);
        break;
      // casco de minero: cuero endurecido con lámpara de carburo delante
      case 'miner':
        P.head.add(GEO.dome(0.13, 14, 6), 0, 0.212, 0, 0x4a3a26, { sy: 0.85, sz: 1.08 }).add(GEO.cyl(0.15, 0.15, 0.012, 14), 0, 0.212, 0, 0x3a2c1c, { sz: 1.1 })
          .add(GEO.cyl(0.02, 0.026, 0.05, 10), 0, 0.27, -0.13, 0x8a7a4a, { rx: Math.PI / 2 }).add(GEO.cyl(0.03, 0.03, 0.008, 10), 0, 0.27, -0.158, 0xe8dcb0, { rx: Math.PI / 2 });
        break;
      case 'cap': P.head.add(GEO.cyl(0.103, 0.11, 0.075, 12), 0, 0.272, 0, 0, cam).add(box(0.16, 0.012, 0.08), 0, 0.245, -0.12, 0, cam); break;
      case 'boonie': P.head.add(GEO.cyl(0.098, 0.11, 0.08, 12), 0, 0.282, 0, 0, cam).add(GEO.cyl(0.19, 0.19, 0.012, 10), 0, 0.25, 0, 0, cam); break;
      case 'beanie': P.head.add(GEO.sphere(0.115, 14, 8), 0, 0.235, 0, 0, { sy: 0.8, sz: 1.08, camo: true }).add(GEO.cyl(0.108, 0.112, 0.04, 12), 0, 0.225, 0, gearD).add(GEO.sphere(0.03, 6, 4), 0, 0.33, 0.01, shade(gear, 0.2)); break;
      case 'bandana': P.head.add(box(0.2, 0.034, 0.218), 0, 0.235, -0.004, team != null ? team : 0xa83a2a).add(box(0.07, 0.07, 0.04), 0.0, 0.215, 0.12, team != null ? team : 0xa83a2a, { rx: 0.4 })
        .add(box(0.18, 0.05, 0.2), 0, 0.27, -0.005, hair).add(box(0.188, 0.07, 0.03), 0, 0.24, 0.095, hair); break;
      case 'beret': P.head.add(GEO.sphere(0.12, 14, 8), 0.02, 0.265, 0.005, team != null ? shade(team, -0.45) : 0x5a2a2a, { sy: 0.32, sz: 1.05, rz: -0.25 }).add(box(0.192, 0.02, 0.21), 0, 0.235, -0.005, 0x2a2420); break;
      case 'ushanka': P.head.add(GEO.sphere(0.125, 14, 8), 0, 0.255, 0, 0x6a5a48, { sy: 0.7, sz: 1.12 }).add(GEO.cyl(0.128, 0.13, 0.06, 14), 0, 0.225, 0, 0x7a6a56, { sz: 1.1 })
        .add(GEO.rbox(0.05, 0.15, 0.15, 0.022), -0.118, 0.16, 0.01, 0x6a5a48, { rz: 0.1 }).add(GEO.rbox(0.05, 0.15, 0.15, 0.022), 0.118, 0.16, 0.01, 0x6a5a48, { rz: -0.1 })
        .add(box(0.24, 0.05, 0.03), 0, 0.26, -0.125, 0x5a4a38).add(box(0.045, 0.045, 0.012), 0, 0.295, -0.135, 0xb02a22); break;
      case 'pilot': P.head.add(GEO.dome(0.135, 14, 6), 0, 0.2, 0, 0x5a3a22, { sy: 0.88, sz: 1.08 }).add(box(0.05, 0.12, 0.1), -0.105, 0.13, 0.01, 0x4a2e1a).add(box(0.05, 0.12, 0.1), 0.105, 0.13, 0.01, 0x4a2e1a)
        .add(box(0.2, 0.02, 0.02), 0, 0.27, -0.11, 0x3a2416).add(GEO.cyl(0.03, 0.03, 0.02, 10), -0.045, 0.275, -0.12, 0x8a7a50, { rx: Math.PI / 2 }).add(GEO.cyl(0.03, 0.03, 0.02, 10), 0.045, 0.275, -0.12, 0x8a7a50, { rx: Math.PI / 2 }); break;
      default: P.head.add(box(0.188, 0.036, 0.208), 0, 0.262, -0.005, hair).add(box(0.188, 0.07, 0.03), 0, 0.23, 0.095, hair); break;
    }
    // brazos
    for (const s of ['L', 'R']) {
      P['upperArm' + s].add(GEO.sphere(0.07, 6, 4), 0, -0.01, 0, 0, bcam).add(cyl(0.062, 0.054, 0.28), 0, -0.15, 0, 0, bcam);
      if (team != null) P['upperArm' + s].add(GEO.cyl(0.066, 0.066, 0.045, 6), 0, -0.07, 0, team);
      P['foreArm' + s].add(cyl(0.054, 0.046, 0.2), 0, -0.09, 0, 0, bcam).add(cyl(0.042, 0.04, 0.05), 0, -0.2, 0, skin, bd).add(box(0.075, 0.095, 0.085), 0, -0.265, -0.01, glove, bd);
      P['thigh' + s].add(cyl(0.09, 0.072, 0.45), 0, -0.215, 0, 0, bcam).add(box(0.05, 0.14, 0.11), s === 'L' ? -0.098 : 0.098, -0.24, 0.0, gear).add(box(0.054, 0.025, 0.115), s === 'L' ? -0.098 : 0.098, -0.17, 0.0, gearD);
      if (s === 'R') P.thighR.add(box(0.05, 0.15, 0.09), 0.1, -0.15, 0.01, gearD);
      P['shin' + s].add(box(0.1, 0.1, 0.05), 0, -0.02, -0.065, gearD).add(cyl(0.068, 0.058, 0.33), 0, -0.18, 0, 0, bcam).add(box(0.1, 0.12, 0.12), 0, -0.38, 0, boot)
        .add(box(0.105, 0.07, 0.24), 0, -0.445, -0.05, boot).add(box(0.112, 0.02, 0.25), 0, -0.475, -0.05, 0x14110e);
      const sg = s === 'L' ? -1 : 1, padC = c.pads === 'armor' ? shade(gear, 0.03) : gearD;
      if (c.pads === 'shin') P['shin' + s].add(box(0.105, 0.24, 0.03), 0, -0.18, -0.08, gearD).add(box(0.115, 0.07, 0.05), 0, -0.03, -0.085, shade(gear, 0.08)).add(box(0.095, 0.03, 0.035), 0, -0.3, -0.083, dark);
      if (c.pads === 'knee' || c.pads === 'full' || c.pads === 'armor') P['shin' + s].add(box(0.125, 0.12, 0.06), 0, -0.01, -0.085, padC).add(box(0.1, 0.03, 0.065), 0, 0.06, -0.085, dark);
      if (c.pads === 'full' || c.pads === 'armor') {
        P['foreArm' + s].add(box(0.085, 0.07, 0.085), 0, -0.01, 0.02, padC); P['upperArm' + s].add(box(0.1, 0.1, 0.1), 0, -0.3, 0.01, padC);
      }
      if (c.pads === 'armor') {
        P['thigh' + s].add(box(0.13, 0.26, 0.04), 0, -0.2, -0.085, padC).add(box(0.03, 0.26, 0.12), sg * 0.095, -0.2, 0, padC);
        P['shin' + s].add(box(0.115, 0.26, 0.03), 0, -0.2, -0.065, padC); P['foreArm' + s].add(box(0.09, 0.16, 0.03), 0, -0.1, -0.055, padC);
        P['upperArm' + s].add(GEO.dome(0.105, 14, 6), sg * 0.012, 0.02, 0, padC, { sy: 0.78, rz: sg * 0.12 });
      }
    }
    // pulido gráfico: detalles de uniforme que dan lectura de cerca (armería, repetición de muerte) sin costar casi nada
    {
      const glv2 = shade(glove, -0.12), bt2 = shade(boot, 0.05), skinD = shade(skin, -0.2);
      // cinturón: cargadores y riñonera
      for (let i = 0; i < 3; i++) P.pelvis.add(box(0.045, 0.07, 0.04), -0.1 + i * 0.05, 0.1, -0.125, gearD);
      P.pelvis.add(box(0.12, 0.07, 0.05), 0, 0.1, 0.13, gear);
      // hombreras y cuello del uniforme
      P.chest.add(GEO.cyl(0.07, 0.074, 0.05, 12), 0, 0.455, 0, 0, cam);
      if (!c.vest || c.vest === 'light') {
        P.chest.add(box(0.1, 0.09, 0.03), -0.1, 0.3, -0.122, 0, cam).add(box(0.1, 0.02, 0.034), -0.1, 0.345, -0.122, gearD)
          .add(box(0.1, 0.09, 0.03), 0.1, 0.3, -0.122, 0, cam).add(box(0.1, 0.02, 0.034), 0.1, 0.345, -0.122, gearD)
          .add(box(0.05, 0.016, 0.01), 0.07, 0.38, -0.121, 0xd8d4c4);
      }
      // cara: ojos con blanco, boca y mentón
      P.head.add(box(0.052, 0.024, 0.008), -0.045, 0.175, -0.103, 0xe6e2d6).add(box(0.052, 0.024, 0.008), 0.045, 0.175, -0.103, 0xe6e2d6)
        .add(box(0.05, 0.01, 0.01), 0, 0.093, -0.1, skinD).add(box(0.1, 0.03, 0.09), 0, 0.045, -0.065, shade(skin, -0.05));
      const strapped = c.helmet === 'adrian' || c.helmet === 'netted' || c.helmet === 'stahl';
      if (strapped) P.head.add(box(0.13, 0.012, 0.012), 0, 0.045, -0.095, dark).add(box(0.012, 0.09, 0.012), -0.07, 0.09, -0.07, dark).add(box(0.012, 0.09, 0.012), 0.07, 0.09, -0.07, dark);
      for (const s of ['L', 'R']) {
        const sg = s === 'L' ? -1 : 1;
        // manga: puño remangado y parche de hombro
        P['upperArm' + s].add(cyl(0.06, 0.058, 0.03), 0, -0.275, 0, 0, bcam).add(box(0.012, 0.075, 0.062), sg * 0.088, -0.08, 0, team != null ? team : shade(gear, -0.12));
        // antebrazo: puño y guante con nudillos y dedos
        P['foreArm' + s].add(cyl(0.06, 0.058, 0.03), 0, -0.19, 0, gearD).add(box(0.07, 0.02, 0.07), 0, -0.225, -0.045, glv2, bd);
        for (let i = 0; i < 4; i++) P['foreArm' + s].add(box(0.016, 0.05, 0.02), -0.027 + i * 0.018, -0.325, -0.04, glove, bd);
        // muslo y pierna: costura de la rodilla, vuelta del pantalón y botas con cordones y puntera
        P['thigh' + s].add(box(0.14, 0.02, 0.14), 0, -0.4, 0, gearD, bd);
        P['shin' + s].add(cyl(0.068, 0.072, 0.045), 0, -0.325, 0, gearD).add(box(0.055, 0.075, 0.012), 0, -0.4, -0.067, bt2)
          .add(box(0.1, 0.05, 0.05), 0, -0.45, -0.16, bt2).add(box(0.11, 0.03, 0.04), 0, -0.375, 0.065, shade(boot, -0.2));
      }
      // pistolera y bolsillo trasero en el muslo derecho
      P.thighR.add(box(0.05, 0.2, 0.11), 0.115, -0.12, -0.03, dark).add(box(0.054, 0.025, 0.115), 0.115, -0.03, -0.03, gearD);
    }
    // extras de operador (siluetas propias)
    if (ex === 'scarf') P.chest.add(box(0.24, 0.07, 0.24), 0, 0.46, 0, 0x9a3a2a).add(box(0.09, 0.3, 0.025), 0.06, 0.28, -0.14, 0x9a3a2a, { rz: 0.1 }).add(box(0.12, 0.34, 0.025), -0.02, 0.2, 0.15, 0x9a3a2a);
    else if (ex === 'hood') P.head.add(GEO.sphere(0.14, 14, 8), 0, 0.17, 0.02, 0x23262b, { sy: 1.12, sz: 1.08 }).add(box(0.2, 0.3, 0.06), 0, 0.02, 0.1, 0x23262b);
    else if (ex === 'fur') { P.chest.add(box(0.3, 0.09, 0.28), 0, 0.47, 0, 0x6a5a48).add(box(0.32, 0.03, 0.3), 0, 0.51, 0, 0x7a6a56); for (const s of ['L', 'R']) P['upperArm' + s].add(box(0.13, 0.05, 0.15), s === 'L' ? -0.03 : 0.03, 0.07, 0, 0x6a5a48); }
    else if (ex === 'aviator') { P.chest.add(box(0.24, 0.07, 0.24), 0, 0.46, 0, 0xe6e2d6).add(box(0.1, 0.36, 0.025), -0.05, 0.25, -0.14, 0xe6e2d6, { rz: -0.08 }).add(box(0.1, 0.3, 0.025), 0.07, 0.22, 0.15, 0xe6e2d6, { rz: 0.06 });
      P.chest.add(box(0.44, 0.26, 0.27), 0, 0.3, 0, 0x4a2e1a).add(box(0.2, 0.06, 0.26), 0, 0.47, 0, 0x6a5a48); }
    else if (ex === 'poncho') {
      // poncho de lana de Tierra Alta con franjas y flecos
      P.chest.add(box(0.5, 0.36, 0.3), 0, 0.26, 0, 0x7a5a3a, { rx: 0.0 }).add(box(0.52, 0.04, 0.31), 0, 0.2, 0, 0xa83a2a).add(box(0.52, 0.03, 0.31), 0, 0.14, 0, 0xd8c08a).add(box(0.26, 0.06, 0.26), 0, 0.45, 0, 0x6a4a2e);
      for (let i = 0; i < 8; i++) P.chest.add(box(0.012, 0.05, 0.012), -0.21 + i * 0.06, 0.06, -0.15, 0xd8c08a);
    }
    else if (ex === 'cape') P.chest.add(box(0.42, 0.62, 0.025), 0, 0.0, 0.2, 0x1a1830, { rx: 0.12 }).add(box(0.46, 0.06, 0.2), 0, 0.5, 0.1, 0x1a1830);
    else if (ex === 'cross') { for (const s of ['L']) P['upperArm' + s].add(GEO.cyl(0.066, 0.066, 0.06, 8), 0, -0.1, 0, 0xe8e4da).add(box(0.012, 0.04, 0.04), -0.066, -0.1, 0, 0xc63a2e).add(box(0.012, 0.012, 0.04), -0.066, -0.1, 0, 0xc63a2e); P.head.add(box(0.07, 0.022, 0.012), -0.1, 0.24, -0.03, 0xc63a2e, { ry: Math.PI / 2 }).add(box(0.022, 0.07, 0.012), -0.1, 0.24, -0.03, 0xc63a2e, { ry: Math.PI / 2 }); }
    else if (ex === 'ghillie') {
      const gr = new RNG(hash32('ghillie', f.slot));
      for (let i = 0; i < 16; i++) { const part = i < 8 ? 'chest' : i < 12 ? 'head' : (i & 1 ? 'upperArmL' : 'upperArmR'); const q = gr.range(0.04, 0.09);
        P[part].add(box(q, q * 0.5, q * 2.2), gr.range(-0.17, 0.17) * (part === 'head' ? 0.7 : 1), part === 'chest' ? gr.range(0.2, 0.5) : part === 'head' ? gr.range(0.22, 0.3) : gr.range(-0.2, 0.05), gr.range(-0.14, 0.2), i % 3 ? 0x4b5a2c : 0x6a6a38, { rx: gr.range(-0.5, 0.5), rz: gr.range(-0.5, 0.5) }); }
    }
    }
    // jerarquía de articulaciones (igual al ragdoll); con maniquí son huesos y el cuerpo es una malla con piel
    const mat = MAT.soldier(camo), smooth = G.settings.charStyle === 'smooth' && Mannequin.decode() != null, mq = true, gearL = [];   // estilo cuadrado (por defecto) o suave (maniquí); en ambos todo va en una sola malla con piel
    for (const n of PART_NAMES) {
      const j = mq ? new THREE.Bone() : new THREE.Object3D(); j.name = n;
      P[n].skipBody = smooth;
      this.joints[n] = j;
      // con maniquí todo el equipo (menos la cabeza, que se puede ocultar) va en la malla única del cuerpo
      if (mq && n !== 'head') { const g = P[n].build(); if (g.attributes.position.count) gearL.push({ j: PART_NAMES.indexOf(n), geo: g }); continue; }
      const m = new THREE.Mesh(P[n].build(), mat); m.castShadow = true; m.receiveShadow = false;
      j.add(m); this.meshes[n] = m;
    }
    for (const n of PART_NAMES) {
      const s = SKEL[n], j = this.joints[n];
      if (s.parent) { this.joints[s.parent].add(j); j.position.copy(s.off); } else { this.root.add(j); j.position.copy(s.P); }
    }
    this.body = smooth ? Mannequin.skinned(this.joints, camo, civLook ? civLook.skin : skin, civLook ? civLook.glove : glove, civLook ? civLook.boot : boot, 0xc8c3b4, gearL) : Mannequin.skinnedBox(this.joints, gearL, mat); this.bodyShared = !smooth;
    if (this.body) this.root.add(this.body);
    // arma en mano (hija de la raíz mientras se anima; de la mano en ragdoll)
    this.weaponHolder = new THREE.Group(); this.root.add(this.weaponHolder);
    this.models = {}; this.curModel = null; this.curWeapon = null;
    this.handGrenade = buildHandGrenade(); this.handGrenade.visible = false; this.root.add(this.handGrenade);
    // etiqueta de nombre (se tiñe según si es aliado o enemigo)
    this.nameTag = makeNameSprite(f.name); this.nameTag.position.set(0, 2.18, 0); this.nameTag.visible = false; this.root.add(this.nameTag);
    this.setWeapon(f.weapon);
  }
  // un modelo por arma y combinación de accesorios (al cambiar de clase la misma arma puede llevar otros)
  model(id) {
    const att = this.f.attFor(id), key = id + ':' + attKey(att);
    let m = this.models[key];
    if (!m) { m = buildWeaponModel(id, false, att); m.visible = false; this.weaponHolder.add(m); this.models[key] = m; }
    return m;
  }
  // el arma cambió de accesorios (se recogió otra del suelo): rehacer el modelo
  dropModel(id) {
    for (const k of Object.keys(this.models)) if (k.split(':')[0] === id) { const m = this.models[k]; if (m.parent) m.parent.remove(m); delete this.models[k]; }
    if (this.curWeapon === id) { this.curModel = null; this.curWeapon = null; this.setWeapon(id); }
  }
  setWeapon(id) {
    if (!id) return;
    const m = this.model(id);
    if (m === this.curModel && this.curWeapon === id) { m.visible = true; return; }
    for (const k in this.models) this.models[k].visible = false;
    this.curModel = m; this.curModel.visible = true; this.curWeapon = id;
  }
  muzzleWorld(out) {
    if (VM.active && this.f === G.local) return VM.mapLocal(VM.muzzleLocal(), out);
    const m = this.curModel;
    if (!m || !m.visible || !m.parent) return this.f.eyePos(out);
    m.updateWorldMatrix(true, false);
    return out.copy(m.userData.muzzle).applyMatrix4(m.matrixWorld);
  }
  reset() {
    this.root.visible = true; this.ragdollMode = false; this.dead = false; this.getup = null;
    this.renderPos.copy(this.f.pos); this.root.position.copy(this.f.pos);
    this.root.quaternion.identity(); this.root.rotation.set(0, this.f.yaw, 0);
    if (this.weaponHolder.parent !== this.root) this.root.add(this.weaponHolder);
    this.weaponHolder.position.set(0, 0, 0); this.weaponHolder.quaternion.identity();
    this.weaponHolder.visible = true; this.joints.head.visible = true; if (this.body) this.body.visible = true;
    for (const n of PART_NAMES) { const sk = SKEL[n]; if (sk.parent) this.joints[n].position.copy(sk.off); }
    for (const k in this.models) { const m = this.models[k]; m.position.set(0, 0, 0); m.quaternion.identity(); }
    this.eyeY = eyeHeight(this.f);
  }
  onRagdoll(on) {
    this.ragdollMode = on; this.nameTag.visible = false; this.handGrenade.visible = false; if (this.f.zombie) this.weaponHolder.visible = false;
    if (on) {
      // el arma queda en la mano derecha
      this.joints.foreArmR.add(this.weaponHolder);
      this.weaponHolder.position.set(0, -0.27, -0.01); this.weaponHolder.rotation.set(-Math.PI / 2, 0, 0);
      for (const k in this.models) { this.models[k].position.set(0, 0, 0); this.models[k].quaternion.identity(); }
    } else {
      this.root.add(this.weaponHolder); this.weaponHolder.position.set(0, 0, 0); this.weaponHolder.quaternion.identity();
    }
  }
  onDeath() { if (this.laserBeam) { this.laserBeam.visible = false; this.laserDot.visible = false; } this.dead = true; this.ragdollMode = true; this.nameTag.visible = false; this.handGrenade.visible = false; this.weaponHolder.visible = false; this.joints.head.visible = true; if (this.body) this.body.visible = true; }

  // pose de cada articulación en espacio del mundo (para crear el ragdoll)
  captureWorldPose() {
    this.root.updateMatrixWorld(true);
    const out = {};
    for (const n of PART_NAMES) {
      const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
      this.joints[n].matrixWorld.decompose(pos, quat, _v8);
      out[n] = { pos, quat };
    }
    return out;
  }
  // pose desde los cuerpos rígidos
  poseFromRagdoll(rd) {
    rd.writePose(this.ragPose);
    this.root.position.set(0, 0, 0); this.root.quaternion.identity();
    for (const n of PART_NAMES) {
      const s = SKEL[n], j = this.joints[n], pw = this.ragPose[n];
      if (!s.parent) { j.position.copy(pw.pos); j.quaternion.copy(pw.quat); continue; }
      const pp = this.ragPose[s.parent], inv = _qa.copy(pp.quat).invert();
      j.quaternion.copy(inv).multiply(pw.quat);
      j.position.copy(pw.pos).sub(pp.pos).applyQuaternion(inv);
    }
  }
  beginGetup(rd, x, y, z, yaw) {
    rd.writePose(this.ragPose);
    const invR = _qb.setFromAxisAngle(UP, yaw).invert();
    const start = {};
    for (const n of PART_NAMES) {
      const s = SKEL[n], pw = this.ragPose[n];
      if (!s.parent) start[n] = { pos: pw.pos.clone().sub(_v1.set(x, y, z)).applyQuaternion(invR), quat: invR.clone().multiply(pw.quat) };
      else { const pp = this.ragPose[s.parent], inv = _qa.copy(pp.quat).invert(); start[n] = { pos: pw.pos.clone().sub(pp.pos).applyQuaternion(inv), quat: inv.clone().multiply(pw.quat) }; }
    }
    this.getup = { start, t: 0 };
  }

  update(dt, alpha) {
    const f = this.f;
    if (this.dead) return;
    if (this.ragdollMode && f.ragdoll) { if (this.body) this.body.visible = true; this.poseFromRagdoll(f.ragdoll); return; }
    const rp = this.renderPos.lerpVectors(f.prevPos, f.pos, alpha);
    // la malla única del cuerpo no se descarta sola (su esfera englobante no sigue la pose): fuera de cámara no se dibuja
    if (this.body && G.camera && !this.getup && !this.noCull) {
      const cam = G.camera;
      if (_fr.t !== G.realTime) { _fr.m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); _fr.f.setFromProjectionMatrix(_fr.m); _fr.t = G.realTime; }
      _fr.s.center.set(rp.x, rp.y + 1, rp.z); _fr.s.radius = 2.6;
      this.body.visible = _fr.f.intersectsSphere(_fr.s) || _fr.s.center.distanceToSquared(cam.position) < 64;
    }
    this.root.position.copy(rp); this.root.rotation.set(0, f.yaw, 0);
    if (f.zombie) this.animateZombie(dt); else this.animate(dt);
    if (this.getup) {
      this.getup.t += dt;
      const k = smooth01(this.getup.t / CONFIG.RAGDOLL.getupTime);
      for (const n of PART_NAMES) {
        const j = this.joints[n], s0 = this.getup.start[n], sk = SKEL[n];
        // 3.1.3: las articulaciones hijas vuelven a su sitio de reposo (antes se quedaban con la separación del ragdoll: cabeza desfasada y brazos sueltos)
        j.position.lerpVectors(s0.pos, sk.parent ? sk.off : j.position, k);
        _qc.copy(s0.quat).slerp(j.quaternion, k); j.quaternion.copy(_qc);
      }
      this.weaponHolder.visible = k > 0.7 && !f.zombie;
      if (k >= 1) { this.getup = null; this.weaponHolder.visible = !f.zombie; }
    }
  }

  animate(dt) {
    const f = this.f, J = this.joints;
    const hs = Math.hypot(f.vel.x, f.vel.z), cyw = Math.cos(f.yaw), syw = Math.sin(f.yaw);
    const lvx = f.vel.x * cyw - f.vel.z * syw, lvz = f.vel.x * syw + f.vel.z * cyw;
    const p = clamp(f.input.pitch, -1.2, 1.2);
    const crouch = f.crouching && !f.sliding, slide = f.sliding, sprint = f.sprinting && !slide, mantle = !!f.mantle;
    const air = !f.grounded && !mantle && f.state === 'stand';
    // al caer las rodillas se doblan y el cuerpo rebota; al moverse de lado el torso se inclina hacia allí
    if (f.landTime !== this._lt) { this._lt = f.landTime; if (G.time - f.landTime < 0.15) this.landKV += clamp(f.landVel || 6, 3, 20) * 0.35; }
    spring(this, 'landK', 0, 230, 17, dt);
    this.latK = damp(this.latK, f.grounded ? clamp(lvx / 6, -1, 1) : 0, 8, dt);
    this.eyeY = damp(this.eyeY, eyeHeight(f) - clamp(this.landK, -0.1, 0.35) * 0.8, 16, dt);
    let leanT = sprint ? 0.3 : crouch ? 0.3 : 0.04;
    if (slide) leanT = -0.8; if (mantle) leanT = 0.5;
    this.lean = damp(this.lean, leanT, 9, dt);
    this.sprintK = damp(this.sprintK, sprint || mantle ? 1 : 0, 9, dt);
    this.reloadK = damp(this.reloadK, f.reloadT > 0 ? 1 : 0, 12, dt);
    const ra = reloadAnim(f, this._ra || (this._ra = {}));
    this.reloadTilt = damp(this.reloadTilt || 0, ra.tilt || 0, 14, dt);
    // carrera: el tronco gira al ritmo de los pasos (la cadera hacia un lado, los hombros al contrario) y la cabeza sigue mirando al frente
    const tw = Math.sin(this.phase) * 0.11 * this.sprintK * Math.min(1, hs / 3.5);
    this.recoilK = damp(this.recoilK, 0, 16, dt);
    const lean = this.lean;
    // estremecimiento por impacto y tambaleo
    let fx = 0, fz = 0;
    if (f.flinchT > 0) { const k = f.flinchT / 0.22 * 0.14, d = f.flinchDir; const hx = d.x * cyw - d.z * syw, hz = d.x * syw + d.z * cyw; fx = hz * k; fz = -hx * k; }
    if (f.staggerT > 0) fz += Math.sin(G.time * 19) * 0.07 * (f.staggerT / CONFIG.FIGHTER.staggerTime);
    if (f.limpT > 0 && hs > 0.35) fz += Math.sin(this.phase) * 0.1 * Math.min(1, f.limpT);
    if (f.dazeT > 0) fz += Math.sin(G.time * 5.5 + f.slot) * 0.06 * Math.min(1, f.dazeT);
    // asomarse (de lado) y tumbarse
    const sl = f.lean || 0, pk = f.proneT > 0 ? smooth01(f.proneT) : 0;
    // tronco (FK)
    const q0 = _q0.setFromEuler(_ea.set(-lean * 0.25, tw, -sl * 0.06 - this.latK * 0.06));
    const qC = _qa.setFromEuler(_ea.set(-lean * 0.75 + p * 0.3 + fx + Math.sin(G.time * 1.7 + f.slot * 1.3) * 0.012, -tw * 1.7, fz - sl * 0.3));
    const qH = _qb.setFromEuler(_ea.set(clamp(p * 0.7 + lean, -1, 1), tw * 0.7, -fz * 0.5 - sl * 0.14));
    const p0 = _P0.set(sl * 0.05, 0.94, crouch ? 0.06 : slide ? 0.15 : 0);
    if (pk > 0.001) {
      // tumbado boca abajo: el cuerpo se tiende hacia adelante y la cabeza mira al frente
      q0.slerp(_q3.setFromEuler(_ea.set(-1.42, 0, 0)), pk);
      qC.slerp(_q3.setFromEuler(_ea.set(0.1 + clamp(p, -0.4, 0.6) * 0.25, 0, 0)), pk);
      qH.slerp(_q3.setFromEuler(_ea.set(clamp(1.2 + p * 0.75, 0.55, 1.85), 0, 0)), pk);
      p0.lerp(_Dv.set(0, 0.19, 0.44), pk);
    }
    const q1 = _qc.copy(q0).multiply(qC), p1 = _P1.copy(SKEL.chest.off).applyQuaternion(q0).add(p0);
    const q2 = _qd.copy(q1).multiply(qH), p2 = _P2.copy(SKEL.head.off).applyQuaternion(q1).add(p1);
    const eye = _A.set(0, 0.13, -0.06).applyQuaternion(q2).add(p2);
    let dy = (this.eyeY - eye.y) * (1 - pk);
    const newHip = clamp(p0.y + dy, pk > 0.5 ? 0.12 : 0.22, 1.02); dy = newHip - p0.y;
    p0.y += dy; p1.y += dy; p2.y += dy;
    // paso
    const moving = f.grounded && hs > 0.35 && !slide && !mantle;
    const stepLen = pk > 0.5 ? 0.4 : sprint ? 1.15 : crouch ? 0.55 : 0.78;
    if (moving) this.phase += dt * Math.PI * hs / stepLen;
    else this.phase = damp(this.phase, Math.round(this.phase / Math.PI) * Math.PI, 6, dt);
    const amt = moving ? clamp(hs / 2.2, 0, 1) : 0;
    if (moving) p0.y -= 0.03 * Math.abs(Math.sin(this.phase)) * amt;
    if (moving && f.limpT > 0) p0.y -= 0.07 * Math.max(0, Math.sin(this.phase)) * amt;
    J.pelvis.position.copy(p0); J.pelvis.quaternion.copy(q0);
    J.chest.quaternion.copy(qC); J.head.quaternion.copy(qH);

    // ---- arma y manos ----
    const W = f.wstat();
    const stab = f.meleeT > 0, nade = !!f.grenadeCook || f.throwT > 0;
    const want = stab ? 'knife' : f.weapon;
    if (want !== this.curWeapon) this.setWeapon(want);
    const M = this.curModel, U = M.userData;
    animMag(M, f);
    const sp = Math.sin(p), cp = Math.cos(p);
    const c = _Bv.set(0, this.eyeY, 0);
    const ads = smooth01(f.adsT);
    // cadera
    const gp = this.wp, rc = this.recoilK;
    const hipP = _Cv.set(0.2, -0.25, 0.42), adsP = _Dv.set(0.1, -U.sightY, U.adsDist + 0.14);
    // (x derecha, y arriba de la mira, z adelante de la mira) → espacio raíz
    let ox = lerp(hipP.x, adsP.x, ads), oy = lerp(hipP.y, adsP.y, ads), oz = lerp(hipP.z, adsP.z, ads) - 0.045 * rc;
    if (pk > 0.001) { ox = lerp(ox, lerp(0.07, 0, ads), pk); oy = lerp(oy, lerp(-0.07, -U.sightY, ads), pk); oz = lerp(oz, lerp(0.38, U.adsDist + 0.05, ads), pk); }
    let wpitch = p + 0.06 * rc, wyaw = lerp(0.04, 0, ads), wroll = 0;
    if (f.weapon === 'knife' && !stab) { ox = 0.2; oy = -0.3; oz = 0.3; wpitch = p - 0.3; }
    if (stab) {
      const k = 1 - f.meleeT / 0.42, s = k < 0.35 ? smooth01(k / 0.35) : 1 - smooth01((k - 0.35) / 0.65);
      ox = 0.15 - 0.05 * s; oy = -0.2 + 0.04 * s; oz = 0.25 + 0.42 * s; wpitch = p - 0.15 + 0.2 * s; wyaw = -0.15;
    }
    const sk = this.sprintK * (1 - ads);
    if (sk > 0.001 && !stab) {
      // arma en posición baja, cruzada al pecho, y se balancea con la zancada
      const mvK = f.grounded ? Math.min(1, hs / 4) : 0, sn = Math.sin(this.phase), bn = Math.abs(sn);
      ox = lerp(ox, 0.1 + sn * 0.025 * mvK, sk); oy = lerp(oy, -0.4 - bn * 0.03 * mvK, sk); oz = lerp(oz, 0.22 + sn * 0.02 * mvK, sk);
      wpitch = lerp(wpitch, -0.55 + bn * 0.07 * mvK, sk); wyaw = lerp(wyaw, 0.62 - sn * 0.05 * mvK, sk); wroll = lerp(wroll, 0.22 + sn * 0.1 * mvK, sk);
    }
    const rk = this.reloadK, rt = this.reloadTilt;
    if (rt > 0.001) { oy -= 0.07 * rt; oz += 0.03 * rt; wpitch -= 0.3 * rt; wroll -= 0.5 * rt; ox -= 0.03 * rt; }
    if (ra.slap > 0.001) { oy -= 0.012 * ra.slap; wpitch += 0.07 * ra.slap; }
    const swk = drawEase(clamp(f.switchT / (f.switchTotal || 0.45), 0, 1));
    if (swk !== 0) { oy -= 0.25 * swk; wpitch -= 1.1 * swk; }
    // posición final (ejes de la mira: derecha, arriba según el cabeceo, adelante según el cabeceo)
    gp.set(ox, this.eyeY + oy * cp + oz * sp, -oz * cp + oy * sp - pk * CONFIG.CAMERA.proneFwd);
    if (sl) gp.x += (f.leanOff || 0) * 0.85;
    if (sk > 0.001 && !stab) { gp.y = lerp(gp.y, this.eyeY + oy, sk); gp.z = lerp(gp.z, -oz, sk); }
    this.wq.setFromEuler(_ea.set(wpitch, wyaw, wroll));
    // granada: la mano derecha va atrás (cocinando) y luego lanza
    const hideGun = nade || mantle || !f.alive;
    this.weaponHolder.visible = !hideGun && !this.getup;
    this.handGrenade.visible = !!f.grenadeCook;
    let rT, lT;
    if (nade) {
      const k = f.grenadeCook ? 0 : 1 - f.throwT / 0.38;
      rT = _A.set(0.24 - 0.06 * k, this.eyeY + 0.03 + 0.05 * k, 0.12 - 0.7 * smooth01(k));
      lT = _Cv.set(-0.16, this.eyeY - 0.15, -0.42);
      this.handGrenade.position.copy(rT); this.handGrenade.position.y -= 0.06;
    } else if (mantle) {
      rT = _A.set(0.2, this.eyeY - 0.05, -0.45); lT = _Cv.set(-0.2, this.eyeY - 0.05, -0.45);
    } else {
      M.position.copy(gp); M.quaternion.copy(this.wq);
      rT = _A.copy(gp);
      if (U.fore && !stab && f.weapon !== 'knife') {
        lT = _Cv.copy(U.fore);
        if (f.reloadT > 0 && U.mag) { lT.lerp(U.mag, ra.mw).y -= ra.mo; if (ra.slap > 0.001) lT.y += 0.03 * ra.slap; }
        lT.applyQuaternion(this.wq).add(gp);
        if (ra.pw > 0.001) lT.lerp(_rv.set(-0.16, this.eyeY - 0.5, -0.1), ra.pw);
      } else lT = _Cv.set(-0.17, this.eyeY - 0.5 + lean * 0.2, -0.15);
    }
    const shR = _P2.set(0.265, 0.38, 0).applyQuaternion(q1).add(p1);
    solveIK2(shR, rT, ARM_UP, ARM_LO, _Dv.set(0.6, -1, 0.25), 1, _qa, _qb);
    J.upperArmR.quaternion.copy(_q1.copy(q1).invert().multiply(_qa));
    J.foreArmR.quaternion.copy(_q2.copy(_qa).invert().multiply(_qb));
    const shL = _P2.set(-0.265, 0.38, 0).applyQuaternion(q1).add(p1);
    solveIK2(shL, lT, ARM_UP, ARM_LO, _Dv.set(-0.55, -1, 0.15), 1, _qa, _qb);
    J.upperArmL.quaternion.copy(_q1.copy(q1).invert().multiply(_qa));
    J.foreArmL.quaternion.copy(_q2.copy(_qa).invert().multiply(_qb));

    // ---- piernas ----
    const mvL = hs > 0.05 ? 1 / hs : 0, mx = lvx * mvL, mz = lvz * mvL;
    const A = (stepLen / Math.PI) * amt, lift = (sprint ? 0.2 : crouch ? 0.07 : 0.12) * amt;
    for (let si = 0; si < 2; si++) {
      const s = si === 0 ? -1 : 1, nm = si === 0 ? 'L' : 'R';
      const hip = _P2.set(s * 0.105, -0.01, 0).applyQuaternion(q0).add(p0);
      const ph = this.phase + (si ? Math.PI : 0), cph = Math.cos(ph);
      const ft = _A;
      if (pk > 0.5) ft.set(s * 0.16, 0.05, p0.z + 0.92 + (moving ? Math.sin(ph) * 0.14 : 0));
      else if (slide) ft.set(s * 0.12, 0.09 + (si ? 0.16 : 0), si ? -0.35 : -0.66);
      else if (mantle) ft.set(s * 0.12, p0.y - (si ? 0.62 : 0.42), si ? -0.08 : -0.25);
      else if (air) ft.set(s * 0.11, p0.y - (si ? 0.66 : 0.8), si ? 0.12 : -0.14);
      else if (crouch && !moving) ft.set(s * 0.14, 0.015, si ? 0.16 : -0.14);
      else {
        const off = A * Math.sin(ph);
        ft.set(s * 0.11 + mx * off, 0.015 + lift * Math.max(0, cph), 0.02 + mz * off);
        // pisada: sonido
        const up = cph > 0 && moving;
        if (this.footUp[si] && !up && moving && f.grounded) BUS.emit('step', f, hs);
        this.footUp[si] = up;
      }
      solveIK2(hip, ft, LEG_UP, LEG_LO, _Dv.set(s * 0.25, -1.3 * pk, -1 + pk), -1, _qa, _qb);
      J['thigh' + nm].quaternion.copy(_q1.copy(q0).invert().multiply(_qa));
      J['shin' + nm].quaternion.copy(_q2.copy(_qa).invert().multiply(_qb));
    }
  }
  // mancha de sangre pegada al hueso más cercano al impacto (se queda en el cadáver). dir: dirección de la bala
  addWound(point, dir, size) {
    if (!FX.tex || !FX.tex.splat) return;
    const maxN = CONFIG.WOUND.maxMarks, w = this.wounds || (this.wounds = []);
    let best = null, bd = 1e9;
    for (const n of PART_NAMES) {
      if (n === 'head') continue;
      const j = this.joints[n]; j.updateWorldMatrix(true, false); _P0.setFromMatrixPosition(j.matrixWorld);
      const d = _P0.distanceToSquared(point); if (d < bd) { bd = d; best = j; }
    }
    if (!best || bd > 0.5) return;
    if (!_woundMat) _woundMat = new THREE.MeshBasicMaterial({ map: FX.tex.splat, color: 0x7a1010, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, opacity: 0.9 });
    if (!_woundGeo) _woundGeo = new THREE.PlaneGeometry(1, 1);
    let m;
    if (w.length >= maxN) { m = w.shift(); } else { m = new THREE.Mesh(_woundGeo, _woundMat); m.renderOrder = 2; best.add(m); }
    if (m.parent !== best) { if (m.parent) m.parent.remove(m); best.add(m); }
    w.push(m);
    best.worldToLocal(_P1.copy(point));
    _qa.copy(best.getWorldQuaternion(_qb)).invert();
    const n = dir ? _P2.copy(dir).negate() : _P2.set(0, 0, 1);
    n.applyQuaternion(_qa).normalize();
    m.position.copy(_P1).addScaledVector(n, 0.012);
    m.quaternion.setFromUnitVectors(_Dv.set(0, 0, 1), n); _qc.setFromAxisAngle(_Dv.set(0, 0, 1), Math.random() * TAU); m.quaternion.multiply(_qc);
    m.scale.setScalar(clamp(size, 0.07, 0.2));
    m.visible = true;
  }
  dispose() {
    if (this.root.parent) this.root.parent.remove(this.root);
    if (this.laserBeam) { G.root.remove(this.laserBeam, this.laserDot); this.laserBeam = null; }
    for (const n in this.meshes) this.meshes[n].geometry.dispose();
    if (this.body) { this.body.geometry.dispose(); if (!this.bodyShared) this.body.material.dispose(); }
    if (this.nameTag) { this.nameTag.material.map.dispose(); this.nameTag.material.dispose(); }
  }
}

// cartel de distancia del campo de tiro
function rangeSign(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#e8e4d0'; x.fillRect(0, 0, 256, 128); x.strokeStyle = '#1c1b18'; x.lineWidth = 8; x.strokeRect(4, 4, 248, 120);
  x.fillStyle = '#1c1b18'; x.font = '700 78px "Barlow Condensed", "Arial Narrow", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, fog: false }));
  sp.scale.set(2.4, 1.2, 1);
  return sp;
}
function makeNameSprite(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 48;
  const x = c.getContext('2d');
  x.font = '600 26px "Barlow Condensed", "Arial Narrow", system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 5; x.strokeStyle = 'rgba(0,0,0,.75)'; x.strokeText(text.slice(0, 16).toUpperCase(), 128, 25);
  x.fillStyle = '#ffffff'; x.fillText(text.slice(0, 16).toUpperCase(), 128, 25);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: true, transparent: true, fog: false }));
  s.scale.set(1.5, 0.28, 1);
  return s;
}

