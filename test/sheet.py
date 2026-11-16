import glob, sys, os
from PIL import Image
d = sys.argv[1]; fs = sorted(glob.glob(d + '/*_hip.png'), key=lambda f: int(os.path.basename(f).split('_')[0]))
W = Image.new('RGB', (1600, 540 * len(fs)))
for i, f in enumerate(fs):
    W.paste(Image.open(f), (0, 540 * i)); W.paste(Image.open(f.replace('hip', 'ads')), (960, 540 * i))
k = float(sys.argv[2]) if len(sys.argv) > 2 else .75
W.resize((int(1600 * k), int(540 * len(fs) * k))).save(d + '/sheet.png')
