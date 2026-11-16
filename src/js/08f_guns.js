// ---- 08f_guns.js ----
// =====================================================================
// ARMAS DE ÉPOCA (3.1.0) — modelos procedurales de 1939–1945 para la
// Conflagración: fusiles de cerrojo con culata de nogal, subfusiles de
// chapa y madera, escopetas de caza y de trinchera, ametralladoras con
// bípode, pistolas de cachas de madera y el tubo antitanque de un solo uso.
// Mismo sistema que antes (PartBatch, cañón hacia -Z, mano derecha en el
// origen); weaponGeometry() llama a periodGun() con sus ayudantes.
// =====================================================================
// culata de madera de época: garganta inclinada, lomo casi recto, vientre que cae hacia la cantonera de acero
function woodButt(H, wood, o = {}) {
  const { rb, bx, GUN } = H, y = o.y ?? 0, z = o.z ?? 0, sk = o.short ? 0.8 : 1;
  rb(0.035, 0.05, 0.14, 0, y + 0.024, z + 0.13, wood, 0.013, { rx: 0.34 });
  rb(0.042, 0.054, 0.27 * sk, 0, y + 0.028, z + 0.18 + 0.135 * sk, wood, 0.014);
  rb(0.041, 0.066, 0.28 * sk, 0, y - 0.028, z + 0.18 + 0.135 * sk, wood, 0.014, { rx: 0.2 });
  const zp = z + 0.18 + 0.27 * sk + 0.006;
  bx(0.044, 0.142, 0.012, 0, y - 0.018, zp, o.plate ?? GUN.metal, { rx: 0.08 });
  return zp;
}
// fusil de cerrojo genérico (Ferrán, vardenés, Kehlmann): culata entera de madera, cañón con abrazaderas, cerrojo con manilla
function boltRifle(H, p) {
  const { B, X, GUN, rb, tb, cn, bx, trig, swivel, iron, muzzleAtt, barrelAtt, gripAtt, stockAtt, opticAtt, att, u, vm } = H;
  const by = 0.075, wood = p.wood || GUN.wood, wd = shade(wood, -0.25), mz0 = p.muzzle, short = att.barrel === 'short';
  const muzz = short ? mz0 + 0.1 : mz0;
  // cajón de mecanismos (redondo, como los de cerrojo) y anillo delantero
  tb(0.0175, 0.22, 0, by, -0.025, GUN.metal, 14); tb(0.0195, 0.045, 0, by, -0.135, GUN.metal, 14);
  // puente trasero y cola del cerrojo con la aleta del seguro
  rb(0.03, 0.02, 0.04, 0, by + 0.006, 0.07, GUN.metal, 0.006); tb(0.0125, 0.045, 0, by + 0.004, 0.105, GUN.metal, 10); bx(0.006, 0.022, 0.012, 0.004, by + 0.022, 0.118, GUN.steel);
  // cerrojo: cuerpo brillante y manilla (recta o acodada hacia abajo en los de mira)
  const mvBolt = vm && !p.semi; if (mvBolt) B.tag = 'bolt';   // 3.2.2: en primera persona el cerrojo es pieza móvil (se acciona tras cada disparo y al recargar)
  tb(0.0105, 0.11, 0, by + 0.012, 0.0, GUN.steel, 10);
  if (p.semi) { bx(0.006, 0.016, 0.03, -0.022, by + 0.004, 0.01, GUN.steel); B.add(GEO.sphere(0.009, 8, 6), -0.03, by + 0.004, 0.01, GUN.dark); }
  else if (p.bent) { B.add(GEO.cyl(0.005, 0.005, 0.055, 6), 0.03, by - 0.006, 0.045, GUN.steel, { rz: X + 0.75 }); B.add(GEO.sphere(vm ? 0.009 : 0.012, 10, 8), 0.05, by - 0.026, 0.05, GUN.steel); }
  else if (vm) { B.add(GEO.cyl(0.004, 0.004, 0.045, 6), 0.026, by - 0.004, 0.05, GUN.steel, { rz: X + 0.5 }); B.add(GEO.sphere(0.008, 10, 8), 0.047, by - 0.016, 0.05, GUN.steel); }   // 3.1.3: en primera persona la manilla baja y más pequeña, fuera de la vista
  else { B.add(GEO.cyl(0.005, 0.005, 0.06, 6), 0.035, by + 0.004, 0.045, GUN.steel, { rz: X }); B.add(GEO.sphere(0.0115, 10, 8), 0.066, by + 0.004, 0.045, GUN.steel); }
  if (mvBolt) { B.tag = null; const kn = p.bent ? [0.05, -0.026, 0.05] : [0.047, -0.016, 0.05];
    Object.assign(u, { rl: 'clip', boltKind: 'bolt', by: by + 0.012, pivots: { bolt: new THREE.Vector3(0, by + 0.012, 0) }, knob: new THREE.Vector3(kn[0], kn[1] - 0.012, kn[2]) }); }
  // cañón (más corto con el recortado) y punto de mira con túnel
  const blen = -0.155 - muzz;
  tb(0.0098, blen, 0, by, -0.155 - blen / 2, GUN.dark, 10);
  tb(0.0135, 0.03, 0, by, muzz + 0.02, GUN.metal, 10);
  // culata: pieza bajo el cajón, garganta inclinada, culata con caída y cantonera de acero
  const fsEnd = p.fullStock ? muzz + 0.09 : -0.42;
  rb(0.048, 0.062, 0.24, 0, by - 0.036, -0.03, wood, 0.012);
  const zb = woodButt(H, wood, { short: att.stock === 'skel' });
  if (p.cheek) rb(0.046, 0.026, 0.12, 0, 0.062, 0.3, wd, 0.01);
  if (p.slot) { bx(0.05, 0.016, 0.026, 0, -0.03, 0.33, wd); tb(0.012, 0.05, 0, 0.0, 0.28, GUN.metal); B.add(GEO.cyl(0.013, 0.013, 0.05, 12), 0, -0.004, 0.24, GUN.metal, { rz: X }); }
  // guardamanos inferior y tapa superior de madera
  const fl = -0.15 - fsEnd;
  rb(0.044, 0.048, fl, 0, by - 0.032, -0.15 - fl / 2, wood, 0.011);
  const hgFrom = p.hgFrom || -0.18, hgTo = p.fullStock ? Math.max(fsEnd + 0.04, hgFrom - 0.5) : (p.hgTo || -0.36);
  rb(0.032, 0.022, hgFrom - hgTo, 0, by + 0.012, (hgFrom + hgTo) / 2, wood, 0.008);
  // abrazaderas de acero y casquillo delantero
  for (const z of (p.bands || [])) if (z > fsEnd + 0.03) bx(0.05, 0.088, 0.014, 0, by - 0.016, z, GUN.metal);
  bx(0.046, 0.06, 0.032, 0, by - 0.022, fsEnd + 0.012, GUN.metal);
  if (p.rod !== false) tb(0.0035, 0.07, 0, by - 0.034, fsEnd - 0.03, GUN.steel, 6);
  // guardamonte, chapa del depósito y gatillo
  bx(0.03, 0.01, 0.1, 0, by - 0.068, -0.04, GUN.metal);
  trig(0.0, 0.006, 0.075);
  // anillas de la correa
  swivel(0, by - 0.068, (p.bands && p.bands[1]) || -0.3, X); swivel(0, -0.075, 0.33, X);
  // semiautomático: cilindro de gases sobre el cañón y cargador extraíble
  if (p.semi) {
    tb(0.009, 0.24, 0, by + 0.024, -0.33, GUN.metal, 8); bx(0.024, 0.026, 0.02, 0, by + 0.012, -0.45, GUN.metal);
    B.tag = 'mag'; const h = att.mag === 'ext' ? 0.12 : 0.085; H.mseg(by - 0.06, -0.06, 0.03, h, 0.07, 0.04, GUN.dark); H.mplate(by - 0.06, -0.06, 0.03, h, 0.07, 0.04); B.tag = null;
  }
  // alza de hoja (por clics) sobre el guardamanos
  rb(0.026, 0.012, 0.06, 0, by + 0.018, -0.17, GUN.metal, 0.003);
  let sy = opticAtt(by + 0.02, -0.02);
  if (sy == null) sy = iron(-0.165, by + 0.024, muzz + 0.02, by + 0.0135, by + 0.043, p.sight);
  else bx(0.004, 0.016, 0.006, 0, by + 0.018, muzz + 0.02, GUN.dark);
  if (!p.semi && att.mag === 'fast') { for (let i = 0; i < 5; i++) tb(0.0045, 0.03, -0.0, by + 0.035, -0.07 + i * 0.0095, 0xc9a23a, 6); }
  const mz = muzzleAtt(by, barrelAtt(by, muzz, 0.0098));
  stockAtt(zb + 0.012, -0.018);
  let fore = new THREE.Vector3(0, by - 0.04, p.fore || -0.3);
  gripAtt(-0.42, by - 0.04);
  if (att.grip === 'sling') H.sling(by - 0.07, (p.bands && p.bands[1]) || -0.3, -0.08, 0.33);
  Object.assign(u, { sightY: sy, fore, mag: new THREE.Vector3(0, by + 0.03, -0.02), muzzle: new THREE.Vector3(0, by, mz), adsDist: 0.24, grip: { y: 0.032, z: 0.125, tilt: -0.6, w: 0.036 }, bolt: new THREE.Vector3(0.06, by, 0.045) });
  return sy;
}
// mira telescópica fija de los fusiles de tiro largo: tubo fino, campana del objetivo y monturas de garra
function longScope(H, by, z0, len, objR) {
  const { B, X, GUN, tb, cn, bx } = H, yc = by + 0.072;
  tb(0.0145, len, 0, yc, z0, GUN.dark, 14);
  cn(0.0145, objR, 0.055, 0, yc, z0 - len / 2 - 0.027, GUN.dark, 14); tb(objR, 0.03, 0, yc, z0 - len / 2 - 0.068, GUN.dark, 14);
  cn(0.019, 0.0145, 0.04, 0, yc, z0 + len / 2 + 0.02, GUN.dark, 14); tb(0.019, 0.04, 0, yc, z0 + len / 2 + 0.06, GUN.dark, 14);
  tb(0.019, 0.022, 0, yc, z0 - 0.01, GUN.metal, 12); B.add(GEO.cyl(0.008, 0.008, 0.02, 8), 0, yc + 0.022, z0 - 0.01, GUN.metal); B.add(GEO.cyl(0.008, 0.008, 0.02, 8), 0.022, yc, z0 - 0.01, GUN.metal, { rz: X });
  for (const dz of [-len * 0.3, len * 0.3]) { bx(0.02, yc - by - 0.01, 0.022, 0, (yc + by) / 2 + 0.006, z0 + dz, GUN.metal); tb(0.0175, 0.02, 0, yc, z0 + dz, GUN.metal, 12); }
  if (!H.vm) B.add(GEO.cyl(objR * 0.85, objR * 0.85, 0.003, 14), 0, yc, z0 - len / 2 - 0.084, 0x4a6a78, { rx: X });
  return yc;
}
let _halfMoon = null;
function periodGun(id, H) {
  const { B, b, X, GUN, rb, tb, cn, bx, sl, trig, swivel, iron, muzzleAtt, barrelAtt, gripAtt, stockAtt, opticAtt, mseg, mcont, mplate, pgrip, shell, att, u, vm } = H;
  switch (id) {
    // ---- Ferrán M-1912: el fusil reglamentario de Sanmarcial (7 mm, culata entera hasta la boca)
    case 'rifle': boltRifle(H, { sight: { rear: 'v', hood: 'arch' }, muzzle: -0.8, fullStock: true, bands: [-0.34, -0.56], fore: -0.36, wood: 0x5e3b22 }); bx(0.012, 0.02, 0.03, 0, 0.05, -0.705, GUN.metal); break;
    // ---- fusil vardenés M-98 (7,92): más corto, manilla acodada, ranura de correa en la culata
    case 'dmr': boltRifle(H, { sight: { rear: 'v', front: 'barley', hood: 'wings' }, muzzle: -0.74, fullStock: true, bands: [-0.32, -0.5], bent: true, slot: true, fore: -0.34, wood: 0x56301c }); break;
    // ---- Ferrán M-32 con mira: el mismo Ferrán con mira corta fija y manilla acodada
    case 'mk2': { boltRifle(H, { muzzle: -0.8, fullStock: true, bands: [-0.34, -0.56], bent: true, fore: -0.36, wood: 0x5e3b22 }); const sy = H.att.optic === 'x8' ? longScope(H, 0.075, -0.05, 0.3, 0.026) : longScope(H, 0.075, -0.03, 0.2, 0.021); u.sightY = sy; u.adsDist = 0.16; break; }
    // ---- Kehlmann de cerrojo con mira telescópica (7,92): la carabina del taller
    case 'sniper': { boltRifle(H, { muzzle: -0.78, fullStock: true, bands: [-0.31, -0.5], bent: true, slot: true, cheek: true, fore: -0.34, wood: 0x4a2c18 }); const sy = H.att.optic === 'x8' ? longScope(H, 0.075, -0.06, 0.34, 0.03) : longScope(H, 0.075, -0.04, 0.26, 0.026); u.sightY = sy; u.adsDist = 0.16; break; }
    // ---- Brenner M-43: semiautomático vardenés de finales de guerra (cargador de 10)
    case 'battle': boltRifle(H, { sight: { rear: 'ring', hood: 'wings' }, muzzle: -0.72, fullStock: false, bands: [-0.3], semi: true, hgTo: -0.36, fore: -0.3, wood: 0x5a3c26, rod: false }); break;
    // ---- subfusil atlántico M-28 (9 mm): cajón fresado, cañón con aletas, culata y empuñaduras de nogal
    case 'smg': {
      const by = 0.075, wood = 0x5e3b22;
      rb(0.05, 0.066, 0.28, 0, 0.068, -0.06, GUN.metal, 0.008); rb(0.044, 0.024, 0.22, 0, 0.04, -0.02, GUN.dark, 0.006);
      B.add(GEO.sphere(0.011, 10, 8), 0, 0.106, -0.08, GUN.steel); bx(0.008, 0.008, 0.07, 0, 0.1, -0.08, GUN.dark);
      rb(0.022, 0.03, 0.03, 0, 0.11, 0.05, GUN.metal, 0.005); bx(0.02, 0.026, 0.004, 0, 0.13, 0.05, GUN.dark);
      const len = att.barrel === 'short' ? 0.2 : att.barrel === 'long' ? 0.34 : 0.27, mz0 = -0.2 - len;
      tb(0.0115, len, 0, by, -0.2 - len / 2, GUN.dark, 10);
      for (let i = 0; i < 9; i++) tb(0.0175, 0.006, 0, by, -0.215 - i * 0.017, GUN.dark, 12);
      bx(0.004, 0.018, 0.012, 0, by + 0.018, mz0 + 0.015, GUN.dark);
      // guardamanos horizontal de nogal (o empuñadura delantera vertical)
      let fore;
      if (att.grip === 'vgrip') { rb(0.03, 0.09, 0.044, 0, 0.0, -0.28, wood, 0.012, { rx: -0.15 }); for (let i = 0; i < 4; i++) bx(0.032, 0.006, 0.046, 0, 0.03 - i * 0.02, -0.28 + i * 0.003, shade(wood, -0.3)); fore = new THREE.Vector3(0, -0.01, -0.28); }
      else { rb(0.04, 0.042, 0.14, 0, 0.032, -0.27, wood, 0.012); fore = new THREE.Vector3(0, 0.03, -0.27); }
      bx(0.014, 0.024, 0.12, 0, by - 0.022, -0.26, GUN.dark);
      trig(0.0, 0.005, 0.07); rb(0.034, 0.012, 0.09, 0, 0.002, -0.03, GUN.metal, 0.004);
      pgrip(0.035, -0.03, wood, 0.034, -0.3);
      // culata de nogal (se quita con «culata recortada»)
      if (att.stock !== 'skel') { rb(0.03, 0.05, 0.1, 0, 0.055, 0.115, GUN.metal, 0.008); woodButt(H, wood, { y: 0.01, z: 0.02, short: true }); }
      else bx(0.03, 0.04, 0.02, 0, 0.06, 0.085, GUN.metal);
      B.tag = 'mag';
      if (att.mag === 'drum') { /* el tambor lo pone magExtra */ bx(0.03, 0.02, 0.05, 0, 0.0, -0.11, GUN.dark); }
      else if (att.mag === 'ext') { mseg(0.0, -0.11, 0.026, 0.2, 0.042, 0.0, GUN.dark); mplate(0.0, -0.11, 0.026, 0.2, 0.042, 0.0); }
      else { mseg(0.0, -0.11, 0.026, 0.14, 0.042, 0.0, GUN.dark); mplate(0.0, -0.11, 0.026, 0.14, 0.042, 0.0); }
      B.tag = null;
      const sy = iron(0.05, 0.142, mz0 + 0.015, by + 0.012, by + 0.06, { rear: 'ring', ringFrame: true });
      const mz = muzzleAtt(by, mz0);
      stockAtt(0.434, -0.008);
      if (att.grip === 'sling') H.sling(0.0, -0.33, 0.0, 0.33);
      Object.assign(u, { sightY: sy, fore, mag: new THREE.Vector3(0, att.mag === 'ext' ? -0.1 : -0.07, -0.11), muzzle: new THREE.Vector3(0, by, mz), adsDist: 0.22, grip: { y: -0.03, z: 0.035, tilt: -0.3, w: 0.034 } });
      break;
    }
    // ---- subfusil vardenés de chapa MP-38: tubo, armazón de baquelita, cargador recto largo y culata plegable de varillas
    case 'tsmg': {
      const by = 0.075, bak = 0x2c2622;
      tb(0.0195, 0.3, 0, by, -0.03, GUN.metal, 14); for (let i = 0; i < 6; i++) tb(0.0205, 0.004, 0, by, -0.15 + i * 0.05, GUN.dark, 14);
      rb(0.032, 0.05, 0.2, 0, 0.038, 0.0, bak, 0.008); bx(0.034, 0.012, 0.2, 0, 0.06, 0.0, GUN.dark);
      bx(0.03, 0.01, 0.03, -0.024, by, -0.01, GUN.dark); B.add(GEO.sphere(0.009, 8, 6), -0.034, by, -0.01, GUN.dark);
      const len = att.barrel === 'short' ? 0.12 : att.barrel === 'long' ? 0.24 : 0.17, mz0 = -0.18 - len;
      tb(0.0095, len, 0, by, -0.18 - len / 2, GUN.dark, 10); tb(0.015, 0.03, 0, by, -0.19, GUN.metal, 10);
      rb(0.012, 0.02, 0.07, 0, by - 0.024, -0.22, GUN.metal, 0.004);
      tb(0.013, 0.012, 0, by, mz0 + 0.008, GUN.metal, 10); bx(0.004, 0.02, 0.008, 0, by + 0.02, mz0 + 0.01, GUN.dark); B.add(GEO.torus(0.014, 0.0025, 12, 4), 0, by + 0.024, mz0 + 0.01, GUN.dark, { ry: X });
      rb(0.036, 0.06, 0.05, 0, 0.03, -0.13, GUN.metal, 0.006);
      trig(-0.02, 0.01, 0.06); pgrip(0.04, -0.03, bak, 0.034, -0.2);
      // culata de varillas desplegada (plegada con «culata recortada»)
      if (att.stock !== 'skel') { for (const sg of [-1, 1]) tb(0.006, 0.26, sg * 0.016, 0.05, 0.22, GUN.metal, 6); bx(0.044, 0.09, 0.014, 0, 0.03, 0.355, GUN.metal); bx(0.044, 0.022, 0.03, 0, 0.05, 0.1, GUN.metal); }
      else { for (const sg of [-1, 1]) tb(0.006, 0.24, sg * 0.02, 0.008, -0.03, GUN.metal, 6); bx(0.05, 0.03, 0.016, 0, 0.0, -0.15, GUN.metal); }
      B.tag = 'mag';
      const h = att.mag === 'ext' ? 0.26 : 0.21; mseg(-0.01, -0.13, 0.022, h, 0.036, 0.0, GUN.dark); mplate(-0.01, -0.13, 0.022, h, 0.036, 0.0);
      B.tag = null;
      const sy = iron(0.06, by + 0.02, mz0 + 0.01, by + 0.012, by + 0.04, { rear: 'square', hood: 'ring' });
      const mz = muzzleAtt(by, mz0);
      if (att.grip === 'sling') H.sling(0.05, -0.2, 0.03, 0.3);
      Object.assign(u, { sightY: sy, fore: new THREE.Vector3(0, 0.05, -0.215), mag: new THREE.Vector3(0, -0.12, -0.13), muzzle: new THREE.Vector3(0, by, mz), adsDist: 0.22, grip: { y: -0.03, z: 0.04, tilt: -0.2, w: 0.034 } });
      break;
    }
    // ---- escopeta de trinchera M-97: corredera de madera estriada, martillo a la vista, guardamanos perforado
    case 'shotgun': {
      const by = 0.085, wood = 0x5e3b22;
      rb(0.046, 0.08, 0.2, 0, 0.062, -0.04, GUN.metal, 0.01); rb(0.012, 0.026, 0.022, 0, 0.11, 0.06, GUN.dark, 0.004, { rx: -0.6 }); bx(0.006, 0.018, 0.06, 0.024, 0.07, -0.05, GUN.dark);
      const len = att.barrel === 'short' ? 0.4 : att.barrel === 'long' ? 0.6 : 0.5, mz0 = -0.14 - len;
      tb(0.0145, len, 0, by, -0.14 - len / 2, GUN.dark, 12); bx(0.007, 0.012, len - 0.02, 0, by + 0.018, -0.15 - len / 2, GUN.dark);   // nervio de puntería sobre el cañón
      const tl = att.mag === 'ext' ? len - 0.03 : len - 0.1; tb(0.012, tl, 0, 0.055, -0.14 - tl / 2, GUN.metal, 10); tb(0.0145, 0.02, 0, 0.055, -0.14 - tl, GUN.dark, 10);
      rb(0.05, 0.046, 0.16, 0, 0.055, -0.34, wood, 0.012); for (let i = 0; i < 6; i++) bx(0.052, 0.04, 0.005, 0, 0.055, -0.41 + i * 0.026, shade(wood, -0.35));
      // guardamanos perforado de trinchera
      rb(0.036, 0.022, len * 0.6, 0, by + 0.012, -0.14 - len * 0.45, GUN.dark, 0.006); for (let i = 0; i < 6; i++) for (const sg of [-1, 1]) bx(0.004, 0.008, 0.012, sg * 0.0175, by + 0.012, -0.2 - i * len * 0.09, 0x141516);
      // culata recta de nogal
      const zb = woodButt(H, wood, { plate: GUN.dark, short: att.stock === 'skel' });
      trig(0.02, 0.012, 0.07); bx(0.03, 0.012, 0.08, 0, 0.018, -0.02, GUN.metal);
      const sy = iron(-0.12, 0.103, mz0 + 0.012, by + 0.024, by + 0.032, { rear: 'none', front: 'bead', beadR: 0.0042 });
      const mz = muzzleAtt(by, mz0);
      stockAtt(zb + 0.012, -0.018);
      if (att.grip === 'sling') H.sling(0.035, -0.4, -0.07, 0.33);
      Object.assign(u, { sightY: sy, fore: new THREE.Vector3(0, 0.03, -0.34), mag: new THREE.Vector3(0, 0.04, -0.12), muzzle: new THREE.Vector3(0, by, mz), adsDist: 0.24, grip: { y: 0.032, z: 0.125, tilt: -0.6, w: 0.036 } });
      break;
    }
    // ---- escopeta de caza de dos cañones (la de los mineros y los civiles)
    case 'dbl': {
      const wood = 0x5e3b22, len = att.barrel === 'short' ? 0.44 : att.barrel === 'long' ? 0.72 : 0.62, mz0 = -0.09 - len;
      for (const sg of [-1, 1]) { tb(0.0172, len, sg * 0.0175, 0.085, -0.09 - len / 2, GUN.dark); tb(0.0185, 0.02, sg * 0.0175, 0.085, mz0 + 0.01, GUN.metal); }
      bx(0.016, 0.01, len - 0.02, 0, 0.1, -0.09 - len / 2, GUN.dark); B.add(GEO.sphere(0.005, 8, 6), 0, 0.11, mz0 + 0.015, 0xcfc7a0);
      rb(0.062, 0.075, 0.17, 0, 0.06, -0.045, GUN.metal, 0.012); bx(0.064, 0.012, 0.1, 0, 0.1, -0.02, GUN.dark); for (const sg of [-1, 1]) B.add(GEO.cyl(0.012, 0.012, 0.006, 10), sg * 0.032, 0.062, -0.07, GUN.steel, { rz: X });
      for (const sg of [-1, 1]) rb(0.008, 0.03, 0.02, sg * 0.012, 0.1, 0.035, GUN.dark, 0.003, { rx: -0.6 });
      bx(0.008, 0.006, 0.05, 0, 0.1, 0.05, GUN.steel); rb(0.012, 0.022, 0.016, 0, 0.1, 0.075, GUN.dark, 0.004, { rx: -0.4 });
      rb(0.062, 0.046, 0.22, 0, 0.036, -0.25, wood, 0.014); for (let i = 0; i < 4; i++) bx(0.064, 0.036, 0.005, 0, 0.036, -0.33 + i * 0.04, 0x4a301c); bx(0.07, 0.018, 0.02, 0, 0.012, -0.14, GUN.dark);
      const zb = woodButt(H, wood, { plate: GUN.dark, short: att.stock === 'skel' });
      trig(-0.02, 0.012, 0.075); bx(0.008, 0.01, 0.01, 0, 0.013, -0.045, GUN.steel);
      B.tag = 'mag'; for (const sg of [-1, 1]) { B.add(GEO.cyl(0.0105, 0.0105, 0.05, 8), sg * 0.015, -0.02, -0.2, 0xb03a2a, { rx: X }); B.add(GEO.cyl(0.011, 0.011, 0.012, 8), sg * 0.015, -0.02, -0.17, 0xc9a23a, { rx: X }); } B.tag = null;
      const sy = iron(-0.05, 0.1, mz0 + 0.015, 0.1, 0.122, { rear: 'none', front: 'bead' });
      const mz = muzzleAtt(0.085, mz0);
      stockAtt(zb + 0.012, -0.018);
      if (att.grip === 'sling') H.sling(0.02, -0.3, -0.07, 0.33);
      Object.assign(u, { sightY: sy, fore: new THREE.Vector3(0, 0.015, -0.27), mag: new THREE.Vector3(0, -0.02, -0.2), muzzle: new THREE.Vector3(0, 0.085, mz), adsDist: 0.24, grip: { y: 0.032, z: 0.125, tilt: -0.6, w: 0.036 } });
      break;
    }
    // ---- ametralladora vardenesa M-34: camisa perforada, bípode, culata de baquelita y tambor de cinta al costado
    case 'lmg': {
      const by = 0.075, bak = 0x2c2622;
      rb(0.05, 0.07, 0.34, 0, 0.07, -0.05, GUN.metal, 0.008); rb(0.048, 0.022, 0.22, 0, 0.112, -0.01, GUN.dark, 0.006); bx(0.05, 0.008, 0.04, 0, 0.126, 0.03, GUN.metal);
      const jl = att.barrel === 'heavy' ? 0.44 : 0.42; tb(0.023, jl, 0, by, -0.22 - jl / 2, GUN.dark, 14);
      for (let i = 0; i < 7; i++) for (const a of [0, 1, 2, 3]) { const ang = a * X; bx(0.012, 0.012, 0.03, Math.cos(ang) * 0.021, by + Math.sin(ang) * 0.021, -0.27 - i * 0.05, 0x101112, { rz: ang }); }
      const mz0 = -0.22 - jl - 0.07; tb(0.0095, 0.08, 0, by, -0.22 - jl - 0.035, GUN.dark, 10); cn(0.012, 0.022, 0.06, 0, by, mz0 + 0.02, GUN.dark, 12);
      bx(0.012, 0.03, 0.02, 0, by + 0.035, -0.6, GUN.dark); bx(0.004, 0.024, 0.006, 0, by + 0.058, -0.6, GUN.dark);
      // bípode plegable delante
      bx(0.03, 0.02, 0.04, 0, by - 0.026, -0.55, GUN.metal);
      for (const sg of [-1, 1]) bx(0.009, 0.2, 0.009, sg * 0.04, by - 0.115, -0.6, GUN.dark, { rx: 0.35, rz: sg * 0.2 });
      // culata y empuñadura de baquelita
      rb(0.036, 0.05, 0.1, 0, 0.06, 0.15, bak, 0.01, { rx: 0.05 }); rb(0.042, 0.1, 0.18, 0, 0.04, 0.28, bak, 0.014); bx(0.044, 0.104, 0.012, 0, 0.04, 0.375, GUN.metal);
      trig(0.0, 0.01, 0.06); pgrip(0.035, -0.03, bak, 0.034, -0.3);
      // tambor de cinta (50) enganchado al costado izquierdo
      B.tag = 'mag';
      if (att.mag === 'drum') { B.add(GEO.cyl(0.06, 0.06, 0.06, 14), -0.06, 0.06, -0.12, GUN.olive, { rz: X }); B.add(GEO.cyl(0.06, 0.06, 0.06, 14), 0.06, 0.06, -0.12, GUN.olive, { rz: X }); bx(0.18, 0.02, 0.04, 0, 0.12, -0.12, GUN.dark); }
      else { B.add(GEO.cyl(0.058, 0.058, 0.055, 14), -0.058, 0.05, -0.12, GUN.olive, { rz: X }); B.add(GEO.cyl(0.04, 0.04, 0.058, 12), -0.058, 0.05, -0.12, shade(GUN.olive, -0.2), { rz: X }); bx(0.04, 0.03, 0.04, -0.03, 0.09, -0.12, GUN.dark); }
      B.tag = null;
      const sy = iron(-0.05, 0.123, -0.6, by + 0.045, by + 0.07, { rear: 'u', front: 'barley', hood: 'arch' });
      const mz = muzzleAtt(by, mz0);
      stockAtt(0.38, 0.04);
      if (att.grip === 'sling') H.sling(0.02, -0.4, 0.0, 0.3);
      Object.assign(u, { sightY: sy, fore: new THREE.Vector3(0, 0.04, -0.3), mag: new THREE.Vector3(-0.06, 0.05, -0.12), muzzle: new THREE.Vector3(0, by, mz), adsDist: 0.24, grip: { y: -0.03, z: 0.035, tilt: -0.3, w: 0.034 } });
      break;
    }
    // ---- fusil ametrallador sanmarcialense FA-30: cajón largo, cargador de 20 delante del guardamonte, guardamanos de nogal y bípode en la boca
    case 'mg2': {
      const by = 0.08, wood = 0x5e3b22;
      rb(0.044, 0.07, 0.38, 0, 0.065, -0.08, GUN.metal, 0.008); bx(0.008, 0.02, 0.06, 0.024, 0.07, -0.02, GUN.dark); rb(0.036, 0.02, 0.1, 0, 0.105, 0.04, GUN.metal, 0.005);
      const len = 0.5; tb(0.0115, len, 0, by, -0.27 - len / 2, GUN.dark, 10); const mz0 = -0.27 - len - 0.06; cn(0.012, 0.02, 0.06, 0, by, mz0 + 0.03, GUN.dark, 12);
      tb(0.011, 0.32, 0, 0.05, -0.42, GUN.metal, 8); rb(0.046, 0.05, 0.22, 0, 0.052, -0.37, wood, 0.012); for (let i = 0; i < 5; i++) bx(0.048, 0.03, 0.005, 0, 0.05, -0.44 + i * 0.035, shade(wood, -0.3));
      bx(0.012, 0.03, 0.02, 0, by + 0.024, mz0 + 0.07, GUN.dark);
      // bípode junto a la boca
      bx(0.032, 0.02, 0.03, 0, by - 0.02, -0.7, GUN.metal); for (const sg of [-1, 1]) bx(0.009, 0.22, 0.009, sg * 0.04, by - 0.12, -0.74, GUN.dark, { rx: 0.3, rz: sg * 0.18 });
      const zb = woodButt(H, wood);
      trig(0.03, 0.006, 0.07); bx(0.03, 0.012, 0.1, 0, 0.02, 0.0, GUN.metal);
      B.tag = 'mag'; { const h = att.mag === 'ext' ? 0.15 : 0.1; mseg(0.03, -0.1, 0.032, h, 0.08, 0.05, GUN.dark); mplate(0.03, -0.1, 0.032, h, 0.08, 0.05); } B.tag = null;
      let sy = opticAtt(by + 0.04, -0.02);
      if (sy == null) sy = iron(0.03, 0.115, mz0 + 0.07, by + 0.034, by + 0.052, { rear: 'square', front: 'barley', hood: 'wings' });
      const mz = muzzleAtt(by, mz0);
      stockAtt(zb + 0.012, -0.018);
      if (att.grip === 'sling') H.sling(0.02, -0.42, -0.06, 0.33);
      Object.assign(u, { sightY: sy, fore: new THREE.Vector3(0, 0.03, -0.37), mag: new THREE.Vector3(0, -0.04, -0.1), muzzle: new THREE.Vector3(0, by, mz), adsDist: 0.24, grip: { y: 0.032, z: 0.125, tilt: -0.6, w: 0.036 } });
      break;
    }
    // ---- Orbea 9 mm (cargador de 8): corredera plana con estrías, martillo, cachas de nogal y anilla de cordón
    case 'pistol': {
      const wood = 0x553420;
      rb(0.028, 0.034, 0.19, 0, 0.087, -0.06, GUN.metal, 0.007); for (let i = 0; i < 6; i++) bx(0.03, 0.03, 0.0035, 0, 0.088, 0.02 - i * 0.008, GUN.dark);
      bx(0.0285, 0.012, 0.03, 0.002, 0.095, -0.05, 0x1c1e20);
      rb(0.026, 0.028, 0.15, 0, 0.058, -0.05, GUN.metal, 0.006); rb(0.028, 0.11, 0.05, 0, 0.0, 0.015, GUN.metal, 0.009, { rx: -0.22 });
      for (const sg of [-1, 1]) rb(0.004, 0.085, 0.04, sg * 0.0155, -0.005, 0.015, wood, 0.003, { rx: -0.22 });
      rb(0.01, 0.022, 0.014, 0, 0.1, 0.04, GUN.dark, 0.003, { rx: -0.5 }); bx(0.006, 0.012, 0.02, 0.016, 0.066, 0.0, GUN.steel);
      B.add(GEO.torus(0.0075, 0.0018, 10, 4), 0, -0.075, 0.042, GUN.steel, { ry: X });
      bx(0.008, 0.008, 0.06, 0, 0.018, -0.045, GUN.dark); bx(0.008, 0.026, 0.008, 0, 0.03, -0.075, GUN.dark); bx(0.008, 0.02, 0.008, 0, 0.032, -0.02, GUN.dark, { rx: 0.25 });
      B.tag = 'mag'; rb(0.024, 0.09, 0.038, 0, -0.06, 0.032, GUN.dark, 0.006, { rx: -0.22 }); bx(0.03, 0.008, 0.044, 0, -0.105, 0.042, GUN.metal, { rx: -0.22 }); B.tag = null;
      tb(0.008, 0.012, 0, 0.087, -0.156, GUN.dark);
      if (vm) B.add(b(0.0045, 0.012, 0.01), -0.005, 0.111, 0.025, GUN.dark).add(b(0.0045, 0.012, 0.01), 0.005, 0.111, 0.025, GUN.dark).add(b(0.003, 0.01, 0.008), 0, 0.11, -0.145, GUN.dark);
      else B.add(b(0.012, 0.012, 0.01), 0, 0.111, 0.025, GUN.dark).add(b(0.004, 0.01, 0.008), 0, 0.11, -0.145, GUN.dark);
      Object.assign(u, { sightY: 0.115, fore: new THREE.Vector3(-0.03, -0.02, 0.0), mag: new THREE.Vector3(0, -0.07, 0.0), muzzle: new THREE.Vector3(0, 0.087, -0.165), adsDist: 0.4 });
      break;
    }
    // ---- pistola vardenesa P-08: rodillera articulada sobre el cajón, cañón fino y empuñadura muy inclinada
    case 'hp45': {
      const wood = 0x4a3020;
      tb(0.0085, 0.13, 0, 0.083, -0.155, GUN.dark, 10); rb(0.026, 0.03, 0.12, 0, 0.078, -0.035, GUN.metal, 0.006);
      tb(0.009, 0.05, 0, 0.1, 0.0, GUN.metal, 10); tb(0.009, 0.04, 0, 0.1, 0.045, GUN.metal, 10); for (const sg of [-1, 1]) B.add(GEO.cyl(0.012, 0.012, 0.01, 10), sg * 0.013, 0.1, 0.022, GUN.steel, { rz: X });
      rb(0.026, 0.026, 0.13, 0, 0.055, -0.03, GUN.metal, 0.006); rb(0.028, 0.105, 0.045, 0, -0.002, 0.04, GUN.metal, 0.009, { rx: -0.45 });
      for (const sg of [-1, 1]) rb(0.004, 0.08, 0.036, sg * 0.0155, -0.006, 0.042, wood, 0.003, { rx: -0.45 });
      bx(0.008, 0.008, 0.06, 0, 0.018, -0.04, GUN.dark); bx(0.008, 0.026, 0.008, 0, 0.03, -0.068, GUN.dark); bx(0.008, 0.02, 0.008, 0, 0.032, -0.02, GUN.dark, { rx: 0.25 });
      B.tag = 'mag'; rb(0.022, 0.085, 0.034, 0, -0.06, 0.07, GUN.dark, 0.006, { rx: -0.45 }); B.add(GEO.sphere(0.014, 10, 6), 0, -0.1, 0.09, wood, { sx: 0.8, sy: 0.6 }); B.tag = null;
      bx(0.004, 0.012, 0.008, 0, 0.096, -0.212, GUN.dark); B.add(b(0.0075, 0.0075, 0.007), 0, 0.1096, -0.212, GUN.dark, { rz: Math.PI / 4 });   // grano de cebada
      if (vm) B.add(b(0.003, 0.014, 0.008), -0.0052, 0.1185, 0.06, GUN.dark, { rz: 0.62 }).add(b(0.003, 0.014, 0.008), 0.0052, 0.1185, 0.06, GUN.dark, { rz: -0.62 }).add(b(0.02, 0.006, 0.008), 0, 0.109, 0.06, GUN.dark);   // alza en V
      else B.add(b(0.012, 0.012, 0.01), 0, 0.115, 0.06, GUN.dark);
      Object.assign(u, { sightY: 0.115, fore: new THREE.Vector3(-0.03, -0.02, 0.02), mag: new THREE.Vector3(0, -0.07, 0.04), muzzle: new THREE.Vector3(0, 0.083, -0.222), adsDist: 0.4, grip: { y: 0, z: 0.03, tilt: -0.45, w: 0.031 } });
      break;
    }
    // ---- revólver de oficial: tambor de seis, cañón con nervio, cachas de nogal y anilla
    case 'magnum': {
      // 3.2.3: revólver de oficial de armazón cerrado: tambor de seis con estrías y bocas de recámara, cañón con banda y vaina del extractor,
      // martillo con espuela, guardamonte redondo, cachas de nogal con remate de acero y anilla para el cordón
      const wood = 0x5a3620, st = GUN.steel, mt = GUN.metal, dk = GUN.dark, cy = 0.0755, by = 0.087;
      // armazón: puente superior, cuna del tambor, escudo trasero y frente donde rosca el cañón
      bx(0.02, 0.008, 0.066, 0, by + 0.013, -0.026, mt); rb(0.02, 0.016, 0.066, 0, cy - 0.022, -0.026, mt, 0.004);
      rb(0.026, 0.05, 0.014, 0, cy - 0.002, 0.004, mt, 0.006); rb(0.022, 0.03, 0.014, 0, by - 0.006, -0.064, mt, 0.005);
      for (const sx of [-1, 1]) bx(0.002, 0.012, 0.03, sx * 0.0125, cy - 0.006, 0.02, mt);
      // tambor con estrías, bocas de las recámaras y eje
      B.tag = 'mag'; tb(0.019, 0.042, 0, cy, -0.028, st, 18);
      for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i * Math.PI / 3, af = a + Math.PI / 6;
        tb(0.0048, 0.002, Math.cos(a) * 0.0115, cy + Math.sin(a) * 0.0115, -0.0495, dk, 8);
        bx(0.004, 0.003, 0.028, Math.cos(af) * 0.0182, cy + Math.sin(af) * 0.0182, -0.03, dk, { rz: af }); }
      tb(0.004, 0.006, 0, cy, -0.051, mt, 8); B.tag = null;
      // cañón con banda superior, punto de mira y vaina del extractor debajo
      tb(0.0088, 0.15, 0, by, -0.143, mt, 14); tb(0.0098, 0.012, 0, by, -0.212, mt, 14); tb(0.0042, 0.004, 0, by, -0.219, dk, 10);
      bx(0.0065, 0.006, 0.148, 0, by + 0.009, -0.143, mt); bx(0.003, 0.013, 0.012, 0, by + 0.016, -0.208, dk);
      tb(0.0052, 0.09, 0, cy - 0.006, -0.11, mt, 10); tb(0.0062, 0.008, 0, cy - 0.006, -0.158, st, 10);
      // alza: muesca en el puente superior
      for (const sx of [-1, 1]) bx(0.004, 0.006, 0.008, sx * 0.0045, by + 0.019, 0.004, dk);
      // martillo con espuela estriada, pasador y retén del tambor
      bx(0.007, 0.024, 0.01, 0, by + 0.004, 0.014, st, { rx: -0.45 }); bx(0.008, 0.005, 0.016, 0, by + 0.017, 0.024, st, { rx: -0.2 });
      bx(0.006, 0.006, 0.008, -0.013, cy + 0.004, 0.006, st); B.add(GEO.sphere(0.003, 8, 6), 0.0132, cy - 0.016, 0.0, mt);
      // guardamonte y gatillo
      B.add(GEO.torus(0.016, 0.0024, 8, 20, Math.PI * 1.15), 0, cy - 0.03, 0.002, mt, { ry: X, rz: Math.PI * 0.95 });
      bx(0.006, 0.02, 0.006, 0, cy - 0.036, 0.004, dk, { rx: 0.3 });
      // empuñadura en caída: cachas de nogal, lomo y remate de acero, anilla del cordón
      rb(0.028, 0.092, 0.034, 0, cy - 0.072, 0.036, wood, 0.012, { rx: -0.32 });
      bx(0.012, 0.096, 0.008, 0, cy - 0.068, 0.054, mt, { rx: -0.32 }); bx(0.024, 0.008, 0.036, 0, cy - 0.118, 0.054, mt, { rx: -0.32 });
      for (const sx of [-1, 1]) B.add(GEO.sphere(0.0035, 8, 6), sx * 0.0145, cy - 0.07, 0.04, mt);
      B.add(GEO.torus(0.0065, 0.0015, 8, 12), 0, cy - 0.13, 0.064, st, { ry: X });
      Object.assign(u, { sightY: by + 0.022, fore: new THREE.Vector3(-0.03, cy - 0.07, 0.02), mag: new THREE.Vector3(0, cy, -0.028), muzzle: new THREE.Vector3(0, by, -0.222), adsDist: 0.4, rl: 'cyl',
        grip: { y: cy - 0.06, z: 0.04, tilt: -0.32, w: 0.028 } });
      break;
    }
    // ---- tubo antitanque de un solo uso: tubo fino, cabeza gruesa, alza de hoja y palanca de disparo
    case 'rocket': {
      const ol = 0x4e5638;
      tb(0.026, 0.82, 0, 0.12, -0.0, ol, 12); tb(0.028, 0.02, 0, 0.12, 0.4, GUN.dark, 12);
      cn(0.03, 0.072, 0.1, 0, 0.12, -0.46, ol, 14); tb(0.072, 0.03, 0, 0.12, -0.525, ol, 14); cn(0.072, 0.03, 0.12, 0, 0.12, -0.6, ol, 14); tb(0.012, 0.04, 0, 0.12, -0.675, GUN.dark, 8);
      bx(0.03, 0.03, 0.08, 0, 0.152, -0.12, GUN.dark); bx(0.014, 0.012, 0.05, 0, 0.17, -0.12, 0x8a2a20);
      bx(0.016, 0.03, 0.006, -0.064, 0.165, -0.12, GUN.metal); bx(0.05, 0.006, 0.01, -0.04, 0.15, -0.12, GUN.metal);
      if (vm) B.add(b(0.004, 0.01, 0.004), -0.07, 0.185, -0.12, GUN.dark).add(b(0.004, 0.01, 0.004), -0.058, 0.185, -0.12, GUN.dark).add(b(0.003, 0.012, 0.004), -0.064, 0.19, -0.48, GUN.dark).add(b(0.03, 0.004, 0.004), -0.05, 0.19, -0.48, GUN.dark);
      else B.add(b(0.01, 0.03, 0.01), -0.064, 0.18, -0.48, GUN.dark).add(b(0.04, 0.005, 0.006), -0.04, 0.19, -0.48, GUN.dark);
      rb(0.03, 0.09, 0.04, 0, 0.05, 0.0, GUN.dark, 0.008, { rx: 0.15 }); bx(0.012, 0.012, 0.03, 0, 0.065, -0.04, GUN.dark);
      for (let i = 0; i < 2; i++) tb(0.0275, 0.008, 0, 0.12, -0.2 + i * 0.3, shade(ol, -0.3), 12);
      Object.assign(u, { sightY: 0.2, fore: new THREE.Vector3(0, 0.08, -0.3), mag: new THREE.Vector3(0, 0.12, 0.42), muzzle: new THREE.Vector3(0, 0.12, -0.7), adsDist: 0.1, grip: { y: 0.04, z: 0.0, tilt: -0.15, w: 0.034 } });
      break;
    }
    // ---- cuchillo de trinchera: mango de madera con virola, guarda y hoja de un filo
    case 'knife':
      B.add(GEO.rbox(0.024, 0.03, 0.11, 0.008), 0, 0, 0.0, 0x553420).add(b(0.03, 0.034, 0.012), 0, 0, 0.058, GUN.metal).add(b(0.05, 0.012, 0.012), 0, 0, -0.06, GUN.metal).add(b(0.006, 0.03, 0.17), 0, 0.004, -0.15, GUN.steel)
        .add(GEO.cone(0.016, 0.04, 4), 0, 0.004, -0.255, GUN.steel, { rx: -X, sx: 0.3 });
      Object.assign(u, { sightY: 0, fore: null, muzzle: new THREE.Vector3(0, 0, -0.24), adsDist: 0.3 });
      break;
    default:
      B.add(b(0.05, 0.08, 0.4), 0, 0.05, -0.1, GUN.metal);
  }
}
