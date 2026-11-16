const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.argv[2]);
  await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    const C = window.__COW, { G, UI, BUS } = C;
    UI.launch({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }); C.Rules.rangeReset();
    C.simulate(3.0);
    const me = G.local; const tgt = G.fighters.find(f => f !== me && f.alive);
    const out = { me: !!me, tgt: !!tgt, phase: G.match && G.match.phase, dmgSetting: G.settings.dmgNums, hud: UI.el.hud.hidden, box: !!UI.el.dmgnums };
    // aim at target
    const dx = tgt.pos.x - me.pos.x, dz = tgt.pos.z - me.pos.z;
    out.dist = Math.hypot(dx, dz);
    out.invul = tgt.invulnT;
    let cnt = 0; BUS.on('damaged', (t, i, d) => { if (i.attacker === me) cnt++; });
    const info = { kind: 'bullet', target: tgt, attacker: me, damage: 20, weapon: me.weapon && me.weapon.id, part: 'torso', point: tgt.pos.clone().setY(tgt.pos.y + 1.2) };
    C.Combat.apply(info);
    out.damagedEvents = cnt; out.children = UI.el.dmgnums.children.length;
    out.html = UI.el.dmgnums.innerHTML.slice(0, 300);
    const d = UI.el.dmgnums.firstChild; if (d) { const cs = getComputedStyle(d); const b = d.getBoundingClientRect(); out.rect = [b.x, b.y, b.width, b.height]; out.op = cs.opacity; out.vis = cs.visibility; out.disp = cs.display; }
    const bx = UI.el.dmgnums.getBoundingClientRect(); out.boxRect = [bx.x, bx.y, bx.width, bx.height]; out.boxDisp = getComputedStyle(UI.el.dmgnums).display;
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); console.log(logs.slice(0, 10).join('\n'));
  await page.waitForTimeout(150); await page.screenshot({ path: '/home/claude/test/dn1.png' });
  await browser.close();
})();
