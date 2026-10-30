// Food puns: snacks with faces and silly sayings (donut worry, olive you, dill with it...), for kitchens, cafes, menus
// and parties. Vinyl stickers with Blokvane's own drawings and words.
'use strict';
const K = require('./kit');
const V = require('./vinyl');
const { r, P, g, path, circle, ellipse, rect, ink, heart, roundPoly, OL } = K;
const { I } = V;
const { mascot, PROPS: X, place } = require('./mascots');
const { blob } = require('./make');

const CAT = 'Food puns';
const mk = (id, name, tags, o) => V.make({ id: 'pun-' + id, name, cat: CAT, tags: ['food', 'pun', 'funny', ...tags], ...o });
const W1 = (t, f = 'fredoka', s = 28, c = '#ffffff', o = {}) => [{ t, f, s, c, ...o }];
const fi = (fill, w = 4.5) => ({ fill, ...ink(w) });
const face = (cx, cy, s, o) => V.loose(K.face(cx, cy, s, o));

// more snacks with faces, each drawn in a 100 x 100 box
const olive = (cx, cy, s, f = { eyes: 'happy', mouth: 'smile' }, props = []) => place(cx, cy, s, [ellipse(50, 56, 34, 40, fi('#94d82d', 5)), ellipse(50, 22, 12, 8, fi('#fa5252', 3.5)), K.shine(34, 40, 4, 8, 30, 0.6), face(50, 62, 40, f), ...props]);
const lettuce = (cx, cy, s, f, props = []) => place(cx, cy, s, [path(blob(50, 56, 42, 38, 0.3), fi('#8ce99a', 5)), V.loose(path('M50 92V40M50 70Q36 60 26 48M50 64Q64 56 74 44M50 82Q32 76 20 66M50 80Q68 74 80 64', { fill: 'none', stroke: '#2f9e44', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0.55 })), path('M16 40Q24 24 36 30Q42 16 54 24Q64 14 72 28Q84 24 86 40', { fill: 'none', stroke: OL, 'stroke-width': 4, 'stroke-linecap': 'round' }), face(50, 58, 46, f), ...props]);
const nacho = (cx, cy, s, f) => place(cx, cy, s, [path(roundPoly([[50, 6], [94, 90], [6, 90]], 8), fi('#fcc419', 5)), path('M30 44Q50 36 70 44L74 54Q70 64 64 56Q60 70 54 58Q48 66 44 56Q38 64 32 54Z', fi('#ff922b', 3.5)), V.loose(circle(36, 76, 3, { fill: '#e67700' })), V.loose(circle(70, 80, 3, { fill: '#e67700' })), face(50, 70, 36, f)]);
const butter = (cx, cy, s, f) => place(cx, cy, s, [path('M10 50L28 36H90L72 50Z', fi('#fff3bf', 4.5)), path('M72 50L90 36V62L72 76Z', fi('#ffd43b', 4.5)), path('M10 50H72V76H10Z', fi('#ffe066', 4.5)), face(41, 63, 30, f)]);
const grapes = (cx, cy, s, f) => { const spots = [[30, 34], [50, 32], [70, 34], [40, 52], [60, 52], [30, 52], [70, 52], [50, 70], [38, 70], [62, 70], [50, 86]]; return place(cx, cy, s, [path('M50 26Q52 10 60 4', { fill: 'none', stroke: '#6f4e37', 'stroke-width': 5, 'stroke-linecap': 'round' }), path('M54 16Q70 4 84 14Q72 26 54 16Z', fi('#69db7c', 3.5)), ...spots.map(([x, y]) => circle(x, y, 12, fi('#9775fa', 3.5))), face(50, 56, 40, f)]); };
const grater = (cx, cy, s, f) => place(cx, cy, s, [path('M36 12H64V22H36Z', fi('#495057', 4)), path('M26 22H74L84 94H16Z', fi('#ced4da', 5)), V.loose(path('M34 34h8M54 34h8M30 46h8M50 46h8M66 46h6M28 82h8M48 82h8M64 82h8', { stroke: '#868e96', 'stroke-width': 3.5, 'stroke-linecap': 'round' })), face(50, 64, 40, f)]);
const bowl = (cx, cy, s, f) => place(cx, cy, s, [V.loose(path('M36 22Q30 14 36 6M50 22Q44 14 50 6M64 22Q58 14 64 6', { fill: 'none', stroke: '#adb5bd', 'stroke-width': 3.5, 'stroke-linecap': 'round' })), path('M8 44H92Q90 78 66 88H34Q10 78 8 44Z', fi('#ff922b', 5)), ellipse(50, 44, 42, 9, fi('#ffd8a8', 4)), rect(36, 86, 28, 8, { rx: 3, ...fi('#e8590c', 3.5) }), face(50, 64, 38, f)]);
const candy = (cx, cy, s, f) => place(cx, cy, s, [path('M24 50L4 34V66Z', fi('#ff8fab', 4)), path('M76 50L96 34V66Z', fi('#ff8fab', 4)), ellipse(50, 50, 28, 22, fi('#f783ac', 5)), V.loose(path('M34 34L46 66M50 30L60 68M64 34L68 52', { stroke: '#ffffff', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.7 })), face(50, 52, 30, f)]);
const pear = (cx, cy, s, f) => place(cx, cy, s, [path('M52 14Q54 6 60 2', { fill: 'none', stroke: '#6f4e37', 'stroke-width': 5, 'stroke-linecap': 'round' }), path('M56 12Q70 2 82 10Q70 20 56 12Z', fi('#69db7c', 3.5)),
  path('M50 14C62 14 66 26 66 36C66 44 84 52 86 70C88 86 72 96 50 96C28 96 12 86 14 70C16 52 34 44 34 36C34 26 38 14 50 14Z', fi('#c0eb75', 5)), K.shine(40, 34, 4, 9, 20, 0.6), face(50, 68, 42, f)]);
// a red headband (a tough cookie's)
const band = (y = 30) => g({}, path(`M10 ${y}Q50 ${y - 10} 90 ${y}V${y + 10}Q50 ${y}10 ${y + 10}Z`, fi('#fa5252', 3.5)), path(`M88 ${y + 4}L100 ${y - 6}M88 ${y + 8}L100 ${y + 14}`, { stroke: '#fa5252', 'stroke-width': 5, 'stroke-linecap': 'round' }));

const LIST = () => [
  mk('donut-worry', 'Donut worry!', ['donut', 'don\'t worry', 'sweet', 'dessert', 'happy'], { colors: ['#ff8fab', '#e64980'], motion: 'bob',
    art: () => [mascot('donut', 100, 72, 106, { face: { eyes: 'happy', mouth: 'grin' } }), I.sparkle(162, 34, 16)], words: [{ t: 'Donut worry!', f: 'fredoka', s: 28, c: '#e64980' }, { t: 'it will be fine', f: 'caveat', s: 20, c: '#495057' }], at: [100, 158] }),
  mk('taco-bout-it', 'Let\'s taco \'bout it', ['taco', 'talk', 'mexican', 'lunch', 'chat'], { colors: ['#ffd43b', '#e8590c'], motion: 'wiggle',
    art: () => [mascot('taco', 100, 62, 120, { face: { eyes: 'happy', mouth: 'open' } })], words: [{ t: 'Let\'s taco', f: 'fredoka', s: 26, c: '#e8590c' }, { t: '\'bout it', f: 'fredoka', s: 26, c: '#e8590c' }], at: [100, 160] }),
  mk('one-in-a-melon', 'One in a melon', ['melon', 'watermelon', 'special', 'summer', 'friend'], { colors: ['#69db7c', '#f03e3e'], motion: 'pop',
    art: () => [mascot('melon', 100, 74, 116, { face: { eyes: 'happy', mouth: 'smile' } })], words: [{ t: 'One in a', f: 'caveat', s: 24, c: '#2f9e44' }, { t: 'melon!', f: 'fredoka', s: 32, c: '#f03e3e' }], at: [100, 156] }),
  mk('nacho-average', 'Nacho average friend', ['nacho', 'chips', 'cheese', 'friend', 'snack'], { colors: ['#fcc419', '#e8590c'], motion: 'tilt',
    art: () => [nacho(100, 70, 104, { eyes: 'wink', mouth: 'grin' })], words: [{ t: 'Nacho', f: 'fredoka', s: 30, c: '#e8590c' }, { t: 'average friend', f: 'caveat', s: 24, c: '#495057' }], at: [100, 156] }),
  mk('olive-you', 'Olive you!', ['olive', 'love you', 'love', 'cute', 'couple'], { colors: ['#94d82d', '#5c940d'], motion: 'beat',
    art: () => [olive(70, 76, 80, { eyes: 'happy', mouth: 'smile' }, X.blush()), olive(132, 80, 72, { eyes: 'closed', mouth: 'kiss' }, X.blush()), I.heart(102, 30, 28)], words: W1('Olive you!', 'pacifico', 28, '#5c940d', { w: 3.5 }), at: [100, 160] }),
  mk('brew-tiful', 'Brew-tiful day', ['coffee', 'beautiful', 'morning', 'brew', 'cafe'], { colors: ['#ffffff', '#6f4e37'], motion: 'bob',
    art: () => [mascot('cup', 100, 72, 102, { face: { eyes: 'heart', mouth: 'smile' } })], words: [{ t: 'Brew-tiful', f: 'pacifico', s: 26, c: '#6f4e37', w: 3.5 }, { t: 'day!', f: 'fredoka', s: 26, c: '#6f4e37' }], at: [100, 156] }),
  mk('espresso-yourself', 'Espresso yourself', ['espresso', 'coffee', 'express yourself', 'music', 'dance'], { colors: ['#ffffff', '#6f4e37'], motion: 'wiggle',
    art: () => [mascot('cup', 96, 76, 84, { c: '#ffd8a8', face: { eyes: 'wink', mouth: 'tongue' } }), I.music(150, 40, 34), I.music(46, 34, 26, '#e64980')], words: [{ t: 'Espresso', f: 'fredoka', s: 28, c: '#6f4e37' }, { t: 'yourself!', f: 'caveat', s: 26, c: '#495057' }], at: [100, 156] }),
  mk('lettuce-celebrate', 'Lettuce celebrate!', ['lettuce', 'celebrate', 'party', 'salad', 'veggie'], { colors: ['#8ce99a', '#e64980'], motion: 'pop',
    art: () => [lettuce(100, 72, 104, { eyes: 'happy', mouth: 'open' }, [X.partyHat(70, 8, '#e64980')])], words: [{ t: 'Lettuce', f: 'fredoka', s: 28, c: '#2f9e44' }, { t: 'celebrate!', f: 'pacifico', s: 24, c: '#e64980', w: 3.5 }], at: [100, 156] }),
  mk('grate-idea', 'Grate idea!', ['grater', 'great idea', 'cheese', 'idea', 'kitchen'], { colors: ['#ced4da', '#f08c00'], motion: 'pop',
    art: () => [grater(92, 74, 100, { eyes: 'big', mouth: 'grin' }), I.bulb(150, 40, 40)], words: W1('Grate idea!', 'fredoka', 30, '#f08c00'), at: [100, 162] }),
  mk('bready-or-not', 'Bready or not!', ['bread', 'toast', 'ready', 'breakfast', 'here i come'], { colors: ['#f4c08a', '#c8875a'], motion: 'bob',
    art: () => [mascot('toast', 100, 72, 100, { face: { eyes: 'big', mouth: 'open' } })], words: [{ t: 'Bready', f: 'fredoka', s: 30, c: '#c8875a' }, { t: 'or not!', f: 'caveat', s: 26, c: '#495057' }], at: [100, 156] }),
  mk('butter-together', 'Butter together', ['butter', 'better together', 'toast', 'friends', 'love'], { colors: ['#ffe066', '#c8875a'], motion: 'wiggle',
    art: () => [mascot('toast', 74, 80, 86, { face: { eyes: 'happy', mouth: 'smile' }, props: X.blush() }), butter(138, 82, 66, { eyes: 'happy', mouth: 'smile' }), I.heart(106, 30, 24)], words: W1('Butter together', 'fredoka', 26, '#c8875a'), at: [100, 160] }),
  mk('pizza-my-heart', 'You have a pizza my heart', ['pizza', 'heart', 'love', 'slice', 'cute'], { colors: ['#ffd43b', '#f03e3e'], motion: 'beat',
    art: () => [mascot('pizza', 100, 70, 104, { face: { eyes: 'heart', mouth: 'smile' } })], words: [{ t: 'You have a pizza', f: 'fredoka', s: 20, c: '#e8590c' }, { t: 'my heart', f: 'pacifico', s: 26, c: '#f03e3e', w: 3.5 }], at: [100, 156] }),
  mk('life-is-gouda', 'Life is gouda', ['cheese', 'good', 'life', 'happy', 'gouda'], { colors: ['#ffd43b', '#f08c00'], motion: 'tilt',
    art: () => [mascot('cheese', 100, 72, 112, { face: { eyes: 'happy', mouth: 'grin' } }), I.sparkle(40, 36, 18), I.sparkle(164, 44, 14)], words: W1('Life is gouda', 'fredoka', 28, '#f08c00'), at: [100, 160] }),
  mk('dill-with-it', 'Dill with it.', ['pickle', 'deal with it', 'cool', 'sunglasses', 'sassy'], { colors: ['#8ce99a', '#2f9e44'], motion: 'none',
    art: () => [mascot('pickle', 100, 72, 112, { face: { eyes: 'shades', mouth: 'smirk' } })], words: W1('Dill with it.', 'fredoka', 30, '#2f9e44'), at: [100, 162] }),
  mk('hot-stuff', 'Hot stuff!', ['chili', 'hot', 'spicy', 'pepper', 'cool'], { colors: ['#fa5252', '#ff922b'], motion: 'shake',
    art: () => [mascot('chili', 100, 72, 114, { face: { eyes: 'wink', mouth: 'grin' } }), V.loose(path('M38 40Q30 30 38 20M162 50Q170 40 162 30', { fill: 'none', stroke: '#ff922b', 'stroke-width': 4.5, 'stroke-linecap': 'round' }))], words: W1('Hot stuff!', 'fredoka', 30, '#f03e3e'), at: [100, 162] }),
  mk('avo-good-day', 'Avo good day!', ['avocado', 'good day', 'healthy', 'green', 'morning'], { colors: ['#40c057', '#2f9e44'], motion: 'bob',
    art: () => [mascot('avocado', 100, 70, 104, { face: { eyes: 'happy', mouth: 'smile' } })], words: [{ t: 'Avo', f: 'fredoka', s: 30, c: '#2f9e44' }, { t: 'good day!', f: 'caveat', s: 26, c: '#495057' }], at: [100, 156] }),
  mk('egg-cellent', 'Egg-cellent!', ['egg', 'excellent', 'great', 'breakfast', 'praise'], { colors: ['#ffffff', '#f08c00'], motion: 'pop',
    art: () => [mascot('egg', 100, 72, 108, { face: { eyes: 'star', mouth: 'grin' } })], words: W1('Egg-cellent!', 'fredoka', 30, '#f08c00'), at: [100, 162] }),
  mk('tough-cookie', 'Tough cookie', ['cookie', 'tough', 'strong', 'brave', 'determined'], { colors: ['#e8b35a', '#fa5252'], motion: 'shake',
    art: () => [mascot('cookie', 100, 72, 104, { face: { eyes: 'line', mouth: 'smirk' }, props: [band(32)] })], words: W1('Tough cookie', 'fredoka', 28, '#c8875a'), at: [100, 160] }),
  mk('pear-fect', 'You\'re pear-fect', ['pear', 'perfect', 'fruit', 'kind', 'praise'], { colors: ['#c0eb75', '#5c940d'], motion: 'bob',
    art: () => [pear(100, 70, 104, { eyes: 'happy', mouth: 'smile' }), I.sparkle(156, 34, 18), I.sparkle(44, 52, 14)], words: [{ t: 'You\'re', f: 'caveat', s: 24, c: '#495057' }, { t: 'pear-fect!', f: 'fredoka', s: 28, c: '#5c940d' }], at: [100, 156] }),
  mk('apple-of-my-eye', 'Apple of my eye', ['apple', 'love', 'favorite', 'fruit', 'cute'], { colors: ['#fa5252', '#f03e3e'], motion: 'beat',
    art: () => [mascot('apple', 100, 70, 102, { face: { eyes: 'heart', mouth: 'smile' } })], words: [{ t: 'Apple of', f: 'fredoka', s: 24, c: '#f03e3e' }, { t: 'my eye', f: 'pacifico', s: 26, c: '#f03e3e', w: 3.5 }], at: [100, 156] }),
  mk('grape-day', 'Have a grape day!', ['grapes', 'great day', 'fruit', 'purple', 'happy'], { colors: ['#9775fa', '#7048e8'], motion: 'bob',
    art: () => [grapes(100, 70, 104, { eyes: 'happy', mouth: 'grin' })], words: [{ t: 'Have a', f: 'caveat', s: 24, c: '#495057' }, { t: 'grape day!', f: 'fredoka', s: 28, c: '#7048e8' }], at: [100, 156] }),
  mk('couch-potato', 'Couch potato mode: on', ['potato', 'couch potato', 'lazy', 'weekend', 'relax'], { colors: ['#e8b35a', '#9775fa'], motion: 'float',
    art: () => [mascot('pillow', 100, 84, 132, { face: false }), mascot('potato', 100, 60, 84, { face: { eyes: 'closed', mouth: 'smile' }, props: [X.zzz(84, 16)] })], words: [{ t: 'Couch potato', f: 'fredoka', s: 24, c: '#c8875a' }, { t: 'mode: on', f: 'caveat', s: 22, c: '#495057' }], at: [100, 166] }),
  mk('soup-er', 'Soup-er star!', ['soup', 'super star', 'star', 'praise', 'warm'], { colors: ['#ff922b', '#ffd43b'], motion: 'pop',
    art: () => [bowl(100, 72, 108, { eyes: 'star', mouth: 'grin' }), I.star(158, 34, 26), I.sparkle(40, 40, 16)], words: W1('Soup-er star!', 'fredoka', 28, '#e8590c'), at: [100, 160] }),
  mk('sweet', 'You\'re so sweet', ['candy', 'sweet', 'kind', 'thank you', 'treat'], { colors: ['#f783ac', '#e64980'], motion: 'wiggle',
    art: () => [candy(100, 70, 120, { eyes: 'happy', mouth: 'smile' })], words: [{ t: 'You\'re so', f: 'caveat', s: 24, c: '#495057' }, { t: 'sweet!', f: 'pacifico', s: 28, c: '#e64980', w: 3.5 }], at: [100, 154] }),
  mk('pun-intended', 'Pun intended', ['pun', 'joke', 'funny', 'label', 'burst'], { colors: ['#ff922b', '#ffffff'], motion: 'pulse',
    words: [{ t: 'PUN', f: 'anton', s: 36, c: '#ffffff' }, { t: 'intended', f: 'caveat', s: 26, c: '#ffffff', o: false }], base: 'burst', baseFill: '#ff922b' })
];
module.exports = { CAT, LIST };
