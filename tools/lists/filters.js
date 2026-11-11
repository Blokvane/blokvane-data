// Filter list compiler (Adblock Plus / uBlock / AdGuard syntax -> Chrome DNR rules + cosmetic data).
// Used by the service worker to refresh lists daily, and by the robot that builds Blokvane's own list
// (blokvane-data/tools/build-lists.js runs this same file, so both always make the same rules).
const AS_UBO = 'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/';
const AS_LISTS = {
  ads: [
    'https://raw.githubusercontent.com/easylist/easylist/gh-pages/easylist.txt',
    AS_UBO + 'filters.txt',
    // (uBlock keeps its older filters in one file a year; together with filters.txt they are the full "uBlock filters")
    AS_UBO + 'filters-2020.txt', AS_UBO + 'filters-2021.txt', AS_UBO + 'filters-2022.txt', AS_UBO + 'filters-2023.txt',
    AS_UBO + 'filters-2024.txt', AS_UBO + 'filters-2025.txt', AS_UBO + 'filters-2026.txt',
    AS_UBO + 'quick-fixes.txt',
    // (fixes for sites that the lists above break, and sites that misuse your computer, like hidden coin miners)
    AS_UBO + 'unbreak.txt',
    AS_UBO + 'resource-abuse.txt',
    'https://raw.githubusercontent.com/AdguardTeam/AdGuardSDNSFilter/gh-pages/Filters/filter.txt'
  ],
  privacy: ['https://raw.githubusercontent.com/easylist/easylist/gh-pages/easyprivacy.txt', AS_UBO + 'privacy.txt'],
  annoyances: [AS_UBO + 'annoyances-cookies.txt']
};
const COSMETIC_SOURCES = ['easylist.txt', 'filters.txt', 'filters-2020.txt', 'filters-2021.txt', 'filters-2022.txt', 'filters-2023.txt', 'filters-2024.txt', 'filters-2025.txt', 'filters-2026.txt',
  'quick-fixes.txt', 'unbreak.txt', 'privacy.txt'];
const COOKIE_SOURCES = ['annoyances-cookies.txt'];

const TYPE_MAP = {
  script: ['script'], image: ['image'], stylesheet: ['stylesheet'], css: ['stylesheet'], object: ['object'],
  xmlhttprequest: ['xmlhttprequest'], xhr: ['xmlhttprequest'], subdocument: ['sub_frame'], frame: ['sub_frame'],
  ping: ['ping'], beacon: ['ping'], media: ['media'], font: ['font'], websocket: ['websocket'], other: ['other'],
  document: ['main_frame', 'sub_frame'], doc: ['main_frame', 'sub_frame']
};
const SKIP_OPTS = new Set(['popup', 'popunder', 'csp', 'rewrite', 'removeparam', 'badfilter', 'redirect-rule', 'replace',
  'header', 'permissions', 'urltransform', 'uritransform', 'cname', 'empty', 'mp4', 'jsonprune', 'hls', 'cookie', 'stealth',
  'network', 'app', 'urlskip', 'to-be-removed']);
const IGNORE_OPTS = new Set(['match-case', 'all', 'strict1p', 'strict3p', 'genericblock', 'inline-script', 'inline-font', 'ehide', 'specifichide', 'shide']);
const HIDE_EXC = new Set(['generichide', 'ghide', 'elemhide', 'ehide', 'content']);
const DOMAIN_RE = /^[a-z0-9][a-z0-9.-]*$/;
const TLDS = ['.com', '.net', '.org', '.co.uk', '.de', '.fr', '.it', '.es', '.ca', '.com.au', '.jp', '.ru', '.pl', '.nl', '.com.br', '.in', '.io', '.tv'];
const PROCEDURAL = /:(has-text|contains|-abp-|matches-css|matches-attr|matches-path|matches-media|matches-prop|min-text-length|watch-attr|upward|xpath|remove|style|others|if|if-not|nth-ancestor|properties|remove-attr|remove-class|shadow)\b|^\+js|^\^/;
const PURE_DOMAIN = /^\|\|([a-z0-9][a-z0-9.-]*[a-z0-9])\^(\|)?$/;
const OPT_RE = /^[~a-z0-9_-]+(=.*)?(,[~a-z0-9_-]+(=.*)?)*$/i;

function asSplitDomains(val) {
  const inc = [], exc = [];
  for (let d of val.split('|')) {
    d = d.trim().toLowerCase();
    if (!d) continue;
    const neg = d.startsWith('~');
    d = d.replace(/^~+/, '');
    const ds = d.endsWith('.*') ? TLDS.map(t => d.slice(0, -2) + t) : [d];
    for (const x of ds) if (DOMAIN_RE.test(x)) (neg ? exc : inc).push(x);
  }
  return [inc, exc];
}

function asParseNetwork(line) {
  const allow = line.startsWith('@@');
  if (allow) line = line.slice(2);
  let pattern = line;
  const opts = {};
  const idx = line.lastIndexOf('$');
  if (idx >= 0) {
    const cand = line.slice(idx + 1);
    if (cand === '' || OPT_RE.test(cand)) {
      pattern = line.slice(0, idx);
      for (const o of cand.split(',')) {
        if (!o) continue;
        const eq = o.indexOf('=');
        const k = (eq < 0 ? o : o.slice(0, eq)).trim().toLowerCase();
        opts[k] = eq < 0 ? '' : o.slice(eq + 1);
      }
    }
  }
  if (pattern.length > 2 && pattern.startsWith('/') && pattern.endsWith('/')) return null;
  if (pattern.startsWith('||*.')) pattern = '||' + pattern.slice(4);
  else if (pattern.startsWith('||*')) pattern = pattern.slice(2);
  if (!pattern || pattern === '*' || pattern === '|' || pattern === '||') {
    if (!opts.domain && !opts.from) return null;
    pattern = '';
  }
  if (/[^\x00-\x7f]/.test(pattern)) return null;

  const cond = {};
  const rtypes = [], xtypes = [];
  let priority = 1;
  for (const [k, v] of Object.entries(opts)) {
    const neg = k.startsWith('~');
    const kk = k.replace(/^~+/, '');
    if (SKIP_OPTS.has(kk)) return null;
    if (kk === 'redirect') continue;
    if (kk === 'third-party' || kk === '3p') cond.domainType = neg ? 'firstParty' : 'thirdParty';
    else if (kk === 'first-party' || kk === '1p') cond.domainType = neg ? 'thirdParty' : 'firstParty';
    else if (kk === 'domain' || kk === 'from') {
      const [inc, exc] = asSplitDomains(v);
      if (inc.length) cond.initiatorDomains = inc;
      if (exc.length) cond.excludedInitiatorDomains = exc;
      if (!inc.length && !exc.length) return null;
    } else if (kk === 'to') {
      const [inc, exc] = asSplitDomains(v);
      if (inc.length) cond.requestDomains = inc;
      if (exc.length) cond.excludedRequestDomains = exc;
    } else if (kk === 'denyallow') {
      const [inc] = asSplitDomains(v);
      if (inc.length) cond.excludedRequestDomains = inc;
    } else if (kk === 'important') priority = 3;
    else if (kk === 'match-case') cond.isUrlFilterCaseSensitive = true;
    else if (HIDE_EXC.has(kk) || ['specifichide', 'shide', 'jsinject', 'urlblock', 'extension'].includes(kk)) {
      return allow ? { hideException: pattern, kind: kk } : null;
    } else if (TYPE_MAP[kk]) (neg ? xtypes : rtypes).push(...TYPE_MAP[kk]);
    else if (IGNORE_OPTS.has(kk)) continue;
    else return null;
  }
  if (rtypes.length) cond.resourceTypes = [...new Set(rtypes)].sort();
  else if (xtypes.length) cond.excludedResourceTypes = [...new Set(xtypes)].sort();
  if (pattern) cond.urlFilter = pattern;
  let action;
  if (allow) {
    if ((cond.resourceTypes || []).includes('main_frame')) {
      action = { type: 'allowAllRequests' };
      cond.resourceTypes = cond.resourceTypes.filter(t => t === 'main_frame' || t === 'sub_frame');
    } else action = { type: 'allow' };
    priority = priority === 1 ? 2 : 4;
  } else action = { type: 'block' };
  return { priority, action, condition: cond };
}

function asCompileNetwork(texts, generichide) {
  const batches = { all: new Set(), '3p': new Set() };
  const rules = [];
  const seen = new Set();
  for (const text of texts) {
    for (let line of text.split('\n')) {
      line = line.trim();
      if (!line || line[0] === '!' || line[0] === '[' || line[0] === '#') continue;
      if (/#@?#|#\?#|#\$#|#%#/.test(line)) continue;
      if (!line.startsWith('@@')) {
        const di = line.indexOf('$');
        const body = di >= 0 ? line.slice(0, di) : line;
        const opt = di >= 0 ? line.slice(di + 1) : '';
        const m = PURE_DOMAIN.exec(body);
        if (m && (opt === '' || opt === 'third-party' || opt === '3p')) {
          batches[opt ? '3p' : 'all'].add(m[1]);
          continue;
        }
      }
      const r = asParseNetwork(line);
      if (!r) continue;
      if (r.hideException !== undefined) {
        const mm = /^\|\|([a-z0-9.-]+)\^?$/.exec(r.hideException);
        if (mm && HIDE_EXC.has(r.kind)) generichide.add(mm[1]);
        continue;
      }
      const key = JSON.stringify(r);
      if (seen.has(key)) continue;
      seen.add(key);
      rules.push(r);
    }
  }
  const out = [];
  for (const [k, set] of Object.entries(batches)) {
    const doms = [...set].sort();
    for (let i = 0; i < doms.length; i += 5000) {
      const cond = { requestDomains: doms.slice(i, i + 5000), excludedResourceTypes: ['main_frame'] };
      if (k === '3p') cond.domainType = 'thirdParty';
      out.push({ priority: 1, action: { type: 'block' }, condition: cond });
    }
  }
  return out.concat(rules);
}

function asCompileCosmetic(texts) {
  const generic = new Set();
  const specific = {};
  const exceptions = {};
  const add = (map, k, s) => (map[k] ||= new Set()).add(s);
  for (const text of texts) {
    for (let line of text.split('\n')) {
      line = line.trim();
      if (!line || line[0] === '!') continue;
      const m = /^([^#]*)(##|#@#)(.+)$/.exec(line);
      if (!m) continue;
      const sel = m[3].trim();
      if (PROCEDURAL.test(sel)) continue;
      const hosts = m[1].split(',').map(h => h.trim().toLowerCase()).filter(Boolean);
      const pos = hosts.filter(h => !h.startsWith('~'));
      const neg = hosts.filter(h => h.startsWith('~')).map(h => h.slice(1));
      if (m[2] === '#@#') { (pos.length ? pos : ['*']).forEach(h => add(exceptions, h, sel)); continue; }
      if (!pos.length) { generic.add(sel); neg.forEach(h => add(exceptions, h, sel)); }
      else pos.forEach(h => add(specific, h, sel));
    }
  }
  const obj = map => Object.fromEntries(Object.entries(map).map(([k, v]) => [k, [...v]]));
  return { generic: [...generic], specific: obj(specific), exceptions: obj(exceptions) };
}

async function asFetchText(url) {
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
  return r.text();
}

// Downloads every list and compiles it. Returns { rules, cosmetic }.
async function asBuildFromNetwork() {
  const generichide = new Set();
  const named = {};
  const rules = [];
  for (const [group, urls] of Object.entries(AS_LISTS)) {
    const texts = [];
    for (const u of urls) {
      try {
        const t = await asFetchText(u);
        texts.push(t);
        named[u.split('/').pop()] = t;
      } catch (e) {
        console.warn('Blokvane: list failed', u, e.message);
      }
    }
    if (!texts.length) throw new Error('no lists downloaded for ' + group);
    rules.push(...asCompileNetwork(texts, generichide));
  }
  const main = asCompileCosmetic(COSMETIC_SOURCES.filter(n => named[n]).map(n => named[n]));
  const cookie = asCompileCosmetic(COOKIE_SOURCES.filter(n => named[n]).map(n => named[n]));
  const cosmetic = {
    generic: [...new Set([...main.generic, ...cookie.generic])],
    specific: main.specific,
    exceptions: main.exceptions,
    cookieSpecific: cookie.specific,
    generichide: [...generichide]
  };
  return { rules, cosmetic };
}

// ======================================================================
// Blokvane's own list. A robot in Blokvane's public GitHub data repo (blokvane-data, branch "lists") downloads the
// lists above every few hours, checks them and puts them together into one list. Each computer then gets one file
// (and for the security list only what changed) instead of every list. Data only, never code: every rule is checked
// here before it is used, and when the list can't be reached Blokvane downloads the lists itself, as before.
// ======================================================================
var BV_LIST_ROOTS = [
  'https://raw.githubusercontent.com/Blokvane/blokvane-data/lists/',
  'https://cdn.jsdelivr.net/gh/Blokvane/blokvane-data@lists/'
];
var BV_LIST_MAX = { meta: 64 * 1024, ads: 40 * 1024 * 1024, base: 60 * 1024 * 1024, delta: 30 * 1024 * 1024 };
var BV_LIST_TYPES = new Set(['main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'xmlhttprequest', 'ping', 'csp_report', 'media', 'websocket', 'webtransport', 'webbundle', 'other']);
var BV_LIST_DOMAIN = /^[a-z0-9][a-z0-9.-]{0,252}$/;

// One rule of the list, checked: only "block" and "allow" rules with the low priorities the filter lists use (so a
// list can never send you to another page, change a page's headers, or override your own blocks, the security
// lists or Kid mode), and only the kinds of conditions the compiler above makes. Anything else: null.
function bvListCheckRule(r) {
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null;
  const a = r.action, c = r.condition;
  if (!a || typeof a !== 'object' || Array.isArray(a) || !c || typeof c !== 'object' || Array.isArray(c)) return null;
  if (Object.keys(r).some(k => k !== 'priority' && k !== 'action' && k !== 'condition')) return null;
  if (Object.keys(a).length !== 1 || !['block', 'allow', 'allowAllRequests'].includes(a.type)) return null;
  if (![1, 2, 3, 4].includes(r.priority)) return null;
  const out = {};
  for (const [k, v] of Object.entries(c)) {
    if (k === 'urlFilter') {
      if (typeof v !== 'string' || !v || v.length > 2000 || /[^\x20-\x7e]/.test(v)) return null;
      out[k] = v;
    } else if (k === 'requestDomains' || k === 'excludedRequestDomains' || k === 'initiatorDomains' || k === 'excludedInitiatorDomains') {
      if (!Array.isArray(v) || !v.length || v.length > 20000 || !v.every(d => typeof d === 'string' && BV_LIST_DOMAIN.test(d))) return null;
      out[k] = v;
    } else if (k === 'resourceTypes' || k === 'excludedResourceTypes') {
      if (!Array.isArray(v) || !v.length || !v.every(t => BV_LIST_TYPES.has(t))) return null;
      out[k] = v;
    } else if (k === 'domainType') {
      if (v !== 'firstParty' && v !== 'thirdParty') return null;
      out[k] = v;
    } else if (k === 'isUrlFilterCaseSensitive') {
      if (typeof v !== 'boolean') return null;
      out[k] = v;
    } else return null;
  }
  if (out.resourceTypes && out.excludedResourceTypes) return null;
  // a rule has to say which addresses or which sites it is about
  if (!out.urlFilter && !out.requestDomains && !out.initiatorDomains) return null;
  if (a.type === 'allowAllRequests' && (!out.resourceTypes || out.resourceTypes.some(t => t !== 'main_frame' && t !== 'sub_frame'))) return null;
  return { priority: r.priority, action: { type: a.type }, condition: out };
}
function bvListCleanCosmetic(c) {
  c = c && typeof c === 'object' && !Array.isArray(c) ? c : {};
  const strs = (a, max) => Array.isArray(a) ? a.filter(s => typeof s === 'string' && s && s.length <= 2000).slice(0, max) : [];
  const map = m => {
    const o = {};
    if (m && typeof m === 'object' && !Array.isArray(m)) for (const [k, v] of Object.entries(m)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype' || k.length > 253) continue;
      const l = strs(v, 5000);
      if (l.length) o[k] = l;
    }
    return o;
  };
  return { generic: strs(c.generic, 200000), specific: map(c.specific), exceptions: map(c.exceptions), cookieSpecific: map(c.cookieSpecific), generichide: strs(c.generichide, 100000) };
}
// The whole ad and tracker list, checked. A list where more than a few rules fail the check is not used at all.
function bvListCheckAds(obj) {
  if (!obj || typeof obj !== 'object' || obj.format !== 1 || !Array.isArray(obj.rules)) throw new Error('The list is not in the right form.');
  const rules = [];
  for (const r of obj.rules) { const ok = bvListCheckRule(r); if (ok) rules.push(ok); }
  if (rules.length < obj.rules.length * 0.98) throw new Error('Too many rules in the list failed the check.');
  return { rules, cosmetic: bvListCleanCosmetic(obj.cosmetic) };
}
function bvListCheckMeta(m) {
  const hex = s => typeof s === 'string' && /^[0-9a-f]{64}$/.test(s);
  const ver = s => typeof s === 'string' && /^[0-9a-z]{1,40}$/.test(s);
  if (!m || typeof m !== 'object' || m.format !== 1) throw new Error('The list index is not in the right form.');
  const out = {};
  const a = m.ads, s = m.security;
  if (a && typeof a === 'object' && ver(a.v) && hex(a.sha256)) out.ads = { v: a.v, sha256: a.sha256 };
  if (s && typeof s === 'object' && ver(s.v) && ver(s.base) && hex(s.baseSha256) && hex(s.deltaSha256)) out.security = { v: s.v, base: s.base, baseSha256: s.baseSha256, deltaSha256: s.deltaSha256 };
  // what the list teaches: addresses that scam pages crowd under (plain names only; lib/scamrules.js checks them again
  // and uses them as a warning sign, never as a block)
  const h = m.hints;
  if (h && typeof h === 'object' && Array.isArray(h.crowded)) out.hints = { crowded: h.crowded.filter(x => typeof x === 'string' && x.length <= 80 && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(x)).slice(0, 400) };
  return out;
}
async function bvListGet(url, max) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 90000);
  try {
    const r = await fetch(url, { cache: 'no-store', credentials: 'omit', signal: ctl.signal });
    if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status);
    const text = await r.text();
    if (text.length > max) throw new Error(url + ' is too big');
    return text;
  } finally { clearTimeout(t); }
}
async function bvListSha(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// The ad, tracker and cookie-notice list. have: the version this browser already uses ('' when none).
// Returns { same: true, v } when there is nothing new, or { rules, cosmetic, v } like asBuildFromNetwork. Throws when
// the list can't be used (the caller then downloads the lists itself).
async function asBuildFromBlokvane(have) {
  let lastErr = null;
  for (const root of BV_LIST_ROOTS) {
    try {
      const meta = bvListCheckMeta(JSON.parse(await bvListGet(root + 'meta.json', BV_LIST_MAX.meta)));
      if (!meta.ads) throw new Error('The list has no ad part yet.');
      if (have && meta.ads.v === have) return { same: true, v: have };
      const text = await bvListGet(root + 'ads.json', BV_LIST_MAX.ads);
      if (await bvListSha(text) !== meta.ads.sha256) throw new Error('The ad list does not match its fingerprint.');
      const built = bvListCheckAds(JSON.parse(text));
      return { rules: built.rules, cosmetic: built.cosmetic, v: meta.ads.v };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('The list could not be reached.');
}

// The malware and phishing list comes in two parts: a big "base" that changes about once a week (kept on this
// computer, so it is downloaded once), and a small file with what was added and removed since.
var bvListBaseStore = {
  key: id => 'https://list.blokvane.invalid/security-base/' + id,
  async get(id) { const c = await caches.open('bv-list'); const r = await c.match(this.key(id)); return r ? r.text() : null; },
  async put(id, text) { const c = await caches.open('bv-list'); for (const k of await c.keys()) await c.delete(k); await c.put(this.key(id), new Response(text)); }
};
function bvSecurityApply(base, delta) {
  const arr = a => Array.isArray(a) ? a.filter(d => typeof d === 'string') : [];
  const del = new Set(arr(delta && delta.del));
  const out = {};
  for (const kind of ['malware', 'phishing']) {
    const set = new Set();
    for (const d of arr(base && base[kind])) if (!del.has(d)) set.add(d);
    for (const d of arr(delta && delta.add && delta.add[kind])) set.add(d);
    out[kind] = [...set];
  }
  return out;
}
// Returns { same: true, v, hints } or { malware: [...], phishing: [...], v, hints }. Throws when the list can't be used.
async function bvSecurityFromBlokvane(have, store) {
  store = store || bvListBaseStore;
  let lastErr = null;
  for (const root of BV_LIST_ROOTS) {
    try {
      const meta = bvListCheckMeta(JSON.parse(await bvListGet(root + 'meta.json', BV_LIST_MAX.meta)));
      const s = meta.security, hints = meta.hints || null;
      if (!s) throw new Error('The list has no security part yet.');
      if (have && s.v === have) return { same: true, v: have, hints };
      let baseText = null;
      try { baseText = await store.get(s.base); } catch (e) {}
      if (baseText && await bvListSha(baseText) !== s.baseSha256) baseText = null;
      if (!baseText) {
        baseText = await bvListGet(root + 'security-base.json', BV_LIST_MAX.base);
        if (await bvListSha(baseText) !== s.baseSha256) throw new Error('The security list does not match its fingerprint.');
        try { await store.put(s.base, baseText); } catch (e) {}
      }
      const deltaText = await bvListGet(root + 'security-delta.json', BV_LIST_MAX.delta);
      if (await bvListSha(deltaText) !== s.deltaSha256) throw new Error('The security changes do not match their fingerprint.');
      const base = JSON.parse(baseText), delta = JSON.parse(deltaText);
      if (!base || base.id !== s.base || !delta || delta.base !== s.base) throw new Error('The two parts of the security list do not belong together.');
      const out = bvSecurityApply(base, delta);
      return { malware: out.malware, phishing: out.phishing, v: s.v, hints };
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('The list could not be reached.');
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AS_LISTS, asCompileNetwork, asCompileCosmetic, asBuildFromNetwork, asBuildFromBlokvane, bvSecurityFromBlokvane, bvSecurityApply, bvListCheckRule, bvListCheckAds,
    bvListCheckMeta, bvListCleanCosmetic, bvListSha, BV_LIST_ROOTS };
}
