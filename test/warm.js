// comprueba el precalentado: programas de shader compilados al empezar y los que se compilan después durante el juego
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 960, h: 540 });
  const r = await page.evaluate(async () => {
    window.__COW_TEST = true; const C = window.__COW, { G, UI } = C; G.settings.goreChosen = true; G.settings.cam = 'first';
    UI.launch({ mode: 'tdm', map: 'pueblo', bots: 7, difficulty: 'normal', team: 0 });
    await new Promise((res) => setTimeout(res, 3000));
    const p0 = G.renderer.info.programs.length;
    const me = G.local; me.invulnT = 999;
    // explosión, disparos, cambio de arma, humo
    C.Combat.explode({ pos: me.pos.clone().add(new C.THREE.Vector3(4, 0.3, 0)), radius: 5, damage: 1, push: 1, owner: null, weapon: 'frag' });
    await new Promise((res) => setTimeout(res, 1500));
    me.setWeapon(me.loadout.secondary); await new Promise((res) => setTimeout(res, 1200));
    me.setWeapon('knife'); await new Promise((res) => setTimeout(res, 1200));
    C.Input.mouseL = true; await new Promise((res) => setTimeout(res, 1500)); C.Input.mouseL = false;
    await new Promise((res) => setTimeout(res, 4000));
    return { atStart: p0, after: G.renderer.info.programs.length, ratio: G.renderer.getPixelRatio(), dpr: devicePixelRatio };
  });
  console.log(JSON.stringify(r)); console.log(logs.filter(l => !/GPU stall|ERR_FAILED|fonts/.test(l)).slice(0, 6).join('\n'));
  await browser.close();
})();
