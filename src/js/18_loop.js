// ---- 18_loop.js ----
// =====================================================================
// LOOP — renderer, cielo y luces, timestep fijo con sub-pasos, sonidos y
// efectos ligados a eventos, etiquetas de nombre, arranque
// =====================================================================
const G = {
  scene: null, camera: null, renderer: null, root: null, sky: null, hemi: null, sun: null, sunDir: new THREE.Vector3(-0.5, 0.6, 0.35),
  fighters: [], local: null, match: null, mode: MODES.tdm, matchCfg: null,
  time: 0, tick: 0, realTime: 0, settings: { ...DEFAULT_SETTINGS }, quality: CONFIG.QUALITY.medium,
  paused: false, freeze: false, attract: false, rng: new RNG(1), roundSeed: 1, aimZoomSens: 1,
};
const STEP = 1 / CONFIG.SIM_HZ;

const Renderer = {
  safeMode: false, frames: 0, probes: 0, lost: false,
  // 3.1.4: resolución dinámica. Se dibuja a la densidad real de la pantalla (hasta el tope de la calidad) y, si los
  // cuadros tardan, baja un poco la resolución; cuando hay margen la vuelve a subir. Cambia como mucho cada 2 s.
  dyn: { ratio: 0, ema: 1 / 60, t: 0, good: 0, hold: 0 },
  ratioCap() { const q = G.quality || {}; return Math.min(window.devicePixelRatio || 1, q.pixelRatio || 1); },
  applyRatio() { const r = G.renderer; if (!r) return; const D = this.dyn, cap = this.ratioCap(), mn = Math.min(cap, (G.quality && G.quality.minRatio) || 0.75); D.ratio = clamp(D.ratio || cap, mn, cap); if (Math.abs(r.getPixelRatio() - D.ratio) > 0.01) { r.setPixelRatio(D.ratio); this.resize(); } },
  dynTick(rawDt) {
    const D = this.dyn; if (!G.renderer || !G.match || G.paused || UI.screen || rawDt > 1) return;
    D.ema += (Math.min(rawDt, 0.1) - D.ema) * 0.05; D.t += rawDt; D.hold -= rawDt;
    if (D.ema < 0.0185) D.good += rawDt; else D.good = 0;
    if (D.t < 2) return; D.t = 0;
    const cap = this.ratioCap(), mn = Math.min(cap, (G.quality && G.quality.minRatio) || 0.75);
    if (D.ema > 0.021 && D.ratio > mn + 0.01) { D.ratio = Math.max(mn, D.ratio - 0.15); D.hold = 20; this.applyRatio(); }
    else if (D.good > 6 && D.hold <= 0 && D.ratio < cap - 0.01) { D.ratio = Math.min(cap, D.ratio + 0.1); D.good = 0; this.applyRatio(); }
  },
  // 3.1.4: compila de una vez todos los materiales del mapa, de los efectos y de las armas del jugador al empezar la
  // partida (antes se compilaban la primera vez que aparecían: explosión, fogonazo, arma nueva → tirón y «teletransporte»)
  warm() {
    this.warmed = (this.warmed || 0) + 1;
    const r = G.renderer; if (!r || window.__COW_NORENDER || this.lost) return;
    try {
      // muestras de lo que aparece durante el juego: armas tiradas en el suelo, manchas de herida y placas de nombre
      const tmp = new THREE.Group(); tmp.position.set(G.camera.position.x, -40, G.camera.position.z);
      for (const id in CONFIG.WEAPONS) { if (id === 'knife') continue; try { const m = buildWeaponModel(id, false, defaultAtt(id)); m.traverse((o) => { if (o.isMesh) o.castShadow = true; }); tmp.add(m); } catch (e) { } }
      const w = woundSample(); if (w) tmp.add(w);
      try { tmp.add(makeNameSprite('x')); } catch (e) { }
      G.scene.add(tmp);
      // un cuadro real con todo visible y sin descartar por cámara: así los programas salen idénticos a los del juego
      const st = [], show = (root) => root.traverse((o) => { if (o.isLight) return; st.push([o, o.visible, o.frustumCulled]); o.visible = true; o.frustumCulled = false; });
      show(G.scene); if (VM && VM.scene) { if (VM.prewarm) VM.prewarm(); show(VM.scene); }
      if (Post.on) Post.render(r, G.scene, G.camera); else r.render(G.scene, G.camera);
      if (VM && VM.scene) { r.autoClear = false; r.clearDepth(); r.render(VM.scene, VM.cam); r.autoClear = true; }
      for (const [o, v, fc] of st) { o.visible = v; o.frustumCulled = fc; }
      G.scene.remove(tmp);
    } catch (e) { console.warn('warm', e); }
  },
  // modo seguro: sin relieve, nubes, polvo ni post-proceso (el render de la versión anterior)
  enterSafe(why) {
    if (this.safeMode) return;
    this.safeMode = true;
    // un lienzo plano también ocurre al mirar de cerca una pared o humo: solo recordar el modo seguro si hubo una excepción real
    if (why === 'excepción') { try { localStorage.setItem('cow.safegfx', '1'); } catch (e) { } }
    console.warn('Modo gráfico seguro:', why);
    try {
      Post.ok = false; Post.on = false; Post.dispose(); if (G.renderer) G.renderer.setRenderTarget(null);
      Dust.dispose(); BLOCK_BUMP.value = 0;
      if (G.sky) { G.sky.material.defines = {}; G.sky.material.needsUpdate = true; }
      if (G.renderer && G.renderer.autoClear === false) G.renderer.autoClear = true;
    } catch (e) { console.warn(e); }
    try { UI.toast('Gráficos en modo seguro (se detectó pantalla en blanco)', 3500); } catch (e) { }
  },
  // lee unos pocos píxeles del lienzo: si todos son iguales (blanco, negro, plano) el render falló
  probe() {
    const gl = G.renderer.getContext(), c = G.renderer.domElement, w = c.width, h = c.height, buf = new Uint8Array(4);
    const pts = [[.5, .15], [.5, .5], [.5, .85], [.15, .5], [.85, .5]];
    let lo = [255, 255, 255], hi = [0, 0, 0];
    for (const [fx, fy] of pts) {
      gl.readPixels((w * fx) | 0, (h * fy) | 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      for (let i = 0; i < 3; i++) { lo[i] = Math.min(lo[i], buf[i]); hi[i] = Math.max(hi[i], buf[i]); }
    }
    return Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) < 4 ? 'plano ' + hi.join(',') : null;
  },
  init() {
    try { this.safeMode = localStorage.getItem('cow.safegfx') === '1'; } catch (e) { }
    const q = G.quality = CONFIG.QUALITY[G.settings.quality] || CONFIG.QUALITY.medium;
    const r = new THREE.WebGLRenderer({ antialias: q.antialias, powerPreference: 'high-performance', alpha: false });
    r.setClearColor(0x20221c);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = q.shadows; r.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('gl').appendChild(r.domElement);
    r.domElement.tabIndex = 0;
    // pérdida del contexto WebGL (memoria de vídeo, cambio de GPU): sin esto la pantalla queda negra para siempre
    r.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); this.lost = true; }, false);
    r.domElement.addEventListener('webglcontextrestored', () => { this.lost = false; try { Post.dispose(); this.resize(); G.renderer.setRenderTarget(null); } catch (err) { reportError(err); } }, false);
    G.renderer = r;
    G.scene = new THREE.Scene();
    G.scene.fog = new THREE.Fog(0x9c8870, 40, 200);
    G.camera = new THREE.PerspectiveCamera(78, 1, 0.06, 900);
    G.camera.rotation.order = 'YXZ';
    G.root = new THREE.Group(); G.scene.add(G.root);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, defines: this.safeMode ? {} : { CLOUDS: 1 },
      uniforms: { top: { value: new THREE.Color(0x46505f) }, mid: { value: new THREE.Color(0xc49c74) }, bot: { value: new THREE.Color(0x8a765e) }, sunDir: { value: G.sunDir }, time: { value: 0 }, cloud: { value: 0.6 }, sunCol: { value: new THREE.Color(0xffcf9a) }, stars: { value: 0 }, disc: { value: new THREE.Vector3(1.0, 0.86, 0.62) }, flash: { value: 0 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w; }',
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float time; uniform float cloud; uniform float stars; uniform vec3 disc; uniform float flash; varying vec3 vDir;
        #ifdef CLOUDS
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
        float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
        #endif
        float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h * 1.6, 0.0, 1.0), 0.75)) : mix(mid, bot, pow(clamp(-h * 4.0, 0.0, 1.0), 0.6));
          vec3 sd = normalize(sunDir); float s = max(dot(d, sd), 0.0);
          float cdens = 0.0;
          #ifdef CLOUDS
          // bruma en el horizonte
          c = mix(c, mid * 1.08, exp(-abs(h) * 9.0) * 0.4);
          // nubes: capa plana proyectada, borde iluminado por el sol y vientre oscuro
          if (h > 0.01 && cloud > 0.0) {
            vec2 uv = d.xz / (h + 0.22) * 1.25 + vec2(time * 0.006, time * 0.002);
            float n = fbm(uv * 0.9);
            float dens = smoothstep(0.5 - cloud * 0.12, 0.82, n) * smoothstep(0.01, 0.2, h);
            float n2 = fbm(uv * 0.9 + sd.xz * 0.35);
            float lit = clamp((n - n2) * 5.0 + 0.5, 0.0, 1.0);
            vec3 cc = mix(mid * 0.72, mix(mid, vec3(1.0, 0.95, 0.86), 0.65), lit);
            cc += sunCol * pow(s, 6.0) * 0.55 * lit;
            c = mix(c, cc, dens * 0.8 * min(cloud, 1.0)); cdens = dens * min(cloud, 1.0);
          }
          #endif
          // estrellas titilantes de noche (se ocultan tras las nubes y cerca del horizonte)
          if (stars > 0.0 && h > 0.0) {
            vec3 q = d * 210.0; vec3 qi = floor(q); float r = h31(qi), tw = 0.65 + 0.35 * sin(time * 2.5 + r * 90.0);
            vec3 qf = fract(q) - 0.5; float sd = 1.0 - smoothstep(0.0, 0.32, length(qf));
            c += vec3(0.8, 0.88, 1.0) * step(0.9935, r) * sd * tw * (0.5 + 1.2 * r) * stars * smoothstep(0.03, 0.3, h) * (1.0 - cdens);
          }
          c += disc * (pow(s, 900.0) * 2.2 + pow(s, 24.0) * 0.22 + pow(s, 4.0) * 0.06);
          c += vec3(0.6, 0.68, 0.9) * flash * (0.35 + 0.65 * smoothstep(0.0, 0.8, h));
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    G.sky = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 16), skyMat); G.sky.frustumCulled = false; G.scene.add(G.sky);
    G.hemi = new THREE.HemisphereLight(0xd6c6ae, 0x4a4034, 1.2); G.scene.add(G.hemi);
    G.sun = new THREE.DirectionalLight(0xffcf9a, 2.3); G.scene.add(G.sun); G.scene.add(G.sun.target);
    const sc = G.sun.shadow.camera; sc.left = -48; sc.right = 48; sc.top = 48; sc.bottom = -48; sc.near = 1; sc.far = 220;
    G.sun.shadow.bias = -0.0005; G.sun.shadow.normalBias = 0.04;
    this.applyQuality(true);
    window.addEventListener('resize', () => this.resize());
    this.resize();
  },
  applyQuality(first) {
    let q = CONFIG.QUALITY[G.settings.quality] || CONFIG.QUALITY.medium;
    if (this.safeMode) q = { ...q, bump: false, post: false, dust: 0 };
    G.quality = q;
    const r = G.renderer;
    this.dyn.ratio = 0; r.setPixelRatio(this.ratioCap()); this.dyn.ratio = this.ratioCap();
    G.sun.castShadow = q.shadows;
    if (q.shadows) { G.sun.shadow.mapSize.set(q.shadowSize, q.shadowSize); if (G.sun.shadow.map) { G.sun.shadow.map.dispose(); G.sun.shadow.map = null; } }
    if (r.shadowMap.enabled !== q.shadows) { r.shadowMap.enabled = q.shadows; G.scene.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { m.needsUpdate = true; }); }); }
    if (MapSys.inst) { MapSys.inst.castShadow = q.shadows; MapSys.inst.receiveShadow = q.shadows; }
    if (MapSys.decoMesh) { MapSys.decoMesh.castShadow = q.shadows; MapSys.decoMesh.receiveShadow = q.shadows; }
    BLOCK_BUMP.value = q.bump ? 1 : 0;
    Post.enable(r, q.post); Dust.init(q); if (MapSys.def && MapSys.def.theme) Dust.tint(MapSys.def.theme);
    if (!first) FX.init(q);
    if (Env.th && MapSys.def) Env.apply(Env.th);
    this.resize();
  },
  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    G.renderer.setSize(w, h, false);
    G.camera.aspect = w / Math.max(1, h); G.camera.updateProjectionMatrix();
    Post.resize(G.renderer);
    VM.resize(G.camera.aspect);
  },
  render() {
    if (window.__COW_NORENDER || this.lost) return;
    const c = G.camera.position;
    _v1.set(Math.round(c.x / 4) * 4, 0, Math.round(c.z / 4) * 4);
    G.sun.target.position.copy(_v1); G.sun.position.copy(_v1).addScaledVector(G.sunDir, 110);
    G.sky.position.copy(c);
    G.sky.material.uniforms.time.value = G.realTime;
    Dust.update(0, G.camera);
    try {
      if (Post.on) Post.render(G.renderer, G.scene, G.camera); else G.renderer.render(G.scene, G.camera);
      VM.render(G.renderer);
    } catch (e) { reportError(e); G.renderer.setRenderTarget(null); this.enterSafe('excepción'); return; }
    // precalentado: tras unos cuadros reales (ya existen los mapas de sombra) para que los programas coincidan con los del juego
    if (this.warmIn > 0 && --this.warmIn === 0) this.warm();
    // red de seguridad: unos segundos después de empezar, comprobar que el lienzo no esté plano
    this.frames++;
    if (!this.safeMode && G.match && this.probes < 3 && (this.frames === 40 || this.frames === 300)) {
      this.probes++;
      let bad = null; try { bad = this.probe(); } catch (e) { }
      if (bad) { this.enterSafe(bad); try { G.renderer.render(G.scene, G.camera); VM.render(G.renderer); } catch (e) { } }
    }
  },
};

function simTick(dt) {
  G.time += dt; G.tick++;
  for (const f of G.fighters) if (f.brain && Rules.canSimulate(f)) { try { f.brain.update(dt); } catch (e) { reportError(e); f.brain.reset(); } }
  for (const f of G.fighters) {
    f.prevPos.copy(f.pos);
    if (!Rules.canSimulate(f)) continue;
    f.stateT += dt;
    if (f.state === 'ragdoll' && f.alive) f.updateRagdoll(dt);
    else if (f.alive) {
      if (f.state === 'getup' && f.stateT > CONFIG.RAGDOLL.getupTime) f.state = 'stand';
      if (f === G.local) Ballistics.pre(f, dt);
      moveFighter(f, dt);
      Weapons.tick(f, dt);
    }
    if (f.alive) { f.syncProxy(); f.recordHistory(G.time); }
  }
  separateFighters(G.fighters, dt);
  Props.tick(dt); Rubble.tick(dt);
  PHYS.step(dt);
  Corpses.tick(dt);
  Grenades.tick(dt);
  Smoke.tick(dt);
  Streaks.tick(dt);
  Projectiles.tick(dt);
  Ballistics.tick(dt);
  WorldItems.tick(dt);
  Rules.tick(dt);
  NET.tick(dt);
}

let _acc = 0, _last = performance.now() / 1000, _fpsT = 0, _fpsN = 0, _fps = 60, _tagT = 0, _bgT = 0;
// diagnóstico de rendimiento (Ajustes → Mostrar FPS): pico de cuadro, tiempos por fase y los últimos tirones con su causa
const PERF = { win: 0, max: 0, sim: 0, upd: 0, ren: 0, n: 0, hitches: [], ev: 0, cur: { sim: 0, upd: 0, ren: 0 } };
BUS.on('kill', () => { PERF.ev++; });
function frame() {
  requestAnimationFrame(frame);
  const nowS = performance.now() / 1000;
  let dt = nowS - _last; _last = nowS; const rawDt = dt; if (dt > 0.1) dt = 0.1; if (dt < 0) dt = 0;
  Renderer.dynTick(rawDt);
  if (G.settings.showFps && rawDt > 0.045) PERF.hitches.push({ ms: Math.round(rawDt * 1000), sim: PERF.cur.sim, upd: PERF.cur.upd, ren: PERF.cur.ren, kills: PERF.ev, rag: (Corpses.liveN || 0) }), PERF.hitches.length > 4 && PERF.hitches.shift();
  const _p0 = performance.now(); let _p1 = _p0, _p2 = _p0;
  G.realTime += dt;
  let drawn = false;
  try {
    Input.syncHeld(); Input.pollGamepad(dt);
    if (!G.paused) {
      _acc += dt;
      let n = 0;
      while (_acc >= STEP && n < CONFIG.MAX_FRAME_STEPS) { simTick(STEP); _acc -= STEP; n++; }
      if (n >= CONFIG.MAX_FRAME_STEPS) _acc = 0;
    }
    _p1 = performance.now();
    const alpha = clamp(_acc / STEP, 0, 1);
    if (Replay.playing) Replay.update(dt);
    else {
      for (const f of G.fighters) if (f.view && !f.hidden) f.view.update(dt, alpha);
      Corpses.animate();
    }
    FX.update(G.paused ? 0 : dt);
    Grenades.animate(); WorldItems.animate(dt); Tags.animate(dt); Props.animate(); Rubble.animate(); Smoke.animate(dt); Streaks.animate(dt);
    MapSys.update(dt); if (MapSys.flags.length) animateFlags(G.realTime);
    updateFlagsLook();
    // primera persona: sin cabeza propia; mira telescópica: sin arma
    const me = G.local;
    if (me && me.view && !Replay.playing) {
      const fp = CAM.isFP || CAM.fpHideFor === me;
      me.view.joints.head.visible = !fp;
      me.view.root.visible = !me.hidden && !(me.alive && (CAM.scoped || VM.active));
    }
    CAM.fpHideFor = null;
    CAM.update(dt, alpha);
    Scenes.frame(dt);
    DmgNums.update(dt);
    { const me = G.local; Grenades.preview(me, !!(me && me.grenadeCook && me.alive && me.state === 'stand' && !Replay.playing && !G.attract && !G.paused)); }
    VM.update(dt);
    updateLasers();
    updateNameTags(dt);
    AUDIO.setListener(G.camera);
    Ambience.update(); Env.update(G.paused ? 0 : dt);
    if (G.mode && G.mode.story) Zombies.frame(dt);
    UI.updateHud(dt);
    UI.updatePreview(dt);
    Replay.record(dt);
    // con el juego en pausa o con la armería abierta la escena de fondo apenas cambia: se redibuja a ~20 fps y la GPU queda libre
    _p2 = performance.now();
    if ((G.paused || UI.pvOn) && (_bgT += dt) < 0.05) drawn = true;
    else { _bgT = 0; Renderer.render(); drawn = true; }
    NET.frame(dt);
    _fpsT += dt; _fpsN++;
    { const p3 = performance.now(); PERF.cur = { sim: Math.round(_p1 - _p0), upd: Math.round(_p2 - _p1), ren: Math.round(p3 - _p2) }; PERF.sim = Math.max(PERF.sim, _p1 - _p0); PERF.upd = Math.max(PERF.upd, _p2 - _p1); PERF.ren = Math.max(PERF.ren, p3 - _p2); PERF.max = Math.max(PERF.max, rawDt * 1000); }
    if (_fpsT > 0.5) {
      _fps = _fpsN / _fpsT; _fpsT = 0; _fpsN = 0;
      if (G.settings.showFps) {
        const e = UI.el.fps; e.style.whiteSpace = 'pre';
        const h = PERF.hitches.map((x) => x.ms + 'ms (sim ' + x.sim + ' · vista ' + x.upd + ' · dibujo ' + x.ren + ' · bajas ' + x.kills + ')').join('\n');
        e.textContent = Math.round(_fps) + ' FPS · pico ' + Math.round(PERF.max) + ' ms\nsim ' + PERF.sim.toFixed(0) + ' · vistas ' + PERF.upd.toFixed(0) + ' · dibujo ' + PERF.ren.toFixed(0) + ' ms (máx.)\nragdolls ' + (Corpses.liveN || 0) + ' · cuerpos ' + (PHYS.world ? PHYS.world.bodies.length : 0) + (h ? '\ntirones:\n' + h : '');
        PERF.max = PERF.sim = PERF.upd = PERF.ren = 0;
      }
    }
  } catch (e) {
    reportError(e);
    // si algo falló antes de dibujar, dibujar igual: un error de interfaz no debe congelar o apagar la imagen
    if (!drawn) { try { Renderer.render(); } catch (e2) { } }
  }
}

// banderas: color según el dueño del punto
function updateFlagsLook() {
  const m = G.match; if (!m || !MapSys.flags.length) return;
  const me = G.local, myTeam = me && me.team >= 0 ? me.team : 0;
  MapSys.flags.forEach((fl, i) => {
    const st = m.dom[i]; if (!st) return;
    const col = st.owner < 0 ? 0xd8d2bc : st.owner === myTeam ? 0x5ab8ff : 0xff5040;
    fl.cloth.material.color.setHex(col); fl.ring.material.color.setHex(st.contested ? 0xffc24a : col);
    fl.ring.material.opacity = 0.35 + (st.contested ? 0.3 * Math.abs(Math.sin(G.realTime * 6)) : 0);
  });
}
// etiquetas: aliados siempre; enemigos solo si los tienes en la mira
function updateNameTags(dt) {
  _tagT -= dt;
  const me = G.local, cam = G.camera;
  const fwd = _v1.set(0, 0, -1).applyQuaternion(cam.quaternion);
  for (const f of G.fighters) {
    const v = f.view; if (!v || !v.nameTag) continue;
    let vis = false;
    if (me && f !== me && f.alive && !f.zombie && f.state !== 'ragdoll' && !f.hidden && !Replay.playing && !G.attract && !CAM.scoped) {
      const friend = !Rules.isEnemy(me, f);
      const hp = _v2.set(f.pos.x, f.pos.y + 1.9, f.pos.z), d = hp.distanceTo(cam.position);
      if (friend) vis = d < 80;
      else if (d < 70) {
        const dir = _v3.copy(hp).sub(cam.position).normalize();
        const ang = Math.acos(clamp(dir.dot(fwd), -1, 1));
        if (ang < Math.atan(0.7 / d) + 0.025) { if (_tagT <= 0 || f._tagVis) f._tagVis = PHYS.lineOfSight(cam.position, hp); vis = f._tagVis; } else f._tagVis = false;
      }
      v.nameTag.material.color.setHex(friend ? 0x8fd0ff : 0xff6a58);
    }
    v.nameTag.visible = vis;
  }
  if (_tagT <= 0) _tagT = 0.1;
}

// ---------------- sonidos y efectos ligados a eventos del juego ----------------
function bindGameFx() {
  const near = (p, r = 30) => G.camera && G.camera.position.distanceToSquared(p) < r * r;
  BUS.on('fire', (f, shot) => {
    const W = f.wstat ? f.wstat(shot.weapon) : CONFIG.WEAPONS[shot.weapon];
    const mz = f.view ? f.view.muzzleWorld(new THREE.Vector3()) : shot.origin;
    AUDIO.play(W.sound, mz, f === G.local ? 0.85 : 1, { throttle: 0.008, k: shot.weapon });
    if (!W.suppressed) f.lastLoudT = G.time;
    if (W.kind !== 'melee') { if (f === G.local && VM.active) FX.flashLight(mz, 0xffc070, 2.2 * (W.flash ?? 1), 9, 0.06); else FX.muzzle(mz, shot.dir, W); }
    if (W.casing && near(f.pos, 28)) FX.casing(f);
    BotNoise.add(f, f.pos, W.suppressed ? 0.3 : W.sound === 'sniper' || W.sound === 'shotgun' || W.sound === 'dmr' || W.sound === 'magnum' ? 1.4 : W.sound === 'pistol' ? 0.75 : 1);
  });
  BUS.on('swing', (f) => AUDIO.play('knife', f.pos, 0.7));
  BUS.on('stab', (f, t) => AUDIO.play('stab', t.pos, 0.9));
  BUS.on('knifeWall', (p) => AUDIO.play('knifeWall', p, 0.7));
  BUS.on('pin', (f) => AUDIO.play('pin', f.pos, f === G.local ? 0.8 : 0.6));
  BUS.on('throw', (f) => AUDIO.play('throw', f.pos, 0.6));
  BUS.on('nadeBounce', (p, v) => AUDIO.play('nadeBounce', _v1.set(p.x, p.y, p.z), clamp(v / 8, 0.25, 0.9), { throttle: 0.04 }));
  BUS.on('reload', (f) => { if (near(f.pos, 25)) { const Wc = CONFIG.WEAPONS[f.weapon]; AUDIO.play('reload', f.pos, f === G.local ? 0.75 : 0.5, { k: f.weapon, T: f.reloadTotal, tac: !!(Wc && Wc.reload && f.reloadTotal < Wc.reload * 0.85), throttle: 0.05 }); } });
  BUS.on('dryfire', (f) => { if (f === G.local) AUDIO.play('dry', null, 0.6); });
  BUS.on('whiz', (p) => AUDIO.play('whiz', p, 0.8, { throttle: 0.06 }));
  BUS.on('step', (f, hs) => {
    if (!near(f.pos, 34)) return;
    const s = f.groundBlock ? f.groundBlock.surface : 'concrete';
    const v = (f === G.local ? 0.32 : 0.55) * (f.sprinting ? 1.25 : f.crouching ? 0.45 : 0.85) * (f !== G.local && f.hasPerk && f.hasPerk('quiet') ? 0.2 : 1) * (f.prone ? 0.3 : 1);
    AUDIO.play('step', f.pos, v, { surface: s, throttle: 0.0 });
  });
  BUS.on('land', (f, vy) => { if (vy > 6) AUDIO.play('land', f.pos, clamp(vy / 16, 0.3, 1)); if (f === G.local) { if (vy > 12) CAM.addShake(0.18); CAM.dipV = (CAM.dipV || 0) + clamp(vy, 3, 20) * 0.3; VM.landV = (VM.landV || 0) + clamp(vy, 3, 20) * 0.3; CAM.punch -= clamp(vy, 3, 20) * 0.003; } });
  BUS.on('jump', (f) => { AUDIO.play('jump', f.pos, 0.5); if (f === G.local) { CAM.dipV = (CAM.dipV || 0) - 0.8; VM.landV = (VM.landV || 0) - 1.2; } });
  BUS.on('slide', (f, on) => { if (on) AUDIO.play('slide', f.pos, 0.6); });
  BUS.on('mantle', (f) => AUDIO.play('mantle', f.pos, 0.6));
  BUS.on('explosion', (e) => {
    AUDIO.play('explosion', e.pos, 1.3, { throttle: 0.02 });
    BotNoise.add(e.owner || null, e.pos, 2);
    if (G.camera) { const d = G.camera.position.distanceTo(e.pos); if (d < 14) { const fl = UI.el['fx-flash']; fl.style.transition = 'none'; fl.style.opacity = clamp(1 - d / 14, 0, 0.75); requestAnimationFrame(() => { fl.style.transition = 'opacity .6s'; fl.style.opacity = 0; }); } }
  });
  BUS.on('damaged', (t, info, dmg) => {
    if (t === G.local) { if (dmg > 8) AUDIO.play('pain', null, 0.6, { throttle: 0.5, pitch: frand(0.95, 1.05) }); AUDIO.play('hit', null, 0.5, { throttle: 0.05 }); }
    else if (near(t.pos, 30)) AUDIO.play('hit', t.pos, 0.6, { throttle: 0.04 });
  });
  BUS.on('kill', (ev) => { const p = ev.pos.clone(); setTimeout(() => AUDIO.play('bodyfall', p, 0.8, { throttle: 0.05 }), 450); });
  BUS.on('blockBroken', (b) => AUDIO.play('break', _v1.set((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2), 0.8, { throttle: 0.05 }));
  BUS.on('casing', (p) => { if (near(p, 10)) AUDIO.play('casing', p, 0.5, { throttle: 0.03 }); });
  BUS.on('weaponSwitch', (f) => { if (f === G.local) AUDIO.play('cloth', null, 0.35); });
  BUS.on('smoke', (c) => AUDIO.play('smoke', c.pos, 0.8));
  BUS.on('shellIncoming', (p) => { if (near(p, 70)) AUDIO.play('whistle', p, 1.2, { throttle: 0.05 }); });
  BUS.on('jet', (j) => AUDIO.play('jet', _v1.set(j.x, 30, j.z), 3.5, { throttle: 0.5 }));
  BUS.on('prone', (f, on) => { if (near(f.pos, 18)) AUDIO.play('prone', f.pos, f === G.local ? 0.45 : 0.6, { throttle: 0.1 }); });
  BUS.on('matchStart', () => { if (!G.attract) Ambience.start(); else Ambience.stop(); Renderer.warmIn = 3; });
}

function boot() {
  try {
    loadSettings();
    Camp.migrate(); Camp.data();
    if (LANG === 'en') document.title = 'Call of Washed: ' + CONFIG.TITLE_EN;
    Input.loadBindings(G.settings.bindings); Input.sens = G.settings.sens; Input.adsSens = G.settings.adsSens; Input.invertY = G.settings.invertY;
    CAM.mode = G.settings.cam; CAM.shoulder = CAM.shoulderT = G.settings.shoulder || 1;
    Renderer.init(); VM.init(); VM.resize(G.camera.aspect); MAT.init(); PHYS.init(); FX.init(G.quality); Replay.init(); UI.init();
    Input.init(G.renderer.domElement);
    bindGameFx();
    UI.el.fps.hidden = !G.settings.showFps;
    const gesture = () => { AUDIO.resume(); if (G.match && !G.attract) Ambience.start(); window.removeEventListener('pointerdown', gesture); window.removeEventListener('keydown', gesture); };
    window.addEventListener('pointerdown', gesture); window.addEventListener('keydown', gesture);
    UI.startAttract();
    if (!G.settings.goreChosen) { UI.el.menu.hidden = true; UI.gorePrompt(); } else UI.show('main');
    window.__cowBooted = true; clearTimeout(window.__cowBootTimer);
    UI.el.boot.classList.add('gone'); setTimeout(() => { UI.el.boot.hidden = true; }, 600);
    requestAnimationFrame(frame);
    NET.init();
  } catch (e) {
    console.error(e);
    const be = document.getElementById('boot-err'); if (be) { be.hidden = false; be.textContent = 'Error al iniciar: ' + (e.message || e); }
  }
}
// ganchos para pruebas automatizadas (no afectan el juego)
window.__COW = {
  gloveHandGeo, classKeys, setClass, curClassKey, className, linkSlots, MODES_RANGE: MODES.range, THREE, PartBatch, weaponGeometry, _wmCache, buildWeaponModel, SoldierView, Mannequin, PART_NAMES, SKEL, Fighter, OPERATORS, CAMOS, HELMETS, FACES, VESTS, PACKS, PADS, WSKINS, classLoadout, makeBlock, PAT, OnlineUI, BUS, G, VM, Smoke, Streaks, Progress, CONFIG, Rules, Env, UI, PHYS, MapSys, CAM, Input, Replay, FX, Props, NET, Combat, Weapons, MODES, MAPS, Corpses, Grenades, WorldItems, BotNoise, L, Tags, LADDER, Zombies, ZombieBrain, Inv, ITEMS, AUDIO, Renderer, Post, DmgNums, Camp, Campaign, Scenes, SCENES, CAMPAIGN, Store, weaponIconURL, Ballistics, BAL,
  simulate(sec, viewEvery = 4) {
    const n = Math.round(sec / STEP);
    for (let i = 0; i < n; i++) {
      simTick(STEP);
      if (i % viewEvery === 0) { for (const f of G.fighters) if (f.view && !f.hidden) f.view.update(STEP * viewEvery, 1); Corpses.animate(); }
    }
  },
  stepOnce() { simTick(STEP); },
};
window.addEventListener('error', (e) => { if (window.__cowBooted) reportError(e.error || e.message); });
window.addEventListener('unhandledrejection', (e) => { if (window.__cowBooted) reportError(e.reason); });
boot();

