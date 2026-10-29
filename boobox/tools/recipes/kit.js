// The drawing kit for Boo Box stickers: small builders for the drawing parts ([tag, attributes, children]) that
// Blokvane's checks allow (see boo-core.js), the Boo Box look (a soft dark outline, flat colors, one shade and one
// shine) and the faces. Everything here is Blokvane's own drawing.
'use strict';

const r = n => Math.round(n * 100) / 100;
// colors every sticker shares
const OL = '#2b2346';       // the outline and the eyes
const HL = '#fffffe';       // shine (kept apart from white, so a white body can change color without its shine)
const SH = '#000000';       // shade (see-through, so it suits any color)
const CHEEK = '#ff8fab';
const SW = 5;               // outline width (in a 200 x 200 sticker)

// ---------- parts
const clean = a => { const o = {}; for (const [k, v] of Object.entries(a || {})) if (v !== undefined && v !== null && v !== false) o[k] = typeof v === 'number' ? r(v) : v; return o; };
const node = (tag, attrs, kids) => (kids === undefined || (Array.isArray(kids) && !kids.length)) ? [tag, clean(attrs)] : [tag, clean(attrs), kids];
// (a part is a list that starts with its tag; lists of parts can be nested and are made flat)
const flat = kids => { const out = []; const add = k => { if (!k) return; if (Array.isArray(k) && typeof k[0] === 'string') out.push(k); else if (Array.isArray(k)) k.forEach(add); }; add(kids); return out; };
const g = (attrs, ...kids) => node('g', attrs, flat(kids));
const path = (d, a) => node('path', { d, ...a });
const circle = (cx, cy, rr, a) => node('circle', { cx, cy, r: rr, ...a });
const ellipse = (cx, cy, rx, ry, a) => node('ellipse', { cx, cy, rx, ry, ...a });
const rect = (x, y, w, h, a) => node('rect', { x, y, width: w, height: h, ...a });
const line = (x1, y1, x2, y2, a) => node('line', { x1, y1, x2, y2, ...a });
const poly = (pts, a) => node('polygon', { points: pts.map(p => r(p[0]) + ',' + r(p[1])).join(' '), ...a });
const pline = (pts, a) => node('polyline', { points: pts.map(p => r(p[0]) + ',' + r(p[1])).join(' '), ...a });
const ink = (w = SW, extra) => ({ stroke: OL, 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...extra });
const fillInk = (fill, w = SW, extra) => ({ fill, ...ink(w), ...extra });
const shade = (d, o = 0.13) => path(d, { fill: SH, opacity: o });
const shine = (cx, cy, rx, ry, rot = -30, o = 0.6) => ellipse(cx, cy, rx, ry, { fill: HL, opacity: o, transform: `rotate(${rot} ${r(cx)} ${r(cy)})` });
const ground = (cx, cy, rx, cls) => ellipse(cx, cy, rx, rx * 0.16, { fill: SH, opacity: 0.14, class: cls });
const anim = (cls, ...kids) => g({ class: cls }, ...kids);

// ---------- path helpers
const P = (x, y) => r(x) + ' ' + r(y);
const rad = d => d * Math.PI / 180;
const at = (cx, cy, rr, deg) => [cx + rr * Math.cos(rad(deg)), cy + rr * Math.sin(rad(deg))];
function rrect(x, y, w, h, rr) { rr = Math.min(rr, w / 2, h / 2); return `M${P(x + rr, y)}H${r(x + w - rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x + w, y + rr)}V${r(y + h - rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x + w - rr, y + h)}H${r(x + rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x, y + h - rr)}V${r(y + rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x + rr, y)}Z`; }
function heart(cx, cy, s) {
  // a full heart, s = its width
  const w = s / 2, h = s * 0.9;
  const top = cy - h * 0.42;
  return `M${P(cx, cy + h * 0.5)}C${P(cx - w * 0.35, cy + h * 0.25)} ${P(cx - w * 1.02, cy - h * 0.05)} ${P(cx - w, top + h * 0.12)}C${P(cx - w * 0.98, top - h * 0.18)} ${P(cx - w * 0.2, top - h * 0.22)} ${P(cx, top + h * 0.06)}C${P(cx + w * 0.2, top - h * 0.22)} ${P(cx + w * 0.98, top - h * 0.18)} ${P(cx + w, top + h * 0.12)}C${P(cx + w * 1.02, cy - h * 0.05)} ${P(cx + w * 0.35, cy + h * 0.25)} ${P(cx, cy + h * 0.5)}Z`;
}
function star(cx, cy, ro, ri, n = 5, rot = -90, round = 0) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) pts.push(at(cx, cy, i % 2 ? ri : ro, rot + i * 180 / n));
  return round ? roundPoly(pts, round) : 'M' + pts.map(p => P(p[0], p[1])).join('L') + 'Z';
}
function roundPoly(pts, rr) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(...v1) || 1, l2 = Math.hypot(...v2) || 1;
    const q = Math.min(rr, l1 / 2.1, l2 / 2.1);
    d += (i ? 'L' : 'M') + P(p1[0] + v1[0] / l1 * q, p1[1] + v1[1] / l1 * q) + 'Q' + P(p1[0], p1[1]) + ' ' + P(p1[0] + v2[0] / l2 * q, p1[1] + v2[1] / l2 * q);
  }
  return d + 'Z';
}
function burst(cx, cy, ro, ri, n, rot = -90) { return star(cx, cy, ro, ri, n, rot); }
// a scalloped seal (n bumps)
function scallop(cx, cy, rr, n, depth = 0.08) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a0 = (i - 1) / n * 360 - 90, a1 = i / n * 360 - 90, am = (a0 + a1) / 2;
    const p1 = at(cx, cy, rr, a1), pm = at(cx, cy, rr * (1 + depth * 2.2), am);
    if (i === 0) d += 'M' + P(...p1); else d += 'Q' + P(...pm) + ' ' + P(...p1);
  }
  return d + 'Z';
}
// a cloud with round bumps on top (x, y = left bottom; w wide)
function cloud(x, y, w, h) {
  const b = y;
  return `M${P(x + w * 0.16, b)}H${r(x + w * 0.84)}C${P(x + w * 1.02, b)} ${P(x + w * 1.04, b - h * 0.62)} ${P(x + w * 0.84, b - h * 0.66)}C${P(x + w * 0.84, b - h * 1.02)} ${P(x + w * 0.5, b - h * 1.12)} ${P(x + w * 0.42, b - h * 0.8)}C${P(x + w * 0.3, b - h * 1)} ${P(x + w * 0.06, b - h * 0.86)} ${P(x + w * 0.14, b - h * 0.58)}C${P(x - w * 0.04, b - h * 0.56)} ${P(x - w * 0.04, b)} ${P(x + w * 0.16, b)}Z`;
}
// the ghost (Boo): a round top, straight sides and a wavy hem with `bumps` bumps
function ghost(cx, top, w, h, bumps = 3, sway = 0) {
  const x0 = cx - w / 2, x1 = cx + w / 2, rr = w / 2, bottom = top + h;
  let d = `M${P(x0, top + rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x1, top + rr)}L${P(x1 + sway, bottom)}`;
  const step = w / bumps;
  for (let i = 0; i < bumps; i++) {
    const xa = x1 + sway - step * i, xb = xa - step;
    d += `Q${P(xa - step * 0.25, bottom + step * 0.42)} ${P(xa - step * 0.5, bottom)}Q${P(xa - step * 0.75, bottom - step * 0.42)} ${P(xb, bottom)}`;
  }
  return d + 'Z';
}
// a speech bubble (rounded box with a tail at the bottom left)
function bubble(x, y, w, h, rr, tail = 'left') {
  const tx = tail === 'left' ? x + w * 0.24 : tail === 'right' ? x + w * 0.76 : x + w / 2;
  const dir = tail === 'right' ? 1 : -1;
  return `M${P(x + rr, y)}H${r(x + w - rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x + w, y + rr)}V${r(y + h - rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x + w - rr, y + h)}H${r(tx + 10)}L${P(tx + dir * 14, y + h + 24)}L${P(tx - 6, y + h)}H${r(x + rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x, y + h - rr)}V${r(y + rr)}A${r(rr)} ${r(rr)} 0 0 1 ${P(x + rr, y)}Z`;
}

// ---------- faces
// eyes: dot, happy, wink, closed, star, heart, big, sleepy, shades, sparkle, dizzy, cross, line, sad, none
// mouth: smile, open, grin, o, tongue, cat, flat, smirk, sad, teeth, wavy, none, kiss, yell
function face(cx, cy, s, o = {}) {
  const eyes = o.eyes || 'dot', mouth = o.mouth || 'smile';
  const dx = s * 0.21 * (o.wide || 1), ey = cy - s * 0.04 + (o.eyeY || 0), my = cy + s * 0.13 + (o.mouthY || 0);
  const er = s * 0.055 * (o.eyeSize || 1);
  const col = o.ink || OL;
  const out = [];
  const eye = (x, kind) => {
    switch (kind) {
      case 'happy': return path(`M${P(x - er * 1.3, ey + er * 0.5)}Q${P(x, ey - er * 1.5)} ${P(x + er * 1.3, ey + er * 0.5)}`, { fill: 'none', ...ink(s * 0.03, { stroke: col }) });
      case 'closed': return path(`M${P(x - er * 1.3, ey - er * 0.2)}Q${P(x, ey + er * 1.4)} ${P(x + er * 1.3, ey - er * 0.2)}`, { fill: 'none', ...ink(s * 0.03, { stroke: col }) });
      case 'line': return line(x - er * 1.2, ey, x + er * 1.2, ey, ink(s * 0.03, { stroke: col }));
      case 'star': return path(star(x, ey, er * 1.9, er * 0.85, 5, -90, er * 0.25), { fill: '#ffc93a', ...ink(s * 0.016, { stroke: col }) });
      case 'heart': return path(heart(x, ey, er * 3.2), { fill: '#ff4d6d', ...ink(s * 0.014, { stroke: col }) });
      case 'big': return g({}, ellipse(x, ey, er * 1.5, er * 1.8, { fill: col }), circle(x + er * 0.5, ey - er * 0.7, er * 0.55, { fill: HL }), circle(x - er * 0.5, ey + er * 0.6, er * 0.25, { fill: HL }));
      case 'sleepy': return path(`M${P(x - er * 1.3, ey)}Q${P(x, ey + er * 1.1)} ${P(x + er * 1.3, ey)}`, { fill: 'none', ...ink(s * 0.028, { stroke: col }) });
      case 'sparkle': return path(star(x, ey, er * 2.1, er * 0.5, 4, -90), { fill: col });
      case 'dizzy': return path(`M${P(x, ey)}m${-er * 0.4} 0a${r(er * 0.4)} ${r(er * 0.4)} 0 1 1 ${r(er * 0.8)} 0a${r(er * 0.8)} ${r(er * 0.8)} 0 1 1 ${r(-er * 1.6)} 0a${r(er * 1.2)} ${r(er * 1.2)} 0 1 1 ${r(er * 2.4)} 0`, { fill: 'none', ...ink(s * 0.02, { stroke: col }) });
      case 'cross': return path(`M${P(x - er, ey - er)}L${P(x + er, ey + er)}M${P(x + er, ey - er)}L${P(x - er, ey + er)}`, ink(s * 0.028, { stroke: col }));
      case 'sad': return g({}, ellipse(x, ey, er, er * 1.25, { fill: col }), path(`M${P(x - er * 1.4, ey - er * 2.2)}L${P(x + er * 0.9, ey - er * 1.6)}`, ink(s * 0.02, { stroke: col })));
      case 'none': return null;
      default: return g({}, ellipse(x, ey, er, er * 1.25, { fill: col }), circle(x + er * 0.38, ey - er * 0.45, er * 0.36, { fill: HL }));
    }
  };
  if (eyes === 'shades') {
    out.push(path(`M${P(cx - dx - er * 2.6, ey - er * 1.6)}H${r(cx + dx + er * 2.6)}V${r(ey - er * 0.6)}Q${P(cx + dx + er * 2.4, ey + er * 1.9)} ${P(cx + dx, ey + er * 1.8)}Q${P(cx + dx - er * 2.3, ey + er * 1.7)} ${P(cx + er * 0.6, ey - er * 0.3)}H${r(cx - er * 0.6)}Q${P(cx - dx + er * 2.3, ey + er * 1.7)} ${P(cx - dx, ey + er * 1.8)}Q${P(cx - dx - er * 2.4, ey + er * 1.9)} ${P(cx - dx - er * 2.6, ey - er * 0.6)}Z`, { fill: '#1b1530', ...ink(s * 0.014) }));
    out.push(path(`M${P(cx - dx - er * 1.6, ey - er * 0.9)}L${P(cx - dx - er * 0.6, ey - er * 0.9)}M${P(cx + dx + er * 0.4, ey - er * 0.9)}L${P(cx + dx + er * 1.4, ey - er * 0.9)}`, { stroke: HL, 'stroke-width': s * 0.018, 'stroke-linecap': 'round', opacity: 0.7 }));
  } else if (eyes === 'wink') {
    out.push(eye(cx - dx, 'dot'), eye(cx + dx, 'happy'));
  } else {
    const eg = [eye(cx - dx, eyes), eye(cx + dx, eyes)];
    out.push(o.blink ? g({ class: 'blink' }, eg) : eg);
  }
  if (o.cheeks !== false) { out.push(ellipse(cx - dx * 1.45, ey + er * 2.6, er * 1.5, er * 0.9, { fill: o.cheek || CHEEK, opacity: 0.65 }), ellipse(cx + dx * 1.45, ey + er * 2.6, er * 1.5, er * 0.9, { fill: o.cheek || CHEEK, opacity: 0.65 })); }
  const mw = s * 0.09 * (o.mouthSize || 1);
  const m = {
    smile: () => path(`M${P(cx - mw, my - mw * 0.25)}Q${P(cx, my + mw * 0.9)} ${P(cx + mw, my - mw * 0.25)}`, { fill: 'none', ...ink(s * 0.028, { stroke: col }) }),
    open: () => g({}, path(`M${P(cx - mw, my - mw * 0.4)}Q${P(cx, my - mw * 0.55)} ${P(cx + mw, my - mw * 0.4)}Q${P(cx + mw * 0.9, my + mw * 1.2)} ${P(cx, my + mw * 1.2)}Q${P(cx - mw * 0.9, my + mw * 1.2)} ${P(cx - mw, my - mw * 0.4)}Z`, { fill: '#7a1f3d', ...ink(s * 0.022, { stroke: col }) }), ellipse(cx, my + mw * 0.75, mw * 0.5, mw * 0.32, { fill: '#ff6f91' })),
    grin: () => g({}, path(`M${P(cx - mw * 1.3, my - mw * 0.35)}H${r(cx + mw * 1.3)}Q${P(cx + mw * 1.2, my + mw * 1.1)} ${P(cx, my + mw * 1.1)}Q${P(cx - mw * 1.2, my + mw * 1.1)} ${P(cx - mw * 1.3, my - mw * 0.35)}Z`, { fill: HL, ...ink(s * 0.022, { stroke: col }) })),
    o: () => ellipse(cx, my + mw * 0.2, mw * 0.42, mw * 0.55, { fill: '#7a1f3d', ...ink(s * 0.02, { stroke: col }) }),
    tongue: () => g({}, path(`M${P(cx - mw, my - mw * 0.3)}Q${P(cx, my + mw * 0.8)} ${P(cx + mw, my - mw * 0.3)}`, { fill: 'none', ...ink(s * 0.026, { stroke: col }) }), path(`M${P(cx + mw * 0.05, my + mw * 0.22)}Q${P(cx + mw * 0.15, my + mw * 1.3)} ${P(cx + mw * 0.65, my + mw * 1.05)}Q${P(cx + mw * 0.85, my + mw * 0.55)} ${P(cx + mw * 0.7, my + mw * 0.05)}`, { fill: '#ff6f91', ...ink(s * 0.018, { stroke: col }) })),
    cat: () => path(`M${P(cx - mw * 1.1, my - mw * 0.1)}Q${P(cx - mw * 0.55, my + mw * 0.6)} ${P(cx, my - mw * 0.1)}Q${P(cx + mw * 0.55, my + mw * 0.6)} ${P(cx + mw * 1.1, my - mw * 0.1)}`, { fill: 'none', ...ink(s * 0.024, { stroke: col }) }),
    flat: () => line(cx - mw * 0.7, my, cx + mw * 0.7, my, ink(s * 0.026, { stroke: col })),
    smirk: () => path(`M${P(cx - mw * 0.8, my + mw * 0.1)}Q${P(cx + mw * 0.2, my + mw * 0.5)} ${P(cx + mw * 1, my - mw * 0.35)}`, { fill: 'none', ...ink(s * 0.026, { stroke: col }) }),
    sad: () => path(`M${P(cx - mw * 0.9, my + mw * 0.45)}Q${P(cx, my - mw * 0.55)} ${P(cx + mw * 0.9, my + mw * 0.45)}`, { fill: 'none', ...ink(s * 0.026, { stroke: col }) }),
    teeth: () => g({}, rect(cx - mw * 1.1, my - mw * 0.5, mw * 2.2, mw * 1.1, { rx: mw * 0.45, fill: HL, ...ink(s * 0.022, { stroke: col }) }), line(cx - mw * 1.1, my + mw * 0.05, cx + mw * 1.1, my + mw * 0.05, ink(s * 0.012, { stroke: col }))),
    wavy: () => path(`M${P(cx - mw, my)}q${r(mw * 0.33)} ${r(-mw * 0.5)} ${r(mw * 0.66)} 0t${r(mw * 0.66)} 0t${r(mw * 0.66)} 0`, { fill: 'none', ...ink(s * 0.022, { stroke: col }) }),
    kiss: () => path(`M${P(cx - mw * 0.15, my - mw * 0.55)}Q${P(cx + mw * 0.6, my - mw * 0.35)} ${P(cx, my)}Q${P(cx + mw * 0.6, my + mw * 0.35)} ${P(cx - mw * 0.15, my + mw * 0.55)}`, { fill: 'none', ...ink(s * 0.024, { stroke: col }) }),
    yell: () => g({}, path(`M${P(cx - mw * 0.9, my - mw * 0.6)}Q${P(cx, my - mw * 0.9)} ${P(cx + mw * 0.9, my - mw * 0.6)}Q${P(cx + mw * 1.1, my + mw * 1.6)} ${P(cx, my + mw * 1.7)}Q${P(cx - mw * 1.1, my + mw * 1.6)} ${P(cx - mw * 0.9, my - mw * 0.6)}Z`, { fill: '#7a1f3d', ...ink(s * 0.022, { stroke: col }) }), ellipse(cx, my + mw * 1.1, mw * 0.55, mw * 0.4, { fill: '#ff6f91' })),
    none: () => null
  };
  out.push((m[mouth] || m.smile)());
  return g({}, out);
}

// ---------- the sticker itself
// def: { id, name, cat, tags, vb: [w, h], n: [...parts], css, colors (optional: which colors can be changed, first
// is the main one) }. Without colors, the colors used are found in order (outline last).
function walkColors(nodes, out) {
  for (const n of nodes) {
    const a = n[1] || {};
    for (const k of ['fill', 'stroke', 'stop-color']) {
      const v = a[k];
      if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) { const c = v.toLowerCase(); out.set(c, (out.get(c) || 0) + 1); }
    }
    if (Array.isArray(n[2])) walkColors(n[2], out);
  }
  return out;
}
function sticker(def) {
  const vb = def.vb || [200, 200];
  const used = walkColors(def.n, new Map());
  const skip = new Set([HL, SH, '#ffffff'].map(c => c.toLowerCase()));
  let colors = def.colors ? def.colors.map(c => c.toLowerCase()).filter(c => used.has(c)) : [...used.keys()].filter(c => !skip.has(c) && c !== OL);
  if (!def.colors && used.has(OL) && colors.length < 6) colors.push(OL);
  colors = [...new Set(colors)].slice(0, 6);
  return { id: def.id, name: def.name, cat: def.cat, tags: def.tags || [], vb, colors, n: def.n, css: (def.css || '').replace(/\s+/g, ' ').trim() };
}

// ---------- motion (CSS): a few ready moves, each its own keyframes
const MOVES = {
  bob: (cls, s = 3, dy = 8) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%,100%{transform:translateY(0)}50%{transform:translateY(-${dy}px)}}`,
  bounce: (cls, s = 1.2, dy = 18) => `.${cls}{animation:${cls}k ${s}s cubic-bezier(.3,0,.3,1) infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes ${cls}k{0%,100%{transform:translateY(0) scale(1.04,.96)}12%{transform:translateY(0) scale(.96,1.04)}45%{transform:translateY(-${dy}px) scale(1,1)}80%{transform:translateY(0) scale(1.06,.94)}}`,
  shadow: (cls, s = 3) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%,100%{transform:scale(1)}50%{transform:scale(.82)}}`,
  shadowBounce: (cls, s = 1.2) => `.${cls}{animation:${cls}k ${s}s cubic-bezier(.3,0,.3,1) infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%,100%,80%{transform:scale(1)}45%{transform:scale(.7)}}`,
  wiggle: (cls, s = 2.4, deg = 6) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 90%}@keyframes ${cls}k{0%,100%{transform:rotate(0)}25%{transform:rotate(-${deg}deg)}75%{transform:rotate(${deg}deg)}}`,
  swing: (cls, s = 2.2, deg = 10, origin = '50% 0%') => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:${origin}}@keyframes ${cls}k{0%,100%{transform:rotate(-${deg}deg)}50%{transform:rotate(${deg}deg)}}`,
  spin: (cls, s = 8) => `.${cls}{animation:${cls}k ${s}s linear infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{to{transform:rotate(360deg)}}`,
  spinBack: (cls, s = 8) => `.${cls}{animation:${cls}k ${s}s linear infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{to{transform:rotate(-360deg)}}`,
  pulse: (cls, s = 1.6, k = 1.1) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%,100%{transform:scale(1)}50%{transform:scale(${k})}}`,
  beat: (cls, s = 1.3) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 55%}@keyframes ${cls}k{0%,40%,100%{transform:scale(1)}12%{transform:scale(1.14)}24%{transform:scale(.97)}32%{transform:scale(1.08)}}`,
  blink: (cls = 'blink', s = 4) => `.${cls}{animation:${cls}k ${s}s infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%,44%,50%,100%{transform:scaleY(1)}47%{transform:scaleY(.1)}}`,
  twinkle: (cls, s = 1.8, delay = 0) => `.${cls}{animation:${cls}k ${s}s ease-in-out ${delay}s infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%,100%{transform:scale(.4) rotate(0);opacity:.3}50%{transform:scale(1) rotate(45deg);opacity:1}}`,
  fadeUp: (cls, s = 2.4, delay = 0, dy = 30) => `.${cls}{animation:${cls}k ${s}s ease-out ${delay}s infinite}@keyframes ${cls}k{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(-${dy}px);opacity:0}}`,
  slideX: (cls, s = 1.4, dx = 10) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%,100%{transform:translateX(0)}50%{transform:translateX(${dx}px)}}`,
  slideY: (cls, s = 1.4, dy = 10) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%,100%{transform:translateY(0)}50%{transform:translateY(${dy}px)}}`,
  wave: (cls, s = 1, deg = 22, origin = '20% 90%') => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:${origin}}@keyframes ${cls}k{0%,100%{transform:rotate(0)}50%{transform:rotate(-${deg}deg)}}`,
  pop: (cls, s = 2) => `.${cls}{animation:${cls}k ${s}s cubic-bezier(.2,.9,.3,1.3) infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%,70%,100%{transform:scale(1)}12%{transform:scale(1.14)}24%{transform:scale(.95)}34%{transform:scale(1.03)}}`,
  shine: (cls, s = 2.8, w = 200) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%,55%{transform:translateX(-${w}px)}85%,100%{transform:translateX(${w}px)}}`,
  flicker: (cls, s = 2) => `.${cls}{animation:${cls}k ${s}s steps(1,end) infinite}@keyframes ${cls}k{0%,100%{opacity:1}42%{opacity:.35}46%{opacity:1}48%{opacity:.5}52%{opacity:1}}`,
  drift: (cls, s = 6, dx = 14) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%,100%{transform:translateX(-${dx}px)}50%{transform:translateX(${dx}px)}}`,
  fall: (cls, s = 1.2, delay = 0, dy = 40) => `.${cls}{animation:${cls}k ${s}s linear ${delay}s infinite}@keyframes ${cls}k{0%{transform:translateY(-${dy / 2}px);opacity:0}15%{opacity:1}85%{opacity:1}100%{transform:translateY(${dy}px);opacity:0}}`,
  dash: (cls, s = 2, len = 300) => `.${cls}{stroke-dasharray:${len};animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%{stroke-dashoffset:${len}}50%,80%{stroke-dashoffset:0}100%{stroke-dashoffset:-${len}}}`,
  squash: (cls, s = 1.6) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes ${cls}k{0%,100%{transform:scale(1,1)}30%{transform:scale(1.08,.92)}60%{transform:scale(.95,1.05)}}`,
  tilt: (cls, s = 3, deg = 8) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%,100%{transform:rotate(-${deg}deg)}50%{transform:rotate(${deg}deg)}}`,
  peek: (cls, s = 3.2, dy = 40) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%,15%,100%{transform:translateY(${dy}px)}35%,80%{transform:translateY(0)}}`,
  zoom: (cls, s = 2.4) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%,100%{transform:scale(.9)}50%{transform:scale(1.05)}}`,
  rise: (cls, s = 3, dy = 16) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%,100%{transform:translateY(${dy}px) rotate(-3deg)}50%{transform:translateY(-${dy}px) rotate(3deg)}}`,
  shake: (cls, s = 0.9, dx = 3) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite}@keyframes ${cls}k{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-${dx}px)}40%,80%{transform:translateX(${dx}px)}}`,
  ring: (cls, s = 1.6, deg = 14) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 10%}@keyframes ${cls}k{0%,50%,100%{transform:rotate(0)}10%,30%{transform:rotate(-${deg}deg)}20%,40%{transform:rotate(${deg}deg)}}`,
  steam: (cls, s = 2.6, delay = 0) => `.${cls}{animation:${cls}k ${s}s ease-in-out ${delay}s infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes ${cls}k{0%{transform:translateY(6px) scale(.8);opacity:0}30%{opacity:.9}100%{transform:translateY(-18px) scale(1.1);opacity:0}}`,
  hue: (cls, s = 6) => `.${cls}{animation:${cls}k ${s}s linear infinite}@keyframes ${cls}k{to{filter:hue-rotate(360deg)}}`
};
const css = (...parts) => parts.join('');

module.exports = { flat, r, P, at, rad, OL, HL, SH, CHEEK, SW, node, g, path, circle, ellipse, rect, line, poly, pline, ink, fillInk, shade, shine, ground, anim,
  rrect, heart, star, roundPoly, burst, scallop, cloud, ghost, bubble, face, sticker, MOVES, css };
