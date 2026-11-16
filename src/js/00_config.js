// ---- 00_config.js ----
// =====================================================================
// CONFIG — todo el balance y tuning del juego vive aquí
// =====================================================================
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const CONFIG = {
  GAME_NAME: 'CALL OF WASHED',
  GAME_TAG: { es: 'La Conflagración · 1939–1945', en: 'The Conflagration · 1939–1945' },
  VERSION: '3.2.3', TITLE_EN: 'WarTime',

  SIM_HZ: 60,               // timestep fijo de la simulación
  PHYS_SUBSTEPS: 2,         // sub-pasos de cannon por tick (120 Hz efectivos)
  MAX_FRAME_STEPS: 5,       // ticks máximos por frame (anti espiral de la muerte)
  KILL_Y: -30,              // red de seguridad (los mapas no tienen vacío)
  HISTORY_SEC: 1.0,         // historial de posiciones para compensación de latencia
  MAX_FIGHTERS: 8,

  MOVE: {
    gravity: 24,
    walkSpeed: 5.4,
    sprintSpeed: 8.1,
    crouchSpeed: 2.7,
    adsMul: 0.6,            // velocidad al apuntar con mira
    groundAccel: 10,
    friction: 8.5,
    stopSpeed: 2.6,
    airAccel: 4,            // poco control en el aire: nada de bunny hop
    airSpeedCap: 0.55,
    airControl: 1.1,
    jumpVel: 6.9,
    coyoteTime: 0.1,
    jumpBuffer: 0.12,
    bhopWindow: 0.3,        // saltar justo al aterrizar quita velocidad
    bhopPenalty: 0.72,
    stepHeight: 0.46,
    groundSnap: 0.36,
    slideMinSpeed: 6.8,
    slideBoost: 1.8,
    slideFriction: 1.35,
    slideDuration: 0.72,
    slideCooldown: 1.1,
    slideMaxBoostSpeed: 9.6,
    mantleMin: 0.45,        // trepar bordes entre 0.45 y 1.6 m
    mantleMax: 1.6,
    mantleTime: 0.44,
    mantleReach: 0.7,
    sprintOutTime: 0.17,    // tiempo para poder disparar tras soltar el sprint
    fallDamageVel: 14,      // caídas de más de ~4 m duelen
    fallDamageMul: 7,
    knockFrictionTime: 0.2,
    knockFrictionMul: 0.4,
    fighterPush: 6,
    wireSlow: 0.45,         // alambre de púas
    proneSpeed: 1.25,       // arrastrarse
    proneTime: 0.5,         // tiempo para tumbarse / levantarse
    leanMoveMul: 0.72,      // velocidad mientras te asomas
  },

  CAMERA: {
    fov: 78,
    sprintFov: 5,
    thirdBack: 2.9,
    thirdUp: 0.3,
    thirdRight: 0.62,
    aimBack: 1.7,
    aimRight: 0.74,
    pivotHeight: 1.56,
    collideRadius: 0.2,
    shakeDecay: 7,
    firstEye: 1.63,
    crouchEye: 1.12,
    slideEye: 0.78,
    ragdollFollow: 6,
    shoulderSpeed: 9,       // velocidad de la transición de hombro
    proneEye: 0.4,
    proneFwd: 0.52,         // tumbado, los ojos van adelante del centro
    leanDist: 0.38,         // desplazamiento lateral al asomarse
    leanRoll: 0.17,
  },

  FIGHTER: {
    hp: 100,
    radius: 0.32,
    height: 1.82,
    crouchHeight: 1.22,
    proneHeight: 0.62,
    headRadius: 0.165,
    staggerImpulse: 6.5,    // a partir de aquí se tambalea (no sale volando)
    staggerTime: 0.24,
    knockdownK: 0.42,       // explosión cercana que no mata: derribo
    regenDelay: 4.5,
    regenRate: 22,
    spawnProtect: 1.6,
    lastHitCredit: 5,
    assistMin: 25,
  },

  RAGDOLL: {
    stiffness: 1e7,
    relaxation: 4,
    iterations: 14,
    linearDamping: 0.08,
    angularDamping: 0.55,
    friction: 0.65,
    restitution: 0.04,
    mass: { pelvis: 3.2, chest: 4.2, head: 1.2, upperArmL: 0.7, upperArmR: 0.7, foreArmL: 0.5, foreArmR: 0.5, thighL: 1.5, thighR: 1.5, shinL: 1.0, shinR: 1.0 },
    activeTime: 0.32,       // "cuerpo activo" antes de desplomarse
    activeSupport: 0.7,
    activeDamping: 0.92,
    deathPush: 1.0,         // multiplicador del impulso de muerte
    knockTime: 0.95,
    settleSpeed: 1.3,
    hardMaxTime: 3.4,
    getupTime: 0.6,
    maxLinVel: 30,
    maxAngVel: 18,
    corpseMax: 10,
    freezeAfter: 3.8,       // los cuerpos quietos dejan de simularse
  },

  // ---------------- ARMAS (3.1.0: de época, 1939–1945) ----------------
  // spread en radianes; recoilV/H en radianes por disparo; push = impulso (m/s) sobre el cuerpo
  // bolt: fusil de cerrojo (se maneja el cerrojo tras cada disparo) · longRange: balística de tiro largo (caída, viento, tiempo de vuelo, pulso) · mv: velocidad inicial (m/s)
  WEAPONS: {
    rifle: {
      name: { es: 'Ferrán M-1912', en: 'Ferrán M-1912' }, cls: { es: 'Fusil de cerrojo · 7 mm', en: 'Bolt-action rifle · 7 mm' }, slot: 'primary', bolt: true,
      kind: 'hitscan', auto: false, damage: 88, headMul: 1.8, legMul: 0.75, fireRate: 1.15, pellets: 1,
      hip: 0.06, ads: 0.0016, moveSpread: 0.05, airSpread: 0.12, bloom: 0, bloomMax: 0, bloomDecay: 1,
      recoilV: 0.058, recoilH: 0.01, recoilRecover: 0.4,
      range: 320, fall0: 120, fall1: 240, fallMin: 0.85,
      mag: 5, reserve: 40, reload: 2.7, reloadTac: 2.1, adsTime: 0.28, zoom: 1.3, moveMul: 0.92,
      pen: 0.6, armMul: 0.95, push: 3.4, sound: 'dmr', casing: true, flash: 1.2, mv: 730,
      stats: { dmg: 0.88, rate: 0.12, range: 0.95, mob: 0.45 },
    },
    dmr: {
      name: { es: 'Fusil vardenés M-98', en: 'Vardenese M-98 rifle' }, cls: { es: 'Fusil de cerrojo · 7,92', en: 'Bolt-action rifle · 7.92' }, slot: 'primary', bolt: true,
      kind: 'hitscan', auto: false, damage: 92, headMul: 1.8, legMul: 0.75, fireRate: 1.1, pellets: 1,
      hip: 0.058, ads: 0.0015, moveSpread: 0.05, airSpread: 0.12, bloom: 0, bloomMax: 0, bloomDecay: 1,
      recoilV: 0.062, recoilH: 0.011, recoilRecover: 0.4,
      range: 320, fall0: 120, fall1: 240, fallMin: 0.85,
      mag: 5, reserve: 40, reload: 2.6, reloadTac: 2.0, adsTime: 0.27, zoom: 1.3, moveMul: 0.93,
      pen: 0.62, armMul: 0.95, push: 3.6, sound: 'dmr', casing: true, flash: 1.3, mv: 760,
      stats: { dmg: 0.92, rate: 0.12, range: 0.95, mob: 0.48 },
    },
    battle: {
      name: { es: 'Brenner M-43', en: 'Brenner M-43' }, cls: { es: 'Fusil semiautomático', en: 'Semi-automatic rifle' }, slot: 'primary',
      kind: 'hitscan', auto: false, damage: 54, headMul: 1.9, legMul: 0.8, fireRate: 4.2, pellets: 1,
      hip: 0.055, ads: 0.0022, moveSpread: 0.045, airSpread: 0.1, bloom: 0.005, bloomMax: 0.022, bloomDecay: 0.12,
      recoilV: 0.034, recoilH: 0.009, recoilRecover: 0.5,
      range: 260, fall0: 70, fall1: 150, fallMin: 0.8,
      mag: 10, reserve: 50, reload: 2.8, reloadTac: 2.2, adsTime: 0.27, zoom: 1.35, moveMul: 0.92,
      pen: 0.5, armMul: 0.95, push: 2.8, sound: 'dmr', casing: true, flash: 1.2, extMag: 5,
      stats: { dmg: 0.72, rate: 0.4, range: 0.88, mob: 0.48 },
    },
    smg: {
      name: { es: 'Subfusil atlántico M-28', en: 'Atlantic M-28 SMG' }, cls: { es: 'Subfusil · 9 mm', en: 'SMG · 9 mm' }, slot: 'primary',
      kind: 'hitscan', auto: true, damage: 24, headMul: 1.7, legMul: 0.85, fireRate: 11, pellets: 1,
      hip: 0.034, ads: 0.012, moveSpread: 0.012, airSpread: 0.05, bloom: 0.0045, bloomMax: 0.032, bloomDecay: 0.15,
      recoilV: 0.016, recoilH: 0.011, recoilRecover: 0.5,
      range: 80, fall0: 12, fall1: 30, fallMin: 0.55,
      mag: 20, reserve: 140, reload: 2.2, reloadTac: 1.75, adsTime: 0.17, zoom: 1.18, moveMul: 1.02,
      pen: 0.15, armMul: 0.95, push: 1.4, sound: 'smg', casing: true, flash: 0.9, extMag: 10, drumMag: 50,
      stats: { dmg: 0.52, rate: 0.85, range: 0.38, mob: 0.85 },
    },
    tsmg: {
      name: { es: 'Subfusil vardenés MP-38', en: 'Vardenese MP-38 SMG' }, cls: { es: 'Subfusil de chapa · 9 mm', en: 'Stamped SMG · 9 mm' }, slot: 'primary',
      kind: 'hitscan', auto: true, damage: 22, headMul: 1.7, legMul: 0.85, fireRate: 9, pellets: 1,
      hip: 0.03, ads: 0.01, moveSpread: 0.01, airSpread: 0.045, bloom: 0.0035, bloomMax: 0.026, bloomDecay: 0.16,
      recoilV: 0.013, recoilH: 0.009, recoilRecover: 0.52,
      range: 80, fall0: 13, fall1: 32, fallMin: 0.55,
      mag: 32, reserve: 160, reload: 2.1, reloadTac: 1.65, adsTime: 0.16, zoom: 1.18, moveMul: 1.05,
      pen: 0.14, armMul: 0.95, push: 1.3, sound: 'pdw', casing: true, flash: 0.8, extMag: 8,
      stats: { dmg: 0.46, rate: 0.72, range: 0.4, mob: 0.92 },
    },
    shotgun: {
      name: { es: 'Escopeta de trinchera M-97', en: 'M-97 trench gun' }, cls: { es: 'Escopeta de corredera', en: 'Pump shotgun' }, slot: 'primary',
      kind: 'hitscan', auto: false, damage: 17, headMul: 1.4, legMul: 0.85, fireRate: 1.4, pellets: 9,
      hip: 0.085, ads: 0.06, moveSpread: 0.01, airSpread: 0.02, bloom: 0, bloomMax: 0, bloomDecay: 1,
      recoilV: 0.058, recoilH: 0.014, recoilRecover: 0.5,
      range: 40, fall0: 6, fall1: 18, fallMin: 0.15,
      mag: 5, reserve: 30, reload: 2.8, reloadTac: 2.3, adsTime: 0.2, zoom: 1.12, moveMul: 0.98,
      pen: 0.05, armMul: 0.95, push: 1.0, sound: 'shotgun', casing: true, flash: 1.3, extMag: 1,
      stats: { dmg: 0.95, rate: 0.22, range: 0.15, mob: 0.72 },
    },
    dbl: {
      name: { es: 'Escopeta de caza', en: 'Hunting shotgun' }, cls: { es: 'Escopeta de dos cañones', en: 'Double-barrel shotgun' }, slot: 'primary',
      kind: 'hitscan', auto: false, damage: 20, headMul: 1.3, legMul: 0.85, fireRate: 3.2, pellets: 10,
      hip: 0.09, ads: 0.065, moveSpread: 0.01, airSpread: 0.02, bloom: 0, bloomMax: 0, bloomDecay: 1,
      recoilV: 0.086, recoilH: 0.022, recoilRecover: 0.4,
      range: 30, fall0: 5, fall1: 16, fallMin: 0.12,
      mag: 2, reserve: 20, reload: 2.6, reloadTac: 2.6, adsTime: 0.2, zoom: 1.12, moveMul: 0.98,
      pen: 0.06, armMul: 0.95, push: 1.2, sound: 'shotgun', casing: true, flash: 1.5, extMag: 0,
      stats: { dmg: 1, rate: 0.25, range: 0.12, mob: 0.7 },
    },
    mk2: {
      name: { es: 'Ferrán M-32 con mira', en: 'Ferrán M-32 scoped' }, cls: { es: 'Fusil de tirador · 7 mm', en: 'Marksman rifle · 7 mm' }, slot: 'primary', bolt: true, longRange: true,
      kind: 'hitscan', auto: false, damage: 95, headMul: 2, legMul: 0.75, fireRate: 1.0, pellets: 1,
      hip: 0.085, ads: 0, moveSpread: 0.06, airSpread: 0.12, bloom: 0, bloomMax: 0, bloomDecay: 1,
      recoilV: 0.063, recoilH: 0.011, recoilRecover: 0.38,
      range: 1400, fall0: 160, fall1: 400, fallMin: 0.9,
      mag: 5, reserve: 30, reload: 3.0, reloadTac: 2.4, adsTime: 0.34, zoom: 2.5, scope: true, moveMul: 0.9,
      pen: 0.7, armMul: 0.95, push: 4.2, sound: 'sniper', casing: true, flash: 1.3, mv: 740,
      stats: { dmg: 0.95, rate: 0.1, range: 1, mob: 0.4 },
    },
    sniper: {
      name: { es: 'Kehlmann K98-Z', en: 'Kehlmann K98-Z' }, cls: { es: 'Carabina de cerrojo con mira · 7,92', en: 'Scoped bolt-action carbine · 7.92' }, slot: 'primary', bolt: true, longRange: true,
      kind: 'hitscan', auto: false, damage: 110, headMul: 2, legMul: 0.75, fireRate: 0.95, pellets: 1,
      hip: 0.09, ads: 0, moveSpread: 0.06, airSpread: 0.12, bloom: 0, bloomMax: 0, bloomDecay: 1,
      recoilV: 0.07, recoilH: 0.012, recoilRecover: 0.35,
      range: 1500, fall0: 300, fall1: 600, fallMin: 1,
      mag: 5, reserve: 25, reload: 3.1, reloadTac: 2.6, adsTime: 0.36, zoom: 4.0, scope: true, moveMul: 0.88,
      pen: 0.8, armMul: 0.95, push: 5, sound: 'sniper', casing: true, flash: 1.4, mv: 760,
      stats: { dmg: 1, rate: 0.1, range: 1, mob: 0.35 },
    },
    lmg: {
      name: { es: 'Ametralladora vardenesa M-34', en: 'Vardenese M-34 machine gun' }, cls: { es: 'Ametralladora de cinta', en: 'Belt-fed machine gun' }, slot: 'primary',
      kind: 'hitscan', auto: true, damage: 27, headMul: 1.7, legMul: 0.8, fireRate: 13, pellets: 1,
      hip: 0.065, ads: 0.006, moveSpread: 0.055, airSpread: 0.13, bloom: 0.006, bloomMax: 0.042, bloomDecay: 0.09,
      recoilV: 0.019, recoilH: 0.0135, recoilRecover: 0.38,
      range: 160, fall0: 34, fall1: 72, fallMin: 0.72,
      mag: 50, reserve: 200, reload: 5.2, reloadTac: 4.6, adsTime: 0.45, zoom: 1.32, moveMul: 0.8,
      pen: 0.45, armMul: 0.95, push: 2.2, sound: 'lmg', casing: true, flash: 1.3, drumMag: 75,
      stats: { dmg: 0.66, rate: 0.95, range: 0.78, mob: 0.15 },
    },
    mg2: {
      name: { es: 'Fusil ametrallador FA-30', en: 'FA-30 automatic rifle' }, cls: { es: 'Fusil ametrallador sanmarcialense', en: 'Sanmarcial automatic rifle' }, slot: 'primary',
      kind: 'hitscan', auto: true, damage: 33, headMul: 1.7, legMul: 0.8, fireRate: 8, pellets: 1,
      hip: 0.062, ads: 0.005, moveSpread: 0.05, airSpread: 0.12, bloom: 0.006, bloomMax: 0.038, bloomDecay: 0.1,
      recoilV: 0.023, recoilH: 0.0125, recoilRecover: 0.4,
      range: 170, fall0: 38, fall1: 80, fallMin: 0.74,
      mag: 20, reserve: 160, reload: 3.0, reloadTac: 2.5, adsTime: 0.38, zoom: 1.35, moveMul: 0.85,
      pen: 0.5, armMul: 0.95, push: 2.4, sound: 'kal', casing: true, flash: 1.2, extMag: 10,
      stats: { dmg: 0.78, rate: 0.55, range: 0.82, mob: 0.25 },
    },
    pistol: {
      name: { es: 'Orbea 9 mm', en: 'Orbea 9 mm' }, cls: { es: 'Pistola · cargador de 8', en: 'Pistol · 8-round mag' }, slot: 'secondary',
      kind: 'hitscan', auto: false, damage: 26, headMul: 2, legMul: 0.85, fireRate: 5.5, pellets: 1,
      hip: 0.03, ads: 0.008, moveSpread: 0.01, airSpread: 0.04, bloom: 0.011, bloomMax: 0.032, bloomDecay: 0.2,
      recoilV: 0.026, recoilH: 0.006, recoilRecover: 0.62,
      range: 60, fall0: 12, fall1: 30, fallMin: 0.6,
      mag: 8, reserve: 40, reload: 1.6, reloadTac: 1.3, adsTime: 0.13, zoom: 1.12, moveMul: 1.06,
      pen: 0.12, armMul: 0.95, push: 1.2, sound: 'pistol', casing: true, flash: 0.7,
    },
    hp45: {
      name: { es: 'Pistola vardenesa P-08', en: 'Vardenese P-08 pistol' }, cls: { es: 'Pistola de rodillera', en: 'Toggle-lock pistol' }, slot: 'secondary',
      kind: 'hitscan', auto: false, damage: 30, headMul: 2, legMul: 0.85, fireRate: 5.2, pellets: 1,
      hip: 0.028, ads: 0.006, moveSpread: 0.011, airSpread: 0.04, bloom: 0.011, bloomMax: 0.03, bloomDecay: 0.22,
      recoilV: 0.029, recoilH: 0.006, recoilRecover: 0.6,
      range: 70, fall0: 14, fall1: 34, fallMin: 0.6,
      mag: 8, reserve: 40, reload: 1.7, reloadTac: 1.4, adsTime: 0.13, zoom: 1.15, moveMul: 1.05,
      pen: 0.14, armMul: 0.95, push: 1.4, sound: 'pistol', casing: true, flash: 0.75,
    },
    magnum: {
      name: { es: 'Revólver de oficial', en: "Officer's revolver" }, cls: { es: 'Revólver de seis', en: 'Six-shot revolver' }, slot: 'secondary',
      kind: 'hitscan', auto: false, damage: 55, headMul: 2, legMul: 0.8, fireRate: 2.2, pellets: 1,
      hip: 0.03, ads: 0.004, moveSpread: 0.012, airSpread: 0.045, bloom: 0.012, bloomMax: 0.03, bloomDecay: 0.25,
      recoilV: 0.05, recoilH: 0.008, recoilRecover: 0.55,
      range: 90, fall0: 20, fall1: 50, fallMin: 0.6,
      mag: 6, reserve: 36, reload: 2.9, reloadTac: 2.5, adsTime: 0.14, zoom: 1.18, moveMul: 1.03,
      pen: 0.2, armMul: 0.95, push: 3.0, sound: 'magnum', casing: false, flash: 1.2,
    },
    rocket: {
      name: { es: 'Tubo antitanque «Puño»', en: '"Fist" anti-tank tube' }, cls: { es: 'Arma pesada de un solo uso', en: 'Single-use heavy weapon' }, slot: 'primary',
      kind: 'projectile', auto: false, damage: 150, headMul: 1, legMul: 1, fireRate: 0.6, pellets: 1,
      hip: 0.02, ads: 0, moveSpread: 0.01, airSpread: 0.03, bloom: 0, bloomMax: 0, bloomDecay: 1,
      recoilV: 0.07, recoilH: 0.01, recoilRecover: 0.4,
      range: 260, mag: 1, reserve: 2, reload: 3.2, reloadTac: 3.2, adsTime: 0.32, zoom: 1.4, moveMul: 0.85,
      projSpeed: 42, radius: 5.2, push: 16, selfDamageMul: 0.75,
      sound: 'rocket', casing: false, flash: 1.6,
    },
    knife: {
      name: { es: 'Cuchillo de trinchera', en: 'Trench knife' }, cls: { es: 'Cuerpo a cuerpo', en: 'Melee' }, slot: 'melee',
      kind: 'melee', auto: false, damage: 100, headMul: 1, legMul: 1, fireRate: 1.4, pellets: 1,
      range: 2.15, arc: 0.8, lunge: 2.4, push: 3, hitDelay: 0.13, moveMul: 1.08, adsTime: 0.1, zoom: 1,
      hip: 0, ads: 0, mag: Infinity, reserve: Infinity, reload: 0, reloadTac: 0, sound: 'knife', casing: false,
    },
  },
  // armas agrupadas por clase (el armero y la lista de armas las muestran así)
  PRIMARIES: ['rifle', 'dmr', 'battle', 'smg', 'tsmg', 'shotgun', 'dbl', 'mk2', 'sniper', 'lmg', 'mg2'],
  SECONDARIES: ['pistol', 'hp45', 'magnum'],
  WCLASS_ORDER: ['ar', 'mm', 'smg', 'sg', 'sn', 'lmg'],
  WCLASSES: {
    ar: { es: 'Fusiles de cerrojo', en: 'Bolt-action rifles', s: { es: 'Cerrojo', en: 'Bolt' } }, smg: { es: 'Subfusiles', en: 'SMGs', s: { es: 'Subfusil', en: 'SMG' } },
    sg: { es: 'Escopetas', en: 'Shotguns', s: { es: 'Escopeta', en: 'Shotgun' } }, mm: { es: 'Fusiles semiautomáticos', en: 'Semi-automatic rifles', s: { es: 'Semiautomático', en: 'Semi-auto' } },
    sn: { es: 'Fusiles con mira', en: 'Scoped rifles', s: { es: 'Con mira', en: 'Scoped' } }, lmg: { es: 'Ametralladoras', en: 'Machine guns', s: { es: 'Ametralladora', en: 'MG' } },
    hg: { es: 'Armas cortas', en: 'Sidearms', s: { es: 'Cortas', en: 'Sidearms' } },
  },
  WCLASS_OF: { rifle: 'ar', dmr: 'ar', battle: 'mm', smg: 'smg', tsmg: 'smg', shotgun: 'sg', dbl: 'sg', mk2: 'sn', sniper: 'sn', lmg: 'lmg', mg2: 'lmg', pistol: 'hg', hp45: 'hg', magnum: 'hg' },

  // ---------------- ACCESORIOS, VENTAJAS Y CLASES (de época) ----------------
  // ranuras por arma (la primera opción es la de fábrica); lvl = nivel de desbloqueo para la clase personalizada
  ATTACH: {
    order: ['optic', 'muzzle', 'barrel', 'grip', 'mag', 'stock', 'ammo'],
    pick: 5,   // máximo de accesorios que no son de fábrica por arma
    slots: {}, // se genera al final del archivo (opciones por arma; la primera es la de fábrica)
    slotNames: { optic: { es: 'Mira', en: 'Sight' }, muzzle: { es: 'Boca', en: 'Muzzle' }, barrel: { es: 'Cañón', en: 'Barrel' }, grip: { es: 'Bajo cañón', en: 'Underbarrel' }, mag: { es: 'Carga', en: 'Feed' }, stock: { es: 'Culata', en: 'Stock' }, ammo: { es: 'Munición', en: 'Ammo' } },
    items: {
      iron: { es: 'Alza y punto de mira', en: 'Iron sights', d: { es: 'Las de fábrica: alza de hoja graduada y punto de mira con túnel.', en: 'Factory leaf sight and hooded front post.' }, lvl: 1 },
      x2: { es: 'Mira telescópica 2,5x', en: '2.5x telescopic sight', d: { es: 'Tubo de acero sobre anillas. Más aumento y precisión; apuntas más lento.', en: 'Steel tube on rings. More zoom and precision; slower to aim.' }, lvl: 10 },
      x4: { es: 'Mira telescópica 4x', en: '4x telescopic sight', d: { es: 'Largo alcance. Apuntas bastante más lento y pierdes visión periférica.', en: 'Long range. Noticeably slower to aim and a narrower view.' }, lvl: 30 },
      scope: { es: 'Mira telescópica fija', en: 'Fixed telescopic sight', d: { es: 'Retícula de tres postes y torreta de alza por clics de 100 m.', en: 'Three-post reticle and a 100 m-per-click elevation turret.' }, lvl: 1 },
      none: { es: 'De fábrica', en: 'Factory', d: { es: 'Sin modificar.', en: 'Unmodified.' }, lvl: 1 },
      comp: { es: 'Compensador de boca', en: 'Muzzle compensator', d: { es: 'Desvía los gases hacia arriba: menos retroceso vertical, fogonazo más grande.', en: 'Vents gas upward: less vertical recoil, bigger flash.' }, lvl: 2 },
      supp: { es: 'Supresor de época', en: 'Period suppressor', d: { es: 'Raro y pesado. Se oye mucho menos y no te marca el avión de reconocimiento; pierde alcance.', en: 'Rare and heavy. Much quieter and hidden from recon planes; loses range.' }, lvl: 38 },
      fhider: { es: 'Apagallamas', en: 'Flash hider', d: { es: 'Cono en la boca: casi sin fogonazo y algo menos de retroceso.', en: 'Muzzle cone: almost no flash and slightly less recoil.' }, lvl: 15 },
      brake: { es: 'Freno de boca', en: 'Muzzle brake', d: { es: 'Mucho menos retroceso lateral; el disparo se oye más fuerte.', en: 'Much less horizontal recoil; the shot is louder.' }, lvl: 26 },
      choke: { es: 'Estrangulador', en: 'Choke', d: { es: 'Perdigones más juntos y más alcance.', en: 'Tighter pellet spread and more range.' }, lvl: 9 },
      bayo: { es: 'Bayoneta calada', en: 'Fixed bayonet', d: { es: 'El golpe cuerpo a cuerpo llega más lejos y siempre mata; apuntas un poco más lento.', en: 'Melee reaches further and always kills; slightly slower aiming.' }, lvl: 4 },
      long: { es: 'Cañón largo', en: 'Long barrel', d: { es: '+18% de alcance y más precisión; apuntas un poco más lento.', en: '+18% range and tighter aim; a bit slower to aim.' }, lvl: 12 },
      short: { es: 'Cañón recortado', en: 'Cut-down barrel', d: { es: 'Apuntas y te mueves más rápido; menos alcance.', en: 'Faster aiming and movement; less range.' }, lvl: 19 },
      heavy: { es: 'Cañón pesado', en: 'Heavy barrel', d: { es: '10% menos retroceso; algo más lento al apuntar y moverte.', en: '10% less recoil; slightly slower aiming and movement.' }, lvl: 31 },
      vgrip: { es: 'Empuñadura delantera', en: 'Front pistol grip', d: { es: 'Empuñadura vertical de nogal: mucho menos retroceso lateral.', en: 'Walnut vertical grip: much less horizontal recoil.' }, lvl: 3 },
      sling: { es: 'Correa de tiro', en: 'Shooting sling', d: { es: 'La correa tensada en el brazo: más precisión al apuntar y algo menos de retroceso.', en: 'Sling wrapped round the arm: tighter aim and a little less recoil.' }, lvl: 6 },
      bipod: { es: 'Bípode', en: 'Bipod', d: { es: 'Agachado o tumbado el retroceso baja a la mitad. Más lento al apuntar de pie.', en: 'Crouched or prone, recoil is halved. Slower to aim standing.' }, lvl: 40 },
      std: { es: 'Reglamentaria', en: 'Standard', d: { es: 'De fábrica.', en: 'Stock.' }, lvl: 1 },
      ext: { es: 'Cargador largo', en: 'Long magazine', d: { es: 'Más balas; recargas y apuntas un poco más lento.', en: 'More rounds; slightly slower reload and aim.' }, lvl: 4 },
      fast: { es: 'Peines de carga', en: 'Stripper clips', d: { es: 'Peines y cargadores preparados: recarga 22% más rápida con las mismas balas.', en: 'Clips and mags made ready: 22% faster reloads with the same rounds.' }, lvl: 14 },
      drum: { es: 'Tambor', en: 'Drum', d: { es: 'Muchas más balas; recarga lenta y pesa.', en: 'Many more rounds; slow reload and heavy.' }, lvl: 33 },
      skel: { es: 'Culata recortada', en: 'Cut-down stock', d: { es: 'Apuntas y te mueves más rápido; el retroceso sube un poco.', en: 'Faster aiming and movement; a bit more recoil.' }, lvl: 17 },
      pad: { es: 'Cantonera de goma', en: 'Rubber butt pad', d: { es: '12% menos retroceso; algo más lento al apuntar.', en: '12% less recoil; slightly slower aiming.' }, lvl: 27 },
      fmj: { es: 'Reglamentaria', en: 'Service ammo', d: { es: 'Munición estándar.', en: 'Standard ammunition.' }, lvl: 1 },
      ap: { es: 'Perforante', en: 'Armor piercing', d: { es: 'Atraviesa mucho mejor madera y chapa; 6% menos daño.', en: 'Punches through wood and sheet metal far better; 6% less damage.' }, lvl: 22 },
      hp: { es: 'Punta blanda', en: 'Soft point', d: { es: '+8% de daño; casi no atraviesa y pierde algo de alcance.', en: '+8% damage; barely penetrates and loses some range.' }, lvl: 29 },
    },
  },
  PERKS: {
    ammo: { es: 'Cartucheras llenas', en: 'Full pouches', d: { es: '+50% de munición de reserva y una granada más.', en: '+50% reserve ammo and one more grenade.' }, lvl: 1 },
    fast: { es: 'Mano rápida', en: 'Sleight of hand', d: { es: 'Recargas y cambias de arma un 25% más rápido.', en: 'Reload and swap weapons 25% faster.' }, lvl: 1 },
    quiet: { es: 'Fantasma', en: 'Ghost', d: { es: 'El avión de reconocimiento enemigo no te marca y tus pasos casi no se oyen.', en: 'Enemy recon planes miss you and your steps are near-silent.' }, lvl: 5 },
    vest: { es: 'Peto antimetralla', en: 'Splinter plate', d: { es: '40% menos daño explosivo; las explosiones no te derriban.', en: '40% less explosive damage; blasts never knock you down.' }, lvl: 7 },
    steady: { es: 'Pulso firme', en: 'Steady aim', d: { es: '20% menos retroceso, apuntas más rápido y aguantas más la respiración.', en: '20% less recoil, faster aiming and a longer held breath.' }, lvl: 12 },
    runner: { es: 'Corredor', en: 'Runner', d: { es: '+7% de velocidad y deslizamientos que se recargan antes.', en: '+7% move speed and slides that recharge sooner.' }, lvl: 17 },
    medic: { es: 'Botiquín', en: 'Field dressing', d: { es: 'Empiezas a curarte antes y más rápido; las heridas de zona duran menos.', en: 'Healing starts sooner and faster; zone wounds wear off sooner.' }, lvl: 26 },
    hardline: { es: 'Línea dura', en: 'Hardline', d: { es: 'Las rachas de bajas cuestan 1 baja menos.', en: 'Killstreaks cost 1 less kill.' }, lvl: 34 },
  },
  CLASSES: {
    rifleman: { es: 'Fusilero', en: 'Rifleman', d: { es: 'Ferrán M-1912 con bayoneta y correa. El arma del soldado de infantería.', en: 'Ferrán M-1912 with bayonet and sling. The infantryman\'s rifle.' }, primary: 'rifle', att: { optic: 'iron', muzzle: 'bayo', grip: 'sling', mag: 'std' }, frags: 2, smokes: 1, perk: 'ammo' },
    scout: { es: 'Asalto', en: 'Assault', d: { es: 'Subfusil atlántico con compensador y cargador largo. Rápido y con humo de sobra.', en: 'Atlantic SMG with compensator and long magazine. Fast, with plenty of smoke.' }, primary: 'smg', att: { optic: 'iron', muzzle: 'comp', grip: 'none', mag: 'ext' }, frags: 1, smokes: 2, perk: 'quiet' },
    breacher: { es: 'Trinchera', en: 'Trench', d: { es: 'Escopeta de trinchera con bayoneta para limpiar casas. Aguanta explosiones.', en: 'Trench gun with bayonet for clearing rooms. Shrugs off blasts.' }, primary: 'shotgun', att: { optic: 'iron', muzzle: 'bayo', grip: 'none', mag: 'std' }, frags: 2, smokes: 1, perk: 'vest' },
    marksman: { es: 'Tirador', en: 'Marksman', d: { es: 'Ferrán M-32 con mira fija y pulso firme. Caída, viento y respiración.', en: 'Scoped Ferrán M-32 and steady aim. Drop, wind and breathing.' }, primary: 'mk2', att: { optic: 'scope', muzzle: 'none', grip: 'sling', mag: 'std' }, frags: 1, smokes: 1, perk: 'steady' },
    custom: { es: 'Personalizada', en: 'Custom', d: { es: 'Tu arma, tus accesorios y tu ventaja. Desbloqueas más al subir de nivel.', en: 'Your weapon, attachments and perk. Rank up to unlock more.' }, frags: 2, smokes: 1 },
  },
  CLASS_ORDER: ['rifleman', 'scout', 'breacher', 'marksman', 'custom'],
  SMOKE: { fuse: 1.5, duration: 17, radius: 5.4, grow: 2.2, throwSpeed: 15, blockLen: 1.7 },
  // rachas de época: avión de reconocimiento de hélice, lanzamiento en paracaídas, mortero, interferencia de radio y bombardero
  STREAKS: {
    uav: { kills: 3, dur: 28, es: 'Avión de reconocimiento', en: 'Recon plane', d: { es: 'Un avión de hélice sobrevuela el frente y marca a los enemigos en el plano de tu equipo.', en: 'A propeller plane circles the front and marks enemies on your team map.' } },
    mortar: { kills: 5, shells: 7, radius: 4.8, damage: 125, push: 12, spread: 6.5, delay: 2.6, every: 0.48, es: 'Mortero', en: 'Mortar barrage', d: { es: 'Marca un punto: siete granadas de mortero caen alrededor.', en: 'Mark a spot: seven mortar bombs land around it.' } },
    air: { kills: 7, bombs: 8, spacing: 4.4, radius: 6.2, damage: 160, push: 15, delay: 4.2, es: 'Bombardero', en: 'Bomber run', d: { es: 'Un bombardero bimotor suelta una línea de bombas hacia donde miras.', en: 'A twin-engine bomber drops a line of bombs in the direction you face.' } },
    supply: { kills: 4, dur: 30, radius: 2.6, hp: 60, es: 'Lanzamiento en paracaídas', en: 'Parachute drop', d: { es: 'Cae una caja de madera en paracaídas: tú y tu equipo recargan munición y curan al acercarse.', en: 'A wooden crate drops by parachute: you and your team refill ammo and heal when near.' } },
    jam: { kills: 6, dur: 20, es: 'Interferencia de radio', en: 'Radio jamming', d: { es: 'Las radios enemigas se llenan de estática: su plano se borra y no ven nombres ni reconocimiento.', en: 'Enemy radios fill with static: their map blanks out and they lose names and recon.' } },
  },
  STREAK_ORDER: ['uav', 'supply', 'mortar', 'jam', 'air'],
  PROG: { max: 50, base: 700, step: 115, winBonus: 400, playBonus: 150, prestigeMax: 10, prestigeBonus: 0.05 },
  // niveles de arma (1–20): se ganan usando el arma; cada nivel abre accesorios y, al final, el camuflaje de maestría
  WLVL: { max: 20, base: 400, step: 150, kill: 100, head: 50, long: 30, longDist: 35, closeDist: 6, dmgXp: 0.1 },
  GRENADE: { count: 2, fuse: 3.2, throwSpeed: 17, upBoost: 2.6, damage: 140, radius: 6.5, push: 13, radiusKill: 2.6 },
  BARREL: { hp: 35, damage: 125, radius: 5.4, push: 12 },
  // penetración: espesor equivalente en madera (m) que cada arma puede atravesar; cada material divide el espesor efectivo
  PEN: { mat: { wood: 1, metal: 0.55, sand: 0.38, dirt: 0.18, concrete: 0.06 }, maxPass: 2, keep: 0.72 },
  // heridas por zona (solo cuando la bala no mata)
  WOUND: { limpTime: 3.2, limpSpeed: 0.78, limpMinDmg: 11, armTime: 2.8, armAdsMul: 1.7, armRecoilMul: 1.4, armSpread: 0.016, armMinDmg: 9, dazeTime: 1.7, dazeMinDmg: 28, maxMarks: 9 },
  // destrucción de muros: paneles de 1.5 m con vida propia; las balas apenas los marcan, los explosivos abren huecos
  DESTRUCT: { tile: 1.5, wallHp: 135, woodHp: 70, sheetHp: 150 },
  DROP_LIFE: 32,
  POWER_RESPAWN: 50,

  // ---------------- IA ----------------
  BOTS: {
    easy:   { reaction: 0.55, aimNoise: 0.05,  aimSpeed: 4.2, burst: 0.5,  headChance: 0.05, nade: 0.15, cover: 0.45, flank: 0.15, ads: 0.5,  strafe: 0.5, view: 0.35, hearing: 16 },
    normal: { reaction: 0.34, aimNoise: 0.028, aimSpeed: 6.5, burst: 0.75, headChance: 0.15, nade: 0.35, cover: 0.8,  flank: 0.3,  ads: 0.85, strafe: 0.8, view: 0.15, hearing: 24 },
    hard:   { reaction: 0.2,  aimNoise: 0.015, aimSpeed: 10,  burst: 0.95, headChance: 0.35, nade: 0.55, cover: 1,    flank: 0.4,  ads: 1,    strafe: 1,   view: 0.0,  hearing: 30 },
  },

  // ---------------- RONDAS / MODOS ----------------
  ROUND: {
    countdown: 4,
    elimTime: 120,
    roundEndDelay: 2.4,
    intermission: 3.6,
    respawnTime: 4.2,
    killcamDelay: 1.5,     // espera tras la muerte: así la repetición incluye la caída del cuerpo
    killcamLen: 3.4,
  },
  DOM: { captureTime: 5.5, scoreEvery: 1.5, decay: 0.12 },

  // ---------------- CALIDAD ----------------
  QUALITY: {
    low:    { bump: false, post: false, dust: 0, pixelRatio: 1.0, minRatio: 0.7, shadows: false, shadowSize: 0,    antialias: false, particles: 260,  soft: 300,  rubble: 6,  decals: 60,  casings: 16, lights: false, corpses: 6, ragBudget: 2 },
    medium: { bump: true, post: false, dust: 90, pixelRatio: 1.5, minRatio: 0.85, shadows: true,  shadowSize: 2048, antialias: true, particles: 600,  soft: 700,  rubble: 14, decals: 140, casings: 36, lights: true,  corpses: 10, ragBudget: 4 },
    high:   { bump: true, post: true, ssao: true, dust: 220, pixelRatio: 2.0, minRatio: 1.0,  shadows: true,  shadowSize: 4096, antialias: true,  particles: 1000, soft: 1200, rubble: 30, decals: 260, casings: 60, lights: true,  corpses: 14, ragBudget: 6 },
  },

  GORE: {
    off:  { blood: 0, pools: false, label: { es: 'Sin sangre', en: 'No blood' } },
    low:  { blood: 1, pools: false, label: { es: 'Sobria', en: 'Subdued' } },
    high: { blood: 1.8, pools: true, label: { es: 'Intensa', en: 'Intense' } },
  },

  NET: {
    presenceHz: 20,
    flushMs: 100,           // eventos agrupados cada 100 ms (≈10 msg/s)
    interpDelay: 0.11,
    maxMsgBytes: 3800,
    pingEvery: 2,
    hostTimeout: 3.5,
    validateTolerance: 2.4,
    roomPrefix: 'frente-',
  },

  AUDIO: { master: 0.8, music: 0.4, sfx: 0.85 },

  TEAM_COLORS: ['#e8a33d', '#4aa3ff'],
  TEAM_NAMES: [{ es: 'SANMARCIAL', en: 'SANMARCIAL' }, { es: 'VARDEN', en: 'VARDEN' }],
  // facciones de la Conflagración (3.1.0): uniforme, prendas habituales y granada propia. En los modos por equipos cada bando viste lo suyo
  FACTIONS: {
    sanmarcial: { es: 'Sanmarcial', en: 'Sanmarcial', d: { es: 'Ejército de Sanmarcial', en: 'Army of Sanmarcial' }, look: { camo: 'woodland', helmet: ['adrian', 'adrian', 'adrian', 'cap', 'netted'], face: ['none', 'none', 'mustache', 'beard', 'scar'], vest: ['webbing', 'webbing', 'harness', 'bandolier'], pack: ['none', 'small', 'bedroll', 'assault'], pads: 'shin' }, nade: 'frag' },
    varden: { es: 'Varden', en: 'Varden', d: { es: 'Ejército imperial de Varden', en: 'Imperial Army of Varden' }, look: { camo: 'urban', helmet: ['stahl', 'stahl', 'stahl', 'cap'], face: ['none', 'none', 'scar', 'goggles'], vest: ['webbing', 'webbing', 'harness'], pack: ['assault', 'none', 'bedroll', 'small'], pads: 'shin' }, nade: 'stick' },
    atlantico: { es: 'Atlánticos', en: 'Atlantics', d: { es: 'Comandos de la Mancomunidad Atlántica', en: 'Atlantic Commonwealth commandos' }, look: { camo: 'tiger', helmet: ['brodie', 'brodie', 'beanie', 'beret'], face: ['paint', 'none', 'beard', 'paint'], vest: ['webbing', 'bandolier'], pack: ['assault', 'large', 'small'], pads: 'none' }, nade: 'frag' },
    tierralta: { es: 'Tierra Alta', en: 'Tierra Alta', d: { es: 'Montañeros de la República de Tierra Alta', en: 'Mountaineers of the Republic of Tierra Alta' }, look: { camo: 'earth', helmet: ['ushanka', 'beanie', 'boonie', 'ushanka'], face: ['beard', 'mustache', 'shemagh', 'beard'], vest: ['bandolier', 'harness'], pack: ['large', 'bedroll'], pads: 'shin', extra: 'poncho' }, nade: 'frag' },
  },
  // enfrentamientos elegibles en el menú de partida (equipo 0 contra equipo 1)
  MATCHUPS: { sv: ['sanmarcial', 'varden'], av: ['atlantico', 'varden'], ts: ['tierralta', 'sanmarcial'], at: ['atlantico', 'tierralta'] },
  MATCHUP_ORDER: ['sv', 'av', 'ts', 'at'],
  ENEMY_COLOR: '#ff5040', FRIEND_COLOR: '#5ab8ff',
};

// ---- dificultades de la campaña (El Relojero): cambian lo que te hacen y cuánto te ayuda el juego, nunca la historia ----
// taken: daño que recibes · bot: puntería y reflejos enemigos · regen: curación · windArrow: flecha de viento en la mira
// marks: marcas de «Mirar» (always = se ven siempre, key = al pulsar Mirar, none = sin marcas) · sway: pulso en la mira
CONFIG.CAMP_DIFF = {
  lectura: { es: 'Lectura', en: 'Reader', d: { es: 'Para seguir la historia sin atascarte: recibes poco daño, te curas rápido, la mira marca el viento y los detalles se ven siempre.', en: 'To follow the story without getting stuck: little damage taken, fast healing, the scope shows the wind and details are always marked.' }, taken: 0.45, bot: 'easy', regen: 1.6, windArrow: true, marks: 'always', sway: 0.6 },
  recluta: { es: 'Recluta', en: 'Recruit', d: { es: 'La experiencia pensada: combates justos, curación normal y marcas al pulsar Mirar.', en: 'The intended experience: fair fights, normal healing and marks when you hold Look.' }, taken: 0.8, bot: 'normal', regen: 1, windArrow: false, marks: 'key', sway: 1 },
  veterano: { es: 'Veterano', en: 'Veteran', d: { es: 'Los enemigos apuntan mejor y duelen más; te curas despacio. El viento solo lo dicen las banderas.', en: 'Enemies aim better and hit harder; you heal slowly. Only the flags tell you the wind.' }, taken: 1.15, bot: 'hard', regen: 0.6, windArrow: false, marks: 'key', sway: 1.2 },
  relojero: { es: 'Relojero', en: 'Watchmaker', d: { es: 'Sin ayudas: no te curas solo, cada error cuesta y Mirar no marca nada. Hay que calcularlo todo.', en: 'No aids: no natural healing, every mistake costs and Look marks nothing. You must calculate everything.' }, taken: 1.5, bot: 'hard', regen: 0, windArrow: false, marks: 'none', sway: 1.35 },
};
CONFIG.CAMP_DIFF_ORDER = ['lectura', 'recluta', 'veterano', 'relojero'];

// ---- opciones de accesorios por arma (la primera de cada lista es la de fábrica) — todas de época ----
(() => {
  const mk = (o) => ({ optic: ['iron'], muzzle: ['none'], barrel: ['none'], grip: ['none'], mag: ['std'], stock: ['none'], ammo: ['fmj'], ...o });
  const BOLT = { optic: ['iron', 'x2', 'x4'], muzzle: ['none', 'bayo', 'fhider', 'supp'], barrel: ['none', 'long', 'short', 'heavy'], grip: ['none', 'sling', 'bipod'], mag: ['std', 'fast'], stock: ['none', 'skel', 'pad'], ammo: ['fmj', 'ap', 'hp'] };
  const SCOPED = { optic: ['scope'], muzzle: ['none', 'fhider', 'supp', 'brake'], barrel: ['none', 'long', 'heavy'], grip: ['none', 'sling', 'bipod'], mag: ['std', 'fast'], stock: ['none', 'pad'], ammo: ['fmj', 'ap', 'hp'] };
  CONFIG.ATTACH.slots = {
    rifle: mk(BOLT), dmr: mk(BOLT),
    battle: mk({ optic: ['iron', 'x2', 'x4'], muzzle: ['none', 'fhider', 'bayo', 'supp'], barrel: ['none', 'long', 'short'], grip: ['none', 'sling'], mag: ['std', 'ext', 'fast'], stock: ['none', 'pad'], ammo: ['fmj', 'ap', 'hp'] }),
    smg: mk({ muzzle: ['none', 'comp', 'supp'], barrel: ['none', 'long', 'short'], grip: ['none', 'vgrip', 'sling'], mag: ['std', 'ext', 'drum', 'fast'], stock: ['none', 'skel'], ammo: ['fmj', 'hp'] }),
    tsmg: mk({ muzzle: ['none', 'comp', 'supp'], barrel: ['none', 'long', 'short'], grip: ['none', 'sling'], mag: ['std', 'ext', 'fast'], stock: ['none', 'skel'], ammo: ['fmj', 'hp'] }),
    shotgun: mk({ muzzle: ['none', 'choke', 'bayo'], barrel: ['none', 'long', 'short'], grip: ['none', 'sling'], mag: ['std', 'ext', 'fast'], stock: ['none', 'skel', 'pad'], ammo: ['fmj', 'hp'] }),
    dbl: mk({ muzzle: ['none', 'choke'], barrel: ['none', 'long', 'short'], grip: ['none', 'sling'], stock: ['none', 'skel', 'pad'], ammo: ['fmj', 'hp'] }),
    mk2: mk(SCOPED), sniper: mk(SCOPED),
    lmg: mk({ muzzle: ['none', 'fhider', 'brake'], barrel: ['none', 'heavy'], grip: ['none', 'sling'], mag: ['std', 'drum', 'fast'], stock: ['none', 'pad'], ammo: ['fmj', 'ap', 'hp'] }),
    mg2: mk({ optic: ['iron', 'x2'], muzzle: ['none', 'fhider', 'comp'], barrel: ['none', 'heavy'], grip: ['none', 'sling'], mag: ['std', 'ext', 'fast'], stock: ['none', 'pad'], ammo: ['fmj', 'ap', 'hp'] }),
  };
  // nivel al que se desbloquea cada cosa (accesorios y ventajas llevan su propio nivel en su definición)
  CONFIG.UNLOCK = {
    weapon: { rifle: 1, smg: 1, shotgun: 1, mk2: 1, dmr: 4, tsmg: 8, dbl: 13, battle: 18, mg2: 24, sniper: 30, lmg: 36 },
    secondary: { pistol: 1, magnum: 11, hp45: 21 },
    streak: { uav: 1, supply: 9, mortar: 10, jam: 16, air: 23 },
    operator: { infante: 1, granadero: 3, comando: 6, montanero: 9, sanitario: 12, tirador: 15, invierno: 18, guardia: 21, minero: 24, marino: 27, aviador: 30, oficial: 34, grau: 40 },
    helmet: { adrian: 1, none: 1, stahl: 1, cap: 2, brodie: 3, netted: 4, boonie: 6, beret: 8, beanie: 12, pilot: 14, bandana: 16, ushanka: 20, peaked: 25, miner: 30 },
    face: { none: 1, beard: 1, mustache: 2, scar: 3, balaclava: 5, goggles: 7, bandit: 9, shades: 10, paint: 13, shemagh: 15, eyepatch: 17, gas: 24 },
    vest: { webbing: 1, none: 1, light: 2, harness: 3, bandolier: 8, radio: 11, coat: 20 },
    pack: { none: 1, small: 5, bedroll: 7, assault: 10, antenna: 17, large: 21, medic: 28, tube: 35 },
    pads: { none: 1, shin: 4 },
    camo: { woodland: 1, urban: 1, desert: 1, tiger: 3, earth: 4, jungle: 6, arctic: 9, digital: 12, marine: 14, rust: 16, frost: 19, night: 20, dusk: 24, steel: 27, ash: 30, swamp: 33, blood: 36, gold: 50, prestige: 99 },
    wskin: { none: 1, olive: 5, sand: 11, arctic: 17, night: 23, crimson: 31, cobalt: 37, ember: 39, gold: 44, chrome: 46 },
  };
})();

for (const k of Object.keys(CONFIG.WEAPONS)) CONFIG.WEAPONS[k].wc = CONFIG.WCLASS_OF[k] || null;

const DEFAULT_SETTINGS = {
  lang: 'es', quality: 'medium', gore: 'low', goreChosen: false, hudScale: 1, hudAlpha: 1, showCompass: true, dmgNums: true, showHitmarker: true, hitSound: true, showRadar: true,
  master: 0.8, music: 0.4, sfx: 0.85,
  sens: 1.0, adsSens: 0.8, fov: 78, bright: 1.12, cam: 'third', shoulder: 1, invertY: false, showFps: false,
  storyOutfit: 'paciente', name: 'Soldado', custom: { camo: 'woodland', helmet: 'adrian', face: 'none', vest: 'webbing', skin: 1, pack: 'none', pads: 'shin', op: null },
  primary: 'rifle', wskins: {}, streaks: [],
  cls: 'rifleman', loadout: { primary: 'rifle', secondary: 'pistol', att: { optic: 'iron', muzzle: 'none', barrel: 'none', grip: 'none', mag: 'std', stock: 'none', ammo: 'fmj' }, perk: 'ammo' },
  bindings: null,
  lastMode: 'tdm', lastMap: 'pueblo', lastEnv: 'random', charStyle: 'box', lastTeam: 8, lastBots: 5, lastDiff: 'normal', lastFac: 'sv',
};

