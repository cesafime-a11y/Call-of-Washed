// ---- 16_audio.js ----
// =====================================================================
// AUDIO — sonido sintetizado (Web Audio): disparos graves con cola y eco
// según el espacio (interior/exterior), pasos según la superficie, granadas,
// balas que zumban, ambiente de batalla lejana y música solo en el menú
// =====================================================================
const AUDIO = {
  ctx: null, ok: false, master: null, musicGain: null, sfxGain: null, noise: null, rev: null, revGain: null, echo: null, echoGain: null,
  lp: new THREE.Vector3(), lr: new THREE.Vector3(1, 0, 0), last: {}, voices: 0, indoor: 0, _envT: 0,
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = new AC(); this.ctx = c;
      const comp = c.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 5; comp.attack.value = 0.002; comp.release.value = 0.25;
      this.master = c.createGain(); this.master.connect(comp); comp.connect(c.destination);
      this.musicGain = c.createGain(); this.musicGain.connect(this.master);
      this.sfxGain = c.createGain(); this.sfxGain.connect(this.master);
      const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noise = buf;
      // reverberación (impulso sintético) y eco exterior
      const ir = c.createBuffer(2, c.sampleRate * 1.8, c.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const a = ir.getChannelData(ch); for (let i = 0; i < a.length; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / a.length, 3.2); }
      this.rev = c.createConvolver(); this.rev.buffer = ir; this.revGain = c.createGain(); this.revGain.gain.value = 0.25;
      this.rev.connect(this.revGain); this.revGain.connect(this.sfxGain);
      this.echo = c.createDelay(1); this.echo.delayTime.value = 0.21; const fb = c.createGain(); fb.gain.value = 0.28; const ef = c.createBiquadFilter(); ef.type = 'lowpass'; ef.frequency.value = 1500;
      this.echoGain = c.createGain(); this.echoGain.gain.value = 0.22;
      this.echo.connect(ef); ef.connect(fb); fb.connect(this.echo); ef.connect(this.echoGain); this.echoGain.connect(this.sfxGain);
      this.ok = true;
      this.setVolumes();
      if (G.attract && !Music.playing) Music.start(7, 'menu');
    } catch (e) { this.ok = false; }
  },
  resume() { try { if (!this.ctx) this.init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); } catch (e) { } },
  setVolumes() { if (!this.ok) return; const s = G.settings; this.master.gain.value = s.master; this.musicGain.gain.value = s.music * 0.5; this.sfxGain.gain.value = s.sfx; },
  setListener(cam) {
    this.lp.copy(cam.position); this.lr.set(1, 0, 0).applyQuaternion(cam.quaternion);
    this._envT -= 1 / 60;
    if (this.ok && this._envT <= 0) {
      this._envT = 0.4;
      // ¿techo encima? → interior: más reverberación, menos eco
      const h = PHYS.raycast(_v1.copy(cam.position), _v2.set(0, 1, 0), 9, PHYS._losOut);
      this.indoor = damp(this.indoor, h ? 1 : 0, 6, 0.4);
      const t = this.ctx.currentTime;
      this.revGain.gain.setTargetAtTime(0.16 + this.indoor * 0.34, t, 0.3);
      this.echoGain.gain.setTargetAtTime(0.24 * (1 - this.indoor), t, 0.3);
    }
  },
  // salida con paneo, atenuación y filtro de distancia
  out(pos, vol = 1, wet = 0) {
    const c = this.ctx, g = c.createGain();
    let v = vol, pan = 0, d = 0;
    if (pos) {
      d = this.lp.distanceTo(pos);
      v *= 1 / Math.pow(1 + d / 12, 1.15);
      if (d > 0.5) pan = clamp(_v8.copy(pos).sub(this.lp).normalize().dot(this.lr), -1, 1) * 0.75;
    }
    if (v < 0.006) return null;
    g.gain.value = v;
    let node = g;
    if (d > 18) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = clamp(14000 / (1 + (d - 18) / 14), 700, 14000); g.connect(f); node = f; }
    if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; node.connect(p); p.connect(this.sfxGain); if (wet && v > 0.04) { const w = c.createGain(); w.gain.value = wet * (1 + d / 40); p.connect(w); w.connect(this.rev); w.connect(this.echo); } }
    else node.connect(this.sfxGain);
    return g;
  },
  osc(dest, type, f0, f1, t, dur, vol, att = 0.004) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  },
  nz(dest, t, dur, vol, ftype = 'lowpass', f0 = 2000, f1, Q = 0.8, att = 0.002) {
    const c = this.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise; s.playbackRate.value = 0.85 + Math.random() * 0.3;
    f.type = ftype; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur); f.Q.value = Q;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(dest); s.start(t, Math.random() * 1.2); s.stop(t + dur + 0.05);
  },
  // disparo: transitorio + cuerpo + golpe grave + cola
  gun(o, t, P) {
    // 3.4.0: de lejos el fogonazo llega antes que el estampido (340 m/s) y el valle devuelve el disparo en dos o tres ecos
    const d = this._d || 0;
    if (d > 45) { t += Math.min(2.4, d / 340); P = { ...P, crack: P.crack * 0.55, crackF: (P.crackF || 3000) * 0.6, bodyF: P.bodyF * clamp(1 - d / 900, 0.35, 1) }; }
    if (!this.indoor || this.indoor < 0.5) { const n = d > 200 ? 3 : 2; for (let i = 0; i < n; i++) this.nz(o, t + 0.32 + i * (0.41 + i * 0.17) + d / 2200, 0.5 + i * 0.25, (P.tailV || 0.2) * (0.5 - i * 0.12), 'lowpass', 700 - i * 160, 140, 0.5, 0.05); }
    // culatazo grave con un poco de saturación (pólvora de la época: más humo, más golpe)
    if (P.thumpV > 0.6) this.osc(o, 'triangle', P.thumpF * 0.55, P.thumpF * 0.25, t, P.thumpD * 1.6, P.thumpV * 0.25);
    this.nz(o, t, 0.025, P.crack, 'highpass', P.crackF || 3000);
    this.nz(o, t, P.body, P.bodyV, 'lowpass', P.bodyF, P.bodyF * 0.25, 0.7);
    this.osc(o, 'sine', P.thumpF, P.thumpF * 0.35, t, P.thumpD, P.thumpV);
    if (P.tail) this.nz(o, t + 0.03, P.tail, P.tailV, 'lowpass', 900, 160, 0.5, 0.03);
  },
  // corneta: notas con ataque de labio, vibrato leve y timbre de latón (diente de sierra filtrado)
  bugle(dest, t, notes, vol = 0.1) {
    const c = this.ctx; let tt = t;
    for (const [f, d] of notes) {
      const os = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      os.type = 'sawtooth'; o2.type = 'triangle'; os.frequency.setValueAtTime(f * 0.97, tt); os.frequency.exponentialRampToValueAtTime(f, tt + 0.04); o2.frequency.value = f * 2;
      lfo.frequency.value = 5.2; lg.gain.value = f * 0.004; lfo.connect(lg); lg.connect(os.frequency);
      fl.type = 'lowpass'; fl.frequency.setValueAtTime(900, tt); fl.frequency.exponentialRampToValueAtTime(2600, tt + 0.06); fl.Q.value = 1.4;
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vol, tt + 0.035); g.gain.setValueAtTime(vol * 0.85, tt + Math.max(0.05, d - 0.06)); g.gain.exponentialRampToValueAtTime(0.0001, tt + d + 0.08);
      const g2 = c.createGain(); g2.gain.value = 0.25; os.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(dest);
      os.start(tt); o2.start(tt); lfo.start(tt); os.stop(tt + d + 0.12); o2.stop(tt + d + 0.12); lfo.stop(tt + d + 0.12);
      tt += d + 0.03;
    }
  },
  brass(dest, t, f, vol = 0.06) { for (const [k, g, d] of [[1, 1, 1.1], [2.76, 0.4, 0.5], [5.4, 0.18, 0.25]]) this.osc(dest, 'sine', f * k, f * k * 0.998, t, d, vol * g, 0.002); },
  play(name, pos, vol = 1, opt = {}) {
    if (!this.ok || this.ctx.state !== 'running') return;
    const nowT = this.ctx.currentTime;
    const thr = opt.throttle ?? 0.02;
    if (this.last[name] && nowT - this.last[name] < thr) return;
    // presupuesto de voces: con muchos disparos a la vez cada sonido crea 5-8 nodos + reverberación; al pasarse de la CPU el audio se entrecorta.
    // Ventana de 0.3 s: lo lejano y flojo se descarta primero, y pasado el tope solo entra lo cercano y fuerte.
    const win = this.win || (this.win = []);
    while (win.length && nowT - win[0] > 0.3) win.shift();
    const loud = vol / (pos ? Math.pow(1 + this.lp.distanceTo(pos) / 12, 1.15) : 1);
    if (win.length >= 10 && loud < 0.5) return;
    if (win.length >= 18 && loud < 0.9) return;
    if (win.length >= 26) return;
    win.push(nowT);
    this.last[name] = nowT;
    const wet = { kal: 0.55, pdw: 0.4, dmr: 0.7, lmg: 0.55, magnum: 0.55, rifle: 0.5, smg: 0.45, shotgun: 0.55, sniper: 0.7, pistol: 0.4, rocket: 0.5, explosion: 0.8, nadeBounce: 0.2, break: 0.4, supp: 0.12, jet: 0.5, whistle: 0.2, smoke: 0.15 }[name] || 0;
    this._d = pos ? this.lp.distanceTo(pos) : 0;
    const o = this.out(pos, vol, wet); if (!o) return;
    const t = nowT + 0.004, p = opt.pitch || 1, r = (a, b) => a + Math.random() * (b - a);
    switch (name) {
      case 'rifle': this.gun(o, t, { crack: 0.9, crackF: 3200, body: 0.16, bodyV: 0.85, bodyF: 2600 * p, thumpF: 150, thumpD: 0.12, thumpV: 0.7, tail: 0.7, tailV: 0.22 }); break;
      case 'smg': this.gun(o, t, { crack: 0.65, crackF: 3800, body: 0.1, bodyV: 0.65, bodyF: 3200 * p, thumpF: 170, thumpD: 0.08, thumpV: 0.45, tail: 0.45, tailV: 0.14 }); break;
      case 'pistol': this.gun(o, t, { crack: 0.7, crackF: 3600, body: 0.09, bodyV: 0.6, bodyF: 2900 * p, thumpF: 190, thumpD: 0.07, thumpV: 0.4, tail: 0.4, tailV: 0.12 }); break;
      case 'kal': this.gun(o, t, { crack: 1.0, crackF: 2700, body: 0.2, bodyV: 0.95, bodyF: 2100 * p, thumpF: 120, thumpD: 0.15, thumpV: 0.85, tail: 0.85, tailV: 0.26 }); break;
      case 'pdw': this.gun(o, t, { crack: 0.55, crackF: 4300, body: 0.08, bodyV: 0.55, bodyF: 3600 * p, thumpF: 200, thumpD: 0.06, thumpV: 0.35, tail: 0.35, tailV: 0.11 }); break;
      case 'rifle2': case 'dmr': this.gun(o, t, { crack: 1.0, crackF: 2900, body: 0.22, bodyV: 1.0, bodyF: 2300 * p, thumpF: 120, thumpD: 0.18, thumpV: 0.9, tail: 1.2, tailV: 0.3 }); this.nz(o, t + 0.2, 0.04, 0.15, 'bandpass', 2000, 0, 4); break;
      case 'lmg': this.gun(o, t, { crack: 0.95, crackF: 2500, body: 0.18, bodyV: 0.9, bodyF: 1900 * p, thumpF: 105, thumpD: 0.16, thumpV: 0.95, tail: 0.9, tailV: 0.28 }); break;
      case 'magnum': this.gun(o, t, { crack: 1.0, crackF: 2300, body: 0.26, bodyV: 1.0, bodyF: 1700 * p, thumpF: 100, thumpD: 0.22, thumpV: 1.0, tail: 1.1, tailV: 0.3 }); break;
      case 'shotgun': this.gun(o, t, { crack: 0.8, crackF: 2400, body: 0.32, bodyV: 1.0, bodyF: 1800 * p, thumpF: 95, thumpD: 0.22, thumpV: 0.95, tail: 1.0, tailV: 0.3 }); this.nz(o, t + 0.45, 0.06, 0.25, 'bandpass', 1400, 0, 3); this.nz(o, t + 0.58, 0.05, 0.25, 'bandpass', 900, 0, 3); break;
      case 'sniper': this.gun(o, t, { crack: 1.0, crackF: 2600, body: 0.3, bodyV: 1.0, bodyF: 2200 * p, thumpF: 110, thumpD: 0.25, thumpV: 1.0, tail: 1.6, tailV: 0.32 }); this.nz(o, t + 0.75, 0.05, 0.22, 'bandpass', 2200, 0, 4); this.nz(o, t + 0.9, 0.06, 0.2, 'bandpass', 1500, 0, 4); break;
      // disparo con silenciador: golpe seco y mecánico, casi sin cola
      case 'supp': { const k = opt.k || 'rifle', hi = k === 'sniper' ? 0.8 : k === 'smg' ? 1.15 : 1; this.nz(o, t, 0.05, 0.38, 'bandpass', 1500 * hi, 600, 1.2, 0.002); this.nz(o, t, 0.02, 0.22, 'highpass', 4200 * hi); this.osc(o, 'sine', 220 * hi, 90, t, 0.05, 0.22); this.nz(o, t + 0.03, 0.04, 0.12, 'bandpass', 2600, 0, 4); break; }
      case 'smoke': this.nz(o, t, 0.05, 0.35, 'highpass', 2500); this.nz(o, t + 0.04, 2.6, 0.28, 'highpass', 2200, 4200, 0.6, 0.15); this.nz(o, t + 0.04, 1.8, 0.12, 'bandpass', 900, 500, 0.8, 0.2); break;
      case 'whistle': this.osc(o, 'sine', 1900, 600, t, 1.05, 0.09, 0.15); this.nz(o, t, 1.05, 0.06, 'bandpass', 1500, 500, 6, 0.2); break;
      case 'jet': { // pasada de bombardero de hélice: zumbido grave de dos motores que crece y se aleja
        this.nz(o, t, 6.5, 0.5, 'lowpass', 260, 520, 0.8, 2.6); this.osc(o, 'sawtooth', 78, 70, t + 0.4, 5.6, 0.07, 2.2); this.osc(o, 'sawtooth', 83, 74, t + 0.4, 5.6, 0.06, 2.2); this.osc(o, 'square', 39, 36, t + 0.6, 5.2, 0.04, 2.2); break; }
      // teléfono de campaña: timbre de magneto y clic de horquilla
      case 'radio': for (let i = 0; i < 6; i++) { this.osc(o, 'square', 880, 860, t + i * 0.045, 0.035, 0.03); this.nz(o, t + i * 0.045, 0.02, 0.06, 'bandpass', 3400, 0, 6); } this.nz(o, t + 0.34, 0.03, 0.18, 'bandpass', 1700, 0, 3); break;
      // sirena de manivela que sube y baja
      case 'alarm': { const c = this.ctx, os = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); os.type = 'sawtooth'; os.frequency.setValueAtTime(260, t); os.frequency.exponentialRampToValueAtTime(760, t + 0.9); os.frequency.exponentialRampToValueAtTime(420, t + 1.7);
        f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8); os.connect(f); f.connect(g); g.connect(o); os.start(t); os.stop(t + 1.85); break; }
      case 'streak': this.bugle(o, t, [[392, 0.1], [523, 0.1], [659, 0.32]], 0.1); break;
      case 'prone': this.nz(o, t, 0.25, 0.28, 'lowpass', 900, 250, 0.8, 0.03); this.osc(o, 'sine', 95, 50, t + 0.18, 0.12, 0.25); break;
      case 'rocket': this.nz(o, t, 0.5, 0.8, 'bandpass', 300, 2400, 1.5, 0.01); this.osc(o, 'sine', 90, 40, t, 0.3, 0.8); this.nz(o, t + 0.05, 1.2, 0.35, 'lowpass', 900, 200, 0.6, 0.05); break;
      case 'explosion':
        this.nz(o, t, 0.06, 1.0, 'highpass', 1500); this.nz(o, t, 1.8, 1.0, 'lowpass', 2200, 70, 0.7, 0.004); this.osc(o, 'sine', 70, 24, t, 1.3, 1.0); this.osc(o, 'triangle', 140, 40, t, 0.5, 0.5);
        this.nz(o, t + 0.25, 1.6, 0.18, 'highpass', 3000, 6000, 0.5, 0.2); break; // escombros cayendo
      case 'knife': case 'swing': this.nz(o, t, 0.18, 0.4, 'bandpass', 600, 2400, 2.5, 0.03); break;
      case 'stab': this.nz(o, t, 0.08, 0.6, 'lowpass', 900, 200); this.osc(o, 'sine', 180, 60, t, 0.08, 0.5); break;
      case 'knifeWall': this.nz(o, t, 0.04, 0.5, 'highpass', 3000); this.osc(o, 'triangle', 2400, 1800, t, 0.12, 0.12); break;
      case 'hit': this.nz(o, t, 0.07, 0.55, 'lowpass', 1100, 250); this.osc(o, 'sine', 130, 60, t, 0.08, 0.45); break;
      // impactos: un tic seco con golpe grave; cabeza = campanilla; pared = metálico; explosión = golpe sordo
      // 3.4.0: impactos de época: golpe seco de tela y carne (sin pitido electrónico); la cabeza, un chasquido de casco
      case 'hitmark': { const q = opt.pitch || 1; this.nz(o, t, 0.06, 0.32, 'lowpass', 1300 * q, 300, 0.9); this.osc(o, 'sine', 210 * q, 90, t, 0.07, 0.2); this.nz(o, t, 0.012, 0.08, 'bandpass', 2600 * q, 0, 2); break; }
      case 'headshot': this.nz(o, t, 0.02, 0.22, 'bandpass', 3200, 0, 3); this.osc(o, 'triangle', 1480, 1320, t, 0.09, 0.05); this.osc(o, 'sine', 240, 100, t, 0.08, 0.22); this.nz(o, t + 0.01, 0.07, 0.2, 'lowpass', 900, 250); break;
      case 'hitpen': this.osc(o, 'sawtooth', 1150, 850, t, 0.06, 0.05); this.osc(o, 'sine', 1650, 1500, t, 0.12, 0.07); this.nz(o, t, 0.05, 0.22, 'bandpass', 2200, 0, 2.5); this.osc(o, 'sine', 260, 130, t, 0.07, 0.14); break;
      case 'hitboom': this.osc(o, 'sine', 190, 80, t, 0.12, 0.28); this.nz(o, t, 0.09, 0.28, 'lowpass', 1000, 300); this.osc(o, 'triangle', 900, 700, t, 0.05, 0.05); break;
      // baja: el cuerpo que cae lejos y un golpe de tambor apagado (no una campanilla)
      case 'killconfirm': this.osc(o, 'sine', 120, 52, t, 0.22, 0.32); this.nz(o, t, 0.14, 0.22, 'lowpass', 700, 160, 0.8); this.nz(o, t + 0.02, 0.05, 0.1, 'bandpass', 1500, 0, 1.5); break;
      case 'killhead': this.osc(o, 'sine', 130, 50, t, 0.26, 0.34); this.nz(o, t, 0.16, 0.24, 'lowpass', 800, 160, 0.8); this.nz(o, t, 0.02, 0.16, 'bandpass', 3000, 0, 3); this.osc(o, 'triangle', 1480, 1300, t, 0.1, 0.04); break;
      // ascenso: toque de corneta (cuatro notas de la serie natural)
      case 'levelup': this.bugle(o, t, [[392, 0.16], [523, 0.16], [659, 0.16], [784, 0.6]], 0.12); break;
      case 'camo': this.bugle(o, t, [[523, 0.12], [659, 0.12], [784, 0.4]], 0.1); break;
      case 'whiz': this.nz(o, t, 0.12, 0.5, 'bandpass', r(2500, 4000), r(1200, 1800), 6, 0.01); this.nz(o, t, 0.02, 0.35, 'highpass', 6000); break;
      case 'ric': this.osc(o, 'sine', r(2600, 3600), r(1200, 1800), t, 0.25, 0.1); break;
      case 'impact': this.nz(o, t, 0.05, 0.3, 'bandpass', opt.f || 1800, 0, 1.5); break;
      case 'reload': {
        const k = opt.k || 'rifle', D = clamp(opt.T || 1.8, 0.7, 5), tac = !!opt.tac, at = (f) => t + D * f;
        if (k === 'shotgun' || k === 'hammer') { // cartuchos uno a uno y bombeo final
          const n = Math.max(2, Math.round(D / 0.42));
          for (let i = 0; i < n; i++) { const tt = at(0.08 + 0.7 * i / n); this.nz(o, tt, 0.04, 0.3, 'bandpass', 1500, 0, 3); this.osc(o, 'triangle', 880, 640, tt, 0.05, 0.07); this.osc(o, 'sine', 170, 90, tt + 0.02, 0.05, 0.12); }
          this.nz(o, at(0.84), 0.06, 0.4, 'bandpass', 1300, 0, 3); this.nz(o, at(0.92), 0.05, 0.4, 'bandpass', 1800, 0, 4); this.osc(o, 'square', 300, 220, at(0.92), 0.04, 0.06);
          break;
        }
        this.nz(o, at(0.04), 0.04, 0.35, 'bandpass', 1800, 0, 3); this.osc(o, 'square', 420, 380, at(0.04), 0.03, 0.05); // suelta el cargador
        this.nz(o, at(0.16), 0.12, 0.14, 'bandpass', 900, 500, 1.2, 0.02); // roce al sacarlo
        this.nz(o, at(0.5), 0.07, 0.4, 'lowpass', 700, 0, 0.8); this.osc(o, 'sine', 150, 80, at(0.5), 0.08, 0.3); this.nz(o, at(0.5), 0.04, 0.3, 'bandpass', 1300, 0, 3); // entra el cargador
        this.nz(o, at(0.57), 0.03, 0.35, 'highpass', 3500); // asiento
        if (k === 'sniper') { [0.74, 0.8, 0.9, 0.96].forEach((f, i) => { this.nz(o, at(f), 0.05, 0.4, 'bandpass', i % 2 ? 1500 : 2300, 0, 4); this.osc(o, 'square', i % 2 ? 260 : 340, 200, at(f), 0.04, 0.05); }); }
        else if (!tac) { // amartillar: tirar y soltar la corredera
          this.nz(o, at(0.8), 0.05, 0.4, 'bandpass', 2200, 0, 4); this.nz(o, at(0.89), 0.04, 0.45, 'bandpass', 1600, 0, 4); this.osc(o, 'square', 300, 220, at(0.89), 0.04, 0.06);
        }
        break;
      }
      case 'bolt': { const k = opt.k === 'sniper' ? 0.92 : 1;
        this.nz(o, t, 0.035, 0.3, 'bandpass', 1900 * k, 0, 4); this.osc(o, 'square', 520 * k, 380, t, 0.025, 0.035);
        this.nz(o, t + 0.11, 0.09, 0.26, 'bandpass', 1300 * k, 2100 * k, 2.2, 0.01); this.nz(o, t + 0.14, 0.03, 0.18, 'highpass', 4200);
        this.nz(o, t + 0.3, 0.07, 0.3, 'bandpass', 1500 * k, 900, 2.4, 0.005); this.osc(o, 'sine', 240, 140, t + 0.36, 0.05, 0.12);
        this.nz(o, t + 0.43, 0.03, 0.34, 'bandpass', 2300 * k, 0, 5); this.osc(o, 'square', 330, 260, t + 0.43, 0.03, 0.04); break; }
      case 'dry': this.nz(o, t, 0.02, 0.3, 'highpass', 4000); this.osc(o, 'square', 1800, 1700, t, 0.015, 0.05); break;
      case 'pin': this.nz(o, t, 0.03, 0.35, 'highpass', 5000); this.osc(o, 'triangle', 3200, 2800, t + 0.03, 0.1, 0.08); break;
      case 'throw': this.nz(o, t, 0.3, 0.3, 'bandpass', 400, 1600, 2, 0.05); break;
      case 'nadeBounce': this.osc(o, 'triangle', r(1100, 1500), r(700, 900), t, 0.1, 0.25); this.nz(o, t, 0.03, 0.3, 'bandpass', 2500, 0, 3); break;
      case 'casing': this.osc(o, 'sine', r(3600, 4800), r(3000, 3500), t, 0.08, 0.06); this.osc(o, 'sine', r(5200, 6000), r(4200, 4800), t + 0.05, 0.05, 0.03); break;
      case 'step': {
        const s = opt.surface || 'concrete';
        if (s === 'dirt') { this.nz(o, t, 0.09, 0.32, 'lowpass', r(700, 1000), 300, 0.7); this.nz(o, t + 0.02, 0.06, 0.1, 'highpass', 3000); }
        else if (s === 'sand') this.nz(o, t, 0.12, 0.28, 'bandpass', r(1500, 2500), 900, 0.9, 0.01);
        else if (s === 'metal') { this.nz(o, t, 0.04, 0.3, 'bandpass', r(900, 1300), 0, 2); this.osc(o, 'triangle', r(320, 420), 250, t, 0.12, 0.08); }
        else if (s === 'wood') { this.nz(o, t, 0.06, 0.35, 'lowpass', r(600, 900), 200, 0.8); this.osc(o, 'sine', r(140, 180), 90, t, 0.06, 0.15); }
        else { this.nz(o, t, 0.05, 0.32, 'bandpass', r(1200, 1900), 0, 1.4); this.nz(o, t, 0.03, 0.12, 'highpass', 4500); }
        // 3.4.0: botas claveteadas: un tintineo corto sobre piedra, adoquín y metal; crujido de grava en tierra
        if (s === 'concrete' || s === 'metal') this.osc(o, 'sine', r(3800, 5200), r(3000, 3600), t + 0.008, 0.04, 0.012);
        if (s === 'dirt') this.nz(o, t + 0.03, 0.05, 0.07, 'bandpass', r(2600, 3600), 0, 3);
        break;
      }
      case 'land': this.nz(o, t, 0.12, 0.5, 'lowpass', 600, 150); this.osc(o, 'sine', 110, 50, t, 0.1, 0.35); break;
      case 'jump': this.nz(o, t, 0.08, 0.15, 'bandpass', 900, 0, 1); break;
      case 'slide': this.nz(o, t, 0.6, 0.3, 'bandpass', 1200, 500, 0.8, 0.03); break;
      case 'mantle': case 'cloth': this.nz(o, t, 0.16, 0.22, 'bandpass', 700, 1600, 1.2, 0.03); break;
      case 'bodyfall': this.nz(o, t, 0.16, 0.6, 'lowpass', 500, 120); this.osc(o, 'sine', 90, 40, t, 0.14, 0.5); this.nz(o, t + 0.12, 0.08, 0.3, 'lowpass', 700, 200); break;
      case 'ring': { const c = this.ctx, os = c.createOscillator(), g = c.createGain(); os.type = 'sine'; os.frequency.setValueAtTime(3150, t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7); os.connect(g); g.connect(o); os.start(t); os.stop(t + 1.8); break; }
      case 'pain': { const c = this.ctx, os = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); os.type = 'sawtooth'; os.frequency.setValueAtTime(r(140, 170) * p, t); os.frequency.exponentialRampToValueAtTime(r(95, 115) * p, t + 0.18); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 3; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); os.connect(f); f.connect(g); g.connect(o); os.start(t); os.stop(t + 0.25); break; }
      case 'break': this.nz(o, t, 0.4, 0.6, 'lowpass', 1600, 250); for (let i = 0; i < 4; i++) this.nz(o, t + i * 0.05 + r(0, 0.03), 0.05, 0.3, 'bandpass', r(500, 1500), 0, 2); break;
      case 'pickup': this.nz(o, t, 0.05, 0.3, 'bandpass', 1500, 0, 3); this.nz(o, t + 0.12, 0.06, 0.3, 'bandpass', 1100, 0, 3); break;
      // cuenta atrás: tic de reloj de bolsillo; salida: silbato de oficial (de trinchera)
      case 'beep': this.nz(o, t, 0.025, 0.28, 'bandpass', 3100, 0, 7); this.osc(o, 'sine', 1900, 1900, t, 0.03, 0.06); break;
      case 'go': { const c = this.ctx, os = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(); os.type = 'triangle'; os.frequency.value = 2650; lfo.frequency.value = 38; lg.gain.value = 120; lfo.connect(lg); lg.connect(os.frequency);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.03); g.gain.setValueAtTime(0.09, t + 0.55); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75); os.connect(g); g.connect(o); os.start(t); lfo.start(t); os.stop(t + 0.8); lfo.stop(t + 0.8);
        this.nz(o, t, 0.75, 0.05, 'bandpass', 2600, 0, 3, 0.03); break; }
      // fin de partida: corneta (victoria: diana; derrota: toque de silencio)
      case 'win': this.bugle(o, t, [[523, 0.14], [659, 0.14], [784, 0.14], [1046, 0.3], [784, 0.14], [1046, 0.7]], 0.12); break;
      case 'lose': this.bugle(o, t, [[392, 0.5], [392, 0.18], [523, 1.0], [392, 0.5], [523, 0.18], [659, 1.1]], 0.1); break;
      case 'capture': this.bugle(o, t, [[523, 0.1], [784, 0.3]], 0.1); break;
      // medallas: campanilla de latón (más golpes cuanto mayor la medalla)
      case 'medal': this.brass(o, t, 1320, 0.06); break;
      case 'medal2': this.brass(o, t, 1175, 0.06); this.brass(o, t + 0.12, 1568, 0.05); break;
      case 'medal3': this.brass(o, t, 988, 0.07); this.brass(o, t + 0.12, 1319, 0.06); this.brass(o, t + 0.24, 1976, 0.05); break;
      // menús: tecla de máquina de escribir
      case 'ui': this.nz(o, t, 0.018, 0.22, 'bandpass', 2400, 0, 2.5); this.osc(o, 'square', 190, 120, t, 0.02, 0.05); this.nz(o, t + 0.022, 0.03, 0.08, 'lowpass', 900, 0, 1); break;
      case 'uibell': this.brass(o, t, 2793, 0.04); break;
      case 'distant': {
        const k = opt.k;
        if (k === 'boom') { this.nz(o, t, 2.2, 0.5, 'lowpass', 300, 60, 0.6, 0.05); this.osc(o, 'sine', 55, 25, t, 1.5, 0.45); }
        else for (let i = 0; i < (opt.n || 6); i++) this.nz(o, t + i * (opt.gap || 0.09) + r(0, 0.02), 0.25, 0.22, 'lowpass', 700, 200, 0.6, 0.004);
        break;
      }
      default: break;
    }
  },
};

// ---------------- ambiente de batalla lejana (solo sonido, no afecta el juego) ----------------
const Ambience = {
  on: false, nextT: 0, wind: null,
  start() {
    if (!AUDIO.ok || this.on || (G.mode && G.mode.noAmbience && !G.attract)) return;
    this.on = true; this.nextT = AUDIO.ctx.currentTime + 3;
    const c = AUDIO.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = AUDIO.noise; s.loop = true; f.type = 'lowpass'; f.frequency.value = 380; g.gain.value = 0.05;
    s.connect(f); f.connect(g); g.connect(AUDIO.sfxGain); s.start();
    this.wind = { s, g };
  },
  stop() { this.on = false; if (this.wind) { try { this.wind.s.stop(); } catch (e) { } this.wind = null; } },
  update() {
    if (!this.on || !AUDIO.ok || AUDIO.ctx.state !== 'running') return;
    const t = AUDIO.ctx.currentTime;
    if (t < this.nextT) return;
    this.nextT = t + 2.5 + Math.random() * 6;
    const a = Math.random() * TAU, d = 140 + Math.random() * 160;
    const p = _v6.set(AUDIO.lp.x + Math.cos(a) * d, 5, AUDIO.lp.z + Math.sin(a) * d);
    const k = Math.random() < 0.4 ? 'boom' : 'burst';
    AUDIO.play('distant', p, k === 'boom' ? 6 : 4, { k, n: 3 + ((Math.random() * 8) | 0), gap: 0.07 + Math.random() * 0.06, throttle: 0 });
  },
};

// ---------------- música del menú (marcha lenta y sobria) ----------------
const Music = {
  playing: false, step: 0, nextT: 0, bpm: 84, timer: null, seed: 1, mode: 'menu',
  start(seed, mode = 'menu') {
    if (!AUDIO.ok) return;
    this.seed = seed >>> 0; this.mode = mode; this.build();
    if (this.playing) return;
    this.playing = true; this.step = 0; this.nextT = AUDIO.ctx.currentTime + 0.1;
    this.timer = setInterval(() => this.schedule(), 40);
  },
  stop() { this.playing = false; if (this.timer) clearInterval(this.timer); this.timer = null; },
  build() {
    const rng = new RNG(this.seed ^ 0xa11ce);
    this.root = 45; // La
    this.prog = [0, -4, -2, -5];
    this.snare = Array.from({ length: 16 }, (_, i) => (i % 4 === 0 ? 1 : i % 2 === 0 ? 0.45 : rng.next() < 0.25 ? 0.25 : 0));
  },
  mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); },
  schedule() {
    if (!this.playing || !AUDIO.ok) return;
    const c = AUDIO.ctx;
    if (c.state !== 'running') { this.nextT = c.currentTime + 0.1; return; }
    const st = 60 / this.bpm / 4;
    while (this.nextT < c.currentTime + 0.15) { this.playStep(this.step, this.nextT, st); this.step++; this.nextT += st; }
  },
  playStep(i, t, st) {
    const o = AUDIO.musicGain, A = AUDIO, s16 = i % 16, bar = Math.floor(i / 16), chord = this.prog[bar % 4];
    // tambor militar
    const sn = this.snare[s16];
    if (sn && bar % 8 !== 7) A.nz(o, t, 0.09, 0.16 * sn, 'bandpass', 1600, 0, 0.9);
    if (bar % 8 === 7 && s16 >= 8) A.nz(o, t, 0.06, 0.06 + (s16 - 8) * 0.02, 'bandpass', 1700, 0, 0.9);
    // timbal en el 1 y el 3
    if (s16 === 0 || s16 === 8) A.osc(o, 'sine', 70, 48, t, 0.6, 0.35);
    // colchón grave (cuerdas sintéticas)
    if (s16 === 0) {
      for (const [iv, v] of [[0, 0.05], [7, 0.035], [12, 0.025], [3, 0.02]]) {
        const n = this.root + chord + iv;
        const c = A.ctx, os = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
        os.type = 'sawtooth'; os.frequency.value = this.mtof(n); os.detune.value = (Math.random() - 0.5) * 14;
        f.type = 'lowpass'; f.frequency.value = 900;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.8); g.gain.setValueAtTime(v, t + st * 14); g.gain.exponentialRampToValueAtTime(0.0001, t + st * 17);
        os.connect(f); f.connect(g); g.connect(o); os.start(t); os.stop(t + st * 17.5);
      }
    }
    // corno lejano cada 4 compases
    if (bar % 4 === 2 && (s16 === 0 || s16 === 6 || s16 === 8)) { const n = this.root + 12 + chord + (s16 === 6 ? 7 : s16 === 8 ? 5 : 0); A.osc(o, 'triangle', this.mtof(n), this.mtof(n), t, st * 5, 0.05, 0.08); }
  },
};

