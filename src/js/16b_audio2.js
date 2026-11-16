// ---- 16b_audio2.js ----
// =====================================================================
// SONIDO 3.4.0 — ambiente de época y sonidos del modo historia
// · Ambiente natural además de la batalla lejana: pájaros de día, grillos de noche, perros, campana de la iglesia,
//   rachas de viento; todo sintetizado (sin muestras grabadas), muy bajo y con paneo.
// · CS: sonidos de la campaña (traídos del prototipo v4): campanas de bronce con eco de valle, roce tras la pared,
//   crujido del entibado, gota, tos, tren de vía estrecha, ametralladoras lejanas, rueda de la polea, carburo.
// =====================================================================
const CS = (() => {
  const A = () => (AUDIO.ok && AUDIO.ctx && AUDIO.ctx.state === 'running' ? { ac: AUDIO.ctx, noise: AUDIO.noise, out: AUDIO.sfxGain } : null);
  const env = (a, t, v, at, dur) => { const g = a.ac.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(Math.max(0.0001, v), t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); return g; };
  const noiseSrc = (a, t, dur) => { const s = a.ac.createBufferSource(); s.buffer = a.noise; s.loop = true; s.start(t, Math.random()); s.stop(t + dur + 0.05); return s; };
  const filt = (a, type, f, q = 1) => { const x = a.ac.createBiquadFilter(); x.type = type; x.frequency.value = f; x.Q.value = q; return x; };
  const out = (a, node, pan = 0) => { if (a.ac.createStereoPanner) { const p = a.ac.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); node.connect(p); p.connect(a.out); } else node.connect(a.out); };
  return {
    // campanada de bronce: parciales inarmónicos con caída larga y ecos en las laderas (dist: metros al campanario)
    bell(dist = 30, vol = 1, pan = 0) {
      const a = A(); if (!a) return; const t0 = a.ac.currentTime + Math.min(3, dist / 340), base = 196;
      const hit = (t, v, lp) => { const f = filt(a, 'lowpass', lp); for (const [k, g, d] of [[0.5, 0.5, 4.5], [1, 1, 3.6], [1.183, 0.5, 2.6], [1.506, 0.45, 2.2], [2, 0.35, 1.8], [2.5, 0.2, 1.2], [3.01, 0.12, 0.9]]) { const o = a.ac.createOscillator(); o.frequency.value = base * k * (1 + (Math.random() - 0.5) * 0.002); const e = env(a, t, v * g * 0.16, 0.005, d); o.connect(e); e.connect(f); o.start(t); o.stop(t + d + 0.1); }
        const n = noiseSrc(a, t, 0.08), nf = filt(a, 'bandpass', 2400, 1.5), ne = env(a, t, v * 0.2, 0.002, 0.08); n.connect(nf); nf.connect(ne); ne.connect(f); out(a, f, pan); };
      const k = vol * Math.min(1, 60 / Math.max(20, dist)) * 1.2; hit(t0, k, 6000 * Math.exp(-dist / 900) + 900);
      for (const [d, g] of [[0.55, 0.35], [1.1, 0.25], [1.7, 0.18], [2.6, 0.1]]) hit(t0 + d, k * g, 1500);
    },
    scrape(vol = 0.25) { const a = A(); if (!a) return; const t = a.ac.currentTime; for (let i = 0; i < 3; i++) { const tt = t + i * (0.28 + Math.random() * 0.2), n = noiseSrc(a, tt, 0.22), f = filt(a, 'bandpass', 900 + Math.random() * 400, 2.5), e = env(a, tt, vol * (0.6 + Math.random() * 0.4), 0.04, 0.22); n.connect(f); f.connect(e); out(a, e, Math.random() * 0.2 - 0.1); } },
    moan(vol = 0.12) { const a = A(); if (!a) return; const t = a.ac.currentTime, o = a.ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(118, t); o.frequency.linearRampToValueAtTime(96, t + 2.4); const f = filt(a, 'lowpass', 380, 0.8), e = env(a, t, vol, 0.6, 2.6); o.connect(f); f.connect(e); out(a, e); o.start(t); o.stop(t + 2.7); },
    creak(vol = 0.5) { const a = A(); if (!a) return; const t = a.ac.currentTime; for (let i = 0; i < 7; i++) { const tt = t + i * 0.045 + Math.random() * 0.02, o = a.ac.createOscillator(); o.type = 'square'; o.frequency.value = 160 + Math.random() * 90; const f = filt(a, 'bandpass', 700, 4), e = env(a, tt, vol * 0.25, 0.003, 0.07); o.connect(f); f.connect(e); out(a, e); o.start(tt); o.stop(tt + 0.09); } const n = noiseSrc(a, t + 0.1, 0.4), f2 = filt(a, 'lowpass', 300), e2 = env(a, t + 0.1, vol * 0.3, 0.05, 0.4); n.connect(f2); f2.connect(e2); out(a, e2); },
    drip(vol = 0.2) { const a = A(); if (!a) return; const t = a.ac.currentTime, o = a.ac.createOscillator(); o.frequency.setValueAtTime(1800, t); o.frequency.exponentialRampToValueAtTime(600, t + 0.05); const e = env(a, t, vol, 0.002, 0.08); o.connect(e); out(a, e, Math.random() - 0.5); o.start(t); o.stop(t + 0.1); },
    cough(vol = 0.4) { const a = A(); if (!a) return; const t = a.ac.currentTime; for (let i = 0; i < 2; i++) { const tt = t + i * 0.3, n = noiseSrc(a, tt, 0.2), f = filt(a, 'bandpass', 500, 1.2), e = env(a, tt, vol, 0.01, 0.2); n.connect(f); f.connect(e); out(a, e); } },
    whistle(dist = 60, n = 2) { const a = A(); if (!a) return; const t = a.ac.currentTime + dist / 340; for (let i = 0; i < n; i++) { const tt = t + i * 0.55; for (const fq of [740, 932, 1110]) { const o = a.ac.createOscillator(); o.type = 'triangle'; o.frequency.value = fq; const f = filt(a, 'lowpass', 3000 * Math.exp(-dist / 900) + 600), e = env(a, tt, 0.07 * Math.min(1, 80 / dist), 0.03, 0.4); o.connect(f); f.connect(e); out(a, e); o.start(tt); o.stop(tt + 0.45); } } },
    chuff(dist = 40) { const a = A(); if (!a) return; const t = a.ac.currentTime, n = noiseSrc(a, t, 0.25), f = filt(a, 'bandpass', 500, 0.8), e = env(a, t, 0.25 * Math.min(1, 40 / Math.max(1, dist)), 0.02, 0.25); n.connect(f); f.connect(e); out(a, e); },
    // ráfaga lejana de ametralladora: «como una sábana que se rasga despacio»
    mgBurst(dist = 626, n = 8, pan = 0) { const a = A(); if (!a) return; const t = a.ac.currentTime + Math.min(2.2, dist / 340); for (let i = 0; i < n; i++) { const tt = t + i * 0.1 + Math.random() * 0.015, s = noiseSrc(a, tt, 0.12), f = filt(a, 'lowpass', 900, 0.7), e = env(a, tt, 0.16, 0.003, 0.14); s.connect(f); f.connect(e); out(a, e, pan); } },
    shotFar(dist = 626, pan = 0) { const a = A(); if (!a) return; const t = a.ac.currentTime + Math.min(2.2, dist / 340), s = noiseSrc(a, t, 0.5), f = filt(a, 'lowpass', 700), e = env(a, t, 0.2, 0.003, 0.5); s.connect(f); f.connect(e); out(a, e, pan); },
    retch(vol = 0.4) { const a = A(); if (!a) return; const t = a.ac.currentTime; for (let i = 0; i < 3; i++) { const tt = t + i * 0.55, n = noiseSrc(a, tt, 0.4), f = filt(a, 'lowpass', 420, 1.4), e = env(a, tt, vol * (1 - i * 0.2), 0.05, 0.4); n.connect(f); f.connect(e); out(a, e); } },
    thump(vol = 0.5, dist = 40) { const a = A(); if (!a) return; const t = a.ac.currentTime + dist / 340, o = a.ac.createOscillator(); o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(40, t + 0.15); const e = env(a, t, vol * Math.min(1, 30 / Math.max(1, dist)), 0.004, 0.2); o.connect(e); out(a, e); o.start(t); o.stop(t + 0.25); },
    rung() { const a = A(); if (!a) return; const t = a.ac.currentTime; const o = a.ac.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.06); const e = env(a, t, 0.05, 0.002, 0.08); o.connect(e); out(a, e); o.start(t); o.stop(t + 0.1); },
    lock() { const a = A(); if (!a) return; const t = a.ac.currentTime; for (const [d, f] of [[0, 1400], [0.2, 900]]) { const n = noiseSrc(a, t + d, 0.04), fl = filt(a, 'bandpass', f, 4), e = env(a, t + d, 0.3, 0.002, 0.05); n.connect(fl); fl.connect(e); out(a, e); } },
    gate(vol = 0.3) { const a = A(); if (!a) return; const t = a.ac.currentTime, o = a.ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(240, t); o.frequency.linearRampToValueAtTime(180, t + 1.1); const f = filt(a, 'bandpass', 600, 6), e = env(a, t, vol * 0.2, 0.1, 1.2); o.connect(f); f.connect(e); out(a, e); o.start(t); o.stop(t + 1.25); },
    // fondos que duran: carburo, viento de ladera, rueda de la polea, motor, multitud
    loop(kind, vol = 0.2) {
      const a = A(); if (!a) return null; const t = a.ac.currentTime, g = a.ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 1.2); out(a, g); const nodes = [];
      if (kind === 'rain' || kind === 'wind' || kind === 'hiss' || kind === 'crowd') { const s = a.ac.createBufferSource(); s.buffer = a.noise; s.loop = true; const f = filt(a, kind === 'rain' ? 'highpass' : 'bandpass', kind === 'rain' ? 1800 : kind === 'hiss' ? 3200 : kind === 'crowd' ? 520 : 400, kind === 'wind' ? 0.4 : kind === 'crowd' ? 0.5 : 1); s.connect(f); f.connect(g); s.start(); nodes.push(s);
        if (kind === 'crowd') { const l = a.ac.createOscillator(); l.frequency.value = 0.3; const lg = a.ac.createGain(); lg.gain.value = vol * 0.35; l.connect(lg); lg.connect(g.gain); l.start(); nodes.push(l); } }
      if (kind === 'engine') { const o = a.ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = 38; const f = filt(a, 'lowpass', 160); o.connect(f); f.connect(g); o.start(); nodes.push(o); const l = a.ac.createOscillator(); l.frequency.value = 3.3; const lg = a.ac.createGain(); lg.gain.value = 5; l.connect(lg); lg.connect(o.frequency); l.start(); nodes.push(l); }
      if (kind === 'wheel') { const o = a.ac.createOscillator(); o.type = 'triangle'; o.frequency.value = 410; const f = filt(a, 'bandpass', 420, 6), am = a.ac.createGain(); am.gain.value = 0.3; const l = a.ac.createOscillator(); l.frequency.value = 1.6; const lg = a.ac.createGain(); lg.gain.value = 0.3; l.connect(lg); lg.connect(am.gain); o.connect(f); f.connect(am); am.connect(g); o.start(); l.start(); nodes.push(o, l);
        const s = a.ac.createBufferSource(); s.buffer = a.noise; s.loop = true; const f2 = filt(a, 'lowpass', 120); s.connect(f2); f2.connect(g); s.start(); nodes.push(s); }
      return { set(v, k = 0.5) { const tt = a.ac.currentTime; g.gain.cancelScheduledValues(tt); g.gain.setTargetAtTime(v, tt, k); }, stop() { const tt = a.ac.currentTime; g.gain.setTargetAtTime(0, tt, 0.4); setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch (e) { } }), 2000); } };
    },
    // ---- ambiente natural ----
    bird(pan = 0, vol = 0.03) { const a = A(); if (!a) return; const t = a.ac.currentTime, n = 2 + ((Math.random() * 4) | 0), f0 = 2600 + Math.random() * 1600;
      for (let i = 0; i < n; i++) { const tt = t + i * (0.09 + Math.random() * 0.07), o = a.ac.createOscillator(); o.frequency.setValueAtTime(f0 * (1 + Math.random() * 0.25), tt); o.frequency.exponentialRampToValueAtTime(f0 * (0.7 + Math.random() * 0.5), tt + 0.06); const e = env(a, tt, vol, 0.005, 0.07); o.connect(e); out(a, e, pan); o.start(tt); o.stop(tt + 0.09); } },
    cricket(pan = 0, vol = 0.012) { const a = A(); if (!a) return; const t = a.ac.currentTime; for (let k = 0; k < 3; k++) for (let i = 0; i < 4; i++) { const tt = t + k * 0.42 + i * 0.03, o = a.ac.createOscillator(); o.frequency.value = 4300 + Math.random() * 120; const e = env(a, tt, vol, 0.003, 0.022); o.connect(e); out(a, e, pan); o.start(tt); o.stop(tt + 0.03); } },
    dog(pan = 0, vol = 0.05) { const a = A(); if (!a) return; const t = a.ac.currentTime, n = 1 + ((Math.random() * 3) | 0);
      for (let i = 0; i < n; i++) { const tt = t + i * 0.32, o = a.ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(420, tt); o.frequency.exponentialRampToValueAtTime(260, tt + 0.12); const f = filt(a, 'bandpass', 900, 1.6), f2 = filt(a, 'lowpass', 1600), e = env(a, tt, vol, 0.01, 0.16); o.connect(f); f.connect(f2); f2.connect(e); out(a, e, pan); o.start(tt); o.stop(tt + 0.2); } },
    gust(vol = 0.05) { const a = A(); if (!a) return; const t = a.ac.currentTime, n = noiseSrc(a, t, 3.2), f = filt(a, 'bandpass', 300, 0.6); f.frequency.setValueAtTime(260, t); f.frequency.linearRampToValueAtTime(620, t + 1.4); f.frequency.linearRampToValueAtTime(240, t + 3.1); const e = env(a, t, vol, 1.2, 3.2); n.connect(f); f.connect(e); out(a, e, Math.random() * 1.4 - 0.7); },
  };
})();

// el ambiente de partida añade la vida del sitio: pájaros, grillos, perros, campana y rachas; la batalla lejana suena menos
(() => {
  const up0 = Ambience.update.bind(Ambience);
  let natT = 0;
  Ambience.update = function () {
    if (!this.on || !AUDIO.ok || AUDIO.ctx.state !== 'running') return;
    const t = AUDIO.ctx.currentTime;
    if (t >= this.nextT) { if (Math.random() < 0.55) up0(); else this.nextT = t + 4 + Math.random() * 7; }
    if (t < natT) return;
    natT = t + 1.6 + Math.random() * 3.5;
    const th = Env.th || {}, night = (th.stars || 0) > 0.2 || (th.sunI || 2) < 1.2, map = MapSys.id || '', pan = Math.random() * 1.6 - 0.8, r = Math.random();
    if (AUDIO.indoor > 0.6 || th.rain) return;
    if (night) { if (r < 0.7) CS.cricket(pan); else if (r < 0.85) CS.dog(pan, 0.025); else CS.gust(0.035); }
    else if (r < 0.55) CS.bird(pan, 0.02 + Math.random() * 0.02);
    else if (r < 0.66) CS.dog(pan, 0.03);
    else if (r < 0.9) CS.gust(0.04);
    else if (/pueblo|corcovado/.test(map) && Math.random() < 0.5) CS.bell(220 + Math.random() * 120, 0.5, pan);
  };
})();
