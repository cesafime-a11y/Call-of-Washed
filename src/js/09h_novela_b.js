// ---- 09h_novela_b.js ----
// =====================================================================
// MAPAS DE LA NOVELA (3.3.0), segunda tanda: Paso de los Ciegos (nieve de noche, aduana), Estación Central
// (el reloj de cuatro esferas, andenes y trenes) y Villa Corcovado (calle de los Herreros, el río y el puente de hierro).
// =====================================================================
// nevada: copos que caen alrededor de la cámara (solo decoración)
function sjSnow(ms, n = 1400, R = 26) {
  const pos = new Float32Array(n * 3), rng = new RNG(hash32('snow', ms.id));
  for (let i = 0; i < n; i++) { pos[i * 3] = rng.range(-R, R); pos[i * 3 + 1] = rng.range(0, 18); pos[i * 3 + 2] = rng.range(-R, R); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf2f6ff, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false }));
  pts.frustumCulled = false; ms.decor.add(pts);
  ms.anim.push((t, dt) => {
    const c = G.camera ? G.camera.position : null; if (!c) return;
    for (let i = 0; i < n; i++) {
      let y = pos[i * 3 + 1] - dt * (1.1 + (i % 7) * 0.08); if (y < 0) y += 18; pos[i * 3 + 1] = y;
      pos[i * 3] += Math.sin(t * 0.7 + i) * dt * 0.25;
    }
    pts.position.set(Math.floor(c.x / (2 * R)) * 2 * R, c.y - 6, Math.floor(c.z / (2 * R)) * 2 * R);
    // los copos se reparten en una celda de 2R alrededor: se recolocan para que siempre rodeen a la cámara
    for (let i = 0; i < n; i++) {
      const wx = pts.position.x + pos[i * 3], wz = pts.position.z + pos[i * 3 + 2];
      if (wx - c.x > R) pos[i * 3] -= 2 * R; else if (c.x - wx > R) pos[i * 3] += 2 * R;
      if (wz - c.z > R) pos[i * 3 + 2] -= 2 * R; else if (c.z - wz > R) pos[i * 3 + 2] += 2 * R;
    }
    g.attributes.position.needsUpdate = true;
  });
}
// abeto nevado
function sjFir(B, x, z, s = 1, y = 0) {
  B.box(x - 0.2 * s, y, z - 0.2 * s, x + 0.2 * s, y + 2.6 * s, z + 0.2 * s, { pattern: PAT.WOOD, color: 0x3a2e22, kind: 'tree', noRender: true });
  B.deco(GEO.cyl(0.14 * s, 0.22 * s, 2.4 * s, 6), x, y + 1.2 * s, z, 0x3a2e22);
  const lv = [[1.8, 2.2, 1.7], [1.45, 2.2, 2.8], [1.05, 1.9, 3.8], [0.6, 1.4, 4.7]];
  for (const [r, h, yy] of lv) { B.deco(GEO.cone(r * s, h * s, 8), x, y + yy * s, z, 0x2e4030, { ry: B.rng.range(0, 3) }); B.deco(GEO.cone(r * 0.82 * s, h * 0.45 * s, 8), x, y + (yy + h * 0.32) * s, z, 0xe8eef2, { ry: B.rng.range(0, 3) }); }
}

// ---------------------------------------------------------------------
// PASO DE LOS CIEGOS: frontera de Tierra Alta a 3.840 m, nieve de noche. El camino cruza la barrera de la aduana;
// al norte el edificio de la aduana (dos plantas), al sur la garita y el refugio de piedra.
MAPS.cruce = {
  name: { es: 'Paso de los Ciegos', en: 'Paso de los Ciegos' },
  desc: { es: 'Pequeño y frenético (44 × 36 m): la aduana de la frontera de Tierra Alta, a 3.840 m, de noche y con nieve. El camino cruza la barrera entre la aduana y el refugio.', en: 'Small and frantic (44 × 36 m): the Tierra Alta border customs post at 3,840 m, at night in the snow. The road crosses the barrier between the customs house and the refuge.' },
  small: true,
  thumb: ['#0c1424', '#d8e0ea', '#3a4a5e'],
  theme: { skyTop: 0x070c18, skyMid: 0x2a3a54, skyBot: 0x1a2232, fog: 0x4a5a72, fogNear: 14, fogFar: 85, sun: 0xaac4ff, sunI: 1.0, sunDir: [-0.4, 0.6, -0.55], hemiTop: 0x6a84b8, hemiBot: 0x3a4658, hemiI: 2.1, exposure: 1.45, cloud: 1.2, rays: 0, glow: 0.05, stars: 0, lamps: true,
    disc: [0.6, 0.7, 0.9], soldFill: 0.9, soldRim: 1.1, grade: { sat: 0.78, con: 1.06, sh: [0.9, 0.97, 1.14], hi: [1.0, 1.0, 1.08] } },
  build(B) {
    const H = sjHelpers(B), snow = 0xdfe5ec, snowD = 0xc8d0da, stone = 0x7e7a72;
    B.bounds(-22, -18, 22, 18, 16);
    B.ground(-22, -18, 22, 18, { holes: [[-22, -3, 22, 3]], pattern: PAT.DIRT, color: snow });
    B.ground(-22, -3, 22, 3, { pattern: PAT.DIRT, color: 0xb4b6b4 });
    for (let x = -21; x < 21; x += 1.6) B.decoBox(x, 0, B.rng.range(-0.3, 0.3) - 1.2, x + 0.9, 0.012, B.rng.range(-0.3, 0.3) - 1.0, 0x8e8e8a);   // rodadas
    // muretes de nieve y piedra a los lados del camino
    for (const s of [-1, 1]) { B.box(-22, 0, s * 3 - 0.3, -10, 0.7, s * 3 + 0.3, { pattern: PAT.DIRT, color: snowD, kind: 'cover' }); B.box(10, 0, s * 3 - 0.3, 22, 0.7, s * 3 + 0.3, { pattern: PAT.DIRT, color: snowD, kind: 'cover' }); }
    // aduana: dos plantas de piedra con tejado nevado, letrero y bandera
    B.house(-7, -14, 7, -5, { floors: 2, h: 3.0, pattern: PAT.BRICK, color: stone, parapet: false, roofPat: PAT.DIRT, roofColor: snow, stairs: { side: 'w', from: 'n' },
      open: { s: [['door', 0.5, 0], ['win', 0.2, 0], ['win', 0.8, 0], ['win', 0.2, 1], ['win', 0.5, 1], ['win', 0.8, 1]], n: [['door', 0.75, 0], ['win', 0.3, 1]], w: [['win', 0.5, 0]], e: [['door', 0.5, 0], ['win', 0.5, 1]] } });
    H.gable(-7, -14, 7, -5, 6.25, 2.0, snow, 'x'); H.signboard(0, 2.75, -4.93, 0, 4.4, 0.6, ['ADUANA · TIERRA ALTA']);
    for (const [f, fl] of [[0.2, 0], [0.8, 0], [0.2, 1], [0.5, 1], [0.8, 1]]) H.shutters('s', -7, -14, 7, -5, f, fl * 3.0, 0x4a3a2a);
    B.box(-4, 0.06, -11, 2, 0.95, -10.3, { pattern: PAT.WOOD, color: 0x4e3a28, kind: 'cover' }); B.box(3.5, 3.0, -13, 6, 3.9, -12, { pattern: PAT.WOOD, color: 0x4e3a28, kind: 'cover' });
    B.decoBox(4.5, 6.4, -9.8, 5.2, 8.6, -9.1, 0x5a5650); B.light(0, 2.6, -4.5);
    B.deco(GEO.cyl(0.04, 0.05, 4.5, 6), -8.2, 2.25, -4.6, 0x3a3a3a); B.deco(GEO.box(1.3, 0.8, 0.02), -7.5, 4.0, -4.6, 0x2a5a3a);
    // barrera, garita y refugio de piedra
    B.box(-0.4, 0, 3.4, 0.4, 1.1, 4.2, { pattern: PAT.CONCRETE, color: 0x8a8680, kind: 'cover' });
    for (let i = 0; i < 8; i++) B.decoBox(-0.06 + 0, 1.0, 2.9 - i * 0.82, 0.06, 1.12, 3.4 - i * 0.82, i % 2 ? 0xe8e4dc : 0xb02a22);
    B.box(-0.05, 0.9, -3.0, 0.05, 1.2, 3.4, { kind: 'fence', noRender: true, pattern: PAT.WOOD, color: 0xb02a22 });
    B.house(2, 4.5, 4.4, 6.9, { floors: 1, h: 2.5, pattern: PAT.WOOD, color: 0x5a6a5a, parapet: false, roofPat: PAT.DIRT, roofColor: snow, open: { n: [['door', 0.5, 0]], w: [['win', 0.5, 0]], e: [['win', 0.5, 0]] } });
    H.gable(2, 4.5, 4.4, 6.9, 2.75, 0.8, snow, 'z', 0.15);
    B.house(-16, 7, -6, 15, { floors: 1, h: 3.0, pattern: PAT.BRICK, color: 0x6e6a62, parapet: false, roofPat: PAT.DIRT, roofColor: snow, open: { n: [['door', 0.6, 0], ['win', 0.25, 0]], e: [['win', 0.5, 0]], w: [['door', 0.5, 0]], s: [['win', 0.5, 0]] } });
    H.gable(-16, 7, -6, 15, 3.25, 1.6, snow, 'x'); H.signboard(-11, 2.6, 6.93, Math.PI, 2.6, 0.45, ['REFUGIO'], '#d8cfb4');
    B.box(-14, 0.06, 12.5, -11, 0.9, 13.4, { pattern: PAT.WOOD, color: 0x4e3a28, kind: 'cover' }); B.decoBox(-7.2, 3.2, 12.5, -6.6, 5, 13.1, 0x5a5650);
    // leñera, cobertizo, carro nevado y cajas
    B.house(9, 7, 15, 12, { floors: 1, h: 2.6, pattern: PAT.WOOD, color: 0x5a4432, parapet: false, roofPat: PAT.DIRT, roofColor: snow, open: { n: [['big', 0.5, 0, 3.2]], w: [['win', 0.5, 0]] } });
    H.gable(9, 7, 15, 12, 2.85, 1.0, snow, 'x', 0.2);
    for (let i = 0; i < 3; i++) B.box(16.5, i * 0.4, 8 + i * 0.1, 19, 0.4 + i * 0.4, 9.6 - i * 0.1, { pattern: PAT.WOOD, color: 0x6a5038, kind: 'cover' });
    H.cart(12, -9); B.decoBox(10.6, 1.25, -9.7, 13.4, 1.4, -8.3, snow);
    for (const [x, z, s] of [[-14, -7, 1.1], [-13, -6.4, 0.9], [15, 4.6, 1.0], [-3, 6, 1.1], [8, -14, 1.1], [-18, -12, 1.0]]) { B.crate(x, 0, z, s); B.decoBox(x - s / 2, s, z - s / 2, x + s / 2, s + 0.08, z + s / 2, snow); }
    B.sandbags(-10, -4, -6, -4); B.sandbags(6, 4, 9, 4); B.sandbags(17, -6, 17, -3.4);
    // montones de nieve (cobertura baja) y abetos
    for (const [x, z, w, d] of [[-18, 6, 3, 1.6], [18, -11, 3.2, 1.4], [12, 15, 2.6, 1.4], [-2, 12, 3, 1.4], [-18, -15, 2.4, 1.2]]) { B.box(x - w / 2, 0, z - d / 2, x + w / 2, 0.8, z + d / 2, { pattern: PAT.DIRT, color: snowD, kind: 'cover', noRender: true }); B.deco(GEO.sphere(1, 8, 5), x, 0.1, z, snowD, { sx: w * 0.6, sy: 0.75, sz: d * 0.65 }); }
    for (const [x, z, s] of [[-20, -16, 1.0], [-11, -16.5, 0.9], [11, -16.5, 1.1], [20, 16, 1.0], [5, 16.5, 0.8], [-20, 16.5, 0.9], [20, -16, 0.85], [-20.5, 10, 0.8]]) sjFir(B, x, z, s);
    // postes del telégrafo
    for (const x of [-18, -6, 6, 18]) { B.box(x - 0.1, 0, -3.6, x + 0.1, 5.5, -3.4, { pattern: PAT.WOOD, color: 0x4a3a28, kind: 'pole', noRender: true }); B.deco(GEO.cyl(0.08, 0.1, 5.5, 6), x, 2.75, -3.5, 0x4a3a28); B.deco(GEO.box(1.0, 0.08, 0.08), x, 5.2, -3.5, 0x4a3a28); }
    for (const x of [-12, 0, 12]) H.beam(x - 6, 5.25, -3.5, x + 6, 5.25, -3.5, 0.015, 0x111111);
    B.lamp(-6, 3.6); B.lamp(8, -3.8);
    // montes nevados y nevada
    B.horizon(0xc8d2de, 16, 70, 120, { groundColor: snow });
    sjSnow(MapSys);
    B.stand(-3, 3.0, -12.5, 'dmr'); B.stand(-11, 0.06, 11, 'shotgun');
    B.dom('A', -15, 0, 0, 3.4); B.dom('B', 0, 0, 0, 3.4); B.dom('C', 15, 0, 0, 3.4);
    for (const z of [-14, -9, -5.5, -1.5, 1.5, 5.5, 9, 14]) { B.spawn(0, -21, 0, z, -Math.PI / 2); B.spawn(1, 21, 0, z, Math.PI / 2); }
    for (const [x, z] of [[-12, -10], [-12, 10], [12, -12], [12, 12], [0, -16], [0, 16], [-5, 2], [5, -2], [-18, 0], [18, 0], [-1, -8], [8, 6]]) B.spawn('ffa', x, 0, z);
    B.prop('bucket', -9, 0, 5); B.prop('can', 4, 0, -4.5);
  },
};

// ---------------------------------------------------------------------
// ESTACIÓN CENTRAL: la fachada con la torre del reloj de cuatro esferas, el vestíbulo, tres andenes con marquesina,
// la locomotora y los coches de viajeros, la pasarela sobre las vías y, al sur, el patio de mercancías.
MAPS.estacion = {
  name: { es: 'Estación Central', en: 'Central Station' },
  desc: { es: 'La Estación Central de San Elías: la torre del reloj de cuatro esferas, el vestíbulo, tres andenes con trenes, la pasarela sobre las vías y el patio de mercancías.', en: 'San Elías Central Station: the four-faced clock tower, the concourse, three platforms with trains, the footbridge over the tracks and the goods yard.' },
  thumb: ['#46505f', '#b8a688', '#4a3a2e'],
  theme: { skyTop: 0x4c5868, skyMid: 0xb4aa98, skyBot: 0x7e786c, fog: 0x9a968a, fogNear: 34, fogFar: 190, sun: 0xfff0d8, sunI: 2.2, sunDir: [0.5, 0.55, 0.45], hemiTop: 0xd2d6d8, hemiBot: 0x625e54, hemiI: 1.35, exposure: 1.05 },
  build(B) {
    const H = sjHelpers(B), P = 0.9, stoneF = 0xb8ac94, iron = 0x2e3236;   // P = altura de los andenes
    B.bounds(-46, -32, 46, 32, 24);
    B.ground(-46, -32, 46, 32, { holes: [[-46, -32, 46, -14]], pattern: PAT.DIRT, color: 0x6a6258 });
    B.ground(-46, -32, 46, -14, { pattern: PAT.CONCRETE, color: 0x9a948a });
    // ============ edificio de viajeros: dos alas de dos plantas y el vestíbulo central de doble altura
    const facadeOpen = (n) => { const o = []; for (let k = 0; k < n; k++) { o.push(['win', (k + 0.5) / n, 0, 1.3, 1.0, 3.0]); o.push(['win', (k + 0.5) / n, 1, 1.3, 1.0, 3.0]); } return o; };
    for (const [x0, x1] of [[-40, -10], [10, 40]]) {
      const sOpen = facadeOpen(6); sOpen[x0 < 0 ? 10 : 0] = ['door', x0 < 0 ? 10.5 / 12 : 0.5 / 12, 0, 1.6, 0, 2.6];
      B.house(x0, -30, x1, -16, { floors: 2, h: 4.2, pattern: PAT.BRICK, color: stoneF, parapet: false, roofPat: PAT.ROOF, roofColor: 0x4a4e52, stairs: { side: x0 < 0 ? 'w' : 'e', from: 'n' },
        open: { s: sOpen, n: facadeOpen(6).map((o, i) => (i === 4 ? ['door', o[1], 0, 1.6, 0, 2.6] : o)), w: [['door', 0.5, 0], ['win', 0.5, 1, 1.3, 1.0, 3.0]], e: [['door', 0.5, 0], ['win', 0.5, 1, 1.3, 1.0, 3.0]] } });
      H.gable(x0, -30, x1, -16, 8.65, 2.4, 0x4a4e52, 'x', 0.3);
      B.decoBox(x0 - 0.15, 4.0, -30.15, x1 + 0.15, 4.35, -15.85, 0x9a8e78); B.decoBox(x0 - 0.1, 0, -30.1, x1 + 0.1, 0.8, -15.9, 0x8a8070);
    }
    B.house(-10, -30, 10, -14, { floors: 1, h: 9.0, pattern: PAT.BRICK, color: stoneF, parapet: false, roofPat: PAT.ROOF, roofColor: 0x4a4e52, solidWalls: true, floorPat: PAT.COBBLE, floorColor: 0x8a8274,
      open: { n: [['arch', 0.25, 0, 2.6, 0, 3.6], ['arch', 0.75, 0, 2.6, 0, 3.6], ['win', 0.25, 0, 2.4, 4.6, 7.6], ['win', 0.75, 0, 2.4, 4.6, 7.6]], s: [['arch', 0.2, 0, 3.0, 0, 3.8], ['arch', 0.5, 0, 3.0, 0, 3.8], ['arch', 0.8, 0, 3.0, 0, 3.8]], w: [['door', 0.6, 0, 1.6, 0, 2.6]], e: [['door', 0.6, 0, 1.6, 0, 2.6]] } });
    H.gable(-10, -30, 10, -14, 9.25, 3.2, 0x4a4e52, 'z', 0.3);
    H.signboard(0, 8.0, -14 + 0.03, 0, 9, 0.9, ['ESTACIÓN CENTRAL']);
    // taquillas, bancos y quiosco del vestíbulo
    B.box(-8.5, 0.06, -27.8, -2.5, 1.2, -26.8, { pattern: PAT.WOOD, color: 0x5a3e2a, kind: 'cover' }); B.decoBox(-8.5, 1.2, -27.4, -2.5, 2.6, -27.3, 0x7a6a50);
    for (const [x, z] of [[-6, -20], [6, -20], [-6, -23.5], [6, -23.5]]) B.box(x - 1.6, 0.06, z - 0.3, x + 1.6, 0.5, z + 0.3, { pattern: PAT.WOOD, color: 0x5a3e2a, kind: 'cover' });
    B.box(3, 0.06, -28.2, 6.5, 1.3, -26.6, { pattern: PAT.WOOD, color: 0x3e4a3a, kind: 'cover' });
    // ============ la torre del reloj de cuatro esferas (sobre la puerta norte del vestíbulo)
    const tx = 0, tz = -32.6, tw = 5.2;   // la torre se alza junto a la fachada norte, fuera del área de juego
    B.decoBox(tx - tw / 2, 0, tz - tw / 2, tx + tw / 2, 19, tz + tw / 2, stoneF);
    for (const k of [9, 13.2, 19]) B.decoBox(tx - tw / 2 - 0.15, k, tz - tw / 2 - 0.15, tx + tw / 2 + 0.15, k + 0.35, tz + tw / 2 + 0.15, 0x9a8e78);
    for (const [dx, dz, ry] of [[0, tw / 2 + 0.04, 0], [0, -tw / 2 - 0.04, Math.PI], [tw / 2 + 0.04, 0, Math.PI / 2], [-tw / 2 - 0.04, 0, -Math.PI / 2]]) H.clock(tx + dx, 16, tz + dz, ry, 1.8);
    B.decoBox(tx - 2.2, 19.35, tz - 2.2, tx + 2.2, 22, tz + 2.2, 0x8a8070); B.deco(GEO.cone(3.4, 4.5, 4), tx, 24.2, tz, 0x3e4448, { ry: Math.PI / 4 }); B.deco(GEO.cyl(0.05, 0.05, 2, 5), tx, 27.2, tz, iron);
    B.box(-46, 0, -32.5, 46, 0.1, -32.4, { noRender: true, kind: 'bound' });
    // ============ andenes (0,9 m) con marquesina y vías
    const plat = (z0, z1, x0 = -40, x1 = 40) => {
      B.box(x0, 0, z0, x1, P, z1, { pattern: PAT.CONCRETE, color: 0xa29c90, kind: 'floor' }); B.decoBox(x0, P - 0.02, z1 - 0.35, x1, P + 0.005, z1 - 0.25, 0xd8c860); B.decoBox(x0, P - 0.02, z0 + 0.25, x1, P + 0.005, z0 + 0.35, 0xd8c860);
      for (const x of [x0, x1]) B.stairs(x === x0 ? x0 - 2.88 : x1 + 2.88, (z0 + z1) / 2, x === x0 ? '+x' : '-x', z1 - z0 - 0.2, 0, P, { pattern: PAT.CONCRETE, color: 0x8e887e });
    };
    plat(-14, -10); plat(-1.5, 3.5); plat(11, 14.5);
    for (const z of [-7.8, -3.8, 5.6, 9.2]) H.rail(-46, z, 46, z);
    // marquesina del andén central: columnas de fundición y cubierta a dos aguas
    for (let x = -36; x <= 36; x += 8) { B.box(x - 0.12, P, 0.88, x + 0.12, P + 4.2, 1.12, { pattern: PAT.METAL, color: iron, kind: 'pole' }); B.deco(GEO.cyl(0.24, 0.24, 0.3, 8), x, P + 0.15, 1, iron); }
    B.decoBox(-38, P + 4.2, 0.85, 38, P + 4.4, 1.15, iron); H.gable(-38, -1.8, 38, 3.8, P + 4.4, 0.9, 0x5a5e62, 'x', 0);
    for (let x = -36; x <= 36; x += 18) { B.deco(GEO.cyl(0.05, 0.05, 1.2, 5), x + 4, P + 3.6, 1, iron); H.clock(x + 4, P + 2.8, 1.05, 0, 0.35); H.clock(x + 4, P + 2.8, 0.95, Math.PI, 0.35); }
    // marquesina pegada al edificio sobre el andén 1
    for (let x = -36; x <= 36; x += 8) B.box(x - 0.1, P, -10.6, x + 0.1, P + 3.8, -10.4, { pattern: PAT.METAL, color: iron, kind: 'pole' });
    B.decoBox(-40, P + 3.8, -14, 40, P + 4.0, -10.2, 0x5a5e62);
    // ============ trenes: locomotora de vapor con su ténder (vía 2) y tres coches de viajeros (vía 3)
    const loco = (x0, z) => {
      B.box(x0, 0.25, z - 1.4, x0 + 12, 1.2, z + 1.4, { pattern: PAT.METAL, color: 0x1e2022, kind: 'cover' });
      B.box(x0 + 0.4, 1.2, z - 1.0, x0 + 8, 3.2, z + 1.0, { noRender: true, kind: 'cover' }); B.deco(GEO.cyl(1.1, 1.1, 7.6, 16), x0 + 4.2, 2.3, z, 0x1a1c1e, { rz: Math.PI / 2 });
      for (const [dx, h, r] of [[1.2, 1.4, 0.35], [3.6, 0.8, 0.45], [5.6, 0.6, 0.4]]) B.deco(GEO.cyl(r * 0.8, r, h, 10), x0 + dx, 3.4 + h / 2, z, 0x1a1c1e);
      B.box(x0 + 8, 1.2, z - 1.4, x0 + 12, 4.4, z + 1.4, { pattern: PAT.METAL, color: 0x1e2022, kind: 'cover' }); B.decoBox(x0 + 7.8, 4.4, z - 1.6, x0 + 12.2, 4.6, z + 1.6, 0x2a2a2a);
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) B.deco(GEO.cyl(0.75, 0.75, 0.12, 16), x0 + 2.5 + i * 2.2, 0.75, z + s * 1.42, 0x6a2a20, { rx: Math.PI / 2 });
      B.decoBox(x0 - 0.3, 0.4, z - 1.5, x0, 1.0, z + 1.5, 0xa82a22);
      B.box(x0 + 12.6, 0.25, z - 1.4, x0 + 18, 2.8, z + 1.4, { pattern: PAT.METAL, color: 0x1e2022, kind: 'cover' }); B.decoBox(x0 + 12.8, 2.8, z - 1.2, x0 + 17.8, 3.2, z + 1.2, 0x121212);
      B.smoke(x0 + 1.2, z, 0.25);
    };
    loco(4, -5.8);
    const coach = (x0, z, col) => {
      B.box(x0, 0.5, z - 1.4, x0 + 11, 3.6, z + 1.4, { pattern: PAT.WOOD, color: col, kind: 'container' }); B.decoBox(x0 - 0.1, 3.6, z - 1.5, x0 + 11.1, 3.9, z + 1.5, 0x3a3a3a);
      for (let k = 0; k < 7; k++) for (const s of [-1, 1]) B.decoBox(x0 + 0.8 + k * 1.45, 2.0, z + s * 1.4 - 0.02, x0 + 1.7 + k * 1.45, 3.0, z + s * 1.4 + 0.02, 0x1e2a30);
      for (const dx of [1.8, 9.2]) for (const s of [-1, 1]) B.deco(GEO.cyl(0.45, 0.45, 0.1, 12), x0 + dx, 0.45, z + s * 1.35, 0x222222, { rx: Math.PI / 2 });
    };
    coach(-38, 7.4, 0x5a2a22); coach(-25.6, 7.4, 0x2e4a3a); coach(-13.2, 7.4, 0x5a2a22);
    // ============ pasarela de hierro sobre las vías (del andén 1 al 3)
    const bx = 30, BY = 5.6;
    B.box(bx - 1, BY - 0.25, -10, bx + 1, BY, 14.5, { pattern: PAT.GRATE, color: 0x3a3e42, kind: 'floor' });
    for (const s of [-1, 1]) B.wall('z', -10, 14.5, bx + s * 1.05, BY, 1.1, 0.1, { pattern: PAT.GRATE, color: iron, kind: 'cover' });
    B.stairs(bx, -13.6, '+z', 1.8, P, BY, { pattern: PAT.GRATE, color: 0x3a3e42, solidBase: false });
    B.box(bx - 1, BY - 0.25, -13.9, bx + 1, BY, -10, { pattern: PAT.GRATE, color: 0x3a3e42, kind: 'floor', noRender: true });
    B.stairs(bx + 3.2, 13.5, '-z', 1.8, P, BY, { pattern: PAT.GRATE, color: 0x3a3e42, solidBase: false }); B.box(bx + 1, BY - 0.25, 12.7, bx + 4.2, BY, 14.5, { pattern: PAT.GRATE, color: 0x3a3e42, kind: 'floor' });
    for (const z of [-4, 6]) B.box(bx - 0.2, 0, z - 0.2, bx + 0.2, BY - 0.25, z + 0.2, { pattern: PAT.METAL, color: iron, kind: 'pole' });
    // ============ patio de mercancías (sur): vagones, cajas, aguada, garita de señales
    for (const [x, z, ax] of [[-30, 20, 'x'], [-22, 20, 'x'], [8, 24, 'z'], [24, 20, 'x'], [36, 26, 'z']]) B.container(x, 0, z, ax);
    B.container(-26, 2.6, 20.2, 'x');
    H.rail(-46, 20, 46, 20);
    for (const [x, z, s] of [[-8, 18.5, 1.2], [-6.8, 18.8, 1.0], [-7.6, 19, 0.9], [14, 27, 1.2], [15.2, 27.3, 1.0], [-38, 28, 1.2], [-14, 28, 1.1], [30, 28, 1.1]]) B.crate(x, x === -7.6 ? 1.2 : 0, z, s);
    B.sandbags(-2, 26, 2, 26); B.sandbags(40, 16, 40, 20); B.barrel(18, 0, 24); B.barrel(18.7, 0, 24.4);
    // aguada: depósito sobre cuatro patas
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(-38 + dx * 1.4 - 0.15, 0, 26 + dz * 1.4 - 0.15, -38 + dx * 1.4 + 0.15, 5, 26 + dz * 1.4 + 0.15, { pattern: PAT.METAL, color: iron, kind: 'pole' });
    B.deco(GEO.cyl(2, 2, 2.6, 16), -38, 6.3, 26, 0x4a3a30); B.deco(GEO.cone(2.1, 0.8, 16), -38, 8.0, 26, 0x2a2a2a);
    // garita de señales (dos plantas, se sube por fuera)
    B.house(36, 18.5, 42, 23, { floors: 2, h: 2.8, pattern: PAT.WOOD, color: 0x6a4a32, parapet: false, roofPat: PAT.ROOF, roofColor: 0x3a3a3a, stairs: { side: 'e', from: 's' }, open: { w: [['door', 0.5, 0], ['win', 0.3, 1], ['win', 0.7, 1]], n: [['win', 0.5, 1]], s: [['win', 0.5, 1]] } });
    H.gable(36, 18.5, 42, 23, 5.85, 1.2, 0x3a3a3a, 'z');
    B.deco(GEO.cyl(0.1, 0.1, 6, 6), 33, 3, 17, iron); B.decoBox(32.6, 5.2, 16.9, 34.2, 5.5, 17.1, 0xb02a22);
    for (const [x, z] of [[-40, -12], [0, -12], [40, -12], [-40, 1], [40, 1], [-20, 13], [20, 13], [-30, 24], [26, 26]]) B.lamp(x, z);
    B.horizon(0x7a7466, 22, 95, 150, { groundColor: 0x6e6858 });
    B.smoke(-80, 60, 1.0);
    // ============ A / B / C, armas, apariciones
    B.dom('A', -28, P, 1); B.dom('B', 0, 0, -21, 4.6); B.dom('C', 30, BY, 2, 3.6);
    B.stand(-30, 4.26, -27, 'sniper'); B.stand(38.5, 2.86, 21, 'dmr'); B.stand(0, P, 13, 'lmg'); B.stand(-5.5, 0.06, -26, 'shotgun');
    for (const [x, z] of [[-44, -12], [-44, -6], [-44, -1], [-44, 3], [-44, 9], [-44, 13], [-44, 18], [-44, 24], [-44, 29], [-44, -20]]) B.spawn(0, x, 0, z, -Math.PI / 2);
    for (const [x, z] of [[44, -12], [44, -6], [44, -1], [44, 3], [44, 9], [44, 13], [44, 18], [44, 24], [44, 29], [44, -20]]) B.spawn(1, x, 0, z, Math.PI / 2);
    for (const [x, y, z] of [[-20, P, -12], [20, P, -12], [-10, P, 1], [10, P, 1], [-20, 0, 24], [20, 0, 26], [0, 0, -18], [-30, 0, -24], [30, 0, -24], [0, P, 13], [-34, P, 13], [12, 0, 18]]) B.spawn('ffa', x, y, z);
    B.prop('bucket', -36, 0, 22); B.prop('can', 4, P, 2.5); B.prop('can', -2, 0, -21);
  },
};

// ---------------------------------------------------------------------
// VILLA CORCOVADO: el río parte el pueblo en dos. Al oeste la calle de los Herreros (la casa y el taller de la familia,
// la fragua); al este la estación pequeña con la aguada. El ferrocarril cruza el río por el puente de hierro (al norte)
// y, al sur, un vado de pasaderas. Se puede bajar al cauce por las escaleras de las orillas.
MAPS.corcovado = {
  name: { es: 'Villa Corcovado', en: 'Villa Corcovado' },
  desc: { es: 'El pueblo partido por el río: la calle de los Herreros y la fragua al oeste, la estación al este; el tren cruza por el puente de hierro y abajo, en el cauce, se pelea con el agua por los tobillos.', en: 'The town split by the river: Herreros street and the forge to the west, the station to the east; the train crosses on the iron bridge, and down in the riverbed you fight ankle-deep in water.' },
  thumb: ['#3e5068', '#b8a07a', '#3a4a3a'],
  theme: { skyTop: 0x3e5068, skyMid: 0xc0a888, skyBot: 0x847660, fog: 0x9a8e78, fogNear: 34, fogFar: 195, sun: 0xffd8a8, sunI: 2.3, sunDir: [-0.55, 0.45, -0.45], hemiTop: 0xd0c8b4, hemiBot: 0x5e5a4a, hemiI: 1.35, exposure: 1.05 },
  build(B) {
    const H = sjHelpers(B), R = -2.6, iron = 0x2e3438;   // R = cota del cauce
    B.bounds(-46, -32, 46, 32, 18);
    const river = [-7, -32, 7, 32], street = [-46, -4, -7, 4];
    B.ground(-46, -32, 46, 32, { holes: [river, street], pattern: PAT.DIRT, color: 0x84765a });
    B.ground(...street, { pattern: PAT.COBBLE, color: 0x857d70 });
    B.ground(...river, { y: R, depth: 2, pattern: PAT.DIRT, color: 0x5e5644 });
    sjWater(B, -7, -32, 7, 32, R + 0.35, 0x3e5a5e); sjWater(B, -7, -260, 7, -32, R + 0.35, 0x3e5a5e); sjWater(B, -7, 32, 7, 260, R + 0.35, 0x3e5a5e);
    for (const s of [-1, 1]) B.decoBox(s * 7 - 0.25, R, -32, s * 7 + 0.25, 0.25, 32, 0x7a7466);   // muros de la orilla
    for (const [x, z, w] of [[-3, -8, 1.6], [2, 6, 2.2], [-2, 22, 1.4], [3.5, -26, 1.8]]) B.box(x - w / 2, R, z - w * 0.6, x + w / 2, R + 0.9, z + w * 0.6, { pattern: PAT.CONCRETE, color: 0x6e6a60, kind: 'cover' });   // peñas
    // escaleras para bajar al cauce
    for (const z of [-10, 12]) { B.stairs(-4.1, z, '-x', 1.4, R, 0, { pattern: PAT.CONCRETE, color: 0x7a7466 }); B.stairs(4.1, z, '+x', 1.4, R, 0, { pattern: PAT.CONCRETE, color: 0x7a7466 }); }
    // vado de pasaderas (sur)
    for (let i = 0; i < 6; i++) B.box(-5.5 + i * 2.2, R, 23.4, -4.5 + i * 2.2, R + 0.55, 24.6, { pattern: PAT.CONCRETE, color: 0x8a8478, kind: 'floor' });
    // ============ el puente de hierro del ferrocarril (al norte): tablero, vigas de celosía y pila central
    const bz0 = -21, bz1 = -16;
    B.box(-7.5, -0.5, bz0, 7.5, 0, bz1, { pattern: PAT.METAL, color: 0x3a3e40, kind: 'floor' });
    B.box(-1.2, R, bz0 + 0.5, 1.2, -0.5, bz1 - 0.5, { pattern: PAT.CONCRETE, color: 0x7a7466 });
    for (const z of [bz0 - 0.1, bz1 + 0.1]) {
      B.wall('x', -7.5, 7.5, z, 0, 1.1, 0.16, { pattern: PAT.GRATE, color: iron, kind: 'cover' });
      B.decoBox(-7.5, 3.6, z - 0.12, 7.5, 3.9, z + 0.12, iron);
      for (let k = 0; k < 6; k++) { const xa = -7.5 + k * 2.5, xb = xa + 2.5; H.beam(xa, 0, z, xb, 3.75, z, 0.14, iron); H.beam(xa, 3.75, z, xb, 0, z, 0.1, iron); B.decoBox(xa - 0.08, 0, z - 0.1, xa + 0.08, 3.75, z + 0.1, iron); }
    }
    for (let x = -6; x <= 6; x += 3) B.decoBox(x - 0.08, 3.6, bz0, x + 0.08, 3.75, bz1, iron);
    H.rail(-46, -18.5, 46, -18.5);
    // ============ calle de los Herreros (oeste del río)
    H.house(-44, -15, -36, -4, { street: 's', stairs: { side: 'w', from: 'n' } }); H.house(-34, -14, -27, -4, { street: 's', floors: 1, sides: 'e' });
    // casa de la familia: dos plantas con los relojes; taller anejo con la fragua abierta a la calle
    H.house(-25, -15, -17, -4, { street: 's', color: 0xd8ccb0, sides: 'w', stairs: { side: 'w', from: 'n' } });
    for (let k = 0; k < 4; k++) { B.deco(GEO.cyl(0.18, 0.18, 0.05, 12), -23 + k * 1.6, 1.9, -14.55, 0xe8e0c8, { rx: Math.PI / 2 }); B.deco(GEO.torus(0.19, 0.025, 12, 4), -23 + k * 1.6, 1.9, -14.53, 0x8a6a2a); }
    B.house(-15, -13, -9, -4, { floors: 1, h: 3.4, pattern: PAT.BRICK, color: 0x7a6a5a, parapet: false, roofPat: PAT.ROOF, roofColor: 0x4a3a2e, open: { s: [['big', 0.5, 0, 3.6]], w: [['door', 0.5, 0]] } });
    H.gable(-15, -13, -9, -4, 3.65, 1.2, 0x5a3a2a, 'x'); H.signboard(-12, 2.85, -3.93, 0, 3.2, 0.5, ['FRAGUA']);
    B.box(-14, 0.06, -11.6, -12, 1.0, -10.4, { pattern: PAT.BRICK, color: 0x5a3a2a, kind: 'cover' }); B.decoBox(-13.4, 1.0, -11.2, -12.6, 1.05, -10.8, 0xd86a2a);
    B.box(-11, 0.06, -8, -10.2, 0.8, -7.6, { pattern: PAT.METAL, color: 0x2a2a2a, kind: 'cover' }); B.decoBox(-11.3, 0.8, -8.05, -9.9, 0.98, -7.55, 0x2a2a2a);
    H.house(-44, 4, -38, 14, { street: 'n', floors: 1 }); H.house(-36, 4, -28, 15, { street: 'n', stairs: { side: 'e', from: 's' } });
    H.house(-26, 4, -20, 13, { street: 'n', floors: 1, sides: 'e' }); H.house(-18, 4, -10, 14, { street: 'n', color: 0xc8a46a, sides: 'w', stairs: { side: 'e', from: 's' } });
    H.signboard(-30.5, 3.0, -3.9, 0, 4.4, 0.45, ['CALLE DE LOS HERREROS'], '#e2dac6');
    for (const x of [-40, -26, -12]) B.lamp(x, x === -26 ? 3.6 : -3.6);
    H.cart(-32, 1.4); B.crate(-22, 0, 2.8, 1.0); B.crate(-21.2, 0, 3.4, 0.8); B.barrel(-38, 0, -3.2); B.sandbags(-16, -1.5, -16, 1.5);
    // huertos y lavadero junto al río (oeste, sur)
    for (const [a, b, c, d] of [[-44, -30, 18, 30], [-26, -12, 18, 30]]) { H.dry('x', a, b, c, 0.9, { open: [{ type: 'door', at: (a + b) / 2, w: 2 }] }); H.dry('z', c, d, b, 0.9); for (let x = a + 1.2; x < b - 0.8; x += 1.4) for (let z = c + 1.4; z < d - 0.8; z += 0.9) if (B.rng.next() < 0.8) B.deco(GEO.sphere(0.32, 5, 4), x, 0.16, z, shade(0x6c7a36, B.rng.range(-0.12, 0.1))); }
    B.house(-40, -30, -32, -22, { floors: 1, h: 3.2, pattern: PAT.WOOD, color: 0x6a5038, parapet: false, roofPat: PAT.ROOF, roofColor: 0x5a4a3a, open: { e: [['big', 0.5, 0, 3]], s: [['win', 0.5, 0]] } }); H.gable(-40, -30, -32, -22, 3.45, 1.4, 0x5e4a36, 'z');
    for (const [x, z, s] of [[-28, -26, 1], [-18, -28, 0.9], [-10, 26, 1.0], [-44, 0, 0.8]]) B.tree(x, z, s);
    // ============ este del río: estación pequeña, aguada, almacén y casas
    B.box(12, 0, -24, 40, 0.9, -21.2, { pattern: PAT.CONCRETE, color: 0xa29c90, kind: 'floor' }); B.stairs(9.1, -22.6, '+x', 2.6, 0, 0.9, { pattern: PAT.CONCRETE, color: 0x8e887e });
    H.lift(0.9, () => {
      B.house(18, -31, 32, -24, { floors: 1, h: 3.8, pattern: PAT.BRICK, color: 0xc8b896, parapet: false, roofPat: PAT.ROOF, roofColor: 0x5a3a2a, floorH: 0,
        open: { s: [['door', 0.3, 0], ['door', 0.7, 0], ['win', 0.12, 0], ['win', 0.5, 0], ['win', 0.88, 0]], w: [['door', 0.5, 0]], e: [['win', 0.5, 0]], n: [['win', 0.3, 0], ['win', 0.7, 0]] } });
      H.gable(18, -31, 32, -24, 4.05, 1.6, 0x7a4430, 'x');
      B.box(20, 0, -29.5, 24, 1.1, -28.6, { pattern: PAT.WOOD, color: 0x5a3e2a, kind: 'cover' });
    });
    B.box(18, 0, -31, 32, 0.9, -24, { pattern: PAT.CONCRETE, color: 0x8a8478, kind: 'floor' });
    H.signboard(25, 4.0, -23.93, 0, 4.2, 0.6, ['CORCOVADO']);
    H.clock(25, 3.0 + 0.9, -23.95, 0, 0.45);
    for (const x of [14, 24, 36]) B.box(x - 0.1, 0.9, -21.9, x + 0.1, 4.3, -21.7, { pattern: PAT.METAL, color: iron, kind: 'pole' });
    B.decoBox(12, 4.3, -24, 40, 4.45, -21.2, 0x4a4e52);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) B.box(42 + dx * 1.3 - 0.15, 0, -26 + dz * 1.3 - 0.15, 42 + dx * 1.3 + 0.15, 4.6, -26 + dz * 1.3 + 0.15, { pattern: PAT.METAL, color: iron, kind: 'pole' });
    B.deco(GEO.cyl(1.9, 1.9, 2.4, 16), 42, 5.8, -26, 0x4a3a30); B.deco(GEO.cone(2.0, 0.7, 16), 42, 7.35, -26, 0x2a2a2a);
    H.wagon(20, -18.5); H.wagon(22, -18.5); B.container(-30, 0, -18.5, 'x'); B.container(34, 0, -18.5, 'x');
    B.house(14, -10, 28, 2, { floors: 1, h: 4.6, pattern: PAT.WOOD, color: 0x6a4a32, parapet: false, roofPat: PAT.ROOF, roofColor: 0x3a3a3a, open: { w: [['big', 0.5, 0, 3.4]], e: [['big', 0.5, 0, 3.4]], s: [['door', 0.5, 0]], n: [['win', 0.3, 0], ['win', 0.7, 0]] } });
    H.gable(14, -10, 28, 2, 4.85, 1.6, 0x3a3a3a, 'z'); H.signboard(13.93, 3.9, -4, -Math.PI / 2, 3.0, 0.5, ['ALMACÉN'], '#d9cfb6');
    for (const [x, z, s] of [[17, -7, 1.2], [18.2, -7.3, 1.0], [24, -1, 1.2], [25, -0.6, 1.0], [24.4, -0.9, 0.9]]) B.crate(x, x === 24.4 ? 1.2 : 0.06, z, s);
    H.house(30, -8, 38, 2, { street: 'w', stairs: { side: 'e', from: 'n' } }); H.house(14, 8, 22, 18, { street: 'w', floors: 1, sides: 'n' }); H.house(26, 8, 36, 17, { street: 'n', stairs: { side: 'e', from: 's' }, color: 0xc99c88 });
    H.house(30, 22, 40, 30, { street: 'n', floors: 1 });
    for (const [x, z] of [[11, -12], [11, 6], [24, 20], [40, -14]]) B.lamp(x, z);
    H.cart(20, 22, 'z'); B.sandbags(10, -8, 10, -4); B.sandbags(10, 4, 10, 8); B.sandbags(40, 4, 44, 4); B.crate(42, 0, 12, 1.1); B.barrel(12, 0, 24); B.barrel(12.7, 0, 24.4);
    for (const [x, z, s] of [[16, 28, 1.0], [44, 28, 0.9], [44, 18, 0.85]]) B.tree(x, z, s);
    B.horizon(0x6e7a5a, 22, 95, 150, { groundColor: 0x6a6a4e });
    B.smoke(80, -70, 1.0);
    // ============ A / B / C, armas, apariciones (oeste: la calle; este: la estación)
    B.dom('A', -28, 0, 0); B.dom('B', 0, R, 0, 4.6); B.dom('C', 22, 0, -4);
    B.stand(-21, 3.1, -9, 'sniper'); B.stand(32, 3.1, 12, 'dmr'); B.stand(0, R, -6, 'shotgun'); B.stand(21, 0.06, -4, 'lmg');
    for (const [x, z] of [[-44, -2], [-44, 2], [-44, -20], [-44, 20], [-44, 30], [-44, -28], [-36, -18], [-34, 18], [-45, 10], [-45, -10]]) B.spawn(0, x, 0, z, -Math.PI / 2);
    for (const [x, z] of [[44, -2], [44, 2], [44, -18], [44, 22], [44, 30], [44, -30], [38, -14], [40, 14], [45, 8], [45, -8]]) B.spawn(1, x, 0, z, Math.PI / 2);
    for (const [x, y, z] of [[-30, 0, -20], [-30, 0, 18], [0, R, -4], [0, R, 14], [20, 0, -14], [20, 0, 6], [-12, 0, 0], [12, 0, 0], [-40, 0, 24], [40, 0, 20], [26, 0.9, -22.6], [-20, 0, 26]]) B.spawn('ffa', x, y, z);
    B.prop('bucket', -11, 0, -2); B.prop('can', 16, 0, 4);
  },
};
MAP_ORDER.splice(0, MAP_ORDER.length, 'pueblo', 'base', 'muelle', 'estacion', 'corcovado', 'patio', 'bunker', 'cruce');
