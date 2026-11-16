#!/usr/bin/env python3
# Genera src/js/08g_proto_guns.js a partir de los diseños de armas del prototipo v4 (guns.js y guns2.js).
import re, sys, pathlib
src = pathlib.Path(sys.argv[1]); out = pathlib.Path(__file__).resolve().parent.parent / 'src/js/08g_proto_guns.js'
g1 = (src / 'guns.js').read_text(); g2 = (src / 'guns2.js').read_text()
def clean(t):
    t = re.sub(r'^import .*\n', '', t, flags=re.M)
    t = re.sub(r'^export (const|function)', r'\1', t, flags=re.M)
    return t
g1 = clean(g1); g1 = g1[:g1.index('// mano sencilla con dedos')]
g1 = re.sub(r'^function makeGunMats0[\s\S]*?\n}\n', '', g1, flags=re.M); g1 = re.sub(r'^function makeGunMats\(.*\n', '', g1, flags=re.M)
g2 = clean(g2)
head = '''// ---- 08g_proto_guns.js ----
// =====================================================================
// DISEÑOS DE ARMAS DEL PROTOTIPO v4 (3.2.0) — generado por tools/port_proto_guns.py; no editar a mano.
// Todo va dentro de PROTO para no chocar con los nombres del resto del juego.
// Convenio: cañón hacia -Z, arriba +Y, origen en el gatillo, ánima a y≈.03.
// =====================================================================
const PROTO = (() => {
const T3 = THREE; let LOD = 1;
const sg = (n, min = 5) => Math.max(min, Math.round((n || 0) * LOD));
// mismas geometrías de three con el número de caras a escala (LOD < 1 para las armas vistas de lejos)
const THREE_L = Object.assign({}, T3);
THREE_L.CylinderGeometry = function (a, b, h, s = 32, ...r) { return new T3.CylinderGeometry(a, b, h, sg(s, 6), ...r); };
THREE_L.SphereGeometry = function (r, w = 32, h = 16, ...x) { return new T3.SphereGeometry(r, sg(w, 6), sg(h, 4), ...x); };
THREE_L.TorusGeometry = function (r, t, a = 12, b = 48, ...x) { return new T3.TorusGeometry(r, t, sg(a, 4), sg(b, 6), ...x); };
THREE_L.CapsuleGeometry = function (r, l, c = 4, s = 8) { return new T3.CapsuleGeometry(r, l, sg(c, 2), sg(s, 5)); };
THREE_L.TubeGeometry = function (c, n = 64, r = 1, s = 8, ...x) { return new T3.TubeGeometry(c, sg(n, 8), r, sg(s, 4), ...x); };
THREE_L.ExtrudeGeometry = function (s, o = {}) { return new T3.ExtrudeGeometry(s, { ...o, bevelSegments: o.bevelEnabled === false ? 0 : sg(o.bevelSegments ?? 3, 1), curveSegments: sg(o.curveSegments ?? 12, 3) }); };
return ((THREE) => {
'''
tail = '''
return { GUNS, buildGun, setLOD(v) { LOD = v; } };
})(THREE_L);
})();
'''
body = g2 + '\n' + g1
body = body.replace('function loft(st, seg = 22, uvS = 1.4) {', 'function loft(st, seg = 22, uvS = 1.4) { seg = sg(seg, 8);')
out.write_text(head + body + tail)
print('ok', len(head + body + tail))
