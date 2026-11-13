#!/usr/bin/env node
// Blokvane's list robot. Downloads the public block lists Blokvane uses, checks them, and puts them together into
// Blokvane's own list, which the extension downloads instead of every list (blokvane/filters.js in the extension).
// Run by .github/workflows/blokvane-list.yml every hour; the result is published on this repo's "lists" branch.
//
//   node tools/build-lists.js --prev <folder with the list published last time> --out <folder to write>
//   node tools/build-lists.js --save-popular     (now and then: renews the kept copy of the most-visited sites)
//
// What it writes:
//   meta.json             what is in the list now (versions and fingerprints); the extension reads this first. It
//                         also carries what the list teaches (hints): the addresses scam pages crowd under
//   ads.json              ads, trackers and cookie notices: ready-made Chrome rules and hide rules. Made with the
//                         extension's own compiler (tools/lists/filters.js, a copy of blokvane/filters.js)
//   ads-base.json         the same ad list as lines (one per rule): the big part, replaced about once a week
//   ads-delta.json        the lines added and removed since that base (small: what each computer downloads)
//   security-base.json    malware and phishing sites: the big part, replaced about once a week
//   security-delta.json   what was added and removed since that base (small: what each computer downloads)
//   CREDITS.txt           the lists this is made from and their licenses. The list stays under those licenses.
//   licenses/             the full text of the licenses that ask to be passed on with the list
//
// Safety: a list that fails to download, comes back much too small, or shrinks or grows wildly is not used; the
// part published last time is kept and the run ends with an error (GitHub then sends an email).
// A site is never blocked when it is on the never-block list (tools/lists/never-block.json: shared platforms,
// companies' own sites, big real sites), and the newer scam lists also leave out the 500,000 most-visited sites.
// Only lists that allow use in a paid product are in here (see tools/lists/sources.json for each one's license).
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), zlib = require('zlib');

const HERE = path.join(__dirname, 'lists');
const sha = t => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
const readJson = (p, dflt) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return dflt; } };

const DEFAULTS = {
  // (each security list has its own least number of sites in sources.json; scale is for the checks with made-up lists)
  floors: { adRules: 8000, listBytes: 3000, scale: 1 },
  // lists marked "guard" never add a site that is among this many most-visited sites now and was already on the
  // most-visited list that many months ago (a scam site can be popular for a few weeks: only a site that has been
  // popular for a year counts as an established one)
  guardRank: 500000, guardMonths: 12,
  // what the list teaches (see crowded): an address counts when at least this many listed scam sites sit under it
  hintsMin: 300, hintsMax: 300,
  maxAdRules: 28000,          // what the extension can load (MAX_LIST_RULES in background.js)
  shrink: 0.7, grow: 3,       // against the count published last time
  baseDays: 7, baseChurn: 0.15
};

// One list, as text (or, with bytes, as it came). from: a folder with the lists as files (named like the last part
// of each address), for tests.
async function fetchText(url, from, bytes) {
  if (from) return fs.readFileSync(path.join(from, url.replace(/\/+$/, '').split('/').pop()), bytes ? null : 'utf8');
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 120000);
      try {
        const r = await fetch(url, { signal: ctl.signal, headers: { 'user-agent': 'blokvane-list-robot (+https://github.com/Blokvane/blokvane-data)' } });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return bytes ? Buffer.from(await r.arrayBuffer()) : await r.text();
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
  vm.runInContext(fs.readFileSync(path.join(HERE, 'filters.js'), 'utf8') + '\n;this.API = { asBuildFromNetwork, bvListCheckAds, bvAdsItems };', ctx);
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
  return { text: JSON.stringify({ format: 1, v, rules: body.rules, cosmetic: body.cosmetic }), v, rules: n, sites: doms.size, patterns, hide, domains: doms,
    itemsOf: obj => JSON.parse(JSON.stringify(ctx.API.bvAdsItems(obj))) };
}

// ---------- malware and phishing ----------
// The scam and phishing sites security researchers reported in the last 30 days (TweetFeed: lines of
// date,user,type,value,tags,link). Only whole sites: a site that was reported with a page deeper inside it
// (example.com/wp-content/x/login.php) is most often a real site that was broken into, and blocking all of it
// would punish its owner and its visitors. The file only ever holds 30 days, so a site drops out by itself.
function readReported(text) {
  const deep = new Map();
  for (const line of text.split('\n')) {
    const c = line.split(',');
    if (c.length !== 6 || !/^(url|domain)$/.test(c[2]) || !/#(phishing|scam)\b/i.test(c[4])) continue;
    const v = c[3].trim().toLowerCase().replace(/^hxxp/, 'http').replace(/\[\.\]/g, '.');
    let host = v, inside = false;
    if (c[2] === 'url') {
      const m = /^https?:\/\/([^\/?#]+)([^?#]*)/.exec(v);
      if (!m) continue;
      host = m[1].split('@').pop().split(':')[0];
      inside = m[2].replace(/\/+$/, '') !== '';
    }
    if (/^[\d.]+$/.test(host)) continue;                              // a bare number address
    deep.set(host, deep.get(host) || inside);
  }
  return [...deep].filter(x => !x[1]).map(x => x[0]);
}
// The most-visited sites (Chrome's public list, lines of origin,rank), down to the rank asked for. If it can't be
// downloaded, the copy kept next to this file is used. A list marked "guard" never adds one of these sites, nor a
// name above one of them (blocking example.com would also block shop.example.com). A name under one of them, a page
// someone put up on a big platform, can still be blocked.
// "202510": the month that many months before a day
const monthBefore = (day, back) => { const d = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth() - back, 1)); return d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0'); };
// the site names in a most-visited list (lines of "address,rank"; the kept copy has names only)
function popularNames(buf, maxRank) {
  const set = new Set();
  for (const line of zlib.gunzipSync(buf).toString('utf8').split('\n')) {
    const c = line.split(',');
    if (c.length > 1 && !(Number(c[1]) <= maxRank)) continue;
    const h = c[0].trim().toLowerCase().replace(/^https?:\/\//, '').replace(/[\/:].*$/, '').replace(/^www\./, '');
    if (h.includes('.')) set.add(h);
  }
  return set;
}
// The established popular sites: among the most visited now, and already on the list a year ago. Last month's fake
// sale shop and this month's look-alike of a game's site can be very popular too, and those must not be spared.
async function establishedSites(o, src) {
  const least = src.floor * o.floors.scale;
  const buf = await fetchText(src.url, o.from, true);
  const now = popularNames(buf, o.guardRank);
  if (now.size < least) throw new Error('only ' + now.size + ' sites');
  // (the newest list is about last month's, so a year before it is 13 months back; a month next to it will do too)
  const day = new Date(o.now || Date.now());
  let then = null, last = null;
  for (const back of [o.guardMonths + 1, o.guardMonths + 2, o.guardMonths]) {
    try {
      const t = popularNames(await fetchText(src.past.replace('{month}', monthBefore(day, back)), o.from, true), Infinity);
      if (t.size >= least) { then = t; break; }
      last = new Error('only ' + t.size + ' sites in the list of a year ago');
    } catch (e) { last = e; }
  }
  if (!then) throw new Error('the list of a year ago: ' + (last && last.message));
  const both = new Set();
  for (const h of now) if (then.has(h)) both.add(h);
  if (both.size < least) throw new Error('only ' + both.size + ' sites were on both lists');
  // (all: every site on this month's list, however far down, for crowded() below)
  return { names: both, all: popularNames(buf, Infinity) };
}
async function popularSites(o, src, warnings) {
  let names, all = null;
  try { const e = await establishedSites(o, src); names = e.names; all = e.all; } catch (e) {
    warnings.push(src.name + ' could not be downloaded (' + e.message + '); the copy from ' + src.copy + ' was used.');
    names = popularNames(fs.readFileSync(path.join(HERE, src.copy)), Infinity);
  }
  // (and the names above each one: a platform with a popular page on it is itself a popular site)
  const set = new Set();
  for (let h of names) for (;;) { set.add(h); const i = h.indexOf('.'); if (h.indexOf('.', i + 1) < 0) break; h = h.slice(i + 1); }
  if (set.size < src.floor * o.floors.scale) throw new Error(src.name + ': only ' + set.size + ' sites, it cannot be right');
  return { set, all };
}
// What the list teaches: the addresses that scam pages crowd under. A free page service, a web host's temporary
// address, or a scam site's own name that gets a new name in front of it every day: hundreds of the listed scam sites
// sit under it, and not one site on this month's most-visited list does (a million sites). The extension treats a
// page under one of them as a warning sign (lib/scamrules.js: setHints), so the scam page put there tomorrow is
// noticed before any list has it. It is never a block, and never a company's own address.
function crowded(domains, all, never, o) {
  const real = new Set();
  for (let h of all) for (;;) { real.add(h); const i = h.indexOf('.'); if (i < 0 || h.indexOf('.', i + 1) < 0) break; h = h.slice(i + 1); }
  const official = new Set([...never.official, ...(never.companies || [])]), shapes = (never.shapes || []).map(x => new RegExp(x));
  const isOfficial = d => { for (let x = d; x;) { if (official.has(x)) return true; const i = x.indexOf('.'); if (i < 0) return false; x = x.slice(i + 1); } return false; };
  const count = new Map();
  for (const h of domains) for (let i = h.indexOf('.'); i >= 0; i = h.indexOf('.', i + 1)) { const e = h.slice(i + 1); if (!e.includes('.')) break; count.set(e, (count.get(e) || 0) + 1); }
  let keep = [...count].filter(([e, n]) => n >= o.hintsMin && e.length <= 80 && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(e) && !real.has(e) && !isOfficial(e) && !shapes.some(x => x.test(e)));
  // (only the shortest: an address under one that is kept already adds nothing)
  const kept = new Set(keep.map(x => x[0]));
  keep = keep.filter(([e]) => { for (let i = e.indexOf('.'); i >= 0; i = e.indexOf('.', i + 1)) if (kept.has(e.slice(i + 1))) return false; return true; });
  return keep.sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).slice(0, o.hintsMax).map(x => x[0]).sort();
}
// (the same reading of each list as the extension's own, background2.js: updateSecurity)
function readSecurity(text, fmt, src) {
  if (fmt === 'json') {                                               // site names in one of the lists of a JSON file
    let o;
    try { o = JSON.parse(text); } catch (e) { throw new Error('is not the JSON file it should be'); }
    if (!o || !Array.isArray(o[src.field])) throw new Error('has no "' + src.field + '" list');
    return o[src.field].filter(x => typeof x === 'string');
  }
  if (fmt === 'reported') return readReported(text);
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
async function buildSecurity(o, sources, never, warnings) {
  const platform = new Set(never.platform), official = new Set([...never.official, ...(never.companies || [])]), shapes = (never.shapes || []).map(x => new RegExp(x));
  const isOfficial = d => { for (let x = d; x;) { if (official.has(x)) return true; const i = x.indexOf('.'); if (i < 0) return false; x = x.slice(i + 1); } return false; };
  const byKind = { malware: new Set(), phishing: new Set() }, from = [];
  const guard = sources.find(s => s.part === 'guard');
  const pop = guard && sources.some(s => s.part === 'security' && s.guard) ? await popularSites(o, guard, warnings) : { set: new Set(), all: null };
  const popular = pop.set;
  let spared = 0;
  for (const src of sources.filter(s => s.part === 'security')) {
    let names;
    try {
      const text = await fetchText(src.url, o.from);
      if (!looksLikeAList(text, o.floors.listBytes)) throw new Error('came back too small or is not a list');
      names = readSecurity(text, src.format, src);
    } catch (e) {
      // (a small extra list that is missing must not stop the whole list from updating)
      if (!src.optional) throw new Error(src.name + ': ' + e.message);
      warnings.push(src.name + ' could not be used this time (' + e.message + '). The list was made without it.');
      from.push({ name: src.name, sites: 0 });
      continue;
    }
    let n = 0;
    for (let d of names) {
      d = String(d).toLowerCase().replace(/^www\./, '').replace(/\.$/, '');
      if (!/^[a-z0-9][a-z0-9.-]*\.[a-z0-9-]{2,}$/.test(d) || d.length > 253 || platform.has(d) || isOfficial(d) || shapes.some(x => x.test(d)) || d === 'localhost') continue;
      if (src.guard && popular.has(d)) { spared++; continue; }
      byKind[src.kind].add(d); n++;
    }
    const floor = Math.ceil((src.floor || 0) * o.floors.scale);
    if (n < floor) throw new Error(src.name + ': only ' + n + ' sites, fewer than the ' + floor + ' it always has');
    from.push({ name: src.name, sites: n });
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
  return { baseText, deltaText, v, base: base.id, baseMade, count, malware: full.malware.length, phishing: full.phishing.length, from, spared,
    changes: delta.add.malware.length + delta.add.phishing.length + delta.del.length, domains: new Set([...full.malware, ...full.phishing]), popularAll: pop.all };
}

// "Only what changed" for the ad list: the base published last time, while it is fresh enough, and the lines added and
// removed since; or a new base (about once a week, or when much changed).
function adsParts(o, text, itemsOf) {
  const items = itemsOf(JSON.parse(text));
  const v = JSON.parse(text).v;
  let base = null, baseText = null;
  const pm = o.prevMeta.ads;
  if (pm && pm.base) {
    try {
      const t = fs.readFileSync(path.join(o.prev, 'ads-base.json'), 'utf8');
      if (sha(t) === pm.baseSha256) { const b = JSON.parse(t); if (b.id === pm.base && Array.isArray(b.items)) { base = b; baseText = t; } }
    } catch (e) {}
  }
  let add = [], del = [];
  if (base) {
    const had = new Set(base.items), now = new Set(items);
    add = items.filter(x => !had.has(x));
    del = base.items.filter(x => !now.has(x));
  }
  const age = base && pm.baseMade ? (o.now - Date.parse(pm.baseMade)) / 864e5 : Infinity;
  const churn = base ? (add.length + del.length) / Math.max(1, base.items.length) : 1;
  let baseMade = pm && pm.baseMade;
  if (!base || !(age < o.baseDays) || churn > o.baseChurn) {
    const d = new Date(o.now);
    base = { format: 1, id: 'a' + d.toISOString().replace(/[-:T]/g, '').slice(0, 12), items };
    baseText = JSON.stringify(base);
    baseMade = d.toISOString();
    add = []; del = [];
  }
  const deltaText = JSON.stringify({ format: 1, base: base.id, v, add, del });
  return { baseText, deltaText, base: base.id, baseMade, changes: add.length + del.length };
}

function credits(sources) {
  const rows = sources.map(s => '- ' + s.name + ': ' + s.home + '\n  License: ' + s.license + '\n  Used for: ' + s.use).join('\n');
  return 'Blokvane\'s list is made from these public lists. Thank you to the people who keep them.\n' +
    'Each list keeps its own license, and Blokvane\'s list (the files in this folder) is shared under the same licenses:\n' +
    'you may use and share it under their terms, with these credits. The licenses folder has the full text of the\n' +
    'licenses that ask to be passed on.\n\n' + rows + '\n\n' +
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
  const errors = [], warnings = [], meta = { format: 1, made: o.prevMeta.made || '' }, res = {};
  const keep = (name) => { try { fs.copyFileSync(path.join(o.prev, name), path.join(o.out, name)); return true; } catch (e) { return false; } };
  const stamp = new Date(o.now).toISOString();

  try {
    const a = res.ads = await buildAds(o);
    fs.writeFileSync(path.join(o.out, 'ads.json'), a.text);
    const p = res.adsParts = adsParts(o, a.text, a.itemsOf);
    fs.writeFileSync(path.join(o.out, 'ads-base.json'), p.baseText);
    fs.writeFileSync(path.join(o.out, 'ads-delta.json'), p.deltaText);
    const same = o.prevMeta.ads && o.prevMeta.ads.v === a.v;
    meta.ads = { v: a.v, sha256: sha(a.text), bytes: Buffer.byteLength(a.text), rules: a.rules, sites: a.sites, patterns: a.patterns, hide: a.hide,
      base: p.base, baseSha256: sha(p.baseText), baseMade: p.baseMade, deltaSha256: sha(p.deltaText), deltaBytes: Buffer.byteLength(p.deltaText),
      made: same ? o.prevMeta.ads.made : stamp };
  } catch (e) {
    errors.push('Ads and trackers: ' + e.message);
    if (o.prevMeta.ads && keep('ads.json')) { meta.ads = o.prevMeta.ads; if (meta.ads.base && !(keep('ads-base.json') && keep('ads-delta.json'))) { delete meta.ads.base; } }
  }
  try {
    const s = res.security = await buildSecurity(o, sources, never, warnings);
    fs.writeFileSync(path.join(o.out, 'security-base.json'), s.baseText);
    fs.writeFileSync(path.join(o.out, 'security-delta.json'), s.deltaText);
    const same = o.prevMeta.security && o.prevMeta.security.v === s.v && o.prevMeta.security.base === s.base;
    meta.security = { v: s.v, base: s.base, baseSha256: sha(s.baseText), baseMade: s.baseMade, deltaSha256: sha(s.deltaText), deltaBytes: Buffer.byteLength(s.deltaText),
      count: s.count, malware: s.malware, phishing: s.phishing, from: s.from, made: same ? o.prevMeta.security.made : stamp };
    // (what the list teaches. Without this month's most-visited list it can't be worked out safely: last time's is kept.)
    if (s.popularAll) { const c = res.crowded = crowded(s.domains, s.popularAll, never, o); meta.hints = { v: sha(c.join('\n')).slice(0, 16), crowded: c }; }
    else if (o.prevMeta.hints) meta.hints = o.prevMeta.hints;
  } catch (e) {
    errors.push('Malware and phishing: ' + e.message);
    if (o.prevMeta.security && keep('security-base.json') && keep('security-delta.json')) meta.security = o.prevMeta.security;
    if (o.prevMeta.hints) meta.hints = o.prevMeta.hints;
  }
  meta.sources = sources.map(s => ({ name: s.name, home: s.home, license: s.license }));
  const strip = m => JSON.stringify(Object.assign({}, m, { made: '' }));
  const changed = strip(meta) !== strip(o.prevMeta);
  if (changed || !meta.made) meta.made = stamp;
  fs.writeFileSync(path.join(o.out, 'meta.json'), JSON.stringify(meta, null, 1) + '\n');
  fs.writeFileSync(path.join(o.out, 'CREDITS.txt'), credits(sources));
  fs.mkdirSync(path.join(o.out, 'licenses'), { recursive: true });
  for (const s of sources) if (s.licenseFile) fs.copyFileSync(path.join(HERE, 'licenses', s.licenseFile), path.join(o.out, 'licenses', s.licenseFile));
  fs.writeFileSync(path.join(o.out, 'README.md'), '# Blokvane\'s list\n\nMade automatically every hour by the robot on the main branch (tools/build-lists.js). The Blokvane extension downloads these files.\nSee CREDITS.txt for the lists it is made from and their licenses.\n');
  return { ok: !errors.length, changed, errors, warnings, meta, ads: res.ads, security: res.security, publish: !!(meta.ads || meta.security) };
}

// Renews tools/lists/popular-sites.txt.gz, the copy of the established popular sites that is used when the live lists
// can't be downloaded (names only, one a line).
async function savePopular() {
  const src = readJson(path.join(HERE, 'sources.json'), null).sources.find(s => s.part === 'guard');
  const { names } = await establishedSites(Object.assign({}, DEFAULTS, { from: '' }), src);
  fs.writeFileSync(path.join(HERE, src.copy), zlib.gzipSync([...names].sort().join('\n') + '\n', { level: 9 }));
  return names.size;
}

if (require.main === module && process.argv.includes('--save-popular')) {
  savePopular().then(n => console.log('Saved the ' + n + ' established popular sites.')).catch(e => { console.error(e); process.exit(2); });
} else if (require.main === module) {
  const arg = n => { const i = process.argv.indexOf('--' + n); return i > 0 ? process.argv[i + 1] : ''; };
  const out = arg('out') || 'out';
  build({ prev: arg('prev') || '', out, from: arg('from') || '' }).then(r => {
    const m = r.meta;
    if (m.ads) console.log('Ads and trackers: ' + m.ads.rules + ' rules (' + m.ads.sites + ' sites, ' + m.ads.patterns + ' address patterns), ' + m.ads.hide + ' hide rules, version ' + m.ads.v);
    if (m.security) console.log('Malware and phishing: ' + m.security.count + ' sites (' + m.security.malware + ' malware, ' + m.security.phishing + ' phishing), base ' + m.security.base + ', changes file ' + m.security.deltaBytes + ' bytes, version ' + m.security.v);
    for (const f of (m.security && m.security.from) || []) console.log('  from ' + f.name + ': ' + f.sites);
    if (r.security && r.security.spared) console.log('  left out because they are among the most-visited sites: ' + r.security.spared);
    if (m.hints) console.log('Addresses that scam pages crowd under (a warning sign for the extension): ' + m.hints.crowded.length);
    for (const w of r.warnings) console.log('Note: ' + w);
    console.log(r.changed ? 'The list changed.' : 'Nothing changed since last time.');
    // (the workflow publishes only when this file is there)
    if (r.changed && r.publish && arg('flag')) fs.writeFileSync(arg('flag'), 'changed\n');
    for (const e of r.errors) console.error('NOT UPDATED. ' + e);
    process.exit(r.ok ? 0 : 1);
  }).catch(e => { console.error(e); process.exit(2); });
}
module.exports = { build, readSecurity, readReported, crowded, DEFAULTS };
