// Car Clash Arena weapon models v2: forward +z, base at y=0. Each build merges its parts per material.
(function () {
  let M = null;
  function mats(T) {
    if (M) return M;
    const N = 256, mk = () => { const c = document.createElement('canvas'); c.width = c.height = N; return c; }, R = Math.random;
    const cC = mk(), cR = mk(), cH = mk(), x = cC.getContext('2d'), r = cR.getContext('2d'), h = cH.getContext('2d');
    x.fillStyle = '#e4e4e4'; x.fillRect(0, 0, N, N); r.fillStyle = '#d6d6d6'; r.fillRect(0, 0, N, N);
    for (let i = 0; i < 5000; i++) { const px = R() * N, py = R() * N, s = 1 + R() * 2, d = R() < 0.5; x.fillStyle = d ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.08)'; x.fillRect(px, py, s, s); r.fillStyle = d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'; r.fillRect(px, py, s, s); }
    for (let i = 0; i < 24; i++) { const px = R() * N, py = R() * N, rad = 10 + R() * 42; for (const [c, col, a] of [[x, '46,38,30', 0.3], [r, '255,255,255', 0.3]]) { const g = c.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); c.fillStyle = g; c.fillRect(px - rad, py - rad, rad * 2, rad * 2); } }
    for (let i = 0; i < 70; i++) { const px = R() * N, py = R() * N, a = R() * Math.PI, l = 6 + R() * 28, w = 0.6 + R(); x.strokeStyle = 'rgba(255,255,255,0.4)'; r.strokeStyle = 'rgba(0,0,0,0.4)'; for (const c of [x, r]) { c.lineWidth = w; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); c.stroke(); } }
    h.fillStyle = '#d9a514'; h.fillRect(0, 0, N, N); h.fillStyle = '#151515'; for (let i = -N; i < N * 2; i += 64) { h.beginPath(); h.moveTo(i, 0); h.lineTo(i + 32, 0); h.lineTo(i + 32 - N, N); h.lineTo(i - N, N); h.closePath(); h.fill(); } h.globalCompositeOperation = 'multiply'; h.drawImage(cC, 0, 0);
    const tx = (c, srgb) => { const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; if (srgb) t.encoding = T.sRGBEncoding; return t; };
    const tC = tx(cC, 1), tR = tx(cR, 0), tH = tx(cH, 1), S = (c, mt, ro, o) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: mt, roughness: ro }, o || {})), Wr = () => ({ map: tC, roughnessMap: tR }), B = c => new T.MeshBasicMaterial({ color: c });
    M = { gun: S(0x33373c, 0.85, 0.72, Wr()), dark: S(0x1b1d20, 0.8, 0.8, Wr()), armor: S(0x464a4e, 0.6, 0.85, Wr()), olive: S(0x58603a, 0.3, 0.95, Wr()), red: S(0x9c1712, 0.35, 0.7, Wr()),
      steel: S(0xbcc3ca, 1, 0.42, { roughnessMap: tR }), chrome: S(0xeef2f5, 1, 0.12), brass: S(0xcf9f4a, 1, 0.32), copper: S(0xc0703f, 1, 0.34), rubber: S(0x0e0f10, 0, 0.9),
      soot: S(0x0a0a0a, 0.2, 0.95), hazard: S(0xffffff, 0.3, 0.8, { map: tH, roughnessMap: tR }), white: S(0xe6e9ec, 0.2, 0.62, Wr()), frost: S(0xeaf7ff, 0, 0.8, { emissive: 0x0b1a24 }),
      glass: S(0x0b1117, 0.9, 0.06), oil: S(0x050505, 0.3, 0.06), dish: S(0xa1a8af, 0.85, 0.55, Object.assign({ side: T.DoubleSide }, Wr())),
      glowR: B(0xff2a1a), glowB: B(0x62d8ff), glowO: B(0xff7a1a), glowW: B(0xfff2d8) };
    return M;
  }
  function K(T, g) {
    const m = mats(T), V = a => new T.Vector3(a[0], a[1], a[2]), up = new T.Vector3(0, 1, 0);
    const add = (geo, mat, x, y, z, ax) => { const o = new T.Mesh(geo, mat); if (ax === 'z') o.rotation.x = Math.PI / 2; else if (ax === 'x') o.rotation.z = Math.PI / 2; o.position.set(x, y, z); g.add(o); return o; };
    const ext = (s, d, b) => { const geo = new T.ExtrudeGeometry(s, { depth: Math.max(0.001, d - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 2 }); geo.translate(0, 0, -(d - 2 * b) / 2); return geo; };
    const k = { m, g, add,
      cyl: (rt, rb, h, mat, x, y, z, ax, sg) => add(new T.CylinderGeometry(rt, rb, h, sg || 18), mat, x, y, z, ax),
      box: (sx, sy, sz, mat, x, y, z) => add(new T.BoxGeometry(sx, sy, sz), mat, x, y, z),
      bx: (sx, sy, sz, mat, x, y, z, b) => { b = b || Math.min(sx, sy, sz) * 0.12; const s = new T.Shape(), hx = sx / 2 - b, hy = sy / 2 - b; s.moveTo(-hx, -hy); s.lineTo(hx, -hy); s.lineTo(hx, hy); s.lineTo(-hx, hy); s.closePath(); return add(ext(s, sz, b), mat, x, y, z); },
      ex: (pts, d, mat, b) => { const s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1])); s.closePath(); return add(ext(s, d, b || 0), mat, 0, 0, 0); },
      tor: (r, t, mat, x, y, z, flat, arc) => { const o = add(new T.TorusGeometry(r, t, 8, 32, arc || Math.PI * 2), mat, x, y, z); if (flat) o.rotation.x = Math.PI / 2; return o; },
      sph: (r, mat, x, y, z) => add(new T.SphereGeometry(r, r > 0.1 ? 20 : 12, r > 0.1 ? 14 : 8), mat, x, y, z),
      cone: (r, h, mat, x, y, z, ax, sg) => add(new T.ConeGeometry(r, h, sg || 16), mat, x, y, z, ax),
      rod: (a, b, r, mat, sg) => { const p = V(a), q = V(b), d = q.clone().sub(p), o = add(new T.CylinderGeometry(r, r, d.length(), sg || 10), mat, 0, 0, 0); o.position.copy(p).add(q).multiplyScalar(0.5); o.quaternion.setFromUnitVectors(up, d.normalize()); return o; },
      spike: (x, y, z, dir, l, r, mat) => { const d = V(dir).normalize(), o = add(new T.ConeGeometry(r, l, 10), mat || m.steel, 0, 0, 0); o.quaternion.setFromUnitVectors(up, d); o.position.set(x, y, z).addScaledVector(d, l / 2); return o; },
      hose: (pts, r, mat, sg) => add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(V)), sg || 24, r, 8, false), mat || m.rubber, 0, 0, 0),
      bolt: (x, y, z, ax, r) => k.cyl(r || 0.026, r || 0.026, (r || 0.026) * 0.9, m.steel, x, y, z, ax, 6),
      brake: (r, l, x, y, z) => { k.bx(r * 2, r * 1.55, l, m.gun, x, y, z, r * 0.12); for (let i = 0; i < 3; i++) k.box(r * 2.06, r * 0.85, l * 0.15, m.soot, x, y, z - l * 0.28 + i * l * 0.26); k.cyl(r * 0.5, r * 0.5, 0.012, m.soot, x, y, z + l / 2 + 0.002, 'z', 14); },
      fins: (r, t, n, st, mat, x, y, z) => { for (let i = 0; i < n; i++) k.cyl(r, r, t, mat, x, y, z + i * st, 'z', 24); },
      belt: (pts, n, r) => { const cv = new T.CatmullRomCurve3(pts.map(V)); for (let i = 0; i < n; i++) { const p = cv.getPoint(i / (n - 1)); k.cyl(r, r, r * 5, m.brass, p.x, p.y, p.z, 'z', 10); k.cone(r * 0.85, r * 2.2, m.copper, p.x, p.y, p.z + r * 3.6, 'z', 10); k.box(r * 2.4, r * 0.8, r * 1.2, m.dark, p.x, p.y, p.z - r * 1.2); } },
      spin: (x, y, z, axis) => { const s = new T.Group(); s.name = 'spin'; s.userData.axis = axis; s.position.set(x, y, z); g.add(s); return K(T, s); },
      sub: (x, y, z, rx, ry) => { const s = new T.Group(); s.position.set(x, y, z); s.rotation.set(rx || 0, ry || 0, 0); g.add(s); return K(T, s); },
      mount: (h, wx) => { wx = wx || 0.21;
        k.bx(0.72, 0.07, 0.8, m.dark, 0, 0.035, 0, 0.014); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.bolt(sx * 0.3, 0.078, sz * 0.34);
        k.cyl(0.27, 0.32, 0.1, m.gun, 0, 0.12, 0, null, 28); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; k.bolt(Math.cos(a) * 0.235, 0.177, Math.sin(a) * 0.235, null, 0.02); }
        for (const sx of [-1, 1]) { const p = k.ex([[-0.17, 0], [0.17, 0], [0.1, h], [-0.1, h]], 0.05, m.armor, 0.008); p.rotation.y = Math.PI / 2; p.position.set(sx * wx, 0.17, 0); k.cyl(0.065, 0.065, 0.05, m.steel, sx * (wx + 0.035), 0.11 + h, 0, 'x', 14); k.bolt(sx * (wx + 0.062), 0.11 + h, 0, 'x', 0.022); }
        k.rod([0, 0.18, -0.22], [0, 0.1 + h, -0.05], 0.03, m.steel); } };
    return k;
  }
  function bake(T, g) {
    const sp = g.children.filter(o => o.name === 'spin'); sp.forEach(o => g.remove(o));
    g.updateMatrixWorld(true); const by = new Map();
    g.traverse(o => { if (!o.isMesh) return; const s = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); s.applyMatrix4(o.matrixWorld); if (!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(s); o.geometry.dispose(); });
    const out = new T.Group();
    by.forEach((list, mat) => { let n = 0; for (const s of list) n += s.attributes.position.count; const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
      for (const s of list) { const c = s.attributes.position.count; P.set(s.attributes.position.array, o * 3); Nn.set(s.attributes.normal.array, o * 3); if (s.attributes.uv) U.set(s.attributes.uv.array, o * 2); o += c; s.dispose(); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(Nn, 3)); geo.setAttribute('uv', new T.BufferAttribute(U, 2)); geo.computeBoundingSphere(); geo.computeBoundingBox();
      const me = new T.Mesh(geo, mat); me.castShadow = !mat.isMeshBasicMaterial; me.receiveShadow = true; out.add(me); });
    for (const o of sp) { const p = new T.Group(); p.name = 'spin'; p.userData.axis = o.userData.axis; p.position.copy(o.position); const inner = new T.Group(); while (o.children.length) inner.add(o.children[0]); const b = bake(T, inner); while (b.children.length) p.add(b.children[0]); out.add(p); }
    return out;
  }
  const W = (key, name, role, fn) => ({ key, name, role, build(T) { const g = new T.Group(), k = K(T, g); fn(k, k.m, T); return bake(T, g); } });
  const list = [
    W('rocketpod', 'Twin rocket pod', 'Rocket', (k, m) => { k.mount(0.34, 0.17);
      k.bx(0.3, 0.24, 0.62, m.gun, 0, 0.58, -0.08, 0.03); k.bx(0.16, 0.12, 0.26, m.dark, 0, 0.76, 0.12, 0.02); k.cyl(0.06, 0.06, 0.02, m.glass, 0, 0.76, 0.25, 'z', 16); k.cyl(0.04, 0.04, 0.02, m.glowR, 0, 0.76, 0.258, 'z', 14); k.box(0.05, 0.1, 0.4, m.dark, 0, 0.44, 0.25);
      for (const sx of [-1, 1]) { const x = sx * 0.33;
        k.cyl(0.2, 0.2, 1.5, m.olive, x, 0.58, 0.08, 'z', 28); for (const z of [-0.52, 0.02, 0.56]) { k.cyl(0.218, 0.218, 0.07, m.dark, x, 0.58, z, 'z', 28); k.bolt(x + sx * 0.225, 0.58, z, 'x', 0.022); }
        k.cyl(0.212, 0.212, 0.1, m.hazard, x, 0.58, 0.72, 'z', 28); k.tor(0.19, 0.03, m.soot, x, 0.58, 0.83); k.cyl(0.17, 0.17, 0.02, m.soot, x, 0.58, 0.8, 'z', 20);
        k.cyl(0.12, 0.12, 0.06, m.steel, x, 0.58, 0.76, 'z', 18); k.cone(0.12, 0.24, m.red, x, 0.58, 0.9, 'z', 18);
        k.cyl(0.13, 0.2, 0.18, m.dark, x, 0.58, -0.76, 'z', 24); k.cyl(0.11, 0.11, 0.02, m.soot, x, 0.58, -0.86, 'z', 18);
        k.hose([[sx * 0.15, 0.5, -0.3], [sx * 0.22, 0.42, -0.42], [x, 0.4, -0.55]], 0.022); } }),
    W('missilerack', 'Six-cell missile rack', 'Rocket', (k, m) => { k.mount(0.3, 0.3); const s = k.sub(0, 0.66, 0, -0.2);
      s.bx(1.0, 0.64, 1.36, m.armor, 0, 0, 0, 0.045); s.box(0.88, 0.52, 0.04, m.soot, 0, 0, 0.67);
      for (const x of [-0.29, 0, 0.29]) for (const y of [-0.13, 0.13]) { s.cyl(0.115, 0.115, 0.05, m.dark, x, y, 0.675, 'z', 18); s.cyl(0.086, 0.086, 0.06, m.white, x, y, 0.66, 'z', 16); s.cone(0.085, 0.2, m.red, x, y, 0.76, 'z', 16); }
      for (const sx of [-1, 1]) { s.box(0.012, 0.12, 1.1, m.hazard, sx * 0.503, -0.2, 0); for (const z of [-0.45, 0, 0.45]) s.bolt(sx * 0.505, 0.2, z, 'x', 0.024); }
      for (const z of [-0.36, 0, 0.36]) s.box(1.02, 0.04, 0.07, m.dark, 0, 0.33, z);
      s.box(0.8, 0.44, 0.03, m.dark, 0, 0, -0.685); for (let i = 0; i < 5; i++) s.box(0.78, 0.025, 0.035, m.soot, 0, -0.16 + i * 0.08, -0.7);
      s.bx(0.22, 0.12, 0.3, m.dark, 0.3, 0.38, -0.3, 0.02); s.cyl(0.035, 0.035, 0.02, m.glowR, 0.3, 0.38, -0.14, 'z', 12); }),
    W('minigun', 'Rotary minigun', 'New: rapid fire', (k, m) => { k.mount(0.32, 0.22);
      k.bx(0.4, 0.36, 0.62, m.gun, 0, 0.56, -0.4, 0.035); k.cyl(0.14, 0.14, 0.22, m.dark, 0, 0.56, -0.8, 'z', 20); for (let i = 0; i < 4; i++) k.box(0.42, 0.02, 0.03, m.dark, 0, 0.75, -0.6 + i * 0.1);
      k.cyl(0.2, 0.17, 0.22, m.gun, 0, 0.56, -0.02, 'z', 24); const bs = k.spin(0, 0.56, 0, 'z'); bs.cyl(0.05, 0.05, 1.3, m.steel, 0, 0, 0.62, 'z', 10);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, bx = Math.cos(a) * 0.105, by = Math.sin(a) * 0.105; bs.cyl(0.036, 0.036, 1.38, m.gun, bx, by, 0.62, 'z', 10); bs.cyl(0.038, 0.038, 0.08, m.soot, bx, by, 1.28, 'z', 10); }
      for (const z of [0.12, 0.62, 1.12]) bs.cyl(0.165, 0.165, 0.06, m.dark, 0, 0, z, 'z', 24);
      k.cyl(0.3, 0.3, 0.34, m.olive, 0.5, 0.44, -0.38, 'x', 30); for (const dx of [-0.17, 0.17]) k.cyl(0.31, 0.31, 0.03, m.dark, 0.5 + dx, 0.44, -0.38, 'x', 30); k.cyl(0.302, 0.302, 0.1, m.hazard, 0.5, 0.44, -0.38, 'x', 30); k.bolt(0.685, 0.44, -0.38, 'x', 0.045);
      k.belt([[0.46, 0.76, -0.3], [0.36, 0.84, -0.3], [0.24, 0.74, -0.3]], 8, 0.026);
      k.box(0.07, 0.07, 0.34, m.dark, 0, 0.36, 0.3); k.cyl(0.022, 0.022, 0.012, m.glowR, 0, 0.36, 0.475, 'z', 10);
      for (const sx of [-1, 1]) k.hose([[sx * 0.12, 0.5, -0.7], [sx * 0.2, 0.36, -0.55], [sx * 0.16, 0.3, -0.3]], 0.02); }),
    W('cannon', 'Heavy cannon', 'New: big knockback', (k, m) => { k.mount(0.34, 0.27);
      k.bx(0.5, 0.46, 0.7, m.armor, 0, 0.56, -0.4, 0.05); k.box(0.3, 0.012, 0.3, m.hazard, 0, 0.795, -0.5); k.bx(0.58, 0.52, 0.12, m.dark, 0, 0.56, -0.02, 0.03);
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) k.bolt(sx * 0.22, 0.56 + sy * 0.19, 0.045, 'z', 0.026);
      k.cyl(0.1, 0.13, 1.45, m.gun, 0, 0.56, 0.75, 'z', 22); k.cyl(0.155, 0.155, 0.32, m.gun, 0, 0.56, 0.72, 'z', 22); k.cyl(0.155, 0.125, 0.05, m.gun, 0, 0.56, 0.535, 'z', 22); k.cyl(0.125, 0.155, 0.05, m.gun, 0, 0.56, 0.905, 'z', 22);
      k.brake(0.15, 0.34, 0, 0.56, 1.56);
      for (const sx of [-1, 1]) { k.cyl(0.05, 0.05, 0.62, m.chrome, sx * 0.17, 0.77, 0.14, 'z', 12); k.cyl(0.068, 0.068, 0.3, m.dark, sx * 0.17, 0.77, -0.12, 'z', 12); } }),
    W('flamer', 'Flamethrower', 'New: short-range burn', (k, m) => { k.mount(0.3, 0.12);
      for (const sx of [-1, 1]) { const x = sx * 0.25; k.cyl(0.2, 0.2, 0.7, m.red, x, 0.56, -0.38, 'z', 26); k.sph(0.2, m.red, x, 0.56, -0.03); k.sph(0.2, m.red, x, 0.56, -0.73);
        for (const z of [-0.6, -0.16]) k.cyl(0.207, 0.207, 0.05, m.dark, x, 0.56, z, 'z', 26); k.cyl(0.204, 0.204, 0.13, m.hazard, x, 0.56, -0.38, 'z', 26);
        k.cyl(0.04, 0.04, 0.1, m.brass, x, 0.79, -0.5, null, 10); k.cyl(0.06, 0.06, 0.025, m.red, x, 0.85, -0.5, null, 6);
        k.hose([[x, 0.6, 0.12], [x * 0.7, 0.66, 0.24], [sx * 0.05, 0.6, 0.34]], 0.032); }
      k.box(0.56, 0.05, 0.08, m.steel, 0, 0.79, -0.38); k.cyl(0.08, 0.08, 0.035, m.dark, 0, 0.805, -0.2, null, 18); k.cyl(0.07, 0.07, 0.01, m.white, 0, 0.826, -0.2, null, 18);
      k.cyl(0.06, 0.06, 1.0, m.gun, 0, 0.56, 0.65, 'z', 16); k.fins(0.12, 0.014, 7, 0.065, m.dark, 0, 0.56, 0.38);
      k.cyl(0.13, 0.085, 0.24, m.gun, 0, 0.56, 1.12, 'z', 18); k.cyl(0.11, 0.11, 0.012, m.soot, 0, 0.56, 1.245, 'z', 18); k.tor(0.12, 0.018, m.soot, 0, 0.56, 1.24);
      k.cyl(0.016, 0.016, 0.66, m.brass, 0, 0.44, 0.9, 'z', 6); k.cone(0.03, 0.08, m.glowB, 0, 0.44, 1.26, 'z', 10); k.sph(0.022, m.glowO, 0, 0.44, 1.3); }),
    W('tesla', 'Tesla shock coil', 'Shockwave', (k, m) => {
      k.cyl(0.46, 0.52, 0.16, m.armor, 0, 0.08, 0, null, 6); k.cyl(0.47, 0.47, 0.03, m.hazard, 0, 0.175, 0, null, 6); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + Math.PI / 6; k.bolt(Math.cos(a) * 0.38, 0.2, Math.sin(a) * 0.38); }
      for (let i = 0; i < 5; i++) k.cyl(i % 2 ? 0.12 : 0.19, i % 2 ? 0.12 : 0.19, 0.05, m.white, 0, 0.215 + i * 0.05, 0, null, 22);
      k.cyl(0.13, 0.13, 0.64, m.dark, 0, 0.76, 0, null, 20); for (let i = 0; i < 12; i++) k.tor(0.138, 0.016, m.copper, 0, 0.48 + i * 0.05, 0, true);
      k.tor(0.3, 0.1, m.chrome, 0, 1.13, 0, true); k.sph(0.12, m.chrome, 0, 1.18, 0);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); k.spike(c * 0.38, 1.13, s * 0.38, [c, 0.15, s], 0.2, 0.035, m.steel); k.sph(0.028, m.glowB, c * 0.585, 1.16, s * 0.585); }
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5, x = Math.cos(a) * 0.36, z = Math.sin(a) * 0.36; k.cyl(0.035, 0.045, 0.46, m.gun, x, 0.4, z, null, 10); k.sph(0.06, m.glowB, x, 0.66, z); k.hose([[x * 0.95, 0.24, z * 0.95], [x * 0.6, 0.3, z * 0.6], [x * 0.38, 0.5, z * 0.38]], 0.018); } }),
    W('minerack', 'Spiked mine dropper', 'Mine', (k, m) => {
      k.bx(0.96, 0.06, 1.38, m.dark, 0, 0.03, -0.1, 0.015);
      for (const sx of [-1, 1]) { k.bx(0.06, 0.36, 1.38, m.armor, sx * 0.45, 0.21, -0.1, 0.015); k.box(0.012, 0.12, 1.2, m.hazard, sx * 0.483, 0.24, -0.1); for (const z of [-0.6, 0, 0.45]) k.bolt(sx * 0.484, 0.36, z, 'x', 0.022); }
      k.bx(0.96, 0.36, 0.06, m.armor, 0, 0.21, 0.56, 0.015);
      const ch = k.box(0.86, 0.035, 0.44, m.steel, 0, 0.12, -0.92); ch.rotation.x = 0.4; for (const sx of [-1, 1]) { const rl = k.box(0.03, 0.12, 0.44, m.dark, sx * 0.43, 0.16, -0.92); rl.rotation.x = 0.4; }
      for (const z of [0.22, -0.42]) { const b = k.sph(0.25, m.olive, 0, 0.27, z); b.scale.y = 0.55; k.cyl(0.255, 0.255, 0.05, m.dark, 0, 0.27, z, null, 28); k.cyl(0.075, 0.075, 0.07, m.gun, 0, 0.4, z, null, 14); k.sph(0.036, m.glowR, 0, 0.445, z);
        for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); k.spike(c * 0.2, 0.31, z + s * 0.2, [c, 0.55, s], 0.13, 0.03, m.steel); } } }),
    W('railgun', 'Railgun', 'New: piercing shot', (k, m) => { k.mount(0.34, 0.25);
      k.bx(0.56, 0.42, 0.64, m.armor, 0, 0.56, -0.46, 0.045); for (let i = 0; i < 6; i++) k.box(0.42, 0.06, 0.022, m.dark, 0, 0.8, -0.7 + i * 0.09);
      for (const sx of [-1, 1]) { k.cyl(0.09, 0.09, 0.56, m.dark, sx * 0.37, 0.48, -0.46, 'z', 18); for (const z of [-0.66, -0.46, -0.26]) k.cyl(0.094, 0.094, 0.04, m.copper, sx * 0.37, 0.48, z, 'z', 18); k.cyl(0.06, 0.06, 0.012, m.glowB, sx * 0.37, 0.48, -0.175, 'z', 14);
        k.bx(0.08, 0.17, 2.0, m.steel, sx * 0.115, 0.56, 0.82, 0.015); k.box(0.084, 0.12, 0.1, m.soot, sx * 0.115, 0.56, 1.78);
        k.hose([[sx * 0.37, 0.48, -0.17], [sx * 0.3, 0.5, -0.02], [sx * 0.2, 0.5, 0.06]], 0.024); }
      k.box(0.05, 0.045, 1.95, m.glowB, 0, 0.56, 0.8);
      for (const z of [0.05, 0.5, 0.95, 1.4]) { k.bx(0.42, 0.07, 0.09, m.gun, 0, 0.68, z, 0.012); k.bx(0.42, 0.07, 0.09, m.gun, 0, 0.44, z, 0.012); for (const sx of [-1, 1]) k.box(0.05, 0.3, 0.09, m.gun, sx * 0.19, 0.56, z); } }),
    W('mortar', 'Heavy mortar', 'New: lobbed shell', (k, m) => {
      k.cyl(0.5, 0.56, 0.08, m.dark, 0, 0.04, -0.2, null, 28); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; k.bolt(Math.cos(a) * 0.46, 0.09, -0.2 + Math.sin(a) * 0.46); }
      k.cyl(0.32, 0.36, 0.1, m.gun, 0, 0.13, -0.2, null, 24);
      const s = k.sub(0, 0.22, -0.2, -0.95); s.sph(0.2, m.gun, 0, 0, 0); s.cyl(0.18, 0.18, 1.15, m.olive, 0, 0, 0.6, 'z', 26); s.cyl(0.205, 0.205, 0.1, m.dark, 0, 0, 1.13, 'z', 26); s.tor(0.17, 0.03, m.soot, 0, 0, 1.18); s.cyl(0.15, 0.15, 0.02, m.soot, 0, 0, 1.175, 'z', 20);
      s.cyl(0.19, 0.19, 0.07, m.dark, 0, 0, 0.42, 'z', 26); s.cyl(0.183, 0.183, 0.09, m.hazard, 0, 0, 0.75, 'z', 26); s.bx(0.08, 0.12, 0.2, m.dark, 0.2, 0, 0.5, 0.015);
      for (const sx of [-1, 1]) { k.rod([sx * 0.3, 0.14, 0.15], [sx * 0.15, 0.62, 0.15], 0.035, m.gun); k.rod([sx * 0.24, 0.3, 0.15], [sx * 0.13, 0.76, 0.24], 0.02, m.chrome); }
      for (let i = 0; i < 3; i++) { const z = -0.62 + i * 0.16; k.cyl(0.065, 0.065, 0.26, m.olive, 0.38, 0.24, z, null, 14); k.cone(0.065, 0.13, m.dark, 0.38, 0.435, z, null, 14); k.cyl(0.067, 0.067, 0.03, m.hazard, 0.38, 0.32, z, null, 14); }
      k.bx(0.16, 0.12, 0.56, m.dark, 0.38, 0.06, -0.46, 0.015); }),
    W('freeze', 'Cryo blaster', 'New: slows target', (k, m) => { k.mount(0.32, 0.2);
      k.cyl(0.27, 0.27, 0.46, m.white, 0, 0.56, -0.44, 'z', 26); k.sph(0.27, m.white, 0, 0.56, -0.67); k.sph(0.27, m.white, 0, 0.56, -0.21);
      for (const z of [-0.58, -0.3]) k.cyl(0.276, 0.276, 0.04, m.dark, 0, 0.56, z, 'z', 26); k.cyl(0.273, 0.273, 0.1, m.hazard, 0, 0.56, -0.44, 'z', 26);
      for (const [x, y, z, r] of [[0.16, 0.76, -0.5, 0.09], [-0.2, 0.69, -0.35, 0.07], [0.22, 0.42, -0.62, 0.08]]) { const f = k.sph(r, m.frost, x, y, z); f.scale.set(1, 0.45, 1.3); }
      k.cyl(0.05, 0.05, 0.08, m.brass, 0.15, 0.82, -0.3, null, 10); k.cyl(0.07, 0.07, 0.03, m.white, 0.15, 0.87, -0.3, null, 16);
      k.cyl(0.085, 0.085, 0.92, m.gun, 0, 0.56, 0.46, 'z', 16); for (let i = 0; i < 5; i++) k.cyl(0.15, 0.15, 0.03, m.dark, 0, 0.56, 0.12 + i * 0.13, 'z', 22);
      const hp = []; for (let i = 0; i <= 48; i++) { const t = i / 48, a = t * Math.PI * 10; hp.push([Math.cos(a) * 0.125, 0.56 + Math.sin(a) * 0.125, 0.08 + t * 0.62]); } k.hose(hp, 0.016, m.copper, 160);
      k.cyl(0.22, 0.1, 0.3, m.white, 0, 0.56, 1.02, 'z', 26); k.cyl(0.18, 0.18, 0.015, m.glowB, 0, 0.56, 1.17, 'z', 24); k.tor(0.2, 0.028, m.frost, 0, 0.56, 1.17);
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); k.spike(c * 0.2, 0.56 + s * 0.2, 1.12, [c * 0.3, s * 0.3, 1], 0.09, 0.022, m.frost); } }),
    W('saw', 'Buzzsaw arm', 'New: shreds on contact', (k, m, T) => { k.mount(0.2, 0.18);
      k.bx(0.4, 0.3, 0.52, m.armor, 0, 0.44, -0.42, 0.04); for (let i = 0; i < 5; i++) k.box(0.42, 0.022, 0.03, m.dark, 0, 0.6, -0.6 + i * 0.09); k.cyl(0.11, 0.11, 0.16, m.dark, 0, 0.44, -0.74, 'z', 18);
      k.bx(0.14, 0.09, 0.82, m.gun, 0, 0.5, 0.12, 0.02); k.cyl(0.03, 0.03, 0.5, m.chrome, 0.1, 0.55, 0.08, 'z', 10); k.cyl(0.048, 0.048, 0.3, m.dark, 0.1, 0.55, -0.24, 'z', 12);
      const R = 0.55, n = 26, st = Math.PI * 2 / n, pts = []; for (let i = 0; i < n; i++) { const a = i * st; pts.push([Math.cos(a) * R * 0.84, Math.sin(a) * R * 0.84], [Math.cos(a + st * 0.62) * R, Math.sin(a + st * 0.62) * R], [Math.cos(a + st * 0.7) * R * 0.95, Math.sin(a + st * 0.7) * R * 0.95]); }
      const sw = k.spin(0, 0.58, 0.62, 'y'), bl = sw.ex(pts, 0.022, m.steel, 0); bl.rotation.x = -Math.PI / 2;
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3; sw.cyl(0.035, 0.035, 0.024, m.soot, Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3, null, 12); }
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.93, e = sw.box(0.2, 0.026, 0.012, m.soot, Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36); e.rotation.y = -a; }
      sw.cyl(0.13, 0.13, 0.06, m.dark, 0, 0, 0, null, 18); sw.cyl(0.06, 0.06, 0.08, m.red, 0, 0.02, 0, null, 12); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; sw.bolt(Math.cos(a) * 0.095, 0.035, Math.sin(a) * 0.095); }
      k.add(new T.CylinderGeometry(0.6, 0.6, 0.02, 26, 1, false, Math.PI / 2, Math.PI), m.armor, 0, 0.64, 0.62); const gd = k.tor(0.6, 0.03, m.hazard, 0, 0.62, 0.62, false, Math.PI); gd.rotation.x = -Math.PI / 2; }),
    W('magnet', 'Electromagnet crane', 'New: pulls cars toward you', (k, m) => { k.mount(0.2, 0.12);
      k.cyl(0.09, 0.12, 0.62, m.gun, 0, 0.5, -0.36, null, 14); k.bx(0.15, 0.15, 1.1, m.hazard, 0, 0.86, 0.08, 0.02); k.bx(0.26, 0.26, 0.3, m.armor, 0, 0.86, -0.56, 0.03);
      k.rod([0, 0.4, -0.22], [0, 0.8, 0.3], 0.032, m.gun); k.rod([0, 0.52, -0.08], [0, 0.8, 0.33], 0.018, m.chrome);
      k.cyl(0.05, 0.05, 0.05, m.dark, 0, 0.78, 0.58, null, 12); for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.rod([sx * 0.02, 0.76, 0.58 + sz * 0.02], [sx * 0.2, 0.6, 0.58 + sz * 0.2], 0.01, m.steel, 6);
      k.cyl(0.35, 0.37, 0.15, m.dark, 0, 0.51, 0.58, null, 30); k.tor(0.31, 0.04, m.copper, 0, 0.6, 0.58, true);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, rb = k.box(0.04, 0.05, 0.3, m.gun, Math.sin(a) * 0.17, 0.61, 0.58 + Math.cos(a) * 0.17); rb.rotation.y = a; }
      k.cyl(0.36, 0.36, 0.012, m.glowB, 0, 0.43, 0.58, null, 30); k.tor(0.37, 0.015, m.steel, 0, 0.44, 0.58, true); }),
    W('hammer', 'Spiked piston ram', 'New: close-range knockback', (k, m) => { k.mount(0.32, 0.18);
      k.cyl(0.16, 0.16, 0.78, m.gun, 0, 0.56, -0.32, 'z', 22); for (const z of [-0.66, -0.32, 0.04]) k.cyl(0.172, 0.172, 0.05, m.dark, 0, 0.56, z, 'z', 22); k.cyl(0.16, 0.12, 0.08, m.dark, 0, 0.56, -0.74, 'z', 22);
      k.cyl(0.072, 0.072, 0.62, m.chrome, 0, 0.56, 0.36, 'z', 16);
      k.bx(0.56, 0.56, 0.32, m.armor, 0, 0.56, 0.8, 0.05); k.box(0.565, 0.565, 0.1, m.hazard, 0, 0.56, 0.72); k.bx(0.6, 0.6, 0.06, m.dark, 0, 0.56, 0.98, 0.02);
      for (const x of [-0.19, 0, 0.19]) for (const y of [-0.19, 0, 0.19]) k.spike(x, 0.56 + y, 1.0, [x * 0.6, y * 0.6, 1], 0.24, 0.055, m.steel);
      for (const sx of [-1, 1]) { k.cyl(0.055, 0.055, 0.42, m.red, sx * 0.22, 0.76, -0.3, 'z', 12); k.hose([[sx * 0.22, 0.76, -0.08], [sx * 0.2, 0.82, 0.1], [sx * 0.12, 0.7, 0.2]], 0.022); k.rod([sx * 0.2, 0.56, 0.64], [sx * 0.2, 0.56, 0.1], 0.025, m.steel); } }),
    W('oil', 'Oil slick sprayer', 'New: slippery trail', (k, m) => {
      k.bx(0.76, 0.06, 1.02, m.dark, 0, 0.03, 0, 0.015); for (const z of [-0.22, 0.36]) k.bx(0.7, 0.2, 0.08, m.gun, 0, 0.14, z, 0.015);
      k.cyl(0.31, 0.31, 0.88, m.gun, 0, 0.44, 0.08, 'z', 30); for (const z of [-0.36, 0.52]) k.tor(0.305, 0.022, m.dark, 0, 0.44, z); for (const z of [-0.08, 0.24]) k.cyl(0.318, 0.318, 0.03, m.dark, 0, 0.44, z, 'z', 30);
      k.cyl(0.314, 0.314, 0.12, m.hazard, 0, 0.44, 0.08, 'z', 30); k.cyl(0.04, 0.04, 0.03, m.brass, 0.15, 0.62, 0.53, 'z', 10);
      k.bx(0.22, 0.14, 0.22, m.armor, 0, 0.8, -0.12, 0.02); k.cyl(0.05, 0.05, 0.12, m.brass, 0.05, 0.92, -0.12, null, 10); k.cyl(0.04, 0.04, 0.14, m.red, -0.1, 0.84, -0.12, 'x', 10);
      k.hose([[0, 0.76, -0.22], [0, 0.55, -0.45], [0, 0.22, -0.48]], 0.03);
      k.cyl(0.036, 0.036, 0.8, m.steel, 0, 0.2, -0.5, 'x', 12); for (const x of [-0.3, -0.1, 0.1, 0.3]) { k.cyl(0.03, 0.055, 0.11, m.dark, x, 0.13, -0.53, null, 12); const d = k.sph(0.028, m.oil, x, 0.06, -0.53); d.scale.y = 1.7; } }),
    W('emp', 'EMP dish', 'New: cuts a rival\'s engine', (k, m, T) => { k.mount(0.3, 0.2);
      k.bx(0.42, 0.34, 0.42, m.armor, 0, 0.56, -0.32, 0.04); for (const sx of [-1, 1]) { k.cyl(0.075, 0.075, 0.36, m.copper, sx * 0.29, 0.5, -0.32, 'z', 16); k.cyl(0.08, 0.08, 0.03, m.dark, sx * 0.29, 0.5, -0.5, 'z', 16); k.tor(0.078, 0.012, m.glowB, sx * 0.29, 0.5, -0.14); }
      k.add(new T.SphereGeometry(0.6, 32, 10, 0, Math.PI * 2, 0, 0.95), m.dish, 0, 0.74, 0.5).rotation.x = -Math.PI / 2; const rr = 0.6 * Math.sin(0.95), rz = 0.5 - 0.6 * Math.cos(0.95); k.tor(rr, 0.03, m.dark, 0, 0.74, rz);
      k.cyl(0.06, 0.06, 0.12, m.dark, 0, 0.74, -0.08, 'z', 16);
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + Math.PI / 2; k.rod([Math.cos(a) * rr * 0.96, 0.74 + Math.sin(a) * rr * 0.96, rz], [0, 0.74, 0.46], 0.014, m.steel, 6); }
      k.cyl(0.08, 0.05, 0.14, m.dark, 0, 0.74, 0.42, 'z', 14); k.sph(0.075, m.glowB, 0, 0.74, 0.52);
      k.cyl(0.012, 0.012, 0.55, m.dark, -0.14, 0.98, -0.42, null, 6); k.sph(0.032, m.glowR, -0.14, 1.27, -0.42); }),
    W('harpoon', 'Barbed harpoon winch', 'New: hooks and drags a rival', (k, m) => { k.mount(0.32, 0.12);
      k.cyl(0.1, 0.1, 0.95, m.gun, 0, 0.56, 0.1, 'z', 18); for (const z of [-0.28, 0.1, 0.5]) k.cyl(0.112, 0.112, 0.05, m.dark, 0, 0.56, z, 'z', 18); k.tor(0.1, 0.02, m.soot, 0, 0.56, 0.58);
      k.cyl(0.028, 0.028, 0.66, m.steel, 0, 0.56, 0.8, 'z', 10); k.cone(0.085, 0.34, m.steel, 0, 0.56, 1.28, 'z', 4);
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + Math.PI / 4, c = Math.cos(a), s = Math.sin(a); k.spike(c * 0.05, 0.56 + s * 0.05, 1.17, [c * 0.8, s * 0.8, -1], 0.2, 0.024, m.steel); k.spike(c * 0.03, 0.56 + s * 0.03, 0.98, [c * 0.6, s * 0.6, -1], 0.14, 0.018, m.steel); }
      k.cyl(0.2, 0.2, 0.34, m.dark, 0, 0.46, -0.56, 'x', 22); for (let i = 0; i < 6; i++) k.tor(0.205, 0.012, m.steel, -0.13 + i * 0.052, 0.46, -0.56).rotation.y = Math.PI / 2;
      for (const sx of [-1, 1]) { k.cyl(0.28, 0.28, 0.03, m.armor, sx * 0.185, 0.46, -0.56, 'x', 26); k.bolt(sx * 0.205, 0.46, -0.56, 'x', 0.04); }
      k.hose([[0, 0.66, -0.56], [0, 0.72, -0.2], [0, 0.6, 0.4], [0, 0.57, 0.6]], 0.012, m.steel); k.bx(0.12, 0.2, 0.12, m.armor, 0, 0.36, -0.2, 0.02); }),
    W('glove', 'Spiked iron fist', 'New: long-reach punch', (k, m) => { k.mount(0.2, 0.2);
      k.bx(0.44, 0.4, 0.42, m.armor, 0, 0.47, -0.52, 0.04); k.box(0.445, 0.405, 0.08, m.hazard, 0, 0.47, -0.4); k.cyl(0.13, 0.13, 0.04, m.dark, 0, 0.47, -0.3, 'z', 18);
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const l = k.box(0.04, 0.04, 0.42, m.steel, s * 0.07, 0.47, -0.14 + i * 0.28); l.rotation.x = s * 0.72; } for (let i = 0; i < 4; i++) k.cyl(0.026, 0.026, 0.2, m.dark, 0, 0.47, -0.28 + i * 0.28, 'x', 8);
      k.cyl(0.19, 0.23, 0.16, m.gun, 0, 0.47, 0.56, 'z', 18); k.bx(0.44, 0.38, 0.32, m.dark, 0, 0.47, 0.78, 0.06);
      for (let i = 0; i < 4; i++) { const x = -0.15 + i * 0.1; k.bx(0.095, 0.13, 0.12, m.armor, x, 0.54, 0.96, 0.02); k.spike(x, 0.56, 1.02, [0, 0.1, 1], 0.16, 0.035, m.steel); }
      k.bx(0.12, 0.11, 0.24, m.armor, 0.25, 0.42, 0.8, 0.02); for (const x of [-0.12, 0.12]) k.bolt(x, 0.665, 0.74, null, 0.028); }),
    W('drone', 'Bomber drone bay', 'New: seeking bomb', (k, m) => {
      k.bx(0.9, 0.07, 0.9, m.dark, 0, 0.035, 0, 0.015); for (const [x, z, w, d] of [[0, 0.42, 0.86, 0.05], [0, -0.42, 0.86, 0.05], [0.42, 0, 0.05, 0.76], [-0.42, 0, 0.05, 0.76]]) k.box(w, 0.012, d, m.hazard, x, 0.075, z);
      for (const sx of [-1, 1]) k.bx(0.06, 0.16, 0.24, m.gun, sx * 0.4, 0.14, 0, 0.012);
      k.bx(0.34, 0.13, 0.46, m.armor, 0, 0.44, 0, 0.035); k.bx(0.22, 0.05, 0.26, m.dark, 0, 0.52, -0.04, 0.012); k.sph(0.06, m.glass, 0, 0.42, 0.23); k.sph(0.03, m.glowR, 0, 0.42, 0.28); k.sph(0.022, m.glowR, 0, 0.54, -0.2);
      k.cyl(0.075, 0.075, 0.24, m.olive, 0, 0.3, 0, 'z', 14); k.cone(0.075, 0.12, m.dark, 0, 0.3, 0.18, 'z', 14); k.cyl(0.077, 0.077, 0.03, m.red, 0, 0.3, 0.06, 'z', 14); k.box(0.2, 0.006, 0.08, m.dark, 0, 0.3, -0.14); k.box(0.006, 0.2, 0.08, m.dark, 0, 0.3, -0.14);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const x = sx * 0.33, z = sz * 0.33; k.rod([sx * 0.12, 0.44, sz * 0.14], [x, 0.46, z], 0.022, m.dark); k.cyl(0.045, 0.045, 0.09, m.gun, x, 0.48, z, null, 12); k.tor(0.2, 0.014, m.dark, x, 0.53, z, true);
        for (const a of [0.3, 0.3 + Math.PI / 2]) { const b = k.box(0.36, 0.006, 0.035, m.dark, x, 0.535, z); b.rotation.y = a; } k.rod([x * 0.8, 0.46, z * 0.8], [x * 0.8, 0.075, z * 0.8], 0.012, m.gun, 6); } }),
    W('sonic', 'Sonic cannon', 'Shockwave', (k, m) => { k.mount(0.2, 0.3);
      k.bx(0.92, 0.6, 0.5, m.armor, 0, 0.62, -0.14, 0.05);
      for (const sx of [-1, 1]) { const x = sx * 0.22; k.cyl(0.205, 0.205, 0.04, m.dark, x, 0.62, 0.115, 'z', 30); k.sph(0.06, m.steel, x, 0.62, 0.12); k.tor(0.17, 0.022, m.rubber, x, 0.62, 0.135); k.tor(0.205, 0.008, m.glowR, x, 0.62, 0.138);
        for (let a = 0; a < 4; a++) { const t = a * Math.PI / 2 + 0.78; k.bolt(x + Math.cos(t) * 0.225, 0.62 + Math.sin(t) * 0.225, 0.14, 'z', 0.018); } }
      for (const dy of [-0.12, 0, 0.12]) k.box(0.84, 0.016, 0.016, m.steel, 0, 0.62 + dy, 0.16);
      k.cyl(0.24, 0.07, 0.36, m.gun, 0, 1.06, 0.0, 'z', 28); k.tor(0.235, 0.022, m.dark, 0, 1.06, 0.18); k.cyl(0.2, 0.2, 0.01, m.soot, 0, 1.06, 0.17, 'z', 24); k.bx(0.14, 0.16, 0.14, m.gun, 0, 0.94, -0.12, 0.02);
      for (let i = 0; i < 8; i++) k.box(0.022, 0.46, 0.12, m.dark, -0.35 + i * 0.1, 0.62, -0.44); }),
    W('laser', 'Laser cannon', 'New: continuous beam', (k, m) => { k.mount(0.36, 0.24);
      k.bx(0.46, 0.4, 0.72, m.armor, 0, 0.6, -0.26, 0.05); k.box(0.3, 0.012, 0.2, m.hazard, 0, 0.805, -0.42);
      k.cyl(0.13, 0.13, 0.78, m.gun, 0, 0.6, 0.45, 'z', 26); k.fins(0.2, 0.02, 8, 0.07, m.dark, 0, 0.6, 0.16);
      k.cyl(0.18, 0.14, 0.18, m.dark, 0, 0.6, 0.9, 'z', 26); k.tor(0.165, 0.022, m.steel, 0, 0.6, 0.995); k.cyl(0.12, 0.12, 0.015, m.glowR, 0, 0.6, 0.995, 'z', 24); k.cyl(0.05, 0.05, 0.02, m.glowW, 0, 0.6, 1.0, 'z', 16);
      for (const sx of [-1, 1]) k.hose([[sx * 0.2, 0.68, 0.06], [sx * 0.26, 0.72, 0.3], [sx * 0.17, 0.66, 0.74]], 0.024);
      k.cyl(0.075, 0.075, 0.4, m.copper, 0.3, 0.46, -0.26, 'z', 16); k.tor(0.078, 0.012, m.glowB, 0.3, 0.46, -0.04); k.bx(0.1, 0.1, 0.2, m.dark, 0, 0.85, -0.1, 0.015); k.cyl(0.03, 0.03, 0.01, m.glowR, 0, 0.85, 0.005, 'z', 10); })
  ];
  window.CCWeapons = { list, byKey: Object.fromEntries(list.map(w => [w.key, w])), mats };
})();
