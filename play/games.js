// Blokvane party games: the games. Each one says what happens in its rounds; the kit (play.js) does the rest (joining,
// the lobby, asking the phones, the scoreboard, the winner). Every word goes through K.tr / K.f, in the game's language
// (i18n.js), and the questions, words, riddles and places come from that language's own packs (K.packs; English: the
// ones in packs.js).
(() => {
  'use strict';
  const P = BVPLAYC, PK = BVPACKS;
  const G = def => BVPLAY.game(def);
  // (a setting's "desc", and an option's third part, is the short line the host's phone shows under it)
  const KIDS = desc => ({ key: 'kids', label: 'Kids mode', type: 'toggle', default: false, desc });
  const rounds = (d, list) => ({ key: 'rounds', label: 'Rounds', type: 'seg', options: list.map(n => [n, String(n)]), default: d });
  const LET = P.LETTERS;
  // ---------- small helpers every game uses ----------
  async function qView(K, o) {
    const right = [];
    let rg = null;
    if (o.sec) { rg = K.ring(document.createElement('div'), o.sec, o.idle); right.push(rg.node); }
    const body = K.view(await K.tr(o.title), o.sub ? await K.tr(o.sub) : '', right);
    const main = K.el('div', 'col grow', body);
    const b = o.board === false ? null : K.board(body, { lives: o.lives, title: await K.tr('Scoreboard') });
    return { body, main, board: b, ring: rg };
  }
  async function answersGrid(K, parent, opts, hx, pre) {
    const g = K.el('div', 'answers' + (hx ? ' hx' : ''), parent);
    const cells = [];
    for (let i = 0; i < opts.length; i++) {
      const len = String(opts[i] || '').length;
      const a = K.el('div', 'ans ' + LET[i] + (hx ? ' hx' + (len > 44 ? ' xlong' : len > 26 ? ' long' : '') : '') + (pre ? ' pre' : ''), g);
      K.el('span', 'l', a, BVI18N.letters(K.lang)[i] || LET[i]);
      K.el('span', '', a, opts[i]);
      cells.push({ node: a, who: K.el('span', 'who', a) });
    }
    return cells;
  }
  // who picked an answer: their faces on it (up to 6, then "+12": with a full room, the rest are a number)
  function showWho(K, cell, ids) {
    const ps = ids.map(id => K.player(id)).filter(Boolean);
    for (const p of ps.slice(0, ps.length > 7 ? 6 : 7)) { const im = K.el('img', '', cell.who); im.src = K.avatarUrl(p); im.alt = ''; }
    if (ps.length > 7) K.el('span', 'more', cell.who, '+' + K.num(ps.length - 6));
  }
  async function firstBadge(K, parent, p, ms) { const f = K.el('div', 'first', parent); const im = K.el('img', '', f); im.src = K.avatarUrl(p); im.alt = ''; f.append('⚡ ' + await K.tr('First: {name} ({s} s)', { name: '\u2068' + p.name + '\u2069', s: K.num(Math.round(ms / 100) / 10) })); return f; }
  // the first letter of an answer as a reader sees it (one whole letter in Hindi or Bengali, with its vowel sign)
  function firstLetter(text) {
    const t = String(text || '').trim();
    try { if (window.Intl && Intl.Segmenter) { for (const g of new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(t)) return g.segment; } } catch (e) {}
    return [...t][0] || '';
  }
  const decode = s => { try { return decodeURIComponent(s); } catch (e) { return s; } };
  // the Open Trivia Database (opentdb.com): one ask every 5 seconds at most, so the questions load while players join
  let lastAsk = 0;
  async function otdb(o) {
    const wait = Math.max(0, lastAsk + 5200 - Date.now());
    if (wait) await new Promise(r => setTimeout(r, wait));
    lastAsk = Date.now();
    const u = new URL('https://opentdb.com/api.php');
    u.searchParams.set('amount', String(o.amount || 50)); u.searchParams.set('type', 'multiple'); u.searchParams.set('encode', 'url3986');
    if (o.cat) u.searchParams.set('category', String(o.cat));
    if (o.diff) u.searchParams.set('difficulty', o.diff);
    try {
      const r = await fetch(u.href, { credentials: 'omit', referrerPolicy: 'no-referrer' });
      const j = await r.json();
      if (!j || j.response_code !== 0 || !Array.isArray(j.results)) return [];
      return j.results.map(x => ({ q: decode(x.question), a: decode(x.correct_answer), w: x.incorrect_answers.map(decode), c: decode(x.category), d: x.difficulty }));
    } catch (e) { return []; }
  }
  const catName = id => (PK.cats.find(c => c[0] === id) || [0, ''])[1];
  const fromBank = x => ({ q: x[0], a: x[1], w: x[2], cat: x[3], c: catName(x[3]), d: x[4] });
  const BANK_CATS = new Set(PK.trivia.map(x => x[3]));

  // ---------- Trivia's questions: thousands in every language, written by Blokvane, in q/<language>/<category>.json
  // (q/index.js says how many each language has). Every screen remembers which ones it has asked (a question has the
  // same id in every language) and picks the ones it hasn't first; once a category's easy, medium or hard ones have
  // all been asked, the ones asked longest ago come back first. ----------
  const QI = window.BVQ || null;
  const LV = ['easy', 'medium', 'hard'];
  const QBASE = (window.BVI18N ? BVI18N.BASE : '') + 'q/';
  const qFiles = new Map();
  function qFile(lang, cat) {
    const k = lang + '|' + cat;
    if (!qFiles.has(k)) {
      qFiles.set(k, fetch(QBASE + lang + '/' + cat + '.json?v=' + (QI ? QI.v : 1), { credentials: 'omit' })
        .then(r => (r.ok ? r.json() : null))
        .then(j => (j && Array.isArray(j.q) ? j.q.map(x => ({ id: cat + '.' + x[0], cat, c: catName(cat), d: LV[x[1]] || 'easy', q: x[2], a: x[3], w: x.slice(4, 7) })) : null))
        .catch(() => null)
        .then(l => { if (!l) qFiles.delete(k); return l; }));
    }
    return qFiles.get(k);
  }
  // the categories a language has questions for
  const qCats = lang => (QI && QI.n && QI.n[lang] ? Object.keys(QI.n[lang]).map(Number).filter(c => PK.cats.some(x => x[0] === c)) : []);
  // one question in another language (the same id in every language), for a player who reads that one
  const qIdx = new Map();
  function qOne(lang, id) {
    const cat = +String(id).split('.')[0];
    if (!cat || !qCats(lang).includes(cat)) return Promise.resolve(null);
    const k = lang + '|' + cat;
    if (!qIdx.has(k)) qIdx.set(k, qFile(lang, cat).then(l => (l ? new Map(l.map(x => [x.id, x])) : null)).then(m => { if (!m) qIdx.delete(k); return m; }));
    return qIdx.get(k).then(m => (m && m.get(id)) || null);
  }
  // the question and its four answers (in the same order as on the TV) for each language the players picked for their
  // phones: { fr: { q, o: [...] } }, or null when nobody needs it. A language that's slow to load waits 2 seconds at most.
  async function qTrans(K, q, perm, ps) {
    const langs = [...new Set(ps.map(p => K.langOf(p.id)).filter(l => l && l !== K.lang))];
    if (!langs.length || !/^\d+\.\d+$/.test(String(q.id))) return null;
    const out = {};
    await Promise.all(langs.map(async lg => {
      const x = await Promise.race([qOne(lg, q.id), new Promise(r => setTimeout(() => r(null), 2000))]);
      if (x && x.w && x.w.length >= 3) { const src = [x.a, ...x.w]; out[lg] = { q: x.q, o: perm.map(j => src[j]) }; }
    }));
    return Object.keys(out).length ? out : null;
  }
  // (if the files can't load: the few questions built into the game, remembered the same way)
  function qBuiltIn(LP) {
    const CAT = { Animals: 27, Food: 9, Science: 17, General: 9, Math: 19, Geography: 22, Music: 12 };
    const bank = (LP ? LP.trivia : PK.trivia).map((x, i) => Object.assign(fromBank(x), { id: 'b.' + i }));
    return bank.concat((LP ? LP.easy : PK.easy).map((x, i) => { const c = CAT[x[3]] || 9; return { id: 's.' + i, cat: c, c: catName(c), d: 'easy', q: x[0], a: x[1], w: x[2] }; }));
  }
  const ASKED = 'bvplay:asked';
  const askedList = () => { try { return (localStorage.getItem(ASKED) || '').split(',').filter(Boolean); } catch (e) { return []; } };
  function markAsked(id) {
    try { const l = askedList().filter(x => x !== id); l.push(id); localStorage.setItem(ASKED, l.slice(-20000).join(',')); } catch (e) {}
  }
  // one question at a time for a game: the level asked for, from the category asked for (0: any, a different one each
  // time), one this screen hasn't asked yet, never the same question or the same answer twice in one game
  function qPicker(pool) {
    const rank = new Map(askedList().map((id, i) => [id, i]));
    const by = new Map();
    for (const q of pool) { const k = q.cat + '|' + q.d; if (!by.has(k)) by.set(k, []); by.get(k).push(q); }
    const cats = [...new Set(pool.map(q => q.cat))];
    // (never twice in one game: the same question, the same words asked another way in another category, or the same
    // answer)
    const used = new Set(), answers = new Set(), texts = new Set();
    let lastCat = 0;
    const ok = q => !used.has(q.id) && !answers.has(P.norm(q.a)) && !texts.has(P.norm(q.q));
    const has = (c, d) => (by.get(c + '|' + d) || []).some(ok);
    function from(c, d) {
      const list = (by.get(c + '|' + d) || []).filter(ok);
      if (!list.length) return null;
      const fresh = list.filter(q => !rank.has(q.id));
      if (fresh.length) return P.pick(fresh);
      // (every one of them asked before: one of those asked longest ago)
      list.sort((a, b) => rank.get(a.id) - rank.get(b.id));
      return P.pick(list.slice(0, Math.max(1, Math.ceil(list.length / 4))));
    }
    // a category for "any": a random one, not the one just asked; the bigger ones come up a little more often
    function anyCat(d) {
      let opts = cats.filter(c => c !== lastCat && has(c, d));
      if (!opts.length) opts = cats.filter(c => has(c, d));
      if (!opts.length) return 0;
      const wts = opts.map(c => Math.sqrt(1 + (by.get(c + '|' + d) || []).filter(q => ok(q) && !rank.has(q.id)).length));
      let r = Math.random() * wts.reduce((a, b) => a + b, 0);
      for (let i = 0; i < opts.length; i++) { r -= wts[i]; if (r <= 0) return opts[i]; }
      return opts[opts.length - 1];
    }
    return {
      take(d, cat) {
        let q = null;
        // (that level from that category; else that level from another category; only then the nearest level)
        for (const lv of [d, ...{ easy: ['medium', 'hard'], medium: ['easy', 'hard'], hard: ['medium', 'easy'] }[d]]) {
          q = (cat && from(cat, lv)) || from(anyCat(lv), lv);
          if (q) break;
        }
        if (!q) return null;
        used.add(q.id); answers.add(P.norm(q.a)); texts.add(P.norm(q.q)); lastCat = q.cat;
        return q;
      }
    };
  }
  // the levels of a game's questions, in order: easy, then medium, then hard, a third each (or one level only)
  function qLevels(n, level) {
    if (LV.includes(level)) return Array(n).fill(level);
    return Array.from({ length: n }, (_, i) => stageOf(i, n));
  }
  const teamOf = (K, p) => P.TEAMS.find(t => t[0] === p.team);

  // ---------- Trivia's question screen, like a game-show stage: the question and the four answers in hexagon frames,
  // the scoreboard (who has answered), a big clock, and on the side the helpers and the ladder of questions (each
  // difficulty's name sits on its last question: the easy ones at the bottom, the hard ones at the top) ----------
  const DIFF = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  async function tqView(K, o) {
    const body = K.view(null);
    body.classList.add('tq');
    const main = K.el('div', 'tq-main', body);
    const top = K.el('div', 'tq-top', main);
    // (Trivia's own icon, like at the top of every other screen of the game)
    const lg = K.el('div', 'tq-logo gi', top); const li = K.el('img', '', lg); li.src = 'icons/trivia.webp'; li.alt = '';
    const cat = o.q.c ? await K.tr(o.q.c) : '', dif = DIFF[o.q.d] ? await K.tr(DIFF[o.q.d]) : '';
    K.el('div', 'tq-meta caps grow', top, [cat, dif].filter(Boolean).join(' · '));
    const meta = K.el('div', 'tq-meta caps tq-r', top);
    const mid = K.el('div', 'tq-mid', main);
    const board = await tqBoard(K, mid, o, meta);
    // (more players, a taller scoreboard: the question and answers get a little smaller so everything fits)
    if (board.node.classList.contains('tight')) body.classList.add('crowd');
    else if (board.node.classList.contains('many')) body.classList.add('packed');
    let ring = null, inf = null;
    // (Boo pops up where the clock was, once the answer shows; with no clock the spot shows ∞. The clock shows the full
    // time and starts once all four answers are on the screen.)
    const tw = K.el('div', 'tq-timer boo-slot', mid);
    if (o.sec) ring = K.ring(tw, o.sec, true);
    else inf = K.el('span', 'inf', tw, '∞');
    // (the fastest player, or "nobody goes out", shows here: in the open space just above the question, never on it)
    const fx = K.el('div', 'tq-fx', main);
    const qw = K.el('div', 'tq-qw in', main);
    const len = String(o.text || '').length;
    const qb = K.el('div', 'tq-q' + (len > 110 ? ' xlong' : len > 64 ? ' long' : ''), qw);
    const q = K.el('span', '', qb, o.text);
    // (the question first; then the four answers pop in one by one)
    const cells = await answersGrid(K, main, o.opts, true, true);
    await tqLadder(K, body, o);
    fitTq(body);
    async function showAnswers(gap) {
      for (const c of cells) { if (K.over()) break; c.node.classList.remove('pre'); c.node.classList.add('pop'); await K.sleep(gap); }
    }
    return { body, main, board, ring, inf, q, fx, cells, showAnswers };
  }
  // (everything on one screen: if the question screen is still too tall for this one, like four players on a short
  // screen, the question and answers get smaller, then the scoreboard's rows and the clock)
  function fitTq(body) {
    const st = body.parentElement;
    if (!st) return;
    const over = () => st.scrollHeight > st.clientHeight + 1;
    for (const k of ['packed', 'crowd', 'squeeze']) { if (!over()) return; body.classList.add(k); }
  }
  // before each question: which one it is, big, while its sound plays ("every 5 questions" on the 1st, 5th, 10th...,
  // "next question" on the others), with a ribbon for the last two
  async function tqIntro(K, o) {
    const body = K.view(null);
    body.classList.add('tqi');
    if (o.big || o.last) K.el('div', 'tqi-rays', body);
    const box = K.el('div', 'tqi-box' + (o.big ? ' big' : '') + (o.last ? ' fin' : ''), body);
    const hex = K.el('div', 'tqi-hex', box);
    K.el('b', '', hex, K.num(o.num));
    // (a race has no last question: it goes on until someone gets there)
    K.el('div', 'tqi-t', box, o.total ? await K.tr('Question {n} / {total}', { n: K.num(o.num), total: K.num(o.total) }) : await K.tr('Question {n}', { n: K.num(o.num) }));
    const cat = o.q.c ? await K.tr(o.q.c) : '', dif = DIFF[o.q.d] ? await K.tr(DIFF[o.q.d]) : '';
    if (cat || dif) K.el('div', 'tqi-c caps', box, [cat, dif].filter(Boolean).join(' · '));
    if (o.last) K.el('div', 'tqi-rib', box, await K.tr(o.race ? 'One more right answer wins!' : o.last === 1 ? 'Last question!' : 'Last 2 questions!'));
  }
  // which third of the game a question is in (its tune, and its level in an "easy to hard" game): for 15 questions
  // 1-5, 6-10 and 11-15; for any other number, three parts as equal as they can be
  function stageOf(i, n) {
    const e = Math.ceil(n / 3), h = Math.floor(n / 3), m = n - e - h;
    return i < e ? 'easy' : i < e + m ? 'medium' : 'hard';
  }
  async function tqBoard(K, parent, o, meta) {
    const n = K.players().length, few = n <= 4;
    const cols = few ? 1 : n <= 10 ? 2 : n <= 15 ? 3 : n <= 20 ? 4 : 5;
    const rowsN = Math.max(1, Math.ceil(n / cols));
    const b = K.el('div', 'tq-board ' + (few ? 'few' : 'many') + (cols > 2 ? ' wide' : '') + (rowsN > 5 ? ' tight' : ''), parent);
    const hd = K.el('div', 'tq-bh', b);
    K.el('b', '', hd, await K.tr('Scoreboard'));
    const hr = K.el('span', few ? 'caps' : '', hd, few ? await K.tr('Score') : '');
    const list = K.el('div', 'tq-rows', b);
    if (!few) { list.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))'; list.style.gridTemplateRows = 'repeat(' + rowsN + ', auto)'; }
    const W = {};
    for (const [k, t] of [['in', 'Locked in'], ['think', 'thinking'], ['out', 'Out'], ['right', 'Right!'], ['miss', 'Missed']]) W[k] = await K.tr(t);
    const modeT = await K.tr((TRIVIA_MODES.find(m => m[0] === o.mode) || TRIVIA_MODES[0])[1]);
    const asked = new Set(o.live.map(p => p.id));
    if (!few) meta.textContent = modeT + ' · ' + (await K.tr('{n} players', { n }));
    // (a line that changes with every answer: right away, then in Chrome's translation when that comes)
    const put = (node, text, vars, before) => {
      const tag = text + JSON.stringify(vars);
      node._want = tag;
      node.textContent = before + K.f(text, vars);
      Promise.resolve(K.tr(text, vars)).then(t => { if (node._want === tag) node.textContent = before + t; }).catch(() => {});
    };
    const goal = Math.max(1, o.goal || 1);
    const rows = new Map();
    const row = p => {
      let r = rows.get(p.id);
      if (r) return r;
      const tm = teamOf(K, p), color = tm ? tm[2] : p.color;
      r = K.el('div', 'tq-p', list);
      const av = K.el('span', 'av', r);
      av.style.setProperty('--pc', color);
      const im = K.el('img', '', av); im.src = K.avatarUrl(p); im.alt = '';
      K.el('i', 'ok', av, '✓');
      K.el('b', '', r, p.name);
      if (few) { const bar = K.el('span', 'bar', r); r._fill = K.el('i', '', bar); r._fill.style.background = color; }
      r._h = K.el('span', 'hearts', r);
      if (few) r._st = K.el('span', 'st', r);
      r._pts = K.el('span', 'pts', r);
      rows.set(p.id, r);
      return r;
    };
    // answered: who has answered this question; res (after it): right, miss or out for each player
    const draw = (answered, res) => {
      const ps = K.players().slice().sort((a, c) => (c.score - a.score) || ((a.out ? 1 : 0) - (c.out ? 1 : 0)));
      // (someone who left is off the board; someone who joined is on it)
      for (const [id, r] of rows) if (!ps.some(p => p.id === id)) { r.remove(); rows.delete(id); }
      if (!few) list.style.gridTemplateRows = 'repeat(' + Math.max(1, Math.ceil(ps.length / cols)) + ', auto)';
      for (const p of ps) {
        const r = row(p);
        list.appendChild(r);
        const did = !!(answered && answered.has(p.id));
        r.classList.toggle('done', did);
        r.classList.toggle('out', !!p.out);
        r._pts.textContent = K.num(p.score);
        r._h.textContent = o.mode === 'lives' ? '♥'.repeat(Math.max(0, p.lives)) : '';
        if (r._fill) r._fill.style.width = Math.max(3, Math.min(100, 100 * p.right / goal)) + '%';
        if (r._st) {
          const st = res ? res.get(p.id) || (p.out ? 'out' : '') : p.out ? 'out' : !asked.has(p.id) ? '' : did ? 'in' : 'think';
          r._st.className = 'st ' + st;
          r._st.textContent = st ? W[st] : '';
        }
      }
      if (answered) {
        const x = [...answered].filter(id => asked.has(id)).length;
        if (few) put(meta, '{n} of {total} answered', { n: x, total: asked.size }, modeT + ' · ');
        else put(hr, '{n} of {total} answered', { n: x, total: asked.size }, '');
      }
    };
    draw(new Set());
    return { node: b, draw };
  }
  // a race's ladder: the finish line on top, and each player's face on the step they've reached (their right answers
  // so far). Up to 10 steps: racing to 15 or 20, a step is two right answers.
  function raceLadder(K, lad, target) {
    const box = K.el('div', 'tq-steps race', lad);
    const per = target > 10 ? 2 : 1, rows = Math.ceil(target / per);
    const ps = K.players().slice().sort((a, b) => b.right - a.right);
    const lead = ps.length ? ps[0].right : 0;
    for (let k = rows; k >= 1; k--) {
      const hi = Math.min(target, k * per), lo = (k - 1) * per + 1;
      const here = ps.filter(p => p.right >= lo && p.right <= hi);
      const r = K.el('div', (k === rows ? 'mile fin' : '') + (lead >= lo && lead <= hi ? ' now' : lead > hi ? ' past' : ''), box);
      K.el('b', '', r, (k === rows ? '🏁 ' : '') + K.num(hi));
      const f = K.el('span', 'faces', r);
      for (const p of here.slice(0, here.length > 4 ? 3 : 4)) { const im = K.el('img', '', f); im.src = K.avatarUrl(p); im.alt = ''; }
      if (here.length > 4) K.el('i', '', f, '+' + K.num(here.length - 3));
    }
  }
  async function tqLadder(K, parent, o) {
    const lad = K.el('div', 'tq-lad', parent);
    // the helpers (each player has each one once, on their phone): asking everyone waits until someone is out
    if (!o.family) {
      const life = K.el('div', 'tq-life', lad);
      const someoneOut = K.players().some(p => p.out);
      for (const [t, off] of [['50:50', false], ['Hint', false], ['For me', false], ['Ask all', !someoneOut]]) K.el('span', off ? 'off' : '', life, await K.tr(t));
      K.el('div', 'tq-note', lad, await K.tr(someoneOut ? 'Each helper works once.' : 'Ask everyone works once someone is out.'));
    }
    if (o.race) return raceLadder(K, lad, o.race);
    const steps = K.el('div', 'tq-steps', lad);
    const n = o.qs.length, cur = o.i;
    // (up to 15 steps show: with more questions, the ones around this one)
    const span = Math.min(n, 15);
    const from = Math.max(0, Math.min(cur - 4, n - span));
    for (let k = from + span - 1; k >= from; k--) {
      const d = o.qs[k] && o.qs[k].d;
      const mile = !!DIFF[d] && (k === n - 1 || !o.qs[k + 1] || o.qs[k + 1].d !== d);
      const r = K.el('div', (k === cur ? 'now' : k < cur ? 'past' : '') + (mile ? ' mile' : ''), steps);
      K.el('b', '', r, K.num(k + 1));
      if (k === cur) K.el('span', '', r, await K.tr('Now'));
      else if (mile) K.el('span', '', r, await K.tr(DIFF[d]));
    }
  }

  // =====================================================================
  // Trivia
  // =====================================================================
  const TRIVIA_MODES = [['most', 'Most correct', 'Nobody goes out. The most right answers wins.'], ['knockout', 'Knockout', 'One wrong answer and you are out. The last one standing wins.'],
    ['lives', '3 lives', 'Like Knockout, but you can miss twice. The third miss puts you out.'], ['race', 'Race to a number', 'The first player to get that many right wins.'],
    ['first', 'First right takes the point', 'Only the fastest right answer scores.'], ['family', 'Family mode', 'Easy questions, no timer, nobody goes out. The TV reads each question out loud.']];
  G({
    id: 'trivia', name: 'Trivia', emoji: '🧠', sub: 'Questions on the TV, answers on your phone.', teams: true, teamsWin: true,
    step: ['Tap {letters}', 'Answer on your phone before time runs out.'], deco: 'letters', helpers: ['Remove two', 'Hint', 'Answer it for me', 'Ask everyone'],
    // its own sounds on the TV (sound.js): the lobby tune, "every 5 questions" and "next question", a tune for each
    // third of the game and one for the last two questions, "correct" and "wrong", time's up, between questions, the winner
    sounds: ['theme', 'every5', 'next', 'easy', 'medium', 'hard', 'last2', 'correct', 'wrong', 'between', 'timesup', 'win', 'tSpin'],
    credit: 'Questions written by Blokvane.',
    // (the questions start loading in the lobby, while people join; and in a player's own language once they pick it)
    prep: lang => { for (const c of qCats(lang)) qFile(lang, c); },
    mlang: true,
    langPrep: lang => { for (const c of qCats(lang)) qFile(lang, c); },
    // (a race is everyone for themselves)
    teamsOn: s => s.mode !== 'race',
    // the host's phone sets the game up in these steps, then a last one to check it all and start
    steps: [{ t: 'Game mode', s: 'Mode', keys: ['lang', 'mode'] }, { t: 'Questions', keys: ['count', 'raceTo', 'level'] }, { t: 'Category', keys: ['cat', 'wheel'] },
      { t: 'Timing', s: 'Time', keys: ['sec', 'next', 'wait'] }, { t: 'Extras', keys: ['speed', 'teams', 'teamN'] }],
    rules: ['A question shows on the TV with four answers.', 'Tap your answer on your phone before time runs out.', 'Each helper works once: remove two, a hint, answer it for me, ask everyone.'],
    // the TV's lobby explains the mode the host picked, and changes as soon as they pick another
    spot: s => {
      const m = TRIVIA_MODES.find(x => x[0] === s.mode) || TRIVIA_MODES[0];
      const race = m[0] === 'race';
      const help = ['💡', '4 helpers on your phone, each works once'], allPlay = ['🙌', 'Nobody goes out: everyone plays to the end'];
      const teams = !!s.teams && !race;
      // (three short rules that add to the mode's own line; a tie for first ends with one number question, without teams)
      const tie = teams ? allPlay : ['🤝', 'A tie for first? A number question decides'];
      const bullets = {
        most: [s.speed ? ['⚡', 'Faster right answers score more'] : ['✅', 'Every right answer scores a point'], help, tie],
        knockout: [help, ['🤝', 'If everyone misses, nobody goes out'], ['🗳️', 'Players who are out help with Ask everyone']],
        lives: [['❤️', 'Everyone starts with 3 hearts'], ['💔', 'Each wrong answer costs a heart'], ['🏆', 'The last one with a heart left wins']],
        race: [['🎯', 'First to {n} right answers wins'], ['⚡', 'Two get there at once? The faster answer wins'], help],
        first: [allPlay, ['🎯', 'A wrong answer costs nothing'], help],
        family: [['🔊', 'The TV reads each question out loud'], ['🧸', 'Easy questions, great with kids'], allPlay]
      }[m[0]];
      const family = m[0] === 'family';
      const cat = s.wheel ? 'Category wheel' : catName(+s.cat) || 'Everything (mixed)';
      const facts = [race ? ['🎯', 'Race to {n}', { n: +s.raceTo }] : ['❓', '{n} questions', { n: family ? 10 : +s.count }], family || !+s.sec ? ['⏳', 'No timer'] : ['⏱️', '{n} s', { n: +s.sec }], ['🗂️', cat]];
      if (!family && ['easy', 'medium', 'hard'].includes(s.level)) facts.splice(1, 0, ['🎯', DIFF[s.level]]);
      if (teams) facts.push(['👥', 'Teams']);
      return { key: m[0], icon: { most: '🏆', knockout: '⚔️', lives: '❤️', race: '🏁', first: '⚡', family: '🏡' }[m[0]], label: 'Game mode', name: m[1], desc: m[2], bullets, vars: { n: +s.raceTo }, facts };
    },
    // (the categories this language has questions for: all of them)
    langOptions: { cat: (lang, opts) => { const have = qCats(lang); return opts.filter(o => o[0] === 0 || (have.length ? have.includes(o[0]) : BANK_CATS.has(o[0]))); } },
    settings: [
      { key: 'mode', label: 'Game mode', type: 'seg', look: 'list', options: TRIVIA_MODES, default: 'most' },
      // (a race has no number of questions: it goes on until someone gets there; Family mode always has 10)
      { key: 'count', label: 'How many questions', type: 'seg', options: [[10, '10'], [15, '15'], [20, '20'], [30, '30']], default: 15, when: ['mode', ['most', 'knockout', 'lives', 'first']] },
      { key: 'raceTo', label: 'Race to', type: 'seg', options: [[5, '5'], [10, '10'], [15, '15'], [20, '20']], default: 10, when: ['mode', 'race'], desc: 'The first player to get this many right answers wins. The questions keep coming until someone does.' },
      { key: 'level', label: 'Difficulty', type: 'seg', options: [['mix', 'Easy to hard', 'Starts easy and gets harder as you go.'], ['easy', 'Easy', 'Only easy questions. Great with kids.'],
        ['medium', 'Medium', 'Only medium questions.'], ['hard', 'Hard', 'Only hard questions, for quiz fans.']], default: 'mix', when: ['mode', '!family'] },
      { key: 'cat', label: 'Pick a category', type: 'seg', options: PK.cats.map(c => [c[0], c[1]]), default: 0 },
      { key: 'wheel', label: 'Category wheel', type: 'toggle', default: false, desc: 'A new category every 5 questions.' },
      { key: 'sec', label: 'Time to answer', type: 'seg', options: [[15, '15 s'], [20, '20 s'], [30, '30 s'], [0, 'No limit', 'No clock: each question waits until everyone answers. The host can show the answer any time.']], default: 20, when: ['mode', '!family'] },
      // (after each answer: the next question comes by itself after a wait the host picks, or when the host taps for it)
      { key: 'next', label: 'Next question', type: 'seg', options: [['auto', 'Automatic', 'The next question starts by itself after a short wait.'], ['host', 'The host starts it', 'The host taps Next question on their phone when everyone is ready.']], default: 'auto' },
      { key: 'wait', label: 'Wait before the next question', type: 'number', min: 1, max: 120, quick: [3, 5, 10, 15], unit: 'seconds', default: 5, when: ['next', 'auto'] },
      { key: 'speed', label: 'Speed points', type: 'toggle', default: false, desc: 'Faster right answers score more' },
      { key: 'teams', label: 'Teams', type: 'toggle', default: false, desc: 'Phones join a color team, and each team\'s points are added up.', when: ['mode', '!race'] },
      { key: 'teamN', label: 'How many teams', type: 'seg', options: [[2, '2'], [3, '3'], [4, '4']], default: 2, when: [['teams', true], ['mode', '!race']] }
    ],
    async tv(K) {
      const s = K.settings, family = s.mode === 'family', race = s.mode === 'race';
      // (a race goes on until someone gets there: this many questions only stops a race nobody can finish)
      const target = Math.max(1, +s.raceTo || 10);
      const n = family ? 10 : race ? target * 6 : +s.count;
      const LP = K.packs;
      // the questions: Blokvane's own, written in this language, picked at random for every game (easy, then medium,
      // then hard; or one level only), the ones this screen hasn't asked yet first. Never the same one twice in a game.
      const cat = s.wheel ? 0 : +s.cat;
      const level = family ? 'easy' : LV.includes(s.level) ? s.level : 'mix';
      const have = qCats(K.lang);
      let pool = (await Promise.all((cat && have.includes(cat) ? [cat] : have).map(c => qFile(K.lang, c)))).flat().filter(Boolean);
      if (!pool.length) pool = qBuiltIn(LP);
      const pk = qPicker(pool);
      // (a race gets harder as the leader gets closer: easy for the first third of the way, then medium, then hard)
      const lead = () => Math.max(0, ...K.players().map(p => p.right));
      const raceStage = () => { const r = lead(); return r < target / 3 ? 'easy' : r < 2 * target / 3 ? 'medium' : 'hard'; };
      const levels = race ? [] : qLevels(n, level);
      let qs = race ? [] : levels.map(d => pk.take(d, cat));
      if (qs.indexOf(null) >= 0) qs = qs.slice(0, qs.indexOf(null));
      const total = race ? 0 : qs.length;
      const wheelCats = P.shuffle(PK.cats.filter(c => c[0] && pool.some(q => q.cat === c[0]))).slice(0, 8);
      let wheelCat = 0, winner = null;
      const sec = family ? 0 : +s.sec;
      for (let i = 0; i < (race ? n : qs.length); i++) {
        if (K.over() || winner) break;
        const live = K.alive();
        if ((s.mode === 'knockout' || s.mode === 'lives') && K.players().length > 1 && live.length <= 1) break;
        // the category wheel: every 5 questions the TV spins for the next ones
        if (s.wheel && wheelCats.length && i >= 5 && (i - 5) % 5 === 0) {
          const wc = await wheel(K, wheelCats);
          wheelCat = wc[0];
          for (let j = i; j < Math.min(i + 5, qs.length); j++) qs[j] = pk.take(levels[j], wc[0]) || qs[j];
        }
        if (race) { qs[i] = pk.take(level === 'mix' ? raceStage() : level, wheelCat || cat); if (!qs[i]) break; }
        const q = qs[i];
        markAsked(q.id);
        // (the four answers in a new order every time: the same order on the TV and on every phone, in every language)
        const perm = P.shuffle([0, 1, 2, 3]);
        const src = [q.a, ...q.w];
        const opts = perm.map(j => src[j]);
        const ok = perm.indexOf(0);
        // (the words are translated before the clock starts; players who picked their own language get the question
        // and its answers in it, on their phone)
        const tq = await K.tr(q.q), tOpts = await Promise.all(opts.map(o => K.tr(o)));
        const trs = await qTrans(K, q, perm, live);
        const rightIn = id => { const t = trs && trs[K.langOf(id)]; return t ? t.o[ok] : tOpts[ok]; };
        // 1. its sound first ("every 5 questions" on the 1st, 5th, 10th..., "next question" on the others), while the
        // TV shows which question it is and the phones say "look at the TV"
        const num = i + 1, big = num === 1 || num % 5 === 0, loud = K.snd.on();
        // (the last two questions; in a race, when someone needs just one more right answer)
        const lastN = race ? (lead() >= target - 1 ? 1 : 0) : (qs.length - i <= 2 ? qs.length - i : 0);
        K.wait();
        K.snd.music(null, { fadeOut: 0.8 });
        K.snd.sting(big ? 'every5' : 'next');
        await tqIntro(K, { num, total, q, big, last: lastN, race });
        await K.sleep(loud ? (big ? 5000 : 4700) : 1800);
        if (K.over()) break;
        // 2. the question, then its four answers one by one. Its tune: easy, medium or hard for the first, middle and
        // last third of the game (a race: of the way to the finish), the "last two questions" tune at the end (softer in
        // Family mode, under the voice that reads the question)
        const v = await tqView(K, { qs, i, q, text: tq, opts: tOpts, sec, mode: s.mode, family, live, goal: race ? target : qs.length, race: race ? target : 0 });
        const qt = v.q, cells = v.cells;
        K.snd.music(lastN ? 'last2' : race ? raceStage() : stageOf(i, qs.length), { fadeIn: 1.2, vol: family ? 0.4 : 1 });
        if (family) K.speak(qt.textContent);
        await K.sleep(family ? 2600 : Math.min(2600, 1100 + [...tq].length * 14));
        await v.showAnswers(family ? 700 : 520);
        if (K.over()) break;
        // 3. everything is on the screen: the clock starts now
        if (v.ring) v.ring.go();
        const answered = new Set();
        let qn = -1;
        // (someone leaves, comes back or joins: the scoreboard shows who's playing now)
        const offPlayers = K.onPlayers(() => v.board.draw(answered));
        // the helpers (each player, each once): remove two, a hint, answer it for me, ask everyone (the players who are out vote)
        const outs = () => K.players().filter(p => p.out);
        const offHelp = K.on('help', async (m, p) => {
          if (+m.n !== qn || p.out || p.helpers[m.h] || !['fifty', 'hint', 'auto', 'ask'].includes(m.h)) return;
          const lg = K.langOf(p.id), mine = trs && lg ? trs[lg] : null;
          if (m.h === 'ask' && !outs().length) { K.sayTo(p.id, { k: 'helped', n: qn, h: 'ask', no: true, note: await K.trFor(lg, 'Ask everyone works once someone is out.') }); return; }
          p.helpers[m.h] = true;
          if (m.h === 'fifty') { const wrong = P.shuffle([0, 1, 2, 3].filter(x => x !== ok && x < opts.length)).slice(0, 2); K.sayTo(p.id, { k: 'helped', n: qn, h: 'fifty', hide: wrong }); }
          else if (m.h === 'hint') K.sayTo(p.id, { k: 'helped', n: qn, h: 'hint', text: await hint(K, q, opts[ok], mine ? mine.o[ok] : tOpts[ok], mine ? lg : '') });
          else if (m.h === 'auto') K.sayTo(p.id, { k: 'helped', n: qn, h: 'auto', pick: ok });
          else if (m.h === 'ask') {
            // (the players who vote see it in their own language too)
            let vtr = null;
            for (const x of outs()) {
              const xl = K.langOf(x.id);
              if (xl && trs && trs[xl] && !(vtr && vtr[xl])) { vtr = vtr || {}; vtr[xl] = Object.assign({}, trs[xl], { p: await K.trFor(xl, 'Help {name}: which answer is right?', { name: p.name }) }); }
            }
            const ex = { letters: true, helpOnly: true };
            if (vtr) ex.tr = vtr;
            const votes = await K.ask({ kind: 'choice', prompt: await K.tr('Help {name}: which answer is right?', { name: p.name }), opts: tOpts, sec: 10, who: outs().map(x => x.id), extra: ex });
            const tally = opts.map((_, j) => [...votes.values()].filter(a => +a.v === j).length);
            K.sayTo(p.id, { k: 'helped', n: qn, h: 'ask', tally });
          }
        });
        // (no time limit: the question stays open until everyone answers, or the host shows the answer from their phone.
        // A phone that leaves meanwhile doesn't hold it up. The phones get the four answers, not the question: that one
        // is on the TV, unless a player picked another language.)
        const open = !family && !sec;
        const extra = { letters: true, helpers: !family, tv: 1 };
        if (trs) extra.tr = trs;
        const asking = K.ask({ kind: 'choice', prompt: '', opts: tOpts, sec, open, extra, onAns: id => { answered.add(id); v.board.draw(answered); } });
        qn = K.qn();
        const stopReveal = open ? hostReveal(K, qn) : null;
        // (the clock hits zero with answers missing: the tune stops and "time's up" plays)
        let closed = false;
        const tuT = sec ? setTimeout(() => { if (closed || K.over() || answered.size >= live.length) return; K.snd.music(null, { fadeOut: 0.25 }); K.snd.sting('timesup'); }, sec * 1000) : 0;
        const answers = await asking;
        closed = true; clearTimeout(tuT);
        if (stopReveal) stopReveal();
        offHelp();
        if (v.ring) v.ring.stop();
        if (v.inf) v.inf.classList.add('done');
        // (a player who left during the question isn't counted: no point, and nothing lost)
        const inPlay = live.filter(p => answers.has(p.id) || !p.away);
        // 4. the sound first, then the right answer: "correct" when anyone got it, "wrong" when everyone playing missed
        const rightN = [...answers.values()].filter(a => +a.v === ok).length;
        K.snd.music(null, { fadeOut: 0.3 });
        K.snd.sting(rightN ? 'correct' : 'wrong');
        await K.sleep(K.snd.on() ? (rightN ? 1000 : 700) : 250);
        cells.forEach((c, j) => c.node.classList.add(j === ok ? 'right' : 'dim'));
        for (let j = 0; j < opts.length; j++) showWho(K, cells[j], [...answers].filter(([, a]) => +a.v === j).map(([id]) => id));
        let first = null;
        // (everyone still in got it wrong at once: nobody goes out or loses a life this time)
        const spare = (s.mode === 'knockout' || s.mode === 'lives') && inPlay.length > 1 && !inPlay.some(p => answers.has(p.id) && +answers.get(p.id).v === ok);
        if (spare) K.el('div', 'pill', v.fx, await K.tr('Everyone missed that one, so nobody goes out.'));
        const res = new Map();
        for (const p of inPlay) {
          const a = answers.get(p.id);
          const good = a && +a.v === ok;
          let pts = 0;
          if (good) {
            p.right++; p.streak++;
            if (!first || a.ms < first.ms) first = { p, ms: a.ms };
            if (s.mode !== 'first') pts = s.speed ? K.award(p, 100, a.ms, sec || 30) : (p.score += 1, 1);
          } else {
            p.streak = 0;
            if (s.mode === 'knockout' && !spare) p.out = true;
            if (s.mode === 'lives' && !spare) { p.lives--; if (p.lives <= 0) p.out = true; }
          }
          K.result(p.id, { ok: good, pts, score: p.score, out: p.out, lives: p.lives, right: rightIn(p.id) });
          res.set(p.id, good ? 'right' : p.out ? 'out' : 'miss');
        }
        if (first) { if (s.mode === 'first') { first.p.score += 1; K.result(first.p.id, { ok: true, pts: 1, score: first.p.score, first: true, right: rightIn(first.p.id) }); } await firstBadge(K, v.fx, first.p, first.ms); }
        // (a race: whoever got there wins; two on the same question, the faster answer)
        if (race) {
          const msOf = p => (answers.get(p.id) || { ms: 1e9 }).ms;
          const done = inPlay.filter(p => p.right >= target).sort((a, b) => msOf(a) - msOf(b));
          if (done.length) { winner = done[0]; K.el('div', 'pill', v.fx, '🏁 ' + await K.tr('{name} crossed the finish line!', { name: '⁨' + winner.name + '⁩' })); }
        }
        K.boo(rightN >= inPlay.length / 2 ? 'happy' : 'sad');
        v.board.draw(null, res);
        offPlayers();
        // the next question: by itself after the wait the host picked, or when the host taps Next question on their phone
        // (after the last question, or once the game is decided, the winner comes after a short pause)
        const last = !!winner || (!race && i >= qs.length - 1) || (race && i >= n - 1) || ((s.mode === 'knockout' || s.mode === 'lives') && K.players().length > 1 && K.alive().length <= 1);
        // (between questions, while the answer shows and the next one is on its way, its own tune plays, once the
        // "correct" or "wrong" sound is over; it fades out when the next question's sound starts. After the last one it
        // plays until the winner's fanfare.)
        K.snd.music('between', { delay: 2.2, fadeIn: 1.5, fadeOut: 0.6 });
        if (last) await K.sleep(5000);
        else if (s.next === 'host') await hostNext(K, v, qn);
        else await nextIn(K, v, Math.max(1, Math.min(120, Math.round(+s.wait) || 5)));
      }
      // the winner first: a race's, or the most points (and a tie for first: one number question, the closest guess wins)
      let ps = K.players().slice().sort((a, b) => b.score - a.score);
      if (race) ps = K.players().slice().sort((a, b) => (b === winner) - (a === winner) || b.right - a.right || b.score - a.score);
      if (!winner && !K.teamsOn() && ps.length > 1 && ps[0].score === ps[1].score && !K.over()) {
        const tied = ps.filter(p => p.score === ps[0].score);
        const [qq, real] = P.pick(LP ? LP.numbers : PK.numbers);
        // (the same show as a question: its sound first, then the question on the TV, then the clock; the "last two
        // questions" tune under it, and "correct" before the answer)
        K.wait();
        K.snd.music(null, { fadeOut: 0.8 });
        K.snd.sting('every5');
        const v = await qView(K, { title: await K.tr('Tie-breaker!'), sub: await K.tr('The closest guess wins'), sec: 25, idle: true });
        await K.sleep(K.snd.on() ? 5000 : 1800);
        K.el('div', 'question', v.main, await K.tr(qq));
        K.snd.music('last2', { fadeIn: 1.2 });
        await K.sleep(1500);
        if (v.ring) v.ring.go();
        const got = await K.ask({ kind: 'number', prompt: '', sec: 25, who: tied.map(p => p.id), extra: { tv: 1 } });
        if (v.ring) v.ring.stop();
        K.snd.music(null, { fadeOut: 0.3 });
        K.snd.sting('correct');
        await K.sleep(K.snd.on() ? 1000 : 250);
        let best = null;
        for (const [id, a] of got) { const d = Math.abs(+a.v - real); if (!best || d < best.d || (d === best.d && a.ms < best.ms)) best = { id, d, ms: a.ms, v: +a.v }; }
        K.el('div', 'question', v.main, await K.tr('The answer: {x}', { x: K.num(real) }));
        if (best) { const p = K.player(best.id); p.score += 1; await firstBadge(K, v.main, p, best.ms); }
        K.snd.music('between', { delay: 2.2, fadeIn: 1.5 });
        await K.sleep(4000);
        ps = K.players().slice().sort((a, b) => b.score - a.score);
      }
      // (with teams on, the kit adds up each team and crowns the team)
      return ps;
    }
  });
  // with no time limit, the host can show the answer whenever they like: their phone gets a Show the answer button once
  // they have answered (sent again every few seconds, for a phone that just came back or a new host)
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
  // the host goes on when everyone is ready: their phone gets a Next question button (sent again every few seconds, so a
  // phone that just came back, or a new host, has it too)
  async function hostNext(K, v, n) {
    K.el('div', 'pill nextp', v.fx, '⏸️ ' + await K.tr('Waiting for the host to start the next question'));
    const label = await K.tr('Next question');
    let go = false;
    const off = K.on('next', (m, p) => { if (+m.n === n && K.isHost(p.id)) go = true; });
    // (if the host's phone is gone, the host passes to someone who's here, and their phone gets the button)
    K.hostWait(true);
    for (let k = 0; !go && !K.over(); k++) {
      if (k % 8 === 0) { const h = K.players().find(p => K.isHost(p.id)); if (h) K.sayTo(h.id, { k: 'nextq', n, label }); }
      await K.sleep(500);
    }
    K.hostWait(false);
    off();
  }
  // a hint: Chrome's built-in AI on computers that have it (English games), or simply the first letter (and how many
  // words, where words have spaces between them)
  async function hint(K, q, answer, shown, lg) {
    if (K.lang === 'en' && !lg) {
      try {
        const LM = self.LanguageModel || (self.ai && self.ai.languageModel);
        if (LM && (!LM.availability || (await LM.availability()) === 'available')) {
          const sess = await (LM.create ? LM.create() : LM.createTextSession());
          const t = await sess.prompt(`Give a short, kind hint (under 15 words) for this quiz question. Never say the answer or any word of it.\nQuestion: ${q.q}\nAnswer: ${answer}`);
          if (t && !P.norm(t).includes(P.norm(answer))) return String(t).slice(0, 140);
        }
      } catch (e) {}
    }
    // (for a player who reads another language: in theirs, from the answer in theirs)
    const a = String(shown || answer).trim();
    const words = (lg || K.lang) === 'zh' ? 1 : a.split(/\s+/).length;
    const t = words > 1 ? 'It starts with "{c}" and has {n} words.' : 'It starts with "{c}".';
    return lg ? K.trFor(lg, t, { c: firstLetter(a), n: words }) : K.tr(t, { c: firstLetter(a), n: words });
  }
  // the category wheel, every 5 questions: drawn exactly as its design (wheel.js; every phone shows the same wheel,
  // turning with it), with the categories of its eight colors beside it. Where it lands is the next round's category.
  async function wheel(K, cats) {
    const W = window.BVWHEEL;
    if (!W) return P.pick(cats);
    // (fewer than eight categories with questions left: they take turns around the wheel)
    const segs = [0, 1, 2, 3, 4, 5, 6, 7].map(i => cats[i % cats.length]);
    const en = segs.map(c => c[1]), names = await Promise.all(en.map(x => K.tr(x)));
    const body = K.view(null);
    body.classList.add('tws');
    const side = K.el('div', 'tws-side', body);
    K.el('h1', '', side, await K.tr('Category wheel'));
    const st = K.el('p', 'tws-st', side, await K.tr('Spinning for the next round...'));
    const leg = K.el('div', 'tws-leg', side);
    const chips = names.map((nm, i) => { const x = K.el('div', 'tws-c', leg); x.style.setProperty('--cc', W.COLORS[i]); K.el('i', '', x); K.el('span', '', x, nm); return x; });
    const wh = W.make(K.el('div', 'tws-wheel', body));
    const pick = Math.floor(Math.random() * 8);
    wh.ready(pick);
    // (the phones: the same wheel, standing where the TV's stands, then turning with it)
    const tw = { s: W.startFor(pick), c: en, t: names };
    const say = await K.tr('Category wheel');
    K.wait(say, { tw });
    await K.sleep(1800);
    if (K.over()) { wh.stop(); return segs[pick]; }
    K.wait(say, { tw: Object.assign({ go: 1, p: pick }, tw) });
    // (its sound: the design's clicks, one on each line as it passes the pin, and its little fanfare when it stops; the
    // tune steps back a little under it, like under Guess It Right!'s moments)
    K.snd.fx('tSpin', { duck: 0.65 });
    await wh.spin();
    chips.forEach((c, i) => c.classList.add(en[i] === en[pick] ? 'win' : 'off'));
    st.textContent = '';
    const res = K.el('div', 'tws-res', side, names[pick]);
    res.style.setProperty('--cc', W.COLORS[pick]);
    await K.sleep(2600);
    wh.stop();
    return segs[pick];
  }

  // =====================================================================
  // Boo Who?
  // =====================================================================
  G({
    id: 'boowho', name: 'Boo Who?', emoji: '👻', sub: '"Who is most likely to..." No right answers, just laughs.',
    step: ['Vote for a player', 'Tap who fits the question best. You can pick yourself.'], deco: '👻👑🗳️😂',
    rules: ['The TV asks who is most likely to do something.', 'Tap the person who fits best on your phone (you can pick yourself).', 'You score when you vote with the most people.'],
    settings: [{ key: 'pack', label: 'Questions', type: 'seg', options: [['family', 'Family (safe for kids)'], ['friends', 'Friends'], ['work', 'Work'], ['holidays', 'Holidays']], default: 'family' },
      rounds(10, [10, 20, 30]), { key: 'votes', label: 'Votes', type: 'seg', options: [['secret', 'Keep them secret', 'The TV only shows how many votes each player got.'], ['show', 'Show who voted for whom', 'After each round, the TV shows who voted for whom.']], default: 'secret' },
      { key: 'own', label: 'Your own questions (one on each line)', type: 'text', default: '' }],
    async tv(K) {
      const s = K.settings;
      const own = String(s.own || '').split(/\n|\|/).map(x => P.safe(x, 90)).filter(Boolean);
      // (English packs are the "...most likely to" part; every other language has whole questions of its own)
      const LP = K.packs;
      const packQs = LP ? (LP.boowho[s.pack] || LP.boowho.family) : (PK.boowho[s.pack] || PK.boowho.family).map(x => 'Who is most likely to ' + x + '?');
      const pool = P.shuffle(own.length ? own.concat(packQs) : packQs);
      for (let r = 0; r < Math.min(+s.rounds, pool.length); r++) {
        const ps = K.players();
        if (ps.length < 2 || K.over()) break;
        const line = LP || /^(who|who's|who is)/i.test(pool[r]) || own.includes(pool[r]) ? pool[r] : 'Who is most likely to ' + pool[r] + '?';
        const v = await qView(K, { title: await K.tr('Round {n}', { n: r + 1 }), sec: 25 });
        K.el('div', 'question', v.main, await K.tr(line));
        const got = await K.ask({ kind: 'players', prompt: await K.tr(line), opts: ps.map(p => ({ id: p.id, name: p.name, ph: !!p.photo, av: p.av })), sec: 25, onAns: () => {} });
        if (v.ring) v.ring.stop();
        // the votes, one at a time, flying into place
        const counts = new Map();
        const grid = K.el('div', 'players', v.main);
        const cards = new Map();
        for (const p of ps) { const c = K.el('div', 'player', grid); const av = K.el('div', 'av', c); const im = K.el('img', '', av); im.src = K.avatarUrl(p); im.alt = ''; K.el('b', '', c, p.name); const n = K.el('span', 'pill', c, '0'); cards.set(p.id, { c, n }); }
        const by = new Map();
        for (const [voter, a] of got) {
          if (!cards.has(a.v)) continue;
          counts.set(a.v, (counts.get(a.v) || 0) + 1);
          if (!by.has(a.v)) by.set(a.v, []);
          by.get(a.v).push((K.player(voter) || {}).name || '');
          const cd = cards.get(a.v);
          // (with "show who voted for whom": every name that voted for this player)
          cd.n.textContent = String(counts.get(a.v)) + (s.votes === 'show' ? ': ' + by.get(a.v).filter(Boolean).join(', ') : '');
          cd.c.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 400 });
          P.sfx('pop');
          await K.sleep(700);
        }
        const top = Math.max(0, ...counts.values());
        const winners = [...counts].filter(([, n]) => n === top && top > 0).map(([id]) => id);
        for (const id of winners) { const cd = cards.get(id); K.el('span', 'crown', cd.c, '👑'); cd.c.classList.add('done'); }
        K.boo('laugh');
        for (const [voter, a] of got) { const good = winners.includes(a.v); const p = K.player(voter); if (good) p.score += 1; K.result(voter, { ok: good, pts: good ? 1 : 0, score: p.score }); }
        v.board.draw();
        await K.sleep(4500);
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });

  // (Where in the World? has its own file: world-game.js)


  // =====================================================================
  // Fake Out
  // =====================================================================
  G({
    id: 'fakeout', name: 'Fake Out', emoji: '🎭', sub: 'Make up a fake answer, then spot the real one.',
    step: ['Fool everyone', 'Write a fake answer, then find the real one.'], deco: '🎭🤥🕵️✅',
    rules: ['The TV asks a strange question.', 'Type a fake answer that sounds real (stuck? tap "Give me a fake").', 'Vote for the real one. You score for finding it, and for everyone your fake fooled.'],
    settings: [rounds(8, [5, 8, 12]), { key: 'topic', label: 'Topics', type: 'seg', options: [['mix', 'A mix'], ['animals', 'Animals'], ['history', 'History'], ['food', 'Food'], ['science', 'Science'], ['words', 'Words']], default: 'mix' },
      { key: 'fooled', label: 'Show who fooled whom', type: 'toggle', default: true }, KIDS('Pick a fake answer from three. No typing, no timer.')],
    async tv(K) {
      const s = K.settings;
      const LP = K.packs;
      const FO = LP ? LP.fakeout : PK.fakeout;
      const mine = FO.filter(x => s.topic === 'mix' || !s.topic || x[3] === s.topic);
      let qs = P.shuffle(mine.map(x => ({ q: x[0], a: x[1], w: x[2] })));
      // (a topic with too few of its own: in English, hard questions from the database on that topic; then other topics)
      if (qs.length < +s.rounds && !LP) { const more = await otdb({ amount: 20, diff: 'hard', cat: ({ animals: 27, history: 23, science: 17 })[s.topic] || 0 }); qs = qs.concat(more.map(x => ({ q: x.q, a: x.a, w: x.w }))); }
      if (qs.length < +s.rounds) qs = qs.concat(P.shuffle(FO.filter(x => !mine.includes(x)).map(x => ({ q: x[0], a: x[1], w: x[2] }))));
      qs = qs.slice(0, +s.rounds);
      for (let r = 0; r < qs.length; r++) {
        if (K.over()) break;
        const q = qs[r], last = r === qs.length - 1, mul = last ? 2 : 1;
        const ps = K.players();
        let v = await qView(K, { title: await K.tr(last ? 'Round {n} / {total} · double points!' : 'Round {n} / {total}', { n: r + 1, total: qs.length }), sec: s.kids ? 0 : 45 });
        K.el('div', 'question', v.main, await K.tr(q.q));
        K.el('div', 'muted', v.main, await K.tr('Write a fake answer on your phone that sounds real.')).style.fontSize = 'calc(3 * var(--u))';
        const fakes = await K.ask(s.kids ? { kind: 'choice', prompt: await K.tr('Pick a fake answer'), opts: await Promise.all(q.w.map(x => K.tr(x))), sec: 0 }
          : { kind: 'text', prompt: await K.tr(q.q), sec: 45, extra: { max: 40, suggest: await Promise.all(q.w.map(x => K.tr(x))), place: await K.tr('A believable fake answer') } });
        // the fakes (filtered, never the real answer, no doubles) mixed with the real one
        const realT = await K.tr(q.a);
        const opts = [{ t: realT, by: null }];
        for (const [id, a] of fakes) {
          let t = s.kids ? (await K.tr(q.w[+a.v] || q.w[0])) : P.safe(a.v, 40);
          if (!t || P.close(t, realT) || P.close(t, q.a)) continue;
          const same = opts.find(o => o.t.toLowerCase() === t.toLowerCase());
          if (same) { if (same.by) same.by.push(id); continue; }
          opts.push({ t, by: [id] });
        }
        while (opts.length < 3) { const w = q.w.find(x => !opts.some(o => o.t === x)); if (!w) break; opts.push({ t: await K.tr(w), by: [] }); }
        const mix = P.shuffle(opts).slice(0, 6);
        v = await qView(K, { title: await K.tr('Which one is real?'), sec: 25 });
        K.el('div', 'question', v.main, await K.tr(q.q));
        const cells = await answersGrid(K, v.main, mix.map(o => o.t));
        const own = {};
        mix.forEach((o, i) => { for (const id of o.by || []) own[id] = i; });
        const votes = await K.ask({ kind: 'choice', prompt: await K.tr('Which one is real?'), opts: mix.map(o => o.t), sec: 25, extra: { letters: true, own } });
        if (v.ring) v.ring.stop();
        const realI = mix.findIndex(o => !o.by);
        cells.forEach((c, j) => c.node.classList.add(j === realI ? 'right' : 'dim'));
        for (let j = 0; j < mix.length; j++) showWho(K, cells[j], [...votes].filter(([, a]) => +a.v === j).map(([id]) => id));
        const gain = new Map();
        for (const [id, a] of votes) {
          const pick = mix[+a.v];
          if (!pick) continue;
          if (!pick.by) gain.set(id, (gain.get(id) || 0) + 2 * mul);
          else for (const author of pick.by) if (author !== id) gain.set(author, (gain.get(author) || 0) + 1 * mul);
        }
        for (const p of ps) { const g = gain.get(p.id) || 0; p.score += g; K.result(p.id, { ok: votes.has(p.id) && +votes.get(p.id).v === realI, pts: g, score: p.score, right: realT }); }
        if (s.fooled) {
          for (let j = 0; j < mix.length; j++) {
            const o = mix[j];
            if (!o.by || !o.by.length) continue;
            const fooled = [...votes].filter(([, a]) => +a.v === j).map(([id]) => (K.player(id) || {}).name).filter(Boolean);
            if (fooled.length) K.el('div', 'pill', cells[j].node, await K.tr('{a} fooled {b}', { a: o.by.map(id => (K.player(id) || {}).name).join(', '), b: fooled.join(', ') })).style.cssText = 'position:absolute;bottom:calc(-1.6 * var(--u));inset-inline-start:calc(2 * var(--u));font-size:calc(2 * var(--u));background:#000a';
          }
        }
        K.boo('laugh');
        v.board.draw();
        await K.sleep(6500);
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });

  // =====================================================================
  // Emoji Riddles
  // =====================================================================
  G({
    id: 'emoji', name: 'Emoji Riddles', emoji: '🦁', sub: 'Guess the movie, food or saying from a row of emoji.',
    step: ['Guess the emoji', 'Pick or type what the emoji mean.'], deco: '🦁🍕🎬💬',
    rules: ['A row of emoji shows on the TV.', 'Pick or type what they mean. Faster scores more.', 'In the last round, everyone makes their own riddle.'],
    settings: [{ key: 'pack', label: 'Pack', type: 'seg', options: [['mix', 'A mix'], ['movies', 'Movies'], ['food', 'Food'], ['animals', 'Animals'], ['places', 'Places'], ['sayings', 'Sayings'], ['kids', 'Kids\' shows']], default: 'mix' },
      { key: 'answers', label: 'Answers', type: 'seg', options: [['choices', 'Four choices', 'Pick from four answers. The easiest way to play.'], ['typing', 'Typing', 'Type the answer. Small typos still count.']], default: 'choices' }, rounds(10, [10, 15, 20]),
      { key: 'make', label: 'Last round: make your own', type: 'toggle', default: true, desc: 'At the end, everyone makes a riddle and the others guess it.' }, KIDS('Simple riddles with four choices, and no timer.')],
    async tv(K) {
      const s = K.settings;
      // (every language has riddles of its own: its films, its sayings, its kids' shows)
      const EM = K.packs ? K.packs.emoji : PK.emoji;
      const PACK = { movies: 'Movies', food: 'Food', animals: 'Animals', places: 'Places', sayings: 'Sayings', kids: 'Kids\' shows' };
      const packs = (s.kids ? ['kids', 'animals', 'food'] : s.pack === 'mix' ? Object.keys(EM) : [s.pack]).filter(k => Array.isArray(EM[k]));
      const pool = P.shuffle(packs.flatMap(k => EM[k].map(x => ({ e: x[0], a: x[1], pack: k }))));
      const typing = s.answers === 'typing' && !s.kids;
      const sec = s.kids ? 0 : 20;
      for (let r = 0; r < Math.min(+s.rounds, pool.length); r++) {
        if (K.over()) break;
        const it = pool[r];
        const v = await qView(K, { title: await K.tr('Riddle {n}', { n: r + 1 }), sub: await K.tr(PACK[it.pack] || it.pack), sec });
        const big = K.el('div', 'center', v.main);
        const em = K.el('div', 'big', big, it.e); em.style.fontSize = 'calc(20 * var(--u))';
        em.animate([{ transform: 'scale(.4) rotate(-10deg)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1 }, { transform: 'scale(1)' }], { duration: 700, easing: 'cubic-bezier(.2,1.4,.4,1)' });
        const ansT = await K.tr(it.a);
        let opts = [], ok = -1;
        if (!typing) { const others = P.shuffle(EM[it.pack].filter(x => x[1] !== it.a)).slice(0, 3).map(x => x[1]); opts = P.shuffle([it.a, ...others]); ok = opts.indexOf(it.a); await answersGrid(K, v.main, await Promise.all(opts.map(o => K.tr(o)))); }
        const askOnce = async (secs) => K.ask(typing ? { kind: 'text', prompt: it.e, sec: secs, extra: { max: 60, place: await K.tr('What is it?') } } : { kind: 'choice', prompt: it.e, opts: await Promise.all(opts.map(o => K.tr(o))), sec: secs, extra: { letters: true } });
        const isRight = a => typing ? (P.close(a.v, ansT) || P.close(a.v, it.a)) : +a.v === ok;
        let got = await askOnce(sec);
        // nobody? a hint, and one more try
        if (![...got.values()].some(isRight) && typing) {
          const zh = K.lang === 'zh', nw = zh ? [...ansT.replace(/\s+/g, '')].length : ansT.trim().split(/\s+/).length;
          K.el('div', 'question', big, await K.tr(zh ? 'Hint: {n} characters, it starts with "{c}"' : nw > 1 ? 'Hint: {n} words, it starts with "{c}"' : 'It starts with "{c}".', { n: nw, c: firstLetter(ansT) }));
          const again = await askOnce(15);
          for (const [id, a] of again) if (!got.has(id) || !isRight(got.get(id))) got.set(id, Object.assign({}, a, { late: true }));
        }
        if (v.ring) v.ring.stop();
        let first = null;
        for (const p of K.players()) {
          const a = got.get(p.id);
          const good = a && isRight(a);
          let pts = 0;
          if (good) { pts = sec ? K.award(p, a.late ? 50 : 100, a.ms, sec) : (p.score += 100, 100); if (!first || a.ms < first.ms) first = { p, ms: a.ms }; }
          K.result(p.id, { ok: !!good, pts, score: p.score, right: ansT });
        }
        K.el('div', 'question', big, ansT).style.color = 'var(--gold)';
        if (first) await firstBadge(K, v.main, first.p, first.ms);
        K.boo(first ? 'happy' : 'mind');
        v.board.draw();
        await K.sleep(4200);
      }
      // make your own: each player's riddle, guessed by the others (too easy, and it scores less)
      if (s.make && !s.kids && K.players().length >= 2 && !K.over()) {
        const v = await qView(K, { title: await K.tr('Make your own riddle!'), sub: await K.tr('Type some emoji and what they mean'), sec: 60 });
        K.el('div', 'question', v.main, await K.tr('On your phone: some emoji, and the answer.'));
        const made = await K.ask({ kind: 'emojimake', prompt: await K.tr('Your emoji riddle'), sec: 60, extra: { place: await K.tr('The answer') } });
        for (const [author, a] of made) {
          if (K.over()) break;
          const e = String((a.v && a.v.e) || '').slice(0, 24), ans = P.safe(a.v && a.v.a, 50);
          if (!e || !ans || !BVRX.picto().test(e)) continue;
          const others = K.players().filter(p => p.id !== author);
          const v2 = await qView(K, { title: await K.tr('A riddle by {name}', { name: (K.player(author) || {}).name }), sec: 25 });
          K.el('div', 'big', K.el('div', 'center', v2.main), e).style.fontSize = 'calc(18 * var(--u))';
          const g = await K.ask({ kind: 'text', prompt: e, sec: 25, who: others.map(p => p.id), extra: { max: 60 } });
          const right = [...g].filter(([, x]) => P.close(x.v, ans)).map(([id]) => id);
          for (const id of right) { const p = K.player(id); p.score += 50; K.result(id, { ok: true, pts: 50, score: p.score, right: ans }); }
          const au = K.player(author);
          if (au) { const pts = right.length && right.length < others.length ? 40 * right.length : 0; au.score += pts; K.result(author, { ok: pts > 0, pts, score: au.score, note: right.length === others.length ? await K.tr('Too easy: everyone got it!') : '' }); }
          K.el('div', 'question', v2.main, ans).style.color = 'var(--gold)';
          v2.board.draw();
          await K.sleep(3800);
        }
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });

  // =====================================================================
  // Higher or Lower
  // =====================================================================
  G({
    id: 'higher', name: 'Higher or Lower', emoji: '⚖️', sub: 'Two things side by side. Which one is bigger?',
    step: ['Pick the bigger one', 'Tap the card you think wins.'], deco: '⬆️⚖️⬇️🔥',
    rules: ['Two cards show on the TV.', 'Tap the one you think wins.', 'The winner stays, and a new card comes in.'],
    settings: [{ key: 'topic', label: 'Topic', type: 'seg', options: [['mix', 'A mix'], ['weight', 'Animals: weight'], ['speed', 'Animals: speed'], ['people', 'Places: people'], ['size', 'Places: size'], ['height', 'Height'], ['calories', 'Food: calories'], ['sports', 'Sports: stadiums'], ['history', 'History: which came first']], default: 'mix' },
      { key: 'scoring', label: 'Scoring', type: 'seg', options: [['points', 'Points', 'One point for each right answer.'], ['streak', 'Longest streak', 'Your longest run of right answers wins.'], ['knockout', 'Knockout', 'One wrong answer and you are out.']], default: 'points' }, rounds(10, [10, 15, 20]),
      { key: 'closest', label: 'Last round: closest guess', type: 'toggle', default: true, desc: 'At the end, everyone slides to guess an exact number. Closest wins.' }, KIDS('Easy, fun pairs, and nobody goes out.')],
    async tv(K) {
      const s = K.settings;
      const LP = K.packs;
      // (the names in the game's language: the language pack lists them in the same order as the English ones)
      const itemsOf = t => PK.higher[t].items.map((x, i) => [x[0], (LP && LP.higher && LP.higher[t] && LP.higher[t][i]) || x[1], x[2]]);
      const kidsItems = PK.kidsHigher.map((x, i) => [x[0], (LP && LP.kidsHigher && LP.kidsHigher[i]) || x[1], x[2], x[3]]);
      const topics = s.topic === 'mix' ? Object.keys(PK.higher) : [s.topic];
      let topic = P.pick(topics), deck = [], champ = null;
      const draw = () => {
        if (!deck.length) { topic = P.pick(topics); deck = P.shuffle(itemsOf(topic)); champ = null; }
        return deck.pop();
      };
      // a number with its unit, the way the game's language says it (big numbers of people and land in Chinese, Hindi
      // and Bengali use their own steps: 万 and 亿, lakh and crore)
      const r2 = x => Math.round(x * 100) / 100;
      function withUnit(n, unit) {
        const L2 = K.lang;
        if (unit === 'million people') {
          const all = n * 1e6;
          if (L2 === 'zh') return all >= 1e8 ? K.num(r2(all / 1e8)) + '亿人' : K.num(Math.round(all / 1e4)) + '万人';
          if (L2 === 'hi') return all >= 1e7 ? K.num(r2(all / 1e7)) + ' करोड़ लोग' : K.num(r2(all / 1e5)) + ' लाख लोग';
          if (L2 === 'bn') return all >= 1e7 ? K.num(r2(all / 1e7)) + ' কোটি মানুষ' : K.num(r2(all / 1e5)) + ' লাখ মানুষ';
          return K.f('{n} million people', { n: K.num(r2(n)) });
        }
        if (unit === 'thousand km²') {
          const all = n * 1e3;
          if (L2 === 'zh') return all >= 1e4 ? K.num(r2(all / 1e4)) + '万平方公里' : K.num(Math.round(all)) + '平方公里';
          if (L2 === 'hi') return all >= 1e5 ? K.num(r2(all / 1e5)) + ' लाख वर्ग किमी' : K.num(Math.round(all)) + ' वर्ग किमी';
          if (L2 === 'bn') return all >= 1e5 ? K.num(r2(all / 1e5)) + ' লাখ বর্গ কিমি' : K.num(Math.round(all)) + ' বর্গ কিমি';
          return K.f('{n} thousand km²', { n: K.num(Math.round(n)) });
        }
        const v = n >= 100 ? Math.round(n) : r2(n);
        const T2 = { kg: '{n} kg', 'km/h': '{n} km/h', meters: '{n} meters', calories: '{n} calories', seats: '{n} seats', m: '{n} m' }[unit];
        return T2 ? K.f(T2, { n: K.num(v) }) : String(Math.round(n));
      }
      const best = new Map();
      for (let r = 0; r < +s.rounds; r++) {
        if (K.over() || (s.scoring === 'knockout' && K.players().length > 1 && K.alive().length <= 1)) break;
        let A, B, T;
        if (s.kids) { const two = P.shuffle(kidsItems).slice(0, 2); A = two[0]; B = two[1]; T = { q: 'Which weighs more?', unit: 'kg' }; }
        else { if (!champ || !deck.length) { if (deck.length < 2) { topic = P.pick(topics); deck = P.shuffle(itemsOf(topic)); } champ = deck.pop(); } A = champ; B = draw(); T = PK.higher[topic]; }
        if (!B) break;
        const older = !!T.older;
        const winI = older ? (A[2] <= B[2] ? 0 : 1) : (A[2] >= B[2] ? 0 : 1);
        const v = await qView(K, { title: await K.tr(T.q), sub: await K.tr('Round {n}', { n: r + 1 }), sec: s.kids ? 0 : 12 });
        const row = K.el('div', 'cards2', v.main);
        const card = async (x) => { const c = K.el('div', 'hl', row); K.el('div', 'e', c, x[0]); K.el('b', '', c, await K.tr(x[1])); const n = K.el('div', 'num', c, '?'); return { c, n }; };
        const ca = await card(A); K.el('div', 'question', row, await K.tr('vs')); const cb = await card(B);
        const got = await K.ask({ kind: 'choice', prompt: await K.tr(T.q), opts: [A[0] + ' ' + await K.tr(A[1]), B[0] + ' ' + await K.tr(B[1])], sec: s.kids ? 0 : 12, extra: { two: true } });
        if (v.ring) v.ring.stop();
        // the drum roll: both numbers count up
        P.sfx('drum');
        const fmt = n => (T.unit === '' ? String(Math.round(n)) : withUnit(n, T.unit));
        await new Promise(res => { const t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 1800); const e = 1 - Math.pow(1 - k, 3); ca.n.textContent = fmt(A[2] * e); cb.n.textContent = fmt(B[2] * e); if (k < 1) requestAnimationFrame(f); else res(); })(t0); });
        (winI === 0 ? ca : cb).c.classList.add('win');
        P.sfx('right');
        const inNow = K.alive();
        const spare = inNow.length > 1 && !inNow.some(p => got.has(p.id) && +got.get(p.id).v === winI);
        for (const p of inNow) {
          const a = got.get(p.id);
          const good = a && +a.v === winI;
          if (good) { p.streak++; best.set(p.id, Math.max(best.get(p.id) || 0, p.streak)); if (s.scoring !== 'streak') p.score += 1; else p.score = best.get(p.id); }
          else { p.streak = 0; if (s.scoring === 'knockout' && !s.kids && !spare) p.out = true; }
          K.result(p.id, { ok: !!good, pts: good ? 1 : 0, score: p.score, out: p.out, note: p.streak > 1 ? await K.tr('{n} in a row!', { n: p.streak }) : '' });
        }
        champ = winI === 0 ? A : B;
        v.board.draw();
        K.boo('wow');
        await K.sleep(3600);
      }
      // the closest guess: one exact number
      if (s.closest && !s.kids && !K.over()) {
        const items = itemsOf('height');
        const it = P.pick(items);
        const v = await qView(K, { title: await K.tr('Closest guess!'), sec: 25 });
        K.el('div', 'question', v.main, await K.tr('How tall is it, in meters? {thing}', { thing: it[0] + ' ' + await K.tr(it[1]) }));
        // (a slider on the phones, from 0 to a little past the tallest thing in the pack)
        const top = Math.ceil(Math.max(...items.map(x => x[2])) * 1.25 / 10) * 10;
        const got = await K.ask({ kind: 'number', prompt: await K.tr('How tall, in meters? {thing}', { thing: it[0] }), sec: 25, extra: { min: 0, max: top, slider: true, unit: K.f('{n} m', { n: '' }).trim() } });
        let bestG = null;
        for (const [id, a] of got) { const d = Math.abs(+a.v - it[2]); if (!bestG || d < bestG.d) bestG = { id, d, ms: a.ms }; }
        K.el('div', 'question', v.main, await K.tr('The answer: {x}', { x: withUnit(it[2], 'm') })).style.color = 'var(--gold)';
        if (bestG) { const p = K.player(bestG.id); p.score += 3; await firstBadge(K, v.main, p, bestG.ms); K.result(p.id, { ok: true, pts: 3, score: p.score }); }
        await K.sleep(4500);
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });

  // =====================================================================
  // Bingo Night
  // =====================================================================
  function card75(r) { const cols = [0, 1, 2, 3, 4].map(c => P.shuffle(Array.from({ length: 15 }, (_, i) => c * 15 + i + 1), r).slice(0, 5)); const cells = []; for (let row = 0; row < 5; row++) for (let c = 0; c < 5; c++) cells.push(row === 2 && c === 2 ? 0 : cols[c][row]); return cells; }
  function card90(r) {
    // 3 rows of 9 columns, 5 numbers in each row (columns 1-9, 10-19, ..., 80-90)
    const grid = Array.from({ length: 27 }, () => -1);
    for (let row = 0; row < 3; row++) { const cols = P.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], r).slice(0, 5); for (const c of cols) grid[row * 9 + c] = 0; }
    for (let c = 0; c < 9; c++) {
      const lo = c === 0 ? 1 : c * 10, hi = c === 8 ? 90 : c * 10 + 9;
      const rowsHere = [0, 1, 2].filter(row => grid[row * 9 + c] === 0);
      const nums = P.shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i), r).slice(0, rowsHere.length).sort((a, b) => a - b);
      rowsHere.forEach((row, i) => { grid[row * 9 + c] = nums[i]; });
    }
    return grid;
  }
  const letterOf = n => 'BINGO'[Math.min(4, Math.floor((n - 1) / 15))];
  function wins(card, called, pattern, style) {
    const has = n => n === 0 || called.has(n);
    if (style === '90') {
      const rows = [0, 1, 2].map(r => card.slice(r * 9, r * 9 + 9).filter(n => n > 0));
      const full = rows.map(rw => rw.every(has));
      return pattern === 'full' ? full.every(Boolean) : full.some(Boolean);
    }
    const at = (r, c) => card[r * 5 + c];
    const line = [0, 1, 2, 3, 4];
    if (pattern === 'corners') return [at(0, 0), at(0, 4), at(4, 0), at(4, 4)].every(has);
    if (pattern === 'x') return line.every(i => has(at(i, i)) && has(at(i, 4 - i)));
    if (pattern === 'full') return card.every(has);
    return line.some(r => line.every(c => has(at(r, c)))) || line.some(c => line.every(r => has(at(r, c)))) || line.every(i => has(at(i, i))) || line.every(i => has(at(i, 4 - i)));
  }
  G({
    id: 'bingo', name: 'Bingo Night', emoji: '🎱', sub: 'The TV calls the numbers; every phone is a bingo card.',
    step: ['Mark your card', 'Tap the numbers the TV calls, then tap BINGO.'], deco: 'bingo',
    rules: ['Each phone gets its own bingo card.', 'Mark the numbers the TV calls (or let the phone do it).', 'Your card matches the pattern? Tap BINGO! The TV checks it.'],
    settings: [{ key: 'pattern', label: 'Pattern', type: 'seg', options: [['line', 'A line', 'A full line of numbers.'], ['corners', 'Four corners', 'Mark the four corners of the card.'], ['x', 'An X', 'Both diagonals, corner to corner.'], ['full', 'Full card', 'Every number on the card.']], default: 'line' },
      { key: 'speed', label: 'Calling speed', type: 'seg', options: [[9, 'Slow'], [6, 'Normal'], [4, 'Fast']], default: 6 },
      { key: 'style', label: 'Style', type: 'seg', options: [['75', '75 balls', 'American bingo: a 5 by 5 card under B I N G O.'], ['90', '90 balls', 'British bingo: 3 rows of 9 squares.']], default: '75' },
      { key: 'cards', label: 'Cards each', type: 'seg', options: [[1, '1'], [2, '2'], [3, '3']], default: 1 }, { key: 'auto', label: 'Mark the numbers for me (easy mode)', type: 'toggle', default: false },
      { key: 'big', label: 'Big text (for older eyes)', type: 'toggle', default: false }, { key: 'prize', label: 'Prize (shown on the TV)', type: 'text', default: '' }, { key: 'paper', label: 'Paper cards to print', type: 'seg', options: [[0, 'None'], [4, '4'], [8, '8'], [16, '16']], default: 0 }],
    async tv(K) {
      const s = K.settings, style = s.style, max = style === '90' ? 90 : 75;
      const seed = Math.floor(Math.random() * 1e9);
      // every card has a number: the same number always makes the same card (paper cards are checked by it)
      const cardFor = no => (style === '90' ? card90 : card75)(P.rng(seed + no * 7919));
      let next = 1;
      const owned = new Map();   // player id -> [card numbers]
      for (const p of K.players()) { const nos = []; for (let i = 0; i < +s.cards; i++) nos.push(next++); owned.set(p.id, nos); K.box(p.id, { k: 'bingo-cards', style, cards: nos.map(no => ({ no, cells: cardFor(no) })), auto: !!s.auto, big: !!s.big, pattern: s.pattern }); }
      if (+s.paper) {
        const nos = []; for (let i = 0; i < +s.paper; i++) nos.push(next++);
        const host = K.players().find(p => K.isHost(p.id));
        if (host) K.box(host.id, { k: 'bingo-paper', style, cards: nos.map(no => ({ no, cells: cardFor(no) })) });
      }
      const called = new Set();
      const order = P.shuffle(Array.from({ length: max }, (_, i) => i + 1));
      const v = K.view(await K.tr('Bingo Night'), s.prize ? await K.tr('Prize: {x}', { x: P.safe(s.prize, 80) }) : await K.tr(({ line: 'Get a line', corners: 'Get the four corners', x: 'Make an X', full: 'Fill the whole card' })[s.pattern]));
      const main = K.el('div', 'col grow', v);
      const ballBox = K.el('div', 'center', main); ballBox.style.minHeight = 'calc(34 * var(--u))';
      const calls = K.el('div', 'bingo-calls', main);
      const cells = [];
      for (let i = 1; i <= max; i++) cells.push(K.el('span', '', calls, String(i)));
      calls.style.gridTemplateColumns = `repeat(${style === '90' ? 15 : 15}, 1fr)`;
      const side = K.el('div', 'board', v);
      K.el('h2', '', side, await K.tr('Players'));
      for (const p of K.players()) { const r = K.el('div', 'row', side); const im = K.el('img', '', r); im.src = K.avatarUrl(p); im.alt = ''; K.el('b', '', r, p.name); }
      let winner = null;
      const tryBingo = async (who, no) => {
        if (winner) return;
        const card = cardFor(no);
        if (wins(card, called, s.pattern, style)) { winner = { who, no }; }
        else if (who) K.result(who, { ok: false, note: await K.tr('Not yet! Check your card again.') });
      };
      K.on('bingo', (m, p) => { const nos = owned.get(p.id) || []; if (nos.includes(+m.no)) tryBingo(p.id, +m.no); });
      // the host checks a paper card by its number
      K.on('paper', async (m, p) => { if (p && K.isHost(p.id) && +m.no > 0 && +m.no < next && ![...owned.values()].flat().includes(+m.no)) { await tryBingo('', +m.no); if (!winner) K.result(p.id, { ok: false, note: await K.tr('Paper card {no}: not yet.', { no: +m.no }) }); } });
      // the cage: colored balls tumbling, and each called ball rolling out next to it
      const cageRow = K.el('div', 'cage-row', ballBox);
      const cage = K.el('div', 'cage', cageRow);
      for (let i = 0; i < 12; i++) { const bl = K.el('i', '', cage); bl.style.background = P.COLORS[i % 5]; bl.style.left = (18 + 60 * Math.random()) + '%'; bl.style.top = (18 + 60 * Math.random()) + '%'; }
      const out = K.el('div', 'cage-out', cageRow);
      for (const n of order) {
        if (winner || K.over()) break;
        called.add(n);
        cells[n - 1].classList.add('on');
        cage.classList.add('spin');
        await K.sleep(700);
        cage.classList.remove('spin');
        out.textContent = '';
        const b = K.el('div', 'ball big', out, style === '75' ? letterOf(n) + ' ' + n : String(n));
        b.style.setProperty('--bc', P.COLORS[(n - 1) % 5]);
        // (the letter is said in languages written in the same letters; the others just say the number)
        const spoke = K.speak((style === '75' && ['en', 'es', 'fr'].includes(K.lang) ? letterOf(n) + ' ' : '') + n);
        P.sfx('pop');
        K.say({ k: 'bingo-call', n, called: [...called], spoke: !!spoke });
        for (let t = 0; t < +s.speed * 10 && !winner; t++) await K.sleep(100);
        // (easy mode: a card that's done wins, even if its player forgot to tap BINGO)
        if (s.auto && !winner) for (const [id, nos] of owned) { const no = nos.find(x => wins(cardFor(x), called, s.pattern, style)); if (no && K.player(id) && !K.player(id).away) { winner = { who: id, no }; break; } }
      }
      if (winner) {
        const p = winner.who ? K.player(winner.who) : null;
        ballBox.textContent = '';
        K.el('div', 'question', ballBox, await K.tr('BINGO! {name}', { name: p ? p.name : K.f('Paper card {no}', { no: winner.no }) }));
        // the winning card, with its called numbers lit
        const wc = K.el('div', 'wincard', ballBox);
        const cols = style === '90' ? 9 : 5;
        wc.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        if (style === '75') for (const ch of 'BINGO') K.el('b', '', wc, ch);
        for (const x of cardFor(winner.no)) { const c = K.el('span', x === 0 || called.has(x) ? 'on' : x < 0 ? 'blank' : '', wc, x === 0 ? '★' : x < 0 ? '' : String(x)); void c; }
        if (p) p.score += 1;
        P.confetti(); P.sfx('win'); K.boo('happy');
        await K.sleep(5000);
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });

  // =====================================================================
  // Who's the Imposter?: its own file (imp-game.js) takes this place in the list of games
  // =====================================================================
  G({ id: 'imposter', name: 'Who\'s the Imposter?', emoji: '🕵️', sub: 'Everyone has the same secret word, except one.', settings: [], async tv(K) { return K.players(); } });
})();
