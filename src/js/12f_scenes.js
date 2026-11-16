// ---- 12f_scenes.js ----
// =====================================================================
// ESCENAS de campaña: tarjeta de cabecera (lugar · fecha · hora sobre
// negro con tic-tac), textos y diálogos con máquina de escribir, elecciones
// que nunca cambian el canon, objetivos, mecánica «Mirar» (v0: el mundo se
// desatura y se marcan detalles), cámara sentada en 1ª persona, fundidos.
// Un guion es una lista de pasos { enter(S), tick(S, dt) → true al acabar }.
// Interludio jugable: «El furgón I» (prólogo de la novela).
// =====================================================================

const Scenes = {
  on: false, S: null, el: {}, built: false,
  // ---------------- DOM ----------------
  initDom() {
    if (this.built) return; this.built = true;
    const app = document.getElementById('app'), d = document.createElement('div');
    d.id = 'scene'; d.hidden = true;
    d.innerHTML = `<div class="sc-look"></div><div class="sc-marks"></div><div class="sc-goal" hidden></div>
      <div class="sc-box" hidden><p class="sc-txt"></p><span class="sc-next">E ▸</span></div>
      <div class="sc-choice" hidden></div><div class="sc-use" hidden></div><div class="sc-black"></div>
      <div class="sc-card" hidden><small class="sc-k"></small><h1 class="sc-t"></h1><p class="sc-h"></p></div>`;
    app.appendChild(d);
    this.el = { root: d, look: d.querySelector('.sc-look'), marks: d.querySelector('.sc-marks'), goal: d.querySelector('.sc-goal'), box: d.querySelector('.sc-box'), txt: d.querySelector('.sc-txt'), next: d.querySelector('.sc-next'),
      choice: d.querySelector('.sc-choice'), black: d.querySelector('.sc-black'), card: d.querySelector('.sc-card'), use: d.querySelector('.sc-use'), k: d.querySelector('.sc-k'), t: d.querySelector('.sc-t'), h: d.querySelector('.sc-h') };
    window.addEventListener('keydown', (e) => this.onKey(e, true));
    window.addEventListener('keyup', (e) => this.onKey(e, false));
    window.addEventListener('mousedown', (e) => this.onMouse(e, true));
    window.addEventListener('mouseup', (e) => this.onMouse(e, false));
    d.addEventListener('click', (e) => { const b = e.target.closest('[data-pick]'); if (b) this.pick(+b.dataset.pick); });
  },
  live() { return this.on && this.S && !G.paused && UI.inGame() && UI.el.overlay.hidden && !UI.screen; },
  onKey(e, down) {
    if (!this.on || !this.S) return;
    if (e.code === 'KeyQ') this.S.lookKey = down;
    if (!down || e.repeat || !this.live()) return;
    if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (!this.S.line && !this.S.choice && this.S.fire && e.code === 'KeyE') this.S.fire(this.S); else if (!this.S.line && this.S.useT && e.code !== 'Space') SceneWalk.use(this.S); else this.advance(); }
    if (/^Digit[1-4]$/.test(e.code) || /^Numpad[1-4]$/.test(e.code)) this.pick(+e.code.slice(-1));
  },
  onMouse(e, down) {
    if (!this.on || !this.S) return;
    if (e.button === 1) { this.S.lookMouse = down; if (down) e.preventDefault(); }
    if (e.button === 0 && down && this.live() && Input.locked) { if (!this.S.line && !this.S.choice && this.S.fire) this.S.fire(this.S); else if (!this.S.line && this.S.useT) SceneWalk.use(this.S); else this.advance(); }
  },

  // ---------------- arranque y parada ----------------
  begin(script, mission) {
    this.initDom(); this.stop(true);
    const S = this.S = { script, mission, i: -1, t: 0, stepT: 0, step: null, match: G.match, line: null, choice: null, goal: null, marks: [], found: {}, flags: {},
      look: 0, lookKey: false, lookMouse: false, black: 1, blackTo: 1, blackSpd: 1, timeScale: 1, yaw: 0, pitch: 0, yawC: 0, yawR: 1.9, pitchMin: -1.25, pitchMax: 0.55, eye: new THREE.Vector3(), roll: 0 };
    this.on = true;
    const f = G.local;
    if (f) { f.hidden = true; if (f.view) f.view.root.visible = false; }
    UI.el.hud.hidden = true;
    this.el.root.hidden = false; this.el.black.style.opacity = 1;
    G.freeze = true;
    CAM.override = { pos: new THREE.Vector3(), target: new THREE.Vector3(0, 0, -1), fov: 70 };
    if (script.setup) script.setup(S);
    Input.state.yaw = S.yawC; Input.state.pitch = S.pitch;
    this.nextStep();
  },
  stop(silent) {
    const S = this.S;
    if (S && S.script.teardown) { try { S.script.teardown(S); } catch (e) { reportError(e); } }
    this.on = false; this.S = null;
    if (this.built) { this.el.use.hidden = true; this.el.root.hidden = true; this.el.box.hidden = true; this.el.choice.hidden = true; this.el.card.hidden = true; this.el.goal.hidden = true; this.el.marks.innerHTML = ''; this.el.look.style.opacity = 0; }
    if (G.renderer) G.renderer.domElement.style.filter = '';
    if (CAM.override && !silent) CAM.override = null;
    SceneAudio.stopAll();
  },
  nextStep() {
    const S = this.S; if (!S) return;
    S.i++; S.stepT = 0;
    const st = S.step = S.script.steps[S.i];
    if (!st) { this.stop(); Campaign.finish(); return; }
    try { if (st.enter) st.enter(S); } catch (e) { reportError(e); }
  },
  // E / clic / espacio: completar la línea que se escribe o pasar a la siguiente
  advance() {
    const S = this.S; if (!S || !S.line) return;
    const ln = S.line;
    if (ln.shown < ln.text.length) { ln.shown = ln.text.length; return; }
    if (ln.minT && ln.t < ln.minT) return;
    S.line = null; this.el.box.hidden = true;
    AUDIO.play('ui', null, 0.25);
  },
  pick(n) {
    const S = this.S; if (!S || !S.choice || S.line) return;
    const c = S.choice; if (n < 1 || n > c.opts.length) return;
    c.picked = n - 1; AUDIO.play('ui', null, 0.45);
    this.el.choice.hidden = true;
  },
  // ---------------- utilidades para los pasos ----------------
  say(text, o = {}) {
    const S = this.S; S.line = { text, shown: 0, t: 0, minT: o.minT ?? 0.25, cls: o.cls || '' };
    this.el.txt.className = 'sc-txt ' + (S.line.cls || ''); this.el.txt.textContent = ''; this.el.box.hidden = false; this.el.next.style.opacity = 0;
  },
  setGoal(text) { const S = this.S; S.goal = text; const g = this.el.goal; if (!text) { g.hidden = true; return; } g.hidden = false; g.innerHTML = text; g.classList.remove('flash'); void g.offsetWidth; g.classList.add('flash'); },
  ask(q, opts) {
    const S = this.S; S.choice = { q, opts, picked: -1 };
    this.el.choice.innerHTML = `<p class="sc-q">${escapeHtml(q)}</p>${opts.map((o, i) => `<button data-pick="${i + 1}"><kbd>${i + 1}</kbd>${escapeHtml(o)}</button>`).join('')}`;
    this.el.choice.hidden = false;
  },
  fade(to, secs = 1) { const S = this.S; S.blackTo = to; S.blackSpd = 1 / Math.max(0.05, secs); },
  card(kicker, title, head) { const e = this.el; e.k.textContent = kicker || ''; e.t.textContent = title || ''; e.h.textContent = head || ''; e.card.hidden = false; e.card.classList.remove('in'); void e.card.offsetWidth; e.card.classList.add('in'); },
  hideCard() { this.el.card.hidden = true; },
  // dirección de la vista y prueba «¿estoy mirando ese punto?»
  viewDir(out) { return dirFromYawPitch(this.S.yaw, this.S.pitch, out); },
  angleTo(p) { const S = this.S, d = _v4.copy(p).sub(S.eye).normalize(); return Math.acos(clamp(d.dot(this.viewDir(_v5)), -1, 1)); },
  looking() { const S = this.S; return !!(S && (S.lookKey || S.lookMouse)); },

  // ---------------- cada cuadro (después de CAM.update) ----------------
  frame(rawDt) {
    if (!this.on) return;
    const S = this.S;
    if (!S || G.match !== S.match || !G.match) { this.stop(); return; }
    rawDt *= window.__COW_SCENE_SPEED || 1;
    const dt = (G.paused ? 0 : rawDt) * S.timeScale;
    S.t += dt; S.stepT += dt;
    G.freeze = true;
    if (UI.inGame() && !UI.screen && !UI.el.hud.hidden) UI.el.hud.hidden = true;
    // mirar alrededor: la vista sale del ratón, con límites (va sentado y esposado)
    const inp = Input.state;
    let dy = inp.yaw - S.yawC; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    if (Math.abs(dy) > S.yawR && !(S.walk && S.walk.on)) inp.yaw = S.yawC + Math.sign(dy) * S.yawR;
    inp.pitch = clamp(inp.pitch, S.pitchMin, S.pitchMax);
    S.yaw = inp.yaw; S.pitch = inp.pitch;
    // Mirar: el mundo se desatura un poco y el sonido se afila
    const want = this.looking() && !S.line && !G.paused && !S.noLook ? 1 : 0;
    S.look = damp(S.look, want, want ? 6 : 9, rawDt);
    if (G.renderer) { const k = S.look; G.renderer.domElement.style.filter = k > 0.02 ? `saturate(${(1 - 0.6 * k).toFixed(2)}) contrast(${(1 + 0.1 * k).toFixed(2)})` : ''; }
    this.el.look.style.opacity = S.look.toFixed(2);
    SceneAudio.sharpen(S.look);
    if (S.script.update) { try { S.script.update(S, dt, rawDt); } catch (e) { reportError(e); } }
    SceneWalk.tick(S, dt, rawDt);
    // cámara
    const cam = G.camera;
    cam.position.copy(S.eye);
    cam.rotation.set(S.pitch, S.yaw, S.roll, 'YXZ');
    if (CAM.override) { CAM.override.pos.copy(S.eye); CAM.override.target.copy(S.eye).add(this.viewDir(_v6)); }
    if (Math.abs(cam.fov - 70) > 0.01) { cam.fov = 70; cam.updateProjectionMatrix(); }
    // fundido
    if (S.black !== S.blackTo) { const s = S.blackSpd * rawDt; S.black = S.black < S.blackTo ? Math.min(S.blackTo, S.black + s) : Math.max(S.blackTo, S.black - s); }
    this.el.black.style.opacity = S.black.toFixed(3);
    // línea que se escribe
    if (S.line) {
      const ln = S.line; ln.t += rawDt;
      if (!G.paused && ln.shown < ln.text.length) { const before = ln.shown | 0; ln.shown = Math.min(ln.text.length, ln.shown + rawDt * 70); if ((ln.shown | 0) > before && ((ln.shown | 0) % 3 === 0)) SceneAudio.key(); }
      const n = ln.shown | 0; if (this.el.txt._n !== n) { this.el.txt._n = n; this.el.txt.textContent = ln.text.slice(0, n); }
      this.el.next.style.opacity = ln.shown >= ln.text.length && ln.t >= ln.minT ? 1 : 0;
    }
    // paso actual
    const st = S.step;
    if (st && st.tick && !G.paused) { let done = false; try { done = st.tick(S, dt); } catch (e) { reportError(e); done = true; } if (done && this.S === S) this.nextStep(); }
    else if (st && !st.tick && !S.line) this.nextStep();
    this.drawMarks();
  },
  // marcas de «Mirar»: solo con la tecla pulsada, sobre lo que aún no se ha visto
  drawMarks() {
    const S = this.S, box = this.el.marks, mk = Camp.diff().marks, look = !S ? 0 : mk === 'none' ? 0 : mk === 'always' || S.helpMarks ? Math.max(S.look, 0.45) : S.look;
    if (!S || look < 0.05 || !S.marks.length) { if (box._n) { box.innerHTML = ''; box._n = 0; } return; }
    const cam = G.camera, W = innerWidth, H = innerHeight; let html = '', n = 0;
    for (const m of S.marks) {
      if (m.done || (m.avail && !m.avail(S))) continue;
      const p = _v7.copy(m.pos(S)).project(cam);
      if (p.z > 1 || Math.abs(p.x) > 1.05 || Math.abs(p.y) > 1.05) continue;
      const x = (p.x * 0.5 + 0.5) * W, y = (-p.y * 0.5 + 0.5) * H, aim = m._aim || 0;
      html += `<i style="left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;opacity:${(look * (0.35 + 0.65 * aim)).toFixed(2)};transform:translate(-50%,-50%) scale(${(1.25 - 0.4 * aim).toFixed(2)})"></i>`; n++;
    }
    box.innerHTML = html; box._n = n;
  },
};

// ---------------- pasos de guion reutilizables ----------------
const Step = {
  // tarjeta de cabecera sobre negro con tic-tac
  card(kicker, title, head, secs = 5.2) {
    const tx = (v) => (v && typeof v === 'object' ? L(v) : v);
    return { enter(S) { Scenes.fade(1, 0.01); Scenes.card(tx(kicker), tx(title), tx(head)); SceneAudio.ticTac(secs - 0.6); },
      tick(S) { if (S.stepT > secs) { Scenes.hideCard(); return true; } return false; } };
  },
  fade(to, secs = 1.2, wait = true) { return { enter() { Scenes.fade(to, secs); }, tick(S) { return !wait || S.stepT >= secs; } }; },
  wait(secs) { return { tick(S) { return S.stepT >= secs; } }; },
  // texto (narración o diálogo): espera a que el jugador lo pase
  say(es, en, o) { return { enter() { Scenes.say(L({ es, en }), o); }, tick(S) { return !S.line; } }; },
  goal(es, en) { return { enter() { Scenes.setGoal(es == null ? null : L({ es, en })); } }; },
  run(fn) { return { enter: fn }; },
  // pregunta: la respuesta buena avanza; las malas dan una línea y se vuelve a preguntar (el canon no cambia)
  choice(q, opts, ok, wrong) {
    return { kind: 'choice', ok, enter(S) { S._w = null; Scenes.ask(L(q), opts.map(L)); },
      tick(S) {
        if (S._w) { if (!S.line) { S._w = null; Scenes.ask(L(q), opts.map(L)); } return false; }
        const c = S.choice; if (!c || c.picked < 0) return false;
        S.choice = null;
        if (c.picked === ok) return true;
        S._w = 1; Scenes.say(L(Array.isArray(wrong) ? wrong[c.picked] || wrong[0] : wrong), { cls: 'inner' }); return false;
      } };
  },
  // encontrar detalles con «Mirar»: cada uno da su línea; termina cuando se han visto `need`
  find(marks, need, goalFn) {
    return { enter(S) { S.marks = marks.map((m) => ({ ...m, done: false, hold: 0, _aim: 0 })); S._q = []; S.helpMarks = false; Scenes.setGoal(goalFn(0, need)); },
      tick(S, dt) {
        if (S.line) return false;
        if (S._q.length) { const nx = S._q.shift(); Scenes.say(L(nx.text), nx.o); return false; }
        const got = S.marks.filter((m) => m.done).length;
        if (got >= need) { S.marks = []; S.helpMarks = false; Scenes.setGoal(null); return true; }
        // 3.1.3: si tarda mucho, las marcas se ven sin pulsar y el blanco es más generoso
        const help = S.stepT > 25; if (help && !S.helpMarks) S.helpMarks = true;
        const lk = S.look > 0.6;
        for (const m of S.marks) {
          if (m.done) continue;
          const av = !m.avail || m.avail(S), a = Scenes.angleTo(m.pos(S)), r = (m.r || 0.12) * (help ? 1.6 : 1);
          m._aim = av ? clamp(1 - a / (r * 2.2), 0, 1) : 0;
          if (lk && av && a < r) { m.hold += dt; if (m.hold > 0.35) { m.done = true; SceneAudio.found(); if (m.onFound) m.onFound(S); for (const t of [].concat(m.text)) S._q.push({ text: t, o: t.o || m.o }); Scenes.setGoal(goalFn(got + 1, need)); } }
          else m.hold = Math.max(0, m.hold - dt * 2);
        }
        return false;
      } };
  },
  // mirar un punto sin pulsar nada (p. ej. «mírate las manos»)
  gaze(posFn, r, secs = 0.5) { return { kind: 'gaze', at: posFn, tick(S, dt) { if (Scenes.angleTo(posFn(S)) < r) S._g = (S._g || 0) + dt; else S._g = 0; if (S._g > secs) { S._g = 0; return true; } return false; } }; },
};

// ---------------- sonido de las escenas (sintetizado) ----------------
const SceneAudio = {
  loops: [], sharpF: null,
  ok() { return AUDIO.ok && AUDIO.ctx && AUDIO.ctx.state === 'running'; },
  dest() { return AUDIO.sfxGain; },
  // tic-tac de la tarjeta de cabecera
  ticTac(secs) {
    if (!this.ok()) return; const c = AUDIO.ctx, t0 = c.currentTime + 0.25;
    for (let i = 0; i < secs * 2; i++) { const t = t0 + i * 0.5, hi = i % 2 === 0; AUDIO.nz(this.dest(), t, 0.03, 0.09, 'bandpass', hi ? 3400 : 2600, null, 6); AUDIO.osc(this.dest(), 'sine', hi ? 2100 : 1700, null, t, 0.025, 0.03); }
  },
  key() { if (!this.ok()) return; AUDIO.nz(this.dest(), AUDIO.ctx.currentTime, 0.012, 0.012, 'highpass', 4500); },
  found() { if (!this.ok()) return; const t = AUDIO.ctx.currentTime; AUDIO.osc(this.dest(), 'sine', 1320, 1320, t, 0.5, 0.035, 0.01); AUDIO.osc(this.dest(), 'sine', 1980, 1980, t + 0.04, 0.4, 0.015, 0.01); },
  count() { if (!this.ok()) return; const t = AUDIO.ctx.currentTime; AUDIO.nz(this.dest(), t, 0.02, 0.03, 'bandpass', 2400, null, 5); },
  drop(vol = 1) { if (!this.ok()) return; const t = AUDIO.ctx.currentTime; AUDIO.osc(this.dest(), 'sine', 1500, 700, t, 0.07, 0.05 * vol); AUDIO.nz(this.dest(), t, 0.04, 0.03 * vol, 'bandpass', 2600, null, 3); },
  thud(vol = 1) { if (!this.ok()) return; const t = AUDIO.ctx.currentTime; AUDIO.osc(this.dest(), 'sine', 70, 38, t, 0.25, 0.22 * vol); AUDIO.nz(this.dest(), t, 0.18, 0.12 * vol, 'lowpass', 500, 120); },
  // el puente: las ruedas suenan huecas un rato
  bridge(secs = 3.2) {
    if (!this.ok()) return; const c = AUDIO.ctx, t0 = c.currentTime;
    for (let i = 0; i < secs / 0.19; i++) { const t = t0 + i * 0.19 + Math.random() * 0.03; AUDIO.osc(this.dest(), 'sine', 92, 58, t, 0.22, 0.13); AUDIO.nz(this.dest(), t, 0.16, 0.05, 'bandpass', 260, null, 4); }
  },
  gear() { if (!this.ok()) return; const t = AUDIO.ctx.currentTime; AUDIO.nz(this.dest(), t, 0.35, 0.06, 'bandpass', 900, 300, 2); AUDIO.osc(this.dest(), 'square', 140, 90, t, 0.3, 0.012); if (this.engine) { const f = this.engine.o1.frequency; f.setTargetAtTime(30, t, 0.08); f.setTargetAtTime(41, t + 0.5, 0.6); } },
  // lluvia en el toldo + motor diésel subiendo la sierra
  startTruck() {
    if (!this.ok() || this.loops.length) return; const c = AUDIO.ctx;
    const sharp = c.createBiquadFilter(); sharp.type = 'highshelf'; sharp.frequency.value = 2500; sharp.gain.value = 0; sharp.connect(this.dest()); this.sharpF = sharp;
    const rain = c.createBufferSource(); rain.buffer = AUDIO.noise; rain.loop = true; const rf = c.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = 1700; rf.Q.value = 0.6; const rg = c.createGain(); rg.gain.value = 0.07;
    rain.connect(rf); rf.connect(rg); rg.connect(sharp); rain.start();
    const o1 = c.createOscillator(), o2 = c.createOscillator(), ef = c.createBiquadFilter(), eg = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
    o1.type = 'sawtooth'; o1.frequency.value = 41; o2.type = 'square'; o2.frequency.value = 61.7; ef.type = 'lowpass'; ef.frequency.value = 210; eg.gain.value = 0.05;
    lfo.frequency.value = 7.5; lg.gain.value = 0.016; lfo.connect(lg); lg.connect(eg.gain);
    o1.connect(ef); o2.connect(ef); ef.connect(eg); eg.connect(this.dest()); o1.start(); o2.start(); lfo.start();
    const road = c.createBufferSource(); road.buffer = AUDIO.noise; road.loop = true; road.playbackRate.value = 0.5; const rdf = c.createBiquadFilter(); rdf.type = 'lowpass'; rdf.frequency.value = 160; const rdg = c.createGain(); rdg.gain.value = 0.09;
    road.connect(rdf); rdf.connect(rdg); rdg.connect(this.dest()); road.start();
    this.engine = { o1, o2, eg }; this.road = rdg;
    this.loops.push(rain, o1, o2, lfo, road);
    this.nodes = [rf, rg, ef, eg, lg, rdf, rdg, sharp];
  },
  // el río, muy abajo, a la izquierda
  river(on) { if (!this.ok()) return; if (on && !this.riv) { const c = AUDIO.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), p = c.createStereoPanner ? c.createStereoPanner() : null; s.buffer = AUDIO.noise; s.loop = true; s.playbackRate.value = 0.7; f.type = 'bandpass'; f.frequency.value = 520; f.Q.value = 0.4; g.gain.value = 0.0001; g.gain.setTargetAtTime(0.03, c.currentTime, 1.5); s.connect(f); f.connect(g); if (p) { p.pan.value = -0.7; g.connect(p); p.connect(this.dest()); } else g.connect(this.dest()); s.start(); this.riv = { s, g }; this.loops.push(s); } },
  sharpen(k) { if (this.sharpF) this.sharpF.gain.value = -9 * k; if (this.road) this.road.gain.value = 0.09 * (1 - 0.5 * k); },
  stopAll() {
    for (const s of this.loops) { try { s.stop(); } catch (e) { } }
    for (const n of this.nodes || []) { try { n.disconnect(); } catch (e) { } }
    if (this.engine) { try { this.engine.eg.disconnect(); } catch (e) { } }
    this.loops = []; this.nodes = []; this.engine = null; this.road = null; this.riv = null; this.sharpF = null;
  },
};

// =====================================================================
// EL FURGÓN — interior del camión (lo arma y anima la escena)
// Ejes: el camión avanza hacia -z (cabina), la compuerta está en +z.
// Santiago va en el banco izquierdo (x<0) mirando a +x; el guardia enfrente.
// =====================================================================
const FurgonSet = {
  build(S) {
    const root = new THREE.Group(); MapSys.decor.add(root);
    const mats = {}, tex = [];
    const M = (c, o = {}) => { const k = c + (o.e || '') + (o.r || ''); return mats[k] || (mats[k] = new THREE.MeshStandardMaterial({ color: c, roughness: o.r ?? 0.9, metalness: o.m ?? 0, emissive: o.e || 0x000000, emissiveIntensity: o.ei ?? 1 })); };
    const box = (w, h, d, c, x, y, z, par = root, o = {}) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.mat || M(c, o)); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; par.add(m); return m; };
    const grp = (x, y, z, par = root) => { const g = new THREE.Group(); g.position.set(x, y, z); par.add(g); return g; };
    const wood = 0x4a3a28, woodD = 0x342818, canvas = 0x4e5040, canvasD = 0x3c3e32, iron = 0x2c2c2a;
    // suelo de tablas, bancos, laterales de madera y toldo sobre arcos
    box(2.3, 0.08, 4.6, woodD, 0, -0.04, 0);
    for (let x = -1.05; x <= 1.06; x += 0.21) box(0.012, 0.005, 4.6, 0x241a10, x, 0.003, 0);
    for (const s of [-1, 1]) {
      box(0.42, 0.06, 3.9, wood, s * 0.86, 0.44, 0.05); box(0.05, 0.44, 3.9, woodD, s * 0.67, 0.22, 0.05);
      box(0.05, 0.55, 4.6, wood, s * 1.13, 0.27, 0);
      for (const y of [0.12, 0.3, 0.48]) box(0.012, 0.02, 4.6, 0x241a10, s * 1.104, y, 0);
      box(0.03, 0.95, 4.6, canvas, s * 1.13, 1.02, 0);
    }
    const arch = [[-1.13, 1.5], [-0.8, 1.78], [-0.4, 1.92], [0, 1.96], [0.4, 1.92], [0.8, 1.78], [1.13, 1.5]];
    for (let i = 0; i < arch.length - 1; i++) {
      const [x0, y0] = arch[i], [x1, y1] = arch[i + 1], L0 = Math.hypot(x1 - x0, y1 - y0), a = Math.atan2(y1 - y0, x1 - x0);
      box(L0 + 0.01, 0.025, 4.6, i % 2 ? canvas : canvasD, (x0 + x1) / 2, (y0 + y1) / 2, 0, root, { rz: a });
      for (const z of [-1.9, -0.6, 0.7, 2.0]) box(L0 + 0.01, 0.04, 0.05, woodD, (x0 + x1) / 2, (y0 + y1) / 2 - 0.03, z, root, { rz: a });
    }
    for (const s of [-1, 1]) for (const z of [-1.9, -0.6, 0.7, 2.0]) box(0.04, 1.0, 0.05, woodD, s * 1.105, 1.0, z);
    // frente (cabina) con ventanuco tapado
    box(2.3, 1.6, 0.06, canvasD, 0, 0.8, -2.3); box(0.5, 0.22, 0.02, 0x0b0b0b, 0.25, 1.25, -2.26);
    // compuerta trasera de madera y faldón de lona con una rendija
    box(2.3, 0.62, 0.06, wood, 0, 0.31, 2.3);
    const SLIT = { x: 0.32, y0: 0.66, y1: 1.62, w: 0.075 };
    box(1.13 + SLIT.x - SLIT.w / 2, 1.0, 0.03, canvas, (-1.13 + SLIT.x - SLIT.w / 2) / 2, 1.13, 2.29);
    box(1.13 - SLIT.x - SLIT.w / 2, 1.0, 0.03, canvas, (1.13 + SLIT.x + SLIT.w / 2) / 2, 1.13, 2.29);
    box(2.3, 0.4, 0.03, canvasD, 0, 1.82, 2.29);
    // argolla soldada al suelo y cajón de madera
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.011, 6, 12), M(iron, { r: 0.4, m: 0.7 })); ring.position.set(-0.36, 0.05, 0.5); ring.rotation.y = Math.PI / 2; root.add(ring);
    box(0.08, 0.02, 0.08, iron, -0.36, 0.01, 0.5, root, { r: 0.4, m: 0.6 });
    box(0.55, 0.32, 0.4, wood, 0.55, 0.16, -1.25); box(0.56, 0.02, 0.41, woodD, 0.55, 0.33, -1.25);

    // ---------- Santiago (lo que se ve de él: piernas, manos esposadas, cadena de los tobillos) ----------
    const prison = 0x5a5446, prisonD = 0x46412f, skin = 0xa88068;
    const me = grp(0, 0, 0);
    for (const s of [-1, 1]) {
      const z = 0.5 + s * 0.12;
      box(0.42, 0.15, 0.15, prison, -0.62, 0.53, z, me); box(0.15, 0.45, 0.14, prison, -0.39, 0.25, z, me); box(0.26, 0.08, 0.12, 0x1e1a14, -0.33, 0.04, z, me);
    }
    const wet = box(0.13, 0.005, 0.13, 0x2a2820, -0.43, 0.607, 0.38, me, { r: 0.25 }); wet.scale.set(0.2, 1, 0.2);
    const hands = grp(-0.47, 0.6, 0.5, me);
    for (const s of [-1, 1]) {
      box(0.24, 0.1, 0.1, prisonD, -0.12, 0, s * 0.07, hands, { ry: s * 0.25 });
      box(0.1, 0.06, 0.085, skin, 0.05, -0.01, s * 0.045, hands);
      box(0.05, 0.035, 0.022, skin, 0.08, 0.025, s * 0.065, hands);                                   // pulgares
      const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.009, 6, 14), M(0x6c6c66, { r: 0.35, m: 0.8 })); cuff.position.set(-0.02, 0, s * 0.045); cuff.rotation.y = Math.PI / 2; hands.add(cuff);
    }
    box(0.008, 0.008, 0.06, 0x6c6c66, -0.02, 0, 0, hands, { r: 0.35, m: 0.8 });
    // la uña del pulgar derecho partida (detalle de la novela)
    box(0.012, 0.004, 0.012, 0x8a6a58, 0.1, 0.044, 0.065, hands);
    // cadena corta de las esposas a la argolla y cadena engrasada entre los tobillos
    const links = (a, b, n, par, col, mat) => { for (let i = 0; i <= n; i++) { const t = i / n, l = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 4, 8), mat || M(col, { r: 0.35, m: 0.8 })); l.position.set(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t - Math.sin(t * Math.PI) * 0.03, a.z + (b.z - a.z) * t); l.rotation.set(i % 2 ? Math.PI / 2 : 0, i * 0.7, 0); par.add(l); } };
    links({ x: -0.45, y: 0.58, z: 0.5 }, { x: -0.36, y: 0.08, z: 0.5 }, 16, root, 0x5c5c58);
    const grease = new THREE.MeshStandardMaterial({ color: 0x24221c, roughness: 0.18, metalness: 0.85 });
    links({ x: -0.34, y: 0.05, z: 0.36 }, { x: -0.34, y: 0.05, z: 0.64 }, 10, root, 0, grease);

    // ---------- el guardia (estilo cuadrado, sentado enfrente) ----------
    const coat = 0x3b4034, coatD = 0x2e3329, cap = 0x24282a, face = 0xae8a76;
    const g = grp(0.84, 0, 0.5);
    for (const s of [-1, 1]) { box(0.44, 0.15, 0.15, 0x2e3028, -0.2, 0.53, s * 0.12, g); box(0.15, 0.46, 0.14, 0x2e3028, -0.42, 0.25, s * 0.12, g); box(0.27, 0.09, 0.13, 0x161412, -0.47, 0.045, s * 0.12, g); }
    box(0.5, 0.06, 0.46, coat, -0.18, 0.62, 0, g);                                  // faldón del capote sobre los muslos
    const torso = grp(0.02, 0.62, 0, g);
    box(0.28, 0.6, 0.48, coat, 0, 0.3, 0, torso); box(0.3, 0.08, 0.5, coatD, 0, 0.56, 0, torso);           // capote y cuello
    for (const y of [0.12, 0.27, 0.42]) box(0.012, 0.025, 0.025, 0x8a7a4a, -0.145, y, 0.07, torso, { r: 0.4, m: 0.6 });
    const head = grp(0, 0.74, 0, torso);
    box(0.24, 0.26, 0.24, face, 0, 0, 0, head);
    box(0.26, 0.07, 0.26, cap, 0, 0.15, 0, head); box(0.28, 0.035, 0.28, cap, 0, 0.12, 0, head); box(0.1, 0.02, 0.2, 0x111111, -0.17, 0.11, 0, head);
    box(0.012, 0.03, 0.05, 0x1a1210, -0.121, 0.03, -0.055, head); box(0.012, 0.03, 0.05, 0x1a1210, -0.121, 0.03, 0.055, head);    // ojos
    const freckle = box(0.008, 0.022, 0.022, 0x5a3022, -0.123, -0.005, -0.06, head);                                              // peca bajo el ojo derecho
    const scar = box(0.006, 0.006, 0.07, 0xe0b8a8, -0.122, -0.118, 0.005, head);                                                  // cicatriz en el mentón
    // brazos: mangas dobladas dos vueltas (dos franjas más claras en la muñeca)
    const armR = grp(-0.02, 0.5, -0.27, torso), armL = grp(-0.02, 0.5, 0.27, torso);
    for (const [arm, s] of [[armR, -1], [armL, 1]]) {
      box(0.13, 0.32, 0.12, coat, 0, -0.16, 0, arm);
      const fore = grp(0, -0.32, 0, arm); arm.userData.fore = fore;
      box(0.3, 0.12, 0.12, coat, -0.15, 0, 0, fore); box(0.04, 0.135, 0.135, 0x4a5040, -0.27, 0, 0, fore); box(0.04, 0.135, 0.135, 0x535a48, -0.23, 0, 0, fore);
      box(0.1, 0.07, 0.09, face, -0.34, -0.01, 0, fore);
      arm.rotation.z = -0.05; fore.rotation.z = 0.2; void s;
    }
    // la carabina atravesada sobre las piernas (mano derecha en la empuñadura)
    const gun = grp(0.6, 0.67, 0.5);
    box(0.06, 0.07, 0.36, 0x5a3a20, 0, 0, -0.38, gun); box(0.055, 0.06, 0.5, 0x5a3a20, 0, -0.005, 0.05, gun); box(0.045, 0.05, 0.16, 0x2a2a28, 0, 0.035, -0.08, gun, { r: 0.4, m: 0.7 });
    box(0.025, 0.025, 0.5, 0x222222, 0, 0.04, 0.3, gun, { r: 0.35, m: 0.8 }); box(0.012, 0.03, 0.02, 0x222222, 0, 0.065, 0.53, gun, { r: 0.4, m: 0.7 });
    const safety = box(0.014, 0.02, 0.03, 0x2a2a28, -0.032, 0.05, -0.15, gun, { r: 0.4, m: 0.7 });
    const notch = box(0.006, 0.012, 0.012, 0xc81e14, -0.041, 0.05, -0.14, gun, { e: 0x5a0805, r: 0.5 });
    box(0.03, 0.035, 0.05, 0x2a2a28, 0, -0.04, -0.12, gun, { r: 0.4, m: 0.7 });                                // guardamonte
    const finger = box(0.075, 0.018, 0.018, face, -0.025, -0.02, -0.12, gun);
    const thumb = box(0.016, 0.016, 0.07, face, -0.03, 0.055, -0.24, gun);
    gun.rotation.y = 0.55;                                                                                       // el cañón hacia mis piernas
    // la mano derecha va a la empuñadura (se sigue a mano cada cuadro)

    // ---------- la lámpara de petróleo colgada del techo ----------
    const hook = grp(0, 1.94, 0.25);
    box(0.015, 0.04, 0.015, iron, 0, -0.02, 0, hook);
    const pend = grp(0, -0.04, 0, hook);
    box(0.006, 0.26, 0.006, 0x3a3630, 0, -0.13, 0, pend);
    const lampY = -0.36;
    box(0.11, 0.025, 0.11, 0x6a5a3a, 0, lampY + 0.11, 0, pend, { r: 0.5, m: 0.6 }); box(0.1, 0.05, 0.1, 0x6a5a3a, 0, lampY - 0.1, 0, pend, { r: 0.5, m: 0.6 });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.15, 10), new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffa040, emissiveIntensity: 1.6, roughness: 0.3, transparent: true, opacity: 0.85 })); glass.position.y = lampY; pend.add(glass);
    const light = new THREE.PointLight(0xffc480, 3.2, 8, 1.4); light.position.y = lampY; pend.add(light);
    // luz de posición roja detrás (lo que se ve por la rendija)
    const tail = new THREE.PointLight(0xff2a18, 0.9, 7, 1.8); tail.position.set(0.6, 0.15, 2.7); root.add(tail);

    // ---------- fuera: la carretera que se aleja, los mojones, el puente, la cruz ----------
    const out = grp(0, 0, 0);
    const road = box(5.2, 0.02, 40, 0x1c1a17, 0, -0.95, 22.6, out);
    const dashes = []; for (let i = 0; i < 12; i++) dashes.push(box(0.1, 0.01, 0.9, 0x5e5a50, -0.15, -0.935, 3 + i * 3.4, out));
    const postTex = (txt) => { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 96; const x = cv.getContext('2d'); x.fillStyle = '#d8d2c0'; x.fillRect(0, 0, 64, 96); x.fillStyle = '#b22a1e'; x.fillRect(0, 0, 64, 26); x.fillStyle = '#1a1814'; x.font = 'bold 30px serif'; x.textAlign = 'center'; x.fillText(txt, 32, 66); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; tex.push(t); return t; };
    const mkPost = (txt) => { const m = new THREE.Group(); box(0.22, 0.5, 0.14, 0xd0cab8, 0, 0, 0, m); const tm = new THREE.MeshStandardMaterial({ map: postTex(txt), roughness: 0.9 }); for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.PlaneGeometry(0.21, 0.48), tm); f.position.z = s * 0.071; if (s < 0) f.rotation.y = Math.PI; m.add(f); } m.visible = false; out.add(m); return m; };
    const posts = { 29: mkPost('29'), 30: mkPost('30'), 31: mkPost('31') };
    const rail = grp(0, 0, 0, out); rail.visible = false;
    for (const s of [-1, 1]) { box(0.06, 0.06, 18, 0x3a3a38, s * 2.4, -0.05, 9, rail, { r: 0.5, m: 0.6 }); for (let z = 0; z < 18; z += 1.2) { box(0.05, 0.9, 0.05, 0x3a3a38, s * 2.4, -0.5, z, rail, { r: 0.5, m: 0.6 }); box(0.03, 1.2, 0.03, 0x34342f, s * 2.4, -0.45, z + 0.6, rail, { rx: 0.6 }); } }
    const cross = grp(0, 0, 0, out); cross.visible = false;
    box(0.16, 1.1, 0.16, 0x6a665c, 0, -0.4, 0, cross); box(0.6, 0.15, 0.15, 0x6a665c, 0, -0.05, 0, cross);
    const tree = (x, z) => { const t = grp(x, -0.95, z, out); box(0.18, 3.5, 0.18, 0x3a332a, 0, 1.75, 0, t); box(0.9, 1.6, 0.9, 0x1e2a1e, 0, 3.6, 0, t); return t; };
    const trees = []; for (let i = 0; i < 8; i++) trees.push(tree(i % 2 ? 2.9 : -3.1, 4 + i * 5.3));
    const rainS = []; { const rm = new THREE.MeshBasicMaterial({ color: 0x8a96a0, transparent: true, opacity: 0.35 }); for (let i = 0; i < 70; i++) { const r = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.28, 0.006), rm); r.position.set(frand(-2.6, 2.6), frand(-0.9, 2.6), frand(2.5, 9)); out.add(r); rainS.push(r); } }

    // ---------- la gota ----------
    const dropM = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), new THREE.MeshStandardMaterial({ color: 0xaab8c0, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.85 })); dropM.scale.set(1, 1.7, 1); dropM.visible = false; root.add(dropM);
    box(0.06, 0.004, 0.02, 0x101010, -0.43, 1.83, 0.38, root, { rz: -0.4 });          // la grieta del toldo
    const DROP_TOP = new THREE.Vector3(-0.43, 1.82, 0.38), KNEE = new THREE.Vector3(-0.43, 0.61, 0.38);

    S.set = { root, out, road, dashes, posts, rail, cross, trees, rainS, dropM, wet, hands, g, torso, head, armR, armL, gun, safety, notch, finger, thumb, freckle, scar, pend, light, glass, tail, tex, mats,
      DROP_TOP, KNEE, SLIT, EYE: new THREE.Vector3(-0.8, 1.17, 0.5), swing: 0, swingV: 0, curve: 0, curveT: 0, bumpT: 2, dropT: 0, dropY: -1, dropEvery: 11, dropsOn: false, impacts: 0,
      ride: [], speed: 8.3, fingerTremble: 1, gunLift: 0, gunAim: 0.55, headLook: 0, outLook: 0 };
    return S.set;
  },
  // posiciones del mundo de los detalles (para Mirar)
  wp(o, x = 0, y = 0, z = 0) { o.updateWorldMatrix(true, false); return _v8.set(x, y, z).applyMatrix4(o.matrixWorld).clone(); },
  // un objeto que pasa por fuera: aparece lejos de la rendija y se aleja con la marcha del camión
  pass(F, obj, x, y, z0 = 2.8) { obj.visible = true; obj.position.set(x, y, z0); F.ride.push(obj); },
  update(S, dt, rawDt) {
    const F = S.set; if (!F) return;
    const t = S.t;
    // marcha: baches pequeños, alguno grande; curvas que mueven la lámpara (3.1.3: si alguien lleva rato buscando, las curvas acercan la lámpara al guardia)
    F.bumpT -= dt; let bump = 0;
    if (F.bumpT <= 0) { F.bumpT = frand(1.2, 4.5); F.kick = frand(0.012, 0.03); if (F.kick > 0.026) SceneAudio.thud(0.6); }
    F.kick = (F.kick || 0) * Math.exp(-dt * 7); bump = F.kick * Math.sin(t * 38);
    if (!S.scriptCurve) { F.curveT -= dt; if (F.curveT <= 0) { F.curveT = frand(5, 11); F.curveTo = frand(-0.6, 0.6); if (S.helpMarks && F.curveTo < 0.4) F.curveTo = frand(0.45, 0.6); } F.curve = damp(F.curve, F.curveTo || 0, 0.8, dt); }
    // péndulo de la lámpara: la curva empuja hacia fuera
    const acc = -F.swing * 9.5 - F.swingV * 0.55 + F.curve * 4.2;
    F.swingV += acc * dt; F.swing += F.swingV * dt; F.swing = clamp(F.swing, -0.95, 0.95);
    F.pend.rotation.z = -F.swing; F.light.intensity = 3.1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 31) * 0.05;
    S.eye.copy(F.EYE); S.eye.y += Math.sin(t * 2.1) * 0.004 + bump; S.eye.x += F.curve * 0.012;
    S.roll = F.curve * 0.025 + bump * 0.6;
    // la carretera: rayas y árboles hacia atrás (se ve por la rendija)
    const v = F.speed * dt;
    for (const d of F.dashes) { d.position.z += v; if (d.position.z > 42) d.position.z -= 40.8; }
    for (const tr of F.trees) { tr.position.z += v; if (tr.position.z > 44) tr.position.z -= 42.4; }
    for (const o of F.ride) { o.position.z += v; if (o.position.z > 40) o.visible = false; }
    F.ride = F.ride.filter((o) => o.visible);
    for (const r of F.rainS) { r.position.y -= rawDt * 7; r.position.z += rawDt * 2; if (r.position.y < -0.9) { r.position.y = 2.6; r.position.z = frand(2.5, 9); } }
    // la gota: cae de la grieta a la rodilla cada dropEvery segundos
    if (F.dropsOn) {
      F.dropT += dt;
      if (F.dropY < 0 && F.dropT >= F.dropEvery - 0.5) { F.dropY = 0; F.dropM.visible = true; }
      if (F.dropY >= 0) {
        F.dropY += dt; const k = Math.min(1, 0.5 * 9.8 * F.dropY * F.dropY / (F.DROP_TOP.y - F.KNEE.y));
        F.dropM.position.lerpVectors(F.DROP_TOP, F.KNEE, k);
        if (k >= 1) { F.dropM.visible = false; F.dropY = -1; F.dropT = 0; F.impacts++; SceneAudio.drop(); F.wet.scale.x = F.wet.scale.z = Math.min(1, F.wet.scale.x + 0.08); if (S.onDrop) S.onDrop(S); }
      } else if (F.dropT < 0.1) F.dropM.visible = false;
    }
    // el guardia: el dedo tiembla, la carabina se mueve con los pasos del guion, la cabeza mira la rendija al final
    const gn = F.gun;
    gn.rotation.y = damp(gn.rotation.y, F.gunAim, 4, dt);
    gn.rotation.z = damp(gn.rotation.z, F.gunLift, 6, dt);
    gn.position.y = 0.67 + F.gunLift * 0.25; gn.position.x = 0.6 - F.gunLift * 0.06;
    F.finger.position.set(-0.025, -0.02 + (F.fingerFlat ? 0.04 : 0), F.fingerFlat ? -0.2 : -0.12 + Math.sin(t * 23) * 0.004 * F.fingerTremble);
    F.finger.rotation.y = Math.sin(t * 31) * 0.12 * F.fingerTremble;
    F.notch.visible = true;
    F.head.rotation.y = damp(F.head.rotation.y, F.headLook, 3, dt);
    F.torso.rotation.z = F.straight ? damp(F.torso.rotation.z, -0.06, 8, dt) : damp(F.torso.rotation.z, 0.04, 2, dt);
    // la mano derecha sigue la empuñadura; la izquierda, el guardamanos
    const grip = this.wp(gn, 0, -0.02, -0.15), fore = this.wp(gn, 0, -0.03, 0.12);
    this.reach(F.armR, grip); this.reach(F.armL, fore);
    // la luz de la lámpara se acerca a su cara o se aleja de ella
    F.faceLit = F.swing > 0.18;
  },
  // brazo de dos tramos que apunta a un punto (aproximado, estilo cuadrado)
  reach(arm, p) {
    const sh = this.wp(arm), d = _v1.copy(p).sub(sh); arm.parent.updateWorldMatrix(true, false);
    const inv = new THREE.Matrix4().copy(arm.parent.matrixWorld).invert(); const dl = d.clone().transformDirection(inv); const L0 = Math.max(0.2, d.length());
    arm.rotation.set(0, 0, 0); arm.rotation.z = Math.atan2(-dl.x, -dl.y) * -1 + Math.PI * 0; arm.rotation.x = Math.atan2(dl.z, -dl.y) * 0.5;
    const fore = arm.userData.fore; fore.rotation.set(0, 0, 0); fore.rotation.z = clamp(Math.PI / 2 - Math.atan2(-dl.y, -dl.x) - arm.rotation.z, -0.6, 1.4) * 0.6 + clamp((0.62 - L0) * 2, 0, 1.2);
    fore.rotation.y = Math.atan2(dl.z, -dl.x) * 0.8;
  },
  dispose(S) {
    const F = S.set; if (!F) return;
    for (const t of F.tex) t.dispose();
    S.set = null;
  },
};

// =====================================================================
// GUIONES. Los textos de la novela van citados tal cual (prólogo).
// =====================================================================
const SAY = (es, en, o) => Step.say(es, en, o);
const SCENES = {
  furgon1: {
    setup(S) {
      FurgonSet.build(S);
      S.yawC = -Math.PI / 2; S.yaw = S.yawC; S.pitch = -0.08; S.yawR = 2.1;
      S.eye.copy(S.set.EYE);
      MODES.campaign.noAmbience = true; Ambience.stop();
      SceneAudio.startTruck();
    },
    update(S, dt, rawDt) { FurgonSet.update(S, dt, rawDt); if (!SceneAudio.loops.length) SceneAudio.startTruck(); },
    teardown(S) { FurgonSet.dispose(S); },
    steps: [
      Step.card({ es: 'Prólogo', en: 'Prologue' }, { es: 'El furgón', en: 'The Van' }, campHead(CAMP_BY_ID['P0-I'])),
      Step.fade(0, 2.4, false),
      SAY('Llueve desde que salimos de San Elías y el agua entra por una grieta del toldo justo encima de mi rodilla izquierda.', 'It has been raining since we left San Elías, and the water comes in through a crack in the canvas right above my left knee.'),
      // --- las gotas ---
      Step.run((S) => { const F = S.set; F.dropsOn = true; F.dropT = 6; F.impacts = 0; S.seenDrops = 0; S.lastSeenDropT = null;
        S.onDrop = (S2) => { if (Scenes.angleTo(F.KNEE) < 0.42) S2.seenDrops++; }; }),
      Step.goal('Mira la gota que cae sobre tu rodilla y cuenta cada cuánto cae.', 'Watch the drop falling on your knee and count how often it falls.'),
      { kind: 'gaze', at: (S) => S.set.KNEE, tick(S, dt) {
        const F = S.set, looking = Scenes.angleTo(F.KNEE) < 0.45;
        // mientras la mira, Santiago cuenta los segundos (un toque suave por segundo)
        if (looking) { S._c = (S._c || 0) + dt; if (S._c >= 1) { S._c -= 1; SceneAudio.count(); } } else S._c = 0;
        if (S.seenDrops >= 2) return true;
        if (S.stepT > 40 && !S._hint) { S._hint = 1; Scenes.setGoal(L({ es: 'Baja la vista a tu rodilla izquierda. Espera dos gotas.', en: 'Look down at your left knee. Wait for two drops.' })); }
        return false; } },
      Step.goal(null),
      Step.choice({ es: '¿Cada cuánto cae una gota?', en: 'How often does a drop fall?' }, [{ es: 'Cada nueve segundos', en: 'Every nine seconds' }, { es: 'Cada once segundos', en: 'Every eleven seconds' }, { es: 'Cada trece segundos', en: 'Every thirteen seconds' }], 1,
        [{ es: 'Al principio eran nueve. Ya no. Cuenta otra vez.', en: 'At first it was nine. Not any more. Count again.' }, { es: '', en: '' }, { es: 'Todavía no. Si la pendiente sigue así, dentro de veinte minutos. Cuenta otra vez.', en: 'Not yet. If the slope keeps up, in twenty minutes. Count again.' }]),
      SAY('Cae una gota cada once segundos. Al principio eran nueve. El camión ha empezado a subir y el toldo se tensa de otra manera, así que ahora son once, y si la pendiente sigue así dentro de veinte minutos serán trece.', 'A drop falls every eleven seconds. At first it was nine. The truck has started to climb and the canvas pulls tight another way, so now it is eleven, and if the slope keeps up, in twenty minutes it will be thirteen.'),
      SAY('No lo pienso porque quiera. Lo pienso porque es lo que hago. Es lo que hago desde que tenía seis años y mi madre me sentaba en el banco de la plaza de Corcovado y me decía: cierra los ojos, Santi, y dime qué cambió.', 'I don’t think it because I want to. I think it because it is what I do. It is what I have done since I was six and my mother sat me on the bench in the square at Corcovado and said: close your eyes, Santi, and tell me what changed.', { cls: 'mem' }),
      // --- leer al guardia (Mirar) ---
      Step.goal('Mantén <kbd>Q</kbd> (o el botón central del ratón) para <b>mirar</b>. Lee al guardia.', 'Hold <kbd>Q</kbd> (or the middle mouse button) to <b>look</b>. Read the guard.'),
      { tick(S) { return Scenes.looking() && S.stepT > 0.3 || S.stepT > 14; } },
      Step.find([
        { id: 'chain', r: 0.2, pos: () => _v3.set(-0.34, 0.05, 0.5), text: { es: 'Llevo las manos esposadas a una argolla soldada al suelo y los tobillos unidos por una cadena que alguien ha engrasado hace poco, porque huele a sebo y no hace ruido cuando me muevo.', en: 'My hands are cuffed to a ring welded to the floor and my ankles joined by a chain someone greased not long ago, because it smells of tallow and makes no sound when I move.' } },
        { id: 'coat', r: 0.16, pos: (S) => FurgonSet.wp(S.set.armL.userData.fore, -0.25, 0, 0), text: { es: 'Lleva el capote del Cuerpo de Prisiones demasiado grande, con las mangas dobladas dos vueltas, lo que significa que no es suyo o que se lo dieron a última hora.', en: 'He wears the Prison Corps greatcoat too big, the sleeves turned back twice, which means it isn’t his or they gave it to him at the last minute.' } },
        { id: 'safety', r: 0.12, pos: (S) => FurgonSet.wp(S.set.notch), text: [{ es: 'El seguro está quitado. Lo vi al subir, antes de que cerraran la compuerta: la palanca hacia la izquierda, la pequeña muesca roja a la vista.', en: 'The safety is off. I saw it as I got in, before they shut the tailgate: the lever to the left, the little red notch showing.' }, { es: 'Lleva así cuarenta minutos. Nadie aguanta cuarenta minutos con el seguro quitado en un camión que da saltos, salvo que le hayan dicho que lo tenga así.', en: 'He has been like that for forty minutes. Nobody keeps the safety off for forty minutes in a jolting truck unless he has been told to.' }] },
        { id: 'face', r: 0.14, avail: (S) => S.set.faceLit, pos: (S) => FurgonSet.wp(S.set.head, -0.12, -0.05, 0), text: { es: 'Cuando la luz se acerca a su cara le veo una peca grande debajo del ojo derecho y una cicatriz fina en el mentón, de las que se hacen los niños al caerse de una tapia. Cuando la luz se aleja, solo le veo los ojos.', en: 'When the light swings near his face I see a big freckle under his right eye and a thin scar on his chin, the kind boys get falling off a wall. When the light swings away, I only see his eyes.' } },
        { id: 'finger', r: 0.12, pos: (S) => FurgonSet.wp(S.set.finger), text: { es: 'Tiene miedo. No de mí. Bueno, también de mí. Pero sobre todo tiene miedo de algo que todavía no ha hecho.', en: 'He is afraid. Not of me. Well, of me too. But mostly he is afraid of something he hasn’t done yet.' } },
      ], 5, (n, k) => L({ es: `Lee al guardia: mantén <kbd>Q</kbd> y fíjate en los detalles · ${n}/${k}`, en: `Read the guard: hold <kbd>Q</kbd> and notice the details · ${n}/${k}` }) + (n >= 3 ? `<small>${L({ es: 'Algunos detalles solo se ven cuando la lámpara se acerca.', en: 'Some details only show when the lamp swings close.' })}</small>` : '')),
      SAY('—Te tiembla el dedo —le digo.', '“Your finger’s shaking,” I tell him.'),
      Step.run((S) => { const F = S.set; F.straight = true; F.fingerTremble = 0; F.fingerFlat = true; SceneAudio.thud(0.25); }),
      SAY('Es lo primero que digo desde que salimos.', 'It is the first thing I have said since we left.'),
      SAY('Él se endereza como si le hubiera pinchado. Aprieta la carabina. El dedo, efectivamente, deja de temblar, porque lo ha sacado del guardamonte y lo ha puesto plano sobre el cajón de madera. Bien. Eso le enseñaron. Alguien se molestó en enseñarle bien.', 'He straightens as if I had pricked him. He grips the carbine. The finger does stop shaking, because he has taken it out of the trigger guard and laid it flat along the wooden stock. Good. They taught him that. Someone took the trouble to teach him well.'),
      SAY('—Cállese.', '“Shut up.”'),
      SAY('—Me callo.', '“I’m shutting up.”'),
      SAY('Pasan tres gotas. Treinta y tres segundos.', 'Three drops go by. Thirty-three seconds.'),
      SAY('—Es que si sigues así se te va a ir sin querer en un bache —añado—. Y luego te van a preguntar en qué kilómetro fue. Y tú no vas a saber decirlo, porque no has mirado ni una sola vez por la rendija. Y eso queda mal en un informe.', '“It’s just that if you carry on like that it’ll go off by accident on a bump,” I add. “And then they’ll ask you what kilometre it was. And you won’t be able to say, because you haven’t looked out through the slit once. And that looks bad in a report.”'),
      SAY('—Le he dicho que se calle.', '“I told you to shut up.”'),
      // --- el kilómetro: mirar por la rendija y escuchar las ruedas ---
      Step.goal('Mira por la rendija del toldo, detrás de ti, y escucha las ruedas.', 'Look out through the slit in the canvas behind you and listen to the wheels.'),
      { kind: 'gaze', at: (S) => _v3.set(S.set.SLIT.x, 1.14, 2.29).clone(), enter(S) { S.seenOut = 0; S._seq = 0; S._seqT = 0; },
        tick(S, dt) {
          const F = S.set, slit = _v3.set(F.SLIT.x, 1.14, 2.29), out = Scenes.angleTo(slit) < 0.2;
          F.outLook = out; S._seqT += dt;
          const seq = [[1.5, () => FurgonSet.pass(F, F.posts[29], -2.35, -0.7)], [9.5, () => FurgonSet.pass(F, F.posts[30], -2.35, -0.7)], [15.5, () => { FurgonSet.pass(F, F.rail, 0, 0, 2.6); SceneAudio.bridge(3.0); }], [19.5, () => FurgonSet.pass(F, F.posts[31], -2.35, -0.7)]];
          while (S._seq < seq.length && S._seqT >= seq[S._seq][0]) { seq[S._seq][1](); S._seq++; }
          if (out && F.ride.some((o) => o.position.z < 22)) S.seenOut += dt;
          if (S._seqT > 24) { if (S.seenOut > 0.6) return true; S._seq = 0; S._seqT = 0; Scenes.setGoal(L({ es: 'Gira la cabeza hacia la compuerta: la rendija está en la lona, a la derecha. Escucha cuando las ruedas suenen huecas.', en: 'Turn toward the tailgate: the slit is in the canvas, on the right. Listen for when the wheels sound hollow.' })); for (const k in F.posts) F.posts[k].visible = false; F.rail.visible = false; }
          return false; } },
      Step.goal(null),
      Step.choice({ es: '¿Por dónde vamos?', en: 'Where are we?' }, [{ es: 'Kilómetro treinta. La recta de los eucaliptos.', en: 'Kilometre thirty. The eucalyptus straight.' }, { es: 'Kilómetro treinta y uno. El puente de la Viuda.', en: 'Kilometre thirty-one. The Widow’s bridge.' }, { es: 'La curva del Ahorcado.', en: 'Hanged Man’s bend.' }], 1,
        [{ es: 'No. El mojón del treinta ya quedó atrás, y luego las ruedas sonaron huecas.', en: 'No. The thirty marker is already behind us, and then the wheels sounded hollow.' }, { es: '', en: '' }, { es: 'No. Esa curva tiene nombre, y todavía queda lejos.', en: 'No. That bend has a name, and it is still a long way off.' }]),
      SAY('—Kilómetro treinta y uno —digo—. Acabamos de pasar el puente de la Viuda. Se oye distinto debajo de las ruedas, hueco. Dentro de seis minutos viene la recta de los eucaliptos, que es donde yo lo haría, si fuera tú. Hay buen arcén. El conductor puede parar sin meterse en la cuneta. Después ya no hay arcén hasta la curva del Ahorcado, y ahí no, porque la curva tiene nombre, y los sitios con nombre los recuerda la gente.', '“Kilometre thirty-one,” I say. “We’ve just crossed the Widow’s bridge. It sounds different under the wheels, hollow. In six minutes comes the eucalyptus straight, which is where I’d do it, if I were you. There’s a good verge. The driver can stop without going into the ditch. After that there’s no verge until Hanged Man’s bend, and not there, because the bend has a name, and people remember places with names.”'),
      SAY('No dice nada.', 'He says nothing.'),
      SAY('—¿Cómo sabe eso? —pregunta al fin. Muy bajo. No es una pregunta para mí; es una pregunta que se le escapa.', '“How do you know that?” he asks at last. Very low. It isn’t a question for me; it’s a question that slips out of him.'),
      SAY('—Porque me han trasladado de noche, con lluvia, en un camión sin escolta, con un solo guardia de diecinueve años al que le han dado un capote ajeno y la orden de llevar el seguro quitado. Porque al subir el sargento te ha puesto la mano en la nuca, así, como se le pone a un perro que va a hacer algo por primera vez.', '“Because they’re moving me at night, in the rain, in a truck with no escort, with a single nineteen-year-old guard who’s been given someone else’s coat and orders to keep the safety off. Because when we got in the sergeant put his hand on the back of your neck, like this, the way you do with a dog that’s about to do something for the first time.”'),
      SAY('—Porque el conductor no ha encendido ni un cigarro y los conductores de prisiones fuman como chimeneas, así que no quiere que haya una colilla con sus dientes en la cuneta. Porque la cadena está engrasada. —Muevo los pies. No suena nada—. ¿Ves? Nada. Muy bien pensado. Esto lo pensó alguien que sabe.', '“Because the driver hasn’t lit a single cigarette and prison drivers smoke like chimneys, so he doesn’t want a butt with his teeth marks in the ditch. Because the chain is greased.” I move my feet. Not a sound. “See? Nothing. Very well thought out. Someone who knows thought this up.”'),
      Step.run((S) => { SceneAudio.gear(); SceneAudio.river(true); }),
      SAY('Fuera, el camión cambia de marcha. El motor protesta, rasca, sube un tono. Detrás del ruido, si escucho bien, se oye el río, muy abajo, a la izquierda.', 'Outside, the truck changes gear. The engine complains, grinds, climbs a tone. Behind the noise, if I listen hard, I can hear the river, far below, on the left.'),
      SAY('Este es el río Ocoa, que más adelante se junta con el Lerma, y el Lerma baja por la llanura hasta Corcovado, y pasa por debajo de un puente de hierro que ya no existe.', 'This is the river Ocoa, which further on joins the Lerma, and the Lerma runs down across the plain to Corcovado, and passes under an iron bridge that no longer exists.'),
      SAY('No pienso en el puente.', 'I don’t think about the bridge.', { cls: 'inner' }),
      SAY('—Ley de fugas —digo—. Se llama así. Te lo habrán dicho con otras palabras porque eres nuevo y las palabras feas se dicen con cuidado a los nuevos. Te habrán dicho que soy peligroso, lo cual es verdad. Que puedo intentar escapar, lo cual es mentira. Que si lo intento tienes que disparar, lo cual es lo que de verdad te han dicho.', '“The law of flight,” I say. “That’s what it’s called. They’ll have told you in other words, because you’re new and ugly words are said carefully to new ones. They’ll have told you I’m dangerous, which is true. That I might try to escape, which is a lie. That if I try you have to shoot, which is what they really told you.”'),
      SAY('—Y te habrán dicho también, aparte, el sargento solo, sin que lo oyera nadie, que si no lo intento, da igual. Que se escribe igual.', '“And they’ll also have told you, separately, the sergeant alone, with nobody else listening, that if I don’t try, it makes no difference. That it gets written the same.”'),
      SAY('—No te preocupes —le digo—. No te lo voy a poner difícil. No voy a correr. No voy a gritar. No te voy a pedir nada. Cuando llegue la recta de los eucaliptos, si quieres hacerlo, hazlo. Te miraré, eso sí. No me gusta que me disparen por la espalda. Ya me pasó una vez y la bala tardó cuatro años en salir.', '“Don’t worry,” I tell him. “I won’t make it hard for you. I won’t run. I won’t shout. I won’t ask you for anything. When the eucalyptus straight comes, if you want to do it, do it. I’ll look at you, though. I don’t like being shot in the back. It happened to me once and the bullet took four years to come out.”'),
      // --- las manos ---
      SAY('Y entonces lo hace. Lo que todos hacen cuando han oído hablar de mí durante semanas en los periódicos, en las cantinas, en la radio, en el patio del cuartel. Me mira las manos.', 'And then he does it. What everyone does when they’ve heard about me for weeks in the papers, in the canteens, on the radio, in the barracks yard. He looks at my hands.'),
      Step.goal('Mírate las manos.', 'Look at your hands.'),
      Step.gaze((S) => FurgonSet.wp(S.set.hands, 0.02, 0, 0), 0.22, 0.6),
      Step.goal(null),
      SAY('Siempre me miran las manos. Como si en las manos fuera a ver algo. Son manos normales. Un poco anchas en la palma, dedos largos, la uña del pulgar derecho partida en dos por un martillo cuando tenía quince años y arreglaba la bomba de agua del patio de mi casa.', 'They always look at my hands. As if they would see something in my hands. They’re ordinary hands. A little broad in the palm, long fingers, the nail of the right thumb split in two by a hammer when I was fifteen, fixing the water pump in our yard at home.'),
      SAY('Las yemas suaves. Mi madre decía que un relojero no puede tener callos en las yemas porque no siente el muelle. No tengo callos.', 'Soft fingertips. My mother used to say a watchmaker can’t have calluses on his fingertips because he can’t feel the spring. I have no calluses.', { cls: 'mem' }),
      SAY('—Dicen... —empieza.', '“They say...” he begins.'),
      SAY('—Dicen muchas cosas.', '“They say a lot of things.”'),
      SAY('—Dicen que usted mató a cuatrocientos.', '“They say you killed four hundred.”'),
      SAY('—Eso es mentira.', '“That’s a lie.”'),
      SAY('Él asiente, casi aliviado.', 'He nods, almost relieved.'),
      SAY('—Fueron más —digo—. Pero no sé cuántos. Al principio los contaba. Luego conté otra cosa.', '“It was more,” I say. “But I don’t know how many. At first I counted them. Then I counted something else.”'),
      SAY('El alivio se le cae de la cara como un plato.', 'The relief drops off his face like a plate.'),
      // --- la curva: un segundo y una décima ---
      Step.run((S) => { const F = S.set; S.scriptCurve = true; F.curve = 0.9; F.swingV += 2.2; SceneAudio.thud(0.5); }),
      Step.wait(0.45),
      Step.run((S) => { const F = S.set; F.gunLift = 0.9; F.gunAim = 1.35; S.timeScale = 0.22; }),
      Step.goal('Mira.', 'Look.'),
      Step.find([{ id: 'barrel', r: 0.2, pos: (S) => FurgonSet.wp(S.set.gun, 0, 0.04, 0.5), text: [{ es: 'Fuera, el camión toma una curva cerrada a la derecha y la lámpara se va hacia él y le quema casi el capote. Él la aparta con el cañón de la carabina sin darse cuenta de que, durante un segundo entero, el cañón ha dejado de apuntarme.', en: 'Outside, the truck takes a sharp right-hand bend and the lamp swings toward him and almost scorches his coat. He pushes it away with the barrel of the carbine without realising that, for one whole second, the barrel has stopped pointing at me.' }, { es: 'Lo veo. Lo cuento. Un segundo y una décima. Suficiente para cuatro cosas distintas que no voy a hacer.', en: 'I see it. I count it. One second and a tenth. Enough for four different things I am not going to do.' }] }],
        1, () => L({ es: 'Mira. Mantén <kbd>Q</kbd>.', en: 'Look. Hold <kbd>Q</kbd>.' })),
      Step.run((S) => { const F = S.set; S.timeScale = 1; F.gunLift = 0; F.gunAim = 0.55; S.scriptCurve = false; F.curveTo = 0; }),
      SAY('—¿Por qué me cuenta todo esto? —pregunta.', '“Why are you telling me all this?” he asks.'),
      SAY('Es una buena pregunta. Me la he hecho yo también desde que salimos de la prisión provincial y me sentaron delante de él. No hablo con nadie desde hace seis meses. Ni con el juez. Ni con el abogado de oficio que me asignaron. Ni con el capellán de la provincial, que vino tres veces con su librito negro y su olor a cera de vela.', 'It’s a good question. I have asked it myself since we left the provincial prison and they sat me down in front of him. I haven’t spoken to anyone for six months. Not the judge. Not the court-appointed lawyer. Not the chaplain at the provincial, who came three times with his little black book and his smell of candle wax.'),
      SAY('Ese olor. No pienso en ese olor.', 'That smell. I don’t think about that smell.', { cls: 'inner' }),
      SAY('—Porque tienes cuatro horas de camino hasta el penal —digo—. Y yo tengo cuatro horas de vida, más o menos, según lo que decidas. Y porque no me has preguntado lo que te dijeron que no me preguntaras.', '“Because you’ve got four hours on the road to the penitentiary,” I say. “And I’ve got four hours to live, more or less, depending on what you decide. And because you haven’t asked me what they told you not to ask.”'),
      SAY('—Así que te propongo un trato. No es un trato de verdad, porque tú tienes la carabina y yo tengo una cadena engrasada. Es más bien una oferta. Yo te cuento una historia. Empieza hace seis años en un pueblo con once relojes y termina aquí, en este camión, con una gota que cae cada once segundos sobre mi rodilla.', '“So I’m proposing a deal. It isn’t a real deal, because you have the carbine and I have a greased chain. It’s more of an offer. I tell you a story. It begins six years ago in a town with eleven clocks and ends here, in this truck, with a drop that falls every eleven seconds on my knee.”'),
      SAY('—Tú escuchas. Y cuando lleguemos a la recta de los eucaliptos, o a la curva del Ahorcado, o a la puerta del penal, haces lo que te parezca. Lo que tú decidas. No lo que te dijeron.', '“You listen. And when we reach the eucalyptus straight, or Hanged Man’s bend, or the gate of the penitentiary, you do what you see fit. What you decide. Not what they told you.”'),
      SAY('—¿Y por qué iba a cambiar algo?', '“And why would that change anything?”'),
      SAY('—No sé si va a cambiar algo. —Me encojo de hombros. La cadena no suena—. Pero así, por lo menos, sabrás lo que haces.', '“I don’t know if it’ll change anything.” I shrug. The chain makes no sound. “But this way, at least, you’ll know what you’re doing.”'),
      Step.run((S) => { const F = S.set; F.headLook = -1.25; FurgonSet.pass(F, F.cross, -2.4, 0, 3.2); }),
      SAY('Él mira la rendija del toldo. Es la primera vez que mira afuera. Está muy oscuro, pero veo en sus ojos el reflejo gris de una ladera, y luego el reflejo de una cruz de piedra en el arcén, y luego nada.', 'He looks at the slit in the canvas. It’s the first time he has looked outside. It’s very dark, but I see in his eyes the grey reflection of a hillside, and then the reflection of a stone cross on the verge, and then nothing.'),
      Step.run((S) => { S.set.headLook = 0; }),
      SAY('—Me llamaban de muchas maneras —le digo—. Mi madre me llamaba Santi. Mi padre, campeón, por una carrera de bicicletas que gané a los nueve años y que en realidad no gané, porque al que iba primero se le salió la cadena. Mis compañeros de la Politécnica me llamaban Fierritos, que es lo que pasa cuando te apellidas así y eres el más flaco de la clase.', '“They called me lots of things,” I tell him. “My mother called me Santi. My father, champ, after a bicycle race I won when I was nine and didn’t really win, because the boy in front’s chain came off. My classmates at the Polytechnic called me Fierritos, which is what happens when that’s your surname and you’re the skinniest in the class.”'),
      SAY('—En el sitio donde estuve después me pusieron un nombre de niño cantor, para que nunca se me olvidara que era el más pequeño. Y los periódicos, al final, me pusieron otro. El que tú conoces. El que te han dicho en el cuartel. Por ese te tiembla el dedo.', '“In the place I went afterwards they gave me a choirboy’s name, so I’d never forget I was the smallest. And the papers, in the end, gave me another. The one you know. The one they told you at the barracks. That’s why your finger shakes.”'),
      SAY('—Yo no...', '“I don’t...”'),
      SAY('—Pero me llamo Santiago Fierros Lazcano —le digo—. Nací el catorce de marzo de mil novecientos dieciocho en Villa Corcovado, calle de los Herreros, número siete. Mi madre se llamaba Amparo. Mi padre se llamaba Joaquín. Y hace seis años yo era un muchacho que se reía muy fuerte.', '“But my name is Santiago Fierros Lazcano,” I tell him. “I was born on the fourteenth of March, nineteen eighteen, in Villa Corcovado, calle de los Herreros, number seven. My mother’s name was Amparo. My father’s name was Joaquín. And six years ago I was a boy who laughed very loud.”'),
      SAY('Él me mira. Yo lo miro.', 'He looks at me. I look at him.'),
      // --- lo que vio al subir ---
      Step.goal('Mira cómo sujeta la carabina.', 'Look at how he holds the carbine.'),
      Step.find([{ id: 'thumb', r: 0.2, pos: (S) => FurgonSet.wp(S.set.thumb, 0, -0.02, 0.03), text: [{ es: 'Algo que vi en el primer minuto, al subir: apoyó la carabina en el muslo con la culata un poco ladeada hacia fuera, el pulgar estirado sobre la garganta del arma en vez de cerrado en torno a ella, una manía de tirador zurdo al que obligaron a disparar con la derecha.', en: 'Something I saw in the first minute, as I got in: he rested the carbine on his thigh with the stock tilted slightly outward, the thumb stretched along the wrist of the stock instead of wrapped around it, the habit of a left-handed shooter made to fire right-handed.' }, { es: 'Una manía rara. Una manía que yo solo había visto una vez en mi vida, en otro muchacho, en otro lugar, hace mucho.', en: 'An odd habit. A habit I had seen only once in my life, in another boy, in another place, long ago.' }, { es: 'No se lo digo. Todavía no.', en: 'I don’t tell him. Not yet.', o: { cls: 'inner' } }] }],
        1, () => L({ es: 'Mira cómo sujeta la carabina: su mano derecha, sobre la culata. Mantén <kbd>Q</kbd>.', en: 'Look at how he holds the carbine: his right hand, on the stock. Hold <kbd>Q</kbd>.' })),
      SAY('—¿Cómo te llamas? —le pregunto.', '“What’s your name?” I ask him.'),
      SAY('Duda.', 'He hesitates.'),
      SAY('—No le importa.', '“It’s none of your business.”'),
      SAY('—No. Supongo que no.', '“No. I suppose not.”'),
      Step.run(() => SceneAudio.gear()),
      SAY('El camión cambia de marcha otra vez. Pasan dos gotas. La lámpara se balancea.', 'The truck changes gear again. Two drops go by. The lamp swings.'),
      Step.fade(1, 3.5),
      Step.run((S) => { S.noLook = true; Scenes.card('', L({ es: 'Y empiezo.', en: 'And I begin.' }), ''); SceneAudio.ticTac(4); }),
      Step.wait(4.6),
      Step.run(() => { Scenes.card('', '', L({ es: 'El furgón vuelve al principio de cada parte.', en: 'The van returns at the start of every part.' })); }),
      Step.wait(4.2),
    ],
  },
};
