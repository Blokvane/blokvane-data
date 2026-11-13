#!/usr/bin/env node
// The watch robot's checks from outside (run by .github/workflows/blokvane-watch.yml every 15 minutes). It looks at
// what Blokvane's server cannot see about itself, and writes a small report: which checks passed, and nothing private.
//
//   node tools/watch.js --out report.json [--site-down 0|1] [--relays]
//
// Each check has a level, like the server's alerts: 0 all good, 1 heads-up, 2 act, 3 urgent.
//   LISTS-STALE   the list robot's last good run (older than 6 hours: act; 24: urgent)
//   FREE-RELAYS   the free relays, once a day (--relays): at least 20 of the 28 Nostr relays and 2 of the 3 MQTT
//                 brokers must answer (24: heads-up). Spare relays are tried too, so a tested replacement is ready.
//   CERT          the security certificates of blokvane.com, www.blokvane.com, app.blokvane.com (14 days: act; 5: urgent)
//   DOMAIN        the name blokvane.com (45 days: act; 14: urgent)
//   ALERTS-ALIVE  the server's alert checker ran in the last 10 minutes
//   PAGES-SIZE    the size of this repository's pages (600 MB: heads-up)
//   SITE-DOWN     from the step before: did every address answer (--site-down 1: one did not)
// The exit code is 1 when any check is at "act" or above, so GitHub emails the owner even when the server is down.
'use strict';
const fs = require('fs'), path = require('path'), tls = require('tls'), vm = require('vm');

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const OUT = arg('--out', 'report.json');
const REPO = process.env.GITHUB_REPOSITORY || 'Blokvane/blokvane-data';
const GH = { 'User-Agent': 'blokvane-watch', Accept: 'application/vnd.github+json', ...(process.env.GITHUB_TOKEN ? { Authorization: 'Bearer ' + process.env.GITHUB_TOKEN } : {}) };
const DAY = 864e5, HOUR = 36e5;

async function json(url, headers, ms = 20000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { headers, signal: ac.signal });
    if (!r.ok) throw new Error(url + ' answered ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

async function listsStale(now) {
  const d = await json(`https://api.github.com/repos/${REPO}/actions/workflows/blokvane-list.yml/runs?status=success&per_page=1`, GH);
  const run = (d.workflow_runs || [])[0];
  if (!run) return { level: 2, text: 'The list robot has no good run yet.' };
  const h = (now - Date.parse(run.updated_at)) / HOUR;
  return { level: h >= 24 ? 3 : h >= 6 ? 2 : 0, value: Math.round(h * 10) / 10, text: `The block list was rebuilt ${h < 1 ? 'less than an hour' : Math.floor(h) + ' hours'} ago.` };
}

function certDays(host, now) {
  return new Promise(res => {
    const s = tls.connect({ host, port: 443, servername: host, timeout: 15000 }, () => {
      const c = s.getPeerCertificate();
      s.end();
      res(c && c.valid_to ? (Date.parse(c.valid_to) - now) / DAY : null);
    });
    s.on('error', () => res(null));
    s.on('timeout', () => { s.destroy(); res(null); });
  });
}
async function certs(now) {
  const hosts = ['blokvane.com', 'www.blokvane.com', 'app.blokvane.com'];
  const days = await Promise.all(hosts.map(h => certDays(h, now)));
  const min = Math.min(...days.map(d => (d == null ? Infinity : d)));
  const missing = hosts.filter((h, i) => days[i] == null);
  const worst = hosts[days.indexOf(min)] || hosts[0];
  if (min === Infinity) return { level: 0, text: 'The certificates could not be read this time (the site check says whether the sites answer).' };
  const d = Math.floor(min);
  return { level: min < 5 ? 3 : min < 14 ? 2 : 0, value: d, text: `${worst}: ${d} days left.` + (missing.length ? ` Not read: ${missing.join(', ')}.` : '') };
}

async function domain(now) {
  const d = await json('https://rdap.verisign.com/com/v1/domain/blokvane.com', { Accept: 'application/rdap+json' });
  const ev = (d.events || []).find(e => e.eventAction === 'expiration');
  if (!ev) return { level: 0, text: 'The registry did not say when the name ends.' };
  const days = Math.floor((Date.parse(ev.eventDate) - now) / DAY);
  return { level: days < 14 ? 3 : days < 45 ? 2 : 0, value: days, text: `blokvane.com: ${days} days left.` };
}

async function alertsAlive() {
  const d = await json('https://blokvane.com/v1/health/alerts', {});
  return d.ok ? { level: 0, text: 'The alert checker ran in the last 10 minutes.' } : { level: 3, text: 'The alert checker did not run in the last 10 minutes.' };
}

async function pagesSize() {
  const d = await json(`https://api.github.com/repos/${REPO}`, GH);
  const mb = Math.round((d.size || 0) / 1024);
  return { level: mb >= 600 ? 1 : 0, value: mb, text: `The pages are ${mb} MB of GitHub's 1 GB.` };
}

// ---------- the free relays (once a day) ----------
function relayLists() {
  const ctx = { console, TextEncoder, TextDecoder, crypto: globalThis.crypto, atob, btoa };
  vm.createContext(ctx);
  const root = path.join(__dirname, '..');
  vm.runInContext(fs.readFileSync(path.join(root, 'tv', 'wt-core.js'), 'utf8') + '\n;this.BVWT_CORE = BVWT_CORE;', ctx);
  vm.runInContext(fs.readFileSync(path.join(root, 'go', 'wt-net.js'), 'utf8') + '\n;this.BVWT_NET = BVWT_NET;', ctx);
  return { nostr: ctx.BVWT_NET.NOSTR, mqtt: ctx.BVWT_NET.MQTT.map(m => m.url), core: ctx.BVWT_CORE };
}
// spare relays: tried too, so a tested replacement is ready the day one of the 28 stops
const SPARE = ['wss://relay.damus.io', 'wss://relay.primal.net', 'wss://nostr.mom', 'wss://relay.snort.social', 'wss://offchain.pub'];
function nostrAlive(url) {
  return new Promise(res => {
    let ws, done = false;
    const end = ok => { if (done) return; done = true; try { ws.close(); } catch (e) {} res(ok); };
    try { ws = new WebSocket(url); } catch (e) { res(false); return; }
    const t = setTimeout(() => end(false), 9000);
    ws.onopen = () => { try { ws.send(JSON.stringify(['REQ', 'bvwatch', { kinds: [20000], limit: 1, since: Math.floor(Date.now() / 1000) }])); } catch (e) { clearTimeout(t); end(false); } };
    ws.onmessage = ev => { if (/^\["(EOSE|EVENT|NOTICE|CLOSED)"/.test(String(ev.data))) { clearTimeout(t); end(true); } };
    ws.onerror = () => { clearTimeout(t); end(false); };
  });
}
function mqttAlive(url, core) {
  return new Promise(res => {
    let ws, done = false;
    const end = ok => { if (done) return; done = true; try { ws.close(); } catch (e) {} res(ok); };
    try { ws = new WebSocket(url, 'mqtt'); ws.binaryType = 'arraybuffer'; } catch (e) { res(false); return; }
    const t = setTimeout(() => end(false), 9000);
    ws.onopen = () => { try { ws.send(core.MQ.connect('bvwatch' + Date.now(), url.includes('shiftr') ? 'public' : undefined, url.includes('shiftr') ? 'public' : undefined, 30)); } catch (e) { clearTimeout(t); end(false); } };
    ws.onmessage = ev => { const b = new Uint8Array(ev.data); if (b[0] >> 4 === 2) { clearTimeout(t); end(b[3] === 0); } };
    ws.onerror = () => { clearTimeout(t); end(false); };
  });
}
async function freeRelays() {
  const L = relayLists();
  const n = await Promise.all(L.nostr.map(nostrAlive));
  const m = await Promise.all(L.mqtt.map(u => mqttAlive(u, L.core)));
  const spare = await Promise.all(SPARE.map(nostrAlive));
  const okN = n.filter(Boolean).length, okM = m.filter(Boolean).length;
  const dead = L.nostr.filter((u, i) => !n[i]).concat(L.mqtt.filter((u, i) => !m[i])).map(u => u.replace(/^wss:\/\//, ''));
  const ready = SPARE.filter((u, i) => spare[i]).map(u => u.replace(/^wss:\/\//, ''));
  const level = okN < 20 || okM < 2 ? 2 : okN < 24 ? 1 : 0;
  return { level, value: okN, text: `${okN} of ${L.nostr.length} Nostr relays and ${okM} of ${L.mqtt.length} MQTT brokers answered.` +
    (dead.length ? ' Not answering: ' + dead.slice(0, 10).join(', ') + '.' : '') + (ready.length ? ' Spare relays ready: ' + ready.join(', ') + '.' : '') };
}

async function main() {
  const now = Date.now();
  const checks = {};
  const run = async (id, fn) => {
    try { checks[id] = await fn(now); }
    catch (e) { checks[id] = { level: 0, text: 'This check could not run this time: ' + String(e && e.message || e).slice(0, 120) }; }
    console.log(`${checks[id].level >= 2 ? '::error::' : ''}${id}: ${checks[id].text}`);
  };
  const down = arg('--site-down', '0') === '1';
  checks['SITE-DOWN'] = down ? { level: 3, text: 'An address did not answer after 3 tries (see the run).' } : { level: 0, text: 'Everything answers.' };
  await run('LISTS-STALE', listsStale);
  await run('CERT', certs);
  await run('DOMAIN', domain);
  if (!down) await run('ALERTS-ALIVE', alertsAlive);
  await run('PAGES-SIZE', pagesSize);
  if (args.includes('--relays')) await run('FREE-RELAYS', freeRelays);
  fs.writeFileSync(OUT, JSON.stringify({ checks }));
  process.exitCode = Object.values(checks).some(c => c.level >= 2) ? 1 : 0;
}
if (require.main === module) main();
module.exports = { listsStale, certs, domain, freeRelays };
