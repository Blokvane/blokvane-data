// Blokvane country lookup: which country a server's address belongs to, worked out on this computer from a table
// inside the extension (data/geo.bin, made by tools/build-geo.js from the public "server-country" table). No address
// is ever looked up online. The table itself renews about once a week while Country blocking is on (bg-country.js
// fetches the one Blokvane's robot publishes). Used by Smart Country Blocking (bg-country.js, countries.html).
(function (root) {
  'use strict';

  // "203.0.113.9" -> { v: 4, n }. "2001:db8::1" -> { v: 6, hi, lo }: its first 64 bits as two numbers, which is the
  // part that says whose network it is. Anything else -> null.
  function parseIp(text) {
    let s = String(text == null ? '' : text).trim().toLowerCase();
    if (s[0] === '[') s = s.replace(/^\[|\](:\d+)?$/g, '');
    s = s.replace(/%.*$/, '');
    const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(s);
    if (v4) {
      const p = v4.slice(1).map(Number);
      if (p.some(x => x > 255)) return null;
      return { v: 4, n: ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0 };
    }
    if (!s.includes(':') || !/^[0-9a-f:.]+$/.test(s)) return null;
    // (an old-style address written inside a new-style one: ::ffff:203.0.113.9)
    const tail = /^(.*:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(s);
    if (tail) {
      const inner = parseIp(tail[2]);
      if (!inner) return null;
      if (/^(0{0,4}:){0,5}:?(ffff:)$|^::ffff:$|^::$/.test(tail[1])) return inner;
      s = tail[1] + (inner.n >>> 16).toString(16) + ':' + (inner.n & 0xffff).toString(16);
    }
    const halves = s.split('::');
    if (halves.length > 2) return null;
    const groups = h => h === '' ? [] : h.split(':');
    const a = groups(halves[0]), b = halves.length === 2 ? groups(halves[1]) : [];
    if ([...a, ...b].some(g => !/^[0-9a-f]{1,4}$/.test(g))) return null;
    const fill = 8 - a.length - b.length;
    if (halves.length === 2 ? fill < 1 : fill !== 0) return null;
    const g = [...a, ...Array(halves.length === 2 ? fill : 0).fill('0'), ...b].map(x => parseInt(x, 16));
    return { v: 6, hi: ((g[0] << 16) | g[1]) >>> 0, lo: ((g[2] << 16) | g[3]) >>> 0 };
  }
  const isLocal = ip => { const p = typeof ip === 'string' ? parseIp(ip) : ip; return !!p && (p.v === 4 ? (p.n >>> 24) === 127 || (p.n >>> 24) === 10 || (p.n >>> 16) === 0xc0a8 || (p.n >>> 20) === 0xac1 || (p.n >>> 16) === 0xa9fe : (p.hi === 0 && p.lo === 0) || (p.hi >>> 25) === 0x7e || (p.hi >>> 22) === 0x3fa); };

  // ---------- the table (see pack below for how it is laid out)
  function load(buf) {
    const dv = new DataView(buf);
    if (buf.byteLength < 32 || dv.getUint32(0, true) !== 0x31475642) throw new Error('This is not a Blokvane country table.');
    const made = dv.getUint32(4, true), n4 = dv.getUint32(8, true), n6 = dv.getUint32(12, true), nc = dv.getUint32(16, true);
    let at = 32;
    const need = at + n4 * 4 + n6 * 8 + nc * 2 + n4 + n6;
    if (need > buf.byteLength || nc > 255) throw new Error('The country table is cut short.');
    const v4 = new Uint32Array(buf, at, n4); at += n4 * 4;
    const hi = new Uint32Array(buf, at, n6); at += n6 * 4;
    const lo = new Uint32Array(buf, at, n6); at += n6 * 4;
    const names = [''];
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < nc; i++) names.push(String.fromCharCode(bytes[at + i * 2], bytes[at + i * 2 + 1]));
    at += nc * 2;
    const c4 = new Uint8Array(buf, at, n4); at += n4;
    const c6 = new Uint8Array(buf, at, n6);
    return { made, v4, hi, lo, c4, c6, names };
  }
  // The robot publishes a fresh table with a small note next to it: { format: 1, made: 20261115, bytes, sha256 }.
  // That note, read with care (null when it is not in the right form).
  const MAX_TABLE = 16 * 1024 * 1024;
  function checkNote(m) {
    if (!m || typeof m !== 'object' || Array.isArray(m) || m.format !== 1) return null;
    const { made, bytes, sha256 } = m;
    if (!Number.isInteger(made) || made < 20250101 || made > 20991231) return null;
    if (!Number.isInteger(bytes) || bytes < 32 || bytes > MAX_TABLE) return null;
    if (typeof sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(sha256)) return null;
    return { made, bytes, sha256 };
  }
  // May table t take the place of the one in use? Only when it was made later and is not much smaller: a table that
  // lost a third of its rows is broken, not newer.
  function newer(t, cur) {
    if (!t || !t.v4 || !t.hi || !(t.made > 0)) return false;
    if (!cur) return true;
    return t.made > cur.made && t.v4.length >= cur.v4.length * 0.7 && t.hi.length >= cur.hi.length * 0.7 && t.names.length >= cur.names.length * 0.7;
  }
  // the two-letter code of the country a server's address is in ('' when the table does not know)
  function country(t, ip) {
    const p = typeof ip === 'string' ? parseIp(ip) : ip;
    if (!t || !p) return '';
    let a = 0, b, at = -1;
    if (p.v === 4) {
      b = t.v4.length - 1;
      while (a <= b) { const m = (a + b) >>> 1; if (t.v4[m] <= p.n) { at = m; a = m + 1; } else b = m - 1; }
      return at < 0 ? '' : t.names[t.c4[at]] || '';
    }
    b = t.hi.length - 1;
    while (a <= b) { const m = (a + b) >>> 1; if (t.hi[m] < p.hi || (t.hi[m] === p.hi && t.lo[m] <= p.lo)) { at = m; a = m + 1; } else b = m - 1; }
    return at < 0 ? '' : t.names[t.c6[at]] || '';
  }
  // Rows of { from, to, cc } (old-style addresses as numbers) and { hi, lo, hi2, lo2, cc } (the first 64 bits of the
  // first and last new-style address), sorted, become one table: every row's first address with its country, and an
  // empty entry where nobody has the addresses in between. Laid out as a 32-byte head ("BVG1", the day it was made,
  // how many of each), the first addresses as 4-byte numbers, the country codes, then one byte per row saying which.
  function pack(rows4, rows6, made) {
    const codes = [...new Set([...rows4, ...rows6].map(r => r.cc))].filter(c => /^[A-Z]{2}$/.test(c)).sort();
    if (codes.length > 255) throw new Error('Too many country codes.');
    const idx = new Map(codes.map((c, i) => [c, i + 1]));
    const a4 = [], k4 = [];
    const put4 = (n, c) => { if (k4.length && k4[k4.length - 1] === c) return; if (a4.length && a4[a4.length - 1] === n) { k4[k4.length - 1] = c; return; } a4.push(n); k4.push(c); };
    let end = -1;
    for (const r of rows4) {
      if (!(r.from > end) || r.to < r.from) continue;                       // (rows that overlap an earlier one are left out)
      if (r.from > end + 1) put4(end + 1, 0);
      put4(r.from, idx.get(r.cc) || 0);
      end = r.to;
    }
    if (end < 0xffffffff) put4(end + 1, 0);
    const h6 = [], l6 = [], k6 = [];
    const after = (h, l) => l === 0xffffffff ? [h + 1, 0] : [h, l + 1];
    const less = (h, l, h2, l2) => h < h2 || (h === h2 && l < l2);
    const put6 = (h, l, c) => { if (k6.length && k6[k6.length - 1] === c) return; if (h6.length && h6[h6.length - 1] === h && l6[l6.length - 1] === l) { k6[k6.length - 1] = c; return; } h6.push(h); l6.push(l); k6.push(c); };
    let eh = -1, el = 0xffffffff;                                            // (the last address that has an owner so far)
    for (const r of rows6) {
      const [nh, nl] = eh < 0 ? [0, 0] : after(eh, el);
      if (eh >= 0 && less(r.hi, r.lo, nh, nl)) continue;
      if (less(nh, nl, r.hi, r.lo)) put6(nh, nl, 0);
      put6(r.hi, r.lo, idx.get(r.cc) || 0);
      eh = r.hi2; el = r.lo2;
    }
    if (eh >= 0 && !(eh === 0xffffffff && el === 0xffffffff)) { const [nh, nl] = after(eh, el); if (nh <= 0xffffffff) put6(nh, nl, 0); }
    const n4 = a4.length, n6 = h6.length;
    const buf = new ArrayBuffer(32 + n4 * 4 + n6 * 8 + codes.length * 2 + n4 + n6 + 3 & ~3);
    const dv = new DataView(buf);
    dv.setUint32(0, 0x31475642, true); dv.setUint32(4, made >>> 0, true); dv.setUint32(8, n4, true); dv.setUint32(12, n6, true); dv.setUint32(16, codes.length, true);
    let at = 32;
    for (const n of a4) { dv.setUint32(at, n, true); at += 4; }
    for (const n of h6) { dv.setUint32(at, n, true); at += 4; }
    for (const n of l6) { dv.setUint32(at, n, true); at += 4; }
    for (const c of codes) { dv.setUint8(at++, c.charCodeAt(0)); dv.setUint8(at++, c.charCodeAt(1)); }
    for (const c of k4) dv.setUint8(at++, c);
    for (const c of k6) dv.setUint8(at++, c);
    return buf;
  }

  // ---------- exceptions: one address ("203.0.113.9") or a block of them ("203.0.113.0/24", "2001:db8::/32")
  function parseRange(text) {
    const s = String(text == null ? '' : text).trim().toLowerCase();
    const m = /^([0-9a-f:.]+)(?:\/(\d{1,3}))?$/.exec(s);
    if (!m) return null;
    const ip = parseIp(m[1]);
    if (!ip) return null;
    const max = ip.v === 4 ? 32 : 128;
    const bits = m[2] === undefined ? max : Number(m[2]);
    if (bits < (ip.v === 4 ? 8 : 16) || bits > max) return null;            // (never a block so big that it is half the internet)
    return Object.assign({ bits, text: m[1] + (bits === max ? '' : '/' + bits) }, ip);
  }
  const mask = b => b <= 0 ? 0 : b >= 32 ? 0xffffffff : (0xffffffff << (32 - b)) >>> 0;
  function inRange(ip, r) {
    const p = typeof ip === 'string' ? parseIp(ip) : ip;
    if (!p || !r || p.v !== r.v) return false;
    if (p.v === 4) return ((p.n & mask(r.bits)) >>> 0) === ((r.n & mask(r.bits)) >>> 0);
    // (only the first 64 bits are kept: a whole network or one of its parts, which is what an exception is for)
    const b = Math.min(64, r.bits);
    return ((p.hi & mask(b)) >>> 0) === ((r.hi & mask(b)) >>> 0) && ((p.lo & mask(b - 32)) >>> 0) === ((r.lo & mask(b - 32)) >>> 0);
  }

  // ---------- a country's own endings (example.ru, example.рф)
  // Not the endings that are sold to everyone for their letters (.io, .co, .tv, .ai, .me ...): a site on one of those
  // says nothing about where it is.
  const OPEN_ENDINGS = new Set(['io', 'co', 'me', 'tv', 'ai', 'cc', 'ws', 'to', 'fm', 'ly', 'gg', 'sh', 'ac', 'tk', 'ml', 'ga', 'cf', 'gq', 'nu', 'la', 'vc', 'im', 'bz', 'pw', 'st', 'cx', 'am', 'dj', 'gl',
    'so', 'ms', 'ag', 'sc', 'md', 'pm', 'tf', 'wf', 'yt', 'gs', 'nf', 'tc', 'vg', 'lc', 'sx', 'cv', 'tl']);
  const MORE_ENDINGS = { GB: ['uk'], RU: ['su', 'xn--p1ai'], CN: ['xn--fiqs8s', 'xn--fiqz9s'], HK: ['xn--j6w193g'], TW: ['xn--kprw13d', 'xn--kpry57d'], KR: ['xn--3e0b707e'], IN: ['xn--h2brj9c', 'xn--mgbbh1a71e'],
    AE: ['xn--mgbaam7a8h'], SA: ['xn--mgberp4a5d4ar'], EG: ['xn--wgbh1c'], RS: ['xn--90a3ac'], UA: ['xn--j1amh'], BY: ['xn--90ais'], KZ: ['xn--80ao21a'], TH: ['xn--o3cw4h'], SG: ['xn--yfro4i67o', 'xn--clchc0ea0b2g2a9gcd'],
    GR: ['xn--qxam'], IR: ['xn--mgba3a4f16a'], QA: ['xn--wgbl6a'], MA: ['xn--mgbc0a9azcg'], DZ: ['xn--lgbbat1ad8j'], TN: ['xn--pgbs0dh'], MY: ['xn--mgbx4cd0ab'], OM: ['xn--mgb9awbf'], SY: ['xn--ogbpf8fl'],
    JO: ['xn--mgbayh7gpa'], IQ: ['xn--mgbtx2b'], SD: ['xn--mgbpl2fh'], PS: ['xn--ygbi2ammx'], LK: ['xn--fzc2c9e2c', 'xn--xkc2al3hye2a'], BD: ['xn--54b7fta0cc'], GE: ['xn--node'], MN: ['xn--l1acc'], MK: ['xn--d1alf'],
    BG: ['xn--90ae'], MO: ['xn--mix891f'] };
  function tldsFor(cc) {
    cc = String(cc || '').toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return [];
    const own = cc.toLowerCase();
    return [...(OPEN_ENDINGS.has(own) ? [] : [own]), ...(MORE_ENDINGS[cc] || [])].filter(t => !OPEN_ENDINGS.has(t));
  }
  // the country whose ending a site's name has ('' for .com and the like)
  const ENDING_OF = new Map();
  for (const [cc, list] of Object.entries(MORE_ENDINGS)) for (const t of list) ENDING_OF.set(t, cc);
  function countryOfName(host) {
    const tld = String(host || '').toLowerCase().replace(/\.$/, '').split('.').pop();
    if (ENDING_OF.has(tld)) return ENDING_OF.get(tld);
    return /^[a-z]{2}$/.test(tld) && !OPEN_ENDINGS.has(tld) ? tld.toUpperCase() : '';
  }
  // a site name as people type it: "https://www.Example.ru/page" -> "example.ru" ('' when it is not a site name)
  function cleanSite(text) {
    let s = String(text == null ? '' : text).trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, '').replace(/[/?#].*$/, '').replace(/:\d+$/, '').replace(/^www\./, '').replace(/\.$/, '');
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s) && s.length <= 253 && !/^\d+(\.\d+){3}$/.test(s) ? s : '';
  }

  const api = { parseIp, isLocal, load, country, pack, parseRange, inRange, tldsFor, countryOfName, cleanSite, checkNote, newer, OPEN_ENDINGS, MAX_TABLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BVGeo = api;
})(typeof self !== 'undefined' ? self : this);
