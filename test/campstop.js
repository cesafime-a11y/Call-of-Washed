// campaña: menú, Modo lector, El furgón I de principio a fin (automático), guardado
const { open } = require('./lib');
(async () => {
  const FILE = process.env.FILE || __dirname + '/../dist/Call of Washed.html';
  const { browser, page, logs } = await open(FILE, { w: 1280, h: 720 });
  const shot = (n) => page.screenshot({ path: __dirname + '/out/' + n + '.png' });
  // menú principal → campaña
  await page.evaluate(() => { const C = window.__COW; if (C.UI.overlayKind === 'gore') { C.G.settings.goreChosen = true; C.UI.closeOverlay(); } C.UI.show('main'); });
  await page.waitForTimeout(800); await shot('01_menu');
  const menu = await page.evaluate(() => [...document.querySelectorAll('.mainnav .mitem span')].map((e) => e.textContent));
  await page.evaluate(() => window.__COW.UI.show('campaign'));
  await page.waitForTimeout(500); await shot('02_campaign');
  const vis = await page.evaluate(() => ({ read: window.__COW.Camp.read(), parts: [...document.querySelectorAll('.cm-part h3')].map((e) => e.textContent), rows: document.querySelectorAll('.cm-row').length, txt: document.querySelector('.cm-list').textContent }));
  // empezar el furgón
  await page.evaluate(() => { window.__COW_SCENE_SPEED = 3; window.__COW.Campaign.start('P0-I'); });
  const t0 = Date.now(); let shots = 0, last = -1, guard = 0;
  while (Date.now() - t0 < 420000) {
    const st = await page.evaluate(() => {
      const C = window.__COW, S = C.Scenes.S; if (!S) return { end: true };
      const step = S.step || {}, I = C.Input.state;
      const aim = (p) => { const d = p.clone().sub(S.eye).normalize(); I.yaw = Math.atan2(-d.x, -d.z); I.pitch = Math.asin(d.y); };
      S.lookKey = false;
      if (S.line) { C.Scenes.advance(); C.Scenes.advance(); }
      else if (S.choice && step.kind === 'choice') C.Scenes.pick(step.ok + 1);
      else if (S.marks.length && !S.marks.some((m) => m.id === 'thumb')) { const m = S.marks.find((m) => !m.done && (!m.avail || m.avail(S))); if (m) aim(m.pos(S)); S.lookKey = true; }
      else if (step.kind === 'gaze') aim(step.at(S));
      return { i: S.i, n: S.script.steps.length, line: S.line && S.line.text.slice(0, 50), goal: S.goal, marks: S.marks.filter((m) => !m.done).map((m) => m.id) };
    });
    if (st.end) break;
    if (st.marks && st.marks.includes('thumb')) { const info = await page.evaluate(() => { const C = window.__COW, S = C.Scenes.S, m = S.marks[0], p = m.pos(S), d = p.clone().sub(S.eye).normalize(); return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.asin(d.y), yawC: S.yawC, yawR: S.yawR, pmin: S.pitchMin, pmax: S.pitchMax, thumbVis: S.set.thumb.visible, gunVis: S.set.gun.visible }; }); console.log('THUMB', JSON.stringify(info)); await page.evaluate(() => { const C = window.__COW, S = C.Scenes.S; S.lookKey = false; }); await page.waitForTimeout(600); await shot('thumb_noq'); await page.evaluate(() => { const C = window.__COW, S = C.Scenes.S, I = C.Input.state, p = S.marks[0].pos(S), d = p.clone().sub(S.eye).normalize(); I.yaw = Math.atan2(-d.x, -d.z); I.pitch = Math.asin(d.y); S.lookKey = true; }); await page.waitForTimeout(300); await shot('thumb_q'); break; }
    if (st.i !== last) { last = st.i; if ([2, 5, 13, 30, 40].includes(st.i) && shots < 6) { await page.waitForTimeout(300); await shot('03_furgon_' + st.i); shots++; } }
    if (++guard % 25 === 0) console.log('step', st.i, '/', st.n, st.goal || '', st.line || '', st.marks.join(','));
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(800);
  const after = await page.evaluate(() => ({ done: window.__COW.Camp.isDone('P0-I'), screen: window.__COW.UI.screen, store: localStorage.getItem('cow.camp'), mig: localStorage.getItem('cow.mig300') }));
  await shot('04_after');
  console.log(JSON.stringify({ menu, vis: { ...vis, txt: vis.txt.slice(0, 300) }, after, secs: Math.round((Date.now() - t0) / 1000) }, null, 1));
  console.log('LOGS', logs.filter((l) => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 12).join('\n'));
  await browser.close();
})();
