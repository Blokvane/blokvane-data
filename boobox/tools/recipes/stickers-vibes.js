// Good vibes: kind words and calm reminders with happy faces, for classrooms, offices and wellness boards. Vinyl
// stickers with Blokvane's own drawings and words.
'use strict';
const K = require('./kit');
const V = require('./vinyl');
const { r, P, g, path, circle, ellipse, rect, ink, star, heart, OL } = K;
const { I } = V;
const { mascot, PROPS: X, place } = require('./mascots');

const CAT = 'Good vibes';
const mk = (id, name, tags, o) => V.make({ id: 'vibes-' + id, name, cat: CAT, tags: ['good vibes', 'kind', 'positive', ...tags], ...o });
const W1 = (t, f = 'fredoka', s = 28, c = '#ffffff', o = {}) => [{ t, f, s, c, ...o }];
const fi = (fill, w = 4.5) => ({ fill, ...ink(w) });

// a rainbow, cx, cy the middle of its bottom, rr its outer radius
const rainbow = (cx, cy, rr, bw = 9, cols = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa']) => {
  const n = cols.length, arc = rad => `M${P(cx - rad, cy)}A${r(rad)} ${r(rad)} 0 0 1 ${P(cx + rad, cy)}`;
  return g({}, path(arc(rr - (n - 1) * bw / 2), { fill: 'none', stroke: OL, 'stroke-width': r(bw * n + 8) }), ...cols.map((c, i) => path(arc(rr - i * bw), { fill: 'none', stroke: c, 'stroke-width': r(bw + 0.6) })));
};
// a little plant in a pot, with a face on the pot
const plant = (cx, cy, s, face = { eyes: 'happy', mouth: 'smile' }) => place(cx, cy, s, [
  ellipse(32, 30, 11, 22, { ...fi('#69db7c'), transform: 'rotate(-34 32 30)' }), ellipse(68, 30, 11, 22, { ...fi('#69db7c'), transform: 'rotate(34 68 30)' }), ellipse(50, 22, 10, 22, fi('#8ce99a')),
  path('M50 46V20M50 46Q40 38 34 32M50 46Q60 38 66 32', { fill: 'none', stroke: '#2f9e44', 'stroke-width': 3, 'stroke-linecap': 'round' }),
  path('M26 54H74L66 96H34Z', fi('#ff922b', 5)), rect(20, 46, 60, 14, { rx: 4, ...fi('#e8590c', 4.5) }), V.loose(K.face(50, 76, 34, face))]);
// a sparkly gem
const gem = (cx, cy, s, c = '#74c0fc') => place(cx, cy, s, [path('M14 38L32 14H68L86 38L50 88Z', fi(c, 5)), V.loose(path('M14 38H86M32 14L42 38L50 88L58 38L68 14M42 38L50 14L58 38', { fill: 'none', stroke: OL, 'stroke-width': 2.5, opacity: 0.5 })), K.shine(34, 26, 3, 7, 30, 0.85)]);
// a mountain with a flag on top
const mountain = (cx, cy, s) => place(cx, cy, s, [path('M2 92L38 26L52 44L64 30L98 92Z', fi('#748ffc', 5)), path('M38 26L28 44L36 42L42 50L48 40Z', { fill: '#ffffff' }), path('M64 30L58 40L64 38L70 44Z', { fill: '#ffffff' }), path('M38 26V4', { stroke: OL, 'stroke-width': 3.5, 'stroke-linecap': 'round' }), path('M39 4L56 9L39 15Z', fi('#ff6b6b', 3))]);
// a trail of color behind a shooting star
const trail = (x0, y0, x1, y1) => V.loose(g({}, ['#ff8fab', '#ffd43b', '#74c0fc'].map((c, i) => path(`M${P(x0 + i * 6, y0 + i * 9)}Q${P((x0 + x1) / 2 + i * 4, y0 - 6 + i * 8)} ${P(x1 - 4 + i * 3, y1 + i * 7)}`, { fill: 'none', stroke: c, 'stroke-width': 6, 'stroke-linecap': 'round' }))));
// bits of confetti around a point (they float free of the die-cut)
const confetti = (spots) => V.loose(g({}, spots.map(([x, y, c, a], i) => i % 2 ? rect(x - 3, y - 6, 6, 12, { rx: 2, fill: c, transform: `rotate(${a} ${x} ${y})` }) : circle(x, y, 4, { fill: c }))));

const LIST = () => [
  mk('you-got-this', 'You got this!', ['you got this', 'confidence', 'encourage', 'sun', 'cool'], { colors: ['#ffd43b', '#ff922b'], motion: 'bob',
    art: () => [mascot('sun', 100, 72, 112, { face: { eyes: 'shades', mouth: 'grin' } })], words: W1('You got this!', 'fredoka', 30, '#ff922b'), at: [100, 162] }),
  mk('be-kind', 'Be kind', ['be kind', 'kindness', 'heart', 'love', 'nice'], { colors: ['#ff8fab', '#e64980'], motion: 'beat',
    art: () => [mascot('heart', 100, 72, 108, { face: { eyes: 'happy', mouth: 'smile' } }), I.sparkle(38, 30, 20), I.sparkle(162, 42, 14)], words: W1('Be kind', 'pacifico', 32, '#e64980', { w: 3.5 }), at: [100, 160] }),
  mk('drink-water', 'Drink water!', ['water', 'hydrate', 'drink water', 'health', 'bottle'], { colors: ['#74c0fc', '#1c7ed6'], motion: 'bob',
    art: () => [mascot('bottle', 100, 70, 96, { face: { eyes: 'happy', mouth: 'open' } }), I.drop(46, 50, 24), I.drop(156, 86, 18)], words: W1('Drink water!', 'fredoka', 30, '#1c7ed6'), at: [100, 160] }),
  mk('deep-breath', 'Take a deep breath', ['breathe', 'calm', 'relax', 'cloud', 'mindful'], { colors: ['#d0ebff', '#4c6ef5'], motion: 'float',
    art: () => [mascot('cloud', 100, 70, 120, { face: { eyes: 'closed', mouth: 'o' } }), V.loose(path('M14 44Q28 36 40 44M160 34Q172 26 186 34M152 100Q166 92 178 100', { fill: 'none', stroke: '#74c0fc', 'stroke-width': 4, 'stroke-linecap': 'round' }))],
    words: [{ t: 'Take a', f: 'caveat', s: 26, c: '#4c6ef5' }, { t: 'deep breath', f: 'fredoka', s: 26, c: '#4c6ef5' }], at: [100, 156] }),
  mk('proud-of-you', 'Proud of you!', ['proud', 'praise', 'star', 'well done', 'cheer'], { colors: ['#ffd43b', '#f76707'], motion: 'pop',
    art: () => [mascot('star', 100, 70, 112, { face: { eyes: 'happy', mouth: 'grin' }, props: X.blush() }), I.sparkle(34, 36, 22), I.sparkle(166, 98, 16)], words: W1('Proud of you!', 'fredoka', 28, '#f76707'), at: [100, 160] }),
  mk('good-vibes-only', 'Good vibes only', ['good vibes', 'rainbow', 'happy', 'colorful', 'cheerful'], { colors: ['#ff6b6b', '#9775fa'], motion: 'none',
    art: () => [rainbow(100, 100, 74), path(K.cloud(14, 116, 64, 36), fi('#ffffff')), path(K.cloud(122, 116, 64, 36), fi('#ffffff'))],
    words: [{ t: 'Good vibes', f: 'pacifico', s: 26, c: '#9775fa', w: 3.5 }, { t: 'ONLY', f: 'anton', s: 24, c: '#ff6b6b' }], at: [100, 152] }),
  mk('dream-big', 'Dream big', ['dream big', 'dreams', 'moon', 'stars', 'night'], { colors: ['#4c6ef5', '#ffe066'], motion: 'float',
    art: () => [mascot('moon', 94, 70, 104, { face: { eyes: 'closed', mouth: 'smile' }, props: [X.zzz(80, 18)] }), I.star(158, 40, 26, '#ffe066'), I.star(38, 108, 16, '#ffe066'), I.sparkle(150, 104, 14, '#ffe066')],
    words: [{ t: 'Dream', f: 'pacifico', s: 26, c: '#4c6ef5', w: 3.5 }, { t: 'BIG', f: 'anton', s: 32, c: '#ffd43b', o: '#4c6ef5' }], at: [100, 158] }),
  mk('you-matter', 'You matter', ['you matter', 'care', 'heart', 'support', 'kind'], { colors: ['#ff6b6b', '#ffffff'], motion: 'beat',
    words: [{ t: 'You', f: 'fredoka', s: 28, c: '#ffffff' }, { t: 'matter', f: 'fredoka', s: 30, c: '#ffffff' }], base: 'heart', baseFill: '#ff6b6b', baseO: { inner: '#ffffff' }, at: [100, 92] }),
  mk('rest', 'Rest is productive', ['rest', 'nap', 'sleep', 'pillow', 'self care'], { colors: ['#e5dbff', '#7048e8'], motion: 'float',
    art: () => [mascot('pillow', 100, 76, 124, { face: { eyes: 'closed', mouth: 'smile' }, props: [X.zzz(82, 16)] })], words: [{ t: 'Rest is', f: 'caveat', s: 26, c: '#7048e8' }, { t: 'productive', f: 'fredoka', s: 26, c: '#7048e8' }], at: [100, 156] }),
  mk('keep-going', 'Keep going! (slowly is fine)', ['keep going', 'slow and steady', 'snail', 'progress', 'funny'], { colors: ['#ff8fab', '#69db7c'], motion: 'none',
    art: () => [mascot('snail', 104, 74, 120, { face: { eyes: 'happy', mouth: 'grin' } }), V.loose(path('M20 90H38M12 104H34', { stroke: OL, 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.45 }))],
    words: [{ t: 'Keep going!', f: 'fredoka', s: 28, c: '#e64980' }, { t: '(slowly is fine)', f: 'caveat', s: 20, c: '#495057' }], at: [100, 158] }),
  mk('hello-sunshine', 'Hello, sunshine!', ['hello', 'sunshine', 'sun', 'morning', 'happy'], { colors: ['#ffd43b', '#f76707'], motion: 'pulse',
    art: () => [mascot('sun', 100, 74, 114, { face: { eyes: 'happy', mouth: 'open' }, props: X.blush() })], words: [{ t: 'Hello,', f: 'caveat', s: 26, c: '#f76707' }, { t: 'sunshine!', f: 'pacifico', s: 26, c: '#f76707', w: 3.5 }], at: [100, 158] }),
  mk('bloom', 'Bloom where you are', ['bloom', 'grow', 'flower', 'spring', 'growth'], { colors: ['#ff8fab', '#69db7c'], motion: 'swing',
    art: () => [mascot('flower', 100, 70, 106, { face: { eyes: 'happy', mouth: 'smile' } })], words: [{ t: 'Bloom', f: 'pacifico', s: 28, c: '#e64980', w: 3.5 }, { t: 'where you are', f: 'caveat', s: 22, c: '#2b8a3e' }], at: [100, 158] }),
  mk('one-step', 'One step at a time', ['one step', 'progress', 'patience', 'steps', 'journey'], { colors: ['#4dabf7', '#ffd43b'], motion: 'none',
    art: () => [I.foot(56, 100, 46, '#4dabf7', 24, true), I.foot(98, 70, 46, '#4dabf7', 30), I.foot(138, 32, 46, '#4dabf7', 24, true)], words: [{ t: 'One step', f: 'fredoka', s: 28, c: '#1c7ed6' }, { t: 'at a time', f: 'caveat', s: 24, c: '#495057' }], at: [100, 166] }),
  mk('stay-positive', 'Stay positive', ['positive', 'battery', 'energy', 'charged', 'plus'], { colors: ['#69db7c', '#2f9e44'], motion: 'pulse',
    art: () => [mascot('battery', 96, 72, 104, { part: 1, face: { eyes: 'happy', mouth: 'grin' } }), path('M156 26V52M143 39H169', { stroke: OL, 'stroke-width': 14, 'stroke-linecap': 'round' }), path('M156 26V52M143 39H169', { stroke: '#40c057', 'stroke-width': 7, 'stroke-linecap': 'round' })],
    words: W1('Stay positive', 'fredoka', 28, '#2f9e44'), at: [100, 160] }),
  mk('self-care', 'Self-care time', ['self care', 'tea', 'relax', 'calm', 'cozy'], { colors: ['#63e6be', '#0ca678'], motion: 'none',
    art: () => [mascot('mug', 100, 72, 98, { c: '#63e6be', face: { eyes: 'closed', mouth: 'smile' } }), I.heart(152, 38, 22)], words: W1('Self-care time', 'fredoka', 26, '#0ca678'), at: [100, 160] }),
  mk('smile', 'Smile!', ['smile', 'happy', 'face', 'joy', 'cheerful'], { colors: ['#ffd43b', '#f08c00'], motion: 'pop',
    art: () => [circle(100, 78, 62, fi('#ffd43b', 6)), V.loose(K.face(100, 80, 110, { eyes: 'happy', mouth: 'grin' })), K.shine(70, 44, 8, 13, 35, 0.6)], words: W1('Smile!', 'fredoka', 30, '#f08c00'), at: [100, 166] }),
  mk('you-are-enough', 'You are enough', ['enough', 'self love', 'kind', 'support', 'seal'], { colors: ['#9775fa', '#ffffff'], motion: 'pulse',
    words: [{ t: 'You are', f: 'caveat', s: 26, c: '#ffffff', o: false }, { t: 'ENOUGH', f: 'anton', s: 30, c: '#ffffff', o: false }], base: 'seal', baseFill: '#9775fa', baseO: { inner: '#ffffff' } }),
  mk('happy-place', 'Happy place', ['happy place', 'camping', 'outdoors', 'tent', 'nature'], { colors: ['#ff6b6b', '#2f9e44'], motion: 'none',
    art: () => [mascot('tent', 96, 76, 116, { face: { eyes: 'happy', mouth: 'smile' } }), mascot('sun', 158, 30, 42, { face: false })], words: W1('Happy place', 'fredoka', 28, '#2f9e44'), at: [100, 162] }),
  mk('sending-hugs', 'Sending hugs', ['hugs', 'hug', 'bear', 'care', 'love'], { colors: ['#c8875a', '#e64980'], motion: 'wiggle',
    art: () => [mascot('bear', 100, 72, 104, { face: { eyes: 'happy', mouth: 'smile' }, props: X.blush() }), I.heart(38, 40, 24), I.heart(162, 46, 18)], words: W1('Sending hugs', 'fredoka', 28, '#e64980'), at: [100, 160] }),
  mk('good-day', 'It\'s a good day', ['good day', 'coffee', 'morning', 'sun', 'happy'], { colors: ['#ffd43b', '#e8590c'], motion: 'bob',
    art: () => [mascot('sun', 142, 44, 66, { face: { eyes: 'happy', mouth: 'smile' } }), mascot('cup', 84, 84, 92, { face: { eyes: 'happy', mouth: 'grin' } })], words: [{ t: 'It\'s a', f: 'caveat', s: 22, c: '#495057' }, { t: 'good day', f: 'fredoka', s: 28, c: '#e8590c' }], at: [100, 160] }),
  mk('believe', 'Believe in yourself', ['believe', 'yourself', 'shooting star', 'confidence', 'dream'], { colors: ['#7048e8', '#ffd43b'], motion: 'pop',
    art: () => [trail(22, 104, 92, 66), I.star(116, 54, 84, '#ffd43b'), I.sparkle(170, 100, 16, '#ffd43b'), I.sparkle(48, 34, 18, '#ffd43b')], words: [{ t: 'Believe', f: 'pacifico', s: 28, c: '#7048e8', w: 3.5 }, { t: 'in yourself', f: 'caveat', s: 24, c: '#495057' }], at: [100, 154] }),
  mk('small-wins', 'Celebrate small wins', ['small wins', 'trophy', 'celebrate', 'progress', 'win'], { colors: ['#ffc93a', '#e8590c'], motion: 'pop',
    art: () => [confetti([[40, 34, '#ff6b6b', 20], [54, 60, '#4dabf7', -30], [150, 30, '#69db7c', 40], [164, 64, '#ff8fab', 10], [34, 84, '#ffd43b', 0], [168, 96, '#9775fa', -20]]), I.trophy(100, 70, 80)],
    words: [{ t: 'Celebrate', f: 'fredoka', s: 24, c: '#e8590c' }, { t: 'small wins', f: 'pacifico', s: 24, c: '#f08c00', w: 3.5 }], at: [100, 154] }),
  mk('grow', 'Grow at your own pace', ['grow', 'plant', 'growth', 'pace', 'patience'], { colors: ['#69db7c', '#e8590c'], motion: 'swing',
    art: () => [plant(100, 70, 104)], words: [{ t: 'Grow at', f: 'caveat', s: 24, c: '#2b8a3e' }, { t: 'your own pace', f: 'fredoka', s: 22, c: '#2b8a3e' }], at: [100, 158] }),
  mk('you-shine', 'You shine!', ['shine', 'gem', 'sparkle', 'bright', 'special'], { colors: ['#74c0fc', '#1c7ed6'], motion: 'pulse',
    art: () => [gem(100, 70, 106), I.sparkle(38, 36, 24), I.sparkle(162, 48, 16), I.sparkle(152, 110, 12)], words: W1('You shine!', 'fredoka', 30, '#1c7ed6'), at: [100, 160] }),
  mk('stay-calm', 'Stay calm', ['calm', 'relax', 'zen', 'peace', 'rocks'], { colors: ['#ced4da', '#495057'], motion: 'none',
    art: () => [mascot('rock', 100, 116, 92, { face: { eyes: 'closed', mouth: 'smile' } }), mascot('rock', 100, 78, 68, { c: '#ced4da', face: { eyes: 'closed', mouth: 'smile' } }), mascot('rock', 100, 50, 46, { c: '#dee2e6', face: { eyes: 'closed', mouth: 'smile' } })],
    words: W1('Stay calm', 'fredoka', 28, '#495057'), at: [100, 172] }),
  mk('grateful', 'Grateful', ['grateful', 'thanks', 'thankful', 'heart', 'gratitude'], { colors: ['#ff8787', '#ffd43b'], motion: 'beat',
    words: [{ t: 'Grateful', f: 'pacifico', s: 30, c: '#ffffff', o: false }], base: 'pill', baseFill: '#ff8787', art: () => [I.heart(40, 62, 26, '#ffd43b'), I.sparkle(162, 136, 18)] }),
  mk('hard-things', 'You can do hard things', ['hard things', 'mountain', 'goal', 'brave', 'climb'], { colors: ['#748ffc', '#ff6b6b'], motion: 'none',
    art: () => [mountain(100, 70, 120)], words: [{ t: 'You can do', f: 'caveat', s: 24, c: '#495057' }, { t: 'HARD THINGS', f: 'anton', s: 26, c: '#4c6ef5' }], at: [100, 156] })
];
module.exports = { CAT, LIST };
