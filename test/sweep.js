// revisión general: todos los modos × mapas con bots, buscando errores, NaN, caídas, bots atascados y partidas sin bajas
const { open } = require('./lib');
(async () => {
  const modes = (process.argv[2] || 'tdm,ffa,dom,elim,tags,squads,gun').split(','), maps = (process.argv[3] || 'pueblo,base,muelle,patio,bunker,cruce').split(',');
  const secs = +(process.argv[4] || 40);
  const { browser, page, logs } = await open(undefined, { norender: true, w: 800, h: 450 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const out = [];
  for (const mode of modes) for (const map of maps) {
    const n0 = logs.length;
    const r = await page.evaluate(([mode, map, secs]) => {
      const C = window.__COW, { G, UI } = C;
      const bots = mode === 'squads' ? 3 : 7;
      UI.launch({ mode, map, bots, difficulty: 'normal', team: 0 });
      const fs = () => G.fighters.filter(f => f !== G.local);
      const start = new Map(); fs().forEach(f => start.set(f, { x: f.pos.x, z: f.pos.z, moved: 0, lx: f.pos.x, lz: f.pos.z }));
      const issues = new Set(); let falls = 0, nan = 0, maxStill = 0;
      const still = new Map();
      for (let t = 0; t < secs; t += 1) {
        try { C.simulate(1); } catch (e) { issues.add('throw: ' + e.message); break; }
        for (const f of G.fighters) {
          if (!isFinite(f.pos.x + f.pos.y + f.pos.z)) nan++;
          if (f.alive && f.pos.y < -4) { falls++; issues.add('cae bajo el mapa: ' + f.name + ' @' + f.pos.x.toFixed(1) + ',' + f.pos.y.toFixed(1) + ',' + f.pos.z.toFixed(1)); }
          if (f === G.local) continue;
          let s = start.get(f); if (!s) { s = { lx: f.pos.x, lz: f.pos.z, moved: 0 }; start.set(f, s); }
          const d = Math.hypot(f.pos.x - s.lx, f.pos.z - s.lz); s.moved += d; s.lx = f.pos.x; s.lz = f.pos.z;
          const st = still.get(f) || 0; const ns = f.alive && d < 0.05 ? st + 1 : 0; still.set(f, ns); if (ns > maxStill) maxStill = ns;
          if (ns === 15) issues.add('bot quieto 15 s: ' + f.name + ' @' + f.pos.x.toFixed(1) + ',' + f.pos.z.toFixed(1) + ' estado ' + (f.ai && f.ai.state));
        }
        if (G.phase === 'end' || G.phase === 'over') break;
      }
      const kills = G.fighters.reduce((a, f) => a + (f.stats ? f.stats.kills : 0), 0);
      const shots = G.fighters.reduce((a, f) => a + (f.stats ? f.stats.shots || 0 : 0), 0);
      const r = { mode, map, kills, shots, nan, falls, maxStill, phase: G.phase, fighters: G.fighters.length, issues: [...issues].slice(0, 6) };
      UI.quitToMenu ? UI.quitToMenu() : (C.Game && C.Game.quit && C.Game.quit());
      return r;
    }, [mode, map, secs]).catch(e => ({ mode, map, err: e.message }));
    r.logs = logs.slice(n0).filter(l => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 5);
    out.push(r); console.log(JSON.stringify(r));
  }
  await browser.close();
})();
