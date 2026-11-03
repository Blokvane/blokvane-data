// Blokvane party games: Where in the World? The TV shows a flag, a city or a famous sight (a real photo, in a new
// frame every round), everyone drops a pin on the world map on their phone, and the TV flies over the map to the real
// spot: every pin lands, lines show how far each one was, and the closest pin wins the round. The map is map.js, the
// places (every flag, 130 cities, 120 sights, names in all seven languages) are world-data.js, the photos come from
// Wikipedia (free photos from Wikimedia Commons, with their credit on the screen).
(() => {
  'use strict';
  const P = BVPLAYC, PK = BVPACKS, M = BVMAP;
  const BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  const VER = (((document.currentScript && document.currentScript.src) || '').match(/[?&]v=(\w+)/) || [])[1] || '1';
  const LANGS = ['en', 'es', 'fr', 'hi', 'bn', 'zh', 'ar'];
  const sleepRaw = ms => new Promise(r => setTimeout(r, ms));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => P.shuffle(a.slice());
  // ---------- the places (world-data.js, loaded once, as soon as the game is picked) ----------
  let dataP = null;
  function loadData() {
    if (window.BVWD) return Promise.resolve(window.BVWD);
    if (!dataP) {
      dataP = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = BASE + 'world-data.js?v=' + VER;
        s.onload = () => (window.BVWD ? res(window.BVWD) : rej(new Error('data')));
        s.onerror = () => { dataP = null; rej(new Error('data')); };
        document.head.appendChild(s);
      });
    }
    return dataP;
  }
  // ---------- where each map is: [west, south, east, north] ----------
  const AREAS = {
    world: [-180, -60, 180, 80], europe: [-25, 34, 45, 71.5], asia: [25, -11, 150, 60], africa: [-20, -36, 55, 38],
    americas: [-170, -56, -30, 72], oceania: [110, -50, 180, 0], me: [24, 11, 64, 43], us: [-170, 17, -64, 72]
  };
  const ME = new Set(['tr', 'cy', 'lb', 'sy', 'il', 'ps', 'jo', 'iq', 'ir', 'sa', 'ye', 'om', 'ae', 'qa', 'bh', 'kw', 'eg']);
  const CONT = { af: 'Africa', as: 'Asia', eu: 'Europe', na: 'North America', sa: 'South America', oc: 'Oceania' };
  const AREA_CONT = { europe: ['eu'], asia: ['as'], africa: ['af'], americas: ['na', 'sa'], oceania: ['oc'] };
  // US states: the four regions, for the hint
  const US_REGION = { California: 'W', Texas: 'S', Florida: 'S', 'New York': 'NE', Alaska: 'W', Hawaii: 'W', Washington: 'W', Colorado: 'W', Arizona: 'W', Nevada: 'W', Utah: 'W', Oregon: 'W', Illinois: 'MW', Michigan: 'MW', Ohio: 'MW', Georgia: 'S', Maine: 'NE', Louisiana: 'S', Tennessee: 'S', Montana: 'W', Minnesota: 'MW', 'North Carolina': 'S', Pennsylvania: 'NE', Massachusetts: 'NE', Wyoming: 'W' };
  const US_HINT = { W: 'It\'s in the West.', MW: 'It\'s in the Midwest.', S: 'It\'s in the South.', NE: 'It\'s in the Northeast.' };
  const inBox = (b, lon, lat) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];

  // every place as one kind of thing: { kind, id, key, lon, lat, lv, cc, names[7], iata, emoji, wiki, me }
  function allItems(D, K) {
    // (a few territories use the very same flag as their country: those aren't asked, nobody could tell them apart)
    const SAME = new Set(['bv', 'sj', 'mf', 'um', 'hm']);
    const flags = D.flags.map(f => ({ kind: 'flag', same: SAME.has(f[0]), id: f[0], key: 'f:' + f[0], cc: f[0], lon: +f[1], lat: +f[2], lv: +f[3] || 3, cont: f[4], names: f[5], me: ME.has(f[0]) }));
    const contOf = {};
    for (const f of flags) contOf[f.cc] = f.cont;
    const cities = D.cities.map(c => ({ kind: 'city', id: c[0], key: 'c:' + c[0], lon: +c[1], lat: +c[2], lv: +c[3] || 2, cc: c[4], iata: c[5], wiki: c[6], names: c[7], me: c[8] === 'me', cont: contOf[c[4]] }));
    const sights = D.sights.map(c => ({ kind: 'sight', id: c[0], key: 's:' + c[0], lon: +c[1], lat: +c[2], lv: +c[3] || 2, cc: c[4], emoji: c[5], wiki: c[6], names: c[7], me: c[8] === 'me', cont: contOf[c[4]] }));
    // (US states: from the game's own packs, in the TV's language)
    const LP = K.packs;
    const states = PK.places.states.map((x, i) => ({ kind: 'state', id: x[0], key: 'u:' + x[0], lon: x[1], lat: x[2], lv: i < 9 ? 1 : i < 17 ? 2 : 3, names: LANGS.map((lg, j) => j === 0 ? x[0] : (lg === K.lang && LP && LP.places && LP.places.states && LP.places.states[i]) || x[0]), region: US_REGION[x[0]] }));
    return { flags: flags.filter(f => !f.same), allFlags: flags, cities, sights, states, contOf };
  }
  // (names that are plural in a language ask "Where are ...?"; two places in Jerusalem show no country, only the region)
  const PLURAL = { en: ['easter-island', 'petronas-towers', 'kuwait-towers', 'sundarbans'], es: ['easter-island', 'niagara-falls', 'victoria-falls', 'iguazu-falls', 'petronas-towers', 'kuwait-towers', 'sundarbans'],
    fr: ['easter-island', 'niagara-falls', 'victoria-falls', 'iguazu-falls', 'petronas-towers', 'kuwait-towers', 'sundarbans', 'meteora'] };
  const plural = (it, lg) => !!(PLURAL[lg] && PLURAL[lg].includes(it.id));
  const NOCOUNTRY = new Set(['jerusalem', 'dome-of-the-rock']);
  const nameIn = (it, lg) => (it.names && it.names[LANGS.indexOf(lg)]) || (it.names && it.names[0]) || it.id;
  // (a name on its own starts with a capital letter: "the Colosseum" in a question, "The Colosseum" on a label)
  const cap = t => { const s = String(t || ''); return s ? s[0].toLocaleUpperCase() + s.slice(1) : s; };

  // ---------- picking this game's places: a new mix every game ----------
  // (this screen remembers what it showed in its last games, and shows other places first)
  const SEEN = 'bvplay:world:seen';
  const seenList = () => { try { return JSON.parse(localStorage.getItem(SEEN) || '[]'); } catch (e) { return []; } };
  function markSeen(keys) { try { const l = seenList().filter(k => !keys.includes(k)); localStorage.setItem(SEEN, JSON.stringify(l.concat(keys).slice(-900))); } catch (e) {} }
  function choose(pool, n, level) {
    const seen = seenList(), age = new Map(seen.map((k, i) => [k, i + 1]));
    // (never seen first, then the ones seen longest ago; a little shuffle so it's never the same order)
    const fresh = x => (age.get(x.key) || 0) + Math.random() * 40;
    const byLv = l => shuffle(pool.filter(x => x.lv === l)).sort((a, b) => fresh(a) - fresh(b));
    const lv = [byLv(1), byLv(2), byLv(3)];
    const want = [];
    if (level === 'easy') want.push(...Array(n).fill(0));
    else if (level === 'medium') want.push(...Array(n).fill(1));
    else if (level === 'hard') want.push(...Array(n).fill(2));
    else { const e = Math.ceil(n * 0.4), h = Math.floor(n * 0.25); for (let i = 0; i < n; i++) want.push(i < e ? 0 : i < n - h ? 1 : 2); }
    const out = [];
    for (const w of want) {
      // (not enough of that level here: the nearest level fills in)
      const order = [w, w + 1, w - 1, w + 2, w - 2].filter(x => x >= 0 && x <= 2);
      for (const l of order) { if (lv[l].length) { out.push(lv[l].shift()); break; } }
    }
    return out;
  }
  // a mix: flags, cities and sights in turns, never three of one kind in a row
  function interleave(lists, n) {
    const out = [];
    const left = lists.map(l => l.slice());
    while (out.length < n && left.some(l => l.length)) {
      const ok = left.map((l, i) => i).filter(i => left[i].length && !(out.length >= 2 && out[out.length - 1].kind === left[i][0].kind && out[out.length - 2].kind === left[i][0].kind));
      const from = ok.length ? ok : left.map((l, i) => i).filter(i => left[i].length);
      out.push(left[pick(from)].shift());
    }
    return out;
  }

  // ---------- real photos from Wikipedia (free photos from Wikimedia Commons only, each with its credit) ----------
  const WIKI = 'https://en.wikipedia.org/w/api.php';
  const PHOTO = 'bvplay:world:photos';
  const BAD_NAME = /montage|collage|mosaic|composite|map|flag|coat.?of.?arms|seal|logo|locator|location|diagram|chart|plan\b|emblem|symbol|signature|stamp|banknote|coin|portrait|drawing|painting|engraving|lithograph|sketch|icon|svg$|png$|gif$|tiff?$|\b1[5-8]\d\d\b|\b19[0-5]\d\b/i;
  const GOOD_NAME = /skyline|cityscape|aerial|panorama|view|overview|downtown|centre|center|harbou?r|old.?town|night|sunset|bridge|square|cathedral|mosque|temple|beach|from/i;
  function photoCache() { try { return JSON.parse(localStorage.getItem(PHOTO) || '{}'); } catch (e) { return {}; } }
  function savePhoto(title, v) { try { const c = photoCache(); c[title] = Object.assign({ t: Date.now() }, v); const keys = Object.keys(c); if (keys.length > 400) for (const k of keys.sort((a, b) => c[a].t - c[b].t).slice(0, keys.length - 400)) delete c[k]; localStorage.setItem(PHOTO, JSON.stringify(c)); } catch (e) {} }
  async function wapi(params) {
    const u = new URL(WIKI);
    for (const [k, v] of Object.entries(Object.assign({ action: 'query', format: 'json', formatversion: '2', origin: '*' }, params))) u.searchParams.set(k, v);
    const ac = window.AbortController ? new AbortController() : null;
    const t = setTimeout(() => { if (ac) ac.abort(); }, 7000);
    try {
      const r = await fetch(u.href, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: ac ? ac.signal : undefined });
      if (!r.ok) throw new Error('wiki');
      return await r.json();
    } finally { clearTimeout(t); }
  }
  const strip = h => { const d = document.createElement('div'); d.innerHTML = String(h || ''); return (d.textContent || '').replace(/\s+/g, ' ').trim(); };
  // the facts about some files: where a 1600 px copy is, its size, its license and who took it (Commons files only)
  async function fileInfo(names) {
    const out = new Map();
    for (let i = 0; i < names.length; i += 40) {
      const part = names.slice(i, i + 40);
      const j = await wapi({ prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', iiextmetadatafilter: 'LicenseShortName|Artist|NonFree|Credit', titles: part.map(n => 'File:' + n).join('|') });
      for (const pg of (j.query && j.query.pages) || []) {
        const ii = pg.imageinfo && pg.imageinfo[0];
        if (!ii || pg.imagerepository !== 'shared') continue;
        const md = ii.extmetadata || {};
        if (md.NonFree && String(md.NonFree.value) === 'true') continue;
        const lic = strip(md.LicenseShortName && md.LicenseShortName.value);
        if (!/^(cc|public domain|pd|gfdl|attribution)/i.test(lic)) continue;
        const who = strip(md.Artist && md.Artist.value).slice(0, 48);
        out.set(String(pg.title || '').replace(/^File:/, ''), { src: ii.thumburl || ii.url, w: ii.width, h: ii.height, mime: ii.mime, credit: (who ? who + ', ' : '') + lic + ', Wikimedia Commons' });
      }
    }
    return out;
  }
  // one good photo for each place: the article's own photo when it's a real landscape photo; otherwise (a city's
  // collage, say) the best landscape photo further down the article
  async function photosFor(items) {
    const cache = photoCache(), out = new Map(), todo = [];
    for (const it of items) {
      if (!it.wiki) continue;
      const c = cache[it.wiki];
      if (c && c.src && Date.now() - c.t < 20 * 86400e3) out.set(it.key, c);
      else if (!(c && c.none && Date.now() - c.t < 3 * 86400e3)) todo.push(it);
    }
    if (!todo.length) return out;
    try {
      const titles = [...new Set(todo.map(it => it.wiki))];
      const lead = new Map();
      for (let i = 0; i < titles.length; i += 40) {
        const j = await wapi({ prop: 'pageimages', piprop: 'name|original', pilicense: 'free', redirects: '1', titles: titles.slice(i, i + 40).join('|') });
        const back = new Map();
        for (const r of [...((j.query && j.query.normalized) || []), ...((j.query && j.query.redirects) || [])]) back.set(r.to, back.get(r.from) || r.from);
        for (const pg of (j.query && j.query.pages) || []) {
          const asked = back.get(pg.title) || pg.title;
          if (pg.pageimage) lead.set(asked, { name: pg.pageimage, w: pg.original && pg.original.width, h: pg.original && pg.original.height, page: pg.title });
        }
      }
      const okShape = (w, h) => w && h && w / h >= 1.18 && w / h <= 2.3 && w >= 900;
      const first = [...lead.values()].filter(x => okShape(x.w, x.h) && !BAD_NAME.test(x.name)).map(x => x.name);
      const info = first.length ? await fileInfo(first) : new Map();
      const need = [];
      for (const t of titles) {
        const l = lead.get(t);
        const fi = l && info.get(l.name.replace(/_/g, ' '));
        if (fi) { savePhoto(t, fi); for (const it of todo) if (it.wiki === t) out.set(it.key, fi); }
        else need.push(t);
      }
      // (the rest: the photos in the article, best first)
      if (need.length) {
        const cand = new Map();
        for (let i = 0; i < need.length; i += 15) {
          const j = await wapi({ prop: 'images', imlimit: 'max', redirects: '1', titles: need.slice(i, i + 15).join('|') });
          const back = new Map();
          for (const r of [...((j.query && j.query.normalized) || []), ...((j.query && j.query.redirects) || [])]) back.set(r.to, back.get(r.from) || r.from);
          for (const pg of (j.query && j.query.pages) || []) {
            const asked = back.get(pg.title) || pg.title;
            const word = asked.split(/[ ,(]/)[0].toLowerCase();
            const list = (pg.images || []).map(x => String(x.title).replace(/^File:/, '')).filter(n => /\.jpe?g$/i.test(n) && !BAD_NAME.test(n));
            list.sort((a, b) => score(b, word) - score(a, word));
            cand.set(asked, list.slice(0, 8));
          }
        }
        const all = [...new Set([...cand.values()].flat())];
        const inf = all.length ? await fileInfo(all) : new Map();
        for (const t of need) {
          const best = (cand.get(t) || []).map(n => inf.get(n.replace(/_/g, ' '))).find(fi => fi && okShape(fi.w, fi.h) && /jpe?g/.test(fi.mime || ''));
          if (best) { savePhoto(t, best); for (const it of todo) if (it.wiki === t) out.set(it.key, best); }
          else savePhoto(t, { none: true });
        }
      }
    } catch (e) {}
    return out;
  }
  function score(name, word) {
    const n = name.toLowerCase();
    return (n.includes(word) ? 3 : 0) + (GOOD_NAME.test(n) ? 2 : 0) + (/night|sunset|aerial|skyline/.test(n) ? 1 : 0) - (/(19|20)\d\d/.test(n) ? 0 : 0);
  }
  // (a photo is used only once it has loaded: wait for it a moment, else the round uses a drawn picture)
  const loaded = new Map();
  function preload(src) {
    if (!src) return Promise.resolve(false);
    if (!loaded.has(src)) loaded.set(src, new Promise(res => { const im = new Image(); im.referrerPolicy = 'no-referrer'; im.decoding = 'async'; im.onload = () => res(true); im.onerror = () => res(false); im.src = src; }));
    return loaded.get(src);
  }
  // a flag's own shape (its picture's width and height)
  const flagSize = new Map();
  function flagImg(cc) {
    const src = BASE + 'flags/' + cc + '.png';
    if (!flagSize.has(cc)) flagSize.set(cc, new Promise(res => { const im = new Image(); im.onload = () => res([im.naturalWidth || 640, im.naturalHeight || 427]); im.onerror = () => res([640, 427]); im.src = src; }));
    return { src, size: flagSize.get(cc) };
  }

  window.BVWORLD = { plural, NOCOUNTRY, loadData, allItems, nameIn, cap, choose, interleave, markSeen, photosFor, preload, flagImg, AREAS, ME, CONT, AREA_CONT, US_HINT, inBox, LANGS, BASE, pick, shuffle, sleepRaw };
})();

// ---------- the pictures of a round: many frames, a new one every round ----------
// Each scene builds its picture in the stage and says its color (for the place's name in the question), where the
// question goes (under the picture, over it like the flags, or beside it) and which sound starts it.
(() => {
  'use strict';
  const W = BVWORLD, M = BVMAP;
  const div = (cls, at, html) => { const e = document.createElement('div'); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (at) at.appendChild(e); return e; };
  const boo = (cls, at) => div('boo-f' + (cls ? ' ' + cls : ''), at, M.BOO);
  const pinEl = (at, o) => { const w = div('pinw', at); const b = div('bob', w); const p = M.pin(o || {}); b.appendChild(p); return w; };
  const img = (src, at, cls) => { const i = document.createElement('img'); i.src = src; i.alt = ''; i.decoding = 'async'; i.referrerPolicy = 'no-referrer'; if (cls) i.className = cls; at.appendChild(i); return i; };
  const photo = (c, at, cls) => { const p = div('ph' + (cls ? ' ' + cls : ''), at); img(c.photo.src, p); return p; };
  const flagEl = (c, at) => img(c.flag.src, at, 'fl');
  const PU = c => c.U; // one --u in pixels
  // ---- cities and sights, drawn ----
  const PLACE = {
    pin(h, c) { const r = div('rings', h, '<i></i><i></i><i></i>'); const st = div('stack', r); pinEl(st, { size: 12.5 * PU(c) }); div('shadow', st); c.fx('whoosh'); return { color: '#ffc83d' }; },
    radar(h, c) {
      const s = div('scope', h); div('grid', s); div('sweep', s);
      for (const [x, y, col, d] of [[22, 30, '#3d8bff', 0.35], [70, 26, '#2fd59a', 0.9], [74, 70, '#ffc83d', 1.7], [26, 72, '#b9a8ff', 2.5]]) { const b = div('blip', s); b.style.cssText = `--x:${x}%;--y:${y}%;--c:${col};--d:${d}s`; }
      pinEl(s, { size: 10 * PU(c) }); c.fx('ping', 250); c.fx('ping', 3450, { vol: 0.5 });
      return { color: '#2fd59a' };
    },
    postcard(h, c) {
      const k = div('card', h); div('div', k); div('ln', k); div('ln', k); div('ln', k);
      pinEl(k, { size: 10 * PU(c) }); const st = div('stamp', k); boo('', st);
      c.fx('whoosh'); c.fx('stamp', 650);
      return { color: '#ff8a65' };
    },
    globe(h, c) {
      const w = div('wrap', h); pinEl(w, { size: 10 * PU(c) }); div('shadow', w);
      const b = div('ball', w); const t = div('tex', b); t.style.setProperty('--map', `url(${M.BASE}z0.jpg)`);
      div('grid', b, '<svg viewBox="0 0 100 100"><g fill="none" stroke="rgba(190,220,255,.35)" stroke-width=".6"><ellipse cx="50" cy="50" rx="49" ry="49"/><ellipse cx="50" cy="50" rx="34" ry="49"/><ellipse cx="50" cy="50" rx="17" ry="49"/><path d="M50 1V99M1 50H99M6 27H94M6 73H94"/></g></svg>');
      div('shade', b); c.fx('globe', 100); return { color: '#ffc83d' };
    },
    path(h, c) {
      const box = div('box', h), id = 'wqm' + Math.random().toString(36).slice(2, 8);
      const D = 'M70 290C170 120 290 140 360 210S520 300 560 92';
      box.innerHTML = `<svg viewBox="0 0 680 360"><defs><mask id="${id}" maskUnits="userSpaceOnUse"><path class="rev" d="${D}" stroke="#fff" stroke-width="34" fill="none" stroke-linecap="round"/></mask></defs><path class="trail" mask="url(#${id})" d="${D}"/><circle class="start" cx="70" cy="290" r="11"/><g class="x" transform="translate(520 300)"><path d="M-16 -16L16 16M16 -16L-16 16"/></g></svg>`;
      const rev = box.querySelector('.rev'), svg = box.querySelector('svg');
      const walker = div('walker', box); walker.appendChild(M.pin({ size: 9 * PU(c) }));
      const len = rev.getTotalLength();
      rev.style.strokeDasharray = len + ' ' + len; rev.style.strokeDashoffset = String(len);
      // (the dotted trail draws itself with the pin hopping along it, then the pin jumps onto the X)
      const toBox = (x, y) => { const k = (svg.clientWidth || 680) / 680; return [x * k, y * k]; };
      const t0 = performance.now(), dur = 1800;
      const step = t => {
        if (!box.isConnected) return;
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 2), d = len * e;
        const p = rev.getPointAtLength(d), [x, y] = toBox(p.x, p.y);
        rev.style.strokeDashoffset = String(len - d);
        walker.style.transform = `translate(${x}px,${y - Math.abs(Math.sin(e * Math.PI * 6)) * 1.8 * PU(c)}px)`;
        if (k < 1) { requestAnimationFrame(step); return; }
        const [ex, ey] = toBox(520, 300);
        walker.animate([{ transform: `translate(${x}px,${y}px)` }, { transform: `translate(${(x + ex) / 2}px,${Math.min(y, ey) - 8 * PU(c)}px)` }, { transform: `translate(${ex}px,${ey}px)` }], { duration: 700, easing: 'ease-in-out', fill: 'forwards' });
        c.fx('pop', 650, { rate: 1.35 });
      };
      requestAnimationFrame(step);
      for (let i = 0; i < 6; i++) c.fx('pop', 150 + i * 280, { rate: 0.85 + i * 0.07, vol: 0.45 });
      return { color: '#ffc83d' };
    },
    neon(h, c) {
      const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      s.setAttribute('viewBox', '0 0 120 150'); s.setAttribute('class', 'sign');
      s.innerHTML = '<path d="M60 146C60 146 12 92 12 56A48 48 0 1 1 108 56C108 92 60 146 60 146Z"/><path d="M60 26C46 26 38 37 38 51V80q4.5-5 9 0t8.5 0t8.5 0t8.5 0t9.5 0V51C82 37 74 26 60 26Z"/><ellipse class="eye" cx="51.5" cy="52" rx="3.6" ry="5"/><ellipse class="eye" cx="68.5" cy="52" rx="3.6" ry="5"/>';
      h.appendChild(s); setTimeout(() => s.classList.add('hum'), 1400);
      c.fx('neon', 50); return { color: '#8ff4ff', neon: true, stage: 'dark' };
    },
    ticket(h, c) {
      const t = div('tk', h); const m = div('main', t); const r = div('route', m);
      const from = document.createElement('b'); from.textContent = '???'; r.appendChild(from);
      div('ar', r); const to = document.createElement('b'); to.className = 'to'; r.appendChild(to); div('bar', m);
      const stub = div('stub', t); stub.appendChild(M.pin({ size: 7.5 * PU(c), color: '#ffc83d' }));
      // (the code flips through letters like a departures board, then stops on the city's)
      const code = String(c.it.iata || c.it.cc || '???').toUpperCase().slice(0, 3);
      const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let n = 0; const iv = setInterval(() => { n++; to.textContent = [...code].map((ch, i) => (n > 6 + i * 3 ? ch : A[Math.floor(Math.random() * 26)])).join(''); if (n > 6 + code.length * 3) clearInterval(iv); }, 70);
      c.fx('print', 150); return { color: '#ff5a6e' };
    },
    spot(h, c) { div('beam', h); div('floor', h); pinEl(h, { size: 11 * PU(c) }); c.fx('spot', 80); c.fx('sparkle', 900, { vol: 0.6 }); return { color: '#ffc83d', stage: 'dark' }; }
  };
  // ---- the flags ----
  const FLAG = {
    frame(h, c) { const f = div('fr', h); flagEl(c, f); div('sheen', f); boo('peek', f); c.fx('whoosh'); c.fx('sparkle', 700, { vol: 0.5 }); return {}; },
    pole(h, c) {
      const w = div('wrap', h); div('pole', w); const cl = div('cloth', w);
      cl.style.setProperty('--img', `url(${c.flag.src})`);
      const N = 16;
      for (let i = 0; i < N; i++) { const s = document.createElement('i'); s.style.setProperty('--px', `calc(var(--fh) * var(--ar) * ${-i / N})`); s.style.setProperty('--d', `${-i * 0.11}s`); cl.appendChild(s); }
      boo('base', w); c.fx('flutter', 150); return {};
    },
    polaroid(h, c) {
      const p = div('pol', h); div('tape', p); flagEl(c, p); const cap = div('cap', p); cap.textContent = '???'; boo('peek', p);
      const fl = div('wq-flash', c.stage); setTimeout(() => fl.remove(), 900); c.fx('shutter'); return {};
    },
    passport(h, c) {
      const pp = div('pp', h); const cv = div('cover', pp); const e = div('emb', cv); boo('', e); const b = document.createElement('b'); b.textContent = 'PASSPORT'; cv.appendChild(b);
      const pg = div('page', pp); const fw = div('fw', pg); flagEl(c, fw); const s = div('seal', pg); s.textContent = '?';
      c.fx('flip', 100); c.fx('stamp', 950); return {};
    },
    tv(h, c) {
      const w = div('tvw', h); const set = div('set', w); const scr = div('scr', set); flagEl(c, scr); div('scan', scr);
      const nz = div('noise', scr); nz.style.setProperty('--noise', `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.4 -.2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`);
      div('live', scr, '<i></i>LIVE'); div('stand', w); c.fx('static', 50);
      return { stage: 'dark' };
    },
    museum(h, c) {
      div('lamp', h); const a = div('art', h); const f = div('frm', a); const m = div('mat', f); flagEl(c, m);
      const pl = div('plaque', a); boo('', pl); const t = document.createElement('span'); t.textContent = c.untitled + ', ????'; pl.appendChild(t);
      c.fx('sparkle', 200); return {};
    },
    cards(h, c) { const d = div('deck', h); div('back', d); const f = div('front', d); flagEl(c, f); const coin = div('coin', d); coin.textContent = '?'; boo('peek', d); c.fx('flip', 250); c.fx('coin', 900); return {}; },
    stage(h, c) { div('beam', h); div('disc', h); const f = div('float', h); flagEl(c, f); boo('side', h); c.fx('spot', 60); c.fx('sparkle', 900, { vol: 0.5 }); return { stage: 'dark' }; }
  };
  // ---- real photos ----
  const PHOTO = {
    badge(h, c) { const f = div('fr', h); photo(c, f); const q = div('coin', f); q.textContent = '?'; c.fx('whoosh'); c.fx('coin', 750); return { color: '#ffc83d' }; },
    postcard(h, c) { const k = div('card', h); photo(c, k); const st = div('stamp', k); boo('', st); c.fx('whoosh'); c.fx('stamp', 650); return { color: '#ffc83d' }; },
    stack(h, c) { const p = div('pile', h); div('bk a', p); div('bk b', p); const pol = div('pol', p); photo(c, pol); const cap = div('cap', pol); cap.textContent = '???'; c.fx('shutter', 100); return { color: '#ffc83d' }; },
    bino(h, c) { const b = div('bino', h); const l = div('lens', b); photo(c, l); boo('top', b); c.fx('focus', 200); return { color: '#ffc83d', stage: 'blue' }; },
    arch(h, c) { const a = div('arch', h); photo(c, a); c.fx('sparkle', 150); return { color: '#ffc83d', side: true }; },
    window(h, c) { const w = div('win', h); const p = photo(c, w); div('cloud a', p); div('cloud b', p); div('shade', w); boo('wing', w); c.fx('plane', 0, { vol: 0.55 }); return { color: '#8fd3ff' }; },
    phone(h, c) {
      const d = div('dev', h); photo(c, d); div('bar', d); const loc = div('loc', d); loc.textContent = '📍 ???'; const ht = div('heart', d); ht.textContent = '❤️';
      boo('side', d); c.fx('shutter', 300); return { color: '#ff8fb1' };
    },
    film(h, c) { const s = div('strip', h); photo(c, s, 'dim'); photo(c, s, 'mid'); photo(c, s, 'dim'); c.fx('print', 100); return { color: '#ffc83d' }; },
    mag(h, c) {
      const b = div('base', h); photo(c, b, 'dim'); const lit = photo(c, b, 'lit'); void lit; const g = div('glass', b);
      // (the glass wanders over the photo and settles in the middle)
      const pts = [[30, 40], [64, 32], [52, 66], [74, 58], [50, 50]];
      let i = 0; const t0 = performance.now();
      const step = t => { if (!b.isConnected) return; const k = (t - t0) / 1100; i = Math.min(pts.length - 1, Math.floor(k)); const f = Math.min(1, k - i); const a = pts[i], z = pts[Math.min(pts.length - 1, i + 1)]; const e = f < .5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2; b.style.setProperty('--mx', (a[0] + (z[0] - a[0]) * e) + '%'); b.style.setProperty('--my', (a[1] + (z[1] - a[1]) * e) + '%'); if (k < pts.length - 1) requestAnimationFrame(step); };
      b.style.setProperty('--mx', '30%'); b.style.setProperty('--my', '40%'); requestAnimationFrame(step); void g;
      c.fx('focus', 300); return { color: '#ffc83d' };
    },
    journal(h, c) {
      const p = div('page', h); photo(c, p); div('tp a', p); div('tp b', p); div('ring', p);
      const d = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); d.setAttribute('viewBox', '0 0 200 120'); d.setAttribute('class', 'doodle');
      d.innerHTML = '<path d="M10 110C40 40 110 100 150 40"/><path class="plane" d="M150 40l34-16-12 30-8-10z"/>'; p.appendChild(d);
      c.fx('stamp', 300); return { color: '#ffc83d' };
    }
  };
  // a deck of scenes for each kind of round, shuffled, so a game never shows the same frame twice in a row
  function deck(names) { let q = []; let last = ''; return () => { if (!q.length) { q = W.shuffle(names); if (q[0] === last && q.length > 1) q.push(q.shift()); } last = q.shift(); return last; }; }
  window.BVWORLD_SCENES = { PLACE, FLAG, PHOTO, deck, div, boo, img };
})();

// ---------- the game ----------
(() => {
  'use strict';
  const P = BVPLAYC, M = BVMAP, W = BVWORLD, SC = BVWORLD_SCENES;
  const LANGS = W.LANGS;
  const { div } = SC;
  const KM_MI = 0.621371;
  const CONT_ORDER = ['af', 'as', 'eu', 'na', 'sa', 'oc'];
  // what each player hears when the answer shows: a few lines for every distance, picked at random (and never the
  // same one twice in a game), with one of Boo's faces
  const SAY = {
    top: [['Bullseye!', 'boo:hero'], ['Nailed it!', 'boo:legend'], ['Human GPS!', 'boo:cool'], ['Spot on!', 'boo:party'], ['Right on the dot!', 'boo:hero'], ['Are you a pilot?', 'boo:legend']],
    close: [['So close!', 'boo:wow'], ['Almost there!', 'boo:love'], ['You could walk there!', 'boo:cool'], ['Great eye!', 'boo:wow'], ['Just around the corner!', 'boo:love']],
    mid: [['Not bad!', 'boo:hi'], ['Warm!', 'boo:cool'], ['In the neighborhood!', 'boo:hi'], ['Pretty good!', 'boo:party']],
    far: [['A bit off!', 'boo:laugh'], ['Wrong neighborhood!', 'boo:mind'], ['Lukewarm...', 'boo:boring'], ['Close-ish?', 'boo:laugh']],
    lost: [['Wrong continent!', 'boo:laugh'], ['Did you get lost?', 'boo:mind'], ['Boo\'s map is upside down too!', 'boo:laugh'], ['That\'s a long swim!', 'boo:ugh'], ['Other side of the world!', 'boo:boring'], ['Need a passport for that one?', 'boo:laugh']]
  };
  const tierOf = (d, scale) => (d <= scale * 0.012 ? 'top' : d <= scale * 0.16 ? 'close' : d <= scale * 0.8 ? 'mid' : d <= scale * 2.8 ? 'far' : 'lost');
  const AREA_OPTS = [['world', 'The whole world', 'Every country, city and sight on Earth.'], ['europe', 'Europe'], ['asia', 'Asia'], ['africa', 'Africa'], ['americas', 'The Americas'], ['oceania', 'Oceania'],
    ['me', 'The Middle East', 'From Egypt and Turkey to Iran and the Gulf.'], ['us', 'US states', 'The states, on a map of the US.']];
  const WHAT = [['mix', 'A mix', 'Flags, cities and famous sights.'], ['flags', 'Flags'], ['cities', 'Cities'], ['landmarks', 'Famous sights']];
  const stageOf = (i, n) => { const e = Math.ceil(n / 3), h = Math.floor(n / 3); return i < e ? 'easy' : i < n - h ? 'medium' : 'hard'; };
  // (one --u in pixels on this screen)
  function uPx() { const t = document.createElement('div'); t.style.cssText = 'position:absolute;visibility:hidden;height:calc(100 * var(--u))'; document.body.appendChild(t); const v = t.offsetHeight / 100; t.remove(); return v || 8; }
  // a line in the game's language, or in one player's own
  const trIn = (K, lg, text, vars) => (!lg || lg === K.lang ? K.tr(text, vars) : K.trFor(lg, text, vars));
  // ---------- a country's outline (world-data.js: tenths of a degree), for "is the pin inside it" ----------
  const ringCache = new Map();
  function rings(D, cc) {
    if (ringCache.has(cc)) return ringCache.get(cc);
    const d = D.shapes && D.shapes[cc];
    const out = [];
    if (d) {
      let cur = null, x = 0, y = 0;
      const tok = String(d).match(/[MmLlZz]|-?\d+(?:\.\d+)?/g) || [];
      let cmd = 'M';
      for (let i = 0; i < tok.length;) {
        const t = tok[i];
        if (/[MmLlZz]/.test(t)) { cmd = t; i++; if (cmd === 'Z' || cmd === 'z') { cur = null; } continue; }
        const a = +tok[i], b = +tok[i + 1]; i += 2;
        if (cmd === 'M') { x = a; y = b; cur = [[x, y]]; out.push(cur); cmd = 'L'; }
        else if (cmd === 'm') { x += a; y += b; cur = [[x, y]]; out.push(cur); cmd = 'l'; }
        else if (cmd === 'L') { x = a; y = b; if (cur) cur.push([x, y]); }
        else { x += a; y += b; if (cur) cur.push([x, y]); }
      }
    }
    ringCache.set(cc, out);
    return out;
  }
  function inside(rs, X, Y) {
    let c = false;
    for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > Y) !== (yj > Y) && X < (xj - xi) * (Y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  // how far a pin is from the answer, in km: 0 inside the country (a flag), else to its nearest edge, or to the spot
  function distance(D, it, lon, lat) {
    if (it.kind === 'flag') {
      const rs = rings(D, it.cc);
      if (rs.length) {
        const X = (lon + 180) * 10, Y = (90 - lat) * 10;
        if (inside(rs, X, Y)) return 0;
        let best = Infinity;
        for (const r of rs) for (const [x, y] of r) { const dd = P.km([lon, lat], [x / 10 - 180, 90 - y / 10]); if (dd < best) best = dd; }
        return Math.min(best, P.km([lon, lat], [it.lon, it.lat]));
      }
    }
    return P.km([lon, lat], [it.lon, it.lat]);
  }

  // ---------- the clock ----------
  function clock(parent, sec, fx) {
    const r = div('wq-clock', parent);
    r.innerHTML = '<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><b></b>';
    const fg = r.querySelector('.fg'), n = r.querySelector('b');
    let left = sec, t = 0;
    if (!(sec > 0)) { n.textContent = '∞'; n.classList.add('inf'); return { node: r, go() {}, stop() { r.classList.add('off'); }, left: () => Infinity }; }
    n.textContent = String(sec);
    const tick = () => {
      if (!r.isConnected) { clearInterval(t); return; }
      left--;
      n.textContent = String(Math.max(0, left));
      fg.style.strokeDashoffset = String(276.5 * (1 - Math.max(0, left) / sec));
      if (left <= 5 && left > 0) { r.classList.add('hurry'); fx('tick'); }
      if (left <= 0) { clearInterval(t); r.classList.remove('hurry'); }
    };
    return { node: r, go() { if (!t) t = setInterval(tick, 1000); }, stop() { clearInterval(t); r.classList.remove('hurry'); r.classList.add('off'); }, left: () => left };
  }
  // ---------- the scoreboard (who pinned, then the points) ----------
  async function board(K, side, teamOf) {
    const hd = div('wq-bh', side);
    div('dot', hd);
    const t = document.createElement('b'); t.textContent = await K.tr('Scoreboard'); hd.appendChild(t);
    const cnt = document.createElement('span'); hd.appendChild(cnt);
    const list = div('wq-rows', side);
    const note = div('wq-note', side); note.textContent = await K.tr('The closest pin wins the round.');
    const W2 = { wait: await K.tr('pinning...'), in: await K.tr('Pinned!'), away: await K.tr('Away') };
    const rows = new Map(), shown = new Map();
    const pinned = new Set();
    let total = 0;
    const row = p => {
      let r = rows.get(p.id);
      if (r) return r;
      r = div('wq-p', list);
      const av = div('av', r); av.style.setProperty('--pc', teamOf(p) || p.color || '#ff6b5e');
      const im = document.createElement('img'); im.src = K.avatarUrl(p); im.alt = ''; av.appendChild(im);
      const nm = div('nm', r); const b = document.createElement('b'); b.textContent = p.name; nm.appendChild(b);
      r._st = document.createElement('small'); nm.appendChild(r._st);
      r._pts = div('pts', r);
      rows.set(p.id, r); shown.set(p.id, p.score);
      return r;
    };
    const draw = () => {
      const ps = K.players().slice().sort((a, b) => b.score - a.score);
      for (const [id, r] of rows) if (!ps.some(p => p.id === id)) { r.remove(); rows.delete(id); }
      list.classList.toggle('many', ps.length > 6);
      list.classList.toggle('two', ps.length > 11);
      for (const p of ps) {
        const r = row(p);
        list.appendChild(r);
        r.classList.toggle('away', !!p.away);
        r.classList.toggle('in', pinned.has(p.id));
        r._st.textContent = p.away ? W2.away : pinned.has(p.id) ? '✓ ' + W2.in : W2.wait;
        r._pts.textContent = K.num(shown.get(p.id) != null ? shown.get(p.id) : p.score);
      }
      if (total) cnt.textContent = K.f('{n} of {total} pinned', { n: K.num([...pinned].length), total: K.num(total) });
    };
    const tr2 = async () => { const x = await K.tr('{n} of {total} pinned', { n: K.num(pinned.size), total: K.num(total) }); cnt.textContent = x; };
    return {
      draw,
      start(n) { total = n; pinned.clear(); draw(); tr2(); },
      pin(id) { pinned.add(id); draw(); tr2(); const r = rows.get(id); if (r) r.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 360 }); },
      done() { cnt.textContent = ''; for (const r of rows.values()) r._st.textContent = ''; },
      best(id) { for (const [k, r] of rows) r.classList.toggle('best', k === id); },
      // (the points go up on the board, counting)
      add(p, pts) {
        const r = row(p); const from = shown.get(p.id) || 0, to = p.score;
        if (pts > 0) { const pl = div('plus', r); pl.textContent = '+' + K.num(pts); setTimeout(() => pl.remove(), 2400); }
        const t0 = performance.now();
        const step = t => { const k = Math.min(1, (t - t0) / 900); const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); shown.set(p.id, v); r._pts.textContent = K.num(v); if (k < 1) requestAnimationFrame(step); else { shown.set(p.id, to); setTimeout(draw, 300); } };
        requestAnimationFrame(step);
      }
    };
  }
  // ---------- Boo's plane, between rounds ----------
  const PLANE = '<svg viewBox="0 0 220 110"><path d="M18 58c0-12 22-20 60-20h70c26 0 44 9 50 20-6 11-24 20-50 20H78c-38 0-60-8-60-20z" fill="#fff"/><path d="M96 58l-26 42h22l40-42z" fill="#ff5a6e"/><path d="M96 54l-22-40h20l38 40z" fill="#ff8a8a"/><path d="M26 56L8 30h16l20 22z" fill="#ff5a6e"/><circle cx="168" cy="54" r="14" fill="#cfe6ff" stroke="#9cc8ff" stroke-width="3"/><path d="M162 50a2.4 3.2 0 1 0 .1 0M174 50a2.4 3.2 0 1 0 .1 0" fill="#24164a"/><rect x="198" y="38" width="5" height="34" rx="2.5" fill="#ffc83d"/><g fill="#9cc8ff"><circle cx="118" cy="54" r="5"/><circle cx="136" cy="54" r="5"/><circle cx="100" cy="54" r="5"/></g></svg>';
  function plane() {
    const tr = div('wq-trail', document.body), pl = div('wq-plane', document.body, PLANE);
    setTimeout(() => { tr.remove(); pl.remove(); }, 1900);
  }

  // ---------- one round's screen: the top bar, the stage with its picture, the scoreboard ----------
  async function screen(K, ctx, it, i, n, ph, decks) {
    const body = K.view(null);
    body.classList.add('wq');
    const top = div('wq-top', body);
    const pill = div('wq-pill', top);
    const ic = document.createElement('img'); ic.src = 'icons/world.webp'; ic.alt = ''; pill.appendChild(ic);
    const rt = await K.tr('Round {n} / {total}', { n: '\u0001', total: K.num(n) });
    const [ra, rb] = rt.split('\u0001');
    const lab = document.createElement('span'); lab.append(ra || ''); const em = document.createElement('em'); em.textContent = K.num(i + 1); lab.appendChild(em); const of = document.createElement('span'); of.className = 'of'; of.textContent = rb || ''; lab.appendChild(of); pill.appendChild(lab);
    const segs = div('wq-segs', top);
    for (let k = 0; k < n; k++) { const s = document.createElement('i'); if (k < i) s.className = 'done'; if (k === i) s.className = 'now'; segs.appendChild(s); }
    const ck = clock(top, ctx.kids ? 0 : ctx.sec, nm => ctx.fx(nm));
    const mid = div('wq-mid', body);
    const stage = div('wq-stage', mid);
    const side = div('wq-side', mid);
    const bd = await board(K, side, ctx.teamOf);
    // the picture: a flag in one of its frames; a city or sight as a real photo (most of the time) or drawn
    const host = div('sc', stage);
    const c = { K, it, photo: ph, flag: it.kind === 'flag' ? W.flagImg(it.cc) : null, fx: (nm, d, o) => ctx.fx(nm, d, o), U: ctx.U, stage, untitled: ctx.untitled };
    let kind, name;
    if (it.kind === 'flag') { kind = 'FLAG'; name = decks.flag(); const [w, h] = await c.flag.size; host.style.setProperty('--ar', String(Math.max(.9, Math.min(2.2, w / h)))); }
    else if (ph && (it.kind === 'sight' || Math.random() < 0.72)) { kind = 'PHOTO'; name = decks.photo(); }
    else { kind = 'PLACE'; name = it.kind === 'sight' ? decks.drawnSight() : decks.place(); }
    host.classList.add({ FLAG: 'sf-', PHOTO: 'sp-', PLACE: 'sc-' }[kind] + name);
    const look = SC[kind][name](host, c) || {};
    if (look.stage) stage.classList.add(look.stage);
    if (look.side) stage.classList.add('side');
    // the question: the place's name in its own color
    const q = div('wq-q', stage);
    if (look.neon) q.classList.add('neon');
    if (look.color) q.style.setProperty('--qc', look.color);
    if (it.kind === 'flag') q.textContent = await K.tr('Where is this flag\'s country?');
    else {
      const t = await K.tr(W.plural(it, K.lang) ? 'Where are {place}?' : 'Where is {place}?', { place: '\u0001' });
      const nm = t.startsWith('\u0001') ? W.cap(W.nameIn(it, K.lang)) : W.nameIn(it, K.lang);
      const [a, b] = t.split('\u0001');
      q.append(a || '');
      const e = document.createElement('em'); e.textContent = nm + (/^[\s?؟？!।]*$/.test(b || '') ? (b || '') : ''); q.appendChild(e);
      if (!/^[\s?؟？!।]*$/.test(b || '')) q.append(b);
      const len = [...(a || '') + nm + (b || '')].length;
      if (len > 34) q.classList.add('xlong'); else if (len > 22) q.classList.add('long');
    }
    q.dir = 'auto';
    // (flags: the question over the picture, a line under it; a photo beside the question when the frame is tall)
    if (it.kind === 'flag') {
      stage.classList.add('flagq');
      stage.insertBefore(q, host);
      const tip = div('wq-tip', stage, '<svg viewBox="0 0 64 84"><path d="M32 83C32 83 5 53 5 31.5A27 27 0 1 1 59 31.5C59 53 32 83 32 83Z" fill="#ff5a6e"/><circle cx="32" cy="31" r="11" fill="#fff"/></svg>');
      tip.append(await K.tr('Drop a pin on the map on your phone'));
    }
    if (ph && kind === 'PHOTO') { const cr = div('wq-credit', stage); cr.textContent = '📷 ' + ph.credit; }
    const hints = div('wq-hints', stage);
    return { body, stage, host, q, hints, board: bd, clock: ck, segs };
  }

  // ---------- the hints: label-style lines that read well in every language ----------
  async function hintsFor(K, ctx, it, lg) {
    const out = [];
    const nm = n2 => W.cap(n2);
    if (it.kind === 'state') {
      const reg = { W: 'West', MW: 'Midwest', S: 'South', NE: 'Northeast' }[it.region];
      if (reg) out.push({ icon: '🧭', text: await trIn(K, lg, 'Region: {place}', { place: await trIn(K, lg, reg) }) });
      return out;
    }
    const cont = it.cont && W.CONT[it.cont];
    if (cont) {
      const lp = lg && lg !== K.lang ? (window.BVI18N && BVI18N.packs(lg)) : K.packs;
      const i = BVPACKS.continents.findIndex(c => c[0] === cont);
      const cn = (lp && lp.continents && lp.continents[i]) || await trIn(K, lg, cont);
      out.push({ icon: '🌍', text: await trIn(K, lg, 'Continent: {place}', { place: cn }) });
    }
    if (it.kind === 'flag') {
      const near = (ctx.D.near && ctx.D.near[it.cc]) || [];
      const nb = near.length ? ctx.byCode.get(W.pick(near)) : null;
      if (nb) out.push({ icon: '🤝', flag: W.flagImg(nb.cc).src, text: await trIn(K, lg, 'Neighbor: {place}', { place: nm(W.nameIn(nb, lg || K.lang)) }) });
      const own = String(W.nameIn(it, lg || K.lang)).replace((lg || K.lang) === 'ar' ? /^ال/ : /^$/, '');
      let first = own;
      try { if (window.Intl && Intl.Segmenter) for (const g of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(own)) { first = g.segment; break; } else first = [...own][0]; } catch (e) { first = [...own][0]; }
      out.push({ icon: '🔤', text: await trIn(K, lg, 'First letter: {c}', { c: W.cap(first) }) });
    } else if (it.cc && ctx.byCode.get(it.cc) && !W.NOCOUNTRY.has(it.id)) {
      const co = ctx.byCode.get(it.cc);
      out.push({ icon: '📍', flag: W.flagImg(co.cc).src, text: await trIn(K, lg, 'Country: {place}', { place: nm(W.nameIn(co, lg || K.lang)) }) });
    }
    return out;
  }
  function showHint(v, h) {
    const tip = v.stage.querySelector('.wq-tip');
    if (tip) tip.classList.add('gone');
    const c = div('wq-hint', v.hints);
    if (h.flag) { const im = document.createElement('img'); im.src = h.flag; im.alt = ''; c.appendChild(im); } else { const i = document.createElement('i'); i.textContent = h.icon; c.appendChild(i); }
    const t = document.createElement('span'); t.textContent = h.text; t.dir = 'auto'; c.appendChild(t);
  }

  // ---------- after the pins: the map ----------
  async function reveal(K, ctx, it, got, v) {
    const s = K.settings, U = ctx.U;
    const D = ctx.D;
    v.stage.textContent = '';
    v.stage.className = 'wq-stage map';
    const wrap = div('wq-map', v.stage);
    const map = M.create(wrap, { maxS: 2.3 });
    const box = ctx.areaBox;
    map.fit(box, { pad: U * 2 });
    const [ax, ay] = M.xy(it.lon, it.lat);
    // every pin: who, where, how far, how many points
    const scale = ctx.us ? 450 : s.map === 'world' ? 1900 : 900;
    const pins = [];
    for (const [id, a] of got) {
      const p = K.player(id);
      if (!p || !Array.isArray(a.v)) continue;
      const lon = +a.v[0], lat = +a.v[1];
      if (!(Math.abs(lon) <= 180 && Math.abs(lat) <= 90)) continue;
      const d = distance(D, it, lon, lat);
      pins.push({ p, lon, lat, d, xy: M.xy(lon, lat), ms: a.ms || 0 });
    }
    pins.sort((a, b) => a.d - b.d || a.ms - b.ms);
    const best = pins.length ? pins[0].d : Infinity;
    for (const x of pins) {
      x.tier = tierOf(x.d, scale);
      if (s.score === 'top') x.pts = x.d <= best + 0.5 ? 100 : 0;
      else x.pts = Math.round(100 * Math.exp(-x.d / scale));
    }
    const units = s.units === 'km' ? 'km' : 'mi';
    const distTxt = (d, lg) => trIn(K, lg, units === 'km' ? '{n} km' : '{n} mi', { n: K.num(Math.round(units === 'km' ? d : d * KM_MI)) });
    await K.sleep(500);
    // 1. the pins land, one by one
    const order = W.shuffle(pins);
    for (const x of order) {
      if (K.over()) return;
      const el = M.pin({ color: ctx.teamOf(x.p) || x.p.color, img: K.avatarUrl(x.p), cls: 'wq-pin wq-drop' });
      x.mark = map.add(el, x.xy[0], x.xy[1]);
      ctx.fx('pop', 0, { rate: 0.85 + Math.random() * 0.5 });
      await K.sleep(Math.max(90, 520 / Math.max(1, pins.length)));
    }
    // 2. a drum roll, then the real spot
    ctx.fx('drumroll');
    await K.sleep(1750);
    if (K.over()) return;
    ctx.fx('land');
    if (it.kind === 'flag' && D.shapes && D.shapes[it.cc]) {
      const g = map.shape(D.shapes[it.cc], { fill: 'rgba(255,200,61,.42)', stroke: '#ffd166', 'stroke-width': String(Math.max(2, U * .35)), 'stroke-linejoin': 'round' });
      g.style.filter = 'drop-shadow(0 0 ' + (U * 1.2) + 'px rgba(255,200,61,.9))';
      g.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: .65 }, { opacity: 1 }], { duration: 1600, fill: 'forwards' });
    }
    for (const k of ['', ' b']) map.add(div('wq-wave' + k), ax, ay);
    const ans = M.pin({ color: '#ff5a6e', cls: '' });
    const aw = div('wq-ans'); aw.appendChild(ans);
    map.add(aw, ax, ay);
    // (its name: the flag, the city with its country's flag, or the sight with its emoji)
    const tag = div('wq-tag');
    tag.style.setProperty('--off', '10.6');
    if (it.kind === 'flag' || (it.cc && ctx.byCode.get(it.cc) && !W.NOCOUNTRY.has(it.id))) { const im = document.createElement('img'); im.src = W.flagImg(it.kind === 'flag' ? it.cc : it.cc).src; im.alt = ''; tag.appendChild(im); }
    else if (it.emoji) tag.append(it.emoji + ' ');
    const tn = document.createElement('span'); tn.textContent = W.cap(W.nameIn(it, K.lang)); tn.dir = 'auto'; tag.appendChild(tn);
    if (it.kind !== 'flag' && it.cc && ctx.byCode.get(it.cc) && !W.NOCOUNTRY.has(it.id)) { const sm = document.createElement('small'); sm.textContent = W.cap(W.nameIn(ctx.byCode.get(it.cc), K.lang)); tag.appendChild(sm); }
    map.add(tag, ax, ay);
    setTimeout(() => keepIn(wrap), 50);
    K.boo(pins.length && pins[0].tier === 'top' ? 'wow' : 'hi');
    await K.sleep(900);
    // 3. the camera takes in every pin and the real spot
    const span = (xs, ys, minW, minH) => { let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); if (x1 - x0 < minW) { const c = (x0 + x1) / 2; x0 = c - minW / 2; x1 = c + minW / 2; } if (y1 - y0 < minH) { const c = (y0 + y1) / 2; y0 = c - minH / 2; y1 = c + minH / 2; } return [x0, y0, x1, y1]; };
    const K1 = M.K;
    const allBox = span([ax, ...pins.map(x => x.xy[0])], [ay, ...pins.map(x => x.xy[1])], 26 * K1, 14 * K1);
    await map.fit(allBox, { pad: U * 6, top: U * 13, ms: 1500 });
    keepIn(wrap);
    if (K.over()) return;
    // 4. a line from every pin to the spot, and how far it was
    for (const x of pins) {
      const ln = map.line(x.xy[0], x.xy[1], x.xy[0], x.xy[1], { stroke: ctx.teamOf(x.p) || x.p.color, 'stroke-width': String(Math.max(2, U * .42)), 'stroke-dasharray': (U * 1.3) + ' ' + (U * .9), opacity: '.95' });
      const t0 = performance.now(), dur = 650;
      const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); ln.setAttribute('x2', x.xy[0] + (ax - x.xy[0]) * e); ln.setAttribute('y2', x.xy[1] + (ay - x.xy[1]) * e); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
    if (pins.length) ctx.fx('zip');
    await K.sleep(750);
    for (const x of pins) {
      const dd = div('wq-dist'); dd.style.setProperty('--pc', ctx.teamOf(x.p) || x.p.color);
      const b = document.createElement('b'); b.textContent = x.d === 0 ? '🎯 ' + x.p.name : x.p.name + ' · ' + await distTxt(x.d); dd.appendChild(b);
      if (x.pts > 0) { const pt = document.createElement('i'); pt.textContent = '+' + K.num(x.pts); dd.appendChild(pt); }
      map.add(dd, x.xy[0], x.xy[1]);
    }
    // 5. the closest pin gets a crown, and everyone gets a word from Boo: kind ones when close, funny ones when far
    const used = ctx.used;
    const say = async (x, lg) => {
      const opts = SAY[x.tier].filter(l => !used.has(l[0]));
      const l = W.pick(opts.length ? opts : SAY[x.tier]);
      used.add(l[0]);
      return [await trIn(K, lg, l[0]), l[1]];
    };
    if (pins.length) {
      const top = pins.filter(x => x.d <= best + 0.5);
      for (const x of top) { const cr = div('wq-crown'); cr.textContent = '👑'; map.add(cr, x.xy[0], x.xy[1]); }
      v.board.best(top[0].p.id);
      ctx.fx(top[0].tier === 'top' ? 'bull' : 'sparkle');
      if (top[0].tier === 'top' || top[0].tier === 'close') try { P.confetti(top[0].tier === 'top' ? 160 : 70); } catch (e) {}
    }
    // (bubbles for a few players: the closest, the farthest, and one or two in between)
    const pickSay = pins.length <= 5 ? pins : [pins[0], pins[1], pins[Math.floor(pins.length / 2)], pins[pins.length - 1]];
    for (const x of [...new Set(pickSay)]) {
      const [line, face] = await say(x, K.lang);
      x.line = line; x.face = face;
      const sb = div('wq-say ' + x.tier);
      const im = document.createElement('img'); im.src = P.booUri(face); im.alt = ''; sb.appendChild(im);
      const sp = document.createElement('span'); sp.textContent = line; sp.dir = 'auto'; sb.appendChild(sp);
      map.add(sb, x.xy[0], x.xy[1]);
      keepIn(wrap);
      await K.sleep(220);
    }
    setTimeout(() => keepIn(wrap), 700);
    // (the points: on the board, and on every phone, in each player's own language)
    for (const x of pins) {
      x.p.score += x.pts;
      v.board.add(x.p, x.pts);
      const lg = K.langOf(x.p.id) || K.lang;
      let line = x.line, face = x.face;
      if (!line || lg !== K.lang) { const r = await say(x, lg); line = r[0]; face = face || r[1]; }
      K.result(x.p.id, { ok: x.tier === 'top' || x.tier === 'close', first: x === pins[0] && pins.length > 1, pts: x.pts, score: x.p.score, note: x.d === 0 ? await trIn(K, lg, 'Right inside it!') : await distTxt(x.d, lg), title: line, boo: face });
    }
    // (nobody pinned: Boo shrugs)
    for (const p of K.players()) if (!pins.some(x => x.p.id === p.id) && got.has(p.id) === false && !p.away) K.result(p.id, { ok: false, pts: 0, score: p.score, title: await trIn(K, K.langOf(p.id) || K.lang, 'No pin this time!'), boo: 'boo:sad' });
    await K.sleep(1300);
    // 6. and closer: the spot and the closest pins, to see who really got it
    if (pins.length) {
      const near = pins.filter(x => x.d <= Math.max(best * 2.2, best + 150)).slice(0, 4);
      const nb = span([ax, ...near.map(x => x.xy[0])], [ay, ...near.map(x => x.xy[1])], 16 * K1, 9 * K1);
      if ((nb[2] - nb[0]) < (allBox[2] - allBox[0]) * 0.7) { await map.fit(nb, { pad: U * 8, top: U * 13, ms: 1400 }); keepIn(wrap); }
    }
    v.board.done();
    return pins;
  }

  // (labels near the edge of the map slide back in, and the place's name goes under its pin at the top edge)
  function keepIn(box) {
    const R = box.getBoundingClientRect(), m = 10;
    for (const t of box.querySelectorAll('.wq-tag, .wq-say')) {
      t.style.setProperty('--dx', '0px');
      const r = t.getBoundingClientRect();
      let dx = 0;
      if (r.left < R.left + m) dx = R.left + m - r.left; else if (r.right > R.right - m) dx = R.right - m - r.right;
      t.style.setProperty('--dx', Math.round(dx) + 'px');
      if (t.classList.contains('wq-tag')) { t.classList.remove('below'); if (t.getBoundingClientRect().top < R.top + m) t.classList.add('below'); }
    }
  }
  // ---------- moving on: by itself after a short wait, or when the host taps Next round ----------
  async function nextIn(K, v, secs) {
    const pill = div('wq-next', v.stage);
    for (let n = secs; n > 0 && !K.over(); n--) { pill.textContent = '⏭️ ' + await K.tr('Next round in {n}', { n: K.num(n) }); await K.sleep(1000); }
  }
  async function hostNext(K, v, n) {
    const pill = div('wq-next', v.stage); pill.textContent = '⏸️ ' + await K.tr('Waiting for the host to start the next round');
    const label = await K.tr('Next round');
    let go = false;
    const off = K.on('next', (m, p) => { if (+m.n === n && K.isHost(p.id)) go = true; });
    K.hostWait(true);
    for (let k = 0; !go && !K.over(); k++) {
      if (k % 8 === 0) { const h = K.players().find(p => K.isHost(p.id)); if (h) K.sayTo(h.id, { k: 'nextq', n, label }); }
      await K.sleep(500);
    }
    K.hostWait(false); off();
  }
  function hostReveal(K, n) {
    let on = true;
    (async () => {
      const label = await K.tr('Show the answer');
      const off = K.on('reveal', (m, p) => { if (+m.n === n && K.isHost(p.id)) K.close(n); });
      for (let k = 0; on && !K.over(); k++) { if (k % 8 === 0) { const h = K.players().find(p => K.isHost(p.id)); if (h) K.sayTo(h.id, { k: 'revealq', n, label }); } await K.sleep(500); }
      off();
    })();
    return () => { on = false; };
  }

  BVPLAY.game({
    id: 'world', name: 'Where in the World?', emoji: '🌍', sub: 'Drop a pin on the map. The closest pin wins.', teams: true, teamsWin: true, mlang: true,
    step: ['Drop your pin', 'Pinch the map on your phone and tap where it is.'], deco: '🌍📍🧭✈️',
    rules: ['The TV shows a flag, a city or a famous sight.', 'Drop your pin on the map on your phone (pinch to zoom).', 'The closer your pin, the more points you get.'],
    credit: 'Flags: flagcdn.com (public domain). Photos: Wikimedia Commons.',
    sounds: ['theme', 'easy', 'medium', 'hard', 'last2', 'between', 'timesup', 'win', 'whoosh', 'plane', 'ping', 'stamp', 'shutter', 'static', 'neon', 'print', 'spot', 'sparkle', 'flip', 'flutter', 'pop', 'tick', 'hint', 'drumroll', 'land', 'zip', 'bull', 'globe', 'focus', 'coin'],
    // (the places start loading in the lobby, while people join)
    prep: () => { W.loadData().catch(() => {}); const im = new Image(); im.src = M.BASE + 'z0.jpg'; },
    steps: [{ t: 'The map', s: 'Map', keys: ['lang', 'map', 'what'] }, { t: 'Rounds', keys: ['rounds', 'level'] }, { t: 'Timing', s: 'Time', keys: ['sec', 'next', 'wait'] },
      { t: 'Extras', keys: ['hints', 'photos', 'score', 'units', 'teams', 'teamN', 'kids'] }],
    spot: s => {
      const area = AREA_OPTS.find(x => x[0] === s.map) || AREA_OPTS[0];
      const what = s.map === 'us' ? ['us', 'US states', 'The states, on a map of the US.'] : WHAT.find(x => x[0] === s.what) || WHAT[0];
      const bullets = [['📍', 'The closest pin wins the round'], s.hints !== false ? ['💡', 'Hints show up as the clock runs down'] : ['🧠', 'No hints: just you and the map'], s.photos !== false && s.map !== 'us' ? ['📸', 'Real photos of the cities and sights'] : ['🎨', 'A new picture every round']];
      if (s.kids) bullets.splice(0, 3, ['🧸', 'Kids mode: tap the right continent'], ['🌍', 'No distances, no timer'], ['🎉', 'Great with kids']);
      const facts = [['🗺️', area[1]], ['🔁', '{n} rounds', { n: +s.rounds || 10 }], s.kids || !+s.sec ? ['⏳', 'No timer'] : ['⏱️', '{n} s', { n: +s.sec }]];
      if (s.teams) facts.push(['👥', 'Teams']);
      return { key: what[0], icon: { mix: '🌍', flags: '🏳️', cities: '🏙️', landmarks: '🗿', us: '🇺🇸' }[what[0]] || '🌍', label: 'What to find', name: what[1], desc: what[2] || 'Drop a pin on the map. The closest pin wins.', bullets, facts };
    },
    settings: [
      { key: 'map', label: 'Map', type: 'seg', look: 'list', options: AREA_OPTS, default: 'world' },
      { key: 'what', label: 'What to find', type: 'seg', options: WHAT, default: 'mix', when: ['map', '!us'] },
      { key: 'rounds', label: 'Rounds', type: 'seg', options: [[5, '5'], [10, '10'], [15, '15'], [20, '20']], default: 10 },
      { key: 'level', label: 'Difficulty', type: 'seg', options: [['mix', 'Easy to hard', 'Starts with famous places and gets harder.'], ['easy', 'Easy', 'Only famous places. Great with kids.'], ['medium', 'Medium', 'Places most people have heard of.'], ['hard', 'Hard', 'Tricky places, for map fans.']], default: 'mix' },
      { key: 'sec', label: 'Time to pin', type: 'seg', options: [[15, '15 s'], [20, '20 s'], [30, '30 s'], [45, '45 s'], [0, 'No limit', 'No clock: each round waits until everyone pins. The host can show the answer any time.']], default: 30, when: ['kids', false] },
      { key: 'hints', label: 'Hints', type: 'toggle', default: true, desc: 'Clues show up as the clock runs down: the continent, then more.', when: ['kids', false] },
      { key: 'photos', label: 'Real photos', type: 'toggle', default: true, desc: 'Photos of the cities and sights, from Wikipedia.', when: ['map', '!us'] },
      { key: 'score', label: 'Points', type: 'seg', options: [['near', 'The closer, the more', 'Every pin scores: the closer it is, the more points.'], ['top', 'Closest pin only', 'Only the closest pin scores each round.']], default: 'near', when: ['kids', false] },
      { key: 'next', label: 'Next round', type: 'seg', options: [['auto', 'Automatic', 'The next round starts by itself after a short wait.'], ['host', 'The host starts it', 'The host taps Next round on their phone when everyone is ready.']], default: 'auto' },
      { key: 'wait', label: 'Wait before the next round', type: 'number', min: 1, max: 120, quick: [5, 8, 12, 20], unit: 'seconds', default: 8, when: ['next', 'auto'] },
      { key: 'units', label: 'Units', type: 'seg', options: [['mi', 'Miles'], ['km', 'Kilometers']], default: 'mi', when: ['kids', false] },
      { key: 'teams', label: 'Teams', type: 'toggle', default: false, desc: 'Phones join a color team, and each team\'s points are added up.' },
      { key: 'teamN', label: 'How many teams', type: 'seg', options: [[2, '2'], [3, '3'], [4, '4']], default: 2, when: ['teams', true] },
      { key: 'kids', label: 'Kids mode', type: 'toggle', default: false, desc: 'Just tap the right continent. No distances, no timer.' }
    ],
    async tv(K) {
      const s = K.settings;
      let D = null;
      try { D = await W.loadData(); } catch (e) {}
      if (!D) { const v = K.view(await K.tr('Where in the World?')); K.el('p', 'question', v, await K.tr('The map didn\'t load. Check the internet and start again.')); await K.sleep(6000); return K.players().slice(); }
      const kids = !!s.kids, us = s.map === 'us';
      const area = W.AREAS[s.map] || W.AREAS.world;
      const all = W.allItems(D, K);
      const byCode = new Map(all.allFlags.map(f => [f.cc, f]));
      // the places for this game
      let pools;
      if (us) pools = [all.states];
      else {
        const conts = W.AREA_CONT[s.map];
        const inArea = it => s.map === 'world' ? true : s.map === 'me' ? (it.kind === 'flag' ? it.me : it.me || W.ME.has(it.cc)) : it.kind === 'flag' ? (conts || []).includes(it.cont) : W.inBox(area, it.lon, it.lat);
        const what = WHAT.some(x => x[0] === s.what) ? s.what : 'mix';
        pools = [];
        if (what === 'mix' || what === 'flags') pools.push(all.flags.filter(inArea));
        if (what === 'mix' || what === 'cities') pools.push(all.cities.filter(inArea));
        if (what === 'mix' || what === 'landmarks') pools.push(all.sights.filter(inArea));
        pools = pools.filter(p => p.length);
      }
      const n = Math.max(1, +s.rounds || 10);
      const rounds = pools.length === 1 ? W.choose(pools[0], n, s.level) : W.interleave(pools.map(p => W.choose(p, n, s.level)), n);
      W.markSeen(rounds.map(r => r.key));
      const photoP = s.photos !== false && !us ? W.photosFor(rounds.filter(r => r.wiki)) : Promise.resolve(new Map());
      for (const r of rounds) if (r.kind === 'flag') W.flagImg(r.cc);
      const U = uPx();
      const teamOf = p => (K.teamsOn() && p.team ? ((P.TEAMS.find(t => t[0] === p.team) || [])[2] || '') : '');
      const ctx = {
        D, byCode, U, kids, us, sec: kids ? 0 : +s.sec, teamOf, used: new Set(), untitled: await K.tr('Untitled'),
        areaBox: M.box(us ? W.AREAS.us : area),
        fx: (nm, d, o) => { const go = () => { if (!K.over()) K.snd.fx(nm, o || {}); }; if (d) setTimeout(go, d); else go(); }
      };
      // (a deck of frames for each kind of round)
      const decks = { flag: SC.deck(Object.keys(SC.FLAG)), photo: SC.deck(Object.keys(SC.PHOTO)), place: SC.deck(Object.keys(SC.PLACE)), drawnSight: SC.deck(['pin', 'radar', 'postcard', 'globe', 'spot', 'neon', 'path']) };
      for (let i = 0; i < rounds.length; i++) {
        if (K.over()) break;
        const it = rounds[i];
        const lastN = rounds.length - i <= 2 && rounds.length > 3;
        // between rounds, Boo's plane flies over to the next place
        if (i > 0) { K.snd.music(null, { fadeOut: 0.6 }); plane(); ctx.fx('plane'); await K.sleep(1100); }
        K.wait();
        const photos = (await Promise.race([photoP, W.sleepRaw(1500).then(() => null)])) || new Map();
        let ph = photos.get(it.key) || null;
        if (ph && !(await Promise.race([W.preload(ph.src), W.sleepRaw(2200).then(() => false)]))) ph = null;
        if (K.over()) break;
        const v = await screen(K, ctx, it, i, rounds.length, ph, decks);
        K.snd.music(lastN ? 'last2' : stageOf(i, rounds.length), { fadeIn: 1.2, vol: 0.8 });
        v.board.draw();
        await K.sleep(1700);
        if (K.over()) break;
        const live = K.players().filter(p => !p.away);
        if (kids) {
          // kids: just tap the right continent
          const right = it.kind === 'state' ? 'North America' : W.CONT[it.cont] || 'Europe';
          const others = P.shuffle(['Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania'].filter(c => c !== right)).slice(0, 3);
          const opts = P.shuffle([right, ...others]);
          const lp = K.packs;
          const tOpts = await Promise.all(opts.map(async o => { const i2 = BVPACKS.continents.findIndex(c => c[0] === o); return (lp && lp.continents && lp.continents[i2]) || await K.tr(o); }));
          const grid = K.el('div', 'answers', v.stage);
          const cells = tOpts.map((t, j) => { const a = K.el('div', 'ans ' + P.LETTERS[j], grid); K.el('span', 'l', a, BVI18N.letters(K.lang)[j] || P.LETTERS[j]); K.el('span', '', a, t); return a; });
          const got = await K.ask({ kind: 'choice', prompt: await K.tr('Which continent?'), opts: tOpts, sec: 0, extra: { letters: true }, onAns: id => { v.board.pin(id); ctx.fx('pop'); } });
          const ok = opts.indexOf(right);
          ctx.fx(([...got.values()].some(a => +a.v === ok)) ? 'bull' : 'sparkle');
          cells.forEach((c, j) => c.classList.add(j === ok ? 'right' : 'dim'));
          for (const [id, a] of got) { const p = K.player(id); if (!p) continue; const good = +a.v === ok; if (good) p.score += 100; v.board.add(p, good ? 100 : 0); K.result(id, { ok: good, pts: good ? 100 : 0, score: p.score }); }
          await K.sleep(1500);
        } else {
          v.board.start(live.length);
          v.clock.go();
          const qn0 = K.qn() + 1;
          // the question on every phone too, in each player's own language, and the hints as they come
          const langs = [...new Set(K.players().map(p => K.langOf(p.id)).filter(l => l && l !== K.lang))];
          const qIn = async lg => { if (it.kind === 'flag') return trIn(K, lg, 'Where is this flag\'s country?'); const t = await trIn(K, lg, W.plural(it, lg) ? 'Where are {place}?' : 'Where is {place}?', { place: '\u0001' }); const nm = W.nameIn(it, lg); return t.replace('\u0001', t.startsWith('\u0001') ? W.cap(nm) : nm); };
          const tr = {};
          for (const lg of langs) tr[lg] = { q: await qIn(lg) };
          const hintsTV = s.hints !== false ? await hintsFor(K, ctx, it, K.lang) : [];
          const hintsLg = {};
          if (hintsTV.length) for (const lg of langs) hintsLg[lg] = await hintsFor(K, ctx, it, lg);
          const extra = { map: us ? 'us' : 'world', area: ctx.areaBox.map(Math.round), tv: 1, q: await qIn(K.lang), flag: it.kind === 'flag' ? 'flags/' + it.cc + '.png' : '' };
          if (langs.length) extra.tr = tr;
          let popN = 0, closed = false;
          const pinned = new Set();
          const asking = K.ask({ kind: 'pin', prompt: await K.tr('Drop your pin'), sec: ctx.sec, open: !ctx.sec, extra, onAns: id => { pinned.add(id); v.board.pin(id); ctx.fx('pop', 0, { rate: 1 + Math.min(0.7, popN++ * 0.08) }); } });
          const qn = K.qn();
          void qn0;
          const stopReveal = !ctx.sec ? hostReveal(K, qn) : null;
          // (the hints: a third of the way in, then more; with no clock, every 12 seconds)
          const at = ctx.sec ? [0.34, 0.58, 0.8].map(f => f * ctx.sec * 1000) : [12000, 24000, 36000];
          const timers = hintsTV.map((h, j) => setTimeout(() => {
            if (closed || K.over()) return;
            showHint(v, h); ctx.fx('hint');
            const trh = {}; for (const lg of langs) if (hintsLg[lg] && hintsLg[lg][j]) trh[lg] = hintsLg[lg][j].text;
            K.say({ k: 'hint', n: qn, i: j, text: h.text, icon: h.icon, flag: h.flag ? h.flag.replace(W.BASE, '') : '', tr: trh });
          }, at[j]));
          const tuT = ctx.sec ? setTimeout(() => { if (closed || K.over() || pinned.size >= live.length) return; K.snd.music(null, { fadeOut: 0.25 }); K.snd.sting('timesup'); }, ctx.sec * 1000) : 0;
          const got = await asking;
          closed = true; clearTimeout(tuT); for (const t of timers) clearTimeout(t);
          if (stopReveal) stopReveal();
          v.clock.stop();
          K.snd.music(null, { fadeOut: 0.5 });
          await reveal(K, ctx, it, got, v);
        }
        K.boo(['happy', 'wow', 'laugh', 'cool'][Math.floor(Math.random() * 4)]);
        const last = i >= rounds.length - 1;
        K.snd.music('between', { delay: 1.5, fadeIn: 1.5, fadeOut: 0.6 });
        if (last) await K.sleep(4500);
        else if (s.next === 'host') await hostNext(K, v, K.qn());
        else await nextIn(K, v, Math.max(1, Math.min(120, Math.round(+s.wait) || 8)));
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });
  // (Where in the World? keeps its place in the list of games, third, after Trivia and Boo Who?)
  try {
    const m = BVPLAY.games;
    if (m && m.has('world') && m.has('boowho')) {
      const e = [...m.entries()], w = e.find(x => x[0] === 'world');
      const rest = e.filter(x => x[0] !== 'world');
      const at = rest.findIndex(x => x[0] === 'boowho') + 1;
      rest.splice(at, 0, w);
      m.clear(); for (const [k, v] of rest) m.set(k, v);
    }
  } catch (e) {}
})();
