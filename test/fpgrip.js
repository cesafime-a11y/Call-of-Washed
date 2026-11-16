// arma + manos en escena aislada con la misma matemática que VM.update; vistas: lateral derecha, atrás-arriba, frente
// node fpgrip.js id salida.png  (P='{"R":{...},"L":{...},"a":[..]}')
const { open } = require('./lib');
(async () => {
  const id = process.argv[2] || 'pistol'; const P = JSON.parse(process.env.P || '{}'); if (process.env.FP) P.FP = 1;
  const { browser, page, logs } = await open(undefined, { w: 1800, h: 720 });
  const data = await page.evaluate(([id, P]) => {
    const C = window.__COW, T = C.THREE;
    const r = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); r.setSize(P.FP ? 1280 : 1800, P.FP ? 720 : 520); r.outputColorSpace = T.SRGBColorSpace;
    const sc = new T.Scene(); sc.background = new T.Color(0x6a6d70);
    sc.add(new T.HemisphereLight(0xffffff, 0x555555, 1.5)); const d = new T.DirectionalLight(0xffffff, 2.0); d.position.set(2, 3, 2); sc.add(d);
    const rig = new T.Group(); sc.add(rig); const W = C.buildWeaponModel(id, true, null); rig.add(W); const U = W.userData;
    const glove = 0x7b7157, mat = new T.MeshLambertMaterial({ vertexColors: true });
    const mk = (sd) => new T.Mesh(C.gloveHandGeo(sd, glove, P.o || {}), mat);
    const hR = mk(1), hL = mk(-1); rig.add(hR, hL);
    const set = (h, c) => { h.position.set(c.p[0], c.p[1], c.p[2]); if (c.q) { const m = new T.Matrix4().makeBasis(new T.Vector3(...c.q[0]), new T.Vector3(...c.q[1]), new T.Vector3(...c.q[2])); h.quaternion.setFromRotationMatrix(m); h.quaternion.premultiply(new T.Quaternion().setFromEuler(new T.Euler(c.r[0], c.r[1], c.r[2], 'YXZ'))); } else h.rotation.set(c.r[0], c.r[1], c.r[2], 'YXZ'); };
    const gp = U.grip || { y: -0.035, z: 0.022, w: 0.034, tilt: 0 };
    set(hR, P.R || { p: [0.03, gp.y, gp.z], r: [gp.tilt, 0, 0] });
    if (U.fore) set(hL, P.L || { p: [U.fore.x - 0.03, U.fore.y - 0.03, U.fore.z], r: [-0.1, 0, 0.9] }); else hL.visible = false;
    const cam = new T.PerspectiveCamera(30, 1, 0.01, 10);
    const bb = new T.Box3().setFromObject(W), c = bb.getCenter(new T.Vector3()); const target = new T.Vector3(0, P.ty ?? 0.0, P.tz ?? -0.05), D = P.dist || 0.7;
    const views = [[1, 0.15, 0.1], [0.4, 1, 0.5], [-0.25, 0.3, -1]];
    r.setScissorTest(true);
    (P.FP ? [] : views).forEach((v, i) => { const cw = 300; r.setViewport(i * cw, 0, cw, 520); r.setScissor(i * cw, 0, cw, 520); cam.aspect = cw / 520; cam.position.copy(target).add(new T.Vector3(...v).normalize().multiplyScalar(D)); cam.lookAt(target); cam.updateProjectionMatrix(); r.render(sc, cam); });
    { const cw = P.FP ? 1280 : 900, x0 = P.FP ? 0 : 900, ch = P.FP ? 720 : 520; r.setViewport(x0, 0, cw, ch); r.setScissor(x0, 0, cw, ch); const fc = new T.PerspectiveCamera(54, cw / ch, 0.01, 10); const hip = P.hip || [0.15, -0.16, -0.36]; rig.position.set(...hip); rig.rotation.set(0, 0.035, -0.035); fc.position.set(0, 0, 0); fc.lookAt(0, 0, -1); r.render(sc, fc); }
    return r.domElement.toDataURL('image/png');
  }, [id, P]);
  require('fs').writeFileSync(process.argv[3] || 'fpgrip.png', Buffer.from(data.split(',')[1], 'base64'));
  console.log(logs.filter(l => !/GPU stall|ERR_FAILED/.test(l)).slice(0, 5).join('\n'));
  await browser.close();
})();
