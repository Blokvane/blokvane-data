#!/usr/bin/env node
// Builds the stickers Blokvane's sticky notes on websites can wear (blokvane/lib/note-stickers.json): a small set of
// Boo Box stickers, made from the same recipes, as still pictures (no motion: a note on a web page stays calm).
//
//   node note-stickers.js --ext <the extension's blokvane folder>
//
// Each picture is checked the way Blokvane checks every sticker (boo-core.js) before it is written.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TOOLS = __dirname;
const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ''; };
const ext = arg('--ext');
if (!ext) { console.log('Usage: node note-stickers.js --ext <blokvane folder>'); process.exit(2); }
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(TOOLS, 'boo-core.js'), 'utf8'), ctx, { filename: 'boo-core.js' });
const BV = ctx.BVBoo;
require('./recipes/text').setFontDir(path.join(path.resolve(ext), 'fonts'));

// the set, in the order the picker shows it (pack file: sticker ids)
const PICK = [
  ['notes', ['washi-dots', 'washi-stripes', 'washi-hearts', 'washi-stars', 'washi-words', 'done', 'top-priority', 'important', 'dont-forget', 'thank-you', 'well-done', 'remember']],
  ['reactions', ['great-idea', 'plus-one', 'love-it', 'yes', 'nope', 'wow', 'nailed-it', 'oops', 'hmm', 'good-job', 'on-fire', 'mind-blown', 'noted', 'lol']],
  ['vibes', ['you-got-this', 'be-kind', 'drink-water', 'smile', 'proud-of-you', 'you-shine']],
  ['work', ['coffee-first', 'deadline-mode', 'do-not-disturb', 'todo-everything']],
  ['school', ['a-plus', 'gold-star', 'due-today']],
  ['detective', ['top-secret', 'confidential', 'clue']],
  ['code', ['ship-it', 'lgtm', 'save-often']],
  ['puns', ['donut-worry', 'egg-cellent']],
  ['sassy', ['not-today', 'plot-twist', 'big-mood']]
];
const out = [];
for (const [file, ids] of PICK) {
  const list = require('./recipes/stickers-' + file + '.js').LIST();
  for (const id of ids) {
    const st = list.find(s => s.id.replace(/^[a-z]+-/, '') === id);
    if (!st) throw new Error(`No sticker ${id} in stickers-${file}.js`);
    const svg = BV.stickerSvg(st, { still: true });
    if (!svg) throw new Error(`Sticker ${st.id} does not pass the checks`);
    // (and the notes' own rules, in bg-notes.js and notes-common.js: a sticker that breaks them is left out of the notes)
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(st.id)) throw new Error(`Sticker ${st.id}: a note sticker's name starts with a letter, then letters, numbers and dashes (64 at most)`);
    if (svg.length > 60000 || !svg.startsWith('<svg')) throw new Error(`Sticker ${st.id}: a note sticker's picture is at most 60,000 characters (it is ${svg.length})`);
    out.push({ id: st.id, name: st.name, svg });
  }
}
const file = path.join(path.resolve(ext), 'lib', 'note-stickers.json');
const body = { v: 1, note: 'Stickers for Blokvane sticky notes on websites. Made by Blokvane (Boo Box recipes), free to use with Blokvane.', stickers: out };
fs.writeFileSync(file, '{"v":1,"note":' + JSON.stringify(body.note) + ',"stickers":[\n' + out.map(s => JSON.stringify(s)).join(',\n') + '\n]}\n');
console.log(`${out.length} stickers, ${Math.round(fs.statSync(file).size / 1024)} KB: ${file}`);
