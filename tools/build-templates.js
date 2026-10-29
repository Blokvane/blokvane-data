#!/usr/bin/env node
// Builds the free template list from the specs in templates/src, with Blokvane's own template code.
//
//   node tools/build-templates.js [path to the extension folder] [--dry] [--only=file.js]
//
// For every spec it makes the slide for a wide screen and the one for a tall screen, makes them small (it leaves
// out what Blokvane puts back by itself), checks them (tools/kit.js) and writes:
//   templates/packs/<category>.json   one file per category (split in parts when it gets big)
//   templates/index.json              the hand-made templates already in it, and the list of packs
// Nothing is written when a template has a problem. --dry checks everything and writes nothing.
// --only=file.js checks just that spec file (and that its ids are new next to every other file); it writes nothing.
'use strict';
const fs = require('fs');
const path = require('path');
const { TPL, findExt, load, readSpecs, lineJson, slug, checkTemplate, strings, PACK_BYTES } = require('./kit');

const args = process.argv.slice(2);
const onlyArg = args.find(a => a.startsWith('--only='));
const only = onlyArg ? onlyArg.slice(7) : '';
const dry = args.includes('--dry') || !!only;
const ext = findExt(args.find(a => !a.startsWith('--')));
const { B, K } = load(ext);
const L = K.LIMITS;

const problems = [];
const builtIn = new Set(B.TEMPLATES.map(t => t.id));

// the hand-made templates in index.json stay as they are (checked too)
const indexFile = path.join(TPL, 'index.json');
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : { templates: [] };
const root = Array.isArray(index.templates) ? index.templates : [];
const ids = new Map();
const own = (id, where) => { if (ids.has(id)) problems.push(`${where}: the id "${id}" is also used by ${ids.get(id)}`); else ids.set(id, where); };
const errorsOf = [];
for (const t of root) {
  const where = `index.json (${t && t.id})`;
  own(t && t.id, where);
  const r = checkTemplate(B, K, t, { builtIn });
  r.errors.forEach(m => errorsOf.push(`${where}: ${m}`));
  r.warnings.forEach(m => console.log(`note  ${where}: ${m}`));
}

// the specs
let { files, specs, errors: readErrors } = readSpecs(K);
// (a file that can't be read at all: a problem, except for --only on another file)
for (const e of readErrors) if (!only || e.file === only) errorsOf.push(e.message);
if (only) {
  if (!files.includes(only)) { console.error(`There is no templates/src/${only} (files: ${files.join(', ') || 'none'})`); process.exit(1); }
  // (the other files only count for their ids)
  for (const { spec, file, where } of specs) if (file !== only && spec && spec.id) ids.set(spec.id, where);
  specs = specs.filter(x => x.file === only);
  files = [only];
}
const byCat = new Map(K.CATEGORIES.map(c => [c, []]));
for (const { spec, where } of specs) {
  if (!spec || typeof spec !== 'object') { errorsOf.push(`${where}: not a template spec`); continue; }
  own(spec.id, where);
  let t;
  try { t = K.templateOf(spec); } catch (e) { errorsOf.push(`${where}: could not be built: ${e.message}`); continue; }
  const r = checkTemplate(B, K, t, { builtIn });
  r.errors.forEach(m => errorsOf.push(`${where}: ${m}`));
  r.warnings.forEach(m => console.log(`note  ${where}: ${m}`));
  // a fixed color that is also one of the palette's colors changes with "Make it yours" like that role does
  const roleOf = new Map(K.ROLES.map(x => [t.palette[x], x]));
  for (const [at, v] of strings({ o: spec.o, wide: spec.wide, tall: spec.tall })) {
    const h = /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : '';
    if (h && roleOf.has(h)) console.log(`note  ${where}: ${at} is ${v}, the palette's ${roleOf.get(h)}; write '$${roleOf.get(h)}' (or another color) so it is clear it changes with the palette`);
  }
  if (byCat.has(t.cat)) byCat.get(t.cat).push(t);
}
problems.push(...errorsOf);

// one pack per category, in parts when one gets near the limits
const packs = [];
for (const [cat, list] of byCat) {
  if (!list.length) continue;
  let part = [], n = 1;
  const flush = () => {
    if (!part.length) return;
    const name = `packs/${slug(cat)}${n > 1 ? '-' + n : ''}.json`;
    packs.push({ url: name, cat, count: part.length, list: part });
    part = []; n++;
  };
  let bytes = 0;
  for (const t of list) {
    const size = Buffer.byteLength(JSON.stringify(t)) + 6;
    if (part.length >= L.PACK_MAX || bytes + size > PACK_BYTES * 0.9) { flush(); bytes = 0; }
    part.push(t); bytes += size;
  }
  flush();
}
const total = root.length + packs.reduce((a, p) => a + p.count, 0);
if (root.length > L.ROOT_MAX) problems.push(`index.json: ${root.length} templates (at most ${L.ROOT_MAX}; move some into templates/src)`);
if (packs.length > L.PACKS_MAX) problems.push(`${packs.length} packs (Blokvane reads at most ${L.PACKS_MAX})`);
if (total > L.MORE_MAX) problems.push(`${total} templates in all (Blokvane keeps at most ${L.MORE_MAX})`);

const outs = packs.map(p => ({ file: path.join(TPL, p.url), text: lineJson({ cat: p.cat }, p.list) }));
for (const o of outs) { const b = Buffer.byteLength(o.text); if (b > PACK_BYTES) problems.push(`${path.relative(TPL, o.file)} is ${(b / 1048576).toFixed(2)} MB (at most 2 MB)`); }
const head = { about: 'Blokvane\'s free list of Signage templates. The packs are built by tools/build-templates.js from templates/src (see templates/src/README.md).' };
const indexText = lineJson(head, root, { packs: packs.map(p => ({ url: p.url, cat: p.cat, count: p.count })) });

console.log(`${files.length} spec file${files.length === 1 ? '' : 's'}, ${specs.length} specs, ${root.length} hand-made templates, ${packs.length} packs, ${total} templates in all`);
if (problems.length) {
  console.error(`\n${problems.length} problem${problems.length === 1 ? '' : 's'}: nothing was written.\n`);
  problems.forEach(p => console.error('ERROR ' + p));
  process.exit(1);
}
if (dry) { console.log('Everything passes (--dry: nothing written).'); process.exit(0); }
// write: the packs (old packs no longer in the list are removed), then the list
// (never through a link: a file or folder here that is a link to somewhere else stops the build)
const noLink = p => { let st = null; try { st = fs.lstatSync(p); } catch (e) { return; } if (st.isSymbolicLink()) { console.error(`ERROR ${path.relative(path.dirname(TPL), p)} is a link to somewhere else; the builder does not write through links. Nothing was written.`); process.exit(1); } };
const packDir = path.join(TPL, 'packs');
[TPL, packDir, indexFile, ...outs.map(o => o.file)].forEach(noLink);
if (fs.existsSync(packDir)) for (const f of fs.readdirSync(packDir)) noLink(path.join(packDir, f));
fs.mkdirSync(packDir, { recursive: true });
const keep = new Set(outs.map(o => path.basename(o.file)));
for (const f of fs.readdirSync(packDir)) if (f.endsWith('.json') && !keep.has(f)) fs.unlinkSync(path.join(packDir, f));
for (const o of outs) fs.writeFileSync(o.file, o.text);
fs.writeFileSync(indexFile, indexText);
for (const p of packs) console.log(`  ${p.url.padEnd(40)} ${String(p.count).padStart(4)} templates  ${(Buffer.byteLength(outs.find(o => o.file.endsWith(p.url)).text) / 1024).toFixed(0).padStart(5)} KB`);
console.log(`Wrote templates/index.json and ${packs.length} pack${packs.length === 1 ? '' : 's'}. Check them with: node tools/check-templates.js`);
