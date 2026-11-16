// ---- 09b_mapdefs.js ----
// =====================================================================
// MAPAS BÉLICOS — Pueblo tomado, Base Halcón, Muelle de carga.
// Tierra firme, tres carriles, puntos A/B/C, zonas de aparición por equipo
// y alturas para francotirador. Nada aleatorio afecta al juego.
// =====================================================================

// espejo en X (oeste ↔ este) para casas: intercambia lados e/w y fracciones de n/s
function mirrorHouseX(o) {
  const op = o.open || {}, m = {};
  const flip = (arr) => (arr || []).map((a) => { const b = a.slice(); b[1] = 1 - b[1]; return b; });
  m.n = flip(op.n); m.s = flip(op.s); m.e = op.w; m.w = op.e;
  const st = o.stairs ? { ...o.stairs } : undefined;
  if (st) { if (st.side === 'e') st.side = 'w'; else if (st.side === 'w') st.side = 'e'; if (st.from === 'w') st.from = 'e'; else if (st.from === 'e') st.from = 'w'; }
  return { ...o, open: m, stairs: st };
}
function mirrorHouseZ(o) {
  const op = o.open || {}, m = {};
  const flip = (arr) => (arr || []).map((a) => { const b = a.slice(); b[1] = 1 - b[1]; return b; });
  m.e = flip(op.e); m.w = flip(op.w); m.n = op.s; m.s = op.n;
  const st = o.stairs ? { ...o.stairs } : undefined;
  if (st) { if (st.side === 'n') st.side = 's'; else if (st.side === 's') st.side = 'n'; if (st.from === 'n') st.from = 's'; else if (st.from === 's') st.from = 'n'; }
  return { ...o, open: m, stairs: st };
}
function houseX(B, s, x0, z0, x1, z1, o) { if (s > 0) B.house(x0, z0, x1, z1, o); else B.house(-x1, z0, -x0, z1, mirrorHouseX(o)); }
function houseZ(B, s, x0, z0, x1, z1, o) { if (s > 0) B.house(x0, z0, x1, z1, o); else B.house(x0, -z1, x1, -z0, mirrorHouseZ(o)); }

const MAPS = {
  // -------------------------------------------------------------------
  pueblo: {
    name: { es: 'San Juan de las Minas', en: 'San Juan de las Minas' },
    desc: { es: 'Pueblo minero de calle empedrada: camiones quemados, casas de dos pisos y un campanario para el tirador.', en: 'Mining town on a cobbled street: burnt trucks, two-storey houses and a bell tower for the marksman.' },
    thumb: ['#4a5466', '#c9a27a', '#6e5d4a'],
    theme: { skyTop: 0x46505f, skyMid: 0xc49c74, skyBot: 0x8a765e, fog: 0x9c8870, fogNear: 30, fogFar: 185, sun: 0xffcf9a, sunI: 2.4, sunDir: [-0.62, 0.42, 0.38], hemiTop: 0xd6c6ae, hemiBot: 0x6a5e4c, hemiI: 1.3, exposure: 1.05 },
    build(B) {
      const C = B.C, st = { pattern: PAT.CONCRETE, color: 0x8f8a80 };
      B.bounds(-50, -34, 50, 34);
      const street = [-50, -4.5, 50, 4.5], plaza = [-10, 6, 10, 19];
      B.ground(-50, -34, 50, 34, { holes: [street, plaza], pattern: PAT.DIRT, color: 0x86765a });
      B.ground(...street, { pattern: PAT.ASPHALT, color: C.asphalt });
      B.ground(...plaza, { pattern: PAT.COBBLE, color: 0x8a8274 });
      // aceras
      B.box(-50, 0, -6, 50, 0.15, -4.5, st);
      B.box(-50, 0, 4.5, -10, 0.15, 6, st); B.box(10, 0, 4.5, 50, 0.15, 6, st);
      // líneas de la calle (decoración)
      for (let x = -48; x < 48; x += 6) B.decoBox(x, 0.005, -0.08, x + 3, 0.02, 0.08, 0xb8b090);
      // casas del norte y del sur, espejadas
      for (const s of [-1, 1]) {
        houseX(B, s, 38, -14, 46, -6.5, { floors: 2, stairs: { side: 'e', from: 'n' }, open: { s: [['door', 0.7, 0], ['win', 0.25, 0], ['win', 0.25, 1], ['win', 0.7, 1]], n: [['door', 0.5, 0], ['win', 0.5, 1]], w: [['win', 0.5, 0], ['win', 0.5, 1]], e: [['win', 0.4, 1]] } });
        houseX(B, s, 27, -14, 35, -6.5, { floors: 1, ruin: true, open: { s: [['door', 0.5, 0], ['hole', 0.15, 0]], n: [['win', 0.6, 0]], w: [['hole', 0.4, 0]], e: [['door', 0.4, 0]] } });
        houseX(B, s, 16, -15, 24, -6.5, { floors: 2, stairs: { side: 'n', from: 'e' }, open: { s: [['door', 0.35, 0], ['win', 0.75, 0], ['win', 0.75, 1], ['win', 0.3, 1]], w: [['door', 0.6, 0], ['win', 0.4, 1]], n: [['win', 0.5, 0]], e: [['win', 0.5, 1]] } });
        houseX(B, s, 3, -15, 12, -6.5, { floors: 2, stairs: { side: 'w', from: 'n' }, open: { s: [['door', 0.5, 0], ['win', 0.8, 0], ['win', 0.2, 1], ['win', 0.5, 1], ['win', 0.8, 1]], e: [['door', 0.7, 0], ['win', 0.4, 1]], n: [['door', 0.5, 0], ['win', 0.5, 1]] } });
        houseX(B, s, 38, 6.5, 46, 14, { floors: 1, open: { n: [['door', 0.5, 0], ['win', 0.2, 0], ['win', 0.8, 0]], s: [['door', 0.5, 0]], w: [['win', 0.5, 0]] } });
        houseX(B, s, 25, 6.5, 35, 15, { floors: 2, stairs: { side: 's', from: 'e' }, open: { n: [['door', 0.65, 0], ['win', 0.25, 0], ['win', 0.7, 1], ['win', 0.25, 1]], s: [['door', 0.4, 0]], e: [['win', 0.5, 1]], w: [['door', 0.5, 0], ['win', 0.5, 1]] } });
        houseX(B, s, 13, 6.5, 22, 14, { floors: 1, ruin: true, open: { n: [['hole', 0.7, 0], ['door', 0.3, 0]], w: [['door', 0.5, 0]], e: [['hole', 0.5, 0]] } });
        // patios traseros: muros bajos de piedra, sacos, árboles
        const X = (v) => s * v;
        B.wall('x', Math.min(X(46), X(30)), Math.max(X(46), X(30)), -22, 0, 1.1, 0.45, { pattern: PAT.BRICK, color: 0x9a8a72, kind: 'cover', open: [{ type: 'door', at: X(38), w: 2 }] });
        B.wall('x', Math.min(X(26), X(14)), Math.max(X(26), X(14)), -21, 0, 1.1, 0.45, { pattern: PAT.BRICK, color: 0x9a8a72, kind: 'cover', open: [{ type: 'door', at: X(20), w: 1.8 }] });
        B.wall('x', Math.min(X(46), X(28)), Math.max(X(46), X(28)), 22, 0, 1.1, 0.45, { pattern: PAT.BRICK, color: 0x9a8a72, kind: 'cover', open: [{ type: 'door', at: X(34), w: 2 }] });
        B.sandbags(X(30), -28, X(33), -28); B.sandbags(X(29.6), -27.4, X(29.6), -25.2);
        B.tank(X(20), -28, 0);
        B.tree(X(42), -26, 1.0); B.tree(X(36), -31, 0.9); B.deadTree(X(12), -24); B.tree(X(44), 28, 1.1); B.deadTree(X(24), 27);
        B.car(X(30), 27, 1, 0x5a4a3a); B.crate(X(18), 0, 24, 1.2); B.crate(X(18.9), 0, 25.1, 1.0); B.crate(X(18.3), 1.2, 24.3, 0.9);
        B.sandbags(X(14), 30, X(18), 30); B.wire(X(36), 30.5, X(46), 30.5);
        B.wire(X(4), -31, X(12), -31);
        // calle: autos quemados, barricadas, barriles
        B.car(X(36), -2, 0, 0x5b4636); B.car(X(17), 2, 0, 0x3e4a52);
        B.sandbags(X(24), -4.4, X(24), -0.4); B.wire(X(26), 0.4, X(26), 4.2);
        B.barrel(X(34.5), 0, 2.6); B.barrel(X(35.2), 0, 3.2); B.barrel(X(10), 0, -3.6);
        B.crate(X(12.5), 0, 3.4, 1.1); B.crate(X(42), 0, 3.8, 1.1);
        for (const lx of [8, 20, 32, 44]) { B.lamp(X(lx), -5.4); }
        B.rubble(X(30), -4.2, 1.0); B.rubble(X(8), 5.2, 0.8);
        // aparición
        const team = s < 0 ? 0 : 1, ex = X(46);
        for (const [x, z] of [[47, -2], [47, 2], [45, -18], [45, 18], [47.5, -26], [47.5, 26], [43, -28], [43, 29], [48.8, -3.8], [48.8, 3.8]]) B.spawn(team, X(x), 0, z, s < 0 ? -Math.PI / 2 : Math.PI / 2);
        void ex;
      }
      // plaza: fuente destruida, bancas, árboles
      B.box(-1.8, 0, 12.4, 1.8, 0.75, 16, { pattern: PAT.CONCRETE, color: 0xa39d90, kind: 'cover' });
      B.box(-0.4, 0.75, 13.8, 0.4, 1.9, 14.6, { pattern: PAT.CONCRETE, color: 0x9a948a, kind: 'cover' });
      B.rubble(2.6, 15.2, 0.9);
      B.sandbags(-6.5, 8.6, -3.5, 8.6); B.sandbags(3.5, 8.6, 6.5, 8.6);
      B.deadTree(-7.5, 11); B.deadTree(7.5, 11);
      B.box(-7.8, 0, 16.8, -5.2, 0.45, 17.4, { pattern: PAT.WOOD, color: 0x5a4430, kind: 'cover' }); B.box(5.2, 0, 16.8, 7.8, 0.45, 17.4, { pattern: PAT.WOOD, color: 0x5a4430, kind: 'cover' });
      // iglesia en ruinas con campanario
      B.house(-8, 19, 8, 31, { floors: 1, h: 8.0, ruin: true, pattern: PAT.BRICK, color: 0xa08c74, floorPat: PAT.COBBLE, floorColor: 0x7a7468,
        open: { n: [['arch', 0.5, 0, 2.4, 0, 3.2]], s: [['door', 0.5, 0]], w: [['win', 0.25, 0, 1.3, 3.0, 5.2], ['win', 0.5, 0, 1.3, 3.0, 5.2], ['win', 0.75, 0, 1.3, 3.0, 5.2], ['door', 0.5, 0]], e: [['win', 0.25, 0, 1.3, 3.0, 5.2], ['win', 0.75, 0, 1.3, 3.0, 5.2], ['door', 0.5, 0]] } });
      for (let i = 0; i < 4; i++) { B.box(-5.6, 0, 21.8 + i * 2, -1.2, 0.5, 22.3 + i * 2, { pattern: PAT.WOOD, color: 0x5a4430, kind: 'cover' }); B.box(1.2, 0, 21.8 + i * 2, 5.6, 0.5, 22.3 + i * 2, { pattern: PAT.WOOD, color: 0x5a4430, kind: 'cover' }); }
      B.box(-2, 0, 29, 2, 1.0, 30.2, { pattern: PAT.CONCRETE, color: 0xb0a690, kind: 'cover' });
      // campanario (plataforma a 6.3 m)
      const TX0 = 9, TX1 = 13, TZ0 = 20, TZ1 = 24, TH = 11.5, tw = 0.3, stone = { pattern: PAT.BRICK, color: 0x9a8670 };
      B.box(TX0 + tw, 0, TZ0 + tw, TX1 - tw, 6.05, TZ1 - tw, stone);
      B.box(TX0 + tw, 6.05, TZ0 + tw, TX1 - tw, 6.3, TZ1 - tw, { pattern: PAT.WOOD, color: 0x5e4630, kind: 'floor' });
      B.wall('x', TX0, TX1, TZ0 + tw / 2, 0, TH, tw, { ...stone, open: [{ type: 'arch', at: 11, w: 1.8, y0: 7.2, y1: 9.3 }] });
      B.wall('x', TX0, TX1, TZ1 - tw / 2, 0, TH, tw, { ...stone, open: [{ type: 'door', at: 9.85, w: 1.1, y0: 6.3, y1: 8.6 }, { type: 'win', at: 12, w: 1.2, y0: 7.2, y1: 9.3 }] });
      B.wall('z', TZ0 + tw, TZ1 - tw, TX0 + tw / 2, 0, TH, tw, { ...stone, open: [{ type: 'win', at: 22, w: 1.6, y0: 7.2, y1: 9.3 }] });
      B.wall('z', TZ0 + tw, TZ1 - tw, TX1 - tw / 2, 0, TH, tw, { ...stone, open: [{ type: 'win', at: 22, w: 1.6, y0: 7.2, y1: 9.3 }] });
      B.box(TX0 - 0.2, TH, TZ0 - 0.2, TX1 + 0.2, TH + 0.3, TZ1 + 0.2, { pattern: PAT.CONCRETE, color: 0x7e7466 });
      B.deco(GEO.cone(3.1, 3.4, 4), 11, TH + 2.0, 22, 0x6a4a3a, { ry: Math.PI / 4 });
      B.deco(GEO.cyl(0.45, 0.6, 0.8, 8), 11, 10.2, 22, 0x8a6a2a);
      B.stairs(9.85, 31.2, '-z', 1.1, 0, 6.3, { pattern: PAT.CONCRETE, color: 0x8f8678 });
      B.box(9.3, 6.05, 24.0, 10.4, 6.3, 24.5, { pattern: PAT.CONCRETE, color: 0x8f8678 });
      // granero central del norte (lanzacohetes adentro)
      B.house(-7, -31, 7, -21, { floors: 1, h: 4.6, pattern: PAT.WOOD, color: 0x6a5038, roofPat: PAT.ROOF, roofColor: 0x6e3e2e, parapet: false,
        open: { s: [['big', 0.5, 0, 3.6]], n: [['big', 0.5, 0, 3.6]], w: [['win', 0.5, 0]], e: [['win', 0.5, 0]] } });
      B.crate(-4.5, 0, -28.5, 1.2); B.crate(-4.5, 1.2, -28.5, 1.0); B.crate(4.4, 0, -23.4, 1.2); B.crate(5.4, 0, -23.6, 1.0);
      B.box(-3.0, 0, -26.6, 3.0, 0.9, -25.4, { pattern: PAT.WOOD, color: 0x7a6040, kind: 'cover' });
      B.sandbags(-4, -19.5, 4, -19.5);
      B.car(-14, 30, 0, 0x40362c);
      // ambiente: humo lejano y paisaje
      B.smoke(-70, -60, 1.1); B.smoke(80, 40, 1.4); B.smoke(20, -90, 1.0);
      B.horizon(0x7f705a, 22, 95, 150, { groundColor: 0x76694e });
      // A / B / C y armas
      B.dom('A', -30, 0, 0); B.dom('B', 0, 0, 9.5); B.dom('C', 30, 0, 0);
      B.stand(11, 6.3, 21.4, 'sniper'); B.stand(0, 0, -23.6, 'lmg');   // 3.2.3: el tubo antitanque queda fuera del juego por ahora B.stand(-7.5, 0.06, -8.4, 'shotgun'); B.stand(7.5, 0.06, -8.4, 'shotgun');
      // aparición libre (todos contra todos)
      for (const [x, z] of [[-42, 0], [42, 0], [0, -29.5], [0, 27], [-20, -24.5], [20, -24.5], [-22, 26], [22, 26], [-40, -24], [40, 24], [-12, 1], [12, -1], [-31, -10], [31, 10]]) B.spawn('ffa', x, 0, z);
      B.prop('tire', -14, 0, 2.5); B.prop('tire', 14.2, 0, -2.8); B.prop('can', 2.2, 0, 7.5); B.prop('can', -26.5, 0, 3.4); B.prop('bucket', -3.2, 0.06, -8.9);
    },
  },

  // -------------------------------------------------------------------
  base: {
    name: { es: 'Cuartel Tres Cruces', en: 'Tres Cruces Barracks' },
    desc: { es: 'Hangar de aeródromo al centro, torre de vigía, nido de ametralladora y trincheras con sacos terreros y alambrada.', en: 'An airfield hangar in the middle, a watchtower, a machine-gun nest and trenches with sandbags and barbed wire.' },
    thumb: ['#5d6b78', '#a9b2b2', '#5e6248'],
    theme: { skyTop: 0x56677a, skyMid: 0xaab3b3, skyBot: 0x868a80, fog: 0x99a09c, fogNear: 38, fogFar: 205, sun: 0xfff1da, sunI: 2.1, sunDir: [0.42, 0.72, -0.32], hemiTop: 0xd5dde0, hemiBot: 0x66665a, hemiI: 1.35, exposure: 1.05 },
    build(B) {
      const C = B.C;
      B.bounds(-48, -40, 48, 40);
      // trincheras (oeste) y búnker: huecos en el terreno
      const trench = [[-38, -16, -35, 16], [-35, -1.5, -31, 1.5], [-41, -9, -38, -6], [-41, 6, -38, 9]];
      const bunker = [-31, -3.5, -25, 3.5];
      const apron = [-16, -14, 16, 14];
      B.ground(-48, -40, 48, 40, { holes: [...trench, bunker, apron], pattern: PAT.GRASS, color: 0x6b6e48 });
      B.ground(...apron, { pattern: PAT.CONCRETE, color: 0x8e8c84 });
      for (const r of [...trench, bunker]) B.box(r[0], -2.2, r[1], r[2], -1.4, r[3], { pattern: PAT.DIRT, color: 0x6e5c44, kind: 'floor' });
      // revestimiento de tablas en las paredes de la trinchera
      B.decoBox(-38.02, -1.4, -16, -37.98, 0, 16, 0x5a4630); B.decoBox(-35.02, -1.4, -16, -34.98, 0, -1.5, 0x5a4630); B.decoBox(-35.02, -1.4, 1.5, -34.98, 0, 16, 0x5a4630);
      for (const s of [-1, 1]) B.stairs(-36.5, s * 14.4, s > 0 ? '+z' : '-z', 3, -1.4, 0, { pattern: PAT.DIRT, color: 0x6e5c44 });
      // escalones de tiro dentro de la trinchera (para asomarse por encima del borde)
      const dirt = { pattern: PAT.DIRT, color: 0x6e5c44, kind: 'floor' };
      B.box(-35.7, -1.4, -14.4, -35, -0.65, -1.6, dirt); B.box(-35.7, -1.4, 1.6, -35, -0.65, 14.4, dirt);
      for (const [a, b] of [[-14.4, -9.2], [-5.8, 5.8], [9.2, 14.4]]) B.box(-38, -1.4, a, -37.3, -0.65, b, dirt);
      // búnker hundido: piso a -1.4, escalón de tiro y troneras a la altura de los ojos
      const bc = { pattern: PAT.CONCRETE, color: 0x8a877e, kind: 'wall' };
      B.wall('x', -31, -25, -3.35, -1.4, 3.8, 0.3, { ...bc, open: [{ type: 'slit', at: -27.5, w: 3.4, y0: 2.3, y1: 2.85 }] });
      B.wall('x', -31, -25, 3.35, -1.4, 3.8, 0.3, { ...bc, open: [{ type: 'slit', at: -27.5, w: 3.4, y0: 2.3, y1: 2.85 }] });
      B.wall('z', -3.2, 3.2, -25.15, -1.4, 3.8, 0.3, { ...bc, open: [{ type: 'slit', at: 0, w: 4, y0: 2.3, y1: 2.85 }] });
      B.box(-29.3, -1.4, -3.2, -25.3, -0.35, 3.2, { pattern: PAT.CONCRETE, color: 0x7d7a72, kind: 'floor' });
      B.stairs(-30.6, 0, '+x', 1.6, -1.4, -0.35, { pattern: PAT.CONCRETE, color: 0x7d7a72 });
      B.wall('z', -3.2, 3.2, -30.85, -1.4, 3.8, 0.3, { ...bc, open: [{ type: 'door', at: 0, w: 1.6, y0: 0, y1: 2.3 }] });
      B.box(-31.2, 2.4, -3.7, -24.8, 2.9, 3.7, { pattern: PAT.CONCRETE, color: 0x7d7a72 });
      B.sandbags(-31.6, -4, -24.4, -4, { y: 0, h: 0.5 }); B.sandbags(-31.6, 4, -24.4, 4, { y: 0, h: 0.5 });
      // parapetos de sacos sobre la trinchera y alambre al frente
      for (const s of [-1, 1]) {
        B.sandbags(-34.6, s * 3, -34.6, s * 15, { h: 0.75 }); B.sandbags(-38.4, s * 10, -38.4, s * 15.5, { h: 0.75 });
        B.wire(-32.5, s * 6, -32.5, s * 14); B.wire(-42.5, s * 2, -42.5, s * 12);
      }
      B.dom('A', -36.5, -1.4, 4.0, 4.0);
      // hangar central
      B.house(-11, -9, 11, 9, { floors: 1, h: 8, pattern: PAT.METAL, color: 0x6c7068, floorPat: PAT.CONCRETE, floorColor: 0x7c7a74, parapet: false, roofPat: PAT.METAL, roofColor: 0x5a5e58,
        open: { n: [['big', 0.5, 0, 9, 0, 6.2]], s: [['big', 0.5, 0, 9, 0, 6.2]], e: [['door', 0.2, 0], ['door', 0.8, 0], ['win', 0.35, 0, 1.6, 4.6, 5.8], ['win', 0.65, 0, 1.6, 4.6, 5.8]], w: [['door', 0.2, 0], ['door', 0.8, 0], ['win', 0.35, 0, 1.6, 4.6, 5.8], ['win', 0.65, 0, 1.6, 4.6, 5.8]] } });
      for (const s of [-1, 1]) {
        // pasarela interior a 4 m con escalera
        const xa = s > 0 ? 8.6 : -10.7, xb = s > 0 ? 10.7 : -8.6;
        B.box(xa, 3.75, -8.7, xb, 4.0, 8.7, { pattern: PAT.GRATE, color: 0x5a5c58, kind: 'floor' });
        B.decoBox(s > 0 ? 8.55 : -8.65, 4.0, -8.7, s > 0 ? 8.65 : -8.55, 5.0, 3.0, 0x3a3c3a);
        const sx = s > 0 ? 7.95 : -7.95;
        B.stairs(sx, 8.4, '-z', 1.1, 0.06, 4.0, { pattern: PAT.GRATE, color: 0x5a5c58, solidBase: false });
        B.box(s > 0 ? 7.4 : -8.6, 3.75, 3.2, s > 0 ? 8.6 : -7.4, 4.0, 4.4, { pattern: PAT.GRATE, color: 0x5a5c58, kind: 'floor' });
      }
      // avión dentro del hangar
      B.box(2.6, 0.7, -6.4, 4.4, 2.5, 5.2, { pattern: PAT.METAL, color: 0x7d8278, kind: 'vehicle' });
      B.box(-2.6, 1.55, -1.2, 9.6, 1.75, 0.8, { pattern: PAT.METAL, color: 0x737870, kind: 'vehicle' });
      B.deco(GEO.cone(0.9, 1.6, 8), 3.5, 1.6, -7.2, 0x7d8278, { rx: -Math.PI / 2 }); B.deco(GEO.box(0.2, 1.6, 1.4), 3.5, 3.0, 4.6, 0x737870);
      for (const z of [-4, 3.5]) { B.deco(GEO.cyl(0.3, 0.3, 0.2, 8), 3.5, 0.3, z, 0x1a1918, { rz: Math.PI / 2 }); }
      B.crate(-8.8, 0.06, -6.8, 1.2); B.crate(-8.8, 1.26, -6.8, 1.0); B.crate(-7.5, 0.06, -7.0, 1.1); B.crate(-8.6, 0.06, 6.6, 1.2);
      B.barrel(8.2, 0.06, -7.6); B.barrel(-3.5, 0.06, 7.4);
      B.box(-6, 0.06, 2.2, -3.4, 1.1, 3.4, { pattern: PAT.METAL, color: 0x4a5236, kind: 'cover' });
      B.dom('B', -4.5, 0.06, -1.5, 4.2);
      // torre de control (este) y helipuertos
      B.house(27, -3, 33, 3, { floors: 2, h: 3.3, pattern: PAT.CONCRETE, color: 0xa6a298, stairs: { side: 'n', from: 'e' },
        open: { w: [['door', 0.5, 0], ['win', 0.2, 1, 1.4], ['win', 0.5, 1, 1.4], ['win', 0.8, 1, 1.4]], e: [['door', 0.5, 0], ['win', 0.2, 1, 1.4], ['win', 0.5, 1, 1.4], ['win', 0.8, 1, 1.4]], n: [['win', 0.3, 1, 1.4], ['win', 0.7, 1, 1.4]], s: [['win', 0.5, 0], ['win', 0.3, 1, 1.4], ['win', 0.7, 1, 1.4]] } });
      B.deco(GEO.cyl(0.05, 0.05, 3, 4), 31.5, 8.3, 1.8, 0x3a3a3a); B.deco(GEO.box(0.6, 0.4, 0.6), 29, 7.0, -1.4, 0x8a8a84);
      B.dom('C', 22.5, 0, 0, 4.2);
      B.stand(30, 3.3, 1.3, 'sniper'); B.stand(-27.3, -0.35, 0, 'shotgun'); B.stand(9.6, 4.0, -6.5, 'lmg');   // 3.2.3: el tubo antitanque queda fuera del juego por ahora
      for (const s of [-1, 1]) {
        const Z = (v) => s * v;
        // barracas
        houseZ(B, s, -9, 20, 9, 26, { floors: 1, h: 3.2, pattern: PAT.PLASTER, color: 0xb2ab94, open: { n: [['door', 0.25, 0], ['win', 0.5, 0], ['door', 0.75, 0]], s: [['win', 0.25, 0], ['door', 0.5, 0], ['win', 0.75, 0]], e: [['door', 0.5, 0]], w: [['win', 0.5, 0]] } });
        B.box(-6.5, 0.06, Z(23) - 0.4, -2.5, 0.6, Z(23) + 0.4, { pattern: PAT.WOOD, color: 0x5a5040, kind: 'cover' }); B.box(2.5, 0.06, Z(23) - 0.4, 6.5, 0.6, Z(23) + 0.4, { pattern: PAT.WOOD, color: 0x5a5040, kind: 'cover' });
        // nidos de sacos frente a las puertas del hangar
        B.sandbags(-3, Z(12.5), 3, Z(12.5)); B.sandbags(-3.3, Z(12.2), -3.3, Z(10.6)); B.sandbags(3.3, Z(12.2), 3.3, Z(10.6));
        // contenedores y camiones
        B.container(-14, 0, Z(11.5), 'x'); B.container(14.5, 0, Z(11.5), 'z');
        B.truck(-20, Z(16), 0); B.container(20, 0, Z(17), 'x'); B.container(20, 2.6, Z(17), 'x');
        B.crate(16.3, 0, Z(19.2), 1.2); B.crate(17.4, 0, Z(19.2), 1.1); B.crate(16.3, 1.2, Z(19.2), 1.1);
        // depósito de combustible
        B.box(26, 0, Z(22) - 1.6, 31, 3.0, Z(22) + 1.6, { pattern: PAT.METAL, color: 0x8a8a7a, kind: 'cover' });
        B.deco(GEO.cyl(1.7, 1.7, 5.0, 10), 28.5, 1.7, Z(22), 0x9a9a8a, { rz: Math.PI / 2 });
        B.barrel(24.8, 0, Z(20)); B.barrel(25.4, 0, Z(19.4)); B.barrel(24.6, 0, Z(24.5));
        // helipuerto
        B.box(36, 0, Z(16) - 4, 44, 0.12, Z(16) + 4, { pattern: PAT.CONCRETE, color: 0x6e6e68, kind: 'floor' });
        B.decoBox(39.2, 0.12, Z(16) - 2, 39.6, 0.13, Z(16) + 2, 0xd8d0b0); B.decoBox(40.4, 0.12, Z(16) - 2, 40.8, 0.13, Z(16) + 2, 0xd8d0b0); B.decoBox(39.6, 0.12, Z(16) - 0.2, 40.4, 0.13, Z(16) + 0.2, 0xd8d0b0);
        // torres de vigilancia y restos
        B.tower(-42, Z(30), 5.4, s > 0 ? '-z' : '+z');
        B.tank(-20, Z(29), 1);
        B.sandbags(-26, Z(30), -22.5, Z(30)); B.sandbags(10, Z(31), 14, Z(31));
        B.wire(-12, Z(33), 12, Z(33));
        B.fence(-48, Z(39.5), 48, Z(39.5), 2.4);
        B.tree(44, Z(31), 1.0); B.tree(-46, Z(18), 1.0); B.deadTree(34, Z(34));
        // aparición
        const team = s > 0 ? 0 : 1;
        for (const [x, z] of [[-24, 37], [-12, 37.5], [0, 36], [12, 37.5], [24, 37], [-34, 36], [34, 36], [-4, 34], [4, 34], [44, 36]]) B.spawn(team, x, 0, Z(z), s > 0 ? 0 : Math.PI);
      }
      B.smoke(-90, 20, 1.3); B.smoke(70, -80, 1.1);
      B.horizon(0x6e7262, 22, 95, 150, { groundColor: 0x5f6342 });
      for (const [x, z] of [[-30, -18], [-30, 18], [0, -16], [0, 16], [22, -8], [22, 8], [38, -2], [-44, 0], [-16, -30], [16, 30], [-8, 0], [6, 6.5]]) B.spawn('ffa', x, 0, z);
      B.prop('tire', 18, 0, 6); B.prop('can', -13.5, 0, 6.5); B.prop('bucket', 10, 0, -15.5); B.prop('can', 24, 0, -3.5);
    },
  },

  // -------------------------------------------------------------------
  muelle: {
    name: { es: 'Puerto Ánimas', en: 'Puerto Ánimas' },
    desc: { es: 'Cajas de vagón apiladas en laberinto, grúas de vapor, un almacén con pasarelas y bidones que estallan.', en: 'A maze of stacked freight-car boxes, steam cranes, a warehouse with catwalks and drums that explode.' },
    thumb: ['#3e5a78', '#b8b4a6', '#5a5f66'],
    theme: { skyTop: 0x3c5876, skyMid: 0xbab4a2, skyBot: 0x7a8a8e, fog: 0x98a4a6, fogNear: 42, fogFar: 225, sun: 0xffdfb4, sunI: 2.4, sunDir: [0.5, 0.48, -0.7], hemiTop: 0xcfd8dc, hemiBot: 0x666660, hemiI: 1.35, exposure: 1.05 },
    build(B) {
      const C = B.C;
      B.bounds(-50, -30, 50, 32);
      B.ground(-50, -30, 50, 32, { pattern: PAT.CONCRETE, color: 0x8a8880 });
      B.box(-50, 0, -30, 50, 0.25, -29.4, { pattern: PAT.HAZARD, color: 0x8a8880, kind: 'cover' });
      for (let x = -46; x <= 46; x += 8) B.box(x - 0.25, 0, -28.9, x + 0.25, 0.6, -28.4, { pattern: PAT.METAL, color: 0x2a2c2e, kind: 'cover' });
      // agua, barco y grúas lejanas (decoración)
      const water = new THREE.Mesh(new THREE.PlaneGeometry(420, 200), new THREE.MeshLambertMaterial({ color: 0x3a5058 }));
      water.rotation.x = -Math.PI / 2; water.position.set(0, -2.6, -130); MapSys.decor.add(water);
      B.decoBox(-34, -3, -54, 30, 6.5, -36, 0x5a2a24); B.decoBox(-34, 6.5, -54, 30, 7.0, -36, 0x3a3a38);
      B.decoBox(14, 7, -50, 26, 15, -40, 0xd8d4c8); B.decoBox(16, 15, -48, 24, 18, -42, 0xc8c4b8);
      for (let i = 0; i < 5; i++) B.container(-26 + i * 7, 7.0, -45, 'x');
      // almacén (A)
      const wx0 = -40, wx1 = -22, wz0 = -12, wz1 = 12;
      B.house(wx0, wz0, wx1, wz1, { floors: 1, h: 9, pattern: PAT.METAL, color: 0x7a7468, floorPat: PAT.CONCRETE, floorColor: 0x77756e, parapet: false, roofPat: PAT.METAL, roofColor: 0x5e5a52,
        open: { e: [['big', 0.5, 0, 5, 0, 4.2], ['win', 0.12, 0, 1.6, 5.2, 6.6], ['win', 0.88, 0, 1.6, 5.2, 6.6]], w: [['door', 0.5, 0], ['win', 0.2, 0, 1.6, 5.2, 6.6], ['win', 0.8, 0, 1.6, 5.2, 6.6]],
          n: [['door', 0.3, 0], ['win', 0.15, 0, 1.6, 5.2, 6.6], ['win', 0.5, 0, 1.6, 5.2, 6.6], ['win', 0.85, 0, 1.6, 5.2, 6.6]], s: [['door', 0.7, 0], ['win', 0.15, 0, 1.6, 5.2, 6.6], ['win', 0.5, 0, 1.6, 5.2, 6.6], ['win', 0.85, 0, 1.6, 5.2, 6.6]] } });
      for (const s of [-1, 1]) {
        const za = s < 0 ? wz0 + 0.3 : wz1 - 2.3, zb = za + 2;
        B.box(wx0 + 0.3, 4.25, za, wx1 - 0.3, 4.5, zb, { pattern: PAT.GRATE, color: 0x55585a, kind: 'floor' });
        B.decoBox(wx0 + 0.3, 4.5, s < 0 ? zb - 0.05 : za, wx1 - 0.3, 5.5, s < 0 ? zb : za + 0.05, 0x3a3c3e);
        B.stairs(-31, s * 4.9, s < 0 ? '-z' : '+z', 1.1, 0.06, 4.5, { pattern: PAT.GRATE, color: 0x55585a, solidBase: false });
        // estantes de cajas
        for (const x of [-38, -34.5]) { B.crate(x, 0.06, s * 5.5, 1.3, { hp: 200 }); B.crate(x + 1.4, 0.06, s * 5.5, 1.3, { hp: 200 }); B.crate(x, 1.36, s * 5.5, 1.2, { hp: 200 }); }
        B.crate(-26.5, 0.06, s * 7.8, 1.2); B.barrel(-24.2, 0.06, s * 9.8);
      }
      B.box(-38.5, 0.06, -2, -36.5, 1.1, 2, { pattern: PAT.WOOD, color: 0x6a5a40, kind: 'cover' });
      B.dom('A', -30, 0.06, 0, 4.4);
      B.stand(-38.6, 4.5, -10.6, 'sniper'); B.stand(-38.6, 0.06, 9.8, 'shotgun');
      // patio de contenedores (B) — pasillos de 3 m o más
      const yard = [
        [-12, -19, 'x', 2], [-3.5, -19, 'x', 1], [6, -19, 'x', 2], [14, -19, 'x', 1],
        [-14, -10, 'x', 1], [-6.5, -11, 'z', 2], [4.5, -10, 'x', 1], [12, -10.5, 'z', 2],
        [-15.5, 1, 'z', 2], [15.5, -1, 'z', 2], [-7.5, 4.5, 'x', 1], [7.5, -4.5, 'x', 1],
        [-12, 10.5, 'z', 2], [-4.5, 10, 'x', 1], [6.5, 11, 'z', 2], [14, 10, 'x', 1],
        [-14, 19, 'x', 1], [-6, 19, 'x', 2], [3.5, 19, 'x', 1], [12, 19, 'x', 2],
      ];
      for (const [x, z, ax, n] of yard) for (let k = 0; k < n; k++) B.container(x, k * 2.6, z, ax);
      // escalones de cajas pegados a los contenedores de un piso (desde ahí se trepa al techo)
      for (const [x, z] of [[-3.5, -17.18], [14, -17.18], [-14, -8.18], [4.5, -8.18], [-7.5, 6.32], [7.5, -6.32], [-4.5, 11.82], [14, 11.82], [-14, 17.18], [3.5, 17.18]]) B.crate(x, 0, z, 1.2);
      B.barrel(0.8, 0, -14); B.barrel(-1.6, 0, 14.4); B.barrel(9.8, 0, 3.6); B.barrel(-9.6, 0, -3.4);
      B.sandbags(-2.5, -2.6, 2.5, -2.6, { h: 0.9 }); B.sandbags(-2.5, 2.6, 2.5, 2.6, { h: 0.9 });
      B.dom('B', 0, 0, 0, 4.2);
      B.stand(0, 0, -6.8, 'lmg');   // 3.2.3: el tubo antitanque queda fuera del juego por ahora
      // muelle de grúas y oficina (C)
      for (const [x, z] of [[27, -26.5], [27, -13.5], [41, -26.5], [41, -13.5]]) B.box(x - 0.45, 0, z - 0.45, x + 0.45, 14, z + 0.45, { pattern: PAT.HAZARD, color: 0xb8902a, kind: 'pole' });
      B.decoBox(26.5, 14, -27, 27.5, 15.2, -13, 0xb8902a); B.decoBox(40.5, 14, -27, 41.5, 15.2, -13, 0xb8902a);
      B.decoBox(26.5, 15.2, -21, 41.5, 16.2, -19, 0xa8802a); B.decoBox(32, 12, -21.5, 35, 14, -18.5, 0x5a5c58);
      B.deco(GEO.cyl(0.03, 0.03, 6, 4), 33.5, 9, -20, 0x222222);
      B.container(33.5, 0, -24, 'x'); B.container(33.5, 0, -16, 'x'); B.container(33.5, 2.6, -24, 'x');
      B.crate(29.85, 0, -16, 1.2); B.crate(37, 0, -20, 1.2); B.barrel(37.8, 0, -21.4); B.barrel(29.6, 0, -24.2);
      B.dom('C', 34, 0, -20, 4.0);
      B.house(34, 10, 46, 20, { floors: 2, h: 3.2, pattern: PAT.PLASTER, color: 0xb8b2a2, stairs: { side: 'e', from: 's' },
        open: { w: [['door', 0.5, 0], ['win', 0.2, 1], ['win', 0.5, 1], ['win', 0.8, 1]], n: [['door', 0.3, 0], ['win', 0.7, 0], ['win', 0.3, 1], ['win', 0.7, 1]], s: [['win', 0.5, 0], ['win', 0.5, 1]], e: [['door', 0.3, 0]] } });
      B.stand(38, 3.2, 15, 'sniper');
      // montacargas, palés, barreras
      B.lbox(24, 6, 0, -1.2, 0, -0.7, 1.2, 1.6, 0.7, { pattern: PAT.METAL, color: 0xb88a22, kind: 'vehicle' });
      B.lbox(-18, -24, 1, -1.2, 0, -0.7, 1.2, 1.6, 0.7, { pattern: PAT.METAL, color: 0xb88a22, kind: 'vehicle' });
      B.truck(24, 24, 0, 0x6a3a2a); B.truck(-20, 26, 0, 0x3a4a5a);
      for (const [x, z] of [[22, -6], [22.9, -6], [-20, 8], [-20, 9], [26, 14], [-46, -20], [-46, 22]]) B.box(x - 0.45, 0, z - 0.6, x + 0.45, 0.25, z + 0.6, { pattern: PAT.WOOD, color: 0x8a6a44, kind: 'cover' });
      B.box(18.8, 0, -26, 19.4, 1.0, -18, { pattern: PAT.HAZARD, color: 0x9a9a92, kind: 'cover' }); B.box(-19.4, 0, 16, -18.8, 1.0, 24, { pattern: PAT.HAZARD, color: 0x9a9a92, kind: 'cover' });
      B.container(-44, 0, -24, 'z'); B.container(44, 0, 26, 'z'); B.container(-44, 0, 26, 'z'); B.container(46, 0, -4, 'z');
      for (let x = -48; x <= 48; x += 12) B.lamp(x, 30.5);
      B.fence(-50, 31.6, 50, 31.6, 2.6);
      B.smoke(-60, 70, 1.0); B.smoke(90, -20, 1.2);
      B.horizon(0x6a7272, 16, 110, 160, { skip: 'n', groundColor: 0x6e6c64 });
      // aparición
      for (const [x, z] of [[-47, -14], [-47, -6], [-47, 2], [-47, 10], [-46, 17], [-44, -2], [-48, 28], [-48, -26], [-45, 6], [-45, -10]]) B.spawn(0, x, 0, z, -Math.PI / 2);
      for (const [x, z] of [[47, -14], [48, -8], [47, 2], [47, 10], [47.5, 22], [45, -22], [48, 29], [46.5, -27], [44, 4], [44.5, -12]]) B.spawn(1, x, 0, z, Math.PI / 2);
      for (const [x, z] of [[-30, -6], [-28, 8], [0, -24], [0, 24], [-20, 0], [20, 0], [34, -8], [30, 26], [-34, 22], [-34, -22], [10, -14], [-10, 14]]) B.spawn('ffa', x, 0, z);
      B.prop('tire', 21, 0, 8); B.prop('can', -22.6, 0.06, 4.2); B.prop('bucket', 26.2, 0, -8.4); B.prop('can', 4, 0, 2.6);
    },
  },
};
// mapa plano solo para pruebas automatizadas (no aparece en el menú)
MAPS.test = {
  name: { es: 'Prueba', en: 'Test' }, desc: { es: '', en: '' }, theme: MAPS.base.theme, thumb: ['#555', '#888', '#444'],
  build(B) {
    B.bounds(-30, -30, 30, 30);
    B.ground(-30, -30, 30, 30, { pattern: PAT.CONCRETE, color: 0x8a8880 });
    B.stairs(-20, 18, '+x', 2, 0, 3);
    B.box(-12.8, 0, 17, -9, 3, 19, { pattern: PAT.CONCRETE, color: 0x8a8880 });
    B.box(14, 0, 18, 18, 1.2, 24, { pattern: PAT.CONCRETE, color: 0x9a978f });
    B.box(-25, 0, -10, -24, 4, 10, { pattern: PAT.PLASTER, color: 0xb0a890 });
    B.sandbags(5, -8, 10, -8);
    B.barrel(0, 0, 12);
    B.spawn(0, -5, 0, 0, -Math.PI / 2); B.spawn(1, 5, 0, 0, Math.PI / 2); B.spawn(0, 0, 0, 5); B.spawn(1, 0, 0, -5);
    B.dom('A', -15, 0, 0); B.dom('B', 0, 0, 0); B.dom('C', 15, 0, 0);
  },
};
// campo de tiro: blancos fijos y móviles de 10 a 100 m y, desde la torre, galería larga de 200 a 626 m (no sale en la lista de mapas)
MAPS.campo = {
  name: { es: 'Campo de tiro', en: 'Shooting range' }, desc: { es: 'Blancos a 10, 25, 50, 75 y 100 m, fijos y móviles. Desde la torre, galería larga hasta 626 m con banderolas de viento.', en: 'Targets at 10, 25, 50, 75 and 100 m, fixed and moving. From the tower, a long gallery out to 626 m with wind flags.' },
  theme: { ...MAPS.base.theme, fogNear: 160, fogFar: 1500 }, thumb: ['#4a6a8a', '#9ab0a0', '#66763f'],
  build(B) {
    const TZ = 21, LONG = [200, 300, 400, 500, 626];
    B.bounds(-60, -660, 60, 24, 30);
    B.ground(-60, 8, 60, 24, { pattern: PAT.CONCRETE, color: 0x8d8b84 });
    B.ground(-60, -660, 60, 8, { pattern: PAT.GRASS, color: 0x66763f });
    // línea de fuego y marcas de distancia
    B.decoBox(-20, 0.004, 7.9, 20, 0.04, 8.15, 0xe8e4d0);
    for (const d of [10, 25, 50, 75, 100]) { const z = 8 - d; B.decoBox(-20, 0.004, z - 0.1, 20, 0.04, z + 0.1, 0xe8e4d0); B.sign(-17.5, z, d + ' m'); B.sign(17.5, z, d + ' m'); }
    // mesas y sacos para apoyar el arma
    B.crate(-9, 0, 18.5, 1.0, { h: 0.9 }); B.crate(-7.8, 0, 18.5, 1.0, { h: 0.9 }); B.crate(8.4, 0, 18.5, 1.0, { h: 0.9 }); B.crate(9.6, 0, 18.5, 1.0, { h: 0.9 });
    B.sandbags(-14, 9.2, -8, 9.2, { h: 0.9 }); B.sandbags(8, 9.2, 14, 9.2, { h: 0.9 });
    B.barrel(-17, 0, 20); B.barrel(17, 0, 20.4);
    // terraplén al fondo (con la tronera de la galería larga en el centro) y a los lados
    B.box(-26, 0, -112, -4, 7, -106, { pattern: PAT.DIRT, color: 0x6b5a3e }); B.box(4, 0, -112, 26, 7, -106, { pattern: PAT.DIRT, color: 0x6b5a3e });
    B.box(-26, 0, -106, -20, 2.4, 8, { pattern: PAT.DIRT, color: 0x6b5a3e }); B.box(20, 0, -106, 26, 2.4, 8, { pattern: PAT.DIRT, color: 0x6b5a3e });
    for (const [x, z] of [[-30, -30], [-32, -70], [30, -50], [33, -85], [-31, 10], [31, 14], [-40, -260], [44, -340], [-46, -470], [38, -560], [-30, -630], [26, -640]]) B.tree(x, z, 1.1);
    // torre de tiro de madera (12 m) para disparar por encima del terraplén
    B.tower(0, TZ, 12, '+x');
    // galería larga: blanco (soldado de práctica), tablón con dianas y parapeto de tierra detrás; carteles y banderolas de viento cada 100 m
    LONG.forEach((d, i) => {
      const z = TZ - d, sx = d === 626 ? 0 : i % 2 ? 5 : -5;
      B.station(sx, z, Math.PI, { name: d + ' m', long: true });
      B.box(sx + 2.2, 0, z - 0.12, sx + 3.6, 1.9, z + 0.04, { pattern: PAT.WOOD, color: 0x7a5a36, kind: 'cover', hp: 99999 });
      B.panel(sx + 2.9, 0.95, z + 0.05, 0, 1.4, 1.9, (c, w, h) => { c.fillStyle = '#d8d0b4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#2a2420'; c.lineWidth = 6; for (const r of [0.42, 0.3, 0.18]) { c.beginPath(); c.arc(w / 2, h * 0.42, w * r, 0, TAU); c.stroke(); } c.fillStyle = '#2a2420'; c.beginPath(); c.arc(w / 2, h * 0.42, w * 0.07, 0, TAU); c.fill(); c.font = 'bold ' + Math.round(w * 0.2) + 'px serif'; c.textAlign = 'center'; c.fillText(d + ' m', w / 2, h * 0.92); });
      B.box(sx - 1.5, 0, z - 4, sx + 4.5, 2.6, z - 2.5, { pattern: PAT.DIRT, color: 0x6b5a3e });
      B.sign(sx - 2.5, z + 1.5, d + ' m', 4.2);
    });
    for (let d = 100; d <= 600; d += 100) {
      const x = -8, z = TZ - d;
      B.deco(GEO.cyl(0.06, 0.08, 6, 6), x, 3, z, 0x4a3a28);
      const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5, 6, 1), new THREE.MeshLambertMaterial({ color: d % 200 ? 0xd8c8a0 : 0xb03a2a, side: THREE.DoubleSide }));
      const g = new THREE.Group(); g.position.set(x, 5.65, z); cloth.position.x = 0.8; g.add(cloth); MapSys.decor.add(g);
      const pos = cloth.geometry.attributes.position, base = Float32Array.from(pos.array);
      MapSys.anim.push((t) => {
        const w = Ballistics.wind(), sp = Math.hypot(w.x, w.z), k = clamp(sp / 6, 0.08, 1);
        g.rotation.y = Math.atan2(-w.z, w.x); g.rotation.z = -(1 - k) * 1.2;
        for (let i = 0; i < pos.count; i++) { const bx = base[i * 3]; pos.array[i * 3 + 2] = Math.sin(t * (5 + sp * 1.5) - bx * 4 + d) * 0.08 * (bx + 0.8) * (0.4 + k); }
        pos.needsUpdate = true;
      });
    }
    // paisaje lejano: suelo exterior y colinas más allá del final de la galería
    B.deco(GEO.box(1, 1, 1), 0, -0.08, -300, 0x5e6a42, { sx: 1900, sy: 0.1, sz: 1500 });
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU, s = 50 + (i * 37 % 60), r = 760 + (i * 53 % 90);
      B.deco(GEO.cone(1, 1, 5), Math.cos(a) * r, s * 0.3 - 2, Math.sin(a) * r - 200, shade(0x7a7466, ((i * 13) % 20 - 10) / 100), { sx: s * 1.3, sy: s * 0.7, sz: s * 1.3, ry: i });
    }
    B.spawn('ffa', 0, 0, 14, 0); B.spawn(0, -4, 0, 14, 0); B.spawn(1, 4, 0, 14, 0);
    // blancos: uno fijo (izquierda) y otro móvil (derecha) a cada distancia
    for (const d of [10, 25, 50, 75, 100]) {
      B.station(-6, 8 - d, Math.PI, { name: d + ' m' });
      B.station(6, 8 - d, Math.PI, { name: d + ' m ◂▸', move: true, amp: 5, ph: d });
    }
  },
};
const MAP_ORDER = ['pueblo', 'base', 'muelle'];

