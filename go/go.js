// Blokvane on your phone (https://app.blokvane.com/go/). One page for everything a phone does with
// Blokvane: be the remote for your computer and TV screens, send files and links, share the clipboard, answer Kid mode
// requests, find a lost computer, unlock KeyVane, join a party game or a poll, and block ads on the phone itself.
// Only two things need a sign-in (an email and the code sent to it: pass.js): hosting a party game, and putting this
// phone on a Blokvane license (m/shield.js). Everything else works with no account at all.
// What to do is after the # in the address (browsers never send that part to any website): "c1" is your paired
// computer, "p1" pairs one, and each other kind (a poll, a game, a camera for a slide...) has its own. Messages go
// through free public relays, sealed and signed on the devices so nobody in between can read them (live-kit.js); big
// things go straight between the two devices. A party game also uses Blokvane's own relay, which is quicker.
// The parts for each kind live in m/*.js and load only when needed, so the page opens fast.
(() => {
  'use strict';
  const L = BVLIVE, C = BVWT_CORE;
  const VERSION = '47';
  const $ = id => document.getElementById(id);
  const app = $('app');

  // ---------- small helpers ----------
  // (a page in another language, like a party game in Spanish, says these few shared words its way: GO.say)
  const say = t => { try { return window.GO && typeof GO.say === 'function' ? GO.say(t) : t; } catch (e) { return t; } };
  function el(tag, cls, parent, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const P = {
    back: 'M15 5l-7 7 7 7', play: 'M8 5.5v13l11-6.5z', pause: 'M8 5h3v14H8zM13 5h3v14h-3z', prev: 'M7 6v12M18 6l-8 6 8 6z', next: 'M17 6v12M6 6l8 6-8 6z',
    back10: 'M11 6L5 12l6 6M19 6l-6 6 6 6', fwd10: 'M13 6l6 6-6 6M5 6l6 6-6 6', volUp: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
    volDown: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM15.5 9a4 4 0 0 1 0 6', mute: 'M4 9.5h3.5L12 6v12l-4.5-3.5H4zM16 9.5l5 5M21 9.5l-5 5', skip: 'M5 6l7 6-7 6zM12 6l7 6-7 6',
    remote: 'M8 2.5h8a2 2 0 0 1 2 2v15a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-15a2 2 0 0 1 2-2zM12 7.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM9.5 15h.01M14.5 15h.01M9.5 18h.01M14.5 18h.01',
    slides: 'M3 4.5h18v11H3zM8 20l4-4.5 4 4.5M12 15.5V20', send: 'M4 12l16-8-6 16-2.5-6.5z', clip: 'M9 4h6v3H9zM7 5.5H5.5v15h13v-15H17M9 12h6M9 16h4',
    kid: 'M12 4.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM6 20.5c.5-4 3-6 6-6s5.5 2 6 6', lock: 'M6 11h12v9.5H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3', shield: 'M12 3l7.5 3v5.5c0 4.5-3.2 8-7.5 9.5-4.3-1.5-7.5-5-7.5-9.5V6z',
    key: 'M14.5 4a5.5 5.5 0 1 1-4.9 8L4 17.5V20h2.5l1-1H9v-1.5h1.5L12 16v-1a5.5 5.5 0 0 1 2.5-11zM16 8h.01', camera: 'M4 8h3l1.8-2.5h6.4L17 8h3v11H4zM12 10.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
    tv: 'M3 5h18v12H3zM8 21h8M12 17v4', board: 'M4 4h16v13H4zM8 21l4-4 4 4M8 9h8M8 12.5h5', monitor: 'M12 4c4.5 0 8.5 3 9.5 8-1 5-5 8-9.5 8s-8.5-3-9.5-8c1-5 5-8 9.5-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    sign: 'M3 17c3-1 4-6 6-6s1 5 3 5 2-3 4-3 2 2 5 2M3 21h18', upload: 'M12 16V4M7 9l5-5 5 5M4 16v4h16v-4', link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
    file: 'M6 3h8l4 4v14H6zM14 3v4h4', photo: 'M4 5h16v14H4zM4 16l5-5 4 4 2.5-2.5L20 17M15.5 9.5h.01', bell: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0',
    check: 'M5 12.5l4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6L6 18', heart: 'M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14',
    game: 'M7 8h10a4 4 0 0 1 4 4v1.5a3 3 0 0 1-5.5 1.6L14 13h-4l-1.5 2.1A3 3 0 0 1 3 13.5V12a4 4 0 0 1 4-4zM8 10.5v3M6.5 12h3M16 11.5h.01M17.5 13h.01',
    poll: 'M5 20V11M10 20V5M15 20v-6M20 20V9', queue: 'M5 6h14M5 12h14M5 18h9', help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5h.01',
    gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM19 12l2-1.5-2-3.5-2.4.8a7 7 0 0 0-1.6-.9L14.5 4h-5L9 6.9a7 7 0 0 0-1.6.9L5 7l-2 3.5L5 12l-2 1.5L5 17l2.4-.8c.5.4 1 .7 1.6.9l.5 2.9h5l.5-2.9c.6-.2 1.1-.5 1.6-.9L19 17l2-3.5z',
    refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6', phone: 'M8 2.5h8v19H8zM11 18.5h2', laptop: 'M5 5h14v10H5zM2.5 19h19', eye: 'M2.5 12C4.5 7.5 8 5.5 12 5.5s7.5 2 9.5 6.5c-2 4.5-5.5 6.5-9.5 6.5S4.5 16.5 2.5 12zM12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
    sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z', trash: 'M5 7h14M9 7V4.5h6V7M7 7l1 13h8l1-13', copy: 'M8 8h11v12H8zM5 16V4h11',
    cast: 'M3 16a5 5 0 0 1 5 5M3 12a9 9 0 0 1 9 9M3 8V5h18v14h-6', full: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5', home: 'M4 11l8-7 8 7v9h-5.5v-6h-5v6H4z', moon: 'M19 14.5A7.5 7.5 0 0 1 9.5 5 7.5 7.5 0 1 0 19 14.5z',
    wifi: 'M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01', globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9S9.5 5.5 12 3z',
    clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2', mic: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21', star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z',
    scroll: 'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4', draw: 'M4 20l4-1 11-11-3-3L5 16zM14 6l3 3',
    chev: 'M9 5l7 7-7 7', share: 'M12 15V3M7.5 7.5L12 3l4.5 4.5M6 11H4.5v10h15V11H18', dots: 'M12 5h.01M12 12h.01M12 19h.01', addbox: 'M5 4h14v16H5zM12 8.5v7M8.5 12h7', ghost: 'M12 3a7 7 0 0 1 7 7v10l-2.3-1.7L14.3 20 12 18.3 9.7 20l-2.4-1.7L5 20V10a7 7 0 0 1 7-7zM9.5 10h.01M14.5 10h.01'
  };
  function icon(name, cls) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round'); s.setAttribute('aria-hidden', 'true');
    if (cls) s.setAttribute('class', cls);
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', P[name] || P.sparkle);
    if (name === 'play') { p.setAttribute('fill', 'currentColor'); }
    s.appendChild(p);
    return s;
  }
  // Boo, Blokvane's ghost: the very one on Blokvane's icon (a plain white ghost with a round head, three round feet
  // and two dark eyes; no outline, no mouth). Drawn here, so it shows even before anything else loads. The party
  // games' Boo below is the same ghost with a face for the moment.
  const BOO_SVG = '<svg viewBox="4 -1 52 54" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M14 22C14 3 46 3 46 22V46.8Q46 50 42.5 50Q39 50 39 46.8A3.25 2.8 0 0 0 32.5 46.8Q32.5 50 29.25 50Q26 50 26 46.8A2.75 2.8 0 0 0 20.5 46.8Q20.5 50 17.25 50Q14 50 14 46.8Z" fill="#fff"/>' +
    '<ellipse class="eye" cx="23.6" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><ellipse class="eye" cx="35.4" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><circle cx="24.4" cy="22.6" r="1.2" fill="#fff"/><circle cx="36.2" cy="22.6" r="1.2" fill="#fff"/></svg>';
  function boo(cls) { const b = el('div', 'boo' + (cls ? ' ' + cls : '')); b.innerHTML = BOO_SVG; return b; }
  // Boo of Blokvane Games ("Silk waves"): a white ghost with rosy cheeks. face: 'smile' (the welcome), 'sad' (leaving, or a game that ended), 'plain' (the
  // app's icon) or 'sleepy' (something didn't work)
  const SW_EYES = '<ellipse cx="23.6" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><ellipse cx="35.4" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><circle cx="24.4" cy="22.6" r="1.2" fill="#fff"/><circle cx="36.2" cy="22.6" r="1.2" fill="#fff"/>';
  const SW_BOO = face => '<svg viewBox="10 0 40 52" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="sw-boo"><path d="M14 22C14 3 46 3 46 22V46.8Q46 50 42.5 50Q39 50 39 46.8A3.25 2.8 0 0 0 32.5 46.8Q32.5 50 29.25 50Q26 50 26 46.8A2.75 2.8 0 0 0 20.5 46.8Q20.5 50 17.25 50Q14 50 14 46.8Z" fill="#fff"/>' +
    (face === 'sleepy' ? '<path d="M21 24.5q2.6 1.6 5.2 0M32.8 24.5q2.6 1.6 5.2 0" stroke="#2a0f3a" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M27.4 32q2.6-1.4 5.2 0" stroke="#2a0f3a" stroke-width="1.4" fill="none" stroke-linecap="round"/>'
      : SW_EYES + (face === 'smile' ? '<path d="M27 31q3 2.4 6 0" stroke="#2a0f3a" stroke-width="1.5" fill="none" stroke-linecap="round"/>'
        : face === 'sad' ? '<path d="M27 33q3-2.4 6 0" stroke="#2a0f3a" stroke-width="1.5" fill="none" stroke-linecap="round"/>' : '')) +
    '<ellipse cx="19.5" cy="29" rx="2.4" ry="1.4" fill="#ff8aa0"/><ellipse cx="40.5" cy="29" rx="2.4" ry="1.4" fill="#ff8aa0"/></svg>';
  function swBoo(cls, face) { const b = el('div', 'boo sw' + (cls ? ' ' + cls : '')); b.innerHTML = SW_BOO(face || (cls === 'sleepy' ? 'sleepy' : 'smile')); return b; }
  // (the sky behind every Games page: drawn once, shown by go.css only with the games' look)
  function swSky() {
    if (document.querySelector('.sw-sky')) return;
    const sk = el('div', 'sw-sky');
    sk.setAttribute('aria-hidden', 'true');
    el('div', 'sw-blob a', sk); el('div', 'sw-blob b', sk);
    for (const w of ['w1', 'w2', 'w3', 'w4']) el('div', 'sw-wave ' + w, sk);
    document.body.insertBefore(sk, document.body.firstChild);
  }
  // (the phone's status bar in the page's colors: the Games look by day or by night, and the night on a game screen;
  // every other page keeps the color it starts with)
  function barColor() {
    const h = document.documentElement, night = h.classList.contains('pt-night');
    const day = night && !h.classList.contains('pt-dark') && h.classList.contains('bv-day');
    // (and the browser's own parts, like a field or a scroll bar, in the same colors: a game screen is always dark)
    if (h.getAttribute('data-games') === '1') {
      const cs = document.querySelector('meta[name="color-scheme"]');
      if (cs && cs.content !== (day ? 'light' : 'dark')) cs.content = day ? 'light' : 'dark';
    }
    for (const m of document.querySelectorAll('meta[name="theme-color"]')) {
      if (m.getAttribute('data-c0') == null) m.setAttribute('data-c0', m.content);
      // (BV Remote's own pages by day: its light paper)
      const want = !night ? (h.classList.contains('bv-day') && !h.hasAttribute('data-games') ? '#f4f6fb' : m.getAttribute('data-c0')) : day ? '#f3eeff' : '#1d1440';
      if (m.content !== want) m.content = want;
    }
  }
  // (theme.js changes html.bv-day when the look or the phone changes: the class change calls this too)
  try { new MutationObserver(barColor).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); } catch (e) {}

  let toastT = 0;
  function toast(text, tone) {
    let t = $('toast');
    if (!t) { t = el('div', 'toast', document.body); t.id = 'toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); }
    t.textContent = text;
    t.className = 'toast ' + (tone || '');
    void t.offsetWidth;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), tone === 'bad' ? 5000 : 2800);
  }
  // a little buzz (Android), or a quick flash of the screen where phones can't buzz from a page (iPhone)
  function buzz(kind) {
    const pat = kind === 'bad' ? [60, 60, 60] : kind === 'long' ? [400] : [18];
    let did = false;
    try { if (navigator.vibrate) did = navigator.vibrate(pat); } catch (e) {}
    if (!did && kind && kind !== 'tap') flash(kind === 'bad' ? '#ff6f7d' : kind === 'ok' ? '#36d6a5' : '#ffffff');
  }
  function flash(color) { const f = el('div', 'flash', document.body); f.style.background = color; setTimeout(() => f.remove(), 600); }
  function sheet(title, build, o = {}) {
    const bg = el('div', 'sheet-bg', document.body);
    const sh = el('div', 'sheet', bg);
    sh.setAttribute('role', 'dialog'); sh.setAttribute('aria-modal', 'true');
    el('div', 'grab', sh);
    if (title) el('h2', '', sh, title);
    const rec = { bg, locked: o.dismiss === false, close: null };
    const close = () => { const i = nav.sheets.indexOf(rec); if (i >= 0) nav.sheets.splice(i, 1); bg.remove(); if (o.onClose) o.onClose(); };
    rec.close = close;
    nav.sheets.push(rec);
    // (one step in the browser's history, so the phone's Back button closes the sheet instead of leaving the page)
    if (tapped() && !navBusy()) pushStep();
    bg.addEventListener('click', e => { if (e.target === bg && o.dismiss !== false) close(); });
    build(sh, close);
    return close;
  }
  function btn(text, o = {}, parent, onClick) {
    const b = el('button', 'btn' + (o.kind ? ' ' + o.kind : '') + (o.full ? ' full' : '') + (o.huge ? ' huge' : ''), parent);
    b.type = 'button';
    if (o.icon) b.appendChild(icon(o.icon));
    const s = el('span', '', b, text);
    if (o.sub) el('span', 'sub', s, o.sub);
    if (onClick) b.addEventListener('click', async e => {
      if (b.getAttribute('aria-busy') === 'true') return;
      b.setAttribute('aria-busy', 'true');
      try { await onClick(e); } catch (er) { toast(er && er.message ? er.message : say('That didn\'t work. Try again.'), 'bad'); } finally { b.removeAttribute('aria-busy'); }
    });
    return b;
  }
  function field(label, input, parent) { const f = el('label', 'field', parent); el('span', '', f, label); f.appendChild(input); return input; }
  function input(o = {}) {
    const i = el(o.multi ? 'textarea' : 'input', 'input');
    if (!o.multi) i.type = o.type || 'text';
    if (o.placeholder) i.placeholder = o.placeholder;
    if (o.max) i.maxLength = o.max;
    if (o.value != null) i.value = o.value;
    if (o.mode) i.inputMode = o.mode;
    i.autocomplete = 'off'; i.spellcheck = !!o.spell;
    return i;
  }
  function seg(options, value, onPick, parent) {
    const s = el('div', 'seg', parent);
    const set = v => { for (const b of s.children) b.setAttribute('aria-pressed', String(b.dataset.v === String(v))); };
    for (const [v, t] of options) { const b = el('button', '', s, t); b.type = 'button'; b.dataset.v = String(v); b.onclick = () => { set(v); onPick(v); }; }
    set(value);
    return { node: s, set };
  }
  function toggle(label, on, onChange, parent) {
    const row = el('label', 'switch', parent);
    el('span', '', row, label);
    const i = el('input', '', row);
    i.type = 'checkbox'; i.checked = !!on;
    i.onchange = () => onChange(i.checked);
    return i;
  }
  // What keeps this phone connected to your computers (the pairings, this phone's keys and name) is kept in two private
  // places on the phone (localStorage and IndexedDB): if one is cleared, the other brings it back. It is never put in a
  // cookie, because a cookie goes to the website's server with every visit; these never leave the phone.
  const KEEP = k => k === 'pairs' || k === 'name' || k.startsWith('me:');
  const idb = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      try { const r = indexedDB.open('blokvane-go', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
    }));
    const write = (fn) => open().then(db => new Promise(res => { const t = db.transaction('kv', 'readwrite'); fn(t.objectStore('kv')); t.oncomplete = () => res(true); t.onerror = t.onabort = () => res(false); })).catch(() => false);
    return {
      set: (k, v) => write(st => st.put(v, k)),
      del: k => write(st => st.delete(k)),
      all: () => open().then(db => new Promise(res => { const out = {}; const t = db.transaction('kv', 'readonly'); const c = t.objectStore('kv').openCursor(); c.onsuccess = () => { const x = c.result; if (x) { out[x.key] = x.value; x.continue(); } }; t.oncomplete = () => res(out); t.onerror = () => res(out); })).catch(() => ({}))
    };
  })();
  const store = {
    get(k, d) { try { const v = localStorage.getItem('bvgo:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('bvgo:' + k, JSON.stringify(v)); } catch (e) {} if (KEEP(k)) idb.set(k, v); },
    del(k) { try { localStorage.removeItem('bvgo:' + k); } catch (e) {} if (KEEP(k)) idb.del(k); }
  };
  // on opening: a phone whose first copy is gone gets it back from the second; one that has it makes sure the second
  // copy is there too (pairings made before this existed)
  async function keepConnected() {
    try {
      const have = pairsRaw();
      if (have.length) { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('bvgo:') && KEEP(k.slice(5))) idb.set(k.slice(5), JSON.parse(localStorage.getItem(k))); } return; }
      const all = await Promise.race([idb.all(), new Promise(r => setTimeout(() => r({}), 1500))]);
      if (!all || !Array.isArray(all.pairs) || !all.pairs.length) return;
      for (const [k, v] of Object.entries(all)) if (KEEP(k)) localStorage.setItem('bvgo:' + k, JSON.stringify(v));
    } catch (e) {}
  }
  const pairsRaw = () => { try { return JSON.parse(localStorage.getItem('bvgo:pairs') || '[]') || []; } catch (e) { return []; } };
  // (and the browser is asked to keep this page's storage even when the phone is low on space; Firefox would ask
  // the person with a pop-up, so it is skipped there)
  function askToKeep() { try { if (navigator.storage && navigator.storage.persist && !/Firefox\//.test(navigator.userAgent)) navigator.storage.persisted().then(p => { if (!p) navigator.storage.persist().catch(() => {}); }).catch(() => {}); } catch (e) {} }
  // a name for this phone, shown on the computer ("Sam's phone")
  function deviceName() {
    const n = store.get('name', '');
    if (n) return n;
    const ua = navigator.userAgent;
    return /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? ((/;\s*([^;)]+?)\s+Build/.exec(ua) || [])[1] || 'Android phone').slice(0, 30) : /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows computer' : 'Phone';
  }
  function plat() { const ua = navigator.userAgent; return /iPhone|iPad/.test(ua) ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop'; }

  // ---------- the phone's own Back button (and the back swipe) ----------
  // A browser only knows web pages: its Back leaves this page, and for an app on the home screen that closes the app.
  // So every step into the app (a page with an arrow at the top, an open sheet, another page of the app) is also one
  // step in the browser's history, made at the tap that opened it. Back takes that one step out again and the app
  // does what the arrow does: one page back, or the sheet closes. On the first page there is nothing to go back to,
  // so Back leaves, as it should. The arrow at the top goes the same way, so the two never disagree.
  // (During a party game m/party.js answers Back itself: it asks before leaving the game. GO.backBusy says when.)
  const nav = { idx: 0, hash: location.hash, title: '', backFn: null, back: null, wants: false, sheets: [], fresh: false, trav: false, answerAt: 0, popAt: 0 };
  // (every step the app has stood on carries a mark, { bv: how deep }: 0 on the page the app opened on. A step with
  // no mark is one the browser just made for a new page of the app)
  const marked = st => !!st && typeof st === 'object' && typeof st.bv === 'number';
  const stepOf = st => (marked(st) && st.bv > 0 ? st.bv | 0 : 0);
  const navBusy = () => { try { return !!(window.GO && typeof GO.backBusy === 'function' && GO.backBusy()); } catch (e) { return false; } };
  // (a browser only keeps a step in its history when a tap added it; one that can't say assumes a tap)
  const tapped = () => { try { const ua = navigator.userActivation; return ua ? !!ua.isActive : true; } catch (e) { return true; } };
  // (the parts write a page's address with history.replaceState(null, ...): the step's mark stays on it)
  const rawReplace = history.replaceState.bind(history);
  try {
    history.replaceState = function (st, t, url) {
      rawReplace(st == null && marked(history.state) ? { bv: stepOf(history.state) } : st, t, url);
      nav.hash = location.hash;
    };
    if (history.state == null) rawReplace({ bv: 0 }, '', location.href);
  } catch (e) {}
  nav.idx = stepOf(history.state);
  function pushStep() {
    try { history.pushState({ bv: stepOf(history.state) + 1 }, '', location.href); nav.idx = stepOf(history.state); return true; } catch (e) { return false; }
  }
  const topSheet = () => { while (nav.sheets.length && !nav.sheets[nav.sheets.length - 1].bg.isConnected) nav.sheets.pop(); return nav.sheets[nav.sheets.length - 1] || null; };
  addEventListener('popstate', e => {
    // (a browser also says "popstate" when a tap or a link opens another page of the app. That step is new and has
    // no mark yet: it is not Back, and "hashchange", which comes next, marks it and draws the page)
    if (e.state == null) return;
    const from = nav.idx, to = stepOf(e.state), moved = location.hash !== nav.hash;
    nav.idx = to; nav.fresh = false; nav.hash = location.hash; nav.popAt = Date.now();
    // (another page of the app: the address changed, so route() draws it, right after this, on the step it already has)
    if (moved) { nav.trav = true; nav.fresh = true; for (const r of nav.sheets.splice(0)) { try { r.bg.remove(); } catch (er) {} } return; }
    if (navBusy() || (e.state && e.state.bvBack) || to > from) return;
    const top = topSheet();
    if (top) { if (!top.locked) top.close(); return; }
    if (nav.back && nav.wants) { nav.answerAt = Date.now(); nav.back(); return; }
    // (nothing on this page to go back to: that step was left over from a page before, so Back goes on)
    if (from > 0) { try { history.back(); } catch (er) {} }
  });
  // (a page drawn without a tap, like the one the app opens on, has no step yet: the first tap on it adds one)
  const armNav = () => { if ((nav.wants || topSheet()) && !stepOf(history.state) && !(history.state && history.state.bvBack) && !navBusy()) pushStep(); };
  for (const ev of ['pointerup', 'keydown', 'click']) addEventListener(ev, armNav, true);

  // ---------- the screen ----------
  // view: a fresh page in the app, with a title, the way back, and one color (tint) for the part it belongs to
  const stack = [];
  function view(title, o = {}) {
    // (what the phone's Back button does here. A party game's pages keep their own Back; a page of theirs that is
    // not in a game yet, like "Start a game", asks for the app's with o.step)
    const hasBack = typeof o.back === 'function', wants = hasBack && (!o.night || !!o.step);
    const goBack = hasBack ? () => { if (o.onBack) o.onBack(); o.back(); } : null;
    {
      const answer = Date.now() - nav.answerAt < 1500;                                          // drawn as the answer to Back
      nav.answerAt = 0;
      const same = wants && nav.wants && (nav.title === title || nav.backFn === o.back);        // the same page again, or one beside it
      nav.title = title; nav.backFn = hasBack ? o.back : null; nav.wants = wants; nav.back = goBack;
      if (nav.fresh) nav.fresh = false;                                                         // this step was made for this page
      else if (wants && !answer && !same && tapped() && !navBusy()) pushStep();
    }
    app.textContent = '';
    app.className = 'app';
    app.style.removeProperty('--oa'); app.style.removeProperty('height');
    // (the party games have their own look, "Silk waves": on for their pages, off for every other one. A game screen
    // turns pt-dark on by itself: m/party.js)
    document.documentElement.classList.toggle('pt-night', !!o.night);
    document.documentElement.classList.remove('pt-dark');
    if (o.night) swSky();
    // (the other pages are in English, left to right, also right after a game in Arabic; the Games app's own pages are
    // in its language)
    if (!o.night) { document.documentElement.dir = 'ltr'; document.documentElement.lang = 'en'; }
    else if (o.app) appDir();
    document.documentElement.style.setProperty('--tint', o.tint ? `var(--${o.tint})` : 'var(--coral)');
    const top = el('header', 'top', app);
    if (o.back) {
      const b = el('button', 'back', top);
      b.type = 'button'; b.setAttribute('aria-label', o.app ? gt('Back') : say('Back'));
      b.appendChild(icon('back'));
      b.onclick = () => {
        // (on a step of the app's own: out the same way as the phone's Back button, which then draws the page
        // before. If the browser stays silent, the page before is drawn anyway.)
        if (!wants || !stepOf(history.state) || navBusy()) return goBack();
        b.onclick = null;
        const t0 = Date.now();
        setTimeout(() => { if (nav.popAt < t0) goBack(); }, 450);
        try { history.back(); } catch (e) { goBack(); }
      };
    } else if (o.night) { const ic = el('span', 'sw-appic', top); ic.innerHTML = SW_BOO('plain').replace('class="sw-boo"', ''); }
    else top.appendChild(boo('float'));
    const who = el('div', 'who', top);
    el('h1', '', who, title);
    const sub = el('p', '', who);
    const dot = el('i', 'dot', sub);
    const st = el('span', '', sub, o.status || '');
    if (!o.status && !o.live) sub.hidden = true;
    // (a page reached by scanning a code, in the browser, on a phone that does not have the app yet: one small button
    // that gets it. Never inside the app, never when the app is on this phone already.)
    if (o.get && canGet()) {
      const g = el('button', 'getchip', top); g.type = 'button';
      g.appendChild(icon('addbox'));
      el('span', '', g, o.night ? gt('Get the app') : 'Get the app');
      g.onclick = () => getSheet();
    }
    const body = el('main', '', app);
    if (o.live) bindStatus(dot, st, sub);
    return { body, top, setStatus: (text, tone) => { sub.hidden = false; st.textContent = text; dot.className = 'dot ' + (tone || ''); } };
  }
  function foot(parent) {
    const f = el('footer', 'foot', parent || app);
    f.append('Blokvane. Nothing you send is kept anywhere: it goes straight to your devices.');
    return f;
  }
  function hero(parent, title, text, o = {}) {
    const h = el('div', 'hero', parent);
    if (o.node) h.appendChild(o.node); else h.appendChild(document.documentElement.classList.contains('pt-night') ? swBoo(o.sleepy ? 'sleepy' : 'float') : boo(o.sleepy ? 'sleepy' : 'float'));
    el('h1', '', h, title);
    if (text) el('p', '', h, text);
    return h;
  }
  function qr(text, parent) {
    const q = el('div', 'qr', parent);
    try { q.appendChild(BVQR.svgOf(text, { border: 1 })); } catch (e) { q.textContent = text; }
    return q;
  }

  // ---------- modules (m/<name>.js): each one adds what it does with GO.def ----------
  const mods = new Map(), loading = new Map();
  function def(name, fn) { mods.set(name, fn); const w = loading.get(name); if (w) w.res(fn); }
  function need(name) {
    if (mods.has(name)) return Promise.resolve(mods.get(name));
    if (loading.has(name)) return loading.get(name).p;
    let res, rej;
    const p = new Promise((a, b) => { res = a; rej = b; });
    loading.set(name, { p, res });
    const s = document.createElement('script');
    s.src = 'm/' + name + '.js?v=' + VERSION;
    s.onerror = () => { loading.delete(name); rej(new Error('This part didn\'t load. Check the internet and try again.')); };
    document.head.appendChild(s);
    return p;
  }
  // a web address from another device: only http and https ever open (never javascript:, data: or the like)
  function webUrl(u) { try { const x = new URL(String(u || '')); return /^https?:$/.test(x.protocol) && !x.username && !x.password ? x.href : ''; } catch (e) { return ''; } }
  // a file from another device, made safe to open here: pictures, video, sound, PDF and plain text keep their type;
  // anything else (a web page, an SVG, a script) is only ever saved, never opened inside this page
  const SAFE_TYPES = /^(image\/(png|jpeg|gif|webp|heic|heif|avif)|video\/(mp4|webm|quicktime)|audio\/[a-z0-9.+-]+|application\/pdf|text\/plain)$/i;
  const safeBlob = b => (b && SAFE_TYPES.test(b.type || '') ? b : new Blob([b], { type: 'application/octet-stream' }));
  // a picture from a paired computer (a screen preview, a family board photo)
  const okImage = s => typeof s === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s);
  function script(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[data-src="${src}"]`)) { res(); return; }
      const s = document.createElement('script');
      s.src = src; s.dataset.src = src;
      s.onload = res; s.onerror = () => rej(new Error('This part didn\'t load. Check the internet and try again.'));
      document.head.appendChild(s);
    });
  }

  // ---------- your computer (a paired one) ----------
  // pairs: [{ s (this phone's own secret with that computer), cid (the computer's id), name, at }]
  const pairs = () => (store.get('pairs', []) || []).filter(p => p && typeof p.s === 'string' && L.okId(p.cid));
  function savePair(p) {
    const list = pairs().filter(x => x.cid !== p.cid);
    list.unshift({ s: p.s, cid: p.cid, name: L.clean(p.name, 40) || 'Your computer', at: Date.now(), kind: p.kind || '' });
    store.set('pairs', list.slice(0, 8));
  }
  function forgetPair(cid) { store.set('pairs', pairs().filter(x => x.cid !== cid)); store.del('me:' + cid); }
  async function member(key) {
    let jwk = store.get('me:' + key, null);
    let me;
    try { me = await C.newMember(jwk || undefined); } catch (e) { me = await C.newMember(); }
    if (!jwk) store.set('me:' + key, me.jwk);
    return me;
  }

  // The computer: a private room with only this phone and that computer in it. ask() sends an action and waits for
  // the answer; on(event) hears what the computer says by itself (a Kid mode request, the clipboard, what plays...).
  let pc = null;
  function computer(pair) {
    if (pc && pc.cid === pair.cid) return pc;
    if (pc) pc.close();
    const waits = new Map(), ons = new Map();
    let room = null, info = null, seenAt = 0, statusFns = new Set();
    const self = {
      cid: pair.cid, pair, name: pair.name,
      ready: (async () => {
        const me = await member(pair.cid);
        room = await L.room({ secret: pair.s, label: 'bvgo', me, name: deviceName(), role: 'phone', info: { plat: plat(), v: VERSION }, owner: pair.cid, open: false,
          onMsg: m => {
            if (m.f !== pair.cid) return;
            seenAt = Date.now();
            if (m.k === 'res') { const w = waits.get(m.rid); if (w) { waits.delete(m.rid); clearTimeout(w.t); if (m.ok) w.res(m.d); else w.rej(new Error(m.e || 'That didn\'t work on the computer.')); } }
            else if (m.k === 'ev') { for (const fn of ons.get(m.e) || []) { try { fn(m.d); } catch (e) {} } for (const fn of ons.get('*') || []) { try { fn(m.e, m.d); } catch (e) {} } }
            else if (m.k === 'unpair') { forgetPair(pair.cid); toast('This phone was removed on the computer.', 'bad'); setTimeout(() => { location.hash = ''; location.reload(); }, 1500); }
            fireStatus();
          },
          onPeers: () => {
            const p = room.peer(pair.cid);
            if (p) { seenAt = Math.max(seenAt, p.at); if (p.info) info = p.info; if (p.name && p.name !== self.name) { self.name = p.name; savePair(Object.assign({}, pair, { name: p.name })); } }
            fireStatus();
          },
          onPipe: P => { for (const fn of ons.get('pipe') || []) { try { fn(P); } catch (e) {} } }
        });
        self.room = room;
        return room;
      })(),
      // what the computer lets this phone do (it says so in its hello): ['remote', 'send', 'kid', ...]
      perms: () => (info && Array.isArray(info.perms) ? info.perms : null),
      info: () => info,
      here: () => !!room && (room.here(pair.cid) || Date.now() - seenAt < 70000),
      async ask(a, d, o = {}) {
        await self.ready;
        const rid = C.hex(C.rand(6));
        const p = new Promise((res, rej) => {
          const t = setTimeout(() => { waits.delete(rid); rej(new Error(self.here() ? 'The computer didn\'t answer. Try again.' : 'Your computer isn\'t answering. Is it on, with Chrome open?')); }, o.timeout || 12000);
          waits.set(rid, { res, rej, t });
        });
        await room.send({ k: 'act', a, rid, d: d || {} });
        return p;
      },
      on(e, fn) { if (!ons.has(e)) ons.set(e, new Set()); ons.get(e).add(fn); return () => ons.get(e).delete(fn); },
      onStatus(fn) { statusFns.add(fn); fn(); return () => statusFns.delete(fn); },
      close() { for (const w of waits.values()) clearTimeout(w.t); waits.clear(); if (room) room.close(); pc = null; }
    };
    function fireStatus() { for (const fn of statusFns) { try { fn(); } catch (e) {} } }
    setInterval(fireStatus, 5000);
    pc = self;
    return self;
  }
  // the dot and words at the top: connected, looking, reconnecting, or not answering.
  // Not answering: this phone tries again by itself, right away and then every little while as long as this page is in
  // front (it wakes the relays and asks the computer to say hello, without starting the page over, so nothing you typed
  // is lost). If that hasn't worked after about a minute, it starts the connection over once by itself. "Reconnect" does
  // that at once.
  let autoRe = false, lastNudge = 0;
  function nudge() {
    lastNudge = Date.now();
    try { const n = L.relays(); if (n && n.wake) n.wake(); } catch (e) {}
    const say = () => { try { if (pc && pc.room && !pc.room.closed()) pc.room.hello(true); } catch (e) {} };
    say(); setTimeout(say, 2500);
  }
  // (back from the background: the relays are woken by themselves; meanwhile the top says it's reconnecting)
  document.addEventListener('visibilitychange', () => { if (!document.hidden && pc && !pc.here()) lastNudge = Date.now(); });
  function bindStatus(dot, text, sub) {
    if (!pc) { sub.hidden = true; return; }
    const started = Date.now();
    let misses = 0, lostAt = 0;
    const off = pc.onStatus(() => {
      if (!document.body.contains(dot)) { off(); return; }
      sub.hidden = false;
      const t = Date.now(), here = pc.here(), early = t - started < 15000, trying = t - lastNudge < 8000;
      if (here) { misses = 0; lostAt = 0; } else if (!lostAt) lostAt = t;
      if (here) { dot.className = 'dot on'; text.textContent = 'Connected'; }
      else if (early || trying) { dot.className = 'dot wait'; text.textContent = early ? 'Looking for your computer...' : 'Reconnecting...'; }
      else { dot.className = 'dot off'; text.textContent = 'Not answering. Is it on, with Chrome open?'; }
      if (!here && !early && document.visibilityState === 'visible') {
        // (once, by itself, when trying again hasn't helped for about a minute)
        if (!autoRe && misses >= 3 && t - lostAt > 60000) { autoRe = true; off(); setTimeout(reconnect, 200); return; }
        if (t - lastNudge >= Math.min(60000, 10000 * 2 ** Math.min(misses, 3))) { misses++; nudge(); }
      }
      let re = sub.querySelector('.re');
      if (!here && !early) {
        if (!re) { re = el('button', 're', sub, 'Reconnect'); re.type = 'button'; re.onclick = () => reconnect(); }
      } else if (re) re.remove();
    });
  }

  // ---------- Blokvane as an app icon on the home screen ----------
  // Android (Chrome, Edge, Samsung Internet) can add it for real with one tap: the browser offers it to this page and we
  // show its own "Install" window. iPhones don't let a page do that: there, three picture steps show how (Share, then
  // Add to Home Screen). Either way it is the same page, with its own icon, opening full screen.
  let installEvt = null;
  // (Android offers to install it: then it is not on this phone, whatever was noted before)
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (!standalone()) store.set(document.documentElement.hasAttribute('data-games') ? 'gamesAdded' : 'appAdded', 0); });
  // (Chrome on Android can say that this app is on the home screen already: then "add the app" is not offered again)
  try {
    if (navigator.getInstalledRelatedApps) navigator.getInstalledRelatedApps().then(a => {
      const mine = document.documentElement.hasAttribute('data-games') ? /games\.webmanifest/ : /manifest\.json/;
      if (a && a.some(x => mine.test(x.url || ''))) { store.set(document.documentElement.hasAttribute('data-games') ? 'gamesAdded' : 'appAdded', 1); document.querySelectorAll('.card.install').forEach(c => c.remove()); }
    }).catch(() => {});
  } catch (e) {}
  addEventListener('appinstalled', () => { installEvt = null; store.set(GAMES ? 'gamesAdded' : 'appAdded', 1); });
  const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; } catch (e) { return false; } };
  async function installApp(o = {}) {
    if (installEvt) {
      const e = installEvt; installEvt = null;
      try {
        const shown = e.prompt();
        if (shown && shown.catch) shown.catch(() => {});
        const c = await e.userChoice;
        if (c && c.outcome === 'accepted') { store.set(GAMES ? 'gamesAdded' : 'appAdded', 1); toast(GAMES ? gt('Blokvane Games is on your home screen now.') : 'Blokvane is on your home screen now.', 'ok'); return true; }
        return false;
      } catch (er) {}
    }
    installSteps(o);
    return false;
  }
  function installSteps(o = {}) {
    const ua = navigator.userAgent, ios = plat() === 'ios';
    const nm = GAMES ? 'Blokvane Games' : 'Blokvane';
    const w = (t, v) => (GAMES ? gt(t, v) : gfill(t, v));
    const otherIos = /CriOS|FxiOS|EdgiOS/.test(ua), samsung = /SamsungBrowser/.test(ua);
    const steps = ios
      ? [['share', w('Tap the Share button'), otherIos ? w('The square with an arrow, next to the address at the top.') : w('The square with an arrow, at the bottom of Safari.')],
        ['addbox', w('Tap "Add to Home Screen"'), w('Scroll down the list a little if you don\'t see it.')],
        ['check', w('Tap "Add"'), w('At the top right. {name} is now on your home screen.', { name: nm })]]
      : plat() === 'android'
        ? [['dots', w('Open the browser menu'), samsung ? w('The three lines at the bottom right.') : w('The three dots at the top right.')],
          ['addbox', w('Tap "Install app" or "Add to Home screen"'), ''],
          ['check', w('Tap "Install" or "Add"'), w('{name} is now on your home screen.', { name: nm })]]
        : [['addbox', w('In Chrome or Edge: the install icon in the address bar'), w('Or the browser menu, then "Install".')], ['check', w('Click "Install"'), w('{name} gets its own window and icon.', { name: nm })]];
    sheet(w('Add {name} to your home screen', { name: nm }), (sh, close) => {
      appHead(sh, w('It opens like an app, with its own icon, in one tap. Nothing to download from a store.'));
      const ls = el('ol', 'steps-pic', sh);
      steps.forEach(([ic, t, sub]) => { const li = el('li', '', ls); const b = el('span', 'ic', li); b.appendChild(icon(ic)); const d = el('div', '', li); el('b', '', d, t); if (sub) el('small', '', d, sub); });
      if (o.note) el('p', 'install-note', sh, o.note);
      // (a page opened inside another app, like a messenger's own little browser, cannot add anything to the home
      // screen: the link, to open in the phone's real browser)
      if (plat() !== 'desktop') {
        const d = el('details', 'get-more', sh);
        el('summary', '', d, w('Not in the list?'));
        el('p', 'muted small', d, w('Then this page is open inside another app. Copy the link and open it in {browser} itself.', { browser: ios ? 'Safari' : 'Chrome' }));
        btn(w('Copy the link'), { kind: 'ghost', full: true, icon: 'copy' }, d, async () => { const u = BVAPPS.url(myApp(), true); try { await navigator.clipboard.writeText(u); toast(w('Link copied.'), 'ok'); } catch (e) { toast(u); } });
      }
      if (o.instead) btn(w('Use it in the browser instead'), { kind: 'ghost', full: true }, sh, () => { close(); o.instead(); }).style.marginTop = '12px';
      else btn(w('Got it'), { kind: 'go', full: true }, sh, () => close()).style.marginTop = '12px';
    });
  }
  // ---------- "Get the app": Blokvane's three apps on this phone (apps.js knows which are here already) ----------
  const myApp = () => (window.BVAPPS ? BVAPPS.me : 'remote');
  const haveApp = k => !!(window.BVAPPS && BVAPPS.has(k));
  // may this page offer its own app? On a phone, in the browser, and the app is not on this phone yet
  const canGet = () => plat() !== 'desktop' && !standalone() && !haveApp(myApp());
  const MY = () => (GAMES ? ['games-192.png', 'BV Games'] : ['icon-192.png', 'BV Remote']);
  function appHead(parent, text) {
    const r = el('div', 'get-head', parent);
    const im = el('img', '', r); im.src = MY()[0]; im.alt = '';
    const t = el('div', '', r); el('b', '', t, MY()[1]); el('p', 'muted small', t, text);
    return r;
  }
  // one tap on "Get": Android's own Install window, an iPhone's three picture steps, and on a computer the code to scan
  function getSheet() {
    const w = (t, v) => (GAMES ? gt(t, v) : gfill(t, v));
    const nm = MY()[1];
    // (only a page that really runs from this app's own icon says "already here". Anyone else who asks gets the way to add it)
    if (window.BVAPPS && BVAPPS.inApp()) { toast(w('{name} is on this phone already. Open it from your home screen.', { name: nm }), 'ok'); return; }
    if (plat() === 'desktop') {
      sheet(w('Get {name} on your phone', { name: nm }), sh => {
        appHead(sh, w('Point your phone\'s camera at the code. The app opens in its browser, ready to add to the home screen.'));
        qr(BVAPPS.url(myApp(), true), sh);
      });
      return;
    }
    if (plat() === 'ios') return installSteps();
    sheet(w('Get {name}', { name: nm }), (sh, close) => {
      appHead(sh, w('It opens like an app, with its own icon, in one tap. Nothing to download from a store.'));
      btn(w('Install'), { kind: 'go', full: true, huge: true, icon: 'addbox' }, sh, async () => { close(); await installApp(); }).style.marginTop = '14px';
      btn(w('Not now'), { kind: 'ghost', full: true }, sh, () => close()).style.marginTop = '8px';
    });
  }
  // a small card on the home page (until it's added, or "Not now" for three weeks)
  function installCard(parent) {
    if (standalone() || haveApp('remote') || store.get('appAdded', 0) || store.get('installHide', 0) > Date.now()) return null;
    const c = el('div', 'card install', parent);
    const r = el('div', 'install-row', c);
    const ic = el('img', 'install-ic', r); ic.src = 'icon-192.png'; ic.alt = '';
    const t = el('div', '', r); el('b', '', t, 'Make Blokvane an app'); el('p', 'muted small', t, 'Add it to your home screen: it opens in one tap, full screen, and stays connected.');
    // one under the other: side by side, "Add to home screen" took three lines on a phone
    const row = el('div', 'install-btns', c);
    btn('Add to home screen', { kind: 'tint', icon: 'addbox' }, row, () => installApp());
    btn('Not now', { kind: 'ghost' }, row, () => { store.set('installHide', Date.now() + 21 * 864e5); c.remove(); });
    return c;
  }
  const ss = { get: k => { try { return sessionStorage.getItem('bvgo:' + k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem('bvgo:' + k, v); } catch (e) {} } };
  // right after scanning the code on the computer: as an app icon, or in the browser?
  function chooseHow(parts) {
    const [s] = parts;
    const v = view('Connect your phone');
    const h = hero(v.body, 'How do you want Blokvane on this phone?', 'Both work the same way. You can add the app icon later too.');
    h.querySelector('.boo').classList.add('wave');
    const ls = el('div', 'how', v.body);
    const app = el('button', 'how-o rec', ls); app.type = 'button';
    const ai = el('span', 'how-ic appic', app); const im = el('img', '', ai); im.src = 'icon-192.png'; im.alt = '';
    const at = el('span', 'how-t', app); el('b', '', at, 'Add it to my home screen'); el('small', '', at, 'Opens like an app, with its own icon, in one tap. Best for every day.');
    el('span', 'how-tag', app, 'Best');
    const web = el('button', 'how-o', ls); web.type = 'button';
    const wi = el('span', 'how-ic', web); wi.appendChild(icon('globe'));
    const wt = el('span', 'how-t', web); el('b', '', wt, 'Use it in the browser'); el('small', '', wt, 'Works right away, nothing to add.');
    const mark = how => ss.set('how:' + String(s).slice(0, 10), how);
    web.onclick = () => { mark('web'); buzz('tap'); pair(parts); };
    app.onclick = () => {
      mark('app'); buzz('tap');
      // Android: its own Install window, while this page connects
      if (installEvt) { installApp(); pair(parts, { added: true }); return; }
      // iPhone: add it first; the new icon then connects by itself (this code works for 10 minutes)
      if (plat() === 'ios') { installSteps({ note: 'Then open Blokvane from your home screen: it finishes connecting by itself. Do it in the next few minutes, while this code works.', instead: () => { mark('web'); pair(parts); } }); return; }
      // other browsers: connect here, then the steps
      pair(parts, { steps: true });
    };
    foot();
  }

  // ---------- pairing (from the QR code on the computer: #p1.<pairing secret>.<computer id>) ----------
  async function pair(parts, how = {}) {
    const [s, cid] = parts;
    // (this phone already knows that computer, like an app icon added on this page: straight to it. The code is still
    // tried quietly: the computer may be showing it because it wants this phone again, for example after the phone
    // was removed there; then the new pairing replaces the old one and the phone connects with it)
    const known = L.okId(cid) && pairs().find(p => p.cid === cid);
    if (known) { history.replaceState(null, '', '#c1.' + known.s + '.' + known.cid); if (s) quietPair(s, known); return (await need('home'))(known); }
    // first: as an app icon, or in the browser (once per code; never inside the app itself)
    if (s && L.okId(cid) && !standalone() && !ss.get('how:' + String(s).slice(0, 10))) return chooseHow(parts);
    const v = view('Connect your phone');
    if (!s || !L.okId(cid)) { hero(v.body, 'This code isn\'t complete', 'Scan the QR code on your computer again: in Blokvane, open Connect, then Your phone.', { sleepy: true }); return; }
    const h = hero(v.body, 'Connecting to your computer', 'Keep this page open for a moment.');
    const sp = el('div', 'spin', h); sp.style.margin = '0 auto';
    const nameRow = el('div', 'card', v.body);
    el('h2', '', nameRow, 'This phone\'s name');
    el('p', '', nameRow, 'Your computer shows it, so you know which phone is which.');
    const ni = input({ value: deviceName(), max: 30 });
    nameRow.appendChild(ni);
    ni.onchange = () => { const n = L.clean(ni.value, 30); if (n) store.set('name', n); };
    const me = await member(cid);
    let done = false, tries = 0, t = 0;
    const room = await L.room({ secret: s, label: 'bvpair', me, name: deviceName(), role: 'phone', owner: cid, open: false,
      onMsg: m => {
        if (done || m.f !== cid) return;
        if (m.k === 'paired' && m.boxed && typeof m.s === 'string' && /^[A-Za-z0-9_-]{22,64}$/.test(m.s)) {
          done = true; clearTimeout(t);
          savePair({ s: m.s, cid, name: m.name || 'Your computer', kind: m.kind || '' });
          // (the new private link is kept in the address too, so a bookmark or "Add to Home Screen" keeps working)
          history.replaceState(null, '', '#c1.' + m.s + '.' + cid);
          room.close();
          buzz('ok');
          askToKeep();
          celebrate(m.name || 'your computer', m.kind, how);
        } else if (m.k === 'nopair') {
          done = true; clearTimeout(t); room.close();
          hero((v.body.textContent = '', v.body), 'That code was already used', 'Each QR code connects one phone. Make a new one on your computer: Connect, then Your phone.', { sleepy: true });
        }
      } });
    const ask = () => {
      if (done) return;
      tries++;
      room.send({ k: 'pair', name: L.clean(ni.value, 30) || deviceName(), plat: plat() }).catch(() => {});
      if (tries === 8) { const p = h.querySelector('p'); if (p) p.textContent = 'Still looking. Is Blokvane open on your computer, on the Your phone page?'; }
      t = setTimeout(ask, tries < 4 ? 1500 : 4000);
    };
    t = setTimeout(ask, 900);
  }
  async function quietPair(s, known) {
    const cid = known.cid;
    let done = false, room = null;
    try {
      const me = await member(cid);
      room = await L.room({ secret: s, label: 'bvpair', me, name: deviceName(), role: 'phone', owner: cid, open: false,
        onMsg: m => {
          if (done || m.f !== cid) return;
          if (m.k === 'paired' && m.boxed && typeof m.s === 'string' && /^[A-Za-z0-9_-]{22,64}$/.test(m.s)) {
            done = true; room.close();
            const now = pairs().find(p => p.cid === cid) || known;
            if (m.s !== now.s) {
              savePair({ s: m.s, cid, name: m.name || now.name, kind: m.kind || now.kind });
              if (pc && pc.cid === cid) pc.close();
              history.replaceState(null, '', '#c1.' + m.s + '.' + cid);
              route();
            }
            toast('Connected to ' + L.clean(m.name || now.name, 40) + '.', 'ok');
          } else if (m.k === 'nopair') { done = true; room.close(); }
        } });
      for (let i = 0; i < 12 && !done; i++) { room.send({ k: 'pair', name: deviceName(), plat: plat() }).catch(() => {}); await new Promise(r => setTimeout(r, i < 4 ? 1500 : 4000)); }
    } catch (e) {}
    if (!done && room) room.close();
  }
  // Reconnect: every relay is tried again (even ones that seemed down on this phone), and the room with the computer
  // starts over
  function reconnect() {
    try { localStorage.removeItem('bvlive:relays'); } catch (e) {}
    try { const n = L.relays(); if (n && n._health) n._health.clear(); } catch (e) {}
    if (pc) pc.close();
    buzz('tap');
    // (a moment for the old room to finish leaving)
    setTimeout(route, 600);
  }
  function celebrate(name, kind, how = {}) {
    const v = view('All set', { get: true });
    const h = hero(v.body, 'Connected to ' + name, kind === 'kid' ? 'Kid mode requests from that computer come to this phone. You can allow or deny them here.' : 'This phone is now a remote and more for your computer. It stays connected: you don\'t need to scan again.');
    h.querySelector('.boo').classList.add('wave');
    btn('Start', { kind: 'go', huge: true, full: true }, v.body, () => route());
    // (the app icon: added already, the steps now, or a card to add it)
    if (how.added || standalone()) el('p', 'muted small center', v.body, standalone() ? 'You\'re in the Blokvane app.' : 'Blokvane is on your home screen too: open it from there next time.');
    else if (how.steps) installSteps();
    else installCard(v.body);
    confetti();
  }
  // a short burst of confetti (one moment, never in a loop)
  function confetti(parent) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cv = el('canvas', '', parent || document.body);
    cv.style.cssText = 'position:fixed;top:0;left:0;inset:0;width:100%;height:100%;pointer-events:none;z-index:70';
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    const ctx = cv.getContext('2d');
    const colors = ['#ff6b5e', '#ffc451', '#36d6a5', '#5bb8ff', '#9a8cff', '#ff7ac8', '#ffffff'];
    const bits = Array.from({ length: 140 }, () => ({ x: cv.width / 2 + (Math.random() - .5) * cv.width * .3, y: cv.height * .35, vx: (Math.random() - .5) * 18 * dpr, vy: (-Math.random() * 16 - 6) * dpr,
      r: (4 + Math.random() * 5) * dpr, c: colors[Math.floor(Math.random() * colors.length)], a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
    const t0 = performance.now();
    (function frame(t) {
      const k = (t - t0) / 1000;
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const b of bits) { b.vy += .45 * dpr; b.vx *= .99; b.x += b.vx; b.y += b.vy; b.a += b.va; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.a); ctx.fillStyle = b.c; ctx.globalAlpha = Math.max(0, 1 - k / 2.6); ctx.fillRect(-b.r, -b.r / 2, b.r * 2, b.r); ctx.restore(); }
      // (emptied as it goes: an iPhone gives a canvas's memory back only then)
      if (k < 2.6) requestAnimationFrame(frame); else { cv.width = cv.height = 0; cv.remove(); }
    })(t0);
  }

  // ---------- where to go ----------
  async function route() {
    if (window.GO) GO.say = null;
    const h = L.parse(location.hash);
    try {
      if (GAMES && !h) return gamesHome();
      // (a game's QR code, opened in the browser: play here, or in the Games app? asked once, then remembered)
      // (not for a game this page was sent straight into, like one shown beside it with "Play here too", or just cast
      // to a TV from this computer: that one simply opens here)
      if (GAMES && h && h.kind === 'game' && !standalone() && !ss.get('games:here:' + String(h.parts[0] || '').slice(0, 10))) {
        const how = store.get('games:how', '');
        if (!how) return gamesChoice();
        if (how === 'app') return openTheApp(h);
      }
      if (!h) return home();
      switch (h.kind) {
        case 'p1': return pair(h.parts);
        case 'c1': {
          const [s, cid] = h.parts;
          if (!s || !/^[A-Za-z0-9_-]{22,64}$/.test(s) || !L.okId(cid)) return home();
          const known = pairs().find(p => p.cid === cid);
          if (known && known.s === s) return (await need('home'))(known);
          // (a link this phone doesn't know, like a home-screen icon made before, or a link someone else sent: it is
          // only kept after you say it is your computer)
          return confirmPair(s, cid, known);
        }
        default: {
          const name = KINDS[h.kind];
          if (!name) return home();
          return (await need(name))(h.kind, h.parts);
        }
      }
    } catch (e) {
      const v = view('Blokvane');
      hero(v.body, 'This didn\'t load', e && e.message ? e.message : 'Check the internet and try again.', { sleepy: true });
      btn('Try again', { kind: 'go', full: true }, v.body, () => location.reload());
    }
  }
  function confirmPair(s, cid, known) {
    const v = view('Your computer?');
    hero(v.body, known ? 'Connect to ' + known.name + ' again?' : 'Connect to this computer?', 'Only say yes if this link came from Blokvane on your own computer (Connect, then Your phone). If someone sent it to you, say no.');
    btn('Yes, it\'s my computer', { kind: 'go', huge: true, full: true }, v.body, () => { savePair({ s, cid, name: known ? known.name : 'Your computer', kind: known ? known.kind : '' }); route(); });
    btn('No', { kind: 'ghost', full: true }, v.body, () => { history.replaceState(null, '', location.pathname); route(); }).style.marginTop = '10px';
  }
  // which part handles each kind of link
  const KINDS = { d1: 'drop', mv1: 'drop', pw1: 'pw', up1: 'pagehelp', sg1: 'pagehelp', poll: 'poll', q1: 'poll', light: 'fun', rev: 'fun', cam: 'camera', mon: 'camera', monv: 'camera',
    wb: 'board', game: 'party', join: 'party', ads: 'shield', me: 'shield' };
  // (this phone's own pages: its account and licenses, and ad blocking)
  const OWN_KINDS = new Set(['ads', 'me']);
  // no link: the computers this phone knows, or how to start
  async function home() {
    // (Blokvane as an app, opened again soon after it was in a party game it didn't leave: straight back into that game,
    // like any app; once per opening, and not for a game that was left on purpose or couldn't be found)
    const bk = store.get('party:back', null);
    let once = false;
    try { once = !!sessionStorage.getItem('bvgo:autoBack'); } catch (e) {}
    if (!once && standalone() && bk && !bk.left && !bk.noAuto && typeof bk.s === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(bk.s) && L.okId(bk.tv) && Date.now() - (+bk.at || 0) < 20 * 60000) {
      try { sessionStorage.setItem('bvgo:autoBack', '1'); } catch (e) {}
      location.hash = '#game.' + bk.s + '.' + bk.tv + (typeof bk.lg === 'string' && /^[a-z]{2}$/.test(bk.lg) ? '.' + bk.lg : '');
      return;
    }
    const list = pairs();
    // ("Other computers" on a computer's page comes here once, to pick)
    const picking = store.get('pick', 0);
    if (picking) store.del('pick');
    if (list.length === 1 && !picking) { history.replaceState(null, '', '#c1.' + list[0].s + '.' + list[0].cid); return (await need('home'))(list[0]); }
    const v = view('Blokvane', { get: false });
    moreBtn(v.top, () => moreScreen({ back: () => { store.set('pick', 1); home(); } }));
    // (what this phone does by itself, with or without a computer: ad blocking, its account and licenses, a video for the TV)
    const ownCard = () => { thisPhone(v.body); appsCard(v.body, ['ads', 'games']); };
    const gameCard = () => {
      const c = el('div', 'card', v.body);
      el('h2', '', c, 'Joining a game or a poll?');
      el('p', '', c, 'Scan the QR code on the TV with your phone\'s camera. No app needed. Or find the TV on this Wi-Fi, or type the code under it:');
      btn('Join a game', { kind: 'tint', full: true, icon: 'game' }, c, async () => (await need('party'))('code', []));
    };
    if (!list.length) {
      backCard(v.body);
      hero(v.body, 'Blokvane on your phone', 'The remote for your computer and TV. Ad blocking and party games are here too.');
      startCard(v.body);
      ownCard();
      gameCard();
      foot();
      return;
    }
    backCard(v.body);
    el('p', 'lead', v.body, 'Pick a computer');
    const ls = el('div', 'list', v.body);
    for (const p of list) {
      const it = el('button', 'item', ls);
      it.type = 'button'; it.style.border = '0'; it.style.textAlign = 'start';
      it.appendChild(icon('laptop'));
      const t = el('span', 't', it);
      el('b', '', t, p.name);
      el('small', '', t, p.kind === 'kid' ? 'Kid mode' : 'Remote and more');
      it.onclick = () => { history.replaceState(null, '', '#c1.' + p.s + '.' + p.cid); route(); };
    }
    ownCard();
    gameCard();
    foot();
  }

  // where to start, for a phone that knows no computer yet: three steps with pictures
  function startCard(parent) {
    const c = el('div', 'card start', parent);
    el('h2', '', c, 'Start here');
    const ol = el('ol', 'steps-pic', c);
    for (const [ic, t, sub] of [['laptop', 'On your computer, open Blokvane', 'Click the Blokvane icon in Chrome or Edge, then Connect.'],
      ['camera', 'Scan the code with this phone', 'Point the phone\'s camera at it. This page connects by itself.'],
      ['check', 'Done', 'This phone is now the remote for your computer and TV.']]) {
      const li = el('li', '', ol); const b = el('span', 'ic', li); b.appendChild(icon(ic)); const d = el('div', '', li); el('b', '', d, t); el('small', '', d, sub);
    }
    const a = el('a', 'btn ghost full', c); a.href = SITE + 'download'; a.target = '_blank'; a.rel = 'noopener'; a.style.marginTop = '12px'; a.style.textDecoration = 'none';
    a.appendChild(icon('laptop')); el('span', '', a, 'No Blokvane on your computer yet? Get it');
    return c;
  }
  // the "More" button at the top of an app's first page
  function moreBtn(top, fn) {
    const b = el('button', 'morebtn', top); b.type = 'button';
    b.appendChild(icon('dots'));
    el('span', '', b, GAMES ? gt('More') : 'More');
    b.onclick = () => { buzz('tap'); fn(); };
    return b;
  }
  // ---------- More: everything else of the app. The same page in BV Remote and BV Games, like "More" in BV Ad Block:
  // the account, the look, Blokvane's other apps (each with "Get" until it is on this phone), telling a friend, help.
  async function shareRemote() {
    const data = { title: 'Blokvane', text: 'Blokvane makes my phone the remote for my computer and TV, blocks ads, and has party games for the TV. Take a look:', url: SITE };
    try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(data.text + ' ' + SITE); toast('Copied. Send it to a friend.', 'ok'); } catch (e) { toast(SITE); }
  }
  function moreScreen(o = {}) {
    const w = (t, v) => (GAMES ? gt(t, v) : gfill(t, v));
    const back = o.back || (() => route());
    const again = () => moreScreen(o);
    const v = GAMES ? view(gt('More'), { tint: 'mint', night: true, app: true, step: true, back }) : view('More', { back, tint: 'sky' });
    const sec = title => { const c = el('div', 'card more-sec', v.body); el('h2', '', c, title); return c; };
    const row = (ls, ic, tint, title, sub, fn, href) => {
      const it = el(href ? 'a' : 'button', 'item own-row' + (href ? ' app-row' : ''), ls);
      if (href) { it.href = href; if (/^https?:/.test(href)) { it.target = '_blank'; it.rel = 'noopener'; } } else { it.type = 'button'; it.onclick = () => { buzz('tap'); fn(); }; }
      it.style.setProperty('--tint', `var(--${tint})`);
      el('span', 'ic', it).appendChild(icon(ic));
      const t = el('span', 't', it); el('b', '', t, title); if (sub) el('small', '', t, sub);
      it.appendChild(icon('chev', 'go'));
      return it;
    };
    // the account
    if (GAMES) {
      const a = pass.get();
      const ls = el('div', 'list own-list', sec(gt('Account')));
      if (a) {
        const it = el('div', 'item own-row plain', ls);
        it.style.setProperty('--tint', 'var(--sky)');
        el('span', 'ic', it).appendChild(icon('key'));
        const t = el('span', 't', it); const m = el('bdi', '', el('b', '', t), a.email); m.dir = 'ltr';
        el('small', '', t, pass.host() ? gt('Signed in. This phone can host games') : gt('Signed in on this phone'));
        row(ls, 'x', 'rose', gt('Sign out'), '', () => { pass.clear(); toast(gt('Signed out.')); again(); });
      } else row(ls, 'key', 'sky', gt('Sign in to host'), gt('With your email and a code. No password.'), () => signInScreen({ after: again, back: again }));
    } else thisPhone(v.body);
    // the look, and in the Games the language
    const look = sec(w('Look'));
    const note = el('p', 'muted small', look);
    const sayLook = () => { note.textContent = lookNow() === 'auto' ? w('Auto matches this phone: light when the phone is light, dark when it is dark.') : w('It stays like this on this phone, whatever the phone is set to.'); };
    sayLook();
    lookRow(look, sayLook);
    if (GAMES) {
      const ls = el('div', 'list own-list', look); ls.style.marginTop = '12px';
      row(ls, 'globe', 'violet', gt('Language'), (window.BVI18N && (BVI18N.LANGS.find(l => l[0] === gl) || [])[1]) || 'English', () => langSheet());
    }
    // Blokvane's other apps
    const apps = appsCard(v.body, GAMES ? ['ads', 'remote'] : ['ads', 'games'], GAMES ? { words: gt } : {});
    row(apps.querySelector('.list'), 'laptop', 'coral', w('Blokvane for your computer'), w('The ad blocker for Chrome and Edge. It takes the ads out of YouTube too.'), null, SITE + 'download').classList.add('pc-row');
    // this app
    const ls = el('div', 'list own-list', sec(w('This app')));
    row(ls, 'share', 'pink', w('Tell a friend'), GAMES ? gt('Invite them to game night') : 'Sends the address of blokvane.com', () => (GAMES ? shareInvite() : shareRemote()));
    row(ls, 'phone', 'teal', w('Show this app to someone next to you'), w('A code their phone can scan'), () => sheet(w('Scan to get this app'), sh => {
      el('p', 'muted', sh, w('Point the other phone\'s camera at the code. The app opens in its browser.'));
      qr(BVAPPS.url(myApp(), true), sh);
    }));
    if (plat() !== 'desktop' && !(window.BVAPPS && BVAPPS.inApp())) row(ls, 'addbox', 'mint', w('Add this app to your home screen'), w('It opens like any app, with its own icon'), () => getSheet());
    // help
    const hl = el('div', 'list own-list', sec(w('Help')));
    row(hl, 'help', 'sun', w('Questions and answers'), '', null, SITE + 'faq');
    row(hl, 'send', 'sky', w('Write to Blokvane'), 'support@blokvane.com', null, 'mailto:support@blokvane.com');
    row(hl, 'lock', 'violet', w('Privacy'), w('What Blokvane keeps, and what it never does'), null, SITE + 'privacy');
    const f = el('p', 'muted small center', v.body, (GAMES ? 'BV Games' : 'BV Remote') + ' ' + VERSION); f.style.marginTop = '18px';
  }

  // ---------- "This phone": what the phone does by itself, with or without a computer ----------
  // Two rows, each with what is true right now under its name: ad blocking on this phone, and who is signed in and
  // their licenses. What they say comes from this phone's own memory of its last look
  // (m/shield.js keeps it). The one thing asked here, every few hours and without any sign-in: is ad blocking for
  // phones open yet? So the first row never promises what Blokvane cannot give today.
  const adsOpen = () => { const x = store.get('shield:info', null); return x && typeof x === 'object' && typeof x.open === 'string' ? x : { open: '', at: 0 }; };
  let adsAsked = 0;
  function adsOpenFresh() {
    const have = adsOpen();
    if (GAMES || typeof BVPASS === 'undefined' || Date.now() - (+have.at || 0) < 3 * 3600e3 || Date.now() - adsAsked < 60000) return Promise.resolve(false);
    adsAsked = Date.now();
    const ctl = typeof AbortController === 'function' ? new AbortController() : null;
    const t = setTimeout(() => { if (ctl) ctl.abort(); }, 8000);
    return fetch(BVPASS.api + '/v1/phone/dns/info', { credentials: 'omit', signal: ctl ? ctl.signal : undefined }).then(r => (r.ok ? r.json() : null)).then(d => {
      clearTimeout(t);
      if (!d || !/^(all|some|none)$/.test(d.open)) return false;
      store.set('shield:info', { open: d.open, android: !!d.android, droid: d.droid === 'all' ? 'all' : 'soon', lab: /^[0-9a-f]{6,16}$/.test(d.lab || '') ? d.lab : '', at: Date.now() });
      return d.open !== have.open;
    }, () => { clearTimeout(t); return false; });
  }
  function ownRow(ls, ic, tint, title, sub, hash, tone) {
    const it = el('button', 'item own-row', ls);
    it.type = 'button';
    it.style.setProperty('--tint', `var(--${tint})`);
    el('span', 'ic', it).appendChild(icon(ic));
    const t = el('span', 't', it);
    el('b', '', t, title);
    // (one line under the name, or two)
    for (const x of Array.isArray(sub) ? sub : [sub]) { const sm = el('small', tone || '', t); if (x instanceof Node) sm.appendChild(x); else sm.textContent = x || ''; }
    it.appendChild(icon('chev', 'go'));
    it.onclick = () => { location.hash = hash; };
    return it;
  }
  function thisPhone(parent) {
    const c = el('div', 'card own', parent);
    el('h2', '', c, 'This phone');
    const ls = el('div', 'list own-list', c);
    const a = pass.get();
    const sum = (() => { const x = store.get('shield:sum', null); return a && x && typeof x === 'object' && x.email === a.email ? x : {}; })();
    // 1. ad blocking on this phone
    const adsSays = () => { const info = adsOpen(); return sum.ads === 'working' ? ['Switched on. Open it to test this phone', 'ok'] : sum.ads === 'steps' ? ['Almost there: finish the steps', 'warn']
      : sum.ads === 'left-out' ? ['Not part of your license', '']
      : sum.ads === 'closed' || info.open === 'none' ? ['Not open yet', ''] : info.open === 'some' && !sum.ads ? ['Being tried out with a few people', ''] : ['Not set up yet', '']; };
    const ads = adsSays();
    const adsRow = ownRow(ls, 'shield', 'mint', 'Block ads on this phone', ads[0], '#ads', ads[1]);
    adsOpenFresh().then(changed => { if (!changed || !adsRow.isConnected) return; const now = adsSays(), sm = adsRow.querySelector('small'); if (sm) { sm.textContent = now[0]; sm.className = now[1]; } });
    // 2. who is signed in, and their licenses
    let who = 'Not signed in. Your licenses show here once you are.';
    if (a) {
      const m = el('bdi', '', null, a.email); m.dir = 'ltr';
      who = sum.total ? [m, sum.used + ' of ' + sum.total + (sum.total === 1 ? ' license' : ' licenses') + ' in use'] : m;
    }
    ownRow(ls, 'kid', 'sky', 'Account and licenses', who, '#me');
    return c;
  }

  // Blokvane's other two apps, each with its own icon: one tap opens it (in the browser, or as the app once it is on
  // the home screen). which: 'ads', 'games', 'remote'.
  const APPS = {
    ads: ['ads-192.png', 'BV Ad Block', 'Block ads on this phone', 'adblock.html'],
    games: ['games-192.png', 'BV Games', 'Party games on the TV, with every phone as a controller', 'games.html'],
    remote: ['icon-192.png', 'BV Remote', 'Your phone as the remote for your computer and TV', 'index.html']
  };
  function appsCard(parent, which, o = {}) {
    const w = t => (o.words ? o.words(t) : t);
    const c = el('div', 'card apps', parent);
    el('h2', '', c, w(o.title || 'More from Blokvane'));
    const ls = el('div', 'list own-list', c);
    const phone = plat() !== 'desktop';
    const paint = () => {
      ls.textContent = '';
      for (const k of which) {
        const [img, name, sub, href] = APPS[k];
        // (on this phone already: one tap opens it. Not yet: "Get" leads to that app's page, which adds it)
        const have = !phone || haveApp(k);
        const a = el('a', 'item own-row app-row', ls);
        a.href = !window.BVAPPS ? href : have ? BVAPPS.openUrl(k) : BVAPPS.getUrl(k);
        const im = el('img', 'app-ic', a); im.src = img; im.alt = '';
        const t = el('span', 't', a);
        el('b', '', t, name);
        // (the ad blocker's row never promises what is not open yet: the same words as "This phone" above it)
        const info = k === 'ads' ? adsOpen() : null;
        const open = info && !o.words ? info.open : '';
        const soon = info && plat() === 'android' && info.droid === 'soon';
        el('small', '', t, open === 'none' ? 'Not open yet' : soon ? w('Coming soon on Android. The Ad Blocker Test works today') : have && phone ? w('On this phone') : w(sub));
        if (have) a.appendChild(icon('chev', 'go'));
        else { const g = el('span', 'get-pill', a); g.appendChild(icon('addbox')); el('span', '', g, w('Get')); }
      }
    };
    paint();
    if (window.BVAPPS) BVAPPS.onchange(() => { if (ls.isConnected) paint(); });
    return c;
  }

  // a party game this phone was in a little while ago (its page was closed by mistake, say): one tap goes back in, as
  // the same player, with the same score
  function backCard(parent) {
    const b = store.get('party:back', null);
    if (!b || typeof b.s !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(b.s) || !L.okId(b.tv) || !(Date.now() - (+b.at || 0) < 3 * 3600e3)) return null;
    const c = el('div', 'card', parent);
    c.style.borderColor = 'color-mix(in srgb, var(--pink) 45%, var(--line))';
    const sy = t => (GAMES ? gt(t) : window.GO && GO.say ? GO.say(t) : t);
    el('h2', '', c, '🎉 ' + (typeof b.name === 'string' && b.name ? L.clean(b.name, 40) : sy('Party game')));
    el('p', 'muted', c, sy('You were in this game a little while ago. Go back in as yourself, with your score.'));
    btn(sy('Back to the game'), { kind: 'go', full: true, huge: true, icon: 'play' }, c, () => { location.hash = '#game.' + b.s + '.' + b.tv + (typeof b.lg === 'string' && /^[a-z]{2}$/.test(b.lg) ? '.' + b.lg : ''); });
    // (a game that's over for this phone: gone from here in one tap)
    const no = btn(sy('Not now'), { kind: 'ghost', full: true }, c, () => { store.del('party:back'); c.remove(); });
    no.style.marginTop = '8px';
    return c;
  }


  // =====================================================================
  // Blokvane Games (games.html): the party games' own small app
  // =====================================================================
  // The same page as Blokvane on your phone, for games only: its home is the games (scan the QR code with the camera,
  // type the code, back into a game, start a game as its host), and a game's QR code opened in the browser asks once
  // how to play. It speaks the phone's language (one of the games' seven: ../play/i18n.js and its words), or the one
  // picked on its home page, right to left for Arabic. Its look is "Silk waves" (go.css), dark or light like the phone.
  // (games.html says so on its <html> tag; an older copy of it still says it with window.BV_GAMES)
  const GAMES = !!window.BV_GAMES || document.documentElement.hasAttribute('data-games');
  // The sign-in that may host games (pass.js), kept on this phone: the email, and the session Blokvane's server gave
  // this phone for it (plan: what the server said that email has: 'pro', 'guest', 'free' (the free games), or '' for none yet).
  const pass = {
    why: '',
    get() { const p = store.get('games:acct', null); return p && typeof p === 'object' && typeof p.session === 'string' && p.session && typeof p.email === 'string' ? p : null; },
    set(p) { store.set('games:acct', p); if (window.BVAPPS) setTimeout(() => BVAPPS.sync(true), 0); },
    // (may this phone host? signed in, and the server said its email has a plan)
    host() { const p = pass.get(); return p && p.plan ? p : null; },
    clear() { const p = pass.get(); store.del('games:acct'); store.del('games:passes'); store.del('games:pass'); if (p && typeof BVPASS !== 'undefined') BVPASS.signOut(p.session).catch(() => {}); },
    // (this phone's own id for Blokvane's server, made here once: it only ties a sign-in to this phone)
    device() { let d = store.get('games:dev', ''); if (!/^[0-9a-f]{32}$/.test(d)) { d = C.hex(C.rand(16)); store.set('games:dev', d); } return d; },
    // A pass for this phone in one game (mid: its own id in that game), or null. pass.why then says why not: 'signed_out',
    // 'no_plan' (signed in, but that email has no Blokvane Pro and no running trial) or 'offline'. A pass that still has
    // an hour to go is used again, and when the server can't be reached, one that hasn't run out still works.
    async forGame(mid) {
      const a = pass.get();
      pass.why = a ? '' : 'signed_out';
      if (!a || typeof BVPASS === 'undefined' || !/^[0-9a-f]{16}$/.test(String(mid))) return null;
      let kept = store.get('games:passes', null);
      if (!kept || typeof kept !== 'object') kept = {};
      const old = kept[mid] && typeof kept[mid].pass === 'string' && kept[mid].exp > 0 ? kept[mid] : null;
      if (old && old.exp * 1000 > Date.now() + 3600e3) return old.pass;
      const r = await BVPASS.forGame(a.session, mid);
      if (r.pass) {
        kept[mid] = { pass: r.pass, exp: r.exp };
        const out = {};
        for (const k of Object.keys(kept).filter(k => kept[k] && kept[k].exp * 1000 > Date.now()).sort((x, y) => kept[y].exp - kept[x].exp).slice(0, 6)) out[k] = kept[k];
        store.set('games:passes', out);
        if (a.plan !== r.plan) { a.plan = r.plan; pass.set(a); }
        return r.pass;
      }
      pass.why = r.code || 'error';
      if (r.code === 'signed_out') { store.del('games:acct'); store.del('games:passes'); }
      else if (r.code === 'no_plan' && a.plan) { a.plan = ''; pass.set(a); }
      if (r.code === 'offline' && old && old.exp * 1000 > Date.now()) return old.pass;
      return null;
    },
    // A pass for handing this phone's game to another player (mid: this phone's own id in the game, to: that player's),
    // or null: pass.why then says why not ('signed_out', 'offline', 'slow_down' or 'error')
    async lend(mid, to) {
      const a = pass.get();
      pass.why = a ? '' : 'signed_out';
      if (!a || typeof BVPASS === 'undefined' || !BVPASS.lend || !/^[0-9a-f]{16}$/.test(String(mid)) || !/^[0-9a-f]{16}$/.test(String(to))) return null;
      const r = await BVPASS.lend(a.session, mid, to);
      if (r.lend) return r.lend;
      pass.why = r.code || 'error';
      if (r.code === 'signed_out') { store.del('games:acct'); store.del('games:passes'); }
      return null;
    },
    // (does the server say this email may host, right now? 'pro', 'guest' or 'free'; '' when not; null when it can't be asked)
    async check() {
      const a = pass.get();
      if (!a || typeof BVPASS === 'undefined') return '';
      const r = await BVPASS.forGame(a.session, C.hex(C.rand(8)));
      if (r.pass) { if (a.plan !== r.plan) { a.plan = r.plan; pass.set(a); } return r.plan || 'pro'; }
      if (r.code === 'signed_out') { store.del('games:acct'); store.del('games:passes'); return ''; }
      if (r.code === 'no_plan') { if (a.plan) { a.plan = ''; pass.set(a); } return ''; }
      return null;
    }
  };
  const SITE = 'https://blokvane.com/';
  // the language: gt(words, { parts }) is the words in it (words with no translation yet stay English)
  let gl = 'en';
  const gfill = (s, v) => (v ? String(s).replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? String(v[k]) : m)) : String(s));
  const gt = (s, v) => (gl !== 'en' && window.BVI18N ? BVI18N.t(gl, s, v) : gfill(s, v));
  const later = (p, ms, v) => Promise.race([p, new Promise(r => setTimeout(() => r(v), ms))]);
  async function gamesLang(code) {
    try { await later(script('../play/i18n.js?v=' + VERSION), 4000); } catch (e) { return gl; }
    const I = window.BVI18N;
    if (!I) return gl;
    const want = code || store.get('games:lang', '');
    const c = I.FULL.has(want) ? want : I.pick();
    if (c !== 'en' && !(await later(I.load(c, false), 6000, false))) return gl;
    gl = c;
    return gl;
  }
  // (a page of the app's own: in its language, right to left for Arabic)
  const appDir = () => { document.documentElement.lang = gl; document.documentElement.dir = window.BVI18N && BVI18N.RTL.has(gl) ? 'rtl' : 'ltr'; };
  async function shareGames() {
    const data = { title: 'Blokvane Games', text: gt('Party games on the TV, and everyone plays on their own phone. One person with Blokvane hosts, everyone else plays free.'), url: SITE };
    try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(SITE); toast(gt('Link copied. Send it to a friend.'), 'ok'); } catch (e) { toast(SITE); }
  }
  // a host invites friends to game night: the Games app, so it's ready on their phones
  async function shareInvite() {
    const url = L.GO + 'games.html';
    const data = { title: 'Blokvane Games', text: gt('Game night! The game is on the TV, and everyone plays on their own phone, free. Get Blokvane Games here:'), url };
    try { if (navigator.share) { await navigator.share(data); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(data.text + ' ' + url); toast(gt('Invite copied. Send it to your friends.'), 'ok'); } catch (e) { toast(url); }
  }
  // "Get Blokvane": where it is, and sharing it
  function getCard(parent, o = {}) {
    const c = el('div', 'card gm-get', parent);
    el('h2', '', c, o.title || gt('No Blokvane yet?'));
    el('p', 'muted', c, o.text || gt('Get Blokvane on your computer (it\'s at blokvane.com), then sign in here to host games. Or ask a friend who has it to host: once they\'re in, you join without signing in.'));
    const r = el('div', 'grid2', c); r.style.marginTop = '12px';
    btn(gt('Get Blokvane'), { kind: 'orange', icon: 'globe' }, r, () => { window.open(o.url || SITE, '_blank', 'noopener'); });
    btn(gt('Share it'), { kind: 'blue', icon: 'share' }, r, () => shareGames());
    return c;
  }
  // (an email inside a sentence in any language stays left to right in a <bdi> of its own, which every browser
  // knows. The invisible direction marks that did this before show as little boxes on some older phones.)
  function sayWithMail(node, text, email) {
    node.textContent = '';
    String(text).split('\u0001').forEach((t, i) => { if (i) { const b = el('bdi', '', node, email); b.dir = 'ltr'; } if (t) node.appendChild(document.createTextNode(t)); });
    return node;
  }
  // signing in to host: Boo with his golden host ticket. Two steps: the email, then the code Blokvane emails to it (no
  // password to make up or forget). A phone that is signed in but whose email has no plan yet sees how to get one.
  async function signInScreen(o = {}) {
    try { (await need('party'))('css'); } catch (e) {}
    const v = view('Blokvane Games', { tint: 'mint', night: true, app: true, back: o.back || null, step: true });
    const art = el('div', 'si-art', v.body);
    art.appendChild(swBoo('float'));
    const tk = el('div', 'si-ticket', art);
    el('b', '', tk, gt('HOST')); el('small', '', tk, gt('Blokvane member'));
    const h1 = el('h1', 'si-h', v.body, o.why === 'host' ? gt('This game needs a host') : gt('Sign in to host games'));
    const lead = el('p', 'si-p', v.body, o.why === 'host' ? gt('Every game needs one Blokvane member to start it. Sign in, and everyone else joins for free.') : gt('Blokvane members host the games. Everyone who joins their game plays for free, without signing in.'));
    const main = el('div', '', v.body);
    const again = () => { if (o.why === 'host' && o.again) btn(gt('The host is in now: try again'), { kind: 'ghost', full: true }, main, () => o.again()).style.marginTop = '10px'; };
    const done = () => {
      art.classList.add('yay');
      buzz('ok'); confetti();
      toast(o.why === 'host' ? gt('Signed in: you\'re the host!') : gt('Signed in. You can host games now.'), 'ok');
      setTimeout(() => { if (o.after) o.after(); }, 700);
    };
    // signed in, but this email has no Blokvane Pro and no running trial: how to get it, and "Check again" once it has
    function noPlan(acct) {
      main.textContent = '';
      art.classList.remove('yay'); art.classList.add('sad');
      h1.textContent = gt('This email can\'t host yet');
      sayWithMail(lead, gt('You\'re signed in as {email}. Hosting needs Blokvane Pro or a free trial for that email. Joining a game is always free.', { email: '\u0001' }), acct.email);
      getCard(main, { title: gt('Get Blokvane to host'), text: gt('Get Blokvane on your computer (it\'s at blokvane.com) and start the free trial or Blokvane Pro with this same email. Then tap "Check again" here.'), url: SITE + 'pricing' });
      const err = el('p', 'si-err', main); err.hidden = true;
      const chk = btn(gt('Check again'), { kind: 'go', huge: true, full: true }, main, async () => {
        chk.disabled = true; err.hidden = true;
        const plan = await pass.check();
        chk.disabled = false;
        if (plan) { art.classList.remove('sad'); return done(); }
        if (!pass.get()) return emailStep();
        err.textContent = plan === null ? gt('Can\'t reach Blokvane right now. Check the internet and try again.') : gt('Not yet: this email still has no Blokvane Pro and no free trial.');
        err.hidden = false; buzz('bad');
      });
      chk.style.marginTop = '10px';
      btn(gt('Use another email'), { kind: 'ghost', full: true }, main, () => { pass.clear(); emailStep(); }).style.marginTop = '10px';
      again();
    }
    // 1. the email
    function emailStep(keep) {
      main.textContent = '';
      art.classList.remove('sad');
      const card = el('div', 'card si-card', main);
      const ei = input({ placeholder: 'you@example.com', max: 120 });
      ei.type = 'email'; ei.autocomplete = 'email'; ei.inputMode = 'email'; ei.autocapitalize = 'none'; ei.spellcheck = false; ei.dir = 'ltr';
      if (keep) ei.value = keep;
      field(gt('Email'), ei, card);
      el('p', 'muted small', card, gt('We email you a code to type here. No password needed.')).style.marginTop = '8px';
      const err = el('p', 'si-err', card); err.hidden = true;
      const go = btn(gt('Email me a code'), { kind: 'go', huge: true, full: true, icon: 'key' }, main, async () => {
        if (go.disabled) return;
        err.hidden = true; art.classList.remove('sad');
        go.disabled = true;
        const r = await BVPASS.start(ei.value);
        go.disabled = false;
        if (r.error) { err.textContent = gt(r.error); err.hidden = false; art.classList.add('sad'); buzz('bad'); ei.focus(); return; }
        buzz('tap');
        codeStep(r);
      });
      go.style.marginTop = '6px';
      ei.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
      again();
      getCard(main);
      setTimeout(() => { try { ei.focus(); } catch (e) {} }, 350);
    }
    // 2. the code from the email
    function codeStep(st) {
      main.textContent = '';
      const card = el('div', 'card si-card', main);
      sayWithMail(el('p', 'si-sent', card), gt('We emailed a code to {email}. Type it here:', { email: '\u0001' }), st.email);
      const ci = input({ placeholder: '1234 5678', max: 9 });
      ci.inputMode = 'numeric'; ci.autocomplete = 'one-time-code'; ci.dir = 'ltr'; ci.classList.add('si-code');
      ci.setAttribute('aria-label', gt('The 8 numbers from the email'));
      ci.oninput = () => { const t = ci.value.replace(/[^0-9]/g, '').slice(0, 8); const show = t.length > 4 ? t.slice(0, 4) + ' ' + t.slice(4) : t; if (ci.value !== show) ci.value = show; if (t.length === 8) go.click(); };
      card.appendChild(ci);
      el('p', 'muted small', card, gt('It can take a minute to arrive. Look in Spam too. The code works for 15 minutes.')).style.marginTop = '8px';
      const err = el('p', 'si-err', card); err.hidden = true;
      let busy = false;
      const go = btn(gt('Sign in'), { kind: 'go', huge: true, full: true, icon: 'key' }, main, async () => {
        if (busy) return;
        err.hidden = true; art.classList.remove('sad');
        busy = true; go.disabled = true;
        const r = await BVPASS.finish(st.id, st.poll, ci.value, pass.device());
        if (r.error) {
          busy = false; go.disabled = false;
          err.textContent = gt(r.error); err.hidden = false; art.classList.add('sad'); buzz('bad');
          // (too many wrong codes, or the code ran out: a new one is the way on)
          if (/^(too_many_tries|expired_code|claimed|not_found)$/.test(r.code || '')) ci.disabled = true; else ci.select();
          return;
        }
        const acct = { email: r.email || st.email, session: r.session, plan: '', at: Date.now() };
        pass.set(acct);
        const plan = await pass.check();
        busy = false; go.disabled = false;
        // (the server can't say right now: in, and the game asks for the pass itself)
        if (plan || plan === null) { if (plan === null) { acct.plan = 'pro'; pass.set(acct); } return done(); }
        noPlan(pass.get() || acct);
      });
      go.style.marginTop = '6px';
      ci.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
      const r2 = el('div', 'grid2', main); r2.style.marginTop = '10px';
      const re = btn(gt('Send a new code'), { kind: 'ghost' }, r2, async () => {
        re.disabled = true;
        const r = await BVPASS.start(st.email);
        if (r.error) { re.disabled = false; err.textContent = gt(r.error); err.hidden = false; buzz('bad'); return; }
        toast(gt('A new code is on its way.'), 'ok');
        codeStep(r);
      });
      btn(gt('Use another email'), { kind: 'ghost' }, r2, () => emailStep(st.email));
      again();
      setTimeout(() => { try { ci.focus(); } catch (e) {} }, 350);
    }
    const a0 = pass.get();
    if (a0 && !a0.plan) noPlan(a0); else emailStep();
  }
  // the first time a game's QR code opens in the browser: here, or the Games app?
  function gamesChoice() {
    const v = view('Blokvane Games', { tint: 'mint', night: true, app: true });
    const h = hero(v.body, gt('How do you want to play?'), gt('Both go straight into this game. We remember your pick for next time.'));
    h.querySelector('.boo').classList.add('wave');
    const ls = el('div', 'how', v.body);
    const app = el('button', 'how-o rec gm', ls); app.type = 'button';
    const ai = el('span', 'how-ic appic', app); const im = el('img', '', ai); im.src = 'games-192.png'; im.alt = '';
    const at = el('span', 'how-t', app); el('b', '', at, gt('Get the Blokvane Games app')); el('small', '', at, gt('On your home screen, for every game night: one tap, full screen, scan the code right in it.'));
    el('span', 'how-tag', app, gt('Best'));
    const web = el('button', 'how-o', ls); web.type = 'button';
    const wi = el('span', 'how-ic', web); wi.appendChild(icon('globe'));
    const wt = el('span', 'how-t', web); el('b', '', wt, gt('Play here, in the browser')); el('small', '', wt, gt('Nothing to add. It starts right away.'));
    web.onclick = () => { store.set('games:how', 'web'); buzz('tap'); route(); };
    app.onclick = async () => {
      store.set('games:how', 'app'); buzz('tap');
      // (Android: the app shares this phone's browser data, so it opens straight into this game)
      store.set('games:pending', { hash: location.hash, at: Date.now() });
      if (installEvt) { await installApp(); openTheApp(L.parse(location.hash)); return; }
      installSteps({ note: plat() === 'ios' ? gt('Then open Blokvane Games from your home screen, tap "Scan the QR code" and point it at the TV.') : gt('Then open Blokvane Games from your home screen: it goes straight into this game.'), instead: () => { const hh = L.parse(location.hash); if (hh) ss.set('games:here:' + String(hh.parts[0] || '').slice(0, 10), '1'); route(); } });
    };
    el('p', 'muted small center', v.body, gt('You can change this any time on the Games page.')).style.marginTop = '14px';
  }
  // the app was picked before, and this opened in the browser: to the app, or here just this once. As on its design
  // ("Open the App", label above): the Games icon over its glow, Add the app recommended, and the two other ways in.
  // It always fits on one screen: any phone (lying down too), any tablet, any language (oaFit, just below)
  const OA_IC = {
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7.1L12 17.3 5.8 21l1.6-7.1L2 9.2l7.1-.6z" fill="currentColor"/></svg>',
    add: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 8v8M8 12h8"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 5l12 7-12 7z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>'
  };
  function openTheApp(h) {
    store.set('games:pending', { hash: location.hash, at: Date.now() });
    const ios = plat() === 'ios';
    const v = view('Blokvane Games', { tint: 'mint', night: true, app: true });
    app.classList.add('oa');
    const mid = el('div', 'oa-mid', v.body);
    const ic = el('div', 'oa-ic', mid);
    el('i', 'oa-glow', ic);
    const tile = el('div', 'oa-tile', ic);
    tile.innerHTML = SW_BOO('smile').replace('class="sw-boo"', '');
    el('span', 'oa-games', tile, 'GAMES');
    el('h1', 'oa-h', mid, gt('Open the Blokvane Games app'));
    el('p', 'oa-p', mid, ios ? gt('It\'s on your home screen. Open it, tap "Scan the QR code" and point it at the TV. Or type the 6 letters under the QR code.') : gt('It\'s on your home screen. Open it: it goes straight into this game.'));
    const here = () => { ss.set('games:here:' + String((h && h.parts[0]) || '').slice(0, 10), '1'); store.del('games:pending'); route(); };
    const acts = el('div', 'oa-acts', v.body);
    const rec = el('div', 'oa-rec', acts);
    const lab = el('div', 'oa-lab', rec);
    el('i', 'a', lab);
    lab.insertAdjacentHTML('beforeend', OA_IC.star);
    el('span', '', lab, gt('Recommended'));
    lab.insertAdjacentHTML('beforeend', OA_IC.star);
    el('i', 'b', lab);
    const add = el('button', 'oa-add', rec); add.type = 'button';
    add.innerHTML = OA_IC.add; el('span', '', add, gt('Add the app'));
    add.onclick = () => { buzz('tap'); installApp(); };
    const row = el('div', 'oa-row', acts);
    const pill = (ico, text, fn) => { const b = el('button', 'oa-pill', row); b.type = 'button'; b.innerHTML = OA_IC[ico]; el('span', '', b, text); b.onclick = () => { buzz('tap'); fn(); }; return b; };
    pill('play', gt('Play here this time'), here);
    pill('globe', gt('Always the browser'), () => { store.set('games:how', 'web'); here(); });
    oaFit();
    // (again once the fonts are in: the words take their real room)
    try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => oaFit()); } catch (e) {}
    setTimeout(oaFit, 400);
  }
  // how big the Open the app screen is (--oa: 1 is the design): as big as it is drawn on a phone, a little bigger on a
  // tablet, and smaller until it all fits when the screen is short (a small phone, a phone lying down). The two small
  // buttons take two lines, or go one above the other, when their words are long
  let oaWatch = false;
  function oaFit() {
    const a = app;
    if (!a || !a.classList.contains('oa')) return;
    if (!oaWatch) {
      oaWatch = true;
      let t = 0;
      const again = () => { cancelAnimationFrame(t); t = requestAnimationFrame(() => oaFit()); };
      window.addEventListener('resize', again);
      window.addEventListener('orientationchange', () => setTimeout(again, 250));
      try { if (window.visualViewport) visualViewport.addEventListener('resize', again); } catch (e) {}
    }
    // (a browser that doesn't know the screen's own height, 100dvh, gets the height it shows)
    let dv = false;
    try { dv = CSS.supports('height', '100dvh'); } catch (e) {}
    if (!dv && window.innerHeight) a.style.height = window.innerHeight + 'px';
    const W = window.innerWidth || 390;
    const room = Math.min(a.clientHeight || window.innerHeight, window.innerHeight || a.clientHeight);
    const most = Math.min(1.3, Math.max(1, W / 440));
    const row = a.querySelector('.oa-row');
    const set = k => a.style.setProperty('--oa', String(Math.round(k * 1000) / 1000));
    const pills = () => {
      if (!row) return;
      row.classList.remove('wrap', 'stack');
      const kids = Array.prototype.slice.call(row.children);
      if (!kids.some(b => b.scrollWidth > b.clientWidth + 1)) return;
      row.classList.add('wrap');
      const lines = b => { const sp = b.querySelector('span'); const lh = parseFloat(getComputedStyle(sp).lineHeight) || 16; return Math.round(sp.offsetHeight / lh); };
      if (kids.some(b => b.scrollWidth > b.clientWidth + 1 || lines(b) > 2)) row.classList.add('stack');
    };
    const tall = () => { const hs = a.style.height; a.style.height = ''; a.classList.add('oa-m'); const n = a.offsetHeight; a.classList.remove('oa-m'); a.style.height = hs; return n; };
    const fits = k => { set(k); pills(); return tall() <= room + 0.5; };
    // (the biggest size that fits, between half the design and the most: found in a few tries)
    let k = most;
    if (!fits(k)) {
      let lo = 0.5, hi = k;
      if (fits(lo)) {
        for (let i = 0; i < 9 && hi - lo > 0.004; i++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
      }
      k = lo;
      fits(k);
    }
    // (a screen too small even for that: it scrolls, so nothing is ever out of reach)
    a.classList.toggle('oa-scroll', tall() > room + 0.5);
  }
  // the two ways in, as on the design: a QR code and a keyboard, each in a little golden box
  const SW_ICONS = {
    tv: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 5h18v12H3zM8 21h8M12 17v4"/></svg>',
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3z"/><path d="M15 15h2v2h-2zM19 15h2M15 19h2M19 19h2v2"/><path d="M5.5 5.5h1v1h-1zM17.5 5.5h1v1h-1zM5.5 17.5h1v1h-1z" fill="currentColor"/></svg>',
    keys: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2.5"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 14h6"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>'
  };
  // the look: Auto (like this phone), Light or Dark (theme.js keeps it, on this phone only). The three in a row, on
  // the Games home's "Look" and in the menu during a game
  const LOOK_IC = {
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M12 7.5a4.5 4.5 0 0 1 0 9z" fill="currentColor"/><path d="M12 7.5a4.5 4.5 0 0 0 0 9"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'
  };
  const lookNow = () => (window.BVTHEME ? BVTHEME.get() : 'auto');
  function lookRow(parent, after) {
    const row = el('div', 'sw-looks', parent);
    row.setAttribute('role', 'group'); row.setAttribute('aria-label', gt('Look'));
    const paint = () => { for (const b of row.children) b.setAttribute('aria-pressed', String(b.dataset.t === lookNow())); };
    for (const [t, name] of [['auto', gt('Auto')], ['light', gt('Light')], ['dark', gt('Dark')]]) {
      const b = el('button', 'sw-look', row); b.type = 'button'; b.dataset.t = t;
      const i = el('span', 'ic', b); i.innerHTML = LOOK_IC[t];
      el('b', '', b, name);
      b.onclick = () => { buzz('tap'); if (window.BVTHEME) BVTHEME.set(t); paint(); if (after) after(t); };
    }
    paint();
    return row;
  }
  function lookSheet() {
    sheet(gt('Look'), sh => {
      const note = el('p', 'muted', sh);
      const say = () => { note.textContent = lookNow() === 'auto' ? gt('Auto matches this phone: light when the phone is light, dark when it is dark.') : gt('Blokvane Games stays like this on this phone, whatever the phone is set to.'); };
      say();
      lookRow(sh, say);
      if (window.BVTHEME && BVTHEME.samsung) el('p', 'sw-looknote', sh, gt('Samsung Internet repaints every website when its dark mode is on. For Blokvane\'s own colors, open the Samsung Internet menu and tap Light sites. Blokvane Games then shows the look you pick here.'));
    });
  }
  // the language of the app, picked here (or the phone's own)
  function langSheet() {
    const I = window.BVI18N;
    if (!I) { toast(gt('That didn\'t work. Try again.'), 'bad'); return; }
    sheet(gt('Language'), (sh, close) => {
      el('p', 'muted', sh, gt('Blokvane Games shows in this language. A game shows in the language its host picks.'));
      const ls = el('div', 'sw-langs', sh);
      const cur = store.get('games:lang', '');
      const opt = (code, name, sub) => {
        const b = el('button', 'sw-lang', ls); b.type = 'button';
        b.setAttribute('aria-pressed', String(code === cur || (!code && !cur)));
        if (code) b.lang = code;
        el('b', '', b, name);
        if (sub) el('small', '', b, sub);
        b.onclick = async () => {
          buzz('tap');
          if (code) store.set('games:lang', code); else store.del('games:lang');
          await gamesLang(code || '');
          close();
          gamesHome();
        };
      };
      opt('', gt('Same as this phone'), (I.LANGS.find(l => l[0] === I.pick()) || ['', 'English'])[1]);
      for (const [code, name] of I.LANGS) opt(code, name, '');
    });
  }
  // the Games app's own home
  async function gamesHome() {
    // (just added from a game's QR code in the browser: straight into that game)
    const pend = store.get('games:pending', null);
    if (pend && standalone() && typeof pend.hash === 'string' && /^#game\./.test(pend.hash) && Date.now() - (+pend.at || 0) < 15 * 60000) { store.del('games:pending'); location.hash = pend.hash; return; }
    // (opened again soon after a game it didn't leave: back into it, once per opening)
    const bk = store.get('party:back', null);
    let once = false;
    try { once = !!sessionStorage.getItem('bvgo:autoBack'); } catch (e) {}
    if (!once && standalone() && bk && !bk.left && !bk.noAuto && typeof bk.s === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(bk.s) && L.okId(bk.tv) && Date.now() - (+bk.at || 0) < 20 * 60000) {
      try { sessionStorage.setItem('bvgo:autoBack', '1'); } catch (e) {}
      location.hash = '#game.' + bk.s + '.' + bk.tv + (typeof bk.lg === 'string' && /^[a-z]{2}$/.test(bk.lg) ? '.' + bk.lg : '');
      return;
    }
    // (the games' own look, the same as in a game)
    try { (await need('party'))('css'); } catch (e) {}
    const v = view('Blokvane Games', { tint: 'mint', night: true, app: true, get: false });
    // (the language, at the top: one tap to change it)
    const lb = el('button', 'sw-langbtn', v.top);
    lb.type = 'button';
    lb.setAttribute('aria-label', gt('Language'));
    lb.innerHTML = SW_ICONS.globe;
    el('span', '', lb, (window.BVI18N && (BVI18N.LANGS.find(l => l[0] === gl) || [])[1]) || 'English');
    lb.onclick = () => langSheet();
    // (and everything else, the look too: More)
    const mb = el('button', 'sw-lookbtn sw-morebtn', v.top); mb.type = 'button'; mb.setAttribute('aria-label', gt('More'));
    mb.appendChild(icon('dots'));
    mb.onclick = () => { buzz('tap'); moreScreen({ back: gamesHome }); };
    backCard(v.body);
    hero(v.body, gt('Party games'), gt('The game is on the TV, and you play on this phone. Join it:'));
    const tiles = el('div', 'gm-tiles', v.body);
    const tile = (ic, t, sub, fn) => { const b = el('button', 'gm-tile', tiles); b.type = 'button'; const i = el('span', 'sw-ic', b); i.innerHTML = SW_ICONS[ic]; el('b', '', b, t); el('small', '', b, sub); b.onclick = () => { buzz('tap'); fn(); }; return b; };
    tile('qr', gt('Scan the QR code'), gt('Point this phone at the TV'), () => scanScreen());
    tile('keys', gt('Type the code'), gt('The 6 letters under the QR code'), async () => (await need('party'))('code', []));
    // a Chromecast or Google TV on this Wi-Fi: the game starts there, and this phone joins it (cast.js)
    if (typeof BVCAST !== 'undefined' && BVCAST.on) BVCAST.ready().then(ok => {
      if (!ok || !tiles.isConnected) return;
      tile('tv', gt('Cast to a TV'), gt('A Chromecast or Google TV on this Wi-Fi'), async () => {
        const link = await BVCAST.start();
        if (link) { location.href = link; if (L.parse(location.hash)) route(); }
        else toast(gt('The TV did not start the game. Try again, or scan the QR code.'));
      });
    });
    const acct = pass.get(), p = pass.host();
    const c = el('div', 'card gm-host', v.body);
    if (acct && !p) {
      // (signed in, but this email has no plan yet)
      el('h2', '', c, gt('This email can\'t host yet'));
      el('p', 'muted', c, gt('You\'re signed in as {email}. Hosting needs Blokvane Pro or a free trial for that email. Joining a game is always free.', { email: '⁨' + acct.email + '⁩' }));
      btn(gt('How to host'), { kind: 'go', full: true, icon: 'key' }, c, () => signInScreen({ after: gamesHome, back: gamesHome })).style.marginTop = '10px';
      btn(gt('Sign out'), { kind: 'ghost', full: true }, c, () => { pass.clear(); toast(gt('Signed out.')); gamesHome(); }).style.marginTop = '8px';
    } else if (p) {
      el('h2', '', c, '⭐ ' + gt('You can host games'));
      const who = el('p', 'muted', c, gt('Signed in as {email}. Everyone who joins your games plays for free.', { email: '⁨' + p.email + '⁩' }));
      void who;
      // (no Blokvane Pro: the free games)
      if (p.plan === 'free') el('p', 'muted', c, gt('Free games: 15 questions, the same ones each time. A host with Blokvane Pro gets every question.'));
      // (start a game and put it on a TV: one near you, a link for any screen, or your computer)
      btn(gt('Start a game'), { kind: 'go', huge: true, full: true, icon: 'play', sub: gt('On a TV near you, or any screen with a link') }, c, async () => (await need('party'))('start', [], { back: gamesHome })).style.marginTop = '12px';
      const r = el('div', 'grid2', c); r.style.marginTop = '10px';
      btn(gt('Invite friends'), { kind: 'ghost', icon: 'share' }, r, () => shareInvite());
      btn(gt('Sign out'), { kind: 'ghost' }, r, () => { pass.clear(); toast(gt('Signed out.')); gamesHome(); });
    } else {
      el('h2', '', c, gt('Hosting a game night?'));
      el('p', 'muted', c, gt('Each game needs one Blokvane member as its host. Everyone else just joins, without signing in.'));
      btn(gt('Sign in to host'), { kind: 'go', full: true, icon: 'key' }, c, () => signInScreen({ after: gamesHome, back: gamesHome })).style.marginTop = '10px';
      getCard(v.body);
    }
    // (Blokvane's other two apps)
    appsCard(v.body, ['ads', 'remote'], { words: gt });
    if (canGet() && !store.get('gamesAdded', 0)) {
      const ic = el('div', 'card install', v.body);
      const r = el('div', 'install-row', ic);
      const im = el('img', 'install-ic', r); im.src = 'games-192.png'; im.alt = '';
      const t = el('div', '', r); el('b', '', t, gt('Make it an app')); el('p', 'muted small', t, gt('Blokvane Games on your home screen: one tap for every game night.'));
      btn(gt('Add to home screen'), { kind: 'ghost', icon: 'addbox', full: true }, ic, () => getSheet()).style.marginTop = '12px';
    }
    btn(gt('More: look, language, tell a friend'), { kind: 'ghost', icon: 'dots', full: true }, v.body, () => moreScreen({ back: gamesHome })).style.marginTop = '14px';
    if (!standalone() && store.get('games:how', '')) {
      const ch = el('p', 'muted small center', v.body);
      ch.append(store.get('games:how', '') === 'app' ? gt('When you scan a game\'s code: the app.') : gt('When you scan a game\'s code: the browser.'));
      ch.append(' ');
      const a = el('button', 'linkish', ch, gt('Change')); a.type = 'button';
      a.onclick = () => { store.del('games:how'); toast(gt('It asks again next time.')); };
    }
  }
  // the camera, right in the app: it reads the game's QR code on the TV. Android's Chrome reads QR codes by itself
  // (BarcodeDetector); on iPhones (and other browsers) jsQR reads them (vendor/jsQR.min.js, loaded only then).
  async function scanScreen() {
    let stream = null, stopped = false;
    const stop = () => { stopped = true; if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; };
    const v = view(gt('Scan the QR code'), { tint: 'mint', night: true, app: true, step: true, back: () => { stop(); gamesHome(); } });
    const typeIt = async () => { stop(); (await need('party'))('code', []); };
    function noCam(why) {
      stop();
      v.body.textContent = '';
      hero(v.body, why ? gt('The camera is blocked') : plat() === 'ios' ? gt('Use the iPhone\'s Camera') : gt('Type the code instead'), why
        ? (plat() === 'ios' ? gt('Open the iPhone\'s Settings, then Safari (or this app), then Camera, and pick Allow. Or type the 6 letters under the QR code.') : gt('Allow the camera for this page in the browser\'s settings, or type the 6 letters under the QR code.'))
        : plat() === 'ios' ? gt('Open the Camera app, point it at the QR code on the TV, and tap the link that shows. Or type the 6 letters under the QR code here.')
          : gt('This browser can\'t read QR codes. Type the 6 letters under the QR code instead.'), { sleepy: !!why });
      btn(gt('Type the code'), { kind: 'go', full: true, huge: true }, v.body, typeIt);
      if (why) btn(gt('Try the camera again'), { kind: 'ghost', full: true }, v.body, () => scanScreen()).style.marginTop = '10px';
    }
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { noCam(); return; }
    const box = el('div', 'gm-cam', v.body);
    const video = el('video', '', box);
    video.playsInline = true; video.muted = true; video.autoplay = true; video.setAttribute('playsinline', ''); video.setAttribute('muted', '');
    el('div', 'gm-aim', box);
    // Zoom, like the phone's own camera: pinch the picture or move the slider, so the code can be read from the couch.
    // Where the phone lets a web page use the camera's real zoom, that is used (hard). Elsewhere the picture is
    // enlarged on the screen and only its middle is read, at full sharpness.
    let zoom = 1, zmax = 5, hard = null;
    const zrow = el('div', 'gm-zoom', v.body);
    const zout = el('b', 'gm-zoom-n', zrow, '1x');
    const zin = el('input', '', zrow);
    zin.type = 'range'; zin.min = '1'; zin.max = String(zmax); zin.step = '0.1'; zin.value = '1'; zin.setAttribute('aria-label', gt('Zoom'));
    const setZoom = z => {
      zoom = Math.max(1, Math.min(zmax, +z || 1));
      zin.value = String(zoom);
      zout.textContent = (Math.round(zoom * 10) / 10) + 'x';
      if (hard) { try { hard.track.applyConstraints({ advanced: [{ zoom: hard.min * zoom }] }).catch(() => {}); } catch (e) {} }
      else video.style.transform = zoom > 1 ? 'scale(' + zoom + ')' : '';
    };
    zin.addEventListener('input', () => setZoom(zin.value));
    let pinch = 0, pinchFrom = 1;
    const spread = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    box.addEventListener('touchstart', e => { if (e.touches.length === 2) { pinch = spread(e.touches); pinchFrom = zoom; } }, { passive: true });
    box.addEventListener('touchmove', e => { if (e.touches.length === 2 && pinch) { e.preventDefault(); setZoom(pinchFrom * spread(e.touches) / pinch); } }, { passive: false });
    box.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = 0; }, { passive: true });
    box.addEventListener('touchcancel', () => { pinch = 0; }, { passive: true });
    const msg = el('p', 'muted center', v.body, gt('Point the camera at the QR code on the TV.'));
    el('p', 'muted center small', v.body, gt('Far from the TV? Pinch the picture or slide to zoom in.'));
    btn(gt('Type the code instead'), { kind: 'ghost', full: true }, v.body, typeIt).style.marginTop = '10px';
    // the reader first (so the camera doesn't wait for it), then the camera
    let read = null, looks = 0;
    const cv = document.createElement('canvas');
    const g = cv.getContext('2d', { willReadFrequently: true });
    // the part of the camera's picture to read: all of it, or only its middle (zf times closer), never bigger than 960
    // dots a side (a smaller picture reads just as well and fast enough on an older phone)
    const frame = zf => {
      const w0 = video.videoWidth, h0 = video.videoHeight;
      if (!w0 || !h0 || !g) return null;
      const sw = w0 / zf, sh = h0 / zf, k = Math.min(1, 960 / Math.max(sw, sh)), w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
      if (cv.width !== w) cv.width = w;
      if (cv.height !== h) cv.height = h;
      g.drawImage(video, (w0 - sw) / 2, (h0 - sh) / 2, sw, sh, 0, 0, w, h);
      return { w, h };
    };
    // how much closer this look is: what the person chose, or, left at 1x, twice as close every other time (so a code
    // across the room is read without touching anything). With the camera's real zoom the picture itself is closer.
    const closer = () => (!hard && zoom > 1 ? zoom : (looks >> 1) % 2 ? 2 : 1);
    if ('BarcodeDetector' in window) {
      try {
        const det = new BarcodeDetector({ formats: ['qr_code'] });
        read = async () => { const zf = closer(); looks++; if (zf === 1) return (await det.detect(video)).map(c => c.rawValue); return frame(zf) ? (await det.detect(cv)).map(c => c.rawValue) : []; };
      } catch (e) {}
    }
    if (!read) {
      try { await script('vendor/jsQR.min.js?v=1'); } catch (e) {}
      // (already loading from a scan a moment ago: it gets there)
      for (let i = 0; i < 50 && typeof window.jsQR !== 'function' && !stopped; i++) await new Promise(r => setTimeout(r, 100));
      if (stopped) return;
      if (typeof window.jsQR !== 'function') { noCam(); return; }
      read = async () => {
        const zf = closer(), n = looks++, f = frame(zf);
        if (!f) return [];
        // (light on dark too, every other try: some screens show the code that way)
        const r = window.jsQR(g.getImageData(0, 0, f.w, f.h).data, f.w, f.h, { inversionAttempts: n % 2 ? 'onlyInvert' : 'dontInvert' });
        return r && r.data ? [r.data] : [];
      };
    }
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }); }
    catch (e) { if (!stopped) noCam(e && e.name === 'NotAllowedError' ? 'blocked' : ''); return; }
    if (stopped) { stop(); return; }
    try {
      const track = stream.getVideoTracks()[0], caps = track && track.getCapabilities ? track.getCapabilities() : null;
      const zmin = caps && caps.zoom ? +caps.zoom.min || 1 : 0;
      if (zmin && caps.zoom.max / zmin >= 1.5) { hard = { track, min: zmin }; zmax = Math.min(8, caps.zoom.max / zmin); zin.max = String(zmax); }
    } catch (e) {}
    video.srcObject = stream;
    video.play().catch(() => {});
    const tick = async () => {
      if (stopped) return;
      try {
        for (const text of await read()) {
          const hh = gameHash(text);
          if (hh) { stop(); buzz('ok'); location.hash = hh; return; }
          msg.textContent = gt('That isn\'t a Blokvane game\'s code. Point at the one on the TV.');
        }
      } catch (e) {}
      setTimeout(tick, 220);
    };
    tick();
    addEventListener('hashchange', stop, { once: true });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, { once: true });
  }
  // a game's QR code: the part after the # that this page goes to (from any page of Blokvane's: games or the app)
  function gameHash(text) {
    try { const u = new URL(String(text)); if (/^#game\.[A-Za-z0-9_-]{16,64}\.[A-Za-z0-9_-]{4,80}(\.[a-z]{2})?$/.test(u.hash)) return u.hash; } catch (e) {}
    return '';
  }

  // ---------- off we go ----------
  window.GO = { el, icon, boo, swBoo, lookRow, BOO_SVG, toast, buzz, flash, sheet, btn, field, input, seg, toggle, store, view, hero, foot, qr, confetti, def, need, script, webUrl, safeBlob, okImage,
    computer, pairs, savePair, forgetPair, member, deviceName, plat, route, VERSION, installApp, installCard, installSteps, standalone, reconnect, backCard, ownRow, thisPhone, appsCard, moreScreen, getSheet, canGet, say: null, get pc() { return pc; },
    games: GAMES, pass, signInScreen, getCard, shareGames, shareInvite, lang: () => (GAMES ? gl : window.BVI18N ? BVI18N.pick() : 'en'), gt, appDir };
  // (a small helper the browser needs to offer "Install" for this page; it never stores anything, see sw.js)
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  addEventListener('hashchange', () => {
    // (another page of the app, opened by a tap and not by Back: its step in the history is marked, so Back comes
    // back from it)
    if (!nav.trav && history.state == null) {
      try { rawReplace({ bv: nav.idx + 1 }, '', location.href); nav.idx += 1; nav.fresh = true; } catch (e) {}
    }
    nav.trav = false; nav.hash = location.hash;
    // (the computer stays connected on this phone's own pages, like its license and ad blocking: coming back from
    // them is instant. Another computer, or the list of computers, lets it go.)
    if (pc) { const h = L.parse(location.hash); if (!(h && OWN_KINDS.has(h.kind)) && (!h || h.kind !== 'c1' || h.parts[1] !== pc.cid)) { pc.close(); } }
    route();
  });
  if (!(window.crypto && crypto.subtle) || !window.WebSocket) {
    const v = view('Blokvane');
    hero(v.body, 'This browser is too old for this', 'Open this link in Chrome, Safari, Edge or Firefox.', { sleepy: true });
    return;
  }
  // (A copy of Blokvane put on a home screen before could be picked in another app's Share list. Nothing here takes
  // a shared link any more: it is taken out of the address and forgotten, and the page opens as usual.)
  try {
    const q = new URLSearchParams(location.search);
    if (!GAMES && (q.get('url') || q.get('text') || q.get('title'))) history.replaceState(null, '', location.pathname + location.hash);
    sessionStorage.removeItem('bvgo:shared');
  } catch (e) {}
  // (first the connection, from the second copy if the first is gone; then the page)
  keepConnected().finally(async () => {
    if (GAMES) await gamesLang();
    route();
    if (pairs().length) askToKeep();
    // (came here from "Get" in another app or on blokvane.com: straight to adding it)
    if (window.BVAPPS && BVAPPS.wantsGet()) setTimeout(getSheet, 400);
  });
})();
