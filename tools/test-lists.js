// Checks of the list robot (tools/build-lists.js) and of the extension's side of it (tools/lists/filters.js), with
// made-up lists in a temporary folder. Nothing is downloaded and nothing is published.   node --test tools/test-lists.js
'use strict';
const test = require('node:test'), assert = require('node:assert'), fs = require('fs'), os = require('os'), path = require('path'), zlib = require('zlib');
const { build, readReported } = require('./build-lists.js');
const F = require('./lists/filters.js');

const AD_FILES = ['easylist.txt', 'filters.txt', 'filters-2020.txt', 'filters-2021.txt', 'filters-2022.txt', 'filters-2023.txt', 'filters-2024.txt', 'filters-2025.txt', 'filters-2026.txt',
  'quick-fixes.txt', 'unbreak.txt', 'resource-abuse.txt', 'filter.txt', 'easyprivacy.txt', 'privacy.txt', 'annoyances-cookies.txt'];
// (scale: each security list's least number of sites, from sources.json, made small enough for made-up lists: 100,000 becomes 5)
const FLOORS = { adRules: 5, listBytes: 5, scale: 0.00005 };
// the most-visited sites, made up: a shop, a page on a big platform (so the platform itself is above a popular site), one far down the list, and a
// sale shop that is very popular this month but was not on the list a year ago (202510.csv.gz, for the builds below, which run "in November 2026")
const TOPS = Array.from({ length: 12 }, (_, i) => 'https://top' + i + '.example,5000').join('\n') + '\n';
const popular = extra => zlib.gzipSync('origin,rank\nhttps://www.popular-shop.example,1000\nhttps://pages.big-platform.example,50000\nhttps://far-down.example,1000000\n' +
  'https://big-sale-this-month.example,1000\n' + TOPS + (extra || ''));
const popularThen = () => zlib.gzipSync('origin,rank\nhttps://popular-shop.example,5000\nhttps://pages.big-platform.example,1000000\nhttps://far-down.example,500000\n' + TOPS);
const REPORTED = ['2026-10-30 10:00:00,someone,domain,whole-site.example,#phishing #scam,https://x.com/someone/status/1',
  '2026-10-30 10:00:00,someone,url,http://whole-site.example/,#phishing #scam,https://x.com/someone/status/1',
  '2026-10-30 11:00:00,other,domain,hacked-shop.example,#phishing,https://x.com/other/status/2',
  '2026-10-30 11:00:00,other,url,https://hacked-shop.example/wp-content/x/login.php,#phishing,https://x.com/other/status/2',
  '2026-10-30 12:00:00,other,domain,control-server.example,#c2 #malware,https://x.com/other/status/3',
  '2026-10-30 12:00:00,other,url,http://203.0.113.9/login,#phishing,https://x.com/other/status/4',
  '2026-10-30 13:00:00,other,domain,Scam-Only.example,#Scam,https://x.com/other/status/5',
  '2026-10-30 13:00:00,other,sha256,780fa4d52e121810b8a350fe52ba14495ea830ff71cf24d3a08f8027c3403d7e,#phishing,https://x.com/other/status/6', 'not a line', ''].join('\n');
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
    'badware.txt': '! made up\n||malware1.example^\n||malware2.example^$doc\n||bad-both.example^\n||skipme.example^$script\n/path-only/*\n',
    // the newer scam lists: MetaMask's (config.json), polkadot{.js}'s (all.json), the sites reported this month (month.csv)
    'config.json': JSON.stringify({ version: 2, tolerance: 2, fuzzylist: [], whitelist: ['metamask.io'], blacklist: ['fake-wallet1.example', 'fake-wallet2.example', 'www.fake-wallet3.example'] }),
    'all.json': JSON.stringify({ allow: ['polkadot.network'], deny: ['fake-dot1.example', 'fake-wallet1.example'] }),
    'month.csv': REPORTED,
    'current.csv.gz': popular(),
    '202510.csv.gz': popularThen()
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
  // 40 + with-www.example (www. taken off) + 3 fake wallets + 1 more fake crypto site + 2 sites reported this month
  assert.strictEqual(sec.phishing.length, 47);
  assert.ok(sec.phishing.includes('with-www.example'));
  for (const d of ['google.com', 'video.nflxvideo.net', 'bad-both.example', 'skipme.example']) assert.ok(!sec.phishing.includes(d), d + ' must not be a phishing site');
  assert.match(fs.readFileSync(path.join(out, 'CREDITS.txt'), 'utf8'), /EasyList[\s\S]*Phishing\.Database[\s\S]*MIT[\s\S]*MetaMask[\s\S]*polkadot[\s\S]*Apache[\s\S]*TweetFeed/);
  // the licenses that ask to be passed on go with the list
  for (const f of ['Phishing.Database-LICENSE.txt', 'MetaMask-eth-phishing-detect-LICENSE.txt', 'polkadot-js-phishing-LICENSE.txt']) assert.ok(fs.statSync(path.join(out, 'licenses', f)).size > 500, f);
});

test('the newer scam lists are read: fake crypto sites, and whole scam sites reported this month', async () => {
  const from = lists(tmp()), out = tmp();
  const r = await build({ from, out, prev: '', floors: FLOORS, now: T0 });
  assert.deepStrictEqual(r.errors, []);
  const base = JSON.parse(fs.readFileSync(path.join(out, 'security-base.json'), 'utf8'));
  for (const d of ['fake-wallet1.example', 'fake-wallet2.example', 'fake-wallet3.example', 'fake-dot1.example', 'whole-site.example', 'scam-only.example']) assert.ok(base.phishing.includes(d), d);
  // a real site that was broken into is reported with a page inside it: the whole site is not blocked. Nor is a
  // bare number address, something that is not a scam page, or a name from the lists' own "these are fine" parts.
  for (const d of ['hacked-shop.example', 'control-server.example', '203.0.113.9', 'metamask.io', 'polkadot.network']) assert.ok(!base.phishing.includes(d) && !base.malware.includes(d), d);
  assert.deepStrictEqual(readReported(REPORTED).sort(), ['scam-only.example', 'whole-site.example']);
  // how many sites each list gave is written down
  const m = JSON.parse(fs.readFileSync(path.join(out, 'meta.json'), 'utf8'));
  assert.deepStrictEqual(m.security.from.map(x => x.sites), [42, 3, 3, 2, 2]);
  assert.strictEqual(m.security.count, base.phishing.length + base.malware.length);
});

test('a popular real site, a company\'s own site and shared storage are never blocked', async () => {
  const from = lists(tmp(), {
    // the newer lists name a popular shop, a platform that has a popular page on it, a page under that platform, and a site far down the list
    // (and a sale shop that is very popular this month but was not on the most-visited list a year ago)
    'config.json': JSON.stringify({ blacklist: ['popular-shop.example', 'www.popular-shop.example', 'big-platform.example', 'scam.pages.big-platform.example', 'far-down.example', 'big-sale-this-month.example',
      'fake-wallet1.example', 'fake-wallet2.example'] }),
    'all.json': JSON.stringify({ deny: ['top3.example', 'fake-dot1.example'] }),
    'month.csv': '2026-10-30 10:00:00,someone,domain,top4.example,#phishing,https://x.com/someone/status/1\n2026-10-30 10:00:00,someone,domain,whole-site.example,#phishing,https://x.com/someone/status/1\n',
    // the older list names companies' own sites (and parts of them), a storage address that holds everyone's files, a shared platform and one page on it
    'phishing-domains-ACTIVE.txt': phish(40) + 'paypal.com\nwww.paypal.com\namazon.ie\nl.instagram.com\nmercadolibre.com.ar\nlistado.mercadolibre.com.mx\ns3.us-east-1.amazonaws.com\ns3-eu-west-1.amazonaws.com\n' +
      'my-bucket.s3.us-east-1.amazonaws.com\npastebin.com\ngithub.io\nscam-page.github.io\nabc.host.secureserver.net\nevil.cloudapp.azure.com\ndev-123.okta.com\ntop5.example\n'
  }), out = tmp();
  const r = await build({ from, out, prev: '', floors: FLOORS, now: T0 });
  assert.deepStrictEqual(r.errors, []);
  const base = JSON.parse(fs.readFileSync(path.join(out, 'security-base.json'), 'utf8')), listed = new Set(base.phishing);
  for (const d of ['popular-shop.example', 'big-platform.example', 'top3.example', 'top4.example', 'paypal.com', 'amazon.ie', 'l.instagram.com', 'mercadolibre.com.ar', 'listado.mercadolibre.com.mx',
    's3.us-east-1.amazonaws.com', 's3-eu-west-1.amazonaws.com', 'pastebin.com', 'github.io']) assert.ok(!listed.has(d), d + ' must never be blocked');
  // still blocked: one page on a platform or in one bucket, a site far down the list, a customer's own name at a host or
  // a sign-in service, and (from the older list, which was always used as it is) a popular name
  // (and a site that only became popular this month: a scam site can be popular for a few weeks)
  for (const d of ['scam.pages.big-platform.example', 'far-down.example', 'big-sale-this-month.example', 'fake-wallet1.example', 'fake-dot1.example', 'whole-site.example', 'my-bucket.s3.us-east-1.amazonaws.com', 'scam-page.github.io',
    'abc.host.secureserver.net', 'evil.cloudapp.azure.com', 'dev-123.okta.com', 'top5.example']) assert.ok(listed.has(d), d + ' must be blocked');
  assert.strictEqual(r.security.spared, 5);
});

test('a small extra list that is missing does not stop the list; a big one that breaks does', async () => {
  const from = lists(tmp()), out1 = tmp(), out2 = tmp(), out3 = tmp(), out4 = tmp(), out5 = tmp();
  await build({ from, out: out1, prev: '', floors: FLOORS, now: T0 });
  // the list of sites reported this month is gone: the rest is still made, with a note
  fs.unlinkSync(path.join(from, 'month.csv'));
  let r = await build({ from, out: out2, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.ok(r.ok && r.changed);
  assert.match(r.warnings.join(' '), /TweetFeed could not be used/);
  let base = JSON.parse(fs.readFileSync(path.join(out2, 'security-delta.json'), 'utf8'));
  assert.deepStrictEqual(base.del.sort(), ['scam-only.example', 'whole-site.example']);
  // MetaMask's list comes back as something else, or nearly empty: the list published last time stays
  lists(from, { 'month.csv': REPORTED, 'config.json': '{"blacklist":"none"}' });
  r = await build({ from, out: out3, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.ok(!r.ok && !r.changed);
  assert.match(r.errors.join(' '), /MetaMask[^:]*: has no "blacklist" list/);
  lists(from, { 'config.json': JSON.stringify({ blacklist: ['fake-wallet1.example'] }) });
  r = await build({ from, out: out4, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.match(r.errors.join(' '), /MetaMask[^:]*: only 1 sites, fewer than the 3/);
  for (const f of ['security-base.json', 'security-delta.json', 'meta.json']) assert.strictEqual(fs.readFileSync(path.join(out4, f), 'utf8'), fs.readFileSync(path.join(out1, f), 'utf8'), f);
  // the list of most-visited sites can't be downloaded: the copy kept with the robot is used (wikipedia.org is on it)
  lists(from, { 'config.json': JSON.stringify({ blacklist: ['wikipedia.org', 'en.wikipedia.org', 'fake-wallet1.example', 'fake-wallet2.example', 'fake-wallet3.example'] }) });
  fs.unlinkSync(path.join(from, 'current.csv.gz'));
  r = await build({ from, out: out5, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.deepStrictEqual(r.errors, []);
  assert.match(r.warnings.join(' '), /most-visited sites[^.]*could not be downloaded/);
  base = JSON.parse(fs.readFileSync(path.join(out5, 'security-base.json'), 'utf8'));
  assert.ok(!base.phishing.includes('wikipedia.org') && !base.phishing.includes('en.wikipedia.org') && base.phishing.includes('fake-wallet2.example'));
  // the same when only the list of a year ago is missing (without it nobody can tell an established site from a new one)
  lists(from);
  lists(from, { 'config.json': JSON.stringify({ blacklist: ['wikipedia.org', 'popular-shop.example', 'fake-wallet1.example', 'fake-wallet2.example', 'fake-wallet3.example'] }) });
  fs.unlinkSync(path.join(from, '202510.csv.gz'));
  const out6 = tmp();
  r = await build({ from, out: out6, prev: out1, floors: FLOORS, now: T0 + 3600e3 });
  assert.deepStrictEqual(r.errors, []);
  assert.match(r.warnings.join(' '), /most-visited sites[^.]*could not be downloaded \(the list of a year ago/);
  // (what the extension ends up with: the big part and the changes since)
  const b6 = JSON.parse(fs.readFileSync(path.join(out6, 'security-base.json'), 'utf8')), d6 = JSON.parse(fs.readFileSync(path.join(out6, 'security-delta.json'), 'utf8'));
  const now6 = new Set([...b6.phishing, ...d6.add.phishing].filter(x => !d6.del.includes(x)));
  assert.ok(!now6.has('wikipedia.org') && now6.has('popular-shop.example'), 'the kept copy decides: a made-up shop is not on it');
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
  ['fake-wallet1.example', 'fake-wallet2.example', 'fake-wallet3.example', 'fake-dot1.example', 'whole-site.example', 'scam-only.example'].forEach(d => want.add(d));    // (the newer lists, unchanged)
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
  assert.strictEqual((await F.bvSecurityFromBlokvane('', memStore())).phishing.length, 66);         // 60 + the 6 from the newer lists
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

test('the list teaches the addresses that scam pages crowd under, and the extension gets them with the list', async () => {
  // free-pages.example: 7 listed scam sites under it and no popular site. pages.big-platform.example: 6, but a popular
  // site sits there. small.example: too few. nflxvideo.net: a company's own address (and its sites are never listed).
  const under = (n, where) => Array.from({ length: n }, (_, i) => 'scam' + i + '.' + where).join('\n') + '\n';
  const extra = under(5, 'free-pages.example') + under(2, 'eu.free-pages.example') + under(6, 'pages.big-platform.example') + under(3, 'small.example') + under(6, 'nflxvideo.net');
  const src = lists(tmp(), { 'phishing-domains-ACTIVE.txt': phish(40) + extra }), out = tmp();
  const r = await build({ from: src, out, floors: FLOORS, now: T0, hintsMin: 5 });
  assert.ok(r.ok, r.errors.join(' | '));
  assert.deepStrictEqual(r.meta.hints.crowded, ['free-pages.example']);
  assert.match(r.meta.hints.v, /^[0-9a-f]{16}$/);
  serve(out);
  const got = await F.bvSecurityFromBlokvane('', memStore());
  assert.deepStrictEqual(got.hints, { crowded: ['free-pages.example'] });
  assert.ok(got.phishing.includes('scam0.free-pages.example'), 'the listed sites themselves are still blocked');
  // (the same list again: nothing to download, the hints still come along)
  assert.deepStrictEqual(await F.bvSecurityFromBlokvane(got.v, memStore()), { same: true, v: got.v, hints: { crowded: ['free-pages.example'] } });
  // with the usual threshold of 300 there is nothing to teach in a list this small
  const big = await build({ from: src, out: tmp(), floors: FLOORS, now: T0 });
  assert.deepStrictEqual(big.meta.hints.crowded, []);
  // this month's most-visited list can't be downloaded: what was taught last time is kept, nothing new is worked out
  const src2 = lists(tmp(), { 'phishing-domains-ACTIVE.txt': phish(40) + extra + under(9, 'other-pages.example') });
  fs.rmSync(path.join(src2, 'current.csv.gz'));
  const next = await build({ from: src2, prev: out, out: tmp(), floors: FLOORS, now: T0 + 3600e3, hintsMin: 5 });
  assert.ok(next.ok, next.errors.join(' | '));
  assert.deepStrictEqual(next.meta.hints, r.meta.hints);
  // the extension keeps plain names only, whatever the file says
  const clean = F.bvListCheckMeta({ format: 1, hints: { crowded: ['ok-pages.example', 'UPPER.example', 'no-dot', 'a b.example', 42, 'x'.repeat(90) + '.example'] } });
  assert.deepStrictEqual(clean.hints, { crowded: ['ok-pages.example'] });
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
