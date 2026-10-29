// Badges: SALE, NEW, OPEN, THANK YOU and more, on bursts, seals, ribbons, tags, stamps and signs (Blokvane's own
// drawings). The words are outlines made from the fonts that come with Blokvane, so they look the same everywhere.
'use strict';
const K = require('./kit');
const T = require('./text');
const { r, P, at, g, node, path, circle, ellipse, rect, line, poly, pline, ink, fillInk, anim, heart, star, roundPoly, scallop, cloud, rrect, MOVES: M, OL, HL, SH } = K;
const { blob, egg, smooth, curve, ring, drop, leaf, body, part, X, face, make } = require('./make');

const CAT = 'Badges';
const W = (text, o) => T.words(text, o).d;
// a badge: its shape, the words, an optional light that sweeps across (clipped to the shape)
const mk = (id, name, tags, o) => make({ id: 'badge-' + id, name, cat: CAT, tags: ['badge', 'sign', ...tags], body: o.body, behind: o.behind, front: o.front, extra: o.extra, motion: o.motion || 'pop', css: o.css, colors: o.colors, ground: o.ground === undefined ? false : o.ground });
const txt = (d, fill, outline) => outline ? g({}, path(d, { fill: outline, stroke: outline, 'stroke-width': 7, 'stroke-linejoin': 'round' }), path(d, { fill })) : path(d, { fill });
const sweep = (id, d, h = 200) => [node('defs', {}, [node('clipPath', { id }, [path(d)])]), g({ 'clip-path': `url(#${id})` }, anim('sw', path(`M30 0H58L28 ${h}H0Z`, { fill: HL, opacity: 0.35 })))];
const SWEEP = M.shine('sw', 3.2, 200);
const circleD = (cx, cy, rr) => `M${P(cx - rr, cy)}a${r(rr)} ${r(rr)} 0 1 0 ${r(rr * 2)} 0a${r(rr)} ${r(rr)} 0 1 0 ${r(-rr * 2)} 0Z`;
// shapes
const burstD = (n = 16, ro = 92, ri = 74) => star(100, 100, ro, ri, n, -90);
const sealD = (n = 14) => scallop(100, 100, 80, n, 0.07);
const shieldD = 'M100 18L170 40V96C170 140 138 170 100 184C62 170 30 140 30 96V40Z';
const tagD = 'M30 64H140L182 100L140 136H30Q20 136 20 126V74Q20 64 30 64Z';
const pillD = rrect(14, 66, 172, 68, 34);
const hexD = 'M100 14L176 56V144L100 186L24 144V56Z';
const ribbon = (y, col, dark) => [path(`M8 ${y + 12}H48V${y + 62}H8L22 ${y + 37}Z`, fillInk(dark, 4.5)), path(`M192 ${y + 12}H152V${y + 62}H192L178 ${y + 37}Z`, fillInk(dark, 4.5)), path(`M40 ${y + 56}L48 ${y + 62}V${y + 50}Z`, { fill: OL }), path(`M160 ${y + 56}L152 ${y + 62}V${y + 50}Z`, { fill: OL }), rect(28, y, 144, 56, { rx: 6, ...fillInk(col) })];
const hanging = (col, w = 150) => [path(`M${100 - w * 0.3} 64L100 22L${100 + w * 0.3} 64`, { fill: 'none', ...ink(4) }), circle(100, 20, 6, fillInk('#adb5bd', 3.5)), rect(100 - w / 2, 60, w, 82, { rx: 12, ...fillInk(col) }), circle(100 - w * 0.3, 66, 4, { fill: OL }), circle(100 + w * 0.3, 66, 4, { fill: OL })];
const rosette = (col, col2, rr = 62) => [path('M70 140L50 190L72 178L84 196L98 150Z', fillInk(col2, 4.5)), path('M130 140L150 190L128 178L116 196L102 150Z', fillInk(col2, 4.5)), path(scallop(100, 92, rr + 10, 18, 0.07), fillInk(col)), circle(100, 92, rr - 6, { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '5 5', opacity: 0.8 })];
const stamp = (col, tilt = -10) => [g({ transform: `rotate(${tilt} 100 100)` }, rect(18, 56, 164, 88, { rx: 10, fill: 'none', stroke: col, 'stroke-width': 8 }), rect(28, 66, 144, 68, { rx: 6, fill: 'none', stroke: col, 'stroke-width': 3 }))];
const dot = (cx, cy, col, cls = 'dt') => [circle(cx, cy, 9, { fill: col, class: cls }), circle(cx, cy, 9, { fill: col })];
const pulseDot = cls => `.${cls}{animation:${cls}k 1.4s ease-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes ${cls}k{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.4);opacity:0}}`;

const LIST = () => [
  mk('sale', 'Sale', ['sale', 'deal', 'discount', 'shop', 'offer'], { colors: ['#ff4d4d', '#ffffff'], motion: 'none',
    body: [anim('bg', path(burstD(), fillInk('#ff4d4d'))), anim('tx', txt(W('SALE', { font: 'anton', size: 46, cx: 100, cy: 100, maxW: 120 }), '#ffffff', OL))], css: M.spin('bg', 16) + M.pop('tx', 1.6) }),
  mk('new', 'New', ['new', 'fresh', 'just in', 'launch'], { colors: ['#ffd43b', '#2b2346'], motion: 'none',
    body: [anim('bg', path(sealD(), fillInk('#ffd43b'))), circle(100, 100, 62, { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, 'stroke-dasharray': '6 5' }), anim('tx', txt(W('NEW', { font: 'unbounded', size: 34, cx: 100, cy: 100, maxW: 112 }), OL))], css: M.spin('bg', 20) + M.pulse('tx', 1.6, 1.08) }),
  mk('open', 'Open', ['open', 'welcome', 'store', 'shop', 'come in', 'hours'], { colors: ['#40c057', '#ffffff'], motion: 'swing',
    body: [...hanging('#40c057'), txt(W('OPEN', { font: 'fredoka', size: 38, cx: 100, cy: 102, maxW: 120 }), '#ffffff', OL)] }),
  mk('closed', 'Closed', ['closed', 'shut', 'store', 'shop', 'hours', 'sorry'], { colors: ['#ff4d4d', '#ffffff'], motion: 'swing',
    body: [...hanging('#ff4d4d', 160), txt(W('CLOSED', { font: 'fredoka', size: 32, cx: 100, cy: 102, maxW: 130 }), '#ffffff', OL)] }),
  mk('thank-you', 'Thank you', ['thank you', 'thanks', 'grateful', 'customers'], { colors: ['#845ef7', '#5f3dc4', '#ffffff'], motion: 'bob',
    body: [...ribbon(72, '#845ef7', '#5f3dc4'), txt(W('THANK YOU', { font: 'fredoka', size: 22, cx: 100, cy: 100, maxW: 124 }), '#ffffff')], extra: () => X.hearts([[40, 50, 18], [160, 46, 16], [100, 30, 12]]) }),
  mk('hot', 'Hot', ['hot', 'trending', 'popular', 'spicy', 'fire'], { colors: ['#ff922b', '#ffd43b', '#ffffff'], motion: 'none',
    body: [anim('fl', path('M100 18C110 46 146 60 150 108C154 156 124 184 100 184C76 184 46 156 50 108C52 82 66 70 70 50C80 66 84 80 92 84C90 60 92 36 100 18Z', fillInk('#ff922b')), path('M100 96C112 112 128 124 126 148C124 168 112 176 100 176C88 176 76 168 74 148C74 132 84 124 88 112C92 120 96 124 100 124Z', { fill: '#ffd43b' })),
      txt(W('HOT', { font: 'anton', size: 36, cx: 100, cy: 140, maxW: 100 }), '#ffffff', OL)], css: '.fl{animation:flk .8s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}@keyframes flk{to{transform:scale(.96,1.05) skewX(2deg)}}' }),
  mk('free', 'Free', ['free', 'gift', 'no cost', 'offer'], { colors: ['#4dabf7', '#ffffff'], motion: 'pop',
    body: [circle(100, 100, 80, fillInk('#4dabf7')), circle(100, 100, 66, { fill: 'none', stroke: '#ffffff', 'stroke-width': 4 }), ...sweep('fc', circleD(100, 100, 78)), txt(W('FREE', { font: 'anton', size: 44, cx: 100, cy: 100, maxW: 110 }), '#ffffff', OL)], css: SWEEP }),
  mk('half-off', '50% off', ['50 off', 'half price', 'sale', 'discount', 'percent'], { colors: ['#ffd43b', '#e03131'], motion: 'none',
    body: [anim('bg', path(burstD(20, 92, 78), fillInk('#ffd43b'))), anim('tx', path(W('50%', { font: 'anton', size: 48, cx: 100, cy: 86, maxW: 120 }), { fill: '#e03131' }), path(W('OFF', { font: 'anton', size: 26, cx: 100, cy: 136, maxW: 80 }), { fill: OL }))], css: M.spin('bg', 18) + M.pop('tx', 1.6) }),
  mk('two-for-one', '2 for 1', ['2 for 1', 'two for one', 'deal', 'offer', 'sale'], { colors: ['#ff6b9a', '#ffffff'], motion: 'wiggle',
    body: [path(tagD, fillInk('#ff6b9a')), circle(160, 100, 8, fillInk('#ffffff', 4)), ...sweep('tc', tagD), txt(W('2 FOR 1', { font: 'fredoka', size: 28, cx: 86, cy: 100, maxW: 112 }), '#ffffff', OL)], css: SWEEP }),
  mk('best-seller', 'Best seller', ['best seller', 'best', 'popular', 'top', 'award', 'favorite'], { colors: ['#ffc93a', '#4dabf7'], motion: 'swing',
    body: [...rosette('#ffc93a', '#4dabf7'), txt(W('BEST', { font: 'anton', size: 28, cx: 100, cy: 78, maxW: 90 }), OL), txt(W('SELLER', { font: 'anton', size: 20, cx: 100, cy: 110, maxW: 90 }), OL)] }),
  mk('limited', 'Limited', ['limited', 'limited edition', 'rare', 'few left'], { colors: ['#e03131'], motion: 'pulse',
    body: [...stamp('#e03131', -10), g({ transform: 'rotate(-10 100 100)' }, path(W('LIMITED', { font: 'alfa', size: 30, cx: 100, cy: 100, maxW: 130 }), { fill: '#e03131' }))] }),
  mk('today-only', 'Today only', ['today only', 'today', 'one day', 'deal', 'hurry'], { colors: ['#ff922b', '#ffffff'], motion: 'pop',
    body: [path(pillD, fillInk('#ff922b')), ...sweep('pc', pillD), txt(W('TODAY ONLY', { font: 'fredoka', size: 24, cx: 100, cy: 100, maxW: 146 }), '#ffffff', OL)], css: SWEEP }),
  mk('coming-soon', 'Coming soon', ['coming soon', 'soon', 'new', 'launch', 'wait'], { colors: ['#4dabf7', '#1c7ed6', '#ffffff'], motion: 'bob',
    body: [...ribbon(72, '#4dabf7', '#1c7ed6'), txt(W('COMING SOON', { font: 'fredoka', size: 20, cx: 100, cy: 100, maxW: 126 }), '#ffffff')], extra: () => X.sparkles([[30, 50, 11], [170, 48, 10], [100, 166, 8]], '#ffd43b') }),
  mk('sold-out', 'Sold out', ['sold out', 'none left', 'gone', 'sorry'], { colors: ['#495057', '#e03131'], motion: 'none',
    body: [...stamp('#e03131', 8), g({ transform: 'rotate(8 100 100)' }, path(W('SOLD OUT', { font: 'alfa', size: 28, cx: 100, cy: 100, maxW: 136 }), { fill: '#e03131' }))], css: '' }),
  mk('welcome', 'Welcome', ['welcome', 'hello', 'come in', 'open', 'greeting'], { colors: ['#40c057', '#2b8a3e', '#ffffff'], motion: 'bob',
    body: [...ribbon(72, '#40c057', '#2b8a3e'), txt(W('WELCOME', { font: 'fredoka', size: 26, cx: 100, cy: 100, maxW: 124 }), '#ffffff')], extra: () => X.sparkles([[24, 48, 11], [176, 48, 10]], '#ffd43b') }),
  mk('hello', 'Hello', ['hello', 'hi', 'greeting', 'welcome'], { colors: ['#20c997', '#ffffff'], motion: 'wiggle',
    body: [path(pillD, fillInk('#20c997')), txt(W('HELLO!', { font: 'fredoka', size: 32, cx: 100, cy: 100, maxW: 140 }), '#ffffff', OL)] }),
  mk('wow', 'Wow', ['wow', 'amazing', 'awesome', 'surprise', 'omg'], { colors: ['#cc5de8', '#ffd43b'], motion: 'none',
    body: [anim('bg', path(star(100, 100, 94, 64, 12, -90), fillInk('#cc5de8'))), anim('tx', txt(W('WOW!', { font: 'anton', size: 46, cx: 100, cy: 100, maxW: 120 }), '#ffd43b', OL))], css: M.spin('bg', 14) + M.pop('tx', 1.4) }),
  mk('omg', 'OMG', ['omg', 'oh my', 'wow', 'surprise', 'shock'], { colors: ['#ff6b9a', '#ffffff'], motion: 'shake',
    body: [circle(100, 100, 78, fillInk('#ff6b9a')), txt(W('OMG', { font: 'unbounded', size: 34, cx: 100, cy: 100, maxW: 124 }), '#ffffff', OL)], extra: () => X.lines([[22, 40, 38, 56], [178, 40, 162, 56], [22, 160, 38, 144], [178, 160, 162, 144]], OL) }),
  mk('lol', 'LOL', ['lol', 'funny', 'laugh', 'haha', 'joke'], { colors: ['#ffd43b', '#2b2346'], motion: 'wiggle',
    body: [path(sealD(16), fillInk('#ffd43b')), txt(W('LOL', { font: 'unbounded', size: 36, cx: 100, cy: 100, maxW: 120 }), OL)] }),
  mk('yes', 'Yes', ['yes', 'ok', 'agree', 'approved', 'correct', 'done'], { colors: ['#40c057', '#ffffff'], motion: 'pop',
    body: [path(shieldD, fillInk('#40c057')), path('M100 30L158 48V96C158 132 132 158 100 170C68 158 42 132 42 96V48Z', { fill: 'none', stroke: '#ffffff', 'stroke-width': 3, opacity: 0.7 }), txt(W('YES!', { font: 'anton', size: 40, cx: 100, cy: 98, maxW: 100 }), '#ffffff', OL)] }),
  mk('vip', 'VIP', ['vip', 'members', 'exclusive', 'gold', 'special'], { colors: ['#2b2346', '#ffc93a'], motion: 'none',
    body: [path(shieldD, fillInk('#3b3355')), path('M100 30L158 48V96C158 132 132 158 100 170C68 158 42 132 42 96V48Z', { fill: 'none', stroke: '#ffc93a', 'stroke-width': 4 }), ...sweep('vc', shieldD), path(star(100, 54, 12, 5, 5, -90), { fill: '#ffc93a' }), path(W('VIP', { font: 'alfa', size: 38, cx: 100, cy: 108, maxW: 100 }), { fill: '#ffc93a' })], css: SWEEP }),
  mk('top-pick', 'Top pick', ['top pick', 'favorite', 'recommended', 'best', 'staff pick'], { colors: ['#ff6b5e', '#ffd43b'], motion: 'swing',
    body: [...rosette('#ff6b5e', '#ffd43b'), txt(W('TOP', { font: 'anton', size: 28, cx: 100, cy: 78, maxW: 90 }), '#ffffff', OL), txt(W('PICK', { font: 'anton', size: 22, cx: 100, cy: 110, maxW: 90 }), '#ffffff', OL)] }),
  mk('number-one', 'Number one', ['number one', 'no 1', 'first', 'winner', 'best', 'champion'], { colors: ['#ffc93a', '#4dabf7', '#ff6b5e'], motion: 'swing',
    body: [path('M64 20L88 82H104L80 20Z', fillInk('#4dabf7', 4.5)), path('M136 20L112 82H96L120 20Z', fillInk('#ff6b5e', 4.5)), circle(100, 122, 60, fillInk('#ffc93a')), circle(100, 122, 48, { fill: 'none', stroke: '#e8a400', 'stroke-width': 4 }), ...sweep('nc', circleD(100, 122, 58)),
      path(W('No.1', { font: 'alfa', size: 34, cx: 100, cy: 124, maxW: 84 }), { fill: OL })], css: SWEEP }),
  mk('ok', 'OK', ['ok', 'okay', 'fine', 'yes', 'good'], { colors: ['#51cf66', '#ffffff'], motion: 'bounce',
    body: [circle(100, 100, 76, fillInk('#51cf66')), txt(W('OK', { font: 'unbounded', size: 44, cx: 100, cy: 100, maxW: 110 }), '#ffffff', OL)] }),
  mk('big-deal', 'Big deal', ['big deal', 'deal', 'sale', 'offer', 'save'], { colors: ['#4dabf7', '#ffd43b'], motion: 'none',
    body: [anim('bg', path(burstD(18, 94, 76), fillInk('#4dabf7'))), anim('tx', txt(W('BIG', { font: 'anton', size: 38, cx: 100, cy: 80, maxW: 110 }), '#ffd43b', OL), txt(W('DEAL', { font: 'anton', size: 32, cx: 100, cy: 124, maxW: 110 }), '#ffffff', OL))], css: M.spin('bg', 20) + M.pulse('tx', 1.4, 1.08) }),
  mk('new-in', 'New in', ['new in', 'new', 'arrivals', 'just in', 'fashion', 'shop'], { colors: ['#20c997', '#ffffff'], motion: 'wiggle',
    body: [path('M100 12V40', { fill: 'none', ...ink(3) }), path('M66 46L100 34L134 46V176Q134 184 126 184H74Q66 184 66 176Z', fillInk('#20c997')), circle(100, 52, 7, fillInk('#ffffff', 3.5)), txt(W('NEW', { font: 'anton', size: 30, cx: 100, cy: 102, maxW: 60 }), '#ffffff', OL), txt(W('IN', { font: 'anton', size: 30, cx: 100, cy: 146, maxW: 60 }), '#ffffff', OL)] }),
  mk('online', 'Online', ['online', 'web', 'order online', 'available', 'internet'], { colors: ['#4dabf7', '#51cf66', '#ffffff'], motion: 'none',
    body: [path(pillD, fillInk('#4dabf7')), ...dot(46, 100, '#51cf66', 'dt'), circle(46, 100, 9, { fill: 'none', ...ink(3) }), txt(W('ONLINE', { font: 'fredoka', size: 26, cx: 118, cy: 100, maxW: 104 }), '#ffffff', OL)], css: pulseDot('dt') }),
  mk('live', 'Live', ['live', 'now', 'on now', 'stream', 'happening'], { colors: ['#ff4d4d', '#ffffff'], motion: 'none',
    body: [path(rrect(30, 66, 140, 68, 14), fillInk('#ff4d4d')), ...dot(62, 100, '#ffffff', 'dt'), txt(W('LIVE', { font: 'unbounded', size: 28, cx: 124, cy: 100, maxW: 80 }), '#ffffff')], css: pulseDot('dt') }),
  mk('on-air', 'On air', ['on air', 'live', 'radio', 'studio', 'recording'], { colors: ['#e03131', '#ffffff'], motion: 'none',
    body: [anim('gw', path(rrect(14, 56, 172, 88, 16), { fill: '#ff8787', opacity: 0.35 })), path(rrect(22, 64, 156, 72, 12), fillInk('#e03131')), txt(W('ON AIR', { font: 'unbounded', size: 28, cx: 100, cy: 100, maxW: 132 }), '#ffffff')],
    css: '.gw{animation:gwk 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 50%}@keyframes gwk{0%,100%{opacity:.15;transform:scale(.96)}50%{opacity:.45;transform:scale(1.03)}}' }),
  mk('fresh', 'Fresh', ['fresh', 'new', 'natural', 'green', 'healthy', 'market'], { colors: ['#51cf66', '#ffffff'], motion: 'pop',
    body: [circle(100, 104, 74, fillInk('#51cf66')), path(leaf(100, 26, 140, 6, 12), fillInk('#94d82d', 4)), path(leaf(100, 26, 66, 8, 10), fillInk('#94d82d', 4)), txt(W('FRESH', { font: 'fredoka', size: 30, cx: 100, cy: 106, maxW: 120 }), '#ffffff', OL)] }),
  mk('special', 'Special', ['special', 'offer', 'chef special', 'today', 'menu'], { colors: ['#ff922b', '#ffffff'], motion: 'none',
    body: [anim('bg', path(sealD(18), fillInk('#ff922b'))), txt(W('SPECIAL', { font: 'alfa', size: 26, cx: 100, cy: 100, maxW: 124 }), '#ffffff', OL)], css: M.spin('bg', 24) }),
  mk('back-soon', 'Back soon', ['back soon', 'be right back', 'break', 'closed', 'lunch'], { colors: ['#ffd43b', '#2b2346'], motion: 'swing',
    body: [...hanging('#ffd43b', 160), path(W('BACK', { font: 'fredoka', size: 26, cx: 100, cy: 88, maxW: 120 }), { fill: OL }), path(W('SOON', { font: 'fredoka', size: 26, cx: 100, cy: 120, maxW: 120 }), { fill: OL })] }),
  mk('last-chance', 'Last chance', ['last chance', 'hurry', 'ending', 'final', 'sale'], { colors: ['#e03131', '#ffffff'], motion: 'shake',
    body: [path(tagD, fillInk('#e03131')), circle(160, 100, 8, fillInk('#ffffff', 4)), txt(W('LAST', { font: 'anton', size: 26, cx: 84, cy: 84, maxW: 100 }), '#ffffff', OL), txt(W('CHANCE', { font: 'anton', size: 22, cx: 84, cy: 116, maxW: 100 }), '#ffffff', OL)] }),
  mk('buy-one', 'Buy 1 get 1', ['buy one get one', 'bogo', 'deal', 'free', 'offer'], { colors: ['#4dabf7', '#ffffff'], motion: 'none',
    body: [anim('bg', path(sealD(16), fillInk('#4dabf7'))), txt(W('BUY 1', { font: 'anton', size: 26, cx: 100, cy: 82, maxW: 110 }), '#ffffff', OL), txt(W('GET 1', { font: 'anton', size: 26, cx: 100, cy: 116, maxW: 110 }), '#ffd43b', OL)], css: M.spin('bg', 24) }),
  mk('happy-hour', 'Happy hour', ['happy hour', 'drinks', 'evening', 'deal', 'bar'], { colors: ['#ff922b', '#d9480f', '#ffffff'], motion: 'bob',
    body: [...ribbon(72, '#ff922b', '#d9480f'), txt(W('HAPPY HOUR', { font: 'fredoka', size: 21, cx: 100, cy: 100, maxW: 124 }), '#ffffff')], extra: () => X.sparkles([[30, 50, 11], [170, 48, 10]], '#ffd43b') }),
  mk('good-job', 'Good job', ['good job', 'well done', 'great', 'school', 'praise', 'star'], { colors: ['#ffd43b', '#ff6b5e'], motion: 'none',
    body: [anim('st', path(star(100, 104, 94, 60, 5, -90, 16), fillInk('#ffd43b')), txt(W('GOOD', { font: 'fredoka', size: 21, cx: 100, cy: 98, maxW: 80 }), '#ff6b5e', OL), txt(W('JOB!', { font: 'fredoka', size: 21, cx: 100, cy: 126, maxW: 80 }), '#ff6b5e', OL))], css: M.pop('st', 1.6) }),
  mk('well-done', 'Well done', ['well done', 'great job', 'award', 'congrats', 'praise'], { colors: ['#845ef7', '#ffc93a'], motion: 'swing',
    body: [...rosette('#845ef7', '#ffc93a'), txt(W('WELL', { font: 'anton', size: 26, cx: 100, cy: 78, maxW: 90 }), '#ffffff', OL), txt(W('DONE', { font: 'anton', size: 26, cx: 100, cy: 110, maxW: 90 }), '#ffc93a', OL)] }),
  mk('love-it', 'Love it', ['love it', 'love', 'heart', 'favorite', 'like'], { colors: ['#ff4d6d', '#ffffff'], motion: 'beat',
    body: [path(heart(100, 104, 176), fillInk('#ff4d6d')), txt(W('LOVE', { font: 'fredoka', size: 26, cx: 100, cy: 88, maxW: 100 }), '#ffffff', OL), txt(W('IT!', { font: 'fredoka', size: 26, cx: 100, cy: 120, maxW: 100 }), '#ffffff', OL)] }),
  mk('like', 'Like', ['like', 'thumbs up', 'good', 'nice', 'approve'], { colors: ['#4dabf7', '#ffffff', '#ff4d6d'], motion: 'pop',
    body: [path(pillD, fillInk('#4dabf7')), path(heart(50, 102, 40), fillInk('#ff4d6d', 4)), txt(W('LIKE', { font: 'fredoka', size: 32, cx: 118, cy: 100, maxW: 100 }), '#ffffff', OL)] }),
  mk('save', 'Save', ['save', 'savings', 'deal', 'offer', 'money'], { colors: ['#20c997', '#ffffff'], motion: 'wiggle',
    body: [path(tagD, fillInk('#20c997')), circle(160, 100, 8, fillInk('#ffffff', 4)), ...sweep('sc', tagD), txt(W('SAVE', { font: 'anton', size: 36, cx: 84, cy: 100, maxW: 100 }), '#ffffff', OL)], css: SWEEP }),
  mk('hiring', 'Now hiring', ['now hiring', 'hiring', 'jobs', 'work', 'join us', 'help wanted'], { colors: ['#4dabf7', '#ffffff'], motion: 'swing',
    body: [...hanging('#4dabf7', 164), txt(W('NOW', { font: 'fredoka', size: 24, cx: 100, cy: 86, maxW: 120 }), '#ffffff', OL), txt(W('HIRING', { font: 'fredoka', size: 28, cx: 100, cy: 118, maxW: 136 }), '#ffd43b', OL)] }),
  mk('open-late', 'Open late', ['open late', 'late night', 'open', 'night', 'hours'], { colors: ['#845ef7', '#ffd43b'], motion: 'none',
    body: [path(rrect(16, 56, 168, 88, 20), fillInk('#3b3355')), anim('tx', path(W('OPEN LATE', { font: 'neon', size: 26, cx: 100, cy: 100, maxW: 140 }), { fill: '#ff4fd8', stroke: '#ffd1f5', 'stroke-width': 1.5 })), path(star(170, 64, 8, 3, 4, -90), { fill: '#ffd43b' }), path(star(30, 138, 6, 2.4, 4, -90), { fill: '#ffd43b' })],
    css: M.flicker('tx', 2.4) })
];
module.exports = { LIST, CAT };
