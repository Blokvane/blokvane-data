#!/usr/bin/env node
// Blokvane's list robot. Downloads the public block lists Blokvane uses, checks them, and puts them together into
// Blokvane's own list, which the extension downloads instead of every list (blokvane/filters.js in the extension).
// Run by .github/workflows/blokvane-list.yml every 3 hours; the result is published on this repo's "lists" branch.
//
//   node tools/build-lists.js --prev <folder with the list published last time> --out <folder to write>
//
// What it writes:
//   meta.json             what is in the list now (versions and fingerprints); the extension reads this first
//   ads.json              ads, trackers and cookie notices: ready-made Chrome rules and hide rules. Made with the
//                         extension's own compiler (tools/lists/filters.js, a copy of blokvane/filters.js)
//   security-base.json    malware and phishing sites: the big part, replaced about once a week
//   security-delta.json   what was added and removed since that base (small: what each computer downloads)
//   CREDITS.txt           the lists this is made from and their licenses. The list stays under those licenses.
//
// Safety: a list that fails to download, comes back much too small, or shrinks or grows wildly is not used; the
// part published last time is kept and the run ends with an error (GitHub then sends an email).
// Only lists that allow use in a paid product are in here (see tools/lists/sources.json for each one's license).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');

const HERE = path.join(__dirname, 'lists');
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
const readJson = (p, dflt) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return dflt; } };

const DEFAULTS = {
  floors: { phishing: 100000, malware: 500, adRules: 8000, listBytes: 3000 },
  maxAdRules: 28000,          // what the extension can load (MAX_LIST_RULES in background.js)
  shrink: 0.7, grow: 3,       // against the count published last time
  baseDays: 7, baseChurn: 0.15
};

// One list, as text. from: a folder with the lists as files (named like the last part of each address), for tests.
async function fetchText(url, from) {
  if (from) return fs.readFileSync(path.join(from, url.replace(/\/+$/, '').split('/').pop()), 'utf8');
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 120000);
      try {
        const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'blokvane-list-robot (+https://github.com/Blokvane/blokvane-data)' } });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return await r.text();
      } finally { clearTimeout(t); }
    } catch (e) { last = e; await new Promise(r => setTimeout(r, 4000 * (i + 1))); }
  }
  throw new Error(url + ': ' + (last && last.message));
}
const looksLikeAList = (text, floor) => typeof text === 'string' && text.length >= floor && !/^\s*<(!doctype|html)/i.test(text);

// ---------- ads, trackers, cookie notices: the extension's own compiler ----------
async function buildAds(o) {
  const failed = [];
  const ctx = {
    console: { warn() {}, log() {}, error() {} },
    fetch: async url => {
      try {
        const text = await fetchText(url, o.from);
        if (!looksLikeAList(text, o.floors.listBytes)) throw new Error('came back too small or is not a list');
        return { ok: true, status: 200, text: async () => text };
      } catch (e) { failed.push(url + ' (' + e.message + ')'); throw e; }
    }
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(HERE, 'filters.js'), 'utf8') + '\n;this.API = { asBuildFromNetwork, bvListCheckAds };', ctx);
  const built = await ctx.API.asBuildFromNetwork();
  if (failed.length) throw new Error('lists that could not be used: ' + failed.join('; '));
  // (plain copies: what the compiler made, with nothing of the sandbox left on it)
  const body = JSON.parse(JSON.stringify({ rules: built.rules, cosmetic: built.cosmetic }));
  // the same check the extension does: every rule has to pass it
  const checked = ctx.API.bvListCheckAds({ format: 1, rules: body.rules, cosmetic: body.cosmetic });
  if (checked.rules.length !== body.rules.length) throw new Error((body.rules.length - checked.rules.length) + ' rules would be refused by the extension');
  const n = body.rules.length;
  if (n < o.floors.adRules) throw new Error('only ' + n + ' rules: too few');
  if (n > o.maxAdRules) throw new Error(n + ' rules: more than the ' + o.maxAdRules + ' the extension can load');
  const was = o.prevMeta.ads && o.prevMeta.ads.rules;
  if (was && (n < was * o.shrink || n > was * o.grow)) throw new Error('went from ' + was + ' rules to ' + n + ': too big a change to trust');
  const v = sha(JSON.stringify(body)).slice(0, 16);
  const doms = new Set();
  let patterns = 0;
  for (const r of body.rules) {
    if (r.action.type !== 'block') continue;
    if (r.condition.requestDomains && !r.condition.urlFilter) r.condition.requestDomains.forEach(d => doms.add(d)); else patterns++;
  }
  const c = body.cosmetic;
  const hide = c.generic.length + Object.values(c.specific).reduce((a, l) => a + l.length, 0) + Object.values(c.cookieSpecific).reduce((a, l) => a + l.length, 0);
  return { text: JSON.stringify({ format: 1, v, rules: body.rules, cosmetic: body.cosmetic }), v, rules: n, sites: doms.size, patterns, hide, domains: doms };
}

// ---------- malware and phishing ----------
// (the same reading of each list as the extension's own, background2.js: updateSecurity)
function readSecurity(text, fmt) {
  const out = [];
  for (let line of text.split('\n')) {
    line = line.trim();
    if (!line || line[0] === '#' || line[0] === '!') continue;
    let d;
    if (fmt === 'abp') {
      const m = /^\|\|([a-z0-9.-]+)\^(\$.*)?$/.exec(line);
      if (!m) continue;
      const opts = (m[2] || '$').slice(1).split(',').filter(Boolean);
      if (!opts.every(x => /^(doc|document|all|important|popup|1p|3p|first-party|third-party)$/.test(x))) continue;
      d = m[1];
    } else d = line.split(/\s+/)[0];
    out.push(d);
  }
  return out;
}
async function buildSecurity(o, sources, never) {
  const platform = new Set(never.platform), official = new Set(never.official);
  const isOfficial = d => { for (let x = d; x;) { if (official.has(x)) return true; const i = x.indexOf('.'); if (i < 0) return false; x = x.slice(i + 1); } return false; };
  const byKind = { malware: new Set(), phishing: new Set() };
  for (const src of sources.filter(s => s.part === 'security')) {
    const text = await fetchText(src.url, o.from);
    if (!looksLikeAList(text, o.floors.listBytes)) throw new Error(src.name + ' came back too small or is not a list');
    let n = 0;
    for (let d of readSecurity(text, src.format)) {
      d = String(d).toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
      if (!/^[a-z0-9][a-z0-9.-]*\.[a-z0-9-]{2,}$/.test(d) || d.length > 253 || platform.has(d) || isOfficial(d) || d === 'localhost') continue;
      byKind[src.kind].add(d); n++;
    }
    if (n < o.floors[src.kind]) throw new Error(src.name + ': only ' + n + ' sites, fewer than the ' + o.floors[src.kind] + ' it always has');
  }
  for (const d of byKind.malware) byKind.phishing.delete(d);
  const full = { malware: [...byKind.malware].sort(), phishing: [...byKind.phishing].sort() };
  const count = full.malware.length + full.phishing.length;
  const was = o.prevMeta.security && o.prevMeta.security.count;
  if (was && (count < was * o.shrink || count > was * o.grow)) throw new Error('went from ' + was + ' sites to ' + count + ': too big a change to trust');
  const v = sha(full.malware.join('\n') + '|' + full.phishing.join('\n')).slice(0, 16);

  // the base published last time, if it can still be used
  let baseText = null, base = null;
  const pm = o.prevMeta.security;
  if (pm && pm.base) {
    try {
      const t = fs.readFileSync(path.join(o.prev, 'security-base.json'), 'utf8');
      if (sha(t) === pm.baseSha256) { const b = JSON.parse(t); if (b.id === pm.base) { baseText = t; base = b; } }
    } catch (e) {}
  }
  const diff = b => {
    const had = { malware: new Set(b.malware), phishing: new Set(b.phishing) }, now = { malware: byKind.malware, phishing: byKind.phishing };
    const add = { malware: full.malware.filter(d => !had.malware.has(d)), phishing: full.phishing.filter(d => !had.phishing.has(d)) };
    const del = [...b.malware.filter(d => !now.malware.has(d)), ...b.phishing.filter(d => !now.phishing.has(d))].sort();
    return { add, del };
  };
  let delta = base ? diff(base) : null;
  const old = base && pm.baseMade ? (o.now - Date.parse(pm.baseMade)) / 864e5 : Infinity;
  const churn = delta ? (delta.add.malware.length + delta.add.phishing.length + delta.del.length) / Math.max(1, base.malware.length + base.phishing.length) : 1;
  let baseMade = pm && pm.baseMade;
  if (!base || !(old < o.baseDays) || churn > o.baseChurn) {
    const d = new Date(o.now);
    const id = 'b' + d.toISOString().replace(/[-:T]/g, '').slice(0, 12);
    base = { format: 1, id, malware: full.malware, phishing: full.phishing };
    baseText = JSON.stringify(base);
    baseMade = d.toISOString();
    delta = { add: { malware: [], phishing: [] }, del: [] };
  }
  const deltaText = JSON.stringify({ format: 1, base: base.id, v, add: delta.add, del: delta.del });
  return { baseText, deltaText, v, base: base.id, baseMade, count, malware: full.malware.length, phishing: full.phishing.length,
    changes: delta.add.malware.length + delta.add.phishing.length + delta.del.length, domains: new Set([...full.malware, ...full.phishing]) };
}

function credits(sources) {
  const rows = sources.map(s => '- ' + s.name + ': ' + s.home + '\n  License: ' + s.license + '\n  Used for: ' + s.use).join('\n');
  return 'Blokvane\'s list is made from these public lists. Thank you to the people who keep them.\n' +
    'Each list keeps its own license, and Blokvane\'s list (the files in this folder) is shared under the same licenses:\n' +
    'you may use and share it under their terms, with these credits.\n\n' + rows + '\n\n' +
    'Made automatically by https://github.com/Blokvane/blokvane-data (tools/build-lists.js).\n';
}

// Builds into o.out. Returns { ok, changed, errors, ads, security }. Never throws for a list that fails: that part
// keeps what was published last time (copied from o.prev).
async function build(opts) {
  const o = Object.assign({}, DEFAULTS, opts, { floors: Object.assign({}, DEFAULTS.floors, opts.floors || {}) });
  o.now = o.now || Date.now();
  const sources = readJson(path.join(HERE, 'sources.json'), null).sources;
  const never = readJson(path.join(HERE, 'never-block.json'), null);
  o.prevMeta = (o.prev && readJson(path.join(o.prev, 'meta.json'), null)) || {};
  fs.mkdirSync(o.out, { recursive: true });
  const errors = [], meta = { format: 1, made: o.prevMeta.made || '' }, res = {};
  const keep = (name) => { try { fs.copyFileSync(path.join(o.prev, name), path.join(o.out, name)); return true; } catch (e) { return false; } };
  const stamp = new Date(o.now).toISOString();

  try {
    const a = res.ads = await buildAds(o);
    fs.writeFileSync(path.join(o.out, 'ads.json'), a.text);
    const same = o.prevMeta.ads && o.prevMeta.ads.v === a.v;
    meta.ads = { v: a.v, sha256: sha(a.text), bytes: Buffer.byteLength(a.text), rules: a.rules, sites: a.sites, patterns: a.patterns, hide: a.hide, made: same ? o.prevMeta.ads.made : stamp };
  } catch (e) {
    errors.push('Ads and trackers: ' + e.message);
    if (o.prevMeta.ads && keep('ads.json')) meta.ads = o.prevMeta.ads;
  }
  try {
    const s = res.security = await buildSecurity(o, sources, never);
    fs.writeFileSync(path.join(o.out, 'security-base.json'), s.baseText);
    fs.writeFileSync(path.join(o.out, 'security-delta.json'), s.deltaText);
    const same = o.prevMeta.security && o.prevMeta.security.v === s.v && o.prevMeta.security.base === s.base;
    meta.security = { v: s.v, base: s.base, baseSha256: sha(s.baseText), baseMade: s.baseMade, deltaSha256: sha(s.deltaText), deltaBytes: Buffer.byteLength(s.deltaText),
      count: s.count, malware: s.malware, phishing: s.phishing, made: same ? o.prevMeta.security.made : stamp };
  } catch (e) {
    errors.push('Malware and phishing: ' + e.message);
    if (o.prevMeta.security && keep('security-base.json') && keep('security-delta.json')) meta.security = o.prevMeta.security;
  }
  meta.sources = sources.map(s => ({ name: s.name, home: s.home, license: s.license }));
  const strip = m => JSON.stringify(Object.assign({}, m, { made: '' }));
  const changed = strip(meta) !== strip(o.prevMeta);
  if (changed || !meta.made) meta.made = stamp;
  fs.writeFileSync(path.join(o.out, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
  fs.writeFileSync(path.join(o.out, 'CREDITS.txt'), credits(sources));
  fs.writeFileSync(path.join(o.out, 'README.md'), '# Blokvane\'s list\n\nMade automatically every 3 hours by the robot on the main branch (tools/build-lists.js). The Blokvane extension downloads these files.\nSee CREDITS.txt for the lists it is made from and their licenses.\n');
  return { ok: !errors.length, changed, errors, meta, ads: res.ads, security: res.security, publish: !!(meta.ads || meta.security) };
}

if (require.main === module) {
  const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : ''; };
  const out = arg('out') || 'out';
  build({ prev: arg('prev') || '', out, from: arg('from') || '' }).then(r => {
    const m = r.meta;
    if (m.ads) console.log('Ads and trackers: ' + m.ads.rules + ' rules (' + m.ads.sites + ' sites, ' + m.ads.patterns + ' address patterns), ' + m.ads.hide + ' hide rules, version ' + m.ads.v);
    if (m.security) console.log('Malware and phishing: ' + m.security.count + ' sites (' + m.security.malware + ' malware, ' + m.security.phishing + ' phishing), base ' + m.security.base + ', changes file ' + m.security.deltaBytes + ' bytes, version ' + m.security.v);
    console.log(r.changed ? 'The list changed.' : 'Nothing changed since last time.');
    // (the workflow publishes only when this file is there)
    if (r.changed && r.publish && arg('flag')) fs.writeFileSync(arg('flag'), 'changed\n');
    for (const e of r.errors) console.error('NOT UPDATED. ' + e);
    process.exit(r.ok ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}
module.exports = { build, readSecurity, DEFAULTS };
