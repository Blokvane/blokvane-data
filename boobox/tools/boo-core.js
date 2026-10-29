// Blokvane Signage: the checks and builders behind Boo Box (animated stickers, emoji, words and scenes) and
// Elements (shapes and icons). Plain code with no page around it, so the Studio, the Player, TV screens, the tests
// and the tools that build the public lists all use the very same rules.
// Everything that comes from the public list is data, never code:
//  - a sticker is a list of drawing parts ([tag, attributes, children]) checked against a short allowlist. This code
//    turns it into an SVG picture, and it is only ever shown as a picture (an <img>), where nothing can run.
//  - an animated emoji (Lottie) must be plain drawing data: no expressions (code), no files or fonts from anywhere.
//  - an icon is a few lines, circles and boxes, rebuilt from checked numbers.
//  - shapes are made right here.
var BVBoo = (() => {
  // ---------- small checks ----------
  const NUM = /^-?(\d+\.?\d*|\.\d+)(e-?\d+)?(%|px)?$/i;
  const num = v => typeof v === 'string' && v.length <= 24 && NUM.test(v);
  const nums = v => typeof v === 'string' && v.length <= 4000 && /^[-\d.e\s,]*$/i.test(v);
  const pathD = v => typeof v === 'string' && v.length <= 12000 && /^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+-]*$/.test(v);
  const idv = v => typeof v === 'string' && /^[A-Za-z][\w-]{0,40}$/.test(v);
  const classv = v => typeof v === 'string' && /^[A-Za-z][\w-]{0,40}( [A-Za-z][\w-]{0,40}){0,5}$/.test(v);
  const ref = v => typeof v === 'string' && /^url\(#[A-Za-z][\w-]{0,40}\)$/.test(v);
  const paint = v => typeof v === 'string' && (/^(#[0-9a-f]{3,8}|none|currentColor|transparent|rgba?\([\d\s.,%]+\))$/i.test(v) || ref(v));
  const transform = v => typeof v === 'string' && v.length <= 400 && /^\s*((translate|rotate|scale|skewX|skewY|matrix)\([-\d.e\s,]*\)\s*)+$/.test(v);
  const oneOf = (...xs) => v => xs.includes(v);
  const values = v => typeof v === 'string' && v.length <= 2000 && /^[-\d.e\s,;#a-z()%]*$/i.test(v) && !/url|script|expression/i.test(v);
  const time = v => typeof v === 'string' && /^-?\d+(\.\d+)?m?s$/.test(v);
  const hex = v => typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
  // fonts inside a picture: only these few, from the computer's own (a picture can't load fonts)
  const FONT_STACK = {
    sans: "system-ui, 'Segoe UI', Arial, sans-serif",
    heavy: "'Arial Black', 'Segoe UI Black', 'Segoe UI', Impact, sans-serif",
    round: "'Arial Rounded MT Bold', 'Segoe UI', system-ui, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    script: "'Segoe Script', 'Brush Script MT', cursive"
  };

  // ---------- stickers: drawing parts ----------
  // (no <use>: it draws another part again, and a few of them can ask for millions of copies)
  const TAGS = new Set(['g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'text', 'tspan', 'defs', 'linearGradient',
    'radialGradient', 'stop', 'clipPath', 'mask', 'animate', 'animateTransform']);
  const ANIM = new Set(['animate', 'animateTransform']);
  const COMMON = {
    id: idv, class: classv, transform, opacity: num, 'fill-opacity': num, 'stroke-opacity': num, fill: paint, stroke: paint,
    'stroke-width': num, 'stroke-linecap': oneOf('butt', 'round', 'square'), 'stroke-linejoin': oneOf('miter', 'round', 'bevel'),
    'stroke-dasharray': nums, 'stroke-dashoffset': num, 'fill-rule': oneOf('nonzero', 'evenodd'), 'clip-rule': oneOf('nonzero', 'evenodd'),
    'clip-path': ref, mask: ref, 'paint-order': oneOf('stroke', 'fill', 'normal', 'stroke fill', 'fill stroke'), 'transform-origin': nums,
    'vector-effect': oneOf('non-scaling-stroke', 'none')
  };
  const PER_TAG = {
    path: { d: pathD }, circle: { cx: num, cy: num, r: num }, ellipse: { cx: num, cy: num, rx: num, ry: num },
    rect: { x: num, y: num, width: num, height: num, rx: num, ry: num }, line: { x1: num, y1: num, x2: num, y2: num },
    polyline: { points: nums }, polygon: { points: nums },
    text: { x: num, y: num, dx: num, dy: num, 'font-size': num, 'font-weight': oneOf('normal', 'bold', '400', '500', '600', '700', '800', '900'),
      'font-family': v => Object.hasOwn(FONT_STACK, v), 'text-anchor': oneOf('start', 'middle', 'end'), 'dominant-baseline': oneOf('auto', 'middle', 'central', 'alphabetic', 'hanging'),
      'letter-spacing': num, 'font-style': oneOf('normal', 'italic') },
    tspan: { x: num, y: num, dx: num, dy: num, 'font-size': num, 'font-weight': oneOf('normal', 'bold', '400', '700', '900') },
    linearGradient: { x1: num, y1: num, x2: num, y2: num, gradientUnits: oneOf('userSpaceOnUse', 'objectBoundingBox'), gradientTransform: transform },
    radialGradient: { cx: num, cy: num, r: num, fx: num, fy: num, fr: num, gradientUnits: oneOf('userSpaceOnUse', 'objectBoundingBox'), gradientTransform: transform },
    stop: { offset: num, 'stop-color': paint, 'stop-opacity': num },
    clipPath: { clipPathUnits: oneOf('userSpaceOnUse', 'objectBoundingBox') }, mask: { x: num, y: num, width: num, height: num, maskUnits: oneOf('userSpaceOnUse', 'objectBoundingBox') },
    defs: {}, g: {}
  };
  const ANIM_ATTRS = {
    attributeName: oneOf('opacity', 'r', 'cx', 'cy', 'rx', 'ry', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-dashoffset', 'stroke-width', 'transform', 'offset', 'fill-opacity'),
    values, from: values, to: values, by: values, dur: time, begin: v => time(v) || v === '0', repeatCount: v => v === 'indefinite' || num(v),
    keyTimes: v => typeof v === 'string' && v.length <= 600 && /^[\d.;\s]*$/.test(v), keySplines: v => typeof v === 'string' && v.length <= 1200 && /^[\d.;,\s]*$/.test(v),
    calcMode: oneOf('discrete', 'linear', 'paced', 'spline'), type: oneOf('translate', 'scale', 'rotate', 'skewX', 'skewY'),
    additive: oneOf('sum', 'replace'), accumulate: oneOf('sum', 'none'), fill: oneOf('freeze', 'remove'), id: idv
  };
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined;
  const ruleFor = (tag, k) => ANIM.has(tag) ? own(ANIM_ATTRS, k) : (own(PER_TAG, tag) && own(own(PER_TAG, tag), k)) || own(COMMON, k);
  // A sticker's parts, checked. Anything not on the lists refuses the whole sticker (a list made by Blokvane never
  // has anything else, so something else means the file was changed). Returns a clean copy or null.
  function cleanNodes(nodes, budget = { n: 0 }, depth = 0) {
    if (!Array.isArray(nodes) || depth > 14) return null;
    const out = [];
    for (const n of nodes) {
      if (++budget.n > 3000) return null;
      if (!Array.isArray(n) || n.length < 1 || n.length > 3 || typeof n[0] !== 'string' || !TAGS.has(n[0])) return null;
      const tag = n[0];
      const a0 = n[1] == null ? {} : n[1];
      if (typeof a0 !== 'object' || Array.isArray(a0)) return null;
      const attrs = {};
      for (const k of Object.keys(a0)) {
        const v = typeof a0[k] === 'number' && Number.isFinite(a0[k]) ? String(a0[k]) : a0[k];
        const rule = ruleFor(tag, k);
        if (!rule || !rule(v)) return null;
        attrs[k] = v;
      }
      let kids = [];
      if (n.length === 3) {
        if (typeof n[2] === 'string') { if ((tag !== 'text' && tag !== 'tspan') || n[2].length > 200) return null; kids = n[2]; }
        else { kids = cleanNodes(n[2], budget, depth + 1); if (!kids) return null; }
      }
      out.push(kids.length || typeof kids === 'string' ? [tag, attrs, kids] : [tag, attrs]);
    }
    return out;
  }
  // How much drawing a sticker asks for: every part, plus the clip or mask it points at, counted each time it is
  // used (a clip whose parts point at another clip, again and again, multiplies). A loop counts as too much.
  const DRAW_MAX = 8000;
  function drawCost(nodes, cap = DRAW_MAX) {
    const byId = new Map();
    const index = ns => { for (const n of ns) { const a = n[1] || {}; if (own(a, 'id') && !byId.has(a.id)) byId.set(a.id, n); if (Array.isArray(n[2])) index(n[2]); } };
    index(nodes);
    const memo = new Map(), busy = new Set();
    const target = v => { const m = /^url\(#([A-Za-z][\w-]{0,40})\)$/.exec(typeof v === 'string' ? v : ''); return m ? m[1] : ''; };
    const costId = id => {
      if (memo.has(id)) return memo.get(id);
      if (busy.has(id)) return Infinity;
      const n = byId.get(id);
      if (!n) return 0;
      busy.add(id);
      const c = costNode(n);
      busy.delete(id);
      memo.set(id, c);
      return c;
    };
    const costNode = n => {
      const a = n[1] || {};
      let c = 1;
      for (const k of ['clip-path', 'mask']) { const t = target(own(a, k)); if (t) c += costId(t); }
      if (Array.isArray(n[2])) for (const k of n[2]) { c += costNode(k); if (c > cap) return Infinity; }
      return c > cap ? Infinity : c;
    };
    let total = 0;
    for (const n of nodes) { total += costNode(n); if (total > cap) return Infinity; }
    return total;
  }
  // a sticker's moving parts (CSS): keyframes and classes only. No quotes, no slashes and no url() means it can't
  // point at anything; and a picture can't run anything anyway.
  function cleanCss(css) {
    if (css == null || css === '') return '';
    if (typeof css !== 'string' || css.length > 10000) return null;
    if (!/^[\w\s#.%(),:;{}\-@!*]*$/.test(css)) return null;
    if (/url|import|expression|javascript|behavior|binding|charset/i.test(css)) return null;
    for (const m of css.matchAll(/@([a-z-]*)/gi)) { const at = m[1].toLowerCase(); if (at !== 'keyframes' && at !== 'media') return null; }
    for (const m of css.matchAll(/@media\s*([^{]*)\{/gi)) if (!/^\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)\s*$/i.test(m[1])) return null;
    return css;
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function serialize(nodes, recolor, still) {
    let s = '';
    for (const [tag, attrs, kids] of nodes) {
      if (still && ANIM.has(tag)) continue;
      s += '<' + tag;
      for (const [k, v0] of Object.entries(attrs)) {
        let v = v0;
        if (recolor && (k === 'fill' || k === 'stroke' || k === 'stop-color') && recolor[v.toLowerCase()]) v = recolor[v.toLowerCase()];
        if (k === 'font-family') v = FONT_STACK[v];
        s += ' ' + k + '="' + esc(v) + '"';
      }
      if (kids === undefined || (Array.isArray(kids) && !kids.length)) s += '/>';
      else s += '>' + (typeof kids === 'string' ? esc(kids) : serialize(kids, recolor, still)) + '</' + tag + '>';
    }
    return s;
  }
  // gentle on people who asked for less motion
  const CALM = '@media (prefers-reduced-motion: reduce){*{animation:none!important}}';
  // the recolor map: { '#ff6b5e': '#3a86ff' } (only real colors)
  function recolorMap(from, to) {
    const map = {};
    (from || []).forEach((c, i) => { const t = to && to[i]; if (hex(c) && hex(t) && c.toLowerCase() !== t.toLowerCase()) map[c.toLowerCase()] = t.toLowerCase(); });
    return map;
  }
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // every color changed at once, in one pass (one after the other, swapping two colors would make both the same)
  function recolorText(text, map) {
    const from = Object.keys(map || {}).filter(hex);
    if (!from.length) return text;
    const re = new RegExp(from.map(reEsc).join('|'), 'gi');
    return text.replace(re, m => map[m.toLowerCase()] || m);
  }
  // a sticker as an SVG picture (text). still: without the motion (thumbnails, and people who want less motion)
  function stickerSvg(st, o = {}) {
    if (!st || typeof st !== 'object') return '';
    const vb = Array.isArray(st.vb) ? st.vb : [200, 200];
    const [w, h] = vb.map(Number);
    if (!(w > 0 && w <= 2000 && h > 0 && h <= 2000)) return '';
    const nodes = cleanNodes(st.n);
    const css = cleanCss(st.css || '');
    if (!nodes || css == null || drawCost(nodes) > DRAW_MAX) return '';
    const map = o.recolor || {};
    const style = o.still || !css ? '' : '<style>' + recolorText(css, map) + CALM + '</style>';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${style}${serialize(nodes, map, !!o.still)}</svg>`;
  }
  // A sticker picture kept in a slideshow's library is text this code made when the sticker was added. Before it is
  // shown it is read back into its parts and made again with the same checks as a sticker from the list: it is
  // shown only when that gives exactly the same text (so a picture changed or made elsewhere is never shown).
  const FONT_KEY = new Map(Object.entries(FONT_STACK).map(([k, v]) => [v, k]));
  const unesc = s => (/&(?!(amp|lt|gt|quot);)/.test(s) ? null : s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
  function stickerFromSvg(text) {
    if (typeof text !== 'string' || text.length > 400000) return null;
    const head = /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 ([\d.e+-]{1,24}) ([\d.e+-]{1,24})" width="\1" height="\2">/.exec(text);
    if (!head || !text.endsWith('</svg>')) return null;
    let body = text.slice(head[0].length, -6), css = '';
    if (body.startsWith('<style>')) {
      const end = body.indexOf('</style>');
      if (end < 0) return null;
      css = body.slice(7, end);
      body = body.slice(end + 8);
      if (!css.endsWith(CALM)) return null;
      css = css.slice(0, -CALM.length);
    }
    const root = { kids: [] }, stack = [root];
    const tok = /<\/([A-Za-z]+)>|<([A-Za-z]+)((?: [A-Za-z][\w:-]*="[^"<>]*")*)(\/?)>|([^<]+)/y;
    while (tok.lastIndex < body.length) {
      const m = tok.exec(body);
      if (!m) return null;
      const top = stack[stack.length - 1];
      if (m[1]) { if (stack.length < 2 || top.tag !== m[1]) return null; if (!top.kids.length) top.kids = ''; stack.pop(); continue; }
      if (m[5] != null) {
        // words: only inside text, and only words
        if ((top.tag !== 'text' && top.tag !== 'tspan') || typeof top.kids !== 'string' && top.kids.length) return null;
        const t = unesc(m[5]);
        if (t == null) return null;
        top.kids = (typeof top.kids === 'string' ? top.kids : '') + t;
        continue;
      }
      if (typeof top.kids === 'string') return null;
      const attrs = {};
      for (const a of m[3].matchAll(/ ([A-Za-z][\w:-]*)="([^"]*)"/g)) {
        let v = unesc(a[2]);
        if (v == null || Object.prototype.hasOwnProperty.call(attrs, a[1])) return null;
        if (a[1] === 'font-family') { if (!FONT_KEY.has(v)) return null; v = FONT_KEY.get(v); }
        attrs[a[1]] = v;
      }
      const node = { tag: m[2], attrs, kids: [] };
      top.kids.push(node);
      if (!m[4]) stack.push(node);
    }
    if (stack.length !== 1) return null;
    const plain = list => list.map(n => (typeof n.kids === 'string' ? [n.tag, n.attrs, n.kids] : n.kids.length ? [n.tag, n.attrs, plain(n.kids)] : [n.tag, n.attrs]));
    return { vb: [Number(head[1]), Number(head[2])], n: plain(root.kids), css };
  }
  const stickerSvgOk = text => { const st = stickerFromSvg(text); return !!st && stickerSvg(st) === text; };
  // the picture of a sticker Blokvane made, with other colors or without its motion (works on the saved text too)
  function stickerVariant(svgText, o = {}) {
    let t = String(svgText || '');
    if (o.recolor) t = recolorText(t, o.recolor);
    if (o.still) t = t.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<animate(Transform)?\b[^>]*\/>/g, '').replace(/<animate(Transform)?\b[^>]*>[\s\S]*?<\/animate(Transform)?>/g, '');
    return t;
  }
  const svgUri = text => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);

  // ---------- animated emoji (Lottie) ----------
  const LOTTIE_TYPE = 'application/vnd.blokvane.lottie+json';
  const LOTTIE_MAX = 1500000;
  // Plain drawing data only. Returns the object, or null when anything could load something or run something.
  // layers that are only drawing: groups of layers, solid color, empty (a parent for others) and shapes
  const LAYER_TY = new Set([0, 1, 3, 4]);
  // shape parts that only draw: groups, paths, boxes, ellipses, fills, strokes, gradients, moves, trims and merges.
  // (Repeaters, stars, zig zags, offsets, round corners and pucker make more points or copies than the file holds,
  // and a few of them inside each other can ask for millions: they are refused. Noto's emoji use none of them.)
  const SHAPE_TY = new Set(['gr', 'sh', 'rc', 'el', 'fl', 'st', 'gf', 'gs', 'tr', 'tm', 'mm']);
  // What the player builds, counted for each time a part is used: a group of layers used 10 times is built 10 times
  // (the player even copies its data each time). The real emoji ask for at most about 5,000 parts and 1.2 million
  // values (the globes); these limits leave room and stop a small file that asks for millions.
  const LOTTIE_PARTS = 20000, LOTTIE_WORK = 2500000, LOTTIE_NEST = 8;
  function lottieCost(o) {
    const assets = new Map();
    for (const a of o.assets || []) if (typeof a.id === 'string' && !assets.has(a.id)) assets.set(a.id, a);
    const sizes = new WeakMap();
    const sizeOf = v => {
      if (!v || typeof v !== 'object') return 1;
      if (sizes.has(v)) return sizes.get(v);
      let n = 1;
      for (const x of Array.isArray(v) ? v : Object.values(v)) n += sizeOf(x);
      sizes.set(v, n);
      return n;
    };
    const tooMuch = r => r[0] > LOTTIE_PARTS || r[1] > LOTTIE_WORK;
    // [parts, values] of a list of shapes
    const shapes = list => {
      if (list == null) return [0, 0];
      if (!Array.isArray(list)) return null;
      const r = [0, 0];
      for (const s of list) {
        if (!s || typeof s !== 'object' || !SHAPE_TY.has(s.ty)) return null;
        if ((s.ty === 'gf' || s.ty === 'gs') && !(s.g && Number.isInteger(s.g.p) && s.g.p >= 1 && s.g.p <= 64)) return null;   // gradient stops
        r[0] += 1;
        r[1] += sizeOf(s);
        if (s.ty === 'gr') { const k = shapes(s.it); if (!k) return null; r[0] += k[0]; r[1] += k[1] - sizeOf(s.it); }
        if (tooMuch(r)) return null;
      }
      return r;
    };
    const memo = new Map(), busy = new Set();
    // [parts, values, how many groups of layers deep] of a list of layers
    const layers = list => {
      const r = [0, 0, 0];
      for (const l of list) {
        r[0] += 1 + (Array.isArray(l.masksProperties) ? l.masksProperties.length : 0);
        r[1] += sizeOf(l);
        if (l.ty === 4) { const k = shapes(l.shapes); if (!k) return null; r[0] += k[0]; r[1] += k[1] - sizeOf(l.shapes); }
        if (l.ty === 0) {
          const id = l.refId;
          if (typeof id !== 'string' || !assets.has(id) || busy.has(id)) return null;   // missing, or a loop
          if (!memo.has(id)) { busy.add(id); memo.set(id, layers(assets.get(id).layers)); busy.delete(id); }
          const k = memo.get(id);
          if (!k) return null;
          r[0] += k[0]; r[1] += k[1]; r[2] = Math.max(r[2], k[2] + 1);
        }
        if (tooMuch(r) || r[2] > LOTTIE_NEST) return null;
      }
      return r;
    };
    return layers(o.layers);
  }
  function cleanLottie(o) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
    if (!Array.isArray(o.layers) || o.layers.length > 600) return null;
    if (!(+o.w > 0 && +o.w <= 4096 && +o.h > 0 && +o.h <= 4096 && +o.fr > 0 && +o.fr <= 120 && +o.op > +o.ip)) return null;
    // fonts would be loaded from somewhere; text layers need them
    if (o.fonts && Array.isArray(o.fonts.list) && o.fonts.list.length) return null;
    if (o.chars && o.chars.length) return null;
    let count = 0, bad = false;
    const layer = l => l && typeof l === 'object' && !Array.isArray(l) && LAYER_TY.has(l.ty) && (l.ty !== 1 || (typeof l.sc === 'string' && /^#[0-9a-f]{3,8}$/i.test(l.sc)));
    const walk = (v, depth, key) => {
      if (bad) return;
      if (++count > 600000 || depth > 90) { bad = true; return; }
      if (Array.isArray(v)) {
        if (key === 'layers' && !v.every(layer)) { bad = true; return; }   // pictures, text, sound and video are refused
        for (const x of v) { walk(x, depth + 1, ''); if (bad) return; }
        return;
      }
      if (v && typeof v === 'object') {
        if (typeof v.x === 'string') { bad = true; return; }            // an expression (code)
        if (typeof v.u === 'string' && v.u) { bad = true; return; }       // a folder or address for a file
        if (typeof v.p === 'string') { bad = true; return; }              // a picture or sound file (path, address or data)
        if (typeof v.e === 'number' && 'p' in v) { bad = true; return; }  // an embedded file
        // a layer's own id and class would land on the page as they are: they are left out
        if ('ln' in v) delete v.ln;
        if ('cl' in v) delete v.cl;
        for (const k of Object.keys(v)) { walk(v[k], depth + 1, k); if (bad) return; }
        return;
      }
      if (typeof v === 'string' && v.length > 2000) bad = true;
    };
    walk(o, 0, '');
    if (bad) return null;
    if (o.assets != null) {
      if (!Array.isArray(o.assets) || o.assets.length > 400) return null;
      for (const a of o.assets) if (!a || typeof a !== 'object' || !Array.isArray(a.layers)) return null;   // only groups of layers
    }
    // and not too much to build, once everything is counted where it is used
    if (!lottieCost(o)) return null;
    return o;
  }

  // ---------- the emoji preview sheets (WebP pictures) ----------
  // How big a WebP picture is drawn, read from its own header: a small file can say it is 16,000 x 16,000 pixels,
  // which takes about a gigabyte to draw. Every part that has a size is read (VP8: lossy, VP8L: lossless, VP8X: the
  // picture around them) and the largest counts. Returns { w, h }, or null when it is not a plain WebP picture (a
  // moving one, something else, or a header that does not add up).
  function webpSize(b) {
    if (!ArrayBuffer.isView(b) || b.BYTES_PER_ELEMENT !== 1 || b.length < 20) return null;
    const tag = i => String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]);
    const u32 = i => b[i] + b[i + 1] * 256 + b[i + 2] * 65536 + b[i + 3] * 16777216;
    if (tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return null;
    const end = Math.min(b.length, u32(4) + 8);
    let w = 0, h = 0, pics = 0;
    for (let i = 12; i + 8 <= end;) {
      const t = tag(i), n = u32(i + 4), d = i + 8;
      if (d + n > b.length) return null;
      if (t === 'VP8 ') {
        if (n < 10 || b[d + 3] !== 0x9d || b[d + 4] !== 0x01 || b[d + 5] !== 0x2a) return null;
        w = Math.max(w, (b[d + 6] | b[d + 7] << 8) & 0x3fff);
        h = Math.max(h, (b[d + 8] | b[d + 9] << 8) & 0x3fff);
        pics++;
      } else if (t === 'VP8L') {
        if (n < 5 || b[d] !== 0x2f) return null;
        w = Math.max(w, 1 + (b[d + 1] | (b[d + 2] & 0x3f) << 8));
        h = Math.max(h, 1 + ((b[d + 2] >> 6) | b[d + 3] << 2 | (b[d + 4] & 0x0f) << 10));
        pics++;
      } else if (t === 'VP8X') {
        if (n < 10 || b[d] & 0x02) return null;   // (a moving picture)
        w = Math.max(w, 1 + (b[d + 4] | b[d + 5] << 8 | b[d + 6] << 16));
        h = Math.max(h, 1 + (b[d + 7] | b[d + 8] << 8 | b[d + 9] << 16));
      } else if (t === 'ANIM' || t === 'ANMF') return null;
      i = d + n + (n & 1);   // (each part is padded to an even length)
    }
    return pics && w && h ? { w, h } : null;
  }
  // the largest sheet the list may have: twice the real ones (1280 x 640 pixels)
  const SHEET_MAX = { w: 2560, h: 1280 };
  const sheetOk = b => { const s = webpSize(b); return !!s && s.w <= SHEET_MAX.w && s.h <= SHEET_MAX.h; };

  // ---------- icons ----------
  // ["p", d] path, ["pf", d] filled path (with its outline), ["pn", d] filled path (no outline), ["c", cx, cy, r] circle,
  // ["cf", cx, cy, r] filled circle, ["e", cx, cy, rx, ry] ellipse, ["r", x, y, w, h, rx] box, ["l", x1, y1, x2, y2] line,
  // ["pl", "x,y x,y"] polyline, ["pg", "x,y ..."] polygon (all in a 24 x 24 box, drawn in the icon's own color)
  const ICON_N = { c: 3, cf: 3, e: 4, r: [4, 5], l: 4 };
  const near = v => typeof v === 'number' && Number.isFinite(v) && v >= -48 && v <= 72;
  // Icons that are never offered: logos and other marks of companies, products and organizations (Tabler puts most
  // of them in "brand-..."; these are the rest), pictures named after Apple's products, and one rude hand.
  const ICON_DENY = [
    /^brand-/,
    /^(bluetooth|nfc|usb|olympics|ce|creative-commons|playstation|xbox|michelin|lego|pokeball|markdown|face-id|live-photo)(-|$)/,
    /^device-(airpods|airtag|imac|ipad|vision-pro|nintendo)(-|$)/,
    /bitcoin/,
    /^(currency|coin)-(dogecoin|ethereum|litecoin|monero|nano|ripple|solana|xrp)$/,
    /^(mickey|pacman|polaroid|tex|shareplay|building-burj-al-arab|no-copyright|no-creative-commons|no-derivatives|file-excel|file-word|hand-middle-finger)$/
  ];
  const iconAllowed = name => typeof name === 'string' && /^[a-z0-9][a-z0-9-]{0,60}$/.test(name) && !ICON_DENY.some(r => r.test(name));
  function cleanIcon(nodes) {
    if (!Array.isArray(nodes) || !nodes.length || nodes.length > 80) return null;
    const out = [];
    let chars = 0;
    for (const n of nodes) {
      if (!Array.isArray(n) || typeof n[0] !== 'string') return null;
      const t = n[0], rest = n.slice(1);
      if (t === 'p' || t === 'pf' || t === 'pn') { if (rest.length !== 1 || !pathD(rest[0]) || rest[0].length > 6000) return null; chars += rest[0].length; out.push([t, rest[0]]); }
      else if (t === 'pl' || t === 'pg') { if (rest.length !== 1 || !nums(rest[0]) || rest[0].length > 2000) return null; chars += rest[0].length; out.push([t, rest[0]]); }
      else if (Object.hasOwn(ICON_N, t)) {
        const want = ICON_N[t];
        if (Array.isArray(want) ? !want.includes(rest.length) : rest.length !== want) return null;
        if (!rest.every(near)) return null;
        out.push([t, ...rest]);
      } else return null;
      if (chars > 12000) return null;
    }
    return out;
  }
  // an icon's parts as [tag, attributes] pairs (for the page to make, or for text in the tools). Colors are
  // "currentColor": the picture's own color decides them.
  function iconParts(nodes) {
    const ok = cleanIcon(nodes);
    if (!ok) return null;
    return ok.map(n => {
      const [t, a, b, c, d, e] = n;
      if (t === 'p') return ['path', { d: a }];
      if (t === 'pf') return ['path', { d: a, fill: 'currentColor' }];
      if (t === 'pn') return ['path', { d: a, fill: 'currentColor', stroke: 'none' }];
      if (t === 'c') return ['circle', { cx: a, cy: b, r: c }];
      if (t === 'cf') return ['circle', { cx: a, cy: b, r: c, fill: 'currentColor' }];
      if (t === 'e') return ['ellipse', { cx: a, cy: b, rx: c, ry: d }];
      if (t === 'r') return ['rect', { x: a, y: b, width: c, height: d, ...(e != null ? { rx: e } : {}) }];
      if (t === 'l') return ['line', { x1: a, y1: b, x2: c, y2: d }];
      return [t === 'pl' ? 'polyline' : 'polygon', { points: a }];
    });
  }
  function iconSvg(nodes, o = {}) {
    const parts = iconParts(nodes);
    if (!parts) return '';
    const col = hex(o.color) ? o.color : '#1f2937';
    const sw = Math.max(0.5, Math.min(4, +o.stroke || 2));
    const style = o.filled ? 'fill="currentColor" stroke="none"' : `fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" color="${col}" ${style}>` + parts.map(([t, a]) => '<' + t + Object.entries(a).map(([k, v]) => ` ${k}="${esc(String(v))}"`).join('') + '/>').join('') + '</svg>';
  }

  // ---------- shapes ----------
  const R = n => Math.round(n * 100) / 100;
  const P = (x, y) => R(x) + ' ' + R(y);
  const rad = d => d * Math.PI / 180;
  // a closed outline through points, with round corners of radius r (cut back along both edges)
  function poly(pts, r = 0) {
    if (!r) return 'M' + pts.map(p => P(p[0], p[1])).join('L') + 'Z';
    const n = pts.length;
    let d = '';
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const v1 = [p0[0] - p1[0], p0[1] - p1[1]], v2 = [p2[0] - p1[0], p2[1] - p1[1]];
      const l1 = Math.hypot(v1[0], v1[1]) || 1, l2 = Math.hypot(v2[0], v2[1]) || 1;
      const rr = Math.min(r, l1 / 2.05, l2 / 2.05);
      d += (i ? 'L' : 'M') + P(p1[0] + v1[0] / l1 * rr, p1[1] + v1[1] / l1 * rr) + 'Q' + P(p1[0], p1[1]) + ' ' + P(p1[0] + v2[0] / l2 * rr, p1[1] + v2[1] / l2 * rr);
    }
    return d + 'Z';
  }
  const regular = (n, cx, cy, r, rot = -90) => Array.from({ length: n }, (_, i) => { const a = rad(rot + i * 360 / n); return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const starPts = (n, cx, cy, r1, r2, rot = -90) => Array.from({ length: n * 2 }, (_, i) => { const a = rad(rot + i * 180 / n); const r = i % 2 ? r2 : r1; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  const circ = (cx, cy, r, ccw) => `M${P(cx - r, cy)}a${R(r)} ${R(r)} 0 1 ${ccw ? 0 : 1} ${R(r * 2)} 0a${R(r)} ${R(r)} 0 1 ${ccw ? 0 : 1} ${R(-r * 2)} 0Z`;
  const ell = (cx, cy, rx, ry, ccw) => `M${P(cx - rx, cy)}a${R(rx)} ${R(ry)} 0 1 ${ccw ? 0 : 1} ${R(rx * 2)} 0a${R(rx)} ${R(ry)} 0 1 ${ccw ? 0 : 1} ${R(-rx * 2)} 0Z`;
  function rrect(x, y, w, h, r, ccw) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!r) return ccw ? `M${P(x, y)}V${R(y + h)}H${R(x + w)}V${R(y)}Z` : `M${P(x, y)}H${R(x + w)}V${R(y + h)}H${R(x)}Z`;
    if (ccw) return `M${P(x + r, y)}A${R(r)} ${R(r)} 0 0 0 ${P(x, y + r)}V${R(y + h - r)}A${R(r)} ${R(r)} 0 0 0 ${P(x + r, y + h)}H${R(x + w - r)}A${R(r)} ${R(r)} 0 0 0 ${P(x + w, y + h - r)}V${R(y + r)}A${R(r)} ${R(r)} 0 0 0 ${P(x + w - r, y)}Z`;
    return `M${P(x + r, y)}H${R(x + w - r)}A${R(r)} ${R(r)} 0 0 1 ${P(x + w, y + r)}V${R(y + h - r)}A${R(r)} ${R(r)} 0 0 1 ${P(x + w - r, y + h)}H${R(x + r)}A${R(r)} ${R(r)} 0 0 1 ${P(x, y + h - r)}V${R(y + r)}A${R(r)} ${R(r)} 0 0 1 ${P(x + r, y)}Z`;
  }
  function scallop(n, cx, cy, r, bump = 0.55) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const a0 = i / n * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / n * 2 * Math.PI - Math.PI / 2;
      const p0 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r], p1 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r];
      const br = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * bump;
      d += (i ? '' : 'M' + P(p0[0], p0[1])) + `A${R(br)} ${R(br)} 0 0 1 ${P(p1[0], p1[1])}`;
    }
    return d + 'Z';
  }
  function superellipse(cx, cy, a, b, k = 4, steps = 72) {
    const pts = [];
    for (let i = 0; i < steps; i++) {
      const t = i / steps * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
      pts.push([cx + Math.sign(c) * Math.pow(Math.abs(c), 2 / k) * a, cy + Math.sign(s) * Math.pow(Math.abs(s), 2 / k) * b]);
    }
    return 'M' + pts.map(p => P(p[0], p[1])).join('L') + 'Z';
  }
  // turn points around the middle of a w x h box (for arrows pointing other ways)
  const turn = (pts, deg, w = 100, h = 100) => pts.map(([x, y]) => { const a = rad(deg), dx = x - w / 2, dy = y - h / 2; return [w / 2 + dx * Math.cos(a) - dy * Math.sin(a), h / 2 + dx * Math.sin(a) + dy * Math.cos(a)]; });
  const wave = (w, h, n, amp, y0) => { let d = `M0 ${R(y0)}`; for (let i = 0; i < n; i++) { const x0 = i * w / n, x1 = (i + 1) * w / n; d += `Q${P(x0 + w / n / 4, y0 - amp)} ${P(x0 + w / n / 2, y0)}T${P(x1, y0)}`; } return d; };
  const zig = (w, n, amp, y0) => { let d = `M0 ${R(y0)}`; for (let i = 0; i < n; i++) d += `L${P((i + 0.5) * w / n, y0 + (i % 2 ? amp : -amp))}`; return d + `L${P(w, y0)}`; };

  const SHAPES = new Map();
  const SHAPE_GROUPS = [];
  // { id, name, group, d(o) -> path, vb: [w, h], keep (keeps its shape), rule: 'evenodd', line (a line, drawn with its
  //   outline color and width), round (takes Round corners), dash: stroke dashes for lines }
  function shape(group, id, name, d, o = {}) {
    if (!SHAPE_GROUPS.includes(group)) SHAPE_GROUPS.push(group);
    SHAPES.set(id, { id, name, group, d: typeof d === 'function' ? d : () => d, vb: o.vb || [100, 100], keep: !!o.keep, rule: o.rule || '', line: !!o.line, round: !!o.round, dash: o.dash || '', cap: o.cap || 'round' });
  }
  const rr = o => Math.max(0, Math.min(50, +o.round || 0));
  // -- basics (the first eight are the Shape widget's old ones, unchanged)
  shape('Basics', 'rect', 'Box', o => rrect(0, 0, 100, 100, rr(o)), { round: true });
  shape('Basics', 'pill', 'Pill', () => rrect(0, 0, 100, 100, 50));
  shape('Basics', 'circle', 'Circle', () => circ(50, 50, 48), { keep: true });
  shape('Blobs', 'blob', 'Soft blob', 'M71 14c13 8 24 22 24 37s-9 31-24 38-34 8-48-1S0 62 3 47s15-30 30-36 25-5 38 3Z', { keep: true });
  shape('Lines and dividers', 'line', 'Line', 'M0 46H100V54H0Z');
  shape('Lines and dividers', 'wave', 'Wave', 'M0 60C17 45 33 45 50 58s33 13 50-2V100H0Z');
  shape('Polygons', 'triangle', 'Triangle', o => poly([[50, 2], [98, 98], [2, 98]], rr(o) / 2), { keep: true, round: true });
  shape('Stars and bursts', 'star', 'Star', 'M50 4l13.5 28 30.5 4.5-22 21.5 5.2 30.5L50 74 22.8 88.5 28 58 6 36.5l30.5-4.5Z', { keep: true });
  shape('Basics', 'square', 'Square', o => rrect(2, 2, 96, 96, rr(o)), { keep: true, round: true });
  shape('Basics', 'rounded', 'Rounded square', o => rrect(2, 2, 96, 96, Math.max(8, rr(o) || 22)), { keep: true, round: true });
  shape('Basics', 'squircle', 'Squircle', () => superellipse(50, 50, 48, 48, 4.4), { keep: true });
  shape('Basics', 'oval', 'Oval', () => ell(50, 50, 50, 50), {});
  shape('Basics', 'half', 'Half circle', () => 'M0 50A50 50 0 0 1 100 50Z', { keep: true, vb: [100, 50] });
  shape('Basics', 'quarter', 'Quarter circle', () => 'M0 100V0A100 100 0 0 1 100 100Z', { keep: true });
  shape('Basics', 'drop', 'Drop', 'M50 4C50 4 84 44 84 64A34 34 0 0 1 16 64C16 44 50 4 50 4Z', { keep: true });
  shape('Basics', 'egg', 'Egg', 'M50 4C74 4 90 40 90 62C90 84 72 96 50 96S10 84 10 62C10 40 26 4 50 4Z', { keep: true });
  shape('Basics', 'lens', 'Lens', 'M50 4C78 24 78 76 50 96C22 76 22 24 50 4Z', { keep: true });
  // -- polygons (with round corners)
  const polys = [['triangle-right', 'Right triangle', [[4, 4], [96, 96], [4, 96]]], ['diamond', 'Diamond', [[50, 2], [98, 50], [50, 98], [2, 50]]],
    ['parallelogram', 'Parallelogram', [[24, 6], [98, 6], [76, 94], [2, 94]]], ['trapezoid', 'Trapezoid', [[22, 10], [78, 10], [98, 90], [2, 90]]],
    ['triangle-down', 'Triangle down', [[2, 4], [98, 4], [50, 96]]]];
  for (const [id, name, pts] of polys) shape('Polygons', id, name, o => poly(pts, rr(o) / 2), { keep: id !== 'parallelogram' && id !== 'trapezoid', round: true });
  for (const [n, name] of [[5, 'Pentagon'], [6, 'Hexagon'], [7, 'Heptagon'], [8, 'Octagon'], [9, 'Nonagon'], [10, 'Decagon'], [12, 'Dodecagon']])
    shape('Polygons', 'poly' + n, name, o => poly(regular(n, 50, 50, 48, n % 2 ? -90 : -90 + 180 / n), rr(o) / 2), { keep: true, round: true });
  shape('Polygons', 'hex-flat', 'Hexagon (flat)', o => poly(regular(6, 50, 50, 48, 0), rr(o) / 2), { keep: true, round: true });
  shape('Polygons', 'cross', 'Plus', o => poly([[36, 4], [64, 4], [64, 36], [96, 36], [96, 64], [64, 64], [64, 96], [36, 96], [36, 64], [4, 64], [4, 36], [36, 36]], rr(o) / 4), { keep: true, round: true });
  shape('Polygons', 'x-mark', 'Times', o => poly(turn([[38, 4], [62, 4], [62, 38], [96, 38], [96, 62], [62, 62], [62, 96], [38, 96], [38, 62], [4, 62], [4, 38], [38, 38]], 45), rr(o) / 4), { keep: true, round: true });
  // -- stars and bursts
  shape('Stars and bursts', 'sparkle', '4-point sparkle', 'M50 2C53 34 66 47 98 50C66 53 53 66 50 98C47 66 34 53 2 50C34 47 47 34 50 2Z', { keep: true });
  for (const [n, inner, id, name] of [[4, 0.42, 'star4', '4-point star'], [5, 0.48, 'star5', 'Star (bold)'], [6, 0.55, 'star6', '6-point star'], [7, 0.5, 'star7', '7-point star'], [8, 0.5, 'star8', '8-point star'], [10, 0.6, 'star10', '10-point star'], [12, 0.7, 'star12', '12-point star']])
    shape('Stars and bursts', id, name, o => poly(starPts(n, 50, 52, 48, 48 * inner), rr(o) / 3), { keep: true, round: true });
  shape('Stars and bursts', 'star-round', 'Round star', () => poly(starPts(5, 50, 53, 48, 24), 7), { keep: true });
  shape('Stars and bursts', 'star-thin', 'Thin star', () => poly(starPts(5, 50, 53, 48, 17)), { keep: true });
  for (const [n, inner, id, name] of [[12, 0.8, 'burst12', 'Burst (12)'], [16, 0.82, 'burst16', 'Burst (16)'], [24, 0.86, 'burst24', 'Burst (24)'], [32, 0.9, 'burst32', 'Burst (32)'], [20, 0.72, 'burst-spiky', 'Spiky burst']])
    shape('Stars and bursts', id, name, () => poly(starPts(n, 50, 50, 49, 49 * inner)), { keep: true });
  for (const [n, id, name] of [[8, 'scallop8', 'Scalloped (8)'], [12, 'scallop12', 'Scalloped (12)'], [16, 'scallop16', 'Scalloped (16)'], [24, 'scallop24', 'Scalloped (24)']])
    shape('Stars and bursts', id, name, () => scallop(n, 50, 50, 44, n > 12 ? 0.6 : 0.56), { keep: true });
  shape('Stars and bursts', 'flower', 'Flower', () => [0, 1, 2, 3, 4, 5].map(i => { const a = rad(i * 60 - 90); return circ(50 + Math.cos(a) * 25, 50 + Math.sin(a) * 25, 22); }).join('') + circ(50, 50, 22), { keep: true });
  shape('Stars and bursts', 'sun', 'Sun', () => circ(50, 50, 26) + regular(12, 50, 50, 1, -90).map((_, i) => { const a = rad(i * 30 - 90), b = rad(i * 30 - 90 - 7), c = rad(i * 30 - 90 + 7); return poly([[50 + Math.cos(a) * 49, 50 + Math.sin(a) * 49], [50 + Math.cos(c) * 33, 50 + Math.sin(c) * 33], [50 + Math.cos(b) * 33, 50 + Math.sin(b) * 33]]); }).join(''), { keep: true });
  // -- badges and seals (holes are part of the shape)
  shape('Badges and seals', 'rosette', 'Rosette', () => scallop(18, 50, 50, 46, 0.6) + circ(50, 50, 34, true), { keep: true, rule: 'evenodd' });
  shape('Badges and seals', 'seal', 'Seal', () => poly(starPts(24, 50, 50, 49, 44)), { keep: true });
  shape('Badges and seals', 'seal-ring', 'Seal with a ring', () => poly(starPts(28, 50, 50, 49, 45)) + circ(50, 50, 38, true) + circ(50, 50, 35), { keep: true, rule: 'evenodd' });
  shape('Badges and seals', 'stamp', 'Stamp', () => circ(50, 50, 48) + circ(50, 50, 42, true) + circ(50, 50, 38), { keep: true, rule: 'evenodd' });
  shape('Badges and seals', 'award', 'Award ribbon', () => circ(50, 38, 34) + poly([[30, 62], [40, 98], [50, 86], [60, 98], [70, 62], [60, 68], [40, 68]]), { keep: true, vb: [100, 100] });
  shape('Badges and seals', 'hex-badge', 'Hexagon badge', () => poly(regular(6, 50, 50, 48), 6) + poly(regular(6, 50, 50, 38), 4).replace(/^M/, 'M'), { keep: true, rule: 'evenodd' });
  shape('Badges and seals', 'star-badge', 'Star badge', () => poly(starPts(5, 50, 54, 48, 26), 4) + circ(50, 54, 12, true), { keep: true, rule: 'evenodd' });
  shape('Badges and seals', 'price-tag', 'Price tag', () => poly([[4, 50], [28, 14], [96, 14], [96, 86], [28, 86]], 6) + circ(26, 50, 7, true), { rule: 'evenodd', vb: [100, 100] });
  shape('Badges and seals', 'ticket', 'Ticket', () => 'M8 14H92A6 6 0 0 0 98 20V38A12 12 0 0 0 98 62V80A6 6 0 0 0 92 86H8A6 6 0 0 0 2 80V62A12 12 0 0 0 2 38V20A6 6 0 0 0 8 14Z');
  shape('Badges and seals', 'coupon', 'Coupon', () => 'M6 10H94V34A16 16 0 0 0 94 66V90H6V66A16 16 0 0 0 6 34Z');
  // -- shields
  shape('Shields', 'shield', 'Shield', 'M50 3L91 16V45C91 71 73 89 50 97C27 89 9 71 9 45V16Z', { keep: true });
  shape('Shields', 'shield-round', 'Round shield', 'M50 3C64 9 78 12 91 12V46C91 72 72 89 50 97C28 89 9 72 9 46V12C22 12 36 9 50 3Z', { keep: true });
  shape('Shields', 'shield-heater', 'Heater shield', 'M8 6H92V40C92 68 74 86 50 96C26 86 8 68 8 40Z', { keep: true });
  shape('Shields', 'shield-crest', 'Crest', 'M10 4H40L50 12L60 4H90V48C90 74 72 90 50 97C28 90 10 74 10 48Z', { keep: true });
  shape('Shields', 'shield-wide', 'Wide shield', 'M4 8H96V36C96 64 74 84 50 94C26 84 4 64 4 36Z', { vb: [100, 100] });
  shape('Shields', 'shield-frame', 'Shield outline', 'M50 3L91 16V45C91 71 73 89 50 97C27 89 9 71 9 45V16ZM50 13L19 23V45C19 65 33 80 50 87C67 80 81 65 81 45V23Z', { keep: true, rule: 'evenodd' });
  // -- arches and windows
  shape('Arches and windows', 'arch', 'Arch', 'M0 100V48A50 48 0 0 1 100 48V100Z');
  shape('Arches and windows', 'arch-tall', 'Tall arch', 'M10 100V40A40 40 0 0 1 90 40V100Z', { keep: true });
  shape('Arches and windows', 'arch-pointed', 'Pointed arch', 'M6 100V52C6 26 24 8 50 2C76 8 94 26 94 52V100Z', { keep: true });
  shape('Arches and windows', 'window', 'Arch window', 'M6 100V46A44 44 0 0 1 94 46V100ZM16 92H84V46A34 34 0 0 0 16 46Z', { keep: true, rule: 'evenodd' });
  shape('Arches and windows', 'door', 'Door', 'M14 100V40A36 36 0 0 1 86 40V100ZM24 92H76V40A26 26 0 0 0 24 40Z', { keep: true, rule: 'evenodd' });
  shape('Arches and windows', 'dome', 'Dome', 'M0 100V70C0 30 22 6 50 6S100 30 100 70V100Z');
  // -- ribbons and banners
  shape('Ribbons and banners', 'banner', 'Banner', 'M16 24H84V70H16ZM16 34H2L10 50 2 66H16ZM84 34H98L90 50 98 66H84Z', { vb: [100, 100] });
  shape('Ribbons and banners', 'ribbon-end', 'Ribbon end', 'M0 20H100V80H0L16 50Z');
  shape('Ribbons and banners', 'ribbon-ends', 'Ribbon', 'M0 20H100L86 50 100 80H0L14 50Z');
  shape('Ribbons and banners', 'tab', 'Tab', 'M0 22H82L100 50 82 78H0Z');
  shape('Ribbons and banners', 'bookmark', 'Bookmark', 'M18 2H82V98L50 74 18 98Z', { keep: true });
  shape('Ribbons and banners', 'flag', 'Flag', 'M8 8C30 0 50 18 92 8V62C50 72 30 54 8 62Z');
  shape('Ribbons and banners', 'pennant', 'Pennant', 'M4 6L98 50 4 94Z');
  shape('Ribbons and banners', 'banner-wave', 'Wavy banner', 'M2 28C30 14 70 42 98 28V72C70 86 30 58 2 72Z');
  shape('Ribbons and banners', 'label', 'Label', 'M0 20H90A10 10 0 0 1 100 30V70A10 10 0 0 1 90 80H0L10 50Z');
  // -- speech bubbles
  shape('Speech bubbles', 'bubble', 'Speech bubble', () => rrect(2, 4, 96, 70, 18) + 'M22 70L14 96 46 70Z', { vb: [100, 100] });
  shape('Speech bubbles', 'bubble-right', 'Speech bubble (right)', () => rrect(2, 4, 96, 70, 18) + 'M78 70L86 96 54 70Z');
  shape('Speech bubbles', 'bubble-round', 'Round bubble', () => ell(50, 40, 48, 36) + 'M24 64L14 96 46 72Z');
  shape('Speech bubbles', 'bubble-round-right', 'Round bubble (right)', () => ell(50, 40, 48, 36) + 'M76 64L86 96 54 72Z');
  shape('Speech bubbles', 'bubble-square', 'Square bubble', () => rrect(2, 2, 96, 72, 4) + 'M18 72V96L40 72Z');
  shape('Speech bubbles', 'thought', 'Thought bubble', () => 'M22 62C8 62 2 50 8 40 2 28 14 16 26 20 30 6 50 4 58 14 70 4 88 10 88 24 98 30 98 46 88 52 92 64 76 70 66 64 58 74 40 74 34 64 30 66 26 64 22 62Z' + circ(20, 80, 7) + circ(9, 93, 4.5), { keep: true });
  shape('Speech bubbles', 'shout', 'Shout bubble', () => poly(starPts(14, 50, 46, 48, 36).map((p, i) => i % 4 === 1 ? [p[0], p[1] + 2] : p)) + 'M30 74L18 98 48 80Z', { keep: true });
  shape('Speech bubbles', 'bubble-pill', 'Pill bubble', () => rrect(2, 10, 96, 56, 28) + 'M26 62L22 92 48 64Z');
  // -- arrows
  const ARROW = [[0, 36], [58, 36], [58, 14], [100, 50], [58, 86], [58, 64], [0, 64]];
  shape('Arrows', 'arrow-right', 'Arrow right', o => poly(ARROW, rr(o) / 6), { round: true });
  shape('Arrows', 'arrow-left', 'Arrow left', o => poly(turn(ARROW, 180), rr(o) / 6), { round: true });
  shape('Arrows', 'arrow-up', 'Arrow up', o => poly(turn(ARROW, -90), rr(o) / 6), { keep: true, round: true });
  shape('Arrows', 'arrow-down', 'Arrow down', o => poly(turn(ARROW, 90), rr(o) / 6), { keep: true, round: true });
  shape('Arrows', 'arrow-diagonal', 'Arrow (corner)', o => poly(turn(ARROW.map(([x, y]) => [x * 0.86 + 7, y * 0.86 + 7]), -45), rr(o) / 6), { keep: true, round: true });
  shape('Arrows', 'arrow-double', 'Double arrow', o => poly([[0, 50], [26, 14], [26, 36], [74, 36], [74, 14], [100, 50], [74, 86], [74, 64], [26, 64], [26, 86]], rr(o) / 6), { round: true });
  shape('Arrows', 'arrow-notched', 'Notched arrow', o => poly([[0, 22], [70, 22], [100, 50], [70, 78], [0, 78], [22, 50]], rr(o) / 6), { round: true });
  shape('Arrows', 'arrow-big', 'Big-head arrow', o => poly([[0, 40], [40, 40], [40, 4], [100, 50], [40, 96], [40, 60], [0, 60]], rr(o) / 6), { round: true });
  shape('Arrows', 'arrow-thin', 'Thin arrow', 'M4 50H94M74 30L96 50 74 70', { line: true });
  shape('Arrows', 'arrow-thin-double', 'Thin double arrow', 'M6 50H94M26 30L4 50 26 70M74 30L96 50 74 70', { line: true });
  shape('Arrows', 'arrow-curve', 'Curved arrow', 'M8 86C12 44 40 22 80 22M62 6L82 22 62 38', { line: true, keep: true });
  shape('Arrows', 'arrow-uturn', 'U-turn arrow', 'M22 92V40A26 26 0 0 1 74 40V70M56 54L74 72 92 54', { line: true, keep: true });
  shape('Arrows', 'arrow-circle', 'Circle arrow', 'M86 50A36 36 0 1 1 72 21M58 8L74 21 60 36', { line: true, keep: true });
  shape('Arrows', 'arrow-bend', 'Bent arrow', 'M10 90V50A20 20 0 0 1 30 30H88M70 12L90 30 70 48', { line: true, keep: true });
  shape('Arrows', 'arrow-curve-block', 'Curved block arrow', 'M6 96C6 54 30 28 66 26V8L98 38 66 68V50C42 52 26 70 26 96Z', { keep: true });
  // -- chevrons
  shape('Chevrons', 'chevron', 'Chevron', o => poly([[0, 0], [62, 0], [100, 50], [62, 100], [0, 100], [38, 50]], rr(o) / 6), { round: true });
  shape('Chevrons', 'chevron-left', 'Chevron left', o => poly(turn([[0, 0], [62, 0], [100, 50], [62, 100], [0, 100], [38, 50]], 180), rr(o) / 6), { round: true });
  shape('Chevrons', 'chevron-up', 'Chevron up', o => poly(turn([[0, 0], [62, 0], [100, 50], [62, 100], [0, 100], [38, 50]], -90), rr(o) / 6), { keep: true, round: true });
  shape('Chevrons', 'chevron-down', 'Chevron down', o => poly(turn([[0, 0], [62, 0], [100, 50], [62, 100], [0, 100], [38, 50]], 90), rr(o) / 6), { keep: true, round: true });
  shape('Chevrons', 'chevron-double', 'Double chevron', () => poly([[0, 0], [30, 0], [56, 50], [30, 100], [0, 100], [26, 50]]) + poly([[44, 0], [74, 0], [100, 50], [74, 100], [44, 100], [70, 50]]));
  shape('Chevrons', 'step', 'Process step', o => poly([[0, 0], [84, 0], [100, 50], [84, 100], [0, 100], [16, 50]], rr(o) / 6), { round: true });
  shape('Chevrons', 'step-first', 'First step', o => poly([[0, 0], [84, 0], [100, 50], [84, 100], [0, 100]], rr(o) / 6), { round: true });
  // -- frames (the middle is empty)
  shape('Frames', 'frame', 'Frame', o => rrect(0, 0, 100, 100, rr(o)) + rrect(9, 9, 82, 82, Math.max(0, rr(o) - 9), true), { rule: 'evenodd', round: true });
  shape('Frames', 'frame-thin', 'Thin frame', o => rrect(0, 0, 100, 100, rr(o)) + rrect(4, 4, 92, 92, Math.max(0, rr(o) - 4), true), { rule: 'evenodd', round: true });
  shape('Frames', 'frame-round', 'Rounded frame', () => rrect(0, 0, 100, 100, 18) + rrect(9, 9, 82, 82, 10, true), { rule: 'evenodd' });
  shape('Frames', 'ring', 'Ring', () => circ(50, 50, 48) + circ(50, 50, 38, true), { keep: true, rule: 'evenodd' });
  shape('Frames', 'ring-thin', 'Thin ring', () => circ(50, 50, 48) + circ(50, 50, 44, true), { keep: true, rule: 'evenodd' });
  shape('Frames', 'ring-double', 'Double ring', () => circ(50, 50, 48) + circ(50, 50, 44, true) + circ(50, 50, 38) + circ(50, 50, 35, true), { keep: true, rule: 'evenodd' });
  shape('Frames', 'frame-oval', 'Oval frame', () => ell(50, 50, 50, 50) + ell(50, 50, 42, 40, true), { rule: 'evenodd' });
  shape('Frames', 'frame-hex', 'Hexagon frame', () => poly(regular(6, 50, 50, 48), 3) + poly(regular(6, 50, 50, 38), 2), { keep: true, rule: 'evenodd' });
  shape('Frames', 'frame-arch', 'Arch frame', 'M0 100V48A50 48 0 0 1 100 48V100ZM9 91H91V48A41 39 0 0 0 9 48Z', { rule: 'evenodd' });
  shape('Frames', 'corners', 'Corners', 'M4 30V4H30M70 4H96V30M96 70V96H70M30 96H4V70', { line: true });
  shape('Frames', 'brackets', 'Brackets', 'M30 4H8V96H30M70 4H92V96H70', { line: true });
  // -- lines and dividers
  shape('Lines and dividers', 'line-thin', 'Thin line', 'M2 50H98', { line: true, vb: [100, 100] });
  shape('Lines and dividers', 'line-dashed', 'Dashed line', 'M2 50H98', { line: true, dash: '14 10', cap: 'butt' });
  shape('Lines and dividers', 'line-dotted', 'Dotted line', 'M4 50H96', { line: true, dash: '0.1 14' });
  shape('Lines and dividers', 'line-wavy', 'Wavy line', () => wave(100, 100, 6, 14, 50), { line: true });
  shape('Lines and dividers', 'line-zigzag', 'Zigzag line', () => zig(100, 14, 12, 50), { line: true, cap: 'round' });
  shape('Lines and dividers', 'line-double', 'Double line', 'M2 42H98M2 58H98', { line: true });
  shape('Lines and dividers', 'line-dots', 'Line with dot ends', 'M14 50H86M2 50a6 6 0 1 0 12 0a6 6 0 1 0-12 0M86 50a6 6 0 1 0 12 0a6 6 0 1 0-12 0', { line: true });
  shape('Lines and dividers', 'line-arrow', 'Line with an arrow', 'M2 50H94M78 36L96 50 78 64', { line: true });
  shape('Lines and dividers', 'line-ornament', 'Ornament line', 'M2 50H40M60 50H98M50 40L60 50 50 60 40 50Z', { line: true });
  shape('Lines and dividers', 'line-vertical', 'Up and down line', 'M50 2V98', { line: true });
  // -- blobs
  const BLOBS = ['M64 8c18 5 30 24 30 42s-11 36-30 42-40 2-52-12S2 42 12 26 46 3 64 8Z', 'M50 4c22 0 40 14 44 34s-6 44-26 52-46 4-58-14S0 30 14 18 28 4 50 4Z',
    'M70 10c14 8 26 22 24 40s-16 32-32 40-38 6-50-8-10-40 2-56S56 2 70 10Z', 'M54 6c16 2 34 10 38 26s-4 30 0 44-14 24-32 20-28-10-42-20S2 46 10 30 38 4 54 6Z',
    'M46 6c20-4 44 6 48 26s-10 26-6 42-22 28-40 20-36-4-42-24 6-28 6-40S26 10 46 6Z', 'M58 4c20 4 38 22 36 44s-24 30-36 42-34 8-46-8-8-36 4-52S38 0 58 4Z',
    'M50 2c14 0 22 12 34 16s14 22 10 36-6 30-22 38-36 4-48-8S4 56 6 40 36 2 50 2Z'];
  BLOBS.forEach((d, i) => shape('Blobs', 'blob' + (i + 2), 'Blob ' + (i + 2), d, { keep: true }));
  // -- nature and symbols
  shape('Nature and symbols', 'heart', 'Heart', 'M50 92C22 72 4 54 4 32C4 16 16 6 30 6C40 6 46 12 50 20C54 12 60 6 70 6C84 6 96 16 96 32C96 54 78 72 50 92Z', { keep: true });
  shape('Nature and symbols', 'cloud', 'Cloud', 'M24 82C12 82 4 74 4 63S12 44 24 45C25 30 38 20 52 21C62 10 82 14 86 32C96 34 100 44 98 54S88 82 76 82Z', { vb: [100, 100] });
  shape('Nature and symbols', 'leaf', 'Leaf', 'M10 92C6 52 30 14 92 8C96 62 62 92 10 92Z', { keep: true });
  shape('Nature and symbols', 'moon', 'Moon', 'M62 4A46 46 0 1 0 96 70A38 38 0 1 1 62 4Z', { keep: true });
  shape('Nature and symbols', 'bolt', 'Lightning', 'M58 2L14 56H44L36 98 86 38H54Z', { keep: true });
  shape('Nature and symbols', 'pin', 'Map pin', () => 'M50 98C50 98 14 60 14 36A36 36 0 0 1 86 36C86 60 50 98 50 98Z' + circ(50, 36, 13, true), { keep: true, rule: 'evenodd' });
  shape('Nature and symbols', 'check', 'Check', o => poly([[4, 52], [18, 38], [38, 58], [82, 14], [96, 28], [38, 86]], rr(o) / 6), { keep: true, round: true });
  shape('Nature and symbols', 'house', 'House', o => poly([[50, 4], [96, 44], [84, 44], [84, 96], [16, 96], [16, 44], [4, 44]], rr(o) / 6), { keep: true, round: true });
  shape('Nature and symbols', 'tree', 'Tree', 'M50 2L84 46H66L90 76H58V98H42V76H10L34 46H16Z', { keep: true });
  shape('Nature and symbols', 'bell', 'Bell', 'M50 6C68 6 78 22 78 42V64L90 78H10L22 64V42C22 22 32 6 50 6ZM40 84H60A10 10 0 0 1 40 84Z', { keep: true });
  shape('Nature and symbols', 'crown', 'Crown', 'M8 82L4 24 30 48 50 12 70 48 96 24 92 82Z', { keep: true });
  shape('Nature and symbols', 'gem', 'Gem', 'M24 10H76L98 36 50 94 2 36Z', { keep: true });
  shape('Nature and symbols', 'puzzle', 'Puzzle piece', 'M14 26H38A12 12 0 1 1 62 26H86V50A12 12 0 1 1 86 74V98H62A12 12 0 1 0 38 98H14V74A12 12 0 1 0 14 50Z', { keep: true });
  shape('Nature and symbols', 'infinity', 'Infinity', 'M50 50C40 34 30 28 20 28A22 22 0 0 0 20 72C30 72 40 66 50 50S70 28 80 28A22 22 0 0 1 80 72C70 72 60 66 50 50Z', { line: true });

  function shapeSvg(id, o = {}) {
    const s = SHAPES.get(id) || SHAPES.get('rect');
    const [vw, vh] = s.vb;
    let d = '';
    try { d = s.d(o); } catch (e) { d = ''; }
    if (!pathD(d)) d = '';
    const fill = hex(o.fill) ? o.fill : '#ff6b5e';
    const lw = Math.max(0, Math.min(20, +o.line || 0));
    const lc = hex(o.lineColor) ? o.lineColor : '#ffffff';
    const attrs = s.line
      ? `fill="none" stroke="${fill}" stroke-width="${Math.max(2, lw || 6)}" stroke-linecap="${s.cap}" stroke-linejoin="round"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''} vector-effect="non-scaling-stroke"`
      : `fill="${fill}"${s.rule ? ` fill-rule="${s.rule}"` : ''}${lw ? ` stroke="${lc}" stroke-width="${lw}" vector-effect="non-scaling-stroke"` : ''}`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vw} ${vh}" preserveAspectRatio="${s.keep ? 'xMidYMid meet' : 'none'}"><path d="${esc(d)}" ${attrs}/></svg>`;
  }

  // ---------- search (with a few words that mean the same) ----------
  const SYN = [
    ['happy', 'smile', 'glad', 'joy', 'yay', 'fun', 'cheerful'], ['sad', 'cry', 'tear', 'unhappy', 'sorry'], ['love', 'heart', 'like', 'romance', 'valentine', 'kiss'],
    ['party', 'celebrate', 'celebration', 'birthday', 'balloon', 'confetti', 'festive'], ['thanks', 'thank you', 'grateful', 'appreciate', 'thx'],
    ['hello', 'hi', 'hey', 'welcome', 'greeting', 'wave'], ['bye', 'goodbye', 'see you', 'later'], ['sale', 'deal', 'discount', 'offer', 'promo', 'off', 'save', 'bargain'],
    ['food', 'eat', 'meal', 'snack', 'lunch', 'dinner', 'restaurant'], ['drink', 'coffee', 'tea', 'cafe', 'beverage', 'cup'], ['cat', 'kitty', 'kitten'], ['dog', 'puppy', 'pup'],
    ['cool', 'awesome', 'great', 'nice', 'wow', 'amazing'], ['money', 'cash', 'dollar', 'pay', 'price', 'cost'], ['time', 'clock', 'hour', 'watch', 'schedule'],
    ['weather', 'sun', 'rain', 'snow', 'cloud'], ['winter', 'snow', 'cold', 'christmas', 'holiday'], ['summer', 'sun', 'beach', 'hot'], ['fall', 'autumn', 'leaf', 'leaves', 'pumpkin'],
    ['spring', 'flower', 'bloom', 'easter'], ['halloween', 'spooky', 'ghost', 'pumpkin', 'witch'], ['school', 'class', 'study', 'teacher', 'book', 'learn'],
    ['work', 'office', 'job', 'business', 'meeting'], ['arrow', 'point', 'direction', 'this way'], ['star', 'sparkle', 'shine', 'twinkle', 'glitter'],
    ['new', 'fresh', 'just in'], ['open', 'welcome', 'come in'], ['closed', 'shut', 'back soon'], ['win', 'winner', 'trophy', 'award', 'prize', 'first'],
    ['laugh', 'lol', 'funny', 'haha'], ['wow', 'omg', 'surprise', 'shock'], ['music', 'song', 'dance', 'party'], ['sport', 'game', 'ball', 'team'],
    ['phone', 'call', 'mobile'], ['mail', 'email', 'letter', 'message'], ['home', 'house'], ['car', 'auto', 'vehicle', 'drive'], ['health', 'doctor', 'medical', 'hospital'],
    ['check', 'done', 'ok', 'yes', 'tick'], ['no', 'stop', 'cancel', 'x', 'wrong'], ['ghost', 'boo', 'spooky'], ['bubble', 'speech', 'chat', 'talk', 'say'],
    ['frame', 'border'], ['line', 'divider', 'separator'], ['badge', 'seal', 'stamp', 'label', 'tag']
  ];
  const SYN_MAP = new Map();
  for (const g of SYN) for (const w of g) SYN_MAP.set(w, [...new Set([...(SYN_MAP.get(w) || []), ...g])]);
  const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9% ]+/g, ' ').replace(/\s+/g, ' ').trim();
  // items: [{ name, tags, cat }]; returns the matching ones, best first (an empty search keeps the order)
  const HAY = typeof WeakMap === 'function' ? new WeakMap() : null;
  function words(it, extra) {
    if (!extra && HAY && HAY.has(it)) return HAY.get(it);
    const w = { name: norm(it.name), hay: ' ' + norm([it.name, ...(Array.isArray(it.tags) ? it.tags : []), it.cat || '', extra ? extra(it) : ''].join(' ')) + ' ' };
    if (!extra && HAY && it && typeof it === 'object') HAY.set(it, w);
    return w;
  }
  function search(items, q, o = {}) {
    const wanted = norm(q).split(' ').filter(Boolean).slice(0, 8);
    if (!wanted.length) return items.slice();
    const scored = [];
    for (const it of items) {
      const { name, hay } = words(it, o.extra);
      let score = 0, all = true;
      for (const w of wanted) {
        const alts = SYN_MAP.get(w) || [w];
        let best = 0;
        for (const a of alts) {
          const exact = a === w;
          if (name === a) best = Math.max(best, exact ? 12 : 7);
          else if ((' ' + name + ' ').includes(' ' + a + ' ')) best = Math.max(best, exact ? 9 : 5);
          else if (name.startsWith(a)) best = Math.max(best, exact ? 7 : 4);
          else if (hay.includes(' ' + a + ' ')) best = Math.max(best, exact ? 5 : 3);
          // (part of a word only for what was typed: a word that means the same must match a whole word, or "tea"
          // for coffee would find "steam")
          else if (exact && a.length > 2 && hay.includes(a)) best = Math.max(best, 2);
        }
        if (!best) { all = false; break; }
        score += best;
      }
      if (all) scored.push([score, it]);
    }
    return scored.sort((a, b) => b[0] - a[0]).map(x => x[1]);
  }

  return { cleanNodes, cleanCss, stickerSvg, stickerVariant, recolorMap, recolorText, svgUri, cleanLottie, LOTTIE_TYPE, LOTTIE_MAX, cleanIcon, iconParts, iconSvg, iconAllowed,
    stickerSvgOk, webpSize, sheetOk, SHEET_MAX,
    SHAPES, SHAPE_GROUPS, shapeSvg, search, norm, FONT_STACK, hex };
})();
