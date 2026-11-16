// ---- 12b_modes.js ----
// =====================================================================
// MODOS NUEVOS — Placas (baja confirmada), Duelo de escuadras y
// Escalada de armas. Se apoyan en las reglas base (12_rules.js).
// =====================================================================

// ---------------- Escalada de armas: la escalera ----------------
const LADDER = ['pistol', 'hp45', 'tsmg', 'smg', 'shotgun', 'rifle', 'dmr', 'battle', 'mg2', 'lmg', 'sniper', 'knife'];
const ladderName = (i) => { const w = CONFIG.WEAPONS[LADDER[Math.min(i, LADDER.length - 1)]]; return w ? L(w.name) : ''; };

// equipa el arma del peldaño (munición completa, sin granadas); la llama quien manda sobre ese soldado
Fighter.prototype.equipLadder = function (id) {
  const sec = CONFIG.WEAPONS[id] && CONFIG.WEAPONS[id].slot === 'secondary', knife = id === 'knife';
  const perk = (this.loadout && this.loadout.perk) || null, att = knife || sec ? null : defaultAtt(id);
  const W = knife ? CONFIG.WEAPONS.knife : weaponStats(id, att, perk), S = 'pistol', WS = weaponStats(S, null, perk);
  this.loadout = { ...this.loadout, primary: id, secondary: S, att: att || {}, frags: 0, smokes: 0 };
  this.ws = { [id]: W, [S]: WS, knife: CONFIG.WEAPONS.knife };
  this.primary = id; this.secondary = S;
  this.inv = { [id]: { mag: W.mag, reserve: W.reserve }, [S]: { mag: WS.mag, reserve: WS.reserve }, knife: { mag: Infinity, reserve: Infinity } };
  this.grenades = 0; this.smokes = 0; this.reloadT = 0; this.autoReloadT = 0;
  if (this.view) this.view.dropModel(id);
  this.weapon = null; this.setWeapon(id);
};

// ---------------- Placas: las placas que dejan los caídos ----------------
const Tags = {
  list: [], life: 30, radius: 1.5,
  add(victim, killer, pos) {
    if (!G.root || !victim || !killer || victim.team === killer.team) return;
    const id = victim.slot + ':' + victim.stats.deaths;
    if (this.list.some((t) => t.id === id)) return;
    const me = G.local, ref = me && me.team >= 0 ? me.team : 0, col = victim.team === ref ? 0x5ab8ff : 0xff5a3a;
    const g = new THREE.Group();
    const plate = new THREE.Mesh(GEO.box(0.2, 0.3, 0.035), MAT.basic(col)); plate.position.y = 0.75; g.add(plate);
    const hole = new THREE.Mesh(GEO.box(0.05, 0.05, 0.05), MAT.basic(0x202020)); hole.position.set(0, 0.86, 0.01); g.add(hole);
    const beam = new THREE.Mesh(GEO.box(0.05, 2.6, 0.05), MAT.basic(col, { transparent: true, opacity: 0.32, depthWrite: false })); beam.position.y = 1.3; g.add(beam);
    const ring = new THREE.Mesh(GEO.cyl(0.55, 0.55, 0.02, 18), MAT.basic(col, { transparent: true, opacity: 0.28, depthWrite: false })); ring.position.y = 0.05; g.add(ring);
    g.position.set(pos.x, pos.y, pos.z);
    G.root.add(g);
    this.list.push({ id, x: pos.x, y: pos.y, z: pos.z, vt: victim.team, kt: killer.team, life: this.life, g, plate, t0: Math.random() * 6 });
  },
  remove(i) { const t = this.list[i]; if (!t) return; if (t.g.parent) t.g.parent.remove(t.g); this.list.splice(i, 1); },
  clear() { while (this.list.length) this.remove(this.list.length - 1); },
  tick(dt, host) {
    const m = G.match; if (!m) return;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const t = this.list[i]; t.life -= dt;
      if (t.life <= 0) { this.remove(i); continue; }
      if (!host) continue;
      for (const f of G.fighters) {
        if (!f.alive || f.state === 'ragdoll' || f.team < 0) continue;
        const dx = f.pos.x - t.x, dz = f.pos.z - t.z;
        if (dx * dx + dz * dz < this.radius * this.radius && Math.abs(f.pos.y - t.y) < 2.3) { this.collect(t, f, true); break; }
      }
    }
  },
  collect(t, f, send) {
    const m = G.match, confirm = f.team !== t.vt, i = this.list.indexOf(t);
    if (i >= 0) this.remove(i);
    if (confirm) m.score[f.team] = (m.score[f.team] || 0) + 1;
    this.credit(f, confirm);
    if (send && NET.active && NET.isHost) NET.sendCtl({ k: 'tg', id: t.id, s: f.slot, c: confirm ? 1 : 0, sc: [m.score[0], m.score[1]] });
  },
  credit(f, confirm) {
    const id = confirm ? 'confirm' : 'deny';
    if (confirm) f.stats.tags = (f.stats.tags || 0) + 1; else f.stats.denies = (f.stats.denies || 0) + 1;
    f.stats.medals[id] = (f.stats.medals[id] || 0) + 1; f.stats.score += MEDALS[id].pts;
    BUS.emit('medal', f, id);
    BUS.emit('tagTaken', f, confirm);
  },
  // mensaje del anfitrión: alguien recogió la placa
  remote(d) {
    const i = this.list.findIndex((t) => t.id === d.id); if (i >= 0) this.remove(i);
    const f = NET.bySlot(d.s); if (G.match && d.sc) G.match.score = { 0: d.sc[0], 1: d.sc[1] };
    if (f) this.credit(f, !!d.c);
  },
  nearestFor(f, r) {
    let best = null, bd = r * r;
    for (const t of this.list) { const d = (t.x - f.pos.x) ** 2 + (t.z - f.pos.z) ** 2; if (d < bd) { bd = d; best = t; } }
    return best;
  },
  animate(dt) {
    for (const t of this.list) {
      t.t0 += dt; t.plate.rotation.y += dt * 3.2; t.plate.position.y = 0.75 + Math.sin(t.t0 * 3) * 0.07;
      t.g.visible = t.life > 6 || Math.sin(t.life * 14) > -0.3;
    }
  },
};
BUS.on('tagTaken', (f, confirm) => {
  if (f !== G.local || G.attract) return;
  UI.toast(confirm ? L({ es: '✔ PLACA CONFIRMADA', en: '✔ TAG CONFIRMED' }) : L({ es: '✖ PLACA DENEGADA', en: '✖ TAG DENIED' }), 1300);
  AUDIO.play('medal', null, 0.45);
});
BUS.on('ladder', (f, rung) => {
  if (f !== G.local || G.attract || !G.match || G.match.over) return;
  if (rung >= LADDER.length) return;
  UI.toast(`${L({ es: 'ARMA', en: 'WEAPON' })} ${rung + 1}/${LADDER.length} · ${escapeHtml(ladderName(rung)).toUpperCase()}`, 1500);
});
BUS.on('ladderDown', (v) => {
  if (v !== G.local || G.attract) return;
  UI.toast(`<span style="color:var(--enemy)">${L({ es: 'DEGRADADO POR CUCHILLO', en: 'KNIFED — DOWN A RUNG' })}</span>`, 1800);
});

