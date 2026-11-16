// renderiza armas en una escena aislada: node gunview.js salida.png id1,id2,...
const { open } = require('./lib');
(async () => {
  const ids = (process.argv[3] || 'ar4').split(',');
  const { browser, page, logs } = await open(undefined, { w: 1200, h: 800 });
  await page.evaluate(() => { window.__COW_TEST = true; });
  const data = await page.evaluate(([ids, ZOOM, OFFZ]) => {
    const C = window.__COW, T = C.THREE;
    const r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(1200, 800); r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
    const sc = new T.Scene(); sc.background = new T.Color(0x3a3d40);
    sc.add(new T.HemisphereLight(0xdde6ff, 0x554433, 1.4)); const d = new T.DirectionalLight(0xfff0dd, 2.6); d.position.set(2, 3, 2); sc.add(d); const d2 = new T.DirectionalLight(0x88aaff, 1.0); d2.position.set(-3, 1, -2); sc.add(d2);
    const cam = new T.PerspectiveCamera(30, 1.5, 0.05, 20);
    const cols = Math.min(ids.length, 2), rows = Math.ceil(ids.length / cols);
    const out = [];
    ids.forEach((id, i) => {
      const g = C.buildWeaponModel(id, false, null); const w = new T.Group(); w.add(g); w.rotation.y = 0;
      sc.add(w); w.userData.i = i; out.push(w);
    });
    const dumpErr = [];
    r.setScissorTest(true);
    out.forEach((w, i) => {
      out.forEach((q) => q.visible = q === w);
      const cw = 1200 / cols, ch = 800 / rows, cx = (i % cols) * cw, cy = 800 - (Math.floor(i / cols) + 1) * ch;
      r.setViewport(cx, cy, cw, ch); r.setScissor(cx, cy, cw, ch); cam.aspect = cw / ch; const bb = new T.Box3().setFromObject(w), c = bb.getCenter(new T.Vector3()), sz = bb.getSize(new T.Vector3()); const asp = cw / ch, tf = Math.tan(15 * Math.PI / 180); const dist = Math.max(sz.z / (2 * tf * asp), sz.y / (2 * tf)) * ZOOM + sz.x * 0.5; cam.position.set(c.x + dist, c.y + dist * 0.08, c.z + dist * 0.12); cam.lookAt(c.x, c.y, c.z + OFFZ); cam.updateProjectionMatrix();
      r.render(sc, cam);
    });
    return r.domElement.toDataURL('image/png');
  }, [ids, +process.env.ZOOM || 1.25, +process.env.OFFZ || 0]);
  require('fs').writeFileSync(process.argv[2], Buffer.from(data.split(',')[1], 'base64'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
