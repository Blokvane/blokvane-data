// Blokvane on your phone (https://blokvane.github.io/blokvane-data/go/). One page for everything a phone does with
// Blokvane: be the remote for your computer and TV screens, send files and links, share the clipboard, answer Kid mode
// requests, find a lost computer, unlock KeyVane, join a party game or a poll. There is no app and no account.
// What to do is after the # in the address (browsers never send that part to any website): "c1" is your paired
// computer, "p1" pairs one, and each other kind (a poll, a game, a camera for a slide...) has its own. Messages go
// through free public relays, sealed and signed (live-kit.js); big things go straight between the two devices.
// The parts for each kind live in m/*.js and load only when needed, so the page opens fast.
(() => {
  'use strict';
  const L = BVLIVE, C = BVWT_CORE;
  const VERSION = '11';
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
    share: 'M12 15V3M7.5 7.5L12 3l4.5 4.5M6 11H4.5v10h15V11H18', dots: 'M12 5h.01M12 12h.01M12 19h.01', addbox: 'M5 4h14v16H5zM12 8.5v7M8.5 12h7', ghost: 'M12 3a7 7 0 0 1 7 7v10l-2.3-1.7L14.3 20 12 18.3 9.7 20l-2.4-1.7L5 20V10a7 7 0 0 1 7-7zM9.5 10h.01M14.5 10h.01'
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
  // Boo, Blokvane's ghost (drawn here, so it shows even before anything else loads)
  const BOO_SVG = '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#e7ebf5"/></linearGradient></defs>' +
    '<ellipse cx="60" cy="110" rx="26" ry="5" fill="#000" opacity=".25"/><path d="M60 12c22 0 38 17 38 39v42c0 3-3 4-5 2l-7-6-8 7c-2 1-4 1-5 0l-8-7-8 7c-1 1-3 1-5 0l-8-7-7 6c-2 2-5 1-5-2V51c0-22 16-39 38-39z" fill="url(#bg1)" stroke="#2b2346" stroke-width="5" stroke-linejoin="round"/>' +
    '<ellipse class="eye" cx="47" cy="52" rx="6" ry="8" fill="#2b2346"/><ellipse class="eye" cx="73" cy="52" rx="6" ry="8" fill="#2b2346"/><circle cx="49" cy="49" r="2.2" fill="#fff"/><circle cx="75" cy="49" r="2.2" fill="#fff"/>' +
    '<path d="M51 68c5 5 13 5 18 0" fill="none" stroke="#2b2346" stroke-width="4.5" stroke-linecap="round"/><ellipse cx="38" cy="64" rx="6" ry="3.5" fill="#ff8a8a" opacity=".6"/><ellipse cx="82" cy="64" rx="6" ry="3.5" fill="#ff8a8a" opacity=".6"/></svg>';
  function boo(cls) { const b = el('div', 'boo' + (cls ? ' ' + cls : '')); b.innerHTML = BOO_SVG; return b; }

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
    const close = () => { bg.remove(); if (o.onClose) o.onClose(); };
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

  // ---------- the screen ----------
  // view: a fresh page in the app, with a title, the way back, and one color (tint) for the part it belongs to
  const stack = [];
  function view(title, o = {}) {
    app.textContent = '';
    app.className = 'app';
    // (the party games have their own night look: on for their pages, off for every other one)
    document.documentElement.classList.toggle('pt-night', !!o.night);
    // (the other pages are in English, left to right, also right after a game in Arabic)
    if (!o.night) { document.documentElement.dir = 'ltr'; document.documentElement.lang = 'en'; }
    document.documentElement.style.setProperty('--tint', o.tint ? `var(--${o.tint})` : 'var(--coral)');
    const top = el('header', 'top', app);
    if (o.back) {
      const b = el('button', 'back', top);
      b.type = 'button'; b.setAttribute('aria-label', say('Back'));
      b.appendChild(icon('back'));
      b.onclick = () => { if (o.onBack) o.onBack(); o.back(); };
    } else top.appendChild(boo('float'));
    const who = el('div', 'who', top);
    el('h1', '', who, title);
    const sub = el('p', '', who);
    const dot = el('i', 'dot', sub);
    const st = el('span', '', sub, o.status || '');
    if (!o.status && !o.live) sub.hidden = true;
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
    if (o.node) h.appendChild(o.node); else h.appendChild(boo(o.sleepy ? 'sleepy' : 'float'));
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
            if (p) { seenAt = Math.max(seenAt, p.at); if (p.info) info = p.info; if (p.name && p.name !== self.name) { self.name = p.name; savePair({ ...pair, name: p.name }); } }
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
  // the dot and words at the top: connected, looking, or not answering
  let autoRe = false;
  function bindStatus(dot, text, sub) {
    if (!pc) { sub.hidden = true; return; }
    const started = Date.now();
    const off = pc.onStatus(() => {
      if (!document.body.contains(dot)) { off(); return; }
      sub.hidden = false;
      if (pc.here()) { dot.className = 'dot on'; text.textContent = 'Connected'; }
      else if (Date.now() - started < 15000) { dot.className = 'dot wait'; text.textContent = 'Looking for your computer...'; }
      else { dot.className = 'dot off'; text.textContent = 'Not answering. Is it on, with Chrome open?'; }
      // (not answering: once by itself, with every relay tried again; after that, one tap to try again)
      if (!pc.here() && Date.now() - started >= 15000 && !autoRe) { autoRe = true; off(); setTimeout(reconnect, 200); return; }
      let re = sub.querySelector('.re');
      if (!pc.here() && Date.now() - started >= 15000) {
        if (!re) { re = el('button', 're', sub, 'Reconnect'); re.type = 'button'; re.onclick = () => reconnect(); }
      } else if (re) re.remove();
    });
  }

  // ---------- Blokvane as an app icon on the home screen ----------
  // Android (Chrome, Edge, Samsung Internet) can add it for real with one tap: the browser offers it to this page and we
  // show its own "Install" window. iPhones don't let a page do that: there, three picture steps show how (Share, then
  // Add to Home Screen). Either way it is the same page, with its own icon, opening full screen.
  let installEvt = null;
  addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
  addEventListener('appinstalled', () => { installEvt = null; store.set('appAdded', 1); });
  const standalone = () => { try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; } catch (e) { return false; } };
  async function installApp(o = {}) {
    if (installEvt) {
      const e = installEvt; installEvt = null;
      try {
        const shown = e.prompt();
        if (shown && shown.catch) shown.catch(() => {});
        const c = await e.userChoice;
        if (c && c.outcome === 'accepted') { store.set('appAdded', 1); toast('Blokvane is on your home screen now.', 'ok'); return true; }
        return false;
      } catch (er) {}
    }
    installSteps(o);
    return false;
  }
  function installSteps(o = {}) {
    const ua = navigator.userAgent, ios = plat() === 'ios';
    const otherIos = /CriOS|FxiOS|EdgiOS/.test(ua), samsung = /SamsungBrowser/.test(ua);
    const steps = ios
      ? [['share', 'Tap the Share button', otherIos ? 'The square with an arrow, next to the address at the top.' : 'The square with an arrow, at the bottom of Safari.'],
        ['addbox', 'Tap "Add to Home Screen"', 'Scroll down the list a little if you don\'t see it.'],
        ['check', 'Tap "Add"', 'At the top right. Blokvane is now on your home screen.']]
      : plat() === 'android'
        ? [['dots', 'Open the browser menu', samsung ? 'The three lines at the bottom right.' : 'The three dots at the top right.'],
          ['addbox', 'Tap "Install app" or "Add to Home screen"', ''],
          ['check', 'Tap "Install" or "Add"', 'Blokvane is now on your home screen.']]
        : [['addbox', 'In Chrome or Edge: the install icon in the address bar', 'Or the browser menu, then "Install".'], ['check', 'Click "Install"', 'Blokvane gets its own window and icon.']];
    sheet('Add Blokvane to your home screen', (sh, close) => {
      el('p', 'muted', sh, 'It opens like an app, with its own icon, in one tap. Nothing to download from a store.');
      const ls = el('ol', 'steps-pic', sh);
      steps.forEach(([ic, t, sub]) => { const li = el('li', '', ls); const b = el('span', 'ic', li); b.appendChild(icon(ic)); const d = el('div', '', li); el('b', '', d, t); if (sub) el('small', '', d, sub); });
      if (o.note) el('p', 'install-note', sh, o.note);
      if (o.instead) btn('Use it in the browser instead', { kind: 'ghost', full: true }, sh, () => { close(); o.instead(); }).style.marginTop = '12px';
      else btn('Got it', { kind: 'go', full: true }, sh, () => close()).style.marginTop = '12px';
    });
  }
  // a small card on the home page (until it's added, or "Not now" for three weeks)
  function installCard(parent) {
    if (standalone() || store.get('appAdded', 0) || store.get('installHide', 0) > Date.now()) return null;
    const c = el('div', 'card install', parent);
    const r = el('div', 'install-row', c);
    const ic = el('img', 'install-ic', r); ic.src = 'icon-192.png'; ic.alt = '';
    const t = el('div', '', r); el('b', '', t, 'Make Blokvane an app'); el('p', 'muted small', t, 'Add it to your home screen: it opens in one tap, full screen, and stays connected.');
    const row = el('div', 'grid2', c); row.style.marginTop = '12px';
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
    const v = view('All set');
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
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:70';
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
      if (k < 2.6) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  // ---------- where to go ----------
  async function route() {
    if (window.GO) GO.say = null;
    const h = L.parse(location.hash);
    try {
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
  const KINDS = { d1: 'drop', mv1: 'drop', pw1: 'pw', up1: 'pagehelp', sg1: 'pagehelp', poll: 'poll', q1: 'poll', fan: 'fun', light: 'fun', rev: 'fun', cam: 'camera', mon: 'camera', monv: 'camera',
    wb: 'board', game: 'party' };
  // no link: the computers this phone knows, or how to start
  async function home() {
    const list = pairs();
    // ("Other computers" on a computer's page comes here once, to pick)
    const picking = store.get('pick', 0);
    if (picking) store.del('pick');
    if (list.length === 1 && !picking) { history.replaceState(null, '', '#c1.' + list[0].s + '.' + list[0].cid); return (await need('home'))(list[0]); }
    const v = view('Blokvane');
    const gameCard = () => {
      const c = el('div', 'card', v.body);
      el('h2', '', c, 'Joining a game or a poll?');
      el('p', '', c, 'Scan the QR code on the TV with your phone\'s camera. No app needed. Or type the code under it:');
      btn('Type a game code', { kind: 'tint', full: true, icon: 'game' }, c, async () => (await need('party'))('code', []));
    };
    if (!list.length) {
      backCard(v.body);
      hero(v.body, 'Blokvane on your phone', 'Connect this phone to Blokvane on your computer: there, open Blokvane, then Connect, and scan the QR code with this phone\'s camera.');
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
    gameCard();
    foot();
  }

  // a party game this phone was in a little while ago (its page was closed by mistake, say): one tap goes back in, as
  // the same player, with the same score
  function backCard(parent) {
    const b = store.get('party:back', null);
    if (!b || typeof b.s !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(b.s) || !L.okId(b.tv) || !(Date.now() - (+b.at || 0) < 3 * 3600e3)) return null;
    const c = el('div', 'card', parent);
    c.style.borderColor = 'color-mix(in srgb, var(--pink) 45%, var(--line))';
    el('h2', '', c, '🎉 ' + (typeof b.name === 'string' && b.name ? L.clean(b.name, 40) : 'Party game'));
    el('p', 'muted', c, 'You were in this game a little while ago. Go back in as yourself, with your score.');
    btn('Back to the game', { kind: 'go', full: true, icon: 'play' }, c, () => { location.hash = '#game.' + b.s + '.' + b.tv + (typeof b.lg === 'string' && /^[a-z]{2}$/.test(b.lg) ? '.' + b.lg : ''); });
    return c;
  }

  // ---------- off we go ----------
  window.GO = { el, icon, boo, BOO_SVG, toast, buzz, flash, sheet, btn, field, input, seg, toggle, store, view, hero, foot, qr, confetti, def, need, script, webUrl, safeBlob, okImage,
    computer, pairs, savePair, forgetPair, member, deviceName, plat, route, VERSION, installApp, installCard, installSteps, standalone, reconnect, backCard, say: null, get pc() { return pc; } };
  // (a small helper the browser needs to offer "Install" for this page; it never stores anything, see sw.js)
  try { if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  addEventListener('hashchange', () => { if (pc) { const h = L.parse(location.hash); if (!h || h.kind !== 'c1' || h.parts[1] !== pc.cid) { pc.close(); } } route(); });
  if (!(window.crypto && crypto.subtle) || typeof BigInt !== 'function' || !window.WebSocket) {
    const v = view('Blokvane');
    hero(v.body, 'This browser is too old for this', 'Open this link in Chrome, Safari, Edge or Firefox.', { sleepy: true });
    return;
  }
  // (first the connection, from the second copy if the first is gone; then the page)
  keepConnected().finally(() => { route(); if (pairs().length) askToKeep(); });
})();
