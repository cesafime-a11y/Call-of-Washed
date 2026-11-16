const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 800, h: 450, norender: true });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const r = await page.evaluate(() => {
    const C = window.__COW, { G, UI, Zombies } = C, Inv = C.Inv, out = [];
    UI.launch({ mode: 'carcel', map: 'carcel', bots: 6, difficulty: 'normal', team: 0, env: 'original' });
    C.simulate(3);
    const me = G.local; me.limpT = 0; me.dazeT = 0;
    const S = () => Inv.slots.slice(0, Inv.cap()).map((s) => s ? s.id + ':' + s.n : '-').join(' ');
    out.push('start ' + S() + ' reserve=' + me.inv.pistol.reserve + ' world=' + Inv.world.length);
    // recoger: ponerse delante de cada objeto
    const goTo = (w) => { me.pos.set(w.x + 0.6, 0.06, w.z); C.Input.state.yaw = Math.atan2(-(w.x - me.pos.x), -(w.z - me.pos.z)); C.Input.state.pitch = -0.6; C.simulate(0.1); };
    for (const id of ['med', 'battery', 'ammo9', 'satchel', 'pills']) {
      const w = Inv.world.find((q) => q.id === id && q.x < 9); if (!w) { out.push('no ' + id); continue; }
      goTo(w); const pr = Inv.prompt ? Inv.prompt.id : null; C.Input.state.interactCount++; C.simulate(0.1);
      out.push(`pick ${id} prompt=${pr} -> ${S()} cap=${Inv.cap()} back=${Inv.equip.back}`);
    }
    out.push('reserve after ammo pickup=' + me.inv.pistol.reserve);
    // recargar consume de los bolsillos
    me.inv.pistol.mag = 2; C.Input.state.reloadCount++; C.simulate(3);
    out.push(`after reload mag=${me.inv.pistol.mag} reserve=${me.inv.pistol.reserve} ammo9=${Inv.count('ammo9')}`);
    // curarse con X
    me.hp = 40; Inv.quickHeal(); C.simulate(3.2); out.push(`heal -> hp=${me.hp} ${S()}`);
    // pilas
    Inv.battery = 0.01; Zombies.flashOn = true; C.simulate(3); out.push(`battery=${Inv.battery.toFixed(2)} flashOn=${Zombies.flashOn}`);
    Inv.startUse('battery'); C.simulate(1.5); out.push(`battery after swap=${Inv.battery.toFixed(2)} flashOn=${Zombies.flashOn}`);
    // chaleco: equipar desde el almacén
    const v = Inv.world.find((q) => q.id === 'vest'); goTo(v); C.Input.state.interactCount++; C.simulate(0.1);
    out.push(`vest torso=${Inv.equip.torso} armor=${Inv.armor()} gearVest=${me.custom.gearVest} view=${!!me.view}`);
    // lanzar botella
    Inv.add('bottle', 1); const n0 = C.BotNoise.list.length; Inv.throwReady(); C.simulate(2); out.push(`bottle thrown, noises +${C.BotNoise.list.length - n0}, thrown=${Inv.thrown.length}`);
    Inv.add('flare', 1); Inv.throwReady(); C.simulate(2); out.push(`flare: thrown=${Inv.thrown.length} light=${Inv.flareLight.intensity.toFixed(1)} landed=${Inv.thrown[0] && Inv.thrown[0].landed}`);
    // quitar la bolsa con cosas: lo que sobra cae
    for (let i = 0; i < 5; i++) Inv.add('bandage', 3);
    out.push('full ' + S());
    Inv.unequip('back'); out.push(`unequip bag -> cap=${Inv.cap()} ${S()} world=${Inv.world.length}`);
    // tirar
    Inv.open = true; Inv.sel = { i: 0 }; Inv.onClick({ target: { closest: () => ({ dataset: { act: 'drop' } }) } }); Inv.open = false;
    out.push(`drop -> ${S()} world=${Inv.world.length}`);
    return out;
  });
  console.log(r.join('\n'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
