// Blokvane party games: Guess It Right! (تحدي - خمن صح). Someone or something from the Stories of the Prophets, in
// four clues; four answers, one right. The questions are the game's own (gir-data.js), each written in English and in
// Arabic, in four categories with a color each: Animals and Objects (red), the Prophets' Stories Encyclopedia (blue), A
// Prophet's Identity (green) and Characters (yellow). A spinning wheel can pick the category; teams can take turns,
// each with its own questions; each player has four helpers. The screens follow the game's own design (gir.css), and
// its music plays the whole time (sound.js): one tune in the lobby, two that take turns during the game, and one after.
(() => {
  'use strict';
  const P = BVPLAYC;
  const G = def => BVPLAY.game(def);
  const SRC = (document.currentScript && document.currentScript.src) || '';
  const BASE = SRC.replace(/[^/]*$/, '');
  const VER = (SRC.match(/[?&]v=(\w+)/) || [])[1] || '1';
  // ---------- the questions (gir-data.js, loaded once, as soon as the game is picked) ----------
  let bankP = null;
  function loadBank() {
    if (window.BVGIR) return Promise.resolve(window.BVGIR);
    if (!bankP) {
      bankP = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = BASE + 'gir-data.js?v=' + VER;
        s.onload = () => (window.BVGIR ? res(window.BVGIR) : rej(new Error('data')));
        s.onerror = () => { bankP = null; s.remove(); rej(new Error('load')); };
        document.head.appendChild(s);
      });
    }
    return bankP;
  }
  // the four categories, in the wheel's order (red on top, then clockwise: blue, green, yellow)
  const CATS = [
    { id: 'animals', c: '#ff5a6e', d: '#c22a40', name: 'Animals and Objects in the Stories of the Prophets', short: 'Animals and Objects' },
    { id: 'encyc', c: '#4c8dff', d: '#1d4fc4', name: 'Prophets\' Stories Encyclopedia', short: 'Prophets\' Stories Encyclopedia' },
    { id: 'prophet', c: '#34d399', d: '#109466', name: 'A Prophet\'s Identity', short: 'A Prophet\'s Identity' },
    { id: 'people', c: '#ffc93c', d: '#d08f12', name: 'Characters in the Stories of the Prophets', short: 'Characters in the Stories' }
  ];
  const catOf = key => CATS.findIndex(c => c.id === key);
  const LV = { easy: 1, medium: 2, hard: 3 };
  // (every screen remembers the questions it has asked, and asks the others first)
  const ASKED = 'bvplay:gir:asked';
  const askedList = () => { try { return (localStorage.getItem(ASKED) || '').split(',').filter(Boolean); } catch (e) { return []; } };
  function markAsked(id) { try { const l = askedList().filter(x => x !== id); l.push(id); localStorage.setItem(ASKED, l.slice(-3000).join(',')); } catch (e) {} }
  // one question at a time: that category (or any), that level (or the nearest one), one this screen hasn't asked yet,
  // never the same one twice in a game. "Any" changes category each time, so they keep coming from all four.
  function picker(pool) {
    const rank = new Map(askedList().map((id, i) => [id, i]));
    const used = new Set(), usedAns = new Set();
    let last = -1;
    // (the same answer only once in a game while there are others: Moses, Jesus or the she-camel don't come back twice)
    const ansKey = q => String(q.en[2][q.ok] || '').toLowerCase().replace(/\(.*?\)|\bprophet\b|\bthe\b/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
    const free = (cat, lv) => pool.filter(q => !used.has(q.id) && (cat < 0 || q.cat === cat) && (!lv || q.lv === lv));
    function from(list, strict) {
      if (strict) list = list.filter(q => !usedAns.has(ansKey(q)));
      if (!list.length) return null;
      const fresh = list.filter(q => !rank.has(q.id));
      if (fresh.length) return P.pick(fresh);
      list.sort((a, b) => rank.get(a.id) - rank.get(b.id));
      return P.pick(list.slice(0, Math.max(1, Math.ceil(list.length / 4))));
    }
    const keep = q => { used.add(q.id); usedAns.add(ansKey(q)); last = q.cat; return q; };
    const near = lv => (lv === 1 ? [1, 2, 3] : lv === 2 ? [2, 1, 3] : lv === 3 ? [3, 2, 1] : [0]);
    function take(cat, lv) {
      let c = cat;
      if (c < 0) {
        const have = CATS.map((x, i) => i).filter(i => free(i, 0).length);
        const opts = have.filter(i => i !== last);
        c = (opts.length ? P.pick(opts) : have.length ? have[0] : -1);
      }
      for (const strict of [true, false]) for (const l of near(lv)) { const q = from(free(c, l), strict); if (q) return keep(q); }
      // (that category ran out: another one)
      if (c >= 0) for (const strict of [true, false]) for (const l of near(lv)) { const q = from(free(-1, l), strict); if (q) return keep(q); }
      return null;
    }
    return { take, left: cat => free(cat, 0).length };
  }
  // which third of the game a question is in: easy, medium, then hard (or one level only)
  function stageLv(i, n, level) {
    if (LV[level]) return LV[level];
    const e = Math.ceil(n / 3), h = Math.floor(n / 3), m = n - e - h;
    return i < e ? 1 : i < e + m ? 2 : 3;
  }

  // ---------- the game's modes ----------
  const MODES = [
    ['most', 'Most correct', 'Everyone answers every question. The most right answers wins.'],
    ['clues', 'Clue by clue', 'The clues show one at a time. Answer early for more points: 100 with one clue, down to 25 with all four.'],
    ['turns', 'Team turns', 'Teams take turns: each question goes to one team, and every team gets the same number of questions.'],
    ['spin', 'Team spin', 'Teams take turns, and the team whose turn it is spins the wheel for every question.'],
    ['knockout', 'Knockout', 'One wrong answer and you are out. The last one standing wins.'],
    ['lives', '3 lives', 'Like Knockout, but you can miss twice. The third miss puts you out.'],
    ['race', 'Race to a number', 'The first player to get that many right wins.'],
    ['first', 'First right takes the points', 'Only the fastest right answer scores.']
  ];
  const TEAMED = m => m === 'turns' || m === 'spin';
  const ELIM = m => m === 'knockout' || m === 'lives';
  // (the helpers: each player has each one once. The fourth doubles the points, or, where points don't decide the
  // winner, keeps you in the game once)
  const helpSet = mode => [['fifty', '✂️'], ['hint', '💡'], ['auto', '🪄'], ['boost', ELIM(mode) ? '🛡️' : '×2']];
  const boostName = mode => (ELIM(mode) ? 'Shield' : 'Double points');
  // our own rules: how to play, for the settings picked (the TV shows them before the first question, the phones in the
  // lobby). Each line: [emoji, text].
  function howto(s) {
    const mode = s.mode || 'most', wheel = mode === 'spin' || (s.cat === 'mix' && s.wheel !== 'off');
    const out = [['🔎', 'Four clues show on the TV about someone or something from the Stories of the Prophets.'],
      ['📱', +s.sec ? 'Pick the right answer on your phone before the time runs out.' : 'Pick the right answer on your phone. There is no clock: the question waits for everyone.']];
    if (mode === 'clues') out.push(['⏳', 'The clues come one at a time. The sooner you answer, the more points: 100, 75, 50, then 25.']);
    else if (TEAMED(mode)) out.push(['👥', 'Teams take turns. On your team\'s turn, everyone on it answers; the answer most of you pick counts for the team.']);
    else if (mode === 'knockout') out.push(['⚔️', 'One wrong answer and you are out. If everyone misses, nobody goes out.']);
    else if (mode === 'lives') out.push(['❤️', 'Everyone has 3 hearts. A wrong answer costs one; no hearts left and you are out.']);
    else if (mode === 'race') out.push(['🏁', 'The first one to reach the number of right answers wins.']);
    else if (mode === 'first') out.push(['⚡', 'Only the fastest right answer scores the points.']);
    else out.push(['✅', s.speed ? 'Faster right answers score more' : 'Every right answer scores 100 points.']);
    if (wheel) out.push(['🎡', mode === 'spin' ? 'Before each question, the team whose turn it is spins the wheel on their phone: its color picks the category.' : 'The wheel picks the category by its color: red, blue, green or yellow.']);
    if (s.helpers !== false) out.push(['💡', ELIM(mode) ? 'Each helper works once: remove two wrong answers, a hint, answer it for me, and a shield that keeps you in once.' : 'Each helper works once: remove two wrong answers, a hint, answer it for me, and double points.']);
    out.push(['🏆', ELIM(mode) ? 'The last one standing wins.' : mode === 'race' ? 'The first to get there wins.' : TEAMED(mode) || s.teams ? 'The team with the most points wins.' : 'The most points wins.']);
    return out;
  }

  // ---------- a little drawing kit ----------
  const SVG = 'http://www.w3.org/2000/svg';
  // an eight-pointed star (the game's ornament): its points, centered on cx, cy
  function star8(cx, cy, r1, r2) { const p = []; for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i * Math.PI / 8, r = i % 2 ? r2 : r1; p.push((cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2)); } return 'M' + p.join('L') + 'Z'; }
  const starSvg = (cls, fill) => '<svg class="' + cls + '" viewBox="0 0 40 40" aria-hidden="true"><path d="' + star8(20, 20, 19, 12.5) + '" fill="' + (fill || 'currentColor') + '"/><circle cx="20" cy="20" r="5.2" fill="#1d1050"/><circle cx="20" cy="20" r="2.6" fill="' + (fill || 'currentColor') + '"/></svg>';
  // the spinning wheel, drawn the way the game's design has it: four colors, a gold rim with lights, Boo in the middle
  function wheelSvg() {
    const seg = (i, col, deep) => {
      const a0 = (-135 + i * 90) * Math.PI / 180, a1 = (-45 + i * 90) * Math.PI / 180, r = 360;
      const x0 = 450 + r * Math.cos(a0), y0 = 450 + r * Math.sin(a0), x1 = 450 + r * Math.cos(a1), y1 = 450 + r * Math.sin(a1);
      const mid = (-90 + i * 90) * Math.PI / 180, fx = 450 + 180 * Math.cos(mid), fy = 450 + 180 * Math.sin(mid);
      const sx = 450 + 230.4 * Math.cos(mid), sy = 450 + 230.4 * Math.sin(mid);
      const dots = [-0.38, 0, 0.38].map(k => { const a = mid + k * 0.42, rr = k ? 312 : 324; return '<circle cx="' + (450 + rr * Math.cos(a)).toFixed(1) + '" cy="' + (450 + rr * Math.sin(a)).toFixed(1) + '" r="4.5" fill="#fff" fill-opacity=".45"/>'; }).join('');
      return '<radialGradient id="gs' + i + '" gradientUnits="userSpaceOnUse" cx="450" cy="450" r="360" fx="' + fx.toFixed(1) + '" fy="' + fy.toFixed(1) + '"><stop offset="0" stop-color="' + col + '"/><stop offset=".75" stop-color="' + col + '"/><stop offset="1" stop-color="' + deep + '"/></radialGradient>' +
        '<path d="M450 450L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A360 360 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'Z" fill="url(#gs' + i + ')"/>' +
        '<path d="' + star8(sx, sy, 46, 26) + '" fill="#fff" fill-opacity=".2" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><path d="' + star8(sx, sy, 26, 17) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/><circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="7" fill="#fff" fill-opacity=".65"/>' + dots;
    };
    let defs = '', body = '';
    CATS.forEach((c, i) => { const s = seg(i, c.c, c.d); const k = s.indexOf('</radialGradient>') + 17; defs += s.slice(0, k); body += s.slice(k); });
    let rays = '';
    for (const a of [-135, -45, 45, 135]) { const t = a * Math.PI / 180, x = 450 + 360 * Math.cos(t), y = 450 + 360 * Math.sin(t); rays += '<path d="M450 450L' + x.toFixed(2) + ' ' + y.toFixed(2) + '" stroke="#1a0e3e" stroke-width="8" stroke-opacity=".5"/><path d="M450 450L' + x.toFixed(2) + ' ' + y.toFixed(2) + '" stroke="url(#wg)" stroke-width="4"/>'; }
    let bulbs = '';
    for (let i = 0; i < 32; i++) { const t = i * Math.PI / 16, x = 450 + 398 * Math.cos(t), y = 450 + 398 * Math.sin(t); bulbs += '<g class="bulb ' + (i % 2 ? 'b1' : 'b0') + '"><circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="14" fill="url(#halo)" class="h"/><circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="7.5" fill="#5a3a08"/><circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="6" fill="url(#bulb)" class="l"/></g>'; }
    const grads = '<linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c4"/><stop offset=".35" stop-color="#ffc93c"/><stop offset=".7" stop-color="#b9771a"/><stop offset="1" stop-color="#ffe08a"/></linearGradient>' +
      '<linearGradient id="wg2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4c4"/><stop offset=".5" stop-color="#d89a2a"/><stop offset="1" stop-color="#8a5410"/></linearGradient>' +
      '<radialGradient id="shine" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".92" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>' +
      '<linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="bulb"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#fff3c0"/><stop offset="1" stop-color="#ffb31f"/></radialGradient>' +
      '<radialGradient id="halo"><stop offset="0" stop-color="#ffe08a" stop-opacity=".9"/><stop offset="1" stop-color="#ffc93c" stop-opacity="0"/></radialGradient>';
    const hub = '<svg class="gw-hub" viewBox="0 0 200 200"><path d="' + star8(100, 100, 85, 66).replace(/^M/, 'M') + '" fill="url(#wg)" stroke="#5a3a08" stroke-width="2"/><path d="' + star8(100, 100, 72, 58) + '" fill="none" stroke="#fff4c4" stroke-opacity=".7" stroke-width="1.5"/><circle cx="100" cy="100" r="58" fill="#1d1050" stroke="url(#wg2)" stroke-width="6"/><circle cx="100" cy="100" r="48" fill="none" stroke="#ffc93c" stroke-opacity=".5" stroke-width="1" stroke-dasharray="2 4"/></svg>' +
      '<svg class="gw-boo" viewBox="0 0 60 60"><path d="M14 22C14 3 46 3 46 22V46.8Q46 50 42.5 50Q39 50 39 46.8A3.25 2.8 0 0 0 32.5 46.8Q32.5 50 29.25 50Q26 50 26 46.8A2.75 2.8 0 0 0 20.5 46.8Q20.5 50 17.25 50Q14 50 14 46.8Z" fill="#fff"/><ellipse cx="23.6" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><ellipse cx="35.4" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><circle cx="23.9" cy="22.6" r="1.3" fill="#fff"/><circle cx="35.7" cy="22.6" r="1.3" fill="#fff"/></svg>';
    const pin = '<svg class="gw-pin" viewBox="0 0 110 140"><path d="M55 136C40 100 14 80 14 50C14 22 32 6 55 6C78 6 96 22 96 50C96 80 70 100 55 136Z" fill="url(#wg)" stroke="#5a3a08" stroke-width="2.5"/><path d="M55 116C44 92 26 76 26 52C26 30 39 18 55 18C71 18 84 30 84 52C84 76 66 92 55 116Z" fill="#c2306e"/><path d="' + star8(55, 50, 18, 9.5) + '" fill="url(#wg)"/><circle cx="55" cy="50" r="5" fill="#c2306e"/></svg>';
    return '<div class="gw-glow"></div><div class="gw-turn"><svg viewBox="0 0 900 900"><defs>' + grads + defs + '</defs>' + body + '<circle cx="450" cy="450" r="360" fill="url(#shine)"/>' + rays + '</svg></div>' +
      '<svg class="gw-rim" viewBox="0 0 900 900"><defs>' + grads + '</defs><circle cx="450" cy="450" r="420" fill="none" stroke="#0a0620" stroke-width="10" stroke-opacity=".6"/><circle cx="450" cy="450" r="398" fill="none" stroke="url(#wg2)" stroke-width="44"/><circle cx="450" cy="450" r="398" fill="none" stroke="#2a1660" stroke-width="30"/><circle cx="450" cy="450" r="419" fill="none" stroke="url(#wg)" stroke-width="3"/><circle cx="450" cy="450" r="377" fill="none" stroke="url(#wg)" stroke-width="3"/><circle cx="450" cy="450" r="366" fill="none" stroke="url(#wg2)" stroke-width="12"/><circle cx="450" cy="450" r="360" fill="none" stroke="#1a0e3e" stroke-width="2"/>' + bulbs + '<path d="M90 450A360 360 0 0 1 810 450A432 324 0 0 0 90 450Z" fill="url(#gloss)" opacity=".7"/></svg>' + hub + pin;
  }

  // ---------- the screens ----------
  const div = (K, cls, parent, text) => K.el('div', cls, parent, text);
  const SCORE_STAR = '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="' + star8(20, 20, 19.5, 15.5) + '" fill="#ffc93c" stroke="#8a5410" stroke-width=".8"/><circle cx="20" cy="20" r="13" fill="#1d1050" stroke="#ffe08a" stroke-width=".9"/></svg>';
  // the scoreboard on the side of a question: players (or teams), each with a face and points in a gold star
  function sideBoard(K, parent, o) {
    const b = div(K, 'gq-side', parent);
    const hd = div(K, 'gq-sbh', b); K.el('i', '', hd); K.el('b', '', hd, o.title);
    const list = div(K, 'gq-rows', b);
    const rows = new Map();
    const teams = o.teams;
    const count = teams ? teams.length : K.players().length;
    list.classList.add(count <= 6 ? 'big' : count <= 12 ? 'mid' : count <= 24 ? 'two' : 'three');
    b.classList.toggle('many', count > 6);
    const row = (id, color, name, avatars) => {
      let r = rows.get(id);
      if (r) return r;
      r = div(K, 'gq-p', list);
      r.style.setProperty('--pc', color);
      const av = div(K, 'av', r);
      if (avatars.length === 1) { const im = K.el('img', '', av); im.src = avatars[0]; im.alt = ''; }
      else { av.classList.add('team'); for (const a of avatars.slice(0, 4)) { const im = K.el('img', '', av); im.src = a; im.alt = ''; } }
      K.el('i', 'ok', av, '✓');
      K.el('b', '', r, name);
      r._h = K.el('span', 'hearts', r);
      const st = div(K, 'sc', r); st.innerHTML = SCORE_STAR; r._pts = K.el('span', '', st);
      rows.set(id, r);
      return r;
    };
    const draw = (answered, res) => {
      if (teams) {
        const tp = t => (o.teamPts && t[0] in o.teamPts ? o.teamPts[t[0]] : K.players().filter(p => p.team === t[0]).reduce((n, p) => n + p.score, 0));
        const list2 = teams.slice().sort((a, c) => tp(c) - tp(a));
        for (const t of list2) {
          const mem = K.players().filter(p => p.team === t[0]);
          const r = row('t-' + t[0], t[2], t[4] || t[3], mem.length ? mem.map(p => K.avatarUrl(p)) : [P.booUri('boo:party')]);
          list.appendChild(r);
          r._pts.textContent = K.num(tp(t));
          r.classList.toggle('turn', !!(o.turn && o.turn[0] === t[0]));
          const asked = mem.filter(p => !p.out && !p.away);
          r.classList.toggle('done', !!(answered && asked.length && asked.every(p => answered.has(p.id))));
          r.classList.remove('right', 'miss');
          if (res && res.has('t-' + t[0])) r.classList.add(res.get('t-' + t[0]));
        }
        return;
      }
      const ps = K.players().slice().sort((a, c) => (c.score - a.score) || ((a.out ? 1 : 0) - (c.out ? 1 : 0)));
      for (const [id, r] of rows) if (!ps.some(p => p.id === id)) { r.remove(); rows.delete(id); }
      for (const p of ps) {
        const r = row(p.id, p.color, p.name, [K.avatarUrl(p)]);
        list.appendChild(r);
        r._pts.textContent = K.num(p.score);
        r._h.textContent = o.lives ? '♥'.repeat(Math.max(0, p.lives)) : '';
        r.classList.toggle('done', !!(answered && answered.has(p.id)));
        r.classList.toggle('out', !!p.out);
        r.classList.remove('right', 'miss');
        if (res && res.has(p.id)) r.classList.add(res.get(p.id));
      }
    };
    draw(new Set());
    // (Boo sits under the scoreboard, as in the design)
    div(K, 'gq-boo boo-slot', b);
    return { node: b, draw };
  }
  // the question: the top (which question, the progress, the points, the clock), the scoreboard, the title, the four
  // clues and the four answers
  async function qView(K, o) {
    const body = K.view(null);
    body.classList.add('gq');
    if (o.mode === 'clues') body.classList.add('cluemode');
    const top = div(K, 'gq-top', body);
    const num = div(K, 'gq-num', top);
    const bi = K.el('img', '', num); bi.src = P.booUri('boo:hi'); bi.alt = '';
    K.el('b', '', num, o.total ? await K.tr('Question {n}/{total}', { n: K.num(o.num), total: K.num(o.total) }) : await K.tr('Question {n}', { n: K.num(o.num) }));
    const prog = div(K, 'gq-prog', top);
    const N = Math.max(1, Math.min(o.total || o.goal || 10, 15)), cur = Math.min(N - 1, Math.floor((o.num - 1) * N / Math.max(1, o.total || o.goal || 10)));
    for (let k = 0; k < N; k++) {
      if (k) K.el('i', 'ln' + (k <= cur ? ' on' : ''), prog);
      const n = div(K, 'nd' + (k < cur ? ' past' : k === cur ? ' now' : ''), prog); n.innerHTML = starSvg('', 'currentColor');
    }
    const pts = div(K, 'gq-pts', top);
    // (knockout and 3 lives: the points don't decide anything, so they don't show)
    if (ELIM(o.mode)) pts.hidden = true;
    const ptsT = K.el('b', '', pts, '');
    const tw = div(K, 'gq-clock', top);
    let ring = null, inf = null;
    if (o.sec) ring = K.ring(tw, o.sec, true); else inf = K.el('span', 'inf', tw, '∞');
    const mid = div(K, 'gq-mid', body);
    const main = div(K, 'gq-main', mid);
    const board = sideBoard(K, mid, { title: await K.tr('Scoreboard'), teams: o.teams, teamPts: o.teamPts, turn: o.turn, lives: o.mode === 'lives' });
    // (the title, in its banner; above it the category, and on a team's turn, the team)
    const tb = div(K, 'gq-title', main);
    tb.style.setProperty('--cc', CATS[o.q.cat].c);
    const tags = div(K, 'gq-tags', tb);
    const ct = K.el('span', 'cat', tags, await K.tr(CATS[o.q.cat].short)); ct.style.setProperty('--cc', CATS[o.q.cat].c);
    if (o.turn) { const tt = K.el('span', 'turn', tags, await K.tr('{team}\'s turn', { team: await K.tr(o.turn[3]) })); tt.style.setProperty('--tc', o.turn[2]); }
    for (const k of ['a', 'b']) { const m = div(K, 'med ' + k, tb); m.innerHTML = starSvg('', '#ffc93c'); }
    const tt2 = K.el('span', 'tt', tb, o.text.title);
    if ([...o.text.title].length > 26) tt2.classList.add('long');
    K.el('div', 'gq-lbl c', main, await K.tr('The four clues:'));
    const cg = div(K, 'gq-clues', main);
    const clues = o.text.clues.map((c, i) => { const x = div(K, 'gq-clue pre n' + (i + 1), cg); K.el('b', '', x, K.num(i + 1)); const sp = K.el('span', '', x, c); if ([...c].length > 70) x.classList.add('long'); void sp; return x; });
    K.el('div', 'gq-lbl a', main, await K.tr('Choose the right answer:'));
    const ag = div(K, 'gq-ans', main);
    const LET = BVI18N.letters(K.lang);
    const cells = o.opts.map((t, i) => {
      const a = div(K, 'gq-a pre ' + 'ABCD'[i], ag);
      const dot = div(K, 'dot', a); K.el('b', '', dot, LET[i] || 'ABCD'[i]);
      const sp = K.el('span', 't', a, t); if ([...t].length > 26) a.classList.add('long'); void sp;
      return { node: a, who: K.el('span', 'who', a) };
    });
    const fx = div(K, 'gq-fx', main);
    fitQ(body, main);
    K.boo('hi');
    return {
      body, main, board, ring, inf, cells, clues, fx, clock: tw,
      setPts(n) { ptsT.textContent = n; pts.classList.remove('bump'); void pts.offsetWidth; pts.classList.add('bump'); },
      async showClue(i) { const c = clues[i]; if (!c) return; c.classList.remove('pre'); c.classList.add('pop'); },
      async showAnswers(gap) { for (const c of cells) { if (K.over()) break; c.node.classList.remove('pre'); c.node.classList.add('pop'); await K.sleep(gap); } }
    };
  }
  // (everything on one screen: a short screen, or long clues, get a little smaller until it fits)
  function fitQ(body, main) {
    const over = () => main.scrollHeight > main.clientHeight + 1;
    for (const k of ['f1', 'f2', 'f3']) { if (!over()) return; body.classList.add(k); }
  }
  // who picked an answer: their faces on it (up to 5, then "+12")
  function showWho(K, cell, ids) {
    const ps = ids.map(id => K.player(id)).filter(Boolean);
    for (const p of ps.slice(0, ps.length > 6 ? 5 : 6)) { const im = K.el('img', '', cell.who); im.src = K.avatarUrl(p); im.alt = ''; }
    if (ps.length > 6) K.el('i', '', cell.who, '+' + K.num(ps.length - 5));
  }
  // before each question: which one it is, big, with its category (and the team whose turn it is)
  async function intro(K, o) {
    const body = K.view(null);
    body.classList.add('gi');
    if (o.big || o.last) div(K, 'gi-rays', body);
    const box = div(K, 'gi-box' + (o.big ? ' big' : '') + (o.last ? ' fin' : ''), body);
    const med = div(K, 'gi-med', box);
    med.innerHTML = '<svg viewBox="0 0 200 200"><path d="' + star8(100, 100, 96, 74) + '" fill="url(#giG)" stroke="#5a3a08" stroke-width="2"/><path d="' + star8(100, 100, 82, 64) + '" fill="none" stroke="#fff4c4" stroke-opacity=".7" stroke-width="1.5"/><circle cx="100" cy="100" r="62" fill="#1d1050"/><defs><linearGradient id="giG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c4"/><stop offset=".4" stop-color="#ffc93c"/><stop offset=".75" stop-color="#b9771a"/><stop offset="1" stop-color="#ffe08a"/></linearGradient></defs></svg>';
    K.el('b', '', med, K.num(o.num));
    K.el('div', 'gi-t', box, o.total ? await K.tr('Question {n} / {total}', { n: K.num(o.num), total: K.num(o.total) }) : await K.tr('Question {n}', { n: K.num(o.num) }));
    const c = K.el('div', 'gi-c', box, await K.tr(CATS[o.cat].name)); c.style.setProperty('--cc', CATS[o.cat].c);
    if (o.turn) { const t = K.el('div', 'gi-turn', box, await K.tr('{team}\'s turn', { team: await K.tr(o.turn[3]) })); t.style.setProperty('--tc', o.turn[2]); }
    if (o.last) K.el('div', 'gi-rib', box, await K.tr(o.race ? 'One more right answer wins!' : o.last === 1 ? 'Last question!' : 'Last 2 questions!'));
  }
  // how to play, our own rules, before the first question
  async function rulesScreen(K, s, secs) {
    const body = K.view(null);
    body.classList.add('gr');
    const box = div(K, 'gr-box', body);
    const hd = div(K, 'gr-hd', box);
    const im = K.el('img', '', hd); im.src = 'icons/gir.webp'; im.alt = '';
    K.el('h1', '', hd, await K.tr('How to play'));
    const ul = div(K, 'gr-list', box);
    const lines = howto(s);
    for (let i = 0; i < lines.length; i++) { const r = div(K, 'gr-r', ul); r.style.animationDelay = (0.25 + i * 0.35) + 's'; K.el('i', '', r, lines[i][0]); K.el('span', '', r, await K.tr(lines[i][1])); }
    // (the four colors, when the wheel or the categories matter)
    const leg = div(K, 'gr-leg', box);
    for (const c of CATS) { const x = div(K, 'gr-c', leg); x.style.setProperty('--cc', c.c); K.el('i', '', x); K.el('span', '', x, await K.tr(c.short)); }
    const bar = div(K, 'gr-bar', box); const fill = K.el('i', '', bar); fill.style.animationDuration = secs + 's';
  }
  // the wheel: it spins (from a phone, or by itself), the pointer lands on a color, and that's the category
  async function wheel(K, o) {
    const body = K.view(null);
    body.classList.add('gw');
    const side = div(K, 'gw-side', body);
    K.el('h1', '', side, await K.tr('Spin the wheel!'));
    const st = K.el('p', 'gw-st', side, o.who ? await K.tr(o.whoText, o.whoVars) : await K.tr('The wheel picks the category.'));
    const leg = div(K, 'gw-leg', side);
    const chips = CATS.map((c, i) => { const x = div(K, 'gw-c' + (o.ok.includes(i) ? '' : ' off'), leg); x.style.setProperty('--cc', c.c); K.el('i', '', x); K.el('span', '', x, ''); return x; });
    for (let i = 0; i < CATS.length; i++) chips[i].lastChild.textContent = await K.tr(CATS[i].name);
    const wb = div(K, 'gw-wheel', body);
    wb.innerHTML = wheelSvg();
    const turn = wb.querySelector('.gw-turn');
    // the lights take turns, like in the design: slowly while it waits, fast while it spins
    let on = 0;
    const blink = setInterval(() => { on ^= 1; wb.classList.toggle('alt', !!on); }, 600);
    // (who spins: their phone gets a big Spin button; nobody taps in 12 seconds, and it spins by itself)
    let spun = false;
    if (o.who && o.who.length) {
      const got = await K.ask({ kind: 'spin', prompt: '', sec: 12, who: o.who, extra: { gir: 1, sl: 'Spin the wheel!', wt: o.wt || null }, onAns: () => { if (!spun) { spun = true; K.close(K.qn()); } } });
      const first = [...got.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (first && K.player(first[0])) st.textContent = await K.tr('{name} spins!', { name: '⁨' + K.player(first[0]).name + '⁩' });
      else st.textContent = await K.tr('Spinning...');
    } else { await K.sleep(1600); st.textContent = await K.tr('Spinning...'); }
    if (K.over()) { clearInterval(blink); return o.ok[0]; }
    K.wait();
    // (it lands on a category that still has questions)
    const pick = P.pick(o.ok);
    const off = (360 - pick * 90) % 360;
    const deg = 360 * 6 + off + (Math.random() - 0.5) * 50;
    clearInterval(blink);
    wb.classList.add('spin');
    const fast = setInterval(() => { on ^= 1; wb.classList.toggle('alt', !!on); }, 120);
    turn.style.transition = 'transform 6s cubic-bezier(.12,.72,.08,1)';
    requestAnimationFrame(() => { turn.style.transform = 'rotate(' + deg + 'deg)'; });
    K.snd.fx('gSpin', { duck: 0.45 });
    await K.sleep(6100);
    clearInterval(fast);
    wb.classList.remove('spin'); wb.classList.add('landed');
    chips.forEach((c, i) => c.classList.toggle('win', i === pick));
    st.textContent = '';
    const res = K.el('div', 'gw-res', side, await K.tr(CATS[pick].name)); res.style.setProperty('--cc', CATS[pick].c);
    await K.sleep(2600);
    return pick;
  }

  // =====================================================================
  // Guess It Right!
  // =====================================================================
  let teamPts = {};
  G({
    id: 'gir', name: 'Guess It Right!', emoji: '❓', sub: 'Guess on your phone, see who got it right on the TV.', teams: true, teamsWin: true,
    step: ['Send your guess', 'Pick the right answer on your phone before the time runs out.'], deco: 'gir',
    // only in English and in Arabic: the screen and the phones (each player can pick the other one for their phone)
    langs: ['en', 'ar'], mlang: true,
    // its own music: one tune in the lobby, two that take turns during the game, and one after it (and in the lobby
    // when a game was played); its own sounds for each moment
    sounds: ['gNext', 'gEvery5', 'gCorrect', 'gWrong', 'gTimesup', 'gWin', 'gSpin', 'gLand', 'gTick', 'gTheme'],
    music: { lobby: 'gTheme', again: 'gAfter', after: 'gAfter', afterDelay: 11.5, win: 'gWin' },
    prep: () => { loadBank().catch(() => {}); },
    teamsOn: s => s.mode !== 'race',
    teamsForce: s => TEAMED(s.mode),
    teamScore: () => teamPts,
    winK: teamMode => (teamMode ? 'The winning team is' : 'The winner is'),
    winLine: p => (String(p.id).startsWith('team-') || p.score !== (p.right || 0) * 100 ? ['{n} points', { n: p.score }] : ['{n} correct', { n: p.right || 0 }]),
    winDeco: (cv, el) => {
      cv.classList.add('g-win');
      const lan = el('div', 'g-lanterns', cv);
      for (const k of ['a', 'b', 'c', 'd']) {
        const l = el('div', 'g-lan ' + k, lan);
        l.innerHTML = '<svg viewBox="0 0 60 150"><line x1="30" y1="0" x2="30" y2="34" stroke="#d89a2a" stroke-width="2"/><circle cx="30" cy="38" r="5" fill="none" stroke="#ffc93c" stroke-width="2.4"/><path d="M18 46h24l4 10H14z" fill="#d89a2a"/><path d="M14 56h32l6 18-6 30H14L8 74z" fill="url(#lanG)" stroke="#8a5410" stroke-width="1.6"/><path d="M30 58v44M20 60l-5 14 5 28M40 60l5 14-5 28" stroke="#fff4c4" stroke-opacity=".55" stroke-width="1.2" fill="none"/><path d="M14 104h32l-4 9H18z" fill="#d89a2a"/><circle cx="30" cy="121" r="3" fill="#ffc93c"/><path d="' + star8(30, 80, 7, 3.5) + '" fill="#fff8d6" opacity=".9"/><defs><radialGradient id="lanG" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#fff2b0"/><stop offset=".45" stop-color="#ffc93c"/><stop offset="1" stop-color="#d07a10"/></radialGradient></defs></svg>';
      }
      const geo = el('div', 'g-geo', cv);
      geo.innerHTML = '<svg viewBox="-100 -100 200 200"><g fill="none" stroke="#ffc93c" stroke-opacity=".35" stroke-width=".5"><path d="' + star8(0, 0, 96, 70) + '"/><path d="' + star8(0, 0, 70, 52) + '"/><rect x="-62" y="-62" width="124" height="124"/><rect x="-62" y="-62" width="124" height="124" transform="rotate(45)"/><circle r="40"/></g></svg>';
    },
    rules: ['Four clues show on the TV about someone or something from the Stories of the Prophets.', 'Pick the right answer on your phone before the time runs out.', 'Each helper works once: remove two wrong answers, a hint, answer it for me, and double points.'],
    howto,
    // the host's phone sets the game up in these steps, then a last one to check it all and start
    steps: [{ t: 'Game mode', s: 'Mode', keys: ['lang', 'mode'] }, { t: 'Teams and questions', s: 'Questions', keys: ['teams', 'teamN', 'count', 'perTeam', 'raceTo', 'level'] },
      { t: 'Category', keys: ['cat', 'wheel'] }, { t: 'Timing', s: 'Time', keys: ['sec', 'next', 'wait'] }, { t: 'Extras', keys: ['helpers', 'speed', 'rules'] }],
    // the TV's lobby explains the mode the host picked
    spot: s => {
      const m = MODES.find(x => x[0] === s.mode) || MODES[0];
      const team = TEAMED(m[0]), wheelOn = m[0] === 'spin' || (s.cat === 'mix' && s.wheel !== 'off');
      const help = s.helpers !== false ? ['💡', ELIM(m[0]) ? '4 helpers each, like a shield that keeps you in once' : '4 helpers each: remove two, a hint, answer it for me, double points'] : ['🧠', 'No helpers: just you and the clues'];
      const bullets = {
        most: [['✅', s.speed ? 'Faster right answers score more' : 'Every right answer scores 100 points'], help, wheelOn ? ['🎡', 'The wheel picks the category'] : ['🔎', 'Four clues for every question']],
        clues: [['⏳', 'The clues show one at a time'], ['💯', 'Answer early: 100, 75, 50 or 25 points'], help],
        turns: [['👥', 'Each team answers its own questions'], ['⚖️', 'Every team gets the same number of questions'], wheelOn ? ['🎡', 'The wheel picks the category'] : help],
        spin: [['🎡', 'Each team spins the wheel on its turn'], ['🎨', 'The color picks the category'], ['⚖️', 'Every team gets the same number of questions']],
        knockout: [['⚔️', 'One wrong answer and you are out'], ['🤝', 'If everyone misses, nobody goes out'], help],
        lives: [['❤️', 'Everyone starts with 3 hearts'], ['💔', 'Each wrong answer costs a heart'], ['🏆', 'The last one with a heart left wins']],
        race: [['🎯', 'First to {n} right answers wins'], ['⚡', 'Two get there at once? The faster answer wins'], help],
        first: [['⚡', 'The fastest right answer takes the points'], ['🎯', 'A wrong answer costs nothing'], help]
      }[m[0]];
      const catL = m[0] === 'spin' ? 'The wheel picks' : s.cat !== 'mix' ? (CATS[catOf(s.cat)] || CATS[0]).short : wheelOn ? (s.wheel === '1' ? 'Wheel every question' : 'Wheel every 5 questions') : 'All four categories';
      const facts = [team ? ['❓', '{n} questions per team', { n: +s.perTeam }] : m[0] === 'race' ? ['🎯', 'Race to {n}', { n: +s.raceTo }] : ['❓', '{n} questions', { n: +s.count }], +s.sec ? ['⏱️', '{n} s', { n: +s.sec }] : ['⏳', 'No timer'], ['🗂️', catL]];
      if (LV[s.level]) facts.splice(1, 0, ['🎯', { easy: 'Easy', medium: 'Medium', hard: 'Hard' }[s.level]]);
      if (team || (s.teams && m[0] !== 'race')) facts.push(['👥', '{n} teams', { n: +s.teamN || 2 }]);
      return { key: m[0], icon: { most: '🏆', clues: '🔎', turns: '👥', spin: '🎡', knockout: '⚔️', lives: '❤️', race: '🏁', first: '⚡' }[m[0]], label: 'Game mode', name: m[1], desc: m[2], bullets, vars: { n: +s.raceTo }, facts };
    },
    settings: [
      { key: 'mode', label: 'Game mode', type: 'seg', look: 'list', options: MODES, default: 'most' },
      { key: 'teams', label: 'Teams', type: 'toggle', default: false, desc: 'Phones join a color team, and each team\'s points are added up.', when: ['mode', ['most', 'clues', 'knockout', 'lives', 'first']] },
      { key: 'teamN', label: 'How many teams', type: 'seg', options: [[2, '2'], [3, '3'], [4, '4']], default: 2, when: { any: [['mode', ['turns', 'spin']], [['teams', true], ['mode', ['most', 'clues', 'knockout', 'lives', 'first']]]] } },
      { key: 'count', label: 'How many questions', type: 'number', min: 1, max: 100, unit: 'questions', default: 10, when: ['mode', ['most', 'clues', 'knockout', 'lives', 'first']] },
      { key: 'perTeam', label: 'Questions for each team', type: 'number', min: 1, max: 50, unit: 'questions', default: 5, when: ['mode', ['turns', 'spin']], desc: 'Every team gets this many questions, in turns: the first question goes to the first team, the next one to the next team, and so on.' },
      { key: 'raceTo', label: 'Race to', type: 'number', min: 1, max: 30, unit: 'right answers', default: 5, when: ['mode', 'race'], desc: 'The first player to get this many right answers wins. The questions keep coming until someone does.' },
      { key: 'level', label: 'Difficulty', type: 'seg', options: [['mix', 'Easy to hard', 'Starts easy and gets harder as you go.'], ['easy', 'Easy', 'The stories everyone knows.'], ['medium', 'Medium', 'For people who know the stories.'], ['hard', 'Hard', 'For real experts of the stories.']], default: 'mix' },
      { key: 'cat', label: 'Category', type: 'seg', options: [['mix', 'All four (mixed)', 'Questions from all four categories.'], ...CATS.map(c => [c.id, c.short, c.name])], default: 'mix', when: ['mode', '!spin'] },
      { key: 'wheel', label: 'Spin the wheel', type: 'seg', options: [['5', 'Every 5 questions', 'The wheel picks the category for the next 5 questions.'], ['1', 'Every question', 'The wheel picks the category of every question.'], ['off', 'Off', 'No wheel: the questions come from all four categories.']], default: '5', when: [['cat', 'mix'], ['mode', '!spin']] },
      { key: 'sec', label: 'Time to answer', type: 'seg', options: [[15, '15 s'], [20, '20 s'], [30, '30 s'], [45, '45 s'], [0, 'No limit', 'No clock: each question waits until everyone answers. The host can show the answer any time.']], default: 20 },
      { key: 'next', label: 'Next question', type: 'seg', options: [['auto', 'Automatic', 'The next question starts by itself after a short wait.'], ['host', 'The host starts it', 'The host taps Next question on their phone when everyone is ready.']], default: 'auto' },
      { key: 'wait', label: 'Wait before the next question', type: 'number', min: 1, max: 120, unit: 'seconds', default: 6, when: ['next', 'auto'] },
      { key: 'helpers', label: 'Helpers', type: 'toggle', default: true, desc: 'Each player can use each helper once: remove two wrong answers, a hint, answer it for me, double points.' },
      { key: 'speed', label: 'Speed points', type: 'toggle', default: false, desc: 'Faster right answers score more', when: ['mode', ['most', 'turns', 'spin']] },
      { key: 'rules', label: 'How to play first', type: 'toggle', default: true, desc: 'The TV shows how to play before the first question.' }
    ],
    async tv(K) {
      const s = K.settings, mode = s.mode || 'most';
      const team = TEAMED(mode), race = mode === 'race', clueMode = mode === 'clues';
      const lg = K.lang === 'ar' ? 'ar' : 'en', other = lg === 'ar' ? 'en' : 'ar';
      teamPts = {};
      // the questions
      let bank = null;
      try { bank = await Promise.race([loadBank(), new Promise((r, j) => setTimeout(() => j(new Error('slow')), 15000))]); } catch (e) {}
      if (!bank || !Array.isArray(bank.q) || !bank.q.length) {
        const b = K.view(null); b.classList.add('gr');
        const box = div(K, 'gr-box', b); K.el('h1', '', box, await K.tr('The questions didn\'t load. Check the internet, then start the game again.'));
        await K.sleep(7000);
        return K.players().slice().sort((a, c) => c.score - a.score);
      }
      const all = bank.q.map(r => ({ id: r[0], cat: r[1], lv: r[2], ok: r[3], en: r[4], ar: r[5] }));
      const fixedCat = mode === 'spin' || s.cat === 'mix' ? -1 : catOf(s.cat);
      const wheelEvery = mode === 'spin' ? 1 : s.cat !== 'mix' || s.wheel === 'off' ? 0 : s.wheel === '1' ? 1 : 5;
      const pool = fixedCat >= 0 ? all.filter(q => q.cat === fixedCat) : all;
      const pk = picker(pool);
      // the teams that play (team turns): the ones with someone on them, in color order; every team the same number of
      // questions, taking turns
      const TEAMS = P.TEAMS.slice(0, Math.min(4, +s.teamN || 2)).map(t => [t[0], t[1], t[2], t[1] + ' team']);
      // (each team's name in the game's language, for the scoreboard)
      for (const t of TEAMS) t[4] = await K.tr(t[3]);
      let order = team ? TEAMS.filter(t => K.players().some(p => p.team === t[0])) : [];
      if (team && !order.length) order = TEAMS.slice(0, 1);
      if (team) for (const t of TEAMS) teamPts[t[0]] = 0;
      const target = Math.max(1, +s.raceTo || 5);
      let n = team ? Math.max(1, +s.perTeam || 5) * order.length : race ? target * 6 : Math.max(1, +s.count || 10);
      // (not more than there are: a single category has about a hundred)
      if (!race) n = Math.min(n, pool.length - (pool.length % (team ? order.length : 1)));
      const total = race ? 0 : n;
      const sec = +s.sec || 0;
      const helpOn = s.helpers !== false;
      // (speed points only where the setting shows: most correct and the team modes)
      const speedOn = !!s.speed && ['most', 'turns', 'spin'].includes(mode);
      // (Clue by clue: 12 more seconds, for the three clues that come one by one)
      const qsec = clueMode && sec ? sec + 12 : sec;
      const HS = helpSet(mode);
      const showTeams = team || K.teamsOn();
      const teamsShown = showTeams ? TEAMS.filter(t => team ? order.some(o => o[0] === t[0]) : true) : null;
      // our own rules, first (with the game's tune already playing)
      K.snd.music('gPlay', { fadeIn: 1.5, fadeOut: 1.5 });
      if (s.rules !== false) { K.wait(); await rulesScreen(K, s, 11); await K.sleep(11500); }
      let cat = fixedCat, winner = null;
      const lead = () => Math.max(0, ...K.players().map(p => p.right));
      for (let i = 0; i < n; i++) {
        if (K.over() || winner) break;
        if (ELIM(mode) && (!K.alive().length || (K.players().length > 1 && K.alive().length <= 1))) break;
        const turn = team ? order[i % order.length] : null;
        const turnIds = () => (turn ? K.players().filter(p => p.team === turn[0] && !p.out).map(p => p.id) : K.alive().map(p => p.id));
        // 1. the wheel, when it's time: every 5 questions or every question (the team whose turn it is spins on its phone;
        // otherwise the host)
        const num = i + 1;
        let spunNow = false;
        if (wheelEvery && i % wheelEvery === 0) {
          const ok = CATS.map((c, j) => j).filter(j => pk.left(j) > 0);
          if (ok.length) {
            if (i % 5 === 0) K.snd.sting('gEvery5', { duck: 0.35 });
            const host = K.players().find(p => K.isHost(p.id));
            const who = turn ? turnIds() : host ? [host.id] : [];
            const whoText = turn ? '{team}, spin the wheel on your phone!' : '{name}, spin the wheel on your phone!';
            cat = await wheel(K, { ok, who, whoText, whoVars: turn ? { team: await K.tr(turn[3]) } : { name: '⁨' + (host ? host.name : '') + '⁩' }, wt: turn ? ['{team} is spinning the wheel. Watch the TV!', turn[3]] : null });
            spunNow = true;
          }
        }
        if (K.over()) break;
        const lv = race ? (lead() < target / 3 ? 1 : lead() < 2 * target / 3 ? 2 : 3) : stageLv(i, n, s.level);
        const q = pk.take(wheelEvery ? cat : fixedCat, lv);
        if (!q) break;
        markAsked(q.id);
        // (the four answers in a new order every time: the same on the TV and on every phone, in both languages)
        const perm = P.shuffle([0, 1, 2, 3]);
        const T = q[lg], X = q[other];
        const opts = perm.map(j => T[2][j]), ok = perm.indexOf(q.ok);
        const text = { title: T[0], clues: T[1] };
        // (players who picked the other language get the question, its clues and its answers in it, on their phone)
        const live = team ? K.players().filter(p => turnIds().includes(p.id)) : K.alive();
        const needOther = K.players().some(p => K.langOf(p.id) === other);
        const tr = needOther ? { [other]: { q: X[0], c: X[1], o: perm.map(j => X[2][j]) } } : null;
        const rightIn = id => (K.langOf(id) === other ? X[2][q.ok] : T[2][q.ok]);
        // 2. its sound first ("every 5 questions" on the 1st, 6th, 11th...; "next question" on the others), while the TV
        // shows which question it is; the tune keeps playing under it
        const big = i % 5 === 0 && !spunNow, lastN = race ? (lead() >= target - 1 ? 1 : 0) : (n - i <= 2 ? n - i : 0);
        K.wait();
        K.snd.sting(big ? 'gEvery5' : 'gNext', { duck: 0.35 });
        await intro(K, { num, total, cat: q.cat, turn, big, last: lastN, race });
        await K.sleep(K.snd.on() ? (big ? 4200 : 3000) : 1800);
        if (K.over()) break;
        // 3. the question: the title, the clues one by one, then the answers (Clue by clue: the answers right away, and a
        // new clue every few seconds)
        const v = await qView(K, { num, total, goal: race ? target : n, q, text, opts, sec: qsec, mode, teams: teamsShown, teamPts, turn });
        const worth = [100, 75, 50, 25];
        let shown = clueMode ? 1 : 4;
        const ptsLabel = async k => K.tr('Worth {n} points', { n: K.num(clueMode ? worth[k - 1] : 100) });
        v.setPts(await ptsLabel(shown));
        await K.sleep(900);
        if (clueMode) { await v.showClue(0); await K.sleep(700); await v.showAnswers(200); }
        else { for (let c = 0; c < 4; c++) { if (K.over()) break; await v.showClue(c); await K.sleep(650); } await K.sleep(300); await v.showAnswers(380); }
        if (K.over()) break;
        // 4. everything is on the screen: the clock starts
        if (v.ring) v.ring.go();
        const answered = new Set();
        let qn = -1;
        const offPlayers = K.onPlayers(() => v.board.draw(answered));
        // the helpers (each player, each once): remove two, the question's hint, answer it for me, and double points (a
        // shield in Knockout and 3 lives)
        const boosted = new Set();
        const offHelp = K.on('help', async (m, p) => {
          if (+m.n !== qn || p.out || p.helpers[m.h] || !HS.some(h => h[0] === m.h) || !helpOn || !live.some(x => x.id === p.id)) return;
          p.helpers[m.h] = true;
          const mine = K.langOf(p.id) === other ? X : T;
          if (m.h === 'fifty') { const wrong = P.shuffle([0, 1, 2, 3].filter(x => x !== ok)).slice(0, 2); K.sayTo(p.id, { k: 'helped', n: qn, h: 'fifty', hide: wrong }); }
          else if (m.h === 'hint') K.sayTo(p.id, { k: 'helped', n: qn, h: 'hint', text: mine[3] });
          else if (m.h === 'auto') K.sayTo(p.id, { k: 'helped', n: qn, h: 'auto', pick: ok });
          else if (m.h === 'boost') { boosted.add(p.id); K.sayTo(p.id, { k: 'helped', n: qn, h: 'boost', note: await K.trFor(K.langOf(p.id), ELIM(mode) ? 'Shield on: a wrong answer won\'t count against you this time.' : 'Double points on this question!') }); }
        });
        // (no clock: the question waits for everyone, or for the host to show the answer)
        const open = !sec;
        const extra = { letters: true, tv: 1, gir: 1 };
        if (helpOn) { extra.helpers = HS; extra.hlab = { boost: boostName(mode) }; }
        if (tr) extra.tr = tr;
        if (clueMode) { extra.clues = 1; extra.wl = 'Worth {n} points'; extra.w = worth[0]; }
        if (turn) extra.wt = ['{team} is answering. Watch the TV!', turn[3]];
        // (Clue by clue: when each player answered, so their points match the clues they had)
        const ansAt = new Map();
        const asking = K.ask({ kind: 'choice', prompt: '', opts, sec: qsec, open, who: live.map(p => p.id), extra, onAns: id => { answered.add(id); ansAt.set(id, shown); v.board.draw(answered); } });
        qn = K.qn();
        const stopReveal = open ? hostReveal(K, qn) : null;
        let closed = false;
        // (Clue by clue: a new clue every 4 seconds; the points go down with each one)
        const clueRun = clueMode ? (async () => { for (let c = 1; c < 4; c++) { await K.sleep(4000); if (closed || K.over()) return; shown = c + 1; await v.showClue(c); v.setPts(await ptsLabel(shown)); K.snd.fx('gTick', { vol: 0.8 }); K.say({ k: 'gclue', n: qn, c: shown, w: worth[c] }); } })() : null;
        void clueRun;
        const tuT = qsec ? setTimeout(() => { if (closed || K.over() || answered.size >= live.length) return; K.snd.sting('gTimesup', { duck: 0.3 }); }, qsec * 1000) : 0;
        const answers = await asking;
        closed = true; clearTimeout(tuT);
        if (stopReveal) stopReveal();
        offHelp();
        if (v.ring) v.ring.stop();
        v.clock.classList.add('done');
        // 5. the answer: the sound first ("correct" when anyone got it), then the right one lights up
        const inPlay = live.filter(p => answers.has(p.id) || !p.away);
        // (a team's answer is the one most of its players picked; a tie, the one picked first)
        let teamPick = -1;
        if (turn) {
          const votes = [0, 0, 0, 0], firstAt = [Infinity, Infinity, Infinity, Infinity];
          for (const [, a] of answers) { const j = +a.v; if (j >= 0 && j < 4) { votes[j]++; firstAt[j] = Math.min(firstAt[j], a.at); } }
          const top = Math.max(...votes);
          if (top > 0) teamPick = [0, 1, 2, 3].filter(j => votes[j] === top).sort((a, b) => firstAt[a] - firstAt[b])[0];
        }
        const rightN = turn ? (teamPick === ok ? 1 : 0) : [...answers.values()].filter(a => +a.v === ok).length;
        K.snd.sting(rightN ? 'gCorrect' : 'gWrong', { duck: 0.35 });
        await K.sleep(K.snd.on() ? 900 : 250);
        v.cells.forEach((c, j) => c.node.classList.add(j === ok ? 'right' : 'dim'));
        if (turn && teamPick >= 0) { const tf = K.el('span', 'tflag', v.cells[teamPick].node, await K.tr(turn[3])); tf.style.setProperty('--tc', turn[2]); if (teamPick !== ok) v.cells[teamPick].node.classList.add('miss'); }
        for (let j = 0; j < 4; j++) showWho(K, v.cells[j], [...answers].filter(([, a]) => +a.v === j).map(([id]) => id));
        // (Clue by clue: all four clues show now)
        for (let c = 0; c < 4; c++) v.showClue(c);
        const spare = ELIM(mode) && inPlay.length > 1 && !inPlay.some(p => answers.has(p.id) && +answers.get(p.id).v === ok);
        if (spare) K.el('div', 'pill', v.fx, await K.tr('Everyone missed that one, so nobody goes out.'));
        const res = new Map();
        let first = null;
        // the points: 100 a right answer (Clue by clue: 100, 75, 50 or 25; speed points: more for faster; double points:
        // twice as many)
        const ptsFor = (p, a) => {
          let base = clueMode ? worth[Math.max(1, Math.min(4, ansAt.get(p.id) || 4)) - 1] : 100;
          if (speedOn) base = Math.round(100 * (0.5 + 0.5 * Math.max(0, 1 - (a.ms || 0) / ((qsec || 30) * 1000))));
          return boosted.has(p.id) && !ELIM(mode) ? base * 2 : base;
        };
        if (turn) {
          const good = teamPick === ok;
          let tp = 0;
          if (good) {
            // (the team's points: 100, or the faster the team's right answers came, the more with speed points)
            const okA = [...answers].filter(([, a]) => +a.v === ok);
            const best = okA.reduce((m2, [id, a]) => Math.max(m2, ptsFor(K.player(id) || { id }, a)), 100);
            tp = speedOn ? best : (okA.some(([id]) => boosted.has(id)) ? 200 : 100);
            teamPts[turn[0]] += tp;
          }
          for (const p of K.players().filter(x => x.team === turn[0])) {
            const a = answers.get(p.id);
            const mineOk = a && +a.v === ok;
            if (mineOk) { p.right++; if (!first || a.ms < first.ms) first = { p, ms: a.ms }; }
            p.score = teamPts[turn[0]];
            K.result(p.id, { ok: good, pts: tp, score: p.score, right: rightIn(p.id), note: good ? '' : await K.trFor(K.langOf(p.id), 'Your team\'s answer wasn\'t right.') });
          }
          for (const p of K.players()) if (p.team && teamPts[p.team] != null) p.score = teamPts[p.team];
          res.set('t-' + turn[0], good ? 'right' : 'miss');
        } else {
          for (const p of inPlay) {
            const a = answers.get(p.id);
            const good = !!a && +a.v === ok;
            let pts = 0;
            if (good) {
              p.right++; p.streak++;
              if (!first || a.ms < first.ms) first = { p, ms: a.ms };
              if (mode !== 'first') { pts = ptsFor(p, a); p.score += pts; }
            } else {
              p.streak = 0;
              const shield = boosted.has(p.id) && ELIM(mode);
              if (mode === 'knockout' && !spare && !shield) p.out = true;
              if (mode === 'lives' && !spare && !shield) { p.lives--; if (p.lives <= 0) p.out = true; }
            }
            if (mode !== 'first' || !good) K.result(p.id, { ok: good, pts, score: p.score, out: p.out, lives: p.lives, right: rightIn(p.id) });
            res.set(p.id, good ? 'right' : p.out ? 'out' : 'miss');
          }
          if (first && mode === 'first') { const fp = ptsFor(first.p, answers.get(first.p.id)); first.p.score += fp; K.result(first.p.id, { ok: true, pts: fp, score: first.p.score, first: true, right: rightIn(first.p.id) }); for (const p of inPlay) if (p !== first.p && answers.get(p.id) && +answers.get(p.id).v === ok) K.result(p.id, { ok: true, pts: 0, score: p.score, right: rightIn(p.id), note: await K.trFor(K.langOf(p.id), 'Right, but someone was faster.') }); }
        }
        if (first && !turn) await firstBadge(K, v.fx, first.p, first.ms);
        if (race) {
          const msOf = p => (answers.get(p.id) || { ms: 1e9 }).ms;
          const done = inPlay.filter(p => p.right >= target).sort((a, b) => msOf(a) - msOf(b));
          if (done.length) { winner = done[0]; K.el('div', 'pill', v.fx, '🏁 ' + await K.tr('{name} crossed the finish line!', { name: '⁨' + winner.name + '⁩' })); }
        }
        K.boo(rightN && (turn || rightN >= inPlay.length / 2) ? 'happy' : 'sad');
        v.board.draw(null, res);
        offPlayers();
        const last = !!winner || (!race && i >= n - 1) || (race && i >= n - 1) || (ELIM(mode) && (!K.alive().length || (K.players().length > 1 && K.alive().length <= 1)));
        if (last) await K.sleep(5000);
        else if (s.next === 'host') await hostNext(K, v, qn);
        else await nextIn(K, v, Math.max(1, Math.min(120, Math.round(+s.wait) || 6)));
      }
      // the winner: a race's, or the most points (teams: the kit adds them up, from this game's own team points)
      let ps = K.players().slice().sort((a, b) => b.score - a.score || b.right - a.right);
      if (race) ps = K.players().slice().sort((a, b) => (b === winner) - (a === winner) || b.right - a.right || b.score - a.score);
      if (ELIM(mode)) ps = K.players().slice().sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0) || b.right - a.right || b.score - a.score);
      return ps;
    }
  });
  async function firstBadge(K, parent, p, ms) { const f = K.el('div', 'first', parent); const im = K.el('img', '', f); im.src = K.avatarUrl(p); im.alt = ''; f.append('⚡ ' + await K.tr('First: {name} ({s} s)', { name: '⁨' + p.name + '⁩', s: K.num(Math.round(ms / 100) / 10) })); return f; }
  // with no time limit, the host can show the answer whenever they like (their phone gets a button)
  function hostReveal(K, n) {
    let on = true;
    (async () => {
      const label = await K.tr('Show the answer');
      const off = K.on('reveal', (m, p) => { if (+m.n === n && K.isHost(p.id)) K.close(n); });
      for (let k = 0; on && !K.over(); k++) {
        if (k % 8 === 0) { const h = K.players().find(p => K.isHost(p.id)); if (h) K.sayTo(h.id, { k: 'revealq', n, label }); }
        await K.sleep(500);
      }
      off();
    })();
    return () => { on = false; };
  }
  // the next question in a few seconds, counting down on the TV
  async function nextIn(K, v, secs) {
    const pill = K.el('div', 'pill nextp', v.fx);
    for (let n = secs; n > 0 && !K.over(); n--) { pill.textContent = '⏭️ ' + await K.tr('Next question in {n}', { n: K.num(n) }); await K.sleep(1000); }
  }
  // the host goes on when everyone is ready: their phone gets a Next question button
  async function hostNext(K, v, n) {
    K.el('div', 'pill nextp', v.fx, '⏸️ ' + await K.tr('Waiting for the host to start the next question'));
    const label = await K.tr('Next question');
    let go = false;
    const off = K.on('next', (m, p) => { if (+m.n === n && K.isHost(p.id)) go = true; });
    K.hostWait(true);
    for (let k = 0; !go && !K.over(); k++) {
      if (k % 8 === 0) { const h = K.players().find(p => K.isHost(p.id)); if (h) K.sayTo(h.id, { k: 'nextq', n, label }); }
      await K.sleep(500);
    }
    K.hostWait(false);
    off();
  }
})();
