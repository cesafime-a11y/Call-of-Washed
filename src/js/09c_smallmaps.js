// ---- 09c_smallmaps.js ----
// =====================================================================
// MAPAS PEQUEÑOS Y FRENÉTICOS (30–40 m) — Patio de contenedores, Búnker
// y Cruce de gasolinera. Pensados para duelos rápidos: de cualquier
// aparición se llega al centro en pocos segundos y no hay donde esconderse.
// =====================================================================
MAPS.patio = {
  name: { es: 'Andenes de mercancías', en: 'Goods Sidings' },
  desc: { es: 'Pequeño y frenético (38 × 30 m): los andenes de mercancías de la Estación Central, una explanada entre dos muelles de vagones.', en: 'Small and frantic (38 × 30 m): the Central Station goods sidings, an open yard between two freight-car platforms.' },
  small: true,
  thumb: ['#35404f', '#c08a5a', '#5b5a54'],
  theme: { skyTop: 0x33404f, skyMid: 0xc4906a, skyBot: 0x8a7a66, fog: 0x9a8872, fogNear: 26, fogFar: 150, sun: 0xffc48a, sunI: 2.5, sunDir: [-0.5, 0.35, 0.6], hemiTop: 0xd2c2ae, hemiBot: 0x5e5648, hemiI: 1.35, exposure: 1.05 },
  build(B) {
    B.bounds(-19, -15, 19, 15);
    B.ground(-19, -15, 19, 15, { pattern: PAT.CONCRETE, color: 0x86847c });
    B.box(-19, 0, -15, 19, 0.2, -14.5, { pattern: PAT.HAZARD, color: 0x86847c, kind: 'cover' }); B.box(-19, 0, 14.5, 19, 0.2, 15, { pattern: PAT.HAZARD, color: 0x86847c, kind: 'cover' });
    // contenedores del perímetro (a los lados) y fondo del patio
    for (const [x, z] of [[-13, -13.7], [13, -13.7], [-13, 13.7], [13, 13.7]]) { B.container(x, 0, z, 'x'); B.container(x + (x < 0 ? 1 : -1) * 0.4, 2.6, z, 'x'); }
    B.container(-3.5, 0, -13.7, 'x', 0x2e5a7a); B.container(3.5, 0, 13.7, 'x', 0x8b3a2a);
    // grupos de contenedores a cada lado de la plaza
    for (const s of [-1, 1]) {
      B.container(s * 7.5, 0, -5.6, 'z'); B.container(s * 7.5, 0, 5.6, 'z');
      B.crate(s * 5.4, 0, -2.4, 1.3); B.crate(s * 5.4, 0, 2.4, 1.3); B.crate(s * 5.4, 1.3, 2.4, 1.1);
      B.sandbags(s * 13.6, -8, s * 13.6, -3.6); B.sandbags(s * 13.6, 3.6, s * 13.6, 8);
      B.barrel(s * 12, 0, -11); B.barrel(s * 12.8, 0, -11.2); B.barrel(s * 11.5, 0, 11);
    }
    // plataformas norte y sur con escalera hacia la plaza (francotirador / escopeta)
    for (const s of [-1, 1]) {
      B.container(0, 0, s * 9.4, 'x', s < 0 ? 0x6d7a3a : 0xa4772a);
      B.stairs(0, s * 5.3, s < 0 ? '-z' : '+z', 1.4, 0, 2.6, { pattern: PAT.GRATE, color: 0x9a9da0, solidBase: false });
      B.crate(-2.3, 2.6, s * 9.4, 1.0); B.crate(2.3, 2.6, s * 9.4, 1.0);
      B.sandbags(-2.9, s * 8.65, -0.95, s * 8.65, { y: 2.6, h: 0.8 }); B.sandbags(0.95, s * 8.65, 2.9, s * 8.65, { y: 2.6, h: 0.8 });
      B.sandbags(-2.1, s * 3.4, -0.95, s * 3.4, { h: 0.9 }); B.sandbags(0.95, s * 3.4, 2.1, s * 3.4, { h: 0.9 });
      B.crate(-s * 3.5, 0, s * 12.3, 1.2); B.barrel(-s * 5.2, 0, s * 12.6);
    }
    B.stand(0, 2.6, -9.4, 'dmr'); B.stand(0, 2.6, 9.4, 'shotgun');
    B.dom('A', -11.2, 0, 0, 3.4); B.dom('B', 0, 0, 0, 3.4); B.dom('C', 11.2, 0, 0, 3.4);
    for (const x of [-17, 17]) { B.lamp(x, -13.5); B.lamp(x, 13.5); }
    B.smoke(-40, 60, 0.9);
    B.horizon(0x6a6e72, 14, 70, 120, { groundColor: 0x6e6c64 });
    for (const z of [-9, -5.8, -2.6, 0.6, 3.8, 7, 10.2]) { B.spawn(0, -17.4, 0, z, -Math.PI / 2); B.spawn(1, 17.4, 0, z, Math.PI / 2); }
    for (const [x, z] of [[-10, -9.5], [-10, 9.5], [10, -9.5], [10, 9.5], [0, -12.8], [0, 12.8], [-3.6, -0.6], [3.6, 0.6], [-4.4, 4.2], [4.4, -4.2], [-15, 0], [15, 0]]) B.spawn('ffa', x, 0, z);
    B.prop('tire', -9.4, 0, -1.4); B.prop('can', 10.2, 0, 3.4); B.prop('bucket', 2.4, 0, -3.1);
  },
};

MAPS.bunker = {
  name: { es: 'Búnker costero', en: 'Coastal Bunker' },
  desc: { es: 'Pequeño y frenético (36 × 28 m): un búnker de hormigón con tres salas, techo accesible y muros que se pueden volar.', en: 'Small and frantic (36 × 28 m): a concrete bunker with three rooms, a walkable roof and walls you can blow open.' },
  small: true,
  thumb: ['#4a3a3a', '#d08a5a', '#7a6a50'],
  theme: { skyTop: 0x3a3440, skyMid: 0xd0885a, skyBot: 0x9a7058, fog: 0xa88468, fogNear: 24, fogFar: 140, sun: 0xffa868, sunI: 2.6, sunDir: [0.55, 0.28, 0.5], hemiTop: 0xd8b898, hemiBot: 0x5e4a3c, hemiI: 1.3, exposure: 1.05 },
  build(B) {
    B.bounds(-18, -14, 18, 14);
    B.ground(-18, -14, 18, 14, { pattern: PAT.DIRT, color: 0x8e7c5c });
    // búnker central: tres salas (oeste, centro, este) con puertas y troneras; paredes gruesas y destruibles
    const cc = 0x8a867c;
    B.house(-8, -5, 8, 5, { floors: 1, h: 3.4, t: 0.45, wallHp: 240, pattern: PAT.CONCRETE, color: cc, floorPat: PAT.CONCRETE, floorColor: 0x77756e, parapet: false, roofPat: PAT.CONCRETE, roofColor: 0x6e6b64,
      open: { w: [['door', 0.5, 0]], e: [['door', 0.5, 0]],
        n: [['door', 0.18, 0], ['slit', 0.5, 0], ['slit', 0.34, 0], ['slit', 0.66, 0], ['door', 0.82, 0]], s: [['door', 0.18, 0], ['slit', 0.5, 0], ['slit', 0.34, 0], ['slit', 0.66, 0], ['door', 0.82, 0]] } });
    for (const x of [-2.75, 2.75]) B.wall('z', -4.55, 4.55, x, 0.06, 3.4, 0.3, { pattern: PAT.CONCRETE, color: cc, hp: 200, open: [{ type: 'door', at: 0, w: 1.3 }, { type: 'slit', at: -3.2 }, { type: 'slit', at: 3.2 }] });
    B.crate(-5.4, 0.06, -3, 1.2); B.crate(-5.4, 0.06, 3, 1.2); B.crate(0, 0.06, -3.2, 1.3); B.crate(0, 0.06, 3.2, 1.3); B.crate(5.4, 0.06, -3, 1.2); B.crate(5.4, 0.06, 3, 1.2);
    B.barrel(-6.8, 0.06, 0.8); B.barrel(6.8, 0.06, -0.8);
    // accesos al techo (norte y sur) y cobertura de sacos arriba
    B.stairs(-4.5, -9.2, '+z', 1.3, 0, 3.65, { pattern: PAT.CONCRETE, color: 0x6e6b64, solidBase: false });
    B.stairs(4.5, 9.2, '-z', 1.3, 0, 3.65, { pattern: PAT.CONCRETE, color: 0x6e6b64, solidBase: false });
    for (const s of [-1, 1]) { B.sandbags(-3.4, s * 4.3, 3.4, s * 4.3, { y: 3.65, h: 0.8 }); B.sandbags(-s * 5.0, s * 4.3, -s * 7.6, s * 4.3, { y: 3.65, h: 0.8 }); }
    B.crate(0, 3.65, 0, 1.0);
    B.stand(0, 3.65, -2.4, 'dmr'); B.stand(0, 0.06, -1.6, 'lmg');
    // exteriores: barreras de concreto, sacos, un jeep destruido y erizos
    for (const s of [-1, 1]) {
      B.box(s * 12.5 - 0.35, 0, -9.6, s * 12.5 + 0.35, 1.0, -6.6, { pattern: PAT.CONCRETE, color: 0x9a978f, kind: 'cover' });
      B.box(s * 12.5 - 0.35, 0, 6.6, s * 12.5 + 0.35, 1.0, 9.6, { pattern: PAT.CONCRETE, color: 0x9a978f, kind: 'cover' });
      B.sandbags(s * 15.4, -2.5, s * 15.4, 2.5, { h: 1.0 });
      B.sandbags(s * 10.2, -12.2, s * 13.8, -12.2); B.sandbags(s * 10.2, 12.2, s * 13.8, 12.2);
      B.barrel(s * 14.6, 0, -11.2); B.barrel(s * 14.6, 0, 11.2);
      B.crate(s * 10.2, 0, -3.2, 1.3); B.crate(s * 10.2, 0, 3.2, 1.3);
      B.wire(s * 13.4, -8.6, s * 13.4, -5.2); B.wire(s * 13.4, 5.2, s * 13.4, 8.6);
    }
    B.car(-1.5, -11.5, 0, 0x4a4a36); B.car(2, 11.5, 1, 0x4a4036);
    B.sandbags(-8.4, -8, -8.4, -6.2); B.sandbags(8.4, 6.2, 8.4, 8);
    B.dom('A', -13, 0, 0, 3.4); B.dom('B', 0, 0.06, 0, 3.6); B.dom('C', 13, 0, 0, 3.4);
    B.lamp(-16.5, -12.5); B.lamp(16.5, 12.5); B.lamp(-16.5, 12.5); B.lamp(16.5, -12.5);
    B.smoke(-50, -50, 1.0); B.smoke(70, 40, 0.8);
    B.horizon(0x7a6a5a, 14, 70, 120, { groundColor: 0x7a6c54 });
    for (const z of [-9, -6, -3, 0, 3, 6, 9]) { B.spawn(0, -16.6, 0, z, -Math.PI / 2); B.spawn(1, 16.6, 0, z, Math.PI / 2); }
    for (const [x, z] of [[-12, -10], [-12, 10], [12, -10], [12, 10], [0, -12], [0, 12], [-5, 0], [5, 0], [-7.5, -9], [7.5, 9], [-7.5, 9], [7.5, -9]]) B.spawn('ffa', x, 0, z);
    B.prop('tire', -11, 0, 4.4); B.prop('can', 11, 0, -4.4); B.prop('bucket', 0.4, 0, -8);
  },
};

// el nombre real del búnker es de la Parte IV: como en la fase 0, el HTML no lleva datos de las Partes III–V;
// lo pondrá la fase de la Parte IV detrás del Modo lector (≥ IV)
// 3.3.0: el Paso de los Ciegos se rehízo con nieve y aduana (09h_novela_b.js)
MAP_ORDER.push('patio', 'bunker', 'cruce');

