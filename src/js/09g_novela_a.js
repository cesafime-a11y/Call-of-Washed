// ---- 09g_novela_a.js ----
// =====================================================================
// MAPAS DE LA NOVELA (3.3.0) — Cuartel Tres Cruces y Puerto Ánimas, rehechos desde cero con el
// constructor de bloques y los ayudantes de San Juan (sjHelpers). Sustituyen al aeródromo y al muelle viejos.
// =====================================================================
// agua (solo decoración): un plano grande a la cota y
function sjWater(B, x0, z0, x1, z1, y = -0.6, color = 0x3a5262) { B.decoBox(x0, y - 0.05, z0, x1, y, z1, color); }

// ---------------------------------------------------------------------
// CUARTEL TRES CRUCES: cuartel de costa. Al norte la puerta de la guardia; dentro, barracones, comandancia,
// patio de armas con el mástil, caballerizas al oeste y los tres polvorines alambrados al este; al sur la tapia
// del mar, las dunas con trincheras y la playa.
MAPS.base = {
  name: { es: 'Cuartel Tres Cruces', en: 'Tres Cruces Barracks' },
  desc: { es: 'Cuartel de costa: barracones, comandancia y patio de armas; al este los tres polvorines alambrados y al sur las dunas con trincheras frente al mar.', en: 'A coastal barracks: huts, headquarters and parade ground; the three wired-in powder magazines to the east and dunes with trenches facing the sea.' },
  thumb: ['#56677a', '#c8b48a', '#6a6a5a'],
  theme: { skyTop: 0x56677a, skyMid: 0xaab3b3, skyBot: 0x868a80, fog: 0x99a09c, fogNear: 38, fogFar: 210, sun: 0xfff1da, sunI: 2.1, sunDir: [0.42, 0.72, -0.32], hemiTop: 0xd5dde0, hemiBot: 0x66665a, hemiI: 1.35, exposure: 1.05 },
  build(B) {
    const H = sjHelpers(B), conc = { pattern: PAT.CONCRETE, color: 0xa29e92 }, ocre = 0xcdb58a, cal = 0xdcd4c0;
    B.bounds(-48, -36, 48, 36, 18);
    const parade = [-18, -12, 18, 10], beach = [-48, 20, 48, 36];
    B.ground(-48, -36, 48, 36, { holes: [parade, beach], pattern: PAT.DIRT, color: 0x8c7c5c });
    B.ground(...parade, { pattern: PAT.CONCRETE, color: 0x9c978a });
    B.ground(...beach, { pattern: PAT.DIRT, color: 0xc8b48a });
    sjWater(B, -260, 36.2, 260, 300, -0.5, 0x3d5a6a);
    for (let i = 0; i < 9; i++) B.decoBox(-60 + i * 15, -0.48, 36.4 + (i % 3) * 3, -52 + i * 15, -0.45, 37 + (i % 3) * 3, 0xd8e0e0);   // espuma
    // ============ tapia del cuartel (2,6 m) con la puerta de la guardia al norte, dos salidas al mar y portillos a los lados
    const wall = { pattern: PAT.PLASTER, color: 0xd2c8b0, kind: 'wall' };
    B.wall('x', -42, 42, -30, 0, 2.6, 0.4, { ...wall, open: [{ type: 'big', at: 0, w: 5 }] });
    B.wall('x', -42, 42, 18, 0, 2.6, 0.4, { ...wall, open: [{ type: 'big', at: -22, w: 3.5 }, { type: 'big', at: 22, w: 3.5 }, { type: 'door', at: 0, w: 1.6 }] });
    B.wall('z', -30, 18, -42, 0, 2.6, 0.4, { ...wall, open: [{ type: 'door', at: -6, w: 1.6 }] });
    B.wall('z', -30, 18, 42, 0, 2.6, 0.4, { ...wall, open: [{ type: 'door', at: 14, w: 1.6 }] });
    for (const x of [-42, 42]) for (const z of [-30, 18]) B.decoBox(x - 0.35, 0, z - 0.35, x + 0.35, 2.9, z + 0.35, 0xb8ae96);
    for (let x = -42; x <= 42; x += 6) { B.decoBox(x - 0.25, 2.6, -30.25, x + 0.25, 2.75, -29.75, 0xb8ae96); B.decoBox(x - 0.25, 2.6, 17.75, x + 0.25, 2.75, 18.25, 0xb8ae96); }
    // puerta de la guardia: pilares, garita y barrera; fuera, el camino
    for (const s of [-1, 1]) B.box(s * 2.5 - 0.45, 0, -30.5, s * 2.5 + 0.45, 3.6, -29.5, { pattern: PAT.BRICK, color: 0xb8ae96 });
    B.decoBox(-3, 3.6, -30.4, 3, 4.2, -29.6, 0xb8ae96); H.signboard(0, 3.9, -30.42, Math.PI, 5, 0.55, ['CUARTEL TRES CRUCES']);
    B.house(4, -28.6, 6.4, -26.2, { floors: 1, h: 2.6, color: cal, parapet: false, open: { w: [['door', 0.5, 0]], n: [['win', 0.5, 0]] } }); H.gable(4, -28.6, 6.4, -26.2, 2.85, 0.9, 0x5a5a52, 'z', 0.2);
    B.decoBox(-2.4, 1.0, -31.1, 2.2, 1.12, -30.98, 0xc23a2a);
    B.sandbags(-6, -33, -2.5, -33); B.sandbags(2.5, -33, 6, -33); H.cart(-14, -33); B.crate(12, 0, -33.5, 1.1); B.crate(13, 0, -32.8, 0.9);
    // ============ barracones (dos plantas) y comandancia al norte del patio
    for (const [x0, x1] of [[-38, -14], [14, 38]]) {
      const w = x1 - x0, op = { n: [], s: [] };
      for (let k = 0; k < 6; k++) { op.s.push(['win', (k + 0.5) / 6, 0]); op.s.push(['win', (k + 0.5) / 6, 1]); op.n.push(['win', (k + 0.5) / 6, 1]); }
      op.s[4] = ['door', 2.5 / 6, 0]; op.n.push(['door', 0.5, 0]);
      B.house(x0, -27, x1, -18, { floors: 2, h: 3.2, color: ocre, parapet: false, roofPat: PAT.ROOF, roofColor: 0x6e3a2a, stairs: { side: x0 < 0 ? 'w' : 'e', from: 'n' }, open: { ...op, w: [['door', 0.5, 0], ['win', 0.5, 1]], e: [['door', 0.5, 0], ['win', 0.5, 1]] } });
      H.gable(x0, -27, x1, -18, 6.65, 2.0, 0x8a4a34, 'x');
      B.decoBox(x0 - 0.05, 0, -27.05, x1 + 0.05, 0.6, -17.95, 0x8a826e); B.decoBox(x0 - 0.1, 3.05, -27.1, x1 + 0.1, 3.25, -17.9, shade(ocre, -0.15));
      for (let i = 0; i < 3; i++) B.box(x0 + 3 + i * 7, 0.06, -26.2, x0 + 5 + i * 7, 0.5, -25.2, { pattern: PAT.WOOD, color: 0x5e4630, kind: 'cover' });   // literas (abajo)
      void w;
    }
    B.house(-8, -27, 8, -16, { floors: 2, h: 3.4, color: cal, parapet: false, roofPat: PAT.ROOF, roofColor: 0x6e3a2a, stairs: { side: 'e', from: 'n' },
      open: { s: [['door', 0.5, 0], ['win', 0.2, 0], ['win', 0.8, 0], ['win', 0.2, 1], ['win', 0.5, 1], ['win', 0.8, 1]], n: [['door', 0.3, 0], ['win', 0.7, 0], ['win', 0.3, 1], ['win', 0.7, 1]], w: [['win', 0.5, 0], ['win', 0.5, 1]], e: [['win', 0.3, 1]] } });
    H.gable(-8, -27, 8, -16, 7.05, 2.2, 0x8a4a34, 'x'); H.signboard(0, 3.0, -15.93, 0, 4.2, 0.6, ['COMANDANCIA']);
    for (const [f, fl] of [[0.2, 0], [0.8, 0], [0.2, 1], [0.5, 1], [0.8, 1]]) H.shutters('s', -8, -27, 8, -16, f, fl * 3.4, 0x4f6a4a);
    B.box(-3, 0.06, -24.5, 3, 0.85, -23.5, { pattern: PAT.WOOD, color: 0x4e3a28, kind: 'cover' });
    B.box(-2, 3.4, -21, 2, 4.2, -20, { pattern: PAT.WOOD, color: 0x4e3a28, kind: 'cover' });
    // ============ patio de armas: mástil, cañón de campaña y carros
    B.box(-0.12, 0, -0.12, 0.12, 12, 0.12, { pattern: PAT.METAL, color: 0xd8d4c8, kind: 'pole', noRender: true }); B.deco(GEO.cyl(0.08, 0.12, 12, 8), 0, 6, 0, 0xd8d4c8);
    B.box(-1.2, 0, -1.2, 1.2, 0.5, 1.2, { pattern: PAT.CONCRETE, color: 0xb0aa9c, kind: 'cover' }); B.deco(GEO.box(2.4, 1.4, 0.02), 1.3, 11, 0, 0x8a2a24);
    const gun = (x, z, ry) => { B.box(x - 1.2, 0, z - 1.2, x + 1.2, 1.2, z + 1.2, { noRender: true, kind: 'cover' }); B.deco(GEO.cyl(0.14, 0.18, 3.2, 10), x + Math.sin(ry) * 1.4, 1.15, z + Math.cos(ry) * 1.4, 0x3e4436, { rx: Math.PI / 2 - 0.12, ry, order: 'YXZ' }); B.deco(GEO.box(1.6, 1.0, 0.1), x, 1.0, z, 0x4a5240, { ry }); for (const s of [-1, 1]) B.deco(GEO.cyl(0.6, 0.6, 0.12, 14), x + Math.cos(ry) * s * 0.85, 0.6, z - Math.sin(ry) * s * 0.85, 0x3a3128, { rz: Math.PI / 2, ry, order: 'YXZ' }); B.deco(GEO.box(0.2, 0.2, 2.4), x - Math.sin(ry) * 1.3, 0.4, z - Math.cos(ry) * 1.3, 0x4a5240, { ry }); };
    gun(-9, 4, Math.PI); gun(9, 4, Math.PI);
    H.cart(-12, -6, 'z'); H.cart(13, -7); B.sandbags(-4, 6.5, 4, 6.5); B.crate(-15, 0, 7, 1.1); B.crate(15.5, 0, 7.5, 1.1); B.crate(16.4, 0, 6.6, 0.9);
    for (const [x, z] of [[-18, -12], [18, -12], [-18, 10], [18, 10]]) B.lamp(x, z);
    // ============ caballerizas (madera) y cocinas al oeste
    B.house(-38, -10, -24, 4, { floors: 1, h: 3.6, pattern: PAT.WOOD, color: 0x6a5038, parapet: false, roofPat: PAT.ROOF, roofColor: 0x5a4a3a, open: { e: [['big', 0.25, 0], ['big', 0.75, 0]], w: [['door', 0.5, 0]], n: [['win', 0.5, 0]], s: [['win', 0.3, 0], ['win', 0.7, 0]] } });
    H.gable(-38, -10, -24, 4, 3.85, 1.6, 0x5e4a36, 'z');
    for (let i = 0; i < 4; i++) B.box(-37.6, 0.06, -8.6 + i * 3.4, -33.6, 1.3, -8.4 + i * 3.4, { pattern: PAT.WOOD, color: 0x5a4430, kind: 'cover' });
    B.decoBox(-31, 0.06, -9, -30, 0.06, 3, 0xb89a50); B.box(-31.5, 0, -2, -29.5, 1.1, 0, { pattern: PAT.DIRT, color: 0xb89a50, kind: 'cover' });
    B.house(-38, 8, -26, 15, { floors: 1, h: 3.2, color: cal, parapet: false, roofPat: PAT.ROOF, roofColor: 0x6e3a2a, open: { e: [['door', 0.5, 0]], n: [['door', 0.3, 0], ['win', 0.7, 0]], s: [['win', 0.5, 0]] } });
    H.gable(-38, 8, -26, 15, 3.45, 1.4, 0x8a4a34, 'x'); B.decoBox(-28.5, 3.4, 10.5, -27.8, 5.6, 11.2, 0x8a826e);
    // ============ los tres polvorines (hormigón, puerta de hierro, montera de tierra) entre alambradas
    for (const [k, z0] of [[1, -12], [2, -3], [3, 6]]) {
      const x0 = 28, x1 = 36, z1 = z0 + 6;
      B.house(x0, z0, x1, z1, { floors: 1, h: 2.8, pattern: PAT.CONCRETE, color: 0x9a968c, t: 0.5, solidWalls: true, parapet: false, roofPat: PAT.DIRT, roofColor: 0x6e7a46, floorPat: PAT.CONCRETE, floorColor: 0x7a776e, open: { w: [['door', 0.5, 0, 1.6]] } });
      B.decoBox(x0 - 0.6, 0, z0 - 0.6, x0, 2.2, z1 + 0.6, 0x6e7a46, {}); B.decoBox(x1, 0, z0 - 0.6, x1 + 0.6, 2.2, z1 + 0.6, 0x6e7a46);
      B.decoBox(x0 - 0.04, 0.05, (z0 + z1) / 2 - 0.95, x0 + 0.02, 2.4, (z0 + z1) / 2 - 0.82, 0x2e2e2c);
      H.signboard(x0 - 0.03, 2.55, (z0 + z1) / 2, -Math.PI / 2, 2.0, 0.35, ['POLVORÍN ' + k], '#d8cfb4');
      B.crate(x0 + 2, 0.06, z0 + 1.6, 1.0); B.crate(x0 + 3.1, 0.06, z0 + 1.5, 0.9); B.crate(x0 + 2.2, 1.06, z0 + 1.6, 0.8); B.crate(x1 - 1.8, 0.06, z1 - 1.5, 1.0);
    }
    B.wire(24, -14, 24, -6); B.wire(24, -1, 24, 3); B.wire(24, 8, 24, 13); B.fence(25, -15, 39, -15, 2.0); B.fence(25, 14, 39, 14, 2.0);
    B.sandbags(21, -10, 21, -7); B.sandbags(21, 8, 21, 11); B.barrel(20, 0, 0.5);
    // ============ torres de vigía sobre la tapia del mar
    B.tower(-36, 13, 5, '-z'); B.tower(38.5, -24, 5, '+z');
    // ============ el mar: dunas, trincheras con sacos, alambradas, muro del mar y piezas de costa
    for (const [x, z, w, d, h] of [[-36, 27, 9, 5, 0.9], [-14, 30, 8, 4, 0.7], [8, 26.5, 7, 4, 0.8], [30, 29, 10, 5, 1.0], [-28, 33, 6, 3, 0.5], [40, 33, 6, 3, 0.6]]) {
      B.box(x - w / 2, 0, z - d / 2, x + w / 2, h * 0.5, z + d / 2, { pattern: PAT.DIRT, color: 0xc4ae84, kind: 'deco' }); B.box(x - w / 3, 0.0, z - d / 3, x + w / 3, h, z + d / 3, { pattern: PAT.DIRT, color: 0xccb68c, kind: 'deco' });
    }
    B.sandbags(-30, 22.4, -16, 22.4); B.sandbags(-6, 22.4, 6, 22.4); B.sandbags(16, 22.4, 30, 22.4);
    B.wire(-44, 26, -26, 26); B.wire(-20, 27, -2, 27); B.wire(4, 25, 22, 25); B.wire(30, 25, 44, 25);
    for (const x of [-22, 22]) { B.sandbags(x - 3, 20.4, x - 3, 23.4); B.sandbags(x + 3, 20.4, x + 3, 23.4); }
    B.wall('x', -6, 6, 31, 0, 2.4, 0.4, { pattern: PAT.PLASTER, color: 0xd8d0bc, kind: 'wall' });
    for (let i = 0; i < 14; i++) B.decoBox(-5 + B.rng.range(0, 10) - 0.04, 1.0 + B.rng.range(0, 0.9), 30.78, -5 + B.rng.range(0, 10) + 0.04, 1.08 + B.rng.range(0, 0.9), 30.8, 0x6e6a60);
    for (const [x, z] of [[-40, 30.5], [-9, 34], [14, 33], [36, 31]]) { B.box(x - 0.9, 0, z - 0.3, x + 0.9, 0.7, z + 0.3, { pattern: PAT.METAL, color: 0x4a4a46, kind: 'cover' }); B.deco(GEO.box(1.8, 0.12, 0.12), x, 0.95, z, 0x4a4a46, { ry: 0.8 }); B.deco(GEO.box(1.8, 0.12, 0.12), x, 0.95, z, 0x4a4a46, { ry: -0.8 }); }   // erizos
    // barca varada
    B.box(10, 0, 32, 15, 0.9, 34, { pattern: PAT.WOOD, color: 0x4e5a62, kind: 'cover' }); B.deco(sjPrism(), 16.1, 0, 33, 0x4e5a62, { rz: -Math.PI / 2, sx: 2, sy: 1.2, sz: 0.9, order: 'ZXY' });
    // ============ ambiente
    B.smoke(-90, -80, 1.0); B.horizon(0x7c7a68, 18, 95, 150, { groundColor: 0x7a7458, skip: 's' });
    // ============ A / B / C, armas, apariciones (norte: el camino; sur: la playa)
    B.dom('A', -31, 0, -3); B.dom('B', 0, 0, 3); B.dom('C', 32, 0, 0, 4.6);
    B.stand(-36, 5, 13, 'sniper'); B.stand(0, 3.46, -20.5, 'lmg'); B.stand(32, 0.06, -9, 'shotgun');
    for (const [x, z] of [[-30, -34], [-20, -34.5], [-10, -34], [10, -34], [20, -34.5], [30, -34], [-40, -33], [40, -33], [0, -35], [-4, -33.5]]) B.spawn(0, x, 0, z, Math.PI);
    for (const [x, z] of [[-30, 34.5], [-20, 34], [-6, 35], [6, 35], [20, 34], [30, 35], [-42, 34.5], [42, 34.5], [0, 33.5], [26, 33]]) B.spawn(1, x, 0, z, 0);
    for (const [x, z] of [[-30, -14], [30, -18], [0, -8], [0, 14], [-12, 14], [12, 14], [-40, -20], [40, 6], [-20, 30], [20, 30], [-30, 6], [24, -26], [-10, -33], [10, -33]]) B.spawn('ffa', x, 0, z);
    B.prop('bucket', -30, 0.06, -6); B.prop('can', 4, 0, 8); B.prop('can', -12, 0, 24);
  },
};

// ---------------------------------------------------------------------
// PUERTO ÁNIMAS (de noche): muelle de piedra con el mercante amarrado (se sube por la pasarela), dos grúas de vapor
// sobre carriles, almacenes con pasarela interior, la capitanía, el faro en la punta del espigón y la calle del puerto.
MAPS.muelle = {
  name: { es: 'Puerto Ánimas', en: 'Puerto Ánimas' },
  desc: { es: 'El puerto de noche: el mercante amarrado al muelle (se sube por la pasarela), grúas de vapor, almacenes, la capitanía y el faro del espigón.', en: 'The harbour at night: the freighter moored at the quay (up the gangway), steam cranes, warehouses, the harbourmaster\'s office and the breakwater lighthouse.' },
  thumb: ['#0e1a2c', '#3a4e6a', '#c8a050'],
  theme: { skyTop: 0x05080f, skyMid: 0x18273e, skyBot: 0x0d121b, fog: 0x18253a, fogNear: 26, fogFar: 150, sun: 0x9fbcff, sunI: 0.95, sunDir: [0.5, 0.62, -0.6], hemiTop: 0x4a64a0, hemiBot: 0x1c2638, hemiI: 2.0, exposure: 1.5, cloud: 0.25, rays: 0, glow: 0.05, stars: 1, lamps: true,
    disc: [0.75, 0.85, 1.0], soldFill: 0.9, soldRim: 1.1, grade: { sat: 0.82, con: 1.08, sh: [0.9, 0.98, 1.15], hi: [1.0, 1.0, 1.08] } },
  build(B) {
    const H = sjHelpers(B), stone = 0x8a8478, D = 3.0;   // D = cubierta del mercante
    B.bounds(-48, -28, 48, 34, 20);
    const quay = [-48, -18.5, 40, -6];
    B.ground(-48, -18.5, 48, 34, { holes: [quay], pattern: PAT.COBBLE, color: 0x6e6a62 });
    B.ground(...quay, { pattern: PAT.CONCRETE, color: 0x8a867c });
    B.ground(40, -28, 48, -18.5, { pattern: PAT.CONCRETE, color: 0x8a867c });   // espigón del faro
    sjWater(B, -260, -300, 260, -18.5, -1.6, 0x16263a); sjWater(B, -48, -28, 40, -18.5, -1.6, 0x16263a);
    B.decoBox(-48, -1.6, -18.9, 40, 0, -18.5, 0x5e5a52);
    for (let x = -44; x <= 36; x += 8) { B.box(x - 0.3, 0, -18.3, x + 0.3, 0.6, -17.7, { pattern: PAT.METAL, color: 0x2a2a2a, kind: 'cover' }); }   // bolardos
    // ============ el mercante «San Telmo» amarrado: casco, cubierta, bodegas, puente de mando, chimenea y palos de carga
    const sx0 = -36, sx1 = 6, sz0 = -27.5, sz1 = -18.6;
    B.box(sx0, -2, sz0, sx1, D, sz1, { pattern: PAT.METAL, color: 0x2a2e34, kind: 'floor' });
    B.box(sx0 + 0.02, D - 0.02, sz0 + 0.02, sx1 - 0.02, D, sz1 - 0.02, { pattern: PAT.WOOD, color: 0x6a5a44, kind: 'floor' });
    B.decoBox(sx0, -0.5, sz0 - 0.01, sx1, 0.2, sz1 + 0.01, 0x7a2a22);
    B.deco(sjPrism(), sx1 + 2.6, -2, (sz0 + sz1) / 2, 0x2a2e34, { rz: -Math.PI / 2, ry: 0, sx: sz1 - sz0, sy: 5.2, sz: 5, order: 'ZXY' });
    B.box(sx1, -2, sz0 + 2, sx1 + 2.5, D, sz1 - 2, { pattern: PAT.METAL, color: 0x2a2e34, kind: 'floor' });
    const bul = { pattern: PAT.METAL, color: 0x3a3e44, kind: 'cover' };
    B.wall('x', sx0, sx1, sz0 + 0.1, D, 1.0, 0.2, bul); B.wall('x', sx0, sx1, sz1 - 0.1, D, 1.0, 0.2, { ...bul, open: [{ type: 'big', at: -16, w: 1.6, y0: 0, y1: 2 }] }); B.wall('z', sz0, sz1, sx0 + 0.1, D, 1.0, 0.2, bul);
    for (const [a, b] of [[-33, -25], [-9, -1]]) { B.box(a, D, sz0 + 2.2, b, D + 0.9, sz1 - 2.2, { pattern: PAT.WOOD, color: 0x3e4a34, kind: 'cover' }); B.decoBox(a + 0.2, D + 0.9, sz0 + 2.4, b - 0.2, D + 0.95, sz1 - 2.4, 0x2e3828); }
    H.lift(D, () => { B.house(-20, -26.4, -12, -19.8, { floors: 2, h: 2.8, color: 0xd8d2c4, parapet: false, roofColor: 0x4a4a4a, floorH: 0, open: { s: [['door', 0.3, 0], ['win', 0.7, 0], ['win', 0.25, 1], ['win', 0.5, 1], ['win', 0.75, 1]], n: [['door', 0.6, 0], ['win', 0.5, 1]], w: [['win', 0.5, 0], ['win', 0.5, 1]], e: [['win', 0.5, 1]] }, stairs: { side: 'w', from: 'n' } }); H.gable(-20, -26.4, -12, -19.8, 5.85, 0.6, 0x4a4a4a, 'x', 0.3); });
    B.deco(GEO.cyl(1.1, 1.2, 4.5, 14), -16, D + 5.6 + 2.2, -23, 0x2a2a2a); B.decoBox(-17.2, D + 9.6, -24.2, -14.8, D + 10.1, -21.8, 0xa8382a);
    for (const x of [-29, -5]) { B.box(x - 0.2, D, -23.2, x + 0.2, D + 10, -22.8, { pattern: PAT.METAL, color: 0x3a3a3a, kind: 'pole', noRender: true }); B.deco(GEO.cyl(0.18, 0.24, 10, 8), x, D + 5, -23, 0x3a3a3a); const H2 = sjHelpers(B); H2.beam(x, D + 1.2, -23, x + (x < -16 ? 6 : -6), D + 6.5, -23, 0.16, 0x4a4a4a); H2.beam(x, D + 10, -23, x + (x < -16 ? 6 : -6), D + 6.5, -23, 0.03, 0x1a1a1a); }
    H.beam(sx0, D + 10, -23, -16, D + 9, -23, 0.02, 0x1a1a1a); H.beam(sx1 + 2, D + 4, -23, -5, D + 10, -23, 0.02, 0x1a1a1a);
    B.panel(sx0 + 6, 1.6, sz1 + 0.03, 0, 5, 0.6, (g, W, Hh) => { g.clearRect(0, 0, W, Hh); g.fillStyle = '#e8e0c8'; g.font = `bold ${Hh * 0.8 | 0}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SAN TELMO', W / 2, Hh / 2); }, { px: 512, alpha: true });
    B.stairs(-16, -14.9, '-z', 1.5, 0, D, { pattern: PAT.WOOD, color: 0x5e4630, solidBase: false });   // pasarela
    B.stairs(2, -14.9, '-z', 1.2, 0, D, { pattern: PAT.WOOD, color: 0x5e4630, solidBase: false });
    // ============ grúas de vapor sobre carriles
    H.rail(-48, -15, 40, -15); H.rail(-48, -12.5, 40, -12.5);
    for (const [cx, ang] of [[12, -0.35], [28, 0.3]]) {
      for (const sx of [-1, 1]) for (const sz of [-15, -12.5]) B.box(cx + sx * 1.6 - 0.2, 0, sz - 0.2, cx + sx * 1.6 + 0.2, 4, sz + 0.2, { pattern: PAT.METAL, color: 0x3a3634, kind: 'pole' });
      B.box(cx - 1.9, 4, -15.3, cx + 1.9, 4.4, -12.2, { pattern: PAT.METAL, color: 0x3a3634, kind: 'cover' });
      B.decoBox(cx - 1.5, 4.4, -14.9, cx + 1.5, 7.2, -12.6, 0x4a3a30); H.gable(cx - 1.5, -14.9, cx + 1.5, -12.6, 7.2, 0.7, 0x2a2a2a, 'x', 0.15);
      B.deco(GEO.cyl(0.25, 0.25, 2.2, 8), cx + 1, 8.2, -13, 0x222222);
      H.beam(cx, 5.2, -13.8, cx + Math.sin(ang) * 9, 13, -13.8 - Math.cos(ang) * 9, 0.35, 0x4a3a30); H.beam(cx + Math.sin(ang) * 9, 13, -13.8 - Math.cos(ang) * 9, cx + Math.sin(ang) * 9, 6, -13.8 - Math.cos(ang) * 9, 0.03, 0x111111);
      B.decoBox(cx + Math.sin(ang) * 9 - 0.6, 5.2, -13.8 - Math.cos(ang) * 9 - 0.6, cx + Math.sin(ang) * 9 + 0.6, 6, -13.8 - Math.cos(ang) * 9 + 0.6, 0x6a5232);
    }
    // ============ almacenes con pasarela (entreplanta) y la capitanía
    for (const [x0, x1, nm] of [[-44, -26, 'ALMACÉN 2'], [-6, 14, 'ALMACÉN 4']]) {
      B.house(x0, -4, x1, 10, { floors: 1, h: 6, pattern: PAT.BRICK, color: 0x7a4a3a, parapet: false, roofPat: PAT.ROOF, roofColor: 0x3a3a3a, floorPat: PAT.CONCRETE, floorColor: 0x5e5a54,
        open: { n: [['big', 0.3, 0, 3.4], ['door', 0.75, 0], ['win', 0.75, 0, 1.6, 3.6, 4.8]], s: [['big', 0.6, 0, 3.4], ['win', 0.2, 0, 1.6, 3.6, 4.8]], w: [['door', 0.5, 0], ['win', 0.5, 0, 1.4, 3.6, 4.8]], e: [['door', 0.4, 0], ['win', 0.7, 0, 1.4, 3.6, 4.8]] } });
      H.gable(x0, -4, x1, 10, 6.25, 2.2, 0x3a3a3a, 'x', 0.3); H.signboard((x0 + x1) / 2, 5.4, -4.03, Math.PI, 3.6, 0.6, [nm], '#cfc4a8');
      B.box(x0 + 0.3, 3.0, 6.6, x1 - 0.3, 3.2, 9.7, { pattern: PAT.GRATE, color: 0x4a4a48, kind: 'floor' });
      B.stairs(x1 - 1.2, -3.2, '+z', 1.2, 0.06, 3.0, { pattern: PAT.GRATE, color: 0x4a4a48, solidBase: false });
      B.box(x1 - 1.8, 3.0, -0.4, x1 - 0.6, 3.2, 6.6, { pattern: PAT.GRATE, color: 0x4a4a48, kind: 'floor' });
      B.wall('x', x0 + 0.3, x1 - 1.8, 6.65, 3.2, 1.0, 0.08, { pattern: PAT.GRATE, color: 0x3a3a38, kind: 'cover' });
      for (const [dx, dz, s] of [[3, 2, 1.3], [4.3, 2.2, 1.1], [3.2, 2.1, 1.0], [8, -1, 1.2], [9.2, -0.8, 1.0], [12, 3, 1.3], [12.1, 3, 1.1]]) B.crate(x0 + dx, dx === 3.2 || dx === 12.1 ? 1.36 : 0.06, dz, s);
      B.barrel(x0 + 6, 0.06, 7.5); B.barrel(x0 + 6.7, 0.06, 7.9);
    }
    B.house(22, 0, 32, 10, { floors: 2, h: 3.2, color: 0xc8b896, parapet: false, roofPat: PAT.ROOF, roofColor: 0x5a3a2a, stairs: { side: 'e', from: 's' },
      open: { n: [['door', 0.5, 0], ['win', 0.2, 0], ['win', 0.8, 0], ['win', 0.2, 1], ['win', 0.5, 1], ['win', 0.8, 1]], w: [['door', 0.5, 0], ['win', 0.5, 1]], s: [['win', 0.5, 0], ['win', 0.3, 1]], e: [['win', 0.5, 0]] } });
    H.gable(22, 0, 32, 10, 6.65, 1.8, 0x7a4430, 'x'); H.signboard(27, 2.9, -0.03, Math.PI, 3.6, 0.55, ['CAPITANÍA'], '#e2d8c0');
    for (const [f, fl] of [[0.2, 0], [0.8, 0], [0.2, 1], [0.5, 1], [0.8, 1]]) H.shutters('n', 22, 0, 32, 10, f, fl * 3.2, 0x3e5a6a);
    // ============ faro en la punta del espigón (base maciza, escalera exterior, linterna)
    B.box(42, 0, -26.5, 46, 1.0, -22.5, { pattern: PAT.CONCRETE, color: 0xb0aa9c, kind: 'cover' });
    B.box(42.9, 1.0, -25.6, 45.1, 13, -23.4, { pattern: PAT.PLASTER, color: 0xe2ddd0, noRender: true });
    B.deco(GEO.cyl(1.0, 1.4, 12, 16), 44, 7, -24.5, 0xe2ddd0); for (const y of [4, 8]) B.deco(GEO.cyl(1.25 - y * 0.02, 1.3 - y * 0.02, 1.2, 16), 44, y, -24.5, 0xa8322a);
    B.deco(GEO.cyl(1.3, 1.3, 0.2, 16), 44, 13.1, -24.5, 0x2a2a2a); B.deco(GEO.cyl(0.8, 0.8, 1.4, 12), 44, 13.9, -24.5, 0xf4e2a0); B.deco(GEO.cone(1.0, 1.0, 12), 44, 15.1, -24.5, 0x2a2a2a);
    B.light(44, 13.9, -24.5);
    B.sandbags(40.5, -21, 40.5, -19); B.crate(46.5, 0, -20, 1.0);
    // ============ calle del puerto (sur): casas, taberna del muelle y farolas
    let i = 0;
    for (const [x0, x1] of [[-46, -38], [-36, -28], [-24, -16], [-12, -4], [2, 10], [16, 24], [30, 38]]) {
      H.house(x0, 22, x1, 32, { street: 'n', floors: i % 3 === 1 ? 1 : 2, color: [0xd8cfb8, 0xc8a46a, 0xb8c0c4, 0xc99c88][i % 4], stairs: { side: 'e', from: 's' } }); i++;
    }
    H.signboard(-20, 2.9, 21.92, Math.PI, 3.2, 0.6, ['TABERNA DEL MUELLE']);
    for (const x of [-40, -20, 0, 20, 36]) { B.lamp(x, -9); B.lamp(x + 4, 19); }
    B.lamp(-12, 4); B.lamp(18, 4);
    // cobertura en la explanada del puerto
    for (const [x, z, ax] of [[-20, 14, 'x'], [4, 15, 'z'], [36, 14, 'x']]) B.container(x, 0, z, ax);
    B.container(-36, 0, 15, 'z'); B.container(-36, 2.6, 15.3, 'z');
    for (const [x, z] of [[-14, -9], [-15.2, -9.3], [0, -8], [18, -9.5], [36, -8.5], [-30, 16], [16, 16]]) B.crate(x, 0, z, 1.1);
    for (const [x, z] of [[-24, -9], [-23.3, -8.6], [8, 17], [42, 12]]) B.barrel(x, 0, z);
    B.sandbags(-2, 18, 2, 18); B.sandbags(40, 2, 40, 6); H.cart(-6, 16, 'z');
    H.rail(-48, 13, 48, 13); H.wagon(-44, 13); H.wagon(26, 13);
    // ============ ambiente
    B.horizon(0x1e2632, 16, 100, 160, { groundColor: 0x1a1e26, skip: 'n' });
    // ============ A / B / C, armas, apariciones
    B.dom('A', -24, D, -23, 4.6); B.dom('B', 4, 0, 4); B.dom('C', 34, 0, -10);
    B.stand(-16, D + 2.8, -23.6, 'sniper'); B.stand(-35, 3.2, 8.2, 'lmg'); B.stand(4, 3.2, 8.2, 'shotgun');
    for (const [x, z] of [[-46, -12], [-46, -9], [-46, 0], [-46, 5], [-46, 14], [-46, 18], [-42, -16], [-46, 10], [-44, 19], [-47, -3]]) B.spawn(0, x, 0, z, -Math.PI / 2);
    for (const [x, z] of [[46, -12], [46, -9], [46, 0], [46, 5], [46, 14], [46, 18], [42, -16], [46, 10], [44, 19], [47, -3]]) B.spawn(1, x, 0, z, Math.PI / 2);
    for (const [x, y, z] of [[-30, D, -22], [-4, D, -24], [-35, 0, 3], [4, 0, 3], [27, 0, 15], [-12, 0, 18], [16, 0, -9], [-30, 0, -10], [38, 0, -4], [-2, 0, 20], [44, 0, -20], [-20, 0, 8]]) B.spawn('ffa', x, y, z);
    B.prop('can', -10, 0, 12); B.prop('bucket', 30, 0, -9);
  },
};
