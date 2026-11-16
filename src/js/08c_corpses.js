// ---- 08c_corpses.js ----
// =====================================================================
// CUERPOS — se quedan hasta el final de la ronda (límite según calidad);
// los que ya no se mueven dejan de simularse y se despiertan si les pegan
// =====================================================================
const Corpses = {
  list: [],
  add(f, view, rd) {
    const c = { f, view, rd, t: 0, slot: f.slot };
    this.list.push(c);
    const max = (G.quality && G.quality.corpses) || 10;
    while (this.list.length > max) this.remove(0);
    return c;
  },
  tick(dt) {
    const R = CONFIG.RAGDOLL;
    // presupuesto de cuerpos simulándose a la vez: con varias bajas juntas (granada, cohete) los más viejos dejan de simularse antes
    // y se quedan en la pose donde están; así el coste de la física no se multiplica por cada baja
    let live = 0; for (const c of this.list) if (!c.rd.frozen) live++;
    const budget = (G.quality && G.quality.ragBudget) || 4;
    if (live > budget) for (const c of this.list) { if (live <= budget) break; if (!c.rd.frozen && c.t > 0.5 && (c.t > 1.1 || c.rd.speed() < 4)) { c.rd.freeze(); live--; } }
    this.liveN = live;
    for (const c of this.list) {
      c.t += dt;
      if (c.rd.frozen) continue;
      c.rd.update(dt);
      if (c.t > R.freezeAfter && c.rd.isSettled()) c.settledT = (c.settledT || 0) + dt; else c.settledT = 0;
      if (c.settledT > 0.6) c.rd.freeze();
    }
  },
  animate() { for (const c of this.list) if (!c.replayDriven) c.view.poseFromRagdoll(c.rd); },
  raycast(o, d, maxT) {
    let best = null, bt = maxT;
    for (const c of this.list) {
      const tp = c.rd.partPos('chest', _v8);
      if (rayPointDist(o, d, bt, tp).dist > 1.6) continue;
      for (const n of PART_NAMES) {
        const t = Combat.raySphere(o, d, c.rd.partPos(n, _v8), PART_RADIUS[n] * 1.15);
        if (t < bt) { bt = t; best = { t, ragdoll: c.rd, part: n, corpse: c }; }
      }
    }
    if (best) best.point = new THREE.Vector3().copy(o).addScaledVector(d, best.t);
    return best;
  },
  radial(pos, r, push) {
    for (const c of this.list) {
      const tp = c.rd.partPos('chest', _v8), dd = tp.distanceTo(pos);
      if (dd > r) continue;
      const k = 1 - dd / r, dir = _v7.copy(tp).sub(pos).setY(Math.max(0.4, tp.y - pos.y + 0.6)).normalize();
      c.rd.applyImpulse(dir.multiplyScalar(push * k * 0.8), null, 'chest');
    }
  },
  remove(i) { const c = this.list[i]; if (!c) return; c.rd.dispose(); c.view.dispose(); if (c.f.corpse === c) { c.f.corpse = null; if (c.f.ragdoll === c.rd) c.f.ragdoll = null; } this.list.splice(i, 1); },
  clear() { for (let i = this.list.length - 1; i >= 0; i--) this.remove(i); },
};

