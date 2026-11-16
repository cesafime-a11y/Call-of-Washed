// Parte I · cap. 1 «Once relojes» de principio a fin (piloto automático) con capturas
const { open } = require('./lib');
(async () => {
  const FILE = process.env.FILE || __dirname + '/../dist/Call of Washed.html', OUT = process.env.OUT || '/home/user/shots';
  const MISSION = process.env.MISSION || 'P1-M1', PFX = process.env.PFX || 'cap1';
  const SH = (process.env.SHOTS || '').split(',').filter(Boolean).map(Number);
  const { browser, page, logs } = await open(FILE, { w: +(process.env.W || 1280), h: +(process.env.H || 720), fonts: !!process.env.FONTS, dpr: +(process.env.DPR || 1) });
  await page.evaluate(() => { const C = window.__COW; C.G.settings.goreChosen = true; C.UI.closeOverlay && C.UI.closeOverlay(); C.Camp.setRead && C.Camp.setRead(5); });
  await page.evaluate(([M, SP]) => { window.MISSION = M; window.__COW_SCENE_SPEED = SP; window.__COW.Campaign.start(window.MISSION); }, [MISSION, +(process.env.SPD || 3)]);
  const t0 = Date.now(); let last = -1, guard = 0, shotN = 0;
  while (Date.now() - t0 < +(process.env.MAXS || 600) * 1000) {
    const st = await page.evaluate(() => {
      const C = window.__COW, S = C.Scenes.S; if (!S) return { end: true };
      const step = S.step || {}, I = C.Input.state;
      const aim = (p) => { const d = p.clone().sub(S.eye).normalize(); I.yaw = Math.atan2(-d.x, -d.z); I.pitch = Math.asin(d.y); };
      S.lookKey = false;
      if (S.line) { C.Scenes.advance(); C.Scenes.advance(); }
      else if (S.choice && step.kind === 'choice') C.Scenes.pick(step.ok + 1);
      else if (S.uses && !(S.busy > 0)) { const u = S.uses.find((u) => !u.done && !u.extra && (!u.avail || u.avail(S))); if (u) { const p = u.pos(S); if (S.walk && S.walk.on) { const W = S.walk, d = p.clone().sub(W.p); d.y = 0; const L = d.length(); if (L > 1.0) { W.p.addScaledVector(d.normalize(), L - 0.9); W.p.y = W.floor(W.p.x, W.p.z, p.y > 2.6 ? 3 : 0); W.p.y = p.y > 2.6 ? 3 : (W.p.x < 1.5 && W.p.z > 4.3 ? W.p.y : 0); } } aim(p); S.useT = u; C.Scenes.el.use.hidden = false; window.__lastUse = u.id; setTimeout(() => { if (C.Scenes.S && C.Scenes.S.useT === u) C.SceneWalk.use(C.Scenes.S); }, 250); } }
      else if (S.marks.length) { const m = S.marks.find((m) => !m.done && (!m.avail || m.avail(S))); if (m) aim(m.pos(S)); S.lookKey = true; }
      else if (step.kind === 'gaze') aim(step.at(S));
      else if (step.kind === 'reach' && S.walk && S.walk.on) { const a = step.at; S.walk.p.set(a.x, a.yMin != null ? a.yMin + 0.5 : S.walk.p.y, a.z); }
      else if (S.fire && !S.choice) { if (S.set && S.set.balPh != null && !S.set.stopped) S.set.balPh = Math.PI / 2; S.fire(S); }
      if (step.tick && !step.kind && S.where === 'plaza' && !S.line) S._pl = (S._pl || 0) + 1;
      return { i: S.i, n: S.script.steps.length, where: S.where, line: S.line && S.line.text.slice(0, 50), goal: S.goal && S.goal.replace(/<[^>]+>/g, '').slice(0, 60) };
    });
    if (st.end) break;
    if (st.i !== last) { last = st.i; if (SH.includes(st.i)) { await page.waitForTimeout(900); try { await page.screenshot({ path: `${OUT}/${PFX}_${String(st.i).padStart(3, "0")}.png`, timeout: 90000 }); shotN++; } catch (e) { console.log("shot fail", st.i); } } }
    if (++guard % 5 === 0) console.log('step', st.i, '/', st.n, st.where, '|', st.goal || '', '|', st.line || '');
    await page.waitForTimeout(140);
  }
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({ done: window.__COW.Camp.isDone(window.MISSION), screen: window.__COW.UI.screen }));
  console.log(JSON.stringify({ after, secs: Math.round((Date.now() - t0) / 1000), shotN }));
  console.log('LOGS', logs.filter((l) => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 15).join('\n'));
  await browser.close();
})();
