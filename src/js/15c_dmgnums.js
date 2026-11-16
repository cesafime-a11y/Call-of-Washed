// =====================================================================
// DmgNums — números de daño (2.10.4, módulo propio)
// Antes eran <div> sueltos con una animación CSS, colocados una sola vez en pantalla y metidos dentro del #hud.
// Ahora: capa propia sobre el juego, un número por enemigo que se acumula mientras sigues dándole, anclado a su
// posición 3D (se reproyecta cada cuadro con la cámara real) y animado desde JS, sin depender de keyframes.
// Fuentes: 'damaged' (daño aplicado aquí: sin conexión, anfitrión, bots propios) y 'remoteDamage' (en línea:
// el dueño del objetivo confirmó tu impacto). La baja ('kill') pone el número en rojo.
// =====================================================================
const _dnP = new THREE.Vector3();
const DmgNums = {
  layer: null, pool: [], live: [],
  MAX: 10, LIFE: 1.15, MERGE: 0.7,
  stats: { events: 0, shown: 0, merged: 0, skipped: {} },   // diagnóstico (pruebas y consola: __COW.DmgNums.stats)
  init() {
    let L = document.getElementById('dmgnums');
    if (!L) { L = document.createElement('div'); L.id = 'dmgnums'; }
    // fuera del #hud y por encima de él: nada del HUD (ni su opacidad ni su escala) puede taparlo o desplazarlo
    const app = document.getElementById('app') || document.body;
    if (L.parentNode !== app) app.insertBefore(L, document.getElementById('scoreboard'));
    L.setAttribute('aria-hidden', 'true');
    this.layer = L;
    for (let i = 0; i < this.MAX; i++) {
      const d = document.createElement('div'); d.className = 'dn'; d.style.display = 'none'; L.appendChild(d);
      this.pool.push({ el: d, on: false, t: null, sum: 0, age: 0, hitAge: 0, pop: 0, cls: '', off: new THREE.Vector3(), side: 1, n: 0 });
    }
    BUS.on('damaged', (t, info, dmg) => { if (info && info.attacker === G.local) this.add(t, info, dmg); });
    BUS.on('remoteDamage', (t, info) => { if (info && info.attacker === G.local) this.add(t, info, info.damage); });
    BUS.on('kill', (ev) => { if (ev && ev.killer && ev.killer === G.local) this.killed(ev.victim); });
    BUS.on('matchStart', () => this.clear());
  },
  skip(why) { this.stats.skipped[why] = (this.stats.skipped[why] || 0) + 1; return null; },
  add(t, info, dmg) {
    this.stats.events++;
    if (!this.layer) return this.skip('nolayer');
    if (G.settings.dmgNums === false) return this.skip('setting');
    if (G.attract) return this.skip('attract');
    if (!t || t === G.local) return this.skip('self');
    if (!(dmg > 0)) return this.skip('zero');
    if (info._dnDone) return this.skip('dup'); info._dnDone = true;
    const head = info.part === 'head', dead = t.hp <= 0 || !t.alive;
    // si ya hay un número vivo para este enemigo y el impacto es reciente, se suma ahí (como en los CoD modernos)
    let s = this.live.find((x) => x.t === t && x.hitAge < this.MERGE && x.age < this.LIFE - 0.25);
    if (s) { this.stats.merged++; s.sum += dmg; s.hitAge = 0; s.age = Math.min(s.age, 0.12); s.pop = 1; s.n++; }
    else {
      s = this.pool.find((x) => !x.on) || this.live.shift();
      if (!s) return this.skip('pool');
      if (this.live.indexOf(s) >= 0) this.live.splice(this.live.indexOf(s), 1);
      s.on = true; s.t = t; s.sum = dmg; s.age = 0; s.hitAge = 0; s.pop = 1; s.n = 1;
      // ancla: el punto del impacto relativo al enemigo (sigue al enemigo aunque se mueva o caiga)
      if (info.point && info.point.isVector3) s.off.copy(info.point).sub(t.pos); else s.off.set(0, 1.35, 0);
      s.off.y = clamp(s.off.y, 0.6, 1.9) + 0.18;
      s.side = (this.live.length % 2) ? -1 : 1;
      s.el.style.display = '';
      this.live.push(s);
      this.stats.shown++;
    }
    if (head) s.head = true; else if (s.n === 1) s.head = false;
    if (dead) s.kill = true; else if (s.n === 1) s.kill = false;
    s.el.textContent = Math.round(s.sum);
    this.paint(s);
    return s;
  },
  killed(v) { const s = this.live.find((x) => x.t === v); if (s && !s.kill) { s.kill = true; s.pop = 1; s.age = Math.min(s.age, 0.15); this.paint(s); } },
  paint(s) { const c = 'dn' + (s.kill ? ' kill' : s.head ? ' head' : ''); if (c !== s.cls) { s.el.className = c; s.cls = c; } },
  free(s) { s.on = false; s.t = null; s.kill = false; s.head = false; s.cls = ''; s.el.style.display = 'none'; const i = this.live.indexOf(s); if (i >= 0) this.live.splice(i, 1); },
  clear() { for (const s of this.live.slice()) this.free(s); },
  // cada cuadro, después de mover la cámara: proyectar y animar (subida suave, golpe de escala al sumar, desvanecer al final)
  update(dt) {
    if (!this.live.length) return;
    const cam = G.camera, hudOff = !UI.el.hud || UI.el.hud.hidden || (typeof Replay !== 'undefined' && Replay.playing);
    const W = innerWidth, H = innerHeight;
    for (const s of this.live.slice()) {
      s.age += dt; s.hitAge += dt; s.pop = Math.max(0, s.pop - dt * 7);
      const life = this.LIFE + (s.kill ? 0.3 : 0);
      if (s.age >= life || !s.t) { this.free(s); continue; }
      if (hudOff || !cam) { s.el.style.opacity = '0'; continue; }
      _dnP.copy(s.t.pos).add(s.off).project(cam);
      if (_dnP.z > 1 || _dnP.z < -1) { s.el.style.opacity = '0'; continue; }
      const k = Math.min(1, s.age / life);
      const rise = 26 * (1 - Math.pow(1 - k, 2)) + 10;
      let x = (_dnP.x * 0.5 + 0.5) * W + s.side * 40, y = (-_dnP.y * 0.5 + 0.5) * H - rise;
      // nunca encima de la mira: si cae en el centro se aparta hacia su lado
      const dx = x - W / 2, dy = y - H / 2;
      if (Math.abs(dx) < 70 && Math.abs(dy) < 44) x = W / 2 + (dx >= 0 ? 70 : -70);
      x = clamp(x, 24, W - 24); y = clamp(y, 24, H - 24);
      const a = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
      const sc = (s.age < 0.07 ? 1.45 - s.age / 0.07 * 0.45 : 1) + s.pop * 0.22;
      s.el.style.opacity = a.toFixed(3);
      s.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${sc.toFixed(3)})`;
    }
  },
};
