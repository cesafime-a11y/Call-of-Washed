// ---- 12k_cap3.js ----
// =====================================================================
// PARTE I · CAPÍTULO 3 · «La mesa de tiro» (P1-M3)
// Cuartel de La Recoleta · San Elías · enero–febrero de 1940
// Tramos: el despacho de Ortúzar y el pasillo (Bermúdez) · el barracón
// de noche (imaginaria) · el campo de tiro de Las Lomas con la Orbea
// (dieciséis balas, ninguna en la silueta) · las duchas · la loma de la
// mesa de tiro (el ejercicio cuatro: carga, alza, deriva, viento de altura,
// tubos gastados) · el cuaderno de taller, la naranja del Mulo, la postal ·
// la segunda carta del coronel · la última noche y la puerta del cuartel.
// Lugares en un mismo mapa, separados en x: despacho 0, campo 40,
// duchas 80, barracón 120 (con el patio y la puerta al sur), loma 200.
// =====================================================================
MAPS.c3_recoleta = {
  name: { es: 'Cuartel de La Recoleta · 1940', en: 'La Recoleta Barracks · 1940' },
  desc: { es: 'El pabellón de mando, el barracón, las duchas, el campo de tiro y la loma de Las Lomas.', en: 'The command block, the barrack room, the showers, the range and the hill at Las Lomas.' },
  campaign: true,
  thumb: ['#9aa4ac', '#7a5a40', '#3a2e24'],
  theme: { skyTop: 0x6a86a8, skyMid: 0xbcc8d0, skyBot: 0xd8d0bc, fog: 0xc4c4b8, fogNear: 90, fogFar: 520, sun: 0xfff0d8, sunI: 0.3, sunDir: [0.4, 0.8, 0.3], hemiTop: 0xdde4ea, hemiBot: 0x6a5a40, hemiI: 0.3, exposure: 1.05, cloud: 0.35, rays: 0, glow: 0, lamps: false, soldFill: 0.5, soldRim: 0.3 },
  build(B) {
    B.bounds(-20, -300, 260, 80);
    B.ground(-20, -300, 260, 80, { y: -30, pattern: PAT.DIRT, color: 0x6a5a44 });
    B.spawn('ffa', 0, 0, 0, 0);
  },
};

const Cap3Set = {
  build(S) {
    const root = new THREE.Group(); MapSys.decor.add(root);
    const K = CampKit(root), { box, grp, cyl, ball, solid, furn, canvasTex, plane, room, win, person, M } = K, V = CampUtil.V;
    const wood = 0x6a4a2c, woodD = 0x3e2a18, lime = 0xe0dccd, khaki = 0x6a6444, olive = 0x55573a, brown = 0x3a2616;
    const lights = {};
    const addL = (k, l) => { root.add(l); if (l.target) root.add(l.target); (lights[k] = lights[k] || []).push([l, l.intensity]); l.intensity = 0; return l; };
    const sun = (k, i, x, y, z, tx, tz, c = 0xfff0d8) => { const l = addL(k, new THREE.DirectionalLight(c, i)); l.position.set(x, y, z); l.target.position.set(tx, 0, tz); return l; };
    // soldado de la quinta del 18 / oficial
    const recruit = (o) => person({ coat: khaki, leg: khaki, boot: 0x241a12, cap: 0x5e5a3c, hair: [0x2a2018, 0x3a2614, 0x14100c][(o.k || 0) % 3], ...o });
    const officer = (o) => { const p = person({ coat: olive, leg: olive, boot: 0x1a120c, hair: 0x3a3530, ...o }); box(o.slim ? 0.42 : 0.48, 0.05, o.slim ? 0.3 : 0.34, brown, 0, 0.12, 0, p.torso); box(0.05, 0.62, 0.02, brown, 0.1, 0.35, 0.17, p.torso, { rz: 0.5 }); return p; };
    const F = { lights, tex: K.tex, col: K.col };
    const fogMat = (c, t) => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: t, depthWrite: false, roughness: 1 });

    // ========== EL DESPACHO DE ORTÚZAR, pabellón de mando (x 0) ==========
    room(-2.6, -2.2, 2.6, 2, 3.2, { wall: lime, floor: 0x5a4834, ceil: 0xe8e4d8, gaps: { s: [[0.5, 1.5]] }, dado: 0.9, dadoC: 0x8a8068 });
    win(2.53, 1.7, -0.6, -Math.PI / 2, 1.0, 1.3);
    const desk = furn(1.7, 0.78, 0.8, walnut(), 0, 0, -0.8);
    function walnut() { return 0x4e3220; }
    box(1.6, 0.02, 0.7, 0x2e3a2e, 0, 0.79, -0.8);                                 // tapete verde
    furn(0.5, 0.95, 0.5, woodD, -0.2, 0, -1.75); box(0.52, 0.06, 0.52, woodD, -0.2, 0.5, -1.75);   // silla
    // la estufa de hierro que no calienta nada
    cyl(0.28, 0.3, 0.9, 0x2a2826, 2.1, 0.45, -1.8, root, { m: 0.5, r: 0.5 }); cyl(0.05, 0.05, 2.3, 0x2a2826, 2.1, 2.05, -1.8); solid(1.8, -2.1, 2.4, -1.5);
    // retrato del Presidente Arriaga
    const portrait = canvasTex(160, 210, (g, w, h) => { g.fillStyle = '#3e3424'; g.fillRect(0, 0, w, h); const gr = g.createRadialGradient(80, 80, 10, 80, 100, 110); gr.addColorStop(0, '#8a7a60'); gr.addColorStop(1, '#2e261a'); g.fillStyle = gr; g.fillRect(8, 8, w - 16, h - 16);
      g.fillStyle = '#c8a888'; g.beginPath(); g.ellipse(80, 80, 30, 38, 0, 0, 7); g.fill(); g.fillStyle = '#d8d4c8'; g.fillRect(48, 54, 64, 8); g.fillStyle = '#2a2420'; g.fillRect(56, 98, 48, 7);
      g.fillStyle = '#20242a'; g.beginPath(); g.moveTo(30, 210); g.lineTo(46, 130); g.lineTo(114, 130); g.lineTo(130, 210); g.fill(); g.fillStyle = '#b8a040'; g.fillRect(60, 140, 40, 4); g.strokeStyle = '#a08040'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6); });
    plane(0.62, 0.82, portrait, 0, 2.15, -2.12);
    // mapa de la sierra de Ocoa clavado con chinchetas
    const ocoa = canvasTex(320, 240, (g, w, h) => { g.fillStyle = '#e4dcc4'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(120,80,40,.55)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.ellipse(170 + Math.sin(i) * 20, 120, 20 + i * 11, 14 + i * 7, 0.4, 0, 7); g.stroke(); }
      g.strokeStyle = '#3a6aa0'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, 200); g.bezierCurveTo(90, 170, 140, 230, 320, 150); g.stroke(); g.fillStyle = '#2a2014'; g.font = 'bold 14px serif'; g.fillText('SIERRA DE OCOA', 92, 28); g.font = '10px serif'; g.fillText('río Ocoa', 210, 176);
      g.fillStyle = '#b02a20'; for (const [x, y] of [[8, 8], [312, 8], [8, 232], [312, 232]]) { g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); } });
    plane(1.3, 0.98, ocoa, -2.53, 1.75, -0.4, Math.PI / 2);
    const ort = officer({ x: 0, z: -1.45, ry: 0, hair: 0x3a3632, h: 1.02 });
    ort.arms[1].rotation.x = -1.1; ort.arms[1].userData.f.rotation.x = -0.6;
    const cuart = canvasTex(160, 220, (g, w, h) => { g.fillStyle = '#efe9d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1e1a14'; g.font = '8px monospace'; ['MINISTERIO DE CULTO', '', 'Al Sr. Capitán Jefe de la', 'Tercera Batería, Reg. Art. Nº 4', '', 'El recluta FIERROS LAZCANO,', 'SANTIAGO, estudiante de', 'Ingeniería Mecánica, deberá', 'ser destinado directamente a', 'la sección de cálculo de tiro,', 'sin período de instrucción', 'básica, facilitándosele todas', 'las condiciones para que sus', 'aptitudes se manifiesten.'].forEach((l, i) => g.fillText(l, 8, 16 + i * 12)); g.strokeStyle = 'rgba(70,50,120,.8)'; g.beginPath(); g.arc(118, 196, 16, 0, 7); g.stroke(); });
    const paper = plane(0.15, 0.21, cuart, 0, -0.33, 0.07, 0, ort.arms[1].userData.f, { ds: true }); paper.rotation.x = -1.0;
    F.ort = ort; F.paper = paper;
    // segunda visita: Ortúzar sentado firmando partes, el sobre en la mesa
    const ortS = officer({ x: 0, z: -1.6, ry: 0, sit: true, hair: 0x3a3632, h: 1.02 }); ortS.g.visible = false; ortS.arms[1].rotation.x = -1.2; ortS.arms[0].rotation.x = -1.0;
    const sobreT = canvasTex(256, 160, (g, w, h) => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1e1a14'; g.font = 'bold 12px serif'; g.fillText('MINISTERIO DE CULTO', 18, 26); g.font = '9px serif'; g.fillText('Gabinete del Coronel Delegado', 18, 42);
      g.font = '11px monospace'; g.fillText('Capitán D. Benigno Ortúzar', 50, 96); g.fillText('Cuartel de La Recoleta', 50, 112); g.strokeStyle = 'rgba(80,40,110,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(214, 40, 24, 0, 7); g.stroke(); g.beginPath(); g.moveTo(214, 22); g.lineTo(214, 58); g.moveTo(200, 34); g.lineTo(228, 34); g.stroke(); g.font = '6px serif'; g.fillStyle = 'rgba(80,40,110,.9)'; g.textAlign = 'center'; g.fillText('CULTO', 214, 72); });
    const sobre = plane(0.26, 0.16, sobreT, 0.2, 0.81, -0.55, 0, root, { rx: -Math.PI / 2 }); sobre.visible = false; sobre.rotation.z = -0.2;
    F.ortS = ortS; F.sobre = sobre;
    // el pasillo y Bermúdez fumando contra la pared
    room(-2.6, 2, 9, 4.4, 3.0, { wall: 0xd4cebc, floor: 0x5a4a38, gaps: { n: [[0.5, 1.5]] }, dado: 1.0, dadoC: 0x7a6e58 });
    for (const x of [4, 7.5]) win(x, 1.7, 4.33, Math.PI, 1.0, 1.2);
    const berm = recruit({ x: 2.6, z: 4.0, ry: Math.PI, slim: true, h: 0.93, coat: olive, leg: olive, mous: 0x1a1410, cap: 0x4e4a32 });
    berm.arms[1].rotation.x = -1.6; berm.arms[1].userData.f.rotation.x = -1.4; berm.torso.rotation.x = -0.08;
    const cig = box(0.012, 0.012, 0.07, 0xeeeeee, 0, -0.35, 0.03, berm.arms[1].userData.f); const ember = ball(0.008, 0xff6020, 0, -0.35, 0.07, berm.arms[1].userData.f, { e: 0xff5010, ei: 2 });
    F.berm = berm; F.cig = cig;
    addL('office', new THREE.HemisphereLight(0xf0ece0, 0x50483a, 0.9)).position.set(0, 3, 0);
    sun('office', 1.1, 9, 5, -1, 0, -1, 0xf4ecdc);
    const ol = addL('office', new THREE.PointLight(0xffe8c0, 0.7, 9)); ol.position.set(3, 2.6, 3.2);

    // ========== EL CAMPO DE TIRO DE LAS LOMAS (x 40) ==========
    const TX = 40, SLOPE = Math.tan(0.6);
    box(60, 1, 70, 0x8a4a2c, TX, -0.5, 10);                                       // tierra roja
    { const L = 40, th = 0.6, b = box(60, 1, L, 0x9a5434, TX, 0, 0); b.rotation.x = th; b.position.set(TX, Math.sin(th) * L / 2 - 0.4, -22 - Math.cos(th) * L / 2); }
    for (const s of [-1, 1]) { const b = box(10, 8, 60, 0x8a4a2c, TX + s * 24, 2, -10); b.rotation.z = s * 0.4; }
    // parapeto de sacos
    for (let i = 0; i < 22; i++) for (let j = 0; j < 2; j++) { const b = box(0.55, 0.28, 0.36, 0xa89870, TX - 6 + i * 0.57 + j * 0.28, 0.14 + j * 0.28, -0.75); b.rotation.y = (i * 13 % 7 - 3) * 0.02; }
    solid(TX - 6.3, -1, TX + 6.3, -0.5, -1, 0.6);
    // siluetas de madera clavadas en la ladera
    const silT = canvasTex(96, 160, (g, w, h) => { g.fillStyle = '#a8926a'; g.beginPath(); g.arc(48, 30, 22, 0, 7); g.fill(); g.fillRect(12, 50, 72, 110); g.strokeStyle = '#5a4a30'; g.lineWidth = 3; for (let r = 1; r < 4; r++) { g.beginPath(); g.ellipse(48, 100, r * 12, r * 16, 0, 0, 7); g.stroke(); } g.fillStyle = 'rgba(60,40,20,.35)'; for (let i = 0; i < 6; i++) g.fillRect(0, i * 27, w, 2); });
    const sils = [];
    for (let i = 0; i < 6; i++) { const x = TX - 6.25 + i * 2.5, z = -25, y = 3 * SLOPE; box(0.08, 0.7, 0.08, woodD, x, y + 0.35, z); const p = plane(0.6, 1.0, silT, x, y + 1.15, z + 0.05, 0, root, { tr: true }); p.material.alphaTest = 0.5; sils.push({ x, y, z, p }); }
    F.sils = sils; F.TX = TX; F.SLOPE = SLOPE;
    for (let i = 0; i < 16; i++) ball(0.25 + (i % 3) * 0.12, 0x7a6250, TX - 7 + i * 0.9, 0.1, -10 - (i * 7 % 5), root, { seg: 6 });
    const recruits = [];
    for (const dx of [-5, -2.5, 2.5, 5]) { const r = recruit({ x: TX + dx, z: 0, ry: Math.PI, k: recruits.length }); r.arms[1].rotation.x = -1.5; recruits.push(r); }
    for (let i = 0; i < 9; i++) { const r = recruit({ x: TX - 4 + i * 1.0, z: 4.5 + (i % 2) * 0.6, ry: Math.PI, k: i }); r.g.userData.wait = 1; recruits.push(r); }
    F.recruits = recruits;
    const bermF = recruit({ x: TX + 1.3, z: 1.0, ry: -2.6, slim: true, h: 0.93, coat: olive, leg: olive, mous: 0x1a1410, cap: 0x4e4a32 }); F.bermF = bermF;
    // la Orbea en la mano de Santiago
    const pistol = grp(0, 0, 0); pistol.visible = false;
    { const gm = M(0x1e1e22, { m: 0.7, r: 0.35 }), sk = 0xc49a7c;
      box(0.032, 0.036, 0.2, 0, 0, 0, -0.06, pistol, { mat: gm }); cyl(0.011, 0.011, 0.05, 0, 0, -0.004, -0.18, pistol, { mat: gm, rx: Math.PI / 2 });
      const grip = box(0.03, 0.12, 0.05, 0x2a1e16, 0, -0.07, 0.02, pistol); grip.rotation.x = 0.22;
      box(0.008, 0.03, 0.05, 0, 0, -0.03, -0.03, pistol, { mat: gm }); box(0.006, 0.01, 0.012, 0, 0, 0.022, -0.15, pistol, { mat: gm }); box(0.02, 0.008, 0.01, 0, 0, 0.022, 0.03, pistol, { mat: gm });
      const hand = box(0.07, 0.09, 0.09, sk, 0.006, -0.065, 0.03, pistol); hand.rotation.x = 0.22; box(0.075, 0.09, 0.2, khaki, 0.01, -0.1, 0.17, pistol);
      const fl = ball(0.035, 0xffd890, 0, 0, -0.23, pistol, { e: 0xffc060, ei: 3 }); fl.visible = false; pistol.userData.flash = fl; }
    F.pistol = pistol;
    const mflash = addL('fieldx', new THREE.PointLight(0xffd090, 0, 6)); F.mflash = mflash;
    // polvo de los impactos
    F.dust = []; for (let i = 0; i < 6; i++) { const d = ball(0.4, 0xa05a38, 0, -50, 0, root, { mat: fogMat(0xa05a38, 0.8), seg: 8 }); d.userData.t = 9; F.dust.push(d); }
    addL('field', new THREE.HemisphereLight(0xe8eef4, 0x7a4a30, 0.85)).position.set(TX, 10, 0);
    sun('field', 1.5, TX + 20, 30, 18, TX, -10);

    // ========== LAS DUCHAS DEL PABELLÓN TRES (x 80) ==========
    const DX = 80;
    room(DX, 0, DX + 8, 5, 2.8, { wall: 0xc4c8c0, floor: 0x7a8078, ceil: 0xb8bab0, gaps: { s: [[DX + 6.4, DX + 7.4]] } });
    const tileT = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#c8ccc2'; g.fillRect(0, 0, w, h); g.strokeStyle = '#9a9e94'; g.lineWidth = 2; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 16, 0); g.lineTo(i * 16, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 16); g.lineTo(w, i * 16); g.stroke(); } });
    tileT.wrapS = tileT.wrapT = THREE.RepeatWrapping; tileT.repeat.set(6, 2);
    plane(7.9, 2.0, tileT, DX + 4, 1.0, 0.08);
    for (let i = 0; i < 5; i++) { const x = DX + 1 + i * 1.5; cyl(0.015, 0.015, 0.5, 0x8a8a84, x, 2.4, 0.2, root, { m: 0.6 }); cyl(0.07, 0.05, 0.05, 0x8a8a84, x, 2.15, 0.35, root, { m: 0.6 }); }
    cyl(0.09, 0.09, 0.01, 0x2a2a28, DX + 4, 0.006, 2.5, root, { m: 0.5 });
    const fishT = canvasTex(128, 64, (g, w, h) => { g.fillStyle = 'rgba(70,100,60,.75)'; g.beginPath(); g.ellipse(56, 32, 40, 16, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(92, 32); g.lineTo(122, 12); g.lineTo(118, 54); g.fill(); g.fillStyle = 'rgba(40,60,36,.8)'; g.beginPath(); g.arc(30, 28, 3, 0, 7); g.fill(); });
    const fish = plane(0.9, 0.45, fishT, DX + 4.1, 2.79, 2.4, 0, root, { tr: true, rx: Math.PI / 2 }); F.fish = fish;
    const streaks = []; for (let i = 0; i < 26; i++) { const s = box(0.01, 0.4, 0.01, 0xd8e8f0, DX + 3.7 + Math.random() * 0.8, 1.5, 0.4 + Math.random() * 0.4, root, { t: 0.5 }); s.userData.v = 4 + Math.random() * 2; streaks.push(s); }
    F.streaks = streaks;
    const twin1 = recruit({ x: DX + 3.5, z: 3.5, ry: Math.PI - 0.3, cap: undefined, bareArms: true, shirt: 0xd8d4c8, coat: undefined, k: 0 });
    const twin2 = recruit({ x: DX + 4.9, z: 3.7, ry: Math.PI + 0.3, cap: undefined, bareArms: true, shirt: 0xd8d4c8, coat: undefined, k: 0 });
    const cif = recruit({ x: DX + 5.3, z: 2.3, ry: -Math.PI / 2 - 0.4, cap: undefined, slim: true, k: 1 });
    const mulo = recruit({ x: DX + 6.9, z: 4.75, ry: 0.15, cap: undefined, h: 1.12, k: 2 });
    F.twins = [twin1, twin2]; F.cif = cif; F.mulo = mulo;
    addL('shower', new THREE.HemisphereLight(0xd8e0e0, 0x5a6058, 1.15)).position.set(DX + 4, 3, 2.5);
    const shl = addL('shower', new THREE.PointLight(0xe8ecdc, 2.2, 14)); shl.position.set(DX + 4, 2.6, 2.5);

    // ========== EL BARRACÓN (x 120), el patio y la puerta del cuartel ==========
    const BX = 120;
    room(BX, 0, BX + 30, 7, 3.4, { wall: 0xcfc6ae, floor: 0x5a4834, ceil: 0xd8d0bc, gaps: { s: [[BX + 14.4, BX + 15.6]] }, door: 2.3 });
    const wins = []; for (let i = 0; i < 6; i++) wins.push(win(BX + 2.5 + i * 5, 2.0, 0.07, 0, 0.9, 1.1, { glow: 0xb8c4cc, ei: 0.6 }));
    F.wins = wins;
    const cots = [];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 20; i++) {
      const x = BX + 1.0 + i * 1.47, z = r ? 6.0 : 1.0;
      if (r === 1 && i >= 9 && i <= 10) continue;             // la puerta
      box(0.8, 0.06, 1.9, 0x3a3a38, x, 0.42, z, root, { m: 0.4 }); for (const sx of [-0.38, 0.38]) for (const sz of [-0.9, 0.9]) box(0.03, 0.42, 0.03, 0x2a2a28, x + sx, 0.21, z + sz);
      box(0.78, 0.08, 1.85, 0x5a5440, x, 0.49, z); box(0.5, 0.08, 0.3, 0xd8d4c8, x, 0.56, r ? z + 0.75 : z - 0.75);
      solid(x - 0.42, z - 0.95, x + 0.42, z + 0.95, 0, 0.6);
      cots.push({ x, z, r, i });
    }
    F.cots = cots; F.BX = BX;
    // el catre de Santiago: fila norte, el décimo
    const my = cots[9]; F.my = my;
    const sleepers = [];
    for (const c of cots) { if (c === my) continue; const g = grp(c.x, 0.55, c.z); box(0.55, 0.22, 1.35, 0x6a624a, 0, 0.08, c.r ? -0.2 : 0.2, g); box(0.2, 0.18, 0.22, 0xb89a7c, 0, 0.1, c.r ? 0.68 : -0.68, g); sleepers.push(g); }
    F.sleepers = sleepers;
    box(0.5, 0.6, 0.4, woodD, BX + 0.5, 0.3, 3.5);
    const bulb = ball(0.05, 0xfff0c0, BX + 15, 3.0, 3.5, root, { e: 0xffe0a0, ei: 2 }); cyl(0.004, 0.004, 0.35, 0x111111, BX + 15, 3.2, 3.5); F.bulb = bulb;
    // cosas en el catre de Santiago
    const nbT = canvasTex(256, 360, () => {}); F.nbT = nbT; F.nbLines = 0;
    const nb = plane(0.22, 0.3, nbT, my.x - 0.15, 0.56, my.z + 0.35, 0, root, { rx: -Math.PI / 2 }); nb.rotation.z = 0.1; F.nb = nb;
    const orange = ball(0.045, 0xe07a18, my.x + 0.2, 0.585, my.z + 0.55, root, { r: 0.6 }); orange.visible = false; F.orange = orange;
    const postT = canvasTex(320, 210, (g, w, h) => { g.fillStyle = '#ece4cc'; g.fillRect(0, 0, w, h); g.strokeStyle = '#7a6a50'; g.beginPath(); g.moveTo(170, 10); g.lineTo(170, 200); g.stroke(); g.fillStyle = '#2a3a6a'; g.font = 'italic 12px serif';
      ['El sábado 17 voy a la capital.', 'Tengo que hacer unas gestiones', 'en la Compañía. Ya he hablado', 'con tu capitán y te dan pase', 'de día. Te espero en la Estación', 'Central, en el vestíbulo, debajo', 'del reloj grande, a las diez y', 'media. No llegues tarde.', '        Te quiere, papá.'].forEach((l, i) => g.fillText(l, 8, 26 + i * 19));
      g.fillStyle = '#1a1a1a'; g.font = '10px monospace'; g.fillText('Recluta S. Fierros', 186, 110); g.fillText('3ª Batería · Reg. Art. 4', 186, 128); g.fillText('La Recoleta · SAN ELÍAS', 186, 146);
      g.strokeStyle = 'rgba(90,50,140,.85)'; g.beginPath(); g.arc(270, 46, 24, 0, 7); g.stroke(); g.fillStyle = 'rgba(90,50,140,.9)'; g.font = 'bold 8px monospace'; g.textAlign = 'center'; g.fillText('14 FEB 1940', 270, 49); g.font = '6px monospace'; g.fillText('CORCOVADO', 270, 32); });
    const post = plane(0.16, 0.105, postT, my.x + 0.12, 0.565, my.z + 0.1, 0, root, { rx: -Math.PI / 2 }); post.visible = false; post.rotation.z = -0.3; F.post = post;
    // el patio de tierra apisonada, los pabellones de ladrillo y la puerta principal
    box(60, 0.1, 40, 0x8a7a60, BX + 15, -0.05, 27);
    for (const [x, z, w, d] of [[BX - 8, 20, 10, 26], [BX + 38, 20, 10, 26], [BX + 2, 36, 12, 6], [BX + 28, 36, 12, 6]]) { box(w, 7, d, 0x8a4232, x, 3.5, z); solid(x - w / 2, z - d / 2, x + w / 2, z + d / 2); }
    for (const s of [-1, 1]) { box(1.0, 4.4, 1.0, 0x7a3a2a, BX + 15 + s * 2.6, 2.2, 40); solid(BX + 15 + s * 2.6 - 0.5, 39.5, BX + 15 + s * 2.6 + 0.5, 40.5); }
    box(6.2, 0.8, 1.0, 0x7a3a2a, BX + 15, 4.6, 40);
    const gateT = canvasTex(400, 50, (g, w, h) => { g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2014'; g.font = 'bold 24px serif'; g.textAlign = 'center'; g.fillText('CUARTEL DE LA RECOLETA', w / 2, 34); });
    plane(4.4, 0.55, gateT, BX + 15, 4.6, 39.48, Math.PI);
    const garita = grp(BX + 19.5, 0, 38.6); box(1.1, 2.4, 1.1, 0x5a5a3a, 0, 1.2, 0, garita); box(1.3, 0.12, 1.3, 0x3a3a26, 0, 2.46, 0, garita);
    recruit({ x: BX + 18.6, z: 38.9, ry: Math.PI, k: 1 });
    for (const sx of [-1, 1]) solid(BX - 3, 7, BX - 2, 45), solid(BX + 32, 7, BX + 33, 45);
    solid(BX - 3, 44, BX + 33, 45);
    box(70, 0.1, 30, 0x5a5650, BX + 15, -0.06, 58);
    F.gateZ = 40;
    addL('night', new THREE.HemisphereLight(0x4a5a7a, 0x141210, 0.25)).position.set(BX + 15, 3, 3);
    const moon = addL('night', new THREE.DirectionalLight(0x8aa0c8, 0.35)); moon.position.set(BX + 10, 8, -10); moon.target.position.set(BX + 15, 0, 4);
    addL('evening', new THREE.HemisphereLight(0xe8dcc0, 0x302820, 0.4)).position.set(BX + 15, 3, 3);
    const bl = addL('evening', new THREE.PointLight(0xffd8a0, 1.6, 16)); bl.position.set(BX + 15, 2.9, 3.5);
    const bl2 = addL('evening', new THREE.PointLight(0xffd8a0, 0.6, 5)); bl2.position.set(my.x, 1.5, my.z + 0.4);
    addL('yard', new THREE.HemisphereLight(0xeef2f6, 0x6a5a44, 0.9)).position.set(BX + 15, 10, 20);
    sun('yard', 1.4, BX + 30, 30, 50, BX + 15, 20, 0xfff4e4);

    // ========== LA LOMA DE LA MESA DE TIRO, Las Lomas (x 200) ==========
    const MX = 200;
    const grass = 0x7e7448, grassD = 0x6a6240;
    box(60, 1, 30, grass, MX, -0.5, 6);
    const slab = (y0, z0, y1, z1, c, w = 160) => { const L = Math.hypot(z1 - z0, y1 - y0), b = box(w, 1, L + 0.6, c, MX, 0, 0); b.rotation.x = Math.atan2(y1 - y0, z0 - z1); b.position.set(MX, (y0 + y1) / 2 - 0.5, (z0 + z1) / 2); return b; };
    slab(0, -9, -22, -45, grassD); slab(-22, -45, -22, -95, grass); slab(-22, -95, 8, -135, grassD, 220); slab(8, -135, 6, -280, grass, 260);
    for (const s of [-1, 1]) { const b = box(30, 30, 160, grassD, MX + s * 70, -18, -60); b.rotation.z = s * 0.3; }
    // la tienda de lona
    const canvasC = 0xb0a47e;
    box(5.0, 0.06, 4.4, canvasC, MX, 2.55, 1.6, root, { rx: 0.05 }); box(5.0, 2.5, 0.06, canvasC, MX, 1.25, 3.8); for (const s of [-1, 1]) { box(0.06, 2.5, 4.4, canvasC, MX + s * 2.5, 1.25, 1.6); solid(MX + s * 2.5 - 0.05, -0.6, MX + s * 2.5 + 0.05, 3.8); }
    solid(MX - 2.5, 3.75, MX + 2.5, 3.85);
    for (const s of [-1, 1]) cyl(0.04, 0.04, 2.6, woodD, MX + s * 2.4, 1.3, -0.55);
    // mesa plegable con el mapa, la tabla de tiro, reglas, el teléfono de campaña
    furn(1.8, 0.78, 1.0, 0x6a5a40, MX, 0, 1.2);
    const mapT = canvasTex(400, 260, (g, w, h) => { g.fillStyle = '#e8e0c8'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(60,90,150,.35)'; g.lineWidth = 1; for (let i = 0; i <= 10; i++) { g.beginPath(); g.moveTo(i * 40, 0); g.lineTo(i * 40, h); g.stroke(); g.beginPath(); g.moveTo(0, i * 26); g.lineTo(w, i * 26); g.stroke(); }
      g.strokeStyle = 'rgba(130,90,50,.6)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(200, 120, 30 + i * 18, 16 + i * 9, 0.1, 0, 7); g.stroke(); }
      g.fillStyle = '#1e1a14'; g.font = 'bold 11px monospace'; g.fillText('LAS LOMAS · hoja 3', 8, 14); g.fillStyle = '#1a4a1a'; g.fillRect(186, 232, 28, 10); g.fillText('3ª BAT.', 180, 256);
      g.strokeStyle = '#9a1a14'; g.lineWidth = 2; g.beginPath(); g.moveTo(200, 232); g.lineTo(172, 28); g.stroke(); g.beginPath(); g.arc(172, 24, 8, 0, 7); g.stroke(); g.fillStyle = '#9a1a14'; g.fillText('BLANCO 47-12', 186, 22); g.fillText('3.000 m', 196, 130); g.fillText('deriva por plano: 41 izq.', 210, 150); });
    const mapP = plane(1.1, 0.72, mapT, MX - 0.25, 0.795, 1.2, 0, root, { rx: -Math.PI / 2 }); F.mapP = mapP;
    const tabT = canvasTex(240, 300, (g, w, h) => { g.fillStyle = '#f0ead8'; g.fillRect(0, 0, w, h); g.fillStyle = '#1e1a14'; g.font = 'bold 11px monospace'; g.fillText('TABLA DE TIRO · OSTRANDER 75', 8, 16); g.font = '10px monospace';
      const rows = [['', 'CARGA 2', 'CARGA 3', 'CARGA 4'], ['2.600', '402', '268', '214'], ['2.700', '431', '281', '222'], ['2.800', '— máx', '296', '230'], ['2.900', '—', '304', '236'], ['3.000', '—', '312', '241'], ['3.100', '—', '321', '247']];
      rows.forEach((r, i) => r.forEach((c, j) => g.fillText(c, 8 + j * 58, 46 + i * 22)));
      g.fillText('alza en milésimas', 8, 214); g.fillText('carga 4: tiro tenso, rasante', 8, 238); g.fillText('(no salva crestas a < 2 km)', 8, 254); g.strokeStyle = '#1e1a14'; g.strokeRect(4, 30, 232, 150); });
    const tab = plane(0.36, 0.45, tabT, MX + 0.6, 0.796, 1.05, 0, root, { rx: -Math.PI / 2 }); tab.rotation.z = -0.12; F.tab = tab;
    for (const [x, z] of [[MX + 0.2, 1.5], [MX - 0.6, 0.9], [MX + 0.15, 0.9]]) box(0.3, 0.01, 0.035, 0xd8c8a0, x, 0.8, z, root, { ry: 0.3 });
    const phone = grp(MX - 0.75, 0.78, 1.55); box(0.22, 0.14, 0.16, 0x3a3a2a, 0, 0.07, 0, phone); box(0.05, 0.04, 0.2, 0x111111, 0, 0.17, 0, phone); box(0.02, 0.1, 0.02, 0x6a6a5a, 0.13, 0.08, 0, phone); F.phone = phone;
    const theo = grp(MX + 1.8, 0, -0.3); for (let i = 0; i < 3; i++) { const l = box(0.03, 1.35, 0.03, woodD, Math.sin(i * 2.1) * 0.22, 0.65, Math.cos(i * 2.1) * 0.22, theo); l.rotation.x = Math.cos(i * 2.1) * 0.17; l.rotation.z = -Math.sin(i * 2.1) * 0.17; } cyl(0.05, 0.05, 0.2, 0xb8913f, 0, 1.42, 0, theo, { m: 0.7, rx: Math.PI / 2 });
    const gav = officer({ x: MX - 1.3, z: 1.0, ry: Math.PI / 2 - 0.2, slim: true, hair: 0x2a2018, cap: 0x4a4c32 });
    const lt2 = officer({ x: MX - 0.5, z: 0.25, ry: 0.2, slim: true, hair: 0x14100c, cap: 0x4a4c32 }); lt2.arms[0].rotation.x = -0.9;
    const lt3 = officer({ x: MX + 0.6, z: 0.25, ry: -0.3, slim: true, hair: 0x3a2614, cap: 0x4a4c32, glasses: true }); lt3.arms[1].rotation.x = -0.9;
    const andr = recruit({ x: MX + 1.35, z: 2.3, ry: -Math.PI / 2 - 0.5, hair: 0xa8a49c, mous: 0xa8a49c, cap: 0x4e4a32, belly: true, coat: olive, leg: olive, k: 1 });
    andr.arms[0].rotation.x = -1.2; andr.arms[0].userData.f.rotation.x = -0.8;
    const glassEye = ball(0.014, 0xe8f0f4, -0.05, 0.03, 0.125, andr.head, { r: 0.1, m: 0.2 });
    const ortM = officer({ x: MX - 1.4, z: -0.6, ry: 0.5, hair: 0x3a3632, cap: 0x4a4c32, h: 1.02 });
    F.gav = gav; F.andr = andr; F.glassEye = glassEye; F.ortM = ortM; F.lts = [gav, lt2, lt3];
    // la manga de viento
    cyl(0.04, 0.05, 5, 0x8a8a80, MX + 6, 2.5, -4);
    const sock = grp(MX + 6, 4.8, -4); const sk = cyl(0.22, 0.1, 1.3, 0xd86a2a, 0, 0, -0.65, sock, { rx: Math.PI / 2, seg: 10 }); for (const zz of [-0.4, -0.9]) cyl(0.2 - (-zz) * 0.1, 0.19 - (-zz) * 0.1, 0.12, 0xe8e0d0, 0, 0, zz, sock, { rx: Math.PI / 2, seg: 10 }); F.sock = sock;
    // las cuatro piezas abajo, en la vaguada
    const guns = [];
    for (let i = 0; i < 4; i++) {
      const g = grp(MX - 15 + i * 10, -22, -62); const gm = M(0x4e5038, { m: 0.4, r: 0.6 });
      for (const s of [-1, 1]) { cyl(0.6, 0.6, 0.12, 0, s * 0.85, 0.6, 0, g, { mat: M(0x3a2e20), rz: Math.PI / 2, seg: 16 }); }
      box(1.9, 0.12, 0.12, 0, 0, 0.6, 0, g, { mat: gm }); box(1.6, 1.1, 0.06, 0, 0, 1.0, -0.2, g, { mat: gm });
      const tube = grp(0, 1.0, 0, g); tube.rotation.x = 0.34; cyl(0.06, 0.075, 2.4, 0, 0, 0, -1.1, tube, { mat: gm, rx: Math.PI / 2 }); box(0.3, 0.28, 0.9, 0, 0, -0.05, 0.4, tube, { mat: gm });
      const worn = i === 1 || i === 3;
      const muzzle = cyl(0.08, 0.08, 0.18, worn ? 0x0e0e0c : 0x3a3a2e, 0, 0, -2.25, tube, { rx: Math.PI / 2 });
      if (worn) { const sm = box(0.9, 0.5, 0.02, 0x141412, 0, 1.35, -0.24, g); sm.material = M(0x141412, { t: 0.7 }); }
      box(0.16, 0.12, 2.6, 0, 0, 0.3, 1.5, g, { mat: gm, rx: -0.15 });
      const fl = ball(0.6, 0xffd060, 0, 0, -2.6, tube, { e: 0xffb040, ei: 4 }); fl.visible = false;
      for (let c = 0; c < 4; c++) recruit({ x: MX - 15 + i * 10 + (c - 1.5) * 0.9, y: -22, z: -60.2 + (c % 2) * 0.7, ry: Math.PI, k: c });
      guns.push({ g, tube, fl, muzzle, worn });
    }
    F.guns = guns;
    // la cocina del campamento y su humo, que arriba se tuerce hacia el oeste
    const kitchen = grp(MX + 26, -22, -72); box(3, 2.2, 3, 0x8a7a5a, 0, 1.1, 0, kitchen); cyl(0.15, 0.15, 1.6, 0x2a2826, 0.6, 2.9, 0.3, kitchen);
    const smoke = []; for (let i = 0; i < 28; i++) { const p = ball(1, 0xbcb8b0, 0, 0, 0, root, { mat: fogMat(0xbcb8b0, 0.4), seg: 8 }); p.userData.u = i / 28; smoke.push(p); } F.smoke = smoke; F.smokeO = V(MX + 26.6, -18.5, -71.7);
    // el humo de la granada, detrás de la loma (invisible hasta que cae)
    const col = []; for (let i = 0; i < 14; i++) { const p = ball(2.4, 0x2a2622, 0, -60, 0, root, { mat: fogMat(0x2a2622, 0.85), seg: 8 }); p.userData.k = i; col.push(p); } F.column = col; F.colT = -1; F.colP = V(MX + 6, 6, -250);
    F.gunSmoke = []; for (let i = 0; i < 8; i++) { const p = ball(1, 0xd8d0c0, 0, -60, 0, root, { mat: fogMat(0xd8d0c0, 0.6), seg: 8 }); p.userData.t = 9; F.gunSmoke.push(p); }
    addL('mesa', new THREE.HemisphereLight(0xe4ecf4, 0x6a6040, 0.9)).position.set(MX, 10, 0);
    sun('mesa', 1.5, MX + 30, 40, 30, MX, -40);
    const tl = addL('mesa', new THREE.PointLight(0xfff0d8, 0.6, 6)); tl.position.set(MX, 2.2, 1.6);
    F.MX = MX; F.DX = DX;
    // destello en pantalla (bofetón) y la luz de la pieza
    const flashEl = document.createElement('div'); flashEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:#7a1a10;opacity:0;transition:opacity .5s ease-out';
    if (Scenes.el.root) Scenes.el.root.prepend(flashEl); F.flashEl = flashEl;
    S.set = F;
    return F;
  },
  light(S, where) { const F = S.set; for (const k in F.lights) for (const [l, v] of F.lights[k]) l.intensity = k === where ? v : 0; F.where = where; },
  redFlash(S) { const e = S.set.flashEl; e.style.transition = 'none'; e.style.opacity = 0.55; void e.offsetWidth; e.style.transition = 'opacity .9s ease-out'; e.style.opacity = 0; },
  // notas del cuaderno de taller, una a una
  notebook(S, n) {
    const F = S.set, cv = F.nbT.image, g = cv.getContext('2d'), w = cv.width, h = cv.height;
    g.fillStyle = '#ece6d2'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(80,110,160,.25)'; for (let i = 0; i < 18; i++) { g.beginPath(); g.moveTo(0, 40 + i * 18); g.lineTo(w, 40 + i * 18); g.stroke(); }
    g.fillStyle = '#1a1a2a'; g.font = 'italic bold 15px serif'; g.fillText('Cuaderno de taller', 16, 26); g.font = 'italic 11px serif';
    const L1 = ['8-I-1940', 'Ostrander 75, c.3: 3.000 m → 312', 'viento de altura ≠ viento de suelo', 'tubos 2 y 4: +4 milésimas', 'sombra de la loma: 41 min', 'humo de disparo: 9 s seco, 14 húmedo', 'Bermúdez, cigarro: 11 s,', '   siempre con la izquierda,', '   la cerilla hacia dentro', 'centinela puerta norte: 4:10,', '   detrás de la garita, 6 min', 'Mulo: una naranja. ¿Por qué?'];
    L1.slice(0, n).forEach((l, i) => g.fillText(l, 16, 54 + i * 18));
    F.nbT.needsUpdate = true; F.nbLines = n;
  },
  shoot(S) {
    const F = S.set; if (F.cool > 0 || F.shots >= 16 || F.reload > 0 || S.line) return;
    F.shots++; F.cool = 0.5; F.kick = 1;
    AUDIO.play('pistol', null, 0.9);
    F.pistol.userData.flash.visible = true; F.mflash.intensity = 2.2; F.flashT = 0.05;
    // el disparo sale de donde mira… más el tirón de la mano, que siempre se adelanta
    const n = F.shots, e = S.eye, d = dirFromYawPitch(S.yaw + (Math.random() - 0.5) * 0.05, S.pitch + (n === 1 ? 0.075 : 0.03 + Math.random() * 0.07) * (n % 5 === 3 ? -0.7 : 1), new THREE.Vector3());
    let p = null; const t = F.SLOPE, zs = -22;
    const sS = -((e.y) + t * (e.z) - t * zs) / (d.y + t * d.z);   // plano de la ladera: y = (zs − z)·tan
    if (sS > 0) { const q = e.clone().addScaledVector(d, sS); if (q.z < zs) p = q; }
    if (!p && d.y < 0) { const s = -e.y / d.y; p = e.clone().addScaledVector(d, s); }
    if (!p) p = e.clone().addScaledVector(d, 40);
    // ninguna en la silueta: la mano no obedece
    for (const sl of F.sils) if (Math.abs(p.x - sl.x) < 0.34 && p.y > sl.y + 0.55 && p.y < sl.y + 1.75) { p.y = sl.y + 1.75 + 0.5 + Math.random() * 1.4; p.z = sl.z - (p.y - sl.y) / t + 0; }
    if (n === 7) { const sl = F.sils[2]; p.set(sl.x + 0.02, sl.y + 0.3, sl.z + 0.05); F.hitPost = true; }
    if (n === 11) { p.set(e.x + 0.6, 0.15, -10.5); AUDIO.play('whistle', null, 0.9); F.duck = 1.8; }
    const dd = F.dust[n % F.dust.length]; dd.position.copy(p); dd.userData.t = 0; dd.scale.setScalar(0.1);
    // el retroceso le sube el brazo por encima de la cabeza
    Input.state.pitch = Math.min(S.pitchMax, Input.state.pitch + 0.32 + Math.random() * 0.14); Input.state.yaw += (Math.random() - 0.5) * 0.16;
    if (n === 8) { F.reload = 2.4; }
    const lines = {
      1: ['—¡Recomendado! ¡Al cielo no, Recomendado, que allí está tu coronel!', '“Recommended! Not at the sky, Recommended, that’s where your colonel is!”'],
      3: ['La silueta estaba ahí. La veía perfectamente. Sabía la distancia, veinticinco metros. Sabía el viento, poco y del sur. Y la bala no iba.', 'The silhouette was there. He could see it perfectly. He knew the distance, twenty-five metres. He knew the wind, light and from the south. And the bullet would not go.', 'inner'],
      7: ['Una le dio al poste.', 'One hit the post.'],
      11: ['La bala rebotó en una piedra y pasó silbando sobre los parapetos, y todo el mundo se agachó.', 'The bullet ricocheted off a stone and whistled over the parapets, and everyone ducked.'],
      13: ['Era como si entre su cabeza y su mano hubiera un mecanismo roto, una rueda con los dientes mellados que no engranaba. La cabeza calculaba y la mano no obedecía.', 'It was as if between his head and his hand there were a broken mechanism, a wheel with chipped teeth that would not mesh. The head calculated and the hand did not obey.', 'inner'],
    };
    const ln = lines[n]; if (ln) S._q.push({ text: { es: ln[0], en: ln[1] }, o: ln[2] ? { cls: ln[2] } : undefined });
  },
  update(S, dt) {
    const F = S.set; if (!F) return;
    CampUtil.globals(0, F.where === 'night' ? 0.02 : 0.1);
    const w = F.where, t = S.t;
    if (w === 'office' && F.cig.visible) { const ph = t % 7; F.berm.arms[1].rotation.x = ph < 1.2 ? -2.3 : -1.6; }
    // la Orbea delante del ojo
    if (F.pistol.visible) {
      const P = F.pistol; F.kick = Math.max(0, F.kick - dt * 4); F.cool -= dt;
      if (F.flashT != null) { F.flashT -= dt; if (F.flashT < 0) { P.userData.flash.visible = false; F.mflash.intensity = 0; F.flashT = null; } }
      if (F.reload > 0) { F.reload -= dt; if (F.reload <= 0 && !F.relDone) { F.relDone = true; if (SceneAudio.ok()) { const c = AUDIO.ctx.currentTime; AUDIO.nz(SceneAudio.dest(), c, 0.05, 0.08, 'bandpass', 1800, null, 3); AUDIO.nz(SceneAudio.dest(), c + 0.35, 0.04, 0.1, 'bandpass', 2600, null, 4); } } }
      // pesada, mal equilibrada, con el peso demasiado adelante: tiembla y cae
      if (!S.line && !S.choice) { Input.state.yaw += Math.sin(t * 1.7) * 0.0011 + Math.sin(t * 4.3) * 0.0006; Input.state.pitch += Math.cos(t * 2.1) * 0.0010 - dt * 0.012; }
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(S.pitch, S.yaw, S.roll, 'YXZ'));
      const relK = F.reload > 0 ? Math.sin(Math.min(1, F.reload / 2.4) * Math.PI) : 0;
      P.position.copy(S.eye).add(new THREE.Vector3(0.13, -0.16 - relK * 0.2 + F.kick * 0.04, -0.42 + F.kick * 0.06).applyQuaternion(q));
      P.quaternion.copy(q).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(F.kick * 0.5 + relK * 0.9, 0, relK * 0.6)));
    }
    for (const d of F.dust) if (d.userData.t < 2) { d.userData.t += dt; const k = d.userData.t; d.scale.setScalar(0.2 + k * 0.9); d.material.opacity = Math.max(0, 0.8 - k * 0.5); d.position.y += dt * 0.3; }
    if (F.duck > 0) { F.duck -= dt; const k = clamp(F.duck / 0.4, 0, 1) * clamp((1.8 - F.duck) / 0.2, 0, 1); for (const r of F.recruits) { r.g.position.y = -0.45 * k; r.torso.rotation.x = 0.5 * k; } }
    // duchas: el agua, el ruido del agua, el compás de los golpes
    if (w === 'shower') {
      for (const s of F.streaks) { s.position.y -= dt * s.userData.v; if (s.position.y < 0.1) s.position.y = 2.1; }
      F.wT = (F.wT || 0) - dt; if (F.wT < 0 && SceneAudio.ok()) { F.wT = 0.45; AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.6, F.beat ? 0.012 : 0.02, 'highpass', 2600, null, 0.7, 0.1); }
      if (F.beat) {
        F.bT = (F.bT || 0) + dt; const c = 1.25, ph = F.bT % c, prev = (F.bT - dt) % c;
        for (const [hit, tw] of [[0, 0], [0.32, 1]]) if (prev < hit + 0.0001 && ph >= hit || (hit === 0 && ph < prev)) { SceneAudio.thud(0.9); S.roll += 0.05 * (tw ? -1 : 1); Input.state.pitch += 0.03; const T = F.twins[tw]; T.arms[1].rotation.x = -1.4; setTimeout(() => { T.arms[1].rotation.x = -0.2; }, 180); }
        S.roll = damp(S.roll, F.rollBase || 0, 4, dt);
        if (Math.random() < dt * 0.9 && SceneAudio.ok()) AUDIO.osc(SceneAudio.dest(), 'sawtooth', 680, 980, AUDIO.ctx.currentTime, 0.22, 0.008);
      }
    }
    if (w === 'mesa') {
      F.sock.rotation.y = Math.sin(t * 1.3) * 0.12; F.sock.rotation.x = -0.15 + Math.sin(t * 2.7) * 0.05;
      const O = F.smokeO;
      for (const p of F.smoke) { const u = (p.userData.u + t * 0.018) % 1, y = u * 40, bend = Math.max(0, y - 20); p.position.set(O.x - bend * 1.1 - Math.sin(u * 20) * 0.3, O.y + y, O.z - bend * 0.35); p.scale.setScalar(0.6 + u * 3.2); p.material.opacity = 0.42 * (1 - u); }
      for (const gS of F.gunSmoke) if (gS.userData.t < 4) { gS.userData.t += dt; const k = gS.userData.t; gS.scale.setScalar(0.8 + k * 1.6); gS.material.opacity = Math.max(0, 0.6 - k * 0.15); gS.position.y += dt * 0.8; }
      for (const gn of F.guns) if (gn.flT != null) { gn.flT -= dt; gn.tube.position.z = gn.flT > 0 ? 0.25 : damp(gn.tube.position.z, 0, 3, dt); if (gn.flT < 0.05) gn.fl.visible = false; }
      if (F.colT >= 0) { F.colT += dt; for (const p of F.column) { const k = p.userData.k, a = clamp(F.colT * 1.4 - k * 0.12, 0, 6); p.position.set(F.colP.x + Math.sin(k * 2.3) * (1 + a * 0.4) - a * 0.8, F.colP.y + k * 2.4 * Math.min(1, a / 2), F.colP.z + Math.cos(k * 1.7) * 1.2); p.scale.setScalar((0.5 + a * 0.6) * (1 + k * 0.06)); p.material.opacity = Math.max(0, 0.85 - Math.max(0, F.colT - 10) * 0.08); } }
    }
    if (w === 'evening' || w === 'night') F.bulb.material.emissiveIntensity = w === 'evening' ? 2 : 0;
  },
  fireGun(S, i) {
    const F = S.set, gn = F.guns[i]; gn.fl.visible = true; gn.flT = 0.18;
    const mp = gn.muzzle.getWorldPosition(new THREE.Vector3());
    F.gunSmoke.forEach((p, k) => { p.position.copy(mp).add(new THREE.Vector3((Math.random() - 0.5) * 2, Math.random(), -k * 0.6)); p.userData.t = 0; });
    if (SceneAudio.ok()) { const c = AUDIO.ctx.currentTime; AUDIO.osc(SceneAudio.dest(), 'sine', 80, 30, c + 0.2, 1.1, 0.35); AUDIO.nz(SceneAudio.dest(), c + 0.2, 1.4, 0.28, 'lowpass', 1400, 120, 0.7); AUDIO.nz(SceneAudio.dest(), c + 0.2, 0.2, 0.2, 'bandpass', 2400, null, 1); }
  },
  dispose(S) { const F = S.set; if (!F) return; for (const t of F.tex) t.dispose(); if (F.flashEl) F.flashEl.remove(); S.set = null; },
};

(() => {
  const C = (S) => S.set, V = CampUtil.V, sit = CampUtil.sit.bind(CampUtil), head = campHead(CAMP_BY_ID['P1-M3']);
  const go = (where, fn) => Step.run((S) => { Cap3Set.light(S, where); S.where = where; fn(S); });
  const SAYF = (fn, o) => ({ enter(S) { Scenes.say(L(fn(S)), o); }, tick(S) { return !S.line; } });
  const lie = (S, x, y, z, yaw, pitch, roll = 0) => { sit(S, x, y, z, yaw, pitch, 2.1); S.pitchMin = -0.6; S.pitchMax = 1.35; S.roll = roll; };
  const ES = ['cero', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const nES = (n) => n < 30 ? ES[n] : ['treinta', 'cuarenta', 'cincuenta'][((n / 10) | 0) - 3] + (n % 10 ? ' y ' + ES[n % 10] : '');
  const nEN = (n) => n < 20 ? EN[n] : ['twenty', 'thirty', 'forty', 'fifty'][((n / 10) | 0) - 2] + (n % 10 ? '-' + EN[n % 10] : '');
  const dur = (secs) => { const m = Math.floor(secs / 60), s = Math.round(secs % 60);
    const es = m === 0 ? `${nES(s)} segundos` : `${m === 1 ? 'Un minuto' : nES(m) + ' minutos'}${s ? ' y ' + nES(s) : ''}`, en = m === 0 ? `${nEN(s)} seconds` : `${m === 1 ? 'One minute' : nEN(m) + ' minutes'}${s ? ' and ' + nEN(s) : ''}`;
    return { es: es.charAt(0).toUpperCase() + es.slice(1), en: en.charAt(0).toUpperCase() + en.slice(1) }; };
  const shootStep = {
    enter(S) { const F = C(S); F.pistol.visible = true; F.shots = 0; F.cool = 0; F.kick = 0; F.reload = 0; F.relDone = false; S._q = []; S.fire = (s) => Cap3Set.shoot(s);
      Scenes.setGoal(L({ es: 'Apunta a la silueta y dispara con <kbd>clic</kbd> o <kbd>E</kbd> · 0/16', en: 'Aim at the silhouette and fire with <kbd>click</kbd> or <kbd>E</kbd> · 0/16' })); },
    tick(S) {
      const F = C(S);
      if (F.reload > 0 && !F.relSaid) { F.relSaid = true; S._q.push({ text: { es: 'Cambió el cargador como le dijeron. Le temblaban los dedos. No de miedo: de no entender.', en: 'He changed the magazine as he’d been told. His fingers were shaking. Not from fear: from not understanding.' } }); }
      if (S.line) return false;
      if (S._q.length) { const nx = S._q.shift(); Scenes.say(L(nx.text), nx.o); return false; }
      if (F._gs !== F.shots) { F._gs = F.shots; Scenes.setGoal(L({ es: `Apunta a la silueta y dispara con <kbd>clic</kbd> o <kbd>E</kbd> · ${F.shots}/16`, en: `Aim at the silhouette and fire with <kbd>click</kbd> or <kbd>E</kbd> · ${F.shots}/16` })); }
      if (F.shots >= 16 && F.cool < -1.2) { S.fire = null; Scenes.setGoal(null); return true; }
      return false;
    } };

  SCENES.cap3 = {
    setup(S) { Cap3Set.build(S); MODES.campaign.noAmbience = true; Ambience.stop(); Cap3Set.light(S, 'office'); sit(S, 0, 1.62, 1.2, 0, -0.05, 1.3); },
    update(S, dt) { Cap3Set.update(S, dt); },
    teardown(S) { S.fire = null; SceneWalk.stop(S); S.walk = null; Cap3Set.dispose(S); },
    steps: [
      Step.card({ es: 'Parte I · Cuerda', en: 'Part I · Winding' }, { es: 'La mesa de tiro', en: 'The Firing Table' }, head),
      Step.fade(0, 1.6, false),
      // ---- el despacho del capitán ----
      SAY('Lo estaba esperando un capitán que no lo esperaba.', 'He was being waited for by a captain who had not been expecting him.'),
      SAY('El capitán Benigno Ortúzar estaba de pie detrás de una mesa, en un cuarto encalado con un retrato del Presidente Arriaga, un mapa de la sierra de Ocoa clavado con chinchetas y una estufa de hierro que no calentaba nada. Tenía en la mano una cuartilla con el nombre de Santiago escrito a máquina, y la miraba como se mira un telegrama en un idioma que uno no habla.', 'Captain Benigno Ortúzar was standing behind a desk in a whitewashed room with a portrait of President Arriaga, a map of the Ocoa sierra fixed with drawing pins and an iron stove that heated nothing. He held a sheet of paper with Santiago’s name typed on it, and looked at it the way one looks at a telegram in a language one doesn’t speak.'),
      SAY('—Fierros.', '“Fierros.”'),
      SAY('—A la orden, mi capitán.', '“Sir.”'),
      SAY('—Siéntese. No. Quédese de pie. Aquí dice que es usted estudiante de Ingeniería Mecánica. Que tiene usted aptitudes para el cálculo. Que debe usted ser destinado directamente a la sección de cálculo de tiro de la Tercera Batería, sin período de instrucción básica, y que deben facilitársele, cito, todas las condiciones para que sus aptitudes se manifiesten.', '“Sit down. No. Stay standing. It says here you are a Mechanical Engineering student. That you have an aptitude for calculation. That you are to be posted directly to the fire-control section of the Third Battery, with no basic training, and that you are to be given, I quote, every condition for your aptitudes to manifest themselves.”'),
      SAY('—Firmado por un coronel del que no he oído hablar en mi vida. Con un sello que no es del Ministerio de Guerra. ¿Por qué un coronel del Ministerio de Culto, de Culto, Fierros, de curas y de procesiones, me manda una carta sobre un recluta de Artillería?', '“Signed by a colonel I have never heard of in my life. With a seal that isn’t the War Ministry’s. Why would a colonel from the Ministry of Worship, of Worship, Fierros, of priests and processions, send me a letter about an Artillery recruit?”'),
      SAY('—No lo sé, mi capitán.', '“I don’t know, sir.”'),
      SAY('Ortúzar lo miró largo rato. Santiago lo miró a él.', 'Ortúzar looked at him for a long time. Santiago looked back.'),
      Step.find([
        { pos: (S) => C(S).ort.head.localToWorld(V(0, 0.02, 0.13)), r: 0.08, text: { es: 'No había dormido bien. Los párpados de abajo, hinchados; el blanco de los ojos, sucio.', en: 'He hadn’t slept well. The lower lids swollen; the whites of the eyes dirty.' } },
        { pos: (S) => C(S).ort.arms[1].userData.f.localToWorld(V(0, -0.24, 0.05)), r: 0.08, text: { es: 'Una mancha de café en el puño de la guerrera.', en: 'A coffee stain on the cuff of his tunic.' } },
        { pos: (S) => C(S).ort.arms[0].userData.f.localToWorld(V(0, -0.31, 0)), r: 0.08, text: { es: 'La alianza le apretaba en el dedo. Había engordado desde la boda.', en: 'His wedding ring was tight on his finger. He had put on weight since the wedding.' } },
        { pos: (S) => C(S).paper.localToWorld(V(0, 0, 0)), r: 0.08, text: [{ es: 'No le gustaba aquel papel. Le daba miedo aquel papel. El miedo lo hacía enfadarse.', en: 'He didn’t like that piece of paper. That piece of paper frightened him. The fear made him angry.' }, { es: 'Y el enfado lo iba a pagar alguien, y ese alguien iba a ser él.', en: 'And someone was going to pay for the anger, and that someone was going to be him.', o: { cls: 'inner' } }] },
      ], 4, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: lee al capitán · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: read the captain · ${n}/${k}` })),
      SAY('—Yo tampoco lo sé —dijo Ortúzar—. Y no me gusta no saber cosas en mi propio cuartel. Así que va usted a hacer la instrucción básica, como todos. Seis semanas. Orden cerrado, marchas, tiro, limpieza de letrinas. Y si al final de las seis semanas sigue vivo y sus aptitudes siguen ahí, ya veremos. ¿Entendido?', '“I don’t know either,” said Ortúzar. “And I don’t like not knowing things in my own barracks. So you are going to do basic training, like everyone. Six weeks. Drill, marches, shooting, latrine cleaning. And if at the end of six weeks you are still alive and your aptitudes are still there, we shall see. Understood?”'),
      SAY('—Entendido, mi capitán.', '“Understood, sir.”'),
      SAY('—Fuera.', '“Out.”'),
      Step.run((S) => { CampUtil.walk(S, 0, 0, 1.2, Math.PI); }),
      Step.reach(1.0, 3.0, 0.7, 'Sal al pasillo.', 'Go out into the corridor.'),
      Step.run((S) => { const F = C(S); SceneWalk.stop(S); S.yawC = CampUtil.yawTo(S.eye.x, S.eye.z, F.berm.g.position.x, F.berm.g.position.z); S.yawR = 2.4; AUDIO.nz && SceneAudio.ok() && AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.08, 0.05, 'bandpass', 900, null, 2); F.cig.visible = false; F.berm.arms[1].rotation.x = -0.3; }),
      SAY('En el pasillo, junto a la puerta, había un sargento apoyado en la pared fumando, un hombre bajo y fibroso con una cara de navaja, que lo había oído todo. Lo miró de arriba abajo. Tiró el cigarro al suelo y lo pisó.', 'In the corridor, by the door, a sergeant was leaning against the wall smoking, a short, wiry man with a face like a razor, who had heard everything. He looked him up and down. He dropped the cigarette on the floor and stepped on it.'),
      SAY('—Vaya, vaya. El recomendado.', '“Well, well. The recommended one.”'),
      Step.fade(1, 1.4),
      // ---- semanas: imaginaria en la puerta del barracón ----
      Step.card(null, null, { es: 'Barracón del pabellón tres · segunda semana · 03:20', en: 'Block Three barrack room · second week · 03:20' }, 3.0),
      go('night', (S) => { const F = C(S); sit(S, F.BX + 15, 1.62, 6.5, 0, -0.12, 1.2); }),
      Step.fade(0, 1.6, false),
      SAY('El sargento se llamaba Clemente Bermúdez. Había hecho la guerra de la frontera contra Tierra Alta en el treinta y uno, y de esa guerra le quedaban una medalla, tres dedos de menos en el pie izquierdo y una convicción absoluta: que los muchachos de ciudad con estudios eran una plaga, y que su misión en la vida era endurecerlos o romperlos.', 'The sergeant was called Clemente Bermúdez. He had fought the border war against Tierra Alta in thirty-one, and that war had left him a medal, three toes missing from his left foot and one absolute conviction: that educated city boys were a plague, and that his mission in life was to harden them or break them.'),
      SAY('A Santiago decidió romperlo. No lo hizo de golpe. Lo hizo como se hacen las cosas en un cuartel, por capas, con paciencia de albañil.', 'He decided to break Santiago. Not all at once. He did it the way things are done in barracks, in layers, with a bricklayer’s patience.'),
      SAY('La primera semana, las letrinas del pabellón tres, las de las tuberías de barro de la época de la colonia, que se atascaban todas las mañanas. La segunda, imaginaria cuatro noches seguidas, de dos a seis, de pie en la puerta del dormitorio con un fusil sin balas.', 'The first week, the latrines of Block Three, the ones with colonial-era clay pipes that blocked every morning. The second, night watch four nights running, two to six, standing at the dormitory door with a rifle and no bullets.'),
      SAY('Cuarenta y dos hombres dormían. Cuarenta y dos ritmos distintos. Contarlos era lo único que lo mantenía despierto.', 'Forty-two men were sleeping. Forty-two different rhythms. Counting them was the only thing that kept him awake.', { cls: 'inner' }),
      SAY('La tercera semana empezó a llamarlo la Señorita. La cuarta, cuando se dio cuenta de que el apodo no le hacía mella, de que Santiago lo encajaba con una especie de curiosidad tranquila, como si lo estuviera estudiando, lo cambió por el Recomendado, que sí dolía, porque era verdad y porque se lo decía delante de todos.', 'In the third week he began calling him Miss. In the fourth, when he realised the nickname left no mark, that Santiago took it with a kind of calm curiosity, as if he were studying him, he changed it to the Recommended, which did hurt, because it was true and because he said it in front of everyone.'),
      SAY('Era el más flaco de su sección, sesenta y un kilos con las botas puestas. En las cuerdas y en los muros se quedaba colgando como un trapo. Pero en el primer desmontaje del Ferrán vio el fallo de la uña extractora que lo encasquillaba uno de cada veinte disparos. Nadie más parecía haberlo notado.', 'He was the skinniest in his section, sixty-one kilos with his boots on. On the ropes and the walls he hung like a rag. But at the first stripping of the Ferrán he saw the flaw in the extractor claw that jammed it one shot in twenty. Nobody else seemed to have noticed.'),
      Step.fade(1, 1.4),
      // ---- el campo de tiro ----
      Step.card(null, null, { es: 'Campo de tiro de Las Lomas · tercera semana · 10:40', en: 'Las Lomas range · third week · 10:40' }, 3.0),
      go('field', (S) => { const F = C(S); sit(S, F.TX, 1.62, 0.2, 0, 0.08, 0.9); S.pitchMin = -0.6; S.pitchMax = 0.9; }),
      Step.fade(0, 1.4, false),
      SAY('Una vaguada de tierra roja a las afueras, unos parapetos de sacos y unas siluetas de madera clavadas en la ladera a veinticinco metros. A cada uno, una pistola Orbea de nueve milímetros y dos cargadores de ocho.', 'A gully of red earth on the outskirts, some sandbag parapets and wooden silhouettes fixed on the slope at twenty-five metres. For each man, an Orbea nine-millimetre pistol and two eight-round magazines.'),
      SAY('Santiago no había tenido nunca una pistola en la mano. Le pareció pesada, mal equilibrada, con el peso demasiado adelante. La sujetó como le dijeron. Apuntó como le dijeron.', 'Santiago had never held a pistol. It felt heavy, badly balanced, with the weight too far forward. He held it as he was told. He aimed as he was told.'),
      shootStep,
      Step.run((S) => { const F = C(S); F.pistol.visible = false; const b = F.bermF; b.g.position.set(F.TX + 0.25, 0, -0.35); b.g.rotation.y = 0; S.yawC = 0; Input.state.yaw = S.yaw = CampUtil.yawTo(S.eye.x, S.eye.z, b.g.position.x, b.g.position.z); Input.state.pitch = S.pitch = -0.2; }),
      SAY('Dieciséis balas. Ninguna tocó la silueta.', 'Sixteen bullets. Not one touched the silhouette.'),
      Step.run((S) => { const F = C(S); F.bermF.arms[1].rotation.x = -1.6; F.bermF.arms[1].rotation.z = -0.8; setTimeout(() => { if (!Scenes.S) return; SceneAudio.thud(0.7); Cap3Set.redFlash(S); Input.state.yaw += 0.42; Input.state.pitch -= 0.06; F.bermF.arms[1].rotation.z = 0.6; }, 350); }),
      Step.wait(1.4),
      SAY('Bermúdez le quitó la pistola de las manos y le dio un bofetón con el dorso de la mano, no muy fuerte, pero delante de todos. Le dijo que era un peligro público, que era una vergüenza para la quinta del 18, que en una guerra de verdad lo mataría su propia gente para no tener que aguantarlo.', 'Bermúdez took the pistol out of his hands and slapped him with the back of his hand, not very hard, but in front of everyone. He told him he was a public danger, a disgrace to the class of ’18, that in a real war his own side would kill him so as not to have to put up with him.'),
      SAY('No le dolía el bofetón. Le dolía no entender. La pistola era demasiado corta, demasiado nerviosa, demasiado rápida; le pasaba lo que le pasaba con las cosas que había que hacer sin pensar. Él necesitaba pensar. Necesitaba tiempo.', 'The slap didn’t hurt. Not understanding hurt. The pistol was too short, too nervous, too quick; it was what happened to him with everything that had to be done without thinking. He needed to think. He needed time.', { cls: 'inner' }),
      Step.fade(1, 1.4),
      // ---- esa noche ----
      go('night', (S) => { const F = C(S); lie(S, F.my.x, 0.78, F.my.z - 0.55, Math.PI, 0.55); }),
      Step.fade(0, 2.0, false),
      Step.wait(2.2),
      Step.run((S) => { SceneAudio.thud(0.6); Input.state.yaw += 0.25; Input.state.pitch -= 0.1; S.roll = 0.08; }),
      SAY('Esa noche, cuando apagaron las luces, alguien le tiró una bota a la cabeza desde la oscuridad.', 'That night, when the lights went out, someone threw a boot at his head out of the dark.'),
      SAY('—Buenas noches, Recomendado.', '“Good night, Recommended.”'),
      Step.run(() => CampUtil.laugh(0.7)),
      Step.wait(1.6),
      Step.fade(1, 1.6),
      // ---- las duchas ----
      Step.card(null, null, { es: 'Duchas del pabellón tres · quinta semana · sábado, 17:05', en: 'Block Three showers · fifth week · Saturday, 17:05' }, 3.0),
      go('shower', (S) => { const F = C(S); sit(S, F.DX + 4.2, 1.62, 0.65, Math.PI, 0.1, 0.4); }),
      Step.fade(0.92, 1.5, false),
      SAY('Fue un sábado por la tarde, cuando la mitad de la sección tenía pase y la otra mitad no. Estaba debajo del agua fría con los ojos cerrados, pensando en Clara, en la peca de su clavícula.', 'It was a Saturday afternoon, when half the section had leave and the other half didn’t. He was under the cold water with his eyes closed, thinking of Clara, of the freckle on her collarbone.'),
      SAY('Eran cuatro. No los había visto venir.', 'There were four of them. He hadn’t seen them coming.'),
      Step.run((S) => { const F = C(S); SceneAudio.thud(1); SceneAudio.thud(0.8); Cap3Set.redFlash(S); F.rollBase = 1.25; lie(S, F.DX + 4.25, 0.22, 2.75, Math.PI + 0.25, 0.25, 1.25); F.beat = true; F.bT = 0.6; }),
      Step.fade(0, 0.5, false),
      SAY('Lo tiraron al suelo de baldosas. Le dieron patadas en las costillas y en los muslos, donde no se ve. Cifuentes le metió la cabeza junto al desagüe y le dijo que el coronel de curas no estaba ahí para salvarlo, que a ver si ahora rezaba.', 'They threw him onto the tiled floor. They kicked him in the ribs and the thighs, where it doesn’t show. Cifuentes shoved his head down by the drain and told him the priests’ colonel wasn’t there to save him, let’s see him pray now.'),
      SAY('Y entonces, entre patada y patada, se dio cuenta de algo.', 'And then, between kicks, he noticed something.', { cls: 'inner' }),
      Step.find([
        { pos: (S) => C(S).twins[0].torso.localToWorld(V(0, 0.3, 0)), r: 0.14, text: { es: 'Los gemelos Robles le pegaban al compás. Uno-dos. Uno-dos. Exactamente al compás, como los martillos de un carillón, como el reloj de la sala de su casa con su nota rajada.', en: 'The Robles twins were hitting him in time. One-two. One-two. Exactly in time, like the hammers of a carillon, like the clock in the front room at home with its cracked note.' } },
        { pos: (S) => C(S).cif.head.localToWorld(V(0, -0.05, 0.12)), r: 0.12, text: { es: 'Cifuentes, que era el que más gritaba, tenía la voz rota, como de pito, y cuanto más gritaba más se le rompía.', en: 'Cifuentes, who shouted most, had a broken voice, like a whistle, and the more he shouted the more it broke.' } },
        { pos: (S) => C(S).mulo.head.localToWorld(V(0, 0, 0)), r: 0.13, text: { es: 'El Mulo no le pegaba. Estaba en la puerta, vigilando, mirando hacia otro lado porque no quería mirar.', en: 'Mulo wasn’t hitting him. He was at the door, keeping watch, looking the other way because he didn’t want to look.' } },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd> · ${n}/${k}`, en: `Hold <kbd>Q</kbd> · ${n}/${k}` })),
      SAY('Cuatro hombres hechos y derechos dándole patadas a un estudiante flaco al compás de un carillón, en una ducha de agua fría, un sábado por la tarde. Le pareció todo tan ridículo, tan absurdamente mecánico, que la carcajada le subió desde el estómago a pesar del estómago y no pudo pararla.', 'Four grown men kicking a skinny student in time to a carillon, in a cold shower, on a Saturday afternoon. It all seemed so ridiculous, so absurdly mechanical, that the laugh rose from his stomach in spite of his stomach and he couldn’t stop it.'),
      Step.run((S) => { const F = C(S); F.beat = false; if (SceneAudio.ok()) { const t = AUDIO.ctx.currentTime; for (let i = 0; i < 9; i++) AUDIO.nz(SceneAudio.dest(), t + i * 0.21, 0.13, 0.04, 'bandpass', 420 + (i % 3) * 60, null, 2.5); } for (const T of F.twins) T.arms[1].rotation.x = 0; }),
      SAY('Se reía en el suelo. Se reía con la boca llena de agua.', 'He was laughing on the floor. Laughing with his mouth full of water.'),
      SAY('—Está loco —dijo uno de los gemelos.', '“He’s mad,” said one of the twins.'),
      Step.run((S) => { const F = C(S); F.mulo.g.rotation.y = Math.PI + 0.3; }),
      SAY('—Déjalo —dijo el Mulo, desde la puerta—. Déjalo ya. Me cago en la puta. Déjalo.', '“Leave him,” said Mulo, from the door. “Leave him now. For fuck’s sake. Leave him.”'),
      SAY('El Mulo no lo miraba con odio. Lo miraba con miedo. No miedo de él, que era un saco de huesos en el suelo de una ducha. Miedo de lo que acababa de ver: un muchacho que se reía mientras le pegaban.', 'Mulo wasn’t looking at him with hatred. He was looking at him with fear. Not fear of him, a sack of bones on a shower floor. Fear of what he had just seen: a boy who laughed while they beat him.'),
      Step.run((S) => { const F = C(S); for (const p of [...F.twins, F.cif, F.mulo]) p.g.visible = false; F.rollBase = 0; S.roll = 0; lie(S, F.DX + 4.25, 0.25, 2.75, Math.PI, 0.9); }),
      SAY('Era la primera vez que alguien lo miraba así.', 'It was the first time anyone had looked at him like that.'),
      Step.gaze((S) => C(S).fish.position, 0.3, 1.0),
      SAY('Se quedó tumbado, temblando, mirando el techo de la ducha, la mancha de moho verde que tenía forma de pez. No se lo contó a nadie.', 'He lay there, shaking, looking at the shower ceiling, at the patch of green mould shaped like a fish. He told no one.'),
      Step.fade(1, 1.8),
      // ---- la mesa de tiro ----
      Step.card(null, null, { es: 'Las Lomas · sección de cálculo de la Tercera Batería · sexta semana', en: 'Las Lomas · Third Battery fire-control section · sixth week' }, 3.2),
      go('mesa', (S) => { const F = C(S); sit(S, F.MX + 0.2, 1.62, 2.4, 0, -0.25, 2.4); S.pitchMin = -1.0; }),
      Step.fade(0, 1.4, false),
      SAY('En la sexta semana el capitán Ortúzar cumplió su palabra y lo llevó a la mesa de tiro: una tienda de lona en lo alto de una loma, una mesa plegable, un teodolito, tres tenientes jóvenes con reglas de cálculo, un sargento viejo que sabía más que los tres tenientes juntos, y un mapa.', 'In the sixth week Captain Ortúzar kept his word and took him to the firing table: a canvas tent on top of a hill, a folding table, a theodolite, three young lieutenants with slide rules, an old sergeant who knew more than the three lieutenants put together, and a map.'),
      SAY('—Aquí no hay coroneles de curas. Aquí hay números. Si los números están mal, los obuses caen en nuestra infantería. ¿Ha visto alguna vez lo que hace un obús de setenta y cinco en una trinchera llena de nuestros propios muchachos, Fierros?', '“There are no priests’ colonels here. There are numbers. If the numbers are wrong, the shells land on our infantry. Have you ever seen what a seventy-five shell does to a trench full of our own boys, Fierros?”'),
      SAY('—No, mi capitán.', '“No, sir.”'),
      SAY('—Yo sí. En el treinta y uno. Teniente Gaviria, déle el ejercicio cuatro.', '“I have. In thirty-one. Lieutenant Gaviria, give him exercise four.”'),
      SAY('—Tiro indirecto. Blanco detrás de aquella loma, invisible desde las piezas. El observador avanzado lo da en cuadrícula 47-12, a tres mil metros. Cuatro obuses Ostrander del dieciocho. Saque los datos de tiro: carga, alza, deriva. Lo que haga falta.', '“Indirect fire. Target behind that hill, invisible from the guns. The forward observer gives it at grid 47-12, three thousand metres. Four Ostrander howitzers, model of ’18. Work out the firing data: charge, elevation, deflection. Whatever is needed.”'),
      Step.run((S) => { C(S).calcT0 = S.t; }),
      SAY('Los tenientes tardaban entre quince y veinte minutos con las tablas y las reglas. Santiago miró.', 'The lieutenants took between fifteen and twenty minutes with the tables and the slide rules. Santiago looked.', { cls: 'inner' }),
      Step.find([
        { pos: (S) => C(S).mapP.localToWorld(V(-0.07, 0.25, 0)), r: 0.12, text: { es: 'El mapa: la batería abajo, el blanco 47-12 al otro lado de la loma. Tres mil metros. Deriva por plano: cuarenta y una a la izquierda.', en: 'The map: the battery below, target 47-12 on the far side of the hill. Three thousand metres. Deflection by map: forty-one left.' } },
        { pos: (S) => C(S).tab.localToWorld(V(0, 0.05, 0)), r: 0.1, text: { es: 'La tabla de tiro del Ostrander. A tres mil metros la carga dos no llega. La cuatro va tensa, rasante: la loma se la come. Con la tres, trescientas doce milésimas.', en: 'The Ostrander range table. At three thousand metres charge two won’t reach. Four is flat, grazing: the hill would swallow it. With three, three hundred and twelve mils.' } },
        { pos: (S) => C(S).sock.localToWorld(V(0, 0, -0.6)), r: 0.12, text: { es: 'La manga de viento, en lo alto de su poste: viento del sur, flojo.', en: 'The windsock, at the top of its pole: wind from the south, light.' } },
        { pos: (S) => V(C(S).smokeO.x - 6.6, C(S).smokeO.y + 26, C(S).smokeO.z - 2.1), r: 0.1, text: { es: 'Pero el humo de la cocina del campamento sube recto y, a partir de los veinte metros, se tuerce hacia el oeste. Arriba no sopla lo mismo que abajo. Arriba sopla del sureste.', en: 'But the smoke from the camp kitchen rises straight and, above twenty metres, bends to the west. The wind up there isn’t the wind down here. Up there it blows from the south-east.' } },
        { pos: (S) => C(S).guns[1].g.localToWorld(V(0, 1.3, -0.2)), r: 0.07, text: { es: 'Las piezas dos y cuatro tienen la boca y el escudo más negros. Esta mañana su humo salía más negro: el tubo está más gastado y ya no tira igual que cuando era nuevo.', en: 'Guns two and four have blacker muzzles and shields. This morning their smoke came out blacker: the barrel is more worn and no longer throws as it did when new.' } },
      ], 5, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: el mapa, la tabla, el viento, las piezas · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the map, the table, the wind, the guns · ${n}/${k}` })),
      Step.run((S) => { S.lookKey = false; }),
      SAY('Cerró los ojos. Pensó en el obús como en un muelle. En la carga como en la cuerda. En la trayectoria como en el arco de un muelle espiral que salta del volante de un Longines y cae, planeando, hasta la tercera junta a la izquierda del zócalo.', 'He closed his eyes. He thought of the howitzer as a spring. Of the charge as the winding. Of the trajectory as the arc of a hairspring leaping from the balance of a Longines and falling, gliding, to the third joint left of the skirting.', { cls: 'mem' }),
      Step.choice({ es: 'Carga', en: 'Charge' }, [{ es: 'Carga dos', en: 'Charge two' }, { es: 'Carga tres', en: 'Charge three' }, { es: 'Carga cuatro', en: 'Charge four' }], 1,
        [{ es: 'No. Con la dos no llega: se queda en dos mil setecientos.', en: 'No. Charge two won’t reach: it falls short at two thousand seven hundred.' }, { es: '', en: '' }, { es: 'No. La cuatro va rasante: se estrellaría en la cresta de la loma.', en: 'No. Four is too flat: it would hit the crest of the hill.' }]),
      Step.choice({ es: 'Alza, a tres mil metros', en: 'Elevation, at three thousand metres' }, [{ es: 'Doscientas noventa y seis milésimas', en: 'Two hundred and ninety-six mils' }, { es: 'Trescientas doce milésimas', en: 'Three hundred and twelve mils' }, { es: 'Trescientas veintiuna milésimas', en: 'Three hundred and twenty-one mils' }], 1,
        [{ es: 'Eso es para dos mil ochocientos. Mira la tabla otra vez.', en: 'That’s for two thousand eight hundred. Look at the table again.' }, { es: '', en: '' }, { es: 'Eso es para tres mil cien. Mira la tabla otra vez.', en: 'That’s for three thousand one hundred. Look at the table again.' }]),
      Step.choice({ es: 'Deriva: el plano dice cuarenta y una a la izquierda. ¿Y el viento?', en: 'Deflection: the map says forty-one left. And the wind?' }, [{ es: 'La manga dice sur: se queda en cuarenta y una.', en: 'The windsock says south: it stays at forty-one.' }, { es: 'Arriba sopla del sureste: otras dos a la izquierda, cuarenta y tres.', en: 'Up there it blows from the south-east: two more left, forty-three.' }, { es: 'Dos a la derecha, treinta y nueve.', en: 'Two right, thirty-nine.' }], 1,
        [{ es: 'La granada no vuela a la altura de la manga. Mira el humo de la cocina.', en: 'The shell doesn’t fly at the height of the windsock. Look at the kitchen smoke.' }, { es: '', en: '' }, { es: 'No. Piensa hacia dónde se tuerce el humo arriba.', en: 'No. Think which way the smoke bends up high.' }]),
      Step.choice({ es: 'Las piezas dos y cuatro', en: 'Guns two and four' }, [{ es: 'Como las demás.', en: 'Same as the others.' }, { es: 'Cuatro milésimas menos: tiran más largo.', en: 'Four mils less: they throw longer.' }, { es: 'Cuatro milésimas más de alza: el tubo gastado tira corto.', en: 'Four mils more elevation: the worn barrel throws short.' }], 2,
        [{ es: 'No son como las demás. Mira las bocas.', en: 'They aren’t like the others. Look at the muzzles.' }, { es: 'Al revés. Un tubo gastado pierde, no gana.', en: 'The other way round. A worn barrel loses, it doesn’t gain.' }, { es: '', en: '' }]),
      Step.run((S) => { const F = C(S); F.calcSecs = Math.max(20, S.t - F.calcT0); }),
      SAY('Abrió los ojos.', 'He opened his eyes.'),
      SAY('—Alza, trescientas doce milésimas. Deriva, cuarenta y una a la izquierda. Carga tres. Pero las piezas dos y cuatro tienen el tubo más gastado, se ve en el humo de los disparos de esta mañana, así que a esas hay que darles cuatro milésimas más de alza. Y el viento de arriba no es el mismo que el de abajo. Arriba sopla del sureste. Eso son otras dos a la izquierda en deriva.', '“Elevation, three hundred and twelve mils. Deflection, forty-one left. Charge three. But guns two and four have more worn barrels, you can see it in the smoke from this morning’s firing, so those need four mils more elevation. And the wind up there isn’t the same as down here. Up there it blows from the south-east. That’s another two left in deflection.”'),
      SAY('Hubo un silencio en la tienda. El teniente Gaviria miró al capitán. El sargento viejo, Andrade, que tenía un ojo de cristal como la señora Etelvina de Corcovado, se rascó la cabeza.', 'There was a silence in the tent. Lieutenant Gaviria looked at the captain. The old sergeant, Andrade, who had a glass eye like Señora Etelvina back in Corcovado, scratched his head.'),
      SAY('—¿Cuánto ha tardado? —preguntó Ortúzar.', '“How long did he take?” asked Ortúzar.'),
      SAYF((S) => { const d = dur(C(S).calcSecs); return { es: `Andrade miró su reloj. —${d.es}, mi capitán.`, en: `Andrade looked at his watch. “${d.en}, sir.”` }; }),
      SAY('—Compruébenlo.', '“Check it.”'),
      SAY('Lo comprobaron. Los tres tenientes, cada uno por su lado, con las tablas y las reglas. Tardaron diecisiete, diecinueve y veintidós minutos. Dos sacaron cifras casi iguales, salvo en el viento de altura, que no habían tenido en cuenta. El tercero se había equivocado en una suma.', 'They checked it. The three lieutenants, each on his own, with the tables and slide rules. They took seventeen, nineteen and twenty-two minutes. Two got almost the same figures, except for the upper wind, which they hadn’t considered. The third had made a mistake in an addition.'),
      Step.run((S) => { const F = C(S); F.ortM.g.position.set(F.MX - 0.85, 0, 1.75); F.ortM.g.rotation.y = Math.PI / 2; F.ortM.arms[1].rotation.x = -1.2; if (SceneAudio.ok()) { const t = AUDIO.ctx.currentTime; for (let i = 0; i < 8; i++) AUDIO.nz(SceneAudio.dest(), t + i * 0.09, 0.06, 0.04, 'bandpass', 1200, null, 3); } }),
      SAY('Ortúzar fue hasta el teléfono de campaña. Dio a la manivela.', 'Ortúzar went to the field telephone. He turned the crank.'),
      SAY('—Tercera Batería. Pieza uno. Alza trescientas doce. Deriva cuarenta y tres izquierda. Carga tres. Un disparo. Fuego cuando listo.', '“Third Battery. Gun one. Elevation three-twelve. Deflection forty-three left. Charge three. One round. Fire when ready.”'),
      Step.run((S) => { const F = C(S); S.yawC = 0; Input.state.yaw = S.yaw = CampUtil.yawTo(S.eye.x, S.eye.z, F.guns[0].g.position.x, F.guns[0].g.position.z); Input.state.pitch = S.pitch = -0.33; }),
      Step.wait(2.0),
      Step.run((S) => { Cap3Set.fireGun(S, 0); C(S).cnt = 0; }),
      { tick(S) { const F = C(S); const n = Math.floor(S.stepT); if (n > F.cnt && n <= 12) { F.cnt = n; SceneAudio.count(); Scenes.setGoal(`${n}`); } if (S.stepT > 12) { Scenes.setGoal(null); F.colT = 0; SceneAudio.thud(0.35); return true; } return false; } },
      SAY('Santiago contó. No pudo evitar contar. Doce segundos de vuelo. Al otro lado de la loma, invisible, a tres kilómetros, se levantó una columna de humo negro y tierra.', 'Santiago counted. He couldn’t help counting. Twelve seconds of flight. On the other side of the hill, invisible, three kilometres away, a column of black smoke and earth rose up.'),
      Step.run((S) => { if (SceneAudio.ok()) { const t = AUDIO.ctx.currentTime; for (let r = 0; r < 2; r++) for (let i = 0; i < 10; i++) AUDIO.osc(SceneAudio.dest(), 'square', 920, 920, t + r * 0.9 + i * 0.05, 0.03, 0.01); } }),
      SAY('El teléfono de campaña sonó. Ortúzar lo cogió. Escuchó. —Repita. —Escuchó otra vez. Colgó. Se quedó un momento con la mano en el auricular.', 'The field telephone rang. Ortúzar picked it up. Listened. “Repeat.” Listened again. Hung up. Stood a moment with his hand on the receiver.'),
      Step.run((S) => { const F = C(S); F.ortM.g.position.set(F.MX + 0.15, 0, 1.75); F.ortM.g.rotation.y = 0; F.ortM.arms[1].rotation.x = 0; S.yawC = 0; Input.state.yaw = S.yaw = Math.PI * 0.0; Input.state.pitch = S.pitch = -0.15; }),
      SAY('—Doce metros. Doce metros del blanco. Primer disparo. Sin corrección.', '“Twelve metres. Twelve metres from the target. First round. No correction.”'),
      SAY('—En el treinta y uno el mejor calculador de toda la frontera tardaba tres disparos de corrección en meterse a cincuenta metros. Tres. Y cada disparo de corrección es un disparo que el enemigo oye y un minuto que el enemigo tiene para salir corriendo.', '“In thirty-one the best calculator on the whole border took three correction rounds to get within fifty metres. Three. And every correction round is a round the enemy hears and a minute the enemy has to run.”'),
      SAY('Se acercó. Le miró los ojos, primero uno, luego otro, como buscando algo dentro. No con simpatía. Con la desconfianza que sienten los hombres sencillos ante lo que no entienden, y que en el fondo es una forma de respeto, o de miedo, o de las dos cosas.', 'He came closer. Looked into his eyes, first one, then the other, as if searching for something inside. Not with sympathy. With the distrust simple men feel before what they don’t understand, which deep down is a form of respect, or of fear, or of both.'),
      SAY('—¿Quién demonios es usted, Fierros?', '“Who the devil are you, Fierros?”'),
      Step.choice({ es: '¿Qué le contestas?', en: 'What do you answer?' }, [{ es: '—Nadie, mi capitán. Un estudiante.', en: '“Nobody, sir. A student.”' }, { es: '—El hijo de una relojera.', en: '“The son of a watchmaker.”' }, { es: 'No contestar.', en: 'Don’t answer.' }], 0,
        [{ es: '', en: '' }, { es: 'Lo pensó. No lo dijo. Hay cosas que se ven y no se dicen.', en: 'He thought it. He didn’t say it. Some things are seen and not said.' }, { es: 'El capitán esperaba una respuesta. Había que darle una que no dijera nada.', en: 'The captain was waiting for an answer. He had to be given one that said nothing.' }]),
      SAY('—No. —Ortúzar negó con la cabeza, despacio—. No. Ya me empiezo a imaginar por qué un coronel de curas manda cartas sobre usted.', '“No.” Ortúzar shook his head, slowly. “No. I’m beginning to imagine why a priests’ colonel writes letters about you.”'),
      Step.fade(1, 1.6),
      // ---- las tardes del barracón ----
      Step.card(null, null, { es: 'Barracón del pabellón tres · febrero de 1940 · 21:30', en: 'Block Three barrack room · February 1940 · 21:30' }, 3.0),
      go('evening', (S) => { const F = C(S); F.orange.visible = true; for (const g of F.sleepers) g.visible = false; Cap3Set.notebook(S, 5); CampUtil.walk(S, F.my.x + 0.9, 0, F.my.z + 1.6, CampUtil.yawTo(F.my.x + 0.9, F.my.z + 1.6, F.my.x, F.my.z)); }),
      Step.fade(0, 1.2, false),
      SAY('Lo destinaron a la mesa de tiro. Bermúdez dejó de llamarlo Recomendado delante del capitán, aunque siguió llamándoselo cuando el capitán no estaba, y con más rabia que antes, porque ahora no podía tocarlo. Cifuentes y los gemelos no volvieron a acercarse.', 'He was posted to the firing table. Bermúdez stopped calling him Recommended in front of the captain, though he kept calling him it when the captain wasn’t there, and more bitterly than before, because now he couldn’t touch him. Cifuentes and the twins never came near him again.'),
      Step.uses([
        { id: 'cuaderno', d: 1.9, r: 0.3, pos: (S) => C(S).nb.position, label: { es: 'Escribir en el cuaderno de taller', en: 'Write in the workshop notebook' }, use(S) { Cap3Set.notebook(S, 12); },
          text: [{ es: 'Un cuaderno de tapas de hule negro de la cantina, igual que el de su madre. Al principio apuntaba solo tablas de tiro. Luego empezó a apuntar otras cosas. Lo que tardaba Bermúdez en encenderse un cigarro: once segundos, siempre con la izquierda, siempre la cerilla hacia dentro. La hora a la que el centinela de la puerta norte iba a mear detrás de la garita.', en: 'A notebook with black oilcloth covers from the canteen, just like his mother’s. At first he wrote down only range tables. Then he began to write other things. How long Bermúdez took to light a cigarette: eleven seconds, always with the left hand, always striking the match inwards. The time the sentry at the north gate went to piss behind the sentry box.' },
            { es: 'Las cosas se le acumulaban en la cabeza y si no las ponía en algún sitio la cabeza se le llenaba de ruido, como la casa de Corcovado a medianoche.', en: 'Things piled up in his head and if he didn’t put them somewhere his head filled with noise, like the house in Corcovado at midnight.', o: { cls: 'inner' } }] },
        { id: 'naranja', d: 1.9, r: 0.3, avail: (S) => C(S).orange.visible, pos: (S) => C(S).orange.position, label: { es: 'Coger la naranja', en: 'Pick up the orange' }, use(S) { C(S).orange.visible = false; },
          text: { es: 'Una noche, el Mulo le dejó en el catre una naranja, sin decir nada. Santiago no supo nunca si era una disculpa, o un soborno, o una ofrenda, como las que se dejan a los santos que dan miedo.', en: 'One night Mulo left an orange on his cot, without a word. Santiago never knew whether it was an apology, or a bribe, or an offering, like the ones left for saints who frighten people.' } },
      ], 2, (n, k) => L({ es: `Tu catre: el cuaderno y lo que te han dejado · ${n}/${k}`, en: `Your cot: the notebook and what was left there · ${n}/${k}` })),
      Step.run((S) => { C(S).orange.visible = true; }),
      SAY('Escribía a Clara los domingos. Cartas largas, llenas de tonterías del cuartel, de la mancha de moho con forma de pez, del ojo de cristal del sargento Andrade, de la naranja del Mulo. No le contó lo de las duchas. No le contó lo de la risa.', 'He wrote to Clara on Sundays. Long letters, full of barracks nonsense, the mould stain shaped like a fish, Sergeant Andrade’s glass eye, Mulo’s orange. He didn’t tell her about the showers. He didn’t tell her about the laugh.'),
      SAY('Tu banco está vacío, le escribía ella. Nadie lo toca. Mi padre dice que es como tener un muerto en casa. Yo le digo que no diga eso.', 'Your bench is empty, she wrote. Nobody touches it. My father says it’s like having a dead man in the house. I tell him not to say that.', { cls: 'mem' }),
      SAY('Su padre le escribía postales de la estación, con la foto del puente de hierro, y tres o cuatro líneas con su letra redonda de alumno aplicado. Aquí todo bien. Fermín sigue haciendo trampas. Los relojes en hora. Te quiere, papá.', 'His father wrote him station postcards, with the photo of the iron bridge, and three or four lines in his round, diligent-schoolboy hand. All well here. Fermín still cheating. The clocks on time. Love, Dad.'),
      SAY('Siempre los relojes en hora. Se imaginaba a su padre los sábados a las seis y cuarenta, con el delantal de su madre, descolgando el reloj alemán de las violetas con las dos manos, contando las catorce vueltas.', 'Always the clocks on time. He pictured his father on Saturdays at six-forty, in his mother’s apron, lifting down the German clock with the violets in both hands, counting the fourteen turns.', { cls: 'inner' }),
      SAY('El catorce de febrero llegó una postal distinta. La misma foto del puente. La misma letra. Pero decía otra cosa.', 'On the fourteenth of February a different postcard came. The same photo of the bridge. The same handwriting. But it said something else.'),
      Step.run((S) => { const F = C(S); F.post.visible = true; F.orange.visible = false; sit(S, F.my.x + 0.15, 1.15, F.my.z + 0.55, CampUtil.yawTo(F.my.x + 0.15, F.my.z + 0.55, F.post.position.x, F.post.position.z), -1.05, 1.2); S.pitchMin = -1.4; }),
      Step.find([
        { pos: (S) => C(S).post.localToWorld(V(-0.04, 0.02, 0)), r: 0.07, text: { es: '«El sábado 17 voy a la capital. Tengo que hacer unas gestiones en la Compañía. Ya he hablado con tu capitán y te dan pase de día. Te espero en la Estación Central, en el vestíbulo, debajo del reloj grande, a las diez y media. No llegues tarde. Te quiere, papá.»', en: '“On Saturday the 17th I’m going to the capital. I have some business to see to at the Company. I’ve already spoken to your captain and they’re giving you a day pass. I’ll wait for you at Central Station, in the hall, under the big clock, at half past ten. Don’t be late. Love, Dad.”' } },
      ], 1, () => L({ es: 'Mantén <kbd>Q</kbd>: lee la postal.', en: 'Hold <kbd>Q</kbd>: read the postcard.' })),
      SAY('Ya he hablado con tu capitán.', 'I’ve already spoken to your captain.', { cls: 'inner' }),
      SAY('Su padre no conocía a su capitán. Su padre no había estado nunca en La Recoleta. Su padre era un jefe de circulación de una estación de tercera que no sabía usar el teléfono sin gritar y que se ponía nervioso delante de los uniformes. Su padre no hablaba con capitanes.', 'His father didn’t know his captain. His father had never been to La Recoleta. His father was a traffic controller at a third-class station who couldn’t use the telephone without shouting and got nervous in front of uniforms. His father didn’t speak to captains.'),
      Step.fade(1, 1.2),
      // ---- el despacho, otra vez ----
      Step.card(null, null, { es: 'Pabellón de mando · 14 de febrero de 1940 · 18:10', en: 'Command block · 14 February 1940 · 18:10' }, 2.8),
      go('office', (S) => { const F = C(S); F.ort.g.visible = false; F.ortS.g.visible = true; F.sobre.visible = false; F.berm.g.visible = false; sit(S, 0.1, 1.62, 1.0, 0, -0.2, 1.2); }),
      Step.fade(0, 1.2, false),
      SAY('El capitán estaba en su despacho, junto a la estufa que no calentaba, firmando partes.', 'The captain was in his office, by the stove that gave no heat, signing reports.'),
      SAY('—Mi capitán. Mi padre me escribe que le ha concedido usted un pase para el sábado. ¿Ha hablado usted con mi padre, mi capitán?', '“Sir. My father writes that you have granted me a pass for Saturday. Have you spoken to my father, sir?”'),
      SAY('Ortúzar dejó la pluma. Se quedó un rato mirando la mesa.', 'Ortúzar put down his pen. He sat a while looking at the desk.'),
      SAY('—No. No he hablado con su padre. He recibido otra carta. Del mismo coronel.', '“No. I have not spoken to your father. I have received another letter. From the same colonel.”'),
      Step.run((S) => { const F = C(S); F.sobre.visible = true; if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.12, 0.04, 'bandpass', 700, null, 2); }),
      Step.find([
        { pos: (S) => C(S).sobre.localToWorld(V(-0.05, 0.05, 0)), r: 0.08, text: { es: 'El membrete: Ministerio de Culto. Gabinete del Coronel Delegado.', en: 'The letterhead: Ministry of Worship. Office of the Colonel Delegate.' } },
        { pos: (S) => C(S).sobre.localToWorld(V(0.085, 0.045, 0)), r: 0.07, text: { es: 'El sello. No era del Ministerio de Guerra.', en: 'The seal. It wasn’t the War Ministry’s.' } },
      ], 2, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: no te lo da; solo te lo enseña · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: he doesn’t hand it over; he only shows it · ${n}/${k}` })),
      Step.run((S) => { C(S).sobre.visible = false; }),
      SAY('—Dice que tiene usted pase el sábado diecisiete de febrero de nueve de la mañana a nueve de la noche. Y que no debe usted saber que lo dice él. Así que ya lo sabe. Haga usted con eso lo que quiera, Fierros. Yo, si fuera usted, no iría.', '“It says you have a pass on Saturday the seventeenth of February from nine in the morning to nine at night. And that you are not to know he says so. So now you know. Do what you like with that, Fierros. If I were you, I wouldn’t go.”'),
      SAY('—¿Por qué no?', '“Why not?”'),
      SAY('—Porque no me gustan las cosas que no entiendo —dijo Ortúzar, y volvió a coger la pluma—. Y usted, cada día, me gusta menos.', '“Because I don’t like things I don’t understand,” said Ortúzar, and picked up his pen again. “And every day, I like you less.”'),
      Step.fade(1, 1.4),
      // ---- la última noche ----
      Step.card(null, null, { es: 'Barracón del pabellón tres · viernes 16 de febrero de 1940 · 04:09', en: 'Block Three barrack room · Friday 16 February 1940 · 04:09' }, 3.0),
      go('night', (S) => { const F = C(S); for (const g of F.sleepers) g.visible = true; F.post.visible = false; lie(S, F.my.x, 0.78, F.my.z - 0.55, Math.PI, 0.4); }),
      Step.fade(0, 2.2, false),
      SAY('No durmió. Se quedó tumbado en la oscuridad, oyendo respirar a cuarenta y dos hombres, cuarenta y dos ritmos distintos, y pensando.', 'He didn’t sleep. He lay in the dark, listening to forty-two men breathing, forty-two different rhythms, and thinking.'),
      SAY('En el matasellos violeta del veintiuno de septiembre. En la cruz a lápiz junto a su nombre en la lista del cabo de guardia. En las dos cartas del coronel Larraín, del Ministerio de Culto. En la corona de rosas blancas y lirios blancos en forma de lira. De sus compañeros de San Gregorio.', 'Of the violet postmark of the twenty-first of September. Of the pencil cross by his name on the corporal’s list. Of Colonel Larraín’s two letters, from the Ministry of Worship. Of the wreath of white roses and white lilies in the shape of a lyre. From her companions at San Gregorio.', { cls: 'mem' }),
      SAY('En el hombre que olía a cera de vela, que cojeaba de la pierna derecha y llevaba el anillo en el meñique. Tiene usted sus ojos. En la columna de horas en la contratapa del cuaderno de su madre. 7:10. P. Sigue viniendo.', 'Of the man who smelled of candle wax, who limped on his right leg and wore his ring on his little finger. You have her eyes. Of the column of times inside the back cover of his mother’s notebook. 7:10. P. Still coming.', { cls: 'mem' }),
      SAY('En su padre en el umbral, a las doce menos dos, con el sobre en la mano, y el reloj de ella parado con un papel de fumar.', 'Of his father in the doorway, at two minutes to twelve, with the envelope in his hand, and her clock stopped with a cigarette paper.', { cls: 'mem' }),
      SAY('Hay cosas que se ven y no se dicen.', 'Some things are seen and not said.', { cls: 'inner' }),
      SAY('Eso es una tontería, había dicho Clara. Las cosas se dicen. Si no, se pudren.', 'That’s nonsense, Clara had said. Things get said. Otherwise they rot.', { cls: 'mem' }),
      Step.run(() => { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime; for (let i = 0; i < 10; i++) AUDIO.nz(SceneAudio.dest(), t + 0.5 + i * 0.6, 0.05, 0.02 * (1 - i / 12), 'bandpass', 500, null, 2); }),
      SAY('A las cuatro y diez oyó al centinela de la puerta norte ir a mear detrás de la garita. Seis minutos.', 'At ten past four he heard the sentry at the north gate go to piss behind the sentry box. Six minutes.'),
      Step.wait(2.5),
      Step.run(() => { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime; for (let i = 0; i < 10; i++) AUDIO.nz(SceneAudio.dest(), t + i * 0.6, 0.05, 0.02 * (0.2 + i / 12), 'bandpass', 500, null, 2); }),
      SAY('A las cuatro y dieciséis lo oyó volver.', 'At sixteen past four he heard him come back.'),
      Step.fade(1, 2.0),
      Step.run(() => { if (SceneAudio.ok()) AUDIO.bugle(SceneAudio.dest(), AUDIO.ctx.currentTime + 0.3, [[392, 0.18], [523, 0.18], [659, 0.36], [523, 0.18], [659, 0.18], [784, 0.6], [659, 0.18], [523, 0.5]], 0.06); }),
      SAY('A las seis tocaron diana.', 'At six they sounded reveille.'),
      // ---- la puerta del cuartel ----
      Step.card(null, null, { es: 'Cuartel de La Recoleta · sábado 17 de febrero de 1940 · 09:00', en: 'La Recoleta Barracks · Saturday 17 February 1940 · 09:00' }, 3.0),
      go('yard', (S) => { const F = C(S); for (const g of F.sleepers) g.visible = false; CampUtil.walk(S, F.BX + 15, 0, 8.2, Math.PI); }),
      Step.fade(0, 1.2, false),
      SAY('Se lavó con agua fría y se puso el uniforme de paseo, que le quedaba grande en los hombros y corto en las mangas. Hacía un sol blanco, sin calor. Llevaba el pase de día en el bolsillo.', 'He washed in cold water and put on his walking-out uniform, which was too big in the shoulders and too short in the sleeves. The sun was white, without warmth. He had his day pass in his pocket.'),
      Step.reach(120 + 15, 41.5, 1.6, 'Sal por la puerta principal.', 'Go out through the main gate.'),
      Step.run((S) => { SceneWalk.stop(S); }),
      Step.fade(1, 1.4),
      Step.card(null, null, { es: 'Estación Central de San Elías · 10:15', en: 'San Elías Central Station · 10:15' }, 3.0),
      SAY('Bajó a pie por la avenida de la Independencia, contando sin querer los pasos y las farolas y los tranvías. Llegó a la Estación Central a las diez y quince. Quince minutos antes de la hora.', 'He walked down the Avenida de la Independencia, counting without meaning to the steps and the lamp posts and the trams. He reached Central Station at a quarter past ten. Fifteen minutes early.'),
      SAY('Al levantar la vista hacia la esfera sur de la torre, la que había visto en Nochevieja desde la azotea con los labios de Clara todavía en los suyos, se paró en seco en mitad de la acera.', 'Looking up at the south face of the tower, the one he had seen on New Year’s Eve from the rooftop with Clara’s lips still on his, he stopped dead in the middle of the pavement.'),
      Step.run(() => { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime + 0.3; for (let i = 0; i < 12; i++) { const tt = t + i * 0.5; AUDIO.nz(SceneAudio.dest(), tt, 0.03, 0.08, 'bandpass', i % 2 ? 2600 : 3400, null, 6); if (i % 4 === 3) AUDIO.nz(SceneAudio.dest(), tt + 0.11, 0.025, 0.06, 'bandpass', 3000, null, 6); } }),
      Step.wait(6.4),
      SAY('Porque había oído otra cosa.', 'Because he had heard something else.'),
      Step.wait(1.5),
    ],
  };
  const m = CAMP_BY_ID['P1-M3']; m.scene = 'cap3'; m.map = 'c3_recoleta';
})();
