// Blokvane party games, the TV: the party game kit. It runs the room everyone joins (a QR code and a short code), the
// lobby (players pop in with their photo or Boo, a check mark once they're ready), the host's phone (the first one in)
// that picks the game and its settings, and everything games share: asking every phone at once, the live scoreboard,
// the countdown, the winner with confetti, and "Play again" with everyone still connected. Each game (games.js) only
// says what happens in its rounds. Players' photos only ever go to this screen and are never saved.
var BVPLAY = (() => {
  'use strict';
  const L = BVLIVE, C = BVWT_CORE, P = BVPLAYC;
  const GO = L.GO;
  const stage = document.getElementById('stage');
  const games = new Map();
  const players = new Map();      // id -> { id, name, av, photo, color, team, ready, score, right, lives, out, streak, away, at, helpers }
  let R = null, CR = null, code = '', host = '', game = null, settings = {}, phase = 'lobby', lang = 'en', strings = Object.assign({}, P.STR), round = 0, secret = '';
  const I18N = BVI18N;
  const handlers = new Map();     // message kind -> fn(m, player) (a game listens while it runs)
  const pending = new Map();      // round -> { who: Set, got: Map, done, onAns }
  function el(tag, cls, parent, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const list = () => [...players.values()].filter(p => !p.away);
  const alive = () => list().filter(p => !p.out);
  const avatarUrl = p => p.photo || P.booUri(p.av) || P.booUri('boo:hi');
  // (the host is ready by starting the game)
  const pub = p => ({ id: p.id, name: p.name, av: p.av, ph: !!p.photo, color: p.color, team: p.team, ready: !!p.ready || p.id === host, score: p.score, lives: p.lives, out: !!p.out });

  // ---------- the room ----------
  async function open(given) {
    const me = await C.newMember();
    const s = secret = L.newSecret();
    R = await L.room({ secret: s, label: 'bvplay', me, name: 'TV', role: 'tv', open: true, onMsg: (m, p) => take(m, p), onPeers: () => sweep() });
    // a short code for phones that can't scan: a room of its own that only hands out the link. (A phone that started
    // this game from Blokvane made the code itself, so it joins by itself as the host.)
    code = given || L.shortCode(6);
    CR = await L.room({ secret: await L.codeSecret(code, 'play'), label: 'bvplaycode', me, name: 'TV', role: 'tv', open: true, onMsg: m => { if (m.k === 'link?') CR.send({ k: 'link', s, tv: R.id, lang }, m.f).catch(() => {}); } });
    setInterval(() => { if (phase !== 'end') sayLobby(); }, 12000);
  }
  // what the phones scan: the game's room, and the language the game is in (so a phone shows it from the first screen)
  const linkNow = () => GO + '#game.' + secret + '.' + R.id + (lang !== 'en' ? '.' + lang : '');
  // the game's language, everywhere on this screen
  async function setLang(v) {
    lang = v;
    await P.useLang(lang);
    strings = await P.trAll(P.STR);
    document.documentElement.lang = lang;
    document.documentElement.dir = P.RTL.has(lang) ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', P.RTL.has(lang));
    document.title = P.f('Blokvane party games');
    // (a setting that the new language doesn't have, like a Trivia category with no questions in it, goes back)
    if (game && game.langOptions) for (const [key, fn] of Object.entries(game.langOptions)) { const f = game.settings.find(x => x.key === key); if (f && !fn(lang, f.options).some(o => String(o[0]) === String(settings[key]))) settings[key] = f.default; }
  }
  function sweep() {
    // someone whose phone went quiet for a while is away (they come back as themselves)
    let changed = false;
    for (const p of players.values()) { const here = R.here(p.id); if (p.away === here) { p.away = !here; changed = true; } }
    if (changed) {
      // (a phone that went away doesn't hold up the question everyone else already answered)
      for (const w of pending.values()) { for (const id of [...w.who]) { const p = players.get(id); if (p && p.away && !w.got.has(id)) w.who.delete(id); } if (w.got.size >= w.who.size) w.finish(); }
      pickHost(); if (phase === 'lobby') lobby(); sayLobby();
    }
  }
  function pickHost() { if (!players.has(host) || players.get(host).away) { const next = list()[0]; host = next ? next.id : ''; } }
  function take(m, peer) {
    if (!m || typeof m.k !== 'string' || !L.okId(m.f)) return;
    const p = players.get(m.f);
    switch (m.k) {
      case 'join': {
        if (!p && players.size >= 40) { R.send({ k: 'full' }, m.f).catch(() => {}); return; }
        const pl = p || { id: m.f, score: 0, right: 0, lives: 3, out: false, streak: 0, helpers: {}, color: P.COLORS[players.size % P.COLORS.length], team: '' };
        pl.name = P.name(m.name); pl.av = P.AVATARS.includes(m.av) ? m.av : 'boo:hi'; pl.away = false; pl.at = Date.now();
        if (game && game.teams && settings.teams && !pl.team) pl.team = P.TEAMS[players.size % Math.min(4, +settings.teamN || 2)][0];
        const isNew = !p;
        players.set(m.f, pl);
        pickHost();
        if (isNew) P.sfx('join');
        R.send({ k: 'you', id: m.f, host: host === m.f, color: pl.color }, m.f).catch(() => {});
        if (phase === 'lobby') lobby();
        sayLobby();
        // (someone back in the middle of a game: what's on now)
        if (phase === 'play' && cur.q) R.send(cur.q, m.f).catch(() => {});
        return;
      }
      case 'photo': if (p && m.boxed && L.okPicture(m.d) && m.d.length < 60000) { p.photo = m.d; if (phase === 'lobby') lobby(); } return;
      case 'ready': if (p) { p.ready = !!m.on; if (phase === 'lobby') lobby(); sayLobby(); } return;
      case 'team': if (p && P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).some(t => t[0] === m.team)) { p.team = m.team; if (phase === 'lobby') lobby(); sayLobby(); } return;
      case 'set': if (p && m.f === host && phase === 'lobby') setOne(m.key, m.v); return;
      case 'game': if (p && m.f === host && (phase === 'lobby' || phase === 'end') && games.has(m.id)) { choose(m.id); } return;
      case 'start': if (p && m.f === host && phase === 'lobby' && game) start(); return;
      case 'stop': if (p && m.f === host && phase === 'play') stopGame(); return;
      case 'again': if (p && m.f === host && phase === 'end') { phase = 'lobby'; for (const x of players.values()) { x.ready = true; } lobby(); sayLobby(); } return;
      case 'sync': if (p) { R.send({ k: 'you', id: m.f, host: host === m.f, color: p.color }, m.f).catch(() => {}); sayLobby(m.f); if (phase === 'play' && cur.q) R.send(cur.q, m.f).catch(() => {}); } return;
      case 'ans': {
        const w = pending.get(+m.n);
        if (!w || !p || w.done || !w.who.has(m.f) || w.got.has(m.f)) return;
        w.got.set(m.f, { v: m.v, ms: Math.max(0, Math.min(600000, +m.ms || 0)), at: Date.now() });
        if (w.onAns) { try { w.onAns(m.f, w.got.get(m.f)); } catch (e) {} }
        if (w.got.size >= w.who.size) w.finish();
        return;
      }
      default: { const h = handlers.get(m.k); if (h && p) { try { h(m, p); } catch (e) { console.warn('Blokvane play', e); } } }
    }
  }
  const say = m => R.send(m).catch(() => {});
  const sayTo = (id, m) => R.send(m, id).catch(() => {});
  async function box(id, m) {
    for (let i = 0; i < 6; i++) {
      try { await R.box(id, m); return true; } catch (e) { await sleep(800); }
    }
    // (a secret word only ever goes sealed for that one phone; anything else may go the ordinary way)
    if (m.k !== 'secret') { R.send(m, id).catch(() => {}); return true; }
    return false;
  }
  // teams: everyone without one (or on a team that's not in the game) joins the smallest team
  function balanceTeams() {
    if (!(game && game.teams && settings.teams)) return;
    const ids = P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).map(t => t[0]);
    const size = t => list().filter(p => p.team === t).length;
    for (const p of list()) if (!ids.includes(p.team)) { p.team = ''; }
    for (const p of list()) if (!p.team) p.team = ids.slice().sort((a, b) => size(a) - size(b))[0];
  }
  // what the phones show in the lobby (the game, its settings, the players, the host)
  function sayLobby(to) {
    const tt = tx.key === (game ? game.id : '') + '|' + lang ? tx : null;
    const m = { k: 'lobby', phase, game: game ? game.id : '', gname: game ? (tt ? tt.name : P.f(game.name)) : '', games: (tx.lang === lang && tx.games) || [...games.values()].map(g => ({ id: g.id, name: P.f(g.name), e: g.emoji, sub: P.f(g.sub) })),
      players: list().map(pub), host, settings, schema: game ? (tt ? tt.schema : game.settings) : [], lang, rtl: P.RTL.has(lang), strings };
    if (to) sayTo(to, m); else say(m);
  }
  // the game list and the settings in the game's language (the host's phone shows them)
  const tx = { key: '', lang: '', games: null, name: '', schema: null };
  async function retranslate() {
    const want = (game ? game.id : '') + '|' + lang;
    const gl = await Promise.all([...games.values()].map(async g => ({ id: g.id, name: await P.tr(g.name), e: g.emoji, sub: await P.tr(g.sub) })));
    const optsOf = f => (game.langOptions && game.langOptions[f.key] ? game.langOptions[f.key](lang, f.options) : f.options);
    // (each choice keeps its short explanation, and a setting its own, in the game's language)
    const schema = game ? await Promise.all(game.settings.map(async f => Object.assign({}, f, { label: await P.tr(f.label), desc: f.desc ? await P.tr(f.desc) : undefined, unit: f.unit ? await P.tr(f.unit) : undefined,
      options: f.options ? await Promise.all(optsOf(f).map(async o => (o[2] ? [o[0], await optLabel(o[1]), await P.tr(o[2])] : [o[0], await optLabel(o[1])]))) : undefined }))) : null;
    const name = game ? await P.tr(game.name) : '';
    if (want !== (game ? game.id : '') + '|' + lang) return;
    Object.assign(tx, { key: want, lang, games: gl, name, schema });
    sayLobby();
  }
  async function setOne(key, v) {
    if (key === 'lang') { if (I18N.ok(v)) await setLang(v); lobby(); sayLobby(); retranslate(); return; }
    const f = game && game.settings.find(x => x.key === key);
    if (!f) return;
    if (f.type === 'toggle') settings[key] = !!v;
    else if (f.options && f.options.some(o => String(o[0]) === String(v))) settings[key] = f.options.find(o => String(o[0]) === String(v))[0];
    else if (f.type === 'text') settings[key] = String(v == null ? '' : v).split(/\n/).map(x => P.safe(x, 90)).filter(Boolean).join('\n').slice(0, 1500);
    else if (f.type === 'number') { const n = Math.round(Number(v)); if (!Number.isFinite(n)) return; settings[key] = Math.max(f.min || 0, Math.min(f.max || 999, n)); }
    if (key === 'teams' || key === 'teamN') balanceTeams();
    lobby(); sayLobby();
  }
  function choose(id) {
    game = games.get(id);
    settings = {};
    for (const f of game.settings) settings[f.key] = f.default;
    phase = 'lobby';
    try { history.replaceState(null, '', '#' + id + (lang !== 'en' ? '.' + lang : '')); } catch (e) {}
    lobby(); sayLobby(); retranslate();
  }

  // ---------- the screen ----------
  function top(parent, title, sub, right) {
    const t = el('header', 'top', parent);
    const lg = el('div', 'logo', t); const im = el('img', '', lg); im.src = P.booUri('boo:party'); im.alt = '';
    const d = el('div', 'grow', t); el('h1', '', d, title); if (sub) el('div', 'sub', d, sub);
    if (right) for (const r of [].concat(right)) t.appendChild(r);
    return t;
  }
  // The lobby, like a game show's welcome screen: how to join (the QR code and the code, as tiles), the steps, everyone
  // who is in (with a check once they're ready, and empty seats waiting), and what's special about the game.
  // ---------- the size of everything on this screen. It fits any screen by itself (play.css); Ctrl + and Ctrl - (or Ctrl
  // with the mouse wheel, or the A- and A+ buttons in the lobby) make it bigger or smaller, Ctrl 0 puts it back. This
  // screen remembers it. ----------
  const ZK = 'bvplay:zoom', ZMIN = 0.6, ZMAX = 1.5;
  let zoom = 1, zoomTip = null, zoomT = 0;
  const zoomSubs = new Set();
  try { const z = +localStorage.getItem(ZK); if (z) zoom = z; } catch (e) {}
  function setZoom(z, show) {
    zoom = Math.round(Math.min(ZMAX, Math.max(ZMIN, z)) * 10) / 10;
    document.documentElement.style.setProperty('--z', String(zoom));
    document.documentElement.classList.toggle('zoomed', zoom > 1);
    try { localStorage.setItem(ZK, String(zoom)); } catch (e) {}
    for (const f of zoomSubs) { try { f(); } catch (e) {} }
    if (show) {
      if (!zoomTip) zoomTip = el('div', 'zm-tip', document.body);
      zoomTip.textContent = '🔍 ' + Math.round(zoom * 100) + '%';
      zoomTip.classList.add('on');
      clearTimeout(zoomT); zoomT = setTimeout(() => zoomTip.classList.remove('on'), 1400);
    }
  }
  const zoomBy = d => setZoom(d ? zoom + d * 0.1 : 1, true);
  setZoom(zoom, false);
  addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomBy(1); }
    else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomBy(-1); }
    else if (e.key === '0') { e.preventDefault(); zoomBy(0); }
  }, true);
  let wheelSum = 0;
  addEventListener('wheel', e => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    wheelSum += e.deltaY;
    if (Math.abs(wheelSum) >= 60) { zoomBy(wheelSum < 0 ? 1 : -1); wheelSum = 0; }
  }, { passive: false });
  // (the same keys pressed in Blokvane's own window around the game, when it is the one listening)
  addEventListener('message', e => { const m = e.data; if (e.source === parent && parent !== window && m && typeof m.bvZoom === 'number') zoomBy(Math.sign(m.bvZoom)); });

  // music and sound effects (sound.js); a quiet stand-in if it didn't load
  const SND = window.BVSOUND ||{ preload() {}, music() {}, sting() {}, unlock() {}, setOn() {}, enabled: () => false, state: () => 'none', onChange: () => () => {} };
  let sndOff = null;
  // A browser keeps a page quiet until someone clicks it (or presses a key) once, and the players only touch their
  // phones: so a game with sounds shows a hint at the top until then. Any click anywhere turns the sound on.
  let hintEl = null, hintRun = 0;
  async function soundHint() {
    const my = ++hintRun;
    const show = !!(game && game.sounds) && SND.state() === 'locked';
    if (!show) { if (hintEl) hintEl.hidden = true; return; }
    const text = '🔈 ' + await P.tr('Click anywhere on this screen to turn on the sound');
    if (my !== hintRun) return;
    if (!hintEl) { hintEl = el('button', 'snd-hint', document.body); hintEl.type = 'button'; hintEl.dataset.snd = '1'; hintEl.onclick = () => SND.unlock(); }
    hintEl.textContent = text;
    hintEl.hidden = false;
  }
  SND.onChange(() => soundHint());
  // (it's built off screen, then shown in one go: a newer lobby, like one more player joining, replaces it)
  let lobbyRun = 0, lastSpot = '';
  async function lobby() {
    const my = ++lobbyRun;
    const page = document.createElement('div');
    const g = game;
    const T = (t, v) => P.tr(t, v);
    const LET = I18N.letters(lang);
    // the top: Boo, the game, and the game's own little sign on the right
    const t = top(page, await T(g ? g.name : 'Party games'), await T(g ? g.sub : 'Scan the code to join. The first phone in picks the game.'));
    t.classList.add('lob-top');
    const deco = el('div', 'deco', t);
    const dk = g && g.deco ? g.deco : 'letters';
    if (dk === 'letters') LET.slice(0, 4).forEach((x, i) => { const d = el('span', 'tile-l ' + 'ABCD'[i], deco, x); void d; });
    else if (dk === 'bingo') for (const x of 'BINGO') el('span', 'tile-b', deco, x);
    else for (const x of [...dk.matchAll(/\p{Extended_Pictographic}(‍\p{Extended_Pictographic}|️)*/gu)].map(m => m[0]).slice(0, 4)) el('span', 'tile-e', deco, x);
    const body = el('div', 'body lob', page);
    // left: the steps
    const left = el('div', 'col lob-l', body);
    const jc = el('div', 'card join', left);
    const q = el('div', 'qr', jc);
    try { q.appendChild(BVQR.svgOf(linkNow(), { border: 1 })); } catch (e) {}
    const jt = el('div', 'jt', jc);
    const s1 = el('div', 'stp', jt); el('span', 'n', s1, '1'); el('b', '', s1, await T('Scan with your camera'));
    el('div', 'muted or', jt, await T('or open Blokvane and type'));
    const ct = el('div', 'codetiles', jt);
    ct.setAttribute('aria-label', code);
    for (const ch of code) el('span', '', ct, ch);
    const two = el('div', 'steps2', left);
    const st2 = el('div', 'card stp-c', two);
    const s2 = el('div', 'stp', st2); el('span', 'n', s2, '2'); el('b', '', s2, await T('Name + selfie'));
    el('p', '', st2, await T('Take a photo or pick a Boo, then tap Ready.'));
    const st3 = el('div', 'card stp-c', two);
    const step = g && g.step ? g.step : ['Pick a game', 'The first phone in is the host and picks the game.'];
    const s3 = el('div', 'stp', st3); el('span', 'n', s3, '3'); el('b', '', s3, await T(step[0], { letters: LET.slice(0, 4).join(' ') }));
    el('p', '', st3, await T(step[1]));
    // right: who's in
    const right = el('div', 'col grow lob-r', body);
    const ps = list();
    const head = el('div', 'ph', right);
    el('h2', '', head, ps.length ? await T(ps.length === 1 ? '1 player' : '{n} players', { n: ps.length }) : await T('Waiting for players...'));
    const hp = players.get(host);
    if (hp) el('div', 'pill', head, await T('Host: {name}', { name: hp.name }));
    const cols = ps.length <= 8 ? 4 : ps.length <= 15 ? 5 : ps.length <= 24 ? 6 : 8;
    const grid = el('div', 'slots', right);
    grid.style.setProperty('--cols', cols);
    grid.classList.toggle('small', cols > 5);
    for (const p of ps) {
      const c = el('div', 'seat', grid);
      c.style.setProperty('--pc', p.color);
      const av = el('div', 'av', c); const im = el('img', '', av); im.src = avatarUrl(p); im.alt = '';
      if (p.ready || p.id === host) el('span', 'ok', av, '✓');
      el('b', '', c, p.name);
      if (p.team) { const tm = P.TEAMS.find(x => x[0] === p.team); if (tm) { const tb = el('small', 'team', c, await T(tm[1])); tb.style.color = tm[2]; } }
    }
    // (empty seats fill the rows; the first ones invite people in)
    // (with the game mode card below, one row is enough while everyone fits, plus a free seat)
    const seats = g && g.spot ? Math.max(cols, Math.ceil((ps.length + 1) / cols) * cols) : Math.max(cols * 2, Math.ceil(ps.length / cols) * cols);
    const joinWord = await T('join');
    for (let i = ps.length; i < seats; i++) { const e = el('div', 'seat empty', grid); if (i < ps.length + 2) el('span', '', e, joinWord); }
    // what's special about this game: the mode the host picked, explained (Trivia), its helpers, or how it plays
    if (g && g.spot) { body.classList.add('has-spot'); await spotCard(right, g.spot(settings)); }
    else if (g) {
      const ex = el('div', 'lob-x', right);
      if (g.helpers) {
        el('div', 'lbl', ex, await T('4 helpers · each works once'));
        const chips = el('div', 'chips', ex);
        for (const h of g.helpers) el('span', 'chip', chips, await T(h));
      } else if (g.rules && g.rules.length) {
        el('div', 'lbl', ex, await T('How to play'));
        const ol = el('ol', 'howto2', ex);
        for (const r of g.rules) el('li', '', ol, await T(r));
      }
    }
    // the bottom: what happens next, and the credit
    const ft = el('div', 'lob-foot', page);
    const fl = el('div', 'lf', ft);
    el('b', '', fl, g ? await T(hp ? 'The host starts the game from their phone.' : 'Waiting for the host.') : await T('Made by Blokvane. No app, no account: your phone and this screen talk straight to each other.'));
    // the sound button: "Click for sound" until the browser lets this page play sound, then on or off
    const sw = { locked: '🔈 ' + await T('Click for sound'), on: '🔊 ' + await T('Sound on'), off: '🔇 ' + await T('Sound off') };
    const sb = el('button', 'snd', fl);
    sb.type = 'button'; sb.dataset.snd = '1';
    const paint = () => { const st = SND.state(); sb.hidden = st === 'none'; sb.textContent = sw[st] || ''; sb.classList.toggle('off', st !== 'on'); };
    sb.onclick = () => { const st = SND.state(); if (st === 'locked') SND.unlock(); else SND.setOn(st !== 'on'); };
    paint();
    // the screen size: smaller, bigger (Ctrl - and Ctrl + do the same)
    const zs = el('span', 'zm', fl);
    zs.title = await T('Screen size');
    const zb = async (t, lab, d) => { const b = el('button', '', zs, t); b.type = 'button'; b.setAttribute('aria-label', await T(lab)); b.onclick = () => zoomBy(d); };
    await zb('A−', 'Smaller', -1);
    const zv = el('span', 'zv', zs);
    await zb('A+', 'Bigger', 1);
    const zpaint = () => { zv.textContent = Math.round(zoom * 100) + '%'; };
    zpaint();
    zoomSubs.clear(); zoomSubs.add(zpaint);
    const c = g && (typeof g.credit === 'function' ? g.credit(lang) : g.credit);
    if (c) el('small', '', ft, P.f(c));
    if (my !== lobbyRun || phase === 'play') return;
    stage.textContent = '';
    stage.append(...page.childNodes);
    if (sndOff) sndOff();
    sndOff = SND.onChange(paint);
    soundHint();
    // the game's own lobby tune (Trivia), loaded with its other sounds while people join
    if (g && g.sounds) { SND.preload(g.sounds); SND.music('theme', { fadeIn: 1.5 }); } else SND.music(null);
    // (and its questions, in the language picked)
    if (g && g.prep) { try { g.prep(lang); } catch (e) {} }
    const sp = stage.querySelector('.spot');
    if (sp) { requestAnimationFrame(() => fitSpot(sp)); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitSpot(sp)).catch(() => {}); }
  }
  // (less room on this screen, or longer words in this language: the rules go side by side, then the settings go,
  // then the rules, then the medal gets smaller, until the card fits)
  function fitSpot(c) {
    if (!c.isConnected) return;
    for (const k of ['s1', 's2', 's3', 's4']) { if (c.scrollHeight <= c.clientHeight + 1) return; c.classList.add(k); }
  }
  // the game mode, explained on the TV while the host picks it: a medal, its name and what it means, three short rules,
  // and the main settings. It plays a short reveal when the host picks another mode.
  async function spotCard(parent, sp) {
    const T = (t, v) => P.tr(t, v);
    const c = el('div', 'spot', parent);
    const key = game.id + '|' + sp.key;
    if (key !== lastSpot) c.classList.add('fresh');
    lastSpot = key;
    const hd = el('div', 'spot-top', c);
    el('div', 'spot-ic', hd, sp.icon).setAttribute('aria-hidden', 'true');
    const tx = el('div', 'spot-t', hd);
    el('span', 'caps', tx, await T(sp.label));
    el('b', '', tx, await T(sp.name));
    el('p', '', tx, await T(sp.desc));
    const facts = el('div', 'spot-f', c);
    for (const [ic, t2, v] of sp.facts) el('span', '', facts, ic + ' ' + await optLabel2(t2, v));
    const bl = el('div', 'spot-b', c);
    for (const [ic, t2] of sp.bullets) { const d = el('div', '', bl); el('i', '', d, ic).setAttribute('aria-hidden', 'true'); el('span', '', d, await T(t2, sp.vars)); }
  }
  const optLabel2 = (t, v) => (v ? P.tr(t, v) : optLabel(t));
  function credit(g) { const c = g && (typeof g.credit === 'function' ? g.credit(lang) : g.credit); if (c) el('div', 'credit', stage, P.f(c)); }
  // a setting's choice in the game's language ("15 s", "2.5 min" and "75 balls" keep their number)
  function optLabel(t) {
    const x = String(t);
    let m = /^(\d+(?:\.\d+)?) s$/.exec(x); if (m) return P.tr('{n} s', { n: m[1] });
    m = /^(\d+(?:\.\d+)?) min$/.exec(x); if (m) return P.tr('{n} min', { n: m[1] });
    m = /^(\d+) balls$/.exec(x); if (m) return P.tr('{n} balls', { n: m[1] });
    return P.tr(x);
  }
  // the scoreboard: score bars slide, out players fade (sorted, the leader on top)
  function board(parent, o = {}) {
    const b = el('div', 'board', parent);
    el('h2', '', b, o.title || P.f('Scoreboard'));
    const rows = new Map();
    const draw = (answered) => {
      const ps = list().slice().sort((a, b2) => (b2.score - a.score) || (a.out - b2.out));
      const max = Math.max(1, ...ps.map(p => p.score));
      ps.forEach((p, i) => {
        let r = rows.get(p.id);
        if (!r) { r = el('div', 'row', b); const bar = el('i', 'bar', r); const im = el('img', '', r); im.src = avatarUrl(p); im.alt = ''; el('b', '', r, p.name); const h = el('span', 'hearts', r); const pts = el('span', 'pts', r); r._bar = bar; r._pts = pts; r._h = h; rows.set(p.id, r); }
        r.style.order = String(i);
        r._bar.style.width = (100 * p.score / max) + '%';
        r._pts.textContent = String(p.score);
        r._h.textContent = o.lives ? '❤️'.repeat(Math.max(0, p.lives)) : '';
        r.classList.toggle('out', !!p.out);
        r.classList.toggle('answered', !!(answered && answered.has(p.id)));
      });
      b.style.display = 'flex';
    };
    draw();
    return { node: b, draw };
  }
  // the clock (idle: it shows the full time and waits for go(), like Trivia's while the answers appear)
  function ring(parent, sec, idle) {
    const r = el('div', 'ring', parent);
    r.innerHTML = '<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><span></span>';
    const fg = r.querySelector('.fg'), n = r.querySelector('span');
    let left = sec, t = 0, stopped = false;
    const tick = () => { if (left < sec && !r.isConnected) { clearInterval(t); return; } n.textContent = String(Math.max(0, left)); fg.style.strokeDashoffset = String(276.5 * (1 - Math.max(0, left) / sec)); if (left <= 3 && left > 0) P.sfx('tick'); left--; if (left < -1) clearInterval(t); };
    const go = () => { if (t || stopped || !(sec > 0)) return; tick(); t = setInterval(tick, 1000); };
    if (!(sec > 0)) r.hidden = true;
    else if (idle) n.textContent = String(sec);
    else go();
    return { node: r, go, stop: () => { stopped = true; clearInterval(t); r.classList.add('done'); } };
  }
  let booEl = null;
  function boo(mood) {
    if (!booEl || !booEl.isConnected) { booEl = el('div', 'boo', document.body); el('img', '', booEl).alt = ''; }
    // (a screen can keep a spot for Boo, like the clock on a Trivia question; otherwise the corner)
    const slot = stage.querySelector('.boo-slot');
    if (slot) {
      const r = slot.getBoundingClientRect(), z = Math.round(r.width * 0.92);
      booEl.style.cssText = 'left:' + Math.round(r.left + (r.width - z) / 2) + 'px;top:' + Math.round(r.top + (r.height - z) / 2) + 'px;width:' + z + 'px;height:' + z + 'px;right:auto;bottom:auto';
      booEl.dataset.slot = '1';
    } else if (booEl.dataset.slot) { booEl.style.cssText = ''; delete booEl.dataset.slot; }
    booEl.hidden = false;
    const id = { happy: 'boo:party', sad: 'boo:sad', wow: 'boo:wow', laugh: 'boo:laugh', scary: 'boo:scary', cool: 'boo:cool', hi: 'boo:hi', love: 'boo:love', mind: 'boo:mind' }[mood] || 'boo:hi';
    booEl.firstChild.src = P.booUri(id);
    booEl.animate([{ transform: 'scale(.6) translateY(18%)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'cubic-bezier(.2,1.4,.4,1)' });
  }

  // ---------- asking every phone at once ----------
  // o: { kind ('choice', 'text', 'pin', 'players', 'number', 'tap', 'bar', 'move', 'wait'...), prompt, opts, sec, who (ids, default: everyone in), extra,
  //      onAns(id, a) } -> Map(id -> { v, ms })   (ms is measured on each phone, from when the question showed there)
  const cur = { q: null };
  function ask(o) {
    const n = ++round;
    const who = new Set((o.who || alive().map(p => p.id)).filter(id => players.has(id)));
    const q = { k: 'q', n, kind: o.kind || 'choice', prompt: o.prompt || '', opts: o.opts || [], sec: o.sec || 0, extra: o.extra || null, who: [...who] };
    if (o.extra && o.extra.helpOnly) { for (const id of who) sayTo(id, q); }
    else { cur.q = q; say(q); }
    return new Promise(res => {
      const w = { who, got: new Map(), done: false, onAns: o.onAns };
      let t = 0;
      w.finish = () => { if (w.done) return; w.done = true; clearTimeout(t); pending.delete(n); res(w.got); };
      pending.set(n, w);
      // (a little more time than the phones show: the last tap is still on its way; no clock at all still ends in 2 minutes,
      // unless the question is open: then it waits for everyone, or for the host to show the answer)
      t = o.sec ? setTimeout(w.finish, o.sec * 1000 + 1500) : o.open ? 0 : setTimeout(w.finish, 120000);
      if (!who.size) w.finish();
    });
  }
  function wait(text, extra) { const m = { k: 'q', n: ++round, kind: 'wait', prompt: text || strings.look, extra: extra || null, who: [] }; cur.q = m; say(m); }
  function result(id, r) { sayTo(id, Object.assign({ k: 'res' }, r)); }
  const on = (k, fn) => { handlers.set(k, fn); return () => handlers.delete(k); };

  // ---------- a game, from start to the winner ----------
  let run = 0;
  async function start() {
    const my = ++run;
    P.mute(false);
    phase = 'play';
    for (const p of players.values()) { p.score = 0; p.right = 0; p.lives = +settings.lives || 3; p.out = false; p.streak = 0; p.helpers = {}; }
    balanceTeams();
    sayLobby();
    // 3, 2, 1 (the lobby tune fades out; a game with its own sounds keeps it going until its first sound)
    if (!game.sounds) SND.music(null, { fadeOut: 2 });
    stage.textContent = '';
    const cv = el('div', 'cover', stage);
    const n = el('div', 'big', cv, '3');
    for (const x of ['3', '2', '1']) { n.textContent = x; P.sfx('tick'); await sleep(800); if (my !== run) return; }
    handlers.clear();
    let ranking = null;
    try { ranking = await game.tv(kit(my)); }
    catch (e) { console.warn('Blokvane play', e); }
    // (the host ended this game early: the end screen is already up)
    if (my !== run) return;
    handlers.clear();
    finish(ranking);
  }
  // the host ends the game early: the scores so far win, and the rest of that game just stops
  function stopGame() {
    if (phase !== 'play') return;
    run++;
    handlers.clear();
    for (const w of [...pending.values()]) w.finish();
    finish(null);
    P.mute(true);
  }
  async function finish(ranking) {
    phase = 'end';
    cur.q = null;
    let ps = (ranking || list().slice().sort((a, b) => b.score - a.score)).filter(Boolean);
    const teamMode = !!(game.teamsWin && settings.teams);
    let teamPlace = null;
    if (teamMode) {
      // (the team's points are everyone's on it added up; each player's place is the team's)
      ps = P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).map(t => ({ id: 'team-' + t[0], team: t[0], name: P.f(t[1] + ' team'), av: 'boo:party', photo: '', score: list().filter(p => p.team === t[0]).reduce((n2, p) => n2 + p.score, 0) })).sort((a, b) => b.score - a.score);
      teamPlace = new Map(ps.map((t, i) => [t.team, i + 1]));
    }
    // the winner, like a game show's finale: spotlights, light rays turning behind the podium, confetti falling the
    // whole time, and the podium rising (third, second, then first, with a crown)
    const w = ps[0];
    const k = await P.tr(teamMode ? 'The winning team' : 'The winner'), foot = await P.tr('The host can play again, or pick another game.');
    // (Trivia without speed points: a point is a right answer, so it says how many were right)
    const byRight = game.id === 'trivia' && !settings.speed && settings.mode !== 'first' && !teamMode;
    const unit = byRight ? '{n} correct' : '{n} points';
    for (const p of ps.slice(0, 3)) await P.tr(unit, { n: p.score });
    stage.textContent = '';
    const cv = el('div', 'cover win', stage);
    el('div', 'rays', cv);
    el('div', 'beam l', cv); el('div', 'beam r', cv);
    confettiRain(cv);
    const box2 = el('div', 'win-box', cv);
    el('div', 'win-k caps', box2, k);
    el('h1', 'win-n', box2, w ? w.name : '...');
    const pod = el('div', 'podium2', box2);
    [[ps[1], 2, 'two'], [ps[0], 1, 'one'], [ps[2], 3, 'three']].forEach(([p, place, cls]) => {
      const col = el('div', 'pc ' + cls + (p ? '' : ' empty'), pod);
      const who = el('div', 'who', col);
      if (p) {
        if (place === 1) el('div', 'crown', who, '👑').setAttribute('aria-hidden', 'true');
        const av = el('div', 'av', who); const im = el('img', '', av); im.src = avatarUrl(p); im.alt = '';
        el('div', 'nm', who, p.name);
        el('div', 'sc', who, P.f(unit, { n: p.score }));
      }
      el('div', 'blk', col, String(place));
    });
    el('p', 'win-foot', cv, foot);
    boo('happy');
    // (the winner's fanfare, then the lobby tune again: the room never goes quiet)
    if (game.sounds) { SND.music('theme', { delay: 7, fadeIn: 2.5, fadeOut: 0.4 }); SND.sting('win'); } else { SND.music(null); P.sfx('win'); }
    const rk = ps.map((p, i) => ({ id: p.id, name: p.name, score: p.score, place: i + 1 }));
    for (const p of list()) result(p.id, { end: true, place: teamMode ? (teamPlace.get(p.team) || 0) : rk.findIndex(x => x.id === p.id) + 1, of: rk.length, score: p.score, team: teamMode ? p.team : undefined });
    say({ k: 'end', ranking: rk.slice(0, 10) });
    sayLobby();
  }
  // confetti falling gently over the winner's stage for as long as it shows: a big first wave, then a lighter rain
  function confettiRain(parent) {
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    const cv = el('canvas', 'rain', parent);
    const g = cv.getContext && cv.getContext('2d');
    if (!g) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let W = 0, H = 0, k = 1;
    const size = () => { W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight; k = Math.max(0.6, H / 720); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    const COLS = ['#ffd166', '#ff5f7e', '#4f8bff', '#2fd59a', '#b46bff', '#ffffff', '#ff9f43'];
    const bit = y => ({ x: Math.random() * W, y: y != null ? y : -20 - Math.random() * 60, w: (6 + Math.random() * 7) * k, h: (3 + Math.random() * 4) * k, vy: (0.7 + Math.random() * 1.3) * k,
      vx: (Math.random() - 0.5) * 0.6, a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.12, f: Math.random() * 6.28, vf: 0.05 + Math.random() * 0.1, c: COLS[(Math.random() * COLS.length) | 0] });
    const bits = Array.from({ length: 160 }, () => bit(-Math.random() * H * 1.1));
    const t0 = performance.now();
    let last = t0;
    (function frame(t) {
      if (!cv.isConnected) return;
      const dt = Math.min(3, (t - last) / 16.7);
      last = t;
      if (Math.abs(cv.clientWidth - W) > 1) size();
      g.clearRect(0, 0, W, H);
      const calm = t - t0 > 7000;
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.y += b.vy * dt * 1.5; b.x += (b.vx + Math.sin(b.f) * 0.5) * dt; b.a += b.va * dt; b.f += b.vf * dt;
        if (b.y > H + 20) { if (calm && bits.length > 70) { bits.splice(i, 1); continue; } Object.assign(b, bit()); }
        g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.scale(1, Math.cos(b.f)); g.fillStyle = b.c; g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); g.restore();
      }
      requestAnimationFrame(frame);
    })(t0);
  }
  // what a game gets to work with (once a game is over, nothing it does reaches the screen or the phones)
  function kit(my) {
    const live = () => my === run && phase === 'play';
    const nop = () => {};
    return {
      players: list, alive, get settings() { return settings; }, lang, tr: P.tr, f: P.f, P, el, strings, top, stage, avatarUrl,
      // the game's own questions, words and places, written for its language (null: English, the packs in packs.js)
      packs: lang === 'en' ? null : I18N.packs(lang),
      sleep: ms => (live() ? sleep(ms) : Promise.resolve()),
      say: m => (live() ? say(m) : nop()), sayTo: (id, m) => (live() ? sayTo(id, m) : nop()), box: (id, m) => (live() ? box(id, m) : Promise.resolve(false)),
      ask: o => (live() ? ask(o) : Promise.resolve(new Map())), wait: (t, x) => (live() ? wait(t, x) : nop()), result: (id, r) => (live() ? result(id, r) : nop()),
      on: (k, fn) => (live() ? on(k, fn) : nop), boo: mood => (live() ? boo(mood) : nop()),
      ring: (parent, sec, idle) => (live() ? ring(parent, sec, idle) : { node: el('div'), stop: nop, go: nop }), board: (parent, o) => board(live() ? parent : el('div'), o),
      // (no title: a screen that makes its own top, like Trivia's questions)
      view(title, sub, right) { if (!live()) return el('div'); stage.textContent = ''; if (booEl && booEl.dataset.slot) booEl.hidden = true; if (title != null) top(stage, title, sub, right); const b = el('div', 'body', stage); credit(game); return b; },
      player: id => players.get(id),
      qn: () => (cur.q ? cur.q.n : 0),
      // (closes a question now: everyone who answered counts)
      close: n => { const w = pending.get(n); if (w && live()) w.finish(); },
      isHost: id => id === host,
      // points with the game's mode: speed points (faster is more), first right gets a bonus
      award(p, base, ms, secs) { const speed = settings.speed ? Math.round(base * (0.5 + 0.5 * Math.max(0, 1 - (ms || 0) / ((secs || 20) * 1000)))) : base; p.score += speed; return speed; },
      speak: t => (live() ? P.speak(t, lang) : false),
      snd: { music: (n, o) => (live() ? SND.music(n, o) : null), sting: (n, o) => (live() ? SND.sting(n, o) : null), on: () => SND.state() === 'on' },
      num: n => { try { return Number(n).toLocaleString(lang + '-u-nu-latn'); } catch (e) { return String(n); } },
      over: () => !live()
    };
  }

  // ---------- off we go ----------
  function game0(def) { games.set(def.id, def); }
  async function boot() {
    stage.textContent = '';
    const c = el('div', 'cover', stage);
    // #trivia, #trivia.es or #trivia.es.ABCDEF (the code a phone picked to join with), or #.es: the game, its language
    // (no language in the link: this screen's own, when it's one of the seven) and its join code
    const h = location.hash.replace(/^#/, '').split('.');
    const want = I18N.ok(h[1]) ? h[1] : I18N.pick();
    await setLang(want).catch(() => {});
    const t1 = el('h1', '', c, P.f('Blokvane party games'));
    el('p', '', c, P.f('Getting the room ready...'));
    void t1;
    if (!(window.crypto && crypto.subtle) || typeof BigInt !== 'function' || !window.WebSocket) { c.lastChild.textContent = P.f('This browser is too old for party games. Try Chrome, Edge, Safari or a newer TV.'); return; }
    const given = h[2] && /^[A-Z]{6}$/.test(h[2]) ? L.normShort(h[2], 6) : '';
    await open(given || '');
    if (games.has(h[0])) choose(h[0]); else { lobby(); retranslate(); }
  }
  setTimeout(boot, 0);
  // (a TV keeps its screen on while a game is open)
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); }); } catch (e) {}
  return { game: game0, get games() { return games; } };
})();
