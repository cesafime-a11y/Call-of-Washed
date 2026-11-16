const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.argv[2]);
  await page.addInitScript(() => { window.__COW_TEST = true; });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.waitForTimeout(1000);
  await page.evaluate(async () => {
    const C = window.__COW, { G, UI, BUS, Input, CAM } = C;
    UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.Rules.rangeReset();
    C.simulate(3.0);
    window.__ev = []; BUS.on('damaged', (t, i, d) => { if (i.attacker === G.local) window.__ev.push([Math.round(d), i.part, UI.el.dmgnums.children.length]); });
    CAM.mode = 'fp';
  });
  // aim at nearest dummy each frame
  await page.evaluate(() => {
    const C = window.__COW, { G, Input } = C; const me = G.local;
    const tgt = G.fighters.filter(f => f !== me && f.alive).sort((a, b) => a.pos.distanceTo(me.pos) - b.pos.distanceTo(me.pos))[0];
    window.__tgt = tgt;
    const aim = () => { const t = window.__tgt; if (!t || !t.alive) { window.__tgt = G.fighters.filter(f => f !== me && f.alive).sort((a, b) => a.pos.distanceTo(me.pos) - b.pos.distanceTo(me.pos))[0]; } const T = window.__tgt; if (T) { const dx = T.pos.x - me.pos.x, dz = T.pos.z - me.pos.z, dy = (T.pos.y + 1.25) - (me.pos.y + 1.6); Input.state.yaw = Math.atan2(-dx, -dz); Input.state.pitch = Math.atan2(dy, Math.hypot(dx, dz)); } requestAnimationFrame(aim); };
    aim();
    Input.mouseL = true; Input.syncHeld();
  });
  await page.waitForTimeout(6000);
  const r = await page.evaluate(() => ({ ev: window.__ev.slice(0, 20), n: window.__ev.length, kids: window.__COW.UI.el.dmgnums.children.length, html: window.__COW.UI.el.dmgnums.innerHTML.slice(0, 400), shots: window.__COW.G.local.stats }));
  console.log(JSON.stringify(r));
  await page.evaluate(() => { document.getAnimations().forEach(a => { if (a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('dn')) { a.pause(); a.currentTime = 250; } }); });
  await page.screenshot({ path: '/home/claude/test/dn2.png' });
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 10).join('\n'));
  await browser.close();
})();
