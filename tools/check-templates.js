#!/usr/bin/env node
// Checks the free template list as it will go live: templates/index.json, every pack it names, and the spec
// files in templates/src. Run it after tools/build-templates.js and before you push.
//
//   node tools/check-templates.js [path to the extension folder]
//
// It checks that every id is new (also next to the built-in templates), every drawing exists, every font is
// known, Blokvane keeps every template exactly as it is (nothing is left out or cut short), the files stay under
// the size limits, and that everything is plain ASCII with no em dash. Last, it loads the whole list the way
// Blokvane does (from these files, nothing is downloaded) and counts what it gets.
'use strict';
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { TPL, findExt, load, checkTemplate, strings, PACK_BYTES, EM_DASH } = require('./kit');

const ext = findExt(process.argv.slice(2).find(a => !a.startsWith('--')));
const errors = [], notes = [];
const err = m => errors.push(m), note = m => notes.push(m);

// a stand-in for the internet: the list's address is answered from the files here
const BASE = 'https://templates.invalid/templates/';
const served = [], asked = new Map();
function localFetch(url) {
  const u = String(url);
  if (!u.startsWith(BASE)) return Promise.reject(new Error('not part of the list: ' + u));
  // (a pack is asked for with its version: packs/holidays.json?v=...)
  const [rel, query] = u.slice(BASE.length).split('?');
  const file = path.join(TPL, decodeURIComponent(rel));
  if (!file.startsWith(TPL + path.sep) || !fs.existsSync(file)) return Promise.resolve(new Response('not found', { status: 404 }));
  // (the pack's place as the list names it, with forward slashes on every computer)
  const rel2 = path.relative(TPL, file).split(path.sep).join('/');
  served.push(rel2);
  if (query) asked.set(rel2, new URLSearchParams(query).get('v') || '');
  return Promise.resolve(new Response(fs.readFileSync(file), { status: 200, headers: { 'content-type': 'application/json' } }));
}
const { B, K } = load(ext, { fetch: localFetch, Response, AbortController });
const L = K.LIMITS;
const builtIn = new Set(B.TEMPLATES.map(t => t.id));

// plain ASCII, and no em dash (also not written as \u2014)
function textOk(file, text) {
  const bad = [...text].findIndex(c => c.charCodeAt(0) > 126 || (c.charCodeAt(0) < 32 && !'\n\r\t'.includes(c)));
  if (bad >= 0) err(`${file}: has a character that is not plain ASCII near "${text.slice(Math.max(0, bad - 30), bad + 10)}" (write letters like e with an accent as \\u00e9)`);
  if (text.includes(EM_DASH) || /\\u2014/i.test(text)) err(`${file}: has an em dash`);
}
let allBytes = 0;
// (the same version whatever line endings a copy of the file has: Git on Windows may turn them into its own)
const verOf = text => crypto.createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex').slice(0, 12);
const readJson = rel => {
  const file = path.join(TPL, rel);
  if (!fs.existsSync(file)) { err(`${rel}: missing`); return null; }
  const text = fs.readFileSync(file, 'utf8');
  allBytes += Buffer.byteLength(text);
  textOk(rel, text);
  const bytes = Buffer.byteLength(text);
  if (bytes > PACK_BYTES) err(`${rel}: ${(bytes / 1048576).toFixed(2)} MB (at most 2 MB; Blokvane stops reading a file at 3 MB)`);
  try { return { json: JSON.parse(text), bytes, text }; } catch (e) { err(`${rel}: not valid JSON (${e.message})`); return null; }
};

const ids = new Map();
let total = 0;
function checkList(list, where, cat) {
  if (!Array.isArray(list)) { err(`${where}: "templates" must be a list`); return; }
  for (const t of list) {
    const w = `${where} (${t && t.id})`;
    total++;
    if (t && typeof t.id === 'string') { if (ids.has(t.id)) err(`${w}: the id "${t.id}" is also used in ${ids.get(t.id)}`); else ids.set(t.id, where); }
    if (cat && t && t.cat !== cat) note(`${w}: its category is ${t.cat}, in the ${cat} pack`);
    const r = checkTemplate(B, K, t, { builtIn });
    r.errors.forEach(m => err(`${w}: ${m}`));
    r.warnings.forEach(m => note(`${w}: ${m}`));
  }
}

// the list and its packs
const idx = readJson('index.json');
const index = idx && idx.json;
let packs = [];
if (index) {
  checkList(index.templates || [], 'index.json');
  if ((index.templates || []).length > L.ROOT_MAX) err(`index.json: ${index.templates.length} templates (Blokvane reads at most ${L.ROOT_MAX} here)`);
  packs = Array.isArray(index.packs) ? index.packs : [];
  if (packs.length > L.PACKS_MAX) err(`index.json: ${packs.length} packs (Blokvane reads at most ${L.PACKS_MAX})`);
  const listed = new Set();
  for (const p of packs) {
    const url = typeof p === 'string' ? p : p && p.url;
    if (typeof url !== 'string' || !/^packs\/[a-z0-9-]+\.json$/.test(url)) { err(`index.json: the pack "${url}" must be a file in templates/packs, like packs/holidays.json`); continue; }
    if (listed.has(url)) err(`index.json: the pack ${url} is listed twice`);
    listed.add(url);
    const r = readJson(url);
    if (!r) continue;
    const list = r.json && r.json.templates;
    if (Array.isArray(list) && list.length > L.PACK_MAX) err(`${url}: ${list.length} templates (Blokvane reads at most ${L.PACK_MAX} from one pack)`);
    if (p && typeof p === 'object' && Array.isArray(list) && p.count !== list.length) note(`index.json: says ${url} has ${p.count} templates, it has ${list.length}`);
    // (the version must be the one of what is in the pack: Blokvane downloads a pack again only when it changes)
    if (p && typeof p === 'object' && p.v !== undefined && p.v !== verOf(r.text)) err(`index.json: the version of ${url} is not the one of the file (build again with tools/build-templates.js)`);
    checkList(list, url, p && p.cat);
  }
  const packDir = path.join(TPL, 'packs');
  if (fs.existsSync(packDir)) for (const f of fs.readdirSync(packDir)) if (!listed.has('packs/' + f)) note(`packs/${f} is not in index.json (Blokvane never reads it)`);
}
if (total > L.MORE_MAX) err(`${total} templates in all (Blokvane keeps at most ${L.MORE_MAX})`);
// (one update reads at most this much in all: a bigger list is cut)
if (L.TOTAL_MAX && allBytes > L.TOTAL_MAX) err(`the list and its packs are ${(allBytes / 1048576).toFixed(1)} MB (Blokvane reads at most ${L.TOTAL_MAX / 1048576} MB in one update)`);

// the spec files: plain ASCII, no em dash
const srcDir = path.join(TPL, 'src');
if (fs.existsSync(srcDir)) for (const f of fs.readdirSync(srcDir)) if (/\.(js|md)$/.test(f)) textOk('src/' + f, fs.readFileSync(path.join(srcDir, f), 'utf8'));

// the whole list, loaded the way Blokvane loads it
(async () => {
  if (index && !errors.length) {
    const got = await B.templatesMore(BASE + 'index.json');
    const left = got.reduce((a, t) => a + (t.left || 0), 0);
    if (got.length !== total) err(`Blokvane loads ${got.length} of the ${total} templates`);
    if (left) err(`Blokvane leaves out ${left} things when it loads the list`);
    if (got.failed && got.failed.length) err(`Blokvane could not read these packs: ${got.failed.join(', ')}`);
    if (got.bad) err(`Blokvane could not read ${got.bad} template${got.bad === 1 ? '' : 's'} in the list`);
    if (got.cut) err('the list is bigger than Blokvane reads in one update, so it is cut');
    const notRead = packs.map(p => (typeof p === 'string' ? p : p.url)).filter(u => !served.includes(u));
    if (notRead.length) err(`Blokvane did not read: ${notRead.join(', ')}`);
    // (each pack is asked for with its version, so a new version is downloaded and not taken from a cache)
    for (const p of packs) if (p && typeof p === 'object' && p.v && served.includes(p.url) && asked.get(p.url) !== p.v) err(`Blokvane asked for ${p.url} without its version (${p.v})`);
    else console.log(`Loaded like Blokvane does: ${got.length} templates from index.json and ${packs.length} pack${packs.length === 1 ? '' : 's'}.`);
  }
  notes.forEach(m => console.log('note  ' + m));
  if (errors.length) {
    errors.forEach(m => console.error('ERROR ' + m));
    console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'} in ${total} templates.`);
    process.exit(1);
  }
  console.log(`All ${total} templates pass (${notes.length} note${notes.length === 1 ? '' : 's'}).`);
})().catch(e => { console.error('ERROR ' + (e && e.stack || e)); process.exit(1); });
