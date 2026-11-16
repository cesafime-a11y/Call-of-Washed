// ---- 08e_outfits.js ----
// =====================================================================
// ROPA CIVIL DEL MODO CÁRCEL (2.12.1) — paciente, recluso y guardia, y
// las versiones de infectado (ropa rota, sangre, piel gris). No usan el
// camuflaje militar: la tela es una textura propia (tejido, mugre, sangre)
// y el cuerpo se arma aquí en vez de con chaleco/mochila/casco.
//  · OUTFITS: telas. `outfit` en custom elige la ropa; `zombie` la vuelve infectada
//  · outfitParts(): piezas del cuerpo por hueso (mismo esqueleto que el soldado)
//  · SoldierView.animateZombie(): andar arrastrando un pie, tambaleo, brazos
//    que buscan, zarpazo, agarre con mordisco y reptar por el suelo
// =====================================================================
const OUTFITS = {
  paciente: { es: 'Paciente', en: 'Patient', base: '#5a8a88', c: ['#4f7d7b', '#6c9a97', '#3e6664'], gear: 0x46706e, fabric: 'scrub', shoe: 0xb9bbb4 },
  reo: { es: 'Recluso', en: 'Inmate', base: '#d0682c', c: ['#b95a24', '#e07a38', '#9a4a1e'], gear: 0xa04c20, fabric: 'jump', shoe: 0xd8d4c8 },
  paciente_z: { es: 'Paciente infectado', en: 'Infected patient', base: '#56807a', c: ['#4a6e68', '#64908a', '#3a5a55'], gear: 0x3f5f5a, fabric: 'scrub', dirt: 1, blood: 1, torn: 1, shoe: 0x8a8a82 },
  reo_z: { es: 'Recluso infectado', en: 'Infected inmate', base: '#bc6430', c: ['#a3542a', '#cf7440', '#7a3e1c'], gear: 0x8a4220, fabric: 'jump', dirt: 1, blood: 1, torn: 1, shoe: 0xa8a49a },
  guardia_z: { es: 'Guardia infectado', en: 'Infected guard', base: '#34404e', c: ['#2a3440', '#45525f', '#20272f'], gear: 0x1e2226, fabric: 'uniform', dirt: 1, blood: 1, torn: 1, shoe: 0x1a1a1a },
};
// piel de infectado: gris verdosa, amarillenta o amoratada (se elige con custom.skin)
const ZSKINS = [0x7a846c, 0x6f7a68, 0x857c64, 0x6e6964, 0x768676];
const STORY_OUTFITS = ['paciente', 'reo'];

// tela: tejido fino, costuras, mugre, sangre seca y rasgones (mitad izquierda del atlas)
function drawFabric(x, C, rng) {
  x.fillStyle = C.base; x.fillRect(0, 0, 128, 128);
  // tejido: trama de un píxel con variación suave
  for (let y = 0; y < 128; y++) for (let i = 0; i < 128; i++) {
    const n = ((i * 7 + y * 13) % 5) / 5 + rng.next() * 0.6;
    if (n > 0.95) { x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(i, y, 1, 1); }
    else if (n < 0.2) { x.fillStyle = 'rgba(0,0,0,0.07)'; x.fillRect(i, y, 1, 1); }
  }
  x.globalAlpha = 0.22; x.fillStyle = C.c[2];
  for (let i = 0; i < 128; i += 2) x.fillRect(0, i, 128, 1);       // trama horizontal muy tenue
  x.globalAlpha = 1;
  if (C.fabric === 'jump') { x.fillStyle = 'rgba(60,20,8,0.35)'; for (const sx of [31, 95]) x.fillRect(sx, 0, 1, 128); }   // costuras del mono
  if (C.fabric === 'uniform') { x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(63, 0, 1, 128); x.fillStyle = 'rgba(255,255,255,0.05)'; x.fillRect(20, 0, 1, 128); }
  // manchas de uso (lavado, sudor)
  for (let i = 0; i < 9; i++) {
    const cx = rng.range(0, 128), cy = rng.range(0, 128), r = rng.range(8, 22);
    const g = x.createRadialGradient(cx, cy, 1, cx, cy, r); g.addColorStop(0, `rgba(40,30,20,${C.dirt ? 0.3 : 0.1})`); g.addColorStop(1, 'rgba(40,30,20,0)');
    x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
  if (C.dirt) for (let i = 0; i < 14; i++) { const cx = rng.range(0, 128), cy = rng.range(0, 128), r = rng.range(4, 14); const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(25,22,16,0.45)'); g.addColorStop(1, 'rgba(25,22,16,0)'); x.fillStyle = g; x.fillRect(cx - r, cy - r, r * 2, r * 2); }
  // sangre: salpicaduras con chorreones hacia abajo
  const blood = C.blood ? 12 : 2;
  for (let i = 0; i < blood; i++) {
    const cx = rng.range(0, 128), cy = rng.range(0, 110), r = rng.range(2, C.blood ? 9 : 4), a = C.blood ? rng.range(0.55, 0.9) : 0.35;
    x.fillStyle = `rgba(${70 + (rng.next() * 40) | 0},10,8,${a})`;
    x.beginPath(); for (let k = 0; k < 8; k++) { const an = (k / 8) * TAU, rr = r * rng.range(0.5, 1.3); k ? x.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr) : x.moveTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); } x.fill();
    if (rng.next() < 0.6) x.fillRect(cx - 0.8, cy, 1.6, rng.range(6, 22));
  }
  // rasgones: hueco oscuro con borde deshilachado
  if (C.torn) for (let i = 0; i < 6; i++) {
    const cx = rng.range(6, 122), cy = rng.range(6, 122), w = rng.range(4, 10), h = rng.range(2, 6);
    x.fillStyle = 'rgba(30,14,10,0.85)'; x.beginPath(); x.ellipse(cx, cy, w, h, rng.range(-1, 1), 0, TAU); x.fill();
    x.strokeStyle = 'rgba(230,220,200,0.25)'; x.lineWidth = 0.6; x.stroke();
  }
}

// ---------------- piezas del cuerpo ----------------
// P: lotes por hueso; c: custom; box/cyl: formas del soldado; cam/bcam/bd: banderas de tela/cuerpo
function outfitParts(P, c, f, o) {
  const { box, cyl, bcam, bd, cam } = o, OF = OUTFITS[c.camo] || OUTFITS.paciente, kind = c.outfit, Z = !!c.zombie;
  const skin = Z ? ZSKINS[(c.skin | 0) % ZSKINS.length] : SKINS[(c.skin | 0) % SKINS.length], skinD = shade(skin, -0.22), hair = HAIR[f.slot % HAIR.length];
  const rng = new RNG(hash32('outfit', f.slot * 31 + (c.skin | 0)));
  const gear = OF.gear, gearD = shade(gear, -0.3), white = 0xdedbd2, red = 0x5a0e0a, redB = 0x7a1a12, bruise = 0x5a4a5a;
  const shoe = OF.shoe, sole = shade(shoe, -0.5);
  // ---- pelvis y pecho ----
  P.pelvis.add(box(0.33, 0.2, 0.21), 0, 0.04, 0, 0, bcam).add(box(0.14, 0.08, 0.18), 0, -0.06, 0, 0, bcam);
  P.chest.add(box(0.34, 0.21, 0.21), 0, 0.1, 0, 0, bcam).add(box(0.42, 0.24, 0.235), 0, 0.31, 0, 0, bcam)
    .add(cyl(0.055, 0.062, 0.12), 0, 0.45, 0, skin, bd).add(box(0.2, 0.05, 0.2), 0, 0.43, 0, 0, bcam);
  if (kind === 'paciente') {
    // pijama de hospital: cuello en V con ribete, bolsillo con bolígrafo y cordón en la cintura
    P.chest.add(box(0.1, 0.07, 0.02), 0, 0.405, -0.112, skin, bd).add(box(0.012, 0.11, 0.012), -0.04, 0.39, -0.12, gearD, { rz: -0.45 }).add(box(0.012, 0.11, 0.012), 0.04, 0.39, -0.12, gearD, { rz: 0.45 })
      .add(box(0.1, 0.09, 0.012), 0.1, 0.29, -0.121, 0, cam).add(box(0.1, 0.012, 0.014), 0.1, 0.335, -0.122, gearD).add(box(0.01, 0.05, 0.01), 0.12, 0.345, -0.126, 0x2a4a8a);
    P.pelvis.add(box(0.335, 0.035, 0.215), 0, 0.125, 0, shade(gear, -0.12)).add(box(0.012, 0.09, 0.008), -0.02, 0.07, -0.112, white, { rz: 0.1 }).add(box(0.012, 0.08, 0.008), 0.02, 0.075, -0.112, white, { rz: -0.1 });
    // gasa con esparadrapo en el costado (herida del ingreso)
    if (!Z) P.chest.add(box(0.07, 0.08, 0.012), -0.17, 0.16, -0.06, white, { ry: 0.6 }).add(box(0.03, 0.03, 0.014), -0.17, 0.16, -0.065, 0x8a3a30, { ry: 0.6 });
  } else if (kind === 'reo') {
    // mono naranja: cuello, camiseta blanca, cremallera, bolsillo con número y rótulo en la espalda
    P.chest.add(box(0.24, 0.04, 0.235), 0, 0.445, 0, gearD).add(box(0.08, 0.05, 0.02), 0, 0.42, -0.115, white).add(box(0.012, 0.36, 0.008), 0, 0.24, -0.119, shade(gear, -0.45))
      .add(box(0.11, 0.1, 0.012), -0.1, 0.3, -0.121, 0, cam).add(box(0.1, 0.045, 0.006), -0.1, 0.33, -0.128, white);
    for (let i = 0; i < 4; i++) P.chest.add(box(0.012, 0.025, 0.006), -0.13 + i * 0.02, 0.33, -0.132, 0x1a1a1a);
    P.chest.add(box(0.3, 0.08, 0.008), 0, 0.33, 0.12, white);
    for (let i = 0; i < 6; i++) P.chest.add(box(0.028, 0.05, 0.006), -0.11 + i * 0.044, 0.33, 0.125, 0x1a1a1a);
    P.pelvis.add(box(0.335, 0.03, 0.215), 0, 0.125, 0, gearD);
  } else {
    // uniforme de guardia: camisa, placa, radio al hombro, cinturón con funda vacía
    P.chest.add(box(0.12, 0.05, 0.02), 0, 0.42, -0.112, white).add(box(0.012, 0.34, 0.008), 0, 0.25, -0.119, gearD).add(box(0.04, 0.05, 0.008), -0.1, 0.32, -0.122, 0xc9a23a)
      .add(box(0.05, 0.08, 0.04), 0.14, 0.38, -0.1, 0x1a1a1a).add(box(0.1, 0.04, 0.24), 0, 0.44, 0, shade(gear, 0.1));
    P.pelvis.add(box(0.35, 0.05, 0.225), 0, 0.12, 0, 0x14110e).add(box(0.05, 0.035, 0.01), 0, 0.12, -0.115, 0x9a9a92).add(box(0.05, 0.16, 0.08), 0.18, 0.04, -0.02, 0x14110e).add(box(0.04, 0.08, 0.05), -0.18, 0.08, -0.03, 0x14110e);
  }
  // ---- cabeza ----
  const eyeC = Z ? 0xd8d0a0 : 0x141414;
  P.head.add(GEO.rbox(0.18, 0.21, 0.2, 0.05), 0, 0.15, -0.005, skin, bd).add(box(0.15, 0.06, 0.16), 0, Z ? 0.045 : 0.055, -0.025, skin, bd).add(box(0.035, 0.05, 0.04), 0, 0.135, -0.115, skinD, bd)
    .add(box(0.03, 0.05, 0.04), -0.095, 0.15, 0, skinD, bd).add(box(0.03, 0.05, 0.04), 0.095, 0.15, 0, skinD, bd);
  if (Z) {
    // ojos vidriosos hundidos en ojeras moradas, boca abierta con dientes y sangre que chorrea
    P.head.add(box(0.062, 0.04, 0.008), -0.045, 0.172, -0.101, bruise, bd).add(box(0.062, 0.04, 0.008), 0.045, 0.172, -0.101, bruise, bd)
      .add(box(0.036, 0.02, 0.008), -0.045, 0.175, -0.105, eyeC, bd).add(box(0.036, 0.02, 0.008), 0.045, 0.175, -0.105, eyeC, bd)
      .add(box(0.008, 0.008, 0.006), -0.04, 0.175, -0.11, 0x6a5a3a, bd)
      .add(box(0.08, 0.05, 0.012), 0, 0.083, -0.103, 0x1a0806, bd).add(box(0.07, 0.012, 0.012), 0, 0.104, -0.106, 0xb8ae8a, bd).add(box(0.05, 0.01, 0.012), 0, 0.062, -0.106, 0xa89e7a, bd)
      .add(box(0.03, 0.06, 0.01), 0.02, 0.03, -0.1, redB, bd).add(box(0.02, 0.04, 0.01), -0.025, 0.035, -0.1, red, bd)
      .add(box(0.05, 0.05, 0.01), 0.07, 0.2, -0.098, shade(skin, -0.35), bd).add(box(0.04, 0.03, 0.06), -0.096, 0.17, 0.03, red, bd);
    // pelo a mechones (calvas, herida en el cuero cabelludo)
    for (let i = 0; i < 5; i++) P.head.add(box(rng.range(0.05, 0.09), 0.03, rng.range(0.05, 0.1)), rng.range(-0.06, 0.06), 0.258, rng.range(-0.07, 0.07), hair, bd);
    P.head.add(box(0.06, 0.012, 0.05), 0.04, 0.258, 0.02, red, bd);
  } else {
    P.head.add(box(0.035, 0.018, 0.01), -0.045, 0.175, -0.106, eyeC, bd).add(box(0.035, 0.018, 0.01), 0.045, 0.175, -0.106, eyeC, bd)
      .add(box(0.052, 0.024, 0.008), -0.045, 0.175, -0.103, 0xe6e2d6, bd).add(box(0.052, 0.024, 0.008), 0.045, 0.175, -0.103, 0xe6e2d6, bd)
      .add(box(0.05, 0.012, 0.012), -0.045, 0.196, -0.107, hair, bd).add(box(0.05, 0.012, 0.012), 0.045, 0.196, -0.107, hair, bd)
      .add(box(0.05, 0.01, 0.01), 0, 0.093, -0.1, skinD, bd).add(box(0.1, 0.03, 0.09), 0, 0.045, -0.065, shade(skin, -0.05), bd);
    if (kind === 'reo') P.head.add(box(0.186, 0.018, 0.206), 0, 0.256, -0.005, hair, bd).add(box(0.186, 0.05, 0.02), 0, 0.225, 0.096, hair, bd);
    else {
      // pelo revuelto y venda alrededor de la cabeza con una mancha de sangre
      P.head.add(box(0.188, 0.036, 0.208), 0, 0.262, -0.005, hair, bd).add(box(0.188, 0.07, 0.03), 0, 0.23, 0.095, hair, bd)
        .add(box(0.198, 0.035, 0.218), 0, 0.225, -0.004, white, { rz: 0.06 }).add(box(0.03, 0.025, 0.01), 0.05, 0.228, -0.115, 0x8a3a30);
    }
    if (kind === 'reo') P.head.add(box(0.15, 0.04, 0.012), 0, 0.07, -0.098, shade(hair, 0.1), bd);   // barba de días
  }
  // ---- brazos ----
  for (const s of ['L', 'R']) {
    const sg = s === 'L' ? -1 : 1, torn = Z && (s === 'L') === rng.next() < 0.5;
    const shortSleeve = kind === 'paciente' || torn;
    P['upperArm' + s].add(GEO.sphere(0.07, 6, 4), 0, -0.01, 0, 0, bcam);
    if (shortSleeve) P['upperArm' + s].add(cyl(0.064, 0.06, 0.12), 0, -0.07, 0, 0, bcam).add(cyl(0.065, 0.065, 0.02), 0, -0.13, 0, gearD).add(cyl(0.056, 0.052, 0.18), 0, -0.21, 0, skin, bd);
    else P['upperArm' + s].add(cyl(0.062, 0.054, 0.28), 0, -0.15, 0, 0, bcam);
    if (kind === 'guardia' && !torn) P['upperArm' + s].add(box(0.012, 0.06, 0.05), sg * 0.064, -0.08, 0, 0xc9a23a);
    const fa = P['foreArm' + s];
    if (kind === 'reo' && !torn) fa.add(cyl(0.054, 0.048, 0.1), 0, -0.04, 0, 0, bcam).add(cyl(0.057, 0.056, 0.035), 0, -0.1, 0, gearD).add(cyl(0.046, 0.042, 0.1), 0, -0.155, 0, skin, bd);
    else if (kind === 'guardia' && !torn) fa.add(cyl(0.054, 0.046, 0.2), 0, -0.09, 0, 0, bcam).add(cyl(0.046, 0.044, 0.02), 0, -0.19, 0, gearD);
    else fa.add(cyl(0.05, 0.043, 0.2), 0, -0.09, 0, skin, bd);
    fa.add(cyl(0.042, 0.04, 0.05), 0, -0.2, 0, skin, bd);
    // mano desnuda: palma, nudillos y dedos (los del infectado, más largos y con uñas negras)
    fa.add(box(0.07, 0.09, 0.08), 0, -0.262, -0.01, skin, bd).add(box(0.072, 0.02, 0.06), 0, -0.235, -0.05, skinD, bd);
    for (let i = 0; i < 4; i++) { const fl = Z ? 0.065 : 0.05; fa.add(box(0.016, fl, 0.02), -0.027 + i * 0.018, -0.3 - fl / 2, -0.04, skin, bd); if (Z) fa.add(box(0.016, 0.012, 0.022), -0.027 + i * 0.018, -0.338, -0.05, 0x2a2420, bd); }
    fa.add(box(0.02, 0.045, 0.02), sg * -0.045, -0.255, -0.05, skin, { ...bd, rz: sg * 0.4 });
    // pulsera del hospital (paciente) · esposa con la cadena rota (recluso infectado)
    if (kind === 'paciente' && s === 'L') fa.add(cyl(0.046, 0.046, 0.018), 0, -0.205, 0, white).add(box(0.02, 0.016, 0.012), 0, -0.205, -0.046, 0xd8c84a);
    if (kind === 'paciente' && s === 'L' && !Z) fa.add(box(0.03, 0.05, 0.01), 0, -0.12, -0.046, white);    // vía con esparadrapo
    if (Z && kind === 'reo' && s === 'R') { fa.add(cyl(0.05, 0.05, 0.026, 8), 0, -0.2, 0, 0x8a9094).add(box(0.012, 0.012, 0.03), 0, -0.2, -0.06, 0x6a7074).add(box(0.012, 0.012, 0.03), 0, -0.215, -0.085, 0x6a7074, { rx: 0.6 }); }
    // infectado: mordiscos y moratones en la piel expuesta
    if (Z) { fa.add(box(0.03, 0.05, 0.01), sg * 0.02, -0.1, -0.046, red, bd).add(box(0.02, 0.03, 0.012), sg * -0.02, -0.06, 0.045, bruise, bd); if (torn) P['upperArm' + s].add(box(0.04, 0.06, 0.012), 0, -0.22, -0.054, redB, bd); }
    // ---- piernas ----
    P['thigh' + s].add(cyl(0.09, 0.072, 0.45), 0, -0.215, 0, 0, bcam).add(box(0.14, 0.02, 0.14), 0, -0.4, 0, shade(gear, -0.12), bd);
    if (kind === 'reo') P['thigh' + s].add(box(0.012, 0.36, 0.012), sg * 0.088, -0.2, 0, gearD);
    if (kind === 'guardia') P['thigh' + s].add(box(0.01, 0.4, 0.014), sg * 0.088, -0.2, 0, 0x14181e);
    const barefoot = Z && rng.next() < 0.35, sh = P['shin' + s];
    sh.add(cyl(0.068, 0.062, 0.33), 0, -0.18, 0, 0, bcam).add(cyl(0.07, 0.07, 0.03), 0, -0.34, 0, shade(gear, -0.15));
    if (barefoot) {
      sh.add(cyl(0.05, 0.045, 0.07), 0, -0.385, 0, skin, bd).add(box(0.09, 0.05, 0.2), 0, -0.45, -0.04, skinD, bd).add(box(0.08, 0.02, 0.04), 0, -0.462, -0.14, 0x2a2420, bd);
    } else if (kind === 'guardia') {
      sh.add(box(0.1, 0.12, 0.12), 0, -0.38, 0, shoe).add(box(0.105, 0.07, 0.24), 0, -0.445, -0.05, shoe).add(box(0.112, 0.02, 0.25), 0, -0.475, -0.05, 0x0a0a0a);
    } else {
      // calcetín y zapatilla blanda (paciente) o de lona (recluso)
      sh.add(cyl(0.05, 0.048, 0.07), 0, -0.385, 0, kind === 'paciente' ? 0xc8ccc6 : white).add(box(0.1, 0.06, 0.23), 0, -0.45, -0.045, shoe).add(box(0.104, 0.018, 0.24), 0, -0.476, -0.045, sole)
        .add(box(0.08, 0.012, 0.08), 0, -0.418, -0.1, shade(shoe, -0.15));
    }
  }
  // ---- infectado: heridas abiertas, costillas a la vista y sangre ----
  if (Z) {
    const side = rng.next() < 0.5 ? -1 : 1;
    // desgarro en la ropa con las costillas a la vista
    P.chest.add(box(0.12, 0.12, 0.012), side * 0.09, 0.2, -0.111, 0x220505, { ...bd, rz: 0.3 }).add(box(0.06, 0.05, 0.012), side * 0.13, 0.13, -0.11, 0x220505, { ...bd, rz: -0.4 });
    for (let i = 0; i < 3; i++) P.chest.add(box(0.085, 0.01, 0.012), side * 0.09, 0.165 + i * 0.03, -0.117, 0x8a7a62, { ...bd, rz: 0.12 * side });
    // sangre: manchas irregulares hechas de trozos pequeños, más oscuras arriba (seca) y con chorreones
    for (let i = 0; i < 4; i++) {
      const cx = rng.range(-0.15, 0.15), cy = rng.range(0.08, 0.42), zf = rng.next() < 0.65 ? -0.119 : 0.119;
      for (let k = 0; k < 4; k++) P.chest.add(box(rng.range(0.015, 0.04), rng.range(0.015, 0.04), 0.008), cx + rng.range(-0.025, 0.025), cy + rng.range(-0.02, 0.02), zf, k & 1 ? 0x3a0806 : 0x4a0a08, { ...bd, rz: rng.range(-1, 1) });
      P.chest.add(box(0.008, rng.range(0.04, 0.1), 0.008), cx, cy - 0.05, zf, 0x3a0806, bd);
    }
    P.chest.add(box(0.05, 0.06, 0.01), 0.07, 0.45, -0.05, redB, { ...bd, ry: 0.8 });
    P.pelvis.add(box(0.05, 0.07, 0.008), rng.range(-0.1, 0.1), 0.0, -0.111, 0x3a0806, { ...bd, rz: 0.5 });
    // vendas sueltas colgando de un brazo
    if (kind === 'paciente') P.foreArmL.add(box(0.11, 0.03, 0.11), 0, -0.05, 0, 0xc8c0a8).add(box(0.02, 0.12, 0.008), 0.03, -0.12, -0.055, 0xc8c0a8, { rz: 0.2 });
  }
  // equipamiento encontrado en la cárcel (inventario): chaleco de guardia y bolsa o mochila
  if (c.gearVest) {
    const nv = 0x2a3440, nvD = shade(nv, -0.3);
    P.chest.add(box(0.38, 0.32, 0.05), 0, 0.25, -0.14, nv).add(box(0.38, 0.34, 0.05), 0, 0.25, 0.14, nv).add(box(0.44, 0.12, 0.25), 0, 0.13, 0, nv)
      .add(box(0.08, 0.03, 0.3), -0.12, 0.425, 0, nvD).add(box(0.08, 0.03, 0.3), 0.12, 0.425, 0, nvD)
      .add(box(0.3, 0.06, 0.008), 0, 0.33, 0.168, 0xd8d4c4).add(box(0.1, 0.035, 0.008), 0.09, 0.33, -0.168, 0xd8d4c4).add(box(0.05, 0.08, 0.04), -0.1, 0.18, -0.18, nvD);
  }
  if (c.gearBag === 'satchel') {
    P.chest.add(box(0.05, 0.62, 0.012), 0, 0.24, -0.125, 0x5a4a32, { rz: 0.72 }).add(box(0.05, 0.62, 0.012), 0, 0.24, 0.125, 0x5a4a32, { rz: -0.72 });
    P.pelvis.add(box(0.07, 0.22, 0.28), 0.22, 0.02, 0.02, 0x8a7a5a).add(box(0.075, 0.08, 0.285), 0.22, 0.1, 0.02, 0x7a6a4a);
  } else if (c.gearBag === 'backpack') {
    P.chest.add(box(0.32, 0.4, 0.17), 0, 0.27, 0.23, 0x4a5236).add(box(0.24, 0.14, 0.07), 0, 0.17, 0.33, 0x3a4028)
      .add(box(0.05, 0.36, 0.02), -0.12, 0.27, -0.125, 0x2a2c22).add(box(0.05, 0.36, 0.02), 0.12, 0.27, -0.125, 0x2a2c22);
  }
  return { skin, glove: skin, boot: shoe };
}

// ---------------- animación del infectado ----------------
// estado en el soldado: f.zAtk {kind, t, dur, hit, side} · f.zGrab (agarrando al jugador) · f.crawler (repta)
// f.zStag (tambaleo por impacto) · f.zGait 0/1/2 (pierna que arrastra / cojera / encorvado)
SoldierView.prototype.animateZombie = function (dt) {
  const f = this.f, J = this.joints, t = G.time + f.slot * 3.7;
  const hs = Math.hypot(f.vel.x, f.vel.z), cyw = Math.cos(f.yaw), syw = Math.sin(f.yaw);
  const lvx = f.vel.x * cyw - f.vel.z * syw, lvz = f.vel.x * syw + f.vel.z * cyw;
  const gait = f.zGait | 0, drag = gait === 1 ? 1 : 0;        // 0 = derecha arrastra, 1 = izquierda
  this.weaponHolder.visible = false; this.handGrenade.visible = false;
  const A = f.zAtk, at = A ? clamp(A.t / A.dur, 0, 1) : 0;
  const chase = f.brain && f.brain.st === 'chase';
  this.zReach = damp(this.zReach || 0, chase ? 1 : 0, 3, dt);
  this.zStagK = damp(this.zStagK || 0, f.zStag > 0 ? 1 : 0, 10, dt);
  this.zCrawl = damp(this.zCrawl || 0, f.crawler ? 1 : 0, 2.6, dt);
  const ck = smooth01(this.zCrawl), stg = this.zStagK;
  // ---- paso: zancada corta y desigual ----
  const moving = f.grounded && hs > 0.12;
  const stepLen = ck > 0.5 ? 0.42 : 0.5;
  if (moving) this.phase += dt * Math.PI * hs / stepLen;
  const amt = moving ? clamp(hs / 0.9, 0, 1) : 0;
  // tambaleo: balanceo lateral con el paso, un tirón ocasional y el retroceso al recibir un disparo
  const sway = Math.sin(this.phase) * 0.13 * amt + Math.sin(t * 0.9) * 0.05 + Math.sin(t * 2.3) * 0.02;
  const jerk = Math.max(0, Math.sin(t * 0.7) * Math.sin(t * 2.9) - 0.75) * 2.2;
  let fx = 0, fz = 0;
  if (f.flinchT > 0) { const k = f.flinchT / 0.22 * 0.35, d = f.flinchDir; const hx = d.x * cyw - d.z * syw, hz = d.x * syw + d.z * cyw; fx = hz * k; fz = -hx * k; }
  // ---- tronco ----
  let leanF = 0.32 + (gait === 2 ? 0.25 : 0) - stg * 0.45, twist = Math.sin(this.phase * 0.5) * 0.08 * amt;
  let chestX = -0.25 + fx, chestZ = sway * 0.9 + fz, headX = 0.35 + jerk * 0.4, headZ = Math.sin(t * 0.5) * 0.28 + jerk * 0.3 * Math.sign(Math.sin(t * 0.37));
  if (chase) { headX = 0.2 + jerk * 0.3; headZ *= 0.5; }
  if (A && A.kind === 'swipe') {
    const wind = at < 0.4 ? smooth01(at / 0.4) : 0, swing = at >= 0.4 && at < 0.62 ? smooth01((at - 0.4) / 0.22) : at >= 0.62 ? 1 - smooth01((at - 0.62) / 0.38) : 0;
    twist += (A.side || 1) * (wind * 0.5 - swing * 0.75); leanF += swing * 0.25 - wind * 0.1;
  } else if (A && (A.kind === 'grab' || A.kind === 'ankle')) { const k = at < 0.6 ? smooth01(at / 0.6) : 1; leanF += 0.35 * k; }
  if (f.zGrab) { const bite = Math.max(0, Math.sin(t * 6.5)) * (f.zBiteK || 0); leanF += 0.15 + bite * 0.3; headX = 0.6 + bite * 0.5; twist = Math.sin(t * 9) * 0.05; }
  if (stg > 0.01) { chestX -= 0.35 * stg; headX -= 0.5 * stg; twist += Math.sin(t * 13) * 0.2 * stg; }
  const q0 = _q0.setFromEuler(_ea.set(-leanF * 0.4, twist * 0.5, sway * 0.6));
  const qC = _qa.setFromEuler(_ea.set(-leanF * 0.6 + chestX * 0.3, -twist, chestZ * 0.5));
  const qH = _qb.setFromEuler(_ea.set(clamp(headX, -0.6, 1.2), Math.sin(t * 0.33) * 0.25, headZ));
  const p0 = _P0.set(sway * 0.06, 0.88 - 0.035 * Math.abs(Math.sin(this.phase)) * amt, 0.04 + leanF * 0.05 - stg * 0.08);
  // dejar caer el peso en la pierna mala
  const badPh = Math.sin(this.phase + (drag ? Math.PI : 0));
  if (moving && gait !== 2) p0.y -= 0.06 * Math.max(0, badPh) * amt;
  if (ck > 0.001) {
    // repta: el cuerpo tendido, la cabeza levantada hacia delante y el pecho que se arrastra
    q0.slerp(_q3.setFromEuler(_ea.set(-1.45, Math.sin(this.phase) * 0.12, Math.sin(this.phase) * 0.1)), ck);
    qC.slerp(_q3.setFromEuler(_ea.set(0.18 + Math.sin(this.phase) * 0.05, -Math.sin(this.phase) * 0.15, 0)), ck);
    qH.slerp(_q3.setFromEuler(_ea.set(1.15 + jerk * 0.2, Math.sin(t * 0.4) * 0.3, headZ * 0.5)), ck);
    p0.lerp(_Dv.set(0, 0.22, 0.5), ck);
  }
  const q1 = _qc.copy(q0).multiply(qC), p1 = _P1.copy(SKEL.chest.off).applyQuaternion(q0).add(p0);
  J.pelvis.position.copy(p0); J.pelvis.quaternion.copy(q0);
  J.chest.quaternion.copy(qC); J.head.quaternion.copy(qH);
  this.eyeY = damp(this.eyeY, eyeHeight(f), 8, dt);
  // ---- brazos ----
  const reach = this.zReach * (1 - ck), vr = f.slot % 3;       // variante: 0 los dos brazos al frente, 1 solo uno, 2 colgando
  const hand = (sd, out) => {
    const sw = Math.sin(this.phase + (sd > 0 ? 0 : Math.PI)) * 0.12 * amt;
    // colgando, con un vaivén flojo
    out.set(sd * 0.24, 0.62 + Math.sin(t * 1.3 + sd) * 0.02, -0.05 - sw);
    const lift = vr === 2 ? 0.6 : vr === 1 && sd < 0 ? 0.5 : 1;
    const k = reach * lift;
    if (k > 0.001) out.lerp(_rv.set(sd * (0.2 - 0.04 * Math.sin(t * 2 + sd)), 1.32 + Math.sin(t * 1.7 + sd * 2) * 0.06 - (sd > 0 ? 0 : 0.06), -0.62 + Math.sin(t * 2.4 + sd) * 0.05), k);
    if (A && A.kind === 'swipe' && sd === (A.side || 1)) {
      // zarpazo: atrás y arriba, luego cruza en diagonal hacia delante
      const wind = at < 0.4 ? smooth01(at / 0.4) : 0, sw2 = at >= 0.4 ? (at < 0.62 ? smooth01((at - 0.4) / 0.22) : 1 - smooth01((at - 0.62) / 0.38) * 0.6) : 0;
      out.lerp(_rv.set(sd * 0.42, 1.6, 0.05), wind * (1 - sw2));
      out.lerp(_rv.set(-sd * 0.18, 1.05, -0.62), sw2);
    }
    if ((A && (A.kind === 'grab')) || f.zGrab) {
      const k2 = f.zGrab ? 1 : at < 0.5 ? smooth01(at / 0.5) : 1;
      out.lerp(_rv.set(sd * 0.17, 1.28 + Math.sin(t * 7 + sd) * 0.03, -0.55), k2);
    }
    if (stg > 0.01) out.lerp(_rv.set(sd * (0.45 + Math.sin(t * 11 + sd) * 0.1), 1.15 + Math.sin(t * 9 + sd * 2) * 0.25, 0.1), stg * 0.8);
    if (ck > 0.001) {
      // brazos que tiran del cuerpo: uno adelante clavado en el suelo mientras el otro vuelve
      const ph = this.phase + (sd > 0 ? 0 : Math.PI), fw = Math.sin(ph), up = Math.max(0, Math.cos(ph));
      out.lerp(_rv.set(sd * 0.32, 0.06 + up * 0.12 * amt, -0.55 - fw * 0.28 * Math.max(0.3, amt)), ck);
      if (A && A.kind === 'ankle') out.lerp(_rv.set(sd * 0.12, 0.12, -1.0), smooth01(Math.min(1, at * 2)));
    }
    return out;
  };
  const rT = hand(1, _A), shR = _P2.set(0.265, 0.38, 0).applyQuaternion(q1).add(p1);
  solveIK2(shR, rT, ARM_UP, ARM_LO, _Dv.set(0.7, -0.6, 0.4), 1, _qa, _qb);
  J.upperArmR.quaternion.copy(_q1.copy(q1).invert().multiply(_qa)); J.foreArmR.quaternion.copy(_q2.copy(_qa).invert().multiply(_qb));
  const lT = hand(-1, _Cv), shL = _P2.set(-0.265, 0.38, 0).applyQuaternion(q1).add(p1);
  solveIK2(shL, lT, ARM_UP, ARM_LO, _Dv.set(-0.7, -0.6, 0.4), 1, _qa, _qb);
  J.upperArmL.quaternion.copy(_q1.copy(q1).invert().multiply(_qa)); J.foreArmL.quaternion.copy(_q2.copy(_qa).invert().multiply(_qb));
  // ---- piernas: una normal y otra que se arrastra (la punta del pie roza el suelo) ----
  const hl = hs > 0.05 ? 1 / hs : 0, mx = lvx * hl, mz = lvz * hl, Al = (stepLen / Math.PI) * amt;
  for (let si = 0; si < 2; si++) {
    const s = si === 0 ? -1 : 1, nm = si === 0 ? 'L' : 'R', bad = gait !== 2 && si === (drag ? 0 : 1);
    const hip = _P2.set(s * 0.105, -0.01, 0).applyQuaternion(q0).add(p0);
    const ph = this.phase + (si ? Math.PI : 0), cph = Math.cos(ph), ft = _A;
    if (ck > 0.5) {
      // piernas inertes detrás, apenas se mueven con el arrastre
      ft.set(s * 0.18, 0.06, p0.z + 0.95 + Math.sin(ph) * 0.03);
    } else {
      const off = Al * Math.sin(ph) * (bad ? 0.55 : 1);
      ft.set(s * (0.13 + (bad ? 0.03 : 0)) + mx * off, 0.015 + (bad ? 0.012 : 0.09 * Math.max(0, cph)) * amt, 0.03 + mz * off + (bad ? 0.14 : 0));
      const up = cph > 0 && moving;
      if (this.footUp[si] && !up && moving && f.grounded) BUS.emit('step', f, hs * (bad ? 0.5 : 1));
      this.footUp[si] = up;
      if (stg > 0.01) ft.z += (si ? 0.12 : -0.1) * stg;
    }
    solveIK2(hip, ft, LEG_UP, LEG_LO, _Dv.set(s * 0.25, -1.3 * ck, -1 + ck), -1, _qa, _qb);
    J['thigh' + nm].quaternion.copy(_q1.copy(q0).invert().multiply(_qa));
    J['shin' + nm].quaternion.copy(_q2.copy(_qa).invert().multiply(_qb));
    // pie que arrastra: apunta hacia fuera
    if (bad && ck < 0.5) J['shin' + nm].quaternion.multiply(_q3.setFromEuler(_ea.set(0, s * 0.35, 0)));
  }
};
