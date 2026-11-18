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
  const say = (g, p, arr) => {
    if (p == null || p < 0 || p >= g.n || !g.bot[p]) return;
    g.say = { p, text: arr[Math.floor(Math.random() * arr.length)] };
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
      if (g.bot[p]) say(g, p, ["Domino!", "That is it!", "Yes!"]);
      else {
        const m = g.teams ? witness(g, p, true) : -1;
        if (m >= 0) say(g, m, ["Nice one!", "Well played!"]);
        else say(g, witness(g, p, false), ["Ahh.", "Not again…"]);
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
    if (Math.random() < 0.7) say(g, p, ["Ugh.", "Nothing…", "I pass.", "Come on!"]);
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
    if (g.bot[st]) say(g, st, ["Locked!", "Closed."]);
    else say(g, witness(g, st, g.teams) >= 0 ? witness(g, st, g.teams) : witness(g, st, false), ["Locked…", "Hmm."]);
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
  const FONT = (fam, w, file, range) => "@font-face{font-family:'" + fam + "';font-style:normal;font-weight:" + w + ";font-display:swap;src:url(" + BASE + "fonts/" + file + ") format('woff2');unicode-range:" + range + "}";
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
    ["👏", "Nice one!"],
    ["😎", "Watch this."],
    ["⏳", "You are taking too long!"],
    ["😤", "Come on!"],
    ["😡", "What kind of move was that?!"],
    ["😴", "Wake me up when it is my turn."],
    ["😂", "Ha ha!"],
    ["😱", "No way!"],
    ["🤔", "Hmm…"],
    ["🙏", "Please, just one six."],
    ["☕", "Tea, anyone?"],
    ["🔥", "I am on fire!"],
    ["🫣", "Do not lock it!"],
    ["🤝", "Good game!"]
  ];
  const AR = {
    "Dominoes 151": "دومنة 151",
    "The table is on the TV. Your tiles are on your phone.": "الميز عالتلفزيون، وحجارك بموبايلك.",
    "Play from your phone": "العب من موبايلك",
    "Your tiles show on your phone. Tap one, or drag it up, when it is your turn.": "حجارك تطلع بموبايلك. من يجي دورك دوس على حجر، لو اسحبه لفوگ عالميز.",
    "Free games: a short match, first to 51. A host with Blokvane Pro plays to 101, 151 or 201.": "الألعاب المجانية: لعبة قصيرة على 51. المضيف اللي عنده Blokvane Pro يلعب على 101 لو 151 لو 201.",
    "Your tiles are on your phone. On your turn, play one that matches either open end of the chain on the TV.": "حجارك بموبايلك. بدورك ذب حجر يركب على وحدة من الصفحتين المفتوحة عالتلفزيون.",
    "Can't play? Draw from the pile until you can. With no pile, you pass.": "ما عندك؟ اسحب من الكومة لحد ما يركب. وإذا ماكو كومة: باص.",
    "Go out first and score the pips left in your opponents' hands.": "اللي يخلّص حجاره أول ياخذ نقاط الحجار اللي بقت بيد خصومه.",
    "If nobody can play, the game is locked: the fewest pips win.": "إذا محد يگدر يلعب تنقفل اللعبة: واللي بيده أقل نقاط يفوز.",
    "The match": "اللعبة",
    "Match": "اللعبة",
    "Turns": "الأدوار",
    "The table": "الميز",
    "Names": "الأسماء",
    "Teams, 2 vs 2": "فرق، 2 ضد 2",
    "Partners sit across from each other. All 28 tiles are dealt.": "الشريك يگعد گبال شريكه. تتوزّع الـ 28 حجر كلها.",
    "1 vs 1": "واحد ضد واحد",
    "Seven tiles each, 14 in the pile to draw from.": "كل واحد 7 حجار، و14 بالكومة للسحب.",
    "Three players, each alone": "ثلاثة، كلمن لروحه",
    "Seven tiles each, 7 in the pile to draw from.": "كل واحد 7 حجار، و7 بالكومة للسحب.",
    "Four players, each alone": "أربعة، كلمن لروحه",
    "Everyone plays for themselves. All 28 tiles are dealt.": "كلمن يلعب لروحه. تتوزّع الـ 28 حجر كلها.",
    "Pick your team on your phone: partners sit across": "اختار فريقك من موبايلك: الشريك گبال شريكه",
    "Everyone has their own score": "كلمن إله نقاطه",
    "Can't play? Draw from the pile until you can": "ما عندك؟ اسحب من الكومة لحد ما يركب",
    "Can't play? You pass": "ما عندك؟ باص",
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
    "A player with no tile that fits, and no pile to draw from, passes by themselves.": "اللاعب اللي ما عنده حجر يركب، والكومة خلصانة، ينباص وحده.",
    "The table, the tiles and the border can be changed at any time, even in the middle of a match.": "الميز والحجار والحاشية تتبدل بأي وكت، حتى بنص اللعبة.",
    "Seats with no phone are played by the computer. This is how well it plays.": "المقعد اللي ما عليه موبايل يلعبه الكومبيوتر. وهذا مستوى لعبه.",
    "Game speed": "سرعة اللعب",
    "How long a computer player thinks before it plays.": "شگد يفكّر لاعب الكومبيوتر گبل لا يلعب.",
    "Time for a turn": "وقت الدور",
    "When a player's time is up, a tile is played for them, so the game never waits.": "إذا خلص وقت اللاعب ينلعب حجر بداله، حتى اللعب ما يوگف.",
    "Auto pass when a player cannot play": "باص تلقائي إذا اللاعب ما عنده",
    "Auto start next round": "الجولة الجاية تبدي وحدها",
    "Off: the host starts each round from their phone.": "مطفي: المضيف يبدي كل جولة من موبايله.",
    "Highlight playable tiles": "بيّن الحجار اللي تركب",
    "On each phone, the tiles that can be played stand a little higher.": "بكل موبايل، الحجار اللي تركب ترتفع شوية.",
    "Player reactions": "تعليقات اللاعبين",
    "Speech bubbles on the TV, from the players' phones and from the computer players.": "كلام يطلع عالتلفزيون من موبايلات اللاعبين ومن لاعبين الكومبيوتر.",
    "Table": "الميز",
    "Tiles": "الحجار",
    "Deal animation": "حركة التوزيع",
    "Round end style": "شكل نهاية الجولة",
    "Lock animation": "حركة القفلة",
    "Table border": "حاشية الميز",
    "Names of the computer players": "أسماء لاعبين الكومبيوتر",
    "Teal felt": "چوخ تركوازي",
    "Green felt": "چوخ أخضر",
    "Burgundy felt": "چوخ عنّابي",
    "Walnut wood": "خشب جوز",
    "Ivory": "عاجي",
    "Color": "ملوّن",
    "Bone": "عظم",
    "Ebony": "أبنوس",
    "Maple": "قيقب",
    "Classic ivory": "عاجي كلاسيكي",
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
    "Dealing…": "دنوزّع الحجار…",
    "Dealing again…": "نعيد التوزيع…",
    "Round over": "خلصت الجولة",
    "Match over": "خلصت اللعبة",
    "{name} is thinking…": "{name} ديفكّر…",
    "{name} is away: the computer plays": "{name} مو يمنا: الكومبيوتر يلعب بداله",
    "{name} draws from the pile": "{name} ديسحب من الكومة",
    "{name} cannot play": "{name} ما عنده",
    "{name}'s turn": "دور {name}",
    "Your turn": "دورك! ذب حجرك",
    "Choose which end to play on": "على يا صفحة تلعبه؟",
    "No tile to play. Draw from the pile.": "ماكو حجر يركب. اسحب من الكومة.",
    "No legal move, passing…": "ماكو لعبة… باص.",
    "No legal move": "ماكو لعبة",
    "Pass": "باص",
    "Draw · {n}": "اسحب · {n}",
    "Pile · {n}": "الكومة · {n}",
    "{name} holds the {a}–{a} and starts.": "دبل {a} يم {name}، وهو يبدي.",
    "{name} starts.": "{name} يبدي.",
    "You hold the {a}–{a}. Play it to start.": "دبل {a} يمّك. ذبّه وابدي.",
    "You start. Play any tile.": "إنت تبدي. ذب أي حجر.",
    "Play on {n}": "عالـ {n}",
    "Draw a tile": "اسحب حجر",
    "Misdeal: {name} holds {n} doubles. Dealing again.": "توزيعة ما تصير: {name} بيده {n} دبل. نعيد التوزيع.",
    "Misdeal: {name} holds {n} tiles with a {k}. Dealing again.": "توزيعة ما تصير: {name} بيده {n} حجار بيها {k}. نعيد التوزيع.",
    "Locked": "انقفلت",
    "{name} closed the game": "{name} قفلها",
    "{name} locked the game": "{name} قفل اللعب",
    "Nobody can play. Counting the hands…": "محد يگدر يلعب. دنحسب الحجار…",
    "Blocked": "قفلة",
    "Blocked: a tie": "قفلة وتعادل",
    "Both teams hold {n} points. No points awarded.": "الفريقين بيدهم {n}. محد ياخذ نقاط.",
    "The lowest hands are tied at {n} points. No points awarded.": "أقل اثنين متعادلين على {n}. محد ياخذ نقاط.",
    "{name} went out": "{name} خلّص حجاره",
    "You went out": "خلّصت حجارك!",
    "{team} win the round, scoring {n} points.": "{team} أخذوا الجولة بـ {n} نقطة.",
    "{name} wins the round, scoring {n} points.": "{name} أخذ الجولة بـ {n} نقطة.",
    "Your team wins the round, scoring {n} points.": "فريقك أخذ الجولة بـ {n} نقطة.",
    "You win the round, scoring {n} points.": "الجولة إلك، بـ {n} نقطة.",
    "{name} starts the next round.": "{name} يبدي الجولة الجاية.",
    "You start the next round.": "إنت تبدي الجولة الجاية.",
    "{name} locked the game and starts the next round.": "{name} قفلها، وهو يبدي الجولة الجاية.",
    "You locked the game and start the next round.": "إنت قفلتها، وإنت تبدي الجولة الجاية.",
    "with {name}": "ويّا {name}",
    "Tap a tile to play it, or drag it up here.": "دوس على الحجر وذبّه، لو اسحبه لهنا.",
    "The table is on the TV. Your tiles are here.": "الميز عالتلفزيون، وحجارك هنا.",
    "Drop it here to play": "عوفه هنا وينذب",
    "Play it": "ذبّه",
    "1 tile": "حجر واحد",
    "{n} tiles": "{n} حجار",
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
    "No tiles left": "ما بقى عنده حجر",
    "You have {n} points left in your hand.": "بقى بيدك {n} نقطة.",
    "You have no tiles left.": "ما بقى بيدك شي.",
    "Tie": "تعادل",
    "Us": "إحنا",
    "Them": "همّه",
    "You": "إنت",
    "Your team": "فريقك",
    "Next round": "الجولة الجاية",
    "Next round ({n})": "الجولة الجاية ({n})",
    "{name} starts the next round": "{name} يمشّي الجولة الجاية",
    "The host starts the next round.": "المضيف يمشّي الجولة الجاية.",
    "{team} win the match": "{team} فازوا باللعبة",
    "{name} wins the match": "{name} فاز باللعبة",
    "win the match!": "فازوا باللعبة!",
    "wins the match!": "فاز باللعبة!",
    "In 1 round": "بجولة وحدة",
    "In {n} rounds": "بـ {n} جولات",
    "The winners": "الفايزين",
    "Moves this round": "لعبات هالجولة",
    "No moves yet this round.": "بعد ماكو لعب بهالجولة.",
    "Passed": "باص",
    "Drew 1 tile": "سحب حجر",
    "Drew {n} tiles": "سحب {n} حجار",
    "Play this turn for {name}": "العب هالدور بدال {name}",
    "You are watching this round. You get a seat when one is free.": "إنت تتفرّج بهالجولة. من يفرغ مكان تگعد.",
    "The table's look": "شكل الميز",
    "Deal animation: off, tiles appear at once": "حركة التوزيع مطفية: الحجار تطلع فد مرة",
    "Round end": "نهاية الجولة",
    "Round end: pop-up panel": "نهاية الجولة: لوحة",
    "Lock animation: off": "حركة القفلة مطفية",
    "Lock animation: gates": "حركة القفلة: بوابات",
    "Preview": "معاينة",
    "Computer player {n}": "لاعب الكومبيوتر {n}",
    "Every seat has a player: no computer players in this match.": "كل المقاعد بيها ناس: ماكو كومبيوتر بهاللعبة.",
    "Give each one a name, a color and a face. Leave a name empty and it gets an everyday American one.": "انطي كل واحد اسم ولون ووجه. وإذا تخلّي الاسم فارغ ياخذ اسم أمريكي عادي.",
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
    "I pass.": "باص.",
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
    "Good game!": "خوش لعب، عاشت إيدكم!"
  };
  let lang = "en";
  const setLang = (l) => {
    lang = l === "ar" ? "ar" : "en";
  };
  function words() {
    try {
      if (!window.BVI18N) return;
      const add = {};
      let n = 0;
      for (const k of Object.keys(AR)) if (BVI18N.t("ar", k) === k && AR[k] !== k) {
        add[k] = AR[k];
        n++;
      }
      if (n) BVI18N.add("ar", add);
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
