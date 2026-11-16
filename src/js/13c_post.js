// ---- 13c_post.js ----
// =====================================================================
// POST-PROCESO (calidad Alta) y AMBIENTE
//   · escena a un buffer HDR con suavizado → brillo (bloom) en dos niveles,
//     gradación de color suave y viñeta; el mapeo de tonos lo hace el pase final
//   · motas de polvo flotando alrededor de la cámara (todas las calidades menos Baja)
// Sin addons de three: pases de pantalla completa propios.
// =====================================================================
const Post = {
  on: false, ok: null, rt: null, mips: null, quad: null, cam: null, scene: null, mats: null, size: [0, 0],
  support(r) {
    if (this.ok !== null) return this.ok;
    try { this.ok = !!(r.capabilities.isWebGL2 && (r.extensions.has('EXT_color_buffer_float') || r.extensions.has('EXT_color_buffer_half_float'))); } catch (e) { this.ok = false; }
    return this.ok;
  },
  enable(r, want) {
    const on = !!want && this.support(r);
    if (on === this.on) return;
    this.on = on;
    if (!on) this.dispose();
    else this.resize(r);
  },
  init() {
    if (this.quad) return;
    const vs = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
    const mk = (fs, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false, ...extra });
    this.mats = {
      // extrae lo brillante y reduce a la mitad
      bright: mk(`uniform sampler2D tex; uniform vec2 px; varying vec2 vUv;
        void main(){
          vec3 c = (texture2D(tex, vUv + px * vec2(-0.5, -0.5)).rgb + texture2D(tex, vUv + px * vec2(0.5, -0.5)).rgb + texture2D(tex, vUv + px * vec2(-0.5, 0.5)).rgb + texture2D(tex, vUv + px * vec2(0.5, 0.5)).rgb) * 0.25;
          float l = max(c.r, max(c.g, c.b));
          float k = smoothstep(0.85, 2.2, l);
          gl_FragColor = vec4(min(c, vec3(6.0)) * k, 1.0);
        }`, { tex: { value: null }, px: { value: new THREE.Vector2() } }),
      down: mk(`uniform sampler2D tex; uniform vec2 px; varying vec2 vUv;
        void main(){ gl_FragColor = vec4((texture2D(tex, vUv + px * vec2(-0.5, -0.5)).rgb + texture2D(tex, vUv + px * vec2(0.5, -0.5)).rgb + texture2D(tex, vUv + px * vec2(-0.5, 0.5)).rgb + texture2D(tex, vUv + px * vec2(0.5, 0.5)).rgb) * 0.25, 1.0); }`,
        { tex: { value: null }, px: { value: new THREE.Vector2() } }),
      blur: mk(`uniform sampler2D tex; uniform vec2 dir; varying vec2 vUv;
        void main(){
          vec3 c = texture2D(tex, vUv).rgb * 0.2270270270;
          c += (texture2D(tex, vUv + dir * 1.3846153846).rgb + texture2D(tex, vUv - dir * 1.3846153846).rgb) * 0.3162162162;
          c += (texture2D(tex, vUv + dir * 3.2307692308).rgb + texture2D(tex, vUv - dir * 3.2307692308).rgb) * 0.0702702703;
          gl_FragColor = vec4(c, 1.0);
        }`, { tex: { value: null }, dir: { value: new THREE.Vector2() } }),
      // oclusión ambiental en espacio de pantalla: normal estimada de la profundidad, 12 muestras en espiral a media resolución
      ao: mk(`uniform sampler2D depthTex; uniform mat4 projInv; uniform float p11; uniform float p00; uniform vec2 px; uniform float radius; varying vec2 vUv;
        vec3 vp(vec2 uv){ float d = texture2D(depthTex, uv).r; vec4 p = projInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
        float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
        void main(){
          float d0 = texture2D(depthTex, vUv).r;
          if (d0 >= 0.99999) { gl_FragColor = vec4(1.0); return; }
          vec3 P = vp(vUv);
          vec3 dx = vp(vUv + vec2(px.x, 0.0)) - P, dy = vp(vUv + vec2(0.0, px.y)) - P;
          vec3 dx2 = P - vp(vUv - vec2(px.x, 0.0)), dy2 = P - vp(vUv - vec2(0.0, px.y));
          if (abs(dx2.z) < abs(dx.z)) dx = dx2; if (abs(dy2.z) < abs(dy.z)) dy = dy2;
          vec3 N = normalize(cross(dx, dy)); if (N.z < 0.0) N = -N;
          float rp = min(radius * p11 * 0.5 / max(-P.z, 0.2), 0.1), asp = p11 / p00, occ = 0.0, rot = ign(gl_FragCoord.xy) * 6.2831;
          for (int i = 0; i < 12; i++) {
            float a = float(i) * 2.39996 + rot, r = sqrt((float(i) + 0.5) / 12.0);
            vec3 V = vp(vUv + vec2(cos(a), sin(a)) * r * vec2(rp / asp, rp)) - P;
            float len = length(V);
            occ += max(0.0, dot(N, V) / max(len, 1e-4) - 0.12) * (1.0 - smoothstep(radius * 0.6, radius * 1.5, len));
          }
          gl_FragColor = vec4(vec3(clamp(1.0 - occ / 12.0 * 2.2, 0.0, 1.0)), 1.0);
        }`, { depthTex: { value: null }, projInv: { value: new THREE.Matrix4() }, p11: { value: 1 }, p00: { value: 1 }, px: { value: new THREE.Vector2() }, radius: { value: 0.9 } }),
      aoBlur: mk(`uniform sampler2D tex; uniform sampler2D depthTex; uniform vec2 dir; uniform float near; uniform float far; varying vec2 vUv;
        float lz(vec2 uv){ float d = texture2D(depthTex, uv).r; return (near * far) / ((far - near) * d - far); }
        void main(){
          float z0 = lz(vUv), s = texture2D(tex, vUv).r, w = 1.0;
          for (int i = -3; i <= 3; i++) { if (i == 0) continue; vec2 uv = vUv + dir * float(i);
            float k = exp(-float(i * i) * 0.18) * (1.0 - smoothstep(0.05, 0.4, abs(lz(uv) - z0) / max(-z0, 0.5) * 8.0));
            s += texture2D(tex, uv).r * k; w += k; }
          gl_FragColor = vec4(vec3(s / w), 1.0);
        }`, { tex: { value: null }, depthTex: { value: null }, dir: { value: new THREE.Vector2() }, near: { value: 0.06 }, far: { value: 900 } }),
      // rayos de sol: se marchan 28 pasos hacia el sol sumando el cielo visible (profundidad = 1), a un cuarto de resolución
      rays: mk(`uniform sampler2D depthTex; uniform vec2 sun; varying vec2 vUv;
        float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
        void main(){
          vec2 d = sun - vUv; float dist = length(d * vec2(1.78, 1.0));
          vec2 st = d / 28.0 * 0.95, uv = vUv + st * ign(gl_FragCoord.xy);
          float acc = 0.0, w = 1.0;
          for (int i = 0; i < 28; i++) {
            uv += st;
            float sky = (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? 1.0 : step(0.99999, texture2D(depthTex, uv).r);
            acc += sky * w; w *= 0.97;
          }
          acc /= 18.0;
          gl_FragColor = vec4(vec3(acc * exp(-dist * dist * 1.6)), 1.0);
        }`, { depthTex: { value: null }, sun: { value: new THREE.Vector2(0.5, 0.5) } }),
      final: mk(`uniform sampler2D scene; uniform sampler2D b0; uniform sampler2D b1; uniform sampler2D aoTex; uniform float aoK; uniform float bloom; uniform float vig;
        uniform sampler2D rayTex; uniform float rayK; uniform vec3 rayCol; uniform float sat; uniform float con; uniform vec3 shT; uniform vec3 hiT; uniform float daze; varying vec2 vUv;
        void main(){
          vec3 s0 = texture2D(scene, vUv).rgb;
          // vista nublada (disparo en la cabeza): desenfoque barato de 4 tomas, más fuerte hacia los bordes; reemplaza al backdrop-filter de CSS, que cuesta mucho
          if (daze > 0.01) { vec2 q0 = vUv - 0.5; vec2 o = q0 * (0.004 + 0.016 * dot(q0, q0) * 4.0) * daze * 4.0; s0 = (s0 * 2.0 + texture2D(scene, vUv + o).rgb + texture2D(scene, vUv - o).rgb + texture2D(scene, vUv + o.yx * vec2(1.0, -1.0)).rgb + texture2D(scene, vUv - o.yx * vec2(1.0, -1.0)).rgb) / 6.0; }
          vec3 c = s0 * mix(1.0, texture2D(aoTex, vUv).r, aoK) + (texture2D(b0, vUv).rgb * 0.7 + texture2D(b1, vUv).rgb * 0.9) * bloom;
          c += rayCol * rayK * texture2D(rayTex, vUv).r;
          // gradación por ambiente: sombras y luces con su tinte, saturación y contraste
          float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
          c = mix(vec3(l), c, sat * (1.0 - daze * 0.5));
          c *= mix(shT, hiT, smoothstep(0.1, 1.4, l));
          c = max((c - 0.18) * con + 0.18, 0.0);
          vec2 q = vUv - 0.5; float v = 1.0 - (vig + daze * 0.3) * smoothstep(0.25, 0.85, dot(q, q) * 2.2);
          c *= v;
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`, { scene: { value: null }, b0: { value: null }, b1: { value: null }, aoTex: { value: null }, aoK: { value: 0 }, bloom: { value: 0.32 }, vig: { value: 0.32 }, rayTex: { value: null }, rayK: { value: 0 }, rayCol: { value: new THREE.Color(1, 0.85, 0.6) }, daze: { value: 0 }, sat: { value: 1.09 }, con: { value: 1 }, shT: { value: new THREE.Vector3(0.97, 1, 1.04) }, hiT: { value: new THREE.Vector3(1.04, 1, 0.95) } }),
    };
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mats.final); this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  },
  resize(r) {
    if (!this.on) return;
    this.init();
    const v = r.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(2, v.x | 0), h = Math.max(2, v.y | 0);
    if (this.rt && this.size[0] === w && this.size[1] === h && this.hasDepth === (!!(G.quality && G.quality.ssao) && this.aoOk !== false)) return;
    this.dispose(true); this.size = [w, h];
    const want = !!(G.quality && G.quality.ssao) && this.aoOk !== false;
    try {
      this.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, ...(want ? { depthTexture: new THREE.DepthTexture(w, h) } : {}) });
      this.hasDepth = want;
    } catch (e) {
      this.aoOk = false; this.hasDepth = false;
      this.rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    }
    if (this.hasDepth) { this.rayRT = new THREE.WebGLRenderTarget(Math.max(2, (w / 4) | 0), Math.max(2, (h / 4) | 0), { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); }
    if (this.hasDepth) { const mkA = () => new THREE.WebGLRenderTarget(Math.max(2, (w / 2) | 0), Math.max(2, (h / 2) | 0), { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }); this.aoA = mkA(); this.aoB = mkA(); }
    const mk = (d) => new THREE.WebGLRenderTarget(Math.max(2, (w / d) | 0), Math.max(2, (h / d) | 0), { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.mips = [mk(2), mk(4), mk(4), mk(8), mk(8)];   // [mitad, cuarto A, cuarto B, octavo A, octavo B]
  },
  dispose(keepOn) {
    if (this.rt) { if (this.rt.depthTexture) this.rt.depthTexture.dispose(); this.rt.dispose(); this.rt = null; }
    if (this.aoA) { this.aoA.dispose(); this.aoB.dispose(); this.aoA = this.aoB = null; }
    if (this.rayRT) { this.rayRT.dispose(); this.rayRT = null; }
    if (this.mips) { for (const m of this.mips) m.dispose(); this.mips = null; }
    this.size = [0, 0];
  },
  pass(r, mat, target) { this.quad.material = mat; r.setRenderTarget(target); r.render(this.scene, this.cam); },
  render(r, scene, camera) {
    this.resize(r);
    if (!this.rt) { r.render(scene, camera); return; }
    const M = this.mats, m = this.mips, [w, h] = this.size;
    r.setRenderTarget(this.rt); r.clear(); r.render(scene, camera);
    // brillo → mitad
    M.bright.uniforms.tex.value = this.rt.texture; M.bright.uniforms.px.value.set(1 / w, 1 / h); this.pass(r, M.bright, m[0]);
    // cuarto: reducir + desenfocar
    M.down.uniforms.tex.value = m[0].texture; M.down.uniforms.px.value.set(2 / w, 2 / h); this.pass(r, M.down, m[1]);
    const blur = (src, tmp, rt) => {
      const sw = rt.width, sh = rt.height;
      M.blur.uniforms.tex.value = src.texture; M.blur.uniforms.dir.value.set(1 / sw, 0); this.pass(r, M.blur, tmp);
      M.blur.uniforms.tex.value = tmp.texture; M.blur.uniforms.dir.value.set(0, 1 / sh); this.pass(r, M.blur, src);
    };
    blur(m[1], m[2], m[1]);
    // octavo
    M.down.uniforms.tex.value = m[1].texture; M.down.uniforms.px.value.set(4 / w, 4 / h); this.pass(r, M.down, m[3]);
    blur(m[3], m[4], m[3]); blur(m[3], m[4], m[3]);
    const F = M.final.uniforms; F.scene.value = this.rt.texture; F.b0.value = m[1].texture; F.b1.value = m[3].texture;
    if (this.hasDepth && this.aoA && this.rt.depthTexture) {
      const A = M.ao.uniforms, pm = camera.projectionMatrix.elements;
      A.depthTex.value = this.rt.depthTexture; A.projInv.value.copy(camera.projectionMatrixInverse); A.p11.value = pm[5]; A.p00.value = pm[0]; A.px.value.set(1 / w, 1 / h);
      this.pass(r, M.ao, this.aoA);
      const B = M.aoBlur.uniforms; B.depthTex.value = this.rt.depthTexture; B.near.value = camera.near; B.far.value = camera.far;
      B.tex.value = this.aoA.texture; B.dir.value.set(1 / this.aoA.width, 0); this.pass(r, M.aoBlur, this.aoB);
      B.tex.value = this.aoB.texture; B.dir.value.set(0, 1 / this.aoA.height); this.pass(r, M.aoBlur, this.aoA);
      F.aoTex.value = this.aoA.texture; F.aoK.value = 0.9;
    } else { F.aoTex.value = F.scene.value; F.aoK.value = 0; }
    // rayos de sol y gradación del ambiente actual
    const th = Env.th, g = (th && th.grade) || GRADE0; let rk = 0;
    F.sat.value = g.sat; F.con.value = g.con; F.shT.value.set(...g.sh); F.hiT.value.set(...g.hi);
    if (th && th.rays > 0 && this.rayRT && this.hasDepth && this.rt.depthTexture) {
      _v1.copy(G.sunDir).transformDirection(camera.matrixWorldInverse);
      if (_v1.z < -0.08) {
        _v2.copy(camera.position).addScaledVector(G.sunDir, 200).project(camera);
        M.rays.uniforms.sun.value.set(_v2.x * 0.5 + 0.5, _v2.y * 0.5 + 0.5); M.rays.uniforms.depthTex.value = this.rt.depthTexture;
        this.pass(r, M.rays, this.rayRT);
        F.rayTex.value = this.rayRT.texture; F.rayCol.value.set(th.sun).lerp(_c2.set(0xffffff), 0.25); rk = 0.5 * th.rays * clamp((-_v1.z - 0.08) / 0.42, 0, 1);
      }
    }
    F.daze.value = this.dazeK || 0; F.rayK.value = rk; if (!F.rayTex.value) F.rayTex.value = F.scene.value;
    this.pass(r, M.final, null);
  },
};

// ---------------- polvo ambiental ----------------
const Dust = {
  pts: null, n: 0, pos: null, seed: null,
  init(q) {
    this.dispose();
    const n = q.dust || 0; if (!n || !G.scene) return;
    this.n = n; this.pos = new Float32Array(n * 3); this.seed = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { this.seed[i * 3] = Math.random(); this.seed[i * 3 + 1] = Math.random(); this.seed[i * 3 + 2] = Math.random(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({ size: 0.075, map: smokeTexture(), color: 0xf2e2c4, transparent: true, opacity: 0.5, depthWrite: false, sizeAttenuation: true, fog: true });
    this.pts = new THREE.Points(geo, mat); this.pts.frustumCulled = false; this.pts.renderOrder = 5; this.pts.visible = !(typeof Env !== 'undefined' && Env.th && Env.th.rain);
    G.scene.add(this.pts);
  },
  dispose() { if (this.pts) { G.scene.remove(this.pts); this.pts.geometry.dispose(); this.pts.material.dispose(); this.pts = null; } },
  tint(th) { if (this.pts) this.pts.material.color.set(th.sun).lerp(_c2.set(0xffffff), 0.45); },
  update(dt, cam) {
    if (!this.pts) return;
    const R = 16, W = R * 2, t = G.realTime, p = this.pos, s = this.seed, cx = cam.position.x, cy = cam.position.y, cz = cam.position.z;
    const wr = (v, lo, sz) => lo + (((v - lo) % sz) + sz) % sz;
    for (let i = 0; i < this.n; i++) {
      const k = i * 3;
      // cada mota vive en un mosaico fijo del mundo que se repite alrededor de la cámara; el viento la arrastra
      p[k] = wr(s[k] * 97 + t * 0.55 + Math.sin(t * 0.3 + s[k + 2] * 20) * 0.6, cx - R, W);
      p[k + 2] = wr(s[k + 2] * 89 + t * 0.18 + Math.cos(t * 0.27 + s[k] * 20) * 0.6, cz - R, W);
      p[k + 1] = Math.max(0.12, wr(s[k + 1] * 53 - t * 0.05 + Math.sin(t * 0.4 + s[k] * 30) * 0.5, cy - 3, 9));
      // una mota pegada a la cámara se vería enorme: se esconde
      const dx = p[k] - cx, dy = p[k + 1] - cy, dz = p[k + 2] - cz;
      if (dx * dx + dy * dy + dz * dz < 2.5) p[k + 1] = -50;
    }
    this.pts.geometry.attributes.position.needsUpdate = true;
  },
};

