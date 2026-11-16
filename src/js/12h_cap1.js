// ---- 12h_cap1.js ----
// =====================================================================
// PARTE I · CAPÍTULO 1 · «Once relojes» (P1-M1)
// Villa Corcovado · sábado 7 de octubre de 1939 · 06:40
// Tramos: A) la casa de la calle de los Herreros: dar cuerda a los once
// relojes a pie; el vaso de agua. B) desayuno con el padre. C) despacho
// del jefe de circulación: la radio, Fermín y el mineral 2117 (Mirar el
// séptimo vagón). D) recuerdo: la plaza con su madre («¿qué cambió?»).
// E) la noche: el cuaderno de hule, las doce campanadas, el undécimo
// reloj parado a las 11:58 y el sobre amarillo.
// Todo se construye con cajas dentro de MapSys.decor (se va con el mapa).
// Lugares separados en el mismo mapa: casa (x 0..10), estación (x 40..),
// plaza (x -60..).
// =====================================================================
MAPS.corcovado_casa = {
  name: { es: 'Villa Corcovado · calle de los Herreros', en: 'Villa Corcovado · Calle de los Herreros' },
  desc: { es: 'La casa de los Fierros, la estación y la plaza.', en: 'The Fierros house, the station and the square.' },
  campaign: true,
  thumb: ['#a9b4b8', '#6a6152', '#3a342a'],
  theme: { skyTop: 0x6f8fb0, skyMid: 0xb8c4c6, skyBot: 0xd6cfb8, fog: 0xbfc2b8, fogNear: 40, fogFar: 260, sun: 0xffe2b8, sunI: 1.1, sunDir: [0.5, 0.75, 0.35], hemiTop: 0xcfd6dc, hemiBot: 0x5a5040, hemiI: 0.55, exposure: 1.05, cloud: 0.3, rays: 0, glow: 0, lamps: false, soldFill: 0.5, soldRim: 0.3 },
  build(B) {
    B.bounds(-90, -30, 90, 40);
    B.ground(-90, -30, 90, 40, { y: -0.6, pattern: PAT.DIRT, color: 0x3a3226 });
    B.spawn('ffa', 2, 0, 3, 0);
  },
};

const Cap1Set = {
  build(S) {
    const root = new THREE.Group(); MapSys.decor.add(root);
    const mats = {}, tex = [], col = [];
    const M = (c, o = {}) => { const k = c + '|' + (o.e || '') + '|' + (o.r ?? '') + '|' + (o.m ?? '') + '|' + (o.t ?? ''); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.85, metalness: o.m ?? 0, emissive: o.e || 0x000000, emissiveIntensity: o.ei ?? 1, transparent: o.t != null, opacity: o.t ?? 1 })); };
    const box = (w, h, d, c, x, y, z, par = root, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.mat || M(c, o)); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; m.castShadow = !!o.cs; m.receiveShadow = true; par.add(m); return m; };
    const grp = (x, y, z, par = root, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; par.add(g); return g; };
    const cyl = (r0, r1, h, c, x, y, z, par = root, o = {}) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, o.seg || 14), o.mat || M(c, o)); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; par.add(m); return m; };
    const solid = (x0, z0, x1, z1, y0, y1) => col.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), y0, y1 });
    // pared en x (de z0 a z1) o en z (de x0 a x1) con huecos de puerta [a,b]; dintel por encima de 2.1
    const T = 0.14;
    const wallX = (x, z0, z1, gaps, y0, y1, c, door = 2.1) => {
      let a = z0; for (const [g0, g1] of [...gaps, [z1, z1]]) { if (g0 > a) { box(T, y1 - y0, g0 - a, c, x, (y0 + y1) / 2, (a + g0) / 2); solid(x - T / 2, a, x + T / 2, g0, y0, y1); } if (g1 > g0) box(T, y1 - y0 - door, g1 - g0, c, x, (y0 + door + y1) / 2, (g0 + g1) / 2); a = g1; }
    };
    const wallZ = (z, x0, x1, gaps, y0, y1, c, door = 2.1) => {
      let a = x0; for (const [g0, g1] of [...gaps, [x1, x1]]) { if (g0 > a) { box(g0 - a, y1 - y0, T, c, (a + g0) / 2, (y0 + y1) / 2, z); solid(a, z - T / 2, g0, z + T / 2, y0, y1); } if (g1 > g0) box(g1 - g0, y1 - y0 - door, T, c, (g0 + g1) / 2, (y0 + door + y1) / 2, z); a = g1; }
    };
    const furn = (w, h, d, c, x, y, z, o) => { const m = box(w, h, d, c, x, y + h / 2, z, root, o); solid(x - w / 2, z - d / 2, x + w / 2, z + d / 2, y, y + h); return m; };
    // textura dibujada a mano (esferas, el cuaderno, carteles)
    const canvasTex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); draw(g, w, h); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; tex.push(t); return t; };
    const plane = (w, h, t, x, y, z, ry = 0, par = root, o = {}) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: o.r ?? 0.7, transparent: !!o.tr, emissive: o.e ? 0xffffff : 0, emissiveMap: o.e ? t : null, emissiveIntensity: o.e || 0 })); m.position.set(x, y, z); m.rotation.y = ry; if (o.rx) m.rotation.x = o.rx; par.add(m); return m; };

    // ---------- colores ----------
    const plaster = 0xd8ccb0, plaster2 = 0xcabc9c, plasterUp = 0xd2c6a8, tile = 0x8a5a3c, floorW = 0x5e4630, wood = 0x6a4a2c, woodD = 0x3e2a18, walnut = 0x55361e, brass = 0xb8913f, iron = 0x2a2a28;

    // =================== LA CASA (calle de los Herreros) ===================
    // planta baja: cocina (0..4,0..4), pasillo (4..6), sala (6..10,0..4), despacho = cuarto de coser (6..10,4..8),
    // zaguán con la escalera (0..4,4..8). Planta alta (y 3): cuarto de Santiago (0..4,0..4), pasillo, habitación del
    // padre (6..10,0..5), baño (6..10,5..8), rellano de la escalera.
    const H0 = 0, H1 = 3.0, CEIL = 2.85;
    box(10.3, 0.1, 8.3, tile, 5, -0.05, 4);                                                // baldosa de barro
    for (let x = 0.5; x < 10; x += 0.5) box(0.01, 0.002, 8.2, 0x6e4630, x, 0.001, 4);
    for (let z = 0.5; z < 8; z += 0.5) box(10.2, 0.002, 0.01, 0x6e4630, 5, 0.0012, z);
    // forjado entre plantas (con el hueco de la escalera: x 0..1.5, z 4.2..7.4)
    box(10.3, 0.15, 4.2, floorW, 5, CEIL + 0.075, 2.1); box(8.8, 0.15, 3.2, floorW, 5.75, CEIL + 0.075, 5.8); box(10.3, 0.15, 0.6, floorW, 5, CEIL + 0.075, 7.7);
    for (let x = 0.3; x < 10; x += 0.3) box(0.008, 0.002, 8.2, 0x4a3420, x, H1 + 0.002, 4);
    box(10.3, 0.12, 8.3, 0xe0d6bc, 5, 5.85, 4);                                            // techo de arriba
    box(10.3, 0.02, 8.3, 0xe6dcc4, 5, CEIL - 0.01, 4, root, { r: 1 });                     // cielorraso de abajo
    // vigas vistas en la cocina
    for (const z of [0.9, 2.0, 3.1]) box(4, 0.14, 0.12, woodD, 2, CEIL - 0.08, z);
    // muros exteriores (las dos plantas) con ventanas
    const ext = (fn) => { fn(H0, CEIL); fn(H1, 5.85); };
    ext((y0, y1) => { wallZ(0, -0.07, 10.07, [], y0, y1, plaster2); wallZ(8, -0.07, 10.07, [], y0, y1, plaster2); wallX(0, 0, 8, [], y0, y1, plaster2); wallX(10, 0, 8, [], y0, y1, plaster2); });
    // ventanas (luz de la mañana): marco + cristal emisivo pálido
    const win = (x, y, z, ry, w = 1.0, h = 1.2) => { const g = grp(x, y, z, root, ry); box(w, h, 0.02, 0xdfe8ea, 0, 0, 0, g, { e: 0xcfdde4, ei: 0.9, r: 0.3 }); box(w + 0.12, 0.08, 0.16, wood, 0, -h / 2, 0.02, g); box(w + 0.12, 0.08, 0.16, wood, 0, h / 2, 0.02, g);
      box(0.06, h, 0.14, wood, -w / 2, 0, 0.02, g); box(0.06, h, 0.14, wood, w / 2, 0, 0.02, g); box(0.04, h, 0.1, wood, 0, 0, 0.02, g); box(w, 0.04, 0.1, wood, 0, 0.1, 0.02, g); return g; };
    const winGlow = [];
    winGlow.push(win(1.0, 1.55, 0.08, 0), win(8.0, 1.55, 0.08, 0), win(9.93, 1.55, 6.0, -Math.PI / 2), win(1.6, 4.5, 0.08, 0), win(8.4, 4.5, 0.08, 0), win(9.93, 4.6, 6.6, -Math.PI / 2, 0.6, 0.6));
    // tabiques de planta baja
    wallX(4, 0, 4, [], H0, CEIL, plaster);
    wallZ(4, 0, 4, [[2.4, 3.4]], H0, CEIL, plaster);
    wallX(6, 0, 4, [[1.5, 2.5]], H0, CEIL, plaster);
    wallX(6, 4, 8, [[5.4, 6.4]], H0, CEIL, plaster);
    wallZ(4, 6, 10, [], H0, CEIL, plaster);
    // tabiques de planta alta
    wallX(4, 0, 4, [[2.6, 3.6]], H1, 5.85, plasterUp);
    wallZ(4, 1.5, 4, [], H1, 5.85, plasterUp);
    wallX(6, 0, 5, [[3.6, 4.6]], H1, 5.85, plasterUp);
    wallX(6, 5, 8, [[6.0, 6.9]], H1, 5.85, plasterUp);
    wallZ(5, 6, 10, [], H1, 5.85, plasterUp);
    // zócalo oscuro en la planta baja
    for (const [x0, z0, x1, z1] of [[0.08, 0.08, 3.92, 0.1], [6.08, 0.08, 9.92, 0.1]]) box(x1 - x0, 0.9, 0.02, 0x8c7a5a, (x0 + x1) / 2, 0.45, (z0 + z1) / 2 + 0.01);
    // escalera de madera: sube en +z por x 0.1..1.4, de z 4.3 (y 0) a z 7.3 (y 3)
    const STAIR = { x0: 0.08, x1: 1.42, z0: 4.3, z1: 7.3 };
    for (let i = 0; i < 15; i++) { const z = STAIR.z0 + (i + 0.5) * 0.2, y = (i + 1) * 0.2; box(1.34, 0.05, 0.24, wood, 0.75, y - 0.025, z); box(1.34, y, 0.02, woodD, 0.75, y / 2, z - 0.1); }
    box(0.06, 3.2, 3.2, woodD, 1.45, 1.45, 5.8, root, { rx: -Math.atan2(3, 3) * 0 });
    // barandilla arriba (alrededor del hueco) y pasamanos de la escalera
    box(0.05, 0.9, 2.5, woodD, 1.5, H1 + 0.45, 5.45); solid(1.45, 4.2, 1.6, 6.7, H1 - 0.2, H1 + 1.2);   // la barandilla acaba antes del rellano: hay que poder salir de la escalera
    box(1.5, 0.9, 0.05, woodD, 0.75, H1 + 0.45, 4.22); solid(0, 4.15, 1.55, 4.3, H1 - 0.2, H1 + 1.2);
    for (let i = 0; i < 6; i++) box(0.035, 0.9, 0.035, woodD, 1.5, i * 0.38 + 0.6 + 0.45, 4.6 + i * 0.36);
    // la escalera choca con el resto del zaguán por debajo de su altura (no se puede atravesar de lado)
    // (se resuelve en el suelo: fuera de la escalera la altura es 0 o 3)

    // ---------- muebles de la planta baja ----------
    // cocina: mesa con el trapo de cuadros, dos sillas, fogón de hierro, alacena, fregadero
    furn(1.3, 0.76, 0.85, wood, 2.0, 0, 2.1); box(1.36, 0.04, 0.9, woodD, 2.0, 0.78, 2.1);
    const check = canvasTex(64, 64, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#e8e0cc' : '#a8363a'; g.fillRect(i * 8, j * 8, 8, 8); } });
    plane(0.62, 0.48, check, 2.25, 0.805, 2.0, 0, root, { rx: -Math.PI / 2 });
    for (const z of [1.25, 2.95]) { furn(0.42, 0.45, 0.42, wood, 2.0, 0, z); box(0.42, 0.5, 0.04, wood, 2.0, 0.7, z + (z < 2 ? -0.2 : 0.2)); }
    furn(0.9, 0.85, 0.6, iron, 0.55, 0, 3.55, { m: 0.5, r: 0.5 }); box(0.92, 0.04, 0.62, 0x1a1a18, 0.55, 0.87, 3.55, root, { m: 0.6, r: 0.4 });
    cyl(0.12, 0.12, 0.06, 0x1c1c1a, 0.45, 0.92, 3.5, root, { m: 0.6, r: 0.4 }); box(0.3, 0.02, 0.05, 0x1c1c1a, 0.25, 0.94, 3.5);                // sartén
    furn(0.5, 2.0, 1.2, walnut, 3.65, 0, 1.0);                                               // alacena
    for (const y of [0.9, 1.4]) box(0.02, 0.04, 1.0, woodD, 3.39, y, 1.0);
    furn(1.0, 0.9, 0.55, 0xb8b0a0, 0.6, 0, 0.35);                                            // fregadero de piedra
    for (const [x, z] of [[2.2, 1.85], [1.8, 2.35]]) { cyl(0.05, 0.04, 0.08, 0xe8e0d0, x, 0.84, z); }   // tazas desportilladas
    // pasillo: perchero y la puerta de la calle
    box(0.06, 2.1, 1.0, 0x4a3018, 4.08, 1.05, 7.4); box(0.08, 0.08, 0.08, brass, 4.15, 1.05, 7.1, root, { m: 0.7, r: 0.3 });
    // sala: sofá, mesa camilla, aparador
    furn(2.0, 0.8, 0.8, 0x5a4a3a, 8.1, 0, 3.5);   // el sofá contra la pared del fondo: antes tapaba la puerta de la sala furn(0.9, 0.72, 0.9, wood, 8.0, 0, 2.2); furn(1.6, 0.9, 0.5, walnut, 8.0, 0, 0.35);
    // despacho = cuarto de coser: el banco de trabajo de ella (tapete verde, lámpara de brazo), la silla, la máquina de coser
    furn(1.5, 0.78, 0.7, walnut, 9.2, 0, 6.6); box(1.1, 0.012, 0.5, 0x2e5a36, 9.15, 0.79, 6.55);
    const benchTop = 0.796;
    box(0.4, 0.02, 0.06, woodD, 9.55, benchTop + 0.01, 6.32);                                // soporte de destornilladores
    for (let i = 0; i < 6; i++) box(0.006, 0.08 - i * 0.008, 0.006, 0x8a8a88, 9.4 + i * 0.06, benchTop + 0.05, 6.32, root, { m: 0.8, r: 0.3 });
    cyl(0.018, 0.018, 0.08, 0x9a7a40, 8.75, benchTop + 0.04, 6.35, root, { t: 0.7 });          // frasco de aceite de pie de buey
    cyl(0.022, 0.026, 0.03, 0x222222, 9.0, benchTop + 0.015, 6.75);                           // lupa de relojero
    const lampArm = grp(9.7, benchTop, 6.95); box(0.08, 0.02, 0.08, iron, 0, 0.01, 0, lampArm); box(0.02, 0.5, 0.02, iron, 0, 0.26, 0, lampArm, { rz: 0.3 }); box(0.02, 0.4, 0.02, iron, -0.2, 0.55, 0, lampArm, { rz: -1.1 });
    const shade = cyl(0.05, 0.11, 0.12, 0x2e3a2a, -0.4, 0.5, -0.05, lampArm, { m: 0.3, r: 0.5 });
    const lampBulb = cyl(0.03, 0.03, 0.03, 0xfff0c0, -0.4, 0.44, -0.05, lampArm, { e: 0xffd890, ei: 0.0 });
    furn(0.45, 0.45, 0.45, wood, 8.6, 0, 6.6);                                                // la silla de ella
    box(0.45, 0.5, 0.04, wood, 8.42, 0.7, 6.6, root, { ry: Math.PI / 2 });
    furn(0.9, 0.8, 0.5, 0x2a2420, 7.0, 0, 7.6);                                               // máquina de coser con su mueble
    box(0.35, 0.22, 0.14, 0x111111, 7.0, 0.92, 7.6, root, { m: 0.4, r: 0.4 });
    // cajones del banco (se abren en el tramo de noche)
    const drawerR = box(0.42, 0.14, 0.05, woodD, 9.55, 0.62, 6.24), drawerL = box(0.42, 0.14, 0.05, woodD, 8.85, 0.62, 6.24);

    // ---------- muebles de la planta alta ----------
    // habitación del padre: cama de matrimonio (cabecero en x 10), mesillas, cómoda con la campana de cristal
    furn(2.0, 0.55, 1.6, 0xe0d8c8, 8.9, H1, 2.25); box(0.08, 1.1, 1.7, walnut, 9.92, H1 + 0.55, 2.25);
    box(0.5, 0.12, 1.5, 0xf0ece0, 9.55, H1 + 0.6, 2.25);                                       // almohada
    box(1.5, 0.04, 1.62, 0x8a6a5a, 8.6, H1 + 0.57, 2.25);                                      // colcha
    const nsF = furn(0.45, 0.6, 0.4, walnut, 9.6, H1, 1.0), nsM = furn(0.45, 0.6, 0.4, walnut, 9.6, H1, 3.5);
    furn(1.2, 0.95, 0.5, walnut, 7.6, H1, 0.33);                                               // cómoda
    // cuarto de Santiago: cama estrecha, mesa con libros de la Politécnica, ventana a las vías
    furn(0.95, 0.5, 2.0, 0xd8d0c0, 0.6, H1, 2.6); furn(1.0, 0.75, 0.55, wood, 2.6, H1, 0.4);
    for (let i = 0; i < 4; i++) box(0.05, 0.22, 0.16, [0x6a2a22, 0x2a3a5a, 0x3a4a2a, 0x5a4a2a][i], 2.3 + i * 0.07, H1 + 0.86, 0.35);
    // baño: lavabo, bañera
    furn(0.6, 0.85, 0.45, 0xe8e4dc, 9.6, H1, 7.5); furn(1.7, 0.6, 0.75, 0xeceae2, 7.3, H1, 7.55);

    // ---------- luces ----------
    const hemi = new THREE.HemisphereLight(0xfff2dc, 0x4a4030, 0.75); hemi.position.set(5, 6, 4); root.add(hemi);
    const sunIn = new THREE.DirectionalLight(0xffe6c0, 0.9); sunIn.position.set(14, 12, -10); sunIn.target.position.set(4, 0, 4); root.add(sunIn); root.add(sunIn.target);
    const bulb = new THREE.PointLight(0xffd8a0, 1.4, 9, 1.6); bulb.position.set(2, 2.5, 2); root.add(bulb);                       // bombilla de la cocina
    const deskLamp = new THREE.PointLight(0xffcc80, 0, 4.5, 1.8); deskLamp.position.set(9.3, 1.25, 6.9); root.add(deskLamp);       // lámpara del despacho

    // =================== LOS ONCE RELOJES ===================
    const clocks = [];
    const dialTex = (style) => canvasTex(128, 128, (g, w) => {
      const c = w / 2; g.fillStyle = style.bg || '#efe8d6'; g.beginPath(); g.arc(c, c, c - 2, 0, 7); g.fill();
      g.strokeStyle = '#2a2018'; g.lineWidth = 3; g.stroke();
      if (style.violets) { g.fillStyle = 'rgba(110,60,120,.55)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(c - 18 + (i % 3) * 9 + Math.random() * 4, c + 22 + ((i / 3) | 0) * 7, 4, 0, 7); g.fill(); } g.strokeStyle = 'rgba(40,30,20,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(20, 40); g.lineTo(60, 72); g.lineTo(70, 110); g.stroke(); }
      g.fillStyle = '#1e1810'; g.font = 'bold 15px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; if (style.ar) g.fillText(String(i || 12), c + Math.sin(a) * (c - 18), c - Math.cos(a) * (c - 18)); else { g.save(); g.translate(c + Math.sin(a) * (c - 18), c - Math.cos(a) * (c - 18)); g.rotate(a); g.font = 'bold 11px serif'; g.fillText(R[i], 0, 0); g.restore(); } }
    });
    // un reloj: grupo orientado (ry) con esfera hacia +z local; agujas como hijos; péndulo opcional
    const mkClock = (id, x, y, z, ry, o) => {
      const g = grp(x, y, z, root, ry), r = o.r || 0.14;
      if (o.kind === 'wall' || o.kind === 'tall') {
        const ch = o.kind === 'tall' ? 2.0 : (o.h || 0.62);
        box(r * 2.4, ch, 0.14, o.case || walnut, 0, o.kind === 'tall' ? -ch / 2 + r * 1.2 : -ch / 2 + r * 1.3, -0.07, g, { r: 0.55 });
        box(r * 2.5, 0.05, 0.16, woodD, 0, r * 1.25, -0.06, g);
        if (o.kind === 'tall') { box(r * 2.6, 0.05, 0.16, woodD, 0, -ch + r * 1.2, -0.06, g); box(r * 2.0, ch * 0.62, 0.005, 0x6a6a5a, 0, -ch * 0.48 + r * 1.2, 0.004, g, { t: 0.25, r: 0.1 }); }
      } else if (o.kind === 'alarm') {
        cyl(r, r, 0.07, 0xb8b8b0, 0, 0, -0.03, g, { rx: Math.PI / 2, m: 0.8, r: 0.3 });
        for (const s of [-1, 1]) cyl(r * 0.45, r * 0.45, 0.03, 0xc8c8c0, s * r * 0.6, r * 1.1, -0.03, g, { m: 0.85, r: 0.25 });
        for (const s of [-1, 1]) box(0.012, 0.06, 0.012, 0x888880, s * r * 0.7, -r - 0.025, -0.03, g, { m: 0.8 });
      } else if (o.kind === 'pocket') {
        cyl(r, r, 0.025, 0xd0b060, 0, 0, -0.012, g, { rx: Math.PI / 2, m: 0.9, r: 0.25 });
        cyl(0.012, 0.012, 0.02, 0xd0b060, 0, r + 0.01, -0.012, g, { m: 0.9, r: 0.25 });
      } else if (o.kind === 'travel') {
        box(r * 2.3, r * 2.5, 0.06, brass, 0, 0, -0.03, g, { m: 0.85, r: 0.3 });
        box(r * 2.3, 0.014, 0.06, brass, 0, r * 1.25, -0.03, g, { m: 0.85, r: 0.3 });
        const lid = grp(0, r * 1.25, 0.0, g); box(r * 2.3, r * 2.5, 0.01, brass, 0, -r * 1.25, 0.005, lid, { m: 0.85, r: 0.3 }); lid.rotation.x = -1.9; g.userData.lid = lid;
      } else if (o.kind === 'cuckoo') {
        box(0.34, 0.36, 0.16, 0x4a2e18, 0, -0.04, -0.08, g); box(0.42, 0.04, 0.24, 0x3a2414, 0, 0.17, -0.07, g, { rz: 0.0 });
        box(0.24, 0.05, 0.2, 0x3a2414, -0.1, 0.2, -0.07, g, { rz: 0.5 }); box(0.24, 0.05, 0.2, 0x3a2414, 0.1, 0.2, -0.07, g, { rz: -0.5 });
        box(0.06, 0.06, 0.01, 0x1a120a, 0, 0.09, 0.005, g);
      }
      const dial = plane(r * 2, r * 2, dialTex(o.dial || {}), 0, 0, 0.002, 0, g, { r: 0.6 });
      const hands = [];
      for (const [len, w] of [[r * 0.55, 0.012], [r * 0.82, 0.008]]) { const h = grp(0, 0, 0.006, g); box(w, len, 0.003, 0x14100a, 0, len / 2 - 0.006, 0, h); hands.push(h); }
      let pend = null;
      if (o.kind === 'wall' || o.kind === 'tall') { pend = grp(0, -r * 1.15, -0.02, g); const L0 = o.kind === 'tall' ? 0.95 : 0.26; box(0.008, L0, 0.006, brass, 0, -L0 / 2, 0, pend, { m: 0.8, r: 0.3 }); cyl(0.045, 0.045, 0.012, brass, 0, -L0, 0.002, pend, { rx: Math.PI / 2, m: 0.85, r: 0.25 }); }
      const c = { id, g, hands, pend, wound: false, sway: Math.random() * 6, pos: () => { g.updateWorldMatrix(true, false); return _v8.set(0, 0, 0.02).applyMatrix4(g.matrixWorld).clone(); }, ...o };
      c.setTime = (hh, mm) => { c.hands[0].rotation.z = -((hh % 12) + mm / 60) / 12 * Math.PI * 2; c.hands[1].rotation.z = -mm / 60 * Math.PI * 2; };
      c.setTime(6, 38 + Math.random() * 3); clocks.push(c); return c;
    };
    const ck = {};
    ck.cocina = mkClock('cocina', 2.0, 1.95, 0.1, 0, { kind: 'wall', r: 0.15, h: 0.7, dial: { violets: true }, name: { es: 'el de la cocina', en: 'the kitchen clock' } });
    ck.pasillo = mkClock('pasillo', 5.9, 1.85, 3.2, -Math.PI / 2, { kind: 'wall', r: 0.13, name: { es: 'el del pasillo', en: 'the hallway clock' } });
    ck.sala = mkClock('sala', 9.8, 1.75, 1.0, -Math.PI / 2, { kind: 'tall', r: 0.16, case: 0x4a2e18, name: { es: 'el de la sala, el del carillón', en: 'the sitting-room clock, the chiming one' } });
    solid(9.6, 0.8, 10, 1.2, 0, 2);
    ck.despacho = mkClock('despacho', 9.9, 1.8, 5.0, -Math.PI / 2, { kind: 'wall', r: 0.12, h: 0.5, case: 0x6a4a2a, dial: { ar: true }, name: { es: 'el del despacho', en: 'the workroom clock' } });
    ck.escalera = mkClock('escalera', 0.1, 2.45, 6.0, Math.PI / 2, { kind: 'wall', r: 0.15, h: 0.8, case: 0x3a2414, name: { es: 'el de la escalera', en: 'the stair clock' } });
    ck.bano = mkClock('bano', 9.9, H1 + 1.75, 6.4, -Math.PI / 2, { kind: 'cuckoo', r: 0.07, dial: { ar: true }, name: { es: 'el del baño', en: 'the bathroom clock' } });
    ck.desp1 = mkClock('desp1', 9.55, H1 + 0.69, 0.9, -Math.PI / 2, { kind: 'alarm', r: 0.06, dial: { ar: true }, name: { es: 'el primer despertador', en: 'the first alarm clock' } });
    ck.desp2 = mkClock('desp2', 9.55, H1 + 0.69, 1.12, -Math.PI / 2 + 0.3, { kind: 'alarm', r: 0.055, dial: { ar: true }, name: { es: 'el segundo despertador', en: 'the second alarm clock' } });
    ck.abuelo = mkClock('abuelo', 7.6, H1 + 1.04, 0.38, 0, { kind: 'pocket', r: 0.035, name: { es: 'el de bolsillo del abuelo Lazcano', en: 'Grandfather Lazcano’s pocket watch' } });
    const jar = cyl(0.07, 0.07, 0.2, 0xdfeaf0, 7.6, H1 + 1.06, 0.38, root, { t: 0.25, r: 0.05 }); const jarTop = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8, 0, 6.3, 0, 1.6), M(0xdfeaf0, { t: 0.25, r: 0.05 })); jarTop.position.set(7.6, H1 + 1.16, 0.38); root.add(jarTop);
    cyl(0.085, 0.09, 0.03, walnut, 7.6, H1 + 0.965, 0.38);
    ck.suyo = mkClock('suyo', 0.1, H1 + 1.7, 1.9, Math.PI / 2, { kind: 'wall', r: 0.11, h: 0.45, case: 0x5a3a20, dial: { ar: true }, name: { es: 'el de su cuarto', en: 'the one in his own room' } });
    ck.viaje = mkClock('viaje', 9.6, H1 + 0.68, 3.48, -Math.PI / 2 - 0.25, { kind: 'travel', r: 0.04, name: { es: 'el pequeño reloj de viaje de latón', en: 'the small brass travel clock' } });
    // el vaso de agua con sus anillos de cal
    const glass = cyl(0.03, 0.026, 0.1, 0xd8e6ea, 9.55, H1 + 0.66, 3.66, root, { t: 0.3, r: 0.05 });
    cyl(0.026, 0.024, 0.012, 0xbcd0d6, 9.55, H1 + 0.618, 3.66, root, { t: 0.55, r: 0.1 });
    for (let i = 0; i < 6; i++) cyl(0.0305 - i * 0.0005, 0.0305 - i * 0.0005, 0.0015, 0xf0f0ea, 9.55, H1 + 0.63 + i * 0.006, 3.66, root, { t: 0.7 });

    // =================== EL PADRE (Joaquín Fierros) y FERMÍN ===================
    const skin = 0xc49a7c;
    const person = (o) => {
      const g = grp(o.x, o.y || 0, o.z, root, o.ry || 0), sitting = !!o.sit;
      const legC = o.leg || 0x2e2a26, bootC = 0x1c1612;
      for (const s of [-1, 1]) {
        if (sitting) { box(0.15, 0.15, 0.46, legC, s * 0.11, 0.5, 0.2, g); box(0.14, 0.46, 0.14, legC, s * 0.11, 0.24, 0.42, g); box(0.13, 0.08, 0.26, bootC, s * 0.11, 0.04, 0.48, g); }
        else { box(0.15, 0.86, 0.16, legC, s * 0.11, 0.43, 0, g); box(0.14, 0.08, 0.27, bootC, s * 0.11, 0.04, 0.05, g); }
      }
      const torso = grp(0, sitting ? 0.55 : 0.88, 0, g);
      box(0.44, 0.6, 0.3, o.shirt || 0xe8e4d8, 0, 0.3, 0, torso);
      if (o.belly) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.21, 12, 10), M(o.shirt || 0xe8e4d8)); b.scale.set(1, 0.95, 0.85); b.position.set(0, 0.2, 0.1); torso.add(b); }
      if (o.apron) { box(0.36, 0.62, 0.02, o.apron, 0, 0.12, 0.28, torso); box(0.2, 0.2, 0.02, o.apron, 0, 0.48, 0.17, torso); }
      if (o.coat) box(0.47, 0.7, 0.33, o.coat, 0, 0.27, 0, torso);
      const head = grp(0, 0.78, 0, torso);
      box(0.23, 0.26, 0.24, skin, 0, 0, 0, head);
      box(0.24, 0.07, 0.25, o.hair || 0x9a9890, 0, 0.13, -0.01, head);
      box(0.13, 0.03, 0.02, o.mous || 0x9a9890, 0, -0.05, 0.125, head);                                         // bigote gris recortado
      for (const s of [-1, 1]) box(0.035, 0.025, 0.01, 0x1a1210, s * 0.05, 0.03, 0.122, head);
      if (o.glasses) for (const s of [-1, 1]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 12), M(0x222222, { m: 0.6 })); r.position.set(s * 0.05, 0.03, 0.13); head.add(r); }
      if (o.cap) { box(0.25, 0.06, 0.26, o.cap, 0, 0.15, 0, head); box(0.24, 0.02, 0.12, o.cap, 0, 0.12, 0.17, head); }
      const arms = [];
      for (const s of [-1, 1]) { const a = grp(s * 0.27, 0.56, 0, torso); box(0.12, 0.3, 0.12, o.bareArms ? skin : (o.coat || o.shirt || 0xe8e4d8), 0, -0.15, 0, a); const f = grp(0, -0.3, 0, a); box(0.11, 0.28, 0.11, o.bareArms ? skin : (o.coat || 0xe8e4d8), 0, -0.14, 0, f); box(0.09, 0.08, 0.09, skin, 0, -0.31, 0, f); a.userData.f = f; arms.push(a); }
      return { g, torso, head, arms };
    };
    // Joaquín: 52 años, barriga, camiseta de tirantes y el delantal de ella encima
    const apronTex = 0x9a5a6a;
    const papa = person({ x: 0.75, z: 3.0, ry: Math.PI, belly: true, apron: apronTex, shirt: 0xe9e4d6, bareArms: true, leg: 0x2c2a2a });
    papa.arms[0].rotation.x = -0.9; papa.arms[0].userData.f.rotation.x = -0.6;                     // el tenedor en alto, como una batuta
    const fork = box(0.01, 0.16, 0.01, 0x9a9a98, 0, -0.42, 0.04, papa.arms[0].userData.f, { m: 0.8 });
    // Fermín: 71 años, guardagujas jubilado, sentado en el despacho de la estación
    const STX = 40;
    const fermin = person({ x: STX + 1.0, z: 1.4, ry: Math.PI / 2 + 0.4, sit: true, coat: 0x3a3a34, leg: 0x2a2824, hair: 0xd8d4cc, mous: 0xd0ccc4, cap: 0x2a2a2a });
    // el padre en la estación (con gorra y gafas de leer, sentado a la mesa del registro)
    const papaSt = person({ x: STX + 3.4, z: 1.2, ry: 0, sit: true, belly: true, shirt: 0x2c3442, coat: 0x2c3442, leg: 0x2a2a30, glasses: true });
    // el padre de noche, en el umbral (camiseta de tirantes, descalzo, el sobre amarillo)
    const papaN = person({ x: 6.6, y: H1, z: 4.1, ry: -Math.PI / 2, belly: true, shirt: 0xe4e0d4, bareArms: true, leg: 0x3a3632 });
    papaN.arms[1].rotation.x = -0.35; papaN.arms[1].userData.f.rotation.x = -0.9;
    const envelope = box(0.24, 0.32, 0.01, 0xd8b84a, 0, -0.42, 0.08, papaN.arms[1].userData.f); box(0.04, 0.04, 0.012, 0x9c1a14, 0, -0.32, 0.086, papaN.arms[1].userData.f);
    papaN.g.visible = false; papaSt.g.visible = false; fermin.g.visible = false;

    // =================== LA ESTACIÓN (despacho del jefe de circulación y el andén) ===================
    const st = grp(0, 0, 0);
    box(6, 0.1, 4, 0x6a5a48, STX + 2.5, -0.05, 2, st);
    wallZ(0, STX - 0.5, STX + 5.5, [], 0, 3, 0xc8b898); wallX(STX - 0.5, 0, 4, [], 0, 3, 0xc8b898); wallX(STX + 5.5, 0, 4, [], 0, 3, 0xc8b898);
    // fachada al andén: puerta y ventana grande con la persiana
    wallZ(4, STX - 0.5, STX + 5.5, [[STX + 0.2, STX + 1.2], [STX + 2.0, STX + 4.6]], 0, 3, 0xc8b898, 2.1);
    box(2.6, 0.9, 0.16, 0xc8b898, STX + 3.3, 0.45, 4);                                            // antepecho de la ventana
    const blind = box(2.6, 0.02, 0.06, 0x8a7a5a, STX + 3.3, 2.05, 4.05); blind.userData.y = 2.05;
    box(6.2, 0.15, 4.2, 0x7a6a50, STX + 2.5, 3.05, 2, st);
    furn(1.6, 0.76, 0.8, wood, STX + 3.4, 0, 1.9); box(1.66, 0.04, 0.86, woodD, STX + 3.4, 0.78, 1.9);
    const book = box(0.44, 0.05, 0.32, 0x3a2418, STX + 3.4, 0.825, 1.75);
    // la radio de la Nacional con su ojo verde, el telégrafo y la estampa de San Cristóbal
    furn(1.4, 1.0, 0.4, walnut, STX + 1.0, 0, 0.3);
    box(0.6, 0.42, 0.32, 0x5a3a1e, STX + 0.8, 1.21, 0.3); const eye = box(0.05, 0.05, 0.01, 0x30ff60, STX + 0.8, 1.3, 0.47, root, { e: 0x30ff60, ei: 1.4 });
    box(0.3, 0.12, 0.2, 0x1e1e1c, STX + 1.4, 1.06, 0.3, root, { m: 0.6 });
    box(0.22, 0.3, 0.01, 0xc8a870, STX + 1.0, 1.9, 0.08);
    // dominó en una caja de puros
    box(0.22, 0.05, 0.14, 0x8a5a2a, STX + 2.9, 0.82, 2.15);
    // andén, vías y el mineral 2117
    box(60, 0.6, 3.6, 0x8a8478, STX + 2, -0.3, 5.8); box(60, 0.04, 0.3, 0xb8b0a0, STX + 2, -0.0, 7.45);                                                // andén
    box(60, 0.3, 4, 0x4a4238, STX + 2, -0.55, 9.6); for (let x = STX - 28; x < STX + 32; x += 0.7) box(0.25, 0.12, 2.4, 0x3a2e22, x, -0.38, 9.2);
    for (const z of [8.48, 9.92]) box(60, 0.12, 0.08, 0x5a5a58, STX + 2, -0.27, z, root, { m: 0.7, r: 0.4 });
    const train = grp(STX + 2, 0.15, 0.7); const wagons = [];
    const hopper = (i, x) => {
      const w = grp(x, 0, 8.5, train), heavy = i === 7;
      box(5.4, 0.14, 2.3, 0x1e1e1c, 0, 0.45 + (heavy ? -0.06 : 0), 0, w, { m: 0.5 });                            // bastidor
      box(5.2, 1.7, 2.4, 0x7a6a58, 0, 1.45 + (heavy ? -0.06 : 0), 0, w, { r: 0.8 });                              // tolva
      box(5.25, 0.25, 2.46, 0x8a7a64, 0, 2.35 + (heavy ? -0.06 : 0), 0, w, { r: 0.8 });
      box(5.0, 0.12, 2.3, 0x5e6248, 0, 2.52 + (heavy ? -0.06 : 0), 0, w, { r: 1 });                               // lona
      for (const bx of [-1.9, 1.9]) {
        for (const s of [-1, 1]) { cyl(0.42, 0.42, 0.1, 0x1a1a18, bx + s * 0.6, 0.0, s * 0.72 * 0 + 0.8 * 1, w, { rx: Math.PI / 2, m: 0.6 }); cyl(0.42, 0.42, 0.1, 0x1a1a18, bx + s * 0.6, 0.0, -0.8, w, { rx: Math.PI / 2, m: 0.6 }); }
        // ballestas: en todos se ve el hueco (un dedo) entre la ballesta y el bastidor; en el séptimo no
        for (const z of [1.25, -1.25]) { box(1.0, 0.07, 0.1, 0x2a2a28, bx, 0.3, z, w, { m: 0.6 }); if (!heavy) box(0.9, 0.03, 0.02, 0x0a0a0a, bx, 0.36, z + Math.sign(z) * 0.05, w); }
      }
      for (const rx of [-2.0, -1.0, 0, 1.0, 2.0]) box(0.08, 1.6, 0.06, 0x5a4a3a, rx, 1.45 + (heavy ? -0.06 : 0), -1.23, w);   // costillas
      box(0.5, 0.3, 0.02, 0xd8d0b8, -2.3, 1.9 + (heavy ? -0.06 : 0), -1.22, w);
      // nudos de la lona: ballestrinque doble con una vuelta de más; en el séptimo, un nudo de marinero
      for (const kx of [-2.2, 0, 2.2]) { const kn = grp(kx, 2.42 + (heavy ? -0.06 : 0), 1.24, w); box(0.08, 0.08, 0.04, heavy ? 0x8a7a50 : 0x6a6040, 0, 0, 0, kn); box(0.03, heavy ? 0.24 : 0.14, 0.02, heavy ? 0x8a7a50 : 0x6a6040, heavy ? 0.06 : -0.02, -0.12, 0.01, kn); }
      wagons.push(w); return w;
    };
    // locomotora serie 400 (negra) a la izquierda; el séptimo vagón queda frente a la ventana
    const W7 = STX + 3.3, pitch = 5.8;
    for (let i = 1; i <= 22; i++) hopper(i, W7 - (STX + 2) - (7 - i) * pitch);
    const loco = grp(W7 - (STX + 2) - 7 * pitch - 1.5, 0, 8.5, train);
    box(7.5, 2.1, 2.0, 0x141414, -0.5, 1.75, 0, loco, { m: 0.5, r: 0.5 }); box(2.6, 2.9, 2.5, 0x161616, 2.6, 2.1, 0, loco, { m: 0.4 }); cyl(0.3, 0.36, 1.0, 0x101010, -3.4, 3.2, 0, loco, { m: 0.5 });
    const shimmer = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.9), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.05, depthWrite: false }));
    shimmer.position.set(1.9, 0.75, 1.3); wagons[6].add(shimmer);
    const stHemi = new THREE.HemisphereLight(0xe8ecf0, 0x6a5a48, 0.0); stHemi.position.set(STX, 8, 3); root.add(stHemi);
    const stSun = new THREE.DirectionalLight(0xfff0d8, 0.0); stSun.position.set(STX - 6, 14, -12); stSun.target.position.set(STX + 3, 0, 8); root.add(stSun); root.add(stSun.target);

    // =================== LA PLAZA (recuerdo: seis años) ===================
    const PX = -60, pl = grp(PX, 0, 0);
    box(30, 0.05, 30, 0x8a8070, 0, 0.02, 0, pl);                                                   // tierra apisonada
    for (let i = -14; i < 15; i += 1.2) box(0.02, 0.001, 30, 0x7a7060, i, 0.046, 0, pl);
    // fuente seca en medio
    cyl(1.6, 1.7, 0.6, 0x9a9080, 0, 0.3, 0, pl); cyl(1.4, 1.4, 0.05, 0x5a5448, 0, 0.58, 0, pl); cyl(0.25, 0.3, 1.4, 0x9a9080, 0, 1.0, 0, pl);
    // iglesia de piedra rosada con el campanario y su reloj (al norte)
    box(9, 7, 1.5, 0xc89a8a, 0, 3.5, -10, pl); box(3, 13, 3, 0xc09080, 4.8, 6.5, -10.5, pl); box(1.6, 2.8, 0.2, 0x3a2418, 0, 1.4, -9.2, pl);
    const ckT = dialTex({}); plane(1.4, 1.4, ckT, 4.8, 10.5, -8.95, 0, pl);
    // soportales y mercado (al oeste): puesto de las naranjas de doña Rufina
    box(1.0, 4.5, 14, 0xb8a888, -11, 2.25, 0, pl); for (let z = -6; z <= 6; z += 3) box(0.3, 3, 0.3, 0xa89878, -9.2, 1.5, z, pl); box(2.2, 0.25, 14, 0xa89878, -10.2, 3.1, 0, pl);
    box(1.6, 0.8, 1.0, 0x6a4a2a, -8.4, 0.4, 1.5, pl); for (let i = 0; i < 14; i++) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), M(0xe8902a)); o.position.set(-8.9 + (i % 7) * 0.15, 0.86, 1.2 + ((i / 7) | 0) * 0.3); pl.add(o); }
    const rufina = person({ x: -8.4, z: 0.6, ry: 0, apron: 0x6a5a4a, shirt: 0x2a2a3a, leg: 0x2a2a3a, hair: 0x2a2018 }); pl.add(rufina.g); rufina.g.position.set(-8.4, 0, 0.6);
    // kiosco de música (al este)
    cyl(2.4, 2.4, 0.6, 0x8a8478, 7, 0.3, 2, pl, { seg: 8 }); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; box(0.12, 2.6, 0.12, 0x5a5448, 7 + Math.cos(a) * 2.2, 1.9, 2 + Math.sin(a) * 2.2, pl); }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.2, 8), M(0x4a5a4a)); roof.position.set(7, 3.8, 2); pl.add(roof);
    // casa de los Cepeda con el balcón y la ropa tendida (al sur-este)
    box(1, 7, 9, 0xd8c8a8, 13, 3.5, -4, pl); box(1.0, 0.12, 3.4, 0x5a4a3a, 12.2, 3.3, -4.5, pl); for (const z of [-6, -4.5, -3]) box(0.04, 1.8, 0.9, 0x3a2a1a, 12.48, 4.4, z, pl);
    const sheets = [0, 1, 2].map((i) => box(0.02, 1.0, 0.8, [0xf0ece0, 0xe8e4f0, 0xf4f0e4][i], 11.75, 3.95, -5.5 + i * 1.0, pl));
    // casas alrededor de la plaza
    for (const [x, z, w, d, h, c] of [[-6, -14, 8, 1, 6, 0xcbb898], [10, -14, 8, 1, 8, 0xd4c4a4], [-14, 9, 1, 8, 5, 0xc4b494], [13, 6, 1, 8, 6, 0xd8ccb0], [0, 14, 26, 1, 6, 0xcab89a]]) box(w, h, d, c, x, h / 2, z, pl);
    // el perro amarillo en su escalón, la mula del aguador, las palomas
    const dog = grp(-1.2, 0.05, -9.0, pl); box(0.7, 0.25, 0.28, 0xc8a050, 0, 0.12, 0, dog); box(0.22, 0.2, 0.2, 0xc8a050, 0.42, 0.18, 0, dog); box(0.06, 0.08, 0.05, 0x9a7030, 0.45, 0.32, 0.07, dog);
    const pigeons = []; for (let i = 0; i < 7; i++) { const p = box(0.18, 0.12, 0.09, 0x7a7a80, -2 + Math.random() * 4, 0.1, 3 + Math.random() * 2, pl); pigeons.push(p); }
    // el niño gordo de los Cepeda
    const boy = person({ x: 2.5, z: -3.0, ry: Math.PI * 0.6, shirt: 0x8a9ab8, leg: 0x4a4a5a, hair: 0x3a2a1a, mous: 0xc49a7c }); pl.add(boy.g); boy.g.position.set(2.5, 0, -3); boy.g.scale.setScalar(0.62); boy.torso.scale.x = 1.3;
    // la sombra del campanario sobre los soportales
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(-2, 0.06, -3); shadow.rotation.z = 0.7; pl.add(shadow);
    // el hombre nuevo junto al kiosco: traje marrón, botas de punta con barro rojo, la mano en la maleta, comparando su reloj
    const stranger = person({ x: 4.2, z: 0.6, ry: -0.6, coat: 0x5a3e28, leg: 0x4a3420, hair: 0x2a2018, mous: 0x2a2018 }); pl.add(stranger.g); stranger.g.position.set(4.2, 0, 0.6);
    box(0.5, 0.36, 0.16, 0x4a3018, -0.35, 0.18, 0.1, stranger.g); box(0.14, 0.06, 0.28, 0x8a3a22, -0.11, 0.03, 0.12, stranger.g); box(0.14, 0.06, 0.28, 0x8a3a22, 0.11, 0.03, 0.12, stranger.g);
    stranger.arms[0].rotation.x = -1.1; stranger.g.visible = false;
    // el banco (el tercero empezando por la izquierda) frente a la puerta de la iglesia
    for (let i = 0; i < 4; i++) { box(1.6, 0.06, 0.45, 0x5a4a32, -4.5 + i * 2.3, 0.45, 5.0, pl); box(1.6, 0.4, 0.05, 0x5a4a32, -4.5 + i * 2.3, 0.7, 5.22, pl); }
    const plSun = new THREE.DirectionalLight(0xfff0d0, 0.0); plSun.position.set(PX - 10, 20, 8); plSun.target.position.set(PX, 0, 0); root.add(plSun); root.add(plSun.target);
    const plHemi = new THREE.HemisphereLight(0xdfe6ee, 0x6a5a40, 0.0); plHemi.position.set(PX, 10, 0); root.add(plHemi);

    // =================== EL CUADERNO DE HULE (noche) ===================
    const nbTex = canvasTex(256, 192, (g, w, h) => {
      g.fillStyle = '#2a2622'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e0cc'; g.fillRect(8, 8, w - 16, h - 16);
      g.fillStyle = 'rgba(80,70,50,.25)'; for (let y = 20; y < h - 10; y += 10) g.fillRect(12, y, w - 24, 1);
      g.fillStyle = '#3a3428'; g.font = '10px serif'; g.fillText('Quirós — Omega bolsillo — muelle real roto, cambiar', 14, 26); g.fillText('marzo 1938', 14, 38);
      g.font = '7px monospace'; g.fillStyle = '#4a4438';
      const hs = ['7:10', '7:10 P', '7:15', '7:10', '7:05 P', '7:10', '7:10', '7:10 P', '7:15', '7:10', '7:10', '7:05', '7:10 P', '7:10'];
      hs.forEach((t, i) => g.fillText(t, 196, 118 + i * 5));
      g.fillRect(194, 186 - 2, 40, 0.6); g.font = 'italic 7px serif'; g.fillText('Sigue viniendo.', 196, 186 - 6 + 0);
    });
    const notebook = plane(0.28, 0.21, nbTex, 9.05, benchTop + 0.004, 6.55, 0, root, { rx: -Math.PI / 2 }); notebook.visible = false;

    // ---------- suelo de la casa (con la escalera) y de los otros lugares ----------
    const floor = (x, z, y) => {
      if (x > STX - 2) return 0;
      if (x < PX + 20) return 0;
      if (x >= STAIR.x0 && x <= STAIR.x1 + 0.05 && z >= STAIR.z0 && z <= STAIR.z1) return clamp((z - STAIR.z0) / (STAIR.z1 - STAIR.z0), 0, 1) * H1;
      return y > 1.5 ? H1 : 0;
    };
    // la escalera por fuera: debajo hay un muro (no se cruza en la planta baja si no es por el pie)
    solid(STAIR.x1 + 0.03, STAIR.z0 + 0.8, STAIR.x1 + 0.08, STAIR.z1, 0, 1.2);
    solid(0, 7.3, 1.5, 8, -1, 1.4);                                                         // bajo el rellano

    S.set = { root, tex, mats, col, floor, ck, clocks, glass, papa, fork, papaN, papaSt, fermin, envelope, hemi, sunIn, bulb, deskLamp, lampBulb, winGlow, drawerR, drawerL, notebook, benchTop,
      STX, PX, train, wagons, stSun, blind, book, eye, shimmer, stHemi, plSun, plHemi, dog, sheets, boy, shadow, stranger, pigeons, rufina, H1, trainV: 0, trainX: 0 };
    return S.set;
  },
  // ---- luces de cada lugar ----
  light(S, where) {
    const F = S.set, on = (l, v) => { l.intensity = v; };
    const house = where === 'day' || where === 'night';
    on(F.hemi, where === 'day' ? 0.75 : where === 'night' ? 0.13 : 0); on(F.sunIn, where === 'day' ? 0.9 : 0); on(F.bulb, where === 'day' ? 1.4 : 0);
    on(F.deskLamp, where === 'night' ? 2.4 : 0); F.lampBulb.material.emissiveIntensity = where === 'night' ? 2.5 : 0;
    for (const w of F.winGlow) w.children[0].material.emissiveIntensity = where === 'night' ? 0.04 : 0.9;
    on(F.stHemi, where === 'station' ? 1.0 : 0); on(F.stSun, where === 'station' ? 1.6 : 0); on(F.plSun, where === 'plaza' ? 1.4 : 0); on(F.plHemi, where === 'plaza' ? 0.8 : 0);
    void house;
    F.gl = { day: [0.12, 0.2], night: [0, 0.05], station: [1.2, 0.6], plaza: [1.6, 0.7] }[where];
  },
  update(S, dt) {
    const F = S.set; if (!F) return;
    if (F.gl && G.sun) { G.sun.intensity = F.gl[0]; G.hemi.intensity = F.gl[1]; }
    // péndulos de los relojes con cuerda; las agujas avanzan con el tiempo de la escena
    for (const c of F.clocks) {
      if (c.pend) c.pend.rotation.z = c.wound || c.alwaysOn ? Math.sin(S.t * 2.2 + c.sway) * 0.14 : c.pend.rotation.z * 0.98;
    }
    // el mineral sale: los topes golpean uno detrás de otro
    if (F.trainV) { F.trainX += F.trainV * dt; F.trainV = Math.min(6, F.trainV + dt * 0.35); F.train.position.x = F.trainX; }
    F.shimmer.material.opacity = 0.04 + 0.04 * Math.sin(S.t * 23) * Math.sin(S.t * 7.3);
    F.shimmer.position.y = 0.75 + 0.02 * Math.sin(S.t * 13);
    F.eye.scale.x = 0.7 + 0.3 * Math.sin(S.t * 1.7);
    for (const p of F.pigeons) { p.position.x += Math.sin(S.t * 3 + p.id) * 0.002; }
  },
  dispose(S) { const F = S.set; if (!F) return; for (const t of F.tex) t.dispose(); S.set = null; },
};

// ---------------- sonidos del capítulo (sintetizados) ----------------
const Cap1Audio = {
  ok() { return SceneAudio.ok(); }, d() { return SceneAudio.dest(); },
  // dar cuerda: catorce vueltas del trinquete
  wind(n = 14, secs = 1.6) { if (!this.ok()) return; const t0 = AUDIO.ctx.currentTime; for (let i = 0; i < n; i++) { const t = t0 + i * secs / n; AUDIO.nz(this.d(), t, 0.018, 0.05, 'bandpass', 3800, null, 6); AUDIO.osc(this.d(), 'square', 1800, 1500, t + 0.005, 0.012, 0.006); } },
  tick(vol = 0.03, f = 3200) { if (!this.ok()) return; const t = AUDIO.ctx.currentTime; AUDIO.nz(this.d(), t, 0.012, vol, 'bandpass', f, null, 8); },
  chime(f = 880, vol = 0.05, at = 0, cracked = false) { if (!this.ok()) return; const t = AUDIO.ctx.currentTime + at; for (const [k, g, d] of [[1, 1, 1.6], [2.76, 0.4, 0.8], [5.4, 0.15, 0.4]]) AUDIO.osc(this.d(), 'sine', f * k * (cracked ? 1.013 : 1), f * k * (cracked ? 0.99 : 1), t, d, vol * g, 0.003); if (cracked) AUDIO.nz(this.d(), t, 0.25, vol * 0.5, 'bandpass', f * 1.5, null, 3); },
  carillon(at = 0) { [659, 523, 587, 392].forEach((f, i) => this.chime(f, 0.06, at + i * 0.55, i === 2)); },
  cuckoo(at = 0) { if (!this.ok()) return; const t = AUDIO.ctx.currentTime + at; AUDIO.osc(this.d(), 'triangle', 740, 735, t, 0.22, 0.05); AUDIO.osc(this.d(), 'triangle', 587, 584, t + 0.26, 0.3, 0.05); },
  nickel(at = 0) { if (!this.ok()) return; const t = AUDIO.ctx.currentTime + at; for (let i = 0; i < 6; i++) AUDIO.osc(this.d(), 'square', 2400, 2350, t + i * 0.05, 0.03, 0.012); },
  sizzle(on) { if (!this.ok()) return; if (on && !this.sz) { const c = AUDIO.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AUDIO.noise; s.loop = true; f.type = 'highpass'; f.frequency.value = 3000; g.gain.value = 0.012; s.connect(f); f.connect(g); g.connect(this.d()); s.start(); this.sz = { s, g }; SceneAudio.loops.push(s); } else if (!on && this.sz) { try { this.sz.s.stop(); } catch (e) { } this.sz = null; } },
  radio(on) { if (!this.ok()) return; if (on && !this.rd) { const c = AUDIO.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AUDIO.noise; s.loop = true; f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.6; g.gain.value = 0.008; s.connect(f); f.connect(g); g.connect(this.d()); s.start(); this.rd = { s }; SceneAudio.loops.push(s); } else if (!on && this.rd) { try { this.rd.s.stop(); } catch (e) { } this.rd = null; } },
  buffers(n = 22, gap = 0.32) { if (!this.ok()) return; const t0 = AUDIO.ctx.currentTime; for (let i = 0; i < n; i++) { const t = t0 + i * gap * (1 - i * 0.012); AUDIO.osc(this.d(), 'sine', 90, 45, t, 0.18, 0.08 * (1 - i / 30)); AUDIO.nz(this.d(), t, 0.08, 0.05 * (1 - i / 30), 'lowpass', 900); } },
  market(on) { if (!this.ok()) return; if (on && !this.mk) { const c = AUDIO.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = AUDIO.noise; s.loop = true; f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 0.4; g.gain.value = 0.006; s.connect(f); f.connect(g); g.connect(this.d()); s.start(); this.mk = { s }; SceneAudio.loops.push(s); } else if (!on && this.mk) { try { this.mk.s.stop(); } catch (e) { } this.mk = null; } },
  stop() { this.sizzle(false); this.radio(false); this.market(false); },
};

// ---------------- guion ----------------
(() => {
  const C1 = (S) => S.set, V = (x, y, z) => new THREE.Vector3(x, y, z);
  const head = campHead(CAMP_BY_ID['P1-M1']);
  // andar por la casa (de día o de noche)
  const walkHouse = (S, x, y, z, yaw) => SceneWalk.start(S, { x, y, z, yaw, boxes: C1(S).col, floor: C1(S).floor, speed: 2.0 });
  // sentarse: la vista se limita alrededor de una dirección
  const sit = (S, x, y, z, yaw, pitch = -0.1, yawR = 1.6) => { SceneWalk.stop(S); S.eye.set(x, y, z); S.yawC = yaw; S.yaw = Input.state.yaw = yaw; S.pitch = Input.state.pitch = pitch; S.yawR = yawR; S.pitchMin = -1.1; S.pitchMax = 0.6; S.roll = 0; };
  // cada reloj: «Dar cuerda» (catorce vueltas) y su línea
  const LINES = {
    cocina: [{ es: 'Lo descolgó del clavo con las dos manos, como su madre le había enseñado, sin tocar el péndulo. Reloj de pared alemán, caja de nogal, esfera de esmalte agrietada con un ramo de violetas que ya solo eran manchas moradas.', en: 'He lifted it off the nail with both hands, the way his mother had taught him, without touching the pendulum. A German wall clock, walnut case, cracked enamel dial with a bunch of violets that were now only purple smudges.' },
      { es: 'Se atrasaba un minuto y medio por semana. Su madre decía que no era un defecto sino un carácter, y que a un reloj con carácter no se le corrige, se le acompaña. Catorce vueltas exactas. Un minuto y medio adelante.', en: 'It lost a minute and a half a week. His mother said it wasn’t a flaw but a character, and that a clock with character is not corrected, it is kept company. Fourteen exact turns. A minute and a half forward.' }],
    pasillo: { es: 'El del pasillo.', en: 'The hallway one.' },
    sala: { es: 'El de la sala, con su carillón de cuatro notas. Una sonaba rajada desde la noche en que su padre, borracho por primera y última vez en su vida, le dio un codazo al volver de la boda de un primo.', en: 'The sitting-room one, with its four-note chime. One note had sounded cracked since the night his father, drunk for the first and last time in his life, elbowed it coming home from a cousin’s wedding.' },
    despacho: { es: 'El del despacho, que no era despacho sino el cuarto de coser, pero que todos llamaban despacho porque ahí estaba el banco de trabajo de su madre.', en: 'The study one, which wasn’t a study but the sewing room; everyone called it the study because his mother’s workbench was there.' },
    escalera: { es: 'El de la escalera. Una vez, en marzo, había encontrado a su padre de pie en el pasillo con la mano levantada hacia este péndulo, a punto de pararlo. Su padre bajó la mano y volvió a la cama sin verlo.', en: 'The stair clock. Once, in March, he had found his father standing in the hall with his hand raised toward this pendulum, about to stop it. His father lowered his hand and went back to bed without seeing him.' },
    bano: { es: 'El del baño, que era una tontería, un reloj en el baño. Pero su madre decía que si no había reloj en el baño su marido se quedaba dormido sentado.', en: 'The bathroom one, which was silly, a clock in the bathroom. But his mother said that without a clock in there her husband would fall asleep sitting down.' },
    desp1: { es: 'Los dos despertadores de la habitación de sus padres, que ahora era solo la habitación de su padre.', en: 'The two alarm clocks in his parents’ room, which was now only his father’s room.' },
    desp2: { es: 'El segundo despertador, con su campanilla de níquel.', en: 'The second alarm clock, with its nickel bell.' },
    abuelo: { es: 'El reloj de bolsillo de su abuelo Lazcano, en su campana de cristal sobre la cómoda. No se atrasaba nunca. Con él ponía en hora todos los demás; y a él, cada lunes, con el reloj grande de la estación, que se ajustaba por telégrafo con la capital.', en: 'Grandfather Lazcano’s pocket watch, under its glass dome on the chest of drawers. It never lost time. He set all the others by it; and set it, every Monday, by the big station clock, which was regulated by telegraph from the capital.' },
    suyo: { es: 'El de su propio cuarto. Desde la ventana se ven las vías.', en: 'The one in his own room. From the window you can see the tracks.' },
    viaje: [{ es: 'Y el último, el undécimo: el pequeño reloj de viaje de latón con tapa, sobre la mesilla del lado izquierdo de la cama de matrimonio. Del lado de ella.', en: 'And the last, the eleventh: the small brass travel clock with a lid, on the nightstand on the left side of the double bed. Her side.' },
      { es: 'Junto a un vaso de agua que nadie había vuelto a llenar en catorce meses, pero que nadie había retirado tampoco.', en: 'Next to a glass of water nobody had refilled in fourteen months, but that nobody had taken away either.' }],
  };
  const CLK_ROOM = { pasillo: 'pasillo', sala: 'sala', despacho: 'despacho', escalera: 'escalera', bano: 'baño (arriba)', desp1: 'despertador 1 (cuarto del padre)', desp2: 'despertador 2 (cuarto del padre)', abuelo: 'el del abuelo (cuarto del padre)', suyo: 'su cuarto (arriba)' };
  const order = ['cocina', 'pasillo', 'sala', 'despacho', 'escalera', 'bano', 'desp1', 'desp2', 'abuelo', 'suyo', 'viaje'];
  const windUse = (id) => ({
    id, d: id === 'escalera' ? 2.2 : 1.7, r: 0.32,
    pos: (S) => C1(S).ck[id].pos(),
    label: { es: 'Dar cuerda', en: 'Wind it' },
    avail: (S) => (id === 'cocina' ? true : S.flags.wound && S.flags.wound.cocina) && (id !== 'viaje' || Object.keys(S.flags.wound || {}).length >= 10),
    use(S) {
      const c = C1(S).ck[id]; S.busy = 1.7; Cap1Audio.wind(14, 1.6);
      setTimeout(() => { c.wound = true; c.setTime(6, 40 + Object.keys(S.flags.wound || {}).length * 0.6); if (id === 'sala') Cap1Audio.carillon(0.1); if (id === 'bano') Cap1Audio.cuckoo(0.1); if (id === 'desp2') Cap1Audio.nickel(0.1); }, 1650);
      (S.flags.wound = S.flags.wound || {})[id] = true;
    },
    text: LINES[id],
  });

  SCENES.cap1 = {
    setup(S) {
      Cap1Set.build(S);
      MODES.campaign.noAmbience = true; Ambience.stop();
      Cap1Set.light(S, 'day');
      sit(S, 2.0, 1.62, 3.45, 0, -0.05);
    },
    update(S, dt) {
      Cap1Set.update(S, dt);
      // tic-tac de la casa: más denso cuantos más relojes tienen cuerda (desacompasado, como una lluvia de pasos pequeños)
      const F = S.set; if (!F || !S.walk || S.where === 'station' || S.where === 'plaza') return;
      for (const c of F.clocks) { if (!c.wound) continue; c._tt = (c._tt || Math.random()) - dt; if (c._tt <= 0) { c._tt = c.id === 'sala' || c.id === 'escalera' ? 1.0 : 0.5 + (c.sway % 0.1); const d = c.pos().distanceTo(S.eye); if (d < 7) Cap1Audio.tick(0.035 * clamp(1.6 / Math.max(0.6, d), 0, 1.2), c.kind === 'tall' ? 1800 : 3400); } }
    },
    teardown(S) { Cap1Audio.stop(); SceneWalk.stop(S); S.walk = null; Cap1Set.dispose(S); },
    steps: [
      Step.card({ es: 'Parte I · Cuerda', en: 'Part I · Winding' }, { es: 'Once relojes', en: 'Eleven Clocks' }, head),
      // ======== A · los once relojes ========
      Step.run((S) => { S.where = 'house'; walkHouse(S, 2.0, 0, 3.45, 0); }),
      Step.fade(0, 2.0, false),
      SAY('El primero era el de la cocina, porque era el que más se atrasaba.', 'The first was the kitchen one, because it was the one that ran slowest.'),
      Step.goal('Muévete con <kbd>WASD</kbd>. Acércate al reloj de la cocina y pulsa <kbd>E</kbd> para darle cuerda.', 'Move with <kbd>WASD</kbd>. Go up to the kitchen clock and press <kbd>E</kbd> to wind it.'),
      Step.uses([windUse('cocina')], 1, null),
      SAY('Once relojes. Les daba cuerda a todos, cada sábado, en el mismo orden.', 'Eleven clocks. He wound them all, every Saturday, in the same order.'),
      Step.uses(order.slice(1).map(windUse), 10, (n, k) => L({ es: `Da cuerda a los once relojes de la casa · ${n + 1}/11`, en: `Wind the eleven clocks in the house · ${n + 1}/11` }) + `<small>${L(n >= 9 ? { es: 'El último es el de ella: la mesilla izquierda de la cama de matrimonio, arriba.', en: 'The last one is hers: the left nightstand of the double bed, upstairs.' } : { es: 'Faltan: ' + order.slice(1, 10).filter((id) => !((Scenes.S && Scenes.S.flags.wound) || {})[id]).map((id) => CLK_ROOM[id]).join(', ') + '. El reloj de viaje de ella va el último.', en: 'Still to wind: ' + order.slice(1, 10).filter((id) => !((Scenes.S && Scenes.S.flags.wound) || {})[id]).map((id) => CLK_ROOM[id]).join(', ') + '. Her travel clock comes last.' })}</small>`),
      // el vaso de agua
      Step.run((S) => { sit(S, 9.0, S.set.H1 + 1.15, 3.2, -Math.PI / 2 - 0.35, -0.45, 1.3); }),
      SAY('Cuando terminó con el undécimo se quedó un momento sentado en el borde de la cama de su madre. No lo hacía siempre. Solo a veces. Se sentaba y miraba el vaso de agua.', 'When he had finished with the eleventh he stayed a moment sitting on the edge of his mother’s bed. He didn’t always. Only sometimes. He sat and looked at the glass of water.'),
      Step.find([{ pos: (S) => S.set.glass.position.clone(), r: 0.16, text: [{ es: 'El agua se había evaporado casi toda, y la que quedaba tenía un anillo de cal en el cristal, una línea blanca y fina, y otra un poco más abajo, y otra, como los anillos de un árbol cortado.', en: 'Most of the water had evaporated, and what was left had a ring of lime on the glass, a thin white line, and another a little lower, and another, like the rings of a felled tree.' },
        { es: 'Doce líneas. Una por cada mes que el agua llevaba bajando. Luego dejó de contarlos, porque si seguía iba a saber exactamente cuánto tardaría el vaso en secarse del todo, y no quería saberlo.', en: 'Twelve lines. One for each month the water had been going down. Then he stopped counting, because if he went on he would know exactly how long the glass would take to dry out completely, and he didn’t want to know.' }] }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd> para <b>mirar</b> el vaso de agua.', en: 'Hold <kbd>Q</kbd> to <b>look</b> at the glass of water.' })),
      SAY('Desde la cocina llegó el chisporroteo del aceite y la voz de su padre cantando mal un bolero.', 'From the kitchen came the sizzle of oil and his father’s voice badly singing a bolero.'),
      Step.fade(1, 1.2),
      // ======== B · desayuno ========
      Step.run((S) => { sit(S, 2.0, 1.22, 3.0, 0, -0.12, 1.5); Cap1Audio.sizzle(true); const P = S.set.papa; P.g.position.set(0.75, 0, 3.15); P.g.rotation.y = Math.PI * 0.85; }),
      Step.fade(0, 1.2, false),
      SAY('—Te digo que me miró —decía Joaquín Fierros, de espaldas, con el delantal de su mujer puesto encima de la camiseta de tirantes y el tenedor levantado como una batuta—. Me miró así, de lado. La señora Etelvina. Ayer, en el mercado. Me miró como se mira a un hombre.', '“I’m telling you she looked at me,” Joaquín Fierros was saying, his back turned, his wife’s apron over his vest and the fork raised like a baton. “Looked at me like this, sideways. Señora Etelvina. Yesterday, at the market. Looked at me the way you look at a man.”'),
      SAY('—Papá.', '“Papá.”'),
      SAY('—Como se mira a un hombre interesante.', '“The way you look at an interesting man.”'),
      Step.choice({ es: '¿Qué le contestas?', en: 'What do you say?' }, [{ es: '—La señora Etelvina tiene un ojo de cristal.', en: '“Señora Etelvina has a glass eye.”' }, { es: '—Seguro que sí, papá.', en: '“I’m sure she did, Papá.”' }], 0,
        { es: 'No. Él no le daba la razón como a los locos. Él veía las cosas. Y veía el ojo.', en: 'No. He didn’t humour him like a madman. He saw things. And he saw the eye.' }),
      Step.run((S) => { const P = S.set.papa; P.g.rotation.y = Math.PI; }),
      SAY('—¿Y qué? ¿No se puede mirar con un ojo de cristal? —Se volvió con la sartén en la mano. Cincuenta y dos años, una barriga redonda y dura como un melón y el bigote gris recortado con una precisión que delataba a su difunta esposa—. Además, no me miró con el de cristal. Me miró con el bueno.', '“So what? Can’t you look with a glass eye?” He turned with the pan in his hand. Fifty-two years old, a belly round and hard as a melon, and the grey moustache trimmed with a precision that gave away his late wife. “Besides, she didn’t look at me with the glass one. She looked at me with the good one.”'),
      SAY('—¿Y cómo sabes cuál es el bueno?', '“And how do you know which is the good one?”'),
      SAY('—Porque el bueno es el que se movía.', '“Because the good one is the one that moved.”'),
      Step.run(() => { if (SceneAudio.ok()) { const t = AUDIO.ctx.currentTime; for (let i = 0; i < 7; i++) AUDIO.nz(SceneAudio.dest(), t + i * 0.17, 0.11, 0.03, 'bandpass', 700 + (i % 2) * 120, null, 2); } }),
      SAY('Santiago soltó una carcajada. Una carcajada grande, demasiado grande para un muchacho tan delgado. Le salía desde el estómago, se le doblaba el cuerpo hacia delante y durante un rato no podía parar. Su madre decía que reía como su abuelo Lazcano.', 'Santiago burst out laughing. A big laugh, far too big for such a thin boy. It came up from his stomach, bent him forward, and for a while he couldn’t stop. His mother said he laughed like his grandfather Lazcano.'),
      Step.run((S) => { const P = S.set.papa; P.g.position.set(2.0, 0, 1.25); P.g.rotation.y = 0; P.arms[0].rotation.x = -0.5; Cap1Audio.sizzle(false); }),
      SAY('Joaquín sirvió en dos platos los plátanos fritos, los huevos con la yema entera, el queso blanco en tiras, el pan de yuca de la panadería de los Ortiz. Puso el café de olla en las dos tazas desportilladas de siempre. Se sentó frente a su hijo.', 'Joaquín served the fried plantains onto two plates, the eggs with the yolks whole, the white cheese in strips, the cassava bread from the Ortiz bakery. He poured the pot coffee into the same two chipped cups as always. He sat down across from his son.'),
      SAY('—¿Le diste cuerda a todos?', '“Did you wind them all?”'),
      SAY('—A todos.', '“All of them.”'),
      Step.choice({ es: '—¿Al de ella también?', en: '“Hers too?”' }, [{ es: '—Al de ella también.', en: '“Hers too.”' }, { es: '—Se me olvidó.', en: '“I forgot.”' }], 0, { es: 'No se le olvidaba nunca. Así no fue.', en: 'He never forgot. That isn’t how it went.' }),
      SAY('Joaquín asintió. Comió. No dijo nada más sobre los relojes. Nunca decía nada más sobre los relojes. Había cosas que en esa casa se veían y no se decían.', 'Joaquín nodded. Ate. Said nothing more about the clocks. He never said anything more about the clocks. There were things in that house that were seen and not said.'),
      SAY('—Hoy me acompañas a la estación. Tengo turno hasta las dos y Fermín quiere la revancha del dominó.', '“Today you come with me to the station. I’m on shift till two and Fermín wants his rematch at dominoes.”'),
      SAY('—Fermín hace trampas.', '“Fermín cheats.”'),
      SAY('—Fermín tiene setenta y un años. A los setenta y un años ya no se hacen trampas. Se tiene mala memoria con intención.', '“Fermín is seventy-one. At seventy-one you don’t cheat any more. You have a bad memory on purpose.”'),
      SAY('Santiago volvió a reírse. Su padre lo miró reírse con una expresión que él no supo leer. Eso era raro. Santiago sabía leer a casi todo el mundo.', 'Santiago laughed again. His father watched him laugh with an expression he couldn’t read. That was strange. Santiago could read almost everyone.'),
      Step.fade(1, 1.4),
      // ======== C · la estación ========
      Step.card(null, null, { es: 'Estación de Villa Corcovado · 09:00', en: 'Villa Corcovado station · 09:00' }, 3.4),
      Step.run((S) => { S.where = 'station'; Cap1Set.light(S, 'station'); const F = S.set; F.papa.g.visible = false; F.papaSt.g.visible = true; F.fermin.g.visible = true; sit(S, F.STX + 1.6, 1.62, 3.4, 0.25, -0.05, 2.4); Cap1Audio.radio(true); }),
      Step.fade(0, 1.4, false),
      SAY('…las tropas del Imperio de Varden han cruzado esta madrugada el río Ostra en tres puntos y avanzan hacia la capital del Principado de Velsk. El gobierno de la Mancomunidad Atlántica ha anunciado que considera la invasión un acto de guerra…', '…troops of the Empire of Varden crossed the river Ostra at three points early this morning and are advancing on the capital of the Principality of Velsk. The government of the Atlantic Commonwealth has announced that it regards the invasion as an act of war…', { cls: 'mem' }),
      SAY('—Ya está —dijo Fermín—. Ya empezaron otra vez esos animales.', '“There it is,” said Fermín. “Those animals have started again.”'),
      SAY('—No es asunto nuestro —dijo Joaquín.', '“It’s none of our business,” said Joaquín.'),
      SAY('—Todo es asunto nuestro cuando hay que comprar balas. Mi sobrino trabaja en la Compañía en San Juan de las Minas y dice que han triplicado los turnos. Que los vardeneses pagan en oro y los atlánticos pagan en oro y que el gobierno no le dice que no a nadie.', '“Everything is our business when there are bullets to buy. My nephew works for the Company in San Juan de las Minas and he says they’ve tripled the shifts. That the Vardenese pay in gold and the Atlantics pay in gold and the government says no to nobody.”'),
      SAY('—Por eso somos neutrales —dijo Joaquín.', '“That’s why we’re neutral,” said Joaquín.'),
      Step.run((S) => { Cap1Audio.radio(false); S.yawC = 0.2; }),
      SAY('Santiago estaba en la puerta del despacho mirando el andén. Lo que miraba era el tren: el mineral de la noche, con tres horas de retraso. Una locomotora negra de la serie 400 y veintidós vagones tolva cargados de piedra gris, cubiertos con lonas. Venía de San Juan de las Minas e iba al puerto de Ánimas.', 'Santiago was in the office doorway looking at the platform. What he was looking at was the train: the night ore train, three hours late. A black 400-series locomotive and twenty-two hopper wagons loaded with grey stone, covered with tarpaulins. It came from San Juan de las Minas and was bound for the port of Ánimas.'),
      Step.run((S) => { const F = S.set; S.yawC = Math.PI; S.yaw = Input.state.yaw = Math.PI; S.eye.set(F.STX + 3.0, 1.62, 5.4); S.yawR = 1.4; S.pitchMax = 0.5; }),
      Step.find([
        { pos: (S) => S.set.wagons[6].localToWorld(V(1.9, 0.33, 1.25)), r: 0.1, text: { es: 'Los muelles de la suspensión. En todos los demás vagones se ve el hueco entre la ballesta y el bastidor, más o menos el ancho de un dedo. En el séptimo no se ve. Va aplastado.', en: 'The suspension springs. On every other wagon you can see the gap between the leaf spring and the frame, about a finger’s width. On the seventh you can’t. It’s squashed down.' } },
        { pos: (S) => S.set.wagons[6].localToWorld(V(0, 2.3, 1.26)), r: 0.12, text: { es: 'Las lonas están atadas diferente. En los demás hacen el nudo igual: un ballestrinque doble y luego una vuelta de más que no sirve para nada, una manía. En el séptimo hay un nudo de marinero.', en: 'The tarpaulins are tied differently. On the others they make the same knot: a double clove hitch and then one extra turn that does nothing, a habit. On the seventh there’s a sailor’s knot.' } },
        { pos: (S) => S.set.wagons[6].localToWorld(V(1.9, 0.6, 1.3)), r: 0.13, text: { es: 'Las ruedas del bogie de atrás están más calientes. Desde aquí se ve cómo tiembla el aire encima.', en: 'The wheels on the rear bogie are hotter. From here you can see the air trembling above them.' } },
        { pos: (S) => S.set.wagons[6].localToWorld(V(0.06, 2.2, 1.27)), r: 0.08, avail: (S) => S.marks.filter((m) => m.done).length >= 2, text: { es: 'Y el que hizo el nudo de marinero es zurdo. Porque el chicote queda a la derecha.', en: 'And whoever tied the sailor’s knot is left-handed. Because the loose end falls to the right.' } },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: algo no cuadra en el séptimo vagón · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: something is off about the seventh wagon · ${n}/${k}` })),
      SAY('—Papá. El séptimo vagón va más cargado que los demás.', '“Papá. The seventh wagon is carrying more than the others.”'),
      SAY('—Si va más cargado, en el manifiesto tiene que poner más toneladas, o el manifiesto miente. Si miente, lleva algo que no es piedra. El concentrado de metal ya refinado, quizá, que vale cinco veces más. Y si alguien mete concentrado en un tren de piedra, es porque una parte de lo que se vende no se apunta en ningún sitio.', '“If it’s carrying more, the manifest has to show more tons, or the manifest is lying. If it’s lying, it’s carrying something that isn’t stone. Refined metal concentrate, maybe, worth five times as much. And if someone puts concentrate in a stone train, it’s because part of what gets sold isn’t written down anywhere.”'),
      SAY('Lo dijo sonriendo. Le hacía gracia como le hacía gracia un problema bonito en un examen: imposible hasta que veías el truco y de repente todo encajaba con un ruido limpio de mecanismo.', 'He said it smiling. It amused him the way a pretty problem in an exam amused him: impossible until you saw the trick, and then suddenly everything clicked into place with the clean sound of a mechanism.'),
      Step.run((S) => { const F = S.set; S.eye.set(F.STX + 2.2, 1.62, 3.2); S.yawC = Math.PI * 0.95; S.yaw = Input.state.yaw = S.yawC + 0.6; S.yawR = 2.6; if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.12, 0.08, 'lowpass', 600); }),
      SAY('Su padre cerró el libro de registro. No fuerte. Despacio. Con las dos manos. Lo cerró como se cierra una caja con algo dentro que no debe salir.', 'His father closed the register. Not hard. Slowly. With both hands. He closed it the way you close a box with something inside that mustn’t get out.'),
      SAY('—Fermín, ¿me haces el favor de ir a buscarme tabaco al estanco?', '“Fermín, would you do me the favour of fetching me some tobacco from the shop?”'),
      Step.run((S) => { S.set.fermin.g.visible = false; S.set.blind.position.y = 1.5; S.set.blind.scale.y = 1; if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.5, 0.03, 'bandpass', 2000, 800, 2); }),
      SAY('Su padre cerró la puerta del despacho. Bajó la persiana hasta la mitad. Se sentó. Se quitó las gafas de leer y se frotó los ojos con el pulgar y el índice.', 'His father shut the office door. Lowered the blind halfway. Sat down. Took off his reading glasses and rubbed his eyes with his thumb and forefinger.'),
      SAY('—Santiago. —Nunca le decía Santiago. Le decía campeón, o mijo, o flaco—. Hay cosas que se ven y no se dicen.', '“Santiago.” He never called him Santiago. He called him champ, or son, or skinny. “There are things that are seen and not said.”'),
      SAY('—Ya lo sé.', '“I know.”'),
      SAY('—No. No lo sabes. Tu madre lo sabía. Tu madre sabía mirar mejor que tú, y eso que tú miras como nadie que yo conozca. Pero ella sabía también cuándo había que cerrar los ojos. Eso no te lo pudo enseñar. No le dio tiempo.', '“No. You don’t. Your mother knew. Your mother knew how to look better than you, and you look like nobody I know. But she also knew when to close her eyes. That she couldn’t teach you. She didn’t have time.”'),
      Step.run((S) => { CS.whistle(30, 2); setTimeout(() => { Cap1Audio.buffers(22, 0.3); S.set.trainV = 0.6; }, 1600); }),
      SAY('Fuera, el maquinista del mineral tocó el silbato dos veces, cortas. Salida. Los topes golpearon uno detrás de otro, veintidós golpes, como una fila de puertas cerrándose.', 'Outside, the ore train’s driver blew the whistle twice, short. Departure. The buffers struck one after another, twenty-two blows, like a row of doors closing.'),
      SAY('—¿Me entiendes?', '“Do you understand me?”'),
      SAY('—Te entiendo.', '“I understand.”'),
      Step.choice({ es: '—Repítelo.', en: '“Say it back.”' }, [{ es: 'Hay cosas que se ven y no se dicen.', en: 'There are things that are seen and not said.' }, { es: 'El séptimo vagón lleva concentrado.', en: 'The seventh wagon is carrying concentrate.' }], 0, { es: 'Su padre no se movió. Esperó. Esperaba otra frase.', en: 'His father didn’t move. He waited. He was waiting for another sentence.' }),
      SAY('—Eso.', '“That.”'),
      Step.run((S) => { const F = S.set; S.eye.set(F.STX + 3.4, 1.35, 2.6); S.yawC = Math.PI; S.yaw = Input.state.yaw = Math.PI; S.pitch = Input.state.pitch = -0.65; S.yawR = 0.8; }),
      SAY('Joaquín volvió a ponerse las gafas. Mojó la pluma en el tintero y escribió con su letra redonda y lenta de alumno aplicado: «Mineral 2117. Entrada 06:51. Salida 09:22. Sin novedad.»', 'Joaquín put his glasses back on. He dipped the pen in the inkwell and wrote in his round, slow, diligent-schoolboy hand: “Ore 2117. In 06:51. Out 09:22. Nothing to report.”'),
      SAY('Santiago leyó «sin novedad» al revés, desde el otro lado de la mesa, y no dijo nada.', 'Santiago read “nothing to report” upside down, from the other side of the desk, and said nothing.'),
      SAY('Luego llegó Fermín con el tabaco y sacó las fichas de dominó de la caja de puros, y durante tres horas jugaron a la sombra del andén, y Fermín hizo trampas con mala memoria con intención, y su padre lo acusó de ladrón, de hereje y de vardenés, y Santiago se rió tanto que se le cayó la ficha del seis doble debajo de las vías.', 'Then Fermín came back with the tobacco and took the dominoes out of the cigar box, and for three hours they played in the shade of the platform, and Fermín cheated with a bad memory on purpose, and his father called him a thief, a heretic and a Vardenese, and Santiago laughed so hard he dropped the double six under the tracks.'),
      Step.fade(1, 1.6),
      // ======== D · recuerdo: la plaza ========
      Step.card({ es: 'Recuerdo', en: 'Memory' }, null, { es: 'La plaza de Corcovado · seis años', en: 'The square at Corcovado · six years old' }, 3.6),
      Step.run((S) => { S.where = 'plaza'; Cap1Set.light(S, 'plaza'); const F = S.set; F.papaSt.g.visible = false; F.train.visible = false; sit(S, F.PX + 0.1, 1.0, 5.0, 0, -0.04, 1.9); Cap1Audio.market(true); }),
      Step.fade(0, 1.6, false),
      SAY('Su madre lo sentaba en el banco de la plaza cuando tenía seis años. El tercer banco empezando por la izquierda, frente a la puerta de la iglesia. Y le decía:', 'His mother would sit him on the bench in the square when he was six. The third bench from the left, facing the church door. And she would say:', { cls: 'mem' }),
      SAY('—Mira. Mira todo. No mires una cosa. Míralo todo a la vez, como si fuera un dibujo. Como si alguien lo hubiera pintado y tú tuvieras que copiarlo luego de memoria.', '“Look. Look at everything. Don’t look at one thing. Look at it all at once, like a drawing. As if someone had painted it and you had to copy it from memory afterwards.”', { cls: 'mem' }),
      Step.goal('Mira la plaza entera. Fíjate en todo: la fuente, el kiosco, las naranjas, el perro, el balcón de los Cepeda, el niño, la sombra del campanario.', 'Look at the whole square. Take in everything: the fountain, the bandstand, the oranges, the dog, the Cepeda balcony, the boy, the bell-tower’s shadow.'),
      { tick(S, dt) { S._pl = (S._pl || 0) + (Math.abs(Input.state.yaw - S.yawC) > 0.6 ? dt * 1.6 : dt); return S._pl > 9; } },
      Step.goal(null),
      SAY('—Ahora cierra los ojos.', '“Now close your eyes.”', { cls: 'mem' }),
      Step.fade(1, 0.8),
      Step.run((S) => { const F = S.set; F.dog.rotation.y = Math.PI; F.dog.position.x = -0.6; F.sheets[1].visible = false; F.boy.g.visible = false; F.stranger.g.visible = true; F.shadow.rotation.z = 0.55; F.shadow.position.x = -1.2; for (const p of F.pigeons) { p.position.x += (Math.random() - 0.5) * 2; } }),
      SAY('Pasaba un rato. A veces un minuto. A veces cinco. Él oía el mercado, oía a doña Rufina gritar «¡a peso la docena!», oía el agua imaginaria de la fuente seca, oía su propio corazón.', 'A while would pass. Sometimes a minute. Sometimes five. He heard the market, heard Doña Rufina shout “a peso a dozen!”, heard the imaginary water of the dry fountain, heard his own heart.', { cls: 'mem' }),
      Step.fade(0, 0.8, false),
      SAY('—Ábrelos. ¿Qué cambió?', '“Open them. What changed?”', { cls: 'mem' }),
      Step.find([
        { pos: (S) => S.set.dog.localToWorld(V(0.2, 0.2, 0)), r: 0.12, text: { es: 'El perro amarillo se había dado la vuelta.', en: 'The yellow dog had turned over.' } },
        { pos: (S) => S.set.sheets[1].localToWorld(V(0, 0, 0)), r: 0.14, text: { es: 'Había una sábana menos en el balcón de los Cepeda.', en: 'There was one sheet fewer on the Cepedas’ balcony.' } },
        { pos: (S) => V(S.set.PX + 2.5, 0.6, -3), r: 0.14, text: { es: 'El niño gordo se había ido.', en: 'The fat boy had gone.' } },
        { pos: (S) => S.set.shadow.localToWorld(V(0, 3, 0)), r: 0.18, text: { es: 'La sombra del campanario se había movido un poco.', en: 'The bell-tower’s shadow had moved a little.' } },
        { pos: (S) => S.set.stranger.g.localToWorld(V(0, 1.4, 0)), r: 0.12, onFound: (S) => { S.flags.stranger = 1; }, text: { es: 'Había un hombre nuevo junto al kiosco. Traje marrón, y las botas no eran de aquí, porque aquí no se usaba esa forma de punta. Había dejado la maleta en el suelo con la mano todavía en el asa. Estaba mirando el reloj del campanario. Había sacado su propio reloj y lo estaba comparando.', en: 'There was a new man by the bandstand. Brown suit, and the boots weren’t from here, because nobody here wore that kind of toe. He’d set his suitcase down with his hand still on the handle. He was looking at the bell-tower clock. He had taken out his own watch and was comparing them.' } },
      ], 4, (n, k) => L({ es: `¿Qué cambió? Mantén <kbd>Q</kbd> · ${n}/${k}`, en: `What changed? Hold <kbd>Q</kbd> · ${n}/${k}` }) + (n >= 3 ? `<small>${L({ es: 'Busca también a alguien que antes no estaba.', en: 'Look for someone who wasn’t there before, too.' })}</small>` : '')),
      Step.run((S) => { if (!S.flags.stranger) { S.marks = []; } }),
      SAY('—Bien —decía su madre—. ¿Qué más?', '“Good,” his mother would say. “What else?”', { cls: 'mem' }),
      Step.choice({ es: '—¿Por qué crees que el hombre del kiosco mira la hora?', en: '“Why do you think the man by the bandstand is checking the time?”' }, [{ es: 'Porque va a coger el tren.', en: 'Because he’s going to catch the train.' }, { es: 'Porque llega tarde a misa.', en: 'Because he’s late for Mass.' }, { es: 'Porque espera a alguien.', en: 'Because he’s waiting for someone.' }], 0,
        [{ es: '', en: '' }, { es: '—¿Con la mano en la maleta? Piensa.', en: '“With his hand on the suitcase? Think.”' }, { es: '—Quien espera no deja la mano en el asa. Piensa.', en: '“Someone waiting doesn’t keep his hand on the handle. Think.”' }]),
      SAY('—Porque tiene la mano en la maleta. Y porque mira la hora. Y porque las botas tienen barro rojo y aquí la tierra es negra, así que viene de otro sitio.', '“Because his hand is on the suitcase. And because he’s checking the time. And because his boots have red mud and the earth here is black, so he comes from somewhere else.”', { cls: 'mem' }),
      Step.choice({ es: '—¿Y de dónde viene?', en: '“And where does he come from?”' }, [{ es: 'De la sierra. La tierra roja es de la sierra.', en: 'From the sierra. Red earth is from the sierra.' }, { es: 'De la capital.', en: 'From the capital.' }, { es: 'No sé.', en: 'I don’t know.' }], 0,
        [{ es: '', en: '' }, { es: '—En la capital no hay barro rojo. Piensa.', en: '“There’s no red mud in the capital. Think.”' }, { es: '—Piensa.', en: '“Think.”' }]),
      SAY('—Muy bien. Eso se llama mirar. Mirar no es ver. Ver lo hace cualquiera. Mirar es un trabajo.', '“Very good. That’s called looking. Looking isn’t seeing. Anyone can see. Looking is work.”', { cls: 'mem' }),
      SAY('—Porque el mundo está lleno de gente que no mira. Y esa gente se pasa la vida sorprendiéndose de cosas que estaban ahí desde el principio. Yo no quiero que te sorprendan, Santi. Quiero que tú los veas venir a todos.', '“Because the world is full of people who don’t look. And those people spend their lives being surprised by things that were there from the start. I don’t want them to surprise you, Santi. I want you to see them all coming.”', { cls: 'mem' }),
      Step.fade(1, 2.0),
      Step.run((S) => { Cap1Audio.market(false); }),
      // lo que pasó después (sobre negro)
      SAY('El cáncer empezó cuando Santiago tenía quince años. Fueron cinco años. Su madre murió el 19 de agosto de 1938, un viernes, a las 3:47 de la madrugada. Santiago lo sabía porque, en el momento exacto en que su respiración cambió, en lugar de mirarla a ella miró el reloj de viaje de latón que había sobre la mesilla.', 'The cancer began when Santiago was fifteen. It lasted five years. His mother died on 19 August 1938, a Friday, at 3:47 in the morning. Santiago knew because, at the exact moment her breathing changed, instead of looking at her he looked at the brass travel clock on the nightstand.', { cls: 'mem' }),
      SAY('Nunca se lo perdonó del todo.', 'He never quite forgave himself.', { cls: 'mem' }),
      SAY('En el entierro llegó una corona desde la capital, la más grande, de rosas y lirios blancos. La cinta decía: «A Amparo, con gratitud eterna, de sus compañeros de San Gregorio». Su madre nunca había hablado de ningún San Gregorio.', 'At the funeral a wreath arrived from the capital, the biggest one, white roses and lilies. The ribbon read: “To Amparo, with eternal gratitude, from her colleagues at San Gregorio.” His mother had never spoken of any San Gregorio.', { cls: 'mem' }),
      SAY('Al terminar se le acercó un hombre al que no había visto entre los ciento doce. Traje gris, pelo blanco, manos de pianista o de cura. Olía a cera de vela. A sacristía. «Tiene usted sus ojos», le dijo. Luego se fue hacia un Packard negro con las cortinillas corridas.', 'Afterwards a man came up to him whom he had not seen among the hundred and twelve. Grey suit, white hair, a pianist’s or a priest’s hands. He smelled of candle wax. Of a sacristy. “You have her eyes,” he said. Then he walked off towards a black Packard with its curtains drawn.', { cls: 'mem' }),
      SAY('Tres meses después, el préstamo de la Caja de Ahorros apareció pagado. Entero. La farmacia, el hospital de San Rafael, todo. Un sello: «liquidado por tercero». Ningún nombre. Santiago guardó los papeles en la carpeta y cerró el cajón. No preguntó.', 'Three months later the savings-bank loan turned up paid. In full. The pharmacy, the San Rafael hospital, everything. A stamp: “settled by third party”. No name. Santiago put the papers back in the folder and closed the drawer. He didn’t ask.', { cls: 'mem' }),
      // ======== E · la noche ========
      Step.card(null, null, { es: 'Esa noche · víspera de volver a la capital', en: 'That night · the eve of going back to the capital' }, 3.4),
      Step.run((S) => { S.where = 'house'; const F = S.set; F.train.visible = true; F.papa.g.visible = false; Cap1Set.light(S, 'night'); walkHouse(S, 3.0, 0, 3.4, -Math.PI / 2 - 0.3); for (const c of F.clocks) { c.wound = true; c.setTime(11, 56); } F.ck.viaje.wound = false; }),
      Step.fade(0, 1.6, false),
      SAY('Santiago no podía dormir. Bajó a la cocina a beber agua y encontró la lámpara del despacho encendida.', 'Santiago couldn’t sleep. He went down to the kitchen for a drink of water and found the study lamp on.'),
      Step.uses([{ id: 'silla', d: 2.0, r: 0.4, pos: (S) => V(8.6, 0.8, 6.6), label: { es: 'Sentarse en la silla de ella', en: 'Sit in her chair' },
        use(S) { sit(S, 8.62, 1.22, 6.6, -Math.PI / 2, -0.55, 1.2); } }], 1,
        () => L({ es: 'Ve al despacho, al banco de trabajo de su madre.', en: 'Go to the study, to his mother’s workbench.' })),
      SAY('Sobre la mesa de trabajo de su madre, bajo la lámpara de brazo articulado, estaba todo como ella lo había dejado: el tapete de fieltro verde, las pinzas, los destornilladores ordenados por tamaño, la lupa, el frasco de aceite de pie de buey que todavía olía a algo dulce y animal. Era la primera vez en catorce meses que se sentaba en su silla.', 'On his mother’s workbench, under the jointed lamp, everything was as she had left it: the green felt mat, the tweezers, the screwdrivers in order of size, the loupe, the jar of neatsfoot oil that still smelled of something sweet and animal. It was the first time in fourteen months he had sat in her chair.'),
      Step.uses([
        { id: 'der', d: 1.4, r: 0.25, pos: (S) => S.set.drawerR.position.clone(), label: { es: 'Abrir el cajón de la derecha', en: 'Open the right-hand drawer' }, extra: true, use(S) { S.set.drawerR.position.x -= 0.0; S.set.drawerR.position.z -= 0.18; }, text: { es: 'Herramientas de repuesto. Muelles sueltos. Un rollo de cuerda de piano.', en: 'Spare tools. Loose springs. A roll of piano wire.' } },
        { id: 'izq', d: 1.4, r: 0.25, pos: (S) => S.set.drawerL.position.clone(), label: { es: 'Abrir el cajón de la izquierda', en: 'Open the left-hand drawer' }, use(S) { S.set.drawerL.position.z -= 0.18; S.set.notebook.visible = true; },
          text: [{ es: 'Facturas de clientes. Recibos. Un cuaderno de tapas de hule negro en el que ella apuntaba los arreglos.', en: 'Customer invoices. Receipts. A black oilcloth notebook in which she wrote down her repairs.' },
            { es: 'La letra de su madre, al principio clara y pequeña, se volvía en las últimas páginas grande y temblorosa. El último arreglo era un Omega de bolsillo de un tal señor Quirós, de la calle Real: «muelle real roto, cambiar». Marzo de 1938. No ponía «entregado».', en: 'His mother’s hand, at first clear and small, grew large and shaky in the last pages. The last repair was an Omega pocket watch belonging to a Señor Quirós, of Calle Real: “mainspring broken, replace”. March 1938. It didn’t say “delivered”.' }] },
      ], 1, () => L({ es: 'Abre los cajones del banco.', en: 'Open the bench drawers.' })),
      Step.run((S) => { S.pitch = Input.state.pitch = -0.95; }),
      Step.find([{ pos: (S) => S.set.notebook.localToWorld(V(0.085, -0.06, 0)), r: 0.09, text: [{ es: 'En la contratapa, en la esquina inferior, una columna de números escrita a lápiz, tan pequeña que solo se veía con la lupa. Se puso la lupa de su madre en el ojo derecho. Eran horas: 7:10 · 7:10 · 7:15 · 7:10 · 7:05 · 7:10…', en: 'On the inside back cover, in the bottom corner, a column of numbers in pencil, so small you could only see it with the loupe. He put his mother’s loupe to his right eye. They were times: 7:10 · 7:10 · 7:15 · 7:10 · 7:05 · 7:10…' },
        { es: 'Cuarenta y tantas. Sin fecha. Al lado de algunas, una letra: «P». Y debajo, separado por una raya, con la letra torcida de los últimos meses: «Sigue viniendo».', en: 'Forty-odd. No dates. Next to some, a letter: “P”. And underneath, below a ruled line, in the crooked hand of the last months: “Still coming.”' },
        { es: 'Pensó en el Packard negro, en el hombre que olía a cera. Se dijo que eso era absurdo, que estaba viendo caballos en las nubes. Pero su cabeza no encontraba caballos en las nubes. Su cabeza encontraba caballos solo donde había caballos.', en: 'He thought of the black Packard, of the man who smelled of wax. He told himself it was absurd, that he was seeing horses in the clouds. But his mind didn’t find horses in clouds. His mind found horses only where there were horses.' }] }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: la contratapa del cuaderno.', en: 'Hold <kbd>Q</kbd>: the notebook’s inside cover.' })),
      // las doce: diez relojes, no once
      Step.run((S) => {
        Scenes.setGoal(L({ es: 'Cuenta las campanadas de cada reloj.', en: 'Count each clock’s chimes.' }));
        for (let i = 0; i < 12; i++) {
          const at = 0.4 + i * 1.05;
          Cap1Audio.chime(523, 0.05, at, i % 4 === 2);                                   // carillón de la sala con su nota rajada
          Cap1Audio.chime(196, 0.07, at + 0.15);                                          // el de la escalera, grave
          Cap1Audio.chime(740, 0.03, at + 0.5);                                           // el alemán de las violetas, medio segundo por detrás
          Cap1Audio.chime(988, 0.025, at + 0.3); Cap1Audio.chime(880, 0.02, at + 0.22);
          Cap1Audio.nickel(at + 0.08); Cap1Audio.nickel(at + 0.12);                       // los dos despertadores
          if (i < 12) Cap1Audio.cuckoo(at + 0.35);                                       // el cucú ridículo del baño
        }
      }),
      Step.wait(13.4),
      Step.goal(null),
      SAY('Fue entonces cuando dieron las doce. Durante doce campanadas la casa entera fue una tormenta de pequeñas campanas desacompasadas, y Santiago contó las campanadas de cada uno sin querer, como contaba todo.', 'It was then that midnight struck. For twelve strokes the whole house was a storm of small bells out of step, and Santiago counted each one’s strokes without meaning to, the way he counted everything.'),
      Step.choice({ es: '¿Cuántos relojes han dado las doce?', en: 'How many clocks struck twelve?' }, [{ es: 'Once', en: 'Eleven' }, { es: 'Diez', en: 'Ten' }, { es: 'Nueve', en: 'Nine' }], 1,
        [{ es: 'No. Faltaba uno. Cuenta otra vez.', en: 'No. One was missing. Count again.' }, { es: '', en: '' }, { es: 'Más. Cuenta otra vez.', en: 'More. Count again.' }]),
      SAY('Diez relojes daban las doce. El undécimo no.', 'Ten clocks struck twelve. The eleventh didn’t.'),
      Step.run((S) => { walkHouse(S, 8.0, 0, 6.6, Math.PI / 2); S.walk.speed = 2.8; }),
      Step.reach(8.6, 4.1, 0.9, 'Sube a la habitación de su padre. Deprisa.', 'Go up to his father’s room. Quickly.', 2.5),
      SAY('Entró en la habitación de su padre sin llamar. Su padre no estaba en la cama. La cama estaba hecha, sin abrir.', 'He went into his father’s room without knocking. His father wasn’t in bed. The bed was made, unopened.'),
      Step.uses([{ id: 'viaje', d: 1.8, r: 0.35, pos: (S) => S.set.ck.viaje.pos(), label: { es: 'Coger el reloj de viaje', en: 'Pick up the travel clock' },
        use(S) { const F = S.set, c = F.ck.viaje; c.setTime(11, 58); sit(S, 9.15, F.H1 + 1.05, 3.45, -Math.PI / 2 - 0.25, -0.6, 0.9); c.g.position.set(9.45, F.H1 + 0.95, 3.45); c.g.rotation.set(0.5, -Math.PI / 2 - 0.25, 0); } }], 1,
        () => L({ es: 'El reloj de viaje de latón, en la mesilla de ella.', en: 'The brass travel clock, on her nightstand.' })),
      SAY('El reloj de viaje estaba parado. Las manecillas marcaban las 11:58. Le había dado cuerda esa misma mañana: catorce vueltas. No podía estar parado.', 'The travel clock had stopped. The hands said 11:58. He had wound it that very morning: fourteen turns. It couldn’t have stopped.'),
      Step.find([{ pos: (S) => S.set.ck.viaje.g.localToWorld(V(0.02, -0.01, -0.02)), r: 0.14, text: { es: 'Lo abrió por detrás con la uña. El mecanismo estaba intacto. El muelle estaba tenso. Pero alguien había metido una lámina finísima de papel de fumar entre el volante y el puente, de forma que el volante no pudiera oscilar. Una forma de parar un reloj sin estropearlo. Una forma que solo conoce alguien que ha visto muchas veces a una relojera trabajar.', en: 'He opened the back with his thumbnail. The movement was intact. The spring was wound. But someone had slipped a very thin sliver of cigarette paper between the balance wheel and the bridge, so the balance couldn’t swing. A way of stopping a clock without damaging it. A way only someone who has watched a watchmaker at work many times would know.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: ¿por qué está parado?', en: 'Hold <kbd>Q</kbd>: why has it stopped?' })),
      Step.uses([{ id: 'papel', d: 1.5, r: 0.4, pos: (S) => S.set.ck.viaje.pos(), label: { es: 'Sacar el papel con la punta de la uña', en: 'Ease the paper out with a fingernail' }, use(S) { S.set.ck.viaje.wound = true; let n = 0; const tk = setInterval(() => { Cap1Audio.tick(0.05, 4200); if (++n > 8) clearInterval(tk); }, 260); } }], 1, null),
      SAY('El volante empezó a oscilar enseguida, con un temblor pequeño y vivo, como un pájaro que despierta. Tic. Tic. Tic.', 'The balance began to swing at once, with a small, live tremor, like a bird waking. Tick. Tick. Tick.'),
      Step.run((S) => { const F = S.set; F.papaN.g.visible = true; S.yawC = Math.PI * 0.5 + 0.2; S.yawR = 2.4; Scenes.setGoal(L({ es: 'Date la vuelta.', en: 'Turn around.' })); }),
      Step.gaze((S) => S.set.papaN.g.localToWorld(V(0, 1.6, 0)), 0.35, 0.4),
      Step.goal(null),
      SAY('Cuando se volvió, su padre estaba en el umbral de la puerta. En camiseta de tirantes, descalzo, con la cara en la penumbra del pasillo. No había hecho ningún ruido al subir. Llevaba en la mano izquierda un sobre grande, amarillo, de los oficiales, con un sello rojo lacrado en la solapa. El sobre estaba abierto.', 'When he turned, his father was in the doorway. In his vest, barefoot, his face in the shadow of the landing. He hadn’t made a sound coming up. In his left hand he held an envelope: large, yellow, official, with a red wax seal on the flap. The envelope was open.'),
      SAY('Santiago intentó leerle la cara como leía la de todo el mundo. Y no pudo. Por primera vez en su vida, delante de la cara más conocida del mundo, no pudo leer absolutamente nada. Era como mirar una esfera sin números.', 'Santiago tried to read his face the way he read everyone’s. And he couldn’t. For the first time in his life, in front of the most familiar face in the world, he could read absolutely nothing. It was like looking at a dial without numbers.'),
      SAY('—Lo paré yo —dijo su padre. La voz le salió rara, muy baja—. Lo siento. No quería que sonara.', '“I stopped it,” his father said. His voice came out strange, very low. “I’m sorry. I didn’t want it to strike.”'),
      SAY('—¿Por qué?', '“Why?”'),
      SAY('Su padre se miró la mano. Miró el sobre. Lo levantó un poco, como si fuera a dárselo, y luego no se lo dio.', 'His father looked at his hand. Looked at the envelope. Raised it a little, as if to give it to him, and then didn’t.'),
      SAY('—Porque a las doce ya iba a ser mañana. Y yo quería que fuera hoy un ratito más.', '“Because at twelve it was going to be tomorrow. And I wanted it to be today a little while longer.”'),
      Step.run((S) => { const F = S.set; F.papaN.g.visible = false; if (SceneAudio.ok()) { const t = AUDIO.ctx.currentTime; for (let i = 0; i < 6; i++) AUDIO.nz(SceneAudio.dest(), t + 0.4 + i * 0.6, 0.06, 0.03, 'bandpass', 380, null, 1.5); } }),
      SAY('Luego se dio la vuelta y bajó las escaleras, despacio, apoyándose en la pared, y se encerró en la cocina, y Santiago oyó cómo arrastraba una silla, y cómo se sentaba, y luego no oyó nada más.', 'Then he turned and went down the stairs, slowly, leaning on the wall, and shut himself in the kitchen, and Santiago heard him drag a chair, and sit down, and then he heard nothing more.'),
      SAY('Se quedó de pie junto a la cama de su madre con el reloj de latón en la mano, sintiendo cómo latía contra la palma: tic, tic, tic. Catorce vueltas de cuerda, treinta horas de marcha.', 'He stood by his mother’s bed with the brass clock in his hand, feeling it beat against his palm: tick, tick, tick. Fourteen turns of the key, thirty hours of running.'),
      Step.fade(1, 2.4),
      SAY('Eran las 12:01. Ya era mañana.', 'It was 12:01. It was already tomorrow.', { cls: 'mem' }),
      Step.wait(1.2),
    ],
  };
  // la misión ya se puede jugar
  const m = CAMP_BY_ID['P1-M1']; m.scene = 'cap1'; m.map = 'corcovado_casa';
})();
