// Animals: round, soft little critters (Blokvane's own drawings), each with its own small motion.
'use strict';
const K = require('./kit');
const T = require('./text');
const { r, P, at, g, node, path, circle, ellipse, rect, line, ink, fillInk, anim, heart, star, roundPoly, scallop, cloud, MOVES: M, OL, HL, SH } = K;
const { blob, egg, smooth, curve, ring, drop, leaf, body, part, feet, arms, face, X, make } = require('./make');

const CAT = 'Animals';
// the usual body: a soft round critter whose body is also its head
const B0 = { cx: 100, cy: 114, rx: 62, ry: 54 };
const bodyD = (o = {}) => blob(o.cx || B0.cx, o.cy || B0.cy, o.rx || B0.rx, o.ry || B0.ry, o.flat == null ? 0.22 : o.flat);
const BOX = [100, 114, 62, 54];
// ears
const tri = (pts, fill, w = 4.5) => path(roundPoly(pts, 7), fillInk(fill, w));
const triIn = (pts, fill) => path(roundPoly(pts, 4), { fill });
const catEars = (col, inner = '#ff8fab', tilt = 0) => [
  tri([[50, 86], [56 - tilt, 36], [94, 64]], col), triIn([[60, 76], [62 - tilt, 50], [82, 66]], inner),
  tri([[150, 86], [144 + tilt, 36], [106, 64]], col), triIn([[140, 76], [138 + tilt, 50], [118, 66]], inner)
];
const roundEars = (col, inner, y = 68, x = 56, rr = 18) => [circle(x, y, rr, fillInk(col, 4.5)), inner ? circle(x + 1, y + 2, rr * 0.55, { fill: inner }) : null, circle(200 - x, y, rr, fillInk(col, 4.5)), inner ? circle(199 - x, y + 2, rr * 0.55, { fill: inner }) : null];
const longEars = (col, inner, flop = false) => [
  g({ class: 'el' }, ellipse(78, 38, 14, 36, { ...fillInk(col, 4.5), transform: 'rotate(-12 78 38)' }), ellipse(78, 42, 7, 25, { fill: inner, transform: 'rotate(-12 78 42)' })),
  g({ class: flop ? 'er' : 'el2' }, flop ? [ellipse(136, 46, 14, 36, { ...fillInk(col, 4.5), transform: 'rotate(52 136 46)' }), ellipse(136, 48, 7, 25, { fill: inner, transform: 'rotate(52 136 48)' })] : [ellipse(122, 38, 14, 36, { ...fillInk(col, 4.5), transform: 'rotate(12 122 38)' }), ellipse(122, 42, 7, 25, { fill: inner, transform: 'rotate(12 122 42)' })])
];
// a tail behind the body (a thick line with an outline), moving from its base
const tail = (d, col, cls = 'tl', w = 11) => anim(cls, path(d, { fill: 'none', ...ink(w + 9) }), path(d, { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
const whiskers = (y = 120, col = OL) => path(`M44 ${y - 6}L24 ${y - 10}M44 ${y + 2}L24 ${y + 4}M156 ${y - 6}L176 ${y - 10}M156 ${y + 2}L176 ${y + 4}`, { stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.55 });
const noseTri = (x, y, col = '#ff6f91', s = 1) => path(`M${P(x - 5 * s, y - 3 * s)}Q${P(x, y - 5 * s)} ${P(x + 5 * s, y - 3 * s)}Q${P(x + 3 * s, y + 2 * s)} ${P(x, y + 3 * s)}Q${P(x - 3 * s, y + 2 * s)} ${P(x - 5 * s, y - 3 * s)}Z`, { fill: col, ...ink(2.2) });
const blush = (y = 124, col = '#ff8fab', dx = 30) => [ellipse(100 - dx, y, 8, 5, { fill: col, opacity: 0.6 }), ellipse(100 + dx, y, 8, 5, { fill: col, opacity: 0.6 })];
const pawsFront = (col, y = 140, dx = 30) => [ellipse(100 - dx, y, 10, 12, { ...fillInk(col, 4), transform: `rotate(20 ${100 - dx} ${y})` }), ellipse(100 + dx, y, 10, 12, { ...fillInk(col, 4), transform: `rotate(-20 ${100 + dx} ${y})` })];
const muzzle = (col, y = 124, rx = 22, ry = 15) => ellipse(100, y, rx, ry, { fill: col });
const belly = (col, cy = 140, rx = 38, ry = 30) => ellipse(100, cy, rx, ry, { fill: col });
// a moving part's CSS: ears that twitch, a tail that swishes...
const twitch = (cls, origin, deg = 8, s = 2.6) => `.${cls}{animation:${cls}k ${s}s ease-in-out infinite;transform-box:fill-box;transform-origin:${origin}}@keyframes ${cls}k{0%,70%,100%{transform:rotate(0)}78%{transform:rotate(${deg}deg)}86%{transform:rotate(-${deg * 0.5}deg)}}`;

// one critter. o: { id, name, tags, col, d (body path), box, inside, behind (ears, tail: they move with the body), over (on top
// of the face: beak, whiskers...), face: {eyes, mouth, ...} or false, feet: color or false, arms: 'side' | 'front' | false,
// armCol, extra, motion, css, colors, ground, faceAt: [cx, cy, s] }
function critter(o) {
  const col = o.col;
  const d = o.d || bodyD(o.shape);
  const fa = o.faceAt || [100, 110, 88];
  const parts = [
    ...[].concat(o.behind || []),
    o.arms === 'side' ? arms(100, o.armY || 126, o.armSpread || 60, o.armCol || col) : null,
    body(d, col, { box: o.box || BOX, inside: o.inside, shine: o.shine, shade: o.shade }),
    ...[].concat(o.mid || []),
    o.face === false ? null : face(fa[0], fa[1], fa[2], o.face || {}),
    ...[].concat(o.over || []),
    o.arms === 'front' ? pawsFront(o.armCol || col, o.armY || 144, o.armDx || 30) : null,
    o.feet === false ? null : feet(100, o.feetY || 166, o.feetGap || 26, o.feetCol || o.armCol || col)
  ];
  return make({ id: 'animal-' + o.id, name: o.name, cat: CAT, tags: ['animal', 'cute', ...o.tags], body: parts, extra: o.extra, motion: o.motion || 'bob', css: o.css, colors: o.colors || [col], ground: o.ground });
}
const spots = (pts, col) => pts.map(p => (typeof p[2] === 'string' ? path(p[2], { fill: col }) : ellipse(p[0], p[1], p[2], p[3] || p[2], { fill: col, transform: p[4] ? `rotate(${p[4]} ${p[0]} ${p[1]})` : undefined })));

const LIST = () => [
  // ---------- cats
  critter({ id: 'cat-orange', name: 'Orange cat', tags: ['cat', 'kitten', 'kitty', 'pet', 'orange'], col: '#ffb76b', colors: ['#ffb76b', '#f08c3a', '#ff8fab'],
    behind: [tail('M146 150Q182 150 176 116Q172 98 160 100', '#ffb76b'), ...catEars('#ffb76b')],
    inside: spots([[100, 58, 7, 16], [84, 62, 5, 12, -20], [116, 62, 5, 12, 20]], '#f08c3a'), over: [whiskers(122)], face: { mouth: 'cat' }, arms: 'front', armY: 146,
    css: twitch('tl', '0% 100%', 12, 2.2) }),
  critter({ id: 'cat-gray', name: 'Gray cat waving', tags: ['cat', 'kitten', 'hello', 'wave', 'pet', 'gray'], col: '#c3c9d4', colors: ['#c3c9d4', '#8d96a5', '#ff8fab'],
    behind: [tail('M150 152Q186 146 178 114', '#c3c9d4'), ...catEars('#c3c9d4'), anim('wv', ellipse(166, 96, 11, 17, { ...fillInk('#c3c9d4', 4.5), transform: 'rotate(38 166 96)' }))],
    inside: spots([[40, 112, 14, 4, -12], [42, 128, 14, 4, -6], [160, 112, 14, 4, 12], [158, 128, 14, 4, 6], [100, 62, 4, 12], [88, 64, 3.5, 10, -15], [112, 64, 3.5, 10, 15]], '#8d96a5'),
    over: [whiskers(122)], face: { eyes: 'happy', mouth: 'cat' }, css: twitch('tl', '0% 100%', 12, 2.2) + M.wave('wv', 0.9, 24, '10% 100%'), motion: 'tilt' }),
  critter({ id: 'cat-black', name: 'Black cat', tags: ['cat', 'kitten', 'black', 'night', 'halloween', 'pet'], col: '#3f3a56', colors: ['#3f3a56', '#ffe066', '#ff8fab'],
    behind: [tail('M146 152Q190 140 172 104Q166 92 156 98', '#3f3a56'), ...catEars('#3f3a56', '#ff8fab')],
    face: { eyes: 'big', mouth: 'cat', ink: '#ffe066', eyeSize: 1.05 }, over: [whiskers(122, '#c5c0dc')], arms: 'front', armY: 146, css: twitch('tl', '0% 100%', 12, 2.6), motion: 'squash' }),
  critter({ id: 'cat-calico', name: 'Calico cat in love', tags: ['cat', 'kitten', 'love', 'heart', 'pet'], col: '#fffaf3', colors: ['#fffaf3', '#ffa94d', '#5c5470'],
    behind: [tail('M148 150Q184 152 180 120', '#ffa94d'), ...catEars('#fffaf3')],
    inside: [...spots([[60, 70, 26, 22], [150, 92, 18, 16]], '#ffa94d'), ...spots([[138, 64, 16, 14], [56, 150, 14, 10]], '#5c5470')],
    over: [whiskers(122)], face: { eyes: 'heart', mouth: 'cat' }, extra: () => X.hearts(), css: twitch('tl', '0% 100%', 12, 2.2) }),
  // ---------- dogs
  critter({ id: 'puppy', name: 'Puppy', tags: ['dog', 'puppy', 'pet', 'woof'], col: '#ecc9a2', colors: ['#ecc9a2', '#a0714f', '#ffffff'],
    behind: [tail('M150 150Q176 140 172 118', '#a0714f', 'tl', 10)],
    inside: [muzzle('#fff8ef', 128, 26, 18), ...spots([[140, 80, 16, 18, 20]], '#a0714f')],
    over: [g({ class: 'el' }, path('M58 64Q38 66 36 98Q38 116 52 114Q62 96 70 70Z', fillInk('#a0714f', 4.5))), g({ class: 'er' }, path('M142 64Q162 66 164 98Q162 116 148 114Q138 96 130 70Z', fillInk('#a0714f', 4.5))), ellipse(100, 117, 7, 5, { fill: OL })],
    face: { mouth: 'tongue', mouthY: 4 }, arms: 'front', armY: 148, armCol: '#ecc9a2',
    css: '.tl{animation:tlk .5s ease-in-out infinite;transform-box:fill-box;transform-origin:0% 100%}@keyframes tlk{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}' + twitch('el', '80% 10%', 8, 3) + twitch('er', '20% 10%', -8, 3), motion: 'bounce' }),
  critter({ id: 'dog-shiba', name: 'Happy dog', tags: ['dog', 'pet', 'happy', 'woof', 'shiba'], col: '#f4a259', colors: ['#f4a259', '#fff5e6'],
    behind: [anim('tl', path('M146 140Q186 136 176 104Q164 92 156 108Q168 112 160 124', fillInk('#f4a259', 4.5))), tri([[50, 84], [60, 40], [92, 62]], '#f4a259'), triIn([[60, 74], [64, 52], [82, 64]], '#fff5e6'), tri([[150, 84], [140, 40], [108, 62]], '#f4a259'), triIn([[140, 74], [136, 52], [118, 64]], '#fff5e6')],
    inside: [path('M38 120Q60 112 78 118Q100 130 122 118Q140 112 162 120V180H38Z', { fill: '#fff5e6' }), ellipse(80, 96, 7, 4, { fill: '#fff5e6' }), ellipse(120, 96, 7, 4, { fill: '#fff5e6' })],
    over: [ellipse(100, 118, 6, 4.5, { fill: OL })], face: { eyes: 'happy', mouth: 'open', mouthY: 6 }, feetCol: '#fff5e6',
    css: '.tl{animation:tlk .45s ease-in-out infinite;transform-box:fill-box;transform-origin:0% 100%}@keyframes tlk{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(10deg)}}', motion: 'hop' }),
  // ---------- bunnies, bears, panda
  critter({ id: 'bunny', name: 'Bunny', tags: ['bunny', 'rabbit', 'easter', 'spring', 'pet'], col: '#ffffff', colors: ['#ffffff', '#ffb3c6'],
    behind: longEars('#ffffff', '#ffb3c6'), over: [noseTri(100, 118, '#ff8fab', 0.8)], face: { mouth: 'cat', mouthY: 4 }, arms: 'front', armY: 146,
    extra: () => X.sparkles([[30, 70], [172, 76]], '#ffd43b'), css: twitch('el', '50% 100%', -8, 3) + twitch('el2', '50% 100%', 8, 3.4), motion: 'hop' }),
  critter({ id: 'bunny-brown', name: 'Sleepy bunny', tags: ['bunny', 'rabbit', 'sleep', 'tired', 'night'], col: '#d7b48f', colors: ['#d7b48f', '#ffb3c6', '#fff3e3'],
    behind: longEars('#d7b48f', '#ffb3c6', true), inside: [belly('#fff3e3', 150, 34, 26)], over: [noseTri(100, 118, '#ff8fab', 0.8)], face: { eyes: 'closed', mouth: 'o' }, motion: 'rise',
    extra: () => X.zzz(T), css: twitch('el', '50% 100%', -6, 4) }),
  critter({ id: 'bear', name: 'Teddy bear', tags: ['bear', 'teddy', 'hug', 'cute'], col: '#b98157', colors: ['#b98157', '#ecd2b3', '#ff6f91'],
    behind: roundEars('#b98157', '#ecd2b3'), inside: [muzzle('#ecd2b3', 126, 24, 16), belly('#ecd2b3', 158, 30, 20)], over: [ellipse(100, 118, 7, 5, { fill: OL })], face: { mouth: 'smile', mouthY: 5 },
    arms: 'front', armY: 140, armDx: 34 }),
  critter({ id: 'bear-polar', name: 'Polar bear', tags: ['bear', 'polar', 'winter', 'snow', 'cold', 'arctic'], col: '#f8f9fa', colors: ['#f8f9fa', '#a5d8ff'],
    behind: roundEars('#f8f9fa', '#dee2e6'), inside: [muzzle('#ffffff', 126, 22, 15)], over: [ellipse(100, 118, 7, 5, { fill: OL }), g({}, path('M58 66Q100 40 142 66L144 80Q100 58 56 80Z', fillInk('#4dabf7', 4)), circle(100, 44, 9, fillInk('#ffffff', 4)))],
    face: { mouth: 'o', mouthY: 4 }, arms: 'front', armY: 142, extra: () => X.snow(), motion: 'shake' }),
  critter({ id: 'panda', name: 'Panda', tags: ['panda', 'bamboo', 'bear', 'cute'], col: '#ffffff', colors: ['#ffffff', '#3f3a56', '#8ce99a'],
    behind: roundEars('#3f3a56', null, 66, 56, 19), inside: [ellipse(80, 108, 12, 15, { fill: '#3f3a56', transform: 'rotate(25 80 108)' }), ellipse(120, 108, 12, 15, { fill: '#3f3a56', transform: 'rotate(-25 120 108)' })],
    face: { eyes: 'dot', ink: '#ffffff', mouth: 'none', eyeSize: 0.9 }, over: [ellipse(100, 121, 6, 4, { fill: OL }), path('M92 128Q100 134 108 128', { fill: 'none', ...ink(3) }),
      anim('bmb', path('M132 176L170 100', { ...ink(12) }), path('M132 176L170 100', { stroke: '#8ce99a', 'stroke-width': 7, 'stroke-linecap': 'round' }), path('M166 108Q178 96 190 102Q180 112 166 108Z', fillInk('#51cf66', 3)))],
    arms: 'front', armCol: '#3f3a56', feetCol: '#3f3a56', css: M.wiggle('bmb', 2.4, 4), motion: 'tilt' }),
  // ---------- forest friends
  critter({ id: 'fox', name: 'Fox', tags: ['fox', 'forest', 'autumn', 'cute'], col: '#ff8c42', colors: ['#ff8c42', '#fff8f0', '#3f3a56'],
    behind: [anim('tl', path('M146 150Q194 150 184 104Q180 92 170 98Q176 128 146 132Z', fillInk('#ff8c42', 4.5)), path('M176 100Q184 96 186 106Q182 112 176 108Z', { fill: '#fff8f0' })),
      tri([[48, 88], [52, 30], [96, 60]], '#ff8c42'), triIn([[56, 78], [56, 44], [84, 62]], '#3f3a56'), tri([[152, 88], [148, 30], [104, 60]], '#ff8c42'), triIn([[144, 78], [144, 44], [116, 62]], '#3f3a56')],
    inside: [path('M38 108Q66 104 82 122Q100 140 118 122Q134 104 162 108V180H38Z', { fill: '#fff8f0' })], over: [ellipse(100, 119, 6, 4.5, { fill: OL })], face: { mouth: 'cat', mouthY: 6 },
    feetCol: '#3f3a56', css: twitch('tl', '0% 100%', 10, 2.4) }),
  critter({ id: 'koala', name: 'Koala', tags: ['koala', 'australia', 'cute', 'sleepy'], col: '#aeb8c6', colors: ['#aeb8c6', '#f1f3f5', '#4a4458'],
    behind: [circle(50, 80, 28, fillInk('#aeb8c6', 4.5)), circle(54, 82, 16, { fill: '#f1f3f5' }), circle(150, 80, 28, fillInk('#aeb8c6', 4.5)), circle(146, 82, 16, { fill: '#f1f3f5' })],
    inside: [belly('#e9ecef', 156, 30, 22)], over: [ellipse(100, 120, 11, 13, fillInk('#4a4458', 3))], face: { eyes: 'sleepy', mouth: 'none', wide: 1.2 }, arms: 'front', motion: 'sway' }),
  critter({ id: 'pig', name: 'Piglet', tags: ['pig', 'piglet', 'farm', 'pink', 'oink'], col: '#ffc2d1', colors: ['#ffc2d1', '#ff9fb8'],
    behind: [tri([[56, 78], [58, 46], [88, 62]], '#ffc2d1'), tri([[144, 78], [142, 46], [112, 62]], '#ffc2d1'), tail('M156 140q16 -4 10 -14q-8 -4 -8 6q2 8 14 2', '#ffc2d1', 'tl', 5)],
    over: [ellipse(100, 124, 16, 11, fillInk('#ff9fb8', 4)), ellipse(94, 124, 3, 4.5, { fill: '#b5446e' }), ellipse(106, 124, 3, 4.5, { fill: '#b5446e' })], face: { mouth: 'none', eyeY: -6, wide: 1.15 },
    arms: 'front', armY: 148, css: twitch('tl', '0% 50%', 20, 1.4), motion: 'bounce' }),
  critter({ id: 'frog', name: 'Frog', tags: ['frog', 'pond', 'green', 'spring', 'jump'], col: '#8ce99a', colors: ['#8ce99a', '#d8f5a2'],
    shape: { cy: 122, ry: 46, rx: 64 }, box: [100, 122, 64, 46],
    behind: [circle(70, 72, 21, fillInk('#8ce99a', 4.5)), circle(130, 72, 21, fillInk('#8ce99a', 4.5))],
    inside: [belly('#d8f5a2', 156, 40, 24)], face: { eyes: 'none', mouth: 'smile', mouthY: 4, mouthSize: 1.6, cheeks: true },
    over: [circle(70, 72, 12, { fill: '#ffffff' }), circle(130, 72, 12, { fill: '#ffffff' }), g({ class: 'blink' }, circle(72, 74, 6.5, { fill: OL }), circle(132, 74, 6.5, { fill: OL }), circle(74, 72, 2.2, { fill: HL }), circle(134, 72, 2.2, { fill: HL }))],
    feetY: 168, motion: 'hop' }),
  critter({ id: 'chick', name: 'Chick', tags: ['chick', 'bird', 'baby', 'spring', 'easter', 'yellow'], col: '#ffe066', colors: ['#ffe066', '#ff922b'],
    d: egg(100, 112, 60, 58, 0.2), box: [100, 112, 60, 58],
    behind: [anim('wl', ellipse(42, 118, 12, 20, { ...fillInk('#ffd43b', 4.5), transform: 'rotate(30 42 118)' })), anim('wr', ellipse(158, 118, 12, 20, { ...fillInk('#ffd43b', 4.5), transform: 'rotate(-30 158 118)' }))],
    over: [path('M100 54Q94 40 102 36Q104 46 110 42Q108 54 100 56', fillInk('#ffe066', 3.5)), path('M92 116L100 110L108 116L100 124Z', fillInk('#ff922b', 3))], face: { mouth: 'none', eyeY: -6 },
    feetCol: '#ff922b', css: M.wave('wl', 0.5, -20, '90% 20%') + M.wave('wr', 0.5, 20, '10% 20%'), motion: 'hop' }),
  critter({ id: 'penguin', name: 'Penguin', tags: ['penguin', 'winter', 'cold', 'bird', 'snow'], col: '#3f4a63', colors: ['#3f4a63', '#ffffff', '#ffa94d'],
    d: egg(100, 112, 58, 60, 0.15), box: [100, 112, 58, 60], arms: 'side', armCol: '#3f4a63', armY: 120, armSpread: 58,
    inside: [path('M100 70C70 64 52 86 58 108C46 136 64 170 100 170C136 170 154 136 142 108C148 86 130 64 100 70Z', { fill: '#ffffff' })],
    over: [path('M92 114Q100 108 108 114Q100 124 92 114Z', fillInk('#ffa94d', 3))], face: { mouthY: 8, mouth: 'none' }, feetCol: '#ffa94d', motion: 'wiggle' }),
  critter({ id: 'owl', name: 'Owl', tags: ['owl', 'bird', 'night', 'wise', 'forest', 'school'], col: '#a47148', colors: ['#a47148', '#f6e7cb', '#ffb347'],
    behind: [tri([[52, 80], [48, 40], [84, 62]], '#a47148'), tri([[148, 80], [152, 40], [116, 62]], '#a47148'), arms(100, 128, 60, '#8b5d3b', 12, 22, 18)],
    inside: [belly('#d9a77a', 152, 34, 26), path('M86 142l6 6l6 -6M102 142l6 6l6 -6M94 156l6 6l6 -6', { fill: 'none', stroke: '#a47148', 'stroke-width': 3, 'stroke-linecap': 'round' })],
    over: [circle(78, 104, 19, fillInk('#f6e7cb', 4)), circle(122, 104, 19, fillInk('#f6e7cb', 4)), g({ class: 'blink' }, circle(78, 106, 9, { fill: OL }), circle(122, 106, 9, { fill: OL }), circle(81, 102, 3, { fill: HL }), circle(125, 102, 3, { fill: HL })),
      path('M93 118L100 128L107 118Z', fillInk('#ffb347', 3))], face: false, feetCol: '#ffb347', motion: 'tilt' }),
  critter({ id: 'mouse', name: 'Mouse', tags: ['mouse', 'small', 'cheese', 'cute'], col: '#cdd3db', colors: ['#cdd3db', '#ffb3c6'],
    behind: [circle(52, 72, 27, fillInk('#cdd3db', 4.5)), circle(54, 74, 16, { fill: '#ffb3c6' }), circle(148, 72, 27, fillInk('#cdd3db', 4.5)), circle(146, 74, 16, { fill: '#ffb3c6' }), tail('M156 150Q186 156 186 132Q186 116 172 120', '#ffb3c6', 'tl', 4)],
    over: [noseTri(100, 120, '#ff8fab', 0.9), whiskers(124)], face: { mouth: 'cat', mouthY: 6 }, arms: 'front', armY: 146, css: twitch('tl', '0% 50%', 10, 2), motion: 'squash' }),
  critter({ id: 'hamster', name: 'Hamster', tags: ['hamster', 'pet', 'small', 'cheeks', 'cute'], col: '#f6b26b', colors: ['#f6b26b', '#fffaf0'],
    shape: { rx: 66, ry: 52, cy: 118, flat: 0.3 }, box: [100, 118, 66, 52],
    behind: [circle(62, 72, 13, fillInk('#f6b26b', 4.5)), circle(138, 72, 13, fillInk('#f6b26b', 4.5))],
    inside: [path('M30 118Q50 100 80 110Q100 116 120 110Q150 100 170 118V180H30Z', { fill: '#fffaf0' })],
    face: { mouth: 'cat', eyeSize: 1.1, cheek: '#ff8fab' }, feetCol: '#fffaf0',
    over: [noseTri(100, 116, '#ff8fab', 0.7), anim('sd', path('M100 128C110 132 112 150 100 160C88 150 90 132 100 128Z', fillInk('#4a4458', 3.5)), path('M100 134V154M94 140L96 152M106 140L104 152', { stroke: '#fffaf0', 'stroke-width': 2, 'stroke-linecap': 'round' })),
      ellipse(86, 146, 9, 11, { ...fillInk('#f6b26b', 4), transform: 'rotate(30 86 146)' }), ellipse(114, 146, 9, 11, { ...fillInk('#f6b26b', 4), transform: 'rotate(-30 114 146)' })],
    css: M.wiggle('sd', 1.4, 4), motion: 'squash' }),
  // ---------- big cats and friends
  critter({ id: 'lion', name: 'Lion', tags: ['lion', 'king', 'brave', 'safari', 'zoo'], col: '#ffcf70', colors: ['#ffcf70', '#e8913a'],
    behind: [anim('mn', path(scallop(100, 108, 76, 14, 0.12), fillInk('#e8913a', 4.5))), roundEars('#ffcf70', '#e8913a', 58, 58, 14)],
    shape: { rx: 56, ry: 50, cy: 116 }, box: [100, 116, 56, 50], inside: [muzzle('#fff3d6', 128, 22, 15)], over: [ellipse(100, 120, 7, 5, { fill: OL })], face: { mouth: 'smile', mouthY: 6 },
    css: M.spin('mn', 30), motion: 'bob', feetGap: 22 }),
  critter({ id: 'tiger', name: 'Tiger cub', tags: ['tiger', 'cub', 'stripes', 'safari', 'zoo', 'brave'], col: '#ff9f43', colors: ['#ff9f43', '#3f3a56', '#fff8f0'],
    behind: roundEars('#ff9f43', '#fff8f0', 66, 58, 16),
    inside: [muzzle('#fff8f0', 128, 26, 18), path('M86 60L92 76L98 60M102 60L108 76L114 60', { fill: '#3f3a56' }), path('M38 104L56 108L38 114M162 104L144 108L162 114M40 134L56 132L42 142M160 134L144 132L158 142', { fill: '#3f3a56' })],
    over: [noseTri(100, 120, '#ff8fab', 0.9)], face: { mouth: 'cat', mouthY: 6, eyes: 'happy' }, arms: 'front', armY: 148, motion: 'bounce' }),
  critter({ id: 'monkey', name: 'Monkey', tags: ['monkey', 'banana', 'jungle', 'zoo', 'funny'], col: '#a26b4b', colors: ['#a26b4b', '#f3d2b3', '#ffd43b'],
    behind: [circle(42, 104, 17, fillInk('#a26b4b', 4.5)), circle(44, 104, 9, { fill: '#f3d2b3' }), circle(158, 104, 17, fillInk('#a26b4b', 4.5)), circle(156, 104, 9, { fill: '#f3d2b3' }), tail('M150 154Q186 160 184 130Q182 112 166 118', '#a26b4b', 'tl', 7)],
    inside: [path('M100 88C88 74 62 80 64 104C64 120 74 140 100 140C126 140 136 120 136 104C138 80 112 74 100 88Z', { fill: '#f3d2b3' })],
    face: { mouth: 'grin', mouthY: 4 }, extra: { n: [anim('bn', path('M132 150Q160 154 170 130Q164 128 160 136Q150 148 132 146Z', fillInk('#ffd43b', 3.5)))], css: '' }, css: twitch('tl', '0% 50%', 10, 2.2) + M.wiggle('bn', 1.6, 6), motion: 'wiggle' }),
  // ---------- farm
  critter({ id: 'cow', name: 'Cow', tags: ['cow', 'farm', 'moo', 'milk', 'spots'], col: '#ffffff', colors: ['#ffffff', '#3f3a56', '#ffb3c6'],
    behind: [path('M64 66Q56 46 66 36Q70 50 76 60Z', fillInk('#f1e3c6', 4)), path('M136 66Q144 46 134 36Q130 50 124 60Z', fillInk('#f1e3c6', 4)), ellipse(44, 84, 16, 9, { ...fillInk('#ffffff', 4.5), transform: 'rotate(20 44 84)' }), ellipse(156, 84, 16, 9, { ...fillInk('#ffffff', 4.5), transform: 'rotate(-20 156 84)' })],
    inside: spots([[66, 74, 18, 14, 20], [150, 140, 20, 16, -10], [60, 150, 12, 9]], '#3f3a56'),
    over: [ellipse(100, 130, 26, 15, fillInk('#ffb3c6', 4)), ellipse(92, 130, 3.5, 4.5, { fill: '#b5446e' }), ellipse(108, 130, 3.5, 4.5, { fill: '#b5446e' })], face: { mouth: 'none', eyeY: -8, cheeks: false },
    motion: 'tilt' }),
  critter({ id: 'sheep', name: 'Sheep', tags: ['sheep', 'lamb', 'wool', 'farm', 'fluffy', 'sleep'], col: '#fffaf0', colors: ['#fffaf0', '#f3d9c4', '#6c6080'],
    d: scallop(100, 112, 62, 13, 0.1), box: [100, 112, 62, 62],
    behind: [ellipse(46, 98, 16, 8, { ...fillInk('#f3d9c4', 4), transform: 'rotate(-20 46 98)' }), ellipse(154, 98, 16, 8, { ...fillInk('#f3d9c4', 4), transform: 'rotate(20 154 98)' })],
    mid: [ellipse(100, 116, 34, 30, fillInk('#f3d9c4', 4)), path('M72 96Q84 78 100 88Q116 78 128 96Q114 100 100 96Q86 100 72 96Z', fillInk('#fffaf0', 3.5))], face: { mouth: 'smile', eyeY: 10, mouthY: 6 }, feetCol: '#6c6080', feetY: 172, motion: 'rise' }),
  critter({ id: 'duck', name: 'Duckling', tags: ['duck', 'duckling', 'bird', 'pond', 'quack'], col: '#ffffff', colors: ['#ffffff', '#ffa94d', '#74c0fc'],
    d: egg(100, 112, 58, 58, 0.2), box: [100, 112, 58, 58],
    behind: [anim('wl', ellipse(44, 124, 12, 20, { ...fillInk('#ffffff', 4.5), transform: 'rotate(30 44 124)' })), anim('wr', ellipse(156, 124, 12, 20, { ...fillInk('#ffffff', 4.5), transform: 'rotate(-30 156 124)' }))],
    over: [path('M98 56Q92 44 98 38Q102 48 106 44Q106 54 100 58', fillInk('#ffffff', 3.5)), ellipse(100, 120, 18, 8, fillInk('#ffa94d', 3.5)), path('M86 120H114', { stroke: '#e8590c', 'stroke-width': 2 })], face: { mouth: 'none', eyeY: -8 },
    feetCol: '#ffa94d', extra: () => X.drops([[30, 160, 6], [172, 158, 6]], '#74c0fc'), css: M.wave('wl', 0.6, -16, '90% 20%') + M.wave('wr', 0.6, 16, '10% 20%'), motion: 'wiggle' }),
  // ---------- zoo
  critter({ id: 'elephant', name: 'Elephant', tags: ['elephant', 'zoo', 'safari', 'trunk', 'big'], col: '#a9b8cc', colors: ['#a9b8cc', '#ffc9de'],
    behind: [anim('el', ellipse(40, 104, 26, 32, fillInk('#a9b8cc', 4.5)), ellipse(42, 104, 16, 21, { fill: '#ffc9de' })), anim('er', ellipse(160, 104, 26, 32, fillInk('#a9b8cc', 4.5)), ellipse(158, 104, 16, 21, { fill: '#ffc9de' }))],
    over: [anim('tr', path('M100 112C88 112 88 140 92 152C96 166 116 166 120 154Q112 156 108 148C106 138 112 116 100 112Z', fillInk('#a9b8cc', 4.5)), path('M96 136H106M95 144H106', { stroke: OL, 'stroke-width': 2.5, opacity: 0.4, 'stroke-linecap': 'round' }))],
    face: { mouth: 'none', eyeY: -6, wide: 1.25 }, extra: () => X.drops([[150, 50, 6], [162, 36, 5]], '#74c0fc'), css: M.wiggle('tr', 2, 5) + M.wave('el', 1.6, 6, '100% 50%') + M.wave('er', 1.6, -6, '0% 50%'), motion: 'sway' }),
  critter({ id: 'giraffe', name: 'Giraffe', tags: ['giraffe', 'tall', 'zoo', 'safari', 'spots'], col: '#ffd27a', colors: ['#ffd27a', '#d9893f'],
    behind: [line(80, 66, 76, 40, ink(9)), line(80, 66, 76, 40, { stroke: '#ffd27a', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(76, 38, 7, fillInk('#d9893f', 3.5)), line(120, 66, 124, 40, ink(9)), line(120, 66, 124, 40, { stroke: '#ffd27a', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(124, 38, 7, fillInk('#d9893f', 3.5)),
      ellipse(48, 82, 16, 8, { ...fillInk('#ffd27a', 4.5), transform: 'rotate(25 48 82)' }), ellipse(152, 82, 16, 8, { ...fillInk('#ffd27a', 4.5), transform: 'rotate(-25 152 82)' })],
    inside: [...spots([[60, 84, 10, 8], [140, 82, 9, 8], [150, 130, 12, 10], [52, 140, 11, 9], [120, 158, 8, 7], [80, 162, 7, 6]], '#d9893f'), muzzle('#ffe8b8', 130, 24, 16)],
    over: [ellipse(92, 128, 3, 4, { fill: '#8a5a2b' }), ellipse(108, 128, 3, 4, { fill: '#8a5a2b' })], face: { mouth: 'none', eyeY: -6 }, motion: 'sway' }),
  // ---------- woods
  critter({ id: 'deer', name: 'Little deer', tags: ['deer', 'fawn', 'forest', 'winter', 'antlers'], col: '#c8875a', colors: ['#c8875a', '#8a5a3b', '#fff3e3'],
    behind: [path('M76 66Q66 44 70 26M70 40Q60 36 56 26M72 52Q82 46 84 36', { fill: 'none', ...ink(11) }), path('M76 66Q66 44 70 26M70 40Q60 36 56 26M72 52Q82 46 84 36', { fill: 'none', stroke: '#8a5a3b', 'stroke-width': 5, 'stroke-linecap': 'round' }),
      path('M124 66Q134 44 130 26M130 40Q140 36 144 26M128 52Q118 46 116 36', { fill: 'none', ...ink(11) }), path('M124 66Q134 44 130 26M130 40Q140 36 144 26M128 52Q118 46 116 36', { fill: 'none', stroke: '#8a5a3b', 'stroke-width': 5, 'stroke-linecap': 'round' }),
      ellipse(46, 86, 17, 9, { ...fillInk('#c8875a', 4.5), transform: 'rotate(25 46 86)' }), ellipse(154, 86, 17, 9, { ...fillInk('#c8875a', 4.5), transform: 'rotate(-25 154 86)' })],
    inside: [muzzle('#fff3e3', 130, 22, 15), ...spots([[56, 132, 4], [64, 146, 3.5], [144, 132, 4], [136, 146, 3.5], [52, 116, 3]], '#fff3e3')],
    over: [ellipse(100, 122, 7, 5, { fill: OL })], face: { mouth: 'smile', mouthY: 8, eyes: 'big', eyeSize: 0.95 }, motion: 'bob' }),
  critter({ id: 'raccoon', name: 'Raccoon', tags: ['raccoon', 'forest', 'mask', 'night', 'cheeky'], col: '#9ea7b4', colors: ['#9ea7b4', '#4a4458', '#ffffff'],
    behind: [anim('tl', path('M146 150Q186 156 184 118Q180 104 170 108Q170 132 146 134Z', fillInk('#9ea7b4', 4.5)), path('M174 112L186 118M172 124L184 132', { stroke: '#4a4458', 'stroke-width': 6, 'stroke-linecap': 'round' })),
      tri([[54, 82], [58, 46], [88, 64]], '#9ea7b4'), tri([[146, 82], [142, 46], [112, 64]], '#9ea7b4')],
    inside: [path('M40 106Q60 92 80 100Q100 108 120 100Q140 92 160 106Q150 122 124 116Q100 112 76 116Q50 122 40 106Z', { fill: '#4a4458' }), muzzle('#ffffff', 132, 20, 14)],
    over: [ellipse(100, 124, 6, 4.5, { fill: OL })], face: { mouth: 'smirk', mouthY: 10, ink: '#ffffff', eyeY: -4 }, css: twitch('tl', '0% 100%', 8, 2.4), motion: 'tilt' }),
  critter({ id: 'hedgehog', name: 'Hedgehog', tags: ['hedgehog', 'spiky', 'forest', 'autumn', 'cute'], col: '#f5d7b5', colors: ['#f5d7b5', '#8b5e3c', '#ff6b5e'],
    behind: [path(K.star(100, 110, 74, 58, 16, -90), fillInk('#8b5e3c', 4.5))],
    shape: { rx: 54, ry: 48, cy: 120 }, box: [100, 120, 54, 48], over: [ellipse(100, 124, 7, 5, { fill: OL })], face: { mouth: 'smile', mouthY: 6 },
    extra: { n: [anim('ap', circle(150, 58, 13, fillInk('#ff6b5e', 4)), path('M150 46Q152 38 158 36', { fill: 'none', ...ink(3) }), K.shine(146, 54, 3, 5, 30, 0.7))], css: M.bob('ap', 2, 4) }, motion: 'squash', feetGap: 22 }),
  critter({ id: 'sloth', name: 'Sloth', tags: ['sloth', 'slow', 'relax', 'chill', 'lazy', 'jungle'], col: '#b9a184', colors: ['#b9a184', '#efe3d2', '#6b5a48'],
    inside: [path('M100 84C76 80 52 92 52 112C52 132 76 142 100 140C124 142 148 132 148 112C148 92 124 80 100 84Z', { fill: '#efe3d2' }), ellipse(78, 108, 16, 9, { fill: '#6b5a48', transform: 'rotate(18 78 108)' }), ellipse(122, 108, 16, 9, { fill: '#6b5a48', transform: 'rotate(-18 122 108)' })],
    face: { eyes: 'closed', mouth: 'smile', ink: '#ffffff', cheeks: false, mouthY: 2 }, over: [ellipse(100, 120, 6, 4, { fill: OL }), path('M94 128Q100 133 106 128', { fill: 'none', ...ink(3) })], arms: 'side', armSpread: 62, armY: 130, motion: 'rise' }),
  // ---------- sea
  critter({ id: 'seal', name: 'Seal pup', tags: ['seal', 'sea', 'ocean', 'arctic', 'cute'], col: '#b6c9d9', colors: ['#b6c9d9', '#8aa4b8'],
    shape: { rx: 66, ry: 50, cy: 120, flat: 0.32 }, box: [100, 120, 66, 50], over: [ellipse(100, 120, 7, 5, { fill: OL }), whiskers(126), anim('fl', ellipse(40, 150, 18, 10, { ...fillInk('#8aa4b8', 4.5), transform: 'rotate(-30 40 150)' })), ellipse(160, 150, 18, 10, { ...fillInk('#8aa4b8', 4.5), transform: 'rotate(30 160 150)' })],
    face: { mouth: 'cat', mouthY: 8 }, feet: false, extra: () => X.bubbles([[40, 60, 7], [160, 48, 5]]), css: M.wave('fl', 0.8, 16, '100% 50%'), motion: 'bob' }),
  critter({ id: 'whale', name: 'Whale', tags: ['whale', 'sea', 'ocean', 'blue', 'summer'], col: '#5c9ded', colors: ['#5c9ded', '#d0ebff'],
    d: 'M40 124C40 84 76 70 108 72C146 74 166 100 166 126C182 112 188 92 194 96C196 120 184 140 160 150C140 164 112 166 86 162C58 158 40 146 40 124Z', box: [100, 120, 70, 45],
    inside: [path('M40 132C60 150 100 158 150 148C130 166 70 168 46 150Z', { fill: '#d0ebff' })], faceAt: [86, 118, 80], face: { mouth: 'smile' }, feet: false,
    extra: { n: [anim('sp', path('M92 66Q90 50 82 42M92 66Q92 48 92 36M92 66Q94 50 102 42', { fill: 'none', ...ink(9) }), path('M92 66Q90 50 82 42M92 66Q92 48 92 36M92 66Q94 50 102 42', { fill: 'none', stroke: '#a5d8ff', 'stroke-width': 4, 'stroke-linecap': 'round' }), circle(80, 40, 5, fillInk('#a5d8ff', 3)), circle(92, 32, 5, fillInk('#a5d8ff', 3)), circle(104, 40, 5, fillInk('#a5d8ff', 3)))],
      css: '.sp{animation:spk 2s ease-out infinite;transform-box:fill-box;transform-origin:50% 100%}@keyframes spk{0%,100%{transform:scale(.3);opacity:0}30%{opacity:1}60%{transform:scale(1.05);opacity:1}90%{opacity:0}}' }, motion: 'rise' }),
  critter({ id: 'fish', name: 'Goldfish', tags: ['fish', 'goldfish', 'sea', 'pet', 'swim'], col: '#ffa94d', colors: ['#ffa94d', '#ff922b'],
    d: 'M44 112C44 82 80 70 108 76C130 80 144 96 148 104L180 82C186 104 186 122 180 142L148 120C144 130 130 146 106 150C76 154 44 140 44 112Z', box: [100, 112, 60, 40],
    behind: [anim('fin', path('M96 78Q104 54 126 62Q122 74 112 80Z', fillInk('#ff922b', 4)))], inside: [path('M118 82Q128 112 116 146', { fill: 'none', stroke: '#ff922b', 'stroke-width': 4 })],
    faceAt: [84, 110, 70], face: { mouth: 'o' }, feet: false, extra: () => X.bubbles([[40, 64, 7], [26, 40, 5], [48, 24, 4]]), css: M.wave('fin', 1, 10, '0% 100%'), motion: 'drift' }),
  critter({ id: 'octopus', name: 'Octopus', tags: ['octopus', 'sea', 'ocean', 'purple', 'hug'], col: '#b197fc', colors: ['#b197fc', '#e5dbff'],
    d: 'M40 108C40 64 72 46 100 46C128 46 160 64 160 108C160 124 154 132 146 136C152 150 164 156 170 168C150 172 138 158 132 148C128 162 126 172 112 176C112 162 108 152 100 148C92 152 88 162 88 176C74 172 72 162 68 148C62 158 50 172 30 168C36 156 48 150 54 136C46 132 40 124 40 108Z', box: [100, 100, 60, 50],
    inside: spots([[64, 72, 6], [78, 60, 4], [136, 70, 5], [128, 128, 4]], '#e5dbff'), face: { eyes: 'happy', mouth: 'open', mouthY: 0 }, faceAt: [100, 100, 88], feet: false, motion: 'squash' }),
  critter({ id: 'jellyfish', name: 'Jellyfish', tags: ['jellyfish', 'sea', 'ocean', 'pink', 'float'], col: '#ffc9de', colors: ['#ffc9de', '#ff8fab', '#b197fc'],
    d: 'M40 108C40 68 70 46 100 46C130 46 160 68 160 108Q150 116 140 108Q130 118 120 108Q110 118 100 108Q90 118 80 108Q70 118 60 108Q50 116 40 108Z', box: [100, 86, 60, 40],
    behind: [anim('tn', path('M62 112Q54 130 64 146Q72 160 62 176M86 114Q80 134 88 150Q94 164 86 180M114 114Q120 134 112 150Q106 164 114 180M138 112Q146 130 136 146Q128 160 138 176', { fill: 'none', ...ink(9) }), path('M62 112Q54 130 64 146Q72 160 62 176M86 114Q80 134 88 150Q94 164 86 180M114 114Q120 134 112 150Q106 164 114 180M138 112Q146 130 136 146Q128 160 138 176', { fill: 'none', stroke: '#ff8fab', 'stroke-width': 4, 'stroke-linecap': 'round' }))],
    inside: spots([[70, 62, 5], [124, 58, 4], [146, 86, 3]], '#ffffff'), faceAt: [100, 86, 84], face: { mouth: 'smile' }, feet: false, ground: [100, 190, 34],
    css: M.squash('tn', 1.6), motion: 'float' }),
  critter({ id: 'crab', name: 'Crab', tags: ['crab', 'beach', 'sea', 'summer', 'red'], col: '#ff6b5e', colors: ['#ff6b5e', '#e03131'],
    shape: { rx: 58, ry: 40, cy: 130, flat: 0.25 }, box: [100, 130, 58, 40],
    behind: [line(80, 96, 74, 64, ink(5)), line(120, 96, 126, 64, ink(5)), circle(74, 62, 12, fillInk('#ffffff', 4)), circle(126, 62, 12, fillInk('#ffffff', 4)), g({ class: 'blink' }, circle(75, 63, 6, { fill: OL }), circle(127, 63, 6, { fill: OL })),
      path('M50 140L28 150M50 150L30 164M150 140L172 150M150 150L170 164', { fill: 'none', ...ink(6) }),
      anim('cl', path('M48 118Q24 112 20 90Q36 92 38 100Q42 84 30 76Q50 74 56 96Q60 108 54 120Z', fillInk('#ff6b5e', 4.5))), anim('cr', path('M152 118Q176 112 180 90Q164 92 162 100Q158 84 170 76Q150 74 144 96Q140 108 146 120Z', fillInk('#ff6b5e', 4.5)))],
    faceAt: [100, 128, 80], face: { eyes: 'none', mouth: 'open', mouthY: -2 }, feet: false, ground: [100, 176, 52],
    css: '.cl{animation:clk .9s ease-in-out infinite;transform-box:fill-box;transform-origin:80% 100%}@keyframes clk{0%,100%{transform:rotate(0)}50%{transform:rotate(-14deg)}}.cr{animation:crk .9s ease-in-out infinite;transform-box:fill-box;transform-origin:20% 100%}@keyframes crk{0%,100%{transform:rotate(0)}50%{transform:rotate(14deg)}}', motion: 'shake' }),
  // ---------- small ones
  critter({ id: 'snail', name: 'Snail', tags: ['snail', 'slow', 'garden', 'rain', 'spring'], col: '#ffd8a8', colors: ['#ffd8a8', '#c08457', '#e8a87c'],
    d: 'M36 166C30 150 36 120 46 104C50 84 76 80 80 102C82 124 84 140 100 148H168C178 148 184 158 176 166Z', box: [70, 140, 40, 30], shine: [52, 100, 4, 8, 20],
    behind: [line(54, 88, 48, 64, ink(4)), line(70, 86, 74, 62, ink(4)), circle(48, 62, 5, { fill: OL }), circle(74, 60, 5, { fill: OL })],
    over: [path('M134 148C170 148 176 108 150 90C124 72 92 92 96 118C100 140 130 140 136 120C140 106 124 98 116 108', fillInk('#e8a87c', 4.5)), path('M136 120C140 106 124 98 116 108', { fill: 'none', ...ink(4) }), K.shine(118, 90, 6, 10, -40, 0.5)],
    faceAt: [62, 104, 56], face: { mouth: 'smile' }, feet: false, ground: [104, 172, 74], motion: 'drift' }),
  critter({ id: 'bee', name: 'Bee', tags: ['bee', 'honey', 'buzz', 'garden', 'spring', 'summer'], col: '#ffd43b', colors: ['#ffd43b', '#3f3a56', '#e7f5ff'],
    shape: { rx: 58, ry: 50, cy: 116 }, box: [100, 116, 58, 50],
    behind: [anim('wg', ellipse(72, 56, 18, 26, { ...fillInk('#e7f5ff', 4), transform: 'rotate(-30 72 56)' }), ellipse(128, 56, 18, 26, { ...fillInk('#e7f5ff', 4), transform: 'rotate(30 128 56)' })),
      path('M88 68Q82 48 70 44M112 68Q118 48 130 44', { fill: 'none', ...ink(4) }), circle(70, 44, 5, { fill: OL }), circle(130, 44, 5, { fill: OL }), path('M156 118L174 116L158 132Z', fillInk('#3f3a56', 3))],
    inside: [path('M40 132Q100 120 160 132V146Q100 134 40 146Z', { fill: '#3f3a56' }), path('M48 156Q100 146 152 156V170H48Z', { fill: '#3f3a56' })], face: { mouth: 'smile', mouthY: -6, eyeY: -6 }, feet: false,
    css: '.wg{animation:wgk .18s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}@keyframes wgk{to{transform:scaleY(.7)}}', motion: 'float' }),
  critter({ id: 'ladybug', name: 'Ladybug', tags: ['ladybug', 'bug', 'garden', 'luck', 'spring', 'red'], col: '#ff4d4d', colors: ['#ff4d4d', '#3f3a56'],
    shape: { rx: 62, ry: 50, cy: 122, flat: 0.25 }, box: [100, 122, 62, 50],
    behind: [path('M84 76Q78 56 66 52M116 76Q122 56 134 52', { fill: 'none', ...ink(4) }), circle(66, 52, 5, { fill: OL }), circle(134, 52, 5, { fill: OL })],
    inside: [...spots([[56, 106, 10], [146, 106, 10], [70, 150, 9], [130, 150, 9], [100, 166, 7]], '#3f3a56')], face: { mouth: 'smile' }, faceAt: [100, 116, 86], feetCol: '#3f3a56', feetY: 168, motion: 'wiggle' }),
  critter({ id: 'butterfly', name: 'Butterfly', tags: ['butterfly', 'spring', 'garden', 'pretty', 'fly'], col: '#7c6aa8', colors: ['#7c6aa8', '#74c0fc', '#d0bfff'],
    d: egg(100, 112, 16, 48, 0.1), box: [100, 112, 16, 48], shine: false,
    behind: [anim('wl', path('M96 104C70 60 30 56 28 82C26 104 52 112 94 112C56 120 42 142 58 156C76 168 92 140 96 120Z', fillInk('#74c0fc', 4.5)), circle(52, 84, 8, { fill: '#d0bfff' }), circle(66, 144, 6, { fill: '#d0bfff' })),
      anim('wr', path('M104 104C130 60 170 56 172 82C174 104 148 112 106 112C144 120 158 142 142 156C124 168 108 140 104 120Z', fillInk('#74c0fc', 4.5)), circle(148, 84, 8, { fill: '#d0bfff' }), circle(134, 144, 6, { fill: '#d0bfff' })),
      path('M96 70Q86 50 78 46M104 70Q114 50 122 46', { fill: 'none', ...ink(3.5) }), circle(78, 46, 4, { fill: OL }), circle(122, 46, 4, { fill: OL })],
    faceAt: [100, 86, 46], face: { mouth: 'smile', cheeks: false, ink: '#ffffff' }, feet: false,
    css: '.wl{animation:wlk .7s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:100% 50%}@keyframes wlk{to{transform:scaleX(.55)}}.wr{animation:wrk .7s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:0% 50%}@keyframes wrk{to{transform:scaleX(.55)}}', motion: 'float' }),
  critter({ id: 'turtle', name: 'Turtle', tags: ['turtle', 'slow', 'sea', 'green', 'shell'], col: '#8ce99a', colors: ['#8ce99a', '#3fa34d', '#d8f5a2'],
    d: blob(64, 100, 34, 32, 0.2), box: [64, 100, 34, 32], shine: [52, 84, 4, 7, 30],
    behind: [ellipse(76, 156, 12, 10, fillInk('#8ce99a', 4.5)), ellipse(156, 156, 12, 10, fillInk('#8ce99a', 4.5)), path('M178 140L190 136L180 150Z', fillInk('#8ce99a', 3.5))],
    over: [path('M70 150C70 104 108 86 136 88C168 90 186 116 184 150Z', fillInk('#3fa34d', 4.5)), path('M110 96L118 120L150 120L160 100M118 120L114 150M150 120L156 150M84 128H184', { fill: 'none', stroke: '#2b8a3e', 'stroke-width': 4, 'stroke-linecap': 'round' }), K.shine(118, 100, 6, 10, -50, 0.5)],
    faceAt: [62, 100, 56], face: { mouth: 'smile' }, feet: false, ground: [118, 170, 70], motion: 'drift' }),
  critter({ id: 'unicorn', name: 'Unicorn', tags: ['unicorn', 'magic', 'rainbow', 'fantasy', 'dream'], col: '#ffffff', colors: ['#ffffff', '#ff8fab', '#b197fc', '#74c0fc', '#ffd43b'],
    behind: [tri([[56, 82], [62, 46], [90, 64]], '#ffffff'), tri([[144, 82], [138, 46], [110, 64]], '#ffffff'), path('M150 70C176 74 186 100 176 124C188 130 184 154 168 158C160 140 152 116 146 96Z', fillInk('#b197fc', 4.5)), path('M156 112C172 118 176 136 168 148', { fill: 'none', stroke: '#74c0fc', 'stroke-width': 6, 'stroke-linecap': 'round' })],
    over: [anim('hn', path('M90 64L100 18L110 64Z', fillInk('#ffd43b', 4)), path('M93 52L106 46M95 40L104 36', { stroke: '#e8a400', 'stroke-width': 3, 'stroke-linecap': 'round' })),
      path('M64 70C74 52 96 52 104 62C116 50 140 56 146 72C134 70 128 80 118 76C112 86 96 84 90 76C82 82 70 80 64 70Z', fillInk('#ff8fab', 4))],
    face: { eyes: 'closed', mouth: 'smile', eyeY: 4 }, extra: () => X.sparkles([[30, 60], [176, 30], [24, 130]], '#ffd43b'), css: M.pulse('hn', 1.6, 1.08), motion: 'float' }),
  critter({ id: 'dino', name: 'Little dino', tags: ['dino', 'dinosaur', 'rawr', 'green', 'kids'], col: '#69db7c', colors: ['#69db7c', '#ffd43b', '#d8f5a2'],
    behind: [...[-84, -62, -40, -18, 4].map((a, i) => { const s = i === 0 || i === 4 ? 13 : 17; const p = at(100, 114, 1, a); const e = q => [100 + (q[0] - 100) * 62, 114 + (q[1] - 114) * 54]; const b1 = e(at(100, 114, 1, a - 9)), b2 = e(at(100, 114, 1, a + 9)), m = e(p), tip = [m[0] + Math.cos(a * Math.PI / 180) * s, m[1] + Math.sin(a * Math.PI / 180) * s]; return path(roundPoly([[b1[0] - (m[0] - 100) * 0.08, b1[1] - (m[1] - 114) * 0.08], tip, [b2[0] - (m[0] - 100) * 0.08, b2[1] - (m[1] - 114) * 0.08]], 3), fillInk('#ffd43b', 4)); }), path('M150 140Q190 150 192 120Q180 134 156 124Z', fillInk('#69db7c', 4.5))],
    inside: [belly('#d8f5a2', 156, 34, 24)], face: { mouth: 'open', eyes: 'happy' }, arms: 'front', armY: 140, css: '', motion: 'hop',
    extra: () => { const d = T.words('RAWR!', { font: 'fredoka', size: 15, cx: 52, cy: 40, maxW: 62 }).d; return { n: [anim('rw', path(d, { fill: '#ffffff', ...ink(5), 'paint-order': 'stroke' }))], css: M.pop('rw', 1.4) }; } }),
  critter({ id: 'axolotl', name: 'Axolotl', tags: ['axolotl', 'pink', 'water', 'cute', 'smile'], col: '#ffc2d6', colors: ['#ffc2d6', '#ff6b9a'],
    shape: { rx: 60, ry: 50, cy: 118 }, box: [100, 118, 60, 50],
    behind: [anim('gl', path('M46 86L18 70M44 98L16 98M46 110L20 124', { fill: 'none', ...ink(11) }), path('M46 86L18 70M44 98L16 98M46 110L20 124', { fill: 'none', stroke: '#ff6b9a', 'stroke-width': 6, 'stroke-linecap': 'round' })),
      anim('gr', path('M154 86L182 70M156 98L184 98M154 110L180 124', { fill: 'none', ...ink(11) }), path('M154 86L182 70M156 98L184 98M154 110L180 124', { fill: 'none', stroke: '#ff6b9a', 'stroke-width': 6, 'stroke-linecap': 'round' }))],
    face: { mouth: 'cat', wide: 1.3, mouthSize: 1.4 }, arms: 'front', armY: 148, css: M.wave('gl', 1.4, 8, '100% 50%') + M.wave('gr', 1.4, -8, '0% 50%'), motion: 'bob' })
];
module.exports = { LIST, CAT };
