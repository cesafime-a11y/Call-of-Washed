const { open } = require('./lib');
(async () => {
  const cam = process.argv[2] || 'first';
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  await page.waitForTimeout(500);
  await page.evaluate((cam) => {
    const C = window.__COW, { G, UI, Input, Zombies } = C;
    G.settings.cam = cam;
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(5); document.getElementById('storyFade').style.display = 'none';
    const me = G.local; me.pos.set(-1, 0.06, 0); me.limpT = 0; me.dazeT = 0;
    const z = window.__z = Zombies.spawnOne(); z.pos.set(7, 0.06, 0.3); z.history.length = 0; z.brain.st = 'chase';
    const aim = () => { const dx = z.pos.x - me.pos.x, dz = z.pos.z - me.pos.z; Input.state.yaw = Math.atan2(-dx, -dz); Input.state.pitch = Math.atan2((z.pos.y + 1.4) - (me.pos.y + 1.6), Math.hypot(dx, dz)); requestAnimationFrame(aim); };
    aim(); Input.mouseL = false;
    window.__shoot = () => { Input.state.fireCount++; };
  }, cam);
  const log = [];
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(450);
    const s = await page.evaluate(() => { const z = window.__z, me = window.__COW.G.local; window.__shoot(); return `z.x=${z.pos.x.toFixed(1)} hp=${z.hp.toFixed(0)} alive=${z.alive} st=${z.brain.st} me.hp=${me.hp.toFixed(0)} mag=${me.inv.pistol.mag} kills=${me.stats.kills}`; });
    log.push(s);
    if (i === 3) await page.screenshot({ path: `z8_${cam}_a.png` });
    if (/alive=false/.test(s)) { await page.waitForTimeout(500); await page.screenshot({ path: `z8_${cam}_b.png` }); break; }
  }
  console.log(log.join('\n'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
