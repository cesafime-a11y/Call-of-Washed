// render de la mano en aislado: node handview.js salida.png
const { open } = require('./lib');
(async () => {
  const { browser, page, logs } = await open(undefined, { w: 1400, h: 700 });
  const data = await page.evaluate(() => {
    const C = window.__COW, T = C.THREE, VM = C.VM;
    if (!VM.inited) VM.init();
    VM.buildArms({ camo: 'woodland', skin: 0 });
    const r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(1400, 700); r.outputColorSpace = T.SRGBColorSpace;
    const sc = new T.Scene(); sc.background = new T.Color(0x6a6d70);
    sc.add(new T.HemisphereLight(0xffffff, 0x555555, 1.6)); const d = new T.DirectionalLight(0xffffff, 2.2); d.position.set(2, 3, 2); sc.add(d);
    const cam = new T.PerspectiveCamera(30, 2, 0.01, 10);
    const views = [[0.5, 0.25, 0.1, 0.0], [0.0, 0.5, 0.0, 0.0], [-0.5, 0.2, -0.1, 0], [0, 0.0, -0.5, 0]]; // posición cámara relativa
    const mk = (hand, sd) => { const g = new T.Group(); const m = hand.children[0].clone(); g.add(m); return g; };
    const out = [];
    r.setScissorTest(true);
    const hands = [VM.handR, VM.handL];
    const cams = [[0.45, 0.12, -0.05], [-0.45, 0.12, -0.05], [0.05, 0.5, -0.1], [0.0, 0.0, -0.5]];
    let k = 0;
    for (const h of hands) for (const cp of cams.slice(0, 4)) {
      const g = new T.Group(); const sleeveMesh = (h === VM.handR ? VM.armR : VM.armL).children[0]; g.add(h.children[0].clone()); g.add(sleeveMesh.clone());
      sc.add(g); out.push([g, cp]);
    }
    out.forEach(([g, cp], i) => {
      out.forEach(([q]) => q.visible = q === g);
      const cw = 350, ch = 350, cx = (i % 4) * cw, cy = 700 - (Math.floor(i / 4) + 1) * ch;
      r.setViewport(cx, cy, cw, ch); r.setScissor(cx, cy, cw, ch); cam.aspect = 1; cam.position.set(cp[0], cp[1], cp[2] + 0.02).multiplyScalar(1.0); cam.lookAt(0, 0, -0.02); cam.updateProjectionMatrix();
      r.render(sc, cam);
    });
    return r.domElement.toDataURL('image/png');
  });
  require('fs').writeFileSync(process.argv[2], Buffer.from(data.split(',')[1], 'base64'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 8).join('\n'));
  await browser.close();
})();
