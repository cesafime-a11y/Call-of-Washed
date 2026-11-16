"""Ayuda para editar módulos con reemplazos exactos: from patchlib import rep; rep('js/15b_ui.js', 'texto viejo', 'texto nuevo')"""
import os
SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'src')
def rep(path, old, new, cnt=1):
    p = os.path.join(SRC, path); s = open(p, encoding='utf-8').read()
    n = s.count(old); assert n == cnt, (path, 'ocurrencias', n, old[:80])
    open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
def where(text):
    """En qué módulo(s) aparece un texto."""
    out = []
    for d in ('js', 'css', 'html'):
        for f in sorted(os.listdir(os.path.join(SRC, d))):
            if text in open(os.path.join(SRC, d, f), encoding='utf-8').read(): out.append(d + '/' + f)
    return out
