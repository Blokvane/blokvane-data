// Blokvane party games: the games. Each one says what happens in its rounds; the kit (play.js) does the rest (joining,
// the lobby, asking the phones, the scoreboard, the winner). Words shown on the TV go through K.tr (Chrome's own
// translator on a computer, when you picked another language).
(() => {
  'use strict';
  const P = BVPLAYC, PK = BVPACKS;
  const G = def => BVPLAY.game(def);
  const KIDS = { key: 'kids', label: 'Kids mode', type: 'toggle', default: false };
  const rounds = (d, list) => ({ key: 'rounds', label: 'Rounds', type: 'seg', options: list.map(n => [n, String(n)]), default: d });
  const LET = P.LETTERS;
  // ---------- small helpers every game uses ----------
  async function qView(K, o) {
    const right = [];
    let rg = null;
    if (o.sec) { rg = K.ring(document.createElement('div'), o.sec); right.push(rg.node); }
    const body = K.view(await K.tr(o.title), o.sub ? await K.tr(o.sub) : '', right);
    const main = K.el('div', 'col grow', body);
    const b = o.board === false ? null : K.board(body, { lives: o.lives, title: await K.tr('Scoreboard') });
    return { body, main, board: b, ring: rg };
  }
  async function answersGrid(K, parent, opts) {
    const g = K.el('div', 'answers', parent);
    const cells = [];
    for (let i = 0; i < opts.length; i++) {
      const a = K.el('div', 'ans ' + LET[i], g);
      K.el('span', 'l', a, P.SHAPES[i]);
      K.el('span', '', a, opts[i]);
      cells.push({ node: a, who: K.el('span', 'who', a) });
    }
    return cells;
  }
  function showWho(K, cell, ids) { for (const id of ids.slice(0, 8)) { const p = K.player(id); if (!p) continue; const im = K.el('img', '', cell.who); im.src = K.avatarUrl(p); im.alt = ''; } }
  async function firstBadge(K, parent, p, ms) { const f = K.el('div', 'first', parent); const im = K.el('img', '', f); im.src = K.avatarUrl(p); im.alt = ''; f.append('⚡ ' + (await K.tr('First:')) + ' ' + p.name + ' (' + (ms / 1000).toFixed(1) + 's)'); return f; }
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
  const fromPack = x => ({ q: x[0], a: x[1], w: x[2], c: x[3], d: 'easy' });
  function inOrder(list, n) {
    // easy first, then medium, then hard, spread over however many questions there are
    const by = d => P.shuffle(list.filter(x => x.d === d));
    const e = by('easy'), m = by('medium'), h = by('hard');
    const out = [];
    const nE = Math.round(n * 0.4), nH = Math.round(n * 0.25), nM = n - nE - nH;
    out.push(...e.slice(0, nE), ...m.slice(0, nM), ...h.slice(0, nH));
    for (const x of [...e.slice(nE), ...m.slice(nM), ...h.slice(nH)]) { if (out.length >= n) break; out.push(x); }
    return out.slice(0, n);
  }
  const teamOf = (K, p) => P.TEAMS.find(t => t[0] === p.team);

  // =====================================================================
  // Trivia
  // =====================================================================
  G({
    id: 'trivia', name: 'Trivia', emoji: '🧠', sub: 'Questions on the TV, answers on your phone.', teams: true, teamsWin: true,
    credit: 'Questions: Open Trivia Database (opentdb.com), CC BY-SA 4.0. The first five: Blokvane.',
    rules: ['A question shows on the TV with answers A, B, C and D.', 'Tap your answer on your phone before time runs out.', 'Each helper works once: remove two, a hint, answer it for me, ask everyone.'],
    settings: [
      { key: 'mode', label: 'Game mode', type: 'seg', options: [['most', 'Most correct'], ['knockout', 'Knockout'], ['lives', '3 lives'], ['race', 'Race to a number'], ['first', 'First right takes the point'], ['family', 'Family mode']], default: 'most' },
      { key: 'count', label: 'Questions', type: 'seg', options: [[10, '10'], [15, '15'], [20, '20'], [30, '30']], default: 15 },
      { key: 'raceTo', label: 'Race to', type: 'seg', options: [[5, '5'], [10, '10'], [20, '20']], default: 10, when: ['mode', 'race'] },
      { key: 'cat', label: 'Category', type: 'seg', options: PK.cats.map(c => [c[0], c[1]]), default: 0 },
      { key: 'wheel', label: 'Category wheel (a new category every 5 questions)', type: 'toggle', default: false },
      { key: 'sec', label: 'Time to answer', type: 'seg', options: [[15, '15 s'], [20, '20 s'], [30, '30 s']], default: 20 },
      { key: 'speed', label: 'Speed points (faster answers score more)', type: 'toggle', default: false },
      { key: 'teams', label: 'Teams', type: 'toggle', default: false },
      { key: 'teamN', label: 'How many teams', type: 'seg', options: [[2, '2'], [3, '3'], [4, '4']], default: 2, when: ['teams', true] }
    ],
    async tv(K) {
      const s = K.settings, family = s.mode === 'family';
      const n = family ? 10 : +s.count;
      // the questions: an easy start, then the database, easy to hard
      let pool = await otdb({ amount: 50, cat: s.wheel ? 0 : +s.cat, diff: family ? 'easy' : '' });
      const starters = P.shuffle(PK.easy).map(fromPack);
      let qs = starters.slice(0, Math.min(5, n));
      qs = qs.concat(inOrder(pool, n - qs.length));
      while (qs.length < n && qs.length < starters.length) qs.push(starters[qs.length]);
      let wheelCats = P.shuffle(PK.cats.filter(c => c[0])).slice(0, 8);
      const sec = family ? 0 : +s.sec;
      for (let i = 0; i < qs.length; i++) {
        if (K.over()) break;
        const live = K.alive();
        if ((s.mode === 'knockout' || s.mode === 'lives') && K.players().length > 1 && live.length <= 1) break;
        if (s.mode === 'race' && K.players().some(p => p.right >= +s.raceTo)) break;
        // the category wheel: every 5 questions the TV spins for the next ones
        if (s.wheel && i >= 5 && (i - 5) % 5 === 0) { const cat = await wheel(K, wheelCats); const more = await otdb({ amount: 10, cat: cat[0] }); if (more.length) qs.splice(i, 5, ...inOrder(more, 5)); }
        const q = qs[i];
        const opts = P.shuffle([q.a, ...q.w]).slice(0, 4);
        const ok = opts.indexOf(q.a);
        // (the words are translated before the clock starts)
        const tq = await K.tr(q.q), tOpts = await Promise.all(opts.map(o => K.tr(o)));
        const v = await qView(K, { title: (await K.tr('Question')) + ` ${i + 1} / ${qs.length}`, sub: q.c, sec, lives: s.mode === 'lives' });
        const qt = K.el('div', 'question', v.main, tq);
        const cells = await answersGrid(K, v.main, tOpts);
        if (family) K.speak(qt.textContent);
        const answered = new Set();
        let qn = -1;
        // the helpers (each player, each once): remove two, a hint, answer it for me, ask everyone (the players who are out vote)
        const outs = () => K.players().filter(p => p.out);
        const offHelp = K.on('help', async (m, p) => {
          if (+m.n !== qn || p.out || p.helpers[m.h] || !['fifty', 'hint', 'auto', 'ask'].includes(m.h)) return;
          if (m.h === 'ask' && !outs().length) { K.sayTo(p.id, { k: 'helped', n: qn, h: 'ask', no: true, note: await K.tr('Ask everyone works once someone is out.') }); return; }
          p.helpers[m.h] = true;
          if (m.h === 'fifty') { const wrong = P.shuffle([0, 1, 2, 3].filter(x => x !== ok && x < opts.length)).slice(0, 2); K.sayTo(p.id, { k: 'helped', n: qn, h: 'fifty', hide: wrong }); }
          else if (m.h === 'hint') K.sayTo(p.id, { k: 'helped', n: qn, h: 'hint', text: await hint(K, q, opts[ok]) });
          else if (m.h === 'auto') K.sayTo(p.id, { k: 'helped', n: qn, h: 'auto', pick: ok });
          else if (m.h === 'ask') {
            const votes = await K.ask({ kind: 'choice', prompt: (await K.tr('Help')) + ' ' + p.name + ': ' + (await K.tr('which answer is right?')), opts: tOpts, sec: 10, who: outs().map(x => x.id), extra: { letters: true, helpOnly: true } });
            const tally = opts.map((_, j) => [...votes.values()].filter(a => +a.v === j).length);
            K.sayTo(p.id, { k: 'helped', n: qn, h: 'ask', tally });
          }
        });
        const asking = K.ask({ kind: 'choice', prompt: qt.textContent, opts: tOpts, sec, extra: { letters: true, helpers: !family }, onAns: id => { answered.add(id); v.board.draw(answered); } });
        qn = K.qn();
        const answers = await asking;
        offHelp();
        if (v.ring) v.ring.stop();
        // the right answer
        cells.forEach((c, j) => c.node.classList.add(j === ok ? 'right' : 'dim'));
        for (let j = 0; j < opts.length; j++) showWho(K, cells[j], [...answers].filter(([, a]) => +a.v === j).map(([id]) => id));
        let first = null;
        const rightN = [...answers.values()].filter(a => +a.v === ok).length;
        // (everyone still in got it wrong at once: nobody goes out or loses a life this time)
        const spare = (s.mode === 'knockout' || s.mode === 'lives') && live.length > 1 && !live.some(p => answers.has(p.id) && +answers.get(p.id).v === ok);
        if (spare) K.el('div', 'pill', v.main, await K.tr('Everyone missed that one, so nobody goes out.')).style.cssText = 'align-self:center;font-size:2.6vh;margin-top:2vh';
        for (const p of live) {
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
          K.result(p.id, { ok: good, pts, score: p.score, out: p.out, lives: p.lives, right: tOpts[ok] });
        }
        if (first) { if (s.mode === 'first') { first.p.score += 1; K.result(first.p.id, { ok: true, pts: 1, score: first.p.score, first: true, right: tOpts[ok] }); } await firstBadge(K, v.main, first.p, first.ms); }
        K.boo(rightN >= live.length / 2 ? 'happy' : 'sad');
        P.sfx(rightN ? 'right' : 'wrong');
        v.board.draw();
        await K.sleep(family ? 5000 : 4200);
      }
      // a tie for first: one number question, the closest guess wins
      let ps = K.players().slice().sort((a, b) => b.score - a.score);
      if (!s.teams && ps.length > 1 && ps[0].score === ps[1].score && !K.over()) {
        const tied = ps.filter(p => p.score === ps[0].score);
        const [qq, real] = P.pick(PK.numbers);
        const v = await qView(K, { title: await K.tr('Tie-breaker!'), sub: await K.tr('The closest guess wins'), sec: 25 });
        K.el('div', 'question', v.main, await K.tr(qq));
        const got = await K.ask({ kind: 'number', prompt: await K.tr(qq), sec: 25, who: tied.map(p => p.id) });
        let best = null;
        for (const [id, a] of got) { const d = Math.abs(+a.v - real); if (!best || d < best.d || (d === best.d && a.ms < best.ms)) best = { id, d, ms: a.ms, v: +a.v }; }
        K.el('div', 'question', v.main, (await K.tr('The answer:')) + ' ' + real.toLocaleString());
        if (best) { const p = K.player(best.id); p.score += 1; await firstBadge(K, v.main, p, best.ms); }
        await K.sleep(4000);
        ps = K.players().slice().sort((a, b) => b.score - a.score);
      }
      // (with teams on, the kit adds up each team and crowns the team)
      return ps;
    }
  });
  // a hint: Chrome's built-in AI on computers that have it, or simply the first letter
  async function hint(K, q, answer) {
    try {
      const LM = self.LanguageModel || (self.ai && self.ai.languageModel);
      if (LM && (!LM.availability || (await LM.availability()) === 'available')) {
        const sess = await (LM.create ? LM.create() : LM.createTextSession());
        const t = await sess.prompt(`Give a short, kind hint (under 15 words) for this quiz question. Never say the answer or any word of it.\nQuestion: ${q.q}\nAnswer: ${answer}`);
        if (t && !P.norm(t).includes(P.norm(answer))) return K.tr(String(t).slice(0, 140));
      }
    } catch (e) {}
    const words = String(answer).split(/\s+/).length;
    return K.tr(`It starts with "${String(answer).trim()[0]}"` + (words > 1 ? ` and has ${words} words.` : '.'));
  }
  async function wheel(K, cats) {
    const v = await qView(K, { title: await K.tr('Category wheel'), sub: await K.tr('Spinning for the next round...'), board: false });
    const box = K.el('div', 'center grow', v.main);
    const w = K.el('div', 'wheel', box);
    const segs = cats.length, cols = P.COLORS;
    w.style.background = 'conic-gradient(' + cats.map((c, i) => `${cols[i % cols.length]} ${i * 360 / segs}deg ${(i + 1) * 360 / segs}deg`).join(',') + ')';
    const pick = Math.floor(Math.random() * segs);
    const label = K.el('div', 'question', box, '');
    await K.sleep(300);
    w.style.transform = `rotate(${360 * 6 - (pick + 0.5) * 360 / segs}deg)`;
    P.sfx('drum');
    await K.sleep(4300);
    label.textContent = await K.tr(cats[pick][1]);
    P.sfx('right');
    await K.sleep(2000);
    return cats[pick];
  }

  // =====================================================================
  // Boo Who?
  // =====================================================================
  G({
    id: 'boowho', name: 'Boo Who?', emoji: '👻', sub: '"Who is most likely to..." No right answers, just laughs.',
    rules: ['The TV asks who is most likely to do something.', 'Tap the person who fits best on your phone (you can pick yourself).', 'You score when you vote with the most people.'],
    settings: [{ key: 'pack', label: 'Questions', type: 'seg', options: [['family', 'Family (safe for kids)'], ['friends', 'Friends'], ['work', 'Work'], ['holidays', 'Holidays']], default: 'family' },
      rounds(10, [10, 20, 30]), { key: 'votes', label: 'Votes', type: 'seg', options: [['secret', 'Keep them secret'], ['show', 'Show who voted for whom']], default: 'secret' },
      { key: 'own', label: 'Your own questions (one on each line)', type: 'text', default: '' }],
    async tv(K) {
      const s = K.settings;
      const own = String(s.own || '').split(/\n|\|/).map(x => P.safe(x, 90)).filter(Boolean);
      const pool = P.shuffle(own.length ? own.concat(PK.boowho[s.pack] || PK.boowho.family) : (PK.boowho[s.pack] || PK.boowho.family));
      for (let r = 0; r < Math.min(+s.rounds, pool.length); r++) {
        const ps = K.players();
        if (ps.length < 2 || K.over()) break;
        const line = (/^(who|who's|who is)/i.test(pool[r]) ? pool[r] : 'Who is most likely to ' + pool[r] + '?');
        const v = await qView(K, { title: (await K.tr('Round')) + ` ${r + 1}`, sec: 25 });
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

  // =====================================================================
  // Where in the World?
  // =====================================================================
  const proj = (lon, lat) => [(lon + 180) / 360 * 1000, (90 - lat) / 180 * 500];
  // the maps: the part of the world map each one shows (map units: 1000 x 500), where a phone starts, and which places
  // are on it (longitude and latitude: west, south, east, north)
  const AREAS = {
    world: { full: [0, 25, 1000, 430], start: [500, 245, 1000] },
    us: { full: [60, 50, 330, 170], start: [238, 146, 190], box: [-170, 18, -66, 72] },
    europe: { full: [420, 40, 220, 130], start: [527, 100, 200], box: [-25, 34, 45, 72] },
    asia: { full: [550, 70, 390, 230], start: [740, 170, 370], box: [25, -11, 150, 60] },
    africa: { full: [430, 130, 240, 235], start: [548, 247, 230], box: [-20, -36, 55, 38] },
    americas: { full: [20, 40, 410, 380], start: [222, 225, 400], box: [-170, -56, -30, 72] },
    oceania: { full: [790, 240, 210, 160], start: [895, 315, 200], box: [110, -50, 180, 0] }
  };
  const flagOf = cc => String.fromCodePoint(...[...cc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  G({
    id: 'world', name: 'Where in the World?', emoji: '🌍', sub: 'Drop a pin on the map. The closest pin wins.',
    rules: ['The TV shows a place, a landmark or a flag.', 'Drop your pin on the map on your phone (pinch to zoom).', 'The closer your pin, the more points you get.'],
    settings: [{ key: 'map', label: 'Map', type: 'seg', options: [['world', 'The whole world'], ['europe', 'Europe'], ['asia', 'Asia'], ['africa', 'Africa'], ['americas', 'The Americas'], ['oceania', 'Oceania'], ['us', 'US states']], default: 'world' },
      { key: 'what', label: 'What to find', type: 'seg', options: [['mix', 'A mix'], ['flags', 'Flags'], ['cities', 'Cities'], ['landmarks', 'Landmarks']], default: 'mix' },
      rounds(10, [5, 10, 20]), { key: 'units', label: 'Units', type: 'seg', options: [['mi', 'Miles'], ['km', 'Kilometers']], default: 'mi' }, KIDS],
    async tv(K) {
      const s = K.settings;
      const area = AREAS[s.map] || AREAS.world;
      const all = [];
      const add = (kind, list) => { for (const x of list) all.push({ kind, x }); };
      if (s.map === 'us') add('state', PK.places.states);
      else {
        if (s.what === 'mix' || s.what === 'flags') add('flag', PK.places.flags);
        if (s.what === 'mix' || s.what === 'cities') add('city', PK.places.cities);
        if (s.what === 'mix' || s.what === 'landmarks') add('landmark', PK.places.landmarks);
        // (one continent: only the places on it; too few of one kind, and the other kinds on it fill in)
        if (area.box) {
          const on = it => { const lon = it.kind === 'flag' ? it.x[2] : it.x[1], lat = it.kind === 'flag' ? it.x[3] : it.x[2]; return lon >= area.box[0] && lon <= area.box[2] && lat >= area.box[1] && lat <= area.box[3]; };
          let kept = all.filter(on);
          if (kept.length < +s.rounds) { const more = []; for (const [kind, list] of [['flag', PK.places.flags], ['city', PK.places.cities], ['landmark', PK.places.landmarks]]) for (const x of list) more.push({ kind, x }); kept = kept.concat(more.filter(it => on(it) && !kept.includes(it) && !kept.some(k => k.x === it.x))); }
          all.length = 0; all.push(...kept);
        }
      }
      // famous places first, getting harder
      const lv = it => it.kind === 'state' ? 1 : it.kind === 'flag' ? it.x[4] : it.x[3];
      const list = [1, 2, 3].flatMap(l => P.shuffle(all.filter(it => lv(it) === l))).slice(0, +s.rounds);
      for (let r = 0; r < list.length; r++) {
        if (K.over()) break;
        const it = list[r];
        const lon = it.kind === 'flag' ? it.x[2] : it.x[1], lat = it.kind === 'flag' ? it.x[3] : it.x[2];
        const name = it.x[0];
        const label = it.kind === 'flag' ? flagOf(it.x[1]) : (it.x[4] || '📍') + ' ' + await K.tr(name);
        const v = await qView(K, { title: (await K.tr('Round')) + ` ${r + 1} / ${list.length}`, sec: s.kids ? 0 : 25, board: true });
        K.el('div', 'question', v.main, (it.kind === 'flag' ? (await K.tr('Where is this flag\'s country?')) + ' ' : (await K.tr('Where is')) + ' ') + label + (it.kind === 'flag' ? '' : '?')).style.fontSize = it.kind === 'flag' ? '7vh' : '';
        let got;
        if (s.kids) {
          // kids: just tap the right continent
          const cont = nearest(PK.continents, lon, lat);
          const opts = P.shuffle([cont[0], ...P.shuffle(PK.continents.filter(c => c[0] !== cont[0] && c[0] !== 'Antarctica')).slice(0, 3).map(c => c[0])]);
          const tOpts = await Promise.all(opts.map(o => K.tr(o)));
          const cells = await answersGrid(K, v.main, tOpts);
          got = await K.ask({ kind: 'choice', prompt: await K.tr('Which continent?'), opts: tOpts, sec: 0, extra: { letters: true } });
          const ok = opts.indexOf(cont[0]);
          cells.forEach((c, j) => c.node.classList.add(j === ok ? 'right' : 'dim'));
          for (const [id, a] of got) { const p = K.player(id); const good = +a.v === ok; if (good) p.score += 100; K.result(id, { ok: good, pts: good ? 100 : 0, score: p.score }); }
        } else {
          got = await K.ask({ kind: 'pin', prompt: await K.tr('Drop your pin'), sec: 25, extra: { map: s.map === 'us' ? 'us' : 'world', area: { full: area.full, start: area.start } } });
          if (v.ring) v.ring.stop();
          // every pin lands at once, then the real spot, with a line and the distance from each pin
          v.main.textContent = '';
          const mapBox = K.el('div', 'map', v.main);
          const us = it.kind === 'state';
          // (the map shows the whole area, and grows to fit every pin and the real spot)
          const [rx0, ry0] = proj(lon, lat);
          let x0 = area.full[0], y0 = area.full[1], x1 = area.full[0] + area.full[2], y1 = area.full[1] + area.full[3];
          for (const [, a] of got) if (Array.isArray(a.v)) { const [px, py] = proj(+a.v[0], +a.v[1]); if (isFinite(px) && isFinite(py)) { x0 = Math.min(x0, px - 15); x1 = Math.max(x1, px + 15); y0 = Math.min(y0, py - 15); y1 = Math.max(y1, py + 15); } }
          x0 = Math.max(0, Math.min(x0, rx0 - 15)); x1 = Math.min(1000, Math.max(x1, rx0 + 15)); y0 = Math.max(0, Math.min(y0, ry0 - 15)); y1 = Math.min(500, Math.max(y1, ry0 + 15));
          const vb = [x0, y0, x1 - x0, y1 - y0];
          const NS = 'http://www.w3.org/2000/svg';
          const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', vb.join(' ')); mapBox.appendChild(svg);
          const land = document.createElementNS(NS, 'path'); land.setAttribute('d', BV_WORLD.d); land.setAttribute('class', 'land'); svg.appendChild(land);
          const [rx, ry] = proj(lon, lat);
          const k = vb[2] / 1000;
          const dist = d => Math.round(s.units === 'km' ? d : d * 0.621).toLocaleString() + ' ' + s.units;
          // (all the distances first: the closest pin counts as a win even when it's far)
          const scored = [];
          for (const [id, a] of got) {
            const pl = K.player(id); if (!pl || !Array.isArray(a.v) || !(Math.abs(+a.v[0]) <= 180 && Math.abs(+a.v[1]) <= 90)) continue;
            const d = P.km([+a.v[0], +a.v[1]], [lon, lat]);
            scored.push({ pl, d, pts: Math.round(100 * Math.exp(-d / (us ? 400 : area.box ? 900 : 2000))), xy: proj(+a.v[0], +a.v[1]) });
          }
          scored.sort((a, b) => a.d - b.d);
          const titles = { first: await K.tr('The closest pin!'), close: await K.tr('So close!'), far: await K.tr('Nice try!') };
          scored.forEach((x, i) => {
            x.pl.score += x.pts;
            const ln = document.createElementNS(NS, 'line'); ln.setAttribute('x1', x.xy[0]); ln.setAttribute('y1', x.xy[1]); ln.setAttribute('x2', rx); ln.setAttribute('y2', ry); ln.setAttribute('stroke', x.pl.color); ln.setAttribute('stroke-width', 2.4 * k); ln.setAttribute('stroke-dasharray', 6 * k); svg.appendChild(ln);
            const c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', x.xy[0]); c.setAttribute('cy', x.xy[1]); c.setAttribute('r', 8 * k); c.setAttribute('fill', x.pl.color); c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', 2.4 * k); svg.appendChild(c);
            // (names alternate above and below their pins, so pins close together stay readable)
            const t = document.createElementNS(NS, 'text'); t.setAttribute('x', x.xy[0]); t.setAttribute('y', x.xy[1] + (i % 2 ? 24 : -13) * k); t.setAttribute('text-anchor', 'middle'); t.setAttribute('fill', '#fff'); t.setAttribute('font-size', 15 * k); t.setAttribute('font-weight', 800); t.setAttribute('paint-order', 'stroke'); t.setAttribute('stroke', 'rgba(10,8,30,.85)'); t.setAttribute('stroke-width', 4 * k);
            t.textContent = x.pl.name; svg.appendChild(t);
            K.result(x.pl.id, { ok: i === 0 || x.pts >= 50, first: i === 0 && scored.length > 1, pts: x.pts, score: x.pl.score, note: dist(x.d), title: i === 0 && scored.length > 1 ? titles.first : x.pts >= 50 ? titles.close : titles.far });
          });
          const star = document.createElementNS(NS, 'text'); star.setAttribute('x', rx); star.setAttribute('y', ry + 11 * k); star.setAttribute('text-anchor', 'middle'); star.setAttribute('font-size', 32 * k); star.textContent = '⭐'; svg.appendChild(star);
          // the distances, closest first
          const row = K.el('div', 'dists', v.main);
          for (const x of scored) { const pill = K.el('span', '', row); const dot = K.el('i', '', pill); dot.style.background = x.pl.color; pill.append(x.pl.name + ' ' + dist(x.d)); }
          K.boo(scored.length && scored[0].d < 500 ? 'wow' : 'laugh');
        }
        v.board.draw();
        await K.sleep(5500);
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });
  function nearest(list, lon, lat) { let best = list[0], bd = Infinity; for (const c of list) { const d = P.km([c[1], c[2]], [lon, lat]); if (d < bd) { bd = d; best = c; } } return best; }

  // =====================================================================
  // Fake Out
  // =====================================================================
  G({
    id: 'fakeout', name: 'Fake Out', emoji: '🎭', sub: 'Make up a fake answer, then spot the real one.',
    rules: ['The TV asks a strange question.', 'Type a fake answer that sounds real (stuck? tap "Give me a fake").', 'Vote for the real one. You score for finding it, and for everyone your fake fooled.'],
    settings: [rounds(8, [5, 8, 12]), { key: 'topic', label: 'Topics', type: 'seg', options: [['mix', 'A mix'], ['animals', 'Animals'], ['history', 'History'], ['food', 'Food'], ['science', 'Science'], ['words', 'Words']], default: 'mix' },
      { key: 'fooled', label: 'Show who fooled whom', type: 'toggle', default: true }, KIDS],
    async tv(K) {
      const s = K.settings;
      const mine = PK.fakeout.filter(x => s.topic === 'mix' || !s.topic || x[3] === s.topic);
      let qs = P.shuffle(mine.map(x => ({ q: x[0], a: x[1], w: x[2] })));
      // (a topic with too few of its own: hard questions from the database on that topic, then other topics)
      if (qs.length < +s.rounds) { const more = await otdb({ amount: 20, diff: 'hard', cat: ({ animals: 27, history: 23, science: 17 })[s.topic] || 0 }); qs = qs.concat(more.map(x => ({ q: x.q, a: x.a, w: x.w }))); }
      if (qs.length < +s.rounds) qs = qs.concat(P.shuffle(PK.fakeout.filter(x => !mine.includes(x)).map(x => ({ q: x[0], a: x[1], w: x[2] }))));
      qs = qs.slice(0, +s.rounds);
      for (let r = 0; r < qs.length; r++) {
        if (K.over()) break;
        const q = qs[r], last = r === qs.length - 1, mul = last ? 2 : 1;
        const ps = K.players();
        let v = await qView(K, { title: (await K.tr('Round')) + ` ${r + 1} / ${qs.length}` + (last ? ' · ' + await K.tr('double points!') : ''), sec: s.kids ? 0 : 45 });
        K.el('div', 'question', v.main, await K.tr(q.q));
        K.el('div', 'muted', v.main, await K.tr('Write a fake answer on your phone that sounds real.')).style.fontSize = '3vh';
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
            if (fooled.length) K.el('div', 'pill', cells[j].node, `${o.by.map(id => (K.player(id) || {}).name).join(', ')} ${await K.tr('fooled')} ${fooled.join(', ')}`).style.cssText = 'position:absolute;bottom:-1.6vh;inset-inline-start:2vh;font-size:2vh;background:#000a';
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
  // Hot Boo
  // =====================================================================
  function challenge(kind, kids, r = Math.random) {
    const k = kind === 'mix' ? P.pick(['math', 'odd', 'fruit', 'color'], r) : kind === 'words' ? P.pick(['odd', 'fruit'], r) : kind === 'colors' ? 'color' : kind;
    if (k === 'math') {
      const a = 1 + Math.floor(r() * (kids ? 5 : 12)), b = 1 + Math.floor(r() * (kids ? 5 : 12)), op = kids ? '+' : P.pick(['+', '-', '×'], r);
      const ans = op === '+' ? a + b : op === '-' ? a - b : a * b;
      const opts = P.shuffle([ans, ans + 1, ans - 1, ans + (r() < .5 ? 2 : -2)].filter((x, i, arr) => arr.indexOf(x) === i), r).slice(0, 4);
      return { q: `${a} ${op} ${b} = ?`, opts: opts.map(String), ok: opts.indexOf(ans) };
    }
    if (k === 'odd') {
      const sets = [['🍎', '🍌', '🍇', '🚗'], ['🐶', '🐱', '🐭', '🍕'], ['⚽', '🏀', '🎾', '🌵'], ['🚗', '🚌', '🚲', '🐟'], ['🌞', '🌙', '⭐', '🧦'], ['🎸', '🎹', '🥁', '🥕'], ['🐟', '🐬', '🐳', '🐘'], ['🍰', '🍩', '🍪', '🔨']];
      const set = P.pick(sets, r);
      const opts = P.shuffle(set, r);
      return { q: 'Tap the odd one out', opts, ok: opts.indexOf(set[3]) };
    }
    if (k === 'fruit') {
      const fruit = P.pick(['🍓', '🍍', '🍒', '🍑', '🍋', '🥝'], r);
      const opts = P.shuffle([fruit, '🥦', '🧀', '🥖'], r);
      return { q: 'Which one is a fruit?', opts, ok: opts.indexOf(fruit) };
    }
    const colors = [['Red', '🔴'], ['Blue', '🔵'], ['Green', '🟢'], ['Yellow', '🟡'], ['Purple', '🟣']];
    const c = P.pick(colors, r);
    const opts = P.shuffle(colors, r).slice(0, 4);
    if (!opts.includes(c)) opts[0] = c;
    const sh = P.shuffle(opts, r);
    return { q: 'Tap ' + c[0].toLowerCase(), opts: sh.map(x => x[1]), ok: sh.indexOf(c) };
  }
  G({
    id: 'hotboo', name: 'Hot Boo', emoji: '🤧', sub: 'Pass Boo on before he sneezes on you.',
    rules: ['Boo jumps onto one player\'s phone.', 'Answer the quick challenge right to pass him on. Wrong? Try another.', 'Nobody knows when he sneezes. Get sneezed on and you lose a life.'],
    settings: [{ key: 'lives', label: 'Lives', type: 'seg', options: [[1, '1'], [2, '2'], [3, '3']], default: 2 }, { key: 'timer', label: 'Sneeze timer', type: 'seg', options: [['short', 'Short'], ['long', 'Long'], ['random', 'Random']], default: 'random' },
      { key: 'pass', label: 'Passing', type: 'seg', options: [['pick', 'Pick who gets him'], ['random', 'Random']], default: 'pick' }, { key: 'ch', label: 'Challenges', type: 'seg', options: [['mix', 'A mix'], ['math', 'Math'], ['words', 'Words'], ['colors', 'Colors']], default: 'mix' }, KIDS],
    async tv(K) {
      const s = K.settings;
      K.players().forEach(p => { p.lives = +s.lives; });
      let holder = P.pick(K.alive()).id;
      while (K.alive().length > 1 && !K.over()) {
        const span = s.timer === 'short' ? [12, 22] : s.timer === 'long' ? [28, 45] : [10, 45];
        const fuse = (span[0] + Math.random() * (span[1] - span[0])) * (s.kids ? 1.3 : 1) * 1000;
        const until = Date.now() + fuse;
        const v = await qView(K, { title: await K.tr('Hot Boo'), sub: await K.tr('Pass him before he sneezes!'), lives: true });
        const hot = K.el('div', 'center grow', v.main);
        const face = K.el('img', '', hot); face.alt = ''; face.style.cssText = 'width:34vh;height:34vh;transition:filter .5s';
        face.src = P.booUri('boo:scary');
        const who = K.el('div', 'question', hot, '');
        const tick = setInterval(() => { const left = (until - Date.now()) / fuse; face.style.filter = `hue-rotate(${-(1 - left) * 40}deg) saturate(${1 + (1 - left) * 2})`; face.animate([{ transform: 'rotate(-4deg)' }, { transform: 'rotate(4deg)' }], { duration: Math.max(120, 600 * left), iterations: 1 }); P.sfx('tick'); }, 900);
        while (Date.now() < until && !K.over()) {
          const p = K.player(holder);
          if (!p || p.out || p.away) { holder = P.pick(K.alive()).id; continue; }
          who.textContent = p.name + ' ' + await K.tr('has Boo!');
          const ch = challenge(s.ch, s.kids);
          const left = Math.max(2, Math.min(20, (until - Date.now()) / 1000));
          const a = (await K.ask({ kind: 'choice', prompt: await K.tr(ch.q), opts: ch.opts, sec: Math.ceil(left), who: [holder], extra: { hot: true } })).get(holder);
          if (Date.now() >= until) break;
          if (a && +a.v === ch.ok) {
            P.sfx('pop');
            let next = '';
            const others = K.alive().filter(x => x.id !== holder);
            if (s.pass === 'pick' && others.length > 1) {
              const left2 = Math.max(2, Math.min(8, (until - Date.now()) / 1000));
              const pk = (await K.ask({ kind: 'players', prompt: K.strings.toWho, opts: others.map(x => ({ id: x.id, name: x.name, ph: !!x.photo, av: x.av })), sec: Math.ceil(left2), who: [holder] })).get(holder);
              next = pk && others.some(x => x.id === pk.v) ? pk.v : '';
            }
            if (Date.now() >= until) break;
            holder = next || P.pick(others).id;
          } else K.result(holder, { ok: false, note: await K.tr('Try another one, quick!') });
        }
        clearInterval(tick);
        // ACHOO
        const p = K.player(holder);
        P.sfx('sneeze');
        face.src = P.booUri('boo:mind');
        who.textContent = (await K.tr('ACHOO! Boo sneezed on')) + ' ' + (p ? p.name : '...');
        hot.style.background = 'radial-gradient(circle, rgba(120,255,120,.35), transparent 60%)';
        if (p) { p.lives--; if (p.lives <= 0) p.out = true; K.result(p.id, { ok: false, note: await K.tr('Slimed!'), lives: p.lives, out: p.out }); }
        for (const x of K.alive()) if (!p || x.id !== p.id) x.score += 1;
        v.board.draw();
        K.wait();
        await K.sleep(4000);
        const al = K.alive();
        if (al.length > 1) holder = P.pick(al).id;
      }
      return K.players().slice().sort((a, b) => (b.out ? 0 : 1) - (a.out ? 0 : 1) || b.lives - a.lives || b.score - a.score);
    }
  });

  // =====================================================================
  // Boo Says
  // =====================================================================
  const MOVES = [['shake', 'shake your phone', '📳'], ['flip', 'flip your phone over', '🔄'], ['tilt', 'tilt your phone', '↗️'], ['tap:red', 'tap red', '🔴'], ['tap:blue', 'tap blue', '🔵'], ['tap:green', 'tap green', '🟢'], ['tap:yellow', 'tap yellow', '🟡'], ['still', 'freeze! don\'t move', '🧊']];
  G({
    id: 'boosays', name: 'Boo Says', emoji: '🙋', sub: 'Do what Boo says, but only when he says "Boo says".',
    rules: ['Boo gives a command on the TV, like "Boo says: shake your phone!".', 'Do it on your phone, fast. The phone feels shakes, flips and tilts.', 'No "Boo says" first? Don\'t do it, or you\'re caught!'],
    settings: [{ key: 'speed', label: 'Speed', type: 'seg', options: [['relaxed', 'Relaxed'], ['normal', 'Normal'], ['fast', 'Fast']], default: 'normal' }, { key: 'scoring', label: 'Scoring', type: 'seg', options: [['knockout', 'Knockout'], ['points', 'Points (nobody goes out)']], default: 'knockout' },
      { key: 'tricks', label: 'Tricks', type: 'seg', options: [[0.2, 'A few'], [0.33, 'Some'], [0.5, 'Lots']], default: 0.33 }, { key: 'taps', label: 'Taps only (no shaking or tilting)', type: 'toggle', default: false }, rounds(15, [10, 15, 25]), KIDS],
    async tv(K) {
      const s = K.settings, knock = s.scoring === 'knockout' && !s.kids;
      let sec = { relaxed: 6, normal: 4.5, fast: 3.2 }[s.speed] * (s.kids ? 1.4 : 1);
      for (let r = 0; r < +s.rounds; r++) {
        if (K.over() || (knock && K.players().length > 1 && K.alive().length <= 1)) break;
        const pool = s.taps ? MOVES.filter(m => m[0].startsWith('tap')) : MOVES;
        let mv = P.pick(pool);
        const says = Math.random() > +s.tricks;
        if (!says && mv[0] === 'still') mv = P.pick(pool.filter(m => m[0] !== 'still'));
        const v = await qView(K, { title: (await K.tr('Round')) + ` ${r + 1}`, board: true });
        const big = K.el('div', 'center grow', v.main);
        K.el('div', 'big', big, mv[2]).style.fontSize = '18vh';
        const line = (says ? (await K.tr('Boo says:')) + ' ' : '') + await K.tr(mv[1] + '!');
        K.el('div', 'question', big, line);
        const face = K.el('img', '', big); face.alt = ''; face.src = P.booUri('boo:hi'); face.style.cssText = 'width:16vh;height:16vh';
        K.speak(line);
        const got = await K.ask({ kind: 'move', prompt: line, sec: Math.ceil(sec), extra: { taps: !!s.taps } });
        const caught = [];
        const inNow = K.alive();
        const isGood = p => { const a = got.get(p.id); const did = a && a.v && a.v !== 'none' ? String(a.v) : ''; return says ? (mv[0] === 'still' ? !did : did === mv[0]) : !did; };
        // (everyone caught at once: nobody goes out this round)
        const spare = knock && inNow.length > 1 && !inNow.some(isGood);
        for (const p of inNow) {
          if (isGood(p)) { p.score += 1; K.result(p.id, { ok: true, pts: 1, score: p.score }); }
          else { caught.push(p); if (knock && !spare) p.out = true; K.result(p.id, { ok: false, out: p.out, note: spare ? await K.tr('Everyone was caught, so nobody goes out this time.') : says ? await K.tr('Too slow, or the wrong move!') : await K.tr('Boo didn\'t say "Boo says"!') }); }
        }
        if (caught.length) {
          big.textContent = '';
          K.el('div', 'question', big, await K.tr('Caught!'));
          const row = K.el('div', 'players', big);
          for (const p of caught) { const c = K.el('div', 'player', row); const av = K.el('div', 'av', c); const im = K.el('img', '', av); im.src = K.avatarUrl(p); im.alt = ''; K.el('b', '', c, p.name); c.animate([{ transform: 'rotate(-8deg)' }, { transform: 'rotate(8deg)' }], { duration: 300, iterations: 4, direction: 'alternate' }); }
          K.boo('laugh'); P.sfx('wrong');
        } else { K.boo('happy'); P.sfx('right'); }
        v.board.draw();
        await K.sleep(2600);
        sec = Math.max(1.8, sec * 0.93);
      }
      return K.players().slice().sort((a, b) => (a.out - b.out) || b.score - a.score);
    }
  });

  // =====================================================================
  // Emoji Riddles
  // =====================================================================
  G({
    id: 'emoji', name: 'Emoji Riddles', emoji: '🦁', sub: 'Guess the movie, food or saying from a row of emoji.',
    rules: ['A row of emoji shows on the TV.', 'Pick or type what they mean. Faster scores more.', 'In the last round, everyone makes their own riddle.'],
    settings: [{ key: 'pack', label: 'Pack', type: 'seg', options: [['mix', 'A mix'], ['movies', 'Movies'], ['food', 'Food'], ['animals', 'Animals'], ['places', 'Places'], ['sayings', 'Sayings'], ['kids', 'Kids\' shows']], default: 'mix' },
      { key: 'answers', label: 'Answers', type: 'seg', options: [['choices', 'Four choices'], ['typing', 'Typing']], default: 'choices' }, rounds(10, [10, 15, 20]), { key: 'make', label: 'Last round: make your own', type: 'toggle', default: true }, KIDS],
    async tv(K) {
      const s = K.settings;
      const packs = s.kids ? ['kids', 'animals', 'food'] : s.pack === 'mix' ? Object.keys(PK.emoji) : [s.pack];
      const pool = P.shuffle(packs.flatMap(k => PK.emoji[k].map(x => ({ e: x[0], a: x[1], pack: k }))));
      const typing = s.answers === 'typing' && !s.kids;
      const sec = s.kids ? 0 : 20;
      for (let r = 0; r < Math.min(+s.rounds, pool.length); r++) {
        if (K.over()) break;
        const it = pool[r];
        const v = await qView(K, { title: (await K.tr('Riddle')) + ` ${r + 1}`, sub: await K.tr(it.pack), sec });
        const big = K.el('div', 'center', v.main);
        const em = K.el('div', 'big', big, it.e); em.style.fontSize = '20vh';
        em.animate([{ transform: 'scale(.4) rotate(-10deg)', opacity: 0 }, { transform: 'scale(1.1)', opacity: 1 }, { transform: 'scale(1)' }], { duration: 700, easing: 'cubic-bezier(.2,1.4,.4,1)' });
        const ansT = await K.tr(it.a);
        let opts = [], ok = -1;
        if (!typing) { const others = P.shuffle(PK.emoji[it.pack].filter(x => x[1] !== it.a)).slice(0, 3).map(x => x[1]); opts = P.shuffle([it.a, ...others]); ok = opts.indexOf(it.a); await answersGrid(K, v.main, await Promise.all(opts.map(o => K.tr(o)))); }
        const askOnce = async (secs) => K.ask(typing ? { kind: 'text', prompt: it.e, sec: secs, extra: { max: 60, place: await K.tr('What is it?') } } : { kind: 'choice', prompt: it.e, opts: await Promise.all(opts.map(o => K.tr(o))), sec: secs, extra: { letters: true } });
        const isRight = a => typing ? (P.close(a.v, ansT) || P.close(a.v, it.a)) : +a.v === ok;
        let got = await askOnce(sec);
        // nobody? a hint, and one more try
        if (![...got.values()].some(isRight) && typing) {
          K.el('div', 'question', big, `${await K.tr('Hint:')} ${it.a.split(/\s+/).length} ${await K.tr('words')}, "${ansT[0]}..."`);
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
          if (!e || !ans || !/\p{Extended_Pictographic}/u.test(e)) continue;
          const others = K.players().filter(p => p.id !== author);
          const v2 = await qView(K, { title: (await K.tr('A riddle by')) + ' ' + (K.player(author) || {}).name, sec: 25 });
          K.el('div', 'big', K.el('div', 'center', v2.main), e).style.fontSize = '18vh';
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
    rules: ['Two cards show on the TV.', 'Tap the one you think wins.', 'The winner stays, and a new card comes in.'],
    settings: [{ key: 'topic', label: 'Topic', type: 'seg', options: [['mix', 'A mix'], ['weight', 'Animals: weight'], ['speed', 'Animals: speed'], ['people', 'Places: people'], ['size', 'Places: size'], ['height', 'Height'], ['calories', 'Food: calories'], ['sports', 'Sports: stadiums'], ['history', 'History: which came first']], default: 'mix' },
      { key: 'scoring', label: 'Scoring', type: 'seg', options: [['points', 'Points'], ['streak', 'Longest streak'], ['knockout', 'Knockout']], default: 'points' }, rounds(10, [10, 15, 20]), { key: 'closest', label: 'Last round: closest guess', type: 'toggle', default: true }, KIDS],
    async tv(K) {
      const s = K.settings;
      const topics = s.topic === 'mix' ? Object.keys(PK.higher) : [s.topic];
      let topic = P.pick(topics), deck = [], champ = null;
      const draw = () => {
        if (!deck.length) { topic = P.pick(topics); deck = P.shuffle(PK.higher[topic].items); champ = null; }
        return deck.pop();
      };
      const best = new Map();
      for (let r = 0; r < +s.rounds; r++) {
        if (K.over() || (s.scoring === 'knockout' && K.players().length > 1 && K.alive().length <= 1)) break;
        let A, B, T;
        if (s.kids) { const two = P.shuffle(PK.kidsHigher).slice(0, 2); A = two[0]; B = two[1]; T = { q: 'Which weighs more?', unit: 'kg' }; }
        else { if (!champ || !deck.length) { if (deck.length < 2) { topic = P.pick(topics); deck = P.shuffle(PK.higher[topic].items); } champ = deck.pop(); } A = champ; B = draw(); T = PK.higher[topic]; }
        if (!B) break;
        const older = !!T.older;
        const winI = older ? (A[2] <= B[2] ? 0 : 1) : (A[2] >= B[2] ? 0 : 1);
        const v = await qView(K, { title: await K.tr(T.q), sub: (await K.tr('Round')) + ` ${r + 1}`, sec: s.kids ? 0 : 12 });
        const row = K.el('div', 'cards2', v.main);
        const card = async (x) => { const c = K.el('div', 'hl', row); K.el('div', 'e', c, x[0]); K.el('b', '', c, await K.tr(x[1])); const n = K.el('div', 'num', c, '?'); return { c, n }; };
        const ca = await card(A); K.el('div', 'question', row, 'vs'); const cb = await card(B);
        const got = await K.ask({ kind: 'choice', prompt: await K.tr(T.q), opts: [A[0] + ' ' + await K.tr(A[1]), B[0] + ' ' + await K.tr(B[1])], sec: s.kids ? 0 : 12, extra: { two: true } });
        if (v.ring) v.ring.stop();
        // the drum roll: both numbers count up
        P.sfx('drum');
        const fmt = n => T.unit === '' ? String(Math.round(n)) : (n >= 100 ? Math.round(n).toLocaleString() : (Math.round(n * 100) / 100).toLocaleString()) + ' ' + (T.unit || '');
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
          K.result(p.id, { ok: !!good, pts: good ? 1 : 0, score: p.score, out: p.out, note: p.streak > 1 ? `${p.streak} ${await K.tr('in a row!')}` : '' });
        }
        champ = winI === 0 ? A : B;
        v.board.draw();
        K.boo('wow');
        await K.sleep(3600);
      }
      // the closest guess: one exact number
      if (s.closest && !s.kids && !K.over()) {
        const items = PK.higher.height.items;
        const it = P.pick(items);
        const v = await qView(K, { title: await K.tr('Closest guess!'), sec: 25 });
        K.el('div', 'question', v.main, (await K.tr('How tall is it, in meters?')) + ' ' + it[0] + ' ' + await K.tr(it[1]));
        // (a slider on the phones, from 0 to a little past the tallest thing in the pack)
        const top = Math.ceil(Math.max(...items.map(x => x[2])) * 1.25 / 10) * 10;
        const got = await K.ask({ kind: 'number', prompt: (await K.tr('How tall, in meters?')) + ' ' + it[0], sec: 25, extra: { min: 0, max: top, slider: true, unit: 'm' } });
        let bestG = null;
        for (const [id, a] of got) { const d = Math.abs(+a.v - it[2]); if (!bestG || d < bestG.d) bestG = { id, d, ms: a.ms }; }
        K.el('div', 'question', v.main, (await K.tr('The answer:')) + ' ' + it[2].toLocaleString() + ' m').style.color = 'var(--gold)';
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
    rules: ['Each phone gets its own bingo card.', 'Mark the numbers the TV calls (or let the phone do it).', 'Your card matches the pattern? Tap BINGO! The TV checks it.'],
    settings: [{ key: 'pattern', label: 'Pattern', type: 'seg', options: [['line', 'A line'], ['corners', 'Four corners'], ['x', 'An X'], ['full', 'Full card']], default: 'line' },
      { key: 'speed', label: 'Calling speed', type: 'seg', options: [[9, 'Slow'], [6, 'Normal'], [4, 'Fast']], default: 6 }, { key: 'style', label: 'Style', type: 'seg', options: [['75', '75 balls'], ['90', '90 balls']], default: '75' },
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
      const v = K.view(await K.tr('Bingo Night'), s.prize ? (await K.tr('Prize:')) + ' ' + P.safe(s.prize, 80) : await K.tr(({ line: 'Get a line', corners: 'Get the four corners', x: 'Make an X', full: 'Fill the whole card' })[s.pattern]));
      const main = K.el('div', 'col grow', v);
      const ballBox = K.el('div', 'center', main); ballBox.style.minHeight = '34vh';
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
      K.on('paper', async (m, p) => { if (p && K.isHost(p.id) && +m.no > 0 && +m.no < next && ![...owned.values()].flat().includes(+m.no)) { await tryBingo('', +m.no); if (!winner) K.result(p.id, { ok: false, note: (await K.tr('Paper card')) + ' ' + m.no + ': ' + await K.tr('not yet.') }); } });
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
        const spoke = K.speak((style === '75' ? letterOf(n) + ' ' : '') + n);
        P.sfx('pop');
        K.say({ k: 'bingo-call', n, called: [...called], spoke: !!spoke });
        for (let t = 0; t < +s.speed * 10 && !winner; t++) await K.sleep(100);
        // (easy mode: a card that's done wins, even if its player forgot to tap BINGO)
        if (s.auto && !winner) for (const [id, nos] of owned) { const no = nos.find(x => wins(cardFor(x), called, s.pattern, style)); if (no && K.player(id) && !K.player(id).away) { winner = { who: id, no }; break; } }
      }
      if (winner) {
        const p = winner.who ? K.player(winner.who) : null;
        ballBox.textContent = '';
        K.el('div', 'question', ballBox, 'BINGO! ' + (p ? p.name : (await K.tr('Paper card')) + ' ' + winner.no));
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
  // Who's the Imposter?
  // =====================================================================
  G({
    id: 'imposter', name: 'Who\'s the Imposter?', emoji: '🕵️', sub: 'Everyone has the same secret word, except one.',
    rules: ['Your phone shows the secret word while you hold "Hold to peek". The imposter only sees the category.', 'Take turns saying one word about it. Too obvious, and the imposter catches on!', 'Vote for the imposter. Caught? They can still steal the win by guessing the word.'],
    settings: [{ key: 'pack', label: 'Words', type: 'seg', options: [['food', 'Food'], ['animals', 'Animals'], ['places', 'Places'], ['movies', 'Movies'], ['jobs', 'Jobs'], ['holidays', 'Holidays'], ['kids', 'Pictures (kids)'], ['own', 'The host\'s own words']], default: 'food' },
      { key: 'own', label: 'Your own words (one on each line)', type: 'text', default: '', when: ['pack', 'own'] }, { key: 'imps', label: 'Imposters', type: 'seg', options: [[1, '1'], [2, '2 (big groups)']], default: 1 },
      { key: 'sees', label: 'The imposter sees', type: 'seg', options: [['cat', 'The category'], ['none', 'Nothing (hard)'], ['similar', 'A similar word']], default: 'cat' },
      { key: 'clues', label: 'Clues', type: 'seg', options: [['say', 'Said out loud'], ['type', 'Typed (show on the TV)']], default: 'say' }, { key: 'turns', label: 'Clue rounds', type: 'seg', options: [[1, '1'], [2, '2'], [3, '3']], default: 1 },
      { key: 'clueSec', label: 'Time for each clue', type: 'seg', options: [[15, '15 s'], [25, '25 s']], default: 15 }, { key: 'talkSec', label: 'Time to argue', type: 'seg', options: [[45, '45 s'], [90, '90 s'], [150, '2.5 min']], default: 90 },
      { key: 'games', label: 'Games', type: 'seg', options: [[1, '1'], [3, '3'], [5, '5']], default: 3 }],
    async tv(K) {
      const s = K.settings;
      let lastImp = new Set();
      for (let gN = 0; gN < +s.games; gN++) {
        if (K.over()) break;
        const ps = K.players();
        if (ps.length < 3) { const v = K.view(await K.tr('Who\'s the Imposter?')); K.el('div', 'question', v, await K.tr('This game needs at least 3 players.')); await K.sleep(4000); break; }
        // the word (and a close one), the imposters (never the same one twice in a row)
        let pairs;
        if (s.pack === 'own') { const own = String(s.own || '').split(/\n|\|/).map(x => P.safe(x, 40)).filter(Boolean); pairs = own.length >= 2 ? own.map(w => [w, P.pick(own.filter(x => x !== w))]) : PK.imposter.food; }
        else pairs = PK.imposter[s.pack] || PK.imposter.food;
        const pair = P.pick(pairs);
        const word = await K.tr(pair[0]), close = await K.tr(pair[1]);
        const cat = await K.tr(PK.impCats[s.pack] || 'Words');
        const can = ps.filter(p => !lastImp.has(p.id));
        const imps = P.shuffle(can.length >= +s.imps ? can : ps).slice(0, Math.min(+s.imps, ps.length - 2));
        lastImp = new Set(imps.map(p => p.id));
        const kids = s.pack === 'kids';
        // each phone's secret is sealed for that phone alone
        for (const p of ps) {
          const imp = lastImp.has(p.id);
          K.box(p.id, { k: 'secret', g: gN, word: imp ? (s.sees === 'similar' ? close : '') : word, cat: imp && s.sees === 'none' ? '' : cat, imp: imp && s.sees !== 'similar', kids, pic: kids && (!imp || s.sees === 'similar') });
        }
        let v = K.view(await K.tr('Who\'s the Imposter?'), (await K.tr('Game')) + ` ${gN + 1} / ${s.games}`);
        const c = K.el('div', 'center grow', v);
        K.el('div', 'question', c, await K.tr('Check your secret word: hold "Hold to peek" on your phone, so nobody else sees it.'));
        K.el('img', '', c).src = P.booUri('boo:peek');
        K.wait(K.strings.peek, { peek: true });
        await K.sleep(9000);
        // the clues, one player at a time
        const order = P.shuffle(ps);
        const clues = new Map();
        for (let t = 0; t < +s.turns; t++) for (const p of order) {
          if (K.over()) return [];
          v = K.view(await K.tr('Clues'), (await K.tr('Round')) + ` ${t + 1} / ${s.turns}`);
          const box = K.el('div', 'center grow', v);
          const im = K.el('img', '', box); im.src = K.avatarUrl(p); im.alt = ''; im.style.cssText = 'width:24vh;height:24vh;border-radius:50%;object-fit:cover;border:1vh solid ' + p.color;
          K.el('div', 'question', box, p.name + ': ' + await K.tr(s.clues === 'type' ? 'type one word about it' : 'say one word about it'));
          const rg = K.ring(box, +s.clueSec);
          const shown = K.el('div', 'players', box);
          for (const [id, list] of clues) for (const w of list) { const cl = K.el('div', 'pill', shown, (K.player(id) || {}).name + ': ' + w); cl.style.fontSize = '2.6vh'; }
          if (s.clues === 'type') {
            const a = (await K.ask({ kind: 'text', prompt: await K.tr('One word about it'), sec: +s.clueSec, who: [p.id], extra: { max: 24 } })).get(p.id);
            const w = a ? P.safe(a.v, 24, '***') : '...';
            if (!clues.has(p.id)) clues.set(p.id, []);
            clues.get(p.id).push(w);
            K.el('div', 'question', box, '"' + w + '"').style.color = 'var(--gold)';
            await K.sleep(1500);
          } else { K.wait(); await K.sleep(+s.clueSec * 1000); }
          rg.stop();
        }
        // argue it out, then vote
        v = K.view(await K.tr('Who is it?'), await K.tr('Talk it over!'));
        const talk = K.el('div', 'center grow', v);
        const rg2 = K.ring(talk, +s.talkSec);
        K.el('div', 'question', talk, await K.tr('Argue it out. Then vote on your phone.'));
        await K.sleep(+s.talkSec * 1000);
        rg2.stop();
        const votes = await K.ask({ kind: 'players', prompt: await K.tr('Who is the imposter?'), opts: ps.map(p => ({ id: p.id, name: p.name, ph: !!p.photo, av: p.av })), sec: 30 });
        // the votes, one at a time; then Boo takes the mask off the one with the most
        v = K.view(await K.tr('The votes'));
        const grid = K.el('div', 'players', v);
        const cards = new Map(), count = new Map();
        for (const p of ps) { const cd = K.el('div', 'player', grid); const av = K.el('div', 'av', cd); const im = K.el('img', '', av); im.src = K.avatarUrl(p); im.alt = ''; K.el('b', '', cd, p.name); cards.set(p.id, { cd, n: K.el('span', 'pill', cd, '0') }); }
        for (const [, a] of votes) { if (!cards.has(a.v)) continue; count.set(a.v, (count.get(a.v) || 0) + 1); cards.get(a.v).n.textContent = String(count.get(a.v)); cards.get(a.v).cd.animate([{ transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 400 }); P.sfx('pop'); await K.sleep(650); }
        const most = Math.max(0, ...count.values());
        const accused = [...count].filter(([, n]) => n === most).map(([id]) => id);
        const caught = accused.length === 1 && lastImp.has(accused[0]) ? K.player(accused[0]) : null;
        await K.sleep(1200);
        v = K.view(await K.tr('Unmasked!'));
        const um = K.el('div', 'center grow', v);
        K.el('img', '', um).src = P.booUri('boo:scary');
        K.el('div', 'question', um, (await K.tr('The imposter was')) + ' ' + imps.map(p => p.name).join(' & ') + '! ' + (await K.tr('The word was')) + ' "' + word + '".');
        let impWins = !caught;
        if (caught) {
          // one last chance: guess the word
          const opts = P.shuffle([word, ...P.shuffle(pairs.filter(x => x[0] !== pair[0]).map(x => x[0])).slice(0, 5)]);
          const tOpts = await Promise.all(opts.map(o => K.tr(o)));
          K.el('div', 'muted', um, caught.name + ' ' + await K.tr('was caught... but can steal the win by guessing the word!')).style.fontSize = '3vh';
          const g = (await K.ask({ kind: 'choice', prompt: await K.tr('Guess the secret word!'), opts: tOpts, sec: 20, who: [caught.id] })).get(caught.id);
          if (g && tOpts[+g.v] === word) { impWins = true; K.el('div', 'question', um, await K.tr('Stolen! The imposter guessed it!')); P.sfx('win'); }
          else { K.el('div', 'question', um, await K.tr('Caught! The players win!')); P.sfx('right'); }
        }
        for (const p of ps) {
          const imp = lastImp.has(p.id);
          const pts = imp ? (impWins ? 3 : 0) : (impWins ? 0 : 1);
          p.score += pts;
          K.result(p.id, { ok: pts > 0, pts, score: p.score });
        }
        K.boo(impWins ? 'laugh' : 'happy');
        if (impWins) P.confetti(80);
        await K.sleep(6000);
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });

  // =====================================================================
  // Boo Party: a board game around a haunted house, with mini games
  // =====================================================================
  const BOARDS = { haunted: ['🍬', '🍬', '👻', '❓', '🍬', '🔄', '🕸️', '🍬', '🛒', '🍬', '❓', '💀', '🍬', '⭐', '🍬', '🔄', '🕸️', '❓', '🍬', '🛒', '🍬', '💀', '🍬', '⭐'],
    candy: ['🍭', '🍭', '🍩', '❓', '🍭', '🔄', '🍫', '🍭', '🛒', '🍭', '❓', '🦷', '🍭', '⭐', '🍭', '🔄', '🍫', '❓', '🍭', '🛒', '🍭', '🦷', '🍭', '⭐'],
    space: ['🪐', '🪐', '👽', '❓', '🪐', '🔄', '☄️', '🪐', '🛒', '🪐', '❓', '🕳️', '🪐', '⭐', '🪐', '🔄', '☄️', '❓', '🪐', '🛒', '🪐', '🕳️', '🪐', '⭐'] };
  G({
    id: 'party', name: 'Boo Party', emoji: '🏚️', sub: 'A board game around a haunted house, with mini games between turns.', teams: true, teamsWin: true,
    rules: ['On your turn, shake your phone (or tap Roll) to move.', 'Where you land decides: candy, swaps, questions, traps or the shop.', 'After each round, everyone plays a quick mini game. Most candy wins!'],
    settings: [rounds(10, [10, 15, 20]), { key: 'board', label: 'Board', type: 'seg', options: [['haunted', 'Haunted house'], ['candy', 'Candy land'], ['space', 'Outer space']], default: 'haunted' },
      { key: 'minis', label: 'Mini games after each round', type: 'toggle', default: true },
      { key: 'mTap', label: 'Tap race', type: 'toggle', default: true, when: ['minis', true] }, { key: 'mBar', label: 'Stop the bar', type: 'toggle', default: true, when: ['minis', true] },
      { key: 'mMemory', label: 'Memory test', type: 'toggle', default: true, when: ['minis', true] }, { key: 'mMath', label: 'Quick math', type: 'toggle', default: true, when: ['minis', true] },
      { key: 'teams', label: 'Teams (they share their candy)', type: 'toggle', default: false }, { key: 'teamN', label: 'How many teams', type: 'seg', options: [[2, '2'], [3, '3'], [4, '4']], default: 2, when: ['teams', true] }, KIDS],
    async tv(K) {
      const s = K.settings;
      const spaces = BOARDS[s.board] || BOARDS.haunted;
      const N = spaces.length;
      const pos = new Map(), dbl = new Map();
      K.players().forEach(p => { pos.set(p.id, 0); p.score = 5; });
      const xy = i => { const a = (i / N) * Math.PI * 2 - Math.PI / 2; return [50 + 40 * Math.cos(a), 50 + 38 * Math.sin(a)]; };
      const drawBoard = async (title) => {
        const v = K.view(await K.tr('Boo Party'), title);
        const wrap = K.el('div', 'board-game', v);
        spaces.forEach((e, i) => { const sp = K.el('div', 'space', wrap, e); const [x, y] = xy(i); sp.style.left = x + '%'; sp.style.top = y + '%'; });
        const mid = K.el('div', 'center', wrap); mid.style.cssText = 'position:absolute;left:30%;top:30%;width:40%;height:40%';
        const pieces = new Map();
        K.players().forEach((p, k) => { const pc = K.el('div', 'piece', wrap); const im = K.el('img', '', pc); im.src = K.avatarUrl(p); im.alt = ''; const [x, y] = xy(pos.get(p.id) || 0); pc.style.left = (x + (k % 3) * 1.2) + '%'; pc.style.top = (y + Math.floor(k / 3) * 1.2) + '%'; pieces.set(p.id, pc); });
        const b = K.board(v, { title: await K.tr('Candy') });
        return { v, wrap, mid, pieces, b };
      };
      // (kids: a shorter game)
      const total = s.kids ? Math.min(8, +s.rounds) : +s.rounds;
      for (let r = 0; r < total; r++) {
        for (const p of K.players()) {
          if (K.over()) return [];
          const B = await drawBoard((await K.tr('Round')) + ` ${r + 1} / ${total}`);
          K.el('div', 'question', B.mid, p.name + ': ' + await K.tr('roll!'));
          const a = (await K.ask({ kind: 'roll', prompt: K.strings.shake, sec: 20, who: [p.id] })).get(p.id);
          void a;
          const two = dbl.get(p.id);
          const roll = 1 + Math.floor(Math.random() * 6) + (two ? 1 + Math.floor(Math.random() * 6) : 0);
          dbl.delete(p.id);
          B.mid.textContent = '';
          K.el('div', 'dice', B.mid, ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][Math.min(6, roll)] || String(roll)).title = String(roll);
          K.el('div', 'question', B.mid, String(roll));
          P.sfx('drum');
          // hop, hop, hop
          for (let i = 0; i < roll; i++) { pos.set(p.id, (pos.get(p.id) + 1) % N); const [x, y] = xy(pos.get(p.id)); const pc = B.pieces.get(p.id); pc.style.left = x + '%'; pc.style.top = y + '%'; P.sfx('pop'); await K.sleep(330); }
          const e = spaces[pos.get(p.id)];
          let text = '';
          if (['🍬', '🍭', '🪐'].includes(e)) { p.score += 3; text = '+3 ' + await K.tr('candy!'); }
          else if (['👻', '🍩', '👽'].includes(e)) { p.score += 5; text = await K.tr('A friendly ghost gives you') + ' +5!'; }
          else if (['💀', '🦷', '🕳️'].includes(e)) { const back = s.kids ? 1 : 3; pos.set(p.id, (pos.get(p.id) - back + N) % N); p.score = Math.max(0, p.score - (s.kids ? 0 : 2)); text = await K.tr('Boo trap! Slide back') + ' ' + back + (s.kids ? '' : ', -2'); }
          else if (['🕸️', '🍫', '☄️'].includes(e)) { p.score = Math.max(0, p.score - (s.kids ? 0 : 1)); text = s.kids ? await K.tr('Sticky! Nothing happens.') : await K.tr('Stuck in a web: -1 candy'); }
          else if (e === '⭐') { p.score += 8; text = await K.tr('A star space: +8 candy!'); }
          else if (e === '🔄') {
            const others = K.players().filter(x => x.id !== p.id);
            if (others.length && !s.kids) { const o = P.pick(others); const t = pos.get(o.id); pos.set(o.id, pos.get(p.id)); pos.set(p.id, t); text = await K.tr('Swap places with') + ' ' + o.name + '!'; }
            else { p.score += 2; text = '+2 ' + await K.tr('candy!'); }
          } else if (e === '🛒') {
            if (p.score >= 5) { const buy = (await K.ask({ kind: 'choice', prompt: await K.tr('The shop: double dice next turn for 5 candy?'), opts: [await K.tr('Buy it'), await K.tr('No thanks')], sec: 12, who: [p.id] })).get(p.id); if (buy && +buy.v === 0) { p.score -= 5; dbl.set(p.id, true); text = await K.tr('Double dice next turn!'); } else text = await K.tr('Maybe next time.'); }
            else text = await K.tr('The shop is closed for you: you need 5 candy.');
          } else if (e === '❓') {
            const q = P.pick(PK.easy);
            const opts = P.shuffle([q[1], ...q[2]]);
            const ans = (await K.ask({ kind: 'choice', prompt: await K.tr(q[0]), opts: await Promise.all(opts.map(o => K.tr(o))), sec: 15, who: [p.id], extra: { letters: true } })).get(p.id);
            if (ans && opts[+ans.v] === q[1]) { p.score += 4; text = await K.tr('Right! +4 candy'); } else text = await K.tr('Not this time. It was') + ' ' + await K.tr(q[1]);
          }
          B.mid.textContent = '';
          K.el('div', 'big', B.mid, e).style.fontSize = '14vh';
          K.el('div', 'question', B.mid, text);
          B.b.draw();
          K.result(p.id, { ok: true, score: p.score, note: text });
          await K.sleep(2600);
        }
        if (s.minis && !K.over()) await mini(K, r, ['tap', 'bar', 'memory', 'math'].filter(k => s['m' + k[0].toUpperCase() + k.slice(1)] !== false));
      }
      return K.players().slice().sort((a, b) => b.score - a.score);
    }
  });
  // the mini games: everyone at once, 20 seconds or less, the winner gets bonus candy
  async function mini(K, r, kinds) {
    if (!kinds || !kinds.length) return;
    const kind = kinds[r % kinds.length];
    const v = await qView(K, { title: await K.tr('Mini game!'), sub: await K.tr({ tap: 'Tap race: tap as fast as you can!', bar: 'Stop the bar in the middle!', memory: 'Remember the emoji!', math: 'Quick math!' }[kind]) });
    const box = K.el('div', 'center grow', v.main);
    let got, best = null;
    if (kind === 'tap') { K.el('div', 'big', box, '👆'); got = await K.ask({ kind: 'tap', prompt: K.strings.look, sec: 10 }); for (const [id, a] of got) if (!best || +a.v > best.v) best = { id, v: +a.v }; }
    else if (kind === 'bar') { K.el('div', 'big', box, '🎯'); got = await K.ask({ kind: 'bar', prompt: K.strings.look, sec: 12 }); for (const [id, a] of got) { const d = Math.abs(+a.v - 0.5); if (!best || d < best.v) best = { id, v: d }; } }
    else if (kind === 'memory') {
      const set = P.shuffle(['🍕', '🐶', '🚀', '🎈', '🌵', '🐙', '🍩', '🎸', '⚽', '🦄', '🍎', '🌙']);
      const shown = set.slice(0, 4);
      const big = K.el('div', 'big', box, shown.join(' ')); big.style.fontSize = '14vh';
      await K.sleep(3500);
      big.textContent = '❓';
      const opts = P.shuffle([shown[Math.floor(Math.random() * 4)], ...set.slice(4, 7)]);
      const right = opts.findIndex(o => shown.includes(o));
      got = await K.ask({ kind: 'choice', prompt: await K.tr('Which one was on the TV?'), opts, sec: 10 });
      for (const [id, a] of got) if (+a.v === right && (!best || a.ms < best.v)) best = { id, v: a.ms };
    } else {
      const ch = challenge('math', false);
      K.el('div', 'question', box, ch.q);
      got = await K.ask({ kind: 'choice', prompt: ch.q, opts: ch.opts, sec: 10 });
      for (const [id, a] of got) if (+a.v === ch.ok && (!best || a.ms < best.v)) best = { id, v: a.ms };
    }
    if (best) { const p = K.player(best.id); p.score += 5; K.el('div', 'question', box, '🏆 ' + p.name + ' +5'); K.result(p.id, { ok: true, pts: 5, score: p.score }); P.sfx('win'); }
    v.board.draw();
    await K.sleep(3200);
  }
})();
