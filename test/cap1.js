// Parte I · cap. 1 «Once relojes» de principio a fin (piloto automático) con capturas
const { open } = require('./lib');
(async () => {
  const FILE = process.env.FILE || __dirname + '/../dist/Call of Washed.html', OUT = process.env.OUT || '/home/user/shots';
  const MISSION = process.env.MISSION || 'P1-M1', PFX = process.env.PFX || 'cap1';
  const SH = (process.env.SHOTS || '').split(',').filter(Boolean).map(Number);
  const { browser, page, logs } = await open(FILE, { w: +(process.env.W || 1280), h: +(process.env.H || 720), fonts: !!process.env.FONTS, dpr: +(process.env.DPR || 1) });
  await page.evaluate(() => { const C = window.__COW; C.G.settings.goreChosen = true; C.UI.closeOverlay && C.UI.closeOverlay(); C.Camp.setRead && C.Camp.setRead(5); });
  await page.evaluate(([M, SP]) => { window.MISSION = M; window.__COW_SCENE_SPEED = SP; window.__COW.Campaign.start(window.MISSION); }, [MISSION, +(process.env.SPD || 3)]);
  const t0 = Date.now(); let last = -1, guard = 0, shotN = 0, lastT = Date.now(), forced = false;
  while (Date.now() - t0 < +(process.env.MAXS || 600) * 1000) {
    const st = await page.evaluate(() => {
      const C = window.__COW, S = C.Scenes.S; if (!S) return { end: true };
      const step = S.step || {}, I = C.Input.state;
      const aim = (p) => { const d = p.clone().sub(S.eye).normalize(); I.yaw = Math.atan2(-d.x, -d.z); I.pitch = Math.asin(d.y); };
      S.lookKey = false;
      if (S.line) { C.Scenes.advance(); C.Scenes.advance(); }
      else if (S.choice && step.kind === 'choice') C.Scenes.pick(step.ok + 1);
      else if (S.uses && !(S.busy > 0)) { const u = S.uses.find((u) => !u.done && !u.extra && (!u.avail || u.avail(S))); if (u) { const p = u.pos(S); if (S.walk && S.walk.on) { const W = S.walk, d = p.clone().sub(W.p); d.y = 0; const L = d.length(); if (L > 1.0) {
          // 3.5.1: camino andando de verdad (rejilla de 0.1 m contra las cajas y el suelo) hasta quedar a menos de u.d del objeto
          const SW = C.SceneWalk, st = 0.1, X0 = W.p.x, Z0 = W.p.z, key = (x, z, y) => Math.round((x - X0) / st) + ',' + Math.round((z - Z0) / st) + ',' + Math.round((y || 0) * 1.5), seen = new Map(), q = [[W.p.x, W.p.z, W.p.y]]; seen.set(key(W.p.x, W.p.z, W.p.y), 1); let got = null, it = 0; const dm = (u.d || 1.8) - 0.15;
          const y0 = W.p.y;
          while (q.length && it++ < 600000) { const [x, z, y] = q.shift(); const ey = y + W.h; if (Math.hypot(p.x - x, p.y - ey, p.z - z) < dm) { got = [x, z, y]; break; }
            for (const [ax, az] of [[st, 0], [-st, 0], [0, st], [0, -st]]) { const nx = x + ax, nz = z + az; W.p.y = y; if (SW.hit(W, nx, nz)) continue; const ny = W.floor(nx, nz, y); if (Math.abs(ny - y) > 0.45) continue; const k = key(nx, nz, ny); if (seen.has(k)) continue; seen.set(k, 1); q.push([nx, nz, ny]); } }
          W.p.y = y0;
          if (got) { W.p.x = got[0]; W.p.z = got[1]; W.p.y = got[2]; } else { (window.__unreach = window.__unreach || []).push(u.id + '@' + S.i); (window.__ufl = window.__ufl || []).push({ id: u.id + '@' + S.i, start: [X0, Z0, y0], target: [p.x, p.y, p.z], cells: [...seen.keys()].map((k) => k.split(',').map(Number)).map(([i, j]) => [X0 + i * st, Z0 + j * st]), boxes: W.boxes.filter((b) => b.x0 < X0 + 25 && b.x1 > X0 - 25 && b.z0 < Z0 + 25 && b.z1 > Z0 - 25) }); W.p.addScaledVector(d.normalize(), L - 0.9); W.p.y = W.floor(W.p.x, W.p.z, p.y > 2.6 ? 3 : 0); } } } aim(p); if (window.__force) { S.useT = u; C.Scenes.el.use.hidden = false; } window.__lastUse = u.id; setTimeout(() => { if (C.Scenes.S && C.Scenes.S.useT === u) C.SceneWalk.use(C.Scenes.S); }, 250); } }
      else if (S.marks.length) { const m = S.marks.find((m) => !m.done && (!m.avail || m.avail(S))); if (m) { aim(m.pos(S)); if (window.__force) { m.done = true; if (m.onFound) m.onFound(S); for (const t of [].concat(m.text)) S._q.push({ text: t, o: t.o || m.o }); } } S.lookKey = true; }
      else if (step.kind === 'gaze') aim(step.at(S));
      else if (step.kind === 'reach' && S.walk && S.walk.on) { const a = step.at, W = S.walk;
        if (window.__force) W.p.set(a.x, a.yMin != null ? a.yMin + 0.5 : W.p.y, a.z);
        else if (S._rchk !== S.i) { const SW = C.SceneWalk, st = 0.1, X0 = W.p.x, Z0 = W.p.z, key = (x, z, y) => Math.round((x - X0) / st) + ',' + Math.round((z - Z0) / st) + ',' + Math.round((y || 0) * 1.5), seen = new Map(), q = [[W.p.x, W.p.z, W.p.y]]; seen.set(key(W.p.x, W.p.z, W.p.y), 1); let got = null, it = 0; const y0 = W.p.y;
          while (q.length && it++ < 6000000) { const [x, z, y] = q.shift(); if (Math.hypot(a.x - x, a.z - z) < (a.rad || 0.4) - 0.05 && (a.yMin == null || y >= a.yMin - 0.1)) { got = [x, z, y]; break; }
            for (const [ax, az] of [[st, 0], [-st, 0], [0, st], [0, -st]]) { const nx = x + ax, nz = z + az; W.p.y = y; if (SW.hit(W, nx, nz)) continue; const ny = W.floor(nx, nz, y); if (Math.abs(ny - y) > 0.45) continue; const k = key(nx, nz, ny); if (seen.has(k)) continue; seen.set(k, 1); q.push([nx, nz, ny]); } }
          W.p.y = y0; if (got) { W.p.x = got[0]; W.p.z = got[1]; W.p.y = got[2]; } else { S._rchk = S.i; (window.__unreach = window.__unreach || []).push("reach@" + S.i); (window.__ufl = window.__ufl || []).push({ id: 'reach@' + S.i, start: [X0, Z0, y0], target: [a.x, a.yMin, a.z, a.rad], cells: [...seen.keys()].map((k) => k.split(',').map(Number)).map(([i, j]) => [X0 + i * st, Z0 + j * st]), boxes: W.boxes.filter((b) => b.x0 < X0 + 40 && b.x1 > X0 - 40 && b.z0 < Z0 + 40 && b.z1 > Z0 - 40) }); } } }
      else if (S.fire && !S.choice) { if (S.set && S.set.balPh != null && !S.set.stopped) S.set.balPh = Math.PI / 2; S.fire(S); }
      if (step.tick && !step.kind && S.where === 'plaza' && !S.line) S._pl = (S._pl || 0) + 1;
      return { un: (window.__unreach || []).join(' '), i: S.i, n: S.script.steps.length, where: S.where, line: S.line && S.line.text.slice(0, 50), goal: S.goal && S.goal.replace(/<[^>]+>/g, '').slice(0, 60) };
    });
    if (st.end) break;
    if (st.i !== last) { lastT = Date.now(); if (forced) { forced = false; await page.evaluate(() => { window.__force = 0; }); } }
    else if (!forced && Date.now() - lastT > +(process.env.STALL || 120) * 1000) { forced = true; console.log('STALL', st.i, '|', st.goal || '', '|', st.line || ''); console.log('DIAG', JSON.stringify(await page.evaluate(() => { const C = window.__COW, S = C.Scenes.S; return { eye: S.eye.toArray().map((v) => +v.toFixed(2)), walk: !!(S.walk && S.walk.on), yaw: +S.yaw.toFixed(2), pitch: +S.pitch.toFixed(2), useT: S.useT && S.useT.id, uses: (S.uses || []).filter((u) => !u.done).map((u) => { const p = u.pos(S); return { id: u.id, av: !u.avail || u.avail(S), p: p.toArray().map((v) => +v.toFixed(2)), d: +p.distanceTo(S.eye).toFixed(2), ud: u.d, ang: +C.Scenes.angleTo(p).toFixed(2), r: u.r }; }) }; }))); await page.evaluate(() => { window.__force = 1; const S = window.__COW.Scenes.S; window.__stalls = (window.__stalls || []).concat([S.i]); if (S.marks) for (const m of S.marks) if (!m.done && S.step && S.step.kind !== 'choice') { /* fuerza la marca */ } }); }
    if (st.i !== last) { last = st.i; if (SH.includes(st.i)) { await page.waitForTimeout(900); try { await page.screenshot({ path: `${OUT}/${PFX}_${String(st.i).padStart(3, "0")}.png`, timeout: 90000 }); shotN++; } catch (e) { console.log("shot fail", st.i); } } }
    if (++guard % 5 === 0) console.log('step', st.i, '/', st.n, st.where, '|', st.goal || '', '|', st.line || '');
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({ unreach: window.__unreach || [], done: window.__COW.Camp.isDone(window.MISSION), screen: window.__COW.UI.screen }));
  require('fs').writeFileSync('/tmp/claude-0/ufl_' + PFX + '.json', JSON.stringify(await page.evaluate(() => window.__ufl || []))); console.log(JSON.stringify({ after, secs: Math.round((Date.now() - t0) / 1000), shotN }));
  console.log('LOGS', logs.filter((l) => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 15).join('\n'));
  await browser.close();
})();
