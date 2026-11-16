// ---- 15b_ui.js ----
function loadSettings() {
  const s = Store.get('settings', {});
  G.settings = { ...DEFAULT_SETTINGS, ...s, custom: { ...DEFAULT_SETTINGS.custom, ...(s.custom || {}) } };
  // migración desde la versión anterior
  if (!CONFIG.GORE[G.settings.gore]) { G.settings.gore = 'low'; G.settings.goreChosen = false; }
  if (!CAMOS[G.settings.custom.camo]) G.settings.custom = { ...DEFAULT_SETTINGS.custom };
  if (!MODES[G.settings.lastMode]) G.settings.lastMode = 'tdm';
  if (!MAPS[G.settings.lastMap] || G.settings.lastMap === 'test') G.settings.lastMap = 'pueblo';
  if (![4, 6, 8].includes(G.settings.lastTeam)) G.settings.lastTeam = 8;
  if (!CONFIG.PRIMARIES.includes(G.settings.primary)) G.settings.primary = 'rifle';
  // clases (v2.1): quien venía de la versión anterior arranca con la clase de su arma
  if (!CONFIG.CLASSES[G.settings.cls]) G.settings.cls = (s.primary && CLASS_FOR_PRIMARY[s.primary]) || 'rifleman';
  if (!s.cls && s.primary) G.settings.cls = CLASS_FOR_PRIMARY[s.primary] || 'rifleman';
  // v2.7.3: quien venía con una sola clase personalizada la conserva en la ranura 1
  linkSlots(G.settings, s.slots, { ...(s.loadout || {}), primary: (s.loadout && s.loadout.primary) || G.settings.primary });
  if (!G.settings.wskins || typeof G.settings.wskins !== 'object') G.settings.wskins = {};
  if (!Array.isArray(G.settings.streaks)) G.settings.streaks = [];
  // v3.1.0 (época): fuera las armas, rachas y piezas modernas que ya no existen
  G.settings.streaks = G.settings.streaks.filter((k) => CONFIG.STREAKS[k]);
  for (const k of Object.keys(G.settings.wskins)) if (!CONFIG.WEAPONS[k] || !WSKINS[G.settings.wskins[k]]) delete G.settings.wskins[k];
  if (!CONFIG.MATCHUPS[G.settings.lastFac]) G.settings.lastFac = 'sv';
  if (!s.mig310) { G.settings.mig310 = 1; delete G.settings.custom.fx; }
  sanitizeCustomFor(G.settings, Progress.level());
  if (!s.envMig) { G.settings.lastEnv = 'random'; G.settings.envMig = 1; }   // v2.10.1: el ambiente ahora es aleatorio por defecto
  if (G.settings.name === 'Jugador') G.settings.name = 'Soldado';
  LANG = G.settings.lang || 'es';
}
// lo cosmético que ya no está desbloqueado (p. ej. tras importar un código de otro nivel) vuelve al valor base
function sanitizeCustomFor(st, level) {
  const c = st.custom, cats = { camo: CAMOS, helmet: HELMETS, face: FACES, vest: VESTS, pack: PACKS, pads: PADS };
  for (const k in cats) if (!cats[k][c[k]] || !Progress.has(k, c[k], level)) c[k] = DEFAULT_SETTINGS.custom[k];
  if (c.op && (!OPERATORS[c.op] || !Progress.has('operator', c.op, level))) c.op = null;
}
function saveSettings() { Store.set('settings', G.settings); }
const hex = (h) => '#' + new THREE.Color(h).getHexString();

const UI = {
  // datos bajo la mira de los fusiles de tirador: alza, respiración, pulso y (solo en la dificultad más fácil de la campaña) el viento
  scopeInfo(f, W) {
    if (!this._si) { this._si = document.createElement('div'); this._si.className = 'sinfo'; this.el.scope.appendChild(this._si); }
    const D = G.mode && G.mode.campaign && Camp.diff ? Camp.diff() : null, w = Ballistics.wind();
    let windTxt = '';
    if (D && D.windArrow) { const rel = Math.atan2(w.x, -w.z) + f.input.yaw; windTxt = `<span>${T('wind')} <b class="wind" style="transform:rotate(${(rel * 180 / Math.PI).toFixed(0)}deg)">↑</b> ${Math.hypot(w.x, w.z).toFixed(1)} m/s</span>`; }
    const key = (f.zero || 100) + '|' + Math.round((f.breath ?? 1) * 30) + '|' + (f.fatigueT > 0) + '|' + ((f.pulse || 0) > 0.5) + '|' + windTxt;
    if (key === this._siK) return; this._siK = key;
    this._si.innerHTML = `<span>${T('zero')}: ${f.zero || 100} m</span><span class="breath ${f.fatigueT > 0 ? 'tired' : ''}"><i style="width:${Math.round((f.breath ?? 1) * 100)}%"></i></span><span class="pulse" style="opacity:${(0.25 + (f.pulse || 0) * 0.75).toFixed(2)}"></span>${windTxt}<span style="opacity:.55">${T('zero_hint')}</span>`;
  },
  el: {}, screen: null, settingsTab: 'general', hudT: 0, lastHp: 100, feedN: 0, dmgArcs: [], medalQ: [], medalT: 0,
  $(id) { return document.getElementById(id); },
  init() {
    for (const id of ['menu', 'overlay', 'hud', 'score', 'killfeed', 'crosshair', 'hitmarker', 'dmgdir', 'scope', 'center-msg', 'medals', 'prompt', 'status', 'weapon', 'death', 'killcam', 'spectate', 'net-ind', 'fps', 'hint', 'radar', 'scoreboard', 'tuning', 'toasts', 'errbox', 'boot', 'fx-hurt', 'fx-flash', 'plus', 'ahint', 'fx-daze', 'wounds', 'compass', 'dmgnums'])
      this.el[id] = this.$(id);
    this.el.status.innerHTML = `<div id="streak-box"></div><div class="hpwrap"><div class="hpbar"><i id="hp-fill"></i><i id="hp-ghost"></i></div><span id="hp-num">100</span></div><div class="chips"><span class="chip" id="nade-chip" title="${T('frags')}">◆ 2</span><span class="chip" id="smoke-chip" title="${T('smokes')}">◍ 1</span><span class="chip" id="stance-chip"></span></div>`;
    this.el.weapon.innerHTML = `<div class="wcard"><img id="w-icon" alt="" hidden><div class="wtop"><span id="w-mode"></span><span id="w-name"></span></div><div class="ammo"><span id="ammo-mag">30</span><span id="ammo-res">/ 150</span></div><div id="ammo-strip"></div><div id="slots"></div></div><div class="wkeys"><span id="shoulder-chip" class="kchip"></span><span id="cam-chip" class="kchip"></span></div>`;
    for (const id of ['hp-fill', 'hp-ghost', 'hp-num', 'nade-chip', 'smoke-chip', 'stance-chip', 'streak-box', 'w-name', 'w-mode', 'ammo-mag', 'ammo-res', 'ammo-strip', 'slots', 'shoulder-chip', 'cam-chip', 'w-icon']) this.el[id] = this.$(id);
    this.ws = {}; this.wsActT = 0;
    for (let i = 0; i < 4; i++) { const d = document.createElement('i'); this.el.dmgdir.appendChild(d); this.dmgArcs.push({ el: d, t: 0, src: new THREE.Vector3() }); }
    this.radarCtx = this.el.radar.getContext('2d');
    this.applyHudPrefs();
    DmgNums.init();
    this.el.menu.addEventListener('click', (e) => this.onClick(e));
    this.el.overlay.addEventListener('click', (e) => this.onClick(e));
    this.el.menu.addEventListener('input', (e) => this.onInput(e));
    this.el.overlay.addEventListener('input', (e) => this.onInput(e));
    this.el.tuning.addEventListener('input', (e) => this.onTune(e));
    this.el.tuning.addEventListener('click', (e) => { if (e.target.dataset.act === 'copytune') this.copyTune(); });
    this.el.killcam.addEventListener('click', () => Replay.skip());
    this.$('gl').addEventListener('click', () => { if (Replay.playing) { Replay.skip(); return; } if (G.local && !G.local.alive && G.match && G.match.phase === 'fight' && !G.mode.respawn) CAM.cycleSpectate(); });
    this.bindBus();
    window.addEventListener('resize', () => this.layoutHud());
    this.layoutHud();
  },
  // escala del HUD según la ventana (1 a 1280×720) y posición del marcador y las bajas para que nada se encime
  layoutHud() {
    const W = innerWidth, H = innerHeight, root = document.documentElement;
    const hs = clamp(Math.min(W / 1280, H / 720) * (+G.settings.hudScale || 1), 0.5, 1.6);
    if (hs !== this._hs) { root.style.setProperty('--hs', hs.toFixed(3)); this._hs = hs; }
    const sc = this.el.score, kf = this.el.killfeed; if (!sc || !kf) return;
    const radarR = 14 + 176 * hs, scoreHalf = 260 * hs;
    const narrow = W / 2 - scoreHalf < radarR + 10;
    sc.style.top = narrow ? Math.round(radarR + 10) + 'px' : '';
    const scoreBottom = narrow ? radarR + 10 + (sc.offsetHeight || 62) * hs : 12 + (sc.offsetHeight || 62) * hs;
    const free = W / 2 - scoreHalf - 14 - 12;
    const below = narrow || free < 240 * hs;
    const cmp = this.el.compass, cmpH = cmp && !cmp.hidden ? 44 * hs : 0;
    if (cmp) cmp.style.top = Math.round(scoreBottom + 4) + 'px';
    kf.style.top = below ? Math.round(scoreBottom + 10 + cmpH) + 'px' : '';
    kf.style.maxWidth = Math.round((below ? Math.min(560 * hs, W - 28) : free) / hs) + 'px';
    if (this.el.fps) this.el.fps.style.top = Math.round(radarR + 8) + 'px';
  },
  setLang(l) { LANG = l; G.settings.lang = l; saveSettings(); document.title = l === 'en' ? 'Call of Washed: ' + CONFIG.TITLE_EN : 'Call of Washed'; this.render(); },

  // ------------------- menús -------------------
  show(screen) {
    this.screen = screen;
    this.el.menu.hidden = false; this.el.hud.hidden = true; Input.enabled = false;
    this.render();
    this.el.menu.scrollTop = 0;
  },
  // show() oculta el HUD; al cerrar un menú abierto desde la pausa hay que devolverlo
  hideMenu() { this.el.menu.hidden = true; this.screen = null; this.stopPreview(); if (this.inGame() && !(G.mode && G.mode.campaign)) this.el.hud.hidden = false; },
  render() {
    if (!this.screen) return;
    const s = this.screen;
    const html = s === 'main' ? this.htmlMain() : s === 'play' ? this.htmlPlay() : s === 'soldier' ? this.htmlSoldier() : s === 'gunsmith' ? this.htmlGunsmith() : s === 'settings' ? this.htmlSettings() : s === 'record' ? this.htmlRecord() : s === 'help' ? this.htmlHelp() : s === 'online' ? OnlineUI.html() : s === 'story' ? this.htmlStory() : s === 'campaign' ? this.htmlCampaign() : '';
    this.el.menu.innerHTML = html;
    if (this.screen === 'soldier' || this.screen === 'gunsmith') this.startPreview(); else this.stopPreview();
    if (s === 'online') OnlineUI.after();
  },
  htmlLogo() { return `<div class="logo"><span class="l1">CALL OF</span><span class="l2">WASHED</span>${LANG === 'en' ? `<span class="l3">${CONFIG.TITLE_EN}</span>` : ''}<span class="tag">${L(CONFIG.GAME_TAG)}</span></div>`; },
  htmlMain() {
    const r = Store.get('records', {});
    const item = (s, label, k) => `<button class="mitem" data-act="go" data-s="${s}"><span>${label}</span>${k ? `<small>${k}</small>` : ''}</button>`;
    return `<div class="screen mainscreen"><div class="col">${this.htmlLogo()}
      ${this.htmlProfile()}
      <nav class="mainnav">
        <button class="mitem camp" data-act="go" data-s="campaign"><span>${T('campaign')}</span><small>${T('campaign_sub')}</small></button>
        ${item('play', T('play'), L({ es: 'CONTRA LA TROPA', en: 'VS THE TROOPS' }))}<button class="mitem" data-act="range"><span>${T('range')}</span><small>${T('range_sub')}</small></button><button class="mitem" data-act="go" data-s="story"><span>${T('story')}</span><small>${T('story_sub')}</small></button>${item('online', T('online'), L({ es: 'HASTA 4', en: 'UP TO 4' }))}${item('soldier', T('soldier'), escapeHtml(className(curClassKey())))}
        ${item('record', T('record'), (r.matches || 0) + ' · ' + (r.kills || 0) + ' K')}${item('settings', T('settings'))}${item('help', T('help'))}
      </nav>
      <div class="mainfoot">
        <span class="langsw"><button data-act="lang" data-v="es" class="${LANG === 'es' ? 'on' : ''}">ES</button><button data-act="lang" data-v="en" class="${LANG === 'en' ? 'on' : ''}">EN</button></span>
        <span>${T('version')} ${CONFIG.VERSION}</span>
      </div></div><div></div></div>`;
  },
  htmlPlay() {
    const s = G.settings, M = MODES[s.lastMode], MP = MAPS[s.lastMap] || MAPS[MAP_ORDER[0]];
    const GL = { tdm: '⚔', ffa: '✦', dom: '⚑', elim: '☠', tags: '◈', squads: '▣', gun: '⌖' };
    const big = MAP_INFO[s.lastMap] !== 'small', ideal = MAP_IDEAL[big ? 'big' : 'small'];
    const modes = MODE_ORDER.map((m) => { const Mm = MODES[m];
      return `<button class="pl-mode ${s.lastMode === m ? 'on' : ''}" data-act="set" data-k="lastMode" data-v="${m}"><i>${GL[m] || '•'}</i><b>${L(Mm.name)}</b><small>${Mm.rounds ? T('pl_rounds') : Mm.teams ? T('pl_teams') : T('pl_solo')}</small></button>`; }).join('');
    const maps = MAP_ORDER.map((id) => `<button class="pl-map ${s.lastMap === id ? 'on' : ''}" data-act="set" data-k="lastMap" data-v="${id}"><div class="th" style="background-image:url(${mapThumb(id)})"></div><b>${L(MAPS[id].name)}</b></button>`).join('');
    const th = MP.thumb, seg = (k, opts, lab, cur = s[k]) => `<div class="field"><span class="lbl">${lab}</span><div class="seg">${opts.map(([v, t]) => `<button data-act="set" data-k="${k}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div></div>`;
    const size = M.sizes ? M.sizes.map((n) => [n, n === 4 ? '2 vs 2' : '3 vs 3']) : M.teams ? [[4, '2 vs 2'], [6, '3 vs 3'], [8, '4 vs 4']] : [[4, T('players_ffa', { n: 4 })], [6, T('players_ffa', { n: 6 })], [8, T('players_ffa', { n: 8 })]];
    const team = M.sizes && !M.sizes.includes(s.lastTeam) ? M.sizes[M.sizes.length - 1] : s.lastTeam;
    const chips = [M.teams ? T('pl_teams') : T('pl_solo'), M.respawn ? T('pl_resp') : T('pl_noresp'), M.time ? fmtTime(M.time) : '', M.scoreLimit ? T('pl_limit', { n: M.scoreLimit }) : ''].filter(Boolean).map((c) => `<em>${c}</em>`).join('');
    const rec = ideal.includes(s.lastMode);
    return `<div class="screen lo-screen"><div class="lo play">
      <header class="lo-top"><button class="btn small" data-act="go" data-s="main">${T('back')}</button><h2>${T('quick_setup')}</h2><div class="lo-rank"><span>${L(M.name)} · ${L(MP.name)}</span></div></header>
      <div class="lo-body">
        <aside class="lo-left"><h3 class="lo-h">${T('mode')}</h3>${modes}</aside>
        <section class="pl-mid">
          <div class="pl-hero" style="background-image:url(${mapThumb(s.lastMap)}), linear-gradient(180deg,${th[0]},${th[1]} 58%,${th[2]} 60%,${th[2]})"><div class="pl-hero-txt">
            <small>${T('map')}</small><h1>${escapeHtml(L(MP.name))}</h1><p>${escapeHtml(L(MP.desc))}</p>
            <div class="pl-chips"><em>${big ? T('map_big') : T('map_small')}</em><em>${T('pl_ideal')}: ${ideal.map((m) => escapeHtml(L(MODES[m].name))).join(' · ')}</em>${rec ? `<em class="rec">${T('pl_rec')}</em>` : ''}</div></div></div>
          <div class="pl-maps">${maps}</div>
          <div class="pl-modecard"><h3>${escapeHtml(L(M.name))}</h3><p>${escapeHtml(L(M.desc))}</p><div class="pl-chips">${chips}</div></div>
        </section>
        <aside class="pl-right"><h3 class="lo-h">${T('pl_summary')}</h3>
          ${seg('lastTeam', size, T('squad'), team)}${M.teams ? seg('lastFac', CONFIG.MATCHUP_ORDER.map((k) => [k, matchupName(k)]), T('factions'), CONFIG.MATCHUPS[s.lastFac] ? s.lastFac : 'sv') : ''}${seg('lastDiff', [['easy', T('easy')], ['normal', T('normal')], ['hard', T('hard')]], T('difficulty'))}${seg('lastEnv', ENV_ORDER.map((e) => [e, L(ENV_INFO[e])]), T('env'), ENV_INFO[s.lastEnv] ? s.lastEnv : 'random')}<div class="field"><span class="lbl">${T('cls')}</span><div class="seg cls2">${classKeys().map((k) => `<button data-act="cls" data-v="${k}" class="${curClassKey() === k ? 'on' : ''}">${escapeHtml(className(k))}</button>`).join('')}</div></div>
          <button class="btn primary big pl-go" data-act="startGame">${T('deploy')}</button></aside>
      </div></div></div>`;
  },
  // campaña · El Relojero: Modo lector (qué Partes se ven) y lista de misiones con su cabecera exacta
  htmlCampaign() {
    const rd = Camp.read(), nx = Camp.next(), flash = this.campFlash; this.campFlash = null;
    const opts = CAMP_READ_OPTS.map(([v, lab]) => `<button data-act="camp_read" data-v="${v}" class="${rd === v ? 'on' : ''}">${escapeHtml(L(lab))}</button>`).join('');
    const parts = Camp.visibleParts().map((P) => {
      const list = CAMPAIGN.filter((m) => m.part === P.part && Camp.visible(m));
      const rows = list.map((m) => {
        const ok = Camp.playable(m), done = Camp.isDone(m.id);
        const st = done ? `<em class="done">${T('camp_done')}</em>` : ok ? `<em class="ok">${T('camp_playable')}</em>` : `<em>${T('camp_wip', { v: m.phase })}</em>`;
        return `<button class="cm-row ${ok ? '' : 'wip'} ${done ? 'isdone' : ''} ${flash === m.id ? 'flash' : ''}" data-act="camp_play" data-v="${m.id}" ${ok ? '' : 'aria-disabled="true"'}>
          <span class="cm-code">${m.id}</span><span class="cm-main"><b>${escapeHtml(L(m.title))}</b><small class="cm-head">${escapeHtml(campHead(m))}</small></span><span class="cm-type">${escapeHtml(L(CAMP_TYPE[m.type]))}</span>${st}</button>`;
      }).join('') || `<p class="cm-empty">${T('camp_part_wip')}</p>`;
      return `<section class="cm-part"><h3>${escapeHtml(L(P.title))}</h3>${rows}</section>`;
    }).join('');
    return `<div class="screen lo-screen"><div class="lo play camp">
      <header class="lo-top"><button class="btn small" data-act="go" data-s="main">${T('back')}</button><h2>${T('campaign')}</h2><div class="lo-rank"><span>${T('campaign_sub')}</span></div></header>
      <div class="lo-body" style="grid-template-columns:1fr 330px">
        <section class="pl-mid cm-list">${parts}</section>
        <aside class="pl-right"><h3 class="lo-h">${T('camp_reader')}</h3>
          <p class="note">${T('camp_reader_d')}</p>
          <div class="field"><span class="lbl">${T('camp_read_upto')}</span><div class="seg cm-read">${opts}</div></div>
          <h3 class="lo-h">${T('camp_diff')}</h3>
          <div class="seg cm-diff">${CONFIG.CAMP_DIFF_ORDER.map((k) => `<button data-act="camp_diff" data-v="${k}" class="${Camp.diffId() === k ? 'on' : ''}">${escapeHtml(L(CONFIG.CAMP_DIFF[k]))}</button>`).join('')}</div>
          <p class="note">${escapeHtml(L(Camp.diff().d))}</p>
          ${nx ? `<div class="cm-next"><small>${T('camp_next')}</small><b>${escapeHtml(L(nx.title))}</b><span>${escapeHtml(campHead(nx))}</span></div><button class="btn primary big pl-go" data-act="camp_play" data-v="${nx.id}">${Camp.isDone('P0-I') || Object.keys(Camp.data().done).length ? T('camp_continue') : T('camp_begin')}</button>` : `<p class="note">${T('camp_all_done')}</p>`}
          <p class="note small">${T('camp_controls')}</p></aside>
      </div></div></div>`;
  },
  // modo Cárcel: elegir con qué ropa despierta el equipo y empezar
  htmlStory() {
    const s = G.settings, MP = MAPS.carcel, th = MP.thumb, cur = STORY_OUTFITS.includes(s.storyOutfit) ? s.storyOutfit : 'paciente';
    const card = (k, d) => `<button class="card op ${cur === k ? 'on' : ''}" data-act="set" data-k="storyOutfit" data-v="${k}"><i class="opstrip" style="background:linear-gradient(90deg,${OUTFITS[k].base} 0 60%,${OUTFITS[k].c[2]} 60%)"></i><b>${escapeHtml(L(OUTFITS[k]))}</b><span class="d">${escapeHtml(L(d))}</span></button>`;
    return `<div class="screen lo-screen"><div class="lo play">
      <header class="lo-top"><button class="btn small" data-act="go" data-s="main">${T('back')}</button><h2>${T('story')}</h2><div class="lo-rank"><span>${escapeHtml(L(MODES.carcel.name))}</span></div></header>
      <div class="lo-body" style="grid-template-columns:1fr 320px">
        <section class="pl-mid"><div class="pl-hero" style="background:linear-gradient(180deg,${th[0]},${th[1]} 58%,${th[2]} 60%,${th[2]})"><div class="pl-hero-txt"><small>${T('map')}</small><h1>${escapeHtml(L(MP.name))}</h1><p>${escapeHtml(L(MP.desc))}</p>
          <div class="pl-chips"><em>${L({ es: 'Sin energía', en: 'No power' })}</em><em>${L({ es: 'Inventario limitado', en: 'Limited inventory' })}</em><em>${L({ es: 'Los infectados oyen', en: 'The infected hear' })}</em></div></div></div>
          <div class="pl-modecard"><h3>${L({ es: 'Controles del modo', en: 'Mode controls' })}</h3><p>${L({ es: '<kbd>Tab</kbd>/<kbd>I</kbd> inventario · <kbd>E</kbd> recoger · <kbd>X</kbd> curarse · <kbd>G</kbd> lanzar botella o bengala · <kbd>L</kbd> linterna · <kbd>F</kbd> repetido para zafarte si te agarran', en: '<kbd>Tab</kbd>/<kbd>I</kbd> inventory · <kbd>E</kbd> pick up · <kbd>X</kbd> heal · <kbd>G</kbd> throw bottle or flare · <kbd>L</kbd> flashlight · mash <kbd>F</kbd> to break free when grabbed' })}</p></div>
        </section>
        <aside class="pl-right"><h3 class="lo-h">${L({ es: 'Despiertas vestido de…', en: 'You wake up wearing…' })}</h3>
          <div class="cards" style="display:grid;gap:8px">${card('paciente', { es: 'Pijama de hospital, venda en la cabeza y pulsera del ingreso.', en: 'Hospital scrubs, head bandage and an admission wristband.' })}${card('reo', { es: 'Mono naranja con número, camiseta blanca y zapatillas de lona.', en: 'Numbered orange jumpsuit, white tee and canvas shoes.' })}</div>
          <button class="btn primary big pl-go" data-act="story">${L({ es: 'DESPERTAR', en: 'WAKE UP' })}</button></aside>
      </div></div></div>`;
  },
  soldierTab: 'kit', pickList: null, gsSlot: null,
  htmlSoldier() {
    const s = G.settings, tab = this.soldierTab, pi = Progress.info(), kit = tab === 'kit';
    const tabs = [['kit', T('tab_kit')], ['look', T('tab_look')], ['streaks', T('tab_streaks')], ['prog', T('tab_prog')]];
    const back = this.inGame() ? 'backPause' : 'go';
    const mid = kit ? this.htmlLoKit() : `<div class="panel">${tab === 'look' ? this.htmlLook() : tab === 'streaks' ? this.htmlStreaks() : this.htmlProg()}</div>`;
    return `<div class="screen lo-screen"><div class="lo ${kit ? '' : 'wide'}">
      <header class="lo-top"><button class="btn small" data-act="${back}" data-s="main">${T('back')}</button><h2>${T('soldier')}</h2>
        <div class="seg tabs">${tabs.map(([v, t]) => `<button data-act="stab" data-v="${v}" class="${tab === v ? 'on' : ''}">${t}</button>`).join('')}</div>
        <div class="lo-rank">${rankBadge(pi.level, 26, Progress.prestige())}<span>${Progress.prestige() ? T('prestige') + ' ' + Progress.prestige() + ' · ' : ''}${escapeHtml(Progress.rankName(pi.level))} · ${T('level')} ${pi.level}</span></div></header>
      <div class="lo-body">${kit ? `<aside class="lo-left">${this.htmlLoLeft()}</aside>` : ''}<section class="lo-mid">${mid}</section>
        <div class="lo-stage"><canvas id="preview"></canvas><span class="lo-hint">${T('lo_rotate')}</span>
          <div class="lo-name"><label for="nameIn">${T('name')}</label><input type="text" id="nameIn" maxlength="14" value="${escapeHtml(s.name)}"></div></div></div></div></div>`;
  },
  icoImg(w, att) { const u = weaponIconURL(w, att); return u ? `<img src="${u}" alt="">` : '<i class="noic"></i>'; },
  // columna izquierda: lista de clases, o la lista de opciones del renglón que se está cambiando
  // lista de armas principales por clase: filtro de clases arriba; en "Todas" se agrupan con su encabezado
  wclass: null,
  weaponList(cur, mk) {
    const sel = this.wclass === 'all' ? 'all' : (this.wclass && CONFIG.WCLASSES[this.wclass]) ? this.wclass : CONFIG.WEAPONS[cur].wc;
    const chips = ['all', ...CONFIG.WCLASS_ORDER].map((c) => `<button class="${sel === c ? 'on' : ''}" data-act="wclass" data-v="${c}">${c === 'all' ? T('wc_all') : escapeHtml(L(CONFIG.WCLASSES[c].s))}</button>`).join('');
    let rows = '', last = '';
    for (const w of CONFIG.PRIMARIES) {
      const c = CONFIG.WEAPONS[w].wc; if (sel !== 'all' && c !== sel) continue;
      if (sel === 'all' && c !== last) { rows += `<p class="lo-sub">${escapeHtml(L(CONFIG.WCLASSES[c]))}</p>`; last = c; }
      rows += mk(w);
    }
    return `<div class="wc-bar">${chips}</div>${rows}`;
  },
  htmlLoLeft() {
    const s = G.settings, lvl = Progress.level(), lock = (n) => ` · 🔒 ${T('locked_lvl', { n })}`;
    if (this.pickList && s.cls === 'custom') {
      const lo = classLoadout('custom', s.loadout, lvl, { wskins: s.wskins }), kind = this.pickList;
      let rows = '', title = '';
      if (kind === 'primary') { title = T('lo_primary'); rows = this.weaponList(lo.primary, (w) => { const W = CONFIG.WEAPONS[w], n = CONFIG.UNLOCK.weapon[w] || 1;
        return `<button class="lo-opt ${lo.primary === w ? 'on' : ''}" data-act="lo_primary" data-v="${w}" ${n > lvl ? 'disabled' : ''}>${this.icoImg(w)}<b>${escapeHtml(L(W.name))}</b><small>${escapeHtml(L(W.cls))}${n > lvl ? lock(n) : ` · ${T('lv_short')} ${Progress.wlevel(w)}`}</small></button>`; }); }
      else if (kind === 'secondary') { title = T('lo_secondary'); rows = CONFIG.SECONDARIES.map((w) => { const W = CONFIG.WEAPONS[w], n = CONFIG.UNLOCK.secondary[w] || 1;
        return `<button class="lo-opt ${lo.secondary === w ? 'on' : ''}" data-act="lo_secondary" data-v="${w}" ${n > lvl ? 'disabled' : ''}>${this.icoImg(w)}<b>${escapeHtml(L(W.name))}</b><small>${escapeHtml(L(W.cls))}${n > lvl ? lock(n) : ''}</small></button>`; }).join(''); }
      else { title = T('lo_perk'); rows = Object.keys(CONFIG.PERKS).map((k) => { const pk = CONFIG.PERKS[k];
        return `<button class="lo-opt perk ${lo.perk === k ? 'on' : ''}" data-act="lo_perk" data-v="${k}" ${pk.lvl > lvl ? 'disabled' : ''}><b>${escapeHtml(L(pk))}</b><small>${escapeHtml(L(pk.d))}${pk.lvl > lvl ? lock(pk.lvl) : ''}</small></button>`; }).join(''); }
      return `<button class="lo-backlist" data-act="lo_open" data-v="">‹ ${T('cls')}</button><h3 class="lo-h">${title}</h3>${rows}`;
    }
    const cur = curClassKey();
    const items = classKeys().map((k, i) => { const lo = loFor(k, lvl, { wskins: s.wskins });
      const head = i === 0 ? `<p class="lo-sub">${T('lo_mine')}</p>` : i === CUSTOM_SLOTS ? `<p class="lo-sub">${T('lo_presets')}</p>` : '';
      return `${head}<button class="lo-cls ${cur === k ? 'on' : ''}" data-act="cls" data-v="${k}"><i>${String(i + 1).padStart(2, '0')}</i><b>${escapeHtml(className(k))}</b><small>${escapeHtml(L(CONFIG.WEAPONS[lo.primary].name))}</small></button>`; }).join('');
    return `<h3 class="lo-h">${T('cls')}</h3>${items}<p class="note">${T('lo_digits')}</p>`;
  },
  // centro: el equipo de la clase elegida
  htmlLoKit() {
    const s = G.settings, lvl = Progress.level(), custom = s.cls === 'custom';
    const lo = classLoadout(s.cls, s.loadout, lvl, { wskins: s.wskins, streaks: s.streaks });
    const C = CONFIG.CLASSES[lo.cls] || CONFIG.CLASSES.rifleman, PW = CONFIG.WEAPONS[lo.primary], SW = CONFIG.WEAPONS[lo.secondary], pk = CONFIG.PERKS[lo.perk];
    const idx = classKeys().indexOf(curClassKey()) + 1;
    const chips = ATT_SLOTS.map((sl) => lo.att[sl]).filter((a) => a && !['none', 'std', 'iron', 'fmj'].includes(a)).map((a) => `<em>${escapeHtml(L(CONFIG.ATTACH.items[a]))}</em>`).join('') || `<em>${escapeHtml(L(CONFIG.ATTACH.items.iron))}</em>`;
    const m = Progress.mastery(lo.primary), stars = `<span class="stars">${'★'.repeat(m)}${'☆'.repeat(3 - m)}</span>`;
    const row = (kind, label, icon, name, sub, extra) => {
      const body = `<span class="lo-ic">${icon || ''}</span><span class="lo-tx"><small class="rl">${label}</small><b>${escapeHtml(name)}</b>${sub ? `<span class="rc">${sub}</span>` : ''}${extra || ''}</span>`;
      return kind && custom ? `<button class="lo-rowmain ${this.pickList === kind ? 'on' : ''}" data-act="lo_open" data-v="${kind}">${body}<s>›</s></button>` : `<div class="lo-static">${body}</div>`;
    };
    const frags = lo.frags + (lo.perk === 'ammo' ? 1 : 0);
    const chosen = pickStreaks(s.streaks, lvl).map((id) => { const S = CONFIG.STREAKS[id]; return `<em>${escapeHtml(L(S))} · ${S.kills}</em>`; }).join('');
    return `<div class="lo-kit">
      <div class="lo-clshead"><i>${String(idx).padStart(2, '0')}</i><div>${custom ? `<input type="text" id="clsNameIn" class="lo-clsname" maxlength="14" value="${escapeHtml(className(curClassKey()))}" aria-label="${T('cls_rename')}">` : `<h3>${escapeHtml(L(C))}</h3>`}<p>${escapeHtml(L(C.d))}</p></div></div>
      ${custom ? '' : `<div class="lo-edit"><span>${T('lo_preset_hint')}</span><button class="btn small primary" data-act="cls" data-v="custom">${T('lo_edit_custom')}</button></div>`}
      <div class="lo-row">${row('primary', T('lo_primary'), this.icoImg(lo.primary, lo.att), L(PW.name), `${escapeHtml(L(PW.cls))} ${stars} · ${T('lv_short')} ${Progress.wlevel(lo.primary)}`, `<span class="atts">${chips}</span>`)}${custom ? `<button class="btn small lo-gs" data-act="go" data-s="gunsmith">${T('gs_title')}</button>` : ''}</div>
      <div class="lo-row">${row('secondary', T('lo_secondary'), this.icoImg(lo.secondary), L(SW.name), escapeHtml(L(SW.cls)))}</div>
      <div class="lo-row">${row('', T('lo_melee'), this.icoImg('knife'), L(CONFIG.WEAPONS.knife.name), '')}</div>
      <div class="lo-pair"><div class="lo-row">${row('', T('lo_tactical'), '<i class="gl">◍</i>', T('lo_smoke'), `× ${lo.smokes}`)}</div><div class="lo-row">${row('', T('lo_lethal'), '<i class="gl">◆</i>', T('lo_frag'), `× ${frags}`)}</div></div>
      <div class="lo-row">${row('perk', T('lo_perk'), '<i class="gl">✦</i>', L(pk), escapeHtml(L(pk.d)))}</div>
      <button class="lo-rowmain lo-streaks" data-act="stab" data-v="streaks"><span class="lo-tx"><small class="rl">${T('lo_streaks')}</small><span class="atts">${chosen}</span></span><s>›</s></button>
      <div class="lo-stats"><small class="rl">${T('gs_stats')}</small>${this.cmpBars(lo.primary, lo.att, lo.perk)}</div></div>`;
  },
  // armero: el arma grande en el centro, ranuras abajo y estadísticas a la derecha
  htmlGunsmith() {
    const s = G.settings, lvl = Progress.level();
    if (s.cls !== 'custom') { this.screen = 'soldier'; return this.htmlSoldier(); }
    const lo = classLoadout('custom', s.loadout, lvl, { wskins: s.wskins }), P = lo.primary, PW = CONFIG.WEAPONS[P], slots = CONFIG.ATTACH.slots[P];
    const ids = ATT_SLOTS.filter((sl) => slots[sl].length > 1), cur = ids.includes(this.gsSlot) ? this.gsSlot : ids[0], used = attCount(P, lo.att);
    const wi = Progress.winfo(P), wpct = wi.need ? Math.round(100 * wi.into / wi.need) : 100, m = Progress.mastery(P);
    const chl = Progress.chList(P), nDone = chl.filter((x) => x.done).length, tab = this.gsTab === 'camo' ? 'camo' : 'att';
    const weaps = this.weaponList(P, (w) => { const W = CONFIG.WEAPONS[w], n = CONFIG.UNLOCK.weapon[w] || 1;
      return `<button class="lo-opt ${P === w ? 'on' : ''}" data-act="lo_primary" data-v="${w}" ${n > lvl ? 'disabled' : ''}>${this.icoImg(w)}<b>${escapeHtml(L(W.name))}</b><small>${escapeHtml(L(W.cls))}${n > lvl ? ` · 🔒 ${T('locked_lvl', { n })}` : ` · ${T('lv_short')} ${Progress.wlevel(w)}`}</small></button>`; });
    const tiles = ids.map((sl) => { const a = lo.att[sl], it = CONFIG.ATTACH.items[a], on = a !== slots[sl][0];
      return `<button class="gs-tile ${sl === cur && tab === 'att' ? 'sel' : ''} ${on ? 'set' : ''}" data-act="gs_slot" data-v="${sl}"><small>${escapeHtml(L(CONFIG.ATTACH.slotNames[sl]))}</small><b>${on ? escapeHtml(L(it)) : T('gs_none')}</b></button>`; }).join('');
    let right;
    if (tab === 'att') {
      const opts = cur ? slots[cur].map((a) => { const it = CONFIG.ATTACH.items[a], need = Progress.attReq(P, a), locked = !Progress.attOk(P, a), full = used >= CONFIG.ATTACH.pick && a !== slots[cur][0] && lo.att[cur] === slots[cur][0];
        return `<button class="gs-opt ${lo.att[cur] === a ? 'on' : ''} ${full ? 'full' : ''}" data-act="lo_att" data-k="${cur}" data-v="${a}" ${locked ? 'disabled' : ''}><b>${escapeHtml(L(it))}</b><small>${escapeHtml(L(it.d))}</small>${locked ? `<small class="lock">🔒 ${T('gs_wneed', { n: need })}</small>` : ''}</button>`; }).join('') : '';
      let nxL = 0, nxN = []; for (let l = wi.level + 1; l <= CONFIG.WLVL.max; l++) { const n = Progress.attUnlocksAt(P, l); if (n.length) { nxL = l; nxN = n; break; } }
      right = `<h3 class="lo-h">${cur ? escapeHtml(L(CONFIG.ATTACH.slotNames[cur])) : ''}</h3><div class="gs-opts">${opts}</div>
        <h3 class="lo-h">${T('gs_stats')}</h3>${this.cmpBars(P, lo.att, lo.perk)}<p class="note" style="margin-top:8px">${T('cmp_legend')}</p>
        ${nxL ? `<p class="note mastery">${T('gs_next', { n: nxL, a: escapeHtml(nxN.join(', ')) })}</p>` : ''}`;
    } else {
      const cur2 = lo.att.skin || 'none';
      const row = (sk, name, sub, pct, ok, cls = '') => { const sw = WSKINS[sk].sw;
        return `<div class="chrow ${ok ? 'ok' : ''} ${cur2 === sk ? 'on' : ''} ${cls}"><i class="chsw" style="background:${sw ? hex(sw.metal) : '#585c60'}"></i><div class="cht"><b>${escapeHtml(name)}</b><small>${sub}</small>${pct == null ? '' : `<span class="chbar"><i style="width:${pct}%"></i></span>`}</div>${ok ? `<button class="btn small ${cur2 === sk ? 'primary' : ''}" data-act="lo_skin" data-v="${sk}">${cur2 === sk ? T('ch_equipped') : T('ch_equip')}</button>` : '<span class="chlock">🔒</span>'}</div>`; };
      const rows = chl.map((x) => row(x.c.skin, L(WSKINS[x.c.skin]), `${escapeHtml(L(x.c))} · ${x.v}/${x.n}`, Math.round(100 * x.v / x.n), Progress.camoOk(P, x.c.skin))).join('');
      right = `<h3 class="lo-h">${T('ch_title')} · ${nDone}/${WCH.length}</h3>
        ${row('none', L(WSKINS.none), T('ch_factory'), null, true)}${rows}${row('gold', L(WSKINS.gold), T('ch_gold_sub', { n: nDone, m: WCH.length }), Math.round(100 * nDone / WCH.length), Progress.camoOk(P, 'gold'), 'gold')}`;
    }
    return `<div class="screen lo-screen"><div class="lo gs">
      <header class="lo-top"><button class="btn small" data-act="go" data-s="soldier">‹ ${T('gs_back')}</button><h2>${T('gs_title')}</h2>
        <div class="gs-wname"><b>${escapeHtml(L(PW.name))}</b><span>${escapeHtml(L(PW.cls))}</span><span class="stars">${'★'.repeat(m)}${'☆'.repeat(3 - m)}</span>
          <span class="gs-lv">${T('gs_wlevel')} ${wi.level}<span class="wxbar"><i style="width:${wpct}%"></i></span><small>${wi.need ? T('gs_wxp', { a: wi.into, b: wi.need, n: wi.level + 1 }) : T('gs_wmax')}</small></span></div>
        <div class="lo-rank"><span class="pickct ${used >= CONFIG.ATTACH.pick ? 'full' : ''}">${used}/${CONFIG.ATTACH.pick} ${T('attachments').toLowerCase()}</span></div></header>
      <div class="lo-body"><aside class="lo-left"><h3 class="lo-h">${T('gs_weapons')}</h3>${weaps}</aside>
        <div class="lo-stage"><canvas id="preview"></canvas><span class="lo-hint">${T('lo_rotate')}</span></div>
        <aside class="lo-right"><div class="seg tabs gs-tabs"><button data-act="gs_tab" data-v="att" class="${tab === 'att' ? 'on' : ''}">${T('gs_att')}</button><button data-act="gs_tab" data-v="camo" class="${tab === 'camo' ? 'on' : ''}">${T('gs_camo')} · ${nDone}/${WCH.length}</button></div>${right}</aside></div>
      <div class="gs-tiles">${tiles}</div></div></div>`;
  },
  // barras comparativas del armero: gris = de fábrica, color = tu configuración
  cmpBars(id, att, perk) {
    const before = weaponBars(id, defaultAtt(id), perk), after = weaponBars(id, att, perk);
    const rows = [['dmg', 'st_dmg'], ['rate', 'st_rate'], ['range', 'st_range'], ['ctl', 'st_ctl'], ['acc', 'st_acc'], ['mob', 'st_mob']];
    return `<div class="cmp">${rows.map(([k, l]) => { const d = Math.round((after[k] - before[k]) * 100);
      return `<span class="cl">${T(l)}</span><span class="cbar"><i class="b" style="width:${Math.round(before[k] * 100)}%"></i><i class="a ${d > 0 ? 'up' : d < 0 ? 'down' : ''}" style="width:${Math.round(after[k] * 100)}%"></i></span><span class="cv ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '+' : ''}${d || ''}</span>`; }).join('')}</div>`;
  },
  htmlKit() {
    const s = G.settings, lvl = Progress.level(), lock = (n) => `<small class="lock">🔒 ${T('locked_lvl', { n })}</small>`;
    const bar = (v) => `<span class="sbar"><i style="width:${Math.round(v * 100)}%"></i></span>`;
    const stars = (w) => { const m = Progress.mastery(w); return m ? `<span class="stars">${'★'.repeat(m)}${'☆'.repeat(3 - m)}</span>` : ''; };
    const cards = CONFIG.CLASS_ORDER.map((k) => {
      const C = CONFIG.CLASSES[k], lo = classLoadout(k, s.loadout, lvl, { wskins: s.wskins });
      const chips = ATT_SLOTS.map((sl) => lo.att[sl]).filter((a) => a && !['none', 'std', 'iron', 'fmj'].includes(a)).map((a) => `<em>${escapeHtml(L(CONFIG.ATTACH.items[a]))}</em>`).join('');
      return `<button class="card cls ${s.cls === k ? 'on' : ''}" data-act="cls" data-v="${k}"><b>${L(C)}</b><span class="cls">${escapeHtml(L(CONFIG.WEAPONS[lo.primary].name))}${k === 'custom' ? ' · ' + escapeHtml(L(CONFIG.WEAPONS[lo.secondary].name)) : ''}</span>
        <span class="atts">${chips || `<em>${escapeHtml(L(CONFIG.ATTACH.items.iron))}</em>`}</span>
        <span class="kit">◆ ${lo.frags + (lo.perk === 'ammo' ? 1 : 0)} · ◍ ${lo.smokes} · ${escapeHtml(L(CONFIG.PERKS[lo.perk]))}</span>
        <span class="d">${L(C.d)}</span></button>`;
    }).join('');
    let custom = '';
    if (s.cls === 'custom') {
      const lo = classLoadout('custom', s.loadout, lvl, { wskins: s.wskins }), P = lo.primary, slots = CONFIG.ATTACH.slots[P], PW = CONFIG.WEAPONS[P];
      const weaps = CONFIG.PRIMARIES.map((w) => { const W = CONFIG.WEAPONS[w], st = W.stats, locked = (CONFIG.UNLOCK.weapon[w] || 1) > lvl;
        return `<button class="card weap ${P === w ? 'on' : ''}" data-act="lo_primary" data-v="${w}" ${locked ? 'disabled' : ''}><b>${L(W.name)} ${stars(w)}</b><span class="cls">${L(W.cls)}</span>
          <div class="stats"><span>${T('st_dmg')}</span>${bar(st.dmg)}<span>${T('st_rate')}</span>${bar(st.rate)}<span>${T('st_range')}</span>${bar(st.range)}<span>${T('st_mob')}</span>${bar(st.mob)}</div>${locked ? lock(CONFIG.UNLOCK.weapon[w]) : ''}</button>`; }).join('');
      const secs = CONFIG.SECONDARIES.map((w) => { const W = CONFIG.WEAPONS[w], locked = (CONFIG.UNLOCK.secondary[w] || 1) > lvl;
        return `<button class="card weap ${lo.secondary === w ? 'on' : ''}" data-act="lo_secondary" data-v="${w}" ${locked ? 'disabled' : ''}><b>${L(W.name)}</b><span class="cls">${L(W.cls)}</span>
          <span class="d">${T('st_dmg')} ${W.damage} · ${W.fireRate} ${T('per_s')} · ${W.mag}+${W.reserve}</span>${locked ? lock(CONFIG.UNLOCK.secondary[w]) : ''}</button>`; }).join('');
      const used = attCount(P, lo.att);
      const rows = ATT_SLOTS.filter((sl) => slots[sl].length > 1).map((sl) => `<div class="attrow"><span class="lbl">${L(CONFIG.ATTACH.slotNames[sl])}</span><div class="seg wrap">${slots[sl].map((a) => {
        const it = CONFIG.ATTACH.items[a], locked = it.lvl > lvl, full = used >= CONFIG.ATTACH.pick && a !== slots[sl][0] && lo.att[sl] === slots[sl][0];
        return `<button data-act="lo_att" data-k="${sl}" data-v="${a}" class="${lo.att[sl] === a ? 'on' : ''}" ${locked ? 'disabled' : ''} title="${escapeHtml(L(it.d))}">${escapeHtml(L(it))}${locked ? lock(it.lvl) : ''}</button>`; }).join('')}</div>
        <span class="note">${escapeHtml(L(CONFIG.ATTACH.items[lo.att[sl]].d))}</span></div>`).join('');
      const k = Progress.kills(P), tiers = [40, 150, 400], nx = tiers.find((t) => k < t);
      const skinsHtml = Object.keys(WSKINS).map((k2) => { const ok = k2 === 'none' || wskinOk(k2, P, lvl), sw = WSKINS[k2].sw;
        const need = (CONFIG.UNLOCK.wskin[k2] || 1) > lvl ? (MASTERY_SKIN[k2] ? T('skin_need_m', { n: CONFIG.UNLOCK.wskin[k2], k: tiers[MASTERY_SKIN[k2] - 1] }) : T('locked_lvl', { n: CONFIG.UNLOCK.wskin[k2] })) : '';
        return `<button class="skinbtn ${(lo.att.skin || 'none') === k2 ? 'on' : ''}" data-act="lo_skin" data-v="${k2}" ${ok ? '' : 'disabled'} title="${escapeHtml(L(WSKINS[k2]) + (ok ? '' : ' · ' + need))}"><i style="background:${sw ? hex(sw.metal) : '#585c60'}"></i><b>${escapeHtml(L(WSKINS[k2]))}</b>${ok ? '' : `<small class="lock">🔒 ${need}</small>`}</button>`; }).join('');
      const perks = Object.keys(CONFIG.PERKS).map((k2) => { const pk = CONFIG.PERKS[k2], locked = pk.lvl > lvl;
        return `<button class="card perk ${lo.perk === k2 ? 'on' : ''}" data-act="lo_perk" data-v="${k2}" ${locked ? 'disabled' : ''}><b>${L(pk)}</b><span class="d">${L(pk.d)}</span>${locked ? lock(pk.lvl) : ''}</button>`; }).join('');
      custom = `<h3>${T('custom_kit')} · ${T('primary')}</h3><div class="cards">${weaps}</div>
        <h3>${T('secondary')}</h3><div class="cards">${secs}</div>
        <h3>${T('gunsmith')} · ${escapeHtml(L(PW.name))} <span class="pickct ${used >= CONFIG.ATTACH.pick ? 'full' : ''}">${used}/${CONFIG.ATTACH.pick} ${T('attachments').toLowerCase()}</span></h3>
        <div class="gsmith"><div>${this.cmpBars(P, lo.att, lo.perk)}<p class="note" style="margin-top:8px">${T('cmp_legend')}</p>
          <p class="note mastery">${stars(P) || '☆☆☆'} ${T('mastery')}: ${k} ${T('kills_w')}${nx ? ` · ${T('next_tier', { n: nx - k })}` : ` · ${T('max_tier')}`}</p></div>
          <div class="attgrid">${rows}</div></div>
        <h3>${T('finish')}</h3><div class="skinrow">${skinsHtml}</div>
        <h3>${T('perk')}</h3><div class="cards">${perks}</div>`;
    }
    return `<h3 style="margin-top:0">${T('cls')}</h3><p class="note">${T('cls_lead')}</p><div class="cards clsgrid" style="margin-top:10px">${cards}</div>${custom}`;
  },
  htmlLook() {
    const s = G.settings, c = s.custom, lvl = Progress.level(), lock = (n) => `<small class="lock">🔒 ${T('locked_lvl', { n })}</small>`;
    const camo = Object.keys(CAMOS).map((k) => { const ok = Progress.has('camo', k, lvl);
      return `<button class="swatch camo ${c.camo === k ? 'on' : ''}" style="background:linear-gradient(135deg,${CAMOS[k].base} 0 40%,${CAMOS[k].c[0]} 40% 60%,${CAMOS[k].c[1]} 60% 80%,${CAMOS[k].c[2]} 80%);${ok ? '' : 'opacity:.35'}" ${ok ? '' : 'disabled'} data-act="custom" data-k="camo" data-v="${k}" title="${escapeHtml(L(CAMOS[k]))}${ok ? '' : ' · ' + (k === 'prestige' ? T('camo_prestige') : T('locked_lvl', { n: CONFIG.UNLOCK.camo[k] }))}"></button>`; }).join('');
    const skin = SKINS.map((k, i) => `<button class="swatch ${c.skin === i ? 'on' : ''}" style="background:${hex(k)}" data-act="custom" data-k="skin" data-v="${i}" aria-label="tono ${i + 1}"></button>`).join('');
    const pk = (kind, cat) => { const cur = cat[c[kind]] || cat[Object.keys(cat)[0]];
      return `<div class="field"><span class="lbl">${T(kind)} <small class="pkn">${Object.keys(cat).filter((k) => Progress.has(kind, k, lvl)).length}/${Object.keys(cat).length}</small></span><div class="picker"><button class="arrow" data-act="pick" data-k="${kind}" data-d="-1" aria-label="anterior">‹</button><span class="pv">${escapeHtml(L(cur))}</span><button class="arrow" data-act="pick" data-k="${kind}" data-d="1" aria-label="siguiente">›</button></div></div>`; };
    const ops = Object.keys(OPERATORS).map((k) => { const O = OPERATORS[k], ok = Progress.has('operator', k, lvl);
      return `<button class="card op ${c.op === k ? 'on' : ''}" data-act="op" data-v="${k}" ${ok ? '' : 'disabled'}><i class="opstrip" style="background:linear-gradient(90deg,${CAMOS[O.set.camo].base} 0 25%,${CAMOS[O.set.camo].c[0]} 25% 50%,${CAMOS[O.set.camo].c[1]} 50% 75%,${CAMOS[O.set.camo].c[2]} 75%)"></i><b>${escapeHtml(L(O))}</b><span class="d">${escapeHtml(L(O.d))}</span>${ok ? '' : lock(CONFIG.UNLOCK.operator[k])}</button>`; }).join('');
    return `<h3 style="margin-top:0">${T('operators')}</h3><p class="note">${T('op_lead')}</p><div class="cards" style="margin-top:10px">${ops}</div>
      <div class="actions" style="margin-top:8px"><button class="btn small" data-act="op" data-v="">${T('op_free')}</button></div>
      <h3>${T('cosmetics')}</h3><div style="display:grid;gap:16px">
        <div class="field"><span class="lbl">${T('camo')} · ${escapeHtml(L(CAMOS[c.camo]))}</span><div class="swatches">${camo}</div></div>
        ${pk('helmet', HELMETS)}${pk('face', FACES)}${pk('vest', VESTS)}${pk('pack', PACKS)}${pk('pads', PADS)}
        <div class="field"><span class="lbl">${T('skin')}</span><div class="swatches">${skin}</div></div></div>`;
  },
  htmlStreaks() {
    const s = G.settings, lvl = Progress.level(), chosen = pickStreaks(s.streaks, lvl);
    const cards = CONFIG.STREAK_ORDER.map((id) => { const S = CONFIG.STREAKS[id], ok = Progress.has('streak', id, lvl), on = chosen.includes(id);
      return `<button class="card ${on ? 'on' : ''}" data-act="streak_toggle" data-v="${id}" ${ok ? '' : 'disabled'}><b>${escapeHtml(L(S))}</b><span class="cls" style="color:var(--accent);font:600 12px var(--f-cond);letter-spacing:.16em;text-transform:uppercase">${S.kills} ${T('kills_w')}</span><span class="d">${escapeHtml(L(S.d))}</span>${ok ? '' : `<small class="lock">🔒 ${T('locked_lvl', { n: CONFIG.UNLOCK.streak[id] })}</small>`}</button>`; }).join('');
    return `<h3 style="margin-top:0">${T('tab_streaks')} <span class="pickct">${chosen.length}/3</span></h3><p class="note">${T('streak_lead')}</p><div class="cards" style="margin-top:10px">${cards}</div>`;
  },
  // bloque de reinicio con doble confirmación (se usa en Progreso y en Récords)
  htmlReset() {
    const body = this._rsAsk
      ? `<div class="rsask"><b>${T('rs_warn_t')}</b><span>${T('rs_warn')}</span><div class="actions"><button class="btn small danger" data-act="reset_go">${T('rs_go')}</button><button class="btn small" data-act="reset_cancel">${T('pr_cancel')}</button></div></div>`
      : `<button class="btn small danger" data-act="reset_ask">${T('rs_btn')}</button>`;
    return `<h3>${T('rs_title')}</h3><p class="note">${T('rs_lead')}</p>${body}`;
  },
  htmlProg() {
    const pi = Progress.info(), lvl = Progress.level();
    const rows = []; for (let l = 2; l <= CONFIG.PROG.max; l++) { const un = Progress.unlocksAt(l); if (!un.length) continue;
      rows.push(`<div class="lvrow ${l <= lvl ? 'got' : l === pi.level + 1 ? 'next' : ''}"><b>${l}</b><span>${un.map((u) => `<em>${escapeHtml(Object.fromEntries(UNLOCK_KINDS.map(([k, n]) => [k, L(n)]))[u.kind] || '')} · ${escapeHtml(u.name)}</em>`).join('')}</span></div>`); }
    let _wc = '';
    const wl = CONFIG.PRIMARIES.map((w) => { const wi = Progress.winfo(w), pct = wi.need ? Math.round(100 * wi.into / wi.need) : 100, ch = Progress.chDone(w), c = CONFIG.WEAPONS[w].wc, head = c !== _wc ? `<p class="lo-sub">${escapeHtml(L(CONFIG.WCLASSES[c]))}</p>` : ''; _wc = c;
      return `${head}<span class="mrow wl"><b>${escapeHtml(L(CONFIG.WEAPONS[w].name))}</b><span class="wxbar"><i style="width:${pct}%"></i></span><small>${T('lv_short')} ${wi.level} · ${ch}/${WCH.length}</small></span>`; }).join('');
    const mast = CONFIG.SECONDARIES.map((w) => { const k = Progress.kills(w), m = Progress.mastery(w); return `<span class="mrow"><b>${escapeHtml(L(CONFIG.WEAPONS[w].name))}</b><span class="stars">${'★'.repeat(m)}${'☆'.repeat(3 - m)}</span><small>${k}</small></span>`; }).join('');
    const pr = Progress.prestige(), max = CONFIG.PROG.prestigeMax;
    let act = '';
    if (pr >= max) act = `<small>${T('pr_max')}</small>`;
    else if (Progress.canPrestige()) act = this._prAsk ? `<div class="prask"><span>${T('pr_confirm')}</span><button class="btn small primary" data-act="prestige_go">${T('pr_go')}</button><button class="btn small" data-act="prestige_cancel">${T('pr_cancel')}</button></div>` : `<button class="btn small primary" data-act="prestige_ask">${T('pr_btn')}</button>`;
    else act = `<small>${T('pr_need')}</small>`;
    const prHtml = `<div class="prpanel">${rankBadge(50, 34, pr)}<div><b>${T('prestige')}${pr ? ' ' + pr : ''}</b><small>${T('pr_lead', { n: Math.round(CONFIG.PROG.prestigeBonus * 100) })}</small></div><div class="pract">${act}</div></div>`;
    return `<h3 style="margin-top:0">${T('progress')}</h3>${this.htmlProfile()}<p class="note">${T('prog_lead')}</p>${prHtml}
      <h3>${T('weapon_levels')}</h3><div class="mgrid wide">${wl}</div>
      <h3>${T('sec_mastery')}</h3><div class="mgrid">${mast}</div>
      <h3>${T('backup')}</h3><p class="note">${T('backup_lead')}</p>
      <textarea id="bkCode" class="bkcode" rows="3" spellcheck="false" placeholder="CW2.…">${escapeHtml(this._bk || '')}</textarea>
      <div class="actions" style="margin-top:8px"><button class="btn small" data-act="bk_export">${T('bk_export')}</button><button class="btn small" data-act="bk_copy">${T('bk_copy')}</button><button class="btn small" data-act="bk_import">${T('bk_import')}</button></div>
      <h3>${T('unlock_table')}</h3><div class="lvtable">${rows.join('')}</div>${this.htmlReset()}`;
  },
  htmlSettings() {
    const s = G.settings, tab = this.settingsTab;
    const seg = (k, opts) => `<div class="seg">${opts.map(([v, t]) => `<button data-act="setting" data-k="${k}" data-v="${v}" class="${String(s[k]) === String(v) ? 'on' : ''}">${t}</button>`).join('')}</div>`;
    const rng = (k, min, max, step, fmt) => `<div class="setrow"><label class="lbl" for="r_${k}">${T(k)} <span class="val" id="v_${k}">${fmt(s[k])}</span></label><input type="range" id="r_${k}" data-k="${k}" min="${min}" max="${max}" step="${step}" value="${s[k]}"></div>`;
    let body = '';
    if (tab === 'general') {
      body = `<div class="setgrid">
        <div class="setrow"><span class="lbl">${T('language')}</span>${seg('lang', [['es', 'Español'], ['en', 'English']])}</div>
        <div class="setrow"><span class="lbl">${T('quality')}</span>${seg('quality', [['low', T('low')], ['medium', T('medium')], ['high', T('high')]])}</div>
        <div class="setrow"><span class="lbl">${T('gore')}</span>${seg('gore', [['off', L(CONFIG.GORE.off.label)], ['low', L(CONFIG.GORE.low.label)], ['high', L(CONFIG.GORE.high.label)]])}</div>
        <div class="setrow"><span class="lbl">${T('camera')}</span>${seg('cam', [['third', T('third')], ['first', T('first')]])}</div>
        <div class="setrow"><span class="lbl">${T('shoulder')}</span>${seg('shoulder', [[1, T('right')], [-1, T('left')]])}</div>
        <div class="setrow"><span class="lbl">${T('charStyle')}</span>${seg('charStyle', [['box', T('styleBox')], ['smooth', T('styleSmooth')]])}</div>
        ${rng('bright', 0.7, 1.8, 0.02, (v) => Math.round(v * 100) + '%')}
        ${rng('fov', 65, 105, 1, (v) => v + '°')}
        ${rng('sens', 0.2, 3, 0.05, (v) => (+v).toFixed(2))}
        ${rng('adsSens', 0.3, 1.5, 0.05, (v) => (+v).toFixed(2))}
        <div class="setrow"><label class="chk"><input type="checkbox" data-k="invertY" ${s.invertY ? 'checked' : ''}> ${T('invertY')}</label>
        <label class="chk"><input type="checkbox" data-k="showFps" ${s.showFps ? 'checked' : ''}> ${T('showFps')}</label></div>
      </div>`;
    } else if (tab === 'hud') {
      const pct0 = (v) => Math.round(v * 100) + '%';
      const chk = (k) => `<label class="chk"><input type="checkbox" data-k="${k}" ${s[k] !== false ? 'checked' : ''}> ${T(k)}</label>`;
      body = `<div class="setgrid">${rng('hudScale', 0.7, 1.4, 0.05, pct0)}${rng('hudAlpha', 0.4, 1, 0.05, pct0)}<div class="setrow">${chk('showCompass')}${chk('dmgNums')}${chk('showRadar')}${chk('showHitmarker')}</div></div>`;
    } else if (tab === 'sound') {
      const pct = (v) => Math.round(v * 100) + '%';
      body = `<div class="setgrid">${rng('master', 0, 1, 0.01, pct)}${rng('music', 0, 1, 0.01, pct)}${rng('sfx', 0, 1, 0.01, pct)}<div class="setrow"><label class="chk"><input type="checkbox" data-k="hitSound" ${s.hitSound !== false ? 'checked' : ''}> ${T('hitSound')}</label></div></div>`;
    } else {
      body = `<p class="note">${T('rebind')}</p><div class="binds" style="margin-top:10px">${BIND_ACTIONS.map((a) => `<div class="bind"><span>${T('act_' + a)}</span><button data-act="rebind" data-k="${a}">${Input.bindings[a].map((c) => Input.keyName(c)).join(' / ')}</button></div>`).join('')}</div>
        <div class="actions"><button class="btn small" data-act="resetBinds">${T('reset_binds')}</button></div>`;
    }
    const tabs = [['general', T('general')], ['hud', T('hud')], ['sound', T('sound')], ['controls', T('controls')]];
    return `<div class="screen sub"><div class="panel">
      <div class="subhead"><h2>${T('settings')}</h2><button class="btn small" data-act="${this.inGame() ? 'backPause' : 'go'}" data-s="main">${T('back')}</button></div>
      <div class="seg tabs" style="margin:14px 0 18px">${tabs.map(([v, t]) => `<button data-act="tab" data-v="${v}" class="${tab === v ? 'on' : ''}">${t}</button>`).join('')}</div>
      ${body}</div></div>`;
  },
  htmlRecord() {
    const r = Store.get('records', {}), md = r.medals || {};
    const rec = (v, l) => `<div class="rec"><b>${v}</b>${l}</div>`;
    const kd = r.deaths ? (r.kills / r.deaths).toFixed(2) : (r.kills || 0).toFixed(2);
    const medals = Object.keys(MEDALS).map((k) => `<div class="medal ${md[k] ? 'got' : ''}" title="${escapeHtml(L(MEDALS[k].d) || '')}">${medalSvg(k, 40)}<div><b>${L(MEDALS[k])}</b><span>× ${md[k] || 0} · +${MEDALS[k].pts}</span><small>${escapeHtml(L(MEDALS[k].d) || '')}</small></div></div>`).join('');
    return `<div class="screen sub"><div class="panel">
      <div class="subhead"><h2>${T('record')}</h2><button class="btn small" data-act="go" data-s="main">${T('back')}</button></div>
      <div class="records">${rec(r.matches || 0, T('rec_matches'))}${rec(r.wins || 0, T('rec_wins'))}${rec(r.kills || 0, T('rec_kills'))}${rec(kd, T('rec_kd'))}${rec(r.headshots || 0, T('rec_hs'))}${rec(r.bestStreak || 0, T('rec_streak'))}${rec((r.longest || 0) + ' m', T('rec_long'))}${rec(r.captures || 0, T('rec_caps'))}</div>
      <h3>${T('medals')}</h3><div class="medalgrid">${medals}</div>${this.htmlReset()}</div></div>`;
  },
  htmlHelp() {
    const b = (a) => Input.bindings[a].map((c) => `<kbd>${Input.keyName(c)}</kbd>`).join(' ');
    const rows = [[T('k_move'), b('forward') + b('left') + b('back') + b('right')], [T('k_look'), `<kbd>${T('mouse')}</kbd>`], [T('k_fire'), `<kbd>${T('mouse_l')}</kbd>`], [T('k_aim'), `<kbd>${T('mouse_r')}</kbd>`],
      [T('act_sprint'), b('sprint')], [T('act_jump'), b('jump')], [T('act_crouch'), b('crouch')], [T('act_reload'), b('reload')], [T('k_weap'), `<kbd>${T('wheel')}</kbd>`],
      [T('act_prone'), b('prone')], [T('k_lean'), b('shoulder') + b('interact')],
      [T('act_grenade'), b('grenade')], [T('act_tactical'), b('tactical')], [T('act_streak'), b('streak')], [T('act_melee'), b('melee')], [T('act_interact'), b('interact')], [T('act_shoulder'), b('shoulder')], [T('act_camera'), b('camera')],
      [T('act_scoreboard'), b('scoreboard')], [T('k_pause'), '<kbd>Esc</kbd>']];
    return `<div class="screen sub"><div class="panel">
      <div class="subhead"><h2>${T('help_title')}</h2><button class="btn small" data-act="${this.inGame() ? 'backPause' : 'go'}" data-s="main">${T('back')}</button></div>
      <div class="helpgrid">${rows.map(([a, k]) => `<div class="keyrow"><span>${a}</span><span>${k}</span></div>`).join('')}</div>
      <p class="note" style="margin-top:10px">${T('gamepad_note')}</p>
      <ul class="tips">${[1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<li>${T('tip' + i)}</li>`).join('')}</ul></div></div>`;
  },
  inGame() { return !!(G.match && !G.attract); },

  onClick(e) {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act, s = G.settings;
    AUDIO.resume(); AUDIO.play('ui', null, 0.5);
    if (act === 'lo_primary' || act === 'lo_secondary' || act === 'lo_perk') this.pickList = null;
    switch (act) {
      case 'go': this.pickList = null; this.show(b.dataset.s); break;
      case 'lang': this.setLang(b.dataset.v); break;
      case 'set': { let v = b.dataset.v; if (/^-?\d+$/.test(v)) v = +v; s[b.dataset.k] = v; if (b.dataset.k === 'cls') this.loadoutChanged(); else { saveSettings(); this.render(); } break; }
      case 'custom': { let v = b.dataset.v; if (/^\d+$/.test(v)) v = +v; s.custom[b.dataset.k] = v; saveSettings(); this.render(); break; }
      case 'startGame': this.startOffline(); break;
      case 'story': saveSettings(); this.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' }); break;
      case 'camp_read': Camp.setRead(+b.dataset.v); this.render(); break;
      case 'camp_diff': Camp.setDiff(b.dataset.v); this.render(); break;
      case 'camp_play': if (b.getAttribute('aria-disabled') === 'true') { const m = CAMP_BY_ID[b.dataset.v]; if (m) this.toast(T('camp_wip', { v: m.phase }), 2200); break; } Campaign.start(b.dataset.v); break;
      case 'range': this.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); Rules.rangeReset(); break;
      case 'cls': setClass(b.dataset.v); this.loadoutChanged(); break;
      case 'lo_primary': { const lo = s.loadout || (s.loadout = {}); lo.primary = b.dataset.v; lo.att = defaultAtt(lo.primary); s.primary = lo.primary; this.loadoutChanged(); break; }
      case 'lo_secondary': s.loadout.secondary = b.dataset.v; this.loadoutChanged(); break;
      case 'lo_att': {
        const lo = s.loadout, P = lo.primary, cur = sanitizeAtt(P, lo.att), k = b.dataset.k, v = b.dataset.v, fac = CONFIG.ATTACH.slots[P][k][0];
        if (v !== fac && cur[k] === fac && attCount(P, cur) >= CONFIG.ATTACH.pick) { this.toast(T('att_full', { n: CONFIG.ATTACH.pick }), 1800); break; }
        lo.att = { ...cur, [k]: v }; this.loadoutChanged(); break;
      }
      case 'lo_skin': { const P = s.loadout.primary; s.wskins = { ...(s.wskins || {}), [P]: b.dataset.v }; this.loadoutChanged(); break; }
      case 'stab': this.soldierTab = b.dataset.v; this.render(); break;
      case 'op': {
        const id = b.dataset.v, O = OPERATORS[id];
        if (!id) s.custom.op = null; else if (O && Progress.has('operator', id)) { Object.assign(s.custom, O.set, { op: id }); }
        saveSettings(); NET._lo = null; this.render(); break;
      }
      case 'streak_toggle': {
        const lvl = Progress.level(), cur = pickStreaks(s.streaks, lvl), id = b.dataset.v;
        let next = cur.includes(id) ? cur.filter((x) => x !== id) : cur.concat(id);
        if (!next.length) { this.toast(T('streak_min'), 1500); break; }
        if (next.length > 3) { this.toast(T('streak_max'), 1500); break; }
        s.streaks = next; this.loadoutChanged(); break;
      }
      case 'bk_export': this._bk = Progress.exportCode(); this.render(); break;
      case 'bk_copy': { const code = Progress.exportCode(); this._bk = code; this.render(); try { navigator.clipboard.writeText(code).then(() => this.toast(T('bk_copied'), 1600), () => { }); } catch (e) { /* sin portapapeles */ } break; }
      case 'bk_import': {
        const ta = this.$('bkCode'), r = Progress.importCode(ta ? ta.value : '');
        if (r.ok) { this._bk = ''; sanitizeCustomFor(G.settings, Progress.level()); saveSettings(); NET._lo = null; this.toast(T('bk_ok', { n: r.level }), 2400); this.render(); }
        else this.toast(T(r.err === 'sum' ? 'bk_sum' : 'bk_bad'), 2400);
        break;
      }
      case 'lo_perk': s.loadout.perk = b.dataset.v; this.loadoutChanged(); break;
      case 'pvmode': this.pvMode = b.dataset.v; this.render(); break;
      case 'lo_open': this.pickList = b.dataset.v && this.pickList !== b.dataset.v ? b.dataset.v : null; this.wclass = null; this.render(); break;
      case 'wclass': this.wclass = b.dataset.v; this.render(); break;
      case 'gs_slot': this.gsSlot = b.dataset.v; this.gsTab = 'att'; this.render(); break;
      case 'gs_tab': this.gsTab = b.dataset.v; this.render(); break;
      case 'reset_ask': this._rsAsk = true; this.render(); break;
      case 'reset_cancel': this._rsAsk = false; this.render(); break;
      case 'reset_go': this._rsAsk = false; this._bk = ''; this._prAsk = false; Progress.resetAll(); sanitizeCustomFor(G.settings, Progress.level()); this.toast(T('rs_done'), 2600); this.render(); break;
      case 'prestige_ask': this._prAsk = true; this.render(); break;
      case 'prestige_cancel': this._prAsk = false; this.render(); break;
      case 'prestige_go': this._prAsk = false; if (Progress.doPrestige()) { const n = Progress.prestige(); AUDIO.play('levelup', null, 0.8); this.toast(T('pr_done', { n, x: Math.round(CONFIG.PROG.prestigeBonus * 100 * n) }), 3200); NET._lo = null; } this.render(); break;
      case 'pauseClass': this.el.overlay.hidden = true; this.show('soldier'); break;
      case 'pick': this.pickItem(b.dataset.k, +b.dataset.d); break;
      case 'tab': this.settingsTab = b.dataset.v; this.render(); break;
      case 'setting': this.applySetting(b.dataset.k, b.dataset.v); this.render(); break;
      case 'rebind': { b.textContent = '…'; b.classList.add('wait'); Input.remapAction = b.dataset.k; Input.remapCb = () => { Input.saveBindings(); this.render(); }; break; }
      case 'resetBinds': Input.loadBindings(null); Input.saveBindings(); this.render(); break;
      case 'gore': s.gore = b.dataset.v; s.goreChosen = true; saveSettings(); this.closeOverlay(); this.show('main'); break;
      case 'resume': this.resume(); break;
      case 'pauseSettings': this.el.overlay.hidden = true; this.settingsTab = 'general'; this.show('settings'); break;
      case 'pauseHelp': this.el.overlay.hidden = true; this.show('help'); break;
      case 'backPause': this.hideMenu(); this.pause(true); break;
      case 'quit': this.quitToMenu(); break;
      case 'rematch': this.closeOverlay(); if (NET.active) OnlineUI.rematch(); else this.launch(G.matchCfg); break;
      case 'changeMatch': this.closeOverlay(); if (NET.active) OnlineUI.backToLobby(); else { this.quitToMenu(); this.show('play'); } break;
      default: if (act.startsWith('net_')) OnlineUI.onAct(act, b); break;
    }
  },
  onInput(e) {
    const t = e.target, k = t.dataset.k, s = G.settings;
    if (t.id === 'clsNameIn') { const sl = s.slots[s.slot | 0]; sl.name = t.value.replace(/[<>]/g, '').slice(0, 14); saveSettings(); const b = document.querySelector('.lo-cls.on b'); if (b) b.textContent = className('custom'); return; }
    if (t.id === 'nameIn') { s.name = t.value.replace(/[<>]/g, '').slice(0, 14) || 'Soldado'; saveSettings(); return; }
    if (t.type === 'checkbox' && k) { this.applySetting(k, t.checked); return; }
    if (t.type === 'range' && k) { this.applySetting(k, +t.value); const v = this.$('v_' + k); if (v) v.textContent = k === 'fov' ? t.value + '°' : (k === 'sens' || k === 'adsSens') ? (+t.value).toFixed(2) : Math.round(t.value * 100) + '%'; }
    if (t.dataset.net) OnlineUI.onInput(t);
  },
  loadoutChanged() { this._pvKeep = true; saveSettings(); NET._lo = null; if (NET.t && !NET.active) NET.setLobbyPresence(); this.render(); },
  applySetting(k, v) {
    const s = G.settings;
    if (k === 'lang') LANG = v;
    if (k === 'invertY' || k === 'showFps' || k === 'showCompass' || k === 'dmgNums' || k === 'showRadar' || k === 'showHitmarker' || k === 'hitSound') v = v === true || v === 'true';
    if (k === 'shoulder') v = +v;
    s[k] = v; saveSettings();
    if (k === 'quality') Renderer.applyQuality();
    if (k === 'cam') CAM.mode = v;
    if (k === 'shoulder') { CAM.shoulder = v; CAM.shoulderT = v; }
    if (k === 'sens') Input.sens = +v;
    if (k === 'adsSens') Input.adsSens = +v;
    if (k === 'bright' && G.renderer) G.renderer.toneMappingExposure = (G.baseExposure || 1.05) * +v;
    if (k === 'invertY') Input.invertY = v;
    if (k === 'master' || k === 'music' || k === 'sfx') AUDIO.setVolumes();
    if (k === 'showFps') this.el.fps.hidden = !v;
    if (k === 'hudScale' || k === 'hudAlpha' || k === 'showCompass' || k === 'showRadar') this.applyHudPrefs();
  },
  applyHudPrefs() {
    const s = G.settings, root = document.documentElement;
    root.style.setProperty('--ha', String(clamp(+s.hudAlpha || 1, 0.3, 1)));
    this._hs = null;
    if (this.el.radar) this.el.radar.style.display = s.showRadar === false ? 'none' : '';
    if (this.el.compass) this.el.compass.hidden = s.showCompass === false;
    this.layoutHud();
  },
  pickItem(kind, d) {
    const cat = { helmet: HELMETS, face: FACES, vest: VESTS, pack: PACKS, pads: PADS }[kind]; if (!cat) return;
    const lvl = Progress.level(), keys = Object.keys(cat).filter((k) => Progress.has(kind, k, lvl)); if (!keys.length) return;
    let i = keys.indexOf(G.settings.custom[kind]); if (i < 0) i = 0;
    i = (i + d + keys.length) % keys.length;
    G.settings.custom[kind] = keys[i]; saveSettings(); NET._lo = null; this.render();
  },

  // ------------------- vista previa del soldado -------------------
  startPreview() {
    const cv = this.$('preview'); if (!cv) return;
    try {
      if (this.pv) this.stopPreview();
      // un único renderer para todas las vistas previas: crear uno por cada clic agotaba los contextos WebGL
      // del navegador (~16) y arrastraba también al contexto del juego → pantalla negra
      const r = this.pvRenderer();
      const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xe6e0d0, 0x3a3830, 1.6)); const d = new THREE.DirectionalLight(0xfff0dc, 2.4); d.position.set(2, 4, 3); sc.add(d);
      const rim = new THREE.DirectionalLight(0x9ab0c8, 1.2); rim.position.set(-3, 2, -3); sc.add(rim);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), new THREE.MeshLambertMaterial({ color: 0x2a2c26 })); floor.rotation.x = -Math.PI / 2; sc.add(floor);
      const pw = cv.clientWidth || 320, ph = cv.clientHeight || 426;
      const cam = new THREE.PerspectiveCamera(28, pw / ph, 0.1, 50); cam.position.set(0, 1.25, 5.6); cam.lookAt(0, 1.0, 0);
      r.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1)); r.setSize(pw, ph, false);
      cv.width = r.domElement.width; cv.height = r.domElement.height;
      this.pv = { r, g2: cv.getContext('2d'), sc, cam, cv, rot: this._pvRot ?? 0.6, acc: 0, floor, user: this._pvUser || 0, drag: false, w: pw, h: ph, mode: this.screen === 'gunsmith' ? 'weapon' : 'soldier', gun: null, gunKey: '' };
      // arrastrar con el ratón o el dedo para girar
      cv.addEventListener('pointerdown', (e) => { const pv = this.pv; if (!pv) return; pv.drag = true; pv.lastX = e.clientX; try { cv.setPointerCapture(e.pointerId); } catch (err) { } cv.style.cursor = 'grabbing'; });
      cv.addEventListener('pointermove', (e) => { const pv = this.pv; if (!pv || !pv.drag) return; pv.user += (e.clientX - pv.lastX) * 0.012; pv.rot += (e.clientX - pv.lastX) * 0.012; pv.lastX = e.clientX; });
      const up = () => { if (this.pv) this.pv.drag = false; cv.style.cursor = 'grab'; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      this.buildPreviewSoldier();
      this.pvOn = true;
    } catch (e) { reportError(e); }
  },
  pvRenderer() {
    if (!this._pvR) {
      const r = this._pvR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
      r.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
    }
    return this._pvR;
  },
  pvDraw(pv) {
    const r = pv.r; if (r.getContext().isContextLost()) return;
    r.render(pv.sc, pv.cam);
    pv.g2.clearRect(0, 0, pv.cv.width, pv.cv.height); pv.g2.drawImage(r.domElement, 0, 0, pv.cv.width, pv.cv.height);
  },
  buildPreviewSoldier() {
    const pv = this.pv; if (!pv) return;
    if (pv.f) { pv.f.view.dispose(); pv.f = null; }
    const s = G.settings;
    const f = new Fighter({ slot: 7, kind: 'bot', name: s.name, custom: { ...s.custom }, loadout: localLoadout(), team: -1 });
    f.alive = true; f.grounded = true; f.hidden = false;
    f.view = new SoldierView(f, pv.sc); f.view.reset(); f.view.setWeapon(f.weapon);
    pv.f = f; f.view.noCull = true; this.pvKey = this.previewKey();
    if (pv.mode === 'weapon') f.view.root.visible = false;
  },
  // vista grande del arma principal con sus accesorios (gira sola y se puede arrastrar)
  buildPreviewGun() {
    const pv = this.pv; if (!pv || !pv.f) return;
    if (pv.gun) { pv.sc.remove(pv.gun); pv.gun = null; }
    const f = pv.f, id = f.primary, att = f.attFor(id);
    const m = buildWeaponModel(id, false, att);
    const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const cam = pv.cam, vh = 2 * 4.6 * Math.tan(cam.fov * Math.PI / 360), vw = vh * cam.aspect;
    const k = Math.min(vw * 0.84 / Math.max(0.3, sz.z), vh * 0.6 / Math.max(0.12, sz.y));
    m.position.set(-c.x, -c.y, -c.z);
    const g = new THREE.Group(); g.add(m); g.scale.setScalar(k); g.position.y = 1.0;
    pv.sc.add(g); pv.gun = g; pv.gunKey = id + ':' + attKey(att) + ':' + pv.mode;
  },
  previewKey() { const s = G.settings; return JSON.stringify(s.custom) + s.cls + JSON.stringify(s.loadout) + JSON.stringify(s.wskins || {}) + s.charStyle; },
  stopPreview() {
    this.pvOn = false; const pv = this.pv; if (!pv) return;
    this._pvRot = pv.rot; this._pvUser = pv.user;
    if (pv.f) pv.f.view.dispose();
    if (pv.gun) pv.sc.remove(pv.gun);
    pv.floor.geometry.dispose(); pv.floor.material.dispose();
    this.pv = null;
  },
  updatePreview(dt) {
    if (!this.pvOn || !this.pv) return;
    const pv = this.pv;
    pv.acc += dt; if (pv.acc < 1 / 30) return; const step = pv.acc; pv.acc = 0;
    const cw = pv.cv.clientWidth, ch = pv.cv.clientHeight;
    if (cw && ch && (cw !== pv.w || ch !== pv.h)) {
      pv.w = cw; pv.h = ch; pv.r.setSize(cw, ch, false); pv.cv.width = pv.r.domElement.width; pv.cv.height = pv.r.domElement.height;
      pv.cam.aspect = cw / ch; pv.cam.updateProjectionMatrix(); pv.gunKey = '';
    }
    if (this.pvKey !== this.previewKey()) { this.buildPreviewSoldier(); pv.gunKey = ''; }
    const f = pv.f; if (!f) return;
    if (pv.mode === 'weapon') {
      pv.floor.visible = false; f.view.root.visible = false;
      const key = f.primary + ':' + attKey(f.attFor(f.primary)) + ':weapon';
      if (pv.gunKey !== key) this.buildPreviewGun();
      if (pv.gun) { pv.gun.rotation.y = Math.PI / 2 + 0.5 + pv.user + (pv.drag ? 0 : Math.sin(G.realTime * 0.6) * 0.35); pv.gun.rotation.x = 0.05; }
      pv.cam.position.set(0, 1.05, 4.6); pv.cam.lookAt(0, 1.0, 0);
      this.pvDraw(pv);
      return;
    }
    pv.floor.visible = true; pv.floor.scale.setScalar(0.62); if (pv.gun) { pv.sc.remove(pv.gun); pv.gun = null; pv.gunKey = ''; }
    { const t = Math.tan(pv.cam.fov * Math.PI / 360), d = Math.max(1.12 / t, 0.66 / (t * pv.cam.aspect)); pv.cam.position.set(0, 1.1, d); pv.cam.lookAt(0, 0.93, 0); }
    f.yaw = Math.PI + 0.62 + pv.user + (pv.drag ? 0 : Math.sin(G.realTime * 0.45) * 0.5); f.input.pitch = Math.sin(G.realTime * 0.7) * 0.15; f.adsT = 0;
    f.vel.set(0, 0, 0); f.pos.set(0, 0, 0); f.prevPos.set(0, 0, 0);
    f.view.update(step, 1);
    this.pvDraw(pv);
  },

  // ------------------- partida -------------------
  startOffline() {
    const s = G.settings;
    this.launch({ mode: s.lastMode, map: s.lastMap, env: ENV_INFO[s.lastEnv] ? s.lastEnv : 'random', bots: (MODES[s.lastMode].sizes && !MODES[s.lastMode].sizes.includes(s.lastTeam) ? MODES[s.lastMode].sizes[MODES[s.lastMode].sizes.length - 1] : (s.lastTeam || 8)) - 1, difficulty: s.lastDiff, fac: CONFIG.MATCHUPS[s.lastFac] ? s.lastFac : 'sv', team: 0 });
  },
  launch(cfg) {
    cfg = { ...cfg, seed: (Math.random() * 1e9) >>> 0, attract: false };
    this.hideMenu(); this.closeOverlay();
    G.paused = false;
    Rules.startMatch(cfg);
    this.enterGame();
    Music.stop();
  },
  enterGame() {
    this.el.hud.hidden = false; Input.enabled = true;
    CAM.mode = G.settings.cam; CAM.shoulder = CAM.shoulderT = G.settings.shoulder || 1; CAM.pivotInit = false; CAM.override = null;
    this.el.killfeed.innerHTML = ''; this.el.medals.innerHTML = ''; this.medalQ = [];
    this.el.death.hidden = true; this.el.killcam.hidden = true; this.el.hud.classList.remove('kc');
    this.layoutHud();
    Input.requestLock();
    this.renderScore(true);
  },
  quitToMenu() {
    if (NET.active || NET.t) OnlineUI.leave();
    const camp = !!(G.mode && G.mode.campaign && !G.attract);
    if (camp) Campaign.quit();
    this.closeOverlay(); G.paused = false; Input.releaseLock();
    this.startAttract();
    this.show(camp ? 'campaign' : 'main');
  },
  startAttract() {
    const map = MAP_ORDER[Math.floor(Math.random() * MAP_ORDER.length)];
    Rules.startMatch({ attract: true, mode: 'tdm', map, env: Math.random() < 0.4 ? 'auto' : randomEnv(), bots: 8, difficulty: 'normal', seed: (Math.random() * 1e9) >>> 0 });
    CAM.spectate = null; CAM.override = null;
    this.el.hud.hidden = true;
    Music.start(7, 'menu');
  },
  pause(silent) {
    if (!this.inGame()) return;
    if (!NET.active) G.paused = true;
    Input.releaseLock(); Input.enabled = false;
    this.el.overlay.className = ''; this.el.overlay.hidden = false; this.overlayKind = null;
    this.el.overlay.innerHTML = `<div class="panel ov small"><h2>${T('paused')}</h2>
      <div class="ovbtns"><button class="btn primary" data-act="resume">${T('resume')}</button>
      ${G.mode && G.mode.campaign ? '' : `<button class="btn" data-act="pauseClass">${T('pause_class')}</button>`}<button class="btn" data-act="pauseSettings">${T('settings')}</button><button class="btn" data-act="pauseHelp">${T('help')}</button>
      <button class="btn danger" data-act="quit">${G.mode && G.mode.campaign ? T('camp_quit') : T('quit')}</button></div></div>`;
    if (!silent) AUDIO.play('ui');
  },
  resume() { this.closeOverlay(); G.paused = false; Input.enabled = true; Input.requestLock(); if (G.mode && G.mode.range) Rules.rangeRefit(); },
  closeOverlay() { this.el.overlay.hidden = true; this.el.overlay.innerHTML = ''; this.overlayKind = null; },
  isPaused() { return !this.el.overlay.hidden && this.overlayKind == null && this.inGame(); },
  gorePrompt() {
    this.el.overlay.className = ''; this.el.overlay.hidden = false; this.overlayKind = 'gore';
    const sw = { off: 'linear-gradient(90deg,#6a665c,#8a8476)', low: 'radial-gradient(circle at 40% 50%,#6a0d0d 0 18%,transparent 19%),linear-gradient(#5a5a50,#45453c)', high: 'radial-gradient(circle at 30% 45%,#6a0d0d 0 26%,transparent 27%),radial-gradient(circle at 68% 62%,#560a0a 0 22%,transparent 23%),linear-gradient(#5a5a50,#45453c)' };
    this.el.overlay.innerHTML = `<div class="panel ov"><h2>${T('gore_title')}</h2><p class="lead">${T('gore_lead')}</p>
      <div class="gorecards">${['off', 'low', 'high'].map((g) => `<button class="card ${g === 'low' ? 'on' : ''}" data-act="gore" data-v="${g}"><i style="background:${sw[g]}"></i><b>${L(CONFIG.GORE[g].label)}</b><span>${T('gore_' + g + '_d')}</span></button>`).join('')}</div></div>`;
  },

  // ------------------- HUD -------------------
  updateHud(dt) {
    const f = G.local, m = G.match;
    if (this.el.hud.hidden || !m) return;
    this.hudT += dt;
    const fast = this.hudT >= 1 / 30;
    if (fast) this.hudT = 0;
    if (f) {
      // vida
      const hp = Math.max(0, Math.ceil(f.hp));
      if (fast) {
        if (hp !== this._hp) { this._hp = hp; this.el['hp-fill'].style.width = hp + '%'; this.el['hp-ghost'].style.width = hp + '%'; this.el['hp-num'].textContent = hp; this.el['hp-fill'].className = hp < 35 ? 'low' : hp < 65 ? 'mid' : ''; this.el['hp-num'].className = hp < 35 ? 'low' : ''; }
        setText(this.el['nade-chip'], '◆ ' + f.grenades); this.el['nade-chip'].classList.toggle('off', f.grenades <= 0);
        setText(this.el['smoke-chip'], '◍ ' + f.smokes); this.el['smoke-chip'].classList.toggle('off', f.smokes <= 0);
        setText(this.el['stance-chip'], f.prone ? '▁' : f.sliding ? '⟋' : f.crouching ? '▄' : f.sprinting ? '»' : f.lean < -0.3 ? '◣' : f.lean > 0.3 ? '◢' : '▮');
        this.renderStreak(f);
        const W = f.wstat(), inv = f.inv[f.weapon] || { mag: 0, reserve: 0 };
        this.renderWeapon(f, W, inv);
        const sh = CAM.mode === 'third' ? (CAM.shoulder > 0 ? T('shoulder_r') : T('shoulder_l')) : '';
        const keys = (sh ? `<kbd>${Input.keyName(Input.bindings.shoulder[0])}</kbd>${sh}` : '') + '|' + CAM.mode;
        if (keys !== this._keysHtml) {
          this._keysHtml = keys;
          this.el['shoulder-chip'].innerHTML = sh ? `<kbd>${Input.keyName(Input.bindings.shoulder[0])}</kbd>${sh}` : '';
          this.el['shoulder-chip'].hidden = !sh;
          this.el['cam-chip'].innerHTML = `<kbd>${Input.keyName(Input.bindings.camera[0])}</kbd>${CAM.mode === 'third' ? '3P' : '1P'}`;
        }
        this.ammoHint(f, W, inv);
        if ((this._layT = (this._layT || 0) + 1) % 30 === 0) this.layoutHud();
        // aviso para recoger armas
        const pr = WorldItems.prompt;
        let ph = '';
        if (f.targeting && f.alive) ph = `<span class="tgt">◎ ${escapeHtml(L(CONFIG.STREAKS[f.targeting.id]))}</span> ${T('target_hint', { k: Input.keyName(Input.bindings.streak[0]) })}`;
        else if (G.mode && G.mode.story && Inv.prompt && f.alive) ph = Inv.promptHtml();
        else if (pr && f.alive && !Replay.playing) { const Wn = L(CONFIG.WEAPONS[pr.weapon].name); ph = `<kbd>${Input.keyName(Input.bindings.interact[0])}</kbd> ${pr.weapon === f.primary ? T('ammo_pickup', { w: Wn }) : T('pickup', { w: Wn })}`; }
        if (ph !== this._promptHtml) { this._promptHtml = ph; this.el.prompt.innerHTML = ph; this.el.prompt.hidden = !ph; }
        // muerto o en la cámara de derribo: sin arma ni vida en pantalla
        const dead = !f.alive || Replay.playing;
        if (dead !== this._deadHud) { this._deadHud = dead; for (const k of ['weapon', 'status', 'dmgdir']) this.el[k].style.visibility = dead ? 'hidden' : ''; }
        this.renderScore(false);
        this.updateDeath(f, m);
      }
      // mira dinámica
      const W = f.wstat();
      const spread = W.kind === 'melee' ? 0.02 : Weapons.currentSpread(f, W);
      const gap = 4 + spread * innerHeight * 0.9 + (f.view ? f.view.recoilK * 4 : 0);
      const cs = this.el.crosshair.children;
      cs[0].style.transform = `translate(-50%, ${-gap - 10}px)`; cs[1].style.transform = `translate(-50%, ${gap}px)`;
      cs[2].style.transform = `translate(${-gap - 10}px, -50%)`; cs[3].style.transform = `translate(${gap}px, -50%)`;
      const scoped = (CAM.scoped && f.alive) || (Replay.playing && Replay.scoped);
      this.el.scope.hidden = !scoped;
      if (scoped && W.longRange && !Replay.playing) this.scopeInfo(f, W); else if (this._si) { this._si.remove(); this._si = null; }
      const ads = f.adsT > 0.6;
      const showCross = f.alive && !Replay.playing && f.state === 'stand' && !f.sprinting && !scoped && !(ads && CAM.isFP);
      this.el.crosshair.style.opacity = showCross ? (ads ? 0.45 : 1) : 0;
      this.el.crosshair.classList.toggle('ads', ads);
      // daño recibido: borde rojo y direcciones
      const hurt = clamp(1 - f.hp / 70, 0, 1);
      this.el['fx-hurt'].style.opacity = f.alive ? (hurt * 0.85 + (this._hitFlash || 0)) : 0;
      this._hitFlash = Math.max(0, (this._hitFlash || 0) - dt * 2.5);
      // heridas: silueta con las zonas dañadas y borrosidad si estás aturdido
      {
        const dz = f.alive ? clamp(f.dazeT / 0.9, 0, 1) : 0, wz = this._wz || (this._wz = { z: this.el.wounds.querySelectorAll('.z'), key: '' });
        const key = (f.alive && f.dazeT > 0 ? 'h' : '') + (f.alive && f.armT > 0 ? 'a' : '') + (f.alive && f.limpT > 0 ? 'l' : '');
        if (key !== wz.key) {
          wz.key = key;
          this.el.wounds.classList.toggle('on', !!key);
          wz.z[0].classList.toggle('hit', key.includes('h'));
          wz.z[2].classList.toggle('hit', key.includes('a')); wz.z[3].classList.toggle('hit', key.includes('a'));
          wz.z[4].classList.toggle('hit', key.includes('l')); wz.z[5].classList.toggle('hit', key.includes('l'));
        }
        const fd = this.el['fx-daze'];
        Post.dazeK = dz;
        // con Post el desenfoque lo hace el shader final; el velo de CSS (solo degradado, sin filtros) queda como respaldo
        if (dz > 0.01) { fd.style.display = 'block'; fd.style.setProperty('--d', (Post.on ? dz * 0.6 : dz).toFixed(2)); } else if (fd.style.display !== 'none') fd.style.display = 'none';
      }
      const camYaw = Math.atan2(G.camera.matrixWorld.elements[8], G.camera.matrixWorld.elements[10]);
      for (const a of this.dmgArcs) {
        if (a.t <= 0) { a.el.style.opacity = 0; continue; }
        a.t -= dt;
        const dx = a.src.x - f.pos.x, dz = a.src.z - f.pos.z, ang = Math.atan2(-dx, -dz) - camYaw;
        a.el.style.transform = `translate(-50%,-50%) rotate(${-ang}rad) translateY(-118px)`;
        a.el.style.opacity = clamp(a.t / 0.6, 0, 1);
      }
    }
    if (fast) { this.drawRadar(); this.drawCompass(); }
    // medallas en cola
    this.medalT -= dt;
    if (this.medalT <= 0 && this.medalQ.length) { const g = this.medalQ.shift(); this.showMedals(g); this.medalT = g.length > 1 ? 1.1 : 0.7; }
  },
  // ------------------- bloque del arma -------------------
  // Se dibuja a partir de un estado: solo toca el DOM cuando algo cambia. Muestra el arma que
  // realmente tienes en la mano (también al cambiar, al cocinar una granada o al acuchillar),
  // la munición como tiras (cargadores chicos: una por bala), la recarga y el cambio como
  // barra de progreso, y se atenúa cuando no pasa nada para no tapar la acción.
  renderWeapon(f, W, inv) {
    const st = this.ws, now = G.realTime;
    const cook = f.grenadeCook, knife = f.meleeT > 0 && f.weapon !== 'knife';
    let id = f.weapon, name, mode, mag, res, kind = 'ammo', prog = 0, max = W.mag;
    if (cook) {
      const left = Math.max(0, CONFIG.GRENADE.fuse - (G.time - cook.t0));
      id = 'frag'; name = T('w_frag'); mode = T('w_cooking'); mag = left.toFixed(1); res = 's'; kind = 'fuse'; prog = left / CONFIG.GRENADE.fuse;
    } else if (knife || W.kind === 'melee') {
      id = 'knife'; name = L(CONFIG.WEAPONS.knife.name).toUpperCase(); mode = T('w_melee'); mag = '—'; res = ''; kind = 'none';
    } else {
      name = L(W.name).toUpperCase();
      mode = W.burst ? T('mode_burst') : W.auto ? 'AUTO' : W.kind === 'projectile' ? T('mode_launch') : W.pellets > 1 ? T('mode_pump') : W.bolt || W.scope ? T('mode_bolt') : 'SEMI';
      mag = inv.mag; res = '/ ' + (Number.isFinite(inv.reserve) ? inv.reserve : '∞');
      if (f.switchT > 0) { kind = 'draw'; prog = 1 - f.switchT / Math.max(0.01, f.switchTotal || 0.45); }
      else if (f.reloadT > 0) { kind = 'reload'; prog = 1 - f.reloadT / Math.max(0.01, f.reloadTotal); }
    }
    const low = kind !== 'none' && kind !== 'fuse' && W.kind !== 'melee' && inv.mag <= Math.max(1, Math.ceil(W.mag * 0.25));
    const empty = low && inv.mag <= 0;
    // actividad reciente (para atenuar el bloque cuando no hace falta)
    if (f.lastShotT > G.time - 0.05 || kind !== 'ammo' || low) this.wsActT = now;
    const idle = now - this.wsActT > 3.5;
    const w = this.el.weapon;
    // ícono del arma (cambia con el arma y sus accesorios)
    const icoKey = cook ? '' : id + ':' + (f.attFor && id !== 'knife' ? attKey(f.attFor(id)) : '');
    if (st.ico !== icoKey) { st.ico = icoKey; const im = this.el['w-icon']; const url = icoKey ? weaponIconURL(id, f.attFor && id !== 'knife' ? f.attFor(id) : null) : ''; if (url) { im.src = url; im.hidden = false; } else im.hidden = true; }
    if (st.name !== name) { st.name = name; this.el['w-name'].textContent = name; }
    if (st.mode !== mode) { st.mode = mode; this.el['w-mode'].textContent = mode; }
    if (st.mag !== mag) { st.mag = mag; this.el['ammo-mag'].textContent = mag; }
    if (st.res !== res) { st.res = res; this.el['ammo-res'].textContent = res; }
    const cls = (low ? ' low' : '') + (empty ? ' empty' : '') + (idle ? ' idle' : '') + ' k-' + kind;
    if (st.cls !== cls) { st.cls = cls; w.classList.toggle('low', low); w.classList.toggle('empty', empty); w.classList.toggle('idle', idle); for (const k of ['ammo', 'draw', 'reload', 'fuse', 'none']) w.classList.toggle('k-' + k, k === kind); }
    // tira de munición o barra de progreso
    const strip = this.el['ammo-strip'];
    if (kind === 'ammo') {
      const pips = max <= 12, key = 'a' + max + ':' + (pips ? inv.mag : Math.round(inv.mag / max * 60));
      if (st.strip !== key) {
        st.strip = key;
        if (pips) strip.innerHTML = Array.from({ length: max }, (_, i) => `<i class="${i < max - inv.mag ? 'off' : ''}"></i>`).join('');
        else strip.innerHTML = `<b style="width:${Math.max(0, Math.min(100, 100 * inv.mag / max)).toFixed(1)}%"></b><s style="--n:${Math.max(1, Math.round(max / 5))}"></s>`;
        strip.className = pips ? 'pips' : 'bar';
      }
    } else if (kind === 'none') { if (st.strip !== 'n') { st.strip = 'n'; strip.innerHTML = ''; strip.className = 'none'; } }
    else {
      if (st.strip !== 'p' + kind) { st.strip = 'p' + kind; strip.innerHTML = '<b></b>'; strip.className = 'bar prog ' + kind; }
      strip.firstChild.style.width = (clamp(prog, 0, 1) * 100).toFixed(1) + '%';
    }
    // ranuras: 1 principal · 2 pistola · 3 cuchillo (con munición) + granadas en la mano
    const cur = cook ? 'g' : knife ? 'knife' : f.weapon;
    const sl = [[1, f.primary], [2, f.secondary !== f.primary ? f.secondary : null], [3, 'knife']].filter(([, wid]) => wid && f.inv[wid]).map(([n, wid]) => {
      const iv = f.inv[wid], WW = f.wstat(wid), dry = WW.kind !== 'melee' && iv.mag <= 0 && !(iv.reserve > 0);
      return `<b class="${cur === wid ? 'cur' : ''}${dry ? ' dry' : ''}"><kbd>${n}</kbd>${escapeHtml(weaponShort(wid))}${WW.kind !== 'melee' ? `<em>${iv.mag}</em>` : ''}</b>`;
    }).join('');
    if (sl !== this._sl) { this.el.slots.innerHTML = sl; this._sl = sl; }
    if (st.id !== id) { st.id = id; this.wsActT = now; }
  },
  // medallas: una baja puede ganar varias; se muestran juntas (la principal grande)
  showMedals(ids) {
    const box = this.el.medals; if (!box) return;
    const list = [...ids].sort((a, b) => MEDAL_RANK(b) - MEDAL_RANK(a)).slice(0, 5);
    const pts = ids.reduce((a, id) => a + (MEDALS[id] ? MEDALS[id].pts : 0), 0);
    box.innerHTML = '';
    const d = document.createElement('div'); d.className = 'mchain t' + (MEDALS[list[0]] ? MEDALS[list[0]].tier : 1);
    d.innerHTML = list.map((id, i) => `<div class="mc ${i ? 'sub' : 'main'}" style="--d:${i * 0.09}s">${medalSvg(id, i ? 34 : 58)}<b>${escapeHtml(L(MEDALS[id]))}</b></div>`).join('') + `<small>+${pts}</small>`;
    box.appendChild(d);
    clearTimeout(this._medT); this._medT = setTimeout(() => d.remove(), 2600);
    const top = MEDALS[list[0]] ? MEDALS[list[0]].tier : 1;
    AUDIO.play(top >= 3 ? 'medal3' : top === 2 ? 'medal2' : 'medal', null, 0.6);
  },
  // bajo la mira: recargar (munición baja), recargando (con barra) o sin munición
  ammoHint(f, W, inv) {
    const el = this.el.ahint; if (!el) return;
    let html = '', cls = '';
    if (f.alive && !Replay.playing && W.kind !== 'melee' && G.match && G.match.phase !== 'countdown' && !f.targeting) {
      if (f.reloadT > 0) { html = `<span>${T('hint_reloading')}</span><span class="rb"><i style="width:${Math.round(100 * (1 - f.reloadT / Math.max(0.01, f.reloadTotal)))}%"></i></span>`; cls = 'on'; }
      else if (inv.mag <= 0 && !(inv.reserve > 0)) { html = `<span>${T('hint_noammo')}</span>`; cls = 'on empty'; }
      else if (inv.mag <= Math.max(1, Math.ceil(W.mag * 0.25)) && inv.reserve > 0) { html = `<span><kbd>${Input.keyName(Input.bindings.reload[0])}</kbd>${T('hint_reload')}</span>`; cls = 'on low'; }
    }
    const key = cls + '|' + (f.reloadT > 0 ? 'r' : html);
    if (key !== this._ahKey) { if (html) el.innerHTML = html; el.className = 'hud-pad ' + cls; this._ahKey = key; }
    else if (f.reloadT > 0) { const i = el.querySelector('.rb i'); if (i) i.style.width = Math.round(100 * (1 - f.reloadT / Math.max(0.01, f.reloadTotal))) + '%'; }
  },
  updateDeath(f, m) {
    const dead = !f.alive && m.phase === 'fight';
    const d = this.el.death;
    if (!dead || Replay.playing) { if (!d.hidden) d.hidden = true; this.el.spectate.hidden = true; return; }
    // elegir clase para la próxima aparición (teclas 1–5)
    const clsbar = `<div class="clsbar"><span class="lbl">${T('class_next')}</span>${classKeys().map((k, i) => `<span class="${curClassKey() === k ? 'on' : ''}"><kbd>${i + 1}</kbd>${escapeHtml(className(k))}</span>`).join('')}</div>`;
    if (G.mode.respawn) {
      d.hidden = false;
      const k = this._killer;
      const html = `<div class="dk">${k ? `<span class="lbl">${k.self ? T('killed_self') : T('killed_by')}</span>${k.self ? '' : `<b>${escapeHtml(k.name)}</b>`}<span class="w">${escapeHtml(k.weapon)}${k.hs ? ' · ✕' : ''}${k.dist ? ' · ' + k.dist + ' m' : ''}</span>` : ''}</div>
        <div class="rs">${T('respawn_in', { s: Math.max(0, Math.ceil(f.respawnT)) })}</div>${clsbar}`;
      if (html !== this._deathHtml) { d.innerHTML = html; this._deathHtml = html; }
      this.el.spectate.hidden = true;
    } else {
      d.hidden = false;
      if (clsbar !== this._deathHtml) { d.innerHTML = clsbar; this._deathHtml = clsbar; }
      this.el.spectate.hidden = false;
      this.el.spectate.textContent = CAM.spectate ? T('spectating', { n: CAM.spectate.name }) : T('wait_round');
    }
  },
  // racha actual (bajas hacia la siguiente recompensa) y recompensas guardadas
  renderStreak(f) {
    const box = this.el['streak-box']; if (!box) return;
    const st = f.stats.streak, order = (f.loadout.streaks || CONFIG.STREAK_ORDER).filter((id) => Streaks.allowed(id)).sort((a, b) => streakKills(f, a) - streakKills(f, b));
    const kl = order.map((id) => streakKills(f, id));
    const nxi = kl.findIndex((k) => k > st), next = nxi >= 0 ? CONFIG.STREAKS[order[nxi]] : null;
    const key = Input.keyName(Input.bindings.streak[0]);
    let html = '';
    if (next) {
      const prev = [0, ...kl].filter((k) => k <= st).pop() || 0;
      const n = kl[nxi] - prev, got = st - prev;
      html += `<span class="sk"><span class="lbl">${T('streak')} ${st}</span><span class="pips">${Array.from({ length: n }, (_, i) => `<i class="${i < got ? 'on' : ''}"></i>`).join('')}</span><span class="nx">${escapeHtml(L(next))}</span></span>`;
    } else if (st > 0) html += `<span class="sk"><span class="lbl">${T('streak')} ${st}</span></span>`;
    if (f.rewards.length) html += f.rewards.map((id, i) => `<span class="kchip rw ${i === 0 ? 'next' : ''}">${i === 0 ? `<kbd>${key}</kbd>` : ''}${escapeHtml(L(CONFIG.STREAKS[id]).toUpperCase())}</span>`).join('');
    if (html !== this._skHtml) { box.innerHTML = html; this._skHtml = html; }
  },
  htmlProfile() {
    const pi = Progress.info(), lv = pi.level, pct = pi.need ? Math.round(100 * pi.into / pi.need) : 100;
    return `<div class="profile">${rankBadge(lv, 38, Progress.prestige())}<div class="pinfo"><b>${Progress.prestige() ? '★' + Progress.prestige() + ' ' : ''}${escapeHtml(Progress.rankName(lv))}</b><span>${T('level')} ${lv}${pi.need ? ` · ${pi.into} / ${pi.need} ${T('xp')}` : ''}</span><span class="xpbar"><i style="width:${pct}%"></i></span></div></div>`;
  },
  // campo de tiro: estadísticas de la práctica (no cuentan para el progreso)
  rangeHit(t, info, dmg) {
    const me = G.local; if (!me || !G.range) return;
    const d = me.pos.distanceTo(t.pos), head = info.part === 'head';
    if (head) G.range.head++;
    G.range.last = { dist: d, dmg, part: info.part };
    if (t.hp - dmg <= 0 || !t.alive) G.range.best = Math.max(G.range.best, d);
  },
  renderScore(force) {
    const m = G.match; if (!m) return;
    const M = G.mode, me = G.local, el = this.el.score;
    const myTeam = me && me.team >= 0 ? me.team : 0;
    const tl = M.time - m.time, timer = m.phase === 'countdown' ? fmtTime(M.time) : fmtTime(tl);
    let html = '';
    if (M.range) {
      const st = me ? me.stats : { shots: 0, hits: 0, damage: 0, headshots: 0 }, R = G.range || { head: 0, last: null, best: 0 };
      const acc = st.shots ? Math.min(100, Math.round(100 * st.hits / st.shots)) : 0, last = R.last;
      const cell = (k, v) => `<span><small>${k}</small><b>${v}</b></span>`;
      html = `<div class="rngbox"><div class="rtop"><b>${L({ es: 'CAMPO DE TIRO', en: 'SHOOTING RANGE' })}</b><em>${me ? escapeHtml(className(curClassKey())) + ' · ' + escapeHtml(L(CONFIG.WEAPONS[me.primary].name)) : ''}</em></div>
        <div class="rstats">${cell(L({ es: 'Disparos', en: 'Shots' }), st.shots)}${cell(L({ es: 'Precisión', en: 'Accuracy' }), acc + '%')}${cell(L({ es: 'Cabeza', en: 'Head' }), R.head)}${cell(L({ es: 'Daño', en: 'Damage' }), Math.round(st.damage))}${cell(L({ es: 'Último', en: 'Last' }), last ? Math.round(last.dist) + ' m · ' + Math.round(last.dmg) : '—')}${cell(L({ es: 'Récord', en: 'Best' }), R.best ? Math.round(R.best) + ' m' : '—')}</div>
        <small class="rhint"><kbd>[</kbd><kbd>]</kbd> ${L({ es: 'cambiar de clase', en: 'switch class' })} · <kbd>Esc</kbd> ${L({ es: 'editar armas', en: 'edit weapons' })}</small></div>`;
      if (html !== this._scoreHtml || force) { el.innerHTML = html; this._scoreHtml = html; }
      return;
    }
    if (M.story) {
      const nz = G.fighters.filter((f) => f.zombie && f.alive).length;
      html = `<div class="timer">${fmtTime(m.time)}<small>${L({ es: 'ESCAPA DE LA CÁRCEL', en: 'ESCAPE THE PRISON' })}</small></div>`;
      if (html !== this._scoreHtml || force) { el.innerHTML = html; this._scoreHtml = html; }
      return;
    }
    const tcol = (t) => (t === myTeam ? 'var(--friend)' : 'var(--enemy)');
    const tn = (t) => teamName(t);
    if (M.teams && !M.rounds) {
      const limit = m.limit;
      const side = (t) => `<div class="tscore ${t === myTeam ? 'mine' : 'them'}"><span class="tn">${tn(t)}</span><b>${m.score[t]}</b><span class="tbar"><i style="width:${Math.min(100, 100 * m.score[t] / limit)}%;background:${tcol(t)}"></i></span></div>`;
      html = side(myTeam) + `<div class="timer">${timer}<small>${M.dom ? L(M.name).toUpperCase() : limit}</small></div>` + side(1 - myTeam);
    } else if (M.rounds) {
      const alive = (t) => G.fighters.filter((f) => f.team === t).map((f) => `<i class="${f.alive ? '' : 'dead'}" style="background:${f.alive ? tcol(t) : ''}"></i>`).join('');
      const pips = (t) => Array.from({ length: M.winRounds }, (_, i) => `<i class="${i < m.roundWins[t] ? 'w' : ''}" style="${i < m.roundWins[t] ? 'background:' + tcol(t) : ''}"></i>`).join('');
      html = `<div class="tscore ${'mine'}"><span class="tn">${tn(myTeam)}</span><span class="pips">${pips(myTeam)}</span><span class="alive">${alive(myTeam)}</span></div><div class="timer">${timer}<small>${T('round')} ${m.round}</small></div><div class="tscore them"><span class="tn">${tn(1 - myTeam)}</span><span class="pips">${pips(1 - myTeam)}</span><span class="alive">${alive(1 - myTeam)}</span></div>`;
    } else if (M.ladder) {
      const lead = Rules.leader(), mr = me ? me.rung || 0 : 0, lr = lead ? lead.rung || 0 : 0, n = LADDER.length;
      html = `<div class="tscore mine"><span class="tn">${T('you')}</span><b>${mr}/${n}</b></div><div class="timer">${timer}<small>${L({ es: 'ESCALADA', en: 'GUN GAME' })}</small></div><div class="tscore them"><span class="tn">${lead && lead !== me ? escapeHtml(shortName(lead.name)) : '—'}</span><b>${lead && lead !== me ? lr : ([...G.fighters].filter((f) => f !== me).sort((a, b) => (b.rung || 0) - (a.rung || 0))[0] || { rung: 0 }).rung || 0}/${n}</b></div>`;
      html += `<div class="ladrow">${LADDER.map((id, i) => `<i class="${i < mr ? 'done' : i === mr ? 'cur' : ''}"></i>`).join('')}<span>${escapeHtml(ladderName(mr))}${mr < n - 1 ? ` <em>→ ${escapeHtml(ladderName(mr + 1))}</em>` : ''}</span></div>`;
    } else {
      const lead = Rules.leader(), mine = me ? me.stats.kills : 0;
      html = `<div class="tscore mine"><span class="tn">${T('you')}</span><b>${mine}</b></div><div class="timer">${timer}<small>${m.limit}</small></div><div class="tscore them"><span class="tn">${lead && lead !== me ? escapeHtml(shortName(lead.name)) : '—'}</span><b>${lead && lead !== me ? lead.stats.kills : (G.fighters.filter((f) => f !== me).sort((a, b) => b.stats.kills - a.stats.kills)[0] || { stats: { kills: 0 } }).stats.kills}</b></div>`;
    }
    if (M.dom) {
      html += `<div class="domrow">${MapSys.dom.map((d, i) => { const st = m.dom[i]; const own = st.owner < 0 ? 'neutral' : st.owner === myTeam ? 'mine' : 'them';
        const prog = Math.abs(st.prog), capTeam = st.prog < 0 ? 0 : 1, pc = st.owner < 0 && prog > 0.01 ? (capTeam === myTeam ? 'var(--friend)' : 'var(--enemy)') : 'transparent';
        return `<span class="dom ${own} ${st.contested ? 'cont' : ''}" style="--p:${Math.round(prog * 100)}%;--pc:${pc}"><b>${d.id}</b></span>`; }).join('')}</div>`;
    }
    if (html !== this._scoreHtml || force) { el.innerHTML = html; this._scoreHtml = html; }
  },
  drawRadar() {
    const c = this.radarCtx, cv = this.el.radar, f = G.local, mm = MapSys.minimap;
    const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = W / 2 - 3;
    const hide = !!(G.mode && G.mode.story), want = hide || G.settings.showRadar === false ? 'none' : ''; if (cv.style.display !== want) cv.style.display = want;
    c.clearRect(0, 0, W, H);
    if (!f || !mm || hide) return;
    const range = 42, s = R / range;
    const px = f.pos.x, pz = f.pos.z, yaw = f.input.yaw;
    c.save();
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
    c.fillStyle = 'rgba(12,14,10,0.78)'; c.fillRect(0, 0, W, H);
    c.translate(cx, cy); c.rotate(yaw); c.scale(s, s);
    c.globalAlpha = 0.85;
    c.drawImage(mm.canvas, mm.x0 - px, mm.z0 - pz, mm.w, mm.h);
    c.globalAlpha = 1;
    const dot = (x, z, r, col) => { c.fillStyle = col; c.beginPath(); c.arc(x - px, z - pz, r / s, 0, TAU); c.fill(); };
    if (G.mode.tags) for (const t of Tags.list) dot(t.x, t.z, 3.4, t.vt === f.team ? '#5ab8ff' : '#ff6a3a');
    if (G.mode.dom) MapSys.dom.forEach((d, i) => {
      const st = G.match.dom[i], col = st.owner < 0 ? '#cfc8b0' : st.owner === f.team ? '#5ab8ff' : '#ff5040';
      c.strokeStyle = col; c.lineWidth = 2 / s; c.beginPath(); c.arc(d.x - px, d.z - pz, d.r, 0, TAU); c.stroke();
      c.save(); c.translate(d.x - px, d.z - pz); c.rotate(-yaw); c.scale(1 / s, 1 / s); c.fillStyle = col; c.font = '700 12px "Barlow Condensed", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(d.id, 0, 0); c.restore();
    });
    const jam = Streaks.jammed(f);
    for (const o of G.fighters) {
      if (o === f || !o.alive) continue;
      if (!Rules.isEnemy(f, o)) dot(o.pos.x, o.pos.z, 3.4, '#5ab8ff');
      else if (!jam && (G.time - (o.lastLoudT ?? -9) < 1.6 || Streaks.revealed(f, o))) dot(o.pos.x, o.pos.z, 3.6, '#ff5040');
    }
    for (const cr of Streaks.crates) if (cr.t > 1.6) dot(cr.x, cr.z, 3, '#8fe07a');
    c.restore();
    if (jam) { // estática: el radar enemigo está interferido
      c.save(); c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.clip();
      for (let i = 0; i < 90; i++) { c.fillStyle = `rgba(${150 + Math.random() * 100 | 0},${150 + Math.random() * 100 | 0},${150 + Math.random() * 100 | 0},${0.12 + Math.random() * 0.2})`; c.fillRect(Math.random() * W, Math.random() * H, 6 + Math.random() * 22, 1 + Math.random() * 3); }
      c.restore();
    }
    // jugador al centro, mirando hacia arriba
    c.fillStyle = '#f2ead0'; c.beginPath(); c.moveTo(cx, cy - 7); c.lineTo(cx + 5, cy + 5); c.lineTo(cx, cy + 2); c.lineTo(cx - 5, cy + 5); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(230,226,211,0.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
    c.fillStyle = 'rgba(230,226,211,0.7)'; c.font = '600 10px "Barlow Condensed", sans-serif'; c.textAlign = 'center';
    c.fillText('N', cx + (R - 9) * Math.sin(yaw), cy - (R - 9) * Math.cos(yaw) + 3);
  },
  drawCompass() {
    const cv = this.el.compass, f = G.local; if (!cv || cv.hidden) return;
    const c = this.compassCtx || (this.compassCtx = cv.getContext('2d')), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    if (!f || !f.alive || Replay.playing) return;
    const span = 130 * Math.PI / 180, heading = -f.input.yaw, cx = W / 2;
    const X = (bearing) => cx + wrapAngle(bearing - heading) / span * W;
    const es = LANG !== 'en', names = es ? { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SO', 270: 'O', 315: 'NO' } : { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
    const hd = heading * 180 / Math.PI;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let d = Math.floor((hd - 66) / 5) * 5; d <= hd + 66; d += 5) {
      const x = X(d * Math.PI / 180), dd = ((d % 360) + 360) % 360, big = dd % 45 === 0, mid = dd % 15 === 0;
      c.strokeStyle = big ? 'rgba(242,234,208,.95)' : 'rgba(231,226,208,.5)'; c.lineWidth = big ? 2 : 1;
      c.beginPath(); c.moveTo(x, H - 3); c.lineTo(x, H - 3 - (big ? 11 : mid ? 7 : 4)); c.stroke();
      if (big) { c.font = '700 15px "Barlow Condensed", sans-serif'; c.fillStyle = dd % 90 === 0 ? '#f0c46a' : '#e7e2d0'; c.fillText(names[dd], x, H - 23); }
      else if (dd % 30 === 0) { c.font = '600 10px "Barlow Condensed", sans-serif'; c.fillStyle = 'rgba(231,226,208,.65)'; c.fillText(String(dd), x, H - 19); }
    }
    // objetivos: puntos de Dominio, placas y cajas de suministro
    const mark = (x, z, label, col, r) => {
      const px = clamp(X(Math.atan2(x - f.pos.x, -(z - f.pos.z))), 14, W - 14), off = px <= 14 || px >= W - 14;
      c.globalAlpha = off ? 0.55 : 1; c.fillStyle = 'rgba(12,14,10,.85)'; c.beginPath(); c.arc(px, 11, r + 2, 0, TAU); c.fill();
      c.fillStyle = col; c.beginPath(); c.arc(px, 11, r, 0, TAU); c.fill();
      if (label) { c.fillStyle = '#10120d'; c.font = '700 13px "Barlow Condensed", sans-serif'; c.fillText(label, px, 11.5); }
      c.globalAlpha = 1;
    };
    if (G.mode.dom && G.match) MapSys.dom.forEach((d, i) => { const st = G.match.dom[i]; if (st) mark(d.x, d.z, 'ABC'[i] || String(i + 1), st.owner < 0 ? '#cfc8b0' : st.owner === f.team ? '#5ab8ff' : '#ff5040', 8); });
    if (G.mode.tags) { let n = 0; for (const t of Tags.list) { if (n++ > 6) break; mark(t.x, t.z, '', t.vt === f.team ? '#5ab8ff' : '#ff6a3a', 4); } }
    for (const cr of Streaks.crates) if (cr.t > 1.6) mark(cr.x, cr.z, '▣', '#8fe07a', 7);
    // centro: guía y rumbo
    c.fillStyle = '#f0c46a'; c.beginPath(); c.moveTo(cx - 6, 0); c.lineTo(cx + 6, 0); c.lineTo(cx, 8); c.closePath(); c.fill();
  },
  center(html, ms = 1200, cls = '') {
    const c = this.el['center-msg']; c.className = 'hud-pad ' + cls; c.innerHTML = html; clearTimeout(this._ct);
    if (ms) this._ct = setTimeout(() => { c.innerHTML = ''; }, ms);
  },
  plus(text, cls = '') {
    const p = this.el.plus; if (!p) return;
    const d = document.createElement('div'); d.className = 'pl ' + cls; d.textContent = text; p.prepend(d);
    while (p.children.length > 4) p.lastChild.remove();
    setTimeout(() => d.remove(), 1600);
  },
  showMedal(id) { this.showMedals([id]); },

  // un solo marcador: blanco al impactar, rojo al eliminar (mismo tamaño y siempre en el centro)
  hitmarker(kill) {
    if (G.settings.showHitmarker === false) return;
    // un impacto justo después de una baja no debe cortar el marcador rojo a medias
    if (!kill && this._killMarkT != null && G.realTime - this._killMarkT < 0.35) return;
    if (kill) this._killMarkT = G.realTime;
    // animación por Web Animations: no fuerza un recálculo de estilos por cada impacto (una escopeta o una explosión disparaban decenas por cuadro)
    const h = this.el.hitmarker; h.className = kill ? 'hud-pad kill' : 'hud-pad';
    if (this._hmA) this._hmA.cancel();
    this._hmA = h.animate ? h.animate([{ opacity: 1 }, { opacity: 1, offset: kill ? 0.7 : 0.55 }, { opacity: 0 }], { duration: kill ? 500 : 260, easing: 'ease-out' }) : null;
  },
  // la bala dio en un enemigo con protección de reaparición: no hace daño, así que no hay marcador; solo un clic apagado
  hitBlocked() { if (G.attract || G.settings.hitSound === false) return; AUDIO.play('hitmark', null, 0.3, { pitch: 0.55, throttle: 0.05 }); },
  // impacto del jugador: marcador y sonido según lo que golpeó (cabeza, pared, explosión); la baja pone su propio sonido
  hitFeedback(info) {
    if (!info || G.attract) return;
    if (info._fb) return; info._fb = true;   // 'damaged' y 'hitmarker' pueden llegar juntos para el mismo impacto
    const kind = info.kind === 'explosion' ? 'boom' : info.pen ? 'pen' : info.part === 'head' ? 'head' : 'hit';   // solo cambia el sonido
    const t0 = info.target; this.hitmarker(!!(t0 && t0.hp <= 0));
    const t = info.target;
    if (G.settings.hitSound !== false && !(t && t.hp <= 0)) AUDIO.play(kind === 'boom' ? 'hitboom' : kind === 'pen' ? 'hitpen' : kind === 'head' ? 'headshot' : 'hitmark', null, 0.75);
  },
  // aviso al subir de nivel un arma o completar un reto
  weaponProgressFx(w, r) {
    if (G.attract || !r || !CONFIG.WEAPONS[w]) return;
    const nm = escapeHtml(L(CONFIG.WEAPONS[w].name)), res = r.res;
    if (res && res.after.level > res.before.level) {
      AUDIO.play('levelup', null, 0.6);
      this.toast(`<b style="color:var(--accent)">${T('wlevel_up', { n: res.after.level })}</b> · ${nm}${res.att.length ? `<br><small>${T('new_unlocks')}: ${res.att.map(escapeHtml).join(', ')}</small>` : ''}`, 4200);
    }
    if (r.newCh.length || r.gold) {
      const names = r.newCh.map((c) => L(WSKINS[c.skin])); if (r.gold) names.push(L(WSKINS.gold));
      AUDIO.play('camo', null, 0.6);
      this.toast(`<b style="color:#7fd06a">${T('ch_done')}</b> · ${nm}<br><small>${T('camo')}: ${names.map(escapeHtml).join(', ')}</small>`, 4200);
    }
  },
  addFeed(ev) {
    if (G.attract) return;
    const k = ev.killer, v = ev.victim, me = G.local;
    const W = ev.weapon && CONFIG.WEAPONS[ev.weapon] ? L(CONFIG.WEAPONS[ev.weapon].name) : STR['how_' + ev.weapon] ? T('how_' + ev.weapon) : ev.cause === 'fall' ? T('how_fall') : (ev.weapon || '');
    const col = (f) => !me ? 'var(--text)' : f === me ? 'var(--accent)' : Rules.isEnemy(me, f) ? 'var(--enemy)' : 'var(--friend)';
    const row = document.createElement('div');
    row.className = 'kf' + (k === me || v === me ? ' me' : '');
    row.innerHTML = (k ? `<span class="nm" style="color:${col(k)}">${escapeHtml(k.name)}</span>` : '') + `<span class="how">${escapeHtml(W)}${ev.headshot ? ' <i class="hs">✕</i>' : ''}</span><span class="nm" style="color:${col(v)}">${escapeHtml(v.name)}</span>`;
    this.el.killfeed.prepend(row);
    while (this.el.killfeed.children.length > 5) this.el.killfeed.lastChild.remove();
    setTimeout(() => row.remove(), 6500);
  },
  toast(html, ms = 3600) { const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html; this.el.toasts.appendChild(t); setTimeout(() => t.remove(), ms); },
  showError(msg) {
    const e = this.el.errbox; if (!e) return;
    e.hidden = false; e.innerHTML = `<b>${T('err')}</b><pre>${escapeHtml(msg.slice(0, 600))}</pre>`;
    clearTimeout(this._et); this._et = setTimeout(() => { e.hidden = true; }, 7000);
  },
  scoreboard(on) {
    if (G.mode && G.mode.story) { if (on && G.match && G.local && G.local.alive && !G.paused) Inv.toggle(); return; }
    if (G.mode && G.mode.campaign) { this.el.scoreboard.hidden = true; return; }
    const sb = this.el.scoreboard;
    if (!on || !G.match || G.attract) { sb.hidden = true; return; }
    sb.hidden = false; sb.innerHTML = `<div class="panel dark">${this.statsTable()}</div>`;
  },
  statsTable() {
    const me = G.local, M = G.mode, m = G.match;
    const head = `<tr><th>${T('player')}</th><th>${T('score')}</th><th>${T('kills')}</th><th>${T('deaths')}</th><th>${T('assists')}</th>${M.dom ? `<th>${T('captures')}</th>` : ''}${M.tags ? `<th>${L({ es: 'Placas', en: 'Tags' })}</th>` : ''}${M.ladder ? `<th>${L({ es: 'Peldaño', en: 'Rung' })}</th>` : ''}${NET.active ? `<th>${T('ping')}</th>` : ''}</tr>`;
    const row = (f) => `<tr class="${f === me ? 'me' : ''} ${f.alive ? '' : 'deadrow'}"><td><span class="sw" style="background:${f.team >= 0 ? (me && f.team === me.team ? 'var(--friend)' : 'var(--enemy)') : '#999'}"></span>${rankBadge(f.level || 1, 16)}<span class="lvn">${f.level || 1}</span>${escapeHtml(f.name)}</td><td>${f.stats.score}</td><td>${f.stats.kills}</td><td>${f.stats.deaths}</td><td>${f.stats.assists}</td>${M.dom ? `<td>${f.stats.captures}</td>` : ''}${M.tags ? `<td>${f.stats.tags || 0}/${f.stats.denies || 0}</td>` : ''}${M.ladder ? `<td>${f.rung || 0}</td>` : ''}${NET.active ? `<td>${f.ping != null ? f.ping + ' ms' : '—'}</td>` : ''}</tr>`;
    const sort = (a, b) => (M.ladder ? (b.rung || 0) - (a.rung || 0) : 0) || b.stats.score - a.stats.score || b.stats.kills - a.stats.kills;
    if (M.teams) {
      const t0 = me && me.team >= 0 ? me.team : 0;
      return [t0, 1 - t0].map((t) => `<div class="tablewrap"><table class="stats"><caption style="color:${t === t0 ? 'var(--friend)' : 'var(--enemy)'}">${teamName(t)} · ${M.rounds ? m.roundWins[t] : m.score[t]}</caption><thead>${head}</thead><tbody>${G.fighters.filter((f) => f.team === t).sort(sort).map(row).join('')}</tbody></table></div>`).join('');
    }
    return `<div class="tablewrap"><table class="stats"><thead>${head}</thead><tbody>${[...G.fighters].sort((a, b) => M.ladder ? sort(a, b) : b.stats.kills - a.stats.kills || sort(a, b)).map(row).join('')}</tbody></table></div>`;
  },
  showResults() {
    const m = G.match; if (!m) return;
    Input.releaseLock(); Input.enabled = false;
    const me = G.local, M = G.mode;
    let title;
    if (M.teams) title = m.winner === -1 ? T('draw') : (me && m.winner === me.team) ? T('victory') : T('defeat');
    else { const champ = G.fighters.find((f) => f.slot === m.winner); title = champ === me ? T('victory') : champ ? T('ffa_win', { n: champ.name.toUpperCase() }) : T('draw'); }
    const mvp = [...G.fighters].sort((a, b) => b.stats.score - a.stats.score)[0];
    const mine = me ? Object.keys(me.stats.medals).filter((k) => MEDALS[k]).sort((a, b) => MEDAL_RANK(b) - MEDAL_RANK(a)).map((k) => `<span class="mchip">${medalSvg(k, 28)}${L(MEDALS[k])} <em>×${me.stats.medals[k]}</em></span>`).join('') : '';
    this.overlayKind = 'results';
    this.el.overlay.className = ''; this.el.overlay.hidden = false;
    const cls = title === T('victory') ? 'win' : title === T('defeat') ? 'lose' : '';
    this.el.overlay.innerHTML = `<div class="panel ov wide"><span class="lbl">${T('results')} · ${L(M.name)} · ${L(MapSys.def.name)}</span>
      <h2 class="result ${cls}">${escapeHtml(title)}</h2>
      ${M.teams ? `<p class="lead big">${teamName(0)} ${M.rounds ? m.roundWins[0] : m.score[0]} — ${M.rounds ? m.roundWins[1] : m.score[1]} ${teamName(1)}</p>` : ''}
      ${mvp ? `<p class="note">${T('mvp')}: <b>${escapeHtml(mvp.name)}</b> · ${mvp.stats.score} ${T('score').toLowerCase()}</p>` : ''}
      ${this.statsTable()}
      ${this.htmlXp(m.xpRes)}
      <h3>${T('your_medals')}</h3><div class="mchips">${mine || `<span class="note">${T('none')}</span>`}</div>
      <div class="actions"><button class="btn primary" data-act="rematch">${T('rematch')}</button><button class="btn" data-act="changeMatch">${T('change_mode')}</button><button class="btn danger" data-act="quit">${T('quit')}</button></div></div>`;
  },
  htmlXp(res) {
    if (!res) return '';
    const a = res.after, up = a.level > res.before.level, pct = a.need ? Math.round(100 * a.into / a.need) : 100;
    const parts = res.parts.map(([k, v]) => `<span>+${v} ${T(k)}</span>`).join('');
    const unl = res.unlocks.length ? `<div class="unl"><span class="lbl">${T('new_unlocks')}</span>${res.unlocks.map((u) => `<em>${escapeHtml(u.name)}</em>`).join('')}</div>` : '';
    const wl = Object.keys(res.weapons || {}).map((w) => { const g = res.weapons[w], up2 = g.to > g.from;
      return `<div class="wxrow ${up2 ? 'up' : ''}"><b>${escapeHtml(L(CONFIG.WEAPONS[w].name))}</b><span>+${g.xp} ${T('xp_weapon')}</span><span>${T('gs_wlevel')} ${g.from}${up2 ? ' → ' + g.to : ''}</span>${g.att.length ? `<em>${T('new_unlocks')}: ${g.att.map(escapeHtml).join(', ')}</em>` : ''}${g.ch.length ? `<em class="ch">${T('ch_done')}: ${g.ch.map(escapeHtml).join(', ')}</em>` : ''}</div>`; }).join('');
    return `<div class="xpres ${up ? 'up' : ''}"><div class="xprow">${rankBadge(a.level, 30, res.pr)}<b>${escapeHtml(Progress.rankName(a.level))}</b><span>${T('level')} ${a.level}</span>${up ? `<span class="upt">${T('rank_up')}</span>` : ''}<span class="tot">+${res.amount} ${T('xp')}</span></div>
      <span class="xpbar big"><i style="width:${pct}%"></i></span><div class="xpparts">${parts}</div>${unl}${wl ? `<div class="wxres"><span class="lbl">${T('xp_weapons')}</span>${wl}</div>` : ''}</div>`;
  },
  showRoundEnd(info) {
    if (G.attract) return;
    const me = G.local, w = info.winner;
    const title = w === -1 ? T('round_draw') : me && w === me.team ? T('round_won') : T('round_lost');
    const cls = w === -1 ? '' : me && w === me.team ? 'win' : 'lose';
    const myT = me ? me.team : 0;
    this.center(`<div class="mid ${cls}">${title}</div><div class="small">${teamName(myT)} ${info.wins[myT]} — ${info.wins[1 - myT]} ${teamName(1 - myT)}</div>`, 3600, 'banner');
  },

  // ------------------- escuchar eventos del juego -------------------
  bindBus() {
    BUS.on('escape', () => {
      if (Input.remapAction) return;
      if (Inv.open) { Inv.close(false); if (this.inGame() && !this.isPaused()) this.pause(); return; }
      if (Replay.playing && this.inGame()) { Replay.skip(); return; }
      if (this.screen === 'gunsmith') { this.show('soldier'); return; }
      if (this.screen && this.screen !== 'main' && !this.inGame()) { this.show('main'); return; }
      if (this.screen && this.inGame()) { this.hideMenu(); this.pause(true); return; }
      if (this.overlayKind === 'results' || this.overlayKind === 'gore') return;
      if (this.inGame()) { if (this.isPaused()) this.resume(); else this.pause(); }
    });
    BUS.on('lockLost', () => { if (this.inGame() && !this.isPaused() && this.overlayKind !== 'results' && Input.enabled && !Inv.open) this.pause(); });
    BUS.on('blur', () => { if (this.inGame() && !this.isPaused() && this.overlayKind !== 'results' && Input.enabled && !NET.active) this.pause(); });
    BUS.on('toggleCamera', () => { if (this.inGame() && Input.enabled) CAM.toggleMode(); });
    BUS.on('swapShoulder', () => { if (this.inGame() && Input.enabled) { CAM.swapShoulder(); this.el['shoulder-chip'].classList.remove('flash'); void this.el['shoulder-chip'].offsetWidth; this.el['shoulder-chip'].classList.add('flash'); AUDIO.play('cloth', null, 0.4); } });
    BUS.on('toggleHelp', () => { if (this.inGame() && Input.enabled) { this.pause(true); this.el.overlay.hidden = true; this.show('help'); } });
    BUS.on('scoreboard', (down) => this.scoreboard(down));
    BUS.on('digit', (n) => {
      const f = G.local;
      if (!this.inGame() || !f || f.alive || n < 1 || n > classKeys().length || !Input.enabled) return;
      setClass(classKeys()[n - 1]); saveSettings(); NET._lo = null; AUDIO.play('ui', null, 0.5);
    });
    BUS.on('rangeCls', (d) => {
      if (!this.inGame() || !G.mode || !G.mode.range || !G.local || !Input.enabled) return;
      const ks = classKeys(), i = (ks.indexOf(curClassKey()) + d + ks.length) % ks.length;
      setClass(ks[i]); saveSettings(); NET._lo = null; Rules.rangeRefit(); AUDIO.play('ui', null, 0.5);
      this.toast(escapeHtml(className(ks[i])).toUpperCase() + ' · ' + escapeHtml(L(CONFIG.WEAPONS[G.local.primary].name)), 1300);
    });
    BUS.on('streakEarned', (f, id) => {
      if (f !== G.local || G.attract) return;
      this.center(`<div class="mid streak">${escapeHtml(L(CONFIG.STREAKS[id]).toUpperCase())}</div><div class="small">${T('streak_ready', { s: L(CONFIG.STREAKS[id]), k: Input.keyName(Input.bindings.streak[0]) })}</div>`, 2200, 'banner small');
      AUDIO.play('streak', null, 0.7);
    });
    BUS.on('streakUsed', (f, id) => {
      const me = G.local; if (!me || G.attract) return;
      const nm = L(CONFIG.STREAKS[id]);
      if (id === 'jam') { if (Rules.isEnemy(me, f)) this.toast(`<span style="color:var(--enemy)">▒ ${T('jam_enemy')}</span>`, 2600); else this.toast(`▒ ${T('jam_on')}`, 2200); AUDIO.play('radio', null, 0.6); return; }
      if (id === 'supply') { this.toast(Rules.isEnemy(me, f) ? `<span style="color:var(--enemy)">▣ ${T('supply_enemy')}</span>` : `▣ ${T('supply_on')}`, 2600); AUDIO.play('radio', null, 0.6); return; }
      if (id === 'uav') { if (!Rules.isEnemy(me, f)) { if (f === me || G.mode.teams) this.toast(`◉ ${T('uav_on')}`, 2600); } else this.toast(`<span style="color:var(--enemy)">◉ ${T('uav_enemy')}</span>`, 2600); AUDIO.play('radio', null, 0.6); return; }
      if (Rules.isEnemy(me, f)) { this.center(`<div class="mid lose">${T('strike_enemy', { s: nm.toUpperCase() })}</div>`, 2400, 'banner small'); AUDIO.play('alarm', null, 0.6); }
      else { this.toast(`◎ ${T('strike_friendly', { s: nm })}`, 2400); AUDIO.play('radio', null, 0.6); }
    });
    BUS.on('targetFail', (f) => { if (f === G.local) { this.toast(T('target_fail'), 1400); AUDIO.play('dry', null, 0.5); } });
    BUS.on('toggleTuning', () => Tuning.toggle());
    BUS.on('roundStart', (m) => {
      if (G.attract) return;
      this.closeOverlay(); Input.enabled = true; if (!Input.locked) Input.requestLock();
      this.el.death.hidden = true;
      let n = CONFIG.ROUND.countdown;
      const label = G.mode.rounds ? `${T('round')} ${m.round}` : L(G.mode.name).toUpperCase();
      const show = () => this.center(`<div class="small">${label} · ${L(MapSys.def.name).toUpperCase()}</div><div class="mid">${T('prepare')}</div><div class="big">${n}</div>`, 0, 'count');
      show(); AUDIO.play('beep');
      const tick = () => { n--; if (!G.match || G.match.phase !== 'countdown') return; if (n > 0) { show(); AUDIO.play('beep'); setTimeout(tick, 1000); } };
      setTimeout(tick, 1000);
      this.renderScore(true);
    });
    BUS.on('fight', () => { if (G.attract) return; this.center(`<div class="mid go">${T('fight')}</div>`, 900, 'count'); AUDIO.play('go'); });
    BUS.on('roundEnd', (info) => { this.showRoundEnd(info); if (!G.attract) AUDIO.play(G.local && info.winner === G.local.team ? 'win' : 'lose', null, 0.7); });
    BUS.on('matchOver', () => { if (!G.attract) { setTimeout(() => { if (G.match && G.match.phase === 'matchEnd') { Replay.stop(); this.showResults(); } }, 1800); AUDIO.play(Rules.didLocalWin() ? 'win' : 'lose', null, 0.8); } });
    BUS.on('kill', (ev) => {
      this.addFeed(ev);
      if (G.attract) return;
      const me = G.local;
      if (ev.killer === me && me) { this.hitmarker(true); this.plus(`+100 ${ev.headshot ? T('hs_plus') : T('kill_plus')}`, 'kill'); if (G.settings.hitSound !== false) AUDIO.play(ev.headshot ? 'killhead' : 'killconfirm', null, 0.65); this._hmT = G.realTime; }
      if (me && ev.assists.includes(me)) this.plus(`+50 ${T('assist_plus')}`);
      if (ev.victim === me) {
        const k = ev.killer;
        const W = ev.weapon && CONFIG.WEAPONS[ev.weapon] ? L(CONFIG.WEAPONS[ev.weapon].name) : STR['how_' + ev.weapon] ? T('how_' + ev.weapon) : T('how_fall');
        this._killer = k ? { name: k.name, weapon: W, hs: ev.headshot, dist: Math.round(ev.dist) } : { self: true, weapon: W };
        this.el.scope.hidden = true;
      }
      this.renderScore(true);
    });
    BUS.on('medal', (f, id) => { if (f && f === G.local && !G.attract) this.medalQ.push([id]); });
    BUS.on('medalChain', (f, ids) => { if (f && f === G.local && !G.attract) { while (this.medalQ.length > 3) this.medalQ.shift(); this.medalQ.push(ids); } });
    BUS.on('damaged', (t, info, dmg) => {
      const a = info.attacker, me = G.local;
      if (a === me && t !== me && me && dmg > 0) { this.hitFeedback(info); if (G.mode.range) this.rangeHit(t, info, dmg); else if (info.kind === 'bullet') Progress.onDamage(info.weapon, dmg); }
      if (t === me && dmg > 0) {
        CAM.addShake(Math.min(0.5, 0.08 + dmg / 120));
        this._hitFlash = Math.min(0.6, (this._hitFlash || 0) + dmg / 90);
        if (a && a !== me) { const arc = this.dmgArcs.find((x) => x.t <= 0) || this.dmgArcs[0]; arc.t = 1.4; arc.src.copy(a.pos); }
        else if (info.point) { const arc = this.dmgArcs.find((x) => x.t <= 0) || this.dmgArcs[0]; arc.t = 1.2; arc.src.copy(info.point); }
      }
      if (!(t === me && CAM.isFP)) FX.hitFx(info);
    });
    BUS.on('wounded', (t, zone, dmg) => {
      if (t !== G.local) return;
      if (zone === 'head' || zone === 'blast') AUDIO.play('ring', null, 0.8, { throttle: 0.5 });
      else AUDIO.play('pain', null, 0.7, { throttle: 0.3, pitch: 0.8 });
      CAM.addShake(zone === 'head' ? 0.7 : 0.35);
      if (zone === 'head' || zone === 'blast') CAM.punch += 0.05;
    });
    BUS.on('hitmarker', (info) => this.hitFeedback(info));
    BUS.on('hitblocked', () => this.hitBlocked());
    BUS.on('wprogress', (w, r) => this.weaponProgressFx(w, r));
    BUS.on('pickup', (f, id) => { if (f === G.local) AUDIO.play('pickup', null, 0.6); });
    BUS.on('captured', (i, team) => {
      if (G.attract || !G.local) return;
      const id = MapSys.dom[i].id, mine = team === G.local.team;
      this.center(`<div class="mid ${mine ? 'win' : 'lose'}">${mine ? T('captured', { p: id }) : T('lost_point', { p: id })}</div>`, 1500, 'banner small');
      AUDIO.play(mine ? 'capture' : 'lose', null, 0.6);
    });
    BUS.on('lastAlive', (f) => {
      if (G.attract || !G.local) return;
      if (f === G.local) this.center(`<div class="mid">${T('last_alive')}</div>`, 1800, 'banner');
      else if (Rules.isEnemy(G.local, f)) this.center(`<div class="mid">${T('enemy_last')}</div>`, 1500, 'banner small');
    });
    BUS.on('spawn', (f) => { if (f === G.local) { this.el.death.hidden = true; this._killer = null; } });
    BUS.on('replayStart', (killer) => {
      const k = this._killer;
      this.$('kc-cap').innerHTML = `${T('killed_by')} <b>${escapeHtml(killer.name)}</b>${k && k.weapon ? ' · ' + escapeHtml(k.weapon) : ''}`;
      this.el.killcam.querySelector('.skip').textContent = T('skip');
      this.el.killcam.querySelector('.rec').textContent = '● ' + T('killcam');
      this.el.killcam.hidden = false; this.el.death.hidden = true; this.el.crosshair.style.opacity = 0; this.el.scope.hidden = true;
      this.el.hud.classList.add('kc');
    });
    BUS.on('replayDone', () => { this.el.killcam.hidden = true; this.el.hud.classList.remove('kc', 'kcv'); });
    BUS.on('replayPhase', (ph) => {
      if (ph !== 'victim') return;
      this.$('kc-cap').innerHTML = T('kc_fall');
      this.el.killcam.querySelector('.rec').textContent = '● ' + T('kc_slow');
      this.el.hud.classList.add('kcv'); this.el['fx-flash'].style.transition = 'none'; this.el['fx-flash'].style.opacity = 0.35;
      requestAnimationFrame(() => { this.el['fx-flash'].style.transition = 'opacity .5s'; this.el['fx-flash'].style.opacity = 0; });
    });
    // cambio de arma y fin de recarga: pequeño destello en el bloque del arma
    const pulse = (cls) => { const w = this.el.weapon; w.classList.remove(cls); void w.offsetWidth; w.classList.add(cls); };
    BUS.on('weaponSwitch', (f) => { if (f === G.local && !G.attract) pulse('swap'); });
    BUS.on('reloaded', (f) => { if (f === G.local && !G.attract) pulse('rdone'); });
  },
};
// nombre corto del arma para las ranuras: el código del modelo (AR-4, P-9…) o la primera palabra
function weaponShort(id) {
  const W = CONFIG.WEAPONS[id]; if (!W) return '';
  const n = L(W.name), m = n.match(/[A-ZÁÉÍÓÚ]{1,3}-\d+/);
  return (m ? m[0] : n.split(' ')[0]).toUpperCase();
}
function shortName(n) { const w = n.split(' '); const s = w.length > 1 && w[0].length <= 5 ? w[1] : w[0]; return s.length > 11 ? s.slice(0, 10) + '…' : s; }
function setText(el, v) { if (el && el._v !== v) { el._v = v; el.textContent = v; } }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function medalIcon(id) { return medalSvg(id, 30); }
// emblema de medalla en SVG: forma por categoría, color por nivel (bronce, plata, oro)
const MEDAL_TIER = { 1: ['#c58f5a', '#3a2614'], 2: ['#d6dadb', '#2c3134'], 3: ['#f2c65c', '#3e2c08'] };
const MEDAL_SHAPES = {
  hex: 'M24 3 L42.2 13.5 L42.2 34.5 L24 45 L5.8 34.5 L5.8 13.5 Z',
  star: 'M24 2.5 L29.4 17.3 L45 17.8 L32.7 27.4 L37.1 42.6 L24 33.8 L10.9 42.6 L15.3 27.4 L3 17.8 L18.6 17.3 Z',
  circle: 'M24 3 A21 21 0 1 1 23.99 3 Z',
  shield: 'M24 3 L42 9 L42 24 C42 35 33 42 24 45.5 C15 42 6 35 6 24 L6 9 Z',
  diamond: 'M24 2.5 L45.5 24 L24 45.5 L2.5 24 Z',
  chev: 'M6 5 L42 5 L42 32 L24 45 L6 32 Z',
  cross: 'M16.5 3 H31.5 V16.5 H45 V31.5 H31.5 V45 H16.5 V31.5 H3 V16.5 H16.5 Z',
  burst: (() => { let d = ''; for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 15 : 22; d += (i ? 'L' : 'M') + (24 + Math.cos(a) * r).toFixed(1) + ' ' + (24 + Math.sin(a) * r).toFixed(1) + ' '; } return d + 'Z'; })(),
};
function medalSvg(id, size = 44) {
  const M = MEDALS[id] || { tier: 1, shape: 'circle', g: '★' };
  const [c, dk] = MEDAL_TIER[M.tier] || MEDAL_TIER[1], sh = MEDAL_SHAPES[M.shape] || MEDAL_SHAPES.circle;
  const g = String(M.g || '★'), fs = g.length >= 3 ? 12 : g.length === 2 ? 15 : 19;
  return `<svg class="medsvg" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true"><path d="${sh}" fill="${dk}" fill-opacity=".92" stroke="${c}" stroke-width="2.2" stroke-linejoin="round"/>`
    + `<path d="${sh}" fill="none" stroke="${c}" stroke-opacity=".35" stroke-width="1" transform="translate(24 24) scale(.8) translate(-24 -24)"/>`
    + `<text x="24" y="${24 + fs * 0.36}" text-anchor="middle" font-family="Barlow Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="${fs}" fill="${c}">${escapeHtml(g)}</text></svg>`;
}

// ------------------- PANEL DE TUNING (F1) -------------------
const TUNE_KEYS = [
  ['MOVE', 'walkSpeed', 2, 10, 0.1], ['MOVE', 'sprintSpeed', 4, 14, 0.1], ['MOVE', 'groundAccel', 2, 30, 0.5], ['MOVE', 'friction', 1, 15, 0.1], ['MOVE', 'jumpVel', 3, 12, 0.1], ['MOVE', 'gravity', 8, 40, 0.5],
  ['MOVE', 'slideBoost', 0, 6, 0.1], ['MOVE', 'slideDuration', 0.2, 2, 0.05], ['MOVE', 'mantleTime', 0.2, 1, 0.02],
  ['RAGDOLL', 'stiffness', 1e5, 1e8, 1e5], ['RAGDOLL', 'relaxation', 1, 10, 0.1], ['RAGDOLL', 'iterations', 4, 30, 1], ['RAGDOLL', 'linearDamping', 0, 0.6, 0.01], ['RAGDOLL', 'angularDamping', 0, 0.95, 0.01],
  ['RAGDOLL', 'activeTime', 0, 1, 0.02], ['RAGDOLL', 'activeSupport', 0, 1.2, 0.05], ['RAGDOLL', 'deathPush', 0, 3, 0.05], ['RAGDOLL', 'friction', 0, 1.5, 0.05],
  ['FIGHTER', 'regenDelay', 1, 10, 0.1], ['FIGHTER', 'regenRate', 5, 60, 1], ['FIGHTER', 'knockdownK', 0.1, 1, 0.02],
  ['CAMERA', 'thirdBack', 1.5, 6, 0.05], ['CAMERA', 'thirdRight', 0, 1.2, 0.02], ['CAMERA', 'shoulderSpeed', 2, 20, 0.5],
];
const Tuning = {
  toggle() {
    const el = UI.el.tuning;
    if (!el.hidden) { el.hidden = true; return; }
    let h = `<div style="display:flex;justify-content:space-between;align-items:center"><b class="tt">${T('tuning')}</b></div>`;
    let sec = '';
    TUNE_KEYS.forEach(([s, k, min, max, step], i) => {
      if (s !== sec) { h += `<h4>${s}</h4>`; sec = s; }
      const v = CONFIG[s][k];
      h += `<div class="tr"><span>${k}</span><input type="range" data-i="${i}" min="${min}" max="${max}" step="${step}" value="${v}"><output id="tv${i}">${fmtTune(v)}</output></div>`;
    });
    h += `<div class="actions" style="margin-top:12px"><button class="btn small" data-act="copytune">${T('copy')}</button></div><textarea id="tunetext" readonly></textarea>`;
    el.innerHTML = h; el.hidden = false;
  },
};
function fmtTune(v) { return Math.abs(v) >= 1e4 ? v.toExponential(1) : (Math.round(v * 1000) / 1000).toString(); }
UI.onTune = function (e) {
  const i = +e.target.dataset.i; if (Number.isNaN(i)) return;
  const [s, k] = TUNE_KEYS[i]; CONFIG[s][k] = +e.target.value;
  const o = document.getElementById('tv' + i); if (o) o.textContent = fmtTune(CONFIG[s][k]);
  if (s === 'RAGDOLL') PHYS.applyRagdollTuning();
};
UI.copyTune = function () {
  const out = {}; for (const [s, k] of TUNE_KEYS) { out[s] = out[s] || {}; out[s][k] = CONFIG[s][k]; }
  const txt = JSON.stringify(out, null, 1);
  const ta = document.getElementById('tunetext'); if (ta) ta.value = txt;
  try { navigator.clipboard.writeText(txt).then(() => UI.toast(T('copied'), 1200)).catch(() => { if (ta) { ta.focus(); ta.select(); } }); } catch (e) { if (ta) { ta.focus(); ta.select(); } }
};

// miniatura ilustrada de cada mapa (silueta sobre el cielo del mapa), se dibuja una vez
const _thumbs = {};
function mapThumb(id) {
  if (_thumbs[id]) return _thumbs[id];
  const M = MAPS[id], th = M.thumb, c = document.createElement('canvas'); c.width = 320; c.height = 110;
  const x = c.getContext('2d'), W = c.width, H = c.height, gy = 78;
  const sky = x.createLinearGradient(0, 0, 0, gy); sky.addColorStop(0, th[0]); sky.addColorStop(1, th[1]); x.fillStyle = sky; x.fillRect(0, 0, W, gy);
  // colinas lejanas
  x.fillStyle = 'rgba(40,40,36,.28)'; x.beginPath(); x.moveTo(0, gy);
  for (let i = 0; i <= 8; i++) x.lineTo(i * 40, gy - 14 - ((i * 37) % 17)); x.lineTo(W, gy); x.fill();
  x.fillStyle = th[2]; x.fillRect(0, gy, W, H - gy);
  const sil = 'rgba(22,22,20,.86)', box = (a, b, w, h) => x.fillRect(a, gy - h, w, h);
  x.fillStyle = sil;
  const roof = (a, w, h, hh) => { x.beginPath(); x.moveTo(a - 3, gy - h); x.lineTo(a + w / 2, gy - h - hh); x.lineTo(a + w + 3, gy - h); x.fill(); };
  const house = (a, w, h, hh = 10) => { box(a, 0, w, h); roof(a, w, h, hh); };
  const clockAt = (cx, cy, r) => { x.fillStyle = 'rgba(232,224,203,.95)'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); x.strokeStyle = sil; x.lineWidth = 1.5; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx - r * 0.5, cy - r * 0.3); x.moveTo(cx, cy); x.lineTo(cx + r * 0.4, cy - r * 0.6); x.stroke(); x.fillStyle = sil; };
  // 3.3.0: siluetas de los mapas nuevos de la novela
  if (id === 'pueblo') {
    house(8, 34, 26); house(46, 30, 32); house(152, 36, 24); house(194, 28, 30);
    box(96, 0, 40, 30); roof(96, 40, 30, 12); box(124, 0, 16, 60); roof(124, 16, 60, 14); clockAt(132, gy - 46, 5);
    x.fillStyle = sil; x.lineWidth = 2; x.strokeStyle = sil;
    x.beginPath(); x.moveTo(246, gy); x.lineTo(256, gy - 64); x.lineTo(268, gy - 64); x.lineTo(278, gy); x.stroke(); for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(246 + k * 2.5, gy - k * 13); x.lineTo(278 - k * 2.5, gy - k * 13); x.stroke(); }
    x.beginPath(); x.arc(262, gy - 68, 7, 0, Math.PI * 2); x.stroke(); x.fillRect(296, gy - 74, 7, 74); box(282, 0, 30, 30);
  } else if (id === 'base') {
    house(16, 100, 30, 12); house(196, 100, 30, 12); house(124, 64, 36, 12); x.fillRect(158, gy - 72, 2, 36); x.fillStyle = 'rgba(150,40,30,.95)'; x.fillRect(160, gy - 72, 14, 9); x.fillStyle = sil;
    x.fillStyle = 'rgba(60,90,110,.85)'; x.fillRect(0, gy + 10, W, H - gy - 10);
  } else if (id === 'muelle') {
    x.fillStyle = sil; box(30, 0, 150, 22); x.fillRect(176, gy - 22, 18, 12); box(90, 22, 34, 18); x.fillRect(104, gy - 62, 10, 22); x.fillRect(60, gy - 66, 3, 44); x.fillRect(150, gy - 66, 3, 44);
    x.lineWidth = 3; x.strokeStyle = sil; x.beginPath(); x.moveTo(214, gy - 30); x.lineTo(244, gy - 62); x.stroke(); box(206, 0, 14, 34);
    x.fillStyle = 'rgba(232,228,214,.95)'; x.fillRect(286, gy - 66, 10, 66); x.fillStyle = 'rgba(255,220,140,.95)'; x.fillRect(285, gy - 72, 12, 6); x.fillStyle = sil;
    x.fillStyle = 'rgba(20,34,52,.9)'; x.fillRect(0, gy + 6, W, H - gy - 6);
  } else if (id === 'estacion') {
    box(20, 0, 110, 34); roof(20, 110, 34, 10); box(190, 0, 110, 34); roof(190, 110, 34, 10); box(130, 0, 60, 46); roof(130, 60, 46, 12);
    box(148, 46, 24, 30); x.beginPath(); x.moveTo(146, gy - 90); x.lineTo(160, gy - 108); x.lineTo(174, gy - 90); x.fill(); x.fillRect(146, gy - 92, 28, 16); clockAt(160, gy - 82, 7);
    x.fillStyle = 'rgba(30,30,32,.95)'; x.fillRect(30, gy - 10, 46, 10); x.beginPath(); x.arc(40, gy - 12, 6, 0, Math.PI * 2); x.fill(); x.fillRect(36, gy - 24, 4, 10);
  } else if (id === 'corcovado') {
    house(8, 30, 30); house(42, 26, 22); house(250, 30, 28); house(286, 28, 24);
    x.fillStyle = 'rgba(62,90,94,.95)'; x.fillRect(80, gy, 160, H - gy); x.fillStyle = sil;
    x.fillRect(74, gy - 14, 172, 6); x.lineWidth = 2; x.strokeStyle = sil; x.beginPath(); x.moveTo(74, gy - 34); x.lineTo(246, gy - 34);
    for (let k = 0; k <= 8; k++) { x.moveTo(74 + k * 21.5, gy - 8); x.lineTo(74 + k * 21.5, gy - 34); if (k < 8) { x.moveTo(74 + k * 21.5, gy - 8); x.lineTo(95.5 + k * 21.5, gy - 34); } }
    x.stroke(); x.fillRect(150, gy - 8, 20, 30);
  } else if (id === 'patio') {
    const cols = ['rgba(120,40,30,.92)', 'rgba(40,70,100,.92)', 'rgba(80,90,40,.92)', 'rgba(150,100,30,.92)'];
    for (let i = 0; i < 4; i++) { x.fillStyle = cols[i]; box(8 + i * 22, 0, 20, 22); box(16 + i * 22, 22, 20, 22); }
    for (let i = 0; i < 4; i++) { x.fillStyle = cols[(i + 2) % 4]; box(232 + i * 20, 0, 18, 22); }
    x.fillStyle = cols[1]; box(120, 0, 80, 24); x.fillStyle = sil; x.fillRect(128, gy - 32, 6, 8); x.fillRect(186, gy - 32, 6, 8);
    x.fillRect(110, gy - 4, 100, 4); x.fillRect(150, gy - 70, 3, 70); x.fillRect(145, gy - 70, 14, 3);
  } else if (id === 'bunker') {
    x.fillStyle = 'rgba(70,68,62,.95)'; box(70, 0, 180, 40); x.fillStyle = sil; x.fillRect(70, gy - 44, 180, 5);
    x.fillStyle = 'rgba(10,10,8,.9)'; for (let i = 0; i < 6; i++) x.fillRect(92 + i * 26, gy - 28, 14, 5);
    x.fillStyle = sil; x.fillRect(150, gy - 30, 22, 30);
    for (let i = 0; i < 5; i++) { box(8 + i * 12, 0, 10, 8); box(250 + i * 12, 0, 10, 8); }
    box(34, 8, 18, 10); box(270, 8, 18, 10);
  } else if (id === 'cruce') {
    x.fillStyle = 'rgba(220,228,236,.95)'; x.fillRect(0, gy, W, H - gy); x.fillStyle = sil;
    house(110, 70, 40, 14); x.fillStyle = 'rgba(230,236,242,.95)'; roof(110, 70, 40, 14); x.fillStyle = sil;
    for (const [a, h] of [[16, 40], [52, 30], [236, 44], [282, 34]]) { x.beginPath(); x.moveTo(a, gy - h); x.lineTo(a - 12, gy); x.lineTo(a + 12, gy); x.fill(); }
    x.fillStyle = 'rgba(176,42,34,.95)'; x.fillRect(196, gy - 18, 34, 3); x.fillStyle = sil; x.fillRect(194, gy - 20, 4, 20);
    x.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 60; i++) x.fillRect((i * 53) % W, (i * 29) % gy, 1.5, 1.5);
  }
  // luz/tono final
  x.fillStyle = 'rgba(0,0,0,.12)'; x.fillRect(0, 0, W, H);
  return (_thumbs[id] = c.toDataURL('image/png'));
}

