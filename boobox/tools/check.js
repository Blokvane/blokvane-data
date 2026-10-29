#!/usr/bin/env node
// Checks the Boo Box and Elements lists the way Blokvane will read them, before they are published:
//   node check.js
// Every sticker, emoji, word, moving background and icon must pass Blokvane's own checks (the very same code, in
// boo-core.js), every file the lists name must be there, and nothing may be bigger than Blokvane accepts.
// Prints what is wrong and ends with an error code when anything is.
'use strict';
const fs = require('fs');
const path = require('path');

const TOOLS = __dirname;
const BOO = path.resolve(TOOLS, '..');
const DATA = path.resolve(BOO, '..');
const ELEMENTS = path.join(DATA, 'elements');
const BV = require('./build').core();

// what Blokvane accepts (the same as lib/signage-panels.js and the word art and moving background widgets)
const okPath = p => typeof p === 'string' && /^[a-z0-9][a-z0-9_.\/-]{0,160}\.(json|webp)$/i.test(p) && !p.includes('..') && !p.includes('//') && !p.includes('/.');
const okId = v => typeof v === 'string' && /^[a-z0-9][a-z0-9-]{0,60}$/.test(v);
const MAX = { index: 200000, pack: 2500000, emojiList: 800000, sheet: 1500000 };
const PER_PACK = { stickers: 1500, words: 1500, scenes: 1500, icons: 4000 };
const EFFECTS = ['solid', 'shadow', 'glow', 'neon', 'outline', 'retro', 'echo', 'gradient', 'extrude', 'sticker', 'stamp', 'highlight', 'chalk', 'arc'];
const FONTS = ['system', 'serif', 'mono', 'rounded', 'condensed', 'slab', 'display', 'elegant', 'hand', 'poster', 'geo', 'bubbly', 'tall', 'wide', 'fashion', 'heavyslab', 'script', 'retro', 'marker', 'neon'];
const WORD_MOTIONS = ['none', 'flicker', 'pulse', 'float', 'sway', 'bounce', 'wave', 'typewriter', 'jelly', 'rainbow', 'pop', 'wiggle', 'glow', 'shake'];
const SCENE_FX = ['rain', 'bokeh', 'aurora', 'waves', 'fireflies', 'streamers', 'meteors', 'clouds', 'glitter', 'embers'];
const OLD_FX = ['confetti', 'snow', 'hearts', 'leaves', 'stars', 'bubbles', 'petals', 'fireworks', 'balloons', 'sparkles'];
const BACKS = ['none', 'night', 'ocean', 'dusk', 'ink', 'sky', 'sunset', 'forest', 'berry', 'candy', 'gold', 'own'];
const TONES = ['light', 'medium-light', 'medium', 'medium-dark', 'dark'];
const STICKER_GROUPS = require('./recipes/order').STICKER_GROUPS;
const EMOJI_GROUPS = ['Smileys', 'People', 'Animals', 'Food', 'Travel', 'Activities', 'Objects', 'Symbols'];

const problems = [];
const bad = (where, what) => { problems.push(where + ': ' + what); };
const size = f => fs.statSync(f).size;
const readJson = (f, max, where) => {
  if (!fs.existsSync(f)) { bad(where, 'missing'); return null; }
  if (max && size(f) > max) bad(where, `too big (${size(f)} bytes, Blokvane takes up to ${max})`);
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { bad(where, 'not valid JSON: ' + e.message); return null; }
};
const hexList = v => String(v || '').split(/[,\s]+/).filter(Boolean).every(BV.hex);
const counts = {};

// ---------------------------------------------------------------- Boo Box
const idx = readJson(path.join(BOO, 'index.json'), MAX.index, 'boobox/index.json');
if (idx) {
  if (!idx.tabs || typeof idx.tabs !== 'object') bad('boobox/index.json', 'no tabs');
  for (const tab of ['stickers', 'words', 'scenes']) {
    const t = idx.tabs && idx.tabs[tab];
    if (!t) { bad('boobox/index.json', 'no ' + tab); continue; }
    const seen = new Set();
    let n = 0;
    for (const p of t.packs || []) {
      const where = 'boobox/' + p;
      if (!okPath(where)) { bad('boobox/index.json', 'Blokvane would not download ' + p); continue; }
      const j = readJson(path.join(BOO, p), MAX.pack, where);
      if (!j) continue;
      const items = j[tab];
      if (!Array.isArray(items)) { bad(where, 'no ' + tab + ' list'); continue; }
      if (items.length > PER_PACK[tab]) bad(where, `${items.length} in one pack (Blokvane reads ${PER_PACK[tab]})`);
      for (const x of items) {
        const w = where + ' ' + (x && x.id);
        if (!x || !okId(x.id)) { bad(w, 'bad id'); continue; }
        if (seen.has(x.id)) bad(w, 'the same id twice');
        seen.add(x.id);
        if (typeof x.name !== 'string' || !x.name || x.name.length > 60) bad(w, 'its name');
        if (typeof x.cat !== 'string' || !x.cat || x.cat.length > 30) bad(w, 'its group');
        if (!Array.isArray(x.tags) || x.tags.some(t => typeof t !== 'string' || t.length > 32)) bad(w, 'its search words');
        if (/[\u2014]/.test(JSON.stringify(x))) bad(w, 'has a long dash');
        if (tab === 'stickers') {
          if (!STICKER_GROUPS.includes(x.cat)) bad(w, 'not in a sticker group: ' + x.cat);
          if (!Array.isArray(x.colors) || x.colors.length > 6 || !x.colors.every(BV.hex)) bad(w, 'its colors');
          if (!BV.stickerSvg(x)) bad(w, 'does not pass the sticker checks');
          else if (BV.stickerSvg(x).length > 60000) bad(w, 'very big picture');
        } else if (tab === 'words') {
          const c = x.cfg || {};
          if (typeof c.text !== 'string' || !c.text.trim() || c.text.length > 80) bad(w, 'its words');
          if (!EFFECTS.includes(c.effect)) bad(w, 'style ' + c.effect);
          if (!FONTS.includes(c.font)) bad(w, 'font ' + c.font);
          if (!WORD_MOTIONS.includes(c.motion)) bad(w, 'motion ' + c.motion);
          if (!BV.hex(c.c1) || !BV.hex(c.c2)) bad(w, 'its colors');
          if (!['400', '700', '900'].includes(String(c.weight))) bad(w, 'weight');
          if (x.tile && !BV.hex(x.tile)) bad(w, 'its tile color');
        } else {
          const c = x.cfg || {};
          const list = x.k === 'scene' ? SCENE_FX : x.k === 'effects' ? OLD_FX : null;
          if (!list) bad(w, 'kind ' + x.k);
          else if (!list.includes(c.effect)) bad(w, 'effect ' + c.effect);
          if (!BACKS.includes(c.back)) bad(w, 'sky ' + c.back);
          if (!hexList(c.colors)) bad(w, 'its colors');
          if (!(c.amount >= 1 && c.amount <= 10) || !(c.speed >= 1 && c.speed <= 10)) bad(w, 'amount or speed');
          if (x.tile && !BV.hex(x.tile)) bad(w, 'its tile color');
        }
        n++;
      }
    }
    if (t.count !== n) bad('boobox/index.json', `${tab}: says ${t.count}, has ${n}`);
    counts[tab] = n;
  }
  // emoji
  const e = idx.tabs && idx.tabs.emoji;
  if (!e) bad('boobox/index.json', 'no emoji');
  else {
    const where = 'boobox/' + e.list;
    const j = okPath(where) ? readJson(path.join(BOO, e.list), MAX.emojiList, where) : (bad('boobox/index.json', 'emoji list path'), null);
    if (j) {
      const sh = j.sheets || {};
      const cells = (sh.cols || 0) * (sh.rows || 0);
      const sheetOk = p => { const w = 'boobox/' + p; if (!okPath(w)) { bad(where, 'sheet path ' + p); return; } const f = path.join(BOO, p); if (!fs.existsSync(f)) bad(w, 'missing (run node sheet.js previews)'); else { if (size(f) > MAX.sheet) bad(w, 'too big'); const head = fs.readFileSync(f).subarray(0, 12).toString('latin1'); if (!head.startsWith('RIFF') || head.slice(8) !== 'WEBP') bad(w, 'not a WebP picture'); else if (!BV.sheetOk(new Uint8Array(fs.readFileSync(f)))) bad(w, `not a plain WebP picture of at most ${BV.SHEET_MAX.w} x ${BV.SHEET_MAX.h} (it says ${JSON.stringify(BV.webpSize(new Uint8Array(fs.readFileSync(f))))})`); } };
      (sh.base || []).forEach(sheetOk);
      for (const tn of TONES) (sh.tones && sh.tones[tn] || []).forEach(sheetOk);
      const seen = new Set();
      let files = 0, bytes = 0;
      for (const x of j.emoji || []) {
        const w = 'emoji ' + (x && x.id);
        if (!x || !okId(x.id) || seen.has(x.id)) { bad(w, 'bad or repeated id'); continue; }
        seen.add(x.id);
        if (!EMOJI_GROUPS.includes(x.cat)) bad(w, 'group ' + x.cat);
        if (!/^[0-9a-f]{2,6}(_[0-9a-f]{2,6}){0,7}$/.test(x.cp)) bad(w, 'code point');
        if (x.f != null && !(typeof x.f === 'number' && x.f >= 0 && x.f <= 1)) bad(w, 'its still picture (f)');
        if (!Array.isArray(x.s) || x.s[0] >= (sh.base || []).length || x.s[1] >= cells) bad(w, 'its place on the sheets');
        if ((x.tones || []).length && (!Array.isArray(x.st) || x.st[1] >= cells)) bad(w, 'its place on the skin tone sheets');
        for (const f of [x.id, ...(x.tones || []).map(t => { if (!TONES.includes(t)) bad(w, 'tone ' + t); return x.id + '--' + t; })]) {
          const p = path.join(BOO, 'emoji', 'a', f + '.json');
          if (!fs.existsSync(p)) { bad(w, 'missing file a/' + f + '.json'); continue; }
          const text = fs.readFileSync(p, 'utf8');
          bytes += text.length; files++;
          if (text.length > BV.LOTTIE_MAX) bad(w, f + ' too big');
          let data = null;
          try { data = BV.cleanLottie(JSON.parse(text)); } catch (err) { data = null; }
          if (!data) bad(w, f + ' does not pass the Lottie checks');
        }
      }
      const extra = fs.readdirSync(path.join(BOO, 'emoji', 'a')).filter(f => !seen.has(f.replace(/(--[a-z-]+)?\.json$/, '')));
      if (extra.length) bad('boobox/emoji/a', 'files no emoji uses: ' + extra.slice(0, 8).join(', '));
      const notice = path.join(BOO, 'emoji', 'NOTICE');
      if (!fs.existsSync(notice)) bad('boobox/emoji', 'no NOTICE (the CC BY 4.0 credit)');
      else {
        // the credit, and the full license of each package the list comes from (their copyright lines and texts)
        const t = fs.readFileSync(notice, 'utf8');
        for (const must of ['CC BY 4.0', 'Copyright (c) 2014 Mu-An Chiou', 'Copyright (c) 2019 Mu-An Chiou', 'Copyright 2026 Clever Tasks', 'Redistribution and use in source and binary forms'])
          if (!t.includes(must)) bad('boobox/emoji/NOTICE', 'does not have: ' + must);
        if ((t.match(/Permission is hereby granted, free of charge/g) || []).length < 2) bad('boobox/emoji/NOTICE', 'does not have both MIT license texts in full');
      }
      if (e.count !== seen.size) bad('boobox/index.json', `emoji: says ${e.count}, has ${seen.size}`);
      counts.emoji = seen.size;
      counts.emojiFiles = files;
      counts.emojiMB = Math.round(bytes / 104857.6) / 10;
    }
  }
}

// ---------------------------------------------------------------- Elements
const eIdx = readJson(path.join(ELEMENTS, 'index.json'), MAX.index, 'elements/index.json');
if (eIdx) {
  const seen = new Set();
  let n = 0, nf = 0;
  for (const p of (eIdx.icons && eIdx.icons.packs) || []) {
    const where = 'elements/' + p;
    if (!okPath(where)) { bad('elements/index.json', 'Blokvane would not download ' + p); continue; }
    const j = readJson(path.join(ELEMENTS, p), MAX.pack, where);
    if (!j) continue;
    if ((j.icons || []).length > PER_PACK.icons) bad(where, 'too many in one pack');
    for (const x of j.icons || []) {
      const w = where + ' ' + (x && x.n);
      if (!x || !okId(x.n) || !BV.iconAllowed(x.n)) { bad(w, 'bad name, or a logo that is left out'); continue; }
      if (seen.has(x.n)) bad(w, 'the same icon twice');
      seen.add(x.n);
      if (!BV.cleanIcon(x.o)) bad(w, 'outline does not pass the icon checks');
      if (x.f) { if (!BV.cleanIcon(x.f)) bad(w, 'filled form does not pass the icon checks'); else nf++; }
      if (typeof x.c !== 'string' || !x.c || x.c.length > 30) bad(w, 'its group');
      n++;
    }
  }
  if (eIdx.icons && eIdx.icons.count !== n) bad('elements/index.json', `says ${eIdx.icons.count}, has ${n}`);
  if (!fs.existsSync(path.join(ELEMENTS, 'LICENSE'))) bad('elements', 'no LICENSE (Tabler Icons, MIT)');
  counts.icons = n;
  counts.iconsFilled = nf;
}

// ---------------------------------------------------------------- only data in the published folders
const walk = (dir, rel, out) => { for (const f of fs.readdirSync(dir)) { const p = path.join(dir, f), r = rel ? rel + '/' + f : f; if (fs.statSync(p).isDirectory()) { if (r !== 'tools') walk(p, r, out); } else out.push(r); } return out; };
for (const [root, name] of [[BOO, 'boobox'], [ELEMENTS, 'elements']]) {
  if (!fs.existsSync(root)) continue;
  for (const f of walk(root, '', [])) if (!/\.(json|webp)$/.test(f) && !/(^|\/)(NOTICE|LICENSE|README\.md)$/.test(f)) bad(name + '/' + f, 'is not part of a list (only .json and .webp files are published)');
}

console.log('Boo Box:', ['stickers', 'emoji', 'words', 'scenes'].map(k => `${counts[k] || 0} ${k}`).join(', ') + (counts.emojiFiles ? ` (${counts.emojiFiles} emoji animations, ${counts.emojiMB} MB)` : ''));
console.log('Elements:', `${counts.icons || 0} icons (${counts.iconsFilled || 0} with a filled form)`);
if (problems.length) {
  console.log(`\n${problems.length} problem${problems.length > 1 ? 's' : ''}:`);
  for (const p of problems.slice(0, 200)) console.log('  - ' + p);
  process.exitCode = 1;
} else console.log('Everything passes.');
