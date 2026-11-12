// Made from games.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change games.js and run node tools/old-js.js again.
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
(() => {
  "use strict";
  const P = BVPLAYC, PK = BVPACKS;
  const G = (def) => BVPLAY.game(def);
  const rounds = (d, list) => ({ key: "rounds", label: "Rounds", type: "number", min: 1, max: 60, quick: list, default: d });
  const LET = P.LETTERS;
  function qView(K, o) {
    return __async(this, null, function* () {
      const right = [];
      let rg = null;
      if (o.sec) {
        rg = K.ring(document.createElement("div"), o.sec, o.idle);
        right.push(rg.node);
      }
      const body = K.view(yield K.tr(o.title), o.sub ? yield K.tr(o.sub) : "", right);
      const main = K.el("div", "col grow", body);
      const b = o.board === false ? null : K.board(body, { lives: o.lives, title: yield K.tr("Scoreboard") });
      return { body, main, board: b, ring: rg };
    });
  }
  function answersGrid(K, parent, opts, hx, pre) {
    return __async(this, null, function* () {
      const g = K.el("div", "answers" + (hx ? " hx" : ""), parent);
      const cells = [];
      for (let i = 0; i < opts.length; i++) {
        const len = String(opts[i] || "").length;
        const a = K.el("div", "ans " + LET[i] + (hx ? " hx" + (len > 44 ? " xlong" : len > 26 ? " long" : "") : "") + (pre ? " pre" : ""), g);
        K.el("span", "l", a, BVI18N.letters(K.lang)[i] || LET[i]);
        K.el("span", "", a, opts[i]);
        cells.push({ node: a, who: K.el("span", "who", a) });
      }
      return cells;
    });
  }
  function showWho(K, cell, ids) {
    const ps = ids.map((id) => K.player(id)).filter(Boolean);
    for (const p of ps.slice(0, ps.length > 7 ? 6 : 7)) {
      const im = K.el("img", "", cell.who);
      im.src = K.avatarUrl(p);
      im.alt = "";
    }
    if (ps.length > 7) K.el("span", "more", cell.who, "+" + K.num(ps.length - 6));
  }
  function firstBadge(K, parent, p, ms) {
    return __async(this, null, function* () {
      const f = K.el("div", "first", parent);
      const im = K.el("img", "", f);
      im.src = K.avatarUrl(p);
      im.alt = "";
      f.append("⚡ " + (yield K.tr("First: {name} ({s} s)", { name: "⁨" + p.name + "⁩", s: K.num(Math.round(ms / 100) / 10) })));
      return f;
    });
  }
  const catName = (id) => (PK.cats.find((c) => c[0] === id) || [0, ""])[1];
  const fromBank = (x) => ({ q: x[0], a: x[1], w: x[2], cat: x[3], c: catName(x[3]), d: x[4] });
  const BANK_CATS = new Set(PK.trivia.map((x) => x[3]));
  const QI = window.BVQ || null;
  const LV = ["easy", "medium", "hard"];
  const QBASE = (window.BVI18N ? BVI18N.BASE : "") + "q/";
  const qFiles = /* @__PURE__ */ new Map();
  function qFile(lang, cat) {
    const k = lang + "|" + cat;
    if (!qFiles.has(k)) {
      qFiles.set(k, fetch(QBASE + lang + "/" + cat + ".json?v=" + (QI ? QI.v : 1), { credentials: "omit" }).then((r) => r.ok ? r.json() : null).then((j) => j && Array.isArray(j.q) ? j.q.map((x) => ({ id: cat + "." + x[0], cat, c: catName(cat), d: LV[x[1]] || "easy", q: x[2], a: x[3], w: x.slice(4, 7), why: typeof x[7] === "string" ? x[7] : "" })) : null).catch(() => null).then((l) => {
        if (!l) qFiles.delete(k);
        return l;
      }));
    }
    return qFiles.get(k);
  }
  const qCats = (lang) => QI && QI.n && QI.n[lang] ? Object.keys(QI.n[lang]).map(Number).filter((c) => PK.cats.some((x) => x[0] === c)) : [];
  const qIdx = /* @__PURE__ */ new Map();
  function qOne(lang, id) {
    const cat = +String(id).split(".")[0];
    if (!cat || !qCats(lang).includes(cat)) return Promise.resolve(null);
    const k = lang + "|" + cat;
    if (!qIdx.has(k)) qIdx.set(k, qFile(lang, cat).then((l) => l ? new Map(l.map((x) => [x.id, x])) : null).then((m) => {
      if (!m) qIdx.delete(k);
      return m;
    }));
    return qIdx.get(k).then((m) => m && m.get(id) || null);
  }
  function qTrans(K, q, perm, ps) {
    return __async(this, null, function* () {
      const langs = [...new Set(ps.map((p) => K.langOf(p.id)).filter((l) => l && l !== K.lang))];
      if (!langs.length || !/^\d+\.\d+$/.test(String(q.id))) return null;
      const out = {};
      yield Promise.all(langs.map((lg) => __async(this, null, function* () {
        const x = yield Promise.race([qOne(lg, q.id), new Promise((r) => setTimeout(() => r(null), 2e3))]);
        if (x && x.w && x.w.length >= 3) {
          const src = [x.a, ...x.w];
          out[lg] = { q: x.q, o: perm.map((j) => src[j]) };
          if (x.why) out[lg].y = x.why;
        }
      })));
      return Object.keys(out).length ? out : null;
    });
  }
  function qBuiltIn(LP) {
    const CAT = { Animals: 27, Food: 9, Science: 17, General: 9, Math: 19, Geography: 22, Music: 12 };
    const bank = (LP ? LP.trivia : PK.trivia).map((x, i) => Object.assign(fromBank(x), { id: "b." + i }));
    return bank.concat((LP ? LP.easy : PK.easy).map((x, i) => {
      const c = CAT[x[3]] || 9;
      return { id: "s." + i, cat: c, c: catName(c), d: "easy", q: x[0], a: x[1], w: x[2] };
    }));
  }
  const ASKED = "bvplay:asked";
  const askedList = () => {
    try {
      return (localStorage.getItem(ASKED) || "").split(",").filter(Boolean);
    } catch (e) {
      return [];
    }
  };
  function markAsked(id) {
    try {
      const l = askedList().filter((x) => x !== id);
      l.push(id);
      localStorage.setItem(ASKED, l.slice(-2e4).join(","));
    } catch (e) {
    }
  }
  function qPicker(pool) {
    const rank = new Map(askedList().map((id, i) => [id, i]));
    const by = /* @__PURE__ */ new Map();
    for (const q of pool) {
      const k = q.cat + "|" + q.d;
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(q);
    }
    const cats = [...new Set(pool.map((q) => q.cat))];
    const used = /* @__PURE__ */ new Set(), answers = /* @__PURE__ */ new Set(), texts = /* @__PURE__ */ new Set();
    let lastCat = 0;
    const plain = /* @__PURE__ */ new WeakMap();
    const pl = (q) => {
      let x = plain.get(q);
      if (!x) {
        x = { a: P.norm(q.a), q: P.norm(q.q) };
        plain.set(q, x);
      }
      return x;
    };
    const ok = (q) => !used.has(q.id) && (!answers.size || !answers.has(pl(q).a)) && (!texts.size || !texts.has(pl(q).q));
    const has = (c, d) => (by.get(c + "|" + d) || []).some(ok);
    function from(c, d) {
      const list = (by.get(c + "|" + d) || []).filter(ok);
      if (!list.length) return null;
      const fresh = list.filter((q) => !rank.has(q.id));
      if (fresh.length) return P.pick(fresh);
      list.sort((a, b) => rank.get(a.id) - rank.get(b.id));
      return P.pick(list.slice(0, Math.max(1, Math.ceil(list.length / 4))));
    }
    function anyCat(d) {
      let opts = cats.filter((c) => c !== lastCat && has(c, d));
      if (!opts.length) opts = cats.filter((c) => has(c, d));
      if (!opts.length) return 0;
      const wts = opts.map((c) => Math.sqrt(1 + (by.get(c + "|" + d) || []).filter((q) => !rank.has(q.id)).length));
      let r = Math.random() * wts.reduce((a, b) => a + b, 0);
      for (let i = 0; i < opts.length; i++) {
        r -= wts[i];
        if (r <= 0) return opts[i];
      }
      return opts[opts.length - 1];
    }
    return {
      take(d, cat) {
        let q = null;
        for (const lv of [d, ...{ easy: ["medium", "hard"], medium: ["easy", "hard"], hard: ["medium", "easy"] }[d]]) {
          q = cat && from(cat, lv) || from(anyCat(lv), lv);
          if (q) break;
        }
        if (!q) return null;
        used.add(q.id);
        answers.add(P.norm(q.a));
        texts.add(P.norm(q.q));
        lastCat = q.cat;
        return q;
      }
    };
  }
  function qLevels(n, level) {
    if (LV.includes(level)) return Array(n).fill(level);
    return Array.from({ length: n }, (_, i) => stageOf(i, n));
  }
  const teamOf = (K, p) => P.TEAMS.find((t) => t[0] === p.team);
  const DIFF = { easy: "Easy", medium: "Medium", hard: "Hard" };
  function tqView(K, o) {
    return __async(this, null, function* () {
      const body = K.view(null);
      body.classList.add("tq");
      const main = K.el("div", "tq-main", body);
      const top = K.el("div", "tq-top", main);
      const lg = K.el("div", "tq-logo gi", top);
      const li = K.el("img", "", lg);
      li.src = "icons/trivia.webp";
      li.alt = "";
      const cat = o.q.c ? yield K.tr(o.q.c) : "", dif = DIFF[o.q.d] ? yield K.tr(DIFF[o.q.d]) : "";
      K.el("div", "tq-meta caps grow", top, [cat, dif].filter(Boolean).join(" · "));
      const meta = K.el("div", "tq-meta caps tq-r", top);
      const mid = K.el("div", "tq-mid", main);
      const board = yield tqBoard(K, mid, o, meta);
      if (board.node.classList.contains("tight")) body.classList.add("crowd");
      else if (board.node.classList.contains("many")) body.classList.add("packed");
      let ring = null, inf = null;
      const tw = K.el("div", "tq-timer boo-slot", mid);
      if (o.sec) ring = K.ring(tw, o.sec, true);
      else inf = K.el("span", "inf", tw, "∞");
      const fx = K.el("div", "tq-fx", main);
      const qw = K.el("div", "tq-qw in", main);
      const len = String(o.text || "").length;
      const qb = K.el("div", "tq-q" + (len > 110 ? " xlong" : len > 64 ? " long" : ""), qw);
      const q = K.el("span", "", qb, o.text);
      const cells = yield answersGrid(K, main, o.opts, true, true);
      yield tqLadder(K, body, o);
      fitTq(body);
      function showAnswers(gap) {
        return __async(this, null, function* () {
          for (const c of cells) {
            if (K.over()) break;
            c.node.classList.remove("pre");
            c.node.classList.add("pop");
            yield K.sleep(gap);
          }
        });
      }
      return { body, main, board, ring, inf, q, fx, cells, showAnswers };
    });
  }
  function fitTq(body) {
    const st = body.parentElement;
    if (!st) return;
    const over = () => st.scrollHeight > st.clientHeight + 1;
    for (const k of ["packed", "crowd", "squeeze"]) {
      if (!over()) return;
      body.classList.add(k);
    }
  }
  function tqIntro(K, o) {
    return __async(this, null, function* () {
      const body = K.view(null);
      body.classList.add("tqi");
      if (o.big || o.last) K.el("div", "tqi-rays", body);
      const box = K.el("div", "tqi-box" + (o.big ? " big" : "") + (o.last ? " fin" : ""), body);
      const hex = K.el("div", "tqi-hex", box);
      K.el("b", "", hex, K.num(o.num));
      K.el("div", "tqi-t", box, o.total ? yield K.tr("Question {n} / {total}", { n: K.num(o.num), total: K.num(o.total) }) : yield K.tr("Question {n}", { n: K.num(o.num) }));
      const cat = o.q.c ? yield K.tr(o.q.c) : "", dif = DIFF[o.q.d] ? yield K.tr(DIFF[o.q.d]) : "";
      if (cat || dif) K.el("div", "tqi-c caps", box, [cat, dif].filter(Boolean).join(" · "));
      if (o.last) K.el("div", "tqi-rib", box, yield K.tr(o.race ? "One more right answer wins!" : o.last === 1 ? "Last question!" : "Last 2 questions!"));
    });
  }
  function stageOf(i, n) {
    const e = Math.ceil(n / 3), h = Math.floor(n / 3), m = n - e - h;
    return i < e ? "easy" : i < e + m ? "medium" : "hard";
  }
  function tqBoard(K, parent, o, meta) {
    return __async(this, null, function* () {
      const n = K.players().length, few = n <= 4;
      const cols = few ? 1 : n <= 10 ? 2 : n <= 15 ? 3 : n <= 20 ? 4 : 5;
      const rowsN = Math.max(1, Math.ceil(n / cols));
      const b = K.el("div", "tq-board " + (few ? "few" : "many") + (cols > 2 ? " wide" : "") + (rowsN > 5 ? " tight" : ""), parent);
      const hd = K.el("div", "tq-bh", b);
      K.el("b", "", hd, yield K.tr("Scoreboard"));
      const hr = K.el("span", few ? "caps" : "", hd, few ? yield K.tr("Score") : "");
      const list = K.el("div", "tq-rows", b);
      if (!few) {
        list.style.gridTemplateColumns = "repeat(" + cols + ", minmax(0, 1fr))";
        list.style.gridTemplateRows = "repeat(" + rowsN + ", auto)";
      }
      const W = {};
      for (const [k, t] of [["in", "Locked in"], ["think", "thinking"], ["out", "Out"], ["right", "Right!"], ["miss", "Missed"]]) W[k] = yield K.tr(t);
      const modeT = yield K.tr((TRIVIA_MODES.find((m) => m[0] === o.mode) || TRIVIA_MODES[0])[1]);
      const asked = new Set(o.live.map((p) => p.id));
      if (!few) meta.textContent = modeT + " · " + (yield K.tr("{n} players", { n }));
      const put = (node, text, vars, before) => {
        const tag = text + JSON.stringify(vars);
        node._want = tag;
        node.textContent = before + K.f(text, vars);
        Promise.resolve(K.tr(text, vars)).then((t) => {
          if (node._want === tag) node.textContent = before + t;
        }).catch(() => {
        });
      };
      const goal = Math.max(1, o.goal || 1);
      const rows = /* @__PURE__ */ new Map();
      const row = (p) => {
        let r = rows.get(p.id);
        if (r) return r;
        const tm = teamOf(K, p), color = tm ? tm[2] : p.color;
        r = K.el("div", "tq-p", list);
        const av = K.el("span", "av", r);
        av.style.setProperty("--pc", color);
        const im = K.el("img", "", av);
        im.src = K.avatarUrl(p);
        im.alt = "";
        K.el("i", "ok", av, "✓");
        K.el("b", "", r, p.name);
        if (few) {
          const bar = K.el("span", "bar", r);
          r._fill = K.el("i", "", bar);
          r._fill.style.background = color;
        }
        r._h = K.el("span", "hearts", r);
        if (few) r._st = K.el("span", "st", r);
        r._pts = K.el("span", "pts", r);
        rows.set(p.id, r);
        return r;
      };
      const draw = (answered, res) => {
        const ps = K.players().slice().sort((a, c) => c.score - a.score || (a.out ? 1 : 0) - (c.out ? 1 : 0));
        for (const [id, r] of rows) if (!ps.some((p) => p.id === id)) {
          r.remove();
          rows.delete(id);
        }
        if (!few) list.style.gridTemplateRows = "repeat(" + Math.max(1, Math.ceil(ps.length / cols)) + ", auto)";
        for (const p of ps) {
          const r = row(p);
          list.appendChild(r);
          const did = !!(answered && answered.has(p.id));
          r.classList.toggle("done", did);
          r.classList.toggle("out", !!p.out);
          r._pts.textContent = K.num(p.score);
          r._h.textContent = o.mode === "lives" ? "♥".repeat(Math.max(0, p.lives)) : "";
          if (r._fill) r._fill.style.width = Math.max(3, Math.min(100, 100 * p.right / goal)) + "%";
          if (r._st) {
            const st = res ? res.get(p.id) || (p.out ? "out" : "") : p.out ? "out" : !asked.has(p.id) ? "" : did ? "in" : "think";
            r._st.className = "st " + st;
            r._st.textContent = st ? W[st] : "";
          }
        }
        if (answered) {
          const x = [...answered].filter((id) => asked.has(id)).length;
          if (few) put(meta, "{n} of {total} answered", { n: x, total: asked.size }, modeT + " · ");
          else put(hr, "{n} of {total} answered", { n: x, total: asked.size }, "");
        }
      };
      draw(/* @__PURE__ */ new Set());
      return { node: b, draw };
    });
  }
  function raceLadder(K, lad, target) {
    const box = K.el("div", "tq-steps race", lad);
    const per = target > 10 ? 2 : 1, rows = Math.ceil(target / per);
    const ps = K.players().slice().sort((a, b) => b.right - a.right);
    const lead = ps.length ? ps[0].right : 0;
    for (let k = rows; k >= 1; k--) {
      const hi = Math.min(target, k * per), lo = (k - 1) * per + 1;
      const here = ps.filter((p) => p.right >= lo && p.right <= hi);
      const r = K.el("div", (k === rows ? "mile fin" : "") + (lead >= lo && lead <= hi ? " now" : lead > hi ? " past" : ""), box);
      K.el("b", "", r, (k === rows ? "🏁 " : "") + K.num(hi));
      const f = K.el("span", "faces", r);
      for (const p of here.slice(0, here.length > 4 ? 3 : 4)) {
        const im = K.el("img", "", f);
        im.src = K.avatarUrl(p);
        im.alt = "";
      }
      if (here.length > 4) K.el("i", "", f, "+" + K.num(here.length - 3));
    }
  }
  function tqLadder(K, parent, o) {
    return __async(this, null, function* () {
      const lad = K.el("div", "tq-lad", parent);
      if (!o.family && !o.nohelp) {
        const life = K.el("div", "tq-life", lad);
        const someoneOut = K.players().some((p) => p.out);
        for (const [t, off] of [["50:50", false], ["Hint", false], ["For me", false], ["Ask all", !someoneOut]]) K.el("span", off ? "off" : "", life, yield K.tr(t));
        K.el("div", "tq-note", lad, yield K.tr(someoneOut ? "Each helper works once." : "Ask everyone works once someone is out."));
      }
      if (o.race) return raceLadder(K, lad, o.race);
      const steps = K.el("div", "tq-steps", lad);
      const n = o.qs.length, cur = o.i;
      const span = Math.min(n, 15);
      const from = Math.max(0, Math.min(cur - 4, n - span));
      for (let k = from + span - 1; k >= from; k--) {
        const d = o.qs[k] && o.qs[k].d;
        const mile = !!DIFF[d] && (k === n - 1 || !o.qs[k + 1] || o.qs[k + 1].d !== d);
        const r = K.el("div", (k === cur ? "now" : k < cur ? "past" : "") + (mile ? " mile" : ""), steps);
        K.el("b", "", r, K.num(k + 1));
        if (k === cur) K.el("span", "", r, yield K.tr("Now"));
        else if (mile) K.el("span", "", r, yield K.tr(DIFF[d]));
      }
    });
  }
  const T_LOOKS = ["show", "chalk", "seat", "paper"], T_WINS = ["cosmic", "disco", "fireworks"];
  const lsGet = (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  };
  const lsSet = (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
    }
  };
  const urlPick = (k, list) => {
    const m = new RegExp("[?&]" + k + "=([a-z]+)").exec(location.search);
    return m && list.includes(m[1]) ? m[1] : "";
  };
  let tLook = "", tSet = null;
  function lookNow(s) {
    const forced = urlPick("tlook", T_LOOKS);
    if (forced) return forced;
    if (s && T_LOOKS.includes(s.look)) return s.look;
    if (!tLook) {
      const i = ((+lsGet("bvplay:tlook", "-1") || 0) + 1 + T_LOOKS.length) % T_LOOKS.length;
      lsSet("bvplay:tlook", String(i));
      tLook = T_LOOKS[i];
    }
    return tLook;
  }
  function winNow(s) {
    const forced = urlPick("twin", T_WINS);
    if (forced) return forced;
    if (s && T_WINS.includes(s.win)) return s.win;
    const i = ((+lsGet("bvplay:twin", "-1") || 0) + 1 + T_WINS.length) % T_WINS.length;
    lsSet("bvplay:twin", String(i));
    return T_WINS[i];
  }
  const SVG_CHALK = '<svg viewBox="0 0 1920 1080" preserveAspectRatio="none" fill="none" stroke="#f4f1e6" stroke-width="3" stroke-linecap="round"><path d="M1040 120q30-40 60 0t60 0"/><circle cx="1240" cy="140" r="26"/><path d="M1226 128l28 24M1254 128l-28 24"/><path d="M1700 980l40-60 40 60z"/><path d="M60 960h120M120 900v120"/><text x="1320" y="1000" font-size="60" fill="#f4f1e6" stroke="none">E = mc²</text><text x="1020" y="200" font-size="50" fill="#f4f1e6" stroke="none">2 + 2 = ?</text><path d="M1600 120c40-20 80 20 40 50s-60-40-20-50"/></svg>';
  const SVG_CHALK_RTL = '<svg viewBox="0 0 1920 1080" preserveAspectRatio="none" fill="none" stroke="#f4f1e6" stroke-width="3" stroke-linecap="round" style="direction:ltr"><path d="M880 120q-30-40-60 0t-60 0"/><circle cx="680" cy="140" r="26"/><path d="M694 128l-28 24M666 128l28 24"/><path d="M220 980l-40-60-40 60z"/><path d="M1860 960h-120M1800 900v120"/><text x="600" y="1000" font-size="60" fill="#f4f1e6" stroke="none" text-anchor="end">E = mc²</text><text x="900" y="200" font-size="50" fill="#f4f1e6" stroke="none" text-anchor="end">2 + 2 = ?</text><path d="M320 120c-40-20-80 20-40 50s60-40 20-50"/></svg>';
  const SVG_HILLS = '<svg viewBox="0 0 1920 1080" preserveAspectRatio="none"><path d="M0 760C300 700 500 820 800 770S1400 660 1920 740V1080H0Z" fill="#ffb27a" style="filter:drop-shadow(0 -10px 14px rgba(90,40,10,.18))"/><path d="M0 860C380 800 640 920 1000 870S1600 800 1920 860V1080H0Z" fill="#ff8a5a" style="filter:drop-shadow(0 -10px 14px rgba(90,40,10,.2))"/><path d="M0 960C420 920 760 1010 1100 970S1700 920 1920 960V1080H0Z" fill="#e8603a" style="filter:drop-shadow(0 -10px 14px rgba(90,40,10,.22))"/></svg>';
  const SVG_PBOO = '<svg class="tl-boo" viewBox="10 0 40 52" aria-hidden="true"><path d="M14 22C14 3 46 3 46 22V46.8Q46 50 42.5 50Q39 50 39 46.8A3.25 2.8 0 0 0 32.5 46.8Q32.5 50 29.25 50Q26 50 26 46.8A2.75 2.8 0 0 0 20.5 46.8Q20.5 50 17.25 50Q14 50 14 46.8Z" fill="#fff" stroke="#ffcf9e" stroke-width="1.5"/><circle cx="24" cy="24" r="2.6" fill="#3a1e10"/><circle cx="36" cy="24" r="2.6" fill="#3a1e10"/><path d="M27 30q3 2.4 6 0" stroke="#3a1e10" stroke-width="1.4" fill="none" stroke-linecap="round"/><ellipse cx="19.5" cy="29" rx="2.4" ry="1.4" fill="#ff8a9e"/><ellipse cx="40.5" cy="29" rx="2.4" ry="1.4" fill="#ff8a9e"/></svg>';
  const mk = (tag, cls, parent, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  function lobbyDress(stage, s) {
    const lk = lookNow(s);
    tSet = s;
    document.body.dataset.tlook = lk;
    const d = mk("div", "tl-deco");
    d.setAttribute("aria-hidden", "true");
    d.innerHTML = lk === "show" ? '<i class="bm l"></i><i class="bm r"></i><i class="fl"></i>' : lk === "chalk" ? '<i class="dots"></i><i class="smudge"></i>' + (document.documentElement.dir === "rtl" ? SVG_CHALK_RTL : SVG_CHALK) : lk === "seat" ? '<i class="sw"></i><i class="sw"></i><i class="sw"></i><i class="sw"></i><i class="rg r1"></i><i class="rg r2"></i><i class="rg r3"></i><i class="rg r4"></i><i class="vg"></i>' : '<i class="dots"></i>' + SVG_HILLS + '<i class="sun"></i><i class="cl c1"></i><i class="cl c2"></i>';
    stage.insertBefore(d, stage.firstChild);
    if (lk === "chalk") {
      mk("div", "tl-frame", stage).setAttribute("aria-hidden", "true");
      const t = mk("div", "tl-tray", stage);
      t.setAttribute("aria-hidden", "true");
      for (let i = 0; i < 3; i++) mk("i", "", t);
    }
    const jc = stage.querySelector(".lob .join"), sp = stage.querySelector(".spot");
    if (jc && lk === "show") for (const w of ["t", "b"]) {
      const r = mk("div", "tl-bulbs " + w, jc);
      for (let i = 0; i < 30; i++) mk("i", "", r);
    }
    if (jc && lk === "chalk") mk("div", "tl-tape", jc);
    if (sp && lk === "chalk") mk("div", "tl-tape", sp);
    if (jc && lk === "paper") mk("span", "tl-clip", jc, "📎").setAttribute("aria-hidden", "true");
    if (lk === "seat") for (const t of stage.querySelectorAll(".lob-top .tile-l")) {
      const L = t.textContent;
      t.textContent = "";
      mk("b", "", t, "◆ " + L + ":");
      mk("i", "", t);
    }
  }
  function seatDress(grid) {
    const lk = document.body.dataset.tlook;
    for (const seat of grid.querySelectorAll(".seat")) {
      const open = seat.classList.contains("empty") && !!seat.querySelector("span");
      seat.classList.toggle("open", open);
      if (lk === "show" && !seat.querySelector(".tl-stand")) {
        const st = mk("div", "tl-stand", seat);
        for (let i = 0; i < 5; i++) mk("i", "", st);
      }
      if (lk === "paper" && open && !seat.querySelector(".tl-boo")) seat.querySelector("span").insertAdjacentHTML("afterbegin", SVG_PBOO);
    }
  }
  const CONF = { cosmic: ["#ffc93c", "#c77dff", "#5ad1ff", "#fff"], disco: ["#ff5a8a", "#5ad1ff", "#ffc93c", "#34d399", "#c77dff", "#fff"], fireworks: ["#ffc93c", "#ff5a8a", "#5ad1ff", "#34d399", "#fff", "#c77dff"] };
  const SPARK = [[1660, 300], [1338.2, 557.8], [668.7, 233.6], [267, 59.3], [502.4, 428.5], [1158.6, 507.6], [1632.1, 118], [1487.7, 139.3], [858.1, 523.4], [322.2, 403.2], [372.6, 50], [963.1, 261.3]];
  const BURSTS = [[300, 240, 0, "#ff5a8a"], [1620, 200, 1.1, "#5ad1ff"], [520, 520, 2.2, "#ffc93c"], [1420, 500, 0.6, "#34d399"], [960, 330, 1.7, "#c77dff"]];
  const X = (v) => (v / 19.2).toFixed(2) + "%", Y = (v) => (v / 10.8).toFixed(2) + "%";
  let tWinLast = "";
  function winDress(cv) {
    const w = winNow(tSet);
    tWinLast = w;
    cv.classList.add("tw", "tw-" + w);
    document.body.classList.add("tw-on");
    const d = mk("div", "tw-d");
    d.setAttribute("aria-hidden", "true");
    cv.insertBefore(d, cv.firstChild);
    for (let i = 1; i <= (w === "disco" ? 4 : 2); i++) mk("i", "sw s" + i, d);
    const wh = mk("div", "wheel", d);
    for (let i = 0; i < 36; i++) mk("i", "", wh).style.transform = "rotate(" + i * 10 + "deg)";
    if (w === "cosmic") {
      for (let i = 0; i < 90; i++) {
        const st = mk("i", "st", d);
        st.style.left = X(i * 137 % 1920);
        st.style.top = Y(i * 263 % 1080);
        st.style.animationDuration = 2 + i % 4 + "s";
        st.style.animationDelay = (-(i % 7) * 0.4).toFixed(1) + "s";
      }
      mk("i", "pl1", d);
      mk("i", "rng", d);
      mk("i", "pl2", d);
      mk("i", "rk", d, "🚀");
    } else if (w === "disco") {
      SPARK.forEach(([x, y], i) => {
        const sp = mk("i", "sp", d);
        sp.style.left = X(x);
        sp.style.top = Y(y);
        sp.style.animationDuration = [1.4, 1.8, 2.2][i % 3] + "s";
        sp.style.animationDelay = (i * 0.2).toFixed(1) + "s";
      });
      const fl = mk("div", "floor", d), C = ["#ff5a8a", "#5ad1ff", "#ffc93c", "#34d399", "#c77dff"];
      for (let i = 0; i < 64; i++) {
        const c = i % 16, r = Math.floor(i / 16), t = mk("i", "", fl);
        t.style.background = C[(c + 3 * r) % 5];
        t.style.animationDuration = (1 + (c + r) % 4 * 0.35).toFixed(2) + "s";
        t.style.animationDelay = ((c + 2 * r) % 5 * 0.2).toFixed(1) + "s";
      }
    } else {
      for (const [x, y, dl, c] of BURSTS) {
        const b = mk("div", "bu", d);
        b.style.left = X(x);
        b.style.top = Y(y);
        b.style.animationDelay = dl + "s";
        b.style.filter = "drop-shadow(0 0 8px " + c + ")";
        for (let k = 0; k < 16; k++) {
          const r = mk("i", "", b);
          r.style.background = "linear-gradient(" + c + ", transparent)";
          r.style.transform = "rotate(" + k * 22.5 + "deg) translateY(calc(-100 / 10.8 * var(--u)))";
        }
        mk("b", "", b).style.boxShadow = "0 0 20px " + c;
      }
    }
    const cols = CONF[w];
    for (let i = 0; i < 50; i++) {
      const cf = mk("i", "cf", d);
      cf.style.left = X(i * 97 % 1900);
      cf.style.background = cols[i % cols.length];
      cf.style.width = "calc(" + [8, 12, 16][i % 3] + " / 10.8 * var(--u))";
      cf.style.height = "calc(" + [14, 20][i % 2] + " / 10.8 * var(--u))";
      cf.style.animationDuration = 6 + i % 5 + "s";
      cf.style.animationDelay = (-(i * 0.53 % 8)).toFixed(2) + "s";
    }
    const boo = mk("img", "tw-boo", cv);
    boo.src = "icons/emoji-boo.png";
    boo.alt = "";
  }
  const TRIVIA_MODES = [
    ["most", "Most correct", "Nobody goes out. The most right answers wins."],
    ["knockout", "Knockout", "One wrong answer and you are out. The last one standing wins."],
    ["lives", "3 lives", "Like Knockout, but you can miss twice. The third miss puts you out."],
    ["race", "Race to a number", "The first player to get that many right wins."],
    ["first", "First right takes the point", "Only the fastest right answer scores."],
    ["family", "Family mode", "Easy questions, no timer, nobody goes out. The TV reads each question out loud."]
  ];
  G({
    id: "trivia",
    name: "Trivia",
    emoji: "🧠",
    sub: "Questions on the TV, answers on your phone.",
    teams: true,
    teamsWin: true,
    // (the winner design the TV showed: the phones' share picture comes in the same look)
    endLook: () => tWinLast,
    step: ["Tap {letters}", "Answer on your phone before time runs out."],
    deco: "letters",
    helpers: ["Remove two", "Hint", "Answer it for me", "Ask everyone"],
    // its own sounds on the TV (sound.js): the lobby tune, "every 5 questions" and "next question", a tune for each
    // third of the game and one for the last two questions, "correct" and "wrong", time's up, between questions, the winner
    sounds: ["theme", "every5", "next", "easy", "medium", "hard", "last2", "correct", "wrong", "between", "timesup", "win", "tSpin"],
    credit: "Questions written by Blokvane.",
    // (the questions start loading in the lobby, while people join; and in a player's own language once they pick it)
    prep: (lang) => {
      for (const c of qCats(lang)) qFile(lang, c);
    },
    mlang: true,
    langPrep: (lang) => {
      for (const c of qCats(lang)) qFile(lang, c);
    },
    // (a race is everyone for themselves)
    teamsOn: (s) => s.mode !== "race",
    // its looks: the lobby in one of four designs, the winners in one of three (trivia.css)
    lobbyDone: (stage, el, s) => lobbyDress(stage, s),
    seated: (grid) => seatDress(grid),
    winDeco: (cv) => winDress(cv),
    // (each design's seats: their height for their width, and the room between them)
    get seatGap() {
      return document.body.dataset.tlook === "show" ? 26 / 10.8 : 22 / 10.8;
    },
    get seatRatioCard() {
      return { show: 0.8515, chalk: 0.8634, seat: 0.8307, paper: 0.8197 }[document.body.dataset.tlook] || 0.8;
    },
    // the host's phone sets the game up in these steps, then a last one to check it all and start
    steps: [
      { t: "Game mode", s: "Mode", keys: ["lang", "mode"] },
      { t: "Questions", keys: ["count", "raceTo", "lives", "level"] },
      { t: "Category", keys: ["cat", "wheel"] },
      { t: "Timing", s: "Time", keys: ["sec", "next", "wait"] },
      { t: "Extras", keys: ["speed", "helpers", "teams", "teamN"] },
      { t: "Looks", keys: ["look", "win"] }
    ],
    rules: ["A question shows on the TV with four answers.", "Tap your answer on your phone before time runs out.", "Each helper works once: remove two, a hint, answer it for me, ask everyone."],
    // the TV's lobby explains the mode the host picked, and changes as soon as they pick another
    spot: (s) => {
      const m = TRIVIA_MODES.find((x) => x[0] === s.mode) || TRIVIA_MODES[0];
      const race = m[0] === "race";
      const allPlay = ["🙌", "Nobody goes out: everyone plays to the end"];
      const help = s.helpers === false ? ["🧠", "No helpers: just you and the question"] : ["💡", "4 helpers on your phone, each works once"];
      const teams = !!s.teams && !race;
      const tie = teams ? allPlay : ["🤝", "A tie for first? A number question decides"];
      const bullets = {
        most: [s.speed ? ["⚡", "Faster right answers score more"] : ["✅", "Every right answer scores a point"], help, tie],
        knockout: [help, ["🤝", "If everyone misses, nobody goes out"], ["🗳️", "Players who are out help with Ask everyone"]],
        lives: [["❤️", "Everyone starts with {n} hearts"], ["💔", "Each wrong answer costs a heart"], ["🏆", "The last one with a heart left wins"]],
        race: [["🎯", "First to {n} right answers wins"], ["⚡", "Two get there at once? The faster answer wins"], help],
        first: [allPlay, ["🎯", "A wrong answer costs nothing"], help],
        family: [["🔊", "The TV reads each question out loud"], ["🧸", "Easy questions, great with kids"], allPlay]
      }[m[0]];
      const family = m[0] === "family";
      const cat = s.wheel ? "Category wheel" : catName(+s.cat) || "Everything (mixed)";
      const facts = [race ? ["🎯", "Race to {n}", { n: +s.raceTo }] : ["❓", "{n} questions", { n: family ? 10 : +s.count }], family || !+s.sec ? ["⏳", "No timer"] : ["⏱️", "{n} s", { n: +s.sec }], ["🗂️", cat]];
      if (!family && ["easy", "medium", "hard"].includes(s.level)) facts.splice(1, 0, ["🎯", DIFF[s.level]]);
      if (teams) facts.push(["👥", "Teams"]);
      return { key: m[0], icon: { most: "🏆", knockout: "⚔️", lives: "❤️", race: "🏁", first: "⚡", family: "🏡" }[m[0]], label: "Game mode", name: m[1], desc: m[2], bullets, vars: { n: m[0] === "lives" ? +s.lives || 3 : +s.raceTo }, facts };
    },
    // (the categories this language has questions for: all of them)
    langOptions: { cat: (lang, opts) => {
      const have = qCats(lang);
      return opts.filter((o) => o[0] === 0 || (have.length ? have.includes(o[0]) : BANK_CATS.has(o[0])));
    } },
    settings: [
      { key: "mode", label: "Game mode", type: "seg", look: "list", options: TRIVIA_MODES, default: "most" },
      // (a race has no number of questions: it goes on until someone gets there; Family mode always has 10)
      { key: "count", label: "How many questions", type: "number", min: 1, max: 100, quick: [10, 15, 20, 30], default: 15, when: ["mode", ["most", "knockout", "lives", "first"]] },
      { key: "raceTo", label: "Race to", type: "number", min: 1, max: 50, quick: [5, 10, 15, 20], default: 10, when: ["mode", "race"], desc: "The first player to get this many right answers wins. The questions keep coming until someone does." },
      { key: "lives", label: "Hearts each", type: "number", min: 1, max: 10, quick: [1, 2, 3, 5], default: 3, when: ["mode", "lives"], desc: "Each wrong answer costs a heart. Out of hearts, out of the game." },
      { key: "level", label: "Difficulty", type: "seg", options: [
        ["mix", "Easy to hard", "Starts easy and gets harder as you go."],
        ["easy", "Easy", "Only easy questions. Great with kids."],
        ["medium", "Medium", "Only medium questions."],
        ["hard", "Hard", "Only hard questions, for quiz fans."]
      ], default: "mix", when: ["mode", "!family"] },
      { key: "cat", label: "Pick a category", type: "seg", options: PK.cats.map((c) => [c[0], c[1]]), default: 0 },
      { key: "wheel", label: "Category wheel", type: "toggle", default: false, desc: "A new category every 5 questions." },
      { key: "sec", label: "Time to answer", type: "number", min: 0, max: 300, quick: [10, 15, 20, 30], unit: "seconds", default: 20, when: ["mode", "!family"], desc: "0: no clock. Each question waits until everyone answers, and the host can show the answer any time." },
      // (after each answer: the next question comes by itself after a wait the host picks, or when the host taps for it)
      { key: "next", label: "Next question", type: "seg", options: [["auto", "Automatic", "The next question starts by itself after a short wait."], ["host", "The host starts it", "The host taps Next question on their phone when everyone is ready."]], default: "auto" },
      { key: "wait", label: "Wait before the next question", type: "number", min: 1, max: 120, quick: [3, 5, 10, 15], unit: "seconds", default: 5, when: ["next", "auto"] },
      { key: "speed", label: "Speed points", type: "toggle", default: false, desc: "Faster right answers score more" },
      { key: "helpers", label: "Helpers", type: "toggle", default: true, desc: "Remove two, a hint, answer it for me, ask everyone: each works once.", when: ["mode", "!family"] },
      { key: "teams", label: "Teams", type: "toggle", default: false, desc: "Phones join a color team, and each team's points are added up.", when: ["mode", "!race"] },
      { key: "teamN", label: "How many teams", type: "seg", options: [[2, "2"], [3, "3"], [4, "4"]], default: 2, when: [["teams", true], ["mode", "!race"]] },
      // (the lobby and the winners: a different design each game, or always the same one)
      { key: "look", label: "Lobby look", type: "seg", options: [["mix", "A new one each game", "The lobby changes its look from one game to the next."], ["show", "Game Show"], ["chalk", "Chalkboard"], ["seat", "Hot Seat"], ["paper", "Paper Craft"]], default: "mix" },
      { key: "win", label: "Winner screen", type: "seg", options: [["mix", "A new one each game", "The winners show in a different design each game."], ["cosmic", "Cosmic"], ["disco", "Disco"], ["fireworks", "Fireworks"]], default: "mix" }
    ],
    tv(K) {
      return __async(this, null, function* () {
        const s = K.settings, family = s.mode === "family", race = s.mode === "race";
        tLook = "";
        tSet = s;
        const target = Math.max(1, +s.raceTo || 10);
        const n = family ? 10 : race ? target * 6 : +s.count;
        const LP = K.packs;
        const cat = s.wheel ? 0 : +s.cat;
        const level = family ? "easy" : LV.includes(s.level) ? s.level : "mix";
        const have = qCats(K.lang);
        let pool = (yield Promise.all((cat && have.includes(cat) ? [cat] : have).map((c) => qFile(K.lang, c)))).flat().filter(Boolean);
        if (!pool.length) pool = qBuiltIn(LP);
        const pk = qPicker(pool);
        const lead = () => Math.max(0, ...K.players().map((p) => p.right));
        const raceStage = () => {
          const r = lead();
          return r < target / 3 ? "easy" : r < 2 * target / 3 ? "medium" : "hard";
        };
        const levels = race ? [] : qLevels(n, level);
        let qs = race ? [] : levels.map((d) => pk.take(d, cat));
        if (qs.indexOf(null) >= 0) qs = qs.slice(0, qs.indexOf(null));
        const total = race ? 0 : qs.length;
        const wheelCats = P.shuffle(PK.cats.filter((c) => c[0] && pool.some((q) => q.cat === c[0]))).slice(0, 8);
        let wheelCat = 0, winner = null;
        const sec = family ? 0 : +s.sec;
        for (let i = 0; i < (race ? n : qs.length); i++) {
          if (K.over() || winner) break;
          const live = K.alive();
          if ((s.mode === "knockout" || s.mode === "lives") && K.players().length > 1 && live.length <= 1) break;
          if (s.wheel && wheelCats.length && i >= 5 && (i - 5) % 5 === 0) {
            const wc = yield wheel(K, wheelCats);
            wheelCat = wc[0];
            for (let j = i; j < Math.min(i + 5, qs.length); j++) qs[j] = pk.take(levels[j], wc[0]) || qs[j];
          }
          if (race) {
            qs[i] = pk.take(level === "mix" ? raceStage() : level, wheelCat || cat);
            if (!qs[i]) break;
          }
          const q = qs[i];
          markAsked(q.id);
          const perm = P.shuffle([0, 1, 2, 3]);
          const src = [q.a, ...q.w];
          const opts = perm.map((j) => src[j]);
          const ok = perm.indexOf(0);
          const tq = yield K.tr(q.q), tOpts = yield Promise.all(opts.map((o) => K.tr(o)));
          const trs = yield qTrans(K, q, perm, live);
          const rightIn = (id) => {
            const t = trs && trs[K.langOf(id)];
            return t ? t.o[ok] : tOpts[ok];
          };
          const whyIn = (id) => {
            const t = trs && trs[K.langOf(id)];
            return t && t.y || q.why || "";
          };
          const num = i + 1, big = num === 1 || num % 5 === 0, loud = K.snd.on();
          const lastN = race ? lead() >= target - 1 ? 1 : 0 : qs.length - i <= 2 ? qs.length - i : 0;
          K.wait();
          K.snd.music(null, { fadeOut: 0.8 });
          K.snd.sting(big ? "every5" : "next");
          yield tqIntro(K, { num, total, q, big, last: lastN, race });
          yield K.sleep(loud ? big ? 5e3 : 4700 : 1800);
          if (K.over()) break;
          const v = yield tqView(K, { qs, i, q, text: tq, opts: tOpts, sec, mode: s.mode, family, nohelp: s.helpers === false, live, goal: race ? target : qs.length, race: race ? target : 0 });
          const qt = v.q, cells = v.cells;
          K.snd.music(lastN ? "last2" : race ? raceStage() : stageOf(i, qs.length), { fadeIn: 1.2, vol: family ? 0.4 : 1 });
          if (family) K.speak(qt.textContent);
          yield K.sleep(family ? 2600 : Math.min(2600, 1100 + [...tq].length * 14));
          yield v.showAnswers(family ? 700 : 520);
          if (K.over()) break;
          if (v.ring) v.ring.go();
          const answered = /* @__PURE__ */ new Set();
          let qn = -1;
          const offPlayers = K.onPlayers(() => v.board.draw(answered));
          const outs = () => K.players().filter((p) => p.out);
          const offHelp = K.on("help", (m, p) => __async(this, null, function* () {
            if (+m.n !== qn || p.out || p.helpers[m.h] || !["fifty", "hint", "auto", "ask"].includes(m.h)) return;
            const lg = K.langOf(p.id), mine = trs && lg ? trs[lg] : null;
            if (m.h === "ask" && !outs().length) {
              K.sayTo(p.id, { k: "helped", n: qn, h: "ask", no: true, note: yield K.trFor(lg, "Ask everyone works once someone is out.") });
              return;
            }
            p.helpers[m.h] = true;
            if (m.h === "fifty") {
              const wrong = P.shuffle([0, 1, 2, 3].filter((x) => x !== ok && x < opts.length)).slice(0, 2);
              K.sayTo(p.id, { k: "helped", n: qn, h: "fifty", hide: wrong });
            } else if (m.h === "hint") K.sayTo(p.id, Object.assign({ k: "helped", n: qn, h: "hint" }, yield hint(K, q, opts[ok], mine ? mine.o[ok] : tOpts[ok], mine ? lg : "")));
            else if (m.h === "auto") K.sayTo(p.id, { k: "helped", n: qn, h: "auto", pick: ok });
            else if (m.h === "ask") {
              let vtr = null;
              for (const x of outs()) {
                const xl = K.langOf(x.id);
                if (xl && trs && trs[xl] && !(vtr && vtr[xl])) {
                  vtr = vtr || {};
                  vtr[xl] = Object.assign({}, trs[xl], { p: yield K.trFor(xl, "Help {name}: which answer is right?", { name: p.name }) });
                }
              }
              const ex = { letters: true, helpOnly: true };
              if (vtr) ex.tr = vtr;
              const votes = yield K.ask({ kind: "choice", prompt: yield K.tr("Help {name}: which answer is right?", { name: p.name }), opts: tOpts, sec: 10, who: outs().map((x) => x.id), extra: ex });
              const tally = opts.map((_, j) => [...votes.values()].filter((a) => +a.v === j).length);
              K.sayTo(p.id, { k: "helped", n: qn, h: "ask", tally });
            }
          }));
          const open = !family && !sec;
          const extra = { letters: true, helpers: !family && s.helpers !== false, tv: 1 };
          if (trs) extra.tr = trs;
          const asking = K.ask({ kind: "choice", prompt: "", opts: tOpts, sec, open, extra, onAns: (id) => {
            answered.add(id);
            v.board.draw(answered);
          } });
          qn = K.qn();
          const stopReveal = open ? hostReveal(K, qn) : null;
          let closed = false;
          const tuT = sec ? K.after(sec * 1e3, () => {
            if (closed || K.over() || answered.size >= live.length) return;
            K.snd.music(null, { fadeOut: 0.25 });
            K.snd.sting("timesup");
          }) : 0;
          const answers = yield asking;
          closed = true;
          if (tuT) tuT();
          if (stopReveal) stopReveal();
          offHelp();
          if (v.ring) v.ring.stop();
          if (v.inf) v.inf.classList.add("done");
          const inPlay = live.filter((p) => answers.has(p.id) || !p.away);
          for (const id of answers.keys()) {
            const p = K.player(id);
            if (p && !p.out && !inPlay.includes(p)) inPlay.push(p);
          }
          const rightN = [...answers.values()].filter((a) => +a.v === ok).length;
          K.snd.music(null, { fadeOut: 0.3 });
          K.snd.sting(rightN ? "correct" : "wrong");
          yield K.sleep(K.snd.on() ? rightN ? 1e3 : 700 : 250);
          cells.forEach((c, j) => c.node.classList.add(j === ok ? "right" : "dim"));
          for (let j = 0; j < opts.length; j++) showWho(K, cells[j], [...answers].filter(([, a]) => +a.v === j).map(([id]) => id));
          if (q.why) K.el("div", "pill why", v.fx, "🤯 " + q.why);
          let first = null;
          const spare = (s.mode === "knockout" || s.mode === "lives") && inPlay.length > 1 && !inPlay.some((p) => answers.has(p.id) && +answers.get(p.id).v === ok);
          if (spare) K.el("div", "pill", v.fx, yield K.tr("Everyone missed that one, so nobody goes out."));
          const res = /* @__PURE__ */ new Map();
          for (const p of inPlay) {
            const a = answers.get(p.id);
            const good = a && +a.v === ok;
            let pts = 0;
            if (good) {
              p.right++;
              p.streak++;
              if (!first || a.ms < first.ms) first = { p, ms: a.ms };
              if (s.mode !== "first") pts = s.speed ? K.award(p, 100, a.ms, sec || 30) : (p.score += 1, 1);
            } else {
              p.streak = 0;
              if (s.mode === "knockout" && !spare) p.out = true;
              if (s.mode === "lives" && !spare) {
                p.lives--;
                if (p.lives <= 0) p.out = true;
              }
            }
            K.result(p.id, { ok: good, pts, score: p.score, out: p.out, lives: p.lives, right: rightIn(p.id), note: whyIn(p.id) });
            res.set(p.id, good ? "right" : p.out ? "out" : "miss");
          }
          if (first) {
            if (s.mode === "first") {
              first.p.score += 1;
              K.result(first.p.id, { ok: true, pts: 1, score: first.p.score, first: true, right: rightIn(first.p.id) });
            }
            yield firstBadge(K, v.fx, first.p, first.ms);
          }
          if (race) {
            const msOf = (p) => (answers.get(p.id) || { ms: 1e9 }).ms;
            const done = inPlay.filter((p) => p.right >= target).sort((a, b) => msOf(a) - msOf(b));
            if (done.length) {
              winner = done[0];
              K.el("div", "pill", v.fx, "🏁 " + (yield K.tr("{name} crossed the finish line!", { name: "⁨" + winner.name + "⁩" })));
            }
          }
          K.boo(rightN >= inPlay.length / 2 ? "happy" : "sad");
          v.board.draw(null, res);
          offPlayers();
          const last = !!winner || !race && i >= qs.length - 1 || race && i >= n - 1 || (s.mode === "knockout" || s.mode === "lives") && K.players().length > 1 && K.alive().length <= 1;
          K.snd.music("between", { delay: 2.2, fadeIn: 1.5, fadeOut: 0.6 });
          if (last) yield K.sleep(5e3);
          else if (s.next === "host") yield hostNext(K, v, qn);
          else yield nextIn(K, v, Math.max(1, Math.min(120, Math.round(+s.wait) || 5)));
        }
        let ps = K.players().slice().sort((a, b) => b.score - a.score);
        if (race) ps = K.players().slice().sort((a, b) => (b === winner) - (a === winner) || b.right - a.right || b.score - a.score);
        if (!winner && !K.teamsOn() && ps.length > 1 && ps[0].score === ps[1].score && !K.over()) {
          const tied = ps.filter((p) => p.score === ps[0].score);
          const [qq, real] = P.pick(LP ? LP.numbers : PK.numbers);
          K.wait();
          K.snd.music(null, { fadeOut: 0.8 });
          K.snd.sting("every5");
          const v = yield qView(K, { title: yield K.tr("Tie-breaker!"), sub: yield K.tr("The closest guess wins"), sec: 25, idle: true });
          yield K.sleep(K.snd.on() ? 5e3 : 1800);
          K.el("div", "question", v.main, yield K.tr(qq));
          K.snd.music("last2", { fadeIn: 1.2 });
          yield K.sleep(1500);
          if (v.ring) v.ring.go();
          const got = yield K.ask({ kind: "number", prompt: "", sec: 25, who: tied.map((p) => p.id), extra: { tv: 1 } });
          if (v.ring) v.ring.stop();
          K.snd.music(null, { fadeOut: 0.3 });
          K.snd.sting("correct");
          yield K.sleep(K.snd.on() ? 1e3 : 250);
          let best = null;
          for (const [id, a] of got) {
            const d = Math.abs(+a.v - real);
            if (!best || d < best.d || d === best.d && a.ms < best.ms) best = { id, d, ms: a.ms, v: +a.v };
          }
          K.el("div", "question", v.main, yield K.tr("The answer: {x}", { x: K.num(real) }));
          if (best) {
            const p = K.player(best.id);
            p.score += 1;
            yield firstBadge(K, v.main, p, best.ms);
          }
          K.snd.music("between", { delay: 2.2, fadeIn: 1.5 });
          yield K.sleep(4e3);
          ps = K.players().slice().sort((a, b) => b.score - a.score);
        }
        return ps;
      });
    }
  });
  function hostReveal(K, n) {
    let on = true;
    (() => __async(this, null, function* () {
      const label = yield K.tr("Show the answer");
      const off = K.on("reveal", (m, p) => {
        if (+m.n === n && K.isHost(p.id)) K.close(n);
      });
      for (let k = 0; on && !K.over(); k++) {
        if (k % 8 === 0) {
          const h = K.players().find((p) => K.isHost(p.id));
          if (h) K.sayTo(h.id, { k: "revealq", n, label });
        }
        yield K.sleep(500);
      }
      off();
    }))();
    return () => {
      on = false;
    };
  }
  function nextIn(K, v, secs) {
    return __async(this, null, function* () {
      const pill = K.el("div", "pill nextp", v.fx);
      for (let n = secs; n > 0 && !K.over(); n--) {
        pill.textContent = "⏭️ " + (yield K.tr("Next question in {n}", { n: K.num(n) }));
        yield K.sleep(1e3);
      }
    });
  }
  function hostNext(K, v, n) {
    return __async(this, null, function* () {
      K.el("div", "pill nextp", v.fx, "⏸️ " + (yield K.tr("Waiting for the host to start the next question")));
      const label = yield K.tr("Next question");
      let go = false;
      const off = K.on("next", (m, p) => {
        if (+m.n === n && K.isHost(p.id)) go = true;
      });
      K.hostWait(true);
      for (let k = 0; !go && !K.over(); k++) {
        if (k % 8 === 0) {
          const h = K.players().find((p) => K.isHost(p.id));
          if (h) K.sayTo(h.id, { k: "nextq", n, label });
        }
        yield K.sleep(500);
      }
      K.hostWait(false);
      off();
    });
  }
  const SMALL = { en: ["the", "a", "an", "of"], fr: ["le", "la", "les", "un", "une", "des", "du", "de", "et"], es: ["el", "la", "los", "las", "un", "una", "unos", "unas", "del", "de", "y"] };
  function cellsOf(w) {
    try {
      if (window.Intl && Intl.Segmenter) return Array.from(new Intl.Segmenter(void 0, { granularity: "grapheme" }).segment(w), (x) => x.segment);
    } catch (e) {
    }
    const out = [];
    for (const ch of w) {
      const c = ch.codePointAt(0);
      const mark = c >= 768 && c <= 879 || c >= 1611 && c <= 1631 || c === 1648 || c >= 2304 && c <= 2307 || c >= 2362 && c <= 2383 || c >= 2385 && c <= 2391 || c >= 2402 && c <= 2403 || c >= 2433 && c <= 2435 || c === 2492 || c >= 2494 && c <= 2509 || c === 2519 || c >= 2530 && c <= 2531 || c === 8204 || c === 8205 || c >= 65024 && c <= 65039;
      if (out.length && (mark || /[्্]$/.test(out[out.length - 1]))) out[out.length - 1] += ch;
      else out.push(ch);
    }
    return out;
  }
  function shapeOf(text, lg) {
    const a = String(text || "").trim();
    if (!a) return [];
    if (lg === "zh" || /^[぀-ヿ㐀-鿿豈-﫿]/.test(a)) {
      const cs = cellsOf(a.replace(/\s+/g, ""));
      return [cs.map((c, i) => i === 0 ? c : 0)];
    }
    const words = a.split(/\s+/).filter(Boolean).slice(0, 8);
    const small = SMALL[lg] || [];
    return words.map((w, wi) => {
      const cs = cellsOf(w);
      if (words.length > 1 && wi < words.length - 1 && small.includes(w.toLowerCase())) return cs;
      let lead = 0;
      if (lg === "ar" && cs.length > 3 && cs[0] === "ا" && cs[1] === "ل") lead = 2;
      else if ((lg === "fr" || lg === "en" || lg === "es") && cs.length > 2 && /^[ldLD]$/.test(cs[0]) && /^['’]$/.test(cs[1])) lead = 2;
      let shown = false;
      return cs.map((c, i) => {
        if (i < lead) return c;
        if (/^[-'’".,:;!?()[\]/&+*#%«»¿¡،؟。，、·]$/.test(c)) {
          if (c === "-") shown = false;
          return c;
        }
        if (!shown) {
          shown = true;
          return c;
        }
        return 0;
      });
    });
  }
  function hint(K, q, answer, shown, lg) {
    return __async(this, null, function* () {
      if (K.lang === "en" && !lg) {
        try {
          const LM = self.LanguageModel || self.ai && self.ai.languageModel;
          if (LM && (!LM.availability || (yield LM.availability()) === "available")) {
            const sess = yield LM.create ? LM.create() : LM.createTextSession();
            const t2 = yield sess.prompt(`Give a short, kind hint (under 15 words) for this quiz question. Never say the answer or any word of it.
Question: ${q.q}
Answer: ${answer}`);
            if (t2 && !P.norm(t2).includes(P.norm(answer))) return { text: String(t2).slice(0, 140) };
          }
        } catch (e) {
        }
      }
      const code = lg || K.lang;
      const pat = shapeOf(String(shown || answer), code);
      const shape = pat.map((w) => w.map((c) => c === 0 ? "_" : c).join(" ")).join("  /  ");
      const t = "The answer looks like this: {x}";
      return { pat, text: yield lg ? K.trFor(lg, t, { x: shape }) : K.tr(t, { x: shape }) };
    });
  }
  function wheel(K, cats) {
    return __async(this, null, function* () {
      const W = window.BVWHEEL;
      if (!W) return P.pick(cats);
      const segs = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => cats[i % cats.length]);
      const en = segs.map((c) => c[1]), names = yield Promise.all(en.map((x) => K.tr(x)));
      const body = K.view(null);
      body.classList.add("tws");
      const side = K.el("div", "tws-side", body);
      K.el("h1", "", side, yield K.tr("Category wheel"));
      const st = K.el("p", "tws-st", side, yield K.tr("Spinning for the next round..."));
      const leg = K.el("div", "tws-leg", side);
      const chips = names.map((nm, i) => {
        const x = K.el("div", "tws-c", leg);
        x.style.setProperty("--cc", W.COLORS[i]);
        K.el("i", "", x);
        K.el("span", "", x, nm);
        return x;
      });
      const wh = W.make(K.el("div", "tws-wheel", body));
      const pick = Math.floor(Math.random() * 8);
      wh.ready(pick);
      const tw = { s: W.startFor(pick), c: en, t: names };
      const say = yield K.tr("Category wheel");
      K.wait(say, { tw });
      yield K.sleep(1800);
      if (K.over()) {
        wh.stop();
        return segs[pick];
      }
      K.wait(say, { tw: Object.assign({ go: 1, p: pick }, tw) });
      K.snd.fx("tSpin", { duck: 0.65 });
      yield wh.spin();
      chips.forEach((c, i) => c.classList.add(en[i] === en[pick] ? "win" : "off"));
      st.textContent = "";
      const res = K.el("div", "tws-res", side, names[pick]);
      res.style.setProperty("--cc", W.COLORS[pick]);
      yield K.sleep(2600);
      wh.stop();
      return segs[pick];
    });
  }
  G({ id: "emoji", name: "Emoji Riddles", emoji: "🦁", sub: "Guess the movie, food or saying from a row of emoji.", settings: [], tv(K) {
    return __async(this, null, function* () {
      return K.players();
    });
  } });
  G({ id: "imposter", name: "Who's the Imposter?", emoji: "🕵️", sub: "Everyone has the same secret word, except one.", settings: [], tv(K) {
    return __async(this, null, function* () {
      return K.players();
    });
  } });
})();
