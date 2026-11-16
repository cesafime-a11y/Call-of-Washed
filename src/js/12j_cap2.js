// ---- 12j_cap2.js ----
// =====================================================================
// PARTE I · CAPÍTULO 2 · «Escape» (P1-M2) · San Elías, otoño de 1939
// Tramos: el tren y el matasellos · el aula de Mecanismos (Lucio) ·
// la Relojería Anselmo (Clara y el muelle espiral perdido) · el café
// El Ajedrez · la plaza de Armas · la pensión (el Omega del señor Quirós)
// y la calle Real 41 · la azotea en Nochevieja · la puerta de La Recoleta.
// Lugares en un mismo mapa, separados en x: tren 0, aula 30, relojería 60,
// café 90, plaza 120, pensión 150, Quirós 170, azotea 200, Recoleta 240.
// =====================================================================
MAPS.c2_san_elias = {
  name: { es: 'San Elías · otoño de 1939', en: 'San Elías · autumn 1939' },
  desc: { es: 'La Politécnica, la calle Platerías, la plaza de los Libreros y la azotea de la relojería.', en: 'The Polytechnic, Calle Platerías, the booksellers’ square and the watch shop roof.' },
  campaign: true,
  thumb: ['#8a96a0', '#5a5246', '#2e2a24'],
  theme: { skyTop: 0x5a6e88, skyMid: 0xa8b4bc, skyBot: 0xcac4b0, fog: 0xa8aca4, fogNear: 60, fogFar: 320, sun: 0xffe2b8, sunI: 0.3, sunDir: [0.4, 0.8, 0.3], hemiTop: 0xcfd6dc, hemiBot: 0x5a5040, hemiI: 0.3, exposure: 1.05, cloud: 0.5, rays: 0, glow: 0, lamps: false, soldFill: 0.5, soldRim: 0.3 },
  build(B) {
    B.bounds(-20, -40, 280, 60);
    B.ground(-20, -40, 280, 60, { y: -0.6, pattern: PAT.COBBLE, color: 0x4a4440 });
    B.spawn('ffa', 0, 0, 0, 0);
  },
};

const Cap2Set = {
  build(S) {
    const root = new THREE.Group(); MapSys.decor.add(root);
    const K = CampKit(root), { box, grp, cyl, ball, solid, furn, canvasTex, plane, room, win, person, M } = K, V = CampUtil.V;
    const wood = 0x6a4a2c, woodD = 0x3e2a18, walnut = 0x55361e, brass = 0xb8913f, plaster = 0xd2c6a8;
    const lights = {};
    const addL = (k, l) => { root.add(l); if (l.target) root.add(l.target); (lights[k] = lights[k] || []).push([l, l.intensity]); l.intensity = 0; return l; };

    // ========== EL TREN DE LAS CINCO (x 0) ==========
    box(2.6, 0.1, 3.2, 0x3a2e24, 0, -0.05, 0);
    for (const s of [-1, 1]) { box(2.4, 0.45, 0.55, 0x5a3a2a, 0, 0.22, s * 1.2); box(2.4, 0.7, 0.12, 0x6a4232, 0, 0.8, s * 1.5); }
    box(0.12, 2.4, 3.2, 0x5a4a38, -1.3, 1.2, 0); box(0.12, 2.4, 3.2, 0x5a4a38, 1.3, 1.2, 0, root);
    const trainWin = box(0.02, 0.9, 1.6, 0xdfe8ea, 1.24, 1.45, 0, root, { e: 0xc8d6dc, ei: 1.0 });
    box(2.6, 0.1, 3.2, 0x4a3e30, 0, 2.4, 0);
    // el campo que pasa: postes de telégrafo
    const poles = []; for (let i = 0; i < 6; i++) { const p = box(0.08, 4, 0.08, 0x3a2a1a, 6, 1.5, -12 + i * 5); poles.push(p); }
    box(0.1, 3, 60, 0x6a7a5a, 9, -0.2, 0);
    // el sobre amarillo en las manos (sobre las rodillas)
    const envTex = canvasTex(320, 220, (g, w, h) => {
      g.fillStyle = '#d6b552'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(120,90,30,.25)'; g.fillRect(0, 0, w, 6);
      g.fillStyle = '#2a2014'; g.font = '13px monospace'; g.fillText('MINISTERIO DE GUERRA', 20, 34); g.fillText('República de Sanmarcial', 20, 52);
      g.font = '15px monospace'; g.fillText('Sr. D. SANTIAGO FIERROS LAZCANO', 30, 128); g.fillText('Calle de los Herreros', 30, 148); g.fillText('VILLA CORCOVADO', 30, 168);
      g.strokeStyle = 'rgba(90,50,140,.85)'; g.lineWidth = 2.5; g.beginPath(); g.arc(256, 52, 32, 0, 7); g.stroke(); g.beginPath(); g.arc(256, 52, 22, 0, 7); g.stroke();
      g.fillStyle = 'rgba(90,50,140,.9)'; g.font = 'bold 11px monospace'; g.textAlign = 'center'; g.fillText('21 SEP 1939', 256, 56); g.font = '7px monospace'; g.fillText('SAN ELÍAS', 256, 30); g.fillText('CORREOS', 256, 80);
      g.fillStyle = '#9c1a14'; g.beginPath(); g.arc(150, 200, 14, 0, 7); g.fill();
    });
    const env = plane(0.32, 0.22, envTex, 0.15, 0.62, -1.05, 0, root, { rx: -1.15 });
    const orderTex = canvasTex(256, 320, (g, w, h) => { g.fillStyle = '#ece6d4'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2014'; g.font = '9px monospace';
      ['REPÚBLICA DE SANMARCIAL', 'MINISTERIO DE GUERRA', '', 'Por disposición del Decreto de', 'Neutralidad Armada de 2 de octubre', 'de 1939, y en virtud de la movili-', 'zación parcial del reemplazo de 1918,', 'se ordena al ciudadano', 'FIERROS LAZCANO, SANTIAGO,', 'presentarse en el Cuartel de', 'La Recoleta, Regimiento de', 'Artillería Nº 4, el día 8 de enero', 'de 1940, a las 07:00 horas,', 'provisto de: dos mudas, útiles de', 'aseo, una manta, cédula.'].forEach((l, i) => g.fillText(l, 14, 24 + i * 15));
      g.fillStyle = 'rgba(160,30,20,.7)'; g.fillRect(14, 104, 160, 1.2); });
    const order = plane(0.2, 0.25, orderTex, -0.18, 0.64, -1.0, 0, root, { rx: -1.15 }); order.rotation.z = 0.08;
    addL('train', new THREE.HemisphereLight(0xfff4e0, 0x403020, 1.0)).position.set(0, 3, 0);
    addL('train', new THREE.DirectionalLight(0xfff0d0, 1.3)).position.set(8, 6, 2);

    // ========== EL AULA DE MECANISMOS (x 30) ==========
    const AX = 30;
    room(AX, 0, AX + 12, 9, 4.2, { wall: 0xcfc4a8, floor: 0x4a3828, gaps: { s: [[AX + 0.6, AX + 1.8]] }, door: 2.4, dado: 1.0, dadoC: 0x6a5a40 });
    for (const z of [2.5, 5.0, 7.5]) win(AX + 11.93, 2.2, z, -Math.PI / 2, 1.3, 2.2);
    box(5, 0.25, 2, woodD, AX + 6, 0.12, 1.2); solid(AX + 3.5, 0.2, AX + 8.5, 2.2, 0, 0.3);           // tarima
    const bbTex = canvasTex(512, 200, (g, w, h) => { g.fillStyle = '#1e2620'; g.fillRect(0, 0, w, h); g.strokeStyle = '#d8d8cc'; g.lineWidth = 2; g.font = '18px serif'; g.fillStyle = '#d8d8cc';
      g.fillText('Escape de áncora', 30, 36); g.beginPath(); const cx = 300, cy = 110, R = 62; for (let i = 0; i < 15; i++) { const a = i / 15 * Math.PI * 2, b = (i + 0.6) / 15 * Math.PI * 2; g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.lineTo(cx + Math.cos(b) * (R + 16), cy + Math.sin(b) * (R + 16)); g.lineTo(cx + Math.cos(b + 0.1) * R, cy + Math.sin(b + 0.1) * R); } g.stroke();
      g.beginPath(); g.arc(cx, cy, 12, 0, 7); g.stroke(); g.beginPath(); g.moveTo(cx - 70, cy - 90); g.lineTo(cx, cy - 60); g.lineTo(cx + 70, cy - 90); g.stroke(); });
    plane(5.2, 2.0, bbTex, AX + 6, 2.3, 0.09);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { const x = AX + 3 + c * 3.0, z = 3.6 + r * 1.35; furn(2.2, 0.75, 0.55, wood, x, 0, z); box(2.2, 0.45, 0.4, woodD, x, 0.25, z + 0.55); }
    // compañeros sentados (de espaldas)
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { if ((r === 2 && c === 2) || Math.random() < 0.25) continue; for (const dx of [-0.5, 0.5]) person({ x: AX + 3 + c * 3 + dx, z: 3.6 + r * 1.35 + 0.55, ry: Math.PI, sit: true, coat: [0x3a3a3e, 0x4a4238, 0x2e3440][(r + c) % 3], hair: [0x2a2018, 0x4a3018, 0x1a1410][c % 3], leg: 0x2a2a2a }); }
    const iturbe = person({ x: AX + 6, y: 0.25, z: 1.4, ry: 0, coat: 0x2a2a2e, leg: 0x2a2a2e, hair: 0xb8b4ac, mous: 0xb8b4ac, glasses: true, tie: 0x5a1a1a });
    iturbe.arms[0].rotation.x = -1.4;
    // Lucio: alto, ancho, rubio; sentado a la izquierda de Santiago (tercera fila, junto a la ventana)
    const SEAT = V(AX + 9.5, 1.15, 6.25 + 0.55);
    const lucio = person({ x: AX + 8.5, z: 6.25 + 0.55, ry: Math.PI, sit: true, coat: 0x5a4a38, hair: 0xd8c070, leg: 0x3a3428, h: 1.08 });
    const ruler = box(0.4, 0.01, 0.04, 0xc8b080, AX + 8.5, 0.77, 6.0);
    const lThumb = box(0.06, 0.02, 0.025, 0xc49a7c, AX + 8.66, 0.785, 6.03);
    addL('aula', new THREE.HemisphereLight(0xeef0f4, 0x4a4030, 0.9)).position.set(AX + 6, 4, 4);
    const al = addL('aula', new THREE.DirectionalLight(0xe8eef4, 1.2)); al.position.set(AX + 20, 8, 5); al.target.position.set(AX + 6, 0, 4);

    // ========== LA RELOJERÍA ANSELMO, calle Platerías (x 60) ==========
    // local estrecho y largo como un vagón: x 60..63.2, z 0..10; escaparate y puerta al sur (z 10), banco bajo la ventana del norte (z 0)
    const RX = 60;
    room(RX, 0, RX + 3.2, 10, 3.6, { wall: 0xc8bca0, floor: 0x7a3a2a, gaps: { s: [[RX + 2.0, RX + 2.9]] }, door: 2.3 });
    // baldosas hidráulicas: rojo, negro y blanco
    const tileTex = canvasTex(128, 128, (g) => { for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#8a2e22' : '#e6dcc8'; g.fillRect(i * 32, j * 32, 32, 32); g.fillStyle = '#1e1a16'; g.beginPath(); g.moveTo(i * 32 + 16, j * 32 + 4); g.lineTo(i * 32 + 28, j * 32 + 16); g.lineTo(i * 32 + 16, j * 32 + 28); g.lineTo(i * 32 + 4, j * 32 + 16); g.fill(); } g.strokeStyle = 'rgba(80,70,60,.6)'; for (let k = 0; k <= 128; k += 32) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k, 128); g.moveTo(0, k); g.lineTo(128, k); g.stroke(); } });
    tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(4, 12);
    plane(3.2, 10, tileTex, RX + 1.6, 0.003, 5, 0, root, { rx: -Math.PI / 2 });
    const northWin = win(RX + 1.6, 2.3, 0.08, 0, 1.6, 1.0, { glow: 0xe6eef4, ei: 1.1 });
    furn(2.4, 0.82, 0.7, walnut, RX + 1.5, 0, 0.5); box(2.0, 0.012, 0.5, 0x2e5a36, RX + 1.5, 0.826, 0.48);   // banco de trabajo bajo la ventana del norte
    box(0.6, 0.9, 0.15, woodD, RX + 3.1, 0.45, 0.6);                                                       // zócalo de madera del escaparate (rincón)
    furn(0.45, 0.48, 0.45, wood, RX + 1.5, 0, 1.25);                                                        // la silla
    furn(0.5, 1.0, 5.5, 0x1e1a16, RX + 2.6, 0, 5.2);                                                        // mostrador de madera negra
    for (let i = 0; i < 9; i++) { const c = ball(0.09, 0xd8d0b8, RX + 0.1, 1.5 + (i % 3) * 0.5, 2.5 + ((i / 3) | 0) * 1.6); c.scale.z = 0.3; }  // relojes de pared
    box(3.0, 2.2, 0.04, 0xcfe0e6, RX + 1.6, 1.4, 9.97, root, { t: 0.25, r: 0.05 });                      // escaparate de cristal curvado
    const doorBell = cyl(0.03, 0.04, 0.05, brass, RX + 2.45, 2.25, 9.85, root, { m: 0.8 });
    // Clara: pelo negro recogido en un moño torcido, blusa blanca remangada, sentada en su banco
    const clara = person({ x: RX + 1.5, z: 1.25, ry: Math.PI, sit: true, shirt: 0xf0ece4, skirt: 0x2e3440, leg: 0x2e3440, hair: 0x14100c, bun: true, slim: true, rolled: true, mous: null });
    clara.arms[0].rotation.x = -1.2; clara.arms[1].rotation.x = -1.1; clara.head.rotation.x = 0.35;
    const mateo = person({ x: RX + 2.6, z: 8.6, ry: Math.PI, coat: 0x3a3430, hair: 0xe8e4dc, beard: 0xe8e4dc, glasses: true }); mateo.g.visible = false;
    // el muelle espiral: un destello que salta hacia arriba y a la izquierda, hacia la ventana
    const spark = ball(0.006, 0xffffff, RX + 1.5, 0.9, 0.62, root, { e: 0xffffff, ei: 3 }); spark.visible = false;
    const SPRING = V(RX + 2.92, 0.012, 0.86);                                                               // tercera junta a la izquierda del zócalo
    const springM = ball(0.004, 0xfff4d0, SPRING.x, SPRING.y, SPRING.z, root, { e: 0xfff4d0, ei: 2.5 });
    const fluff = ball(0.02, 0x8a8680, SPRING.x + 0.01, 0.01, SPRING.z, root); fluff.scale.y = 0.4;
    addL('shop', new THREE.HemisphereLight(0xeef2f6, 0x3a2a20, 0.7)).position.set(RX + 1.6, 3, 5);
    addL('shop', new THREE.PointLight(0xe8f0ff, 2.2, 8, 1.5)).position.set(RX + 1.6, 2.4, 0.8);
    addL('shop', new THREE.PointLight(0xffe0b0, 0.9, 8, 1.5)).position.set(RX + 1.6, 3.0, 6.5);

    // ========== CAFÉ EL AJEDREZ, plaza de los Libreros (x 90) ==========
    const CX = 90;
    box(16, 0.06, 12, 0x6a625a, CX, 0.0, 4);
    box(16, 6, 1, 0xb8a888, CX, 3, -1.5); box(4, 0.4, 2.2, 0x6a2a22, CX - 2, 3.0, -0.4); plane(3, 0.5, canvasTex(256, 40, (g) => { g.fillStyle = '#2a1a10'; g.fillRect(0, 0, 256, 40); g.fillStyle = '#e8d8a8'; g.font = 'bold 22px serif'; g.textAlign = 'center'; g.fillText('CAFÉ EL AJEDREZ', 128, 28); }), CX - 2, 3.5, -0.99);
    const boardTex = canvasTex(64, 64, (g) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#3a2a1a' : '#e0d0b0'; g.fillRect(i * 8, j * 8, 8, 8); } });
    const tables = [];
    const chessTable = (x, z, a, b) => { cyl(0.4, 0.4, 0.04, 0x8a8478, x, 0.74, z); cyl(0.04, 0.04, 0.72, 0x2a2a28, x, 0.37, z); plane(0.34, 0.34, boardTex, x, 0.765, z, 0, root, { rx: -Math.PI / 2 });
      const p1 = person({ x: x - 0.62, z, ry: Math.PI / 2, sit: true, ...a }), p2 = person({ x: x + 0.62, z, ry: -Math.PI / 2, sit: true, ...b }); tables.push({ x, z, p1, p2 }); return { p1, p2 }; };
    const t1 = chessTable(CX - 3, 3.5, { coat: 0x3a3a3a, hair: 0xa8a49c, mous: 0xa8a49c }, { coat: 0x4a3a2a, hair: 0x2a2018 });
    const t2 = chessTable(CX + 0.5, 5.6, { coat: 0x2e2a26, beret: 0x1e1e22, hair: 0x8a8680, mous: 0x8a8680 }, { coat: 0x2a3040, hair: 0x2a2018, glasses: true });   // el de la boina y el estudiante de gafas
    const t3 = chessTable(CX + 3.6, 3.0, { coat: 0x3e3e30, hair: 0x5a4a38 }, { coat: 0x2a2a2a, hair: 0xc8c4bc, mous: 0xc8c4bc, glasses: true });
    cyl(0.4, 0.4, 0.04, 0x8a8478, CX + 0.5, 0.74, 8.4); cyl(0.04, 0.04, 0.72, 0x2a2a28, CX + 0.5, 0.37, 8.4);    // la mesa de Santiago y Clara
    const clara2 = person({ x: CX + 1.2, z: 8.9, ry: -Math.PI * 0.75, sit: true, coat: 0x6a3a3a, skirt: 0x2e3440, leg: 0x2e3440, hair: 0x14100c, bun: true, slim: true, mous: null });
    const beret = t2.p1;
    addL('cafe', new THREE.HemisphereLight(0xe8ecf0, 0x5a5040, 1.0)).position.set(CX, 8, 4);
    const cs = addL('cafe', new THREE.DirectionalLight(0xffeedd, 1.2)); cs.position.set(CX - 8, 12, 14); cs.target.position.set(CX, 0, 4);

    // ========== PLAZA DE ARMAS, frente a la catedral (x 120) ==========
    const PX = 120;
    box(30, 0.06, 26, 0x8a8478, PX, 0.0, 0);
    box(14, 12, 2, 0xb8a890, PX, 6, -11); for (const s of [-1, 1]) box(3.5, 20, 3.5, 0xb0a088, PX + s * 6, 10, -11); box(3, 4, 0.3, 0x3a2a1a, PX, 2, -9.9);
    box(1.6, 0.06, 0.45, 0x5a4a32, PX, 0.45, 2); box(1.6, 0.4, 0.05, 0x5a4a32, PX, 0.7, 2.22);
    const clara3 = person({ x: PX - 0.4, z: 2, ry: 0, sit: true, coat: 0x4a3a4a, skirt: 0x2e3440, leg: 0x2e3440, hair: 0x14100c, bun: true, slim: true, mous: null });
    for (let i = 0; i < 5; i++) box(0.18, 0.12, 0.09, 0x7a7a80, PX - 3 + i * 1.3, 0.1, -3 + (i % 2));
    const coach = grp(PX + 6, 0, -4); box(2.4, 1.3, 1.4, 0x1e1a16, 0, 1.3, 0, coach); for (const s of [-1, 1]) for (const t of [-1, 1]) cyl(0.5, 0.5, 0.06, 0x3a2a1a, s * 0.8, 0.5, t * 0.75, coach, { rx: Math.PI / 2 });
    addL('plaza', new THREE.HemisphereLight(0xd8dce4, 0x4a4438, 0.9)).position.set(PX, 10, 0);
    const ps = addL('plaza', new THREE.DirectionalLight(0xffd8b0, 1.0)); ps.position.set(PX + 10, 8, 10); ps.target.position.set(PX, 0, 0);

    // ========== LA PENSIÓN DE LA CALLE MORETO, de noche (x 150) ==========
    const NX = 150;
    room(NX, 0, NX + 2, 3, 2.6, { wall: 0xa89c84, floor: 0x3a2e24 });
    furn(0.9, 0.5, 2.0, 0xd0c8b8, NX + 1.5, 0, 1.6); furn(0.7, 0.7, 0.5, wood, NX + 0.45, 0, 0.4);
    const candle = cyl(0.015, 0.015, 0.1, 0xf0e8d0, NX + 0.25, 0.75, 0.3); const flame = ball(0.012, 0xffc060, NX + 0.25, 0.815, 0.3, root, { e: 0xffb040, ei: 3 });
    // el Omega de bolsillo de Quirós, abierto sobre un pañuelo
    plane(0.3, 0.3, canvasTex(32, 32, (g) => { g.fillStyle = '#e8e0d0'; g.fillRect(0, 0, 32, 32); g.strokeStyle = '#8a3a3a'; g.strokeRect(2, 2, 28, 28); }), NX + 0.5, 0.703, 0.42, 0, root, { rx: -Math.PI / 2 });
    const omega = grp(NX + 0.5, 0.71, 0.42);
    cyl(0.026, 0.026, 0.01, 0xd8c070, 0, 0, 0, omega, { m: 0.9, r: 0.25 });
    const caseback = cyl(0.026, 0.026, 0.003, 0xd8c070, 0, 0.008, 0, omega, { m: 0.9, r: 0.25 });
    const oldSpring = cyl(0.012, 0.012, 0.003, 0x5a4a3a, 0.006, 0.0062, 0.004, omega, { m: 0.5 }); oldSpring.visible = false;
    const newSpring = cyl(0.012, 0.012, 0.003, 0xb8b8c0, 0.006, 0.0062, 0.004, omega, { m: 0.9, r: 0.2 }); newSpring.visible = false;
    const oilJar = cyl(0.014, 0.014, 0.05, 0x9a7a40, NX + 0.72, 0.725, 0.3, root, { t: 0.7 });
    const springBox = box(0.05, 0.015, 0.035, 0x2a3a5a, NX + 0.3, 0.708, 0.55);
    addL('pension', new THREE.PointLight(0xffb060, 1.6, 4, 1.8)).position.set(NX + 0.25, 0.95, 0.3);
    addL('pension', new THREE.HemisphereLight(0x404860, 0x100c08, 0.15)).position.set(NX + 1, 2, 1.5);

    // ========== CALLE REAL 41, tercero izquierda: el señor Quirós (x 170) ==========
    const QX = 170;
    room(QX, 0, QX + 4, 4, 2.9, { wall: 0x8a7a64, floor: 0x3a2e24 });
    for (const x of [QX + 1, QX + 3]) { win(x, 1.6, 0.08, 0, 0.9, 1.5, { glow: 0x7a7060, ei: 0.35 }); box(1.0, 1.4, 0.04, 0x5a4a36, x, 1.65, 0.14); }   // persianas bajadas
    const quiros = person({ x: QX + 2, z: 1.4, ry: 0, sit: true, coat: 0x4a4038, leg: 0x3a3430, hair: 0xe0dcd4, glasses: true, h: 0.92 });
    box(0.6, 0.5, 0.7, 0x6a3a2a, QX + 2, 0.55, 1.55);                       // manta escocesa
    const rock = box(0.7, 0.06, 0.8, woodD, QX + 2, 0.45, 1.45);
    const maid = person({ x: QX + 3.4, z: 3.2, ry: -2.6, apron: 0xe8e4dc, shirt: 0x2a2a2e, leg: 0x2a2a2e, skirt: 0x2a2a2e, hair: 0x3a2a1a, bun: true, slim: true, mous: null });
    addL('quiros', new THREE.HemisphereLight(0xb8b0a0, 0x2a2018, 0.55)).position.set(QX + 2, 3, 2);
    addL('quiros', new THREE.PointLight(0xffe0b0, 0.8, 6, 1.6)).position.set(QX + 2, 2.4, 2.5);

    // ========== LA AZOTEA DE LA RELOJERÍA, Nochevieja (x 200) ==========
    const ZX = 200;
    box(8, 0.2, 7, 0x6a6058, ZX, -0.1, 0); for (const [w, d, x, z] of [[8, 0.2, 0, -3.5], [8, 0.2, 0, 3.5], [0.2, 7, -4, 0], [0.2, 7, 4, 0]]) { box(w, 0.9, d, 0x8a7a68, ZX + x, 0.45, z); solid(ZX + x - w / 2, z - d / 2, ZX + x + w / 2, z + d / 2, 0, 1); }
    box(0.6, 1.2, 0.6, 0x7a6a58, ZX - 3, 0.6, -2.6); box(0.7, 0.1, 0.7, 0x5a4a3a, ZX - 3, 1.25, -2.6);    // chimenea
    // San Elías de noche: tejados, cúpulas, la avenida y, al fondo, la torre de la Estación Central con sus cuatro esferas
    for (let i = 0; i < 90; i++) { const x = ZX - 60 + Math.random() * 120, z = -20 - Math.random() * 70, h = 4 + Math.random() * 10; box(4 + Math.random() * 6, h, 4 + Math.random() * 6, 0x1a1a1e, x, h / 2 - 8, z); if (Math.random() < 0.6) box(0.6, 0.8, 0.05, 0xffc870, x + (Math.random() - 0.5) * 2, h - 8 - 1.2, z + 2.6, root, { e: 0xffb860, ei: 1.6 }); }
    for (const [x, z, r] of [[-25, -45, 6], [18, -60, 5]]) { box(r * 1.6, 10, r * 1.6, 0x24242a, ZX + x, -3, z); const d = ball(r, 0x2a2a32, ZX + x, 2, z); d.scale.y = 0.8; }
    for (let i = 0; i < 24; i++) ball(0.25, 0xffd890, ZX + 6 + i * 0.4, -6 + 0.0, -12 - i * 3, root, { e: 0xffc870, ei: 2 });
    const TW = V(ZX + 30, 0, -95);
    box(7, 46, 7, 0x3a3630, TW.x, 15, TW.z); box(8, 2, 8, 0x2e2a26, TW.x, 38.5, TW.z);
    const dialE = canvasTex(128, 128, (g, w) => { const c = w / 2; g.fillStyle = '#fff4d8'; g.beginPath(); g.arc(c, c, c - 3, 0, 7); g.fill(); g.strokeStyle = '#1a1410'; g.lineWidth = 4; g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(c, c); g.lineTo(c - 4, c - 46); g.moveTo(c, c); g.lineTo(c - 18, c - 30); g.stroke(); });
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2, d = plane(5, 5, dialE, TW.x + Math.sin(a) * 3.55, 33, TW.z + Math.cos(a) * 3.55, a, root, { e: 1.4 }); void d; }
    addL('roof', new THREE.HemisphereLight(0x2a3450, 0x0a0806, 0.35)).position.set(ZX, 10, 0);
    addL('roof', new THREE.PointLight(0xffc890, 1.2, 9, 1.6)).position.set(ZX - 2, 2.2, 2);
    const claraZ = person({ x: ZX + 0.4, z: -1.3, ry: Math.PI * 0.85, coat: 0x6a5a5a, skirt: 0x2e3440, leg: 0x2e3440, hair: 0x14100c, bun: true, slim: true, mous: null });
    const shawl = box(0.5, 0.3, 0.34, 0x8a6a5a, 0, 0.5, 0, claraZ.torso); shawl.rotation.z = 0.25;
    const fireworks = []; for (let i = 0; i < 6; i++) { const f = ball(1.2, 0xffe0a0, 0, 0, 0, root, { e: [0xffd070, 0xff8060, 0x90c0ff, 0xffffff][i % 4], ei: 3, t: 0.8 }); f.visible = false; fireworks.push(f); }

    // ========== CUARTEL DE LA RECOLETA, 8 de enero de 1940 (x 240) ==========
    const KX = 240;
    box(40, 0.06, 40, 0x7a6e5e, KX, 0.0, -8);
    for (const s of [-1, 1]) box(12, 6, 1, 0x7a3a2a, KX + s * 9, 3, 0); box(6, 1.4, 1, 0x7a3a2a, KX, 5.3, 0);                       // muro y arco de la puerta
    for (let i = 0; i < 4; i++) box(20, 5, 6, 0x8a4232, KX - 10 + (i % 2) * 22, 2.5, -12 - ((i / 2) | 0) * 12);                   // pabellones de ladrillo rojo
    furn(3, 0.75, 0.8, wood, KX + 4, 0, -14);                                                                               // la mesa larga
    for (let i = 0; i < 24; i++) person({ x: KX + 4 + (i % 2 ? 0.25 : -0.25), z: -12 + i * 0.75, ry: Math.PI, coat: [0x3a3a3e, 0x4a4238, 0x2e3440, 0x3e3a30][i % 4], hair: 0x2a2018 });
    const cabo = person({ x: KX + 0.9, z: 0.6, ry: -Math.PI / 2 - 0.4, coat: 0x4e5638, leg: 0x3e4430, cap: 0x3e4430, mous: 0x2a2018 });
    const listTex = canvasTex(200, 280, (g, w, h) => { g.fillStyle = '#ece6d4'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2014'; g.font = '10px monospace'; ['QUINTA DEL 18 · RAA Nº 4', '', 'ESCOBAR RUIZ, M.', 'ESPINEL DÍAZ, J.', 'ESTRADA LUNA, P.', 'FAJARDO SOTO, A.', 'FERNÁNDEZ GIL, R.', 'FIERROS LAZCANO, S.', 'FLORES MORA, E.', 'FUENTES PAZ, C.', 'GALINDO REY, T.'].forEach((l, i) => g.fillText(l, 14, 22 + i * 18));
      g.strokeStyle = '#4a4a5a'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(178, 144); g.lineTo(186, 152); g.moveTo(186, 144); g.lineTo(178, 152); g.stroke(); });
    const board = plane(0.22, 0.3, listTex, 0, -0.35, 0.12, 0, cabo.arms[0].userData.f); board.rotation.x = -0.5;
    cabo.arms[0].rotation.x = -0.9; cabo.arms[0].userData.f.rotation.x = -0.4;
    addL('recoleta', new THREE.HemisphereLight(0x9aa4b0, 0x4a4438, 1.0)).position.set(KX, 10, -5);
    const ks = addL('recoleta', new THREE.DirectionalLight(0xc8d0d8, 0.9)); ks.position.set(KX - 10, 14, 10); ks.target.position.set(KX, 0, -5);

    S.set = { root, K, col: K.col, tex: K.tex, lights, env, order, poles, trainWin, AX, SEAT, lucio, ruler, lThumb, iturbe, RX, clara, mateo, spark, SPRING, springM, northWin, doorBell, CX, tables, beret, t2, clara2, PX, clara3, NX, omega, caseback, oldSpring, newSpring, oilJar, springBox, flame,
      QX, quiros, maid, ZX, claraZ, fireworks, TW, KX, cabo, board, floor: (x, z, y) => 0 };
    return S.set;
  },
  light(S, where) { const F = S.set; for (const k in F.lights) for (const [l, v] of F.lights[k]) l.intensity = k === where ? v : 0; F.where = where; },
  update(S, dt) {
    const F = S.set; if (!F) return;
    CampUtil.globals(0, F.where === 'roof' ? 0.04 : 0.12);
    if (F.where === 'train') for (const p of F.poles) { p.position.z += dt * 14; if (p.position.z > 18) p.position.z -= 30; }
    // el de la boina se toca la oreja cada vez que el otro mueve
    const b = F.beret; if (b) { const ph = (S.t % 5.5); b.arms[1].rotation.x = ph > 3.6 && ph < 4.8 ? -2.6 : -0.6; b.arms[1].rotation.z = ph > 3.6 && ph < 4.8 ? -0.5 : 0; F.t2.p2.arms[0].rotation.x = ph > 3.2 && ph < 3.7 ? -1.2 : -0.5; }
    if (F.flame) F.flame.scale.y = 1 + 0.25 * Math.sin(S.t * 17) * Math.sin(S.t * 5);
    for (const f of F.fireworks) if (f.visible) { f.userData.t = (f.userData.t || 0) + dt; f.scale.setScalar(0.3 + f.userData.t * 6); f.material.opacity = Math.max(0, 0.9 - f.userData.t * 0.9); if (f.userData.t > 1) f.visible = false; }
    // el destello del muelle que salta
    if (F.spark.visible) { const u = F.spark.userData; u.t += dt; const k = Math.min(1, u.t / 1.1); F.spark.position.set(u.a.x + (u.b.x - u.a.x) * k, u.a.y + Math.sin(k * Math.PI) * 0.5 + (u.b.y - u.a.y) * k, u.a.z + (u.b.z - u.a.z) * k); if (k >= 1) F.spark.visible = false; }
  },
  dispose(S) { const F = S.set; if (!F) return; for (const t of F.tex) t.dispose(); S.set = null; },
};

(() => {
  const C = (S) => S.set, V = CampUtil.V, sit = CampUtil.sit.bind(CampUtil), head = campHead(CAMP_BY_ID['P1-M2']);
  const go = (where, fn) => Step.run((S) => { Cap2Set.light(S, where); S.where = where; fn(S); });
  SCENES.cap2 = {
    setup(S) { Cap2Set.build(S); MODES.campaign.noAmbience = true; Ambience.stop(); Cap2Set.light(S, 'train'); sit(S, 0, 1.25, -1.3, 0, -0.5, 1.6); },
    update(S, dt) { Cap2Set.update(S, dt); },
    teardown(S) { SceneWalk.stop(S); S.walk = null; Cap2Set.dispose(S); },
    steps: [
      Step.card({ es: 'Parte I · Cuerda', en: 'Part I · Winding' }, { es: 'Escape', en: 'Escapement' }, head),
      Step.run((S) => { S.yawC = 0; S.yaw = Input.state.yaw = 0; S.pitch = Input.state.pitch = -0.95; S.eye.set(0, 1.2, -1.35); S.yawR = 1.2; S.yawC = Math.PI; S.yaw = Input.state.yaw = Math.PI; }),
      Step.fade(0, 1.8, false),
      SAY('En un reloj, el escape es la pieza que deja salir la fuerza del muelle poco a poco, diente a diente, para que no se gaste toda de golpe. El profesor Iturbe solía decir que la juventud era un muelle sin escape.', 'In a clock, the escapement is the part that lets the spring’s force out little by little, tooth by tooth, so it isn’t spent all at once. Professor Iturbe used to say that youth was a spring without an escapement.'),
      SAY('Su padre se lo había dado en el andén, en el último minuto, cuando el revisor ya estaba cerrando las puertas. «Léelo en el tren. No antes.» Era la orden de incorporación.', 'His father had given it to him on the platform, at the last minute, as the guard was closing the doors. “Read it on the train. Not before.” It was his call-up order.'),
      Step.find([
        { pos: (S) => C(S).order.localToWorld(V(0, 0.03, 0)), r: 0.12, text: { es: '«Por disposición del Decreto de Neutralidad Armada de 2 de octubre de 1939… se ordena al ciudadano FIERROS LAZCANO, SANTIAGO… presentarse en el Cuartel de La Recoleta, Regimiento de Artillería Nº 4, el día 8 de enero de 1940, a las 07:00 horas.»', en: '“By provision of the Armed Neutrality Decree of 2 October 1939… citizen FIERROS LAZCANO, SANTIAGO is ordered… to report to La Recoleta Barracks, 4th Artillery Regiment, on 8 January 1940, at 07:00 hours.”' } },
        { pos: (S) => C(S).env.localToWorld(V(0.1, 0.06, 0)), r: 0.1, text: { es: 'El matasellos de Correos de San Elías, en la esquina, con la fecha en tinta violeta: 21 SEP 1939.', en: 'The San Elías post-office stamp, in the corner, dated in violet ink: 21 SEP 1939.' } },
        { pos: (S) => C(S).env.localToWorld(V(-0.01, -0.09, 0)), r: 0.1, text: { es: 'El sello rojo de lacre del Ministerio. Su nombre y su dirección escritos a máquina.', en: 'The Ministry’s red wax seal. His name and address typed.' } },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: mira la orden y el sobre · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: look at the order and the envelope · ${n}/${k}` })),
      Step.choice({ es: '¿Qué es lo que no cuadra?', en: 'What doesn’t add up?' }, [{ es: 'El matasellos es once días anterior al decreto.', en: 'The postmark is eleven days older than the decree.' }, { es: 'La fecha de presentación.', en: 'The reporting date.' }, { es: 'Nada. Media quinta está llamada.', en: 'Nothing. Half the age group has been called.' }], 0,
        [{ es: '', en: '' }, { es: 'No. El 8 de enero no tiene nada de raro. Mira otra vez las fechas.', en: 'No. Nothing odd about 8 January. Look at the dates again.' }, { es: 'No había nada raro en la orden. Lo raro era otra cosa. Mira otra vez.', en: 'There was nothing odd about the order. The odd thing was something else. Look again.' }]),
      SAY('Su orden de incorporación había salido de la capital once días antes de que existiera la ley que la permitía.', 'His call-up order had left the capital eleven days before the law that allowed it existed.'),
      SAY('Y su padre lo había tenido guardado dos semanas, o más. Había esperado a la última noche para dárselo. Había parado el reloj de su madre para que fuera hoy un ratito más.', 'And his father had kept it two weeks, or longer. He had waited for the last night to give it to him. He had stopped his mother’s clock so it would be today a little while longer.'),
      Step.fade(1, 1.2),
      // ---- el aula ----
      Step.card(null, null, { es: 'Politécnica · aula de Mecanismos · 08:05', en: 'Polytechnic · Mechanisms lecture room · 08:05' }, 3.0),
      go('aula', (S) => { CampUtil.walk(S, C(S).AX + 1.2, 0, 8.6, 0); }),
      Step.fade(0, 1.2, false),
      SAY('Santiago entró en el aula de Mecanismos a las ocho y cinco. Era la primera vez en cuatro años que llegaba tarde.', 'Santiago walked into the Mechanisms lecture at five past eight. It was the first time in four years he had been late.'),
      SAY('—Señor Fierros. Qué novedad. ¿Se le ha atrasado a usted el reloj?', '“Mr Fierros. What a novelty. Has your watch fallen behind?”'),
      Step.run(() => CampUtil.laugh(0.6)),
      Step.uses([{ id: 'sitio', d: 1.8, r: 0.5, pos: (S) => C(S).SEAT.clone().setY(0.9), label: { es: 'Sentarse en su sitio (tercera fila, junto a la ventana)', en: 'Sit in his seat (third row, by the window)' }, use(S) { const P = C(S).SEAT; sit(S, P.x, 1.2, P.z, Math.PI * 0.5, -0.2, 1.8); } }], 1,
        () => L({ es: 'Ve a tu sitio de siempre: tercera fila, junto a la ventana, al lado de Lucio.', en: 'Go to your usual seat: third row, by the window, next to Lucio.' })),
      SAY('—¿A ti también? —le susurró Lucio, que lo había leído en la cara antes de que se sentara.', '“You too?” Lucio whispered, who had read it on his face before he sat down.'),
      SAY('—La Recoleta. Artillería.', '“La Recoleta. Artillery.”'),
      SAY('—¡A mí Infantería! San Damián. Me voy a pasar la guerra cavando trincheras mientras tú haces cuentas en una mesa. Qué injusticia. Qué maravilla. Vamos a estar a cuatro calles el uno del otro.', '“Infantry for me! San Damián. I’ll spend the war digging trenches while you do sums at a desk. How unfair. How wonderful. We’ll be four streets apart.”'),
      Step.find([{ pos: (S) => C(S).lThumb.position.clone(), r: 0.1, text: [{ es: 'El pulgar estirado sobre el borde de la regla en lugar de cerrarlo. Lucio era zurdo de nacimiento, pero escribía y dibujaba con la derecha: en su colegio de curas le habían atado la mano izquierda a la espalda con una correa durante todo primero.', en: 'The thumb stretched along the edge of the ruler instead of closed. Lucio was born left-handed, but he wrote and drew with his right: at his priests’ school they had strapped his left hand behind his back for the whole first year.' }, { es: 'A veces, cuando se olvidaba, se le escapaba algo de su mano verdadera. Santiago nunca se lo dijo. Pensó que le daría vergüenza.', en: 'Sometimes, when he forgot, something of his true hand slipped out. Santiago never told him. He thought it would embarrass him.' }] }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: mira las manos de Lucio.', en: 'Hold <kbd>Q</kbd>: look at Lucio’s hands.' })),
      SAY('—¿Has visto el matasellos? —le preguntó en voz baja.', '“Did you see the postmark?” he asked quietly.'),
      SAY('—¿El qué?', '“The what?”'),
      SAY('—Nada. Déjalo. —Lucio no lo había mirado. Nadie miraba el matasellos.', '“Nothing. Forget it.” Lucio hadn’t looked. Nobody looked at the postmark.'),
      Step.fade(1, 1.2),
      // ---- la relojería ----
      Step.card(null, null, { es: 'Relojería Anselmo · calle Platerías · 16:00', en: 'Anselmo Watchmakers · Calle Platerías · 16:00' }, 3.0),
      go('shop', (S) => { CampUtil.walk(S, C(S).RX + 2.45, 0, 9.4, 0); if (SceneAudio.ok()) CampUtil.bellStrike(1900, 0.02); }),
      Step.fade(0, 1.2, false),
      SAY('Santiago se ganaba la vida en la capital arreglando relojes. Tres tardes a la semana se sentaba en el banco bajo la ventana del norte y arreglaba lo que don Mateo, con sus cataratas, ya no veía. Esa tarde se encontró a una muchacha sentada en su banco.', 'Santiago earned his living in the capital mending watches. Three afternoons a week he sat at the bench under the north window and fixed what Don Mateo, with his cataracts, could no longer see. That afternoon he found a girl sitting at his bench.'),
      Step.reach(60 + 1.5, 2.3, 1.0, 'Acércate al banco.', 'Go up to the bench.'),
      Step.run((S) => { sit(S, C(S).RX + 1.7, 1.62, 2.25, 0.15, -0.45, 1.2); }),
      Step.find([
        { pos: (S) => C(S).clara.arms[0].userData.f.localToWorld(V(0, -0.32, 0)), r: 0.1, text: { es: 'Las uñas cortas y una mancha de tinta en el dedo corazón derecho: alguien que escribe mucho y con pluma.', en: 'Short nails and an ink stain on the right middle finger: someone who writes a lot, with a pen.' } },
        { pos: (S) => C(S).clara.g.localToWorld(V(0.11, 0.05, 0.5)), r: 0.12, text: { es: 'Zapatos de cordones con la suela gastada por el lado de fuera: camina mucho y con prisa.', en: 'Laced shoes worn down on the outside of the sole: she walks a lot, and fast.' } },
        { pos: (S) => C(S).clara.arms[1].userData.f.localToWorld(V(0, -0.34, 0)), r: 0.1, text: { es: 'Sus pinzas, las de punta de aguja. Las sujeta mal, demasiado arriba, como se sujeta un lápiz. Y está a punto de romper el muelle espiral de un Longines de pulsera.', en: 'His tweezers, the needle-pointed ones. She’s holding them wrong, too high up, the way you hold a pencil. And she’s about to break the hairspring of a Longines wristwatch.' } },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: mírala antes de hablar · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: look at her before you speak · ${n}/${k}` })),
      SAY('—No lo empuje —dijo.', '“Don’t push it,” he said.'),
      Step.run((S) => { const F = C(S); F.spark.visible = true; F.spark.userData = { t: 0, a: V(F.RX + 1.4, 0.9, 0.62), b: F.SPRING.clone() }; if (SceneAudio.ok()) AUDIO.osc(SceneAudio.dest(), 'sine', 5200, 6400, AUDIO.ctx.currentTime, 0.03, 0.03); F.clara.g.rotation.y = Math.PI * 0.8; F.clara.head.rotation.x = 0; }),
      SAY('La muchacha dio un respingo tan grande que se le cayeron las pinzas. El muelle espiral saltó del volante con un tic diminuto, describió un arco en el aire como una pestaña que alguien hubiera soplado, y desapareció.', 'The girl started so violently she dropped the tweezers. The hairspring leapt off the balance with a tiny tick, drew an arc in the air like a blown eyelash, and vanished.'),
      SAY('—Ay, no. Mi padre me va a matar. Este es el reloj del notario Pinillos. Viene a buscarlo a las seis. ¿Usted puede encontrarlo?', '“Oh, no. My father will kill me. This is Notary Pinillos’s watch. He’s collecting it at six. Can you find it?”'),
      SAY('Un muelle espiral de un Longines de pulsera tenía un diámetro de dos milímetros y medio y un grosor menor que el de un cabello. Era, a todos los efectos prácticos, invisible. Cerró los ojos. Recordó el arco. Lo había visto sin querer, como lo veía todo.', 'The hairspring of a Longines wristwatch was two and a half millimetres across and thinner than a hair. It was, for all practical purposes, invisible. He closed his eyes. He remembered the arc. He had seen it without meaning to, the way he saw everything.'),
      Step.fade(1, 0.6),
      Step.choice({ es: '¿Hacia dónde saltó?', en: 'Which way did it jump?' }, [{ es: 'Hacia arriba y a la izquierda, hacia la ventana, con la luz del norte detrás.', en: 'Up and to the left, toward the window, with the north light behind it.' }, { es: 'Hacia abajo, debajo del banco.', en: 'Down, under the bench.' }, { es: 'Hacia el mostrador.', en: 'Toward the counter.' }], 0,
        [{ es: '', en: '' }, { es: 'No. Un muelle así, al soltarse, no cae: sale disparado. Recuerda el destello.', en: 'No. A spring like that doesn’t fall when it lets go: it shoots off. Remember the glint.' }, { es: 'No. El mostrador estaba detrás de ti. Recuerda el destello contra la luz.', en: 'No. The counter was behind you. Remember the glint against the light.' }]),
      SAY('La altura del banco: ochenta y dos centímetros. La resistencia del aire, que para algo tan ligero era enorme, lo haría caer no en línea recta sino planeando, como una semilla de diente de león.', 'The bench height: eighty-two centimetres. Air resistance, enormous for something so light, would bring it down not in a straight line but gliding, like a dandelion seed.'),
      Step.run((S) => { const F = C(S); CampUtil.walk(S, F.RX + 2.2, 0, 1.6, CampUtil.yawTo(F.RX + 2.2, 1.6, F.SPRING.x, F.SPRING.z)); S.walk.h = 0.55; S.walk.speed = 0.9; S.pitch = Input.state.pitch = -0.6; }),
      Step.fade(0, 0.8, false),
      Step.goal('De rodillas, con la lupa plegable: busca en el rincón bajo la ventana, junto al zócalo del escaparate.', 'On your knees, with the folding loupe: search the corner under the window, by the shop-window skirting.'),
      Step.find([{ pos: (S) => C(S).SPRING.clone(), r: 0.07, text: { es: 'El muelle espiral estaba ahí, enganchado en una pelusa gris, en la tercera junta a la izquierda del zócalo. Brillaba un poco.', en: 'The hairspring was there, caught in a grey tuft of fluff, in the third joint to the left of the skirting. It glinted slightly.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd> cerca del suelo: un brillo diminuto entre las juntas.', en: 'Hold <kbd>Q</kbd> close to the floor: a tiny glint between the joints.' })),
      Step.run((S) => { const F = C(S); F.springM.visible = false; sit(S, F.RX + 1.9, 1.62, 1.9, CampUtil.yawTo(F.RX + 1.9, 1.9, F.RX + 1.5, 1.25), -0.35, 1.2); }),
      SAY('Lo cogió con la punta de una hoja de papel de fumar. Se lo enseñó a ella, sobre la palma de la mano. La muchacha lo miró a él. Miró el muelle. Lo miró a él otra vez. Y se echó a reír.', 'He picked it up on the corner of a cigarette paper. He showed it to her on his palm. The girl looked at him. Looked at the spring. Looked at him again. And burst out laughing.'),
      Step.run(() => { CampUtil.laugh(1); setTimeout(() => CampUtil.laugh(1.2), 900); }),
      SAY('Fue una carcajada enorme y absurda, demasiado grande para la tienda estrecha. Y Santiago notó que algo le subía desde el estómago, algo que no podía controlar, y se echó a reír también.', 'It was an enormous, absurd laugh, far too big for the narrow shop. And Santiago felt something rise from his stomach, something he couldn’t control, and he started laughing too.'),
      Step.run((S) => { C(S).mateo.g.visible = true; }),
      SAY('—Veo que ya conoces a mi hija —dijo don Mateo Anselmo.', '“I see you’ve met my daughter,” said Don Mateo Anselmo.'),
      Step.uses([{ id: 'montar', d: 1.6, r: 0.35, pos: (S) => V(C(S).RX + 1.4, 0.86, 0.55), label: { es: 'Montar el muelle espiral (las pinzas sujetas en la base)', en: 'Fit the hairspring (tweezers held at the base)' }, use(S) { S.busy = 1.2; if (SceneAudio.ok()) for (let i = 0; i < 4; i++) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime + i * 0.25, 0.01, 0.03, 'bandpass', 4500, null, 8); } }], 1,
        () => L({ es: 'Monta el muelle en el volante del Longines.', en: 'Fit the spring back onto the Longines balance.' })),
      SAY('Clara Anselmo tenía veintidós años, como él. Estudiaba Magisterio porque quería enseñar a leer a los niños pequeños: decía que era como encender una luz en un cuarto que había estado siempre a oscuras. Se lo contó todo de corrido, demasiado cerca, oliendo a jabón de almendras y a tinta.', 'Clara Anselmo was twenty-two, like him. She was training as a teacher because she wanted to teach small children to read: she said it was like switching on a light in a room that had always been dark. She told him everything in one breath, too close, smelling of almond soap and ink.'),
      SAY('—¿Cómo lo encontró?', '“How did you find it?”'),
      SAY('—Lo vi caer.', '“I saw it fall.”'),
      SAY('—Nadie puede ver caer eso. ¿Por qué?', '“Nobody can see that fall. Why?”'),
      Step.choice({ es: 'Pensó en mentir, en decir «suerte», como le decía a todo el mundo.', en: 'He thought about lying, about saying “luck”, as he told everyone.' }, [{ es: '—Porque mi madre me enseñó a mirar.', en: '“Because my mother taught me to look.”' }, { es: '—Suerte.', en: '“Luck.”' }], 0, { es: 'Esta vez no. A ella no.', en: 'Not this time. Not to her.' }),
      SAY('Clara se quedó callada. Luego se sentó en el borde del banco, de lado, con las piernas cruzadas. —Enséñeme.', 'Clara fell silent. Then she sat on the edge of the bench, sideways, legs crossed. “Teach me.”'),
      Step.fade(1, 1.2),
      // ---- el café El Ajedrez ----
      Step.card(null, null, { es: 'Café El Ajedrez · plaza de los Libreros · un miércoles', en: 'Café El Ajedrez · booksellers’ square · a Wednesday' }, 3.0),
      go('cafe', (S) => { const F = C(S); sit(S, F.CX + 0.5, 1.15, 9.0, 0, -0.15, 1.5); }),
      Step.fade(0, 1.2, false),
      SAY('Le enseñó a mirar a los jugadores antes de mirar el tablero.', 'He taught her to look at the players before looking at the board.'),
      Step.find([
        { pos: (S) => C(S).tables[0].p1.head.localToWorld(V(0, 0, 0.1)), r: 0.1, text: { es: 'El viejo del bigote cano mira el reloj de la plaza entre jugada y jugada. Tiene prisa, no miedo.', en: 'The old man with the white moustache checks the square’s clock between moves. He’s in a hurry, not afraid.' } },
        { pos: (S) => C(S).beret.head.localToWorld(V(0.12, 0, 0)), r: 0.1, text: { es: 'El de la boina se toca la oreja cada vez que el otro mueve. Se la tocaba antes de comerse la reina y se la sigue tocando.', en: 'The man in the beret touches his ear every time the other one moves. He did it before taking the queen and he’s still doing it.' } },
        { pos: (S) => C(S).tables[2].p2.head.localToWorld(V(0, 0, 0.1)), r: 0.1, text: { es: 'El del fondo, con gafas, se reclina en la silla. Está cómodo. No juega por dinero.', en: 'The one at the back, in glasses, leans back in his chair. He’s comfortable. He isn’t playing for money.' } },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: mira a los jugadores, no los tableros · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: look at the players, not the boards · ${n}/${k}` })),
      Step.choice({ es: '—¿Quién va a perder?', en: '“Who’s going to lose?”' }, [{ es: 'El de la boina.', en: 'The man in the beret.' }, { es: 'El viejo del bigote cano.', en: 'The old man with the white moustache.' }, { es: 'El estudiante de gafas.', en: 'The student in glasses.' }], 0,
        [{ es: '', en: '' }, { es: 'No. Mira lo que hace con las manos el que tiene miedo.', en: 'No. Look at what the frightened one does with his hands.' }, { es: 'No. El estudiante va perdiendo, pero no tiene miedo. El que tiene miedo es otro.', en: 'No. The student is behind, but he isn’t afraid. Someone else is.' }]),
      SAY('—¿Cómo lo sabes? Va ganando. Le ha comido la reina.', '“How do you know? He’s winning. He took his queen.”'),
      SAY('—No está pensando en sus jugadas, está pensando en las del otro, y tiene miedo. Si fuera ganando de verdad se tocaría el bigote. Lo hacía la semana pasada cuando me ganó a mí.', '“He isn’t thinking about his moves, he’s thinking about the other man’s, and he’s afraid. If he were really winning he’d touch his moustache. He did it last week when he beat me.”'),
      SAY('—¿Te ganó a ti?', '“He beat you?”'),
      SAY('—Lo dejé ganar. Necesitaba saber qué hacía cuando ganaba.', '“I let him win. I needed to know what he did when he was winning.”'),
      SAY('Clara lo miró de lado con las cejas levantadas. Diez jugadas después el hombre de la boina tumbó su rey.', 'Clara looked at him sideways, eyebrows raised. Ten moves later the man in the beret laid down his king.'),
      Step.fade(1, 1.2),
      // ---- la plaza de Armas ----
      Step.card(null, null, { es: 'Plaza de Armas · una tarde de noviembre', en: 'Plaza de Armas · a November afternoon' }, 3.0),
      go('plaza', (S) => { const F = C(S); sit(S, F.PX + 0.4, 1.12, 2.0, 0.35, -0.1, 1.6); }),
      Step.fade(0, 1.2, false),
      SAY('«Míralo todo. No mires una cosa.» Ella cerraba los ojos. Él contaba hasta sesenta. «Ábrelos. ¿Qué cambió?» Clara no veía nada al principio. Luego veía la paloma. Luego el cochero que se había quitado la chaqueta. Luego, una tarde de noviembre, abrió los ojos y dijo, sin pensarlo:', '“Look at everything. Don’t look at one thing.” She closed her eyes. He counted to sixty. “Open them. What changed?” At first Clara saw nothing. Then the pigeon. Then the coachman who had taken off his jacket. Then, one November afternoon, she opened her eyes and said, without thinking:'),
      SAY('—Tú. Tú has cambiado. Mientras tenía los ojos cerrados. Estás más triste. ¿Por qué estás triste cuando me miras?', '“You. You’ve changed. While my eyes were closed. You’re sadder. Why are you sad when you look at me?”'),
      SAY('—Porque el ocho de enero me voy a La Recoleta. Y no sé cuándo vuelvo.', '“Because on the eighth of January I go to La Recoleta. And I don’t know when I’ll be back.”'),
      SAY('—Eso no es por lo que estás triste.', '“That isn’t why you’re sad.”'),
      SAY('—Estoy triste porque mi orden de incorporación salió once días antes de la ley que la permite. Y porque mi padre lo sabía. Y porque no sé qué significa.', '“I’m sad because my call-up order went out eleven days before the law that allows it. And because my father knew. And because I don’t know what it means.”'),
      SAY('—¿Se lo has preguntado?', '“Have you asked him?”'),
      Step.choice({ es: '—¿Por qué no?', en: '“Why not?”' }, [{ es: '—Porque hay cosas que se ven y no se dicen.', en: '“Because there are things that are seen and not said.”' }, { es: '—Porque no me lo diría.', en: '“Because he wouldn’t tell me.”' }], 0, { es: 'No era eso. Era la frase de su padre lo que le salía.', en: 'It wasn’t that. It was his father’s sentence that came out.' }),
      SAY('—Eso es una tontería —dijo Clara, con las cejas fruncidas, casi enfadada—. Es lo que dicen los que tienen algo que esconder para que los demás se callen. Las cosas se dicen, Santiago. Si no, se pudren.', '“That’s nonsense,” said Clara, frowning, almost angry. “It’s what people with something to hide say to keep everyone else quiet. Things get said, Santiago. Otherwise they rot.”'),
      Step.fade(1, 1.2),
      // ---- la pensión: el Omega de Quirós ----
      Step.card(null, null, { es: 'Pensión de la calle Moreto · de noche', en: 'Calle Moreto boarding house · night' }, 3.0),
      go('pension', (S) => { const F = C(S); sit(S, F.NX + 0.5, 1.05, 0.85, 0, -1.0, 0.9); }),
      Step.fade(0, 1.2, false),
      SAY('Había traído de Corcovado, envuelto en un pañuelo, el Omega de bolsillo del señor Quirós de la calle Real. «Muelle real roto, cambiar.» El último arreglo del cuaderno de su madre, sin la palabra «entregado». Lo arregló una noche, a la luz de una vela, con las herramientas de ella.', 'He had brought from Corcovado, wrapped in a handkerchief, Señor Quirós’s Omega pocket watch. “Mainspring broken, replace.” The last repair in his mother’s notebook, without the word “delivered”. He fixed it one night, by candlelight, with her tools.'),
      Step.uses([
        { id: 'tapa', d: 1.2, r: 0.25, pos: (S) => C(S).omega.localToWorld(V(0, 0.01, 0)), label: { es: 'Abrir la tapa trasera', en: 'Open the case back' }, use(S) { C(S).caseback.position.x = 0.06; C(S).oldSpring.visible = true; } },
        { id: 'viejo', d: 1.2, r: 0.25, pos: (S) => C(S).omega.localToWorld(V(0.006, 0.006, 0.004)), label: { es: 'Sacar el muelle real roto', en: 'Take out the broken mainspring' }, avail: (S) => S.uses.find((u) => u.id === 'tapa').done, use(S) { C(S).oldSpring.visible = false; } },
        { id: 'nuevo', d: 1.2, r: 0.25, pos: (S) => C(S).springBox.position.clone(), label: { es: 'Poner el muelle nuevo', en: 'Fit the new spring' }, avail: (S) => S.uses.find((u) => u.id === 'viejo').done, use(S) { C(S).newSpring.visible = true; S.busy = 1; if (SceneAudio.ok()) Cap1Audio.wind(8, 0.9); } },
        { id: 'aceite', d: 1.2, r: 0.25, pos: (S) => C(S).oilJar.position.clone(), label: { es: 'Limpiar el aceite viejo y poner aceite de pie de buey (el frasco de ella)', en: 'Clean off the old oil and apply neatsfoot oil (her jar)' }, avail: (S) => S.uses.find((u) => u.id === 'nuevo').done, use() { } },
        { id: 'cerrar', d: 1.2, r: 0.25, pos: (S) => C(S).omega.localToWorld(V(0, 0.01, 0)), label: { es: 'Cerrar la tapa y escucharlo', en: 'Close the back and listen' }, avail: (S) => S.uses.find((u) => u.id === 'aceite').done, use(S) { C(S).caseback.position.x = 0; let n = 0; const tk = setInterval(() => { Cap1Audio.tick(0.04, 4400); if (++n > 9) clearInterval(tk); }, 200); } },
      ], 5, (n, k) => L({ es: `Arregla el Omega de Quirós · ${n}/${k}`, en: `Repair Quirós’s Omega · ${n}/${k}` })),
      Step.fade(1, 1.2),
      // ---- calle Real 41 ----
      Step.card(null, null, { es: 'Calle Real 41 · tercero izquierda', en: 'Calle Real 41 · third floor, left' }, 3.0),
      go('quiros', (S) => { const F = C(S); sit(S, F.QX + 2, 1.62, 3.0, 0, -0.3, 1.5); }),
      Step.fade(0, 1.2, false),
      SAY('El señor Quirós era un viejo de más de ochenta años, consumido, metido en una mecedora bajo una manta escocesa, con unas gafas de cristales gruesos como fondos de botella.', 'Señor Quirós was an old man of over eighty, wasted away, sunk in a rocking chair under a tartan blanket, with spectacles as thick as bottle bottoms.'),
      Step.uses([{ id: 'dar', d: 2.0, r: 0.4, pos: (S) => C(S).quiros.torso.localToWorld(V(0, 0.2, 0.2)), label: { es: 'Ponerle el Omega en las manos', en: 'Put the Omega in his hands' }, use() { } }], 1, null),
      SAY('El viejo lo tocó durante mucho rato con los dedos, por todos los lados, como un ciego. Lo abrió. Se lo acercó al oído. —Lazcano —dijo.', 'The old man felt it for a long time with his fingers, all over, like a blind man. He opened it. He held it to his ear. “Lazcano,” he said.'),
      SAY('—Era mi madre. Amparo Lazcano. Murió el año pasado. Lo tenía apuntado en su cuaderno. No lo había entregado.', '“She was my mother. Amparo Lazcano. She died last year. She had it written in her notebook. She hadn’t delivered it.”'),
      SAY('—La niña de los relojes. Así la llamábamos. Yo era el que llevaba los paquetes. De la tienda de su padre al seminario. Todas las semanas, con mi bicicleta, por la carretera de Ocoa. Cajitas así. Muy pesadas para lo pequeñas que eran. Nunca me dijeron qué llevaban. ¿Usted sabe lo que llevaban?', '“The watch girl. That’s what we called her. I was the one who carried the parcels. From her father’s shop to the seminary. Every week, on my bicycle, along the Ocoa road. Little boxes, like this. Very heavy for how small they were. They never told me what was in them. Do you know what was in them?”'),
      SAY('—No. ¿Qué seminario?', '“No. What seminary?”'),
      SAY('Pero el viejo ya no le escuchaba. Se mecía y tarareaba una melodía de iglesia, en latín, muy desafinada. —No le haga caso —dijo la criada en la puerta—. Se pasa el día cantando cosas de cuando era monaguillo. En San Gregorio, creo. En la sierra. Donde los niños cantores.', 'But the old man was no longer listening. He rocked and hummed a church tune, in Latin, badly out of tune. “Pay him no mind,” the maid said at the door. “He spends the day singing things from when he was an altar boy. At San Gregorio, I think. In the sierra. Where the choirboys are.”'),
      SAY('«A Amparo, con gratitud eterna, de sus compañeros de San Gregorio.» «La niña de los relojes.» «Cajitas así. Muy pesadas para lo pequeñas que eran.»', '“To Amparo, with eternal gratitude, from her colleagues at San Gregorio.” “The watch girl.” “Little boxes, like this. Very heavy for how small they were.”', { cls: 'mem' }),
      Step.fade(1, 1.2),
      // ---- la azotea, Nochevieja ----
      Step.card(null, null, { es: 'Azotea de la Relojería Anselmo · Nochevieja de 1939', en: 'Roof of Anselmo Watchmakers · New Year’s Eve 1939' }, 3.2),
      go('roof', (S) => { const F = C(S); sit(S, F.ZX - 0.4, 1.62, 0.2, CampUtil.yawTo(F.ZX - 0.4, 0.2, F.TW.x, F.TW.z), 0.05, 2.0); }),
      Step.fade(0, 1.4, false),
      SAY('Se veía todo San Elías desde allí: las cúpulas, los tejados del centro viejo, las luces de la avenida bajando hacia la estación y, al fondo, iluminada desde abajo, la torre de la Estación Central con su gran reloj de cuatro esferas, como un ojo que lo vigilara todo.', 'You could see all of San Elías from there: the domes, the roofs of the old town, the lights of the avenue running down to the station and, at the back, lit from below, the Central Station tower with its great four-faced clock, like an eye watching everything.'),
      SAY('—Quedan seis minutos —dijo Santiago.', '“Six minutes to go,” said Santiago.'),
      SAY('—¿Cómo lo sabes? No has mirado el reloj.', '“How do you know? You haven’t looked at the clock.”'),
      SAY('—Sí lo he mirado. Hace un rato. Y desde entonces he contado.', '“I have. A while ago. And I’ve been counting since.”'),
      SAY('—Yo no te veo disparando. Nunca. Te veo arreglando el reloj del notario Pinillos con unas pinzas. No te veo con un fusil.', '“I can’t see you shooting. Ever. I see you fixing Notary Pinillos’s watch with tweezers. I can’t see you with a rifle.”'),
      SAY('—Yo tampoco. Es que no sé disparar. Nunca he disparado. Ni una escopeta de feria.', '“Neither can I. I don’t know how to shoot. I’ve never fired anything. Not even a fairground rifle.”'),
      SAY('—Santiago. Mírame y dime qué cambió.', '“Santiago. Look at me and tell me what changed.”'),
      Step.run((S) => { const F = C(S); S.yawC = CampUtil.yawTo(F.ZX - 0.4, 0.2, F.ZX + 0.4, -1.3); S.yawR = 1.0; }),
      Step.find([
        { pos: (S) => C(S).claraZ.head.localToWorld(V(0.1, 0.1, -0.05)), r: 0.08, text: { es: 'El mechón de pelo que se le había soltado del moño.', en: 'The strand of hair that had come loose from her bun.' } },
        { pos: (S) => C(S).claraZ.arms[0].userData.f.localToWorld(V(0, -0.32, 0)), r: 0.09, text: { es: 'La mancha de tinta, nueva, en el dedo corazón.', en: 'The ink stain, a new one, on her middle finger.' } },
        { pos: (S) => C(S).claraZ.torso.localToWorld(V(-0.08, 0.6, 0.16)), r: 0.08, text: { es: 'Una peca en la clavícula que no había visto nunca, porque nunca se la había visto descubierta. El chal se le había resbalado de un hombro.', en: 'A freckle on her collarbone he had never seen, because he had never seen it bare. The shawl had slipped off one shoulder.' } },
        { pos: (S) => C(S).claraZ.head.localToWorld(V(0.06, -0.16, 0.08)), r: 0.08, text: { es: 'El pulso en el cuello, rápido. Ciento diez. Ciento quince.', en: 'The pulse in her neck, fast. A hundred and ten. A hundred and fifteen.' } },
      ], 4, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: mírala toda a la vez, como un dibujo · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: look at all of her at once, like a drawing · ${n}/${k}` })),
      Step.choice({ es: '¿Qué había cambiado?', en: 'What had changed?' }, [{ es: 'Que ella estaba esperando.', en: 'That she was waiting.' }, { es: 'Que tenía frío.', en: 'That she was cold.' }, { es: 'Nada.', en: 'Nothing.' }], 0,
        [{ es: '', en: '' }, { es: 'Temblaba por el frío, o por otra cosa. Mira otra vez.', en: 'She was shivering from the cold, or from something else. Look again.' }, { es: 'Siempre cambia algo. Mira otra vez.', en: 'Something always changes. Look again.' }]),
      Step.run((S) => { const F = C(S); for (let i = 0; i < 12; i++) setTimeout(() => { if (!Scenes.S) return; CampUtil.bellStrike(165, 0.09); const f = F.fireworks[i % F.fireworks.length]; f.visible = true; f.userData.t = 0; f.position.set(F.ZX - 30 + Math.random() * 60, 20 + Math.random() * 15, -40 - Math.random() * 40); }, 600 + i * 1600); }),
      Step.wait(4.0),
      SAY('En la torre de la Estación Central el gran reloj de cuatro esferas dio la primera campanada de las doce. La ciudad entera estalló a la vez. Santiago la besó en la tercera campanada. Lo contó. No pudo evitar contarlo.', 'In the Central Station tower the great four-faced clock struck the first stroke of midnight. The whole city exploded at once. Santiago kissed her on the third stroke. He counted it. He couldn’t help counting it.'),
      Step.fade(1, 2.0),
      SAY('Ella le cogió la cara con las dos manos frías, y él dejó de contar en la sexta, y ya no supo cuántas sonaron, ni cuándo terminaron, ni cuándo había empezado 1940.', 'She took his face in her two cold hands, and he stopped counting at the sixth, and no longer knew how many struck, or when they ended, or when 1940 had begun.', { cls: 'mem' }),
      // ---- La Recoleta ----
      Step.card(null, null, { es: 'Cuartel de La Recoleta · 8 de enero de 1940 · 06:59', en: 'La Recoleta Barracks · 8 January 1940 · 06:59' }, 3.2),
      go('recoleta', (S) => { const F = C(S); sit(S, F.KX - 0.4, 1.62, 1.6, CampUtil.yawTo(F.KX - 0.4, 1.6, F.KX + 0.9, 0.6), -0.1, 1.8); }),
      Step.fade(0, 1.2, false),
      SAY('El cabo de guardia le pidió la orden. La miró. Le miró la cara. Volvió a mirar la orden, y luego una lista que tenía en una tablilla, y pasó el dedo por la lista, y se paró en un nombre.', 'The corporal of the guard asked for his order. Looked at it. Looked at his face. Looked at the order again, and then at a list on a clipboard, and ran his finger down the list, and stopped at a name.'),
      Step.find([{ pos: (S) => C(S).board.localToWorld(V(0.075, -0.0, 0.005)), r: 0.08, text: { es: 'Junto a su nombre había una marca a lápiz, una pequeña cruz, que no había junto a ningún otro.', en: 'Next to his name there was a pencil mark, a small cross, that wasn’t next to any other.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: la lista del cabo.', en: 'Hold <kbd>Q</kbd>: the corporal’s list.' })),
      SAY('—Fierros. Usted. Pase. Lo están esperando.', '“Fierros. You. Go through. They’re expecting you.”'),
      SAY('—¿Quién?', '“Who?”'),
      Step.run((S) => { const F = C(S); S.yawC = CampUtil.yawTo(F.KX - 0.4, 1.6, F.KX + 4, -14); S.yawR = 1.8; }),
      SAY('El cabo no contestó. Le señaló un patio enorme de tierra apisonada, rodeado de pabellones de ladrillo rojo, donde cientos de muchachos de la quinta del 18 hacían cola delante de una mesa larga, con la cabeza gacha y la maleta en la mano, en silencio, bajo un cielo de color de pizarra.', 'The corporal didn’t answer. He pointed to an enormous yard of beaten earth, ringed by red-brick blocks, where hundreds of boys of the class of ’18 were queuing in front of a long table, heads down, suitcase in hand, in silence, under a slate-coloured sky.'),
      Step.run(() => { for (let i = 0; i < 7; i++) CampUtil.bellStrike(140, 0.035, 0.5 + i * 1.8); }),
      SAY('Detrás de él, en la torre de la Estación Central, a dos kilómetros, el gran reloj de cuatro esferas dio las siete.', 'Behind him, in the Central Station tower, two kilometres away, the great four-faced clock struck seven.'),
      Step.wait(3),
      Step.fade(1, 2.0),
    ],
  };
  const m = CAMP_BY_ID['P1-M2']; m.scene = 'cap2'; m.map = 'c2_san_elias';
})();
