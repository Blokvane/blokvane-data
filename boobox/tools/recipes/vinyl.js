// The kit for Boo Box's vinyl stickers: the look of a real sticker on a laptop. A white die-cut edge goes around the
// whole picture and a soft shadow sits under it. The words are outlines of the fonts that come with Blokvane (SIL Open
// Font License). The faces, characters, shapes and little drawings are all Blokvane's own, made here. Nothing is
// copied from anyone else's stickers.
'use strict';
const K = require('./kit');
const T = require('./text');
const { r, P, at, g, node, path, circle, ellipse, rect, line, poly, pline, ink, fillInk, anim, heart, star, roundPoly, scallop, cloud, rrect, sticker, MOVES: M, OL, HL, SH } = K;
const { blob, egg, smooth, curve, drop, leaf } = require('./make');

const WHITE = '#ffffff';
const DARK = '#1b1530';
const EDGE = 7;   // the white edge, in a 200 x 200 sticker

// =====================================================================  smaller outlines
// A path made smaller: relative moves, points on a grid of q units, short numbers. The words of a sticker are made of
// many curves: this halves them, and they look the same (checked against the full ones in a browser).
function minPath(d, q = 0.5) {
  const toks = d.match(/[MmLlHhVvCcQqZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) || [];
  const snap = v => Math.round(v / q) * q;
  const fmt = v => { let s = String(Math.round(v * 1000) / 1000); if (s === '-0') s = '0'; if (s.startsWith('0.')) s = s.slice(1); else if (s.startsWith('-0.')) s = '-' + s.slice(2); return s; };
  let out = '', i = 0, cx = 0, cy = 0, sx = 0, sy = 0, cmd = '', first = true, last = '';
  const nums = n => { const a = []; for (let k = 0; k < n; k++) a.push(parseFloat(toks[i++])); return a; };
  const join = (s, t) => s + (s && !/[a-zA-Z]$/.test(s) && !t.startsWith('-') && !(t.startsWith('.') && /\.\d*$/.test(s)) ? ' ' : '') + t;
  const emit = (c, vals) => {
    let s = c === last ? '' : c;
    for (const v of vals) s = join(s, fmt(v));
    out = /^[a-zA-Z]/.test(s) ? out + s : join(out, s);
    last = c;
  };
  while (i < toks.length) {
    const t = toks[i];
    if (/[a-zA-Z]/.test(t)) { cmd = t; i++; if (cmd === 'Z' || cmd === 'z') { out += 'z'; last = 'z'; cx = sx; cy = sy; continue; } }
    const abs = cmd === cmd.toUpperCase(), C = cmd.toUpperCase();
    if (C === 'M') {
      let [x, y] = nums(2); if (!abs) { x += cx; y += cy; }
      x = snap(x); y = snap(y);
      if (first) { out += 'M' + join(fmt(x), fmt(y)); last = 'M'; first = false; } else { last = ''; emit('m', [x - cx, y - cy]); }
      cx = sx = x; cy = sy = y; cmd = abs ? 'L' : 'l';
    } else if (C === 'L') {
      let [x, y] = nums(2); if (!abs) { x += cx; y += cy; }
      x = snap(x); y = snap(y);
      if (x === cx) emit('v', [y - cy]); else if (y === cy) emit('h', [x - cx]); else emit('l', [x - cx, y - cy]);
      cx = x; cy = y;
    } else if (C === 'H') { let [x] = nums(1); if (!abs) x += cx; x = snap(x); emit('h', [x - cx]); cx = x; }
    else if (C === 'V') { let [y] = nums(1); if (!abs) y += cy; y = snap(y); emit('v', [y - cy]); cy = y; }
    else if (C === 'C') {
      let v = nums(6); if (!abs) v = v.map((n, k) => n + (k % 2 ? cy : cx));
      v = v.map(snap);
      emit('c', [v[0] - cx, v[1] - cy, v[2] - cx, v[3] - cy, v[4] - cx, v[5] - cy]); cx = v[4]; cy = v[5];
    } else if (C === 'Q') {
      let v = nums(4); if (!abs) v = v.map((n, k) => n + (k % 2 ? cy : cx));
      v = v.map(snap);
      emit('q', [v[0] - cx, v[1] - cy, v[2] - cx, v[3] - cy]); cx = v[2]; cy = v[3];
    } else throw new Error('minPath: no ' + cmd);
  }
  return out;
}

// =====================================================================  words
// the fonts: anton (tall), unbounded (wide), fredoka (round), outfit (clean), alfa (slab), caveat (hand), pacifico
// (script), playfair (serif), playfairi (serif italic), neon, vibes (fancy script)
const measure = (t, f, s) => T.words(t, { font: f, size: s, cx: 0, cy: 0 }).w;
// one line of words as an outline: { d, w, h }, the middle of its capitals at cx, cy
function wordLine(t, o) {
  const x = T.words(t, { font: o.f || 'anton', size: o.s, cx: o.cx, cy: o.cy, spacing: o.sp || 0, maxW: o.maxW });
  return { d: minPath(x.d, o.s >= 36 ? 0.5 : 0.25), w: x.w, h: x.h };
}
// A stack of lines, each its own size, font and color, made to fit maxW and centered on cx, cy. A line:
// { t, f: font, s: capital height, c: fill, o: outline color (false: none), w: outline width, tilt, gap (space above),
//   grad: [top, bottom] colors, drop: color of a 3D shadow under the letters, sp: letter spacing, dx: move sideways }
// Returns { n: parts, box: [x, y, w, h], at: [{ cx, cy, w, h }] }
let gradN = 0;
function words(lines, o = {}) {
  const cx = o.cx == null ? 100 : o.cx, cy = o.cy == null ? 100 : o.cy, maxW = o.maxW || 170;
  const L = lines.filter(Boolean).map(l => typeof l === 'string' ? { t: l } : l).map(l => ({ f: 'anton', s: 30, c: '#ffffff', ...o.line, ...l }));
  // the size each line can have (it shrinks to fit the width)
  for (const l of L) { const w = measure(l.t, l.f, l.s) + Math.max(0, l.t.length - 1) * (l.sp || 0); l.k = Math.min(1, (l.maxW || maxW) / Math.max(1, w)); l.h = l.s * l.k; l.mw = Math.min(w, l.maxW || maxW); }
  const gapOf = (l, i) => i === 0 ? 0 : l.gap != null ? l.gap : Math.max(4, Math.min(l.h, L[i - 1].h) * 0.34);
  const total = L.reduce((a, l, i) => a + l.h + gapOf(l, i), 0);
  let y = cy - total / 2;
  const n = [], places = [];
  const defs = [];
  L.forEach((l, i) => {
    y += gapOf(l, i);
    const lcy = y + l.h / 2, lcx = cx + (l.dx || 0);
    const wl = wordLine(l.t, { f: l.f, s: l.s * l.k, cx: lcx, cy: lcy, sp: l.sp });
    // (a thinner outline for the joined-up and handwritten fonts: their strokes are thin)
    const thin = /^(pacifico|caveat|vibes|playfairi|playfair|neon)$/.test(l.f);
    const ow = l.o === false ? 0 : l.w != null ? l.w : Math.max(2, Math.min(thin ? 3.6 : 5.5, l.h * (thin ? 0.1 : 0.14)));
    let fill = l.c;
    if (l.grad) { const id = 'tg' + (++gradN % 900); defs.push(node('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, [node('stop', { offset: 0, 'stop-color': l.grad[0] }), node('stop', { offset: 1, 'stop-color': l.grad[1] })])); fill = `url(#${id})`; }
    const parts = [];
    if (l.drop) parts.push(path(wl.d, { fill: l.drop, stroke: l.drop, 'stroke-width': ow + 1, 'stroke-linejoin': 'round', transform: `translate(${r(l.h * 0.05)} ${r(l.h * 0.11)})` }));
    parts.push(path(wl.d, ow ? { fill, stroke: l.o || OL, 'stroke-width': r(ow), 'stroke-linejoin': 'round', 'paint-order': 'stroke' } : { fill }));
    n.push(l.tilt ? g({ transform: `rotate(${l.tilt} ${r(lcx)} ${r(lcy)})` }, parts) : parts.length > 1 ? g({}, parts) : parts[0]);
    places.push({ cx: lcx, cy: lcy, w: wl.w, h: wl.h });
    y += l.h;
  });
  const w = Math.max(...places.map(p => p.w));
  return { n: defs.length ? [node('defs', {}, defs), ...n] : n, box: [cx - w / 2, cy - total / 2, w, total], at: places };
}

// words anywhere on the sticker (a label on a key, a day on a calendar): the parts of a stack at cx, cy
const label = (lines, cx, cy, maxW = 120, line) => words([].concat(lines), { cx, cy, maxW, line }).n;

// =====================================================================  the die-cut edge
// parts that the edge leaves out (a faint glow, motion lines that float apart from the sticker)
const LOOSE = new WeakSet();
const loose = n => { if (n) LOOSE.add(n); return n; };
const GEOM = ['d', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'width', 'height', 'points', 'x1', 'y1', 'x2', 'y2', 'transform', 'class'];
const SKIP = new Set(['defs', 'linearGradient', 'radialGradient', 'stop', 'clipPath', 'mask', 'animate', 'animateTransform', 'text', 'tspan']);
const pick = (a, keys) => { const o = {}; for (const k of keys) if (a[k] !== undefined) o[k] = a[k]; return o; };
const coarseMemo = new Map();
const coarse = d => { if (/[AaSsTt]/.test(d)) return d; if (coarseMemo.has(d)) return coarseMemo.get(d); let c = d; try { c = minPath(d, 1); } catch (e) { c = d; } if (c.length > d.length) c = d; coarseMemo.set(d, c); return c; };
// the outline of the parts, made w wider all around, in one color
function silhouette(nodes, w, col) {
  const out = [];
  for (const n of nodes) {
    if (!n || LOOSE.has(n)) continue;
    const [tag, a = {}, kids] = n;
    if (SKIP.has(tag) || a['clip-path'] || a.mask) continue;
    if (tag === 'g') { const k = silhouette(Array.isArray(kids) ? kids : [], w, col); if (k.length) out.push(node('g', pick(a, ['transform', 'class']), k)); continue; }
    // (inside details add nothing to the outline: see-through shading and shine, and small dots)
    if ((a.opacity != null && +a.opacity < 0.9) || ((tag === 'circle' || tag === 'ellipse') && Math.max(+a.r || 0, +a.rx || 0, +a.ry || 0) < 7 && !a.stroke)) continue;
    const sw = a.stroke && a.stroke !== 'none' ? (+a['stroke-width'] || 1) : 0;
    const geo = pick(a, GEOM);
    // (the outline is a thick line: a coarser copy of the path looks the same and is much shorter)
    if (geo.d) geo.d = coarse(geo.d);
    out.push(node(tag, { ...geo, fill: a.fill === 'none' ? 'none' : col, stroke: col, 'stroke-width': r(sw + 2 * w), 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  }
  return out;
}
// the sticker's picture with its white edge and its shadow (o: { edge, shadow: false, sy, so })
function vinyl(parts, o = {}) {
  const w = o.edge == null ? EDGE : o.edge;
  const flatParts = K.flat(parts);
  const out = [];
  if (o.shadow !== false) out.push(g({ transform: `translate(${o.sx || 1.5} ${o.sy == null ? 5 : o.sy})`, opacity: o.so || 0.2 }, silhouette(flatParts, w, DARK)));
  out.push(g({}, silhouette(flatParts, w, WHITE)));
  out.push(...flatParts);
  return out;
}

// =====================================================================  shapes behind the words
// box: [x, y, w, h] of the words; pad around them. Each gives a path.
const SHAPES = {
  pill: (b, p = 12) => rrect(b[0] - p * 1.3, b[1] - p, b[2] + p * 2.6, b[3] + p * 2, (b[3] + p * 2) / 2),
  box: (b, p = 12, rr = 14) => rrect(b[0] - p, b[1] - p, b[2] + p * 2, b[3] + p * 2, rr),
  card: (b, p = 14) => rrect(b[0] - p, b[1] - p, b[2] + p * 2, b[3] + p * 2, 8),
  bubble: (b, p = 12) => K.bubble(b[0] - p * 1.2, b[1] - p, b[2] + p * 2.4, b[3] + p * 2, Math.min(22, (b[3] + p * 2) / 2.4), 'left'),
  bubbleR: (b, p = 12) => K.bubble(b[0] - p * 1.2, b[1] - p, b[2] + p * 2.4, b[3] + p * 2, Math.min(22, (b[3] + p * 2) / 2.4), 'right'),
  cloud: (b, p = 14) => K.cloud(b[0] - p * 1.6, b[1] + b[3] + p, b[2] + p * 3.2, (b[3] + p * 2) * 1.25),
  tag: (b, p = 12) => { const x0 = b[0] - p, x1 = b[0] + b[2] + p, y0 = b[1] - p, y1 = b[1] + b[3] + p, m = (y0 + y1) / 2, k = (y1 - y0) / 2; return `M${P(x0 + 8, y0)}H${r(x1)}L${P(x1 + k * 0.8, m)}L${P(x1, y1)}H${r(x0 + 8)}Q${P(x0, y1)} ${P(x0, y1 - 8)}V${r(y0 + 8)}Q${P(x0, y0)} ${P(x0 + 8, y0)}Z`; },
  ticket: (b, p = 12) => { const x0 = b[0] - p * 1.4, x1 = b[0] + b[2] + p * 1.4, y0 = b[1] - p, y1 = b[1] + b[3] + p, m = (y0 + y1) / 2, n = Math.min(10, (y1 - y0) / 5); return `M${P(x0, y0)}H${r(x1)}V${r(m - n)}A${r(n)} ${r(n)} 0 0 0 ${P(x1, m + n)}V${r(y1)}H${r(x0)}V${r(m + n)}A${r(n)} ${r(n)} 0 0 0 ${P(x0, m - n)}Z`; },
  banner: (b, p = 10) => { const x0 = b[0] - p * 1.6, x1 = b[0] + b[2] + p * 1.6, y0 = b[1] - p, y1 = b[1] + b[3] + p, m = (y0 + y1) / 2, k = 14; return `M${P(x0 - k, y0)}H${r(x1 + k)}L${P(x1, m)}L${P(x1 + k, y1)}H${r(x0 - k)}L${P(x0, m)}Z`; },
  burst: (b, p = 14) => { const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, rr = Math.max(b[2], b[3]) / 2 + p; return star(cx, cy, rr * 1.08, rr * 0.9, 18, -90); },
  seal: (b, p = 14) => { const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, rr = Math.max(b[2], b[3]) / 2 + p; return scallop(cx, cy, rr, 16, 0.06); },
  circle: (b, p = 14) => { const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, rr = Math.hypot(b[2], b[3]) / 2 + p * 0.4; return `M${P(cx - rr, cy)}a${r(rr)} ${r(rr)} 0 1 0 ${r(rr * 2)} 0a${r(rr)} ${r(rr)} 0 1 0 ${r(-rr * 2)} 0Z`; },
  heart: (b, p = 16) => { const cx = b[0] + b[2] / 2, s = Math.max(b[2] + p * 2.4, (b[3] + p * 2) * 1.5); return heart(cx, b[1] + b[3] / 2 + s * 0.1, s); },
  star: (b, p = 16) => { const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2 + 4, rr = Math.max(b[2] * 0.75, b[3]) / 2 + p * 1.9; return star(cx, cy, rr, rr * 0.62, 5, -90, rr * 0.12); },
  sign: (b, p = 12) => { const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, s = (b[2] + b[3]) / 2 + p; return roundPoly([[cx, cy - s], [cx + s, cy], [cx, cy + s], [cx - s, cy]], 10); },
  warn: (b, p = 12) => { const cx = b[0] + b[2] / 2, top = b[1] - p * 3.4, bot = b[1] + b[3] + p, half = (bot - top) * 0.62 + b[2] * 0.1; return roundPoly([[cx, top], [cx + half, bot], [cx - half, bot]], 10); },
  shield: (b, p = 14) => { const x0 = b[0] - p, x1 = b[0] + b[2] + p, y0 = b[1] - p * 1.2, y1 = b[1] + b[3] + p, cx = (x0 + x1) / 2; return `M${P(x0, y0)}H${r(x1)}V${r(y1 - 8)}Q${P(x1, y1 + 14)} ${P(cx, y1 + 26)}Q${P(x0, y1 + 14)} ${P(x0, y1 - 8)}Z`; },
  key: (b, p = 14) => rrect(b[0] - p, b[1] - p, b[2] + p * 2, b[3] + p * 2, 12),
  torn: (b, p = 12) => { const x0 = b[0] - p * 1.3, x1 = b[0] + b[2] + p * 1.3, y0 = b[1] - p, y1 = b[1] + b[3] + p; let d = `M${P(x0, y0)}`; const n = Math.max(6, Math.round((x1 - x0) / 12)); for (let i = 1; i <= n; i++) d += `L${P(x0 + (x1 - x0) * i / n, y0 + (i % 2 ? -3 : 2))}`; d += `L${P(x1 + 2, (y0 + y1) / 2)}`; for (let i = n; i >= 0; i--) d += `L${P(x0 + (x1 - x0) * i / n, y1 + (i % 2 ? 3 : -2))}`; return d + 'Z'; },
  octagon: (b, p = 12) => { const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2, rr = Math.max(b[2], b[3] * 1.6) / 2 + p; return roundPoly(Array.from({ length: 8 }, (_, i) => at(cx, cy, rr, 22.5 + i * 45)), 6); },
  none: () => ''
};
// how far a shape reaches around the words (x0, y0, x1, y1), for fitting the sticker in its box
function extentOf(kind, b, pad) {
  const p = pad == null ? 12 : pad, cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2;
  const round = rr => [cx - rr, cy - rr, cx + rr, cy + rr];
  switch (kind) {
    case 'burst': { const rr = (Math.max(b[2], b[3]) / 2 + (pad == null ? 14 : pad)) * 1.08; return round(rr); }
    case 'seal': { const rr = (Math.max(b[2], b[3]) / 2 + (pad == null ? 14 : pad)) * 1.14; return round(rr); }
    case 'circle': return round(Math.hypot(b[2], b[3]) / 2 + (pad == null ? 14 : pad) * 0.4);
    case 'heart': { const s2 = Math.max(b[2] + (pad == null ? 16 : pad) * 2.4, (b[3] + (pad == null ? 16 : pad) * 2) * 1.5); return [cx - s2 / 2, cy + s2 * 0.1 - s2 * 0.48, cx + s2 / 2, cy + s2 * 0.1 + s2 * 0.45]; }
    case 'star': { const rr = Math.max(b[2] * 0.75, b[3]) / 2 + (pad == null ? 16 : pad) * 1.9; return [cx - rr * 0.95, cy + 4 - rr, cx + rr * 0.95, cy + 4 + rr * 0.81]; }
    case 'sign': return round((b[2] + b[3]) / 2 + p);
    case 'octagon': return round(Math.max(b[2], b[3] * 1.6) / 2 + p);
    case 'warn': { const top = b[1] - p * 3.4, bot = b[1] + b[3] + p, half = (bot - top) * 0.62 + b[2] * 0.1; return [cx - half, top, cx + half, bot]; }
    case 'cloud': return [b[0] - (pad == null ? 14 : pad) * 1.7, b[1] + b[3] + (pad == null ? 14 : pad) - (b[3] + (pad == null ? 14 : pad) * 2) * 1.25 * 1.12, b[0] + b[2] + (pad == null ? 14 : pad) * 1.7, b[1] + b[3] + (pad == null ? 14 : pad)];
    case 'bubble': case 'bubbleR': return [b[0] - p * 1.2, b[1] - p, b[0] + b[2] + p * 1.2, b[1] + b[3] + p + 24];
    case 'pill': return [b[0] - p * 1.3, b[1] - p, b[0] + b[2] + p * 1.3, b[1] + b[3] + p];
    case 'tag': return [b[0] - p, b[1] - p, b[0] + b[2] + p + (b[3] + p * 2) * 0.4, b[1] + b[3] + p];
    case 'banner': return [b[0] - p * 1.6 - 14, b[1] - p, b[0] + b[2] + p * 1.6 + 14, b[1] + b[3] + p];
    case 'ticket': case 'torn': return [b[0] - p * 1.4, b[1] - p - 3, b[0] + b[2] + p * 1.4, b[1] + b[3] + p + 3];
    case 'shield': return [b[0] - p, b[1] - p * 1.2, b[0] + b[2] + p, b[1] + b[3] + p + 26];
    case 'none': return [b[0], b[1], b[0] + b[2], b[1] + b[3]];
    default: return [b[0] - p, b[1] - p, b[0] + b[2] + p, b[1] + b[3] + p];
  }
}
// the shape, filled, with a dark outline, and a lighter band or second color when asked (o.inner: a line inside)
function shapeBehind(kind, b, fill, o = {}) {
  const d = (SHAPES[kind] || SHAPES.box)(b, o.pad);
  if (!d) return [];
  const out = [path(d, { fill, ...ink(o.ow || 5, { stroke: o.ol || OL }) })];
  if (o.inner) out.push(path((SHAPES[kind] || SHAPES.box)([b[0] + 5, b[1] + 5, b[2] - 10, b[3] - 10], o.pad), { fill: 'none', stroke: o.inner, 'stroke-width': 2.5, 'stroke-dasharray': o.dash || '6 5', opacity: 0.85 }));
  return out;
}

// =====================================================================  little drawings (each at cx, cy, about s across)
const ol = (w = 4) => ink(w);
const I = {
  sparkle: (cx, cy, s, c = '#ffd43b', cls) => anim(cls || null, path(star(cx, cy, s / 2, s / 7, 4, -90), { fill: c, ...ol(2.5) })),
  heart: (cx, cy, s, c = '#ff4d6d') => path(heart(cx, cy, s), { fill: c, ...ol(3.5) }),
  star: (cx, cy, s, c = '#ffd43b') => path(star(cx, cy, s / 2, s / 4.4, 5, -90, s / 14), { fill: c, ...ol(3.5) }),
  dot: (cx, cy, s, c = '#ff8fab') => circle(cx, cy, s / 2, { fill: c, ...ol(2.5) }),
  bolt: (cx, cy, s, c = '#ffd43b') => path(`M${P(cx + s * 0.1, cy - s * 0.5)}L${P(cx - s * 0.3, cy + s * 0.08)}H${r(cx + s * 0.02)}L${P(cx - s * 0.12, cy + s * 0.5)}L${P(cx + s * 0.32, cy - s * 0.1)}H${r(cx)}Z`, { fill: c, ...ol(3.5) }),
  flame: (cx, cy, s, c = '#ff922b', c2 = '#ffd43b') => g({}, path(`M${P(cx, cy - s * 0.55)}C${P(cx + s * 0.1, cy - s * 0.25)} ${P(cx + s * 0.45, cy - s * 0.15)} ${P(cx + s * 0.42, cy + s * 0.15)}C${P(cx + s * 0.4, cy + s * 0.45)} ${P(cx + s * 0.2, cy + s * 0.55)} ${P(cx, cy + s * 0.55)}C${P(cx - s * 0.25, cy + s * 0.55)} ${P(cx - s * 0.42, cy + s * 0.4)} ${P(cx - s * 0.42, cy + s * 0.12)}C${P(cx - s * 0.42, cy - s * 0.1)} ${P(cx - s * 0.25, cy - s * 0.2)} ${P(cx - s * 0.2, cy - s * 0.38)}C${P(cx - s * 0.08, cy - s * 0.25)} ${P(cx - s * 0.06, cy - s * 0.4)} ${P(cx, cy - s * 0.55)}Z`, { fill: c, ...ol(3.5) }),
    path(`M${P(cx, cy - s * 0.05)}C${P(cx + s * 0.18, cy + s * 0.12)} ${P(cx + s * 0.22, cy + s * 0.42)} ${P(cx, cy + s * 0.45)}C${P(cx - s * 0.22, cy + s * 0.42)} ${P(cx - s * 0.2, cy + s * 0.16)} ${P(cx, cy - s * 0.05)}Z`, { fill: c2 })),
  check: (cx, cy, s, c = '#40c057') => g({}, circle(cx, cy, s / 2, { fill: c, ...ol(4) }), path(`M${P(cx - s * 0.22, cy + s * 0.02)}L${P(cx - s * 0.06, cy + s * 0.18)}L${P(cx + s * 0.24, cy - s * 0.16)}`, { fill: 'none', stroke: '#ffffff', 'stroke-width': r(s * 0.12), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })),
  cross: (cx, cy, s, c = '#fa5252') => g({}, circle(cx, cy, s / 2, { fill: c, ...ol(4) }), path(`M${P(cx - s * 0.17, cy - s * 0.17)}L${P(cx + s * 0.17, cy + s * 0.17)}M${P(cx + s * 0.17, cy - s * 0.17)}L${P(cx - s * 0.17, cy + s * 0.17)}`, { stroke: '#ffffff', 'stroke-width': r(s * 0.12), 'stroke-linecap': 'round' })),
  music: (cx, cy, s, c = OL) => g({}, path(`M${P(cx - s * 0.1, cy + s * 0.3)}V${r(cy - s * 0.4)}L${P(cx + s * 0.32, cy - s * 0.5)}V${r(cy + s * 0.2)}`, { fill: 'none', stroke: c, 'stroke-width': r(s * 0.09), 'stroke-linejoin': 'round' }), ellipse(cx - s * 0.22, cy + s * 0.32, s * 0.14, s * 0.11, { fill: c }), ellipse(cx + s * 0.2, cy + s * 0.22, s * 0.14, s * 0.11, { fill: c })),
  drop: (cx, cy, s, c = '#74c0fc') => path(drop(cx, cy, s / 2), { fill: c, ...ol(3) }),
  swirl: (cx, cy, s, c = OL) => path(`M${P(cx - s * 0.4, cy)}C${P(cx - s * 0.4, cy - s * 0.45)} ${P(cx + s * 0.35, cy - s * 0.45)} ${P(cx + s * 0.3, cy)}C${P(cx + s * 0.25, cy + s * 0.32)} ${P(cx - s * 0.15, cy + s * 0.3)} ${P(cx - s * 0.1, cy + s * 0.02)}`, { fill: 'none', stroke: c, 'stroke-width': r(s * 0.08), 'stroke-linecap': 'round' }),
  rays: (cx, cy, rr, n = 8, len = 10, c = OL, start = -90, spread = 360) => path(Array.from({ length: n }, (_, i) => { const a = start + (spread === 360 ? i * 360 / n : -spread / 2 + i * spread / (n - 1)); const p1 = at(cx, cy, rr, a), p2 = at(cx, cy, rr + len, a); return `M${P(...p1)}L${P(...p2)}`; }).join(''), { stroke: c, 'stroke-width': 4.5, 'stroke-linecap': 'round' }),
  // a round coffee cup with a face
  cup: (cx, cy, s, o = {}) => {
    const k = s / 100, x = v => cx + v * k, y = v => cy + v * k;
    return g({}, path(`M${P(x(26), y(-18))}C${P(x(50), y(-18))} ${P(x(50), y(18))} ${P(x(24), y(16))}`, { fill: 'none', ...ink(12 * k + 2) }), path(`M${P(x(26), y(-18))}C${P(x(46), y(-18))} ${P(x(46), y(16))} ${P(x(24), y(14))}`, { fill: 'none', stroke: o.cup || '#ffffff', 'stroke-width': r(7 * k), 'stroke-linecap': 'round' }),
      path(`M${P(x(-38), y(-30))}H${r(x(38))}L${P(x(32), y(32))}Q${P(x(30), y(44))} ${P(x(18), y(44))}H${r(x(-18))}Q${P(x(-30), y(44))} ${P(x(-32), y(32))}Z`, { fill: o.cup || '#ffffff', ...ink(5 * k + 1.5) }),
      path(`M${P(x(-37), y(-14))}H${r(x(37))}L${P(x(35.5), y(2))}H${r(x(-35.5))}Z`, { fill: o.band || '#c8875a' }),
      ellipse(x(0), y(-30), 38 * k, 8 * k, { fill: o.coffee || '#6f4e37', ...ink(4 * k + 1) }),
      o.face === false ? null : K.face(x(0), y(16), 52 * k, { eyes: 'dot', mouth: 'smile', ...o.faceO }));
  },
  // steam that rises (needs M.steam css for its classes)
  steam: (cx, cy, s, cls = 'st', c = '#adb5bd') => [0, 1, 2].map(i => loose(anim(cls + i, path(`M${P(cx - s * 0.3 + i * s * 0.3, cy)}q${r(-s * 0.12)} ${r(-s * 0.18)} 0 ${r(-s * 0.36)}`, { fill: 'none', stroke: c, 'stroke-width': r(s * 0.09), 'stroke-linecap': 'round' })))),
  steamCss: (cls = 'st') => M.steam(cls + '0', 2.2, 0) + M.steam(cls + '1', 2.2, 0.7) + M.steam(cls + '2', 2.2, 1.4),
  // a light bulb
  bulb: (cx, cy, s, c = '#ffe066') => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, path(`M${P(x(0), y(-50))}C${P(x(-34), y(-50))} ${P(x(-48), y(-24))} ${P(x(-44), y(-2))}C${P(x(-40), y(18))} ${P(x(-22), y(26))} ${P(x(-20), y(38))}H${r(x(20))}C${P(x(22), y(26))} ${P(x(40), y(18))} ${P(x(44), y(-2))}C${P(x(48), y(-24))} ${P(x(34), y(-50))} ${P(x(0), y(-50))}Z`, { fill: c, ...ink(5 * k + 1.5) }),
    rect(x(-20), y(38), 40 * k, 20 * k, { rx: 4 * k, fill: '#adb5bd', ...ink(4 * k + 1) }), path(`M${P(x(-20), y(46))}H${r(x(20))}`, { stroke: OL, 'stroke-width': r(3 * k + 0.5) }), path(`M${P(x(-9), y(58))}Q${P(x(0), y(68))} ${P(x(9), y(58))}`, { fill: '#868e96', ...ink(3 * k + 1) }), K.shine(x(-22), y(-26), 5 * k, 11 * k, 30, 0.7)); },
  // an alarm clock
  alarm: (cx, cy, s, c = '#ff6b5e') => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, circle(x(-30), y(-38), 15 * k, { fill: c, ...ink(4 * k + 1) }), circle(x(30), y(-38), 15 * k, { fill: c, ...ink(4 * k + 1) }), path(`M${P(x(-28), y(40))}L${P(x(-36), y(52))}M${P(x(28), y(40))}L${P(x(36), y(52))}`, { stroke: OL, 'stroke-width': r(6 * k + 1), 'stroke-linecap': 'round' }),
    circle(x(0), y(4), 44 * k, { fill: c, ...ink(5 * k + 1.5) }), circle(x(0), y(4), 33 * k, { fill: '#ffffff', ...ink(3 * k + 1) }), path(`M${P(x(0), y(4))}V${r(y(-18))}M${P(x(0), y(4))}L${P(x(15), y(12))}`, { stroke: OL, 'stroke-width': r(5 * k + 0.5), 'stroke-linecap': 'round' }), circle(x(0), y(4), 3.5 * k, { fill: OL })); },
  // a laptop (screen color sc) with a face on the screen
  laptop: (cx, cy, s, o = {}) => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, rect(x(-44), y(-36), 88 * k, 60 * k, { rx: 7 * k, fill: o.body || '#495057', ...ink(5 * k + 1.5) }), rect(x(-36), y(-28), 72 * k, 44 * k, { rx: 4 * k, fill: o.screen || '#74c0fc' }),
    path(`M${P(x(-56), y(30))}H${r(x(56))}L${P(x(48), y(40))}H${r(x(-48))}Z`, { fill: o.body || '#868e96', ...ink(4.5 * k + 1.5) }), o.face === false ? null : K.face(x(0), y(-6), 40 * k, { eyes: 'dot', mouth: 'smile', cheeks: false, ...o.faceO })); },
  // a magnifying glass
  lens: (cx, cy, s, c = '#ff922b') => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, line(x(16), y(16), x(46), y(46), ink(22 * k + 2)), line(x(16), y(16), x(46), y(46), { stroke: c, 'stroke-width': r(13 * k), 'stroke-linecap': 'round' }), circle(x(-10), y(-10), 34 * k, { fill: '#d0ebff', ...ink(8 * k + 1) }), circle(x(-10), y(-10), 34 * k, { fill: 'none', stroke: '#adb5bd', 'stroke-width': r(2.5 * k) }), K.shine(x(-22), y(-22), 6 * k, 10 * k, 40, 0.8)); },
  // a footprint (a shoe print)
  // a shoe print (sole, heel and tread; left: the other foot) and a bare footprint with toes
  shoe: (cx, cy, s, c = OL, rot = 0, left = false) => { const k = s / 100; return g({ transform: `translate(${r(cx)} ${r(cy)}) rotate(${rot}) scale(${r(left ? -k : k)} ${r(k)})` }, path('M-2 -50C18 -52 28 -34 26 -14C24 2 16 12 14 20C12 30-12 30-16 20C-22 4-30-18-26-34C-22-46-12-50-2-50Z', { fill: c }), path('M-12 30C2 28 12 34 12 44C12 54 2 58-6 56C-18 54-22 36-12 30Z', { fill: c }), loose(path('M-20 -32H20M-22 -20H22M-20 -8H18M-14 4H14M-10 40H6M-10 48H4', { stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.45 }))); },
  foot: (cx, cy, s, c = OL, rot = 0, left = false) => { const k = s / 100, toe = (x, y, rr) => circle(x, y, rr, { fill: c, stroke: c, 'stroke-width': 1 }); return g({ transform: `translate(${r(cx)} ${r(cy)}) rotate(${rot}) scale(${r(left ? -k : k)} ${r(k)})` }, path('M-2 -24C18 -26 26 -8 22 14C18 34 14 50-2 50C-18 50-22 34-22 18C-22 2-22-22-2-24Z', { fill: c }), toe(-14, -38, 9), toe(2, -44, 7.5), toe(15, -39, 6.5), toe(24, -29, 5.5), toe(29, -17, 5)); },
  // a fingerprint (rings, one cut)
  print: (cx, cy, s, c = '#e03131') => { const k = s / 100, parts = []; for (let i = 0; i < 6; i++) { const rr = (8 + i * 7) * k; parts.push(path(`M${P(cx - rr, cy + rr * 0.3)}A${r(rr)} ${r(rr * 1.25)} 0 1 1 ${P(cx + rr, cy + rr * 0.3)}`, { fill: 'none', stroke: c, 'stroke-width': r(3.5 * k + 0.5), 'stroke-linecap': 'round', 'stroke-dasharray': i % 2 ? `${r(30 * k)} ${r(6 * k)}` : undefined })); } return g({}, parts); },
  // a folder
  folder: (cx, cy, s, c = '#ffc93a', label) => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, path(`M${P(x(-48), y(-30))}Q${P(x(-48), y(-38))} ${P(x(-40), y(-38))}H${r(x(-12))}L${P(x(-4), y(-28))}H${r(x(40))}Q${P(x(48), y(-28))} ${P(x(48), y(-20))}V${r(y(32))}Q${P(x(48), y(40))} ${P(x(40), y(40))}H${r(x(-40))}Q${P(x(-48), y(40))} ${P(x(-48), y(32))}Z`, { fill: c, ...ink(4.5 * k + 1.5) }),
    path(`M${P(x(-48), y(-12))}H${r(x(48))}`, { stroke: OL, 'stroke-width': r(3 * k + 1), opacity: 0.35 })); },
  // a key cap of a keyboard
  keycap: (cx, cy, w, h, c = '#f1f3f5') => g({}, path(rrect(cx - w / 2, cy - h / 2 + 6, w, h, 10), { fill: '#adb5bd', ...ink(4.5) }), path(rrect(cx - w / 2, cy - h / 2, w, h - 4, 10), { fill: c, ...ink(4.5) }), path(rrect(cx - w / 2 + 8, cy - h / 2 + 5, w - 16, h - 18, 7), { fill: '#ffffff', opacity: 0.6 })),
  // a battery (part: 0 to 1 full)
  battery: (cx, cy, s, part = 0.2, c = '#fa5252') => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, rect(x(-46), y(-24), 86 * k, 48 * k, { rx: 9 * k, fill: '#ffffff', ...ink(5 * k + 1.5) }), rect(x(40), y(-10), 10 * k, 20 * k, { rx: 3 * k, fill: OL }), rect(x(-38), y(-16), 70 * k * Math.max(0.08, part), 32 * k, { rx: 5 * k, fill: c })); },
  // a pushpin, a paper clip and a piece of tape (for notes)
  pin: (cx, cy, s, c = '#ff4d4d') => { const k = s / 100; return g({ transform: `translate(${r(cx)} ${r(cy)}) scale(${r(k)})` }, path('M0 18V44', { stroke: '#868e96', 'stroke-width': 6, 'stroke-linecap': 'round' }), path('M-26 18H26L18 2H-18Z', { fill: c, ...ink(4.5) }), rect(-12, -34, 24, 38, { rx: 4, fill: c, ...ink(4.5) }), ellipse(0, -38, 26, 10, { fill: c, ...ink(4.5) }), K.shine(-6, -20, 2.5, 9, 0, 0.6)); },
  clip: (cx, cy, s, c = '#adb5bd') => { const k = s / 100; return g({ transform: `translate(${r(cx)} ${r(cy)}) scale(${r(k)})` }, path('M-8 40V-30Q-8 -44 6 -44Q20 -44 20 -30V30Q20 40 10 40Q0 40 0 30V-22', { fill: 'none', ...ink(13) }), path('M-8 40V-30Q-8 -44 6 -44Q20 -44 20 -30V30Q20 40 10 40Q0 40 0 30V-22', { fill: 'none', stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })); },
  tape: (cx, cy, w, h, c = '#ffd8a8', rot = -6) => g({ transform: `rotate(${rot} ${r(cx)} ${r(cy)})` }, path(`M${P(cx - w / 2, cy - h / 2)}L${P(cx - w / 2 + 3, cy - h / 4)}L${P(cx - w / 2, cy)}L${P(cx - w / 2 + 3, cy + h / 4)}L${P(cx - w / 2, cy + h / 2)}H${r(cx + w / 2)}L${P(cx + w / 2 - 3, cy + h / 4)}L${P(cx + w / 2, cy)}L${P(cx + w / 2 - 3, cy - h / 4)}L${P(cx + w / 2, cy - h / 2)}Z`, { fill: c, opacity: 0.92, stroke: OL, 'stroke-width': 2, 'stroke-opacity': 0.35 })),
  // a book (closed), a pencil, a graduation cap, a test tube, an atom, a trophy and a crown
  book: (cx, cy, s, c = '#4dabf7') => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, path(`M${P(x(-40), y(-46))}H${r(x(34))}Q${P(x(40), y(-46))} ${P(x(40), y(-40))}V${r(y(46))}H${r(x(-32))}Q${P(x(-40), y(46))} ${P(x(-40), y(38))}Z`, { fill: c, ...ink(5 * k + 1.5) }), path(`M${P(x(-40), y(38))}Q${P(x(-40), y(30))} ${P(x(-32), y(30))}H${r(x(40))}`, { fill: 'none', ...ink(4 * k + 1) }), rect(x(-26), y(-32), 50 * k, 18 * k, { rx: 3 * k, fill: '#ffffff', opacity: 0.85 })); },
  pencil: (cx, cy, s, rot = -40) => { const k = s / 100; return g({ transform: `translate(${r(cx)} ${r(cy)}) rotate(${rot}) scale(${r(k)})` }, rect(-12, -46, 24, 70, { fill: '#ffd43b', ...ink(4.5) }), rect(-12, -58, 24, 14, { rx: 4, fill: '#ff8fab', ...ink(4.5) }), rect(-12, -48, 24, 6, { fill: '#adb5bd', ...ink(3) }), path('M-12 24L0 50L12 24Z', { fill: '#f4c08a', ...ink(4.5) }), path('M-4 40L0 50L4 40Z', { fill: OL })); },
  gradcap: (cx, cy, s, c = '#2b2346') => { const k = s / 100; return g({ transform: `translate(${r(cx)} ${r(cy)}) scale(${r(k)})` }, path('M-30 0V24Q0 40 30 24V0', { fill: '#3b3355', ...ink(4.5) }), path('M-56 -10L0 -34L56 -10L0 14Z', { fill: c === OL ? '#3b3355' : c, ...ink(4.5) }), path('M0 -10L34 4V30', { fill: 'none', stroke: '#ffd43b', 'stroke-width': 4, 'stroke-linecap': 'round' }), path('M28 30H40L37 46H31Z', { fill: '#ffd43b', ...ink(3) })); },
  tube: (cx, cy, s, c = '#69db7c', rot = 20) => { const k = s / 100; return g({ transform: `translate(${r(cx)} ${r(cy)}) rotate(${rot}) scale(${r(k)})` }, path('M-14 -44V30Q-14 46 0 46Q14 46 14 30V-44', { fill: '#ffffff', ...ink(4.5) }), path('M-14 0H14V30Q14 46 0 46Q-14 46-14 30Z', { fill: c }), path('M-14 -44V30Q-14 46 0 46Q14 46 14 30V-44', { fill: 'none', ...ink(4.5) }), rect(-20, -52, 40, 10, { rx: 4, fill: '#ced4da', ...ink(4) }), circle(-4, 18, 4, { fill: '#ffffff', opacity: 0.8 }), circle(5, 30, 3, { fill: '#ffffff', opacity: 0.8 })); },
  atom: (cx, cy, s, c = '#4dabf7') => { const k = s / 100, rr = 46 * k; return g({}, [0, 60, 120].map(a => ellipse(cx, cy, rr, rr * 0.36, { fill: 'none', stroke: c, 'stroke-width': r(5 * k + 1), transform: `rotate(${a} ${r(cx)} ${r(cy)})` })), circle(cx, cy, 9 * k, { fill: '#ff6b5e', ...ink(3) })); },
  trophy: (cx, cy, s, c = '#ffc93a') => { const k = s / 100; return g({ transform: `translate(${r(cx)} ${r(cy)}) scale(${r(k)})` }, path('M-28 -38H-46Q-48 -6-20 0M28 -38H46Q48 -6 20 0', { fill: 'none', ...ink(7) }), path('M-28 -38H-46Q-48 -6-20 0M28 -38H46Q48 -6 20 0', { fill: 'none', stroke: c, 'stroke-width': 3.5 }), path('M-32 -46H32V-20Q32 12 0 14Q-32 12-32 -20Z', { fill: c, ...ink(4.5) }), rect(-8, 12, 16, 16, { fill: c, ...ink(4) }), rect(-24, 28, 48, 14, { rx: 4, fill: '#8d6e63', ...ink(4.5) }), K.shine(-16, -30, 3, 9, 20, 0.7)); },
  crown: (cx, cy, s, c = '#ffd43b') => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, path(`M${P(x(-44), y(26))}L${P(x(-50), y(-26))}L${P(x(-22), y(-2))}L${P(x(0), y(-36))}L${P(x(22), y(-2))}L${P(x(50), y(-26))}L${P(x(44), y(26))}Z`, { fill: c, ...ink(5 * k + 1.5) }), circle(x(-50), y(-28), 6 * k, { fill: '#ff6b9a', ...ink(3) }), circle(x(0), y(-38), 6 * k, { fill: '#4dabf7', ...ink(3) }), circle(x(50), y(-28), 6 * k, { fill: '#69db7c', ...ink(3) })); },
  // a speech bubble with three dots (someone is typing)
  typing: (cx, cy, s, c = '#e9ecef') => { const k = s / 100; return g({}, path(K.bubble(cx - 46 * k, cy - 26 * k, 92 * k, 46 * k, 20 * k, 'left'), { fill: c, ...ink(4.5) }), ...[-22, 0, 22].map((dx, i) => anim('ty' + i, circle(cx + dx * k, cy - 3 * k, 7 * k, { fill: OL })))); },
  typingCss: () => [0, 1, 2].map(i => `.ty${i}{animation:ty${i}k 1.2s ease-in-out ${r(i * 0.18)}s infinite}@keyframes ty${i}k{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`).join(''),
  // eyes looking to one side (side: -1 left, 1 right)
  eyes: (cx, cy, s, side = 1, up = 0) => { const k = s / 100; return g({}, [-1, 1].map(dx => g({}, ellipse(cx + dx * 22 * k, cy, 19 * k, 24 * k, { fill: '#ffffff', ...ink(4.5) }), circle(cx + dx * 22 * k + side * 8 * k, cy + 2 * k - up * 12 * k, 9 * k, { fill: OL }), circle(cx + dx * 22 * k + side * 8 * k + 3 * k, cy - 2 * k - up * 12 * k, 3 * k, { fill: HL })))); }
};

// =====================================================================  characters (Blokvane's own)
// a soft blob creature: body color, face, little arms (o.arms: false | 'up' | 'side' | 'wave'), feet
function critter(cx, cy, s, col, o = {}) {
  const k = s / 100, rx = 50 * k, ry = 44 * k;
  const parts = [];
  if (o.arms !== false) {
    const a = o.arms || 'side';
    const L = a === 'up' ? [cx - rx * 0.95, cy - ry * 0.55, 30] : a === 'wave' ? [cx - rx * 0.95, cy + ry * 0.05, 28] : [cx - rx * 0.92, cy + ry * 0.2, 28];
    const R = a === 'up' || a === 'wave' ? [cx + rx * 0.95, cy - ry * 0.55, -30] : [cx + rx * 0.92, cy + ry * 0.2, -28];
    parts.push(ellipse(L[0], L[1], 9 * k, 14 * k, { fill: col, ...ink(4.5), transform: `rotate(${L[2]} ${r(L[0])} ${r(L[1])})` }));
    parts.push(anim(a === 'wave' ? 'wv' : null, ellipse(R[0], R[1], 9 * k, 14 * k, { fill: col, ...ink(4.5), transform: `rotate(${R[2]} ${r(R[0])} ${r(R[1])})` })));
  }
  if (o.feet !== false) parts.push(ellipse(cx - 20 * k, cy + ry * 0.98, 12 * k, 7 * k, { fill: col, ...ink(4.5) }), ellipse(cx + 20 * k, cy + ry * 0.98, 12 * k, 7 * k, { fill: col, ...ink(4.5) }));
  const d = blob(cx, cy, rx, ry, 0.22);
  parts.push(path(d, { fill: col, ...ink(5) }));
  parts.push(ellipse(cx + rx * 0.45, cy + ry * 0.3, rx * 0.45, ry * 0.55, { fill: SH, opacity: 0.08 }));
  parts.push(K.shine(cx - rx * 0.5, cy - ry * 0.55, 6 * k, 10 * k, 35, 0.6));
  if (o.face !== false) parts.push(loose(K.face(cx, cy - 4 * k, 80 * k, { eyes: 'dot', mouth: 'smile', ...o.face, blink: !o.face || !o.face.eyes || o.face.eyes === 'dot' })));
  return g({}, parts);
}

// =====================================================================  the sticker
// o: { id, name, cat, tags, vb, art: parts (or a function), words: lines, at: [cx, cy], maxW, base: shape kind,
//      baseFill, baseO: { ow, inner, pad }, motion (the whole sticker): pop | wiggle | bob | tilt | pulse | swing | float |
//      none, css, colors, edge, shadow }
const MOVES = {
  pop: () => M.pop('vm', 2.4), wiggle: () => M.wiggle('vm', 2.2, 4), bob: () => M.bob('vm', 3, 5), tilt: () => M.tilt('vm', 3.4, 4), pulse: () => M.pulse('vm', 1.8, 1.04),
  swing: () => M.swing('vm', 2.6, 5, '50% 0%'), float: () => M.bob('vm', 2.6, 8), beat: () => M.beat('vm', 1.4), shake: () => M.shake('vm', 1.1, 2), none: () => ''
};
function make(o) {
  const vb = o.vb || [200, 200];
  const cx = (o.at && o.at[0]) || vb[0] / 2, cy = (o.at && o.at[1]) || vb[1] / 2;
  const back = [], front = [];
  let wordsBox = null;
  let wordParts = [];
  if (o.words) {
    const W = words(o.words, { cx, cy, maxW: o.maxW || vb[0] - 44, line: o.line });
    wordsBox = W.box;
    wordParts = W.n;
  }
  if (o.base && wordsBox) back.push(...shapeBehind(o.base, wordsBox, o.baseFill || '#ffffff', o.baseO));
  const art = typeof o.art === 'function' ? o.art(wordsBox) : o.art;
  const behind = typeof o.behind === 'function' ? o.behind(wordsBox) : o.behind;
  // (the words go on top: a label on a tag, a number on a badge; o.wordsUnder puts them under the drawings)
  const parts = K.flat(o.wordsUnder ? [behind, back, wordParts, art] : [behind, back, art, wordParts]);
  let all = vinyl(parts, { edge: o.edge, shadow: o.shadow });
  // (a shape that would reach past the sticker's box makes the whole sticker smaller, kept in the middle)
  if (wordsBox) {
    const e = o.base ? extentOf(o.base, wordsBox, (o.baseO || {}).pad) : [wordsBox[0] - 4, wordsBox[1] - 4, wordsBox[0] + wordsBox[2] + 4, wordsBox[1] + wordsBox[3] + 4];
    const box = o.box || [Math.min(e[0], ...(o.extent ? [o.extent[0]] : [])), Math.min(e[1], ...(o.extent ? [o.extent[1]] : [])), Math.max(e[2], ...(o.extent ? [o.extent[2]] : [])), Math.max(e[3], ...(o.extent ? [o.extent[3]] : []))];
    const m = (o.edge == null ? EDGE : o.edge) + 6;
    const k = Math.min(1, (vb[0] - 2 * m) / (box[2] - box[0]), (vb[1] - 2 * m) / (box[3] - box[1]));
    if (k < 0.995) {
      const bx = (box[0] + box[2]) / 2, by = (box[1] + box[3]) / 2;
      all = [g({ transform: `translate(${r(vb[0] / 2)} ${r(vb[1] / 2)}) scale(${r(k * 1000) / 1000}) translate(${r(-bx)} ${r(-by)})` }, all)];
    }
  }
  const mv = (MOVES[o.motion || 'pop'] || MOVES.none)();
  const n = mv ? [g({ class: 'vm' }, all)] : all;
  let css = mv + (o.css || '');
  if (JSON.stringify(n).includes('"blink"')) css += M.blink('blink', 4.2);
  if (JSON.stringify(n).includes('"wv"')) css += M.wave('wv', 1, 20, '30% 90%');
  return sticker({ id: o.id, name: o.name, cat: o.cat, tags: o.tags || [], vb, n, css, colors: o.colors });
}

module.exports = { WHITE, DARK, EDGE, minPath, words, wordLine, label, vinyl, silhouette, loose, SHAPES, extentOf, shapeBehind, I, critter, make, MOVES };
