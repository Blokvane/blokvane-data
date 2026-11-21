// Made from dom-core.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change dom-core.js and run node tools/old-js.js again.
var BVDOM = (() => {
  "use strict";
  const BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  const GOLD = "#deb866", CREAM = "#f3ead6", INK = "#1d1b18";
  const KUFI = "'Reem Kufi',sans-serif", PLEX = "'IBM Plex Sans Arabic',sans-serif";
  const px = (v) => Math.round(v) + "px";
  function h(tag, css2, parent, text) {
    const e = document.createElement(tag);
    if (css2) e.style.cssText = css2;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const CFG = { teams: { n: 4, teams: true, seats: [0, 1, 2, 3] }, duel: { n: 2, seats: [0, 2] }, solo3: { n: 3, seats: [0, 1, 3] }, solo4: { n: 4, seats: [0, 1, 2, 3] } };
  const cfg = (mode) => CFG[mode] || CFG.teams;
  const ev = (g, k) => {
    (g.ev = g.ev || []).push(k);
  };
  function newMatch(mode) {
    if (!CFG[mode]) mode = "teams";
    const c = CFG[mode];
    return { mode, n: c.n, teams: !!c.teams, seats: c.seats.slice(), scores: new Array(c.teams ? 2 : c.n).fill(0), round: 0, bot: new Array(c.n).fill(false), history: [] };
  }
  function deal(g, starter) {
    g.dealArg = starter;
    const d = [];
    for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) d.push([b, a]);
    for (let i = d.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const x = d[i];
      d[i] = d[j];
      d[j] = x;
    }
    g.hands = Array.from({ length: g.n }, (_, p) => d.slice(p * 7, p * 7 + 7));
    g.bone = d.slice(g.n * 7);
    g.must = null;
    if (starter < 0) {
      for (let k = 6; k >= 0 && starter < 0; k--) {
        starter = g.hands.findIndex((hd) => hd.some((t2) => t2[0] === k && t2[1] === k));
        if (starter >= 0) g.must = k;
      }
      if (starter < 0) starter = 0;
    }
    Object.assign(g, { chain: [], turn: starter, starter, passes: 0, said: g.hands.map(() => false), phase: "play", result: null, last: -1 });
    g.round++;
    g.fresh = true;
    g.log = [];
    g.lacks = [[], [], [], []];
    ev(g, "shuffle");
  }
  function legal(g, p) {
    const out = [], hd = g.hands[p] || [];
    if (!g.chain.length) {
      hd.forEach((t2, i) => {
        if (g.must == null || t2[0] === g.must && t2[1] === g.must) out.push({ i, side: "R" });
      });
      return out;
    }
    const L = g.chain[0][0], R = g.chain[g.chain.length - 1][1];
    hd.forEach((t2, i) => {
      if (t2.includes(L)) out.push({ i, side: "L" });
      if (t2.includes(R) && !(L === R && t2.includes(L))) out.push({ i, side: "R" });
    });
    return out;
  }
  const pts = (hd) => hd.reduce((s, t2) => s + t2[0] + t2[1], 0);
  const teamOf = (g, p) => g.teams ? p % 2 : p;
  const logDraw = (g, p) => {
    const L = g.log = g.log || [], z = L[L.length - 1];
    if (z && z.p === p && z.draw) z.draw++;
    else L.push({ p, draw: 1 });
  };
  const say = (g, p, arr, kind) => {
    if (p == null || p < 0 || p >= g.n || !g.bot[p]) return;
    g.say = { p, text: arr[Math.floor(Math.random() * arr.length)], kind: kind || "" };
  };
  const witness = (g, p, mate) => {
    for (let k = 1; k < g.n; k++) {
      const q = (p + k) % g.n;
      if (g.bot[q] && teamOf(g, q) === teamOf(g, p) === mate) return q;
    }
    return -1;
  };
  function award(g, team, points, res, nextStarter, target) {
    if (team >= 0) g.scores[team] += points;
    g.result = Object.assign({ team, points }, res);
    g.ended = { team };
    (g.history = g.history || []).push({ r: g.round, kind: res.kind, team, points, by: res.p });
    ev(g, "slam");
    ev(g, team >= 0 ? "win" : "knock");
    g.nextStarter = nextStarter;
    g.phase = team >= 0 && g.scores[team] >= target ? "match" : "round";
  }
  function play(g, p, i, side, target) {
    const t2 = g.hands[p].splice(i, 1)[0], x = t2[0], y = t2[1];
    (g.log = g.log || []).push({ p, t: [x, y] });
    g.must = null;
    if (!g.chain.length) {
      g.chain.push([x, y]);
      g.last = 0;
      g.anchor = 0;
    } else if (side === "L") {
      const L = g.chain[0][0];
      g.chain.unshift(x === L ? [y, x] : [x, y]);
      g.last = 0;
      g.anchor = (g.anchor || 0) + 1;
    } else {
      const R = g.chain[g.chain.length - 1][1];
      g.chain.push(x === R ? [x, y] : [y, x]);
      g.last = g.chain.length - 1;
    }
    g.said[p] = false;
    g.passes = 0;
    g.lastPlayer = p;
    g.moves = (g.moves || 0) + 1;
    ev(g, "clack");
    if (!g.hands[p].length) {
      if (g.bot[p]) say(g, p, ["Domino!", "That is it!", "Yes!"], "out");
      else {
        const m = g.teams ? witness(g, p, true) : -1;
        if (m >= 0) say(g, m, ["Nice one!", "Well played!"], "mate");
        else say(g, witness(g, p, false), ["Ahh.", "Not again…"], "foe");
      }
      const team = teamOf(g, p), points = g.hands.reduce((s, hd, q) => s + (teamOf(g, q) !== team ? pts(hd) : 0), 0);
      award(g, team, points, { kind: "out", p }, p, target);
    } else {
      g.turn = (p + 1) % g.n;
      if (stuck(g)) blocked(g, target);
    }
  }
  function pass(g, p, target) {
    g.said[p] = true;
    g.passes++;
    ev(g, "knock");
    (g.log = g.log || []).push({ p, pass: true });
    if (Math.random() < 0.7) say(g, p, ["Ugh.", "Nothing…", "I pass.", "Come on!"], "pass");
    if (g.chain.length) {
      g.lacks = g.lacks || [[], [], [], []];
      g.lacks[p].push(g.chain[0][0], g.chain[g.chain.length - 1][1]);
    }
    if (g.passes < g.n && !stuck(g)) {
      g.turn = (p + 1) % g.n;
      return;
    }
    blocked(g, target);
  }
  function draw(g, p) {
    if (!g.bone.length) return false;
    g.hands[p].push(g.bone.pop());
    logDraw(g, p);
    ev(g, "draw");
    return true;
  }
  const stuck = (g) => !g.bone.length && g.hands.every((hd, q) => !legal(g, q).length);
  function blocked(g, target) {
    const st = g.lastPlayer != null ? g.lastPlayer : g.starter;
    g.lockNow = st;
    if (g.bot[st]) say(g, st, ["Locked!", "Closed."], "lock");
    else say(g, witness(g, st, g.teams) >= 0 ? witness(g, st, g.teams) : witness(g, st, false), ["Locked…", "Hmm."], "locked");
    if (g.teams) {
      const a = pts(g.hands[0]) + pts(g.hands[2]), b = pts(g.hands[1]) + pts(g.hands[3]);
      if (a === b) return award(g, -1, 0, { kind: "tie", p: st, min: a }, g.starter, target);
      const team = a < b ? 0 : 1, points2 = Math.max(a, b);
      return award(g, team, points2, { kind: "lock", p: st, min: Math.min(a, b) }, st, target);
    }
    const P = g.hands.map((hd) => pts(hd)), min = Math.min.apply(null, P), w = P.indexOf(min);
    if (P.filter((x) => x === min).length > 1) return award(g, -1, 0, { kind: "tie", p: st, min }, g.starter, target);
    const points = P.reduce((x, y) => x + y, 0) - min;
    award(g, w, points, { kind: "lock", p: st, min }, st, target);
  }
  function misdeal(g) {
    for (let p = 0; p < g.n; p++) {
      const hd = g.hands[p], dbl = hd.filter((t2) => t2[0] === t2[1]).length;
      if (dbl >= 5) return { p, kind: "doubles", c: dbl };
      for (let k = 0; k <= 6; k++) {
        const c = hd.filter((t2) => t2.includes(k)).length;
        if (c >= 6) return { p, kind: "num", c, k };
      }
    }
    return null;
  }
  function ai(g, p, lvl) {
    const moves = legal(g, p);
    if (!moves.length) return g.bone.length ? { draw: 1 } : { pass: 1 };
    const hard = lvl === "hard";
    if (lvl === "easy") {
      const m = moves[Math.floor(Math.random() * moves.length)];
      return { play: [m.i, m.side] };
    }
    let best = null, bs = -1e9;
    for (const m of moves) {
      const t2 = g.hands[p][m.i];
      let open = t2[0];
      if (g.chain.length) {
        const e = m.side === "L" ? g.chain[0][0] : g.chain[g.chain.length - 1][1];
        open = t2[0] === e ? t2[1] : t2[0];
      }
      const keep = g.hands[p].filter((o, j) => j !== m.i && o.includes(open)).length;
      let s = t2[0] + t2[1] + (t2[0] === t2[1] ? 3 : 0) + keep * 2 + Math.random();
      if (hard) {
        const other = g.chain.length ? m.side === "L" ? g.chain[g.chain.length - 1][1] : g.chain[0][0] : t2[0] === open ? t2[1] : t2[0], lk = g.lacks || [[], [], [], []];
        const miss = (q) => (lk[q].includes(open) ? 1 : 0) + (lk[q].includes(other) ? 1 : 0);
        for (let q = 0; q < g.n; q++) if (q !== p) s += teamOf(g, q) !== teamOf(g, p) ? (q === (p + 1) % g.n ? 4 : 2) * miss(q) : -3 * miss(q);
      }
      if (s > bs) {
        bs = s;
        best = m;
      }
    }
    return { play: [best.i, best.side] };
  }
  function sidesFor(chain, must, t2) {
    if (!chain.length) return must == null || t2[0] === must && t2[1] === must ? ["R"] : [];
    const L = chain[0][0], R = chain[chain.length - 1][1], out = [];
    if (t2.includes(L)) out.push("L");
    if (t2.includes(R) && !(L === R && t2.includes(L))) out.push("R");
    return out;
  }
  const PIPS = [[], [4], [0, 8], [0, 4, 8], [0, 2, 6, 8], [0, 2, 4, 6, 8]];
  const cells = (n, horiz) => n === 6 ? horiz ? [0, 1, 2, 6, 7, 8] : [0, 2, 3, 5, 6, 8] : PIPS[n] || [];
  const HUE = ["", "#2aa7e0", "#1f7a3a", "#a8243a", "#5a4a3c", "#1f2f6b", "#f2c21b"];
  const HUE_W45 = ["", "#98cff0", "#89b590", "#d78c8e", "#a1978e", "#7b89ae", "#f8df9a"], HUE_W35 = ["", "#84c7ec", "#74a87d", "#cd777b", "#91857b", "#65749f", "#f7d986"], HUE_B55 = ["", "#07354a", "#04240d", "#35050d", "#18120d", "#04091f", "#503f03"];
  const dark = () => "radial-gradient(circle at 35% 30%,#55504a,#0d0c0b 70%)", sunk = "inset 0 1px 2px rgba(0,0,0,.9),0 1px 0 rgba(255,255,255,.75)", WH = "rgba(255,255,255,.7)", cast = ",0 9px 12px rgba(0,0,0,.5)";
  const boneSurf = "radial-gradient(ellipse at 28% 18%,rgba(255,255,255,.85),rgba(255,255,255,0) 55%),linear-gradient(145deg,#fffdf7,#f1e8d2 55%,#dccfae)";
  const boneSh = "inset 0 1px 0 #fff,inset 0 -2px 3px rgba(120,95,50,.35),0 1px 0 #cdbf9c,0 2px 0 #2a2a2c,0 5px 0 #121214" + cast;
  const SETS = {
    classic: { surf: "linear-gradient(145deg,#fffdf7 0%,#f4ecd9 50%,#e0d3b6 100%)", sh: "inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 3px rgba(120,95,50,.3),0 1px 0 #bfae88,0 3px 0 #a3916a,0 8px 12px rgba(0,0,0,.45)", pip: dark, psh: sunk, gbg: "rgba(70,52,22,.55)", ghl: WH, pin: true },
    color: { surf: "linear-gradient(145deg,#ffffff 0%,#f7f8fa 55%,#dde1e7 100%)", sh: "inset 0 1px 0 #fff,inset 0 -2px 3px rgba(90,100,115,.3),0 1px 0 #c9ced6,0 3px 0 #aab1bb,0 8px 12px rgba(0,0,0,.45)", pip: (n) => "radial-gradient(circle at 35% 30%," + HUE_W45[n] + "," + HUE[n] + " 70%)", psh: sunk, gbg: "#16181c", bar: true },
    bone: { surf: boneSurf, sh: boneSh, pip: dark, psh: "inset 0 2px 3px rgba(0,0,0,.9),0 1px 0 rgba(255,255,255,.55)", gbg: "rgba(70,52,22,.6)", ghl: WH, pin: true },
    boneColor: { surf: boneSurf, sh: boneSh, pip: (n) => "radial-gradient(circle at 50% 80%," + HUE_W35[n] + "," + HUE[n] + " 50%," + HUE_B55[n] + " 100%)", psh: "inset 0 3px 4px rgba(0,0,0,.75),inset 0 -1px 1px rgba(255,255,255,.3),0 1px 0 rgba(255,255,255,.9),0 -1px 0 rgba(120,95,50,.4)", gbg: "rgba(70,52,22,.6)", ghl: WH, pin: true },
    ebony: { surf: "radial-gradient(ellipse at 28% 18%,rgba(255,255,255,.28),rgba(255,255,255,0) 55%),linear-gradient(145deg,#3d4046,#1c1e21 50%,#0a0b0c)", sh: "inset 0 1px 0 rgba(255,255,255,.35),inset 0 -3px 4px rgba(0,0,0,.7),0 1px 0 #18191b,0 5px 0 #060607" + cast, pip: () => "radial-gradient(circle at 35% 30%,#ffffff,#e4d9bd 75%)", psh: "inset 0 -1px 2px rgba(90,70,30,.5),0 1px 2px rgba(0,0,0,.8)", gbg: "rgba(255,255,255,.2)", ghl: "rgba(0,0,0,.8)", pin: true },
    maple: { surf: "repeating-linear-gradient(94deg,rgba(120,70,20,.13) 0,rgba(120,70,20,.13) 1px,rgba(120,70,20,0) 1px,rgba(120,70,20,0) 6px),repeating-linear-gradient(88deg,rgba(255,235,190,.12) 0,rgba(255,235,190,.12) 2px,rgba(255,235,190,0) 2px,rgba(255,235,190,0) 11px),linear-gradient(145deg,#ecc68c,#d9a868 50%,#c18e52)", sh: "inset 0 1px 0 rgba(255,240,205,.9),inset 0 -2px 3px rgba(90,50,10,.4),0 1px 0 #b5824a,0 4px 0 #8c5f30,0 5px 0 #5e3d1c" + cast, pip: () => "radial-gradient(circle at 40% 35%,#4a2e16,#1c0f05 70%)", psh: "inset 0 2px 3px rgba(0,0,0,.85),0 1px 0 rgba(255,235,190,.6)", gbg: "rgba(70,35,10,.7)", ghl: "rgba(255,235,190,.6)" }
  };
  const setOf = (id) => SETS[id] || SETS.classic;
  const TILE_SETS = [["classic", "Classic ivory", "Ivory"], ["color", "Color dots", "Color"], ["boneColor", "Bone and ebony, coloured", "Bone"], ["ebony", "Ebony", "Ebony"], ["maple", "Maple wood", "Maple"]];
  const TABLES = [["teal", "Teal felt", "#0a625e"], ["green", "Green felt", "#146d34"], ["burgundy", "Burgundy felt", "#7f1f29"], ["walnut", "Walnut wood", "linear-gradient(90deg,#8a5a31,#6f4423)"]];
  const BORDERS = [["wood", "Wood"], ["light", "Light line"], ["float", "Float"], ["leather", "Leather"]];
  const DEALS = [["line", "Line"], ["ring", "Ring"], ["drop", "Drop"], ["off", "Off"]];
  const ENDS = [["panel", "Panel"], ["sweep", "Sweep"], ["flip", "Flip"], ["pips", "Pips"], ["stamp", "Stamp"], ["orbit", "Orbit"]];
  const LOCKS = [["padlock", "Padlock"], ["gates", "Gates"], ["banner", "Banner"], ["off", "Off"]];
  const RIMS = {
    wood: { margin: "0 10px 10px", rad: "24px", border: "12px solid #5b3a1f", colors: "#5b3a1f", sh: "0 0 0 2px #2a180b,inset 0 0 0 2px rgba(0,0,0,.45),inset 0 0 90px rgba(0,0,0,.45),0 10px 30px rgba(0,0,0,.5)", outline: "none", off: "0px" },
    light: { margin: "0 10px 10px", rad: "24px", border: "12px solid #0d0e11", colors: "#1a1c21 #0d0e11 #060607 #0d0e11", sh: "inset 0 0 0 2px #ffd978,inset 0 0 14px 3px rgba(255,200,90,.85),inset 0 0 42px 8px rgba(255,180,60,.3),inset 0 0 90px rgba(0,0,0,.45),0 0 0 1px #000,0 10px 30px rgba(0,0,0,.6)", outline: "none", off: "0px" },
    float: { margin: "4px 22px 28px", rad: "28px", border: "0px solid transparent", colors: "transparent", sh: "inset 0 0 90px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.16),inset 0 1px 0 rgba(255,255,255,.35),0 24px 50px rgba(0,0,0,.75),0 6px 14px rgba(0,0,0,.5)", outline: "none", off: "0px" },
    leather: { margin: "0 10px 10px", rad: "40px", border: "22px solid #4a2a18", colors: "#6f4329 #4a2a18 #2e190d #4a2a18", sh: "inset 0 0 0 3px #1c0e06,inset 0 0 90px rgba(0,0,0,.45),0 0 0 2px #1c0e06,0 10px 30px rgba(0,0,0,.55)", outline: "2px dashed rgba(235,205,160,.6)", off: "-12px" }
  };
  function rim(el, id, withMargin) {
    const r = RIMS[id] || RIMS.wood;
    if (withMargin) el.style.margin = r.margin;
    el.style.borderRadius = r.rad;
    el.style.border = r.border;
    el.style.borderColor = r.colors;
    el.style.boxShadow = r.sh;
    let st = null, cl = null;
    for (const c of [].slice.call(el.children)) {
      if (c.className === "dmn-stitch") st = c;
      else if (c.className === "dmn-clip") cl = c;
    }
    const stitch = r.outline !== "none";
    if (cl) {
      el.style.outline = "none";
      cl.style.borderRadius = Math.max(0, parseFloat(r.rad) - parseFloat(r.border)) + "px";
      if (stitch) {
        if (!st) {
          st = h("div", "", el);
          st.className = "dmn-stitch";
        }
        st.style.cssText = "position:absolute;left:-12px;top:-12px;right:-12px;bottom:-12px;box-sizing:border-box;border:" + r.outline + ";border-radius:" + (parseFloat(r.rad) - 10) + "px;pointer-events:none;z-index:3";
      } else if (st) st.remove();
    } else {
      el.style.outline = r.outline;
      el.style.outlineOffset = r.off;
    }
    return r;
  }
  function clip(el) {
    for (const c2 of [].slice.call(el.children)) if (c2.className === "dmn-clip") return c2;
    el.style.overflow = "visible";
    const c = h("div", "position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden", el);
    c.className = "dmn-clip";
    return c;
  }
  const scalePx = (s, k) => k === 1 ? s : String(s).replace(/(-?\d*\.?\d+)px/g, (m, n) => Math.round(n * k * 100) / 100 + "px");
  const SIZES = {
    hand: { s: 54, pip: 11, pad: 8, rad: 10, pin: 8, dl: 42, dt: 2, dtb: 5, psh: 1, hl: 1 },
    menu: { s: 42, pip: 9, pad: 6, rad: 9, pin: 7, dl: 32, dt: 2, dtb: 4, psh: 1, hl: 1 },
    sum: { s: 34, pip: 7, pad: 5, rad: 7, pin: 6, dl: 26, dt: 1.5, dtb: 3, psh: 1, hl: 1 },
    open: { s: 22, pip: 5, pad: 3, rad: 5, pin: 0, dl: 16, dt: 1.5, dtb: 1.5, psh: 0, hl: 0 }
  };
  const chainSize = (s, bar) => ({ s, pip: Math.round(s * 0.2), pad: Math.round(s * 0.14), rad: Math.round(s * 0.2), pin: Math.round(s * 0.15), dl: Math.round(s * (bar ? 0.66 : 0.78)), dt: bar ? Math.round(s * 0.09) : 2, dtb: bar ? Math.round(s * 0.09) : 2, psh: 1, hl: 1 });
  function tile(t2, o) {
    o = o || {};
    const T = setOf(o.set), Z = typeof o.size === "object" ? o.size : SIZES[o.size || "menu"], k = o.k || 1, vert = !!o.vert;
    const s = Z.s * k, pip = Z.pip * k, pad = Z.pad * k;
    const e = h("div", "position:relative;display:flex;flex:none;flex-direction:" + (vert ? "column" : "row") + ";border-radius:" + Z.rad * k + "px;background:" + T.surf + ";box-shadow:" + (o.sh === false ? "none" : scalePx(T.sh, k)));
    const half2 = (n) => {
      const b = h("div", "position:relative;flex:none;width:" + s + "px;height:" + s + "px", e);
      const tr = (s - 2 * pad) / 3;
      for (const c of cells(n, !vert)) h("div", "position:absolute;left:" + (pad + tr * (c % 3 + 0.5) - pip / 2) + "px;top:" + (pad + tr * (Math.floor(c / 3) + 0.5) - pip / 2) + "px;width:" + pip + "px;height:" + pip + "px;border-radius:50%;background:" + T.pip(n) + (Z.psh ? ";box-shadow:" + scalePx(T.psh, k) : ""), b);
    };
    half2(t2[0]);
    const dt = (T.bar ? Z.dtb : Z.dt) * k, dl = Z.dl * k;
    h("div", "flex:none;align-self:center;width:" + (vert ? dl : dt) + "px;height:" + (vert ? dt : dl) + "px;border-radius:2px;background:" + T.gbg + (Z.hl && T.ghl ? ";box-shadow:" + (vert ? "0 1px 0 " : "1px 0 0 ") + T.ghl : ""), e);
    if (T.pin && Z.pin) h("div", "position:absolute;left:50%;top:50%;width:" + Z.pin * k + "px;height:" + Z.pin * k + "px;margin:" + -Z.pin * k / 2 + "px 0 0 " + -Z.pin * k / 2 + "px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f6e3a1,#a67c2e 70%);box-shadow:0 1px 1px rgba(0,0,0,.5)", e);
    half2(t2[1]);
    return e;
  }
  function calcOf(hands, team, teams) {
    const opp = hands.filter((hd, q) => (teams ? q % 2 : q) !== team);
    let parts = opp.map(pts);
    if (parts.length === 1) parts = opp[0].map((t2) => t2[0] + t2[1]);
    return parts.length > 1 ? parts.join(" + ") + " = " + parts.reduce((a, b) => a + b, 0) : "";
  }
  const plus = (n) => "⁦+" + n + "⁩";
  function half(n, o) {
    o = o || {};
    const T = setOf(o.set), Z = typeof o.size === "object" ? o.size : SIZES[o.size || "menu"], k = o.k || 1;
    const s = Z.s * k, pip = Z.pip * k, pad = Z.pad * k, tr = (s - 2 * pad) / 3;
    const e = h("div", "position:relative;flex:none;width:" + s + "px;height:" + s + "px;border-radius:" + Z.rad * k + "px;background:" + T.surf + ";box-shadow:" + (o.sh === false ? "none" : scalePx(T.sh, k)));
    for (const c of cells(n, false)) h("div", "position:absolute;left:" + (pad + tr * (c % 3 + 0.5) - pip / 2) + "px;top:" + (pad + tr * (Math.floor(c / 3) + 0.5) - pip / 2) + "px;width:" + pip + "px;height:" + pip + "px;border-radius:50%;background:" + T.pip(n) + (Z.psh ? ";box-shadow:" + scalePx(T.psh, k) : ""), e);
    return e;
  }
  const BACK = "radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.9),rgba(255,255,255,0) 60%),linear-gradient(145deg,#fbf6ea 0%,#efe5cd 55%,#d9cba9 100%)";
  const BACK_SH = {
    seat: "inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 3px rgba(120,95,50,.3),inset 0 0 0 1px rgba(150,125,80,.25),0 1px 0 #c9b992,0 3px 0 #a3916a,0 4px 0 #8a7955,0 9px 10px rgba(0,0,0,.5)",
    pile: "inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 3px rgba(120,95,50,.3),inset 0 0 0 1px rgba(150,125,80,.25),0 1px 0 #c9b992,0 4px 0 #a3916a,0 5px 0 #8a7955,0 11px 12px rgba(0,0,0,.5)"
  };
  const DEAL_BG = "radial-gradient(ellipse at 50% 50%,#fffdf7 0%,#f4ecd9 55%,#e2d6ba 100%)";
  function back(w, hh, rad, kind) {
    return h("div", "flex:none;width:" + w + "px;height:" + hh + "px;border-radius:" + rad + "px;background:" + BACK + ";box-shadow:" + BACK_SH[kind || "seat"]);
  }
  function layout(chain, anchor, W, H, bar, o) {
    o = o || {};
    const n = chain.length, A = Math.min(anchor || 0, Math.max(0, n - 1)), max = o.max || 48, min = o.min || 12;
    let r;
    for (let s = max; s >= min; s -= 2) {
      const G = bar ? Math.round(s * 0.09) : 2, L = 2 * s + G, lim = W / 2 - 12, out = new Array(n), ends = { R: { x: 0, top: 0, dir: 1, side: 1 }, L: { x: 0, top: 0, dir: -1, side: -1 } };
      let minY = 0, maxY = s;
      const put = (k, x, y, vert, first, second) => {
        out[k] = { x, y, vert, first, second };
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y + (vert ? L : s));
      };
      if (n) {
        const t0 = chain[A], d0 = t0[0] === t0[1], w0 = d0 ? s : L;
        put(A, -w0 / 2, d0 ? -(L - s) / 2 : 0, d0, t0[0], t0[1]);
        const arm = (side) => {
          let dir = side, x = side * (w0 / 2 + 2), top = 0, turned = false, pv = { l: -w0 / 2, w: w0, y: d0 ? -(L - s) / 2 : 0, h: d0 ? L : s };
          for (let k = A + side; k >= 0 && k < n; k += side) {
            const t2 = chain[k], inner = side > 0 ? t2[0] : t2[1], outer = side > 0 ? t2[1] : t2[0], cross = t2[0] === t2[1] && !turned;
            const w = cross ? s : L, room = dir > 0 ? lim - x : x + lim;
            if (turned || room >= w) {
              const left = dir > 0 ? x : x - w, y = cross ? top - (L - s) / 2 : top;
              if (cross) put(k, left, y, true, t2[0], t2[1]);
              else put(k, left, y, false, dir > 0 ? inner : outer, dir > 0 ? outer : inner);
              pv = { l: left, w, y, h: cross ? L : s };
              x += dir * (w + 2);
              turned = false;
            } else {
              const cl = dir > 0 ? pv.l + pv.w - s : pv.l, cy = side > 0 ? pv.y + pv.h + 2 : pv.y - 2 - L;
              put(k, cl, cy, true, side > 0 ? inner : outer, side > 0 ? outer : inner);
              top = side > 0 ? cy + L + 2 : cy - 2 - s;
              dir = -dir;
              x = dir > 0 ? cl : cl + s;
              turned = true;
            }
          }
          return { x, top, dir, side };
        };
        ends.R = arm(1);
        ends.L = arm(-1);
        for (const e of [ends.R, ends.L]) {
          const ext = Math.max(s + 2 + L, s + 48);
          minY = Math.min(minY, e.side > 0 ? e.top : e.top + s - ext);
          maxY = Math.max(maxY, e.side > 0 ? e.top + ext : e.top + s);
        }
      }
      r = { s, G, L, out, minY, maxY, ends };
      if (maxY - minY + 30 <= H) break;
    }
    const ox = W / 2, oy = (H - (r.maxY - r.minY)) / 2 - r.minY - 3;
    const tiles = r.out.map((p) => ({ x: p.x + ox, y: p.y + oy, vert: p.vert, first: p.first, second: p.second }));
    return { s: r.s, G: r.G, tiles, endL: { dir: r.ends.L.dir, x: ox + r.ends.L.x, y: oy + r.ends.L.top + r.s / 2 }, endR: { dir: r.ends.R.dir, x: ox + r.ends.R.x, y: oy + r.ends.R.top + r.s / 2 } };
  }
  function drawChain(board, chain, o) {
    const T = setOf(o.set), lay = layout(chain, o.anchor, o.W, o.H, !!T.bar, o);
    const Z = chainSize(lay.s, !!T.bar);
    chain.forEach((t2, k) => {
      const p = lay.tiles[k];
      const e = tile([p.first, p.second], { set: o.set, size: Z, vert: p.vert });
      e.style.position = "absolute";
      e.style.left = px(p.x);
      e.style.top = px(p.y);
      if (k === o.last) {
        e.style.boxShadow = "0 0 0 2px " + GOLD + ",inset 0 0 0 1px " + GOLD + "," + scalePx(T.sh, 1);
        if (o.drop) e.style.animation = (o.moves % 2 ? "dmDropA" : "dmDropB") + " .3s cubic-bezier(.2,.9,.3,1.25)";
      }
      board.appendChild(e);
    });
    return lay;
  }
  const sceneKit = () => {
    const boxes = [], texts = [];
    const box = (o) => boxes.push(Object.assign({ bg: "transparent", sh: "none", bd: "none", an: "none", to: "center" }, o, { x: px(o.x), y: px(o.y), w: px(o.w), h: px(o.h), rad: px(o.rad || 0) }));
    const txt = (x, y, text, o) => texts.push(Object.assign({ w: "440px", h: "auto", fs: "13px", fw: 500, color: CREAM, bg: "transparent", rad: "0px", font: PLEX, sh: "none", bd: "none", an: "none", to: "center" }, o, { x: px(x), y: px(y), text }));
    return { boxes, texts, box, txt };
  };
  function lockScene(o) {
    const S = sceneKit(), box = S.box, txt = S.txt, t2 = o.t;
    if (o.kind === "banner") {
      box({ x: -600, y: 58, w: 1640, h: 96, bg: "linear-gradient(90deg,#031a1b,#082c2e 50%,#031a1b)", sh: "0 10px 24px rgba(0,0,0,.6),inset 0 2px 0 #e3b85a,inset 0 -2px 0 #e3b85a", an: "dmLkSlide .45s both" });
      txt(40, 80, o.ini, { w: "52px", h: "52px", rad: "50%", bg: o.av, pic: o.pic, fw: 700, fs: "22px", sh: "0 0 0 3px #e3b85a,0 0 18px rgba(227,184,90,.8)", an: "dmFxPop .4s .45s both" });
      txt(108, 76, t2.lockedBy, { w: "auto", fs: "26px", fw: 700, color: GOLD, font: KUFI, an: "dmFxPop .45s .6s both", fit: 320 });
      txt(108, 114, t2.counting, { w: "auto", an: "dmFxFade .5s .9s both" });
    } else {
      if (o.kind !== "gates") {
        box({ x: 120, y: -14, w: 200, h: 200, rad: 100, bd: "3px solid #e3b85a", an: "dmFxRipple 1s .75s both" });
        box({ x: 198, y: 30, w: 44, h: 64, rad: 22, bd: "8px solid #d9dde3", sh: "inset 0 2px 2px rgba(0,0,0,.4),0 2px 4px rgba(0,0,0,.5)", an: "dmLkDrop .9s .05s both" });
        box({ x: 184, y: 68, w: 72, h: 58, rad: 10, bg: "linear-gradient(180deg,#f1dc98,#c39a3f 55%,#8a6a22)", sh: "inset 0 2px 0 rgba(255,250,220,.9),inset 0 -3px 4px rgba(70,50,10,.6),0 8px 16px rgba(0,0,0,.6)", an: "dmFxPop .4s both" });
        box({ x: 213, y: 84, w: 14, h: 14, rad: 7, bg: "#2a1f08", an: "dmFxPop .4s both" });
        box({ x: 217, y: 94, w: 6, h: 16, rad: 2, bg: "#2a1f08", an: "dmFxPop .4s both" });
      }
      txt(0, 138, t2.locked, { fs: "30px", fw: 700, color: GOLD, font: KUFI, an: "dmFxPop .5s .9s both" });
      txt(0, 178, t2.closedBy, { an: "dmFxFade .5s 1.1s both" });
    }
    return { boxes: S.boxes, texts: S.texts };
  }
  function fxScene(o) {
    const S = sceneKit(), box = S.box, txt = S.txt, t2 = o.t;
    const tie = !!o.tie, ptsN = tie ? 0 : o.points, who = tie ? t2.tie : o.who, parts = tie ? [] : o.parts;
    const calc = o.calc, digits = String(ptsN).split(""), main = tie ? t2.tie + "  " + plus(0) : who + "  " + plus(ptsN);
    const fade = (d) => "dmFxFade .5s " + d + "s both", pop = (d) => "dmFxPop .5s " + d + "s both";
    const up = (s) => o.upper === false ? s : String(s).toUpperCase();
    const kind = o.kind;
    if (kind === "flip") {
      box({ x: 60, y: 4, w: 320, h: 144, rad: 12, bg: "#0e0f12", sh: "0 12px 26px rgba(0,0,0,.6),inset 0 0 0 2px #2a2c31", an: fade(0) });
      txt(0, 13, up(o.title + " · " + who), { fs: "10px", fw: 600, color: "#c9ced6", fit: 300 });
      const chars = ["+"].concat(digits), tot = chars.length * 52 + (chars.length - 1) * 10;
      chars.forEach((ch, i) => txt(220 - tot / 2 + i * 62, 32, ch, { w: "52px", h: "64px", rad: "6px", bg: "linear-gradient(180deg,#2e3138 0,#2e3138 48%,#050506 48%,#050506 52%,#24272d 52%)", fs: "40px", fw: 700, color: GOLD, font: KUFI, sh: "0 3px 6px rgba(0,0,0,.6),inset 0 1px 0 rgba(255,255,255,.18)", an: "dmFxFlip .45s " + (0.4 + i * 0.25) + "s both", ltr: 1 }));
      txt(0, 106, calc, { fs: "12px", fw: 600, color: "#c9ced6", an: fade(1.4), ltr: tie ? 0 : 1 });
      txt(0, 126, up(o.scoreLine), { fs: "10px", fw: 600, color: "#c9ced6", an: fade(1.6), fit: 300 });
    } else if (kind === "pips") {
      const F = { 0: [".##.", "#..#", "#..#", "#..#", ".##."], 1: ["..#.", ".##.", "..#.", "..#.", ".###"], 2: ["###.", "...#", ".##.", "#...", "####"], 3: ["###.", "...#", ".##.", "...#", "###."], 4: ["#..#", "#..#", "####", "...#", "...#"], 5: ["####", "#...", "###.", "...#", "###."], 6: [".##.", "#...", "###.", "#..#", ".##."], 7: ["####", "...#", "..#.", ".#..", ".#.."], 8: [".##.", "#..#", ".##.", "#..#", ".##."], 9: [".##.", "#..#", ".###", "...#", ".##."] };
      const tot = digits.length * 80 + (digits.length - 1) * 24;
      let di = 0;
      for (let rr = 0; rr < 5; rr++) digits.forEach((dg, k) => F[dg][rr].split("").forEach((ch, c) => {
        if (ch !== "#") return;
        const i = di++;
        txt(220 - tot / 2 + k * 104 + c * 20 + 3, 8 + rr * 20, "", { w: "14px", h: "14px", rad: "50%", bg: "radial-gradient(circle at 35% 30%,#fffdf7,#d9cba9)", sh: "0 2px 3px rgba(0,0,0,.55)", an: (i % 2 ? "dmFxR" : "dmFxL") + " .6s " + (0.2 + i * 0.05).toFixed(2) + "s both" });
      }));
      txt(0, 116, o.title + " · " + (tie ? t2.noPoints : who + " " + plus(ptsN)), { fs: "14px", fw: 600, color: GOLD, an: fade(1.5), fit: 420 });
      txt(0, 136, calc, { fs: "12px", an: fade(1.7), ltr: tie ? 0 : 1 });
    } else if (kind === "stamp") {
      box({ x: 120, y: -25, w: 200, h: 200, rad: 100, bd: "3px solid #e3b85a", an: "dmFxRipple 1s .6s both" });
      box({ x: 120, y: -25, w: 200, h: 200, rad: 100, bd: "2px solid #fff3bf", an: "dmFxRipple 1s .8s both" });
      txt(50, 30, up(main), { w: "340px", h: "78px", fs: "30px", fw: 700, color: GOLD, font: KUFI, bd: "5px double #e3b85a", rad: "12px", bg: "rgba(20,10,10,.5)", an: "dmFxStamp .6s .3s both", fit: 310 });
      txt(0, 126, o.title + (calc ? " · " + calc : ""), { fs: "12px", an: fade(1.1), fit: 430 });
    } else if (kind === "orbit") {
      box({ x: 170, y: 25, w: 100, h: 100, rad: 50, bg: "radial-gradient(circle,#152a2d 0,#152a2d 60%,#c9a24a 62%,#c9a24a 100%)", sh: "inset 0 2px 0 rgba(255,245,200,.7),0 0 30px rgba(255,200,90,.45),0 10px 20px rgba(0,0,0,.55)", an: pop(0.2) });
      txt(0, 50, tie ? "0" : "+" + ptsN, { fs: "30px", fw: 700, color: GOLD, font: KUFI, an: pop(0.6), ltr: 1 });
      txt(170, 88, o.upper === false ? who : String(who).toLowerCase(), { w: "100px", fs: "11px", an: fade(0.8), fit: 84 });
      const cols = [];
      parts.forEach((p, j) => {
        for (let q = 0; q < p; q++) cols.push(j % 2 ? "#e3b85a" : "#fff3bf");
      });
      const N = Math.min(cols.length, 44);
      for (let i = 0; i < N; i++) {
        const th = i / N * Math.PI * 2 - Math.PI / 2, x = Math.round(220 + 68 * Math.cos(th) - 4), y = Math.round(75 + 68 * Math.sin(th) - 4);
        txt(x, y, "", { w: "8px", h: "8px", rad: "50%", bg: cols[Math.floor(i * cols.length / N)], sh: "0 0 6px rgba(255,220,130,.8)", to: 220 - x + "px " + (75 - y) + "px", an: "dmFxSpin 9s linear infinite" });
      }
      txt(0, 67, o.title, { w: "136px", fs: "12px", an: fade(1), fit: 130 });
      txt(304, 67, calc, { w: "136px", fs: "12px", an: fade(1.2), fit: 130, ltr: tie ? 0 : 1 });
    } else {
      const line = "linear-gradient(90deg,rgba(227,184,90,0),#e3b85a 20%,#e3b85a 80%,rgba(227,184,90,0))";
      box({ x: -30, y: 30, w: 500, h: 92, bg: "linear-gradient(90deg,rgba(0,0,0,0),#032729 22%,#032729 78%,rgba(0,0,0,0))", an: fade(0.1) });
      box({ x: 20, y: 30, w: 400, h: 2, bg: line, an: fade(0.3) });
      box({ x: 20, y: 120, w: 400, h: 2, bg: line, an: fade(0.3) });
      box({ x: 60, y: 32, w: 140, h: 88, bg: "linear-gradient(100deg,rgba(255,235,170,0),rgba(255,235,170,.4),rgba(255,235,170,0))", an: "dmFxSweep 3s .8s linear infinite both" });
      txt(0, 38, o.title, { fs: "13px", an: fade(0.4), fit: 420 });
      txt(0, 55, main, { fs: "34px", fw: 700, color: GOLD, font: KUFI, an: pop(0.6), fit: 430 });
      txt(0, 99, calc, { fs: "12px", an: fade(1), ltr: tie ? 0 : 1 });
    }
    return { boxes: S.boxes, texts: S.texts };
  }
  function drawScene(stage, sc) {
    for (const b of sc.boxes) h("div", "position:absolute;left:" + b.x + ";top:" + b.y + ";width:" + b.w + ";height:" + b.h + ";box-sizing:border-box;background:" + b.bg + ";border-radius:" + b.rad + ";box-shadow:" + b.sh + ";border:" + b.bd + ";transform-origin:" + b.to + ";animation:" + b.an, stage);
    for (const x of sc.texts) {
      const e = h("div", "position:absolute;left:" + x.x + ";top:" + x.y + ";width:" + x.w + ";height:" + x.h + ";box-sizing:border-box;display:flex;align-items:center;justify-content:center;white-space:nowrap;line-height:1.2;font-family:" + x.font + ";font-size:" + x.fs + ";font-weight:" + x.fw + ";color:" + x.color + ";background:" + x.bg + ";border-radius:" + x.rad + ";box-shadow:" + x.sh + ";border:" + x.bd + ";transform-origin:" + x.to + ";animation:" + x.an + (x.ltr ? ";direction:ltr" : ""), stage);
      if (x.pic) {
        e.style.backgroundImage = 'url("' + x.pic + '")';
        e.style.backgroundSize = "cover";
        e.style.backgroundPosition = "center";
        e.style.overflow = "hidden";
      } else if (x.text) {
        if (x.fit && x.text.length > 4) {
          const fs0 = parseFloat(x.fs), est = x.text.length * fs0 * (x.font === KUFI ? 0.5 : 0.52);
          if (est > x.fit) e.style.fontSize = Math.max(8, Math.floor(fs0 * x.fit / est * 10) / 10) + "px";
        }
        e.textContent = x.text;
      }
    }
  }
  function previewDeal(kind, name) {
    const T = 4.5, pc = (t2) => (t2 / T * 100).toFixed(2) + "%", css2 = [], tiles = [], D = Math.PI / 180;
    const seat = [(j) => ({ x: 160 + j * 20, y: 74, w: 12, h: 24 }), (j) => ({ x: 352, y: 26 + j * 16, w: 24, h: 12 }), (j) => ({ x: 160 + j * 20, y: 2, w: 12, h: 24 }), (j) => ({ x: 4, y: 26 + j * 16, w: 24, h: 12 })];
    for (let r = 0; r < 3; r++) for (let p = 0; p < 4; p++) {
      const i = r * 4 + p, pos = seat[p](r), t0 = 0.3 + i * 0.2, rot = pos.w > pos.h, nm = (name || "dmPd") + kind + i;
      let tr, o = 1;
      if (kind === "drop") {
        tr = "translate(0,-40px) scale(1.5)";
        o = 0;
      } else {
        const a = kind === "ring" ? i * 30 : 0, cx = kind === "ring" ? 190 + 30 * Math.sin(a * D) : 190 + (i - 5.5) * 15, cy = kind === "ring" ? 50 - 30 * Math.cos(a * D) : 50;
        tr = "translate(" + (cx - pos.x - pos.w / 2).toFixed(1) + "px," + (cy - pos.y - pos.h / 2).toFixed(1) + "px) rotate(" + Math.round(a + (rot ? 90 : 0)) + "deg)";
      }
      if (kind !== "off") css2.push("@keyframes " + nm + "{0%," + pc(t0) + "{transform:" + tr + ";opacity:" + o + "}" + pc(t0 + 0.3) + ",90%{transform:none;opacity:1}100%{transform:none;opacity:0}}");
      tiles.push({ x: pos.x, y: pos.y, w: pos.w, h: pos.h, an: kind === "off" ? "none" : nm + " " + T + "s ease-out infinite" });
    }
    return { css: css2.join("\n"), tiles };
  }
  function dealPlan(o) {
    const n = o.n, N = n * 7, gap = 0.24, T = +(0.4 + n * 3 * gap + 0.7).toFixed(2), pc = (t2) => (t2 / T * 100).toFixed(2) + "%", f1 = (v) => v.toFixed(1) + "px", D = Math.PI / 180, kind = o.kind, W = o.W, H = o.H, br = o.board;
    const bcx = br.x + br.w / 2, bcy = br.y + br.h / 2;
    const full = n === 4, lcx = full ? W / 2 : bcx, pitch = Math.min(40, (full ? W - 24 : br.w - 16) / N), R = Math.max(50, Math.min(W * 0.3, H * 0.3, br.h / 2 - 16));
    const sw = kind === "ring" ? Math.max(6, Math.min(24, 2 * Math.PI * R / N - 6, R * 0.32)) : Math.max(6, Math.min(34, pitch - 3, (br.h - 28) / 2));
    const tiles = [], css2 = [], got = new Array(n).fill(0), beats = [];
    let b = 0, idx = 0;
    [2, 2, 3].forEach((cnt) => {
      for (let p = 0; p < n; p++) {
        for (let k = 0; k < cnt; k++) {
          const pos = o.slots[p](got[p]++), t0 = 0.4 + b * gap + k * 0.06, i = idx++, rot = pos.w > pos.h;
          let tr, op = 1, land;
          if (kind === "drop") {
            tr = "translate(0,-90px) rotate(" + (i * 37 % 30 - 15) + "deg) scale(1.6)";
            op = 0;
            land = pc(t0 + 0.25) + "{transform:none;opacity:1}" + pc(t0 + 0.33) + "{transform:translateY(-7px);opacity:1}" + pc(t0 + 0.42) + ",100%{transform:none;opacity:1}";
          } else {
            const a = kind === "ring" ? i * 360 / N : 0, cx = kind === "ring" ? bcx + R * Math.sin(a * D) : lcx + (i - (N - 1) / 2) * pitch, cy = kind === "ring" ? bcy - R * Math.cos(a * D) : bcy;
            tr = "translate(" + f1(cx - pos.x - pos.w / 2) + "," + f1(cy - pos.y - pos.h / 2) + ") rotate(" + Math.round(a + (rot ? 90 : 0)) + "deg) scale(" + ((rot ? 2 * sw : sw) / pos.w).toFixed(3) + "," + ((rot ? sw : 2 * sw) / pos.h).toFixed(3) + ")";
            land = pc(t0 + 0.32) + ",100%{transform:none;opacity:1}";
          }
          css2.push("@keyframes " + o.name + i + "{0%," + pc(t0) + "{transform:" + tr + ";opacity:" + op + "}" + land + "}");
          tiles.push({ x: f1(pos.x), y: f1(pos.y), w: f1(pos.w), h: f1(pos.h), rad: f1(Math.min(pos.w, pos.h) * 0.22), an: o.name + i + " " + T + "s ease-out both" });
        }
        beats.push((0.4 + b * gap) * 1e3);
        b++;
      }
    });
    return { tiles, css: css2.join("\n"), ms: T * 1e3 + 150, beats };
  }
  function keyframes(id, css2) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    if (el.textContent !== css2) el.textContent = css2;
  }
  const AV = ["linear-gradient(145deg,#2f7377,#153a3e)", "linear-gradient(145deg,#8a443b,#4a211c)", "linear-gradient(145deg,#4a55a0,#232a5c)", "linear-gradient(145deg,#8a7a30,#4a3f14)"];
  const TRAY = ["#0a3537", "#4d1c1a", "#232953", "#3c3611"], RING = ["#2f7377", "#8a443b", "#4a55a0", "#7d6e25"];
  const PAL = [["Teal", "#2f7377", "#153a3e"], ["Red", "#8a443b", "#4a211c"], ["Indigo", "#4a55a0", "#232a5c"], ["Olive", "#8a7a30", "#4a3f14"], ["Plum", "#7a3f7a", "#3f1f45"], ["Slate", "#4a5560", "#22282e"]];
  const grad = (c) => "linear-gradient(145deg," + PAL[c][1] + "," + PAL[c][2] + ")";
  const colOf = (teams, p) => teams ? p % 2 : p;
  const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .35 0 0 0 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E")`;
  const FONT = (fam, w, file, range, style) => "@font-face{font-family:'" + fam + "';font-style:" + (style || "normal") + ";font-weight:" + w + ";font-display:swap;src:url(" + BASE + "fonts/" + file + ") format('woff2');unicode-range:" + range + "}";
  const U_AR = "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0898-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC";
  const U_LA = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  const CSS = [
    FONT("Reem Kufi", 700, "dm-kufi-latin-700.woff2", U_LA),
    FONT("Reem Kufi", 700, "dm-kufi-arabic-700.woff2", U_AR),
    FONT("IBM Plex Sans Arabic", 400, "dm-plex-latin-400.woff2", U_LA),
    FONT("IBM Plex Sans Arabic", 400, "dm-plex-arabic-400.woff2", U_AR),
    FONT("IBM Plex Sans Arabic", 500, "dm-plex-latin-500.woff2", U_LA),
    FONT("IBM Plex Sans Arabic", 500, "dm-plex-arabic-500.woff2", U_AR),
    FONT("IBM Plex Sans Arabic", 600, "dm-plex-latin-600.woff2", U_LA),
    FONT("IBM Plex Sans Arabic", 600, "dm-plex-arabic-600.woff2", U_AR),
    // (the winners' screens and the lobby's looks: Playfair Display, Cinzel and Pinyon Script for Latin letters; Arabic
    // keeps the game's own two typefaces. Each is fetched only when a screen that wears it is shown. The Playfair
    // files are a changed copy: its figures that stand on the line, 151 and not the old-style ones, are the ones it
    // draws by itself, so a canvas draws them too. A changed copy carries another name inside, as its license asks.)
    FONT("DM Playfair", 700, "dm-playfair-latin-700.woff2", U_LA),
    FONT("DM Playfair", 900, "dm-playfair-latin-900.woff2", U_LA),
    FONT("DM Playfair", 700, "dm-playfair-latin-700i.woff2", U_LA, "italic"),
    FONT("DM Cinzel", 700, "dm-cinzel-latin-700.woff2", U_LA),
    FONT("DM Cinzel", 900, "dm-cinzel-latin-900.woff2", U_LA),
    FONT("DM Pinyon", 400, "dm-pinyon-latin-400.woff2", U_LA),
    FONT("DM Nunito", "200 1000", "imp-nunito-latin.woff2", U_LA),
    "@keyframes dwBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}",
    "@keyframes dwTw{0%,100%{opacity:.35;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}",
    "@keyframes dwSway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}",
    "@keyframes dwSweep{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}",
    "@keyframes dwGlint{0%,100%{opacity:.55}50%{opacity:1}}",
    "@keyframes dwFall{0%{transform:translateY(-40px) rotate(0)}100%{transform:translateY(1160px) rotate(540deg)}}",
    "@keyframes dwIn{from{opacity:0;transform:translateY(18px)}}",
    "@keyframes dmTurn{50%{transform:scale(1.19);opacity:.25}}",
    "@keyframes dmLkDrop{0%{opacity:0;transform:translateY(-18px)}25%,55%{opacity:1;transform:translateY(-18px)}78%{opacity:1;transform:translateY(2px)}100%{opacity:1;transform:none}}",
    "@keyframes dmLkSlam{0%{transform:translateY(-170px);opacity:0}60%{transform:translateY(6px);opacity:1}80%{transform:translateY(-4px);opacity:1}100%{transform:none;opacity:1}}",
    "@keyframes dmLkSlide{from{transform:translateX(-110%)}}",
    "@keyframes dmLkPulse{0%,100%{opacity:.25}50%{opacity:1}}",
    "@keyframes dmShake{0%,100%{transform:none}15%{transform:translate(-7px,3px)}30%{transform:translate(6px,-3px)}45%{transform:translate(-5px,2px)}60%{transform:translate(4px,-1px)}80%{transform:translate(-2px,1px)}}",
    "@keyframes dmFxFade{from{opacity:0}}",
    "@keyframes dmFxPop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}",
    "@keyframes dmFxL{from{transform:translateX(-240px);opacity:0}}",
    "@keyframes dmFxR{from{transform:translateX(240px);opacity:0}}",
    "@keyframes dmFxFlip{0%{transform:scaleY(0)}70%{transform:scaleY(1.12)}100%{transform:scaleY(1)}}",
    "@keyframes dmFxSpin{to{transform:rotate(360deg)}}",
    "@keyframes dmFxSweep{0%{transform:translateX(-40px);opacity:0}15%,85%{opacity:1}100%{transform:translateX(220px);opacity:0}}",
    "@keyframes dmFxStamp{0%{transform:rotate(-8deg) scale(3.2);opacity:0}60%{transform:rotate(-8deg) scale(.9);opacity:1}100%{transform:rotate(-8deg) scale(1);opacity:1}}",
    "@keyframes dmFxRipple{0%{transform:scale(.3);opacity:0}12%{opacity:.8}100%{transform:scale(1.7);opacity:0}}",
    "@keyframes dmDropA{from{transform:translateY(-22px) scale(1.3);opacity:0}}",
    "@keyframes dmDropB{from{transform:translateY(-22px) scale(1.3);opacity:0}}",
    "@keyframes dmRing{from{stroke-dashoffset:0}to{stroke-dashoffset:283}}",
    "@keyframes dmBar{from{transform:scaleX(1)}to{transform:scaleX(0)}}",
    "@keyframes dmStkIn{0%{transform:scale(.3) rotate(-10deg)}55%{transform:scale(1.1) rotate(3deg)}78%{transform:scale(.97) rotate(-1deg)}100%{transform:none}}",
    ".dmn-felt{background-color:#0c4c4c}",
    '.dmn-felt[data-table="teal"]{background-image:' + NOISE + ",radial-gradient(ellipse at 50% 42%,#156864,#003336 85%)}",
    '.dmn-felt[data-table="green"]{background-image:' + NOISE + ",radial-gradient(ellipse at 50% 42%,#21763c,#003616 85%)}",
    '.dmn-felt[data-table="burgundy"]{background-image:' + NOISE + ",radial-gradient(ellipse at 50% 42%,#892931,#3d090e 85%)}",
    `.dmn-felt[data-table="walnut"]{background-image:radial-gradient(ellipse at 50% 40%,rgba(255,225,180,.14),rgba(0,0,0,.5) 95%),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.02 .9' numOctaves='2' seed='3'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0 0 0 -.12'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='700'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.006 .28' numOctaves='4' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 .12 0 0 0 0 .06 0 0 0 0 .02 1.5 0 0 0 -.45'/%3E%3C/filter%3E%3Crect width='700' height='700' filter='url(%23n)'/%3E%3C/svg%3E"),linear-gradient(90deg,#8a5a31,#754826 35%,#8c5d34 70%,#6f4423)}`
  ].join("\n");
  function css() {
    if (document.getElementById("dm-core-css")) return;
    const st = document.createElement("style");
    st.id = "dm-core-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  const NAMES = [
    "James",
    "Mary",
    "Mike",
    "Linda",
    "Bobby",
    "Jenny",
    "David",
    "Susan",
    "Tom",
    "Jessica",
    "Charlie",
    "Sarah",
    "Chris",
    "Karen",
    "Danny",
    "Nancy",
    "Matt",
    "Lisa",
    "Tony",
    "Betty",
    "Mark",
    "Sandra",
    "Steve",
    "Ashley",
    "Paul",
    "Emily",
    "Andy",
    "Donna",
    "Josh",
    "Michelle",
    "Kevin",
    "Carol",
    "Brian",
    "Amanda",
    "George",
    "Melissa",
    "Tim",
    "Debbie",
    "Ron",
    "Stephanie",
    "Jason",
    "Becky",
    "Jeff",
    "Laura",
    "Ryan",
    "Cindy",
    "Jake",
    "Amy",
    "Gary",
    "Angela",
    "Nick",
    "Katie",
    "Eric",
    "Megan",
    "Scott",
    "Rachel",
    "Brandon",
    "Heather",
    "Ben",
    "Nicole",
    "Sam",
    "Emma",
    "Greg",
    "Olivia",
    "Frank",
    "Hannah",
    "Alex",
    "Abby",
    "Pat",
    "Chloe",
    "Jack",
    "Grace",
    "Dennis",
    "Zoe",
    "Tyler",
    "Lily",
    "Aaron",
    "Ella",
    "Henry",
    "Sophie",
    "Adam",
    "Maddie",
    "Nathan",
    "Claire",
    "Zach",
    "Lucy",
    "Kyle",
    "Molly",
    "Walt",
    "Ruby",
    "Luke",
    "Stella",
    "Owen",
    "Hazel",
    "Logan",
    "Violet",
    "Mason",
    "Ellie",
    "Ethan",
    "Nora",
    "Noah",
    "Riley",
    "Liam",
    "Paige",
    "Cody",
    "Brooke",
    "Dylan",
    "Savannah",
    "Austin",
    "Taylor",
    "Hunter",
    "Morgan",
    "Wyatt",
    "Bailey",
    "Cole",
    "Peyton",
    "Blake",
    "Harper",
    "Chase",
    "Avery",
    "Max",
    "Maya",
    "Leo",
    "Ava",
    "Hank",
    "Dolly",
    "Earl",
    "Peggy",
    "Wayne",
    "Dottie",
    "Buddy",
    "June"
  ];
  const REACTS = [
    "Nice one!",
    "Watch this.",
    "You are taking too long!",
    "Come on!",
    "What kind of move was that?!",
    "Wake me up when it is my turn.",
    "Ha ha!",
    "No way!",
    "Hmm…",
    "Please, just one six.",
    "Tea, anyone?",
    "I am on fire!",
    "Do not lock it!",
    "Good game!"
  ];
  const STICKERS = {
    ar: {
      v: 1,
      unit: 384,
      gone: [6],
      sizes: "376,402 376,412 344,459 381,390 377,416 0,0 361,421 401,395 375,403 375,382 407,379 433,382 453,338 372,421 362,402 390,391 360,421 382,394 398,398 370,397 388,432 384,406 384,405 399,408 406,406 390,375 375,417 383,400 399,388 386,385 374,382 386,405 341,453 355,420 384,436 385,466 356,440 343,431 352,433 451,361 452,353 428,344 418,315 387,374 394,352 395,383 405,426 410,399 414,401 427,368 429,386 385,416 398,400 350,448 424,432 381,404 393,334 382,368 408,356 436,351 422,349 414,371 419,370 413,360 422,373 432,374 440,367 427,354 428,375 438,361 435,360 415,370 447,364 422,379 439,369 429,362 425,355 435,354 432,361 402,402".split(" ").map((x) => x.split(",").map(Number)),
      text: "أكلت المقلب!|لا تبچي!|لا تحلم تفوز!|راح تنام خسران!|هذا آخر إنذار!||خليك ساكت!|لا تسوي نفسك محترف!|طلع حظك تعبان!|وين الدوشيش؟|روح تدرب وتعال!|انته منيلك؟|اذا اخذتو هذا الكيم بعد ما العب!|ابلع!|لا تناغي!|سياقة بعد!|لا تخاف!|اقفل!|يا ملك الدومنة!|فزنا يا معوّد|وين التصفيق؟|أريد إعادة!|مو معقولة!|هاي مو صدفة!|خسارة تاريخية!|لا أحد يحچي وياي!|شكد إنت محظوظ!|قلبي ما يتحمل!|يلا صبّوا چاي!|هاي لعبة الكبار!|لا تعيدها بعد!|ولك إنت تلعب لو تخربط؟|العب وانت ساكت أحسن!|قلبي طلع من مكانه!|ألعن أبو هالحظ!|شفتوا الإبداع؟|صفّقوا للمعلم!|فوز بطعم الشاي!|سجلوا اسمي بالتاريخ!|شكد حلوة الخسارة عليكم!|أريد جولة ثانية حتى أذلكم!|اليوم ماكو رحمة!|واحد صفر يا حبايب!|مخك طالع استراحة؟|شنو هالفضيحة؟|هذا ذكاء اصطناعي لو شنو؟|لا تخليني أضحك عليك!|شنو هالتوزيع التعبان؟|منو خربط؟|يمعود لا تفضحنا!|إنت آخر واحد يفهم!|شنو هاي الخطة الجهنمية؟|الله يساعد اللي يلعب وياك!|مو ناقصني غير إنت!|حتى الدومنة ضدي!|أريد أشتكي على التوزيع!|هاي مو لعبة هاي مؤامرة!|انطوني فرصة أعيش!|راح أنسحب وأفتح مطعم!|أريد أبدل ايدي!|لا تلعب وياي!|راحت عليك!|عيني عليك باردة!|شنو هالحظ؟|دوختني والله!|العب عدل!|مو هيج اللعب!|يا ساتر!|شنو جاي تسوي؟|لا تفرح هواية!|انكشف لعبك!|ولك خلصنا!|هذا مو لعب!|حظك يفوز مو إنت!|عفية على الذكاء!|بعدك تتعلم!|شوف شلون ألعب!|يمعود ارحمنا!|اليوم يومك مو يومي!|انته صدك تحجي!".split("|"),
      groups: [["تحشيش", [1, 2, 3, 4, 8, 11, 12, 25, 40, 41, 44, 47, 51, 53, 62, 70, 71, 72, 74, 76]], ["فوز", [14, 16, 17, 18, 20, 21, 24, 30, 36, 37, 38, 39, 42, 43, 77]], ["معصّب", [5, 7, 13, 15, 22, 26, 31, 32, 33, 49, 50, 54, 61, 66, 67, 69, 73]], ["حظ", [9, 10, 27, 35, 48, 55, 56, 57, 58, 59, 60, 64, 78, 79]], ["صدمة", [23, 28, 34, 45, 46, 52, 65, 68, 80]], ["عفية", [19, 29, 63, 75]]],
      bot: {
        out: [14, 36, 37, 77, 21, 16, 24, 30, 42, 62, 1],
        first: [43],
        win: [20, 38, 39, 40],
        mate: [19, 75, 63, 37],
        mateWin: [20, 19, 37],
        foe: [23, 27, 74, 68, 45, 70, 34, 28, 46, 80],
        lose: [25, 22, 59, 79, 41],
        pass: [35, 55, 64, 58, 78, 57, 60, 26],
        lock: [18],
        locked: [68, 23, 52, 45, 49, 80],
        slow: [72, 44, 4]
      }
    },
    en: {
      v: 1,
      unit: 384,
      sizes: "382,382 311,470 389,409 421,388 372,372 301,461 385,402 385,385 397,390 311,476 378,381 383,389 304,476 391,408 385,414 306,479 382,383 295,459 397,395 416,349 393,399 422,358 306,471 368,413 314,480 409,357 412,344 294,456 369,403 363,416 421,331 328,455 376,397 417,337 309,480 328,447 419,343 381,404 352,467 420,332 383,400 328,480 375,400 430,336 328,435 424,356 389,390 407,335 359,415 328,450 403,394 426,369 337,461 342,433 398,346 385,397 416,342 396,406 331,434".split(" ").map((x) => x.split(",").map(Number)),
      text: "I'm the domino king!|Sit down, rookie!|What was that?!|Bro, are you serious?!|Somebody call the press!|You just got destroyed!|Nice try, genius!|Where's my trophy?!|My grandma plays better!|That's how it's done!|Unbeatable!|I was born for this!|Too easy!|What a disaster!|Did you even think?!|Stay in your lane!|That's my superpower!|I own this table!|That's embarrassing!|What a comeback!|I'm done with you!|Lucky? No. Legendary!|You're not ready!|Bro needs a tutorial!|Go practice!|I can't believe I won!|Don't hate the player!|That's a skill issue!|What is this game?!|Even the dominoes are confused!|I'm too good!|Nice hand… not!|Please stop!|The king has arrived!|You fell for it!|Checkmate, buddy!|Rematch! Right now!|That was painful to watch!|Game over, champ!|I need a moment!|You call that a move?!|Don't blink!|I've seen better!|My heart can't take this!|I saw that coming!|This is personal!|Who invited this guy?!|I'm never playing again!|The table deserves better!|You walked right into it!|Bro is playing blind!|Who's next?!|Zero chance!|Don't cry now!|Easy money!|Somebody help him!|Good game… not really!|I'm crying!|Thanks for the easy win!".split("|"),
      groups: [["Trash talk", [2, 7, 9, 16, 23, 24, 25, 27, 28, 32, 43, 47, 49, 51, 53, 54, 56, 57]], ["Winning", [1, 5, 6, 8, 10, 11, 12, 13, 17, 18, 20, 22, 26, 31, 34, 39, 52, 55, 59]], ["Bad move", [3, 4, 15, 19, 38, 41, 58]], ["Gotcha", [35, 36, 42, 45, 50]], ["No way", [14, 29, 30, 44]], ["Fed up", [21, 33, 37, 40, 46, 48]]],
      // (no sticker of this pack says "you are taking too long": a computer player says that one in words)
      bot: {
        out: [10, 13, 11, 12, 17, 31, 22, 18, 52, 6, 55],
        first: [34, 1],
        win: [39, 8, 59, 5, 1],
        mate: [10, 20, 5, 11],
        mateWin: [39, 5, 11, 8],
        foe: [14, 44, 29, 4, 37, 46, 40, 3, 30],
        lose: [37, 48, 40, 21, 46],
        pass: [29, 30, 33, 14, 40, 44],
        lock: [50, 35],
        locked: [3, 4, 29, 45, 33]
      }
    }
  };
  const stickerPack = (l) => Object.prototype.hasOwnProperty.call(STICKERS, l) ? l : "";
  function stickerOf(pack, n) {
    const K = STICKERS[stickerPack(pack)];
    n = Math.floor(+n);
    if (!K || !(n >= 1 && n <= K.sizes.length) || K.gone && K.gone.indexOf(n) >= 0) return null;
    return { n, w: K.sizes[n - 1][0], h: K.sizes[n - 1][1], text: K.text[n - 1] || "", src: BASE + "stickers/" + pack + "/" + (n < 10 ? "0" : "") + n + ".webp?v=" + K.v };
  }
  function stickerImg(pack, n, u, parent) {
    const o = stickerOf(pack, n);
    if (!o) return null;
    const k = u / STICKERS[pack].unit, im = h("img", "display:block;width:" + (o.w * k).toFixed(1) + "px;height:" + (o.h * k).toFixed(1) + "px;max-width:none;-webkit-user-select:none;user-select:none;pointer-events:none", parent);
    im.alt = o.text;
    im.draggable = false;
    im.decoding = "async";
    return { im, o, w: o.w * k, h: o.h * k };
  }
  const WINS = [["trophy", "Trophy in the spotlight"], ["crest", "Royal crest"], ["medals", "Gold medals"], ["glass", "Stained glass window"], ["cert", "Certificate with gold seal"]];
  const WF = { serif: "'DM Playfair','Reem Kufi',serif", caps: "'DM Cinzel','Reem Kufi',serif", script: "'DM Pinyon','Reem Kufi',cursive", sans: "'DM Nunito','IBM Plex Sans Arabic',sans-serif" };
  const ART = (() => {
    const TG = [[0, "#a87a22"], [0.3, "#fff0b8"], [0.6, "#e8c36a"], [1, "#8a6410"]], A = {};
    const burst = (cx, cy, n, r1, r2) => {
      const p = [];
      for (let i = 0; i < n * 2; i++) {
        const a = i * Math.PI / n, r = i % 2 ? r2 : r1;
        p.push(+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1));
      }
      return p;
    };
    A.trophy = { w: 360, h: 450, s: [
      ["L", "a", 4, 0, 356, 0, TG],
      ["L", "b", 66, 0, 294, 0, TG],
      ["L", "c", 164, 0, 196, 0, TG],
      ["L", "d", 146, 0, 214, 0, TG],
      ["L", "e", 88, 0, 272, 0, TG],
      ["p", "M74 70C4 70 10 200 106 214M286 70C356 70 350 200 254 214", "", "@a", 16, { cap: 1 }],
      ["p", "M66 40H294C294 190 256 272 180 284C104 272 66 190 66 40Z", "@b"],
      ["e", 180, 40, 114, 16, "#fff0b8"],
      ["e", 180, 42, 98, 10, "#8a6410"],
      ["r", 164, 280, 32, 70, 0, "@c"],
      ["e", 180, 300, 34, 12, "@d"],
      ["p", "M112 350H248L272 404H88Z", "@e"],
      ["r", 66, 404, 228, 42, 8, "@b"],
      ["r", 150, 88, 60, 126, 10, "#7a5a18"],
      ["p", "M158 151H202", "", "#fff0b8", 2]
    ].concat(
      [104, 120, 136, 166, 182, 198].reduce((o, y) => o.concat([["c", 166, y, 5, "#fff0b8"], ["c", 194, y, 5, "#fff0b8"]]), []),
      [["p", "M92 60C96 150 116 220 150 250", "", "#fff", 7, { cap: 1, op: 0.55 }]]
    ) };
    A.laurel = { w: 520, h: 520, s: [[207, 478, -63], [163, 462, -50], [124, 436, -38], [91, 403, -26], [66, 363, -13], [51, 319, 0], [45, 273, 12], [50, 226, 24], [64, 181, 37], [88, 141, 50], [120, 107, 62], [158, 80, 74], [202, 63, 87]].reduce((o, x) => o.concat([["e", x[0], x[1], 15, 40, "#e8c36a", x[2]], ["e", 520 - x[0], x[1], 15, 40, "#e8c36a", -x[2]]]), []) };
    A.crown = { w: 100, h: 70, s: [["p", "M8 62L4 18L30 38L50 8L70 38L96 18L92 62Z", "#e8c36a"], ["c", 50, 10, 7, "#e8c36a"], ["c", 5, 18, 6, "#e8c36a"], ["c", 95, 18, 6, "#e8c36a"], ["r", 8, 56, 84, 10, 3, "#b8892e"]] };
    A.shield = { w: 400, h: 460, s: [
      ["L", "a", 20, 20, 380, 450, [[0, "#8a1a36"], [1, "#3a0817"]]],
      ["p", "M20 20H380V240C380 350 296 420 200 450C104 420 20 350 20 240Z", "@a", "#e8c36a", 12, { join: 1 }],
      ["p", "M46 46H354V238C354 330 284 392 200 420C116 392 46 330 46 238Z", "", "#e8c36a", 2.5],
      ["p", "M200 46V130M46 150H120M354 150H280", "", "#e8c36a", 2.5]
    ] };
    A.banner = { w: 760, h: 130, s: [
      ["p", "M110 40L10 40L46 80L10 120L130 120Z", "#b8892e"],
      ["p", "M650 40L750 40L714 80L750 120L630 120Z", "#b8892e"],
      ["p", "M110 40L130 120L130 100L110 20Z", "#7a5a18"],
      ["p", "M650 40L630 120L630 100L650 20Z", "#7a5a18"],
      ["r", 110, 10, 540, 90, 6, "#e8c36a"],
      ["r", 122, 20, 516, 70, 3, "", "#7a5a18", 2]
    ] };
    A.medal = { w: 320, h: 320, s: [
      ["R", "a", 116, 97, 253, [[0, "#fff5c8"], [0.5, "#e8c36a"], [1, "#9a6e1c"]]],
      ["g", burst(160, 160, 24, 158, 146), "@a"],
      ["c", 160, 160, 124, "", "#8a6410", 4],
      ["c", 160, 160, 114, "", "#8a6410", 1.5, [3, 7]],
      ["p", "M60 110A112 112 0 0 1 130 54", "", "#fff", 8, { cap: 1, op: 0.6 }]
    ] };
    A.seal = { w: 250, h: 330, s: [
      ["R", "a", 96, 81, 183, [[0, "#fff0b8"], [0.55, "#e8c36a"], [1, "#a87a22"]]],
      ["p", "M80 190L60 325L100 295L125 325V190Z", "#b3202e"],
      ["p", "M170 190L190 325L150 295L125 325V190Z", "#8e1823"],
      ["g", burst(125, 125, 20, 122, 108), "@a"],
      ["c", 125, 125, 88, "", "#8a6410", 3],
      ["c", 125, 125, 80, "", "#8a6410", 1.5, [3, 6]]
    ] };
    A.rose = { w: 600, h: 600, s: (() => {
      const C = ["#c0263b", "#2456c9", "#e8a93a", "#1f9d6b", "#7b3fc4", "#2a8fb0"], C2 = ["#e8a93a", "#1f9d6b", "#7b3fc4", "#2a8fb0", "#c0263b", "#2456c9"], out = [["c", 300, 300, 292, "#0b0910", "#e8c36a", 6]];
      const pt = (r, a) => (300 + r * Math.cos(a)).toFixed(1) + " " + (300 + r * Math.sin(a)).toFixed(1);
      for (let i = 0; i < 12; i++) {
        const a0 = -Math.PI / 2 + i * Math.PI / 6, a1 = a0 + Math.PI / 6, am = (a0 + a1) / 2, x = +(300 + 214 * Math.cos(am)).toFixed(1), y = +(300 + 214 * Math.sin(am)).toFixed(1);
        out.push(["p", "M" + pt(150, a0) + "L" + pt(278, a0) + "A278 278 0 0 1 " + pt(278, a1) + "L" + pt(150, a1) + "A150 150 0 0 0 " + pt(150, a0) + "Z", C[i % 6], "#0b0910", 7, { join: 1 }], ["c", x, y, 30, C2[i % 6], "#0b0910", 6], ["c", x, y, 9, "#fff0b8"]);
      }
      return out.concat([["c", 300, 300, 146, "#ffe9a8", "#0b0910", 8], ["c", 300, 300, 128, "", "#b8892e", 3]]);
    })() };
    const lancet = (c) => ({ w: 270, h: 450, s: [
      ["clip", "M12 438V150C12 62 135 12 135 12C135 12 258 62 258 150V438Z", [
        ["r", 0, 0, 135, 160, 0, c[0], "#0b0910", 7],
        ["r", 135, 0, 135, 160, 0, c[1], "#0b0910", 7],
        ["r", 0, 160, 135, 150, 0, c[2], "#0b0910", 7],
        ["r", 135, 160, 135, 150, 0, c[3], "#0b0910", 7],
        ["r", 0, 310, 135, 140, 0, c[4], "#0b0910", 7],
        ["r", 135, 310, 135, 140, 0, c[5], "#0b0910", 7],
        ["c", 135, 235, 92, "#ffe9a8", "#0b0910", 7]
      ]],
      ["p", "M12 438V150C12 62 135 12 135 12C135 12 258 62 258 150V438Z", "", "#e8c36a", 7]
    ] });
    A.lancetA = lancet(["#c0263b", "#2456c9", "#1f9d6b", "#7b3fc4", "#2456c9", "#c0263b"]);
    A.lancetB = lancet(["#2456c9", "#c0263b", "#7b3fc4", "#1f9d6b", "#c0263b", "#2456c9"]);
    A.corner = { w: 110, h: 110, s: [["p", "M6 104V30Q6 6 30 6H104", "", "#b8892e", 4], ["p", "M20 104V40Q20 20 40 20H104", "", "#b8892e", 1.5], ["c", 34, 34, 7, "#b8892e"]] };
    A.spark = { w: 40, h: 40, s: [["p", "M20 0L24 16L40 20L24 24L20 40L16 24L0 20L16 16Z", "#fff0b8"]] };
    A.moon = { w: 100, h: 100, s: [["p", "M68 8A44 44 0 1 0 92 70A36 36 0 1 1 68 8Z", "#e8c36a"]] };
    A.crownInk = (c) => ({ w: 100, h: 70, s: [["p", "M8 62L4 18L30 38L50 8L70 38L96 18L92 62Z", c], ["c", 50, 10, 7, c], ["c", 5, 18, 6, c], ["c", 95, 18, 6, c]] });
    const PIPS2 = [[], [[0, 0]], [[-1, -1], [1, 1]], [[-1, -1], [0, 0], [1, 1]], [[-1, -1], [1, -1], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]];
    A.tile = (a, b) => {
      const s = [["r", 2, 10, 96, 196, 15, "#b9a27a"], ["r", 2, 2, 96, 196, 15, "#fbf5e6", "#d9c79f", 2], ["p", "M14 100H86", "", "#8c7a55", 3, { cap: 1 }], ["c", 50, 100, 5, "#c9a44c"]];
      [[a, 50], [b, 148]].forEach((v) => {
        const dy = v[0] === 6 ? 25 : 22;
        for (const q of PIPS2[v[0]]) s.push(["c", 50 + q[0] * 22, v[1] + q[1] * dy, 8, "#1d1a16"]);
      });
      return { w: 100, h: 208, s };
    };
    A.tileH = (a, b) => {
      const s = [["r", 2, 10, 196, 96, 15, "#b9a27a"], ["r", 2, 2, 196, 96, 15, "#fbf5e6", "#d9c79f", 2], ["p", "M100 14V86", "", "#8c7a55", 3, { cap: 1 }], ["c", 100, 50, 5, "#c9a44c"]];
      [[a, 50], [b, 148]].forEach((v) => {
        const dx = v[0] === 6 ? 25 : 22;
        for (const q of PIPS2[v[0]]) s.push(["c", v[1] + q[1] * dx, 50 - q[0] * 22, 8, "#1d1a16"]);
      });
      return { w: 200, h: 108, s };
    };
    return A;
  })();
  let ARTN = 0;
  function artSvg(a, w, css2) {
    const u = "dw" + ++ARTN + "-", col = (v) => !v ? "none" : v[0] === "@" ? "url(#" + u + v.slice(1) + ")" : v;
    const stops = (s) => s.map((x) => '<stop offset="' + x[0] + '" stop-color="' + x[1] + '"/>').join("");
    let defs = "";
    const paint = (x) => ' fill="' + col(x.f) + '"' + (x.s ? ' stroke="' + col(x.s) + '" stroke-width="' + (x.w || 1) + '"' : "");
    const one = (x) => {
      const k = x[0];
      if (k === "L") {
        defs += '<linearGradient id="' + u + x[1] + '" gradientUnits="userSpaceOnUse" x1="' + x[2] + '" y1="' + x[3] + '" x2="' + x[4] + '" y2="' + x[5] + '">' + stops(x[6]) + "</linearGradient>";
        return "";
      }
      if (k === "R") {
        defs += '<radialGradient id="' + u + x[1] + '" gradientUnits="userSpaceOnUse" cx="' + x[2] + '" cy="' + x[3] + '" r="' + x[4] + '">' + stops(x[5]) + "</radialGradient>";
        return "";
      }
      if (k === "p") {
        const m = x[5] || {};
        return '<path d="' + x[1] + '"' + paint({ f: x[2], s: x[3], w: x[4] }) + (m.cap ? ' stroke-linecap="round"' : "") + (m.join ? ' stroke-linejoin="round"' : "") + (m.op ? ' opacity="' + m.op + '"' : "") + "/>";
      }
      if (k === "c") return '<circle cx="' + x[1] + '" cy="' + x[2] + '" r="' + x[3] + '"' + paint({ f: x[4], s: x[5], w: x[6] }) + (x[7] ? ' stroke-dasharray="' + x[7].join(" ") + '"' : "") + "/>";
      if (k === "e") return '<ellipse cx="' + x[1] + '" cy="' + x[2] + '" rx="' + x[3] + '" ry="' + x[4] + '"' + paint({ f: x[5] }) + (x[6] ? ' transform="rotate(' + x[6] + " " + x[1] + " " + x[2] + ')"' : "") + "/>";
      if (k === "r") return '<rect x="' + x[1] + '" y="' + x[2] + '" width="' + x[3] + '" height="' + x[4] + '"' + (x[5] ? ' rx="' + x[5] + '"' : "") + paint({ f: x[6], s: x[7], w: x[8] }) + "/>";
      if (k === "g") return '<polygon points="' + x[1].join(" ") + '"' + paint({ f: x[2] }) + "/>";
      if (k === "clip") {
        defs += '<clipPath id="' + u + 'k"><path d="' + x[1] + '"/></clipPath>';
        return '<g clip-path="url(#' + u + 'k)">' + x[2].map(one).join("") + "</g>";
      }
      return "";
    };
    const body = a.s.map(one).join("");
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + (w * a.h / a.w).toFixed(1) + '" viewBox="0 0 ' + a.w + " " + a.h + '" aria-hidden="true" style="display:block;overflow:visible;' + (css2 || "") + '">' + (defs ? "<defs>" + defs + "</defs>" : "") + body + "</svg>";
  }
  function artDraw(g, a, x, y, w) {
    const k = w / a.w, G = {};
    const col = (v) => v[0] === "@" ? G[v.slice(1)] : v;
    const grad2 = (gr, st) => {
      for (const s of st) gr.addColorStop(s[0], s[1]);
      return gr;
    };
    const paint = (f, s, sw, dash, m) => {
      m = m || {};
      if (m.op) g.globalAlpha = m.op;
      if (f) {
        g.fillStyle = col(f);
        g.fill();
      }
      if (s) {
        g.strokeStyle = col(s);
        g.lineWidth = sw || 1;
        g.lineCap = m.cap ? "round" : "butt";
        g.lineJoin = m.join ? "round" : "miter";
        g.setLineDash(dash || []);
        g.stroke();
        g.setLineDash([]);
      }
      g.globalAlpha = 1;
    };
    const rr = (x0, y0, w0, h0, r) => {
      g.beginPath();
      if (!r) {
        g.rect(x0, y0, w0, h0);
        return;
      }
      g.moveTo(x0 + r, y0);
      g.arcTo(x0 + w0, y0, x0 + w0, y0 + h0, r);
      g.arcTo(x0 + w0, y0 + h0, x0, y0 + h0, r);
      g.arcTo(x0, y0 + h0, x0, y0, r);
      g.arcTo(x0, y0, x0 + w0, y0, r);
      g.closePath();
    };
    const one = (q) => {
      const t2 = q[0];
      if (t2 === "L") G[q[1]] = grad2(g.createLinearGradient(q[2], q[3], q[4], q[5]), q[6]);
      else if (t2 === "R") G[q[1]] = grad2(g.createRadialGradient(q[2], q[3], 0, q[2], q[3], q[4]), q[5]);
      else if (t2 === "p") {
        const P2 = new Path2D(q[1]), m = q[5] || {};
        if (m.op) g.globalAlpha = m.op;
        if (q[2]) {
          g.fillStyle = col(q[2]);
          g.fill(P2);
        }
        if (q[3]) {
          g.strokeStyle = col(q[3]);
          g.lineWidth = q[4] || 1;
          g.lineCap = m.cap ? "round" : "butt";
          g.lineJoin = m.join ? "round" : "miter";
          g.stroke(P2);
        }
        g.globalAlpha = 1;
      } else if (t2 === "c") {
        g.beginPath();
        g.arc(q[1], q[2], q[3], 0, Math.PI * 2);
        paint(q[4], q[5], q[6], q[7]);
      } else if (t2 === "e") {
        g.beginPath();
        g.ellipse(q[1], q[2], q[3], q[4], (q[6] || 0) * Math.PI / 180, 0, Math.PI * 2);
        paint(q[5]);
      } else if (t2 === "r") {
        rr(q[1], q[2], q[3], q[4], q[5]);
        paint(q[6], q[7], q[8]);
      } else if (t2 === "g") {
        g.beginPath();
        for (let i = 0; i < q[1].length; i += 2) {
          if (i) g.lineTo(q[1][i], q[1][i + 1]);
          else g.moveTo(q[1][i], q[1][i + 1]);
        }
        g.closePath();
        paint(q[2]);
      } else if (t2 === "clip") {
        g.save();
        g.clip(new Path2D(q[1]));
        q[2].forEach(one);
        g.restore();
      }
    };
    g.save();
    g.translate(x, y);
    g.scale(k, k);
    a.s.forEach(one);
    g.restore();
  }
  const BRAND = BASE + "../go/icon-192.png";
  const BOO_PIC = /^data:image\/svg/;
  const BOT_BOOS = ["boo:hi", "boo:laugh", "boo:cool", "boo:love", "boo:wow", "boo:party", "boo:hero", "boo:legend"];
  const botBoo = (name) => {
    let n = 0;
    const s = String(name == null ? "" : name);
    for (let i = 0; i < s.length; i++) n = n * 31 + s.charCodeAt(i) >>> 0;
    return BOT_BOOS[n % BOT_BOOS.length];
  };
  const winFaces = (fx) => ['900 60px "DM Playfair"', '700 40px "DM Playfair"', 'italic 700 40px "DM Playfair"', '800 22px "DM Nunito"'].concat(fx === "glass" || fx === "cert" || fx === "crest" || fx === "medals" ? ['900 40px "DM Cinzel"', '700 30px "DM Cinzel"'] : [], fx === "cert" ? ['400 60px "DM Pinyon"'] : []);
  function winFonts(fx, sample) {
    css();
    const faces = winFaces(fx).concat(['700 40px "Reem Kufi"', '600 30px "IBM Plex Sans Arabic"']), text = "Aa1" + (sample || "");
    const all = Promise.all(faces.map((f) => {
      try {
        return document.fonts.load(f, text).catch(() => 0);
      } catch (e) {
        return 0;
      }
    }));
    return Promise.race([all, new Promise((r) => setTimeout(r, 2500))]);
  }
  function winScene(W) {
    css();
    const F = WF, rtl = !!W.rtl, two = W.who.length > 1, names = W.who.join(" + "), ini = W.who.map((n) => (String(n).trim()[0] || "?").toUpperCase());
    const fx = WINS.some((x) => x[0] === W.fx) ? W.fx : "trophy";
    const BG = {
      trophy: ["#010f10", "radial-gradient(ellipse 50% 55% at 50% 38%,#0f5a55,rgba(15,90,85,0) 75%),linear-gradient(180deg,#04282a,#010f10)"],
      crest: ["#22050e", "radial-gradient(ellipse 65% 60% at 50% 40%,#8a1a36,rgba(138,26,54,0) 75%),linear-gradient(180deg,#4a0b1e,#22050e)"],
      medals: ["#050916", "radial-gradient(ellipse 60% 55% at 50% 38%,#24408a,rgba(36,64,138,0) 75%),linear-gradient(180deg,#0e1838,#050916)"],
      glass: ["#0d0a14", "radial-gradient(ellipse 60% 55% at 50% 32%,#3a2a55,rgba(58,42,85,0) 75%),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 2px,rgba(255,255,255,0) 2px,rgba(255,255,255,0) 90px),repeating-linear-gradient(90deg,rgba(255,255,255,.025) 0px,rgba(255,255,255,.025) 2px,rgba(255,255,255,0) 2px,rgba(255,255,255,0) 180px),#0d0a14"],
      cert: ["#03201e", "radial-gradient(ellipse 65% 60% at 50% 45%,#0f6a60,rgba(15,106,96,0) 75%),linear-gradient(180deg,#073a36,#03201e)"]
    }[fx];
    const st = h("div", "position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;direction:ltr;font-variant-numeric:lining-nums;font-family:" + F.sans + ";color:#fff;background:" + BG[1]);
    st.className = "dmn-win";
    st.dataset.fx = fx;
    st.dataset.bg = BG[0];
    const fits = [];
    const at = (x, y, c, parent) => h("div", "position:absolute;left:" + x + "px;top:" + y + "px;" + (c || ""), parent || st);
    const txt = (parent, c, text, max, name) => {
      const e = h("div", c, parent), s = max ? h("span", "display:inline-block;white-space:nowrap", e, text) : e;
      if (!max) e.textContent = text;
      if (name) s.dir = "auto";
      else if (rtl) s.style.direction = "rtl";
      if (max) fits.push([e, s, max]);
      return e;
    };
    const art = (parent, a, w, c) => {
      const e = h("div", c || "", parent);
      e.innerHTML = artSvg(a, w);
      return e;
    };
    const shade = (v) => "-webkit-filter:" + v + ";filter:" + v;
    const caps = (v) => rtl ? "" : ";text-transform:uppercase;letter-spacing:" + v;
    const lbl = (px2) => "font-size:" + (rtl ? Math.round(px2 * 1.3) : px2) + "px;line-height:1.25;font-weight:800";
    const serif = (w, s, more) => "font-family:" + F.serif + ";font-weight:" + w + ";font-size:" + s + "px;" + (more || "");
    const ital = rtl ? "" : "font-style:italic;";
    const tw = (x, y, s, dur, del) => art(at(x, y), ART.spark, s, "animation:dwTw " + dur + "s ease-in-out " + del + "s infinite");
    const frame = (a) => at(22, 22, "width:1872px;height:1032px;border:2px solid rgba(232,195,106," + a + ");border-radius:18px;pointer-events:none");
    const foot = (y, color, on) => {
      const e = txt(at(0, y, "width:1920px;text-align:center"), "font-size:26px;font-weight:700;color:" + color, t("The host can start a new game from their phone."), 1500);
      if (on) {
        e.firstChild.style.padding = "0 18px";
        e.firstChild.style.background = on;
      }
      return e;
    };
    const brand = (color, x, y) => {
      const b = at(x == null ? 56 : x, y == null ? 46 : y, "display:flex;align-items:center;direction:ltr");
      const im = h("img", "display:block;width:46px;height:46px;border-radius:11px;box-shadow:0 4px 10px rgba(0,0,0,.35)", b);
      im.alt = "";
      im.src = BRAND;
      h("div", "margin-left:14px;font-family:" + F.sans + ";font-weight:800;font-size:30px;line-height:1;color:" + color, b, "Blokvane");
      return b;
    };
    const FACT = {
      first: () => [t("First to"), String(W.target)],
      score: () => [t("Final score"), t("{a} to {b}", { a: W.sa, b: W.sb })],
      rounds: () => [t("Rounds won"), t("{a} of {b}", { a: W.won, b: W.rounds })],
      big: () => [t("Biggest round"), t("{n} points", { n: W.big })],
      runners: () => [t(W.many ? "Runners up" : "Runner up"), W.runners, 1]
    };
    const bar = (y, bg, keys) => {
      const b = at(360, y, "width:1200px;height:112px;box-sizing:border-box;border-radius:20px;background:" + bg + ";border:2px solid #e8c36a;display:flex;align-items:center;flex-direction:" + (rtl ? "row-reverse" : "row"));
      keys.forEach((k, i) => {
        const c = FACT[k]();
        if (i) h("div", "flex:none;width:2px;height:66px;background:rgba(232,195,106,.5)", b);
        const cell = h("div", "flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center", b);
        txt(cell, lbl(22) + ";color:#e8c36a" + caps(".2em"), c[0], 360);
        txt(cell, serif(700, 40, "line-height:1.25;color:#fff6e0"), c[1], 360, c[2]);
      });
    };
    const AR_LETTER = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFC]/;
    const letterOf = (box, c, ch) => {
      const e = h("div", c, box, ch);
      if (AR_LETTER.test(ch)) {
        e.style.lineHeight = "1.3";
        e.style.marginTop = "-0.36em";
      }
      return e;
    };
    const picOf = (i) => W.pics && typeof W.pics[i] === "string" ? W.pics[i] : "";
    const seat = (box, i, size, letter, ink) => {
      if (i >= W.who.length) {
        art(box, ink ? ART.crownInk(ink) : ART.crown, Math.round(size * 0.62));
        return;
      }
      const src = picOf(i);
      if (!src) {
        letterOf(box, letter, ini[i]);
        return;
      }
      const wrap = h("div", "flex:none;width:" + size + "px;height:" + size + "px;border-radius:50%;overflow:hidden", box);
      const im = h("img", BOO_PIC.test(src) ? "display:block;width:128%;height:128%;max-width:none;margin:-2% 0 0 -8%" : "display:block;width:100%;height:100%;object-fit:cover", wrap);
      im.alt = "";
      im.src = src;
    };
    const who = (i) => i < W.who.length ? W.who[i] : t("Champion");
    const wreath = (x, y, size, ring, bw, bgc, i, nameCss) => {
      const b = at(x, y, "width:" + size + "px");
      const box = h("div", "position:relative;width:" + size + "px;height:" + size + "px", b);
      art(box, ART.laurel, size, "position:absolute;left:0;top:0;" + shade("drop-shadow(0 6px 10px rgba(0,0,0,.4))"));
      const c = h("div", "position:absolute;left:50%;top:50%;width:" + ring + "px;height:" + ring + "px;margin:" + -ring / 2 + "px 0 0 " + -ring / 2 + "px;border-radius:50%;background:" + bgc + ";box-sizing:border-box;border:" + bw + "px solid #e8c36a;display:flex;align-items:center;justify-content:center;overflow:hidden", box);
      seat(c, i, ring - 2 * bw, serif(700, Math.round(ring / 2), "line-height:1;color:#fff6e0"));
      txt(b, nameCss + ";text-align:center", who(i), size, i < W.who.length);
    };
    if (fx === "trophy") {
      [[520, 7], [1400, 8]].forEach((x) => at(x[0], -60, "width:520px;height:1100px;margin-left:-260px;background:linear-gradient(180deg,rgba(255,244,200,.34),rgba(255,244,200,0) 85%);-webkit-clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);transform-origin:50% 0;animation:dwSweep " + x[1] + "s ease-in-out infinite;pointer-events:none"));
      frame(0.4);
      txt(at(0, 44, "width:1920px;text-align:center"), serif(700, 62, ital + "color:#e8c36a"), t(two ? "Champions of the table" : "Champion of the table"), 1300);
      art(at(760, 130, "animation:dwBob 4s ease-in-out infinite"), ART.trophy, 400, shade("drop-shadow(0 0 40px rgba(232,195,106,.45))"));
      [[720, 170, 46, 0], [1150, 140, 34, 0.7], [1180, 420, 42, 1.3], [700, 460, 30, 0.4], [930, 110, 26, 1.8]].forEach((x) => tw(x[0], x[1], x[2], 2.4, x[3]));
      const pl = at(610, 626, "width:700px;height:150px;box-sizing:border-box;border-radius:10px 10px 0 0;background:linear-gradient(180deg,#143c3e,#062022);border:2px solid rgba(232,195,106,.5);border-bottom:none;display:flex;align-items:center;justify-content:center;box-shadow:0 30px 50px rgba(0,0,0,.5)");
      txt(h("div", "max-width:640px;box-sizing:border-box;padding:6px 40px;border-radius:8px;background:linear-gradient(180deg,#fff0b8,#e8c36a 55%,#b8892e)", pl), serif(900, 66, "line-height:1.2;color:#1d1a16"), names, 560, 1);
      at(570, 776, "width:780px;height:16px;border-radius:4px;background:linear-gradient(180deg,#e8c36a,#8a6410)");
      wreath(190, 230, 340, 196, 8, "#04282a", 0, serif(900, 62, "line-height:1.05;color:#fff6e0"));
      wreath(1390, 230, 340, 196, 8, "#04282a", 1, serif(900, 62, "line-height:1.05;color:#fff6e0"));
      const sc = h("div", serif(900, 84, "line-height:1.2;color:#fff6e0;white-space:nowrap" + (rtl ? ";direction:rtl" : "")), at(0, 800, "width:1920px;text-align:center"));
      h("span", "", sc, String(W.sa));
      h("span", ital + "font-weight:700;font-size:52px;color:#e8c36a;margin:0 22px", sc, t("to"));
      h("span", "", sc, String(W.sb));
      bar(912, "rgba(2,20,22,.7)", ["first", "rounds", "runners"]);
      foot(1036, "#cfe6de", "#010f10");
      brand("#fff6e0");
    } else if (fx === "crest") {
      h("div", "position:absolute;left:0;top:0;right:0;bottom:0;background:radial-gradient(rgba(255,255,255,.04) 1px,rgba(255,255,255,0) 1px);background-size:6px 6px;pointer-events:none", st);
      const cf = h("div", "position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none", st), CC = ["#fff6e0", "#f3dc9c", "#e8c36a", "#b8892e"];
      let r = 7;
      const rnd = () => {
        r = r * 16807 % 2147483647;
        return r / 2147483647;
      };
      for (let i = 0; i < 44; i++) h("span", "position:absolute;left:" + Math.round(rnd() * 1880) + "px;top:-40px;width:" + [14, 18, 22][Math.floor(rnd() * 3)] + "px;height:" + (rnd() < 0.5 ? 10 : 26) + "px;border-radius:" + (rnd() < 0.4 ? 50 : 2) + "px;background:" + CC[Math.floor(rnd() * 4)] + ";animation:dwFall " + (5.2 + rnd() * 4.6).toFixed(1) + "s linear " + (-rnd() * 9.5).toFixed(1) + "s infinite", cf);
      frame(0.45);
      art(at(644, 196, "transform:rotate(-16deg)"), ART.tile(6, 6), 92);
      art(at(1184, 196, "transform:rotate(16deg)"), ART.tile(5, 5), 92);
      art(at(760, 130), ART.shield, 400, shade("drop-shadow(0 20px 30px rgba(0,0,0,.5))"));
      art(at(888, 52, "animation:dwBob 3s ease-in-out infinite"), ART.crown, 144, shade("drop-shadow(0 4px 6px rgba(0,0,0,.4))"));
      const sh = at(760, 236, "width:400px;text-align:center");
      txt(sh, lbl(22) + ";color:#f3dc9c" + caps(".3em"), t("First to"), 300);
      txt(sh, serif(900, 150, "line-height:1.05;color:#e8c36a;text-shadow:0 5px 0 rgba(0,0,0,.4)"), String(W.target), 290);
      art(at(580, 508), ART.banner, 760, shade("drop-shadow(0 10px 14px rgba(0,0,0,.45))"));
      txt(at(580, 524, "width:760px;text-align:center"), "font-family:" + F.caps + ";font-weight:900;font-size:58px;color:#3a0817" + caps(".16em"), t(two ? "Champions" : "Champion"), 500);
      wreath(250, 230, 300, 170, 7, "#3a0817", 0, serif(900, 60, "line-height:1.1;color:#fff6e0"));
      wreath(1370, 230, 300, 170, 7, "#3a0817", 1, serif(900, 60, "line-height:1.1;color:#fff6e0"));
      const nm = at(0, 650, "width:1920px;text-align:center");
      txt(nm, serif(900, 116, "line-height:1.1;color:#fff6e0;text-shadow:0 5px 0 rgba(0,0,0,.4)"), names, 1500, 1);
      txt(nm, serif(700, 46, ital + "color:#e8c36a"), t(two ? "rule the table" : "rules the table"), 1200);
      bar(880, "rgba(0,0,0,.35)", ["score", "rounds", "runners"]);
      foot(1008, "#e9dcc0");
      brand("#fff6e0");
    } else if (fx === "medals") {
      [
        [1315, 301, 30, 2.7, 2.1],
        [1763, 582, 16, 3.7, 2.3],
        [550, 93, 16, 2.2, 1.4],
        [544, 429, 30, 2.2, 0.7],
        [1537, 261, 22, 2.6, 2.7],
        [1608, 438, 16, 3.5, 0.2],
        [1305, 495, 16, 2.3, 2.9],
        [50, 254, 16, 3.9, 0.5],
        [380, 336, 22, 3.9, 1.6],
        [1428, 249, 16, 3.9, 2.1],
        [1870, 432, 22, 2, 1.2],
        [338, 310, 16, 2.7, 2.5],
        [1240, 43, 30, 3.4, 1],
        [674, 403, 22, 3, 0.9],
        [1025, 523, 30, 2.4, 0.8],
        [86, 406, 22, 2, 2.4],
        [789, 425, 30, 3.7, 1.4],
        [1489, 225, 30, 3.9, 0.6],
        [1587, 291, 22, 2.7, 1.1],
        [1114, 296, 22, 2.2, 2.2],
        [1672, 416, 22, 2.1, 2.8],
        [226, 253, 22, 3, 1.1]
      ].forEach((x) => tw(x[0], x[1], x[2], x[3], x[4]));
      frame(0.4);
      const RIB = (c) => "linear-gradient(90deg," + c[0] + " 0%," + c[0] + " 22%,#fff6e0 22%,#fff6e0 30%," + c[1] + " 30%," + c[1] + " 70%,#fff6e0 70%,#fff6e0 78%," + c[0] + " 78%," + c[0] + " 100%)";
      const medal = (x, i, cols, dur) => {
        const m = at(x, -20, "width:320px;display:flex;flex-direction:column;align-items:center;transform-origin:50% 0;animation:dwSway " + dur + "s ease-in-out infinite");
        h("div", "width:140px;height:330px;background:" + RIB(cols) + ";box-shadow:0 10px 20px rgba(0,0,0,.4)", m);
        h("div", "width:76px;height:44px;margin-top:-6px;border:10px solid #e8c36a;border-radius:14px;box-sizing:border-box", m);
        const d = h("div", "position:relative;width:320px;height:320px;margin-top:-16px;" + shade("drop-shadow(0 20px 26px rgba(0,0,0,.55))"), m);
        art(d, ART.medal, 320, "position:absolute;left:0;top:0");
        const f = h("div", "position:absolute;left:0;top:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center", d);
        if (picOf(i)) {
          const ring = h("div", "flex:none;margin:6px 0 8px;width:148px;height:148px;border-radius:50%;box-sizing:border-box;border:4px solid #8a6410;background:#fff5c8;overflow:hidden;box-shadow:0 2px 0 #fff0b8", f);
          seat(ring, i, 140, "");
        } else letterOf(f, serif(900, 150, "line-height:1;color:#6b4c0e;text-shadow:0 2px 0 #fff0b8"), ini[i]);
        txt(f, "font-family:" + F.caps + ";font-weight:900;font-size:22px;color:#6b4c0e" + caps(".2em"), t("Champion"), 190);
        txt(m, serif(900, 58, "margin-top:14px;line-height:1.1;color:#fff6e0"), W.who[i], 400, 1);
      };
      if (two) {
        medal(520, 0, ["#b3202e", "#7a1220"], 5);
        medal(1080, 1, ["#1f8a85", "#0d4f4c"], 6);
        txt(at(900, 400, "width:120px;text-align:center"), serif(900, 120, "line-height:1;color:#e8c36a"), "+");
      } else medal(800, 0, ["#b3202e", "#7a1220"], 5);
      const l = at(110, 250, "width:330px;text-align:center");
      txt(l, lbl(22) + ";color:#c9d4f5" + caps(".3em"), t("First to"), 330);
      txt(l, serif(900, 150, "line-height:1.05;color:#e8c36a;text-shadow:0 5px 0 rgba(0,0,0,.4)"), String(W.target), 330);
      h("div", "margin:6px auto 0;width:160px;height:3px;background:#e8c36a", l);
      const rr = at(1480, 250, "width:330px;text-align:center");
      txt(rr, lbl(22) + ";color:#c9d4f5" + caps(".3em"), t("Final score"), 330);
      txt(rr, serif(900, 150, "line-height:1.05;color:#fff6e0;text-shadow:0 5px 0 rgba(0,0,0,.4)"), String(W.sa), 330);
      txt(rr, serif(700, 48, ital + "color:#e8c36a"), t("to") + " " + W.sb, 330);
      txt(at(0, 744, "width:1920px;text-align:center"), serif(900, 104, "line-height:1.15;color:#fff6e0;text-shadow:0 5px 0 rgba(0,0,0,.4)"), t("Gold for {names}", { names }), 1700, 1);
      bar(888, "rgba(5,9,24,.7)", ["rounds", "big", "runners"]);
      foot(1014, "#c9d4f5");
      brand("#fff6e0");
    } else if (fx === "glass") {
      frame(0.4);
      const rose = at(660, 50, "width:600px;height:600px");
      h("div", "position:absolute;left:40px;top:40px;right:40px;bottom:40px;border-radius:50%;background:radial-gradient(#7b3fc4,#2456c9 45%,#c0263b 75%);background:conic-gradient(#c0263b,#e8a93a,#1f9d6b,#2456c9,#7b3fc4,#c0263b);" + shade("blur(60px)") + ";opacity:.7;animation:dwGlint 5s ease-in-out infinite", rose);
      art(rose, ART.rose, 600, "position:absolute;left:0;top:0");
      const mid = h("div", "position:absolute;left:0;top:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center", rose);
      txt(mid, "font-family:" + F.caps + ";font-weight:700;font-size:22px;color:#5a3d08" + caps(".3em"), t("First to"), 230);
      txt(mid, "font-family:" + F.caps + ";font-weight:900;font-size:112px;line-height:1.05;color:#3a2606", String(W.target), 240);
      const lancet = (x, i, a, glow) => {
        const b = at(x, 150, "width:270px");
        const box = h("div", "position:relative;width:270px;height:450px", b);
        art(box, a, 270, shade("drop-shadow(0 0 30px " + glow + ")"));
        const c = h("div", "position:absolute;left:43px;top:143px;width:184px;height:184px;border-radius:50%;display:flex;align-items:center;justify-content:center", box);
        seat(c, i, 156, "font-family:" + F.caps + ";font-weight:900;font-size:130px;line-height:1;color:#3a2606", "#3a2606");
        txt(b, "margin-top:10px;text-align:center;font-family:" + F.caps + ";font-weight:900;font-size:50px;line-height:1.1;color:#fff6e0" + caps(".08em"), who(i), 330, i < W.who.length);
      };
      lancet(270, 0, ART.lancetA, "#c0263b");
      lancet(1380, 1, ART.lancetB, "#2456c9");
      const nm = at(0, 668, "width:1920px;text-align:center");
      txt(nm, "font-family:" + F.caps + ";font-weight:700;font-size:34px;color:#e8c36a" + caps(".42em"), t(two ? "The champions" : "The champion"), 1400);
      txt(nm, serif(900, 112, "line-height:1.15;color:#fff6e0;text-shadow:0 5px 0 rgba(0,0,0,.5)"), names, 1500, 1);
      bar(876, "rgba(11,9,16,.75)", ["score", "rounds", "runners"]);
      foot(1006, "#e9dcc0");
      brand("#fff6e0");
    } else {
      h("div", "position:absolute;left:0;top:0;right:0;bottom:0;background:radial-gradient(rgba(255,255,255,.035) 1px,rgba(255,255,255,0) 1px);background-size:6px 6px;pointer-events:none", st);
      const tsh = shade("drop-shadow(0 16px 14px rgba(0,0,0,.45))");
      art(at(60, 700, "transform:rotate(-24deg);" + tsh), ART.tile(6, 4), 96);
      art(at(1730, 90, "transform:rotate(20deg);" + tsh), ART.tile(5, 5), 96);
      art(at(1700, 640, "transform:rotate(-12deg);" + tsh), ART.tileH(1, 5), 192);
      const pp = at(250, 40, "width:1420px;height:950px;box-sizing:border-box;background:radial-gradient(ellipse at 50% 30%,#fffaf0,#f3e7c8);border-radius:10px;box-shadow:0 40px 80px rgba(0,0,0,.55);transform:rotate(-1deg)");
      h("div", "position:absolute;left:26px;top:26px;right:26px;bottom:26px;border:3px solid #b8892e", pp);
      h("div", "position:absolute;left:36px;top:36px;right:36px;bottom:36px;border:1px solid #b8892e", pp);
      [["left:44px;top:44px", 0], ["right:44px;top:44px", 90], ["right:44px;bottom:44px", 180], ["left:44px;bottom:44px", 270]].forEach((x) => art(pp, ART.corner, 110, "position:absolute;" + x[0] + ";transform:rotate(" + x[1] + "deg)"));
      const col = h("div", "position:absolute;left:0;top:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;padding-top:76px;color:#1d1a16", pp);
      txt(col, "font-family:" + F.caps + ";font-weight:900;font-size:50px;color:#8a6410" + caps(".2em"), t("Certificate of victory"), 1100);
      txt(col, serif(700, 36, ital + "margin-top:4px"), t("Dominoes 151"), 700);
      txt(col, "margin-top:26px;font-size:28px;font-weight:700;color:#5c5340", t("This certifies that"), 900);
      txt(col, "font-family:" + F.script + ";font-size:170px;line-height:1.1;padding:0 30px", names, 1180, 1);
      h("div", "flex:none;width:780px;height:3px;background:linear-gradient(90deg,rgba(184,137,46,0),#b8892e,rgba(184,137,46,0))", col);
      h("div", serif(700, 38, "margin-top:22px;width:1000px;text-align:center;line-height:1.35" + (rtl ? ";direction:rtl" : "")), col, t(two ? "are the champions of the table, first to {n}, with a final score of {a} to {b}." : "is the champion of the table, first to {n}, with a final score of {a} to {b}.", { n: W.target, a: W.sa, b: W.sb }));
      const row = h("div", "margin-top:34px;width:1180px;display:flex;align-items:flex-start;justify-content:space-between;flex-direction:" + (rtl ? "row-reverse" : "row"), col);
      const sig = (big, small, name) => {
        const b = h("div", "width:380px;text-align:center", row);
        txt(b, "font-family:" + F.script + ";font-size:66px;line-height:1.1;color:#1d1a16", big, 372, name);
        h("div", "margin:2px auto 8px;width:340px;height:2px;background:#1d1a16", b);
        h("div", lbl(22) + ";color:#6b5a2a" + caps(".06em") + (rtl ? ";direction:rtl" : ""), b, small);
      };
      sig(W.runners, t(W.many ? "Witnessed by the runners up, {n}" : "Witnessed by the runner up, {n}", { n: W.sb }), 1);
      const sl = h("div", "position:relative;margin-top:-16px;flex:none", row);
      art(sl, ART.seal, 250, shade("drop-shadow(0 10px 12px rgba(0,0,0,.3))"));
      txt(h("div", "position:absolute;left:0;top:76px;width:250px;text-align:center", sl), serif(900, 78, "line-height:1.2;color:#6b4c0e"), String(W.target), 150);
      sig(t("{a} of {b} rounds", { a: W.won, b: W.rounds }), t("Biggest round: {n} points", { n: W.big }));
      const disc = (x, y, rot, i) => {
        const d = at(x, y, "width:150px;height:150px;border-radius:50%;background:#0a4640;border:6px solid #e8c36a;box-sizing:border-box;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 10px 20px rgba(0,0,0,.35);transform:rotate(" + rot + "deg)");
        seat(d, i, 138, serif(700, 75, "line-height:1;color:#fff6e0"));
      };
      disc(336, 150, -6, 0);
      disc(1434, 128, 5, 1);
      foot(1036, "#cfe6de");
      brand("#fff6e0", 56, 1004);
    }
    const fit = () => {
      for (const x of fits) {
        const e = x[0];
        if (!e.dataset.fs) e.dataset.fs = String(parseFloat(e.style.fontSize) || parseFloat(getComputedStyle(e).fontSize) || 0);
        const base = +e.dataset.fs;
        if (!base) continue;
        e.style.fontSize = base + "px";
        const w = x[1].offsetWidth;
        if (w > x[2]) e.style.fontSize = Math.max(12, Math.floor(base * x[2] / w)) + "px";
      }
    };
    return { el: st, fit, bg: BG[0] };
  }
  function winPoster(g, W, icon) {
    const CW = 1080, CH = 1920, F = WF, rtl = !!W.rtl, two = W.who.length > 1, names = W.who.join(" + ");
    const fx = WINS.some((x) => x[0] === W.fx) ? W.fx : "trophy";
    const AR_CH = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-ﻼ]/;
    const ini = W.who.map((n) => (String(n).trim()[0] || "?").toUpperCase());
    const font = (fam, wt, px2, it) => (it && !rtl ? "italic " : "") + wt + " " + px2 + "px " + fam;
    const serif = (wt, px2, it) => font(F.serif, wt, px2, it), caps = (wt, px2) => font(F.caps, wt, px2), sans = (wt, px2) => font(F.sans, wt, px2), script = (px2) => font(F.script, 400, px2);
    try {
      g.direction = rtl ? "rtl" : "ltr";
    } catch (e) {
    }
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    const rr = (x, y, w, h2, r) => {
      g.beginPath();
      g.moveTo(x + r, y);
      g.arcTo(x + w, y, x + w, y + h2, r);
      g.arcTo(x + w, y + h2, x, y + h2, r);
      g.arcTo(x, y + h2, x, y, r);
      g.arcTo(x, y, x + w, y, r);
      g.closePath();
    };
    const lin = (x0, y0, x1, y1, st) => {
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      for (const s of st) gr.addColorStop(s[0], s[1]);
      return gr;
    };
    const glow = (cx, cy, rx, ry, c0, c1) => {
      g.save();
      g.translate(cx, cy);
      g.scale(1, ry / rx);
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
      gr.addColorStop(0, c0);
      gr.addColorStop(0.75, c1);
      gr.addColorStop(1, c1);
      g.fillStyle = gr;
      g.fillRect(-rx, -rx, 2 * rx, 2 * rx);
      g.restore();
    };
    const back2 = (c0, c1) => {
      g.fillStyle = lin(0, 0, 0, CH, [[0, c0], [1, c1]]);
      g.fillRect(0, 0, CW, CH);
    };
    const dots = (a) => {
      g.fillStyle = "rgba(255,255,255," + a + ")";
      for (let y = 3; y < CH; y += 7) for (let x = 3 + y % 2; x < CW; x += 7) g.fillRect(x, y, 1.4, 1.4);
    };
    const frame = (a) => {
      rr(26, 26, CW - 52, CH - 52, 22);
      g.strokeStyle = "rgba(232,195,106," + a + ")";
      g.lineWidth = 2.5;
      g.stroke();
    };
    const fitFont = (text, max, px2, mk) => {
      let s = px2;
      g.font = mk(s);
      while (max && s > 14 && g.measureText(text).width > max) {
        s -= 2;
        g.font = mk(s);
      }
      return s;
    };
    const line = (text, x, y, max, px2, mk, color, o) => {
      text = String(text);
      const s = fitFont(text, max, px2, mk);
      if (o && o.shade) {
        g.fillStyle = o.shade;
        g.fillText(text, x, y + Math.max(3, s * 0.045));
      }
      g.fillStyle = color;
      g.fillText(text, x, y);
      return s;
    };
    const label = (text, x, y, px2, color, gap, max, mk) => {
      text = String(text);
      mk = mk || ((s2) => sans(800, s2));
      if (rtl || AR_CH.test(text)) {
        line(text, x, y, max, Math.round(px2 * 1.3), mk, color);
        return;
      }
      text = text.toUpperCase();
      let s = px2, sp, w;
      const measure = () => {
        g.font = mk(s);
        sp = s * gap;
        w = -sp;
        for (const ch of text) w += g.measureText(ch).width + sp;
      };
      measure();
      while (max && w > max && s > 12) {
        s -= 1;
        measure();
      }
      g.fillStyle = color;
      g.textAlign = "left";
      let cx = x - w / 2;
      for (const ch of text) {
        g.fillText(ch, cx, y);
        cx += g.measureText(ch).width + sp;
      }
      g.textAlign = "center";
    };
    const wrap = (text, max) => {
      const out = [];
      let cur = "";
      for (const wd of String(text).split(/\s+/)) {
        const tr = cur ? cur + " " + wd : wd;
        if (cur && g.measureText(tr).width > max) {
          out.push(cur);
          cur = wd;
        } else cur = tr;
      }
      if (cur) out.push(cur);
      return out;
    };
    const letter = (ch, x, y, px2, mk, color, hi) => {
      const ar = AR_CH.test(ch);
      g.font = mk(ar ? Math.round(px2 * 0.9) : px2);
      g.textBaseline = "middle";
      const yy = y + (ar ? -px2 * 0.1 : px2 * 0.04);
      if (hi) {
        g.fillStyle = hi;
        g.fillText(ch, x, yy + 2.5);
      }
      g.fillStyle = color;
      g.fillText(ch, x, yy);
      g.textBaseline = "alphabetic";
    };
    const face = (i, cx, cy, d, noPic) => {
      const im = W.pics && W.pics[i], iw = im ? im.naturalWidth || im.width : 0, ih = im ? im.naturalHeight || im.height : 0;
      if (!im || !iw || !ih) return noPic();
      const k = d / Math.min(iw, ih);
      g.save();
      g.beginPath();
      g.arc(cx, cy, d / 2, 0, Math.PI * 2);
      g.clip();
      try {
        if (BOO_PIC.test(im.src || "")) g.drawImage(im, cx - d / 2 - d * 0.08, cy - d / 2 - d * 0.02, d * 1.28, d * 1.28);
        else g.drawImage(im, cx - iw * k / 2, cy - ih * k / 2, iw * k, ih * k);
      } catch (e) {
      }
      g.restore();
    };
    const art = (a, x, y, w, rot) => {
      if (!rot) return artDraw(g, a, x, y, w);
      const hh = w * a.h / a.w;
      g.save();
      g.translate(x + w / 2, y + hh / 2);
      g.rotate(rot * Math.PI / 180);
      artDraw(g, a, -w / 2, -hh / 2, w);
      g.restore();
    };
    const spark = (x, y, s, a) => {
      g.save();
      g.globalAlpha = a;
      artDraw(g, ART.spark, x - s / 2, y - s / 2, s);
      g.restore();
    };
    let seed = 11;
    const rnd = () => {
      seed = seed * 16807 % 2147483647;
      return seed / 2147483647;
    };
    const FACT = {
      first: () => [t("First to"), String(W.target)],
      score: () => [t("Final score"), t("{a} to {b}", { a: W.sa, b: W.sb })],
      rounds: () => W.won == null ? [t("Round {n}", { n: W.rounds }).replace(/\s*\d+\s*/, "") || t("Round end"), String(W.rounds)] : [t("Rounds won"), t("{a} of {b}", { a: W.won, b: W.rounds })],
      big: () => W.big == null ? FACT.first() : [t("Biggest round"), t("{n} points", { n: W.big })],
      runners: () => [t(W.many ? "Runners up" : "Runner up"), W.runners]
    };
    const bar = (y, bg, keys) => {
      const x = 60, w = CW - 120, hh = 150;
      rr(x, y, w, hh, 24);
      g.fillStyle = bg;
      g.fill();
      g.strokeStyle = "#e8c36a";
      g.lineWidth = 2.5;
      g.stroke();
      keys.forEach((k, i) => {
        const c = FACT[k](), at = rtl ? keys.length - 1 - i : i, cx = x + w / keys.length * (at + 0.5);
        if (at) {
          g.fillStyle = "rgba(232,195,106,.5)";
          g.fillRect(x + w / keys.length * at - 1, y + 34, 2, hh - 68);
        }
        label(c[0], cx, y + 58, 21, "#e8c36a", 0.2, w / keys.length - 30);
        line(c[1], cx, y + 112, w / keys.length - 36, 42, (s) => serif(700, s), "#fff6e0");
      });
    };
    const brand = (y, color, dim) => {
      g.font = sans(800, 50);
      const tw = g.measureText("Blokvane").width, iw = icon ? 68 : 0, gap = icon ? 18 : 0, x0 = (CW - iw - gap - tw) / 2;
      if (icon) {
        g.save();
        rr(x0, y, 68, 68, 16);
        g.clip();
        try {
          g.drawImage(icon, x0, y, 68, 68);
        } catch (e) {
        }
        g.restore();
      }
      const d0 = g.direction;
      try {
        g.direction = "ltr";
      } catch (e) {
      }
      g.textAlign = "left";
      g.fillStyle = color;
      g.fillText("Blokvane", x0 + iw + gap, y + 52);
      g.textAlign = "center";
      try {
        g.direction = d0;
      } catch (e) {
      }
      line(t("Play it at blokvane.com"), CW / 2, y + 112, 900, 30, (s) => sans(700, s), dim);
    };
    const game = (y, color) => label(t("Dominoes 151"), CW / 2, y, 30, color, 0.3, 800);
    const wreaths = (y, size, ring, bgc) => {
      const xs = two ? [CW / 2 - size * 0.98, CW / 2 + size * 0.98] : [CW / 2];
      xs.forEach((cx, i) => {
        artDraw(g, ART.laurel, cx - size / 2, y, size);
        g.beginPath();
        g.arc(cx, y + size / 2, ring / 2, 0, Math.PI * 2);
        g.fillStyle = bgc;
        g.fill();
        g.strokeStyle = "#e8c36a";
        g.lineWidth = ring * 0.042;
        g.stroke();
        face(i, cx, y + size / 2, ring * 0.93, () => letter(ini[i], cx, y + size / 2, ring * 0.5, (s) => serif(700, s), "#fff6e0"));
        line(W.who[i], cx, y + size + 54, two ? 420 : 900, 56, (s) => serif(900, s), "#fff6e0");
      });
    };
    const score = (y, big, small) => {
      const parts = [[String(W.sa), serif(900, big), "#fff6e0"], [t("to"), serif(700, small, 1), "#e8c36a"], [String(W.sb), serif(900, big), "#fff6e0"]];
      if (rtl) parts.reverse();
      let w = 0;
      const gap = small * 0.42;
      for (const p of parts) {
        g.font = p[1];
        p[3] = g.measureText(p[0]).width;
        w += p[3];
      }
      w += gap * 2;
      let x = (CW - w) / 2;
      g.textAlign = "left";
      const d0 = g.direction;
      try {
        g.direction = "ltr";
      } catch (e) {
      }
      for (const p of parts) {
        g.font = p[1];
        g.fillStyle = p[2];
        g.fillText(p[0], x, y);
        x += p[3] + gap;
      }
      try {
        g.direction = d0;
      } catch (e) {
      }
      g.textAlign = "center";
    };
    if (fx === "trophy") {
      back2("#04282a", "#010f10");
      glow(540, 640, 640, 800, "rgba(15,90,85,1)", "rgba(15,90,85,0)");
      [[250, 7], [830, -7]].forEach((b) => {
        g.save();
        g.translate(b[0], -70);
        g.rotate(b[1] * Math.PI / 180);
        g.beginPath();
        g.moveTo(-34, 0);
        g.lineTo(34, 0);
        g.lineTo(330, 1500);
        g.lineTo(-330, 1500);
        g.closePath();
        g.fillStyle = lin(0, 0, 0, 1500, [[0, "rgba(255,244,200,.34)"], [0.85, "rgba(255,244,200,0)"], [1, "rgba(255,244,200,0)"]]);
        g.fill();
        g.restore();
      });
      frame(0.4);
      game(132, "#e8c36a");
      line(t(two ? "Champions of the table" : "Champion of the table"), 540, 236, 940, 78, (s2) => serif(700, s2, 1), "#e8c36a");
      glow(540, 590, 360, 360, "rgba(232,195,106,.30)", "rgba(232,195,106,0)");
      artDraw(g, ART.trophy, 305, 296, 470);
      [[246, 372, 52, 0.95], [812, 338, 40, 0.8], [852, 660, 48, 0.9], [226, 700, 36, 0.6], [528, 284, 30, 0.7]].forEach((s2) => spark(s2[0], s2[1], s2[2], s2[3]));
      rr(190, 892, 700, 150, 10);
      g.fillStyle = lin(0, 892, 0, 1042, [[0, "#143c3e"], [1, "#062022"]]);
      g.fill();
      g.strokeStyle = "rgba(232,195,106,.5)";
      g.lineWidth = 2;
      g.stroke();
      const s = fitFont(names, 580, 68, (z) => serif(900, z)), nw = g.measureText(names).width + 84;
      rr(540 - nw / 2, 920, nw, 96, 9);
      g.fillStyle = lin(0, 920, 0, 1016, [[0, "#fff0b8"], [0.55, "#e8c36a"], [1, "#b8892e"]]);
      g.fill();
      g.fillStyle = "#1d1a16";
      g.fillText(names, 540, 968 + s * 0.36);
      rr(150, 1042, 780, 16, 4);
      g.fillStyle = lin(0, 1042, 0, 1058, [[0, "#e8c36a"], [1, "#8a6410"]]);
      g.fill();
      wreaths(1088, 250, 144, "#04282a");
      score(1512, 96, 60);
      bar(1566, "rgba(2,20,22,.7)", ["first", "rounds", "runners"]);
      brand(1746, "#fff6e0", "#cfe6de");
    } else if (fx === "crest") {
      back2("#4a0b1e", "#22050e");
      glow(540, 720, 700, 880, "rgba(138,26,54,1)", "rgba(138,26,54,0)");
      dots(0.04);
      const CC = ["#fff6e0", "#f3dc9c", "#e8c36a", "#b8892e"];
      for (let i = 0; i < 46; i++) {
        const x = 50 + rnd() * 980, y = 60 + rnd() * 1800, w = [14, 18, 22][Math.floor(rnd() * 3)], hh = rnd() < 0.5 ? 10 : 26, round = rnd() < 0.4, c = CC[Math.floor(rnd() * 4)], a = rnd() * 6.3;
        if (x > 150 && x < 930 && y > 240) continue;
        g.save();
        g.translate(x, y);
        g.rotate(a);
        g.fillStyle = c;
        rr(-w / 2, -hh / 2, w, hh, round ? Math.min(w, hh) / 2 : 2);
        g.fill();
        g.restore();
      }
      frame(0.45);
      game(126, "#f3dc9c");
      art(ART.tile(6, 6), 116, 372, 104, -16);
      art(ART.tile(5, 5), 860, 372, 104, 16);
      artDraw(g, ART.shield, 310, 262, 460);
      artDraw(g, ART.crown, 455, 172, 170);
      label(t("First to"), 540, 418, 25, "#f3dc9c", 0.3, 300);
      line(String(W.target), 540, 572, 320, 172, (s) => serif(900, s), "#e8c36a", { shade: "rgba(0,0,0,.4)" });
      artDraw(g, ART.banner, 90, 752, 900);
      label(t(two ? "Champions" : "Champion"), 540, 842, 66, "#3a0817", 0.16, 580, (s) => caps(900, s));
      wreaths(928, 240, 136, "#3a0817");
      line(names, 540, 1392, 980, 112, (s) => serif(900, s), "#fff6e0", { shade: "rgba(0,0,0,.4)" });
      line(t(two ? "rule the table" : "rules the table"), 540, 1460, 900, 50, (s) => serif(700, s, 1), "#e8c36a");
      bar(1524, "rgba(0,0,0,.35)", ["score", "rounds", "runners"]);
      brand(1722, "#fff6e0", "#e9dcc0");
    } else if (fx === "medals") {
      back2("#0e1838", "#050916");
      glow(540, 660, 700, 840, "rgba(36,64,138,1)", "rgba(36,64,138,0)");
      for (let i = 0; i < 30; i++) {
        const x = 50 + rnd() * 980, y = 60 + rnd() * 1500, s = [16, 22, 30][Math.floor(rnd() * 3)];
        spark(x, y, s, 0.35 + rnd() * 0.6);
      }
      frame(0.4);
      const RIB = (x, w, c) => {
        const st = [[0, c[0]], [0.22, c[0]], [0.22, "#fff6e0"], [0.3, "#fff6e0"], [0.3, c[1]], [0.7, c[1]], [0.7, "#fff6e0"], [0.78, "#fff6e0"], [0.78, c[0]], [1, c[0]]];
        g.save();
        g.shadowColor = "rgba(0,0,0,.4)";
        g.shadowBlur = 20;
        g.shadowOffsetY = 10;
        g.fillStyle = lin(x - w / 2, 0, x + w / 2, 0, st);
        g.fillRect(x - w / 2, -20, w, 340);
        g.restore();
      };
      const medal = (cx, d, c, i) => {
        RIB(cx, d * 0.4, c);
        g.lineWidth = 10;
        g.strokeStyle = "#e8c36a";
        rr(cx - 38, 312, 76, 44, 14);
        g.stroke();
        g.save();
        g.shadowColor = "rgba(0,0,0,.55)";
        g.shadowBlur = 26;
        g.shadowOffsetY = 20;
        g.beginPath();
        g.arc(cx, 344 + d / 2, d * 0.46, 0, Math.PI * 2);
        g.fillStyle = "#9a6e1c";
        g.fill();
        g.restore();
        artDraw(g, ART.medal, cx - d / 2, 344, d);
        if (W.pics && W.pics[i]) {
          g.beginPath();
          g.arc(cx, 344 + d * 0.46, d * 0.225, 0, Math.PI * 2);
          g.fillStyle = "#fff5c8";
          g.fill();
        }
        face(i, cx, 344 + d * 0.46, d * 0.44, () => letter(ini[i], cx, 344 + d * 0.45, d * 0.46, (s) => serif(900, s), "#6b4c0e", "#fff0b8"));
        if (W.pics && W.pics[i]) {
          g.beginPath();
          g.arc(cx, 344 + d * 0.46, d * 0.225, 0, Math.PI * 2);
          g.strokeStyle = "#8a6410";
          g.lineWidth = d * 0.012;
          g.stroke();
        }
        label(t("Champion"), cx, 344 + d * 0.79, d * 0.066, "#6b4c0e", 0.2, d * 0.58, (s) => caps(900, s));
        line(W.who[i], cx, 344 + d + 78, two ? 440 : 900, 60, (s) => serif(900, s), "#fff6e0");
      };
      if (two) {
        medal(292, 380, ["#b3202e", "#7a1220"], 0);
        medal(788, 380, ["#1f8a85", "#0d4f4c"], 1);
        line("+", 540, 574, 0, 104, (s) => serif(900, s), "#e8c36a");
      } else medal(540, 420, ["#b3202e", "#7a1220"], 0);
      const y0 = two ? 30 : 64;
      label(t("First to"), 290, 936 + y0, 24, "#c9d4f5", 0.3, 400);
      line(String(W.target), 290, 1084 + y0, 400, 156, (s) => serif(900, s), "#e8c36a", { shade: "rgba(0,0,0,.4)" });
      g.fillStyle = "#e8c36a";
      g.fillRect(210, 1110 + y0, 160, 3);
      label(t("Final score"), 790, 936 + y0, 24, "#c9d4f5", 0.3, 400);
      line(String(W.sa), 790, 1084 + y0, 400, 156, (s) => serif(900, s), "#fff6e0", { shade: "rgba(0,0,0,.4)" });
      line(t("to") + " " + W.sb, 790, 1152 + y0, 400, 52, (s) => serif(700, s, 1), "#e8c36a");
      game(1296, "#e8c36a");
      line(t("Gold for {names}", { names }), 540, 1420, 980, 104, (s) => serif(900, s), "#fff6e0", { shade: "rgba(0,0,0,.4)" });
      bar(1500, "rgba(5,9,24,.7)", ["rounds", "big", "runners"]);
      brand(1722, "#fff6e0", "#c9d4f5");
    } else if (fx === "glass") {
      g.fillStyle = "#0d0a14";
      g.fillRect(0, 0, CW, CH);
      glow(540, 560, 640, 760, "rgba(58,42,85,1)", "rgba(58,42,85,0)");
      g.fillStyle = "rgba(255,255,255,.025)";
      for (let y = 0; y < CH; y += 90) g.fillRect(0, y, CW, 2);
      for (let x = 0; x < CW; x += 180) g.fillRect(x, 0, 2, CH);
      frame(0.4);
      game(124, "#e8c36a");
      [["rgba(192,38,59,.42)", 420, 330], ["rgba(232,169,58,.36)", 680, 350], ["rgba(31,157,107,.34)", 700, 600], ["rgba(36,86,201,.42)", 420, 640], ["rgba(123,63,196,.40)", 540, 470]].forEach((c) => glow(c[1], c[2], 300, 300, c[0], c[0].replace(/[\d.]+\)$/, "0)")));
      artDraw(g, ART.rose, 220, 156, 640);
      label(t("First to"), 540, 428, 24, "#5a3d08", 0.3, 250, (s) => caps(700, s));
      line(String(W.target), 540, 536, 270, 122, (s) => caps(900, s), "#3a2606");
      const xs = two ? [322, 758] : [540];
      xs.forEach((cx, i) => {
        glow(cx, 1036, 230, 280, i ? "rgba(36,86,201,.42)" : "rgba(192,38,59,.42)", i ? "rgba(36,86,201,0)" : "rgba(192,38,59,0)");
        artDraw(g, i ? ART.lancetB : ART.lancetA, cx - 118, 838, 236);
        face(i, cx, 838 + 205, 136, () => letter(ini[i], cx, 838 + 205, 112, (s) => caps(900, s), "#3a2606"));
        label(W.who[i], cx, 1294, 46, "#fff6e0", 0.08, two ? 400 : 900, (s) => caps(900, s));
      });
      label(t(two ? "The champions" : "The champion"), 540, 1388, 34, "#e8c36a", 0.42, 960, (s) => caps(700, s));
      line(names, 540, 1496, 980, 108, (s) => serif(900, s), "#fff6e0", { shade: "rgba(0,0,0,.5)" });
      bar(1546, "rgba(11,9,16,.75)", ["score", "rounds", "runners"]);
      brand(1740, "#fff6e0", "#e9dcc0");
    } else {
      back2("#073a36", "#03201e");
      glow(540, 880, 700, 1e3, "rgba(15,106,96,1)", "rgba(15,106,96,0)");
      dots(0.035);
      art(ART.tile(6, 4), 8, 1560, 118, -24);
      art(ART.tile(5, 5), 956, 64, 118, 20);
      art(ART.tileH(1, 5), 850, 1602, 216, -12);
      g.save();
      g.translate(540, 870);
      g.rotate(-Math.PI / 180);
      g.translate(-540, -870);
      g.save();
      g.shadowColor = "rgba(0,0,0,.55)";
      g.shadowBlur = 80;
      g.shadowOffsetY = 40;
      rr(70, 120, 940, 1500, 10);
      g.fillStyle = "#f3e7c8";
      g.fill();
      g.restore();
      const pg = g.createRadialGradient(540, 570, 0, 540, 570, 1050);
      pg.addColorStop(0, "#fffaf0");
      pg.addColorStop(1, "#f3e7c8");
      rr(70, 120, 940, 1500, 10);
      g.fillStyle = pg;
      g.fill();
      g.strokeStyle = "#b8892e";
      g.lineWidth = 3;
      g.strokeRect(96, 146, 888, 1448);
      g.lineWidth = 1;
      g.strokeRect(106, 156, 868, 1428);
      [[114, 164, 0], [856, 164, 90], [856, 1466, 180], [114, 1466, 270]].forEach((c) => art(ART.corner, c[0], c[1], 110, c[2]));
      label(t("Certificate of victory"), 540, 292, 44, "#8a6410", 0.2, 560, (s) => caps(900, s));
      line(t("Dominoes 151"), 540, 350, 700, 40, (s) => serif(700, s, 1), "#1d1a16");
      line(t("This certifies that"), 540, 428, 800, 30, (s) => sans(700, s), "#5c5340");
      line(names, 540, 590, 800, 178, (s) => script(s), "#1d1a16");
      g.fillStyle = lin(220, 0, 860, 0, [[0, "rgba(184,137,46,0)"], [0.5, "#b8892e"], [1, "rgba(184,137,46,0)"]]);
      g.fillRect(220, 636, 640, 3);
      g.font = serif(700, 46);
      g.fillStyle = "#1d1a16";
      const ls = wrap(t(two ? "are the champions of the table, first to {n}, with a final score of {a} to {b}." : "is the champion of the table, first to {n}, with a final score of {a} to {b}.", { n: W.target, a: W.sa, b: W.sb }), 780);
      ls.forEach((l, i) => g.fillText(l, 540, 722 + i * 62));
      const sy = Math.max(916, 722 + ls.length * 62 - 16);
      g.save();
      g.shadowColor = "rgba(0,0,0,.3)";
      g.shadowBlur = 12;
      g.shadowOffsetY = 10;
      g.beginPath();
      g.arc(540, sy + 160, 136, 0, Math.PI * 2);
      g.fillStyle = "#a87a22";
      g.fill();
      g.restore();
      artDraw(g, ART.seal, 380, sy, 320);
      line(String(W.target), 540, sy + 194, 200, 98, (s) => serif(900, s), "#6b4c0e");
      const sig = (cx, big, small) => {
        line(big, cx, sy + 506, 390, 68, (s) => script(s), "#1d1a16");
        g.fillStyle = "#1d1a16";
        g.fillRect(cx - 170, sy + 524, 340, 2);
        g.font = sans(800, rtl ? 28 : 22);
        const up = rtl ? String(small) : String(small).toUpperCase(), wl = wrap(up, 330);
        wl.slice(0, 2).forEach((l, i) => label(l, cx, sy + 562 + i * 30, 21, "#6b5a2a", 0.06, 400));
      };
      const L = [W.runners, t(W.many ? "Witnessed by the runners up, {n}" : "Witnessed by the runner up, {n}", { n: W.sb })], R = W.won == null ? [t("First to {n}", { n: W.target }), t("Final score")] : [t("{a} of {b} rounds", { a: W.won, b: W.rounds }), W.big == null ? t("First to {n}", { n: W.target }) : t("Biggest round: {n} points", { n: W.big })];
      sig(rtl ? 780 : 300, L[0], L[1]);
      sig(rtl ? 300 : 780, R[0], R[1]);
      (two ? [[152, 212, 0], [928, 200, 1]] : [[152, 212, 0]]).forEach((d) => {
        g.save();
        g.shadowColor = "rgba(0,0,0,.35)";
        g.shadowBlur = 20;
        g.shadowOffsetY = 10;
        g.beginPath();
        g.arc(d[0], d[1], 62, 0, Math.PI * 2);
        g.fillStyle = "#0a4640";
        g.fill();
        g.restore();
        face(d[2], d[0], d[1], 118, () => letter(ini[d[2]], d[0], d[1], 64, (s) => serif(700, s), "#fff6e0"));
        g.strokeStyle = "#e8c36a";
        g.lineWidth = 6;
        g.beginPath();
        g.arc(d[0], d[1], 62, 0, Math.PI * 2);
        g.stroke();
      });
      g.restore();
      brand(1724, "#fff6e0", "#cfe6de");
    }
  }
  function crown(size) {
    const NS = "http://www.w3.org/2000/svg", sv = document.createElementNS(NS, "svg");
    sv.setAttribute("viewBox", "0 0 48 36");
    sv.setAttribute("width", String(size));
    sv.setAttribute("height", String(Math.round(size * 0.75)));
    sv.setAttribute("aria-hidden", "true");
    sv.style.display = "block";
    sv.style.overflow = "visible";
    sv.innerHTML = '<path d="M5 28 2.5 8.5 14 17.5 24 3.5 34 17.5 45.5 8.5 43 28z" fill="#deb866" stroke="#8a6a22" stroke-width="1.6" stroke-linejoin="round"/><path d="M5 30.5h38v4H5z" fill="#c9a24a" stroke="#8a6a22" stroke-width="1.4" stroke-linejoin="round"/><circle cx="24" cy="3.6" r="2.6" fill="#f6e3a1" stroke="#8a6a22" stroke-width="1.2"/><circle cx="2.8" cy="8.4" r="2.2" fill="#f6e3a1" stroke="#8a6a22" stroke-width="1.2"/><circle cx="45.2" cy="8.4" r="2.2" fill="#f6e3a1" stroke="#8a6a22" stroke-width="1.2"/><circle cx="24" cy="21" r="2.4" fill="#8a443b"/><circle cx="14" cy="23" r="1.7" fill="#2f7377"/><circle cx="34" cy="23" r="1.7" fill="#2f7377"/>';
    return sv;
  }
  const AR = {
    "Dominoes 151": "دومنة 151",
    "The table is on the TV. Your tiles are on your phone.": "الميز عالتلفزيون، و دومنة بموبايلك.",
    "Play from your phone": "العب من موبايلك",
    "Your tiles show on your phone. Tap one, or drag it up, when it is your turn.": "دومنة تطلع بموبايلك. من يجي دورك دوس على صاي، لو اسحبه لفوگ عالميز.",
    "Free games: 1 vs 1, first to 51. With Blokvane Pro, the host picks any mode and plays to 101, 151 or 201.": "الألعاب المجانية: واحد ضد واحد، على 51. ويا Blokvane Pro، المضيف يختار أي طريقة لعب ويلعب على 101 لو 151 لو 201.",
    "Your tiles are on your phone. On your turn, play one that matches either open end of the chain on the TV.": "دومنة بموبايلك. بدورك ذب دومنة يلي تنلعب على وحدة من الصفحتين المفتوحة عالتلفزيون.",
    "Can't play? Draw from the pile until you can. With no pile, you pass.": "ما عندك؟ اسحب من سحبة لحد ما تلكه صاي ينلعب. وإذا ماكو : ما عندي.",
    "Go out first and score the pips left in your opponents' hands.": "اللي يخلّص دومنة أول ياخذ نقاط دومنة اللي بقت بيد خصومه.",
    "If nobody can play, the game is locked: the fewest pips win.": "إذا محد يگدر يلعب تنقفل اللعبة: واللي بيده أقل نقاط يفوز.",
    "The match": "اللعبة",
    "Match": "اللعبة",
    "Turns": "الأدوار",
    "The table": "الميز",
    "Names": "الأسماء",
    "Teams, 2 vs 2": "فرق، 2 ضد 2",
    "Partners sit across from each other. All 28 tiles are dealt.": "الشريك يگعد گبال شريكه. تتوزّع الـ 28 حجر كلها.",
    "1 vs 1": "واحد ضد واحد",
    "Seven tiles each, 14 in the pile to draw from.": "كل واحد 7 حجار، و14 موجودة للسحب.",
    "Three players, each alone": "ثلاثة، كلمن وحده",
    "Seven tiles each, 7 in the pile to draw from.": "كل واحد 7 حجار، و7 موجودة للسحب.",
    "Four players, each alone": "أربعة، كلمن وحده",
    "Everyone plays for themselves. All 28 tiles are dealt.": "كلمن يلعب وحده. تتوزّع الـ 28 حجر كلها.",
    "Pick your team on your phone: partners sit across": "اختار فريقك من موبايلك: الشريك گبال شريكه",
    "Everyone has their own score": "كلمن إله نقاطه",
    "Can't play? Draw from the pile until you can": "ما عندك؟ اسحب من السحبة لحد مال تلكه صاي تلعبه",
    "Can't play? You pass": "ما عندك؟ ماكو",
    "Empty seats are played by the computer": "المقاعد الفارغة يلعبها الكومبيوتر",
    "First to {n}": "اللعب على {n}",
    "{n} s a turn": "{n} ثانية للدور",
    "No time limit": "بلا وقت",
    "Computer: easy": "الكومبيوتر: سهل",
    "Computer: normal": "الكومبيوتر: عادي",
    "Computer: hard": "الكومبيوتر: صعب",
    "Match target": "اللعب على",
    "The first side to reach this many points wins the match.": "أول طرف يوصل لهالنقاط يفوز باللعبة.",
    "Computer players": "لاعبين الكومبيوتر",
    "Computer level": "مستوى الكومبيوتر",
    "A player with no tile that fits, and no pile to draw from, passes by themselves.": "اللاعب اللي ما عنده دومنة تنلعب، والسحبة خلصانة، ماكو.",
    "The table, the tiles and the border can be changed at any time, even in the middle of a match.": "الميز والحجار و حافة تتبدل بأي وكت، حتى بنص اللعبة.",
    "Seats with no phone are played by the computer. This is how well it plays.": "المقعد اللي ما عليه موبايل يلعبه الكومبيوتر. وهذا مستوى لعبه.",
    "Game speed": "سرعة اللعب",
    "How long a computer player thinks before it plays.": "شگد يفكّر لاعب الكومبيوتر گبل لا يلعب.",
    "Time for a turn": "وقت الدورك",
    "When a player's time is up, a tile is played for them, so the game never waits.": "إذا خلص وقت اللاعب ينلعب دومنة بداله، حتى اللعب ما يوگف.",
    "Auto pass when a player cannot play": "ما عندي تلقائي إذا اللاعب ما عنده",
    "Auto start next round": "الجولة الجاية تبدي وحدها",
    "Off: the host starts each round from their phone.": "مطفي: المضيف يبدي كل جولة من موبايله.",
    "Highlight playable tiles": "بيّن الدومة اللي ترهم",
    "On each phone, the tiles that can be played stand a little higher.": "بكل موبايل، الدومة اللي تنلعب ترتفع شوية.",
    "Player reactions": "تعليقات اللاعبين",
    "Speech bubbles on the TV, from the players' phones and from the computer players.": "ستيكرات وكلام يطلع عالتلفزيون، من موبايلات اللاعبين ومن لاعبين الكومبيوتر.",
    "Table": "الميز",
    "Tiles": "الحجار",
    "Deal animation": "حركة التوزيع",
    "Round end style": "شكل نهاية الجولة",
    "Lock animation": "حركة القفلة",
    "Table border": "حافة الميز",
    "Names of the computer players": "أسماء لاعبين الكومبيوتر",
    "Teal felt": "تركوازي",
    "Green felt": "أخضر",
    "Burgundy felt": "عنّابي",
    "Walnut wood": "خشب جوز",
    "Ivory": "عاجي",
    "Color": "ملوّن",
    "Bone": "عظم",
    "Ebony": "أبنوس",
    "Maple": "مرمر",
    "Classic ivory": "كلاسيكي",
    "Color dots": "نقاط ملوّنة",
    "Bone and ebony, coloured": "عظم وأبنوس، ملوّن",
    "Maple wood": "خشب القيقب",
    "Line": "صف",
    "Ring": "حلقة",
    "Drop": "نزول",
    "Panel": "لوحة",
    "Sweep": "لمعة",
    "Flip": "قلب",
    "Pips": "نقاط",
    "Stamp": "ختم",
    "Orbit": "مدار",
    "Padlock": "قفل",
    "Gates": "بوابات",
    "Banner": "شريط",
    "Wood": "خشب",
    "Light line": "خط ضوه",
    "Float": "طايف",
    "Leather": "جلد",
    "Round {n}": "الجولة {n}",
    "Dealing…": "دنوزّع الدومة…",
    "Dealing again…": "نعيد التوزيع…",
    "Round over": "خلصت الجولة",
    "Match over": "خلصت اللعبة",
    "{name} is thinking…": "{name} ديفكّر…",
    "{name} is away: the computer plays": "{name} مو يمنا: الكومبيوتر يلعب بداله",
    "{name} draws from the pile": "{name} ديسحب من الدومة",
    "{name} cannot play": "{name} ما عنده",
    "{name}'s turn": "دور {name}",
    "Your turn": "دورك! ذب صاي",
    "Choose which end to play on": "على يا صفحة تلعبه؟",
    "No tile to play. Draw from the pile.": "ماكو دومنة تنلعب. اسحب من السحبة.",
    "No legal move, passing…": "ماكو لعبة… لا أملك.",
    "No legal move": "ماكو لعبة",
    "Pass": "كاعد",
    "Draw · {n}": "اسحب · {n}",
    "Pile · {n}": "السحبة · {n}",
    "{name} holds the {a}–{a} and starts.": "دبل {a} يم {name}، وهو يبدي.",
    "{name} starts.": "{name} يبدي.",
    "You hold the {a}–{a}. Play it to start.": "دبل {a} يمّك. ذبّه وابدي.",
    "You start. Play any tile.": "إنت تبدي. ذب أي حجر.",
    "Play on {n}": "على {n}",
    "Draw a tile": "اسحب حجر",
    "Misdeal: {name} holds {n} doubles. Dealing again.": "توزيعة ما تصير: {name} بيده {n} دبل. نعيد التوزيع.",
    "Misdeal: {name} holds {n} tiles with a {k}. Dealing again.": "توزيعة ما تصير: {name} بيده {n} دومنة بيها {k}. نعيد التوزيع.",
    "Locked": "انقفلت",
    "{name} closed the game": "{name} قفلها",
    "{name} locked the game": "{name} قفل اللعب",
    "Nobody can play. Counting the hands…": "محد يگدر يلعب. دنحسب الدومنة…",
    "Blocked": "قفلة",
    "Blocked: a tie": "قفلة وتعادل",
    "Both teams hold {n} points. No points awarded.": "الفريقين بيدهم {n}. محد ياخذ نقاط.",
    "The lowest hands are tied at {n} points. No points awarded.": "أقل اثنين متعادلين على {n}. محد ياخذ نقاط.",
    "{name} went out": "{name} ما عنده",
    "You went out": "ما عندك تلعب!",
    "{team} win the round, scoring {n} points.": "{team} أخذوا الجولة بـ {n} نقطة.",
    "{name} wins the round, scoring {n} points.": "{name} أخذ الجولة بـ {n} نقطة.",
    "Your team wins the round, scoring {n} points.": "فريقك أخذ الجولة بـ {n} نقطة.",
    "You win the round, scoring {n} points.": "الجولة إلك، بـ {n} نقطة.",
    "{name} starts the next round.": "{name} يبدي الجولة الجاية.",
    "You start the next round.": "إنت تبدي الجولة الجاية.",
    "{name} locked the game and starts the next round.": "{name} قفلها، وهو يبدي الجولة الجاية.",
    "You locked the game and start the next round.": "إنت قفلتها، وإنت تبدي الجولة الجاية.",
    "with {name}": "ويّا {name}",
    "Tap a tile to play it, or drag it up here.": "دوس على الدومنة وذبّه، لو اسحبه لهنا.",
    "The table is on the TV. Your tiles are here.": "الميز عالتلفزيون، وحجارك هنا.",
    "Drop it here to play": "عوفه هنا و العب",
    "Play it": "العب",
    "1 tile": "صاي واحد",
    "{n} tiles": "{n} دومنة",
    "{name} locked the game.": "{name} هو اللي قفلها.",
    "You locked the game.": "إنت اللي قفلتها.",
    "{team} hold fewer points ({a} against {b}) and take {b}.": "{team} بيدهم أقل ({a} گبال {b}) وياخذون {b}.",
    "Your team holds fewer points ({a} against {b}) and takes {b}.": "فريقك بيده أقل ({a} گبال {b}) وياخذ {b}.",
    "{name} holds the fewest points ({a}) and scores {b}.": "{name} بيده أقل شي ({a}) وياخذ {b}.",
    "You hold the fewest points ({a}) and score {b}.": "إنت بيدك أقل شي ({a}) وتاخذ {b}.",
    "{team} score": "{team} ياخذون",
    "{name} scores": "{name} ياخذ",
    "No points this round": "ماكو نقاط بهالجولة",
    "no points": "بلا نقاط",
    "No tiles left": "ما بقى عنده لعب",
    "You have {n} points left in your hand.": "بقى بيدك {n} نقطة.",
    "You have no tiles left.": "ما بقى بيدك شي.",
    "Tie": "تعادل",
    "Us": "إحنا",
    "Them": "همّه",
    "You": "إنت",
    "Your team": "فريقك",
    "Next round": "الجولة الجاية",
    "Next round ({n})": "الجولة الجاية ({n})",
    "{name} starts the next round": "{name} يبدي الجولة الجاية",
    "The host starts the next round.": "المضيف يبدي الجولة الجاية.",
    "{team} win the match": "{team} فازوا باللعبة",
    "{name} wins the match": "{name} فاز باللعبة",
    "win the match!": "فازوا باللعبة!",
    "wins the match!": "فاز باللعبة!",
    "In 1 round": "بجولة وحدة",
    "In {n} rounds": "بـ {n} جولات",
    "The winners": "الفايزين",
    "Moves this round": "لعبات هالجولة",
    "No moves yet this round.": "بعد ماكو لعب بهالجولة.",
    "Passed": "كاعد",
    "Drew 1 tile": "سحب دومنة",
    "Drew {n} tiles": "سحب {n} دومنة",
    "Play this turn for {name}": "العب هالدور بدال {name}",
    "You are watching this round. You get a seat when one is free.": "إنت تتفرّج بهالجولة. من يفرغ مكان تگعد.",
    "The table's look": "شكل الميز",
    "Deal animation: off, tiles appear at once": "حركة التوزيع مطفية: الدومنة تطلع فد مرة",
    "Round end": "نهاية الجولة",
    "Round end: pop-up panel": "نهاية الجولة: لوحة",
    "Lock animation: off": "حركة القفلة مطفية",
    "Lock animation: gates": "حركة القفلة: بوابات",
    "Preview": "معاينة",
    "Computer player {n}": "لاعب الكومبيوتر {n}",
    "Every seat has a player: no computer players in this match.": "كل المقاعد بيها ناس: ماكو كومبيوتر بهاللعبة.",
    "Give each one a name, a color and a face. Leave a name empty and it gets an everyday American one.": "انطي كل واحد اسم ولون ووجه. وإذا تخلّي الاسم فارغ ياخذ اسم عادي.",
    "A name": "اسم",
    "Team color": "لون الفريق",
    "Its letter": "حرفه",
    "A Boo": "Boo",
    "Teal": "تركوازي",
    "Indigo": "نيلي",
    "Olive": "زيتوني",
    "Plum": "بنفسجي",
    "Slate": "رصاصي",
    "Domino!": "دومنة!",
    "That is it!": "هاي هيه!",
    "Yes!": "إي والله!",
    "Nice one!": "عاشت إيدك!",
    "Well played!": "خوش لعبة!",
    "Ahh.": "آخ…",
    "Not again…": "هم رجعت؟…",
    "Ugh.": "أوف.",
    "Nothing…": "ماكو شي…",
    "I pass.": "كاعد.",
    "Come on!": "يلا عاد!",
    "Locked!": "قفلتها!",
    "Closed.": "انسدّت.",
    "Locked…": "انقفلت…",
    "Hmm.": "همم.",
    "Watch this.": "شوف هاي.",
    "You are taking too long!": "يمعوّد خلّصنا، طوّلتها!",
    "What kind of move was that?!": "شنو هاللعبة هاي؟!",
    "Wake me up when it is my turn.": "گعّدوني من يجي دوري.",
    "No way!": "لا يابه!",
    "Hmm…": "همم…",
    "Please, just one six.": "يا رب بس شيش واحد.",
    "Tea, anyone?": "منو يريد چاي؟",
    "I am on fire!": "اليوم يومي!",
    "Do not lock it!": "لا تقفلها!",
    "Good game!": "خوش لعب، عاشت إيدكم!",
    "Send a sticker to the TV": "دزّ ستيكر عالتلفزيون",
    "Stickers": "ستيكرات",
    "Tap one and it shows on the TV.": "دوس على واحد ويطلع عالتلفزيون.",
    "Sent to the TV": "راح للتلفزيون",
    "Wait a moment…": "اصبر شوية…",
    "The last ones you sent": "آخر ما دزّيت",
    "Say something on the TV": "گول شي عالتلفزيون",
    "Say something": "گول شي",
    "Tap a line and it shows by your name on the TV.": "دوس على جملة وتطلع يم اسمك عالتلفزيون.",
    "Close": "سدّ",
    "It is your turn": "دورك",
    "Lobby look": "شكل شاشة الانتظار",
    "Royal velvet": "مخمل ملكي",
    "Starry night medals": "ليلة نجوم وميداليات",
    "Teal and gold": "تركوازي وذهبي",
    "How the TV looks while everyone joins.": "شكل شاشة التلفزيون لحد ما الكل ينضم.",
    "Winner screen": "شاشة الفايز",
    "Trophy in the spotlight": "الكاس تحت الضوا",
    "Royal crest": "الشعار الملكي",
    "Gold medals": "ميداليات ذهب",
    "Stained glass window": "شباك زجاج ملوّن",
    "Certificate with gold seal": "شهادة بختم ذهب",
    "The screen the TV shows when the match is won. It is also the picture a phone shares.": "الشاشة اللي تطلع عالتلفزيون من تخلص اللعبة، وهي هم الصورة اللي يشاركها الموبايل.",
    "First to": "اللعب على",
    "Final score": "النتيجة النهائية",
    "{a} to {b}": "{a} گبال {b}",
    "to": "گبال",
    "Rounds won": "جولات الفوز",
    "{a} of {b}": "{a} من {b}",
    "Biggest round": "أكبر جولة",
    "{n} points": "{n} نقطة",
    "Runners up": "المركز الثاني",
    "Runner up": "المركز الثاني",
    "Champions of the table": "أبطال الميز",
    "Champion of the table": "بطل الميز",
    "Champions": "الأبطال",
    "Champion": "البطل",
    "The champions": "الأبطال",
    "The champion": "البطل",
    "rule the table": "ملوك الميز",
    "rules the table": "ملك الميز",
    "Gold for {names}": "الذهب لـ {names}",
    "Certificate of victory": "شهادة فوز",
    "This certifies that": "هاي الشهادة تثبت إنو",
    "are the champions of the table, first to {n}, with a final score of {a} to {b}.": "أبطال الميز: وصلوا {n} أول شي، والنتيجة النهائية {a} گبال {b}.",
    "is the champion of the table, first to {n}, with a final score of {a} to {b}.": "بطل الميز: وصل {n} أول شي، والنتيجة النهائية {a} گبال {b}.",
    "Witnessed by the runners up, {n}": "شهد عليها المركز الثاني، {n}",
    "Witnessed by the runner up, {n}": "شهد عليها المركز الثاني، {n}",
    "{a} of {b} rounds": "{a} من {b} جولات",
    "Biggest round: {n} points": "أكبر جولة: {n} نقطة",
    "The host can start a new game from their phone.": "المضيف يگدر يبدي لعبة جديدة من موبايله.",
    "Play it at blokvane.com": "العبها على blokvane.com"
  };
  let lang = "en";
  const setLang = (l) => {
    lang = l === "ar" ? "ar" : "en";
  };
  const KIT_AR = "Look at the TV!";
  function joinWords(I, add) {
    const more = {};
    let n = 0;
    for (const k of Object.keys(AR)) if (I.t("ar", k) === k && AR[k] !== k) {
      more[k] = AR[k];
      n++;
    }
    if (n) add.call(I, "ar", more);
  }
  function words() {
    try {
      const I = window.BVI18N;
      if (!I) return;
      if (!I.bvDomAdd) {
        const add0 = I.add;
        I.bvDomAdd = add0;
        I.add = function(code, w) {
          add0.call(I, code, w);
          if (code === "ar") {
            try {
              if (I.t("ar", KIT_AR) !== KIT_AR) joinWords(I, add0);
            } catch (e) {
            }
          }
        };
      }
      if (I.t("ar", KIT_AR) !== KIT_AR) joinWords(I, I.bvDomAdd);
    } catch (e) {
    }
  }
  words();
  function t(text, vars) {
    let out = text == null ? "" : String(text);
    if (lang === "ar" && Object.prototype.hasOwnProperty.call(AR, out)) out = AR[out];
    else {
      try {
        if (window.BVI18N) out = BVI18N.t(lang, out);
      } catch (e) {
      }
    }
    if (vars) out = out.replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? String(vars[k]) : m);
    return out;
  }
  const num = (n) => String(n);
  function resultWords(r, c) {
    r = r || {};
    const me = c.me, mine = (team) => me >= 0 && (c.teams ? me % 2 === team : me === team), nm = (p) => c.name(p);
    const starts = (p) => c.over ? "" : p === me ? t("You start the next round.") : t("{name} starts the next round.", { name: nm(p) });
    const locks = (p) => p == null ? "" : c.over ? p === me ? t("You locked the game.") : t("{name} locked the game.", { name: nm(p) }) : p === me ? t("You locked the game and start the next round.") : t("{name} locked the game and starts the next round.", { name: nm(p) });
    if (r.kind === "out") {
      const who = c.teams ? mine(r.team) ? t("Your team wins the round, scoring {n} points.", { n: r.points }) : t("{team} win the round, scoring {n} points.", { team: c.teamName(r.team), n: r.points }) : mine(r.team) ? t("You win the round, scoring {n} points.", { n: r.points }) : t("{name} wins the round, scoring {n} points.", { name: nm(r.team), n: r.points });
      return { title: r.p === me ? t("You went out") : t("{name} went out", { name: nm(r.p) }), detail: (who + " " + starts(r.p)).trim() };
    }
    if (r.kind === "tie") return { title: t("Blocked: a tie"), detail: c.teams ? t("Both teams hold {n} points. No points awarded.", { n: r.min }) : t("The lowest hands are tied at {n} points. No points awarded.", { n: r.min }) };
    if (r.kind === "lock") {
      const d = c.teams ? mine(r.team) ? t("Your team holds fewer points ({a} against {b}) and takes {b}.", { a: r.min, b: r.points }) : t("{team} hold fewer points ({a} against {b}) and take {b}.", { team: c.teamName(r.team), a: r.min, b: r.points }) : mine(r.team) ? t("You hold the fewest points ({a}) and score {b}.", { a: r.min, b: r.points }) : t("{name} holds the fewest points ({a}) and scores {b}.", { name: nm(r.team), a: r.min, b: r.points });
      return { title: t("Blocked"), detail: (d + " " + locks(r.p)).trim() };
    }
    return { title: "", detail: "" };
  }
  return {
    BASE,
    GOLD,
    CREAM,
    INK,
    KUFI,
    PLEX,
    h,
    px,
    CFG,
    cfg,
    newMatch,
    deal,
    legal,
    pts,
    teamOf,
    play,
    pass,
    draw,
    stuck,
    blocked,
    misdeal,
    ai,
    sidesFor,
    cells,
    SETS,
    setOf,
    TILE_SETS,
    TABLES,
    BORDERS,
    DEALS,
    ENDS,
    LOCKS,
    RIMS,
    rim,
    clip,
    scalePx,
    SIZES,
    chainSize,
    tile,
    half,
    back,
    BACK,
    BACK_SH,
    DEAL_BG,
    layout,
    drawChain,
    lockScene,
    fxScene,
    drawScene,
    previewDeal,
    dealPlan,
    keyframes,
    AV,
    TRAY,
    RING,
    PAL,
    grad,
    colOf,
    css,
    NAMES,
    REACTS,
    STICKERS,
    stickerPack,
    stickerOf,
    stickerImg,
    WINS,
    WF,
    ART,
    artSvg,
    artDraw,
    BRAND,
    botBoo,
    winScene,
    winFonts,
    winPoster,
    crown,
    AR,
    words,
    setLang,
    get lang() {
      return lang;
    },
    t,
    num,
    resultWords,
    HUE,
    HUE_W45,
    plus,
    calcOf
  };
})();
