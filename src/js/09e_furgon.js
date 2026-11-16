// ---- 09e_furgon.js ----
// =====================================================================
// EL FURGÓN — interior del camión de Prisiones (interludios de campaña).
// El mapa solo pone suelo, límites y el asiento; el interior (toldo,
// bancos, lámpara, el guardia, la carretera por la rendija) lo arma y
// lo anima el motor de escenas (12f_scenes, FurgonSet) dentro de
// MapSys.decor, para que se descargue con el mapa.
// No sale en la lista de mapas del multijugador.
// =====================================================================
MAPS.furgon = {
  name: { es: 'El furgón', en: 'The van' },
  desc: { es: 'Carretera de la sierra de Ocoa, de noche, con lluvia.', en: 'Sierra de Ocoa road, at night, in the rain.' },
  campaign: true,
  thumb: ['#050608', '#1a1712', '#0c0b09'],
  theme: { skyTop: 0x020304, skyMid: 0x050607, skyBot: 0x020203, fog: 0x030405, fogNear: 4, fogFar: 26, sun: 0x55606e, sunI: 0.04, sunDir: [0.2, 0.9, 0.3], hemiTop: 0x3a3a36, hemiBot: 0x141210, hemiI: 0.42, exposure: 1.4, cloud: 0, rays: 0, glow: 0, lamps: false, soldFill: 0.5, soldRim: 0.3 },
  build(B) {
    B.bounds(-4, -4, 4, 60);
    B.ground(-4, -4, 4, 60, { y: -0.95, pattern: PAT.CONCRETE, color: 0x1a1a18 });
    B.spawn('ffa', -0.8, -0.95, 0.5, -Math.PI / 2);
  },
};
