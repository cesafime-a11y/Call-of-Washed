# Un archivo por misión: copia el juego y le añade una portada que abre directo esa misión.
# python3 tools/mission_files.py carpeta_destino
import sys, os, html
SRC = os.path.join(os.path.dirname(__file__), '..', 'dist', 'Call of Washed.html')
MIS = [('P1-M1', 'Once relojes'), ('P1-M2', 'Escape'), ('P1-M3', 'La mesa de tiro'),
       ('P1-M4', 'Cuarenta segundos'), ('P1-E5', 'El hombre de la cera'), ('P1-M6', 'Tiple')]
TPL = r'''
<div id="mstart" style="position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,#141410,#050504);font-family:Georgia,serif;color:#d9cfb8">
 <div style="text-align:center;max-width:560px;padding:24px">
  <div style="letter-spacing:.3em;font-size:12px;color:#b08d4a">CALL OF WASHED · WARTIME</div>
  <div style="margin-top:18px;font-size:13px;letter-spacing:.2em;color:#8f8672">PARTE I · CUERDA · __ID__</div>
  <div style="margin-top:8px;font-size:40px;color:#efe6cf">__TITLE__</div>
  <button id="mstartb" style="margin-top:34px;padding:12px 34px;font:inherit;font-size:16px;letter-spacing:.15em;color:#efe6cf;background:transparent;border:1px solid #b08d4a;cursor:pointer">EMPEZAR</button>
  <div style="margin-top:26px;font-size:13px;line-height:1.7;color:#8f8672">WASD para andar · ratón para mirar · mantén Q para fijarte · E o clic para usar · Esc para pausa</div>
  <div id="mstartw" style="margin-top:10px;font-size:12px;color:#6f6858">Cargando…</div>
 </div>
</div>
<script>
(function () {
  var ID = '__ID__', b = document.getElementById('mstartb'), w = document.getElementById('mstartw');
  var ready = function () { var C = window.__COW; return C && C.Campaign && C.UI && C.Scenes; };
  var t = setInterval(function () { if (ready()) { clearInterval(t); w.textContent = ''; } }, 200);
  b.onclick = function () {
    if (!ready()) { w.textContent = 'Un momento, aún carga…'; return; }
    var C = window.__COW; C.G.settings.goreChosen = true; try { C.UI.closeOverlay && C.UI.closeOverlay(); } catch (e) {}
    document.getElementById('mstart').remove(); C.Campaign.start(ID);
  };
})();
</script>
'''
out = sys.argv[1]; os.makedirs(out, exist_ok=True)
h = open(SRC, encoding='utf-8').read()
for i, (mid, title) in enumerate(MIS, 1):
    inj = TPL.replace('__ID__', mid).replace('__TITLE__', html.escape(title))
    k = h.rfind('</body>')
    page = h[:k] + inj + h[k:] if k >= 0 else h + inj
    fn = os.path.join(out, 'CoW Parte I - %d %s.html' % (i, title))
    open(fn, 'w', encoding='utf-8').write(page)
    print(fn)
