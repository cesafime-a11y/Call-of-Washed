// ---- 12i_campkit.js ----
// =====================================================================
// Juego de construcción para los escenarios de campaña (Parte I en adelante):
// cajas, cilindros, paredes con puertas que también chocan, muebles,
// texturas pintadas a mano en un lienzo y figuras de personas en el
// mismo estilo cuadrado del furgón. Todo cuelga de un grupo dentro de
// MapSys.decor, así que se va solo al cambiar de mapa.
// =====================================================================
function CampKit(root) {
  const mats = {}, tex = [], col = [];
  const M = (c, o = {}) => { const k = c + '|' + (o.e || '') + '|' + (o.ei ?? '') + '|' + (o.r ?? '') + '|' + (o.m ?? '') + '|' + (o.t ?? ''); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: o.m ?? 0, emissive: o.e || 0x000000, emissiveIntensity: o.ei ?? 1, transparent: o.t != null, opacity: o.t ?? 1, depthWrite: o.t == null || o.t > 0.6 })); };
  const box = (w, h, d, c, x, y, z, par = root, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.mat || M(c, o)); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; m.receiveShadow = true; par.add(m); return m; };
  const grp = (x, y, z, par = root, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; par.add(g); return g; };
  const cyl = (r0, r1, h, c, x, y, z, par = root, o = {}) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, o.seg || 14), o.mat || M(c, o)); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; par.add(m); return m; };
  const ball = (r, c, x, y, z, par = root, o = {}) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, o.seg || 10, 8), o.mat || M(c, o)); m.position.set(x, y, z); par.add(m); return m; };
  const solid = (x0, z0, x1, z1, y0 = -1, y1 = 4) => col.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0, y1 });
  const T = 0.14;
  const wallX = (x, z0, z1, gaps, y0, y1, c, door = 2.1, par = root) => {
    let a = z0; for (const [g0, g1] of [...gaps, [z1, z1]]) { if (g0 > a) { box(T, y1 - y0, g0 - a, c, x, (y0 + y1) / 2, (a + g0) / 2, par); solid(x - T / 2, a, x + T / 2, g0, y0, y1); } if (g1 > g0 && y1 - y0 > door) box(T, y1 - y0 - door, g1 - g0, c, x, (y0 + door + y1) / 2, (g0 + g1) / 2, par); a = g1; }
  };
  const wallZ = (z, x0, x1, gaps, y0, y1, c, door = 2.1, par = root) => {
    let a = x0; for (const [g0, g1] of [...gaps, [x1, x1]]) { if (g0 > a) { box(g0 - a, y1 - y0, T, c, (a + g0) / 2, (y0 + y1) / 2, z, par); solid(a, z - T / 2, g0, z + T / 2, y0, y1); } if (g1 > g0 && y1 - y0 > door) box(g1 - g0, y1 - y0 - door, T, c, (g0 + g1) / 2, (y0 + door + y1) / 2, z, par); a = g1; }
  };
  const furn = (w, h, d, c, x, y, z, o) => { const m = box(w, h, d, c, x, y + h / 2, z, root, o); solid(x - w / 2, z - d / 2, x + w / 2, z + d / 2, y, y + h); return m; };
  const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; tex.push(t); return t; };
  const plane = (w, h, t, x, y, z, ry = 0, par = root, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: o.r ?? 0.7, transparent: !!o.tr, emissive: o.e ? 0xffffff : 0, emissiveMap: o.e ? t : null, emissiveIntensity: o.e || 0, side: o.ds ? THREE.DoubleSide : THREE.FrontSide })); m.position.set(x, y, z); m.rotation.y = ry; if (o.rx) m.rotation.x = o.rx; par.add(m); return m; };
  // habitación: suelo, techo y cuatro paredes con huecos { n:[[x0,x1]], s:[], w:[[z0,z1]], e:[] } (n = z0, s = z1, w = x0, e = x1)
  const room = (x0, z0, x1, z1, h, o = {}) => {
    const y0 = o.y || 0, c = o.wall || 0xd2c6a8;
    if (o.floor !== false) box(x1 - x0 + 0.2, 0.1, z1 - z0 + 0.2, o.floor || 0x5e4630, (x0 + x1) / 2, y0 - 0.05, (z0 + z1) / 2);
    if (o.ceil !== false) box(x1 - x0 + 0.2, 0.1, z1 - z0 + 0.2, o.ceil || 0xe2d8c0, (x0 + x1) / 2, y0 + h + 0.05, (z0 + z1) / 2);
    const g = o.gaps || {};
    wallZ(z0, x0 - 0.07, x1 + 0.07, g.n || [], y0, y0 + h, c, o.door); wallZ(z1, x0 - 0.07, x1 + 0.07, g.s || [], y0, y0 + h, c, o.door);
    wallX(x0, z0, z1, g.w || [], y0, y0 + h, c, o.door); wallX(x1, z0, z1, g.e || [], y0, y0 + h, c, o.door);
    if (o.dado) { box(x1 - x0 - 0.1, o.dado, 0.02, o.dadoC || 0x8c7a5a, (x0 + x1) / 2, y0 + o.dado / 2, z0 + 0.08); box(x1 - x0 - 0.1, o.dado, 0.02, o.dadoC || 0x8c7a5a, (x0 + x1) / 2, y0 + o.dado / 2, z1 - 0.08); }
  };
  // ventana luminosa (de día) en una pared: ry orienta hacia dentro
  const win = (x, y, z, ry, w = 1.0, h = 1.2, o = {}) => { const g = grp(x, y, z, root, ry), fr = o.frame || 0x5a3a20; const gl = box(w, h, 0.02, 0xdfe8ea, 0, 0, 0, g, { e: o.glow || 0xcfdde4, ei: o.ei ?? 0.9, r: 0.3 });
    box(w + 0.12, 0.08, 0.16, fr, 0, -h / 2, 0.02, g); box(w + 0.12, 0.08, 0.16, fr, 0, h / 2, 0.02, g); box(0.06, h, 0.14, fr, -w / 2, 0, 0.02, g); box(0.06, h, 0.14, fr, w / 2, 0, 0.02, g); box(0.04, h, 0.1, fr, 0, 0, 0.02, g); box(w, 0.04, 0.1, fr, 0, 0.1, 0.02, g); g.userData.glass = gl; return g; };
  // persona cuadrada. o: { x,y,z,ry, sit, belly, apron, shirt, coat, leg, hair, mous, glasses, cap, hat, bareArms, skirt, beard, h (escala) }
  const skinC = 0xc49a7c;
  const person = (o) => {
    const g = grp(o.x || 0, o.y || 0, o.z || 0, o.par || root, o.ry || 0), sitting = !!o.sit, sk = o.skin || skinC;
    const legC = o.leg || 0x2e2a26, bootC = o.boot || 0x1c1612;
    for (const s of [-1, 1]) {
      if (sitting) { box(0.15, 0.15, 0.46, legC, s * 0.11, 0.5, 0.2, g); box(0.14, 0.46, 0.14, legC, s * 0.11, 0.24, 0.42, g); box(0.13, 0.08, 0.26, bootC, s * 0.11, 0.04, 0.48, g); }
      else { box(0.15, 0.86, 0.16, legC, s * 0.11, 0.43, 0, g); box(0.14, 0.08, 0.27, bootC, s * 0.11, 0.04, 0.05, g); }
    }
    if (o.skirt) box(0.42, sitting ? 0.12 : 0.62, sitting ? 0.56 : 0.34, o.skirt, 0, sitting ? 0.55 : 0.6, sitting ? 0.18 : 0, g);
    const torso = grp(0, sitting ? 0.55 : 0.88, 0, g);
    box(o.slim ? 0.38 : 0.44, 0.6, o.slim ? 0.26 : 0.3, o.shirt || 0xe8e4d8, 0, 0.3, 0, torso);
    if (o.belly) { const b = ball(0.21, o.shirt || 0xe8e4d8, 0, 0.2, 0.1, torso); b.scale.set(1, 0.95, 0.85); }
    if (o.apron) { box(0.36, 0.62, 0.02, o.apron, 0, 0.12, 0.28, torso); box(0.2, 0.2, 0.02, o.apron, 0, 0.48, 0.17, torso); }
    if (o.coat) box(o.slim ? 0.41 : 0.47, 0.7, o.slim ? 0.29 : 0.33, o.coat, 0, 0.27, 0, torso);
    if (o.tie) box(0.05, 0.3, 0.01, o.tie, 0, 0.42, o.slim ? 0.15 : 0.17, torso);
    const head = grp(0, 0.78, 0, torso);
    box(0.23, 0.26, 0.24, sk, 0, 0, 0, head);
    if (o.hair !== null) box(0.24, o.longHair ? 0.3 : 0.07, o.longHair ? 0.27 : 0.25, o.hair || 0x9a9890, 0, o.longHair ? 0.0 : 0.13, o.longHair ? -0.03 : -0.01, head);
    if (o.bun) ball(0.07, o.hair || 0x111111, 0, 0.12, -0.14, head);
    if (o.mous) box(0.13, 0.03, 0.02, o.mous, 0, -0.05, 0.125, head);
    if (o.beard) box(0.22, 0.14, 0.05, o.beard, 0, -0.12, 0.11, head);
    for (const s of [-1, 1]) box(0.035, 0.025, 0.01, 0x1a1210, s * 0.05, 0.03, 0.122, head);
    if (o.glasses) for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 12), M(0x222222, { m: 0.6 })); r.position.set(s * 0.05, 0.03, 0.13); head.add(r); }
    if (o.cap) { box(0.25, 0.06, 0.26, o.cap, 0, 0.15, 0, head); box(0.24, 0.02, 0.12, o.cap, 0, 0.12, 0.17, head); }
    if (o.hat) { box(0.34, 0.02, 0.34, o.hat, 0, 0.14, 0, head); box(0.24, 0.12, 0.24, o.hat, 0, 0.21, 0, head); }
    if (o.beret) { const b = ball(0.15, o.beret, 0, 0.15, 0, head); b.scale.set(1, 0.35, 1); }
    const arms = [];
    for (const s of [-1, 1]) { const a = grp(s * (o.slim ? 0.24 : 0.27), 0.56, 0, torso); const sl = o.bareArms ? sk : (o.coat || o.shirt || 0xe8e4d8); box(0.12, 0.3, 0.12, sl, 0, -0.15, 0, a); const f = grp(0, -0.3, 0, a); box(0.11, 0.28, 0.11, o.rolled ? sk : sl, 0, -0.14, 0, f); box(0.09, 0.08, 0.09, sk, 0, -0.31, 0, f); a.userData.f = f; arms.push(a); }
    if (o.h) g.scale.setScalar(o.h);
    return { g, torso, head, arms };
  };
  return { M, box, grp, cyl, ball, solid, wallX, wallZ, furn, canvasTex, plane, room, win, person, col, tex, mats };
}

// utilidades de guion compartidas por los capítulos
const CampUtil = {
  V: (x, y, z) => new THREE.Vector3(x, y, z),
  // sentarse (o quedarse quieto): la vista se limita alrededor de una dirección
  sit(S, x, y, z, yaw, pitch = -0.1, yawR = 1.6) { SceneWalk.stop(S); S.eye.set(x, y, z); S.yawC = yaw; S.yaw = Input.state.yaw = yaw; S.pitch = Input.state.pitch = pitch; S.yawR = yawR; S.pitchMin = -1.2; S.pitchMax = 0.7; S.roll = 0; },
  walk(S, x, y, z, yaw, o = {}) { SceneWalk.start(S, { x, y, z, yaw, boxes: S.set.col, floor: o.floor || S.set.floor || ((xx, zz, yy) => y), speed: o.speed || 2.0 }); },
  // yaw para mirar desde (x,z) hacia (tx,tz)
  yawTo(x, z, tx, tz) { return Math.atan2(-(tx - x), -(tz - z)); },
  // luces propias: apaga las globales del mapa y deja las del tramo
  globals(sun, hemi) { if (G.sun) { G.sun.intensity = sun; G.hemi.intensity = hemi; } },
  laugh(vol = 1) { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime; for (let i = 0; i < 7; i++) AUDIO.nz(SceneAudio.dest(), t + i * 0.17, 0.11, 0.03 * vol, 'bandpass', 700 + (i % 2) * 120, null, 2); },
  bellStrike(f = 196, vol = 0.07, at = 0) { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime + at; for (const [k, g, d] of [[0.5, 0.5, 4], [1, 1, 3.2], [1.18, 0.5, 2.2], [1.5, 0.4, 1.8], [2, 0.3, 1.4], [3, 0.12, 0.8]]) AUDIO.osc(SceneAudio.dest(), 'sine', f * k, f * k, t, d, vol * g, 0.004); },
};
