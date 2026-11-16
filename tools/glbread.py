# lector mínimo de GLB (solo lo que necesita make_mannequin.py)
import json, struct
import numpy as np
CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
def load(path):
    d = open(path, 'rb').read()
    clen, _ = struct.unpack('<I4s', d[12:20]); js = json.loads(d[20:20 + clen])
    off = 20 + clen; blen, _ = struct.unpack('<I4s', d[off:off + 8]); bin = d[off + 8:off + 8 + blen]
    return js, bin
def acc(js, bin, i):
    a = js['accessors'][i]; bv = js['bufferViews'][a['bufferView']]
    n = NC[a['type']]; dt = np.dtype(CT[a['componentType']])
    start = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    stride = bv.get('byteStride') or n * dt.itemsize
    if stride == n * dt.itemsize:
        arr = np.frombuffer(bin, dtype=dt, count=a['count'] * n, offset=start).reshape(a['count'], n)
    else:
        arr = np.stack([np.frombuffer(bin, dtype=dt, count=n, offset=start + k * stride) for k in range(a['count'])])
    return arr.copy()
