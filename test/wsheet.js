// hoja de contacto de armas (iconos laterales) → PNG
const { open } = require('./lib');
(async () => {
  const { browser, page } = await open(process.env.FILE);
  const ids = (process.env.IDS || '').split(',').filter(Boolean);
  const atts = process.env.ATT ? JSON.parse(process.env.ATT) : null;
  const html = await page.evaluate(([ids, atts]) => {
    const C = window.__COW; const list = ids.length ? ids : Object.keys(C.CONFIG.WEAPONS);
    return list.map((id) => { const u = C.weaponIconURL(id, atts); const n = C.CONFIG.WEAPONS[id] ? C.CONFIG.WEAPONS[id].name.es : id; return `<div style="display:inline-block;width:320px;margin:4px;background:#556;color:#fff;font:12px sans-serif"><img src="${u}" width=320 height=120><br>${id} · ${n}</div>`; }).join('');
  }, [ids, atts]);
  await page.setContent('<body style="margin:0;background:#334;width:1340px">' + html + '</body>');
  await page.setViewportSize({ width: 1340, height: 900 });
  await page.screenshot({ path: process.env.OUT || '/tmp/claude-0/w/shots/wsheet.png', fullPage: true });
  await browser.close();
})();
