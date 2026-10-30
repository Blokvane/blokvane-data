// School and study: exams, homework, books, gold stars and graduation, for classrooms and study boards. Vinyl
// stickers with Blokvane's own drawings and words.
'use strict';
const K = require('./kit');
const V = require('./vinyl');
const { r, P, g, node, path, circle, ellipse, rect, line, ink, anim, star, heart, rrect, MOVES: M, OL, HL } = K;
const { I } = V;
const { mascot, PROPS: X } = require('./mascots');

const CAT = 'School and study';
const mk = (id, name, tags, o) => V.make({ id: 'school-' + id, name, cat: CAT, tags: ['school', 'study', 'class', ...tags], ...o });
const W1 = (t, f = 'fredoka', s = 28, c = '#ffffff', o = {}) => [{ t, f, s, c, ...o }];
// a sheet of paper (lined), with a grade or words on it
const paper = (cx, cy, w, h, rot = -6) => g({ transform: `rotate(${rot} ${cx} ${cy})` }, path(rrect(cx - w / 2, cy - h / 2, w, h, 6), { fill: '#ffffff', ...ink(5) }), ...[0, 1, 2, 3].map(i => path(`M${cx - w / 2 + 12} ${cy - h / 2 + 30 + i * 16}H${cx + w / 2 - 12}`, { stroke: '#a5d8ff', 'stroke-width': 2.5 })), path(`M${cx - w / 2 + 22} ${cy - h / 2 + 6}V${cy + h / 2 - 6}`, { stroke: '#ffa8a8', 'stroke-width': 2.5 }));

const LIST = () => [
  mk('study-hard', 'Study hard', ['study', 'books', 'focus', 'learn', 'reading'], { colors: ['#4dabf7', '#fa5252'], motion: 'bob',
    art: () => [mascot('book', 100, 70, 92, { face: { eyes: 'line', mouth: 'smirk' } }), path('M140 30L156 18M146 46L166 42', { stroke: '#fa5252', 'stroke-width': 5, 'stroke-linecap': 'round' })], words: W1('STUDY HARD', 'anton', 32, '#fa5252'), at: [100, 158] }),
  mk('exam-day', 'Exam day', ['exam', 'test', 'quiz', 'grade', 'a plus'], { colors: ['#ffffff', '#fa5252'], motion: 'tilt',
    art: () => [paper(96, 74, 104, 112, -6), V.label({ t: 'A+', f: 'unbounded', s: 30, c: '#fa5252', o: false, tilt: -6 }, 104, 56), I.pencil(150, 104, 56, 30)], words: W1('Exam day!', 'fredoka', 28, '#fa5252'), at: [100, 164] }),
  mk('due-today', 'Due today!', ['due today', 'deadline', 'homework', 'alarm', 'hurry'], { colors: ['#ff6b5e', '#ffd43b'], motion: 'shake',
    art: () => [I.alarm(100, 70, 92)], words: [{ t: 'DUE', f: 'anton', s: 34, c: '#ff6b5e' }, { t: 'TODAY!', f: 'anton', s: 26, c: '#ff6b5e' }], at: [100, 154] }),
  mk('homework-done', 'Homework: done!', ['homework', 'done', 'finished', 'check', 'complete'], { colors: ['#40c057', '#ffffff'], motion: 'pop',
    art: () => [paper(92, 72, 96, 108, 4), I.check(140, 96, 48)], words: [{ t: 'Homework:', f: 'caveat', s: 24, c: '#343a40', o: false }, { t: 'DONE!', f: 'anton', s: 30, c: '#40c057' }], at: [100, 158] }),
  mk('what-is-sleep', 'What is sleep?', ['sleep', 'tired', 'owl', 'late night', 'cramming'], { colors: ['#9775fa', '#ffd43b'], motion: 'float',
    art: () => [mascot('owl', 86, 72, 96, {}), mascot('cup', 148, 92, 46, { face: { eyes: 'dot', mouth: 'smile' } })], words: W1('What is sleep?', 'fredoka', 26, '#7048e8'), at: [100, 160] }),
  mk('gold-star', 'You tried!', ['gold star', 'you tried', 'effort', 'star', 'praise'], { colors: ['#ffd43b', '#e8590c'], motion: 'pop',
    art: () => [mascot('star', 100, 70, 108, { face: { eyes: 'happy', mouth: 'smile' }, props: [X.sweat(84, 24)] }), I.sparkle(34, 40, 18), I.sparkle(166, 104, 14)], words: W1('You tried!', 'caveat', 36, '#e8590c'), at: [100, 160] }),
  mk('a-plus', 'A+', ['a plus', 'grade', 'excellent', 'top marks', 'smart'], { colors: ['#fa5252', '#ffffff'], motion: 'pop',
    words: [{ t: 'A+', f: 'unbounded', s: 54, c: '#ffffff', w: 6 }], base: 'circle', baseFill: '#fa5252', baseO: { inner: '#ffffff', pad: 18 }, art: () => [I.sparkle(158, 40, 22), I.sparkle(40, 158, 18)] }),
  mk('brain-power', 'Brain power', ['brain', 'smart', 'strong', 'muscle', 'think'], { colors: ['#ffa8c5', '#4dabf7'], motion: 'bob',
    art: () => [path('M36 84H164', { stroke: OL, 'stroke-width': 9, 'stroke-linecap': 'round' }), path('M36 84H164', { stroke: '#adb5bd', 'stroke-width': 4, 'stroke-linecap': 'round' }), rect(26, 62, 18, 44, { rx: 4, fill: '#495057', ...ink(4) }), rect(156, 62, 18, 44, { rx: 4, fill: '#495057', ...ink(4) }), mascot('brain', 100, 76, 84, { face: { eyes: 'happy', mouth: 'grin' } })],
    words: W1('Brain power!', 'fredoka', 28, '#1c7ed6'), at: [100, 158] }),
  mk('need-a-nap', 'Hello, I need a nap', ['name tag', 'tired', 'nap', 'hello', 'sleepy'], { colors: ['#4dabf7', '#ffffff'], motion: 'tilt',
    art: () => [path(rrect(22, 46, 156, 108, 14), { fill: '#4dabf7', ...ink(5) }), rect(30, 92, 140, 54, { rx: 6, fill: '#ffffff' })],
    words: [{ t: 'HELLO', f: 'anton', s: 26, c: '#ffffff', o: false }, { t: 'I need a nap', f: 'caveat', s: 23, c: '#343a40', o: false, gap: 22, maxW: 124 }], at: [100, 98], extent: [14, 38, 186, 162] }),
  mk('science', 'Science!', ['science', 'lab', 'chemistry', 'experiment', 'atom'], { colors: ['#69db7c', '#4dabf7'], motion: 'pop',
    art: () => [I.atom(72, 66, 74), I.tube(132, 72, 74, '#69db7c', 18), ...[[124, 26], [136, 16], [146, 30]].map((p, i) => V.loose(anim('bu' + i, circle(p[0], p[1], 4 + i, { fill: '#d3f9d8', stroke: '#40c057', 'stroke-width': 2 }))))],
    words: W1('Science!', 'fredoka', 30, '#1c7ed6'), at: [100, 160], css: [0, 1, 2].map(i => M.fadeUp('bu' + i, 2, i * 0.6, 20)).join('') }),
  mk('math-fun', 'Math is fun (sometimes)', ['math', 'calculator', 'numbers', 'homework', 'fun'], { colors: ['#495057', '#a9e34b'], motion: 'tilt',
    art: () => [rect(64, 18, 72, 104, { rx: 12, fill: '#495057', ...ink(5) }), rect(74, 28, 52, 26, { rx: 5, fill: '#a9e34b', ...ink(3.5) }), V.loose(K.face(100, 41, 24, { eyes: 'happy', mouth: 'smile', cheeks: false })),
      ...[0, 1, 2].flatMap(i => [0, 1].map(j => rect(76 + i * 17, 64 + j * 22, 12, 14, { rx: 3, fill: i === 2 && j === 1 ? '#ff922b' : '#dee2e6', ...ink(2.5) })))],
    words: [{ t: 'Math is fun', f: 'fredoka', s: 24, c: '#495057' }, { t: '(sometimes)', f: 'caveat', s: 20, c: '#495057', o: false }], at: [100, 158] }),
  mk('bookworm', 'Bookworm', ['bookworm', 'reading', 'books', 'worm', 'library'], { colors: ['#69db7c', '#4dabf7'], motion: 'bob',
    art: () => [mascot('book', 100, 84, 96, { c: '#4dabf7', face: false }), path('M70 56Q78 36 96 44Q110 26 126 40Q134 30 142 40', { fill: 'none', ...ink(18) }), path('M70 56Q78 36 96 44Q110 26 126 40Q134 30 142 40', { fill: 'none', stroke: '#69db7c', 'stroke-width': 11, 'stroke-linecap': 'round' }),
      circle(146, 36, 13, { fill: '#69db7c', ...ink(4.5) }), circle(141, 33, 5, { fill: '#ffffff', ...ink(2) }), circle(152, 33, 5, { fill: '#ffffff', ...ink(2) }), path('M136 33H158', { stroke: OL, 'stroke-width': 2 }), circle(141, 33, 2, { fill: OL }), circle(152, 33, 2, { fill: OL })],
    words: W1('Bookworm', 'pacifico', 28, '#2f9e44', { w: 3 }), at: [100, 166] }),
  mk('library-mode', 'Shh... library mode', ['library', 'quiet', 'shh', 'reading', 'silence'], { colors: ['#845ef7', '#ffffff'], motion: 'none',
    words: [{ t: 'Shh...', f: 'caveat', s: 34, c: '#ffffff', o: false }, { t: 'LIBRARY MODE', f: 'anton', s: 22, c: '#ffd43b', o: false }], base: 'pill', baseFill: '#845ef7' }),
  mk('graduate', 'Graduate!', ['graduate', 'graduation', 'congrats', 'diploma', 'cap'], { colors: ['#3b3355', '#ffd43b'], motion: 'pop',
    art: () => [I.gradcap(100, 56, 104), g({ transform: 'rotate(-14 150 104)' }, rect(118, 94, 66, 20, { rx: 10, fill: '#fff9db', ...ink(4) }), rect(146, 92, 8, 24, { fill: '#fa5252' })), I.sparkle(36, 40, 18), I.sparkle(162, 30, 14)],
    words: W1('Graduate!', 'fredoka', 30, '#3b3355', { c: '#ffd43b', o: '#3b3355' }), at: [100, 156] }),
  mk('class-clown', 'Class clown', ['class clown', 'funny', 'silly', 'joke', 'goofy'], { colors: ['#ffd43b', '#fa5252'], motion: 'wiggle',
    art: () => [mascot('blob', 100, 74, 100, { c: '#ffd43b', face: { eyes: 'wink', mouth: 'tongue' }, props: [circle(50, 58, 8, { fill: '#fa5252', ...ink(3) }), X.partyHat(50, 4, '#fa5252')] })], words: W1('Class clown', 'fredoka', 28, '#fa5252'), at: [100, 162] }),
  mk('teachers-pet', 'Teacher\'s pet', ['teacher', 'apple', 'favorite', 'good student', 'pet'], { colors: ['#fa5252', '#69db7c'], motion: 'bob',
    art: () => [mascot('apple', 100, 70, 96, { face: { eyes: 'happy', mouth: 'smile' } }), I.heart(150, 36, 26)], words: W1('Teacher\'s pet', 'fredoka', 26, '#fa5252'), at: [100, 158] }),
  mk('group-project', 'Group project survivor', ['group project', 'teamwork', 'survivor', 'school', 'team'], { colors: ['#ff8787', '#74c0fc'], motion: 'none',
    art: () => [mascot('blob', 60, 76, 62, { c: '#ff8787', face: { eyes: 'dizzy', mouth: 'wavy' } }), mascot('blob', 100, 70, 62, { c: '#ffd43b', face: { eyes: 'line', mouth: 'flat' } }), mascot('blob', 140, 76, 62, { c: '#74c0fc', face: { eyes: 'closed', mouth: 'smile' } })],
    words: [{ t: 'Group project', f: 'fredoka', s: 22, c: '#495057' }, { t: 'SURVIVOR', f: 'anton', s: 28, c: '#fa5252' }], at: [100, 150] }),
  mk('field-trip', 'Field trip!', ['field trip', 'bus', 'school bus', 'trip', 'adventure'], { colors: ['#ffd43b', '#4dabf7'], motion: 'shake',
    art: () => [mascot('bus', 100, 70, 116, { face: { eyes: 'happy', mouth: 'open' } })], words: W1('Field trip!', 'fredoka', 30, '#1c7ed6'), at: [100, 160] }),
  mk('read-more', 'Read more books', ['read', 'books', 'reading', 'library', 'stack'], { colors: ['#4dabf7', '#ff922b'], motion: 'none',
    art: () => [rect(46, 104, 108, 22, { rx: 4, fill: '#ff922b', ...ink(4.5) }), rect(56, 82, 96, 22, { rx: 4, fill: '#69db7c', ...ink(4.5), transform: 'rotate(-3 104 93)' }), rect(50, 60, 100, 22, { rx: 4, fill: '#4dabf7', ...ink(4.5), transform: 'rotate(2 100 71)' }), mascot('book', 102, 34, 46, { c: '#fa5252', face: { eyes: 'happy', mouth: 'smile' } })],
    words: [{ t: 'Read more', f: 'fredoka', s: 24, c: '#e8590c' }, { t: 'BOOKS', f: 'anton', s: 30, c: '#1c7ed6' }], at: [100, 158] }),
  mk('smart-cookie', 'Smart cookie', ['smart cookie', 'smart', 'cookie', 'clever', 'pun'], { colors: ['#e8b35a', '#4dabf7'], motion: 'pop',
    art: () => [mascot('cookie', 100, 72, 100, { face: { eyes: 'none', mouth: 'smile' } }), g({}, circle(84, 66, 13, { fill: '#ffffff', 'fill-opacity': 0.5, ...ink(4) }), circle(116, 66, 13, { fill: '#ffffff', 'fill-opacity': 0.5, ...ink(4) }), path('M97 66H103', { stroke: OL, 'stroke-width': 4 }), circle(84, 67, 4, { fill: OL }), circle(116, 67, 4, { fill: OL }))],
    words: W1('Smart cookie', 'fredoka', 26, '#1c7ed6'), at: [100, 160] }),
  mk('pencils-ready', 'Pencils ready!', ['pencil', 'ready', 'class', 'write', 'supplies'], { colors: ['#ffd43b', '#ff8fab'], motion: 'bob',
    art: () => [I.pencil(74, 64, 82, -18), I.pencil(100, 60, 86, 0), I.pencil(126, 64, 82, 18), path(rrect(60, 74, 80, 48, 10), { fill: '#74c0fc', ...ink(5) })],
    words: W1('Pencils ready!', 'fredoka', 26, '#1c7ed6'), at: [100, 160] }),
  mk('test-tube', 'Lab day', ['lab', 'science', 'experiment', 'test tube', 'chemistry'], { colors: ['#cc5de8', '#ffffff'], motion: 'wiggle',
    art: () => [I.tube(76, 70, 92, '#cc5de8', -16), I.tube(126, 72, 86, '#69db7c', 14)], words: W1('Lab day!', 'fredoka', 30, '#9c36b5'), at: [100, 160] }),
  mk('learn-new', 'Learn something new', ['learn', 'idea', 'curious', 'book', 'light bulb'], { colors: ['#ffe066', '#4dabf7'], motion: 'pop',
    art: () => [mascot('book', 74, 84, 70, { face: { eyes: 'happy', mouth: 'open' } }), I.bulb(132, 60, 60), I.rays(132, 54, 34, 5, 10, OL, -90, 120)], words: [{ t: 'Learn something', f: 'fredoka', s: 20, c: '#1c7ed6' }, { t: 'NEW', f: 'anton', s: 28, c: '#ff922b' }], at: [100, 154] }),
  mk('recess', 'Recess!', ['recess', 'play', 'break', 'ball', 'fun'], { colors: ['#fa5252', '#ffd43b'], motion: 'bob',
    art: () => [anim('bl', circle(100, 66, 42, { fill: '#fa5252', ...ink(5) }), path('M60 56Q100 80 140 56M66 88Q100 60 134 88', { fill: 'none', stroke: '#ffffff', 'stroke-width': 5 }))], words: W1('Recess!', 'fredoka', 32, '#e8590c'), at: [100, 152], css: M.bounce('bl', 1.2, 14) })
];
module.exports = { CAT, LIST };
