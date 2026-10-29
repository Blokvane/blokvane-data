// Boo, Blokvane's ghost, in many moods and with many things to hold.
'use strict';
const K = require('./kit');
const T = require('./text');
const { g, node, path, circle, ellipse, rect, line, ink, fillInk, shade, shine, ground, anim, heart, star, ghost, face, sticker, MOVES: M, css, OL, HL, SH } = K;

const BODY = '#ffffff';
const CAT = 'Boo';
// the body (Boo is drawn in a 200 x 200 box: head top at y 30, hem near y 160)
const bodyD = ghost(100, 30, 112, 122, 3);
const body = (fill = BODY) => g({}, path(bodyD, fillInk(fill)), shade('M140 52C152 66 156 84 156 100V150Q148 160 140 152C146 120 148 82 140 52Z', 0.07));
// arms (drawn behind the body so the body hides where they join)
const armL = (cls) => g({ class: cls }, ellipse(47, 116, 9, 15, { ...fillInk(BODY), transform: 'rotate(28 47 116)' }));
const armR = (cls) => g({ class: cls }, ellipse(153, 116, 9, 15, { ...fillInk(BODY), transform: 'rotate(-28 153 116)' }));
const waveR = (cls = 'wave') => g({ class: cls }, ellipse(166, 88, 9, 16, { ...fillInk(BODY), transform: 'rotate(38 166 88)' }));
const waveL = (cls = 'wave2') => g({ class: cls }, ellipse(34, 88, 9, 16, { ...fillInk(BODY), transform: 'rotate(-38 34 88)' }));
// arms holding something in front (drawn last)
const holdArms = (y = 128, spread = 30) => g({}, ellipse(100 - spread, y, 8, 13, { ...fillInk(BODY), transform: `rotate(-62 ${100 - spread} ${y})` }), ellipse(100 + spread, y, 8, 13, { ...fillInk(BODY), transform: `rotate(62 ${100 + spread} ${y})` }));

// ---------- hats and things
const HATS = {
  party: () => g({}, path('M76 44L104 10L126 40Z', fillInk('#ff6b5e')), path('M86 32L112 28M95 20L116 17', { fill: 'none', stroke: '#ffd43b', 'stroke-width': 5, 'stroke-linecap': 'round' }), circle(104, 10, 7, fillInk('#ffd43b')), path('M76 44Q101 52 126 40', { fill: 'none', ...ink(5) })),
  crown: () => g({}, path('M66 46L62 12L82 28L100 4L118 28L138 12L134 46Q100 54 66 46Z', fillInk('#ffc93a')), circle(100, 34, 5, { fill: '#ff4d6d', ...ink(3) }), circle(78, 38, 4, { fill: '#4dabf7', ...ink(3) }), circle(122, 38, 4, { fill: '#4dabf7', ...ink(3) }), path('M70 20L76 26', { stroke: HL, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 })),
  beanie: () => g({}, path('M50 66C50 26 150 26 150 66Q100 54 50 66Z', fillInk('#4dabf7')), path('M46 70Q100 52 154 70L152 56Q100 42 48 56Z', fillInk('#1c7ed6')), path('M70 36V58M86 30V54M102 28V52M118 30V54M134 38V58', { stroke: SH, 'stroke-width': 3, opacity: 0.12, 'stroke-linecap': 'round' }), circle(100, 22, 12, fillInk('#ffffff'))),
  grad: () => g({}, path('M58 42L100 26L142 42L100 58Z', fillInk('#2b2346')), path('M76 50V64Q100 74 124 64V50', fillInk('#2b2346')), path('M100 42L136 52V76', { fill: 'none', stroke: '#ffc93a', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(136, 80, 5, { fill: '#ffc93a' })),
  chef: () => g({}, path('M64 58V42C50 40 52 18 70 20C74 6 96 4 100 14C106 2 128 6 130 20C148 18 150 40 136 42V58Z', fillInk('#ffffff')), path('M64 50H136', ink(4)), path('M84 24Q86 34 84 44M114 24Q112 34 114 44', { fill: 'none', stroke: SH, 'stroke-width': 3, opacity: 0.12, 'stroke-linecap': 'round' })),
  beret: () => g({}, path('M54 52C50 30 90 18 122 26C150 32 158 48 146 54C120 46 82 46 54 52Z', fillInk('#e03131')), path('M98 22L100 12', ink(5))),
  bow: () => g({}, path('M100 34L74 20Q66 34 74 48Z', fillInk('#ff6fae')), path('M100 34L126 20Q134 34 126 48Z', fillInk('#ff6fae')), circle(100, 34, 8, fillInk('#ff4d94'))),
  headphones: () => g({}, path('M48 86C44 30 156 30 152 86', { fill: 'none', ...ink(11) }), path('M48 86C44 30 156 30 152 86', { fill: 'none', stroke: '#845ef7', 'stroke-width': 5, 'stroke-linecap': 'round' }), rect(36, 72, 20, 32, { rx: 9, ...fillInk('#845ef7') }), rect(144, 72, 20, 32, { rx: 9, ...fillInk('#845ef7') })),
  headband: () => g({}, path('M46 64Q100 46 154 64L156 76Q100 58 44 76Z', fillInk('#e03131')), path('M152 70L176 62L170 80Z', fillInk('#e03131'))),
  flower: () => g({}, ...[0, 72, 144, 216, 288].map(a => ellipse(132 + 11 * Math.cos(a * Math.PI / 180), 40 + 11 * Math.sin(a * Math.PI / 180), 8, 8, fillInk('#ff8fab', 3.5))), circle(132, 40, 7, fillInk('#ffd43b', 3.5))),
  sun: () => g({}, path('M58 60C58 34 142 34 142 60Z', fillInk('#ffd43b')), path('M40 62Q100 50 168 66', { fill: 'none', ...ink(8) }), path('M40 62Q100 50 168 66', { fill: 'none', stroke: '#ffd43b', 'stroke-width': 3, 'stroke-linecap': 'round' }))
};
// ---------- floating extras (each with its own motion)
const hearts = () => ({
  n: [anim('h1', path(heart(46, 52, 20), fillInk('#ff4d6d', 3.5))), anim('h2', path(heart(160, 40, 16), fillInk('#ff8fab', 3.5))), anim('h3', path(heart(150, 74, 12), fillInk('#ff4d6d', 3)))],
  css: M.fadeUp('h1', 2.6, 0, 26) + M.fadeUp('h2', 2.6, 0.9, 26) + M.fadeUp('h3', 2.6, 1.7, 26)
});
const sparkles = (pts = [[40, 48], [164, 40], [168, 120]], col = '#ffd43b') => ({
  n: pts.map((p, i) => anim('s' + i, path(star(p[0], p[1], 11 - i, 3.2, 4, -90), { fill: col, ...ink(2.5) }))),
  css: pts.map((p, i) => M.twinkle('s' + i, 1.8, i * 0.5)).join('')
});
let zz = null;
const zzz = () => {
  zz = zz || [T.words('Z', { font: 'fredoka', size: 16, cx: 150, cy: 54 }).d, T.words('Z', { font: 'fredoka', size: 12, cx: 166, cy: 34 }).d, T.words('Z', { font: 'fredoka', size: 9, cx: 178, cy: 18 }).d];
  return { n: zz.map((d, i) => anim('z' + i, path(d, { fill: '#748ffc', ...ink(2.5), 'paint-order': 'stroke' }))), css: zz.map((d, i) => M.fadeUp('z' + i, 3, i * 0.8, 14)).join('') };
};
const notes = () => ({
  n: [anim('n1', path('M40 60V36L58 32V54', { fill: 'none', ...ink(4) }), ellipse(35, 61, 6, 5, { fill: OL }), ellipse(53, 55, 6, 5, { fill: OL })), anim('n2', path('M160 46V24', ink(4)), path('M160 24Q170 28 172 38', { fill: 'none', ...ink(4) }), ellipse(155, 47, 6, 5, { fill: OL }))],
  css: M.fadeUp('n1', 2.4, 0, 20) + M.fadeUp('n2', 2.4, 1.2, 20)
});
const confetti = () => {
  const bits = [[34, 40, '#ff6b5e', 0], [166, 30, '#4dabf7', 30], [176, 100, '#ffd43b', 60], [24, 110, '#51cf66', 15], [150, 150, '#cc5de8', 45], [44, 160, '#ffd43b', 70]];
  return { n: bits.map((b, i) => anim('c' + i, rect(b[0] - 5, b[1] - 3, 10, 6, { rx: 2, fill: b[2], transform: `rotate(${b[3]} ${b[0]} ${b[1]})` }))), css: bits.map((b, i) => M.twinkle('c' + i, 1.6, i * 0.25)).join('') };
};
const snow = () => {
  const f = [[30, 30], [170, 20], [180, 90], [20, 100], [60, 10], [140, 6]];
  return { n: f.map((p, i) => anim('f' + i, circle(p[0], p[1], 4.5, { fill: '#ffffff', stroke: '#a5d8ff', 'stroke-width': 2 }))), css: f.map((p, i) => M.fall('f' + i, 3, i * 0.45, 70)).join('') };
};
const tear = () => ({ n: [anim('tr', path('M76 92Q70 104 76 108Q82 104 76 92Z', fillInk('#74c0fc', 2.5)))], css: M.fall('tr', 1.8, 0, 24) });
const sweat = () => ({ n: [anim('sw', path('M140 50Q132 64 140 68Q148 64 140 50Z', fillInk('#74c0fc', 2.5)))], css: M.pulse('sw', 1.4, 1.12) });
const puffs = () => ({ n: [anim('p1', path(K.cloud(30, 46, 30, 18), fillInk('#dee2e6', 3))), anim('p2', path(K.cloud(142, 40, 26, 16), fillInk('#dee2e6', 3)))], css: M.steam('p1', 1.8, 0) + M.steam('p2', 1.8, 0.7) });
const orbit = () => ({ n: [anim('orb', path(star(56, 36, 9, 3.5, 5, -90, 1), fillInk('#ffd43b', 2.5)), path(star(146, 30, 8, 3, 5, -90, 1), fillInk('#ffd43b', 2.5)), path(star(100, 14, 7, 2.8, 5, -90, 1), fillInk('#ffd43b', 2.5)))], css: '.orb{animation:orbk 2.4s linear infinite;transform-box:view-box;transform-origin:100px 40px}@keyframes orbk{to{transform:rotate(360deg)}}' });

// ---------- things to hold (in front, at about y 128)
const HOLD = {
  coffee: () => ({ n: [path('M80 124H118V150Q118 162 106 162H92Q80 162 80 150Z', fillInk('#ffffff')), path('M82 132H116V142H82Z', { fill: '#c0773b', opacity: 0.9 }), path('M118 130Q130 130 130 140Q130 150 118 148', { fill: 'none', ...ink(5) }), anim('st1', path('M68 124Q62 116 68 108', { fill: 'none', ...ink(4), stroke: '#adb5bd' })), anim('st2', path('M60 132Q54 124 60 116', { fill: 'none', ...ink(4), stroke: '#adb5bd' }))], css: M.steam('st1', 2.2, 0) + M.steam('st2', 2.2, 0.9) }),
  heart: () => ({ n: [anim('hh', path(heart(100, 132, 50), fillInk('#ff4d6d')), shine(88, 122, 6, 4, -30, 0.7))], css: M.beat('hh', 1.3) }),
  wand: () => ({ n: [line(170, 80, 182, 44, ink(9)), line(170, 80, 182, 44, { stroke: '#845ef7', 'stroke-width': 4, 'stroke-linecap': 'round' }), anim('wst', path(star(183, 36, 14, 6, 5, -90, 2), fillInk('#ffd43b')))], css: M.pulse('wst', 1.2, 1.15) }),
  gift: () => ({ n: [anim('gb', rect(76, 128, 48, 38, { rx: 6, ...fillInk('#4dabf7') }), rect(95, 128, 10, 38, { fill: '#ffd43b' }), rect(72, 120, 56, 13, { rx: 5, ...fillInk('#74c0fc') }), rect(95, 120, 10, 13, { fill: '#ffd43b' }), path('M100 120Q88 104 82 116Q82 120 100 120Q112 104 118 116Q118 120 100 120Z', fillInk('#ffd43b', 4)))], css: M.wiggle('gb', 1.8, 5) }),
  pizza: () => ({ n: [anim('pz', path('M84 108L132 120L100 160Z', fillInk('#ffd43b')), path('M84 108Q108 106 132 120', { fill: 'none', ...ink(9), stroke: '#e8590c' }), circle(102, 124, 5, { fill: '#e03131' }), circle(110, 140, 4.5, { fill: '#e03131' }), circle(116, 124, 3.5, { fill: '#e03131' }))], css: M.wiggle('pz', 2, 4) }),
  icecream: () => ({ n: [path('M89 138L100 172L111 138Z', fillInk('#f4a261')), path('M92 146L108 146M95 156L105 156', { stroke: SH, 'stroke-width': 2.5, opacity: 0.2 }), anim('icc', circle(100, 128, 14, fillInk('#ff8fab')), circle(94, 122, 4, { fill: HL, opacity: 0.6 }), circle(102, 112, 5.5, fillInk('#e03131', 3)))], css: M.wiggle('icc', 2.4, 5) }),
  flower: () => ({ n: [path('M100 160V124', ink(5)), path('M100 146Q86 138 82 144Q90 152 100 150', fillInk('#51cf66', 3.5)), anim('fl', ...[0, 60, 120, 180, 240, 300].map(a => ellipse(100 + 11 * Math.cos(a * Math.PI / 180), 112 + 11 * Math.sin(a * Math.PI / 180), 8, 8, fillInk('#ffa8a8', 3.5))), circle(100, 112, 7, fillInk('#ffd43b', 3.5)))], css: M.spin('fl', 6) }),
  book: () => ({ n: [path('M66 118Q84 108 100 120Q116 108 134 118V156Q116 146 100 158Q84 146 66 156Z', fillInk('#ffffff')), path('M100 120V158', ink(4)), path('M74 128Q84 122 94 128M74 137Q84 131 94 137M106 128Q116 122 126 128M106 137Q116 131 126 137', { fill: 'none', stroke: '#adb5bd', 'stroke-width': 2.5, 'stroke-linecap': 'round' }), path('M66 156Q84 146 100 158Q116 146 134 156V162Q116 152 100 164Q84 152 66 162Z', fillInk('#4dabf7', 4))], css: '' }),
  camera: () => ({ n: [rect(70, 118, 60, 38, { rx: 8, ...fillInk('#495057') }), rect(84, 110, 20, 10, { rx: 3, ...fillInk('#495057', 4) }), circle(100, 137, 12, fillInk('#a5d8ff', 4)), circle(96, 133, 3.5, { fill: HL }), anim('fla', path(star(150, 110, 14, 3.5, 4, -90), { fill: '#ffd43b', ...ink(2.5) }))], css: '.fla{animation:flak 2.2s infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes flak{0%,70%,100%{transform:scale(0);opacity:0}78%{transform:scale(1.3);opacity:1}90%{transform:scale(.6);opacity:.4}}' }),
  trophy: () => ({ n: [path('M80 108H120V124Q120 144 100 144Q80 144 80 124Z', fillInk('#ffc93a')), path('M80 114Q68 114 70 124Q72 132 82 132M120 114Q132 114 130 124Q128 132 118 132', { fill: 'none', ...ink(4.5) }), rect(94, 144, 12, 8, { fill: '#e8a400', ...ink(4) }), rect(84, 152, 32, 8, { rx: 3, ...fillInk('#2b2346', 4) }), shine(90, 118, 4, 8, 0, 0.7)], css: '' }),
  mail: () => ({ n: [anim('ml', rect(72, 114, 56, 38, { rx: 5, ...fillInk('#ffffff') }), path('M72 118L100 138L128 118', { fill: 'none', ...ink(4.5) }), path(heart(100, 146, 12), { fill: '#ff4d6d' }))], css: M.wiggle('ml', 2, 4) }),
  phone: () => ({ n: [g({ transform: 'rotate(12 160 88)' }, rect(148, 64, 24, 44, { rx: 6, ...fillInk('#343a40') }), rect(152, 70, 16, 30, { rx: 2, fill: '#74c0fc' })), anim('rg', path('M180 64Q188 72 184 82M186 56Q198 70 192 86', { fill: 'none', ...ink(3.5) }))], css: M.flicker('rg', 1) }),
  laptop: () => ({ n: [path('M66 112H134L138 146H62Z', fillInk('#adb5bd')), path('M70 116H130L133 142H67Z', { fill: '#4dabf7' }), path('M52 146H148Q150 156 140 156H60Q50 156 52 146Z', fillInk('#dee2e6')), anim('ty', rect(76, 124, 20, 4, { rx: 2, fill: HL }), rect(76, 132, 34, 4, { rx: 2, fill: HL }))], css: M.flicker('ty', 1.2) }),
  cupcake: () => ({ n: [path('M82 146H118L113 172H87Z', fillInk('#74c0fc')), path('M88 150L91 170M100 150V170M112 150L109 170', { stroke: SH, 'stroke-width': 2.5, opacity: 0.15 }), path('M78 148C74 134 88 126 100 132C112 126 126 134 122 148Z', fillInk('#ffc9de')), rect(97, 114, 6, 18, { rx: 2, ...fillInk('#ffffff', 3) }), anim('fl2', path('M100 100Q94 108 100 114Q106 108 100 100Z', fillInk('#ffa94d', 3)))], css: M.flicker('fl2', 0.8) }),
  magnifier: () => ({ n: [anim('mg', line(160, 134, 176, 156, ink(11)), line(160, 134, 176, 156, { stroke: '#a0522d', 'stroke-width': 5, 'stroke-linecap': 'round' }), circle(150, 120, 19, fillInk('#d0ebff')), shine(144, 114, 4.5, 8, 30, 0.8))], css: M.slideX('mg', 2.6, -12) }),
  balloon: () => ({ n: [anim('bl', path('M174 76Q168 66 170 58', { fill: 'none', stroke: OL, 'stroke-width': 2.5 }), ellipse(170, 32, 20, 24, fillInk('#ff6b5e')), path('M166 57L174 57L170 51Z', fillInk('#ff6b5e', 3)), shine(162, 24, 4.5, 8, 20, 0.7))], css: M.swing('bl', 2.6, 7, '50% 100%') }),
  umbrella: () => ({ n: [anim('um', path('M160 16V122Q160 132 151 130', { fill: 'none', ...ink(5) }), path('M116 46Q158 -18 200 46Q193 39 186 46Q179 39 172 46Q165 39 158 46Q151 39 144 46Q137 39 130 46Q123 39 116 46Z', { ...fillInk('#ff6b5e'), transform: 'translate(2 0)' }), path('M146 46Q150 22 160 12Q170 22 174 46', { fill: 'none', stroke: SH, 'stroke-width': 3, opacity: 0.14 }))], css: M.tilt('um', 3, 3) }),
  sign: (word, col = '#ffd43b') => ({ n: [rect(46, 114, 108, 46, { rx: 9, ...fillInk(col) }), path(T.words(word, { font: 'fredoka', size: 18, cx: 100, cy: 137, maxW: 64 }).d, { fill: OL })], css: '' }),
  diploma: () => ({ n: [anim('dp', rect(70, 120, 60, 22, { rx: 11, ...fillInk('#fff3bf') }), ellipse(72, 131, 6, 11, fillInk('#ffe066', 4)), rect(96, 118, 8, 26, { fill: '#e03131' }))], css: M.wiggle('dp', 2, 4) }),
  brush: () => ({ n: [anim('br', line(168, 82, 180, 50, ink(9)), line(168, 82, 180, 50, { stroke: '#f4a261', 'stroke-width': 4, 'stroke-linecap': 'round' }), path('M176 54L186 30Q194 34 186 56Z', fillInk('#845ef7', 3.5)))], css: M.wave('br', 1.2, 10, '0% 100%'), extra: [path('M20 178Q40 160 64 176', { fill: 'none', stroke: '#845ef7', 'stroke-width': 8, 'stroke-linecap': 'round' }), path('M140 184Q158 170 180 182', { fill: 'none', stroke: '#ffd43b', 'stroke-width': 8, 'stroke-linecap': 'round' })] })
};

// one Boo: o = { eyes, mouth, arms: 'down' | 'wave' | 'both' | 'hold' | 'none', hat, hold, extra, motion, tilt, color, eyeSize }
function boo(id, name, tags, o) {
  // extras float on top of everything (hearts, sparkles...), or sit behind the body (a cape)
  const parts = [], cssParts = [], behind = [], front = [];
  for (const x0 of [].concat(o.extra || [])) {
    const x = typeof x0 === 'function' ? x0() : x0;
    if (!x) continue;
    (x.behind ? behind : front).push(...(x.extra || []), ...x.n);
    cssParts.push(x.css || '');
  }
  const motion = o.motion || 'bob';
  const backArms = o.arms === 'wave' ? [armL(), waveR()] : o.arms === 'both' ? [waveL(), waveR()] : o.arms === 'hold' || o.arms === 'none' ? [] : [armL(), armR()];
  const hat = o.hat ? HATS[o.hat]() : null;
  const held = o.hold ? (typeof o.hold === 'string' ? HOLD[o.hold]() : typeof o.hold === 'function' ? o.hold() : o.hold) : null;
  const inner = [
    ...behind,
    ...backArms,
    body(o.color),
    face(100, 86, 104, { eyes: o.eyes || 'dot', mouth: o.mouth || 'smile', blink: o.eyes === undefined || o.eyes === 'dot', eyeSize: o.eyeSize || 1.15, cheek: o.cheek }),
    hat,
    ...(held ? [...(held.extra || []), ...held.n] : []),
    o.arms === 'hold' ? holdArms(o.holdY || 128, o.holdSpread || 30) : null
  ];
  if (held) cssParts.push(held.css || '');
  const moveCls = { bob: 'mv', bounce: 'mv', wiggle: 'mv', spin: 'mv', tilt: 'mv', shake: 'mv', squash: 'mv', peek: 'mv', swing: 'mv', rise: 'mv' }[motion] ? 'mv' : '';
  const mvCss = { bob: M.bob('mv', 3, 8), bounce: M.bounce('mv', 1.3, 18), wiggle: M.wiggle('mv', 1.4, 7), spin: '.mv{animation:mvk 3s cubic-bezier(.6,0,.4,1) infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes mvk{0%,30%{transform:rotate(0)}70%,100%{transform:rotate(360deg)}}',
    tilt: M.tilt('mv', 2.6, 7), shake: M.shake('mv', 0.7, 3), squash: M.squash('mv', 1.5), peek: M.peek('mv', 3.4, 70), swing: M.swing('mv', 2.4, 8, '50% 0%'), rise: M.rise('mv', 3.4, 7) }[motion] || '';
  const shadowCss = motion === 'bounce' ? M.shadowBounce('gs', 1.3) : motion === 'bob' || motion === 'rise' ? M.shadow('gs', motion === 'rise' ? 3.4 : 3) : '';
  if (o.waveCss !== false) cssParts.push(M.wave('wave', 0.9, 24, '10% 100%'), M.wave('wave2', 0.9, -24, '90% 100%'));
  cssParts.push(M.blink('blink', 4.2));
  if (motion !== 'peek') parts.push(ground(100, 182, 46, shadowCss ? 'gs' : undefined));
  if (motion === 'peek') {
    parts.push(g({ 'clip-path': 'url(#cut)' }, g({ class: 'mv' }, inner)), node('defs', {}, [node('clipPath', { id: 'cut' }, [rect(0, -40, 200, 210)])]), rect(10, 168, 180, 12, { rx: 6, ...fillInk('#a9e34b', 4) }));
  } else parts.push(moveCls ? g({ class: 'mv' }, inner) : g({}, inner));
  parts.push(...front);
  cssParts.push(mvCss, shadowCss);
  return sticker({ id: 'boo-' + id, name, cat: CAT, tags: ['boo', 'ghost', ...tags], n: parts, css: css(...cssParts), colors: [o.color || BODY, ...(o.colors || []), OL] });
}

const LIST = () => [
  boo('hello', 'Boo says hello', ['hello', 'hi', 'wave', 'welcome'], { arms: 'wave', eyes: 'happy', mouth: 'open' }),
  boo('float', 'Boo floating', ['float', 'cute', 'happy'], { mouth: 'smile' }),
  boo('love', 'Boo in love', ['love', 'heart', 'valentine', 'crush'], { eyes: 'heart', mouth: 'smile', extra: hearts }),
  boo('wink', 'Boo winking', ['wink', 'fun', 'cheeky'], { eyes: 'wink', mouth: 'tongue', motion: 'tilt' }),
  boo('cool', 'Cool Boo', ['cool', 'sunglasses', 'chill', 'summer'], { eyes: 'shades', mouth: 'smirk', motion: 'tilt' }),
  boo('party', 'Party Boo', ['party', 'birthday', 'celebrate', 'hat'], { hat: 'party', eyes: 'happy', mouth: 'open', arms: 'both', motion: 'bounce', extra: confetti }),
  boo('sleepy', 'Sleepy Boo', ['sleep', 'tired', 'night', 'zzz', 'nap'], { eyes: 'closed', mouth: 'o', motion: 'rise', extra: zzz }),
  boo('wow', 'Boo saying wow', ['wow', 'surprise', 'omg', 'shock'], { eyes: 'big', mouth: 'yell', motion: 'shake', arms: 'both', eyeSize: 1 }),
  boo('laugh', 'Boo laughing', ['laugh', 'lol', 'funny', 'haha'], { eyes: 'happy', mouth: 'grin', motion: 'wiggle', extra: () => ({ n: [anim('t1', path('M58 84Q52 96 58 100Q64 96 58 84Z', fillInk('#74c0fc', 2.5))), anim('t2', path('M142 84Q136 96 142 100Q148 96 142 84Z', fillInk('#74c0fc', 2.5)))], css: M.fall('t1', 1.2, 0, 20) + M.fall('t2', 1.2, 0.6, 20) }) }),
  boo('king', 'Boo with a crown', ['king', 'queen', 'crown', 'boss', 'royal', 'winner'], { hat: 'crown', eyes: 'happy', mouth: 'smirk', extra: () => sparkles() }),
  boo('coffee', 'Boo with coffee', ['coffee', 'morning', 'cafe', 'drink', 'break'], { arms: 'hold', hold: 'coffee', eyes: 'happy', mouth: 'smile', holdY: 132, holdSpread: 26 }),
  boo('heart', 'Boo holding a heart', ['love', 'heart', 'thank you', 'care'], { arms: 'hold', hold: 'heart', eyes: 'happy', mouth: 'smile' }),
  boo('magic', 'Boo with a magic wand', ['magic', 'wand', 'wish', 'sparkle'], { arms: 'wave', hold: 'wand', eyes: 'star', mouth: 'open', extra: () => sparkles([[40, 44], [168, 140], [30, 128]], '#ffd43b'), eyeSize: 1 }),
  boo('balloon', 'Boo with a balloon', ['balloon', 'party', 'birthday', 'fun'], { arms: 'wave', hold: 'balloon', waveCss: false, eyes: 'happy', mouth: 'smile', motion: 'rise' }),
  boo('gift', 'Boo with a gift', ['gift', 'present', 'birthday', 'surprise'], { arms: 'hold', hold: 'gift', eyes: 'happy', mouth: 'open', holdY: 126, holdSpread: 32 }),
  boo('thanks', 'Boo says thanks', ['thanks', 'thank you', 'grateful', 'sign'], { arms: 'hold', hold: () => HOLD.sign('THANKS!'), eyes: 'happy', mouth: 'smile', holdY: 140, holdSpread: 50 }),
  boo('open', 'Boo says we are open', ['open', 'welcome', 'store', 'sign'], { arms: 'hold', hold: () => HOLD.sign('OPEN'), eyes: 'dot', mouth: 'open', holdY: 140, holdSpread: 50, motion: 'bounce' }),
  boo('sale', 'Boo says sale', ['sale', 'deal', 'discount', 'sign', 'shop'], { arms: 'hold', hold: () => HOLD.sign('SALE', '#ff6b5e'), eyes: 'star', mouth: 'open', holdY: 140, holdSpread: 50, motion: 'bounce', eyeSize: 1, extra: () => sparkles([[34, 44], [166, 40]]) }),
  boo('welcome', 'Boo says welcome', ['welcome', 'hello', 'hi', 'sign', 'door'], { arms: 'hold', hold: () => HOLD.sign('WELCOME', '#a9e34b'), eyes: 'happy', mouth: 'open', holdY: 140, holdSpread: 50 }),
  boo('peek', 'Boo peeking', ['peek', 'hello', 'hide', 'surprise'], { eyes: 'big', mouth: 'o', motion: 'peek', eyeSize: 1, arms: 'none' }),
  boo('spin', 'Boo spinning', ['spin', 'twirl', 'dance', 'happy'], { eyes: 'happy', mouth: 'open', arms: 'both', motion: 'spin' }),
  boo('shy', 'Shy Boo', ['shy', 'blush', 'cute', 'sorry'], { eyes: 'closed', mouth: 'wavy', motion: 'tilt', cheek: '#ff6b8b' }),
  boo('sad', 'Sad Boo', ['sad', 'cry', 'sorry', 'miss you'], { eyes: 'sad', mouth: 'sad', motion: 'squash', extra: tear }),
  boo('grumpy', 'Grumpy Boo', ['grumpy', 'mad', 'angry', 'monday'], { eyes: 'line', mouth: 'flat', motion: 'shake', extra: puffs }),
  boo('music', 'Boo with headphones', ['music', 'song', 'dance', 'listen'], { hat: 'headphones', eyes: 'closed', mouth: 'smile', motion: 'wiggle', extra: notes }),
  boo('grad', 'Graduate Boo', ['graduate', 'school', 'class', 'diploma', 'congrats'], { hat: 'grad', arms: 'hold', hold: 'diploma', eyes: 'happy', mouth: 'smile' }),
  boo('winter', 'Boo in a warm hat', ['winter', 'cold', 'snow', 'hat'], { hat: 'beanie', eyes: 'dot', mouth: 'o', motion: 'shake', extra: snow }),
  boo('rain', 'Boo with an umbrella', ['rain', 'umbrella', 'weather', 'wet'], { hold: 'umbrella', arms: 'down', eyes: 'happy', mouth: 'smile', motion: 'bob', extra: () => ({ n: [[18, 40], [40, 20], [28, 90], [100, 6]].map((p, i) => anim('d' + i, path(`M${p[0]} ${p[1]}q-4 8 0 10q4 -2 0 -10Z`, fillInk('#74c0fc', 2.5)))), css: [0, 1, 2, 3].map(i => M.fall('d' + i, 1.1, i * 0.27, 50)).join('') }) }),
  boo('chef', 'Chef Boo', ['chef', 'cook', 'food', 'kitchen', 'restaurant'], { hat: 'chef', eyes: 'happy', mouth: 'smile', arms: 'hold', hold: 'pizza' }),
  boo('artist', 'Artist Boo', ['art', 'paint', 'artist', 'create'], { hat: 'beret', eyes: 'dot', mouth: 'smile', arms: 'wave', hold: 'brush', waveCss: false }),
  boo('work', 'Boo at work', ['work', 'laptop', 'office', 'busy', 'typing'], { arms: 'hold', hold: 'laptop', eyes: 'dot', mouth: 'flat', holdY: 138, holdSpread: 36, motion: 'squash' }),
  boo('read', 'Boo reading', ['read', 'book', 'study', 'library', 'school'], { arms: 'hold', hold: 'book', eyes: 'closed', mouth: 'smile', holdY: 136, holdSpread: 34, motion: 'tilt' }),
  boo('photo', 'Boo taking a photo', ['photo', 'camera', 'picture', 'smile'], { arms: 'hold', hold: 'camera', eyes: 'wink', mouth: 'grin', holdY: 140, holdSpread: 32 }),
  boo('winner', 'Boo with a trophy', ['winner', 'trophy', 'award', 'first', 'champion'], { arms: 'hold', hold: 'trophy', eyes: 'star', mouth: 'open', holdY: 130, holdSpread: 30, motion: 'bounce', extra: () => sparkles(), eyeSize: 1 }),
  boo('pizza', 'Boo eating pizza', ['pizza', 'food', 'lunch', 'yum'], { arms: 'hold', hold: 'pizza', eyes: 'happy', mouth: 'open' }),
  boo('icecream', 'Boo with ice cream', ['ice cream', 'summer', 'sweet', 'treat'], { arms: 'hold', hold: 'icecream', eyes: 'dot', mouth: 'tongue', holdY: 132, holdSpread: 18 }),
  boo('flower', 'Boo with a flower', ['flower', 'spring', 'gift', 'thanks'], { arms: 'hold', hold: 'flower', eyes: 'happy', mouth: 'smile', hat: 'flower', holdY: 136, holdSpread: 16 }),
  boo('mail', 'Boo with a letter', ['mail', 'letter', 'message', 'email', 'love'], { arms: 'hold', hold: 'mail', eyes: 'dot', mouth: 'smile', holdY: 134, holdSpread: 34 }),
  boo('call', 'Boo on the phone', ['phone', 'call', 'contact', 'talk'], { hold: 'phone', arms: 'down', eyes: 'happy', mouth: 'open' }),
  boo('birthday', 'Boo with a cupcake', ['birthday', 'cupcake', 'party', 'candle'], { arms: 'hold', hold: 'cupcake', eyes: 'happy', mouth: 'smile', holdY: 140, holdSpread: 30, hat: 'party' }),
  boo('detective', 'Boo the detective', ['search', 'find', 'detective', 'look'], { hold: 'magnifier', arms: 'down', eyes: 'dot', mouth: 'smirk' }),
  boo('starstruck', 'Starstruck Boo', ['wow', 'amazing', 'star', 'excited'], { eyes: 'star', mouth: 'open', arms: 'both', motion: 'bounce', eyeSize: 1, extra: () => sparkles([[36, 40], [166, 36], [172, 120], [26, 122]]) }),
  boo('dizzy', 'Dizzy Boo', ['dizzy', 'confused', 'tired'], { eyes: 'dizzy', mouth: 'wavy', motion: 'wiggle', extra: orbit, eyeSize: 1.2 }),
  boo('nervous', 'Nervous Boo', ['nervous', 'oops', 'sorry', 'worried'], { eyes: 'dot', mouth: 'teeth', motion: 'shake', extra: sweat }),
  boo('kiss', 'Boo blowing a kiss', ['kiss', 'love', 'bye'], { eyes: 'wink', mouth: 'kiss', arms: 'wave', extra: () => ({ n: [anim('k1', path(heart(158, 52, 18), fillInk('#ff4d6d', 3)))], css: '.k1{animation:k1k 2.2s ease-out infinite}@keyframes k1k{0%{transform:translate(-30px,20px) scale(.4);opacity:0}30%{opacity:1}100%{transform:translate(14px,-20px) scale(1.1);opacity:0}}' }) }),
  boo('sunny', 'Boo in a sun hat', ['summer', 'sun', 'beach', 'vacation'], { hat: 'sun', eyes: 'shades', mouth: 'smile', motion: 'tilt' }),
  boo('bow', 'Boo with a bow', ['cute', 'bow', 'pretty'], { hat: 'bow', eyes: 'dot', mouth: 'cat', motion: 'tilt' }),
  boo('hero', 'Super Boo', ['hero', 'super', 'strong', 'brave'], { hat: 'headband', eyes: 'dot', mouth: 'grin', arms: 'both', motion: 'rise', extra: () => ({ behind: true, n: [anim('cape', path('M64 88Q22 128 18 174Q46 160 62 172Q80 160 100 170Q120 160 138 172Q154 160 182 174Q178 128 136 88Z', fillInk('#e03131')), path('M64 88Q34 124 26 164', { fill: 'none', stroke: SH, 'stroke-width': 4, opacity: 0.15, 'stroke-linecap': 'round' }))], css: M.swing('cape', 1.6, 3, '50% 0%') }), colors: ['#e03131'] }),
  boo('pink', 'Pink Boo', ['pink', 'cute', 'happy'], { color: '#ffc9de', eyes: 'happy', mouth: 'cat', motion: 'bob' }),
  boo('mint', 'Mint Boo', ['mint', 'green', 'cute', 'calm'], { color: '#c3fae8', eyes: 'dot', mouth: 'smile', arms: 'wave' }),
  boo('sky', 'Sky blue Boo', ['blue', 'cute', 'calm'], { color: '#d0ebff', eyes: 'closed', mouth: 'smile', motion: 'rise' }),
  boo('sunshine', 'Sunshine Boo', ['yellow', 'happy', 'sunny'], { color: '#fff3bf', eyes: 'happy', mouth: 'grin', motion: 'bounce', arms: 'both' }),
  boo('lilac', 'Lilac Boo', ['purple', 'cute', 'dream'], { color: '#e5dbff', eyes: 'big', mouth: 'o', motion: 'tilt', eyeSize: 1 })
];
module.exports = { LIST, CAT, boo };
