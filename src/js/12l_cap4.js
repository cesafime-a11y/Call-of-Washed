// ---- 12l_cap4.js ----
// =====================================================================
// PARTE I · CAPÍTULO 4 · «Cuarenta segundos» (P1-M4)
// Estación Central de San Elías · sábado 17 de febrero de 1940 · 10:15
// Tramos: la plaza (los cuartos, el quinto golpe, la esfera sur que se
// atrasa cuarenta segundos) · el vestíbulo (el padre debajo del reloj, el
// falso operario, el cabo, la llave maestra) · la escalera de caracol
// (142 escalones, el relojero de la estación en el 38) · la sala de
// máquinas (la caja, el puente del volante con la violeta y el tornillo
// azul, el papel de fumar, el cable negro) · la ventanita de la esfera sur
// (Montúfar, el operario abatido, el Packard) · las once · «Perdóname».
// La torre está de verdad encima de la fachada: lo que se ve desde la
// ventanita es la misma plaza que se pisa al principio.
// La escalera de caracol va aparte, en x 120.
// =====================================================================
MAPS.c4_estacion = {
  name: { es: 'Estación Central · 17-II-1940', en: 'Central Station · 17-II-1940' },
  desc: { es: 'La plaza, el vestíbulo de hierro y cristal y la torre del reloj de cuatro esferas.', en: 'The square, the iron-and-glass hall and the four-faced clock tower.' },
  campaign: true,
  thumb: ['#b8c0c8', '#8a8478', '#3a3630'],
  theme: { skyTop: 0x7a92b0, skyMid: 0xd0d8e0, skyBot: 0xe4e0d4, fog: 0xd4d4cc, fogNear: 90, fogFar: 420, sun: 0xfffaf0, sunI: 0.3, sunDir: [0.3, 0.8, 0.5], hemiTop: 0xe4e8ee, hemiBot: 0x6a6458, hemiI: 0.3, exposure: 1.05, cloud: 0.2, rays: 0, glow: 0, lamps: false, soldFill: 0.5, soldRim: 0.3 },
  build(B) {
    B.bounds(-60, -90, 150, 70);
    B.ground(-60, -90, 150, 70, { y: -0.6, pattern: PAT.COBBLE, color: 0x5a5650 });
    B.spawn('ffa', 0, 0, 30, 0);
  },
};

const Cap4Set = {
  build(S) {
    const root = new THREE.Group(); MapSys.decor.add(root);
    const K = CampKit(root), { box, grp, cyl, ball, solid, furn, canvasTex, plane, room, win, person, M, wallX, wallZ } = K, V = CampUtil.V;
    const stone = 0x9a948a, stoneD = 0x7a746a, iron = 0x2e3a30, bronze = 0xb08a3a;
    const lights = {};
    const addL = (k, l) => { root.add(l); if (l.target) root.add(l.target); (lights[k] = lights[k] || []).push([l, l.intensity]); l.intensity = 0; return l; };
    const F = { lights, tex: K.tex, col: K.col };
    const fogMat = (c, t) => new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: t, depthWrite: false, roughness: 1 });

    // ========== LA PLAZA ==========
    const cob = canvasTex(128, 128, (g, w, h) => { g.fillStyle = '#6a645a'; g.fillRect(0, 0, w, h); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const c = 90 + ((x * 7 + y * 13) % 5) * 8; g.fillStyle = `rgb(${c},${c - 6},${c - 14})`; g.fillRect(x * 16 + 1 + (y % 2) * 8, y * 16 + 1, 14, 14); } });
    cob.wrapS = cob.wrapT = THREE.RepeatWrapping; cob.repeat.set(40, 36);
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(110, 100), new THREE.MeshStandardMaterial({ map: cob, roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.001, 15); root.add(m); }
    // la fachada de piedra gris, la puerta principal
    for (const [x0, x1] of [[-26, -2.6], [2.6, 26]]) { box(x1 - x0, 16, 4, stone, (x0 + x1) / 2, 8, -32); solid(x0, -34, x1, -30, -1, 17); }
    box(5.2, 11, 4, stone, 0, 10.5, -32);
    box(53, 1.2, 4.6, stoneD, 0, 16.6, -32); for (let i = 0; i < 9; i++) { const x = -22 + i * 5.5; if (Math.abs(x) < 3) continue; box(2.0, 3.6, 0.1, 0xc8d0d4, x, 9, -29.95, root, { e: 0x8a96a0, ei: 0.2 }); box(0.6, 15.5, 0.6, stoneD, x + 2.75, 7.8, -29.8); }
    box(5.4, 5.6, 0.2, stoneD, 0, 2.8, -29.9).visible = false;
    for (const s of [-1, 1]) box(0.8, 6, 0.8, stoneD, s * 2.9, 3, -29.7);
    box(6.6, 0.8, 0.9, stoneD, 0, 6.2, -29.7);
    const sigT = canvasTex(512, 64, (g, w, h) => { g.fillStyle = '#c8c0a8'; g.fillRect(0, 0, w, h); g.fillStyle = '#2a2418'; g.font = 'bold 34px serif'; g.textAlign = 'center'; g.fillText('ESTACIÓN CENTRAL', w / 2, 46); });
    plane(9, 1.1, sigT, 0, 13.5, -29.88);
    // la torre del reloj: encima de la fachada, cuatro esferas a cuarenta metros
    const TY = 38.6, TZ = -33;
    for (const [x0, z0, x1, z1] of [[-3, -36, 3, -35.6], [-3, -30.4, 3, -30], [-3, -36, -2.6, -30], [2.6, -36, 3, -30]]) box(x1 - x0, 28, z1 - z0, stone, (x0 + x1) / 2, 16 + 14, (z0 + z1) / 2);
    box(6.4, 0.6, 6.4, stoneD, 0, 42.2, TZ); { const r = new THREE.Mesh(new THREE.ConeGeometry(4.6, 5, 4), M(0x4a5a5a, { m: 0.3 })); r.rotation.y = Math.PI / 4; r.position.set(0, 45, TZ); root.add(r); }
    box(6.6, 0.4, 6.6, stoneD, 0, 35.8, TZ);
    const dialT = canvasTex(512, 512, (g, w, h) => { const c = w / 2; g.fillStyle = '#ece8dc'; g.beginPath(); g.arc(c, c, 250, 0, 7); g.fill(); g.strokeStyle = '#1a1814'; g.lineWidth = 10; g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(c, c, 200, 0, 7); g.stroke();
      g.fillStyle = '#1a1814'; g.font = 'bold 46px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      R.forEach((r, i) => { const a = i / 12 * Math.PI * 2; g.save(); g.translate(c + Math.sin(a) * 222, c - Math.cos(a) * 222); g.rotate(a); g.fillText(r, 0, 0); g.restore(); });
      for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2; g.fillRect(c + Math.sin(a) * 196 - 2, c - Math.cos(a) * 196 - 2, 4, 4); } });
    const dialIn = canvasTex(512, 512, (g, w, h) => { const c = w / 2; const gr = g.createRadialGradient(c, c, 20, c, c, 256); gr.addColorStop(0, '#f4f0e4'); gr.addColorStop(1, '#c8c0b0'); g.fillStyle = gr; g.beginPath(); g.arc(c, c, 252, 0, 7); g.fill();
      g.save(); g.translate(w, 0); g.scale(-1, 1); g.globalAlpha = 0.28; g.fillStyle = '#1a1814'; g.font = 'bold 46px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'].forEach((r, i) => { const a = i / 12 * Math.PI * 2; g.save(); g.translate(c + Math.sin(a) * 222, c - Math.cos(a) * 222); g.rotate(a); g.fillText(r, 0, 0); g.restore(); }); g.restore();
      g.strokeStyle = 'rgba(60,50,40,.5)'; g.lineWidth = 8; g.beginPath(); g.arc(c, c, 250, 0, 7); g.stroke(); });
    const RD = 2.2, faces = {};
    // cara: { ry exterior, posición exterior, posición interior }
    const faceDefs = { s: [0, V(0, TY, -29.94), V(0, TY, -30.58)], e: [Math.PI / 2, V(3.06, TY, TZ), V(2.42, TY, TZ)], n: [Math.PI, V(0, TY, -36.06), V(0, TY, -35.42)], w: [-Math.PI / 2, V(-3.06, TY, TZ), V(-2.42, TY, TZ)] };
    for (const k in faceDefs) {
      const [ry, po, pi] = faceDefs[k];
      const out = grp(po.x, po.y, po.z, root, ry); const dm = new THREE.Mesh(new THREE.CircleGeometry(RD, 40), new THREE.MeshStandardMaterial({ map: dialT, roughness: 0.6 })); out.add(dm);
      const hm = M(0x141210, { m: 0.4 }); const hh = grp(0, 0, 0.03, out), mh = grp(0, 0, 0.05, out);
      box(0.12, 1.15, 0.03, 0, 0, 0.5, 0, hh, { mat: hm }); box(0.08, 1.75, 0.03, 0, 0, 0.78, 0, mh, { mat: hm });
      const inn = grp(pi.x, pi.y, pi.z, root, ry + Math.PI); const im = new THREE.Mesh(new THREE.CircleGeometry(RD, 40), new THREE.MeshStandardMaterial({ map: dialIn, emissive: 0xffffff, emissiveMap: dialIn, emissiveIntensity: 0.75, roughness: 1 })); inn.add(im);
      const sm = M(0x3a3630, { t: 0.55 }); const ih = grp(0, 0, 0.02, inn), imh = grp(0, 0, 0.03, inn); box(0.14, 1.15, 0.01, 0, 0, 0.5, 0, ih, { mat: sm }); box(0.1, 1.75, 0.01, 0, 0, 0.78, 0, imh, { mat: sm });
      faces[k] = { out, hh, mh, inn, ih, imh, lag: k === 's' ? 40 : 0 };
    }
    F.faces = faces; F.TY = TY; F.TZ = TZ;
    F.clock = 10 * 3600 + 15 * 60 - 3;                    // segundos del día que marca el mecanismo
    // la tarima, las banderas, el cordón, la banda, los fotógrafos
    furn(9, 1.2, 4.5, 0x6a4a30, 0, 0, 2); box(9.2, 0.9, 0.05, 0x8a1a1a, 0, 0.6, 4.27);
    const flagSM = canvasTex(96, 64, (g) => { g.fillStyle = '#2a6a3a'; g.fillRect(0, 0, 32, 64); g.fillStyle = '#e8e4d8'; g.fillRect(32, 0, 32, 64); g.fillStyle = '#b8862a'; g.fillRect(64, 0, 32, 64); });
    const flagVD = canvasTex(96, 64, (g) => { g.fillStyle = '#111'; g.fillRect(0, 0, 96, 32); g.fillStyle = '#eee'; g.fillRect(0, 32, 96, 32); g.fillStyle = '#b8862a'; g.beginPath(); g.arc(48, 32, 12, 0, 7); g.fill(); g.fillStyle = '#111'; for (const s of [-1, 1]) { g.beginPath(); g.arc(48 + s * 7, 24, 4, 0, 7); g.fill(); } });
    const flags = [];
    for (const [x, t] of [[-3.8, flagSM], [-1.3, flagVD], [1.3, flagSM], [3.8, flagVD]]) { cyl(0.04, 0.04, 5, 0x8a8a80, x, 3.7, 0.2, root, { m: 0.6 }); const f = plane(1.5, 1.0, t, x + 0.78, 5.6, 0.2, 0, root, { ds: true }); flags.push(f); }
    F.flags = flags;
    const helmet = (p) => { const b = ball(0.16, 0x4a5040, 0, 0.12, 0, p.head, { m: 0.4 }); b.scale.set(1, 0.6, 1.08); box(0.36, 0.015, 0.36, 0x4a5040, 0, 0.07, 0, p.head); };
    const guard = (o) => { const p = person({ coat: 0x3a4a5a, leg: 0x2a3440, hair: 0x2a2018, ...o }); helmet(p); const m = box(0.04, 1.0, 0.06, 0x3a2a1a, 0.27, 0.2, -0.05, p.torso); m.rotation.x = 0.2; return p; };
    for (let z = -26; z <= -1; z += 2.4) for (const s of [-1, 1]) guard({ x: s * 3.2, z, ry: s * Math.PI / 2 });
    for (let i = 0; i < 12; i++) { const p = person({ x: -8 + (i % 6) * 0.9, z: 6.5 + Math.floor(i / 6) * 0.9, ry: Math.PI * 0.85, coat: 0x2a3a5a, leg: 0x1e2430, cap: 0x2a3a5a, hair: 0x2a2018 }); const ins = cyl(0.08, 0.13, 0.4, bronze, 0, 0.15, 0.25, p.arms[1].userData.f, { m: 0.8, r: 0.3, rx: 1.2 }); void ins; p.arms[1].rotation.x = -1.1; }
    const photogs = [];
    for (const [x, z] of [[-5.5, 0.5], [5.2, 0.8], [-4.4, -6], [4.6, -9]]) { const p = person({ x, z, ry: CampUtil.yawTo(x, z, 0, -12) + Math.PI, coat: 0x3a3632, hat: 0x2a2620 }); box(0.2, 0.22, 0.28, 0x111111, 0, 0.55, 0.3, p.torso); p.arms[0].rotation.x = -1.3; p.arms[1].rotation.x = -1.3; photogs.push(p); }
    F.photogs = photogs;
    const mag = addL('window', new THREE.PointLight(0xffffff, 0, 30)); mag.position.set(0, 3, -4); F.mag = mag;
    const magB = ball(0.15, 0xffffff, 0, -50, 0, root, { e: 0xffffff, ei: 4 }); F.magB = magB;
    // los estudiantes de la pancarta y los dos guardias que van hacia ellos
    const banT = canvasTex(512, 96, (g, w, h) => { g.fillStyle = '#ece4d0'; g.fillRect(0, 0, w, h); g.fillStyle = '#8a1a14'; g.font = 'bold 40px serif'; g.textAlign = 'center'; g.save(); g.rotate(-0.02); g.fillText('¡EL METAL GRIS ES DEL PUEBLO!', w / 2, 62); g.restore(); });
    for (const x of [-31, -26.2]) { const p = person({ x, z: 24, ry: Math.PI * 0.75, coat: 0x4a4238, hair: 0x2a2018 }); p.arms[1].rotation.x = -2.6; cyl(0.02, 0.02, 2.6, 0x6a4a2a, x, 1.6, 24); }
    plane(4.6, 0.86, banT, -28.6, 2.55, 24.05, Math.PI * 0.75 - Math.PI, root, { ds: true });
    const g1 = guard({ x: -22, z: 18, ry: CampUtil.yawTo(-22, 18, -28, 24) + Math.PI }), g2 = guard({ x: -21, z: 19.4, ry: CampUtil.yawTo(-21, 19.4, -28, 24) + Math.PI });
    F.banGuards = [g1, g2];
    // la gente: dos mil detrás del cordón (instanciada)
    const crowd = [];
    for (let i = 0; i < 520; i++) {
      const side = i % 2 ? 1 : -1, x = side * (6.5 + Math.random() * 30), z = -24 + Math.random() * 56;
      if (Math.abs(x) < 8 && z > -2 && z < 9) continue; if (x < -24 && z > 20) continue;
      crowd.push({ x, z, ry: CampUtil.yawTo(x, z, 0, 0) + (Math.random() - 0.5) * 0.8 });
    }
    for (let i = 0; i < 70; i++) { const x = -16 + Math.random() * 32, z = -66 + Math.random() * 26; if (Math.abs(x) < 3 && z > -54 && z < -46) continue; crowd.push({ x, z, ry: Math.random() * 6.28, hall: true }); }
    { const n = crowd.length, legG = new THREE.BoxGeometry(0.3, 0.86, 0.18), torG = new THREE.BoxGeometry(0.44, 0.66, 0.3), headG = new THREE.BoxGeometry(0.23, 0.26, 0.24), hatG = new THREE.BoxGeometry(0.3, 0.12, 0.3);
      const mk = (geo) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), n); root.add(m); return m; };
      const legs = mk(legG), tor = mk(torG), heads = mk(headG), hats = mk(hatG), o = new THREE.Object3D(), c = new THREE.Color();
      const coats = [0x2e2a26, 0x3a3632, 0x4a4238, 0x2a3040, 0x5a4a3a, 0x6a5a48, 0x3a2a24, 0x7a6a58, 0x2a2a2e, 0x8a3a30];
      crowd.forEach((p, i) => { const s = 0.92 + Math.random() * 0.14;
        o.rotation.set(0, p.ry, 0); o.scale.setScalar(s);
        o.position.set(p.x, 0.43 * s, p.z); o.updateMatrix(); legs.setMatrixAt(i, o.matrix); legs.setColorAt(i, c.setHex(0x26221e));
        o.position.set(p.x, 1.2 * s, p.z); o.updateMatrix(); tor.setMatrixAt(i, o.matrix); tor.setColorAt(i, c.setHex(coats[(i * 7) % coats.length]));
        o.position.set(p.x, 1.66 * s, p.z); o.updateMatrix(); heads.setMatrixAt(i, o.matrix); heads.setColorAt(i, c.setHex([0xc49a7c, 0xb08468, 0xd0a888][i % 3]));
        o.position.set(p.x, (i % 3 ? 1.84 : -5) * s, p.z); o.updateMatrix(); hats.setMatrixAt(i, o.matrix); hats.setColorAt(i, c.setHex([0x2a2620, 0x4a4030, 0x1a1a1a][i % 3])); });
      for (const m of [legs, tor, heads, hats]) { m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; } }
    // los lados de la plaza: casas, la avenida de la Independencia, los coches de punto
    for (const [x, z, w, d, h, c] of [[-50, 0, 14, 60, 18, 0xb8a888], [50, -10, 14, 40, 16, 0xc0b49a], [50, 30, 14, 26, 14, 0xa89880], [-14, 52, 40, 12, 15, 0xc4b8a0], [24, 52, 30, 12, 17, 0xb0a490]]) box(w, h, d, c, x, h / 2, z);
    solid(-44, -60, -43, 60); solid(43, -60, 44, 60); solid(-50, 46, 50, 47);
    for (let i = 0; i < 3; i++) { const g = grp(-38 + i * 4.5, 0, 40, root, Math.PI / 2); box(1.4, 1.2, 2.6, 0x1a1a1a, 0, 1.2, 0, g); for (const s of [-1, 1]) for (const zz of [-0.9, 0.9]) cyl(0.5, 0.5, 0.06, 0x3a2a1a, s * 0.75, 0.5, zz, g, { rz: Math.PI / 2 }); box(0.5, 1.0, 1.6, 0x5a3a24, 0, 1.3, 2.4, g); }
    const pack = grp(-33, 0, 33, root, Math.PI * 0.2); box(1.8, 0.7, 4.8, 0x0e0e10, 0, 0.75, 0, pack, { m: 0.5, r: 0.3 }); box(1.6, 0.6, 2.4, 0x0e0e10, 0, 1.4, 0.3, pack, { m: 0.5, r: 0.3 }); box(1.62, 0.36, 1.0, 0x1a1a1e, 0, 1.45, 0.95, pack, { m: 0.2 });
    for (const s of [-1, 1]) for (const zz of [-1.5, 1.5]) cyl(0.38, 0.38, 0.22, 0x111111, s * 0.92, 0.38, zz, pack, { rz: Math.PI / 2 });
    const curtain = box(0.02, 0.32, 0.5, 0x2a2018, 0.82, 1.45, 0.95, pack); const finger = box(0.02, 0.025, 0.07, 0xc49a7c, 0.84, 1.52, 0.7, pack); finger.visible = false; const ring = ball(0.012, 0xd4a840, 0.84, 1.52, 0.68, pack, { m: 0.8, r: 0.3 }); ring.visible = false;
    const packDoor = box(0.06, 0.6, 0.9, 0x0e0e10, 0.9, 1.3, 0.95, pack, { m: 0.5 }); F.pack = pack; F.curtain = curtain; F.finger = finger; F.ring = ring; F.packDoor = packDoor;
    // las vías de cercanías al este y el puente de la calle de los Correos
    box(14, 0.4, 90, 0x4a4238, 36, -0.4, -30); for (const x of [32, 34, 38, 40]) box(0.1, 0.12, 90, 0x6a6a68, x, -0.14, -30, root, { m: 0.7 });
    box(16, 1.4, 6, 0x7a6a5a, 36, 4, 14); for (const s of [-1, 1]) box(1.5, 4, 6, 0x6a5a4a, 36 + s * 7, 2, 14);
    box(10, 0.9, 40, 0x8a8478, 27, 0.0, -40);
    const runner = person({ x: 31, z: -40, ry: Math.PI, coat: 0x2a3a6a, leg: 0x2a3a6a, hair: 0x14100c, mous: 0x14100c }); runner.g.visible = false; F.runner = runner;
    const chasers = []; for (let i = 0; i < 3; i++) { const p = guard({ x: 31 + i * 0.6, z: -52 - i * 1.2, ry: Math.PI, h: i === 0 ? 1.08 : 1 }); p.g.visible = false; chasers.push(p); } F.chasers = chasers;
    // Montúfar y los vardeneses
    const party = [];
    const mont = person({ x: 0, z: -30, ry: 0, belly: true, h: 0.9, coat: 0x4a4e38, leg: 0x4a4e38, hair: 0xd8d4cc, mous: 0xeeeeee, cap: 0x4a4e38 });
    for (let i = 0; i < 9; i++) box(0.04, 0.04, 0.01, [0xc8a040, 0xb02020, 0x2050a0][i % 3], -0.12 + (i % 3) * 0.05, 0.45 - Math.floor(i / 3) * 0.06, 0.2, mont.torso, { m: 0.6 });
    party.push(mont);
    for (let i = 0; i < 3; i++) { const p = person({ x: -0.8 + i * 0.8, z: -31.4, ry: 0, h: 1.1, slim: true, coat: 0x6a6e72, leg: 0x6a6e72, hair: 0xd8c070, cap: 0x5a5e62 }); party.push(p); }
    for (let i = 0; i < 4; i++) party.push(person({ x: -1.2 + i * 0.8, z: -32.6, ry: 0, coat: 0x161616, leg: 0x222222, hat: 0x111111 }));
    party.forEach((p) => { p.g.visible = false; p.g.userData.z0 = p.g.position.z; }); F.party = party; F.partyT = -1;
    addL('plaza', new THREE.HemisphereLight(0xeef2f6, 0x6a6458, 0.95)).position.set(0, 20, 0);
    { const l = addL('plaza', new THREE.DirectionalLight(0xfffaf0, 1.5)); l.position.set(20, 40, 40); l.target.position.set(0, 0, -10); }
    { const l = addL('window', new THREE.DirectionalLight(0xfffaf0, 1.5)); l.position.set(20, 60, 40); l.target.position.set(0, 0, -10); addL('window', new THREE.HemisphereLight(0xeef2f6, 0x6a6458, 0.95)).position.set(0, 20, 0); }

    // ========== EL VESTÍBULO DE HIERRO Y CRISTAL ==========
    const marble = canvasTex(128, 128, (g, w, h) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { g.fillStyle = (x + y) % 2 ? '#1a1a1a' : '#e8e4dc'; g.fillRect(x * 32, y * 32, 32, 32); } });
    marble.wrapS = marble.wrapT = THREE.RepeatWrapping; marble.repeat.set(10, 9);
    { const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 36), new THREE.MeshStandardMaterial({ map: marble, roughness: 0.35, metalness: 0.05 })); m.rotation.x = -Math.PI / 2; m.position.set(0, 0.012, -52); root.add(m); }
    wallZ(-70, -20, 20, [], 0, 14, 0xb8b0a0); wallX(-20, -70, -34, [], 0, 14, 0xb8b0a0); wallX(20, -70, -34, [[-50, -44]], 0, 14, 0xb8b0a0, 3.4);
    solid(20, -50, 22, -44, -1, 5);
    // la bóveda: costillas de hierro y cristal por donde entra la luz a chorros
    for (let z = -68; z <= -36; z += 4) { for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12, a2 = Math.PI * (i + 1) / 12; if (i === 12) break; const x0 = -20 * Math.cos(a), y0 = 14 + 6 * Math.sin(a), x1 = -20 * Math.cos(a2), y1 = 14 + 6 * Math.sin(a2), L = Math.hypot(x1 - x0, y1 - y0); const b = box(L, 0.25, 0.25, iron, (x0 + x1) / 2, (y0 + y1) / 2, z); b.rotation.z = Math.atan2(y1 - y0, x1 - x0); } }
    for (let i = 0; i < 12; i++) { const a = Math.PI * (i + 0.5) / 12, x = -20 * Math.cos(a), y = 14 + 6 * Math.sin(a), L = 20 * Math.PI / 12 + 0.1; const b = box(L, 0.04, 34, 0xdce4ea, x, y + 0.1, -52, root, { e: 0xe4ecf2, ei: 0.85, r: 0.2 }); b.rotation.z = a - Math.PI / 2; }
    // el reloj grande de doble esfera, colgado de una viga
    const hallClockT = canvasTex(256, 256, (g, w, h) => { const c = 128; g.fillStyle = '#f0ece0'; g.beginPath(); g.arc(c, c, 124, 0, 7); g.fill(); g.strokeStyle = '#1a1814'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#1a1814'; g.font = 'bold 22px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(String(i), c + Math.sin(a) * 100, c - Math.cos(a) * 100); } });
    const hc = grp(0, 7.5, -50); cyl(0.95, 0.95, 0.45, 0x3a2a1a, 0, 0, 0, hc, { rx: Math.PI / 2, seg: 28 }); cyl(0.04, 0.04, 6.5, iron, 0, 3.4, 0, hc);
    const hcHands = [];
    for (const s of [-1, 1]) { const f = plane(1.7, 1.7, hallClockT, 0, 0, s * 0.235, s > 0 ? 0 : Math.PI, hc, { e: 0.25 }); void f; const hh = grp(0, 0, s * 0.25, hc, s > 0 ? 0 : Math.PI), mh = grp(0, 0, s * 0.26, hc, s > 0 ? 0 : Math.PI); box(0.06, 0.45, 0.01, 0x111111, 0, 0.2, 0, hh); box(0.04, 0.7, 0.01, 0x111111, 0, 0.32, 0, mh); hcHands.push([hh, mh]); }
    F.hc = hc; F.hcHands = hcHands; F.hallTime = 10 * 60 + 30;
    // la consigna y la puerta verde de la torre
    furn(5, 1.1, 1.2, 0x5a3a24, 13.5, 0, -68.8); box(5, 1.6, 0.1, 0x6a4a30, 13.5, 2.5, -69.4);
    const consT = canvasTex(256, 48, (g, w, h) => { g.fillStyle = '#1a2a4a'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e4d8'; g.font = 'bold 26px serif'; g.textAlign = 'center'; g.fillText('CONSIGNA', w / 2, 34); });
    plane(1.8, 0.34, consT, 13.5, 3.6, -69.32);
    const gdoor = box(1.1, 2.2, 0.08, 0x2a5a3a, 8, 1.1, -69.9, root, { m: 0.4, r: 0.5 }); F.gdoor = gdoor;
    const tsT = canvasTex(512, 96, (g, w, h) => { g.fillStyle = '#e8e4d8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#1a2a4a'; g.lineWidth = 6; g.strokeRect(4, 4, w - 8, h - 8); g.fillStyle = '#1a2a4a'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.fillText('TORRE DEL RELOJ · PROHIBIDO EL PASO', w / 2, 42); g.font = 'bold 22px sans-serif'; g.fillText('SOLO PERSONAL AUTORIZADO', w / 2, 74); });
    plane(1.8, 0.34, tsT, 8, 2.55, -69.84);
    for (const x of [-12, -6, 0]) { furn(3, 0.45, 0.6, 0x5a3a24, x, 0, -66); }
    // el padre debajo del reloj
    const papa = person({ x: 0, z: -50.6, ry: 0, coat: 0x5a5c60, leg: 0x5a5c60, shirt: 0xe8e4d8, tie: 0x2a2a3a, hair: 0x8a8680, mous: 0x4a4440, slim: true });
    papa.arms[1].rotation.x = -0.5; const hatP = box(0.3, 0.12, 0.3, 0x2a2826, 0, -0.32, 0.08, papa.arms[1].userData.f); void hatP;
    F.papa = papa;
    // el falso operario: mono azul nuevo, gorra de la Compañía
    const op = person({ x: 8, z: -69.2, ry: 0, coat: 0x2a3a6a, leg: 0x2a3a6a, cap: 0x2a3a6a, hair: 0x14100c, mous: 0x14100c, boot: 0x6a4428 });
    op.g.visible = false; op.arms[1].rotation.x = -2.2; op.arms[1].userData.f.rotation.x = -1.0;
    box(0.02, 0.4, 0.01, 0x3a4a7a, -0.12, 0.35, 0.155, op.torso, { rz: 0.7 });
    F.op = op;
    const cabo = guard({ x: 3.6, z: -35.2, ry: -Math.PI / 2 - 0.3, h: 1.08 }); box(0.2, 0.06, 0.02, 0x2a2018, 0, -0.1, 0.12, cabo.head); F.cabo = cabo;
    const keyMesh = grp(0, -50, 0); box(0.05, 0.05, 0.01, 0x5a5a5a, 0, 0, 0, keyMesh, { m: 0.8 }); box(0.012, 0.012, 0.09, 0x5a5a5a, 0, 0, -0.05, keyMesh, { m: 0.8 }); F.key = keyMesh;
    const gab = person({ x: 3, z: -62, ry: Math.PI, coat: 0x8a8a84, leg: 0x2a2a2a, hat: 0x4a4a48, hair: 0x2a2018 }); gab.g.visible = false; F.gab = gab;
    addL('hall', new THREE.HemisphereLight(0xf0f4f8, 0x4a4640, 1.0)).position.set(0, 14, -52);
    { const l = addL('hall', new THREE.DirectionalLight(0xfffaf0, 0.9)); l.position.set(6, 30, -45); l.target.position.set(0, 0, -55); }
    { const l = addL('hall', new THREE.PointLight(0xfff4e0, 0.8, 30)); l.position.set(0, 10, -52); }

    // ========== LA ESCALERA DE CARACOL (x 120) ==========
    const SX = 120, NST = 142, H = 38, hs = H / NST, PER = 11.21, da = Math.PI * 2 / PER;
    for (let i = 1; i <= NST; i++) { const a = i * da, y = i * hs; const b = box(1.15, 0.06, 0.5, 0x3a3a38, SX + Math.cos(a) * 0.9, y - 0.03, Math.sin(a) * 0.9, root, { m: 0.6, r: 0.5 }); b.rotation.y = -a; if (i % 2 === 0) box(0.03, 0.9, 0.03, 0x2a2a28, SX + Math.cos(a) * 1.45, y + 0.45, Math.sin(a) * 1.45, root, { m: 0.6 }); }
    cyl(0.12, 0.12, H + 2, 0x2a2a28, SX, H / 2, 0, root, { m: 0.6 });
    { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, H + 6, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x5a3a2a, roughness: 0.95, side: THREE.BackSide })); m.position.set(SX, H / 2, 0); root.add(m); }
    box(4, 0.1, 4, 0x2a2420, SX, -0.05, 0); box(4, 0.2, 4, 0x3a2a1a, SX, H + 2.2, 0);
    for (let k = 0; k < 20; k++) { const a = k / 20 * Math.PI * 2, x = SX + Math.cos(a) * 1.82, z = Math.sin(a) * 1.82; solid(x - 0.28, z - 0.28, x + 0.28, z + 0.28, -2, H + 4); }
    solid(SX - 0.26, -0.26, SX + 0.26, 0.26, -2, H + 4);
    F.helix = (x, z, y) => { let a = Math.atan2(z, x - SX); if (a < 0) a += Math.PI * 2; const s = a / (Math.PI * 2) * PER * hs, P = PER * hs; const k = Math.round((y - s) / P); let yy = s + k * P; if (yy < -0.01) yy += P; return clamp(Math.floor(yy / hs + 0.5) * hs, 0, H); };
    F.SX = SX; F.hs = hs; F.da = da;
    // el relojero de la estación, tirado en el escalón treinta y ocho
    { const a = 38 * da, y = 38 * hs, x = SX + Math.cos(a) * 0.85, z = Math.sin(a) * 0.85; const g = grp(x, y + 0.12, z, root, -a); box(0.5, 0.22, 1.1, 0x4a3a2a, 0, 0, 0.1, g); box(0.22, 0.2, 0.24, 0xc4a080, 0, 0.05, -0.55, g); box(0.24, 0.1, 0.2, 0xe0dcd4, 0, -0.05, -0.62, g); box(0.24, 0.06, 0.24, 0x3a3a3a, 0.3, -0.08, -0.7, g); F.oldman = V(x, y + 0.2, z); }
    const stL = addL('stair', new THREE.PointLight(0xc8b49a, 0.55, 7)); F.stL = stL;
    addL('stair', new THREE.HemisphereLight(0x5a5048, 0x1a1410, 0.12)).position.set(SX, 20, 0);

    // ========== LA SALA DE MÁQUINAS (dentro de la torre, y 36) ==========
    const RY = 36;
    room(-2.6, -35.6, 2.6, -30.4, 5.2, { y: RY, wall: 0x8a5a44, floor: 0x4a3a2a, ceil: false });
    for (let i = 0; i < 3; i++) box(5.2, 0.25, 0.25, 0x3a2a1a, 0, RY + 4.6, TZ - 1.6 + i * 1.6);
    // la jaula de hierro verde con sus tres trenes, el péndulo, las varillas
    box(2.4, 0.5, 1.2, iron, 0, RY + 0.25, TZ, root, { m: 0.4 }); solid(-1.25, TZ - 0.65, 1.25, TZ + 0.65, RY - 1, RY + 2);
    for (const x of [-1.15, 1.15]) for (const z of [-0.55, 0.55]) box(0.08, 1.2, 0.08, iron, x, RY + 1.1, TZ + z, root, { m: 0.4 });
    box(2.4, 0.08, 1.2, iron, 0, RY + 1.7, TZ, root, { m: 0.4 });
    const wheels = [];
    for (let t = 0; t < 3; t++) for (let k = 0; k < 3; k++) { const w = cyl(0.12 + k * 0.08, 0.12 + k * 0.08, 0.03, bronze, -0.7 + t * 0.7, RY + 0.8 + k * 0.22, TZ + (k - 1) * 0.15, root, { rx: Math.PI / 2, m: 0.8, r: 0.3, seg: 18 }); wheels.push(w); }
    F.wheels = wheels;
    const pend = grp(0, RY + 0.5, TZ + 0.75); box(0.05, 4.0, 0.03, 0x4a4a48, 0, -2.0, 0, pend, { m: 0.7 }); cyl(0.36, 0.36, 0.1, 0x2a2a28, 0, -3.9, 0, pend, { rx: Math.PI / 2, m: 0.6, seg: 20 }); F.pend = pend;
    box(0.8, 0.02, 0.4, 0x0a0806, 0, RY + 0.01, TZ + 0.75);
    const rods = [];
    for (const k in faceDefs) { const pi = faceDefs[k][2], a = V(0, RY + 1.7, TZ), b = V(pi.x * 0.98, TY, pi.z + (k === 's' ? -0.05 : k === 'n' ? 0.05 : 0)); const d = b.clone().sub(a), L = d.length(); const r = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, L, 8), M(0x7a7a78, { m: 0.8, r: 0.3 })); r.position.copy(a).add(b).multiplyScalar(0.5); r.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); root.add(r); rods.push(r); }
    // las campanas y los martillos
    for (const [x, z, r] of [[-1.4, TZ - 1.2, 0.35], [-0.5, TZ - 1.3, 0.4], [0.5, TZ - 1.3, 0.45], [1.4, TZ - 1.2, 0.5], [0, TZ + 1.1, 0.95]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r, r * 1.1, 18, 1, true), new THREE.MeshStandardMaterial({ color: 0x8a6a2a, metalness: 0.8, roughness: 0.35, side: THREE.DoubleSide })); b.position.set(x, RY + 4.4 - r * 0.6, z); root.add(b); }
    const bigHammer = grp(0.9, RY + 3.2, TZ + 1.1); box(0.06, 0.06, 0.9, 0x2a2a28, 0, 0, -0.45, bigHammer); box(0.18, 0.18, 0.28, 0x2a2a28, 0, 0, -0.95, bigHammer); F.bigHammer = bigHammer;
    // la caja de chapa gris atada con alambre a la viga, junto a la varilla sur
    const BXp = V(0.42, RY + 0.5, TZ + 1.95);
    box(0.06, 0.06, 2.0, iron, 0.42, RY + 0.4, TZ + 1.4, root, { m: 0.4 });
    const bx = grp(BXp.x, BXp.y, BXp.z, root, Math.PI); box(0.52, 0.2, 0.26, 0x6a6c6a, 0, 0.1, 0, bx, { m: 0.5, r: 0.5 });
    for (const x of [-0.2, 0.0, 0.2]) box(0.012, 0.215, 0.27, 0x9a9a98, x, 0.1, 0, bx, { m: 0.8 });
    const lid = grp(0, 0.2, -0.13, bx); box(0.53, 0.02, 0.27, 0x6e706e, 0, 0.01, 0.135, lid, { m: 0.5, r: 0.5 }); F.lid = lid;
    const wings = []; for (const x of [-0.18, 0.18]) { const w = grp(x, 0.03, 0.22, lid); box(0.05, 0.015, 0.012, 0x9a9a98, 0, 0.012, 0, w, { m: 0.8 }); wings.push(w); } F.wings = wings;
    // dentro (sin detalle): dos filas de cartuchos, el detonador, la placa de baquelita con el reloj desnudo
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) cyl(0.022, 0.022, 0.22, 0x6a5a40, -0.2 + i * 0.045, 0.05 + r * 0.045, 0, bx, { rz: Math.PI / 2 * 0 + 0, rx: Math.PI / 2 });
    const plate = grp(0.1, 0.16, -0.0, bx); box(0.24, 0.012, 0.2, 0x1a1210, 0, 0, 0, plate);
    cyl(0.05, 0.05, 0.008, 0xc8a050, -0.03, 0.01, 0, plate, { m: 0.8, r: 0.25, seg: 24 });
    const bal = grp(-0.055, 0.022, 0.035, plate); cyl(0.022, 0.022, 0.004, 0xc0a050, 0, 0, 0, bal, { m: 0.9, r: 0.2, seg: 20 }); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; ball(0.003, 0xffd040, Math.cos(a) * 0.022, 0.002, Math.sin(a) * 0.022, bal, { m: 0.9, r: 0.2 }); }
    F.bal = bal;
    const bridge = grp(-0.055, 0.03, 0.035, plate); box(0.016, 0.004, 0.05, 0xd4b060, 0, 0, -0.012, bridge, { m: 0.8, r: 0.25 });
    const blueScrew = cyl(0.004, 0.004, 0.004, 0x1a3aa0, 0, 0.004, -0.03, bridge, { m: 0.9, r: 0.2, e: 0x0a1a60, ei: 0.6 }); cyl(0.004, 0.004, 0.004, 0xc8c8c8, 0, 0.004, 0.006, bridge, { m: 0.9, r: 0.2 });
    const violetT = canvasTex(64, 64, (g) => { g.strokeStyle = '#4a2a7a'; g.fillStyle = 'rgba(90,50,140,.85)'; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.beginPath(); g.ellipse(32 + Math.cos(a) * 9, 26 + Math.sin(a) * 9, 7, 4, a, 0, 7); g.fill(); } g.lineWidth = 2; g.beginPath(); g.moveTo(32, 30); g.quadraticCurveTo(26, 48, 36, 62); g.stroke(); });
    const violet = plane(0.012, 0.012, violetT, 0.0, 0.0025, -0.014, 0, bridge, { tr: true, rx: -Math.PI / 2 }); F.violet = violet; F.blueScrew = blueScrew; F.bridge = bridge;
    const arm = grp(0.02, 0.016, -0.0, plate); box(0.035, 0.002, 0.003, 0xd4b060, 0.0175, 0, 0, arm, { m: 0.8 }); arm.rotation.y = 0.4; F.arm = arm;
    box(0.008, 0.01, 0.008, 0xb86a3a, 0.055, 0.016, -0.03, plate, { m: 0.8 });
    // los cables: el negro por el pilar izquierdo; el rojo da una vuelta por debajo de la placa
    const wire = (pts, c) => { const curve = new THREE.CatmullRomCurve3(pts.map((p) => V(...p))); const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.0025, 6, false), M(c, { r: 0.7 })); bx.add(m); return m; };
    const wb = wire([[-0.2, 0.17, 0.05], [-0.12, 0.18, 0.06], [-0.04, 0.18, 0.04], [0.02, 0.18, 0.0]], 0x111111);
    const wr = wire([[-0.2, 0.17, -0.05], [-0.1, 0.165, -0.08], [0.05, 0.15, -0.09], [0.16, 0.15, -0.06], [0.2, 0.165, 0.0], [0.15, 0.18, 0.04]], 0xa01a14);
    F.wb = wb; F.wr = wr; F.box = bx; F.BXp = BXp; F.plate = plate;
    const slot = ball(0.004, 0xfff0a0, -0.03, 0.03, 0.035, plate, { e: 0xffe080, ei: 3 }); slot.visible = false; F.slot = slot;
    const paper = box(0.012, 0.001, 0.02, 0xf4f0e8, -0.04, 0.03, 0.035, plate); paper.visible = false; F.paper = paper;
    const inspect = box(0.5, 0.5, 0.04, 0x2a2a28, 1.6, TY - 1.5, -30.6, root, { m: 0.5 }); F.inspect = inspect;
    addL('room', new THREE.HemisphereLight(0xf4f0e4, 0x3a2a1a, 0.55)).position.set(0, RY + 3, TZ);
    { const l = addL('room', new THREE.PointLight(0xf4f0e4, 0.9, 9)); l.position.set(0, RY + 2.4, TZ); }
    { const l = addL('room', new THREE.PointLight(0xfff0d8, 0.35, 2)); l.position.set(0.42, RY + 1.2, TZ + 2.1); }
    F.RY = RY;
    // fundido blanco: la cabeza en blanco, como una esfera sin números
    const whiteEl = document.createElement('div'); whiteEl.style.cssText = 'position:absolute;inset:0;pointer-events:none;background:#f4f0e6;opacity:0;transition:opacity 1.2s ease';
    if (Scenes.el.root) Scenes.el.root.prepend(whiteEl); F.whiteEl = whiteEl;
    S.set = F;
    return F;
  },
  light(S, where) { const F = S.set; for (const k in F.lights) for (const [l, v] of F.lights[k]) l.intensity = k === where ? v : 0; F.where = where; },
  setHands(F) {
    for (const k in F.faces) { const f = F.faces[k], t = F.clock - f.lag, m = (t / 60) % 60, h = (t / 3600) % 12; f.mh.rotation.z = -m / 60 * Math.PI * 2; f.hh.rotation.z = -h / 12 * Math.PI * 2; f.imh.rotation.z = m / 60 * Math.PI * 2; f.ih.rotation.z = h / 12 * Math.PI * 2; }
    const m = F.hallTime % 60, h = (F.hallTime / 60) % 12; for (const [hh, mh] of F.hcHands) { mh.rotation.z = -m / 60 * Math.PI * 2; hh.rotation.z = -h / 12 * Math.PI * 2; }
  },
  quarters(at = 0, fifth = false) {
    [659, 523, 587, 392].forEach((f, i) => CampUtil.bellStrike(f / 2, 0.06, at + i * 0.9));
    if (fifth && SceneAudio.ok()) { const t = AUDIO.ctx.currentTime + at + 3.75; AUDIO.nz(SceneAudio.dest(), t, 0.06, 0.05, 'bandpass', 2400, null, 4); AUDIO.osc(SceneAudio.dest(), 'square', 1300, 900, t, 0.05, 0.012); }
  },
  update(S, dt) {
    const F = S.set; if (!F) return;
    CampUtil.globals(0, 0.08);
    const t = S.t, w = F.where;
    F.clock += dt; this.setHands(F);
    for (const f of F.flags) f.rotation.y = Math.sin(t * 1.4 + f.position.x) * 0.25;
    // el péndulo grande: un golpe cada segundo y medio
    const ph = Math.sin(t * Math.PI / 1.5); F.pend.rotation.z = ph * 0.07;
    if (w === 'room' && Math.sign(ph) !== F._ps) { F._ps = Math.sign(ph); if (SceneAudio.ok()) { const c = AUDIO.ctx.currentTime; AUDIO.osc(SceneAudio.dest(), 'sine', 110, 70, c, 0.3, F.stopped ? 0.05 : 0.09); AUDIO.nz(SceneAudio.dest(), c, 0.05, 0.05, 'lowpass', 600); } }
    for (let i = 0; i < F.wheels.length; i++) F.wheels[i].rotation.y += dt * (0.05 + (i % 3) * 0.04) * (i % 2 ? 1 : -1);
    // el reloj desnudo de la caja: cinco golpes por segundo hasta el papel de fumar
    if (!F.stopped) { F.balPh = (F.balPh || 0) + dt * Math.PI * 2 * 2.5 * (F.slow || 1); F.bal.rotation.y = Math.sin(F.balPh) * 2.2; if (w === 'room' && F.close && Math.floor(F.balPh / Math.PI) !== F._bt && SceneAudio.ok()) { F._bt = Math.floor(F.balPh / Math.PI); AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.008, 0.02 * (F.slow < 1 ? 1.5 : 1), 'bandpass', 4200, null, 8); } }
    // escalera: la luz que se cuela va con él
    if (w === 'stair' && S.walk) { F.stL.position.set(S.walk.p.x, S.walk.p.y + 3.2, S.walk.p.z); }
    // el operario se seca la frente y luego se va hacia cercanías, sin prisa
    if (F.op.g.visible && F.opGo) { const p = F.op.g.position, tx = 20.5, tz = -47; const d = Math.hypot(tx - p.x, tz - p.z); if (d > 0.2) { p.x += (tx - p.x) / d * dt * 1.25; p.z += (tz - p.z) / d * dt * 1.25; F.op.g.rotation.y = Math.atan2(tx - p.x, tz - p.z); F.op.arms[1].rotation.x = Math.sin(t * 6) * 0.4; } else F.op.g.visible = false; }
    // desde la ventanita: Montúfar sale, el operario corre por la vía, el magnesio
    if (F.partyT >= 0) {
      F.partyT += dt; const k = clamp(F.partyT / 16, 0, 1);
      for (const p of F.party) { p.g.position.z = p.g.userData.z0 + k * 28; const sw = Math.sin(t * 5 + p.g.userData.z0) * 0.35 * (k < 1 ? 1 : 0); p.arms[0].rotation.x = sw; p.arms[1].rotation.x = -sw; }
      F.magT = (F.magT || 0) - dt; if (F.magT < 0) { F.magT = 0.7 + Math.random() * 1.4; F.mag.intensity = 6; F.magB.position.set((Math.random() - 0.5) * 10, 2.4, -26 + k * 28 + Math.random() * 4); }
      F.mag.intensity = Math.max(0, F.mag.intensity - dt * 40); F.magB.visible = F.mag.intensity > 1; F.mag.position.copy(F.magB.position);
    }
    if (F.runT >= 0) {
      F.runT += dt; const r = F.runner, z = -40 + Math.min(F.runT, 7) * 5.2;
      if (!F.fell) { r.g.position.z = z; r.arms[0].rotation.x = Math.sin(t * 12) * 0.9; r.arms[1].rotation.x = -Math.sin(t * 12) * 0.9; r.g.rotation.y = 0; }
      F.chasers.forEach((c, i) => { if (!(i === 0 && F.runT > 5.4)) { c.g.position.z = -52 - i * 1.2 + Math.min(F.runT, 9) * 4.6; c.g.rotation.y = 0; } else { c.arms[1].rotation.x = -1.5; c.arms[0].rotation.x = -1.4; } });
      if (F.runT > 5.6 && !F.shot) { F.shot = true; AUDIO.play('rifle', null, 0.12); }
      if (F.runT > 6.6 && !F.fell) { F.fell = true; r.g.rotation.x = Math.PI / 2 - 0.1; r.g.position.y = 0.15; }
    }
    if (F.hammerT >= 0) { F.hammerT += dt; F.bigHammer.rotation.x = -clamp(F.hammerT / 4, 0, 1) * 0.9; }
    // el pasodoble de la banda (de lejos)
    if (F.band && SceneAudio.ok()) { F.bandT = (F.bandT || 0) - dt; if (F.bandT < 0) { F.bandI = ((F.bandI || 0) + 1) % 16; F.bandT = 0.32; const notes = [392, 440, 494, 523, 587, 523, 494, 440, 392, 392, 523, 494, 440, 392, 349, 392]; AUDIO.brass(SceneAudio.dest(), AUDIO.ctx.currentTime, notes[F.bandI] / 2, F.bandV || 0.012); if (F.bandI % 4 === 0) AUDIO.osc(SceneAudio.dest(), 'sine', 70, 50, AUDIO.ctx.currentTime, 0.2, (F.bandV || 0.012) * 2); } }
    if (F.shake > 0) { F.shake -= dt; S.roll = Math.sin(t * 40) * 0.02 * F.shake; Input.state.pitch += Math.sin(t * 33) * 0.002 * F.shake; } else if (F.shake !== undefined && F.shake <= 0 && S.roll) S.roll = damp(S.roll, 0, 6, dt);
  },
  dispose(S) { const F = S.set; if (!F) return; for (const t of F.tex) t.dispose(); if (F.whiteEl) F.whiteEl.remove(); Cap1Audio.market(false); S.set = null; },
};

(() => {
  const C = (S) => S.set, V = CampUtil.V, sit = CampUtil.sit.bind(CampUtil), head = campHead(CAMP_BY_ID['P1-M4']);
  const go = (where, fn) => Step.run((S) => { Cap4Set.light(S, where); S.where = where; fn(S); });
  const walk = (S, x, y, z, yaw, o) => CampUtil.walk(S, x, y, z, yaw, o);
  const face = (S, x, z, pitch) => { const y = CampUtil.yawTo(S.eye.x, S.eye.z, x, z); S.yaw = Input.state.yaw = y; if (!(S.walk && S.walk.on)) S.yawC = y; if (pitch != null) S.pitch = Input.state.pitch = pitch; };
  // el papel de fumar entre el volante y el puente
  const paperStep = {
    enter(S) { const F = C(S); F.tries = 0; F.slow = 1; S._q = []; S.fire = (s) => { const F = C(s); if (s.line || F.stopped) return; const open = Math.abs(Math.cos(F.balPh)) < (F.tries >= 3 ? 0.42 : 0.24); if (open) { F.stopped = true; F.paper.visible = true; F.slot.visible = false; SceneAudio.found(); } else { F.tries++; if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.04, 0.03, 'bandpass', 3000, null, 3); s._q.push({ text: F.tries === 1 ? { es: 'El papel tropezó con un brazo del volante. Hay que meterlo cuando el volante se para en lo alto de su vaivén, en ese instante en que no va ni viene.', en: 'The paper caught on an arm of the balance. It has to go in when the balance stops at the top of its swing, in that instant when it is neither coming nor going.' } : { es: 'Otra vez. Mantén Q: el tiempo se hace largo cuando miras así.', en: 'Again. Hold Q: time grows long when you look like that.' }, o: { cls: 'inner' } }); } };
      Scenes.setGoal(L({ es: 'Mantén <kbd>Q</kbd> para mirar despacio · <kbd>clic</kbd> / <kbd>E</kbd> cuando el volante se pare en lo alto', en: 'Hold <kbd>Q</kbd> to look slowly · <kbd>click</kbd> / <kbd>E</kbd> when the balance stops at the top' })); },
    tick(S) {
      const F = C(S); F.slow = 1 - 0.85 * S.look; F.slot.visible = !F.stopped && Math.abs(Math.cos(F.balPh)) < (F.tries >= 3 ? 0.42 : 0.24);
      if (S.line) return false;
      if (S._q.length) { const nx = S._q.shift(); Scenes.say(L(nx.text), nx.o); return false; }
      if (F.stopped) { S.fire = null; F.slow = 1; Scenes.setGoal(null); return true; }
      return false;
    } };
  const countStep = (n, gap, fn) => ({ enter(S) { C(S).cnt = 0; }, tick(S) { const F = C(S), k = Math.floor(S.stepT / gap); if (k > F.cnt && k <= n) { F.cnt = k; fn(S, k); Scenes.setGoal(`${k}`); } if (S.stepT > n * gap + gap) { Scenes.setGoal(null); return true; } return false; } });

  SCENES.cap4 = {
    setup(S) { Cap4Set.build(S); MODES.campaign.noAmbience = true; Ambience.stop(); Cap4Set.light(S, 'plaza'); sit(S, 0, 1.62, 34, 0, 0.45, 1.2); S.pitchMax = 0.9; },
    update(S, dt) { Cap4Set.update(S, dt); },
    teardown(S) { S.fire = null; SceneWalk.stop(S); S.walk = null; Cap4Set.dispose(S); },
    steps: [
      Step.card({ es: 'Parte I · Cuerda', en: 'Part I · Winding' }, { es: 'Cuarenta segundos', en: 'Forty Seconds' }, head),
      Step.run(() => Cap1Audio.market(true)),
      Step.fade(0, 1.6, false),
      SAY('El reloj de la Estación Central daba los cuartos con cuatro notas. Santiago las conocía desde niño: mi-do-re-sol, cuatro martillos de hierro sobre cuatro campanas de bronce, a cuarenta metros sobre la plaza.', 'The Central Station clock struck the quarters with four notes. Santiago had known them since he was a boy: E-C-D-G, four iron hammers on four bronze bells, forty metres above the square.'),
      Step.run(() => Cap4Set.quarters(0.4, true)),
      Step.wait(5.4),
      SAY('A las diez y quince de aquella mañana sonaron las cuatro notas. Y luego sonó una quinta.', 'At a quarter past ten that morning the four notes sounded. And then a fifth.'),
      SAY('No era una nota. Un golpe seco, metálico, muy corto, como si uno de los martillos, al volver a su sitio, hubiera rozado algo que no era bronce. Algo hueco. Algo de chapa. Nadie más lo oyó. Santiago lo supo porque nadie más levantó la cabeza.', 'It wasn’t a note. A dry, metallic knock, very short, as if one of the hammers, swinging back, had brushed something that wasn’t bronze. Something hollow. Something of sheet metal. Nobody else heard it. Santiago knew because nobody else looked up.'),
      Step.run((S) => walk(S, 0, 0, 34, 0)),
      Step.reach(23, 4, 3.2, 'Ve hacia la esquina de la plaza, hasta ver en escorzo la esfera este.', 'Walk to the corner of the square until you can see the east face at an angle.'),
      Step.run((S) => { SceneWalk.stop(S); const F = C(S); S.yawR = 1.6; face(S, 1.5, F.TZ, 0.6); }),
      Step.find([
        { pos: (S) => C(S).faces.s.mh.localToWorld(V(0, 1.4, 0.02)), r: 0.04, text: { es: 'La esfera sur: las diez y quince.', en: 'The south face: a quarter past ten.' } },
        { pos: (S) => C(S).faces.e.mh.localToWorld(V(0, 1.4, 0.02)), r: 0.04, text: [{ es: 'La esfera este: las diez y quince también. Pero no igual.', en: 'The east face: a quarter past ten as well. But not the same.' }, { es: 'Las cuatro esferas las mueve un solo mecanismo: son la misma aguja vista desde cuatro sitios. Y la minutera de la sur iba por detrás de la de la este. Cuarenta segundos. Quizá cuarenta y cinco. Algo estaba frenando la varilla sur.', en: 'All four faces are driven by one mechanism: they are the same hand seen from four places. And the south minute hand was behind the east one. Forty seconds. Maybe forty-five. Something was braking the south rod.', o: { cls: 'inner' } }] },
      ], 2, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: compara la minutera de las dos esferas · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: compare the minute hands of both faces · ${n}/${k}` })),
      SAY('Santiago bajó la vista. Miró la plaza. Se fijó en todo.', 'Santiago lowered his eyes. He looked at the square. He took in everything.'),
      Step.run((S) => { S.yawR = 2.6; face(S, 0, 0, -0.05); }),
      Step.find([
        { pos: (S) => V(3.2, 1.9, -13.6), r: 0.1, text: { es: 'Guardias de asalto, con cascos de acero y mosquetones, en cordón desde la puerta principal de la estación hasta el centro de la plaza.', en: 'Assault guards, with steel helmets and carbines, in a cordon from the station’s main door to the middle of the square.' } },
        { pos: (S) => C(S).flags[1].localToWorld(V(0, 0, 0)), r: 0.1, text: { es: 'Una tarima con banderas: la tricolor de Sanmarcial y otra negra y blanca con un águila de dos cabezas. Varden.', en: 'A platform with flags: the Sanmarcial tricolour and another, black and white, with a double-headed eagle. Varden.' } },
        { pos: (S) => V(-5.6, 1.4, 7), r: 0.12, text: { es: 'Una banda militar con los instrumentos brillando al sol. Fotógrafos de prensa con cámaras de fuelle.', en: 'A military band with its instruments gleaming in the sun. Press photographers with bellows cameras.' } },
        { pos: (S) => V(-28.6, 2.55, 24), r: 0.08, text: { es: 'Una pancarta mal escrita, sostenida por dos estudiantes: ¡EL METAL GRIS ES DEL PUEBLO! Y dos guardias que van hacia ellos.', en: 'A badly lettered banner held by two students: THE GREY METAL BELONGS TO THE PEOPLE! And two guards heading towards them.' } },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: la plaza · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the square · ${n}/${k}` })),
      SAY('Se acordó de la noticia del periódico del cuartel: Llega a la capital la delegación comercial del Imperio de Varden. El general Montúfar, ministro de Guerra, recibirá a los enviados en la Estación Central el sábado a las once.', 'He remembered the item in the barracks paper: The commercial delegation of the Varden Empire arrives in the capital. General Montúfar, Minister of War, will receive the envoys at Central Station on Saturday at eleven.', { cls: 'mem' }),
      SAY('A las once. Debajo del reloj.', 'At eleven. Under the clock.', { cls: 'inner' }),
      Step.run((S) => walk(S, S.eye.x, 0, S.eye.z, CampUtil.yawTo(S.eye.x, S.eye.z, 0, -30))),
      Step.reach(0, -40, 2.5, 'Entra en la estación.', 'Go into the station.'),
      go('hall', (S) => { Cap1Audio.market(true); }),
      SAY('El vestíbulo era una nave enorme de hierro y cristal, con el suelo de mármol blanco y negro y un techo abovedado por el que entraba la luz a chorros. En el centro, colgado de una viga, el reloj grande de doble esfera. Debajo del reloj estaba su padre.', 'The hall was a vast nave of iron and glass, with a black-and-white marble floor and a vaulted roof through which light poured in. In the middle, hanging from a girder, the great double-faced clock. Under the clock was his father.'),
      Step.reach(0, -48.6, 1.3, 'Ve con tu padre, debajo del reloj grande.', 'Go to your father, under the big clock.'),
      Step.run((S) => { SceneWalk.stop(S); S.yawR = 1.4; face(S, 0, -50.6, -0.05); }),
      SAY('Estaba de pie con su traje de los domingos, el gris de raya diplomática que solo se ponía para entierros y para gestiones, con el sombrero en la mano. Lo abrazó. Un abrazo raro: demasiado fuerte y demasiado corto, como si tuviera miedo de que alguien lo viera abrazarlo.', 'He was standing in his Sunday suit, the grey pinstripe he wore only for funerals and for business, hat in hand. He hugged him. A strange hug: too hard and too short, as if he were afraid someone would see him hugging him.'),
      Step.find([
        { pos: (S) => C(S).papa.head.localToWorld(V(0, 0.1, 0.12)), r: 0.08, text: { es: 'Sudaba. Llevaba allí mucho rato.', en: 'He was sweating. He had been there a long time.' } },
        { pos: (S) => C(S).papa.torso.localToWorld(V(0, 0.25, 0.16)), r: 0.1, text: { es: 'Estaba más delgado que en octubre. Mucho más. El traje le colgaba.', en: 'He was thinner than in October. Much thinner. The suit hung off him.' } },
        { pos: (S) => C(S).papa.head.localToWorld(V(0, -0.05, 0.13)), r: 0.07, text: { es: 'El bigote. No se lo tocaba. Todavía.', en: 'The moustache. He wasn’t touching it. Not yet.' } },
      ], 2, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: tu padre · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: your father · ${n}/${k}` })),
      SAY('—Estás muy flaco —dijo su padre. —Tú también. —Yo no. Es el traje. —Le pasó la mano por la mejilla, por donde aún tenía la sombra amarilla de un moratón de las duchas—. ¿Qué te ha pasado aquí?', '“You’re very thin,” said his father. “So are you.” “Not me. It’s the suit.” He ran his hand over his cheek, where the yellow shadow of a bruise from the showers still lingered. “What happened here?”'),
      SAY('—Me caí. —Mentiroso. —Igual que tú con lo de las gestiones en la Compañía.', '“I fell.” “Liar.” “Same as you with your business at the Company.”'),
      SAY('Vio que su padre tenía miedo. Que no sabía de qué tenía miedo. Que alguien le había dicho que estuviera aquí, debajo de este reloj, a esta hora, con su hijo, y que su padre había obedecido sin saber por qué, porque llevaba mucho tiempo obedeciendo a ese alguien sin saber por qué, y que eso lo estaba matando.', 'He saw that his father was afraid. That he didn’t know what he was afraid of. That someone had told him to be here, under this clock, at this hour, with his son, and that his father had obeyed without knowing why, because he had been obeying that someone for a long time without knowing why, and that it was killing him.', { cls: 'inner' }),
      SAY('—Papá. ¿Quién te ha dicho que vinieras? —Nadie. Yo... —Vámonos. Vámonos de aquí. Vamos a tomar un café fuera, al Iberia. Te invito a churros. Venga, Santiago, por favor...', '“Dad. Who told you to come?” “Nobody. I...” “Let’s go. Let’s get out of here. Let’s have a coffee outside, at the Iberia. Churros, my treat. Come on, Santiago, please...”'),
      Step.run((S) => { const F = C(S); F.op.g.visible = true; S.yawR = 2.4; face(S, 8, -69, 0.0); if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.12, 0.05, 'bandpass', 600, null, 2); }),
      SAY('Y entonces Santiago vio al operario. Salía de la puerta pequeña de hierro pintado de verde, junto a la consigna: TORRE DEL RELOJ · PROHIBIDO EL PASO. Mono azul de la Compañía, gorra con la insignia. Cerró con una llave que se guardó en el bolsillo. Se secó la frente con un pañuelo.', 'And then Santiago saw the workman. He was coming out of the small door of green-painted iron beside the left-luggage: CLOCK TOWER · NO ENTRY. Company blue overalls, cap with the badge. He locked it with a key he put in his pocket. He wiped his forehead with a handkerchief.'),
      Step.find([
        { pos: (S) => C(S).op.g.localToWorld(V(0.11, 0.55, 0.1)), r: 0.07, text: { es: 'El mono era nuevo. Demasiado nuevo. Todavía tenía las marcas de los pliegues de la tienda en las perneras. Ningún operario de la Compañía llevaba un mono sin una mancha de grasa.', en: 'The overalls were new. Too new. They still had the shop creases down the legs. No Company workman wore overalls without a grease stain.' } },
        { pos: (S) => C(S).op.g.localToWorld(V(-0.11, 0.05, 0.1)), r: 0.07, text: { es: 'Las botas no eran de la Compañía: marrones, de caña alta, con una costura doble en el empeine que se hacía en los talleres militares de Tierra Alta.', en: 'The boots weren’t Company issue: brown, high-legged, with a double seam on the instep of the kind made in the Tierra Alta military workshops.' } },
        { pos: (S) => C(S).op.torso.localToWorld(V(-0.2, 0.6, 0.1)), r: 0.07, text: { es: 'El hombro izquierdo caído, como queda el de alguien que ha llevado un peso colgado mucho rato y acaba de soltarlo.', en: 'His left shoulder sagging, the way it does on someone who has carried a hanging weight for a long time and has just put it down.' } },
        { pos: (S) => C(S).op.torso.localToWorld(V(-0.12, 0.35, 0.16)), r: 0.07, text: { es: 'Sobre la clavícula izquierda, una marca de roce en diagonal. La marca de una correa.', en: 'Over the left collarbone, a diagonal scuff. The mark of a strap.' } },
      ], 4, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: el operario · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the workman · ${n}/${k}` })),
      Step.run((S) => { C(S).opGo = true; }),
      SAY('Había subido a la torre con una bolsa pesada. Había bajado sin ella. Y a las diez y quince, el martillo de los cuartos había rozado algo de chapa.', 'He had gone up the tower with a heavy bag. He had come down without it. And at a quarter past ten, the quarter hammer had brushed against something of sheet metal.', { cls: 'inner' }),
      Step.gaze((S) => C(S).hc.position, 0.25, 0.6),
      SAY('—Santiago, ¿me oyes? ¿Qué te pasa? —Santiago miró el reloj del vestíbulo. Las diez y treinta y uno.', '“Santiago, can you hear me? What’s wrong?” Santiago looked at the hall clock. Ten thirty-one.'),
      SAY('Veintinueve minutos.', 'Twenty-nine minutes.', { cls: 'inner' }),
      Step.run((S) => walk(S, S.eye.x, 0, S.eye.z, CampUtil.yawTo(S.eye.x, S.eye.z, 3.6, -35.2))),
      Step.reach(3.0, -36.6, 1.3, 'Avisa al cabo de guardia de la puerta.', 'Warn the guard corporal at the door.'),
      Step.run((S) => { SceneWalk.stop(S); S.yawR = 1.6; const F = C(S); face(S, F.cabo.g.position.x, F.cabo.g.position.z, 0.08); }),
      SAY('—Cabo. Ese hombre. El del mono azul que va hacia los andenes de cercanías. Ha subido a la torre del reloj con una bolsa y ha bajado sin ella. No es de la Compañía. Hay que pararlo.', '“Corporal. That man. The one in blue overalls heading for the local platforms. He went up the clock tower with a bag and came down without it. He’s not from the Company. He has to be stopped.”'),
      SAY('El cabo lo miró de arriba abajo. Vio el uniforme de paseo que le quedaba grande en los hombros. La cara de niño. El moratón amarillo. —Lárgate, chaval. ¿Tú sabes quién viene hoy? Hay doscientos hombres en esta plaza. Si hubiera algo raro ya lo sabríamos. Lárgate antes de que te lleve al cuartelillo por alarmista.', 'The corporal looked him up and down. He saw the walking-out uniform too big in the shoulders. The boy’s face. The yellow bruise. “Get lost, kid. Do you know who’s coming today? There are two hundred men in this square. If anything were wrong we’d know. Get lost before I take you in for scaremongering.”'),
      Step.run((S) => { const F = C(S); F.papa.g.position.set(1.8, 0, -37.6); F.papa.g.rotation.y = CampUtil.yawTo(1.8, -37.6, S.eye.x, S.eye.z) + Math.PI; S.yawR = 2.6; face(S, 1.8, -37.6, -0.05); }),
      SAY('El hombre del mono azul había desaparecido entre la gente. Santiago miró la puerta verde. Miró a su padre, que lo había seguido, con el sombrero estrujado en las manos.', 'The man in blue overalls had vanished into the crowd. Santiago looked at the green door. He looked at his father, who had followed him, his hat crushed in his hands.'),
      Step.choice({ es: '¿Qué le pides?', en: 'What do you ask him?' }, [{ es: '—Papá. Necesito tus llaves. La maestra.', en: '“Dad. I need your keys. The master key.”' }, { es: '—Vete al Iberia. Ahora voy.', en: '“Go to the Iberia. I’ll be right there.”' }, { es: '—Ve a buscar a otro guardia.', en: '“Go and find another guard.”' }], 0,
        [{ es: '', en: '' }, { es: 'No había tiempo para mentiras. Y la puerta verde tenía cerradura de cuadradillo.', en: 'There was no time for lies. And the green door had a square-socket lock.' }, { es: 'Los guardias no iban a escuchar. Y la puerta verde tenía cerradura de cuadradillo.', en: 'The guards weren’t going to listen. And the green door had a square-socket lock.' }]),
      SAY('Todos los jefes de circulación llevaban una llave maestra de cuadradillo que abría todas las puertas de servicio de todas las estaciones de la red. Una llave que no se podía prestar, que se firmaba al recibirla y se firmaba al devolverla. Su padre la llevaba desde hacía veintiséis años en el bolsillo del chaleco, colgada de una cadena.', 'Every traffic controller carried a square-socket master key that opened every service door in every station on the network. A key that could not be lent, signed for on receipt and signed for on return. His father had carried it for twenty-six years in his waistcoat pocket, on a chain.'),
      SAY('—Papá, por favor. No tengo tiempo de explicártelo.', '“Dad, please. I don’t have time to explain.”'),
      SAY('Y su padre, que no sabía leer a nadie, que se tocaba el bigote cuando mentía y se lo sabía todo Corcovado, lo miró y lo leyó. Lo leyó entero. Se sacó la cadena del chaleco. Desenganchó la llave. Se la puso en la mano. —Ten cuidado. Fue lo único que dijo.', 'And his father, who couldn’t read anyone, who touched his moustache when he lied and all Corcovado knew it, looked at him and read him. Read him whole. He took the chain from his waistcoat. Unhooked the key. Put it in his hand. “Be careful.” It was all he said.'),
      Step.run((S) => walk(S, S.eye.x, 0, S.eye.z, CampUtil.yawTo(S.eye.x, S.eye.z, 8, -69.9))),
      Step.uses([{ id: 'puerta', d: 2.2, r: 0.35, pos: (S) => C(S).gdoor.position, label: { es: 'Abrir con la llave de cuadradillo', en: 'Open with the square-socket key' }, use(S) { if (SceneAudio.ok()) { const t = AUDIO.ctx.currentTime; AUDIO.nz(SceneAudio.dest(), t, 0.05, 0.08, 'bandpass', 1800, null, 4); AUDIO.nz(SceneAudio.dest(), t + 0.2, 0.08, 0.06, 'bandpass', 900, null, 3); } } }], 1,
        () => L({ es: 'La puerta verde de la torre.', en: 'The green tower door.' })),
      Step.fade(1, 0.8),
      // ---- la escalera de caracol ----
      go('stair', (S) => { Cap1Audio.market(false); const F = C(S); walk(S, F.SX + 0.88, 0, 0.0, Math.PI, { floor: F.helix, speed: 2.3 }); }),
      Step.fade(0, 1.4, false),
      SAY('Oscuridad. Olor a polvo, a aceite viejo, a palomas. Una escalera de caracol de hierro que subía en espiral alrededor de un hueco central. Una bombilla desnuda, apagada. Empezó a subir a oscuras, con una mano en la barandilla. Contó los escalones. No pudo evitarlo.', 'Darkness. A smell of dust, old oil, pigeons. An iron spiral staircase climbing round a central well. A bare bulb, off. He began to climb in the dark, one hand on the rail. He counted the steps. He couldn’t help it.'),
      { kind: 'reach', at: { x: 120 + Math.cos(37 * 0.5605) * 0.88, z: Math.sin(37 * 0.5605) * 0.88, yMin: 37 * 38 / 142 }, enter(S) {}, tick(S) { const F = C(S), W = S.walk; if (!W) return true; const n = Math.round(W.p.y / F.hs); if (n !== F._st) { F._st = n; Scenes.setGoal(L({ es: `Sube · escalón ${n}`, en: `Climb · step ${n}` })); } return n >= 37; } },
      Step.run((S) => { SceneAudio.thud(0.4); }),
      SAY('En el escalón treinta y ocho tropezó con algo blando.', 'On the thirty-eighth step he stumbled over something soft.'),
      Step.uses([{ id: 'viejo', d: 2.0, r: 0.5, pos: (S) => C(S).oldman, label: { es: 'Agacharse', en: 'Crouch down' }, use(S) {},
        text: [{ es: 'Era un hombre. Tirado de lado sobre los escalones, en una postura imposible. Una chaqueta de lana. Una barba de viejo. Algo húmedo y tibio en el pelo, detrás de la oreja. Respiraba: un ruido pequeño, como de burbujas.', en: 'It was a man. Lying on his side across the steps, at an impossible angle. A wool jacket. An old man’s beard. Something wet and warm in his hair, behind the ear. He was breathing: a small sound, like bubbles.' },
          { es: 'Un llavero vacío, con la argolla abierta, y un reloj de bolsillo. El relojero de la estación, el encargado de la torre. El del mono nuevo le había quitado las llaves después de partirle la cabeza.', en: 'An empty key ring, its loop open, and a pocket watch. The station clockkeeper, the man in charge of the tower. The one in new overalls had taken his keys after splitting his head.' },
          { es: '—Aguante. Ahora vuelvo. Aguante.', en: '“Hold on. I’ll be back. Hold on.”' }] }], 1, () => L({ es: 'Algo en el escalón treinta y ocho.', en: 'Something on step thirty-eight.' })),
      { kind: 'reach', at: { x: 120 + Math.cos(141 * 0.5605) * 0.88, z: Math.sin(141 * 0.5605) * 0.88, yMin: 37.7 }, tick(S) { const F = C(S), W = S.walk; if (!W) return true; const n = Math.round(W.p.y / F.hs); if (n !== F._st) { F._st = n; Scenes.setGoal(L({ es: `Sube · escalón ${n}`, en: `Climb · step ${n}` })); } if (n >= 141) { Scenes.setGoal(null); return true; } return false; } },
      SAY('Ciento cuarenta y dos escalones. Una trampilla de madera. La empujó con la cabeza y los hombros.', 'A hundred and forty-two steps. A wooden trapdoor. He pushed it up with his head and shoulders.'),
      Step.fade(1, 0.6),
      // ---- la sala de máquinas ----
      go('room', (S) => { const F = C(S); walk(S, -1.6, F.RY, -34.6, CampUtil.yawTo(-1.6, -34.6, 0, F.TZ)); }),
      Step.fade(0, 1.2, false),
      SAY('Una sala cuadrada de ladrillo con cuatro grandes ventanales redondos: las cuatro esferas vistas desde dentro, vidrio opalino, los números al revés y las sombras de las agujas moviéndose despacio sobre el cristal. En el centro, el mecanismo: una jaula de hierro verde del tamaño de un piano de cola, ruedas de bronce brillando de aceite. Un péndulo de cuatro metros. TOC. TOC. TOC.', 'A square brick room with four great round windows: the four faces seen from inside, opal glass, numbers reversed, the shadows of the hands moving slowly across the glass. In the middle, the mechanism: a cage of green iron the size of a grand piano, bronze wheels gleaming with oil. A four-metre pendulum. TOCK. TOCK. TOCK.'),
      Step.uses([{ id: 'caja', d: 2.0, r: 0.35, pos: (S) => C(S).box.localToWorld(V(0, 0.1, 0)), label: { es: 'Arrodillarse delante de la caja', en: 'Kneel in front of the box' }, use(S) { const F = C(S), p = F.box.localToWorld(V(0, 0, 0.62)); sit(S, p.x, F.RY + 0.95, p.z, Math.PI, -0.62, 1.0); S.pitchMin = -1.3; } }], 1,
        () => L({ es: 'Busca lo que frena la varilla sur.', en: 'Find what is braking the south rod.' })),
      SAY('Una caja de chapa gris, como una caja de herramientas grande, atada con alambre a una viga de la plataforma, justo debajo del tren de los cuartos, tan cerca de la varilla sur que la varilla, al girar, rozaba con su junta contra una esquina y la frenaba un poquito. Cuarenta segundos.', 'A grey sheet-metal box, like a large toolbox, wired to a girder of the platform, right under the quarter train, so close to the south rod that the rod, as it turned, rubbed its joint against one corner and braked a little. Forty seconds.'),
      SAY('Por una rendija de la tapa se oía un tictac. No el tictac grave del péndulo. Otro. Más pequeño. Más rápido. Un tictac de reloj de bolsillo, nervioso, de cinco golpes por segundo.', 'Through a crack in the lid came a ticking. Not the deep tick of the pendulum. Another. Smaller. Faster. A pocket-watch tick, nervous, five beats a second.'),
      Step.run((S) => { C(S).close = true; }),
      Step.uses([0, 1].map((i) => ({ id: 'ala' + i, d: 1.2, r: 0.25, pos: (S) => C(S).wings[i].localToWorld(V(0, 0.01, 0)), label: { es: 'Desenroscar el tornillo de mariposa', en: 'Unscrew the wing nut' }, use(S) { const w = C(S).wings[i]; w.rotation.y += 6; w.position.y += 0.02; Cap1Audio.wind(5, 0.8); } })), 2,
        (n, k) => L({ es: `La tapa: dos tornillos de mariposa · ${n}/${k}`, en: `The lid: two wing nuts · ${n}/${k}` })),
      Step.run((S) => { const F = C(S); for (const w of F.wings) w.visible = false; }),
      SAY('Las manos no le temblaban. Le sorprendió que no le temblaran. Levantó la tapa muy despacio, un milímetro, dos, mirando por la rendija por si había un cable pegado a la tapa. No lo había.', 'His hands weren’t shaking. It surprised him that they weren’t. He lifted the lid very slowly, a millimetre, two, looking through the crack for a wire attached to the lid. There wasn’t one.'),
      Step.run((S) => { C(S).lid.rotation.x = -1.9; }),
      Step.find([
        { pos: (S) => C(S).box.localToWorld(V(-0.1, 0.08, 0)), r: 0.08, text: { es: 'Doce cartuchos de papel encerado, apretados en dos filas, con un olor dulzón que le hizo lagrimear.', en: 'Twelve waxed-paper cartridges packed in two rows, with a sweetish smell that made his eyes water.' } },
        { pos: (S) => C(S).plate.localToWorld(V(0.055, 0.016, -0.03)), r: 0.06, text: { es: 'Una pila seca, un contacto de resorte y un reloj de bolsillo sin caja, solo el mecanismo desnudo, atornillado a una placa de baquelita.', en: 'A dry battery, a spring contact and a pocket watch with no case, just the bare movement, screwed to a Bakelite plate.' } },
        { pos: (S) => C(S).arm.localToWorld(V(0.03, 0, 0)), r: 0.06, text: { es: 'En lugar de la aguja de las horas, un brazo de latón largo y fino que giraba muy despacio hacia un contacto de cobre. Estaba a unos cuatro milímetros.', en: 'In place of the hour hand, a long thin brass arm turning very slowly towards a copper contact. It was about four millimetres away.' } },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: la caja · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the box · ${n}/${k}` })),
      Step.choice({ es: 'El eje de las horas da una vuelta cada doce horas. Brazo de tres centímetros y medio; cuatro milímetros en la punta. ¿Cuánto falta?', en: 'The hour arbor turns once every twelve hours. A three-and-a-half-centimetre arm; four millimetres at the tip. How long is left?' },
        [{ es: 'Unos cuatro minutos.', en: 'About four minutes.' }, { es: 'Algo menos de diecisiete minutos. Las once en punto.', en: 'A little under seventeen minutes. Eleven o’clock exactly.' }, { es: 'Más de una hora.', en: 'More than an hour.' }], 1,
        [{ es: 'Demasiado poco. Doce horas son 720 minutos para una vuelta entera. Haz la cuenta otra vez.', en: 'Too little. Twelve hours is 720 minutes for a full turn. Do the sum again.' }, { es: '', en: '' }, { es: 'Demasiado. Cuatro milímetros en un círculo de veintidós centímetros. Otra vez.', en: 'Too much. Four millimetres on a twenty-two-centimetre circle. Again.' }]),
      SAY('Las once en punto. La hora exacta a la que el general Montúfar estaría en la tarima, debajo de la esfera sur, estrechando la mano a los vardeneses. La hora exacta a la que la campana grande daría la primera campanada.', 'Eleven o’clock exactly. The exact time General Montúfar would be on the platform, under the south face, shaking hands with the Vardenese. The exact time the great bell would strike the first stroke.'),
      Step.run((S) => { const F = C(S); S.eye.copy(F.plate.localToWorld(V(-0.02, 0.24, 0.17))); S.yawC = S.yaw = Input.state.yaw = Math.PI; S.pitch = Input.state.pitch = -1.0; S.yawR = 0.7; S.pitchMin = -1.4; }),
      SAY('Y entonces, porque lo miraba todo, porque no podía dejar de mirarlo todo, miró el mecanismo del reloj.', 'And then, because he looked at everything, because he couldn’t stop looking at everything, he looked at the watch movement.'),
      Step.find([
        { pos: (S) => C(S).plate.localToWorld(V(-0.03, 0.012, 0)), r: 0.07, text: { es: 'Un calibre suizo corriente, de los años diez, de puente de tres cuartos. Pero alguien lo había rehecho a mano. Las ruedas repulidas con ese brillo apagado que deja la piedra de Arkansas y que ninguna máquina deja.', en: 'An ordinary Swiss calibre from the teens, three-quarter plate. But someone had rebuilt it by hand. The wheels re-polished with that soft, dull gleam an Arkansas stone leaves and no machine does.' } },
        { pos: (S) => C(S).bal.localToWorld(V(0.02, 0, 0)), r: 0.06, text: { es: 'El volante era de otro reloj, mejor, más fino, compensado, con tornillos de oro.', en: 'The balance came from another watch, a better one, finer, compensated, with gold screws.' } },
        { pos: (S) => C(S).blueScrew.localToWorld(V(0, 0, 0)), r: 0.05, text: [{ es: 'El puente del volante estaba sujeto por un tornillo cuya cabeza no era plateada como las demás. Era azul. Un azul profundo, eléctrico, como el ala de un escarabajo.', en: 'The balance bridge was held by a screw whose head was not silver like the others. It was blue. A deep electric blue, like a beetle’s wing.' }, { es: 'A ella le gustaba poner siempre un tornillo azul en algún sitio de cada reloj que arreglaba, uno solo, donde nadie lo viera. Es mi firma, Santi. Cada relojero tiene la suya. Esta es la mía.', en: 'She always liked to put one blue screw somewhere in every watch she mended, just one, where nobody would see it. It’s my signature, Santi. Every watchmaker has one. This is mine.', o: { cls: 'mem' } }] },
      ], 3, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: el mecanismo · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: the movement · ${n}/${k}` })),
      SAY('Había más. Lo sabía antes de mirarlo.', 'There was more. He knew it before he looked.', { cls: 'inner' }),
      Step.run((S) => { const F = C(S); S.eye.copy(F.bridge.localToWorld(V(0, 0.09, 0.02))); S.pitch = Input.state.pitch = -1.25; }),
      Step.find([{ pos: (S) => C(S).violet.getWorldPosition(V(0, 0, 0)), r: 0.08, text: { es: 'Grabada con un buril de punta de diamante, tan pequeña que solo se podía ver con lupa, tan pequeña que él la vio sin lupa porque sabía que estaba allí, había una flor. Una violeta. Cinco pétalos. Un tallo curvo.', en: 'Engraved with a diamond-pointed burin, so small it could only be seen with a loupe, so small he saw it without one because he knew it was there, there was a flower. A violet. Five petals. A curved stem.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: el puente del volante.', en: 'Hold <kbd>Q</kbd>: the balance bridge.' })),
      SAY('La misma violeta que había pintada, borrosa, en la esfera del reloj alemán de la cocina de su casa. La misma que su madre dibujaba en el margen de las cartas.', 'The same violet painted, faded, on the face of the German clock in the kitchen at home. The same one his mother drew in the margins of her letters.', { cls: 'mem' }),
      Step.run((S) => { const F = C(S); F.whiteEl.style.opacity = 0.92; F.band = true; F.bandV = 0.006; }),
      Step.wait(2.2),
      SAY('Por primera vez en su vida, la cabeza se le quedó completamente en blanco, como una esfera sin números.', 'For the first time in his life, his head went completely blank, like a dial with no numbers.', { cls: 'inner' }),
      SAY('La niña de los relojes. Cajitas así. Muy pesadas para lo pequeñas que eran. Quiero que tú los veas venir a todos.', 'The watch girl. Little boxes like this. Very heavy for how small they were. I want you to see them all coming.', { cls: 'mem' }),
      Step.run((S) => { const F = C(S); F.whiteEl.style.opacity = 0; if (SceneAudio.ok()) { const c = AUDIO.ctx.currentTime; AUDIO.osc(SceneAudio.dest(), 'sine', 110, 60, c, 0.5, 0.2); AUDIO.nz(SceneAudio.dest(), c, 0.1, 0.12, 'lowpass', 500); } }),
      SAY('El péndulo grande dio un golpe. TOC. Más fuerte que los otros. Y algo dentro de su cabeza se puso en marcha otra vez con un chasquido, como un volante parado al que se le quita el papel de fumar.', 'The great pendulum struck. TOCK. Louder than the others. And something in his head started up again with a click, like a stopped balance when the cigarette paper is taken out.'),
      SAY('El papel de fumar. Lo llevaba siempre, aunque no fumaba: era la mejor herramienta del mundo para coger muelles espirales del suelo. Arrancó una hoja. La dobló en dos. La humedeció con la punta de la lengua para que no volara.', 'The cigarette paper. He always carried it, though he didn’t smoke: it was the best tool in the world for picking hairsprings up off the floor. He tore off a leaf. Folded it in two. Wet it with the tip of his tongue so it wouldn’t fly away.'),
      Step.run((S) => { const F = C(S); S.eye.copy(F.plate.localToWorld(V(-0.055, 0.15, 0.1))); S.pitch = Input.state.pitch = -1.15; S.yaw = Input.state.yaw = Math.PI; }),
      paperStep,
      SAY('El volante se paró. El tictac nervioso se paró. El brazo de latón se quedó quieto a algo menos de tres milímetros del contacto.', 'The balance stopped. The nervous ticking stopped. The brass arm stood still a little under three millimetres from the contact.'),
      SAY('Soltó el aire. No sabía cuánto rato llevaba sin respirar.', 'He let out his breath. He didn’t know how long he had gone without breathing.'),
      SAY('Lo había hecho su padre. Lo que lo salvaba todo era lo que su padre había hecho una noche de octubre a las doce menos dos para que fuera hoy un ratito más.', 'His father had done it. What saved everything was what his father had done one October night at two minutes to twelve so that it would be today a little while longer.', { cls: 'inner' }),
      Step.run((S) => { const F = C(S); S.eye.copy(F.box.localToWorld(V(0, 0.45, 0.45))); S.pitch = Input.state.pitch = -0.75; S.yawC = S.yaw = Input.state.yaw = Math.PI; S.yawR = 0.9; }),
      SAY('Un volante parado con papel puede volver a arrancar si algo vibra. Si el martillo de la campana grande, al dar las once, sacude la viga. Había que cortar un cable. Quien había montado aquello sabía de relojes.', 'A balance stopped with paper can start again if something vibrates. If the great bell’s hammer shakes the girder when it strikes eleven. A wire had to be cut. Whoever had put this together knew about clocks.'),
      Step.find([
        { pos: (S) => C(S).box.localToWorld(V(0.16, 0.15, -0.07)), r: 0.06, text: { es: 'El rojo, el que todo el mundo cortaría primero porque el rojo es el que da miedo, no iba directo a la pila. Daba una vuelta por debajo de la placa y tocaba, oculto, un contacto de muelle que se cerraría si el cable se aflojaba. Si se cortaba. Una trampa.', en: 'The red one, the one everyone would cut first because red is the frightening one, didn’t go straight to the battery. It looped under the plate and touched, hidden, a spring contact that would close if the wire went slack. If it were cut. A trap.' } },
        { pos: (S) => C(S).box.localToWorld(V(-0.08, 0.18, 0.05)), r: 0.06, text: [{ es: 'El negro pasaba por el pilar izquierdo del puente.', en: 'The black one ran past the left pillar of the bridge.' }, { es: 'Su madre pasaba siempre el positivo por el pilar izquierdo. Siempre. Decía que así no se cruzaba con el volante.', en: 'His mother always ran the positive past the left pillar. Always. She said that way it never crossed the balance.', o: { cls: 'mem' } }] },
      ], 2, (n, k) => L({ es: `Mantén <kbd>Q</kbd>: sigue los cables · ${n}/${k}`, en: `Hold <kbd>Q</kbd>: follow the wires · ${n}/${k}` })),
      Step.choice({ es: 'La navaja de su abuelo Lazcano, la hoja pequeña.', en: 'His grandfather Lazcano’s penknife, the small blade.' }, [{ es: 'Cortar el cable rojo.', en: 'Cut the red wire.' }, { es: 'Cortar el cable negro.', en: 'Cut the black wire.' }], 1,
        [{ es: 'No. El rojo da una vuelta. Es lo que quiere quien lo montó.', en: 'No. The red one loops round. That’s exactly what whoever built it wants.' }, { es: '', en: '' }]),
      SAY('Cerró los ojos un segundo. Ábrelos. ¿Qué cambió?', 'He shut his eyes for a second. Open them. What changed?', { cls: 'mem' }),
      Step.run((S) => { const F = C(S); F.wb.visible = false; if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.03, 0.05, 'bandpass', 3800, null, 5); }),
      Step.wait(1.6),
      SAY('Cortó. No pasó nada. Abajo, en la plaza, la banda militar terminó el pasodoble y empezó otro.', 'He cut. Nothing happened. Down in the square, the military band finished the paso doble and began another.'),
      Step.run((S) => { const F = C(S); S.eye.copy(F.plate.localToWorld(V(-0.02, 0.24, 0.17))); S.pitch = Input.state.pitch = -1.0; S.yaw = Input.state.yaw = Math.PI; }),
      Step.uses([{ id: 'puente', d: 1.0, r: 0.3, pos: (S) => C(S).bridge.getWorldPosition(V(0, 0, 0)), label: { es: 'Sacar el puente del volante', en: 'Take out the balance bridge' }, use(S) { const F = C(S); F.bridge.visible = false; F.bal.visible = false; F.paper.visible = false; Cap1Audio.wind(4, 0.6); try { const d = Camp.data(); if (!d.notebook.includes('obj:puente_volante')) { d.notebook.push('obj:puente_volante'); Camp.save(); } } catch (e) { } },
        text: [{ es: 'Desenroscó los dos tornillos. El de cabeza plateada. El de cabeza azul. Sacó el puente con su violeta y el volante con sus tornillitos de oro y el papel de fumar todavía metido entre los dos. Los envolvió en su pañuelo y se los guardó en el bolsillo interior de la guerrera, al lado del sobre amarillo del veintiuno de septiembre.', en: 'He unscrewed the two screws. The silver-headed one. The blue-headed one. He took out the bridge with its violet and the balance with its little gold screws and the cigarette paper still caught between them. He wrapped them in his handkerchief and put them in the inside pocket of his tunic, next to the yellow envelope of the twenty-first of September.' },
          { es: 'No quería que nadie más viera la violeta.', en: 'He didn’t want anyone else to see the violet.', o: { cls: 'inner' } }] }], 1, () => L({ es: 'El puente del volante, con su violeta.', en: 'The balance bridge, with its violet.' })),
      Step.run((S) => { const F = C(S); C(S).close = false; walk(S, 0.9, F.RY, -31.4, CampUtil.yawTo(0.9, -31.4, 1.6, -30.6)); }),
      Step.uses([{ id: 'ventanita', d: 1.8, r: 0.4, pos: (S) => C(S).inspect.position, label: { es: 'Abrir la ventanita de inspección de la esfera sur', en: 'Open the inspection hatch in the south face' }, use(S) { if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 0.1, 0.05, 'bandpass', 1400, null, 3); } }], 1,
        () => L({ es: 'La esfera sur.', en: 'The south face.' })),
      go('window', (S) => { const F = C(S); sit(S, 1.6, F.TY - 1.5, -29.6, Math.PI, -0.75, 1.7); S.pitchMin = -1.35; F.partyT = 0; F.band = true; F.bandV = 0.014; Cap1Audio.market(true); for (const p of F.party) p.g.visible = true; }),
      SAY('Entró el aire frío de febrero, el ruido, la música, la luz. Cuarenta metros más abajo, la plaza. Y en la puerta principal, saliendo en ese momento, el general Eusebio Montúfar, grueso y bajo, con el bigote blanco y el pecho cubierto de medallas, y detrás tres hombres altos y rubios con uniformes grises y gorras de plato con el águila de dos cabezas.', 'In came the cold February air, the noise, the music, the light. Forty metres below, the square. And from the main door, coming out just then, General Eusebio Montúfar, stout and short, with a white moustache and his chest covered in medals, and behind him three tall fair men in grey uniforms and peaked caps with the double-headed eagle.'),
      SAY('Iban hacia la tarima. Los fogonazos del magnesio estallaban blancos uno detrás de otro. Debajo de él. Exactamente debajo de él. A la sombra de la esfera sur.', 'They were heading for the platform. The magnesium flashes burst white one after another. Below him. Directly below him. In the shadow of the south face.'),
      Step.run((S) => { const F = C(S); F.runT = 0; F.runner.g.visible = true; for (const c of F.chasers) c.g.visible = true; S.yawR = 2.4; face(S, 31, -20, -0.7); }),
      SAY('A la izquierda, en los andenes de cercanías, había un revuelo. Un hombre con un mono azul, sin gorra, saltando a la vía. Tres guardias detrás, uno de ellos el cabo de la barba de dos días. Alguien, al fin, le había hecho caso.', 'To the left, on the local platforms, there was a commotion. A man in blue overalls, capless, jumping down onto the track. Three guards behind him, one of them the corporal with two days’ stubble. Someone, at last, had listened.'),
      Step.wait(4.5),
      SAY('Uno de los guardias se paró, se echó el mosquetón a la cara y disparó. El tiro sonó pequeño desde allí arriba. Un chasquido. El hombre del mono azul dio un traspié, siguió corriendo dos pasos y cayó de bruces sobre las traviesas. No se levantó. En la tarima, nadie se enteró. La banda tocaba.', 'One of the guards stopped, raised his carbine and fired. The shot sounded small from up there. A crack. The man in blue overalls stumbled, ran on two steps and fell face down across the sleepers. He didn’t get up. On the platform, nobody noticed. The band played.'),
      Step.run((S) => { face(S, -33, 33, -0.6); }),
      SAY('Y entonces, en el otro extremo de la plaza, en la esquina de la avenida de la Independencia, junto a la parada de los coches de punto, vio un coche negro. Un Packard. Con chófer. Con las cortinillas de atrás corridas.', 'And then, at the far end of the square, on the corner of the Avenida de la Independencia, by the cab rank, he saw a black car. A Packard. With a chauffeur. With the rear blinds drawn.'),
      Step.run((S) => { const F = C(S); F.finger.visible = true; F.ring.visible = true; F.curtain.position.z = 1.05; }),
      Step.find([{ pos: (S) => C(S).finger.getWorldPosition(V(0, 0, 0)), r: 0.05, text: { es: 'La cortinilla de la ventanilla derecha se movió. Un dedo la apartó un centímetro, desde dentro. No podía ver la cara a esa distancia. Ni siquiera él. Pero vio el dedo. Y vio, aunque no podía verlo, que el dedo llevaba un anillo de sello en el meñique.', en: 'The blind on the right-hand window moved. A finger drew it aside a centimetre, from inside. He couldn’t see the face at that distance. Not even he could. But he saw the finger. And he saw, though he couldn’t see it, that the finger wore a signet ring on the little finger.' } }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: el Packard.', en: 'Hold <kbd>Q</kbd>: the Packard.' })),
      Step.run((S) => { const F = C(S); F.finger.visible = false; F.ring.visible = false; F.curtain.position.z = 0.95; F.hammerT = 0; if (SceneAudio.ok()) AUDIO.nz(SceneAudio.dest(), AUDIO.ctx.currentTime, 2.5, 0.03, 'bandpass', 300, 600, 2); }),
      SAY('La cortinilla volvió a su sitio. Encima de su cabeza, entre las vigas, el martillo de la campana grande empezó a levantarse, tirado por su cable, despacio, con un crujido de hierro. Se apartó de la ventanita. Se tapó los oídos.', 'The blind fell back into place. Above his head, among the girders, the great bell’s hammer began to rise, drawn up by its cable, slowly, with a creak of iron. He stepped back from the hatch. He covered his ears.'),
      go('room', (S) => { const F = C(S); F.band = false; sit(S, 0.6, F.RY + 0.9, -31.6, Math.PI * 0.85, 0.3, 1.2); F.shake = 0; F.clock = 11 * 3600 - 2; }),
      countStep(11, 2.4, (S, k) => { const F = C(S); CampUtil.bellStrike(98, 0.16); F.shake = 1.6; F.bigHammer.rotation.x = -0.9 + 0.5; setTimeout(() => { if (Scenes.S) F.bigHammer.rotation.x = -0.9; }, 200); }),
      SAY('Once. Las contó todas, una por una, con las manos en los oídos y los ojos cerrados, de rodillas en el suelo de la sala de máquinas, temblando ahora sí, temblando entero, de los pies a la cabeza, como no había temblado en su vida.', 'Eleven. He counted them all, one by one, hands over his ears and eyes shut, on his knees on the floor of the machine room, shaking now, shaking all over, from head to foot, as he had never shaken in his life.'),
      SAY('Abajo, el general Montúfar estrechaba la mano del jefe de la delegación vardenesa bajo los fogonazos del magnesio, sonriendo. La foto salió al día siguiente en la portada de todos los periódicos, y en ninguna se veía, en lo alto de la torre, en la esfera sur, una ventanita de inspección abierta.', 'Below, General Montúfar was shaking hands with the head of the Vardenese delegation under the magnesium flashes, smiling. The photo was on the front page of every paper the next day, and in none of them could you see, high on the tower, in the south face, an open inspection hatch.'),
      Step.fade(1, 1.6),
      // ---- el vestíbulo, las once y veinte ----
      Step.card(null, null, { es: 'Vestíbulo de la Estación Central · 11:20', en: 'Central Station hall · 11:20' }, 3.0),
      go('hall', (S) => { const F = C(S); F.hallTime = 11 * 60 + 20; F.partyT = -1; F.runT = -1; F.papa.g.position.set(7.2, 0, -66.4); F.papa.g.rotation.y = Math.PI; F.gab.g.visible = true; F.gab.g.position.set(9.3, 0, -66.6); F.gab.g.rotation.y = -Math.PI / 2 - 0.4; sit(S, 8, 1.62, -68.7, Math.PI, -0.05, 1.6); for (const g of [F.cabo]) g.g.visible = false; }),
      Step.fade(0, 1.4, false),
      SAY('Lo sacaron de la torre a las once y veinte. Tres guardias de asalto, un teniente con la pistola desenfundada, dos camilleros para el relojero de la estación, que seguía vivo en el escalón treinta y ocho, y luego un hombre de paisano con gabardina gris que les enseñó a todos una tarjeta que hizo que el teniente se cuadrase.', 'They brought him out of the tower at twenty past eleven. Three assault guards, a lieutenant with his pistol drawn, two stretcher-bearers for the station clockkeeper, still alive on step thirty-eight, and then a man in plain clothes and a grey raincoat who showed them all a card that made the lieutenant stand to attention.'),
      SAY('Su padre estaba junto a la puerta verde, rodeado de guardias que no le dejaban acercarse. Cuando lo vio salir apartó a uno de un empujón, que era algo que no había hecho en su vida, y lo abrazó. Esta vez no fue un abrazo corto. Lo abrazó como si se estuviera ahogando.', 'His father was by the green door, surrounded by guards who wouldn’t let him near. When he saw him come out he shoved one aside, something he had never done in his life, and hugged him. This time it wasn’t a short hug. He held him as if he were drowning.'),
      SAY('—Perdóname. Perdóname, perdóname, hijo, perdóname.', '“Forgive me. Forgive me, forgive me, son, forgive me.”'),
      SAY('—¿De qué, papá? No has hecho nada. Me diste la llave. Si no me hubieras dado la llave...', '“For what, Dad? You haven’t done anything. You gave me the key. If you hadn’t given me the key...”'),
      SAY('—Señores —dijo el hombre de la gabardina gris, con una mano educada y firme en el hombro de cada uno—. Hay un coche esperando.', '“Gentlemen,” said the man in the grey raincoat, an educated, firm hand on each one’s shoulder. “There is a car waiting.”'),
      Step.uses([{ id: 'llave', d: 2.2, r: 0.4, pos: (S) => C(S).papa.torso.localToWorld(V(0, 0.2, 0.2)), label: { es: 'Devolverle la llave maestra', en: 'Give him back the master key' }, use(S) {}, text: { es: 'Le devolvió la llave de cuadradillo, con su cadena. Su padre la cogió sin mirarla. Lo miraba a él. Tenía la cara deshecha.', en: 'He gave back the square-socket key, with its chain. His father took it without looking at it. He was looking at him. His face was in pieces.' } }], 1,
        () => L({ es: 'La llave de tu padre.', en: 'Your father’s key.' })),
      Step.find([{ pos: (S) => C(S).papa.head.localToWorld(V(0, 0.02, 0.12)), r: 0.08, text: [{ es: 'Intentó leerla una vez más, y esta vez lo leyó todo, todo de golpe, como se ve el truco de un problema bonito en un examen, y no quiso verlo, y lo vio igual.', en: 'He tried to read it once more, and this time he read it all, all at once, the way you see the trick of a neat problem in an exam, and he didn’t want to see it, and he saw it anyway.' }, { es: 'Su padre no le estaba pidiendo perdón por algo que había pasado. Le estaba pidiendo perdón por algo que iba a pasar.', en: 'His father wasn’t asking forgiveness for something that had happened. He was asking forgiveness for something that was going to happen.', o: { cls: 'inner' } }] }], 1,
        () => L({ es: 'Mantén <kbd>Q</kbd>: la cara de tu padre.', en: 'Hold <kbd>Q</kbd>: your father’s face.' })),
      Step.fade(1, 1.2),
      go('plaza', (S) => { const F = C(S); F.hallTime = 11 * 60 + 23; F.clock = 11 * 3600 + 23 * 60; F.band = false; F.pack.rotation.y = Math.PI * 0.2; F.packDoor.rotation.y = 1.2; F.packDoor.position.x = 1.25; for (const p of F.party) p.g.visible = false; walk(S, 0, 0, -26, CampUtil.yawTo(0, -26, -33, 33)); }),
      Step.fade(0, 1.2, false),
      SAY('En la plaza la banda había dejado de tocar y los guardias desmontaban el cordón y la gente se dispersaba con sus banderitas de papel. Nadie sabía nada. Arriba, el gran reloj marcaba las once y veintitrés en tres de sus caras y, en la esfera sur, todavía, las once y veintidós y veinte segundos.', 'In the square the band had stopped playing and the guards were taking down the cordon and people were drifting away with their little paper flags. Nobody knew anything. Up above, the great clock showed eleven twenty-three on three of its faces and, on the south face, still, eleven twenty-two and twenty seconds.'),
      Step.reach(-31.2, 31.2, 2.6, 'El Packard negro, en la esquina de la avenida de la Independencia.', 'The black Packard, on the corner of the Avenida de la Independencia.'),
      Step.run((S) => { SceneWalk.stop(S); face(S, -33, 33, -0.1); }),
      SAY('El Packard negro tenía la puerta de atrás abierta.', 'The black Packard’s rear door was open.'),
      SAY('Dentro olía a cera de vela.', 'Inside, it smelled of candle wax.'),
      Step.fade(1, 2.2),
    ],
  };
  const m = CAMP_BY_ID['P1-M4']; m.scene = 'cap4'; m.map = 'c4_estacion';
})();
