// ---- 08_entities.js ----
// =====================================================================
// ENTIDADES — materiales y geometrías compartidas, modelos low-poly
// (soldados y armas, cada parte fusionada en una sola malla), SOLDADO
// (estado de simulación), VISTA del soldado (esqueleto con IK de brazos y
// piernas) y CUERPOS que se quedan en el mapa hasta el fin de la ronda
// =====================================================================
const MAT = {
  cache: new Map(),
  init() { },
  lam(color, opts) {
    const key = 'l' + color + (opts ? JSON.stringify(opts) : '');
    let m = this.cache.get(key);
    if (!m) { m = new THREE.MeshLambertMaterial({ color, flatShading: true, ...(opts || {}) }); m.userData.shared = true; this.cache.set(key, m); }
    return m;
  },
  basic(color, opts) {
    const key = 'b' + color + (opts ? JSON.stringify(opts) : '');
    let m = this.cache.get(key);
    if (!m) { m = new THREE.MeshBasicMaterial({ color, ...(opts || {}) }); m.userData.shared = true; this.cache.set(key, m); }
    return m;
  },
  // material con colores por vértice (armas, utilería)
  vcol() { return this.cache.get('vcol') || (this.cache.set('vcol', Object.assign(new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), { userData: { shared: true } })), this.cache.get('vcol')); },
  // armas: material PBR con un reflejo de entorno generado en código (metal con brillos, no un plástico plano)
  gun() {
    let m = this.cache.get('gun');
    if (!m) { m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 0.42, metalness: 0.6, envMap: gunEnvTexture(), envMapIntensity: 1.25, side: THREE.DoubleSide }); gunSurface(m); m.userData.shared = true; this.cache.set('gun', m); }
    return m;
  },
  // material de soldado: atlas (mitad izquierda camuflaje, mitad derecha blanco) × color por vértice
  soldier(camo) {
    const key = 'sold' + camo;
    let m = this.cache.get(key);
    if (!m) { m = makeSoldierMaterial(camoTexture(camo)); this.cache.set(key, m); }
    return m;
  },
};
// acabado de superficie de las armas (2.11.0): todo se calcula en el shader a partir de la posición local, sin imágenes ni UV.
//  · acero/polímero: grano cepillado a lo largo del cañón, rayones finos y manchas de aceite que varían el brillo
//  · desgaste de cantos: donde la normal cambia bruscamente (biseles) el pintado se gasta y asoma el metal claro
//  · madera (tonos pardos): veta larga con anillos y poros
function gunSurface(m) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGL;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGL = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vGL;
float gh(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float gn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(gh(i), gh(i + vec3(1,0,0)), f.x), mix(gh(i + vec3(0,1,0)), gh(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(gh(i + vec3(0,0,1)), gh(i + vec3(1,0,1)), f.x), mix(gh(i + vec3(0,1,1)), gh(i + vec3(1,1,1)), f.x), f.y), f.z); }
float gEdge = 0.0, gWood = 0.0, gGrain = 0.0;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  vec3 q = vGL;
  float lum = dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11));
  gWood = step(diffuseColor.b + 0.04, diffuseColor.g) * step(diffuseColor.g + 0.02, diffuseColor.r) * smoothstep(0.03, 0.08, diffuseColor.r - diffuseColor.b);
  // grano cepillado (largo en z) y rayones
  float grain = gn(vec3(q.x * 150.0, q.y * 150.0, q.z * 38.0));
  float fine = gn(q * 520.0);
  float scr = smoothstep(0.86, 0.97, gn(vec3(q.x * 40.0, q.y * 40.0, q.z * 700.0))) * 0.5 + smoothstep(0.9, 0.98, gn(vec3(q.x * 700.0, q.y * 30.0, q.z * 60.0))) * 0.35;
  // 3.2.0: de lejos los rayones y el grano fino son más pequeños que un píxel y parpadean; se apagan según el tamaño en pantalla
  float lodk = clamp(1.0 - length(fwidth(q)) * 420.0, 0.0, 1.0);
  scr *= lodk; fine = mix(0.5, fine, lodk); grain = mix(0.5, grain, clamp(1.0 - length(fwidth(q)) * 110.0, 0.0, 1.0));
  float oil = gn(q * 38.0) * 0.6 + gn(q * 110.0) * 0.4;
  gGrain = grain * 0.6 + fine * 0.4;
  // madera: veta a lo largo del arma con anillos suaves
  float ring = sin((q.y * 90.0 + q.x * 60.0 + gn(vec3(q.x * 30.0, q.y * 30.0, q.z * 6.0)) * 6.0) * 1.0) * 0.5 + 0.5;
  float wg = gn(vec3(q.x * 140.0, q.y * 140.0, q.z * 14.0));
  vec3 base = diffuseColor.rgb;
  vec3 metal = base * (0.78 + gGrain * 0.4) * (0.88 + oil * 0.24);
  metal += vec3(0.16) * scr * (0.4 + lum);
  vec3 wood = base * (0.72 + ring * 0.34 + wg * 0.2);
  diffuseColor.rgb = mix(metal, wood, gWood);
}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
roughnessFactor = clamp(roughnessFactor * (0.8 + gGrain * 0.5) , 0.12, 1.0);
roughnessFactor = mix(roughnessFactor, 0.62 + gGrain * 0.25, gWood);`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
metalnessFactor *= 1.0 - gWood * 0.9;
{
  // desgaste de cantos: cambio brusco de la normal entre píxeles vecinos = canto; el pintado se gasta y brilla el metal
  vec3 nd = fwidth(normalize(vNormal));
  float e = smoothstep(0.08, 0.3, length(nd)) * (1.0 - gWood * 0.6);
  float chip = smoothstep(0.5, 0.75, gn(vGL * 190.0) * 0.65 + gn(vGL * 60.0) * 0.35);
  float wear = clamp(e * chip, 0.0, 1.0) * clamp(1.0 - length(fwidth(vGL)) * 420.0, 0.0, 1.0);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.43, 0.45), wear * 0.5);
  metalnessFactor = mix(metalnessFactor, 1.0, wear);
  roughnessFactor = mix(roughnessFactor, 0.3, wear);
}`);
  };
  m.customProgramCacheKey = () => 'gunSurface2';
}
// entorno equirectangular pequeño (cielo cálido, suelo oscuro, un par de cajas de luz): es una textura de CPU,
// así que sirve a cualquier renderer (juego, vista previa, iconos) sin compartir recursos de GPU
let _gunEnv = null;
function gunEnvTexture() {
  if (_gunEnv) return _gunEnv;
  const W = 128, H = 64, d = new Uint8Array(W * H * 4);
  const top = [0.42, 0.52, 0.66], hor = [0.95, 0.82, 0.64], gnd = [0.16, 0.14, 0.11];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = 1 - y / (H - 1), el = (v - 0.5) * Math.PI, az = (x / W) * TAU;
    let c;
    if (el >= 0) { const k = Math.pow(Math.min(1, el / 1.2), 0.7); c = [0, 1, 2].map((i) => hor[i] + (top[i] - hor[i]) * k); }
    else { const k = Math.pow(Math.min(1, -el / 0.8), 0.6); c = [0, 1, 2].map((i) => hor[i] * 0.35 + (gnd[i] - hor[i] * 0.35) * k); }
    // sol y dos cajas de luz laterales para que el metal tenga brillos reconocibles
    const sun = Math.exp(-(Math.pow(Math.atan2(Math.sin(az - 1.1), Math.cos(az - 1.1)), 2) + Math.pow(el - 0.7, 2)) * 9) * 3.2;
    const box = (a0, e0, w, h, k) => Math.max(0, 1 - Math.max(Math.abs(Math.atan2(Math.sin(az - a0), Math.cos(az - a0))) / w, Math.abs(el - e0) / h)) > 0 ? k : 0;
    const add = sun + box(3.6, 0.35, 0.45, 0.28, 1.6) + box(5.4, 0.15, 0.25, 0.4, 0.9);
    const o = (y * W + x) * 4;
    for (let i = 0; i < 3; i++) d[o + i] = Math.round(Math.min(1, (c[i] + add * (i === 2 ? 0.85 : 1)) * 0.8) * 255);
    d[o + 3] = 255;
  }
  const t = new THREE.DataTexture(d, W, H, THREE.RGBAFormat); t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return (_gunEnv = t);
}
// luz de relleno y de contorno solo para los soldados: a contraluz o a la sombra
// el uniforme oscuro se volvía una mancha negra; así siempre se lee la silueta
const SOLDIER_LIGHT = { fill: { value: new THREE.Color(0.42, 0.4, 0.37) }, rim: { value: new THREE.Color(0.75, 0.72, 0.66) } };
function makeSoldierMaterial(map) {
  const m = new THREE.MeshLambertMaterial({ map, vertexColors: true, flatShading: true });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uSoldFill = SOLDIER_LIGHT.fill; sh.uniforms.uSoldRim = SOLDIER_LIGHT.rim;
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSoldFill; uniform vec3 uSoldRim;')
      .replace('#include <envmap_fragment>', `#include <envmap_fragment>
      { vec3 vdir = normalize(vViewPosition); float fr = 1.0 - clamp(abs(dot(normal, vdir)), 0.0, 1.0);
        float up = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);
        outgoingLight += diffuseColor.rgb * (uSoldFill * (0.75 + 0.35 * up) + uSoldRim * pow(fr, 2.2)); }`);
  };
  m.customProgramCacheKey = () => 'cowsoldier1';
  m.userData.shared = true;
  return m;
}

const GEO = {
  cache: new Map(),
  get(key, make) { let g = this.cache.get(key); if (!g) { g = make(); g.userData.shared = true; this.cache.set(key, g); } return g; },
  box(w, h, d) { return this.get(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)); },
  sphere(r, ws = 10, hs = 7) { return this.get(`s${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs)); },
  dome(r, ws = 8, hs = 4) { return this.get(`d${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs, 0, TAU, 0, Math.PI / 2)); },
  cyl(rt, rb, h, seg = 8) { return this.get(`c${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)); },
  cone(r, h, seg = 8) { return this.get(`k${r},${h},${seg}`, () => new THREE.ConeGeometry(r, h, seg)); },
  // caja con aristas biseladas: refleja la luz en los bordes como una pieza mecanizada
  rbox(w, h, d, r = 0.004) {
    return this.get(`r${w},${h},${d},${r}`, () => {
      r = Math.min(r, w * 0.49, h * 0.49, d * 0.49);
      const g = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3).toNonIndexed(), P = g.attributes.position, N = g.attributes.normal, v = new THREE.Vector3(), hs = 0.5 / 3;
      const ax = w / 2 - r, ay = h / 2 - r, az = d / 2 - r;
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        v.set(x - Math.sign(x) * hs, y - Math.sign(y) * hs, z - Math.sign(z) * hs).normalize();
        P.setXYZ(i, ax * Math.sign(x) + v.x * r, ay * Math.sign(y) + v.y * r, az * Math.sign(z) + v.z * r); N.setXYZ(i, v.x, v.y, v.z);
      }
      return g;
    });
  },
  // tubo sin tapas: solo se ve desde fuera (por dentro queda abierto para mirar a través)
  otube(rt, rb, h, seg = 14) { return this.get(`o${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, true)); },
  torus(r, t, seg = 12, rs = 5) { return this.get(`t${r},${t},${seg},${rs}`, () => new THREE.TorusGeometry(r, t, rs, seg)); },
  plane(w, h) { return this.get(`p${w},${h}`, () => new THREE.PlaneGeometry(w, h)); },
};
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}
function shade(hex, k) { _c1.set(hex); if (k > 0) _c1.lerp(_c2.set(0xffffff), k); else _c1.lerp(_c2.set(0x0a0a08), -k); return _c1.getHex(); }

// ---------- camuflajes procedurales ----------
// telas de uniforme de época (3.1.0): mismos identificadores que antes (el progreso guardado no cambia), colores y dibujos de 1939–1945.
// style: 'splinter' (astillas angulosas con lluvia), 'dots' (moteado de guisante), 'plain' (paño liso con poco dibujo)
const CAMOS = {
  woodland: { es: 'Caqui sanmarcialense', en: 'Sanmarcial khaki', base: '#6e6a48', c: ['#625e3e', '#7a7652', '#57543a'], gear: 0x5a5236, style: 'plain' },
  urban: { es: 'Gris campaña vardenés', en: 'Vardenese field grey', base: '#5d6258', c: ['#53584f', '#686d62', '#4a4e46'], gear: 0x4a4a3c, style: 'plain' },
  desert: { es: 'Caqui de desierto', en: 'Desert khaki', base: '#b6a27a', c: ['#a8946c', '#c4b088', '#9a8660'], gear: 0x8a7650, style: 'plain' },
  tiger: { es: 'Verde oliva atlántico', en: 'Atlantic olive drab', base: '#5a5a3c', c: ['#4e4e34', '#666644', '#45452e'], gear: 0x4e4a32, style: 'plain' },
  earth: { es: 'Pardo de montaña', en: 'Mountain brown', base: '#6e5a40', c: ['#5e4c36', '#7e6a4c', '#4e3e2c'], gear: 0x5a4630, style: 'plain' },
  jungle: { es: 'Piel de rana', en: 'Frog skin', base: '#6a7448', c: ['#4a5634', '#8a8a5a', '#3a3a28'], gear: 0x4e5636 },
  arctic: { es: 'Funda de nieve', en: 'Snow smock', base: '#dcdcd4', c: ['#cfcfc6', '#e8e8e0', '#bdbdb4'], gear: 0x8a8a80, style: 'plain' },
  digital: { es: 'Astillas', en: 'Splinter', base: '#7a7a5c', c: ['#5a6040', '#8a6a44', '#3e4a30'], gear: 0x55553e, style: 'splinter' },
  marine: { es: 'Azul marino', en: 'Navy blue', base: '#2e3546', c: ['#283040', '#36405a', '#222838'], gear: 0x2a2e38, style: 'plain' },
  rust: { es: 'Moteado de guisante', en: 'Pea dot', base: '#6e6a44', c: ['#4a5232', '#8a6a3e', '#3a3a26'], gear: 0x55503a, style: 'dots' },
  frost: { es: 'Nieve moteada', en: 'Mottled snow', base: '#d6d8d2', c: ['#9aa08e', '#c2c6b8', '#7e8676'], gear: 0x7e8676 },
  night: { es: 'Azul de prisiones', en: 'Prison-guard blue', base: '#2c3240', c: ['#262b38', '#343b4a', '#20242e'], gear: 0x22252c, style: 'plain' },
  dusk: { es: 'Caqui claro', en: 'Light khaki', base: '#9a8a62', c: ['#8c7c56', '#a8986e', '#7c6e4c'], gear: 0x7a6a48, style: 'plain' },
  steel: { es: 'Gris acero', en: 'Steel grey', base: '#5a6066', c: ['#4c5258', '#686e74', '#40454a'], gear: 0x3e4248, style: 'plain' },
  ash: { es: 'Negro de carro', en: 'Tank-crew black', base: '#26272a', c: ['#2e3033', '#1e1f21', '#36383b'], gear: 0x24252a, style: 'plain' },
  swamp: { es: 'Cuero gris', en: 'Grey leather', base: '#4a4c4e', c: ['#424446', '#56585a', '#3a3c3e'], gear: 0x2e3032, style: 'plain' },
  blood: { es: 'Granate de gala', en: 'Dress maroon', base: '#5a2424', c: ['#4e1e1e', '#6a2c2c', '#421818'], gear: 0x2a1c1a, style: 'plain' },
  gold: { es: 'Gala de mariscal', en: "Marshal's dress", base: '#2a2c34', c: ['#22242a', '#c9a23a', '#1a1c22'], gear: 0xb8902c, style: 'braid' },
  prestige: { es: 'Prestigio', en: 'Prestige', base: '#1c1b18', c: ['#2a2924', '#c9a23a', '#0c0b09'], gear: 0x2e2d28, style: 'braid' },
};
// tocados, rostros, correajes, mochilas y polainas: solo prendas de época (los ids viejos que ya no existen vuelven al de fábrica)
const HELMETS = {
  adrian: { es: 'Casco de cresta sanmarcialense', en: 'Sanmarcial crested helmet' }, stahl: { es: 'Casco de acero vardenés', en: 'Vardenese steel helmet' }, brodie: { es: 'Casco de plato atlántico', en: 'Atlantic dish helmet' },
  netted: { es: 'Casco con red', en: 'Netted helmet' }, cap: { es: 'Gorra de campaña', en: 'Field cap' }, peaked: { es: 'Gorra de plato', en: 'Peaked cap' },
  boonie: { es: 'Sombrero de ala', en: 'Slouch hat' }, beret: { es: 'Boina', en: 'Beret' }, none: { es: 'Descubierto', en: 'Bare head' },
  beanie: { es: 'Gorro de lana', en: 'Wool cap' }, bandana: { es: 'Pañuelo', en: 'Headscarf' }, ushanka: { es: 'Gorro de piel', en: 'Fur cap' },
  pilot: { es: 'Gorro de aviador', en: 'Flying helmet' }, miner: { es: 'Casco de minero', en: "Miner's helmet" },
};
const FACES = {
  none: { es: 'Descubierto', en: 'Bare' }, beard: { es: 'Barba', en: 'Beard' }, mustache: { es: 'Bigote', en: 'Moustache' }, scar: { es: 'Cicatriz', en: 'Scar' },
  balaclava: { es: 'Pasamontañas de lana', en: 'Wool balaclava' }, goggles: { es: 'Gafas de motorista', en: 'Dispatch goggles' }, shades: { es: 'Gafas redondas', en: 'Round spectacles' },
  paint: { es: 'Tizne de corcho', en: 'Burnt cork' }, shemagh: { es: 'Bufanda', en: 'Muffler' }, bandit: { es: 'Pañuelo al cuello', en: 'Neckerchief' },
  eyepatch: { es: 'Parche', en: 'Eyepatch' }, gas: { es: 'Máscara antigás', en: 'Gas mask' },
};
const VESTS = {
  webbing: { es: 'Correaje con cartucheras', en: 'Belt and ammo pouches' }, none: { es: 'Guerrera sola', en: 'Tunic only' }, light: { es: 'Chaquetón', en: 'Field jacket' },
  harness: { es: 'Tirantes de cuero', en: 'Leather braces' }, bandolier: { es: 'Bandolera de cartuchos', en: 'Cartridge bandolier' }, radio: { es: 'Radio de válvulas', en: 'Valve radio' },
  coat: { es: 'Abrigo de cuero largo', en: 'Long leather coat' },
};
const PACKS = {
  none: { es: 'Sin mochila', en: 'No pack' }, small: { es: 'Morral', en: 'Haversack' }, assault: { es: 'Mochila de campaña', en: 'Field pack' },
  large: { es: 'Mochila de montaña', en: 'Mountain rucksack' }, medic: { es: 'Bolsa de sanitario', en: "Medic's bag" }, tube: { es: 'Tubo antitanque', en: 'Anti-tank tube' },
  bedroll: { es: 'Mochila con manta', en: 'Pack with blanket roll' }, antenna: { es: 'Radio de campaña', en: 'Field radio' },
};
const PADS = {
  none: { es: 'Sin polainas', en: 'No leggings' }, shin: { es: 'Polainas', en: 'Puttees' },
};
// uniformes de facción y oficios (antes «operadores»): conjuntos de época con silueta propia (solo estética; el hitbox es el mismo)
const OPERATORS = {
  infante: { es: 'Infante sanmarcialense', en: 'Sanmarcial infantryman', d: { es: 'Casco de cresta, correaje y polainas.', en: 'Crested helmet, webbing and puttees.' }, set: { camo: 'woodland', helmet: 'adrian', face: 'none', vest: 'webbing', pack: 'small', pads: 'shin' }, extra: null },
  granadero: { es: 'Granadero vardenés', en: 'Vardenese grenadier', d: { es: 'Casco de acero, gris campaña y mochila de asalto.', en: 'Steel helmet, field grey and an assault pack.' }, set: { camo: 'urban', helmet: 'stahl', face: 'none', vest: 'webbing', pack: 'assault', pads: 'shin' }, extra: null },
  comando: { es: 'Comando atlántico', en: 'Atlantic commando', d: { es: 'Gorro de lana, cara tiznada y bandolera.', en: 'Wool cap, blackened face and a bandolier.' }, set: { camo: 'tiger', helmet: 'beanie', face: 'paint', vest: 'bandolier', pack: 'assault', pads: 'none' }, extra: null },
  montanero: { es: 'Montañero de Tierra Alta', en: 'Tierra Alta mountaineer', d: { es: 'Poncho, gorro de piel y mochila de montaña.', en: 'Poncho, fur cap and a mountain rucksack.' }, set: { camo: 'earth', helmet: 'ushanka', face: 'beard', vest: 'bandolier', pack: 'large', pads: 'shin' }, extra: 'poncho' },
  sanitario: { es: 'Sanitario', en: 'Medic', d: { es: 'Brazalete y bolsa con la cruz roja.', en: 'Red-cross armband and bag.' }, set: { camo: 'woodland', helmet: 'adrian', face: 'none', vest: 'harness', pack: 'medic', pads: 'shin' }, extra: 'cross' },
  tirador: { es: 'Tirador con traje de hojas', en: 'Leaf-suit marksman', d: { es: 'Arpillera y ramas sobre el uniforme.', en: 'Burlap and branches over the uniform.' }, set: { camo: 'jungle', helmet: 'boonie', face: 'paint', vest: 'harness', pack: 'small', pads: 'none' }, extra: 'ghillie' },
  invierno: { es: 'Cazador de invierno', en: 'Winter ranger', d: { es: 'Funda de nieve, pasamontañas y manta enrollada.', en: 'Snow smock, balaclava and a blanket roll.' }, set: { camo: 'arctic', helmet: 'stahl', face: 'balaclava', vest: 'webbing', pack: 'bedroll', pads: 'none' }, extra: 'fur' },
  guardia: { es: 'Guardia del Cuerpo de Prisiones', en: 'Prison Corps guard', d: { es: 'Gorra de plato, capote azul y bigote.', en: 'Peaked cap, blue greatcoat and a moustache.' }, set: { camo: 'night', helmet: 'peaked', face: 'mustache', vest: 'harness', pack: 'none', pads: 'none' }, extra: 'cape' },
  minero: { es: 'Minero', en: 'Miner', d: { es: 'Casco con lámpara, pañuelo y barba de turno.', en: 'Lamp helmet, neckerchief and a shift beard.' }, set: { camo: 'earth', helmet: 'miner', face: 'bandit', vest: 'none', pack: 'small', pads: 'none' }, extra: 'scarf' },
  marino: { es: 'Guardia del puerto', en: 'Harbour guard', d: { es: 'Azul marino, boina y tirantes de cuero.', en: 'Navy blue, beret and leather braces.' }, set: { camo: 'marine', helmet: 'beret', face: 'none', vest: 'harness', pack: 'none', pads: 'none' }, extra: null },
  aviador: { es: 'Aviador', en: 'Airman', d: { es: 'Gorro de cuero, gafas y bufanda blanca.', en: 'Leather helmet, goggles and a white scarf.' }, set: { camo: 'ash', helmet: 'pilot', face: 'goggles', vest: 'light', pack: 'none', pads: 'none' }, extra: 'aviator' },
  oficial: { es: 'Oficial sanmarcialense', en: 'Sanmarcial officer', d: { es: 'Gorra de plato, tirantes y capote de oficial.', en: 'Peaked cap, braces and an officer\'s cape.' }, set: { camo: 'dusk', helmet: 'peaked', face: 'mustache', vest: 'harness', pack: 'none', pads: 'shin' }, extra: 'cape' },
  grau: { es: 'Agente de la Dienststelle Grau', en: 'Dienststelle Grau agent', d: { es: 'Abrigo de cuero gris hasta las rodillas y gorra de plato.', en: 'Knee-length grey leather coat and a peaked cap.' }, set: { camo: 'swamp', helmet: 'peaked', face: 'none', vest: 'coat', pack: 'none', pads: 'none' }, extra: null },
};
const SKINS = [0xe8bf98, 0xcf9a6e, 0xae7650, 0x82573a, 0x5c3c28];
const HAIR = [0x2a2018, 0x4a3420, 0x1a1512, 0x6b4a2a, 0x151210];

const _camoTex = {};
function camoTexture(id) {
  if (_camoTex[id]) return _camoTex[id];
  const C = CAMOS[id] || OUTFITS[id] || CAMOS.woodland;
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
  const x = cv.getContext('2d');
  if (C.fabric) drawFabric(x, C, new RNG(hash32('tela', id)));
  else {
  x.fillStyle = C.base; x.fillRect(0, 0, 128, 128);
  const rng = new RNG(hash32('camo', id));
  for (let li = 0; li < C.c.length; li++) {
    x.fillStyle = C.c[li];
    for (let i = 0; i < 16; i++) {
      const cx = rng.range(0, 128), cy = rng.range(0, 128), r = rng.range(7, 17) * (li === 2 ? 0.7 : 1), n = 7;
      for (const [ox, oy] of [[0, 0], [128, 0], [-128, 0], [0, 128], [0, -128]]) {
        if (C.style === 'plain') { if (i > 3) continue; x.globalAlpha = 0.35; x.fillRect(cx + ox - r, cy + oy - r * 0.3, r * 2, r * 0.6); x.globalAlpha = 1; continue; }
        if (C.style === 'braid') { if (li !== 1 || i > 2) continue; x.fillRect(0, 60 + i * 6 + oy * 0, 128, 2); continue; }
        if (C.style === 'dots') { for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(cx + ox + rng.range(-r, r), cy + oy + rng.range(-r, r), rng.range(1.2, 2.6), 0, TAU); x.fill(); } continue; }
        if (C.style === 'splinter') { x.beginPath(); x.moveTo(cx + ox, cy + oy); x.lineTo(cx + ox + r * 1.8, cy + oy - r * 0.5); x.lineTo(cx + ox + r * 0.9, cy + oy + r * 0.9); x.lineTo(cx + ox - r * 0.6, cy + oy + r * 0.4); x.closePath(); x.fill(); continue; }
        x.beginPath();
        for (let k = 0; k < n; k++) { const a = (k / n) * TAU + rng.range(-0.25, 0.25), rr = r * rng.range(0.55, 1.25); const px = cx + ox + Math.cos(a) * rr * 1.25, py = cy + oy + Math.sin(a) * rr; k ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.closePath(); x.fill();
      }
    }
  }
  }
  // astillas: la «lluvia» de rayas finas verticales del patrón original
  if (C.style === 'splinter') { x.fillStyle = 'rgba(40,46,30,0.55)'; for (let i = 0; i < 70; i++) { const px = (i * 37) % 128, py = (i * 53) % 128; x.fillRect(px, py, 1, 6); } }
  // paño: hilo fino para que la tela lisa no parezca plástico
  if (C.style === 'plain' || C.style === 'braid') { const rr = new RNG(hash32('pano', id)); x.globalAlpha = 0.08; for (let i = 0; i < 260; i++) { x.fillStyle = rr.next() < 0.5 ? '#000' : '#fff'; x.fillRect(rr.range(0, 128), rr.range(0, 128), 1, rr.range(1, 3)); } x.globalAlpha = 1; }
  x.fillStyle = '#ffffff'; x.fillRect(128, 0, 128, 128);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 2; t.userData.shared = true;
  _camoTex[id] = t;
  return t;
}

// ---------- fusión de partes en una sola geometría (menos llamadas de dibujo) ----------
const _nonIdx = new WeakMap();
function nonIndexed(g) { let n = _nonIdx.get(g); if (!n) { n = g.index ? g.toNonIndexed() : g; _nonIdx.set(g, n); } return n; }
const _pbBox = new THREE.Box3();
const _pbV = new THREE.Vector3(), _pbQ = new THREE.Quaternion(), _pbE = new THREE.Euler(), _pbS = new THREE.Vector3(), _pbN = new THREE.Matrix3();
function clearSightLine(B, sy) {
  const lim = sy - 0.004, bx = new THREE.Box3(), v = new THREE.Vector3();
  for (const it of B.items) {
    if (it.tag === 'sight') continue;   // la mira misma no se toca
    const g = it.geo; if (!g.boundingBox) g.computeBoundingBox();
    bx.copy(g.boundingBox).applyMatrix4(it.m);
    if (bx.max.y <= lim || bx.min.x > 0.011 || bx.max.x < -0.011) continue;
    const w = bx.max.x - bx.min.x, d = bx.max.z - bx.min.z;
    if (w <= 0.009 && d <= 0.022) continue;                      // cuchilla de mira: se queda
    if (d < 0.12 && bx.max.y - bx.min.y < 0.06) { it.m.premultiply(new THREE.Matrix4().makeTranslation(0, lim - bx.max.y, 0)); continue; }
    // pieza larga: se recorta su parte superior a la altura límite
    const ng = g.clone().applyMatrix4(it.m), pos = ng.attributes.position;
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); if (v.y > lim && Math.abs(v.x) < 0.03) pos.setY(i, lim); }
    pos.needsUpdate = true; ng.computeVertexNormals(); ng.computeBoundingBox();
    it.geo = ng; it.m = new THREE.Matrix4(); it._sp = null; it._wi = null;
  }
}
class PartBatch {
  constructor() { this.items = []; this.tag = null; }
  add(geo, x, y, z, color, o = {}) {
    const m = new THREE.Matrix4().compose(_pbV.set(x, y, z), _pbQ.setFromEuler(_pbE.set(o.rx || 0, o.ry || 0, o.rz || 0, o.order || 'XYZ')), _pbS.set(o.sx || 1, o.sy || 1, o.sz || 1));
    this.items.push({ geo, m, color, tag: this.tag, camo: !!o.camo, body: !!o.body, ou: o.ou ?? frand(0, 1), ov: o.ov ?? frand(0, 1) });
    return this;
  }
  // altura real de la parte más alta del arma sobre la línea central en torno a z (para apoyar riel y mira sin huecos)
  topAt(z, hw = 0.03) {
    let top = -Infinity;
    for (const it of this.items) {
      const g = it.geo; if (!g.boundingBox) g.computeBoundingBox();
      _pbBox.copy(g.boundingBox).applyMatrix4(it.m);
      if (_pbBox.min.x > 0.012 || _pbBox.max.x < -0.012 || _pbBox.max.z < z - hw || _pbBox.min.z > z + hw) continue;
      if (_pbBox.max.y > top) top = _pbBox.max.y;
    }
    return top;
  }
  bottomAt(z, hw = 0.03) {
    let bot = Infinity;
    for (const it of this.items) {
      const g = it.geo; if (!g.boundingBox) g.computeBoundingBox();
      _pbBox.copy(g.boundingBox).applyMatrix4(it.m);
      if (_pbBox.min.x > 0.012 || _pbBox.max.x < -0.012 || _pbBox.max.z < z - hw || _pbBox.min.z > z + hw) continue;
      if (_pbBox.min.y < bot) bot = _pbBox.min.y;
    }
    return bot;
  }
  // soldadura (2.11.2): si alguna pieza (culata, guardamano, empuñadura, tramo de cargador, tubo...) queda sin tocar el cuerpo del arma, añade un bloque
  // de unión del color de la pieza suelta entre sus superficies más cercanas. La conexión se mide con la superficie real de cada malla (puntos
  // muestreados en vóxeles de 3,5 mm), no con cajas envolventes: un tubo o una pieza redondeada ya no cuenta como "tocando" solo por su caja.
  surfacePts(it) {
    if (it._sp) return it._sp;
    const g = it.geo, pos = g.attributes.position, idx = g.index, out = [], SP = 0.002;
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
    const n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i += 3) {
      const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
      a.fromBufferAttribute(pos, i0).applyMatrix4(it.m); b.fromBufferAttribute(pos, i1).applyMatrix4(it.m); c.fromBufferAttribute(pos, i2).applyMatrix4(it.m);
      const L = Math.max(a.distanceTo(b), b.distanceTo(c), c.distanceTo(a)), N = Math.min(40, Math.max(1, Math.ceil(L / 0.003)));
      for (let u = 0; u <= N; u++) for (let v = 0; v <= N - u; v++) { const s = u / N, t = v / N; out.push(a.x + (b.x - a.x) * s + (c.x - a.x) * t, a.y + (b.y - a.y) * s + (c.y - a.y) * t, a.z + (b.z - a.z) * s + (c.z - a.z) * t); }
      // aristas más finas (cada 2 mm): son lo que suele cruzar a otra pieza
      for (const [p, q] of [[a, b], [b, c], [c, a]]) { const M = Math.min(80, Math.ceil(p.distanceTo(q) / SP)); for (let u = 1; u < M; u++) { const t = u / M; out.push(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t, p.z + (q.z - p.z) * t); } }
    }
    return (it._sp = Float32Array.from(out));
  }
  weld() {
    // dos piezas cuentan como unidas si alguna pareja de puntos de sus superficies queda a menos de 2,2 mm
    const TOL = 0.0022, CELL = 0.005, TOL2 = TOL * TOL, K = (x, y, z) => ((x + 600) * 1300 + (y + 600)) * 1300 + (z + 600);
    const P0 = new THREE.Vector3(), Q0 = new THREE.Quaternion(), S0 = new THREE.Vector3(), cl = new THREE.Vector3(), tmp = new THREE.Vector3();
    // por pieza: caja envolvente de sus puntos y rejilla de celdas (se crean solo si hace falta comparar con otra pieza cercana)
    const info = (it) => {
      if (it._wi) return it._wi;
      const P = this.surfacePts(it); let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
      for (let k = 0; k < P.length; k += 3) { if (P[k] < x0) x0 = P[k]; if (P[k] > x1) x1 = P[k]; if (P[k + 1] < y0) y0 = P[k + 1]; if (P[k + 1] > y1) y1 = P[k + 1]; if (P[k + 2] < z0) z0 = P[k + 2]; if (P[k + 2] > z1) z1 = P[k + 2]; }
      return (it._wi = { P, b: [x0 - TOL, y0 - TOL, z0 - TOL, x1 + TOL, y1 + TOL, z1 + TOL], grid: null });
    };
    const gridOf = (w) => { if (w.grid) return w.grid; const g = new Map(), P = w.P; for (let k = 0; k < P.length; k += 3) { const key = K(Math.floor(P[k] / CELL), Math.floor(P[k + 1] / CELL), Math.floor(P[k + 2] / CELL)); let l = g.get(key); if (!l) g.set(key, l = []); l.push(P[k], P[k + 1], P[k + 2]); } return (w.grid = g); };
    // ¿alguna pareja de puntos de las superficies de A y B queda a menos de TOL?
    const touching = (A, B) => {
      const a = A.b, b = B.b; if (a[0] > b[3] || b[0] > a[3] || a[1] > b[4] || b[1] > a[4] || a[2] > b[5] || b[2] > a[5]) return false;
      const lo = [Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2])], hi = [Math.min(a[3], b[3]), Math.min(a[4], b[4]), Math.min(a[5], b[5])];
      const G = gridOf(B), P = A.P;
      for (let k = 0; k < P.length; k += 3) {
        const x = P[k], y = P[k + 1], z = P[k + 2]; if (x < lo[0] || x > hi[0] || y < lo[1] || y > hi[1] || z < lo[2] || z > hi[2]) continue;
        const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), cz = Math.floor(z / CELL);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
          const m = G.get(K(cx + dx, cy + dy, cz + dz)); if (!m) continue;
          for (let q = 0; q < m.length; q += 3) { const ex = x - m[q], ey = y - m[q + 1], ez = z - m[q + 2]; if (ex * ex + ey * ey + ez * ez < TOL2) return true; }
        }
      }
      return false;
    };
    // componentes conexos con unión-búsqueda persistente
    const par = [], f = (i) => (par[i] === i ? i : (par[i] = f(par[i])));
    const addItem = (i) => { par[i] = i; const A = info(this.items[i]); for (let j = 0; j < i; j++) { if (f(i) === f(j)) continue; if (touching(A, info(this.items[j]))) par[f(i)] = f(j); } };
    for (let i = 0; i < this.items.length; i++) addItem(i);
    for (let guard = 0; guard < 60; guard++) {
      const its = this.items, n = its.length;
      const cnt = new Map(); for (let i = 0; i < n; i++) cnt.set(f(i), (cnt.get(f(i)) || 0) + 1);
      if (cnt.size < 2) return;
      let main = -1, best = -1; for (const [k, c] of cnt) if (c > best) { best = c; main = k; }
      let pick = -1, pc = Infinity; for (const [k, c] of cnt) if (k !== main && c < pc) { pc = c; pick = k; }
      // par de puntos más cercano entre la pieza suelta (cada una de sus partes) y el resto; se une la parte más grande entre las más próximas
      const sub = (P, cap) => { const st = Math.max(1, Math.floor(P.length / 3 / cap)) * 3, o = []; for (let k = 0; k < P.length; k += st) o.push(P[k], P[k + 1], P[k + 2]); return o; };
      const others = []; for (let j = 0; j < n; j++) if (f(j) !== pick) { const q = sub(this.surfacePts(its[j]), 140); for (let k = 0; k < q.length; k += 3) others.push(q[k], q[k + 1], q[k + 2], j); }
      const cand = [];
      for (let i = 0; i < n; i++) {
        if (f(i) !== pick) continue; const si = sub(this.surfacePts(its[i]), 140); let c = null;
        for (let k = 0; k < si.length; k += 3) for (let m = 0; m < others.length; m += 4) { const dx = si[k] - others[m], dy = si[k + 1] - others[m + 1], dz = si[k + 2] - others[m + 2], d = dx * dx + dy * dy + dz * dz; if (!c || d < c.d) c = { d, i, j: others[m + 3], p: new THREE.Vector3(si[k], si[k + 1], si[k + 2]), q: new THREE.Vector3(others[m], others[m + 1], others[m + 2]) }; }
        if (c) cand.push(c);
      }
      const dmin = Math.min(...cand.map((c) => c.d)), lim = Math.pow(Math.sqrt(dmin) + 0.05, 2);
      const sz3 = (it) => { const g = it.geo; if (!g.boundingBox) g.computeBoundingBox(); const bs = g.boundingBox.getSize(cl); return bs.x * bs.y * bs.z * it.m.getMaxScaleOnAxis() ** 3; };
      let best2 = null, bv = -1;
      for (const c of cand) { if (c.d > lim) continue; const v = sz3(its[c.i]); if (v > bv) { bv = v; best2 = c; } }
      const { i: bi, j: bj, p: bp, q: bq } = best2, A = its[bi];
      A.m.decompose(P0, Q0, S0);
      const inv = Q0.clone().invert(), dl = tmp.copy(bq).sub(bp).applyQuaternion(inv), mid = bp.clone().add(bq).multiplyScalar(0.5);
      if (!A.geo.boundingBox) A.geo.computeBoundingBox();
      const bb = A.geo.boundingBox.getSize(new THREE.Vector3()), full = [bb.x * S0.x, bb.y * S0.y, bb.z * S0.z], dd = [dl.x, dl.y, dl.z];
      const dom = Math.abs(dd[0]) >= Math.abs(dd[1]) && Math.abs(dd[0]) >= Math.abs(dd[2]) ? 0 : Math.abs(dd[1]) >= Math.abs(dd[2]) ? 1 : 2;
      const sz = [0, 0, 0]; for (let k = 0; k < 3; k++) sz[k] = k === dom ? Math.abs(dd[k]) + 0.012 : Math.max(0.012, Math.min(full[k], 0.06) * 0.9, Math.abs(dd[k]) + 0.012);
      const e = new THREE.Euler().setFromQuaternion(Q0, 'XYZ'), tag = this.tag; this.tag = A.tag;
      this.add(GEO.rbox(sz[0], sz[1], sz[2], Math.min(sz[0], sz[1], sz[2]) * 0.3), mid.x, mid.y, mid.z, A.color, { rx: e.x, ry: e.y, rz: e.z });
      this.tag = tag; addItem(this.items.length - 1);
    }
  }
  hasTag(t) { return this.items.some((it) => it.tag === t); }
  // mag=true: solo las piezas del cargador (malla aparte para animar la recarga); mag=false: el resto
  // 3.2.2: mag puede ser también el nombre de otra pieza móvil ('bolt' = cerrojo o palanca de montar, 'barrels' = cañones basculantes)
  build(mag = false) {
    const mov = (t) => t === 'mag' || t === 'bolt' || t === 'barrels', sel = mag === true ? 'mag' : mag;
    const items = this.items.filter((it) => (sel ? it.tag === sel : !mov(it.tag)) && !(this.skipBody && it.body));
    let n = 0; for (const it of items) n += nonIndexed(it.geo).attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), col = new Float32Array(n * 3);
    let o = 0;
    for (const it of items) {
      const g = nonIndexed(it.geo), P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
      _pbN.getNormalMatrix(it.m); _c1.set(it.camo ? 0xffffff : it.color);
      for (let i = 0; i < P.count; i++, o++) {
        _pbV.fromBufferAttribute(P, i).applyMatrix4(it.m); pos[o * 3] = _pbV.x; pos[o * 3 + 1] = _pbV.y; pos[o * 3 + 2] = _pbV.z;
        _pbV.fromBufferAttribute(N, i).applyMatrix3(_pbN).normalize(); nor[o * 3] = _pbV.x; nor[o * 3 + 1] = _pbV.y; nor[o * 3 + 2] = _pbV.z;
        if (it.camo && U) { uv[o * 2] = 0.02 + U.getX(i) * 0.3 + it.ou * 0.15; uv[o * 2 + 1] = 0.02 + U.getY(i) * 0.6 + it.ov * 0.35; }
        else { uv[o * 2] = 0.75; uv[o * 2 + 1] = 0.5; }
        col[o * 3] = _c1.r; col[o * 3 + 1] = _c1.g; col[o * 3 + 2] = _c1.b;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    return geo;
  }
}

// ---------- modelos de armas (cañón hacia -Z, mano derecha en el origen) ----------
const GUN0 = { metal: 0x3f4347, dark: 0x27292c, poly: 0x2c2622, tan: 0x8f7f5f, olive: 0x4e5638, wood: 0x5e3b22, steel: 0x9fa4a7 };
// acabados de arma (cosmético): sustituyen los colores del metal, el polímero y la madera
const WSKINS = {
  none: { es: 'Pavonado y nogal', en: 'Blued steel and walnut', sw: null },
  olive: { es: 'Pintado oliva', en: 'Olive paint', sw: { metal: 0x4c5638, poly: 0x3c4630, tan: 0x5e6845, wood: 0x4a4a2c } },
  sand: { es: 'Pintado de desierto', en: 'Desert paint', sw: { metal: 0x9a8a62, poly: 0x7e704e, tan: 0xb4a272, wood: 0x8a7650 } },
  arctic: { es: 'Invierno a brocha', en: 'Brushed winter white', sw: { metal: 0xbfc2bc, poly: 0x9aa098, tan: 0xd4d6cf, wood: 0xb2b4ac } },
  night: { es: 'Pavonado negro', en: 'Black blued', sw: { metal: 0x1d1f22, poly: 0x15171a, tan: 0x2a2c30, wood: 0x2a2018 } },
  crimson: { es: 'Nogal rojizo', en: 'Red walnut', sw: { metal: 0x3a3436, poly: 0x2a1a16, tan: 0x6a2a20, wood: 0x6a2a1c } },
  cobalt: { es: 'Pavonado azul', en: 'Blue blued', sw: { metal: 0x26324a, poly: 0x1a2236, tan: 0x34446a, wood: 0x4a3020 } },
  ember: { es: 'Latón y cerezo', en: 'Brass and cherry', sw: { metal: 0xa07a3a, poly: 0x3a2418, tan: 0xc0904a, wood: 0x7a3a22 } },
  gold: { es: 'Grabado de maestría', en: 'Master engraving', sw: { metal: 0xc9a23a, poly: 0x8a6a2a, tan: 0xe0bc5a, wood: 0x5a3018 } },
  chrome: { es: 'Niquelado', en: 'Nickel-plated', sw: { metal: 0xc8ccce, poly: 0x9aa0a4, tan: 0xdfe2e3, wood: 0x6a4228 } },
};
function gunPalette(skin) { const k = skin && WSKINS[skin] && WSKINS[skin].sw; return k ? { ...GUN0, ...k } : GUN0; }
const _wmCache = {};
// vm = variante de primera persona (miras huecas que dejan ver el centro); att = accesorios
function weaponGeometry(id, vm = false, att = null) {
  att = CONFIG.ATTACH.slots[id] ? sanitizeAtt(id, att) : {};
  const ck = id + (vm ? ':vm' : '') + ':' + attKey(att);
  if (_wmCache[ck]) return _wmCache[ck];
  const GUN = gunPalette(att.skin);
  const B = new PartBatch(), b = (w, h, d) => GEO.box(w, h, d), cyl = (r, l, s = 6) => GEO.cyl(r, r, l, s), X = Math.PI / 2;
  const u = { muzzle: new THREE.Vector3(0, 0.06, -0.8), fore: null, sightY: 0.12, mag: new THREE.Vector3(0, -0.08, -0.1), adsDist: 0.22, laser: null, glow: [], att };
  const glow = (x, y, z, w, h, d, color, rz = 0) => u.glow.push({ x, y, z, w, h, d, color, rz });
  // ---- miras telescópicas de época (3.1.0): tubo de acero sobre monturas de anilla, sin rieles; retícula de tres postes negros ----
  const ptube = (yb, z, len, objR) => {
    const yc = yb + 0.04;
    for (const dz of [-len * 0.28, len * 0.28]) B.add(GEO.rbox(0.02, yc - yb, 0.018, 0.004), 0, (yc + yb) / 2 - 0.004, z + dz, GUN.metal).add(GEO.torus(0.0185, 0.0035, 14, 4), 0, yc, z + dz, GUN.metal);
    if (vm) {
      // tubo hueco con forro invertido: sólido desde fuera; al apuntar se mira a través
      const tube = (rt, rb, h, zz) => B.add(GEO.otube(rt, rb, h, 14), 0, yc, zz, GUN.dark, { rx: X }).add(GEO.otube(rt - 0.0008, rb - 0.0008, h, 14), 0, yc, zz, 0x1a1c1e, { rx: X, sx: -1 });
      tube(0.0155, 0.0155, len, z); tube(0.0155, objR, 0.04, z - len / 2 - 0.02); tube(objR, objR, 0.03, z - len / 2 - 0.055); tube(0.019, 0.0155, 0.03, z + len / 2 + 0.015); tube(0.019, 0.019, 0.04, z + len / 2 + 0.05);
      glow(0, yc - 0.008, z - 0.05, 0.0012, 0.012, 0.0006, 0x0c0c0c); glow(-0.009, yc, z - 0.05, 0.01, 0.0012, 0.0006, 0x0c0c0c); glow(0.009, yc, z - 0.05, 0.01, 0.0012, 0.0006, 0x0c0c0c);
    } else {
      B.add(cyl(0.0155, len, 12), 0, yc, z, GUN.dark, { rx: X }).add(GEO.cyl(0.0155, objR, 0.04, 12), 0, yc, z - len / 2 - 0.02, GUN.dark, { rx: X }).add(GEO.cyl(objR, objR, 0.03, 12), 0, yc, z - len / 2 - 0.055, GUN.dark, { rx: X })
        .add(GEO.cyl(0.019, 0.0155, 0.03, 12), 0, yc, z + len / 2 + 0.015, GUN.dark, { rx: X }).add(GEO.cyl(0.019, 0.019, 0.04, 12), 0, yc, z + len / 2 + 0.05, GUN.dark, { rx: X })
        .add(GEO.cyl(objR * 0.85, objR * 0.85, 0.003, 12), 0, yc, z - len / 2 - 0.071, 0x4a6a78, { rx: X });
    }
    B.add(GEO.cyl(0.0075, 0.0075, 0.016, 8), 0, yc + 0.02, z - 0.01, GUN.metal);
    return yc;
  };
  const x2 = (yb, z) => ptube(yb, z, 0.16, 0.019), x4 = (yb, z) => ptube(yb, z, 0.22, 0.024);
  const muzzleAtt = (my, mz) => {
    if (att.muzzle === 'supp') { B.add(cyl(0.02, 0.15, 10), 0, my, mz - 0.065, 0x2a2c2e, { rx: X }); return mz - 0.14; }
    if (att.muzzle === 'comp') { B.add(GEO.rbox(0.03, 0.03, 0.06, 0.006), 0, my, mz - 0.025, GUN.dark); for (let i = 0; i < 3; i++) B.add(b(0.012, 0.008, 0.006), 0, my + 0.014, mz - 0.012 - i * 0.016, 0x141516); return mz - 0.055; }
    if (att.muzzle === 'choke') { B.add(GEO.cyl(0.02, 0.018, 0.05, 8), 0, my, mz - 0.015, GUN.metal, { rx: X }); return mz - 0.04; }
    if (att.muzzle === 'fhider') { B.add(GEO.cyl(0.011, 0.02, 0.06, 10), 0, my, mz - 0.025, GUN.dark, { rx: X }); return mz - 0.055; }
    if (att.muzzle === 'brake') { B.add(cyl(0.017, 0.05, 8), 0, my, mz - 0.02, GUN.dark, { rx: X }); for (const sg of [-1, 1]) B.add(b(0.006, 0.012, 0.016), sg * 0.016, my, mz - 0.02, 0x141516); return mz - 0.045; }
    if (att.muzzle === 'bayo') {
      // bayoneta calada: anilla en la boca, cruz y hoja de un filo bajo el cañón
      B.add(GEO.torus(0.0115, 0.003, 10, 4), 0, my, mz + 0.01, GUN.metal).add(b(0.012, 0.03, 0.012), 0, my - 0.016, mz + 0.012, GUN.metal).add(GEO.rbox(0.014, 0.022, 0.09, 0.005), 0, my - 0.03, mz + 0.06, 0x6a4228)
        .add(b(0.004, 0.022, 0.26), 0, my - 0.028, mz - 0.12, GUN.steel).add(GEO.cone(0.011, 0.04, 4), 0, my - 0.028, mz - 0.27, GUN.steel, { rx: -X, sx: 0.36 });
      return mz;
    }
    return mz;
  };
  // correa de cuero de anilla a anilla (pasa por debajo del arma)
  const sling = (y0, z0, y1, z1) => {
    const n = 7; let py = y0, pz = z0;
    for (let i = 1; i <= n; i++) { const t = i / n, ny = y0 + (y1 - y0) * t - Math.sin(t * Math.PI) * 0.035, nz = z0 + (z1 - z0) * t, dy = ny - py, dz = nz - pz, L = Math.hypot(dy, dz);
      B.add(b(0.022, 0.004, L + 0.004), 0.0, (py + ny) / 2, (pz + nz) / 2, 0x5a3a22, { rx: Math.atan2(dy, -dz) }); py = ny; pz = nz; }
  };
  const laser = () => {};
  const opticAtt = (yb, z) => {
    if (att.optic !== 'x2' && att.optic !== 'x4') return null;
    const top = B.topAt(z);
    return att.optic === 'x2' ? x2(Number.isFinite(top) ? top : yb, z) : x4(Number.isFinite(top) ? top : yb, z);
  };
  // miras de hierro limpias: alza de muesca (base baja y dos montantes finos) y punto de mira con torre baja y aguja fina.
  // sy = línea de mira: el centro de la muesca y la punta del punto quedan a esa altura; en primera persona todo es muy delgado para no tapar la vista
  // 3.1.3: cada arma lleva su propia mira de época (st): alza de muesca en U, en V, cuadrada, de anillo (diópter) o ninguna;
  // punto de mira de aguja, de grano de cebada (triángulo) o de perla de latón; protección con orejetas, túnel o arco.
  const iron = (rz, rbase, fz, fbase, sy, st = {}) => {
    const rear = st.rear || 'u', front = st.front || 'post', hood = st.hood || null, dk = GUN.dark;
    const wd = vm ? 0.0032 : 0.007, gap = vm ? (rear === 'square' ? 0.013 : 0.015) : 0.014, top = sy + 0.007, h = top - rbase - 0.005;
    B.tag = 'sight';
    if (rear !== 'none') B.add(b(0.022, 0.005, 0.014), 0, rbase + 0.0025, rz, dk);
    if (rear === 'u' || rear === 'square') {
      for (const sg of [-1, 1]) B.add(b(wd, h, 0.01), sg * (gap / 2 + wd / 2), rbase + 0.005 + h / 2, rz, dk);
      if (rear === 'square') B.add(b(gap + wd * 2, Math.max(0.002, sy - rbase - 0.006), 0.01), 0, rbase + 0.005 + (sy - rbase - 0.006) / 2, rz, dk);
    } else if (rear === 'v') {
      // dos hojas inclinadas que se juntan en el fondo de la V, justo a la altura de la línea de mira
      const L = 0.016, a = 0.62;
      for (const sg of [-1, 1]) B.add(b(wd, L, 0.008), sg * (Math.sin(a) * L / 2 + 0.0012), sy + Math.cos(a) * L / 2 - 0.0005, rz, dk, { rz: -sg * a });
      const sh = sy - rbase - 0.006; if (sh > 0.002) B.add(b(0.016, sh, 0.008), 0, rbase + 0.005 + sh / 2, rz, dk);
    } else if (rear === 'ring') {
      // diópter: anillo fino centrado en la línea de mira, sobre un pie
      const R = st.ringR || (vm ? 0.0075 : 0.008);
      B.add(GEO.torus(R, vm ? 0.0016 : 0.0022, 16, 5), 0, sy, rz, dk);
      const sh = sy - R - rbase - 0.004; if (sh > 0.001) B.add(b(0.007, sh, 0.008), 0, rbase + 0.005 + sh / 2, rz, dk);
      if (st.ringFrame) for (const sg of [-1, 1]) B.add(b(0.003, R * 2.4, 0.008), sg * (R + 0.004), sy - 0.001, rz, dk);
    }
    const th = Math.max(0.004, Math.min(0.018, (sy - fbase) * 0.5));
    if (front === 'bead') {
      const r = st.beadR || 0.0035;
      B.add(b(0.006, Math.max(0.002, sy - fbase - r), 0.006), 0, fbase + (sy - fbase - r) / 2, fz, dk);
      B.add(GEO.sphere(r, 10, 8), 0, sy - r * 0.2, fz, st.brass === false ? dk : 0xc9a24a);
      if (st.mid) B.add(GEO.sphere(r * 0.6, 8, 6), 0, sy - r * 0.6, st.mid, 0xb8b4a8);
    } else {
      B.add(b(0.01, th, 0.016), 0, fbase + th / 2, fz, dk);
      const ph = sy - fbase - th + 0.001;
      if (front === 'barley') {
        // grano de cebada: un triángulo (cuadrado girado) con la punta en la línea de mira
        const q = vm ? 0.0062 : 0.009, d = q / Math.SQRT2 * 2;
        if (ph - d / 2 > 0.001) B.add(b(vm ? 0.0035 : 0.006, ph - d / 2, 0.008), 0, fbase + th + (ph - d / 2) / 2, fz, dk);
        B.add(b(q, q, 0.007), 0, sy - d / 2 + 0.0004, fz, dk, { rz: Math.PI / 4 });
      } else B.add(b(vm ? 0.0035 : 0.006, ph, 0.008), 0, fbase + th + ph / 2, fz, dk);
      if (hood === 'wings' || hood === 'arch') {
        const hh = sy - fbase + 0.006, off = vm ? 0.0105 : 0.012;
        for (const sg of [-1, 1]) B.add(b(0.0025, hh, 0.012), sg * off, fbase + hh / 2, fz, dk);
        if (hood === 'arch') B.add(b(off * 2 + 0.0025, 0.0022, 0.012), 0, fbase + hh, fz, dk);
      } else if (hood === 'ring') {
        const R = vm ? 0.0105 : 0.012;
        B.add(GEO.torus(R, 0.0016, 18, 4), 0, sy - 0.002, fz, dk);
        B.add(b(0.004, sy - 0.002 - R - fbase + 0.001, 0.006), 0, fbase + (sy - 0.002 - R - fbase) / 2, fz, dk);
      }
    }
    B.tag = null;
    return sy;
  };
  // cañón largo / pesado (devuelve la nueva posición de la boca)
  const barrelAtt = (my, mz, r = 0.013) => {
    if (att.barrel === 'long') { B.add(cyl(r, 0.14), 0, my, mz - 0.05, GUN.dark, { rx: X }).add(cyl(r * 1.5, 0.025), 0, my, mz + 0.02, GUN.metal, { rx: X }); return mz - 0.12; }
    if (att.barrel === 'heavy') { B.add(cyl(r * 1.9, 0.22), 0, my, mz + 0.12, GUN.metal, { rx: X }); return mz; }
    return mz;
  };
  // bajo cañón: empuñadura angulada o bípode plegado
  const gripAtt = (fz, fy) => {
    if (att.grip === 'bipod') { B.add(b(0.01, 0.1, 0.01), -0.03, fy - 0.05, fz - 0.03, GUN.dark, { rz: 0.35, rx: 1.2 }).add(b(0.01, 0.1, 0.01), 0.03, fy - 0.05, fz - 0.03, GUN.dark, { rz: -0.35, rx: 1.2 }).add(b(0.05, 0.015, 0.03), 0, fy - 0.01, fz, GUN.dark); }
    return null;
  };
  // cargadores especiales y culata acolchada (solo visuales)
  const magExtra = (m) => {
    if (att.mag === 'drum') B.add(GEO.cyl(0.075, 0.075, 0.07, 10), 0, m.y - 0.05, m.z, GUN.dark, { rz: X }).add(GEO.cyl(0.03, 0.03, 0.075, 8), 0, m.y - 0.05, m.z, GUN.metal, { rz: X });
  };
  const stockAtt = (z, y) => { if (att.stock === 'pad') B.add(GEO.rbox(0.046, 0.142, 0.022, 0.006), 0, y, z, 0x2a1c16, { rx: 0.08 }); };
  // ---- detalles comunes: ranuras, guardamonte con gatillo, puerto de expulsión, riel ----
  const bx = (w, h, d, x, y, z, c, o) => B.add(b(w, h, d), x, y, z, c, o);
  const cy8 = (r, l, x, y, z, c) => B.add(cyl(r, l, 8), x, y, z, c, { rx: X });
  const vents = (w, y, h, z0, z1, n, c) => { const st = (z1 - z0) / n; for (let i = 0; i < n; i++) bx(w + 0.004, h, st * 0.42, 0, y, z0 + st * (i + 0.5), c || GUN.dark); };
  const trig = (z, y, gl = 0.07) => { bx(0.008, 0.026, 0.01, 0, y, z, GUN.dark, { rx: 0.25 }); bx(0.008, 0.008, gl, 0, y - 0.022, z - gl / 2 + 0.012, GUN.dark); bx(0.008, 0.03, 0.008, 0, y - 0.008, z - gl + 0.012, GUN.dark); };
  const port = (x, y, z, len, h = 0.02) => bx(0.006, h, len, x, y, z, 0x1c1e20);
  const rails = (y, z0, z1, w = 0.034) => { const L = z1 - z0; bx(w * 0.8, 0.008, L, 0, y, (z0 + z1) / 2, GUN.dark); for (let z = z0 + 0.012; z < z1 - 0.005; z += 0.024) bx(w, 0.004, 0.01, 0, y + 0.005, z, GUN.metal); };
  // piezas redondeadas, tubos y conos a lo largo del cañón (r0 = lado trasero), ranuras laterales y empuñadura con ranuras
  const rb = (w, h, d, x, y, z, c, r, o) => B.add(GEO.rbox(w, h, d, r == null ? Math.min(w, h, d) * 0.25 : r), x, y, z, c, o);
  const tb = (r, l, x, y, z, c, seg = 12) => B.add(GEO.cyl(r, r, l, seg), x, y, z, c, { rx: X });
  const cn = (r0, r1, l, x, y, z, c, seg = 12) => B.add(GEO.cyl(r0, r1, l, seg), x, y, z, c, { rx: X });
  const sl = (xs, y, z0, z1, n, h, c) => { const st = (z1 - z0) / n; for (let i = 0; i < n; i++) for (const sg of [-1, 1]) bx(0.004, h, st * 0.5, sg * xs, y, z0 + st * (i + 0.5), c || GUN.dark); };
  const pgrip = (z, y, c, w = 0.034, tilt = -0.28) => {
    u.grip = { y, z, tilt, w };
    rb(w, 0.1, 0.046, 0, y, z, c, 0.012, { rx: tilt });
    for (let i = 0; i < 3; i++) { const dy = 0.025 - i * 0.025; bx(w + 0.003, 0.006, 0.005, 0, y + dy * Math.cos(tilt) + 0.023 * Math.sin(tilt), z + dy * Math.sin(tilt) - 0.023 * Math.cos(tilt), GUN.dark, { rx: tilt }); }
  };
  // cargador curvado en dos tramos con placa de base (tag 'mag' para animar la recarga); tilt positivo = la base va hacia el cañón
  // tramo de cargador; devuelve el centro de su extremo inferior para que mcont() encaje el siguiente tramo sin huecos
  const mseg = (y, z, w, h, d, tilt, c) => { rb(w, h, d, 0, y, z, c, 0.006, { rx: tilt }); return { y: y - h / 2 * Math.cos(tilt), z: z - h / 2 * Math.sin(tilt) }; };
  const mcont = (e, w, h, d, tilt, c) => { const y = e.y - h / 2 * Math.cos(tilt), z = e.z - h / 2 * Math.sin(tilt); mplate(y, z, w, h, d, tilt); return mseg(y, z, w, h, d, tilt, c); };
  const mplate = (y, z, w, h, d, tilt, c) => { const dy = -h / 2; bx(w + 0.004, 0.008, d + 0.006, 0, y + dy * Math.cos(tilt), z + dy * Math.sin(tilt), c || GUN.metal, { rx: tilt }); };
  // detalles únicos (2.11.0): anillas de correa, cartuchos de escopeta, bandas de color de la casa
  const ACC = 0xd9822b;
  const swivel = (x, y, z, ry = 0) => B.add(GEO.torus(0.0085, 0.002, 10, 4), x, y, z, GUN.dark, { rx: X, ry });
  const shell = (x, y, z) => { tb(0.0085, 0.03, x, y, z, 0xb4322a, 8); tb(0.0092, 0.012, x, y, z + 0.02, 0xc9a23a, 8); };
  const ridges = (w, h, y, z, n, dz, c) => { for (let i = 0; i < n; i++) bx(w, h, 0.004, 0, y, z + i * dz, c || GUN.dark); };
  const addDetails = () => {};
  const H_ = { B, b, cyl, X, u, att, vm, GUN, rb, tb, cn, bx, sl, trig, swivel, iron, muzzleAtt, barrelAtt, gripAtt, stockAtt, opticAtt, mseg, mcont, mplate, pgrip, shell, ridges, glow, sling, ACC };
  periodGun(id, H_);
  // 3.2.0: diseño del prototipo en lugar del de la 3.1.4 (se conserva la colocación del arma original en u0)
  const proto = !!PROTO_MAP[id];
  if (proto) { const u0 = { muzzle: u.muzzle.clone(), mag: u.mag.clone(), fore: u.fore ? u.fore.clone() : null, adsDist: u.adsDist }; B.items.length = 0; u.glow.length = 0; delete u.grip; delete u.bolt; protoGun(id, H_, u0); }
  addDetails();
  // puntos de agarre para las manos de primera persona (2.11.4): la empuñadura (centro, inclinación, ancho) y la altura del fondo del guardamanos
  if (!u.grip) u.grip = id === 'sniper' ? { y: -0.025, z: 0.03, tilt: -0.3, w: 0.035 } : id === 'magnum' ? { y: -0.01, z: 0.075, tilt: -0.2, w: 0.03 } : CONFIG.WEAPONS[id] && CONFIG.WEAPONS[id].slot === 'secondary' ? { y: 0, z: 0.012, tilt: -0.2, w: 0.031 } : { y: -0.03, z: 0.03, tilt: -0.26, w: 0.034 };
  if (u.fore) { const sl = sliceFore(B, u.fore.z); if (sl) { if (u.foreY == null) u.foreY = sl.y; u.foreW = sl.w; } else if (u.foreY == null) u.foreY = u.fore.y; }
  // 3.1.2: línea de mira despejada en primera persona. Cualquier pieza gruesa (martillo, alza maciza, cajón, tapa) que asome
  // por encima de la línea de mira en el centro se baja o se recorta para que al apuntar se vea hacia delante; las cuchillas
  // finas de las miras (punto de mira y montantes del alza) se respetan.
  if (vm && !proto && !['sniper', 'mk2', 'rocket', 'knife'].includes(id) && !['x2', 'x4', 'scope'].includes(att.optic)) clearSightLine(B, u.sightY);
  B.tag = 'mag';
  if (att.mag === 'drum' && id === 'smg' && !proto) magExtra(u.mag);
  B.tag = null;
  // empuñaduras y bípode: pieza de unión para que nunca queden colgando del guardamanos
  if (!proto) B.weld();
  const out = { geo: B.build(false), magGeo: B.hasTag('mag') ? B.build(true) : null, boltGeo: B.hasTag('bolt') ? B.build('bolt') : null, barGeo: B.hasTag('barrels') ? B.build('barrels') : null, u, parts: B.items };
  _wmCache[ck] = out;
  return out;
}
// corte del arma en el plano z (donde va la mano de apoyo): fondo del guardamanos y su media anchura, sin contar correas ni cargador
const _slA = new THREE.Vector3(), _slB = new THREE.Vector3(), _slC = new THREE.Vector3();
function sliceFore(B, z0) {
  const pts = [];
  const cross = (p, q) => { if ((p.z - z0) * (q.z - z0) > 0 || p.z === q.z) return; const t = (z0 - p.z) / (q.z - p.z); pts.push(p.x + (q.x - p.x) * t, p.y + (q.y - p.y) * t); };
  for (const it of B.items) { if (it.color === 0x5a3a22 || it.tag === 'mag') continue; const g = it.geo, P = g.attributes.position, I = g.index, n = I ? I.count : P.count;
    if (!g.boundingBox) g.computeBoundingBox(); _pbBox.copy(g.boundingBox).applyMatrix4(it.m); if (_pbBox.max.z < z0 || _pbBox.min.z > z0) continue;
    for (let k = 0; k < n; k += 3) { _slA.fromBufferAttribute(P, I ? I.getX(k) : k).applyMatrix4(it.m); _slB.fromBufferAttribute(P, I ? I.getX(k + 1) : k + 1).applyMatrix4(it.m); _slC.fromBufferAttribute(P, I ? I.getX(k + 2) : k + 2).applyMatrix4(it.m); cross(_slA, _slB); cross(_slB, _slC); cross(_slC, _slA); } }
  let y = Infinity; for (let k = 0; k < pts.length; k += 2) if (Math.abs(pts[k]) < 0.03 && pts[k + 1] < y) y = pts[k + 1];
  if (!Number.isFinite(y)) return null;
  let w = 0; for (let k = 0; k < pts.length; k += 2) if (pts[k + 1] < y + 0.04 && Math.abs(pts[k]) < 0.05) w = Math.max(w, Math.abs(pts[k]));
  return { y, w };
}
// corte horizontal del arma a la altura y0 (empuñadura de pistola): frente, trasera y media anchura de la pieza que queda en torno a zc
function sliceGrip(B, y0, zc) {
  let z0 = Infinity, z1 = -Infinity, w = 0;
  const cross = (p, q) => { if ((p.y - y0) * (q.y - y0) > 0 || p.y === q.y) return; const t = (y0 - p.y) / (q.y - p.y), x = p.x + (q.x - p.x) * t, z = p.z + (q.z - p.z) * t; if (Math.abs(x) > 0.03 || Math.abs(z - zc) > 0.06) return; if (z < z0) z0 = z; if (z > z1) z1 = z; if (Math.abs(x) > w) w = Math.abs(x); };
  for (const it of B.items) { if (it.color === 0x5a3a22 || it.tag === 'mag') continue; const g = it.geo, P = g.attributes.position, I = g.index, n = I ? I.count : P.count;
    if (!g.boundingBox) g.computeBoundingBox(); _pbBox.copy(g.boundingBox).applyMatrix4(it.m); if (_pbBox.max.y < y0 || _pbBox.min.y > y0) continue;
    for (let k = 0; k < n; k += 3) { _slA.fromBufferAttribute(P, I ? I.getX(k) : k).applyMatrix4(it.m); _slB.fromBufferAttribute(P, I ? I.getX(k + 1) : k + 1).applyMatrix4(it.m); _slC.fromBufferAttribute(P, I ? I.getX(k + 2) : k + 2).applyMatrix4(it.m); cross(_slA, _slB); cross(_slB, _slC); cross(_slC, _slA); } }
  return Number.isFinite(z0) ? { z0, z1, w } : null;
}
function buildWeaponModel(id, vm = false, att = null) {
  const { geo, magGeo, boltGeo, barGeo, u } = weaponGeometry(id, vm, att);
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, MAT.gun()); m.castShadow = !vm; g.add(m);
  // el cargador es una malla aparte: sale y entra al recargar (animMag)
  const magMesh = magGeo ? new THREE.Mesh(magGeo, m.material) : null;
  if (magMesh) { magMesh.castShadow = !vm; g.add(magMesh); }
  // piezas sin luz (punto rojo, retículo, lente del láser): siempre visibles
  for (const q of u.glow) { const gm = mesh(GEO.box(q.w, q.h, q.d), MAT.basic(q.color, { fog: false }), q.x, q.y, q.z, g); if (q.rz) gm.rotation.z = q.rz; }
  // 3.2.2: cerrojo y cañones basculantes, cada uno colgado de su eje de giro (recargas de primera persona)
  const parts = {};
  for (const [t, pg] of [['bolt', boltGeo], ['barrels', barGeo]]) if (pg && u.pivots && u.pivots[t]) { const pv = new THREE.Group(); pv.position.copy(u.pivots[t]); const pm = new THREE.Mesh(pg, m.material); pm.position.copy(u.pivots[t]).negate(); pm.castShadow = !vm; pv.add(pm); g.add(pv); parts[t] = pv; }
  g.userData = { ...u, id, magMesh, parts };
  return g;
}
// sacar el arma: sube desde abajo y se pasa un poco de largo antes de asentarse. s: 1 (guardada) → 0 (lista); devuelve lo mismo, con rebote
function drawEase(s) {
  if (s <= 0) return 0; if (s >= 1) return 1;
  const u = 1 - s, c1 = 1.35, c3 = c1 + 1, w = u - 1;
  return 1 - (1 + c3 * w * w * w + c1 * w * w);
}
// resorte amortiguado con la velocidad en o[k+'V']: rebota al soltarse un golpe en lugar de volver con una curva fija
function spring(o, k, target, stiff, damping, dt) {
  const h = Math.min(dt, 1 / 40), vk = k + 'V';
  let v = (o[vk] || 0) + (-(o[k] - target) * stiff - (o[vk] || 0) * damping) * h;
  o[vk] = v; o[k] += v * h;
}
// recarga: el cargador baja y se desprende, uno nuevo sube desde abajo y encaja
// fases de la recarga (0..1): el cargador baja, la mano libre va al portacargadores, vuelve, lo mete y da un golpe seco
// tilt: arma ladeada · pw: peso de la mano en el portacargadores · mw: peso de la mano en el cargador (si no, en el guardamanos)
// mo: cuánto más abajo del cargador va la mano al meterlo · slap: golpe seco al final
function reloadAnim(f, out) {
  const o = out || {}; const k = f.reloadT > 0 ? clamp(1 - f.reloadT / Math.max(0.01, f.reloadTotal), 0, 1) : 0;
  o.k = k;
  o.tilt = k < 0.16 ? smooth01(k / 0.16) : k < 0.8 ? 1 : 1 - smooth01((k - 0.8) / 0.16);
  o.mw = k < 0.12 ? smooth01(k / 0.12) : k < 0.86 ? 1 : 1 - smooth01((k - 0.86) / 0.1);
  o.pw = k < 0.24 ? 0 : k < 0.36 ? smooth01((k - 0.24) / 0.12) : k < 0.5 ? 1 - smooth01((k - 0.38) / 0.12) : 0;
  o.mo = k < 0.5 ? Math.sin(clamp((k - 0.2) / 0.3, 0, 1) * Math.PI) * 0.05 : k < 0.82 ? (1 - smooth01((k - 0.5) / 0.3)) * 0.14 : 0;
  o.slap = k > 0.82 && k < 0.92 ? Math.sin((k - 0.82) / 0.1 * Math.PI) : 0;
  return o;
}
function animMag(M, f) {
  const mm = M && M.userData && M.userData.magMesh; if (!mm) return;
  let off = 0, vis = true;
  if (f.reloadT > 0) {
    const k = clamp(1 - f.reloadT / Math.max(0.01, f.reloadTotal), 0, 1);
    off = k < 0.22 ? smooth01(k / 0.22) : k < 0.5 ? 1 : k < 0.82 ? 1 - smooth01((k - 0.5) / 0.32) : 0;
    vis = !(k > 0.3 && k < 0.5);
  }
  mm.visible = vis; mm.position.set(0, -0.3 * off, 0.04 * off); mm.rotation.set(0.35 * off, 0, 0);
}
// ícono lateral del arma (HUD): se dibuja una vez por arma y accesorios con un renderizador pequeño y se guarda como imagen
const _wIcons = {};
let _iconR = null;
function weaponIconURL(id, att) {
  const key = id + ':' + (att ? attKey(att) : '');
  if (_wIcons[key] !== undefined) return _wIcons[key];
  let url = '';
  try {
    const W = 320, H = 120;
    const r = _iconR || (_iconR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }));
    if (r.getContext().isContextLost()) return '';
    r.setSize(W, H, false); r.setClearColor(0x000000, 0); r.setViewport(0, 0, W, H);
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xffffff, 0x666a70, 2.4)); const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(3, 4, 2); sc.add(dl);
    const m = buildWeaponModel(id, false, att); sc.add(m);
    const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
    const hw = Math.max(sz.z / 2, (sz.y / 2) * (W / H)) * 1.1, hh = hw * H / W;
    const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 0.1, 20);
    cam.position.set(c.x + 4, c.y, c.z); cam.lookAt(c.x, c.y, c.z); cam.up.set(0, 1, 0);
    r.render(sc, cam);
    url = r.domElement.toDataURL('image/png');
  } catch (e) { url = ''; }
  _wIcons[key] = url;
  return url;
}
function buildHandGrenade() {
  const g = new THREE.Group();
  const b = mesh(GEO.sphere(0.036, 10, 8), MAT.lam(0x6d8446), 0, 0, 0, g); b.scale.set(1, 1.18, 1);
  mesh(GEO.cyl(0.037, 0.037, 0.012, 10), MAT.lam(0xd8b83a), 0, 0.004, 0, g);
  mesh(GEO.cyl(0.014, 0.017, 0.022, 8), MAT.lam(0x9a9da0), 0, 0.047, 0, g);
  mesh(GEO.box(0.009, 0.05, 0.015), MAT.lam(0x9a9da0), 0.017, 0.032, 0, g);
  const ring = mesh(GEO.torus(0.011, 0.002, 5, 8), MAT.lam(0xc8cacc), 0, 0.062, 0, g); ring.rotation.x = Math.PI / 2;
  return g;
}

