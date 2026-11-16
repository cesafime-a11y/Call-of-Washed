const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 640, h: 360 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(async () => {
    const C = window.__COW, { G, UI, Combat, THREE: T } = C;
    UI.launch({ mode: 'ffa', map: 'pueblo', bots: 5, difficulty: 'normal', team: 0 });
    C.simulate(9);
    const me = G.local, out = {}, c = me.pos.clone();
    const bots = G.fighters.filter(f => f !== me);
    bots.forEach((f, i) => { f.pos.set(c.x + 4, c.y, c.z + 4 + i * 1.5); f.vel.set(0, 0, 0); f.invulnT = 0; });
    me.input.yaw = Math.atan2(-4, -4) ; 
    const R = G.renderer, info = () => ({ prog: R.info.programs.length, geo: R.info.memory.geometries, tex: R.info.memory.textures });
    const evs = []; const oe = C.BUS.emit.bind(C.BUS); C.BUS.emit = function (t, a, b, c2) { evs.push(n + ':' + t); return oe(t, a, b, c2); };
    const gaps = []; let last = performance.now(), n = 0, killAt = 25, before, after;
    await new Promise((res) => { const f = (t) => { const now = performance.now(); gaps.push(+(now - last).toFixed(0)); last = now; n++;
      if (n === killAt) { before = info(); const v = bots[0]; Combat.hit({ target: v, attacker: me, damage: 999, kind: 'bullet', weapon: 'rifle', part: 'torso', point: v.pos.clone().setY(1.2), impulse: new T.Vector3(3, 0, 3), shot: 1 }); }
      if (n === killAt + 6) after = info();
      if (n < 60) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    out.gaps = gaps.join(','); out.evs = evs.filter((e, i, arr) => !/^\d+:(fire|footstep|nadeBounce)/.test(e)).join(' '); out.gt = G.time; out.before = before; out.after = after;
    return out;
  });
  console.log(JSON.stringify(r)); console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 5).join('\n'));
  await browser.close();
})();
