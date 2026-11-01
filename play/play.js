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
  let R = null, CR = null, code = '', host = '', game = null, settings = {}, phase = 'lobby', lang = 'en', strings = Object.assign({}, P.STR), round = 0;
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
  async function open() {
    const me = await C.newMember();
    const s = L.newSecret();
    R = await L.room({ secret: s, label: 'bvplay', me, name: 'TV', role: 'tv', open: true, onMsg: (m, p) => take(m, p), onPeers: () => sweep() });
    R.link = GO + '#game.' + s + '.' + R.id;
    // a short code for phones that can't scan: a room of its own that only hands out the link
    code = L.shortCode(6);
    CR = await L.room({ secret: await L.codeSecret(code, 'play'), label: 'bvplaycode', me, name: 'TV', role: 'tv', open: true, onMsg: m => { if (m.k === 'link?') CR.send({ k: 'link', s, tv: R.id }, m.f).catch(() => {}); } });
    setInterval(() => { if (phase !== 'end') sayLobby(); }, 12000);
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
    const m = { k: 'lobby', phase, game: game ? game.id : '', gname: game ? (tt ? tt.name : game.name) : '', games: (tx.lang === lang && tx.games) || [...games.values()].map(g => ({ id: g.id, name: g.name, e: g.emoji, sub: g.sub })),
      players: list().map(pub), host, settings, schema: game ? (tt ? tt.schema : game.settings) : [], lang, rtl: P.RTL.has(lang), strings };
    if (to) sayTo(to, m); else say(m);
  }
  // the game list and the settings in the game's language (the host's phone shows them)
  const tx = { key: '', lang: '', games: null, name: '', schema: null };
  async function retranslate() {
    const want = (game ? game.id : '') + '|' + lang;
    const gl = await Promise.all([...games.values()].map(async g => ({ id: g.id, name: await P.tr(g.name), e: g.emoji, sub: await P.tr(g.sub) })));
    const schema = game ? await Promise.all(game.settings.map(async f => Object.assign({}, f, { label: await P.tr(f.label), options: f.options ? await Promise.all(f.options.map(async o => [o[0], await P.tr(String(o[1]))])) : undefined }))) : null;
    const name = game ? await P.tr(game.name) : '';
    if (want !== (game ? game.id : '') + '|' + lang) return;
    Object.assign(tx, { key: want, lang, games: gl, name, schema });
    sayLobby();
  }
  async function setOne(key, v) {
    if (key === 'lang') { if (typeof v === 'string' && /^[a-z]{2}(-[A-Z]{2})?$/.test(v)) { lang = v; await P.useLang(lang); strings = await P.trAll(P.STR); document.documentElement.lang = lang; document.documentElement.dir = P.RTL.has(lang) ? 'rtl' : 'ltr'; document.body.classList.toggle('rtl', P.RTL.has(lang)); } lobby(); sayLobby(); retranslate(); return; }
    const f = game && game.settings.find(x => x.key === key);
    if (!f) return;
    if (f.type === 'toggle') settings[key] = !!v;
    else if (f.options && f.options.some(o => String(o[0]) === String(v))) settings[key] = f.options.find(o => String(o[0]) === String(v))[0];
    else if (f.type === 'text') settings[key] = String(v == null ? '' : v).split(/\n/).map(x => P.safe(x, 90)).filter(Boolean).join('\n').slice(0, 1500);
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
  async function lobby() {
    stage.textContent = '';
    const g = game;
    top(stage, g ? await P.tr(g.name) : await P.tr('Party games'), await P.tr(g ? g.sub : 'Scan the code to join. The first phone in picks the game.'));
    const body = el('div', 'body', stage);
    const left = el('div', 'col', body); left.style.width = '42vw';
    const jc = el('div', 'card join', left);
    const q = el('div', 'qr', jc);
    try { q.appendChild(BVQR.svgOf(R.link, { border: 1 })); } catch (e) {}
    const jt = el('div', '', jc);
    el('div', 'muted', jt, await P.tr('Scan with your phone\'s camera')).style.fontSize = '2.6vh';
    el('div', 'muted', jt, await P.tr('or open Blokvane on your phone and type')).style.cssText = 'font-size:2.2vh;margin-top:2vh';
    el('div', 'code', jt, code.slice(0, 3) + ' ' + code.slice(3));
    const rules = el('div', 'card', left);
    const ol = el('ol', 'howto', rules);
    for (const r of (g ? g.rules : ['Everyone scans the code and picks a name.', 'The first phone in is the host: it picks the game and starts it.', 'Answer on your phone, and watch the TV.'])) el('li', '', ol, await P.tr(r));
    const right = el('div', 'col grow', body);
    const ps = list();
    const head = el('div', 'top', right);
    el('h1', 'grow', head, ps.length ? `${ps.length} ` + await P.tr(ps.length === 1 ? 'player' : 'players') : await P.tr('Waiting for players...')).style.fontSize = '3.6vh';
    const hp = players.get(host);
    if (hp) el('div', 'pill', head, (await P.tr('Host')) + ': ' + hp.name);
    const grid = el('div', 'players', right);
    if (!ps.length) el('div', 'empty', grid, await P.tr('Nobody yet. Scan the code to be first!'));
    for (const p of ps) {
      const c = el('div', 'player', grid);
      c.style.setProperty('--pc', p.color);
      if (p.id === host) el('span', 'crown', c, '👑');
      const av = el('div', 'av', c); const im = el('img', '', av); im.src = avatarUrl(p); im.alt = '';
      el('b', '', c, p.name);
      if (p.team) { const t = P.TEAMS.find(x => x[0] === p.team); if (t) { const tb = el('small', '', c, t[1]); tb.style.color = t[2]; } }
      if (p.ready) el('span', 'ok', c, '✓');
    }
    el('div', 'foot', stage, g ? await P.tr(hp ? 'The host starts the game from their phone.' : 'Waiting for the host.') : await P.tr('Made by Blokvane. No app, no account: your phone and this screen talk straight to each other.'));
    credit(g);
  }
  function credit(g) { if (g && g.credit) el('div', 'credit', stage, g.credit); }
  // the scoreboard: score bars slide, out players fade (sorted, the leader on top)
  function board(parent, o = {}) {
    const b = el('div', 'board', parent);
    el('h2', '', b, o.title || 'Scoreboard');
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
  function ring(parent, sec) {
    const r = el('div', 'ring', parent);
    r.innerHTML = '<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><span></span>';
    const fg = r.querySelector('.fg'), n = r.querySelector('span');
    let left = sec, t = 0;
    const tick = () => { if (left < sec && !r.isConnected) { clearInterval(t); return; } n.textContent = String(Math.max(0, left)); fg.style.strokeDashoffset = String(276.5 * (1 - Math.max(0, left) / sec)); if (left <= 3 && left > 0) P.sfx('tick'); left--; if (left < -1) clearInterval(t); };
    if (sec > 0) { tick(); t = setInterval(tick, 1000); } else r.hidden = true;
    return { node: r, stop: () => { clearInterval(t); r.classList.add('done'); } };
  }
  let booEl = null;
  function boo(mood) {
    if (!booEl || !booEl.isConnected) { booEl = el('div', 'boo', document.body); el('img', '', booEl).alt = ''; }
    const id = { happy: 'boo:party', sad: 'boo:sad', wow: 'boo:wow', laugh: 'boo:laugh', scary: 'boo:scary', cool: 'boo:cool', hi: 'boo:hi', love: 'boo:love', mind: 'boo:mind' }[mood] || 'boo:hi';
    booEl.firstChild.src = P.booUri(id);
    booEl.animate([{ transform: 'scale(.6) translateY(4vh)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 600, easing: 'cubic-bezier(.2,1.4,.4,1)' });
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
      // (a little more time than the phones show: the last tap is still on its way; no clock at all still ends in 2 minutes)
      t = setTimeout(w.finish, o.sec ? o.sec * 1000 + 1500 : 120000);
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
    // 3, 2, 1
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
      ps = P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).map(t => ({ id: 'team-' + t[0], team: t[0], name: t[1], av: 'boo:party', photo: '', score: list().filter(p => p.team === t[0]).reduce((n2, p) => n2 + p.score, 0) })).sort((a, b) => b.score - a.score);
      teamPlace = new Map(ps.map((t, i) => [t.team, i + 1]));
    }
    stage.textContent = '';
    const cv = el('div', 'cover', stage);
    const box2 = el('div', '', cv);
    const w = ps[0];
    el('div', 'muted', box2, await P.tr(teamMode ? 'The winning team' : 'The winner')).style.fontSize = '3.4vh';
    el('h1', '', box2, w ? (teamMode ? await P.tr(w.name) : w.name) : '...');
    const pod = el('div', 'podium', box2);
    [ps[1], ps[0], ps[2]].forEach((p, i) => { if (!p) return; const d = el('div', 'p', pod); const im = el('img', '', d); im.src = avatarUrl(p); im.alt = ''; el('b', '', d, p.name).style.fontSize = '3vh'; const blk = el('div', 'blk', d, String([2, 1, 3][i])); blk.style.height = ['16vh', '24vh', '11vh'][i]; el('small', 'muted', d, p.score + ' ' + strings.points).style.fontSize = '2.4vh'; });
    el('p', '', box2, await P.tr('The host can play again, or pick another game.')).style.marginTop = '4vh';
    P.confetti(); P.sfx('win'); boo('happy');
    const rk = ps.map((p, i) => ({ id: p.id, name: p.name, score: p.score, place: i + 1 }));
    for (const p of list()) result(p.id, { end: true, place: teamMode ? (teamPlace.get(p.team) || 0) : rk.findIndex(x => x.id === p.id) + 1, of: rk.length, score: p.score, team: teamMode ? p.team : undefined });
    say({ k: 'end', ranking: rk.slice(0, 10) });
    sayLobby();
  }
  // what a game gets to work with (once a game is over, nothing it does reaches the screen or the phones)
  function kit(my) {
    const live = () => my === run && phase === 'play';
    const nop = () => {};
    return {
      players: list, alive, get settings() { return settings; }, lang, tr: P.tr, P, el, strings, top, stage, avatarUrl,
      sleep: ms => (live() ? sleep(ms) : Promise.resolve()),
      say: m => (live() ? say(m) : nop()), sayTo: (id, m) => (live() ? sayTo(id, m) : nop()), box: (id, m) => (live() ? box(id, m) : Promise.resolve(false)),
      ask: o => (live() ? ask(o) : Promise.resolve(new Map())), wait: (t, x) => (live() ? wait(t, x) : nop()), result: (id, r) => (live() ? result(id, r) : nop()),
      on: (k, fn) => (live() ? on(k, fn) : nop), boo: mood => (live() ? boo(mood) : nop()),
      ring: (parent, sec) => (live() ? ring(parent, sec) : { node: el('div'), stop: nop }), board: (parent, o) => board(live() ? parent : el('div'), o),
      view(title, sub, right) { if (!live()) return el('div'); stage.textContent = ''; top(stage, title, sub, right); const b = el('div', 'body', stage); credit(game); return b; },
      player: id => players.get(id),
      qn: () => (cur.q ? cur.q.n : 0),
      isHost: id => id === host,
      // points with the game's mode: speed points (faster is more), first right gets a bonus
      award(p, base, ms, secs) { const speed = settings.speed ? Math.round(base * (0.5 + 0.5 * Math.max(0, 1 - (ms || 0) / ((secs || 20) * 1000)))) : base; p.score += speed; return speed; },
      speak: t => (live() ? P.speak(t, lang) : false),
      over: () => !live()
    };
  }

  // ---------- off we go ----------
  function game0(def) { games.set(def.id, def); }
  async function boot() {
    stage.textContent = '';
    const c = el('div', 'cover', stage);
    el('h1', '', c, 'Blokvane party games');
    el('p', '', c, 'Getting the room ready...');
    if (!(window.crypto && crypto.subtle) || typeof BigInt !== 'function' || !window.WebSocket) { c.lastChild.textContent = 'This browser is too old for party games. Try Chrome, Edge, Safari or a newer TV.'; return; }
    await open();
    // #trivia or #trivia.es: that game, in that language
    const h = location.hash.replace(/^#/, '').split('.');
    if (h[1] && /^[a-z]{2}$/.test(h[1])) { lang = h[1]; await P.useLang(lang); strings = await P.trAll(P.STR); document.documentElement.lang = lang; document.documentElement.dir = P.RTL.has(lang) ? 'rtl' : 'ltr'; document.body.classList.toggle('rtl', P.RTL.has(lang)); }
    if (games.has(h[0])) choose(h[0]); else { lobby(); retranslate(); }
  }
  setTimeout(boot, 0);
  // (a TV keeps its screen on while a game is open)
  try { if (navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.wakeLock) navigator.wakeLock.request('screen').catch(() => {}); }); } catch (e) {}
  return { game: game0, get games() { return games; } };
})();
