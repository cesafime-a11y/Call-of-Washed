// ---- 09f_sanjuan.js ----
// =====================================================================
// SAN JUAN DE LAS MINAS (3.3.0) — mapa nuevo, trazado del prototipo v4 rehecho con el constructor de bloques
// de la 3.1.4. Pueblo minero: calle de las casas mineras (oeste), taberna «La Galena», plaza con fuente y
// plátanos, iglesia de San Juan con el campanario del reloj (parado a las diez y diez), huertos al norte,
// lavadero y vía de las vagonetas al sur, y al este, 2,2 m más alto, el patio de la mina: castillete,
// casa de máquinas con su chimenea, taller, escombrera y la boca de la galería nueve.
// Ejes: x hacia el este, z hacia el sur (-z = norte). Zona jugable: x de -56 a 56, z de -38 a 36.
// =====================================================================
const SJ = { cal: 0xe2dac6, cal2: 0xd6ccb4, ocre: 0xc8a36c, rosa: 0xc99c88, stone: 0x9c917f, dstone: 0x6e665a, tile: 0x9a5038, tileD: 0x7c3e2c,
  wood: 0x5e4630, plank: 0x7a5c3c, iron: 0x37383a, rust: 0x6b4232, brick: 0x8e5442, coal: 0x1f1d1b, shutG: 0x4f6a4a, shutB: 0x4e6478, leaf: 0x55602e, crop: 0x6c7a36 };
// prisma triangular unidad (ancho 1 en x, alto 1 en y, largo 1 en z; base en y=0, cumbrera a lo largo de z): tejados a dos aguas
function sjPrism() {
  return GEO.get('prism1', () => {
    const A = [-0.5, 0, -0.5], Bv = [0.5, 0, -0.5], Cv = [0, 1, -0.5], A2 = [-0.5, 0, 0.5], B2 = [0.5, 0, 0.5], C2 = [0, 1, 0.5];
    const tris = [A, Cv, Bv, A2, B2, C2, A, A2, C2, A, C2, Cv, Bv, Cv, C2, Bv, C2, B2, A, Bv, B2, A, B2, A2];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(tris.flat()), 3)); g.computeVertexNormals(); return g;
  });
}
const _sjQ = new THREE.Quaternion(), _sjE = new THREE.Euler(), _sjA = new THREE.Vector3(), _sjB = new THREE.Vector3(), _sjU = new THREE.Vector3(0, 1, 0);
function sjHelpers(B) {
  const rng = B.rng, H = {};
  // viga de un punto a otro (patas del castillete, cables, tornapuntas)
  H.beam = (x0, y0, z0, x1, y1, z1, t, color) => {
    _sjA.set(x1 - x0, y1 - y0, z1 - z0); const L = _sjA.length(); _sjQ.setFromUnitVectors(_sjU, _sjA.normalize()); _sjE.setFromQuaternion(_sjQ, 'XYZ');
    B.deco(GEO.box(1, 1, 1), (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, color, { rx: _sjE.x, ry: _sjE.y, rz: _sjE.z, sx: t, sy: L, sz: t });
  };
  // tejado a dos aguas con alero; ridge 'x' = cumbrera paralela al eje x
  H.gable = (x0, z0, x1, z1, y, h, color = SJ.tile, ridge = 'x', ov = 0.4) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0 + 2 * ov, d = z1 - z0 + 2 * ov;
    if (ridge === 'x') B.deco(sjPrism(), cx, y, cz, color, { ry: Math.PI / 2, sx: d, sy: h, sz: w });
    else B.deco(sjPrism(), cx, y, cz, color, { sx: w, sy: h, sz: d });
    B.decoBox(x0 - ov, y - 0.12, z0 - ov, x1 + ov, y + 0.02, z1 + ov, shade(color, -0.35));
  };
  // contraventanas a los lados de un hueco de ventana en la fachada (side n/s/w/e)
  H.shutters = (side, x0, z0, x1, z1, f, y, col) => {
    const t = 0.3, hw = 0.575, sw = 0.5, sh = 1.12, y0 = y + 0.95, out = 0.06;
    if (side === 'n' || side === 's') {
      const a = lerp(x0, x1, f), z = side === 'n' ? z0 - out : z1 + out;
      for (const s of [-1, 1]) B.decoBox(a + s * hw, y0, z - 0.03, a + s * (hw + sw), y0 + sh, z + 0.03, col);
      B.decoBox(a - hw - 0.1, y0 - 0.12, z - 0.09, a + hw + 0.1, y0, z + 0.09, SJ.stone);
    } else {
      const a = lerp(z0 + t, z1 - t, f), x = side === 'w' ? x0 - out : x1 + out;
      for (const s of [-1, 1]) B.decoBox(x - 0.03, y0, a + s * hw, x + 0.03, y0 + sh, a + s * (hw + sw), col);
      B.decoBox(x - 0.09, y0 - 0.12, a - hw - 0.1, x + 0.09, y0, a + hw + 0.1, SJ.stone);
    }
  };
  // casa minera encalada: zócalo de piedra, contraventanas, tejado de teja y chimenea. street = fachada principal (n/s/w/e)
  H.house = (x0, z0, x1, z1, o = {}) => {
    const fl = o.floors || 2, h = o.h || 3.1, col = o.color ?? rng.pick([SJ.cal, SJ.cal2, SJ.cal, SJ.ocre, SJ.rosa]), st = o.street || 's';
    const back = { n: 's', s: 'n', w: 'e', e: 'w' }[st], wide = (st === 'n' || st === 's') ? x1 - x0 : z1 - z0;
    const open = { n: [], s: [], w: [], e: [] };
    const fw = wide >= 6.5 ? [0.2, 0.8] : [0.22, 0.78];
    open[st].push(['door', o.doorAt ?? 0.5, 0]); for (const f of fw) open[st].push(['win', f, 0]);
    for (let k = 1; k < fl; k++) for (const f of (wide >= 8 ? [0.2, 0.5, 0.8] : [0.25, 0.75])) open[st].push(['win', f, k]);
    if (o.back !== false) { open[back].push(['door', 0.5, 0]); if (fl > 1) open[back].push(['win', 0.5, 1]); }
    for (const sd of (o.sides || '')) { open[sd].push(['win', 0.5, 0]); if (fl > 1) open[sd].push(['win', 0.5, 1]); }
    if (o.extra) for (const k in o.extra) open[k].push(...o.extra[k]);
    B.house(x0, z0, x1, z1, { floors: fl, h, color: col, pattern: o.pattern ?? PAT.PLASTER, parapet: false, roofPat: PAT.ROOF, roofColor: SJ.tileD, stairs: o.stairs, open, floorPat: o.floorPat, floorColor: o.floorColor });
    // zócalo de piedra y esquinas de sillería
    B.decoBox(x0 - 0.05, 0, z0 - 0.05, x1 + 0.05, 0.7, z1 + 0.05, SJ.stone);
    for (const [cx, cz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) B.decoBox(cx - 0.14, 0.7, cz - 0.14, cx + 0.14, fl * h, cz + 0.22, shade(SJ.stone, 0.08));
    const sc = o.shut ?? rng.pick([SJ.shutG, SJ.shutB, SJ.wood]);
    for (const sd of ['n', 's', 'w', 'e']) for (const op of open[sd]) if (op[0] === 'win') H.shutters(sd, x0, z0, x1, z1, op[1], op[2] * h, sc);
    // cornisa, tejado y chimenea
    const top = fl * h + 0.25, ridge = o.ridge ?? ((st === 'n' || st === 's') ? 'x' : 'z');
    B.decoBox(x0 - 0.12, top - 0.35, z0 - 0.12, x1 + 0.12, top - 0.05, z1 + 0.12, shade(col, -0.12));
    H.gable(x0, z0, x1, z1, top, o.roofH ?? Math.min(2.6, Math.max(1.6, (ridge === 'x' ? z1 - z0 : x1 - x0) * 0.22)), o.roof ?? (rng.next() < 0.5 ? SJ.tile : shade(SJ.tile, -0.08)), ridge);
    if (o.chimney !== false) { const cx = lerp(x0, x1, rng.range(0.2, 0.8)), cz = lerp(z0, z1, rng.range(0.3, 0.7)); B.decoBox(cx - 0.32, top, cz - 0.32, cx + 0.32, top + 2.5, cz + 0.32, shade(col, -0.18)); B.decoBox(cx - 0.4, top + 2.5, cz - 0.4, cx + 0.4, top + 2.7, cz + 0.4, SJ.dstone); }
    return top;
  };
  // tapia de piedra seca (cobertura baja)
  H.dry = (axis, a0, a1, c, h = 1.2, o = {}) => B.wall(axis, a0, a1, c, o.y ?? 0, h, 0.5, { pattern: PAT.BRICK, color: o.color ?? 0x8c8270, kind: 'cover', open: o.open, jag: o.jag });
  // carro de mulas (cobertura)
  H.cart = (x, z, ax = 'x', y = 0) => {
    const L = 3, W = 1.5;
    if (ax === 'x') { B.box(x - L / 2, y + 0.65, z - W / 2, x + L / 2, y + 1.25, z + W / 2, { pattern: PAT.WOOD, color: SJ.plank, kind: 'cover' }); B.box(x - 0.4, y, z - 0.6, x + 0.4, y + 0.65, z + 0.6, { noRender: true, kind: 'cover' }); for (const s of [-1, 1]) B.deco(GEO.cyl(0.6, 0.6, 0.1, 14), x + 0.3, y + 0.6, z + s * 0.82, SJ.wood, { rx: Math.PI / 2 }); B.decoBox(x - L / 2 - 2.2, y + 0.66, z - 0.05, x - L / 2, y + 0.74, z + 0.05, SJ.wood); }
    else { B.box(x - W / 2, y + 0.65, z - L / 2, x + W / 2, y + 1.25, z + L / 2, { pattern: PAT.WOOD, color: SJ.plank, kind: 'cover' }); B.box(x - 0.6, y, z - 0.4, x + 0.6, y + 0.65, z + 0.4, { noRender: true, kind: 'cover' }); for (const s of [-1, 1]) B.deco(GEO.cyl(0.6, 0.6, 0.1, 14), x + s * 0.82, y + 0.6, z + 0.3, SJ.wood, { rz: Math.PI / 2 }); B.decoBox(x - 0.05, y + 0.66, z - L / 2 - 2.2, x + 0.05, y + 0.74, z - L / 2, SJ.wood); }
  };
  // vagoneta de mineral sobre la vía (cobertura baja)
  H.wagon = (x, z, ax = 'x', y = 0) => {
    const w = ax === 'x' ? 1.7 : 1.1, d = ax === 'x' ? 1.1 : 1.7;
    B.box(x - w / 2, y + 0.3, z - d / 2, x + w / 2, y + 1.2, z + d / 2, { pattern: PAT.METAL, color: SJ.rust, kind: 'cover' });
    B.decoBox(x - w / 2 + 0.1, y + 1.2, z - d / 2 + 0.1, x + w / 2 - 0.1, y + 1.42, z + d / 2 - 0.1, SJ.coal);
    for (const s of [-1, 1]) for (const t of [-1, 1]) B.deco(GEO.cyl(0.2, 0.2, 0.08, 10), x + (ax === 'x' ? s * 0.55 : t * 0.5), y + 0.2, z + (ax === 'x' ? t * 0.5 : s * 0.55), SJ.iron, ax === 'x' ? { rx: Math.PI / 2 } : { rz: Math.PI / 2 });
  };
  // vía de las vagonetas (carriles y traviesas, solo decoración)
  H.rail = (x0, z0, x1, z1, y = 0) => {
    const L = Math.hypot(x1 - x0, z1 - z0), ry = Math.atan2(x1 - x0, z1 - z0), n = Math.ceil(L / 0.7), px = (z1 - z0) / L, pz = -(x1 - x0) / L;
    for (const s of [-0.3, 0.3]) B.deco(GEO.box(0.06, 0.08, 1), (x0 + x1) / 2 + px * s, y + 0.12, (z0 + z1) / 2 + pz * s, SJ.iron, { ry, sz: L });
    for (let i = 0; i <= n; i++) { const t = i / n; B.deco(GEO.box(0.9, 0.07, 0.18), lerp(x0, x1, t), y + 0.04, lerp(z0, z1, t), SJ.wood, { ry }); }
  };
  // plátano de sombra
  H.plane = (x, z, s = 1, y = 0) => {
    B.box(x - 0.26, y, z - 0.26, x + 0.26, y + 4 * s, z + 0.26, { pattern: PAT.WOOD, color: 0x6a5a44, kind: 'tree', noRender: true });
    B.deco(GEO.cyl(0.2 * s, 0.3 * s, 4.4 * s, 7), x, y + 2.2 * s, z, 0x8a7a62);
    for (let k = 0; k < 5; k++) { const a = k * 1.3 + rng.range(0, 1), r = k ? 1.3 * s : 0; B.deco(GEO.sphere(1, 8, 6), x + Math.cos(a) * r, y + (5.2 + rng.range(-0.3, 0.7)) * s, z + Math.sin(a) * r, shade(SJ.leaf, rng.range(-0.1, 0.1)), { sx: 2 * s, sy: 1.5 * s, sz: 2 * s }); }
  };
  // letrero pintado sobre una fachada
  H.signboard = (x, y, z, ry, w, h, lines, bg = '#e6dcc4') => B.panel(x, y, z, ry, w, h, (g, W, Hh) => {
    g.fillStyle = bg; g.fillRect(0, 0, W, Hh); g.strokeStyle = '#3a2a1e'; g.lineWidth = Math.max(3, Hh * 0.05); g.strokeRect(g.lineWidth, g.lineWidth, W - 2 * g.lineWidth, Hh - 2 * g.lineWidth);
    g.fillStyle = '#2a2018'; g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((t, i) => { const fs = Math.min(Hh / (lines.length + 0.6), W / (t.length * 0.62)); g.font = `bold ${fs | 0}px Georgia, serif`; g.fillText(t, W / 2, Hh * (i + 1) / (lines.length + 1)); });
  }, { px: 512 });
  // esfera del reloj del campanario (números romanos, parado a las diez y diez)
  H.clock = (x, y, z, ry, r = 1.2) => {
    B.panel(x, y, z, ry, r * 2, r * 2, (g, W) => {
      const c = W / 2; g.clearRect(0, 0, W, W); g.fillStyle = '#e8e0cb'; g.beginPath(); g.arc(c, c, c * 0.97, 0, TAU); g.fill();
      g.lineWidth = W * 0.035; g.strokeStyle = '#2a2622'; g.stroke(); g.fillStyle = '#2a2622'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${W * 0.1 | 0}px Georgia, serif`;
      const N = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      N.forEach((t, i) => { const a = i / 12 * TAU; g.fillText(t, c + Math.sin(a) * c * 0.74, c - Math.cos(a) * c * 0.74); });
      const hand = (a, L, w) => { g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(a) * L, c - Math.cos(a) * L); g.stroke(); };
      hand((10 + 10 / 60) / 12 * TAU, c * 0.45, W * 0.04); hand(10 / 60 * TAU, c * 0.66, W * 0.025);
      g.beginPath(); g.arc(c, c, W * 0.03, 0, TAU); g.fill();
    }, { px: 256, alpha: true });
    B.deco(GEO.torus(r * 1.02, 0.09, 28, 5), x, y, z, SJ.dstone, { ry });
  };
  // construye a otra cota: lo que fn crea en y=0 (bloques y decoración) se sube dy metros
  H.lift = (dy, fn) => {
    const n0 = PHYS.blocks.length, D = MapSys.decoBatch, d0 = D.items.length; fn();
    for (let i = n0; i < PHYS.blocks.length; i++) { PHYS.blocks[i].min.y += dy; PHYS.blocks[i].max.y += dy; }
    for (let i = d0; i < D.items.length; i++) D.items[i].m.elements[13] += dy;
  };
  return H;
}

MAPS.pueblo = {
  name: { es: 'San Juan de las Minas', en: 'San Juan de las Minas' },
  desc: { es: 'El pueblo minero: la calle de las casas mineras, la taberna La Galena, la plaza del campanario del reloj y, arriba, el patio de la mina con el castillete y la galería nueve.', en: 'The mining town: the street of miners\' houses, La Galena tavern, the square under the clock tower and, up the hill, the mine yard with the headframe and gallery nine.' },
  thumb: ['#4a5466', '#c9a27a', '#6e5d4a'],
  theme: { skyTop: 0x46505f, skyMid: 0xc49c74, skyBot: 0x8a765e, fog: 0x9c8870, fogNear: 34, fogFar: 200, sun: 0xffcf9a, sunI: 2.4, sunDir: [-0.62, 0.42, 0.38], hemiTop: 0xd6c6ae, hemiBot: 0x6a5e4c, hemiI: 1.3, exposure: 1.05 },
  build(B) {
    const H = sjHelpers(B), Y = 2.2;   // Y = cota del patio de la mina
    B.bounds(-56, -38, 56, 36, 22);
    const street = [-56, -4, 14, 4], plaza = [-14, -13, 14, 13], street2 = [14, -4, 29, 4], yard = [37, -38, 56, 30];
    B.ground(-56, -38, 56, 36, { holes: [street, plaza, street2, yard], pattern: PAT.DIRT, color: 0x86765a });
    B.ground(-56, -4, -14, 4, { pattern: PAT.COBBLE, color: 0x857d70 });
    B.ground(...plaza, { pattern: PAT.COBBLE, color: 0x938a7c });
    B.ground(...street2, { pattern: PAT.COBBLE, color: 0x857d70 });
    B.ground(...yard, { y: Y, depth: 4.4, pattern: PAT.DIRT, color: 0x6e6250 });
    // ============ límites: tapia de piedra seca
    H.dry('x', -56, 37, 35.6, 1.3); H.dry('x', -56, 37, -37.6, 1.4); H.dry('z', -37, -4.5, -55.6, 1.4); H.dry('z', 4.5, 35.5, -55.6, 1.4);
    H.dry('x', 37, 56, -37.6, 1.2, { y: Y }); H.dry('z', -37, 29.6, 55.6, 1.2, { y: Y });
    // salida oeste de la calle cerrada: carros y sacos (el pueblo está cercado)
    H.cart(-54, -1.8, 'z'); B.sandbags(-53.2, 0.8, -53.2, 3.6);

    // ============ CALLE DE LAS CASAS MINERAS (z de -4 a 4)
    H.house(-56, -15, -50, -4, { street: 's', stairs: { side: 'w', from: 'n' } }); H.house(-50, -15, -44, -4, { street: 's', floors: 1 });
    H.house(-42.5, -14.5, -35.5, -4, { street: 's', color: SJ.ocre, sides: 'w' }); H.house(-35.5, -14, -30.5, -4, { street: 's', floors: 1, sides: 'e' });
    H.house(-27.5, -15, -22, -4, { street: 's', sides: 'w', stairs: { side: 'e', from: 'n' } }); H.house(-22, -14, -16, -4, { street: 's', floors: 1, color: SJ.rosa, sides: 'e' });
    H.house(-56, 4, -50, 14, { street: 'n', floors: 1 }); H.house(-50, 4, -44, 13, { street: 'n', stairs: { side: 'w', from: 's' } });
    H.house(-42.5, 4, -36.5, 14, { street: 'n', sides: 'w', stairs: { side: 'e', from: 's' } }); H.house(-36.5, 4, -32, 13.5, { street: 'n', floors: 1, sides: 'e' });
    H.house(-29, 4, -24.5, 13, { street: 'n', floors: 1, sides: 'w' });
    // taberna «La Galena» (puerta a la calle y a la plaza; mostrador y mesas dentro)
    H.house(-24.5, 4, -14, 13, { street: 'n', color: SJ.cal, sides: 'e', extra: { e: [['door', 0.5, 0]] }, stairs: { side: 'w', from: 's' } });
    H.signboard(-19.2, 5.2, 3.88, Math.PI, 3.6, 1.1, ['TABERNA', 'LA GALENA']);
    B.box(-20.8, 0.06, 10.3, -16.8, 1.1, 11.0, { pattern: PAT.WOOD, color: 0x4e3a28, kind: 'cover' });
    for (const [x, z] of [[-21.6, 6.6], [-17.2, 7.0]]) { B.box(x - 0.5, 0.75, z - 0.5, x + 0.5, 0.8, z + 0.5, { pattern: PAT.WOOD, color: SJ.plank, kind: 'cover' }); B.deco(GEO.cyl(0.05, 0.05, 0.75, 6), x, 0.4, z, SJ.wood); }
    B.barrel(-23.4, 0.06, 11.6); B.barrel(-23.4, 0.06, 10.6);
    // carros, barriles y cajas por la calle
    H.cart(-40, 1.6); B.crate(-47, 0, -3, 1.0); B.crate(-47.2, 0, -1.9, 0.8); B.barrel(-31, 0, -3.2); B.barrel(-30.2, 0, -3.4); B.crate(-25.5, 0, 3.1, 1.0);
    B.sandbags(-33, 1.4, -29.4, -0.6); B.sandbags(-46, 3.4, -44, 3.4);
    for (const [x, z] of [[-49, -3.6], [-34, 3.6], [-20, -3.6], [20, 3.6]]) B.lamp(x, z);

    // ============ HUERTOS Y CALLEJÓN NORTE (z de -38 a -15)
    for (const [a, b, c, d] of [[-54, -46, -35, -20], [-43, -33, -35, -21], [-30, -17, -35, -22]]) {
      const m = (a + b) / 2, mz = (c + d) / 2;
      H.dry('x', a, b, c, 0.9); H.dry('x', a, b, d, 0.9, { open: [{ type: 'door', at: m, w: 2.2 }] }); H.dry('z', c, d, a, 0.9); H.dry('z', c, d, b, 0.9, { open: [{ type: 'door', at: mz, w: 2.2 }] });
      for (let x = a + 1.2; x < b - 0.8; x += 1.4) for (let z = c + 1.4; z < d - 0.8; z += 0.9) if (B.rng.next() < 0.85) B.deco(GEO.sphere(0.32, 5, 4), x + B.rng.range(-0.15, 0.15), 0.16, z, shade(SJ.crop, B.rng.range(-0.12, 0.1)), { sy: B.rng.range(0.6, 1.1) });
    }
    H.house(-12, -37, -7.5, -32.5, { street: 'e', floors: 1, h: 3.2, color: SJ.ocre, back: false, chimney: false });   // cobertizo de aperos
    B.box(-39.8, 0, -19.3, -37.2, 2.6, -16.7, { pattern: PAT.DIRT, color: 0xb89a50, kind: 'cover', noRender: true });   // pajar
    B.deco(GEO.cyl(1.3, 1.5, 2.2, 14), -38.5, 1.1, -18, 0xb89a50); B.deco(GEO.dome(1.32, 14, 6), -38.5, 2.2, -18, 0xc2a458);
    B.crate(-26, 0, -17.5, 1.1); B.crate(-50, 0, -17.2, 1.0); B.tree(-50, -27, 0.9); B.tree(-25, -30, 0.85);

    // ============ PLAZA (x de -14 a 14, z de -13 a 13): fuente, plátanos, bancos, carro del mercado
    B.box(-1.6, 0, -1.6, 1.6, 0.8, 1.6, { noRender: true, kind: 'cover' });
    B.deco(GEO.cyl(2.1, 2.2, 0.8, 8), 0, 0.4, 0, SJ.stone, { ry: Math.PI / 8 }); B.deco(GEO.cyl(1.9, 1.9, 0.04, 8), 0, 0.72, 0, 0x55666a, { ry: Math.PI / 8 });
    B.box(-0.4, 0.8, -0.4, 0.4, 2.6, 0.4, { pattern: PAT.CONCRETE, color: SJ.stone, kind: 'cover' });
    B.deco(GEO.cyl(0.6, 0.3, 0.3, 10), 0, 2.75, 0, SJ.stone); B.deco(GEO.sphere(0.28, 10, 7), 0, 3.1, 0, SJ.stone);
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; B.deco(GEO.cyl(0.03, 0.03, 0.4, 6), Math.sin(a) * 0.5, 1.8, Math.cos(a) * 0.5, 0xa88a3a, { rx: Math.PI / 2, ry: a, order: 'YXZ' }); }
    for (const [x, z] of [[-10, -8.5], [10, -8.5], [-10, 8.5], [10, 8.5]]) H.plane(x, z);
    for (const [x0, z0, x1, z1] of [[-7, -11, -5, -10.4], [5, -11, 7, -10.4], [-13, -5, -12.4, -3], [12.4, 4, 13, 6]]) B.box(x0, 0, z0, x1, 0.45, z1, { pattern: PAT.CONCRETE, color: SJ.stone, kind: 'cover' });
    H.cart(6.5, 4.5); B.crate(-7, 0, 6.5, 1.0); B.crate(-6.2, 0, 7.4, 0.8); B.sandbags(4, -6.2, 8, -6.2);
    // banderines de fiesta cruzando la plaza
    for (const [ax, az, bx, bz] of [[-13.6, -12, 13.6, 12], [13.6, -8, -13.6, 12]]) {
      const n = 46; for (let i = 1; i < n; i++) { const t = i / n, x = lerp(ax, bx, t), z = lerp(az, bz, t), y = 6.2 - Math.sin(t * Math.PI) * 1.4;
        B.deco(GEO.cone(0.16, 0.34, 3), x, y - 0.17, z, [0xb3261e, 0xd9c27a, 0xe6e0d0][i % 3], { rx: Math.PI, ry: Math.atan2(bx - ax, bz - az) }); }
    }
    // casas de la plaza: ayuntamiento al noreste, casino al este, casas al sur
    H.house(14, -22, 26, -8, { street: 's', h: 3.6, color: SJ.ocre, sides: 'w', stairs: { side: 'e', from: 'n' } });
    H.signboard(20, 6.6, -7.93, 0, 5, 1.0, ['AYUNTAMIENTO']);
    B.deco(GEO.cyl(0.04, 0.04, 3, 6), 23.5, 8.2, -7.6, SJ.iron, { rx: 0.5 }); B.deco(GEO.box(1.6, 1, 0.02), 24.2, 9.3, -7.0, 0xb08a2e, { rx: 0.5 });
    H.house(15, 5, 25, 14, { street: 'n', sides: 'w', color: SJ.cal2, stairs: { side: 'e', from: 's' } });
    H.signboard(20, 2.7, 4.88, Math.PI, 3.4, 0.7, ['CASINO MINERO']);
    H.house(2, 13, 12, 22, { street: 'n', color: SJ.rosa, sides: 'e', stairs: { side: 'e', from: 's' } });
    H.house(-16, 13, -6, 22, { street: 'n', floors: 1, h: 3.4, sides: 'w' });

    // ============ IGLESIA DE SAN JUAN y CAMPANARIO DEL RELOJ (al norte de la plaza)
    const CH = 11.5;
    B.house(-6, -30, 6, -16, { floors: 1, h: CH, pattern: PAT.BRICK, color: SJ.stone, floorPat: PAT.COBBLE, floorColor: 0x7a7468, parapet: false, roofPat: PAT.ROOF, roofColor: SJ.tileD, solidWalls: true,
      open: { s: [['arch', 0.5, 0, 2.2, 0, 3.4]], w: [['win', 0.3, 0, 1.0, 4.5, 7.8], ['win', 0.7, 0, 1.0, 4.5, 7.8], ['door', 0.5, 0]], e: [['win', 0.3, 0, 1.0, 4.5, 7.8], ['door', 0.84, 0, 1.2, 8.9, 11.3]] } });
    H.gable(-6, -30, 6, -16, CH + 0.25, 3.6, SJ.tile, 'z', 0.3);
    B.decoBox(-6.2, 0, -16.25, 6.2, 1.2, -15.85, SJ.dstone); for (const s of [-1, 1]) B.decoBox(s * 1.1 - 0.3, 0, -16.25, s * 1.1 + 0.3, 3.9, -15.8, SJ.dstone); B.decoBox(-1.4, 3.4, -16.25, 1.4, 4.0, -15.8, SJ.dstone);
    B.deco(GEO.cyl(1.1, 1.1, 0.1, 24), 0, 7.4, -15.84, 0x3a4a6a, { rx: Math.PI / 2 }); B.deco(GEO.torus(1.15, 0.12, 24, 6), 0, 7.4, -15.8, SJ.dstone);
    for (let i = 0; i < 3; i++) B.box(-3.5, 0, -15.6 + i * 0.45, 3.5, 0.6 - i * 0.2, -15.15 + i * 0.45, { pattern: PAT.CONCRETE, color: SJ.stone, kind: 'stairs' });
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) B.box(s > 0 ? 0.9 : -4.6, 0.06, -27 + i * 2, s > 0 ? 4.0 : -0.9, 0.55, -26.5 + i * 2, { pattern: PAT.WOOD, color: 0x4e3a28, kind: 'cover' });
    B.box(-2, 0.06, -29.4, 2, 1.0, -28.4, { pattern: PAT.CONCRETE, color: 0xb0a690, kind: 'cover' });
    // escalera interior al campanario (sube pegada al muro este)
    B.stairs(5.1, -29.4, '+z', 1.1, 0.06, 8.9, { pattern: PAT.WOOD, color: 0x5e4630 });
    B.box(4.55, 8.65, -19.9, 5.7, 8.9, -17.2, { pattern: PAT.WOOD, color: 0x5e4630, kind: 'floor' });
    // torre: base de sillería maciza, reloj en tres caras, cuerpo de campanas con arcos y chapitel
    const TX0 = 6, TX1 = 11, TZ0 = -21, TZ1 = -16, TP = 8.9, tw = 0.35, stone = { pattern: PAT.BRICK, color: 0xa29683 };
    B.box(TX0, 0, TZ0, TX1, TP, TZ1, stone);
    for (const k of [3.2, 6.0, TP - 0.1]) B.decoBox(TX0 - 0.1, k, TZ0 - 0.1, TX1 + 0.1, k + 0.22, TZ1 + 0.1, SJ.dstone);
    B.wall('x', TX0, TX1, TZ0 + tw / 2, TP, 4.2, tw, { ...stone, open: [{ type: 'arch', at: 8.5, w: 2.4, y0: 0.9, y1: 3.4 }] });
    B.wall('x', TX0, TX1, TZ1 - tw / 2, TP, 4.2, tw, { ...stone, open: [{ type: 'arch', at: 8.5, w: 2.4, y0: 0.9, y1: 3.4 }] });
    B.wall('z', TZ0 + tw, TZ1 - tw, TX1 - tw / 2, TP, 4.2, tw, { ...stone, open: [{ type: 'arch', at: -18.5, w: 2.4, y0: 0.9, y1: 3.4 }] });
    B.wall('z', TZ0 + tw, TZ1 - tw, TX0 + tw / 2, TP, 4.2, tw, { ...stone, open: [{ type: 'door', at: -18.5, w: 1.2, y0: 0, y1: 2.4 }] });
    B.box(TX0 - 0.25, TP + 4.2, TZ0 - 0.25, TX1 + 0.25, TP + 4.5, TZ1 + 0.25, { pattern: PAT.CONCRETE, color: SJ.dstone });
    B.deco(GEO.cone(3.7, 5, 4), 8.5, TP + 7.0, -18.5, SJ.tile, { ry: Math.PI / 4 }); B.deco(GEO.cyl(0.05, 0.05, 2.2, 5), 8.5, TP + 10.4, -18.5, SJ.iron); B.deco(GEO.box(0.9, 0.06, 0.06), 8.5, TP + 10.9, -18.5, SJ.iron);
    B.deco(GEO.cyl(0.5, 0.75, 0.9, 12), 8.5, TP + 3.0, -18.5, 0xa8843a); B.deco(GEO.box(1.6, 0.18, 0.18), 8.5, TP + 3.55, -18.5, SJ.wood);
    H.clock(8.5, 7.4, TZ1 + 0.03, 0); H.clock(8.5, 7.4, TZ0 - 0.03, Math.PI); H.clock(TX1 + 0.03, 7.4, -18.5, Math.PI / 2);
    // atrio: pretil bajo delante de la iglesia
    B.box(-14, 0, -13.7, -4, 0.9, -13.2, { pattern: PAT.CONCRETE, color: SJ.stone, kind: 'cover' }); B.box(4, 0, -13.7, 14, 0.9, -13.2, { pattern: PAT.CONCRETE, color: SJ.stone, kind: 'cover' });
    // casas del norte de la plaza (camino de los huertos)
    H.house(-16, -30, -9, -20, { street: 'e', floors: 1, sides: 's', color: SJ.cal2 }); H.house(28, -30, 34, -21, { street: 's', floors: 1, h: 3.4, sides: 'w' });

    // ============ LAVADERO, VÍA DE LAS VAGONETAS Y SUR
    B.box(-8, 0, 24.6, 2, 0.82, 27.4, { pattern: PAT.CONCRETE, color: SJ.stone, kind: 'cover' }); B.decoBox(-7.7, 0.82, 24.9, 1.7, 0.84, 27.1, 0x55666a);
    for (const sx of [-8, -3, 2]) for (const sz of [23.4, 28.6]) B.box(sx - 0.16, 0, sz - 0.16, sx + 0.16, 2.9, sz + 0.16, { pattern: PAT.WOOD, color: SJ.wood, kind: 'pole' });
    B.box(-8.6, 2.9, 23.0, 2.6, 3.1, 29.0, { pattern: PAT.WOOD, color: SJ.wood, kind: 'cover' }); H.gable(-8.6, 23.0, 2.6, 29.0, 3.1, 1.4, SJ.tile, 'x', 0.2);
    H.rail(-56, 31, 36, 31);
    for (const x of [-36, -34.1, -6, 18, 20]) H.wagon(x, 31);
    B.sandbags(-20, 28.3, -15, 28.3); B.sandbags(10, 33.4, 14, 33.4);
    H.house(26, 32.6, 32, 36, { street: 'n', floors: 1, h: 3.2, color: SJ.ocre, back: false });   // casa del guardavía
    for (let i = 0; i < 4; i++) B.decoBox(-46.2 + i * 0.1, i * 0.19, 25, -43.8 + i * 0.1, i * 0.19 + 0.18, 26, SJ.wood);
    B.box(-46.3, 0, 25, -43.6, 0.76, 26, { noRender: true, kind: 'cover' });
    B.tree(-40, 22, 1.0); B.tree(-50, 26, 0.9); B.deadTree(8, 26); B.tree(-28, 20, 0.8); B.crate(-12, 0, 18.5, 1.1); B.crate(30, 0, 21, 1.1); B.crate(31, 0, 22.1, 0.9);
    B.sandbags(26, 9, 26, 13);

    // ============ CALLE DE LA MINA: escalinata empedrada que sube al patio, entre muros de contención
    B.stairs(29, 0, '+x', 8, 0, Y, { pattern: PAT.COBBLE, color: 0x857d70, run: 1.0 });
    B.wall('x', 27, 37, -4.15, 0, Y + 0.5, 0.3, { pattern: PAT.BRICK, color: SJ.stone, kind: 'wall' }); B.wall('x', 27, 37, 4.15, 0, Y + 0.5, 0.3, { pattern: PAT.BRICK, color: SJ.stone, kind: 'wall' });
    B.wall('z', -38, 30, 36.85, 0, Y + 0.4, 0.3, { pattern: PAT.BRICK, color: SJ.stone, kind: 'wall', open: [{ type: 'big', at: 0, w: 8, y0: 0, y1: 4 }, { type: 'door', at: 20, w: 1.8, y0: 0, y1: 4 }, { type: 'door', at: -26, w: 1.8, y0: 0, y1: 4 }] });
    B.wall('x', 37, 56, 30.15, 0, Y + 0.4, 0.3, { pattern: PAT.BRICK, color: SJ.stone, kind: 'wall' });
    B.stairs(34.3, 20, '+x', 1.6, 0, Y); B.stairs(34.3, -26, '+x', 1.6, 0, Y);
    B.crate(25, 0, -5.2, 1.0); B.crate(25, 0, 5.4, 1.0);

    // ============ PATIO DE LA MINA (x de 37 a 56, a 2,2 m)
    // castillete: cuatro patas de hierro remachado, arriostramiento, plataforma, dos poleas y tornapuntas hacia la casa de máquinas
    const cx = 45, cz = -10, top = Y + 16, hb = 2.3, ht = 1.3;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      H.beam(cx + sx * hb, Y, cz + sz * hb, cx + sx * ht, top, cz + sz * ht, 0.34, SJ.rust);
      B.box(cx + sx * hb - 0.22, Y, cz + sz * hb - 0.22, cx + sx * hb + 0.22, Y + 2.4, cz + sz * hb + 0.22, { pattern: PAT.METAL, color: SJ.rust, kind: 'pole', noRender: true });
    }
    for (let k = 1; k <= 4; k++) {
      const yk = Y + k * 3.6, hk = hb + (ht - hb) * (k * 3.6) / (top - Y), hk0 = hb + (ht - hb) * ((k - 1) * 3.6) / (top - Y);
      for (const s of [-1, 1]) { B.decoBox(cx + s * hk - 0.08, yk - 0.1, cz - hk, cx + s * hk + 0.08, yk + 0.1, cz + hk, SJ.rust); B.decoBox(cx - hk, yk - 0.1, cz + s * hk - 0.08, cx + hk, yk + 0.1, cz + s * hk + 0.08, SJ.rust); }
      for (const s of [-1, 1]) { H.beam(cx + s * hk0, yk - 3.6, cz - hk0, cx + s * hk, yk, cz + hk, 0.09, SJ.rust); H.beam(cx - hk0, yk - 3.6, cz + s * hk0, cx + hk, yk, cz + s * hk, 0.09, SJ.rust); }
    }
    B.decoBox(cx - 1.7, top, cz - 1.7, cx + 1.7, top + 0.3, cz + 1.7, SJ.plank);
    for (const s of [-1, 1]) { B.decoBox(cx - 1.7, top + 0.3, cz + s * 1.7 - 0.03, cx + 1.7, top + 1.2, cz + s * 1.7 + 0.03, SJ.iron); B.decoBox(cx + s * 1.7 - 0.03, top + 0.3, cz - 1.7, cx + s * 1.7 + 0.03, top + 1.2, cz + 1.7, SJ.iron); }
    for (const s of [-1, 1]) {
      const wy = top + 1.9, wz = cz + s * 0.7;
      B.deco(GEO.torus(1.55, 0.09, 30, 6), cx, wy, wz, SJ.iron);
      for (let i = 0; i < 4; i++) B.deco(GEO.box(0.06, 3.0, 0.06), cx, wy, wz, SJ.iron, { rz: i * Math.PI / 4 });
      B.decoBox(cx - 0.12, top + 0.3, wz - 0.12, cx + 0.12, wy, wz + 0.12, SJ.iron);
      H.beam(cx + 9, Y, cz + s * 1.6, cx + 1.2, top - 0.4, cz + s * 1.1, 0.3, SJ.rust);
      H.beam(cx + 1.5, wy + 1.5, wz, 51, Y + 6.8, wz, 0.05, 0x222222);   // cable a la casa de máquinas
    }
    B.box(cx + 8.6, Y, cz - 2, cx + 9.4, Y + 1.2, cz + 2, { pattern: PAT.CONCRETE, color: SJ.dstone, kind: 'cover' });
    // brocal del pozo y jaula
    B.box(cx - 1.5, Y, cz - 1.5, cx + 1.5, Y + 1.2, cz + 1.5, { pattern: PAT.CONCRETE, color: SJ.dstone, kind: 'cover' });
    B.box(cx - 0.8, Y + 1.2, cz - 0.8, cx + 0.8, Y + 3.6, cz + 0.8, { pattern: PAT.GRATE, color: SJ.iron, kind: 'cover' });
    // casa de máquinas de ladrillo con su chimenea, y taller abierto (se entra por el oeste): se levantan a la cota del patio
    H.lift(Y, () => {
      B.house(50, -15, 56, -5, { floors: 1, h: 7.2, pattern: PAT.BRICK, color: SJ.brick, parapet: false, roofPat: PAT.ROOF, roofColor: SJ.tileD, floorPat: PAT.CONCRETE, floorColor: 0x6a655c, solidWalls: true,
        open: { w: [['big', 0.5, 0, 2.4], ['win', 0.15, 0, 1.0, 3.4, 5.6], ['win', 0.85, 0, 1.0, 3.4, 5.6]], s: [['door', 0.5, 0], ['win', 0.2, 0]], n: [['win', 0.5, 0]] } });
      H.gable(50, -15, 56, -5, 7.45, 1.8, SJ.tile, 'z', 0.3);
      B.box(51, 0.06, -13.5, 53.5, 1.6, -11, { pattern: PAT.METAL, color: SJ.iron, kind: 'cover' }); B.deco(GEO.cyl(1.4, 1.4, 0.4, 20), 52.2, 2.2, -8.5, SJ.iron, { rz: Math.PI / 2 }); B.box(51.9, 0.06, -10, 52.5, 3.6, -7, { noRender: true, kind: 'cover' });
      B.house(39, 12, 47, 20, { floors: 1, h: 3.6, pattern: PAT.BRICK, color: SJ.brick, parapet: false, roofPat: PAT.ROOF, roofColor: SJ.tileD, floorPat: PAT.CONCRETE, floorColor: 0x6a655c, open: { w: [['big', 0.5, 0, 5.2]], n: [['door', 0.2, 0, 2.2]], e: [['win', 0.5, 0]] } });
      H.gable(39, 12, 47, 20, 3.85, 1.4, SJ.tile, 'x', 0.3);
      B.box(42.7, 0.06, 18.35, 46.3, 0.9, 19.25, { pattern: PAT.WOOD, color: SJ.plank, kind: 'cover' });
      B.crate(42, 0.06, 14, 1.0); B.crate(41, 0.06, 14.3, 0.8);
      B.crate(47.5, 0, -33, 1.1); B.crate(40, 0, -27, 1.0); B.crate(52, 0, 12, 1.1); B.crate(52.9, 0, 12.8, 0.9);
    });
    B.barrel(45.8, Y + 0.06, 13.4); B.barrel(45.8, Y + 0.06, 14.3); B.barrel(41, Y, -4.6); B.barrel(41.7, Y, -4.9);
    B.box(53.2, Y, -2.8, 54.8, Y + 20, -1.2, { pattern: PAT.BRICK, color: SJ.brick, kind: 'pole', noRender: true });
    B.deco(GEO.cyl(0.7, 0.95, 20, 14), 54, Y + 10, -2, SJ.brick); B.deco(GEO.cyl(0.82, 0.82, 0.5, 14), 54, Y + 19.9, -2, SJ.dstone);
    H.signboard(49.93, Y + 6.2, -10, -Math.PI / 2, 3.2, 0.55, ['CASA DE MÁQUINAS'], '#d9cfb6'); H.signboard(38.93, Y + 3.1, 16, -Math.PI / 2, 2.4, 0.5, ['TALLER'], '#d9cfb6');
    // galería nueve: boca de sillería con arco y puerta de tablas entornada, en el muro norte del patio
    B.box(40.5, Y, -38, 47.5, Y + 5, -36.9, { pattern: PAT.BRICK, color: SJ.stone, kind: 'wall' });
    B.decoBox(42.5, Y, -36.92, 45.5, Y + 3, -36.86, 0x0c0b0a); B.deco(GEO.cyl(1.5, 1.5, 0.06, 16, 1), 44, Y + 3, -36.89, 0x0c0b0a, { rx: Math.PI / 2 });
    for (const s of [-1, 1]) B.box(44 + s * 1.55 - 0.15, Y, -36.9, 44 + s * 1.55 + 0.15, Y + 3.6, -36.5, { pattern: PAT.WOOD, color: SJ.wood, kind: 'pole' });
    B.decoBox(42.3, Y + 3.45, -36.9, 45.7, Y + 3.75, -36.5, SJ.wood); B.decoBox(42.6, Y, -36.75, 44.0, Y + 2.8, -36.67, 0x5a4430, { ry: 0.25 });
    H.signboard(44, Y + 4.25, -36.86, 0, 4.0, 0.7, ['GALERÍA N.º 9'], '#cfc4a8');
    H.rail(44, -36.5, 44, -18, Y); H.wagon(44, -21, 'z', Y); H.wagon(44, -28, 'z', Y);
    // escombrera: montón de estéril en gradas
    for (const [r, h] of [[6.5, 1.0], [4.8, 2.0], [3.0, 3.0]]) B.box(50.5 - r * 0.8, Y, -27 - r * 0.6, 50.5 + r * 0.8, Y + h, -27 + r * 0.6, { pattern: PAT.DIRT, color: 0x4a4440, kind: 'deco' });
    // montones de carbón, puntales, sacos y cajas
    for (const [x, z, s] of [[40.5, 25, 1.3], [51, 23.5, 1.7]]) { B.box(x - s, Y, z - s * 0.8, x + s, Y + s * 0.6, z + s * 0.8, { pattern: PAT.DIRT, color: 0x34312d, kind: 'cover' }); B.deco(GEO.sphere(1, 7, 5), x, Y + s * 0.6, z, 0x2a2826, { sx: s * 0.9, sy: s * 0.45, sz: s * 0.7 }); }
    for (const [x, z] of [[49, 6], [39.5, -16]]) { for (let i = 0; i < 6; i++) B.deco(GEO.cyl(0.12, 0.12, 3, 8), x, Y + 0.13 + Math.floor(i / 3) * 0.24, z + (i % 3) * 0.26 - 0.26, SJ.wood, { rx: Math.PI / 2, rz: Math.PI / 2 }); B.box(x - 1.5, Y, z - 0.45, x + 1.5, Y + 0.5, z + 0.45, { noRender: true, kind: 'cover' }); }
    B.sandbags(48, -19, 52, -19, { y: Y }); B.sandbags(40, 3.4, 40, 6.4, { y: Y });

    // ============ ambiente: humo de la chimenea y paisaje
    B.smoke(54, -2, 0.7); B.smoke(-80, -70, 1.1); B.smoke(90, 50, 1.3);
    B.horizon(0x7f705a, 22, 95, 150, { groundColor: 0x76694e });

    // ============ A / B / C, armas, apariciones
    B.dom('A', -36, 0, 0); B.dom('B', 0, 0, 7); B.dom('C', 45, Y, 3);
    B.stand(8.5, TP, -18.5, 'sniper'); B.stand(44, Y, 16.5, 'lmg'); B.stand(-19, 0.06, 8.2, 'shotgun');
    for (const [x, z] of [[-53, -1], [-53, 2], [-52, 20], [-46, 26], [-38, 26], [-53, 30], [-51, -27], [-44, -18], [-36, -22], [-53, -32]]) B.spawn(0, x, 0, z, -Math.PI / 2);
    for (const [x, z] of [[53, 2], [53, -2], [54, 9], [50, 9], [54, 20], [47, 26], [53, -22], [48, -32], [54, -35], [41, 8]]) B.spawn(1, x, Y, z, Math.PI / 2);
    for (const [x, y, z] of [[-42, 0, 0], [42, Y, 0], [0, 0, -9], [0, 0, 10], [-20, 0, -26], [20, 0, -26], [-22, 0, 20], [22, 0, 24], [-40, 0, -24], [50, Y, 24], [-12, 0, 1], [12, 0, -1], [-31, 0, -9], [31, 0, 12], [50, Y, -32], [-3, 0, 32]]) B.spawn('ffa', x, y, z);
    B.prop('can', 2.2, 0, 7.5); B.prop('can', -26.5, 0, 3.4); B.prop('bucket', -3.2, 0.82, 25.8); B.prop('bucket', 43, Y, 13.5);
  },
};
