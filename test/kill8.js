const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 480, h: 270 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(async () => {
    const C = window.__COW, { G, UI, Combat, THREE: T, BUS } = C;
    UI.launch({ mode: 'ffa', map: 'pueblo', bots: 7, difficulty: 'normal', team: 0 });
    C.simulate(9);
    const me = G.local, c = me.pos.clone(), bots = G.fighters.filter(f => f !== me);
    bots.forEach((f, i) => { f.pos.set(c.x + 6 + (i % 4) * 1.5, c.y, c.z + 6 + Math.floor(i / 4) * 1.5); f.vel.set(0, 0, 0); f.invulnT = 0; });
    let cur = {};
    const wrapObj = (name, o) => { for (const k of Object.getOwnPropertyNames(o)) { let fn; try { fn = o[k]; } catch (e) { continue; } if (typeof fn !== 'function' || k === 'constructor') continue; const nm = name + '.' + k; o[k] = function (...a) { const t = performance.now(); try { return fn.apply(this, a); } finally { cur[nm] = (cur[nm] || 0) + (performance.now() - t); } }; } };
    for (const nm of ['Corpses', 'PHYS', 'FX', 'UI', 'Renderer', 'VM', 'Grenades', 'Combat', 'Weapons', 'Env', 'DmgNums', 'Post', 'MapSys', 'CAM', 'Smoke', 'Props', 'WorldItems', 'Tags', 'BotNoise', 'Streaks', 'Progress', 'Replay', 'NET', 'Input']) if (C[nm] && typeof C[nm] === 'object') wrapObj(nm, C[nm]);
    const rec = []; const orig = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => orig((t) => { cur = {}; const a = performance.now(); cb(t); rec.push({ t: performance.now() - a, cur }); });
    let n = 0; const marks = [];
    await new Promise((res) => { const f = () => { n++; if (n % 30 === 15) { const v = bots[(n / 30) | 0]; if (v && v.alive) { marks.push(n); Combat.hit({ target: v, attacker: me, damage: 999, kind: 'bullet', weapon: 'rifle', part: 'torso', point: v.pos.clone().setY(1.2), impulse: new T.Vector3(3, 0, 3), shot: 1 }); } } if (n < 240) orig(f); else res(); }; orig(f); });
    const s = rec.map(x => x.t).sort((a, b) => a - b), med = s[Math.floor(s.length / 2)];
    const big = rec.map((x, i) => ({ i, t: x.t, top: Object.entries(x.cur).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + '=' + v.toFixed(0)).join(' ') })).filter(x => x.t > med * 3).slice(0, 12);
    return { med: +med.toFixed(1), marks, big: big.map(b => b.i + ' ' + b.t.toFixed(0) + 'ms  ' + b.top) };
  });
  console.log(JSON.stringify(r, null, 1)); console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 5).join('\n'));
  await browser.close();
})();
