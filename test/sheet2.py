# hoja de contactos: python3 sheet2.py carpeta columnas escala
import glob, sys, os, re
from PIL import Image
d = sys.argv[1]; cols = int(sys.argv[2]); k = float(sys.argv[3]) if len(sys.argv) > 3 else .5
pat = sys.argv[4] if len(sys.argv) > 4 else ''
fs = sorted([f for f in glob.glob(d + '/*.png') if re.match(r'\d+_', os.path.basename(f)) and pat in f], key=lambda f: (int(os.path.basename(f).split('_')[0]), os.path.basename(f)))
im = [Image.open(f) for f in fs]; w, h = im[0].size; rows = (len(im) + cols - 1) // cols
W = Image.new('RGB', (w * cols, h * rows))
for i, m in enumerate(im): W.paste(m, ((i % cols) * w, (i // cols) * h))
W.resize((int(w * cols * k), int(h * rows * k))).save(d + '/sheet.png')
