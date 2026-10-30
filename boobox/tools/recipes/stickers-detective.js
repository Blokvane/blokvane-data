// Detective and mystery: clues, case files, secret stamps and a fedora, for escape rooms, game nights and mystery
// parties. Vinyl stickers with Blokvane's own drawings and words.
'use strict';
const K = require('./kit');
const V = require('./vinyl');
const { r, P, g, node, path, circle, ellipse, rect, line, ink, anim, star, heart, rrect, roundPoly, MOVES: M, OL, HL } = K;
const { I } = V;
const { mascot, PROPS: X } = require('./mascots');

const CAT = 'Detective and mystery';
const mk = (id, name, tags, o) => V.make({ id: 'mystery-' + id, name, cat: CAT, tags: ['detective', 'mystery', 'clue', ...tags], ...o });
const W1 = (t, f = 'fredoka', s = 28, c = '#ffffff', o = {}) => [{ t, f, s, c, ...o }];
const stamp = (t, c, tilt = -10, s = 30) => ({ words: [{ t, f: 'alfa', s, c, o: false, tilt }], base: 'box', baseFill: '#ffffff', baseO: { ol: c, ow: 7, inner: c, pad: 14 } });
// a strip of yellow caution tape across the sticker
const tape = (y, rot, text) => g({ transform: `rotate(${rot} 100 ${y})` }, rect(-10, y - 16, 220, 32, { fill: '#ffd43b', ...ink(4.5) }), ...Array.from({ length: 12 }, (_, i) => path(`M${-10 + i * 20} ${y + 15}L${4 + i * 20} ${y - 15}`, { stroke: OL, 'stroke-width': 6, opacity: 0.85 })));

const LIST = () => [
  mk('case-closed', 'Case closed', ['case closed', 'solved', 'done', 'stamp', 'folder'], { colors: ['#ffc93a', '#e03131'], motion: 'pulse',
    art: () => [I.folder(100, 82, 140, '#ffc93a'), V.label({ t: 'CASE CLOSED', f: 'alfa', s: 22, c: '#e03131', o: false, tilt: -10 }, 100, 92), path(rrect(36, 72, 128, 40, 6), { fill: 'none', stroke: '#e03131', 'stroke-width': 5, transform: 'rotate(-10 100 92)' })] }),
  mk('top-secret', 'Top secret', ['top secret', 'secret', 'classified', 'stamp', 'spy'], { colors: ['#e03131'], motion: 'pulse', ...stamp('TOP SECRET', '#e03131', -10, 30) }),
  mk('confidential', 'Confidential', ['confidential', 'private', 'secret', 'stamp', 'files'], { colors: ['#1c7ed6'], motion: 'pulse', ...stamp('CONFIDENTIAL', '#1c7ed6', 5, 20) }),
  mk('clue', 'Clue!', ['clue', 'found', 'magnifying glass', 'search', 'investigate'], { colors: ['#ff922b', '#d0ebff'], motion: 'pop',
    art: () => [I.lens(96, 70, 112), I.sparkle(150, 32, 22)], words: W1('Clue!', 'fredoka', 34, '#ff922b'), at: [100, 160] }),
  mk('who-did-it', 'Who did it?', ['who did it', 'whodunit', 'mystery', 'suspect', 'question'], { colors: ['#495057', '#fa5252'], motion: 'none',
    art: () => [I.shoe(52, 92, 52, '#495057', -14, true), I.shoe(92, 62, 52, '#495057', 10), I.shoe(132, 86, 52, '#495057', -8, true), V.loose(path('M160 20C160 6 180 6 180 20C180 30 170 30 170 40', { fill: 'none', stroke: '#fa5252', 'stroke-width': 7, 'stroke-linecap': 'round' })), V.loose(circle(170, 52, 4.5, { fill: '#fa5252' }))],
    words: W1('Who did it?', 'fredoka', 30, '#fa5252'), at: [100, 150] }),
  mk('mystery-solved', 'Mystery solved', ['solved', 'mystery solved', 'done', 'found', 'answer'], { colors: ['#40c057', '#ff922b'], motion: 'pop',
    art: () => [I.lens(90, 66, 96), I.check(148, 92, 42)], words: [{ t: 'Mystery', f: 'playfairi', s: 26, c: '#343a40', o: false }, { t: 'SOLVED!', f: 'anton', s: 30, c: '#40c057' }], at: [100, 156] }),
  mk('evidence', 'Evidence', ['evidence', 'fingerprint', 'proof', 'crime scene', 'tag'], { colors: ['#e03131', '#ffffff'], motion: 'tilt',
    art: () => [I.print(100, 70, 104, '#e03131')], words: [{ t: 'EVIDENCE', f: 'anton', s: 28, c: '#ffffff', o: false }], base: 'tag', baseFill: '#e03131', at: [96, 152] }),
  mk('detective', 'Detective mode', ['detective', 'sleuth', 'investigator', 'hat', 'magnifier'], { colors: ['#c8875a', '#6f4e37'], motion: 'bob',
    art: () => [mascot('blob', 100, 84, 100, { c: '#f4c08a', face: { eyes: 'line', mouth: 'smirk' }, props: [X.fedora(14, '#6f4e37'), path('M38 66Q50 60 62 66', { fill: 'none', stroke: '#6f4e37', 'stroke-width': 4 })] }), I.lens(150, 120, 54)],
    words: W1('Detective mode', 'fredoka', 24, '#6f4e37'), at: [100, 172] }),
  mk('do-not-cross', 'Do not cross', ['do not cross', 'caution', 'tape', 'crime scene', 'keep out'], { colors: ['#ffd43b', '#2b2346'], motion: 'none',
    art: () => [tape(70, -10), tape(130, 8)], extent: [0, 40, 200, 160], words: [{ t: 'DO NOT CROSS', f: 'anton', s: 20, c: '#ffffff', o: false }], base: 'box', baseFill: OL, baseO: { pad: 8, ol: OL }, at: [100, 100] }),
  mk('wanted-coffee', 'Wanted: more coffee', ['wanted', 'poster', 'coffee', 'western', 'funny'], { colors: ['#f1e3c6', '#6f4e37'], motion: 'tilt',
    art: () => [path(rrect(38, 14, 124, 172, 6), { fill: '#f1e3c6', ...ink(5) }), V.label({ t: 'WANTED', f: 'alfa', s: 22, c: '#6f4e37', o: false }, 100, 36), mascot('cup', 100, 92, 70, { face: { eyes: 'big', mouth: 'smirk' } }), V.label([{ t: 'MORE COFFEE', f: 'anton', s: 16, c: '#6f4e37', o: false }, { t: 'reward: 1 nap', f: 'caveat', s: 15, c: '#6f4e37', o: false }], 100, 156, 104)] }),
  mk('secret-agent', 'Secret agent', ['secret agent', 'spy', 'agent', 'sunglasses', 'cool'], { colors: ['#343a40', '#ffffff'], motion: 'none',
    art: () => [mascot('blob', 100, 76, 104, { c: '#ced4da', face: { eyes: 'none', mouth: 'flat' }, props: [X.shades(50), path('M86 68Q96 80 92 92', { fill: 'none', stroke: OL, 'stroke-width': 3 }), circle(86, 64, 4, { fill: OL })] })],
    words: W1('Secret agent', 'outfit', 24, '#343a40'), at: [100, 160] }),
  mk('suspicious', 'Suspicious...', ['suspicious', 'side eye', 'hmm', 'watching', 'eyes'], { colors: ['#ffffff', '#845ef7'], motion: 'none',
    art: () => [anim('ey', I.eyes(100, 70, 118, 1))], words: W1('Suspicious...', 'playfairi', 28, '#845ef7'), at: [100, 148], css: M.slideX('ey', 3, 6) }),
  mk('breaking-news', 'Extra! Extra!', ['news', 'newspaper', 'breaking news', 'headline', 'extra'], { colors: ['#f8f9fa', '#212529'], motion: 'tilt',
    art: () => [path(rrect(30, 22, 140, 150, 6), { fill: '#f8f9fa', ...ink(5) }), V.label({ t: 'EXTRA! EXTRA!', f: 'alfa', s: 18, c: '#212529', o: false }, 100, 44), path('M40 58H160', { stroke: OL, 'stroke-width': 3 }), rect(42, 68, 52, 40, { fill: '#ced4da', ...ink(3) }), ...[0, 1, 2, 3].map(i => path(`M104 ${72 + i * 11}H156`, { stroke: '#868e96', 'stroke-width': 4 })), ...[0, 1, 2].map(i => path(`M44 ${122 + i * 13}H156`, { stroke: '#868e96', 'stroke-width': 4 }))] }),
  mk('plot-thickens', 'The plot thickens', ['plot thickens', 'mystery', 'story', 'book', 'twist'], { colors: ['#5f3dc4', '#ffd43b'], motion: 'none',
    art: () => [mascot('book', 100, 70, 92, { c: '#5f3dc4', face: { eyes: 'line', mouth: 'smirk' } }), I.swirl(156, 36, 30, '#ffd43b')], words: [{ t: 'The plot', f: 'playfairi', s: 24, c: '#5f3dc4' }, { t: 'thickens...', f: 'playfairi', s: 24, c: '#5f3dc4' }], at: [100, 158] }),
  mk('locked', 'Locked', ['lock', 'locked', 'secure', 'escape room', 'key'], { colors: ['#ffc93a', '#495057'], motion: 'shake',
    art: () => [path('M70 70V52A30 30 0 0 1 130 52V70', { fill: 'none', ...ink(16) }), path('M70 70V52A30 30 0 0 1 130 52V70', { fill: 'none', stroke: '#adb5bd', 'stroke-width': 8 }), path(rrect(54, 68, 92, 72, 14), { fill: '#ffc93a', ...ink(5) }), V.loose(K.face(100, 100, 40, { eyes: 'line', mouth: 'flat', cheeks: false }))],
    words: W1('Locked!', 'fredoka', 28, '#495057'), at: [100, 166] }),
  mk('treasure-map', 'X marks the spot', ['map', 'treasure', 'x marks the spot', 'hunt', 'clue'], { colors: ['#f1e3c6', '#e03131'], motion: 'none',
    art: () => [path('M24 40L66 26L110 42L176 24V154L110 170L66 154L24 168Z', { fill: '#f1e3c6', ...ink(5) }), path('M66 26V154M110 42V170', { stroke: OL, 'stroke-width': 3, opacity: 0.4 }), path('M40 140Q60 110 80 120T120 96', { fill: 'none', stroke: '#868e96', 'stroke-width': 4, 'stroke-dasharray': '8 7', 'stroke-linecap': 'round' }), path('M126 80L148 102M148 80L126 102', { stroke: '#e03131', 'stroke-width': 9, 'stroke-linecap': 'round' })] }),
  mk('case-file', 'Case file', ['case file', 'folder', 'files', 'investigation', 'report'], { colors: ['#ffc93a', '#495057'], motion: 'tilt',
    art: () => [I.folder(100, 74, 128, '#e8a400'), g({ transform: 'rotate(-4 100 62)' }, rect(54, 40, 92, 50, { rx: 3, fill: '#ffffff', ...ink(4) }), rect(62, 47, 24, 28, { fill: '#ced4da' }), path('M94 51H136M94 61H128M94 71H134', { stroke: '#adb5bd', 'stroke-width': 3.5 })), I.clip(138, 36, 38)],
    words: [{ t: 'CASE FILE', f: 'anton', s: 28, c: '#495057' }], at: [100, 160] }),
  mk('sealed', 'Sealed', ['sealed', 'letter', 'envelope', 'secret', 'wax seal'], { colors: ['#f1e3c6', '#c92a2a'], motion: 'pop',
    art: () => [rect(26, 50, 148, 100, { rx: 8, fill: '#f1e3c6', ...ink(5) }), path('M28 56L100 108L172 56', { fill: 'none', ...ink(4.5) }), path(K.scallop(100, 108, 22, 12, 0.08), { fill: '#c92a2a', ...ink(4) }), circle(100, 108, 13, { fill: 'none', stroke: '#ff8787', 'stroke-width': 2.5 })], words: W1('Keep it secret', 'caveat', 26, '#c92a2a', { o: false }), at: [100, 172] }),
  mk('night-watch', 'Night shift', ['night', 'flashlight', 'watch', 'search', 'dark'], { colors: ['#212529', '#ffe066'], motion: 'none',
    art: () => [V.loose(path('M96 96L176 44V148Z', { fill: '#ffe066', opacity: 0.35 })), g({ transform: 'rotate(-30 70 110)' }, rect(36, 98, 54, 26, { rx: 6, fill: '#495057', ...ink(4.5) }), rect(88, 92, 14, 38, { rx: 4, fill: '#868e96', ...ink(4.5) })), mascot('moon', 46, 46, 50, { face: { eyes: 'closed', mouth: 'smile' } })],
    words: W1('Night shift', 'fredoka', 26, '#ffe066', { o: '#212529' }), at: [100, 172] }),
  mk('binoculars', 'I see you', ['binoculars', 'spy', 'watching', 'look', 'see'], { colors: ['#495057', '#74c0fc'], motion: 'bob',
    art: () => [circle(68, 76, 30, { fill: '#495057', ...ink(5) }), circle(132, 76, 30, { fill: '#495057', ...ink(5) }), rect(84, 56, 32, 24, { rx: 6, fill: '#343a40', ...ink(4.5) }), circle(68, 76, 18, { fill: '#74c0fc', ...ink(3.5) }), circle(132, 76, 18, { fill: '#74c0fc', ...ink(3.5) }), K.shine(62, 70, 4, 7, 30, 0.8), K.shine(126, 70, 4, 7, 30, 0.8)],
    words: W1('I see you!', 'fredoka', 28, '#495057'), at: [100, 148] }),
  mk('elementary', 'Elementary!', ['elementary', 'smart', 'solved', 'easy', 'obvious'], { colors: ['#6f4e37', '#f1e3c6'], motion: 'pop',
    art: () => [I.lens(96, 68, 112), V.loose(K.face(85, 57, 40, { eyes: 'happy', mouth: 'grin', cheeks: true }))], words: [{ t: 'Elementary!', f: 'playfairi', s: 30, c: '#6f4e37' }], at: [100, 160] }),
  mk('suspect', 'Prime suspect', ['suspect', 'guilty', 'mug shot', 'funny', 'cat'], { colors: ['#ced4da', '#495057'], motion: 'tilt',
    art: () => [rect(32, 20, 136, 140, { rx: 8, fill: '#e9ecef', ...ink(5) }), ...[0, 1, 2, 3].map(i => path(`M32 ${44 + i * 28}H48`, { stroke: '#868e96', 'stroke-width': 3 })), mascot('cat', 104, 82, 84, { c: '#ffa94d', face: { eyes: 'line', mouth: 'flat' } }), rect(52, 120, 104, 26, { rx: 4, fill: '#212529' }), V.label({ t: 'SUSPECT #9', f: 'outfit', s: 13, c: '#ffffff', o: false }, 104, 133, 92)] })
];
module.exports = { CAT, LIST };
