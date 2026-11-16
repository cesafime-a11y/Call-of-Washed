#!/usr/bin/env python3
"""Compara el HTML armado con otro (ignorando las líneas '// ---- módulo ----'): python3 tools/verify.py base.html"""
import re, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build import build
strip = lambda t: re.sub(r'^// ---- \S+ ----\n', '', t, flags=re.M)
a = open(sys.argv[1], encoding='utf-8').read(); b = build()
print('IGUAL' if strip(a) == strip(b) else 'DIFERENTE')
