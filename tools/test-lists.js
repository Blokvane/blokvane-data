// Checks of the list robot (tools/build-lists.js) and of the extension's side of it (tools/lists/filters.js), with
// made-up lists in a temporary folder. Nothing is downloaded and nothing is published.   node --test tools/test-lists.js
'use strict';
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), os = require('os'), path = require('path');
const { build } = require('./build-lists.js');
const F = require('./lists/filters.js');

const AD_FILES = ['easylist.txt', 'filters.txt', 'filters-2020.txt', 'filters-2021.txt', 'filters-2022.txt', 'filters-2023.txt', 'filters-2024.txt', 'filters-2025.txt', 'filters-2026.txt',
  'quick-fixes.txt', 'unbreak.txt', 'resource-abuse.txt', 'filter.txt', 'easyprivacy.txt', 'privacy.txt', 'annoyances-cookies.txt'];
const FLOORS = { phishing: 5, malware: 2, adRules: 5, listBytes: 5 };
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bvlist-'));
const phish = n => Array.from({ length: n }, (_, i) => 'phish' + i + '.example').join('\n') + '\n';
function lists(dir, over) {
  const files = {
    'easylist.txt': '! Title: made up\n||ads.example^\n||ads2.example^$third-party\n/banner/ad_$image\n@@||good.example/ads.js$script\nexample.org##.ad-box\n##.sponsored\n||track.example^$script,domain=shop.example\n',
    'filters.txt': '||ubo-ads.example^\nnews.example##.promo\n/popunder.$script\n',
    'unbreak.txt': '@@||cdn.example^$script,domain=bank.example\nexample.org#@#.ad-box\n',
    'easyprivacy.txt': '||tracker.example^\n/pixel.gif?$image\n',
    'privacy.txt': '||spy.example^\n',
    'annoyances-cookies.txt': '||cookiewall.example^\ncookies.example##.cookie-bar\n',
    'filter.txt': '||dnsads.example^\n||dnsads2.example^\n',
    'phishing-domains-ACTIVE.txt': phish(40) + 'google.com\nvideo.nflxvideo.net\nbad-both.example\nwww.with-www.example\nNOT A DOMAIN\n',
    'badware.txt': '! made up\n||malware1.example^\n||malware2.example^$doc\n||bad-both.example^\n||skipme.example^$script\n/path-only/*\n'
  };
  for (const f of AD_FILES) if (!files[f]) files[f] = '! made up\n||' + f.replace(/[^a-z0-9]/g, '') + '.example^\n';
  Object.assign(files, over || {});
  for (const [f, t] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), t);
  return dir;
}
// (the extension's downloads, answered from a folder on this computer)
function serve(dir, seen) {
  global.fetch = async url => {
    const name = String(url).replace(F.BV_LIST_ROOTS[0], '').replace(F.BV_LIST_ROOTS[1], '');
    if (seen) seen.push(name);
    const p = path.join(dir, name);
    if (!fs.existsSync(p)) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => fs.readFileSync(p, 'utf8') };
  };
}
const memStore = () => { const m = new Map(); return { m, async get(id) { return m.has(id) ? m.get(id) : null; }, async put(id, t) { m.clear(); m.set(id, t); } }; };
const T0 = Date.parse('2026-11-01T00:00:00Z');

test('the first build makes a whole list the extension accepts', async () => {
  const from = lists(tmp()), out = tmp();
  const r = await build({ from, out, prev: '', floors: FLOORS, now: T0 });
  assert.deepStrictEqual(r.errors, []);
  assert.ok(r.ok && r.changed && r.publish);
  const meta = JSON.parse(fs.readFileSync(path.join(out, 'meta.json'), 'utf8'));
  assert.ok(F.bvListCheckMeta(meta).ads && F.bvListCheckMeta(meta).security);
  for (const f of ['ads.json', 'security-base.json', 'security-delta.json', 'CREDITS.txt']) assert.ok(fs.existsSync(path.join(out, f)), f);
  // the extension reads it back
  serve(out);
  const ads = await F.asBuildFromBlokvane('');
  assert.strictEqual(ads.v, meta.ads.v);
  assert.strictEqual(ads.rules.length, meta.ads.rules);
  const blocked = new Set(ads.rules.filter(x => x.action.type === 'block').flatMap(x => x.condition.requestDomains || []));
  for (const d of ['ads.example', 'ads2.example', 'ubo-ads.example', 'tracker.example', 'spy.example', 'dnsads.example', 'cookiewall.example']) assert.ok(blocked.has(d), d);
  assert.ok(ads.rules.some(x => x.action.type === 'allow' && x.condition.urlFilter === '||cdn.example^'), 'the unbreak allow rule');
  assert.ok(ads.cosmetic.generic.includes('.sponsored'));
  assert.deepStrictEqual(ads.cosmetic.specific['news.example'], ['.promo']);
  assert.deepStrictEqual(ads.cosmetic.exceptions['example.org'], ['.ad-box']);
  assert.deepStrictEqual(ads.cosmetic.cookieSpecific['cookies.example'], ['.cookie-bar']);
  assert.deepStrictEqual(await F.asBuildFromBlokvane(meta.ads.v), { same: true, v: meta.ads.v });
  const sec = await F.bvSecurityFromBlokvane('', memStore());
  assert.deepStrictEqual(sec.malware.sort(), ['bad-both.example', 'malware1.example', 'malware2.example']);
  assert.strictEqual(sec.phishing.length, 41);                       // 40 + with-www.example (www. taken off)
  assert.ok(sec.phishing.includes('with-www.example'));
  for (const d of ['google.com', 'video.nflxvideo.net', 'bad-both.example', 'skipme.example']) assert.ok(!sec.phishing.includes(d), d + ' must not be a phishing site');
  assert.match(fs.readFileSync(path.join(out, 'CREDITS.txt'), 'utf8'), /EasyList[\s\S]*Phishing\.Database[\s\S]*MIT/);
});

test('the next build publishes only what changed, and the extension ends up with exactly the new list', async () => {
  // (a list big enough that a handful of changes is a small part of it)
  const BIG = phish(400) + 'bad-both.example\nwww.with-www.example\n';
  const from = lists(tmp(), { 'phishing-domains-ACTIVE.txt': BIG }), out1 = tmp(), out2 = tmp(), out3 = tmp();
  await build({ from, out: out1, prev: '', floors: FLOORS, now: T0 });
  const m1 = JSON.parse(fs.readFileSync(path.join(out1, 'meta.json'), 'utf8'));
  // nothing changed: nothing to publish
  const same = await build({ from, out: out2, prev: out1, floors: FLOORS, now: T0 + 3 * 3600e3 });
  assert.ok(same.ok && !same.changed);
  assert.strictEqual(fs.readFileSync(path.join(out2, 'meta.json'), 'utf8'), fs.readFileSync(path.join(out1, 'meta.json'), 'utf8'));
  // two new phishing sites, one gone, one that is now on the malware list
  lists(from, { 'phishing-domains-ACTIVE.txt': phish(400).replace('phish7.example\n', '') + 'new-a.example\nnew-b.example\nmalware-now.example\n',
    'badware.txt': '||malware1.example^\n||malware2.example^\n||phish3.example^\n' });
  const r = await build({ from, out: out3, prev: out1, floors: FLOORS, now: T0 + 6 * 3600e3 });
  assert.deepStrictEqual(r.errors, []);
  assert.ok(r.changed);
  const m3 = JSON.parse(fs.readFileSync(path.join(out3, 'meta.json'), 'utf8'));
  assert.strictEqual(m3.security.base, m1.security.base, 'the big part is not replaced');
  assert.strictEqual(m3.security.baseSha256, m1.security.baseSha256);
  assert.notStrictEqual(m3.security.v, m1.security.v);
  assert.strictEqual(m3.ads.v, m1.ads.v, 'the ad part did not change');
  const delta = JSON.parse(fs.readFileSync(path.join(out3, 'security-delta.json'), 'utf8'));
  assert.deepStrictEqual(delta.add.phishing.sort(), ['malware-now.example', 'new-a.example', 'new-b.example']);
  assert.deepStrictEqual(delta.add.malware, ['phish3.example']);
  assert.deepStrictEqual(delta.del.sort(), ['bad-both.example', 'phish3.example', 'phish7.example', 'with-www.example'].sort());
  // an extension that has the base already downloads only the small file
  const store = memStore(), seen = [];
  serve(out1); await F.bvSecurityFromBlokvane('', store);
  serve(out3, seen);
  const sec = await F.bvSecurityFromBlokvane(m1.security.v, store);
  assert.deepStrictEqual(seen, ['meta.json', 'security-delta.json']);
  assert.deepStrictEqual(sec.malware.sort(), ['malware1.example', 'malware2.example', 'phish3.example']);
  const want = new Set(phish(400).trim().split('\n')); want.delete('phish7.example'); want.delete('phish3.example'); ['new-a.example', 'new-b.example', 'malware-now.example'].forEach(d => want.add(d));
  assert.deepStrictEqual(sec.phishing.sort(), [...want].sort());
  // and one that never had it gets the same list
  const fresh = await F.bvSecurityFromBlokvane('', memStore());
  assert.deepStrictEqual(fresh.phishing.sort(), sec.phishing.sort());
});

test('the big part is replaced after a week, or when too much of it changed', async () => {
  const from = lists(tmp()), out1 = tmp(), out2 = tmp(), out3 = tmp();
  await build({ from, out: out1, prev: '', floors: FLOORS, now: T0 });
  const m1 = JSON.parse(fs.readFileSync(path.join(out1, 'meta.json'), 'utf8'));
  lists(from, { 'phishing-domains-ACTIVE.txt': phish(41) });
  const week = await build({ from, out: out2, prev: out1, floors: FLOORS, now: T0 + 8 * 864e5 });
  assert.notStrictEqual(week.meta.security.base, m1.security.base);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(out2, 'security-delta.json'), 'utf8')).del, []);
  lists(from, { 'phishing-domains-ACTIVE.txt': phish(60) });
  const churn = await build({ from, out: out3, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.notStrictEqual(churn.meta.security.base, m1.security.base);
  serve(out3);
  assert.strictEqual((await F.bvSecurityFromBlokvane('', memStore())).phishing.length, 60);
});

test('a list that breaks is not used: the part published last time stays', async () => {
  const from = lists(tmp()), out1 = tmp(), out2 = tmp(), out3 = tmp(), out4 = tmp();
  await build({ from, out: out1, prev: '', floors: FLOORS, now: T0 });
  // the phishing list comes back nearly empty
  lists(from, { 'phishing-domains-ACTIVE.txt': phish(3) });
  let r = await build({ from, out: out2, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.ok(!r.ok && !r.changed);
  assert.match(r.errors.join(' '), /Malware and phishing/);
  for (const f of ['security-base.json', 'security-delta.json', 'meta.json']) assert.strictEqual(fs.readFileSync(path.join(out2, f), 'utf8'), fs.readFileSync(path.join(out1, f), 'utf8'), f);
  // it shrinks by more than it ever should (above the floor, but far below last time)
  lists(from, { 'phishing-domains-ACTIVE.txt': phish(12) });
  r = await build({ from, out: out3, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.match(r.errors.join(' '), /too big a change/);
  // an ad list is missing: the ad part stays, the security part still updates
  lists(from, { 'phishing-domains-ACTIVE.txt': phish(40) + 'one-more.example\n' });
  fs.unlinkSync(path.join(from, 'easyprivacy.txt'));
  r = await build({ from, out: out4, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.ok(!r.ok && r.changed);
  assert.match(r.errors.join(' '), /Ads and trackers/);
  assert.strictEqual(fs.readFileSync(path.join(out4, 'ads.json'), 'utf8'), fs.readFileSync(path.join(out1, 'ads.json'), 'utf8'));
  serve(out4);
  assert.ok((await F.bvSecurityFromBlokvane('', memStore())).phishing.includes('one-more.example'));
  // a web page instead of a list (a "site is down" page)
  lists(from, { 'easyprivacy.txt': '<!doctype html><html><body>Service unavailable. ' + 'x'.repeat(200) + '</body></html>' });
  r = await build({ from, out: tmp(), prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.match(r.errors.join(' '), /Ads and trackers/);
});

test('the extension refuses anything in the list that is not a plain block or allow rule', () => {
  const ok = { priority: 1, action: { type: 'block' }, condition: { requestDomains: ['ads.example'], excludedResourceTypes: ['main_frame'] } };
  assert.deepStrictEqual(F.bvListCheckRule(ok), ok);
  const bad = [
    { priority: 1, action: { type: 'redirect', redirect: { url: 'https://evil.example/' } }, condition: { urlFilter: '||bank.example^' } },
    { priority: 1, action: { type: 'modifyHeaders', responseHeaders: [{ header: 'content-security-policy', operation: 'remove' }] }, condition: { urlFilter: '*' } },
    { priority: 1, action: { type: 'block', redirect: { url: 'https://evil.example/' } }, condition: { urlFilter: 'x' } },
    { priority: 250, action: { type: 'allow' }, condition: { urlFilter: '||phish.example^' } },
    { priority: 5, action: { type: 'allow' }, condition: { urlFilter: '||phish.example^' } },
    { priority: 1, action: { type: 'block' }, condition: { regexFilter: '.*' } },
    { priority: 1, action: { type: 'block' }, condition: {} },
    { priority: 1, action: { type: 'block' }, condition: { resourceTypes: ['main_frame'] } },
    { priority: 1, action: { type: 'block' }, condition: { requestDomains: ['Not A Domain'] } },
    { priority: 1, action: { type: 'block' }, condition: { urlFilter: 'x', tabIds: [1] } },
    { id: 7, priority: 1, action: { type: 'block' }, condition: { urlFilter: 'x' } },
    { priority: 2, action: { type: 'allowAllRequests' }, condition: { urlFilter: 'x', resourceTypes: ['script'] } },
    null, 'block', []
  ];
  for (const r of bad) assert.strictEqual(F.bvListCheckRule(r), null, JSON.stringify(r));
  // a list with more than a few such rules is not used at all
  assert.throws(() => F.bvListCheckAds({ format: 1, rules: [ok, bad[0], bad[1]], cosmetic: {} }), /failed the check/);
  const c = F.bvListCleanCosmetic(JSON.parse('{"generic":[".a",5,null],"specific":{"__proto__":[".x"],"a.example":[".b",{}]},"exceptions":"no"}'));
  assert.deepStrictEqual(c, { generic: ['.a'], specific: { 'a.example': ['.b'] }, exceptions: {}, cookieSpecific: {}, generichide: [] });
  assert.strictEqual(Object.getPrototypeOf(c.specific), Object.prototype);
});

test('a list that was changed on the way is not used', async () => {
  const from = lists(tmp()), out = tmp();
  await build({ from, out, prev: '', floors: FLOORS, now: T0 });
  const ads = path.join(out, 'ads.json'), delta = path.join(out, 'security-delta.json');
  fs.writeFileSync(ads, fs.readFileSync(ads, 'utf8').replace('ads.example', 'bank.example'));
  fs.writeFileSync(delta, fs.readFileSync(delta, 'utf8').replace('"del":[]', '"del":["phish1.example"]'));
  serve(out);
  await assert.rejects(F.asBuildFromBlokvane(''), /fingerprint/);
  await assert.rejects(F.bvSecurityFromBlokvane('', memStore()), /fingerprint/);
  // nothing published yet: the extension is told so, and downloads the lists itself
  serve(tmp());
  await assert.rejects(F.asBuildFromBlokvane(''));
  await assert.rejects(F.bvSecurityFromBlokvane('', memStore()));
});
