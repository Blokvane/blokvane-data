// Shared by the sticker recipes: soft round bodies with a shade and a shine, small parts (feet, arms, spots), floating
// extras (sparkles, hearts, notes...) and make(), which puts a sticker together with its whole body moving and a
// soft shadow on the ground. Everything here is Blokvane's own drawing.
'use strict';
const K = require('./kit');
const { r, P, at, g, node, path, circle, ellipse, rect, line, ink, fillInk, ground, anim, heart, star, sticker, MOVES: M, css, OL, HL, SH } = K;

// ---------- shapes
// a soft round body: round on top, a little flatter at the bottom (flat 0 to 0.4)
function blob(cx, cy, rx, ry, flat = 0.2, topFlat = 0) {
  const k = 0.552, top = cy - ry, bot = cy + ry, L = cx - rx, R = cx + rx;
  return `M${P(cx, top)}C${P(cx + rx * (k + topFlat), top)} ${P(R, cy - ry * (k + topFlat))} ${P(R, cy)}C${P(R, cy + ry * (k + flat))} ${P(cx + rx * (k + flat), bot)} ${P(cx, bot)}C${P(cx - rx * (k + flat), bot)} ${P(L, cy + ry * (k + flat))} ${P(L, cy)}C${P(L, cy - ry * (k + topFlat))} ${P(cx - rx * (k + topFlat), top)} ${P(cx, top)}Z`;
}
// an egg (narrower at the top)
function egg(cx, cy, rx, ry, narrow = 0.25) {
  const k = 0.552, top = cy - ry, bot = cy + ry, L = cx - rx, R = cx + rx, nt = rx * (1 - narrow);
  return `M${P(cx, top)}C${P(cx + nt * k * 1.1, top)} ${P(R, cy - ry * 0.7)} ${P(R, cy + ry * 0.05)}C${P(R, cy + ry * 0.62)} ${P(cx + rx * 0.62, bot)} ${P(cx, bot)}C${P(cx - rx * 0.62, bot)} ${P(L, cy + ry * 0.62)} ${P(L, cy + ry * 0.05)}C${P(L, cy - ry * 0.7)} ${P(cx - nt * k * 1.1, top)} ${P(cx, top)}Z`;
}
// a smooth closed shape through points (Catmull-Rom turned into curves)
function smooth(pts, tension = 1) {
  const n = pts.length;
  let d = 'M' + P(...pts[0]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
    d += 'C' + P(...c1) + ' ' + P(...c2) + ' ' + P(...p2);
  }
  return d + 'Z';
}
// an open smooth line through points
function curve(pts, tension = 1) {
  let d = 'M' + P(...pts[0]);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
    d += 'C' + P(...c1) + ' ' + P(...c2) + ' ' + P(...p2);
  }
  return d;
}
// points around an ellipse (for flowers, wreaths...)
const ring = (cx, cy, rr, n, start = -90, ry) => Array.from({ length: n }, (_, i) => at(cx, cy, 1, start + i * 360 / n)).map(p => [cx + (p[0] - cx) * rr, cy + (p[1] - cy) * (ry == null ? rr : ry)]);
// a drop (tip at the top)
const drop = (cx, cy, s) => `M${P(cx, cy - s)}C${P(cx + s * 0.25, cy - s * 0.55)} ${P(cx + s * 0.62, cy - s * 0.1)} ${P(cx + s * 0.62, cy + s * 0.28)}A${r(s * 0.62)} ${r(s * 0.62)} 0 0 1 ${P(cx - s * 0.62, cy + s * 0.28)}C${P(cx - s * 0.62, cy - s * 0.1)} ${P(cx - s * 0.25, cy - s * 0.55)} ${P(cx, cy - s)}Z`;
// a leaf (pointed both ends) from a to b, w wide
function leaf(x1, y1, x2, y2, w) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w;
  return `M${P(x1, y1)}Q${P(mx + nx, my + ny)} ${P(x2, y2)}Q${P(mx - nx, my - ny)} ${P(x1, y1)}Z`;
}

// ---------- a body: its color, a soft shade on the right (clipped to it), the outline and a shine
let clipN = 0;
// id: unique inside the sticker; o: { shade (0 to 0.2), shine: [cx, cy, rx, ry, rot] or false, inside: parts drawn inside the body (spots, a belly...), w: outline width }
function body(d, fill, o = {}) {
  const id = o.id || 'b' + (++clipN % 1000);
  const box = o.box || [100, 110, 70, 60];  // middle and size, for the shade
  const sh = o.shade == null ? 0.08 : o.shade;
  const inside = [].concat(o.inside || []);
  const shadePart = sh ? ellipse(box[0] + box[2] * (o.shadeX || 1.05), box[1] + box[3] * 0.25, box[2] * 0.55, box[3] * 1.35, { fill: SH, opacity: sh }) : null;
  const out = [];
  if (inside.length || shadePart) {
    out.push(node('defs', {}, [node('clipPath', { id }, [path(d)])]));
    out.push(path(d, { fill }));
    out.push(g({ 'clip-path': `url(#${id})` }, ...inside, shadePart));
  } else out.push(path(d, { fill }));
  out.push(path(d, { fill: 'none', ...ink(o.w || K.SW) }));
  if (o.shine !== false) {
    const s = o.shine || [box[0] - box[2] * 0.5, box[1] - box[3] * 0.55, box[2] * 0.12, box[3] * 0.2, 35];
    out.push(K.shine(s[0], s[1], s[2], s[3], s[4] == null ? 35 : s[4], o.shineO || 0.55));
  }
  return g({}, out);
}
// a plain part: filled, outlined
const part = (d, fill, w) => path(d, fillInk(fill, w));
// small feet under a body
const feet = (cx, y, gap, fill, rx = 13, ry = 8) => [ellipse(cx - gap, y, rx, ry, fillInk(fill, 4.5)), ellipse(cx + gap, y, rx, ry, fillInk(fill, 4.5))];
// little arms at the sides (draw before the body, so the body covers where they join)
const arms = (cx, y, spread, fill, rx = 10, ry = 15, tilt = 28) => [ellipse(cx - spread, y, rx, ry, { ...fillInk(fill, 4.5), transform: `rotate(${tilt} ${r(cx - spread)} ${y})` }), ellipse(cx + spread, y, rx, ry, { ...fillInk(fill, 4.5), transform: `rotate(${-tilt} ${r(cx + spread)} ${y})` })];
const face = (cx, cy, s, o = {}) => K.face(cx, cy, s, { blink: o.eyes === undefined || o.eyes === 'dot', ...o });

// ---------- floating extras: each { n: parts, css }, with its own class names (pass a prefix if two of the same kind are used)
const X = {
  sparkles: (pts = [[34, 44], [168, 38], [172, 130]], col = '#ffd43b', p = 's') => ({ n: pts.map((q, i) => anim(p + i, path(star(q[0], q[1], q[2] || 11 - i, (q[2] || 11 - i) * 0.3, 4, -90), { fill: col, ...ink(2.5) }))), css: pts.map((q, i) => M.twinkle(p + i, 1.8, i * 0.5)).join('') }),
  hearts: (pts = [[40, 50, 20], [162, 40, 16], [154, 76, 12]], cols = ['#ff4d6d', '#ff8fab', '#ff4d6d'], p = 'h') => ({ n: pts.map((q, i) => anim(p + i, path(heart(q[0], q[1], q[2]), fillInk(cols[i % cols.length], q[2] > 14 ? 3.5 : 3)))), css: pts.map((q, i) => M.fadeUp(p + i, 2.6, i * 0.85, 24)).join('') }),
  notes: (p = 'n') => ({ n: [anim(p + '1', path('M36 62V38L54 34V56', { fill: 'none', ...ink(4) }), ellipse(31, 63, 6, 5, { fill: OL }), ellipse(49, 57, 6, 5, { fill: OL })), anim(p + '2', path('M164 46V24', ink(4)), path('M164 24Q174 28 176 38', { fill: 'none', ...ink(4) }), ellipse(159, 47, 6, 5, { fill: OL }))], css: M.fadeUp(p + '1', 2.4, 0, 20) + M.fadeUp(p + '2', 2.4, 1.2, 20) }),
  steam: (x, y, col = '#adb5bd', p = 'st') => ({ n: [anim(p + '1', path(`M${x - 10} ${y}q-6 -8 0 -16`, { fill: 'none', ...ink(4), stroke: col })), anim(p + '2', path(`M${x + 4} ${y - 2}q-6 -8 0 -16`, { fill: 'none', ...ink(4), stroke: col })), anim(p + '3', path(`M${x + 18} ${y}q-6 -8 0 -16`, { fill: 'none', ...ink(4), stroke: col }))], css: M.steam(p + '1', 2.2, 0) + M.steam(p + '2', 2.2, 0.7) + M.steam(p + '3', 2.2, 1.4) }),
  drops: (pts, col = '#74c0fc', p = 'd') => ({ n: pts.map((q, i) => anim(p + i, path(drop(q[0], q[1], q[2] || 7), fillInk(col, 2.5)))), css: pts.map((q, i) => M.fall(p + i, 1.2, i * 0.3, 40)).join('') }),
  bubbles: (pts, p = 'bb') => ({ n: pts.map((q, i) => anim(p + i, circle(q[0], q[1], q[2] || 6, { fill: '#e7f5ff', ...ink(2.5), stroke: '#74c0fc' }), circle(q[0] - (q[2] || 6) * 0.35, q[1] - (q[2] || 6) * 0.35, (q[2] || 6) * 0.25, { fill: HL }))), css: pts.map((q, i) => M.fadeUp(p + i, 2.6, i * 0.7, 34)).join('') }),
  zzz: (T, x = 150, y = 54, p = 'z') => { const ds = [T.words('Z', { font: 'fredoka', size: 16, cx: x, cy: y }).d, T.words('Z', { font: 'fredoka', size: 12, cx: x + 16, cy: y - 20 }).d, T.words('Z', { font: 'fredoka', size: 9, cx: x + 28, cy: y - 36 }).d]; return { n: ds.map((d, i) => anim(p + i, path(d, { fill: '#748ffc', ...ink(2.5), 'paint-order': 'stroke' }))), css: ds.map((d, i) => M.fadeUp(p + i, 3, i * 0.8, 14)).join('') }; },
  confetti: (bits = [[34, 40, '#ff6b5e', 0], [166, 30, '#4dabf7', 30], [176, 100, '#ffd43b', 60], [24, 110, '#51cf66', 15], [160, 150, '#cc5de8', 45], [40, 156, '#ffd43b', 70]], p = 'c') => ({ n: bits.map((b, i) => anim(p + i, rect(b[0] - 5, b[1] - 3, 10, 6, { rx: 2, fill: b[2], transform: `rotate(${b[3]} ${b[0]} ${b[1]})` }))), css: bits.map((b, i) => M.twinkle(p + i, 1.6, i * 0.25)).join('') }),
  snow: (pts = [[30, 30], [170, 20], [180, 90], [20, 100], [60, 10], [140, 6]], p = 'f') => ({ n: pts.map((q, i) => anim(p + i, circle(q[0], q[1], 4.5, { fill: '#ffffff', stroke: '#a5d8ff', 'stroke-width': 2 }))), css: pts.map((q, i) => M.fall(p + i, 3, i * 0.45, 70)).join('') }),
  dots: (pts, col, p = 'dt') => ({ n: pts.map((q, i) => anim(p + i, circle(q[0], q[1], q[2] || 4, { fill: col }))), css: pts.map((q, i) => M.twinkle(p + i, 1.6, i * 0.4)).join('') }),
  lines: (pts, col = OL, p = 'ln') => ({ n: pts.map((q, i) => anim(p + i, line(q[0], q[1], q[2], q[3], { stroke: col, 'stroke-width': 4, 'stroke-linecap': 'round' }))), css: pts.map((q, i) => M.flicker(p + i, 1.2 + i * 0.2)).join('') })
};

// ---------- the sticker
const BODY_MOVES = {
  bob: () => M.bob('mv', 3, 8), bounce: () => M.bounce('mv', 1.3, 16), hop: () => M.bounce('mv', 0.9, 22), wiggle: () => M.wiggle('mv', 1.6, 6), tilt: () => M.tilt('mv', 2.8, 6),
  swing: () => M.swing('mv', 2.4, 8, '50% 0%'), sway: () => M.swing('mv', 2.6, 5, '50% 100%'), pulse: () => M.pulse('mv', 1.6, 1.06), beat: () => M.beat('mv', 1.3), spin: () => M.spin('mv', 6),
  squash: () => M.squash('mv', 1.5), shake: () => M.shake('mv', 0.8, 3), rise: () => M.rise('mv', 3.4, 7), zoom: () => M.zoom('mv', 2.4), pop: () => M.pop('mv', 2),
  drift: () => M.drift('mv', 4, 8), float: () => M.bob('mv', 2.6, 12), none: () => ''
};
const SHADOWS = { bob: () => M.shadow('gs', 3), float: () => M.shadow('gs', 2.6), rise: () => M.shadow('gs', 3.4), bounce: () => M.shadowBounce('gs', 1.3), hop: () => M.shadowBounce('gs', 0.9) };
// o: { id, name, cat, tags, body: parts that move together, behind: parts behind it that stay, front: parts on top that stay,
//      extra: floating extras, motion, css (more motion), ground: [cx, cy, rx] or false, colors (main first) }
function make(o) {
  const motion = o.motion || 'bob';
  const cssParts = [];
  const behind = [...[].concat(o.behind || [])], front = [];
  for (const x0 of [].concat(o.extra || [])) {
    const x = typeof x0 === 'function' ? x0() : x0;
    if (!x) continue;
    (x.behind ? behind : front).push(...x.n);
    cssParts.push(x.css || '');
  }
  front.push(...[].concat(o.front || []));
  const parts = [];
  const gr = o.ground === false ? null : (o.ground || [100, 182, 46]);
  const sh = gr && SHADOWS[motion] ? SHADOWS[motion]() : '';
  if (gr) parts.push(ground(gr[0], gr[1], gr[2], sh ? 'gs' : undefined));
  parts.push(...behind);
  const mv = (BODY_MOVES[motion] || BODY_MOVES.none)();
  parts.push(mv ? g({ class: 'mv' }, o.body) : g({}, o.body));
  parts.push(...front);
  cssParts.push(mv, sh, o.css || '');
  const all = JSON.stringify(parts);
  if (all.includes('"blink"')) cssParts.push(M.blink('blink', 4.2));
  return sticker({ id: o.id, name: o.name, cat: o.cat, tags: o.tags || [], vb: o.vb, n: parts, css: css(...cssParts), colors: o.colors });
}

module.exports = { blob, egg, smooth, curve, ring, drop, leaf, body, part, feet, arms, face, X, make, BODY_MOVES };
