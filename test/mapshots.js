// capturas de un mapa desde puntos fijos: node test/mapshots.js mapa dir "x,y,z>tx,ty,tz;..."
const { open } = require('./lib');
(async () => {
  const [map, dir, views] = [process.argv[2] || 'pueblo', process.argv[3] || '/tmp', process.argv[4] || ''];
  const { browser, page, logs } = await open(null, { w: 1280, h: 720 });
  const info = await page.evaluate(([map, env]) => { const C = window.__COW, { G, UI } = C; UI.launch({ mode: 'tdm', map, bots: 7, difficulty: 'normal', team: 0, env }); C.simulate(3);
    return { id: C.MapSys.id, blocks: C.PHYS.blocks.length, nav: C.MapSys.nav && C.MapSys.nav.nodes ? C.MapSys.nav.nodes.length : null, spawns: Object.fromEntries(Object.entries(C.MapSys.spawns).map(([k, v]) => [k, v.length])) }; }, [map, process.env.ENV || 'day']);
  console.log(JSON.stringify(info));
  const vs = views.split(';').filter(Boolean);
  for (let i = 0; i < vs.length; i++) {
    const [p, t] = vs[i].split('>').map((s) => s.split(',').map(Number));
    await page.evaluate(([p, t]) => { const C = window.__COW, T = C.THREE || window.THREE; C.G.paused = true; for (const id of ['hud', 'crosshair', 'radar', 'compass', 'weapon', 'score', 'killfeed']) { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
      C.CAM.override = { pos: new T.Vector3(...p), target: new T.Vector3(...t), fov: 70 }; }, [p, t]);
    await page.waitForTimeout(1800);
    await page.screenshot({ path: `${dir}/${map}-${i + 1}.png` });
  }
  console.log(JSON.stringify(logs.filter((l) => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 8)));
  await browser.close();
})();
