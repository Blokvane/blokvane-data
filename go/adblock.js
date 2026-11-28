// Blokvane Ad Blocker: the phone's own app for ad blocking (adblock.html). The third of Blokvane's small apps, next
// to BV Remote (index.html) and BV Games (games.html), and the only one that looks like the Protection Lab.
//
// What it does, each on its own page of the menu at the bottom:
//   Shield     switches ad blocking on for this phone in one tap (it takes a free license, or starts the free day),
//              shows the few steps the phone itself needs, and notices by itself when they are done. It can also
//              pause ad blocking for a while, from one minute to one year (the page turns red while it is paused)
//   Test       Blokvane's Ad Blocker Test, the same page as on blokvane.com, in a frame
//   Numbers    how many lookups this phone made and how many Blokvane stopped, per day, and a picture to share
//   Countries  countries this phone does not reach, and sites it always reaches
//   More       the account, this phone's license, the other apps, the language, what it can and cannot do, and how
//              to switch it off and remove it
//
// How a phone is protected: a phone has no browser extensions, so Blokvane works one level lower. Every app first
// asks "where does this site live?" (a name lookup). With ad blocking on, the phone asks Blokvane, and for ad and
// tracking companies Blokvane answers "nowhere". An iPhone or iPad gets one small settings profile for that.
//
// It talks to Blokvane's server only. Kept on this phone: who is signed in, this phone's own id, the phone's own
// address for lookups, and the language. The first two are shared with BV Remote when both run in the same browser,
// so signing in once is enough there. An app on an iPhone's home screen has a memory of its own: it asks for the
// sign-in once more, and then finds out by itself that it is on a phone that is already protected ("probe" below).
(() => {
  'use strict';
  const V = '10';
  const API = BVPASS.api, SITE = 'https://blokvane.com';
  const HERE = location.origin + location.pathname.replace(/[^/]*$/, '');
  const APP_URL = HERE + 'adblock.html';
  const root = document.getElementById('app');
  const ua = navigator.userAgent;

  // ---------------------------------------------------------------- what is kept on this phone
  const box = pre => ({
    get(k, d) { try { const v = localStorage.getItem(pre + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(pre + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(pre + k); } catch (e) {} }
  });
  const store = box('bvgo:');      // shared with BV Remote: the sign-in, this phone's id, its address
  const own = box('bvab:');        // this app's own: the language, small "seen it" marks
  const acct = () => { const p = store.get('games:acct', null); return p && typeof p === 'object' && typeof p.session === 'string' && p.session && typeof p.email === 'string' ? p : null; };
  const hex = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, '0')).join('');
  const device = () => { let d = store.get('games:dev', ''); if (!/^[0-9a-f]{32}$/.test(d)) { d = hex(16); store.set('games:dev', d); } return d; };
  const urls = () => { const u = store.get('shield:dns', null), a = acct(); return u && typeof u.token === 'string' && /^[a-f0-9]{32}$/.test(u.token) && (!u.email || !a || u.email === a.email) ? u : null; };
  function signedOutHere() { for (const k of ['games:acct', 'games:passes', 'games:pass', 'shield:sum']) store.del(k); live = 'unknown'; }

  // ---------------------------------------------------------------- which phone is this
  // (an iPad says it is a Mac: the touch screen gives it away)
  const IPAD = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const plat = () => (/iPhone|iPod/.test(ua) || IPAD ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop');
  // The setting that blocks ads on an iPhone or iPad came with iOS 14 (Apple's "DNSSettings" profile). An older one is
  // told so plainly, not walked through steps that would fail. (0: the browser does not say, as an iPad that calls
  // itself a Mac; nothing is assumed then.)
  const IOS = +((/(?:iPhone|iPad|iPod)[^)]*? OS (\d+)_/.exec(ua) || [])[1] || 0);
  const tooOld = () => plat() === 'ios' && IOS > 0 && IOS < 14;
  // (Safari itself, not Chrome, Firefox or Edge on an iPhone, and not a page opened inside another app)
  const SAFARI = /Version\/[\d.]+.*Safari\//.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  // (Chrome itself on Android, where the ad blocking setting lives: not Samsung Internet, Edge, Opera, or a page inside another app)
  const CHROME = /Chrome\/\d/.test(ua) && !/SamsungBrowser|EdgA|OPR\/|YaBrowser|DuckDuckGo|Firefox|; wv\)/.test(ua);
  const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; } catch (e) { return false; } };
  function deviceName() {
    const n = store.get('name', '');
    if (n) return n;
    return IPAD ? 'iPad' : /iPhone/.test(ua) ? 'iPhone' : /Android/.test(ua) ? ((/;\s*([^;)]+?)\s+Build/.exec(ua) || [])[1] || 'Android phone').slice(0, 30) : 'Phone';
  }

  // ---------------------------------------------------------------- words (English here; six more in lang/ab-<code>.js)
  const LANGS = [['en', 'English'], ['es', 'Español'], ['fr', 'Français'], ['ar', 'العربية'], ['hi', 'हिन्दी'], ['bn', 'বাংলা'], ['zh', '中文']];
  const WORDS = {};
  let lang = 'en';
  window.BVAB = { add(code, words) { if (typeof code === 'string' && words && typeof words === 'object') WORDS[code] = words; } };
  function pickLang() {
    const saved = own.get('lang', '');
    if (LANGS.some(l => l[0] === saved)) return saved;
    for (const l of (navigator.languages || [navigator.language || 'en'])) { const c = String(l).slice(0, 2).toLowerCase(); if (LANGS.some(x => x[0] === c)) return c; }
    return 'en';
  }
  function loadLang(code) {
    return new Promise(res => {
      if (code === 'en' || WORDS[code]) return res(true);
      const s = document.createElement('script');
      s.src = 'lang/ab-' + code + '.js?v=' + V; s.async = true;
      s.onload = () => res(!!WORDS[code]); s.onerror = () => res(false);
      document.head.appendChild(s);
    });
  }
  async function setLang(code) {
    const ok = await loadLang(code);
    lang = ok ? code : 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }
  function T(s, v) {
    let t = (lang !== 'en' && WORDS[lang] && WORDS[lang][s]) || s;
    if (v) t = t.replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m));
    return t;
  }
  // (numbers and dates the way the language writes them; Arabic with the digits 0 to 9, like the rest of its words here)
  const loc = () => (lang === 'ar' ? 'ar-u-nu-latn' : lang);
  const num = n => { try { return Number(n || 0).toLocaleString(loc()); } catch (e) { return String(n || 0); } };
  // (a big number in few letters, for the dial: 12,345 -> 12.3K)
  const short = n => { n = Number(n || 0); try { return n < 10000 ? num(n) : new Intl.NumberFormat(loc(), { notation: 'compact', maximumFractionDigits: 1 }).format(n); } catch (e) { return String(n); } };
  const ago = sec => { const m = Math.round((Date.now() / 1000 - sec) / 60); return m < 2 ? T('just now') : m < 90 ? T('{n} minutes ago', { n: num(m) }) : m < 2880 ? T('{n} hours ago', { n: num(Math.round(m / 60)) }) : T('{n} days ago', { n: num(Math.round(m / 1440)) }); };

  // ---------------------------------------------------------------- small helpers for the page
  function el(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const ICON = {
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6z"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    hex: '<path d="M12 2.8 20 7.4v9.2l-8 4.6-8-4.6V7.4z"/>',
    chart: '<path d="M5 20V11M12 20V4M19 20v-6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 3.9 5.6 3.9 9S14.6 18.4 12 21c-2.6-2.6-3.9-5.6-3.9-9S9.4 5.6 12 3z"/>',
    dots: '<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2.2"/><path d="M5.5 15.5h-1a1.5 1.5 0 0 1-1.5-1.5V5a1.5 1.5 0 0 1 1.5-1.5H14A1.5 1.5 0 0 1 15.5 5v1"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
    share: '<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7"/><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5"/>',
    chev: '<path d="m9 5 7 7-7 7"/>', key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l3 3"/>',
    out: '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 8 6 12l4 4M6 12h10"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', look: '<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor" stroke="none"/>', addbox: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>', heart: '<path d="M12 20s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.7-7 10-7 10z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.2"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    off: '<path d="M12 4v8"/><path d="M7 7a7 7 0 1 0 10 0"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    game: '<rect x="2.5" y="7.5" width="19" height="10" rx="5"/><path d="M7.5 10.5v4M5.5 12.5h4M15.2 11.2v.2M18 13.6v.2"/>',
    laptop: '<rect x="5" y="5" width="14" height="10" rx="1.6"/><path d="M3 19h18"/>', mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    pause: '<path d="M9 6.5v11M15 6.5v11"/>', play: '<path d="M8.5 6.2v11.6L18 12z" fill="currentColor"/>', minus: '<path d="M5 12h14"/>'
  };
  function icon(name) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICON[name] || '';
    return s;
  }
  // a button: kind 'go' (the big one), 'btn' (outlined) or 'link'
  function btn(text, o, parent, fn) {
    o = o || {};
    const b = el(o.href ? 'a' : 'button', (o.kind || 'btn') + (o.cls ? ' ' + o.cls : ''), parent);
    if (o.href) { b.href = o.href; b.target = '_blank'; b.rel = 'noopener'; } else b.type = 'button';
    if (o.icon) b.appendChild(icon(o.icon));
    el('span', '', b, text);
    if (fn) {
      b.addEventListener('click', async e => {
        if (b.classList.contains('busy')) return;
        const r = fn(e);
        if (r && typeof r.then === 'function') { b.classList.add('busy'); try { await r; } finally { b.classList.remove('busy'); } }
      });
    }
    return b;
  }
  const mail = (parent, email) => { const b = el('bdi', 'mail', parent, String(email)); b.dir = 'ltr'; return b; };
  let toastT = 0;
  function toast(text, kind) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = el('div', 'toast' + (kind ? ' ' + kind : ''), document.body, text);
    t.setAttribute('role', 'status');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.remove(), kind === 'bad' ? 5200 : 3200);
  }
  async function copy(text, done) {
    try { await navigator.clipboard.writeText(text); toast(done || T('Copied.'), 'ok'); }
    catch (e) { toast(T('Press and hold the text to copy it.')); }
  }
  function copyBox(parent, text, label) {
    const c = el('div', 'copy', parent);
    el('code', '', c, text).setAttribute('aria-label', label);
    btn(T('Copy'), { cls: 'sm', icon: 'copy' }, c, () => copy(text, T('Copied.')));
    return c;
  }
  // a QR code of an address (when it cannot be drawn, the address itself stands there)
  function qr(box, text) { try { box.appendChild(BVQR.svgOf(text, { border: 2 })); } catch (e) { box.textContent = text; } return box; }
  // numbered steps: [[title, detail], ...]
  function steps(parent, list) {
    const ol = el('ol', 'steps', parent);
    for (const [t, sub] of list) { const li = el('li', '', ol); const d = el('div', '', li); el('b', '', d, t); if (sub) el('small', '', d, sub); }
    return ol;
  }
  function bullets(parent, list) { const ul = el('ul', 'plain', parent); for (const t of list) el('li', '', ul, t); return ul; }

  // a sheet from the bottom. The phone's Back closes it.
  let closeSheet = null;
  function sheet(title, build) {
    if (closeSheet) closeSheet(true);
    const shade = el('div', 'shade', document.body);
    const sh = el('div', 'sheet', shade);
    sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true'); sh.setAttribute('aria-label', title);
    el('div', 'grab', sh);
    const top = el('div', 'sh-top', sh);
    el('h2', '', top, title);
    const x = el('button', 'x', top); x.type = 'button'; x.setAttribute('aria-label', T('Close')); x.appendChild(icon('x'));
    let open = true;
    const close = quiet => {
      if (!open) return;
      open = false; closeSheet = null; shade.remove();
      if (quiet !== true && history.state && history.state.bvab === 'sheet') history.back();
    };
    closeSheet = close;
    x.onclick = () => close();
    shade.addEventListener('click', e => { if (e.target === shade) close(); });
    try { history.pushState({ bvab: 'sheet' }, ''); } catch (e) {}
    build(sh, close);
    return close;
  }
  addEventListener('popstate', () => { if (closeSheet) { const c = closeSheet; closeSheet = null; c(true); document.querySelectorAll('.shade').forEach(s => s.remove()); } });

  // ---------------------------------------------------------------- Blokvane's server
  const OFFLINE = () => T("Can't reach Blokvane right now. Check the internet and try again.");
  function ask(path, body, o) {
    const a = acct(), headers = { 'Content-Type': 'application/json' };
    if (a && !(o && o.anon)) headers.Authorization = 'Bearer ' + a.session;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    return fetch(API + path, { method: 'POST', headers, body: JSON.stringify(Object.assign({ device_id: device(), plat: plat() }, body || {})), credentials: 'omit', cache: 'no-store', signal: ctl.signal })
      .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d && typeof d === 'object' ? d : {} }), () => ({ ok: false, status: r.status, data: {} })))
      .then(x => { clearTimeout(t); return x; }, () => { clearTimeout(t); return { ok: false, status: 0, data: {} }; });
  }
  // why something did not work, in this phone's language where the app knows the reason
  function why(r) {
    if (!r.status) return OFFLINE();
    const known = {
      bad_email: T("That doesn't look like an email address."),
      disposable_email: T('Blokvane does not work with temporary email addresses. Please use your regular email address.'),
      plus_email: T('Please use your email address without the + part: name@example.com, not name+shop@example.com.'),
      slow_down: T('Too many tries. Please wait a bit and try again.'),
      bad_code: T('That code is not right. Check the email and try again.'),
      expired_code: T('That code no longer works. Ask for a new one.'),
      too_many_tries: T('That code no longer works. Ask for a new one.'),
      free_used: T('The free day was already used, by this email or on this phone.'),
      free_limit: T('Too many free days were started from this network this month. A license works at once.'),
      has_license: T('This phone is on a license already.'),
      no_license: T('This phone needs a license first.'),
      not_available: T('Ad blocking for phones is not switched on yet.'),
      not_included: T('Your organization did not include ad blocking on phones in your license. Ask your administrator.'),
      too_many: T('That is more than one phone can keep.'),
      bad_time: T('Pick a time between 1 minute and 1 year.'),
      signed_out: T('Please sign in again.')
    };
    return known[r.data.error] || r.data.message || T("That didn't work. Try again in a minute.");
  }
  // Is ad blocking for phones open at all? Asked without a sign-in, and remembered for a few hours.
  function info() {
    const i = store.get('shield:info', null);
    return i && typeof i === 'object' && typeof i.open === 'string' && Date.now() - (+i.at || 0) < 7 * 864e5 ? i : { open: '', android: false, droid: 'soon', lab: '', at: 0 };
  }
  function infoFresh() {
    const have = info();
    if (have.at && Date.now() - have.at < 3 * 3600e3 && typeof have.droid === 'string') return Promise.resolve(false);
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    return fetch(API + '/v1/phone/dns/info', { credentials: 'omit', signal: ctl.signal }).then(r => (r.ok ? r.json() : null)).then(d => {
      clearTimeout(t);
      if (!d || !/^(all|some|none)$/.test(d.open)) return false;
      const next = { open: d.open, android: !!d.android, droid: d.droid === 'all' ? 'all' : 'soon', lab: /^[0-9a-f]{6,16}$/.test(d.lab || '') ? d.lab : '', at: Date.now() };
      store.set('shield:info', next);
      return next.open !== have.open || next.droid !== have.droid;
    }, () => { clearTimeout(t); return false; });
  }

  // ---------------------------------------------------------------- what the app knows right now
  let S = null;            // the server's answer about this phone (/v1/phone/app), or null
  let failed = '';         // why the last look did not work ('' when it did)
  let loading = false, loadedAt = 0, skew = 0;
  let tab = 'home';
  let wantLicense = 0;     // the person went to blokvane.com to get a license (until when the app takes one by itself)
  const now = () => Math.round((Date.now() + skew) / 1000);

  async function load(quiet) {
    if (!acct()) { S = null; failed = ''; if (!quiet) draw(); return null; }
    if (loading) return S;
    loading = true;
    if (!quiet && !S) draw();
    const r = await ask('/v1/phone/app');
    loading = false;
    if (r.status === 401) { signedOutHere(); S = null; failed = ''; draw(); return null; }
    if (!r.ok || typeof r.data.dns !== 'object') { failed = why(r); if (!quiet || !S) draw(); return S; }
    failed = ''; S = r.data; loadedAt = Date.now();
    if (S.now) skew = S.now * 1000 - Date.now();
    if (S.email && acct() && acct().email !== S.email) store.set('games:acct', Object.assign(acct(), { email: S.email }));
    // (back from blokvane.com with a new license: this phone takes it, as the sheet said it would)
    if (wantLicense > Date.now() && S.available && !S.license.on && S.license.free > 0) {
      wantLicense = 0;
      const t = await ask('/v1/license/activate', { browser: 'phone', name: deviceName(), caps: ['feat'] });
      if (t.ok) { toast(T('This phone is on your license now.'), 'ok'); return load(quiet); }
    }
    if (!quiet) draw();
    return S;
  }
  // what the pages show, in a few words: a quiet look redraws only when this changed
  const sig = () => (S ? [phase(), S.license.on, S.license.free, S.free_day.on, S.dns.last_used > 0, S.stats.all.asked, S.prefs.countries.length, S.prefs.trusted.length, S.strict ? 1 : 0, (S.blocked || []).length, (S.phones || []).length, S.pause ? S.pause.until : 0].join('|') : phase() + '|' + failed);
  let shown = '';
  async function refresh() { await load(true); if (sig() !== shown) draw(); }
  // which screen the Shield page shows
  function phase() {
    const p = plat();
    if (p === 'desktop') return 'desktop';
    if (tooOld()) return 'old';
    if (!acct()) return 'signedout';
    if (!S) return failed ? 'failed' : 'loading';
    if (!S.available) return 'closed';
    if (p === 'android' && S.android !== 'yes') return 'soon';
    if (!S.dns.on) return 'start';
    if (!S.dns.blocking) return 'paused';
    // "On" is never taken from what the server remembers (it heard from this phone's address some minutes ago): the
    // profile may have been removed since, or never installed. It is on when a test question from this very page
    // just came through this phone's own address (verify, below).
    return live === 'yes' ? 'on' : live === 'unknown' ? 'checking' : 'finish';
  }

  // ---------------------------------------------------------------- "is it this very phone?"
  // The app makes up a name nobody has ever asked for and lets the phone look it up. If this phone's lookups go
  // through Blokvane, the server sees that name arrive on the phone's own address, and says so. The name leads nowhere.
  // Does this phone really ask Blokvane right now? 'unknown' until tested, then 'yes' or 'no'. Tested when the app
  // opens, when it comes back to the front, after the setup steps, and whenever the person asks ("Test this phone").
  let live = 'unknown', liveAt = 0, liveBusy = null, liveOther = false;
  function verify(tries) {
    if (liveBusy) return liveBusy;
    liveBusy = (async () => {
      let got = 'no';
      liveOther = false;
      for (let i = 0; i < (tries || 2); i++) {
        lastProbe = Date.now();
        const p = await probe();
        if (p && p.seen && p.mine && p.this) { got = 'yes'; break; }
        // (its lookups arrive on another address of this same person: this phone is that one, under an older id)
        if (p && p.seen && p.mine && p.device && await adopt(p.device, true)) { got = 'yes'; break; }
        if (p && p.seen && !p.mine) { liveOther = true; break; }
      }
      live = got; liveAt = Date.now(); liveBusy = null;
      return got;
    })();
    return liveBusy;
  }
  async function probe() {
    if (!acct() || !S || !S.check || !/^dnscheck\.[a-z0-9.-]+$/.test(S.check)) return null;
    const nonce = hex(12);
    const test = window.BV_TEST && /^(127\.0\.0\.1|localhost)$/.test(location.hostname) && typeof window.BV_TEST.lookup === 'function' ? window.BV_TEST.lookup : null;
    try {
      if (test) await test(nonce + '.' + S.check);
      else {
        const ctl = new AbortController();
        const t = setTimeout(() => ctl.abort(), 3500);
        await fetch('https://' + nonce + '.' + S.check + '/', { mode: 'no-cors', cache: 'no-store', credentials: 'omit', signal: ctl.signal }).catch(() => {});
        clearTimeout(t);
      }
    } catch (e) {}
    const r = await ask('/v1/phone/probe', { nonce });
    return r.ok ? r.data : null;
  }
  // the phone is protected already, under another id of this same person (the app's memory is new): be that phone
  async function adopt(dev, quiet) {
    if (!/^[0-9a-f]{32}$/.test(dev) || dev === device()) return false;
    store.set('games:dev', dev); store.del('shield:dns');
    await load(true);
    live = 'yes'; liveAt = Date.now();
    if (!quiet) toast(T('This phone is already protected. Welcome back.'), 'ok');
    draw();
    return true;
  }
  let watching = 0, lastProbe = 0;
  // while the phone's own steps are still to do: look every few seconds, so the page turns green by itself
  function watch() {
    clearInterval(watching);
    watching = setInterval(async () => {
      if (document.hidden || closeSheet || liveBusy || navigator.onLine === false) return;
      const ph = phase();
      // (waiting for the steps on the phone: test every few seconds. On: test again every few minutes, so a profile
      // that was removed is noticed while the app is open)
      if (ph === 'finish' ? Date.now() - lastProbe < 3500 : ph === 'on' ? Date.now() - liveAt < 180000 : true) return;
      const was = live;
      if (await verify(ph === 'on' ? 2 : 1) !== was) {
        await load(true);
        if (phase() === 'on') toast(T('Ad blocking is on.'), 'ok');
        draw();
      }
    }, 4000);
  }
  // once, right after the first look: maybe this phone is protected already
  async function firstProbe() {
    const ph = phase();
    // (switched on for this phone: is it really running? The page shows "Testing this phone" until this answers)
    if (ph === 'checking' || ph === 'finish' || ph === 'on') { await verify(2); draw(); return; }
    if (ph !== 'start') return;
    lastProbe = Date.now();
    const p = await probe();
    if (!p || !p.seen || !p.mine) return;
    // (its lookups arrive on another address of this same person: this phone is that one, under an older id)
    if (p.this) await refresh(); else await adopt(p.device);
  }

  // ---------------------------------------------------------------- signing in: an email, then the code sent to it
  function signIn(after) {
    sheet(T('Sign in'), (sh, close) => {
      const body = el('div', '', sh);
      function emailStep(keep) {
        body.textContent = '';
        el('label', 'f', body, T('Your email')).htmlFor = 'ab-email';
        const email = el('input', 'in', body); email.id = 'ab-email'; email.type = 'email'; email.inputMode = 'email'; email.autocomplete = 'email'; email.autocapitalize = 'none'; email.spellcheck = false;
        email.placeholder = 'you@example.com'; email.maxLength = 254; email.dir = 'ltr'; email.value = keep || '';
        el('p', 'muted small', body, T('Blokvane emails you a code. There is no password. New here? The same step makes your account.')).style.marginTop = '8px';
        const err = el('p', 'err', body); err.hidden = true;
        const go = btn(T('Email me a code'), { kind: 'go', icon: 'mail' }, body, async () => {
          err.hidden = true;
          const e = email.value.trim().toLowerCase();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { err.textContent = T("That doesn't look like an email address."); err.hidden = false; return; }
          if (e.split('@')[0].includes('+')) { err.textContent = T('Please use your email address without the + part: name@example.com, not name+shop@example.com.'); err.hidden = false; return; }
          const r = await ask('/v1/auth/start', { email: e, via: 'ext', purpose: 'login' }, { anon: true });
          if (!r.ok || typeof r.data.id !== 'string') { err.textContent = why(r); err.hidden = false; return; }
          codeStep({ id: r.data.id, poll: r.data.poll, email: e });
        });
        go.style.marginTop = '14px';
        email.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
        setTimeout(() => { try { email.focus(); } catch (e) {} }, 80);
      }
      function codeStep(s) {
        body.textContent = '';
        const p = el('p', '', body);
        const parts = T('Blokvane sent 8 numbers to {email}. Type them here. They work for 15 minutes.').split('{email}');
        p.append(parts[0]); mail(p, s.email); p.append(parts[1] || '');
        el('label', 'f', body, T('The code')).htmlFor = 'ab-code';
        const code = el('input', 'in code', body); code.id = 'ab-code'; code.inputMode = 'numeric'; code.autocomplete = 'one-time-code'; code.placeholder = '1234 5678'; code.maxLength = 9; code.dir = 'ltr';
        el('p', 'muted small', body, T('It can take a minute to arrive. Look in Spam too.')).style.marginTop = '8px';
        const err = el('p', 'err', body); err.hidden = true;
        let busy = false;
        const go = btn(T('Sign in'), { kind: 'go', icon: 'key' }, body, async () => {
          if (busy) return;
          const c = code.value.replace(/[^0-9]/g, '');
          if (c.length !== 8) { err.textContent = T('Type the 8 numbers from the email.'); err.hidden = false; return; }
          busy = true; err.hidden = true;
          const r = await ask('/v1/auth/code', { id: s.id, poll: s.poll, code: c }, { anon: true });
          busy = false;
          if (!r.ok || typeof r.data.session !== 'string') {
            err.textContent = why(r); err.hidden = false;
            if (/^(too_many_tries|expired_code|claimed|not_found)$/.test(r.data.error || '')) code.disabled = true; else code.select();
            return;
          }
          store.set('games:acct', { session: r.data.session, email: String(r.data.email || s.email).toLowerCase(), plan: '' });
          store.del('shield:sum');
          S = null;
          close();
          toast(T('Signed in.'), 'ok');
          await load();
          // (first: is this phone protected already? Only then whatever the person was about to do)
          await firstProbe();
          if (after) after();
        });
        go.style.marginTop = '14px';
        code.oninput = () => { const t = code.value.replace(/[^0-9]/g, '').slice(0, 8); const show = t.length > 4 ? t.slice(0, 4) + ' ' + t.slice(4) : t; if (code.value !== show) code.value = show; if (t.length === 8) go.click(); };
        code.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
        const r2 = el('div', 'row2', body); r2.style.marginTop = '12px';
        btn(T('Send a new code'), { cls: 'sm' }, r2, async () => {
          const r = await ask('/v1/auth/start', { email: s.email, via: 'ext', purpose: 'login' }, { anon: true });
          if (!r.ok || typeof r.data.id !== 'string') { err.textContent = why(r); err.hidden = false; return; }
          toast(T('A new code is on its way.'), 'ok');
          codeStep({ id: r.data.id, poll: r.data.poll, email: s.email });
        }).style.width = '100%';
        btn(T('Use another email'), { cls: 'sm' }, r2, () => emailStep(s.email)).style.width = '100%';
        setTimeout(() => { try { code.focus(); } catch (e) {} }, 80);
      }
      emailStep();
    });
  }
  function signOutSheet() {
    const a = acct();
    sheet(T('Sign out on this phone?'), (sh, close) => {
      const p = el('p', '', sh);
      const parts = T('You are signed in as {email}.').split('{email}');
      p.append(parts[0]); mail(p, a ? a.email : ''); p.append(parts[1] || '');
      el('p', 'muted', sh, S && S.dns && S.dns.on ? T('Signing out does not switch ad blocking off, and this phone keeps its license. To stop ad blocking, use "Switch it off" first.')
        : T('Your plan and your other devices stay as they are. You can sign in again at any time.'));
      const st = el('div', 'stack', sh);
      btn(T('Sign out'), { cls: 'bad' }, st, () => {
        if (a) BVPASS.signOut(a.session).catch(() => {});
        signedOutHere(); S = null; close(); toast(T('Signed out.')); draw();
      });
      btn(T('Stay signed in'), {}, st, () => close());
    });
  }

  // ---------------------------------------------------------------- switching it on
  async function activate() {
    const r = await ask('/v1/license/activate', { browser: 'phone', name: deviceName(), caps: ['feat'] });
    if (!r.ok) { toast(why(r), 'bad'); await load(true); draw(); return false; }
    return true;
  }
  async function make() {
    const r = await ask('/v1/phone/dns');
    if (!r.ok || typeof r.data.token !== 'string') { toast(why(r), 'bad'); await load(true); draw(); return; }
    const a = acct();
    store.set('shield:dns', { token: r.data.token, doh: r.data.doh, profile: r.data.profile, hostname: r.data.hostname || '', email: a ? a.email : '' });
    // (a new address: nothing on the phone uses it yet, so the steps come next. The page tests every few seconds)
    live = 'no'; liveAt = Date.now();
    await load(true);
    draw();
    try { scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
  }
  // the one button: sign in if needed, take a free license or start the free day, then make this phone's address
  async function turnOn() {
    if (!acct()) return signIn(turnOn);
    await load(true);
    const ph = phase();
    if (!S || ph === 'closed' || ph === 'soon' || ph === 'old' || ph === 'desktop' || ph === 'failed') return draw();
    if (S.dns.on && S.dns.blocking) return draw();
    if (!S.dns.licensed) {
      if (S.license.on) return draw();                       // (on a license that leaves phones out: the page says so)
      if (S.license.free > 0) { if (!(await activate())) return; toast(T('This phone now uses one of your licenses.'), 'ok'); }
      else if (S.free_day.can) return freeDaySheet();
      else return licenseSheet();
    }
    if (S.dns.on) { await load(true); return draw(); }
    return make();
  }
  function freeDaySheet() {
    sheet(T('Your free day'), (sh, close) => {
      el('p', 'lede', sh, T('Try ad blocking on this phone for 24 hours. No card, nothing to cancel.'));
      bullets(sh, [
        T('It starts when you tap the button, and stops by itself 24 hours later.'),
        T('One free day for each person and each phone.'),
        T('When it ends, the internet keeps working. Ads come back until this phone is on a license.')
      ]);
      const err = el('p', 'err', sh); err.hidden = true;
      const st = el('div', 'stack', sh);
      btn(T('Start my free day'), { kind: 'go', icon: 'shield' }, st, async () => {
        const r = await ask('/v1/phone/try');
        if (!r.ok) { err.textContent = why(r); err.hidden = false; await load(true); return; }
        close();
        toast(T('Your free day has started.'), 'ok');
        await make();
      });
      btn(T('Not now'), {}, st, () => close());
    });
  }
  // "Get a license": blokvane.com opens with the same person signed in (a link that works once, for two minutes)
  function licenseSheet(to) {
    sheet(to === 'account' ? T('Your plan') : T('Get a license'), (sh, close) => {
      el('p', 'lede', sh, to === 'account' ? T('Change or cancel your plan, see your invoices and give a license to someone on blokvane.com.')
        : T('A license keeps ads blocked on this phone. One license covers one device: a phone, a tablet or a computer.'));
      el('p', 'muted', sh, T('Paying is done on blokvane.com, in a secure pay box. This app never sees your card.'));
      const st = el('div', 'stack', sh);
      const wait = el('p', 'muted small', st, T('Getting your sign-in ready...'));
      const fallback = SITE + (to === 'account' ? '/account' : '/pricing');
      const show = (url, signedIn) => {
        wait.remove();
        const a = btn(T('Continue on blokvane.com'), { kind: 'go', href: url }, st);
        a.addEventListener('click', () => { wantLicense = Date.now() + 40 * 60000; setTimeout(close, 400); });
        st.insertBefore(a, st.firstChild);
        el('p', 'muted small', st, signedIn ? T('You are signed in there already. When you are done, come back here: this phone picks up its license by itself.')
          : T('Sign in there with the same email. When you are done, come back here.'));
        if (S && S.license && S.license.can_ask && S.license.can_ask.length && to !== 'account') {
          for (const o of S.license.can_ask) {
            const b = btn(o.asked ? T('Asked {name}. Waiting for an answer', { name: o.name }) : T('Ask {name} for a license', { name: o.name }), {}, st, async () => {
              const r = await ask('/v1/license/request', { org: o.id, device: deviceName(), note: '' });
              if (!r.ok) { toast(why(r), 'bad'); return; }
              toast(T('Asked. Your administrator gets a message.'), 'ok'); close(); load(true);
            });
            if (o.asked) b.disabled = true;
          }
        }
        if (S && S.license && S.license.total > 0 && !S.license.on && to !== 'account') btn(T('Use a license another device has'), {}, st, () => { close(); devicesSheet(); });
      };
      ask('/v1/auth/site', { to: to === 'account' ? 'account' : 'pricing' }).then(r => {
        if (!sh.isConnected) return;
        const u = r.ok && typeof r.data.url === 'string' && r.data.url.indexOf(SITE + '/') === 0 ? r.data.url : '';
        show(u || fallback, !!u);
      });
    });
  }
  // the devices on this person's licenses: take one off, and this phone can use its license
  function devicesSheet() {
    sheet(T('Your devices'), async (sh, close) => {
      const wait = el('p', 'muted', sh, T('Checking...'));
      const r = await ask('/v1/license/devices');
      if (!sh.isConnected) return;
      wait.remove();
      if (!r.ok) { el('p', 'err', sh, why(r)); return; }
      const M = r.data, list = M.devices || [];
      el('p', 'muted', sh, T('One license covers one device at a time. {used} of {total} are in use.', { used: num(M.in_use), total: num(M.licenses) }));
      if (!list.length) el('p', 'muted', sh, T('No device is on a license yet.'));
      const ls = el('div', 'list', sh);
      if (!list.length) ls.remove();
      for (const d of list) {
        const it = el('div', 'item plain', ls);
        it.appendChild(icon(d.browser === 'phone' ? 'shield' : 'laptop'));
        const t = el('span', 't', it);
        const b = el('b', '', t, d.name);
        if (d.this) el('span', 'tag', b, T('This phone'));
        el('small', '', t, T('Used {when}', { when: ago(d.last_seen) }));
        btn(T('Remove'), { cls: 'sm bad' }, it, async () => {
          const x = await ask('/v1/license/devices/remove', { id: d.id });
          if (!x.ok) { toast(why(x), 'bad'); return; }
          toast(T('Removed. Its license is free.'), 'ok'); close(); await load(true); draw();
        }).setAttribute('aria-label', T('Remove') + ' ' + d.name);
      }
      el('p', 'muted small', sh, T('A removed device goes back to free Blokvane and is signed out. Its license is free for another device right away.'));
    });
  }
  // how to take ad blocking off the phone again
  function offSteps(parent) {
    const p = plat();
    steps(parent, p === 'ios' ? [
      [T('Open the Settings app'), T('Tap General, then "VPN & Device Management".')],
      [T('Tap "Blokvane ad blocking"'), T('Then tap "Remove Profile" and type the passcode.')]
    ] : [
      [T('In Chrome: Settings, then "Privacy and security"'), T('Tap "Use secure DNS" and pick the first choice again.')],
      [T('If you used Private DNS'), T('Open Settings, then Network and internet, then Private DNS, and pick "Automatic".')]
    ]);
  }
  function offSheet() {
    sheet(T('Switch off ad blocking'), (sh, close) => {
      el('p', 'muted', sh, T('Do this on the phone first, so it goes back to its normal lookups:'));
      offSteps(sh);
      el('p', 'note', sh, T('Nothing else was changed on this phone. After these steps it is exactly as it was before.'));
      const st = el('div', 'stack', sh);
      btn(T('I did that. Switch it off'), { cls: 'bad' }, st, async () => {
        const r = await ask('/v1/phone/dns/off');
        if (!r.ok) { toast(why(r), 'bad'); return; }
        store.del('shield:dns'); close(); toast(T('Switched off.'), 'ok'); await load(true); draw();
      });
      btn(T('Keep it on'), {}, st, () => close());
    });
  }

  // ---------------------------------------------------------------- the phone's own steps
  function setup(parent) {
    const u = urls(), p = plat();
    if (!u) {
      el('p', '', parent, T("This app no longer has this phone's address (its memory was cleared). Make a new one and do the steps again: the old one stops working."));
      btn(T('Make a new address'), { kind: 'go' }, parent, () => make());
      return;
    }
    if (p === 'ios') {
      // An iPhone hands a profile to Settings only from Safari itself. From a home-screen app (or another browser) the
      // link would open in a small in-app browser that shows a white page forever. So there the button hands the link
      // straight to Safari ("x-safari-https://...", iOS 17 and newer); older iPhones get the way through Safari below.
      const outside = standalone() || !SAFARI;
      const a = btn(T('Install the profile'), { kind: 'go', icon: 'shield', href: outside && /^https:\/\//.test(u.profile) ? 'x-safari-' + u.profile : u.profile }, parent);
      if (outside) { a.removeAttribute('target'); a.removeAttribute('rel'); }
      a.style.marginBottom = '4px';
      steps(parent, [
        [T('Tap "Install the profile"'), T('The phone asks whether to allow the download: tap Allow.')],
        [T('Open the Settings app'), T('Tap "Profile Downloaded" near the top. Not there? Tap General, then "VPN & Device Management", then "Blokvane ad blocking".')],
        [T('Tap Install, three times'), T('It asks for the passcode. "Not Signed" in red is normal for a profile that does not come from a company\'s device management.')],
        [T('Come back here'), T('This page notices by itself. It takes a few seconds.')]
      ]);
      if (outside) {
        const d = el('details', 'more', parent);
        d.open = true;
        el('summary', '', d, T('Nothing happens when you tap the button?'));
        el('p', 'muted', d, T('A white page that never loads? Tap the compass at the bottom right of it: that opens it in Safari, where the phone asks to allow the download.'));
        el('p', 'muted', d, T('Then the profile has to be opened in Safari. Copy the link, open Safari, paste it into the address bar, and tap Allow.'));
        copyBox(d, u.profile, T('The link to the profile'));
      }
      return;
    }
    // Android (open only for the owner's own accounts until it is ready for everyone)
    if (S && S.android_whole && u.hostname) {
      el('h3', '', parent, T('The whole phone'));
      copyBox(parent, u.hostname, T("This phone's name"));
      steps(parent, [
        [T('Copy the name above'), T("It is this phone's own. Don't share it.")],
        [T('Open Settings, then Network and internet'), T('On a Samsung: Connections, then More connection settings.')],
        [T('Tap Private DNS'), T('Pick "Private DNS provider hostname", paste the name, and tap Save.')],
        [T('Come back here'), T('This page notices by itself. It takes a few seconds.')]
      ]);
      const d = el('details', 'more', parent);
      el('summary', '', d, T('Or only in Chrome'));
      chromeSteps(d, u);
    } else chromeSteps(parent, u);
  }
  function chromeSteps(parent, u) {
    copyBox(parent, u.doh, T("This phone's address"));
    steps(parent, [
      [T('Copy the address above'), T("It is this phone's own. Don't share it.")],
      [T("Open Chrome's settings"), T('In the Chrome app, tap the three dots at the top, then Settings, then "Privacy and security".')],
      [T('Tap "Use secure DNS"'), T('Pick "Choose another provider". In the list pick "Custom", then paste the address.')],
      [T('Come back here'), T('This page notices by itself. It takes a few seconds.')]
    ]);
  }
  // what it can and cannot do, said plainly
  function limits(parent, open) {
    const d = el('details', 'more', parent);
    if (open) d.open = true;
    el('summary', '', d, T("What it blocks, and what it can't"));
    bullets(d, [
      T("It stops ads and trackers that come from ad and tracking companies' own servers: in apps, games, news sites and browsers."),
      T('It also stops ad servers hidden under a site\'s own name. Every hour Blokvane checks whether a web ending (like ".cfd") is used almost only by ad companies; if one is, new addresses there are stopped too, before any list has them.'),
      T('It cannot remove the ads inside YouTube, or in other apps that send their ads from the same servers as their videos.'),
      T('Where an ad was, an empty space can stay. A sponsored link at the top of search results may not open: use the normal result under it.'),
      T("This phone's lookups go to Blokvane, encrypted. Blokvane answers them and keeps none of them: no list of sites or apps. It only counts how many."),
      T('If the internet ever acts up right after a change, switch ad blocking off under More. Everything is back at once.')
    ]);
    return d;
  }

  // ---------------------------------------------------------------- the dial: a small honeycomb with the state in its middle
  function dial(parent, state, big, label) {
    const d = el('div', 'dial ' + state, parent);
    d.setAttribute('role', 'img'); d.setAttribute('aria-label', big + ' ' + label);
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '-100 -100 200 200'); svg.setAttribute('class', 'comb'); svg.setAttribute('aria-hidden', 'true');
    const R = 12.4, W = Math.sqrt(3) * R;
    for (let q = -6; q <= 6; q++) for (let r = -6; r <= 6; r++) {
      const x = W * (q + r / 2), y = 1.5 * R * r, dist = Math.hypot(x, y);
      if (dist < 44 || dist > 92) continue;
      const pts = [];
      for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); pts.push((x + (R - .6) * Math.cos(a)).toFixed(1) + ',' + (y + (R - .6) * Math.sin(a)).toFixed(1)); }
      const c = document.createElementNS(NS, 'polygon'); c.setAttribute('points', pts.join(' ')); c.setAttribute('class', 'cell'); c.style.setProperty('--d', String(Math.round((dist - 44) * 7)));
      c.setAttribute('data-a', ((Math.atan2(x, -y) / (2 * Math.PI) + 1) % 1).toFixed(4));
      svg.appendChild(c);
    }
    d.appendChild(svg);
    const st = el('div', 'stamp', d); st.setAttribute('aria-hidden', 'true');
    st.innerHTML = '<svg viewBox="-100 -100 200 200"><defs><path id="abcirc" d="M0,-86 a86,86 0 1,1 -0.1,0"/></defs><text><textPath href="#abcirc">Blokvane · ad blocker · Blokvane · ad blocker ·</textPath></text></svg>';
    const core = el('div', 'core', d);
    el('div', 'num', core, big);
    el('div', 'lbl', core, label);
    return d;
  }
  function statRow(parent, list) {
    const s = el('div', 'stats', parent);
    for (const [v, label, cls] of list) { const c = el('div', 'stat' + (cls ? ' ' + cls : ''), s); el('b', '', c, v); el('span', '', c, label); }
    return s;
  }
  // a headline with one part in the Lab's coral italics: T('Ads are *blocked.*')
  function headline(parent, text, ok) {
    const h = el('h1', ok ? 'ok' : '', parent);
    const m = /^(.*?)\*(.+?)\*(.*)$/.exec(text);
    if (!m) { h.textContent = text; return h; }
    h.append(m[1]); el('em', '', h, m[2]); h.append(m[3]);
    return h;
  }
  const today = () => { const d = S && S.stats ? S.stats.days.find(x => x.d === S.stats.today) : null; return d || { asked: 0, blocked: 0, country: 0 }; };
  function leftText(sec) {
    const m = Math.max(0, Math.ceil(sec / 60));
    return m < 60 ? T('{m} min', { m: num(m) }) : m % 60 ? T('{h} h {m} min', { h: num(Math.floor(m / 60)), m: num(m % 60) }) : T('{h} hours', { h: num(m / 60) });
  }

  // ---------------------------------------------------------------- Shield: the first page
  function home(v) {
    const ph = phase(), p = plat(), I = info();
    if (ph === 'desktop') {
      el('div', 'eyebrow', v, T('For your phone'));
      headline(v, T('Open this on *your phone.*'));
      el('p', 'lede', v, T("This app blocks ads on an iPhone or an iPad. Point the phone's camera at the code, or type the address into its browser."));
      qr(el('div', 'qr', v), APP_URL);
      el('p', 'addr', v, APP_URL.replace(/^https?:\/\//, ''));
      const c = el('div', 'card', v); c.style.marginTop = '20px';
      el('h2', '', c, T('On this computer'));
      el('p', 'muted', c, T('Blokvane for Chrome and Edge blocks far more than a phone can: it also takes the ads out of YouTube.'));
      btn(T('Get Blokvane for your computer'), { href: SITE + '/download' }, c);
      return;
    }
    if (ph === 'old') {
      el('div', 'eyebrow', v, 'Blokvane Ad Blocker');
      headline(v, T('Needs *iOS 14* or newer.'));
      el('p', 'lede', v, T('Ad blocking for the whole phone uses a setting that Apple added in iOS 14. This device has iOS {n}.', { n: IOS }));
      dial(v, 'off', T('Off'), T('Ad blocking'));
      el('p', 'under', v, T('If this device can be updated: open Settings, then General, then Software Update.'));
      el('div', 'sec', v, T('What works today'));
      const ls = el('div', 'list', v);
      row(ls, 'hex', T('Run the Ad Blocker Test'), T('See what gets through on this phone right now'), () => go('test'));
      row(ls, 'laptop', T('Blokvane for your computer'), T('Blocks ads in Chrome and Edge, YouTube included'), null, SITE + '/download');
      return;
    }
    if (ph === 'signedout') {
      const soon = p === 'android' && I.droid !== 'all';
      el('div', 'eyebrow', v, 'Blokvane Ad Blocker');
      headline(v, T('Block ads on *this phone.*'));
      el('p', 'lede', v, soon ? T('Ad blocking for Android phones is almost ready. Today it works on iPhone and iPad.')
        : T('In every app and every browser. Set up once, in about a minute.'));
      dial(v, 'off', T('Off'), T('Ad blocking'));
      if (I.open === 'none') {
        const c = el('div', 'card', v);
        el('span', 'pill', c, T('Not open yet'));
        el('h2', '', c, T('Ad blocking for phones is not switched on yet'));
        el('p', 'muted', c, T('It opens here as soon as it is ready. Blokvane on your computer blocks ads today.'));
        btn(T('Get Blokvane for your computer'), { href: SITE + '/download' }, c);
        return;
      }
      if (soon) {
        const b = btn(T('Coming soon on Android'), { kind: 'go', icon: 'clock' }, v); b.disabled = true;
        el('p', 'under', v, T('You can run the Ad Blocker Test today: it is under "Test" below.'));
        const st = el('div', 'stack', v); st.style.marginTop = '16px';
        btn(T('Sign in'), {}, st, () => signIn());
        btn(T('Get Blokvane for your computer'), { href: SITE + '/download' }, st);
        return;
      }
      btn(T('Start'), { kind: 'go', icon: 'shield' }, v, () => turnOn());
      el('p', 'under', v, I.open === 'some' ? T('Blokvane is trying this out with a few people first. Sign in to see if it is open for your email.')
        : T('Free for 24 hours. No card. After that it needs a Blokvane license.'));
      el('div', 'sec', v, T('How it goes'));
      steps(v, [
        [T('Sign in with your email'), T('Blokvane emails you a code. There is no password.')],
        [T('Start your free day, or use your license'), T('One tap. The free day needs no card.')],
        [T('Allow one small settings profile'), T('The page shows the four taps, and notices when you are done.')]
      ]);
      limits(v);
      return;
    }
    if (ph === 'loading') { el('div', 'eyebrow', v, T('This phone')); headline(v, T('One moment...')); dial(v, 'wait', '', T('Checking')); return; }
    if (ph === 'checking') {
      el('div', 'eyebrow', v, T('This phone')); headline(v, T('One moment...'));
      el('p', 'lede', v, T('Testing that this phone really asks Blokvane. It takes a few seconds.'));
      dial(v, 'wait', '', T('Testing this phone'));
      if (!liveBusy) verify(2).then(() => draw());
      return;
    }
    if (ph === 'failed') {
      el('div', 'eyebrow', v, T('This phone'));
      headline(v, T("Blokvane didn't *answer.*"));
      el('p', 'lede', v, failed);
      btn(T('Try again'), { kind: 'go', icon: 'refresh' }, v, () => load());
      return;
    }
    if (ph === 'closed') {
      el('div', 'eyebrow', v, T('This phone'));
      headline(v, T('Not open *yet.*'));
      el('p', 'lede', v, S.open === 'some' ? T('Blokvane is trying ad blocking for phones out with a few people before it opens for everyone. It is not open for this email yet.')
        : T('Ad blocking for phones is not switched on yet. It opens here as soon as it is ready.'));
      el('p', 'muted', v, T('Nothing was changed on this phone or on your licenses.'));
      const st = el('div', 'stack', v);
      btn(T('Check again'), { icon: 'refresh' }, st, () => load());
      if (S.dns.on) { el('p', 'note', v, T('Ad blocking was switched on here before. Nothing is blocked now, and the internet keeps working.')); btn(T('Switch it off'), {}, v, offSheet); }
      return;
    }
    if (ph === 'soon') {
      el('div', 'eyebrow', v, 'Android');
      headline(v, T('Coming *soon.*'));
      el('p', 'lede', v, T('Ad blocking for Android phones is almost ready. Today it works on iPhone and iPad.'));
      dial(v, 'off', T('Soon'), 'Android');
      const b = btn(T('Coming soon on Android'), { kind: 'go', icon: 'clock' }, v); b.disabled = true;
      el('p', 'under', v, T('Nothing was changed on this phone or on your licenses.'));
      el('div', 'sec', v, T('What works today'));
      const ls = el('div', 'list', v);
      row(ls, 'hex', T('Run the Ad Blocker Test'), T('See what gets through on this phone right now'), () => go('test'));
      row(ls, 'laptop', T('Blokvane for your computer'), T('Blocks ads in Chrome and Edge, YouTube included'), null, SITE + '/download');
      return;
    }
    const d = S.dns, L = S.license, F = S.free_day, t = today();
    if (ph === 'start') {
      el('div', 'eyebrow', v, T('This phone'));
      headline(v, T('Block ads on *this phone.*'));
      el('p', 'lede', v, p === 'ios' ? T('In every app and every browser. One tap here, then four taps in Settings.') : T('One tap here, then one address to paste on the phone.'));
      dial(v, 'off', T('Off'), T('Ad blocking'));
      if (L.on && !d.licensed) {
        const c = el('div', 'card', v);
        el('span', 'pill', c, T('Not included'));
        el('h2', '', c, T('Your license leaves phones out'));
        el('p', 'muted', c, T('Your organization did not include ad blocking on phones in your license. Ask your administrator to switch it on for you.'));
        btn(T('Check again'), { icon: 'refresh' }, c, () => load());
      } else if (d.licensed || L.free > 0) {
        btn(T('Turn on ad blocking'), { kind: 'go', icon: 'shield' }, v, () => turnOn());
        el('p', 'under', v, F.on ? T('Your free day is running: {left} left.', { left: leftText(F.ends - now()) })
          : L.on ? T('This phone is on a license.') : T('This phone takes one of your licenses ({n} free). You can take it off again at any time.', { n: num(L.free) }));
      } else if (F.can) {
        btn(T('Try it free for 24 hours'), { kind: 'go', icon: 'shield' }, v, () => turnOn());
        el('p', 'under', v, T('No card. It stops by itself.'));
        btn(T('I have a license'), { kind: 'link' }, el('p', 'center', v), () => licenseHelp());
      } else {
        btn(T('Get a license'), { kind: 'go', icon: 'shield' }, v, () => licenseSheet());
        el('p', 'under', v, L.total > 0 ? T('All {n} of your licenses are in use.', { n: num(L.total) }) : T('Your free day is used. A license keeps ads blocked on this phone.'));
        if (L.total > 0) btn(T('Use a license another device has'), {}, el('div', 'stack', v), devicesSheet).parentNode.style.marginTop = '14px';
      }
      // (other phones of this person with ad blocking on: maybe this is one of them, with a new memory)
      if (S.phones && S.phones.length) {
        const c = el('div', 'card soft', v); c.style.marginTop = '18px';
        el('h3', '', c, T('Already switched on for this phone?'));
        el('p', 'muted small', c, T('If ad blocking was set up on this very phone before, pick it. This app then knows it again, with nothing to install.'));
        const ls = el('div', 'list', c);
        for (const x of S.phones) {
          const it = el('div', 'item plain', ls);
          it.appendChild(icon('shield'));
          const tt = el('span', 't', it);
          el('b', '', tt, x.name || T('A phone'));
          el('small', '', tt, x.last_used ? T('Asked Blokvane {when}', { when: ago(x.last_used) }) : T('Not used yet'));
          btn(T('This one'), { cls: 'sm' }, it, () => adopt(x.device));
        }
      }
      limits(v);
      return;
    }
    if (ph === 'finish') {
      // Three cases. Never heard from this phone: the steps, once. Heard before, but the test from this page does not
      // come through now: say so plainly, say the likely reasons, and make setting it up again one tap (the same
      // address when the app still has it; a new one otherwise).
      const before = d.last_used > 0, here = urls();
      const check = async () => {
        const got = await verify(2);
        await load(true);
        draw();
        if (got === 'yes') toast(T('Ad blocking is on.'), 'ok');
        else toast(liveOther ? T('This phone uses Blokvane with another email. Sign in with that one.') : before ? T('The test did not come through. Ad blocking is not running on this phone right now.') : T('Not yet. Do the steps above, then check again.'));
      };
      if (before) {
        el('div', 'eyebrow', v, T('This phone'));
        headline(v, T('Not blocking *here.*'));
        el('p', 'lede', v, T('This page just asked Blokvane a test question, and it did not come through this phone\'s ad blocking.') + ' ' + T('Blokvane last heard from this phone {when}.', { when: ago(d.last_used) }));
        dial(v, 'bad', T('Off'), T('Not blocking'));
        const st = el('div', 'stack'); st.style.marginTop = '14px';
        if (!here) v.appendChild(st);
        if (here) {
          // (the app still has this phone's address: the same steps again, starting with the one button that
          // installs the profile. Nothing new is made, so nothing else stops working)
          el('div', 'label', v, T('Set it up again'));
          setup(el('div', 'card', v));
          btn(T('Test again'), { icon: 'refresh' }, st, check);
          v.appendChild(st);
        } else {
          btn(T('Set it up again'), { kind: 'go', icon: 'shield' }, st, () => make());
          el('p', 'under', v, T('This makes a new address for this phone. The old one stops blocking, so the steps have to be done again.'));
          btn(T('Test again'), { icon: 'refresh' }, st, check);
          if (p === 'android' && !CHROME && /^https:\/\//.test(APP_URL)) btn(T('Open this page in Chrome'), { href: 'intent://' + APP_URL.slice(8) + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(APP_URL) + ';end' }, st);
        }
        el('div', 'label', v, T('The usual reasons')).style.marginTop = '18px';
        bullets(v, p === 'ios' ? [
          T('The profile was removed from this phone. Install it again with the steps on this page.'),
          T('Is "iCloud Private Relay" on? It sends Safari\'s lookups past Blokvane. Switch it off in Settings: your name at the top, then iCloud, then Private Relay.'),
          T('A VPN app does the same while it is connected.')
        ] : [
          T('The setting was removed from Chrome. Do the steps on this page again.'),
          T('On Android, ad blocking is a setting inside Chrome. If this page is open in another browser, or inside another app, open it in Chrome.'),
          T('A VPN app sends lookups past Blokvane while it is connected.')
        ]);
        btn(T('Switch it off'), {}, el('div', 'stack', v), offSheet);
        if (F.on) el('p', 'under', v, T('Your free day is running: {left} left.', { left: leftText(F.ends - now()) }));
        return;
      }
      el('div', 'eyebrow', v, T('Almost there'));
      headline(v, T('Now the steps *on the phone.*'));
      el('p', 'lede', v, T('Blokvane has not heard from this phone yet. Do the steps below once. This page turns green by itself.'));
      dial(v, 'wait', '', T('Waiting for this phone'));
      const c = el('div', 'card', v);
      setup(c);
      const st = el('div', 'row2', v);
      btn(T('Check now'), { icon: 'refresh' }, st, check);
      btn(T('Switch it off'), {}, st, offSheet);
      const w = el('details', 'more', v);
      el('summary', '', w, T('Still waiting after a minute?'));
      bullets(w, p === 'ios' ? [
        T('Look in Settings, General, "VPN & Device Management": "Blokvane ad blocking" has to be in the list there.'),
        T('Is "iCloud Private Relay" on? It sends Safari\'s lookups past Blokvane. Switch it off in Settings: your name at the top, then iCloud, then Private Relay.'),
        T('A VPN app does the same while it is connected.')
      ] : [
        T('Look at the setting again: the address has to be there in full, with nothing before or after it.'),
        T('A VPN app sends lookups past Blokvane while it is connected.')
      ]);
      if (F.on) el('p', 'under', v, T('Your free day is running: {left} left.', { left: leftText(F.ends - now()) }));
      return;
    }
    if (ph === 'paused') {
      el('div', 'eyebrow', v, T('This phone'));
      headline(v, T('Nothing is blocked *right now.*'));
      const over = F.used && !F.on && !L.on;
      el('p', 'lede', v, d.why === 'org' ? T('Your organization did not include ad blocking on phones in your license.')
        : over ? T('Your free day is over. The internet keeps working, and ads are back until this phone is on a license.')
          : T('This phone is not on a license any more. The internet keeps working, and ads are back.'));
      dial(v, 'bad', T('Off'), T('Not blocking'));
      const st = el('div', 'stack', v);
      if (d.why === 'org') btn(T('Check again'), { icon: 'refresh' }, st, () => load());
      else if (L.free > 0) btn(T('Put this phone on a license'), { kind: 'go', icon: 'shield' }, st, async () => { if (await activate()) { toast(T('This phone is on your license now.'), 'ok'); await load(true); draw(); } });
      else btn(T('Get a license'), { kind: 'go', icon: 'shield' }, st, () => licenseSheet());
      if (L.total > 0 && !L.free && d.why !== 'org') btn(T('Use a license another device has'), {}, st, devicesSheet);
      btn(T('Switch it off'), {}, st, offSheet);
      el('p', 'under', v, T('Blocking starts again by itself within five minutes of getting a license. Nothing to install twice.'));
      return;
    }
    // on (or paused for a while by its owner)
    const P = pausedNow();
    if (P) { held(v, P); return; }
    el('div', 'eyebrow', v, T('This phone'));
    headline(v, T('Ads are *blocked.*'), true);
    el('p', 'lede', v, T('This phone asked Blokvane {when}. {n} ad and tracker servers are left out.', { when: ago(d.last_used), n: num(d.names) }));
    dial(v, 'on', short(t.blocked + t.country), T('stopped today'));
    statRow(v, [[num(t.asked), T('Lookups today')], [num(t.blocked + t.country), T('Stopped today'), 'pass'],
      [num(S.stats.all.blocked + S.stats.all.country), T('Stopped in all'), 'pass'], [num(S.prefs.countries.length), T('Countries blocked')]]);
    // (only with a server that can pause)
    if (canPause()) btn(T('Pause ad blocking'), { icon: 'pause', cls: 'pz-open' }, v, () => pauseSheet(null));
    if (F.on) {
      const c = el('div', 'card', v);
      el('span', 'pill', c, T('Free day'));
      el('h2', '', c, T('{left} left of your free day', { left: leftText(F.ends - now()) }));
      el('p', 'muted', c, T('When it ends, ads come back and the internet keeps working. A license keeps this phone protected.'));
      if (L.free > 0) btn(T('Put this phone on a license'), { kind: 'go', icon: 'shield' }, c, async () => { if (await activate()) { toast(T('This phone is on your license now.'), 'ok'); await load(true); draw(); } });
      else btn(T('Get a license'), { kind: 'go', icon: 'shield' }, c, () => licenseSheet());
    }
    onRows(v);
  }
  // the rows under the dial, on the page of a phone that blocks (or is paused)
  function onRows(v) {
    const ls = el('div', 'list', v);
    row(ls, 'hex', T('Run the Ad Blocker Test'), T('See what this phone stops, test by test'), () => go('test'));
    row(ls, 'globe', T('Block countries'), S.prefs.countries.length ? T('{n} chosen', { n: num(S.prefs.countries.length) }) : T('Pick countries this phone does not reach'), () => go('countries'));
    row(ls, 'chart', T('Your numbers'), T('Day by day, and a picture to share'), () => go('stats'));
    row(ls, 'check', T('A site does not open?'), S.prefs.trusted.length ? T('Always open: {n}', { n: num(S.prefs.trusted.length) }) : T('Let it through on this phone'), trustSheet);
    row(ls, 'check', T('Test this phone'), T('Checks that this phone really asks Blokvane right now'), async () => {
      toast(T('Testing this phone'));
      const got = await verify(2);
      if (got === 'yes') toast(T('Test passed. This phone asked Blokvane just now.'), 'ok');
      else { await load(true); draw(); toast(T('The test did not come through. Ad blocking is not running on this phone right now.')); }
    });
    row(ls, 'off', T('Block a website'), (S.blocked || []).length ? T('{n} blocked', { n: num(S.blocked.length) }) : T('Pick sites this phone should not open'), sitesSheet);
    // (only with a server that closes Meta's ad name the smart way: an older one would close it for good, Facebook too)
    if ((S.smart || []).includes('meta')) row(ls, 'game', T('Ads from Meta in games'), metaOn() ? T('On: blocked on this phone') : T('Off: they can still show'), metaSheet);
    row(ls, 'lock', T('Strict blocking'), S.strict ? T('On: it blocks even what phones leave open') : T('Off. See what it does'), strictSheet);
    limits(v);
    installCard(v);
  }
  // ---------------------------------------------------------------- a pause of ad blocking ("Pause ad blocking")
  // The owner can pause ad blocking on this phone for a while, from one minute to one year (POST /v1/phone/pause, kept
  // on the server, so it ends by itself even with this app closed). While it runs, the Shield page turns red: the
  // honeycomb is red for the time that is left and turns green again, cell by cell and clockwise, as the time runs out,
  // and the turning words around it stand still. A phone never tells a blocker which app is asking, so a pause is
  // always for the whole phone: the page and the sheet say so, with what else happens.
  const STOPS = [1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 240, 360, 480, 720, 1440, 2880, 4320, 10080, 20160, 43200, 86400, 129600, 259200, 525600];
  const YEAR = 525600;                        // (minutes)
  const MOST = 366 * 86400;                   // (a year from today can be 366 days)
  let heldT = 0;
  const pausedNow = () => (S && S.pause && S.pause.until > now() ? S.pause : null);
  const canPause = () => !!(S && (S.smart || []).includes('pause'));
  const untilDate = until => new Date(until * 1000 - skew);     // (the server's time, on this phone's clock)
  // "5 minutes", "1 day" (long) or "5 min", "1 day" (short), the way the language says it
  function unitText(n, unit, style) {
    try { return new Intl.NumberFormat(loc(), { style: 'unit', unit, unitDisplay: style || 'long' }).format(n); } catch (e) { return num(n) + ' ' + unit + (n === 1 ? '' : 's'); }
  }
  function durText(min, style) {
    min = Math.max(0, Math.round(min));
    if (!min) return unitText(0, 'minute', style);
    if (min === YEAR) return unitText(1, 'year', style);
    if (min % 43200 === 0 && min < YEAR) return unitText(min / 43200, 'month', style);
    if (min % 10080 === 0 && min < 43200) return unitText(min / 10080, 'week', style);
    const p = [], dd = Math.floor(min / 1440), hh = Math.floor(min % 1440 / 60), mm = min % 60;
    if (dd) p.push(unitText(dd, 'day', style));
    if (hh) p.push(unitText(hh, 'hour', style));
    if (mm) p.push(unitText(mm, 'minute', style));
    try { return new Intl.ListFormat(loc(), { style: style === 'short' ? 'narrow' : 'long', type: 'unit' }).format(p); } catch (e) { return p.join(' '); }
  }
  // the time that is left, for the dial: 4:59, 3:14:59, or 5d 3h
  function clockText(sec) {
    sec = Math.max(0, Math.ceil(sec));
    const two = n => { try { return new Intl.NumberFormat(loc(), { minimumIntegerDigits: 2, useGrouping: false }).format(n); } catch (e) { return String(n).padStart(2, '0'); } };
    if (sec < 3600) return num(Math.floor(sec / 60)) + ':' + two(sec % 60);
    if (sec < 86400) return num(Math.floor(sec / 3600)) + ':' + two(Math.floor(sec % 3600 / 60)) + ':' + two(sec % 60);
    const dd = Math.floor(sec / 86400), hh = Math.floor(sec % 86400 / 3600);
    return unitText(dd, 'day', 'narrow') + (hh ? ' ' + unitText(hh, 'hour', 'narrow') : '');
  }
  // a moment on this phone's clock: "5:47 PM" today, "Tuesday 5:47 PM" this week, "Tue, Dec 3, 5:47 PM" later
  function dateText(dt) {
    const n = new Date(), same = dt.toDateString() === n.toDateString(), soon = dt - n < 6 * 864e5;
    const o = same ? { hour: 'numeric', minute: '2-digit' } : soon ? { weekday: 'long', hour: 'numeric', minute: '2-digit' }
      : { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    if (!same && !soon && dt.getFullYear() !== n.getFullYear()) o.year = 'numeric';
    try { return new Intl.DateTimeFormat(loc(), o).format(dt); } catch (e) { return dt.toLocaleString(); }
  }
  const backText = dt => (dt.toDateString() === new Date().toDateString() ? T('Back at {time} today', { time: dateText(dt) }) : T('Back on {date}', { date: dateText(dt) }));
  // what happens during a pause, said plainly
  function pauseNotes(all) {
    const a = [plat() === 'android' ? T('The pause covers the whole phone. Android never tells a blocker which app is asking, so other apps can show ads too if you open them while it is paused.')
      : T('The pause covers the whole phone. An iPhone never tells a blocker which app is asking, so other apps can show ads too if you open them while it is paused.'),
    T('Trackers get through too. The websites you blocked and the countries you picked stay blocked.'),
    T('When the time is up, blocking comes back by itself. It takes about 10 seconds to start and to end.')];
    if (all) a.push(T('Resume now brings blocking back at once. An ad an app downloaded during the pause can still show after it.'));
    return a;
  }
  async function setPause(sec) {
    const r = await ask('/v1/phone/pause', { seconds: sec });
    if (!r.ok) { toast(why(r), 'bad'); return false; }
    if (S) S.pause = r.data.pause || null;
    if (closeSheet) closeSheet();
    draw();
    try { scrollTo(0, 0); } catch (e) {}
    toast(sec ? T('Ad blocking is paused.') : T('Ad blocking is back on.'), sec ? '' : 'ok');
    return true;
  }
  // the Shield page while paused: red, with the time that is left
  function held(v, P) {
    el('div', 'eyebrow', v, T('This phone'));
    headline(v, T('Ad blocking is *paused.*'));
    el('p', 'lede', v, T('Ads and trackers can show on this phone until {when}.', { when: dateText(untilDate(P.until)) }));
    const d = dial(v, 'held', clockText(P.until - now()), T('until blocking is back'));
    const cells = Array.from(d.querySelectorAll('.cell')), numEl = d.querySelector('.core .num');
    const total = Math.max(60, P.until - P.from);
    const tick = () => {
      const left = P.until - now();
      if (left <= 0) {
        clearInterval(heldT); heldT = 0;
        if (S && S.pause === P) S.pause = null;
        if (tab === 'home') draw();
        toast(T('Ad blocking is back on.'), 'ok');
        refresh();
        return;
      }
      // (red: the part of the pause that is left; green comes back clockwise from the top)
      const f = Math.min(1, left / total);
      for (const c of cells) c.classList.toggle('left', +c.getAttribute('data-a') >= 1 - f);
      const t = clockText(left);
      if (numEl.textContent !== t) { numEl.textContent = t; numEl.classList.toggle('long', t.length > 5); }
    };
    tick();
    heldT = setInterval(tick, 1000);
    const st = el('div', 'stack', v);
    btn(T('Resume now'), { kind: 'go', cls: 'green', icon: 'play' }, st, () => setPause(0));
    btn(T('Change the time'), { icon: 'clock' }, st, () => pauseSheet(P));
    const c = el('div', 'card soft pz-info', v);
    el('h3', '', c, T('While it is paused'));
    bullets(c, pauseNotes(true));
    onRows(v);
  }
  // press and hold a + or - to keep counting
  function hold(b, fn) {
    let t = 0, r = 0;
    const stop = () => { clearTimeout(t); clearInterval(r); t = r = 0; };
    b.addEventListener('pointerdown', e => { if (e.button) return; e.preventDefault(); stop(); fn(); t = setTimeout(() => { r = setInterval(fn, 70); }, 420); });
    for (const ev of ['pointerup', 'pointerleave', 'pointercancel', 'blur']) b.addEventListener(ev, stop);
    b.addEventListener('click', e => { if (e.detail === 0) fn(); });       // (a keyboard: Enter or Space)
  }
  const nearest = min => { let k = 0; for (let i = 1; i < STOPS.length; i++) if (Math.abs(Math.log(STOPS[i] / min)) < Math.abs(Math.log(STOPS[k] / min))) k = i; return k; };
  const pad2 = n => String(n).padStart(2, '0');
  const ymd = dt => dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate());
  // the sheet that pauses: a slider from one minute to one year, quick picks, and a time of one's own
  function pauseSheet(P) {
    sheet(P ? T('Change the pause') : T('Pause ad blocking'), sh => {
      // what is picked: a stop of the slider ('slide'), a time of one's own ('for'), or a date and a time ('until')
      let mode = 'slide', mins = P ? STOPS[nearest(Math.max(1, (P.until - now()) / 60))] : 5, until = null;
      const parts = { d: 0, h: 0, m: 5 }, MAXP = { d: 365, h: 23, m: 59 };
      const read = el('div', 'pz-read', sh);
      const big = el('div', 'pz-big', read), when = el('div', 'pz-when', read);
      read.setAttribute('aria-live', 'polite');
      // (the slider: 27 stops from one minute to one year)
      const sl = el('div', 'pz-slide', sh);
      const range = el('input', 'pz-range', sl);
      range.type = 'range'; range.min = '0'; range.max = String(STOPS.length - 1); range.step = '1';
      range.setAttribute('aria-label', T('How long'));
      const ticks = el('div', 'pz-ticks', sl); ticks.setAttribute('aria-hidden', 'true');
      for (const m of [1, 60, 1440, 43200, YEAR]) {
        const sp = el('span', '', ticks, durText(m, 'short'));
        sp.style[lang === 'ar' ? 'right' : 'left'] = (100 * STOPS.indexOf(m) / (STOPS.length - 1)) + '%';
      }
      // (a label that would run into the one after it is left out: the last one, "1 year", always stays)
      requestAnimationFrame(() => {
        let keep = null;
        for (const sp of Array.from(ticks.children).reverse()) {
          const r = sp.getBoundingClientRect();
          if (keep && r.right + 6 > keep.left && r.left < keep.right + 6) sp.style.visibility = 'hidden'; else keep = r;
        }
      });
      range.addEventListener('input', () => { mode = 'slide'; mins = STOPS[+range.value] || 5; fillFor(); showSeg('for'); sync(); });
      // (quick picks)
      const chips = el('div', 'pz-chips', sh);
      const quick = [1, 5, 15, 60, 1440, 10080, 43200, YEAR].map(m => {
        const b = el('button', 'pz-chip', chips, durText(m, 'short')); b.type = 'button';
        b.onclick = () => { mode = 'slide'; mins = m; fillFor(); showSeg('for'); sync(); };
        return [m, b];
      });
      // (a time of one's own: how long, in days, hours and minutes; or until a date and a time)
      const own = el('button', 'pz-own', sh); own.type = 'button'; own.setAttribute('aria-expanded', 'false');
      own.appendChild(icon('clock')); el('span', '', own, T('Set your own time'));
      const chv = icon('chev'); chv.classList.add('chev'); own.appendChild(chv);
      const panel = el('div', 'pz-panel', sh); panel.hidden = true;
      own.onclick = () => { panel.hidden = !panel.hidden; own.setAttribute('aria-expanded', String(!panel.hidden)); };
      const seg = el('div', 'pz-seg', panel);
      const segFor = el('button', '', seg, T('How long')), segUntil = el('button', '', seg, T('Until when'));
      segFor.type = segUntil.type = 'button';
      const forBox = el('div', 'pz-steps', panel), untilBox = el('div', 'row2 pz-until', panel);
      function showSeg(w) {
        segFor.setAttribute('aria-pressed', String(w === 'for')); segUntil.setAttribute('aria-pressed', String(w === 'until'));
        forBox.hidden = w !== 'for'; untilBox.hidden = w !== 'until';
      }
      segFor.onclick = () => { if (mode === 'until') { mode = 'for'; } showSeg('for'); sync(); };
      segUntil.onclick = () => { showSeg('until'); if (!until) fillUntil(); mode = 'until'; sync(); };
      const inputs = {};
      for (const [k, label] of [['d', T('Days')], ['h', T('Hours')], ['m', T('Minutes')]]) {
        const box = el('div', 'pz-step', forBox);
        const id = 'pz-' + k + '-' + hex(3);
        const lb = el('label', '', box, label); lb.htmlFor = id;
        const up = el('button', 'pz-pm', box); up.type = 'button'; up.setAttribute('aria-label', label + ': ' + T('One more')); up.appendChild(icon('plus'));
        const inp = el('input', '', box); inp.id = id; inp.type = 'text'; inp.inputMode = 'numeric'; inp.autocomplete = 'off'; inp.maxLength = 3; inp.setAttribute('enterkeyhint', 'done');
        const dn = el('button', 'pz-pm', box); dn.type = 'button'; dn.setAttribute('aria-label', label + ': ' + T('One less')); dn.appendChild(icon('minus'));
        inputs[k] = inp;
        const step = n => { parts[k] = Math.max(0, Math.min(MAXP[k], parts[k] + n)); mode = 'for'; sync(); };
        hold(up, () => step(1)); hold(dn, () => step(-1));
        inp.addEventListener('input', () => { const n = parseInt(inp.value.replace(/\D/g, ''), 10); parts[k] = isNaN(n) ? 0 : Math.min(MAXP[k], n); mode = 'for'; sync(); });
        inp.addEventListener('blur', () => { inp.value = String(parts[k]); });
      }
      const dWrap = el('div', '', untilBox), tWrap = el('div', '', untilBox);
      const dl = el('label', 'f', dWrap, T('Date')), tl = el('label', 'f', tWrap, T('Time'));
      const dIn = el('input', 'in', dWrap), tIn = el('input', 'in', tWrap);
      dIn.type = 'date'; tIn.type = 'time'; dIn.id = 'pz-date-' + hex(3); tIn.id = 'pz-time-' + hex(3); dl.htmlFor = dIn.id; tl.htmlFor = tIn.id;
      const readUntil = () => {
        const a = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dIn.value), b = /^(\d{2}):(\d{2})/.exec(tIn.value);
        until = a && b ? new Date(+a[1], +a[2] - 1, +a[3], +b[1], +b[2]) : null;
        mode = 'until'; sync();
      };
      dIn.addEventListener('input', readUntil); tIn.addEventListener('input', readUntil);
      dIn.addEventListener('change', readUntil); tIn.addEventListener('change', readUntil);
      function fillFor() { const m = Math.min(YEAR, mins); parts.d = Math.floor(m / 1440); parts.h = Math.floor(m % 1440 / 60); parts.m = m % 60; }
      function fillUntil() {
        const dt = new Date(Date.now() + Math.max(5, mins) * 60000);
        dt.setSeconds(0, 0); dt.setMinutes(Math.ceil(dt.getMinutes() / 5) * 5);
        const yr = new Date(); yr.setFullYear(yr.getFullYear() + 1);
        if (dt > yr) dt.setTime(yr.getTime() - 60000);
        dIn.value = ymd(dt); tIn.value = pad2(dt.getHours()) + ':' + pad2(dt.getMinutes()); until = dt;
      }
      const err = el('p', 'err', sh); err.hidden = true; err.setAttribute('role', 'alert');
      const info = el('div', 'card soft pz-info', sh);
      el('h3', '', info, T('While it is paused'));
      bullets(info, pauseNotes(false));
      const goB = btn(T('Pause ad blocking'), { kind: 'go', icon: 'pause' }, sh, async () => { const sec = seconds(); if (sec) await setPause(sec); });
      el('p', 'note', sh, T('To earn a reward in a game: pause for a few minutes, watch the ad to the end, then tap Resume now.'));
      function seconds() {
        if (mode === 'until') { if (!until) return 0; const x = Math.round((until - Date.now()) / 1000); return x >= 60 && x <= MOST ? x : 0; }
        const m = mode === 'for' ? parts.d * 1440 + parts.h * 60 + parts.m : mins;
        return m >= 1 && m <= YEAR ? m * 60 : 0;
      }
      function sync() {
        if (parts.d >= 365) { parts.d = 365; parts.h = 0; parts.m = 0; }
        const sec = seconds();
        const m = mode === 'slide' ? mins : mode === 'for' ? parts.d * 1440 + parts.h * 60 + parts.m : until ? Math.max(0, Math.round((until - Date.now()) / 60000)) : 0;
        const end = mode === 'until' && until ? until : new Date(Date.now() + m * 60000);
        big.textContent = durText(m);
        when.textContent = sec ? backText(end) : '';
        const k = mode === 'slide' ? STOPS.indexOf(mins) : nearest(Math.max(1, m));
        range.value = String(k < 0 ? nearest(mins) : k);
        range.style.setProperty('--p', (100 * +range.value / (STOPS.length - 1)) + '%');
        for (const [qm, b] of quick) b.setAttribute('aria-pressed', String(mode === 'slide' && qm === mins));
        for (const key of ['d', 'h', 'm']) if (document.activeElement !== inputs[key]) inputs[key].value = String(parts[key]);
        goB.querySelector('span').textContent = mode === 'until' && sec ? T('Pause until {when}', { when: dateText(until) }) : T('Pause for {time}', { time: durText(Math.max(m, 0)) });
        goB.disabled = !sec;
        err.hidden = !!sec; err.textContent = sec ? '' : T('Pick a time between 1 minute and 1 year.');
      }
      dIn.min = ymd(new Date()); { const yr = new Date(); yr.setFullYear(yr.getFullYear() + 1); dIn.max = ymd(yr); }
      fillFor(); showSeg('for'); sync();
    });
  }
  function licenseHelp() {
    sheet(T('I have a license'), (sh, close) => {
      const a = acct();
      const p = el('p', '', sh);
      const parts = T('You are signed in as {email}. There is no free license on this email.').split('{email}');
      p.append(parts[0]); mail(p, a ? a.email : ''); p.append(parts[1] || '');
      bullets(sh, [
        T('Is your plan on another email? Sign out, then sign in with that one.'),
        T('Are all your licenses in use? Take a device off one of them, and this phone can use it.')
      ]);
      const st = el('div', 'stack', sh);
      if (S && S.license.total > 0) btn(T('Your devices'), {}, st, () => { close(); devicesSheet(); });
      btn(T('Sign out'), {}, st, () => { close(); signOutSheet(); });
      btn(T('Get a license'), {}, st, () => { close(); licenseSheet(); });
    });
  }
  // one row of a list: an icon or a picture, two lines, and where it leads
  function row(ls, ic, title, sub, fn, href, tag) {
    const it = el(href ? 'a' : fn ? 'button' : 'div', 'item' + (fn || href ? '' : ' plain'), ls);
    if (href) { it.href = href; if (/^https?:/.test(href) && href.indexOf(HERE) !== 0) { it.target = '_blank'; it.rel = 'noopener'; } } else if (fn) { it.type = 'button'; it.onclick = fn; }
    if (/\.png$/.test(ic)) { const im = el('img', '', it); im.src = ic; im.alt = ''; } else it.appendChild(icon(ic));
    const t = el('span', 't', it);
    const b = el('b', '', t, title);
    if (tag) el('span', 'tag' + (tag[1] ? ' ' + tag[1] : ''), b, tag[0]);
    if (sub) el('small', '', t, sub);
    if (fn || href) { const c = icon('chev'); c.classList.add('chev'); it.appendChild(c); }
    return it;
  }

  // ---------------------------------------------------------------- this app on the home screen
  let installEvt = null, installed = false;
  // (Android offers to install it: then it is not on this phone, whatever was noted before)
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (!standalone()) { installed = false; own.set('added', 0); } });
  addEventListener('appinstalled', () => { installEvt = null; own.set('added', 1); installed = true; });
  // (Chrome on Android can say whether the app is on the home screen already; nothing else can)
  try { if (navigator.getInstalledRelatedApps) navigator.getInstalledRelatedApps().then(a => { if (a && a.some(x => /adblock\.webmanifest/.test(x.url || ''))) { installed = true; document.querySelectorAll('.card.install').forEach(c => c.remove()); } }).catch(() => {}); } catch (e) {}
  const haveApp = k => !!(window.BVAPPS && BVAPPS.has(k));
  const canOfferInstall = () => !standalone() && !installed && !own.get('added', 0) && !haveApp('ads') && plat() !== 'desktop';
  async function installApp() {
    if (installEvt) {
      const e = installEvt; installEvt = null;
      try { e.prompt(); const c = await e.userChoice; if (c && c.outcome === 'accepted') { own.set('added', 1); installed = true; toast(T('Blokvane Ad Blocker is on your home screen now.'), 'ok'); draw(); return; } } catch (er) {}
      return;
    }
    const ios = plat() === 'ios', other = /CriOS|FxiOS|EdgiOS/.test(ua);
    sheet(T('Add this app to your home screen'), (sh, close) => {
      const hd = el('div', 'get-head', sh);
      const im = el('img', '', hd); im.src = 'ads-192.png'; im.alt = '';
      const ht = el('div', '', hd); el('b', '', ht, 'BV Ad Block'); el('p', 'muted small', ht, T('It opens like any app, with its own icon. Nothing to download from a store.'));
      steps(sh, ios ? [
        [T('Tap the Share button'), other ? T('The square with an arrow, next to the address at the top.') : T('The square with an arrow, at the bottom of Safari.')],
        [T('Tap "Add to Home Screen"'), T("Scroll down the list a little if you don't see it.")],
        [T('Tap "Add"'), T('At the top right. The app is now on your home screen.')]
      ] : [
        [T('Open the browser menu'), /SamsungBrowser/.test(ua) ? T('The three lines at the bottom right.') : T('The three dots at the top right.')],
        [T('Tap "Install app" or "Add to Home screen"'), ''],
        [T('Tap "Install" or "Add"'), T('The app is now on your home screen.')]
      ]);
      if (ios) el('p', 'note', sh, T('On an iPhone the app on the home screen has its own sign-in: it asks for your email once more. It then knows by itself that this phone is already protected.'));
      btn(T('Got it'), { kind: 'go' }, sh, () => close());
    });
  }
  function installCard(parent) {
    if (!canOfferInstall() || own.get('hideAdd', 0) > Date.now()) return null;
    const c = el('div', 'card soft install', parent); c.style.marginTop = '18px';
    const r = el('div', 'verdict', c);
    const im = el('img', '', r); im.src = 'ads-192.png'; im.alt = ''; im.style.cssText = 'width:52px;height:52px;border-radius:13px;flex:none';
    const t = el('div', '', r);
    el('h3', '', t, T('Keep this app on your home screen'));
    el('p', 'muted small', t, T('One tap to your numbers, the test and the countries.'));
    const st = el('div', 'row2', c); st.style.marginTop = '12px';
    btn(T('Add it'), { cls: 'sm', icon: 'addbox' }, st, installApp).style.width = '100%';
    btn(T('Not now'), { cls: 'sm' }, st, () => { own.set('hideAdd', Date.now() + 21 * 864e5); c.remove(); }).style.width = '100%';
    return c;
  }

  // ---------------------------------------------------------------- Test: Blokvane's Ad Blocker Test, in a frame
  let labMade = false;
  function test(v) {
    // (the test brings its own big words: here only one line that says what it is)
    el('p', 'muted small', v, T('The same test as on blokvane.com, run from this phone. Run it once before you switch ad blocking on, and once after.')).style.margin = '2px 0 8px';
    if (!labMade) {
      labMade = true;
      labEl.textContent = '';
      const f = document.createElement('iframe');
      f.title = T('Blokvane Ad Blocker Test');
      f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads');
      f.setAttribute('allow', 'clipboard-write');
      f.setAttribute('referrerpolicy', 'no-referrer');
      const ver = info().lab || (S && S.lab) || String(Math.floor(Date.now() / 864e5));
      f.src = API + '/x/lab?app=1&v=' + encodeURIComponent(ver) + (lookNow() === 'auto' ? '' : '&look=' + lookNow());
      el('div', 'labwrap', labEl).appendChild(f);
      const foot = el('div', '', labEl);
      el('p', 'muted small', foot, T('On a phone Blokvane blocks by name. A few of the tests (fake ad boxes inside a page) are things only a browser extension can stop, so they stay red here. The test says which ones after a run.')).style.marginTop = '12px';
      btn(T('Open the test in the browser'), { href: SITE + '/ad-blocker-test' }, foot);
    }
  }

  // ---------------------------------------------------------------- Numbers: what this phone asked and what was stopped
  const dayOf = n => new Date(Date.UTC(Math.floor(n / 10000), Math.floor(n / 100) % 100 - 1, n % 100));
  const dayNum = d => d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
  function week() {
    const by = {};
    for (const x of S.stats.days) by[x.d] = x;
    const out = [], end = dayOf(S.stats.today);
    for (let i = 6; i >= 0; i--) { const d = new Date(end.getTime() - i * 864e5), n = dayNum(d); out.push(Object.assign({ d: n, asked: 0, blocked: 0, country: 0 }, by[n] || {}, { date: d })); }
    return out;
  }
  function gate(v, title, text) {
    headline(v, title);
    el('p', 'lede', v, text);
    const ph = phase();
    if (ph === 'signedout') btn(T('Sign in'), { kind: 'go', icon: 'key' }, v, () => signIn());
    else if (ph === 'start' || ph === 'finish' || ph === 'paused') btn(T('Go to the Shield page'), { kind: 'go', icon: 'shield' }, v, () => go('home'));
    else if (ph === 'failed') btn(T('Try again'), { kind: 'go', icon: 'refresh' }, v, () => load());
  }
  function stats(v) {
    el('div', 'eyebrow', v, T('Your numbers'));
    const ph = phase();
    if (ph !== 'on' && !(S && S.stats && S.stats.all.asked > 0)) {
      return gate(v, T('Nothing to count *yet.*'), ph === 'desktop' ? T('Open this app on your phone to see its numbers.') : ph === 'soon' ? T('Ad blocking for Android phones is almost ready.')
        : ph === 'old' ? T('Ad blocking needs iOS 14 or newer on this device.')
        : T('Once ad blocking is on, this page shows how many lookups this phone made and how many Blokvane stopped.'));
    }
    const all = S.stats.all, t = today(), stopped = all.blocked + all.country;
    headline(v, T('*{n}* stopped so far.', { n: num(stopped) }), true);
    const since = all.since ? dayOf(all.since).toLocaleDateString(loc(), { day: 'numeric', month: 'long', timeZone: 'UTC' }) : '';
    el('p', 'lede', v, since ? T('Ads and trackers Blokvane kept away from this phone since {date}.', { date: since }) : T('Ads and trackers Blokvane kept away from this phone.'));
    statRow(v, [[num(t.asked), T('Lookups today')], [num(t.blocked + t.country), T('Stopped today'), 'pass'],
      [num(all.asked), T('Lookups in all')], [all.asked ? Math.round(100 * stopped / all.asked) + '%' : '0%', T('Of all lookups'), 'pass']]);
    const c = el('div', 'card', v);
    el('h2', '', c, T('The last 7 days'));
    const w = week(), max = Math.max(1, ...w.map(x => x.blocked + x.country));
    const bars = el('div', 'bars', c), lbl = el('div', 'barlbl', c);
    bars.setAttribute('role', 'img'); bars.setAttribute('aria-label', T('Stopped each day: {list}', { list: w.map(x => num(x.blocked + x.country)).join(', ') }));
    for (const x of w) {
      const n = x.blocked + x.country, b = el('div', 'bar' + (n ? '' : ' zero'), bars);
      el('b', '', b, n ? short(n) : '');
      el('i', '', b).style.height = Math.max(2, Math.round(100 * n / max)) + '%';
      el('span', '', lbl, x.date.toLocaleDateString(loc(), { weekday: 'short', timeZone: 'UTC' }));
    }
    if (all.country) el('p', 'muted small', c, T('{n} of them were stopped because of the countries you picked.', { n: num(all.country) })).style.marginTop = '12px';
    if (stopped > 0) btn(T('Share my numbers'), { kind: 'go', icon: 'share' }, v, storySheet);
    el('p', 'note', v, T('How this is counted: each time this phone asks where a site lives, that is one lookup, and Blokvane counts it. One ad can ask more than once, and a phone remembers answers for a while, so "stopped" is lookups stopped, not the exact number of ads. Blokvane keeps these numbers per day for 90 days, and never the names. Days are counted in world time (UTC).'));
  }
  // a picture of the numbers, made on this phone, to share or save (it holds the numbers and nothing else)
  function storySheet() {
    sheet(T('Share my numbers'), async (sh, close) => {
      const cv = el('canvas', 'story', sh); cv.width = 1080; cv.height = 1920;
      const st = el('div', 'stack', sh);
      const msg = el('p', 'muted small center', st, T('Made on this phone. It holds these numbers and nothing else.'));
      await drawStory(cv);
      const blob = await new Promise(r => { try { cv.toBlob(r, 'image/png'); } catch (e) { r(null); } });
      if (!blob || !sh.isConnected) return;
      const file = new File([blob], 'blokvane-ad-blocker.png', { type: 'image/png' });
      let can = false;
      try { can = !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) {}
      if (can) st.insertBefore(btn(T('Share'), { kind: 'go', icon: 'share' }, null, async () => {
        try { await navigator.share({ files: [file], text: T('Blokvane blocks ads on my phone. blokvane.com') }); } catch (e) {}
      }), msg);
      const a = btn(T('Save the picture'), can ? {} : { kind: 'go' }, null);
      a.addEventListener('click', () => { const l = document.createElement('a'); l.href = URL.createObjectURL(blob); l.download = 'blokvane-ad-blocker.png'; document.body.appendChild(l); l.click(); setTimeout(() => { URL.revokeObjectURL(l.href); l.remove(); }, 4000); });
      st.insertBefore(a, msg);
    });
  }
  function drawStory(cv) {
    return new Promise(done => {
      const g = cv.getContext('2d'), W = 1080, H = 1920;
      const dark = matchMedia('(prefers-color-scheme: dark)').matches;
      const C = dark ? { paper: '#15120e', ink: '#f3ebdc', ink2: '#c4b8a5', faint: '#8b8070', pass: '#3fcf95', card: '#211d18', wait: '#2c2620' } : { paper: '#f5efe3', ink: '#1f1b16', ink2: '#5d554a', faint: '#9a8f80', pass: '#18946a', card: '#fffdf8', wait: '#ebe2d1' };
      const serif = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif', mono = 'ui-monospace, "SF Mono", "Cascadia Mono", Consolas, monospace';
      g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
      g.fillStyle = dark ? 'rgba(243,235,220,.09)' : 'rgba(31,27,22,.09)';
      for (let y = 22; y < H; y += 44) for (let x = 22; x < W; x += 44) { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fill(); }
      const all = S.stats.all, stopped = all.blocked + all.country;
      const days = all.since ? Math.max(1, Math.round((dayOf(S.stats.today) - dayOf(all.since)) / 864e5) + 1) : 1;
      const rtl = lang === 'ar';
      g.direction = rtl ? 'rtl' : 'ltr';
      // the honeycomb, green
      const cx = W / 2, cy = 760, R = 46, WW = Math.sqrt(3) * R;
      for (let q = -7; q <= 7; q++) for (let r = -7; r <= 7; r++) {
        const x = WW * (q + r / 2), y = 1.5 * R * r, d = Math.hypot(x, y);
        if (d < 200 || d > 400) continue;
        g.beginPath();
        for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); g.lineTo(cx + x + (R - 4) * Math.cos(a), cy + y + (R - 4) * Math.sin(a)); }
        g.closePath(); g.fillStyle = C.pass; g.globalAlpha = .55 + .45 * ((q * 7 + r * 13 + 100) % 5) / 4; g.fill(); g.globalAlpha = 1;
      }
      g.beginPath(); g.arc(cx, cy, 186, 0, 7); g.fillStyle = C.card; g.fill(); g.lineWidth = 5; g.strokeStyle = C.ink; g.stroke();
      g.textAlign = 'center'; g.fillStyle = C.ink;
      const big = short(stopped);
      g.font = '800 ' + (big.length > 5 ? 96 : 124) + 'px ' + mono; g.fillText(big, cx, cy + 34);
      g.font = '600 30px ' + mono; g.fillStyle = C.faint; g.fillText(T('stopped').toUpperCase(), cx, cy + 96);
      // the words
      g.fillStyle = '#ff5a4e'; g.font = '600 34px ' + mono; g.fillText('BLOKVANE AD BLOCKER', cx, 250);
      g.fillStyle = C.ink; g.font = '700 84px ' + serif;
      wrap(g, T('Ads and trackers kept off my phone.'), cx, 1300, 900, 96);
      g.fillStyle = C.ink2; g.font = '500 44px system-ui, sans-serif';
      wrap(g, days > 1 ? T('{n} stopped in {d} days. Counted by Blokvane, not guessed.', { n: num(stopped), d: num(days) }) : T('{n} stopped today. Counted by Blokvane, not guessed.', { n: num(stopped) }), cx, 1530, 900, 60);
      // the app's own icon and the address
      const im = new Image();
      const end = () => { g.fillStyle = C.ink; g.font = '700 54px ' + serif; g.textAlign = 'center'; g.fillText('blokvane.com', cx, 1800); done(); };
      im.onload = () => { const s = 132, x = cx - s / 2, y = 60; g.save(); g.beginPath(); if (g.roundRect) g.roundRect(x, y, s, s, 30); else g.rect(x, y, s, s); g.clip(); g.drawImage(im, x, y, s, s); g.restore(); end(); };
      im.onerror = end;
      im.src = 'ads-512.png';
    });
  }
  function wrap(g, text, x, y, max, lh) {
    const words = String(text).split(/\s+/), lines = [];
    let line = '';
    // (Chinese has no spaces: break it letter by letter)
    const parts = words.length === 1 && text.length > 12 ? Array.from(text) : words, glue = parts === words ? ' ' : '';
    for (const w of parts) { const t = line ? line + glue + w : w; if (g.measureText(t).width > max && line) { lines.push(line); line = w; } else line = t; }
    if (line) lines.push(line);
    lines.forEach((l, i) => g.fillText(l, x, y + i * lh));
  }

  // ---------------------------------------------------------------- Sites that always open: never blocked on this phone, by anything
  function trustSheet() {
    sheet(T('Sites that always open'), (sh, close) => {
      el('p', 'muted', sh, T('Blokvane never blocks these sites on this phone, not even their ads. Add a site here if it does not open while ad blocking is on.'));
      let list = S.prefs.trusted.slice();
      const tl = el('div', 'chips', sh);
      const draw2 = () => {
        tl.textContent = '';
        for (const s of list) { const c = el('button', 'chip', tl); c.type = 'button'; const b = el('bdi', '', c, s); b.dir = 'ltr'; c.appendChild(icon('x')); c.setAttribute('aria-label', T('Remove') + ' ' + s); c.onclick = () => { list = list.filter(x => x !== s); draw2(); }; }
        tl.hidden = !list.length;
      };
      draw2();
      const tr = el('div', 'copy', sh); tr.style.borderStyle = 'solid';
      const ti = el('input', '', tr); ti.placeholder = 'example.com'; ti.autocapitalize = 'none'; ti.spellcheck = false; ti.dir = 'ltr'; ti.inputMode = 'url'; ti.setAttribute('aria-label', T('A site that always opens'));
      ti.style.cssText = 'flex:1;min-width:0;border:0;background:none;font-size:16px;padding:8px 0;outline:none';
      const add = () => {
        const s = ti.value.trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, '').split(/[/?#]/)[0].replace(/^www\./, '').replace(/:\d+$/, '');
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(s)) { toast(T('Type a site like example.com.')); return false; }
        if (!list.includes(s)) list.push(s);
        ti.value = ''; draw2(); return true;
      };
      btn(T('Add'), { cls: 'sm', icon: 'plus' }, tr, add);
      ti.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      const st = el('div', 'stack', sh); st.style.marginTop = '14px';
      btn(T('Save'), { kind: 'go', icon: 'check' }, st, async () => {
        // (a site typed and not added yet counts too)
        if (ti.value.trim() && !add()) return;
        const r = await ask('/v1/phone/prefs', { countries: S.prefs.countries, trusted: list });
        if (!r.ok) { toast(why(r), 'bad'); return; }
        S.prefs = { countries: r.data.countries || [], trusted: r.data.trusted || [] };
        draft = null;
        toast(T('Saved. It works from now on.'), 'ok'); close(); draw();
      });
    });
  }

  // ---------------------------------------------------------------- Strict blocking: also the names phones leave open on purpose
  // (the server keeps it for this phone: POST /v1/phone/strict. Sites that always open still open with it on.)
  // websites this phone's owner does not want it to open (the whole list is saved each time)
  function sitesSheet() {
    sheet(T('Websites this phone cannot open'), (sh, close) => {
      el('p', 'muted', sh, T('This phone cannot open these websites, in any app or browser, while ad blocking is on. Each one is blocked with everything under it.'));
      let list = (S.blocked || []).slice();
      const tl = el('div', 'chips', sh);
      const draw2 = () => {
        tl.textContent = '';
        for (const s of list) { const c = el('button', 'chip', tl); c.type = 'button'; const b = el('bdi', '', c, s); b.dir = 'ltr'; c.appendChild(icon('x')); c.setAttribute('aria-label', T('Remove') + ' ' + s); c.onclick = () => { list = list.filter(x => x !== s); draw2(); }; }
        tl.hidden = !list.length;
      };
      draw2();
      const tr = el('div', 'copy', sh); tr.style.borderStyle = 'solid';
      const ti = el('input', '', tr); ti.placeholder = 'example.com'; ti.autocapitalize = 'none'; ti.spellcheck = false; ti.dir = 'ltr'; ti.inputMode = 'url'; ti.setAttribute('aria-label', T('A website to block'));
      ti.style.cssText = 'flex:1;min-width:0;border:0;background:none;font-size:16px;padding:8px 0;outline:none';
      const add = () => {
        const s = ti.value.trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, '').split(/[/?#]/)[0].replace(/^www\./, '').replace(/:\d+$/, '');
        if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(s)) { toast(T('Type a site like example.com.')); return false; }
        if (!list.includes(s)) list.push(s);
        ti.value = ''; draw2(); return true;
      };
      btn(T('Add'), { cls: 'sm', icon: 'plus' }, tr, add);
      ti.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
      el('p', 'muted small', sh, T('A site that is also under "A site does not open?" stays open: that list wins.')).style.marginTop = '10px';
      const st = el('div', 'stack', sh); st.style.marginTop = '14px';
      btn(T('Save'), { kind: 'go', icon: 'check' }, st, async () => {
        if (ti.value.trim() && !add()) return;
        const r = await ask('/v1/phone/sites', { blocked: list });
        if (!r.ok) { toast(why(r), 'bad'); return; }
        S.blocked = r.data.blocked || [];
        toast(T('Saved. It works from now on.'), 'ok'); close(); draw();
      });
    });
  }
  // ---------------------------------------------------------------- Ads from Meta inside games and apps
  // Meta sells the ads many games and apps show. A game gets them from addresses of Facebook's own: an older kit at
  // the very name the Facebook app itself talks to (graph.facebook.com), a newer one at addresses Meta made for its
  // kits. So a phone leaves them open. Its owner can switch this on for one phone. It is kept as graph.facebook.com
  // among the websites this phone cannot open (POST /v1/phone/sites), so nothing new is kept anywhere, and it shows
  // in that list too. With that name in the list the server is smart about Meta's ad addresses (dns.py,
  // meta_closed): they are closed while a game or another app is the one asking, and open while one of Meta's own
  // apps is in use or somebody logs in with Facebook.
  const META = 'graph.facebook.com';
  const metaOn = () => (S.blocked || []).includes(META);
  function metaSheet() {
    sheet(T('Ads from Meta in games'), (sh, close) => {
      el('p', '', sh, T('Many games and apps show ads that Meta sells. Meta is the company behind Facebook.'));
      el('p', '', sh, T('A game gets those ads from addresses of Facebook. One of them is the address the Facebook app itself talks to. Blocking it stops the Facebook app too, so Blokvane leaves them open.'));
      el('p', '', sh, T('Turn this on and Blokvane closes them on this phone while a game or another app is the one asking. They open again while you use Facebook, Messenger or Instagram, and when you log in with Facebook.'));
      el('p', 'muted', sh, T('Good to know:'));
      bullets(sh, [
        T('A few ads from Meta can still get through, mostly in the first minutes after you used Facebook, Messenger or Instagram.'),
        T('A reward for watching an ad from Meta is not given, because the ad does not load.'),
        T('If Facebook, or a game, app or website that logs in with Facebook, ever acts up, turn this off. Everything is back at once.')
      ]);
      el('p', 'muted', sh, T('Blokvane already blocks the servers of the other big ad companies, with this on or off.'));
      el('p', 'muted', sh, T('A game can keep showing ads it downloaded earlier for a while.'));
      el('p', 'muted', sh, T('You will also see graph.facebook.com under Block a website. That is this switch.'));
      el('p', 'muted small', sh, T('To tell them apart, Blokvane remembers for up to 15 minutes when this phone last asked for Facebook itself and when an ad server was last blocked. Only those two times, never a list of what you open.'));
      const st = el('div', 'stack', sh); st.style.marginTop = '14px';
      const on = metaOn();
      btn(on ? T('Stop blocking ads from Meta') : T('Block ads from Meta on this phone'), on ? { icon: 'off' } : { kind: 'go', icon: 'game' }, st, async () => {
        // (the whole list is saved each time, like under Block a website)
        const list = (S.blocked || []).filter(x => x !== META);
        if (!on) list.push(META);
        const r = await ask('/v1/phone/sites', { blocked: list });
        if (!r.ok) { toast(why(r), 'bad'); return; }
        S.blocked = r.data.blocked || [];
        toast(metaOn() ? T('Ads from Meta are blocked on this phone. It works from now on.') : T('Ads from Meta are open again on this phone.'), 'ok'); close(); draw();
      });
    });
  }
  function strictSheet() {
    sheet(T('Strict blocking'), (sh, close) => {
      el('p', '', sh, T('A phone blocks by name. A few names are left open on purpose, because things people use come from them too.'));
      el('p', '', sh, T('Strict blocking stops them as well, on this phone only. The Ad Blocker Test then passes them.'));
      el('p', 'muted', sh, T('With Strict blocking on, these can stop working on this phone:'));
      bullets(sh, [
        T('The Instagram and Facebook apps, and Log in with Facebook'),
        T('Some videos and online radio, and YouTube remembering what you watched'),
        T('Links in emails (even Reset password) and links to shops in articles'),
        T('Notifications and settings in some apps')
      ]);
      el('p', 'muted', sh, T('If something you need stops, add its site under A site does not open?, or turn Strict blocking off.'));
      el('p', 'muted', sh, T('It does not remove the ads inside YouTube: they come from the same servers as the videos.'));
      const st = el('div', 'stack', sh); st.style.marginTop = '14px';
      const on = !!S.strict;
      btn(on ? T('Turn Strict blocking off') : T('Turn Strict blocking on'), on ? { icon: 'off' } : { kind: 'go', icon: 'lock' }, st, async () => {
        const r = await ask('/v1/phone/strict', { on: !on });
        if (!r.ok) { toast(why(r), 'bad'); return; }
        S.strict = r.data.strict === true;
        toast(S.strict ? T('Strict blocking is on. It works from now on.') : T('Strict blocking is off.'), 'ok'); close(); draw();
      });
    });
  }

  // ---------------------------------------------------------------- Countries: where this phone does not go
  let draft = null;        // what is being changed and not saved yet: { cc: Set, trusted: [] }
  const flag = cc => { try { return String.fromCodePoint(...cc.toUpperCase().split('').map(c => 127397 + c.charCodeAt(0))); } catch (e) { return ''; } };
  function countryNames() {
    let dn = null;
    try { dn = new Intl.DisplayNames([lang], { type: 'region' }); } catch (e) {}
    const out = [];
    for (const cc of (S.countries || [])) {
      let n = '';
      try { n = dn ? dn.of(cc) : ''; } catch (e) {}
      if (n && n !== cc) out.push([cc, n]);
    }
    try { out.sort((a, b) => a[1].localeCompare(b[1], lang)); } catch (e) { out.sort((a, b) => (a[1] < b[1] ? -1 : 1)); }
    return out;
  }
  function countries(v) {
    el('div', 'eyebrow', v, T('Countries'));
    const ph = phase();
    if (ph !== 'on' && ph !== 'finish') {
      draft = null;
      return gate(v, T('Keep countries *out.*'), ph === 'desktop' ? T('Open this app on your phone to pick countries.') : ph === 'soon' ? T('Ad blocking for Android phones is almost ready.')
        : ph === 'old' ? T('Ad blocking needs iOS 14 or newer on this device.')
        : T('Pick countries this phone should not reach. It works once ad blocking is on for this phone.'));
    }
    if (!draft) draft = { cc: new Set(S.prefs.countries), trusted: S.prefs.trusted.slice() };
    const names = countryNames(), nameOf = {};
    for (const [cc, n] of names) nameOf[cc] = n;
    headline(v, T('Keep countries *out.*'));
    el('p', 'lede', v, T('Sites and apps whose servers are in a country you pick do not open on this phone.'));
    const chips = el('div', 'chips', v);
    const save = el('div', 'stack', v); save.hidden = true;
    const dirty = () => {
      const a = Array.from(draft.cc).sort().join(','), b = S.prefs.countries.slice().sort().join(',');
      save.hidden = a === b && draft.trusted.join('\n') === S.prefs.trusted.join('\n');
    };
    const drawChips = () => {
      chips.textContent = '';
      for (const cc of Array.from(draft.cc).sort((a, b) => String(nameOf[a] || a).localeCompare(String(nameOf[b] || b)))) {
        const c = el('button', 'chip', chips); c.type = 'button';
        el('span', '', c, flag(cc) + ' ' + (nameOf[cc] || cc));
        c.appendChild(icon('x'));
        c.setAttribute('aria-label', T('Remove') + ' ' + (nameOf[cc] || cc));
        c.onclick = () => { draft.cc.delete(cc); const i = document.getElementById('cc-' + cc); if (i) i.checked = false; drawChips(); dirty(); };
      }
      chips.hidden = !draft.cc.size;
    };
    btn(T('Save'), { kind: 'go', icon: 'check' }, save, async () => {
      const r = await ask('/v1/phone/prefs', { countries: Array.from(draft.cc), trusted: draft.trusted });
      if (!r.ok) { toast(why(r), 'bad'); return; }
      S.prefs = { countries: r.data.countries || [], trusted: r.data.trusted || [] };
      draft = null;
      toast(T('Saved. It works from now on.'), 'ok'); draw();
    });
    btn(T('Undo my changes'), {}, save, () => { draft = null; draw(); });
    // sites that always open
    const tc = el('div', 'card soft', v);
    el('h3', '', tc, T('Sites that always open'));
    el('p', 'muted small', tc, T('A site you trust always opens on this phone: whatever country its server is in, and even when Blokvane would block it.'));
    const tl = el('div', 'chips', tc);
    const drawTrusted = () => {
      tl.textContent = '';
      for (const s of draft.trusted) { const c = el('button', 'chip', tl); c.type = 'button'; const b = el('bdi', '', c, s); b.dir = 'ltr'; c.appendChild(icon('x')); c.setAttribute('aria-label', T('Remove') + ' ' + s); c.onclick = () => { draft.trusted = draft.trusted.filter(x => x !== s); drawTrusted(); dirty(); }; }
      tl.hidden = !draft.trusted.length;
    };
    const tr = el('div', 'copy', tc); tr.style.borderStyle = 'solid';
    const ti = el('input', '', tr); ti.placeholder = 'example.com'; ti.autocapitalize = 'none'; ti.spellcheck = false; ti.dir = 'ltr'; ti.inputMode = 'url'; ti.setAttribute('aria-label', T('A site that always opens'));
    ti.style.cssText = 'flex:1;min-width:0;border:0;background:none;font-size:16px;padding:8px 0;outline:none';
    const add = () => {
      let s = ti.value.trim().toLowerCase().replace(/^[a-z][a-z0-9+.-]*:\/\//, '').split(/[/?#]/)[0].replace(/^www\./, '').replace(/:\d+$/, '');
      if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(s)) { toast(T('Type a site like example.com.')); return; }
      if (!draft.trusted.includes(s)) draft.trusted.push(s);
      ti.value = ''; drawTrusted(); dirty();
    };
    btn(T('Add'), { cls: 'sm', icon: 'plus' }, tr, add);
    ti.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(); } });
    // the list
    el('div', 'sec', v, T('All countries'));
    const sr = el('div', 'copy', v); sr.style.borderStyle = 'solid';
    sr.appendChild(icon('search'));
    const si = el('input', '', sr); si.type = 'search'; si.placeholder = T('Find a country'); si.setAttribute('aria-label', T('Find a country'));
    si.style.cssText = 'flex:1;min-width:0;border:0;background:none;font-size:16px;padding:8px 0;outline:none';
    const ls = el('div', 'list', v);
    const rows = [];
    for (const [cc, n] of names) {
      const it = el('label', 'item', ls);
      el('span', 'flag', it, flag(cc));
      el('span', 't', it).appendChild(el('b', '', null, n));
      const sw = el('span', 'sw', it);
      const i = el('input', '', sw); i.type = 'checkbox'; i.id = 'cc-' + cc; i.checked = draft.cc.has(cc);
      el('i', '', sw);
      i.onchange = () => { if (i.checked) draft.cc.add(cc); else draft.cc.delete(cc); drawChips(); dirty(); };
      rows.push([it, n.toLowerCase(), cc.toLowerCase()]);
    }
    si.oninput = () => { const q = si.value.trim().toLowerCase(); for (const [it, n, cc] of rows) it.hidden = !!q && !n.includes(q) && cc !== q; };
    el('p', 'note', v, T('How it decides: by a site\'s ending (like ".ru") and by the country its server is in. Big sites use servers in many countries, so this is close, not exact. If an app you need stops working, take its country out again, or add the site to "Sites that always open". Blocking a country with many servers, like the United States, breaks a lot.'));
    drawChips(); drawTrusted(); dirty();
  }

  // ---------------------------------------------------------------- More: the account, the other apps, help
  function shareApp() {
    const text = T('I block ads with Blokvane. Take a look:'), url = SITE + '/';
    if (navigator.share) navigator.share({ title: 'Blokvane', text, url }).catch(() => {});
    else copy(url, T('The address of blokvane.com is copied. Paste it to your friend.'));
  }
  function qrSheet(title, url, text) {
    sheet(title, sh => {
      if (text) el('p', 'muted', sh, text);
      qr(el('div', 'qr', sh), url);
      el('p', 'addr', sh, url.replace(/^https?:\/\//, ''));
      const st = el('div', 'stack', sh); st.style.marginTop = '14px';
      btn(T('Copy the address'), { icon: 'copy' }, st, () => copy(url));
    });
  }
  function langSheet() {
    sheet(T('Language'), (sh, close) => {
      const ls = el('div', 'list', sh);
      for (const [code, name] of LANGS) {
        const it = el('button', 'item', ls); it.type = 'button'; it.lang = code;
        el('span', 't', it).appendChild(el('b', '', null, name));
        if (code === lang) it.appendChild(icon('check'));
        it.onclick = async () => { own.set('lang', code); await setLang(code); close(); labMade = false; labEl.textContent = ''; draw(); };
      }
    });
  }
  // the look: Auto (like this phone), Light or Dark. theme.js keeps it on this phone; BV Remote and BV Games follow it too
  const lookNow = () => (window.BVTHEME ? BVTHEME.get() : 'auto');
  function barLook() {
    const dark = lookNow() === 'dark' || (lookNow() === 'auto' && !(window.BVTHEME && BVTHEME.phoneLight()));
    for (const m of document.querySelectorAll('meta[name="theme-color"]')) { m.removeAttribute('media'); m.content = dark ? '#15120e' : '#f5efe3'; }
  }
  function lookSheet() {
    sheet(T('Look'), sh => {
      const note = el('p', 'muted', sh);
      const row3 = el('div', 'looks', sh);
      const paint = () => {
        note.textContent = lookNow() === 'auto' ? T('Auto matches this phone: light when the phone is light, dark when it is dark.') : T('It stays like this on this phone, whatever the phone is set to.');
        for (const b of row3.children) b.setAttribute('aria-pressed', String(b.dataset.t === lookNow()));
      };
      for (const [t, name] of [['auto', T('Auto')], ['light', T('Light')], ['dark', T('Dark')]]) {
        const b = el('button', 'look look-' + t, row3); b.type = 'button'; b.dataset.t = t;
        el('i', '', b); el('b', '', b, name);
        b.onclick = () => { if (window.BVTHEME) BVTHEME.set(t); barLook(); paint(); labMade = false; labEl.textContent = ''; draw(); };
      }
      paint();
    });
  }
  function goodToKnow() {
    sheet(T('Good to know'), sh => {
      limits(sh, true);
      el('h3', '', sh, T('Before you rely on it')).style.marginTop = '16px';
      bullets(sh, [
        T('It is one setting on the phone, not an app that runs: it uses no battery of its own.'),
        T('A VPN app, or "iCloud Private Relay" on an iPhone, can send lookups past Blokvane. Then less is blocked while that is on.'),
        T('Some Wi-Fi networks with a sign-in page (hotels, planes) need it switched off for a moment to sign in.'),
        T('The profile is "Not Signed" because it comes from Blokvane and not from a company\'s device management. It holds one thing: the address this phone sends its lookups to.'),
        T('A work or school phone that is managed by an organization may not allow the profile.'),
        T('Sign-in lasts until you sign out. If the app is not opened for over a year, it asks again.')
      ]);
    });
  }
  function more(v) {
    const a = acct(), ph = phase();
    el('div', 'eyebrow', v, T('More'));
    headline(v, T('Everything *else.*'));
    // the account
    el('div', 'sec', v, T('Account'));
    let ls = el('div', 'list', v);
    if (!a) row(ls, 'key', T('Sign in'), T('With your email and a code. No password.'), () => signIn());
    else {
      const it = el('div', 'item plain', ls);
      it.appendChild(icon('mail'));
      const t = el('span', 't', it);
      mail(el('b', '', t), a.email);
      el('small', '', t, T('Signed in on this phone'));
      if (S) {
        const L = S.license, F = S.free_day;
        row(ls, 'shield', L.on ? T('This phone is on a license') : F.on ? T('Free day: {left} left', { left: leftText(F.ends - now()) }) : T('This phone has no license'),
          L.on ? (L.source === 'org' ? T('From {name}', { name: L.from }) : L.source === 'given' ? T('Given to you by {name}', { name: L.from }) : L.source === 'gift' ? T('A gift from Blokvane') : T('Your own license'))
            : L.total > 0 ? T('{used} of {total} licenses in use', { used: num(L.in_use), total: num(L.total) }) : T('No license on this email yet'), L.total > 0 ? devicesSheet : () => licenseSheet());
        row(ls, 'heart', L.has_own ? T('Your plan on blokvane.com') : T('Get a license'), L.has_own ? T('Change it, cancel it, see your invoices') : T('Keeps ads blocked on this phone'), () => licenseSheet(L.has_own ? 'account' : ''));
      }
      row(ls, 'out', T('Sign out'), '', signOutSheet);
    }
    // ad blocking on this phone
    if (S && S.dns.on) {
      el('div', 'sec', v, T('Ad blocking'));
      ls = el('div', 'list', v);
      if (ph === 'on' || ph === 'finish') {
        const d = el('div', 'item plain', ls); d.style.display = 'block';
        const det = el('details', 'more', d); det.style.cssText = 'border:0;margin:0;padding:0';
        el('summary', '', det, T('Show the steps again'));
        setup(det);
      }
      row(ls, 'off', T('Switch it off and remove it'), T('Two steps on the phone, then it is as it was before'), offSheet);
    }
    // the other apps
    el('div', 'sec', v, T("Blokvane's other apps"));
    ls = el('div', 'list', v);
    // (an app that is not on this phone yet says "Get": one tap leads to its page, which adds it to the home screen)
    const appRow = (k, img, name, sub, file) => {
      const have = plat() === 'desktop' || haveApp(k);
      const it = row(ls, img, name, have && plat() !== 'desktop' ? T('On this phone') : sub, null, !window.BVAPPS ? HERE + file : have ? BVAPPS.openUrl(k) : BVAPPS.getUrl(k));
      if (!have) { const c = it.querySelector('.chev'); if (c) c.remove(); const g = el('span', 'get-pill', it); g.appendChild(icon('addbox')); el('span', '', g, T('Get')); }
    };
    appRow('remote', 'icon-192.png', 'BV Remote', T('Your phone as the remote for your computer and TV: slides, videos, sending things'), 'index.html');
    appRow('games', 'games-192.png', 'BV Games', T('Party games on the TV, with every phone as a controller'), 'games.html');
    row(ls, 'laptop', T('Blokvane for your computer'), T('The ad blocker for Chrome and Edge. It takes the ads out of YouTube too.'), null, SITE + '/download');
    // sharing and the app itself
    el('div', 'sec', v, T('This app'));
    ls = el('div', 'list', v);
    row(ls, 'share', T('Tell a friend about Blokvane'), T('Sends the address of blokvane.com'), shareApp);
    row(ls, 'hex', T('Show this app to someone next to you'), T('A code their phone can scan'), () => qrSheet(T('Scan to get this app'), APP_URL, T('Point the other phone\'s camera at the code. The app opens in its browser.')));
    if (plat() !== 'desktop' && !(window.BVAPPS && BVAPPS.inApp())) row(ls, 'addbox', T('Add this app to your home screen'), T('It opens like any app, with its own icon'), installApp);
    row(ls, 'look', T('Look'), { auto: T('Auto'), light: T('Light'), dark: T('Dark') }[lookNow()], lookSheet);
    row(ls, 'globe', T('Language'), (LANGS.find(l => l[0] === lang) || LANGS[0])[1], langSheet);
    row(ls, 'info', T('Good to know'), T('What it can do, what it cannot, and a few warnings'), goodToKnow);
    // help
    el('div', 'sec', v, T('Help'));
    ls = el('div', 'list', v);
    row(ls, 'info', T('Questions and answers'), '', null, SITE + '/faq');
    row(ls, 'mail', T('Write to Blokvane'), 'support@blokvane.com', null, 'mailto:support@blokvane.com');
    row(ls, 'lock', T('Privacy'), T('What Blokvane keeps, and what it never does'), null, SITE + '/privacy');
    const f = el('p', 'foot', v);
    f.textContent = 'Blokvane Ad Blocker · ' + V;
  }

  // ---------------------------------------------------------------- the frame of the app: the top, the page, the menu
  const TABS = [['home', 'shield', 'Shield'], ['test', 'hex', 'Test'], ['stats', 'chart', 'Numbers'], ['countries', 'globe', 'Countries'], ['more', 'dots', 'More']];
  T('Shield'); T('Test'); T('Numbers'); T('Countries'); T('More');
  function go(t) { if (t === tab) { draw(); try { scrollTo(0, 0); } catch (e) {} return; } location.hash = t === 'home' ? '' : '#' + t; }
  function readHash() { const h = location.hash.replace(/^#/, '').split(/[.?&]/)[0]; tab = TABS.some(t => t[0] === h) ? h : 'home'; }
  // The four parts of the page are made once and stay: the top, the page itself, the test's own part (so its frame
  // is loaded one time only, and a test that is running keeps running while you look at another page), and the menu.
  root.textContent = '';
  const topEl = el('header', 'top', root), viewEl = el('main', '', root), labEl = el('section', '', root), navEl = el('nav', 'tabs', root);
  labEl.hidden = true;
  let drawn = '';
  function draw() {
    const keepScroll = drawn === tab ? scrollY : 0;
    if (heldT) { clearInterval(heldT); heldT = 0; }
    // (typing is never thrown away: a page with a text box in use is left alone until the next tap)
    const act = document.activeElement;
    if (drawn === tab && act && /^(INPUT|TEXTAREA)$/.test(act.tagName) && viewEl.contains(act) && act.value) return;
    shown = sig();
    topEl.textContent = '';
    const im = el('img', '', topEl); im.src = 'ads-192.png'; im.alt = '';
    const br = el('div', 'brand', topEl); br.append('Blokvane '); el('span', '', br, 'Ad Blocker');
    const a = acct();
    if (a) { const w = el('button', 'who', topEl, (a.email[0] || '?')); w.type = 'button'; w.setAttribute('aria-label', T('Account')); w.onclick = () => go('more'); }
    else if (plat() !== 'desktop') { const w = el('button', 'who txt', topEl, T('Sign in')); w.type = 'button'; w.onclick = () => signIn(); }
    viewEl.textContent = '';
    labEl.hidden = tab !== 'test';
    if (tab === 'home') home(viewEl); else if (tab === 'test') test(viewEl); else if (tab === 'stats') stats(viewEl); else if (tab === 'countries') countries(viewEl); else more(viewEl);
    navEl.textContent = '';
    navEl.setAttribute('aria-label', T('Menu'));
    const nd = el('div', '', navEl);
    for (const [id, ic, name] of TABS) {
      const b = el('button', '', nd); b.type = 'button';
      b.appendChild(icon(ic)); el('span', '', b, T(name));
      if (id === tab) b.setAttribute('aria-current', 'page');
      b.onclick = () => go(id);
    }
    if (keepScroll) scrollTo(0, keepScroll);
    drawn = tab;
  }
  addEventListener('hashchange', () => { if (closeSheet) { const c = closeSheet; closeSheet = null; c(true); } readHash(); drawn = ''; draw(); scrollTo(0, 0); });
  // back in the app (from Settings, or from blokvane.com): look again
  document.addEventListener('visibilitychange', () => { if (!document.hidden && acct() && Date.now() - loadedAt > 4000) { lastProbe = 0; refresh(); if (S && S.dns && S.dns.on && Date.now() - liveAt > 20000) verify(1).then(got => { if ((got === 'yes') !== (phase() === 'on') || got !== 'yes') draw(); }); } });
  addEventListener('pageshow', e => { if (e.persisted && acct()) refresh(); });

  // ---------------------------------------------------------------- start
  (async () => {
    await setLang(pickLang());
    readHash();
    draw();
    try { if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
    infoFresh().then(changed => { if (changed && !acct()) draw(); });
    if (lookNow() !== 'auto') barLook();
    if (window.BVAPPS) {
      BVAPPS.onchange(() => { if (tab === 'more' && !closeSheet) draw(); });
      // (came here from "Get" in another app or on blokvane.com: straight to adding it)
      if (BVAPPS.wantsGet()) setTimeout(() => { if (BVAPPS.inApp()) toast(T('This app is on your home screen already.'), 'ok'); else if (plat() !== 'desktop') installApp(); }, 400);
    }
    if (acct()) { await load(); firstProbe(); }
    watch();
    // (the free day's clock, and "asked Blokvane 3 minutes ago", stay true while the page is open)
    setInterval(() => { if (!document.hidden && !closeSheet && (tab === 'home' || tab === 'more') && S && !viewEl.querySelector('details[open]') && !(tab === 'home' && pausedNow())) draw(); }, 60000);
  })();
})();
