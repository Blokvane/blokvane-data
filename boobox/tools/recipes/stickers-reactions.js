// Reactions: little cheers and answers for a board, a note or a slide (Great idea!, +1, Amazing!, Nope...). Vinyl
// stickers: a white die-cut edge and a soft shadow. Blokvane's own drawings and words.
'use strict';
const K = require('./kit');
const V = require('./vinyl');
const { r, P, at, g, node, path, circle, ellipse, rect, line, ink, fillInk, anim, heart, star, roundPoly, scallop, rrect, MOVES: M, OL, HL, SH } = K;
const { I, critter } = V;

const CAT = 'Reactions';
const mk = (id, name, tags, o) => V.make({ id: 'react-' + id, name, cat: CAT, tags: ['reaction', ...tags], ...o });
const face = (cx, cy, s, o) => K.face(cx, cy, s, { eyes: 'dot', mouth: 'smile', ...o });
// a gem (diamond) and a rock with a face
const gem = (cx, cy, s, c = '#74c0fc') => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, path(`M${P(x(-46), y(-14))}L${P(x(-26), y(-38))}H${r(x(26))}L${P(x(46), y(-14))}L${P(x(0), y(44))}Z`, { fill: c, ...ink(5) }), path(`M${P(x(-46), y(-14))}H${r(x(46))}M${P(x(-14), y(-38))}L${P(x(-20), y(-14))}L${P(x(0), y(44))}L${P(x(20), y(-14))}L${P(x(14), y(-38))}`, { fill: 'none', ...ink(3.5) }), path(`M${P(x(-26), y(-38))}L${P(x(-20), y(-14))}H${r(x(-46))}Z`, { fill: '#ffffff', opacity: 0.5 })); };
const hammer = (cx, cy, s) => { const k = s / 100; return g({ transform: `translate(${r(cx)} ${r(cy)}) rotate(-35) scale(${r(k)})` }, rect(-8, -10, 16, 66, { rx: 6, fill: '#c8875a', ...ink(4.5) }), rect(-34, -34, 68, 28, { rx: 6, fill: '#868e96', ...ink(4.5) }), rect(-34, -34, 14, 28, { rx: 4, fill: '#adb5bd' })); };
const partyHat = (cx, cy, s, c = '#4dabf7', c2 = '#ffd43b') => { const k = s / 100, x = v => cx + v * k, y = v => cy + v * k; return g({}, path(`M${P(x(-26), y(30))}L${P(x(0), y(-40))}L${P(x(26), y(30))}Z`, { fill: c, ...ink(4.5) }), path(`M${P(x(-17), y(6))}L${P(x(13), y(-14))}M${P(x(-22), y(20))}L${P(x(22), y(-2))}`, { stroke: c2, 'stroke-width': r(6 * k), 'stroke-linecap': 'round' }), circle(x(0), y(-42), 8 * k, { fill: '#ff6b9a', ...ink(3.5) })); };
// confetti bits around (loose: not inside the white edge)
const confetti = (pts, cls = 'cf') => pts.map((p, i) => V.loose(anim(cls + i, rect(p[0] - 5, p[1] - 3, 10, 6, { rx: 2, fill: p[2], transform: `rotate(${p[3] || 30} ${p[0]} ${p[1]})` }))));
const confettiCss = (n, cls = 'cf') => Array.from({ length: n }, (_, i) => M.twinkle(cls + i, 1.6, i * 0.22)).join('');
const twinkles = (pts, cls = 'tw', c = '#ffd43b') => pts.map((p, i) => anim(cls + i, path(star(p[0], p[1], p[2] / 2, p[2] / 7, 4, -90), { fill: p[3] || c, ...ink(2.5) })));
const twinkleCss = (n, cls = 'tw') => Array.from({ length: n }, (_, i) => M.twinkle(cls + i, 1.8, i * 0.45)).join('');

const LIST = () => [
  mk('great-idea', 'Great idea!', ['great idea', 'idea', 'light bulb', 'smart', 'brainstorm', 'yes'], { colors: ['#ffe066', '#ff922b'], motion: 'pop',
    art: () => [I.rays(100, 62, 44, 7, 12, OL, -90, 170), I.bulb(100, 66, 66), face(100, 56, 34, { eyes: 'happy', mouth: 'open', cheeks: true })],
    words: [{ t: 'GREAT IDEA!', f: 'fredoka', s: 26, c: '#ff922b' }], at: [100, 158] }),
  mk('plus-one', '+1', ['plus one', '+1', 'agree', 'me too', 'vote', 'like'], { colors: ['#ff6b9a', '#ffffff'], motion: 'pop',
    words: [{ t: '+1', f: 'unbounded', s: 54, c: '#ffffff', w: 6 }], base: 'burst', baseFill: '#ff6b9a', baseO: { pad: 22 },
    art: () => twinkles([[38, 42, 18], [166, 54, 14], [160, 160, 12]]), css: twinkleCss(3) }),
  mk('plus-hundred', '+100', ['plus 100', '+100', 'totally', 'agree', 'yes', 'vote'], { colors: ['#4dabf7', '#ffffff'], motion: 'pop',
    words: [{ t: '+100', f: 'unbounded', s: 40, c: '#ffffff', w: 5.5 }], base: 'seal', baseFill: '#4dabf7', baseO: { pad: 18, inner: '#ffffff' } }),
  mk('amazing', 'Amazing!', ['amazing', 'wow', 'awesome', 'love', 'great'], { colors: ['#ff6b9a', '#ffd43b'], motion: 'bob',
    art: () => [critter(100, 74, 84, '#ff6b9a', { arms: 'up', face: { eyes: 'heart', mouth: 'open' } }), ...twinkles([[34, 40, 16], [168, 36, 14]])],
    words: [{ t: 'Amazing!', f: 'pacifico', s: 30, c: '#ffd43b', w: 5 }], at: [100, 160], css: twinkleCss(2) }),
  mk('love-it', 'Love it!', ['love it', 'love', 'heart', 'like', 'favorite'], { colors: ['#ff4d6d', '#ffffff'], motion: 'beat',
    art: () => [path(heart(100, 80, 108), { fill: '#ff4d6d', ...ink(5) }), K.shine(70, 56, 8, 14, 35, 0.6), face(100, 82, 54, { eyes: 'happy', mouth: 'open', cheeks: false })],
    words: [{ t: 'Love it!', f: 'fredoka', s: 32, c: '#ffffff', o: '#c9184a', w: 6 }], at: [100, 166] }),
  mk('yes', 'Yes!', ['yes', 'agree', 'approved', 'correct', 'right'], { colors: ['#40c057', '#ffffff'], motion: 'pop',
    art: () => [I.check(100, 74, 78)], words: [{ t: 'YES!', f: 'anton', s: 40, c: '#40c057', w: 5 }], at: [100, 160] }),
  mk('nope', 'Nope', ['nope', 'no', 'not happening', 'deny', 'wrong'], { colors: ['#fa5252', '#ffffff'], motion: 'shake',
    art: () => [I.cross(100, 74, 78)], words: [{ t: 'NOPE', f: 'unbounded', s: 30, c: '#fa5252', w: 5 }], at: [100, 158] }),
  mk('wow', 'Wow', ['wow', 'amazing', 'surprised', 'impressive'], { colors: ['#ffd43b', '#845ef7'], motion: 'pop',
    words: [{ t: 'WOW', f: 'unbounded', s: 46, c: '#845ef7', w: 6, drop: '#5f3dc4' }], base: 'burst', baseFill: '#ffd43b', baseO: { pad: 24 },
    art: () => twinkles([[30, 36, 16, '#ffffff'], [172, 168, 14, '#ffffff']]), css: twinkleCss(2) }),
  mk('nailed-it', 'Nailed it!', ['nailed it', 'success', 'done', 'perfect', 'win'], { colors: ['#ffa94d', '#495057'], motion: 'wiggle',
    art: () => [hammer(112, 66, 74), ...I.rays(70, 92, 18, 4, 10, OL, -150, 100) ? [I.rays(70, 92, 18, 4, 10, OL, -150, 100)] : []],
    words: [{ t: 'Nailed it!', f: 'fredoka', s: 30, c: '#ffa94d', w: 5 }], at: [100, 158] }),
  mk('done-stamp', 'Done', ['done', 'finished', 'complete', 'stamp', 'approved'], { colors: ['#2f9e44', '#ebfbee'], motion: 'pulse',
    words: [{ t: 'DONE', f: 'alfa', s: 40, c: '#2f9e44', o: false }], base: 'box', baseFill: '#ebfbee', baseO: { pad: 16, ol: '#2f9e44', ow: 7, inner: '#2f9e44' },
    art: () => [I.check(166, 54, 34)] }),
  mk('oops', 'Oops!', ['oops', 'mistake', 'sorry', 'whoops', 'my bad'], { colors: ['#74c0fc', '#ffd43b'], motion: 'shake',
    art: () => [critter(100, 78, 84, '#74c0fc', { arms: 'up', face: { eyes: 'big', mouth: 'o' } }), I.drop(146, 46, 20, '#a5d8ff')],
    words: [{ t: 'Oops!', f: 'fredoka', s: 32, c: '#ffd43b', w: 5 }], at: [100, 162] }),
  mk('hmm', 'Hmm...', ['hmm', 'thinking', 'wondering', 'not sure', 'maybe'], { colors: ['#b197fc', '#e5dbff'], motion: 'tilt',
    art: () => [critter(74, 116, 78, '#b197fc', { arms: false, face: { eyes: 'line', mouth: 'smirk', cheeks: false } }), ellipse(98, 130, 9, 12, { fill: '#b197fc', ...ink(4.5), transform: 'rotate(-30 98 130)' })],
    words: [{ t: 'Hmm...', f: 'caveat', s: 30, c: '#5f3dc4', o: false }], base: 'bubbleR', baseFill: '#e5dbff', at: [130, 50], maxW: 110 }),
  mk('so-true', 'So true!', ['so true', 'agree', 'facts', 'exactly', 'right'], { colors: ['#20c997', '#ffffff'], motion: 'pop',
    words: [{ t: 'SO', f: 'unbounded', s: 30, c: '#ffffff', w: 5 }, { t: 'TRUE!', f: 'unbounded', s: 34, c: '#ffffff', w: 5 }], base: 'bubble', baseFill: '#20c997', at: [100, 92] }),
  mk('me-too', 'Me too!', ['me too', 'same', 'agree', 'pick me', 'yes'], { colors: ['#ffa94d', '#ffffff'], motion: 'bob',
    art: () => [critter(100, 82, 82, '#ffa94d', { arms: 'wave', face: { eyes: 'happy', mouth: 'open' } })],
    words: [{ t: 'Me too!', f: 'fredoka', s: 30, c: '#ffffff', o: '#e8590c', w: 5 }], at: [100, 164] }),
  mk('lets-go', 'Let\'s go!', ['lets go', 'go', 'hype', 'start', 'energy', 'excited'], { colors: ['#ffd43b', '#fa5252'], motion: 'pop',
    art: () => [I.bolt(36, 60, 40), I.bolt(166, 132, 36)], words: [{ t: 'LET\'S', f: 'anton', s: 34, c: '#ffd43b', w: 5, tilt: -6, drop: '#e03131' }, { t: 'GO!', f: 'anton', s: 58, c: '#ffd43b', w: 6, tilt: -6, drop: '#e03131' }] }),
  mk('you-rock', 'You rock!', ['you rock', 'rock', 'awesome', 'thanks', 'great job'], { colors: ['#adb5bd', '#ff6b9a'], motion: 'bob',
    art: () => [path('M50 112C44 86 64 52 96 50C128 48 156 70 156 100C156 124 142 136 112 138C80 140 54 132 50 112Z', { fill: '#adb5bd', ...ink(5) }), path('M70 68C80 62 92 60 100 62', { fill: 'none', stroke: '#ffffff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: 0.7 }),
      ellipse(132, 116, 10, 6, { fill: SH, opacity: 0.12 }), face(102, 98, 56, { eyes: 'shades', mouth: 'grin' })],
    words: [{ t: 'You rock!', f: 'fredoka', s: 30, c: '#ff6b9a', w: 5 }], at: [100, 168] }),
  mk('brilliant', 'Brilliant!', ['brilliant', 'genius', 'smart', 'gem', 'great'], { colors: ['#74c0fc', '#845ef7'], motion: 'pop',
    art: () => [gem(100, 72, 82), ...twinkles([[50, 40, 18, '#ffffff'], [154, 34, 14, '#fff3bf'], [158, 96, 12, '#ffffff']])],
    words: [{ t: 'Brilliant!', f: 'playfairi', s: 28, c: '#845ef7', w: 4.5 }], at: [100, 160], css: twinkleCss(3) }),
  mk('hundred', '100', ['100', 'perfect', 'score', 'totally', 'keep it 100'], { colors: ['#f03e3e'], motion: 'pop',
    words: [{ t: '100', f: 'unbounded', s: 56, c: '#f03e3e', o: false, tilt: -8 }],
    art: () => [path('M44 140Q100 128 156 132', { fill: 'none', stroke: '#f03e3e', 'stroke-width': 8, 'stroke-linecap': 'round' }), path('M50 156Q100 146 150 150', { fill: 'none', stroke: '#f03e3e', 'stroke-width': 8, 'stroke-linecap': 'round' })], at: [100, 92] }),
  mk('on-fire', 'On fire!', ['on fire', 'fire', 'hot', 'streak', 'unstoppable'], { colors: ['#ff922b', '#ffd43b'], motion: 'wiggle',
    art: () => [I.flame(100, 74, 104), face(100, 92, 42, { eyes: 'shades', mouth: 'grin', cheeks: false })],
    words: [{ t: 'ON FIRE!', f: 'anton', s: 34, c: '#ffd43b', w: 5, drop: '#e8590c' }], at: [100, 164] }),
  mk('mind-blown', 'Mind blown', ['mind blown', 'wow', 'shocked', 'amazing', 'wait what'], { colors: ['#ffc078', '#845ef7'], motion: 'pulse',
    art: () => [path(star(100, 52, 46, 28, 9, -90, 4), { fill: '#ffd43b', ...ink(4.5) }), path('M54 110C54 76 74 64 100 64C126 64 146 76 146 110C146 138 128 152 100 152C72 152 54 138 54 110Z', { fill: '#ffc078', ...ink(5) }), face(100, 110, 60, { eyes: 'big', mouth: 'o' })],
    words: [{ t: 'Mind blown', f: 'fredoka', s: 24, c: '#845ef7', w: 4.5 }], at: [100, 174] }),
  mk('good-job', 'Good job!', ['good job', 'well done', 'star', 'praise', 'great work'], { colors: ['#ffd43b', '#4dabf7'], motion: 'pop',
    art: () => [path(star(100, 76, 62, 30, 5, -90, 8), { fill: '#ffd43b', ...ink(5) }), face(100, 82, 46, { eyes: 'happy', mouth: 'open' })],
    words: [{ t: 'Good job!', f: 'fredoka', s: 28, c: '#4dabf7', w: 5 }], at: [100, 162] }),
  mk('agreed', 'Agreed', ['agreed', 'deal', 'yes', 'stamp', 'approved', 'ok'], { colors: ['#1c7ed6', '#e7f5ff'], motion: 'pulse',
    words: [{ t: 'AGREED', f: 'alfa', s: 30, c: '#1c7ed6', o: false, tilt: -8 }], base: 'circle', baseFill: '#e7f5ff', baseO: { ol: '#1c7ed6', ow: 7, inner: '#1c7ed6', pad: 18 } }),
  mk('same', 'Same', ['same', 'me too', 'relatable', 'twins', 'agree'], { colors: ['#ff8787', '#74c0fc'], motion: 'bob',
    art: () => [critter(66, 64, 60, '#ff8787', { arms: false, feet: false, face: { eyes: 'happy', mouth: 'smile' } }), critter(134, 64, 60, '#74c0fc', { arms: false, feet: false, face: { eyes: 'happy', mouth: 'smile' } })],
    words: [{ t: 'SAME', f: 'unbounded', s: 34, c: '#ffffff', w: 5 }], base: 'pill', baseFill: '#845ef7', at: [100, 140] }),
  mk('ha-ha', 'Ha ha!', ['ha ha', 'lol', 'funny', 'laugh', 'joke'], { colors: ['#ffd43b', '#ff6b9a'], motion: 'shake',
    art: () => [circle(100, 72, 46, { fill: '#ffd43b', ...ink(5) }), face(100, 74, 70, { eyes: 'closed', mouth: 'open' }), I.drop(58, 74, 16, '#74c0fc'), I.drop(142, 74, 16, '#74c0fc')],
    words: [{ t: 'HA HA!', f: 'unbounded', s: 28, c: '#ff6b9a', w: 5, tilt: -5 }], at: [100, 158] }),
  mk('ooh', 'Ooh!', ['ooh', 'interesting', 'curious', 'nice', 'tell me more'], { colors: ['#63e6be', '#0ca678'], motion: 'bob',
    art: () => [critter(100, 80, 84, '#63e6be', { arms: 'up', face: { eyes: 'sparkle', mouth: 'o' } })],
    words: [{ t: 'Ooh!', f: 'fredoka', s: 34, c: '#0ca678', w: 5 }], at: [100, 164] }),
  mk('big-yes', 'Big yes', ['big yes', 'yes', 'absolutely', 'for sure', 'agree'], { colors: ['#51cf66', '#ffffff'], motion: 'pop',
    words: [{ t: 'BIG', f: 'anton', s: 40, c: '#ffffff', w: 5 }, { t: 'YES', f: 'anton', s: 62, c: '#ffffff', w: 6 }], base: 'burst', baseFill: '#51cf66', baseO: { pad: 16 } }),
  mk('cheers', 'Cheers!', ['cheers', 'toast', 'celebrate', 'party', 'congrats'], { colors: ['#ffd43b', '#ffa94d'], motion: 'wiggle',
    art: () => [g({ transform: 'translate(132 0) scale(-1 1)' }, g({ transform: 'rotate(-14 66 88)' }, I.cup(66, 88, 62, { cup: '#ffffff', band: '#ffa94d', coffee: '#ffe066', faceO: { eyes: 'happy', mouth: 'open' } }))), g({ transform: 'rotate(-14 134 88)' }, I.cup(134, 88, 62, { cup: '#ffffff', band: '#74c0fc', coffee: '#ffe066', faceO: { eyes: 'happy', mouth: 'open' } })), I.drop(88, 36, 16, '#ffe066'), I.drop(100, 24, 18, '#ffe066'), I.drop(113, 36, 14, '#ffe066'), ...twinkles([[156, 30, 18]])],
    words: [{ t: 'Cheers!', f: 'pacifico', s: 26, c: '#ffa94d', w: 5 }], at: [100, 166], css: twinkleCss(1) }),
  mk('woohoo', 'Woohoo!', ['woohoo', 'party', 'celebrate', 'yay', 'happy'], { colors: ['#ff8fab', '#4dabf7'], motion: 'bob',
    art: () => [critter(100, 92, 80, '#ff8fab', { arms: 'up', face: { eyes: 'happy', mouth: 'open' } }), partyHat(100, 40, 44), ...confetti([[34, 52, '#4dabf7', 20], [166, 46, '#ffd43b', 60], [172, 110, '#51cf66', 10], [28, 118, '#cc5de8', 45]])],
    words: [{ t: 'Woohoo!', f: 'fredoka', s: 28, c: '#4dabf7', w: 5 }], at: [100, 170], css: confettiCss(4) }),
  mk('all-good', 'All good!', ['all good', 'fine', 'ok', 'no worries', 'happy'], { colors: ['#ffd43b', '#ff922b'], motion: 'pop',
    art: () => [I.rays(100, 72, 46, 12, 12, '#ff922b'), circle(100, 72, 40, { fill: '#ffd43b', ...ink(5) }), face(100, 74, 58, { eyes: 'happy', mouth: 'smile' })],
    words: [{ t: 'All good!', f: 'fredoka', s: 28, c: '#ff922b', w: 5 }], at: [100, 164] }),
  mk('yay', 'Yay!', ['yay', 'happy', 'celebrate', 'hooray', 'excited'], { colors: ['#cc5de8', '#ffd43b'], motion: 'pop',
    words: [{ t: 'YAY!', f: 'unbounded', s: 44, c: '#ffd43b', w: 6, drop: '#9c36b5' }], base: 'cloud', baseFill: '#cc5de8', at: [100, 104],
    art: () => twinkles([[36, 44, 16], [168, 40, 14], [170, 160, 12, '#ffffff']]), css: twinkleCss(3) }),
  mk('noted', 'Noted', ['noted', 'got it', 'ok', 'understood', 'will do'], { colors: ['#fff3bf', '#495057'], motion: 'tilt',
    art: () => [I.pencil(150, 64, 62, 30)], words: [{ t: 'Noted.', f: 'caveat', s: 34, c: '#343a40', o: false }], base: 'card', baseFill: '#fff3bf', baseO: { pad: 18 }, at: [92, 110] }),
  mk('hearts-eyes', 'In love', ['in love', 'love', 'heart eyes', 'adorable', 'cute'], { colors: ['#ffd43b', '#ff4d6d'], motion: 'beat',
    art: () => [circle(100, 86, 62, { fill: '#ffd43b', ...ink(5) }), K.shine(70, 56, 7, 12, 35, 0.6), face(100, 90, 92, { eyes: 'heart', mouth: 'open' }), I.heart(160, 38, 26), I.heart(44, 40, 18, '#ff8fab')] }),
  mk('lol', 'LOL', ['lol', 'laugh', 'funny', 'ha ha', 'joke'], { colors: ['#ff922b', '#ffffff'], motion: 'shake',
    words: [{ t: 'LOL', f: 'unbounded', s: 48, c: '#ffffff', w: 6 }], base: 'bubble', baseFill: '#ff922b' }),
  mk('wait-what', 'Wait, what?', ['wait what', 'confused', 'huh', 'what', 'surprised'], { colors: ['#74c0fc', '#fa5252'], motion: 'shake',
    art: () => [critter(100, 82, 80, '#74c0fc', { arms: 'up', face: { eyes: 'dizzy', mouth: 'wavy' } }), V.loose(path('M150 30C150 16 170 16 170 30C170 40 160 40 160 50', { fill: 'none', stroke: '#fa5252', 'stroke-width': 7, 'stroke-linecap': 'round' })), V.loose(circle(160, 62, 4, { fill: '#fa5252' }))],
    words: [{ t: 'Wait, what?', f: 'fredoka', s: 24, c: '#fa5252', w: 4.5 }], at: [100, 166] })
];
module.exports = { CAT, LIST };
