// Made from gir-game.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change gir-game.js and run node tools/old-js.js again.
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
  const P = BVPLAYC;
  const G = (def) => BVPLAY.game(def);
  const SRC = document.currentScript && document.currentScript.src || "";
  const BASE = SRC.replace(/[^/]*$/, "");
  const VER = (SRC.match(/[?&]v=(\w+)/) || [])[1] || "1";
  let bankP = null;
  function loadBank() {
    if (window.BVGIR) return Promise.resolve(window.BVGIR);
    if (!bankP) {
      bankP = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = BASE + "gir-data.js?v=" + VER;
        s.onload = () => window.BVGIR ? res(window.BVGIR) : rej(new Error("data"));
        s.onerror = () => {
          bankP = null;
          s.remove();
          rej(new Error("load"));
        };
        document.head.appendChild(s);
      });
    }
    return bankP;
  }
  const CATS = [
    { id: "animals", c: "#ff5a6e", d: "#c22a40", name: "Animals and Objects in the Stories of the Prophets", short: "Animals and Objects" },
    { id: "encyc", c: "#4c8dff", d: "#1d4fc4", name: "Prophets' Stories Encyclopedia", short: "Prophets' Stories Encyclopedia" },
    { id: "prophet", c: "#34d399", d: "#109466", name: "A Prophet's Identity", short: "A Prophet's Identity" },
    { id: "people", c: "#ffc93c", d: "#d08f12", name: "Characters in the Stories of the Prophets", short: "Characters in the Stories" }
  ];
  const catOf = (key) => CATS.findIndex((c) => c.id === key);
  const LV = { easy: 1, medium: 2, hard: 3 };
  const ASKED = "bvplay:gir:asked";
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
      localStorage.setItem(ASKED, l.slice(-3e3).join(","));
    } catch (e) {
    }
  }
  function picker(pool) {
    const rank = new Map(askedList().map((id, i) => [id, i]));
    const used = /* @__PURE__ */ new Set(), usedAns = /* @__PURE__ */ new Set();
    let last = -1;
    const ansKey = (q) => String(q.en[2][q.ok] || "").toLowerCase().replace(/\(.*?\)|\bprophet\b|\bthe\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
    const free = (cat, lv) => pool.filter((q) => !used.has(q.id) && (cat < 0 || q.cat === cat) && (!lv || q.lv === lv));
    function from(list, strict) {
      if (strict) list = list.filter((q) => !usedAns.has(ansKey(q)));
      if (!list.length) return null;
      const fresh = list.filter((q) => !rank.has(q.id));
      if (fresh.length) return P.pick(fresh);
      list.sort((a, b) => rank.get(a.id) - rank.get(b.id));
      return P.pick(list.slice(0, Math.max(1, Math.ceil(list.length / 4))));
    }
    const keep = (q) => {
      used.add(q.id);
      usedAns.add(ansKey(q));
      last = q.cat;
      return q;
    };
    const near = (lv) => lv === 1 ? [1, 2, 3] : lv === 2 ? [2, 1, 3] : lv === 3 ? [3, 2, 1] : [0];
    function take(cat, lv) {
      let c = cat;
      if (c < 0) {
        const have = CATS.map((x, i) => i).filter((i) => free(i, 0).length);
        const opts = have.filter((i) => i !== last);
        c = opts.length ? P.pick(opts) : have.length ? have[0] : -1;
      }
      for (const strict of [true, false]) for (const l of near(lv)) {
        const q = from(free(c, l), strict);
        if (q) return keep(q);
      }
      if (c >= 0) for (const strict of [true, false]) for (const l of near(lv)) {
        const q = from(free(-1, l), strict);
        if (q) return keep(q);
      }
      return null;
    }
    return { take, left: (cat) => free(cat, 0).length };
  }
  function stageLv(i, n, level) {
    if (LV[level]) return LV[level];
    const e = Math.ceil(n / 3), h = Math.floor(n / 3), m = n - e - h;
    return i < e ? 1 : i < e + m ? 2 : 3;
  }
  const MODES = [
    ["most", "Most correct", "Everyone answers every question. The most right answers wins."],
    ["clues", "Clue by clue", "The clues show one at a time. Answer early for more points: 100 with one clue, down to 25 with all four."],
    ["turns", "Team turns", "Teams take turns: each question goes to one team, and every team gets the same number of questions."],
    ["spin", "Team spin", "Teams take turns, and the team whose turn it is spins the wheel for every question."],
    ["knockout", "Knockout", "One wrong answer and you are out. The last one standing wins."],
    ["lives", "3 lives", "Like Knockout, but you can miss twice. The third miss puts you out."],
    ["race", "Race to a number", "The first player to get that many right wins."],
    ["first", "First right takes the points", "Only the fastest right answer scores."]
  ];
  const TEAMED = (m) => m === "turns" || m === "spin";
  const ELIM = (m) => m === "knockout" || m === "lives";
  const helpSet = (mode) => [["fifty", "✂️"], ["hint", "💡"], ["auto", "🪄"], ["boost", ELIM(mode) ? "🛡️" : "×2"]];
  const boostName = (mode) => ELIM(mode) ? "Shield" : "Double points";
  function howto(s) {
    const mode = s.mode || "most", wheel2 = mode === "spin" || s.cat === "mix" && s.wheel !== "off";
    const out = [
      ["🔎", "Four clues show on the TV about someone or something from the Stories of the Prophets."],
      ["📱", +s.sec ? "Pick the right answer on your phone before the time runs out." : "Pick the right answer on your phone. There is no clock: the question waits for everyone."]
    ];
    if (mode === "clues") out.push(["⏳", "The clues come one at a time. The sooner you answer, the more points: 100, 75, 50, then 25."]);
    else if (TEAMED(mode)) out.push(["👥", "Teams take turns. On your team's turn, everyone on it answers; the answer most of you pick counts for the team."]);
    else if (mode === "knockout") out.push(["⚔️", "One wrong answer and you are out. If everyone misses, nobody goes out."]);
    else if (mode === "lives") out.push(["❤️", "Everyone has 3 hearts. A wrong answer costs one; no hearts left and you are out."]);
    else if (mode === "race") out.push(["🏁", "The first one to reach the number of right answers wins."]);
    else if (mode === "first") out.push(["⚡", "Only the fastest right answer scores the points."]);
    else out.push(["✅", s.speed ? "Faster right answers score more" : "Every right answer scores 100 points."]);
    if (wheel2) out.push(["🎡", mode === "spin" ? "Before each question, the team whose turn it is spins the wheel on their phone: its color picks the category." : "The wheel picks the category by its color: red, blue, green or yellow."]);
    if (s.helpers !== false) out.push(["💡", ELIM(mode) ? "Each helper works once: remove two wrong answers, a hint, answer it for me, and a shield that keeps you in once." : "Each helper works once: remove two wrong answers, a hint, answer it for me, and double points."]);
    out.push(["🏆", ELIM(mode) ? "The last one standing wins." : mode === "race" ? "The first to get there wins." : TEAMED(mode) || s.teams ? "The team with the most points wins." : "The most points wins."]);
    return out;
  }
  const SVG = "http://www.w3.org/2000/svg";
  function star8(cx, cy, r1, r2) {
    const p = [];
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 8, r = i % 2 ? r2 : r1;
      p.push((cx + r * Math.cos(a)).toFixed(2) + " " + (cy + r * Math.sin(a)).toFixed(2));
    }
    return "M" + p.join("L") + "Z";
  }
  const starSvg = (cls, fill) => '<svg class="' + cls + '" viewBox="0 0 40 40" aria-hidden="true"><path d="' + star8(20, 20, 19, 12.5) + '" fill="' + (fill || "currentColor") + '"/><circle cx="20" cy="20" r="5.2" fill="#1d1050"/><circle cx="20" cy="20" r="2.6" fill="' + (fill || "currentColor") + '"/></svg>';
  function wheelSvg() {
    const seg = (i, col, deep) => {
      const a0 = (-135 + i * 90) * Math.PI / 180, a1 = (-45 + i * 90) * Math.PI / 180, r = 360;
      const x0 = 450 + r * Math.cos(a0), y0 = 450 + r * Math.sin(a0), x1 = 450 + r * Math.cos(a1), y1 = 450 + r * Math.sin(a1);
      const mid = (-90 + i * 90) * Math.PI / 180, fx = 450 + 180 * Math.cos(mid), fy = 450 + 180 * Math.sin(mid);
      const sx = 450 + 230.4 * Math.cos(mid), sy = 450 + 230.4 * Math.sin(mid);
      const dots = [-0.38, 0, 0.38].map((k) => {
        const a = mid + k * 0.42, rr = k ? 312 : 324;
        return '<circle cx="' + (450 + rr * Math.cos(a)).toFixed(1) + '" cy="' + (450 + rr * Math.sin(a)).toFixed(1) + '" r="4.5" fill="#fff" fill-opacity=".45"/>';
      }).join("");
      return '<radialGradient id="gs' + i + '" gradientUnits="userSpaceOnUse" cx="450" cy="450" r="360" fx="' + fx.toFixed(1) + '" fy="' + fy.toFixed(1) + '"><stop offset="0" stop-color="' + col + '"/><stop offset=".75" stop-color="' + col + '"/><stop offset="1" stop-color="' + deep + '"/></radialGradient><path d="M450 450L' + x0.toFixed(2) + " " + y0.toFixed(2) + "A360 360 0 0 1 " + x1.toFixed(2) + " " + y1.toFixed(2) + 'Z" fill="url(#gs' + i + ')"/><path d="' + star8(sx, sy, 46, 26) + '" fill="#fff" fill-opacity=".2" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><path d="' + star8(sx, sy, 26, 17) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/><circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="7" fill="#fff" fill-opacity=".65"/>' + dots;
    };
    let defs = "", body = "";
    CATS.forEach((c, i) => {
      const s = seg(i, c.c, c.d);
      const k = s.indexOf("</radialGradient>") + 17;
      defs += s.slice(0, k);
      body += s.slice(k);
    });
    let rays = "";
    for (const a of [-135, -45, 45, 135]) {
      const t = a * Math.PI / 180, x = 450 + 360 * Math.cos(t), y = 450 + 360 * Math.sin(t);
      rays += '<path d="M450 450L' + x.toFixed(2) + " " + y.toFixed(2) + '" stroke="#1a0e3e" stroke-width="8" stroke-opacity=".5"/><path d="M450 450L' + x.toFixed(2) + " " + y.toFixed(2) + '" stroke="url(#wg)" stroke-width="4"/>';
    }
    let bulbs = "";
    for (let i = 0; i < 32; i++) {
      const t = i * Math.PI / 16, x = 450 + 398 * Math.cos(t), y = 450 + 398 * Math.sin(t);
      bulbs += '<g class="bulb ' + (i % 2 ? "b1" : "b0") + '"><circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="14" fill="url(#halo)" class="h"/><circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="7.5" fill="#5a3a08"/><circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="6" fill="url(#bulb)" class="l"/></g>';
    }
    const grads = '<linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c4"/><stop offset=".35" stop-color="#ffc93c"/><stop offset=".7" stop-color="#b9771a"/><stop offset="1" stop-color="#ffe08a"/></linearGradient><linearGradient id="wg2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4c4"/><stop offset=".5" stop-color="#d89a2a"/><stop offset="1" stop-color="#8a5410"/></linearGradient><radialGradient id="shine" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".92" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient><linearGradient id="gloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient><radialGradient id="bulb"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#fff3c0"/><stop offset="1" stop-color="#ffb31f"/></radialGradient><radialGradient id="halo"><stop offset="0" stop-color="#ffe08a" stop-opacity=".9"/><stop offset="1" stop-color="#ffc93c" stop-opacity="0"/></radialGradient>';
    const hub = '<svg class="gw-hub" viewBox="0 0 200 200"><path d="' + star8(100, 100, 85, 66).replace(/^M/, "M") + '" fill="url(#wg)" stroke="#5a3a08" stroke-width="2"/><path d="' + star8(100, 100, 72, 58) + '" fill="none" stroke="#fff4c4" stroke-opacity=".7" stroke-width="1.5"/><circle cx="100" cy="100" r="58" fill="#1d1050" stroke="url(#wg2)" stroke-width="6"/><circle cx="100" cy="100" r="48" fill="none" stroke="#ffc93c" stroke-opacity=".5" stroke-width="1" stroke-dasharray="2 4"/></svg><svg class="gw-boo" viewBox="0 0 60 60"><path d="M14 22C14 3 46 3 46 22V46.8Q46 50 42.5 50Q39 50 39 46.8A3.25 2.8 0 0 0 32.5 46.8Q32.5 50 29.25 50Q26 50 26 46.8A2.75 2.8 0 0 0 20.5 46.8Q20.5 50 17.25 50Q14 50 14 46.8Z" fill="#fff"/><ellipse cx="23.6" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><ellipse cx="35.4" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><circle cx="23.9" cy="22.6" r="1.3" fill="#fff"/><circle cx="35.7" cy="22.6" r="1.3" fill="#fff"/></svg>';
    const pin = '<svg class="gw-pin" viewBox="0 0 110 140"><path d="M55 136C40 100 14 80 14 50C14 22 32 6 55 6C78 6 96 22 96 50C96 80 70 100 55 136Z" fill="url(#wg)" stroke="#5a3a08" stroke-width="2.5"/><path d="M55 116C44 92 26 76 26 52C26 30 39 18 55 18C71 18 84 30 84 52C84 76 66 92 55 116Z" fill="#c2306e"/><path d="' + star8(55, 50, 18, 9.5) + '" fill="url(#wg)"/><circle cx="55" cy="50" r="5" fill="#c2306e"/></svg>';
    return '<div class="gw-glow"></div><div class="gw-turn"><svg viewBox="0 0 900 900"><defs>' + grads + defs + "</defs>" + body + '<circle cx="450" cy="450" r="360" fill="url(#shine)"/>' + rays + '</svg></div><svg class="gw-rim" viewBox="0 0 900 900"><defs>' + grads + '</defs><circle cx="450" cy="450" r="420" fill="none" stroke="#0a0620" stroke-width="10" stroke-opacity=".6"/><circle cx="450" cy="450" r="398" fill="none" stroke="url(#wg2)" stroke-width="44"/><circle cx="450" cy="450" r="398" fill="none" stroke="#2a1660" stroke-width="30"/><circle cx="450" cy="450" r="419" fill="none" stroke="url(#wg)" stroke-width="3"/><circle cx="450" cy="450" r="377" fill="none" stroke="url(#wg)" stroke-width="3"/><circle cx="450" cy="450" r="366" fill="none" stroke="url(#wg2)" stroke-width="12"/><circle cx="450" cy="450" r="360" fill="none" stroke="#1a0e3e" stroke-width="2"/>' + bulbs + '<path d="M90 450A360 360 0 0 1 810 450A432 324 0 0 0 90 450Z" fill="url(#gloss)" opacity=".7"/></svg>' + hub + pin;
  }
  const div = (K, cls, parent, text) => K.el("div", cls, parent, text);
  const SH = {
    T_out: "23.6,1.0 919.4,1.0 941.9,45.0 919.4,89.0 23.6,89.0 1.1,45.0",
    T_in: "28.2,8.6 914.8,8.6 933.4,45.0 914.8,81.4 28.2,81.4 9.6,45.0",
    R_out: "22.5,0.9 297.5,0.9 318.9,34.0 297.5,67.1 22.5,67.1 1.1,34.0",
    R_in: "26.6,6.9 293.4,6.9 310.9,34.0 293.4,61.1 26.6,61.1 9.1,34.0"
  };
  const A_OUT = "M5.5 30.5L24.5 12Q35.6 0.9 48 0.9H419.6L442 30.5L419.6 60.1H48Q35.6 60.1 24.5 49Z";
  const A_IN = "M17 30.5L31.5 16Q41.4 6.1 56 6.1H416.6L435.6 30.5L416.6 54.9H56Q41.4 54.9 31.5 45Z";
  const grad = (id, c) => '<linearGradient id="' + id + '" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="' + c + '" stop-opacity=".95"/><stop offset=".1" stop-color="' + c + '" stop-opacity=".85"/><stop offset=".14" stop-color="' + c + '" stop-opacity=".78"/><stop offset=".22" stop-color="' + c + '" stop-opacity=".56"/><stop offset=".3" stop-color="' + c + '" stop-opacity=".47"/><stop offset=".4" stop-color="' + c + '" stop-opacity=".38"/><stop offset=".46" stop-color="' + c + '" stop-opacity=".28"/><stop offset=".5" stop-color="' + c + '" stop-opacity=".16"/><stop offset=".535" stop-color="' + c + '" stop-opacity=".05"/><stop offset=".56" stop-color="' + c + '" stop-opacity="0"/></linearGradient>';
  const lin = (id, a, b, stops) => '<linearGradient id="' + id + '" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '">' + stops.map((s) => '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>').join("") + "</linearGradient>";
  const DEFS = '<svg class="gq-defs" width="0" height="0" aria-hidden="true"><defs>' + lin("gqT", [0, 0], [0, 1], [[0, "#20145a"], [0.5, "#1b114a"], [1, "#110a39"]]) + lin("gqR", [0, 0], [0, 1], [[0, "#221749"], [1, "#1c1342"]]) + lin("gqGR", [0, 0], [1, 1], [[0, "#fff3a3"], [0.45, "#ffd447"], [1, "#c9901a"]]) + lin("gqGL", [0, 0], [1, 0], [[0, "#d49530"], [0.13, "#ddad56"], [0.28, "#ffe594"], [0.38, "#fddb82"], [0.5, "#f2c155"], [0.6, "#e7aa2e"], [0.7, "#efc055"], [0.82, "#fad77d"], [0.92, "#ffe08a"], [1, "#d49530"]]) + '<radialGradient id="gqBd" cx=".35" cy=".35" r=".75"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".5" stop-color="#f5be35"/><stop offset="1" stop-color="#c98a1e"/></radialGradient>' + lin("gqSA", [0, 0], [1, 1], [[0, "#ffe377"], [0.5, "#f6c33e"], [1, "#d99a22"]]) + lin("gqSB", [0, 0], [1, 1], [[0, "#ffd955"], [0.55, "#e8a92a"], [1, "#c98616"]]) + grad("gqA", "#ff5a6e") + grad("gqB", "#4c8dff") + grad("gqC", "#ffc93c") + grad("gqD", "#34d399") + grad("gqOK", "#2fd59a") + "</defs></svg>";
  const TITLE_SVG = '<svg class="bnr" viewBox="0 0 943 90" preserveAspectRatio="none" aria-hidden="true"><polygon points="' + SH.T_out + '" fill="url(#gqT)"/><polygon class="o" points="' + SH.T_out + '" fill="none" stroke-width="2"/><polygon class="i" points="' + SH.T_in + '" fill="none" stroke-width="1.1"/></svg>';
  const ANS_SVG = (L) => '<svg class="bnr" viewBox="0 0 458 61" preserveAspectRatio="none" aria-hidden="true"><path class="f" d="' + A_OUT + '"/><path class="g" d="' + A_OUT + '" fill="url(#gq' + L + ')"/><path class="o" d="' + A_OUT + '" fill="none" stroke-width="1.8"/><path class="i" d="' + A_IN + '" fill="none" stroke-width="1.1"/><path class="sp" d="' + star8(21.5, 30.5, 6.4, 2.6) + '"/></svg>';
  let beads = "";
  for (let k = 0; k < 12; k++) {
    const a = k * Math.PI / 6;
    beads += '<circle cx="' + (38 + 30 * Math.cos(a)).toFixed(2) + '" cy="' + (38 + 30 * Math.sin(a)).toFixed(2) + '" r="2.5"/>';
  }
  const DOT_SVG = '<svg class="dsk" viewBox="0 0 76 76" aria-hidden="true"><circle cx="38" cy="38" r="34" fill="#0d0826"/><g class="bd" fill="url(#gqBd)">' + beads + '</g><circle cx="38" cy="38" r="26.1" fill="none" stroke="#000026" stroke-width="1.2"/><circle class="gr" cx="38" cy="38" r="23.6" fill="none" stroke="url(#gqGR)" stroke-width="4.2"/><circle class="c" cx="38" cy="38" r="21.6"/><circle cx="38" cy="38" r="21" fill="none" stroke="#000" stroke-opacity=".12" stroke-width="1.2"/></svg>';
  const ROW_SVG = '<svg class="bnr" viewBox="0 0 320 68" preserveAspectRatio="none" aria-hidden="true"><polygon points="' + SH.R_out + '" fill="url(#gqR)"/><polygon class="o" points="' + SH.R_out + '" fill="none" stroke-width="1.8"/><polygon class="i" points="' + SH.R_in + '" fill="none" stroke-width="1"/></svg>';
  const MEDAL = '<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="16.8" fill="#1a1040" stroke="#e39a22" stroke-width="1.6"/><path d="' + star8(18, 18, 12.9, 6.6) + '" fill="#ffc93c"/><circle cx="18" cy="18" r="3.7" fill="#1a1040"/><circle cx="18" cy="18" r="1.7" fill="#ffc93c"/></svg>';
  const SCORE_STAR = '<svg viewBox="0 0 58 58" aria-hidden="true"><path d="M29 0.4L57.6 29L29 57.6L0.4 29Z" fill="url(#gqSB)" stroke="#a86d12" stroke-width=".7"/><rect x="8.8" y="8.8" width="40.4" height="40.4" fill="url(#gqSA)" stroke="#a86d12" stroke-width=".7"/><circle cx="29" cy="29" r="19.3" fill="#1d1048"/><circle cx="29" cy="29" r="16.8" fill="none" stroke="#c9a24e" stroke-width=".9"/></svg>';
  const NODE_SVG = '<svg viewBox="0 0 40 40" aria-hidden="true"><path class="s" d="' + star8(20, 20, 19.2, 10.6) + '"/><circle class="r" cx="20" cy="20" r="6.4"/><circle class="d" cx="20" cy="20" r="2.9"/></svg>';
  function sideBoard(K, parent, o) {
    const b = div(K, "gq-side", parent);
    const hd = div(K, "gq-sbh", b);
    K.el("i", "", hd);
    K.el("b", "", hd, o.title);
    const list = div(K, "gq-rows", b);
    const rows = /* @__PURE__ */ new Map();
    const teams = o.teams;
    const count = teams ? teams.length : K.players().length;
    list.classList.add(count <= 6 ? "big" : count <= 12 ? "mid" : count <= 24 ? "two" : "three");
    b.classList.toggle("many", count > 6);
    const row = (id, color, name, avatars) => {
      let r = rows.get(id);
      if (r) return r;
      r = div(K, "gq-p", list);
      r.style.setProperty("--pc", color);
      r.insertAdjacentHTML("afterbegin", ROW_SVG);
      div(K, "dm t", r);
      div(K, "dm b", r);
      const av = div(K, "av", r);
      if (avatars.length === 1) {
        const im = K.el("img", "", av);
        im.src = avatars[0];
        im.alt = "";
      } else {
        av.classList.add("team");
        for (const a of avatars.slice(0, 4)) {
          const im = K.el("img", "", av);
          im.src = a;
          im.alt = "";
        }
      }
      K.el("i", "ok", av, "✓");
      K.el("b", "", r, name);
      r._h = K.el("span", "hearts", r);
      const st = div(K, "sc", r);
      st.innerHTML = SCORE_STAR;
      r._pts = K.el("span", "", st);
      rows.set(id, r);
      return r;
    };
    const draw = (answered, res) => {
      if (teams) {
        const tp = (t) => o.teamPts && t[0] in o.teamPts ? o.teamPts[t[0]] : K.players().filter((p) => p.team === t[0]).reduce((n, p) => n + p.score, 0);
        const list2 = teams.slice().sort((a, c) => tp(c) - tp(a));
        for (const t of list2) {
          const mem = K.players().filter((p) => p.team === t[0]);
          const r = row("t-" + t[0], t[2], t[4] || t[3], mem.length ? mem.map((p) => K.avatarUrl(p)) : [P.booUri("boo:party")]);
          list.appendChild(r);
          r._pts.textContent = K.num(tp(t));
          r.classList.toggle("turn", !!(o.turn && o.turn[0] === t[0]));
          const asked = mem.filter((p) => !p.out && !p.away);
          r.classList.toggle("done", !!(answered && asked.length && asked.every((p) => answered.has(p.id))));
          r.classList.remove("right", "miss");
          if (res && res.has("t-" + t[0])) r.classList.add(res.get("t-" + t[0]));
        }
        return;
      }
      const ps = K.players().slice().sort((a, c) => c.score - a.score || (a.out ? 1 : 0) - (c.out ? 1 : 0));
      for (const [id, r] of rows) if (!ps.some((p) => p.id === id)) {
        r.remove();
        rows.delete(id);
      }
      for (const p of ps) {
        const r = row(p.id, p.color, p.name, [K.avatarUrl(p)]);
        list.appendChild(r);
        r._pts.textContent = K.num(p.score);
        r._h.textContent = o.lives ? "♥".repeat(Math.max(0, p.lives)) : "";
        r.classList.toggle("done", !!(answered && answered.has(p.id)));
        r.classList.toggle("out", !!p.out);
        r.classList.remove("right", "miss");
        if (res && res.has(p.id)) r.classList.add(res.get(p.id));
      }
    };
    draw(/* @__PURE__ */ new Set());
    div(K, "gq-boo boo-slot", b);
    return { node: b, draw };
  }
  const qMode = (on) => {
    document.body.classList.toggle("gir-q", !!on);
  };
  function qView(K, o) {
    return __async(this, null, function* () {
      const body = K.view(null);
      body.classList.add("gq");
      qMode(true);
      if (o.mode === "clues") body.classList.add("cluemode");
      div(K, "gq-bg", body);
      div(K, "gq-frame", body);
      body.insertAdjacentHTML("beforeend", DEFS);
      const top = div(K, "gq-top", body);
      const num = div(K, "gq-num", top);
      const bi = K.el("img", "", num);
      bi.src = P.booUri("boo:party");
      bi.alt = "";
      K.el("b", "", num, o.total ? yield K.tr("Question {n}/{total}", { n: K.num(o.num), total: K.num(o.total) }) : yield K.tr("Question {n}", { n: K.num(o.num) }));
      const prog = div(K, "gq-prog", top);
      const all = o.total || o.goal || 10, N = Math.min(all, 12), cur = Math.min(N, Math.round(o.num * N / all));
      for (let k = 0; k <= N; k++) {
        if (k) K.el("i", "ln" + (k <= cur ? " on" : ""), prog);
        const n = div(K, "nd" + (k < cur ? " past" : k === cur ? " now" : ""), prog);
        n.innerHTML = NODE_SVG;
      }
      const pts = div(K, "gq-pts", top);
      if (ELIM(o.mode)) pts.hidden = true;
      const ptsT = K.el("b", "", pts, "");
      const tw = div(K, "gq-clock", top);
      let ring = null, inf = null;
      if (o.sec) ring = K.ring(tw, o.sec, true);
      else inf = K.el("span", "inf", tw, "∞");
      const mid = div(K, "gq-mid", body);
      const main = div(K, "gq-main", mid);
      const board = sideBoard(K, mid, { title: yield K.tr("Scoreboard"), teams: o.teams, teamPts: o.teamPts, turn: o.turn, lives: o.mode === "lives" });
      const tb = div(K, "gq-title", main);
      tb.insertAdjacentHTML("afterbegin", TITLE_SVG);
      div(K, "dm t", tb);
      div(K, "dm b", tb);
      for (const k of ["a", "b"]) {
        const m = div(K, "med " + k, tb);
        m.innerHTML = MEDAL;
      }
      if (o.turn) {
        const tags = div(K, "gq-tags", tb);
        const tt = K.el("span", "turn", tags, yield K.tr("{team}'s turn", { team: yield K.tr(o.turn[3]) }));
        tt.style.setProperty("--tc", o.turn[2]);
      }
      const tt2 = K.el("span", "tt", tb, o.text.title);
      if ([...o.text.title].length > 26) tt2.classList.add("long");
      K.el("div", "gq-lbl c", main, yield K.tr("The four clues:"));
      const cg = div(K, "gq-clues", main);
      const clues = o.text.clues.map((c, i) => {
        const x = div(K, "gq-clue pre n" + (i + 1), cg);
        K.el("b", "", x, K.num(i + 1));
        K.el("span", "", x, c);
        if ([...c].length > 64) x.classList.add("long");
        return x;
      });
      K.el("div", "gq-lbl a", main, yield K.tr("Choose the right answer:"));
      const ag = div(K, "gq-ans", main);
      const LET = BVI18N.letters(K.lang);
      const cells = o.opts.map((t, i) => {
        const a = div(K, "gq-a pre " + "ABCD"[i], ag);
        a.insertAdjacentHTML("afterbegin", ANS_SVG("ABCD"[i]));
        const dot = div(K, "dot", a);
        dot.innerHTML = DOT_SVG;
        K.el("b", "", dot, LET[i] || "ABCD"[i]);
        K.el("span", "t", a, t);
        if ([...t].length > 24) a.classList.add("long");
        return { node: a, who: K.el("span", "who", a) };
      });
      const fx = div(K, "gq-fx", main);
      fitQ(body, main);
      K.boo("happy");
      return {
        body,
        main,
        board,
        ring,
        inf,
        cells,
        clues,
        fx,
        clock: tw,
        setPts(n) {
          ptsT.textContent = n;
          pts.classList.remove("bump");
          void pts.offsetWidth;
          pts.classList.add("bump");
        },
        showClue(i) {
          return __async(this, null, function* () {
            const c = clues[i];
            if (!c) return;
            c.classList.remove("pre");
            c.classList.add("pop");
          });
        },
        showAnswers(gap) {
          return __async(this, null, function* () {
            for (const c of cells) {
              if (K.over()) break;
              c.node.classList.remove("pre");
              c.node.classList.add("pop");
              yield K.sleep(gap);
            }
          });
        }
      };
    });
  }
  function fitQ(body, main) {
    const over = () => main.scrollHeight > main.clientHeight + 1;
    for (const k of ["f1", "f2", "f3"]) {
      if (!over()) return;
      body.classList.add(k);
    }
  }
  function showWho(K, cell, ids) {
    const ps = ids.map((id) => K.player(id)).filter(Boolean);
    for (const p of ps.slice(0, ps.length > 6 ? 5 : 6)) {
      const im = K.el("img", "", cell.who);
      im.src = K.avatarUrl(p);
      im.alt = "";
    }
    if (ps.length > 6) K.el("i", "", cell.who, "+" + K.num(ps.length - 5));
  }
  function intro(K, o) {
    return __async(this, null, function* () {
      const body = K.view(null);
      body.classList.add("gi");
      qMode(false);
      if (o.big || o.last) div(K, "gi-rays", body);
      const box = div(K, "gi-box" + (o.big ? " big" : "") + (o.last ? " fin" : ""), body);
      const med = div(K, "gi-med", box);
      med.innerHTML = '<svg viewBox="0 0 200 200"><path d="' + star8(100, 100, 96, 74) + '" fill="url(#giG)" stroke="#5a3a08" stroke-width="2"/><path d="' + star8(100, 100, 82, 64) + '" fill="none" stroke="#fff4c4" stroke-opacity=".7" stroke-width="1.5"/><circle cx="100" cy="100" r="62" fill="#1d1050"/><defs><linearGradient id="giG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c4"/><stop offset=".4" stop-color="#ffc93c"/><stop offset=".75" stop-color="#b9771a"/><stop offset="1" stop-color="#ffe08a"/></linearGradient></defs></svg>';
      K.el("b", "", med, K.num(o.num));
      K.el("div", "gi-t", box, o.total ? yield K.tr("Question {n} / {total}", { n: K.num(o.num), total: K.num(o.total) }) : yield K.tr("Question {n}", { n: K.num(o.num) }));
      const c = K.el("div", "gi-c", box, yield K.tr(CATS[o.cat].name));
      c.style.setProperty("--cc", CATS[o.cat].c);
      if (o.turn) {
        const t = K.el("div", "gi-turn", box, yield K.tr("{team}'s turn", { team: yield K.tr(o.turn[3]) }));
        t.style.setProperty("--tc", o.turn[2]);
      }
      if (o.last) K.el("div", "gi-rib", box, yield K.tr(o.race ? "One more right answer wins!" : o.last === 1 ? "Last question!" : "Last 2 questions!"));
    });
  }
  function rulesScreen(K, s, secs) {
    return __async(this, null, function* () {
      const body = K.view(null);
      body.classList.add("gr");
      qMode(false);
      const box = div(K, "gr-box", body);
      const hd = div(K, "gr-hd", box);
      const im = K.el("img", "", hd);
      im.src = "icons/gir.webp";
      im.alt = "";
      K.el("h1", "", hd, yield K.tr("How to play"));
      const ul = div(K, "gr-list", box);
      const lines = howto(s);
      for (let i = 0; i < lines.length; i++) {
        const r = div(K, "gr-r", ul);
        r.style.animationDelay = 0.25 + i * 0.35 + "s";
        K.el("i", "", r, lines[i][0]);
        K.el("span", "", r, yield K.tr(lines[i][1]));
      }
      const leg = div(K, "gr-leg", box);
      for (const c of CATS) {
        const x = div(K, "gr-c", leg);
        x.style.setProperty("--cc", c.c);
        K.el("i", "", x);
        K.el("span", "", x, yield K.tr(c.short));
      }
      const bar = div(K, "gr-bar", box);
      const fill = K.el("i", "", bar);
      fill.style.animationDuration = secs + "s";
    });
  }
  function wheel(K, o) {
    return __async(this, null, function* () {
      const body = K.view(null);
      body.classList.add("gw");
      qMode(false);
      const side = div(K, "gw-side", body);
      K.el("h1", "", side, yield K.tr("Spin the wheel!"));
      const st = K.el("p", "gw-st", side, o.who ? yield K.tr(o.whoText, o.whoVars) : yield K.tr("The wheel picks the category."));
      const leg = div(K, "gw-leg", side);
      const chips = CATS.map((c, i) => {
        const x = div(K, "gw-c" + (o.ok.includes(i) ? "" : " off"), leg);
        x.style.setProperty("--cc", c.c);
        K.el("i", "", x);
        K.el("span", "", x, "");
        return x;
      });
      for (let i = 0; i < CATS.length; i++) chips[i].lastChild.textContent = yield K.tr(CATS[i].name);
      const wb = div(K, "gw-wheel", body);
      wb.innerHTML = wheelSvg();
      const turn = wb.querySelector(".gw-turn");
      let on = 0;
      const blink = setInterval(() => {
        on ^= 1;
        wb.classList.toggle("alt", !!on);
      }, 600);
      let spun = false;
      if (o.who && o.who.length) {
        const got = yield K.ask({ kind: "spin", prompt: "", sec: 12, who: o.who, extra: { gir: 1, sl: "Spin the wheel!", wt: o.wt || null }, onAns: () => {
          if (!spun) {
            spun = true;
            K.close(K.qn());
          }
        } });
        const first = [...got.entries()].sort((a, b) => a[1].at - b[1].at)[0];
        if (first && K.player(first[0])) st.textContent = yield K.tr("{name} spins!", { name: "⁨" + K.player(first[0]).name + "⁩" });
        else st.textContent = yield K.tr("Spinning...");
      } else {
        yield K.sleep(1600);
        st.textContent = yield K.tr("Spinning...");
      }
      if (K.over()) {
        clearInterval(blink);
        return o.ok[0];
      }
      K.wait();
      const pick = P.pick(o.ok);
      const off = (360 - pick * 90) % 360;
      const deg = 360 * 6 + off + (Math.random() - 0.5) * 50;
      clearInterval(blink);
      wb.classList.add("spin");
      const fast = setInterval(() => {
        on ^= 1;
        wb.classList.toggle("alt", !!on);
      }, 120);
      turn.style.transition = "transform 6s cubic-bezier(.12,.72,.08,1)";
      requestAnimationFrame(() => {
        turn.style.transform = "rotate(" + deg + "deg)";
      });
      K.snd.fx("gSpin", { duck: 0.45 });
      yield K.sleep(6100);
      clearInterval(fast);
      wb.classList.remove("spin");
      wb.classList.add("landed");
      chips.forEach((c, i) => c.classList.toggle("win", i === pick));
      st.textContent = "";
      const res = K.el("div", "gw-res", side, yield K.tr(CATS[pick].name));
      res.style.setProperty("--cc", CATS[pick].c);
      yield K.sleep(2600);
      return pick;
    });
  }
  let teamPts = {};
  G({
    id: "gir",
    name: "Guess It Right!",
    emoji: "❓",
    sub: "Guess on your phone, see who got it right on the TV.",
    teams: true,
    teamsWin: true,
    endLook: () => "gir",
    // (the lobby as in the game's design: the QR code and the steps on one side, the players' arches on the other, no card)
    lobbyCard: false,
    seatRatio: 1.34,
    seatGap: 1.9,
    step: ["Send your guess", "Pick the right answer on your phone before the time runs out."],
    deco: "gir",
    // only in English and in Arabic: the screen and the phones (each player can pick the other one for their phone)
    langs: ["en", "ar"],
    mlang: true,
    // its own music: one tune in the lobby, two that take turns during the game, and one after it (and in the lobby
    // when a game was played); its own sounds for each moment
    sounds: ["gNext", "gEvery5", "gCorrect", "gWrong", "gTimesup", "gWin", "gSpin", "gLand", "gTick", "gTheme"],
    music: { lobby: "gTheme", again: "gAfter", after: "gAfter", afterDelay: 11.5, win: "gWin" },
    prep: () => {
      loadBank().catch(() => {
      });
    },
    teamsOn: (s) => s.mode !== "race",
    teamsForce: (s) => TEAMED(s.mode),
    teamScore: () => teamPts,
    winK: (teamMode) => teamMode ? "The winning team is" : "The winner is",
    winLine: (p) => String(p.id).startsWith("team-") || p.score !== (p.right || 0) * 100 ? ["{n} points", { n: p.score }] : ["{n} correct", { n: p.right || 0 }],
    winDeco: (cv, el) => {
      cv.classList.add("g-win");
      qMode(false);
      const lan = el("div", "g-lanterns", cv);
      for (const k of ["a", "b", "c", "d"]) {
        const l = el("div", "g-lan " + k, lan);
        l.innerHTML = '<svg viewBox="0 0 60 150"><line x1="30" y1="0" x2="30" y2="34" stroke="#d89a2a" stroke-width="2"/><circle cx="30" cy="38" r="5" fill="none" stroke="#ffc93c" stroke-width="2.4"/><path d="M18 46h24l4 10H14z" fill="#d89a2a"/><path d="M14 56h32l6 18-6 30H14L8 74z" fill="url(#lanG)" stroke="#8a5410" stroke-width="1.6"/><path d="M30 58v44M20 60l-5 14 5 28M40 60l5 14-5 28" stroke="#fff4c4" stroke-opacity=".55" stroke-width="1.2" fill="none"/><path d="M14 104h32l-4 9H18z" fill="#d89a2a"/><circle cx="30" cy="121" r="3" fill="#ffc93c"/><path d="' + star8(30, 80, 7, 3.5) + '" fill="#fff8d6" opacity=".9"/><defs><radialGradient id="lanG" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="#fff2b0"/><stop offset=".45" stop-color="#ffc93c"/><stop offset="1" stop-color="#d07a10"/></radialGradient></defs></svg>';
      }
      const geo = el("div", "g-geo", cv);
      geo.innerHTML = '<svg viewBox="-100 -100 200 200"><g fill="none" stroke="#ffc93c" stroke-opacity=".35" stroke-width=".5"><path d="' + star8(0, 0, 96, 70) + '"/><path d="' + star8(0, 0, 70, 52) + '"/><rect x="-62" y="-62" width="124" height="124"/><rect x="-62" y="-62" width="124" height="124" transform="rotate(45)"/><circle r="40"/></g></svg>';
    },
    rules: ["Four clues show on the TV about someone or something from the Stories of the Prophets.", "Pick the right answer on your phone before the time runs out.", "Each helper works once: remove two wrong answers, a hint, answer it for me, and double points."],
    howto,
    // the host's phone sets the game up in these steps, then a last one to check it all and start
    steps: [
      { t: "Game mode", s: "Mode", keys: ["lang", "mode"] },
      { t: "Teams and questions", s: "Questions", keys: ["teams", "teamN", "count", "perTeam", "raceTo", "level"] },
      { t: "Category", keys: ["cat", "wheel"] },
      { t: "Timing", s: "Time", keys: ["sec", "next", "wait"] },
      { t: "Extras", keys: ["helpers", "speed", "rules", "rulesSec"] }
    ],
    // the TV's lobby explains the mode the host picked
    spot: (s) => {
      const m = MODES.find((x) => x[0] === s.mode) || MODES[0];
      const team = TEAMED(m[0]), wheelOn = m[0] === "spin" || s.cat === "mix" && s.wheel !== "off";
      const help = s.helpers !== false ? ["💡", ELIM(m[0]) ? "4 helpers each, like a shield that keeps you in once" : "4 helpers each: remove two, a hint, answer it for me, double points"] : ["🧠", "No helpers: just you and the clues"];
      const bullets = {
        most: [["✅", s.speed ? "Faster right answers score more" : "Every right answer scores 100 points"], help, wheelOn ? ["🎡", "The wheel picks the category"] : ["🔎", "Four clues for every question"]],
        clues: [["⏳", "The clues show one at a time"], ["💯", "Answer early: 100, 75, 50 or 25 points"], help],
        turns: [["👥", "Each team answers its own questions"], ["⚖️", "Every team gets the same number of questions"], wheelOn ? ["🎡", "The wheel picks the category"] : help],
        spin: [["🎡", "Each team spins the wheel on its turn"], ["🎨", "The color picks the category"], ["⚖️", "Every team gets the same number of questions"]],
        knockout: [["⚔️", "One wrong answer and you are out"], ["🤝", "If everyone misses, nobody goes out"], help],
        lives: [["❤️", "Everyone starts with 3 hearts"], ["💔", "Each wrong answer costs a heart"], ["🏆", "The last one with a heart left wins"]],
        race: [["🎯", "First to {n} right answers wins"], ["⚡", "Two get there at once? The faster answer wins"], help],
        first: [["⚡", "The fastest right answer takes the points"], ["🎯", "A wrong answer costs nothing"], help]
      }[m[0]];
      const catL = m[0] === "spin" ? "The wheel picks" : s.cat !== "mix" ? (CATS[catOf(s.cat)] || CATS[0]).short : wheelOn ? s.wheel === "1" ? "Wheel every question" : "Wheel every 5 questions" : "All four categories";
      const facts = [team ? ["❓", "{n} questions per team", { n: +s.perTeam }] : m[0] === "race" ? ["🎯", "Race to {n}", { n: +s.raceTo }] : ["❓", "{n} questions", { n: +s.count }], +s.sec ? ["⏱️", "{n} s", { n: +s.sec }] : ["⏳", "No timer"], ["🗂️", catL]];
      if (LV[s.level]) facts.splice(1, 0, ["🎯", { easy: "Easy", medium: "Medium", hard: "Hard" }[s.level]]);
      if (team || s.teams && m[0] !== "race") facts.push(["👥", "{n} teams", { n: +s.teamN || 2 }]);
      return { key: m[0], icon: { most: "🏆", clues: "🔎", turns: "👥", spin: "🎡", knockout: "⚔️", lives: "❤️", race: "🏁", first: "⚡" }[m[0]], label: "Game mode", name: m[1], desc: m[2], bullets, vars: { n: +s.raceTo }, facts };
    },
    settings: [
      { key: "mode", label: "Game mode", type: "seg", look: "list", options: MODES, default: "most" },
      { key: "teams", label: "Teams", type: "toggle", default: false, desc: "Phones join a color team, and each team's points are added up.", when: ["mode", ["most", "clues", "knockout", "lives", "first"]] },
      { key: "teamN", label: "How many teams", type: "seg", options: [[2, "2"], [3, "3"], [4, "4"]], default: 2, when: { any: [["mode", ["turns", "spin"]], [["teams", true], ["mode", ["most", "clues", "knockout", "lives", "first"]]]] } },
      { key: "count", label: "How many questions", type: "number", min: 1, max: 100, unit: "questions", default: 10, when: ["mode", ["most", "clues", "knockout", "lives", "first"]] },
      { key: "perTeam", label: "Questions for each team", type: "number", min: 1, max: 50, unit: "questions", default: 5, when: ["mode", ["turns", "spin"]], desc: "Every team gets this many questions, in turns: the first question goes to the first team, the next one to the next team, and so on." },
      { key: "raceTo", label: "Race to", type: "number", min: 1, max: 30, unit: "right answers", default: 5, when: ["mode", "race"], desc: "The first player to get this many right answers wins. The questions keep coming until someone does." },
      { key: "level", label: "Difficulty", type: "seg", options: [["mix", "Easy to hard", "Starts easy and gets harder as you go."], ["easy", "Easy", "The stories everyone knows."], ["medium", "Medium", "For people who know the stories."], ["hard", "Hard", "For real experts of the stories."]], default: "mix" },
      { key: "cat", label: "Category", type: "seg", options: [["mix", "All four (mixed)", "Questions from all four categories."], ...CATS.map((c) => [c.id, c.short, c.name])], default: "mix", when: ["mode", "!spin"] },
      { key: "wheel", label: "Spin the wheel", type: "seg", options: [["5", "Every 5 questions", "The wheel picks the category for the next 5 questions."], ["1", "Every question", "The wheel picks the category of every question."], ["off", "Off", "No wheel: the questions come from all four categories."]], default: "5", when: [["cat", "mix"], ["mode", "!spin"]] },
      { key: "sec", label: "Time to answer", type: "number", min: 0, max: 300, quick: [15, 20, 30, 45], unit: "seconds", default: 20, desc: "0: no clock. Each question waits until everyone answers, and the host can show the answer any time." },
      { key: "next", label: "Next question", type: "seg", options: [["auto", "Automatic", "The next question starts by itself after a short wait."], ["host", "The host starts it", "The host taps Next question on their phone when everyone is ready."]], default: "auto" },
      { key: "wait", label: "Wait before the next question", type: "number", min: 1, max: 120, unit: "seconds", default: 6, when: ["next", "auto"] },
      { key: "helpers", label: "Helpers", type: "toggle", default: true, desc: "Each player can use each helper once: remove two wrong answers, a hint, answer it for me, double points." },
      { key: "speed", label: "Speed points", type: "toggle", default: false, desc: "Faster right answers score more", when: ["mode", ["most", "turns", "spin"]] },
      { key: "rules", label: "How to play first", type: "toggle", default: true, desc: "The TV shows how to play before the first question." },
      // (how long the rules stay on the TV, set by the host)
      { key: "rulesSec", label: "How long it shows", type: "number", min: 5, max: 120, unit: "seconds", default: 12, when: ["rules", true], desc: "The TV shows how to play for this many seconds, then the first question starts." }
    ],
    tv(K) {
      return __async(this, null, function* () {
        const s = K.settings, mode = s.mode || "most";
        const team = TEAMED(mode), race = mode === "race", clueMode = mode === "clues";
        const lg = K.lang === "ar" ? "ar" : "en", other = lg === "ar" ? "en" : "ar";
        teamPts = {};
        let bank = null;
        try {
          bank = yield Promise.race([loadBank(), new Promise((r, j) => setTimeout(() => j(new Error("slow")), 15e3))]);
        } catch (e) {
        }
        if (!bank || !Array.isArray(bank.q) || !bank.q.length) {
          const b = K.view(null);
          b.classList.add("gr");
          qMode(false);
          const box = div(K, "gr-box", b);
          K.el("h1", "", box, yield K.tr("The questions didn't load. Check the internet, then start the game again."));
          yield K.sleep(7e3);
          return K.players().slice().sort((a, c) => c.score - a.score);
        }
        const all = bank.q.map((r) => ({ id: r[0], cat: r[1], lv: r[2], ok: r[3], en: r[4], ar: r[5] }));
        const fixedCat = mode === "spin" || s.cat === "mix" ? -1 : catOf(s.cat);
        const wheelEvery = mode === "spin" ? 1 : s.cat !== "mix" || s.wheel === "off" ? 0 : s.wheel === "1" ? 1 : 5;
        let pool = fixedCat >= 0 ? all.filter((q) => q.cat === fixedCat) : all;
        if (K.free) pool = K.freePick(pool, (q) => q.id, (q) => q.lv);
        const pk = picker(pool);
        const TEAMS = P.TEAMS.slice(0, Math.min(4, +s.teamN || 2)).map((t) => [t[0], t[1], t[2], t[1] + " team"]);
        for (const t of TEAMS) t[4] = yield K.tr(t[3]);
        let order = team ? TEAMS.filter((t) => K.players().some((p) => p.team === t[0])) : [];
        if (team && !order.length) order = TEAMS.slice(0, 1);
        if (team) for (const t of TEAMS) teamPts[t[0]] = 0;
        const target = Math.max(1, +s.raceTo || 5);
        let n = team ? Math.max(1, +s.perTeam || 5) * order.length : race ? target * 6 : Math.max(1, +s.count || 10);
        if (!race) n = Math.min(n, pool.length - pool.length % (team ? order.length : 1));
        const total = race ? 0 : n;
        const sec = +s.sec || 0;
        const helpOn = s.helpers !== false;
        const speedOn = !!s.speed && ["most", "turns", "spin"].includes(mode);
        const qsec = clueMode && sec ? sec + 12 : sec;
        const HS = helpSet(mode);
        const showTeams = team || K.teamsOn();
        const teamsShown = showTeams ? TEAMS.filter((t) => team ? order.some((o) => o[0] === t[0]) : true) : null;
        K.snd.music("gPlay", { fadeIn: 1.5, fadeOut: 1.5 });
        if (s.rules !== false) {
          const rs = Math.max(5, Math.min(120, Math.round(+s.rulesSec) || 12));
          K.wait();
          yield rulesScreen(K, s, rs);
          yield K.sleep(rs * 1e3 + 500);
        }
        let cat = fixedCat, winner = null;
        const lead = () => Math.max(0, ...K.players().map((p) => p.right));
        for (let i = 0; i < n; i++) {
          if (K.over() || winner) break;
          if (ELIM(mode) && (!K.alive().length || K.players().length > 1 && K.alive().length <= 1)) break;
          const turn = team ? order[i % order.length] : null;
          const turnIds = () => turn ? K.players().filter((p) => p.team === turn[0] && !p.out).map((p) => p.id) : K.alive().map((p) => p.id);
          const num = i + 1;
          let spunNow = false;
          if (wheelEvery && i % wheelEvery === 0) {
            const ok2 = CATS.map((c, j) => j).filter((j) => pk.left(j) > 0);
            if (ok2.length) {
              if (i % 5 === 0) K.snd.sting("gEvery5", { duck: 0.65 });
              const host = K.players().find((p) => K.isHost(p.id));
              const who = turn ? turnIds() : host ? [host.id] : [];
              const whoText = turn ? "{team}, spin the wheel on your phone!" : "{name}, spin the wheel on your phone!";
              cat = yield wheel(K, { ok: ok2, who, whoText, whoVars: turn ? { team: yield K.tr(turn[3]) } : { name: "⁨" + (host ? host.name : "") + "⁩" }, wt: turn ? ["{team} is spinning the wheel. Watch the TV!", turn[3]] : null });
              spunNow = true;
            }
          }
          if (K.over()) break;
          const lv = race ? lead() < target / 3 ? 1 : lead() < 2 * target / 3 ? 2 : 3 : stageLv(i, n, s.level);
          const q = pk.take(wheelEvery ? cat : fixedCat, lv);
          if (!q) break;
          markAsked(q.id);
          const perm = P.shuffle([0, 1, 2, 3]);
          const T = q[lg], X = q[other];
          const opts = perm.map((j) => T[2][j]), ok = perm.indexOf(q.ok);
          const text = { title: T[0], clues: T[1] };
          const live = team ? K.players().filter((p) => turnIds().includes(p.id)) : K.alive();
          const needOther = K.players().some((p) => K.langOf(p.id) === other);
          const tr = needOther ? { [other]: { q: X[0], c: X[1], o: perm.map((j) => X[2][j]) } } : null;
          const rightIn = (id) => K.langOf(id) === other ? X[2][q.ok] : T[2][q.ok];
          const big = i % 5 === 0 && !spunNow, lastN = race ? lead() >= target - 1 ? 1 : 0 : n - i <= 2 ? n - i : 0;
          K.wait();
          K.snd.sting(big ? "gEvery5" : "gNext", { duck: 0.65 });
          yield intro(K, { num, total, cat: q.cat, turn, big, last: lastN, race });
          yield K.sleep(K.snd.on() ? big ? 4200 : 3e3 : 1800);
          if (K.over()) break;
          const v = yield qView(K, { num, total, goal: race ? target : n, q, text, opts, sec: qsec, mode, teams: teamsShown, teamPts, turn });
          const worth = [100, 75, 50, 25];
          let shown = clueMode ? 1 : 4;
          const ptsLabel = (k) => __async(this, null, function* () {
            return K.tr("Worth {n} points", { n: K.num(clueMode ? worth[k - 1] : 100) });
          });
          v.setPts(yield ptsLabel(shown));
          yield K.sleep(900);
          if (clueMode) {
            yield v.showClue(0);
            yield K.sleep(700);
            yield v.showAnswers(200);
          } else {
            for (let c = 0; c < 4; c++) {
              if (K.over()) break;
              yield v.showClue(c);
              yield K.sleep(650);
            }
            yield K.sleep(300);
            yield v.showAnswers(380);
          }
          if (K.over()) break;
          if (v.ring) v.ring.go();
          const answered = /* @__PURE__ */ new Set();
          let qn = -1;
          const offPlayers = K.onPlayers(() => v.board.draw(answered));
          const boosted = /* @__PURE__ */ new Set();
          const offHelp = K.on("help", (m, p) => __async(this, null, function* () {
            if (+m.n !== qn || p.out || p.helpers[m.h] || !HS.some((h) => h[0] === m.h) || !helpOn || !live.some((x) => x.id === p.id)) return;
            p.helpers[m.h] = true;
            const mine = K.langOf(p.id) === other ? X : T;
            if (m.h === "fifty") {
              const wrong = P.shuffle([0, 1, 2, 3].filter((x) => x !== ok)).slice(0, 2);
              K.sayTo(p.id, { k: "helped", n: qn, h: "fifty", hide: wrong });
            } else if (m.h === "hint") K.sayTo(p.id, { k: "helped", n: qn, h: "hint", text: mine[3] });
            else if (m.h === "auto") K.sayTo(p.id, { k: "helped", n: qn, h: "auto", pick: ok });
            else if (m.h === "boost") {
              boosted.add(p.id);
              K.sayTo(p.id, { k: "helped", n: qn, h: "boost", note: yield K.trFor(K.langOf(p.id), ELIM(mode) ? "Shield on: a wrong answer won't count against you this time." : "Double points on this question!") });
            }
          }));
          const open = !sec;
          const extra = { letters: true, tv: 1, gir: 1 };
          if (helpOn) {
            extra.helpers = HS;
            extra.hlab = { boost: boostName(mode) };
          }
          if (tr) extra.tr = tr;
          if (clueMode) {
            extra.clues = 1;
            extra.wl = "Worth {n} points";
            extra.w = worth[0];
          }
          if (turn) extra.wt = ["{team} is answering. Watch the TV!", turn[3]];
          const ansAt = /* @__PURE__ */ new Map();
          const asking = K.ask({ kind: "choice", prompt: "", opts, sec: qsec, open, who: live.map((p) => p.id), extra, onAns: (id) => {
            answered.add(id);
            ansAt.set(id, shown);
            v.board.draw(answered);
          } });
          qn = K.qn();
          const stopReveal = open ? hostReveal(K, qn) : null;
          let closed = false;
          const clueRun = clueMode ? (() => __async(this, null, function* () {
            for (let c = 1; c < 4; c++) {
              yield K.sleep(4e3);
              if (closed || K.over()) return;
              shown = c + 1;
              yield v.showClue(c);
              v.setPts(yield ptsLabel(shown));
              K.snd.fx("gTick", { vol: 0.8 });
              K.say({ k: "gclue", n: qn, c: shown, w: worth[c] });
            }
          }))() : null;
          const tuT = qsec ? K.after(qsec * 1e3, () => {
            if (closed || K.over() || answered.size >= live.length) return;
            K.snd.sting("gTimesup", { duck: 0.65 });
          }) : 0;
          const answers = yield asking;
          closed = true;
          if (tuT) tuT();
          if (stopReveal) stopReveal();
          offHelp();
          if (v.ring) v.ring.stop();
          v.clock.classList.add("done");
          const inPlay = live.filter((p) => answers.has(p.id) || !p.away);
          let teamPick = -1;
          if (turn) {
            const votes = [0, 0, 0, 0], firstAt = [Infinity, Infinity, Infinity, Infinity];
            for (const [, a] of answers) {
              const j = +a.v;
              if (j >= 0 && j < 4) {
                votes[j]++;
                firstAt[j] = Math.min(firstAt[j], a.at);
              }
            }
            const top = Math.max(...votes);
            if (top > 0) teamPick = [0, 1, 2, 3].filter((j) => votes[j] === top).sort((a, b) => firstAt[a] - firstAt[b])[0];
          }
          const rightN = turn ? teamPick === ok ? 1 : 0 : [...answers.values()].filter((a) => +a.v === ok).length;
          K.snd.sting(rightN ? "gCorrect" : "gWrong", { duck: 0.65 });
          yield K.sleep(K.snd.on() ? 900 : 250);
          v.cells.forEach((c, j) => c.node.classList.add(j === ok ? "right" : "dim"));
          if (turn && teamPick >= 0) {
            const tf = K.el("span", "tflag", v.cells[teamPick].node, yield K.tr(turn[3]));
            tf.style.setProperty("--tc", turn[2]);
            if (teamPick !== ok) v.cells[teamPick].node.classList.add("miss");
          }
          for (let j = 0; j < 4; j++) showWho(K, v.cells[j], [...answers].filter(([, a]) => +a.v === j).map(([id]) => id));
          for (let c = 0; c < 4; c++) v.showClue(c);
          const spare = ELIM(mode) && inPlay.length > 1 && !inPlay.some((p) => answers.has(p.id) && +answers.get(p.id).v === ok);
          if (spare) K.el("div", "pill", v.fx, yield K.tr("Everyone missed that one, so nobody goes out."));
          const res = /* @__PURE__ */ new Map();
          let first = null;
          const ptsFor = (p, a) => {
            let base = clueMode ? worth[Math.max(1, Math.min(4, ansAt.get(p.id) || 4)) - 1] : 100;
            if (speedOn) base = Math.round(100 * (0.5 + 0.5 * Math.max(0, 1 - (a.ms || 0) / ((qsec || 30) * 1e3))));
            return boosted.has(p.id) && !ELIM(mode) ? base * 2 : base;
          };
          if (turn) {
            const good = teamPick === ok;
            let tp = 0;
            if (good) {
              const okA = [...answers].filter(([, a]) => +a.v === ok);
              const best = okA.reduce((m2, [id, a]) => Math.max(m2, ptsFor(K.player(id) || { id }, a)), 100);
              tp = speedOn ? best : okA.some(([id]) => boosted.has(id)) ? 200 : 100;
              teamPts[turn[0]] += tp;
            }
            for (const p of K.players().filter((x) => x.team === turn[0])) {
              const a = answers.get(p.id);
              const mineOk = a && +a.v === ok;
              if (mineOk) {
                p.right++;
                if (!first || a.ms < first.ms) first = { p, ms: a.ms };
              }
              p.score = teamPts[turn[0]];
              K.result(p.id, { ok: good, pts: tp, score: p.score, right: rightIn(p.id), note: good ? "" : yield K.trFor(K.langOf(p.id), "Your team's answer wasn't right.") });
            }
            for (const p of K.players()) if (p.team && teamPts[p.team] != null) p.score = teamPts[p.team];
            res.set("t-" + turn[0], good ? "right" : "miss");
          } else {
            for (const p of inPlay) {
              const a = answers.get(p.id);
              const good = !!a && +a.v === ok;
              let pts = 0;
              if (good) {
                p.right++;
                p.streak++;
                if (!first || a.ms < first.ms) first = { p, ms: a.ms };
                if (mode !== "first") {
                  pts = ptsFor(p, a);
                  p.score += pts;
                }
              } else {
                p.streak = 0;
                const shield = boosted.has(p.id) && ELIM(mode);
                if (mode === "knockout" && !spare && !shield) p.out = true;
                if (mode === "lives" && !spare && !shield) {
                  p.lives--;
                  if (p.lives <= 0) p.out = true;
                }
              }
              if (mode !== "first" || !good) K.result(p.id, { ok: good, pts, score: p.score, out: p.out, lives: p.lives, right: rightIn(p.id) });
              res.set(p.id, good ? "right" : p.out ? "out" : "miss");
            }
            if (first && mode === "first") {
              const fp = ptsFor(first.p, answers.get(first.p.id));
              first.p.score += fp;
              K.result(first.p.id, { ok: true, pts: fp, score: first.p.score, first: true, right: rightIn(first.p.id) });
              for (const p of inPlay) if (p !== first.p && answers.get(p.id) && +answers.get(p.id).v === ok) K.result(p.id, { ok: true, pts: 0, score: p.score, right: rightIn(p.id), note: yield K.trFor(K.langOf(p.id), "Right, but someone was faster.") });
            }
          }
          if (first && !turn) yield firstBadge(K, v.fx, first.p, first.ms);
          if (race) {
            const msOf = (p) => (answers.get(p.id) || { ms: 1e9 }).ms;
            const done = inPlay.filter((p) => p.right >= target).sort((a, b) => msOf(a) - msOf(b));
            if (done.length) {
              winner = done[0];
              K.el("div", "pill", v.fx, "🏁 " + (yield K.tr("{name} crossed the finish line!", { name: "⁨" + winner.name + "⁩" })));
            }
          }
          K.boo(rightN && (turn || rightN >= inPlay.length / 2) ? "happy" : "sad");
          v.board.draw(null, res);
          offPlayers();
          const last = !!winner || !race && i >= n - 1 || race && i >= n - 1 || ELIM(mode) && (!K.alive().length || K.players().length > 1 && K.alive().length <= 1);
          if (last) yield K.sleep(5e3);
          else if (s.next === "host") yield hostNext(K, v, qn);
          else yield nextIn(K, v, Math.max(1, Math.min(120, Math.round(+s.wait) || 6)));
        }
        let ps = K.players().slice().sort((a, b) => b.score - a.score || b.right - a.right);
        if (race) ps = K.players().slice().sort((a, b) => (b === winner) - (a === winner) || b.right - a.right || b.score - a.score);
        if (ELIM(mode)) ps = K.players().slice().sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0) || b.right - a.right || b.score - a.score);
        return ps;
      });
    }
  });
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
})();
