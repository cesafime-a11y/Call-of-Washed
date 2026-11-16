// ---- 09d_prison.js ----
// =====================================================================
// CÁRCEL — mapa del modo historia. Bloque 1: la enfermería (sala de
// camas y sala de curas, 21 × 14 m, donde despierta el equipo), el
// pasillo principal y un almacén. Todo a oscuras: sin energía, luces de emergencia que fallan.
// Las demás zonas (celdas, comedor, cocina…) se conectan al pasillo.
// =====================================================================
MAPS.carcel = {
  name: { es: 'Cárcel · Enfermería', en: 'Prison · Infirmary' },
  desc: { es: 'Despiertas herido en la enfermería de una cárcel sin energía. Sal antes de que sea tarde.', en: 'You wake wounded in the infirmary of a powerless prison. Get out before it is too late.' },
  story: true,
  thumb: ['#0a0d12', '#4a5a50', '#2a2f2c'],
  theme: { skyTop: 0x05070a, skyMid: 0x0a0d12, skyBot: 0x05070a, fog: 0x07090a, fogNear: 7, fogFar: 38, sun: 0x7f98b8, sunI: 0.1, sunDir: [0.3, 0.8, 0.2], hemiTop: 0x56666e, hemiBot: 0x1c2224, hemiI: 0.42, exposure: 1.2, cloud: 0.1, rays: 0, glow: 0, lamps: true,
    soldFill: 0.7, soldRim: 0.5 },
  build(B) {
    const wall = 0x66746c, wallD = 0x4a5650, floorC = 0x4b4f50, H = 3.2;
    const steel = 0x8a9498, sheet = 0xc9c7bd, stain = 0x5c3a32, blood = 0x3d0f0d;
    B.bounds(-13, -8, 29, 9.5);
    B.ground(-13, -8, 29, 9.5, { y: 0.06, pattern: PAT.CONCRETE, color: 0x4b4f50 });   // el suelo de toda la cárcel está a 0.06: sin escalones entre salas

    // ---------------- enfermería (21 × 14 m): sala de camas + sala de curas al oeste ----------------
    B.house(-12, -7, 9, 7, { floors: 1, floorH: 0, h: H, t: 0.3, solidWalls: true, pattern: PAT.PLASTER, color: wall, floorPat: PAT.CONCRETE, floorColor: floorC, parapet: false, roofPat: PAT.CONCRETE, roofColor: 0x3a3d3e,
      open: { e: [['door', 0.5, 0]], n: [['slit', 0.3, 0], ['slit', 0.62, 0], ['slit', 0.9, 0]], w: [['slit', 0.3, 0], ['slit', 0.7, 0]] } });
    const tile = 0x56625b, tileD = 0x45514a, trim = 0x9aa49a, curtain = 0x7f9a8e, curtainD = 0x6a8478, wood = 0x6e6a5e, paper = 0xd8d4c4;
    // zócalo de azulejo y moldura (se corta en puertas y ventanas)
    const wainscot = (axis, c, a0, a1, side, gaps = []) => {
      let cur = a0;
      for (const [g0, g1] of [...gaps, [a1, a1]]) {
        if (g0 > cur) {
          const [x0, x1, z0, z1] = axis === 'x' ? [cur, g0, c, c + side * 0.02] : [c, c + side * 0.02, cur, g0];
          B.decoBox(x0, 0.06, z0, x1, 1.15, z1, tile); B.decoBox(x0, 1.15, z0, x1, 1.21, z1, trim);
          for (let a = cur + 0.6; a < g0; a += 0.6) { if (axis === 'x') B.decoBox(a - 0.006, 0.06, z0, a + 0.006, 1.15, z1 + side * 0.004, tileD); else B.decoBox(x0, 0.06, a - 0.006, x1 + side * 0.004, 1.15, a + 0.006, tileD); }
          for (const y of [0.45, 0.82]) { if (axis === 'x') B.decoBox(cur, y - 0.005, z0, g0, y + 0.005, z1 + side * 0.004, tileD); else B.decoBox(x0, y - 0.005, cur, x1 + side * 0.004, y + 0.005, g0, tileD); }
        }
        cur = Math.max(cur, g1);
      }
    };
    wainscot('x', -6.7, -11.7, 8.7, 1); wainscot('x', 6.7, -11.7, 8.7, -1);
    wainscot('z', -11.7, -6.7, 6.7, 1); wainscot('z', 8.7, -6.7, 6.7, -1, [[-0.65, 0.65]]);
    // tabique de la sala de curas: arco al centro y dos ventanillas
    B.wall('z', -6.7, 6.7, -8.6, 0, H, 0.2, { open: [{ type: 'arch', at: 0, w: 1.8 }, { type: 'win', at: -4.2, w: 1.6 }, { type: 'win', at: 4.2, w: 1.6 }], pattern: PAT.PLASTER, color: wallD });
    for (const zc of [-4.2, 4.2]) { for (let i = -3; i <= 3; i++) B.decoBox(-8.62, 0.95, zc + i * 0.22 - 0.012, -8.58, 2.05, zc + i * 0.22 + 0.012, steel); B.decoBox(-8.75, 0.93, zc - 0.85, -8.45, 0.97, zc + 0.85, trim); }
    wainscot('z', -8.48, -6.7, -0.95, 1, [[-5.0, -3.4]]); wainscot('z', -8.48, 0.95, 6.7, 1, [[3.4, 5.0]]);
    // barrotes en las ventanas altas
    for (const [x, z] of [[-11.7 + 21 * 0.3 - 0.0, -6.85], [-12 + 21 * 0.62, -6.85], [-12 + 21 * 0.9, -6.85]]) for (let i = -3; i <= 3; i++) B.decoBox(x + i * 0.22 - 0.015, 1.0, z - 0.02, x + i * 0.22 + 0.015, 1.35, z + 0.02, 0x3a3e40);
    for (const z of [-7 + 14 * 0.3, -7 + 14 * 0.7]) for (let i = -3; i <= 3; i++) B.decoBox(-11.87, 1.0, z + i * 0.22 - 0.015, -11.83, 1.35, z + i * 0.22 + 0.015, 0x3a3e40);

    // camas con cabecera contra el muro: dir -1 norte, +1 sur. Mesilla, toma de oxígeno y cortina
    const bed = (x, z, dir, o = {}) => {
      const z0 = dir < 0 ? z : z - 2.05, z1 = dir < 0 ? z + 2.05 : z, hz = dir < 0 ? z0 : z1;
      B.box(x - 0.48, 0.06, z0, x + 0.48, 0.5, z1, { pattern: PAT.METAL, color: steel, kind: 'cover' });
      B.decoBox(x - 0.44, 0.5, z0 + 0.04, x + 0.44, 0.62, z1 - 0.04, o.sheet ? sheet : 0x9aa59c);
      B.decoBox(x - 0.3, 0.62, hz - dir * 0.08 - 0.2, x + 0.3, 0.72, hz - dir * 0.08 + 0.2, 0xd8d6cc);     // almohada
      if (o.body) { B.decoBox(x - 0.3, 0.62, z0 + 0.3, x + 0.3, 0.84, z1 - 0.15, sheet); B.decoBox(x - 0.12, 0.62, z0 + 0.52, x + 0.12, 0.86, z0 + 0.82, stain); }
      else if (!o.made) B.decoBox(x - 0.46, 0.6, dir < 0 ? z1 - 0.7 : z0 + 0.1, x + 0.38, 0.68, dir < 0 ? z1 - 0.1 : z0 + 0.7, sheet, { ry: 0.12 });   // sábana revuelta
      B.decoBox(x - 0.5, 0.5, dir < 0 ? z0 : z1 - 0.06, x + 0.5, 1.05, dir < 0 ? z0 + 0.06 : z1, steel);
      B.decoBox(x - 0.5, 0.06, dir < 0 ? z1 - 0.05 : z0, x + 0.5, 0.75, dir < 0 ? z1 : z0 + 0.05, steel);                        // pies de la cama
      for (const sx of [-0.42, 0.42]) for (const sz of [z0 + 0.08, z1 - 0.08]) B.deco(GEO.cyl(0.04, 0.04, 0.03, 8), x + sx, 0.08, sz, 0x1c1c1c, { rx: Math.PI / 2 });
      // toma de oxígeno y luz de cabecera en la pared
      const wz = dir < 0 ? -6.68 : 6.68, ws = -dir;
      B.decoBox(x - 0.35, 1.45, wz, x + 0.35, 1.62, wz + ws * 0.06, 0xb8bab0); B.decoBox(x - 0.25, 1.5, wz + ws * 0.06, x - 0.17, 1.58, wz + ws * 0.09, 0x3a8a4a); B.decoBox(x + 0.17, 1.5, wz + ws * 0.06, x + 0.25, 1.58, wz + ws * 0.09, 0xdedbd2);
      B.decoBox(x - 0.25, 2.05, wz, x + 0.25, 2.12, wz + ws * 0.12, 0x8a8e88);
      // mesilla
      if (!o.noTable) {
        const tx = x + 0.82;
        B.box(tx - 0.24, 0.06, hz + (dir < 0 ? 0.05 : -0.5), tx + 0.24, 0.8, hz + (dir < 0 ? 0.5 : -0.05), { pattern: PAT.METAL, color: 0xa8aca4, kind: 'cover' });
        B.decoBox(tx - 0.2, 0.42, hz + (dir < 0 ? 0.5 : -0.52), tx + 0.2, 0.44, hz + (dir < 0 ? 0.52 : -0.5), 0x6a6e68);
        B.deco(GEO.cyl(0.035, 0.03, 0.1, 8), tx - 0.08, 0.85, hz - dir * 0.25, 0xc8d0d0); B.deco(GEO.cyl(0.02, 0.02, 0.07, 6), tx + 0.1, 0.835, hz - dir * 0.2, 0xb8902c);
      }
      // cortina sobre riel: abierta (recogida contra el muro), cerrada o rasgada
      if (o.curtain) {
        const cx = x - 1.3, za = dir < 0 ? -6.7 : 6.7, zb = za - dir * 2.5;
        B.decoBox(cx - 0.02, 2.62, Math.min(za, zb), cx + 0.02, 2.66, Math.max(za, zb), steel);
        const k = o.curtain === 'open' ? 0.25 : 1, zc = za - dir * 2.5 * k;
        for (let i = 0, n = Math.ceil(2.5 * k / 0.18); i < n; i++) {
          const a = za - dir * (i * 0.18), b2 = za - dir * Math.min(2.5 * k, (i + 1) * 0.18), low = o.curtain === 'torn' && i > n * 0.4 ? rand01(i) * 1.1 + 0.6 : 0.4;
          B.decoBox(cx - (i & 1 ? 0.035 : 0.015), low, Math.min(a, b2), cx + (i & 1 ? 0.035 : 0.015), 2.6, Math.max(a, b2), i & 1 ? curtain : curtainD);
        }
        void zc;
      }
    };
    const rand01 = (i) => { const s = Math.sin(i * 127.1 + 31.7) * 43758.5; return s - Math.floor(s); };
    const nz = -6.7, sz = 6.7;
    bed(-6.8, nz, -1, { curtain: 'open' }); bed(-4.0, nz, -1, { body: true, curtain: 'closed' }); bed(-1.2, nz, -1, { body: true, curtain: 'torn' }); bed(1.6, nz, -1, { curtain: 'open' }); bed(4.4, nz, -1, { made: true, curtain: 'closed' });
    bed(-6.8, sz, 1, { sheet: true, curtain: 'closed' }); bed(-4.0, sz, 1, { curtain: 'torn' }); bed(-1.2, sz, 1, { body: true, curtain: 'open' }); bed(1.6, sz, 1, { made: true, noTable: true });
    // monitores cardíacos apagados junto a dos camas (pantalla con la última línea)
    for (const [x, z, dir] of [[-3.0, -5.2, -1], [-0.2, 5.3, 1]]) {
      B.decoBox(x - 0.02, 0.06, z - 0.02, x + 0.02, 1.3, z + 0.02, steel); B.decoBox(x - 0.2, 0.06, z - 0.2, x + 0.2, 0.1, z + 0.2, steel);
      B.decoBox(x - 0.22, 1.3, z - 0.15, x + 0.22, 1.62, z + 0.15, 0x2a2e2c); B.decoBox(x - 0.18, 1.34, z - dir * 0.152, x + 0.18, 1.58, z - dir * 0.158, 0x0e1a14);
      B.decoBox(x - 0.16, 1.45, z - dir * 0.16, x + 0.16, 1.46, z - dir * 0.162, 0x2a8a4a);
    }

    // sala de curas: camilla con foco, carro de instrumental, vitrinas, lavabo, negatoscopio y escritorio
    B.box(-10.9, 0.06, -3.7, -9.7, 0.82, -1.7, { pattern: PAT.METAL, color: 0x8a9294, kind: 'cover' });
    B.decoBox(-10.85, 0.82, -3.65, -9.75, 0.92, -1.75, 0x5a7a72); B.decoBox(-10.8, 0.92, -2.1, -9.8, 0.98, -1.78, 0x6a8a82);
    B.decoBox(-10.9, 0.92, -3.3, -9.7, 0.94, -2.6, blood);
    B.deco(GEO.cyl(0.02, 0.02, 0.9, 6), -10.3, 2.75, -2.7, steel); B.deco(GEO.cyl(0.32, 0.22, 0.14, 14), -10.3, 2.28, -2.7, 0xb8bcb4); B.deco(GEO.cyl(0.24, 0.24, 0.02, 14), -10.3, 2.2, -2.7, 0xe8e4c8);
    B.box(-9.5, 0.06, 1.7, -8.95, 0.9, 2.3, { pattern: PAT.METAL, color: steel, kind: 'cover' }); B.decoBox(-9.52, 0.9, 1.68, -8.93, 0.93, 2.32, 0xb8bcb4);
    for (let i = 0; i < 4; i++) B.decoBox(-9.45 + i * 0.12, 0.93, 1.8, -9.42 + i * 0.12, 0.95, 2.1, 0xd0d4d0, { ry: i * 0.3 });
    // vitrinas de medicinas contra el muro oeste (cristal roto en una)
    for (const z of [-5.6, -4.3, 3.2, 4.5]) {
      B.box(-11.7, 0.06, z - 0.6, -11.25, 2.05, z + 0.6, { pattern: PAT.METAL, color: 0xc0c4bc, kind: 'cover' });
      for (const y of [0.5, 1.0, 1.5]) B.decoBox(-11.24, y, z - 0.55, -11.22, y + 0.02, z + 0.55, 0x8a8e88);
      B.decoBox(-11.22, 0.1, z - 0.004, -11.2, 2.0, z + 0.004, 0x8a8e88);
      for (let i = 0; i < 5; i++) B.decoBox(-11.6, 1.02, z - 0.45 + i * 0.2, -11.45, 1.18 + (i % 2) * 0.06, z - 0.33 + i * 0.2, i % 3 ? 0xd8d4c4 : 0x9a5a3a);
    }
    B.decoBox(-11.2, 0.07, 3.0, -10.7, 0.075, 3.6, 0xc8d8dc);    // cristales en el suelo
    B.box(-11.7, 0.06, -2.4, -11.15, 0.85, -1.4, { pattern: PAT.METAL, color: 0xc8c8c0, kind: 'cover' });
    B.decoBox(-11.65, 0.85, -2.3, -11.2, 0.88, -1.5, 0xe0e0d8); B.deco(GEO.cyl(0.015, 0.015, 0.22, 6), -11.6, 1.0, -1.9, steel, { rz: 0.9 });
    B.panel(-11.68, 1.55, -1.9, Math.PI / 2, 0.55, 0.7, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#5a6a6c'); g.addColorStop(1, '#2a3234'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = '#8a8a82'; x.lineWidth = 8; x.strokeRect(0, 0, w, h); x.strokeStyle = 'rgba(220,230,230,.6)'; x.lineWidth = 2; x.beginPath(); x.moveTo(w * 0.2, h * 0.1); x.lineTo(w * 0.7, h * 0.9); x.moveTo(w * 0.55, 0); x.lineTo(w * 0.35, h * 0.5); x.stroke(); });
    B.panel(-9.8, 1.7, -6.68, 0, 1.0, 0.7, (x, w, h) => { x.fillStyle = '#d8dcd4'; x.fillRect(0, 0, w, h); x.fillStyle = '#1a1c1c'; x.fillRect(10, 10, w - 20, h - 20); x.strokeStyle = '#c8d0d0'; x.globalAlpha = 0.75; x.lineWidth = 5;
      for (let i = 0; i < 6; i++) { x.beginPath(); x.ellipse(w / 2, h * 0.2 + i * h * 0.11, w * (0.14 + i * 0.03), h * 0.04, 0, 0, Math.PI); x.stroke(); } x.fillStyle = '#c8d0d0'; x.fillRect(w / 2 - 5, h * 0.12, 10, h * 0.76); });
    // escritorio del médico con silla, papeles y archivador
    B.box(-11.7, 0.06, 5.2, -10.4, 0.76, 6.6, { pattern: PAT.WOOD, color: wood, kind: 'cover' });
    B.decoBox(-11.4, 0.76, 5.6, -11.0, 0.78, 6.0, paper, { ry: 0.3 }); B.decoBox(-11.0, 0.76, 6.0, -10.7, 0.785, 6.4, paper, { ry: -0.2 }); B.decoBox(-11.55, 0.76, 6.15, -11.3, 0.95, 6.45, 0x2a2c2a);
    B.decoBox(-10.25, 0.45, 5.6, -9.85, 0.5, 6.0, 0x2a2c2e); B.decoBox(-9.88, 0.5, 5.6, -9.84, 0.95, 6.0, 0x2a2c2e); B.deco(GEO.cyl(0.03, 0.03, 0.42, 6), -10.05, 0.25, 5.8, steel);
    B.box(-9.5, 0.06, 6.15, -8.95, 1.35, 6.7, { pattern: PAT.METAL, color: 0x7a8278, kind: 'cover' });
    for (const y of [0.4, 0.8, 1.2]) B.decoBox(-9.45, y, 6.13, -9.0, y + 0.02, 6.15, 0x4a5048);
    for (let i = 0; i < 7; i++) B.decoBox(-10.6 + rand01(i + 40) * 1.6, 0.065, 4.2 + rand01(i + 50) * 2, -10.4 + rand01(i + 40) * 1.6, 0.07, 4.45 + rand01(i + 50) * 2, paper, { ry: rand01(i + 60) * 3 });
    // lavabo con espejo roto
    B.box(-11.7, 0.06, 1.9, -11.3, 0.85, 2.6, { pattern: PAT.CONCRETE, color: 0xb8bab4, kind: 'cover' }); B.decoBox(-11.65, 0.85, 1.95, -11.25, 0.88, 2.55, 0xd0d2cc);
    B.decoBox(-11.68, 1.15, 1.95, -11.66, 1.75, 2.55, 0x6a7a80); B.deco(GEO.cyl(0.015, 0.015, 0.12, 6), -11.55, 0.95, 2.25, steel);

    // puesto de enfermería en L: monitor, teléfono, papeles, silla y archivo
    B.box(0.8, 0.06, 0.9, 4.0, 1.05, 1.6, { pattern: PAT.WOOD, color: wood, kind: 'cover' });
    B.box(3.3, 0.06, 1.6, 4.0, 1.05, 3.4, { pattern: PAT.WOOD, color: wood, kind: 'cover' });
    B.decoBox(0.75, 1.05, 0.85, 4.05, 1.1, 1.65, 0x8a8678); B.decoBox(3.25, 1.05, 1.6, 4.05, 1.1, 3.45, 0x8a8678);
    B.decoBox(1.4, 1.1, 1.0, 1.85, 1.48, 1.45, 0xc0bca8); B.decoBox(1.45, 1.15, 0.98, 1.8, 1.43, 1.0, 0x16201c); B.decoBox(1.5, 1.1, 1.45, 1.75, 1.18, 1.6, 0xb0ac98);
    B.decoBox(2.4, 1.1, 1.1, 2.62, 1.16, 1.32, 0x2a2a28); B.decoBox(2.75, 1.1, 1.05, 3.05, 1.115, 1.45, paper, { ry: 0.2 }); B.decoBox(3.45, 1.1, 2.2, 3.85, 1.115, 2.6, paper, { ry: -0.4 });
    B.decoBox(2.2, 0.45, 2.0, 2.6, 0.5, 2.4, 0x2a2c2e); B.decoBox(2.2, 0.5, 2.36, 2.6, 0.95, 2.4, 0x2a2c2e); B.deco(GEO.cyl(0.03, 0.03, 0.42, 6), 2.4, 0.25, 2.2, steel);
    B.box(0.0, 0.06, 2.6, 0.6, 1.4, 3.2, { pattern: PAT.METAL, color: 0x7a8278, kind: 'cover' });
    B.panel(2.4, 0.72, 0.885, Math.PI, 1.6, 0.32, (x, w, h) => { x.fillStyle = '#d8d4c4'; x.fillRect(0, 0, w, h); x.fillStyle = '#1c3a5a'; x.font = `700 ${h * 0.62}px "Barlow Condensed","Arial Narrow",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('ENFERMERÍA', w / 2, h * 0.55); });

    // camilla volcada, silla de ruedas y barricada a medio hacer junto a la puerta (el paso central queda libre)
    B.box(6.6, 0.06, -3.6, 7.6, 0.9, -3.1, { pattern: PAT.METAL, color: steel, kind: 'cover' });
    B.decoBox(6.6, 0.06, -3.1, 7.6, 0.3, -1.2, sheet, { ry: 0.3 });
    B.box(7.6, 0.06, -2.4, 8.65, 1.7, -1.0, { pattern: PAT.METAL, color: 0x8a9a94, kind: 'cover' });
    B.box(7.7, 0.06, 1.1, 8.65, 0.55, 3.1, { pattern: PAT.METAL, color: steel, kind: 'cover' }); B.decoBox(7.72, 0.55, 1.15, 8.6, 0.62, 3.05, 0x9aa59c, { ry: 0.08 });
    B.decoBox(5.2, 0.06, 3.6, 5.24, 0.65, 4.2, 0x2a2c2e); B.decoBox(5.7, 0.06, 3.6, 5.74, 0.65, 4.2, 0x2a2c2e); B.deco(GEO.torus(0.28, 0.025, 10, 14), 5.2, 0.34, 3.95, 0x2a2c2e, { ry: Math.PI / 2 }); B.deco(GEO.torus(0.28, 0.025, 10, 14), 5.74, 0.34, 3.95, 0x2a2c2e, { ry: Math.PI / 2 });
    B.decoBox(5.22, 0.46, 3.6, 5.72, 0.5, 4.1, 0x3a3c3e); B.decoBox(5.22, 0.5, 4.08, 5.72, 0.98, 4.12, 0x3a3c3e);
    B.crate(7.9, 0.06, 5.6, 0.9, { color: 0x8a8a7e }); B.crate(7.9, 0.96, 5.6, 0.7, { color: 0x7a7a6e });
    B.box(-8.5, 0.06, -2.9, -7.95, 1.9, -1.35, { pattern: PAT.METAL, color: 0x8a9a94, kind: 'cover' });   // armario de ropa de cama
    B.decoBox(-7.95, 0.9, -2.8, -7.9, 1.8, -1.45, 0x5c7078); B.decoBox(-7.9, 1.3, -2.2, -7.86, 1.36, -2.05, 0xb8bcc0);
    // soportes de suero, bombonas de oxígeno y cubos
    for (const [x, z] of [[-5.5, -4.2], [-2.6, -4.3], [0.4, 4.4], [3.0, -4.4]]) { B.decoBox(x - 0.02, 0.06, z - 0.02, x + 0.02, 1.9, z + 0.02, steel); B.decoBox(x - 0.3, 1.88, z - 0.02, x + 0.3, 1.92, z + 0.02, steel); B.decoBox(x - 0.04, 1.4, z - 0.05, x + 0.04, 1.85, z + 0.05, 0xc8d0d0); B.decoBox(x - 0.25, 0.06, z - 0.25, x + 0.25, 0.1, z + 0.25, steel); B.decoBox(x - 0.005, 1.0, z - 0.005, x + 0.005, 1.4, z + 0.005, 0xd8dcd8); }
    for (const [x, z] of [[6.2, -6.4], [6.55, -6.4]]) { B.deco(GEO.cyl(0.11, 0.11, 1.2, 10), x, 0.66, z, 0x3a6a4a); B.deco(GEO.cyl(0.05, 0.08, 0.12, 8), x, 1.32, z, 0xb8bcc0); }
    B.prop('bucket', -3.2, 0.06, 3.4); B.prop('can', 5.2, 0.06, 2.6); B.prop('tire', 6.4, 0.06, -5.6);

    // carteles y pintadas: cruz roja, reloj parado, tablón, "NO ABRAS" con sangre junto a la puerta y huellas de manos
    B.panel(-2.6, 2.25, -6.68, 0, 0.6, 0.6, (x, w, h) => { x.fillStyle = '#d8d4c4'; x.fillRect(0, 0, w, h); x.fillStyle = '#a82a22'; x.fillRect(w * 0.38, h * 0.12, w * 0.24, h * 0.76); x.fillRect(w * 0.12, h * 0.38, w * 0.76, h * 0.24); x.fillStyle = 'rgba(40,30,20,.25)'; x.fillRect(0, h * 0.7, w, h * 0.3); });
    B.panel(8.68, 2.45, 2.2, -Math.PI / 2, 0.42, 0.42, (x, w) => { x.fillStyle = '#e8e4d8'; x.beginPath(); x.arc(w / 2, w / 2, w * 0.47, 0, TAU); x.fill(); x.strokeStyle = '#2a2a28'; x.lineWidth = w * 0.05; x.stroke();
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * w * 0.36, w / 2 + Math.sin(a) * w * 0.36); x.lineTo(w / 2 + Math.cos(a) * w * 0.42, w / 2 + Math.sin(a) * w * 0.42); x.lineWidth = w * 0.025; x.stroke(); }
      x.lineWidth = w * 0.04; x.beginPath(); x.moveTo(w / 2, w / 2); x.lineTo(w / 2 + w * 0.2, w / 2 - w * 0.1); x.moveTo(w / 2, w / 2); x.lineTo(w / 2 - w * 0.05, w / 2 - w * 0.32); x.stroke(); }, { alpha: true });
    B.panel(-5.4, 1.75, 6.68, Math.PI, 1.2, 0.8, (x, w, h) => { x.fillStyle = '#8a6a44'; x.fillRect(0, 0, w, h); x.strokeStyle = '#4a3a28'; x.lineWidth = 10; x.strokeRect(0, 0, w, h);
      const R = (i) => { const s = Math.sin(i * 91.7) * 9999; return s - Math.floor(s); };
      for (let i = 0; i < 9; i++) { x.save(); x.translate(w * (0.12 + R(i) * 0.7), h * (0.15 + R(i + 9) * 0.6)); x.rotate((R(i + 3) - 0.5) * 0.4); x.fillStyle = i % 4 ? '#e8e4d4' : '#e8d870'; x.fillRect(0, 0, w * 0.17, h * 0.26); x.fillStyle = 'rgba(30,30,40,.6)'; for (let l = 0; l < 4; l++) x.fillRect(w * 0.015, h * (0.04 + l * 0.05), w * 0.13 * (0.5 + R(i + l) * 0.5), h * 0.015); x.fillStyle = '#b82a22'; x.beginPath(); x.arc(w * 0.085, h * 0.015, 4, 0, TAU); x.fill(); x.restore(); } });
    B.panel(8.68, 1.75, -4.3, -Math.PI / 2, 1.8, 0.75, (x, w, h) => { x.fillStyle = 'rgba(110,8,6,.88)'; let fs = h * 0.6; x.font = `700 ${fs}px "Impact","Arial Narrow",sans-serif`; const tw = x.measureText('NO ABRAS').width; if (tw > w * 0.88) { fs *= w * 0.88 / tw; x.font = `700 ${fs}px "Impact","Arial Narrow",sans-serif`; }
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.save(); x.translate(w / 2, h / 2); x.rotate(-0.05); x.fillText('NO ABRAS', 0, 0); x.restore();
      for (let i = 0; i < 9; i++) x.fillRect(w * (0.12 + i * 0.09), h * 0.72, 3, h * (0.1 + (i % 3) * 0.08)); }, { alpha: true, px: 512 });
    const hand = (x, w, h) => { x.fillStyle = 'rgba(100,8,6,.8)'; x.beginPath(); x.ellipse(w * 0.5, h * 0.62, w * 0.24, h * 0.2, 0, 0, TAU); x.fill(); for (let i = 0; i < 4; i++) { x.save(); x.translate(w * (0.32 + i * 0.12), h * 0.42); x.rotate((i - 1.5) * 0.15); x.fillRect(-w * 0.045, -h * 0.3, w * 0.09, h * 0.32); x.restore(); } x.save(); x.translate(w * 0.24, h * 0.62); x.rotate(-0.9); x.fillRect(-w * 0.045, -h * 0.22, w * 0.09, h * 0.24); x.restore(); x.fillRect(w * 0.45, h * 0.8, 3, h * 0.2); };
    for (const [x, y, z, ry, rz] of [[8.68, 1.1, -0.95, -Math.PI / 2, 0.3], [8.68, 1.35, 1.0, -Math.PI / 2, -0.2], [-8.47, 1.3, 1.3, Math.PI / 2, 0.1], [3.0, 1.2, -6.68, 0, 0.4]]) B.panel(x, y, z, ry, 0.22, 0.26, hand, { alpha: true, px: 64, rz });
    // suelo: rastros de sangre (arrastre hacia la puerta), manchas, papeles y un desagüe
    B.decoBox(3.8, 0.06, -0.8, 4.6, 0.12, 0.4, blood); B.decoBox(5.0, 0.06, -0.3, 8.7, 0.1, 0.3, blood); B.decoBox(-3.6, 0.06, -3.4, -2.2, 0.1, -2.3, blood);
    for (let i = 0; i < 8; i++) B.decoBox(-1.2 + i * 0.62, 0.06, -4.2 + i * 0.47 + rand01(i) * 0.2, -0.95 + i * 0.62, 0.075, -4.02 + i * 0.47 + rand01(i) * 0.2, blood, { ry: 0.6 });
    B.decoBox(-6.3, 0.06, 0.2, -4.4, 0.09, 1.4, stain); B.decoBox(0.8, 0.06, -1.9, 1.7, 0.09, -0.9, blood);
    for (let i = 0; i < 12; i++) B.decoBox(-6 + rand01(i + 7) * 13, 0.065, -3.5 + rand01(i + 17) * 7, -5.75 + rand01(i + 7) * 13, 0.07, -3.18 + rand01(i + 17) * 7, paper, { ry: rand01(i + 27) * 3 });
    B.deco(GEO.cyl(0.14, 0.14, 0.012, 12), -2.0, 0.065, 0.6, 0x2a2c2c); for (let i = -2; i <= 2; i++) B.decoBox(-2.12, 0.07, 0.6 + i * 0.045 - 0.008, -1.88, 0.074, 0.6 + i * 0.045 + 0.008, 0x4a4c4c);
    // cuerpo bajo una sábana en el suelo
    B.decoBox(-6.6, 0.06, 2.4, -4.9, 0.26, 3.1, sheet, { ry: 0.15 }); B.decoBox(-6.4, 0.2, 2.5, -5.9, 0.32, 3.0, sheet, { ry: 0.15 }); B.decoBox(-5.6, 0.065, 2.6, -5.0, 0.27, 3.0, stain, { ry: 0.15 });
    for (const [x, z, r] of [[-5, 1.5, 0.8], [3.5, -2.8, 0.8], [6.4, 4.8, 1.0], [-10.5, -3.2, 0.7]]) B.rubble(x, z, r);
    // plafones de techo: tubos fluorescentes, uno colgando de un cable
    for (const [x, z, broken] of [[-4.4, -2.8, 0], [-4.4, 2.8, 0], [1.4, -2.8, 0], [1.4, 2.8, 1], [6.2, 0, 0], [-10.3, -3.5, 0]]) {
      if (broken) { B.decoBox(x - 0.6, 2.45, z - 0.12, x + 0.6, 2.52, z + 0.12, 0x8a8e88, { rz: 0.45 }); B.decoBox(x + 0.45, 2.6, z - 0.005, x + 0.46, H, z + 0.005, 0x1a1a1a); continue; }
      B.decoBox(x - 0.65, H - 0.1, z - 0.14, x + 0.65, H - 0.02, z + 0.14, 0x8a8e88); B.decoBox(x - 0.6, H - 0.13, z - 0.1, x + 0.6, H - 0.1, z + 0.1, 0xd8dcd0);
    }
    // luces: parpadean sobre las camas; la de la sala de curas casi muerta
    B.light(-4.4, H - 0.15, -2.8); B.light(1.4, H - 0.15, 2.8); B.light(6.2, H - 0.15, 0); B.light(-10.3, H - 0.15, -1.5);

    // ---------------- pasillo principal (hacia el resto de la cárcel) ----------------
    B.house(8.7, -2, 28, 2, { floors: 1, floorH: 0, h: H, t: 0.3, solidWalls: true, pattern: PAT.PLASTER, color: wallD, floorPat: PAT.CONCRETE, floorColor: floorC, parapet: false, roofPat: PAT.CONCRETE, roofColor: 0x3a3d3e,
      open: { w: [['door', 0.5, 0]], s: [['door', 0.4813, 0]], n: [['door', 0.76, 0]] } });
    // portón al fondo (cerrado) y puerta tapiada al norte
    B.box(27.0, 0.06, -1.7, 27.4, 2.9, 1.7, { pattern: PAT.METAL, color: 0x5a6266, kind: 'wall' });
    for (let z = -1.6; z <= 1.7; z += 0.3) B.decoBox(26.95, 0.1, z, 27.0, 2.85, z + 0.05, 0x2a2e30);
    B.box(23.1, 0.06, -2.05, 24.1, 2.3, -1.7, { pattern: PAT.WOOD, color: 0x5a4632, kind: 'cover' });
    B.decoBox(22.9, 0.5, -2.1, 24.3, 0.7, -1.7, 0x6e5a40); B.decoBox(22.9, 1.2, -2.1, 24.3, 1.4, -1.7, 0x6e5a40);
    // carrito volcado, escombros y rastros de sangre
    B.box(12.2, 0.06, -1.3, 13.6, 0.8, -0.5, { pattern: PAT.METAL, color: steel, kind: 'cover' });
    B.rubble(16.2, 0.9, 0.9); B.rubble(20.2, -0.9, 0.7); B.rubble(26.2, 0.7, 0.7);
    B.decoBox(9.5, 0.06, -0.4, 16, 0.1, 0.5, blood); B.decoBox(17, 0.06, 0.3, 19.5, 0.1, 1.9, blood);
    B.decoBox(8.8, 2.8, -1.7, 27.6, 3.0, -1.6, 0x2c3330); B.decoBox(8.8, 2.8, 1.6, 27.6, 3.0, 1.7, 0x2c3330); // tubería
    B.light(14, H - 0.15, 0); B.light(22.5, H - 0.15, 0.2);

    // ---------------- almacén (sur del pasillo) ----------------
    B.house(14, 1.7, 22, 8.4, { floors: 1, floorH: 0, h: H, t: 0.3, solidWalls: true, pattern: PAT.PLASTER, color: wallD, floorPat: PAT.CONCRETE, floorColor: floorC, parapet: false, roofPat: PAT.CONCRETE, roofColor: 0x3a3d3e,
      open: { n: [['door', 0.5, 0]] } });
    for (const x of [15.2, 20.8]) { B.box(x - 0.35, 0.06, 4.6, x + 0.35, 2.2, 7.8, { pattern: PAT.METAL, color: 0x6a7276, kind: 'cover' }); B.decoBox(x - 0.35, 1.0, 4.6, x + 0.35, 1.04, 7.8, 0x555d60); B.decoBox(x - 0.35, 1.6, 4.6, x + 0.35, 1.64, 7.8, 0x555d60); }
    B.crate(18, 0.06, 4.3, 1.1); B.crate(19.3, 0.06, 4.6, 1.0); B.crate(18.4, 1.16, 4.4, 0.9); B.crate(17.0, 0.06, 7.7, 1.2); B.barrel(21.2, 0.06, 3.2); B.barrel(14.9, 0.06, 3.0);
    B.stand(18.2, 0.06, 6.8, 'shotgun');
    B.decoBox(16.5, 0.06, 5.4, 17.6, 0.09, 6.4, blood);
    B.light(18, H - 0.15, 5.4);

    // aparición: el equipo en la enfermería; los infectados llegan por el fondo del pasillo
    B.spawn(0, -6.2, 0.06, -4.0, -Math.PI / 2 + 0.5); B.spawn(0, -5.4, 0.06, 3.6, -Math.PI / 2); B.spawn(0, -2.6, 0.06, -0.2, -Math.PI / 2); B.spawn(0, -6.6, 0.06, 0.4, -Math.PI / 2);
    for (const x of [24.4, 23.2]) B.spawn(1, x, 0.06, 0, Math.PI / 2);
    B.spawn('ffa', -2, 0.06, 2.8);
  },
};
