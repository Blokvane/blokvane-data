#!/usr/bin/env node
// Makes the table Smart Country Blocking uses to tell which country a server is in (see lib/geo.js). It is made from
// the "server-country" tables of https://github.com/sapics/ip-location-db, which are in the public domain (PDDL 1.0)
// and are put together from the regional internet registries' public figures, public routing records and network
// operators' own published locations.
//
// The same file lives in two places and is used in two ways:
//
//   In the app repo, before a release (the copy that comes inside the extension):
//     node tools/build-geo.js                  downloads today's tables and writes blokvane/data/geo.bin
//     node tools/build-geo.js --from <folder>  uses server-country-ipv4-num.csv and server-country-ipv6.csv from a folder
//
//   In blokvane-data, by the robot once a week (.github/workflows/blokvane-geo.yml). The extension fetches what it
//   publishes, so the table stays fresh without a new release:
//     node tools/build-geo.js --out <folder>/geo.bin --note <folder>/geo.json --prev <folder published last time> --flag <file>
//   --note: also writes the small note the extension checks the table against, and the credits
//   --prev: a table much smaller than the one published last time is refused (that one stays)
//   --flag: this file is made when there is a table to publish
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
// (lib/geo.js of the extension; blokvane-data keeps a copy of it in tools/geo/)
const inApp = path.join(__dirname, '..', 'blokvane', 'lib', 'geo.js');
const G = require(fs.existsSync(inApp) ? inApp : path.join(__dirname, 'geo', 'geo.js'));
const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ''; };
const ROOT = 'https://github.com/sapics/ip-location-db/releases/download/latest/';

async function text(name) {
  if (arg('--from')) return fs.readFileSync(path.join(arg('--from'), name), 'utf8');
  const r = await fetch(ROOT + name, { redirect: 'follow' });
  if (!r.ok) throw new Error(name + ' -> HTTP ' + r.status);
  return r.text();
}
// (the last address of a block, as the first 64 bits of it)
const top = a => { const p = G.parseIp(a); return p && p.v === 6 ? p : null; };

function rows(v4text, v6text) {
  const rows4 = [], rows6 = [];
  for (const line of v4text.split('\n')) {
    const c = line.trim().split(',');
    if (c.length !== 3 || !/^[A-Z]{2}$/.test(c[2])) continue;
    const from = Number(c[0]), to = Number(c[1]);
    if (Number.isInteger(from) && Number.isInteger(to) && from >= 0 && to >= from && to <= 0xffffffff) rows4.push({ from, to, cc: c[2] });
  }
  for (const line of v6text.split('\n')) {
    const c = line.trim().split(',');
    if (c.length !== 3 || !/^[A-Z]{2}$/.test(c[2])) continue;
    const a = top(c[0]), b = top(c[1]);
    if (a && b) rows6.push({ hi: a.hi, lo: a.lo, hi2: b.hi, lo2: b.lo, cc: c[2] });
  }
  rows4.sort((x, y) => x.from - y.from);
  rows6.sort((x, y) => x.hi - y.hi || x.lo - y.lo);
  return { rows4, rows6 };
}
const toBuffer = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);

// The table, checked, with its note. o: { min4, min6 (fewest rows a real table has), made (20261115), prev (the table
// published last time, as bytes, when there is one) }. Throws when the table can't be used.
function build(v4text, v6text, o = {}) {
  const { rows4, rows6 } = rows(v4text, v6text);
  const min4 = o.min4 == null ? 100000 : o.min4, min6 = o.min6 == null ? 50000 : o.min6;
  // (tables that came back far too small are not used: the one from last time stays)
  if (rows4.length < min4 || rows6.length < min6) throw new Error('The tables came back too small (' + rows4.length + ' and ' + rows6.length + ' rows).');
  const d = new Date();
  const made = o.made || d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  const buf = Buffer.from(G.pack(rows4, rows6, made));
  // read it back the way the extension reads it, and ask it about a few rows of each table
  const table = G.load(toBuffer(buf));
  let bad = 0;
  for (let i = 0; i < rows4.length; i += 997) { const r = rows4[i]; if (G.country(table, { v: 4, n: r.from }) !== r.cc || G.country(table, { v: 4, n: r.to }) !== r.cc) bad++; }
  for (let i = 0; i < rows6.length; i += 997) { const r = rows6[i]; if (G.country(table, { v: 6, hi: r.hi, lo: r.lo }) !== r.cc) bad++; }
  if (bad > 5) throw new Error(bad + ' of the rows tried do not come back the same from the table.');
  // next to the one published last time: much smaller means something went wrong at the source
  if (o.prev) {
    let last = null;
    try { last = G.load(toBuffer(Buffer.from(o.prev))); } catch (e) {}
    if (last && (table.v4.length < last.v4.length * 0.7 || table.hi.length < last.hi.length * 0.7 || table.names.length < last.names.length * 0.7)) {
      throw new Error('The new table is much smaller than the one published last time (' + table.v4.length + ' + ' + table.hi.length + ' entries, was ' + last.v4.length + ' + ' + last.hi.length + ').');
    }
  }
  const note = { format: 1, made, bytes: buf.length, sha256: crypto.createHash('sha256').update(buf).digest('hex'), v4: table.v4.length, v6: table.hi.length, countries: table.names.length - 1 };
  if (!G.checkNote(note)) throw new Error('The note for the table is not in the form the extension reads.');
  return { buf, note, table, rows4: rows4.length, rows6: rows6.length };
}

const CREDITS = `Blokvane's country table (geo.bin) says which country a server's address is in. Blokvane's Country blocking uses it.

It is made once a week by tools/build-geo.js in https://github.com/Blokvane/blokvane-data from the "server-country"
tables of ip-location-db: https://github.com/sapics/ip-location-db
License: Public Domain Dedication and License (PDDL) 1.0, https://opendatacommons.org/licenses/pddl/1-0/
Those tables are put together from the public statistics of the five regional internet registries (AFRINIC, APNIC,
ARIN, LACNIC, RIPE NCC) and the NRO, the Route Views and RIPE RIS routing archives, and the geofeeds that network
operators publish.

geo.json is the note the extension checks the table against: the day it was made, its size and its fingerprint.
`;

async function main() {
  const out = path.resolve(arg('--out') || path.join(__dirname, '..', 'blokvane', 'data', 'geo.bin'));
  let prev = null;
  if (arg('--prev')) { try { prev = fs.readFileSync(path.join(arg('--prev'), 'geo.bin')); } catch (e) {} }
  const b = build(await text('server-country-ipv4-num.csv'), await text('server-country-ipv6.csv'), { prev });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, b.buf);
  if (arg('--note')) {
    fs.writeFileSync(path.resolve(arg('--note')), JSON.stringify(b.note) + '\n');
    fs.writeFileSync(path.join(path.dirname(path.resolve(arg('--note'))), 'CREDITS.txt'), CREDITS);
  }
  if (arg('--flag')) fs.writeFileSync(path.resolve(arg('--flag')), 'yes\n');
  console.log('Wrote ' + out + ': ' + b.buf.length + ' bytes, ' + b.note.v4 + ' + ' + b.note.v6 + ' entries from ' + b.rows4 + ' + ' + b.rows6 + ' rows, ' + b.note.countries + ' countries, made ' + b.note.made + '.');
}
if (require.main === module) main().catch(e => { console.error('The country table was not renewed:', e.message); process.exit(1); });
module.exports = { rows, build, CREDITS };
