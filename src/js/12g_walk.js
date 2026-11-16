// ---- 12g_walk.js ----
// =====================================================================
// ANDAR EN LAS ESCENAS: algunos tramos de campaña se juegan a pie (sin
// armas, sin física): el motor de escenas mueve el ojo con WASD contra
// cajas de choque y una función de suelo (escaleras), y deja usar cosas
// con E mirándolas de cerca («Dar cuerda», «Abrir el cajón»…).
// Las cajas tienen altura: una barandilla del piso de arriba no frena
// a quien pasa por debajo.
// =====================================================================
const SceneWalk = {
  // o: { x, y, z, yaw, pitch, boxes:[{x0,z0,x1,z1,y0,y1}], floor(x,z,y)→y, speed, h }
  start(S, o) {
    S.walk = { p: new THREE.Vector3(o.x, o.y || 0, o.z), on: true, boxes: o.boxes || [], floor: o.floor || ((x, z, y) => y), speed: o.speed || 2.1, h: o.h || 1.62, bob: 0, step: 0, vy: 0 };
    S.yaw = Input.state.yaw = S.yawC = o.yaw || 0; S.pitch = Input.state.pitch = o.pitch || 0; S.yawR = 9; S.pitchMin = -1.35; S.pitchMax = 1.2;
    const W = S.walk;
    S.eye.set(W.p.x, (o.y || 0) + W.h, W.p.z);
  },
  stop(S) { if (S.walk) S.walk.on = false; S.useT = null; if (Scenes.el.use) Scenes.el.use.hidden = true; },
  // mover sin atravesar cajas (radio 0.24 m), primero en x y luego en z
  hit(W, x, z) {
    const r = 0.24, y = W.p.y;
    for (const b of W.boxes) { if (y + 1.2 < (b.y0 ?? -9) || y + 0.3 > (b.y1 ?? 99)) continue; if (x > b.x0 - r && x < b.x1 + r && z > b.z0 - r && z < b.z1 + r) return true; }
    return false;
  },
  tick(S, dt, rawDt) {
    const W = S.walk;
    if (!W || !W.on) { if (S.uses) this.pickUse(S); else if (S.useT) { S.useT = null; Scenes.el.use.hidden = true; } if (S.busy > 0) S.busy -= dt; return; }
    const inp = Input.state, still = S.line || S.choice || G.paused || S.busy > 0;
    if (S.busy > 0) S.busy -= dt;
    let mv = 0;
    if (!still) {
      let f = inp.mz, r = inp.mx; const n = Math.hypot(f, r); if (n > 1) { f /= n; r /= n; }
      const sp = W.speed * (Input.is && Input.is('sprint') ? 1.45 : 1), s = Math.sin(S.yaw), c = Math.cos(S.yaw);
      const dx = (-s * f + c * r) * sp * dt, dz = (-c * f - s * r) * sp * dt;
      const stuck = this.hit(W, W.p.x, W.p.z);   // si ya está dentro de una caja, se le deja salir andando
      if (dx && (stuck || !this.hit(W, W.p.x + dx, W.p.z))) W.p.x += dx;
      if (dz && (stuck || !this.hit(W, W.p.x, W.p.z + dz))) W.p.z += dz;
      mv = Math.hypot(dx, dz) / Math.max(1e-4, dt);
    }
    // suelo: escaleras y pisos; sube suave y baja algo más rápido
    const fy = W.floor(W.p.x, W.p.z, W.p.y);
    W.p.y = damp(W.p.y, fy, fy > W.p.y ? 14 : 18, rawDt);
    // balanceo de la cabeza y pasos
    const k = clamp(mv / W.speed, 0, 1.5);
    W.bob += dt * 8.4 * k;
    const by = Math.sin(W.bob * 2) * 0.028 * k;
    W.step += dt * k * 1.9;
    if (W.step > 1) { W.step = 0; this.foot(W); }
    S.eye.set(W.p.x, W.p.y + W.h + by, W.p.z);
    S.roll = Math.sin(W.bob) * 0.006 * k;
    this.pickUse(S);
  },
  foot(W) {
    if (!SceneAudio.ok()) return; const t = AUDIO.ctx.currentTime, wood = W.wood !== false;
    AUDIO.nz(SceneAudio.dest(), t, 0.05, wood ? 0.035 : 0.025, 'bandpass', wood ? 420 : 900, null, 1.2);
    if (wood) AUDIO.osc(SceneAudio.dest(), 'sine', 120, 70, t, 0.08, 0.03);
  },
  // lo que se puede usar: el más centrado en la vista, cerca y sin gastar
  pickUse(S) {
    const el = Scenes.el.use; let best = null, ba = 9;
    if (S.uses && !S.line && !S.choice && !(S.busy > 0)) for (const u of S.uses) {
      if (u.done || (u.avail && !u.avail(S))) continue;
      const p = u.pos(S), d = p.distanceTo(S.eye); if (d > (u.d || 1.8) + (S.walk && S.walk.on ? 0 : 0.8)) continue;   // sentado no puede acercarse: más alcance
      const a = Scenes.angleTo(p), lim = (u.r || 0.3) + 0.12 / Math.max(0.4, d); if (a < lim && a < ba) { ba = a; best = u; }
    }
    if (best !== S.useT) {
      S.useT = best;
      if (best) { el.innerHTML = `<kbd>E</kbd> ${escapeHtml(L(best.label))}`; el.hidden = false; } else el.hidden = true;
    }
  },
  use(S) {
    const u = S.useT; if (!u) return;
    S.useT = null; Scenes.el.use.hidden = true;
    if (!u.repeat) u.done = true;
    AUDIO.play('ui', null, 0.2);
    try { u.use(S, u); } catch (e) { reportError(e); }
    if (u.text) for (const t of [].concat(u.text)) S._q.push({ text: t, o: t.o || u.o });
  },
};

// usar cosas a pie: termina cuando se han usado `need` (u objetos marcados con `key` si need = 'keys')
Step.uses = function (list, need, goalFn) {
  return { enter(S) { S.uses = list.map((u) => ({ ...u, done: false })); S._q = S._q || []; if (goalFn) Scenes.setGoal(goalFn(0, need, S)); },
    tick(S) {
      if (!S.uses) return true;
      if (S.line || S.busy > 0) return false;
      if (S._q.length) { const nx = S._q.shift(); Scenes.say(L(nx.text), nx.o); return false; }
      const got = S.uses.filter((u) => u.done && !u.extra).length;
      if (goalFn && got !== S._ug) { S._ug = got; Scenes.setGoal(goalFn(got, need, S)); }
      if (got >= need) { S.uses = null; S._ug = -1; Scenes.setGoal(null); return true; }
      return false;
    } };
};
// ir a un sitio a pie
Step.reach = function (x, z, rad, es, en, yMin) {
  return { kind: 'reach', at: { x, z, yMin, rad }, enter() { if (es) Scenes.setGoal(L({ es, en })); },
    tick(S) { const W = S.walk; if (!W) return true; if (yMin != null && W.p.y < yMin) return false; if (Math.hypot(W.p.x - x, W.p.z - z) < rad) { Scenes.setGoal(null); return true; } return false; } };
};
