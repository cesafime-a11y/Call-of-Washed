// ---- 02_input.js ----
// =====================================================================
// INPUT — objeto de input abstracto (teclado/mouse, gamepad, bot o red)
// =====================================================================
class InputState {
  constructor() { this.reset(); }
  reset() {
    this.mx = 0; this.mz = 0;            // movimiento deseado (x derecha, z adelante), -1..1
    this.yaw = 0; this.pitch = 0;        // mira absoluta
    this.jump = false; this.crouch = false; this.sprint = false; this.fire = false; this.aim = false; this.grenade = false;
    this.jumpCount = 0; this.fireCount = 0; this.reloadCount = 0; this.interactCount = 0; this.meleeCount = 0;
    this.slot = -1; this.slotCount = 0; this.cycleCount = 0; this.cycleDir = 1;
    this.tacticalCount = 0; this.streakCount = 0; this.prone = false; this.lean = 0;
  }
  copyFrom(o) { Object.assign(this, o); }
}

const DEFAULT_BINDINGS = {
  forward: ['KeyW', 'ArrowUp'], back: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'],
  jump: ['Space'], sprint: ['ShiftLeft'], crouch: ['KeyC'], reload: ['KeyR'], interact: ['KeyE'],
  melee: ['KeyF'], grenade: ['KeyG'], camera: ['KeyV'], shoulder: ['KeyQ'], scoreboard: ['Tab'], help: ['KeyH'],
  prone: ['KeyZ'], tactical: ['Digit4'], streak: ['Digit5'],
};
const BIND_ACTIONS = Object.keys(DEFAULT_BINDINGS);

const Input = {
  keys: new Set(),
  bindings: JSON.parse(JSON.stringify(DEFAULT_BINDINGS)),
  state: new InputState(),
  mouseL: false, mouseR: false,
  locked: false, lockFailed: false,
  enabled: false,           // true cuando controlamos un soldado
  remapAction: null, remapCb: null,
  gamepadOk: true, padPrev: {}, padSprint: false,
  holdT: { shoulder: 0, interact: 0 },   // toque = acción; mantener = asomarse
  canvas: null,
  sens: 1, adsSens: 0.8, invertY: false,

  init(canvas) {
    this.canvas = canvas;
    const kd = (e) => this.onKey(e, true), ku = (e) => this.onKey(e, false);
    window.addEventListener('keydown', kd, { passive: false });
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', () => { this.keys.clear(); this.mouseL = this.mouseR = false; this.holdT.shoulder = this.holdT.interact = 0; this.syncHeld(); BUS.emit('blur'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) BUS.emit('blur'); });
    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      this.userGesture = true;
      if (!this.locked && !this.lockFailed) { this.requestLock(); }
      if (e.button === 0) { this.mouseL = true; this.state.fireCount++; }
      if (e.button === 2) this.mouseR = true;
      this.syncHeld();
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouseL = false; if (e.button === 2) this.mouseR = false; this.syncHeld(); });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (!this.locked && !(this.lockFailed && (this.mouseL || this.mouseR || e.buttons))) return;
      this.look(e.movementX || 0, e.movementY || 0);
    });
    canvas.addEventListener('wheel', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      this.state.cycleDir = e.deltaY > 0 ? 1 : -1; this.state.cycleCount++;
    }, { passive: false });
    document.addEventListener('pointerlockchange', () => {
      const was = this.locked;
      this.locked = document.pointerLockElement === canvas;
      if (was && !this.locked) BUS.emit('lockLost');
    });
    document.addEventListener('pointerlockerror', () => this.onLockError());
  },

  requestLock() {
    if (!this.canvas || this.locked || window.__COW_TEST) return;
    if (!this.canvas.requestPointerLock) { this.lockFailed = true; return; }
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => this.onLockError());
    } catch (e) { this.onLockError(); }
  },
  // sin gesto del usuario el bloqueo falla: esperar un clic; tras varios fallos, usar arrastrar para mirar
  onLockError() { this.lockErrors = (this.lockErrors || 0) + 1; if (this.lockErrors >= 3 && this.userGesture) this.lockFailed = true; },
  releaseLock() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { } },

  look(dx, dy) {
    const k = 0.0022 * this.sens * (G.aimZoomSens || 1);
    const s = this.state;
    s.yaw -= dx * k;
    s.pitch -= dy * k * (this.invertY ? -1 : 1);
    s.pitch = clamp(s.pitch, -1.45, 1.45);
  },

  is(action) { const b = this.bindings[action]; if (!b) return false; for (const c of b) if (this.keys.has(c)) return true; return false; },
  matches(action, code) { const b = this.bindings[action]; return !!b && b.includes(code); },

  onKey(e, down) {
    const code = e.code;
    if (this.remapAction && down) {
      e.preventDefault();
      if (code !== 'Escape') { this.bindings[this.remapAction] = [code]; }
      const cb = this.remapCb; this.remapAction = null; this.remapCb = null; cb && cb(code);
      return;
    }
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (code === 'F1') { e.preventDefault(); if (down) BUS.emit('toggleTuning'); return; }
    if (code === 'Escape') { if (down) BUS.emit('escape'); return; }
    if (this.enabled && (code === 'Tab' || code === 'Space' || code.startsWith('Arrow') || this.matches('crouch', code) || this.matches('sprint', code))) e.preventDefault();
    if (down) this.keys.add(code); else this.keys.delete(code);
    if (down && !e.repeat) {
      const s = this.state;
      if (this.matches('jump', code)) s.jumpCount++;
      if (this.matches('reload', code)) s.reloadCount++;
      if (this.matches('interact', code)) this.holdT.interact = performance.now();
      if (this.matches('shoulder', code)) this.holdT.shoulder = performance.now();
      if (this.matches('melee', code)) s.meleeCount++;
      if (this.matches('camera', code)) BUS.emit('toggleCamera');
      if (this.matches('help', code)) BUS.emit('toggleHelp');
      if (this.matches('prone', code)) s.prone = !s.prone;
      if (this.matches('jump', code) || this.matches('sprint', code) || this.matches('crouch', code)) s.prone = false;
      if (this.matches('tactical', code)) s.tacticalCount++;
      if (this.matches('streak', code)) s.streakCount++;
      if (code === 'BracketLeft' || code === 'BracketRight') BUS.emit('rangeCls', code === 'BracketLeft' ? -1 : 1);
      if (code.startsWith('Digit')) { const n = +code.slice(5); BUS.emit('digit', n); if (n >= 1 && n <= 3) { s.slot = n; s.slotCount++; } }
    }
    if (!down) {
      // toque corto: cambiar hombro / recoger; si se mantuvo, era asomarse
      const now = performance.now(), s = this.state;
      if (this.matches('shoulder', code) && this.holdT.shoulder) { if (now - this.holdT.shoulder < 220) BUS.emit('swapShoulder'); this.holdT.shoulder = 0; }
      if (this.matches('interact', code) && this.holdT.interact) { if (now - this.holdT.interact < 220) s.interactCount++; this.holdT.interact = 0; }
    }
    if (this.matches('scoreboard', code)) BUS.emit('scoreboard', down);
    this.syncHeld();
  },

  syncHeld() {
    const s = this.state;
    s.jump = this.is('jump');
    s.crouch = this.is('crouch');
    s.sprint = this.is('sprint');
    s.grenade = this.is('grenade');
    const now = performance.now(); let lean = 0;
    if (this.holdT.shoulder && now - this.holdT.shoulder > 170 && this.is('shoulder')) lean -= 1;
    if (this.holdT.interact && now - this.holdT.interact > 170 && this.is('interact')) lean += 1;
    s.lean = lean;
    s.fire = this.mouseL;
    s.aim = this.mouseR;
    const f = (this.is('forward') ? 1 : 0) - (this.is('back') ? 1 : 0);
    const r = (this.is('right') ? 1 : 0) - (this.is('left') ? 1 : 0);
    s.mx = r; s.mz = f;
  },

  // gamepad (opcional, protegido por try/catch para iframes)
  pollGamepad(dt) {
    if (!this.gamepadOk || !this.enabled) return;
    let pads;
    try { pads = navigator.getGamepads ? navigator.getGamepads() : null; } catch (e) { this.gamepadOk = false; return; }
    if (!pads) return;
    const gp = [...pads].find((p) => p && p.connected);
    if (!gp) return;
    const s = this.state, dz = (v) => (Math.abs(v) < 0.18 ? 0 : (v - Math.sign(v) * 0.18) / 0.82);
    const ax = gp.axes || [];
    const lx = dz(ax[0] || 0), ly = dz(ax[1] || 0), rx = dz(ax[2] || 0), ry = dz(ax[3] || 0);
    const b = (i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));
    const edge = (i) => { const v = b(i), p = this.padPrev[i]; this.padPrev[i] = v; return v && !p; };
    if (lx || ly) { s.mx = clamp(s.mx + lx, -1, 1); s.mz = clamp(s.mz - ly, -1, 1); }
    const zs = G.aimZoomSens || 1;
    if (rx || ry) { s.yaw -= rx * 3.1 * dt * this.sens * zs; s.pitch = clamp(s.pitch - ry * 2.3 * dt * this.sens * zs * (this.invertY ? -1 : 1), -1.45, 1.45); }
    if (b(0)) s.jump = true; if (edge(0)) s.jumpCount++;
    if (b(1)) s.crouch = true;
    if (edge(2)) { s.reloadCount++; s.interactCount++; }
    if (edge(3)) { s.cycleDir = 1; s.cycleCount++; }
    if (edge(10)) this.padSprint = !this.padSprint;
    if (ly > -0.4) this.padSprint = false;
    if (this.padSprint) s.sprint = true;
    if (edge(11)) s.meleeCount++;
    if (b(4)) s.grenade = true;
    if (edge(5)) BUS.emit('swapShoulder');
    if (edge(13)) s.prone = !s.prone;            // cruceta abajo: tumbarse
    if (edge(14)) s.tacticalCount++;             // cruceta izquierda: humo
    if (edge(12)) s.streakCount++;               // cruceta arriba: racha
    const rt = gp.buttons[7] && gp.buttons[7].value > 0.4, lt = gp.buttons[6] && gp.buttons[6].value > 0.4;
    if (rt) { if (!this.padPrev.rt) s.fireCount++; s.fire = true; }
    this.padPrev.rt = rt;
    if (lt) s.aim = true;
    if (edge(9)) BUS.emit('escape');
    if (edge(8)) BUS.emit('toggleCamera');
  },

  saveBindings() { const st = G.settings; st.bindings = this.bindings; saveSettings(); },
  loadBindings(b) {
    this.bindings = JSON.parse(JSON.stringify(DEFAULT_BINDINGS));
    if (b) for (const k of BIND_ACTIONS) if (Array.isArray(b[k]) && b[k].length) this.bindings[k] = b[k].slice(0, 2);
  },
  keyName(code) {
    if (!code) return '—';
    const es = LANG !== 'en';
    const arrows = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' };
    if (arrows[code]) return arrows[code];
    return code.replace(/^Key/, '').replace(/^Digit/, '').replace('ShiftLeft', es ? 'Shift Izq' : 'Left Shift').replace('ShiftRight', es ? 'Shift Der' : 'Right Shift')
      .replace('ControlLeft', 'Ctrl').replace('Left', es ? ' Izq' : ' Left').replace('Right', es ? ' Der' : ' Right').replace('Space', es ? 'Espacio' : 'Space');
  },
};

