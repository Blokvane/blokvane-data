// Made from emoji-game.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change emoji-game.js and run node tools/old-js.js again.
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
  if (typeof BVPLAY === "undefined" || typeof BVEMOT === "undefined") return;
  const P = BVPLAYC;
  const TPL = BVEMOT;
  const SRC = document.currentScript && document.currentScript.src || "";
  const BASE = SRC.replace(/[^/]*$/, "");
  const VER = (SRC.match(/[?&]v=(\w+)/) || [])[1] || "1";
  let bankP = null;
  function loadBank() {
    if (window.BVEMOD) return Promise.resolve(window.BVEMOD);
    if (!bankP) {
      bankP = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = BASE + "emoji-data.js?v=" + VER;
        s.onload = () => window.BVEMOD ? res(window.BVEMOD) : rej(new Error("data"));
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
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fill = (s, v) => v ? String(s).replace(/\{(\w+)\}/g, (m, k) => v[k] != null ? String(v[k]) : m) : String(s);
  const clamp = (n, a, b, d) => {
    n = Math.round(+n);
    return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d;
  };
  const rnd = (n) => Math.floor(Math.random() * n);
  const store = {
    get(k, d) {
      try {
        const v = JSON.parse(localStorage.getItem("bvplay:emoji:" + k));
        return v == null ? d : v;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("bvplay:emoji:" + k, JSON.stringify(v));
      } catch (e) {
      }
    }
  };
  const SEG = (() => {
    try {
      return new Intl.Segmenter(void 0, { granularity: "grapheme" });
    } catch (e) {
      return null;
    }
  })();
  const EMO_RX = /\uD83C[\uDDE6-\uDDFF]\uD83C[\uDDE6-\uDDFF]|[0-9#*]️?⃣|(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[ -⯿　-〿])(?:️|\uD83C[\uDFFB-\uDFFF])*(?:‍(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[ -⯿])(?:️|\uD83C[\uDFFB-\uDFFF])*)*/g;
  function splitEm(s) {
    const t = String(s || "").replace(/\s+/g, "");
    if (!t) return [];
    if (SEG) return [...SEG.segment(t)].map((x) => x.segment);
    return t.match(EMO_RX) || [t];
  }
  const alts = (x) => String(x || "").split("|").map((y) => y.trim()).filter(Boolean);
  const main = (x) => alts(x)[0] || "";
  const CATS = [
    ["movies", "Movies", "🎬"],
    ["tv", "TV and cartoons", "📺"],
    ["heroes", "Heroes and characters", "🦸"],
    ["tales", "Fairy tales and stories", "📖"],
    ["food", "Food and drinks", "🍕"],
    ["animals", "Animals", "🦁"],
    ["nature", "Nature and weather", "🌈"],
    ["things", "Things around us", "💡"],
    ["places", "Places and landmarks", "🗽"],
    ["sports", "Sports and games", "⚽"],
    ["jobs", "Jobs", "👩‍🚒"],
    ["transport", "Getting around", "🚀"],
    ["sayings", "Sayings", "💬"],
    ["holidays", "Holidays and parties", "🎉"],
    ["music", "Music and dance", "🎵"],
    ["space", "Space and science", "🪐"]
  ];
  const catIdx = (id) => CATS.findIndex((c) => c[0] === id);
  const MODES = [
    ["classic", "Classic", "Four answers on your phone, one is right. The faster you pick it, the more points."],
    ["type", "Type it", "No choices: type the answer yourself. Small typos still count, and a hint helps if nobody gets it."],
    ["reveal", "Slow reveal", "The emoji show up one at a time. Answer early for up to 100 points, or wait for more clues."],
    ["lightning", "Lightning", "Only a few seconds for each riddle, and lots of them. The first right answer gets a bonus."],
    ["survival", "Last one standing", "Everyone has lives. A wrong answer, or none, costs one. The last player standing wins."],
    ["kids", "Kids", "Easy riddles for little ones: big emoji, no clock, a cheer for every try, and nobody loses points."]
  ];
  const MODE_EM = { classic: "🎬🍕🦁", type: "⌨️💬✨", reveal: "🔍🎁❔", lightning: "⚡⏱️🔥", survival: "❤️🛡️🏆", kids: "🧸🎈🦄" };
  const modeOf = (s) => MODES.some((m) => m[0] === s.mode) ? s.mode : "classic";
  const choices = (m) => m !== "type";
  function howto(s) {
    const m = modeOf(s);
    const out = [["📺", "A row of emoji shows on the TV. What does it mean?"]];
    out.push(choices(m) ? ["📱", m === "kids" ? "Pick the answer on your phone: four choices, with big letters." : "Pick the answer on your phone: four choices, one is right."] : ["⌨️", "Type the answer on your phone. Small typos still count."]);
    if (m === "reveal") out.push(["🔍", "The emoji show up one at a time. The sooner you answer, the more points: up to 100."]);
    else if (m === "lightning") out.push(["⚡", "Just a few seconds for each riddle! The first right answer gets 50 extra points."]);
    else if (m === "survival") out.push(["❤️", "A wrong answer, or no answer, costs a life. Lose them all and you are out. If everyone misses, nobody loses one."]);
    else if (m === "kids") out.push(["🧸", "No clock and no losing: every try gets a cheer!"]);
    else if (m === "type" && s.hints !== false) out.push(["💡", "Nobody got it? A hint shows, and everyone gets one more try for half the points."]);
    else out.push([s.speed !== false ? "⚡" : "✅", s.speed !== false ? "Right answers score points. The faster you answer, the more you get." : "Every right answer scores 100 points."]);
    if (s.golden !== false && m !== "kids") out.push(["⭐", "Every fifth riddle is golden: it counts double."]);
    if (s.streak !== false && m !== "kids") out.push(["🔥", "Three right in a row, or more: 50 extra points each time."]);
    if (s.make !== false && m !== "kids") out.push(["✍️", "In the last round, everyone makes their own riddle for the others to guess."]);
    if (s.teams && m !== "survival") out.push(["👥", "Teams: everyone's points are added up for their team."]);
    out.push(["🏆", m === "survival" ? "The last one standing wins." : m === "kids" ? "Everyone is a winner, and the most points gets the crown!" : "The most points wins."]);
    return out;
  }
  let hostEl = null;
  const inDoc = (x) => !!x && (x.isConnected != null ? x.isConnected : document.documentElement.contains(x));
  function fitNow() {
    if (!inDoc(hostEl)) return;
    const cv = hostEl.firstElementChild, w = hostEl.clientWidth, h = hostEl.clientHeight;
    const s = Math.min(w / 1920, h / 1080);
    cv.style.transform = "translate(" + ((w - 1920 * s) / 2).toFixed(1) + "px," + ((h - 1080 * s) / 2).toFixed(1) + "px) scale(" + s.toFixed(5) + ")";
  }
  addEventListener("resize", () => requestAnimationFrame(fitNow));
  const SWAP_LR = { left: "right", right: "left" };
  function mirrorStyle(st) {
    const centered = /(^|;)\s*(left|right)\s*:\s*50%/.test(st);
    return st.split(";").map((d) => {
      const i = d.indexOf(":");
      if (i < 0) return d;
      const p = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim();
      if (centered && /^(left|right|margin-left|margin-right)$/.test(p)) return d;
      let np = p, nv = v;
      if (p === "left" || p === "right") np = SWAP_LR[p];
      else if (/^(margin|padding|border)-(left|right)(-[a-z]+)?$/.test(p)) np = p.replace(/-(left|right)/, (m, s) => "-" + SWAP_LR[s]);
      else if (/^border-(top|bottom)-(left|right)-radius$/.test(p)) np = p.replace(/-(left|right)-radius$/, (m, s) => "-" + SWAP_LR[s] + "-radius");
      else if (p === "text-align" || p === "float") nv = v.replace(/\b(left|right)\b/, (s) => SWAP_LR[s]);
      else if (/^(margin|padding|inset|border-width|border-style|border-color)$/.test(p)) {
        const t = v.split(/\s+/);
        if (t.length === 4) nv = [t[0], t[3], t[2], t[1]].join(" ");
      } else if (p === "border-radius" && !v.includes("/")) {
        const t = v.split(/\s+/);
        nv = t.length === 2 ? [t[1], t[0]].join(" ") : t.length === 3 ? [t[1], t[0], t[1], t[2]].join(" ") : t.length === 4 ? [t[1], t[0], t[3], t[2]].join(" ") : v;
      } else if (p === "transform" && /rotate\(/.test(v)) nv = v.replace(/rotate\((-?)([\d.]+)deg\)/g, (m, sg, n) => "rotate(" + (sg ? "" : "-") + n + "deg)");
      return np === p && nv === v ? d : np + ":" + nv;
    }).join(";");
  }
  const ltr = () => document.documentElement.dir !== "rtl";
  const forLang = (h) => ltr() ? String(h).replace(/style="([^"]*)"/g, (m, st) => 'style="' + mirrorStyle(st) + '"').replace(/dir="rtl"/g, 'dir="ltr"') : String(h);
  function screen(K, html, kind) {
    K.view(null);
    const host = K.el("div", "emo-host", K.stage);
    host.dataset.screen = kind || "";
    const cv = K.el("div", "emo-cv", host);
    cv.innerHTML = forLang(html);
    hostEl = host;
    fitNow();
    return cv;
  }
  const $ = (root, k) => [...root.querySelectorAll('[data-k="' + k + '"]')];
  const $1 = (root, k) => root.querySelector('[data-k="' + k + '"]');
  const setT = (root, k, t) => {
    for (const e of $(root, k)) e.textContent = t;
  };
  function rows(root, name, items, fn) {
    for (const t of [...root.querySelectorAll('[data-row="' + name + '"]')]) {
      for (let i = 0; i < items.length; i++) {
        const c = t.cloneNode(true);
        c.removeAttribute("data-row");
        t.parentNode.insertBefore(c, t);
        fn(c, items[i], i);
      }
      t.remove();
    }
  }
  const ifs = (root, vals) => {
    for (const e of root.querySelectorAll("bv-if")) if (e.dataset.if in vals) e.hidden = !vals[e.dataset.if];
  };
  function shrink(elx, minK, wOnly) {
    if (!elx) return;
    const base = parseFloat(getComputedStyle(elx).fontSize) || 40;
    let k = 1;
    for (let i = 0; i < 16 && (elx.scrollWidth > elx.clientWidth + 2 || !wOnly && elx.scrollHeight > elx.clientHeight + 4) && k > (minK || 0.45); i++) {
      k -= 0.05;
      elx.style.fontSize = (base * k).toFixed(1) + "px";
    }
  }
  function face(K, box, p) {
    if (!box || !p) return;
    for (const s of [...box.querySelectorAll("svg")]) s.remove();
    const url = K.avatarUrl(p);
    const im = document.createElement("img");
    im.alt = "";
    im.src = url;
    im.className = "emo-face" + (p.photo ? " ph" : "");
    if (!p.photo) {
      im.style.width = "78%";
      im.style.height = "78%";
      im.style.margin = "auto";
    }
    box.appendChild(im);
    if (!p.photo && getComputedStyle(box).display !== "grid") {
      box.style.display = "grid";
      box.style.placeItems = "center";
    }
  }
  function teamFace(K, box, t) {
    if (!box) return;
    for (const s of [...box.querySelectorAll("svg")]) s.remove();
    box.style.background = "radial-gradient(circle at 40% 30%, " + t[2] + ", #1a1236 80%)";
    const im = document.createElement("img");
    im.alt = "";
    im.src = P.booUri("boo:party");
    im.className = "emo-face";
    im.style.width = "78%";
    im.style.height = "78%";
    im.style.margin = "auto";
    box.appendChild(im);
    box.style.display = "grid";
    box.style.placeItems = "center";
  }
  const REACT = ["😂", "😮", "🔥", "👏", "😭", "🤯"];
  function floatUp(K, e, p) {
    const cv = inDoc(hostEl) ? hostEl.firstElementChild : null;
    if (!cv) return;
    let layer = cv.querySelector(".emo-react");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "emo-react";
      cv.appendChild(layer);
    }
    if (layer.children.length > 24) layer.firstChild.remove();
    const b = document.createElement("div");
    b.className = "emo-rx";
    b.style.left = Math.round(160 + Math.random() * 1600) + "px";
    b.style.setProperty("--dx", Math.round((Math.random() - 0.5) * 220) + "px");
    mini(K, p, b);
    const sp = document.createElement("span");
    sp.textContent = e;
    b.appendChild(sp);
    layer.appendChild(b);
    setTimeout(() => b.remove(), 3300);
  }
  const mini = (K, p, parent) => {
    const im = document.createElement("img");
    im.alt = "";
    im.src = K.avatarUrl(p);
    if (!p.photo) im.className = "emo-boo";
    if (parent) parent.appendChild(im);
    return im;
  };
  const up = (s, lang) => {
    try {
      return String(s).toLocaleUpperCase(lang);
    } catch (e) {
      return String(s).toUpperCase();
    }
  };
  const EN = {
    riddleN: "Riddle {n} / {total}",
    scoreboard: "Scoreboard",
    golden: "Golden riddle: double points!",
    worth: "Worth {n} points",
    answered: "{n} of {total} answered",
    typeHere: "Type your answer on your phone",
    hint: "Hint: {x}",
    oneMore: "One more try, for half the points!",
    timesUp: "Time's up!",
    rightN: "{n} right",
    wrongN: "{n} wrong",
    nobody: "Nobody got it!",
    everybody: "Everybody got it!",
    fastest: "Fastest: {name} ({s} s)",
    inARow: "{name}: {n} in a row!",
    isOut: "{name} is out!",
    areOut: "{n} players are out!",
    spare: "Everyone missed, so nobody loses a life.",
    nextIn: "Next riddle in {n}",
    hostNext: "Waiting for the host to start the next riddle",
    nextBtn: "Next riddle",
    showAns: "Show the answer",
    howTo: "How to play",
    makeT: "Make your own riddle!",
    makeSub: "The last round",
    makeLine: "On your phone: some emoji, and what they mean.",
    madeN: "{n} of {total} ready",
    byName: "A riddle by {name}",
    guessIt: "Type your guess on your phone",
    tooEasy: "Too easy: everyone got it!",
    tooHard: "Too hard: nobody got it!",
    makerPts: "{name} gets {n} points for the riddle",
    noneMade: "No riddles were made this time.",
    theAnswer: "The answer",
    loadFail: "The riddles didn't load. Check the internet, then start the game again.",
    winner: "The winner",
    winTeam: "The winning team",
    presents: "Emoji Riddles presents",
    ptsLine: "Points: {n}",
    hostAgain: "The host can play again, or pick another game.",
    kidsYay: "Yay! {n} got it!",
    kidsOne: "Yay! {name} got it!",
    kidsAll: "Wow, everybody got it!",
    kidsNone: "So close! Let's try the next one!",
    lastOne: "{name} is the last one standing!",
    yourRiddle: "Your emoji riddle",
    soon: "Get ready...",
    title: "Emoji Riddles"
  };
  const PLAY_LISTS = ["ePlayA", "ePlayB", "ePlayC"];
  BVPLAY.game({
    id: "emoji",
    name: "Emoji Riddles",
    emoji: "🦁",
    sub: "Guess the movie, food or saying from a row of emoji.",
    teams: true,
    teamsWin: true,
    step: ["Guess the emoji", "Pick or type what the emoji mean."],
    deco: "🦁🍕🎬💬",
    teamsOn: (s) => s.mode !== "survival",
    // the lobby in the game's design: the marquee's bulbs, and the words its seats use ("join", "✓ READY")
    lobbyTop: (t) => {
      for (const k of ["t", "b"]) {
        const r = document.createElement("div");
        r.className = "emo-bulbs " + k;
        r.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 34; i++) r.appendChild(document.createElement("i"));
        t.appendChild(r);
      }
      const root = document.documentElement.style;
      Promise.all([P.tr("Ready"), P.tr("join")]).then(([r, j]) => {
        root.setProperty("--emo-ready", JSON.stringify("✓ " + up(r, P.lang)));
        root.setProperty("--emo-join", JSON.stringify(j));
      }).catch(() => {
      });
    },
    // (each row of seats gets its own velvet panel, like a theater's)
    seated: (grid) => {
      for (const b of [...grid.querySelectorAll(".emo-rowbg")]) b.remove();
      if (grid.classList.contains("chips")) return;
      const seats = [...grid.children].filter((x) => x.classList.contains("seat") && !x.hidden);
      const byTop = /* @__PURE__ */ new Map();
      for (const x of seats) {
        const t = x.offsetTop;
        if (!byTop.has(t)) byTop.set(t, []);
        byTop.get(t).push(x);
      }
      for (const [t, list] of byTop) {
        const b = document.createElement("div");
        b.className = "emo-rowbg" + (list.every((x) => x.classList.contains("empty")) ? " empty" : "");
        b.style.top = t + "px";
        b.style.height = list[0].offsetHeight + "px";
        grid.insertBefore(b, grid.firstChild);
      }
    },
    seatRatio: 0.78,
    seatGap: 1.667,
    mlang: true,
    sounds: ["eNext", "eEvery5", "eCorrect", "eWrong", "eTimesup", "tick", "pop", "sparkle", "whoosh", "coin"],
    music: { lobby: "eLobby", again: "eLobby" },
    // (the game draws its own last screen: the winners, in one of its three designs)
    ownEnd: true,
    prep: () => {
      loadBank().catch(() => {
      });
      try {
        for (const f of ['700 40px "EMO Fredoka"', '800 30px "EMO Nunito"']) document.fonts.load(f).catch(() => {
        });
      } catch (e) {
      }
    },
    rules: (s) => howto(s).slice(0, 3).map((x) => x[1]),
    howto,
    steps: [
      { t: "Game mode", s: "Mode", keys: ["lang", "mode"] },
      { t: "Riddles", keys: ["count", "cat", "level"] },
      { t: "Timing", s: "Time", keys: ["sec", "fast", "kidSec", "next", "wait"] },
      { t: "Points and lives", s: "Points", keys: ["speed", "golden", "streak", "hints", "lives"] },
      { t: "Extras", keys: ["look", "make", "makeSec", "teams", "teamN", "rules", "rulesSec"] }
    ],
    settings: [
      { key: "mode", label: "Game mode", type: "seg", look: "list", options: MODES, default: "classic" },
      { key: "count", label: "How many riddles", type: "number", min: 1, max: 100, quick: [5, 10, 15, 20, 30], unit: "riddles", default: 10, desc: "In Last one standing, the game ends sooner when only one player is left." },
      { key: "cat", label: "Category", type: "seg", options: [["mix", "All mixed", "Riddles from every category."], ...CATS.map((c) => [c[0], c[1]])], default: "mix", when: ["mode", "!kids"] },
      { key: "level", label: "Difficulty", type: "seg", options: [["mix", "Easy to hard", "Starts easy and gets harder as you go."], ["easy", "Easy", "Riddles almost everyone gets."], ["medium", "Medium", "A little thinking needed."], ["hard", "Hard", "For emoji experts."]], default: "mix", when: ["mode", "!kids"] },
      { key: "sec", label: "Time to answer", type: "number", min: 0, max: 300, quick: [10, 15, 20, 30, 45, 60], unit: "seconds", default: 20, when: ["mode", ["classic", "type", "reveal", "survival"]], desc: "0: no clock. Each riddle waits for everyone, and the host can show the answer." },
      { key: "fast", label: "Time to answer", type: "number", min: 3, max: 30, quick: [5, 6, 8, 10], unit: "seconds", default: 8, when: ["mode", "lightning"] },
      { key: "kidSec", label: "Time to answer", type: "number", min: 0, max: 300, quick: [20, 30, 45, 60], unit: "seconds", default: 0, when: ["mode", "kids"], desc: "0: no clock. Each riddle waits until everyone answers." },
      { key: "next", label: "Next riddle", type: "seg", options: [["auto", "Automatic", "The next riddle starts by itself after a short wait."], ["host", "The host starts it", "The host taps Next riddle on their phone when everyone is ready."]], default: "auto" },
      { key: "wait", label: "Wait before the next riddle", type: "number", min: 2, max: 120, quick: [3, 5, 8, 12], unit: "seconds", default: 6, when: ["next", "auto"] },
      { key: "speed", label: "Speed points", type: "toggle", default: true, desc: "Faster right answers score more (50 to 100 points).", when: ["mode", ["classic", "type", "lightning", "survival"]] },
      { key: "golden", label: "Golden riddles", type: "toggle", default: true, desc: "Every fifth riddle is golden: it counts double.", when: ["mode", "!kids"] },
      { key: "streak", label: "Streak bonus", type: "toggle", default: true, desc: "Three right in a row, or more: 50 extra points each time.", when: ["mode", "!kids"] },
      { key: "hints", label: "Hint and one more try", type: "toggle", default: true, desc: "When nobody types the right answer, a hint shows and everyone tries again for half the points.", when: ["mode", "type"] },
      { key: "lives", label: "Lives", type: "number", min: 1, max: 10, quick: [1, 2, 3, 5], unit: "lives", default: 3, when: ["mode", "survival"] },
      { key: "look", label: "Screen look", type: "seg", options: [["mix", "All three, mixed", "A different look for every riddle: cinema, neon sign or retro TV."], ["cinema", "Cinema"], ["neon", "Neon sign"], ["retro", "Retro TV"]], default: "mix" },
      { key: "make", label: "Last round: make your own", type: "toggle", default: true, desc: "At the end, everyone makes an emoji riddle and the others guess it.", when: ["mode", "!kids"] },
      { key: "makeSec", label: "Time to make a riddle", type: "number", min: 20, max: 300, quick: [45, 60, 90, 120], unit: "seconds", default: 60, when: [["make", true], ["mode", "!kids"]] },
      { key: "teams", label: "Teams", type: "toggle", default: false, desc: "Phones join a color team, and each team's points are added up.", when: ["mode", "!survival"] },
      { key: "teamN", label: "How many teams", type: "seg", options: [[2, "2"], [3, "3"], [4, "4"]], default: 2, when: [["teams", true], ["mode", "!survival"]] },
      { key: "rules", label: "How to play first", type: "toggle", default: true, desc: "The TV and the phones show how to play before the first riddle." },
      { key: "rulesSec", label: "How long it shows", type: "number", min: 5, max: 120, quick: [8, 12, 20, 30], unit: "seconds", default: 12, when: ["rules", true] }
    ],
    tv(K) {
      return __async(this, null, function* () {
        const s = K.settings, mode = modeOf(s);
        const TX = yield P.trAll(EN);
        const tx = (k, v) => fill(TX[k] || EN[k] || k, v);
        const kids = mode === "kids", typeIt = mode === "type", reveal = mode === "reveal", fast = mode === "lightning", surv = mode === "survival";
        const sec = kids ? clamp(s.kidSec, 0, 300, 0) : fast ? clamp(s.fast, 3, 30, 8) : clamp(s.sec, 0, 300, 20);
        const total = clamp(s.count, 1, 100, 10);
        const speedOn = s.speed !== false && ["classic", "type", "lightning", "survival"].includes(mode) && sec > 0;
        const goldOn = s.golden !== false && !kids, streakOn = s.streak !== false && !kids, hintOn = typeIt && s.hints !== false;
        const teamsOn = K.teamsOn();
        const TEAMS = teamsOn ? P.TEAMS.slice(0, Math.min(4, +s.teamN || 2)).map((t) => t.slice(0, 3)) : [];
        for (const t of TEAMS) t[3] = yield K.tr(t[1] + " team");
        const list = kids ? "ePlayB" : fast ? "ePlayC" : PLAY_LISTS[rnd(3)];
        K.snd.music(list, { fadeOut: 1.4, fadeIn: 1.6 });
        let D = null;
        try {
          D = yield Promise.race([loadBank(), new Promise((r, j) => setTimeout(() => j(new Error("slow")), 15e3))]);
        } catch (e) {
        }
        if (!D || !Array.isArray(D.r) || !D.r.length) {
          const cv = screen(K, TPL.q[0], "fail");
          setT(cv, "title", tx("title"));
          setT(cv, "sub", "");
          const a = $1(cv, "answers");
          if (a) {
            a.style.display = "block";
            a.innerHTML = '<div class="emo-typebox"><b>' + esc(tx("loadFail")) + "</b></div>";
          }
          rows(cv, "em", ["📡", "❔"], (sp, e) => {
            sp.textContent = e;
          });
          yield K.sleep(8e3);
          return [];
        }
        const picker = makePicker(D, s, K);
        const lastRx = /* @__PURE__ */ new Map();
        K.on("react", (m, p) => {
          const t = Date.now();
          if (!REACT.includes(m.e) || t - (lastRx.get(p.id) || 0) < 1100) return;
          lastRx.set(p.id, t);
          floatUp(K, m.e, p);
        });
        if (s.rules !== false) {
          yield rulesScreen(K, s, tx, mode);
          if (K.over()) return [];
        }
        const st = { qi: 0, total, sec, mode, kids, typeIt, reveal, fast, surv, speedOn, goldOn, streakOn, hintOn, teamsOn, TEAMS, lastLook: -1, tx };
        for (let i = 0; i < total && !K.over(); i++) {
          if (surv && K.players().length > 1 && K.alive().length <= 1) break;
          if (!K.alive().length) break;
          const lv = kids ? 1 : stageLv(i, total, s.level);
          const R = picker.take(lv, kids);
          if (!R) break;
          st.qi = i;
          const res = yield oneRiddle(K, s, st, R, picker);
          if (!res || K.over()) break;
          const last = i >= total - 1 || surv && K.players().length > 1 && K.alive().length <= 1;
          if (last) {
            yield K.sleep(4500);
            break;
          }
          if (s.next === "host") yield hostNext(K, st, res.cv, res.qn);
          else yield nextIn(K, st, res.cv, clamp(s.wait, 2, 120, 6));
        }
        if (K.over()) return [];
        if (s.make !== false && !kids && K.players().length >= 2 && !(surv && K.alive().length <= 1)) yield makeRound(K, s, st);
        if (K.over()) return [];
        let ps = K.players().slice().sort((a, b) => b.score - a.score || b.right - a.right);
        if (surv) ps = K.players().slice().sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0) || b.lives - a.lives || b.score - a.score);
        yield winners(K, st, ps);
        ps.own = true;
        return ps;
      });
    }
  });
  const LV = { easy: 1, medium: 2, hard: 3 };
  function stageLv(i, n, level) {
    if (LV[level]) return LV[level];
    const e = Math.ceil(n / 3), h = Math.floor(n / 3), m = n - e - h;
    return i < e ? 1 : i < e + m ? 2 : 3;
  }
  const ASKED = "asked";
  function makePicker(D, s, K) {
    const lang = K.lang;
    const A = D.a || {};
    const own = A[lang] ? lang : "en";
    const codes = [own];
    K.players().forEach((p) => {
      const c = K.langOf(p.id);
      if (c && A[c] && !codes.includes(c)) codes.push(c);
    });
    const all = [];
    const ci = s.cat && s.cat !== "mix" ? catIdx(s.cat) : -1;
    D.r.forEach((r, i) => {
      if (codes.some((c) => !A[c][i])) return;
      all.push({ id: "r" + i, i, e: r[0], cat: r[1], lv: r[2] || 2, kid: !!r[3] });
    });
    const oneLang = K.players().every((p) => !K.langOf(p.id) || K.langOf(p.id) === lang);
    const loc = D.loc && Array.isArray(D.loc[lang]) && oneLang ? D.loc[lang] : [];
    loc.forEach((r, j) => all.push({ id: lang + "l" + j, i: -1, e: r[0], cat: r[1], lv: r[2] || 2, kid: !!r[3], ans: r[4] }));
    const asked = store.get(ASKED, []);
    const rank = new Map(asked.map((id, k) => [id, k]));
    const used = /* @__PURE__ */ new Set(), usedAns = /* @__PURE__ */ new Set();
    const keyIn = (R, c) => P.norm(main(answerOf(D, R, c))).replace(/[\s.,:;!?¡¿'’"“”()\-–_/&]+/g, "");
    const key = (R) => keyIn(R, own);
    const keys = (R) => codes.map((c) => c + ":" + keyIn(R, c));
    function take(lv, kidsOnly) {
      const ok = (R2) => !used.has(R2.id) && !keys(R2).some((k) => usedAns.has(k)) && (!kidsOnly || R2.kid);
      let list = all.filter((R2) => ok(R2) && (ci < 0 || R2.cat === ci));
      if (!list.length && ci >= 0) list = all.filter(ok);
      if (!list.length) return null;
      const near = lv === 1 ? [1, 2, 3] : lv === 2 ? [2, 1, 3] : [3, 2, 1];
      let pool = list;
      if (!kidsOnly) for (const l of near) {
        const x = list.filter((R2) => R2.lv === l);
        if (x.length) {
          pool = x;
          break;
        }
      }
      if (ci < 0 && take.lastCat != null) {
        const x = pool.filter((R2) => R2.cat !== take.lastCat);
        if (x.length) pool = x;
      }
      const fresh = pool.filter((R2) => !rank.has(R2.id));
      let R;
      if (fresh.length) R = P.pick(fresh);
      else {
        pool = pool.slice().sort((a, b) => rank.get(a.id) - rank.get(b.id));
        R = P.pick(pool.slice(0, Math.max(1, Math.ceil(pool.length / 4))));
      }
      used.add(R.id);
      keys(R).forEach((k) => usedAns.add(k));
      take.lastCat = R.cat;
      const l2 = store.get(ASKED, []).filter((x) => x !== R.id);
      l2.push(R.id);
      store.set(ASKED, l2.slice(-3e3));
      rank.set(R.id, asked.length + rank.size);
      return R;
    }
    function wrong(R) {
      const k0 = key(R);
      const ems = new Set(splitEm(R.e));
      const same = all.filter((x) => x.id !== R.id && x.cat === R.cat && (x.i >= 0 || R.i < 0) && key(x) !== k0 && (!R.kid || x.kid || x.lv === 1));
      const pool = same.length >= 3 ? same : all.filter((x) => x.id !== R.id && key(x) !== k0 && (x.i >= 0 || R.i < 0));
      const sharing = P.shuffle(pool.filter((x) => splitEm(x.e).some((e) => ems.has(e))));
      const rest = P.shuffle(pool.filter((x) => !sharing.includes(x)));
      const out = [], seen = new Set(keys(R));
      for (const x of sharing.slice(0, 1).concat(rest, sharing.slice(1))) {
        const ks = keys(x);
        if (ks.some((k) => seen.has(k))) continue;
        ks.forEach((k) => seen.add(k));
        out.push(x);
        if (out.length === 3) break;
      }
      return out;
    }
    return { take, wrong, own };
  }
  function answerOf(D, R, code) {
    if (R.i < 0) return R.ans || "";
    const A = D.a || {};
    return A[code] && A[code][R.i] || A.en && A.en[R.i] || "";
  }
  function rulesScreen(K, s, tx, mode) {
    return __async(this, null, function* () {
      const secs = clamp(s.rulesSec, 5, 120, 12);
      const cv = screen(K, TPL.q[0], "rules");
      const m = MODES.find((x) => x[0] === mode);
      setT(cv, "title", tx("howTo"));
      setT(cv, "sub", yield K.tr(m[1]));
      rows(cv, "em", splitEm(MODE_EM[mode]), (sp, e, i) => {
        sp.textContent = e;
        sp.style.animationDelay = i * 0.3 + "s";
        sp.style.fontSize = "110px";
      });
      const emsBox = $1(cv, "ems");
      if (emsBox) emsBox.style.height = "150px";
      const a = $1(cv, "answers");
      if (a) {
        a.style.display = "block";
        a.innerHTML = "";
        const list = howto(s);
        const tr = yield Promise.all(list.map((x) => K.tr(x[1])));
        const box = K.el("div", "emo-rules", a);
        list.forEach((x, i) => {
          const r = K.el("div", "emo-rule", box);
          r.style.animationDelay = 0.25 + i * 0.12 + "s";
          K.el("i", "", r, x[0]);
          K.el("span", "", r, tr[i]);
        });
        const n = list.length, k = n <= 5 ? 1 : n <= 7 ? 0.8 : 0.7;
        box.style.gap = Math.round(14 * k) + "px";
        for (const r of box.children) {
          r.style.minHeight = Math.round(80 * k) + "px";
          r.lastChild.style.fontSize = Math.round(28 * Math.max(k, 0.82)) + "px";
          r.lastChild.style.padding = Math.round(10 * k) + "px 24px";
          r.firstChild.style.fontSize = Math.round(44 * k) + "px";
        }
      }
      board(K, cv, null, null);
      const ck = clock(K, cv, secs);
      K.wait(tx("howTo"), { emo: { t: "rules", sec: secs } });
      yield K.sleep(secs * 1e3);
      ck.stop();
    });
  }
  function board(K, cv, st, marks) {
    setT(cv, "boardT", st ? st.tx("scoreboard") : "");
    const bt = $1(cv, "boardT");
    if (bt && !st) P.tr("Scoreboard").then((t) => {
      bt.textContent = t;
    });
    const teams = st && st.teamsOn ? st.TEAMS : null;
    const surv = st && st.surv;
    let items;
    if (teams) items = teams.map((t) => ({ team: t, id: "t-" + t[0], name: t[3], score: K.players().filter((p) => p.team === t[0]).reduce((n2, p) => n2 + p.score, 0) })).sort((a, b) => b.score - a.score);
    else items = K.players().slice().sort((a, b) => (surv ? (a.out ? 1 : 0) - (b.out ? 1 : 0) || b.lives - a.lives : 0) || b.score - a.score);
    const n = items.length;
    const MAX = 11;
    const shown = n > MAX ? items.slice(0, MAX - 1) : items;
    const boo = $1(cv, "boo");
    if (boo && n > 4) boo.hidden = true;
    const rowsBox = $1(cv, "rows");
    if (rowsBox) {
      if (!rowsBox._tpl) {
        const t0 = rowsBox.querySelector('[data-row="pl"]');
        if (t0) rowsBox._tpl = t0.cloneNode(true);
      }
      if (rowsBox._tpl) {
        rowsBox.textContent = "";
        rowsBox.appendChild(rowsBox._tpl.cloneNode(true));
      }
    }
    const h = n <= 5 ? 76 : Math.max(46, Math.floor(640 / Math.min(MAX, n)) - 12);
    const k = h / 76;
    const out = /* @__PURE__ */ new Map();
    rows(cv, "pl", shown, (r, x) => {
      r.dataset.id = x.id;
      if (x.team) {
        teamFace(K, $1(r, "av"), x.team);
        const av = $1(r, "av");
        if (av) av.style.borderColor = x.team[2];
      } else {
        face(K, $1(r, "av"), x);
        const av = $1(r, "av");
        if (av) av.style.borderColor = x.color || "#ffc93c";
      }
      setT(r, "nm", x.name);
      setT(r, "sc", K.num(x.score));
      if (surv && !x.team) {
        const hs = document.createElement("span");
        hs.className = "emo-hearts";
        hs.textContent = x.out ? "💀" : "❤️".repeat(Math.max(0, x.lives));
        $1(r, "sc").before(hs);
        if (x.out) r.classList.add("emo-outp");
      }
      if (h !== 76) {
        r.style.height = h + "px";
        r.style.gap = Math.round(16 * k) + "px";
        r.style.padding = "0 " + Math.round(20 * k) + "px";
        const av = $1(r, "av");
        if (av) {
          av.style.width = av.style.height = Math.round(52 * k) + "px";
        }
        const nm = $1(r, "nm");
        if (nm) nm.style.fontSize = Math.round(28 * Math.max(0.8, k)) + "px";
        const sc = $1(r, "sc");
        if (sc) sc.style.fontSize = Math.round(34 * Math.max(0.8, k)) + "px";
      }
      if (marks && marks.has(x.id)) r.classList.add(marks.get(x.id));
      out.set(x.id, r);
    });
    if (n > MAX && rowsBox) {
      const more = K.el("div", "emo-mode", rowsBox, "+" + K.num(n - shown.length));
      more.style.cssText = "font-size:26px;text-align:center;margin:0";
    }
    if (rowsBox && h !== 76) rowsBox.style.gap = Math.round(12 * k) + "px";
    return out;
  }
  function clock(K, cv, secs) {
    const box = $1(cv, "clock"), svg = $1(cv, "ring"), rn = $1(cv, "rn");
    const c = svg && svg.querySelectorAll("circle")[1];
    if (!secs) {
      if (box) box.classList.add("emo-noclock");
      if (rn) rn.textContent = "⏳";
      return { stop() {
      }, left: () => 0, done: () => false };
    }
    if (c) {
      c.style.transition = "none";
      c.style.strokeDashoffset = "0";
      void c.getBoundingClientRect();
      c.style.transition = "stroke-dashoffset " + secs + "s linear";
      c.style.strokeDashoffset = "339";
    }
    let left = secs, stopped = false;
    if (rn) rn.textContent = K.num(left);
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (stopped) return;
      const l = Math.max(0, Math.ceil(secs - (Date.now() - t0) / 1e3));
      if (l !== left) {
        left = l;
        if (rn) rn.textContent = K.num(l);
        if (l > 0 && l <= 3) K.snd.fx("tick", { vol: 0.6 });
        if (box) box.classList.toggle("emo-low", l <= 5);
      }
      if (l <= 0 || K.over()) clearInterval(iv);
    }, 200);
    return {
      stop() {
        stopped = true;
        clearInterval(iv);
        if (c) {
          const cs = getComputedStyle(c).strokeDashoffset;
          c.style.transition = "none";
          c.style.strokeDashoffset = cs;
        }
        if (box) box.classList.remove("emo-low");
      },
      left: () => left,
      done: () => Date.now() - t0 >= secs * 1e3
    };
  }
  const LOOKS = { cinema: 0, neon: 1, retro: 2 };
  function pickLook(s, st) {
    if (s.look in LOOKS) return LOOKS[s.look];
    let l = rnd(3);
    if (l === st.lastLook) l = (l + 1 + rnd(2)) % 3;
    st.lastLook = l;
    return l;
  }
  function letters(K) {
    try {
      return BVI18N.letters(K.lang);
    } catch (e) {
      return P.LETTERS;
    }
  }
  function oneRiddle(K, s, st, R, picker) {
    return __async(this, null, function* () {
      const { tx, kids, typeIt, reveal, fast, surv } = st;
      const D = window.BVEMOD;
      const num = st.qi + 1;
      const gold = st.goldOn && num % 5 === 0;
      const look = pickLook(s, st);
      const cv = screen(K, TPL.q[look], "q");
      if (gold) cv.classList.add("emo-golden");
      const ems = splitEm(R.e);
      const cat = CATS[R.cat] || CATS[0];
      const catT = yield K.tr(cat[1]);
      setT(cv, "title", tx("riddleN", { n: K.num(num), total: K.num(st.total) }));
      setT(cv, "sub", catT);
      if (gold) {
        const t = $1(cv, "title");
        if (t) {
          const g = K.el("span", "emo-gold", null, "⭐ ×2");
          t.appendChild(g);
        }
      }
      const spans = [];
      rows(cv, "em", ems, (sp, e, i) => {
        sp.textContent = e;
        spans.push(sp);
        sp.style.animationDelay = i * 0.25 + "s";
      });
      const emsBox = $1(cv, "ems");
      if (emsBox && ems.length > 3) {
        const room = 880, gap = ems.length > 5 ? 22 : 40;
        const sz = Math.max(70, Math.min(160, Math.floor((room - gap * (ems.length - 1)) / ems.length)));
        emsBox.style.gap = gap + "px";
        for (const sp of spans) sp.style.fontSize = sz + "px";
      }
      let shown = reveal ? 1 : ems.length;
      const paintEms = () => spans.forEach((sp, i) => {
        const on = i < shown;
        if (!on) {
          sp.dataset.e = ems[i];
          sp.textContent = "❔";
          sp.classList.add("emo-q");
        } else if (sp.classList.contains("emo-q")) {
          sp.textContent = ems[i];
          sp.classList.remove("emo-q");
          sp.classList.add("emo-in");
        }
      });
      paintEms();
      const L4 = letters(K);
      const lang = K.lang;
      const rightT = main(answerOf(D, R, picker.own));
      let opts = [], ok = -1, optR = [];
      const ansBox = $1(cv, "answers");
      if (!typeIt) {
        const wr = picker.wrong(R);
        optR = P.shuffle([R].concat(wr));
        ok = optR.indexOf(R);
        opts = optR.map((x) => main(answerOf(D, x, picker.own)));
        for (let j = 0; j < 4; j++) {
          const card = $1(cv, "a" + j);
          if (!card) continue;
          if (j >= opts.length) {
            card.style.visibility = "hidden";
            continue;
          }
          setT(card, "l", L4[j] || "ABCD"[j]);
          setT(card, "t", opts[j]);
        }
      } else if (ansBox) {
        ansBox.style.display = "block";
        ansBox.innerHTML = "";
        const tb = K.el("div", "emo-typebox", ansBox);
        K.el("b", "", tb, tx("typeHere"));
        const dots = K.el("div", "emo-dots", tb);
        for (let j = 0; j < 3; j++) K.el("i", "", dots);
      }
      const line2 = K.el("div", "emo-line", null);
      if (ansBox) ansBox.after(line2);
      const cards = typeIt ? [] : [0, 1, 2, 3].map((j) => $1(cv, "a" + j)).filter(Boolean);
      for (const c of cards) c.classList.add("emo-card");
      for (const c of cards) {
        c.style.opacity = "0";
        c.style.transform = "scale(.85) translateY(20px)";
      }
      requestAnimationFrame(() => {
        for (const c of cards) shrinkCard(c);
      });
      let marks = /* @__PURE__ */ new Map();
      let rowEls = board(K, cv, st, marks);
      K.wait(tx("soon"), { emo: { t: "look", gold, n: num, of: st.total } });
      K.snd.sting(gold ? "eEvery5" : "eNext", { duck: 0.65 });
      if (gold) {
        const g = K.el("div", "emo-pill emo-pop", line2, "⭐ " + tx("golden"));
        g.style.borderColor = "#ffc93c";
      }
      yield K.sleep(K.snd.on() ? gold ? 2600 : 1500 : 900);
      if (K.over()) return null;
      for (let j = 0; j < cards.length; j++) {
        const c = cards[j];
        c.style.transition = "opacity .35s, transform .45s cubic-bezier(.2,1.4,.4,1)";
        c.style.opacity = "1";
        c.style.transform = "scale(1)";
        K.snd.fx("pop", { vol: 0.35 });
        yield K.sleep(160);
      }
      if (gold) yield K.sleep(900);
      line2.textContent = "";
      if (K.over()) return null;
      const live = K.alive().slice();
      const secs = st.sec;
      const ck = clock(K, cv, secs);
      const answered = /* @__PURE__ */ new Set();
      const shownAt = /* @__PURE__ */ new Map();
      const worth = (n) => ems.length <= 1 ? 100 : Math.max(30, Math.round((100 - 60 * (n - 1) / (ems.length - 1)) / 10) * 10);
      let pill = K.el("div", "emo-pill", line2, tx("answered", { n: K.num(0), total: K.num(live.length) }));
      let worthP = null;
      if (reveal) {
        worthP = K.el("div", "emo-pill", line2, tx("worth", { n: K.num(worth(shown) * (gold ? 2 : 1)) }));
        worthP.style.borderColor = "#7df9ff";
      }
      const showIn = () => {
        pill.textContent = tx("answered", { n: K.num(answered.size), total: K.num(live.length) });
      };
      const offPlayers = K.onPlayers(() => {
        rowEls = board(K, cv, st, marks);
        for (const id of answered) {
          const r = rowEls.get(id);
          if (r) r.classList.add("emo-in");
        }
      });
      const extra = { letters: true, tv: 1, emo: { e: R.e, n: num, of: st.total, cat: catT, look, gold, mode: st.mode, shown, kids } };
      const langs = new Set(live.map((p) => K.langOf(p.id)).filter((c) => c && c !== lang));
      if (langs.size) {
        extra.tr = {};
        for (const code of langs) {
          const t = { cat: yield K.trFor(code, cat[1]) };
          if (!typeIt) t.o = optR.map((x) => main(answerOf(D, x, D.a && D.a[code] ? code : "en")));
          extra.tr[code] = t;
        }
      }
      if (typeIt) {
        extra.max = 60;
        extra.place = yield K.tr("What is it?");
      }
      let qn = 0;
      const onAns = (id) => {
        if (answered.has(id)) return;
        answered.add(id);
        shownAt.set(id, shown);
        const r = rowEls.get(id);
        if (r) r.classList.add("emo-in");
        showIn();
        K.snd.fx("pop", { vol: 0.5 });
      };
      const open = !secs;
      const asking = K.ask(typeIt ? { kind: "text", prompt: "", sec: secs, open, who: live.map((p) => p.id), extra, onAns } : { kind: "choice", prompt: "", opts, sec: secs, open, who: live.map((p) => p.id), extra, onAns });
      qn = K.qn();
      const stopReveal = open ? hostReveal(K, st, qn) : null;
      let closed = false;
      if (reveal && ems.length > 1) {
        (() => __async(this, null, function* () {
          const step = secs ? Math.max(2.5, Math.min(6, secs * 0.6 / (ems.length - 1))) : 5;
          while (!closed && !K.over() && shown < ems.length) {
            yield K.sleep(step * 1e3);
            if (closed || K.over()) return;
            shown++;
            paintEms();
            K.snd.fx("sparkle", { vol: 0.55 });
            if (worthP) worthP.textContent = tx("worth", { n: K.num(worth(shown) * (gold ? 2 : 1)) });
            K.say({ k: "emo", t: "more", n: qn, shown });
          }
        }))();
      }
      const tuT = secs ? setTimeout(() => {
        if (closed || K.over() || answered.size >= live.length) return;
        K.snd.sting("eTimesup", { duck: 0.65 });
        K.el("div", "emo-pill bad emo-pop", line2, "⏰ " + tx("timesUp"));
      }, secs * 1e3) : 0;
      let got = yield asking;
      closed = true;
      clearTimeout(tuT);
      if (stopReveal) stopReveal();
      ck.stop();
      if (K.over()) {
        offPlayers();
        return null;
      }
      if (shown < ems.length) {
        shown = ems.length;
        paintEms();
      }
      const okSet = R.i >= 0 ? null : alts(R.ans);
      const rightFor = (code) => alts(answerOf(D, R, code));
      const isRight = (id, a) => {
        if (!a) return false;
        if (!typeIt) return +a.v === ok;
        const code = K.langOf(id) || lang;
        const cands = (okSet || []).concat(rightFor(picker.own), rightFor(code), rightFor("en"));
        return cands.some((c) => P.close(a.v, c));
      };
      let late = /* @__PURE__ */ new Set();
      if (typeIt && st.hintOn && live.length && ![...got].some(([id, a]) => isRight(id, a)) && !K.over()) {
        const hintT = hintOf(rightT, lang);
        line2.textContent = "";
        answered.clear();
        for (const r of rowEls.values()) r.classList.remove("emo-in");
        K.el("div", "emo-pill hint emo-pop", line2, "💡 " + tx("hint", { x: hintT }));
        K.el("div", "emo-pill emo-pop", line2, tx("oneMore"));
        pill = K.el("div", "emo-pill", line2, tx("answered", { n: K.num(0), total: K.num(live.length) }));
        K.snd.fx("sparkle", { vol: 0.7 });
        const ck2 = clock(K, cv, secs ? Math.max(8, Math.round(secs * 0.6)) : 0);
        const hints = {};
        for (const code of langs) hints[code] = hintOf(main(answerOf(D, R, D.a && D.a[code] ? code : "en")), code);
        K.say({ k: "emo", t: "hint", n: qn, text: hintT, tr: hints });
        const again = yield K.ask({ kind: "text", prompt: "", sec: secs ? Math.max(8, Math.round(secs * 0.6)) : 0, open: !secs, who: live.map((p) => p.id), extra: Object.assign({}, extra, { emo: Object.assign({}, extra.emo, { hint: hintT, hints, again: true }) }), onAns });
        ck2.stop();
        const g2 = new Map(got);
        for (const [id, a] of again) if (!g2.has(id) || !isRight(id, g2.get(id))) {
          g2.set(id, Object.assign({}, a, { late: true }));
          late.add(id);
        }
        got = g2;
        line2.textContent = "";
      }
      if (K.over()) {
        offPlayers();
        return null;
      }
      const inPlay = live.filter((p) => got.has(p.id) || !p.away);
      const rightIds = inPlay.filter((p) => isRight(p.id, got.get(p.id))).map((p) => p.id);
      const wrongIds = inPlay.filter((p) => got.has(p.id) && !isRight(p.id, got.get(p.id))).map((p) => p.id);
      const noneIds = inPlay.filter((p) => !got.has(p.id)).map((p) => p.id);
      line2.textContent = "";
      yield K.sleep(500);
      K.snd.sting(rightIds.length ? "eCorrect" : "eWrong", { duck: 0.65 });
      yield K.sleep(K.snd.on() ? 650 : 200);
      if (K.over()) {
        offPlayers();
        return null;
      }
      if (!typeIt) {
        for (let j = 0; j < cards.length; j++) {
          const card = cards[j];
          const ids = inPlay.filter((p) => got.has(p.id) && +got.get(p.id).v === j).map((p) => p.id);
          card.classList.add(j === ok ? "emo-right" : ids.length ? "emo-wrong" : "emo-off");
          if (ids.length) whoPile(K, card, ids);
          if (j === ok || ids.length) {
            const b = K.el("span", "emo-badge " + (j === ok ? "ok" : "bad"), card, j === ok ? "✓" : "✗");
          }
        }
      } else if (ansBox) {
        ansBox.innerHTML = "";
        const big = K.el("div", "emo-ansbig" + (rightIds.length ? "" : " miss"), ansBox);
        K.el("span", "emo-badge ok", big, "✓");
        K.el("span", "", big, rightT);
        shrink(big, 0.55);
        const gs = K.el("div", "emo-guesses", ansBox);
        gs.style.marginTop = "22px";
        const ordered = inPlay.slice().sort((a, b) => rightIds.includes(b.id) - rightIds.includes(a.id) || got.has(b.id) - got.has(a.id));
        for (const p of ordered.slice(0, 16)) {
          const a = got.get(p.id);
          const okP = rightIds.includes(p.id);
          const g = K.el("div", "emo-guess " + (okP ? "ok" : a ? "bad" : "none"), gs);
          mini(K, p, g);
          K.el("span", "", g, a ? P.safe(String(a.v), 40, "***") : "...");
          K.el("span", "emo-badge " + (okP ? "ok" : "bad"), g, okP ? "✓" : a ? "✗" : "💤");
        }
      }
      const firstRight = rightIds.map((id) => [id, got.get(id)]).sort((a, b) => a[1].ms - b[1].ms)[0];
      const spare = surv && inPlay.length > 1 && !rightIds.length;
      const res = /* @__PURE__ */ new Map();
      const outNow = [];
      for (const p of inPlay) {
        const a = got.get(p.id);
        const good = rightIds.includes(p.id);
        let pts = 0, bonus = 0;
        if (good) {
          p.right++;
          p.streak++;
          pts = 100;
          if (reveal) pts = worth(shownAt.get(p.id) || ems.length);
          else if (st.speedOn && a && !a.late) pts = Math.round(100 * (0.5 + 0.5 * Math.max(0, 1 - (a.ms || 0) / (secs * 1e3))));
          if (late.has(p.id)) pts = Math.round(pts / 2);
          if (gold) pts *= 2;
          if (fast && firstRight && firstRight[0] === p.id) bonus += 50;
          if (st.streakOn && p.streak >= 3) bonus += 50;
          p.score += pts + bonus;
          res.set(p.id, "emo-ok");
        } else {
          p.streak = 0;
          if (surv && !spare) {
            p.lives = Math.max(0, p.lives - 1);
            if (p.lives <= 0 && !p.out) {
              p.out = true;
              outNow.push(p);
            }
          }
          res.set(p.id, a ? "emo-bad" : "emo-none");
        }
        p._pts = pts + bonus;
      }
      rowEls = board(K, cv, st, st.teamsOn ? null : res);
      if (!st.teamsOn) for (const [id, r] of rowEls) {
        const p = K.player(id);
        if (!p || !res.has(id)) continue;
        const cls = res.get(id);
        const ch = document.createElement("span");
        ch.className = "emo-chip " + (cls === "emo-ok" ? "ok" : cls === "emo-bad" ? "bad" : "none");
        ch.textContent = cls === "emo-ok" ? "+" + K.num(p._pts) : cls === "emo-bad" ? "✗" : "💤";
        const sc = $1(r, "sc");
        if (sc) sc.before(ch);
      }
      line2.textContent = "";
      if (kids) {
        const nR = rightIds.length;
        K.el("div", "emo-pill ok emo-pop", line2, nR && nR === inPlay.length && nR > 1 ? "🎉 " + tx("kidsAll") : nR === 1 ? "🎉 " + tx("kidsOne", { name: (K.player(rightIds[0]) || {}).name || "" }) : nR ? "🎉 " + tx("kidsYay", { n: K.num(nR) }) : "🌈 " + tx("kidsNone"));
        if (nR) burst(cv);
      } else {
        if (rightIds.length && rightIds.length === inPlay.length && inPlay.length > 1) K.el("div", "emo-pill ok emo-pop", line2, "🎉 " + tx("everybody"));
        else if (!rightIds.length) K.el("div", "emo-pill bad emo-pop", line2, "😮 " + tx("nobody"));
        else {
          K.el("div", "emo-pill ok emo-pop", line2, "✓ " + tx("rightN", { n: K.num(rightIds.length) }));
          K.el("div", "emo-pill bad emo-pop", line2, "✗ " + tx("wrongN", { n: K.num(wrongIds.length + noneIds.length) }));
        }
        if (firstRight && inPlay.length > 1) {
          const fp = K.player(firstRight[0]);
          if (fp) {
            const f = K.el("div", "emo-pill emo-pop", line2);
            mini(K, fp, f);
            f.append("⚡ " + tx("fastest", { name: "⁨" + fp.name + "⁩", s: K.num(Math.round(firstRight[1].ms / 100) / 10) }));
          }
        }
        const hot = inPlay.filter((p) => rightIds.includes(p.id) && p.streak >= 3).sort((a, b) => b.streak - a.streak)[0];
        if (hot && st.streakOn) {
          const f = K.el("div", "emo-pill emo-pop", line2);
          K.el("span", "emo-fire", f, "🔥");
          f.append(tx("inARow", { name: "⁨" + hot.name + "⁩", n: K.num(hot.streak) }));
        }
        if (spare) K.el("div", "emo-pill emo-pop", line2, "🛡️ " + tx("spare"));
        if (outNow.length === 1) K.el("div", "emo-pill bad emo-pop", line2, "💀 " + tx("isOut", { name: "⁨" + outNow[0].name + "⁩" }));
        else if (outNow.length > 1) K.el("div", "emo-pill bad emo-pop", line2, "💀 " + tx("areOut", { n: K.num(outNow.length) }));
        if (surv && K.players().length > 1 && K.alive().length === 1) K.el("div", "emo-pill ok emo-pop", line2, "🏆 " + tx("lastOne", { name: "⁨" + K.alive()[0].name + "⁩" }));
      }
      while (line2.children.length > 3) line2.lastChild.remove();
      const rank = K.players().slice().sort((a, b) => b.score - a.score);
      for (const p of inPlay) {
        const code = K.langOf(p.id) || lang;
        const good = rightIds.includes(p.id);
        K.result(p.id, {
          ok: good,
          pts: p._pts,
          score: p.score,
          right: main(answerOf(D, R, D.a && D.a[code] ? code : picker.own)),
          out: !!p.out,
          lives: surv ? p.lives : void 0,
          emo: { e: R.e, kids, gold, streak: good ? p.streak : 0, first: !!(firstRight && firstRight[0] === p.id && inPlay.length > 1), place: rank.indexOf(p) + 1, of: rank.length, none: !got.has(p.id), spare, late: late.has(p.id), look }
        });
      }
      offPlayers();
      return { cv, qn, line: line2 };
    });
  }
  function shrinkCard(card) {
    const t = $1(card, "t");
    if (t) shrink(t, 0.5);
  }
  function whoPile(K, card, ids) {
    const w = K.el("span", "emo-who", null);
    const ps = ids.map((id) => K.player(id)).filter(Boolean);
    ps.slice(0, ps.length > 6 ? 5 : 6).forEach((p, i) => {
      const im = mini(K, p, w);
      im.style.setProperty("--pc", p.color || "#fff");
      im.style.animationDelay = 0.1 + i * 0.07 + "s";
    });
    if (ps.length > 6) K.el("b", "", w, "+" + K.num(ps.length - 5));
    card.appendChild(w);
  }
  function hintOf(ans, code) {
    const a = String(ans || "").trim();
    if (!a) return "?";
    if (code === "zh" || /[぀-鿿]/.test(a)) {
      const ch = [...a.replace(/\s+/g, "")];
      return ch[0] + " " + "＿ ".repeat(Math.max(0, ch.length - 1)).trim();
    }
    return a.split(/\s+/).map((w) => {
      const ch = [...w];
      return ch[0] + (ch.length > 1 ? " " + "_ ".repeat(ch.length - 1).trim() : "");
    }).join("   ");
  }
  function burst(cv) {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    } catch (e) {
    }
    const c = document.createElement("canvas");
    c.className = "emo-burst";
    c.width = 1920;
    c.height = 1080;
    cv.appendChild(c);
    const g = c.getContext && c.getContext("2d");
    if (!g) return;
    const COLS = ["#ffc93c", "#ff5a6e", "#4c8dff", "#34d399", "#b46bff", "#ffffff", "#ff9a3c"];
    const bits = Array.from({ length: 160 }, () => ({ x: 960 + (Math.random() - 0.5) * 300, y: 520, vx: (Math.random() - 0.5) * 34, vy: -14 - Math.random() * 22, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, w: 10 + Math.random() * 12, h: 6 + Math.random() * 8, c: COLS[rnd(COLS.length)] }));
    const t0 = performance.now();
    (function f(t) {
      if (!inDoc(c)) return;
      const k = (t - t0) / 1e3;
      g.clearRect(0, 0, 1920, 1080);
      for (const b of bits) {
        b.vy += 0.6;
        b.vx *= 0.99;
        b.x += b.vx;
        b.y += b.vy;
        b.a += b.va;
        g.save();
        g.translate(b.x, b.y);
        g.rotate(b.a);
        g.globalAlpha = Math.max(0, 1 - k / 3.2);
        g.fillStyle = b.c;
        g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        g.restore();
      }
      if (k < 3.3) requestAnimationFrame(f);
      else c.remove();
    })(t0);
  }
  function hostReveal(K, st, n) {
    let on = true;
    (() => __async(this, null, function* () {
      const label = st.tx("showAns");
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
  function nextIn(K, st, cv, secs) {
    return __async(this, null, function* () {
      const line2 = cv.querySelector(".emo-line");
      const pill = K.el("div", "emo-pill", line2);
      pill.style.borderColor = "rgba(255,255,255,.3)";
      for (let n = secs; n > 0 && !K.over(); n--) {
        pill.textContent = "⏭️ " + st.tx("nextIn", { n: K.num(n) });
        yield K.sleep(1e3);
      }
    });
  }
  function hostNext(K, st, cv, n) {
    return __async(this, null, function* () {
      const line2 = cv.querySelector(".emo-line");
      K.el("div", "emo-pill", line2, "⏸️ " + st.tx("hostNext"));
      const label = st.tx("nextBtn");
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
  function makeRound(K, s, st) {
    return __async(this, null, function* () {
      const { tx } = st;
      const secs = clamp(s.makeSec, 20, 300, 60);
      const cv = screen(K, TPL.q[0], "make");
      setT(cv, "title", tx("makeT"));
      setT(cv, "sub", tx("makeSub"));
      rows(cv, "em", splitEm("✍️🤔💡"), (sp, e, i) => {
        sp.textContent = e;
        sp.style.animationDelay = i * 0.3 + "s";
      });
      const a = $1(cv, "answers");
      const ps = K.alive().slice();
      let made = null;
      if (a) {
        a.style.display = "block";
        a.innerHTML = "";
        const tb = K.el("div", "emo-typebox", a);
        K.el("b", "", tb, tx("makeLine"));
        const cnt = K.el("div", "emo-pill", tb, tx("madeN", { n: K.num(0), total: K.num(ps.length) }));
        made = K.el("div", "emo-made", a);
        made.style.marginTop = "22px";
        for (const p of ps) {
          const x = K.el("span", "", made);
          x.dataset.id = p.id;
          mini(K, p, x);
          x.append(p.name);
        }
        a._cnt = cnt;
      }
      board(K, cv, st, null);
      const ck = clock(K, cv, secs);
      K.snd.sting("eEvery5", { duck: 0.65 });
      let nIn = 0;
      const D = window.BVEMOD;
      const ex = D && D.r ? D.r.findIndex((r) => r[0] === "🦁👑") : -1;
      const place = ex >= 0 ? main(answerOf(D, { i: ex }, D.a && D.a[K.lang] ? K.lang : "en")) : tx("theAnswer");
      const got = yield K.ask({
        kind: "emojimake",
        prompt: tx("yourRiddle"),
        sec: secs,
        who: ps.map((p) => p.id),
        extra: { place, emo: { t: "make" } },
        onAns: (id) => {
          nIn++;
          if (a && a._cnt) a._cnt.textContent = tx("madeN", { n: K.num(nIn), total: K.num(ps.length) });
          const x = made && made.querySelector('[data-id="' + id + '"]');
          if (x) x.classList.add("in");
          K.snd.fx("pop", { vol: 0.6 });
        }
      });
      ck.stop();
      if (K.over()) return;
      const list = P.shuffle([...got].map(([id, x]) => ({ id, e: String(x.v && x.v.e || "").replace(/\s+/g, "").slice(0, 24), a: P.safe(x.v && x.v.a, 50) })).filter((x) => x.e && x.a && BVRX.picto().test(x.e) && !P.bad(x.a)));
      if (!list.length) {
        line(cv, K).appendChild(K.el("div", "emo-pill", null, tx("noneMade")));
        yield K.sleep(3500);
        return;
      }
      for (const r of list) {
        if (K.over()) return;
        const au = K.player(r.id);
        const others = K.players().filter((p) => p.id !== r.id && !p.out && !p.away);
        if (!au || !others.length) continue;
        const look = pickLook(s, st);
        const cv2 = screen(K, TPL.q[look], "made");
        setT(cv2, "title", tx("byName", { name: au.name }));
        setT(cv2, "sub", tx("makeSub"));
        const hd = $1(cv2, "hdr");
        if (hd) {
          const icon = hd.firstElementChild;
          if (icon) {
            icon.innerHTML = "";
            const im = mini(K, au, icon);
            im.style.cssText = "width:84px;height:84px;border-radius:24px;object-fit:" + (au.photo ? "cover" : "contain");
          }
        }
        const ems = splitEm(r.e);
        rows(cv2, "em", ems, (sp, e, i) => {
          sp.textContent = e;
          sp.style.animationDelay = i * 0.25 + "s";
          if (ems.length > 4) sp.style.fontSize = Math.max(70, Math.floor(880 / ems.length) - 30) + "px";
        });
        const a2 = $1(cv2, "answers");
        if (a2) {
          a2.style.display = "block";
          a2.innerHTML = "";
          const tb = K.el("div", "emo-typebox", a2);
          K.el("b", "", tb, tx("guessIt"));
          const d = K.el("div", "emo-dots", tb);
          for (let j = 0; j < 3; j++) K.el("i", "", d);
        }
        const ln = line(cv2, K);
        const rowEls = board(K, cv2, st, null);
        const gsec = st.sec ? Math.max(15, st.sec + 5) : 30;
        K.snd.sting("eNext", { duck: 0.65 });
        yield K.sleep(1200);
        const ck2 = clock(K, cv2, gsec);
        const answered = /* @__PURE__ */ new Set();
        const g = yield K.ask({
          kind: "text",
          prompt: "",
          sec: gsec,
          who: others.map((p) => p.id),
          extra: { max: 60, place: tx("theAnswer"), emo: { e: r.e, made: au.name, look } },
          onAns: (id) => {
            answered.add(id);
            const rr = rowEls.get(id);
            if (rr) rr.classList.add("emo-in");
            K.snd.fx("pop", { vol: 0.5 });
          }
        });
        ck2.stop();
        if (K.over()) return;
        const right = others.filter((p) => g.has(p.id) && P.close(g.get(p.id).v, r.a)).map((p) => p.id);
        K.snd.sting(right.length ? "eCorrect" : "eWrong", { duck: 0.65 });
        yield K.sleep(K.snd.on() ? 650 : 200);
        if (a2) {
          a2.innerHTML = "";
          const big = K.el("div", "emo-ansbig" + (right.length ? "" : " miss"), a2);
          K.el("span", "emo-badge ok", big, "✓");
          K.el("span", "", big, r.a);
          shrink(big, 0.55);
          const gs = K.el("div", "emo-guesses", a2);
          gs.style.marginTop = "22px";
          for (const p of others.slice(0, 16)) {
            const x = g.get(p.id);
            const okP = right.includes(p.id);
            const gg = K.el("div", "emo-guess " + (okP ? "ok" : x ? "bad" : "none"), gs);
            mini(K, p, gg);
            K.el("span", "", gg, x ? P.safe(String(x.v), 40, "***") : "...");
            K.el("span", "emo-badge " + (okP ? "ok" : "bad"), gg, okP ? "✓" : x ? "✗" : "–");
          }
        }
        const res = /* @__PURE__ */ new Map();
        for (const p of others) {
          const x = g.get(p.id), good = right.includes(p.id);
          let pts = 0;
          if (good) {
            pts = Math.round(100 * (0.5 + 0.5 * Math.max(0, 1 - (x.ms || 0) / (gsec * 1e3))));
            p.score += pts;
            p.right++;
          }
          res.set(p.id, good ? "emo-ok" : x ? "emo-bad" : "emo-none");
          K.result(p.id, { ok: good, pts, score: p.score, right: r.a, emo: { e: r.e, made: au.name, look } });
        }
        const easy = right.length === others.length && others.length > 1, hard = !right.length;
        const mpts = easy || hard ? 0 : 50 * right.length;
        au.score += mpts;
        K.result(au.id, { ok: mpts > 0, pts: mpts, score: au.score, title: easy ? tx("tooEasy") : hard ? tx("tooHard") : "", emo: { e: r.e, maker: true, look } });
        board(K, cv2, st, res);
        ln.textContent = "";
        K.el("div", "emo-pill " + (mpts ? "ok" : "bad") + " emo-pop", ln, easy ? "😅 " + tx("tooEasy") : hard ? "🤯 " + tx("tooHard") : "✍️ " + tx("makerPts", { name: "⁨" + au.name + "⁩", n: K.num(mpts) }));
        yield K.sleep(5200);
      }
    });
  }
  const line = (cv, K) => {
    let l = cv.querySelector(".emo-line");
    if (!l) {
      l = K.el("div", "emo-line", null);
      const a = $1(cv, "answers");
      if (a) a.after(l);
    }
    return l;
  };
  function winners(K, st, ps) {
    return __async(this, null, function* () {
      const { tx } = st;
      const look = (store.get("win", rnd(3)) + 1) % 3;
      store.set("win", look);
      const cv = screen(K, TPL.win[look], "win");
      let top;
      if (st.teamsOn) top = st.TEAMS.map((t) => ({ team: t, id: "t-" + t[0], name: t[3], score: K.players().filter((p) => p.team === t[0]).reduce((n, p) => n + p.score, 0) })).sort((a, b) => b.score - a.score);
      else top = ps.slice();
      const w1 = top[0], w2 = top[1], w3 = top[2];
      setT(cv, "wk", st.teamsOn ? tx("winTeam") : tx("winner"));
      setT(cv, "presents", up(tx("presents"), K.lang));
      const wt = $1(cv, "wtitle");
      if (wt) wt.textContent = "⭐ " + (yield K.tr("Emoji Riddles")) + " ⭐";
      setT(cv, "foot", tx("hostAgain"));
      const fillOne = (x, k) => {
        const av = $1(cv, "av" + k);
        if (x.team) teamFace(K, av, x.team);
        else face(K, av, x);
        setT(cv, k === 1 ? "wname" : "nm" + k, x.name);
        if (k === 1) for (const n of $(cv, "nm1")) n.textContent = x.name;
        setT(cv, "pt" + k, st.surv && !x.team ? (x.out ? "💀 " : "❤️ " + K.num(x.lives) + "  ·  ") + tx("ptsLine", { n: K.num(x.score) }) : tx("ptsLine", { n: K.num(x.score) }));
      };
      if (w1) fillOne(w1, 1);
      if (w2) fillOne(w2, 2);
      else for (const e of $(cv, "p2")) e.style.visibility = "hidden";
      ifs(cv, { p3: !!w3, p3none: !w3 });
      if (w3) fillOne(w3, 3);
      for (const k of ["wname", "nm1", "nm2", "nm3"]) for (const e of $(cv, k)) {
        e.style.whiteSpace = "nowrap";
        if (k === "wname") {
          e.style.maxWidth = "1100px";
        }
        shrink(e, 0.4, true);
      }
      K.snd.music("eWin", { fadeOut: 0.6, fadeIn: 0.4 });
      burst(cv);
      setTimeout(() => burst(cv), 1400);
      const list = top.slice(0, 10).map((x, i) => ({ id: x.id, n: x.name, s: x.score, av: x.team ? "boo:party" : x.av, c: x.team ? x.team[2] : x.color, t: x.team ? 1 : 0, l: st.surv && !x.team ? x.lives : void 0, o: x.out ? 1 : 0, place: i + 1 }));
      K.say({ k: "emo", t: "win", look, list, team: st.teamsOn ? 1 : 0 });
      yield K.sleep(1200);
    });
  }
})();
