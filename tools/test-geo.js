// Checks of the country table robot (tools/build-geo.js, tools/geo/geo.js) with made-up tables. Nothing is downloaded.
//   node --test tools/test-geo.js
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const G = require('./geo/geo.js');
const { build, rows } = require('./build-geo.js');

const CC4 = ['AU', 'FR', 'DE', 'JP'], CC6 = ['JP', 'SG', 'RU'];
const V4 = n => Array.from({ length: n }, (_, i) => `${16777216 + i * 512},${16777216 + i * 512 + 255},${CC4[i % 4]}`).join('\n') + '\n';
const V6 = n => Array.from({ length: n }, (_, i) => `2001:${(0x200 + i).toString(16)}::,2001:${(0x200 + i).toString(16)}:ffff:ffff:ffff:ffff:ffff:ffff,${CC6[i % 3]}`).join('\n') + '\n';
const asTable = buf => G.load(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

test('the table says which country every address in it is in, and nothing about the gaps between', () => {
  const b = build(V4(400), V6(300), { min4: 100, min6: 100, made: 20261115 });
  const t = asTable(b.buf);
  assert.strictEqual(t.made, 20261115);
  assert.deepStrictEqual([G.country(t, '1.0.0.0'), G.country(t, '1.0.0.255'), G.country(t, '1.0.2.9'), G.country(t, '1.0.4.1')], ['AU', 'AU', 'FR', 'DE']);
  assert.strictEqual(G.country(t, '1.0.1.7'), '', 'an address between two rows belongs to nobody');
  assert.strictEqual(G.country(t, '203.0.113.9'), '', 'an address after the last row');
  assert.deepStrictEqual([G.country(t, '2001:200::1'), G.country(t, '2001:201:ffff::9'), G.country(t, '2001:202::')], ['JP', 'SG', 'RU']);
  assert.strictEqual(G.country(t, '2a00::1'), '');
  // (lines that are not rows are skipped, wherever they are)
  const messy = rows('first,last,country\n16777216,16777471,AU\n\n5,4,FR\n16777472,16777727,xx\n16777728,16777983,FR\n', 'junk\n2001:200::,2001:200:ffff:ffff:ffff:ffff:ffff:ffff,JP\n');
  assert.deepStrictEqual([messy.rows4.map(r => r.cc), messy.rows6.map(r => r.cc)], [['AU', 'FR'], ['JP']]);
});

test('the note matches the table, and the extension reads it', () => {
  const b = build(V4(400), V6(300), { min4: 100, min6: 100, made: 20261115 });
  assert.deepStrictEqual(Object.keys(b.note), ['format', 'made', 'bytes', 'sha256', 'v4', 'v6', 'countries']);
  assert.strictEqual(b.note.bytes, b.buf.length);
  assert.strictEqual(b.note.sha256, crypto.createHash('sha256').update(b.buf).digest('hex'));
  assert.strictEqual(b.note.countries, new Set([...CC4, ...CC6]).size);
  assert.deepStrictEqual(G.checkNote(JSON.parse(JSON.stringify(b.note))), { made: 20261115, bytes: b.buf.length, sha256: b.note.sha256 });
  // a note that is not in the right form is no note
  for (const [k, v] of [['format', 2], ['made', '20261115'], ['made', 1], ['bytes', 0], ['bytes', G.MAX_TABLE + 1], ['sha256', 'XY'.repeat(32)], ['sha256', 'ab']]) {
    assert.strictEqual(G.checkNote(Object.assign({}, b.note, { [k]: v })), null, k + ' = ' + v);
  }
});

test('a broken table is never published: the one from last time stays', () => {
  const last = build(V4(400), V6(300), { min4: 100, min6: 100, made: 20261108 });
  assert.throws(() => build(V4(50), V6(300), { min4: 100, min6: 100 }), /too small/);
  assert.throws(() => build(V4(400), V6(50), { min4: 100, min6: 100 }), /too small/);
  assert.throws(() => build('<html>Not found</html>\n', '', {}), /too small/, 'a web page instead of a table');
  assert.throws(() => build(V4(200), V6(300), { min4: 100, min6: 100, prev: last.buf }), /much smaller than the one published last time/);
  assert.throws(() => build(V4(400), V6(150), { min4: 100, min6: 100, prev: last.buf }), /much smaller than the one published last time/);
  // a little smaller or bigger is how the internet changes from week to week
  const next = build(V4(380), V6(320), { min4: 100, min6: 100, made: 20261115, prev: last.buf });
  assert.strictEqual(G.newer(asTable(next.buf), asTable(last.buf)), true, 'and the extension takes it');
  assert.strictEqual(G.newer(asTable(last.buf), asTable(next.buf)), false, 'never an older one');
  // (a file from last time that does not read as a table does not stop a good new one)
  assert.strictEqual(build(V4(400), V6(300), { min4: 100, min6: 100, made: 20261115, prev: Buffer.from('not a table') }).note.made, 20261115);
});

test('the robot\'s run: tables in a folder go in, a table, its note and the credits come out; a bad run leaves nothing to publish', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-geo-'));
  try {
    const from = path.join(dir, 'from'), out = path.join(dir, 'out'), flag = path.join(dir, 'changed');
    fs.mkdirSync(from); fs.mkdirSync(out);
    // (the real limits: a real table has more than 100,000 old-style and 50,000 new-style rows)
    fs.writeFileSync(path.join(from, 'server-country-ipv4-num.csv'), V4(100500));
    fs.writeFileSync(path.join(from, 'server-country-ipv6.csv'), V6(50200));
    const run = extra => execFileSync(process.execPath, [path.join(__dirname, 'build-geo.js'), '--from', from, '--out', path.join(out, 'geo.bin'), '--note', path.join(out, 'geo.json'), '--flag', flag, ...extra], { encoding: 'utf8', stdio: 'pipe' });
    assert.match(run([]), /Wrote .*geo\.bin: \d+ bytes, \d+ \+ \d+ entries from 100500 \+ 50200 rows, 6 countries/);
    const bin = fs.readFileSync(path.join(out, 'geo.bin')), note = JSON.parse(fs.readFileSync(path.join(out, 'geo.json'), 'utf8'));
    assert.strictEqual(note.sha256, crypto.createHash('sha256').update(bin).digest('hex'));
    assert.ok(G.checkNote(note) && fs.existsSync(flag));
    assert.match(fs.readFileSync(path.join(out, 'CREDITS.txt'), 'utf8'), /ip-location-db[\s\S]*Public Domain Dedication and License/);
    assert.deepStrictEqual(fs.readdirSync(out).sort(), ['CREDITS.txt', 'geo.bin', 'geo.json']);
    // next week the source is broken: the run fails, and nothing new is there to publish
    const prev = path.join(dir, 'prev'), out2 = path.join(dir, 'out2'), flag2 = path.join(dir, 'changed2');
    fs.mkdirSync(prev); fs.mkdirSync(out2);
    fs.copyFileSync(path.join(out, 'geo.bin'), path.join(prev, 'geo.bin'));
    fs.writeFileSync(path.join(from, 'server-country-ipv6.csv'), V6(100));
    assert.throws(() => execFileSync(process.execPath, [path.join(__dirname, 'build-geo.js'), '--from', from, '--out', path.join(out2, 'geo.bin'), '--note', path.join(out2, 'geo.json'), '--prev', prev, '--flag', flag2], { encoding: 'utf8', stdio: 'pipe' }),
      e => e.status === 1 && /The country table was not renewed: The tables came back too small/.test(e.stderr));
    assert.deepStrictEqual([fs.readdirSync(out2), fs.existsSync(flag2)], [[], false]);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
