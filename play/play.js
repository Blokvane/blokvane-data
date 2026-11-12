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
  const players = new Map();      // id -> { id, name, av, photo, color, team, ready, score, right, lives, out, streak, away, gone, heard, at, helpers, lang, cap }
  let R = null, CR = null, code = '', host = '', game = null, settings = {}, phase = 'lobby', lang = 'en', strings = Object.assign({}, P.STR), round = 0, secret = '';
  const I18N = BVI18N;
  const handlers = new Map();     // message kind -> fn(m, player) (a game listens while it runs)
  const pending = new Map();      // round -> { who: Set, all: Set, got: Map, done, onAns, sec, at }
  const kicked = new Set();       // phones the host took out of this game (they can ask to join again)
  const waitNext = new Map();     // phones that came in during a game the host keeps closed: they join when it's over
  const playerSubs = new Set();   // a running game hears when someone leaves, comes back or joins
  let waitHost = false;           // the game is waiting for the host's phone (Next question)
  function el(tag, cls, parent, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  // ---------- pause: the host stops the game for a moment, and it goes on from the very same second ----------
  // The game's own clock stands still while it's paused, and everything that waits on it (a game's pauses, a question's
  // time) waits with it. pafter(fn, ms) runs fn after ms of the game's time, and gives back a function that cancels it.
  let paused = false, pausedAt = 0, pausedAll = 0, pauseEl = null;
  const gnow = () => Date.now() - pausedAll - (paused ? Date.now() - pausedAt : 0);
  const ptimers = new Set(), pauseSubs = new Set();
  function pafter(fn, ms) {
    const x = { due: gnow() + Math.max(0, +ms || 0), t: 0, fn };
    x.arm = () => { clearTimeout(x.t); x.t = setTimeout(() => { ptimers.delete(x); fn(); }, Math.max(0, x.due - gnow())); };
    ptimers.add(x);
    if (!paused) x.arm();
    return () => { clearTimeout(x.t); ptimers.delete(x); };
  }
  const psleep = ms => new Promise(r => pafter(r, ms));
  // each game's own icon (icons/: the same pictures as on the phones and in Blokvane)
  const ICONS = new Set(['trivia', 'boowho', 'world', 'emoji', 'imposter', 'gir']);
  const iconOf = id => 'icons/' + id + '.webp';
  const list = () => [...players.values()].filter(p => !p.away);
  const alive = () => list().filter(p => !p.out);
  const avatarUrl = p => p.photo || P.booUri(p.av) || P.booUri('boo:hi');
  // (the host is ready by starting the game)
  const pub = p => ({ id: p.id, name: p.name, av: p.av, ph: !!p.photo, color: p.color, team: p.team, ready: !!p.ready || p.id === host, score: p.score, lives: p.lives, out: !!p.out, lg: p.lang || '' });

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
    nearOn();
  }
  // Phones on the same Wi-Fi find this TV in their list, with its game and its code (BVLIVE.nearby), and join with one
  // tap. The host can turn it off (Screen and players).
  let near = null, nearBusy = false, nearSig = '';
  // (h: it has a host, so a phone that starts a game looks for another TV)
  const nearInfo = () => ({ c: code, g: game ? game.id : '', p: list().length, ph: phase === 'lobby' ? 0 : 1, h: players.get(host) ? 1 : 0 });
  // the name phones see in their list of TVs nearby: what kind of screen this is
  const screenName = (() => {
    const ua = navigator.userAgent || '';
    if (/Tizen|SMART-TV.*Samsung/i.test(ua)) return 'Samsung TV';
    if (/Web0S|webOS|NetCast/i.test(ua)) return 'LG TV';
    if (/AFT[A-Z]|\bSilk\//.test(ua)) return 'Fire TV';
    if (/CrKey/.test(ua)) return 'Chromecast';
    if (/Android TV|AndroidTV|GoogleTV|BRAVIA/i.test(ua)) return 'Android TV';
    if (/VIDAA|Hisense/i.test(ua)) return 'Hisense TV';
    if (/Roku/i.test(ua)) return 'Roku TV';
    if (/PlayStation/i.test(ua)) return 'PlayStation';
    if (/Xbox/i.test(ua)) return 'Xbox';
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'iPad';
    if (/Android/.test(ua)) return 'Android tablet';
    if (/CrOS/.test(ua)) return 'Chromebook';
    if (/Macintosh/.test(ua)) return 'Mac';
    if (/Windows/.test(ua)) return 'Windows computer';
    return 'TV';
  })();
  async function nearOn() {
    const want = settings.k_near !== false && phase !== 'closed' && !!code && !!L.nearby;
    if (!want) { if (near) { near.close(); near = null; nearSig = ''; } return; }
    if (near) { const i = nearInfo(), sg = JSON.stringify(i); if (sg !== nearSig) { nearSig = sg; near.setInfo(i); } return; }
    if (nearBusy) return;
    nearBusy = true;
    try { const i = nearInfo(); near = await L.nearby({ role: 'tv', name: screenName, info: i }); nearSig = JSON.stringify(i); } catch (e) { near = null; }
    nearBusy = false;
    if (near && (settings.k_near === false || phase === 'closed')) { near.close(); near = null; }
    // (the game was picked meanwhile, say: the phones hear the news at once)
    else if (near) { const i2 = nearInfo(), sg2 = JSON.stringify(i2); if (sg2 !== nearSig) { nearSig = sg2; near.setInfo(i2); } }
  }
  // what the phones scan: the game's room, and the language the game is in (so a phone shows it from the first screen)
  // (the QR code opens Blokvane Games: the party games' own page, that a phone can keep as an app)
  const linkNow = () => GO + 'games.html#game.' + secret + '.' + R.id + (lang !== 'en' ? '.' + lang : '');
  // the game's language, everywhere on this screen
  async function setLang(v) {
    lang = v;
    // (a player who picked this language for their phone now simply follows the game)
    for (const p of players.values()) if (p.lang === lang) p.lang = '';
    await P.useLang(lang);
    strings = await P.trAll(P.STR);
    document.documentElement.lang = lang;
    document.documentElement.dir = P.RTL.has(lang) ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', P.RTL.has(lang));
    document.title = P.f('Blokvane party games');
    // (the address keeps the game and its language, so the screen opens the same way after a reload)
    if (game) { const h = '#' + game.id + (lang !== 'en' ? '.' + lang : ''); if (location.hash !== h) { try { history.replaceState(history.state, '', h); } catch (e) {} } }
    // (a setting that the new language doesn't have, like a Trivia category with no questions in it, goes back)
    if (game && game.langOptions) for (const [key, fn] of Object.entries(game.langOptions)) { const f = game.settings.find(x => x.key === key); if (f && !fn(lang, f.options).some(o => String(o[0]) === String(settings[key]))) settings[key] = f.default; }
  }
  // Who is still here. A phone is away when the relays stop hearing it (a minute or so), when it says goodbye (the page
  // was closed), or when it doesn't answer the TV's "still there?" while a question with no clock (or the next
  // question) is waiting for it: then the game goes on without it. It comes back as itself, with its score, as soon as
  // it's heard again, and can still answer the question that's on if that one is still open.
  function sweep() {
    let changed = false;
    for (const p of players.values()) { const away = !!p.gone || !R.here(p.id); if (!!p.away !== away) { p.away = away; if (away) p.awayAt = Date.now(); changed = true; } }
    if (changed) peopleChanged();
  }
  function peopleChanged() {
    for (const w of pending.values()) fixWho(w);
    pickHost();
    if (phase === 'lobby') lobby();
    sayLobby();
    for (const f of playerSubs) { try { f(); } catch (e) {} }
  }
  // (an open question waits only for the phones that are here: one that left doesn't hold it up, one that came back
  // can still answer it)
  function fixWho(w) {
    if (w.done) return;
    for (const id of w.all) {
      const p = players.get(id);
      const here = !!p && !p.away;
      if (here && !w.who.has(id)) w.who.add(id);
      else if (!here && w.who.has(id) && !w.got.has(id)) w.who.delete(id);
    }
    if (w.got.size >= w.who.size) w.finish();
  }
  // The host keeps the game while their phone is away for a short while (another app, the screen locked, a page that
  // closed): only after a minute and a half (15 seconds when the game waits for their Next) does the next player take
  // over, and the host gets it back as soon as their phone is here again. Leaving the game, or handing it over from
  // the host's phone, passes it at once.
  // Only a Blokvane member can host (signed in on their phone: pass.js); everyone else joins once one is here.
  let trueHost = '', hostT = 0;
  const hostHere = () => [...players.values()].some(x => x.paid && !x.away && !x.left);
  const passed = new WeakSet();   // "join" messages whose host pass was checked here
  function pickHost() {
    const was = host;
    const th = players.get(trueHost);
    if (th && th.paid && !th.away && host !== trueHost) host = trueHost;
    const h = players.get(host);
    const grace = waitHost ? 15000 : 90000;
    clearTimeout(hostT);
    if (!h || !h.paid || (h.away && (h.left || !(Date.now() - (h.awayAt || 0) < grace)))) {
      const next = list().find(x => x.paid);
      host = next ? next.id : '';
      if (!th || th.left) trueHost = host;
    } else if (h.away) hostT = setTimeout(() => { pickHost(); if (phase === 'lobby') lobby(); sayLobby(); }, grace + 500 - (Date.now() - (h.awayAt || 0)));
    if (!trueHost || !players.has(trueHost)) trueHost = host;
    // (both phones hear it straight away: the one that has the host's tools now, and the one that just lost them)
    if (was !== host) for (const id of [was, host]) { const x = players.get(id); if (x && !x.away) sayTo(id, { k: 'you', id, host: host === id, color: x.color }); }
  }
  // the host takes someone out of the game: their phone hears it, and they can ask to join again
  function removePlayer(id) {
    if (!players.has(id)) return;
    players.delete(id);
    kicked.add(id);
    sayTo(id, { k: 'kicked' });
    for (const w of pending.values()) { if (w.done) continue; w.all.delete(id); if (!w.got.has(id)) w.who.delete(id); if (w.got.size >= w.who.size) w.finish(); }
    peopleChanged();
  }
  // "still there?" to the phones a question with no clock (or the next question) is waiting for; one that doesn't answer
  // in 7 seconds has left
  setInterval(() => {
    if (phase !== 'play' || !R || paused) return;
    const t = Date.now(), want = new Set();
    for (const w of pending.values()) if (!w.done && !w.sec && t - w.at > 8000) for (const id of w.who) if (!w.got.has(id)) want.add(id);
    if (waitHost && host) want.add(host);
    let gone = false;
    for (const id of want) {
      const p = players.get(id);
      if (!p || p.away || !p.cap) continue;
      if (p.pingAt && p.heard < p.pingAt && t - p.pingAt > 7000) { p.gone = true; p.pingAt = 0; gone = true; continue; }
      if (!p.pingAt || (p.heard >= p.pingAt && t - p.pingAt > 6000)) { p.pingAt = t; sayTo(id, { k: 'ping' }); }
    }
    if (gone) sweep();
  }, 2000);
  // An open question goes out again every 3 seconds while some phones haven't answered it: a relay can drop a message
  // now and then, and that phone would stay on "Look at the TV" while everyone else answers. A phone that already shows
  // it just keeps it (it goes by the question's number).
  setInterval(() => {
    if (phase !== 'play' || !R || paused) return;
    const t = Date.now();
    for (const w of pending.values()) {
      if (w.done || !w.q || t - (w.sent || w.at) < 3000) continue;
      const left = [...w.all].filter(id => !w.got.has(id) && players.has(id) && !players.get(id).away);
      if (!left.length) continue;
      w.sent = t;
      if (w.q.extra && w.q.extra.helpOnly || left.length <= 2) { for (const id of left) sayTo(id, w.q); } else if (cur.q === w.q) say(w.q);
    }
  }, 1000);
  // the join code again, on top of the game, for people who come later (the host shows and hides it from their phone)
  let joinEl = null, joinT = 0;
  async function showJoin(on, keep) {
    clearTimeout(joinT);
    if (!on) { if (joinEl) { joinEl.remove(); joinEl = null; } sayLobby(); return; }
    if (!joinEl) {
      const box = el('div', 'join-ov');
      const q = el('div', 'qr', box);
      try { q.appendChild(BVQR.svgOf(linkNow(), { border: 1 })); } catch (e) {}
      el('b', '', box, await P.tr('Join the game'));
      el('div', 'muted', box, await P.tr('Scan with your camera') + ' · ' + await P.tr('or open Blokvane and type'));
      const ct = el('div', 'codetiles', box);
      ct.setAttribute('aria-label', code);
      for (const ch of code) el('span', '', ct, ch);
      if (joinEl) return;
      joinEl = box;
      document.body.appendChild(box);
    }
    // (it hides by itself after two minutes, unless the host keeps it on for the whole game)
    if (keep || settings.k_code) joinEl.dataset.keep = '1'; else { delete joinEl.dataset.keep; joinT = setTimeout(() => showJoin(false), 120000); }
    sayLobby();
  }
  // a player's own language (their phone shows the questions in it): only one of the seven full languages, and only
  // when it isn't the game's
  const okLang = v => (typeof v === 'string' && I18N.FULL.has(v) && v !== lang && (!game || !game.langs || game.langs.includes(v)) ? v : '');
  function setPlayerLang(p, v) {
    const lg = okLang(v);
    if ((p.lang || '') === lg) return false;
    p.lang = lg;
    if (lg) { I18N.load(lg, false); if (game && game.langPrep) { try { game.langPrep(lg); } catch (e) {} } }
    return true;
  }
  function take(m, peer) {
    if (!m || typeof m.k !== 'string' || !L.okId(m.f)) return;
    // (the game was closed here: a phone that comes back hears so)
    if (phase === 'closed') { if (m.k === 'join' || m.k === 'sync') sayTo(m.f, { k: 'closed' }); return; }
    const p = players.get(m.f);
    // (anything from a phone says it's here; one that had left is back)
    if (p) { p.heard = Date.now(); if (p.gone) { p.gone = false; setTimeout(sweep, 0); } }
    switch (m.k) {
      case 'join': {
        // (a phone with a host pass: the pass is checked first. A "paid" that comes in a message counts for nothing:
        // only a pass checked here does)
        const paid = passed.has(m);
        if (m.pass && !paid && !(p && p.paid) && typeof BVPASS !== 'undefined') { const ps = m.pass; delete m.pass; BVPASS.ok(ps).then(ok => { if (ok) passed.add(m); take(m, peer); }, () => take(m, peer)); return; }
        if (kicked.has(m.f)) { if (!m.again) { sayTo(m.f, { k: 'kicked' }); return; } kicked.delete(m.f); }
        // nobody comes in before the host: a Blokvane member, signed in on their phone (their phone asks them)
        if (!p && !paid && !hostHere()) { sayTo(m.f, { k: 'needhost' }); return; }
        if (!p && players.size >= 40) { R.send({ k: 'full' }, m.f).catch(() => {}); return; }
        // (someone new in the middle of a game the host keeps closed: they're in from the next game, and their phone says so)
        if (!p && phase === 'play' && settings.k_late === false) { if (waitNext.size < 40) waitNext.set(m.f, m); sayTo(m.f, { k: 'waitnext' }); return; }
        const pl = p || { id: m.f, score: 0, right: 0, lives: +settings.lives || 3, out: false, streak: 0, helpers: {}, color: P.COLORS[players.size % P.COLORS.length], team: '' };
        if (paid) pl.paid = true;
        pl.name = P.name(m.name); pl.av = P.AVATARS.includes(m.av) ? m.av : 'boo:hi'; pl.gone = false; pl.left = false; pl.at = Date.now(); pl.heard = Date.now();
        // (a new Boo picked in the middle of a game, instead of a selfie: the selfie goes)
        if (m.nophoto) pl.photo = '';
        if (!p) pl.away = false;
        // (a phone that answers "still there?" says so when it joins)
        pl.cap = +m.cap || 0;
        if ('lg' in m) setPlayerLang(pl, m.lg);
        if (teamsOn() && !pl.team) pl.team = P.TEAMS[players.size % Math.min(4, +settings.teamN || 2)][0];
        const isNew = !p;
        players.set(m.f, pl);
        pickHost();
        if (isNew) P.sfx('join');
        R.send({ k: 'you', id: m.f, host: host === m.f, color: pl.color }, m.f).catch(() => {});
        // (someone new, or back: the game that's on hears it, and a question that's still open can wait for them)
        if (isNew) { for (const w of pending.values()) fixWho(w); for (const f of playerSubs) { try { f(); } catch (e) {} } }
        else sweep();
        if (phase === 'lobby') lobby();
        sayLobby();
        // (someone back in the middle of a game: what's on now)
        if (phase === 'play' && cur.q) R.send(cur.q, m.f).catch(() => {});
        return;
      }
      case 'photo': if (p && m.boxed && L.okPicture(m.d) && m.d.length < 60000) { p.photo = m.d; if (phase === 'lobby') lobby(); } return;
      case 'ready': if (p) { p.ready = !!m.on; if (phase === 'lobby') lobby(); sayLobby(); } return;
      case 'team': if (p && P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).some(t => t[0] === m.team)) { p.team = m.team; if (phase === 'lobby') lobby(); sayLobby(); } return;
      case 'plang': if (p && setPlayerLang(p, m.v)) { if (phase === 'lobby') lobby(); sayLobby(); } return;
      case 'set': if (p && m.f === host && (phase === 'lobby' || /^(snd_[a-z0-9]+|vol_(music|fx)|k_(code|calm|late))$/.test(String(m.key)))) setOne(m.key, m.v); return;
      case 'game': if (p && m.f === host && (phase === 'lobby' || phase === 'end' || phase === 'play') && games.has(m.id)) { abortGame(); choose(m.id); } return;
      case 'start': if (p && m.f === host && phase === 'lobby' && game) start(); return;
      case 'stop': if (p && m.f === host && phase === 'play') stopGame(); return;
      // the host, from any screen of a game: pause it and go on, start the same game over, go back to its setup (another
      // mode, other settings), or pick another game (above: 'game'). Everyone stays in, with nothing to do.
      case 'pause': if (p && m.f === host && phase === 'play') setPause(!!m.on); return;
      case 'restart': if (p && m.f === host && game && (phase === 'play' || phase === 'end')) { abortGame(); for (const x of players.values()) x.ready = true; phase = 'lobby'; start(); } return;
      case 'tolobby': if (p && m.f === host && game && (phase === 'play' || phase === 'end')) { abortGame(); phase = 'lobby'; for (const x of players.values()) x.ready = true; letWaitersIn(); lobby(); sayLobby(); } return;
      case 'again': if (p && m.f === host && phase === 'end') { phase = 'lobby'; for (const x of players.values()) { x.ready = true; } if (joinEl) showJoin(false); lobby(); sayLobby(); } return;
      // the host's phone: take someone out, hand the host to someone else, show the join code on the TV again
      case 'kick': if (p && m.f === host && typeof m.id === 'string' && m.id !== host) removePlayer(m.id); return;
      case 'makehost': {
        const to = players.get(m.id);
        if (!p || m.f !== host || !to || to.away || to.id === host) return;
        if (!to.paid) { sayTo(m.f, { k: 'needpass', name: to.name }); return; }
        host = to.id; trueHost = to.id;
        for (const x of [p, to]) sayTo(x.id, { k: 'you', id: x.id, host: host === x.id, color: x.color });
        if (phase === 'lobby') lobby();
        sayLobby();
        return;
      }
      case 'showjoin': if (p && m.f === host) showJoin(!!m.on); return;
      // (the TV's size from the host's phone, for a TV nobody can click on: bigger, smaller, or back to fitting by itself)
      case 'zoom': if (p && m.f === host) { const d = +m.d; zoomBy(d > 0 ? 1 : d < 0 ? -1 : 0); sayLobby(); } return;
      case 'ping': return;
      case 'pong': return;
      case 'bye': if (p) { p.gone = true; if (m.left) p.left = true; sweep(); } return;
      case 'sync': if (p) { R.send({ k: 'you', id: m.f, host: host === m.f, color: p.color }, m.f).catch(() => {}); sayLobby(m.f); if (phase === 'play' && cur.q) R.send(cur.q, m.f).catch(() => {}); }
        else if (kicked.has(m.f)) sayTo(m.f, { k: 'kicked' });
        return;
      case 'ans': {
        const w = pending.get(+m.n);
        if (!w || !p || w.done || w.got.has(m.f)) return;
        // (a phone that was taken off this question for going quiet, but answered in time after all)
        if (!w.who.has(m.f)) { if (!w.all.has(m.f)) return; w.who.add(m.f); }
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
  // teams: on when the game has them and the host turned them on (and the game mode allows them: a Trivia race is
  // everyone for themselves)
  const teamsOn = () => !!(game && game.teams && (settings.teams || (game.teamsForce && game.teamsForce(settings))) && (!game.teamsOn || game.teamsOn(settings)));
  // teams: everyone without one (or on a team that's not in the game) joins the smallest team
  function balanceTeams() {
    if (!teamsOn()) return;
    const ids = P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).map(t => t[0]);
    const size = t => list().filter(p => p.team === t).length;
    for (const p of list()) if (!ids.includes(p.team)) { p.team = ''; }
    for (const p of list()) if (!p.team) p.team = ids.slice().sort((a, b) => size(a) - size(b))[0];
  }
  // (the games in the order the phones list them: Guess It Right! right after Trivia, the others as they were added)
  const ORDER = ['trivia', 'gir'];
  const gameList = () => [...games.values()].map((g, i) => [g, ORDER.includes(g.id) ? ORDER.indexOf(g.id) - 99 : i]).sort((a, b) => a[1] - b[1]).map(x => x[0]);
  // what the phones show in the lobby (the game, its settings, the players, the host)
  function sayLobby(to) {
    if (phase === 'closed') { nearOn(); return; }
    if (!to) nearOn();
    const tt =tx.key === (game ? game.id : '') + '|' + lang ? tx : null;
    const m = { k: 'lobby', phase, game: game ? game.id : '', gname: game ? (tt ? tt.name : P.f(game.name)) : '', gen: game ? game.name : '', games: (tx.lang === lang && tx.games && tx.games.length && tx.games) || gameList().map(g => ({ id: g.id, name: P.f(g.name), e: g.emoji, sub: P.f(g.sub) })),
      players: list().map(pub), host, settings, schema: game ? (tt ? tt.schema : fieldsOf(game)) : [], lang, rtl: P.RTL.has(lang), strings,
      // (the host's phone sets the game up in steps; players can pick their own language when the game has it)
      steps: game ? (tt && tt.steps) || stepsOf(game) : null, mlang: !!(game && game.mlang), joinOn: !!joinEl, zoom: Math.round(zoom * 100), teams: teamsOn(),
      // (a game written in only some languages, like Guess It Right! in English and Arabic: the phones offer only those)
      langs: game && game.langs ? game.langs : null,
      // (a game's own rules for the settings picked, like Guess It Right!'s: each phone shows them in its language)
      howto: game && game.howto ? game.howto(settings) : null,
      // (the question that's on: a phone that doesn't have it asks for it again)
      qn: phase === 'play' && cur.q ? cur.q.n : 0, paused: phase === 'play' && paused, gr: run,
      // (the join code: the host's phone sends it with "Invite players")
      code };
    if (to) sayTo(to, m); else say(m);
  }
  // ---------- the sounds, in every game: the host can turn the music or any one kind of moment off (like "next
  // question"), on the last step of the setup or from the ⋯ in the middle of a game. This screen keeps them for the
  // next game. ----------
  const SND_KINDS = [['music', 'Music', 'The tunes in the lobby and during the game.'], ['next', 'Next question sound'], ['every5', 'Every 5 questions sound'],
    ['correct', 'Right answer sound'], ['wrong', 'Wrong answer sound'], ['timesup', 'Time\'s up sound'], ['tick', 'Clock ticks'], ['win', 'Winner sound'], ['fx', 'Other sounds']];
  function sndFields(g) {
    if (!g || !SND.kindOf) return [];
    const have = new Set(['tick', 'win', 'fx']);
    if (g.sounds) { have.add('music'); for (const n of g.sounds) have.add(SND.kindOf(n)); }
    if (g.music) for (const v of Object.values(g.music)) if (typeof v === 'string') have.add(SND.kindOf(v));
    // (how loud the music is, and the other sounds, each on its own)
    const VOL = [[1, 'Loud'], [0.6, 'Medium'], [0.3, 'Soft']];
    const vols = (have.has('music') ? [{ key: 'vol_music', label: 'Music volume', type: 'seg', options: VOL, default: 1, vol: 'music' }] : []).concat([{ key: 'vol_fx', label: 'Sounds volume', type: 'seg', options: VOL, default: 1, vol: 'fx', desc: 'Everything that isn\'t music: right, wrong, the clock and the rest.' }]);
    return vols.concat(SND_KINDS.filter(k => have.has(k[0])).map(([k, label, desc]) => ({ key: 'snd_' + k, label, type: 'toggle', default: true, desc, snd: k })));
  }
  // ---------- settings every game has: how to play first (for a game that has no rules screen of its own), people who
  // come in late, the join code on the TV during the game, and a calm screen. This screen keeps them for next time. ----------
  const KIT0 = { k_rules: true, k_rulesSec: 12, k_late: true, k_code: false, k_near: true, k_calm: false };
  const kitSaved = () => { try { const v = JSON.parse(localStorage.getItem('bvplay:kit') || 'null'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  function kitFields(g) {
    if (!g) return [];
    const rl0 = typeof g.rules === 'function' ? g.rules(settings || {}) : g.rules;
    const own = (g.settings || []).some(f => f.key === 'rules') || !Array.isArray(rl0) || !rl0.length;
    const out = own ? [] : [{ key: 'k_rules', label: 'How to play, first', type: 'toggle', default: true, kit: 1, desc: 'Before the first question the TV shows how to play, and so does every phone.' },
      { key: 'k_rulesSec', label: 'How long it shows', type: 'number', min: 5, max: 120, quick: [8, 12, 20, 30], unit: 'seconds', default: 12, kit: 1, when: ['k_rules', true] }];
    return out.concat([
      { key: 'k_late', label: 'Late players can join', type: 'toggle', default: true, kit: 1, desc: 'Someone who comes in after the start plays from the next question. Off: they play the next game.' },
      { key: 'k_code', label: 'Show the join code during the game', type: 'toggle', default: false, kit: 1, desc: 'The QR code and the code stay in a corner of the TV the whole game.' },
      { key: 'k_near', label: 'Phones nearby can find this TV', type: 'toggle', default: true, kit: 1, desc: 'Phones on the same Wi-Fi see this TV in their list and join with one tap, without typing the code.' },
      { key: 'k_calm', label: 'Calm screen', type: 'toggle', default: false, kit: 1, desc: 'Fewer flashing and moving lights on the TV. Easier on the eyes.' }]);
  }
  function applyKit() {
    document.body.classList.toggle('calm', !!settings.k_calm);
    nearOn();
    try { const o = {}; for (const k of Object.keys(KIT0)) if (k in settings) o[k] = settings[k]; localStorage.setItem('bvplay:kit', JSON.stringify(Object.assign(kitSaved(), o))); } catch (e) {}
    if (phase === 'play') { if (settings.k_code) showJoin(true, true); else if (joinEl && joinEl.dataset.keep) showJoin(false); }
  }
  const fieldsOf = g => (g ? g.settings.concat(kitFields(g), sndFields(g)) : []);
  // (the steps the host's phone goes through, with the sounds as the last one; a game without steps of its own gets its
  // settings about three to a page, the way the phone would make them)
  function stepsOf(g) {
    if (!g) return null;
    let st = g.steps;
    if (!st) {
      const pages = [];
      let cur = ['lang'], w = 1;
      for (const f of g.settings) {
        const cost = f.type === 'toggle' ? 0.5 : f.type === 'text' ? 1.5 : Array.isArray(f.options) && f.options.length > 6 ? 2 : 1;
        if (w + cost > 3.01 && cur.length) { pages.push(cur); cur = []; w = 0; }
        cur.push(f.key); w += cost;
      }
      if (cur.length) pages.push(cur);
      st = pages.map(ks => { const f = g.settings.find(x => x.key === ks.find(k => k !== 'lang')); return { t: 'Settings', s: f ? f.label : 'Language', keys: ks }; });
    }
    const kit = kitFields(g).map(f => f.key), snd = sndFields(g).map(f => f.key);
    return st.concat(kit.length ? [{ t: 'Screen and players', s: 'More', keys: kit }] : [], snd.length ? [{ t: 'Sounds', keys: snd }] : []);
  }
  function applySounds() {
    if (!game || !SND.setOff) return;
    const off = new Set(SND.offKinds());
    for (const f of sndFields(game)) { if (settings[f.key] === false) off.add(f.snd); else off.delete(f.snd); }
    SND.setOff([...off]);
  }
  // the game list and the settings in the game's language (the host's phone shows them)
  const tx = { key: '', lang: '', games: null, name: '', schema: null, steps: null };
  async function retranslate() {
    const want = (game ? game.id : '') + '|' + lang;
    const gl = await Promise.all(gameList().map(async g => ({ id: g.id, name: await P.tr(g.name), e: g.emoji, sub: await P.tr(g.sub) })));
    const optsOf = f => (game.langOptions && game.langOptions[f.key] ? game.langOptions[f.key](lang, f.options) : f.options);
    // (each choice keeps its short explanation, and a setting its own, in the game's language)
    const schema = game ? await Promise.all(fieldsOf(game).map(async f => Object.assign({}, f, { label: await P.tr(f.label), desc: f.desc ? await P.tr(f.desc) : undefined, unit: f.unit ? await P.tr(f.unit) : undefined,
      options: f.options ? await Promise.all(optsOf(f).map(async o => (o[2] ? [o[0], await optLabel(o[1]), await P.tr(o[2])] : [o[0], await optLabel(o[1])]))) : undefined }))) : null;
    const name = game ? await P.tr(game.name) : '';
    const steps = game ? await Promise.all(stepsOf(game).map(async s => ({ t: await P.tr(s.t), s: await P.tr(s.s || s.t), keys: s.keys }))) : null;
    if (want !== (game ? game.id : '') + '|' + lang) return;
    Object.assign(tx, { key: want, lang, games: gl, name, schema, steps });
    sayLobby();
  }
  async function setOne(key, v) {
    if (key === 'lang') { if (I18N.ok(v) && (!game || !game.langs || game.langs.includes(v))) await setLang(v); lobby(); sayLobby(); retranslate(); return; }
    const f = game && fieldsOf(game).find(x => x.key === key);
    if (!f) return;
    // (a sound: on or off right away, in the lobby or in the middle of the game)
    if (f.snd) { settings[key] = !!v; applySounds(); sayLobby(); return; }
    // (how loud: right away too; and the settings every game has, kept on this screen)
    if (f.vol) { const o = f.options.find(x => String(x[0]) === String(v)); if (!o) return; settings[key] = o[0]; if (SND.setVol) SND.setVol(f.vol, o[0]); sayLobby(); return; }
    if (f.kit) { settings[key] = f.type === 'toggle' ? !!v : Math.max(f.min || 0, Math.min(f.max || 999, Math.round(+v) || f.default)); applyKit(); if (phase === 'lobby') lobby(); sayLobby(); return; }
    if (f.type === 'toggle') settings[key] = !!v;
    // (a choice of several, like Boo Who?'s categories: at least one stays picked)
    else if (f.type === 'multi') { const want = (Array.isArray(v) ? v : [v]).map(String); const ok = (f.options || []).filter(o => want.includes(String(o[0]))).map(o => o[0]); if (!ok.length) return; settings[key] = ok; }
    else if (f.options && f.options.some(o => String(o[0]) === String(v))) settings[key] = f.options.find(o => String(o[0]) === String(v))[0];
    else if (f.type === 'text') settings[key] = String(v == null ? '' : v).split(/\n/).map(x => P.safe(x, 90)).filter(Boolean).join('\n').slice(0, 1500);
    else if (f.type === 'number') { const n = Math.round(Number(v)); if (!Number.isFinite(n)) return; settings[key] = Math.max(f.min || 0, Math.min(f.max || 999, n)); }
    // (a mode can turn teams on by itself, like Guess It Right!'s team turns: everyone gets a team right away)
    if (key === 'teams' || key === 'teamN' || (key === 'mode' && game.teamsForce)) balanceTeams();
    lobby(); sayLobby();
  }
  function choose(id) {
    game = games.get(id);
    settings = {};
    for (const f of game.settings) settings[f.key] = f.default;
    // (the sounds as this screen had them last time)
    for (const f of sndFields(game)) settings[f.key] = f.vol ? (SND.vol ? SND.vol(f.vol) : 1) : !SND.kindOff(f.snd);
    // (and the settings every game has, as they were last time)
    const ks = kitSaved();
    for (const f of kitFields(game)) settings[f.key] = f.key in ks ? ks[f.key] : f.default;
    applyKit();
    phase = 'lobby';
    // (a game written in only some languages, like Guess It Right! in English and Arabic: the screen switches to one of
    // them, English unless the screen was in another of the game's own; a player's own language has to be one too)
    if (game.langs && !game.langs.includes(lang)) {
      const to = game.langs.includes('en') ? 'en' : game.langs[0];
      for (const p of players.values()) if (p.lang && !game.langs.includes(p.lang)) p.lang = '';
      setLang(to).then(() => { if (game && game.id === id) { lobby(); sayLobby(); retranslate(); } }).catch(() => {});
    }
    if (game.langs) for (const p of players.values()) if (p.lang && !game.langs.includes(p.lang)) p.lang = '';
    // (the same step in the browser's history, kept as it is: see the Back button below)
    try { history.replaceState(history.state, '', '#' + id + (lang !== 'en' ? '.' + lang : '')); } catch (e) {}
    lobby(); sayLobby(); retranslate();
  }

  // ---------- the screen ----------
  function top(parent, title, sub, right) {
    const t = el('header', 'top', parent);
    // (the game's own icon once one is picked; Boo, ready to party, before that)
    const lg = el('div', 'logo', t); const im = el('img', '', lg); im.alt = '';
    if (game && ICONS.has(game.id)) { im.src = iconOf(game.id); lg.classList.add('gi'); } else im.src = P.booUri('boo:party');
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
  // ---------- full screen: the button in the lobby, or a double click or F anywhere. A TV (when its browser says it is
  // one) goes full screen by itself at the first press of a button on its remote, the same press that turns the sound
  // on: a browser only lets a page go full screen after someone presses something. ----------
  const IS_TV = /SMART-TV|SmartTV|Tizen|Web0S|webOS|NetCast|BRAVIA|AFT[A-Z]|Android TV|GoogleTV|CrKey|HbbTV|VIDAA|PhilipsTV|Roku|Viera|TV Safari/i.test(navigator.userAgent || '');
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const canFs = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  let fsPaint = null;
  function fullScreen(on) {
    try {
      if (on === undefined) on = !fsEl();
      const d = document.documentElement;
      if (on && !fsEl()) { const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: 'hide' }) : d.webkitRequestFullscreen ? d.webkitRequestFullscreen() : null; if (p && p.catch) p.catch(() => {}); }
      else if (!on && fsEl()) { const p = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen ? document.webkitExitFullscreen() : null; if (p && p.catch) p.catch(() => {}); }
    } catch (e) {}
  }
  if (IS_TV) {
    const first = () => { removeEventListener('pointerdown', first, true); removeEventListener('keydown', first, true); fullScreen(true); };
    addEventListener('pointerdown', first, true); addEventListener('keydown', first, true);
    fullScreen(true);
  }
  addEventListener('dblclick', e => { if (e.target && e.target.closest && e.target.closest('button, a, input, select')) return; fullScreen(); });
  addEventListener('keydown', e => { if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) fullScreen(); });
  for (const ev of ['fullscreenchange', 'webkitfullscreenchange']) document.addEventListener(ev, () => { if (fsPaint) fsPaint(); requestAnimationFrame(() => fitLobby()); });
  // ---------- the Back button (a TV remote's, or the browser's) while people are in the game asks first ----------
  // Back would close this page, and the game with it, for everyone. So with players in, it asks "Leave the game?":
  // Keep playing is picked already (OK on a remote keeps playing; the arrows move to Leave), or Leave: every phone
  // hears the game was closed, then Back goes on. Back again while it asks leaves too. (A browser only keeps the extra
  // step that makes this work once someone has pressed or clicked something on this page, so it's added then.)
  const back = { on: false, dlg: null, going: false, said: false, t: 0 };
  const busy = () => !!R && phase !== 'closed' && (phase === 'play' || list().length > 0);
  function armBack() {
    if (back.on || back.going || phase === 'closed') return;
    if (history.state && history.state.bvBack) { back.on = true; return; }
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;
    try { history.pushState({ bvBack: 1 }, '', location.href); back.on = true; } catch (e) {}
  }
  for (const ev of ['pointerup', 'keydown', 'click']) addEventListener(ev, armBack, true);
  addEventListener('popstate', e => {
    if (e.state && e.state.bvBack) { back.on = true; return; }
    if (!back.on) return;
    back.on = false;
    if (back.going) return;
    // (this step still has the address of the game picked before: it gets the one on now)
    if (game) { const h = '#' + game.id + (lang !== 'en' ? '.' + lang : ''); if (location.hash !== h) { try { history.replaceState(history.state, '', h); } catch (e2) {} } }
    if (busy()) askLeave(); else history.back();
  });
  async function askLeave() {
    if (back.dlg) return;
    const t = await Promise.all(['Leave the game?', 'If you leave, the game closes for everyone.', 'Keep playing', 'Leave'].map(x => P.tr(x)));
    if (back.dlg || back.going) return;
    if (!busy()) { history.back(); return; }
    const ov = el('div', 'leave-ov', document.body);
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', t[0]);
    const card = el('div', 'leave-card', ov);
    const im = el('img', 'leave-boo', card); im.src = P.booUri('boo:sad') || P.booUri('boo:hi'); im.alt = '';
    el('h2', '', card, t[0]);
    el('p', '', card, t[1]);
    const row = el('div', 'leave-row', card);
    const stay = el('button', 'leave-btn stay', row, t[2]); stay.type = 'button';
    const go = el('button', 'leave-btn go', row, t[3]); go.type = 'button';
    back.dlg = ov;
    const close = () => { clearTimeout(back.t); removeEventListener('keydown', keys, true); ov.remove(); if (back.dlg === ov) back.dlg = null; };
    // (a remote: the arrows move between the two, OK presses; its Back, or Esc, keeps playing)
    const keys = e => {
      const k = e.key, c = e.keyCode;
      if (/^Arrow/.test(k) || k === 'Tab') { e.preventDefault(); e.stopPropagation(); (document.activeElement === stay ? go : stay).focus(); }
      else if (k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack' || k === 'XF86Back' || c === 461 || c === 10009) { e.preventDefault(); e.stopPropagation(); close(); armBack(); }
    };
    addEventListener('keydown', keys, true);
    stay.onclick = () => { close(); armBack(); };
    go.onclick = () => { close(); leaveNow(); };
    ov.addEventListener('click', e => { if (e.target === ov) stay.onclick(); });
    stay.focus();
    // (nobody picked: after half a minute the game is back on screen)
    back.t = setTimeout(() => { if (back.dlg === ov) stay.onclick(); }, 30000);
  }
  // Leave: every phone hears the game was closed, then Back goes on (here when there's nothing before this page)
  async function leaveNow() {
    back.going = true;
    if (R && !back.said) { back.said = true; try { await Promise.race([R.send({ k: 'closed' }), sleep(900)]); } catch (e) {} }
    const here = location.href;
    try { history.back(); } catch (e) {}
    setTimeout(() => { if (location.href === here && document.visibilityState !== 'hidden') closedScreen(); }, 700);
  }
  // the game is closed: it stops, the phones were told, and a new game can start from here
  async function closedScreen() {
    run++; lobbyRun++;
    unpause(); abandonTimers();
    phase = 'closed';
    nearOn();
    handlers.clear(); playerSubs.clear(); pauseSubs.clear();
    for (const w of [...pending.values()]) w.finish();
    cur.q = null; waitHost = false;
    if (joinEl) { joinEl.remove(); joinEl = null; }
    if (hintEl) hintEl.hidden = true;
    if (booEl) booEl.hidden = true;
    SND.music(null, { fadeOut: 1 }); P.mute(true);
    document.body.dataset.game = '';
    delete document.body.dataset.tlook; delete document.body.dataset.wlook; delete document.body.dataset.bwlook; document.body.classList.remove('tw-on');
    const t = await Promise.all(['The game is closed', 'Thanks for playing!', 'Start a new game'].map(x => P.tr(x)));
    stage.textContent = '';
    const cv = el('div', 'cover closed', stage);
    const box2 = el('div', 'cl-box', cv);
    const im = el('img', 'cl-boo', box2); im.src = P.booUri('boo:love') || P.booUri('boo:hi'); im.alt = '';
    el('h1', '', box2, t[0]);
    el('p', '', box2, t[1]);
    const b = el('button', 'leave-btn stay', box2, t[2]); b.type = 'button';
    b.onclick = () => { back.going = true; location.reload(); };
    b.focus();
  }
  // (a page that closes any other way, like its tab or window: the phones hear it too, if there's time)
  addEventListener('pagehide', e => { if (!e.persisted && R && !back.said && phase !== 'closed') { back.said = true; try { R.send({ k: 'closed' }).catch(() => {}); } catch (e2) {} } });
  // (closing the tab, or reloading, while people play: the browser's own "Leave site?" first)
  addEventListener('beforeunload', e => { if (back.going || back.dlg || !busy()) return; e.preventDefault(); e.returnValue = ''; });

  // music and sound effects (sound.js); a quiet stand-in if it didn't load
  const SND = window.BVSOUND ||{ preload() {}, music() {}, sting() {}, fx() {}, unlock() {}, setOn() {}, enabled: () => false, state: () => 'none', onChange: () => () => {} };
  let sndOff = null;
  // A browser keeps a page quiet until someone clicks it (or presses a key) once, and the players only touch their
  // phones: so a game with sounds shows a hint at the top until then. Any click anywhere turns the sound on.
  let hintEl = null, hintRun = 0;
  async function soundHint() {
    const my = ++hintRun;
    // (never over the winners, though: they show whole, the way their designs have them)
    const show = !!(game && game.sounds) && SND.state() === 'locked' && phase !== 'end';
    if (!show) { if (hintEl) hintEl.hidden = true; return; }
    const text = '🔈 ' + await P.tr('Click anywhere on this screen to turn on the sound');
    if (my !== hintRun) return;
    if (!hintEl) { hintEl = el('button', 'snd-hint', document.body); hintEl.type = 'button'; hintEl.dataset.snd = '1'; hintEl.onclick = () => SND.unlock(); }
    hintEl.textContent = text;
    hintEl.hidden = false;
  }
  SND.onChange(() => soundHint());
  // (it's built off screen, then shown in one go: a newer lobby, like one more player joining, replaces it)
  let lobbyRun = 0, lastSpot = '', played = false;
  const seen = new Set();   // (players whose seat has already popped in)
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
    else for (const x of (dk.match(BVRX.pictoSeq('g')) || []).slice(0, 4)) el('span', 'tile-e', deco, x);
    // (a game can dress the top in its own design: Who's the Imposter?'s signs and its title's neon word)
    if (g && g.lobbyTop) { try { g.lobbyTop(t, el); } catch (e) {} }
    const body = el('div', 'body lob', page);
    // (a full room: the QR code and the game mode share the left side, and all of the right is for the players)
    const crowd = list().length > 8;
    body.classList.toggle('crowd', crowd);
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
    const two = el('div', 'steps2', crowd ? null : left);
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
    if (hp) el('div', 'pill', head, '⭐ ' + await T('Host: {name}', { name: hp.name }));
    else el('div', 'pill wait-host', head, await T('The host signs in with Blokvane on their phone. Everyone else just joins.'));
    // (the seats get their size once the screen is drawn: fitLobby)
    const grid = el('div', 'slots fit', right);
    for (const p of ps) {
      const c = el('div', 'seat' + (seen.has(p.id) ? ' still' : ''), grid);
      seen.add(p.id);
      c.style.setProperty('--pc', p.color);
      const av = el('div', 'av', c); const im = el('img', '', av); im.src = avatarUrl(p); im.alt = '';
      if (p.ready || p.id === host) { el('span', 'ok', av, '✓'); c.classList.add('rd'); }
      // (a player whose phone shows the questions in their own language)
      if (p.lang && g && g.mlang) { const lg = el('span', 'lg', av, p.lang.toUpperCase()); lg.title = (I18N.LANGS.find(x => x[0] === p.lang) || [0, ''])[1]; }
      el('b', '', c, p.name);
      if (p.team && teamsOn()) { const tm = P.TEAMS.find(x => x[0] === p.team); if (tm) { const tb = el('small', 'team', c, await T(tm[1])); tb.style.color = tm[2]; c.style.setProperty('--tc', tm[2]); c.classList.add('tm'); } }
    }
    // (empty seats finish the last row; the first ones invite people in)
    const joinWord = await T('join');
    for (let i = 0; i < 12; i++) { const e = el('div', 'seat empty', grid); if (i < 2) el('span', '', e, joinWord); }
    // what's special about this game: the mode the host picked, explained (Trivia), its helpers, or how it plays
    // (a game drawn without that card, like Guess It Right!'s design, gives all the right side to the seats)
    if (g && g.lobbyCard === false) { /* no card */ }
    else if (g && g.spot) { body.classList.add('has-spot'); await spotCard(crowd ? left : right, g.spot(settings)); }
    else if (g) {
      const ex = el('div', 'lob-x', crowd ? left : right);
      if (g.helpers) {
        el('div', 'lbl', ex, await T('4 helpers · each works once'));
        const chips = el('div', 'chips', ex);
        for (const h of g.helpers) el('span', 'chip', chips, await T(h));
      } else if (g.rules && (typeof g.rules === 'function' || g.rules.length)) {
        // (a game's rules can follow the settings picked: Who's the Imposter?'s game modes)
        const rl = typeof g.rules === 'function' ? g.rules(settings) : g.rules;
        el('div', 'lbl', ex, await T('How to play'));
        const ol = el('ol', 'howto2', ex);
        for (const r of rl) el('li', '', ol, await T(r));
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
    zoomSubs.clear(); zoomSubs.add(zpaint); zoomSubs.add(() => requestAnimationFrame(fitLobby));
    // full screen (a double click anywhere, or F, does the same)
    const fsb = el('button', 'fs', fl);
    fsb.type = 'button';
    const fsT = { on: '⛶ ' + await T('Exit full screen'), off: '⛶ ' + await T('Full screen') };
    fsb.onclick = () => fullScreen();
    const fpaint = () => { if (!fsb.isConnected && fsb.parentNode !== fl) return; fsb.hidden = !canFs(); fsb.textContent = fsEl() ? fsT.on : fsT.off; };
    fpaint();
    fsPaint = fpaint;
    const c = g && (typeof g.credit === 'function' ? g.credit(lang) : g.credit);
    if (c) el('small', '', ft, P.f(c));
    if (my !== lobbyRun || phase === 'play') return;
    stage.textContent = '';
    document.body.dataset.game = g ? g.id : '';
    // (a game's own look for its lobby, like Trivia's four designs, and its winners' dressing, are gone until it puts them back)
    delete document.body.dataset.tlook; delete document.body.dataset.wlook; delete document.body.dataset.bwlook; document.body.classList.remove('tw-on');
    stage.append(...page.childNodes);
    if (g && g.lobbyDone) { try { g.lobbyDone(stage, el, settings); } catch (e) { console.warn('Blokvane play', e); } }
    if (sndOff) sndOff();
    sndOff = SND.onChange(paint);
    soundHint();
    // the game's own lobby tune (Trivia), loaded with its other sounds while people join
    if (g && g.sounds) { SND.preload(g.sounds); SND.music(g.music ? (played ? g.music.again : g.music.lobby) : 'theme', { fadeIn: 1.5 }); } else SND.music(null);
    // (and its questions, in the language picked)
    if (g && g.prep) { try { g.prep(lang); } catch (e) {} }
    fitLobby();
    requestAnimationFrame(fitLobby);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLobby).catch(() => {});
  }
  // Everyone who joins fits on the screen, up to 40: the seats get smaller as the room fills, and the card under them
  // (the game mode, or the helpers) always stays whole. When the room is full the card gets more compact first (its
  // rules go side by side, then its settings go, then its rules, then the medal gets smaller), so the seats keep a
  // size people can read from the sofa.
  function inner(g2) {
    const cs = getComputedStyle(g2), n = v => parseFloat(v) || 0;
    return [g2.clientWidth - n(cs.paddingLeft) - n(cs.paddingRight), g2.clientHeight - n(cs.paddingTop) - n(cs.paddingBottom)];
  }
  function fitLobby() {
    const grid = stage.querySelector('.slots.fit');
    if (!grid || !grid.isConnected || phase === 'play') return;
    if (stage.querySelector('.body.lob.crowd')) return fitCrowd(grid);
    const card = stage.querySelector('.spot');
    const seats = [...grid.children], n = seats.filter(s => !s.classList.contains('empty')).length;
    const empties = seats.filter(s => s.classList.contains('empty'));
    // (one free seat while there's room; at first a full row, or two rows when there's no card under them)
    const want = Math.max(n < 40 ? n + 1 : n, card ? 4 : 8);
    // (a game can ask for taller seats and more room between them: Guess It Right!'s arches)
    const u = stage.clientHeight / 100 * zoom, gap = ((game && game.seatGap) || 1.6) * u, ratio = card ? (game && game.seatRatioCard) || 0.92 : (game && game.seatRatio) || 1.05;
    const LV = ['s1', 's2', 's3', 's4'];
    if (card) card.classList.remove(...LV);
    // (everything that isn't a seat takes the room it needs first; the seats share what's left)
    grid.style.cssText = '';
    for (const e of empties) e.hidden = true;
    let best = null;
    for (let lv = 0; ; lv++) {
      const [W, H] = inner(grid);
      best = null;
      for (let c = 2; c <= 10; c++) {
        const r = Math.ceil(want / c);
        const cw = (W - (c - 1) * gap) / c, ch = (H - (r - 1) * gap) / r;
        const s = Math.min(cw, ch / ratio);
        if (!best || s > best.s + 0.5) best = { c, r, s, ch };
      }
      if (!card || best.s >= 8 * u || lv >= LV.length) break;
      card.classList.add(LV[lv]);
    }
    // (a hair over, so a size that comes out a whisker under a whole pixel isn't a pixel smaller)
    const s = Math.max(3.5 * u, Math.floor(best.s + 0.01));
    grid.style.setProperty('--ss', s + 'px');
    grid.style.gridTemplateColumns = 'repeat(' + best.c + ', ' + s + 'px)';
    grid.style.gridAutoRows = Math.max(3.5 * u, Math.floor(Math.min(best.ch, s * ratio) + 0.01)) + 'px';
    grid.style.gap = gap + 'px';
    // (the empty seats finish the last row)
    const free = Math.max(0, best.c * Math.ceil(want / best.c) - n);
    empties.forEach((e, i) => { e.hidden = i >= free; e.classList.toggle('r2', n + i >= best.c); });
    seated(grid);
  }
  // A full room (more than 8): the game mode card sits under the QR code (more compact if it has to be), and the players
  // have the whole right side: as seats while those stay big enough to read from the sofa, otherwise as chips (a face
  // and a name) in a few columns, which keep the names big.
  function fitCrowd(grid) {
    const card = stage.querySelector('.lob-l > .spot, .lob-l > .lob-x');
    const LV = ['s1', 's2', 's3', 's4'];
    if (card) {
      card.classList.remove(...LV);
      const col = card.parentElement;
      for (const k of LV) { if (col.scrollHeight <= col.clientHeight + 1) break; card.classList.add(k); }
    }
    const seats = [...grid.children], n = seats.filter(x => !x.classList.contains('empty')).length;
    const empties = seats.filter(x => x.classList.contains('empty'));
    const want = n < 40 ? n + 1 : n;
    const u = stage.clientHeight / 100 * zoom, gap = 1.4 * u, ratio = 1.05;
    grid.style.cssText = '';
    grid.classList.remove('chips');
    for (const e of empties) e.hidden = true;
    const [W, H] = inner(grid);
    let best = null;
    for (let c = 2; c <= 10; c++) {
      const r = Math.ceil(want / c), cw = (W - (c - 1) * gap) / c, ch = (H - (r - 1) * gap) / r, sz = Math.min(cw, ch / ratio);
      if (!best || sz > best.s + 0.5) best = { c, r, s: sz, ch };
    }
    let cols, rowH, free;
    if (best.s >= 11 * u) {
      const sz = Math.floor(best.s);
      grid.style.setProperty('--ss', sz + 'px');
      cols = 'repeat(' + best.c + ', ' + sz + 'px)';
      rowH = Math.floor(Math.min(best.ch, sz * ratio));
      free = best.c * Math.ceil(want / best.c) - n;
    } else {
      // chips: as big as they can be (up to 7.5 units tall) while each keeps room for a name of about eight letters
      let pick = null;
      for (let c = 2; c <= 6; c++) {
        const r = Math.ceil(want / c), w = (W - (c - 1) * gap) / c, h = Math.min(7.5 * u, (H - (r - 1) * gap) / r);
        const q = Math.min(h, (w - 1.3 * h) / 3.2);
        if (!pick || q > pick.q + 0.5) pick = { c, r, h, w, q };
      }
      grid.classList.add('chips');
      grid.style.setProperty('--ch', Math.floor(pick.h) + 'px');
      cols = 'repeat(' + pick.c + ', minmax(0, 1fr))';
      rowH = Math.floor(pick.h);
      free = Math.min(1, 40 - n);
    }
    grid.style.gridTemplateColumns = cols;
    grid.style.gridAutoRows = Math.max(3 * u, rowH) + 'px';
    grid.style.gap = gap + 'px';
    empties.forEach((e, i) => { e.hidden = i >= free; });
    seated(grid);
  }
  // (a game can dress the seats once they have their places: Emoji Riddles' rows of theater seats)
  function seated(grid) { if (game && game.seated) { try { game.seated(grid); } catch (e) {} } }
  addEventListener('resize', () => { if (phase !== 'play') requestAnimationFrame(fitLobby); });
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
  // a setting's choice in the game's language ("15 s" and "2.5 min" keep their number)
  function optLabel(t) {
    const x = String(t);
    let m = /^(\d+(?:\.\d+)?) s$/.exec(x); if (m) return P.tr('{n} s', { n: m[1] });
    m = /^(\d+(?:\.\d+)?) min$/.exec(x); if (m) return P.tr('{n} min', { n: m[1] });
    // (an emoji before the words, like Boo Who?'s categories: the words in the game's language)
    m = /^(\S+) (.+)$/.exec(x); if (m && !/[A-Za-z0-9]/.test(m[1]) && /[\u2190-\u2bff\ud83c-\ud83e]/.test(m[1])) return P.tr(m[2]).then(t2 => m[1] + ' ' + t2);
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
        if (!r) { r = el('div', 'row', b); const bar = el('i', 'bar', r); const im = el('img', '', r); im.alt = ''; const nm = el('b', '', r); const h = el('span', 'hearts', r); const pts = el('span', 'pts', r); r._bar = bar; r._pts = pts; r._h = h; r._im = im; r._nm = nm; rows.set(p.id, r); }
        // (a new picture or name from a phone in the middle of the game shows here too)
        const pic = avatarUrl(p); if (r._pic !== pic) { r._pic = pic; r._im.src = pic; }
        if (r._nm.textContent !== p.name) r._nm.textContent = p.name;
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
    const tick = () => { if (left < sec && !r.isConnected) { clearInterval(t); return; } if (paused) return; n.textContent = String(Math.max(0, left)); fg.style.strokeDashoffset = String(276.5 * (1 - Math.max(0, left) / sec)); if (left <= 3 && left > 0) P.sfx('tick'); left--; if (left < -1) clearInterval(t); };
    const go = () => { if (t || stopped || !(sec > 0)) return; tick(); t = setInterval(tick, 1000); };
    if (!(sec > 0)) r.hidden = true;
    else if (idle) n.textContent = String(sec);
    else go();
    return { node: r, go, stop: () => { stopped = true; clearInterval(t); r.classList.add('done'); } };
  }
  let booEl = null;
  function boo(mood) {
    // (false: Boo leaves the corner, for a screen with its own Boo, like a game's own winners)
    if (mood === false) { if (booEl) booEl.hidden = true; return; }
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
  // o: { kind ('choice', 'text', 'pin', 'players', 'number', 'emojimake', 'spin', 'wait'...), prompt, opts, sec, who (ids, default: everyone in), extra,
  //      onAns(id, a) } -> Map(id -> { v, ms })   (ms is measured on each phone, from when the question showed there)
  const cur = { q: null };
  function ask(o) {
    const n = ++round;
    // (everyone still in the game, also a phone the relays haven't heard for a moment: it can answer as soon as it's
    // back. Only the phones that are here hold the question up.)
    const all = new Set((o.who || [...players.values()].filter(p => !p.out).map(p => p.id)).filter(id => players.has(id)));
    const who = new Set([...all].filter(id => !players.get(id).away));
    const q = { k: 'q', n, kind: o.kind || 'choice', prompt: o.prompt || '', opts: o.opts || [], sec: o.sec || 0, extra: o.extra || null, who: [...all] };
    if (o.extra && o.extra.helpOnly) { for (const id of who) sayTo(id, q); }
    else { cur.q = q; say(q); }
    return new Promise(res => {
      // (all: everyone the question is for, even if they leave and come back; sec: its clock, 0 for none)
      const w = { who, all, got: new Map(), done: false, onAns: o.onAns, sec: o.sec || 0, at: Date.now(), q };
      let cancel = () => {};
      w.finish = () => { if (w.done) return; w.done = true; cancel(); pending.delete(n); res(w.got); };
      pending.set(n, w);
      // (a little more time than the phones show: the last tap is still on its way; no clock at all still ends in 2 minutes,
      // unless the question is open: then it waits for everyone, or for the host to show the answer. Paused, it waits.)
      cancel = o.sec ? pafter(w.finish, o.sec * 1000 + 1500) : o.open ? () => {} : pafter(w.finish, 120000);
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
    played = true;
    document.body.dataset.game = game.id;
    delete document.body.dataset.tlook; delete document.body.dataset.wlook; delete document.body.dataset.bwlook; document.body.classList.remove('tw-on');
    for (const p of players.values()) { p.score = 0; p.right = 0; p.lives = +settings.lives || 3; p.out = false; p.streak = 0; p.helpers = {}; }
    balanceTeams();
    sayLobby();
    // 3, 2, 1 (the lobby tune fades out; a game with its own sounds keeps it going until its first sound)
    if (!game.sounds) SND.music(null, { fadeOut: 2 });
    stage.textContent = '';
    const cv = el('div', 'cover', stage);
    // (the game's icon over the 3, 2, 1)
    const cd = el('div', 'cd', cv);
    if (ICONS.has(game.id)) { const gi = el('img', 'cd-gi', cd); gi.src = iconOf(game.id); gi.alt = ''; }
    const n = el('div', 'big', cd, '3');
    for (const x of ['3', '2', '1']) { n.textContent = x; P.sfx('tick'); await sleep(800); if (my !== run) return; }
    if (settings.k_code) showJoin(true, true);
    // (how to play, first: a game with no rules screen of its own gets the kit's, on the TV and on every phone)
    if (settings.k_rules && kitFields(game).some(f => f.key === 'k_rules')) { await kitRules(my); if (my !== run) return; }
    handlers.clear(); playerSubs.clear(); pauseSubs.clear();
    let ranking = null;
    try { ranking = await game.tv(kit(my)); }
    catch (e) { console.warn('Blokvane play', e); }
    // (the host ended this game early: the end screen is already up)
    if (my !== run) return;
    unpause();
    handlers.clear(); playerSubs.clear(); pauseSubs.clear();
    finish(ranking);
  }
  // the host ends the game early: the scores so far win, and the rest of that game just stops
  function stopGame() {
    if (phase !== 'play') return;
    run++;
    unpause();
    handlers.clear(); playerSubs.clear(); pauseSubs.clear();
    for (const w of [...pending.values()]) w.finish();
    finish(null);
    P.mute(true);
  }
  // How to play, before the first question, for a game that has no rules screen of its own: its icon and name, the rules
  // for the settings picked (the game's own lines, and the mode the host picked), and a bar that empties over the time
  // the host set. Every phone shows the same lines in its own language.
  async function kitRules(my) {
    const secs = Math.max(5, Math.min(120, Math.round(+settings.k_rulesSec) || 12));
    const sp = game.spot ? game.spot(settings) : null;
    const lines = [];
    // (the mode's own lines know the settings picked, like no helpers: with them, only the game's first two lines)
    const all = (typeof game.rules === 'function' ? game.rules(settings) : game.rules) || [];
    const rl = sp && Array.isArray(sp.bullets) && sp.bullets.length ? all.slice(0, 2) : all.slice(0, 6);
    if (sp && sp.name) lines.push(['🎮', P.f(sp.name) + (sp.desc ? ': ' + P.f(sp.desc) : '')]);
    for (const t of rl) lines.push(['•', P.f(t)]);
    if (sp && Array.isArray(sp.bullets)) for (const [ic, t] of sp.bullets.slice(0, 3)) lines.push([ic, P.f(t, sp.vars)]);
    stage.textContent = '';
    const cv = el('div', 'cover howto', stage);
    const box = el('div', 'howto-box', cv);
    const hd = el('div', 'howto-hd', box);
    if (ICONS.has(game.id)) { const gi = el('img', 'howto-gi', hd); gi.src = iconOf(game.id); gi.alt = ''; }
    const t = el('div', '', hd); el('small', '', t, P.f('How to play')); el('h1', '', t, P.f(game.name));
    const ol = el('ul', 'howto-list', box);
    for (const [ic, tx2] of lines) { const li = el('li', '', ol); el('i', '', li, ic); el('span', '', li, tx2); }
    const bar = el('div', 'howto-bar', box); const fill = el('i', '', bar); fill.style.animationDuration = secs + 's';
    boo('mind');
    // (the phones: the same, as the English lines; each phone shows them in its own language)
    const m = { k: 'q', n: ++round, kind: 'wait', prompt: P.f('How to play'), extra: { rules: rl, sp: sp ? { name: sp.name, desc: sp.desc, bullets: (sp.bullets || []).slice(0, 3).map(b => b[0] + ' ' + b[1]), vars: sp.vars || null } : null, secs }, who: [] };
    cur.q = m; say(m);
    await psleep(secs * 1000);
  }
  // the host's Pause: the TV stops where it is (the clocks, the moving parts, the sounds) under a big "Paused", and every
  // phone shows it too; Resume goes on from the same second
  function setPause(on) {
    on = !!on;
    if (on === paused || (on && phase !== 'play')) return;
    if (on) {
      paused = true; pausedAt = Date.now();
      for (const x of ptimers) clearTimeout(x.t);
      document.body.classList.add('paused');
      if (SND.pause) SND.pause();
      if (pauseEl) pauseEl.remove();
      pauseEl = el('div', 'pause-ov', document.body);
      const b = el('div', 'pause-box', pauseEl);
      const im = el('img', 'pause-boo', b); im.src = P.booUri('boo:peek'); im.alt = '';
      el('h1', '', b, P.f('Paused'));
      el('p', '', b, P.f('The host paused the game. It goes on from right here when they tap Resume.'));
    } else unpause();
    for (const f of pauseSubs) { try { f(paused); } catch (e) {} }
    say({ k: 'pause', on: paused });
    sayLobby();
  }
  function unpause() {
    if (!paused) return;
    pausedAll += Date.now() - pausedAt; paused = false;
    document.body.classList.remove('paused');
    if (pauseEl) { pauseEl.remove(); pauseEl = null; }
    for (const x of [...ptimers]) x.arm();
    if (SND.resume) SND.resume();
    for (const f of pauseSubs) { try { f(false); } catch (e) {} }
  }
  // (a game that's left behind: everything it was waiting for goes now, so it simply runs out, saying nothing)
  function abandonTimers() { for (const x of [...ptimers]) { clearTimeout(x.t); ptimers.delete(x); try { x.fn(); } catch (e) {} } }
  // the host leaves the game that's on for another start (start over, the setup again, another game): it stops right
  // here, with no winner, and the phones go where the TV goes
  function abortGame() {
    if (phase !== 'play' && phase !== 'end') return;
    run++;
    unpause();
    handlers.clear(); playerSubs.clear(); pauseSubs.clear();
    for (const w of [...pending.values()]) w.finish();
    abandonTimers();
    cur.q = null; waitHost = false;
    if (joinEl) showJoin(false);
  }
  async function finish(ranking) {
    phase = 'end';
    soundHint();
    cur.q = null;
    waitHost = false;
    if (joinEl) showJoin(false);
    let ps = (ranking || list().slice().sort((a, b) => b.score - a.score)).filter(Boolean);
    const teamMode = !!(game.teamsWin && teamsOn());
    let teamPlace = null;
    if (teamMode) {
      // (the team's points are everyone's on it added up; each player's place is the team's)
      // (a game can keep each team's points itself, like Guess It Right!'s team turns: a team scores once per question)
      const tsc = game.teamScore ? game.teamScore() : null;
      ps = P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).map(t => ({ id: 'team-' + t[0], team: t[0], name: P.f(t[1] + ' team'), av: 'boo:party', photo: '', score: tsc && t[0] in tsc ? tsc[t[0]] : list().filter(p => p.team === t[0]).reduce((n2, p) => n2 + p.score, 0) })).sort((a, b) => b.score - a.score);
      teamPlace = new Map(ps.map((t, i) => [t.team, i + 1]));
    }
    // (a game with its own last screen keeps it, and its own music: Who's the Imposter?'s winners)
    const own = !!(ranking && ranking.own && game.ownEnd);
    if (!own) await podium(ps, teamMode);
    const rk = ps.map((p, i) => ({ id: p.id, name: p.name, score: p.score, place: i + 1, av: typeof p.av === 'string' && p.av.length < 40 ? p.av : undefined }));
    for (const p of list()) result(p.id, { end: true, place: teamMode ? (teamPlace.get(p.team) || 0) : rk.findIndex(x => x.id === p.id) + 1, of: rk.length, score: p.score, team: teamMode ? p.team : undefined });
    let look = '';
    try { look = game.endLook ? String(game.endLook() || '').slice(0, 20) : ''; } catch (e) {}
    say({ k: 'end', ranking: rk.slice(0, 10), look, team: teamMode ? 1 : 0 });
    sayLobby();
    letWaitersIn();
  }
  // (the people who came in during the game: in now, for the next one)
  function letWaitersIn() { const w = [...waitNext.values()]; waitNext.clear(); for (const m of w) take(m); }
  // the winner, like a game show's finale: spotlights, light rays turning behind the podium, confetti falling the
  // whole time, and the podium rising (third, second, then first, with a crown)
  async function podium(ps, teamMode) {
    const w = ps[0];
    const k = await P.tr(game.winK ? game.winK(teamMode) : teamMode ? 'The winning team' : 'The winner'), foot = await P.tr('The host can play again, or pick another game.');
    // (Trivia without speed points: a point is a right answer, so it says how many were right)
    const byRight = game.id === 'trivia' && !settings.speed && settings.mode !== 'first' && !teamMode;
    const unit = byRight ? '{n} correct' : '{n} points';
    // (or the game's own line: Guess It Right! says how many were right when every right answer scored the same)
    const line = p => (game.winLine ? game.winLine(p) : [unit, { n: p.score }]);
    for (const p of ps.slice(0, 3)) { const [t2, v2] = line(p); await P.tr(t2, v2); }
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
        el('div', 'sc', who, P.f(...line(p)));
      }
      el('div', 'blk', col, String(place));
    });
    el('p', 'win-foot', cv, foot);
    if (game.winDeco) { try { game.winDeco(cv, el); } catch (e) {} }
    boo('happy');
    // (the winner's fanfare, then the lobby tune again: the room never goes quiet)
    if (game.sounds) { const gm = game.music; if (!gm || gm.win) { SND.music(gm ? gm.after : 'theme', { delay: gm ? gm.afterDelay : 7, fadeIn: gm ? 3 : 2.5, fadeOut: gm ? 1 : 0.4 }); SND.sting(gm ? gm.win : 'win'); } } else { SND.music(null); P.sfx('win'); }
  }
  // confetti falling gently over the winner's stage for as long as it shows: a big first wave, then a lighter rain
  function confettiRain(parent) {
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches || settings.k_calm) return; } catch (e) {}
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
      sleep: ms => (live() ? psleep(ms) : Promise.resolve()),
      // the game's own clock (it stands still while the host has the game paused), whether it's paused now, fn(paused)
      // when that changes (gives back its off function), and fn after ms of the game's time (gives back a cancel)
      now: gnow, paused: () => paused, onPause(fn) { if (!live()) return nop; pauseSubs.add(fn); return () => pauseSubs.delete(fn); },
      after: (ms, fn) => (live() ? pafter(() => { if (live()) fn(); }, ms) : nop),
      say: m => (live() ? say(m) : nop()), sayTo: (id, m) => (live() ? sayTo(id, m) : nop()), box: (id, m) => (live() ? box(id, m) : Promise.resolve(false)),
      ask: o => (live() ? ask(o) : Promise.resolve(new Map())), wait: (t, x) => (live() ? wait(t, x) : nop()), result: (id, r) => (live() ? result(id, r) : nop()),
      on: (k, fn) => (live() ? on(k, fn) : nop), boo: mood => (live() ? boo(mood) : nop()),
      ring: (parent, sec, idle) => (live() ? ring(parent, sec, idle) : { node: el('div'), stop: nop, go: nop }), board: (parent, o) => board(live() ? parent : el('div'), o),
      // (no title: a screen that makes its own top, like Trivia's questions)
      view(title, sub, right) { if (!live()) return el('div'); stage.textContent = ''; if (booEl && booEl.dataset.slot) booEl.hidden = true; if (title != null) top(stage, title, sub, right); const b = el('div', 'body', stage); credit(game); return b; },
      player: id => players.get(id),
      // someone left, came back, joined or was taken out: fn() runs (until the off function it gives back is called)
      onPlayers(fn) { if (!live()) return nop; playerSubs.add(fn); return () => playerSubs.delete(fn); },
      // a player's own language ('' when they follow the game's), and a line in it
      langOf: id => { const p = players.get(id); return (p && p.lang) || ''; },
      trFor: (code, text, vars) => (code && code !== lang && I18N.FULL.has(code) && I18N.has(code) ? I18N.t(code, text, vars) : P.tr(text, vars)),
      // the game waits for the host's phone (Next question): if it's gone, the host passes to someone who's here
      hostWait: on => { waitHost = !!on && live(); },
      teamsOn: () => teamsOn(),
      qn: () => (cur.q ? cur.q.n : 0),
      // (closes a question now: everyone who answered counts)
      close: n => { const w = pending.get(n); if (w && live()) w.finish(); },
      isHost: id => id === host,
      hostId: () => host,
      // points with the game's mode: speed points (faster is more), first right gets a bonus
      award(p, base, ms, secs) { const speed = settings.speed ? Math.round(base * (0.5 + 0.5 * Math.max(0, 1 - (ms || 0) / ((secs || 20) * 1000)))) : base; p.score += speed; return speed; },
      speak: t => (live() ? P.speak(t, lang) : false),
      snd: { music: (n, o) => (live() ? SND.music(n, o) : null), sting: (n, o) => (live() ? SND.sting(n, o) : null), fx: (n, o) => (live() && SND.fx ? SND.fx(n, o) : null), on: () => SND.state() === 'on',
        // (the moment a tune reaches a second of it: the reveal lands on the music's beat)
        at: (n, sec) => (live() ? (SND.at ? SND.at(n, sec) : sleep(sec * 1000)) : Promise.resolve()) },
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
    if (!(window.crypto && crypto.subtle) || !window.WebSocket) { c.lastChild.textContent = P.f('This browser is too old for party games. Try Chrome, Edge, Safari or a newer TV.'); return; }
    const given = h[2] && /^[A-Z]{6}$/.test(h[2]) ? L.normShort(h[2], 6) : '';
    await open(given || '');
    if (games.has(h[0])) choose(h[0]); else { lobby(); retranslate(); }
  }
  // (once every game's script has run: on a slow connection the games after this file can still be on their way, and a
  // link to a game, or the host's list of games, needs them all)
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 0), { once: true }); else setTimeout(boot, 0);
  // (a TV keeps its screen on while a game is open)
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); }); } catch (e) {}
  // (for testing only: with ?debug in the address, the console can see who's in and what's waiting)
  if (/[?&]debug\b/.test(location.search)) window.__bvplay = { players, pending, get host() { return host; }, get phase() { return phase; },
    // (for checking the screens on this computer: made-up players join and get ready, and the winners show straight away)
    fake(names) { names.forEach((nm, i) => { const f = ('aaaaaaaaaaaaaaaa' + (i + 1).toString(16)).slice(-16); take({ k: 'join', f, name: nm, av: P.AVATARS[i % P.AVATARS.length] }); take({ k: 'ready', f, on: true }); }); },
    testWin(scores) { let i = 0; for (const p of players.values()) p.score = scores[i++] || 0; finish(null); },
    // (and the game starts with whoever is in, as if the host had tapped Start)
    go() { if (phase !== 'play') start(); },
    // (a made-up player answers the question that's on: fake player i, 1 to 16)
    answer(i, v, ms) { const f = ('aaaaaaaaaaaaaaaa' + i.toString(16)).slice(-16); if (cur.q) take({ k: 'ans', f, n: cur.q.n, v, ms: ms || 1500 }); },
    get q() { return cur.q; },
    // (the host's settings, set from here)
    set(o) { Object.assign(settings, o); } };
  return { game: game0, get games() { return games; } };
})();
