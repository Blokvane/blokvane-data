// Party: balloons, cakes, gifts, poppers, confetti, lights and happy words (Blokvane's own drawings).
'use strict';
const K = require('./kit');
const T = require('./text');
const { r, P, at, g, node, path, circle, ellipse, rect, line, poly, pline, ink, fillInk, anim, heart, star, roundPoly, scallop, cloud, rrect, MOVES: M, OL, HL, SH } = K;
const { blob, egg, smooth, curve, ring, drop, leaf, body, part, X, face, make } = require('./make');

const CAT = 'Party';
const mk = (id, name, tags, o) => make({ id: 'party-' + id, name, cat: CAT, tags: ['party', ...tags], body: o.body, behind: o.behind, front: o.front, extra: o.extra, motion: o.motion || 'bob', css: o.css, colors: o.colors, ground: o.ground });
const W = (text, o) => T.words(text, o).d;
// words with a thick outline behind them (drawn twice: the outline, then the color)
const outlined = (d, fill, w = 9, extra) => g({}, path(d, { fill: OL, stroke: OL, 'stroke-width': w, 'stroke-linejoin': 'round', ...extra }), path(d, { fill }));
const balloon = (cx, cy, rx, ry, fill, str) => [path(str || `M${cx} ${cy + ry + 6}Q${cx - 8} ${cy + ry + 30} ${cx + 4} ${cy + ry + 54}`, { fill: 'none', ...ink(3) }), path(`M${cx - 6} ${cy + ry + 7}L${cx + 6} ${cy + ry + 7}L${cx} ${cy + ry - 1}Z`, fillInk(fill, 3.5)), ellipse(cx, cy, rx, ry, fillInk(fill)), K.shine(cx - rx * 0.42, cy - ry * 0.4, rx * 0.14, ry * 0.24, 30, 0.6)];
const S5 = (cx, cy, ro, fill, w = 4, round = 3) => path(star(cx, cy, ro, ro * 0.48, 5, -90, round), fillInk(fill, w));
const flame = (cx, cy, s = 1, cls = 'fl') => anim(cls, path(`M${cx} ${cy - 14 * s}Q${cx + 9 * s} ${cy - 2 * s} ${cx} ${cy + 6 * s}Q${cx - 9 * s} ${cy - 2 * s} ${cx} ${cy - 14 * s}Z`, fillInk('#ffa94d', 2.5)), path(`M${cx} ${cy - 6 * s}Q${cx + 4 * s} ${cy} ${cx} ${cy + 3 * s}Q${cx - 4 * s} ${cy} ${cx} ${cy - 6 * s}Z`, { fill: '#ffe066' }));
const flickerCss = cls => `.${cls}{animation:${cls}k .6s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}@keyframes ${cls}k{0%{transform:scale(1,1) rotate(-3deg)}100%{transform:scale(.88,1.12) rotate(3deg)}}`;
const bow = (cx, cy, col) => [path(`M${cx} ${cy}C${cx - 10} ${cy - 22} ${cx - 34} ${cy - 18} ${cx - 26} ${cy - 4}C${cx - 22} ${cy + 4} ${cx - 8} ${cy + 2} ${cx} ${cy}Z`, fillInk(col, 4)), path(`M${cx} ${cy}C${cx + 10} ${cy - 22} ${cx + 34} ${cy - 18} ${cx + 26} ${cy - 4}C${cx + 22} ${cy + 4} ${cx + 8} ${cy + 2} ${cx} ${cy}Z`, fillInk(col, 4)), circle(cx, cy, 6, fillInk(col, 4))];
const gift = (x, y, w, h, box, ribbon, o = {}) => [
  rect(x, y, w, h, { rx: 6, ...fillInk(box) }), rect(x + w / 2 - 8, y, 16, h, { fill: ribbon }), path(`M${x + w / 2 - 8} ${y}V${y + h}M${x + w / 2 + 8} ${y}V${y + h}`, { stroke: OL, 'stroke-width': 2, opacity: 0.25 }),
  o.noLid ? null : g({ class: o.lidCls }, rect(x - 6, y - 16, w + 12, 20, { rx: 6, ...fillInk(box) }), rect(x + w / 2 - 8, y - 16, 16, 20, { fill: ribbon }), ...bow(x + w / 2, y - 16, ribbon))
];
const confettiBits = (pts, p = 'c') => ({ n: pts.map((b, i) => anim(p + i, b[3] === 'o' ? circle(b[0], b[1], 4.5, { fill: b[2] }) : b[3] === 's' ? path(`M${b[0] - 6} ${b[1]}q3 -6 6 0t6 0`, { fill: 'none', stroke: b[2], 'stroke-width': 3.5, 'stroke-linecap': 'round' }) : rect(b[0] - 5, b[1] - 3, 10, 6, { rx: 2, fill: b[2], transform: `rotate(${b[3] || 0} ${b[0]} ${b[1]})` }))), css: pts.map((b, i) => M.twinkle(p + i, 1.6, i * 0.2)).join('') });
const COLS = ['#ff6b5e', '#ffd43b', '#4dabf7', '#51cf66', '#cc5de8', '#ff8fab'];

const LIST = () => {
  const hb = W('HAPPY', { font: 'fredoka', size: 22, cx: 100, cy: 74, maxW: 128 });
  const hb2 = W('BIRTHDAY', { font: 'fredoka', size: 22, cx: 100, cy: 106, maxW: 136 });
  const cg = W('Congrats!', { font: 'pacifico', size: 30, cx: 100, cy: 100, maxW: 164 });
  const pt = W('PARTY', { font: 'anton', size: 40, cx: 100, cy: 82, maxW: 150 });
  const pt2 = W('TIME', { font: 'anton', size: 40, cx: 100, cy: 132, maxW: 150 });
  const yay = W('YAY!', { font: 'fredoka', size: 46, cx: 100, cy: 104, maxW: 140 });
  const lp = W("LET'S", { font: 'unbounded', size: 22, cx: 100, cy: 80, maxW: 120 });
  const lp2 = W('PARTY', { font: 'unbounded', size: 30, cx: 100, cy: 120, maxW: 150 });
  return [
    mk('balloon', 'Balloon', ['balloon', 'birthday', 'float', 'red', 'happy'], { colors: ['#ff6b5e'], motion: 'none', ground: false,
      body: [anim('bl', ...balloon(100, 74, 50, 58, '#ff6b5e'), face(100, 80, 54, { mouth: 'smile', eyes: 'happy' }))], css: '.bl{animation:blk 3s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes blk{0%,100%{transform:rotate(-5deg) translateY(0)}50%{transform:rotate(5deg) translateY(-6px)}}' }),
    mk('balloons', 'Bunch of balloons', ['balloons', 'birthday', 'celebrate', 'float', 'colorful'], { colors: ['#ff6b5e', '#ffd43b', '#4dabf7'], motion: 'none', ground: false,
      body: [anim('b1', ...balloon(62, 70, 34, 40, '#ffd43b', 'M62 118Q74 150 100 190')), anim('b3', ...balloon(140, 74, 34, 40, '#4dabf7', 'M140 122Q126 154 100 190')), anim('b2', ...balloon(100, 50, 36, 42, '#ff6b5e', 'M100 100Q94 144 100 190'))],
      css: M.swing('b1', 3.2, 4, '80% 100%') + M.swing('b2', 2.8, 3, '50% 100%') + M.swing('b3', 3.6, 4, '20% 100%') }),
    mk('balloon-dog', 'Balloon dog', ['balloon', 'dog', 'balloon animal', 'fun', 'kids', 'party'], { colors: ['#4dabf7'], motion: 'bounce',
      body: (() => { const B = (cx, cy, rx, ry, rot) => [ellipse(cx, cy, rx, ry, { ...fillInk('#4dabf7'), transform: `rotate(${rot} ${cx} ${cy})` }), ellipse(cx - rx * 0.3, cy - ry * 0.35, rx * 0.2, ry * 0.18, { fill: HL, opacity: 0.6, transform: `rotate(${rot} ${cx} ${cy})` })];
        return [...B(64, 150, 9, 26, 10), ...B(86, 152, 9, 26, -6), ...B(128, 150, 9, 26, 8), ...B(148, 150, 9, 26, -10), ...B(108, 118, 46, 15, 0), ...B(162, 98, 8, 22, 30), ...B(56, 86, 12, 26, 20), ...B(40, 58, 9, 22, -30), ...B(66, 54, 9, 22, 30), ...B(48, 104, 22, 12, 40), circle(36, 110, 4, { fill: OL })]; })() }),
    mk('balloon-star', 'Star balloon', ['balloon', 'star', 'foil', 'shiny', 'birthday', 'gold'], { colors: ['#ffc93a', '#e8a400'], motion: 'none', ground: false,
      body: [anim('bs', path('M100 144Q92 166 104 196', { fill: 'none', ...ink(3) }), path(star(100, 78, 66, 32, 5, -90, 12), fillInk('#ffc93a')), path(star(100, 80, 40, 19, 5, -90, 6), { fill: '#ffe066' }), anim('gl', path('M64 40L82 40L58 120L40 120Z', { fill: HL, opacity: 0.4 })))],
      css: M.swing('bs', 3, 6, '50% 100%') + M.shine('gl', 3, 90) }),
    mk('cake', 'Birthday cake', ['cake', 'birthday', 'candles', 'celebrate', 'dessert'], { colors: ['#ff8fab', '#fff3e3', '#74c0fc'], motion: 'none',
      body: [rect(40, 112, 120, 58, { rx: 8, ...fillInk('#fff3e3') }), rect(40, 150, 120, 8, { fill: '#ff8fab' }), path('M36 112C36 100 44 96 52 96H148C156 96 164 100 164 112V118Q158 128 152 118Q146 134 140 118Q130 126 120 118Q114 132 106 118Q96 128 86 118Q78 136 70 118Q60 128 52 118Q44 130 36 118Z', fillInk('#ff8fab', 4.5)),
        ...[[60, 134], [84, 140], [116, 136], [140, 140]].map((p, i) => circle(p[0], p[1], 4, { fill: COLS[(i + 2) % 6] })), ellipse(100, 172, 74, 10, fillInk('#74c0fc', 4.5)),
        ...[[70, '#4dabf7'], [100, '#ffd43b'], [130, '#51cf66']].map(([x, c]) => rect(x - 5, 66, 10, 32, { rx: 3, ...fillInk(c, 3.5) })), flame(70, 56, 1, 'f1'), flame(100, 56, 1, 'f2'), flame(130, 56, 1, 'f3'), face(100, 136, 40, { mouth: 'smile', eyes: 'happy' })],
      css: flickerCss('f1') + flickerCss('f2').replace('.6s', '.5s') + flickerCss('f3').replace('.6s', '.7s') }),
    mk('gift', 'Gift box', ['gift', 'present', 'birthday', 'surprise', 'christmas'], { colors: ['#4dabf7', '#ffd43b'], motion: 'wiggle',
      body: [...gift(46, 92, 108, 78, '#4dabf7', '#ffd43b'), K.shine(60, 110, 4, 10, 10, 0.5)] }),
    mk('gift-open', 'Surprise gift', ['gift', 'present', 'surprise', 'open', 'birthday'], { colors: ['#cc5de8', '#ff8fab'], motion: 'none',
      body: [...gift(46, 100, 108, 72, '#cc5de8', '#ff8fab', { lidCls: 'ld' })],
      extra: () => ({ n: [anim('sp', path(star(100, 58, 18, 7, 4, -90), fillInk('#ffd43b', 3)), path(star(66, 70, 10, 4, 4, -90), fillInk('#ffd43b', 3)), path(star(136, 66, 12, 5, 4, -90), fillInk('#ffd43b', 3)))],
        css: '.sp{animation:spk 1.8s ease-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes spk{0%,30%{transform:translateY(30px) scale(.2);opacity:0}55%{opacity:1}80%{transform:translateY(-6px) scale(1);opacity:1}100%{opacity:0}}' }),
      css: '.ld{animation:ldk 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:0% 100%}@keyframes ldk{0%,25%,100%{transform:translateY(0) rotate(0)}45%,80%{transform:translateY(-22px) rotate(-14deg)}}' }),
    mk('gift-face', 'Happy gift', ['gift', 'present', 'happy', 'birthday', 'cute'], { colors: ['#ff6b5e', '#ffffff'], motion: 'hop',
      body: [...gift(50, 92, 100, 78, '#ff6b5e', '#ffffff'), face(100, 138, 52, { mouth: 'open', eyes: 'happy', cheek: '#ffc9d4' })] }),
    mk('gifts', 'Pile of gifts', ['gifts', 'presents', 'christmas', 'birthday', 'holidays'], { colors: ['#51cf66', '#ff6b5e', '#ffd43b'], motion: 'none',
      body: [...gift(22, 120, 76, 56, '#51cf66', '#ff6b5e'), ...gift(104, 104, 76, 72, '#ffd43b', '#4dabf7'), g({ class: 'tp' }, ...gift(64, 62, 60, 46, '#ff6b5e', '#ffd43b'))], css: M.wiggle('tp', 2, 4) }),
    mk('popper', 'Party popper', ['popper', 'confetti', 'celebrate', 'congrats', 'surprise'], { colors: ['#ffd43b', '#ff6b5e'], motion: 'none',
      body: [path('M24 178L74 82L120 128Z', fillInk('#ffd43b')), path('M44 140L90 106M56 116L104 120M36 162L64 132', { stroke: '#ff6b5e', 'stroke-width': 7, 'stroke-linecap': 'round' }), path('M24 178L74 82L120 128Z', { fill: 'none', ...ink(5) }), ellipse(98, 104, 30, 14, { ...fillInk('#ff6b5e', 4.5), transform: 'rotate(45 98 104)' })],
      extra: () => { const bits = [[124, 70, '#4dabf7', 20], [146, 92, '#51cf66', 60], [112, 44, '#cc5de8', 'o'], [160, 52, '#ffd43b', 's'], [170, 116, '#ff8fab', 'o'], [138, 30, '#ff6b5e', 30], [90, 30, '#ffd43b', 's'], [176, 80, '#4dabf7', 75]];
        return { n: bits.map((b, i) => anim('p' + i, b[3] === 'o' ? circle(b[0], b[1], 5, { fill: b[2] }) : b[3] === 's' ? path(`M${b[0] - 7} ${b[1]}q3.5 -7 7 0t7 0`, { fill: 'none', stroke: b[2], 'stroke-width': 4, 'stroke-linecap': 'round' }) : rect(b[0] - 6, b[1] - 3.5, 12, 7, { rx: 2, fill: b[2], transform: `rotate(${b[3]} ${b[0]} ${b[1]})` }))),
          css: bits.map((b, i) => `.p${i}{animation:p${i}k 1.6s cubic-bezier(.2,.8,.4,1) ${r(i * 0.07)}s infinite}@keyframes p${i}k{0%{transform:translate(${r(98 - b[0])}px,${r(104 - b[1])}px) scale(.3);opacity:0}15%{opacity:1}70%{transform:translate(0,0) scale(1);opacity:1}100%{transform:translate(0,14px);opacity:0}}`).join('') }; } }),
    mk('confetti', 'Confetti', ['confetti', 'celebrate', 'party', 'colorful', 'fun'], { colors: COLS, motion: 'none', ground: false,
      body: [], extra: () => { const pts = []; for (let i = 0; i < 22; i++) { const a = i * 137.5, rr = 20 + (i * 37) % 70; const p = at(100, 100, rr, a); pts.push([r(p[0]), r(p[1]), COLS[i % 6], i % 4 === 0 ? 'o' : i % 4 === 1 ? 's' : (i * 40) % 180]); }
        const c = confettiBits(pts, 'k'); c.css = pts.map((b, i) => M.fall('k' + i, 2.4 + (i % 4) * 0.3, r((i % 7) * 0.3), 30)).join(''); return c; } }),
    mk('hat', 'Party hat', ['hat', 'party hat', 'birthday', 'celebrate'], { colors: ['#cc5de8', '#ffd43b', '#ff8fab'], motion: 'tilt',
      body: [path('M48 168L100 30L152 168Q100 184 48 168Z', fillInk('#cc5de8')), path('M78 90L118 102M64 130L136 146', { stroke: '#ffd43b', 'stroke-width': 10, 'stroke-linecap': 'round' }), ...[[96, 70], [84, 116], [118, 124], [100, 158], [70, 154], [128, 160]].map((p, i) => circle(p[0], p[1], 4, { fill: i % 2 ? '#ffffff' : '#ff8fab' })),
        path('M48 168L100 30L152 168Q100 184 48 168Z', { fill: 'none', ...ink(5) }), path('M44 168Q100 186 156 168', { fill: 'none', stroke: '#ff8fab', 'stroke-width': 10, 'stroke-linecap': 'round' }), path('M44 168Q100 186 156 168', { fill: 'none', ...ink(3), opacity: 0.6 }),
        anim('pm', circle(100, 28, 13, fillInk('#ffd43b', 4)))], css: M.bob('pm', 0.8, 3) }),
    mk('disco', 'Disco ball', ['disco', 'dance', 'music', 'night', 'party', 'mirror ball'], { colors: ['#ced4da', '#e9ecef', '#adb5bd'], motion: 'none',
      body: [line(100, 0, 100, 34, ink(4)), node('defs', {}, [node('clipPath', { id: 'dc' }, [circle(100, 100, 64)])]), circle(100, 100, 64, { fill: '#ced4da' }),
        g({ 'clip-path': 'url(#dc)' }, anim('tl', ...Array.from({ length: 14 }, (_, i) => Array.from({ length: 14 }, (_, j) => (i + j) % 3 === 0 ? rect(36 + i * 10, 36 + j * 10, 9, 9, { fill: (i * j) % 4 ? '#e9ecef' : '#ffffff' }) : (i + j) % 3 === 1 ? rect(36 + i * 10, 36 + j * 10, 9, 9, { fill: '#adb5bd' }) : null)).flat()),
          path('M36 70H164M36 100H164M36 130H164M70 36V164M100 36V164M130 36V164', { stroke: '#868e96', 'stroke-width': 1.5, opacity: 0.6 })), circle(100, 100, 64, { fill: 'none', ...ink(5) }), K.shine(76, 74, 8, 14, 40, 0.7)],
      extra: () => X.sparkles([[30, 60, 13], [172, 70, 12], [36, 160, 10], [166, 160, 11]], '#ffffff'), css: '.tl{animation:tlk 2s steps(5) infinite}@keyframes tlk{to{transform:translateX(30px)}}' }),
    mk('bunting', 'Party flags', ['bunting', 'flags', 'garland', 'decoration', 'celebrate'], { colors: COLS.slice(0, 5), motion: 'none', ground: false,
      body: [anim('bt', path('M6 52Q100 104 194 52', { fill: 'none', ...ink(4) }), ...[[24, '#ff6b5e'], [58, '#ffd43b'], [92, '#4dabf7'], [126, '#51cf66'], [160, '#cc5de8']].map(([x, c], i) => { const y = 52 + Math.sin(Math.PI * (x - 6) / 188) * 26; return path(`M${r(x - 15)} ${r(y - 2)}L${r(x + 15)} ${r(y + 2)}L${r(x)} ${r(y + 40)}Z`, fillInk(c, 4)); }))],
      css: M.swing('bt', 3, 2, '50% 0%') }),
    mk('lights', 'String lights', ['lights', 'string lights', 'decoration', 'night', 'cozy', 'christmas'], { colors: ['#ffd43b', '#ff6b5e', '#51cf66', '#4dabf7'], motion: 'none', ground: false,
      body: [path('M4 60Q50 110 100 80T196 70', { fill: 'none', ...ink(4) }), ...[[24, 76, '#ffd43b'], [56, 94, '#ff6b5e'], [90, 86, '#51cf66'], [124, 74, '#4dabf7'], [158, 70, '#ffd43b'], [186, 74, '#ff6b5e']].map((p, i) => g({}, rect(p[0] - 5, p[1] - 4, 10, 10, { rx: 2, fill: '#495057', ...ink(2.5) }), anim('l' + i, path(`M${p[0] - 9} ${p[1] + 14}C${p[0] - 9} ${p[1] + 4} ${p[0] + 9} ${p[1] + 4} ${p[0] + 9} ${p[1] + 14}C${p[0] + 9} ${p[1] + 26} ${p[0]} ${p[1] + 32} ${p[0]} ${p[1] + 32}C${p[0]} ${p[1] + 32} ${p[0] - 9} ${p[1] + 26} ${p[0] - 9} ${p[1] + 14}Z`, fillInk(p[2], 3.5)))))],
      css: [0, 1, 2, 3, 4, 5].map(i => `.l${i}{animation:l${i}k 1.4s ease-in-out ${r(i * 0.23)}s infinite alternate}@keyframes l${i}k{0%{opacity:1}100%{opacity:.35}}`).join('') }),
    mk('fireworks', 'Fireworks', ['fireworks', 'celebrate', 'new year', 'night', 'boom', 'holiday'], { colors: ['#ff6b5e', '#ffd43b', '#4dabf7'], motion: 'none', ground: false,
      body: [[100, 92, 70, '#ff6b5e', 'w1', 0], [54, 56, 34, '#ffd43b', 'w2', 0.5], [150, 140, 36, '#4dabf7', 'w3', 1]].map(([cx, cy, rr, c, cls]) => anim(cls, ...Array.from({ length: 12 }, (_, i) => { const a = i * 30, p1 = at(cx, cy, rr * 0.35, a), p2 = at(cx, cy, rr, a); return line(r(p1[0]), r(p1[1]), r(p2[0]), r(p2[1]), { stroke: c, 'stroke-width': rr > 50 ? 7 : 5, 'stroke-linecap': 'round' }); }), ...Array.from({ length: 12 }, (_, i) => { const p = at(cx, cy, rr * 1.15, i * 30 + 15); return circle(r(p[0]), r(p[1]), rr > 50 ? 4 : 3, { fill: c }); }))),
      css: [['w1', 0], ['w2', 0.5], ['w3', 1]].map(([c, d]) => `.${c}{animation:${c}k 1.8s ease-out ${d}s infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${c}k{0%{transform:scale(.1);opacity:0}15%{opacity:1}70%{transform:scale(1);opacity:1}100%{transform:scale(1.1);opacity:0}}`).join('') }),
    mk('sparkler', 'Sparkler', ['sparkler', 'sparkle', 'celebrate', 'new year', 'night'], { colors: ['#ffd43b', '#ffa94d', '#adb5bd'], motion: 'none',
      body: [line(56, 176, 120, 70, ink(10)), line(56, 176, 120, 70, { stroke: '#adb5bd', 'stroke-width': 4, 'stroke-linecap': 'round' }), line(96, 110, 124, 64, { stroke: '#868e96', 'stroke-width': 9, 'stroke-linecap': 'round' }),
        anim('sk', ...Array.from({ length: 10 }, (_, i) => { const a = i * 36, p1 = at(124, 64, 8, a), p2 = at(124, 64, i % 2 ? 40 : 30, a); return line(r(p1[0]), r(p1[1]), r(p2[0]), r(p2[1]), { stroke: i % 3 ? '#ffd43b' : '#ffa94d', 'stroke-width': 4, 'stroke-linecap': 'round' }); }), circle(124, 64, 9, { fill: '#fff3bf' }))],
      css: '.sk{animation:skk .35s steps(2) infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes skk{0%{transform:rotate(0) scale(1)}100%{transform:rotate(18deg) scale(.86)}}' }),
    mk('horn', 'Party horn', ['horn', 'blower', 'noisemaker', 'birthday', 'celebrate'], { colors: ['#4dabf7', '#ffd43b', '#ff6b5e'], motion: 'none',
      body: [path('M20 120L70 98V134Z', fillInk('#4dabf7', 4.5)), path('M30 112L60 104M30 126L60 130', { stroke: '#ffd43b', 'stroke-width': 4 }),
        anim('hr', path('M68 104H140C170 104 176 140 150 140C134 140 132 124 144 122', { fill: 'none', ...ink(26) }), path('M68 104H140C170 104 176 140 150 140C134 140 132 124 144 122', { fill: 'none', stroke: '#ff6b5e', 'stroke-width': 18, 'stroke-linecap': 'round' }), path('M86 104V122M110 104V122', { stroke: '#ffd43b', 'stroke-width': 4 }))],
      css: '.hr{animation:hrk 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:0% 50%}@keyframes hrk{0%,100%{transform:scaleX(.45)}40%,70%{transform:scaleX(1)}}' }),
    mk('pinata', 'Star piñata', ['pinata', 'star', 'party', 'fiesta', 'candy', 'kids'], { colors: ['#ff6b5e', '#ffd43b', '#4dabf7', '#51cf66'], motion: 'swing',
      body: [line(100, 0, 100, 40, ink(4)), node('defs', {}, [node('clipPath', { id: 'pc' }, [path(star(100, 100, 66, 34, 5, -90, 8))])]), path(star(100, 100, 66, 34, 5, -90, 8), { fill: '#ffd43b' }),
        g({ 'clip-path': 'url(#pc)' }, ...[34, 52, 70, 88, 106, 124, 142, 160].map((y, i) => path(`M20 ${y}q10 -8 20 0t20 0t20 0t20 0t20 0t20 0t20 0t20 0`, { fill: 'none', stroke: ['#ff6b5e', '#4dabf7', '#51cf66', '#cc5de8'][i % 4], 'stroke-width': 7 }))),
        path(star(100, 100, 66, 34, 5, -90, 8), { fill: 'none', ...ink(5) }), ...[[52, 150], [148, 150]].map(p => path(`M${p[0] - 6} ${p[1]}l-4 22M${p[0]} ${p[1]}v24M${p[0] + 6} ${p[1]}l4 22`, { stroke: '#ff8fab', 'stroke-width': 4, 'stroke-linecap': 'round' })), face(100, 102, 40, { mouth: 'open', eyes: 'happy' })] }),
    mk('trophy', 'Trophy', ['trophy', 'winner', 'award', 'champion', 'first', 'cup', 'gold'], { colors: ['#ffc93a', '#e8a400', '#2b2346'], motion: 'bob',
      body: [path('M56 52Q26 52 30 82Q34 106 64 108M144 52Q174 52 170 82Q166 106 136 108', { fill: 'none', ...ink(16) }), path('M56 52Q26 52 30 82Q34 106 64 108M144 52Q174 52 170 82Q166 106 136 108', { fill: 'none', stroke: '#ffc93a', 'stroke-width': 8 }),
        path('M54 36H146V82Q146 128 100 130Q54 128 54 82Z', fillInk('#ffc93a')), rect(88, 128, 24, 20, { fill: '#e8a400', ...ink(4.5) }), rect(64, 146, 72, 26, { rx: 6, ...fillInk('#2b2346', 4) }), rect(80, 154, 40, 10, { rx: 3, fill: '#ffc93a' }),
        S5(100, 78, 20, '#fff3bf', 3.5, 2), anim('gl', path('M66 40L82 40L70 120L54 120Z', { fill: HL, opacity: 0.45 }))], extra: () => X.sparkles([[30, 30, 11], [172, 26, 10], [176, 130, 8]], '#ffd43b'), css: M.shine('gl', 3, 70) }),
    mk('crown', 'Crown', ['crown', 'king', 'queen', 'royal', 'winner', 'birthday', 'gold'], { colors: ['#ffc93a', '#ff4d6d', '#4dabf7'], motion: 'none',
      body: [path('M34 150L26 66L68 102L100 46L132 102L174 66L166 150Q100 164 34 150Z', fillInk('#ffc93a')), path('M34 150Q100 164 166 150V166Q100 180 34 166Z', fillInk('#e8a400', 4.5)), circle(100, 120, 11, fillInk('#ff4d6d', 3.5)), circle(62, 128, 8, fillInk('#4dabf7', 3.5)), circle(138, 128, 8, fillInk('#4dabf7', 3.5)),
        circle(26, 62, 8, fillInk('#ffc93a', 4)), circle(100, 42, 8, fillInk('#ffc93a', 4)), circle(174, 62, 8, fillInk('#ffc93a', 4)), anim('gl', path('M50 80L64 80L56 150L42 150Z', { fill: HL, opacity: 0.45 }))],
      extra: () => X.sparkles([[36, 30, 12], [160, 30, 10], [184, 120, 8]], '#ffd43b'), css: M.shine('gl', 3, 120) }),
    mk('cheers', 'Cheers', ['cheers', 'toast', 'celebrate', 'new year', 'glasses', 'congrats'], { colors: ['#ffe066', '#e7f5ff'], motion: 'none',
      body: [anim('g1', path('M44 40H96L90 104Q84 124 70 124Q56 124 50 104Z', fillInk('#e7f5ff')), path('M47 64H93L89 102Q84 118 70 118Q56 118 51 102Z', { fill: '#ffe066' }), line(70, 124, 70, 168, ink(5)), line(50, 170, 90, 170, ink(6)), circle(62, 84, 3, { fill: '#ffffff' }), circle(76, 96, 2.5, { fill: '#ffffff' })),
        anim('g2', path('M104 40H156L150 104Q144 124 130 124Q116 124 110 104Z', fillInk('#e7f5ff')), path('M107 64H153L149 102Q144 118 130 118Q116 118 111 102Z', { fill: '#ffe066' }), line(130, 124, 130, 168, ink(5)), line(110, 170, 150, 170, ink(6)), circle(122, 88, 3, { fill: '#ffffff' }), circle(138, 80, 2.5, { fill: '#ffffff' }))],
      extra: () => X.sparkles([[100, 26, 12], [76, 18, 7], [126, 16, 8]], '#ffd43b'),
      css: '.g1{animation:g1k 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes g1k{0%,100%{transform:rotate(-8deg)}50%{transform:rotate(6deg)}}.g2{animation:g2k 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes g2k{0%,100%{transform:rotate(8deg)}50%{transform:rotate(-6deg)}}' }),
    mk('notes', 'Music notes', ['music', 'notes', 'song', 'dance', 'sing'], { colors: ['#845ef7', '#ff6b5e'], motion: 'none',
      body: [anim('n1', path('M48 150V64L130 44V128', { fill: 'none', ...ink(9) }), path('M48 72L130 52V68L48 88Z', fillInk('#845ef7', 4)), ellipse(36, 152, 17, 13, { ...fillInk('#845ef7'), transform: 'rotate(-20 36 152)' }), ellipse(118, 132, 17, 13, { ...fillInk('#845ef7'), transform: 'rotate(-20 118 132)' })),
        anim('n2', path('M166 120V60Q176 66 184 80', { fill: 'none', ...ink(7) }), ellipse(156, 122, 14, 11, { ...fillInk('#ff6b5e'), transform: 'rotate(-20 156 122)' }))], css: M.bounce('n1', 1, 8) + M.bounce('n2', 1, 12).replace('infinite', 'infinite;animation-delay:.3s') }),
    mk('mic', 'Microphone', ['microphone', 'mic', 'karaoke', 'sing', 'music', 'show'], { colors: ['#adb5bd', '#ff6b5e', '#495057'], motion: 'tilt',
      body: [path('M100 120V176M72 178H128', { fill: 'none', ...ink(6) }), path('M64 84Q64 126 100 126Q136 126 136 84', { fill: 'none', ...ink(6) }), rect(76, 24, 48, 84, { rx: 24, ...fillInk('#adb5bd') }), path('M76 60H124M76 72H124', { stroke: '#868e96', 'stroke-width': 3 }),
        path('M76 84H124V84Q124 108 100 108Q76 108 76 84Z', fillInk('#ff6b5e', 4.5)), K.shine(88, 40, 4, 9, 20, 0.6)], extra: () => X.notes() }),
    mk('glasses', 'Party glasses', ['glasses', 'sunglasses', 'star', 'fun', 'party', 'cool'], { colors: ['#ff4d94', '#74c0fc'], motion: 'wiggle',
      body: [path('M14 92Q8 80 20 78M186 92Q192 80 180 78', { fill: 'none', ...ink(5) }), path(star(56, 104, 40, 20, 5, -90, 6), fillInk('#ff4d94')), path(star(144, 104, 40, 20, 5, -90, 6), fillInk('#ff4d94')), path('M84 96Q100 86 116 96', { fill: 'none', ...ink(6) }),
        path(star(56, 106, 22, 11, 5, -90, 3), { fill: '#74c0fc' }), path(star(144, 106, 22, 11, 5, -90, 3), { fill: '#74c0fc' }), K.shine(48, 98, 3, 6, 30, 0.8), K.shine(136, 98, 3, 6, 30, 0.8)], extra: () => X.sparkles([[100, 50, 10], [30, 160, 8], [170, 156, 9]], '#ffd43b') }),
    mk('ticket', 'Ticket', ['ticket', 'admit one', 'show', 'movie', 'event', 'raffle'], { colors: ['#ffd43b', '#ff6b5e'], motion: 'wiggle',
      body: [path('M20 64H180V90A14 14 0 0 0 180 118V144H20V118A14 14 0 0 0 20 90Z', fillInk('#ffd43b')), path('M140 70V138', { stroke: OL, 'stroke-width': 3, 'stroke-dasharray': '6 6' }), rect(36, 80, 92, 48, { rx: 6, fill: 'none', stroke: '#ff6b5e', 'stroke-width': 3 }),
        path(W('ADMIT', { font: 'anton', size: 14, cx: 82, cy: 96, maxW: 80 }), { fill: '#ff6b5e' }), path(W('ONE', { font: 'anton', size: 14, cx: 82, cy: 114, maxW: 80 }), { fill: '#ff6b5e' }), S5(160, 104, 12, '#ff6b5e', 3, 1)] }),
    mk('invite', 'Party invitation', ['invitation', 'invite', 'envelope', 'party', 'mail'], { colors: ['#e5dbff', '#845ef7', '#ffd43b'], motion: 'bob',
      body: [rect(28, 72, 144, 96, { rx: 10, ...fillInk('#e5dbff') }), rect(44, 44, 112, 80, { rx: 6, ...fillInk('#ffffff', 4) }), path(W("YOU'RE", { font: 'fredoka', size: 13, cx: 100, cy: 64, maxW: 90 }), { fill: '#845ef7' }), path(W('INVITED!', { font: 'fredoka', size: 13, cx: 100, cy: 84, maxW: 96 }), { fill: '#845ef7' }),
        path('M30 76L100 126L170 76V160Q170 166 164 166H36Q30 166 30 160Z', fillInk('#d0bfff', 4.5)), path('M30 162L86 116M170 162L114 116', { fill: 'none', ...ink(3.5) }), S5(100, 128, 14, '#ffd43b', 3.5, 2)],
      extra: () => confettiBits([[22, 40, '#ff6b5e', 30], [176, 40, '#4dabf7', 'o'], [186, 120, '#ffd43b', 's'], [14, 128, '#51cf66', 60]]) }),
    mk('happy-birthday', 'Happy birthday', ['happy birthday', 'birthday', 'words', 'celebrate', 'banner'], { colors: ['#ff6b5e', '#ffd43b', '#4dabf7'], motion: 'none',
      body: [path('M20 46H40V130H20L30 112L10 96L30 80L10 64Z', fillInk('#e03131', 4.5)), path('M180 46H160V130H180L170 112L190 96L170 80L190 64Z', fillInk('#e03131', 4.5)), rect(30, 40, 140, 88, { rx: 8, ...fillInk('#ff6b5e') }),
        outlined(hb, '#ffffff', 6), outlined(hb2, '#ffd43b', 6), ...[[44, 148, '#ffd43b'], [100, 156, '#4dabf7'], [156, 148, '#51cf66']].map(([x, y, c], i) => anim('b' + i, ellipse(x, y, 16, 19, fillInk(c, 4)), K.shine(x - 6, y - 7, 2.5, 5, 30, 0.6)))],
      css: [0, 1, 2].map(i => M.bob('b' + i, 1.6 + i * 0.3, 5)).join('') }),
    mk('congrats', 'Congrats', ['congrats', 'congratulations', 'well done', 'words', 'celebrate'], { colors: ['#845ef7', '#ffd43b'], motion: 'pop',
      body: [path('M14 74Q100 52 186 74L176 134Q100 116 24 134Z', fillInk('#845ef7')), path('M14 74L2 96L24 104M186 74L198 96L176 104', { fill: 'none', ...ink(4) }), outlined(cg, '#ffffff', 7)],
      extra: () => confettiBits([[30, 40, '#ff6b5e', 30], [170, 36, '#4dabf7', 'o'], [100, 26, '#ffd43b', 's'], [40, 160, '#51cf66', 60], [160, 162, '#ff8fab', 'o'], [100, 170, '#ffd43b', 20]]) }),
    mk('party-time', 'Party time', ['party time', 'party', 'words', 'fun', 'weekend'], { colors: ['#ff4d94', '#ffd43b'], motion: 'none',
      body: [anim('w1', outlined(pt, '#ff4d94', 10)), anim('w2', outlined(pt2, '#ffd43b', 10))], extra: () => X.sparkles([[26, 40, 12], [176, 46, 11], [180, 150, 9], [22, 150, 9]], '#4dabf7'), css: M.tilt('w1', 1.6, 3) + M.tilt('w2', 1.6, 3).replace('infinite', 'infinite reverse') }),
    mk('yay', 'Yay!', ['yay', 'hooray', 'happy', 'words', 'celebrate', 'woohoo'], { colors: ['#ffd43b', '#ff6b5e'], motion: 'none',
      body: [anim('bg', path(star(100, 104, 90, 66, 14, -90), fillInk('#ff6b5e'))), anim('tx', outlined(yay, '#ffd43b', 10))], css: M.spin('bg', 18) + M.pop('tx', 1.6) }),
    mk('lets-party', "Let's party", ['lets party', 'party', 'words', 'dance', 'fun', 'night'], { colors: ['#4dabf7', '#ffd43b', '#cc5de8'], motion: 'none',
      body: [rect(14, 50, 172, 104, { rx: 22, ...fillInk('#cc5de8') }), anim('w1', outlined(lp, '#ffd43b', 7)), anim('w2', outlined(lp2, '#ffffff', 8))], extra: () => X.notes(), css: M.bounce('w1', 0.9, 4) + M.bounce('w2', 0.9, 4).replace('infinite', 'infinite;animation-delay:.2s') }),
    mk('streamers', 'Streamers', ['streamers', 'ribbons', 'curly', 'decoration', 'celebrate'], { colors: ['#ff6b5e', '#ffd43b', '#4dabf7'], motion: 'none', ground: false,
      body: [['#ff6b5e', 50, 's1'], ['#ffd43b', 100, 's2'], ['#4dabf7', 150, 's3']].map(([c, x, cls], i) => anim(cls, path(`M${x} 10Q${x + 30} 30 ${x} 50T${x} 90T${x} 130T${x} 170`, { fill: 'none', ...ink(14) }), path(`M${x} 10Q${x + 30} 30 ${x} 50T${x} 90T${x} 130T${x} 170`, { fill: 'none', stroke: c, 'stroke-width': 8, 'stroke-linecap': 'round' }))),
      css: [1, 2, 3].map(i => M.swing('s' + i, 1.6 + i * 0.25, 5, '50% 0%')).join('') }),
    mk('candle', 'Candle', ['candle', 'birthday', 'light', 'wish', 'cozy'], { colors: ['#ff8fab', '#ffffff'], motion: 'none',
      body: [rect(80, 70, 40, 104, { rx: 8, ...fillInk('#ff8fab') }), path('M80 92L120 78M80 120L120 106M80 148L120 134', { stroke: '#ffffff', 'stroke-width': 6 }), rect(80, 70, 40, 104, { rx: 8, fill: 'none', ...ink(5) }), line(100, 70, 100, 58, ink(4)), flame(100, 46, 1.9, 'fl'),
        circle(100, 40, 30, { fill: '#ffe066', opacity: 0.18, class: 'gw' })], css: flickerCss('fl') + M.pulse('gw', 1.2, 1.15) })
  ];
};
module.exports = { LIST, CAT };
