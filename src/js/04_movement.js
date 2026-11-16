// ---- 04_movement.js ----
// =====================================================================
// MOVIMIENTO — controlador cinemático con peso: caminar, sprint, agacharse,
// deslizar, trepar bordes (y ventanas), saltos sin bunny hop y daño por caída
// =====================================================================
const MV = CONFIG.MOVE;

function fHalfW() { return CONFIG.FIGHTER.radius; }
function fHeight(f) { return f.prone ? CONFIG.FIGHTER.proneHeight : (f.crouching || f.sliding) ? CONFIG.FIGHTER.crouchHeight : CONFIG.FIGHTER.height; }
function roomFor(f, h) {
  const hw = fHalfW(), p = f.pos;
  return !PHYS.overlapAABB(p.x - hw, p.y + 0.05, p.z - hw, p.x + hw, p.y + h, p.z + hw);
}
function roomToStand(f) { return roomFor(f, CONFIG.FIGHTER.height); }
// tumbado, las piernas quedan detrás: comprobar que ahí haya sitio
function legsBlocked(f, yaw = f.yaw) {
  const fx = -Math.sin(yaw), fz = -Math.cos(yaw), p = f.pos, r = 0.2;
  for (const d of [0.55, 1.0]) {
    const x = p.x - fx * d, z = p.z - fz * d;
    if (PHYS.overlapAABB(x - r, p.y + 0.12, z - r, x + r, p.y + 0.45, z + r)) return true;
  }
  return false;
}

function quakeAccel(v, wx, wz, wishSpeed, accel, dt) {
  const cur = v.x * wx + v.z * wz;
  const add = wishSpeed - cur;
  if (add <= 0) return;
  const acc = Math.min(add, accel * dt * wishSpeed);
  v.x += acc * wx; v.z += acc * wz;
}

function moveFighter(f, dt) {
  const inp = f.input, v = f.vel;
  f.coyote -= dt; f.jumpBufferT -= dt; f.slideCd -= dt; f.knockT -= dt; f.controlLock -= dt; f.sprintOut -= dt; f.sprintBlockT -= dt;
  f.stepSmooth = Math.max(0, f.stepSmooth - dt * 5);
  if (f.limpT > 0) f.limpT -= dt; if (f.armT > 0) f.armT -= dt; if (f.dazeT > 0) f.dazeT -= dt;
  if (inp.jumpCount !== f.seenJump) { f.seenJump = inp.jumpCount; f.jumpBufferT = MV.jumpBuffer; }
  f.yaw = inp.yaw; f.pitch = inp.pitch;
  if (f.mantle) { updateMantle(f, dt); return; }

  const locked = f.controlLock > 0 || G.freeze;
  const mx = locked ? 0 : inp.mx, mz = locked ? 0 : inp.mz;
  const sy = Math.sin(f.yaw), cy = Math.cos(f.yaw);
  let wx = -sy * mz + cy * mx, wz = -cy * mz - sy * mx;
  const wl = Math.hypot(wx, wz);
  if (wl > 1e-4) { wx /= wl; wz /= wl; }
  const wishMag = Math.min(1, wl);
  const hSpeed = Math.hypot(v.x, v.z);
  const W = f.wstat ? f.wstat() : (CONFIG.WEAPONS[f.weapon] || CONFIG.WEAPONS.rifle);

  // agacharse / deslizar
  const wantCrouch = inp.crouch && !locked;
  if (wantCrouch && !f.crouchHeld && f.grounded && f.sprinting && hSpeed > MV.slideMinSpeed && f.slideCd <= 0) startSlide(f, hSpeed);
  f.crouchHeld = wantCrouch;
  if (f.sliding) {
    f.slideT -= dt;
    f.slideDist += hSpeed * dt;
    if (f.slideT <= 0 || (f.grounded && hSpeed < 2.8)) endSlide(f);
  }

  // sprint: solo hacia adelante, sin apuntar, sin cocinar granada
  const wasSprint = f.sprinting;
  f.sprinting = !locked && inp.sprint && mz > 0.35 && !wantCrouch && !f.sliding && f.state === 'stand' && !f.grenadeCook && f.meleeT <= 0 && f.sprintBlockT <= 0 && f.limpT <= 0 && f.dazeT < 1 && (f.grounded || wasSprint);
  if (f.sprinting && f.crouching) { if (roomToStand(f)) f.crouching = false; else f.sprinting = false; }
  if (wasSprint && !f.sprinting) f.sprintOut = MV.sprintOutTime;

  if (f.sliding || (wantCrouch && !f.sprinting)) f.crouching = true;
  else if (f.crouching && roomToStand(f)) f.crouching = false;

  // tumbarse (Z) y levantarse
  f.proneBlockT -= dt;
  const wantProne = !!inp.prone;
  if (wantProne && !f.prone && f.grounded && !f.sliding && f.state === 'stand' && !f.mantle && !f.grenadeCook && f.proneBlockT <= 0 && !locked) {
    if (!legsBlocked(f)) { f.prone = true; f.sprinting = false; f.crouching = false; BUS.emit('prone', f, true); }
    else if (f.kind === 'local') inp.prone = false;
  } else if (!wantProne && f.prone) {
    if (roomFor(f, CONFIG.FIGHTER.crouchHeight)) { f.prone = false; f.crouching = !roomToStand(f) || !!inp.crouch; f.proneBlockT = 0.25; BUS.emit('prone', f, false); }
    else inp.prone = true;
  }
  if (f.prone) { f.sprinting = false; f.crouching = false; if (f.sliding) endSlide(f); }
  f.proneT = clamp(f.proneT + (f.prone ? 1 : -1) * dt / MV.proneTime, 0, 1);
  // asomarse (Q/E mantenidos): desplazamiento lateral limitado por las paredes
  const leanWant = (f.state === 'stand' && !f.sprinting && !f.sliding && !f.mantle && !f.prone && f.proneT < 0.05 && !locked) ? clamp(inp.lean || 0, -1, 1) : 0;
  f.lean = damp(f.lean, leanWant, 10, dt);
  if (Math.abs(f.lean) > 0.01) {
    const want = f.lean * CONFIG.CAMERA.leanDist, sg = Math.sign(want);
    const o = _v1.set(f.pos.x, f.pos.y + eyeHeight(f), f.pos.z), dir = _v2.set(Math.cos(f.yaw) * sg, 0, -Math.sin(f.yaw) * sg);
    const h = PHYS.raycast(o, dir, Math.abs(want) + 0.2, f._leanHit || (f._leanHit = {}));
    f.leanOff = sg * Math.min(Math.abs(want), h ? Math.max(0, h.t - 0.2) : Math.abs(want));
  } else { f.lean = Math.abs(f.lean) < 0.01 ? 0 : f.lean; f.leanOff = 0; }

  // salto (o trepar si hay un borde delante)
  f.justJumped = false;
  const canJump = (f.grounded || f.coyote > 0) && !locked;
  if (f.prone || f.proneT > 0.05) f.jumpBufferT = 0;
  if (f.jumpBufferT > 0 && !locked) {
    if (tryMantle(f)) { f.jumpBufferT = 0; return; }
    if (canJump) {
      if (f.crouching && !f.sliding) {
        if (roomToStand(f)) f.crouching = false;
        f.jumpBufferT = 0;
      } else {
        v.y = MV.jumpVel * (f.limpT > 0 ? 0.82 : 1);
        if (f.sliding) { endSlide(f); if (roomToStand(f)) f.crouching = false; }
        if (G.time - f.landTime < MV.bhopWindow) { v.x *= MV.bhopPenalty; v.z *= MV.bhopPenalty; }
        f.grounded = false; f.coyote = 0; f.jumpBufferT = 0; f.justJumped = true;
        BUS.emit('jump', f);
      }
    }
  } else if (!f.grounded && inp.jump && mz > 0.3 && f.wallHit && !locked) {
    if (tryMantle(f)) return;
  }

  // velocidad horizontal
  const slow = MapSys.slowAt(f.pos);
  const speedMul = (W.moveMul || 1) * (1 - f.adsT * (1 - MV.adsMul)) * slow * (Math.abs(f.lean) > 0.2 ? MV.leanMoveMul : 1) * (f.hasPerk && f.hasPerk('quiet') && f.sprinting ? 1.05 : 1) * (f.limpT > 0 ? CONFIG.WOUND.limpSpeed : 1) * (f.speedMul || 1) * (f.dazeT > 0 ? 0.9 : 1) * (f.hasPerk && f.hasPerk('runner') ? 1.07 : 1);
  if (f.grounded && !f.justJumped) {
    let fr = f.sliding ? MV.slideFriction : MV.friction;
    if (f.knockT > 0) fr *= MV.knockFrictionMul;
    if (f.speedMul) fr *= f.speedMul; // infectados lentos: con poca velocidad deseada la fricción los frenaría casi del todo
    const sp = Math.hypot(v.x, v.z);
    if (sp > 1e-4) {
      const control = Math.max(sp, MV.stopSpeed);
      const ns = Math.max(0, sp - control * fr * dt) / sp;
      v.x *= ns; v.z *= ns;
    }
    if (!f.sliding) {
      let maxSp = (f.prone ? MV.proneSpeed : f.crouching ? MV.crouchSpeed : f.sprinting ? MV.sprintSpeed : MV.walkSpeed) * speedMul;
      if (f.proneT > 0.02 && f.proneT < 0.98) maxSp *= 0.25;
      if (mz < -0.1) maxSp *= 0.82; else if (Math.abs(mx) > 0.1 && mz < 0.3) maxSp *= 0.92;
      quakeAccel(v, wx, wz, maxSp * wishMag, MV.groundAccel, dt);
    } else {
      if (wishMag > 0) { v.x += wx * 2 * dt; v.z += wz * 2 * dt; }
      if (f.groundBlock && f.groundBlock.ramp) {
        const n = rampNormal(f.groundBlock, _v1);
        v.x += n.x * MV.gravity * dt; v.z += n.z * MV.gravity * dt;
      }
    }
  } else if (!f.grounded && wishMag > 0) {
    quakeAccel(v, wx, wz, MV.airSpeedCap, MV.airAccel, dt);
    const along = v.x * wx + v.z * wz;
    if (along < MV.walkSpeed * 0.8) { v.x += wx * MV.airControl * dt; v.z += wz * MV.airControl * dt; }
  }

  // gravedad
  if (!f.grounded) v.y -= MV.gravity * dt; else v.y = Math.min(v.y, 0) - MV.gravity * dt;
  if (v.y < -40) v.y = -40;

  const wasGrounded = f.grounded;
  const preVy = v.y;
  const prevRamp = f.groundBlock && f.groundBlock.ramp ? f.rampClimb : 0;
  f.wallHit = null;
  moveAndCollide(f, v.x * dt, v.y * dt, v.z * dt, wasGrounded);

  // pegarse al suelo al bajar rampas y escalones
  if (!f.grounded && wasGrounded && !f.justJumped && v.y <= 0.5) {
    const hw = fHalfW() * 0.9;
    const q = PHYS.groundBelow(f.pos.x, f.pos.z, f.pos.y + 0.02, MV.groundSnap + (f.groundBlock && f.groundBlock.ramp ? 0.35 : 0), hw);
    if (q && !PHYS.overlapAABB(f.pos.x - hw, q.y + 0.02, f.pos.z - hw, f.pos.x + hw, q.y + fHeight(f), f.pos.z + hw)) {
      f.pos.y = q.y; f.grounded = true; f.groundBlock = q.block; v.y = 0;
    }
  }
  if (wasGrounded && !f.grounded && !f.justJumped && prevRamp > 2) v.y = Math.max(v.y, prevRamp * 0.6);
  if (f.grounded && f.groundBlock && f.groundBlock.ramp) {
    const n = rampNormal(f.groundBlock, _v1);
    f.rampClimb = -(v.x * n.x + v.z * n.z) / Math.max(0.2, n.y);
  } else f.rampClimb = 0;

  if (f.grounded) {
    f.coyote = MV.coyoteTime;
    if (!wasGrounded) {
      f.landTime = G.time;
      const fallV = -preVy;
      f.landVel = fallV;
      if (fallV > 9 && !f.sliding) { const k = clamp((fallV - 9) / 10, 0, 0.35); v.x *= 1 - k; v.z *= 1 - k; }   // caer desde alto frena la carrera
      BUS.emit('land', f, fallV);
      if (fallV > MV.fallDamageVel && Rules.canAuthor(f) && G.match && G.match.phase === 'fight') {
        Combat.hit({ attacker: null, target: f, damage: (fallV - MV.fallDamageVel) * MV.fallDamageMul, impulse: null, point: f.pos.clone(), part: 'legs', weapon: 'fall', kind: 'fall' });
      }
    }
  }
  // tumbado: si las piernas quedan dentro de una pared, empujar hacia adelante
  if (f.prone && legsBlocked(f)) {
    const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw);
    const cand = PHYS.query(f.pos.x - 1.4, f.pos.y - 0.2, f.pos.z - 1.4, f.pos.x + 1.4, f.pos.y + 1, f.pos.z + 1.4, f._cand || (f._cand = []));
    moveAxisH(f, 'x', fx * 2.2 * dt, true, cand); moveAxisH(f, 'z', fz * 2.2 * dt, true, cand);
  }
  resolvePenetration(f);
}

function startSlide(f, hSpeed) {
  f.sliding = true; f.crouching = true; f.sprinting = false; f.slideT = MV.slideDuration; f.slideCd = MV.slideCooldown * (f.hasPerk && f.hasPerk('runner') ? 0.65 : 1); f.slideDist = 0;
  const v = f.vel, sp = Math.max(hSpeed, 0.01);
  const add = Math.max(0, Math.min(MV.slideBoost, MV.slideMaxBoostSpeed - sp));
  v.x += (v.x / sp) * add; v.z += (v.z / sp) * add;
  BUS.emit('slide', f, true);
}
function endSlide(f) {
  if (!f.sliding) return;
  f.sliding = false;
  BUS.emit('slide', f, false);
}

// --- trepar: bordes bajos, muros, ventanas ---
function tryMantle(f) {
  if (f.state !== 'stand' || f.sliding || f.mantle || !f.alive || f.prone) return false;
  if (f.input.mz < -0.1) return false;
  const hw = fHalfW(), p = f.pos;
  const fx = -Math.sin(f.yaw), fz = -Math.cos(f.yaw);
  const ahead = hw + 0.3;
  const ox = p.x + fx * ahead, oz = p.z + fz * ahead;
  if (!PHYS.overlapAABB(ox - 0.12, p.y + MV.mantleMin - 0.05, oz - 0.12, ox + 0.12, p.y + MV.mantleMax, oz + 0.12)) return false;
  const g = PHYS.groundBelow(ox, oz, p.y + MV.mantleMax + 0.05, MV.mantleMax + 0.2, 0.08);
  if (!g) return false;
  const h = g.y - p.y;
  if (h < MV.mantleMin || h > MV.mantleMax) return false;
  if (PHYS.overlapAABB(ox - 0.1, g.y + 0.04, oz - 0.1, ox + 0.1, g.y + 0.8, oz + 0.1)) return false;
  if (PHYS.overlapAABB(p.x - hw * 0.8, p.y + 0.1, p.z - hw * 0.8, p.x + hw * 0.8, g.y + 0.9, p.z + hw * 0.8)) return false;
  const H = CONFIG.FIGHTER.height, CH = CONFIG.FIGHTER.crouchHeight;
  for (let d = hw + 0.32; d <= hw + 1.55; d += 0.15) {
    const tx = p.x + fx * d, tz = p.z + fz * d;
    const tg = PHYS.groundBelow(tx, tz, g.y + 0.05, 0.3, hw * 0.5);
    const footY = tg ? tg.y : g.y;
    let crouch = false;
    if (PHYS.overlapAABB(tx - hw, footY + 0.03, tz - hw, tx + hw, footY + H, tz + hw)) {
      if (PHYS.overlapAABB(tx - hw, footY + 0.03, tz - hw, tx + hw, footY + CH, tz + hw)) continue;
      crouch = true;
    }
    f.mantle = { x0: p.x, y0: p.y, z0: p.z, x1: tx, y1: footY, z1: tz, t: 0, dur: MV.mantleTime * (0.75 + 0.35 * h / MV.mantleMax), crouch, fx, fz };
    if (f.sliding) endSlide(f);
    f.sprinting = false; f.grounded = false; f.vel.set(0, 0, 0);
    BUS.emit('mantle', f);
    return true;
  }
  return false;
}
function updateMantle(f, dt) {
  const m = f.mantle; m.t += dt;
  const k = clamp(m.t / m.dur, 0, 1);
  const up = smooth01(k / 0.62), fw = smooth01((k - 0.28) / 0.72);
  f.pos.set(lerp(m.x0, m.x1, fw), lerp(m.y0, m.y1 + 0.02, up), lerp(m.z0, m.z1, fw));
  f.vel.set(0, 0, 0); f.grounded = false;
  if (k >= 1) {
    f.mantle = null; f.crouching = m.crouch;
    f.vel.set(m.fx * 2.2, 0, m.fz * 2.2);
    resolvePenetration(f);
  }
}

// --- integración con colisión por ejes y sub-pasos ---
function moveAndCollide(f, dx, dy, dz, wasGrounded) {
  const p = f.pos, hw = fHalfW(), H = fHeight(f);
  const cand = PHYS.query(Math.min(p.x, p.x + dx) - hw - 0.7, Math.min(p.y, p.y + dy) - 0.8, Math.min(p.z, p.z + dz) - hw - 0.7,
    Math.max(p.x, p.x + dx) + hw + 0.7, Math.max(p.y, p.y + dy) + H + 0.8, Math.max(p.z, p.z + dz) + hw + 0.7, f._cand || (f._cand = []));
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)) / 0.3));
  f.grounded = false;
  const sx = dx / n, sy = dy / n, sz = dz / n;
  for (let i = 0; i < n; i++) {
    moveAxisH(f, 'x', sx, wasGrounded, cand);
    moveAxisH(f, 'z', sz, wasGrounded, cand);
    moveAxisY(f, sy, cand);
  }
}

function moveAxisH(f, ax, d, wasGrounded, cand) {
  if (d === 0) return;
  const p = f.pos, hw = fHalfW(), H = fHeight(f);
  p[ax] += d;
  for (let i = 0; i < cand.length; i++) {
    const b = cand[i];
    if (!b.active) continue;
    const x0 = p.x - hw, x1 = p.x + hw, z0 = p.z - hw, z1 = p.z + hw, y0 = p.y + 0.01, y1 = p.y + H;
    if (x1 <= b.min.x || x0 >= b.max.x || z1 <= b.min.z || z0 >= b.max.z || y1 <= b.min.y || y0 >= b.max.y) continue;
    if (b.ramp) {
      const h = rampHeight(b, clamp(p.x, b.min.x, b.max.x), clamp(p.z, b.min.z, b.max.z));
      if (p.y >= h - MV.stepHeight) continue;
    } else if ((wasGrounded || f.coyote > 0) && f.vel.y <= 1 && b.max.y - p.y <= MV.stepHeight && b.max.y - p.y > 0) {
      if (!PHYS.overlapAABB(x0, b.max.y + 0.01, z0, x1, b.max.y + H, z1)) {
        f.stepSmooth = Math.min(0.5, f.stepSmooth + b.max.y - p.y); p.y = b.max.y + 0.001; continue;
      }
    }
    if (d > 0) p[ax] = b.min[ax] - hw - 1e-4; else p[ax] = b.max[ax] + hw + 1e-4;
    const vv = f.vel[ax];
    if ((d > 0 && vv > 0) || (d < 0 && vv < 0)) {
      f.wallHit = (f._wh || (f._wh = new THREE.Vector3())).set(ax === 'x' ? -Math.sign(d) : 0, 0, ax === 'z' ? -Math.sign(d) : 0);
      f.vel[ax] = 0;
    }
  }
}

function moveAxisY(f, d, cand) {
  const p = f.pos, hw = fHalfW(), H = fHeight(f);
  const oldY = p.y;
  p.y += d;
  for (let i = 0; i < cand.length; i++) {
    const b = cand[i];
    if (!b.active) continue;
    if (p.x + hw <= b.min.x || p.x - hw >= b.max.x || p.z + hw <= b.min.z || p.z - hw >= b.max.z) continue;
    if (b.ramp) {
      if (d > 0.0001) continue;
      const h = rampHeight(b, clamp(p.x, b.min.x, b.max.x), clamp(p.z, b.min.z, b.max.z));
      if (p.y < h && oldY >= h - MV.stepHeight - Math.abs(d)) { p.y = h; f.grounded = true; f.groundBlock = b; if (f.vel.y < 0) f.vel.y = 0; }
      continue;
    }
    if (p.y + H <= b.min.y || p.y >= b.max.y) continue;
    if (d <= 0) {
      if (oldY >= b.max.y - 0.06) { p.y = b.max.y; f.grounded = true; f.groundBlock = b; if (f.vel.y < 0) f.vel.y = 0; }
    } else if (oldY + H <= b.min.y + 0.06) {
      p.y = b.min.y - H - 1e-4; if (f.vel.y > 0) f.vel.y = 0;
    }
  }
}

// saca al soldado de bloques que lo atraviesan (bloques que reaparecen, fin de trepada)
function resolvePenetration(f) {
  const p = f.pos, hw = fHalfW(), H = fHeight(f);
  for (let iter = 0; iter < 3; iter++) {
    const b = PHYS.overlapAABB(p.x - hw + 0.02, p.y + 0.02, p.z - hw + 0.02, p.x + hw - 0.02, p.y + H - 0.02, p.z + hw - 0.02);
    if (!b) return;
    const up = (b.ramp ? rampHeight(b, clamp(p.x, b.min.x, b.max.x), clamp(p.z, b.min.z, b.max.z)) : b.max.y) - p.y;
    if (up < 0.9) { p.y += up + 0.001; f.grounded = true; f.groundBlock = b; if (f.vel.y < 0) f.vel.y = 0; continue; }
    const pen = [
      [p.x + hw - b.min.x, 'x', -1], [b.max.x - (p.x - hw), 'x', 1],
      [p.z + hw - b.min.z, 'z', -1], [b.max.z - (p.z - hw), 'z', 1],
    ].sort((a, c) => a[0] - c[0])[0];
    p[pen[1]] += pen[2] * (pen[0] + 0.002);
  }
}

// --- separación suave entre soldados ---
function separateFighters(list, dt) {
  for (let i = 0; i < list.length; i++) {
    const a = list[i]; if (!a.alive || a.state !== 'stand' || a.kind === 'remote' || a.mantle) continue;
    for (let j = 0; j < list.length; j++) {
      if (i === j) continue;
      const b = list[j]; if (!b.alive || b.state === 'ragdoll' || b.hidden) continue;
      const dx = a.pos.x - b.pos.x, dz = a.pos.z - b.pos.z, rr = fHalfW() * 2;
      const d2 = dx * dx + dz * dz;
      if (d2 >= rr * rr) continue;
      if (a.pos.y >= b.pos.y + fHeight(b) || b.pos.y >= a.pos.y + fHeight(a)) continue;
      const d = Math.sqrt(d2) || 0.01, pen = rr - d;
      const k = Math.min(pen, MV.fighterPush * dt * 2);
      const ox = (dx / d) * k * 0.5, oz = (dz / d) * k * 0.5;
      const cand = PHYS.query(a.pos.x - 1, a.pos.y - 0.5, a.pos.z - 1, a.pos.x + 1, a.pos.y + 2.4, a.pos.z + 1, a._cand || (a._cand = []));
      moveAxisH(a, 'x', ox, a.grounded, cand); moveAxisH(a, 'z', oz, a.grounded, cand);
    }
  }
}

