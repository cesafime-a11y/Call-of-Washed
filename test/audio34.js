// 3.4.0: todos los sonidos nuevos se generan sin errores (contexto de audio real, sin oírlos)
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(process.env.FILE, { norender: true });
  await page.mouse.click(10, 10);
  const r = await page.evaluate(async () => {
    const C = window.__COW, A = C.AUDIO; A.resume(); await new Promise((r) => setTimeout(r, 300));
    const out = { state: A.ctx && A.ctx.state, errs: [] };
    const P = new C.THREE.Vector3(80, 1, 0);
    for (const n of ['rifle', 'rifle2', 'dmr', 'sniper', 'lmg', 'pistol', 'bolt', 'hitmark', 'headshot', 'killconfirm', 'killhead', 'levelup', 'camo', 'beep', 'go', 'win', 'lose', 'capture', 'medal', 'medal2', 'medal3', 'ui', 'uibell', 'streak', 'radio', 'alarm', 'step'])
      { try { A.last = {}; A.play(n, n === 'rifle' || n === 'sniper' ? P : null, 0.5, { surface: 'concrete', throttle: 0 }); } catch (e) { out.errs.push(n + ': ' + e.message); } }
    for (const k of ['bell', 'scrape', 'moan', 'creak', 'drip', 'cough', 'whistle', 'chuff', 'mgBurst', 'shotFar', 'retch', 'thump', 'rung', 'lock', 'gate', 'bird', 'cricket', 'dog', 'gust'])
      { try { C.CS[k](); } catch (e) { out.errs.push('CS.' + k + ': ' + e.message); } }
    for (const k of ['hiss', 'wind', 'wheel', 'engine', 'crowd']) { try { const l = C.CS.loop(k, 0.1); l && l.set(0.2); l && l.stop(); } catch (e) { out.errs.push('loop ' + k + ': ' + e.message); } }
    return out;
  });
  console.log(JSON.stringify(r), JSON.stringify(logs.filter((l) => /pageerror|Error/.test(l)).slice(0, 5)));
  await browser.close();
})();
