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

const MAP_THEME0 = { skyTop: 0x56677a, skyMid: 0xaab3b3, skyBot: 0x868a80, fog: 0x99a09c, fogNear: 38, fogFar: 205, sun: 0xfff1da, sunI: 2.1, sunDir: [0.42, 0.72, -0.32], hemiTop: 0xd5dde0, hemiBot: 0x66665a, hemiI: 1.35, exposure: 1.05 };
const MAPS = {
  // 3.3.0: San Juan, Tres Cruces y Puerto Ánimas se rehicieron desde cero (09f_sanjuan.js, 09g_novela_a.js)
};
// mapa plano solo para pruebas automatizadas (no aparece en el menú)
MAPS.test = {
  name: { es: 'Prueba', en: 'Test' }, desc: { es: '', en: '' }, theme: MAP_THEME0, thumb: ['#555', '#888', '#444'],
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
  theme: { ...MAP_THEME0, fogNear: 160, fogFar: 1500 }, thumb: ['#4a6a8a', '#9ab0a0', '#66763f'],
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

