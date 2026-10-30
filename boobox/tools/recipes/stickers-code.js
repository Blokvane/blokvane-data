// Code and tech: the everyday jokes of people who build software (it works on my machine, not a bug...). Vinyl
// stickers with Blokvane's own drawings and words.
'use strict';
const K = require('./kit');
const V = require('./vinyl');
const { r, P, g, node, path, circle, ellipse, rect, line, ink, anim, star, heart, rrect, MOVES: M, OL, HL } = K;
const { I } = V;
const { mascot, PROPS: X, M: MM } = require('./mascots');

const CAT = 'Code and tech';
const mk = (id, name, tags, o) => V.make({ id: 'code-' + id, name, cat: CAT, tags: ['code', 'tech', 'developer', 'programmer', ...tags], ...o });
const W1 = (t, f = 'fredoka', s = 28, c = '#ffffff', o = {}) => [{ t, f, s, c, ...o }];
const MONO = '#1b1530';
// a window of an app (title bar with three dots)
const win = (x, y, w, h, fill = '#ffffff') => [path(rrect(x, y, w, h, 10), { fill, ...ink(5) }), path(`M${x} ${y + 20}H${x + w}`, { stroke: OL, 'stroke-width': 4 }), circle(x + 14, y + 10, 4, { fill: '#fa5252' }), circle(x + 27, y + 10, 4, { fill: '#ffd43b' }), circle(x + 40, y + 10, 4, { fill: '#40c057' })];
// a key of a keyboard with words on it
const keyArt = (cx, cy, w, h, c) => I.keycap(cx, cy, w, h, c);

const LIST = () => [
  mk('works-on-my-machine', 'It works on my machine', ['works on my machine', 'bug', 'testing', 'laptop'], { colors: ['#74c0fc', '#40c057'], motion: 'bob',
    art: () => [mascot('laptop', 100, 66, 116, { face: { eyes: 'happy', mouth: 'grin' } }), I.check(160, 30, 34)], words: [{ t: 'It works on', f: 'fredoka', s: 22, c: '#1c7ed6' }, { t: 'MY MACHINE', f: 'anton', s: 28, c: '#40c057' }], at: [100, 156] }),
  mk('not-a-bug', 'Not a bug, a feature', ['bug', 'feature', 'bug or feature', 'debug'], { colors: ['#40c057', '#ffd43b'], motion: 'wiggle',
    art: () => [mascot('bug', 100, 66, 100, { face: { eyes: 'happy', mouth: 'smile' } }), I.crown(100, 18, 40)], words: [{ t: 'Not a bug.', f: 'fredoka', s: 22, c: '#2f9e44' }, { t: 'A FEATURE.', f: 'anton', s: 28, c: '#ffd43b', o: OL }], at: [100, 154] }),
  mk('no-deploy-friday', 'No deploys on Friday', ['deploy', 'friday', 'release', 'weekend', 'production'], { colors: ['#fa5252', '#ffffff'], motion: 'shake',
    art: () => [mascot('calendar', 100, 64, 92, { face: { eyes: 'big', mouth: 'o' } }), V.label({ t: 'FRI', f: 'anton', s: 16, c: '#ffffff', o: false }, 100, 41)],
    words: [{ t: 'NO DEPLOYS', f: 'anton', s: 28, c: '#fa5252' }, { t: 'on Friday', f: 'caveat', s: 24, c: '#495057', o: false }], at: [100, 152] }),
  mk('sleep-404', '404: sleep not found', ['404', 'sleep', 'tired', 'night', 'error'], { colors: ['#ffe066', '#5f3dc4'], motion: 'float',
    art: () => [mascot('moon', 100, 70, 96, { face: { eyes: 'big', mouth: 'flat' } })], words: [{ t: '404', f: 'unbounded', s: 34, c: '#ffe066', o: '#3b2a8a' }, { t: 'sleep not found', f: 'outfit', s: 18, c: '#5f3dc4', o: false }], at: [100, 154] }),
  mk('ctrl-z', 'Ctrl + Z', ['undo', 'ctrl z', 'keyboard', 'mistake', 'oops'], { colors: ['#f1f3f5', '#4dabf7'], motion: 'pop',
    art: () => [keyArt(62, 66, 78, 70), keyArt(146, 66, 62, 70), path('M102 70H112M107 65V75', { stroke: OL, 'stroke-width': 5, 'stroke-linecap': 'round' }), V.label({ t: 'Ctrl', f: 'outfit', s: 20, c: OL, o: false }, 62, 60), V.label({ t: 'Z', f: 'outfit', s: 26, c: '#4dabf7', o: false }, 146, 60)],
    words: [{ t: 'Undo, undo, undo', f: 'fredoka', s: 22, c: '#1c7ed6' }], at: [100, 150] }),
  mk('escape-plan', 'Escape plan', ['esc', 'escape', 'keyboard', 'run away', 'bye'], { colors: ['#63e6be', '#087f5b'], motion: 'shake',
    art: () => [path('M74 112L64 140M126 112L136 140', { stroke: OL, 'stroke-width': 6, 'stroke-linecap': 'round' }), ellipse(60, 142, 12, 6, { fill: OL }), ellipse(140, 142, 12, 6, { fill: OL }), keyArt(100, 76, 96, 84, '#63e6be'), path('M152 70H172M156 86H180M152 102H168', { stroke: '#adb5bd', 'stroke-width': 4, 'stroke-linecap': 'round' })],
    words: [{ t: 'Esc', f: 'outfit', s: 26, c: '#087f5b', o: false }], at: [100, 70], extent: [24, 26, 190, 186] }),
  mk('hello-world', 'Hello, world!', ['hello world', 'first program', 'hello', 'start', 'beginner'], { colors: ['#74c0fc', '#ffffff'], motion: 'bob',
    art: () => [mascot('laptop', 70, 128, 96, { face: { eyes: 'happy', mouth: 'open' } })], words: W1('Hello, world!', 'outfit', 24, '#ffffff', { o: '#1864ab' }), base: 'bubbleR', baseFill: '#4dabf7', at: [118, 50], maxW: 124 }),
  mk('coffee-to-code', 'Coffee in, code out', ['coffee', 'code', 'developer', 'caffeine', 'fuel'], { colors: ['#c8875a', '#845ef7'], motion: 'none',
    art: () => [mascot('cup', 56, 70, 72, { face: { eyes: 'happy', mouth: 'smile' } }), path('M96 70H118M110 62L120 70L110 78', { fill: 'none', stroke: OL, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })],
    words: [{ t: '{ }', f: 'outfit', s: 40, c: '#845ef7', dx: 50 }, { t: 'Coffee in, code out', f: 'fredoka', s: 20, c: '#845ef7', gap: 40, dx: 0 }], at: [100, 106], extent: [16, 30, 184, 170] }),
  mk('debugging', 'Debugging...', ['debugging', 'debug', 'bug', 'fixing', 'search'], { colors: ['#40c057', '#ff922b'], motion: 'none',
    art: () => [mascot('bug', 84, 76, 76, { face: { eyes: 'big', mouth: 'o' } }), anim('lz', I.lens(118, 66, 96))], words: W1('Debugging...', 'fredoka', 26, '#2f9e44'), at: [100, 158],
    css: '.lz{animation:lzk 3s ease-in-out infinite}@keyframes lzk{0%,100%{transform:translate(0,0)}50%{transform:translate(-14px,6px)}}' }),
  mk('push-and-hope', 'Push and hope', ['push', 'git', 'deploy', 'release', 'rocket', 'launch'], { colors: ['#e9ecef', '#ff6b5e'], motion: 'none',
    art: () => [anim('rk', g({ transform: 'rotate(35 100 66)' }, path('M100 18C122 34 130 74 120 106H80C70 74 78 34 100 18Z', { fill: '#e9ecef', ...ink(5) }), path('M100 18C110 26 116 36 119 48H81C84 36 90 26 100 18Z', { fill: '#ff6b5e', ...ink(4.5) }), circle(100, 66, 12, { fill: '#4dabf7', ...ink(4) }), path('M80 106L66 120L72 92Z', { fill: '#ff6b5e', ...ink(4) }), path('M120 106L134 120L128 92Z', { fill: '#ff6b5e', ...ink(4) }), path('M86 106Q100 140 114 106Z', { fill: '#ffa94d', ...ink(4) })))],
    words: [{ t: 'Push', f: 'fredoka', s: 26, c: '#ff6b5e' }, { t: 'and hope', f: 'caveat', s: 26, c: '#495057', o: false }], at: [100, 158], css: M.shake('rk', 0.4, 1.5) }),
  mk('localhost', 'No place like 127.0.0.1', ['localhost', 'home', '127.0.0.1', 'network', 'house'], { colors: ['#ff922b', '#4dabf7'], motion: 'none',
    art: () => [path('M46 96L100 48L154 96V146H46Z', { fill: '#ffe8cc', ...ink(5) }), path('M34 102L100 42L166 102', { fill: 'none', stroke: '#ff922b', 'stroke-width': 12, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), path('M34 102L100 42L166 102', { fill: 'none', ...ink(4) }), rect(86, 112, 28, 34, { rx: 4, fill: '#4dabf7', ...ink(4) })],
    words: [{ t: 'There\'s no place like', f: 'caveat', s: 20, c: '#495057', o: false }, { t: '127.0.0.1', f: 'outfit', s: 24, c: '#ff922b' }], at: [100, 26], extent: [16, 6, 184, 160] }),
  mk('low-wifi', 'Low Wi-Fi, high stress', ['wifi', 'internet', 'slow', 'connection', 'stress'], { colors: ['#4dabf7', '#fa5252'], motion: 'shake',
    art: () => [path('M40 76A84 84 0 0 1 160 76', { fill: 'none', stroke: '#dee2e6', 'stroke-width': 12, 'stroke-linecap': 'round' }), path('M58 94A58 58 0 0 1 142 94', { fill: 'none', stroke: '#dee2e6', 'stroke-width': 12, 'stroke-linecap': 'round' }), path('M76 112A32 32 0 0 1 124 112', { fill: 'none', stroke: '#dee2e6', 'stroke-width': 12, 'stroke-linecap': 'round' }), circle(100, 130, 9, { fill: '#4dabf7', ...ink(4) }), I.cross(150, 46, 34)],
    words: [{ t: 'Low Wi-Fi,', f: 'fredoka', s: 22, c: '#1c7ed6' }, { t: 'high stress', f: 'fredoka', s: 22, c: '#fa5252' }], at: [100, 168] }),
  mk('restart', 'Have you tried restarting?', ['restart', 'reboot', 'it support', 'help desk', 'power'], { colors: ['#40c057', '#ffffff'], motion: 'pulse',
    art: () => [circle(100, 66, 50, { fill: '#40c057', ...ink(5) }), path('M80 46A30 30 0 1 0 120 46', { fill: 'none', stroke: '#ffffff', 'stroke-width': 9, 'stroke-linecap': 'round' }), path('M100 36V66', { stroke: '#ffffff', 'stroke-width': 9, 'stroke-linecap': 'round' })],
    words: [{ t: 'Have you tried', f: 'caveat', s: 22, c: '#495057', o: false }, { t: 'RESTARTING?', f: 'anton', s: 28, c: '#2f9e44' }], at: [100, 156] }),
  mk('merge-conflict', 'Merge conflict', ['merge', 'conflict', 'git', 'branch', 'oops'], { colors: ['#845ef7', '#fa5252'], motion: 'shake',
    art: () => [path('M40 40Q70 60 92 80M160 40Q130 60 108 80M100 92V140', { fill: 'none', stroke: '#845ef7', 'stroke-width': 9, 'stroke-linecap': 'round' }), circle(40, 40, 11, { fill: '#ffffff', ...ink(4.5) }), circle(160, 40, 11, { fill: '#ffffff', ...ink(4.5) }), I.bolt(100, 86, 40, '#fa5252')],
    words: W1('Merge conflict', 'fredoka', 24, '#fa5252'), at: [100, 164] }),
  mk('code-coffee-repeat', 'Code. Coffee. Repeat.', ['code', 'coffee', 'repeat', 'loop', 'routine'], { colors: ['#845ef7', '#c8875a'], motion: 'none',
    art: () => [anim('lp', path('M60 80A40 40 0 1 1 140 80', { fill: 'none', stroke: '#845ef7', 'stroke-width': 9, 'stroke-linecap': 'round' }), path('M132 66L142 82L154 68', { fill: 'none', stroke: '#845ef7', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })), mascot('cup', 100, 80, 52, { face: { eyes: 'happy', mouth: 'smile' } })],
    words: [{ t: 'Code. Coffee.', f: 'fredoka', s: 22, c: '#845ef7' }, { t: 'REPEAT.', f: 'anton', s: 28, c: '#c8875a' }], at: [100, 156], css: '.lp{animation:lpk 3s linear infinite;transform-box:view-box;transform-origin:100px 80px}@keyframes lpk{to{transform:rotate(360deg)}}' }),
  mk('pixel-perfect', 'Pixel perfect', ['pixel', 'design', 'perfect', 'heart', 'pixel art'], { colors: ['#ff6b9a', '#ffffff'], motion: 'beat',
    art: () => { const rows = ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000']; const out = []; rows.forEach((row, y) => [...row].forEach((b, x) => { if (b === '1') out.push(rect(52 + x * 12, 26 + y * 12, 12, 12, { fill: (x + y) % 3 ? '#ff6b9a' : '#ff8fab', stroke: OL, 'stroke-width': 2 })); })); return out; },
    words: W1('Pixel perfect', 'outfit', 24, '#ff6b9a'), at: [100, 150] }),
  mk('byte-break', 'Byte-sized break', ['byte', 'break', 'cookie', 'snack', 'pun'], { colors: ['#e8b35a', '#4dabf7'], motion: 'wiggle',
    art: () => [mascot('cookie', 100, 70, 98, { face: { eyes: 'happy', mouth: 'open' } }), ...[[156, 104, 5], [166, 92, 4], [150, 118, 3.5]].map(p => circle(p[0], p[1], p[2], { fill: '#e8b35a', ...ink(2.5) }))], words: W1('Byte-sized break', 'fredoka', 22, '#1c7ed6'), at: [100, 156] }),
  mk('beep-boop', 'Beep boop!', ['robot', 'beep boop', 'ai', 'bot', 'tech'], { colors: ['#74c0fc', '#63e6be'], motion: 'bob',
    art: () => [mascot('robot', 100, 70, 104, {})], words: W1('Beep boop!', 'unbounded', 22, '#1c7ed6'), at: [100, 158] }),
  mk('always-dns', 'It\'s always DNS', ['dns', 'network', 'sysadmin', 'outage', 'it'], { colors: ['#ffd43b', '#495057'], motion: 'none',
    words: [{ t: 'IT\'S ALWAYS', f: 'anton', s: 22, c: OL, o: false }, { t: 'DNS', f: 'unbounded', s: 40, c: OL, o: false }], base: 'warn', baseFill: '#ffd43b', baseO: { pad: 10 }, at: [100, 112] }),
  mk('ship-it', 'Ship it!', ['ship it', 'release', 'launch', 'deploy', 'done'], { colors: ['#4dabf7', '#ffffff'], motion: 'swing',
    art: () => [path('M30 106H170L150 140H50Z', { fill: '#fa5252', ...ink(5) }), path('M44 120Q100 128 156 120', { fill: 'none', stroke: '#ffffff', 'stroke-width': 4 }), path('M100 106V30', { stroke: OL, 'stroke-width': 6 }), path('M100 34L146 92H100Z', { fill: '#ffffff', ...ink(4.5) }), path('M96 40L60 92H96Z', { fill: '#e7f5ff', ...ink(4.5) }), path('M20 150Q40 140 60 150T100 150T140 150T180 150', { fill: 'none', stroke: '#4dabf7', 'stroke-width': 6, 'stroke-linecap': 'round' })],
    words: W1('Ship it!', 'fredoka', 28, '#1c7ed6'), at: [100, 176] }),
  mk('dark-mode', 'Dark mode', ['dark mode', 'night', 'theme', 'moon', 'cool'], { colors: ['#495057', '#ffe066'], motion: 'float',
    art: () => [mascot('moon', 100, 70, 100, { face: { eyes: 'none', mouth: 'smirk' }, props: [X.shades(50, 0.6)] }), I.sparkle(40, 40, 16, '#ffffff'), I.sparkle(160, 104, 14, '#ffffff')],
    words: W1('Dark mode', 'unbounded', 22, '#ffe066', { o: '#212529' }), at: [100, 158] }),
  mk('infinite-loop', 'Infinite loop', ['infinite', 'loop', 'bug', 'forever', 'again'], { colors: ['#20c997', '#087f5b'], motion: 'none',
    art: () => [path('M100 70C80 40 40 40 40 70C40 100 80 100 100 70C120 40 160 40 160 70C160 100 120 100 100 70Z', { fill: 'none', ...ink(18) }), anim('ifl', path('M100 70C80 40 40 40 40 70C40 100 80 100 100 70C120 40 160 40 160 70C160 100 120 100 100 70Z', { fill: 'none', stroke: '#20c997', 'stroke-width': 10, 'stroke-dasharray': '30 12' }))],
    words: W1('Infinite loop', 'fredoka', 24, '#087f5b'), at: [100, 150], css: '.ifl path{animation:iflk 1.6s linear infinite}@keyframes iflk{to{stroke-dashoffset:-42}}' }),
  mk('syntax-coffee', 'Syntax error: need coffee', ['syntax error', 'error', 'coffee', 'tired', 'bug'], { colors: ['#fa5252', '#c8875a'], motion: 'shake',
    art: () => [...win(28, 30, 144, 92), mascot('cup', 100, 86, 50, { face: { eyes: 'cross', mouth: 'flat' } })], words: [{ t: 'SYNTAX ERROR', f: 'outfit', s: 20, c: '#fa5252' }, { t: 'need coffee', f: 'caveat', s: 24, c: '#495057', o: false }], at: [100, 156] }),
  mk('binary', '1 + 1 = 10', ['binary', 'math', 'nerd', 'numbers', 'computer'], { colors: ['#40c057', '#212529'], motion: 'none',
    words: [{ t: '1 + 1 = 10', f: 'unbounded', s: 26, c: '#69db7c', o: false }, { t: 'in binary, anyway', f: 'outfit5', s: 16, c: '#ced4da', o: false }], base: 'box', baseFill: '#212529', baseO: { pad: 16 } }),
  mk('lgtm', 'Looks good to me', ['lgtm', 'approved', 'review', 'pull request', 'stamp'], { colors: ['#2f9e44', '#ebfbee'], motion: 'pulse',
    words: [{ t: 'LGTM', f: 'alfa', s: 40, c: '#2f9e44', o: false, tilt: -8 }, { t: 'looks good to me', f: 'caveat', s: 18, c: '#2f9e44', o: false, tilt: -8 }], base: 'circle', baseFill: '#ebfbee', baseO: { ol: '#2f9e44', ow: 7, inner: '#2f9e44' } }),
  mk('copy-paste', 'Copy. Paste. Hope.', ['copy paste', 'ctrl c', 'ctrl v', 'shortcut', 'code'], { colors: ['#f1f3f5', '#845ef7'], motion: 'bob',
    art: () => [keyArt(60, 66, 64, 60), keyArt(140, 66, 64, 60), V.label({ t: 'C', f: 'outfit', s: 28, c: '#845ef7', o: false }, 60, 61), V.label({ t: 'V', f: 'outfit', s: 28, c: '#845ef7', o: false }, 140, 61)],
    words: [{ t: 'Copy. Paste. Hope.', f: 'fredoka', s: 22, c: '#845ef7' }], at: [100, 146] }),
  mk('save-often', 'Save often!', ['save', 'floppy', 'backup', 'ctrl s', 'retro'], { colors: ['#4dabf7', '#ffffff'], motion: 'pop',
    art: () => [path('M46 24H136L154 42V140Q154 148 146 148H54Q46 148 46 140Z', { fill: '#4dabf7', ...ink(5) }), rect(68, 24, 56, 34, { rx: 3, fill: '#dee2e6', ...ink(4) }), rect(104, 30, 12, 22, { fill: '#495057' }), rect(62, 86, 76, 54, { rx: 4, fill: '#ffffff', ...ink(4) }), V.loose(K.face(100, 110, 40, { eyes: 'happy', mouth: 'smile', cheeks: false }))],
    words: W1('Save often!', 'fredoka', 24, '#1c7ed6'), at: [100, 172] }),
  mk('todo-later', 'TODO: later', ['todo', 'later', 'procrastinate', 'note', 'comment'], { colors: ['#fff3bf', '#495057'], motion: 'tilt',
    words: [{ t: '// TODO:', f: 'outfit', s: 24, c: '#2f9e44', o: false }, { t: 'later', f: 'caveat', s: 32, c: '#343a40', o: false }], base: 'card', baseFill: '#fff3bf', baseO: { pad: 18 }, art: () => [I.tape(100, 52, 60, 16, '#a5d8ff', 4)] }),
  mk('cloud-dreamer', 'Head in the cloud', ['cloud', 'cloud computing', 'dreamer', 'server', 'sky'], { colors: ['#ffffff', '#4dabf7'], motion: 'float',
    art: () => [mascot('cloud', 100, 70, 120, { face: { eyes: 'closed', mouth: 'smile' } })], words: W1('Head in the cloud', 'fredoka', 22, '#1c7ed6'), at: [100, 156] })
];
module.exports = { CAT, LIST };
