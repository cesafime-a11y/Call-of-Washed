// ---- 12n_cap6.js ----
// =====================================================================
// PARTE I · CAPÍTULO 6 · «Tiple» (P1-M6)
// Seminario de San Gregorio · sierra de Ocoa · viernes 1 de marzo de 1940
// Tramos: la subida en el Packard (las curvas, el puente de la Viuda, la
// cruz sin nombre, el km 42) · el patio (los cinco, «como un dibujo»,
// Gaspar, Hugo, Remedios) · el recorrido con Nicanor (el seminario es el
// hub de la campaña) · el dormitorio de los tiples · la cena y los nombres
// de voz · la noche: 39 crucifijos, 218 rayas y una «E», el armonio,
// Gaspar detrás de la puerta · el camión de leche del km 42.
// Lugares: patio y camino x 0 (el camino baja hacia +z), el Packard x -80,
// interiores x 100 (pasillo y refectorio) y x 160 (dormitorio).
// =====================================================================
MAPS.c6_san_gregorio = {
  name: { es: 'Seminario de San Gregorio · sierra de Ocoa', en: 'San Gregorio Seminary · Ocoa sierra' },
  desc: { es: 'Un rellano de la montaña, sobre un barranco, de espaldas a un farallón de roca gris.', en: 'A ledge on the mountain, above a ravine, backed by a cliff of grey rock.' },
  campaign: true,
  thumb: ['#6a8ab0', '#5a5a52', '#2a2a26'],
  theme: { skyTop: 0x2e5aa0, skyMid: 0x8ab0d8, skyBot: 0xd0dce4, fog: 0xb8c8d4, fogNear: 80, fogFar: 520, sun: 0xffffff, sunI: 0.3, sunDir: [0.5, 0.8, 0.3], hemiTop: 0xdde8f4, hemiBot: 0x5a5448, hemiI: 0.3, exposure: 1.05, cloud: 0.0, rays: 0, glow: 0, lamps: false, soldFill: 0.5, soldRim: 0.3 },
  build(B) { B.bounds(-120, -80, 220, 240); B.ground(-120, -80, 220, 240, { y: -30, pattern: PAT.DIRT, color: 0x5a5448 }); B.spawn('ffa', 0, 0, 0, 0); },
};

const Cap6Set = {
  build(S) {
    const root = new THREE.Group(); MapSys.decor.add(root);
    const K = CampKit(root), { box, grp, cyl, ball, solid, furn, canvasTex, plane, room, win, person, M } = K, V = CampUtil.V;
    const lights = {};
    const addL = (k, l) => { root.add(l); if (l.target) root.add(l.target); (lights[k] = lights[k] || []).push([l, l.intensity]); l.intensity = 0; return l; };
    const F = { lights, tex: K.tex, col: K.col };
    const stoneD = 0x5a5650, stone = 0x6e6a62, earth = 0x8a7a5e, pine = 0x2a3e2a;
    const pineT = (x, y, z, h = 9) => { cyl(0.18, 0.25, h * 0.4, 0x4a3424, x, y + h * 0.2, z); const c = new THREE.Mesh(new THREE.ConeGeometry(h * 0.22, h * 0.75, 7), M(pine)); c.position.set(x, y + h * 0.62, z); root.add(c); };

    // ========== EL RELLANO: patio, muro, seminario, farallón ==========
    box(70, 1, 36, earth, 0, -0.5, -2);
    box(140, 60, 8, 0x7a7670, 0, 22, -44); for (let i = 0; i < 8; i++) { const b = box(14, 30 + (i % 3) * 8, 6, 0x6a6660, -50 + i * 14, 12, -38); b.rotation.z = (i % 2 ? 0.05 : -0.04); }
    // el ala derecha (norte), la iglesia en la esquina, el ala izquierda (oeste, con rejas)
    box(30, 9, 10, stoneD, 8, 4.5, -20); solid(-7, -25, 23, -15);
    box(10, 12, 12, stone, -12, 6, -21); solid(-17, -27, -7, -15);
    const tower = grp(-12, 12, -24); box(5, 9, 5, stone, 0, 4.5, 0, tower); for (const [x, z, ry] of [[0, 2.52, 0], [2.52, 0, Math.PI / 2], [0, -2.52, 0], [-2.52, 0, Math.PI / 2]]) box(1.4, 2.2, 0.06, 0x0a0a0a, x, 6.2, z, tower, { ry });
    box(10, 8, 28, stoneD, -22, 4, 0); solid(-27, -15, -17, 14);
    for (let i = 0; i < 5; i++) { const z = -10 + i * 5; box(0.06, 1.4, 1.0, 0x1a1a1a, -16.95, 1.8, z); for (let k = 0; k < 4; k++) box(0.04, 1.4, 0.04, 0x2a2a28, -16.9, 1.8, z - 0.4 + k * 0.27, root, { m: 0.6 }); }
    for (let i = 0; i < 6; i++) box(1.0, 1.3, 0.06, 0x7a5a3a, 0 + i * 4, 6.2, -14.96);
    for (let i = 0; i < 6; i++) box(0.9, 1.2, 0.06, 0x2a3a4a, 0 + i * 4, 2.2, -14.96, root, { e: 0x1a2a3a, ei: 0.3 });
    // tejado con huecos, y la higuera torcida entre dos vigas
    box(31, 0.3, 11, 0x6a3a2a, 8, 9.2, -20); for (let i = 0; i < 7; i++) box(1.2, 0.32, 1.0, 0x1a1410, -4 + i * 4.1, 9.25, -18 + (i % 3));
    { const f = ball(0.8, 0x3a5a2a, 18, 9.9, -17); f.scale.set(1, 0.7, 1); cyl(0.07, 0.1, 1.0, 0x5a4a3a, 18, 9.5, -17, root, { rz: 0.4 }); }
    // la puerta principal y la inscripción
    box(2.0, 3.0, 0.1, 0x3a2416, 7, 1.5, -14.94); F.door = V(7, 1.5, -14.9);
    const insT = canvasTex(512, 64, (g, w, h) => { g.fillStyle = '#6e6a62'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(30,26,22,.65)'; g.font = 'bold 30px serif'; g.textAlign = 'center'; g.fillText('CANTATE DOMINO CANTICUM NOVUM', w / 2, 42); g.fillStyle = 'rgba(110,106,98,.6)'; for (let i = 0; i < 30; i++) g.fillRect(Math.random() * w, Math.random() * h, 12, 4); });
    plane(5, 0.6, insT, 7, 3.5, -14.93); F.ins = V(7, 3.5, -14.93);
    // el pozo, el olmo muerto, el banco de piedra
    cyl(0.9, 0.9, 0.8, stone, -3, 0.4, -4); cyl(0.7, 0.7, 0.82, 0x0a0a0a, -3, 0.41, -4); solid(-3.9, -4.9, -2.1, -3.1);
    box(0.1, 2.2, 0.1, 0x3a2a1a, -3.8, 1.5, -4); box(0.1, 2.2, 0.1, 0x3a2a1a, -2.2, 1.5, -4); box(1.8, 0.1, 0.1, 0x3a2a1a, -3, 2.6, -4);
    cyl(0.3, 0.45, 5, 0x4a3e34, 9, 2.5, 1); for (let i = 0; i < 5; i++) { const b = cyl(0.08, 0.14, 3, 0x4a3e34, 9 + Math.cos(i * 1.3) * 1.2, 5.2 + i * 0.2, 1 + Math.sin(i * 1.3) * 1.2, root, { rz: Math.cos(i * 1.3) * 0.7, rx: Math.sin(i * 1.3) * 0.7 }); void b; } solid(8.6, 0.6, 9.4, 1.4);
    furn(2.2, 0.45, 0.6, stone, 4, 0, 4.4);
    // el muro con vidrio de botella, la puerta de entrada sin cancela
    for (const [x0, z0, x1, z1] of [[-17, 12, -2.5, 12.6], [2.5, 12, 30, 12.6], [30, -15, 30.6, 12.6]]) { box(x1 - x0, 3.2, z1 - z0, 0x7a7466, (x0 + x1) / 2, 1.6, (z0 + z1) / 2); solid(x0, z0, x1, z1); for (let x = x0; x < x1; x += 0.4) box(0.06, 0.18, 0.06, 0x3a7a4a, x + 0.2, 3.28, (z0 + z1) / 2, root, { m: 0.2, r: 0.1, e: 0x1a3a2a, ei: 0.3 }); }
    for (const s of [-1, 1]) box(0.8, 3.6, 0.8, stone, s * 2.6, 1.8, 12.3);
    // el barranco al este
    { const b = box(80, 2, 200, 0x5a5448, 70, -40, 0); b.rotation.z = 0.0; }
    // los cinco
    const gaspar = person({ x: -3, z: -2.95, ry: Math.PI * 0.95, sit: true, h: 1.16, shirt: 0x8a3a2a, bareArms: true, rolled: true, leg: 0x3a3a34, hair: null, skin: 0xa89484 }); gaspar.g.position.y = 0.3;
    const hugo = person({ x: -6.6, z: -14.2, ry: 0.4, coat: 0xe8dcc0, leg: 0xe8dcc0, shirt: 0xf4f0e8, tie: 0x7a2a3a, hair: 0x0e0c0a, mous: 0x0e0c0a, slim: true, boot: 0x5a3a20 });
    hugo.arms[1].rotation.x = -1.2; hugo.arms[0].rotation.x = -1.0; const apple = ball(0.045, 0xb02a1a, 0, -0.36, 0.06, hugo.arms[1].userData.f); const peel = box(0.01, 0.9, 0.01, 0xc8401a, 0, -0.8, 0.06, hugo.arms[1].userData.f); const knife = box(0.006, 0.01, 0.12, 0xc8c8c8, 0, -0.33, 0.1, hugo.arms[0].userData.f, { m: 0.9 }); void knife;
    const remedios = person({ x: 0.5, z: 2.5, ry: Math.PI, coat: 0x3a3a3e, skirt: 0x3a3a3e, leg: 0x2a2a2e, hair: 0x5a3a20, bun: true, slim: true, mous: null });
    remedios.arms[0].rotation.x = -0.6; remedios.arms[1].rotation.x = -0.6; remedios.arms[0].rotation.z = 0.5; remedios.arms[1].rotation.z = -0.5;
    const nicanor = person({ x: 4, z: 4.6, ry: Math.PI, sit: true, belly: true, coat: 0x6a4a2a, leg: 0x3a3028, shirt: 0xe8e4d8, hair: null, beard: 0x8a8680 }); nicanor.arms[1].rotation.x = -1.3; const bottle = cyl(0.035, 0.035, 0.26, 0x1a4a2a, 0, -0.36, 0.05, nicanor.arms[1].userData.f, { t: 0.85 }); void bottle;
    const celes = person({ x: -16.3, z: 5, ry: Math.PI / 2, h: 0.86, coat: 0x2a3a5a, leg: 0x2a3a5a, apron: 0x5a3a20, hair: 0xd8d4cc, glasses: true }); celes.head.rotation.z = 0.28; celes.arms[0].rotation.x = -0.9; celes.arms[1].rotation.x = -0.9;
    box(1.2, 2.3, 0.1, 0x2a2018, -16.96, 1.15, 5, root, { ry: Math.PI / 2 });
    F.gaspar = gaspar; F.hugo = hugo; F.remedios = remedios; F.nicanor = nicanor; F.celes = celes; F.peel = peel; F.apple = apple;
    const pack = grp(0, 0, 9, root, 0); box(1.8, 0.7, 4.8, 0x0e0e10, 0, 0.75, 0, pack, { m: 0.5, r: 0.3 }); box(1.6, 0.6, 2.4, 0x0e0e10, 0, 1.4, 0.3, pack, { m: 0.5, r: 0.3 }); for (const s of [-1, 1]) for (const zz of [-1.5, 1.5]) cyl(0.38, 0.38, 0.22, 0x111111, s * 0.92, 0.38, zz, pack, { rz: Math.PI / 2 });
    const suit = box(0.5, 0.36, 0.16, 0x7a5a3a, 1.6, 0.18, 6.5); F.pack = pack; F.suit = suit;
    // el camino de tierra que baja entre pinos hasta la carretera (km 42)
    F.floorOut = (x, z, y) => z > 12 ? -Math.min(160, z - 12) * 0.12 : 0;
    { const L = 162, th = Math.atan(0.12), b = box(8, 0.4, L, earth, 0, 0, 0); b.rotation.x = th; b.position.set(0, -0.2 - L / 2 * Math.sin(th), 12 + L / 2 * Math.cos(th)); }
    for (let z = 16; z < 170; z += 5.5) for (const s of [-1, 1]) { const x = s * (5 + ((z * 7) % 4)), y = -(z - 12) * 0.12; pineT(x, y - 1, z, 8 + (z % 4)); solid(x - 0.3, z - 0.3, x + 0.3, z + 0.3, y - 2, y + 6); }
    solid(-4.2, 12, -3.9, 175, -30, 5); solid(3.9, 12, 4.2, 175, -30, 5);
    { const L = 260, b = box(L, 0.3, 6, 0x4a4a46, 0, -19.4, 177); void b; }
    for (const s of [-1, 1]) box(0.5, 1.2, 0.5, stone, s * 3.2, -18.6, 172);
    const kmT = canvasTex(64, 96, (g, w, h) => { g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.fillStyle = '#b02a1a'; g.fillRect(0, 0, w, 26); g.fillStyle = '#1a1a1a'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('42', w / 2, 70); });
    box(0.4, 0.8, 0.2, 0xe8e4d8, 4.6, -18.9, 174.6); plane(0.38, 0.58, kmT, 4.6, -18.85, 174.49, Math.PI);
    solid(-130, 174.5, 130, 175.5, -30, 0);
    const truck = grp(-120, -19.25, 177, root, Math.PI / 2); box(2.2, 2.0, 5.5, 0xd8d4c8, 0, 1.6, -1, truck); box(2.2, 1.6, 1.8, 0x3a4a3a, 0, 1.4, 2.6, truck); for (const s of [-1, 1]) { ball(0.15, 0xfff0c0, s * 0.7, 1.0, 3.55, truck, { e: 0xfff0c0, ei: 3 }); for (const zz of [-2.5, 2.2]) cyl(0.45, 0.45, 0.3, 0x111111, s * 1.05, 0.45, zz, truck, { rz: Math.PI / 2 }); }
    const tl = new THREE.SpotLight(0xfff0c0, 0, 60, 0.5, 0.6); tl.position.set(0, 1.0, 3.6); truck.add(tl); tl.target.position.set(0, 0, 20); truck.add(tl.target); F.truck = truck; F.truckL = tl;
    addL('day', new THREE.HemisphereLight(0xe8f0fa, 0x6a6050, 0.95)).position.set(0, 20, 0);
    { const l = addL('day', new THREE.DirectionalLight(0xffffff, 1.6)); l.position.set(30, 40, 30); l.target.position.set(0, 0, -5); }
    addL('dawn', new THREE.HemisphereLight(0x5a6a8a, 0x1a1814, 0.35)).position.set(0, 20, 60);
    { const l = addL('dawn', new THREE.DirectionalLight(0xc8b8d8, 0.4)); l.position.set(60, 20, 120); l.target.position.set(0, -10, 100); }

    // ========== LA SUBIDA (x -80): el asiento de atrás y la sierra que pasa ==========
    const CX = -80;
    const car = grp(CX, 0, 0); box(1.9, 0.08, 2.6, 0x1a1612, 0, 0.3, 0, car); box(1.7, 0.45, 0.55, 0x3a2a24, 0, 0.55, 0.55, car); box(1.7, 0.75, 0.12, 0x3a2a24, 0, 0.95, 0.85, car); box(1.9, 0.08, 2.6, 0x2a2420, 0, 1.6, 0, car);
    box(0.06, 0.45, 2.6, 0x1e1a18, -0.95, 0.5, 0, car); box(0.06, 0.3, 2.6, 0x1e1a18, -0.95, 1.48, 0, car); box(0.06, 1.3, 2.6, 0x1e1a18, 0.95, 0.95, 0, car);
    const drv = person({ x: 0.4, z: -0.95, ry: Math.PI, sit: true, coat: 0x1a1a1a, cap: 0x1a1a1a, leg: 0x1a1a1a, hair: 0x2a2018 }); car.add(drv.g); drv.g.position.set(0.4, 0.05, -0.95);
    const passing = []; for (let i = 0; i < 18; i++) { const g = grp(CX - 6 - (i % 3) * 3, -1, -60 + i * 7); const c = new THREE.Mesh(new THREE.ConeGeometry(1.6, 6, 7), M(pine)); c.position.y = 4; g.add(c); cyl(0.15, 0.2, 2, 0x4a3424, 0, 1, 0, g); passing.push(g); }
    const cross = grp(CX - 3.2, 0.2, -60); box(0.06, 1.1, 0.06, 0x2a2a28, 0, 0.55, 0, cross, { m: 0.6 }); box(0.5, 0.06, 0.06, 0x2a2a28, 0, 0.8, 0, cross, { m: 0.6 }); for (let k = 0; k < 6; k++) ball(0.07, [0x8a6a4a, 0x7a5a3a, 0x9a7a5a][k % 3], (k - 3) * 0.08, 0.05, 0.1, cross); F.cross = cross;
    box(4, 0.2, 200, 0x4a4a46, CX + 0.4, -0.15, 0); box(30, 0.4, 200, 0x5a5448, CX - 18, -0.6, 0);
    F.passing = passing; F.CX = CX;
    addL('car', new THREE.HemisphereLight(0xe8f0fa, 0x4a4438, 0.9)).position.set(CX, 10, 0);
    { const l = addL('car', new THREE.DirectionalLight(0xffffff, 1.2)); l.position.set(CX - 20, 30, 10); l.target.position.set(CX, 0, 0); }

    // ========== DENTRO: el pasillo del ala derecha y el refectorio (x 100) ==========
    const IX = 100;
    room(IX, -1.4, IX + 30, 1.4, 3.6, { wall: 0xc8c0aa, floor: 0x5a5a54, ceil: 0xb8b0a0 });
    for (let i = 0; i < 6; i++) { box(1.0, 2.2, 0.08, 0x4a3420, IX + 3 + i * 3.2, 1.1, -1.33); }
    const plates = canvasTex(256, 48, (g, w, h) => { g.fillStyle = '#d8d0b8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2014'; g.font = 'bold 24px serif'; g.textAlign = 'center'; g.fillText('TALLER · ARMERÍA', w / 2, 32); });
    plane(1.6, 0.3, plates, IX + 24, 2.6, 1.32, Math.PI);
    const cell = box(1.1, 2.2, 0.08, 0x2a2a28, IX + 27.6, 1.1, 1.33, root, { m: 0.5 }); for (let k = 0; k < 6; k++) box(0.03, 0.03, 1.2, 0x5a5a58, IX + 27.6, 0.5 + k * 0.3, 1.25, root, { m: 0.7, ry: Math.PI / 2 }); F.sotano = cell.position.clone();
    for (let i = 0; i < 6; i++) win(IX + 3 + i * 4.5, 2.0, 1.33, Math.PI, 0.8, 1.0);
    // refectorio: mesa larga para cuarenta en la que comen seis
    const RX = IX + 40;
    room(RX, -4, RX + 16, 4, 4.2, { wall: 0xd0c8b0, floor: 0x5a4a38, ceil: 0xc8c0a8 });
    furn(14, 0.78, 1.2, 0x5a3a20, RX + 8, 0, 0); for (let i = 0; i < 2; i++) box(14, 0.45, 0.35, 0x4a3018, RX + 8, 0.23, i ? 0.9 : -0.9);
    const diners = {};
    diners.gaspar = person({ x: RX + 1.4, z: 0, ry: Math.PI / 2, sit: true, h: 1.16, shirt: 0x8a3a2a, bareArms: true, leg: 0x3a3a34, hair: null, skin: 0xa89484 });
    diners.rem = person({ x: RX + 2.3, z: 0.95, ry: Math.PI, sit: true, coat: 0x3a3a3e, skirt: 0x3a3a3e, leg: 0x2a2a2e, hair: 0x5a3a20, bun: true, slim: true, mous: null });
    diners.nic = person({ x: RX + 2.3, z: -0.95, ry: 0, sit: true, belly: true, coat: 0x6a4a2a, leg: 0x3a3028, hair: null, beard: 0x8a8680 });
    diners.hugo = person({ x: RX + 3.3, z: -0.95, ry: 0, sit: true, coat: 0xe8dcc0, leg: 0xe8dcc0, hair: 0x0e0c0a, mous: 0x0e0c0a, slim: true });
    diners.celes = person({ x: RX + 5.6, z: 0.95, ry: Math.PI, sit: true, h: 0.86, coat: 0x2a3a5a, leg: 0x2a3a5a, apron: 0x5a3a20, hair: 0xd8d4cc, glasses: true }); diners.celes.head.rotation.z = 0.28;
    for (const [x, z] of [[1.4, 0], [2.3, 0.6], [2.3, -0.6], [3.3, -0.6], [3.3, 0.6], [5.6, 0.6], [14.6, 0]]) { cyl(0.12, 0.1, 0.03, 0xe8e4dc, RX + x + (x === 1.4 ? 0.4 : x === 14.6 ? -0.4 : 0), 0.8, z * 0.75); }
    const hk = box(0.01, 0.01, 0.12, 0xd8d8d8, RX + 3.3, 0.79, -0.4, root, { m: 0.9 }); F.hknife = hk;
    F.diners = diners; F.RX = RX; F.IX = IX;
    addL('in', new THREE.HemisphereLight(0xe8e4d8, 0x3a342a, 0.75)).position.set(IX + 15, 3, 0);
    { const l = addL('in', new THREE.PointLight(0xfff0d8, 0.8, 20)); l.position.set(IX + 10, 3, 0); } { const l = addL('in', new THREE.PointLight(0xfff0d8, 0.8, 20)); l.position.set(IX + 22, 3, 0); }
    addL('ref', new THREE.HemisphereLight(0xe8dcc0, 0x2a2018, 0.35)).position.set(RX + 8, 3, 0);
    { const l = addL('ref', new THREE.PointLight(0xffd8a0, 1.6, 12)); l.position.set(RX + 3, 2.4, 0); }

    // ========== EL DORMITORIO DE LOS TIPLES (x 160) ==========
    const DX = 200;
    room(DX, 0, DX + 34, 7, 3.8, { wall: 0xdcd8cc, floor: 0x5a4a38, ceil: 0x8a7a64, gaps: { w: [[2.8, 4.2]] } });
    for (let i = 0; i < 36; i++) box(0.2, 0.25, 7, 0x4a3a2a, DX + 0.5 + i * 0.94, 3.65, 3.5);
    for (let i = 0; i < 8; i++) win(DX + 2.5 + i * 4.2, 2.0, 0.07, 0, 0.9, 1.3, { glow: 0x8aa0c8, ei: 0.35 });
    const beds = [];
    for (let r = 0; r < 2; r++) for (let i = 0; i < 20; i++) {
      const x = DX + 3.6 + i * 1.5, z = r ? 6.1 : 0.9;
      box(0.62, 0.05, 1.45, 0xe8e8e0, x, 0.38, z, root, { m: 0.3 }); for (const sz of [-0.7, 0.7]) box(0.62, 0.5, 0.04, 0xe8e8e0, x, 0.42, z + sz, root, { m: 0.3 });
      box(0.58, 0.1, 1.38, 0x8a7a5a, x, 0.45, z); box(0.3, 0.45, 0.3, 0x5a3a20, x + 0.55, 0.22, r ? z + 0.55 : z - 0.55);
      solid(x - 0.32, z - 0.74, x + 0.32, z + 0.74, 0, 0.6);
      const last = r === 1 && i === 19;
      if (!last) { const cx = grp(x, 1.5, r ? 6.92 : 0.08, root, r ? Math.PI : 0); box(0.03, 0.2, 0.02, 0x3a2416, 0, 0, 0, cx); box(0.12, 0.03, 0.02, 0x3a2416, 0, 0.04, 0, cx); }
      beds.push({ x, z, r, i });
    }
    F.beds = beds; F.DX = DX;
    const lb = beds[39], wallZ = 6.92;
    const markT = canvasTex(256, 128, (g, w, h) => { g.fillStyle = 'rgba(0,0,0,0)'; g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(255,255,250,.55)'; g.fillRect(84, 0, 88, 60); g.strokeStyle = 'rgba(60,50,40,.85)'; g.lineWidth = 1.2;
      let n = 0; for (let grp5 = 0; grp5 < 44 && n < 218; grp5++) { const gx = 8 + (grp5 % 11) * 22, gy = 70 + Math.floor(grp5 / 11) * 13; for (let k = 0; k < 4 && n < 218; k++, n++) { g.beginPath(); g.moveTo(gx + k * 4, gy); g.lineTo(gx + k * 4, gy + 9); g.stroke(); } if (n < 218 && grp5 < 43) { g.beginPath(); g.moveTo(gx - 2, gy + 8); g.lineTo(gx + 15, gy + 1); g.stroke(); n++; } }
      g.fillStyle = 'rgba(60,50,40,.9)'; g.font = 'bold 9px serif'; g.fillText('E', 214, 124); g.fillStyle = 'rgba(120,110,95,.9)'; g.fillRect(220, 113, 30, 13); });
    const marks = plane(0.7, 0.35, markT, lb.x, 0.95, wallZ - 0.005, Math.PI, root, { tr: true }); F.marks = marks;
    ball(0.006, 0x2a2a28, lb.x, 1.5, wallZ - 0.01, root, { m: 0.8 });
    const mat = box(0.6, 0.1, 1.4, 0x8a7a5a, DX + 2.0, 0.05, 1.0); F.mat = mat;
    const suitD = box(0.5, 0.36, 0.16, 0x7a5a3a, DX + 3.0, 0.18, 1.9); void suitD;
    addL('dorm', new THREE.HemisphereLight(0xe8e4d8, 0x3a342a, 0.6)).position.set(DX + 17, 3, 3.5);
    { const l = addL('dorm', new THREE.DirectionalLight(0xfff4e0, 0.8)); l.position.set(DX + 17, 6, -8); l.target.position.set(DX + 17, 0, 4); }
    addL('moon', new THREE.HemisphereLight(0x3a4a6a, 0x0a0a0c, 0.22)).position.set(DX + 17, 3, 3.5);
    { const l = addL('moon', new THREE.DirectionalLight(0x9ab0d8, 0.45)); l.position.set(DX + 20, 6, -8); l.target.position.set(DX + 22, 0, 5); }
    S.set = F;
    return F;
  },
  light(S, where) { const F = S.set; for (const k in F.lights) for (const [l, v] of F.lights[k]) l.intensity = k === where ? v : 0; F.where = where; },
  harmonium(on) { if (!SceneAudio.ok()) return; if (!on) return; const t0 = AUDIO.ctx.currentTime; const mel = [220, 261.6, 246.9, 220, 196, 220, 174.6, 164.8, 174.6, 196, 220]; mel.forEach((f, i) => { AUDIO.osc(SceneAudio.dest(), 'sawtooth', f, f, t0 + i * 1.1, 1.3, 0.004, 0.2); AUDIO.osc(SceneAudio.dest(), 'triangle', f / 2, f / 2, t0 + i * 1.1, 1.3, 0.006, 0.2); }); },
  update(S, dt) {
    const F = S.set; if (!F) return;
    CampUtil.globals(0, F.where === 'moon' || F.where === 'dawn' ? 0.03 : 0.1);
    if (F.where === 'car') { for (const g of F.passing) { g.position.z += dt * 14; if (g.position.z > 40) g.position.z -= 126; } if (F.crossOn) { F.cross.position.z += dt * 14; } }
    if (F.peel) F.peel.scale.y = Math.min(1.4, (F.peel.scale.y || 1) + dt * 0.02);
    if (F.truckGo) { F.truck.position.x += dt * 9; F.truckL.intensity = 4; if (SceneAudio.ok() && !F._tr) { F._tr = true; SceneAudio.startTruck && SceneAudio.startTruck(); } }
  },
  dispose(S) { const F = S.set; if (!F) return; for (const t of F.tex) t.dispose(); S.set = null; },
};

(() => {
  const C = (S) => S.set, V = CampUtil.V, sit = CampUtil.sit.bind(CampUtil), head = campHead(CAMP_BY_ID['P1-M6']);
  const go = (where, fn) => Step.run((S) => { Cap6Set.light(S, where); S.where = where; fn(S); });
  const face = (S, x, z, pitch) => { const y = CampUtil.yawTo(S.eye.x, S.eye.z, x, z); S.yaw = Input.state.yaw = y; if (!(S.walk && S.walk.on)) S.yawC = y; if (pitch != null) S.pitch = Input.state.pitch = pitch; };
  const walkOut = (S, x, z, yaw) => CampUtil.walk(S, x, 0, z, yaw, { floor: C(S).floorOut, speed: 2.2 });
  // la última madrugada: el jugador puede irse… o no
  const leaveStep = {
    enter(S) { const F = C(S); F.left = false; S.uses = [{ id: 'quedarse', d: 1.8, r: 0.5, pos: () => F.mat.position, label: { es: 'Volver al colchón', en: 'Go back to the mattress' }, use() { F.stay = true; } }].map((u) => ({ ...u, done: false })); S._q = [];
      Scenes.setGoal(L({ es: 'Si quieres, vete: baja por el camino hasta la carretera. El camión de leche pasa a las seis por el kilómetro cuarenta y dos.', en: 'If you want, leave: go down the track to the road. The milk lorry passes kilometre forty-two at six.' })); },
    tick(S) { const F = C(S); if (F.stay) { S.uses = null; Scenes.setGoal(null); return true; } const W = S.walk; if (W && W.on && W.p.z > 168) { F.left = true; S.uses = null; Scenes.setGoal(null); return true; } return false; } };

  SCENES.cap6 = {
    setup(S) { Cap6Set.build(S); MODES.campaign.noAmbience = true; Ambience.stop(); Cap6Set.light(S, 'car'); const F = C(S); sit(S, F.CX + 0.45, 1.22, 0.55, Math.PI / 2 + 0.3, -0.05, 2.0); },
    update(S, dt) { Cap6Set.update(S, dt); },
    teardown(S) { SceneWalk.stop(S); S.walk = null; S.uses = null; Cap6Set.dispose(S); },
    steps: [
      Step.card({ es: 'Parte I · Cuerda', en: 'Part I · Winding' }, { es: 'Tiple', en: 'Tiple' }, head),
      Step.run(() => { SceneAudio.startTruck && SceneAudio.startTruck(); }),
      Step.fade(0, 1.6, false),
      SAY('La carretera de la sierra subía en zigzag entre pinos y eucaliptos, y luego solo entre pinos, y luego entre piedras, y en cada curva el aire se volvía más fino y más frío y el cielo más azul, de un azul de esmalte, sin una nube.', 'The sierra road zigzagged up between pines and eucalyptus, then only pines, then rocks, and at every bend the air grew thinner and colder and the sky bluer, an enamel blue, without a cloud.'),
      Step.choice({ es: '¿Cuántas curvas?', en: 'How many bends?' }, [{ es: 'Cuarenta y tantas.', en: 'Forty-something.' }, { es: 'Sesenta y una.', en: 'Sixty-one.' }, { es: 'No las ha contado.', en: 'He hasn’t counted them.' }], 1,
        [{ es: 'No. Las había contado todas. No podía evitarlo.', en: 'No. He had counted every one. He couldn’t help it.' }, { es: '', en: '' }, { es: 'Las había contado. Siempre las cuenta.', en: 'He had counted them. He always does.' }]),
      Step.run(() => SceneAudio.bridge(3.0)),
      Step.wait(1.6),
      SAY('En el kilómetro treinta y uno pasaron por un puente de piedra sobre un barranco y la carretera sonó hueca bajo las ruedas, y el chófer, que no había dicho una sola palabra desde La Recoleta, dijo: —El puente de la Viuda. Fue lo único que dijo en todo el viaje.', 'At kilometre thirty-one they crossed a stone bridge over a ravine and the road sounded hollow under the wheels, and the chauffeur, who hadn’t said a single word since La Recoleta, said: “The Widow’s bridge.” It was the only thing he said the whole journey.'),
      Step.run((S) => { C(S).crossOn = true; }),
      Step.gaze((S) => C(S).cross.getWorldPosition(V(0, 0.6, 0)), 0.35, 0.4),
      SAY('Después del puente, una recta larga con eucaliptos, y después una curva muy cerrada sobre un precipicio, con una cruz de hierro clavada en la roca y un montón de flores secas a sus pies. No tenía nombre. Las cruces del camino nunca tienen nombre, pero la gente de los pueblos se los pone igual.', 'After the bridge, a long straight with eucalyptus, and then a very sharp bend above a precipice, with an iron cross driven into the rock and a heap of dried flowers at its foot. It had no name. Roadside crosses never have names, but village people give them one anyway.'),
      SAY('En el kilómetro cuarenta y dos el Packard dejó la carretera y tomó un camino de tierra que subía entre dos postes de piedra sin cancela. Tres kilómetros más de pinos. Luego los pinos se abrieron.', 'At kilometre forty-two the Packard left the road and took a dirt track climbing between two stone gateposts with no gate. Three more kilometres of pines. Then the pines opened.'),
      Step.fade(1, 1.2),
      Step.run(() => SceneAudio.stopAll()),
      // ---- el patio ----
      go('day', (S) => { sit(S, 1.6, 1.62, 7.6, CampUtil.yawTo(1.6, 7.6, 0, -10), 0.12, 2.6); }),
      Step.fade(0, 1.6, false),
      SAY('Un edificio grande de piedra oscura, con dos alas en ángulo recto y una iglesia en la esquina, con un campanario sin campanas, los huecos vacíos como cuencas de ojos. Rejas abajo. Tablones arriba. En el tejado faltaban tejas, y entre dos vigas había echado raíces una higuera pequeña, torcida. Un pozo. Un olmo muerto. Un muro alto con trozos de vidrio de botella clavados en el borde.', 'A large building of dark stone, two wings at right angles and a church at the corner, with a bell tower without bells, its openings empty like eye sockets. Bars below. Boards above. Tiles missing from the roof, and between two beams a small, crooked fig tree had taken root. A well. A dead elm. A high wall with broken bottle glass set along the top.'),
      Step.find([{ pos: (S) => C(S).ins, r: 0.07, text: { es: 'Encima de la puerta principal, tallada en la piedra y medio borrada por la lluvia: CANTATE DOMINO CANTICUM NOVUM. Cantad al Señor un cántico nuevo.', en: 'Above the main door, carved in stone and half worn away by rain: CANTATE DOMINO CANTICUM NOVUM. Sing unto the Lord a new song.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: la inscripción de la puerta.', en: 'Hold <kbd>Q</kbd>: the inscription above the door.' })),
      SAY('Lo estaban esperando en el patio. Cinco personas. No en fila, no formados. Cada uno donde le había dado la gana estar: aquella gente no se ponía en fila para nadie. Los miró a todos a la vez, como si fueran un dibujo.', 'They were waiting for him in the courtyard. Five people. Not in a line, not in formation. Each where he pleased: these people didn’t line up for anyone. He looked at all of them at once, like a drawing.'),
      Step.find([
        { pos: (S) => C(S).gaspar.head.localToWorld(V(0, 0, 0.12)), r: 0.08, text: { es: 'Junto al pozo, un hombre enorme: un metro noventa y cinco, quizá ciento veinte kilos, todo hueso grande y músculo viejo. La cabeza rapada, llena de cicatrices pequeñas. En los párpados, un polvo gris que no se iba con agua. Polvo de mina. Polvo de metal gris.', en: 'By the well, an enormous man: one ninety-five, maybe a hundred and twenty kilos, all big bone and old muscle. Shaved head, covered in small scars. On his eyelids, a grey dust that water wouldn’t shift. Mine dust. Grey-metal dust.' } },
        { pos: (S) => C(S).apple.getWorldPosition(V(0, 0, 0)), r: 0.08, text: { es: 'Junto a la puerta de la iglesia, un hombre joven, guapo de una manera que era casi una ofensa, con traje de verano color crema. Pelaba una manzana con una navaja de muelle, en una sola tira continua, sin romperla, sin mirar, mientras lo miraba a él.', en: 'By the church door, a young man, handsome in a way that was almost an insult, in a cream summer suit. He was peeling an apple with a flick knife, in one continuous strip, without breaking it, without looking, while he looked at him.' } },
        { pos: (S) => C(S).remedios.head.localToWorld(V(0, 0, 0.12)), r: 0.08, text: { es: 'En el centro, una mujer de cuarenta años, muy erguida, moño bajo y tirante, vestido gris cerrado hasta el cuello. Una cara que uno olvidaría enseguida, y eso no era un accidente. Lo miraba midiendo algo.', en: 'In the middle, a woman of about forty, very upright, low tight bun, grey dress buttoned to the neck. A face you’d forget at once, and that was no accident. She looked at him as if measuring something.' } },
        { pos: (S) => C(S).nicanor.head.localToWorld(V(0, -0.12, 0.1)), r: 0.08, text: { es: 'En el banco, un gordo calvo con barba de tres días y ojos de perro viejo. En el cuello, más blanca que el resto de la piel, la marca del alzacuellos que no llevaba. Le hizo un brindis con la botella.', en: 'On the bench, a fat bald man with three days’ stubble and old-dog eyes. On his neck, whiter than the rest of his skin, the mark of the dog collar he wasn’t wearing. He toasted him with the bottle.' } },
        { pos: (S) => C(S).celes.head.localToWorld(V(0, 0, 0.1)), r: 0.08, text: { es: 'En una puerta del ala de las rejas, un viejo muy viejo con delantal de herrero y gafas de alambre en la frente, limpiándose las manos dedo por dedo. La cabeza ladeada a la izquierda todo el rato. Sordo del derecho.', en: 'In a doorway of the barred wing, a very old man in a smith’s apron with wire spectacles pushed up on his forehead, wiping his hands finger by finger. Head tilted to the left the whole time. Deaf in the right ear.' } },
      ], 5, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: los cinco, como un dibujo · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the five, like a drawing · ${n}/${k}` })),
      Step.run((S) => { const F = C(S); F.pack.visible = false; if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 2.4, 0.03, 'lowpass', 300, 120); }),
      SAY('El chófer dejó la maleta de cartón a sus pies y se fue. El ruido del motor bajó por el camino de tierra entre los pinos y se perdió. El viento en los pinos. Un cuervo. El gorgoteo de la botella. El chasquido de la navaja al cortar el último trozo de piel de la manzana.', 'The chauffeur set the cardboard suitcase at his feet and left. The engine noise went down the dirt track between the pines and was lost. Wind in the pines. A crow. The gurgle of the bottle. The click of the knife cutting the last of the apple peel.'),
      SAY('—Bueno —dijo el guapo—. Ya ha llegado. El que encontró la bomba. Más flaco de lo que pensaba. ¿Cuánto pesas, chiquillo? ¿Cincuenta? —Sesenta y uno. —Sesenta y uno. —Una risa bonita, musical, de tenor—. Con la maleta, querrás decir.', '“Well,” said the handsome one. “He’s here. The one who found the bomb. Thinner than I thought. How much do you weigh, kid? Fifty?” “Sixty-one.” “Sixty-one.” A pretty, musical laugh, a tenor’s. “With the suitcase, you mean.”'),
      Step.run((S) => { const F = C(S); F.gaspar.g.position.set(1.6, 0, 6.85); F.gaspar.g.rotation.y = 0; F.gaspar.g.children.forEach(() => {}); S.yawC = S.yaw = Input.state.yaw = CampUtil.yawTo(1.6, 7.6, 1.6, 6.85); S.pitch = Input.state.pitch = 0.35; }),
      SAY('El hombre enorme se levantó del brocal, despacio, desplegándose como una grúa, y se paró delante de él, a un palmo. Olía a tabaco negro y a sudor y a algo químico, ácido. —¿Tú sabes cuántos años llevo yo haciendo esto? Veintidós. ¿Tú sabes cuántos años tienes tú? —Veintiuno.', 'The enormous man got up from the well, slowly, unfolding like a crane, and stopped in front of him, a hand’s breadth away. He smelled of black tobacco and sweat and something chemical, acid. “Do you know how many years I’ve been doing this? Twenty-two. Do you know how old you are?” “Twenty-one.”'),
      SAY('—Y ahora llegas tú, con tu cara de monaguillo y tu maleta de cartón y tus estudios, porque un día subiste una escalera y viste un reloj. —La voz más grave que había oído nunca; se sentía más en el pecho que en los oídos—. Aquí nadie sube escaleras, niño. Aquí se baja. Se baja y se baja y no se para nunca de bajar.', '“And now here you come, with your altar-boy face and your cardboard suitcase and your studies, because one day you climbed some stairs and saw a clock.” The deepest voice he had ever heard; you felt it more in your chest than in your ears. “Nobody climbs stairs here, boy. Here you go down. Down and down and you never stop going down.”'),
      Step.run((S) => { const F = C(S); F.gaspar.g.visible = false; F.remedios.g.position.set(1.6, 0, 6.4); S.yawC = S.yaw = Input.state.yaw = CampUtil.yawTo(1.6, 7.6, 1.6, 6.4); S.pitch = Input.state.pitch = 0.02; }),
      SAY('—No le hagas caso. Gaspar odia a los de ciudad, a los que tienen estudios, a los de menos de cuarenta y, sobre todo, a los recomendados. Y tú, chiquillo, eres las cuatro cosas. —Hugo —dijo la mujer—. Cállate.', '“Don’t mind him. Gaspar hates city boys, people with schooling, anyone under forty and, above all, people with connections. And you, kid, are all four.” “Hugo,” said the woman. “Shut up.”'),
      SAY('La mujer vino hacia él y se paró a la distancia justa. Lo miró a los ojos.', 'The woman came towards him and stopped at exactly the right distance. She looked him in the eye.'),
      Step.goal('Sostén la mirada.', 'Hold her gaze.'),
      Step.gaze((S) => C(S).remedios.head.localToWorld(V(0, 0.03, 0.12)), 0.08, 3.0),
      Step.goal(null),
      SAY('Fue un reconocimiento. Ella lo estaba leyendo igual que él la leía a ella. Con la misma técnica. Y los dos lo sabían. Se quedaron así, en el centro del patio, midiéndose, dos relojes mirándose las esferas. Fue ella la que apartó la vista primero. No porque perdiera: porque ya había terminado de leer.', 'It was a recognition. She was reading him the way he was reading her. The same technique. And both of them knew it. They stayed like that, in the middle of the courtyard, sizing each other up, two clocks looking at each other’s faces. She was the first to look away. Not because she lost: because she had finished reading.', { cls: 'inner' }),
      SAY('—Duermes poco. No comes bien desde hace tres semanas. Te has acostado con una mujer hace muy poco, por primera vez. Llevas algo en el bolsillo interior que no quieres que nadie vea. Y le tienes más miedo a él —un gesto hacia el camino, hacia la capital— que a todos nosotros juntos. Bien. Haces bien.', '“You sleep little. You haven’t eaten properly for three weeks. You’ve lain with a woman very recently, for the first time. You carry something in your inside pocket you don’t want anyone to see. And you’re more afraid of him”—a nod towards the track, towards the capital—“than of all of us together. Good. You’re right to be.”'),
      Step.run((S) => { const F = C(S); F.remedios.g.visible = false; F.nicanor.g.position.set(2.6, 0, 6.6); }),
      // ---- el recorrido con Nicanor ----
      SAY('El gordo de la botella se llamaba Nicanor Vidaurre y fue el que le enseñó el edificio, dando tumbos, con la botella en una mano y la maleta en la otra, porque se había empeñado en llevársela él. —Párroco de Santa María de los Remedios, en el Matadero, once años. Y luego me di cuenta de que Dios no existe, o de que existe y es un hijo de puta, que viene a ser lo mismo. Aquí por lo menos nadie te pide que le perdones.', 'The fat man with the bottle was called Nicanor Vidaurre, and he was the one who showed him the building, lurching, bottle in one hand and suitcase in the other, because he had insisted on carrying it. “Parish priest of Santa María de los Remedios, in the Matadero, eleven years. And then I realised God doesn’t exist, or exists and is a son of a bitch, which comes to the same. Here at least nobody asks you to forgive them.”'),
      Step.run((S) => walkOut(S, 1.6, 7.6, CampUtil.yawTo(1.6, 7.6, 7, -14.9))),
      Step.reach(7, -13.2, 1.4, 'Entra por la puerta principal.', 'Go in through the main door.'),
      Step.fade(1, 0.6),
      go('in', (S) => { const F = C(S); CampUtil.walk(S, F.IX + 1, 0, 0, -Math.PI / 2); }),
      Step.fade(0, 0.8, false),
      SAY('—¿Qué hace usted aquí? —Escucho. Radio. Morse. Cifra. Lo que dicen los demás cuando creen que nadie les oye. Es como la confesión, pero sin dar la absolución después. Mucho más descansado.', '“What do you do here?” “I listen. Radio. Morse. Cipher. What other people say when they think nobody can hear. It’s like confession, but without having to give absolution afterwards. Much more restful.”'),
      SAY('El ala derecha era donde vivían ellos: seis cuartos, una cocina, un comedor con una mesa de refectorio para cuarenta en la que comían seis. El ala de las rejas era el taller, la armería y lo que Nicanor llamó el sótano, sin explicar qué era.', 'The right wing was where they lived: six rooms, a kitchen, a dining hall with a refectory table for forty at which six ate. The barred wing was the workshop, the armoury and what Nicanor called the cellar, without explaining what it was.'),
      Step.reach(100 + 26.6, 0.4, 1.4, 'Recorre el pasillo.', 'Walk down the corridor.'),
      Step.find([{ pos: (S) => C(S).sotano.clone().setY(1.4), r: 0.1, text: { es: 'Una puerta de hierro con barrotes y una cadena nueva. El sótano. Nicanor pasó por delante sin mirarla.', en: 'An iron door with bars and a new chain. The cellar. Nicanor walked past without looking at it.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: la puerta del fondo.', en: 'Hold <kbd>Q</kbd>: the door at the end.' })),
      Step.fade(1, 0.6),
      go('dorm', (S) => { const F = C(S); CampUtil.walk(S, F.DX + 0.8, 0, 3.5, -Math.PI / 2); }),
      Step.fade(0, 0.8, false),
      SAY('—Aquí dormían los tiples. Los niños. Los que cantaban las voces altas. Cuarenta, de ocho a trece años. Cuando les cambiaba la voz, los mandaban a casa.', '“The trebles slept here. The boys. The ones who sang the high voices. Forty, from eight to thirteen. When their voices broke, they sent them home.”'),
      SAY('Cuarenta camitas de hierro pintado de blanco, cortas, estrechas, en dos filas, con sus mesillas y sus crucifijos pequeños en la pared. Colchones de crin manchados de humedad. Olía a cerrado, a ratón, y a algo dulce y podrido que debía de ser el olor de cuarenta niños que habían dormido allí hacía veinte años.', 'Forty little white-painted iron beds, short, narrow, in two rows, with their bedside tables and their small crucifixes on the wall. Horsehair mattresses stained with damp. It smelled shut-in, of mice, and of something sweet and rotten that must have been the smell of forty boys who had slept there twenty years before.'),
      SAY('—¿Por qué cerró el seminario? —Por lo de la procesión. Lo de Santa Úrsula, en el diecisiete. Una bomba en el paso de la Virgen. Murieron once niños del coro de San Gregorio que iban cantando delante. Un atentado anarquista. O eso dijeron. —Bebió—. Lo cerraron en el dieciocho. Y en el diecinueve lo abrió él.', '“Why did the seminary close?” “Because of the procession. Santa Úrsula, in seventeen. A bomb on the Virgin’s float. Eleven boys from the San Gregorio choir who were singing in front were killed. An anarchist attack. Or so they said.” He drank. “They closed it in eighteen. And in nineteen he opened it.”'),
      SAY('—El Maestro de Capilla. Así lo llamamos. Fue niño cantor aquí. Tiple. Luego tenor. Y en la procesión del diecisiete era el maestro del coro: iba delante de los niños, de espaldas, con la batuta. Por eso le pilló la pierna. Por eso cojea.', '“The Chapel Master. That’s what we call him. He was a choirboy here. Treble. Then tenor. And in the seventeen procession he was choirmaster: he walked in front of the boys, backwards, with the baton. That’s how his leg got caught. That’s why he limps.”'),
      SAY('Sus padres se habían casado en mayo de 1917. La procesión de Santa Úrsula era el veintiuno de octubre. Octubre de 1917. Cinco meses después de la boda. Las fechas no encajaban. O encajaban de otra forma. No supo de cuál.', 'His parents had married in May 1917. The Santa Úrsula procession was on the twenty-first of October. October 1917. Five months after the wedding. The dates didn’t fit. Or they fitted another way. He didn’t know which.', { cls: 'inner' }),
      SAY('Nicanor dejó la maleta junto a la primera cama de la fila de la izquierda. —Esta es la tuya. —No quepo. —Ya. Esa es la idea. Hugo lo propuso. Gaspar votó a favor. Remedios no votó. Yo me abstuve, porque estaba borracho. Celestino no se enteró. Y el Maestro dijo que le parecía bien. Que así te acordarías. Bienvenido al Coro, chaval.', 'Nicanor set the suitcase by the first bed in the left-hand row. “This one’s yours.” “I don’t fit.” “I know. That’s the idea. Hugo proposed it. Gaspar voted in favour. Remedios didn’t vote. I abstained, because I was drunk. Celestino didn’t notice. And the Master said it was fine by him. That this way you’d remember.” “Welcome to the Choir, lad.”'),
      SAY('—¿Acordarme de qué? —De lo que eres.', '“Remember what?” “What you are.”'),
      Step.fade(1, 1.4),
      // ---- la cena ----
      Step.card(null, null, { es: 'Refectorio de San Gregorio · 21:10', en: 'San Gregorio refectory · 21:10' }, 2.8),
      go('ref', (S) => { const F = C(S); sit(S, F.RX + 3.3, 1.2, 0.95, CampUtil.yawTo(F.RX + 3.3, 0.95, F.RX + 3.3, -0.95), -0.1, 2.0); }),
      Step.fade(0, 1.2, false),
      SAY('Comieron los seis en el extremo más cercano a la cocina de una mesa para cuarenta. Gaspar a la cabecera, comiendo con las manos, sin mirar a nadie. Remedios despacio, con los cubiertos. Nicanor con su botella. Celestino al final, solo, con la cabeza ladeada: había cocinado él, una sopa de ajo muy buena. Nadie lo dijo. En la otra cabecera había un plato, un vaso y unos cubiertos, y nadie se sentaba en él.', 'The six of them ate at the end nearest the kitchen of a table for forty. Gaspar at the head, eating with his hands, looking at no one. Remedios slowly, with knife and fork. Nicanor with his bottle. Celestino at the far end, alone, head tilted: he had cooked, a very good garlic soup. Nobody said so. At the other head there was a plate, a glass and cutlery, and nobody sat there.'),
      SAY('—Aquí todos tenemos un nombre de voz —dijo Hugo, partiendo una naranja en gajos con la navaja—. Tradición del Maestro. Gaspar es el Bajo: la voz más grave del mundo, y lo más bajo que hay. Remedios es la Contralto, la voz de mujer más oscura. Nicanor es el Barítono, ni muy alto ni muy bajo, como su fe. Celestino es el Contrabajo, que no es una voz pero nadie se atreve a quitárselo. Y yo...', '“We all have a voice name here,” said Hugo, cutting an orange into segments with his knife. “The Master’s tradition. Gaspar is the Bass: the deepest voice in the world, and the lowest thing there is. Remedios is the Contralto, the darkest woman’s voice. Nicanor is the Baritone, neither high nor low, like his faith. Celestino is the Double Bass, which isn’t a voice, but nobody dares take it from him. And I...”'),
      Step.choice({ es: '¿Y él?', en: 'And him?' }, [{ es: '—Tú eres el Tenor.', en: '“You’re the Tenor.”' }, { es: '—Tú eres el Alto.', en: '“You’re the Alto.”' }, { es: 'Callar.', en: 'Say nothing.' }], 0,
        [{ es: '', en: '' }, { es: 'No. Se ríe en tenor. Y canta la melodía.', en: 'No. He laughs like a tenor. And he sings the melody.' }, { es: 'Lo sabía. Y Hugo necesitaba que se lo dijeran.', en: 'He knew. And Hugo needed to be told.' }]),
      SAY('—¿Cómo lo sabes? —Porque te ríes en tenor. Y porque es la voz que canta la melodía. La que se lleva los aplausos. Y tú eres de los que necesitan que les aplaudan.', '“How do you know?” “Because you laugh like a tenor. And because it’s the voice that sings the melody. The one that gets the applause. And you’re the kind who needs applause.”'),
      SAY('Silencio. Nicanor soltó una carcajada y se atragantó con el vino. La comisura de Remedios se movió un milímetro. Gaspar levantó la vista del plato, por primera vez en toda la cena, y lo miró. Hugo sonrió. Pero la sonrisa ya no le llegaba a los ojos.', 'Silence. Nicanor burst out laughing and choked on his wine. The corner of Remedios’ mouth moved a millimetre. Gaspar looked up from his plate, for the first time all dinner, and looked at him. Hugo smiled. But the smile no longer reached his eyes.'),
      Step.run((S) => { const F = C(S); F.diners.hugo.g.position.set(F.RX + 3.3, 0.0, 1.45); F.diners.hugo.g.rotation.y = Math.PI; S.roll = 0.02; if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.3, 0.02, 'bandpass', 800, null, 2); }),
      SAY('—Muy bien, chiquillo. Muy listo. —Dejó la navaja sobre la mesa, despacio, con la hoja hacia él. Rodeó la mesa. Se puso detrás. Le puso las dos manos en los hombros, los pulgares en la base del cuello, justo donde pasan las arterias, apretando un poco, nada, casi una caricia—. ¿Y tú? ¿Qué voz te pondría el Maestro a ti? Yo te lo digo. Tiple.', '“Very good, kid. Very clever.” He set the knife on the table, slowly, blade towards him. Walked round the table. Stood behind him. Put both hands on his shoulders, thumbs at the base of his neck, right where the arteries run, pressing a little, nothing, almost a caress. “And you? What voice would the Master give you? I’ll tell you. Treble.”'),
      SAY('—La voz de los niños. La de los que todavía no son hombres. Cuarenta camitas arriba para los tiples, y tú vas a dormir en una. Y cuando te cambie la voz, si es que te cambia, a lo mejor te ponemos otro nombre. Pero no te va a cambiar. A los tiples, aquí, no les cambia la voz.', '“The boys’ voice. The voice of those who aren’t men yet. Forty little beds upstairs for the trebles, and you’re going to sleep in one. And when your voice breaks, if it does, maybe we’ll give you another name. But it won’t break. Here, trebles’ voices don’t break.”'),
      SAY('—¿Por qué? —Hugo le soltó los hombros y se rió, su risa musical, de tenor. —Porque no les da tiempo.', '“Why?” Hugo let go of his shoulders and laughed, his musical tenor laugh. “Because they don’t have time.”'),
      Step.run((S) => { S.roll = 0; }),
      Step.fade(1, 1.6),
      // ---- la noche ----
      Step.card(null, null, { es: 'Dormitorio de los tiples · 02:40', en: 'The trebles’ dormitory · 02:40' }, 2.8),
      go('moon', (S) => { const F = C(S); sit(S, F.DX + 2.0, 0.35, 1.0, -Math.PI / 2, 0.9, 2.8); S.pitchMin = -0.8; S.pitchMax = 1.35; }),
      Step.fade(0, 1.6, false),
      SAY('No durmió en la cama de niño. Sacó el colchón de crin, lo puso en el suelo junto a la ventana que daba al barranco y se tumbó encima vestido, con la chaqueta puesta y el pañuelo con la violeta en el bolsillo interior. Contó las vigas del techo.', 'He didn’t sleep in the child’s bed. He pulled out the horsehair mattress, put it on the floor by the window over the ravine and lay down on it fully dressed, jacket on, the handkerchief with the violet in his inside pocket. He counted the ceiling beams.'),
      Step.choice({ es: 'Vigas, camas, crucifijos.', en: 'Beams, beds, crucifixes.' }, [{ es: 'Treinta y seis. Cuarenta. Cuarenta.', en: 'Thirty-six. Forty. Forty.' }, { es: 'Treinta y seis. Cuarenta. Treinta y nueve.', en: 'Thirty-six. Forty. Thirty-nine.' }], 1,
        [{ es: 'Volvió a contar. Algo no cuadraba. Cuenta los crucifijos otra vez.', en: 'He counted again. Something didn’t add up. Count the crucifixes again.' }, { es: '', en: '' }]),
      SAY('Treinta y nueve crucifijos. Cuarenta camas.', 'Thirty-nine crucifixes. Forty beds.', { cls: 'inner' }),
      Step.run((S) => { const F = C(S); CampUtil.walk(S, F.DX + 2.0, 0, 2.2, -Math.PI / 2); }),
      Step.reach(200 + 3.6 + 19 * 1.5, 4.9, 1.0, 'Recorre la nave a oscuras, cama por cama.', 'Walk the length of the dormitory in the dark, bed by bed.'),
      Step.run((S) => { const F = C(S), b = F.beds[39]; SceneWalk.stop(S); sit(S, b.x, 1.0, 6.3, Math.PI, 0.0, 1.2); }),
      Step.find([
        { pos: (S) => V(C(S).beds[39].x, 1.5, 6.9), r: 0.08, text: { es: 'La última cama de la fila de la derecha, la del rincón, no tenía crucifijo. Un clavo vacío y una marca rectangular más blanca en la cal: la sombra de algo que había estado colgado allí mucho tiempo y que alguien había quitado.', en: 'The last bed in the right-hand row, the one in the corner, had no crucifix. An empty nail and a whiter rectangle on the lime: the shadow of something that had hung there a long time and that someone had taken down.' } },
        { pos: (S) => C(S).marks.localToWorld(V(-0.05, -0.02, 0)), r: 0.07, text: { es: 'Debajo, a la altura de la almohada, arañadas en la cal con algo puntiagudo, una aguja, un clavo, una uña: rayas verticales en grupos de cinco, cuatro y una quinta atravesándolas. Como las que hacen los presos para contar los días.', en: 'Below, at pillow height, scratched into the lime with something sharp, a needle, a nail, a fingernail: vertical strokes in groups of five, four and a fifth across them. Like the ones prisoners make to count the days.' } },
      ], 2, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: la pared del rincón · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the corner wall · ${n}/${k}` })),
      Step.choice({ es: 'Las contó. No pudo evitarlo.', en: 'He counted them. He couldn’t help it.' }, [{ es: 'Doscientas quince.', en: 'Two hundred and fifteen.' }, { es: 'Doscientas dieciocho.', en: 'Two hundred and eighteen.' }, { es: 'Doscientas veinte.', en: 'Two hundred and twenty.' }], 1,
        [{ es: 'Cuarenta y tres grupos de cinco y algunas sueltas. Cuéntalas otra vez.', en: 'Forty-three groups of five and a few loose ones. Count again.' }, { es: '', en: '' }, { es: 'Cuarenta y tres grupos de cinco y algunas sueltas. Cuéntalas otra vez.', en: 'Forty-three groups of five and a few loose ones. Count again.' }]),
      SAY('Cuarenta y tres grupos de cinco. Y tres rayas sueltas. Doscientas dieciocho.', 'Forty-three groups of five. And three loose strokes. Two hundred and eighteen.', { cls: 'inner' }),
      Step.find([{ pos: (S) => C(S).marks.localToWorld(V(0.3, -0.15, 0)), r: 0.06, text: { es: 'Al final de las rayas, más pequeña, una palabra. Alguien la había raspado después, con fuerza, hasta dejar solo un hueco irregular, más hondo que el resto de la pared. Solo se veía la primera letra, en el borde, porque el que la había raspado se había dejado un trocito. Una E.', en: 'At the end of the strokes, smaller, a word. Someone had scraped it out afterwards, hard, leaving only a ragged hollow, deeper than the rest of the wall. Only the first letter showed, at the edge, because whoever scraped it had left a sliver. An E.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: al final de las rayas.', en: 'Hold <kbd>Q</kbd>: at the end of the strokes.' })),
      Step.fade(1, 1.2),
      go('moon', (S) => { const F = C(S); sit(S, F.DX + 2.0, 0.35, 1.0, -Math.PI / 2, 0.9, 2.8); S.pitchMin = -0.8; S.pitchMax = 1.35; }),
      Step.fade(0, 1.4, false),
      Step.run(() => Cap6Set.harmonium(true)),
      Step.wait(3.0),
      SAY('En algún momento de la madrugada empezó a sonar el armonio. Venía de abajo, de la iglesia, a través del suelo, muy bajo, casi un temblor. Una melodía lenta, en tono menor, en latín. Alguien la tocaba muy bien. Alguien que tenía la yema del índice derecho más plana que las otras. No había oído llegar ningún coche.', 'At some point before dawn the harmonium began to play. It came from below, from the church, through the floor, very low, almost a tremor. A slow melody, in a minor key, in Latin. Someone played it very well. Someone whose right index fingertip was flatter than the others. He hadn’t heard any car arrive.'),
      Step.run(() => { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime; for (let i = 0; i < 9; i++) AUDIO.osc(SceneAudio.dest(), 'sine', 60, 40, t + i * 0.9, 0.2, 0.08 - i * 0.004); }),
      Step.wait(3.4),
      SAY('Mucho después, oyó pasos en el pasillo. Pasos pesados, lentos, de alguien muy grande que intentaba no hacer ruido y no lo conseguía. Se pararon delante de la puerta. La puerta no se abrió. Pero la voz llegó igual, a través de la madera, tan grave que se sentía más en el pecho que en los oídos.', 'Much later, he heard footsteps in the corridor. Heavy, slow steps, of someone very big trying not to make a sound and failing. They stopped outside the door. The door didn’t open. But the voice came anyway, through the wood, so deep you felt it in your chest more than in your ears.'),
      SAY('—Vete, niño. Vete mientras puedas. Mañana, de madrugada, antes de que se levanten. Bajas por el camino hasta la carretera, y en el kilómetro cuarenta y dos pasa un camión de leche a las seis que te lleva hasta Ocoa. No mires atrás. Vete lejos. Cámbiate el nombre.', '“Go, boy. Go while you can. Tomorrow, before dawn, before they’re up. Go down the track to the road, and at kilometre forty-two a milk lorry passes at six that’ll take you to Ocoa. Don’t look back. Go far away. Change your name.”'),
      SAY('—¿Por qué? —Al otro lado de la puerta, Gaspar Ordóñez tardó mucho en contestar. —Porque aquí los tiples no duran. Y los que duran es peor.', '“Why?” On the other side of the door, Gaspar Ordóñez took a long time to answer. “Because trebles don’t last here. And the ones who do, it’s worse.”'),
      Step.run(() => { if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime; for (let i = 0; i < 9; i++) AUDIO.osc(SceneAudio.dest(), 'sine', 60, 40, t + i * 0.9, 0.2, 0.05 - i * 0.005); }),
      Step.fade(1, 1.6),
      // ---- las cinco y media: el camino ----
      Step.card(null, null, { es: 'Seminario de San Gregorio · sábado 2 de marzo de 1940 · 05:31', en: 'San Gregorio Seminary · Saturday 2 March 1940 · 05:31' }, 3.0),
      go('dawn', (S) => { walkOut(S, 1.6, 9.5, Math.PI); }),
      Step.fade(0, 1.4, false),
      leaveStep,
      Step.run((S) => { const F = C(S); if (F.left) { SceneWalk.stop(S); sit(S, S.eye.x, S.eye.y, S.eye.z, CampUtil.yawTo(S.eye.x, S.eye.z, 0, 177) , -0.05, 2.0); F.truckGo = true; } else { sit(S, 1.6, 1.62, 11.5, Math.PI, -0.25, 2.0); F.truckGo = true; } }),
      { tick(S) { const F = C(S); if (!F.left) return true; return F.truck.position.x > -26; } },
      { enter(S) { const F = C(S); if (!F.left) return; S._turn = 0; }, tick(S, dt) { const F = C(S); if (!F.left) return true; S._turn += dt; const y0 = CampUtil.yawTo(S.eye.x, S.eye.z, 0, 177); const k = clamp(S._turn / 2.4, 0, 1), y = y0 + k * Math.PI; S.yawC = S.yaw = Input.state.yaw = y; S.pitch = Input.state.pitch = -0.05 + k * 0.1; return S._turn > 3.2; } },
      SAYF((S) => C(S).left ? { es: 'Llegó a la carretera a las seis menos dos. Vio los faros del camión subir por la curva, amarillos en la luz gris. Y sin decidirlo, como se para un volante con un papel de fumar, se dio la vuelta.', en: 'He reached the road at two minutes to six. He saw the lorry’s headlights climb through the bend, yellow in the grey light. And without deciding to, the way a balance stops with a cigarette paper, he turned round.' } : { es: 'No bajó. Se quedó tumbado en el colchón de crin, mirando cómo la luz gris subía por el barranco. Oyó, muy abajo, muy lejos, un motor que subía la curva.', en: 'He didn’t go down. He stayed lying on the horsehair mattress, watching the grey light climb the ravine. He heard, far below, very far, an engine climbing the bend.' }),
      Step.wait(2.0),
      SAY('A las seis de la mañana, en el kilómetro cuarenta y dos, pasó el camión de la leche.', 'At six in the morning, at kilometre forty-two, the milk lorry went by.'),
      SAY('Él no estaba en él.', 'He was not on it.'),
      Step.fade(1, 2.4),
    ],
  };
  // SAYF: texto que depende de lo que hizo el jugador
  function SAYF(fn, o) { return { enter(S) { Scenes.say(L(fn(S)), o); }, tick(S) { return !S.line; } }; }
  const m = CAMP_BY_ID['P1-M6']; m.scene = 'cap6'; m.map = 'c6_san_gregorio';
})();
