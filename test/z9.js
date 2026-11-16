const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 480, h: 270 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(async () => {
    const C = window.__COW, { G, UI, Zombies, BotNoise } = C; const out = [];
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(5);
    const me = G.local; me.pos.set(-6, 0.06, 0); me.limpT = 0; me.dazeT = 0;
    const z = Zombies.spawnOne({ goal: { x: 25, y: 0.06, z: 0 } }); z.brain.st = 'idle'; z.brain.lastSeen = null; z.brain.goal = null;
    C.simulate(2); out.push('idle st=' + z.brain.st + ' x=' + z.pos.x.toFixed(1));
    me.flashOff = true; Zombies.flashOn = false; C.simulate(1);
    // ruido de pistola desde 30 m: no lo oye (r 0.75 => 22 m)
    BotNoise.add(me, me.pos, 0.75); C.simulate(1); out.push('after far noise st=' + z.brain.st + ' d=' + z.pos.distanceTo(me.pos).toFixed(1));
    z.pos.set(10, 0.06, 0); z.history.length = 0; C.simulate(0.2);
    BotNoise.add(me, me.pos, 0.75); C.simulate(1.5); out.push('after near noise st=' + z.brain.st + ' x=' + z.pos.x.toFixed(1));
    C.simulate(20); out.push('later st=' + z.brain.st + ' x=' + z.pos.x.toFixed(1) + ' me.hp=' + me.hp.toFixed(0));
    return out;
  });
  console.log(r.join('\n'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
