#!/usr/bin/env node
// What a template spec can use, read from Blokvane's own code (so it is never out of date):
//
//   node tools/kit-info.js [what] [path to the extension folder]
//
//   what: recipes, palettes, fonts, categories, colors, holidays, art (the drawings), or all (the default)
'use strict';
const { findExt, load } = require('./kit');

const KINDS = ['recipes', 'palettes', 'fonts', 'categories', 'colors', 'holidays', 'art'];
const args = process.argv.slice(2);
const what = args.find(a => KINDS.includes(a) || a === 'all') || 'all';
const { B, K } = load(findExt(args.find(a => !KINDS.includes(a) && a !== 'all' && !a.startsWith('--'))));
const show = k => what === 'all' || what === k;
const wrap = (words, indent = '    ', width = 110) => {
  const lines = [];
  let line = indent;
  for (const w of words) { if (line.length + w.length + 2 > width && line.trim()) { lines.push(line.replace(/,\s*$/, ',')); line = indent; } line += w + ', '; }
  if (line.trim()) lines.push(line.replace(/,\s*$/, ''));
  return lines.join('\n');
};

if (show('recipes')) {
  console.log('RECIPES (the options each one reads; every recipe also takes back, art, fx, bg, and kick/title/sub with their *Style)');
  for (const r of Object.keys(K.RECIPES)) {
    const opts = [...new Set([...K.RECIPES[r].toString().matchAll(/\bo\.([a-zA-Z0-9_]+)/g)].map(m => m[1]))].filter(o => !['p', 'palette'].includes(o));
    console.log(`  ${K.NEW_RECIPES.includes(r) ? '*' : ' '} ${r.padEnd(12)} ${opts.join(' ')}`);
  }
  console.log('  (* newer recipes: made for palettes, with a strong wide and tall version each)\n');
}
if (show('palettes')) {
  console.log('PALETTES (' + K.ROLES.map(r => `${r} = ${K.ROLE_NAMES[r].toLowerCase()}`).join(', ') + ')');
  for (const p of K.PALETTES) console.log(`  ${p.id.padEnd(10)} ${p.name.padEnd(16)} ${K.ROLES.map(r => p[r]).join(' ')}`);
  console.log('');
}
if (show('fonts')) {
  console.log('FONT PAIRS (fonts: "<id>"; big words, small words, little script touches)');
  for (const f of K.FONT_PAIRS) console.log(`  ${f.id.padEnd(10)} ${f.name.padEnd(12)} ${f.head} / ${f.body} / ${f.script}`);
  console.log(`  Fonts that come with Blokvane: ${K.BUNDLED_FONTS.join(', ')}\n`);
}
if (show('categories')) {
  console.log('CATEGORIES (cat), in their groups');
  for (const g of K.GROUPS) console.log(`  ${g.name}: ${g.cats.join(', ')}`);
  console.log('');
}
if (show('colors')) console.log('COLORS (color, for the color filter)\n  ' + Object.keys(B.TEMPLATE_COLORS).join(', ') + '\n');
if (show('holidays')) {
  console.log('HOLIDAYS (when: "<id>")');
  console.log(wrap(B.HOLIDAYS.map(h => `${h.id} (${h.name})`), '  ') + '\n');
}
if (show('art')) {
  console.log(`DRAWINGS (${B.ART_LIST.length}; art: [["<id>", ["c1", "c2", "c3"]]], colors optional)`);
  for (const g of B.ART_GROUPS) console.log(`  ${g}:\n${wrap(B.ART_LIST.filter(a => a.group === g).map(a => a.id))}`);
}
