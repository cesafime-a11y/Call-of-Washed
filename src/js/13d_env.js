// ---- 13d_env.js ----
// =====================================================================
// AMBIENTE — momento del día y clima de cada partida
//   · envTheme(): transforma el tema del mapa (cielo, niebla, luces, gradación de color) según el
//     ambiente elegido: original, amanecer, mediodía, atardecer, noche o lluvia
//   · Env: lluvia (rayas + sonido + relámpagos), suelo mojado (BLOCK_ENV), farolas de noche con luz,
//     bruma que se enciende al mirar hacia el sol
// Todo es visual: no cambia colisiones, balas ni IA.
// =====================================================================
// niebla con altura: más espesa al ras del suelo y más clara arriba (se aplica a todos los materiales con niebla)
(() => {
  const C = THREE.ShaderChunk, sw = (k, a, b) => { if (C[k].includes(a)) C[k] = C[k].replace(a, b); else console.warn('niebla: no se pudo parchear', k); };
  sw('fog_pars_vertex', 'varying float vFogDepth;', 'varying float vFogDepth; varying float vFogY;');
  sw('fog_vertex', 'vFogDepth = - mvPosition.z;', 'vFogDepth = - mvPosition.z; vFogY = cameraPosition.y + dot( viewMatrix[ 1 ].xyz, mvPosition.xyz );');
  sw('fog_pars_fragment', 'varying float vFogDepth;', 'varying float vFogDepth; varying float vFogY;');
  sw('fog_fragment', 'float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );', 'float fogFactor = smoothstep( fogNear, fogFar, vFogDepth * ( 0.82 + 0.4 * exp( - max( vFogY, 0.0 ) * 0.05 ) ) );');
})();

const ENV_ORDER = ['random', 'auto', 'dawn', 'day', 'dusk', 'night', 'rain'];
const ENV_INFO = {
  random: { es: 'Aleatorio', en: 'Random' },
  auto: { es: 'Original', en: 'Original' },
  dawn: { es: 'Amanecer', en: 'Dawn' },
  day: { es: 'Mediodía', en: 'Midday' },
  dusk: { es: 'Atardecer', en: 'Dusk' },
  night: { es: 'Noche', en: 'Night' },
  rain: { es: 'Lluvia', en: 'Rain' },
};
const GRADE0 = { sat: 1.09, con: 1.0, sh: [0.97, 1.0, 1.04], hi: [1.04, 1.0, 0.95] };
// colores y luces de cada ambiente; la dirección del sol conserva el rumbo del mapa y cambia la altura (elev)
const ENV_PRESET = {
  dawn: { skyTop: 0x2f4670, skyMid: 0xf2b08f, skyBot: 0x8f7a7c, fog: 0xcfa497, fogK: 1.1, sun: 0xffbe94, sunI: 2.0, elev: 0.2, hemiTop: 0xbfb9d2, hemiBot: 0x5c5058, hemiI: 1.25, exposure: 1.08, cloud: 0.75, rays: 1.1, glow: 0.35,
    disc: [1.0, 0.72, 0.5], grade: { sat: 1.12, con: 1.04, sh: [0.92, 0.98, 1.1], hi: [1.08, 1.0, 0.9] } },
  day: { skyTop: 0x3f7fc4, skyMid: 0xbad2e6, skyBot: 0x8f9c94, fog: 0xb3c6d2, fogK: 1.25, sun: 0xfff3df, sunI: 2.7, elev: 0.78, hemiTop: 0xd2e2f2, hemiBot: 0x6c6a58, hemiI: 1.4, exposure: 1.0, cloud: 0.55, rays: 0.5, glow: 0.12,
    disc: [1.0, 0.95, 0.85], grade: { sat: 1.1, con: 1.03, sh: [0.96, 1.0, 1.06], hi: [1.04, 1.01, 0.96] } },
  dusk: { skyTop: 0x2f3556, skyMid: 0xea8a5c, skyBot: 0x75554f, fog: 0xb07a64, fogK: 1.0, sun: 0xff9250, sunI: 2.2, elev: 0.14, hemiTop: 0xc0a0b0, hemiBot: 0x605058, hemiI: 1.7, exposure: 1.06, cloud: 0.8, rays: 1.25, glow: 0.42,
    disc: [1.0, 0.6, 0.35], grade: { sat: 1.2, con: 1.05, sh: [0.9, 0.97, 1.12], hi: [1.1, 0.99, 0.86] } },
  night: { skyTop: 0x04070e, skyMid: 0x142238, skyBot: 0x0b0f17, fog: 0x16233a, fogK: 0.62, sun: 0x9fbcff, sunI: 0.95, elev: 0.62, hemiTop: 0x4a64a0, hemiBot: 0x1c2638, hemiI: 2.0, exposure: 1.5, cloud: 0.25, rays: 0, glow: 0.05, stars: 1, lamps: true,
    disc: [0.75, 0.85, 1.0], soldFill: 0.9, soldRim: 1.1, grade: { sat: 0.82, con: 1.08, sh: [0.9, 0.98, 1.15], hi: [1.0, 1.0, 1.08] } },
  rain: { skyTop: 0x4a545e, skyMid: 0x808c94, skyBot: 0x5c6468, fog: 0x78848c, fogK: 0.45, sun: 0xcdd8e4, sunI: 0.85, elev: 0.7, hemiTop: 0x9cacb8, hemiBot: 0x464c4e, hemiI: 1.3, exposure: 1.0, cloud: 1.7, rays: 0, glow: 0.05, rain: 1, wet: 1,
    disc: [0.2, 0.22, 0.25], grade: { sat: 0.82, con: 1.04, sh: [0.95, 1.0, 1.06], hi: [1.0, 1.0, 1.02] } },
};
function envTheme(base, env) {
  const p = ENV_PRESET[env], th = { ...base };
  if (!p) {
    // original: el tema del mapa tal cual, con rayos de sol según la altura del sol
    const sd = new THREE.Vector3(...base.sunDir).normalize();
    th.rays = base.rays ?? clamp(1.35 - sd.y * 1.6, 0.35, 1.0); th.glow = base.glow ?? 0.3; th.grade = base.grade || GRADE0; th.disc = base.disc || [1.0, 0.86, 0.62];
    return th;
  }
  for (const k of ['skyTop', 'skyMid', 'skyBot', 'fog', 'sun', 'sunI', 'hemiTop', 'hemiBot', 'hemiI', 'exposure', 'cloud', 'rays', 'glow', 'disc', 'grade', 'stars', 'lamps', 'rain', 'wet', 'soldFill', 'soldRim']) th[k] = p[k];
  th.fogNear = (base.fogNear ?? 40) * p.fogK; th.fogFar = (base.fogFar ?? 210) * p.fogK;
  const az = new THREE.Vector3(base.sunDir[0], 0, base.sunDir[2]); if (az.lengthSq() < 1e-4) az.set(0.5, 0, 0.5);
  az.normalize().multiplyScalar(Math.sqrt(1 - p.elev * p.elev)); th.sunDir = [az.x, p.elev, az.z];
  return th;
}
// nombre del ambiente que toca para el modo "Original"/azar (el menú de inicio usa uno al azar)
function randomEnv(rng) { const L = ENV_ORDER.slice(2); return L[Math.floor((rng ? rng.next() : Math.random()) * L.length)]; }

// valores compartidos con el material de bloques (suelo mojado, reflejo del cielo, tiempo)
const BLOCK_ENV = { wet: { value: 0 }, time: { value: 0 }, refl: { value: new THREE.Color(0x808c94) } };

const Env = {
  th: null, fogBase: new THREE.Color(), hemiBase: 1, flash: 0, nextBolt: 0, boltQ: [], rain: null, rainK: 1, covered: false, _cT: 0,
  lampGlow: null, lampLights: [], lampT: 0, aud: null,
  // aplica un tema ya transformado (llamado desde applyTheme al cargar el mapa)
  apply(th) {
    this.th = th;
    this.fogBase.set(th.fog); this.hemiBase = th.hemiI ?? 1.25; this.flash = 0; this.boltQ.length = 0;
    this.nextBolt = G.realTime + 6 + Math.random() * 14;
    const U = G.sky.material.uniforms;
    U.stars.value = th.stars || 0; U.disc.value.set(...(th.disc || [1.0, 0.86, 0.62])); U.flash.value = 0;
    BLOCK_ENV.wet.value = th.wet || 0; BLOCK_ENV.refl.value.set(th.skyMid).lerp(_c2.set(th.fog), 0.4).multiplyScalar(0.55);
    this.buildRain(); this.buildLamps();
    if (typeof Dust !== 'undefined' && Dust.pts) Dust.pts.visible = !th.rain;
  },
  clear() {
    if (this.rain) { G.scene.remove(this.rain.obj); this.rain.obj.geometry.dispose(); this.rain.obj.material.dispose(); this.rain = null; }
    if (this.lampGlow) { G.root.remove(this.lampGlow); this.lampGlow.geometry.dispose(); this.lampGlow.material.dispose(); this.lampGlow = null; }
    for (const l of this.lampLights) G.root.remove(l);
    this.lampLights = [];
    this.stopAudio();
  },
  buildRain() {
    this.clear();
    const th = this.th; if (!th || !th.rain) return;
    const q = G.quality || {}, n = q.post ? 1500 : q.shadows ? 900 : 420;
    const pos = new Float32Array(n * 6), seed = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) seed[i] = Math.random();
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xcfdcea, transparent: true, opacity: 0.38, depthWrite: false, fog: false });
    const obj = new THREE.LineSegments(geo, mat); obj.frustumCulled = false; obj.renderOrder = 6; G.scene.add(obj);
    this.rain = { obj, n, pos, seed };
  },
  buildLamps() {
    const th = this.th, lamps = MapSys.lamps || [];
    if (!th || !th.lamps || !lamps.length) return;
    // brillo visible de cada farola (sprites aditivos en un solo objeto) y dos luces reales que siguen a las más cercanas
    const n = lamps.length, pos = new Float32Array(n * 3);
    lamps.forEach((l, i) => { pos[i * 3] = l.x; pos[i * 3 + 1] = l.y; pos[i * 3 + 2] = l.z; });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 3.2, map: smokeTexture(), color: 0xffd9a0, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 4; G.root.add(pts); this.lampGlow = pts;
    for (let i = 0; i < 2; i++) { const L = new THREE.PointLight(0xffd8a8, 38, 20, 1.5); L.position.set(0, -50, 0); G.root.add(L); this.lampLights.push(L); }
    this.lampT = 0;
  },
  update(dt) {
    const th = this.th; if (!th || !G.camera) return;
    const t = G.realTime, cam = G.camera.position;
    BLOCK_ENV.time.value = t;
    // relámpagos: destello doble en el cielo y trueno con retraso
    let fl = 0;
    if (th.rain) {
      if (t > this.nextBolt) { this.nextBolt = t + 12 + Math.random() * 26; this.boltT = t; this.thunderT = t + 0.5 + Math.random() * 2.2; }
      if (this.boltT != null) { const e = t - this.boltT; fl = e < 0.1 ? 1 : e < 0.16 ? 0.15 : e < 0.5 ? Math.exp(-(e - 0.16) * 8) * 0.8 : 0; if (e > 0.6) this.boltT = null; }
      if (this.thunderT != null && t > this.thunderT) { this.thunderT = null; this.thunder(); }
    }
    this.flash = fl;
    G.sky.material.uniforms.flash.value = fl;
    G.hemi.intensity = this.hemiBase + fl * 3.2;
    // bruma que se enciende hacia el sol: el color de la niebla se acerca al del sol según hacia dónde miras
    if (G.scene.fog) {
      G.camera.getWorldDirection(_v1);
      const k = Math.pow(Math.max(_v1.dot(G.sunDir), 0), 3) * (th.glow ?? 0.3) * (G.sunDir.y < 0.05 ? 0.5 : 1);
      G.scene.fog.color.copy(this.fogBase).lerp(_c2.set(th.sun), clamp(k, 0, 0.6)).lerp(_c2.set(0xc8d8ff), fl * 0.5);
    }
    if (this.rain) this.updateRain(dt, cam);
    if (this.lampGlow) this.updateLamps(dt, cam);
    this.updateAudio(dt);
  },
  updateRain(dt, cam) {
    const R = this.rain, W = 30, H = 18, v = 19, wx = 2.2, wz = 0.8, p = R.pos, s = R.seed, t = G.realTime;
    // bajo techo no llueve: un rayo hacia arriba cada 0.2 s
    if ((this._cT -= dt) <= 0) { this._cT = 0.2; _v2.set(0, 1, 0); this.covered = !!PHYS.raycast(cam, _v2, 14, this._rc || (this._rc = {})); }
    this.rainK = damp(this.rainK, this.covered ? 0 : 1, 4, dt);
    R.obj.material.opacity = 0.38 * this.rainK; R.obj.visible = this.rainK > 0.02;
    if (!R.obj.visible) return;
    const wr = (a, lo, sz) => lo + (((a - lo) % sz) + sz) % sz, cx = cam.x, cy = cam.y, cz = cam.z;
    for (let i = 0; i < R.n; i++) {
      const k = i * 3, o = i * 6;
      const x = wr(s[k] * 97 + wx * t, cx - W / 2, W), z = wr(s[k + 2] * 89 + wz * t, cz - W / 2, W), y = wr(s[k + 1] * 53 - v * t, cy - 5, H);
      p[o] = x; p[o + 1] = y; p[o + 2] = z; p[o + 3] = x - wx * 0.03; p[o + 4] = y + 0.56; p[o + 5] = z - wz * 0.03;
    }
    R.obj.geometry.attributes.position.needsUpdate = true;
  },
  updateLamps(dt, cam) {
    if ((this.lampT -= dt) > 0) return;
    this.lampT = 0.2;
    const lamps = MapSys.lamps; if (!lamps.length) return;
    // las dos farolas más cercanas a la cámara reciben luz real
    let a = -1, b = -1, da = 1e9, db = 1e9;
    for (let i = 0; i < lamps.length; i++) {
      const l = lamps[i], d = (l.x - cam.x) ** 2 + (l.z - cam.z) ** 2;
      if (d < da) { b = a; db = da; a = i; da = d; } else if (d < db) { b = i; db = d; }
    }
    const set = (L, i) => { if (L.userData.i0 == null) L.userData.i0 = L.intensity; if (i < 0) { L.intensity = 0; L.position.set(0, -50, 0); return; } L.intensity = L.userData.i0; L.position.set(lamps[i].x, lamps[i].y - 0.2, lamps[i].z); };   // 3.1.4: nunca se ocultan (ocultar una luz obliga a recompilar todos los materiales)
    set(this.lampLights[0], a); set(this.lampLights[1], b);
  },
  // ------------- sonido: lluvia continua y trueno -------------
  updateAudio(dt) {
    const th = this.th; if (!th) return;
    if (!th.rain || !AUDIO.ok || !Ambience.on) { if (this.aud) this.stopAudio(); return; }
    if (!this.aud) {
      const c = AUDIO.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = AUDIO.noise; s.loop = true; s.playbackRate.value = 1.1; f.type = 'highpass'; f.frequency.value = 1600; g.gain.value = 0;
      s.connect(f); f.connect(g); g.connect(AUDIO.sfxGain); s.start(); this.aud = { s, g };
    }
    this.aud.g.gain.value = 0.085 * (0.35 + 0.65 * this.rainK);
  },
  stopAudio() { if (this.aud) { try { this.aud.s.stop(); } catch (e) { } this.aud = null; } },
  thunder() {
    if (!AUDIO.ok || AUDIO.ctx.state !== 'running') return;
    const t = AUDIO.ctx.currentTime, o = AUDIO.sfxGain;
    AUDIO.nz(o, t, 2.2, 0.5, 'lowpass', 260, 60, 0.7, 0.02);
    AUDIO.nz(o, t + 0.35, 1.6, 0.35, 'lowpass', 180, 50, 0.7, 0.05);
    AUDIO.osc(o, 'sine', 58, 32, t, 1.8, 0.35, 0.05);
  },
};
