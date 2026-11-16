// ---- 12e_campaign.js ----
// =====================================================================
// CAMPAÑA · EL RELOJERO (v3.0.0, fase 0: cimientos)
// Datos declarativos de la campaña (Partes, misiones, cabeceras exactas
// de la novela), progreso guardado (Camp) con migración y Modo lector.
// Las misiones se describen aquí; el motor de escenas está en 12f_scenes.
// Fase 0: solo el interludio «El furgón I» es jugable; el resto de
// entradas existen como esqueleto («en construcción») y se rellenan en
// las fases siguientes. Las Partes que el jugador no ha leído no se
// muestran en ningún sitio (ni siquiera como «bloqueadas»).
// =====================================================================

// Partes de la novela. read = valor del Modo lector que hace visible la Parte.
const CAMP_PARTS = [
  { part: 0, read: 0, title: { es: 'Prólogo', en: 'Prologue' } },
  { part: 1, read: 1, title: { es: 'Parte I · Cuerda', en: 'Part I · Cuerda' } },
  { part: 2, read: 2, title: { es: 'Parte II · Tiple', en: 'Part II · Tiple' } },
  { part: 3, read: 3, title: { es: 'Parte III · Péndulo', en: 'Part III · Péndulo' } },
  { part: 4, read: 4, title: { es: 'Parte IV · Escape', en: 'Part IV · Escape' } },
  { part: 5, read: 5, title: { es: 'Parte V · La hora', en: 'Part V · La hora' } },
];
// opciones del Modo lector: «He leído hasta…» (6 = todo, incluido el epílogo)
const CAMP_READ_OPTS = [[1, { es: 'Parte I', en: 'Part I' }], [2, { es: 'Parte II', en: 'Part II' }], [3, { es: 'Parte III', en: 'Part III' }], [4, { es: 'Parte IV', en: 'Part IV' }], [5, { es: 'Parte V', en: 'Part V' }], [6, { es: 'Todo', en: 'All' }]];
const CAMP_READ_DEFAULT = 2;

// Misiones. type: 'I' interludio del furgón · 'J' jugable · 'E' escena.
// head = cabecera exacta del capítulo en la novela (lugar · fecha · hora).
// scene = id del guion en SCENES (12f); sin scene = aún en construcción (phase = versión prevista).
// Las Partes III–V se añaden en sus fases (no hay datos suyos en esta versión).
const CAMPAIGN = [
  { id: 'P0-I', part: 0, type: 'I', title: { es: 'El furgón', en: 'The Van' }, head: ['Carretera de la sierra de Ocoa', '17 de noviembre de 1945', '04:12'], map: 'furgon', scene: 'furgon1', phase: '3.0.0' },

  { id: 'P1-M1', part: 1, ch: 1, type: 'J', title: { es: 'Once relojes', en: 'Eleven Clocks' }, head: ['Villa Corcovado', 'sábado 7 de octubre de 1939', '06:40'], phase: '3.2.0' },
  { id: 'P1-M2', part: 1, ch: 2, type: 'J', title: { es: 'Escape', en: 'Escape' }, head: ['San Elías', 'lunes 9 de octubre de 1939', '08:05'], phase: '3.2.0' },
  { id: 'P1-M3', part: 1, ch: 3, type: 'J', title: { es: 'La mesa de tiro', en: 'The Firing Table' }, head: ['Cuartel de La Recoleta', 'San Elías', 'enero de 1940'], phase: '3.2.0' },
  { id: 'P1-M4', part: 1, ch: 4, type: 'J', title: { es: 'Cuarenta segundos', en: 'Forty Seconds' }, head: ['Estación Central de San Elías', 'sábado 17 de febrero de 1940', '10:15'], phase: '3.2.0' },
  { id: 'P1-E5', part: 1, ch: 5, type: 'E', title: { es: 'El hombre de la cera', en: 'The Man of Wax' }, head: ['San Elías', 'sábado 17 de febrero de 1940', '11:26'], phase: '3.2.0' },
  { id: 'P1-M6', part: 1, ch: 6, type: 'J', title: { es: 'Tiple', en: 'Tiple' }, head: ['Seminario de San Gregorio', 'sierra de Ocoa', 'viernes 1 de marzo de 1940', '09:48'], phase: '3.2.0' },

  { id: 'P2-I', part: 2, type: 'I', title: { es: 'El furgón · II', en: 'The Van · II' }, head: ['Carretera de la sierra de Ocoa', '17 de noviembre de 1945', '04:51'], phase: '3.3.0' },
  { id: 'P2-M7', part: 2, ch: 7, type: 'J', title: { es: 'Solfeo', en: 'Solfège' }, head: ['Seminario de San Gregorio', 'marzo – junio de 1940'], phase: '3.3.0' },
  { id: 'P2-M8', part: 2, ch: 8, type: 'J', title: { es: 'Tres días', en: 'Three Days' }, head: ['San Elías', 'lunes 1 de julio de 1940', '07:00'], phase: '3.3.0' },
  { id: 'P2-M9', part: 2, ch: 9, type: 'J', title: { es: 'La galería nueve', en: 'Gallery Nine' }, head: ['San Juan de las Minas', 'martes 16 de julio de 1940', '06:30'], phase: '3.3.0' },
  { id: 'P2-M10', part: 2, ch: 10, type: 'J', title: { es: 'La duodécima campanada', en: 'The Twelfth Chime' }, head: ['San Juan de las Minas', 'miércoles 17 de julio de 1940', '05:00'], phase: '3.3.0' },
  { id: 'P2-E11', part: 2, ch: 11, type: 'E', title: { es: 'Penitencia', en: 'Penance' }, head: ['Seminario de San Gregorio', 'agosto de 1940'], phase: '3.3.0' },
  { id: 'P2-M12', part: 2, ch: 12, type: 'J', title: { es: 'Paso de los Ciegos', en: 'Blind Men\'s Pass' }, head: ['Frontera de Tierra Alta', 'sierra de Ocoa', '3.840 metros', 'jueves 7 de noviembre de 1940', '02:10'], phase: '3.3.0' },
  { id: 'P2-E13', part: 2, ch: 13, type: 'E', title: { es: 'Lo que se queda dentro', en: 'What Stays Inside' }, head: ['Hospital de las Hermanas de la Caridad', 'Ocoa', 'noviembre de 1940'], phase: '3.3.0' },
  { id: 'P2-M14', part: 2, ch: 14, type: 'J', title: { es: 'Trece millas', en: 'Thirteen Miles' }, head: ['Seminario de San Gregorio', 'mayo de 1941'], phase: '3.3.0' },
  { id: 'P2-M15', part: 2, ch: 15, type: 'J', title: { es: 'Un hombre bueno', en: 'A Good Man' }, head: ['Cuartel de Tres Cruces', 'julio de 1941'], phase: '3.3.0' },
  { id: 'P2-M16', part: 2, ch: 16, type: 'J', title: { es: 'La cara raspada', en: 'The Scratched Face' }, head: ['Seminario de San Gregorio', 'septiembre de 1941'], phase: '3.3.0' },
];
const CAMP_BY_ID = Object.fromEntries(CAMPAIGN.map((m) => [m.id, m]));
const CAMP_TYPE = { I: { es: 'Interludio', en: 'Interlude' }, J: { es: 'Misión', en: 'Mission' }, E: { es: 'Escena', en: 'Scene' } };

MODES.campaign = { id: 'campaign', campaign: true, name: { es: 'Campaña · El Relojero', en: 'Campaign · WarTime' }, desc: { es: '', en: '' }, teams: false, respawn: false, time: Infinity, noAmbience: true };

// ---------------- progreso de campaña (guardado en cow.camp) ----------------
// { v, read, done: {id: {at, n}}, last, cp: {id: checkpoint}, notebook: [..], clocks: [..] }
const CAMP_V = 1;
const Camp = {
  _d: null,
  blank() { return { v: CAMP_V, read: CAMP_READ_DEFAULT, diff: 'recluta', done: {}, last: null, cp: {}, notebook: [], clocks: [] }; },
  // normaliza cualquier cosa guardada (o importada) a la forma actual: nunca rompe, nunca pierde lo válido
  sanitize(o) {
    const d = this.blank(), obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
    if (!obj(o)) return d;
    const r = Math.round(+o.read); if (r >= 1 && r <= 6) d.read = r;
    if (CONFIG.CAMP_DIFF[o.diff]) d.diff = o.diff;
    if (obj(o.done)) for (const k in o.done) if (CAMP_BY_ID[k] || /^P\d-[A-Z]+\d*[a-z]?$/.test(k)) d.done[k] = obj(o.done[k]) ? { at: +o.done[k].at || 0, n: Math.max(1, +o.done[k].n | 0) } : { at: 0, n: 1 };
    if (typeof o.last === 'string') d.last = o.last;
    if (obj(o.cp)) for (const k in o.cp) if (obj(o.cp[k])) d.cp[k] = o.cp[k];
    if (Array.isArray(o.notebook)) d.notebook = o.notebook.filter((x) => typeof x === 'string').slice(0, 400);
    if (Array.isArray(o.clocks)) d.clocks = o.clocks.filter(obj).slice(0, 200);
    return d;
  },
  data() { if (!this._d) { this.migrate(); this._d = this.sanitize(Store.get('camp', null)); } return this._d; },
  save() { Store.set('camp', this.data()); },
  // una sola vez al pasar a la 3.0: se crea el progreso de campaña sin tocar nada del multijugador
  // (rango, prestigio, armas, retos, récords y ajustes se conservan tal cual) y se apunta desde qué versión se vino
  migrate() {
    if (Store.get('mig300', false)) return;
    const had = Store.get('camp', null), prev = Store.get('lastVer', null) || (Store.get('settings', null) || Store.get('prog', null) ? '2.x' : null);
    if (!had) Store.set('camp', this.blank());
    Store.set('mig300', { from: prev, at: Date.now() });
    Store.set('lastVer', CONFIG.VERSION);
  },
  read() { return this.data().read; },
  // dificultad elegida (4 niveles; por defecto Recluta)
  diffId() { const k = this.data().diff; return CONFIG.CAMP_DIFF[k] ? k : 'recluta'; },
  diff() { return CONFIG.CAMP_DIFF[this.diffId()]; },
  setDiff(k) { if (!CONFIG.CAMP_DIFF[k]) return; this.data().diff = k; this.save(); },
  setRead(n) { const d = this.data(); d.read = clamp(Math.round(n), 1, 6); this.save(); },
  partVisible(p) { return p === 0 || p <= this.read(); },
  visibleParts() { return CAMP_PARTS.filter((P) => this.partVisible(P.part)); },
  visible(m) { return !!m && this.partVisible(m.part); },
  isDone(id) { return !!this.data().done[id]; },
  playable(m) { return !!(m && m.scene && SCENES[m.scene]); },
  complete(id) {
    const d = this.data(), e = d.done[id];
    d.done[id] = { at: Date.now(), n: e ? e.n + 1 : 1 }; d.last = id; delete d.cp[id];
    this.save(); BUS.emit('campDone', id);
  },
  // siguiente entrada jugable y visible sin completar (para «Continuar»)
  next() { return CAMPAIGN.find((m) => this.visible(m) && this.playable(m) && !this.isDone(m.id)) || null; },
  resetAll() { this._d = this.blank(); this._d.read = this.read(); this.save(); },
  // para el código de respaldo
  exportObj() { return JSON.parse(JSON.stringify(this.data())); },
  importObj(o) { this._d = this.sanitize(o); this.save(); },
};

// cabecera «lugar · fecha · hora» tal cual en la novela
function campHead(m) { return m.head.join(' · '); }

const Campaign = {
  cur: null,
  start(id) {
    const m = CAMP_BY_ID[id];
    if (!m || !Camp.visible(m)) return false;
    if (!Camp.playable(m)) { UI.toast(L({ es: 'En construcción · llega en la versión ', en: 'Under construction · coming in version ' }) + m.phase, 2600); return false; }
    this.cur = m;
    Camp.data().last = id; Camp.save();
    UI.launch({ mode: 'campaign', map: m.map || 'furgon', bots: 0, difficulty: Camp.diff().bot, team: 0, env: 'original', camp: id });
    Scenes.begin(SCENES[m.scene], m);
    return true;
  },
  // la misión llegó a su final canónico
  finish() {
    const m = this.cur; if (!m) return;
    Camp.complete(m.id);
    this.cur = null;
    UI.closeOverlay(); G.paused = false; Input.releaseLock(); Input.enabled = false;
    UI.startAttract(); UI.campFlash = m.id; UI.show('campaign');
  },
  // abandonar desde la pausa: vuelve al menú de campaña (el progreso a medias no cuenta)
  quit() { Scenes.stop(); this.cur = null; },
};
