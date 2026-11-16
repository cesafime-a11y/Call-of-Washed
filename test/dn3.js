// prueba real: disparar en el campo de tiro (bucle de juego real) y comprobar números y marcador
const { open } = require('./lib');
(async () => {
  const cam = process.argv[2] || 'first';
  const { browser, page, logs } = await open();
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.waitForTimeout(800);
  await page.evaluate((cam) => {
    const C = window.__COW, { G, UI, BUS, Input, CAM } = C;
    G.settings.cam = cam;
    UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.Rules.rangeReset();
    C.simulate(3.0);
    window.__ev = []; BUS.on('damaged', (t, i, d) => { if (i.attacker === G.local) window.__ev.push([Math.round(d), i.part]); });
    window.__hm = []; new MutationObserver(() => window.__hm.push(UI.el.hitmarker.className)).observe(UI.el.hitmarker, { attributes: true });
    const me = G.local;
    const pick = () => G.fighters.filter(f => f !== me && f.alive).sort((a, b) => a.pos.distanceTo(me.pos) - b.pos.distanceTo(me.pos))[0];
    const aim = () => { let T = window.__tgt; if (!T || !T.alive) T = window.__tgt = pick(); if (T) { const dx = T.pos.x - me.pos.x, dz = T.pos.z - me.pos.z, dy = (T.pos.y + (window.__aimY || 1.25)) - (me.pos.y + 1.6); Input.state.yaw = Math.atan2(-dx, -dz); Input.state.pitch = Math.atan2(dy, Math.hypot(dx, dz)); } requestAnimationFrame(aim); };
    aim(); Input.mouseL = true; Input.syncHeld();
  }, cam);
  let shots = 0;
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(250);
    const vis = await page.evaluate(() => [...document.querySelectorAll('#dmgnums .dn')].filter(d => d.style.display !== 'none' && +d.style.opacity > 0.5).map(d => d.textContent + '|' + d.className + '|' + d.getBoundingClientRect().x.toFixed(0) + ',' + d.getBoundingClientRect().y.toFixed(0)));
    if (vis.length && shots < 3) { await page.screenshot({ path: `/home/claude/test/dn3_${cam}_${shots}.png` }); shots++; }
  }
  const r = await page.evaluate(() => ({ ev: window.__ev.length, stats: window.__COW.DmgNums.stats, hm: window.__hm.filter(c => c.includes('on')).slice(-8), kills: window.__COW.G.local.stats.kills }));
  console.log(cam, JSON.stringify(r));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 10).join('\n'));
  await browser.close();
})();
