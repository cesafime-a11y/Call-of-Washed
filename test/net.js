const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { norender: true });
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI, BUS, THREE } = C;
    UI.launch({ mode: 'tdm', map: 'pueblo', bots: 7, difficulty: 'normal', team: 0 });
    C.simulate(4);
    const t = G.fighters.find(f => f.team !== G.local.team);
    BUS.emit('remoteDamage', t, { attacker: G.local, target: t, damage: 31, part: 'body', point: t.pos.clone().setY(t.pos.y + 1.2), fromNet: true });
    const a = C.DmgNums.live.length;
    C.simulate(20);
    return { afterRemote: a, stats: C.DmgNums.stats, kills: G.local.stats.kills, err: 0 };
  });
  console.log(JSON.stringify(r)); console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 10).join('\n'));
  await browser.close();
})();
