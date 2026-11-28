#!/usr/bin/env node
// The watch robot's checks from outside (run by .github/workflows/blokvane-watch.yml every 15 minutes). It looks at
// what Blokvane's server cannot see about itself, and writes a small report: which checks passed, and nothing private.
//
//   node tools/watch.js --out report.json [--site-down 0|1] [--relays] [--state file] [--swapped file] [--wake file]
//
// Each check has a level, like the server's alerts: 0 all good, 1 heads-up, 2 act, 3 urgent.
//   LISTS-STALE   the list robot's last good run (older than 6 hours: act; 24: urgent). Older than 2 hours, this robot
//                 starts the list robot. Late only because GitHub skipped its schedule (its last run did not fail),
//                 that mends itself, so it is a heads-up, not "act": GitHub runs both robots late on busy days
//   FREE-RELAYS   the free relays, once a day: at least 20 of the 28 Nostr relays must carry a message and 2 of the 3
//                 MQTT brokers must answer (24: heads-up). A relay that failed 3 days in a row is swapped for a tested
//                 spare by the robot itself (relays.json), so this only reaches "act" when the robot cannot mend it.
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
// --state: the robot's memory between runs (fails in a row for each relay); --swapped: written when relays.json was
// changed, so the workflow saves it; --wake: written when the list robot is late, so the workflow starts it
const STATE = arg('--state', ''), SWAPPED = arg('--swapped', ''), WAKE = arg('--wake', '');
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
  // (the list robot runs every hour. Over 2 hours: GitHub is running its schedule late, so this robot starts it)
  const wake = h >= 2 && !!WAKE;
  if (wake) { try { fs.writeFileSync(WAKE, String(Math.floor(h))); } catch (e) {} }
  const value = Math.round(h * 10) / 10, text = `The block list was rebuilt ${h < 1 ? 'less than an hour' : Math.floor(h) + ' hours'} ago.`;
  if (h >= 6 && h < 24 && wake) {
    // (GitHub skipped the list robot's schedule, and this robot's own, for hours: it is started now, and the list is
    // fresh a minute later. A heads-up, not "act": only a list robot whose own last run failed needs a person)
    let broken = false;
    try {
      const last = ((await json(`https://api.github.com/repos/${REPO}/actions/workflows/blokvane-list.yml/runs?per_page=1`, GH)).workflow_runs || [])[0];
      broken = !!last && last.status === 'completed' && ['failure', 'timed_out', 'startup_failure', 'action_required'].includes(last.conclusion);
    } catch (e) {}
    if (!broken) return { level: 1, value, text: text + ' GitHub ran the list robot late, so this robot starts it now.' };
  }
  return { level: h >= 24 ? 3 : h >= 6 ? 2 : 0, value, text };
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

// ---------- the free relays (once a day), and the swap that mends the list by itself ----------
// relays.json (beside the pages) is the list every copy of Blokvane reads about once a day (go/wt-net.js takes it
// over place by place). It also holds the spare relays. This robot keeps it:
//   1. Every day it sends a real message through each relay: one connection listens, another sends, the way two
//      devices do. A relay that picks up but does not pass the message on counts as not working.
//   2. It remembers for how many days in a row each relay failed (--state, kept on the "watch-state" branch).
//   3. A relay that failed 3 days in a row is swapped, IN ITS PLACE, for a spare that passed the test today. A swap
//      never adds, removes or sorts: everyone shuffles the list by position, so copies with yesterday's list still
//      meet the new ones in every place that did not change.
//   4. When most of everything fails at once, the trouble is this robot's own network: nothing is counted or swapped.
const ROOT = path.join(__dirname, '..');
const RELAYS_FILE = path.join(ROOT, 'relays.json');
const FAIL_DAYS = 3, MAX_SWAPS_A_DAY = 4;
const HOST = /^(?=.{4,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const hosts = v => (Array.isArray(v) ? [...new Set(v.filter(h => typeof h === 'string' && HOST.test(h)))] : []);
function readJson(file) { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return null; } }
function relayLists() {
  const ctx = { console, TextEncoder, TextDecoder, crypto: globalThis.crypto, atob, btoa };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'tv', 'wt-core.js'), 'utf8') + '\n;this.BVWT_CORE = BVWT_CORE;', ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'go', 'wt-net.js'), 'utf8') + '\n;this.BVWT_NET = BVWT_NET;', ctx);
  const file = readJson(RELAYS_FILE) || {};
  ctx.BVWT_NET.adopt(file);      // (a file that does not fit the list in the code is left alone, like in every copy)
  const nostr = ctx.BVWT_NET.NOSTR.map(u => u.replace(/^wss:\/\//, ''));
  return { nostr, mqtt: ctx.BVWT_NET.MQTT.map(m => m.url), spare: hosts(file.spare).filter(h => !nostr.includes(h)), file, core: ctx.BVWT_CORE };
}
// one message through one relay: a listener on one connection, a sender on another
function nostrTrip(host, core, signer, ms = 12000) {
  return new Promise(res => {
    let a, b, done = false, sent = false;
    const topic = [...crypto.getRandomValues(new Uint8Array(20))].map(x => x.toString(16).padStart(2, '0')).join('');
    const end = ok => { if (done) return; done = true; clearTimeout(t); try { a.close(); } catch (e) {} try { b.close(); } catch (e) {} res(ok); };
    const t = setTimeout(() => end(false), ms);
    try { a = new WebSocket('wss://' + host); } catch (e) { end(false); return; }
    a.onerror = () => end(false);
    a.onopen = () => { try { a.send(JSON.stringify(['REQ', 'bvwatch', { kinds: [core.nostrKind(topic)], '#x': [topic], since: Math.floor(Date.now() / 1000) - 5 }])); } catch (e) { end(false); } };
    a.onmessage = ev => {
      const s = String(ev.data);
      if (/^\["EVENT"/.test(s)) { end(true); return; }
      if (!/^\["EOSE"/.test(s) || sent) return;
      sent = true;
      try { b = new WebSocket('wss://' + host); } catch (e) { end(false); return; }
      b.onerror = () => end(false);
      b.onopen = async () => { try { b.send(JSON.stringify(['EVENT', await core.nostrEvent(signer, topic, core.b64(new Uint8Array([1, 2, 3])))])); } catch (e) { end(false); } };
    };
  });
}
// (a few at a time, and a relay that failed gets one more try: one slow answer is not a relay that stopped)
async function tripAll(list, core, signer, trip = nostrTrip) {
  const out = new Array(list.length).fill(false);
  const pass = async idx => { for (let i = 0; i < idx.length; i += 8) await Promise.all(idx.slice(i, i + 8).map(async k => { out[k] = !!(await trip(list[k], core, signer)); })); };
  await pass(list.map((h, i) => i));
  await pass(list.map((h, i) => i).filter(i => !out[i]));
  return out;
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
// What to do with today's results. Nothing is contacted here: it only decides.
//   nostr, spare: host names; okN, okS: did each one carry a message today; state: { day, fails: { host: days } }
// Returns { nostr, spare (after the swaps), swaps: [{ out, in, place }], state, counted }.
function decide(nostr, spare, okN, okS, state, today) {
  const st = { day: state && state.day || '', fails: Object.assign({}, state && state.fails) };
  const all = okN.length + okS.length, good = okN.filter(Boolean).length + okS.filter(Boolean).length;
  const out = { nostr: nostr.slice(), spare: spare.slice(), swaps: [], state: st, counted: false };
  if (!all || good * 2 < all) return out;                       // this robot's own network: count nothing
  if (st.day !== today) {                                       // one count a day, however often the robot runs
    const fails = {};
    nostr.forEach((h, i) => { fails[h] = okN[i] ? 0 : (st.fails[h] || 0) + 1; });
    st.fails = fails; st.day = today; out.counted = true;
  }
  const ready = spare.filter((h, i) => okS[i] && !nostr.includes(h));
  for (let i = 0; i < nostr.length && out.swaps.length < MAX_SWAPS_A_DAY && ready.length; i++) {
    const h = nostr[i];
    if (okN[i] || (st.fails[h] || 0) < FAIL_DAYS) continue;
    const to = ready.shift();
    out.nostr[i] = to;
    out.spare = out.spare.filter(x => x !== to);
    delete st.fails[h]; st.fails[to] = 0;
    out.swaps.push({ out: h, in: to, place: i });
  }
  return out;
}
async function freeRelays(now, o = {}) {
  const L = o.lists || relayLists();
  const signer = await L.core.newSigner();
  const okN = await tripAll(L.nostr, L.core, signer, o.trip);
  const okS = await tripAll(L.spare, L.core, signer, o.trip);
  const m = await Promise.all(L.mqtt.map(u => (o.mqtt || mqttAlive)(u, L.core)));
  const today = new Date(now).toISOString().slice(0, 10);
  const d = decide(L.nostr, L.spare, okN, okS, o.state || readJson(STATE) || {}, today);
  if (STATE && !o.dry) { try { fs.writeFileSync(STATE, JSON.stringify(d.state)); } catch (e) {} }
  if (d.swaps.length && !o.dry) {
    const log = (Array.isArray(L.file.swaps) ? L.file.swaps : []).concat(d.swaps.map(s => ({ day: today, out: s.out, in: s.in }))).slice(-60);
    fs.writeFileSync(RELAYS_FILE, relaysText({ nostr: d.nostr, spare: d.spare, swaps: log }));
    if (SWAPPED) fs.writeFileSync(SWAPPED, d.swaps.map(s => `${s.in} in place of ${s.out}`).join(', '));
  }
  const swappedAt = new Set(d.swaps.map(s => s.place));
  const okN2 = okN.map((ok, i) => ok || swappedAt.has(i));
  const good = okN2.filter(Boolean).length, okM = m.filter(Boolean).length;
  const dead = d.nostr.filter((h, i) => !okN2[i]).concat(L.mqtt.filter((u, i) => !m[i]).map(u => u.replace(/^wss:\/\//, '')));
  const ready = L.spare.filter((h, i) => okS[i] && d.spare.includes(h)).length;
  let level = good < 20 || okM < 2 ? 2 : good < 24 ? 1 : 0;
  if (!level && ready < 2) level = 1;                            // the list is fine, but the next swap has nothing to use
  return { level, value: good, swaps: d.swaps, text: `${good} of ${d.nostr.length} Nostr relays and ${okM} of ${L.mqtt.length} MQTT brokers carried a message.` +
    (d.swaps.length ? ' Swapped by the robot: ' + d.swaps.map(s => `${s.in} in place of ${s.out}`).join(', ') + '.' : '') +
    ` Tested spares left: ${ready}.` + (dead.length ? ' Not working: ' + dead.slice(0, 8).join(', ') + '.' : '') };
}
// (one host a line, so a swap is one changed line)
function relaysText(x) {
  const lines = a => a.map(h => '    ' + JSON.stringify(h)).join(',\n');
  return '{\n  "about": "The free relays every copy of Blokvane uses. Kept by the watch robot (tools/watch.js): a relay that stopped for 3 days is swapped, in its place, for a tested spare. Never add, remove or sort the places in nostr by hand.",\n' +
    '  "nostr": [\n' + lines(x.nostr) + '\n  ],\n  "spare": [\n' + lines(x.spare) + '\n  ],\n  "swaps": [' +
    (x.swaps.length ? '\n' + x.swaps.map(s => '    ' + JSON.stringify(s)).join(',\n') + '\n  ' : '') + ']\n}\n';
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
  // (the free relays: when asked to with --relays, and otherwise in the first run of each day)
  const relayDay = ((STATE && readJson(STATE)) || {}).day || '';
  if (args.includes('--relays') || (STATE && relayDay !== new Date(now).toISOString().slice(0, 10))) await run('FREE-RELAYS', freeRelays);
  fs.writeFileSync(OUT, JSON.stringify({ checks }));
  process.exitCode = Object.values(checks).some(c => c.level >= 2) ? 1 : 0;
}
if (require.main === module) main();
module.exports = { listsStale, certs, domain, freeRelays, decide, relaysText, relayLists };
