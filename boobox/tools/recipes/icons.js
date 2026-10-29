// The icons in Elements: Tabler Icons by Paweł Kuna (MIT license, https://tabler.io/icons), without logos of
// companies, products or organizations: the brand-* icons and the others on the list in boo-core.js (BV.iconAllowed)
// are left out. Each icon is turned into a short list of plain shapes (paths, circles,
// boxes) that Blokvane draws itself: no SVG file is ever shown as it came. Saved as elements/icons/<group>.json, one
// icon per line: { n: name, c: group, t: search words, o: outline shapes, f: filled shapes (when there is a filled one) }.
'use strict';
const fs = require('fs');
const path = require('path');

const RENAME = { '': 'More', Sytem: 'System', 'E-commerce': 'Shopping', Brand: '' };
const num = v => { const n = +v; return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : NaN; };
const FRAME = /^M0 0h24v24H0z$/i;

// Tabler's nodes ([tag, attributes]) as Blokvane's icon shapes. filledSet: the shapes of a filled icon (drawn filled,
// with no outline). Returns null when something does not fit (that icon or its filled form is then left out).
function convert(nodes, filledSet) {
  const out = [];
  for (const [tag, a0] of nodes) {
    const a = a0 || {};
    if (tag === 'path') {
      const d = String(a.d || '').trim();
      if (!d || FRAME.test(d)) continue;
      if (a.stroke === 'none' && (!a.fill || a.fill === 'none')) continue;
      if (filledSet) { if (a.fill === 'none') return null; out.push(['p', d]); continue; }
      if (a.fill === 'currentColor') out.push([a.stroke === 'none' ? 'pn' : 'pf', d]);
      else out.push(['p', d]);
    } else if (tag === 'circle') {
      const c = [num(a.cx), num(a.cy), num(a.r)];
      if (c.some(Number.isNaN)) return null;
      out.push([!filledSet && a.fill === 'currentColor' ? 'cf' : 'c', ...c]);
    } else if (tag === 'rect') {
      const b = [num(a.x || 0), num(a.y || 0), num(a.width), num(a.height)];
      if (b.some(Number.isNaN)) return null;
      if (a.rx != null) b.push(num(a.rx));
      out.push(['r', ...b]);
    } else if (tag === 'ellipse') {
      const e = [num(a.cx), num(a.cy), num(a.rx), num(a.ry)];
      if (e.some(Number.isNaN)) return null;
      out.push(['e', ...e]);
    } else if (tag === 'line') {
      const l = [num(a.x1), num(a.y1), num(a.x2), num(a.y2)];
      if (l.some(Number.isNaN)) return null;
      out.push(['l', ...l]);
    } else if (tag === 'polyline' || tag === 'polygon') {
      out.push([tag === 'polyline' ? 'pl' : 'pg', String(a.points || '').trim()]);
    } else return null;
  }
  return out.length ? out : null;
}

function build({ pkg, out, BV, writeList, say }) {
  const read = f => JSON.parse(fs.readFileSync(path.join(pkg, f), 'utf8'));
  const outline = read('tabler-nodes-outline.json'), filled = read('tabler-nodes-filled.json'), meta = read('icons.json');
  const byCat = new Map();
  const skipped = [];
  let logos = 0, marks = 0, withFilled = 0;
  for (const name of Object.keys(outline).sort()) {
    const m = meta[name] || {};
    if (name.startsWith('brand-') || m.category === 'Brand') { logos++; continue; }
    if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(name)) { skipped.push(name); continue; }
    if (!BV.iconAllowed(name)) { marks++; continue; }
    const o = convert(outline[name], false);
    const oc = o && BV.cleanIcon(o);
    if (!oc) { skipped.push(name); continue; }
    let f = filled[name] ? convert(filled[name], true) : null;
    if (f && !BV.cleanIcon(f)) f = null;
    if (f) withFilled++;
    const cat = Object.hasOwn(RENAME, m.category || '') ? RENAME[m.category || ''] : m.category;
    const tags = [...new Set([...(m.tags || []).map(t => String(t).toLowerCase()), ...name.split('-').filter(w => w.length > 1 && !/^\d+$/.test(w))])].filter(t => t.length <= 32).slice(0, 16);
    const item = { n: name, c: cat, t: tags, o };
    if (f) item.f = f;
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(item);
  }
  const dir = path.join(out, 'icons');
  fs.rmSync(dir, { recursive: true, force: true });
  const packs = [];
  let count = 0;
  for (const cat of [...byCat.keys()].sort((a, b) => (a === 'More') - (b === 'More') || a.localeCompare(b))) {
    const file = 'icons/' + cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.json';
    writeList(path.join(out, file), 'icons', byCat.get(cat));
    packs.push(file);
    count += byCat.get(cat).length;
  }
  fs.copyFileSync(path.join(pkg, 'LICENSE'), path.join(out, 'LICENSE'));
  say('  icons', count, 'in', packs.length, 'groups,', withFilled, 'with a filled form;', logos, 'brand icons and', marks, 'other logos and marks left out');
  if (skipped.length) say('  left out (they did not fit the checks):', skipped.join(', '));
  return { count, packs, source: 'Tabler Icons ' + (read('package.json').version || '') };
}
module.exports = { build, convert };
