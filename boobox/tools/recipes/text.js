// Words in a sticker are drawn as outlines (paths), made from the fonts that come with Blokvane (SIL Open Font
// License), so a sticker looks the same on every computer and TV (a picture can't load fonts).
'use strict';
const path = require('path');
const fs = require('fs');

const FILES = { anton: 'anton-400.woff2', alfa: 'alfaslab-400.woff2', fredoka: 'fredoka-600.woff2', unbounded: 'unbounded-800.woff2', pacifico: 'pacifico-400.woff2',
  outfit: 'outfit-800.woff2', caveat: 'caveat-700.woff2', neon: 'tiltneon-400.woff2', playfair: 'playfair-700.woff2' };
let dir = '';
const fonts = {};
function setFontDir(d) {
  if (!d || !fs.existsSync(path.join(d, FILES.anton))) throw new Error('The fonts folder was not found. Point --ext at the blokvane folder of the extension (the one with fonts/ in it).');
  dir = d;
}
function font(k) {
  if (!FILES[k]) throw new Error('No font called ' + k);
  if (!fonts[k]) {
    if (!dir) throw new Error('Set the fonts folder first (--ext).');
    fonts[k] = require('fontkit').openSync(path.join(dir, FILES[k]));
  }
  return fonts[k];
}
const round = d => d.replace(/-?\d*\.\d+/g, m => String(Math.round(parseFloat(m) * 10) / 10));
// words as one outline. o: { font, size (letter height in px for capitals), cx, cy (the middle of the capitals),
// spacing (extra space between letters, in px), maxW (made smaller to fit), lines (line gap in em, for \n) }
function words(str, o) {
  const f = font(o.font || 'anton');
  const cap = (f.capHeight || f.unitsPerEm * 0.7) / f.unitsPerEm;
  let size = o.size / cap;              // font size that gives capitals o.size tall
  const lines = String(str).split('\n');
  const measure = (s, sz) => { const run = f.layout(s); let w = 0; for (const p of run.positions) w += p.xAdvance; return w * sz / f.unitsPerEm + Math.max(0, s.length - 1) * (o.spacing || 0); };
  let widest = Math.max(...lines.map(l => measure(l, size)));
  if (o.maxW && widest > o.maxW) { size *= o.maxW / widest; widest = o.maxW; }
  const capPx = size * cap, gap = (o.lines || 1.25) * capPx;
  const totalH = capPx + gap * (lines.length - 1);
  let d = '';
  lines.forEach((l, i) => {
    const run = f.layout(l);
    const lw = measure(l, size);
    let x = o.cx - lw / 2;
    const base = o.cy - totalH / 2 + capPx + i * gap;
    run.glyphs.forEach((gl, j) => {
      const pos = run.positions[j];
      const p = gl.path.scale(size / f.unitsPerEm, -size / f.unitsPerEm).translate(x + pos.xOffset * size / f.unitsPerEm, base - pos.yOffset * size / f.unitsPerEm);
      d += p.toSVG();
      x += pos.xAdvance * size / f.unitsPerEm + (o.spacing || 0);
    });
  });
  return { d: round(d), w: widest, h: totalH };
}
module.exports = { setFontDir, words, FILES };
