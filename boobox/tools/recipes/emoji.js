// The animated emoji in Boo Box: Noto Emoji Animation by Google (CC BY 4.0, https://googlefonts.github.io/noto-emoji-animation/).
// Each Lottie file is made smaller (numbers rounded, names and expressions taken out), checked the very same way
// Blokvane checks it (lib/boo-core.js: no expressions, no files or fonts from anywhere) and saved as emoji/a/<name>.json, with
// emoji/a/<name>--<skin tone>.json for the ones with skin tones. emoji/list.json holds the names, groups and search
// words; the still pictures go on preview sheets (node sheet.js previews).
//
// Where the names and groups come from (none of it is code that runs in Blokvane):
//   - the file list and code points: the animated_emoji package's emojis.g.dart (BSD 3-Clause, Clever Tasks), which
//     lists Noto's animated emoji and comes with their Lottie files
//   - names and groups: unicode-emoji-json (MIT, Mu-An Chiou)
//   - search words: emojilib (MIT, Mu-An Chiou)
'use strict';
const fs = require('fs');
const path = require('path');

const TONES = [['Light', 'light'], ['MediumLight', 'medium-light'], ['Medium', 'medium'], ['MediumDark', 'medium-dark'], ['Dark', 'dark']];
const GROUP_ORDER = ['Smileys', 'People', 'Animals', 'Food', 'Travel', 'Activities', 'Objects', 'Symbols'];
const FROM_UNICODE = { 'Smileys & Emotion': 'Smileys', 'People & Body': 'People', 'Animals & Nature': 'Animals', 'Food & Drink': 'Food', 'Travel & Places': 'Travel',
  Activities: 'Activities', Objects: 'Objects', Symbols: 'Symbols', Flags: 'Symbols', Component: 'People' };
const FROM_NOTO = { 'Smileys and emotions': 'Smileys', People: 'People', 'Animals and nature': 'Animals', 'Food and drink': 'Food', 'Travel and places': 'Travel',
  'Activities and events': 'Activities', Objects: 'Objects', Symbols: 'Symbols', Flags: 'Symbols' };
// rude gestures are left out (Boo Box is for screens in shops, schools and offices)
const LEAVE_OUT = new Set(['middleFinger']);
const kebab = s => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').replace(/([A-Z])([A-Z][a-z])/g, '$1-$2').replace(/([a-zA-Z])(\d)/g, '$1-$2').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const words = s => s.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
const charOf = cp => String.fromCodePoint(...cp.split('_').map(h => parseInt(h, 16)));
const noVs = s => s.replace(/️/g, '');

// emojis.g.dart: static const <name> = Animated(Toned)EmojiData('<cp>', name: '<name>', categories: [...], tags: [...]);
function readDart(file) {
  const text = fs.readFileSync(file, 'utf8');
  const out = [];
  const re = /static const (\w+) = (AnimatedEmojiData|AnimatedTonedEmojiData)\(\s*'([0-9a-f_]+)',\s*name: '([^']+)',\s*categories: \[([^\]]*)\],\s*tags: \[([^\]]*)\],?\s*\);/g;
  let m;
  while ((m = re.exec(text))) {
    const list = s => [...s.matchAll(/'([^']*)'/g)].map(x => x[1]);
    out.push({ key: m[1], toned: m[2] === 'AnimatedTonedEmojiData', cp: m[3], name: m[4], cats: list(m[5]), tags: list(m[6]).map(t => t.replace(/^:|:$/g, '').replace(/[-_]+/g, ' ')) });
  }
  return out;
}

// a smaller Lottie. The drawings are 1024 wide, so whole numbers are plenty for big values; small values (colors,
// easing) keep three decimals. Names, and fields the player never reads, are taken out, and so are the few
// expressions (small bits of code in a Lottie file: Blokvane never runs them, and its checks refuse any file that
// still has one). Without them, those parts keep their own key frames.
const DROP = new Set(['nm', 'mn', 'ln', 'cl', 'ix', 'cix', 'np']);
const DEFAULTS = { ddd: 0, sr: 1, ao: 0, hd: false };
const round = v => Math.abs(v) < 1 ? Math.round(v * 1000) / 1000 : Math.abs(v) < 10 ? Math.round(v * 10) / 10 : Math.round(v);
function shrink(x) {
  if (Array.isArray(x)) return x.map(shrink);
  if (x && typeof x === 'object') {
    const o = {};
    for (const [k, v] of Object.entries(x)) {
      if (DROP.has(k) || (k === 'x' && typeof v === 'string') || (Object.hasOwn(DEFAULTS, k) && DEFAULTS[k] === v)) continue;
      o[k] = shrink(v);
    }
    return o;
  }
  if (typeof x === 'number' && !Number.isInteger(x)) return round(x);
  return x;
}

function build({ src, metaDir, out, BV, writeList, say }) {
  const find = (...names) => { for (const n of names) { const p = path.join(metaDir, n); if (fs.existsSync(p)) return p; } throw new Error('Not found in ' + metaDir + ': ' + names.join(' or ')); };
  const dart = readDart(find('emojis.g.dart', 'lib/emojis.g.dart'));
  const uni = JSON.parse(fs.readFileSync(find('unicode-emoji-json/data-by-emoji.json', 'unicode-emoji-json/package/data-by-emoji.json', 'data-by-emoji.json'), 'utf8'));
  const lib = JSON.parse(fs.readFileSync(find('emojilib/emoji-en-US.json', 'emojilib/package/dist/emoji-en-US.json', 'emoji-en-US.json'), 'utf8'));
  const uniBy = new Map(Object.entries(uni).map(([k, v]) => [noVs(k), v]));
  const libBy = new Map(Object.entries(lib).map(([k, v]) => [noVs(k), v]));
  const dir = path.join(out, 'a');
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const list = [];
  const refused = [];
  let bytesIn = 0, bytesOut = 0;
  const save = (file, id) => {
    const raw = fs.readFileSync(file, 'utf8');
    bytesIn += raw.length;
    const data = BV.cleanLottie(shrink(JSON.parse(raw)));
    if (!data) { refused.push(path.basename(file)); return false; }
    const text = JSON.stringify(data);
    if (text.length > BV.LOTTIE_MAX) { refused.push(path.basename(file) + ' (too big)'); return false; }
    fs.writeFileSync(path.join(dir, id + '.json'), text);
    bytesOut += text.length;
    return true;
  };
  for (const e of dart) {
    if (LEAVE_OUT.has(e.key)) continue;
    const file = path.join(src, e.key + '.json');
    if (!fs.existsSync(file)) { refused.push(e.key + ' (no file)'); continue; }
    const id = kebab(e.key);
    if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(id)) throw new Error('Bad emoji id ' + id);
    if (!save(file, id)) continue;
    const ch = noVs(charOf(e.cp));
    const u = uniBy.get(ch);
    const cat = (u && FROM_UNICODE[u.group]) || FROM_NOTO[e.cats[0]] || 'Symbols';
    const name = (u && u.name) || words(e.name);
    const tones = [];
    if (e.toned) for (const [suffix, tone] of TONES) { const tf = path.join(src, e.key + suffix + '.json'); if (fs.existsSync(tf) && save(tf, id + '--' + tone)) tones.push(tone); }
    const tags = [...new Set([...(libBy.get(ch) || []).map(t => t.replace(/_/g, ' ')), ...e.tags, ...words(e.name).split(' ')].map(t => t.toLowerCase().trim()).filter(t => t && t.length <= 32 && !/^[:;]/.test(t)))].slice(0, 24);
    list.push({ id, name: name.charAt(0).toUpperCase() + name.slice(1), cat, tags, cp: e.cp, tones, order: list.length });
  }
  // in the groups' order, Noto's order inside each group
  list.sort((a, b) => GROUP_ORDER.indexOf(a.cat) - GROUP_ORDER.indexOf(b.cat) || a.order - b.order);
  // the preview sheets: every emoji's still picture, 16 x 8 on a sheet
  const cols = 16, rows = 8, per = cols * rows, size = 80;
  const base = [];
  list.forEach((e, i) => { e.s = [Math.floor(i / per), i % per]; if (!base[e.s[0]]) base[e.s[0]] = 'emoji/sheets/base-' + e.s[0] + '.webp'; });
  const toned = list.filter(e => e.tones.length);
  const tones = {};
  for (const [, tone] of TONES) tones[tone] = [];
  toned.forEach((e, i) => {
    e.st = [Math.floor(i / per), i % per];
    for (const [, tone] of TONES) if (!tones[tone][e.st[0]]) tones[tone][e.st[0]] = 'emoji/sheets/' + tone + '-' + e.st[0] + '.webp';
  });
  for (const e of list) delete e.order;
  writeList(path.join(out, 'list.json'), 'emoji', list, { v: 1, sheets: { base, tones, cols, rows, size } });
  fs.writeFileSync(path.join(out, 'NOTICE'), noticeText(metaDir));
  say('  emoji', list.length, 'with', toned.length, 'in five skin tones;', Math.round(bytesIn / 1048576) + ' MB made ' + Math.round(bytesOut / 1048576 * 10) / 10 + ' MB');
  if (refused.length) say('  left out (they did not pass the checks):', refused.join(', '));
  say('  now make the preview sheets: node sheet.js previews --ext <blokvane folder>');
  return { count: list.length, list: 'emoji/list.json', tones: TONES.map(t => t[1]) };
}

const NOTICE = `Animated emoji in this folder

The animated emoji in emoji/a (and their still pictures in emoji/sheets) are
Noto Emoji Animation by Google:
  https://googlefonts.github.io/noto-emoji-animation/
licensed under the Creative Commons Attribution 4.0 International license
(CC BY 4.0): https://creativecommons.org/licenses/by/4.0/

Changes made by Blokvane: the Lottie files were made smaller (numbers rounded,
layer and shape names and unused fields taken out), the few expressions (small
bits of code inside some of the files) were taken out, and a still picture of
each was put on the preview sheets. The drawings themselves are not changed.

The emoji names, groups and search words in list.json come from
unicode-emoji-json and emojilib by Mu-An Chiou (MIT license), and the list of
animated emoji from the animated_emoji package by Clever Tasks (BSD 3-Clause
license). Each of these licenses is below in full.
`;
// the NOTICE, with the full license of each package the list comes from (their license files, kept in the meta
// folder: animated_emoji-LICENSE, emojilib/LICENSE and unicode-emoji-json/LICENSE)
function noticeText(metaDir) {
  let text = NOTICE;
  for (const [file, name] of [['animated_emoji-LICENSE', 'The animated_emoji package\'s license'], ['emojilib/LICENSE', 'emojilib\'s license'], ['unicode-emoji-json/LICENSE', 'unicode-emoji-json\'s license']]) {
    const f = path.join(metaDir, file);
    if (!fs.existsSync(f)) throw new Error('The meta folder has no ' + file + ' (each license goes in the NOTICE).');
    text += '\n----- ' + name + ' -----\n\n' + fs.readFileSync(f, 'utf8').trim() + '\n';
  }
  return text;
}
module.exports = { build, readDart, shrink, kebab, noticeText };
