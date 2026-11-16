// ---- 14_net.js ----
// =====================================================================
// NET — capa de red sobre la capacidad `room` de Claude.
//   · cada cliente es autoritativo sobre su propio soldado (presencia 20 Hz)
//   · el anfitrión manda en fases, marcador, Dominio, bots, semilla y valida impactos
//   · el ragdoll nunca se sincroniza: solo el impulso (cada quien simula el suyo)
//   · eventos agrupados cada 100 ms (≈10 msg/s, < 4 KiB por mensaje)
// =====================================================================
class RoomTransport {
  constructor(named) { this.r = named; this.name = named.name; }
  emit(topic, data) { return this.r.emit(topic, data).catch((e) => { NET.onSendError(e); }); }
  on(topic, fn) { return this.r.on(topic, fn, (e) => NET.onRoomError(e)); }
  presence(p) { return this.r.presence(p).catch((e) => NET.onSendError(e)); }
  peers() { return this.r.peers(); }
  onPeers(fn) { return this.r.onPeers(fn, (e) => NET.onRoomError(e)); }
  connected() { try { return this.r.connected(); } catch (e) { return false; } }
  onConnection(fn) { return this.r.onConnection(fn, () => { }); }
  leave() { try { return this.r.leave(); } catch (e) { } }
}
// transporte simulado (BroadcastChannel) para pruebas con varias pestañas
class MockTransport {
  constructor(name) {
    this.name = name; this.me = 'p' + Math.random().toString(36).slice(2, 10);
    this.bc = new BroadcastChannel('cow-mock-' + name);
    this.handlers = new Map(); this.peerMap = new Map(); this.peerFns = new Set(); this.myPresence = {};
    this.peerMap.set(this.me, { peer: this.me, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: {}, updatedAt: Date.now(), seen: Date.now() });
    this.bc.onmessage = (ev) => this.recv(ev.data);
    this.hb = setInterval(() => { this.bc.postMessage({ k: 'pr', from: this.me, p: this.myPresence }); this.reap(); }, 400);
    window.addEventListener('beforeunload', () => this.leave());
    setTimeout(() => this.notify([...this.peerMap.values()], []), 0);
  }
  recv(m) {
    if (m.k === 'pr') {
      const known = this.peerMap.get(m.from);
      const e = { peer: m.from, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: Object.freeze(m.p || {}), updatedAt: Date.now(), seen: Date.now() };
      this.peerMap.set(m.from, e);
      if (!known) this.notify([e], []);
    } else if (m.k === 'ev') {
      const fn = this.handlers.get(m.topic); if (fn) for (const h of fn) h({ topic: m.topic, data: m.data, peer: m.from, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false });
    } else if (m.k === 'bye') {
      const e = this.peerMap.get(m.from); if (e) { this.peerMap.delete(m.from); this.notify([], [e]); }
    }
  }
  reap() { const now = Date.now(); for (const [k, e] of this.peerMap) if (!e.isMe && now - e.seen > 2500) { this.peerMap.delete(k); this.notify([], [e]); } }
  notify(joined, left) { const peers = this.peers(); for (const fn of this.peerFns) fn({ peers, joined, left, updated: [] }); }
  emit(topic, data) {
    this.bc.postMessage({ k: 'ev', from: this.me, topic, data });
    const fn = this.handlers.get(topic); if (fn) for (const h of fn) h({ topic, data, peer: this.me, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false });
    return Promise.resolve();
  }
  on(topic, fn) { if (!this.handlers.has(topic)) this.handlers.set(topic, new Set()); this.handlers.get(topic).add(fn); return () => this.handlers.get(topic).delete(fn); }
  presence(p) { for (const k in p) { if (p[k] === null) delete this.myPresence[k]; else this.myPresence[k] = p[k]; } const me = this.peerMap.get(this.me); me.presence = Object.freeze({ ...this.myPresence }); this.bc.postMessage({ k: 'pr', from: this.me, p: this.myPresence }); return Promise.resolve(); }
  peers() { return [...this.peerMap.values()]; }
  onPeers(fn) { this.peerFns.add(fn); setTimeout(() => fn({ peers: this.peers(), joined: this.peers(), left: [], updated: [] }), 0); return () => this.peerFns.delete(fn); }
  connected() { return true; }
  onConnection(fn) { setTimeout(() => fn(true), 0); return () => { }; }
  leave() { clearInterval(this.hb); try { this.bc.postMessage({ k: 'bye', from: this.me }); this.bc.close(); } catch (e) { } }
}

const r2 = (v) => Math.round(v * 100) / 100;
const r3 = (v) => Math.round(v * 1000) / 1000;
const FLAG = { alive: 1, crouch: 2, slide: 4, ground: 8, rag: 16, aim: 32, sprint: 64, reload: 128, hidden: 256, cook: 512, invuln: 1024, getup: 2048, mantle: 4096, knife: 8192, prone: 16384 };
const PART_CODE = { body: 0, head: 1, legs: 2, arms: 3 }, PART_NAME = ['body', 'head', 'legs', 'arms'];
const MAX_HUMANS = 4;

const NET = {
  available: false,
  active: false, isHost: false, myPeer: null, room: null, t: null, user: null, me: null,
  lobby: null, joinedAt: 0, peerList: [], outbox: [], flushT: 0, presT: 0, pingT: 0, ping: 0, connOk: true, connLostT: 0,
  hostPeer: null, lastMatchState: null, profiles: {}, unsubs: [], matchId: 0, migrating: 0, snaps: new Map(), _seen: new Map(), sent: 0, sentBytes: 0, peerLo: {},
  botOwned(f) { const r = this.curCfg && this.curCfg.roster.find((x) => x.slot === f.slot); return !r || r.kind === 'bot'; },

  init() {
    try {
      if (window.__COW_MOCKROOM) { this.mock = true; this.available = true; return; }
      if (!window.claude || !window.claude.use) { this.available = false; return; }
      this.available = undefined;
      window.claude.use('room').then((room) => { this.lobbyRoom = room; this.available = !!room; if (UI.screen === 'online') UI.render(); }).catch(() => { this.available = false; if (UI.screen === 'online') UI.render(); });
      window.claude.use('user').then((u) => { this.user = u; if (u) u.me().then((m) => { this.me = m; if (UI.screen === 'online') UI.render(); }).catch(() => { }); }).catch(() => { });
    } catch (e) { this.available = false; }
  },
  displayName(peer) {
    if (!peer) return '—';
    const pr = peer.presence || {};
    if (peer.isMe) return (this.me && this.me.name) || pr.n || G.settings.name;
    if (peer.by && this.profiles[peer.by] && this.profiles[peer.by].name) return this.profiles[peer.by].name;
    return pr.n || 'Soldado';
  },
  async resolveNames() {
    if (!this.user) return;
    const ids = this.peerList.map((p) => p.by).filter(Boolean);
    if (!ids.length) return;
    try { const ps = await this.user.profiles(ids); Object.assign(this.profiles, ps); } catch (e) { }
  },

  // ---------------- entrar / salir ----------------
  async join(code) {
    code = String(code || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
    if (!code) throw new Error('code');
    const name = CONFIG.NET.roomPrefix + code;
    let t;
    if (this.mock) t = new MockTransport(name);
    else {
      if (!this.lobbyRoom) throw new Error('unavailable');
      const named = await this.lobbyRoom.join(name);
      t = new RoomTransport(named);
    }
    this.t = t; this.code = code; this.joinedAt = Date.now(); this.active = false; this.inLobby = true;
    this.unsubs.push(t.on('ev', (m) => this.onEv(m)), t.on('ctl', (m) => this.onCtl(m)), t.onPeers((c) => this.onPeers(c)), t.onConnection((c) => this.onConn(c)));
    this.lobby = { mode: 'tdm', map: 'pueblo', env: 'random', fac: 'sv', fill: true, diff: 'normal', size: 8, ready: false, team: -1 };
    this.setLobbyPresence();
    this.presTimer = setInterval(() => { if (!this.active && this.t) this.setLobbyPresence(); }, 2500);
    return code;
  },
  leave() {
    for (const u of this.unsubs) { try { u(); } catch (e) { } }
    this.unsubs = []; clearInterval(this.presTimer);
    if (this.t) { try { this.t.leave(); } catch (e) { } }
    this.t = null; this.active = false; this.inLobby = false; this.isHost = false; this.peerList = []; this.snaps.clear(); this._seen.clear(); this.outbox = [];
  },
  setLobbyPresence() {
    const s = G.settings, LB = this.lobby;
    this.t && this.t.presence({ v: 2, j: this.joinedAt, n: s.name, c: s.custom, pr: s.primary, lo: packLoadout(localLoadout()), lv: Progress.level(), tm: LB.team, r: !!LB.ready, s: this.active ? 'game' : 'lobby', id: this.me && this.me.id || null,
      L: this.isHost ? { mode: LB.mode, map: LB.map, env: LB.env, fill: LB.fill, diff: LB.diff, size: LB.size } : null });
  },

  // ---------------- jugadores / anfitrión ----------------
  onPeers(c) {
    this.peerList = c.peers.filter((p) => p.kind === 'viewer');
    const me = this.peerList.find((p) => p.sameTab);
    if (me) this.myPeer = me.peer;
    this.resolveNames();
    const prevHost = this.hostPeer;
    this.electHost();
    if (this.active) {
      for (const l of c.left || []) this.onPeerLeft(l.peer);
      if (prevHost && this.hostPeer !== prevHost) this.onHostChanged(prevHost);
    }
    if (UI.screen === 'online') OnlineUI.refresh();
  },
  electHost() {
    const list = this.peerList.filter((p) => p.presence && p.presence.j);
    if (!list.length) { this.hostPeer = this.myPeer; this.isHost = true; return; }
    list.sort((a, b) => (a.presence.j - b.presence.j) || (a.peer < b.peer ? -1 : 1));
    this.hostPeer = list[0].peer;
    this.isHost = this.hostPeer === this.myPeer;
  },
  peerBy(peer) { return this.peerList.find((p) => p.peer === peer); },
  onConn(ok) { this.connOk = ok; if (!ok) this.connLostT = performance.now(); },
  onRoomError(e) { if (e && (e.code === 'revoked' || e.code === 'not_granted')) { UI.toast(T('net_lost')); this.leave(); } },
  onSendError() { },

  // ---------------- inicio de partida (anfitrión) ----------------
  hostStart() {
    if (!this.isHost) return;
    const LB = this.lobby, teams = MODES[LB.mode].teams;
    const humans = this.peerList.filter((p) => p.presence && p.presence.j).sort((a, b) => a.presence.j - b.presence.j).slice(0, MAX_HUMANS);
    const sz = MODES[LB.mode].sizes, lbSize = sz && !sz.includes(LB.size) ? sz[sz.length - 1] : LB.size;
    const total = Math.max(LB.fill ? lbSize : humans.length, humans.length, 2);
    const roster = [], count = [0, 0];
    const want = humans.map((p) => p.presence.tm ?? -1);
    // equipos: respetar la preferencia mientras no desbalancee
    humans.forEach((p, i) => {
      let tm = -1;
      if (teams) { const pref = want[i]; tm = pref >= 0 && count[pref] <= count[1 - pref] ? pref : count[0] <= count[1] ? 0 : 1; count[tm]++; }
      roster.push({ slot: i, kind: 'human', peer: p.peer, name: this.displayName(p).slice(0, 16), custom: p.presence.c || DEFAULT_SETTINGS.custom, primary: p.presence.pr || 'rifle', lo: p.presence.lo || null, level: p.presence.lv || 1, team: tm });
    });
    const rng = new RNG(Date.now() & 0xffff), names = shuffleInPlace(BOT_NAMES.slice(), rng);
    for (let i = roster.length; i < total; i++) {
      let tm = -1; if (teams) { tm = count[0] <= count[1] ? 0 : 1; count[tm]++; }
      roster.push({ slot: i, kind: 'bot', peer: this.myPeer, name: rng.pick(BOT_RANKS[LANG] || BOT_RANKS.es) + ' ' + names[i % names.length], team: tm, difficulty: LB.diff, lo: packLoadout(botLoadout(rng)), level: rng.int(1, 24),
        custom: teams && tm >= 0 ? factionLook(rng, tm, LB.fac) : botLook(rng, rng.pick(Object.keys(CAMOS)), null) });
    }
    const cfg = { mode: LB.mode, map: LB.map, env: LB.env || 'auto', fac: CONFIG.MATCHUPS[LB.fac] ? LB.fac : 'sv', difficulty: LB.diff, seed: (Math.random() * 1e9) >>> 0, roster, id: ++this.matchId + (Date.now() % 100000) };
    this.sendCtl({ k: 'start', cfg });
  },
  startFromCfg(cfg) {
    this.active = true; this.inLobby = false; this.curCfg = cfg; this.snaps.clear(); this._seen.clear();
    const roster = cfg.roster.map((r) => {
      const mine = r.peer === this.myPeer;
      const kind = r.kind === 'human' ? (mine ? 'local' : 'remote') : (this.isHost ? 'bot' : 'remote');
      return { ...r, kind };
    });
    UI.hideMenu(); UI.closeOverlay(); G.paused = false;
    Rules.startMatch({ mode: cfg.mode, map: cfg.map, env: cfg.env, difficulty: cfg.difficulty, seed: cfg.seed, roster, online: true });
    for (const f of G.fighters) { const r = cfg.roster.find((x) => x.slot === f.slot); f.owner = r ? r.peer : null; if (f.kind === 'remote') { f.alive = false; f.hidden = true; } }
    UI.enterGame();
    Music.stop();
    this.setLobbyPresence();
  },

  // ---------------- control (anfitrión → todos) ----------------
  sendCtl(msg) { if (this.t) { this.t.emit('ctl', msg); this.sent++; } },
  onCtl(m) {
    const d = m.data || {};
    if (m.peer !== this.hostPeer && d.k !== 'host') return;
    switch (d.k) {
      case 'start': this.startFromCfg(d.cfg); break;
      case 'lobby': if (this.active) { this.active = false; Rules.endMatch(true); UI.startAttract(); UI.show('online'); OnlineUI.state = 'lobby'; OnlineUI.refresh(); } break;
      case 'round': if (!this.isHost && G.match) this.applyRound(d); break;
      case 'phase': if (!this.isHost && G.match) { if (d.p === 'fight' && G.match.phase !== 'fight') Rules.setPhase('fight'); if (d.p === 'matchEnd' && G.match.phase !== 'matchEnd') { this.applyScore(d); Rules.setPhase('matchEnd'); } } break;
      case 'rend': if (!this.isHost && G.match) this.applyRoundEnd(d); break;
      case 'mend': if (!this.isHost && G.match) { G.match.winner = d.w; if (d.sc) G.match.score = { 0: d.sc[0] ?? d.sc['0'], 1: d.sc[1] ?? d.sc['1'] }; } break;
      case 'cap': if (!this.isHost && G.match && G.match.dom[d.i]) { const st = G.match.dom[d.i]; st.owner = d.t; st.prog = d.t === 0 ? -1 : 1; for (const s of d.w || []) { const f = this.bySlot(s); if (f) { f.stats.captures++; f.stats.medals.capture = (f.stats.medals.capture || 0) + 1; f.stats.score += MEDALS.capture.pts; BUS.emit('medal', f, 'capture'); } } BUS.emit('captured', d.i, d.t); } break;
      case 'tg': if (!this.isHost && G.match) Tags.remote(d); break;
      case 'replace': { const f = this.bySlot(d.s); if (f) this.makeBot(f, d.o); break; }
      case 'host': break;
    }
  },
  applyScore(d) { if (d && d.sc) G.match.score = { 0: d.sc[0], 1: d.sc[1] }; },
  bySlot(s) { return G.fighters.find((f) => f.slot === s); },
  hostPhase(p) { const m = G.match; this.sendCtl({ k: 'phase', p, sc: m ? [m.score[0], m.score[1]] : null }); },
  hostRoundStart() { const m = G.match; if (!m) return; this.sendCtl({ k: 'round', r: m.round, seed: m.roundSeed, rw: [m.roundWins[0], m.roundWins[1]] }); },
  applyRound(d) {
    const m = G.match;
    m.round = d.r - 1;
    Rules.startRound();
    if (m.roundSeed !== d.seed) { m.roundSeed = d.seed; G.roundSeed = d.seed; G.rng = new RNG(d.seed); }
    if (d.rw) m.roundWins = { 0: d.rw[0], 1: d.rw[1] };
  },
  hostRoundEnd(w, over) { const m = G.match; this.sendCtl({ k: 'rend', w, over, rw: [m.roundWins[0], m.roundWins[1]] }); },
  applyRoundEnd(d) {
    const m = G.match; if (m.phase === 'roundEnd') return;
    m.roundWins = { 0: d.rw[0], 1: d.rw[1] }; m.winner = d.w; m.over = d.over;
    m.phase = 'roundEnd'; m.phaseT = 99;
    BUS.emit('roundEnd', { winner: d.w, over: d.over, wins: { ...m.roundWins } });
  },

  // ---------------- eventos de juego (todos) ----------------
  queue(type, arr) { if (this.active) this.outbox.push([type, ...arr]); },
  flush() {
    if (!this.outbox.length || !this.t) return;
    let batch = [], size = 0;
    const send = () => { if (batch.length) { this.t.emit('ev', { e: batch }); this.sent++; this.sentBytes += size; } batch = []; size = 0; };
    for (const e of this.outbox) { const s = JSON.stringify(e).length + 1; if (size + s > CONFIG.NET.maxMsgBytes) send(); batch.push(e); size += s; }
    send(); this.outbox = [];
  },
  onEv(m) {
    if (!this.active || m.sameTab) return;
    const list = (m.data && m.data.e) || [];
    for (const e of list) { try { this.handleEvent(e, m.peer); } catch (err) { reportError(err); } }
  },
  ownerOf(f) { return f.owner || (f.kind === 'bot' ? this.myPeer : null); },
  handleEvent(e, from) {
    switch (e[0]) {
      case 'f': { // [f, slot, idx, w, ox,oy,oz, dx,dy,dz, seed, spread]
        const f = this.bySlot(e[1]); if (!f || f.kind !== 'remote' || !f.alive) return;
        if (!CONFIG.WEAPONS[e[3]]) return; const W = f.wstat(e[3]);
        const shot = { origin: new THREE.Vector3(e[4], e[5], e[6]), dir: new THREE.Vector3(e[7], e[8], e[9]), seed: e[10], weapon: e[3], spread: e[11] || 0 };
        if (W.kind === 'melee') { f.meleeT = 0.42; if (f.view) f.view.swing = 1; BUS.emit('swing', f); }
        else { if (f.weapon !== e[3]) { f.weapon = e[3]; if (f.view) f.view.setWeapon(e[3]); } Weapons.resolveShot(f, W, shot, false); if (f.view) f.view.recoilK = 1; f.lastShotT = G.time; BUS.emit('fire', f, shot); }
        break;
      }
      case 'fs': { const f = this.bySlot(e[1]); if (f && f.kind === 'remote') f.remoteFire = { w: e[2], seed: e[3], n: 0, cd: 0, sp: e[4] || 0.02 }; break; }
      case 'fe': { const f = this.bySlot(e[1]); if (f) f.remoteFire = null; break; }
      case 'h': if (this.isHost) this.validateClaim(e, from); break;
      case 'd': this.onDamage(e); break;
      case 'k': this.onDeath(e); break;
      case 'wd': { if (!WorldItems.drops.some((d) => d.id === e[1])) WorldItems.drop(e[2], new THREE.Vector3(e[3], e[4], e[5]), new THREE.Vector3(0, 1, 0), { mag: e[6], reserve: e[7] }, e[1], attFromKey(e[2], e[8])); break; }
      case 'wp': WorldItems.remoteTake(e[1]); break;
      case 'sp': WorldItems.remoteStand(e[1]); break;
      case 'g': { const f = this.bySlot(e[1]); Grenades.spawn(f || null, new THREE.Vector3(e[3], e[4], e[5]), new THREE.Vector3(e[6], e[7], e[8]), e[9], false, e[2], e[10] ? 'smoke' : 'frag'); if (f) { BUS.emit('throw', f); f.throwT = 0.38; } break; }
      case 'gx': Grenades.remoteExplode(e[1], e[2], e[3], e[4], e[5]); break;
      case 'ks': Streaks.remote(e); break;
      case 'bb': { const b = MapSys.blockById(e[1]); if (b && b.active) MapSys.destroyBlock(b, this.bySlot(e[2]) || null, true); break; }
      case 'p': if (this.isHost) this.queue('q', [from, e[1]]); break;
      case 'q': if (e[1] === this.myPeer) this.ping = Math.round(performance.now() - e[2]); break;
      case 'pg': { const f = this.bySlot(e[1]); if (f) f.ping = e[2]; break; }
    }
  },

  // ---- impactos: quien dispara reclama, el anfitrión valida, el dueño del objetivo aplica ----
  sendHitClaim(info) {
    const a = info.attacker, t = info.target, i = info.impulse || _v1.set(0, 0, 0), p = info.point || t.pos;
    const e = ['h', a ? a.slot : -1, t.slot, r2(info.damage), r2(i.x), r2(i.y), r2(i.z), r2(p.x), r2(p.y), r2(p.z), PART_CODE[info.part] || 0, info.weapon || '', info.kind || 'bullet', r2(info.k || 0)];
    if (this.isHost) this.validateClaim(e, this.myPeer); else this.queue('h', e.slice(1));
  },
  validateClaim(e, from) {
    const a = this.bySlot(e[1]), t = this.bySlot(e[2]);
    if (!t || !t.alive) return;
    if (a && this.ownerOf(a) !== from && a.owner !== from) return;
    const pt = new THREE.Vector3(e[7], e[8], e[9]);
    // compensación de latencia: el punto debe caer cerca de donde estuvo el objetivo en el último ~0.7 s
    const tol = CONFIG.NET.validateTolerance + Math.hypot(t.vel.x, t.vel.z) * 0.25 + (e[12] === 'explosion' ? 6 : 0);
    let ok = false;
    for (const h of t.history) { if (G.time - h.t > 0.75) continue; const dx = pt.x - h.x, dz = pt.z - h.z, dy = pt.y - (h.y + 1); if (dx * dx + dz * dz + dy * dy * 0.5 < tol * tol) { ok = true; break; } }
    if (!ok && t.pos.distanceTo(pt) < tol + 1.5) ok = true;
    if (!ok) return;
    const dmg = Math.min(e[3], 300);
    const d = ['d', t.slot, e[1], dmg, e[4], e[5], e[6], e[7], e[8], e[9], e[10], e[11], e[12], e[13], 1];
    this.queue('d', d.slice(1));
    this.onDamage(d, true);
  },
  onDamage(e, local) {
    const t = this.bySlot(e[1]), a = this.bySlot(e[2]); if (!t) return;
    const info = { attacker: a || null, target: t, damage: e[3], impulse: new THREE.Vector3(e[4], e[5], e[6]), point: new THREE.Vector3(e[7], e[8], e[9]), part: PART_NAME[e[10]] || 'body', weapon: e[11], kind: e[12], k: e[13] || 0, fromNet: true };
    const mine = t.kind === 'local' || (t.kind === 'bot' && this.isHost);
    // el dueño del objetivo aplica el daño validado: la muerte la anuncia él (sin repetir el 'd')
    if (e[14] && mine) { info.fromNet = false; info.noEcho = true; Combat.apply(info); return; }
    if (!local || !mine) {
      if (!(t === G.local)) FX.hitFx(info);
      if (a && a !== t) a.stats.damage += e[3];
      t.flinchT = 0.22; t.flinchDir.copy(info.impulse).normalize();
      BUS.emit('remoteDamage', t, info);
    }
  },
  sendApplied(info, dmg) {
    const t = info.target, i = info.impulse || _v1.set(0, 0, 0), p = info.point || t.pos;
    this.queue('d', [t.slot, info.attacker ? info.attacker.slot : -1, r2(dmg), r2(i.x), r2(i.y), r2(i.z), r2(p.x), r2(p.y), r2(p.z), PART_CODE[info.part] || 0, info.weapon || '', info.kind || '', r2(info.k || 0), 0]);
  },
  sendDeath(t, killer, info) {
    const i = info.impulse || _v1.set(0, 0, 0), p = info.point || t.pos;
    this.queue('k', [t.slot, killer ? killer.slot : -1, info.kind || 'bullet', info.weapon || '', r2(i.x), r2(i.y), r2(i.z), PART_CODE[info.part] || 0, r2(p.x), r2(p.y), r2(p.z)]);
  },
  onDeath(e) {
    const t = this.bySlot(e[1]); if (!t || !t.alive) return;
    if (t.kind === 'local' || (t.kind === 'bot' && this.isHost)) return;
    const killer = this.bySlot(e[2]);
    Rules.kill(t, { kind: e[3], weapon: e[4], attacker: killer || null, fromNet: true, impulse: new THREE.Vector3(e[5], e[6], e[7]), part: PART_NAME[e[8]] || 'body', point: new THREE.Vector3(e[9], e[10], e[11]) });
  },

  // ---------------- presencia: estado absoluto 20 Hz ----------------
  packFighter(f) {
    let fl = 0;
    if (f.alive) fl |= FLAG.alive; if (f.crouching) fl |= FLAG.crouch; if (f.sliding) fl |= FLAG.slide; if (f.grounded) fl |= FLAG.ground;
    if (f.state === 'ragdoll') fl |= FLAG.rag; if (f.input.aim || f.adsT > 0.5) fl |= FLAG.aim; if (f.sprinting) fl |= FLAG.sprint; if (f.reloadT > 0) fl |= FLAG.reload;
    if (f.hidden) fl |= FLAG.hidden; if (f.grenadeCook) fl |= FLAG.cook; if (f.invulnT > 0) fl |= FLAG.invuln; if (f.state === 'getup') fl |= FLAG.getup; if (f.mantle) fl |= FLAG.mantle; if (f.meleeT > 0) fl |= FLAG.knife; if (f.prone) fl |= FLAG.prone;
    const p = f.state === 'ragdoll' && f.ragdoll ? f.pos : f.pos;
    return [f.slot, r2(p.x), r2(p.y), r2(p.z), r2(f.vel.x), r2(f.vel.y), r2(f.vel.z), r3(f.yaw), r3(f.input.pitch), fl, Math.round(f.hp), WEAPON_IDS.indexOf(f.weapon), f.stats.kills, f.stats.deaths, r2(f.lean || 0)];
  },
  sendPresence() {
    if (!this.t) return;
    const me = G.local;
    const pr = { v: 2, j: this.joinedAt, n: G.settings.name, c: G.settings.custom, pr: G.settings.primary, lo: this._lo || (this._lo = packLoadout(localLoadout())), lv: Progress.level(), tm: this.lobby ? this.lobby.team : -1, s: 'game', id: this.me && this.me.id || null, t: Math.round(performance.now()) };
    if (me) pr.f = this.packFighter(me);
    if (this.isHost && G.match) {
      pr.b = G.fighters.filter((f) => f.kind === 'bot').map((f) => this.packFighter(f));
      const m = G.match;
      pr.m = { id: this.curCfg ? this.curCfg.id : 0, r: m.round, ph: m.phase, rt: r2(m.time), sc: [m.score[0], m.score[1]], rw: [m.roundWins[0], m.roundWins[1]], seed: m.roundSeed, d: m.dom.map((s) => [s.owner, Math.round(s.prog * 100)]) };
    }
    this.t.presence(pr);
  },
  ingestPresence() {
    const now = performance.now();
    const live = this.t ? this.t.peers() : this.peerList;
    for (const p of live) {
      if (p.isMe || !p.presence || p.kind !== 'viewer') continue;
      const pr = p.presence;
      if (pr === this._seen.get(p.peer)) continue;
      this._seen.set(p.peer, pr);
      if (pr.f) this.pushSnap(pr.f, now);
      if (pr.lo) this.peerLo[p.peer] = pr.lo;
      if (pr.b && p.peer === this.hostPeer && !this.isHost) for (const b of pr.b) this.pushSnap(b, now);
      if (pr.m && p.peer === this.hostPeer) { this.lastMatchState = pr.m; this.syncMatch(pr.m); }
    }
  },
  pushSnap(arr, now) {
    const f = this.bySlot(arr[0]); if (!f || f.kind !== 'remote') return;
    let buf = this.snaps.get(f); if (!buf) { buf = []; this.snaps.set(f, buf); }
    buf.push({ t: now, a: arr });
    while (buf.length > 12) buf.shift();
  },
  syncMatch(m) {
    const gm = G.match; if (!gm || this.isHost) return;
    if (m.sc) { gm.score[0] = m.sc[0]; gm.score[1] = m.sc[1]; }
    if (m.d) m.d.forEach((x, i) => { const st = gm.dom[i]; if (st) { st.owner = x[0]; st.prog = x[1] / 100; } });
    if (m.ph === 'fight' && gm.phase === 'fight') {
      const target = m.rt + this.ping / 2000, diff = target - gm.time;
      if (Math.abs(diff) > 1.5) gm.time = target; else if (Math.abs(diff) > 0.08) gm.time += diff * 0.1;
    }
    if (m.ph === 'fight' && gm.phase === 'countdown' && gm.round === m.r) Rules.setPhase('fight');
    if (m.r > gm.round && gm.phase !== 'countdown' && m.ph !== 'matchEnd' && this._lastRoundAsk !== m.r) {
      this._lastRoundAsk = m.r;
      this.applyRound({ r: m.r, seed: m.seed, rw: m.rw });
    }
  },
  // interpolar los títeres remotos (cada tick)
  updateRemotes(dt) {
    const now = performance.now() - CONFIG.NET.interpDelay * 1000;
    for (const f of G.fighters) {
      if (f.kind !== 'remote') continue;
      const buf = this.snaps.get(f); if (!buf || !buf.length) continue;
      let a = buf[0], b = buf[buf.length - 1];
      for (let i = buf.length - 1; i > 0; i--) if (buf[i - 1].t <= now) { a = buf[i - 1]; b = buf[i]; break; }
      const k = clamp((now - a.t) / Math.max(1, b.t - a.t), 0, 1.25);
      const A = a.a, B = b.a;
      const x = lerp(A[1], B[1], k), y = lerp(A[2], B[2], k), z = lerp(A[3], B[3], k);
      const fl = B[9];
      const alive = !!(fl & FLAG.alive);
      if (alive && !f.alive && b.t > (f._deadAt || 0) + 150) {
        // reaparece con la clase que eligió en su pantalla de muerte
        const lo = f.kind === 'remote' && f.owner && this.peerLo[f.owner] ? unpackLoadout(this.peerLo[f.owner]) : null;
        if (lo && !this.botOwned(f)) f.loadout = lo;
        f.spawn(x, y, z, B[7]);
      }
      if (!f.alive) continue;
      f.vel.set(B[4], B[5], B[6]);
      f.yaw = A[7] + wrapAngle(B[7] - A[7]) * k; f.input.yaw = f.yaw; f.input.pitch = lerp(A[8], B[8], k);
      f.crouching = !!(fl & FLAG.crouch); f.sliding = !!(fl & FLAG.slide); f.grounded = !!(fl & FLAG.ground); f.input.aim = !!(fl & FLAG.aim);
      f.prone = !!(fl & FLAG.prone); f.proneT = clamp(f.proneT + (f.prone ? 1 : -1) * dt / CONFIG.MOVE.proneTime, 0, 1);
      f.lean = lerp(A[14] || 0, B[14] || 0, k); f.leanOff = f.lean * CONFIG.CAMERA.leanDist;
      f.sprinting = !!(fl & FLAG.sprint); f.invulnT = fl & FLAG.invuln ? 0.3 : 0;
      f.adsT = damp(f.adsT, fl & FLAG.aim ? 1 : 0, 10, dt);
      if (fl & FLAG.reload) { if (f.reloadT <= 0) { f.reloadTotal = 2; f.reloadT = 2; } } else f.reloadT = 0;
      f.grenadeCook = fl & FLAG.cook ? (f.grenadeCook || { t0: G.time }) : null;
      f.mantle = fl & FLAG.mantle ? (f.mantle || { remote: true }) : null;
      f.hp = B[10];
      const w = WEAPON_IDS[B[11]]; if (w && f.weapon !== w) { f.weapon = w; if (!f.inv[w]) f.inv[w] = { mag: 1, reserve: 0 }; if (f.view) f.view.setWeapon(w); }
      const rag = !!(fl & FLAG.rag);
      if (rag && f.state !== 'ragdoll') f.startRagdoll(new THREE.Vector3(0, 0, 0), null, 99);
      if (f.state === 'ragdoll' && f.ragdoll) {
        // resorte suave hacia la posición reportada (cada cliente simula su propio ragdoll)
        f.ragdoll.update(dt);
        const pl = f.ragdoll.pelvis.position, ex = x - pl.x, ey = y + 0.25 - pl.y, ez = z - pl.z, err = Math.hypot(ex, ey, ez);
        if (err > 6) { for (const n of PART_NAMES) { const bd = f.ragdoll.parts[n].body; bd.position.x += ex; bd.position.y += ey; bd.position.z += ez; } }
        else if (err > 0.35) f.ragdoll.applyImpulse(_v4.set(ex, ey, ez).multiplyScalar(dt * 3), null);
        if (!rag) { f.endRagdoll(x, y, z); f.state = 'getup'; f.stateT = 0; }
        else f.pos.set(pl.x, pl.y - 0.25, pl.z);
      } else {
        f.pos.set(x, y, z);
        if (f.state === 'getup' && f.stateT > CONFIG.RAGDOLL.getupTime) f.state = 'stand';
      }
      f.stateT += dt;
      f.syncProxy(); f.recordHistory(G.time);
      // ráfagas remotas (visuales, deterministas por semilla)
      if (f.remoteFire) {
        const W = CONFIG.WEAPONS[f.remoteFire.w] ? f.wstat(f.remoteFire.w) : null, rf = f.remoteFire;
        rf.cd -= dt;
        if (rf.cd <= 0 && W) {
          rf.cd = 1 / W.fireRate; rf.n++;
          const ray = aimRay(f);
          const shot = { origin: ray.origin.clone(), dir: ray.dir.clone(), seed: hash32(rf.seed, rf.n), weapon: rf.w, spread: rf.sp };
          Weapons.resolveShot(f, W, shot, false); if (f.view) f.view.recoilK = 1; f.lastShotT = G.time; BUS.emit('fire', f, shot);
        }
      }
    }
  },

  // ---------------- salidas y migración del anfitrión ----------------
  onPeerLeft(peer) {
    const fs = G.fighters.filter((f) => f.owner === peer && f.kind === 'remote');
    for (const f of fs) {
      UI.toast(T('net_left', { n: f.name }));
      if (this.isHost) { this.makeBot(f, this.myPeer); this.sendCtl({ k: 'replace', s: f.slot, o: this.myPeer }); }
    }
  },
  makeBot(f, ownerPeer) {
    f.owner = ownerPeer;
    if (f.name.indexOf('(bot)') < 0) f.name = f.name + ' (bot)';
    if (ownerPeer === this.myPeer) {
      f.kind = 'bot'; f.input = new InputState(); f.brain = new BotBrain(f, (this.curCfg && this.curCfg.difficulty) || 'normal');
      f.remoteFire = null; this.snaps.delete(f);
      f.seenJump = f.input.jumpCount; f.seenFire = f.input.fireCount;
      if (!f.alive && f.state === 'dead') f.respawnT = 1;
    } else f.kind = 'remote';
    const r = this.curCfg && this.curCfg.roster.find((x) => x.slot === f.slot); if (r) { r.kind = 'bot'; r.peer = ownerPeer; r.name = f.name; }
  },
  onHostChanged(oldHost) {
    this.migrating = 1.2;
    UI.toast(T('net_migrate'));
    for (const f of G.fighters) if (f.owner === oldHost) this.makeBot(f, this.hostPeer);
    if (this.isHost && G.match) {
      const ms = this.lastMatchState;
      if (ms && ms.sc) { G.match.score = { 0: ms.sc[0], 1: ms.sc[1] }; }
      if (ms && ms.rw) G.match.roundWins = { 0: ms.rw[0], 1: ms.rw[1] };
      if (G.match.phase === 'roundEnd' && G.match.phaseT > 50) G.match.phaseT = 2;
      this.sendCtl({ k: 'host' });
    }
  },

  // ---------------- tick y frame ----------------
  tick(dt) {
    if (!this.active) return;
    this.ingestPresence();
    this.updateRemotes(dt);
    this.checkFireStops();
    if (this.migrating > 0) this.migrating -= dt;
  },
  frame(dt) {
    if (!this.t || !this.active) return;
    this.presT += dt; this.flushT += dt; this.pingT += dt;
    if (this.presT >= 1 / CONFIG.NET.presenceHz) { this.presT = 0; this.sendPresence(); }
    if (this.pingT >= CONFIG.NET.pingEvery) { this.pingT = 0; if (!this.isHost) this.queue('p', [Math.round(performance.now())]); else this.ping = 0; if (G.local) { this.queue('pg', [G.local.slot, this.ping]); G.local.ping = this.ping; } }
    if (this.flushT >= CONFIG.NET.flushMs / 1000) { this.flushT = 0; this.flush(); }
    const ind = UI.el['net-ind'];
    if (ind) {
      ind.hidden = false;
      const bad = !this.connOk && performance.now() - this.connLostT > 2000;
      ind.classList.toggle('bad', bad);
      ind.lastChild.textContent = bad ? T('net_reconnect') : this.isHost ? T('net_host') + ' · ' + this.peerList.length + 'P' : this.ping + ' ms';
    }
  },
  isAuthorityFor(f) { return !this.active || !f || f.kind === 'local' || (f.kind === 'bot' && this.isHost); },
  onLocalFire(f, shot) {
    if (!this.active || !(f.kind === 'local' || (f.kind === 'bot' && this.isHost))) return;
    const W = f.wstat(shot.weapon);
    if (W.auto && W.kind !== 'melee') {
      if (!f._netFiring) { f._netFiring = true; this.queue('fs', [f.slot, shot.weapon, shot.seed, r3(shot.spread || 0)]); }
      f._netFireT = G.time;
    } else this.queue('f', [f.slot, f.shotIndex, shot.weapon, r3(shot.origin.x), r3(shot.origin.y), r3(shot.origin.z), r3(shot.dir.x), r3(shot.dir.y), r3(shot.dir.z), shot.seed, r3(shot.spread || 0)]);
  },
  checkFireStops() {
    for (const f of G.fighters) if (f._netFiring && G.time - f._netFireT > 0.2) { f._netFiring = false; this.queue('fe', [f.slot]); }
  },
};

// ---------------- UI del modo en línea (sala) ----------------
const OnlineUI = {
  state: 'idle', err: '', joinCode: '',
  html() {
    const back = `<button class="btn small" data-act="net_back">${T('back')}</button>`;
    const head = (t) => `<div class="subhead"><h2>${t}</h2>${back}</div>`;
    if (NET.available === undefined && !NET.mock) return `<div class="screen sub"><div class="panel">${head(T('online_title'))}<p class="lead">${T('net_checking')}</p></div></div>`;
    if (!NET.available && !NET.mock) return `<div class="screen sub"><div class="panel">${head(T('online_title'))}<p class="lead">${T('online_unavailable')}</p><p class="note" style="margin-top:10px">${T('net_req')}</p></div></div>`;
    if (this.state === 'idle' || this.state === 'connecting') {
      return `<div class="screen sub"><div class="panel">${head(T('online_title'))}
        <p class="lead">${T('net_lead')}</p>
        <div class="row" style="margin-top:16px;align-items:end">
          <button class="btn primary" data-act="net_create" ${this.state === 'connecting' ? 'disabled' : ''}>${T('net_create')}</button>
          <div class="field"><label for="joinIn">${T('net_code')}</label><input type="text" id="joinIn" data-net="code" maxlength="8" placeholder="abcd" value="${escapeHtml(this.joinCode)}" autocomplete="off"></div>
          <button class="btn" data-act="net_join" ${this.state === 'connecting' ? 'disabled' : ''}>${T('net_join')}</button>
        </div>
        ${this.err ? `<p class="note warn" style="margin-top:12px">${escapeHtml(this.err)}</p>` : ''}
        <p class="note" style="margin-top:14px">${T('net_req')}</p></div></div>`;
    }
    const LB = NET.lobby, host = NET.isHost;
    const players = NET.peerList.filter((p) => p.presence && p.presence.j).sort((a, b) => a.presence.j - b.presence.j);
    const hostL = (players.find((p) => p.peer === NET.hostPeer) || {}).presence?.L || LB;
    const tName = (t) => t === 0 || t === 1 ? teamName(t, hostL.fac) : T('net_auto');
    const rows = players.map((p) => `<div class="prow"><span class="dot" style="background:${p.presence.tm >= 0 ? CONFIG.TEAM_COLORS[p.presence.tm] : '#8a8a80'}"></span><span>${escapeHtml(NET.displayName(p))}${p.isMe ? ' (' + T('you') + ')' : ''}<small>${MODES[hostL.mode] && MODES[hostL.mode].teams ? ' · ' + tName(p.presence.tm ?? -1) : ''}</small></span><span class="tagr ${p.peer === NET.hostPeer ? 'host' : p.presence.r ? 'ready' : ''}">${p.peer === NET.hostPeer ? T('net_hosttag') : p.presence.r ? T('net_ready') : T('net_waiting')}</span></div>`).join('');
    const seg = (k, opts, cur, enabled = host) => `<div class="seg">${opts.map(([v, t]) => `<button data-act="net_set" data-k="${k}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}" ${enabled ? '' : 'disabled'}>${t}</button>`).join('')}</div>`;
    const modes = MODE_ORDER.map((m) => [m, L(MODES[m].name)]);
    const maps = MAP_ORDER.map((m) => [m, L(MAPS[m].name)]);
    const myTeam = seg('team', [[-1, T('net_auto')], [0, teamName(0, hostL.fac)], [1, teamName(1, hostL.fac)]], LB.team, true);
    return `<div class="screen sub"><div class="panel"><div class="subhead"><h2>${T('net_lobby')}</h2><button class="btn small danger" data-act="net_leave">${T('net_leave')}</button></div>
      <div class="row" style="margin-top:10px"><span class="code">${escapeHtml(NET.code || '')}</span><button class="btn small" data-act="net_copy">${T('net_copycode')}</button><span class="note">${T('net_share')}</span></div>
      <div class="lobbygrid" style="margin-top:18px">
        <div><h3>${T('net_players')} (${players.length}/${MAX_HUMANS})</h3><div class="plist">${rows}</div>
          ${MODES[hostL.mode] && MODES[hostL.mode].teams ? `<h3>${T('net_myteam')}</h3>${myTeam}` : ''}
          <div class="actions">${host ? `<button class="btn primary" data-act="net_start">${T('deploy')}</button>` : `<button class="btn ${LB.ready ? '' : 'primary'}" data-act="net_ready">${LB.ready ? T('net_notready') : T('net_imready')}</button>`}</div>
          <p class="note" style="margin-top:8px">${host ? T('net_hostnote') : T('net_waithost')}</p>
        </div>
        <div><h3>${T('mode')}</h3>${seg('mode', modes, hostL.mode)}<h3>${T('map')}</h3>${seg('map', maps, hostL.map)}<h3>${T('env')}</h3>${seg('env', ENV_ORDER.map((e) => [e, L(ENV_INFO[e])]), hostL.env || 'auto')}<h3>${T('factions')}</h3>${seg('fac', CONFIG.MATCHUP_ORDER.map((k) => [k, matchupName(k)]), hostL.fac || 'sv')}
          <h3>${T('net_size')}</h3>${seg('size', (MODES[hostL.mode].sizes || [4, 6, 8]).map((n) => [n, n === 4 ? '2 vs 2' : n === 6 ? '3 vs 3' : '4 vs 4']), MODES[hostL.mode].sizes && !MODES[hostL.mode].sizes.includes(hostL.size) ? MODES[hostL.mode].sizes[MODES[hostL.mode].sizes.length - 1] : hostL.size)}
          <h3>${T('net_fill')}</h3>${seg('fill', [['true', T('net_yes')], ['false', T('net_no')]], String(hostL.fill))}
          <h3>${T('difficulty')}</h3>${seg('diff', [['easy', T('easy')], ['normal', T('normal')], ['hard', T('hard')]], hostL.diff)}</div>
      </div>
      ${(players.find((p) => p.peer === NET.hostPeer) || {}).presence?.s === 'game' && !NET.active ? `<p class="note warn" style="margin-top:12px">${T('net_ingame')}</p>` : ''}
      <p class="note warn" style="margin-top:16px">${T('net_req')}</p></div></div>`;
  },
  after() { const i = document.getElementById('joinIn'); if (i && this.state === 'idle') i.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.onAct('net_join'); }); },
  refresh() { if (UI.screen === 'online') { const f = document.activeElement && document.activeElement.id; UI.render(); if (f) { const el = document.getElementById(f); if (el) el.focus(); } } },
  onInput(t) { if (t.dataset.net === 'code') this.joinCode = t.value.toLowerCase().replace(/[^a-z0-9]/g, ''); },
  async onAct(act, b) {
    try {
      if (act === 'net_back') { if (this.state === 'lobby') { NET.leave(); this.state = 'idle'; } UI.show('main'); return; }
      if (act === 'net_create' || act === 'net_join') {
        const code = act === 'net_create' ? Math.random().toString(36).slice(2, 6) : this.joinCode;
        if (!code) { this.err = T('net_needcode'); UI.render(); return; }
        this.state = 'connecting'; this.err = ''; UI.render();
        await NET.join(code);
        this.state = 'lobby'; UI.render();
        return;
      }
      if (act === 'net_leave') { NET.leave(); this.state = 'idle'; UI.render(); return; }
      if (act === 'net_ready') { NET.lobby.ready = !NET.lobby.ready; NET.setLobbyPresence(); UI.render(); return; }
      if (act === 'net_set') {
        let v = b.dataset.v; if (v === 'true') v = true; else if (v === 'false') v = false; else if (/^-?\d+$/.test(v)) v = +v;
        if (b.dataset.k === 'team') { NET.lobby.team = v; NET.setLobbyPresence(); UI.render(); return; }
        if (!NET.isHost) return;
        NET.lobby[b.dataset.k] = v; NET.setLobbyPresence(); UI.render(); return;
      }
      if (act === 'net_start' && NET.isHost) { NET.hostStart(); return; }
      if (act === 'net_copy') { try { await navigator.clipboard.writeText(NET.code); UI.toast(T('copied'), 1200); } catch (e) { UI.toast(NET.code, 2500); } return; }
    } catch (e) {
      this.state = 'idle'; this.err = (e && e.code === 'not_permitted') ? T('net_noperm') : T('net_fail'); UI.render();
    }
  },
  rematch() { if (NET.isHost) NET.hostStart(); else UI.toast(T('net_waithost')); },
  backToLobby() { if (NET.isHost) NET.sendCtl({ k: 'lobby' }); else UI.toast(T('net_waithost')); },
  leave() { NET.leave(); this.state = 'idle'; },
};

