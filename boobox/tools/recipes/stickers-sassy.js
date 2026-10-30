// Sassy: little attitudes, kept friendly (Nope., Not today, Cool story, Judging quietly...). Vinyl stickers with
// Blokvane's own critters and words.
'use strict';
const K = require('./kit');
const V = require('./vinyl');
const { r, P, g, path, circle, ellipse, rect, line, ink, anim, star, MOVES: M, OL } = K;
const { I } = V;
const { mascot, PROPS: X } = require('./mascots');

const CAT = 'Sassy';
const mk = (id, name, tags, o) => V.make({ id: 'sassy-' + id, name, cat: CAT, tags: ['sassy', 'funny', ...tags], ...o });
// a character on top and the words under it
const top = (kind, mo, size = 104, y = 72) => () => [mascot(kind, 100, y, size, mo)];
const W1 = (t, f = 'fredoka', s = 28, c = '#ffffff', o = {}) => [{ t, f, s, c, ...o }];
const bar = (x, y, w, part, c) => [rect(x, y, w, 18, { rx: 9, fill: '#ffffff', ...ink(4.5) }), rect(x + 4, y + 4, Math.max(10, (w - 8) * part), 10, { rx: 5, fill: c })];

const LIST = () => [
  mk('nope', 'Nope.', ['nope', 'no', 'stop', 'not happening'], { colors: ['#fa5252', '#ffffff'], motion: 'shake',
    words: [{ t: 'NOPE.', f: 'anton', s: 52, c: '#ffffff', w: 5 }], base: 'octagon', baseFill: '#fa5252', baseO: { inner: '#ffffff', dash: '0', pad: 22 } }),
  mk('not-today', 'Not today', ['not today', 'tired', 'lazy', 'no thanks', 'sleepy'], { colors: ['#c8a27a', '#845ef7'], motion: 'bob',
    art: () => [mascot('sloth', 100, 74, 108, { face: { eyes: 'closed', mouth: 'smile' } }), path('M150 34H162L150 46H162M168 18H176L168 26H176', { fill: 'none', stroke: '#748ffc', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })],
    words: W1('Not today.', 'fredoka', 30, '#845ef7'), at: [100, 162] }),
  mk('cool-story', 'Cool story', ['cool story', 'whatever', 'sure', 'boring', 'ok'], { colors: ['#adb5bd', '#4dabf7'], motion: 'tilt',
    art: () => [mascot('raccoon', 62, 128, 96, { face: { eyes: 'none', mouth: 'smirk' }, props: [X.shades(50)] })],
    words: W1('Cool story.', 'fredoka', 26, '#ffffff'), base: 'bubbleR', baseFill: '#4dabf7', at: [126, 50], maxW: 116 }),
  mk('whatever', 'Whatever.', ['whatever', 'meh', 'not impressed', 'cat', 'eye roll'], { colors: ['#ffa94d', '#e64980'], motion: 'tilt',
    art: top('cat', { face: { eyes: 'line', mouth: 'flat' } }), words: W1('Whatever.', 'playfairi', 30, '#e64980'), at: [100, 160] }),
  mk('meh', 'Meh', ['meh', 'whatever', 'so so', 'bored', 'okay'], { colors: ['#ced4da', '#495057'], motion: 'none',
    art: () => [mascot('blob', 100, 78, 112, { c: '#ced4da', face: { eyes: 'line', mouth: 'flat', cheeks: false } })], words: W1('meh.', 'outfit', 34, '#495057'), at: [100, 166] }),
  mk('im-fine', 'I\'m fine.', ['im fine', 'fine', 'stressed', 'everything is fine', 'okay'], { colors: ['#ffd43b', '#fa5252'], motion: 'shake',
    art: () => [mascot('blob', 100, 74, 108, { c: '#ffd43b', face: { eyes: 'big', mouth: 'teeth' }, props: [X.sweat(84, 22), X.sweat(14, 34)] })],
    words: W1('I\'m fine.', 'fredoka', 30, '#fa5252'), at: [100, 162] }),
  mk('big-mood', 'Big mood', ['big mood', 'mood', 'same', 'relatable', 'moon'], { colors: ['#ffe066', '#5f3dc4'], motion: 'float',
    art: () => [mascot('moon', 100, 72, 100, {}), I.sparkle(154, 40, 22, '#ffffff'), I.sparkle(40, 96, 16, '#ffffff')], words: W1('Big mood', 'unbounded', 26, '#ffe066', { o: '#3b2a8a' }), base: 'none', at: [100, 158] }),
  mk('zero-worries', 'Zero worries', ['zero worries', 'chill', 'relax', 'no worries', 'calm'], { colors: ['#ffe066', '#4dabf7'], motion: 'float',
    art: () => [path('M30 112Q50 104 70 112T110 112T150 112T170 112', { fill: 'none', stroke: '#74c0fc', 'stroke-width': 6, 'stroke-linecap': 'round' }), mascot('duck', 100, 76, 96, { face: { eyes: 'none' }, props: [X.shades(42)] })],
    words: W1('Zero worries', 'fredoka', 26, '#4dabf7'), at: [100, 160] }),
  mk('judging-quietly', 'Judging quietly', ['judging', 'side eye', 'owl', 'watching', 'quiet'], { colors: ['#9775fa', '#5f3dc4'], motion: 'none',
    art: top('owl', { face: { eyes: 'line' } }), words: [{ t: 'Judging', f: 'playfairi', s: 26, c: '#5f3dc4' }, { t: 'quietly.', f: 'playfairi', s: 22, c: '#5f3dc4' }], at: [100, 164] }),
  mk('bold-move', 'Bold move', ['bold move', 'confident', 'brave', 'boss', 'raccoon'], { colors: ['#adb5bd', '#ffd43b'], motion: 'pop',
    art: () => [mascot('raccoon', 100, 76, 100, { face: { eyes: 'none', mouth: 'grin' }, props: [X.shades(52), X.crown(50, 4)] })], words: W1('Bold move.', 'anton', 34, '#ffd43b', { drop: '#e67700' }), at: [100, 162] }),
  mk('plot-twist', 'Plot twist!', ['plot twist', 'surprise', 'wait what', 'twist', 'drama'], { colors: ['#cc5de8', '#ffffff'], motion: 'pop',
    words: [{ t: 'PLOT', f: 'unbounded', s: 30, c: '#ffffff', w: 5 }, { t: 'TWIST!', f: 'unbounded', s: 34, c: '#ffffff', w: 5 }], base: 'burst', baseFill: '#cc5de8', baseO: { pad: 16 },
    art: () => [V.loose(path('M166 30C166 16 186 16 186 30C186 40 176 40 176 50', { fill: 'none', stroke: OL, 'stroke-width': 7, 'stroke-linecap': 'round' })), V.loose(circle(176, 62, 4.5, { fill: OL }))] }),
  mk('oh-no', 'Oh no.', ['oh no', 'uh oh', 'oops', 'worried', 'yikes'], { colors: ['#74c0fc', '#1c7ed6'], motion: 'shake',
    art: () => [mascot('blob', 100, 76, 108, { c: '#74c0fc', face: { eyes: 'big', mouth: 'o' }, props: [X.sweat(84, 24)] })], words: W1('Oh no.', 'fredoka', 32, '#1c7ed6'), at: [100, 164] }),
  mk('yikes', 'Yikes', ['yikes', 'eek', 'scary', 'awkward', 'oh no'], { colors: ['#ffd43b', '#fa5252'], motion: 'shake',
    words: [{ t: 'YIKES', f: 'anton', s: 46, c: '#fa5252', w: 5 }], base: 'burst', baseFill: '#ffd43b', baseO: { pad: 20 }, art: () => [I.drop(40, 46, 18), I.drop(160, 150, 16)] }),
  mk('rude', 'Rude.', ['rude', 'offended', 'excuse me', 'how dare', 'cat'], { colors: ['#ff8fab', '#ffffff'], motion: 'tilt',
    art: () => [mascot('cat', 64, 128, 94, { c: '#ffffff', face: { eyes: 'line', mouth: 'o' } })], words: W1('Rude.', 'playfairi', 32, '#ffffff', { o: '#c2255c' }), base: 'bubbleR', baseFill: '#ff8fab', at: [132, 50], maxW: 100 }),
  mk('not-my-circus', 'Not my circus', ['not my circus', 'not my problem', 'drama', 'circus'], { colors: ['#ff6b6b', '#ffd43b'], motion: 'none',
    art: top('tent', {}, 100, 70), words: [{ t: 'Not my', f: 'caveat', s: 26, c: '#343a40', o: false }, { t: 'circus', f: 'pacifico', s: 30, c: '#ff6b6b' }], at: [100, 160] }),
  mk('cant-busy', 'Can\'t. Busy.', ['cant busy', 'busy', 'lazy', 'sloth', 'no time'], { colors: ['#c8a27a', '#2f9e44'], motion: 'swing',
    art: () => [path('M20 34Q100 22 180 34', { fill: 'none', ...ink(14) }), path('M20 34Q100 22 180 34', { fill: 'none', stroke: '#a0522d', 'stroke-width': 7, 'stroke-linecap': 'round' }), path('M62 34Q60 50 70 60M138 34Q140 50 130 60', { fill: 'none', ...ink(9) }), path('M62 34Q60 50 70 60M138 34Q140 50 130 60', { fill: 'none', stroke: '#c8a27a', 'stroke-width': 5, 'stroke-linecap': 'round' }), mascot('sloth', 100, 82, 84, {})],
    words: W1('Can\'t. Busy.', 'fredoka', 28, '#2f9e44'), at: [100, 160] }),
  mk('social-battery', 'Social battery: low', ['social battery', 'introvert', 'tired', 'low battery', 'drained'], { colors: ['#fa5252', '#495057'], motion: 'pulse',
    art: () => [mascot('battery', 100, 72, 124, { part: 0.12, face: { eyes: 'sleepy', mouth: 'flat' } })], words: [{ t: 'SOCIAL BATTERY', f: 'outfit', s: 18, c: '#495057', o: false }, { t: 'LOW', f: 'anton', s: 34, c: '#fa5252' }], at: [100, 158] }),
  mk('please-hold', 'Please hold...', ['please hold', 'wait', 'one moment', 'loading', 'hold on'], { colors: ['#e9ecef', '#4dabf7'], motion: 'none',
    art: () => [I.typing(100, 72, 110)], words: W1('Please hold...', 'fredoka', 26, '#4dabf7'), at: [100, 156], css: I.typingCss() }),
  mk('drama-free', 'Drama-free zone', ['drama free', 'calm', 'peace', 'no drama', 'zone'], { colors: ['#ffd43b', '#2b2346'], motion: 'none',
    words: [{ t: 'DRAMA-FREE', f: 'anton', s: 24, c: OL, o: false }, { t: 'ZONE', f: 'anton', s: 30, c: OL, o: false }], base: 'sign', baseFill: '#ffd43b', baseO: { inner: OL, dash: '0', pad: 10 } }),
  mk('witty-reply', 'Witty reply loading', ['witty', 'sarcasm', 'loading', 'comeback', 'thinking'], { colors: ['#20c997', '#ffffff'], motion: 'none',
    words: [{ t: 'Witty reply', f: 'fredoka', s: 26, c: '#ffffff', o: '#087f5b' }, { t: 'loading...', f: 'caveat', s: 26, c: '#ffffff', o: '#087f5b' }], base: 'box', baseFill: '#20c997', at: [100, 82],
    art: () => [anim('ld', ...bar(46, 132, 108, 0.7, '#ffd43b'))], css: '.ld rect:last-child{animation:ldk 2.4s ease-in-out infinite;transform-box:fill-box;transform-origin:0 50%}@keyframes ldk{0%{transform:scaleX(.15)}80%,100%{transform:scaleX(1)}}' }),
  mk('unbothered', 'Unbothered', ['unbothered', 'chill', 'calm', 'duck', 'whatever'], { colors: ['#ffe066', '#748ffc'], motion: 'float',
    art: () => [mascot('duck', 100, 74, 104, { face: { eyes: 'none' }, props: [X.shades(42)] })], words: W1('Unbothered.', 'playfairi', 28, '#748ffc'), at: [100, 160] }),
  mk('main-character', 'Main character', ['main character', 'star', 'confident', 'iconic', 'fabulous'], { colors: ['#ffd43b', '#e64980'], motion: 'pop',
    art: () => [mascot('star', 100, 70, 104, { face: { eyes: 'none', mouth: 'grin' }, props: [X.shades(54, 0.8)] }), I.sparkle(42, 34, 18, '#ffffff'), I.sparkle(162, 96, 16, '#ffffff')],
    words: [{ t: 'MAIN', f: 'unbounded', s: 22, c: '#e64980' }, { t: 'CHARACTER', f: 'unbounded', s: 22, c: '#e64980' }], at: [100, 160] }),
  mk('hard-pass', 'Hard pass', ['hard pass', 'no', 'decline', 'stamp', 'nope'], { colors: ['#e03131'], motion: 'pulse',
    words: [{ t: 'HARD PASS', f: 'alfa', s: 30, c: '#e03131', o: false, tilt: -8 }], base: 'box', baseFill: '#fff5f5', baseO: { ol: '#e03131', ow: 7, inner: '#e03131', pad: 16 } }),
  mk('eye-roll', 'Eye roll', ['eye roll', 'whatever', 'annoyed', 'sure', 'ugh'], { colors: ['#ffffff', '#845ef7'], motion: 'none',
    art: () => [I.eyes(100, 70, 120, 0.4, 1)], words: W1('*eye roll*', 'caveat', 34, '#845ef7', { o: false }), at: [100, 150] }),
  mk('okay-but-why', 'Okay, but why?', ['okay but why', 'why', 'confused', 'frog', 'question'], { colors: ['#69db7c', '#2f9e44'], motion: 'tilt',
    art: () => [mascot('frog', 100, 74, 108, { face: { mouth: 'flat' } })], words: W1('Okay, but why?', 'fredoka', 24, '#2f9e44'), at: [100, 160] }),
  mk('overthinking', 'Overthinking again', ['overthinking', 'thinking', 'brain', 'anxious', 'busy mind'], { colors: ['#ffa8c5', '#845ef7'], motion: 'shake',
    art: () => [mascot('brain', 100, 72, 108, { face: { eyes: 'dizzy', mouth: 'wavy' } }), I.swirl(162, 36, 28, '#845ef7')], words: [{ t: 'Overthinking', f: 'fredoka', s: 24, c: '#845ef7' }, { t: 'again', f: 'caveat', s: 22, c: '#845ef7', o: false }], at: [100, 160] }),
  mk('running-late', 'Running late', ['running late', 'late', 'slow', 'snail', 'on my way'], { colors: ['#ffa8a8', '#e8590c'], motion: 'bob',
    art: () => [mascot('snail', 100, 78, 120, {}), path('M24 62H40M18 76H36M26 90H42', { stroke: '#adb5bd', 'stroke-width': 4, 'stroke-linecap': 'round' })], words: [{ t: 'Running late', f: 'fredoka', s: 24, c: '#e8590c' }, { t: 'as usual', f: 'caveat', s: 22, c: '#e8590c', o: false }], at: [100, 160] }),
  mk('snack-mood', 'Current mood: snacks', ['snacks', 'mood', 'hungry', 'cookie', 'treat'], { colors: ['#e8b35a', '#e8590c'], motion: 'wiggle',
    art: top('cookie', { face: { eyes: 'heart', mouth: 'open' } }), words: [{ t: 'Current mood:', f: 'caveat', s: 22, c: '#495057', o: false }, { t: 'SNACKS', f: 'anton', s: 32, c: '#e8590c' }], at: [100, 160] }),
  mk('spicy', 'Spicy', ['spicy', 'hot', 'chili', 'feisty', 'fire'], { colors: ['#fa5252', '#ffd43b'], motion: 'shake',
    art: () => [mascot('chili', 100, 76, 112, { face: { eyes: 'none', mouth: 'grin' }, props: [X.shades(44, 0.5)] })], words: W1('Spicy.', 'pacifico', 30, '#fa5252', { w: 3.5 }), at: [100, 160] }),
  mk('introvert-mode', 'Introvert mode: on', ['introvert', 'headphones', 'quiet', 'do not disturb', 'music'], { colors: ['#b197fc', '#ff6b9a'], motion: 'bob',
    art: () => [mascot('blob', 100, 76, 104, { c: '#b197fc', face: { eyes: 'closed', mouth: 'smile' }, props: [X.phones(52)] }), I.music(160, 44, 28, '#ff6b9a')], words: [{ t: 'Introvert mode', f: 'fredoka', s: 22, c: '#7048e8' }, { t: 'ON', f: 'anton', s: 26, c: '#ff6b9a' }], at: [100, 160] }),
  mk('cute-but-grumpy', 'Cute but grumpy', ['grumpy', 'cute', 'cat', 'mood', 'cranky'], { colors: ['#adb5bd', '#e64980'], motion: 'tilt',
    art: top('cat', { c: '#adb5bd', face: { eyes: 'line', mouth: 'sad' } }), words: [{ t: 'Cute but', f: 'caveat', s: 24, c: '#495057', o: false }, { t: 'GRUMPY', f: 'anton', s: 30, c: '#e64980' }], at: [100, 160] }),
  mk('nah', 'Nah.', ['nah', 'no', 'pig', 'nope', 'not interested'], { colors: ['#ffc9c9', '#e64980'], motion: 'none',
    art: top('pig', { face: { eyes: 'line' } }), words: W1('Nah.', 'unbounded', 32, '#e64980'), at: [100, 162] }),
  mk('try-me', 'Try me.', ['try me', 'prickly', 'hedgehog', 'feisty', 'bring it'], { colors: ['#a0522d', '#ff922b'], motion: 'shake',
    art: top('hedgehog', { face: { eyes: 'line', mouth: 'smirk' } }), words: W1('Try me.', 'fredoka', 32, '#ff922b'), at: [100, 162] }),
  mk('chaos-mode', 'Chaos mode', ['chaos', 'wild', 'crazy', 'busy', 'mess'], { colors: ['#ff922b', '#ffd43b'], motion: 'shake',
    art: () => [mascot('blob', 100, 76, 104, { c: '#ff922b', face: { eyes: 'dizzy', mouth: 'grin' } }), I.bolt(38, 44, 34), I.bolt(166, 40, 30)], words: W1('CHAOS MODE', 'anton', 30, '#ffd43b', { drop: '#e8590c' }), at: [100, 162] }),
  mk('thats-cute', 'That\'s cute.', ['thats cute', 'cute', 'sarcastic', 'sure', 'aww'], { colors: ['#ff8fab', '#ffffff'], motion: 'pop',
    words: W1('That\'s cute.', 'playfairi', 28, '#ffffff', { o: '#c2255c' }), base: 'heart', baseFill: '#ff8fab', art: () => [I.sparkle(44, 44, 20, '#ffd43b'), I.sparkle(160, 52, 16, '#ffffff')] }),
  mk('sure-sure', 'Sure, sure', ['sure', 'right', 'okay', 'doubt', 'mhm'], { colors: ['#63e6be', '#087f5b'], motion: 'tilt',
    art: () => [mascot('bear', 100, 74, 104, { c: '#63e6be', face: { eyes: 'line', mouth: 'smirk' } })], words: W1('Sure, sure.', 'fredoka', 28, '#087f5b'), at: [100, 160] })
];
module.exports = { CAT, LIST };
