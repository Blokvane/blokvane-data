// Note papers: sticky notes, lined and grid paper, index cards, tags, washi tape and page flags, held on with tape, pins
// and clips, for planning boards, classrooms and to-do slides. Vinyl stickers with Blokvane's own drawings and words.
'use strict';
const K = require('./kit');
const V = require('./vinyl');
const { r, P, g, path, circle, ellipse, rect, ink, anim, star, heart, rrect, roundPoly, MOVES: M, OL } = K;
const { I } = V;
const { mascot } = require('./mascots');

const CAT = 'Note papers';
const mk = (id, name, tags, o) => V.make({ id: 'note-' + id, name, cat: CAT, tags: ['note', 'paper', 'notes', ...tags], ...o });
// (details inside the paper add nothing to the die-cut edge)
const inner = (...ns) => { const out = K.flat(ns); for (const n of out) V.loose(n); return out; };
// handwriting on the paper: lines centered on cx, cy
const hand = (lines, cx, cy, maxW = 120, tilt = 0) => inner(V.label([].concat(lines).map(l => ({ f: 'caveat', s: 24, c: '#343a40', o: false, tilt, ...(typeof l === 'string' ? { t: l } : l) })), cx, cy, maxW));
// one line of handwriting that starts at x
const handAt = (l, x, cy, maxW = 120) => { const L = { f: 'caveat', s: 20, c: '#343a40', o: false, ...(typeof l === 'string' ? { t: l } : l) }; const w = V.words([L], { cx: 0, cy: 0, maxW }).box[2]; return inner(V.label(L, x + w / 2, cy, maxW)); };

// a sheet of note paper, cx, cy its middle. o: { c: paper color, rule: 'lined' | 'margin' | 'grid' | 'dots', top, gap,
//   lc: line color, rot, fold: a folded corner this big, curl: false for a flat corner, glue: the sticky band on top }
function paper(cx, cy, w, h, o = {}) {
  const c = o.c || '#ffe066', x0 = cx - w / 2, y0 = cy - h / 2, x1 = cx + w / 2, y1 = cy + h / 2, f = o.fold || 0;
  const kids = [];
  const body = f ? `M${P(x0, y0)}H${r(x1)}V${r(y1 - f)}L${P(x1 - f, y1)}H${r(x0)}Z`
    : o.curl === false ? rrect(x0, y0, w, h, 3)
    : `M${P(x0, y0)}H${r(x1)}V${r(y1 - 18)}Q${P(x1 - 3, y1 - 3)} ${P(x1 - 22, y1)}H${r(x0)}Z`;
  kids.push(path(body, { fill: c, ...ink(5) }));
  const det = [];
  if (o.glue) det.push(rect(x0 + 3, y0 + 3, w - 6, 16, { fill: OL, opacity: 0.07 }));
  if (o.rule === 'lined' || o.rule === 'margin') { let d = ''; for (let y = y0 + (o.top || 26); y < y1 - 10; y += o.gap || 15) d += `M${P(x0 + 9, y)}H${r(x1 - 9)}`; det.push(path(d, { fill: 'none', stroke: o.lc || '#4dabf7', 'stroke-width': 2, opacity: 0.55 })); }
  if (o.rule === 'margin') det.push(path(`M${P(x0 + 26, y0 + 3)}V${r(y1 - 3)}`, { stroke: '#ff8787', 'stroke-width': 2, opacity: 0.85 }));
  if (o.rule === 'grid') { let d = ''; const s = o.gap || 13; for (let x = x0 + s; x < x1 - 3; x += s) d += `M${P(x, y0 + 3)}V${r(y1 - 3)}`; for (let y = y0 + s; y < y1 - 3; y += s) d += `M${P(x0 + 3, y)}H${r(x1 - 3)}`; det.push(path(d, { fill: 'none', stroke: o.lc || '#74c0fc', 'stroke-width': 1.5, opacity: 0.55 })); }
  if (o.rule === 'dots') { let d = ''; const s = o.gap || 14; for (let x = x0 + s; x < x1 - 5; x += s) for (let y = y0 + s; y < y1 - 5; y += s) d += `M${P(x, y)}h0`; det.push(path(d, { fill: 'none', stroke: o.lc || '#868e96', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.5 })); }
  if (f) det.push(path(`M${P(x1 - f, y1)}L${P(x1, y1 - f)}H${r(x1 - f)}Z`, { fill: o.fc || '#ffffff', 'fill-opacity': 0.6, stroke: OL, 'stroke-width': 4, 'stroke-linejoin': 'round' }));
  else if (o.curl !== false) det.push(path(`M${P(x1, y1 - 18)}Q${P(x1 - 3, y1 - 3)} ${P(x1 - 22, y1)}Q${P(x1 - 12, y1 - 12)} ${P(x1, y1 - 18)}Z`, { fill: '#ffffff', opacity: 0.55 }));
  kids.push(...inner(det));
  return g(o.rot ? { transform: `rotate(${o.rot} ${r(cx)} ${r(cy)})` } : {}, kids);
}
// a black binder clip on the top edge
const binder = (cx, cy, s = 40) => { const k = s / 40; return g({ transform: `translate(${r(cx)} ${r(cy)}) scale(${r(k)})` },
  path('M-12 -8V-24Q-12 -30 -6 -30H6Q12 -30 12 -24V-8', { fill: 'none', ...ink(8) }), path('M-12 -8V-24Q-12 -30 -6 -30H6Q12 -30 12 -24V-8', { fill: 'none', stroke: '#ced4da', 'stroke-width': 4, 'stroke-linejoin': 'round' }),
  path('M-22 -10H22L17 14H-17Z', { fill: '#343a40', ...ink(3.5) }), path('M-14 -4H10', { stroke: '#868e96', 'stroke-width': 3, 'stroke-linecap': 'round' })); };
// a strip of washi tape with zigzag torn ends; pat(x0, y0, x1, y1) draws its pattern
function washi(cx, cy, w, h, c, pat, rot = -10) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z = 6, n = 4;
  let d = `M${P(x0, y0)}H${r(x1)}`;
  for (let i = 1; i <= n; i++) d += `L${P(x1 - (i % 2 ? z : 0), y0 + h * i / n)}`;
  d += `H${r(x0)}`;
  for (let i = n - 1; i >= 0; i--) d += `L${P(x0 + (i % 2 ? z : 0), y0 + h * i / n)}`;
  const kids = [path(d + 'Z', { fill: c, ...ink(3.5) })];
  if (pat) kids.push(...inner(pat(x0 + z + 4, y0, x1 - z - 4, y1)));
  kids.push(...inner(path(`M${P(x0 + 10, y0 + 6)}H${r(x1 - 12)}`, { stroke: '#ffffff', 'stroke-width': 3, opacity: 0.45, 'stroke-linecap': 'round' })));
  return g({ transform: `rotate(${rot} ${r(cx)} ${r(cy)})` }, kids);
}
const PAT = {
  dots: (col = '#ffffff') => (a, y0, b, y1) => { let d = ''; const h = y1 - y0; for (let x = a + 4, i = 0; x < b; x += 13, i++) for (const y of i % 2 ? [y0 + h * 0.3, y0 + h * 0.72] : [y0 + h * 0.5]) d += `M${P(x, y)}h0`; return path(d, { fill: 'none', stroke: col, 'stroke-width': 6, 'stroke-linecap': 'round' }); },
  stripes: (col = '#ffffff') => (a, y0, b, y1) => { let d = ''; for (let x = a; x < b - 6; x += 16) d += `M${P(x, y0 + 2)}h8V${r(y1 - 2)}h-8Z`; return path(d, { fill: col, 'fill-opacity': 0.7 }); },
  gingham: (col = '#ffffff') => (a, y0, b, y1) => { let v = '', hz = ''; for (let x = a; x < b - 6; x += 14) v += `M${P(x, y0 + 2)}h7V${r(y1 - 2)}h-7Z`; for (let y = y0 + 7; y < y1 - 6; y += 14) hz += `M${P(a - 4, y)}H${r(b + 4)}v7H${r(a - 4)}Z`; return [path(v, { fill: col, 'fill-opacity': 0.4 }), path(hz, { fill: col, 'fill-opacity': 0.4 })]; },
  hearts: (col = '#ffffff') => (a, y0, b, y1) => { const out = [], cy = (y0 + y1) / 2; for (let x = a + 8, i = 0; x < b - 4; x += 24, i++) out.push(path(heart(x, cy + (i % 2 ? 5 : -5), 14), { fill: col })); return out; },
  stars: (col = '#ffffff') => (a, y0, b, y1) => { const out = [], cy = (y0 + y1) / 2; for (let x = a + 8, i = 0; x < b - 4; x += 24, i++) out.push(path(star(x, cy + (i % 2 ? 5 : -5), 8, 3.6, 5, -90), { fill: col })); return out; }
};
// a page flag: a see-through strip with a solid tip
const flag = (x, y, w, h, c) => g({}, path(rrect(x, y, w, h, 3), { fill: c, 'fill-opacity': 0.45, ...ink(3) }), path(rrect(x + w * 0.62, y, w * 0.38, h, 3), { fill: c, ...ink(3) }));
// a hand-drawn ring around something (a doodle)
const ring = (cx, cy, rx, ry, c = '#e03131') => inner(path(`M${P(cx + rx * 0.9, cy - ry * 0.7)}C${P(cx + rx * 1.15, cy + ry * 0.4)} ${P(cx + rx * 0.4, cy + ry * 1.08)} ${P(cx - rx * 0.3, cy + ry)}C${P(cx - rx * 1.1, cy + ry * 0.9)} ${P(cx - rx * 1.1, cy - ry * 0.6)} ${P(cx - rx * 0.3, cy - ry * 0.98)}C${P(cx + rx * 0.3, cy - ry * 1.12)} ${P(cx + rx * 1.02, cy - ry * 0.9)} ${P(cx + rx * 1.06, cy - ry * 0.3)}`, { fill: 'none', stroke: c, 'stroke-width': 3.5, 'stroke-linecap': 'round' }));
// a checkbox, ticked or not
const box = (x, y, done, c = '#40c057') => [rect(x - 8, y - 8, 16, 16, { rx: 3, fill: '#ffffff', ...ink(3) }), done ? path(`M${P(x - 5, y)}L${P(x - 1, y + 4)}L${P(x + 7, y - 6)}`, { fill: 'none', stroke: c, 'stroke-width': 3.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) : null];
// handwriting squiggles that stand for words on a line
const squiggle = (x, y, w, c = '#495057') => { let d = `M${P(x, y)}`; for (let i = 0; i < Math.floor(w / 8); i++) d += `q2 ${i % 2 ? 5 : -5} 4 0t4 0`; return inner(path(d, { fill: 'none', stroke: c, 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.6 })); };

const LIST = () => [
  // ---- sticky notes, held on with tape, pins and clips
  mk('remember', 'Remember!', ['remember', 'reminder', 'sticky note', 'yellow', 'tape'], { colors: ['#ffe066', '#e03131'], motion: 'tilt',
    art: () => [paper(100, 106, 140, 136, { c: '#ffe066', rot: -4, glue: true }), I.tape(100, 42, 74, 22, '#ff8fab', 5), hand([{ t: 'Remember!', s: 34, c: '#e03131' }, { t: 'you got this', s: 22 }], 98, 108, 118, -4), I.heart(146, 152, 18)] }),
  mk('note-to-self', 'Note to self: take a nap', ['note to self', 'nap', 'pink', 'pin', 'funny'], { colors: ['#ffc9de', '#d6336c'], motion: 'swing',
    art: () => [paper(100, 108, 138, 132, { c: '#ffc9de', rule: 'lined', top: 50, gap: 17, rot: 3 }), I.pin(100, 50, 42, '#d6336c'), hand([{ t: 'Note to self:', s: 24, c: '#a61e4d' }, { t: 'take a nap', s: 32 }], 102, 116, 118, 3)] }),
  mk('to-do', 'To do: coffee', ['to do', 'list', 'checklist', 'tasks', 'coffee', 'funny'], { colors: ['#ffffff', '#1c7ed6'], motion: 'none',
    art: () => [paper(100, 102, 136, 160, { c: '#ffffff', rule: 'margin', top: 58, gap: 28, curl: false }), I.tape(44, 30, 56, 20, '#a5d8ff', -38), inner(V.label({ t: 'To do', f: 'fredoka', s: 26, c: '#1c7ed6', o: false }, 112, 46)),
      ...[['coffee', true], ['work', false], ['more coffee', false]].map(([t, done], i) => { const y = 74 + i * 28; return [box(58, y - 4, done), handAt({ t, s: 20, c: done ? '#868e96' : '#343a40' }, 72, y - 4, 82), done ? inner(path(`M70 ${y - 4}H118`, { stroke: '#868e96', 'stroke-width': 2.5, 'stroke-linecap': 'round' })) : null]; })] }),
  mk('great-idea', 'Great idea! Let\'s do it!', ['idea', 'great idea', 'light bulb', 'blue', 'clip'], { colors: ['#a5d8ff', '#ffd43b'], motion: 'pop',
    art: () => [paper(100, 106, 142, 136, { c: '#a5d8ff', rot: -3 }), I.clip(60, 44, 42), I.bulb(104, 80, 46), I.rays(104, 76, 30, 5, 8, OL, -90, 130), hand([{ t: 'Great idea!', s: 28, c: '#1864ab' }, { t: 'Let\'s do it!', s: 24 }], 100, 136, 122, -3)] }),
  mk('today', 'Today:', ['today', 'plan', 'day', 'lined', 'tape'], { colors: ['#fff3bf', '#495057'], motion: 'none',
    art: () => [paper(100, 106, 140, 140, { c: '#fff3bf', rule: 'lined', top: 58, gap: 18 }), I.tape(100, 40, 66, 20, '#b2f2bb', -3), handAt({ t: 'Today:', s: 28 }, 44, 62, 100), squiggle(46, 82, 88), squiggle(46, 100, 64), squiggle(46, 118, 96), squiggle(46, 136, 48), I.star(148, 140, 18)] }),
  mk('plan', 'The plan', ['plan', 'grid', 'strategy', 'arrow', 'clip'], { colors: ['#ffffff', '#1c7ed6'], motion: 'tilt',
    art: () => [paper(100, 108, 144, 138, { c: '#ffffff', rule: 'grid', rot: 2, curl: false }), binder(100, 46, 40), inner(V.label({ t: 'THE PLAN', f: 'anton', s: 22, c: '#1c7ed6', o: false, tilt: 2 }, 100, 68)),
      inner(g({ transform: 'rotate(2 100 108)' }, circle(56, 112, 12, { fill: 'none', stroke: '#fa5252', 'stroke-width': 3 }), path('M70 112C88 96 100 130 118 110', { fill: 'none', stroke: OL, 'stroke-width': 3, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }), path('M112 104L120 109L113 116', { fill: 'none', stroke: OL, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), path(star(140, 108, 13, 6, 5, -90), { fill: '#ffd43b', stroke: OL, 'stroke-width': 2.5 }), path('M50 146H96', { stroke: '#495057', 'stroke-width': 2.5, opacity: 0.6 }), path('M50 156H80', { stroke: '#495057', 'stroke-width': 2.5, opacity: 0.6 })))] }),
  mk('done', 'Done!', ['done', 'finished', 'check', 'green', 'tape'], { colors: ['#b2f2bb', '#2f9e44'], motion: 'pop',
    art: () => [paper(100, 106, 136, 132, { c: '#b2f2bb', rot: 4 }), I.tape(100, 44, 60, 20, '#ffffff', -6), I.check(100, 92, 58), hand({ t: 'Done!', s: 34, c: '#2b8a3e' }, 102, 142, 110, 4)] }),
  mk('top-priority', 'Top priority', ['priority', 'urgent', 'important', 'red', 'pin'], { colors: ['#ff8787', '#ffffff'], motion: 'shake',
    art: () => [paper(100, 108, 140, 128, { c: '#ff8787', rot: -2 }), I.pin(100, 50, 40, '#4dabf7'), hand([{ t: 'TOP', f: 'anton', s: 30, c: '#ffffff' }, { t: 'PRIORITY', f: 'anton', s: 26, c: '#ffffff' }], 100, 114, 116, -2), I.star(44, 74, 16, '#ffd43b'), I.star(156, 150, 18, '#ffd43b')] }),
  mk('important', 'Important!', ['important', 'read me', 'folded', 'corner', 'orange'], { colors: ['#ffd8a8', '#e03131'], motion: 'tilt',
    art: () => [paper(100, 104, 146, 146, { c: '#ffd8a8', fold: 36, fc: '#fff4e6' }), circle(100, 66, 17, { fill: '#e03131', ...ink(4) }), inner(path('M100 57V68', { stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round' }), circle(100, 75, 3, { fill: '#ffffff' })), hand([{ t: 'IMPORTANT!', f: 'anton', s: 24, c: '#e03131' }, { t: 'read this first', s: 22 }], 96, 112, 112)] }),
  mk('back-in-5', 'Back in 5 minutes (maybe 10)', ['back soon', 'away', 'break', 'door', 'funny'], { colors: ['#fff3bf', '#1c7ed6'], motion: 'none',
    art: () => [paper(100, 106, 144, 136, { c: '#fff3bf', glue: true }), I.tape(54, 42, 50, 18, '#d0bfff', -30), I.tape(146, 42, 50, 18, '#d0bfff', 30), hand([{ t: 'Back in', s: 26 }, { t: '5 minutes', s: 30, c: '#1c7ed6' }, { t: '(maybe 10)', s: 20, c: '#868e96' }], 100, 106, 120)] }),
  mk('my-lunch', 'My lunch. Do not eat!', ['lunch', 'fridge', 'office', 'food', 'funny'], { colors: ['#ffffff', '#e03131'], motion: 'shake',
    art: () => [paper(100, 106, 140, 136, { c: '#ffffff', rule: 'lined', top: 36, gap: 16, rot: -3, curl: false }), I.tape(100, 42, 70, 22, '#ffd8a8', 4), hand([{ t: 'MY LUNCH.', f: 'anton', s: 26, c: '#e03131' }, { t: 'Do not eat!', s: 26 }], 96, 92, 116, -3),
      inner(g({ transform: 'rotate(-3 100 106)' }, circle(100, 140, 14, { fill: 'none', stroke: '#495057', 'stroke-width': 3 }), path('M93 136L97 138M107 136L103 138M94 147Q100 143 106 147', { fill: 'none', stroke: '#495057', 'stroke-width': 3, 'stroke-linecap': 'round' })))] }),
  mk('reminder', 'Reminder: you\'re awesome', ['reminder', 'awesome', 'round', 'pin', 'kind'], { colors: ['#d3f9d8', '#2f9e44'], motion: 'swing',
    art: () => [circle(100, 108, 68, { fill: '#d3f9d8', ...ink(5) }), inner(circle(100, 108, 58, { fill: 'none', stroke: '#69db7c', 'stroke-width': 2.5, 'stroke-dasharray': '6 6', opacity: 0.85 })), I.pin(100, 42, 40, '#fa5252'), hand([{ t: 'Reminder:', s: 24, c: '#2b8a3e' }, { t: 'you\'re', s: 28 }, { t: 'awesome', s: 28 }], 100, 112, 100)] }),
  // ---- shaped notes
  mk('thank-you', 'Thank you! (heart note)', ['thank you', 'thanks', 'heart', 'love', 'pink'], { colors: ['#ffc9de', '#c2255c'], motion: 'beat',
    art: () => [path(heart(100, 100, 168), { fill: '#ffc9de', ...ink(5) }), I.tape(100, 34, 62, 20, '#ffffff', -10), hand({ t: 'Thank you!', f: 'pacifico', s: 22, c: '#c2255c' }, 100, 92, 112)] }),
  mk('well-done', 'Well done! (star note)', ['well done', 'great job', 'star', 'praise', 'yellow'], { colors: ['#ffe066', '#e8590c'], motion: 'pop',
    art: () => [path(star(100, 104, 92, 50, 5, -90, 9), { fill: '#ffe066', ...ink(5) }), hand([{ t: 'Well', s: 30, c: '#e8590c' }, { t: 'done!', s: 30, c: '#e8590c' }], 100, 110, 80)] }),
  mk('hello', 'Hi there! (bubble note)', ['hello', 'hi', 'speech bubble', 'chat', 'greeting'], { colors: ['#d0ebff', '#1c7ed6'], motion: 'bob',
    art: () => [path(K.bubble(24, 40, 152, 104, 24, 'left'), { fill: '#d0ebff', ...ink(5) }), I.tape(150, 42, 46, 18, '#ffe066', 24), hand({ t: 'Hi there!', s: 36, c: '#1864ab' }, 100, 92, 126)] }),
  mk('brainstorm', 'Brainstorm', ['brainstorm', 'ideas', 'cloud', 'think', 'storm'], { colors: ['#e5dbff', '#7048e8'], motion: 'float',
    art: () => [I.bolt(84, 150, 44), I.bolt(122, 146, 32), path(K.cloud(20, 132, 160, 96), { fill: '#e5dbff', ...ink(5) }), hand({ t: 'Brainstorm', s: 30, c: '#5f3dc4' }, 100, 104, 126)] }),
  mk('this-way', 'This way!', ['this way', 'arrow', 'direction', 'follow', 'yellow'], { colors: ['#ffd43b', '#343a40'], motion: 'pulse',
    art: () => [path(roundPoly([[24, 72], [124, 72], [124, 44], [180, 100], [124, 156], [124, 128], [24, 128]], 8), { fill: '#ffd43b', ...ink(5) }), hand({ t: 'This way!', s: 30 }, 92, 100, 96)] }),
  mk('dont-forget', 'Don\'t forget!', ['don\'t forget', 'reminder', 'torn', 'paper', 'red circle'], { colors: ['#ffffff', '#e03131'], motion: 'none',
    words: [{ t: 'Don\'t', f: 'caveat', s: 30, c: '#343a40', o: false }, { t: 'forget!', f: 'caveat', s: 34, c: '#343a40', o: false }], base: 'torn', baseFill: '#ffffff', baseO: { pad: 28 },
    art: () => [ring(100, 100, 74, 52), I.tape(44, 50, 44, 16, '#ffc078', -32)] }),
  mk('iou-coffee', 'I.O.U. one coffee', ['iou', 'coffee', 'owe you', 'torn', 'funny'], { colors: ['#ffffff', '#6f4e37'], motion: 'tilt',
    art: () => [path(V.SHAPES.torn([34, 58, 132, 84], 12), { fill: '#fff9db', ...ink(5) }), hand([{ t: 'I.O.U.', f: 'anton', s: 30, c: '#6f4e37' }, { t: 'one coffee', s: 28 }], 84, 100, 96), mascot('cup', 148, 104, 44, { face: { eyes: 'happy', mouth: 'smile' } })] }),
  // ---- cards, pages and tags
  mk('index-card', 'Big ideas (index card)', ['index card', 'ideas', 'card', 'lined', 'study'], { colors: ['#ffffff', '#fa5252'], motion: 'tilt',
    art: () => [paper(100, 100, 172, 116, { c: '#ffffff', rule: 'lined', top: 48, gap: 15, curl: false, rot: -4 }), inner(path('M20 70H180', { stroke: '#ff8787', 'stroke-width': 2.5, transform: 'rotate(-4 100 100)' })), handAt({ t: 'Big ideas', s: 26, tilt: -4 }, 26, 58, 100), I.bulb(162, 50, 24), squiggle(28, 92, 104), squiggle(28, 108, 72)] }),
  mk('notebook', 'Notes (notebook page)', ['notebook', 'notes', 'spiral', 'page', 'school'], { colors: ['#ffffff', '#4dabf7'], motion: 'none',
    art: () => [paper(100, 110, 140, 154, { c: '#ffffff', rule: 'margin', top: 50, gap: 17, curl: false }), ...Array.from({ length: 7 }, (_, i) => [inner(circle(46 + i * 18, 46, 4, { fill: '#dee2e6', stroke: OL, 'stroke-width': 2 })), rect(43 + i * 18, 22, 6, 28, { rx: 3, fill: '#adb5bd', ...ink(2.5) })]), handAt({ t: 'Notes', s: 28, c: '#1c7ed6' }, 62, 66, 100), squiggle(62, 100, 80), squiggle(62, 117, 56), squiggle(62, 134, 88), squiggle(62, 151, 40)] }),
  mk('checklist', 'Checklist (clipboard)', ['checklist', 'clipboard', 'tasks', 'done', 'plan'], { colors: ['#c8875a', '#40c057'], motion: 'none',
    art: () => [path(rrect(42, 26, 116, 160, 12), { fill: '#c8875a', ...ink(5) }), rect(52, 44, 96, 132, { rx: 3, fill: '#ffffff', ...ink(3.5) }), path(rrect(72, 16, 56, 26, 7), { fill: '#adb5bd', ...ink(4.5) }), inner(circle(100, 24, 4, { fill: '#495057' })),
      ...[true, true, false].map((done, i) => { const y = 70 + i * 32; return [box(70, y, done), squiggle(86, y, done ? 48 : 40)]; }), inner(path('M64 162H136', { stroke: '#dee2e6', 'stroke-width': 3 }))] }),
  mk('gift-tag', 'Made with love (gift tag)', ['gift tag', 'tag', 'kraft', 'handmade', 'love'], { colors: ['#d8b58a', '#c92a2a'], motion: 'swing',
    art: () => [inner(path('M100 54C76 14 128 4 116 30', { fill: 'none', stroke: '#c92a2a', 'stroke-width': 3.5, 'stroke-linecap': 'round' })), path(roundPoly([[60, 66], [100, 40], [140, 66], [140, 176], [60, 176]], 8), { fill: '#d8b58a', ...ink(5) }), circle(100, 62, 7, { fill: '#ffffff', ...ink(3.5) }), path('M100 62C90 30 130 24 112 48', { fill: 'none', stroke: '#c92a2a', 'stroke-width': 3.5, 'stroke-linecap': 'round' }),
      hand([{ t: 'Made', s: 26, c: '#6f4e37' }, { t: 'with love', s: 24, c: '#6f4e37' }], 100, 116, 72), I.heart(100, 154, 18, '#ff6b6b')] }),
  mk('get-organized', 'Get organized (page flags)', ['organized', 'page flags', 'tabs', 'planner', 'bookmarks'], { colors: ['#9775fa', '#ffd43b'], motion: 'none',
    art: () => [...[['#ff8787', 40], ['#ffd43b', 66], ['#69db7c', 92], ['#74c0fc', 118]].map(([c, y]) => flag(108, y, 64, 20, c)), path(rrect(38, 28, 96, 128, 10), { fill: '#9775fa', ...ink(5) }), rect(116, 28, 10, 128, { fill: '#7048e8', ...ink(3.5) }), rect(54, 50, 52, 22, { rx: 4, fill: '#ffffff', opacity: 0.9 }), inner(V.label({ t: 'PLANNER', f: 'outfit', s: 11, c: '#7048e8', o: false }, 80, 61, 46))],
    words: [{ t: 'Get organized', f: 'fredoka', s: 24, c: '#7048e8' }], at: [100, 176] }),
  // ---- washi tape
  mk('washi-dots', 'Washi tape: dots', ['washi', 'tape', 'dots', 'pink', 'decor'], { colors: ['#ff8fab', '#ffffff'], motion: 'none', art: () => [washi(100, 100, 180, 46, '#ff8fab', PAT.dots('#ffffff'))] }),
  mk('washi-stripes', 'Washi tape: stripes', ['washi', 'tape', 'stripes', 'mint', 'decor'], { colors: ['#63e6be', '#ffffff'], motion: 'none', art: () => [washi(100, 100, 180, 46, '#63e6be', PAT.stripes('#ffffff'), 12)] }),
  mk('washi-gingham', 'Washi tape: gingham', ['washi', 'tape', 'gingham', 'yellow', 'picnic'], { colors: ['#ffd43b', '#ffffff'], motion: 'none', art: () => [washi(100, 100, 180, 46, '#ffd43b', PAT.gingham('#ffffff'), -14)] }),
  mk('washi-hearts', 'Washi tape: hearts', ['washi', 'tape', 'hearts', 'lilac', 'love'], { colors: ['#b197fc', '#ffffff'], motion: 'none', art: () => [washi(100, 100, 180, 46, '#b197fc', PAT.hearts('#ffffff'), 8)] }),
  mk('washi-stars', 'Washi tape: stars', ['washi', 'tape', 'stars', 'blue', 'night'], { colors: ['#4dabf7', '#ffe066'], motion: 'none', art: () => [washi(100, 100, 180, 46, '#4dabf7', PAT.stars('#ffe066'), -8)] }),
  mk('washi-words', 'Washi tape: you got this', ['washi', 'tape', 'words', 'kraft', 'you got this'], { colors: ['#e3c9a8', '#6f4e37'], motion: 'none',
    art: () => [washi(100, 100, 180, 46, '#e3c9a8', (a, y0, b, y1) => [V.label({ t: 'you got this', f: 'caveat', s: 22, c: '#6f4e37', o: false }, (a + b) / 2, (y0 + y1) / 2, b - a - 50), path(heart(a + 12, (y0 + y1) / 2, 14), { fill: '#ff6b6b' }), path(heart(b - 12, (y0 + y1) / 2, 14), { fill: '#ff6b6b' })], 10)] })
];
module.exports = { CAT, LIST };
