#!/usr/bin/env python3
"""Una sola vez: parte game.html (archivo único) en src/ (módulos). Después se edita src/ y se arma con tools/build.py."""
import os, re, sys, json
SRC = sys.argv[1] if len(sys.argv) > 1 else 'game.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'src'
L = open(SRC, encoding='utf-8').read().split('\n')
# split por '\n' → cada elemento sin salto; al escribir se une con '\n' y se agrega el salto final de cada archivo
def seg(a, b): return L[a - 1:b]          # líneas 1-based [a, b]
def find(prefix, start=1):
    for i in range(start - 1, len(L)):
        if L[i].startswith(prefix): return i + 1
    raise SystemExit('no encontrado: ' + prefix)
def banner_before(title_prefix, start=1):
    t = find(title_prefix, start); assert L[t - 2].startswith('// ====='), title_prefix; return t - 1
os.makedirs(OUT + '/css', exist_ok=True); os.makedirs(OUT + '/js', exist_ok=True); os.makedirs(OUT + '/html', exist_ok=True)
def write(path, lines): open(path, 'w', encoding='utf-8', newline='\n').write('\n'.join(lines) + '\n')

style_open = find('<style>', 2)                  # <style> del bloque grande (línea 7)
style_close = find('</style>', style_open)
body_end = find('<script>', style_close) - 1     # el HTML del juego termina antes del <script> de arranque
mod_open = find('<script type="module">')
mod_close = find('</script>', mod_open)

# ---- CSS ----
css0 = style_open + 1
css_cuts = [('00_base.css', css0), ('10_menu.css', css0 + 42), ('20_hud.css', css0 + 145), ('30_kit.css', css0 + 364), ('40_hud2.css', css0 + 534), ('50_soldier.css', css0 + 557)]
for k, (name, a) in enumerate(css_cuts):
    b = (css_cuts[k + 1][1] - 1) if k + 1 < len(css_cuts) else style_close - 1
    write(f'{OUT}/css/{name}', seg(a, b))
# ---- HTML del juego ----
write(f'{OUT}/html/body.html', seg(style_close + 1, body_end))

# ---- JS ----
heads = [(i + 1, re.match(r'// ---- (\S+) ----$', L[i]).group(1)) for i in range(mod_open, mod_close) if re.match(r'// ---- (\S+) ----$', L[i])]
cuts = [(ln, name, False) for ln, name in heads]
ent = find('// ---- 08_entities.js ----')
extra = [(banner_before('// SOLDADO — estado', ent), '08a_fighter.js'), (banner_before('// VISTA DEL SOLDADO', ent), '08b_soldierview.js'), (banner_before('// CUERPOS — se quedan', ent), '08c_corpses.js'),
         (banner_before('// UI — menús, HUD militar'), '15a_strings.js')]
strend = find('};', find('const STR = {'))
extra.append((strend + 2, '15b_ui.js'))     # tras el cierre de STR y una línea en blanco (el 15_ui original pasa a ser 15a_strings.js)
cuts += [(ln, name, True) for ln, name in extra]
cuts.sort()
names = []
for k, (a, name, synth) in enumerate(cuts):
    b = (cuts[k + 1][0] - 1) if k + 1 < len(cuts) else mod_close - 1
    lines = seg(a, b)
    if name == '08c_viewmodel.js': name = '08d_viewmodel.js'; lines[0] = '// ---- 08d_viewmodel.js ----'
    if name == '15_ui.js': name = '15a_strings.js'; lines[0] = '// ---- 15a_strings.js ----'
    if synth and not lines[0].startswith('// ---- '): lines = [f'// ---- {name} ----'] + lines
    names.append(name)
    write(f'{OUT}/js/{name}', lines)
open(f'{OUT}/modules.txt', 'w', encoding='utf-8').write('\n'.join(dict.fromkeys(names)) + '\n')
# ---- plantilla ----
tpl = seg(1, style_open) + ['@@css@@'] + seg(style_close, style_close) + ['@@include html/body.html@@'] + seg(body_end + 1, mod_open) + ['@@modules@@'] + L[mod_close - 1:]
open(f'{OUT}/index.tpl.html', 'w', encoding='utf-8', newline='\n').write('\n'.join(tpl))
print('ok', len(names), 'módulos')
