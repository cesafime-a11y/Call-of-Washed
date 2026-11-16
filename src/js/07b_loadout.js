// ---- 07b_loadout.js ----
// =====================================================================
// EQUIPO — clases, accesorios y ventajas → estadísticas finales del arma;
// PROGRESO — experiencia, 50 niveles, rangos e insignias, desbloqueos,
// maestría de armas y código de respaldo
// =====================================================================
const ATT_SLOTS = CONFIG.ATTACH.order;
// aumento por mira y familia de arma
const ZOOM_FAMILY = {
  rifle: { iron: 1.3, x2: 2.5, x4: 3.6 }, smg: { iron: 1.18 }, shotgun: { iron: 1.12 },
  sniper: { scope: 4.0, x8: 8.0 }, mk2: { scope: 2.5, x8: 8.0 }, lmg: { iron: 1.3, x2: 2.3 },
};
const ZOOM_OF = { rifle: 'rifle', dmr: 'rifle', battle: 'rifle', smg: 'smg', tsmg: 'smg', shotgun: 'shotgun', dbl: 'shotgun', sniper: 'sniper', mk2: 'mk2', lmg: 'lmg', mg2: 'lmg' };
const OPTIC_ZOOM = new Proxy({}, { get: (_, id) => ZOOM_FAMILY[ZOOM_OF[id]] });
function slotsOf(id) { return CONFIG.ATTACH.slots[id] || null; }
function defaultAtt(id) {
  const s = slotsOf(id); if (!s) return {};
  const a = {}; for (const k of ATT_SLOTS) a[k] = s[k][0];
  return a;
}
// valida cada ranura y respeta el límite de accesorios (los de fábrica no cuentan)
function sanitizeAtt(id, att) {
  const s = slotsOf(id); if (!s) return {};
  const out = {}; let used = 0;
  for (const k of ATT_SLOTS) {
    let v = att && s[k].includes(att[k]) ? att[k] : s[k][0];
    if (v !== s[k][0]) { if (used >= CONFIG.ATTACH.pick) v = s[k][0]; else used++; }
    out[k] = v;
  }
  if (att && att.skin && att.skin !== 'none' && CONFIG.UNLOCK.wskin[att.skin] != null) out.skin = att.skin;
  return out;
}
function attCount(id, att) { const s = slotsOf(id); if (!s || !att) return 0; return ATT_SLOTS.filter((k) => att[k] && att[k] !== s[k][0]).length; }
function attKey(att) { return att && att.optic ? ATT_SLOTS.map((k) => att[k]).join('.') + (att.skin ? ':' + att.skin : '') : ''; }
function attFromKey(id, key) {
  if (!key) return defaultAtt(id);
  const [main, skin] = String(key).split(':'), p = main.split('.'); const a = {};
  ATT_SLOTS.forEach((k, i) => { a[k] = p[i]; });
  if (skin) a.skin = skin;
  return sanitizeAtt(id, a);
}

// efecto de cada accesorio sobre las estadísticas (multiplicadores; id = arma)
const ATT_FX = {
  // visor de tubo: al apuntar se mira por el ocular (pantalla de mira como los fusiles de tirador), no a través del tubo en 3D
  x2: (W) => { W.adsTime *= 1.22; W.ads *= 0.7; W.scope = true; },
  x4: (W) => { W.adsTime *= 1.42; W.ads *= 0.5; W.scope = true; W.moveMul = (W.moveMul || 1) * 0.98; W.fovNarrow = true; },
  x8: (W) => { W.adsTime *= 1.2; W.scope = true; W.moveMul = (W.moveMul || 1) * 0.98; W.fovNarrow = true; W.swayMul = 1.25; },
  comp: (W) => { W.recoilV *= 0.78; W.recoilH *= 0.9; W.flash = (W.flash || 1) * 1.2; },
  supp: (W) => { W.suppressed = true; W.flash = (W.flash || 1) * 0.15; W.fall0 *= 0.85; W.fall1 *= 0.85; W.sound = 'supp'; W.adsTime *= 1.05; W.moveMul = (W.moveMul || 1) * 0.98; },
  fhider: (W) => { W.flash = (W.flash || 1) * 0.1; W.recoilV *= 0.95; },
  brake: (W) => { W.recoilH *= 0.62; W.recoilV *= 0.95; W.flash = (W.flash || 1) * 1.3; W.loud = true; },
  choke: (W) => { W.hip *= 0.72; W.ads *= 0.72; W.fall0 *= 1.25; W.fall1 *= 1.25; },
  bayo: (W) => { W.bayonet = true; W.adsTime *= 1.05; W.moveMul = (W.moveMul || 1) * 0.99; },
  long: (W) => { W.fall0 *= 1.18; W.fall1 *= 1.18; W.range *= 1.1; W.ads *= 0.85; W.adsTime *= 1.07; W.moveMul = (W.moveMul || 1) * 0.985; if (W.mv) W.mv *= 1.04; },
  short: (W) => { W.adsTime *= 0.88; W.moveMul = (W.moveMul || 1) * 1.02; W.fall0 *= 0.85; W.fall1 *= 0.85; W.ads *= 1.12; if (W.mv) W.mv *= 0.95; },
  heavy: (W) => { W.recoilV *= 0.9; W.recoilH *= 0.9; W.adsTime *= 1.08; W.moveMul = (W.moveMul || 1) * 0.98; },
  vgrip: (W) => { W.recoilH *= 0.6; W.recoilV *= 0.92; W.adsTime *= 1.05; },
  sling: (W) => { W.ads *= 0.82; W.recoilV *= 0.94; W.adsTime *= 1.03; W.steady = true; },
  bipod: (W) => { W.bipod = true; W.adsTime *= 1.06; },
  ext: (W, B, id) => {
    W.mag = B.extMag != null ? B.mag + B.extMag : Math.round(B.mag * 1.5);
    W.reload *= 1.12; W.reloadTac *= 1.12; W.adsTime *= 1.08; W.moveMul = (W.moveMul || 1) * 0.98;
  },
  fast: (W) => { W.reload *= 0.78; W.reloadTac *= 0.78; },
  drum: (W, B) => { W.mag = B.drumMag || Math.round(B.mag * 1.9); W.reload *= 1.25; W.reloadTac *= 1.25; W.adsTime *= 1.1; W.moveMul = (W.moveMul || 1) * 0.97; },
  skel: (W) => { W.adsTime *= 0.9; W.moveMul = (W.moveMul || 1) * 1.02; W.recoilV *= 1.06; W.recoilH *= 1.06; },
  pad: (W) => { W.recoilV *= 0.88; W.recoilH *= 0.88; W.adsTime *= 1.06; },
  ap: (W) => { W.pen = (W.pen || 0.1) * 1.8 + 0.08; W.damage *= 0.94; },
  hp: (W) => { W.damage *= 1.08; W.pen = (W.pen || 0.1) * 0.45; W.fall0 *= 0.9; W.fall1 *= 0.9; },
};

// estadísticas del arma con sus accesorios y la ventaja del soldado (en caché)
const _wsCache = new Map();
function weaponStats(id, att, perk) {
  const B = CONFIG.WEAPONS[id]; if (!B) return CONFIG.WEAPONS.rifle;
  const a = slotsOf(id) ? sanitizeAtt(id, att) : {}, key = id + '|' + attKey(a).split(':')[0] + '|' + (perk || '');
  let W = _wsCache.get(key); if (W) return W;
  W = { ...B, att: a, perk: perk || null, id };
  if (slotsOf(id)) {
    const z = ZOOM_FAMILY[ZOOM_OF[id]]; if (z && a.optic && z[a.optic]) W.zoom = z[a.optic];
    for (const k of ATT_SLOTS) { const fx = ATT_FX[a[k]]; if (fx) fx(W, B, id); }
  }
  if (perk === 'ammo' && Number.isFinite(W.reserve)) W.reserve = Math.round(W.reserve * 1.5);
  if (perk === 'fast') { W.reload *= 0.75; W.reloadTac *= 0.75; }
  if (perk === 'steady') { W.recoilV *= 0.8; W.recoilH *= 0.8; W.adsTime *= 0.85; }
  _wsCache.set(key, W);
  return W;
}
// barras 0..1 para el armero (sobre las estadísticas ya con accesorios)
function weaponBars(id, att, perk) {
  const W = weaponStats(id, att, perk), c = (v) => Math.max(0.03, Math.min(1, v));
  const burstMul = W.burst ? 0.8 : 1;
  return {
    dmg: c(W.damage * W.pellets * W.headMul * 0.5 / 105), rate: c(W.fireRate * burstMul / 18), range: c(W.fall1 / 170),
    ctl: c(1 - (W.recoilV * 1.2 + W.recoilH) / 0.06), acc: c(1 - W.ads * 60), mob: c(((W.moveMul || 1) - 0.75) / 0.4 * 0.6 + (1 - W.adsTime / 0.5) * 0.4),
  };
}

// ---------------- rachas elegibles ----------------
function pickStreaks(chosen, level) {
  const un = (id) => (CONFIG.UNLOCK.streak[id] || 99) <= level && CONFIG.STREAKS[id];
  let out = (Array.isArray(chosen) ? chosen : []).filter((id, i, a) => un(id) && a.indexOf(id) === i).slice(0, 3);
  if (!out.length) out = CONFIG.STREAK_ORDER.filter(un).slice(0, 3);
  // ordenadas por las bajas que piden
  return out.sort((x, y) => CONFIG.STREAKS[x].kills - CONFIG.STREAKS[y].kills);
}
function streakKills(f, id) { return Math.max(2, CONFIG.STREAKS[id].kills - (f && f.hasPerk && f.hasPerk('hardline') ? 1 : 0)); }

// acabados que también se ganan por maestría del arma (bajas): brasa 40, dorado 150, cromado 400
const MASTERY_SKIN = { ember: 1, gold: 2, chrome: 3 };
function wskinOk(sk, weapon, level) {
  if (level >= 99) return true;
  return typeof Progress !== 'undefined' && Progress.camoOk(weapon, sk);
}
// clase → equipo completo (la personalizada respeta lo desbloqueado)
function classLoadout(cls, custom, level = 99, extra = null) {
  const C = CONFIG.CLASSES[cls] ? CONFIG.CLASSES[cls] : CONFIG.CLASSES.rifleman;
  if (!CONFIG.CLASSES[cls]) cls = 'rifleman';
  const wskins = (extra && extra.wskins) || {}, streaks = pickStreaks(extra && extra.streaks, level);
  const skinOf = (p, att) => { const sk = wskins[p]; if (sk && sk !== 'none' && wskinOk(sk, p, level)) att.skin = sk; return att; };
  if (cls === 'custom') {
    const c = custom || {};
    const p = CONFIG.PRIMARIES.includes(c.primary) && (CONFIG.UNLOCK.weapon[c.primary] || 1) <= level ? c.primary : 'rifle';
    const att = sanitizeAtt(p, c.att);
    for (const k of ATT_SLOTS) { const it = CONFIG.ATTACH.items[att[k]]; if (it && level < 99 && !Progress.attOk(p, att[k])) att[k] = CONFIG.ATTACH.slots[p][k][0]; }
    let perk = CONFIG.PERKS[c.perk] ? c.perk : 'ammo';
    if (CONFIG.PERKS[perk].lvl > level) perk = 'ammo';
    const sec = CONFIG.SECONDARIES.includes(c.secondary) && (CONFIG.UNLOCK.secondary[c.secondary] || 1) <= level ? c.secondary : 'pistol';
    return { cls, primary: p, secondary: sec, att: skinOf(p, sanitizeAtt(p, att)), perk, frags: C.frags, smokes: C.smokes, streaks };
  }
  return { cls, primary: C.primary, secondary: 'pistol', att: skinOf(C.primary, sanitizeAtt(C.primary, C.att)), perk: C.perk, frags: C.frags, smokes: C.smokes, streaks };
}
const CLASS_FOR_PRIMARY = { rifle: 'rifleman', smg: 'scout', shotgun: 'breacher', mk2: 'marksman', sniper: 'marksman', dmr: 'rifleman', tsmg: 'scout', dbl: 'breacher', battle: 'rifleman', lmg: 'rifleman', mg2: 'rifleman' };
// cinco clases personalizables guardadas (s.slots) y las predeterminadas debajo; s.loadout apunta siempre al equipo de la clase activa
const CUSTOM_SLOTS = 5;
const classKeys = () => { const a = []; for (let i = 0; i < CUSTOM_SLOTS; i++) a.push('custom:' + i); return a.concat(CONFIG.CLASS_ORDER.filter((k) => k !== 'custom')); };
const curClassKey = () => G.settings.cls === 'custom' ? 'custom:' + (G.settings.slot | 0) : G.settings.cls;
function className(k) {
  if (k === 'custom') k = curClassKey();
  if (k.startsWith('custom:')) { const i = +k.slice(7), sl = G.settings.slots && G.settings.slots[i]; return (sl && sl.name) || T('custom_n', { n: i + 1 }); }
  return L(CONFIG.CLASSES[k]);
}
function cleanLoadout(o) {
  const l = { ...DEFAULT_SETTINGS.loadout, ...(o && typeof o === 'object' ? o : {}) };
  if (!CONFIG.PRIMARIES.includes(l.primary)) l.primary = 'rifle';
  l.att = sanitizeAtt(l.primary, l.att);
  if (!CONFIG.SECONDARIES.includes(l.secondary)) l.secondary = 'pistol';
  if (!CONFIG.PERKS[l.perk]) l.perk = 'ammo';
  return { primary: l.primary, secondary: l.secondary, att: l.att, perk: l.perk };
}
function makeSlots(raw, first) {
  const a = Array.isArray(raw) ? raw : [];
  return Array.from({ length: CUSTOM_SLOTS }, (_, i) => ({ name: a[i] && typeof a[i].name === 'string' ? a[i].name.replace(/[<>]/g, '').slice(0, 14) : '', lo: cleanLoadout(a[i] ? a[i].lo : i === 0 ? first : null) }));
}
function linkSlots(st, raw, first) {
  st.slots = makeSlots(raw, first); st.slot = clamp(st.slot | 0, 0, CUSTOM_SLOTS - 1); st.loadout = st.slots[st.slot].lo;
}
function setClass(key) {
  const s = G.settings;
  if (key === 'custom') key = 'custom:' + (s.slot | 0);
  if (key.startsWith('custom:')) { const i = clamp(+key.slice(7) | 0, 0, CUSTOM_SLOTS - 1); s.cls = 'custom'; s.slot = i; s.loadout = s.slots[i].lo; s.primary = s.loadout.primary; }
  else if (CONFIG.CLASSES[key]) s.cls = key;
}
const loFor = (k, lvl, extra) => k.startsWith('custom:') ? classLoadout('custom', G.settings.slots[+k.slice(7)].lo, lvl, extra) : classLoadout(k, null, lvl, extra);
function localLoadout() { const s = G.settings; return classLoadout(s.cls, s.loadout, Progress.level(), { wskins: s.wskins, streaks: s.streaks }); }
// formato corto para la red
function packLoadout(lo) { return lo ? { c: lo.cls, p: lo.primary, s: lo.secondary, a: attKey(lo.att), k: lo.perk, x: (lo.streaks || []).join(',') } : null; }
function unpackLoadout(o) {
  if (!o || typeof o !== 'object') return null;
  const cls = CONFIG.CLASSES[o.c] ? o.c : 'rifleman';
  const streaks = typeof o.x === 'string' ? o.x.split(',').filter((id) => CONFIG.STREAKS[id]) : null;
  const sec = CONFIG.SECONDARIES.includes(o.s) ? o.s : 'pistol';
  const p = CONFIG.PRIMARIES.includes(o.p) ? o.p : 'rifle';
  // la red trae el equipo ya validado por su dueño: aquí no se vuelve a limitar por nivel
  const lo = cls !== 'custom' ? classLoadout(cls) : classLoadout('custom', { primary: p, secondary: sec, att: attFromKey(p, o.a), perk: o.k });
  if (cls !== 'custom') lo.att = attFromKey(lo.primary, o.a) || lo.att;
  if (streaks && streaks.length) lo.streaks = streaks;
  return lo;
}
// aspecto de un bot sin equipo (todos contra todos): piezas de época al azar; 30% con uniforme completo
function botLook(rng, camo, pools) {
  const hs = pools ? pools.helmets : Object.keys(HELMETS), fs = pools ? pools.faces : Object.keys(FACES), vs = pools ? pools.vests : Object.keys(VESTS);
  const c = { camo, helmet: rng.pick(hs.filter((h) => h !== 'none' || rng.next() < 0.3)), face: rng.pick(fs), vest: rng.pick(vs.filter((v) => v !== 'none' && v !== 'coat')), skin: rng.int(0, SKINS.length - 1),
    pack: rng.next() < 0.45 ? rng.pick(Object.keys(PACKS)) : 'none', pads: rng.next() < 0.6 ? 'shin' : 'none', op: null };
  if (rng.next() < 0.3) { const id = rng.pick(Object.keys(OPERATORS).filter((k) => k !== 'grau')), O = OPERATORS[id]; Object.assign(c, O.set, { camo, op: id }); }
  return c;
}
// facciones: cada partida por equipos enfrenta a dos ejércitos de la novela (Sanmarcial contra Varden por defecto)
const facKey = (fac) => (CONFIG.MATCHUPS[fac] ? fac : (CONFIG.MATCHUPS[(G.matchCfg && G.matchCfg.fac)] ? G.matchCfg.fac : (G.settings && CONFIG.MATCHUPS[G.settings.lastFac] ? G.settings.lastFac : 'sv')));
const facId = (t, fac) => { const mu = CONFIG.MATCHUPS[facKey(fac)]; return mu[t === 1 ? 1 : 0]; };
const facOf = (t, fac) => CONFIG.FACTIONS[facId(t, fac)];
const teamName = (t, fac) => L(facOf(t, fac)).toUpperCase();
const matchupName = (k) => { const mu = CONFIG.MATCHUPS[k]; return L(CONFIG.FACTIONS[mu[0]]) + ' — ' + L(CONFIG.FACTIONS[mu[1]]); };
function factionLook(rng, t, fac) {
  const F = facOf(t, fac).look;
  return { camo: F.camo, helmet: rng.pick(F.helmet), face: rng.pick(F.face), vest: rng.pick(F.vest), skin: rng.int(0, SKINS.length - 1), pack: rng.pick(F.pack), pads: F.pads, op: null, fx: F.extra || null };
}
// reparto de clases para los bots: mitad clases, mitad equipos al azar con todo el arsenal
function botLoadout(rng) {
  const r = rng.next();
  if (r < 0.5) return classLoadout(r < 0.2 ? 'rifleman' : r < 0.33 ? 'scout' : r < 0.43 ? 'breacher' : 'marksman');
  const p = rng.pick(CONFIG.PRIMARIES), s = slotsOf(p), att = {};
  for (const k of rng.shuffle ? rng.shuffle(ATT_SLOTS.slice()) : ATT_SLOTS) if (rng.next() < 0.45) att[k] = rng.pick(s[k]);
  const perks = Object.keys(CONFIG.PERKS);
  const lo = classLoadout('custom', { primary: p, secondary: rng.next() < 0.7 ? 'pistol' : rng.pick(CONFIG.SECONDARIES), att, perk: rng.pick(perks) });
  lo.cls = 'custom';
  return lo;
}

// ---------------- progreso ----------------
const RANKS = [
  [1, 'Recluta', 'Recruit'], [2, 'Soldado', 'Private'], [3, 'Soldado de 1.ª', 'Private First Class'], [5, 'Cabo', 'Corporal'], [7, 'Sargento', 'Sergeant'],
  [9, 'Sargento 1.º', 'Staff Sergeant'], [11, 'Sargento mayor', 'Master Sergeant'], [13, 'Subteniente', 'Second Lieutenant'], [15, 'Teniente', 'Lieutenant'],
  [18, 'Capitán', 'Captain'], [21, 'Mayor', 'Major'], [24, 'Teniente coronel', 'Lieutenant Colonel'], [27, 'Coronel', 'Colonel'], [30, 'General de brigada', 'Brigadier General'],
  [35, 'General de división', 'Major General'], [40, 'Teniente general', 'Lieutenant General'], [45, 'Capitán general', 'Captain General'], [50, 'Mariscal', 'Field Marshal'],
];
// nombre y categoría de cada desbloqueo (para la lista de progreso)
const UNLOCK_KINDS = [
  ['weapon', { es: 'Arma', en: 'Weapon' }], ['secondary', { es: 'Secundaria', en: 'Sidearm' }], ['att', { es: 'Accesorio', en: 'Attachment' }], ['perk', { es: 'Ventaja', en: 'Perk' }],
  ['streak', { es: 'Racha', en: 'Streak' }], ['operator', { es: 'Uniforme', en: 'Uniform' }], ['camo', { es: 'Tela', en: 'Cloth' }], ['helmet', { es: 'Tocado', en: 'Headgear' }],
  ['face', { es: 'Rostro', en: 'Face' }], ['vest', { es: 'Correaje', en: 'Webbing' }], ['pack', { es: 'Mochila', en: 'Backpack' }], ['pads', { es: 'Polainas', en: 'Leggings' }], ['wskin', { es: 'Acabado de arma', en: 'Weapon finish' }],
];
function unlockName(kind, id) {
  switch (kind) {
    case 'weapon': case 'secondary': return L(CONFIG.WEAPONS[id].name);
    case 'att': return L(CONFIG.ATTACH.items[id]);
    case 'perk': return L(CONFIG.PERKS[id]);
    case 'streak': return L(CONFIG.STREAKS[id]);
    case 'operator': return L(OPERATORS[id]);
    case 'camo': return L(CAMOS[id]);
    case 'helmet': return L(HELMETS[id]);
    case 'face': return L(FACES[id]);
    case 'vest': return L(VESTS[id]);
    case 'pack': return L(PACKS[id]);
    case 'pads': return L(PADS[id]);
    case 'wskin': return L(WSKINS[id]);
  }
  return id;
}
const WCH = [
  { id: 'kills', skin: 'olive', n: 25, es: 'Bajas', en: 'Kills' },
  { id: 'head', skin: 'sand', n: 15, es: 'Tiros a la cabeza', en: 'Headshots' },
  { id: 'long', skin: 'arctic', n: 10, es: 'Bajas a más de 35 m', en: 'Kills beyond 35 m' },
  { id: 'close', skin: 'night', n: 10, es: 'Bajas a menos de 6 m', en: 'Kills within 6 m' },
  { id: 'double', skin: 'crimson', n: 5, es: 'Dobles (2 bajas en 4 s)', en: 'Double kills (2 in 4 s)' },
  { id: 'pen', skin: 'cobalt', n: 8, es: 'Bajas a través de pared', en: 'Wallbang kills' },
  { id: 'att', skin: 'ember', n: 20, es: 'Bajas con 3 o más accesorios', en: 'Kills with 3+ attachments' },
  { id: 'match', skin: 'chrome', n: 12, es: 'Bajas en una sola partida', en: 'Kills in a single match' },
];
// cada arma pide menos de lo que no encaja con su estilo (escopeta de lejos, francotirador de cerca...)
const WCH_SCALE = { shotgun: { long: 0.3, head: 0.7, pen: 0.5 }, dbl: { long: 0.3, pen: 0.5 }, sniper: { close: 0.3, double: 0.6, match: 0.7 }, mk2: { close: 0.3, double: 0.6, match: 0.7 }, smg: { long: 0.5 }, tsmg: { long: 0.4, pen: 0.6 }, lmg: { close: 0.6 }, rifle: { close: 0.5, double: 0.7 }, dmr: { close: 0.5, double: 0.7 } };
const Progress = {
  data() { this.migrate(); const p = Store.get('prog', null); return p && Number.isFinite(p.xp) ? p : { xp: 0 }; },
  prestige() { return Math.max(0, this.data().pr | 0); },
  xpMul() { return 1 + CONFIG.PROG.prestigeBonus * this.prestige(); },
  canPrestige() { return this.prestige() < CONFIG.PROG.prestigeMax && this.info().level >= CONFIG.PROG.max; },
  // el rango vuelve a 1, pero todo lo desbloqueado se conserva; cada prestigio da insignia y +5% de XP
  doPrestige() {
    if (!this.canPrestige()) return false;
    const p = this.data(); p.xp = 0; p.pr = (p.pr | 0) + 1; Store.set('prog', p); return true;
  },
  xp() { return this.data().xp; },
  need(level) { return CONFIG.PROG.base + CONFIG.PROG.step * (level - 1); },
  totalFor(level) { let t = 0; for (let l = 1; l < level; l++) t += this.need(l); return t; },
  info(xp = this.xp()) {
    let lv = 1, rest = Math.max(0, xp);
    while (lv < CONFIG.PROG.max && rest >= this.need(lv)) { rest -= this.need(lv); lv++; }
    return { level: lv, into: rest, need: lv >= CONFIG.PROG.max ? 0 : this.need(lv) };
  },
  // nivel que cuenta para desbloqueos: con prestigio se conserva todo (50)
  level() { return this.prestige() > 0 ? CONFIG.PROG.max : this.info().level; },
  rankIndex(level) { let i = 0; for (let k = 0; k < RANKS.length; k++) if (level >= RANKS[k][0]) i = k; return i; },
  rankName(level) { const r = RANKS[this.rankIndex(level)]; return LANG === 'en' ? r[2] : r[1]; },
  // todo lo que se desbloquea, por categoría
  allUnlocks() {
    const out = [];
    for (const k in CONFIG.PERKS) { const lv = CONFIG.PERKS[k].lvl; if (lv > 1) out.push({ kind: 'perk', id: k, lvl: lv }); }
    for (const kind in CONFIG.UNLOCK) { if (kind === 'wskin') continue; for (const id in CONFIG.UNLOCK[kind]) { const lv = CONFIG.UNLOCK[kind][id]; if (lv > 1 && lv <= CONFIG.PROG.max) out.push({ kind, id, lvl: lv }); } }
    return out;
  },
  unlocksAt(level) {
    if (level <= 1) return [];
    return this.allUnlocks().filter((u) => u.lvl === level).map((u) => ({ ...u, name: unlockName(u.kind, u.id) }));
  },
  // ¿está desbloqueado? (kind: weapon, secondary, streak, operator, camo, helmet, face, vest, pack, pads, wskin, att, perk)
  has(kind, id, level = this.level()) {
    if (kind === 'camo' && id === 'prestige') return this.prestige() > 0;
    if (kind === 'att') return (CONFIG.ATTACH.items[id] ? CONFIG.ATTACH.items[id].lvl : 99) <= level;
    if (kind === 'perk') return (CONFIG.PERKS[id] ? CONFIG.PERKS[id].lvl : 99) <= level;
    const t = CONFIG.UNLOCK[kind]; return !!t && (t[id] ?? 99) <= level;
  },
  award(amount) {
    const p = this.data(), before = this.info(p.xp);
    amount = Math.round(amount * this.xpMul());
    p.xp = Math.max(0, Math.round(p.xp + amount)); Store.set('prog', p);
    const after = this.info(p.xp), unlocks = [];
    if (!(p.pr | 0)) for (let l = before.level + 1; l <= after.level; l++) unlocks.push(...this.unlocksAt(l));
    return { amount: Math.round(amount), before, after, unlocks };
  },
  // maestría: bajas con cada arma (niveles de arma)
  kills(id) { const w = Store.get('wk', {}); return w[id] || 0; },
  addKill(id) { const w = Store.get('wk', {}); w[id] = (w[id] || 0) + 1; Store.set('wk', w); },
  mastery(id) {
    if (CONFIG.PRIMARIES.includes(id)) { const l = this.wlevel(id); return l >= 20 ? 3 : l >= 14 ? 2 : l >= 7 ? 1 : 0; }
    const k = this.kills(id); return k >= 400 ? 3 : k >= 150 ? 2 : k >= 40 ? 1 : 0;
  },
  // ---------- niveles de arma (1–20) ----------
  _aw: {}, _pend: {}, gains: {}, _mk: { ref: null, k: {} },
  wxData() { this.migrate(); return Store.get('wx', {}); },
  wxp(id) { return this.wxData()[id] || 0; },
  wneed(l) { const W = CONFIG.WLVL; return W.base + W.step * (l - 1); },
  wtotal(level) { let t = 0; for (let l = 1; l < level; l++) t += this.wneed(l); return t; },
  winfo(id) {
    const W = CONFIG.WLVL, xp = this.wxp(id); let lv = 1, rest = xp;
    while (lv < W.max && rest >= this.wneed(lv)) { rest -= this.wneed(lv); lv++; }
    return { level: lv, into: rest, need: lv >= W.max ? 0 : this.wneed(lv), xp };
  },
  wlevel(id) { return this.winfo(id).level; },
  // nivel de arma que pide cada accesorio: se reparten del 2 al 17 por orden de potencia; 18–20 quedan para la maestría
  attLevels(w) {
    if (this._aw[w]) return this._aw[w];
    const slots = CONFIG.ATTACH.slots[w], map = {}; if (!slots) return (this._aw[w] = map);
    const list = [];
    ATT_SLOTS.forEach((sl, si) => { const o = slots[sl] || []; for (let i = 1; i < o.length; i++) list.push({ id: o[i], si, ol: CONFIG.ATTACH.items[o[i]].lvl }); });
    list.sort((a, b) => a.ol - b.ol || a.si - b.si);
    list.forEach((it, i) => { map[it.id] = 2 + Math.floor(i * 16 / list.length); });
    return (this._aw[w] = map);
  },
  attReq(w, a) { return this.attLevels(w)[a] || 1; },
  attOk(w, a, wl = this.wlevel(w)) { return this.attReq(w, a) <= wl; },
  attUnlocksAt(w, l) { const m = this.attLevels(w); return Object.keys(m).filter((a) => m[a] === l).map((a) => L(CONFIG.ATTACH.items[a])); },
  // retos: cada uno regala un camuflaje; los 8 juntos dan el dorado
  chCounters(w) { return (Store.get('wc', {})[w]) || {}; },
  chTarget(w, c) { const k = (WCH_SCALE[w] && WCH_SCALE[w][c.id]) || 1; return Math.max(2, Math.round(c.n * k)); },
  chList(w) { const cn = this.chCounters(w); return WCH.map((c) => { const n = this.chTarget(w, c), v = Math.min(cn[c.id] || 0, n); return { c, n, v, done: v >= n }; }); },
  chDone(w) { return this.chList(w).filter((x) => x.done).length; },
  camoOk(w, sk) {
    if (!sk || sk === 'none') return true;
    const g = (Store.get('wcg', {})[w]) || {}; if (g[sk]) return true;
    if (sk === 'gold') return this.chDone(w) >= WCH.length;
    const ch = this.chList(w).find((x) => x.c.skin === sk); return !!(ch && ch.done);
  },
  // suma XP a un arma; devuelve los niveles subidos y lo que desbloquean
  awardWeapon(id, amount) {
    if (!CONFIG.PRIMARIES.includes(id) || !(amount > 0)) return null;
    const wx = this.wxData(), before = this.winfo(id);
    wx[id] = (wx[id] || 0) + Math.round(amount * this.xpMul()); Store.set('wx', wx);
    const after = this.winfo(id), att = [];
    for (let l = before.level + 1; l <= after.level; l++) att.push(...this.attUnlocksAt(id, l));
    const g = this.gains[id] || (this.gains[id] = { xp: 0, from: before.level, to: before.level, att: [], ch: [] });
    g.xp += Math.round(amount * this.xpMul()); g.to = after.level; g.att.push(...att);
    return { before, after, att };
  },
  onDamage(w, dmg) { if (CONFIG.PRIMARIES.includes(w)) this._pend[w] = (this._pend[w] || 0) + dmg * CONFIG.WLVL.dmgXp; },
  // baja con un arma principal: XP, contadores de retos y avisos
  onKill(w, o) {
    if (!CONFIG.PRIMARIES.includes(w)) return null;
    const W = CONFIG.WLVL, cw = Store.get('wc', {}), c = cw[w] || (cw[w] = {}), doneBefore = this.chList(w).map((x) => x.done);
    c.kills = (c.kills || 0) + 1;
    if (o.head) c.head = (c.head || 0) + 1;
    if (o.dist >= W.longDist) c.long = (c.long || 0) + 1;
    if (o.dist <= W.closeDist) c.close = (c.close || 0) + 1;
    if (o.pen) c.pen = (c.pen || 0) + 1;
    if (o.atts >= 3) c.att = (c.att || 0) + 1;
    if (this._last && this._last.w === w && G.time - this._last.t < 4 && !this._last.dbl) { c.double = (c.double || 0) + 1; this._last.dbl = true; this._last.t = G.time; }
    else this._last = { w, t: G.time, dbl: false };
    if (this._mk.ref !== G.match) this._mk = { ref: G.match, k: {} };
    this._mk.k[w] = (this._mk.k[w] || 0) + 1; c.match = Math.max(c.match || 0, this._mk.k[w]);
    Store.set('wc', cw);
    const doneAfter = this.chList(w), newCh = [];
    doneAfter.forEach((x, i) => { if (x.done && !doneBefore[i]) newCh.push(x.c); });
    const allNow = doneAfter.every((x) => x.done) && !doneBefore.every(Boolean);
    let xp = W.kill + (o.head ? W.head : 0) + (o.dist >= W.longDist ? W.long : 0) + Math.round(this._pend[w] || 0); this._pend[w] = 0;
    const res = this.awardWeapon(w, xp);
    const g = this.gains[w]; if (g) { for (const x of newCh) g.ch.push(L(WSKINS[x.skin])); if (allNow) g.ch.push(L(WSKINS.gold)); }
    return { res, newCh, gold: allNow };
  },
  // al terminar la partida: el daño pendiente se convierte en XP de arma
  flushWeapons() { for (const w in this._pend) if (this._pend[w] >= 1) this.awardWeapon(w, this._pend[w]); this._pend = {}; },
  takeGains() { const g = this.gains; this.gains = {}; return g; },
  // borra rango, prestigio, niveles y retos de arma, maestría y estadísticas; los ajustes (nombre, gráficos, controles) se conservan
  resetAll() {
    for (const k of ['wk', 'wx', 'wc', 'wcg', 'records']) Store.set(k, {});
    Store.set('prog', { xp: 0 }); Store.set('mig270', true);
    this._aw = {}; this._pend = {}; this.gains = {}; this._last = null; this._mk = { ref: null, k: {} };
    const s = G.settings, d = DEFAULT_SETTINGS;
    s.custom = { ...d.custom }; s.loadout = JSON.parse(JSON.stringify(d.loadout)); s.primary = d.primary; s.wskins = {}; s.streaks = []; s.cls = d.cls; s.slot = 0; linkSlots(s, null, d.loadout);
    saveSettings(); NET._lo = null;
  },
  // una sola vez: lo que ya tenías (bajas, rango, camuflajes) se convierte al sistema nuevo sin perder nada
  migrate() {
    if (this._migrating || Store.get('mig270', false)) return;
    this._migrating = true;
    try {
      const p = Store.get('prog', null), wk = Store.get('wk', {}), had = (p && p.xp > 0) || Object.keys(wk).length;
      if (had) {
        const L0 = this.info(p ? p.xp : 0).level, wx = Store.get('wx', {}), wc = Store.get('wc', {}), wcg = Store.get('wcg', {});
        const base = Math.min(17, Math.round(L0 / CONFIG.PROG.max * 17));
        for (const w of CONFIG.PRIMARIES) {
          const k = wk[w] || 0;
          wx[w] = Math.max(wx[w] || 0, k * CONFIG.WLVL.kill, this.wtotal(base));
          wc[w] = { ...(wc[w] || {}), kills: Math.max((wc[w] && wc[w].kills) || 0, k) };
          const g = wcg[w] || {};
          for (const sk in WSKINS) if (sk !== 'none' && (CONFIG.UNLOCK.wskin[sk] || 99) <= L0) g[sk] = true;
          if (k >= 40) g.ember = true; if (k >= 150) g.gold = true; if (k >= 400) g.chrome = true;
          wcg[w] = g;
        }
        Store.set('wx', wx); Store.set('wc', wc); Store.set('wcg', wcg);
      }
      Store.set('mig270', true);
    } finally { this._migrating = false; }
  },
  // código de respaldo: progreso, maestría y equipo, para pasarlo a otro navegador
  exportCode() {
    const s = G.settings;
    const body = { v: 2, xp: this.xp(), pr: this.prestige(), wk: Store.get('wk', {}), wx: this.wxData(), wc: Store.get('wc', {}), wcg: Store.get('wcg', {}), rec: Store.get('records', {}), camp: typeof Camp !== 'undefined' ? Camp.exportObj() : undefined, set: { name: s.name, custom: s.custom, cls: s.cls, loadout: s.loadout, slots: s.slots, slot: s.slot, wskins: s.wskins, streaks: s.streaks } };
    const json = JSON.stringify(body);
    return 'CW2.' + btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') + '.' + hash32('cw2', json).toString(36);
  },
  importCode(code) {
    try {
      const [tag, b64, sum] = String(code || '').trim().split('.');
      if ((tag !== 'CW1' && tag !== 'CW2') || !b64 || !sum) return { ok: false, err: 'format' };
      const v = tag === 'CW2' ? 2 : 1, json = decodeURIComponent(escape(atob(b64.replace(/-/g, '+').replace(/_/g, '/'))));
      if (hash32(tag.toLowerCase(), json).toString(36) !== sum) return { ok: false, err: 'sum' };
      const o = JSON.parse(json), obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
      if (!o || o.v !== v || !Number.isFinite(o.xp) || o.xp < 0 || o.xp > 1e8) return { ok: false, err: 'format' };
      Store.set('prog', { xp: Math.round(o.xp), pr: v === 2 ? clamp(Math.round(+o.pr || 0), 0, CONFIG.PROG.prestigeMax) : 0 });
      if (obj(o.wk)) Store.set('wk', o.wk);
      if (obj(o.rec)) Store.set('records', o.rec);
      if (obj(o.camp) && typeof Camp !== 'undefined') Camp.importObj(o.camp);   // v3.0: progreso de campaña (los códigos viejos no lo traen y no se toca)
      if (v === 2) { Store.set('wx', obj(o.wx) ? o.wx : {}); Store.set('wc', obj(o.wc) ? o.wc : {}); Store.set('wcg', obj(o.wcg) ? o.wcg : {}); Store.set('mig270', true); }
      else { Store.set('wx', {}); Store.set('wc', {}); Store.set('wcg', {}); Store.set('mig270', false); this.migrate(); } // código antiguo: se convierte igual que un perfil viejo
      const s = G.settings, t = o.set || {};
      if (typeof t.name === 'string') s.name = t.name.slice(0, 14);
      if (obj(t.custom)) s.custom = { ...s.custom, ...t.custom };
      if (CONFIG.CLASSES[t.cls]) s.cls = t.cls;
      if (Array.isArray(t.slots)) { s.slot = clamp(+t.slot | 0, 0, CUSTOM_SLOTS - 1); linkSlots(s, t.slots); } else if (obj(t.loadout)) { s.slot = 0; linkSlots(s, null, t.loadout); }
      if (s.cls === 'custom') setClass('custom');
      if (obj(t.wskins)) s.wskins = t.wskins;
      if (Array.isArray(t.streaks)) s.streaks = t.streaks.filter((id) => CONFIG.STREAKS[id]).slice(0, 3);
      saveSettings();
      return { ok: true, level: this.info(Math.round(o.xp)).level };
    } catch (e) { return { ok: false, err: 'format' }; }
  },
};
// insignia de rango en SVG (galones para tropa, barras para oficiales, rombos, estrellas de general)
function rankBadge(level, size = 22, pr = 0) {
  const i = Progress.rankIndex(level), c = i >= 13 ? '#f0c24a' : '#d9a441', w = size;
  let g = '';
  if (i === 0) g = `<circle cx="12" cy="12" r="3.2" fill="none" stroke="${c}" stroke-width="2"/>`;
  else if (i <= 6) {
    const ch = Math.min(3, i), rk = Math.max(0, i - 3);
    for (let k = 0; k < ch; k++) g += `<path d="M5 ${8 + k * 4.2} L12 ${3.8 + k * 4.2} L19 ${8 + k * 4.2}" fill="none" stroke="${c}" stroke-width="2.3" stroke-linejoin="round"/>`;
    for (let k = 0; k < rk; k++) g += `<path d="M5 ${15.5 + k * 3.4} Q12 ${19.5 + k * 3.4} 19 ${15.5 + k * 3.4}" fill="none" stroke="${c}" stroke-width="2"/>`;
  } else if (i <= 9) { const n = i - 6; for (let k = 0; k < n; k++) g += `<rect x="${12 - n * 2.6 + k * 5.2}" y="5" width="3.4" height="14" rx="0.6" fill="${c}"/>`; }
  else if (i <= 12) { const n = i - 9; for (let k = 0; k < n; k++) g += `<path d="M${12 - (n - 1) * 3.6 + k * 7.2} 6 l3 6 l-3 6 l-3 -6z" fill="${c}"/>`; }
  else {
    // generales: de 1 a 5 estrellas
    const n = Math.min(5, i - 12), sc = n === 1 ? 1 : n <= 3 ? 0.62 : 0.46;
    for (let k = 0; k < n; k++) {
      const cx = n === 1 ? 12 : n <= 3 ? 12 + (k - (n - 1) / 2) * 7.4 : 12 + (k % 3 - 1) * 7.4 * (n === 4 ? 0.6 : 1), cy = n <= 3 ? 12 : k < 3 ? 7.5 : 16.5;
      g += `<path transform="translate(${cx - 12 * sc} ${cy - 12 * sc}) scale(${sc})" d="M12 3.2 l2.5 5.6 6.1.6 -4.6 4.1 1.3 6 -5.3-3.1 -5.3 3.1 1.3-6 -4.6-4.1 6.1-.6z" fill="${c}"/>`;
    }
  }
  if (pr > 0) g += `<circle cx="18.5" cy="18.5" r="5.4" fill="#f0c24a" stroke="#1a1a12" stroke-width="1"/><text x="18.5" y="21.3" font-size="7.6" font-weight="700" text-anchor="middle" fill="#1a1a12" font-family="sans-serif">${pr}</text>`;
  return `<svg class="rank" width="${w}" height="${w}" viewBox="0 0 24 24" aria-hidden="true">${g}</svg>`;
}

