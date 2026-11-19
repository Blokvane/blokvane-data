// Blokvane party games: Dominoes 151, the TV. The table everyone looks at: the chain in the middle, every player's
// tiles face down around it (so everyone sees how many each one holds, and nobody sees which), whose turn it is, the
// pile to draw from, the score, and the game's own deal, lock and round-end animations. Each player holds their tiles
// on their own phone and plays from there (../go/m/party.js with dom-ph.js). Empty seats are played by the computer,
// so one person can play a whole match alone, and friends can play each other, in teams or each alone.
// The rules, the looks and the computer players are the game's own (dom-core.js), kept exactly as they were made.
(() => {
  'use strict';
  const D = BVDOM, h = D.h, px = D.px, GOLD = D.GOLD, CREAM = D.CREAM, INK = D.INK, KUFI = D.KUFI, PLEX = D.PLEX;
  const P = BVPLAYC;
  // (the table is drawn on a canvas whose short side is this many units, then sized to the screen: it looks the same
  // on a phone-sized tablet and on a wall-sized TV)
  const VS = 640;
  const TH = 62, SW = 84, HEAD = 66;
  const SPEED = { slow: 1500, normal: 900, fast: 400 };
  const MODES = [['teams', 'Teams, 2 vs 2', 'Partners sit across from each other. All 28 tiles are dealt.'], ['duel', '1 vs 1', 'Seven tiles each, 14 in the pile to draw from.'],
    ['solo3', 'Three players, each alone', 'Seven tiles each, 7 in the pile to draw from.'], ['solo4', 'Four players, each alone', 'Everyone plays for themselves. All 28 tiles are dealt.']];
  const T = (text, vars) => D.t(text, vars);
  // (a row of things with a little room between them, also in browsers that don't know "gap")
  const gapX = (el, g) => { for (let i = 1; i < el.children.length; i++) el.children[i].style.marginLeft = g + 'px'; };
  const gapY = (el, g) => { for (let i = 1; i < el.children.length; i++) el.children[i].style.marginTop = g + 'px'; };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const x = a[i]; a[i] = a[j]; a[j] = x; } return a; };
  // (the mark of a game mode, drawn with the game's own ivory and pips: a tile whose two halves are the two sides, with a
  // pip for each player on a side, or a small tile's face for each player who plays alone. It is sized in "em", so the
  // lobby's card can make it as big as it likes.)
  function modeIcon(mode) {
    // (one face of a tile, s em on a side, with n pips)
    const face = (n, s) => {
      const f = h('span', 'position:relative;display:block;flex:none;width:' + s + 'em;height:' + s + 'em'), d = s * 0.2, pad = s * 0.15, tr = (s - 2 * pad) / 3;
      for (const c of D.cells(n, false)) h('span', 'position:absolute;width:' + d.toFixed(2) + 'em;height:' + d.toFixed(2) + 'em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#55504a,#0d0c0b 70%);left:' + (pad + tr * (c % 3 + 0.5) - d / 2).toFixed(2) + 'em;top:' + (pad + tr * (Math.floor(c / 3) + 0.5) - d / 2).toFixed(2) + 'em', f);
      return f;
    };
    const body = 'background:linear-gradient(145deg,#fffdf7 0%,#f4ecd9 50%,#e0d3b6 100%);border-radius:.45em;box-shadow:inset 0 .06em 0 rgba(255,255,255,.95),0 .16em 0 #a3916a,0 .34em .5em rgba(0,0,0,.5)';
    const out = h('span', 'display:flex;flex-direction:column;align-items:center;justify-content:center;direction:ltr;font-size:calc(1.13 * var(--u, 8px));line-height:1');
    if (mode === 'teams' || mode === 'duel') {
      const t = h('span', 'display:flex;align-items:center;' + body, out), n = mode === 'teams' ? 2 : 1;
      t.appendChild(face(n, 2.5)); h('span', 'flex:none;width:.12em;height:1.9em;border-radius:.06em;background:rgba(70,52,22,.55)', t); t.appendChild(face(n, 2.5));
    } else {
      (mode === 'solo3' ? [1, 2] : [2, 2]).forEach((k, r) => {
        const row = h('span', 'display:flex' + (r ? ';margin-top:.24em' : ''), out);
        for (let i = 0; i < k; i++) h('span', 'display:block;' + body + (i ? ';margin-left:.24em' : ''), row).appendChild(face(1, 1.85));
      });
    }
    return out;
  }

  // ---------- the tiles' own sounds, made note by note as the game always made them: the clack of a tile on the table,
  // the softer one of a tile drawn, the knock of a pass, the slam of a last tile, the shuffle, the lock, the gates, and
  // the little tunes of a round won or lost. They go through the kit's "other sounds" (its switch, its volume). ----------
  const RIGS = new WeakMap();
  function rig(ac, out) {
    let r = RIGS.get(ac);
    if (r) return r;
    // (the tiles sit under the music: a clack is short and sharp, so it is heard without being loud)
    const trim = ac.createGain(); trim.gain.value = 0.5; trim.connect(out);
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(trim);
    const dry = ac.createGain(); dry.gain.value = 0.9; dry.connect(comp);
    const n = Math.floor(ac.sampleRate * 0.32), ir = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 4); }
    const rev = ac.createConvolver(); rev.buffer = ir;
    const wet = ac.createGain(); wet.gain.value = 0.2; rev.connect(wet); wet.connect(comp);
    const bus = ac.createGain(); bus.connect(dry); bus.connect(rev);
    r = { bus };
    RIGS.set(ac, r);
    return r;
  }
  function sfxOn(ac, out, kind) {
    const bus = rig(ac, out).bus;
    const t = ac.currentTime + 0.01, R = (a, b) => a + Math.random() * (b - a);
    const env = (node, at, v, dur, pan) => {
      const g = ac.createGain(); g.gain.setValueAtTime(v, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur); node.connect(g);
      if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); p.connect(bus); } else g.connect(bus);
    };
    const tone = (at, f, v, dur, type, f2, pan) => { const o = ac.createOscillator(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, at); if (f2) o.frequency.exponentialRampToValueAtTime(f2, at + dur); env(o, at, v, dur, pan); o.start(at); o.stop(at + dur + 0.02); };
    const noise = (at, v, dur, freq, q, pan) => { const n = Math.max(1, Math.floor(ac.sampleRate * dur)), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; const s = ac.createBufferSource(), f = ac.createBiquadFilter(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; s.connect(f); env(f, at, v, dur, pan); s.start(at); };
    const clack = (at, v, pan, table) => {
      const k = R(0.9, 1.12);
      noise(at, v * 1.1, 0.012, 4200 * k, 0.7, pan);
      tone(at, 1850 * k, v * 0.28, 0.045, 'sine', 0, pan);
      tone(at, 3150 * k, v * 0.16, 0.03, 'sine', 0, pan);
      tone(at, 4900 * k, v * 0.08, 0.02, 'sine', 0, pan);
      if (table) { noise(at, v * 0.5, 0.05, 900 * k, 1.2, pan); tone(at, 150 * k, v * 0.55, 0.09, 'sine', 85, pan); }
    };
    if (kind === 'clack') { clack(t, 0.9, R(-0.25, 0.25), true); if (Math.random() < 0.6) clack(t + R(0.045, 0.07), 0.2, 0, false); }
    else if (kind === 'draw') clack(t, 0.35, 0, false);
    else if (kind === 'lock') [0.62, 0.7].forEach(d => { noise(t + d, 0.9, 0.02, 3200, 2); tone(t + d, 1400, 0.3, 0.06); });
    else if (kind === 'gate') [0.25, 0.43].forEach(d => { tone(t + d, 130, 1, 0.18, 'sine', 60); noise(t + d, 0.6, 0.05, 900, 1); });
    else if (kind === 'slam') { clack(t, 1.5, 0, true); tone(t, 95, 1, 0.28, 'sine', 42); noise(t, 0.7, 0.14, 320, 0.8); }
    else if (kind === 'knock') [0, 0.16].forEach(d => { tone(t + d, 210, 0.7, 0.1, 'sine', 110); noise(t + d, 0.45, 0.04, 650, 1.5); noise(t + d, 0.2, 0.008, 2600, 1); });
    else if (kind === 'shuffle') { noise(t, 0.1, 1.3, 1800, 0.4); for (let i = 0; i < 26; i++) clack(t + R(0, 1.2), R(0.1, 0.3), R(-0.8, 0.8), i % 4 === 0); }
    else if (kind === 'win') [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { const a = t + 0.35 + i * 0.12; tone(a, f, 0.22, 0.9); tone(a, f * 2, 0.07, 0.5); tone(a, f * 3.01, 0.03, 0.3); });
    else if (kind === 'lose') [392, 329.63, 261.63].forEach((f, i) => { const a = t + 0.35 + i * 0.2; tone(a, f, 0.2, 0.8, 'triangle'); tone(a, f / 2, 0.12, 0.8); });
    else if (kind === 'pop') { tone(t, 620, 0.25, 0.08, 'sine', 900); }
  }

  // (what a round's result says, for everyone on the TV: names all the way, never "you")
  const resultWords = (g, S) => D.resultWords(g.result, { teams: g.teams, me: -1, name: S.name, teamName: S.teamName, over: g.phase === 'match' });

  // =====================================================================
  // Dominoes 151
  // =====================================================================
  BVPLAY.game({
    id: 'dominoes', name: 'Dominoes 151', emoji: '🎲', sub: 'The table is on the TV. Your tiles are on your phone.',
    teams: true, teamsForce: s => s.mode === 'teams',
    // only in English and in Arabic (Iraqi, the way it is said at the table); each player can pick the other for their phone
    langs: ['en', 'ar'], mlang: true,
    endLook: () => 'dom', ownEnd: true,
    // (the kit's own marks on this game's pages, like the bullets of "How to play", are left empty: dom.css draws pips there)
    plain: true,
    step: ['Play from your phone', 'Your tiles show on your phone. Tap one, or drag it up, when it is your turn.'],
    // its own music: one tune in the lobby, four that take turns all match long, and one of two for the winners
    sounds: [], music: { lobby: 'dLobby', again: 'dLobby', after: 'dLobby' },
    freeNote: 'Free games: a short match, first to 51. A host with Blokvane Pro plays to 101, 151 or 201.',
    prep: () => { try { D.css(); D.words(); } catch (e) {} },
    langPrep: () => { try { D.words(); } catch (e) {} },
    // (the lobby's top wears three tiles instead of the letters)
    deco: 'dom',
    lobbyTop: (t) => {
      try {
        D.css();
        const d = t.querySelector('.deco'); if (!d) return;
        d.textContent = ''; d.classList.add('dmn-deco');
        [[1, 5], [1, 1], [6, 6]].forEach((x, i) => { const w = h('span', 'display:inline-block;transform:rotate(' + [-8, 4, 10][i] + 'deg);margin:0 .5em', d); w.className = 'dmn-deco-t'; w.appendChild(D.tile(x, { size: 'menu', vert: i === 1 })); });
      } catch (e) {}
    },
    rules: s => ['Your tiles are on your phone. On your turn, play one that matches either open end of the chain on the TV.', 'Can\'t play? Draw from the pile until you can. With no pile, you pass.',
      'Go out first and score the pips left in your opponents\' hands.', 'If nobody can play, the game is locked: the fewest pips win.'],
    steps: [{ t: 'Game mode', s: 'Mode', keys: ['lang', 'mode'] }, { t: 'The match', s: 'Match', keys: ['target', 'level', 'speed'] }, { t: 'Turns', s: 'Turns', keys: ['turnSec', 'autoPass', 'autoNext', 'hints', 'reactions'] },
      { t: 'The table', s: 'Look', keys: ['table', 'tiles', 'dealFx', 'endFx', 'lockFx', 'border', 'bots'] }],
    spot: s => {
      const m = MODES.find(x => x[0] === s.mode) || MODES[0];
      // (no emoji anywhere in this game: the mode's mark is drawn, and each line gets a pip from the game's style sheet.
      // "How to play" shows the first two rules and then these three lines, so they say what the two rules don't.)
      const bullets = [['', m[0] === 'teams' ? 'Pick your team on your phone: partners sit across' : 'Everyone has their own score'], ['', 'Go out first and score the pips left in your opponents\' hands.'], ['', 'Empty seats are played by the computer']];
      const facts = [['', 'First to {n}', { n: +s.target || 151 }], +s.turnSec ? ['', '{n} s a turn', { n: +s.turnSec }] : ['', 'No time limit'], ['', { easy: 'Computer: easy', normal: 'Computer: normal', hard: 'Computer: hard' }[s.level] || 'Computer: normal']];
      return { key: m[0], icon: '', iconEl: () => modeIcon(m[0]), label: 'Game mode', name: m[1], desc: m[2], bullets, vars: { n: +s.target || 151 }, facts };
    },
    settings: [
      { key: 'mode', label: 'Game mode', type: 'seg', look: 'list', options: MODES, default: 'teams' },
      { key: 'target', label: 'Match target', type: 'seg', options: [[51, '51'], [101, '101'], [151, '151'], [201, '201']], default: 151, desc: 'The first side to reach this many points wins the match.' },
      { key: 'level', label: 'Computer level', type: 'seg', options: [['easy', 'Easy'], ['normal', 'Normal'], ['hard', 'Hard']], default: 'normal', desc: 'Seats with no phone are played by the computer. This is how well it plays.' },
      { key: 'speed', label: 'Game speed', type: 'seg', options: [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast']], default: 'normal', desc: 'How long a computer player thinks before it plays.' },
      { key: 'turnSec', label: 'Time for a turn', type: 'seg', options: [[0, 'No limit'], [15, '15 s'], [20, '20 s'], [30, '30 s'], [45, '45 s'], [60, '60 s']], default: 0, desc: 'When a player\'s time is up, a tile is played for them, so the game never waits.' },
      { key: 'autoPass', label: 'Auto pass when a player cannot play', type: 'toggle', default: true, desc: 'A player with no tile that fits, and no pile to draw from, passes by themselves.' },
      { key: 'autoNext', label: 'Auto start next round', tag: 'Next round', type: 'seg', options: [[0, 'Off'], [5, '5 s'], [10, '10 s'], [15, '15 s']], default: 0, desc: 'Off: the host starts each round from their phone.' },
      { key: 'hints', label: 'Highlight playable tiles', type: 'toggle', default: true, desc: 'On each phone, the tiles that can be played stand a little higher.' },
      { key: 'reactions', label: 'Player reactions', type: 'toggle', default: true, desc: 'Speech bubbles on the TV, from the players\' phones and from the computer players.' },
      // (the looks: the host can change them in the middle of a match too)
      { key: 'table', label: 'Table', type: 'seg', options: D.TABLES.map(x => [x[0], x[1]]), default: 'teal', live: 1, desc: 'The table, the tiles and the border can be changed at any time, even in the middle of a match.' },
      { key: 'tiles', label: 'Tiles', type: 'seg', options: D.TILE_SETS.map(x => [x[0], x[2], x[1]]), default: 'classic', live: 1 },
      { key: 'dealFx', label: 'Deal animation', type: 'seg', options: D.DEALS, default: 'line', live: 1 },
      { key: 'endFx', label: 'Round end style', type: 'seg', options: D.ENDS, default: 'sweep', live: 1 },
      { key: 'lockFx', label: 'Lock animation', type: 'seg', options: D.LOCKS, default: 'padlock', live: 1 },
      { key: 'border', label: 'Table border', type: 'seg', options: D.BORDERS, default: 'wood', live: 1 },
      // (the computer players' names, colors and faces, one line each: "name|color|face". The host's phone has its own
      // page for it, "Computer players", so this one never shows as a plain box: its "when" is never true.)
      { key: 'bots', label: 'Names of the computer players', type: 'text', default: '', live: 1, when: ['mode', '-'], desc: 'Give each one a name, a color and a face. Leave a name empty and it gets an everyday American one.' }
    ],
    async tv(K) {
      D.css(); D.words(); D.setLang(K.lang);
      const s = K.settings;
      const mode = D.CFG[s.mode] ? s.mode : 'teams';
      // (the free games: a short match)
      const target = K.free ? 51 : ([51, 101, 151, 201].includes(+s.target) ? +s.target : 151);
      const lvl = ['easy', 'normal', 'hard'].includes(s.level) ? s.level : 'normal';
      const thinkMs = SPEED[s.speed] || SPEED.normal;
      const turnSec = [15, 20, 30, 45, 60].includes(+s.turnSec) ? +s.turnSec : 0;
      const autoNext = [5, 10, 15].includes(+s.autoNext) ? +s.autoNext : 0;
      const g = D.newMatch(mode);
      const look = () => ({ table: s.table || 'teal', tiles: s.tiles || 'classic', dealFx: s.dealFx || 'line', endFx: s.endFx || 'sweep', lockFx: s.lockFx || 'padlock', border: s.border || 'wood' });

      // ---------- who sits where: the people in the room first (a team's two sit across from each other), then the
      // computer in every seat that is left. Someone who comes in later takes a computer's seat at the next round. ----------
      const seats = new Array(g.n).fill(null);
      const here = id => { const p = id && K.player(id); return !!p && !p.away; };
      const used = new Set();
      function botNames() { return String(s.bots || '').split('\n').map(x => x.split('|')); }
      function freshName() {
        const taken = new Set(K.players().map(p => String(p.name).toLowerCase()).concat(seats.filter(Boolean).map(x => String(x.name).toLowerCase())));
        const pool = shuffle(D.NAMES.filter(n => !taken.has(n.toLowerCase()) && !used.has(n)));
        const n = pool[0] || D.NAMES[Math.floor(Math.random() * D.NAMES.length)];
        used.add(n);
        return n;
      }
      function makeBot(p) { return { p, id: '', bot: true, name: freshName(), col: null, av: '' }; }
      // (the host named the computer players, or picked their colors: the first line is the first computer seat, and so on)
      function dressBots() {
        const lines = botNames();
        let i = 0;
        for (const x of seats) {
          if (!x || !x.bot) continue;
          const l = lines[i++] || [];
          const nm = P.safe(String(l[0] || '').trim(), 12);
          if (nm) x.name = nm; else if (x.named) x.name = x.auto0;
          if (!x.auto0) x.auto0 = x.name;
          x.named = !!nm;
          x.col = l[1] != null && l[1] !== '' && D.PAL[+l[1]] ? +l[1] : null;
          x.av = P.AVATARS.includes(l[2]) ? l[2] : '';
        }
      }
      function seatEveryone() {
        const ps = K.players().slice().sort((a, b) => (K.isHost(b.id) ? 1 : 0) - (K.isHost(a.id) ? 1 : 0));
        const put = (p, pl) => { seats[p] = { p, id: pl.id, bot: false, name: pl.name, col: null, av: '' }; };
        if (g.teams) {
          const A = [], B = [], rest = [];
          for (const pl of ps) { if (pl.team === 'blue' && A.length < 2) A.push(pl); else if (pl.team === 'red' && B.length < 2) B.push(pl); else rest.push(pl); }
          for (const pl of rest) { if (A.length <= B.length && A.length < 2) A.push(pl); else if (B.length < 2) B.push(pl); else if (A.length < 2) A.push(pl); }
          [[0, A[0]], [2, A[1]], [1, B[0]], [3, B[1]]].forEach(x => { if (x[1]) put(x[0], x[1]); });
        } else ps.slice(0, g.n).forEach((pl, i) => put(i, pl));
        for (let p = 0; p < g.n; p++) if (!seats[p]) seats[p] = makeBot(p);
        dressBots();
        g.bot = seats.map(x => x.bot);
      }
      // (between rounds: someone in the room without a seat takes a computer's; on their own team's side when there are teams)
      function seatNewcomers() {
        // (someone who left the room for good: the computer keeps their seat, under a name of its own)
        for (let p = 0; p < g.n; p++) if (!seats[p].bot && !K.player(seats[p].id)) seats[p] = makeBot(p);
        const seated = new Set(seats.filter(x => !x.bot).map(x => x.id));
        for (const pl of K.players()) {
          if (seated.has(pl.id)) continue;
          let free = seats.filter(x => x.bot);
          if (!free.length) break;
          if (g.teams) { const want = pl.team === 'red' ? 1 : pl.team === 'blue' ? 0 : -1; const mine = free.filter(x => x.p % 2 === want); if (mine.length) free = mine; }
          const x = free[0];
          seats[x.p] = { p: x.p, id: pl.id, bot: false, name: pl.name, col: null, av: '' };
          seated.add(pl.id);
        }
        dressBots();
        g.bot = seats.map(x => x.bot);
      }
      const S = {
        name: p => { const x = seats[p]; if (!x) return ''; if (!x.bot) { const pl = K.player(x.id); if (pl) x.name = pl.name; } return x.name; },
        teamName: team => (g.teams ? [team, team + 2].map(p => S.name(p)).join(' & ') : S.name(team)),
        sideName: i => (g.teams ? S.teamName(i) : S.name(i))
      };
      const pic = p => { const x = seats[p]; if (x.bot) return x.av ? P.booUri(x.av) : ''; const pl = K.player(x.id); return pl ? K.avatarUrl(pl) : P.booUri('boo:hi'); };
      const avbg = p => { const x = seats[p]; return x.col != null && D.PAL[x.col] ? D.grad(x.col) : D.AV[D.colOf(g.teams, p)]; };
      const ini = p => (String(S.name(p)).trim()[0] || '?').toUpperCase();
      const seatOf = id => seats.findIndex(x => x && !x.bot && x.id === id);
      seatEveryone();

      // ---------- the sounds ----------
      const sfx = kind => K.snd.synth((ac, out) => sfxOn(ac, out, kind));
      K.snd.music('dPlay' + 'ABCD'[Math.floor(Math.random() * 4)], { fadeIn: 2, fadeOut: 1.5 });

      // ---------- the screen ----------
      const body = K.view(null);
      K.boo(false);
      document.body.classList.add('dmn-on');
      const scr = h('div', 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:9;overflow:hidden;background:#081717;direction:ltr', body);
      scr.className = 'dmn';
      const cv = h('div', 'position:absolute;left:0;top:0;display:flex;flex-direction:column;transform-origin:0 0;font-family:' + PLEX + ';color:' + CREAM + ';background:#081717', scr);
      const head = h('header', 'flex:none;height:' + HEAD + 'px;box-sizing:border-box;display:flex;align-items:center;padding:6px 22px;position:relative', cv);
      const felt = h('main', 'flex:1;min-height:0;position:relative', cv);
      felt.className = 'dmn-felt';
      const inFelt = D.clip(felt);
      const seatLayer = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0', inFelt);
      const board = h('div', 'position:absolute;overflow:hidden', inFelt);
      const over = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none', inFelt);
      const V = { k: 1, W: 0, H: 0, bx: 0, by: 0, bw: 600, bh: 300, sig: '', dealing: false, lock: null, fx: false, panel: false, notice: '', count: null, waitHost: false, bubbles: new Map(), timer: null, chainN: 0, seatSig: [], final: false };
      // (the stickers: above everything on the table, and never in the way of a tap, since a TV has none)
      const stkLayer = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:20;pointer-events:none', inFelt);
      const rtl = () => K.lang === 'ar';
      const txt = e => { if (rtl()) e.style.direction = 'rtl'; return e; };
      function fit() {
        let z = 1;
        try { z = Math.max(0.6, Math.min(1, parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')) || 1)); } catch (e) {}
        const W = innerWidth, H = innerHeight, k = Math.min(W, H) / VS * z;
        const sig = [W, H, z, look().border].join('|');
        if (sig === V.sig) return false;
        V.sig = sig; V.k = k;
        const vw = W * z / k, vh = H * z / k;
        cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
        V.narrow = vw < 900;
        head.style.height = (V.narrow ? HEAD + 48 : HEAD) + 'px';
        cv.style.transform = 'translate(' + (W * (1 - z) / 2) + 'px,' + (H * (1 - z) / 2) + 'px) scale(' + k + ')';
        return true;
      }
      // where things are on the felt: the seats around, the pile, and the board in the middle
      function geo() {
        const W = felt.clientWidth, H = felt.clientHeight, two = g.n === 2, three = g.n === 3;
        const top = three ? 106 : TH, left = two ? 184 : SW, right = two ? 40 : SW;
        V.W = W; V.H = H; V.bx = left; V.by = top; V.bw = Math.max(120, W - left - right); V.bh = Math.max(90, H - top - TH);
        board.style.left = V.bx + 'px'; board.style.top = V.by + 'px'; board.style.width = V.bw + 'px'; board.style.height = V.bh + 'px';
      }
      const playing = () => g.phase === 'play';
      // ----- the top: the game, the round, and the score with everyone's names -----
      function drawHead() {
        head.textContent = '';
        // (in Arabic the top reads from the right: the game's name there, the turn on the left; the table itself never turns)
        const rw = rtl() ? 'row-reverse' : 'row', ml = rtl() ? 'margin-right' : 'margin-left', narrow = !!V.narrow;
        head.style.flexDirection = narrow ? 'column' : rw; head.style.justifyContent = 'center';
        // (a narrow screen: the name and the turn on the first line, the score on its own line under them)
        const top = narrow ? h('div', 'display:flex;flex-direction:' + rw + ';align-items:center;width:100%;min-width:0', head) : head;
        const l = h('div', 'display:flex;flex-direction:' + rw + ';align-items:baseline;flex:1 1 0;min-width:0', top);
        txt(h('span', 'font-family:' + KUFI + ';font-weight:700;font-size:26px;color:' + GOLD + ';white-space:nowrap', l, T('Dominoes 151')));
        txt(h('span', 'font-size:15px;color:#bbd7d9;' + ml + ':12px;white-space:nowrap', l, T('Round {n}', { n: g.round })));
        const mid = h('div', 'flex:none;display:flex;align-items:stretch;max-width:' + (narrow ? '100%;margin-top:7px' : '64%') + ';border-radius:20px;background:rgba(0,0,0,.28);box-shadow:inset 0 0 0 1px rgba(243,234,214,.16),0 6px 16px rgba(0,0,0,.35);padding:5px 8px');
        const lead = Math.max.apply(null, g.scores);
        g.scores.forEach((sc, i) => {
          if (i) h('div', 'flex:none;width:1px;margin:6px 6px;background:rgba(243,234,214,.2)', mid);
          const c = i, ps = g.teams ? [i, i + 2] : [i];
          const box = h('div', 'display:flex;align-items:center;min-width:0;padding:2px 8px', mid);
          const avs = h('div', 'display:flex;flex:none', box);
          ps.forEach((p, j) => { const a = avatar(p, 30, 13); a.style.boxShadow = '0 0 0 2px ' + D.RING[c]; if (j) a.style.marginLeft = '-9px'; avs.appendChild(a); });
          const mm = h('div', 'min-width:0;margin-left:9px', box);
          const row = h('div', 'display:flex;align-items:baseline;min-width:0', mm);
          txt(h('span', 'font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:' + (narrow ? (g.scores.length > 2 ? 62 : 150) : g.teams ? 230 : g.n === 2 ? 200 : 120) + 'px', row, S.sideName(i)));
          h('span', 'flex:none;margin-left:10px;font-family:' + KUFI + ';font-weight:700;font-size:26px;line-height:1;color:' + (sc === lead && sc > 0 ? GOLD : CREAM), row, String(sc));
          const bar = h('div', 'height:5px;background:#12484b;border-radius:3px;margin-top:4px;overflow:hidden', mm);
          h('div', 'height:5px;border-radius:3px;background:' + (i ? CREAM : GOLD) + ';width:' + Math.min(100, sc / target * 100) + '%', bar);
        });
        if (!narrow) head.appendChild(mid);
        const r = h('div', 'display:flex;flex-direction:' + rw + ';align-items:center;justify-content:flex-end;flex:1 1 0;min-width:0', top);
        if (narrow) head.appendChild(mid);
        const st = statusWords();
        if (st) txt(h('span', 'padding:4px 14px;border-radius:14px;background:rgba(0,0,0,.3);border:1.5px solid ' + (playing() && !V.dealing ? GOLD : '#3f6c6e') + ';font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%', r, st));
        txt(h('span', 'flex:none;' + ml + ':12px;font-size:13px;color:#bbd7d9;white-space:nowrap', r, T('First to {n}', { n: target })));
      }
      function statusWords() {
        if (V.final) return '';
        if (V.notice) return T('Dealing again…');
        if (V.dealing) return T('Dealing…');
        if (!playing()) return g.phase === 'match' ? T('Match over') : T('Round over');
        const p = g.turn, x = seats[p];
        if (x.bot) return T('{name} is thinking…', { name: S.name(p) });
        if (!here(x.id)) return T('{name} is away: the computer plays', { name: S.name(p) });
        const moves = D.legal(g, p);
        if (!moves.length) return g.bone.length ? T('{name} draws from the pile', { name: S.name(p) }) : T('{name} cannot play', { name: S.name(p) });
        return T('{name}\'s turn', { name: S.name(p) });
      }
      // a player's picture: their photo or their Boo; a computer player's letter on its color (or the Boo the host gave it)
      function avatar(p, size, fs) {
        const e = h('span', 'position:relative;width:' + size + 'px;height:' + size + 'px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:' + fs + 'px;color:' + CREAM + ';background:' + avbg(p));
        const u = pic(p);
        if (u) { const im = h('img', 'width:100%;height:100%;border-radius:50%;object-fit:cover;display:block', e); im.alt = ''; im.src = u; }
        else e.textContent = ini(p);
        return e;
      }
      const ptsOf = p => { const c = D.colOf(g.teams, p), cnt = !!g.result && g.result.team >= 0 && D.teamOf(g, p) !== g.result.team; return { pts: D.pts(g.hands[p]), bg: cnt ? D.RING[c] : 'rgba(0,0,0,.45)', bd: cnt ? CREAM : D.RING[c] }; };
      // ----- the seats: who sits there, their tiles face down while the round is on and face up when it is over -----
      function seatSig(p) {
        const x = seats[p], pl = x.bot ? null : K.player(x.id), b = V.bubbles.get(p), tm = V.timer && V.timer.p === p ? V.timer.id : 0;
        return JSON.stringify([S.name(p), x.bot ? x.av + '|' + x.col : (pl ? (pl.photo ? pl.photo.length + pl.photo.slice(-12) : pl.av) : ''), g.hands[p].length, playing() ? 0 : g.hands[p], playing() && g.turn === p && !V.dealing, g.said[p], b ? b.text + b.at : 0, tm, look().tiles, x.bot || here(x.id), V.dealing, V.W, V.H, g.round, !!g.result, V.final]);
      }
      const seatEls = [];
      function drawSeats(force) {
        for (let p = 0; p < g.n; p++) {
          const sg = seatSig(p);
          if (!force && V.seatSig[p] === sg && seatEls[p] && seatEls[p].isConnected) continue;
          V.seatSig[p] = sg;
          const old = seatEls[p];
          const e = seatEl(p, !!old && old.dataset.open === '1');
          if (old && old.isConnected) seatLayer.replaceChild(e, old); else seatLayer.appendChild(e);
          seatEls[p] = e;
        }
        drawPile();
      }
      function seatEl(p, wasOpen) {
        const seat = g.seats[p], row = seat === 0 || seat === 2, on = playing() && g.turn === p && !V.dealing, x = seats[p], gone = !x.bot && !here(x.id);
        const W = V.W, H = V.H, two = g.n === 2;
        let e;
        if (row) e = h('div', 'position:absolute;left:' + (two ? 184 : 0) + 'px;width:' + (two ? W - 184 : W) + 'px;' + (seat === 2 ? 'top:0' : 'bottom:0') + ';height:' + TH + 'px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:' + (seat === 2 ? '8px 10px 4px' : '4px 10px 8px'));
        else e = h('div', 'position:absolute;' + (seat === 3 ? 'left:0' : 'right:0') + ';top:' + V.by + 'px;width:' + SW + 'px;height:' + V.bh + 'px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px;font-size:13px');
        const who = row ? h('div', 'display:flex;align-items:center;font-size:14px;flex:none;position:relative', e) : e;
        const av = avatar(p, 38, 16);
        av.style.boxShadow = on ? '0 0 0 3px ' + GOLD + ',0 0 18px ' + GOLD : '0 0 0 2px rgba(255,255,255,.25)';
        av.style.transition = 'box-shadow .2s';
        const timed = on && V.timer && V.timer.p === p;
        if (on && !timed) h('span', 'position:absolute;left:-7px;top:-7px;right:-7px;bottom:-7px;box-sizing:border-box;border:3px solid ' + GOLD + ';border-radius:50%;pointer-events:none;animation:dmTurn 1.1s ease-in-out infinite', av);
        if (gone) av.style.opacity = '.55';
        who.appendChild(av);
        // (the time left for this turn, as a ring that runs out around the picture)
        if (on && V.timer && V.timer.p === p) {
          const left = Math.max(0, V.timer.end - K.now()), sec = V.timer.sec;
          const ring = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          ring.setAttribute('viewBox', '0 0 100 100');
          ring.style.cssText = 'position:absolute;left:-9px;top:-9px;width:56px;height:56px;transform:rotate(-90deg);pointer-events:none';
          ring.innerHTML = '<circle cx="50" cy="50" r="45" fill="none" stroke="rgba(0,0,0,.45)" stroke-width="7"/><circle cx="50" cy="50" r="45" fill="none" stroke="#fff3bf" stroke-width="7" stroke-linecap="round" stroke-dasharray="283" style="animation:dmRing ' + sec + 's linear ' + (-(sec - left / 1000)).toFixed(2) + 's both"/>';
          av.appendChild(ring);
        }
        const cnt = g.hands[p].length;
        const label = txt(h('span', (row ? 'margin-left:10px;' : 'margin-top:6px;text-align:center;max-width:' + (SW - 8) + 'px;') + 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis' + (row ? ';max-width:190px' : ''), who, S.name(p)));
        if (gone) label.style.opacity = '.6';
        // (how many tiles they hold, as a number too: easy to read from the sofa)
        if (playing() && !V.dealing) h('span', (row ? 'margin-left:8px;' : 'margin-top:5px;') + 'flex:none;min-width:22px;height:22px;padding:0 6px;box-sizing:border-box;border-radius:11px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:' + (on ? INK : CREAM) + ';background:' + (on ? GOLD : 'rgba(0,0,0,.4)') + ';box-shadow:inset 0 0 0 1px ' + (on ? GOLD : 'rgba(243,234,214,.3)'), who, String(cnt));
        if (!playing() && !V.final) { const q = ptsOf(p); h('span', (row ? 'margin-left:8px;' : 'margin-top:6px;') + 'flex:none;min-width:32px;height:32px;padding:0 6px;box-sizing:border-box;border-radius:16px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;color:' + CREAM + ';background:' + q.bg + ';border:2px solid ' + q.bd + (wasOpen ? '' : ';animation:dmFxPop .4s .3s both'), who, String(q.pts)); }
        const tl = h('div', row ? 'display:flex;flex:none;margin-left:18px;padding-bottom:6px;max-width:60%;' : 'display:flex;flex-direction:column;align-items:center;min-height:0;margin-top:6px;padding-bottom:8px;', e);
        tl.dataset.seat = String(p);
        if (V.dealing) tl.style.opacity = '0';
        const cap = row ? 12 : 9;
        if (playing()) {
          for (let i = 0; i < Math.min(cnt, cap); i++) { const b = row ? D.back(22, 44, 5) : D.back(44, 22, 5); if (!row) { b.style.flex = '0 1 22px'; b.style.minHeight = '12px'; } tl.appendChild(b); }
          if (row) gapX(tl, 5); else gapY(tl, 7);
        } else {
          e.dataset.open = '1';
          for (const t of g.hands[p].slice(0, cap)) { const o = D.tile(t, { set: look().tiles, size: 'open', vert: row }); if (!wasOpen) o.style.animation = 'dmFxPop .4s both'; tl.appendChild(o); }
          if (row) gapX(tl, 5); else gapY(tl, 7);
        }
        const tail = row ? who : e;
        if (g.said[p] && playing()) txt(h('span', (row ? 'margin-left:8px;' : 'margin-top:6px;') + 'flex:none;background:' + CREAM + ';color:' + INK + ';padding:2px 9px;border-radius:10px;font-size:13px;font-weight:600;white-space:nowrap', tail, T('Pass')));
        const b = V.bubbles.get(p);
        if (b) {
          // (a speech bubble never pushes the tiles around and keeps off the chain: beside the tiles for the seats at the
          // top and the bottom, over the picture for the seats at the sides)
          let hold;
          if (row) {
            const rowW = two ? W - 184 : W, est = 38 + 10 + Math.min(190, S.name(p).length * 9) + 44 + 18 + Math.min(cnt, cap) * (playing() ? 27 : 39) + (g.said[p] && playing() ? 62 : 0);
            if ((rowW - est) / 2 > 44 + String(b.text).length * 9) { tl.style.position = 'relative'; hold = h('span', 'position:absolute;z-index:6;left:100%;top:50%;transform:translateY(-50%);margin-left:14px', tl); }
            else hold = h('span', 'position:absolute;z-index:6;left:50%;' + (seat === 2 ? 'top:' : 'bottom:') + (TH - 6) + 'px;transform:translateX(-50%)', e);
          } else {
            const at = h('span', 'position:relative;flex:none;width:38px;height:0');
            e.insertBefore(at, av);
            hold = h('span', 'position:absolute;z-index:6;bottom:12px;' + (seat === 3 ? 'left:-6px' : 'right:-6px'), at);
          }
          txt(h('span', 'display:block;background:#fffdf7;color:' + INK + ';padding:5px 13px;border-radius:' + (seat === 1 ? '14px 14px 3px 14px' : '14px 14px 14px 3px') + ';font-size:15px;font-weight:600;white-space:nowrap;box-shadow:0 4px 10px rgba(0,0,0,.45)' + (b.fresh ? ';animation:dmFxPop .3s both' : ''), hold, b.text)).className = 'dmn-bub';
          e.style.overflow = 'visible'; e.style.zIndex = '4';
          b.fresh = false;
        }
        return e;
      }
      // ----- the pile, with two or three players: how many tiles are left to draw -----
      let pileEl = null, pileSig = '';
      function drawPile() {
        const sig = [g.n, g.bone ? g.bone.length : 0, V.W, V.H, V.dealing, playing() && !D.legal(g, g.turn).length && g.bone.length > 0].join('|');
        if (sig === pileSig && pileEl && pileEl.isConnected) return;
        pileSig = sig;
        if (pileEl) pileEl.remove();
        pileEl = null;
        if (g.n >= 4 || !g.bone) return;
        const two = g.n === 2, canDraw = playing() && !V.dealing && !D.legal(g, g.turn).length && g.bone.length > 0;
        const frow = (V.H - 70) / 7, bth = Math.max(14, Math.min(36, Math.floor(frow * 0.62), Math.floor(frow) - 12)), bgap = Math.max(12, Math.round(bth * 0.45));
        const e = h('div', 'position:absolute;display:flex;flex-direction:column;align-items:center;padding:10px 12px 18px;border-radius:16px;color:' + CREAM + ';font-size:14px;font-weight:600;background:' + (canDraw ? 'rgba(222,186,104,.28)' : 'transparent') + ';box-shadow:' + (canDraw ? 'inset 0 0 0 2px ' + GOLD : 'none'), seatLayer);
        txt(h('span', 'white-space:nowrap', e, T(canDraw ? 'Draw · {n}' : 'Pile · {n}', { n: g.bone.length })));
        const grid = h('div', 'margin-top:12px;display:flex;flex-wrap:wrap;' + (two ? 'width:' + (4 * bth + 12) + 'px' : 'justify-content:center;width:' + (7 * 24 + 6 * 9) + 'px'), e);
        g.bone.forEach((t, i) => {
          const b = two ? D.back(2 * bth, bth, Math.round(bth * 0.22), 'pile') : D.back(24, 48, 5, 'pile');
          if (two) { if (i % 2) b.style.marginLeft = '12px'; if (i > 1) b.style.marginTop = bgap + 'px'; } else { if (i % 7) b.style.marginLeft = '9px'; if (i > 6) b.style.marginTop = '8px'; }
          grid.appendChild(b);
        });
        if (two) { e.style.left = '0'; e.style.width = '184px'; e.style.boxSizing = 'border-box'; e.style.top = '50%'; e.style.transform = 'translateY(-50%)'; }
        else { e.style.left = '50%'; e.style.top = '0'; e.style.transform = 'translateX(-50%)'; }
        pileEl = e;
      }
      // ----- the board: the chain, or who starts -----
      let boardSig = '';
      function drawBoard(force) {
        const L = look(), sig = JSON.stringify([g.chain, g.anchor, V.bw, V.bh, L.tiles, V.dealing, g.must, g.turn, g.round, S.name(g.turn)]);
        if (!force && sig === boardSig) return;
        boardSig = sig;
        for (const c of [].slice.call(board.querySelectorAll('.dmn-ct,.dmn-empty'))) c.remove();
        const first = board.firstChild;
        if (!g.chain.length) {
          if (!V.dealing && playing()) {
            const m = g.must != null ? T('{name} holds the {a}–{a} and starts.', { name: S.name(g.turn), a: g.must }) : T('{name} starts.', { name: S.name(g.turn) });
            const e = txt(h('span', 'position:absolute;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;text-align:center;color:#e6eeee;font-size:17px', null, m));
            e.className = 'dmn-empty'; board.insertBefore(e, first);
          }
          V.chainN = 0; V.lay = null;
          return;
        }
        const tmp = document.createDocumentFragment();
        const holder = h('div', '');
        V.lay = D.drawChain(holder, g.chain, { set: L.tiles, anchor: g.anchor, W: V.bw, H: V.bh, last: g.last, moves: g.moves, drop: g.chain.length !== V.chainN });
        while (holder.firstChild) { holder.firstChild.classList.add('dmn-ct'); tmp.appendChild(holder.firstChild); }
        board.insertBefore(tmp, first);
        V.chainN = g.chain.length;
      }
      // ----- over the table: a misdeal's notice, the lock, the round's result, the tiles flying at the deal -----
      let noticeEl = null, lockEl = null, fxEl = null, panelEl = null, dealEl = null;
      function drawNotice() {
        if (noticeEl) { noticeEl.remove(); noticeEl = null; }
        if (!V.notice) return;
        noticeEl = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:9;display:flex;align-items:center;justify-content:center;padding:16px;pointer-events:none', over);
        txt(h('div', 'background:' + CREAM + ';color:' + INK + ';padding:14px 22px;border-radius:14px;font-size:17px;font-weight:600;text-align:center;max-width:460px;box-shadow:0 12px 30px rgba(0,0,0,.6);animation:dmFxPop .3s both', noticeEl, V.notice));
      }
      const sceneK = () => Math.max(0.5, Math.min(1.5, (V.bw - 16) / 440, (V.bh - 12) / 214));
      function drawLock() {
        if (lockEl) { lockEl.remove(); lockEl = null; }
        const L = V.lock, kind = look().lockFx;
        if (!L || kind === 'off') return;
        lockEl = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:6', board);
        h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;background:' + (kind === 'gates' ? 'rgba(0,0,0,.3)' : 'rgba(0,0,0,.55)') + ';animation:dmFxFade .3s both', lockEl);
        const abs = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none', lockEl);
        const B = o => h('div', 'position:absolute;left:' + px(o.x) + ';top:' + px(o.y) + ';width:' + px(o.w) + ';height:' + px(o.h) + ';box-sizing:border-box;background:' + (o.bg || 'transparent') + ';border-radius:' + (o.rad || '4px') + ';box-shadow:' + (o.sh || 'none') + ';border:' + (o.bd || 'none') + ';animation:' + (o.an || 'none'), abs);
        if (kind === 'gates' && g.chain.length && V.lay) [V.lay.endL, V.lay.endR].forEach((e, i) => { const an = 'dmLkSlam .45s ' + (0.2 + i * 0.18) + 's both', bar = 'linear-gradient(90deg,#8a6a22,#f1dc98 45%,#c39a3f 60%,#6b5218)'; const gx = e.x + (e.dir || 0) * 7; B({ x: gx - 5, y: e.y - 44, w: 10, h: 88, bg: bar, sh: '0 6px 10px rgba(0,0,0,.55)', an }); B({ x: gx - 17, y: e.y - 49, w: 34, h: 8, bg: bar, an }); B({ x: gx - 17, y: e.y + 41, w: 34, h: 8, bg: bar, an }); });
        if (kind === 'banner') B({ x: 0, y: 0, w: V.bw, h: V.bh, rad: '0px', bd: '4px solid rgba(214,84,66,.9)', sh: 'inset 0 0 40px rgba(214,84,66,.5)', an: 'dmLkPulse 1s ease-in-out infinite' });
        const st = h('div', 'position:absolute;left:50%;top:50%;width:440px;height:214px;margin:-107px 0 0 -220px;transform:scale(' + sceneK() + ');pointer-events:none' + (rtl() ? ';direction:rtl' : ''), lockEl);
        const name = S.name(L.p);
        D.drawScene(st, D.lockScene({ kind, name, ini: ini(L.p), av: avbg(L.p), pic: pic(L.p), t: { locked: T('Locked'), closedBy: T('{name} closed the game', { name }), lockedBy: T('{name} locked the game', { name }), counting: T('Nobody can play. Counting the hands…') } }));
      }
      function fxData(kind) {
        const r = g.result || {}, tie = r.team < 0, w = resultWords(g, S);
        const parts = tie ? [] : g.hands.map((hd, q) => (D.teamOf(g, q) !== r.team ? D.pts(hd) : null)).filter(x => x != null);
        return { kind, tie, points: r.points, title: w.title, who: tie ? T('Tie') : S.sideName(r.team), parts, calc: tie ? T('No points this round') : D.calcOf(g.hands, r.team, g.teams),
          scoreLine: g.scores.map((sc, i) => S.sideName(i) + ' ' + sc).join('   ·   '), upper: !rtl(), t: { tie: T('Tie'), noPoints: T('no points') } };
      }
      // (under a result: what happens next. A count down to the next round, or whose phone starts it.)
      function nextWords() {
        if (g.phase === 'match') return '';
        if (V.count != null) return T('Next round ({n})', { n: V.count });
        const hp = K.player(K.hostId());
        return hp ? T('{name} starts the next round', { name: hp.name }) : T('Next round');
      }
      function drawFx() {
        if (fxEl) { fxEl.remove(); fxEl = null; }
        if (!V.fx) return;
        fxEl = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:7', board);
        h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.58);animation:dmFxFade .5s both', fxEl);
        const st = h('div', 'position:absolute;left:50%;top:50%;width:440px;height:214px;margin:-107px 0 0 -220px;transform:scale(' + sceneK() + ')' + (rtl() ? ';direction:rtl' : ''), fxEl);
        D.drawScene(st, D.fxScene(fxData(look().endFx)));
        const nx = h('div', 'position:absolute;left:0;right:0;top:156px;height:54px;display:flex;justify-content:center', st);
        nx.className = 'dmn-next';
        drawNext();
      }
      function drawNext() {
        const hold = (fxEl && fxEl.querySelector('.dmn-next')) || (panelEl && panelEl.querySelector('.dmn-next'));
        if (!hold) return;
        hold.textContent = '';
        const w = nextWords();
        if (!w) return;
        const ring = h('div', 'position:relative;height:54px;border-radius:27px;padding:3px;box-sizing:border-box;background:rgba(255,255,255,.16);overflow:hidden', hold);
        if (V.count != null && V.countOf) h('div', 'position:absolute;left:0;top:0;bottom:0;width:100%;background:#fff3bf;transform-origin:0 50%;animation:dmBar ' + V.countOf + 's linear ' + (-(V.countOf - V.count)).toFixed(2) + 's both', ring);
        const inner = h('div', 'position:relative;height:48px;border-radius:24px;background:#140b0c;padding:4px;box-sizing:border-box', ring);
        txt(h('div', 'height:40px;min-width:128px;padding:0 20px;box-sizing:border-box;border-radius:20px;background:' + GOLD + ';color:' + INK + ';font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;white-space:nowrap', inner, w));
      }
      // the round's result as a panel: who holds what, and the sum (the "Panel" style, and always for the last round)
      function drawPanel() {
        if (panelEl) { panelEl.remove(); panelEl = null; }
        placeStickers();
        if (!V.panel) return;
        const L = look(), r = g.result || {}, w = resultWords(g, S);
        panelEl = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:10;background:rgba(8,18,20,.6);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;animation:dmFxFade .3s both', over);
        try { panelEl.style.backdropFilter = 'blur(5px)'; } catch (e) {}
        const card = h('div', 'background:' + CREAM + ';color:' + INK + ';border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.55);padding:24px 28px;width:660px;max-width:100%;box-sizing:border-box;transform-origin:50% 50%' + (rtl() ? ';direction:rtl' : ''), panelEl);
        const match = g.phase === 'match', wi = match ? g.scores.findIndex(x => x >= target) : -1;
        const title = match ? (g.teams ? T('{team} win the match', { team: S.teamName(wi) }) : T('{name} wins the match', { name: S.name(wi) })) : w.title;
        h('div', 'font-family:' + KUFI + ';font-weight:700;font-size:24px;line-height:1.2', card, title);
        h('div', 'font-size:15px;margin-top:6px', card, match ? w.title + '. ' + w.detail : w.detail);
        const list = h('div', 'margin-top:16px;border-top:1px solid rgba(29,27,24,.25)', card);
        for (const p of (g.teams ? [0, 2, 1, 3] : g.hands.map((_, q) => q))) {
          const cnt = r.team >= 0 && D.teamOf(g, p) !== r.team, c = D.colOf(g.teams, p);
          const row = h('div', 'display:flex;align-items:center;padding:10px 0;border-bottom:1px solid rgba(29,27,24,.25)', list);
          const who = h('div', 'width:172px;flex:none;display:flex;align-items:center', row);
          const a = avatar(p, 40, 17); a.style.boxShadow = '0 2px 5px rgba(0,0,0,.35)'; who.appendChild(a);
          const nm = h('div', 'min-width:0;margin:0 10px', who);
          h('div', 'font-weight:600;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis', nm, S.name(p));
          if (g.teams) h('div', 'font-size:13px;font-weight:600;color:' + D.RING[c] + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis', nm, T('with {name}', { name: S.name((p + 2) % 4) }));
          const tray = h('div', 'flex:1;min-width:0;min-height:40px;display:flex;flex-wrap:wrap;align-items:center;padding:6px 12px 11px;margin:0 14px;border-radius:12px;background:' + D.TRAY[c] + ';box-shadow:inset 0 2px 6px rgba(0,0,0,.45);direction:ltr', row);
          for (const t of g.hands[p]) { const e = D.tile(t, { set: L.tiles, size: 'sum' }); e.style.margin = '4px 4px'; tray.appendChild(e); }
          if (!g.hands[p].length) h('span', 'color:' + CREAM + ';font-size:14px' + (rtl() ? ';direction:rtl' : ''), tray, T('No tiles left'));
          h('div', 'flex:none;width:54px;height:54px;box-sizing:border-box;border:3px solid ' + D.RING[c] + ';border-radius:50%;background:' + (cnt ? D.RING[c] : 'transparent') + ';color:' + (cnt ? CREAM : INK) + ';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:21px', row, String(D.pts(g.hands[p])));
        }
        if (r.team != null) {
          const tie = r.team < 0, parts = tie ? [] : g.hands.map((hd, q) => (D.teamOf(g, q) !== r.team ? D.pts(hd) : null)).filter(x => x != null);
          const sum = h('div', 'margin-top:14px;padding:12px 18px;border-radius:14px;background:#082c2e;color:' + CREAM + ';display:flex;justify-content:space-between;align-items:center', card);
          const l = h('div', '', sum);
          h('div', 'font-size:14px', l, tie ? T('Tie') : g.teams ? T('{team} score', { team: S.teamName(r.team) }) : T('{name} scores', { name: S.name(r.team) }));
          h('div', 'font-size:18px;font-weight:600;margin-top:2px;direction:' + (tie && rtl() ? 'rtl' : 'ltr'), l, tie ? T('No points this round') : D.calcOf(g.hands, r.team, g.teams) || String(r.points));
          h('div', 'font-family:' + KUFI + ';font-weight:700;font-size:40px;line-height:1;color:' + GOLD + ';direction:ltr;margin:0 4px', sum, tie ? '0' : '+' + r.points);
        }
        const sc = h('div', 'display:flex;flex-wrap:wrap;justify-content:space-between;font-size:15px;margin-top:14px', card);
        g.scores.forEach((x, i) => { const e = h('span', 'margin:2px 8px 2px 0', sc); e.appendChild(document.createTextNode(S.sideName(i) + ' ')); h('strong', '', e, String(x)); });
        if (!match) { const nx = h('div', 'margin-top:14px;height:54px;display:flex;justify-content:center', card); nx.className = 'dmn-next'; drawNext(); }
        // (it always shows whole: a tall one, like four full hands, is drawn a little smaller)
        const availH = V.H - 32, ch = card.offsetHeight;
        if (ch > availH) card.style.transform = 'scale(' + Math.max(0.5, availH / ch).toFixed(3) + ')';
      }
      // the deal: the tiles leave a line (or a ring, or drop in) for each seat, two, two, then three each
      function runDeal() {
        const kind = look().dealFx;
        if (dealEl) { dealEl.remove(); dealEl = null; }
        if (kind === 'off') return 0;
        const fr = felt.getBoundingClientRect(), k = fr.width / (felt.offsetWidth || 1), ox = fr.left + felt.clientLeft * k, oy = fr.top + felt.clientTop * k;
        const slots = g.hands.map((hd, p) => {
          const el = seatEls[p] && seatEls[p].querySelector('[data-seat]');
          if (!el || el.children.length < Math.min(hd.length, 7)) return null;
          const rs = [].slice.call(el.children, 0, 7).map(c => c.getBoundingClientRect());
          if (rs.some(r => r.width < 2 || r.height < 2)) return null;
          return j => ({ x: (rs[j].left - ox) / k, y: (rs[j].top - oy) / k, w: rs[j].width / k, h: rs[j].height / k });
        });
        if (slots.some(x => !x)) return 0;
        const plan = D.dealPlan({ kind, n: g.n, W: V.W, H: V.H, board: { x: V.bx, y: V.by, w: V.bw, h: V.bh }, slots, name: 'dmGd' });
        D.keyframes('dm-deal-kf', plan.css);
        dealEl = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;z-index:8;pointer-events:none', over);
        for (const d of plan.tiles) h('div', 'position:absolute;left:' + d.x + ';top:' + d.y + ';width:' + d.w + ';height:' + d.h + ';border-radius:' + d.rad + ';background:' + D.DEAL_BG + ';box-shadow:inset 0 0 0 1px rgba(255,255,255,.7),0 0 0 1px #b9a77f,0 0 12px rgba(0,0,0,.6);animation:' + d.an, dealEl);
        for (const ms of plan.beats) K.after(ms, () => sfx('draw'));
        return plan.ms;
      }
      function drawAll(force) {
        const L = look();
        felt.dataset.table = L.table;
        D.rim(felt, L.border, true);
        geo();
        drawHead(); drawSeats(force); drawBoard(force);
        if (force) { drawNotice(); drawLock(); drawFx(); drawPanel(); }
        placeStickers();
      }
      function refresh() { if (V.final) return; drawHead(); drawSeats(false); drawBoard(false); }
      const onResize = () => { if (K.over() || V.final) return; if (fit()) { boardSig = ''; pileSig = ''; drawAll(true); } };
      addEventListener('resize', onResize);
      const sizeT = setInterval(() => { if (K.over() || !scr.isConnected) { clearInterval(sizeT); removeEventListener('resize', onResize); document.body.classList.remove('dmn-on'); return; } onResize(); }, 1200);

      // ---------- a speech bubble by a seat (a computer player's line, or what a player sent from their phone) ----------
      function bubble(p, text, ms) {
        if (p == null || p < 0 || p >= g.n || !text) return;
        const b = { text: String(text), at: Date.now(), fresh: true };
        V.bubbles.set(p, b);
        drawSeats(false);
        setTimeout(() => { if (V.bubbles.get(p) === b) { V.bubbles.delete(p); if (!K.over() && !V.final) drawSeats(false); } }, ms || 1900);
      }

      // ---------- a sticker by a seat: what a player sent from their phone, or a computer player's own ----------
      // Every sticker is drawn the same size (the pack's unit: tools/stickers.py made all of them cover the same amount
      // of screen), by its sender's seat, with the sender's name under it. At the top and the bottom it stands beside the
      // seat's own tiles; at the sides, over the seat's own end of the table. So four at once never touch each other,
      // and the chain stays in sight. While a round's result covers the middle of the table they stand in the four
      // corners, left and right of it. Each one pops in, stays a little over three seconds, and goes.
      const SK = { pack: D.stickerPack(K.lang), at: new Map(), last: new Map(), next: 0, popAt: 0, botAt: 0, used: new Set() };
      // (as big as the table has room for: on a wide TV about a quarter of its height; the same for every sticker)
      const stkUnit = () => Math.max(92, Math.min(150, Math.max(V.W, V.H) * 0.135, Math.min(V.W, V.H) * 0.27));
      function stkSpot(p, w, bh) {
        const seat = g.seats[p], W = V.W, H = V.H;
        const cl = (v, lo, hi) => Math.max(lo, Math.min(Math.max(lo, hi), v));
        // (the result has the middle of the table: the corners beside it)
        if (V.panel) return { x: seat === 3 || seat === 0 ? 10 : W - w - 10, y: seat === 2 || seat === 3 ? 8 : H - bh - 8 };
        const e = seatEls[p], live = !!e && e.isConnected, fr = inFelt.getBoundingClientRect(), k = fr.width / (inFelt.offsetWidth || 1) || 1;
        // (a seat at the side: over its own tiles, under its picture and its name)
        if (seat === 1 || seat === 3) {
          let y = V.by + V.bh / 2 - bh / 2;
          const tl = live ? e.querySelector('[data-seat]') : null;
          if (tl && tl.offsetHeight > 0) y = (tl.getBoundingClientRect().top - fr.top) / k - 2;
          return { x: seat === 3 ? 8 : W - w - 8, y: cl(y, 6, H - bh - 6) };
        }
        // (the top or the bottom seat: beside its row when there is room, else in front of it, over the table's edge)
        let right = W / 2 + 150, cx = W / 2;
        if (live) {
          const kids = [].slice.call(e.children).filter(c => c.offsetWidth > 0 && getComputedStyle(c).position !== 'absolute'), a = kids[0], z = kids[kids.length - 1];
          if (a && z) { const l = (a.getBoundingClientRect().left - fr.left) / k, r = (z.getBoundingClientRect().right - fr.left) / k; right = r; cx = (l + r) / 2; }
        }
        if (right + 16 + w <= W - 8) return { x: right + 16, y: seat === 2 ? 6 : H - bh - 6 };
        return { x: cl(cx - w / 2, 8, W - w - 8), y: seat === 2 ? TH - 4 : H - TH - bh + 4 };
      }
      function placeStickers() {
        SK.at.forEach((it, p) => { const sp = stkSpot(p, it.w, it.bh); it.box.style.left = px(sp.x); it.box.style.top = px(sp.y); });
      }
      function dropSticker(p, it, atOnce) {
        clearTimeout(it.t); it.gone = true;
        if (SK.at.get(p) === it) SK.at.delete(p);
        if (atOnce) { it.box.remove(); return; }
        it.box.style.opacity = '0'; it.box.style.transform = 'scale(.8)';
        setTimeout(() => it.box.remove(), 280);
      }
      function showSticker(p, n) {
        const o = D.stickerOf(SK.pack, n);
        if (!o || p == null || p < 0 || p >= g.n || V.final || K.over()) return;
        const old = SK.at.get(p); if (old) dropSticker(p, old, true);
        const u = stkUnit(), box = h('div', 'position:absolute;left:0;top:0;opacity:0;transition:opacity .22s,transform .22s', stkLayer);
        const art = h('div', 'transform-origin:50% 62%', box), d = D.stickerImg(SK.pack, n, u, art), im = d.im;
        box.style.width = px(d.w);
        try { im.style.filter = 'drop-shadow(0 5px 7px rgba(0,0,0,.45))'; im.style.webkitFilter = 'drop-shadow(0 5px 7px rgba(0,0,0,.45))'; } catch (e) {}
        // (whose it is: their picture and their name, on their side's color)
        const tag = h('div', 'display:flex;justify-content:center;margin-top:4px', box);
        const pill = h('span', 'display:flex;align-items:center;max-width:' + px(Math.max(96, d.w)) + ';height:24px;box-sizing:border-box;padding:0 10px 0 3px;border-radius:12px;background:rgba(8,23,23,.86);box-shadow:inset 0 0 0 1.5px ' + D.RING[D.colOf(g.teams, p)] + ',0 3px 8px rgba(0,0,0,.4);font-size:12.5px;font-weight:600;color:' + CREAM + ';white-space:nowrap', tag);
        pill.appendChild(avatar(p, 18, 9));
        txt(h('span', 'margin-left:6px;min-width:0;overflow:hidden;text-overflow:ellipsis', pill, S.name(p)));
        const it = { n, box, w: d.w, bh: d.h + 28, t: 0, gone: false };
        SK.at.set(p, it);
        placeStickers();
        // (the picture first, so a sticker never pops in empty; and a beat apart when several come at the same moment)
        const go = () => {
          if (it.gone || it.t) return;
          it.t = setTimeout(() => {
            if (it.gone) return;
            box.style.opacity = '1'; art.style.animation = 'dmStkIn .45s cubic-bezier(.2,1.3,.4,1) both';
            const now = Date.now(); if (now - SK.popAt > 320) { SK.popAt = now; sfx('pop'); }
            // (from now on it glides when the table makes room for a result)
            setTimeout(() => { box.style.transition = 'opacity .22s,transform .22s,left .3s cubic-bezier(.2,.8,.2,1),top .3s cubic-bezier(.2,.8,.2,1)'; }, 80);
            it.t = setTimeout(() => dropSticker(p, it), 3300);
          }, Math.max(0, SK.next - Date.now()));
          SK.next = Math.max(Date.now(), SK.next) + 170;
        };
        im.onload = go; im.onerror = () => dropSticker(p, it, true);
        im.src = o.src;
        if (im.complete && im.naturalWidth) go();
        setTimeout(() => { if (!it.t && !it.gone) dropSticker(p, it, true); }, 5000);
      }
      // a computer player says something: in a game with stickers, one of them at the moments that matter (never two
      // close together, and not the same one again and again); otherwise its short line in a bubble
      function botSays(x) {
        const B = SK.pack ? D.STICKERS[SK.pack].bot : null;
        if (B && x.kind) {
          const end = g.phase === 'match';
          let kind = x.kind;
          if (kind === 'out') kind = end ? 'win' : g.round === 1 && Math.random() < 0.4 ? 'first' : 'out';
          else if (kind === 'mate' && end) kind = 'mateWin';
          else if (kind === 'foe' && end) kind = 'lose';
          const odds = { out: 0.85, first: 1, win: 1, mate: 0.8, mateWin: 1, foe: 0.65, lose: 0.9, pass: 0.22, lock: 1, locked: 0.6, slow: 1 }[kind] || 0;
          const big = kind === 'win' || kind === 'lose' || kind === 'mateWin' || kind === 'lock' || kind === 'first';
          const list = B[kind] || [], now = Date.now();
          if (list.length && Math.random() < odds && (big || now - SK.botAt > 7000)) {
            let pool = list.filter(n => !SK.used.has(n));
            if (!pool.length) { for (const n of list) SK.used.delete(n); pool = list.slice(); }
            const n = pool[Math.floor(Math.random() * pool.length)];
            SK.used.add(n); SK.botAt = now;
            return showSticker(x.p, n);
          }
          // (a pack with no sticker for "you are taking too long" says it in words, as a game without stickers does)
          if (kind === 'slow' && list.length) return;
        }
        if (x.text) bubble(x.p, T(x.text));
      }

      // ---------- what the phones hear ----------
      // Everyone hears the table (pub): the chain, how many tiles each seat holds, whose turn, the score, the looks.
      // Each player's own tiles go to their phone alone, sealed for it (me). A number on each lets a phone that missed
      // one ask for it again; the game says that number every few seconds.
      let pv = 0;
      const hv = new Array(g.n).fill(0);
      const handSig = new Array(g.n).fill('');
      const phaseName = () => (V.final ? 'final' : V.notice ? 'misdeal' : V.dealing ? 'deal' : V.lock ? 'lock' : g.phase);
      function pubNow() {
        const L = look(), r = g.result, over2 = !playing();
        return { k: 'dom', t: 'pub', v: pv, r: g.round, ph: phaseName(), mode: g.mode, n: g.n, tm: g.teams ? 1 : 0, tg: target, turn: g.turn,
          seats: seats.map((x, p) => ({ s: g.seats[p], id: x.bot ? '' : x.id, nm: S.name(p), bot: x.bot ? 1 : 0, av: x.bot ? x.av : ((K.player(x.id) || {}).av || 'boo:hi'), col: x.col, c: g.hands[p].length, away: !x.bot && !here(x.id) ? 1 : 0, said: g.said[p] ? 1 : 0 })),
          sc: g.scores, chain: g.chain, an: g.anchor || 0, last: g.last, mv: g.moves || 0, bone: g.bone.length, must: g.must,
          tl: V.timer ? { p: V.timer.p, sec: V.timer.sec, left: Math.max(0, Math.round(V.timer.end - K.now())) } : null,
          look: L, opt: { hints: s.hints !== false ? 1 : 0, rx: s.reactions !== false ? 1 : 0, ap: s.autoPass !== false ? 1 : 0, sk: SK.pack },
          res: over2 && r ? { kind: r.kind, p: r.p, team: r.team, points: r.points, min: r.min, hands: g.hands } : null,
          cnt: V.count, cof: V.countOf || 0, wh: V.waitHost ? 1 : 0, hv, host: K.hostId(), free: K.free ? 1 : 0, win: V.win || null };
      }
      function sayPub() { pv++; K.say(pubNow()); }
      function sayHand(p, force) {
        const x = seats[p];
        if (!x || x.bot) return;
        const sig = JSON.stringify(g.hands[p]);
        if (!force && sig === handSig[p]) return;
        if (sig !== handSig[p]) { handSig[p] = sig; hv[p]++; }
        K.box(x.id, { k: 'dom', t: 'me', hv: hv[p], p, r: g.round, hand: g.hands[p] });
      }
      function sayAll() { for (let p = 0; p < g.n; p++) sayHand(p, false); sayPub(); }
      function syncOne(id) {
        K.sayTo(id, pubNow());
        const p = seatOf(id);
        if (p >= 0) K.box(id, { k: 'dom', t: 'me', hv: hv[p], p, r: g.round, hand: g.hands[p] });
        else K.sayTo(id, { k: 'dom', t: 'me', hv: 0, p: -1, r: g.round, hand: [] });
      }
      (async () => { while (!K.over()) { await K.sleep(3000); if (K.over()) break; K.say({ k: 'dom', t: 'hb', v: pv, hv, r: g.round }); } })();

      // ---------- what the phones say ----------
      let wait = null, nextWait = null;
      K.on('dom', (m, pl) => {
        if (!m || typeof m.a !== 'string') return;
        const p = seatOf(pl.id);
        if (m.a === 'sync') return syncOne(pl.id);
        // (a sticker, or in a game without stickers a short line: from a player with a seat, one every four seconds at
        // the most, however fast their phone asks. The phone holds to four seconds; a little is allowed for the way.)
        if (m.a === 'stk' || m.a === 'react') {
          if (s.reactions === false || p < 0 || K.paused() || V.final) return;
          const i = Math.floor(+m.i), t0 = Date.now();
          if (t0 - (SK.last.get(pl.id) || 0) < 3600) return;
          if (m.a === 'stk') { if (!SK.pack || !D.stickerOf(SK.pack, i)) return; SK.last.set(pl.id, t0); showSticker(p, i); return; }
          if (SK.pack || !(i >= 0 && i < D.REACTS.length)) return;
          SK.last.set(pl.id, t0);
          bubble(p, T(D.REACTS[i]), 2800);
          sfx('pop');
          return;
        }
        if (m.a === 'next') { if (K.isHost(pl.id) && nextWait) nextWait(); return; }
        // (the moves of this round, for the host's phone alone: who played what, in order)
        if (m.a === 'log') { if (K.isHost(pl.id)) K.sayTo(pl.id, { k: 'dom', t: 'log', r: g.round, log: (g.log || []).slice(-80).map(e => ({ p: e.p, t: e.t || null, d: e.draw || 0, x: e.pass ? 1 : 0 })) }); return; }
        // (the host plays a turn for someone who is away from their phone)
        if (m.a === 'nudge') { if (K.isHost(pl.id) && wait && !K.paused()) wait.fin(D.ai(g, wait.p, 'normal')); return; }
        if (K.paused() || !wait || p !== wait.p || +m.r !== g.round) { if (p >= 0 && (m.a === 'play' || m.a === 'draw' || m.a === 'pass')) syncOne(pl.id); return; }
        const moves = D.legal(g, p);
        if (m.a === 'play') {
          const t = Array.isArray(m.t) ? m.t : [];
          const i = g.hands[p].findIndex(x => (x[0] === t[0] && x[1] === t[1]) || (x[0] === t[1] && x[1] === t[0]));
          const ok = moves.filter(x => x.i === i);
          if (i < 0 || !ok.length) return syncOne(pl.id);
          const side = ok.some(x => x.side === m.side) ? m.side : ok[0].side;
          return wait.fin({ play: [i, side] });
        }
        if (m.a === 'draw') { if (!moves.length && g.bone.length) wait.fin({ draw: 1 }); else syncOne(pl.id); return; }
        if (m.a === 'pass') { if (!moves.length && !g.bone.length) wait.fin({ pass: 1 }); else syncOne(pl.id); }
      });
      // (someone left, came back, joined, or changed their picture: the table shows it, and a phone that is back hears everything)
      K.onPlayers(() => { if (V.final) return; refresh(); for (const pl of K.players()) syncOne(pl.id); });
      // (the host changed a look in the middle of the match: the table wears it at once, and so do the phones)
      K.onSet(key => {
        if (V.final) return;
        if (key === 'bots') dressBots();
        boardSig = ''; pileSig = ''; V.sig = ''; fit();
        drawAll(true);
        sayPub();
      });

      // ---------- the kit keeps each player's points (the host can end the match early: the scores so far count) ----------
      function keepScores() { seats.forEach((x, p) => { if (x.bot) return; const pl = K.player(x.id); if (pl) pl.score = g.scores[D.teamOf(g, p)]; }); }
      function flush() {
        const evs = g.ev || []; g.ev = [];
        for (const k of evs) {
          if (k === 'win') { const r = g.result || {}; const humans = seats.some((x, p) => !x.bot && D.teamOf(g, p) === r.team); sfx(humans ? 'win' : 'lose'); }
          else sfx(k);
        }
        if (g.say) { if (s.reactions !== false) botSays(g.say); delete g.say; }
      }

      // ---------- a turn ----------
      function act(p, a) {
        if (a.play) D.play(g, p, a.play[0], a.play[1], target);
        else if (a.draw) D.draw(g, p);
        else D.pass(g, p, target);
      }
      // a person's turn: their phone plays, draws or passes. The computer does it for them when their time is up, when
      // their phone has been away for a moment, or (a pass that needs no choosing) by itself.
      // (the clock for a person's turn starts before the table and the phones are told whose turn it is, so both show it
      // from the first moment)
      function armTimer(p) {
        const m = (g.moves || 0) + '|' + g.passes;
        if (!V.timer || V.timer.p !== p || V.timer.r !== g.round || V.timer.m !== m) V.timer = { p, sec: turnSec, end: K.now() + turnSec * 1000, r: g.round, m, id: Date.now() };
      }
      function humanTurn(p) {
        return new Promise(res => {
          const offs = [];
          let done = false, awayAt = 0;
          const fin = a => { if (done) return; done = true; wait = null; for (const f of offs) { try { f(); } catch (e) {} } res(a); };
          wait = { p, fin };
          const moves = D.legal(g, p);
          if (!moves.length && !g.bone.length && s.autoPass !== false) offs.push(K.after(1100, () => fin({ pass: 1 })));
          // (for checking the table on this computer, with ?debug in the address: the people's turns play by themselves)
          if (s.dbgAuto && /[?&]debug\b/.test(location.search)) offs.push(K.after(+s.dbgAuto || 500, () => fin(D.ai(g, p, 'normal'))));
          if (turnSec) {
            // (the clock is for the whole turn: drawing a tile doesn't start it over)
            armTimer(p);
            const left = Math.max(300, V.timer.end - K.now());
            offs.push(K.after(left, () => fin(D.ai(g, p, 'normal'))));
            if (left > 3200) offs.push(K.after(left - 3000, () => { if (!done) P.sfx('tick'); }));
          }
          // (a person who takes a long time hears about it from a computer player: once a turn at the most, and never
          // more than once in a minute and a half, so someone who likes to think is not nagged all match long)
          let nagAt = K.now() + 20000 + Math.random() * 8000;
          (async () => {
            while (!done) {
              await K.sleep(500);
              if (done) return;
              if (K.over()) return fin({ over: 1 });
              const x = seats[p];
              if (!x.bot && here(x.id)) {
                awayAt = 0;
                if (nagAt && K.now() > nagAt && !K.paused()) {
                  nagAt = 0;
                  const bots = seats.filter(b => b.bot);
                  if (bots.length && s.reactions !== false && K.now() - (SK.nagAt || -1e9) > 90000 && Math.random() < 0.7) { SK.nagAt = K.now(); botSays({ p: bots[Math.floor(Math.random() * bots.length)].p, text: 'You are taking too long!', kind: 'slow' }); }
                }
                continue;
              }
              // (their phone is gone: after a few seconds the computer plays this turn, at its usual pace after that)
              if (!awayAt) { awayAt = K.now(); refresh(); sayPub(); }
              else if (K.now() - awayAt > (x.autoed ? thinkMs : 6000)) { x.autoed = true; return fin(D.ai(g, p, 'normal')); }
            }
          })();
        });
      }
      async function turn() {
        const p = g.turn, x = seats[p];
        if (x.bot) V.timer = null; else if (turnSec) armTimer(p);
        refresh(); sayAll();
        let a;
        if (x.bot) { await K.sleep(thinkMs); if (K.over()) return; a = D.ai(g, p, lvl); }
        else { a = await humanTurn(p); if (!a || a.over || K.over()) return; if (here(x.id)) x.autoed = false; }
        if (!a.draw) V.timer = null;
        act(p, a);
        keepScores();
        flush();
      }
      // ---------- the end of a round: the table shakes under the last tile, a locked game shows its lock, then the
      // result; the next round starts by itself after a count down, or when the host taps Next round ----------
      async function roundEnd() {
        const L = look();
        V.timer = null; wait = null;
        refresh(); sayAll();
        felt.style.animation = 'dmShake .5s ease-out';
        K.after(600, () => { felt.style.animation = 'none'; });
        const locker = g.lockNow; delete g.lockNow; delete g.ended;
        if (locker != null && L.lockFx !== 'off') {
          V.lock = { p: locker };
          if (L.lockFx !== 'banner') sfx(L.lockFx === 'gates' ? 'gate' : 'lock');
          drawLock(); sayPub();
          await K.sleep(2400);
          V.lock = null; drawLock();
          if (K.over()) return;
        }
        const match = g.phase === 'match';
        if (match || L.endFx === 'panel' || !g.result || g.result.team == null) V.panel = true; else V.fx = true;
        drawFx(); drawPanel(); refresh(); sayPub();
        if (match) { await K.sleep(7500); return; }
        // (the next round: by itself after the time the host set, or from the host's phone; either way the host can tap)
        let go = false;
        nextWait = () => { go = true; };
        if (autoNext) {
          V.countOf = autoNext; V.count = autoNext;
          drawNext(); sayPub();
          for (let n = autoNext; n > 0 && !go && !K.over(); n--) { V.count = n; drawNext(); sayPub(); await K.sleep(1000); }
        } else {
          V.waitHost = true; K.hostWait(true);
          drawNext(); sayPub();
          let k = 0;
          while (!go && !K.over()) { await K.sleep(400); if (++k % 12 === 0) { drawNext(); sayPub(); } }
          K.hostWait(false);
        }
        nextWait = null; V.count = null; V.countOf = 0; V.waitHost = false;
        V.fx = false; V.panel = false; drawFx(); drawPanel();
      }
      // ---------- a new round: the tiles are dealt (again, when someone's hand is a misdeal) ----------
      async function dealRound(starter) {
        seatNewcomers();
        D.deal(g, starter);
        for (;;) {
          flush();
          V.dealing = look().dealFx !== 'off'; V.chainN = 0; boardSig = ''; pileSig = '';
          V.bubbles.clear();
          drawAll(true); sayAll();
          if (V.dealing) {
            // (once the seats are drawn, the tiles fly to where they stand)
            await K.sleep(60);
            const ms = runDeal();
            if (ms) await K.sleep(ms);
            if (dealEl) { dealEl.remove(); dealEl = null; }
            if (K.over()) return;
          }
          const bad = D.misdeal(g);
          if (!bad) break;
          // (five doubles or more, or six tiles or more with the same number: the tiles are taken back and dealt again)
          sfx('knock');
          const nm = S.name(bad.p);
          V.notice = bad.kind === 'doubles' ? T('Misdeal: {name} holds {n} doubles. Dealing again.', { name: nm, n: bad.c }) : T('Misdeal: {name} holds {n} tiles with a {k}. Dealing again.', { name: nm, n: bad.c, k: bad.k });
          V.dealing = false;
          drawNotice(); drawHead(); sayPub();
          await K.sleep(2600);
          V.notice = ''; drawNotice();
          if (K.over()) return;
          g.round--;
          D.deal(g, g.dealArg == null ? -1 : g.dealArg);
        }
        g.fresh = false; V.dealing = false;
        boardSig = '';
        drawAll(true); sayAll();
      }

      // ---------- the match ----------
      fit();
      K.wait(T('Look at the TV!'));
      await dealRound(-1);
      while (!K.over()) {
        while (!K.over() && g.phase === 'play') await turn();
        if (K.over()) break;
        await roundEnd();
        if (K.over() || g.phase === 'match') break;
        await dealRound(g.nextStarter);
      }
      clearInterval(sizeT); removeEventListener('resize', onResize);
      keepScores();
      // (the host ended the match early: the kit shows its own winners, with the scores so far)
      if (K.over()) { document.body.classList.remove('dmn-on'); return null; }

      // ---------- the winners: on the table itself, with the score in ivory pips and the winners' pictures in gold ----------
      const wi = g.scores.findIndex(x => x >= target);
      const order = g.scores.map((sc, i) => i).sort((a, b) => (b === wi) - (a === wi) || g.scores[b] - g.scores[a]);
      V.final = true;
      V.win = { side: wi, order, sc: g.scores, names: g.scores.map((x, i) => S.sideName(i)), rounds: g.round };
      sayPub();
      K.snd.music('dWin' + (Math.random() < 0.5 ? 1 : 2), { fadeOut: 1.2, fadeIn: 0.3 });
      const refit = winners(K, { g, S, target, wi, order, cv, look: look(), avatar, rtl: rtl(), fitted: V });
      // (the kit tells every phone how it did: a winner's place is 1, on a team too)
      const rank = [];
      rank.places = new Map(); rank.of = order.length;
      order.forEach((i, at) => { for (const p of (g.teams ? [i, i + 2] : [i])) { const x = seats[p]; const pl = x.bot ? null : K.player(x.id); if (pl) { pl.score = g.scores[i]; rank.push(pl); rank.places.set(pl.id, at + 1); } } });
      // (someone who only watched: after everyone who played)
      for (const pl of K.players()) if (!rank.includes(pl)) { pl.score = 0; rank.push(pl); rank.places.set(pl.id, order.length); }
      rank.own = true;
      // (the table stays on the screen for the winners; the kit takes it away when the host starts something else)
      const off = setInterval(() => { if (!scr.isConnected) { clearInterval(off); document.body.classList.remove('dmn-on'); return; } if (fit()) refit(); }, 1500);
      return rank;
    }
  });

  // the winners' screen. Everything is the game's own: its felt and border, its gold, its tiles; the winning score is
  // written in ivory pips, the way the "Pips" round ending writes its numbers.
  function winners(K, o) {
    const g = o.g, S = o.S, cv = o.cv, L = o.look;
    cv.textContent = '';
    const outer = h('main', 'flex:1;min-height:0;position:relative', cv);
    outer.className = 'dmn-felt'; outer.dataset.table = L.table;
    const felt = D.clip(outer);
    felt.style.display = 'flex'; felt.style.flexDirection = 'column'; felt.style.alignItems = 'center'; felt.style.justifyContent = 'center';
    D.rim(outer, L.border, false);
    outer.style.margin = '10px';
    const box = h('div', 'position:relative;display:flex;flex-direction:column;align-items:center;max-width:92%;' + (o.rtl ? 'direction:rtl' : ''), felt);
    h('div', 'font-family:' + KUFI + ';font-weight:700;font-size:22px;color:' + GOLD + ';opacity:.9;animation:dmFxFade .6s both', box, T('Dominoes 151'));
    const wps = g.teams ? [o.wi, o.wi + 2] : [o.wi];
    const avs = h('div', 'display:flex;margin-top:48px;direction:ltr', box);
    wps.forEach((p, j) => {
      const w = h('div', 'position:relative;margin:0 14px;animation:dmFxPop .6s ' + (0.2 + j * 0.2) + 's both', avs);
      const a = o.avatar(p, 112, 46);
      a.style.boxShadow = '0 0 0 4px ' + GOLD + ',0 0 34px rgba(222,184,102,.75),0 10px 24px rgba(0,0,0,.5)';
      w.appendChild(a);
      h('div', 'position:absolute;left:50%;top:-33px;margin-left:-22px;width:44px;-webkit-filter:drop-shadow(0 3px 4px rgba(0,0,0,.45));filter:drop-shadow(0 3px 4px rgba(0,0,0,.45))', w).appendChild(D.crown(44));
    });
    h('div', 'margin-top:16px;font-family:' + KUFI + ';font-weight:700;font-size:50px;line-height:1.15;color:' + GOLD + ';text-align:center;text-shadow:0 4px 16px rgba(0,0,0,.5);animation:dmFxPop .6s .5s both', box, S.sideName(o.wi));
    h('div', 'margin-top:2px;font-size:20px;color:' + CREAM + ';animation:dmFxFade .6s .9s both', box, g.teams ? T('win the match!') : T('wins the match!'));
    // the winning score, in pips
    const F = { 0: ['.##.', '#..#', '#..#', '#..#', '.##.'], 1: ['..#.', '.##.', '..#.', '..#.', '.###'], 2: ['###.', '...#', '.##.', '#...', '####'], 3: ['###.', '...#', '.##.', '...#', '###.'], 4: ['#..#', '#..#', '####', '...#', '...#'], 5: ['####', '#...', '###.', '...#', '###.'], 6: ['.##.', '#...', '###.', '#..#', '.##.'], 7: ['####', '...#', '..#.', '.#..', '.#..'], 8: ['.##.', '#..#', '.##.', '#..#', '.##.'], 9: ['.##.', '#..#', '.###', '...#', '.##.'] };
    const digits = String(g.scores[o.wi]).split(''), tot = digits.length * 62 + (digits.length - 1) * 18;
    const pips = h('div', 'position:relative;margin-top:16px;width:' + tot + 'px;height:78px;direction:ltr', box);
    let di = 0;
    for (let rr = 0; rr < 5; rr++) digits.forEach((dg, k) => F[dg][rr].split('').forEach((ch, c) => { if (ch !== '#') return; const i = di++; h('div', 'position:absolute;left:' + (k * 80 + c * 16) + 'px;top:' + (rr * 16) + 'px;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fffdf7,#d9cba9);box-shadow:0 2px 3px rgba(0,0,0,.55);animation:' + (i % 2 ? 'dmFxR' : 'dmFxL') + ' .6s ' + (1 + i * 0.03).toFixed(2) + 's both', pips); }));
    // everyone else, and how the match went
    const rest = h('div', 'margin-top:20px;display:flex;flex-wrap:wrap;justify-content:center;animation:dmFxFade .6s 2s both', box);
    for (const i of o.order) {
      if (i === o.wi) continue;
      const c = h('div', 'display:flex;align-items:center;margin:4px 8px;padding:6px 14px;border-radius:20px;background:rgba(0,0,0,.3);box-shadow:inset 0 0 0 1px rgba(243,234,214,.18)', rest);
      const ps = g.teams ? [i, i + 2] : [i];
      ps.forEach((p, j) => { const a = o.avatar(p, 30, 13); if (j) a.style.marginLeft = '-9px'; c.appendChild(a); });
      h('span', 'margin:0 10px;font-size:16px;font-weight:600;white-space:nowrap', c, S.sideName(i));
      h('span', 'font-family:' + KUFI + ';font-weight:700;font-size:22px;color:' + CREAM, c, String(g.scores[i]));
    }
    h('div', 'margin-top:14px;font-size:15px;color:#bbd7d9;animation:dmFxFade .6s 2.3s both', box, T(g.round === 1 ? 'In 1 round' : 'In {n} rounds', { n: g.round }) + ' · ' + T('First to {n}', { n: o.target }));
    h('div', 'position:absolute;left:0;right:0;bottom:14px;text-align:center;font-size:14px;color:#bbd7d9;animation:dmFxFade .6s 3s both' + (o.rtl ? ';direction:rtl' : ''), felt, T('The host can play again, or pick another game.'));
    // (a row of tiles along the bottom corners, the double six among them)
    [[6, 6], [5, 1], [1, 1]].forEach((t, i) => { const e = D.tile(t, { set: L.tiles, size: 'hand', vert: true, k: 0.8 }); e.style.position = 'absolute'; e.style.left = (26 + i * 54) + 'px'; e.style.bottom = '34px'; e.style.transform = 'rotate(' + [-10, 3, 12][i] + 'deg)'; e.style.animation = 'dmDropA .5s ' + (2.4 + i * 0.15) + 's both'; felt.appendChild(e); });
    [[6, 5], [4, 4], [3, 2]].forEach((t, i) => { const e = D.tile(t, { set: L.tiles, size: 'hand', vert: true, k: 0.8 }); e.style.position = 'absolute'; e.style.right = (26 + i * 54) + 'px'; e.style.bottom = '34px'; e.style.transform = 'rotate(' + [10, -3, -12][i] + 'deg)'; e.style.animation = 'dmDropA .5s ' + (2.4 + i * 0.15) + 's both'; felt.appendChild(e); });
    // (it has to fit a small or a very wide screen whole)
    const refit = () => { box.style.transform = ''; const ah = felt.clientHeight - 60, bh = box.offsetHeight; if (bh > ah) box.style.transform = 'scale(' + Math.max(0.5, ah / bh).toFixed(3) + ')'; };
    refit();
    try { K.P.confetti(200); } catch (e) {}
    return refit;
  }
})();
