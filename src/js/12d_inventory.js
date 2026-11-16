// ---- 12d_inventory.js ----
// =====================================================================
// INVENTARIO Y EQUIPAMIENTO DEL MODO CÁRCEL (2.13.0)
//  · Bolsillos: 4 huecos; una bolsa o mochila en la espalda añade más.
//    Cada objeto ocupa un hueco y se apila hasta su máximo (munición, vendas…).
//  · Equipamiento: torso (chaleco de guardia), espalda (bolsa/mochila) y la
//    linterna, que gasta pilas. Lo que se equipa se ve en el personaje.
//  · Armas: no ocupan hueco, pero su munición de reserva SÍ (balas 9 mm,
//    cartuchos): recargar la saca de los bolsillos.
//  · Objetos en el mapa: se recogen con E; tirar deja el objeto en el suelo.
//  · Usar lleva tiempo (vendarse, botiquín) y un golpe lo interrumpe.
//    El tiempo no se detiene con el inventario abierto.
//  · Arrojables (G): botella (ruido que atrae a los infectados) y bengala (luz roja + ruido).
// Teclas: Tab o I inventario · X curarse · G lanzar · L linterna
// =====================================================================
const ITEMS = {
  med: { es: 'Botiquín', en: 'Medkit', d: { es: 'Vendas, gasas y antiséptico. Recupera 45 de salud. Tarda en usarse.', en: 'Bandages, gauze and antiseptic. Restores 45 health. Takes time.' }, stack: 1, use: { time: 2.6, heal: 45 }, kind: 'heal' },
  bandage: { es: 'Venda', en: 'Bandage', d: { es: 'Detiene la sangre de una herida pequeña. Recupera 15 de salud.', en: 'Stops a small wound bleeding. Restores 15 health.' }, stack: 3, use: { time: 1.4, heal: 15 }, kind: 'heal' },
  pills: { es: 'Analgésicos', en: 'Painkillers', d: { es: 'Quitan la cojera y el mareo, y algo de dolor (+5).', en: 'Remove limp and dizziness, and some pain (+5).' }, stack: 2, use: { time: 0.9, heal: 5, cure: true }, kind: 'heal' },
  ammo9: { es: 'Balas 9 mm', en: '9 mm rounds', d: { es: 'Munición para la pistola. Al recargar se saca de aquí.', en: 'Pistol ammunition. Reloading takes it from here.' }, stack: 30, ammo: 'pistol', kind: 'ammo' },
  shells: { es: 'Cartuchos', en: 'Shells', d: { es: 'Cartuchos del calibre 12 para la escopeta.', en: '12-gauge shells for the shotgun.' }, stack: 12, ammo: 'shotgun', kind: 'ammo' },
  battery: { es: 'Pilas', en: 'Batteries', d: { es: 'Un juego de pilas nuevas para la linterna.', en: 'A fresh set of batteries for the flashlight.' }, stack: 2, use: { time: 1.2, battery: true }, kind: 'tool' },
  bottle: { es: 'Botella', en: 'Bottle', d: { es: 'Lánzala (G): al romperse hace ruido y los infectados van a ver qué fue.', en: 'Throw it (G): it shatters loudly and draws the infected.' }, stack: 1, throw: 'bottle', kind: 'throw' },
  flare: { es: 'Bengala', en: 'Flare', d: { es: 'Lánzala (G): luz roja durante 30 s. Su siseo atrae a los infectados.', en: 'Throw it (G): red light for 30 s. Its hiss attracts the infected.' }, stack: 2, throw: 'flare', kind: 'throw' },
  satchel: { es: 'Bolsa de lona', en: 'Canvas bag', d: { es: 'Se cuelga al hombro: +3 huecos.', en: 'Shoulder bag: +3 slots.' }, stack: 1, slot: 'back', slots: 3, kind: 'gear' },
  backpack: { es: 'Mochila', en: 'Backpack', d: { es: 'Mochila de un guardia: +6 huecos.', en: 'A guard\'s backpack: +6 slots.' }, stack: 1, slot: 'back', slots: 6, kind: 'gear' },
  vest: { es: 'Chaleco de guardia', en: 'Guard vest', d: { es: 'Acolchado y anticorte: los golpes y mordiscos hacen un 35 % menos de daño y cuesta menos zafarse.', en: 'Padded, cut-resistant: hits and bites deal 35% less damage and breaking free is easier.' }, stack: 1, slot: 'torso', armor: 0.35, kind: 'gear' },
};
const INV_BASE = 4, INV_MAX = 10, BATTERY_LIFE = 260;
const SLOT_NAMES = { torso: { es: 'Torso', en: 'Torso' }, back: { es: 'Espalda', en: 'Back' }, light: { es: 'Linterna', en: 'Flashlight' } };
// iconos (SVG en línea, 48×48)
const ITEM_ICONS = {
  med: '<rect x="7" y="13" width="34" height="25" rx="3" fill="#d8d6cc"/><rect x="18" y="8" width="12" height="6" rx="2" fill="none" stroke="#d8d6cc" stroke-width="3"/><rect x="21" y="17" width="6" height="17" fill="#b8322a"/><rect x="15.5" y="22.5" width="17" height="6" fill="#b8322a"/>',
  bandage: '<ellipse cx="20" cy="24" rx="12" ry="13" fill="#e8e4d8"/><ellipse cx="20" cy="24" rx="4" ry="4.5" fill="#9a968a"/><path d="M30 18 L44 30 L40 35 L28 26Z" fill="#e8e4d8"/><path d="M14 16 Q20 13 26 16" stroke="#b8b4a8" stroke-width="1.5" fill="none"/>',
  pills: '<rect x="15" y="15" width="18" height="26" rx="3" fill="#d07a2a"/><rect x="13" y="8" width="22" height="8" rx="2" fill="#ece8dc"/><rect x="18" y="23" width="12" height="9" fill="#ece8dc"/><circle cx="38" cy="38" r="4" fill="#ece8dc"/>',
  ammo9: '<g fill="#c9a23a">' + [10, 18, 26, 34].map((x) => `<rect x="${x}" y="18" width="6" height="18" rx="1"/><path d="M${x} 18 Q${x + 3} 9 ${x + 6} 18Z" fill="#b8723a"/>`).join('') + '</g><rect x="8" y="34" width="34" height="4" fill="#4a5236"/>',
  shells: '<g>' + [9, 20, 31].map((x) => `<rect x="${x}" y="10" width="9" height="22" rx="1.5" fill="#b8322a"/><rect x="${x}" y="30" width="9" height="8" fill="#c9a23a"/>`).join('') + '</g>',
  battery: '<rect x="9" y="12" width="12" height="26" rx="2" fill="#2a2c2e"/><rect x="9" y="12" width="12" height="7" fill="#c9a23a"/><rect x="13" y="9" width="4" height="3" fill="#9a9a92"/><rect x="27" y="12" width="12" height="26" rx="2" fill="#2a2c2e"/><rect x="27" y="12" width="12" height="7" fill="#c9a23a"/><rect x="31" y="9" width="4" height="3" fill="#9a9a92"/>',
  bottle: '<path d="M20 6 h8 v9 q8 4 8 12 v15 q0 3 -3 3 h-18 q-3 0 -3 -3 v-15 q0 -8 8 -12z" fill="#3f6a3a" opacity=".95"/><rect x="20" y="4" width="8" height="4" fill="#8a8a7a"/><rect x="15" y="24" width="18" height="10" fill="#d8ccaa" opacity=".8"/>',
  flare: '<rect x="20" y="10" width="9" height="32" rx="2" fill="#c63a2a" transform="rotate(25 24 24)"/><rect x="20" y="6" width="9" height="7" rx="1.5" fill="#2a2a28" transform="rotate(25 24 24)"/><circle cx="33" cy="8" r="4" fill="#ffb07a" opacity=".85"/>',
  satchel: '<rect x="8" y="18" width="32" height="22" rx="4" fill="#8a7a5a"/><path d="M8 22 h32 v6 q-16 6 -32 0z" fill="#7a6a4a"/><path d="M12 18 Q24 -2 36 18" stroke="#5a4a32" stroke-width="3" fill="none"/><rect x="22" y="26" width="4" height="6" fill="#c9a23a"/>',
  backpack: '<rect x="11" y="10" width="26" height="32" rx="6" fill="#4a5236"/><rect x="15" y="26" width="18" height="12" rx="2" fill="#3a4028"/><path d="M17 10 Q24 3 31 10" stroke="#2a2c22" stroke-width="3" fill="none"/><rect x="11" y="18" width="26" height="3" fill="#3a4028"/>',
  vest: '<path d="M12 8 h7 q5 6 10 0 h7 l4 6 v26 q0 3 -3 3 h-26 q-3 0 -3 -3 v-26z" fill="#2e3a48"/><rect x="11" y="27" width="26" height="5" fill="#d8d4c4"/><rect x="21" y="12" width="6" height="30" fill="#24303c"/>',
  flashlight: '<rect x="6" y="20" width="24" height="9" rx="2" fill="#3a3c3e"/><path d="M30 17 h8 l4 -3 v20 l-4 -3 h-8z" fill="#5a5c5e"/><path d="M42 18 l5 -4 M42 24 h6 M42 30 l5 4" stroke="#f0d890" stroke-width="2"/>',
  pistol: '<path d="M6 16 h34 v8 h-20 l-3 14 h-8 l2 -14 h-5z" fill="#3a3c3e"/><rect x="6" y="14" width="34" height="4" fill="#5a5c5e"/>',
  shotgun: '<rect x="4" y="18" width="40" height="5" fill="#3a3c3e"/><rect x="18" y="23" width="14" height="4" fill="#5a5c5e"/><path d="M4 20 h8 l-6 14 h-4z" fill="#6a4a2a"/>',
  knife: '<path d="M6 30 L32 16 L40 14 L34 22 L10 34z" fill="#b8bcc0"/><rect x="34" y="12" width="9" height="5" rx="1" fill="#2a2a28" transform="rotate(-25 38 14)"/>',
};
const icon = (id) => `<svg viewBox="0 0 48 48" aria-hidden="true">${ITEM_ICONS[id] || ''}</svg>`;
// colocación de objetos en el mapa de la cárcel (x, y = superficie, z)
const PRISON_LOOT = [
  ['bandage', 1, -5.98, 0.8, -6.42], ['med', 1, 2.2, 1.1, 1.25], ['battery', 1, 3.6, 1.1, 2.9], ['ammo9', 6, -9.2, 0.93, 2.0],
  ['pills', 1, -10.9, 0.76, 5.5], ['bottle', 1, -2.2, 0.06, 4.2], ['satchel', 1, -10.05, 0.5, 5.8], ['bottle', 1, 6.9, 0.06, 2.2],
  ['flare', 1, 12.9, 0.8, -0.9], ['ammo9', 8, 19.5, 0.06, -1.4],
  ['vest', 1, 17.0, 1.26, 7.7], ['shells', 6, 19.3, 1.06, 4.6], ['med', 1, 16.6, 0.06, 3.1], ['backpack', 1, 21.3, 0.06, 5.4], ['battery', 1, 14.9, 0.06, 4.0], ['flare', 1, 18.4, 1.06, 4.4],
];

const Inv = {
  slots: [], equip: { torso: null, back: null }, battery: 1, use: null, open: false, sel: null, prompt: null, world: [], thrown: [], ready: 'bottle',
  _seenInt: 0, _seenX: 0, _seenG: 0, lastRes: {}, _built: false, flareLight: null,
  // ---------------- estado ----------------
  reset() {
    this.clearWorld();
    this.slots = Array(INV_MAX).fill(null); this.equip = { torso: null, back: null }; this.battery = 0.55; this.use = null; this.sel = null; this.prompt = null; this.lastRes = {}; this.ready = 'bottle';
    this.add('bandage', 1);
    for (const [id, n, x, y, z] of PRISON_LOOT) this.drop(id, n, x, y, z, true);
    if (!this.flareLight) { this.flareLight = new THREE.PointLight(0xff3a2a, 0, 11, 1.6); }
    if (this.flareLight.parent !== G.scene) G.scene.add(this.flareLight);
    this.flareLight.intensity = 0;
    this.close(); this.buildHud(); this.hookOnce();
  },
  clear() { this.clearWorld(); this.close(); if (this.flareLight) this.flareLight.intensity = 0; const h = document.getElementById('invHud'); if (h) h.style.display = 'none'; this.useUI(null); },
  clearWorld() {
    for (const w of this.world) if (w.mesh && w.mesh.parent) w.mesh.parent.remove(w.mesh);
    for (const t of this.thrown) if (t.mesh && t.mesh.parent) t.mesh.parent.remove(t.mesh);
    this.world = []; this.thrown = [];
  },
  cap() { return INV_BASE + (this.equip.back ? ITEMS[this.equip.back].slots : 0); },
  count(id) { let n = 0; for (let i = 0; i < this.cap(); i++) { const s = this.slots[i]; if (s && s.id === id) n += s.n; } return n; },
  used() { let n = 0; for (let i = 0; i < this.cap(); i++) if (this.slots[i]) n++; return n; },
  // añade n; devuelve cuántos cupieron
  add(id, n) {
    const I = ITEMS[id], cap = this.cap(); let left = n;
    for (let i = 0; i < cap && left > 0; i++) { const s = this.slots[i]; if (s && s.id === id && s.n < I.stack) { const k = Math.min(left, I.stack - s.n); s.n += k; left -= k; } }
    for (let i = 0; i < cap && left > 0; i++) if (!this.slots[i]) { const k = Math.min(left, I.stack); this.slots[i] = { id, n: k }; left -= k; }
    return n - left;
  },
  remove(id, n) {
    for (let i = this.cap() - 1; i >= 0 && n > 0; i--) { const s = this.slots[i]; if (s && s.id === id) { const k = Math.min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) this.slots[i] = null; } }
    this.compact();
  },
  compact() { const cap = this.cap(), keep = this.slots.slice(0, cap).filter(Boolean); for (let i = 0; i < INV_MAX; i++) this.slots[i] = i < keep.length ? keep[i] : (i >= cap ? this.slots[i] : null); },
  armor() { return this.equip.torso === 'vest' ? 1 - ITEMS.vest.armor : 1; },

  // ---------------- objetos en el mapa ----------------
  drop(id, n, x, y, z, quiet) {
    const g = itemMesh(id); g.position.set(x, y + 0.002, z); g.rotation.y = (x * 7.3 + z * 3.1) % TAU; G.root.add(g);
    this.world.push({ id, n, x, y, z, mesh: g });
    if (!quiet) AUDIO.play && AUDIO.play('impact', g.position, 0.4, { f: 900 });
  },
  nearest(me) {
    const eye = me.eyePos(_v1), fw = dirFromYawPitch(me.input.yaw, me.input.pitch, _v2);
    let best = null, bs = -1;
    for (const w of this.world) {
      const dx = w.x - eye.x, dy = w.y + 0.08 - eye.y, dz = w.z - eye.z, dh = Math.hypot(dx, dz), d = Math.hypot(dh, dy);
      if (dh > 1.7 || Math.abs(w.y - me.pos.y) > 1.6) continue;
      const dot = (dx * fw.x + dy * fw.y + dz * fw.z) / (d || 1);
      if (dot < 0.55 && dh > 0.7) continue;
      const s = dot - d * 0.25;
      if (s > bs) { bs = s; best = w; }
    }
    return best;
  },
  tryPickup(f) {
    if (f !== G.local || !this.prompt) return false;
    const w = this.prompt, I = ITEMS[w.id];
    if (I.slot && !this.equip[I.slot]) { this.equipItem(w.id); this.takeWorld(w); UI.toast(L({ es: 'EQUIPADO · ', en: 'EQUIPPED · ' }) + escapeHtml(L(I)), 2200); return true; }
    const got = this.add(w.id, w.n);
    if (!got) { UI.toast(L({ es: 'BOLSILLOS LLENOS', en: 'POCKETS FULL' }) + ` · <span style="opacity:.7">${L({ es: 'tira algo (Tab)', en: 'drop something (Tab)' })}</span>`, 2200); AUDIO.play && AUDIO.play('dry', null, 0.5); return true; }
    w.n -= got;
    UI.toast(`${escapeHtml(L(I))}${got > 1 ? ' ×' + got : ''}`, 1800);
    AUDIO.play && AUDIO.play('pin', null, 0.5);
    if (w.n <= 0) this.takeWorld(w);
    this.render();
    return true;
  },
  takeWorld(w) { if (w.mesh && w.mesh.parent) w.mesh.parent.remove(w.mesh); this.world = this.world.filter((q) => q !== w); },

  // ---------------- equipar ----------------
  equipItem(id) {
    const I = ITEMS[id], old = this.equip[I.slot];
    this.equip[I.slot] = id;
    if (old) { const me = G.local; if (!this.add(old, 1) && me) this.drop(old, 1, me.pos.x, me.pos.y, me.pos.z); }
    this.compact(); this.refreshLook(); this.render();
  },
  unequip(slot) {
    const id = this.equip[slot]; if (!id) return;
    // quitarse la bolsa: lo que no quepa en los bolsillos cae al suelo
    this.equip[slot] = null;
    const me = G.local;
    if (slot === 'back') { const cap = this.cap(); for (let i = cap; i < INV_MAX; i++) { const s = this.slots[i]; if (s && me) { this.drop(s.id, s.n, me.pos.x + frand(-0.3, 0.3), me.pos.y, me.pos.z + frand(-0.3, 0.3)); } this.slots[i] = null; } }
    this.compact();
    if (!this.add(id, 1) && me) this.drop(id, 1, me.pos.x, me.pos.y, me.pos.z);
    this.refreshLook(); this.render();
  },
  // el chaleco y la bolsa se ven en el personaje (tercera persona, sombras)
  refreshLook() {
    const f = G.local; if (!f || !f.view || !f.alive) return;
    f.custom.gearVest = this.equip.torso === 'vest'; f.custom.gearBag = this.equip.back;
    const w = f.weapon; f.view.dispose(); f.view = new SoldierView(f); f.view.reset(); f.view.setWeapon(w);
  },

  // ---------------- usar ----------------
  startUse(id) {
    const me = G.local, I = ITEMS[id]; if (!me || !me.alive || !I || !I.use || this.use || !this.count(id)) return;
    if (I.use.heal && !I.use.cure && me.hp >= 100) { UI.toast(L({ es: 'Estás bien de salud', en: 'Health is full' }), 1400); return; }
    if (I.use.battery && this.battery > 0.97) { UI.toast(L({ es: 'Las pilas están nuevas', en: 'Batteries are fresh' }), 1400); return; }
    this.use = { id, t: 0, dur: I.use.time };
    me.reloadT = 0; me.adsT = 0; me.sprinting = false;
    AUDIO.play && AUDIO.play(I.use.battery ? 'reload' : 'swing', null, 0.4);
  },
  finishUse() {
    const u = this.use, me = G.local; this.use = null; this.useUI(null);
    if (!u || !me || !me.alive) return;
    const I = ITEMS[u.id]; this.remove(u.id, 1);
    if (I.use.heal) { me.hp = Math.min(100, me.hp + I.use.heal); me.lastDamageT = G.time; }
    if (I.use.cure) { me.limpT = 0; me.dazeT = 0; }
    if (I.use.battery) { this.battery = 1; Zombies.flashOn = true; }
    UI.toast(`${escapeHtml(L(I))} · ${I.use.heal ? '+' + I.use.heal + ' ' + L({ es: 'de salud', en: 'health' }) : L({ es: 'linterna al 100 %', en: 'flashlight 100%' })}`, 1800);
    this.render();
  },
  quickHeal() {
    const me = G.local; if (!me || !me.alive || this.use) return;
    const miss = 100 - me.hp;
    const order = (me.limpT > 0 || me.dazeT > 0) && miss < 20 ? ['pills', 'bandage', 'med'] : miss > 32 ? ['med', 'bandage', 'pills'] : ['bandage', 'med', 'pills'];
    const id = order.find((k) => this.count(k) > 0);
    if (!id) { UI.toast(L({ es: 'No tienes nada para curarte', en: 'Nothing to heal with' }), 1600); return; }
    this.startUse(id);
  },
  // ---------------- arrojables ----------------
  throwReady() {
    const me = G.local; if (!me || !me.alive || this.use || me.zGrabbed) return;
    let id = this.count(this.ready) ? this.ready : ['bottle', 'flare'].find((k) => this.count(k));
    if (!id) { UI.toast(L({ es: 'No tienes nada que lanzar', en: 'Nothing to throw' }), 1500); return; }
    this.remove(id, 1); this.render();
    const eye = me.eyePos(new THREE.Vector3()), d = dirFromYawPitch(me.input.yaw, me.input.pitch + 0.12, new THREE.Vector3());
    const mesh = itemMesh(id); mesh.position.copy(eye).addScaledVector(d, 0.4); G.root.add(mesh);
    if (id === 'flare') { const sp = new THREE.Sprite(flareGlowMat()); sp.scale.setScalar(0.55); sp.position.set(0.12, 0.02, 0); mesh.add(sp); mesh.userData.glow = sp; }
    this.thrown.push({ id, pos: mesh.position, vel: d.multiplyScalar(id === 'flare' ? 11 : 13).add(_v1.set(me.vel.x * 0.5, 0, me.vel.z * 0.5)), mesh, t: 0, landed: false, life: 30, spin: frand(6, 12) });
    AUDIO.play && AUDIO.play('throw', null, 0.6);
    if (id === 'flare') AUDIO.play && AUDIO.play('smoke', me.pos, 0.5);
  },
  tickThrown(dt) {
    for (const p of this.thrown) {
      if (!p.landed) {
        p.vel.y -= 9.8 * dt;
        const step = p.vel.length() * dt, dir = _v2.copy(p.vel).normalize();
        const h = step > 1e-4 ? PHYS.raycast(p.pos, dir, step + 0.05, {}) : null;
        if (h) {
          p.pos.copy(h.point).addScaledVector(h.normal, 0.04);
          if (p.id === 'bottle') { this.shatter(p.pos); p.dead = true; continue; }
          // la bengala rebota y se queda en el suelo
          const vn = p.vel.dot(h.normal); p.vel.addScaledVector(h.normal, -1.6 * vn).multiplyScalar(0.35);
          if (h.normal.y > 0.6 && p.vel.length() < 1.2) { p.landed = true; p.vel.set(0, 0, 0); p.mesh.rotation.set(0, p.mesh.rotation.y, Math.PI / 2); }
        } else p.pos.addScaledVector(p.vel, dt);
        p.mesh.rotation.x += p.spin * dt;
        if (p.pos.y < -5) p.dead = true;
      }
      if (p.id === 'flare') {
        const sp = p.mesh.userData.glow; if (sp) { sp.scale.setScalar((0.45 + 0.15 * Math.sin(G.realTime * 37) * Math.sin(G.realTime * 11)) * Math.min(1, p.life / 3)); sp.position.set(p.landed ? 0.12 : 0, 0.02, 0); }
        p.life -= dt; p.noiseT = (p.noiseT || 0) - dt;
        if (p.noiseT <= 0 && G.local) { p.noiseT = 2.2; BotNoise.add(G.local, p.pos, 0.42); }
        if (p.life <= 0) p.dead = true;
      }
    }
    for (const p of this.thrown) if (p.dead && p.mesh.parent) p.mesh.parent.remove(p.mesh);
    this.thrown = this.thrown.filter((p) => !p.dead);
    // la luz de la bengala más reciente
    const fl = [...this.thrown].reverse().find((p) => p.id === 'flare');
    if (this.flareLight) {
      if (fl) { const k = Math.min(1, fl.life / 3) * (0.8 + 0.2 * Math.sin(G.realTime * 31) * Math.sin(G.realTime * 13)); this.flareLight.position.set(fl.pos.x, fl.pos.y + 0.25, fl.pos.z); this.flareLight.intensity = 9 * k; }
      else this.flareLight.intensity = 0;
    }
  },
  shatter(p) {
    BotNoise.add(G.local, p, 0.55);
    if (FX.impact) FX.impact(p, _v3.set(0, 1, 0), 'glass', 0.8);
    if (AUDIO.ok && AUDIO.ctx.state === 'running') { const o = AUDIO.out(p, 1, 0.5); if (o) { const t = AUDIO.ctx.currentTime + 0.004; AUDIO.nz(o, t, 0.35, 0.8, 'highpass', 3000, 6000, 0.8, 0.002); for (let i = 0; i < 5; i++) AUDIO.osc(o, 'sine', 2500 + Math.random() * 3000, 1800, t + i * 0.04 + Math.random() * 0.03, 0.08, 0.05); } }
  },

  // ---------------- cada tick ----------------
  tick(dt) {
    const me = G.local; if (!me) return;
    this.tickThrown(dt);
    if (!me.alive) { this.use = null; this.useUI(null); if (this.open) this.close(false); return; }
    // la munición de reserva vive en los bolsillos
    for (const w of Object.keys(me.inv)) {
      const it = w === 'pistol' ? 'ammo9' : w === 'shotgun' ? 'shells' : null; if (!it) continue;
      const r = me.inv[w].reserve;
      if (this.lastRes[w] == null) this.add(it, r);
      else if (r < this.lastRes[w]) this.remove(it, this.lastRes[w] - r);
      else if (r > this.lastRes[w]) this.add(it, r - this.lastRes[w]);
      me.inv[w].reserve = this.count(it); this.lastRes[w] = me.inv[w].reserve;
    }
    // objeto a mano para recoger
    this.prompt = this.open ? null : this.nearest(me);
    // teclas propias del modo (sin repetir pulsaciones)
    const inp = me.input;
    if (this.use) {
      this.use.t += dt; me.sprinting = false; me.adsT = 0; me.fireBlockT = Math.max(me.fireBlockT || 0, 0.1); me.reloadT = 0;
      if (me.zGrabbed) { this.cancelUse(); } else if (this.use.t >= this.use.dur) this.finishUse(); else this.useUI(this.use);
    }
    // linterna: gasta pilas; con poca carga parpadea y alumbra menos
    if (Zombies.flashOn) {
      this.battery = Math.max(0, this.battery - dt / BATTERY_LIFE);
      if (this.battery <= 0) { Zombies.flashOn = false; UI.toast(L({ es: 'LINTERNA SIN PILAS', en: 'FLASHLIGHT DEAD' }) + (this.count('battery') ? ` · <kbd>Tab</kbd> ${L({ es: 'cambiar pilas', en: 'swap batteries' })}` : ''), 3000); }
    }
    this.hudTick();
    void inp;
  },
  cancelUse() { if (!this.use) return; this.use = null; this.useUI(null); },

  // ---------------- teclado ----------------
  hookOnce() {
    if (this._hooked) return; this._hooked = true;
    window.addEventListener('keydown', (e) => {
      if (!G.mode || !G.mode.story || !G.match || e.repeat) return;
      const tag = (e.target && e.target.tagName) || ''; if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const me = G.local; if (!me || !me.alive || G.paused || Replay.playing) return;
      if (e.code === 'KeyI') { e.preventDefault(); this.toggle(); }
      else if (e.code === 'KeyX') { this.quickHeal(); }
      else if (e.code === 'KeyG' && !this.open) { this.throwReady(); }
    });
    BUS.on('damaged', (t, info, dmg) => { if (t === G.local && this.use && dmg >= 4) { this.cancelUse(); UI.toast(L({ es: 'INTERRUMPIDO', en: 'INTERRUPTED' }), 1000); } });
  },
  toggle() { this.open ? this.close(true) : this.openInv(); },
  openInv() {
    if (this.open || !G.local || !G.local.alive) return;
    this.open = true; this.sel = this.sel && this.slots[this.sel.i] ? this.sel : null;
    Input.releaseLock(); this.render();
    document.getElementById('inv').classList.add('on');
  },
  close(relock) {
    if (!this.open) { const el = document.getElementById('inv'); if (el) el.classList.remove('on'); return; }
    this.open = false;
    const el = document.getElementById('inv'); if (el) el.classList.remove('on');
    if (relock && G.match && !G.paused) Input.requestLock();
  },

  // ---------------- interfaz ----------------
  buildHud() {
    if (!document.getElementById('inv')) {
      const el = document.createElement('div'); el.id = 'inv'; el.className = 'inv';
      el.addEventListener('mousedown', (e) => e.stopPropagation());
      el.addEventListener('click', (e) => this.onClick(e));
      el.addEventListener('dblclick', (e) => { const c = e.target.closest('[data-slot]'); if (c) { this.select(+c.dataset.slot); this.primary(); } });
      document.getElementById('app').appendChild(el);
    }
    let h = document.getElementById('invHud');
    if (!h) { h = document.createElement('div'); h.id = 'invHud'; document.getElementById('hud').appendChild(h); }
    h.style.display = '';
    let u = document.getElementById('invUse');
    if (!u) { u = document.createElement('div'); u.id = 'invUse'; u.innerHTML = '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" class="bg"/><circle cx="32" cy="32" r="27" class="fg"/></svg><b></b>'; document.getElementById('hud').appendChild(u); }
    this._hudKey = '';
  },
  useUI(u) {
    const el = document.getElementById('invUse'); if (!el) return;
    if (!u) { el.style.display = 'none'; return; }
    el.style.display = 'block';
    const k = clamp(u.t / u.dur, 0, 1), I = ITEMS[u.id];
    el.querySelector('.fg').style.strokeDashoffset = String(170 * (1 - k));
    const txt = I.use.battery ? L({ es: 'Cambiando pilas…', en: 'Swapping batteries…' }) : u.id === 'pills' ? L({ es: 'Tomando analgésicos…', en: 'Taking painkillers…' }) : u.id === 'med' ? L({ es: 'Curándote…', en: 'Patching up…' }) : L({ es: 'Vendándote…', en: 'Bandaging…' });
    const b = el.lastChild; if (b.textContent !== txt) b.textContent = txt;
  },
  hudTick() {
    const h = document.getElementById('invHud'); if (!h) return;
    const heal = this.count('bandage') + this.count('med') + this.count('pills'), thr = this.count('bottle') + this.count('flare');
    const b = Math.round(this.battery * 100), on = Zombies.flashOn;
    const key = `${heal}|${thr}|${b}|${on}|${this.used()}|${this.cap()}|${this.ready}`;
    if (key === this._hudKey) return; this._hudKey = key;
    const cells = Array.from({ length: 5 }, (_, i) => `<i class="${this.battery * 5 > i + 0.15 ? 'f' : ''}"></i>`).join('');
    const tid = this.count(this.ready) ? this.ready : ['bottle', 'flare'].find((k) => this.count(k)) || this.ready;
    h.innerHTML = `<span class="bat ${b < 15 ? 'low' : ''} ${on ? '' : 'off'}"><kbd>L</kbd><em>${icon('flashlight')}</em><span class="cells">${cells}</span>${b}%</span>`
      + `<span class="${heal ? '' : 'none'}"><kbd>X</kbd>${L({ es: 'Curar', en: 'Heal' })} <b>${heal}</b></span>`
      + `<span class="${thr ? '' : 'none'}"><kbd>G</kbd>${escapeHtml(L(ITEMS[tid]))} <b>${this.count(tid)}</b></span>`
      + `<span><kbd>Tab</kbd>${L({ es: 'Bolsillos', en: 'Pockets' })} <b>${this.used()}/${this.cap()}</b></span>`;
  },
  promptHtml() {
    const w = this.prompt, I = ITEMS[w.id], k = `<kbd>${Input.keyName(Input.bindings.interact[0])}</kbd>`;
    const verb = I.slot && !this.equip[I.slot] ? L({ es: 'Equipar', en: 'Equip' }) : L({ es: 'Recoger', en: 'Pick up' });
    return `${k} ${verb} ${escapeHtml(L(I))}${w.n > 1 ? ' ×' + w.n : ''}`;
  },
  select(i) { this.sel = this.slots[i] ? { i } : null; this.render(); },
  onClick(e) {
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'slot') this.select(+a.dataset.slot);
    else if (act === 'eslot') { this.sel = this.equip[a.dataset.k] ? { eq: a.dataset.k } : null; this.render(); }
    else if (act === 'close') this.close(true);
    else if (act === 'use') this.primary();
    else if (act === 'ready') { const s = this.slots[this.sel.i]; if (s) { this.ready = s.id; UI.toast(L({ es: 'Preparado para lanzar (G): ', en: 'Ready to throw (G): ' }) + escapeHtml(L(ITEMS[s.id])), 1600); } this.render(); }
    else if (act === 'drop') {
      const me = G.local, s = this.sel && this.sel.i != null ? this.slots[this.sel.i] : null; if (!s || !me) return;
      const fw = dirFromYawPitch(me.input.yaw, 0, _v1);
      this.drop(s.id, s.n, me.pos.x + fw.x * 0.6, me.pos.y, me.pos.z + fw.z * 0.6);
      this.slots[this.sel.i] = null; this.compact(); this.sel = null; this.render();
    } else if (act === 'unequip') { this.unequip(this.sel.eq); this.sel = null; this.render(); }
  },
  primary() {
    if (!this.sel) return;
    if (this.sel.eq) { this.unequip(this.sel.eq); this.sel = null; this.render(); return; }
    const s = this.slots[this.sel.i]; if (!s) return;
    const I = ITEMS[s.id];
    if (I.use) this.startUse(s.id);
    else if (I.slot) { this.slots[this.sel.i] = null; this.compact(); this.equipItem(s.id); this.sel = null; }
    else if (I.throw) { this.ready = s.id; }
    this.render();
  },
  render() {
    const el = document.getElementById('inv'); if (!el || !this.open) return;
    const me = G.local, cap = this.cap(), outfit = me && me.custom.outfit === 'reo' ? { es: 'Mono de recluso', en: 'Inmate jumpsuit' } : { es: 'Pijama de paciente', en: 'Patient scrubs' };
    const cell = (i) => {
      const s = this.slots[i], locked = i >= cap, on = this.sel && this.sel.i === i;
      if (locked) return `<div class="cell lock" title="${L({ es: 'Necesitas una bolsa o mochila', en: 'You need a bag or backpack' })}"></div>`;
      if (!s) return `<div class="cell empty"></div>`;
      const I = ITEMS[s.id];
      return `<button class="cell ${on ? 'on' : ''} k-${I.kind}" data-act="slot" data-slot="${i}" title="${escapeHtml(L(I))}">${icon(s.id)}${I.stack > 1 ? `<b>${s.n}</b>` : ''}${I.throw && this.ready === s.id ? '<u>G</u>' : ''}</button>`;
    };
    const eslot = (k) => {
      const id = this.equip[k], on = this.sel && this.sel.eq === k;
      return `<button class="eslot ${id ? '' : 'empty'} ${on ? 'on' : ''}" data-act="eslot" data-k="${k}"><span class="ic">${id ? icon(id) : ''}</span><span class="tx"><small>${L(SLOT_NAMES[k])}</small><b>${id ? escapeHtml(L(ITEMS[id])) : L({ es: 'Vacío', en: 'Empty' })}</b></span></button>`;
    };
    const wrow = (w) => { if (!me || !me.inv[w]) return ''; const W = CONFIG.WEAPONS[w], iv = me.inv[w]; return `<div class="wrow">${icon(w)}<span>${escapeHtml(L(W.name))}</span><b>${w === 'knife' ? '—' : iv.mag + ' / ' + iv.reserve}</b></div>`; };
    // detalle del objeto elegido
    let det = `<p class="hint">${L({ es: 'Elige un objeto. Doble clic: usar o equipar.', en: 'Pick an item. Double-click: use or equip.' })}</p>`;
    const S = this.sel && this.sel.i != null ? this.slots[this.sel.i] : null, E = this.sel && this.sel.eq ? this.equip[this.sel.eq] : null;
    if (S || E) {
      const id = S ? S.id : E, I = ITEMS[id];
      const btn = [];
      if (S && I.use) btn.push(`<button class="btn" data-act="use">${I.use.battery ? L({ es: 'Cambiar pilas', en: 'Swap batteries' }) : L({ es: 'Usar', en: 'Use' })}</button>`);
      if (S && I.slot) btn.push(`<button class="btn" data-act="use">${L({ es: 'Equipar', en: 'Equip' })}</button>`);
      if (S && I.throw) btn.push(`<button class="btn" data-act="ready">${L({ es: 'Preparar (G)', en: 'Ready (G)' })}</button>`);
      if (E) btn.push(`<button class="btn" data-act="unequip">${L({ es: 'Quitar', en: 'Remove' })}</button>`);
      if (S) btn.push(`<button class="btn ghost" data-act="drop">${L({ es: 'Tirar', en: 'Drop' })}</button>`);
      det = `<div class="dico">${icon(id)}</div><div class="dtx"><b>${escapeHtml(L(I))}${S && S.n > 1 ? ' ×' + S.n : ''}</b><p>${escapeHtml(L(I.d))}</p><div class="btns">${btn.join('')}</div></div>`;
    }
    const busy = this.use ? `<div class="busy">${escapeHtml(L(ITEMS[this.use.id]))}…</div>` : '';
    const lk = Input.keyName(Input.bindings.scoreboard[0]);
    el.innerHTML = `<div class="invbox">
      <header><b>${L({ es: 'INVENTARIO', en: 'INVENTORY' })}</b><span class="sub">${L({ es: 'El tiempo no se detiene', en: 'Time keeps running' })}</span><button class="x" data-act="close"><kbd>${lk}</kbd> ${L({ es: 'cerrar', en: 'close' })}</button></header>
      <div class="invmain">
        <section class="col eq"><h4>${L({ es: 'EQUIPAMIENTO', en: 'EQUIPMENT' })}</h4>
          <div class="outfit"><small>${L({ es: 'Ropa', en: 'Clothes' })}</small><b>${L(outfit)}</b></div>
          ${eslot('torso')}${eslot('back')}
          <div class="eslot light"><span class="ic">${icon('flashlight')}</span><span class="tx"><small>${L(SLOT_NAMES.light)}</small><b>${Math.round(this.battery * 100)} % <i class="bbar"><i style="width:${Math.round(this.battery * 100)}%"></i></i></b></span></div>
          <h4>${L({ es: 'ARMAS', en: 'WEAPONS' })}</h4>${me ? [me.primary, me.secondary, 'knife'].filter((w, i, a) => a.indexOf(w) === i).map(wrow).join('') : ''}
        </section>
        <section class="col bag"><h4>${L({ es: 'BOLSILLOS', en: 'POCKETS' })} <span>${this.used()} / ${cap}</span></h4>
          <div class="cells">${Array.from({ length: INV_MAX }, (_, i) => cell(i)).join('')}</div>
          <div class="detail">${det}</div>${busy}
        </section>
      </div>
      <footer><span><kbd>X</kbd> ${L({ es: 'curarse', en: 'heal' })}</span><span><kbd>G</kbd> ${L({ es: 'lanzar', en: 'throw' })}</span><span><kbd>L</kbd> ${L({ es: 'linterna', en: 'flashlight' })}</span><span><kbd>${Input.keyName(Input.bindings.interact[0])}</kbd> ${L({ es: 'recoger', en: 'pick up' })}</span></footer>
    </div>`;
  },
};

let _flareGlow = null;
function flareGlowMat() {
  if (_flareGlow) return _flareGlow;
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 1, 32, 32, 31);
  g.addColorStop(0, 'rgba(255,240,220,1)'); g.addColorStop(0.2, 'rgba(255,90,60,.9)'); g.addColorStop(1, 'rgba(255,30,20,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  _flareGlow = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
  return _flareGlow;
}
// modelos de los objetos en el mundo (pequeños, colores sobrios; se leen con la linterna)
function itemMesh(id) {
  const g = new THREE.Group(), add = (geo, color, x, y, z, o = {}) => { const m = new THREE.Mesh(geo, MAT.lam(color)); m.position.set(x, y, z); if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; if (o.ry) m.rotation.y = o.ry; m.castShadow = true; g.add(m); return m; };
  switch (id) {
    case 'med': add(GEO.box(0.34, 0.2, 0.24), 0xb8b8b0, 0, 0.1, 0); add(GEO.box(0.2, 0.01, 0.06), 0x9a1a14, 0, 0.205, 0); add(GEO.box(0.06, 0.01, 0.2), 0x9a1a14, 0, 0.205, 0); add(GEO.box(0.1, 0.03, 0.03), 0x6a6a64, 0, 0.215, 0.07); break;
    case 'bandage': add(GEO.cyl(0.045, 0.045, 0.08, 12), 0xe0dcd0, 0, 0.045, 0, { rz: Math.PI / 2 }); add(GEO.box(0.12, 0.004, 0.06), 0xe0dcd0, 0.09, 0.004, 0.02, { ry: 0.4 }); break;
    case 'pills': add(GEO.cyl(0.028, 0.028, 0.08, 10), 0xc8742a, 0, 0.04, 0); add(GEO.cyl(0.031, 0.031, 0.025, 10), 0xe8e4d8, 0, 0.09, 0); break;
    case 'ammo9': add(GEO.box(0.16, 0.06, 0.1), 0x4a5236, 0, 0.03, 0); add(GEO.box(0.14, 0.012, 0.03), 0xb8902c, 0, 0.066, 0); break;
    case 'shells': add(GEO.box(0.18, 0.08, 0.1), 0x8a2a1e, 0, 0.04, 0); for (let i = 0; i < 3; i++) add(GEO.cyl(0.011, 0.011, 0.06, 6), 0xc9a23a, -0.05 + i * 0.05, 0.11, 0); break;
    case 'battery': for (const x of [-0.025, 0.025]) { add(GEO.cyl(0.016, 0.016, 0.06, 8), 0x2a2c2e, x, 0.016, 0, { rz: Math.PI / 2 }); add(GEO.cyl(0.0165, 0.0165, 0.015, 8), 0xc9a23a, x + 0.02, 0.016, 0, { rz: Math.PI / 2 }); } break;
    case 'bottle': add(GEO.cyl(0.035, 0.035, 0.18, 10), 0x2f5a2c, 0, 0.09, 0); add(GEO.cyl(0.012, 0.03, 0.07, 10), 0x2f5a2c, 0, 0.215, 0); add(GEO.cyl(0.036, 0.036, 0.06, 10), 0xc8bc9a, 0, 0.09, 0); break;
    case 'flare': add(GEO.cyl(0.016, 0.016, 0.22, 8), 0xb8322a, 0, 0.016, 0, { rz: Math.PI / 2 }); add(GEO.cyl(0.018, 0.018, 0.04, 8), 0x2a2a28, 0.12, 0.016, 0, { rz: Math.PI / 2 }); break;
    case 'satchel': add(GEO.rbox(0.32, 0.22, 0.12, 0.03), 0x8a7a5a, 0, 0.11, 0); add(GEO.box(0.33, 0.1, 0.13), 0x7a6a4a, 0, 0.18, 0); add(GEO.box(0.04, 0.01, 0.5), 0x5a4a32, 0.1, 0.005, 0.2, { ry: 0.6 }); break;
    case 'backpack': add(GEO.rbox(0.3, 0.42, 0.18, 0.05), 0x4a5236, 0, 0.09, 0, { rx: -Math.PI / 2 + 0.15 }); add(GEO.box(0.22, 0.14, 0.08), 0x3a4028, 0, 0.19, -0.08, { rx: -Math.PI / 2 + 0.15 }); break;
    case 'vest': add(GEO.rbox(0.42, 0.06, 0.5, 0.02), 0x2a3440, 0, 0.03, 0); add(GEO.box(0.4, 0.01, 0.08), 0xd8d4c4, 0, 0.065, 0.06); add(GEO.box(0.12, 0.05, 0.14), 0x24303c, 0, 0.06, -0.24); break;
    default: add(GEO.box(0.15, 0.1, 0.15), 0x888888, 0, 0.05, 0);
  }
  return g;
}
