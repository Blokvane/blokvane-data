// Arrows and bubbles: arrows that point, bounce and draw themselves, marker circles and underlines, and speech
// bubbles with a word in them (Blokvane's own drawings).
'use strict';
const K = require('./kit');
const T = require('./text');
const { r, P, at, g, node, path, circle, ellipse, rect, line, poly, pline, ink, fillInk, anim, heart, star, roundPoly, scallop, cloud, rrect, bubble, MOVES: M, OL, HL, SH } = K;
const { blob, egg, smooth, curve, ring, drop, leaf, body, part, X, face, make } = require('./make');

const CAT = 'Arrows and bubbles';
const W = (text, o) => T.words(text, o).d;
const mk = (id, name, tags, o) => make({ id, name, cat: CAT, tags, body: o.body, behind: o.behind, front: o.front, extra: o.extra, motion: o.motion || 'none', css: o.css, colors: o.colors, ground: o.ground === undefined ? false : o.ground });
// a chunky arrow pointing right (turned for the other ways)
const ARROW = 'M24 82H104V48L176 100L104 152V118H24Z';
const chunky = (fill, rot = 0) => path(roundPoly([[24, 80], [104, 80], [104, 46], [178, 100], [104, 154], [104, 120], [24, 120]], 8), { ...fillInk(fill), transform: rot ? `rotate(${rot} 100 100)` : undefined });
const stroke2 = (d, col, w = 12, extra) => [path(d, { fill: 'none', ...ink(w + 9) }), path(d, { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra })];
const head = (x, y, ang, col, s = 20) => { const p1 = at(x, y, s, ang + 150), p2 = at(x, y, s, ang - 150); return path(roundPoly([[x + Math.cos(ang * Math.PI / 180) * s * 0.4, y + Math.sin(ang * Math.PI / 180) * s * 0.4], p1, p2], 3), fillInk(col, 4.5)); };
// marker lines that draw themselves
const marker = (d, col, len, w = 12) => anim('dr', path(d, { fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
const word = (t, font, size, cx, cy, maxW, fill = OL) => path(W(t, { font, size, cx, cy, maxW }), { fill });
// speech bubbles
const SAY = bubble(22, 40, 156, 104, 30, 'left');
const sayBox = (fill, d = SAY) => path(d, fillInk(fill));
const thinkD = 'M48 132C24 132 18 104 36 94C24 72 48 52 68 62C76 40 112 36 124 56C144 42 172 56 168 80C190 88 186 120 162 122C162 140 134 146 124 134C112 148 86 146 80 132C70 140 54 140 48 132Z';
const shoutD = (() => {
  // a spiky shout with a short spike for a tail at the bottom left
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = i * 15 - 90, rr = i % 2 ? 62 : 84, p = at(100, 92, rr, a);
    pts.push([100 + (p[0] - 100) * 1.14, p[1]]);
    if (i === 13) pts.push([40, 178]);
  }
  return 'M' + pts.map(p => P(p[0], p[1])).join('L') + 'Z';
})();

const LIST = () => [
  // ---------- arrows
  mk('arrow-right', 'Arrow right', ['arrow', 'right', 'next', 'this way', 'direction'], { colors: ['#ff6b5e'], body: [anim('ar', chunky('#ff6b5e'))], css: M.slideX('ar', 1.2, 12) }),
  mk('arrow-left', 'Arrow left', ['arrow', 'left', 'back', 'this way', 'direction'], { colors: ['#4dabf7'], body: [anim('ar', chunky('#4dabf7', 180))], css: M.slideX('ar', 1.2, -12) }),
  mk('arrow-up', 'Arrow up', ['arrow', 'up', 'top', 'rise', 'direction', 'upstairs'], { colors: ['#51cf66'], body: [anim('ar', chunky('#51cf66', -90))], css: M.slideY('ar', 1.2, -12) }),
  mk('arrow-down', 'Arrow down', ['arrow', 'down', 'below', 'look', 'scroll', 'downstairs'], { colors: ['#ffd43b'], body: [anim('ar', chunky('#ffd43b', 90))], css: M.slideY('ar', 1, 14) }),
  mk('arrow-curved', 'Curved arrow', ['arrow', 'curved', 'swoosh', 'point', 'look', 'doodle'], { colors: ['#845ef7'], ground: false,
    body: [anim('ar', ...stroke2('M30 150C40 80 100 50 156 74', '#845ef7', 11), head(158, 76, 24, '#845ef7', 26))], css: M.wiggle('ar', 2, 4) }),
  mk('arrow-loop', 'Loopy arrow', ['arrow', 'loop', 'doodle', 'hand drawn', 'fun', 'point'], { colors: ['#ff6b9a'],
    body: [marker('M24 150C50 140 70 110 66 84C62 60 40 66 46 88C54 112 96 116 124 96C140 84 150 70 160 56', '#ff6b9a', 360, 9), anim('hd', path('M144 52L162 54L160 72', { fill: 'none', stroke: '#ff6b9a', 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }))],
    css: '.dr{stroke-dasharray:300;animation:drk 2.6s ease-in-out infinite}@keyframes drk{0%{stroke-dashoffset:300}55%,90%{stroke-dashoffset:0}100%{stroke-dashoffset:0;opacity:0}}.hd{animation:hdk 2.6s ease-in-out infinite}@keyframes hdk{0%,50%{opacity:0}58%,90%{opacity:1}100%{opacity:0}}' }),
  mk('arrow-double', 'Two-way arrow', ['arrow', 'both ways', 'swap', 'exchange', 'two way'], { colors: ['#20c997'],
    body: [anim('ar', path(roundPoly([[18, 100], [62, 54], [62, 82], [138, 82], [138, 54], [182, 100], [138, 146], [138, 118], [62, 118], [62, 146]], 7), fillInk('#20c997')))], css: '.ar{animation:ark 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ark{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.88)}}' }),
  mk('arrow-refresh', 'Round arrows', ['arrows', 'refresh', 'repeat', 'again', 'recycle', 'reload', 'circle'], { colors: ['#4dabf7', '#ff922b'],
    body: [anim('rf', ...stroke2('M42 92A60 60 0 0 1 150 66', '#4dabf7', 14), head(152, 68, 40, '#4dabf7', 26), ...stroke2('M158 108A60 60 0 0 1 50 134', '#ff922b', 14), head(48, 132, 220, '#ff922b', 26))], css: M.spin('rf', 3) }),
  mk('arrow-chevrons', 'Chevrons', ['arrows', 'chevrons', 'next', 'go', 'fast', 'forward'], { colors: ['#ff6b5e', '#ffa94d', '#ffd43b'],
    body: [['#ffd43b', 40, 'c1'], ['#ffa94d', 84, 'c2'], ['#ff6b5e', 128, 'c3']].map(([c, x, cls]) => anim(cls, path(roundPoly([[x, 52], [x + 26, 52], [x + 58, 100], [x + 26, 148], [x, 148], [x + 32, 100]], 4), fillInk(c, 4.5)))),
    css: [1, 2, 3].map(i => `.c${i}{animation:c${i}k 1.2s ease-in-out ${r(i * 0.2)}s infinite}@keyframes c${i}k{0%,100%{opacity:.35;transform:translateX(0)}40%{opacity:1;transform:translateX(6px)}}`).join('') }),
  mk('arrow-zigzag', 'Zigzag arrow', ['arrow', 'zigzag', 'energy', 'fast', 'doodle'], { colors: ['#cc5de8'],
    body: [anim('ar', ...stroke2('M20 140L56 92L84 128L116 76L140 108L170 60', '#cc5de8', 11), head(172, 58, -58, '#cc5de8', 26))], css: '.ar{animation:ark 1.4s ease-in-out infinite}@keyframes ark{0%,100%{transform:translate(0,0)}50%{transform:translate(6px,-6px)}}' }),
  mk('arrow-pointer', 'Click here', ['pointer', 'cursor', 'click', 'mouse', 'click here', 'tap'], { colors: ['#ffffff', '#4dabf7'],
    body: [g({ class: 'rp' }, circle(70, 70, 30, { fill: 'none', stroke: '#4dabf7', 'stroke-width': 5 })), anim('pt', path('M70 70L72 168L96 144L116 186L136 176L116 136L150 134Z', fillInk('#ffffff', 6)))],
    css: '.rp{animation:rpk 1.4s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes rpk{0%{transform:scale(.3);opacity:1}100%{transform:scale(1.4);opacity:0}}.pt{animation:ptk 1.4s ease-in-out infinite;transform-box:fill-box;transform-origin:0% 0%}@keyframes ptk{0%,100%{transform:scale(1)}10%{transform:scale(.9)}20%{transform:scale(1)}}' }),
  mk('arrow-signpost', 'Signpost', ['signpost', 'directions', 'this way', 'sign', 'way', 'wood'], { colors: ['#c8875a', '#8b5e3c'], ground: [100, 186, 40],
    body: [rect(92, 30, 16, 156, { rx: 4, ...fillInk('#8b5e3c', 4.5) }), anim('s1', path('M30 44H150L172 64L150 84H30Z', fillInk('#c8875a', 4.5)), path('M44 58H128M44 70H110', { stroke: '#8b5e3c', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.6 })),
      anim('s2', path('M170 98H50L28 118L50 138H170Z', fillInk('#e0a96d', 4.5)), path('M70 112H154M88 124H154', { stroke: '#8b5e3c', 'stroke-width': 4, 'stroke-linecap': 'round', opacity: 0.6 }))],
    css: M.wiggle('s1', 2.6, 2) + M.wiggle('s2', 2.6, 2).replace('infinite', 'infinite reverse') }),
  mk('arrow-turn', 'Turn arrow', ['arrow', 'turn', 'bend', 'corner', 'direction', 'up'], { colors: ['#ff922b'],
    body: [anim('ar', ...stroke2('M50 176V120Q50 76 94 76H136', '#ff922b', 22), head(150, 76, 0, '#ff922b', 34))], css: M.slideX('ar', 1.4, 6) }),
  mk('marker-circle', 'Marker circle', ['circle', 'highlight', 'marker', 'look', 'note', 'doodle'], { colors: ['#ff4d4d'],
    body: [marker('M60 54C100 34 166 50 172 92C178 134 120 164 74 154C30 144 24 98 52 72C70 56 98 48 130 52', '#ff4d4d', 420, 8)],
    css: '.dr{stroke-dasharray:440;animation:drk 2.4s ease-in-out infinite}@keyframes drk{0%{stroke-dashoffset:440}50%,90%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}' }),
  mk('marker-underline', 'Marker underline', ['underline', 'highlight', 'marker', 'swoosh', 'important'], { colors: ['#ffd43b'],
    body: [marker('M20 120C60 104 110 104 180 112M40 140C80 128 120 128 160 134', '#ffd43b', 300, 12)],
    css: '.dr{stroke-dasharray:330;animation:drk 2.2s ease-in-out infinite}@keyframes drk{0%{stroke-dashoffset:330}55%,90%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}' }),
  mk('arrow-next', 'Next button', ['next', 'arrow', 'go', 'button', 'continue', 'play'], { colors: ['#4dabf7', '#ffffff'],
    body: [anim('bt', circle(100, 100, 70, fillInk('#4dabf7')), path(roundPoly([[80, 62], [138, 100], [80, 138]], 8), fillInk('#ffffff', 5)), K.shine(66, 70, 6, 12, 40, 0.5))], css: M.pulse('bt', 1.4, 1.06),
    extra: () => ({ n: [g({ class: 'rg' }, circle(100, 100, 74, { fill: 'none', stroke: '#4dabf7', 'stroke-width': 4 }))], css: '.rg{animation:rgk 1.4s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes rgk{0%{transform:scale(.95);opacity:.8}100%{transform:scale(1.25);opacity:0}}' }) }),
  mk('arrow-here', 'Here!', ['here', 'arrow', 'look', 'this', 'point', 'words'], { colors: ['#ff6b5e', '#2b2346'],
    body: [word('HERE!', 'caveat', 34, 70, 56, 110), anim('ar', ...stroke2('M60 82C70 120 100 144 144 150', '#ff6b5e', 9), head(148, 150, 8, '#ff6b5e', 22))], css: M.slideY('ar', 1.4, 6) }),
  mk('arrow-look', 'Look!', ['look', 'see', 'arrow', 'attention', 'words', 'eyes'], { colors: ['#20c997', '#2b2346'],
    body: [word('LOOK!', 'fredoka', 30, 136, 160, 110), anim('ar', ...stroke2('M150 128C150 80 110 50 60 56', '#20c997', 10), head(56, 56, 186, '#20c997', 24))], css: M.wiggle('ar', 1.6, 4) }),
  // ---------- speech bubbles
  mk('bubble-hi', 'Hi! bubble', ['hi', 'hello', 'speech bubble', 'say', 'greeting'], { colors: ['#ffffff', '#ff6b5e'], motion: 'pop',
    body: [sayBox('#ffffff'), word('Hi!', 'fredoka', 46, 100, 92, 120, '#ff6b5e')] }),
  mk('bubble-hello', 'Hello! bubble', ['hello', 'hi', 'speech bubble', 'say', 'welcome'], { colors: ['#4dabf7', '#ffffff'], motion: 'pop',
    body: [sayBox('#4dabf7'), word('Hello!', 'fredoka', 36, 100, 92, 128, '#ffffff')] }),
  mk('bubble-wow', 'Wow! shout', ['wow', 'shout', 'speech bubble', 'amazing', 'comic'], { colors: ['#ffd43b', '#e03131'], motion: 'shake',
    body: [path(shoutD, fillInk('#ffd43b')), word('WOW!', 'anton', 40, 100, 92, 104, '#e03131')] }),
  mk('bubble-think', 'Thinking', ['think', 'thought', 'hmm', 'idea', 'dream', 'bubble'], { colors: ['#ffffff', '#845ef7'], motion: 'bob',
    body: [path(thinkD, fillInk('#ffffff')), circle(56, 154, 10, fillInk('#ffffff', 4)), circle(38, 174, 6, fillInk('#ffffff', 3.5)), word('Hmm...', 'caveat', 36, 104, 92, 120, '#845ef7')] }),
  mk('bubble-typing', 'Typing', ['typing', 'chat', 'message', 'text', 'dots', 'waiting'], { colors: ['#e9ecef', '#868e96'], motion: 'none',
    body: [sayBox('#e9ecef'), ...[70, 100, 130].map((x, i) => anim('d' + i, circle(x, 92, 11, { fill: '#868e96' })))],
    css: [0, 1, 2].map(i => `.d${i}{animation:d${i}k 1.2s ease-in-out ${r(i * 0.18)}s infinite}@keyframes d${i}k{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-10px);opacity:1}}`).join('') }),
  mk('bubble-love', 'Love bubble', ['love', 'heart', 'speech bubble', 'message', 'like'], { colors: ['#ffc9d4', '#ff4d6d'], motion: 'none',
    body: [sayBox('#ffc9d4'), anim('hr', path(heart(100, 94, 74), fillInk('#ff4d6d', 4.5)), K.shine(86, 82, 4, 7, 40, 0.6))], css: M.beat('hr', 1.3) }),
  mk('bubble-question', 'Question', ['question', 'ask', 'what', 'help', 'faq', 'why'], { colors: ['#845ef7', '#ffffff'], motion: 'tilt',
    body: [sayBox('#845ef7'), word('?', 'fredoka', 64, 100, 92, 60, '#ffffff')] }),
  mk('bubble-exclaim', 'Attention', ['attention', 'important', 'alert', 'notice', 'warning'], { colors: ['#ff922b', '#ffffff'], motion: 'shake',
    body: [sayBox('#ff922b'), word('!', 'fredoka', 64, 100, 92, 40, '#ffffff')] }),
  mk('bubble-yay', 'Yay! bubble', ['yay', 'happy', 'celebrate', 'speech bubble', 'hooray'], { colors: ['#51cf66', '#ffffff'], motion: 'bounce',
    body: [sayBox('#51cf66'), word('Yay!', 'fredoka', 44, 100, 92, 120, '#ffffff')], extra: () => X.sparkles([[176, 30, 12], [190, 74, 8]], '#ffd43b') }),
  mk('bubble-thanks', 'Thanks! bubble', ['thanks', 'thank you', 'grateful', 'speech bubble'], { colors: ['#ff8fab', '#ffffff'], motion: 'pop',
    body: [sayBox('#ff8fab'), word('Thanks!', 'pacifico', 30, 100, 90, 128, '#ffffff')] }),
  mk('bubble-omg', 'OMG bubble', ['omg', 'wow', 'shock', 'speech bubble', 'surprise'], { colors: ['#cc5de8', '#ffffff'], motion: 'shake',
    body: [path(shoutD, fillInk('#cc5de8')), word('OMG', 'unbounded', 30, 100, 92, 100, '#ffffff')] }),
  mk('bubble-haha', 'Haha bubble', ['haha', 'lol', 'funny', 'laugh', 'speech bubble'], { colors: ['#ffd43b', '#2b2346'], motion: 'wiggle',
    body: [sayBox('#ffd43b', bubble(22, 40, 156, 104, 30, 'right')), word('HAHA', 'fredoka', 38, 100, 92, 128, OL)] }),
  mk('bubble-yes', 'Yes! bubble', ['yes', 'agree', 'ok', 'speech bubble', 'sure'], { colors: ['#20c997', '#ffffff'], motion: 'pop',
    body: [sayBox('#20c997'), word('YES!', 'fredoka', 42, 100, 92, 120, '#ffffff')] }),
  mk('bubble-new', 'New! bubble', ['new', 'speech bubble', 'news', 'announce'], { colors: ['#ff6b5e', '#ffffff'], motion: 'pop',
    body: [path(rrect(26, 36, 148, 112, 56), fillInk('#ff6b5e')), path('M58 140L46 176L90 146Z', fillInk('#ff6b5e', 5)), path('M58 136L90 136', { stroke: '#ff6b5e', 'stroke-width': 8 }), word('NEW!', 'anton', 40, 100, 92, 110, '#ffffff')] }),
  mk('bubble-ok', 'OK! bubble', ['ok', 'okay', 'fine', 'speech bubble', 'got it'], { colors: ['#74c0fc', '#ffffff'], motion: 'pop',
    body: [sayBox('#74c0fc', bubble(22, 40, 156, 104, 30, 'right')), word('OK!', 'fredoka', 46, 100, 92, 120, '#ffffff')] }),
  mk('bubble-oops', 'Oops! bubble', ['oops', 'sorry', 'mistake', 'speech bubble', 'whoops'], { colors: ['#ffa94d', '#ffffff'], motion: 'tilt',
    body: [sayBox('#ffa94d'), word('Oops!', 'fredoka', 38, 100, 92, 128, '#ffffff')] }),
  mk('bubble-cool', 'Cool! bubble', ['cool', 'nice', 'awesome', 'speech bubble'], { colors: ['#1c7ed6', '#ffffff'], motion: 'wiggle',
    body: [sayBox('#1c7ed6'), word('Cool!', 'unbounded', 28, 100, 92, 128, '#ffffff')] }),
  mk('bubble-chat', 'Chat', ['chat', 'talk', 'message', 'conversation', 'contact', 'support'], { colors: ['#4dabf7', '#ffd43b'], motion: 'none',
    body: [anim('b1', path(bubble(14, 30, 116, 80, 24, 'left'), fillInk('#4dabf7')), ...[46, 72, 98].map(x => circle(x, 70, 7, { fill: '#ffffff' }))),
      anim('b2', path(bubble(70, 96, 116, 76, 24, 'right'), fillInk('#ffd43b')), path('M96 128H160M96 146H140', { stroke: OL, 'stroke-width': 6, 'stroke-linecap': 'round' }))],
    css: M.bob('b1', 2.4, 4) + M.bob('b2', 2.4, 4).replace('infinite', 'infinite;animation-delay:.6s') })
];
module.exports = { LIST, CAT };
