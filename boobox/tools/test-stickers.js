// Tests for the Boo Box sticker recipes (run: node --test boobox/tools/test-stickers.js; BLOKVANE_EXT can name the
// extension folder). Every sticker is made the way build.js makes it and checked the way Blokvane checks it, and the
// stickers that Blokvane's sticky notes wear (lib/note-stickers.json in the extension) are the ones the recipes make.
// Nothing in this repo or in the extension is changed: what is made goes to a folder in the temp folder.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const TOOLS = __dirname;
const EXT = require('../../tools/kit.js').findExt();
const ctx = {};
vm.runInNewContext(fs.readFileSync(path.join(TOOLS, 'boo-core.js'), 'utf8'), ctx, { filename: 'boo-core.js' });
const BV = ctx.BVBoo;
require('./recipes/text').setFontDir(path.join(EXT, 'fonts'));
const ORDER = require('./recipes/order').STICKER_GROUPS;
const FILES = fs.readdirSync(path.join(TOOLS, 'recipes')).filter(f => /^stickers-.*\.js$/.test(f)).sort();
const PACKS = FILES.map(f => ({ f, mod: require('./recipes/' + f) }));
const ALL = PACKS.flatMap(p => p.mod.LIST().map(st => ({ st, f: p.f })));

test('every sticker passes Blokvane\'s checks, moving and still, and no two stickers have the same name', () => {
  const ids = new Set();
  for (const { st, f } of ALL) {
    assert.ok(BV.stickerSvg(st), `${st.id} (${f})`);
    const still = BV.stickerSvg(st, { still: true });
    assert.ok(still && !/<style/.test(still), `${st.id}: the still picture has no motion`);
    assert.ok(!ids.has(st.id), 'two stickers are called ' + st.id);
    ids.add(st.id);
  }
  assert.ok(ALL.length >= 600, ALL.length + ' stickers');
});

test('each sticker is light and each pack fits in one download (2.5 MB)', () => {
  for (const { st } of ALL) assert.ok(JSON.stringify(st).length <= 40000, `${st.id}: ${JSON.stringify(st).length} bytes`);
  const byCat = new Map();
  for (const { st } of ALL) byCat.set(st.cat, (byCat.get(st.cat) || 0) + JSON.stringify(st).length + 2);
  for (const [cat, n] of byCat) assert.ok(n < 2.5e6, `${cat}: ${n} bytes`);
});

test('every group has its place in Boo Box (the order of the chips), and every name and search word reads well', () => {
  const cats = new Set(ALL.map(x => x.st.cat));
  for (const c of cats) assert.ok(ORDER.includes(c), 'not in order.js: ' + c);
  for (const { st } of ALL) {
    assert.ok(st.name && st.name.length <= 80, st.id);
    assert.ok(Array.isArray(st.tags) && st.tags.length >= 3, st.id + ': search words');
    // (Blokvane's words never use the long dash)
    assert.doesNotMatch([st.name, ...st.tags].join(' '), /\u2014/, st.id);
  }
});

test('the stickers Blokvane\'s sticky notes wear are made from these recipes, and the copy in the extension is up to date', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-notestk-'));
  try {
    fs.mkdirSync(path.join(dir, 'lib'));
    fs.symlinkSync(path.join(EXT, 'fonts'), path.join(dir, 'fonts'), 'junction');
    const r = spawnSync(process.execPath, [path.join(TOOLS, 'note-stickers.js'), '--ext', dir], { encoding: 'utf8', timeout: 120000 });
    assert.strictEqual(r.status, 0, r.stderr || r.stdout);
    const made = JSON.parse(fs.readFileSync(path.join(dir, 'lib', 'note-stickers.json'), 'utf8'));
    const shipped = JSON.parse(fs.readFileSync(path.join(EXT, 'lib', 'note-stickers.json'), 'utf8'));
    assert.ok(made.stickers.length >= 40);
    assert.deepStrictEqual(shipped.stickers.map(s => s.id), made.stickers.map(s => s.id), 'the same stickers');
    for (let i = 0; i < made.stickers.length; i++) assert.strictEqual(shipped.stickers[i].svg, made.stickers[i].svg, 'up to date: ' + made.stickers[i].id + ' (run note-stickers.js again)');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
