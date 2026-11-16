// ---- 12_rules.js ----
// =====================================================================
// REGLAS y MODOS — Todos contra todos, Duelo por equipos, Dominio y
// Eliminación por rondas. Reaparición segura, marcador, medallas,
// asistencias, rachas y récords.
// =====================================================================
const MODES = {
  tdm: { id: 'tdm', name: { es: 'Duelo por equipos', en: 'Team Deathmatch' }, desc: { es: 'Dos escuadras. Cada baja suma un punto para tu equipo.', en: 'Two squads. Every kill scores a point for your team.' }, teams: true, respawn: true, scoreLimit: 40, time: 480 },
  ffa: { id: 'ffa', name: { es: 'Todos contra todos', en: 'Free-for-all' }, desc: { es: 'Cada quien por su cuenta. Gana el primero en llegar a las bajas.', en: 'Every soldier for themselves. First to the kill limit wins.' }, teams: false, respawn: true, scoreLimit: 20, time: 420 },
  dom: { id: 'dom', name: { es: 'Dominio', en: 'Domination' }, desc: { es: 'Captura y defiende A, B y C. Cada punto en tu poder suma con el tiempo.', en: 'Capture and hold A, B and C. Each point you hold scores over time.' }, teams: true, respawn: true, scoreLimit: 200, time: 600, dom: true },
  elim: { id: 'elim', name: { es: 'Eliminación', en: 'Elimination' }, desc: { es: 'Sin reaparición. Gana la ronda el equipo que quede en pie. Al mejor de 5.', en: 'No respawns. Last squad standing wins the round. Best of 5.' }, teams: true, respawn: false, rounds: true, winRounds: 3, time: 120 },
  tags: { id: 'tags', name: { es: 'Placas', en: 'Kill Confirmed' }, desc: { es: 'Las bajas no suman: recoge la placa del enemigo caído para confirmarla y la de un compañero para negarla.', en: 'Kills do not score: grab the fallen enemy\'s tag to confirm it, and a teammate\'s tag to deny it.' }, teams: true, respawn: true, scoreLimit: 40, time: 600, tags: true },
  squads: { id: 'squads', name: { es: 'Duelo de escuadras', en: 'Squad Duel' }, desc: { es: '2 vs 2 o 3 vs 3, sin reaparición y rondas de 75 s. Gana quien tome 4 rondas. Ideal en mapas pequeños.', en: '2v2 or 3v3, no respawns, 75 s rounds. First to 4 rounds wins. Great on small maps.' }, teams: true, respawn: false, rounds: true, winRounds: 4, time: 75, sizes: [4, 6] },
  gun: { id: 'gun', name: { es: 'Escalada de armas', en: 'Gun Game' }, desc: { es: 'Cada baja te da un arma nueva, de la pistola reglamentaria al cuchillo de trinchera. Una cuchillada baja de nivel al rival. Gana quien complete los 12 peldaños.', en: 'Every kill gives you a new weapon, from service pistol to trench knife. A knife kill sets the victim back a rung. First to clear all 12 wins.' }, teams: false, respawn: true, time: 480, ladder: true },
};
MODES.range = { id: 'range', name: { es: 'Campo de tiro', en: 'Shooting range' }, desc: { es: 'Practica con cualquier arma contra blancos fijos y móviles. No da experiencia.', en: 'Practise with any weapon on fixed and moving targets. Gives no XP.' }, teams: false, respawn: true, range: true, time: Infinity };
const MODE_ORDER = ['tdm', 'ffa', 'dom', 'elim', 'tags', 'squads', 'gun'];
// tamaño de cada mapa y modos que mejor le van
const MAP_INFO = { pueblo: 'big', base: 'big', muelle: 'big', patio: 'small', bunker: 'small', cruce: 'small' };
const MAP_IDEAL = { big: ['dom', 'tdm', 'ffa'], small: ['squads', 'gun', 'elim'] };

// medallas: tier 1 bronce · 2 plata · 3 oro; shape = forma del emblema; g = símbolo
const MEDALS = {
  first:      { es: 'Primera sangre', en: 'First Blood', pts: 50, tier: 2, shape: 'circle', g: '1', d: { es: 'La primera baja de la partida.', en: 'First kill of the match.' } },
  double:     { es: 'Doble baja', en: 'Double Kill', pts: 50, tier: 1, shape: 'hex', g: 'II', d: { es: 'Dos bajas en menos de 4 s.', en: 'Two kills within 4 s.' } },
  triple:     { es: 'Triple baja', en: 'Triple Kill', pts: 100, tier: 2, shape: 'hex', g: 'III', d: { es: 'Tres bajas seguidas sin pausa.', en: 'Three kills in quick succession.' } },
  fury:       { es: 'Furia', en: 'Fury Kill', pts: 150, tier: 3, shape: 'hex', g: 'IV', d: { es: 'Cuatro bajas seguidas sin pausa.', en: 'Four kills in quick succession.' } },
  frenzy:     { es: 'Frenesí', en: 'Frenzy', pts: 250, tier: 3, shape: 'hex', g: 'V', d: { es: 'Cinco o más bajas seguidas sin pausa.', en: 'Five or more kills in quick succession.' } },
  streak5:    { es: 'Racha de 5', en: '5 Killstreak', pts: 100, tier: 1, shape: 'star', g: '5', d: { es: 'Cinco bajas sin morir.', en: 'Five kills without dying.' } },
  streak10:   { es: 'Imparable', en: 'Unstoppable', pts: 200, tier: 2, shape: 'star', g: '10', d: { es: 'Diez bajas sin morir.', en: 'Ten kills without dying.' } },
  streak15:   { es: 'Leyenda de guerra', en: 'War Legend', pts: 350, tier: 3, shape: 'star', g: '15', d: { es: 'Quince bajas sin morir.', en: 'Fifteen kills without dying.' } },
  headshot:   { es: 'Tiro a la cabeza', en: 'Headshot', pts: 25, tier: 1, shape: 'circle', g: '✕', d: { es: 'Baja con disparo a la cabeza.', en: 'Kill with a shot to the head.' } },
  eagle:      { es: 'Ojo de halcón', en: 'Eagle Eye', pts: 100, tier: 3, shape: 'circle', g: '◎', d: { es: 'Tiro a la cabeza a más de 40 m.', en: 'Headshot from over 40 m.' } },
  longshot:   { es: 'Larga distancia', en: 'Longshot', pts: 50, tier: 2, shape: 'shield', g: '⌖', d: { es: 'Baja con bala a más de 42 m.', en: 'Bullet kill from over 42 m.' } },
  pointBlank: { es: 'A quemarropa', en: 'Point Blank', pts: 25, tier: 1, shape: 'shield', g: '•', d: { es: 'Baja con bala a menos de 2,5 m.', en: 'Bullet kill from under 2.5 m.' } },
  oneShot:    { es: 'Un disparo', en: 'One Shot', pts: 50, tier: 2, shape: 'shield', g: '1', d: { es: 'Una sola bala, de vida completa a cero.', en: 'One bullet, full health to zero.' } },
  quick:      { es: 'Baja rápida', en: 'Quick Kill', pts: 50, tier: 1, shape: 'shield', g: '⚡', d: { es: 'Del primer impacto a la baja en menos de medio segundo.', en: 'From first hit to kill in under half a second.' } },
  hipfire:    { es: 'Desde la cadera', en: 'Hip Fire', pts: 25, tier: 1, shape: 'shield', g: '⤳', d: { es: 'Baja sin apuntar a más de 12 m.', en: 'Kill without aiming from over 12 m.' } },
  collateral: { es: 'Colateral', en: 'Collateral', pts: 150, tier: 3, shape: 'shield', g: '⇉', d: { es: 'Dos bajas con la misma bala.', en: 'Two kills with one bullet.' } },
  wallbang:   { es: 'A través de la pared', en: 'Wallbang', pts: 75, tier: 2, shape: 'shield', g: '▥', d: { es: 'Baja a través de madera, lámina o yeso.', en: 'Kill through wood, sheet metal or plaster.' } },
  blind:      { es: 'A ciegas', en: 'Blind Fire', pts: 75, tier: 2, shape: 'shield', g: '◍', d: { es: 'Baja a través del humo.', en: 'Kill through smoke.' } },
  airborne:   { es: 'En el aire', en: 'Airborne', pts: 50, tier: 2, shape: 'shield', g: '⇡', d: { es: 'Baja mientras saltas o caes.', en: 'Kill while jumping or falling.' } },
  slide:      { es: 'Deslizando', en: 'Slide Kill', pts: 50, tier: 2, shape: 'shield', g: '⟋', d: { es: 'Baja mientras te deslizas.', en: 'Kill while sliding.' } },
  knife:      { es: 'Cuchillada', en: 'Knife Kill', pts: 50, tier: 1, shape: 'diamond', g: '†', d: { es: 'Baja con el cuchillo.', en: 'Knife kill.' } },
  backstab:   { es: 'Por la espalda', en: 'Backstab', pts: 100, tier: 2, shape: 'diamond', g: '‡', d: { es: 'Cuchillada a un enemigo de espaldas.', en: 'Knife an enemy from behind.' } },
  pistol:     { es: 'Pistolero', en: 'Gunslinger', pts: 25, tier: 1, shape: 'diamond', g: 'P', d: { es: 'Baja con la pistola.', en: 'Pistol kill.' } },
  nade:       { es: 'Granada', en: 'Grenade Kill', pts: 50, tier: 1, shape: 'burst', g: '◆', d: { es: 'Baja con granada.', en: 'Grenade kill.' } },
  cooked:     { es: 'Bien cocinada', en: 'Cooked', pts: 75, tier: 2, shape: 'burst', g: '♨', d: { es: 'Baja con una granada cocinada casi hasta el final.', en: 'Kill with a grenade cooked almost to the end.' } },
  explosive:  { es: 'Demolición', en: 'Demolition', pts: 50, tier: 1, shape: 'burst', g: '✸', d: { es: 'Baja con cohete o barril.', en: 'Rocket or barrel kill.' } },
  direct:     { es: 'Impacto directo', en: 'Direct Hit', pts: 75, tier: 2, shape: 'burst', g: '➚', d: { es: 'El cohete le dio de lleno.', en: 'The rocket hit dead on.' } },
  bomber:     { es: 'Bombardero', en: 'Bomber', pts: 100, tier: 2, shape: 'burst', g: '✸✸', d: { es: 'Dos bajas con una sola explosión.', en: 'Two kills with one explosion.' } },
  carnage:    { es: 'Carnicería', en: 'Carnage', pts: 200, tier: 3, shape: 'burst', g: '✸3', d: { es: 'Tres o más bajas con una sola explosión.', en: 'Three or more kills with one explosion.' } },
  support:    { es: 'Fuego de apoyo', en: 'Fire Support', pts: 50, tier: 1, shape: 'burst', g: '✈', d: { es: 'Baja con mortero o ataque aéreo.', en: 'Mortar or airstrike kill.' } },
  revenge:    { es: 'Venganza', en: 'Revenge', pts: 50, tier: 1, shape: 'chev', g: '↺', d: { es: 'Baja a quien te mató la última vez.', en: 'Kill the one who last killed you.' } },
  buzzkill:   { es: 'Corta rachas', en: 'Buzzkill', pts: 75, tier: 2, shape: 'chev', g: '⨯', d: { es: 'Acaba con un enemigo con racha de 3 o más.', en: 'End an enemy streak of 3 or more.' } },
  kingslayer: { es: 'Cazarreyes', en: 'Kingslayer', pts: 100, tier: 3, shape: 'chev', g: '♛', d: { es: 'Baja al mejor jugador de la partida.', en: 'Kill the top player of the match.' } },
  comeback:   { es: 'Regreso', en: 'Comeback', pts: 50, tier: 1, shape: 'chev', g: '↗', d: { es: 'Una baja tras morir tres veces seguidas.', en: 'A kill after dying three times in a row.' } },
  lastBreath: { es: 'Al límite', en: 'Last Breath', pts: 75, tier: 2, shape: 'chev', g: '♥', d: { es: 'Baja con menos de 25 de vida.', en: 'Kill with under 25 health.' } },
  afterlife:  { es: 'Desde la tumba', en: 'Afterlife', pts: 100, tier: 3, shape: 'chev', g: '✝', d: { es: 'Baja después de haber muerto.', en: 'Kill after you died.' } },
  saviour:    { es: 'Salvador', en: 'Saviour', pts: 50, tier: 1, shape: 'cross', g: '✚', d: { es: 'Baja a quien estaba hiriendo a un compañero.', en: 'Kill an enemy who was hurting a teammate.' } },
  defender:   { es: 'Defensor', en: 'Defender', pts: 50, tier: 1, shape: 'cross', g: '⛨', d: { es: 'Baja cerca de un punto de tu equipo.', en: 'Kill near a point your team holds.' } },
  capture:    { es: 'Captura', en: 'Capture', pts: 150, tier: 2, shape: 'cross', g: '⚑', d: { es: 'Capturar un punto de Dominio.', en: 'Capture a Domination point.' } },
  confirm:    { es: 'Baja confirmada', en: 'Kill Confirmed', pts: 50, tier: 1, shape: 'cross', g: '✔', d: { es: 'Recoger la placa de un enemigo caído.', en: 'Pick up a fallen enemy\'s tag.' } },
  deny:       { es: 'Baja denegada', en: 'Kill Denied', pts: 25, tier: 1, shape: 'shield', g: '✖', d: { es: 'Recoger la placa de un compañero caído.', en: 'Pick up a fallen teammate\'s tag.' } },
  lastStand:  { es: 'Último en pie', en: 'Last Stand', pts: 150, tier: 3, shape: 'cross', g: '▲', d: { es: 'Ganar la ronda como último de tu equipo.', en: 'Win the round as your team\'s last soldier.' } },
};
// orden para elegir la medalla principal cuando una baja gana varias
const MEDAL_RANK = (id) => (MEDALS[id] ? MEDALS[id].tier * 1000 + MEDALS[id].pts : 0);
const BOT_NAMES = ['Cuervo', 'Lobo', 'Halcón', 'Toro', 'Puma', 'Jaguar', 'Coyote', 'Zorro', 'Águila', 'Tigre', 'Oso', 'Búho', 'Cobra', 'Pantera', 'Lince', 'Bisonte', 'Tejón', 'Gavilán', 'Mapache', 'Alacrán'];
const BOT_RANKS = { es: ['Sdo.', 'Cbo.', 'Sgto.', 'Tte.'], en: ['Pvt.', 'Cpl.', 'Sgt.', 'Lt.'] };

const Rules = {
  isHost() { return !NET.active || NET.isHost; },
  canAuthor(f) { return !NET.active || NET.isAuthorityFor(f); },
  canSimulate(f) { return f && f.kind !== 'remote'; },
  isEnemy(a, b) { return a !== b && (!G.mode.teams || a.team !== b.team); },

  // ------------------- partida -------------------
  startMatch(cfg) {
    this.endMatch(true);
    G.attract = !!cfg.attract;
    G.mode = MODES[cfg.mode] || MODES.tdm;
    G.matchCfg = cfg;
    if (!G.mode.story && typeof UI !== 'undefined' && UI.el && UI.el['streak-box']) UI.el['streak-box'].style.display = '';
    // "Aleatorio": cada partida (y cada revancha) sortea momento del día y clima; con la misma semilla todos en línea ven lo mismo
    if ((cfg.envChoice || cfg.env) === 'random') { cfg.envChoice = 'random'; cfg.env = randomEnv(new RNG(hash32('env', cfg.seed ?? ((Math.random() * 1e9) >>> 0)))); }
    MapSys.load(cfg.map);
    const seed = cfg.seed ?? (Math.random() * 1e9) >>> 0;
    const roster = cfg.roster || this.defaultRoster(cfg);
    const m = { seed, round: 0, phase: 'countdown', phaseT: 0, time: 0, score: { 0: 0, 1: 0 }, roundWins: { 0: 0, 1: 0 }, winner: null, over: false, first: false,
      dom: MapSys.dom.map(() => ({ owner: -1, prog: 0, cap: -1 })), domT: 0, limit: G.mode.scoreLimit, lastAliveShown: {} };
    // límite según cantidad de jugadores
    if (G.mode.scoreLimit && !G.mode.dom) m.limit = Math.max(G.mode.teams ? 15 : 10, Math.round(G.mode.scoreLimit * clamp(roster.length / 8, 0.5, 1)));
    if (G.mode.ladder) m.limit = LADDER.length;
    G.match = m;
    G.fighters = [];
    for (const r of roster) {
      const lo = r.loadout || (r.lo ? unpackLoadout(r.lo) : null);
      const f = new Fighter({ slot: r.slot, kind: r.kind, name: r.name, custom: r.custom, team: G.mode.teams ? (r.team ?? r.slot % 2) : -1, peer: r.peer, difficulty: r.difficulty || cfg.difficulty, primary: r.primary, loadout: lo, level: r.level || 1 });
      if (r.station) { f.dummy = true; f.station = r.station; }
      if (r.zombie) { f.zombie = true; f.brain = new ZombieBrain(f); }
      else if (r.kind === 'bot') f.brain = new BotBrain(f, r.difficulty || cfg.difficulty || 'normal');
      if (r.kind === 'local') { f.input = Input.state; G.local = f; f.resetState(); }
      f.rung = 0;
      G.fighters.push(f);
    }
    if (!G.fighters.some((f) => f.kind === 'local')) G.local = null;
    if (G.mode.dom) buildFlags(); else { for (const fl of MapSys.flags) MapSys.decor.remove(fl.group); MapSys.flags = []; }
    this.startRound();
    if (G.mode.story) Zombies.reset();
    BUS.emit('matchStart', m);
  },
  defaultRoster(cfg) {
    const s = G.settings, list = [];
    if (cfg.mode === 'carcel') return Zombies.roster(cfg);
    // campaña: solo Santiago (los demás personajes los pone cada escena)
    if (cfg.mode === 'campaign') return [{ slot: 0, kind: 'local', name: 'Santiago', custom: { ...DEFAULT_SETTINGS.custom }, team: -1, loadout: classLoadout('rifleman'), level: 1 }];
    if (cfg.mode === 'range') {
      list.push({ slot: 0, kind: 'local', name: s.name || 'Soldado', custom: { ...s.custom }, team: -1, loadout: localLoadout(), level: Progress.level() });
      MapSys.stations.forEach((st, i) => list.push({ slot: i + 1, kind: 'bot', name: st.name, team: -1, difficulty: 'easy', loadout: classLoadout('rifleman'), level: 1, station: st,
        custom: { camo: st.move ? 'urban' : 'dusk', helmet: st.move ? 'stahl' : 'cap', face: 'none', vest: 'webbing', skin: 1, pack: 'none', pads: 'shin', op: null } }));
      return list;
    }
    const total = clamp((cfg.bots ?? 5) + (cfg.attract ? 0 : 1), 2, CONFIG.MAX_FIGHTERS);
    const rng = new RNG((cfg.seed || 7) ^ 0xbeef);
    const names = shuffleInPlace(BOT_NAMES.slice(), rng.fork('names'));
    const teams = MODES[cfg.mode] ? MODES[cfg.mode].teams : true;
    const myTeam = cfg.team ?? 0;
    if (!cfg.attract) list.push({ slot: 0, kind: 'local', name: s.name || 'Soldado', custom: { ...s.custom }, team: myTeam, loadout: localLoadout(), level: Progress.level() });
    const helmets = Object.keys(HELMETS), faces = Object.keys(FACES), vests = Object.keys(VESTS), camos = Object.keys(CAMOS);
    let i = 0;
    while (list.length < total) {
      const slot = list.length;
      const team = teams ? (cfg.attract ? slot % 2 : (list.filter((r) => r.team === myTeam).length <= list.filter((r) => r.team !== myTeam).length ? myTeam : 1 - myTeam)) : -1;
      const rank = BOT_RANKS[LANG] ? rng.pick(BOT_RANKS[LANG]) : rng.pick(BOT_RANKS.es);
      const camo = rng.pick(camos);
      list.push({ slot, kind: 'bot', name: rank + ' ' + names[i++ % names.length], team: team < 0 ? -1 : team, difficulty: cfg.difficulty,
        loadout: botLoadout(rng), level: rng.int(1, 24),
        custom: teams && team >= 0 ? factionLook(rng, team, cfg.fac) : botLook(rng, camo, { helmets, faces, vests }) });
    }
    return list;
  },
  endMatch(silent) {
    Replay.stop(); Tags.clear(); Zombies.clear();
    for (const f of G.fighters) { if (f.ragdoll && !f.corpse) f.ragdoll.dispose(); if (f.view) f.view.dispose(); f.removeProxy(); }
    Corpses.clear();
    G.fighters = []; G.local = null;
    Grenades.clear(); Projectiles.clear(); Ballistics.clear(); WorldItems.clearDrops(); Smoke.clear(); Streaks.clear();
    if (FX.inited) FX.clear();
    G.match = null;
    if (!silent) BUS.emit('matchEnd');
  },

  // ------------------- ronda (en Eliminación hay varias; en el resto, una sola) -------------------
  startRound() {
    const m = G.match;
    m.round++;
    m.roundSeed = hash32(m.seed, m.round);
    G.roundSeed = m.roundSeed; G.rng = new RNG(m.roundSeed);
    m.time = 0; m.phase = 'countdown'; m.phaseT = G.attract || G.mode.range || G.mode.story || G.mode.campaign ? 0.3 : CONFIG.ROUND.countdown; m.winner = null; m.lastAliveShown = {};
    Tags.clear(); MapSys.reset(); Props.reset(); Rubble.clear(); Grenades.clear(); Projectiles.clear(); Ballistics.clear(); WorldItems.clearDrops(); WorldItems.resetStands(); Corpses.clear(); Smoke.clear(); Streaks.clear();
    for (const d of m.dom) { d.owner = -1; d.prog = 0; d.cap = -1; }
    if (FX.inited) FX.clear();
    const used = [];
    for (const f of [...G.fighters].sort((a, b) => a.slot - b.slot)) {
      if (f.ragdoll && !f.corpse) f.ragdoll.dispose();
      f.ragdoll = null; f.corpse = null;
      if (!this.canSimulate(f) && NET.active) { f.alive = false; continue; }
      if (f.zombie) { f.alive = false; f.hidden = true; continue; }
      const sp = this.pickSpawn(f, used, true); used.push(sp);
      f.spawn(sp.x, sp.y, sp.z, sp.yaw); this.postSpawn(f);
      f.respawnT = 0;
      if (f.brain) f.brain.reset();
    }
    G.freeze = true;
    Replay.reset();
    BUS.emit('roundStart', m);
  },

  // punto de aparición: lejos de enemigos vivos y fuera de su vista
  pickSpawn(f, used = [], initial = false) {
    const ms = MapSys;
    if (f.station) return { x: f.station.x, y: f.station.y || 0, z: f.station.z, yaw: f.station.yaw };
    let pts = G.mode.teams && f.team >= 0 ? ms.spawns[f.team] : ms.spawns.ffa;
    if (!pts || !pts.length) pts = ms.spawns.ffa.length ? ms.spawns.ffa : [{ x: 0, y: 0, z: 0, yaw: 0 }];
    const enemies = G.fighters.filter((o) => o.alive && o !== f && this.isEnemy(o, f));
    const friends = G.fighters.filter((o) => o.alive && o !== f && !this.isEnemy(o, f));
    const rng = G.rng || new RNG(1);
    // en equipos con reaparición: si el lado propio está tomado, usar puntos libres alejados
    if (!initial && G.mode.teams && G.mode.respawn) {
      const near = enemies.filter((e) => pts.some((p) => Math.hypot(p.x - e.pos.x, p.z - e.pos.z) < 14)).length;
      if (near >= 2) pts = [...pts, ...ms.spawns.ffa];
    }
    let best = pts[0], bs = -Infinity;
    for (const p of pts) {
      let s = rng.next() * 6;
      if (initial) { if (used.some((u) => Math.hypot(u.x - p.x, u.z - p.z) < 1.2)) s -= 100; }
      else {
        let md = 60;
        for (const e of enemies) { const d = Math.hypot(e.pos.x - p.x, e.pos.z - p.z); md = Math.min(md, d); if (d < 40) { _v1.set(p.x, p.y + 1.6, p.z); _v2.set(e.pos.x, e.pos.y + 1.5, e.pos.z); if (PHYS.lineOfSight(_v1, _v2)) s -= 22; } }
        s += md;
        if (G.mode.teams) for (const fr of friends) { const d = Math.hypot(fr.pos.x - p.x, fr.pos.z - p.z); if (d < 18) s += 4; }
        if (G.fighters.some((o) => o.alive && o !== f && Math.hypot(o.pos.x - p.x, o.pos.z - p.z) < 1.2)) s -= 60;
      }
      if (s > bs) { bs = s; best = p; }
    }
    return { x: best.x, y: best.y, z: best.z, yaw: best.yaw ?? 0 };
  },

  tick(dt) {
    const m = G.match; if (!m) return;
    const host = this.isHost();
    this.tickFighters(dt);
    if (m.phase === 'countdown') {
      m.phaseT -= dt;
      if (m.phaseT <= 0 && host) this.setPhase('fight');
      return;
    }
    if (m.phase === 'fight') {
      m.time += dt;
      if (G.mode.respawn) this.respawnTick(dt);
      if (G.mode.dom) this.domTick(dt, host);
      if (G.mode.tags) Tags.tick(dt, host);
      if (G.mode.story) Zombies.tick(dt);
      if (G.mode.rounds) this.lastAliveCheck();
      if (host) this.checkEnd();
      return;
    }
    if (m.phase === 'roundEnd') {
      m.phaseT -= dt;
      if (m.phaseT <= 0 && host && !Replay.playing) {
        if (m.over) this.setPhase('matchEnd'); else { this.startRound(); if (NET.active) NET.hostRoundStart(); }
      }
    }
    if (m.phase === 'matchEnd' && G.attract) { m.phaseT -= dt; if (m.phaseT <= 0) UI.startAttract(); }
  },
  setPhase(p) {
    const m = G.match; m.phase = p;
    if (p === 'fight') { G.freeze = false; BUS.emit('fight'); }
    if (p === 'matchEnd') { G.freeze = false; m.phaseT = 6; if (!G.attract) this.saveRecords(); BUS.emit('matchOver', m); }
    if (NET.active && NET.isHost) NET.hostPhase(p);
  },

  tickFighters(dt) {
    const F = CONFIG.FIGHTER, m = G.match;
    for (const f of G.fighters) {
      if (f.staggerT > 0) f.staggerT -= dt;
      if (f.flinchT > 0) f.flinchT -= dt;
      if (!this.canSimulate(f)) continue;
      if (f.invulnT > 0) f.invulnT -= dt;
      if (!f.alive) continue;
      // el límite del mapa es una pared invisible: las balas lo cruzan (sin dejar marcas en el aire) y se avisa al pegarse a él
      if (f === G.local && !G.attract && MapSys.bounds) {
        const bd = MapSys.bounds, r = 0.7;
        if (((f.pos.x < bd.x0 + r && f.vel.x < -0.4) || (f.pos.x > bd.x1 - r && f.vel.x > 0.4) || (f.pos.z < bd.z0 + r && f.vel.z < -0.4) || (f.pos.z > bd.z1 - r && f.vel.z > 0.4)) && G.time - (this._bndT || -9) > 5) {
          this._bndT = G.time; UI.toast(L({ es: 'LÍMITE DEL MAPA', en: 'MAP LIMIT' }), 1500);
        }
      }
      if (G.mode.range && f === G.local) { for (const w in f.inv) { const ws = f.ws[w]; if (ws && ws.reserve != null && f.inv[w].reserve < ws.reserve) f.inv[w].reserve = ws.reserve; } if (f.grenades < 2) f.grenades = 2; if (f.smokes < 1) f.smokes = 1; }
      // red de seguridad: fuera del mapa
      if (f.pos.y < CONFIG.KILL_Y) { this.kill(f, { kind: 'fall', weapon: 'fall' }); continue; }
      // regeneración tras unos segundos sin recibir daño
      const rg = G.mode.campaign && f === G.local ? Camp.diff().regen : 1;
      if (rg > 0 && f.hp < F.hp && !G.mode.story && G.time - f.lastDamageT > F.regenDelay / Math.max(0.5, rg) * (f.hasPerk && f.hasPerk('medic') ? 0.6 : 1) && m.phase !== 'countdown') f.hp = Math.min(F.hp, f.hp + F.regenRate * rg * (f.hasPerk && f.hasPerk('medic') ? 1.45 : 1) * dt);
    }
  },
  respawnTick(dt) {
    for (const f of G.fighters) {
      if (f.alive || !this.canSimulate(f)) continue;
      f.respawnT -= dt;
      if (f.respawnT > 0) continue;
      if (f === G.local && Replay.playing) continue;
      const sp = this.pickSpawn(f);
      f.spawn(sp.x, sp.y, sp.z, sp.yaw); this.postSpawn(f);
      if (f.brain) f.brain.reset();
    }
  },
  // campo de tiro: cambiar de clase equipa el arma al instante y reinicia las estadísticas de práctica
  rangeReset() { const f = G.local; if (f) { f.stats.shots = 0; f.stats.hits = 0; f.stats.damage = 0; f.stats.headshots = 0; } G.range = { hits: 0, head: 0, last: null, best: 0 }; },
  rangeRefit() {
    const f = G.local; if (!f || !f.alive || !G.mode || !G.mode.range) return;
    if (JSON.stringify(packLoadout(f.loadout)) === JSON.stringify(packLoadout(localLoadout()))) return;
    f.spawn(f.pos.x, f.pos.y, f.pos.z, f.yaw); f.invulnT = 0; this.rangeReset();
  },
  // Escalada de armas: al aparecer se equipa el arma de su peldaño
  postSpawn(f) { if (G.mode.story) Zombies.onSpawn(f); else if (G.mode.ladder && this.canAuthor(f)) f.equipLadder(LADDER[Math.min(f.rung || 0, LADDER.length - 1)]); },

  // ------------------- muerte -------------------
  kill(t, info) {
    if (!t.alive) return;
    const m = G.match;
    let killer = info.attacker && info.attacker !== t ? info.attacker : null;
    if (!killer && t.lastAttacker && G.time - t.lastAttackerT < CONFIG.FIGHTER.lastHitCredit && t.lastAttacker !== t && info.kind !== 'fall') killer = t.lastAttacker;
    if (killer && !this.isEnemy(killer, t)) killer = null;
    const deathPos = t.pos.clone();
    // datos de la víctima antes de morir (para medallas)
    const vStreak = t.stats.streak, vYaw = t.yaw, lead = this.leader(), vLeader = lead === t && t.stats.kills >= 3;
    const dropW = !G.mode.ladder && !G.mode.range && !t.zombie && t.primary && t.inv[t.primary] && !info.fromNet && this.canAuthor(t) ? { w: t.primary, ammo: { ...t.inv[t.primary] }, att: t.attFor(t.primary) } : null;
    t.die(info);
    t.respawnT = G.mode.range ? 2.2 : G.mode.respawn ? CONFIG.ROUND.respawnTime : Infinity;
    t.stats.deaths++; t.stats.streak = 0; t.deathsInRow = (t.deathsInRow || 0) + 1;
    const headshot = info.part === 'head' && (info.kind === 'bullet');
    const dist = killer ? killer.pos.distanceTo(deathPos) : 0;
    const medals = [];
    const assists = [];
    if (killer) {
      killer.stats.kills++; killer.stats.score += 100;
      const W = info.weapon, bullet = info.kind === 'bullet';
      if (killer === G.local && !G.attract && !G.mode.range && !G.mode.story && !G.mode.campaign && CONFIG.WEAPONS[W]) Progress.addKill(W);
      // lo que el atacante sabe de sus propios impactos (sirve también en línea, donde la muerte llega por red)
      const hl = killer.hitLog && killer.hitLog.get(t); if (hl) killer.hitLog.delete(t);
      const x = hl && G.time - hl.t < 1.5 ? hl : {};
      const cooked = info.cooked ?? x.cooked, direct = info.direct != null ? info.direct === t : x.direct, pen = info.pen ?? x.pen, shot = info.shot ?? x.shot, boom = info.boom ?? x.boom;
      if (killer === G.local && !G.attract && !G.mode.range && !G.mode.story && !G.mode.campaign && bullet && CONFIG.PRIMARIES.includes(W)) {
        try { const r = Progress.onKill(W, { head: headshot, dist, pen: !!pen, atts: attCount(W, killer.attFor(W)) }); if (r) BUS.emit('wprogress', W, r); } catch (e) { reportError(e); }
      }
      // las bajas de las rachas no alimentan la siguiente racha
      const fromStreak = W === 'mortar' || W === 'air';
      if (!fromStreak) { killer.stats.streak++; if (!G.mode.story) Streaks.onStreak(killer); }
      killer.stats.bestStreak = Math.max(killer.stats.bestStreak, killer.stats.streak);
      if (headshot) { killer.stats.headshots++; medals.push(dist >= 40 ? 'eagle' : 'headshot'); }
      if (W === 'knife') {
        killer.stats.knife++;
        const fx = -Math.sin(vYaw), fz = -Math.cos(vYaw), dx = killer.pos.x - deathPos.x, dz = killer.pos.z - deathPos.z, dl = Math.hypot(dx, dz) || 1;
        medals.push((fx * dx + fz * dz) / dl < -0.3 ? 'backstab' : 'knife');
      }
      if (bullet && CONFIG.WEAPONS[W] && CONFIG.WEAPONS[W].slot === 'secondary') medals.push('pistol');
      if (W === 'frag') { killer.stats.nades++; medals.push(cooked ? 'cooked' : 'nade'); }
      if (W === 'rocket' || W === 'barrel') medals.push(direct && W === 'rocket' ? 'direct' : 'explosive');
      if (fromStreak) medals.push('support');
      // varias bajas con una misma explosión
      if (info.kind === 'explosion') {
        const same = killer._boomT != null && G.time - killer._boomT < 0.4 && (boom == null || killer._boomId == null || boom === killer._boomId);
        killer._boomN = same ? (killer._boomN || 1) + 1 : 1; killer._boomT = G.time; killer._boomId = boom ?? null;
        if (killer._boomN === 2) medals.push('bomber'); else if (killer._boomN === 3) medals.push('carnage');
      }
      if (bullet) {
        if (dist >= 42) medals.push('longshot'); else if (dist < 2.5) medals.push('pointBlank');
        if (hl && hl.n === 1 && hl.full) medals.push('oneShot');
        else if (hl && hl.n >= 2 && G.time - hl.t0 <= 0.5) medals.push('quick');
        if (W !== 'shotgun' && killer.adsT < 0.2 && dist > 12) medals.push('hipfire');
        if (pen) medals.push('wallbang');
        // colateral: otra baja con la misma bala (o el mismo disparo de escopeta)
        if (shot != null && killer._shotId === shot && G.time - killer._shotT < 0.15) medals.push('collateral');
        killer._shotId = shot ?? null; killer._shotT = G.time;
        if (killer.alive && !killer.grounded && !killer.mantle && killer.state === 'stand') medals.push('airborne');
        if (killer.alive && killer.sliding) medals.push('slide');
        if (killer.alive && Smoke.list.length && Smoke.blocks(eyePosOf(killer, _v6), _v7.set(deathPos.x, deathPos.y + 1.1, deathPos.z))) medals.push('blind');
      }
      if (dist > killer.stats.longest) killer.stats.longest = dist;
      if (m && !m.first) { m.first = true; medals.push('first'); }
      const multi = G.time - (killer.lastKillT || -9) < 4 ? (killer.multi || 1) + 1 : 1;
      killer.multi = multi; killer.lastKillT = G.time;
      if (multi === 2) medals.push('double'); else if (multi === 3) medals.push('triple'); else if (multi === 4) medals.push('fury'); else if (multi >= 5) medals.push('frenzy');
      if (killer.nemesis === t) { medals.push('revenge'); killer.nemesis = null; }
      if (!fromStreak) { const st = killer.stats.streak; if (st === 5) medals.push('streak5'); else if (st === 10) medals.push('streak10'); else if (st === 15) medals.push('streak15'); }
      if (vStreak >= 3) medals.push('buzzkill');
      if (vLeader && killer !== lead) medals.push('kingslayer');
      if ((killer.deathsInRow || 0) >= 3) medals.push('comeback');
      killer.deathsInRow = 0;
      if (!killer.alive) medals.push('afterlife'); else if (killer.hp < 25) medals.push('lastBreath');
      // salvador: el muerto acababa de dañar a un compañero del asesino
      if (G.mode.teams && G.fighters.some((o) => o !== killer && o.alive && o.team === killer.team && o.lastAttacker === t && G.time - o.lastAttackerT < 2.5)) medals.push('saviour');
      t.nemesis = killer;
      if (G.mode.teams && m) m.score[killer.team] = (m.score[killer.team] || 0) + (G.mode.dom || G.mode.tags ? 0 : 1);
      if (G.mode.dom && m) { for (let i = 0; i < MapSys.dom.length; i++) { const d = MapSys.dom[i], st = m.dom[i]; if (st.owner === killer.team && Math.hypot(deathPos.x - d.x, deathPos.z - d.z) < d.r + 3) { medals.push('defender'); break; } } }
      for (const id of medals) { killer.stats.medals[id] = (killer.stats.medals[id] || 0) + 1; killer.stats.score += MEDALS[id].pts; }
      if (G.mode.ladder && m) this.ladderKill(killer, t, W);
      if (G.mode.tags && m) Tags.add(t, killer, deathPos);
    }
    // asistencias
    for (const [a, d] of t.damagers) {
      if (a === killer || !a || !this.isEnemy(a, t)) continue;
      if (d.d >= CONFIG.FIGHTER.assistMin && G.time - d.t < 10) { a.stats.assists++; a.stats.score += 50; assists.push(a); }
    }
    t.damagers.clear();
    if (!killer && info.attacker === t) t.stats.score = Math.max(0, t.stats.score - 50);
    // el arma principal queda en el suelo
    if (dropW && WorldItems) {
      const p = new THREE.Vector3(deathPos.x, deathPos.y + 1.0, deathPos.z), v = new THREE.Vector3(frand(-1, 1), 1.2, frand(-1, 1));
      const id = 'k' + t.slot + '_' + (++WorldItems._n);
      WorldItems.drop(dropW.w, p, v, dropW.ammo, id, dropW.att);
      if (NET.active) NET.queue('wd', [id, dropW.w, r2(p.x), r2(p.y), r2(p.z), dropW.ammo.mag, Number.isFinite(dropW.ammo.reserve) ? dropW.ammo.reserve : 0, attKey(dropW.att)]);
    }
    const ev = { victim: t, killer, cause: info.kind || 'bullet', weapon: info.weapon, headshot, dist, medals, assists, pos: deathPos };
    BUS.emit('kill', ev);
    if (killer && medals.length) BUS.emit('medalChain', killer, medals.slice());
    Replay.onKill(ev);
    if (NET.active && this.canAuthor(t) && !info.fromNet) NET.sendDeath(t, killer, info);
    if (t.corpse && FX.gore.pools) { const rd = t.corpse.rd; setTimeout(() => { if (!rd.disposed) FX.bloodPool(rd.partPos('chest', new THREE.Vector3())); }, 1600); }
  },

  // ------------------- Escalada de armas -------------------
  ladderKill(killer, victim, W) {
    const m = G.match;
    killer.rung = (killer.rung || 0) + 1;
    if (W === 'knife' && (victim.rung || 0) > 0) { victim.rung--; BUS.emit('ladderDown', victim, killer); }
    if (killer.rung >= LADDER.length) { m.ladderWin = killer; killer.rung = LADDER.length; }
    else if (killer.alive && this.canAuthor(killer)) killer.equipLadder(LADDER[killer.rung]);
    BUS.emit('ladder', killer, killer.rung);
  },

  // ------------------- Dominio -------------------
  domTick(dt, host) {
    const m = G.match, D = CONFIG.DOM;
    for (let i = 0; i < MapSys.dom.length; i++) {
      const d = MapSys.dom[i], st = m.dom[i];
      const cnt = [0, 0], who = [[], []];
      for (const f of G.fighters) {
        if (!f.alive || f.state === 'ragdoll' || f.team < 0) continue;
        if (Math.hypot(f.pos.x - d.x, f.pos.z - d.z) < d.r && Math.abs(f.pos.y - d.y) < 3) { cnt[f.team]++; who[f.team].push(f); }
      }
      st.contested = cnt[0] > 0 && cnt[1] > 0;
      st.present = cnt;
      if (!host) continue;
      if (cnt[0] > 0 !== cnt[1] > 0) {
        const team = cnt[0] ? 0 : 1, sign = team === 0 ? -1 : 1;
        const rate = (1 + 0.35 * (Math.min(3, cnt[team]) - 1)) / D.captureTime;
        if (st.owner === team) st.prog = sign; // ya es nuestro
        else {
          // primero neutralizar, luego capturar
          st.prog = clamp(st.prog + sign * rate * dt * (st.owner >= 0 ? 1 : 2), -1, 1);
          if (st.owner >= 0 && Math.sign(st.prog) === sign) { st.owner = -1; BUS.emit('neutralized', i); }
          if (Math.abs(st.prog) >= 1) {
            st.owner = team; st.prog = sign;
            for (const f of who[team]) { f.stats.captures++; f.stats.medals.capture = (f.stats.medals.capture || 0) + 1; f.stats.score += MEDALS.capture.pts; BUS.emit('medal', f, 'capture'); }
            BUS.emit('captured', i, team);
            if (NET.active && NET.isHost) NET.sendCtl({ k: 'cap', i, t: team, w: who[team].map((f) => f.slot) });
          }
        }
      } else if (!st.contested && st.owner < 0 && st.prog !== 0) {
        st.prog = Math.abs(st.prog) < D.decay * dt ? 0 : st.prog - Math.sign(st.prog) * D.decay * dt;
      } else if (!st.contested && st.owner >= 0) {
        const sign = st.owner === 0 ? -1 : 1; st.prog = clamp(st.prog + sign * D.decay * dt, -1, 1);
      }
    }
    if (!host) return;
    m.domT += dt;
    while (m.domT >= D.scoreEvery) {
      m.domT -= D.scoreEvery;
      for (const st of m.dom) if (st.owner >= 0) m.score[st.owner] += 1;
    }
  },

  // ------------------- Eliminación -------------------
  lastAliveCheck() {
    const m = G.match;
    for (const team of [0, 1]) {
      const mine = G.fighters.filter((f) => f.team === team && f.alive), them = G.fighters.filter((f) => f.team !== team && f.alive);
      if (mine.length === 1 && them.length >= 2 && !m.lastAliveShown[team]) { m.lastAliveShown[team] = mine[0]; BUS.emit('lastAlive', mine[0]); }
    }
  },

  // ------------------- fin -------------------
  checkEnd() {
    const m = G.match, M = G.mode;
    if (M.range || M.campaign) return;
    if (M.story) {
      const S = Zombies.S;
      if (S && S.deadAt != null && G.time - S.deadAt > 2.8) { m.score[1] = 1; this.endMatchResult(); }
      return;
    }
    if (M.rounds) {
      const alive = [0, 1].map((t) => G.fighters.filter((f) => f.team === t && f.alive).length);
      const humansOrAny = [0, 1].map((t) => G.fighters.some((f) => f.team === t));
      let w = null;
      if (humansOrAny[0] && humansOrAny[1]) { if (alive[0] === 0 && alive[1] === 0) w = -1; else if (alive[0] === 0) w = 1; else if (alive[1] === 0) w = 0; }
      if (w === null && m.time >= M.time) {
        if (alive[0] !== alive[1]) w = alive[0] > alive[1] ? 0 : 1;
        else { const hp = [0, 1].map((t) => G.fighters.filter((f) => f.team === t && f.alive).reduce((a, f) => a + f.hp, 0)); w = hp[0] === hp[1] ? -1 : hp[0] > hp[1] ? 0 : 1; }
      }
      if (w !== null) this.endRound(w);
      return;
    }
    let over = false;
    if (M.ladder) { if (m.ladderWin) over = true; }
    else if (M.teams) { if (m.score[0] >= m.limit || m.score[1] >= m.limit) over = true; }
    else if (G.fighters.some((f) => f.stats.kills >= m.limit)) over = true;
    if (m.time >= M.time) over = true;
    if (over) this.endMatchResult();
  },
  leader() {
    if (G.mode && G.mode.ladder) return [...G.fighters].sort((a, b) => (b.rung || 0) - (a.rung || 0) || b.stats.kills - a.stats.kills || a.stats.deaths - b.stats.deaths)[0] || null;
    return [...G.fighters].sort((a, b) => b.stats.kills - a.stats.kills || a.stats.deaths - b.stats.deaths || b.stats.score - a.stats.score)[0] || null;
  },
  endRound(w) {
    const m = G.match; if (m.phase !== 'fight') return;
    if (w >= 0) m.roundWins[w]++;
    m.winner = w;
    // último en pie
    const ls = w >= 0 ? m.lastAliveShown[w] : null;
    if (ls && ls.alive) { ls.stats.medals.lastStand = (ls.stats.medals.lastStand || 0) + 1; ls.stats.score += MEDALS.lastStand.pts; BUS.emit('medal', ls, 'lastStand'); }
    m.over = m.roundWins[0] >= G.mode.winRounds || m.roundWins[1] >= G.mode.winRounds;
    if (G.attract) m.over = false;
    m.phase = 'roundEnd'; m.phaseT = CONFIG.ROUND.roundEndDelay + CONFIG.ROUND.intermission;
    BUS.emit('roundEnd', { winner: w, over: m.over, wins: { ...m.roundWins } });
    if (NET.active && NET.isHost) NET.hostRoundEnd(w, m.over);
  },
  endMatchResult() {
    const m = G.match; if (m.phase === 'matchEnd') return;
    if (G.mode.teams) m.winner = m.score[0] === m.score[1] ? -1 : m.score[0] > m.score[1] ? 0 : 1;
    else { const l = this.leader(); m.winner = l ? l.slot : -1; m.champ = l; }
    m.over = true;
    if (NET.active && NET.isHost) NET.sendCtl({ k: 'mend', w: m.winner, sc: m.score });
    this.setPhase('matchEnd');
  },
  didLocalWin() {
    const m = G.match, me = G.local; if (!m || !me) return false;
    if (G.mode.teams) return m.winner === me.team;
    return m.winner === me.slot;
  },
  saveRecords() {
    const me = G.local; if (!me || G.attract) return;
    const r = Store.get('records', {});
    r.matches = (r.matches || 0) + 1;
    if (this.didLocalWin()) r.wins = (r.wins || 0) + 1;
    r.kills = (r.kills || 0) + me.stats.kills; r.deaths = (r.deaths || 0) + me.stats.deaths; r.headshots = (r.headshots || 0) + me.stats.headshots;
    r.bestStreak = Math.max(r.bestStreak || 0, me.stats.bestStreak); r.longest = Math.max(r.longest || 0, Math.round(me.stats.longest));
    r.medals = r.medals || {}; for (const k in me.stats.medals) r.medals[k] = (r.medals[k] || 0) + me.stats.medals[k];
    r.captures = (r.captures || 0) + me.stats.captures;
    Store.set('records', r);
    // experiencia: puntos de la partida + victoria + por terminarla
    const win = this.didLocalWin(), P = CONFIG.PROG;
    const parts = [['xp_score', me.stats.score], ['xp_play', P.playBonus]];
    if (win) parts.push(['xp_win', P.winBonus]);
    Progress.flushWeapons();
    const res = Progress.award(parts.reduce((a, p) => a + p[1], 0));
    res.parts = parts; me.level = res.after.level; res.weapons = Progress.takeGains(); res.pr = Progress.prestige();
    if (G.match) G.match.xpRes = res;
    NET._lo = null;
  },
};

