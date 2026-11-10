// Blokvane party games: Boo Who? The TV asks "Who is most likely to...?", everyone taps a player on their phone, and the
// votes fly in live, in one of seven designed screens (balloons, a bar race, columns, a ghost race, gumball tubes,
// planets, rockets). Boo, the game's ghost, says something funny about every result (each moment has ten lines, so it
// stays new). Five modes: Classic (vote with the crowd), Superstar (every vote you get is a point), Face-off (two
// players head to head), Lightning (a few seconds a question) and Kids. The questions and Boo's lines are in bw/<lang>.json,
// written for each language; the screens are the designs themselves (boowho-tpl.js), their look is bwlook.css.
(() => {
  'use strict';
  const P = BVPLAYC, TPL = BVBWT;
  const BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '');
  const VER = (((document.currentScript && document.currentScript.src) || '').match(/[?&]v=(\w+)/) || [])[1] || '1';
  const LANGS = ['en', 'es', 'fr', 'hi', 'bn', 'zh', 'ar'];
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => P.shuffle(a.slice());
  const clamp = (v, a, b, d) => { const n = Math.round(+v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d; };
  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? String(vars[k]) : m));
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const upper = (t, lg) => { try { return String(t).toLocaleUpperCase(lg); } catch (e) { return String(t).toUpperCase(); } };
  const chars = t => { try { if (window.Intl && Intl.Segmenter) return [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(String(t))].map(x => x.segment); } catch (e) {} return [...String(t)]; };
  const short = (t, n) => { const c = chars(t); return c.length > n ? c.slice(0, n - 1).join('') + '…' : c.join(''); };

  // ---------- the questions and Boo's lines (bw/<lang>.json: the same ones in every language, in the same order) ----------
  const CATS = [
    ['party', 'Party and friends', '🎉'], ['family', 'Family', '🏠'], ['kids', 'Kids', '🧸'], ['school', 'School', '🎒'],
    ['work', 'Work', '💼'], ['food', 'Food', '🍕'], ['travel', 'Travel', '✈️'], ['tech', 'Phones and games', '📱'],
    ['holidays', 'Holidays and parties', '🎂'], ['fantasy', 'Superpowers and magic', '🦄'], ['future', 'Future and fame', '🚀'],
    ['silly', 'Silly and weird', '🤪'], ['spicy', 'Spicy (teens and grown-ups)', '🌶️']
  ];
  // (Kids plays only the questions a six year old should hear)
  const KID_CATS = ['kids', 'family', 'school', 'food', 'holidays', 'fantasy', 'silly'];
  const banks = new Map();
  function bank(lang) {
    const lg = LANGS.includes(lang) ? lang : 'en';
    if (!banks.has(lg)) {
      banks.set(lg, fetch(BASE + 'bw/' + lg + '.json?v=' + VER, { credentials: 'omit' })
        .then(r => (r.ok ? r.json() : Promise.reject(new Error('load'))))
        .then(d => { if (!d || !d.q || !d.boo) throw new Error('data'); return d; })
        .catch(e => { banks.delete(lg); throw e; }));
    }
    return banks.get(lg);
  }
  // (a phone's language, but never holding the game up for long when the internet is slow)
  const bankBy = (lang, ms) => Promise.race([bank(lang), new Promise((r, j) => setTimeout(() => j(new Error('slow')), ms))]);
  const qText = (D, id) => { const m = /^([a-z]+)\.(\d+)$/.exec(id || ''); const a = m && D && D.q[m[1]]; return (a && a[+m[2] - 1]) || ''; };
  // (the questions seen lately on this screen: the next games bring new ones first)
  const SEEN = 'bvplay:bwseen';
  const seenGet = () => { try { const a = JSON.parse(lsGet(SEEN, '[]')); return Array.isArray(a) ? a.filter(x => typeof x === 'string') : []; } catch (e) { return []; } };
  const seenAdd = ids => { const a = seenGet().filter(x => !ids.includes(x)).concat(ids); lsSet(SEEN, JSON.stringify(a.slice(-700))); };
  // a game's questions: the categories take turns (in a new order each time), new questions first, and the host's own
  // questions mixed in all through the game
  function deck(D, cats, n, own, ownOnly) {
    const seen = new Set(seenGet());
    const per = shuffle(cats.filter(c => D.q[c] && D.q[c].length)).map(c => {
      const ids = D.q[c].map((t, i) => c + '.' + (i + 1)).filter(id => qText(D, id));
      return shuffle(ids.filter(id => !seen.has(id))).concat(shuffle(ids.filter(id => seen.has(id))));
    });
    const out = [];
    if (!(ownOnly && own.length)) {
      for (let k = 0; out.length < n && per.some(a => a.length); k++) { const a = per[k % per.length]; if (a.length) out.push({ id: a.shift() }); }
    }
    const mine = shuffle(own).map(t => ({ own: t }));
    if (ownOnly && mine.length) return mine.slice(0, n);
    // (spread out: one of the host's questions every few)
    const m = Math.min(mine.length, Math.max(1, Math.round(n / 2)));
    const res = out.slice(0, n - Math.min(m, n));
    for (let j = 0; j < m && j < n; j++) res.splice(Math.min(res.length, Math.round((j + 0.5) * (n / m))), 0, mine[j]);
    return res.slice(0, n);
  }
  // Boo's lines: ten for each moment, in a new order every game, so the same line doesn't come back soon
  function booDeck() {
    const left = new Map();
    return key => { let a = left.get(key); if (!a || !a.length) { a = shuffle([...Array(10).keys()]); left.set(key, a); } return a.shift(); };
  }

  // ---------- the modes, explained on the TV's lobby, on the host's phone and before the first question ----------
  const MODES = [
    ['classic', 'Classic', 'Vote for who fits best. You score when you vote with the most people.'],
    ['superstar', 'Superstar', 'Every vote you get is a point. Be the one everyone picks!'],
    ['faceoff', 'Face-off', 'Each question, two players go head to head. Pick one of the two!'],
    ['lightning', 'Lightning', 'Only a few seconds to vote! Vote with the crowd, fast, for bonus points.'],
    ['kids', 'Kids', 'Sweet and silly questions for little ones. Every vote earns a star, and Boo cheers for everyone!']
  ];
  const MODE_IC = { classic: '👻', superstar: '🌟', faceoff: '🥊', lightning: '⚡', kids: '🧸' };
  const modeOf = s => (MODES.some(m => m[0] === s.mode) ? s.mode : 'classic');
  const selfOk = s => modeOf(s) !== 'superstar' && s.self !== false;
  // (the three lines the lobby and the how-to-play screen show)
  function rulesOf(s) {
    const m = modeOf(s || {});
    if (m === 'superstar') return ['The TV asks who is most likely to do something.', 'Tap the person who fits best on your phone (not yourself).', 'Every vote you get is a point. The most votes wins!'];
    if (m === 'faceoff') return ['Each question, two players go head to head.', 'Tap the one who fits best on your phone.', 'You score when you vote with the most people.'];
    if (m === 'lightning') return ['The TV asks who is most likely to do something.', 'Tap fast: there are only a few seconds!', 'Vote with the most people. The faster you are, the more points.'];
    if (m === 'kids') return ['The TV asks a fun question.', selfOk(s || {}) ? 'Tap a friend on your phone, or yourself!' : 'Tap the person who fits best on your phone.', 'Every vote earns a star!'];
    return ['The TV asks who is most likely to do something.', selfOk(s || {}) ? 'Tap the person who fits best on your phone (you can pick yourself).' : 'Tap the person who fits best on your phone.', 'You score when you vote with the most people.'];
  }
  // (and everything else that counts, for the phones and the line under the how-to cards)
  function extrasOf(s) {
    const m = modeOf(s), out = [];
    if (m !== 'kids' && s.golden !== false) out.push(['⭐', 'Every fifth question is golden: it counts double.']);
    if (m !== 'kids' && s.last !== false) out.push(['🏁', 'The last question counts double.']);
    if (s.show === 'reveal') out.push(['🙈', 'The names show when everyone has voted.']);
    else if (s.show === 'secret') out.push(['🤫', 'Votes are secret: only how many each player gets.']);
    return out;
  }

  // ---------- the looks: a different one each game (or each question), or the host's pick ----------
  const LOBBY = ['comedy', 'comic', 'election', 'sleepover'], HOWS = ['glow', 'tabloid', 'sleepover'], WINS = ['carnival', 'glow', 'yearbook'];
  const LIVES = ['balloon', 'bar', 'columns', 'ghost', 'gumball', 'orbit', 'rocket'];
  // (for checking the screens on this computer: ?bwlook=comic, ?bwlive=orbit, ?bwhow=tabloid, ?bwwin=yearbook)
  const urlPick = (k, list) => { const m = new RegExp('[?&]' + k + '=([a-z]+)').exec(location.search); return m && list.includes(m[1]) ? m[1] : ''; };
  const turn = (key, list) => { const i = ((+lsGet(key, '-1') || 0) + 1 + list.length) % list.length; lsSet(key, String(i)); return list[i]; };
  let bwLook = '';
  function lookNow(s) {
    const forced = urlPick('bwlook', LOBBY);
    if (forced) return forced;
    if (s && LOBBY.includes(s.look)) return s.look;
    if (!bwLook) bwLook = turn('bvplay:bwlook', LOBBY);
    return bwLook;
  }

  // ---------- the colors: the designs' own, one for each player, the same on the TV and the phones ----------
  const PAL = ['#5ad1ff', '#ffc93c', '#ff5a8a', '#34d399', '#a77bff', '#ff8a3c', '#4c8dff', '#ff7ad9', '#9be15d', '#f4d35e', '#2ee6d6', '#c084fc', '#fb7185', '#7dd3fc', '#facc15', '#f472b6'];

  const mk = (tag, cls, parent, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  const $k = (root, k) => [...root.querySelectorAll('[data-k="' + k + '"]')];
  const $1 = (root, k) => root.querySelector('[data-k="' + k + '"]');
  const setT = (root, k, t) => { for (const e of $k(root, k)) e.textContent = t; };
  // (a line that has to fit its place: smaller until it does)
  function shrink(e, minK, lines) {
    if (!e) return;
    const base = parseFloat(getComputedStyle(e).fontSize) || 40;
    const lh = parseFloat(getComputedStyle(e).lineHeight) || base * 1.2;
    const over = () => (lines ? e.scrollHeight > lh * lines + 2 : e.scrollWidth > e.clientWidth + 2);
    if (!lines) e.style.whiteSpace = 'nowrap';
    for (let k = 1, i = 0; i < 16 && over() && k > (minK || 0.4); i++) { k -= 0.05; e.style.fontSize = (base * k).toFixed(1) + 'px'; }
  }

  // ---------- the lobby: the kit's own, dressed in one of the four designs ----------
  const LINES2 = ['The TV asks a question, like "Who is most likely to fall asleep during a movie?".', 'Everyone taps a player on their phone (yourself too).', 'You score when you vote with the most people.'];
  const WORDS = { 'WHO?!': 'Who?!', 'HA HA!': 'Ha ha!', 'VOTE!': 'Vote!', 'VOTE': 'Vote', 'ME? 👀': 'Me? 👀' };
  let decoFit = null;
  function fitDeco() {
    for (const c of document.querySelectorAll('.bw-deco > .bw-dcv')) {
      const st = c.parentElement.parentElement;
      if (!st) continue;
      const s = st.clientHeight / 1080;
      c.style.left = ((st.clientWidth - 1920 * s) / 2).toFixed(1) + 'px';
      c.style.transform = 'scale(' + s.toFixed(5) + ')';
    }
  }
  // (a step's title stays on one line, as the designs have it: a little smaller when a language says it longer)
  function fitSteps() {
    if (!document.body.dataset.bwlook) return;
    for (const b of document.querySelectorAll('.lob .stp b')) {
      const card = b.closest('.card');
      if (!card || !b.isConnected) continue;
      b.style.fontSize = '';
      const cs = getComputedStyle(b), base = parseFloat(cs.fontSize) || 30, rtl = cs.direction === 'rtl';
      const pad = parseFloat(getComputedStyle(card)[rtl ? 'paddingLeft' : 'paddingRight']) || 10;
      const over = () => { const r = b.getBoundingClientRect(), c = card.getBoundingClientRect(); return rtl ? r.left < c.left + pad - 1 : r.right > c.right - pad + 1; };
      for (let k = 1, i = 0; i < 12 && over() && k > 0.5; i++) { k -= 0.05; b.style.fontSize = (base * k).toFixed(1) + 'px'; }
    }
  }
  addEventListener('resize', () => requestAnimationFrame(() => { fitDeco(); fitNow(); fitSteps(); }));
  function lobbyDress(stage, s) {
    const lk = lookNow(s), L = TPL.lobby[lk];
    document.body.dataset.bwlook = lk;
    if (!L) return;
    for (const [k, html] of [['back', L.back], ['front', L.front]]) {
      if (!html) continue;
      const d = mk('div', 'bw-deco' + (k === 'front' ? ' front' : ''));
      d.setAttribute('aria-hidden', 'true');
      const c = mk('div', 'bw-dcv', d);
      c.innerHTML = html;
      if (k === 'back') stage.insertBefore(d, stage.firstChild); else stage.appendChild(d);
      // (the designs' comic words, in the TV's language)
      for (const e of c.querySelectorAll('*')) {
        const t = e.childNodes.length === 1 && e.firstChild.nodeType === 3 ? e.firstChild.data.trim() : '';
        if (t && WORDS[t]) P.tr(WORDS[t]).then(w => { e.firstChild.data = upper(w, P.lang); });
      }
    }
    fitDeco();
    // (a language written right to left: the lobby is the other way round, and so are the decorations' places, each
    // still the right way round itself)
    if (document.documentElement.dir === 'rtl') {
      for (const c of stage.querySelectorAll('.bw-deco > .bw-dcv')) for (const e of c.children) {
        const l = e.offsetLeft, w = e.offsetWidth;
        if (w >= 1900) continue;
        e.style.left = (1920 - l - w) + 'px'; e.style.right = 'auto'; e.style.marginLeft = '0';
      }
    }
    // the icon: the design's Boo
    const logo = stage.querySelector('.lob-top .logo');
    if (logo && L.logo) logo.insertAdjacentHTML('beforeend', L.logo);
    // the name, its question mark in the look's own color
    const top = stage.querySelector('.lob-top'), h1 = top && top.querySelector('h1');
    if (h1) {
      const m = /^(.*?)(\s?[?？؟])$/.exec(h1.textContent);
      if (m) { h1.textContent = m[1]; mk('span', 'q', h1, m[2].trim()); }
      h1.dir = 'auto';
      const fit = () => {
        h1.style.fontSize = '';
        const lg = top.querySelector('.logo'), dc = top.querySelector('.deco'), cs = getComputedStyle(top);
        const room = top.clientWidth - (lg ? lg.offsetWidth : 0) - (dc ? dc.offsetWidth : 0) - 2 * (parseFloat(cs.columnGap || cs.gap) || 0) - 4;
        const base = parseFloat(getComputedStyle(h1).fontSize) || 80;
        for (let k = 1, i = 0; i < 12 && h1.scrollWidth > room && k > 0.5; i++) { k -= 0.05; h1.style.fontSize = (base * k).toFixed(1) + 'px'; }
      };
      fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (h1.isConnected) fit(); }).catch(() => {});
    }
    // (the third step says it the mode's way: not yourself in Superstar, a friend in Kids)
    const st3 = stage.querySelector('.steps2 .stp-c:nth-child(2) p'), md = modeOf(s || {});
    if (st3 && (md === 'kids' || !selfOk(s || {}))) P.tr(md === 'kids' && selfOk(s || {}) ? 'Tap a friend on your phone, or yourself!' : 'Tap who fits the question best.').then(t => { if (st3.isConnected) st3.textContent = t; });
    // how to play: the label (with the game mode), and three numbered lines in the design's rows
    const ex = stage.querySelector('.lob-x');
    if (ex) {
      const ol = ex.querySelector('ol.howto2');
      const lines = ol ? [...ol.children].map(li => li.textContent) : [];
      if (ol) ol.remove();
      const rows = lines.slice(0, 3).map((t, i) => { const r = mk('div', 'bw-hr', ex); mk('span', 'n', r, String(i + 1)); const tt = mk('span', 't', r, t); tt.dir = 'auto'; return tt; });
      // (the Comedy club and the Sleepover say it their own way, with an example)
      if ((lk === 'comedy' || lk === 'sleepover') && modeOf(s || {}) === 'classic' && selfOk(s || {}) && rows.length === 3)
        // (only when all three say it in the TV's language: otherwise the usual lines stay)
        Promise.all(LINES2.map(t => P.tr(t))).then(xs => {
          if (P.lang !== 'en' && xs.some((x, i) => x === LINES2[i] && i < 2)) return;
          xs.forEach((x, i) => { if (rows[i].isConnected) rows[i].textContent = x; });
        }).catch(() => {});
      const lbl = ex.querySelector('.lbl'), mode = modeOf(s || {});
      if (lbl && mode !== 'classic') P.tr(MODES.find(x => x[0] === mode)[1]).then(n => { if (lbl.isConnected) lbl.textContent += ' · ' + MODE_IC[mode] + ' ' + n; });
    }
    // (the steps' titles, once the lobby is on the screen and again when the fonts are in)
    requestAnimationFrame(fitSteps);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => requestAnimationFrame(fitSteps)).catch(() => {});
  }
  // the seats, once they have their places: each player in their color, the first empty ones invite in with the
  // design's Boo, the others show the look's sign
  function seatDress(grid) {
    const lk = document.body.dataset.bwlook, L = TPL.lobby[lk];
    if (!L) return;
    let i = 0;
    for (const seat of grid.querySelectorAll('.seat')) {
      if (!seat.classList.contains('empty')) { seat.style.setProperty('--pc', PAL[i++ % PAL.length]); continue; }
      const kit = [...seat.children].find(e => e.tagName === 'SPAN' && !e.classList.contains('bw-j') && !e.classList.contains('bw-ic'));
      if (kit && !seat.querySelector('.bw-j')) {
        seat.classList.add('open');
        seat.insertAdjacentHTML('beforeend', L.seat);
        mk('span', 'bw-j', seat, kit.textContent);
      } else if (!kit && !seat.querySelector('.bw-ic')) mk('span', 'bw-ic', seat, L.icon);
    }
  }

  // ---------- a design on the screen: its 1920 x 1080 canvas, scaled to fit (and centered on) whatever the TV is ----------
  let hostEl = null;
  function fitNow() {
    if (!hostEl || !hostEl.isConnected) return;
    const cv = hostEl.firstElementChild, w = hostEl.clientWidth, h = hostEl.clientHeight;
    const s = Math.min(w / 1920, h / 1080);
    cv.style.transform = 'translate(' + ((w - 1920 * s) / 2).toFixed(1) + 'px,' + ((h - 1080 * s) / 2).toFixed(1) + 'px) scale(' + s.toFixed(5) + ')';
  }
  function canvas(K, cls) {
    K.view(null);
    const host = K.el('div', 'bw-host ' + cls, K.stage);
    const cv = K.el('div', 'bw-cv', host);
    hostEl = host;
    fitNow();
    return { host, cv };
  }
  // (the design's background goes all the way to the edges of a TV that's wider than the design)
  const edges = (host, cv) => { const r = cv.firstElementChild; if (r) host.style.background = r.style.background || ''; };

  // ---------- the live screens' templates: <sc-for> repeats for each one in a list, {{ a.b }} is a value; a list keeps
  // each one by its key, so what changes moves (a bar grows, a rocket climbs) instead of being drawn again ----------
  const VAR = /\{\{\s*([\w.]+)\s*\}\}/g;
  const tpls = new Map();
  function tplOf(look) {
    if (!tpls.has(look)) { const t = document.createElement('template'); t.innerHTML = TPL.live[look]; tpls.set(look, t); }
    return tpls.get(look);
  }
  const val = (sc, path) => { let v = sc; for (const k of path.split('.')) { if (v == null) return ''; v = v[k]; } return v == null ? '' : v; };
  const put = (t, sc) => t.replace(VAR, (m, k) => String(val(sc, k)));
  function bind(node, out) {
    if (node.nodeType === 3) { if (node.data.indexOf('{{') >= 0) out.push({ k: 't', n: node, t: node.data, v: null }); return; }
    if (node.nodeType !== 1) return;
    if (node.localName === 'sc-for') {
      const m = /\{\{\s*([\w.]+)\s*\}\}/.exec(node.getAttribute('list') || '');
      const frag = node.ownerDocument.createDocumentFragment();
      while (node.firstChild) frag.appendChild(node.firstChild);
      const at = node.ownerDocument.createComment('');
      node.parentNode.replaceChild(at, node);
      out.push({ k: 'f', at, path: m ? m[1] : '', as: node.getAttribute('as') || 'x', frag, items: new Map() });
      return;
    }
    for (const a of Array.from(node.attributes)) if (a.value.indexOf('{{') >= 0) out.push({ k: 'a', n: node, a: a.name, t: a.value, v: null });
    for (const c of Array.from(node.childNodes)) bind(c, out);
  }
  function run(bs, sc) {
    for (const b of bs) {
      if (b.k === 't') { const v = put(b.t, sc); if (v !== b.v) { b.v = v; b.n.data = v; } continue; }
      if (b.k === 'a') { const v = put(b.t, sc); if (v !== b.v) { b.v = v; b.n.setAttribute(b.a, v); } continue; }
      const list = val(sc, b.path), arr = Array.isArray(list) ? list : [], seen = new Set();
      arr.forEach((it, i) => {
        const key = it && it.key != null ? 'k' + it.key : 'i' + i;
        seen.add(key);
        const s2 = Object.create(sc); s2[b.as] = it;
        let r = b.items.get(key);
        if (r) { run(r.bs, s2); return; }
        const fr = b.frag.cloneNode(true), bs2 = [];
        for (const c of Array.from(fr.childNodes)) bind(c, bs2);
        r = { nodes: Array.from(fr.childNodes), bs: bs2 };
        run(bs2, s2);
        // (a new one goes after the last one: they never change places, so each keeps moving smoothly)
        let after = b.at;
        for (const x of b.items.values()) after = x.nodes[x.nodes.length - 1] || after;
        after.parentNode.insertBefore(fr, after.nextSibling);
        b.items.set(key, r);
      });
      for (const [key, r] of b.items) if (!seen.has(key)) { for (const n of r.nodes) if (n.parentNode) n.parentNode.removeChild(n); b.items.delete(key); }
    }
  }
  function mount(cv, look, sc) {
    const root = tplOf(look).content.cloneNode(true), bs = [];
    for (const c of Array.from(root.childNodes)) bind(c, bs);
    run(bs, sc);
    cv.appendChild(root);
    return sc2 => run(bs, sc2);
  }

  // ---------- the votes, as each design draws them (the designs' own numbers, for any number of players) ----------
  const FANS = { 1: [[0, -200]], 2: [[-58, -195], [58, -185]], 3: [[-105, -165], [0, -215], [105, -170]], 4: [[-128, -140], [-46, -208], [46, -214], [128, -146]], 5: [[-142, -118], [-76, -196], [0, -238], [76, -198], [142, -124]] };
  function fan(cnt, j) {
    if (FANS[cnt]) return FANS[cnt][j];
    // (more balloons: an outer and an inner arc)
    const outer = Math.ceil(cnt * 0.58), out = j < outer, k = out ? j : j - outer, m = out ? outer : cnt - outer;
    const r = out ? 248 : 168, span = out ? 2.3 : 1.7, a = m > 1 ? -span / 2 + span * k / (m - 1) : 0;
    return [Math.round(Math.sin(a) * r * 0.78), Math.round(-Math.cos(a) * r)];
  }
  // st: { cands: [{ key, name, color, face, ph }], cast: [{ voter, target, show, an }], total, who: id -> { short, initial, color } }
  function vals(st, labels) {
    const C = st.cands, n = st.cast.length, total = Math.max(1, st.total);
    const votes = C.map(c => st.cast.filter(x => x.target === c.key).length);
    const max = Math.max(1, ...votes), top = Math.max(0, ...votes);
    const order = C.map((c, i) => i).sort((a, b) => votes[b] - votes[a] || a - b);
    const rank = [];
    order.forEach((idx, r) => { rank[idx] = r; });
    const fixed = C.map((c, i) => {
      const v = votes[i], col = c.color, lead = top > 0 && v === top;
      const planet = 140 + Math.round(Math.min(1, v / total) * 170);
      const mine = st.cast.filter(x => x.target === c.key), cnt = mine.length;
      const voters = mine.map((x, j) => {
        const [dx, dy] = fan(cnt, j), kx = 170, ky = 360, bx = kx + dx, by = ky + dy, mx = (bx + kx) / 2 + dx * 0.12, my = (by + ky) / 2 + 18;
        const w = x.show ? st.who(x.voter) : null, vc = w ? w.color : '#ffffff';
        return { key: x.voter, name: w ? w.short : '', initial: w ? w.initial : '?', color: vc, dark: vc + 'cc', an: x.an || 'bwk-chipIn',
          left: (bx - 48) + 'px', top: (by - 118) + 'px', rot: (dx * 0.09).toFixed(2) + 'deg', path: 'M' + bx + ' ' + (by + 2) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + kx + ' ' + ky,
          odelay: (-j * 9 / Math.max(1, cnt)).toFixed(2) + 's', orad: (planet / 2 + 70) + 'px' };
      });
      return { key: c.key, name: c.name, votes: v, color: col, voters, face: c.face, ph: c.ph ? '1' : '0',
        pct: (Math.min(1, v / total) * 100).toFixed(2) + '%', pctTall: (v / max * 100).toFixed(2) + '%',
        grad: 'linear-gradient(90deg, ' + col + '99, ' + col + ')', gradV: 'linear-gradient(180deg, ' + col + ', ' + col + '88)',
        top: (rank[i] * 118) + 'px', rankLabel: String(rank[i] + 1), crown: lead ? '👑' : '',
        raceX: (11 + Math.min(1, v / total) * 50).toFixed(2) + '%', lift: (Math.min(1, v / total) * 200).toFixed(1) + 'px',
        rocketLift: (70 + Math.min(1, v / total) * 440).toFixed(1) + 'px', planet: planet + 'px' };
    });
    return Object.assign({ players: order.map(i => fixed[i]), playersFixed: fixed, votedPct: (Math.min(1, n / total) * 100).toFixed(2) + '%' }, labels);
  }
  // (how many players each design shows at once, and how much smaller it draws them to fit: a bigger room shows the
  // ones with the most votes)
  const CAP = { bar: 10, columns: 10, gumball: 10, rocket: 9, ghost: 8, balloon: 8, orbit: 8 };
  // (the room each lane needs in the design: rows down the screen, or columns across it)
  const LANE = { bar: ['h', 118], ghost: ['h', 118], columns: ['w', 276, 24], gumball: ['w', 236], rocket: ['w', 228], balloon: ['w', 320], orbit: ['w', 346] };
  function kOf(look, n, box) {
    const L = LANE[look] || ['h', 118], w = box ? box.clientWidth : 1760, h = box ? box.clientHeight : 720;
    const need = n * L[1] + (L[2] || 0);
    return Math.max(0.4, Math.min(1, (L[0] === 'h' ? h : w) / Math.max(1, need)));
  }
  function zoomLanes(ln, look, n) {
    if (!ln) return;
    // (the design's own size first, then made smaller from there when it has to be)
    if (ln.dataset.z0 == null) ln.dataset.z0 = JSON.stringify([ln.style.width, ln.style.height, ln.style.transform]);
    const z0 = JSON.parse(ln.dataset.z0);
    ln.style.width = z0[0]; ln.style.height = z0[1]; ln.style.transform = z0[2];
    const k = kOf(look, n, ln.parentElement);
    if (k >= 1) return;
    ln.style.width = (100 / k).toFixed(3) + '%'; ln.style.height = (100 / k).toFixed(3) + '%'; ln.style.transform = 'scale(' + k.toFixed(4) + ')';
  }

  // ---------- a question on the TV ----------
  async function liveScreen(K, ctx, look, q) {
    const v = canvas(K, 'bw-live bw-' + look);
    const st = { cands: q.lanes, cast: [], total: q.total, who: ctx.who };
    v.st = st; v.look = look; v.labels = Object.assign({}, q.labels);
    v.update = mount(v.cv, look, vals(st, v.labels));
    v.redraw = () => v.update(vals(st, v.labels));
    edges(v.host, v.cv);
    setT(v.cv, 'finish', upper(ctx.tx('finish'), K.lang));
    // (a big room: the players' part drawn bigger, then made smaller to fit)
    const ln = $1(v.cv, 'lanes');
    zoomLanes(ln, look, q.lanes.length);
    // (again once the fonts are in: a question on two lines leaves less room)
    if (ln && document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (ln.isConnected) zoomLanes(ln, look, v.st.cands.length); }).catch(() => {});
    // (the ghost race with only a few runners: their lanes together in the middle, a lane apart, as the design has them)
    if (ln && look === 'ghost' && q.lanes.length < 5) { ln.style.justifyContent = 'center'; ln.style.gap = '17px'; }
    // (the round's own sign: golden, or the last one)
    const rp = $1(v.cv, 'round');
    if (rp) rp.dir = 'auto';
    if (rp && q.gold) { const g = mk('div', 'bw-gold'); g.textContent = '⭐ ×2'; rp.after(g); }
    // the clock: a pill like the round's, after it
    if (rp && q.sec > 0) {
      const tm = rp.cloneNode(false);
      tm.removeAttribute('data-k');
      tm.classList.add('bw-tm');
      mk('span', '', tm, '⏱');
      v.tmN = mk('b', '', tm, String(q.sec));
      (rp.nextElementSibling && rp.nextElementSibling.classList.contains('bw-gold') ? rp.nextElementSibling : rp).after(tm);
      v.tm = tm;
    }
    // who has voted: a face for each one who can vote
    const dk = $1(v.cv, 'dock');
    const dock = mk('div', 'bw-dock' + (dk ? '' : ' top') + (look === 'balloon' || look === 'gumball' ? ' light' : '') + (q.voters.length > 14 ? ' dense' : ''));
    if (dk) dk.replaceWith(dock); else v.cv.appendChild(dock);
    // (more players than the board shows: how many more, by the faces)
    if (q.more > 0) mk('span', 'bw-more', dock, ctx.tx('more', { n: K.num(q.more) }));
    v.dock = new Map();
    for (const p of q.voters) {
      const i = mk('i', p.photo ? '' : 'boo', dock);
      i.style.backgroundImage = 'url("' + K.avatarUrl(p) + '")';
      i.style.setProperty('--c', ctx.colorOf(p.id));
      i.title = p.name;
      v.dock.set(p.id, i);
    }
    fitNow();
    return v;
  }
  // the clock, with the game's own time (it stands still while the host has the game paused)
  function clock(K, v, sec) {
    if (!v.tm || !sec) return { stop() {} };
    const t0 = K.now();
    let last = -1, on = true;
    const tick = () => {
      if (!on || !v.tm.isConnected) return;
      const left = Math.max(0, Math.ceil(sec - (K.now() - t0) / 1000));
      if (left !== last) {
        last = left;
        v.tmN.textContent = K.num(left);
        v.tm.classList.toggle('low', left <= 5 && left > 0);
        if (left <= 3 && left > 0 && !K.paused()) K.snd.fx('tick', { duck: 0.85 });
      }
      setTimeout(tick, 200);
    };
    tick();
    return { stop() { on = false; const tm = v.tm; if (tm) { tm.classList.remove('low'); tm.classList.add('off'); setTimeout(() => { tm.hidden = true; }, 450); } } };
  }
  // Boo's line: Boo pops in with a speech bubble (under the screen's top, or where the question is)
  function bubble(K, v, text, o) {
    o = o || {};
    if (v.bub) { const b0 = v.bub; b0.classList.add('out'); setTimeout(() => b0.remove(), 400); v.bub = null; }
    const b = mk('div', 'bw-bub in' + (o.kids ? ' kids' : '') + (o.cls ? ' ' + o.cls : ''), v.cv);
    const im = mk('img', '', b); im.alt = ''; im.src = P.booUri(o.boo || 'boo:laugh') || P.booUri('boo:hi');
    const t = mk('div', 't', b, text); t.dir = 'auto';
    if (o.color) b.style.setProperty('--bc', o.color);
    const q = $1(v.cv, 'q');
    // (the bar race and the columns: in place of the question, which shows again with the next one)
    if (o.at === 'q' && q) {
      q.classList.add('bw-hide');
      b.style.left = (q.offsetLeft + q.offsetParent.offsetLeft - 10) + 'px';
      b.style.top = Math.max(110, q.offsetTop + q.offsetParent.offsetTop - 34) + 'px';
      b.querySelector('img').style.width = b.querySelector('img').style.height = '110px';
      t.style.maxWidth = '1500px';
    } else if (o.at === 'corner') {
      // (the winner screens: over the design's own Boo in the corner, pointing down at him)
      b.style.right = '64px'; b.style.bottom = (o.y || 270) + 'px'; b.classList.add('small', 'up');
      im.remove();
    } else { b.style.left = '70px'; b.style.top = '138px'; }
    if (o.at !== 'q' && v.dockEl) v.dockEl.hidden = true;
    shrink(t, 0.6, 2);
    v.bub = b;
    K.snd.fx('sparkle', { duck: 0.8 });
    return b;
  }
  function unbubble(v) {
    if (!v.bub) return;
    const b = v.bub; v.bub = null;
    b.classList.remove('in'); b.classList.add('out');
    setTimeout(() => b.remove(), 400);
    const q = $1(v.cv, 'q'); if (q) q.classList.remove('bw-hide');
  }

  // ---------- how to play, before the first question: one of the three designs, for as long as the host picked ----------
  async function howTo(K, ctx) {
    const s = K.settings, mode = ctx.mode;
    const look = urlPick('bwhow', HOWS) || (HOWS.includes(s.htLook) ? s.htLook : turn('bvplay:bwhow', HOWS));
    const secs = clamp(s.howSec, 5, 120, 12);
    const v = canvas(K, 'bw-how bw-h' + look);
    v.cv.innerHTML = TPL.how[look];
    edges(v.host, v.cv);
    const cv = v.cv, lg = K.lang;
    const rules = rulesOf(s), extras = extrasOf(s);
    const tr = await Promise.all(rules.concat(extras.map(x => x[1])).map(t => K.tr(t)));
    setT(cv, 'ht', upper(ctx.tx('howTo'), lg));
    const name = ctx.name;
    const title = $1(cv, 'title');
    if (title) {
      const m = /^(.*?)(\s?[?？؟])$/.exec(name);
      const tq = $1(cv, 'tq');
      if (tq) { title.firstChild.data = m ? m[1] : name; tq.textContent = m ? m[2].trim() : ''; }
      else title.textContent = name;
      title.dir = 'auto';
      shrink(title, 0.5);
    }
    setT(cv, 'who', ctx.tx('who'));
    tr.slice(0, 3).forEach((t, i) => { for (const e of $k(cv, 'c' + (i + 1))) { e.textContent = t; e.dir = 'auto'; shrink(e, 0.62, 3); } });
    ['s1', 's2', 's3'].forEach((k, i) => setT(cv, k, upper(ctx.tx('step' + (i + 1)), lg)));
    const badge = $1(cv, 'badge');
    if (badge) badge.textContent = upper(ctx.tx('noRight'), lg);
    setT(cv, 'dizzy', upper(ctx.tx('dizzy'), lg));
    // (the game mode, and anything else that counts, in one line under the cards)
    const more = $1(cv, 'more');
    if (more) {
      const m = MODES.find(x => x[0] === mode);
      const parts = (mode !== 'classic' ? [MODE_IC[mode] + ' ' + (await K.tr(m[1]))] : []).concat(tr.slice(3).map((t, i) => extras[i][0] + ' ' + t));
      more.textContent = '';
      parts.forEach(t => { const sp = mk('span', '', more, t); sp.style.display = 'inline-block'; sp.style.margin = '0 22px'; });
      more.dir = 'auto';
      shrink(more, 0.6, 2);
    }
    const bar = $1(cv, 'bar');
    if (bar) bar.style.animationDuration = secs + 's';
    const m = MODES.find(x => x[0] === mode);
    // (on the phones: the mode, the three rules, and what else counts, each with its sign)
    K.wait(ctx.tx('howTo'), { rules, sp: { name: m[1], desc: m[2], bullets: extras.map(x => x[0] + ' ' + x[1]) }, secs });
    await K.sleep(secs * 1000);
  }

  // ---------- the scores every five questions: the bar race design, with everyone's points ----------
  async function scores(K, ctx, done) {
    const ps = ctx.ranked();
    const n = Math.min(10, ps.length);
    const v = canvas(K, 'bw-live bw-bar bw-sc');
    v.cv.classList.add('bw-scores');
    const best = Math.max(1, ...ps.map(p => p.score));
    const unit = x => (ctx.kids ? Math.round(x / 100) : x);
    const cands = ps.slice(0, n).map(p => ({ key: p.id, name: p.name, color: ctx.colorOf(p.id), face: K.avatarUrl(p), ph: !!p.photo }));
    const data = vals({ cands, cast: [], total: 1, who: ctx.who }, Object.assign(ctx.roundLabels(0), { question: ctx.tx('scoresAfter', { n: K.num(done) }), statusLabel: ctx.tx('scores'), votedLabel: '' }));
    // (the bars: everyone's points, the leader's the longest)
    // (every leader gets a crown; the bars grow from nothing)
    data.players = ps.slice(0, n).map((p, i) => Object.assign(data.playersFixed[i], { votes: K.num(unit(p.score)), pct: '0%', top: (i * 118) + 'px', rankLabel: String(i + 1), crown: p.score === best && p.score > 0 ? '👑' : '' }));
    data.votedPct = '100%';
    const upd = mount(v.cv, 'bar', data);
    setTimeout(() => { data.players.forEach((x, i) => { x.pct = (ps[i].score / best * 100).toFixed(2) + '%'; }); upd(data); }, 350);
    edges(v.host, v.cv);
    const rp = $1(v.cv, 'round'); if (rp) rp.hidden = true;
    zoomLanes($1(v.cv, 'lanes'), 'bar', n);
    fitNow();
    K.snd.sting('bwEvery5', { duck: 0.4 });
    K.wait(ctx.tx('scores'));
    await K.sleep(6000);
  }

  // ---------- the winners: one of the three designs, a different one each game, or the host's pick ----------
  let bwWinLast = '';
  function wface(K, at, x, size, square) {
    if (!at || !x) return;
    const im = document.createElement('img');
    im.alt = '';
    im.className = 'bw-wface' + (x.photo ? ' ph' : '') + (square && x.photo ? ' sq' : '');
    im.src = K.avatarUrl(x);
    const isSvg = at.tagName.toLowerCase() === 'svg';
    const h = isSvg ? +at.getAttribute('height') : size;
    const sz = Math.round(x.photo ? (size || h * 0.9) : h * 1.05);
    im.style.width = sz + 'px'; im.style.height = sz + 'px';
    if (isSvg) at.replaceWith(im); else { at.textContent = ''; at.style.display = 'grid'; at.style.placeItems = 'center'; at.appendChild(im); }
  }
  async function winners(K, ctx, top) {
    const s = K.settings;
    const look = urlPick('bwwin', WINS) || (WINS.includes(s.win) ? s.win : turn('bvplay:bwwin', WINS));
    bwWinLast = look;
    const v = canvas(K, 'bw-win bw-w' + look);
    v.cv.innerHTML = TPL.win[look];
    edges(v.host, v.cv);
    const cv = v.cv, lg = K.lang, [w1, w2, w3] = top;
    const pts = x => (ctx.kids ? '⭐ ' + ctx.tx('stars', { n: K.num(Math.round(x.score / 100)) }) : ctx.tx('points', { n: K.num(x.score) }));
    setT(cv, 'wk', upper(ctx.tx('winner'), lg));
    setT(cv, 'foot', ctx.tx('foot'));
    for (const e of $k(cv, 'foot')) e.dir = 'auto';
    const wn = $1(cv, 'wname');
    if (wn) { wn.textContent = w1 ? w1.name : '...'; wn.dir = 'auto'; wn.style.maxWidth = look === 'yearbook' ? '470px' : '1300px'; wn.style.overflow = 'hidden'; shrink(wn, 0.4); }
    if (w1) setT(cv, 'pt1', pts(w1));
    if (look === 'carnival') {
      if (w1) wface(K, $1(cv, 'av1'), w1, 190);
      for (const [x, k] of [[w2, 2], [w3, 3]]) {
        const box = $1(cv, 'p' + k);
        if (!x) { const l = $1(cv, 'l' + k); if (l) l.hidden = true; continue; }
        const c = $1(cv, 'av' + k);
        wface(K, c, x, k === 2 ? 150 : 140);
        const nm = $1(cv, 'nm' + k); nm.textContent = x.name; nm.dir = 'auto'; shrink(nm, 0.5);
        setT(cv, 'pt' + k, pts(x));
        void box;
      }
    } else if (look === 'glow') {
      if (w1) { wface(K, $1(cv, 'av1'), w1, 150); const n1 = $1(cv, 'nm1'); n1.textContent = w1.name; n1.dir = 'auto'; n1.style.maxWidth = '420px'; n1.style.overflow = 'hidden'; shrink(n1, 0.5); }
      for (const [x, k] of [[w2, 2], [w3, 3]]) {
        const f = $1(cv, 'f' + k);
        if (!x) { if (f) f.hidden = true; continue; }
        wface(K, $1(cv, 'av' + k), x, 110);
        const nm = $1(cv, 'nm' + k); nm.textContent = x.name; nm.dir = 'auto'; shrink(nm, 0.5);
        setT(cv, 'pt' + k, pts(x));
      }
    } else {
      if (w1) wface(K, $1(cv, 'av1'), w1, 300, true);
      setT(cv, 'sub', ctx.tx('mostLikely', { game: ctx.name }));
      setT(cv, 'lol', ctx.tx('lol'));
      setT(cv, 'bff', ctx.tx('bff'));
      const bd = $1(cv, 'badge'); if (bd) bd.textContent = ctx.tx('fav');
      // (a signature from someone else who played, like a real yearbook)
      const others = K.players().filter(p => !w1 || p.id !== w1.id);
      const sig = $1(cv, 'sig');
      if (sig) { if (others.length) sig.textContent = ctx.tx('xo', { name: short(pick(others).name, 12) }); else sig.hidden = true; sig.dir = 'auto'; }
      for (const [x, k] of [[w2, 2], [w3, 3]]) {
        const box = $1(cv, 'p' + k);
        if (!x) { if (box) box.hidden = true; continue; }
        wface(K, $1(cv, 'av' + k), x, 110, true);
        const nm = $1(cv, 'nm' + k); nm.textContent = '#' + k + ' ' + short(x.name, 10); nm.dir = 'auto'; nm.style.whiteSpace = 'nowrap'; nm.style.maxWidth = '220px'; nm.style.overflow = 'hidden'; shrink(nm, 0.5);
      }
    }
    fitNow();
    K.snd.music('bwWin', { fadeOut: 0.6, fadeIn: 0.3 });
    try { P.confetti(200); } catch (e) {}
    // Boo's last word, from the corner
    if (w1 && s.boo !== false) {
      const line = ctx.boo(ctx.kids ? 'kids' : 'end', ctx.booIdx(ctx.kids ? 'kids' : 'end'), { name: w1.name });
      // (on the screen after the game is over too: a timer of its own, not the game's)
      if (line) {
        setTimeout(() => { if (v.cv.isConnected) bubble(K, v, line, { at: 'corner', boo: 'boo:legend', kids: ctx.kids, y: { carnival: 250, glow: 270, yearbook: 230 }[look] }); }, 1800);
        setTimeout(() => { if (v.cv.isConnected) unbubble(v); }, 11000);
      }
    }
    K.boo(false);
    await K.sleep(1200);
  }

  // ---------- the game ----------
  const EN = {
    round: 'Round {n}', live: 'Live votes', voted: '{n}/{t} voted', inn: 'Votes are in!', next: 'Next in {n}', hostNext: 'Waiting for the host',
    scores: 'Scores', scoresAfter: 'The scores after {n} questions', howTo: 'How to play', who: 'Who…?', noRight: 'No right answers!', dizzy: 'Dizzy!',
    step1: 'Step one', step2: 'Step two', step3: 'Step three', winner: 'The winner', points: '{n} points', stars: '{n} stars',
    foot: 'The host can play again, or pick another game.', mostLikely: 'Most likely to win {game}', lol: 'LOL so you!!', bff: 'BFF 4ever',
    fav: 'Class favorite!', xo: '{name} xo', more: '+{n} more', showVotes: 'Show the votes', nextQ: 'Next question', noData: 'The questions didn\'t load. Check the internet and start again.',
    you: 'You', finish: 'Finish'
  };
  const CATS_SET = new Set(CATS.map(c => c[0]));
  BVPLAY.game({
    id: 'boowho', name: 'Boo Who?', emoji: '👻', sub: '"Who is most likely to..." No right answers, just laughs.', mlang: true,
    step: ['Vote for a player', 'Tap who fits the question best. You can pick yourself.'], deco: '👻👑🗳️😂',
    rules: s => rulesOf(s),
    // its looks: the lobby in one of four designs, the screens in their designs (bwlook.css, boowho-tpl.js)
    lobbyDone: (stage, el, s) => lobbyDress(stage, s),
    seated: grid => seatDress(grid),
    get seatRatio() { const L = TPL.lobby[document.body.dataset.bwlook || lookNow()]; return L ? L.ratio : 0.82; },
    get seatGap() { const L = TPL.lobby[document.body.dataset.bwlook || lookNow()]; return L ? L.gap : 1.6; },
    // its own music: the lobby tune, three tunes taking turns all game long, the winner's song; and its moments
    music: { lobby: 'bwLobby', again: 'bwLobby' },
    sounds: ['bwNext', 'bwTimesup', 'bwEvery5', 'pop', 'sparkle', 'tick', 'drumroll', 'coin', 'whoosh', 'flip'],
    ownEnd: true,
    endLook: () => (bwWinLast ? 'bw-' + bwWinLast : ''),
    // (the questions start loading in the lobby, while people join; and the designs' fonts)
    langPrep: lg => { bank(lg).catch(() => {}); },
    prep: lang => { bank(lang).catch(() => {}); try { for (const f of ['700 40px "BW Fredoka"', '800 30px "BW Nunito"', '400 40px "BW Pacifico"', '400 40px "BW Bangers"', '400 40px "BW Anton"', '400 40px "BW Marker"']) document.fonts.load(f).catch(() => {}); } catch (e) {} },
    steps: [
      { t: 'Game mode', s: 'Mode', keys: ['lang', 'mode'] },
      { t: 'Questions', keys: ['cats', 'count', 'own', 'ownOnly'] },
      { t: 'Time', keys: ['sec', 'fast', 'kidSec', 'next', 'wait'] },
      { t: 'Votes and points', s: 'Votes', keys: ['show', 'self', 'golden', 'last', 'scores', 'boo'] },
      { t: 'Looks', keys: ['rules', 'howSec', 'htLook', 'look', 'live', 'win'] }
    ],
    settings: [
      { key: 'mode', label: 'Game mode', type: 'seg', look: 'list', options: MODES, default: 'classic' },
      { key: 'cats', label: 'Categories', type: 'multi', options: CATS.map(c => [c[0], c[2] + ' ' + c[1]]), default: CATS.filter(c => c[0] !== 'spicy').map(c => c[0]), when: ['mode', '!kids'], desc: 'Pick as many as you like. The questions take turns between them.' },
      { key: 'count', label: 'How many questions', type: 'number', min: 1, max: 60, quick: [8, 12, 16, 20, 30], unit: 'questions', default: 12 },
      { key: 'own', label: 'Your own questions (one on each line)', type: 'text', default: '', desc: 'They are mixed in with the others. Write them like "Who is most likely to...?"' },
      { key: 'ownOnly', label: 'Only my own questions', type: 'toggle', default: false, desc: 'Plays only the questions you wrote (when there are some).' },
      { key: 'sec', label: 'Time to vote', type: 'number', min: 0, max: 300, quick: [10, 15, 20, 30, 45], unit: 'seconds', default: 20, when: ['mode', ['classic', 'superstar', 'faceoff']], desc: '0: no clock. Each question waits for everyone, and the host can show the votes any time.' },
      { key: 'fast', label: 'Time to vote', type: 'number', min: 3, max: 30, quick: [5, 6, 8, 10], unit: 'seconds', default: 7, when: ['mode', 'lightning'] },
      { key: 'kidSec', label: 'Time to vote', type: 'number', min: 0, max: 300, quick: [0, 20, 30, 60], unit: 'seconds', default: 0, when: ['mode', 'kids'], desc: '0: no clock. Each question waits until everyone votes.' },
      { key: 'next', label: 'Next question', type: 'seg', options: [['auto', 'Automatic', 'The next question starts by itself after a short wait.'], ['host', 'The host starts it', 'The host taps Next question on their phone when everyone is ready.']], default: 'auto' },
      { key: 'wait', label: 'Wait before the next question', type: 'number', min: 2, max: 120, quick: [4, 6, 8, 12], unit: 'seconds', default: 7, when: ['next', 'auto'] },
      { key: 'show', label: 'Who voted for whom', type: 'seg', options: [['live', 'Live', 'Each vote shows its name as it comes in.'], ['reveal', 'At the end', 'The votes come in without names. The names show when everyone has voted.'], ['secret', 'Secret', 'Only how many votes each player gets, never who voted for whom.']], default: 'live' },
      { key: 'self', label: 'Vote for yourself', type: 'toggle', default: true, desc: 'Players can pick themselves.', when: ['mode', ['classic', 'faceoff', 'lightning', 'kids']] },
      { key: 'golden', label: 'Golden questions', type: 'toggle', default: true, desc: 'Every fifth question is golden: it counts double.', when: ['mode', '!kids'] },
      { key: 'last', label: 'Last question counts double', type: 'toggle', default: true, desc: 'So anyone can still win at the end.', when: ['mode', '!kids'] },
      { key: 'scores', label: 'Scores every 5 questions', type: 'toggle', default: true, desc: 'A look at everyone\'s points after every fifth question.' },
      { key: 'boo', label: 'Boo\'s funny comments', type: 'toggle', default: true, desc: 'Boo says something funny about every result.' },
      { key: 'rules', label: 'How to play first', type: 'toggle', default: true, desc: 'The TV and the phones show how to play before the first question.' },
      { key: 'howSec', label: 'How long it shows', type: 'number', min: 5, max: 120, quick: [8, 12, 20, 30], unit: 'seconds', default: 12, when: ['rules', true] },
      { key: 'htLook', label: 'How to play look', type: 'seg', options: [['mix', 'All three, in turns', 'A different look every game.'], ['glow', 'Party glow'], ['tabloid', 'Tabloid'], ['sleepover', 'Sleepover']], default: 'mix', when: ['rules', true] },
      { key: 'look', label: 'Lobby look', type: 'seg', options: [['mix', 'All four, in turns', 'A different look every game.'], ['comedy', 'Comedy club'], ['comic', 'Comic pop'], ['election', 'Election night'], ['sleepover', 'Sleepover']], default: 'mix' },
      { key: 'live', label: 'Vote screen', type: 'seg', options: [['mix', 'All seven, in turns', 'A different look for every question.'], ['balloon', 'Balloon lift'], ['bar', 'Bar race'], ['columns', 'Columns'], ['ghost', 'Ghost race'], ['gumball', 'Gumball tubes'], ['orbit', 'Orbit'], ['rocket', 'Rocket launch']], default: 'mix' },
      { key: 'win', label: 'Winner screen', type: 'seg', options: [['mix', 'All three, in turns', 'A different one every game.'], ['carnival', 'Carnival'], ['glow', 'Party glow'], ['yearbook', 'Yearbook']], default: 'mix' }
    ],
    async tv(K) {
      const s = K.settings, mode = modeOf(s), kids = mode === 'kids';
      // (the lobby after this game takes the next look in turn)
      bwLook = '';
      const TX = await P.trAll(EN);
      const tx = (k, v) => fill(TX[k] || EN[k] || k, v);
      const name = await K.tr('Boo Who?');
      let D = null;
      try { D = await bank(K.lang); } catch (e) { try { D = await bank('en'); } catch (e2) {} }
      if (!D) { const v = K.view(name); K.el('p', 'question', v, tx('noData')); await K.sleep(6000); return K.players().slice(); }
      // (each player's own language, for the questions and Boo's lines on their phone)
      const langsNow = () => [...new Set(K.players().map(p => K.langOf(p.id)).filter(l => l && l !== K.lang && LANGS.includes(l)))];
      for (const l of langsNow()) bank(l).catch(() => {});
      const own = String(s.own || '').split('\n').map(x => P.safe(x, 120)).filter(Boolean);
      const cats = kids ? KID_CATS : (Array.isArray(s.cats) ? s.cats.filter(c => CATS_SET.has(c)) : []);
      const qs = deck(D, cats.length ? cats : CATS.filter(c => c[0] !== 'spicy').map(c => c[0]), clamp(s.count, 1, 60, 12), own, !!s.ownOnly);
      seenAdd(qs.filter(q => q.id).map(q => q.id));
      const sec = kids ? clamp(s.kidSec, 0, 300, 0) : mode === 'lightning' ? clamp(s.fast, 3, 30, 7) : clamp(s.sec, 0, 300, 20);
      const show = ['live', 'reveal', 'secret'].includes(s.show) ? s.show : 'live';
      // the colors: the designs' own, one for each player (the same on their phones)
      const colors = new Map();
      const colorOf = id => { if (!colors.has(id)) colors.set(id, PAL[colors.size % PAL.length]); return colors.get(id); };
      for (const p of K.players()) colorOf(p.id);
      const booNext = booDeck();
      const tops = new Map();
      const booLine = (Dx, key, i, vars) => { const a = Dx && Dx.boo && Dx.boo[key]; const t = a && a[i % a.length]; return t ? fill(t, vars) : ''; };
      const ctx = {
        mode, kids, tx, name, colorOf,
        who: id => { const p = K.player(id); const nm = p ? p.name : '?'; return { short: short(nm, 9), initial: upper(chars(nm)[0] || '?', K.lang), color: colorOf(id) }; },
        ranked: () => K.players().slice().sort((a, b) => b.score - a.score || (b.bwGot || 0) - (a.bwGot || 0) || String(a.name).localeCompare(String(b.name))),
        roundLabels: n => { const t = tx('round', { n: '\u0001' }).split('\u0001'); return { ra: t[0] || '', rn: n ? K.num(n) : '', rb: t[1] || '' }; },
        booIdx: key => booNext(key),
        boo: (key, i, vars) => booLine(D, key, i, vars)
      };
      // the music: three tunes taking turns all game long (Kids starts with the happiest one, Lightning with the fastest)
      K.snd.music(kids ? 'bwPlayB' : mode === 'lightning' ? 'bwPlayC' : turn('bvplay:bwplay', ['bwPlayA', 'bwPlayB', 'bwPlayC']), { fadeOut: 1.4, fadeIn: 1.6 });
      // (for checking the winner screens on this computer: ?debug&bwwintest goes straight to them)
      if (/[?&]bwwintest\b/.test(location.search) && /[?&]debug\b/.test(location.search)) { K.players().forEach((p, i) => { p.score = [900, 700, 500, 300, 100][i] || 0; }); return end(); }
      // (the game's own how-to-play screen: its setting is called rules, so the kit doesn't show one of its own too)
      if (s.rules !== false) await howTo(K, ctx);
      // (the live screens: all seven taking turns, in a new order each game, or the host's pick)
      const forced = urlPick('bwlive', LIVES);
      let lives = [];
      const liveNext = () => { if (forced) return forced; if (LIVES.includes(s.live)) return s.live; if (!lives.length) lives = shuffle(LIVES); return lives.shift(); };
      // (Face-off: everyone gets their turn, two at a time, never the same two in a row)
      const duels = new Map();
      let lastPair = '';
      const pair = () => {
        const ps = shuffle(K.players());
        ps.sort((a, b) => (duels.get(a.id) || 0) - (duels.get(b.id) || 0));
        let a = ps[0], b = ps[1];
        if (ps.length > 2 && [a.id, b.id].sort().join() === lastPair) b = ps[2];
        lastPair = [a.id, b.id].sort().join();
        for (const p of [a, b]) duels.set(p.id, (duels.get(p.id) || 0) + 1);
        return [a, b];
      };
      for (let i = 0; i < qs.length; i++) {
        if (K.over()) break;
        if (K.players().length < 2) { const v = K.view(name); K.el('p', 'question', v, await K.tr('Boo Who? needs at least 2 players.')); await K.sleep(4000); break; }
        if (i > 0 && i % 5 === 0 && s.scores !== false) { await scores(K, ctx, i); if (K.over()) break; }
        const res = await question(K, ctx, qs[i], i, qs.length, { D, sec, show, liveNext, pair, tops, langsNow, booLine });
        if (K.over()) break;
        if (i < qs.length - 1) {
          if (s.next === 'host') await hostNext(K, res.v, ctx);
          else await nextIn(K, res.v, ctx, clamp(s.wait, 2, 120, 7));
        } else await K.sleep(3500);
      }
      return end();
      async function end() {
        if (K.over()) return [];
        const ps = ctx.ranked();
        const top = ps.slice(0, 3).map(p => ({ id: p.id, name: p.name, score: p.score, photo: p.photo, av: p.av }));
        await winners(K, ctx, top);
        ps.own = true;
        return ps;
      }
    }
  });

  // one question: Boo's word first when it's a special one, the question on the TV and every phone (each in its
  // player's language), the votes flying in, the names (at the end, or never), the points, and Boo's line
  async function question(K, ctx, q, i, total, o) {
    const s = K.settings, mode = ctx.mode, kids = ctx.kids;
    const golden = !kids && s.golden !== false && (i + 1) % 5 === 0;
    const last = i === total - 1, dbl = golden || (!kids && last && s.last !== false && total > 2);
    const text = q.id ? qText(o.D, q.id) : q.own;
    const all = K.alive();
    // who is on the board: everyone, or the two in the face-off
    let cands = mode === 'faceoff' && all.length > 2 ? o.pair() : K.players().slice();
    const cap = CAP;
    const look = o.liveNext();
    const lanesOf = keys => keys.map(id => { const p = K.player(id); return { key: id, name: p ? p.name : '?', color: ctx.colorOf(id), face: p ? K.avatarUrl(p) : P.booUri('boo:hi'), ph: !!(p && p.photo) }; });
    let lanes = cands.map(p => p.id).slice(0, cap[look]);
    const lbl = Object.assign(ctx.roundLabels(i + 1), { question: text, statusLabel: ctx.tx('live'), votedLabel: ctx.tx('voted', { n: K.num(0), t: K.num(all.length) }) });
    const v = await liveScreen(K, ctx, look, { lanes: lanesOf(lanes), total: all.length, labels: lbl, gold: dbl, sec: o.sec, voters: all, more: cands.length - lanes.length });
    v.dockEl = v.cv.querySelector('.bw-dock');
    const atQ = look === 'bar' || look === 'columns' ? 'q' : 'sky';
    // Boo first: the first question, a golden one, the last one
    const intro = i === 0 ? 'start' : golden ? 'golden' : last ? 'last' : '';
    if (intro && s.boo !== false) {
      const line = ctx.boo(intro, ctx.booIdx(intro));
      if (line) { bubble(K, v, line, { at: atQ, boo: intro === 'golden' ? 'boo:party' : intro === 'last' ? 'boo:wow' : 'boo:hi', kids, color: golden ? '#ffc93c' : undefined }); await K.sleep(2800); unbubble(v); if (v.dockEl) v.dockEl.hidden = false; }
    }
    if (K.over()) return { v };
    K.snd.sting('bwNext', { duck: 0.45 });
    // the question on every phone too, in each player's own language
    const tr = {};
    if (q.id) await Promise.all(o.langsNow().map(lg => bankBy(lg, 1500).then(Dl => { const t = qText(Dl, q.id); if (t) tr[lg] = { p: t }; }).catch(() => {})));
    const self = mode !== 'superstar' && s.self !== false;
    const opts = cands.map(p => ({ id: p.id, name: p.name, ph: !!p.photo, av: p.av, c: ctx.colorOf(p.id) }));
    const extra = { bw: { m: mode, gold: dbl ? 1 : 0, n: i + 1, of: total, self: self ? 1 : 0, show: o.show } };
    if (Object.keys(tr).length) extra.tr = tr;
    const st = v.st;
    const shown = o.show === 'live';
    let voted = 0;
    const ck = clock(K, v, o.sec);
    // (a big room: the lanes go to the ones with the most votes, each keeping its place)
    const relane = () => {
      if (cands.length <= cap[look]) return;
      const cnt = id => st.cast.filter(x => x.target === id).length;
      const want = cands.map(p => p.id).sort((a, b) => cnt(b) - cnt(a)).slice(0, cap[look]);
      for (const id of want) {
        if (lanes.includes(id)) continue;
        const out = lanes.slice().sort((a, b) => cnt(a) - cnt(b)).find(x => !want.includes(x));
        if (out == null || cnt(id) <= cnt(out)) continue;
        lanes[lanes.indexOf(out)] = id;
      }
      st.cands = lanesOf(lanes);
    };
    // (the host can show the votes any time when there's no clock)
    const stopReveal = !o.sec ? hostReveal(K, ctx) : () => {};
    const votedWho = [];
    const got0 = await K.ask({ kind: 'players', prompt: text, opts, sec: o.sec, open: !o.sec, extra,
      onAns: (id, a) => {
        if (!cands.some(p => p.id === a.v)) return;
        if (!self && a.v === id) return;
        st.cast.push({ voter: id, target: a.v, show: shown, an: 'bwk-chipIn' });
        voted++;
        relane();
        v.labels.votedLabel = ctx.tx('voted', { n: K.num(voted), t: K.num(Math.max(voted, all.length)) });
        v.redraw();
        const d = v.dock.get(id); if (d) d.classList.add('on');
        K.snd.fx('pop', { duck: 0.9 });
        if (kids) star(v, d);
        votedWho.push(id);
        K.say({ k: 'bwv', n: K.qn(), v: votedWho.slice(0, 40) });
      } });
    stopReveal();
    // (only the votes that count: for someone on the board, and not for yourself when that's not allowed)
    const got = new Map([...got0].filter(([id, a]) => cands.some(p => p.id === a.v) && (self || a.v !== id)));
    ck.stop();
    if (K.over()) return { v };
    // (time's up before everyone voted)
    if (o.sec && got0.size < all.length) K.snd.sting('bwTimesup', { duck: 0.5 });
    v.labels.statusLabel = ctx.tx('inn');
    if (look !== 'bar' && look !== 'columns') v.labels.votedLabel = ctx.tx('inn');
    v.redraw();
    if (v.dockEl) v.dockEl.hidden = true;
    // the names, one by one, when they show at the end
    if (o.show === 'reveal' && st.cast.length) {
      K.snd.fx('drumroll', { duck: 0.7 });
      await K.sleep(900);
      const per = Math.max(180, Math.min(420, 3600 / st.cast.length));
      for (const x of st.cast) { if (K.over()) break; x.show = true; x.an = 'bwk-flipIn'; v.redraw(); K.snd.fx('flip', { duck: 0.9 }); await K.sleep(per); }
    }
    // the result: who got the most votes
    const count = new Map();
    for (const x of st.cast) count.set(x.target, (count.get(x.target) || 0) + 1);
    const topN = Math.max(0, ...count.values());
    const winners = [...count].filter(([, n]) => n === topN && topN > 0).map(([id]) => id);
    for (const id of winners) o.tops.set(id, (o.tops.get(id) || 0) + 1);
    // the points
    const mult = dbl ? 2 : 1;
    const gain = new Map();
    const add = (id, n) => { const p = K.player(id); if (!p || !n) return; p.score += n; gain.set(id, (gain.get(id) || 0) + n); };
    for (const [id, n] of count) { const p = K.player(id); if (p) p.bwGot = (p.bwGot || 0) + n; }
    if (mode === 'superstar') for (const [id, n] of count) add(id, 100 * n * mult);
    else if (kids) { for (const [id] of got) add(id, 100); for (const id of winners) add(id, 100); }
    else for (const [id, a] of got) {
      if (!winners.includes(a.v)) continue;
      let pts = 100;
      if (mode === 'lightning' && o.sec) pts += Math.round(50 * Math.max(0, 1 - (a.ms || 0) / (o.sec * 1000)));
      add(id, pts * mult);
    }
    if (gain.size) K.snd.fx('coin', { duck: 0.85 });
    if (kids && st.cast.length) try { P.confetti(90); } catch (e) {}
    // Boo's line about it: the situation decides which ten lines it comes from
    const nm = id => (K.player(id) || {}).name || '';
    // (names in a list the way each language writes one: "Sara, Omar and Lina", "Sara、Omar和Lina", "Sara وOmar وLina")
    const namesIn = async (lg, ids) => {
      const a = ids.map(nm);
      try { if (window.Intl && Intl.ListFormat) return new Intl.ListFormat(lg, { style: 'long', type: 'conjunction' }).format(a); } catch (e) {}
      return listOf(a, await K.trFor(lg, 'and'));
    };
    const kidsIn = async lg => (await namesIn(lg, winners.slice(0, 3))) + (winners.length > 3 ? ' ' + (await K.trFor(lg, '+{n} more', { n: winners.length - 3 })) : '');
    let key = 'top', vars = {}, mood = 'boo:laugh';
    if (!st.cast.length) { key = 'none'; mood = 'boo:sad'; }
    else if (kids) { key = 'kids'; vars = { name: await kidsIn(K.lang) }; mood = 'boo:party'; }
    else if (winners.length > 1) { key = 'tie'; vars = { names: await namesIn(K.lang, winners) }; mood = 'boo:mind'; }
    else {
      const w = winners[0], sorted = [...count.values()].sort((a, b) => b - a);
      vars = { name: nm(w) };
      const selfVote = st.cast.some(x => x.voter === w && x.target === w);
      const again = o.tops.get(w) || 0;
      if (topN === st.cast.length && st.cast.length >= 3 && cands.length > 2) { key = 'all'; mood = 'boo:wow'; }
      else if (selfVote && Math.random() < 0.7) { key = 'self'; mood = 'boo:cool'; }
      else if (again >= 2 && Math.random() < 0.55) { key = 'again'; vars.n = K.num(again); }
      else if (sorted.length > 1 && sorted[0] - sorted[1] === 1 && st.cast.length >= 3 && Math.random() < 0.5) key = 'close';
      else if (q.id && Math.random() < 0.55) key = 'cat.' + q.id.split('.')[0];
    }
    const bi = ctx.booIdx(key);
    const line = s.boo !== false ? o.booLine(o.D, key, bi, vars) : '';
    // the results on every phone, each in its own language
    for (const p of K.players()) {
      const lg = K.langOf(p.id) || K.lang;
      const Dl = lg === K.lang ? o.D : await bankBy(lg, 1500).catch(() => null);
      const a = got.get(p.id), mine = a ? a.v : null;
      const g = gain.get(p.id) || 0;
      const t = (x, vv) => K.trFor(lg, x, vv);
      let title;
      if (!a && !kids) title = await t('No vote this time');
      else if (mode === 'superstar') title = await t((count.get(p.id) || 0) === 1 ? 'You got 1 vote!' : 'You got {n} votes!', { n: count.get(p.id) || 0 });
      else if (kids) title = await t(a ? 'Yay! You got a star!' : 'Nice try!');
      else title = await t(winners.includes(mine) ? 'You voted with the crowd!' : winners.includes(p.id) ? 'The room picked you!' : 'The crowd picked someone else');
      // (a list of names, written the way the phone's language writes one)
      let vv = vars;
      if (lg !== K.lang && s.boo !== false) { if (key === 'tie') vv = Object.assign({}, vars, { names: await namesIn(lg, winners) }); else if (key === 'kids') vv = Object.assign({}, vars, { name: await kidsIn(lg) }); }
      const ln = s.boo !== false ? o.booLine(Dl || o.D, key, bi, vv) : '';
      K.result(p.id, { bw: 1, ok: g > 0, pts: g, score: p.score, title, note: ln, boo: g > 0 ? 'boo:party' : 'boo:hi',
        top: winners.slice(0, 4).map(id => ({ id, n: nm(id), v: count.get(id) || 0, c: ctx.colorOf(id) })), you: count.get(p.id) || 0, gold: dbl ? 1 : 0, kids: kids ? 1 : 0 });
    }
    await K.sleep(700);
    if (line) bubble(K, v, line, { at: atQ, boo: mood, kids });
    K.boo(false);
    return { v };
  }
  // ("Sara and Omar", "Sara, Omar and Lina")
  const listOf = (a, and) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ' + and + ' ' + a[a.length - 1]);
  // Kids: a star flies up from each vote
  function star(v, at) {
    try {
      const s = mk('div', 'bw-star', v.cv, '⭐');
      const r = at && at.isConnected ? at.getBoundingClientRect() : null, c = v.cv.getBoundingClientRect(), k = c.width / 1920 || 1;
      s.style.left = (r ? (r.left - c.left) / k - 10 : 900 + rnd(120)) + 'px';
      s.style.top = (r ? (r.top - c.top) / k - 20 : 600) + 'px';
      setTimeout(() => s.remove(), 1700);
    } catch (e) {}
  }
  // ---------- moving on: by itself after a short wait (counting down in the screen's sign), or when the host taps ----------
  async function nextIn(K, v, ctx, secs) {
    for (let n = secs; n > 0 && !K.over(); n--) {
      if (n <= 5 || n === secs) { const t = ctx.tx('next', { n: K.num(n) }); v.labels.statusLabel = t; if (v.look !== 'bar' && v.look !== 'columns') v.labels.votedLabel = t; v.redraw(); }
      await K.sleep(1000);
    }
  }
  async function hostNext(K, v, ctx) {
    const t = ctx.tx('hostNext');
    v.labels.statusLabel = t; if (v.look !== 'bar' && v.look !== 'columns') v.labels.votedLabel = t; v.redraw();
    const n = K.qn(), label = ctx.tx('nextQ');
    let go = false;
    const off = K.on('next', (m, p) => { if (+m.n === n && K.isHost(p.id)) go = true; });
    K.hostWait(true);
    for (let k = 0; !go && !K.over(); k++) {
      if (k % 8 === 0) { const h = K.players().find(p => K.isHost(p.id)); if (h) K.sayTo(h.id, { k: 'nextq', n, label }); }
      await K.sleep(500);
    }
    K.hostWait(false); off();
  }
  function hostReveal(K, ctx) {
    let on = true;
    (async () => {
      await K.sleep(300);
      const n = K.qn(), label = ctx.tx('showVotes');
      const off = K.on('reveal', (m, p) => { if (+m.n === n && K.isHost(p.id)) K.close(n); });
      for (let k = 0; on && !K.over(); k++) { if (k % 8 === 0) { const h = K.players().find(p => K.isHost(p.id)); if (h) K.sayTo(h.id, { k: 'revealq', n, label }); } await K.sleep(500); }
      off();
    })();
    return () => { on = false; };
  }

  // (Boo Who? keeps its place in the list of games: second, after Trivia)
  try {
    const m = BVPLAY.games;
    if (m && m.has('boowho') && m.has('trivia')) {
      const e = [...m.entries()], b = e.find(x => x[0] === 'boowho');
      const rest = e.filter(x => x[0] !== 'boowho');
      rest.splice(rest.findIndex(x => x[0] === 'trivia') + 1, 0, b);
      m.clear(); for (const [k, v] of rest) m.set(k, v);
    }
  } catch (e) {}
  // (for checking on this computer: the lines and the questions)
  if (/[?&]debug\b/.test(location.search)) window.__bw = { bank, deck, vals, rulesOf, TPL };
})();
