// Blokvane party games: the world map of Where in the World?, on the TV and on the phones. The map is one big picture
// (7680 x 3096) cut into tiles at three sharpness levels (map/z0.jpg for the whole world, z1 and z2 tiles for zooming
// in): only the tiles on screen load. On a phone it pans, pinches and zooms; on the TV it flies from place to place.
// Pins, lines and a country's outline sit on top of it. The picture is a plain equirectangular map: 21.333 pixels per
// degree both ways, the equator at y = 1727.8, from 81 degrees north to 64 degrees south.
var BVMAP = (() => {
  'use strict';
  const W = 7680, H = 3096, K = W / 360, EQ = 1727.8;
  const BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '') + 'map/';
  const LV = [1, 2, 4];               // tiles per side at each level (each tile is 1920 x 774 pixels)
  const xy = (lon, lat) => [(lon + 180) * K, EQ - lat * K];
  const ll = (x, y) => [x / K - 180, (EQ - y) / K];
  const NORTH = EQ / K, SOUTH = (EQ - H) / K;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const NS = 'http://www.w3.org/2000/svg';
  let styled = false;
  function style() {
    if (styled) return;
    styled = true;
    const s = document.createElement('style');
    s.textContent = `
.bvmap{position:relative;width:100%;height:100%;overflow:hidden;background:#0b2043;touch-action:none;user-select:none;-webkit-user-select:none;contain:strict;
  -webkit-tap-highlight-color:transparent}
.bvmap .bvm-w{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;will-change:transform}
.bvmap .bvm-ext{position:absolute;left:-${W}px;right:-${W}px;top:-${H * 2}px;bottom:-${H * 2}px;
  background:linear-gradient(90deg,rgba(120,165,230,.13) 0 3px,transparent 3px) -1.5px 0/640px 640px,
  linear-gradient(rgba(120,165,230,.13) 0 3px,transparent 3px) 0 ${((EQ + 2 * H) % 640) - 1.5}px/640px 640px,#0b2043}
.bvmap .bvm-t{position:absolute;display:block;opacity:0;transition:opacity .35s ease;max-width:none;image-rendering:auto}
.bvmap .bvm-t.on{opacity:1}
.bvmap .bvm-t.z0{transition:none}
.bvmap .bvm-fade{position:absolute;left:-${W}px;right:-${W}px;height:130px;pointer-events:none}
.bvmap .bvm-fade.n{top:-2px;background:linear-gradient(#0b2043,rgba(11,32,67,0))}
.bvmap .bvm-fade.s{top:${H - 128}px;background:linear-gradient(rgba(11,32,67,0),#0b2043)}
.bvmap .bvm-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible}
.bvmap .bvm-marks{position:absolute;inset:0;pointer-events:none}
.bvmap .bvm-mark{position:absolute;left:0;top:0;will-change:transform}
.bvm-pin{position:absolute;left:0;top:0;width:var(--pw,44px);height:calc(var(--pw,44px) * 1.32);transform:translate(-50%,-100%);filter:drop-shadow(0 6px 8px rgba(0,0,0,.45))}
.bvm-pin svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.bvm-pin img,.bvm-pin .face{position:absolute;left:14%;top:7.5%;width:72%;height:54.5%;border-radius:50%;object-fit:cover;background:#fff}
.bvm-pin .face{background:none;display:grid;place-items:center}
.bvm-pin .face svg{position:static;width:78%;height:78%}`;
    document.head.appendChild(s);
  }
  // a pin: a teardrop in the player's color with their face in it (or Boo), its tip on the spot
  const DROP = 'M32 83C32 83 5 53 5 31.5A27 27 0 1 1 59 31.5C59 53 32 83 32 83Z';
  const BOO = '<svg viewBox="0 0 40 44"><path d="M20 2C9.5 2 4 10 4 20.5V41q3-4 6 0t6 0t6 0t6 0t6 0V20.5C36 10 30.5 2 20 2Z" fill="#fff"/><ellipse cx="14.5" cy="20" rx="3" ry="4" fill="#24164a"/><ellipse cx="25.5" cy="20" rx="3" ry="4" fill="#24164a"/><circle cx="15.4" cy="18.6" r="1" fill="#fff"/><circle cx="26.4" cy="18.6" r="1" fill="#fff"/></svg>';
  function pin(o = {}) {
    style();
    const p = document.createElement('div');
    p.className = 'bvm-pin' + (o.cls ? ' ' + o.cls : '');
    if (o.size) p.style.setProperty('--pw', o.size + 'px');
    p.innerHTML = '<svg viewBox="0 0 64 84"><path d="' + DROP + '" fill="' + (o.color || '#ff5a6e') + '" stroke="#fff" stroke-width="3.2"/></svg>';
    if (o.img) { const im = document.createElement('img'); im.src = o.img; im.alt = ''; p.appendChild(im); }
    else { const f = document.createElement('span'); f.className = 'face'; f.innerHTML = BOO; p.appendChild(f); }
    return p;
  }

  function create(parent, o = {}) {
    style();
    const el = (tag, cls, at) => { const e = document.createElement(tag); if (cls) e.className = cls; if (at) at.appendChild(e); return e; };
    const box = el('div', 'bvmap' + (o.cls ? ' ' + o.cls : ''), parent);
    const world = el('div', 'bvm-w', box);
    el('div', 'bvm-ext', world);
    const tl = el('div', '', world);
    el('div', 'bvm-fade n', world); el('div', 'bvm-fade s', world);
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'bvm-svg'); box.appendChild(svg);
    const g = document.createElementNS(NS, 'g'); svg.appendChild(g);
    const marksEl = el('div', 'bvm-marks', box);
    // the part of the map this view keeps to (a continent, or the whole world)
    let lim = [0, 0, W, H];
    let cx = W / 2, cy = H / 2, s = 0.1, dead = false;
    const size = () => [box.clientWidth || 300, box.clientHeight || 200];
    // (zoomed all the way out the whole area fits; o.out lets it shrink a little more, for the TV's flights)
    const minS = () => { const [bw, bh] = size(); return Math.min(bw / (lim[2] - lim[0]), bh / (lim[3] - lim[1])) * (o.out || 1); };
    const maxS = () => o.maxS || 3;
    function clampView() {
      s = clamp(s, minS(), Math.max(minS(), maxS()));
      const [bw, bh] = size(), hw = bw / s / 2, hh = bh / s / 2;
      cx = lim[2] - lim[0] <= 2 * hw ? (lim[0] + lim[2]) / 2 : clamp(cx, lim[0] + hw, lim[2] - hw);
      cy = lim[3] - lim[1] <= 2 * hh ? (lim[1] + lim[3]) / 2 : clamp(cy, lim[1] + hh, lim[3] - hh);
    }
    const toScreen = (x, y) => { const [bw, bh] = size(); return [bw / 2 + (x - cx) * s, bh / 2 + (y - cy) * s]; };
    const toMap = (px, py) => { const [bw, bh] = size(); return [cx + (px - bw / 2) / s, cy + (py - bh / 2) / s]; };
    const marks = new Set();
    function place(m) { const [px, py] = toScreen(m.x, m.y); m.node.style.transform = 'translate(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px)'; }
    function apply() {
      if (dead) return;
      const [bw, bh] = size();
      const tx = bw / 2 - cx * s, ty = bh / 2 - cy * s;
      world.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) scale(' + s.toFixed(5) + ')';
      g.setAttribute('transform', 'matrix(' + s.toFixed(5) + ' 0 0 ' + s.toFixed(5) + ' ' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ')');
      for (const m of marks) place(m);
      tiles();
      if (o.onView) o.onView(api);
    }
    // the tiles: the whole world always, and the sharper ones for what's on screen once it's zoomed in
    const have = new Map();
    function ensure(lv, r, c) {
      const k = lv + '-' + r + '-' + c;
      let im = have.get(k);
      if (im) { im.hidden = false; return; }
      const n = LV[lv], tw = W / n, th = H / n;
      im = new Image();
      im.decoding = 'async'; im.alt = ''; im.draggable = false;
      im.className = 'bvm-t z' + lv;
      im.style.cssText = 'left:' + (c * tw) + 'px;top:' + (r * th) + 'px;width:' + tw + 'px;height:' + th + 'px;z-index:' + lv;
      im.onload = () => im.classList.add('on');
      im.src = BASE + (lv ? 'z' + lv + '-' + r + '-' + c + '.jpg' : 'z0.jpg');
      tl.appendChild(im);
      have.set(k, im);
    }
    function tiles() {
      ensure(0, 0, 0);
      const need = s * (window.devicePixelRatio || 1);
      const lv = need <= 0.25 * 1.3 ? 0 : need <= 0.5 * 1.3 ? 1 : 2;
      if (!lv) return;
      const [bw, bh] = size();
      const [x0, y0] = toMap(-bw * 0.1, -bh * 0.1), [x1, y1] = toMap(bw * 1.1, bh * 1.1);
      const n = LV[lv], tw = W / n, th = H / n;
      for (let r = Math.max(0, Math.floor(y0 / th)); r <= Math.min(n - 1, Math.floor(y1 / th)); r++) {
        for (let c = Math.max(0, Math.floor(x0 / tw)); c <= Math.min(n - 1, Math.floor(x1 / tw)); c++) ensure(lv, r, c);
      }
      // (sharp tiles far off screen let go of their memory: a phone keeps at most 8 of them)
      const sharp = [...have.entries()].filter(([k]) => k[0] === '2');
      if (sharp.length > 8) for (const [k, im] of sharp) {
        const [, r, c] = k.split('-').map(Number);
        if (c * W / 4 > x1 || (c + 1) * W / 4 < x0 || r * H / 4 > y1 || (r + 1) * H / 4 < y0) { im.remove(); have.delete(k); }
      }
    }
    // moving the view: at once, or a smooth flight (the zoom changes evenly, so a long trip zooms out on the way)
    let anim = 0;
    function set(x, y, sc) { cx = x; cy = y; s = sc; clampView(); apply(); }
    function fly(x, y, sc, ms) {
      cancelAnimationFrame(anim);
      const tx = x, ty = y;
      let ts = clamp(sc, minS(), Math.max(minS(), maxS()));
      if (!ms || matchMedia('(prefers-reduced-motion: reduce)').matches) { set(tx, ty, ts); return Promise.resolve(); }
      const fx = cx, fy = cy, fs = s, t0 = performance.now();
      // (far apart and zoomed in: out a little in the middle of the trip)
      const [bw] = size();
      const far = Math.hypot(tx - fx, ty - fy) * Math.min(fs, ts) / bw;
      const dip = far > 1.2 ? Math.min(0.6, 0.2 + far * 0.08) : 0;
      return new Promise(res => {
        const step = t => {
          if (dead) return res();
          const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
          const ls = Math.log(fs) + (Math.log(ts) - Math.log(fs)) * e - dip * Math.sin(Math.PI * e);
          s = Math.exp(ls);
          // (the center moves so the screen glides, not swings, as the zoom changes)
          cx = fx + (tx - fx) * e; cy = fy + (ty - fy) * e;
          apply();
          if (k < 1) anim = requestAnimationFrame(step); else { set(tx, ty, ts); res(); }
        };
        anim = requestAnimationFrame(step);
      });
    }
    // fit a box (map pixels) on the screen, with room around it (pad: screen pixels)
    function fit(r, f = {}) {
      const [bw, bh] = size(), pad = f.pad != null ? f.pad : 40, pt = f.top || 0;
      const w = Math.max(r[2] - r[0], 1), h = Math.max(r[3] - r[1], 1);
      const sc = Math.min((bw - 2 * pad) / w, (bh - 2 * pad - pt) / h, f.maxS || maxS());
      return fly((r[0] + r[2]) / 2, (r[1] + r[3]) / 2 - pt / 2 / Math.max(sc, 1e-6), sc, f.ms || 0);
    }
    function bounds(r, keep) { lim = r ? r.slice() : [0, 0, W, H]; if (!keep) { cx = (lim[0] + lim[2]) / 2; cy = (lim[1] + lim[3]) / 2; s = minS(); } clampView(); apply(); }
    // marks: anything (a pin, a label) kept on a spot of the map as it moves
    function add(node, x, y) {
      // (the mark is a holder on the spot; what's in it keeps its own transform, like a pin standing on its tip)
      const w = el('div', 'bvm-mark');
      w.appendChild(node);
      const m = { node: w, x, y };
      marksEl.appendChild(w);
      marks.add(m);
      place(m);
      return { node, wrap: w, get x() { return m.x; }, get y() { return m.y; }, move(x2, y2) { m.x = x2; m.y = y2; place(m); }, remove() { w.remove(); marks.delete(m); } };
    }
    // shapes on the map (map pixels): a line, or a country's outline (its path in tenths of a degree, see world-data.js)
    function line(x1, y1, x2, y2, a = {}) {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2);
      for (const [k, v] of Object.entries(a)) l.setAttribute(k, v);
      l.setAttribute('vector-effect', 'non-scaling-stroke');
      g.appendChild(l);
      return l;
    }
    function shape(d, a = {}) {
      const gg = document.createElementNS(NS, 'g');
      // (tenths of a degree to map pixels: x = X * K / 10, y = EQ - (90 - Y / 10) * K)
      gg.setAttribute('transform', 'matrix(' + (K / 10) + ' 0 0 ' + (K / 10) + ' 0 ' + (EQ - 90 * K) + ')');
      const p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      for (const [k, v] of Object.entries(a)) p.setAttribute(k, v);
      p.setAttribute('vector-effect', 'non-scaling-stroke');
      gg.appendChild(p);
      g.appendChild(gg);
      return gg;
    }
    const api = {
      el: box, svg, g, add, line, shape, fly, fit, bounds, toScreen, toMap,
      get view() { return { x: cx, y: cy, s }; }, set: (x, y, sc) => set(x, y, sc),
      zoomBy(k, px, py, ms) { const [bw, bh] = size(); const ax = px != null ? px : bw / 2, ay = py != null ? py : bh / 2; const [mx, my] = toMap(ax, ay); const ns = clamp(s * k, minS(), Math.max(minS(), maxS())); const nx = mx - (ax - bw / 2) / ns, ny = my - (ay - bh / 2) / ns; return fly(nx, ny, ns, ms == null ? 220 : ms); },
      minS, maxS, size, clear() { g.textContent = ''; for (const m of [...marks]) { m.node.remove(); marks.delete(m); } },
      destroy() { dead = true; cancelAnimationFrame(anim); if (ro) ro.disconnect(); box.remove(); }
    };
    // ---------- touch, mouse and wheel (phones) ----------
    if (o.touch) {
      const pts = new Map();
      let start = null, pinch = null, moved = false, trail = [], glide = 0;
      box.addEventListener('pointerdown', e => {
        if (e.target.closest('button')) return;
        cancelAnimationFrame(anim); cancelAnimationFrame(glide); trail = [];
        try { box.setPointerCapture(e.pointerId); } catch (er) {}
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        const r = box.getBoundingClientRect();
        if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, cx, cy, t: performance.now(), r }; moved = false; }
        else if (pts.size === 2) {
          const [a, b] = [...pts.values()];
          const mx = (a.x + b.x) / 2 - r.left, my = (a.y + b.y) / 2 - r.top;
          pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s, at: toMap(mx, my), r };
          moved = true;
        }
      });
      box.addEventListener('pointermove', e => {
        if (!pts.has(e.pointerId)) return;
        pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pts.size === 1) { trail.push({ x: e.clientX, y: e.clientY, t: performance.now() }); if (trail.length > 6) trail.shift(); } else trail = [];
        if (pts.size >= 2 && pinch) {
          const [a, b] = [...pts.values()];
          const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
          const ns = clamp(pinch.s * d / pinch.d, minS(), Math.max(minS(), maxS()));
          const [bw, bh] = size();
          const mx = (a.x + b.x) / 2 - pinch.r.left, my = (a.y + b.y) / 2 - pinch.r.top;
          // (the spot between the two fingers stays under them)
          s = ns; cx = pinch.at[0] - (mx - bw / 2) / ns; cy = pinch.at[1] - (my - bh / 2) / ns;
          clampView(); apply();
        } else if (pts.size === 1 && start) {
          if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) moved = true;
          if (moved) { cx = start.cx - (e.clientX - start.x) / s; cy = start.cy - (e.clientY - start.y) / s; clampView(); apply(); }
        }
      });
      const up = e => {
        const tap = pts.size === 1 && !moved && start && e.type === 'pointerup' && performance.now() - start.t < 700;
        // (a flick keeps the map gliding for a moment, slowing down smoothly)
        if (pts.size === 1 && moved && !pinch && trail.length >= 2) {
          const a = trail[0], z = trail[trail.length - 1], dt = Math.max(1, z.t - a.t);
          let vx = (z.x - a.x) / dt, vy = (z.y - a.y) / dt;
          if (performance.now() - z.t < 80 && Math.hypot(vx, vy) > 0.25) {
            let last = performance.now();
            const run = t => { const d = Math.min(40, t - last); last = t; cx -= vx * d / s; cy -= vy * d / s; const f = Math.pow(0.92, d / 16); vx *= f; vy *= f; clampView(); apply(); if (Math.hypot(vx, vy) > 0.02) glide = requestAnimationFrame(run); };
            glide = requestAnimationFrame(run);
          }
        }
        trail = [];
        pts.delete(e.pointerId);
        if (pts.size < 2) pinch = null;
        if (pts.size === 1) { const [p] = [...pts.values()]; start = { x: p.x, y: p.y, cx, cy, t: performance.now(), r: box.getBoundingClientRect() }; }
        if (!pts.size) start = null;
        if (tap && o.onTap) { const r = box.getBoundingClientRect(); const [x, y] = toMap(e.clientX - r.left, e.clientY - r.top); if (x >= 0 && x <= W && y >= 0 && y <= H) o.onTap(x, y); }
      };
      box.addEventListener('pointerup', up);
      box.addEventListener('pointercancel', up);
      box.addEventListener('wheel', e => { e.preventDefault(); const r = box.getBoundingClientRect(); api.zoomBy(e.deltaY > 0 ? 1 / 1.25 : 1.25, e.clientX - r.left, e.clientY - r.top, 0); }, { passive: false });
    }
    let ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(() => { if (!dead) { clampView(); apply(); } }); ro.observe(box); }
    bounds(o.bounds || null);
    return api;
  }
  // a place's box on the map, from longitudes and latitudes [west, south, east, north]
  const box = b => { const [x0, y0] = xy(b[0], b[3]), [x1, y1] = xy(b[2], b[1]); return [Math.max(0, x0), Math.max(0, y0), Math.min(W, x1), Math.min(H, y1)]; };
  return { create, pin, xy, ll, box, W, H, K, NORTH, SOUTH, BASE, BOO };
})();
