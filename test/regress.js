// v3.0: MP, campo de tiro y Cárcel siguen funcionando; un perfil 2.x migra sin perder nada; un código CW2 antiguo se importa
const { open } = require('./lib');
const fs = require('fs');
(async () => {
  const FILE = process.env.FILE || __dirname + '/../dist/Call of Washed.html';
  const OLD = process.env.OLD;
  const out = {};
  // 1) perfil viejo: crear progreso con la 2.13.2 y exportar su código
  if (OLD) {
    const { browser, page } = await open(OLD, { norender: true });
    out.old = await page.evaluate(() => { const C = window.__COW; localStorage.setItem('cow.prog', JSON.stringify({ xp: 123456, pr: 1 })); localStorage.setItem('cow.wk', JSON.stringify({ rifle: 77 })); localStorage.setItem('cow.records', JSON.stringify({ matches: 9, kills: 99 })); return { code: C.Progress.exportCode(), ls: Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])) }; });
    await browser.close();
  }
  const { browser, page, logs } = await open(FILE, { norender: true });
  if (out.old) {
    // mismo almacenamiento que dejó la 2.13.2 → recargar la 3.0
    await page.evaluate((ls) => { localStorage.clear(); for (const k in ls) localStorage.setItem(k, ls[k]); }, out.old.ls);
    await page.reload(); await page.waitForFunction(() => window.__cowBooted && window.__COW && window.__COW.G, null, { timeout: 120000 });
    out.migrated = await page.evaluate(() => { const C = window.__COW; return { xp: C.Progress.xp(), pr: C.Progress.prestige(), wk: localStorage.getItem('cow.wk'), rec: localStorage.getItem('cow.records'), camp: C.Camp.data(), mig: JSON.parse(localStorage.getItem('cow.mig300')) }; });
    out.importOld = await page.evaluate((code) => { const C = window.__COW; C.Camp.setRead(3); const r = C.Progress.importCode(code); return { r, xp: C.Progress.xp(), read: C.Camp.read() }; }, out.old.code);
    out.roundtrip = await page.evaluate(() => { const C = window.__COW; C.Camp.complete('P0-I'); const code = C.Progress.exportCode(); localStorage.removeItem('cow.camp'); C.Camp._d = null; C.Camp.importObj({}); const r = C.Progress.importCode(code); return { tag: code.split('.')[0], r, done: C.Camp.isDone('P0-I'), read: C.Camp.read() }; });
  }
  out.modes = await page.evaluate(() => {
    const C = window.__COW, { G, UI } = C, res = {};
    const run = (cfg, secs) => { UI.launch(cfg); C.simulate(secs); return { mode: G.mode.id, map: C.MapSys.id, fighters: G.fighters.length, alive: G.fighters.filter((f) => f.alive).length, phase: G.match.phase, local: !!G.local }; };
    res.tdm = run({ mode: 'tdm', map: 'pueblo', bots: 7, difficulty: 'normal', team: 0, env: 'day' }, 8);
    res.dom = run({ mode: 'dom', map: 'base', bots: 5, difficulty: 'normal', team: 0, env: 'day' }, 5);
    res.squads = run({ mode: 'squads', map: 'bunker', bots: 3, difficulty: 'normal', team: 0, env: 'day' }, 5);
    res.range = run({ mode: 'range', map: 'campo', bots: 10, difficulty: 'normal', team: 0 }, 3);
    res.carcel = run({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' }, 4);
    res.menuStory = (UI.quitToMenu(), UI.show('story'), document.querySelector('[data-act="story"]') ? 'ok' : 'missing');
    UI.show('main');
    return res;
  });
  out.logs = logs.filter((l) => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 10);
  console.log(JSON.stringify(out, (k, v) => (k === 'ls' || k === 'code' ? undefined : v), 1));
  await browser.close();
})();
