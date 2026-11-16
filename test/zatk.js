const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 800, h: 450, norender: true });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI, Zombies, BUS } = C, out = [];
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(6);
    const me = G.local; me.limpT = 0; me.dazeT = 0; me.pos.set(0, 0.06, 0); me.hp = 100;
    BUS.on('damaged', (t, info, dmg) => { if (t === me) out.push(`${G.time.toFixed(1)} dmg ${info.weapon} ${dmg.toFixed(0)} hp=${me.hp.toFixed(0)}`); });
    const z = Zombies.spawnOne(); z.pos.set(2.2, 0.06, 0); z.history.length = 0; z.brain.st = 'chase'; z.brain.lastSeen = me.pos.clone(); z.brain.lastSeenT = G.time;
    let grabbed = 0, escaped = 0;
    for (let i = 0; i < 200; i++) {
      C.simulate(0.05);
      if (Zombies.grab && !grabbed) { grabbed = G.time; out.push(`${G.time.toFixed(1)} GRAB d=${me.pos.distanceTo(z.pos).toFixed(2)}`); }
      if (Zombies.grab && G.time - grabbed > 1.5) { C.Input.state.meleeCount++; }
      if (grabbed && !Zombies.grab && !escaped) { escaped = G.time; out.push(`${G.time.toFixed(1)} FREE zStag=${z.zStag.toFixed(2)} cd=${me.zGrabCd.toFixed(1)}`); }
      if (!me.alive) { out.push('player died'); break; }
    }
    // piernas: se vuelve reptante
    C.Combat.hit({ attacker: me, target: z, damage: 20, impulse: null, point: z.pos.clone(), part: 'legs', weapon: 'pistol', kind: 'bullet', dist: 2 });
    C.Combat.hit({ attacker: me, target: z, damage: 20, impulse: null, point: z.pos.clone(), part: 'legs', weapon: 'pistol', kind: 'bullet', dist: 2 });
    C.simulate(2);
    out.push(`crawler=${z.crawler} prone=${z.prone} hp=${z.hp.toFixed(0)} alive=${z.alive}`);
    me.hp = 100; me.invulnT = 0;
    for (let i = 0; i < 160 && me.alive; i++) C.simulate(0.05);
    out.push(`after crawl: me.hp=${me.hp.toFixed(0)} limp=${me.limpT.toFixed(1)} zx=${z.pos.x.toFixed(2)}`);
    // muerte del jugador → derrota
    me.hp = 5; for (let i = 0; i < 200 && G.match.phase === 'fight'; i++) C.simulate(0.05);
    out.push(`end phase=${G.match.phase} alive=${me.alive}`);
    return out;
  });
  console.log(r.join('\n'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
