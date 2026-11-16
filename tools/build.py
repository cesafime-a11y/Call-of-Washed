#!/usr/bin/env python3
"""Arma el HTML único desde src/: python3 tools/build.py [salida]  (por defecto dist/Call of Washed.html)"""
import os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
def rd(p): return open(os.path.join(SRC, p), encoding='utf-8').read()
def build():
    out = []
    for line in rd('index.tpl.html').split('\n'):
        if line == '@@css@@':
            out.append(''.join(rd('css/' + f) for f in sorted(os.listdir(os.path.join(SRC, 'css'))) if f.endswith('.css')))
        elif line == '@@modules@@':
            out.append(''.join(rd('js/' + f.strip()) for f in rd('modules.txt').split('\n') if f.strip()))
        elif line.startswith('@@include ') and line.endswith('@@'):
            out.append(rd(line[10:-2].strip()))
        else:
            out.append(line + '\n')
    s = ''.join(out)
    return s[:-1] if s.endswith('\n') and not rd('index.tpl.html').endswith('\n') else s
if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'dist', 'Call of Washed.html')
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    open(dst, 'w', encoding='utf-8', newline='\n').write(build())
    print('ok ->', dst)
