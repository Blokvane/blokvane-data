#!/usr/bin/env node
// Builds Boo's reactions for Watch together (blokvane/lib/watch-boo.js): Boo Box stickers of Boo, Blokvane's ghost,
// as moving pictures, each with the short name the party panel shows and what Boo does over the video (fx, played by
// blokvane/features/watch-client.js).
//
//   node watch-boo.js --ext <the extension's blokvane folder>
//
// Each picture is checked the way Blokvane checks every sticker (boo-core.js) before it is written, and every
// reaction must be in the party's own list of reactions (BOOS in blokvane/lib/wt-sync.js).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TOOLS = __dirname;
const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ''; };
const ext = arg('--ext');
if (!ext) { console.log('Usage: node watch-boo.js --ext <blokvane folder>'); process.exit(2); }
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(TOOLS, 'boo-core.js'), 'utf8'), ctx, { filename: 'boo-core.js' });
const BV = ctx.BVBoo;
const pack = JSON.parse(fs.readFileSync(path.join(TOOLS, '..', 'stickers', 'boo.json'), 'utf8'));
const sync = fs.readFileSync(path.join(path.resolve(ext), 'lib', 'wt-sync.js'), 'utf8');

// the reactions, in the order the panel shows them: [reaction, sticker, short name, what Boo does over the video]
//   pop: pops up and floats away      bounce: bounces with laughter    hearts: floats up in a trail of hearts
//   side: hides behind a side edge    rain: sinks in the rain          drift: dozes along the top edge
//   slide: glides along the bottom    confetti: pops in a confetti rain
//   spin: spins in, dizzy             scare: jumps out at the middle   peek: peeks over the bottom edge
//   wave: waves from a bottom corner  stomp: drops in with a thud      spot: lands in a spotlight
//   fly: flies across like a hero
const PICK = [
  ['boo:laugh', 'boo-laugh', 'Haha', 'bounce'],
  ['boo:wow', 'boo-starstruck', 'Wow', 'pop'],
  ['boo:love', 'boo-love', 'Love it', 'hearts'],
  ['boo:scary', 'boo-nervous', 'Scary', 'side'],
  ['boo:sad', 'boo-sad', 'Sad', 'rain'],
  ['boo:boring', 'boo-sleepy', 'Boring', 'drift'],
  ['boo:cool', 'boo-cool', 'Cool', 'slide'],
  ['boo:party', 'boo-party', 'Party', 'confetti'],
  ['boo:mind', 'boo-dizzy', 'OMG', 'spin'],
  ['boo:boo', 'boo-wow', 'Boo!', 'scare'],
  ['boo:peek', 'boo-peek', 'Peekaboo', 'peek'],
  ['boo:hi', 'boo-hello', 'Hi!', 'wave'],
  ['boo:ugh', 'boo-grumpy', 'Ugh', 'stomp'],
  ['boo:legend', 'boo-king', 'Legend', 'spot'],
  ['boo:hero', 'boo-hero', 'Hero', 'fly']
];
const FX = new Set(['pop', 'bounce', 'hearts', 'side', 'rain', 'drift', 'slide', 'confetti', 'spin', 'scare', 'peek', 'wave', 'stomp', 'spot', 'fly']);
const out = [];
for (const [id, sid, name, fx] of PICK) {
  if (!/^boo:[a-z]{2,12}$/.test(id)) throw new Error(`Reaction ${id}: "boo:" and then 2 to 12 small letters`);
  if (!sync.includes(`'${id}'`)) throw new Error(`Reaction ${id} is not in BOOS in lib/wt-sync.js (add it there too, or the party drops it)`);
  if (!FX.has(fx)) throw new Error(`Reaction ${id}: no fx called ${fx}`);
  const st = pack.stickers.find(s => s.id === sid);
  if (!st) throw new Error(`No sticker ${sid} in stickers/boo.json`);
  const svg = BV.stickerSvg(st);
  if (!svg) throw new Error(`Sticker ${sid} does not pass the checks`);
  if (svg.length > 30000 || !svg.startsWith('<svg')) throw new Error(`Sticker ${sid}: a reaction's picture is at most 30,000 characters (it is ${svg.length})`);
  out.push({ id, name, fx, svg });
}
const file = path.join(path.resolve(ext), 'lib', 'watch-boo.js');
fs.writeFileSync(file, `// Watch together: Boo's reactions. Made by blokvane-data/boobox/tools/watch-boo.js from Boo Box (stickers drawn by
// Blokvane), so change that tool, not this file. Each picture is a sticker that passed Boo Box's own checks: a picture
// only, nothing in it can run. The party panel (watch-panel.js) shows them to pick from, and features/watch-client.js
// plays them over the video (fx).
var BVWATCH_BOO = (() => {
  const LIST = [
${out.map(b => '    ' + JSON.stringify(b)).join(',\n')}
  ];
  const by = new Map(LIST.map(b => [b.id, b]));
  const uri = id => { const b = by.get(id); return b ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(b.svg) : ''; };
  return { LIST, IDS: LIST.map(b => b.id), get: id => by.get(id) || null, uri };
})();
`);
console.log(`${out.length} Boo reactions, ${Math.round(fs.statSync(file).size / 1024)} KB: ${file}`);
