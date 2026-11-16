// ---- 08g_proto_guns.js ----
// =====================================================================
// DISEÑOS DE ARMAS DEL PROTOTIPO v4 (3.2.0) — generado por tools/port_proto_guns.py; no editar a mano.
// Todo va dentro de PROTO para no chocar con los nombres del resto del juego.
// Convenio: cañón hacia -Z, arriba +Y, origen en el gatillo, ánima a y≈.03.
// =====================================================================
const PROTO = (() => {
const T3 = THREE; let LOD = 1;
const sg = (n, min = 5) => Math.max(min, Math.round((n || 0) * LOD));
// mismas geometrías de three con el número de caras a escala (LOD < 1 para las armas vistas de lejos)
const THREE_L = Object.assign({}, T3);
THREE_L.CylinderGeometry = function (a, b, h, s = 32, ...r) { return new T3.CylinderGeometry(a, b, h, sg(s, 6), ...r); };
THREE_L.SphereGeometry = function (r, w = 32, h = 16, ...x) { return new T3.SphereGeometry(r, sg(w, 6), sg(h, 4), ...x); };
THREE_L.TorusGeometry = function (r, t, a = 12, b = 48, ...x) { return new T3.TorusGeometry(r, t, sg(a, 4), sg(b, 6), ...x); };
THREE_L.CapsuleGeometry = function (r, l, c = 4, s = 8) { return new T3.CapsuleGeometry(r, l, sg(c, 2), sg(s, 5)); };
THREE_L.TubeGeometry = function (c, n = 64, r = 1, s = 8, ...x) { return new T3.TubeGeometry(c, sg(n, 8), r, sg(s, 4), ...x); };
THREE_L.ExtrudeGeometry = function (s, o = {}) { return new T3.ExtrudeGeometry(s, { ...o, bevelSegments: o.bevelEnabled === false ? 0 : sg(o.bevelSegments ?? 3, 1), curveSegments: sg(o.curveSegments ?? 12, 3) }); };
return ((THREE) => {
// Armas nuevas del prototipo 1.0 (todas de la lista de la novela). Mismo convenio que guns.js: cañón hacia -Z, arriba +Y,
// origen en el gatillo; ánima a y≈.03 en las armas largas, así los agarres y la recarga por peine se comparten.
// Campos de juego: type (bolt | auto | semi | break), rl (clip | side | bottom | grip | shells), dmg por zona, power (empuje),
// heat/cool (calentamiento por disparo y enfriado por segundo), pat (patrón de retroceso por disparo: [subida, lado]).
const GUNS2 = {
  orbea: { name: 'Orbea 9 mm', cal: '9 mm', mag: 8, reserve: 48, v: 350, zero: 25, rpm: 0, semi: true, bolt: false, auto: false, recoil: [1.9, .7], kick: .035, spread: .0055, hipSpread: .03, adsFov: 64, reload: 1.9, sound: 'pistol',
    hip: [.11, -.15, -.37], sightY: .0565, adsZ: -.43, rh: [0, -.065, .07], lh: [0, -.06, .08], muzzle: -.128, eject: [.016, .045, .0], slot: 2, inspZ: -.42,
    type: 'semi', rl: 'grip', dmg: { head: 100, torso: 40, arm: 25 }, power: .9, magOut: [0, -.075, .02], magDrop: [.02, -.03, .06], magRot: [.25, 0, .15], rlY: .3, rlZ: .04, rlX: -.04, rlRot: [.5, -.3, -1.1] },
  vardenes: { name: 'Fusil vardenés', cal: '7,92 mm', mag: 5, reserve: 60, v: 790, zero: 100, rpm: 0, bolt: true, auto: false, recoil: [3.9, 1.0], kick: .07, spread: .0005, hipSpread: .024, adsFov: 50, reload: 2.8, sound: 'rifle2', boltT: .82,
    hip: [.13, -.14, -.38], sightY: .0645, adsZ: -.42, rh: [0, -.04, .085], lh: [0, -.03, -.24], muzzle: -.7, eject: [.02, .035, .02], slot: 1, inspZ: -1.2,
    type: 'bolt', rl: 'clip', dmg: { head: 100, torso: 100, arm: 60 }, power: 2.4 },
  escopeta: { name: 'Escopeta de dos cañones', cal: 'calibre 12', mag: 2, reserve: 30, v: 400, zero: 25, rpm: 0, bolt: false, auto: false, recoil: [5.2, 1.6], kick: .09, spread: .03, hipSpread: .042, adsFov: 66, reload: 2.4, sound: 'shotgun',
    hip: [.13, -.145, -.37], sightY: .049, adsZ: -.41, rh: [0, -.04, .085], lh: [0, -.03, -.24], muzzle: -.74, eject: [.02, .035, -.03], slot: 1, inspZ: -1.2,
    type: 'break', rl: 'shells', pellets: 9, dmg: { head: 26, torso: 17, arm: 10 }, falloff: [10, 32], power: .5 },
  ametrallador: { name: 'Fusil ametrallador', cal: '7 mm', mag: 20, reserve: 160, v: 740, zero: 100, rpm: 480, bolt: false, auto: true, recoil: [2.7, 1.25], kick: .04, spread: .0022, hipSpread: .034, adsFov: 54, reload: 3.2, sound: 'lmg',
    hip: [.14, -.16, -.4], sightY: .0745, adsZ: -.43, rh: [0, -.065, .07], lh: [0, -.03, -.26], muzzle: -.69, eject: [.026, .035, -.04], slot: 1, inspZ: -1.15,
    type: 'auto', rl: 'bottom', dmg: { head: 100, torso: 60, arm: 35 }, power: 1.8, heat: .04, cool: .09, bipod: true, jams: true, charge: [.072, .02, .03],
    pat: [[1, .3], [1.1, .5], [1.15, .9], [1.1, 1.2], [1, .6], [1, -.2], [1, -.6], [.95, -.1], [.95, .5], [1, .8]], magOut: [0, -.1, 0], magDrop: [.08, -.3, .2], magRot: [.45, 0, .35] },
  subfusilV: { name: 'Subfusil vardenés', cal: '9 mm', mag: 30, reserve: 180, v: 390, zero: 50, rpm: 600, bolt: false, auto: true, recoil: [.8, .45], kick: .019, spread: .0045, hipSpread: .028, adsFov: 60, reload: 2.3, sound: 'smg',
    hip: [.12, -.145, -.3], sightY: .061, adsZ: -.42, rh: [0, -.065, .07], lh: [0, .002, -.2], muzzle: -.37, eject: [.02, .036, -.06], slot: 1, inspZ: -.85,
    type: 'auto', rl: 'bottom', dmg: { head: 100, torso: 30, arm: 20 }, power: 1, heat: .012, cool: .3, charge: [.075, .025, .02], magOut: [0, -.13, 0], magDrop: [.05, -.3, .16], magRot: [.4, 0, .3],
    pat: [[1, .2], [1, -.3], [1, .4], [.9, -.2], [1, .3], [.95, -.4], [1, .2], [.9, .1]] },
  pistolaV: { name: 'Pistola vardenesa', cal: '9 mm', mag: 8, reserve: 48, v: 340, zero: 25, rpm: 0, semi: true, bolt: false, auto: false, recoil: [2.2, .6], kick: .038, spread: .005, hipSpread: .03, adsFov: 64, reload: 1.9, sound: 'pistol',
    hip: [.11, -.15, -.37], sightY: .0565, adsZ: -.43, rh: [0, -.065, .07], lh: [0, -.06, .08], muzzle: -.15, eject: [.016, .045, -.01], slot: 2, inspZ: -.45,
    type: 'semi', rl: 'grip', dmg: { head: 100, torso: 45, arm: 25 }, power: 1, magOut: [0, -.075, .02], magDrop: [.02, -.03, .06], magRot: [.25, 0, .15], rlY: .3, rlZ: .04, rlX: -.04, rlRot: [.5, -.3, -1.1] },
};
const DS = THREE.DoubleSide;
const EXTRA = {
  // ---------------- Subfusil vardenés de chapa: cajón de chapa estampada, camisa con ranuras, cargador recto abajo, culata de alambre ----------------
  subfusilV(M, T) { const { g, P, add, box, tube, notch, loft } = T; const bak = M.bak || (M.bak = new THREE.MeshStandardMaterial({ color: 0x2b1e17, roughness: .5, side: DS }));
    add(new THREE.Mesh(loft([{ z: .175, t: .047, b: .013, w: .03, e: 4 }, { z: .17, t: .049, b: .011, w: .034, e: 4 }, { z: -.12, t: .049, b: .011, w: .034, e: 4 }, { z: -.13, t: .044, b: .016, w: .03, e: 4 }], 20), M.steel));
    for (const z of [.15, -.1]) box(.036, .002, .006, M.steelW, 0, .049, z); box(.002, .03, .25, M.steelW, .0172, .03, .02).castShadow = false; box(.002, .03, .25, M.steelW, -.0172, .03, .02).castShadow = false; /* costuras de la chapa */
    tube(.0075, .0075, .23, M.steel, 0, .03, -.245); tube(.0095, .0095, .016, M.steel, 0, .03, -.362); tube(.004, .004, .004, M.dark, 0, .03, -.3705, null, 12);
    tube(.0175, .0175, .14, M.steel, 0, .03, -.2); tube(.0185, .0185, .006, M.steelW, 0, .03, -.272);
    for (let i = 0; i < 5; i++) for (const s of [-1, 1]) { const sl = box(.002, .012, .016, M.dark, s * .0172, .03, -.15 - i * .025); sl.castShadow = false; }
    for (let i = 0; i < 5; i++) { const sl = box(.012, .002, .016, M.dark, 0, .0473, -.15 - i * .025); sl.castShadow = false; }
    /* miras: alza de muesca fija atrás y punto con orejas (sin arco por encima de la línea de mira) */
    notch(.02, .016, .0024, .0045, M.steel, -0, .046, .1); box(.022, .004, .016, M.steel, 0, .048, .1);
    box(.012, .01, .016, M.steel, 0, .045, -.33); box(.0024, .016, .005, M.steel, 0, .053, -.33); for (const x of [-.008, .008]) box(.0018, .014, .012, M.steel, x, .055, -.33);
    /* brocal y cargador recto */
    box(.032, .03, .044, M.steel, 0, -.002, -.085); box(.034, .004, .048, M.steelW, 0, -.016, -.085);
    const mag = new THREE.Group(); mag.position.set(0, -.02, -.085); g.add(mag); P.mag = mag;
    box(.022, .17, .034, M.steelW, 0, -.085, 0, mag); box(.026, .006, .038, M.steel, 0, -.172, 0, mag); for (const s of [-1, 1]) box(.002, .12, .004, M.steel, s * .0112, -.08, 0, mag).castShadow = false;
    /* ventana de expulsión y palanca de montar a la derecha */
    box(.003, .014, .045, M.dark, .0172, .036, -.06).castShadow = false; box(.003, .006, .11, M.dark, .0175, .03, .05).castShadow = false;
    const ch = new THREE.Group(); ch.position.set(.02, .03, -.02); g.add(ch); P.bolt = ch; const kn = add(new THREE.Mesh(new THREE.CylinderGeometry(.0045, .005, .026, 10), M.steelW), ch); kn.rotation.z = Math.PI / 2; kn.position.x = .01;
    /* caja del disparador, guardamonte, gatillo y empuñadura de baquelita */
    box(.024, .016, .14, M.steel, 0, .004, .03);
    const tg = add(new THREE.Mesh(new THREE.TorusGeometry(.02, .0026, 8, 24, Math.PI), M.steel)); tg.rotation.set(Math.PI, Math.PI / 2, 0); tg.position.set(0, -.002, -.005); tg.scale.z = 1.8;
    const tr = box(.004, .02, .005, M.steelW, 0, -.008, 0); tr.rotation.x = .3;
    add(new THREE.Mesh((() => { const st = []; for (let i = 0; i <= 8; i++) { const u = i / 8; st.push({ z: .002 + u * .112, t: .05 + u * .034 + .016, b: .05 + u * .034 - .022 + u * .004, w: .028 + Math.sin(u * 3.1) * .006, e: 2.6 }); } const gg = loft(st, 20, 5); gg.rotateX(Math.PI / 2); return gg; })(), bak));
    /* culata de alambre plegable */
    box(.02, .024, .02, M.steel, 0, .016, .185); for (const x of [-.011, .011]) { const r = tube(.0045, .0045, .26, M.steel, x, .0, .31, null, 10); r.rotation.x = .1; }
    const r2 = tube(.0045, .0045, .22, M.steel, 0, -.045, .33, null, 10); r2.rotation.x = -.3;
    box(.03, .09, .008, M.steel, 0, -.035, .438); box(.034, .094, .004, M.steelW, 0, -.035, .444); /* culata baja: queda por debajo del ojo al apuntar */
  },
  // ---------------- Pistola vardenesa: corredera recta y larga, empuñadura muy inclinada con cachas estriadas de baquelita, anilla de correa ----------------
  pistolaV(M, T) { const { g, P, add, box, tube, screw, notch, loft } = T; const bak = M.bak || (M.bak = new THREE.MeshStandardMaterial({ color: 0x2b1e17, roughness: .5, side: DS }));
    const sl = new THREE.Group(); g.add(sl); P.bolt = sl;
    add(new THREE.Mesh(loft([{ z: .07, t: .05, b: .021, w: .024, e: 9 }, { z: .065, t: .051, b: .02, w: .025, e: 9 }, { z: -.132, t: .051, b: .02, w: .025, e: 9 }, { z: -.138, t: .049, b: .022, w: .023, e: 8 }], 18), M.steel), sl);
    for (let i = 0; i < 9; i++) for (const s of [-1, 1]) box(.0014, .02, .0016, M.dark, s * .0124, .036, .06 - i * .0036, sl).castShadow = false;
    box(.003, .01, .03, M.dark, .0122, .042, -.01, sl).castShadow = false;
    box(.0026, .007, .006, M.steel, 0, .0545, -.128, sl); notch(.016, .0075, .0022, .0035, M.steel, 0, .0505, .06);
    tube(.0058, .0058, .014, M.steel, 0, .035, -.145, null, 14); tube(.0032, .0032, .003, M.dark, 0, .035, -.1525, null, 10);
    add(new THREE.Mesh(loft([{ z: .068, t: .021, b: .004, w: .023, e: 6 }, { z: .03, t: .021, b: .004, w: .023, e: 6 }, { z: -.02, t: .021, b: .0, w: .023, e: 6 }, { z: -.125, t: .02, b: .008, w: .021, e: 6 }]), M.steel));
    const tg = add(new THREE.Mesh(new THREE.TorusGeometry(.017, .0024, 8, 24, Math.PI), M.steel)); tg.rotation.set(Math.PI, Math.PI / 2, 0); tg.position.set(0, .002, -.006); tg.scale.z = 1.5;
    const tr = box(.0036, .016, .0045, M.steelW, 0, -.004, .002); tr.rotation.x = .3; box(.004, .008, .012, M.steel, -.0128, .03, .05);
    add(new THREE.Mesh((() => { const st = []; for (let i = 0; i <= 8; i++) { const u = i / 8; st.push({ z: .002 + u * .1, t: .052 + u * .042 + .02, b: .052 + u * .042 - .024, w: .028 + Math.sin(u * 3.1) * .003, e: 3.6 }); } const gg = loft(st, 20, 5); gg.rotateX(Math.PI / 2); return gg; })(), M.steel));
    for (const s of [-1, 1]) { const chk = add(new THREE.Mesh((() => { const st = []; for (let i = 0; i <= 6; i++) { const u = .1 + i / 6 * .82; st.push({ z: .002 + u * .1, t: .052 + u * .042 + .016, b: .052 + u * .042 - .02, w: .006, e: 4 }); } const gg = loft(st, 14, 5); gg.rotateX(Math.PI / 2); return gg; })(), bak)); chk.position.x = s * .0135;
      for (let k = 0; k < 7; k++) { const rb = box(.0012, .0016, .03, M.dark, s * .0168, -.024 - k * .011, .072 + k * .0046); rb.rotation.x = -.4; rb.castShadow = false; } screw(s * .0172, -.05, .088, 'x'); }
    const lr = add(new THREE.Mesh(new THREE.TorusGeometry(.0055, .0013, 6, 12), M.steel)); lr.position.set(0, -.1, .118); lr.rotation.y = Math.PI / 2;
    const mg = new THREE.Group(); mg.position.set(0, -.05, .074); mg.rotation.x = -.4; g.add(mg); P.mag = mg; mg.userData.p0 = mg.position.clone(); mg.userData.r0 = mg.rotation.clone();
    box(.017, .1, .028, M.steelW, 0, 0, 0, mg); box(.021, .007, .033, bak, 0, -.054, .002, mg); box(.006, .006, .02, M.brass, 0, .051, -.004, mg);
  },
  // ---------------- Orbea 9 mm: corredera, armazón con cachas de nogal, cargador en la empuñadura ----------------
  orbea(M, T) { const { g, P, add, box, tube, screw, disc, notch, loft } = T;
    const sl = new THREE.Group(); g.add(sl); P.bolt = sl; // la corredera retrocede al disparar
    add(new THREE.Mesh(loft([{ z: .072, t: .049, b: .02, w: .0245, e: 7 }, { z: .066, t: .051, b: .019, w: .026, e: 7 }, { z: -.112, t: .051, b: .019, w: .026, e: 7 }, { z: -.12, t: .049, b: .021, w: .024, e: 6 }], 18), M.steel), sl);
    for (let i = 0; i < 7; i++) for (const s of [-1, 1]) box(.0014, .022, .0018, M.dark, s * .0128, .035, .062 - i * .0042, sl).castShadow = false; // estrías
    box(.003, .011, .034, M.dark, .0124, .042, -.002, sl).castShadow = false; // ventana de expulsión
    box(.0026, .007, .006, M.steel, 0, .0545, -.111, sl); notch(.016, .0075, .0022, .0035, M.steel, 0, .0505, .061); // punto y alza (el alza va en el armazón)
    tube(.0062, .0062, .006, M.steel, 0, .034, -.121, sl, 14); tube(.0034, .0034, .003, M.dark, 0, .034, -.1245, sl, 10);
    // armazón, guardapolvo, guardamonte, gatillo, martillo, seguro
    add(new THREE.Mesh(loft([{ z: .07, t: .02, b: .004, w: .024, e: 5 }, { z: .03, t: .02, b: .004, w: .024, e: 5 }, { z: -.02, t: .02, b: .0, w: .024, e: 5 }, { z: -.108, t: .019, b: .006, w: .022, e: 5 }]), M.steel));
    const tg = add(new THREE.Mesh(new THREE.TorusGeometry(.017, .0024, 8, 24, Math.PI), M.steel)); tg.rotation.set(Math.PI, Math.PI / 2, 0); tg.position.set(0, .002, -.006); tg.scale.z = 1.5;
    const tr = box(.0036, .016, .0045, M.steelW, 0, -.004, .002); tr.rotation.x = .3;
    const hm = box(.007, .016, .008, M.steel, 0, .046, .074); hm.rotation.x = -.5; box(.003, .007, .012, M.steel, -.0135, .024, .045);
    // empuñadura con la misma caída que la del subfusil (así comparte el agarre de la mano derecha)
    const gr = add(new THREE.Mesh((() => { const st = []; for (let i = 0; i <= 8; i++) { const u = i / 8; st.push({ z: .002 + u * .1, t: .052 + u * .03 + .021, b: .052 + u * .03 - .024, w: .03 + Math.sin(u * 3.1) * .004, e: 3.2 }); } const gg = loft(st, 20, 5); gg.rotateX(Math.PI / 2); return gg; })(), M.steel));
    for (const s of [-1, 1]) { const ch = add(new THREE.Mesh((() => { const st = []; for (let i = 0; i <= 6; i++) { const u = .1 + i / 6 * .82; st.push({ z: .002 + u * .1, t: .052 + u * .03 + .017, b: .052 + u * .03 - .02, w: .006, e: 4 }); } const gg = loft(st, 14, 5); gg.rotateX(Math.PI / 2); return gg; })(), M.wood)); ch.position.x = s * .0142; screw(s * .0176, -.055, .07, 'x'); }
    const lr = add(new THREE.Mesh(new THREE.TorusGeometry(.005, .0012, 6, 12), M.steel)); lr.position.set(0, -.108, .1); lr.rotation.y = Math.PI / 2;
    // cargador: va dentro de la empuñadura, se ve la base; baja siguiendo su eje
    const mg = new THREE.Group(); mg.position.set(0, -.052, .068); mg.rotation.x = -.29; g.add(mg); P.mag = mg; mg.userData.p0 = mg.position.clone(); mg.userData.r0 = mg.rotation.clone();
    box(.017, .1, .028, M.steelW, 0, .0, 0, mg); box(.022, .006, .034, M.steel, 0, -.054, .002, mg); box(.0024, .07, .012, M.dark, .0087, .0, -.004, mg).castShadow = false; box(.006, .006, .02, M.brass, 0, .051, -.004, mg);
  },
  // ---------------- Fusil vardenés de cerrojo (7,92): caja más oscura, manilla acodada hacia abajo, punto con túnel ----------------
  vardenes(M, T) { const { g, P, add, box, tube, screw, disc, notch, loft, strap } = T; const wood = M.wood2 || M.wood;
    add(new THREE.Mesh(loft([
      { z: .372, t: -.008, b: -.126, w: .041, e: 3.6 }, { z: .36, t: .0, b: -.125, w: .046, e: 3.3 }, { z: .29, t: .006, b: -.104, w: .047 }, { z: .21, t: .009, b: -.082, w: .045 }, { z: .155, t: .008, b: -.07, w: .041 },
      { z: .118, t: .004, b: -.064, w: .036, e: 2.3 }, { z: .085, t: .004, b: -.05, w: .035, e: 2.3 }, { z: .05, t: .013, b: -.038, w: .039 }, { z: .02, t: .02, b: -.033, w: .046, e: 3 }, { z: -.05, t: .022, b: -.031, w: .049, e: 3 },
      { z: -.14, t: .023, b: -.028, w: .047, e: 3 }, { z: -.22, t: .024, b: -.022, w: .043 }, { z: -.36, t: .024, b: -.017, w: .039 }, { z: -.5, t: .024, b: -.012, w: .036 }, { z: -.515, t: .022, b: -.008, w: .032 }]), wood));
    add(new THREE.Mesh(loft([{ z: -.12, t: .046, b: .02, w: .034 }, { z: -.135, t: .051, b: .02, w: .038 }, { z: -.36, t: .049, b: .02, w: .036 }, { z: -.49, t: .046, b: .02, w: .033 }]), wood));
    for (const s of [-1, 1]) { const f = box(.0016, .006, .12, M.dark, s * .0212, .004, -.25); f.rotation.y = s * .01; f.castShadow = false; } // acanaladuras para los dedos
    tube(.0108, .0094, .2, M.steel, 0, .03, -.23); tube(.0094, .0078, .37, M.steel, 0, .03, -.5); tube(.0044, .0044, .004, M.dark, 0, .03, -.6855, null, 12);
    tube(.0175, .0175, .05, M.steel, 0, .03, -.105); tube(.0157, .0157, .11, M.steel, 0, .03, -.03); tube(.0175, .0175, .03, M.steel, 0, .03, .05);
    box(.012, .004, .09, M.dark, .006, .0445, -.02).rotation.z = -.5; for (const x of [-.0075, .0075]) box(.006, .009, .026, M.steel, x, .0485, .05); box(.021, .004, .008, M.steel, 0, .046, .061);
    const bolt = new THREE.Group(); bolt.position.set(0, .03, 0); g.add(bolt); P.bolt = bolt;
    tube(.0097, .0097, .17, M.steelW, 0, 0, .03, bolt); box(.0025, .004, .1, M.steel, .0086, .004, .0, bolt);
    const hd = new THREE.Group(); hd.position.z = .085; bolt.add(hd);
    const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(.0042, .005, .056, 12), M.steelW), hd); stem.rotation.z = Math.PI / 2 + 1.0; stem.position.set(.024, -.023, .004);
    add(new THREE.Mesh(new THREE.SphereGeometry(.0115, 18, 14), M.steelW), hd).position.set(.04, -.048, .008);
    tube(.012, .0125, .034, M.steel, 0, 0, .128, bolt); tube(.0062, .0062, .012, M.steelW, 0, 0, .151, bolt); { const w = box(.012, .004, .016, M.steel, .007, .021, .13, bolt); w.rotation.z = .3; }
    // abrazadera, bocacha con tetón, punto con túnel, alza tangente
    const b1 = add(new THREE.Mesh(loft([{ z: -.352, t: .051, b: -.019, w: .042 }, { z: -.368, t: .051, b: -.019, w: .042 }], 22), M.steel)); screw(.0215, .012, -.36, 'x');
    add(new THREE.Mesh(loft([{ z: -.49, t: .047, b: -.014, w: .038 }, { z: -.53, t: .042, b: -.004, w: .032 }], 22), M.steel)); box(.01, .012, .034, M.steel, 0, .006, -.52);
    box(.0022, .022, .006, M.steel, 0, .0545, -.672); box(.012, .007, .02, M.steel, 0, .0405, -.672); tube(.0098, .0098, .026, M.steel, 0, .03, -.672);
    { const h = add(new THREE.Mesh(new THREE.CylinderGeometry(.0105, .0105, .016, 18, 1, true, -Math.PI * .62, Math.PI * 1.24), M.steel)); h.rotation.x = Math.PI / 2; h.position.set(0, .054, -.672); } // túnel del punto
    box(.02, .008, .03, M.steel, 0, .05, -.165); const leaf = box(.012, .0025, .06, M.steel, 0, .058, -.19); leaf.rotation.x = -.06; notch(.021, .0095, .0026, .0046, M.steel, 0, .0575, -.1665);
    for (const x of [-.0088, .0088]) box(.0026, .0065, .058, M.steel, x, .0535, -.192);
    // cantonera de copa, guardamonte, gatillo, tapa del depósito
    add(new THREE.Mesh(loft([{ z: .372, t: -.006, b: -.128, w: .043, e: 3.6 }, { z: .38, t: -.008, b: -.126, w: .041, e: 3.6 }], 22), M.steel));
    const tg = add(new THREE.Mesh(new THREE.TorusGeometry(.021, .0026, 8, 24, Math.PI), M.steel)); tg.rotation.set(Math.PI, Math.PI / 2, 0); tg.position.set(0, -.038, .035); tg.scale.z = 2.2;
    const tr = box(.004, .022, .005, M.steelW, 0, -.046, .04); tr.rotation.x = .35; box(.021, .005, .095, M.steel, 0, -.034, -.04); screw(0, -.037, -.082); screw(0, -.037, .062);
    disc(.0058, .0245, -.004, -.065, M.steel, .0016); disc(.0058, -.0245, -.004, -.065, M.steel, .0016);
    // correa lateral (a la izquierda, por la ranura de la culata)
  },
  // ---------------- Escopeta de caza de dos cañones (yuxtapuestos), báscula con perros a la vista ----------------
  escopeta(M, T) { const { g, P, add, box, tube, screw, disc, loft } = T;
    add(new THREE.Mesh(loft([
      { z: .385, t: -.01, b: -.13, w: .04, e: 3.4 }, { z: .37, t: -.002, b: -.128, w: .044, e: 3.2 }, { z: .3, t: .004, b: -.106, w: .044 }, { z: .22, t: .008, b: -.085, w: .042 }, { z: .16, t: .008, b: -.07, w: .039 },
      { z: .115, t: .006, b: -.06, w: .034, e: 2.2 }, { z: .085, t: .008, b: -.05, w: .034, e: 2.2 }, { z: .06, t: .02, b: -.032, w: .04 }, { z: .042, t: .03, b: -.02, w: .044, e: 3 }]), M.wood));
    // báscula (cajón) con placas laterales y bisagra
    add(new THREE.Mesh(loft([{ z: .045, t: .042, b: -.016, w: .046, e: 4 }, { z: .0, t: .044, b: -.018, w: .048, e: 4 }, { z: -.036, t: .036, b: -.012, w: .046, e: 3.5 }, { z: -.048, t: .024, b: -.004, w: .04, e: 3 }]), M.steelW));
    for (const s of [-1, 1]) { disc(.009, s * .0242, .02, .01, M.steel, .0016); screw(s * .0245, .0, -.02, 'x'); }
    tube(.005, .005, .052, M.steel, 0, .0, -.04).rotation.set(0, Math.PI / 2, 0);
    const lv = new THREE.Group(); lv.position.set(0, .046, .045); g.add(lv); P.lever = lv; { const l = box(.008, .006, .036, M.steel, .004, 0, .018, lv); l.rotation.y = -.25; } // palanca de apertura
    for (const s of [-1, 1]) { const h = new THREE.Group(); h.position.set(s * .013, .04, .04); g.add(h); P['ham' + (s < 0 ? 'L' : 'R')] = h; const hb = box(.006, .024, .008, M.steel, 0, .012, 0, h); hb.rotation.x = -.35; box(.008, .004, .012, M.steel, 0, .025, .006, h); }
    for (const z of [.012, .03]) { const tr = box(.0036, .02, .0045, M.steelW, 0, -.024, z); tr.rotation.x = .3; }
    const tg = add(new THREE.Mesh(new THREE.TorusGeometry(.022, .0026, 8, 24, Math.PI), M.steel)); tg.rotation.set(Math.PI, Math.PI / 2, 0); tg.position.set(0, -.016, .022); tg.scale.z = 1.7;
    add(new THREE.Mesh(loft([{ z: .385, t: -.008, b: -.132, w: .042, e: 3.4 }, { z: .391, t: -.01, b: -.13, w: .04, e: 3.4 }], 22), M.dark));
    // cañones: giran en la bisagra (P.barrels), con la carrillera de madera debajo
    const br = new THREE.Group(); br.position.set(0, .0, -.04); g.add(br); P.barrels = br;
    const tb = new THREE.Group(); br.add(tb); P.tubes = tb; // cañones y banda: se recortan escalando este grupo (accesorio del armero)
    for (const s of [-1, 1]) { tube(.0118, .0108, .7, M.steel, s * .0118, .03, -.35, tb); tube(.0092, .0092, .004, M.dark, s * .0118, .03, -.7015, tb, 16); tube(.0096, .0096, .003, M.dark, s * .0118, .03, -.0005, br, 16); }
    box(.012, .004, .68, M.steel, 0, .0435, -.35, tb); box(.01, .006, .66, M.steel, 0, .018, -.36, tb); add(new THREE.Mesh(new THREE.SphereGeometry(.0026, 10, 8), M.brass), tb).position.set(0, .0475, -.693);
    add(new THREE.Mesh(loft([{ z: -.03, t: .02, b: -.008, w: .044, e: 3 }, { z: -.06, t: .02, b: -.016, w: .047, e: 3 }, { z: -.24, t: .02, b: -.014, w: .046, e: 3 }, { z: -.27, t: .02, b: -.004, w: .04, e: 3 }]), M.wood), br);
    // cartuchos en las recámaras (se ven al abrir)
    for (const s of [-1, 1]) { const sh = tube(.0088, .0088, .004, M.brass, s * .0118, .03, .0, br, 14); sh.userData.shell = s; P['ch' + (s < 0 ? 'L' : 'R')] = sh; }
  },
  // ---------------- Fusil ametrallador sanmarcialense: cargador de petaca abajo, bípode plegable, asa ----------------
  ametrallador(M, T) { const { g, P, add, box, tube, screw, disc, loft } = T;
    // cajón rectangular, tapa, ventana de expulsión, palanca de montar a la derecha
    add(new THREE.Mesh(loft([{ z: .11, t: .058, b: .0, w: .044, e: 6 }, { z: -.04, t: .06, b: -.002, w: .046, e: 6 }, { z: -.13, t: .056, b: .004, w: .044, e: 6 }, { z: -.14, t: .05, b: .01, w: .04, e: 5 }]), M.steel));
    box(.004, .016, .05, M.dark, .0232, .04, -.03).castShadow = false; box(.003, .006, .1, M.dark, .0232, .022, .03).castShadow = false;
    const ch = new THREE.Group(); ch.position.set(.026, .022, .02); g.add(ch); P.bolt = ch; { const k = add(new THREE.Mesh(new THREE.CylinderGeometry(.005, .006, .026, 12), M.steelW), ch); k.rotation.z = Math.PI / 2; k.position.x = .01; }
    box(.03, .006, .045, M.steelW, 0, .062, .03); // tapa
    // cañón con aletas, cilindro de gases, apagallamas, punto con orejas
    tube(.0122, .0122, .26, M.steel, 0, .03, -.27); for (let i = 0; i < 12; i++) tube(.0165, .0165, .003, M.steel, 0, .03, -.165 - i * .014);
    tube(.0105, .0095, .24, M.steel, 0, .03, -.52); tube(.006, .006, .3, M.steel, 0, .006, -.37); tube(.0135, .0125, .04, M.steel, 0, .03, -.66); tube(.0052, .0052, .004, M.dark, 0, .03, -.6805, null, 12);
    for (let k = 0; k < 4; k++) box(.002, .03, .02, M.dark, 0, .03, -.668).rotation.z = k * Math.PI / 4;
    box(.0024, .028, .006, M.steel, 0, .056, -.62); box(.014, .008, .02, M.steel, 0, .044, -.62); for (const x of [-.008, .008]) box(.0018, .024, .014, M.steel, x, .058, -.62);
    // guardamanos de madera, asa de transporte
    add(new THREE.Mesh(loft([{ z: -.145, t: .036, b: -.022, w: .05, e: 3 }, { z: -.17, t: .04, b: -.026, w: .054, e: 3 }, { z: -.34, t: .036, b: -.022, w: .05, e: 3 }, { z: -.36, t: .03, b: -.014, w: .044, e: 3 }]), M.wood));
    { const hg = new THREE.Group(); hg.position.set(-.024, .034, -.15); hg.rotation.z = Math.PI / 2; g.add(hg); const h = add(new THREE.Mesh(new THREE.TorusGeometry(.04, .0045, 8, 20, Math.PI), M.steel), hg); h.rotation.set(0, Math.PI / 2, 0); h.scale.set(1, .5, 1); box(.008, .01, .01, M.steel, -.022, .034, -.11); box(.008, .01, .01, M.steel, -.022, .034, -.19); } /* asa plegada al costado izquierdo: no tapa la linea de mira */
    // diópter atrás
    { const r = add(new THREE.Mesh(new THREE.TorusGeometry(.0056, .0022, 8, 18), M.steel)); r.position.set(0, .0745, .09); box(.008, .016, .008, M.steel, 0, .064, .09); for (const x of [-.008, .008]) box(.0018, .02, .016, M.steel, x, .07, .09); }
    // empuñadura (misma caída que la del subfusil), guardamonte, gatillo, selector
    add(new THREE.Mesh((() => { const st = []; for (let i = 0; i <= 8; i++) { const u = i / 8; st.push({ z: .002 + u * .112, t: .05 + u * .034 + .016, b: .05 + u * .034 - .022 + u * .004, w: .03 + Math.sin(u * 3.1) * .006, e: 2.4 }); } const gg = loft(st, 20, 5); gg.rotateX(Math.PI / 2); return gg; })(), M.wood));
    const tg = add(new THREE.Mesh(new THREE.TorusGeometry(.02, .0026, 8, 24, Math.PI), M.steel)); tg.rotation.set(Math.PI, Math.PI / 2, 0); tg.position.set(0, 0, -.005); tg.scale.z = 1.8;
    const tr = box(.004, .02, .005, M.steelW, 0, -.008, 0); tr.rotation.x = .3; disc(.0045, -.0232, .012, .05, M.steelW, .003);
    // culata de madera en línea con el cañón
    add(new THREE.Mesh(loft([{ z: .105, t: .046, b: .006, w: .04, e: 3 }, { z: .14, t: .042, b: -.024, w: .042 }, { z: .3, t: .04, b: -.076, w: .044 }, { z: .41, t: .04, b: -.096, w: .044, e: 3.4 }, { z: .42, t: .039, b: -.094, w: .042, e: 3.4 }]), M.wood));
    add(new THREE.Mesh(loft([{ z: .42, t: .04, b: -.096, w: .045, e: 3.4 }, { z: .428, t: .038, b: -.094, w: .043, e: 3.4 }], 22), M.steel)); screw(.0222, .0, .2, 'x');
    // cargador de petaca (20) bajo el cajón
    const mg = new THREE.Group(); mg.position.set(0, .0, -.075); g.add(mg); P.mag = mg; mg.userData.p0 = mg.position.clone(); mg.userData.r0 = mg.rotation.clone();
    { const b = box(.026, .12, .07, M.steel, 0, -.06, 0, mg); b.rotation.x = .08; box(.03, .008, .074, M.steel, 0, -.122, .005, mg); for (const z of [-.02, .02]) box(.0272, .09, .004, M.steelW, 0, -.06, z, mg); box(.022, .01, .06, M.brass, 0, .002, -.004, mg); }
    box(.03, .012, .08, M.steel, 0, .002, -.075); // brocal
    // bípode: patas plegadas bajo el cañón; P.bipod.userData.set(0..1) las abre
    const bp = new THREE.Group(); bp.position.set(0, .016, -.5); g.add(bp); P.bipod = bp; tube(.009, .009, .02, M.steel, 0, 0, 0, bp);
    const legs = []; for (const s of [-1, 1]) { const l = new THREE.Group(); l.position.set(s * .008, -.004, 0); bp.add(l); const c = tube(.0042, .0042, .3, M.steel, 0, 0, .15, l, 10); box(.012, .004, .02, M.steel, 0, 0, .3, l); legs.push([l, s]); }
    bp.userData.set = k => { for (const [l, s] of legs) l.rotation.set(k * 1.25, 0, s * k * .32); }; bp.userData.set(0);
  },
};

// Eje del arma: cañón hacia -Z, arriba +Y. Origen en la zona del gatillo.
const cyl = (r1, r2, len, m, seg = 20) => { const g = new THREE.CylinderGeometry(r1, r2, len, seg); g.rotateX(Math.PI / 2); return new THREE.Mesh(g, m); };  // eje Z, r1 hacia -Z... (top=+Y -> -Z)
function profile(pts, depth, bevel) {
  const s = new THREE.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * .45, bevelSegments: 4, curveSegments: 8 });
  g.translate(0, 0, -(depth - bevel * 2) / 2); g.rotateY(Math.PI / 2); // u(x) -> -z ; grosor -> x
  // UV sencillas a lo largo
  const p = g.attributes.position, uv = g.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, -p.getZ(i) * 1.1, p.getY(i) * 2.2 + p.getX(i) * 2.2); return g;
}
// Sólido por secciones: estaciones {z, t(op), b(ottom), w, e(xponente de superelipse)} -> malla redondeada
function loft(st, seg = 22, uvS = 1.4) { seg = sg(seg, 8);
  const pos = [], uv = [], idx = [], N = st.length;
  for (let i = 0; i < N; i++) { const s = st[i], cy = (s.t + s.b) / 2, hy = (s.t - s.b) / 2, e = 2 / (s.e || 2.6);
    for (let k = 0; k <= seg; k++) { const a = k / seg * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a); pos.push(Math.sign(c) * Math.pow(Math.abs(c), e) * s.w / 2, cy + Math.sign(sn) * Math.pow(Math.abs(sn), e) * hy, s.z); uv.push(-s.z * uvS, k / seg * .5); } }
  for (let i = 0; i < N - 1; i++) for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k, b = a + seg + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  for (const [i, flip] of [[0, false], [N - 1, true]]) { const s = st[i], c0 = pos.length / 3; pos.push(0, (s.t + s.b) / 2, s.z); uv.push(-s.z * uvS, .25); for (let k = 0; k < seg; k++) { const a = i * (seg + 1) + k; flip ? idx.push(c0, a + 1, a) : idx.push(c0, a, a + 1); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
function strap(pts, w, th, m) { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const g = new THREE.TubeGeometry(c, 40, th, 6); const me = new THREE.Mesh(g, m); me.scale.x = w / (th * 2); return me; }
const GUNS = {
  ferran: { name: 'Ferrán M-1912', cal: '7 mm', mag: 5, reserve: 60, v: 760, zero: 100, rpm: 0, bolt: true, auto: false, recoil: [3.2, .9], kick: .06, spread: .0006, hipSpread: .022, adsFov: 52, reload: 2.6, sound: 'rifle',
    hip: [.13, -.14, -.38], sightY: .0645, adsZ: -.42, rh: [0, -.04, .085], lh: [0, -.03, -.24], muzzle: -.73, eject: [.02, .035, .02], slot: 1,
    type: 'bolt', rl: 'clip', dmg: { head: 100, torso: 100, arm: 50 }, power: 2.2 },
  subfusil: { name: 'Subfusil atlántico', cal: '9 mm', mag: 32, reserve: 192, v: 380, zero: 50, rpm: 540, bolt: false, auto: true, recoil: [.75, .5], kick: .018, spread: .004, hipSpread: .03, adsFov: 60, reload: 2.2, sound: 'smg',
    hip: [.12, -.145, -.3], sightY: .072, adsZ: -.42, rh: [0, -.065, .07], lh: [0, .002, -.2], muzzle: -.39, eject: [.022, .03, -.07], slot: 1,
    type: 'auto', rl: 'side', dmg: { head: 100, torso: 34, arm: 20 }, power: 1.1, heat: .012, cool: .3, magOut: [-.11, 0, 0], magDrop: [-.05, -.34, .14], magRot: [.35, 0, -.5], charge: [.075, .025, .02] },
  ...GUNS2,
};
function buildGun(id, M) {
  const g = new THREE.Group(), P = {}; const add = (m, par = g) => { m.castShadow = true; m.receiveShadow = true; par.add(m); return m; };
  const box = (w, h, d, m, x, y, z, par) => { const b = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m), par || g); b.position.set(x, y, z); return b; };
  const tube = (r1, r2, len, m, x, y, z, par, seg = 24) => { const c = add(cyl(r1, r2, len, m, seg), par || g); c.position.set(x, y, z); return c; };
  const screw = (x, y, z, ax) => { const c = add(new THREE.Mesh(new THREE.CylinderGeometry(.0032, .0032, .002, 10), M.steelW)); c.position.set(x, y, z); if (ax === 'x') c.rotation.z = Math.PI / 2; return c; };
  const disc = (r, x, y, z, m = M.steel, t = .002) => { const c = add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, t, 16), m)); c.position.set(x, y, z); c.rotation.z = Math.PI / 2; return c; };
  // placa de alza con muesca en V (w ancho, h alto, v semiancho de la muesca, d fondo)
  const notch = (w, h, v, d, m, x, y, z) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, h * .7); sh.lineTo(w / 2 - .002, h); sh.lineTo(v, h); sh.lineTo(0, h - d); sh.lineTo(-v, h); sh.lineTo(-w / 2 + .002, h); sh.lineTo(-w / 2, h * .7); sh.closePath(); const p = add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .003, bevelEnabled: false }), m)); p.position.set(x, y, z); return p; };
  if (id === 'ferran') {
    // caja de nogal redondeada: culata, garganta, caña
    add(new THREE.Mesh(loft([
      { z: .388, t: -.004, b: -.118, w: .040, e: 3.4 }, { z: .375, t: .003, b: -.117, w: .045, e: 3.2 }, { z: .30, t: .008, b: -.098, w: .046 }, { z: .22, t: .010, b: -.078, w: .044 }, { z: .16, t: .009, b: -.062, w: .040 },
      { z: .115, t: .005, b: -.050, w: .035, e: 2.2 }, { z: .08, t: .004, b: -.042, w: .034, e: 2.2 }, { z: .05, t: .012, b: -.036, w: .038 }, { z: .02, t: .020, b: -.032, w: .045, e: 3 }, { z: -.05, t: .022, b: -.030, w: .048, e: 3 },
      { z: -.13, t: .023, b: -.027, w: .046, e: 3 }, { z: -.2, t: .024, b: -.022, w: .042 }, { z: -.33, t: .024, b: -.018, w: .039 }, { z: -.485, t: .024, b: -.013, w: .036 }, { z: -.5, t: .022, b: -.008, w: .032 }]), M.wood));
    // guardamanos superior
    add(new THREE.Mesh(loft([{ z: -.135, t: .046, b: .02, w: .034 }, { z: -.15, t: .05, b: .02, w: .038 }, { z: -.33, t: .048, b: .02, w: .036 }, { z: -.478, t: .045, b: .02, w: .033 }]), M.wood));
    // cañón escalonado, corona
    tube(.0105, .0092, .2, M.steel, 0, .03, -.23); tube(.0092, .0076, .42, M.steel, 0, .03, -.52); tube(.0045, .0045, .004, M.dark, 0, .03, -.7305, null, 12);
    // cajón de mecanismos: anillo, puente, guía
    tube(.0172, .0172, .05, M.steel, 0, .03, -.105); tube(.0155, .0155, .11, M.steel, 0, .03, -.03); tube(.0172, .0172, .03, M.steel, 0, .03, .05);
    box(.012, .004, .09, M.dark, .006, .0445, -.02).rotation.z = -.5; // ventana de carga
    for (const x of [-.0075, .0075]) box(.006, .009, .026, M.steel, x, .0485, .05); box(.021, .004, .008, M.steel, 0, .046, .061); // puente con guía de peine
    tube(.0182, .0182, .007, M.steel, 0, .03, -.1265); tube(.0176, .0176, .004, M.steel, 0, .03, .067); // collar del anillo y remate del puente
    for (const z of [-.112, -.098]) { const h = add(new THREE.Mesh(new THREE.CylinderGeometry(.0022, .0022, .002, 10), M.dark)); h.position.set(-.0122, .0422, z); h.rotation.z = Math.PI / 4; h.castShadow = false; } // orificios de gases
    box(.003, .011, .05, M.dark, -.0152, .036, -.02).castShadow = false; // rebaje del pulgar
    box(.0045, .006, .03, M.steel, -.0175, .034, .05); // retenida del cerrojo
    // cerrojo con manilla acodada, seguro de aleta y extractor
    const bolt = new THREE.Group(); bolt.position.set(0, .03, 0); g.add(bolt); P.bolt = bolt;
    tube(.0096, .0096, .17, M.steelW, 0, 0, .03, bolt); box(.0025, .004, .1, M.steel, .0085, .004, .0, bolt);
    const hd = new THREE.Group(); hd.position.z = .085; bolt.add(hd);
    const stem = add(new THREE.Mesh(new THREE.CylinderGeometry(.0042, .005, .052, 12), M.steelW), hd); stem.rotation.z = Math.PI / 2 + .55; stem.position.set(.031, -.013, 0);
    add(new THREE.Mesh(new THREE.SphereGeometry(.0108, 18, 14), M.steelW), hd).position.set(.055, -.028, 0);
    tube(.0118, .0125, .034, M.steel, 0, 0, .128, bolt); tube(.006, .006, .012, M.steelW, 0, 0, .151, bolt); box(.004, .016, .02, M.steel, 0, .016, .13, bolt); { const w = box(.013, .0035, .016, M.steel, .0065, .0225, .13, bolt); w.rotation.z = .25; } tube(.0132, .0132, .005, M.steel, 0, 0, .112, bolt); tube(.0078, .0078, .004, M.steel, 0, 0, .1475, bolt);
    // abrazaderas con anilla, bocacha con tetón de bayoneta, baqueta
    for (const z of [-.33, -.485]) { const b = add(new THREE.Mesh(loft([{ z: z + .008, t: .05, b: -.02, w: .041 }, { z: z - .008, t: .05, b: -.02, w: .041 }], 22), M.steel)); screw(.0212, .012, z, 'x'); }
    box(.01, .012, .03, M.steel, 0, .008, -.5); tube(.0028, .0028, .2, M.steelW, 0, .004, -.59, null, 10); tube(.0036, .0036, .006, M.steelW, 0, .004, -.692, null, 10);
    for (const [y, z] of [[-.026, -.33], [-.102, .3]]) { const r = add(new THREE.Mesh(new THREE.TorusGeometry(.011, .0018, 8, 16), M.steel)); r.position.set(0, y - .008, z); r.rotation.y = Math.PI / 2; }
    // cantonera, guardamonte, gatillo, tapa del depósito, tornillos
    add(new THREE.Mesh(loft([{ z: .388, t: -.002, b: -.12, w: .042, e: 3.4 }, { z: .394, t: -.004, b: -.118, w: .04, e: 3.4 }], 22), M.steel));
    const tg = add(new THREE.Mesh(new THREE.TorusGeometry(.021, .0026, 8, 24, Math.PI), M.steel)); tg.rotation.set(Math.PI, Math.PI / 2, 0); tg.position.set(0, -.037, .035); tg.scale.z = 2.2;
    const tr = box(.004, .022, .005, M.steelW, 0, -.045, .04); tr.rotation.x = .35;
    box(.021, .005, .095, M.steel, 0, -.0325, -.04); screw(0, -.036, -.082); screw(0, -.036, .062);
    // alza tangente con corredera y punto con orejetas
    box(.02, .008, .03, M.steel, 0, .05, -.165); const leaf = box(.012, .0025, .06, M.steel, 0, .058, -.19); leaf.rotation.x = -.06;
    notch(.021, .0095, .0026, .0046, M.steel, 0, .0575, -.1665);
    for (const x of [-.0088, .0088]) { box(.0026, .0065, .058, M.steel, x, .0535, -.192); disc(.0034, x * 1.3, .0575, -.2, M.steelW, .003); }
    box(.016, .006, .008, M.steelW, 0, .0575, -.2); for (let i = 0; i < 5; i++) box(.006, .0006, .0012, M.steelW, .002, .0596, -.176 - i * .009).castShadow = false; // corredera y graduación
    box(.0022, .026, .006, M.steel, 0, .0525, -.705); box(.013, .006, .018, M.steel, 0, .0395, -.705); tube(.0098, .0098, .024, M.steel, 0, .03, -.705);
    for (const x of [-.0075, .0075]) { const e = box(.0018, .02, .014, M.steel, x, .05, -.705); e.rotation.z = -Math.sign(x) * .2; }
    // pasador de retroceso, disco de la culata, acanaladuras de la caña y muelle de la abrazadera
    for (const s of [-1, 1]) { disc(.0058, s * .0242, -.004, -.065, M.steel, .0016); disc(.0016, s * .0246, -.004, -.065, M.dark, .0016); const f = box(.0016, .0055, .13, M.dark, s * .0204, .006, -.245); f.rotation.y = s * .011; f.castShadow = false; }
    disc(.0095, .0232, -.05, .3, M.steelW, .0016); disc(.0028, .0236, -.05, .3, M.dark, .0016);
    box(.0016, .0035, .07, M.steel, .0196, .004, -.375); box(.004, .003, .012, M.steelW, 0, -.0355, -.085);
    // correa de cuero con comba
    add(strap([[0, -.036, -.33], [0, -.06, -.2], [0, -.085, 0], [0, -.105, .16], [0, -.112, .3]], .024, .0016, M.leather));
  } else if (id === 'subfusil') {
    // tubo del cajón, tapa moleteada, tuerca, cañón y camisa perforada
    tube(.019, .019, .36, M.steel, 0, .03, -.03); tube(.0205, .0205, .022, M.steelW, 0, .03, .158); tube(.0215, .0215, .016, M.steel, 0, .03, -.205);
    tube(.0078, .0078, .2, M.steel, 0, .03, -.29); tube(.004, .004, .004, M.dark, 0, .03, -.3905, null, 12); tube(.0165, .0165, .13, M.steel, 0, .03, -.275);
    for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) { const h = add(new THREE.Mesh(new THREE.CylinderGeometry(.0042, .0042, .002, 10), M.dark)); const a = k * Math.PI / 3 + (i % 2) * .5; h.position.set(Math.cos(a) * .0166, .03 + Math.sin(a) * .0166, -.228 - i * .028); h.lookAt(0, .03, h.position.z); h.rotateX(Math.PI / 2); h.castShadow = false; }
    for (const z of [.149, .158, .167]) tube(.0212, .0212, .0025, M.steel, 0, .03, z); tube(.012, .012, .004, M.steel, 0, .03, .171); // tapa moleteada con pestillo
    tube(.0198, .0198, .003, M.steelW, 0, .03, -.195); tube(.0172, .0172, .004, M.steelW, 0, .03, -.3395); tube(.0098, .0098, .012, M.steel, 0, .03, -.384); // tuerca, boca de la camisa y bocacha
    box(.003, .013, .011, M.dark, .0186, .037, .096).castShadow = false; // muesca de seguro
    for (const x of [-.0095, .0095]) box(.0018, .022, .012, M.steel, x, .064, .1); box(.021, .004, .014, M.steel, 0, .0515, .1); // orejas del alza
    disc(.004, .0128, .008, .045, M.steelW, .003); box(.0016, .004, .014, M.steelW, .0128, .008, .056); // selector
    box(.052, .003, .05, M.steelW, -.036, .049, -.14); box(.052, .003, .05, M.steelW, -.036, .011, -.14); box(.004, .04, .052, M.steel, -.062, .03, -.14); // refuerzos del brocal
    box(.05, .036, .048, M.steel, -.036, .03, -.14); box(.012, .01, .014, M.steelW, -.05, .051, -.14);
    const mag = new THREE.Group(); mag.position.set(-.15, .03, -.14); g.add(mag); P.mag = mag;
    box(.2, .022, .036, M.steelW, 0, 0, 0, mag); for (const z of [-.019, .019]) box(.17, .006, .002, M.steel, .005, 0, z, mag); box(.006, .026, .04, M.steel, -.1, 0, 0, mag);
    // ventana de expulsión, ranura y palanca de montar
    box(.004, .016, .05, M.dark, .0182, .034, -.1).castShadow = false; box(.003, .006, .12, M.dark, .0186, .03, .04).castShadow = false;
    const ch = new THREE.Group(); ch.position.set(.02, .03, -.02); g.add(ch); P.bolt = ch;
    const kn = add(new THREE.Mesh(new THREE.CylinderGeometry(.005, .006, .03, 12), M.steelW), ch); kn.rotation.z = Math.PI / 2; kn.position.x = .012;
    // caja del disparador, empuñadura de madera redondeada, guardamonte
    box(.024, .016, .15, M.steel, 0, .006, .02); screw(.0122, .006, .07, 'x'); screw(.0122, .006, -.03, 'x');
    const gr = add(new THREE.Mesh(loft([{ z: .112, t: -.0, b: -.004, w: .026 }, { z: .108, t: 0, b: -.03, w: .03 }, { z: .1, t: 0, b: -.1, w: .032 }, { z: .09, t: 0, b: -.118, w: .03 }].map((s, i, a) => s), 20), M.wood));
    gr.geometry.dispose(); gr.geometry = (() => { // empuñadura: sección que baja inclinada
      const st = []; for (let i = 0; i <= 8; i++) { const u = i / 8, y = .002 + u * .112; st.push({ z: y, t: .05 + u * .034 + .016, b: .05 + u * .034 - .022 + u * .004, w: .028 + Math.sin(u * 3.1) * .006, e: 2.4 }); }
      const gg = loft(st, 20, 5); gg.rotateX(Math.PI / 2); return gg; })();
    const tg = add(new THREE.Mesh(new THREE.TorusGeometry(.02, .0026, 8, 24, Math.PI), M.steel)); tg.rotation.set(Math.PI, Math.PI / 2, 0); tg.position.set(0, 0, -.005); tg.scale.z = 1.8;
    const tr = box(.004, .02, .005, M.steelW, 0, -.008, 0); tr.rotation.x = .3;
    // culata de esqueleto con cantonera
    tube(.006, .006, .25, M.steel, 0, .03, .275, null, 12); const r2 = tube(.005, .005, .21, M.steel, 0, -.014, .31, null, 12); r2.rotation.x = -.42;
    add(new THREE.Mesh(loft([{ z: .398, t: .046, b: -.07, w: .03, e: 3 }, { z: .406, t: .044, b: -.068, w: .028, e: 3 }], 18), M.steel));
    // miras: diópter con orejas y punto protegido
    const rs = add(new THREE.Mesh(new THREE.TorusGeometry(.0055, .0022, 8, 18), M.steel)); rs.position.set(0, .072, .1); box(.008, .02, .008, M.steel, 0, .058, .1);
    box(.0016, .026, .005, M.steel, 0, .06, -.255); box(.012, .006, .014, M.steel, 0, .048, -.255); for (const x of [-.007, .007]) box(.0016, .02, .012, M.steel, x, .058, -.255);
    // anillas de correa
    for (const z of [-.2, .16]) { const r = add(new THREE.Mesh(new THREE.TorusGeometry(.009, .0016, 8, 14), M.steel)); r.position.set(-.022, .02, z); r.rotation.y = Math.PI / 2; }
  } else if (EXTRA[id]) EXTRA[id](M, { g, P, add, box, tube, screw, disc, notch, loft, strap, cyl });
  if (!P.bolt) { P.bolt = new THREE.Group(); g.add(P.bolt); } // armas sin cerrojo visible (escopeta): pieza vacía para no ramificar el juego
  g.userData.parts = P; return g;
}

return { GUNS, buildGun, setLOD(v) { LOD = v; } };
})(THREE_L);
})();
