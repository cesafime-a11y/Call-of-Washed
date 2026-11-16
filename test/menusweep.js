// recorre todas las pantallas del menú en ES y EN: textos raros, claves sin traducir, palabras modernas y desbordes
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1280, h: 720 });
  await page.evaluate(() => { window.__COW_TEST = true; const C = window.__COW; C.G.settings.goreChosen = true; if (C.UI.overlayKind) C.UI.closeOverlay(); });
  const screens = ['main', 'play', 'soldier', 'gunsmith', 'settings', 'record', 'help', 'online', 'story', 'campaign'];
  for (const lang of ['es', 'en']) for (const s of screens) {
    const r = await page.evaluate(([lang, s]) => {
      const C = window.__COW, { G, UI } = C;
      UI.setLang(lang);
      try { UI.show(s); } catch (e) { return { s, err: e.message }; }
      const m = UI.el.menu, txt = m.innerText;
      const bad = [];
      for (const re of [/undefined/, /NaN/, /\[object/, /\bnull\b/, /\b[a-z]+_[a-z0-9_]{2,}\b/g, /\b(UAV|drone|dron|jet|helic|operador|operator|holo|reflex|réflex|láser|laser|ACOG|M4|AK-?47|Glock|kevlar|táctic|tactical|red dot|punto rojo|dron)\b/gi]) {
        const mm = txt.match(re); if (mm) bad.push(...[...new Set(mm)].slice(0, 6));
      }
      // desbordes: elementos cuyo texto sale de su caja
      const over = [];
      m.querySelectorAll('button, .btn, h1, h2, h3, label, .card, .tile, span, div').forEach(el => {
        if (!el.offsetParent || el.children.length > 2) return;
        if (el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible' && el.innerText.trim()) over.push(el.innerText.trim().slice(0, 30));
      });
      return { lang, s, len: txt.length, bad, over: over.slice(0, 6) };
    }, [lang, s]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `/tmp/claude-0/w/shots/menu_${lang}_${s}.png` });
    console.log(JSON.stringify(r));
  }
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 10).join('\n'));
  await browser.close();
})();
