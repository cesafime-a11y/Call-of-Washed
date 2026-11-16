#!/usr/bin/env python3
"""Genera src/js/08b0_mannequin.js a partir del Xbot (Mixamo, glb de los ejemplos de three.js).

El glb original tiene ~28 000 vértices y 67 huesos. Aquí se reajusta al esqueleto de 11 segmentos del juego
(SKEL en 06_ragdoll.js): cada grupo de huesos del Xbot se lleva a la pose de reposo del soldado (brazos
colgando, piernas rectas) con una transformación rígida + escala a lo largo del eje, se quita la cabeza (el
juego conserva su cabeza de bloques con caras, cascos y gafas), se simplifica con meshoptimizer y se guarda
en un binario compacto (posiciones, normales, 4 índices de articulación + pesos, etiqueta de región y triángulos).

uso: python3 tools/make_mannequin.py xbot.glb [triangulos_objetivo]
requiere: numpy, meshoptimizer (pip)
"""
import sys, os, base64, struct, json
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import glbread
import meshoptimizer as mo

GROUPS = ['pelvis', 'chest', 'head', 'upperArmL', 'foreArmL', 'upperArmR', 'foreArmR', 'thighL', 'shinL', 'thighR', 'shinR']
SKEL = {  # pivotes de reposo, copiados de 06_ragdoll.js
    'pelvis': (0, 0.94, 0), 'chest': (0, 1.06, 0), 'head': (0, 1.5, 0),
    'upperArmL': (-0.265, 1.44, 0), 'foreArmL': (-0.265, 1.15, 0), 'upperArmR': (0.265, 1.44, 0), 'foreArmR': (0.265, 1.15, 0),
    'thighL': (-0.105, 0.93, 0), 'shinL': (-0.105, 0.48, 0), 'thighR': (0.105, 0.93, 0), 'shinR': (0.105, 0.48, 0),
}
# etiquetas de región: 0 uniforme (camuflaje), 1 piel, 2 guante, 3 bota
def classify(name):
    n = name.replace('mixamorig:', '')
    side = 'L' if n.startswith('Left') else 'R' if n.startswith('Right') else ''
    b = n[len('Left'):] if n.startswith('Left') else n[len('Right'):] if n.startswith('Right') else n
    if n == 'Hips': return 'pelvis', 0
    if n in ('Spine', 'Spine1', 'Spine2') or b == 'Shoulder': return 'chest', 0
    if n == 'Neck': return 'chest', 1
    if n in ('Head', 'HeadTop_End') or b in ('Eye',): return 'head', 1
    if b == 'Arm': return 'upperArm' + side, 0
    if b == 'ForeArm': return 'foreArm' + side, 0
    if b.startswith('Hand'): return 'foreArm' + side, 2
    if b == 'UpLeg': return 'thigh' + side, 0
    if b == 'Leg': return 'shin' + side, 0
    if b in ('Foot', 'ToeBase', 'Toe_End'): return 'shin' + side, 3
    return 'pelvis', 0

def rot_arc(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b)
    v = np.cross(a, b); c = float(np.dot(a, b))
    if c < -0.9999:
        ax = np.cross(a, [1, 0, 0]);
        if np.linalg.norm(ax) < 1e-3: ax = np.cross(a, [0, 0, 1])
        ax /= np.linalg.norm(ax); K = np.array([[0, -ax[2], ax[1]], [ax[2], 0, -ax[0]], [-ax[1], ax[0], 0]]); return np.eye(3) + 2 * K @ K
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + K + K @ K / (1 + c)

def main():
    src = sys.argv[1]; target_tris = int(sys.argv[2]) if len(sys.argv) > 2 else 7500
    js, bin = glbread.load(src)
    sk = js['skins'][0]; ibm = glbread.acc(js, bin, sk['inverseBindMatrices']).reshape(-1, 4, 4)
    jn = [js['nodes'][j]['name'] for j in sk['joints']]
    R180 = np.array([-1, 1, -1], dtype=np.float32)   # el Xbot mira a +Z; el juego, a -Z
    bpos = {n: np.linalg.inv(m.T)[:3, 3] * R180 for n, m in zip(jn, ibm)}
    gi = {g: i for i, g in enumerate(GROUPS)}
    cls = [classify(n) for n in jn]
    P, J, W = [], [], []
    for m in js['meshes']:
        for p in m['primitives']:
            at = p['attributes']
            P.append(glbread.acc(js, bin, at['POSITION']).astype(np.float32) * R180)
            J.append(glbread.acc(js, bin, at['JOINTS_0']).astype(np.int64)); W.append(glbread.acc(js, bin, at['WEIGHTS_0']).astype(np.float32))
    idx = []; base = 0
    for m in js['meshes']:
        for p in m['primitives']:
            n = len(P[len(idx)]); idx.append(glbread.acc(js, bin, p['indices']).reshape(-1, 3).astype(np.int64) + base); base += n
    P = np.concatenate(P); J = np.concatenate(J); W = np.concatenate(W); T = np.concatenate(idx)
    # pesos por grupo y etiqueta por hueso dominante
    GW = np.zeros((len(P), len(GROUPS)), np.float32); tag = np.zeros(len(P), np.int64); dom = np.zeros(len(P), np.float32)
    for k in range(4):
        gidx = np.array([gi[cls[j][0]] if cls[j][0] in gi else 0 for j in range(len(jn))]); tg = np.array([cls[j][1] for j in range(len(jn))])
        gk = gidx[J[:, k]]
        np.add.at(GW, (np.arange(len(P)), gk), W[:, k])
        better = W[:, k] > dom; tag[better] = tg[J[better, k]]; dom[better] = W[better, k]
    GW /= np.maximum(GW.sum(1, keepdims=True), 1e-6)
    # fuera la cabeza (se conserva la del juego)
    keep_v = GW[:, gi['head']] < 0.5
    keep_t = keep_v[T].all(1); T = T[keep_t]
    # segmentos: (origen Xbot, extremo Xbot, origen soldado, extremo soldado, escala x)
    B = lambda n: bpos['mixamorig:' + n]
    def seg(side):
        s = 'Left' if side == 'L' else 'Right'; sg = -1 if side == 'L' else 1
        return {
            'upperArm' + side: (B(s + 'Arm'), B(s + 'ForeArm'), SKEL['upperArm' + side], SKEL['foreArm' + side], 1.0),
            'foreArm' + side: (B(s + 'ForeArm'), B(s + 'Hand'), SKEL['foreArm' + side], np.array(SKEL['foreArm' + side]) + [0, -0.215, 0], 1.0),
            'thigh' + side: (B(s + 'UpLeg'), B(s + 'Leg'), SKEL['thigh' + side], SKEL['shin' + side], 1.0),
            'shin' + side: (B(s + 'Leg'), np.array([B(s + 'Foot')[0], float(P[:, 1].min()), B(s + 'Foot')[2]]), SKEL['shin' + side], np.array([SKEL['shin' + side][0], 0.0, SKEL['shin' + side][2]]), 1.0),
        }
    S = {
        'pelvis': (B('Hips'), B('Spine'), SKEL['pelvis'], SKEL['chest'], 1.05),
        'chest': (B('Spine'), B('Head'), SKEL['chest'], SKEL['head'], 1.22),
        'head': (B('Head'), B('HeadTop_End'), SKEL['head'], (0, 1.75, 0), 1.0),
    }
    S.update(seg('L')); S.update(seg('R'))
    KZ = 0.92
    TORSO_HALF = [0.135, 0.150, 0.155, 0.155, 0.150, 0.155, 0.160, 0.168, 0.178, 0.188, 0.200, 0.225]
    KBACK = 0.82; THIGH_IN = 0.028
    KR = {'thighL': 0.98, 'thighR': 0.98, 'shinL': 1.04, 'shinR': 1.04, 'upperArmL': 0.92, 'upperArmR': 0.92, 'foreArmL': 0.92, 'foreArmR': 0.92}
    # el torso se ensancha para que el hombro llegue al pivote del brazo del juego
    newP = np.zeros_like(P)
    for g, i in gi.items():
        p0, e0, t0, e1, kx = [np.array(x, np.float64) for x in S[g][:4]] + [S[g][4]]
        d0 = e0 - p0; d1 = e1 - t0
        L0 = np.linalg.norm(d0); L1 = np.linalg.norm(d1); k = L1 / L0
        Rm = rot_arc(d0, d1); dh = d0 / L0
        v = (P - p0).astype(np.float64)
        a = v @ dh
        v = v + np.outer(a * (k - 1), dh)                       # escala a lo largo del eje
        v[:, 0] *= kx if g in ('pelvis', 'chest') else 1.0       # ancho del torso
        if g == 'pelvis': v[:, 2] *= KZ                          # menos fondo en la cadera
        if g in KR:                                              # extremidades más finas alrededor de su eje
            perp = v - np.outer(v @ dh, dh); v = v - (1 - KR[g]) * perp
        x = t0 + v @ Rm.T
        newP += (GW[:, i:i + 1] * x).astype(np.float32)
    P = newP
    # proporciones del torso: perfil de ancho objetivo por altura (cintura menos estrecha, cadera menos ancha) y fondo simétrico
    tw = GW[:, gi['pelvis']] + GW[:, gi['chest']]
    ys = np.arange(0.80, 1.43, 0.025)
    TH = np.interp(ys, [0.80, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30, 1.35, 1.40], TORSO_HALF)
    cur = []
    for y in ys:
        m = (tw > 0.7) & (abs(P[:, 1] - y) < 0.03)
        cur.append(np.abs(P[m, 0]).max() if m.sum() > 3 else np.nan)
    cur = np.array(cur); ok = ~np.isnan(cur); cur = np.interp(ys, ys[ok], cur[ok])
    k = np.convolve(np.pad(TH / cur, 2, mode='edge'), np.ones(5) / 5, mode='valid')
    fx = np.interp(P[:, 1], ys, k)
    P[:, 0] *= 1 + (fx - 1) * tw
    zc = 0.02
    low = np.clip((1.12 - P[:, 1]) / 0.2, 0, 1) * tw
    P[:, 2] = (P[:, 2] - low * zc) * (1 - low * (1 - KBACK))
    # muslos: la masa lateral de la parte alta se acerca al eje de la pierna
    for g, sg in (('thighL', -1), ('thighR', 1)):
        up = np.clip((P[:, 1] - 0.58) / 0.22, 0, 1) * GW[:, gi[g]]
        P[:, 0] -= sg * up * THIGH_IN
    # compactar sin cabeza y soldar por posición
    used = np.unique(T); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
    P = P[used]; GW = GW[used]; tag = tag[used]; T = remap[T]
    key = np.round(P * 2000).astype(np.int64)
    kk = np.concatenate([key, tag[:, None], np.round(GW * 20).astype(np.int64)], 1)
    _, first, inv = np.unique(kk, axis=0, return_index=True, return_inverse=True)
    P = P[first]; GW = GW[first]; tag = tag[first]; T = inv.reshape(-1)[T]
    T = T[(T[:, 0] != T[:, 1]) & (T[:, 1] != T[:, 2]) & (T[:, 0] != T[:, 2])]
    print('vertices', len(P), 'triangulos', len(T))
    def normals(P, T):
        N = np.zeros_like(P); fn = np.cross(P[T[:, 1]] - P[T[:, 0]], P[T[:, 2]] - P[T[:, 0]])
        for k in range(3): np.add.at(N, T[:, k], fn)
        return N / np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
    N = normals(P, T)
    # el uniforme y las botas son del juego (buildUniform y cajas): del maniquí solo se conservan manos y cuello
    if os.environ.get('MQ_HANDS_ONLY', '1') == '1':
        keep = ((tag[T] == 1) | (tag[T] == 2)).all(1); T = T[keep]
        used = np.unique(T); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
        P = P[used]; GW = GW[used]; tag = tag[used]; T = remap[T]; N = normals(P, T)
        print('solo manos y cuello: vertices', len(P), 'triangulos', len(T))
    # simplificar con los pesos de piel y la etiqueta como atributos (para no deformar costuras ni mezclar regiones)
    onehot = np.eye(4, dtype=np.float32)[tag]
    attrs = np.concatenate([GW, onehot, N * 0.5], 1).astype(np.float32)
    aw = np.array([1.0] * len(GROUPS) + [2.0] * 4 + [0.5] * 3, np.float32)
    dst = np.zeros(len(T) * 3, np.uint32)
    import ctypes
    from meshoptimizer import simplifier as _sm
    Ti = np.ascontiguousarray(T.astype(np.uint32).reshape(-1)); Pf = np.ascontiguousarray(P.astype(np.float32)); At = np.ascontiguousarray(attrs); Aw = np.ascontiguousarray(aw)
    fn = _sm.lib.meshopt_simplifyWithAttributes
    fn.restype = ctypes.c_size_t
    fn.argtypes = [ctypes.c_void_p, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_void_p, ctypes.c_size_t, ctypes.c_float, ctypes.c_uint, ctypes.c_void_p]
    err = ctypes.c_float(0)
    n = fn(dst.ctypes.data, Ti.ctypes.data, len(Ti), Pf.ctypes.data, len(Pf), 12, At.ctypes.data, At.shape[1] * 4, Aw.ctypes.data, len(Aw), None, target_tris * 3, 0.05, 0, ctypes.addressof(err))
    print('error', err.value)
    T = dst[:n].reshape(-1, 3).astype(np.int64)
    used = np.unique(T); remap = -np.ones(len(P), np.int64); remap[used] = np.arange(len(used))
    P = P[used]; GW = GW[used]; tag = tag[used]; T = remap[T]
    N = normals(P, T)
    print('simplificado: vertices', len(P), 'triangulos', len(T))
    # 4 pesos principales
    order = np.argsort(-GW, axis=1)[:, :4]; jj = order.astype(np.uint8)
    ww = np.take_along_axis(GW, order, 1); ww /= np.maximum(ww.sum(1, keepdims=True), 1e-6)
    wq = np.round(ww * 255).astype(np.int64); wq[:, 0] += 255 - wq.sum(1); wq = wq.clip(0, 255).astype(np.uint8)
    out = bytearray(struct.pack('<HI', len(P), len(T) * 3))
    out += P.astype('<f4').tobytes() + np.round(N * 127).astype(np.int8).tobytes() + jj.tobytes() + wq.tobytes() + tag.astype(np.uint8).tobytes() + T.astype('<u2').tobytes()
    b64 = base64.b64encode(bytes(out)).decode()
    dest = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'js', 'data_mannequin.js')
    open(dest, 'w').write('// ---- data_mannequin.js ----\n// Generado por tools/make_mannequin.py (Xbot de Mixamo reajustado al esqueleto del juego, sin cabeza, simplificado). No editar a mano.\n'
                          f"const MANNEQUIN_B64 = '{b64}';\n")
    print('bytes', len(out), 'base64', len(b64), '->', dest)
    np.savez('/tmp/mannequin_dbg.npz', P=P, T=T, tag=tag, jj=jj, wq=wq)

main()
