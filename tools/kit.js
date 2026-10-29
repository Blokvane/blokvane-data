// Shared by the template tools: loads Blokvane's own Signage code (from the extension folder of the app repo) into
// a sandbox, so templates are built and checked by exactly the code that shows them, and the checks every
// template in the free list has to pass.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA = path.resolve(__dirname, '..');
const TPL = path.join(DATA, 'templates');

// the extension folder: the path given on the command line, BLOKVANE_EXT, or a copy next to this repo
function findExt(arg) {
  const tries = arg ? [path.resolve(arg)] : [process.env.BLOKVANE_EXT, '../blokvane', '../blokvane/blokvane']
    .filter(Boolean).map(p => path.resolve(DATA, p));
  for (const p of tries) if (fs.existsSync(path.join(p, 'lib', 'signage-templates.js'))) return p;
  throw new Error(`Blokvane's extension folder was not found (looked in ${tries.join(', ')}).\n` +
    'Give its path, the folder with manifest.json and lib/signage-templates.js in it, for example:\n' +
    '  node tools/build-templates.js ../blokvane/blokvane');
}

// Blokvane's Signage code in a sandbox: BVSign (B) with B.templateKit (K), B.ART and B.TEMPLATES
// (extra: more globals for the sandbox, like a stand-in fetch)
function load(ext, extra = {}) {
  const chrome = { storage: { onChanged: { addListener() {} }, local: { get: async () => ({}), set: async () => {}, remove: async () => {} } }, runtime: { id: 'tools' } };
  const ctx = vm.createContext({ console, chrome, URL, TextEncoder, TextDecoder, crypto: globalThis.crypto, setTimeout, clearTimeout,
    document: {}, navigator: { language: 'en-US' }, Intl, ...extra });
  const run = f => vm.runInContext(fs.readFileSync(path.join(ext, f), 'utf8'), ctx, { filename: f });
  run('lib/signage-core.js');
  run('lib/signage-look.js');
  // (the drawings file registers two widgets; only their drawings are needed here)
  vm.runInContext('BVSign.wkit = BVSign.wkit || { reg() {} };', ctx);
  run('lib/signage-art.js');
  run('lib/signage-templates.js');
  const B = ctx.BVSign;
  if (!B || !B.templateKit) throw new Error('This copy of Blokvane has no template kit (B.templateKit). Use a newer one.');
  return { B, K: B.templateKit };
}

// the spec files in templates/src (each one: module.exports = [ specs ] or kit => [ specs ])
function readSpecs(K, dir = path.join(TPL, 'src')) {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.js')).sort() : [];
  const out = [], errors = [];
  for (const f of files) {
    const file = path.join(dir, f);
    try {
      delete require.cache[require.resolve(file)];
      let list = require(file);
      if (typeof list === 'function') list = list(K);
      if (!Array.isArray(list)) throw new Error('module.exports must be a list of templates (or kit => list)');
      list.forEach((spec, i) => out.push({ spec, where: `${f} #${i + 1}${spec && spec.id ? ` (${spec.id})` : ''}`, file: f }));
    } catch (e) { errors.push({ file: f, message: `${f}: ${e.message}` }); }
  }
  return { files, specs: out, errors };
}

// JSON that is plain ASCII (letters like e with an accent are written as \u00e9), one template per line
const ascii = s => s.replace(/[\u007f-\uffff]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));
const lineJson = (head, list, tail = {}) => {
  const lines = ['{'];
  for (const [k, v] of Object.entries(head)) lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)},`);
  lines.push('  "templates": [');
  list.forEach((t, i) => lines.push('    ' + JSON.stringify(t) + (i < list.length - 1 ? ',' : '')));
  const more = Object.entries(tail);
  lines.push('  ]' + (more.length ? ',' : ''));
  more.forEach(([k, v], i) => {
    if (Array.isArray(v)) {
      lines.push(`  ${JSON.stringify(k)}: [`);
      v.forEach((x, j) => lines.push('    ' + JSON.stringify(x) + (j < v.length - 1 ? ',' : '')));
      lines.push('  ]' + (i < more.length - 1 ? ',' : ''));
    } else lines.push(`  ${JSON.stringify(k)}: ${JSON.stringify(v)}` + (i < more.length - 1 ? ',' : ''));
  });
  lines.push('}');
  return ascii(lines.join('\n')) + '\n';
};

const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const EM_DASH = '\u2014';
// a year that goes out of date (a fixed "Since 1998" is fine)
const YEAR = /\b20[2-9]\d\b/;
// limits the app keeps (see LIMITS in the template kit); a pack is kept well under the 3 MB the app reads
const PACK_BYTES = 2 * 1024 * 1024;

// every string in a value, with where it is
function strings(v, at = '', out = []) {
  if (typeof v === 'string') out.push([at, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${at}[${i}]`, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, at ? `${at}.${k}` : k, out);
  return out;
}
// a slide without ids (ids are made new every time a template is used)
const noIds = s => JSON.parse(JSON.stringify(s, (k, v) => (k === 'id' ? undefined : v)));
function firstDiff(a, b) {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  let i = 0;
  while (i < x.length && x[i] === y[i]) i++;
  return `kept: ...${x.slice(Math.max(0, i - 60), i + 60)}...\n      template: ...${y.slice(Math.max(0, i - 60), i + 60)}...`;
}

// where a value written in a template is not kept as it is by Blokvane (a path and what it becomes), or '' when every
// value is kept (Blokvane may add what is left out, like default settings, but never changes what is written)
const short = v => { const j = JSON.stringify(v); return j === undefined ? 'nothing' : j.length > 70 ? j.slice(0, 67) + '...' : j; };
function notKept(raw, kept, at) {
  if (raw === null || typeof raw !== 'object') return JSON.stringify(raw) === JSON.stringify(kept) ? '' : `${at}: ${short(raw)} becomes ${short(kept)}`;
  if (Array.isArray(raw)) {
    if (!Array.isArray(kept)) return `${at}: a list becomes ${short(kept)}`;
    if (raw.length !== kept.length) return `${at}: ${raw.length} entries become ${kept.length}`;
    for (let i = 0; i < raw.length; i++) { const d = notKept(raw[i], kept[i], `${at}[${i}]`); if (d) return d; }
    return '';
  }
  if (!kept || typeof kept !== 'object' || Array.isArray(kept)) return `${at}: becomes ${short(kept)}`;
  for (const k of Object.keys(raw)) {
    if (!Object.prototype.hasOwnProperty.call(kept, k)) return `${at}.${k}: is left out`;
    const d = notKept(raw[k], kept[k], `${at}.${k}`);
    if (d) return d;
  }
  return '';
}
// a schedule rule written the way Blokvane keeps it: hours given (without them a rule is 08:00 to 18:00), a short label
function ruleProblems(B, r, at) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return [`${at}: a schedule rule is an object, like { "kind": "year", "month": 3, "day": 14, "start": "00:00", "end": "00:00" }`];
  const out = [], d = B.cleanRule({});
  for (const k of ['start', 'end']) if (typeof r[k] !== 'string') out.push(`${at}.${k}: give the hours ("00:00" and "00:00" is the whole day); without them Blokvane uses ${d.start} to ${d.end}`);
  if (r.label != null && (typeof r.label !== 'string' || r.label.length > 60)) out.push(`${at}.label: words of at most 60 letters (Blokvane cuts the rest)`);
  return out;
}

// The checks for one template of the free list (as it is in index.json or a pack).
// Returns { errors, warnings } (lists of words).
function checkTemplate(B, K, t, opt = {}) {
  const errors = [], warnings = [];
  const err = m => errors.push(m), warn = m => warnings.push(m);
  if (!t || typeof t !== 'object' || Array.isArray(t)) { err('not a template'); return { errors, warnings }; }
  if (typeof t.id !== 'string' || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t.id) || t.id.length > 40) err(`id "${t.id}": use short lowercase words with dashes (at most 40 letters)`);
  if (opt.builtIn && opt.builtIn.has(t.id)) err(`id "${t.id}" is already the id of a built-in template`);
  if (typeof t.name !== 'string' || !t.name.trim() || t.name.length > 60) err('name: 1 to 60 letters');
  if (!K.CATEGORIES.includes(t.cat)) err(`cat "${t.cat}" is not a category (it would show under Other). Categories: ${K.CATEGORIES.join(', ')}`);
  if (!Object.prototype.hasOwnProperty.call(B.TEMPLATE_COLORS, t.color)) err(`color "${t.color}" is not one of: ${Object.keys(B.TEMPLATE_COLORS).join(', ')}`);
  if (!Array.isArray(t.tags) || t.tags.length > 20 || t.tags.some(x => typeof x !== 'string' || x.length > 30 || x !== x.toLowerCase() || !x.trim())) err('tags: at most 20 lowercase words or phrases, each at most 30 letters');
  else if (t.tags.length < 3) warn('tags: give at least 3 words people might search for');
  if (t.when != null) {
    if (typeof t.when === 'string') { if (!B.HOLIDAYS.some(h => h.id === t.when)) err(`when "${t.when}" is not a holiday Blokvane knows (${B.HOLIDAYS.map(h => h.id).join(', ')})`); }
    else if (typeof t.when === 'object' && !Array.isArray(t.when)) {
      ruleProblems(B, t.when, 'when').forEach(err);
      const r = B.cleanRule(t.when);
      for (const k of Object.keys(t.when)) if (k !== 'label' && JSON.stringify(r[k]) !== JSON.stringify(t.when[k])) err(`when.${k}: ${short(t.when[k])} is not kept (it becomes ${short(r[k])})`);
    } else err('when: a holiday id or a schedule rule');
  }
  if (t.palette != null && JSON.stringify(K.cleanPalette(t.palette)) !== JSON.stringify(t.palette)) err('palette: only the eight color roles as #rrggbb (and an id) are kept');
  for (const shape of ['wide', 'tall']) {
    const v = t[shape];
    if (v != null && (typeof v !== 'object' || Array.isArray(v))) err(`${shape}: must be a slide (an object with items), not ${Array.isArray(v) ? 'a list' : typeof v}`);
  }
  if (!t.wide) err('wide: the slide for a wide screen is missing');
  if (!t.tall) warn('tall: no slide for a tall screen (tall screens get the wide one)');
  // what Blokvane keeps of it when it is downloaded (the same checks as for any template from outside)
  let kept = null;
  try { kept = B.cleanTemplate(t); } catch (e) { err(`Blokvane can't read this template (${e.message})`); }
  if (!kept && !errors.length) err('Blokvane does not take this template at all');
  for (const shape of ['wide', 'tall']) {
    const raw = t[shape];
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const full = B.cleanSlide(JSON.parse(JSON.stringify(raw)));
    // every value in it is kept exactly as it is written
    const changed = notKept(raw, full, shape);
    if (changed) err(`${changed} (Blokvane keeps a slide only the way it cleans it: write it that way)`);
    // a template's slide has no days of its own and is always on: days come from "when", which people can switch off
    if (raw.when && (raw.when.on || (Array.isArray(raw.when.rules) && raw.when.rules.length))) err(`${shape}.when: a slide in a template can't have days of its own (Blokvane drops them); give the template a "when" instead`);
    if (raw.enabled === false) err(`${shape}.enabled: a slide in a template is always added switched on (Blokvane drops "enabled": false)`);
    for (const [i, r] of (raw.when && Array.isArray(raw.when.rules) ? raw.when.rules : []).entries()) ruleProblems(B, r, `${shape}.when.rules[${i}]`).forEach(err);
    const items = Array.isArray(raw.items) ? raw.items : [];
    if (items.length > B.LIMITS.items) err(`${shape}: ${items.length} things on the slide (at most ${B.LIMITS.items})`);
    if (!full.items.length) err(`${shape}: the slide is empty`);
    let art = 0;
    for (const it of full.items) {
      if (it.type === 'zone') continue;
      if (it.type !== 'widget') { err(`${shape}: a "${it.type}" item (only widgets and empty areas can be in a template)`); continue; }
      const w = it.widget, c = w.cfg || {};
      if (!K.safeWidget(w)) err(`${shape}: a "${w.kind}" widget (it would become an empty area; allowed: ${[...K.SAFE_KINDS].join(', ')})`);
      if (w.kind === 'art') { art++; if (!B.ART.has(c.art)) err(`${shape}: the drawing "${c.art}" does not exist`); }
      if (typeof c.font === 'string' && c.font) {
        if (!Object.prototype.hasOwnProperty.call(B.FONTS, c.font)) err(`${shape}: the font "${c.font}" does not exist`);
        else if (!K.BUNDLED_FONTS.includes(c.font)) warn(`${shape}: the font "${c.font}" is not one that comes with Blokvane (it looks different on TVs)`);
      }
      if (w.kind === 'countdown' && c.target) err(`${shape}: a countdown with a fixed date (${c.target}) goes out of date; leave the date empty so people pick their own`);
    }
    if (art > K.LIMITS.ART_MAX) err(`${shape}: ${art} drawings (at most ${K.LIMITS.ART_MAX})`);
    // nothing else is left out or cut short when Blokvane takes it (websites, pictures, words over the limits)
    if (kept) {
      let got = null;
      try { got = kept.build(shape); } catch (e) { err(`${shape}: Blokvane can't draw it (${e.message})`); }
      const a = got && noIds(got), b = noIds({ ...full, when: { on: false, rules: [] }, enabled: true });
      if (got && JSON.stringify(a) !== JSON.stringify(b)) err(`${shape}: Blokvane would change this slide when it takes it:\n      ${firstDiff(a, b)}`);
    }
  }
  for (const [at, s] of strings(t)) {
    if (s.includes(EM_DASH)) err(`${at}: has an em dash; use a comma, a colon or two sentences`);
    if (YEAR.test(s) && !/^#/.test(s)) err(`${at}: "${s.slice(0, 60)}" has a year in it, which goes out of date`);
    if (/https?:\/\/|www\./i.test(s)) err(`${at}: has a web address (templates hold no links)`);
  }
  return { errors, warnings };
}

module.exports = { DATA, TPL, findExt, load, readSpecs, lineJson, ascii, slug, checkTemplate, strings, PACK_BYTES, EM_DASH };
