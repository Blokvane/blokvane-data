#!/usr/bin/env node
// Builds Blokvane's Boo Box and Elements lists (blokvane-data/boobox and blokvane-data/elements).
//
//   node build.js --ext <the extension's blokvane folder>
//       stickers, words and moving backgrounds from the recipes in tools/recipes, and boobox/index.json
//   node build.js --ext <...> --emoji <folder of Noto Emoji Animation Lottie files> --emoji-meta <folder>
//       the animated emoji too (--emoji-meta: a folder with the emojilib and unicode-emoji-json packages and the
//       animated_emoji package's emojis.g.dart, for names, groups and search words)
//   node build.js --icons <the @tabler/icons package folder>
//       the Elements icons (logos of companies, products and organizations are left out)
//
// Then: node check.js (checks everything the way Blokvane will), and node sheet.js (pictures to look at, and the
// emoji preview sheets). Needs Node 18 or newer, and "npm install" once in this folder (for the font reader).
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TOOLS = __dirname;
const BOO = path.resolve(TOOLS, '..');
const DATA = path.resolve(BOO, '..');
const ELEMENTS = path.join(DATA, 'elements');

const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ''; };
const core = () => { const ctx = {}; vm.runInNewContext(fs.readFileSync(path.join(TOOLS, 'boo-core.js'), 'utf8'), ctx, { filename: 'boo-core.js' }); return ctx.BVBoo; };
const BV = core();
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
// one item per line, so a change shows up as a small difference in git
const writeList = (file, key, items, extra = {}) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const head = Object.keys(extra).length ? JSON.stringify(extra).slice(1, -1) + ',' : '';
  fs.writeFileSync(file, `{${head}"${key}":[\n` + items.map(x => JSON.stringify(x)).join(',\n') + '\n]}\n');
};
const today = () => new Date().toISOString().slice(0, 10);
const say = (...a) => console.log(...a);

// what makes a sticker fail the checks (the first part that does)
function why(st) {
  if (BV.cleanCss(st.css || '') == null) {
    const bad = (st.css.match(/[^\w\s#.%(),:;{}\-@!*]/g) || []).join('');
    return 'its motion (CSS)' + (bad ? ': these letters are not allowed: ' + bad : ': ' + st.css.slice(0, 200));
  }
  const walk = (nodes, trail) => {
    for (const n of nodes) {
      if (!BV.cleanNodes([n])) {
        if (Array.isArray(n[2])) { const deeper = walk(n[2], trail + ' > ' + n[0]); if (deeper) return deeper; }
        const one = [n[0], n[1] || {}];
        if (!BV.cleanNodes([one])) {
          for (const [k, v] of Object.entries(n[1] || {})) if (!BV.cleanNodes([[n[0], { [k]: v }]])) return trail + ' > ' + n[0] + ': ' + k + '="' + String(v).slice(0, 80) + '"';
          return trail + ' > ' + n[0];
        }
        return trail + ' > ' + n[0] + ' (its text or parts)';
      }
    }
    return '';
  };
  return walk(st.n, 'svg') || 'too many parts or too deep';
}
function readIndex(file, fresh) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fresh; } }

// ---------------------------------------------------------------- stickers, words, moving backgrounds
function buildOurs(ext) {
  const T = require('./recipes/text');
  T.setFontDir(path.join(ext, 'fonts'));
  const files = fs.readdirSync(path.join(TOOLS, 'recipes')).filter(f => /^stickers-.*\.js$/.test(f)).sort();
  const byCat = new Map();
  const seen = new Set();
  for (const f of files) {
    const mod = require('./recipes/' + f);
    for (const st of mod.LIST()) {
      if (seen.has(st.id)) throw new Error('Two stickers are called ' + st.id);
      seen.add(st.id);
      if (!BV.stickerSvg(st)) throw new Error('Sticker ' + st.id + ' does not pass the checks (' + f + '): ' + why(st));
      if (!byCat.has(st.cat)) byCat.set(st.cat, []);
      byCat.get(st.cat).push(st);
    }
  }
  const order = require('./recipes/order').STICKER_GROUPS;
  const packs = [];
  for (const cat of [...order.filter(c => byCat.has(c)), ...[...byCat.keys()].filter(c => !order.includes(c))]) {
    const name = 'stickers/' + slug(cat) + '.json';
    writeList(path.join(BOO, name), 'stickers', byCat.get(cat));
    packs.push(name);
    say('  stickers', cat, byCat.get(cat).length);
  }
  const W = require('./recipes/words').LIST();
  writeList(path.join(BOO, 'words/words.json'), 'words', W);
  say('  words', W.length);
  const S = require('./recipes/scenes').LIST();
  writeList(path.join(BOO, 'scenes/scenes.json'), 'scenes', S);
  say('  scenes', S.length);
  return { stickers: { count: seen.size, packs }, words: { count: W.length, packs: ['words/words.json'] }, scenes: { count: S.length, packs: ['scenes/scenes.json'] } };
}

// ---------------------------------------------------------------- animated emoji
function buildEmoji(src, metaDir) {
  return require('./recipes/emoji').build({ src, metaDir, out: path.join(BOO, 'emoji'), BV, writeList, say });
}

// ---------------------------------------------------------------- icons
function buildIcons(pkg) {
  return require('./recipes/icons').build({ pkg, out: ELEMENTS, BV, writeList, say });
}

function main() {
  const ext = arg('--ext'), emoji = arg('--emoji'), meta = arg('--emoji-meta'), icons = arg('--icons');
  if (!ext && !icons) {
    console.log('Usage: node build.js --ext <blokvane folder> [--emoji <folder> --emoji-meta <folder>] [--icons <@tabler/icons folder>]');
    process.exit(2);
  }
  if (ext) {
    say('Boo Box');
    const idxFile = path.join(BOO, 'index.json');
    const idx = readIndex(idxFile, { v: 1, tabs: {} });
    Object.assign(idx.tabs, buildOurs(path.resolve(ext)));
    if (emoji) idx.tabs.emoji = buildEmoji(path.resolve(emoji), path.resolve(meta || emoji));
    if (!idx.tabs.emoji) say('  (no emoji yet: run with --emoji and --emoji-meta)');
    idx.v = 1;
    idx.updated = today();
    idx.note = 'Boo Box for the Blokvane Signage Studio. Stickers, words and moving backgrounds: made by Blokvane. Animated emoji: Noto Emoji Animation by Google, CC BY 4.0 (see emoji/NOTICE).';
    const ordered = { v: idx.v, updated: idx.updated, note: idx.note, tabs: {} };
    for (const k of ['stickers', 'emoji', 'words', 'scenes']) if (idx.tabs[k]) ordered.tabs[k] = idx.tabs[k];
    fs.writeFileSync(idxFile, JSON.stringify(ordered, null, 1) + '\n');
  }
  if (icons) {
    say('Elements');
    const r = buildIcons(path.resolve(icons));
    fs.writeFileSync(path.join(ELEMENTS, 'index.json'), JSON.stringify({ v: 1, updated: today(), note: 'Elements for the Blokvane Signage Studio. Icons: Tabler Icons by Paweł Kuna, MIT license (see LICENSE). Logos of companies, products and organizations are left out.', icons: r }, null, 1) + '\n');
  }
  say('Done. Now run: node check.js');
}
if (require.main === module) main();
module.exports = { core };
