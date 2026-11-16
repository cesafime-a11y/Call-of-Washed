// ---- 12m_cap5.js ----
// =====================================================================
// PARTE I · ESCENA 5 · «El hombre de la cera» (P1-E5)
// San Elías y Corcovado · 17 de febrero – 1 de marzo de 1940
// Tramos: el Packard (Larraín, el Ford color crema) · el Ministerio de
// Culto (claustro de naranjos, el despacho del armonio, «dígame qué ve»,
// el Coro, la primera mentira) · El Imparcial y la naranja · la cocina de
// Corcovado (el pañuelo, las preguntas, el bigote) · el reloj de viaje y
// los catorce anillos · la buhardilla de Clara · 1 de marzo, 7:10.
// Lugares en x: Packard 0, ministerio 40, barracón 80, cocina 110,
// dormitorio 130, buhardilla 160, puerta de La Recoleta 200.
// =====================================================================
MAPS.c5_san_elias = {
  name: { es: 'San Elías y Corcovado · febrero de 1940', en: 'San Elías and Corcovado · February 1940' },
  desc: { es: 'El Ministerio de Culto, la cocina de la calle de los Herreros y la buhardilla de la calle Platerías.', en: 'The Ministry of Worship, the kitchen on Calle de los Herreros and the attic on Calle Platerías.' },
  campaign: true,
  thumb: ['#3a3430', '#8a6a4a', '#d8c8a8'],
  theme: { skyTop: 0x5a6e88, skyMid: 0xa8b4bc, skyBot: 0xcac4b0, fog: 0x9aa0a4, fogNear: 60, fogFar: 300, sun: 0xffe2b8, sunI: 0.3, sunDir: [0.4, 0.8, 0.3], hemiTop: 0xcfd6dc, hemiBot: 0x5a5040, hemiI: 0.3, exposure: 1.05, cloud: 0.4, rays: 0, glow: 0, lamps: false, soldFill: 0.5, soldRim: 0.3 },
  build(B) { B.bounds(-30, -200, 240, 60); B.ground(-30, -200, 240, 60, { y: -0.6, pattern: PAT.COBBLE, color: 0x4a4440 }); B.spawn('ffa', 0, 0, 0, 0); },
};

const Cap5Set = {
  build(S) {
    const root = new THREE.Group(); MapSys.decor.add(root);
    const K = CampKit(root), { box, grp, cyl, ball, solid, furn, canvasTex, plane, room, win, person, M } = K, V = CampUtil.V;
    const lights = {};
    const addL = (k, l) => { root.add(l); if (l.target) root.add(l.target); (lights[k] = lights[k] || []).push([l, l.intensity]); l.intensity = 0; return l; };
    const F = { lights, tex: K.tex, col: K.col };
    const walnut = 0x4e3220, wax = 0xe8e0c8;
    // Larraín: pelo blanco peinado hacia atrás, traje gris oscuro de buen paño, anillo de sello en el meñique izquierdo
    const larrain = (o) => { const p = person({ coat: 0x34363a, leg: 0x34363a, shirt: 0xeeeeea, tie: 0x2a2a30, hair: 0xe8e6e0, slim: true, h: 1.04, ...o }); const r = ball(0.014, 0xd4a840, 0.03, -0.33, 0.03, p.arms[1].userData.f, { m: 0.9, r: 0.25 }); p.ring = r; return p; };

    // ========== EL PACKARD (x 0): asiento de atrás, cortinillas corridas ==========
    const car = grp(0, 0, 0);
    box(1.9, 0.08, 2.6, 0x1a1612, 0, 0.3, 0, car); box(1.7, 0.45, 0.55, 0x3a2a24, 0, 0.55, 0.55, car); box(1.7, 0.75, 0.12, 0x3a2a24, 0, 0.95, 0.85, car);
    box(1.9, 0.08, 2.6, 0x2a2420, 0, 1.6, 0, car); for (const s of [-1, 1]) box(0.06, 1.3, 2.6, 0x1e1a18, s * 0.95, 0.95, 0, car);
    box(1.7, 0.5, 0.06, 0x1a1612, 0, 0.9, -0.6, car); box(1.6, 0.8, 0.04, 0x0e0e10, 0, 1.25, -1.25, car);
    for (const s of [-1, 1]) { const c = box(0.02, 0.4, 0.62, 0x2a2018, s * 0.92, 1.18, 0.35, car); c.userData.s = s; }
    box(0.6, 0.3, 0.02, 0x9aa4a8, 0, 1.25, 0.92, car, { e: 0x8a949a, ei: 0.6 });
    const slit = box(0.01, 0.38, 0.03, 0xdde4e8, 0.93, 1.18, 0.05, car, { e: 0xdde4e8, ei: 1.2 }); void slit;
    const drv = person({ x: 0.4, z: -0.95, ry: Math.PI, sit: true, coat: 0x1a1a1a, cap: 0x1a1a1a, leg: 0x1a1a1a, hair: 0x2a2018 }); car.add(drv.g); drv.g.position.set(0.4, 0.05, -0.95);
    const L1 = larrain({ x: -0.45, z: 0.55, ry: Math.PI, sit: true }); car.add(L1.g); L1.g.position.set(-0.45, 0.1, 0.55); L1.arms[0].rotation.x = -0.9; L1.arms[1].rotation.x = -0.8; L1.arms[1].rotation.z = 0.4;
    box(0.36, 0.03, 0.36, 0x4a4a48, -0.45, 0.82, 0.12, car);
    F.L1 = L1; F.car = car;
    // la calle que pasa (por la rendija y por la luna de atrás)
    const street = []; for (let i = 0; i < 14; i++) { const s = i % 2 ? 1 : -1, b = box(0.3, 3 + (i % 3), 6, [0x8a7a68, 0xa89880, 0x6a5a4a][i % 3], s * 5, 1.5, -40 + i * 7, root, { e: i % 4 === 0 ? 0xffe8b0 : 0, ei: 0.3 }); street.push(b); }
    F.street = street;
    const ford = grp(0.4, 0, 9); box(1.7, 0.7, 4, 0xe0d4b0, 0, 0.75, 0, ford, { m: 0.3, r: 0.4 }); box(1.5, 0.6, 2.0, 0xe0d4b0, 0, 1.35, 0.2, ford, { m: 0.3, r: 0.4 }); F.ford = ford;
    const papaS = person({ x: 1.6, z: 8.2, ry: Math.PI * 0.9, coat: 0x5a5c60, leg: 0x5a5c60, hair: 0x8a8680, mous: 0x4a4440, slim: true }); F.papaS = papaS;
    const gabS = person({ x: 2.3, z: 8.5, ry: -Math.PI / 2, coat: 0x8a8a84, leg: 0x2a2a2a, hat: 0x4a4a48 }); F.gabS = gabS;
    addL('car', new THREE.HemisphereLight(0xd8d4cc, 0x2a2420, 0.6)).position.set(0, 3, 0);
    { const l = addL('car', new THREE.PointLight(0xfff0d8, 0.5, 4)); l.position.set(0.6, 1.4, 0.2); }
    { const l = addL('car', new THREE.DirectionalLight(0xfff4e8, 1.0)); l.position.set(3, 8, 12); l.target.position.set(0, 0, 6); }

    // ========== EL MINISTERIO DE CULTO (x 40) ==========
    const MX = 40;
    // el claustro de naranjos
    box(18, 0.1, 18, 0xb8ac94, MX, -0.05, 0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { if ((i === 0 || i === 3) || (j === 0 || j === 3)) { const x = MX - 5.5 + i * 11 / 3, z = -5.5 + j * 11 / 3; cyl(0.22, 0.25, 3.4, 0xd8ccb0, x, 1.7, z); solid(x - 0.25, z - 0.25, x + 0.25, z + 0.25); } }
    for (const [x0, z0, x1, z1] of [[MX - 9, -9, MX + 9, -8], [MX - 9, 8, MX + 9, 9], [MX - 9, -9, MX - 8, 9], [MX + 8, -9, MX + 9, 9]]) { box(x1 - x0, 7, z1 - z0, 0xc8bca0, (x0 + x1) / 2, 3.5, (z0 + z1) / 2); solid(x0, z0, x1, z1); }
    box(16, 0.3, 2.6, 0xc8bca0, MX, 3.6, -6.4); box(16, 0.3, 2.6, 0xc8bca0, MX, 3.6, 6.4); box(2.6, 0.3, 11, 0xc8bca0, MX - 6.4, 3.6, 0); box(2.6, 0.3, 11, 0xc8bca0, MX + 6.4, 3.6, 0);
    for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) { cyl(0.1, 0.14, 1.4, 0x5a4030, MX + x, 0.7, z); const c = ball(0.9, 0x2e4a24, MX + x, 1.9, z); c.scale.y = 0.85; for (let k = 0; k < 7; k++) { const a = k * 0.9; ball(0.07, 0xe08020, MX + x + Math.cos(a) * 0.75, 1.7 + (k % 3) * 0.25, z + Math.sin(a) * 0.75); } solid(MX + x - 0.3, z - 0.3, MX + x + 0.3, z + 0.3); }
    cyl(0.8, 0.9, 0.6, 0xa89880, MX, 0.3, 0); solid(MX - 0.9, -0.9, MX + 0.9, 0.9);
    const funcs = []; for (let i = 0; i < 3; i++) { const p = person({ x: MX - 3 + i * 1.6, z: 6.95, ry: 0, sit: true, coat: 0x2a2a2a, leg: 0x2a2a2a, hair: 0x5a5048 }); p.arms[0].rotation.x = -1.2; p.arms[1].rotation.x = -1.2; funcs.push(p); furn(1.2, 0.75, 0.6, walnut, MX - 3 + i * 1.6, 0, 7.55); }
    const L2 = larrain({ x: MX + 6.4, z: -6.4, ry: Math.PI / 2 }); F.L2 = L2;
    F.MX = MX;
    addL('cloister', new THREE.HemisphereLight(0xeef0f4, 0x7a6a50, 0.9)).position.set(MX, 10, 0);
    { const l = addL('cloister', new THREE.DirectionalLight(0xfff4e0, 1.3)); l.position.set(MX + 8, 20, 10); l.target.position.set(MX, 0, 0); }
    // el pasillo del primer piso (largo y silencioso) y el despacho sin placa
    const CX = 70;
    room(CX, -1.2, CX + 26, 1.2, 3.6, { wall: 0xd8ccb0, floor: 0x6a4a34, ceil: 0xd8ccb0, gaps: { e: [[-0.6, 0.6]] }, door: 2.4 });
    for (let i = 0; i < 6; i++) win(CX + 2 + i * 4, 1.9, -1.13, 0, 0.9, 1.3);
    const OX = CX + 26;
    room(OX, -2.2, OX + 4.4, 2.2, 3.4, { wall: 0xe0d8c4, floor: 0x5a4030, ceil: 0xe0d8c4, gaps: { w: [[-0.6, 0.6]] }, door: 2.3 });
    win(OX + 2.2, 1.8, -2.13, 0, 1.0, 1.4);
    furn(1.4, 0.76, 0.8, walnut, OX + 2.2, 0, 0.3);
    furn(0.48, 0.9, 0.48, 0x3a2416, OX + 2.2, 0, 1.3); box(0.5, 0.06, 0.5, 0x3a2416, OX + 2.2, 0.48, 1.3);
    furn(0.48, 0.9, 0.48, 0x3a2416, OX + 2.2, 0, -0.7); box(0.5, 0.06, 0.5, 0x3a2416, OX + 2.2, 0.48, -0.7);
    // crucifijo, estantería con libros de música en piel, el armonio
    box(0.04, 0.5, 0.02, 0x3a2416, OX + 4.33, 2.2, 0.3); box(0.28, 0.04, 0.02, 0x3a2416, OX + 4.33, 2.32, 0.3, root, { ry: Math.PI / 2 });
    furn(0.35, 2.0, 1.6, 0x3a2416, OX + 4.2, 0, -1.2); for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) box(0.22, 0.32, 0.12, [0x5a1a14, 0x2a3a1a, 0x3a2a14, 0x1a1a2a][(i + r) % 4], OX + 4.0, 0.25 + r * 0.48, -1.9 + i * 0.16);
    const harm = grp(OX + 0.6, 0, 1.6, root, Math.PI / 2); box(1.1, 0.9, 0.5, 0x2e1c10, 0, 0.45, 0, harm); box(1.1, 0.5, 0.25, 0x2e1c10, 0, 1.15, -0.13, harm); const keys = box(0.9, 0.03, 0.16, 0xe4d8a8, 0, 0.92, 0.18, harm); box(0.9, 0.04, 0.2, 0x2e1c10, 0, 0.96, 0.26, harm); const hlid = grp(0, 0.95, 0.06, harm); box(1.0, 0.03, 0.26, 0x2e1c10, 0, 0, 0.12, hlid); F.hlid = hlid; F.keys = keys; F.harm = harm;
    solid(OX + 0.3, 1.0, OX + 0.9, 2.2);
    const L3 = larrain({ x: OX + 2.2, z: -1.95, ry: 0 }); L3.g.rotation.y = Math.PI; L3.arms[0].rotation.x = 0.3; L3.arms[1].rotation.x = 0.3; L3.torso.rotation.x = -0.04; F.L3 = L3;
    F.OX = OX; F.CX = CX;
    addL('office', new THREE.HemisphereLight(0xf0ece0, 0x4a3a2a, 0.75)).position.set(OX + 2, 3, 0);
    { const l = addL('office', new THREE.DirectionalLight(0xfff4e0, 0.9)); l.position.set(OX + 2, 5, -9); l.target.position.set(OX + 2, 0, 0.5); }
    { const l = addL('office', new THREE.PointLight(0xffe8c0, 0.5, 6)); l.position.set(OX + 1, 2.6, 0); }
    addL('corr', new THREE.HemisphereLight(0xf0ece0, 0x4a3a2a, 0.8)).position.set(CX + 13, 3, 0);
    { const l = addL('corr', new THREE.DirectionalLight(0xfff4e0, 0.8)); l.position.set(CX + 13, 6, -9); l.target.position.set(CX + 13, 0, 0); }

    // ========== EL BARRACÓN, una tarde (x 140) ==========
    const BX = 140;
    room(BX, 0, BX + 6, 4, 3.2, { wall: 0xcfc6ae, floor: 0x5a4834, ceil: 0xd8d0bc });
    for (let i = 0; i < 3; i++) { box(0.8, 0.06, 1.9, 0x3a3a38, BX + 1 + i * 2, 0.42, 1.0); box(0.78, 0.08, 1.85, 0x5a5440, BX + 1 + i * 2, 0.49, 1.0); }
    const paperT = canvasTex(360, 480, (g, w, h) => { g.fillStyle = '#e8e2d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = 'bold 40px serif'; g.textAlign = 'center'; g.fillText('EL IMPARCIAL', w / 2, 44); g.font = '10px serif'; g.fillText('San Elías · lunes 19 de febrero de 1940 · 15 céntimos', w / 2, 60); g.fillRect(10, 66, w - 20, 2);
      g.fillStyle = '#7a7470'; g.fillRect(14, 74, 200, 140); g.fillStyle = '#111'; g.font = 'bold 13px serif'; g.textAlign = 'left'; g.fillText('El general Montúfar recibe', 14, 232); g.fillText('a la delegación de Varden', 14, 248);
      g.strokeStyle = '#111'; g.strokeRect(224, 74, 124, 190); g.font = 'bold 12px serif'; g.fillText('El cadete de', 230, 92); g.fillText('la estación', 230, 106);
      g.strokeStyle = '#333'; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(286 + Math.cos(i * 1.1) * 18, 200 - i * 9); g.lineTo(286 + Math.cos(i * 1.1 + 1.1) * 18, 200 - i * 9 - 9); g.stroke(); } g.fillStyle = '#555'; g.fillRect(282, 140, 8, 14); g.beginPath(); g.arc(286, 136, 5, 0, 7); g.fill();
      g.fillStyle = '#222'; g.font = '8px serif'; ['Frustrado un atentado', 'anarquista en la Estación', 'Central. Un artefacto de', 'fabricación casera fue', 'hallado en la torre del', 'reloj. El autor, de', 'nacionalidad altense,', 'resultó abatido. Fuentes', 'de Gobernación atribuyen', 'el hallazgo a la pericia', 'de un joven recluta del', 'Reg. de Artillería Nº 4.'].forEach((l, i) => g.fillText(l, 230, 214 + i * 9 - 120 + 30));
      for (let i = 0; i < 18; i++) { g.fillRect(14, 270 + i * 11, 200 + (i % 3) * 40, 4); } });
    const news = plane(0.36, 0.48, paperT, BX + 3.1, 0.56, 1.0, 0, root, { rx: -Math.PI / 2 }); news.rotation.z = 0.15; F.news = news;
    const orange = ball(0.045, 0xe07a18, BX + 2.75, 0.585, 1.55, root, { r: 0.6 }); F.orange = orange;
    addL('barr', new THREE.HemisphereLight(0xe8dcc0, 0x302820, 0.5)).position.set(BX + 3, 3, 2);
    { const l = addL('barr', new THREE.PointLight(0xffd8a0, 1.3, 8)); l.position.set(BX + 3, 2.8, 2); }

    // ========== LA COCINA DE CORCOVADO (x 170) ==========
    const KX = 170;
    room(KX, 0, KX + 5, 4, 2.9, { wall: 0xe0d4b4, floor: 0x7a5a3a, ceil: 0xe8e0cc });
    win(KX + 5 - 0.07, 1.6, 2.0, -Math.PI / 2, 1.0, 1.1);
    const hule = canvasTex(128, 128, (g, w, h) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#b8302a' : '#ece6d8'; g.fillRect(x * 16, y * 16, 16, 16); } });
    furn(1.4, 0.76, 0.9, 0x6a4a2c, KX + 2.5, 0, 2.2); plane(1.4, 0.9, hule, KX + 2.5, 0.765, 2.2, 0, root, { rx: -Math.PI / 2 });
    for (const z of [1.4, 3.0]) { furn(0.44, 0.45, 0.44, 0x5a3a20, KX + 2.5, 0, z); }
    furn(1.4, 0.9, 0.6, 0xd8d0c0, KX + 0.8, 0, 0.4); box(0.5, 0.05, 0.4, 0x1a1a1a, KX + 0.6, 0.93, 0.4); const pan = cyl(0.14, 0.12, 0.05, 0x2a2a2a, KX + 0.6, 0.98, 0.4, root, { m: 0.6 }); void pan;
    furn(0.9, 0.85, 0.55, 0xc8c8c0, KX + 2.1, 0, 0.35);
    // el reloj alemán de las violetas, en su clavo
    const vT = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#ece4d0'; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 4; g.stroke(); g.fillStyle = 'rgba(110,70,150,.5)'; for (const [x, y] of [[40, 90], [86, 92], [64, 100]]) for (let k = 0; k < 5; k++) { const a = k / 5 * 6.28; g.beginPath(); g.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4, 0, 7); g.fill(); } g.fillStyle = '#1a1a1a'; g.font = 'bold 13px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * 6.28; g.fillText(String(i), 64 + Math.sin(a) * 46, 64 - Math.cos(a) * 46); } });
    const vclock = grp(KX + 0.08, 1.95, 2.6, root, Math.PI / 2); box(0.34, 0.52, 0.12, 0x5a3418, 0, 0, -0.05, vclock); plane(0.26, 0.26, vT, 0, 0.08, 0.02, 0, vclock); const vp = grp(0, -0.1, 0.03, vclock); box(0.01, 0.16, 0.005, 0xb8913f, 0, -0.08, 0, vp); ball(0.025, 0xb8913f, 0, -0.17, 0, vp, { m: 0.8 }); F.vp = vp; F.vclock = vclock;
    // la foto de boda en el aparador
    furn(1.2, 0.9, 0.45, 0x4a2e18, KX + 4.3, 0, 3.6, { ry: 0 });
    const wedT = canvasTex(96, 128, (g, w, h) => { g.fillStyle = '#d8ccb0'; g.fillRect(0, 0, w, h); g.fillStyle = '#6a5a48'; g.fillRect(6, 6, w - 12, h - 12); g.fillStyle = '#e8e4dc'; g.fillRect(16, 46, 24, 70); g.fillStyle = '#2a2420'; g.fillRect(52, 46, 26, 70); g.fillStyle = '#c8a888'; g.beginPath(); g.arc(28, 36, 9, 0, 7); g.fill(); g.beginPath(); g.arc(65, 34, 9, 0, 7); g.fill(); g.fillStyle = '#6a3a8a'; g.beginPath(); g.arc(30, 70, 7, 0, 7); g.fill(); });
    plane(0.18, 0.24, wedT, KX + 4.3, 1.04, 3.42, Math.PI, root, { ds: true });
    // el padre, con el delantal de su madre
    const apronT = 0xe8dcc8;
    const papa = person({ x: KX + 0.9, z: 1.0, ry: Math.PI, belly: true, apron: apronT, shirt: 0xe9e4d6, bareArms: true, leg: 0x2c2a2a, hair: 0x8a8680, mous: 0x6a6460 }); F.papa = papa;
    // el pañuelo con el volante y el puente
    const hk = grp(KX + 2.4, 0.775, 1.95); plane(0.28, 0.28, canvasTex(64, 64, (g) => { g.fillStyle = '#f0ece4'; g.fillRect(0, 0, 64, 64); g.strokeStyle = 'rgba(110,70,150,.6)'; g.strokeRect(4, 4, 56, 56); }), 0, 0.002, 0, 0, hk, { rx: -Math.PI / 2 });
    const balK = cyl(0.022, 0.022, 0.004, 0xc0a050, -0.04, 0.006, 0, hk, { m: 0.9, r: 0.2, seg: 18 }); const brK = box(0.016, 0.004, 0.05, 0xd4b060, 0.04, 0.006, 0, hk, { m: 0.8 }); cyl(0.004, 0.004, 0.004, 0x1a3aa0, 0.04, 0.01, -0.018, hk, { m: 0.9, e: 0x0a1a60, ei: 0.6 });
    hk.visible = false; F.hk = hk; F.brK = brK; void balK;
    addL('kitchen', new THREE.HemisphereLight(0xfff4e0, 0x5a4a30, 0.8)).position.set(KX + 2.5, 3, 2);
    { const l = addL('kitchen', new THREE.DirectionalLight(0xfff0d0, 1.0)); l.position.set(KX + 9, 5, 2); l.target.position.set(KX + 2, 0, 2); }
    { const l = addL('kitchen', new THREE.PointLight(0xffe0b0, 0.6, 7)); l.position.set(KX + 2.5, 2.5, 2.2); }
    // el dormitorio de noche: el padre despierto, el reloj de viaje, el vaso con sus anillos de cal
    const DX = 200;
    room(DX, 0, DX + 4, 4, 2.8, { wall: 0xc8bca0, floor: 0x5a4030, ceil: 0xd0c8b4 });
    box(1.5, 0.45, 2.0, 0x4a3020, DX + 2, 0.22, 1.6); box(1.45, 0.12, 1.95, 0xd8d0c0, DX + 2, 0.5, 1.6); box(1.5, 0.9, 0.08, 0x3a2416, DX + 2, 0.6, 0.6);
    const papaB = person({ x: DX + 2.35, y: 0.6, z: 1.2, ry: 0, coat: 0xe4e0d4, leg: 0xe4e0d4, hair: 0x8a8680, mous: 0x6a6460 }); papaB.g.rotation.x = -Math.PI / 2; papaB.g.position.y = 0.66; papaB.g.position.z = 0.75; F.papaB = papaB;
    box(1.2, 0.08, 1.5, 0x6a5a4a, DX + 2, 0.62, 2.0);
    furn(0.45, 0.6, 0.4, 0x4a2e18, DX + 0.8, 0, 0.9);
    const tclock = grp(DX + 0.75, 0.6, 0.85); box(0.09, 0.12, 0.05, 0xc8a050, 0, 0.06, 0, tclock, { m: 0.8, r: 0.3 }); plane(0.06, 0.06, vT, 0, 0.07, 0.026, 0, tclock); F.tclock = tclock;
    const glass = cyl(0.035, 0.03, 0.11, 0xd8e4e8, DX + 0.9, 0.655, 0.95, root, { t: 0.45, r: 0.1 }); F.glass = glass;
    for (let i = 0; i < 14; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.0345 - i * 0.0002, 0.0009, 4, 18), M(0xe8e4dc)); r.rotation.x = Math.PI / 2; r.position.set(DX + 0.9, 0.6 + 0.015 + i * 0.0062, 0.95); root.add(r); }
    addL('night', new THREE.HemisphereLight(0x5a6a8a, 0x141210, 0.25)).position.set(DX + 2, 3, 2);
    { const l = addL('night', new THREE.PointLight(0xbcc8e0, 0.45, 5)); l.position.set(DX + 1.2, 1.6, 0.8); }
    F.DX = DX;

    // ========== LA BUHARDILLA DE CLARA, calle Platerías (x 230) ==========
    const AX = 230;
    box(4.4, 0.1, 4, 0x6a4a30, AX + 2.2, -0.05, 2); box(4.4, 2.0, 0.12, 0xd8ccb0, AX + 2.2, 1.0, 4); box(0.12, 2.6, 4, 0xd8ccb0, AX, 1.3, 2); box(0.12, 2.6, 4, 0xd8ccb0, AX + 4.4, 1.3, 2);
    { const r = box(4.4, 0.08, 2.6, 0xc8bca0, AX + 2.2, 2.2, 2.9); r.rotation.x = -0.5; }
    { const r = box(4.4, 0.08, 1.9, 0xc8bca0, AX + 2.2, 2.5, 0.9); r.rotation.x = 0.15; }
    box(4.4, 2.4, 0.12, 0xd8ccb0, AX + 2.2, 1.2, 0); const dorm = box(1.0, 1.1, 0.04, 0x0e1420, AX + 2.2, 1.5, -0.02, root, { e: 0x0a1020, ei: 0.5 }); void dorm;
    // la cama estrecha de hierro, la colcha de ganchillo, la mesilla con el libro de Pedagogía y la foto
    const croT = canvasTex(64, 64, (g) => { g.fillStyle = '#ece4d0'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#c8b898'; for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.beginPath(); g.arc(i * 8 + 4, j * 8 + 4, 3, 0, 7); g.stroke(); } });
    box(0.9, 0.06, 1.9, 0x2a2a28, AX + 1.2, 0.45, 2.6, root, { m: 0.5 }); plane(0.92, 1.9, croT, AX + 1.2, 0.56, 2.6, 0, root, { rx: -Math.PI / 2 }); box(0.85, 0.1, 1.85, 0xece4d0, AX + 1.2, 0.5, 2.6);
    for (const z of [1.65, 3.55]) box(0.9, 0.8, 0.03, 0x2a2a28, AX + 1.2, 0.5, z, root, { m: 0.5 });
    furn(0.4, 0.55, 0.35, 0x5a3a20, AX + 2.0, 0, 1.35); box(0.16, 0.04, 0.22, 0x2a3a5a, AX + 2.0, 0.57, 1.35);
    const clara = person({ x: AX + 1.25, z: 3.05, ry: -2.82, sit: true, coat: 0x6a5a5a, skirt: 0x2e3440, leg: 0x2e3440, hair: 0x14100c, bun: true, slim: true, mous: null }); clara.g.position.y = 0.05; F.clara = clara;
    // la torre de la Estación Central, iluminada por cuatro focos, al fondo por la ventana
    const tw = grp(AX + 6, 0, -70); box(6, 44, 6, 0x6a6660, 0, 22, 0, tw); const tdial = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), M(0xf4ecd0, { e: 0xf4e4b0, ei: 0.9 })); tdial.position.set(0, 38.6, 3.05); tw.add(tdial);
    const tf = addL('attic', new THREE.SpotLight(0xffe8c0, 3, 80, 0.4, 0.5)); tf.position.set(AX + 6, 2, -60); tf.target.position.set(AX + 6, 36, -70);
    for (let i = 0; i < 30; i++) box(6 + (i % 3) * 2, 6 + (i % 5) * 3, 6, 0x1a1c22, AX - 30 + i * 4, 3 + (i % 5) * 1.5, -30 - (i % 4) * 8, root, { e: i % 3 ? 0 : 0x2a2418, ei: 0.4 });
    addL('attic', new THREE.HemisphereLight(0x4a5a7a, 0x14100c, 0.3)).position.set(AX + 2, 3, 2);
    { const l = addL('attic', new THREE.PointLight(0xffd8a0, 0.7, 5)); l.position.set(AX + 2.0, 1.2, 1.5); }
    F.AX = AX;

    // ========== LA PUERTA DE LA RECOLETA, 1 de marzo, 7:10 (x 300) ==========
    const GX = 300;
    box(40, 0.1, 30, 0x6a6660, GX, -0.05, 0);
    for (const s of [-1, 1]) box(1.0, 4.4, 1.0, 0x7a3a2a, GX + s * 2.6, 2.2, -4); box(6.2, 0.8, 1.0, 0x7a3a2a, GX, 4.6, -4);
    for (const s of [-1, 1]) box(16, 5, 0.6, 0x8a4232, GX + s * 11, 2.5, -4);
    const pk = grp(GX + 30, 0, 3, root, -Math.PI / 2); box(1.8, 0.7, 4.8, 0x0e0e10, 0, 0.75, 0, pk, { m: 0.5, r: 0.3 }); box(1.6, 0.6, 2.4, 0x0e0e10, 0, 1.4, 0.3, pk, { m: 0.5, r: 0.3 }); for (const s of [-1, 1]) for (const zz of [-1.5, 1.5]) cyl(0.38, 0.38, 0.22, 0x111111, s * 0.92, 0.38, zz, pk, { rz: Math.PI / 2 });
    const pkDoor = box(0.06, 0.6, 0.9, 0x0e0e10, -0.9, 1.3, 0.95, pk, { m: 0.5 }); F.pk = pk; F.pkDoor = pkDoor; F.GX = GX;
    const suit = box(0.5, 0.36, 0.16, 0x7a5a3a, GX + 0.6, 0.18, 1.4); F.suit = suit;
    addL('gate', new THREE.HemisphereLight(0xc8d0dc, 0x5a5048, 0.7)).position.set(GX, 10, 0);
    { const l = addL('gate', new THREE.DirectionalLight(0xffe0c0, 0.9)); l.position.set(GX + 30, 6, 20); l.target.position.set(GX, 0, 0); }
    // el odio: un velo oscuro que aprieta
    const hateEl = document.createElement('div'); hateEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 35%,rgba(40,6,4,.85));opacity:0;transition:opacity 1.6s ease';
    if (Scenes.el.root) Scenes.el.root.prepend(hateEl); F.hateEl = hateEl;
    S.set = F;
    return F;
  },
  light(S, where) { const F = S.set; for (const k in F.lights) for (const [l, v] of F.lights[k]) l.intensity = k === where ? v : 0; F.where = where; },
  chord(minor = true) { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime; for (const f of minor ? [146.8, 174.6, 220, 293.7] : [146.8, 185, 220]) { AUDIO.osc(SceneAudio.dest(), 'sawtooth', f, f, t, 5.5, 0.008, 0.25); AUDIO.osc(SceneAudio.dest(), 'triangle', f * 2, f * 2, t, 5.5, 0.01, 0.3); } },
  update(S, dt) {
    const F = S.set; if (!F) return;
    CampUtil.globals(0, F.where === 'night' || F.where === 'attic' ? 0.02 : 0.1);
    const t = S.t;
    if (F.where === 'car' && F.drive) { for (const b of F.street) { b.position.z += dt * 9; if (b.position.z > 20) b.position.z -= 98; } F.ford.position.z += dt * 2; }
    if (F.vp) F.vp.rotation.z = Math.sin(t * 2.6) * 0.18;
    // el padre: el índice al bigote, de lado a lado
    if (F.mous) { const k = F.mous; F.mousT = (F.mousT || 0) + dt; const on = (F.mousT % 4.2) < 1.6; const a = F.papa.arms[0]; a.rotation.x = on ? -2.5 : -0.2; a.userData.f.rotation.x = on ? -1.6 : 0; a.rotation.z = on ? 0.3 + Math.sin(t * 9) * 0.08 : 0; F.mousOn = on; void k; }
  },
  dispose(S) { const F = S.set; if (!F) return; for (const t of F.tex) t.dispose(); if (F.hateEl) F.hateEl.remove(); S.set = null; },
};

(() => {
  const C = (S) => S.set, V = CampUtil.V, sit = CampUtil.sit.bind(CampUtil), head = campHead(CAMP_BY_ID['P1-E5']);
  const go = (where, fn) => Step.run((S) => { Cap5Set.light(S, where); S.where = where; fn(S); });
  const face = (S, x, z, pitch) => { const y = CampUtil.yawTo(S.eye.x, S.eye.z, x, z); S.yaw = Input.state.yaw = y; if (!(S.walk && S.walk.on)) S.yawC = y; if (pitch != null) S.pitch = Input.state.pitch = pitch; };
  const steps = (S, n = 6) => { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime; for (let i = 0; i < n; i++) AUDIO.nz(SceneAudio.dest(), t + i * 0.55, 0.05, 0.03, 'bandpass', 700, null, 2); };

  SCENES.cap5 = {
    setup(S) { Cap5Set.build(S); MODES.campaign.noAmbience = true; Ambience.stop(); Cap5Set.light(S, 'car'); sit(S, 0.45, 1.22, 0.55, Math.PI, -0.05, 2.9); },
    update(S, dt) { Cap5Set.update(S, dt); },
    teardown(S) { SceneWalk.stop(S); S.walk = null; Cap5Set.dispose(S); },
    steps: [
      Step.card({ es: 'Parte I · Cuerda', en: 'Part I · Winding' }, { es: 'El hombre de la cera', en: 'The Man of Wax' }, head),
      Step.fade(0, 1.6, false),
      SAY('Al padre lo metieron en otro coche.', 'They put his father in another car.'),
      SAY('Santiago lo vio por la ventanilla de atrás del Packard mientras arrancaban: su padre de pie en la acera, con el sombrero en una mano y la llave maestra en la otra, y el hombre de la gabardina gris abriéndole la puerta de un Ford corriente, de color crema. Su padre se metió en el Ford con la cabeza agachada, como se mete uno en un tren que ya conoce.', 'Santiago saw him through the Packard’s rear window as they pulled away: his father standing on the pavement, hat in one hand and the master key in the other, and the man in the grey raincoat opening the door of an ordinary cream-coloured Ford for him. His father got into the Ford with his head bowed, the way you board a train you already know.'),
      Step.run((S) => { const F = C(S); F.drive = true; F.papaS.g.visible = false; F.gabS.g.visible = false; S.yawC = 0; S.yaw = Input.state.yaw = CampUtil.yawTo(0.45, 0.55, -0.45, 0.55); }),
      SAY('—Lo llevarán a su hotel —dijo la voz a su lado—. Y mañana a Corcovado, en primera, con el billete pagado. Su padre y yo nos conocemos desde hace mucho.', '“They’ll take him to his hotel,” said the voice beside him. “And tomorrow to Corcovado, first class, ticket paid. Your father and I have known each other a long time.”'),
      Step.find([
        { pos: (S) => C(S).L1.head.localToWorld(V(0, 0.13, -0.02)), r: 0.08, text: { es: 'El hombre del cementerio. El mismo pelo blanco peinado hacia atrás. De cerca, más arrugas: finas, muy numerosas, como el craquelado de una esfera de esmalte vieja.', en: 'The man from the cemetery. The same white hair combed back. Close up, more wrinkles: fine, very many, like the crazing on an old enamel dial.' } },
        { pos: (S) => C(S).L1.head.localToWorld(V(0, 0.03, 0.13)), r: 0.07, text: { es: 'Los ojos grises, casi transparentes. La piel de alguien que no ha estado al sol en muchos años.', en: 'Grey eyes, almost transparent. The skin of someone who hasn’t been in the sun for many years.' } },
        { pos: (S) => C(S).L1.ring.getWorldPosition(V(0, 0, 0)), r: 0.07, text: { es: 'Las manos, grandes y finas, de pianista o de cura, una encima de otra sobre el sombrero. El anillo de sello en el meñique izquierdo.', en: 'His hands, large and fine, a pianist’s or a priest’s, one on top of the other on his hat. The signet ring on his left little finger.' } },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: el hombre de la cera · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the man of wax · ${n}/${k}` })),
      SAY('El olor a cera de vela lo llenaba todo. No era un perfume. Era como si el hombre hubiera pasado tantas horas en sitios donde ardían velas que la cera se le hubiera metido en la piel.', 'The smell of candle wax filled everything. It wasn’t a perfume. It was as if the man had spent so many hours in places where candles burned that the wax had got into his skin.', { cls: 'inner' }),
      SAY('—Ismael Larraín. Coronel. Aunque los uniformes nunca me han sentado bien.', '“Ismael Larraín. Colonel. Though uniforms have never suited me.”'),
      SAY('—Usted estaba en el coche. En la esquina. Durante todo el rato. Usted lo vio todo.', '“You were in the car. On the corner. The whole time. You saw everything.”'),
      SAY('—Vi la ventanita de la esfera sur abrirse a las diez y cincuenta y seis. Vi a un muchacho asomarse. Luego oí las once campanadas y ninguna más. —Una sonrisa muy pequeña, que llegaba a los ojos—. Le confieso que entre la sexta y la séptima me preocupé un poco.', '“I saw the hatch in the south face open at ten fifty-six. I saw a boy look out. Then I heard eleven strokes and no more.” A very small smile, one that reached his eyes. “I confess that between the sixth and the seventh I was a little worried.”'),
      SAY('—¿Sabía usted que había una bomba? —Sabía que podía haberla. —¿Y no hizo nada? —Hice algo. Lo traje a usted.', '“Did you know there was a bomb?” “I knew there might be.” “And you did nothing?” “I did something. I brought you.”'),
      SAY('Lo puso todo junto, como las piezas de un reloj desmontado sobre un tapete de fieltro verde. El matasellos. La cruz a lápiz. Las dos cartas a Ortúzar. La postal. Su padre debajo del reloj, sudando, sin saber por qué estaba allí.', 'He put it all together, like the parts of a dismantled watch on a green felt mat. The postmark. The pencil cross. The two letters to Ortúzar. The postcard. His father under the clock, sweating, not knowing why he was there.', { cls: 'inner' }),
      Step.choice({ es: '¿Qué le dices?', en: 'What do you say?' }, [{ es: '—Usted quería ver si yo lo veía.', en: '“You wanted to see if I’d see it.”' }, { es: '—Gracias por traerme.', en: '“Thank you for bringing me.”' }, { es: 'Callar.', en: 'Say nothing.' }], 0,
        [{ es: '', en: '' }, { es: 'No había nada que agradecer. Lo había usado. Dilo.', en: 'There was nothing to thank him for. He had used him. Say it.' }, { es: 'No. Esta vez las cosas se dicen.', en: 'No. This time things get said.' }]),
      SAY('—Sí. —Usted puso a mi padre debajo del reloj. Con una bomba encima.', '“Yes.” “You put my father under the clock. With a bomb above him.”'),
      SAY('—Puse a su padre debajo del reloj porque sabía que si había una bomba encima, usted la encontraría. Y porque si no la encontraba, señor Fierros, todo lo demás no habría tenido importancia, ¿no le parece? Ni para usted. Ni para mí. Ni para su padre.', '“I put your father under the clock because I knew that if there was a bomb above him, you would find it. And because if you didn’t find it, Mr Fierros, nothing else would have mattered, don’t you think? Not to you. Not to me. Not to your father.”'),
      Step.run((S) => { C(S).hateEl.style.opacity = 1; if (SceneAudio.ok()) AUDIO.osc(SceneAudio.dest(), 'sine', 55, 48, AUDIO.ctx.currentTime, 3.5, 0.08, 0.6); }),
      SAY('Sintió algo que no había sentido nunca. Le subió desde el estómago, como la risa, pero no era risa. Era caliente y negro y le apretó la garganta y le hizo cerrar los puños sobre las rodillas. Tenía veintiún años y nunca había odiado a nadie y no sabía que eso era lo que se sentía.', 'He felt something he had never felt. It rose from his stomach, like laughter, but it wasn’t laughter. It was hot and black and it tightened his throat and made him clench his fists on his knees. He was twenty-one and had never hated anyone and didn’t know that this was what it felt like.', { cls: 'inner' }),
      SAY('Larraín le miró los puños. Luego le miró la cara. —Bien. Eso está bien. Guárdelo. Le va a hacer falta.', 'Larraín looked at his fists. Then at his face. “Good. That’s good. Keep it. You’re going to need it.”'),
      Step.run((S) => { C(S).hateEl.style.opacity = 0; }),
      Step.fade(1, 1.4),
      // ---- el Ministerio de Culto ----
      Step.card(null, null, { es: 'Ministerio de Culto · calle de San Bernardo · 11:48', en: 'Ministry of Worship · Calle de San Bernardo · 11:48' }, 3.0),
      go('cloister', (S) => { const F = C(S); F.drive = false; CampUtil.walk(S, F.MX - 6.8, 0, 6.6, CampUtil.yawTo(F.MX - 6.8, 6.6, F.MX + 6.4, -6.4)); }),
      Step.fade(0, 1.2, false),
      SAY('Un antiguo convento de clarisas detrás de la catedral, con un claustro de naranjos y unos pasillos tan largos y tan silenciosos que se oían los pasos de cualquiera a cincuenta metros. Funcionarios con manguitos negros sellando certificados de bautismo y permisos para procesiones. Olor a papel viejo y a incienso.', 'An old Poor Clares convent behind the cathedral, with a cloister of orange trees and corridors so long and so silent you could hear anyone’s footsteps fifty metres away. Clerks in black sleeve-guards stamping baptism certificates and permits for processions. A smell of old paper and incense.'),
      Step.reach(40 + 6.4, -5.2, 1.6, 'Sigue a Larraín por el claustro, hasta la escalera de piedra.', 'Follow Larraín through the cloister to the stone staircase.'),
      Step.fade(1, 0.6),
      go('corr', (S) => { const F = C(S); CampUtil.walk(S, F.CX + 1, 0, 0, -Math.PI / 2); steps(S, 10); }),
      Step.fade(0, 0.8, false),
      Step.reach(70 + 25.2, 0, 1.0, 'El pasillo del primer piso. Una puerta sin placa al fondo.', 'The first-floor corridor. An unmarked door at the end.'),
      go('office', (S) => { const F = C(S); sit(S, F.OX + 2.2, 1.2, 1.3, 0, -0.05, 2.6); }),
      SAY('Un despacho pequeño con una ventana al claustro, una mesa de nogal sin un solo papel encima, dos sillas, un crucifijo, una estantería con libros de música encuadernados en piel y un armonio. Un armonio pequeño, de pedales, con las teclas amarillas como dientes viejos.', 'A small office with a window onto the cloister, a walnut desk without a single paper on it, two chairs, a crucifix, a shelf of music books bound in leather and a harmonium. A small pedal harmonium, its keys yellow like old teeth.'),
      SAY('Larraín no se sentó. Se quedó de pie junto a la ventana, con las manos a la espalda. Cojeaba de la pierna derecha.', 'Larraín didn’t sit. He stood by the window, hands behind his back. He limped on his right leg.'),
      SAY('—¿Cómo se rompió la pierna? —Me la rompieron. Hace mucho. ¿Qué más ve? Míreme, señor Fierros. Está deseando hacerlo. Lleva haciéndolo desde el cementerio. Dígame qué ve.', '“How did you break your leg?” “It was broken for me. Long ago. What else do you see? Look at me, Mr Fierros. You’re longing to. You’ve been doing it since the cemetery. Tell me what you see.”'),
      Step.find([
        { pos: (S) => C(S).L3.ring.getWorldPosition(V(0, 0, 0)), r: 0.06, text: { es: 'El anillo del meñique no es de boda: es de familia o de una institución. Lo lleva en el meñique porque en el anular le queda grande. Era de otra persona, con los dedos más gruesos.', en: 'The ring on the little finger isn’t a wedding ring: it’s a family’s or an institution’s. He wears it on the little finger because it’s too big for the ring finger. It belonged to someone else, with thicker fingers.' } },
        { pos: (S) => C(S).keys.getWorldPosition(V(0, 0, 0)), r: 0.07, text: { es: 'El armonio no tiene polvo en las teclas. Y la yema del índice derecho, más plana que las otras.', en: 'The harmonium has no dust on its keys. And the tip of his right index finger, flatter than the others.' } },
        { pos: (S) => C(S).L3.g.localToWorld(V(0.11, 0.06, 0.02)), r: 0.08, text: { es: 'Se pone de pie como la gente que ha pasado muchas horas de pie en un coro, con el peso en los talones. Niño cantor, o seminarista, o las dos cosas.', en: 'He stands the way people do who have spent many hours standing in a choir, weight on the heels. Choirboy, or seminarian, or both.' } },
        { pos: (S) => C(S).L3.torso.localToWorld(V(0.22, 0.56, 0)), r: 0.08, text: { es: 'El hombro izquierdo, ligeramente más bajo. La rodilla derecha: no es cojera de nacimiento, es herida vieja, algo que se rompió y se soldó mal.', en: 'His left shoulder slightly lower. The right knee: not a limp from birth, an old wound, something that broke and knitted badly.' } },
        { pos: (S) => C(S).L3.head.localToWorld(V(0, 0.02, -0.13)), r: 0.08, text: { es: 'Duerme mal. No le gusta el sol. No le gusta el ruido.', en: 'He sleeps badly. He doesn’t like the sun. He doesn’t like noise.' } },
      ], 4, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: dile qué ves · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: tell him what you see · ${n}/${k}` })),
      SAY('—Tiene usted cincuenta y ocho años, o cincuenta y nueve. Es soltero. Toca el armonio. Fue niño cantor, o seminarista. Tiene un chófer que le tiene miedo: abrió la puerta del coche antes de que usted llegara a ella, y se le notaba en la nuca. Y le gusta tener razón. Le gusta mucho. Por eso me ha hecho esta pregunta: ya sabe todo lo que le voy a decir y quiere oírmelo decir.', '“You are fifty-eight, or fifty-nine. Unmarried. You play the harmonium. You were a choirboy, or a seminarian. You have a chauffeur who’s afraid of you: he opened the car door before you reached it, and it showed in the back of his neck. And you like being right. You like it very much. That’s why you asked: you already know everything I’m going to say and you want to hear me say it.”'),
      Step.run((S) => { const F = C(S); F.L3.g.rotation.y = 0; }),
      SAY('Larraín se volvió. Por primera vez, la sonrisa pequeña le había desaparecido de la cara. —Dios mío —dijo en voz baja—. Igual que ella.', 'Larraín turned. For the first time, the small smile had gone from his face. “My God,” he said quietly. “Just like her.”'),
      Step.run((S) => { const F = C(S); F.L3.g.position.set(F.OX + 2.2, 0.0, -0.7); F.L3.g.rotation.y = 0; }),
      SAY('—Ahora le toca a usted escucharme. Y no le voy a decir lo que veo. Le voy a decir lo que sé. Que es distinto. Mide usted un metro setenta y seis y pesa sesenta y un kilos. Tiene una cicatriz en el pulgar derecho, de un martillo. Juega al ajedrez por dinero en El Ajedrez los miércoles, y pierde a propósito con el señor de la boina para saber qué hace cuando gana.', '“Now it’s your turn to listen to me. And I won’t tell you what I see. I’ll tell you what I know. Which is different. You are one metre seventy-six and weigh sixty-one kilos. You have a scar on your right thumb, from a hammer. You play chess for money at El Ajedrez on Wednesdays, and lose on purpose to the man in the beret to see what he does when he wins.”'),
      SAY('—Repara relojes en la Relojería Anselmo tres tardes por semana, y desde octubre está enamorado de la hija del dueño, que se llama Clara, y la besó en Nochevieja en la tercera campanada. En La Recoleta le han pegado cuatro hombres en las duchas, y usted se rió. Y uno de ellos, el más grande, le dejó luego una naranja en el catre.', '“You mend watches at the Anselmo shop three afternoons a week, and since October you’ve been in love with the owner’s daughter, whose name is Clara, and you kissed her on New Year’s Eve at the third stroke. At La Recoleta four men beat you in the showers, and you laughed. And one of them, the biggest, later left an orange on your cot.”'),
      SAY('Sintió que se le helaba la sangre. Como si alguien le hubiera abierto una ventana dentro del pecho.', 'He felt his blood freeze. As if someone had opened a window inside his chest.', { cls: 'inner' }),
      SAY('—¿Por qué? —Porque le estaba esperando. Para que un país pequeño sobreviva entre dos gigantes que se pelean por su metal hacen falta dos cosas: un gobierno que sonría a los dos, y alguien que haga lo que el gobierno no puede hacer mientras sonríe.', '“Why?” “Because I was waiting for you. For a small country to survive between two giants fighting over its metal, two things are needed: a government that smiles at both, and someone who does what the government can’t do while it smiles.”'),
      SAY('—Como poner bombas en los relojes. —Como encontrarlas. Sabía que alguien quería matar a Montúfar hoy. No sabía cómo. Usted lo ha averiguado en cuarenta minutos con una llave de ferrocarril. Mis hombres llevaban cuatro días buscando.', '“Like putting bombs in clocks.” “Like finding them. I knew someone wanted to kill Montúfar today. I didn’t know how. You worked it out in forty minutes with a railway key. My men had been searching for four days.”'),
      SAY('Mientes, pensó. Pero no sabía en qué parte mentía. Eso era lo nuevo. Larraín mentía como estaba hecho el reloj de la caja de chapa: con piezas verdaderas de muchos sitios distintos, repulidas a mano, ensambladas con tanto cuidado que no se veían las juntas.', 'You’re lying, he thought. But he didn’t know which part was the lie. That was what was new. Larraín lied the way the watch in the tin box was made: with true parts from many different places, re-polished by hand, assembled so carefully the joins didn’t show.', { cls: 'inner' }),
      SAY('—Hay un grupo. Muy pequeño. No figura en ningún presupuesto. No tiene uniforme. No tiene nombre, oficialmente, aunque sus miembros tienen la costumbre de llamarlo el Coro. Dependemos del Ministerio de Culto porque es el único ministerio del que nadie sospecha nada. Le estoy ofreciendo entrar en él.', '“There is a group. Very small. It appears in no budget. It has no uniform. It has no name, officially, though its members are in the habit of calling it the Choir. We answer to the Ministry of Worship because it is the one ministry nobody suspects of anything. I am offering you a place in it.”'),
      Step.choice({ es: '¿Qué le contestas?', en: 'What do you answer?' }, [{ es: '—No.', en: '“No.”' }, { es: '—Sí.', en: '“Yes.”' }, { es: '—Déjeme pensarlo.', en: '“Let me think about it.”' }], 0,
        [{ es: '', en: '' }, { es: 'No. Ese hombre había puesto a su padre debajo de una bomba.', en: 'No. That man had put his father under a bomb.' }, { es: 'No había nada que pensar. Todavía.', en: 'There was nothing to think about. Not yet.' }]),
      SAY('—Es una respuesta muy razonable. —No sé disparar. No sé pelear. Soy un estudiante de Ingeniería. —No le ofrezco entrar para que dispare, señor Fierros. Para disparar tengo a otros. Le ofrezco entrar porque usted mira. En este oficio, el que mira manda sobre el que dispara. El que dispara solo aprieta un gatillo. El que mira decide adónde.', '“A very reasonable answer.” “I can’t shoot. I can’t fight. I’m an engineering student.” “I’m not offering you a place so that you’ll shoot, Mr Fierros. I have others for shooting. I’m offering you a place because you look. In this trade, the one who looks commands the one who shoots. The one who shoots only pulls a trigger. The one who looks decides where.”'),
      Step.run((S) => { const F = C(S); F.L3.g.position.set(F.OX + 0.95, 0, 1.0); F.L3.g.rotation.y = -Math.PI / 2; }),
      SAY('—Sigue siendo no. —Entendido. —Larraín fue hasta el armonio y se quedó de pie delante de él, con una mano sobre la tapa—. ¿Encontró usted algo más, arriba? ¿Aparte de la caja?', '“It’s still no.” “Understood.” Larraín went to the harmonium and stood in front of it, one hand on the lid. “Did you find anything else, up there? Apart from the box?”'),
      SAY('Sintió el bulto del pañuelo en el bolsillo interior de la guerrera. El volante con sus tornillitos de oro. El puente con la violeta. El papel de fumar.', 'He felt the lump of the handkerchief in the inside pocket of his tunic. The balance with its little gold screws. The bridge with the violet. The cigarette paper.', { cls: 'inner' }),
      Step.choice({ es: '¿Encontró usted algo más?', en: 'Did you find anything else?' }, [{ es: '—Sí. Esto.', en: '“Yes. This.”' }, { es: '—No.', en: '“No.”' }], 1,
        [{ es: 'No quería que nadie más viera la violeta. Y menos él.', en: 'He didn’t want anyone else to see the violet. Least of all him.' }, { es: '', en: '' }]),
      SAY('Larraín se volvió despacio. Lo miró. Y le sonrió: la sonrisa de un maestro que acaba de oír a un alumno dar su primera nota afinada. —Bien. Primera mentira. Ya está usted aprendiendo.', 'Larraín turned slowly. Looked at him. And smiled: the smile of a teacher who has just heard a pupil sing his first true note. “Good. First lie. You’re learning already.”'),
      Step.run((S) => { const F = C(S); F.hlid.rotation.x = -1.6; Cap5Set.chord(true); }),
      SAY('Larraín levantó la tapa del armonio, puso un pie en el pedal y tocó un acorde, uno solo, menor, que se quedó vibrando en el despacho mucho rato, como un olor.', 'Larraín lifted the harmonium lid, put a foot on the pedal and played a chord, just one, minor, that went on vibrating in the little office for a long time, like a smell.'),
      SAY('—No hace falta que me diga que sí ahora. Vuelva a La Recoleta. Vaya a ver a su padre. Vaya a ver a la señorita Anselmo. Cuando lo haya pensado, hable con su padre. Pregúntele por qué le dio la llave. Y luego pregúntele, si quiere, por qué no le hace falta decirme que sí.', '“You needn’t tell me yes now. Go back to La Recoleta. Go and see your father. Go and see Miss Anselmo. When you’ve thought about it, talk to your father. Ask him why he gave you the key. And then ask him, if you like, why you don’t need to tell me yes.”'),
      SAY('—¿Qué quiere decir? —Que alguien ya me lo dijo por usted —dijo Larraín, y bajó la tapa—. Hace mucho tiempo.', '“What do you mean?” “That someone already said it for you,” said Larraín, and closed the lid. “A long time ago.”'),
      Step.run((S) => { C(S).hlid.rotation.x = 0; }),
      Step.fade(1, 1.6),
      // ---- El Imparcial y la naranja ----
      Step.card(null, null, { es: 'Cuartel de La Recoleta · lunes 19 de febrero de 1940', en: 'La Recoleta Barracks · Monday 19 February 1940' }, 2.8),
      go('barr', (S) => { const F = C(S); sit(S, 140 + 3.0, 1.15, 1.75, 0, -1.0, 1.2); S.pitchMin = -1.4; }),
      Step.fade(0, 1.2, false),
      Step.find([{ pos: (S) => C(S).news.localToWorld(V(0.11, 0.08, 0)), r: 0.08, text: { es: 'Frustrado un atentado anarquista en la Estación Central. El autor, de nacionalidad altense, resultó abatido. Fuentes de Gobernación atribuyen el hallazgo a la pericia de un joven recluta del Regimiento de Artillería Nº 4. El cadete de la estación, lo llamaba El Imparcial, con el dibujo de un muchacho sin cara subiendo una escalera de caracol. Un cadete. Ni siquiera eso era verdad.', en: 'Anarchist attack foiled at Central Station. The perpetrator, an Altense national, was shot dead. Interior Ministry sources credit the discovery to the skill of a young recruit of the 4th Artillery Regiment. The station cadet, El Imparcial called him, with a drawing of a faceless boy climbing a spiral staircase. A cadet. Not even that was true.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: El Imparcial.', en: 'Hold <kbd>Q</kbd>: El Imparcial.' })),
      SAY('En La Recoleta lo sabían todos. Nadie le dijo nada. Ortúzar le dio la mano sin decir una palabra, y se la estrechó mucho rato. Bermúdez dejó de llamarlo Recomendado; dejó de mirarlo, como se deja de mirar una puerta detrás de la cual se sabe que hay algo. Cifuentes le pidió perdón una noche, llorando: su madre estaba en la plaza aquel día, detrás del cordón, con una banderita.', 'At La Recoleta everyone knew. Nobody said anything. Ortúzar shook his hand without a word, and held it a long time. Bermúdez stopped calling him Recommended; he stopped looking at him, the way you stop looking at a door you know has something behind it. Cifuentes apologised one night, crying: his mother had been in the square that day, behind the cordon, with a little flag.'),
      Step.uses([{ id: 'naranja', d: 1.4, r: 0.4, pos: (S) => C(S).orange.position, label: { es: 'Comerse la naranja', en: 'Eat the orange' }, use(S) { C(S).orange.visible = false; }, text: { es: 'El Mulo le dejó otra naranja. Se la comió. Era la primera cosa que comía con ganas en tres días.', en: 'Mulo left him another orange. He ate it. It was the first thing he had eaten with appetite in three days.' } }], 1,
        () => L({ es: 'Otra naranja en el catre.', en: 'Another orange on the cot.' })),
      Step.fade(1, 1.4),
      // ---- la cocina de Corcovado ----
      Step.card(null, null, { es: 'Villa Corcovado · calle de los Herreros · sábado 24 de febrero de 1940 · 14:10', en: 'Villa Corcovado · Calle de los Herreros · Saturday 24 February 1940 · 14:10' }, 3.0),
      go('kitchen', (S) => { const F = C(S); sit(S, 170 + 2.5, 1.2, 3.0, 0, -0.15, 2.0); }),
      Step.fade(0, 1.2, false),
      SAY('Su padre estaba en la cocina cuando llegó. Con el delantal de su madre. Friendo plátanos. No cantaba. Comieron sin hablar.', 'His father was in the kitchen when he arrived. In his mother’s apron. Frying plantains. He wasn’t singing. They ate without speaking.'),
      Step.find([
        { pos: (S) => C(S).vclock.localToWorld(V(0, 0.08, 0.03)), r: 0.08, text: { es: 'El reloj alemán de las violetas en su clavo.', en: 'The German clock with the violets on its nail.' } },
        { pos: (S) => V(170 + 4.3, 1.04, 3.42), r: 0.07, text: { es: 'La foto de boda en el aparador: ella de blanco con un ramo de violetas, él con un bigote negro y el pelo con brillantina, los dos muy serios, mirando a la cámara como si la cámara fuera a quitarles algo.', en: 'The wedding photo on the sideboard: she in white with a bouquet of violets, he with a black moustache and brilliantined hair, both very serious, looking at the camera as if it were going to take something from them.' } },
      ], 2, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: la cocina · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the kitchen · ${n}/${k}` })),
      Step.run((S) => { const F = C(S); F.papa.g.position.set(170 + 2.1, 0, 0.85); F.papa.g.rotation.y = 0; }),
      SAY('Después de comer, su padre fregó los platos. Se secó las manos en el delantal, muy despacio, y se volvió, y se apoyó en el fregadero, y lo miró. —Me ha visitado. —¿Quién? —Ya sabes quién. Que te ha hecho una oferta. Que le has dicho que no. Que vendrías a preguntarme.', 'After eating, his father washed the dishes. He dried his hands on the apron, very slowly, and turned, and leaned on the sink, and looked at him. “He came to see me.” “Who?” “You know who. That he’s made you an offer. That you said no. That you’d come and ask me.”'),
      Step.uses([{ id: 'panuelo', d: 1.6, r: 0.4, pos: (S) => C(S).hk.position, avail: () => true, label: { es: 'Desenvolver el pañuelo sobre el hule', en: 'Unwrap the handkerchief on the oilcloth' }, use(S) { C(S).hk.visible = true; } }], 1,
        () => L({ es: 'El pañuelo, en el bolsillo de la chaqueta.', en: 'The handkerchief, in your jacket pocket.' })),
      SAY('El volante con sus tornillitos de oro. El puente del volante con su tornillo azul y su violeta de un milímetro. Su padre no se acercó. Lo miró desde allí, a dos metros. No necesitaba acercarse. Había visto esa violeta muchas veces. La había visto mucho antes que él.', 'The balance with its little gold screws. The balance bridge with its blue screw and its one-millimetre violet. His father didn’t come closer. He looked at it from there, two metres away. He didn’t need to come closer. He had seen that violet many times. He had seen it long before his son had.'),
      SAY('—¿Qué es San Gregorio, papá? ¿Qué llevaba el señor Quirós en su bicicleta? ¿Qué hacía mamá antes de casarse contigo? ¿Por qué hay un reloj con su firma en una bomba? ¿Por qué me diste la llave? ¿Quién pagó el hospital? ¿Quién pagó la morfina?', '“What is San Gregorio, Dad? What did Señor Quirós carry on his bicycle? What did Mum do before she married you? Why is there a watch with her signature in a bomb? Why did you give me the key? Who paid for the hospital? Who paid for the morphine?”'),
      SAY('Su padre abrió los ojos. Se le habían llenado de lágrimas, pero no le caían. —Tu madre hacía relojes. Con tu abuelo. Para ellos. Cuando era una niña. No sabía para qué eran. Cuando lo supo, lo dejó. Se vino aquí. Se casó conmigo. Y no volvió a hacer ninguno nunca más. Eso es lo que sé. Te lo juro por ella.', 'His father opened his eyes. They had filled with tears, but they didn’t fall. “Your mother made clocks. With your grandfather. For them. When she was a girl. She didn’t know what they were for. When she found out, she stopped. She came here. She married me. And she never made another one. That’s what I know. I swear it on her.”'),
      Step.run((S) => { C(S).mous = true; C(S).mousT = 0; }),
      Step.find([{ pos: (S) => C(S).papa.head.localToWorld(V(0, -0.05, 0.14)), r: 0.08, avail: (S) => C(S).mousOn, text: [{ es: 'Su padre se tocó el bigote. Un gesto pequeño, automático, con el índice de la mano derecha, de lado a lado, como si se lo alisara.', en: 'His father touched his moustache. A small, automatic gesture, with the index finger of his right hand, side to side, as if smoothing it.' }, { es: 'Joaquín, que te estás peinando, le decía su madre en broma, y él se reía y confesaba siempre. Siempre. Esta vez no confesó.', en: 'Joaquín, you’re combing yourself, his mother would say as a joke, and he’d laugh and always confess. Always. This time he didn’t confess.', o: { cls: 'mem' } }] }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: tu padre, mientras habla.', en: 'Hold <kbd>Q</kbd>: your father, as he speaks.' })),
      Step.run((S) => { C(S).mous = false; const a = C(S).papa.arms[0]; a.rotation.set(0, 0, 0); a.userData.f.rotation.x = 0; }),
      SAY('El reloj alemán de las violetas hacía tictac en la pared. Iba medio segundo por detrás. Siempre iba medio segundo por detrás. —Larraín dice que alguien le dijo que sí por mí. Hace mucho tiempo. Papá. ¿Fuiste tú?', 'The German clock with the violets ticked on the wall. It ran half a second behind. It always ran half a second behind. “Larraín says someone told him yes for me. A long time ago. Dad. Was it you?”'),
      Step.run((S) => { const F = C(S); F.papa.g.position.set(170 + 1.85, -0.42, 3.0); F.papa.g.rotation.y = Math.PI / 2; F.papa.arms[0].rotation.x = -1.2; F.papa.arms[1].rotation.x = -1.2; }),
      SAY('Joaquín Fierros cruzó la cocina. Se arrodilló delante de su hijo, en el suelo de baldosas, con sus cincuenta y dos años y su barriga redonda, y le cogió las manos con sus manos mojadas, y se las apretó. —Ve. Por favor, Santiago. Ve. Haz lo que te diga. No le digas que no a ese hombre nunca. Por favor. Por tu madre. Ve.', 'Joaquín Fierros crossed the kitchen. He knelt in front of his son on the tiled floor, with his fifty-two years and his round belly, and took his hands in his wet hands, and squeezed them. “Go. Please, Santiago. Go. Do what he tells you. Never tell that man no. Please. For your mother. Go.”'),
      SAY('—¿Por qué? —Su padre no contestó. Lloraba ya. Las lágrimas se le habían caído por fin del borde. —Ve. Ve.', '“Why?” His father didn’t answer. He was crying now. The tears had finally spilled over the edge. “Go. Go.”'),
      SAY('Y por segunda vez en su vida tuvo la sensación de que su cabeza se quedaba en blanco, de que delante de él había algo tan grande que no le cabía en ningún sitio. No preguntó más.', 'And for the second time in his life he had the feeling that his head went blank, that in front of him was something so big it fitted nowhere. He asked nothing more.', { cls: 'inner' }),
      Step.fade(1, 1.6),
      // ---- el undécimo reloj ----
      go('night', (S) => { const F = C(S); sit(S, 200 + 0.85, 1.55, 1.75, CampUtil.yawTo(200.85, 1.75, 200.8, 0.85), -0.75, 1.6); S.pitchMin = -1.3; }),
      Step.fade(0, 1.6, false),
      SAY('Esa noche, después de que su padre se acostara, dio cuerda a los once relojes. No era sábado. No le tocaba. Lo hizo igual, uno por uno, en el orden de siempre. Cuando llegó al undécimo se encontró a su padre despierto, tumbado boca arriba en la oscuridad, mirando el techo. No se dijeron nada.', 'That night, after his father had gone to bed, he wound the eleven clocks. It wasn’t Saturday. It wasn’t his turn. He did it anyway, one by one, in the usual order. When he reached the eleventh he found his father awake, lying on his back in the dark, staring at the ceiling. They said nothing.'),
      Step.uses([{ id: 'viaje', d: 1.6, r: 0.4, pos: (S) => C(S).tclock.position, label: { es: 'Dar cuerda al reloj de viaje de ella', en: 'Wind her travel clock' }, use(S) { Cap1Audio.wind(14, 1.6); } }], 1, () => L({ es: 'El reloj de viaje de latón, en la mesilla.', en: 'The brass travel clock, on the bedside table.' })),
      Step.find([{ pos: (S) => C(S).glass.position, r: 0.08, text: { es: 'El vaso de agua, junto al reloj, con sus anillos de cal.', en: 'The glass of water, beside the clock, with its rings of lime.' } }], 1, () => L({ es: 'Mantén <kbd>Q</kbd>: el vaso.', en: 'Hold <kbd>Q</kbd>: the glass.' })),
      Step.choice({ es: '¿Cuántos anillos?', en: 'How many rings?' }, [{ es: 'Doce.', en: 'Twelve.' }, { es: 'Trece.', en: 'Thirteen.' }, { es: 'Catorce.', en: 'Fourteen.' }], 2,
        [{ es: 'En octubre eran doce. Cuéntalos otra vez.', en: 'In October there were twelve. Count them again.' }, { es: 'Cuéntalos otra vez.', en: 'Count them again.' }, { es: '', en: '' }]),
      SAY('Habían aparecido dos más. Catorce.', 'Two more had appeared. Fourteen.', { cls: 'inner' }),
      Step.fade(1, 1.6),
      // ---- la buhardilla ----
      Step.card(null, null, { es: 'San Elías · calle Platerías · domingo 25 de febrero de 1940 · 19:40', en: 'San Elías · Calle Platerías · Sunday 25 February 1940 · 19:40' }, 3.0),
      go('attic', (S) => { const F = C(S); sit(S, 230 + 1.0, 1.1, 2.3, CampUtil.yawTo(231, 2.3, 232.2, 0), 0.0, 2.2); }),
      Step.fade(0, 1.4, false),
      SAY('Clara le abrió la puerta de la tienda, cerrada porque era domingo, y lo miró, y no le dijo nada, y le cogió de la mano, y lo subió por la escalera estrecha del fondo, más allá de la puerta de don Mateo, que roncaba, hasta su cuarto bajo el tejado, con una ventana abuhardillada que daba a la azotea de Nochevieja y a la torre de la Estación Central.', 'Clara opened the shop door, closed because it was Sunday, and looked at him, and said nothing, and took his hand, and led him up the narrow back stairs, past the door of Don Mateo, who was snoring, to her room under the roof, with a dormer window looking onto the New Year’s Eve rooftop and the Central Station tower.'),
      SAY('—Lo sé. Lo leí en El Imparcial. El cadete de la estación. Supe que eras tú antes de terminar el titular. Nadie más habría visto eso. —No soy cadete. —Ya lo sé que no eres cadete, tonto.', '“I know. I read it in El Imparcial. The station cadet. I knew it was you before I finished the headline. Nobody else would have seen that.” “I’m not a cadet.” “I know you’re not a cadet, silly.”'),
      SAY('Se lo contó. No todo. No la violeta. No su padre de rodillas. No el armonio ni el olor a cera. Le contó la torre, la escalera, el viejo del escalón treinta y ocho, la caja, el papel de fumar, las once campanadas. Y que lo iban a trasladar. Que un ministerio lo había pedido.', 'He told her. Not everything. Not the violet. Not his father on his knees. Not the harmonium or the smell of wax. He told her about the tower, the stairs, the old man on step thirty-eight, the box, the cigarette paper, the eleven strokes. And that they were going to transfer him. That a ministry had asked for him.'),
      SAY('—Al Ministerio de Culto. Lo pone en tu cara. Cuando dices un ministerio se te tuerce la boca así, a la izquierda. Y el único ministerio que hay al lado de la catedral es el de Culto, y hueles a incienso. —Le pasó el dedo por la frente—. ¿Vas a ser cura?', '“The Ministry of Worship. It’s written on your face. When you say a ministry your mouth twists like this, to the left. And the only ministry beside the cathedral is Worship, and you smell of incense.” She ran a finger across his forehead. “Are you going to be a priest?”'),
      Step.run(() => { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime; for (let i = 0; i < 10; i++) AUDIO.nz(SceneAudio.dest(), t + i * 0.19, 0.12, 0.035, 'bandpass', 500 + (i % 3) * 140, null, 2.5); }),
      SAY('Se echó a reír. Se rió tan fuerte que tuvo que taparse la boca para no despertar a don Mateo, y ella se rió con él, y fue la última vez en mucho tiempo que Santiago se rió así, limpio, sin nada debajo.', 'He burst out laughing. He laughed so hard he had to cover his mouth so as not to wake Don Mateo, and she laughed with him, and it was the last time in a long while that Santiago laughed like that, clean, with nothing underneath.'),
      SAY('—Dime una cosa que sea verdad. Una sola. No me digas adónde vas. No me digas qué vas a hacer. Pero dime una cosa que sea verdad y que no le hayas dicho a nadie.', '“Tell me one thing that’s true. Just one. Don’t tell me where you’re going. Don’t tell me what you’ll do. But tell me one true thing you haven’t told anyone.”'),
      Step.choice({ es: 'Una cosa que sea verdad.', en: 'One true thing.' }, [{ es: '—Que te quiero.', en: '“That I love you.”' }, { es: '—En la bomba había un reloj. Y el reloj lo había hecho mi madre.', en: '“There was a watch in the bomb. And my mother had made it.”' }, { es: '—Que tengo miedo.', en: '“That I’m afraid.”' }], 1,
        [{ es: 'Eso ella ya lo sabía. Había pedido una cosa que no le hubiera dicho a nadie.', en: 'She already knew that. She had asked for something he’d told no one.' }, { es: '', en: '' }, { es: 'Era verdad. Pero no era lo que no le había dicho a nadie.', en: 'It was true. But it wasn’t the thing he had told no one.' }]),
      SAY('Clara no dijo nada. Le puso la mano en la mejilla. —Ella no sabía para qué era. Eso dice mi padre. Y mi padre se ha tocado el bigote al decirlo. —¿Y eso qué significa? —Que miente.', 'Clara said nothing. She put her hand on his cheek. “She didn’t know what it was for. That’s what my father says. And my father touched his moustache when he said it.” “And what does that mean?” “That he’s lying.”'),
      SAY('Ella se inclinó hacia él y lo besó, muy despacio, y Santiago no contó nada esta vez. No contó porque no quiso. Fue una decisión, la última que tomó en mucho tiempo para no contar, y la tomó con los ojos cerrados.', 'She leaned towards him and kissed him, very slowly, and this time Santiago counted nothing. He didn’t count because he chose not to. It was a decision, the last he would make for a long time not to count, and he made it with his eyes closed.'),
      Step.fade(1, 2.2),
      Step.wait(1.5),
      Step.run(() => { [659, 523, 587, 392].forEach((f, i) => CampUtil.bellStrike(f / 2, 0.04, 0.4 + i * 0.9)); }),
      Step.wait(4.4),
      SAY('Desde la torre llegaban los cuartos. Mi-do-re-sol. Sin quinta nota.', 'From the tower came the quarters. E-C-D-G. No fifth note.'),
      go('attic', (S) => { const F = C(S); F.clara.g.visible = false; sit(S, 230 + 1.2, 0.75, 2.2, CampUtil.yawTo(231.2, 2.2, 232.2, 0), 0.35, 2.0); }),
      Step.fade(0, 2.0, false),
      SAY('—¿Cuándo te vas? —preguntó ella al fin, contra su pecho. —El primero de marzo. —Faltan nueve días. —Faltan ocho días y diecinueve horas.', '“When are you leaving?” she asked at last, against his chest. “The first of March.” “That’s nine days.” “Eight days and nineteen hours.”'),
      SAY('—No hagas eso. —No lo hago a propósito. —Ya lo sé. Prométeme una cosa. Que vas a seguir riéndote. Pase lo que pase allí. Que no vas a dejar que te lo quiten.', '“Don’t do that.” “I don’t do it on purpose.” “I know. Promise me something. That you’ll keep laughing. Whatever happens there. That you won’t let them take it from you.”'),
      Step.choice({ es: '¿Se lo prometes?', en: 'Do you promise her?' }, [{ es: '—Te lo prometo.', en: '“I promise.”' }], 0, []),
      SAY('Lo dijo de verdad. Lo creyó de verdad.', 'He meant it. He truly believed it.'),
      Step.run(() => { CampUtil.bellStrike(98, 0.09); CampUtil.bellStrike(98, 0.09, 2.4); }),
      SAY('Fuera, en la torre, la campana grande dio las dos.', 'Outside, in the tower, the great bell struck two.'),
      Step.fade(1, 2.0),
      // ---- 1 de marzo ----
      Step.card(null, null, { es: 'Cuartel de La Recoleta · viernes 1 de marzo de 1940 · 07:10', en: 'La Recoleta Barracks · Friday 1 March 1940 · 07:10' }, 3.2),
      go('gate', (S) => { const F = C(S); sit(S, F.GX + 0.2, 1.62, 1.8, -Math.PI / 2 + 0.3, -0.05, 2.0); F.pkT = 0; }),
      Step.fade(0, 1.2, false),
      { tick(S, dt) { const F = C(S); F.pk.position.x = Math.max(F.GX + 2.2, F.pk.position.x - dt * 7 * Math.max(0.15, (F.pk.position.x - F.GX - 2) / 12)); return F.pk.position.x <= F.GX + 2.25; } },
      SAY('Un Packard negro con las cortinillas de atrás corridas se paró delante de la puerta del Cuartel de La Recoleta. Santiago lo estaba esperando en la acera con su maleta de cartón. Las siete y diez.', 'A black Packard with its rear blinds drawn stopped in front of the gate of La Recoleta Barracks. Santiago was waiting on the pavement with his cardboard suitcase. Ten past seven.'),
      SAY('7:10. 7:10. 7:15. 7:10. P. Sigue viniendo.', '7:10. 7:10. 7:15. 7:10. P. Still coming.', { cls: 'mem' }),
      Step.run((S) => { const F = C(S); F.suit.visible = false; F.pkDoor.rotation.y = -1.2; F.pkDoor.position.x = -1.25; }),
      Step.uses([{ id: 'subir', d: 3.4, r: 0.5, pos: (S) => C(S).pk.localToWorld(V(-0.9, 1.2, 0.9)), label: { es: 'Subir', en: 'Get in' }, use(S) {}, text: { es: 'El chófer bajó, le cogió la maleta sin mirarlo y le abrió la puerta de atrás. Dentro no había nadie. Solo el olor.', en: 'The chauffeur got out, took his suitcase without looking at him and opened the rear door. There was nobody inside. Only the smell.' } }], 1,
        () => L({ es: 'El Packard.', en: 'The Packard.' })),
      SAY('Santiago subió.', 'Santiago got in.'),
      Step.fade(1, 2.0),
    ],
  };
  const m = CAMP_BY_ID['P1-E5']; m.scene = 'cap5'; m.map = 'c5_san_elias';
})();
