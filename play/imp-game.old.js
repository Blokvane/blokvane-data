// Made from imp-game.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change imp-game.js and run node tools/old-js.js again.
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
  if (typeof BVPLAY === "undefined" || typeof BVIMPT === "undefined") return;
  const P = BVPLAYC;
  const TPL = BVIMPT;
  const W = () => typeof BVIMPW !== "undefined" ? BVIMPW : null;
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
        const v = JSON.parse(localStorage.getItem("bvplay:imp:" + k));
        return v == null ? d : v;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("bvplay:imp:" + k, JSON.stringify(v));
      } catch (e) {
      }
    }
  };
  const LOOKS = { peek: 5, clue: 3, who: 3, unm: 4, win: 4, pPeek: 4, pVote: 3, pWin: 4 };
  function nextLooks() {
    const r = store.get("looks", {});
    const out = {};
    for (const [k, n] of Object.entries(LOOKS)) {
      const v = ((+r[k] || 0) + 1) % n;
      r[k] = v;
      out[k] = v;
    }
    store.set("looks", r);
    return out;
  }
  const CATS = ["food", "animals", "places", "jobs", "sports", "home", "transport", "nature", "school", "clothes", "fun", "fantasy"];
  const CAT_EN = {
    food: "Food and drinks",
    animals: "Animals",
    places: "Places",
    jobs: "Jobs",
    sports: "Sports and games",
    home: "Around the house",
    transport: "Getting around",
    nature: "Nature and weather",
    school: "School and office",
    clothes: "Clothes",
    fun: "Music, parties and fun",
    fantasy: "Characters and stories",
    kids: "Pictures (for kids)"
  };
  const CAT_ICON = { food: "🍽️", animals: "🐾", places: "📍", jobs: "💼", sports: "⚽", home: "🏠", transport: "🚗", nature: "🌿", school: "✏️", clothes: "👕", fun: "🎉", fantasy: "🧙", kids: "🧸", own: "✍️" };
  const bankOf = (code) => {
    const w = W();
    return w && (w[code] || w.en) ? w[code] || w.en : null;
  };
  const catName = (code, cat) => {
    const b = bankOf(code);
    return b && b["_" + cat] || b && b[cat] && b[cat][0] || CAT_EN[cat] || cat;
  };
  const pairsOf = (cat) => {
    const w = W();
    if (!w) return [];
    if (cat === "kids") return w.kids || [];
    const b = w.en && w.en[cat];
    return b ? b.slice(1).map((x) => x.split("|")) : [];
  };
  function wordIn(code, cat, i, j) {
    const w = W();
    if (!w) return "";
    if (cat === "kids") return (w.kids[i] || [])[j] || "";
    const b = w[code] && w[code][cat] || w.en[cat];
    const x = b && b[1 + i];
    return x ? x.split("|")[j] || "" : "";
  }
  function freshPick(key, n) {
    const used = store.get("used", []);
    const free = [];
    for (let i2 = 0; i2 < n; i2++) if (!used.includes(key + ":" + i2)) free.push(i2);
    const i = free.length ? free[rnd(free.length)] : rnd(n);
    const keep = used.filter((x) => !x.startsWith(key + ":") || free.length).concat(key + ":" + i).slice(-220);
    store.set("used", keep);
    return i;
  }
  const ownPairs = (s) => String(s.own || "").split("\n").map((l) => l.split(/[,،、|]/).map((x) => P.safe(x, 40)).filter(Boolean)).filter((x) => x.length).slice(0, 200);
  let hostEl = null;
  function fitNow() {
    if (!hostEl || !hostEl.isConnected) return;
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
      }
      return np === p && nv === v ? d : np + ":" + nv;
    }).join(";");
  }
  const mirrorHtml = (h) => String(h).replace(/style="([^"]*)"/g, (m, st) => 'style="' + mirrorStyle(st) + '"');
  function screen(K, html, kind) {
    K.view(null);
    const host = K.el("div", "imp-host", K.stage);
    host.dataset.screen = kind || "";
    const cv = K.el("div", "imp-cv", host);
    cv.innerHTML = document.documentElement.dir === "rtl" ? mirrorHtml(html) : html;
    hostEl = host;
    fitNow();
    return cv.firstElementChild;
  }
  const $ = (root, k) => [...root.querySelectorAll('[data-k="' + k + '"]')];
  const setT = (root, k, t) => {
    for (const e of $(root, k)) e.textContent = t;
  };
  function rich(elx, text, parts, styles) {
    if (!elx) return;
    const st = styles || [...elx.querySelectorAll("span")].map((s) => s.getAttribute("style") || "");
    let html = "", rest = String(text);
    const re = /\{(\w+)\}/g;
    let m, last = 0, n = 0;
    const segs = [];
    while (m = re.exec(rest)) {
      segs.push([rest.slice(last, m.index), m[1]]);
      last = m.index + m[0].length;
    }
    segs.push([rest.slice(last), null]);
    const QL = `"“„«「『'‘`, QR = `"”»」』'’`, AFTER = "!！:：";
    for (let i = 0; i < segs.length; i++) {
      let [before, key] = segs[i];
      if (!key) {
        html += esc(before);
        break;
      }
      let open = "", close = "", tail = "";
      if (before && QL.includes(before.slice(-1))) {
        open = before.slice(-1);
        before = before.slice(0, -1);
      }
      let next = segs[i + 1] ? segs[i + 1][0] : "";
      if (open && next && QR.includes(next[0])) {
        close = next[0];
        next = next.slice(1);
      }
      if (next && AFTER.includes(next[0])) {
        tail = next[0];
        next = next.slice(1);
      }
      if (segs[i + 1]) segs[i + 1][0] = next;
      const v = parts[key] != null ? parts[key] : "";
      html += esc(before) + '<span style="' + esc(st[Math.min(n, st.length - 1)] || "") + '">' + esc(open + v + close + tail) + "</span>";
      n++;
    }
    elx.innerHTML = html;
  }
  function face(K, svg, p) {
    if (!svg || !p) return;
    const url = K.avatarUrl(p);
    if (!url) return;
    const w = +svg.getAttribute("width") || 40, h = +svg.getAttribute("height") || 52;
    const im = document.createElement("img");
    im.alt = "";
    im.src = url;
    im.className = "imp-face" + (p.photo ? " ph" : "");
    const s = p.photo ? Math.min(w, h) : Math.round(Math.max(w, h) * 1.12);
    im.style.width = s + "px";
    im.style.height = s + "px";
    if (svg.getAttribute("style")) im.style.cssText += ";" + svg.getAttribute("style").replace(/width:[^;]*;?|height:[^;]*;?/g, "");
    im.style.width = s + "px";
    im.style.height = s + "px";
    svg.replaceWith(im);
  }
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
  function shrink(elx, minK) {
    if (!elx) return;
    const base = parseFloat(getComputedStyle(elx).fontSize) || 40;
    let k = 1;
    elx.style.whiteSpace = elx.style.whiteSpace || "";
    for (let i = 0; i < 14 && (elx.scrollWidth > elx.clientWidth + 2 || elx.scrollHeight > elx.clientHeight + 4) && k > (minK || 0.45); i++) {
      k -= 0.05;
      elx.style.fontSize = (base * k).toFixed(1) + "px";
    }
  }
  function squeeze(part, maxH) {
    if (!part) return;
    part.style.transformOrigin = "top center";
    const h = part.scrollHeight;
    if (h > maxH) {
      const k = Math.max(0.42, maxH / h);
      part.style.transform = "scale(" + k.toFixed(3) + ")";
      part.style.marginBottom = (-(h - h * k)).toFixed(0) + "px";
    }
  }
  function ring(K, root, sec) {
    const cs = $(root, "ringc"), ns = $(root, "ringn");
    for (const c of cs) {
      c.style.animation = "none";
      void c.getBoundingClientRect();
      c.style.animation = "i-ringT " + Math.max(1, sec) + "s linear 1 forwards";
    }
    let left = sec;
    for (const n of ns) n.textContent = K.num(left);
    const now = K.now || Date.now, t0 = now();
    const iv = setInterval(() => {
      const l = Math.max(0, Math.ceil(sec - (now() - t0) / 1e3));
      if (l !== left) {
        left = l;
        for (const n of ns) n.textContent = K.num(l);
        if (l > 0 && l <= 3) K.snd.fx("tick", { vol: 0.5 });
      }
      if (l <= 0 || K.over()) clearInterval(iv);
    }, 200);
    return { stop() {
      clearInterval(iv);
      for (const c of cs) c.style.animationPlayState = "paused";
    }, left: () => left };
  }
  const up = (s, lang) => {
    try {
      return String(s).toLocaleUpperCase(lang);
    } catch (e) {
      return String(s).toUpperCase();
    }
  };
  const EN = {
    title: "Who's the Imposter?",
    gameN: "Game {n} / {total}",
    ready: "{n} / {total} looked",
    peekLine: 'Check your secret word: hold "{x}" on your phone, so nobody else sees it.',
    hold: "Hold to peek",
    topSecret: "Top secret",
    secretWord: "Secret word",
    clues: "Clues",
    roundN: "Round {n} / {total}",
    sayIt: "{name}: say one word about it",
    typeIt: "{name}: type one word about it",
    said: "{name}: {word}",
    whoIsIt: "Who is it?",
    talk: "Talk it over!",
    argue: "Argue it out. Then {x}",
    voteOnPhone: "vote on your phone.",
    voteNow: "Vote now: {x}",
    pickOnPhone: "pick on your phone!",
    votedN: "{n} of {total} voted",
    vote: "Vote",
    unmasked: "Unmasked!",
    impIs: "The imposter is...",
    impsAre: "The imposters are...",
    anyImp: "Was there an imposter at all?",
    wasLine: 'The imposter was {name}! The word was "{word}".',
    werLine: 'The imposters were {name}! The word was "{word}".',
    noneLine: 'There was no imposter! The word was "{word}".',
    canSteal: "{name} was caught... but can steal the win by guessing the word!",
    canStealP: "{name} were caught... but can steal the win by guessing the word!",
    caughtNote: "{name} was caught!",
    caughtNoteP: "{name} were caught!",
    gotAway: "{name} got away with it!",
    gotAwayP: "They got away with it!",
    allSame: "Everyone had the same word.",
    hadWord: `{name} had "{word}" and didn't know it.`,
    guessing: "{name} is guessing the word... {n}",
    guessingP: "{name} are guessing the word... {n}",
    stolen: "Stolen! {name} guessed it!",
    missed: 'Not "{word}"! The players win!',
    noGuess: "No guess! The players win!",
    caught: "Caught!",
    escaped: "Escaped!",
    noImp: "No imposter",
    imposter: "Imposter",
    found: "Imposter found",
    escapedT: "Imposter escaped",
    wanted: "Wanted",
    theWinners: "The winners",
    impCaught: "Imposter caught! {name} was the imposter",
    impEscaped: "Imposter escaped! {name} was the imposter",
    impsCaught: "Imposters caught! {name}",
    noImpBadge: "No imposter this time!",
    winners: "Winners",
    votedRight: "Voted right",
    players: "Players",
    scoreboard: "Scoreboard",
    whoVoted: "Who voted for the imposter",
    rightB: "Voted right",
    fooledB: "Fooled",
    impCaughtB: "Imposter · caught",
    impEscB: "Imposter · escaped",
    impStoleB: "Imposter · stole it",
    pt1: "{n} pt",
    pts: "{n} pts",
    each1: "1 point each",
    eachN: "{n} points each",
    ptsN: "{n} points",
    pt1L: "1 point",
    winnersRight: "Winners · voted right",
    fooled: "Fooled",
    nobody: "Nobody this time",
    hostAgain: "The host can play again, or pick another game.",
    nextIn: "The next game starts in {n}...",
    hostNext: "The host starts the next game.",
    finalK: "After {n} games",
    gamesL: "Games",
    totalPts: "Total points",
    champ: "Champion",
    wins: "{n} wins",
    win1: "1 win",
    howTo: "How to play",
    left: "The imposter left the game!",
    need3: "This game needs at least 3 players.",
    nextGame: "Next game",
    startVote: "Vote now",
    startClues: "Start the clues",
    youWord: "Your words"
  };
  const MODES = [
    ["classic", "Classic", "Everyone gets the secret word, except the imposter: they only see the category."],
    ["undercover", "Undercover", "The imposter gets a similar word instead, and doesn't even know they are the imposter."],
    ["blind", "Blind imposter", "The imposter sees nothing at all, not even the category. Hard for the imposter!"],
    ["double", "Double trouble", "Two imposters who know each other. If one gets away, they both win."],
    ["trust", "Trust no one", 'There might be one imposter, or none at all. If you think everyone has the word, vote "No imposter".'],
    ["kids", "Kids", "Pictures instead of words, for little ones who can't read yet."]
  ];
  const modeOf = (s) => MODES.some((m) => m[0] === s.mode) ? s.mode : "classic";
  function howto(s) {
    const m = modeOf(s);
    const out = [];
    out.push(["📱", m === "kids" ? 'Hold "Hold to peek" on your phone to see your secret picture. The imposter sees a question mark.' : m === "undercover" ? `Hold "Hold to peek" on your phone to see your secret word. One player has a similar word, and doesn't know it.` : m === "blind" ? 'Hold "Hold to peek" on your phone to see your secret word. The imposter sees nothing at all.' : 'Hold "Hold to peek" on your phone to see your secret word. The imposter only sees the category.']);
    if (m === "double") out.push(["👯", "There are two imposters, and they know each other. If one of them gets away, they both win."]);
    if (m === "trust") out.push(["🤔", 'There might be one imposter, or none at all. If you think everyone has the word, vote "No imposter".']);
    out.push([s.clue === "type" ? "⌨️" : "🗣️", s.clue === "type" ? "Take turns typing one word about it on your phone. Too obvious, and the imposter catches on!" : "Take turns saying one word about it. Too obvious, and the imposter catches on!"]);
    out.push(["🗳️", "Talk it over, then vote on your phone. More than half of the votes on the imposter catch them."]);
    out.push(["⭐", "Everyone who voted right scores. An imposter who gets away scores more."]);
    if (s.last !== false && m !== "undercover") out.push(["🎯", "A caught imposter can still steal the win by guessing the word."]);
    return out;
  }
  BVPLAY.game({
    id: "imposter",
    name: "Who's the Imposter?",
    emoji: "🕵️",
    sub: "Everyone has the same secret word, except one.",
    min: 3,
    step: ["Hold to peek", "See your secret word, then find the imposter."],
    deco: "🕵️🤫🗳️🎭",
    // the lobby in the game's design: its icons on the right, the title's last word in neon
    lobbyTop: (t) => {
      const h = t.querySelector("h1");
      if (h) {
        const txt = h.textContent;
        const i = txt.lastIndexOf(" ");
        h.textContent = "";
        if (i > 0) h.append(txt.slice(0, i + 1));
        const sp = document.createElement("span");
        sp.className = "imp-neon";
        sp.textContent = i > 0 ? txt.slice(i + 1) : txt;
        h.append(sp);
      }
      const d = t.querySelector(".deco");
      if (d && TPL.deco) {
        d.innerHTML = TPL.deco;
        d.classList.add("imp-deco");
      }
    },
    // each player can read the game in their own language on their phone (their secret word too)
    mlang: true,
    sounds: ["iNext", "tick", "pop", "stamp", "whoosh", "sparkle", "flip", "coin", "drumroll", "neon", "zip", "land", "shutter", "print"],
    music: { lobby: "iLobby", again: "iLobby" },
    // (the game draws its own last screen: the winners, as its design has them)
    ownEnd: true,
    prep: () => {
      try {
        for (const f of ["700 40px Fredoka", "800 30px Nunito", '700 16px "JetBrains Mono"']) document.fonts.load(f).catch(() => {
        });
      } catch (e) {
      }
    },
    rules: (s) => howto(s).slice(0, 3).map((x) => x[1]),
    howto,
    steps: [
      { t: "Game mode", s: "Mode", keys: ["lang", "mode"] },
      { t: "Secret words", s: "Words", keys: ["words", "own"] },
      { t: "Imposters and games", s: "Games", keys: ["imps", "games", "last"] },
      { t: "Clues", keys: ["clue", "rounds", "clueSec", "order"] },
      { t: "Timing", s: "Time", keys: ["peekSec", "talkSec", "voteSec", "guessSec", "next", "nextSec"] },
      { t: "Points and rules", s: "Points", keys: ["ptsRight", "ptsEsc", "ptsSteal", "rules", "rulesSec"] }
    ],
    settings: [
      { key: "mode", label: "Game mode", type: "seg", look: "list", options: MODES, default: "classic" },
      { key: "words", label: "Secret words", type: "seg", options: [["mix", "All mixed", "A different category every game."], ...CATS.map((c) => [c, CAT_EN[c]]), ["own", "Your own words", "Type the words yourself, one on each line."]], default: "mix", when: ["mode", "!kids"] },
      { key: "own", label: "Your own words", type: "text", default: "", when: [["words", "own"], ["mode", "!kids"]], desc: "One word on each line. For Undercover, add a similar word after a comma: Pizza, Burger" },
      { key: "imps", label: "How many imposters", type: "number", min: 1, max: 10, quick: [1, 2, 3], unit: "imposters", default: 1, when: ["mode", ["classic", "undercover", "blind", "kids"]], desc: "Never more than a third of the room: with fewer players, there are fewer imposters." },
      { key: "games", label: "Games in a row", type: "number", min: 1, max: 50, quick: [1, 3, 5, 10], unit: "games", default: 3 },
      { key: "last", label: "Last chance for the imposter", type: "toggle", default: true, when: ["mode", "!undercover"], desc: "A caught imposter can still steal the win by guessing the word from six." },
      { key: "clue", label: "Clues", type: "seg", options: [["say", "Say it out loud", "Everyone says their word out loud."], ["type", "Type it", "Clues are typed on the phones and show on the TV. Good for loud rooms."]], default: "say" },
      { key: "rounds", label: "Rounds of clues", type: "number", min: 1, max: 10, quick: [1, 2, 3], unit: "rounds", default: 2, desc: "Each round, everyone gives one clue." },
      { key: "clueSec", label: "Time for each clue", type: "number", min: 3, max: 300, quick: [10, 15, 20, 30], unit: "seconds", default: 15 },
      { key: "order", label: "Who goes first", type: "seg", options: [["random", "Random", "A new order every game."], ["joined", "In the order they joined", "The first one in goes first, then the next."]], default: "random" },
      { key: "peekSec", label: "Time to look at the word", type: "number", min: 5, max: 300, quick: [15, 30, 60], unit: "seconds", default: 30, desc: "The clues start sooner when everyone has looked." },
      { key: "talkSec", label: "Time to talk it over", type: "number", min: 0, max: 900, quick: [30, 60, 90, 120], unit: "seconds", default: 90, desc: "The host can start the vote sooner from their phone. 0: straight to the vote." },
      { key: "voteSec", label: "Time to vote", type: "number", min: 5, max: 300, quick: [15, 20, 30, 60], unit: "seconds", default: 30 },
      { key: "guessSec", label: "Time to guess the word", type: "number", min: 5, max: 120, quick: [10, 20, 30], unit: "seconds", default: 20, when: [["last", true], ["mode", "!undercover"]] },
      { key: "next", label: "Next game", type: "seg", options: [["host", "The host starts it", "The host taps Next game on their phone when everyone is ready."], ["auto", "Automatic", "The next game starts by itself after a short wait."]], default: "host" },
      { key: "nextSec", label: "Wait before the next game", type: "number", min: 3, max: 300, quick: [10, 20, 30], unit: "seconds", default: 20, when: ["next", "auto"] },
      { key: "ptsRight", label: "Points for a right vote", type: "number", min: 0, max: 100, quick: [1, 2, 3], unit: "points", default: 1 },
      { key: "ptsEsc", label: "Points for an imposter who gets away", type: "number", min: 0, max: 100, quick: [2, 3, 5], unit: "points", default: 3 },
      { key: "ptsSteal", label: "Points for guessing the word", type: "number", min: 0, max: 100, quick: [1, 2, 3], unit: "points", default: 3, when: [["last", true], ["mode", "!undercover"]], desc: "For a caught imposter who guesses the secret word." },
      { key: "rules", label: "How to play first", type: "toggle", default: true, desc: "The TV and the phones show how to play before the first game." },
      { key: "rulesSec", label: "How long it shows", type: "number", min: 5, max: 120, quick: [10, 15, 20, 30], unit: "seconds", default: 15, when: ["rules", true] }
    ],
    tv(K) {
      return __async(this, null, function* () {
        const s = K.settings;
        const TX = yield P.trAll(EN);
        const tx = (k, v) => {
          const t2 = fill(TX[k] || EN[k] || k, v);
          return document.documentElement.dir === "rtl" ? "‏" + t2 : t2;
        };
        const lang = K.lang;
        const total = clamp(s.games, 1, 50, 3);
        const wins = /* @__PURE__ */ new Map();
        let lastImps = /* @__PURE__ */ new Set();
        let res = null;
        if (s.rules !== false) {
          yield rulesScreen(K, s, tx);
          if (K.over()) return [];
        }
        for (let g = 1; g <= total && !K.over(); g++) {
          res = yield oneGame(K, s, tx, g, total, lastImps);
          if (!res) break;
          lastImps = new Set(res.imps.map((p) => p.id));
          for (const id of res.winners) wins.set(id, (wins.get(id) || 0) + 1);
          const lastOne = g === total || K.over();
          yield winnersScreen(K, s, tx, res, lastOne ? total > 1 ? "final1" : "end" : "next");
          sendResult(K, res, lastOne && total === 1);
          if (lastOne) {
            if (total > 1) {
              yield K.sleep(9e3);
              if (!K.over()) {
                finalScreen(K, s, tx, res, wins, total);
                sendFinal(K, res, wins, total);
              }
            }
            break;
          }
          yield between(K, s, tx, g);
        }
        if (K.over()) return [];
        const rk = K.players().slice().sort((a, b) => b.score - a.score);
        rk.own = true;
        return rk;
      });
    }
  });
  function rulesScreen(K, s, tx) {
    return __async(this, null, function* () {
      const sec = clamp(s.rulesSec, 5, 120, 15);
      const scr = screen(K, TPL.rules, "rules");
      const m = MODES.find((x) => x[0] === modeOf(s));
      setT(scr, "title", tx("howTo"));
      setT(scr, "sub", yield K.tr(m[1]));
      setT(scr, "mdesc", yield K.tr(m[2]));
      const list = howto(s);
      const tr = yield Promise.all(list.map((x) => K.tr(x[1])));
      rows(scr, "rule", list, (r, x, i) => {
        setT(r, "ri", x[0]);
        setT(r, "rn", String(i + 1));
        setT(r, "rt", tr[i]);
      });
      const rg = ring(K, scr, sec);
      K.say({ k: "imp", t: "rules", sec });
      K.snd.music("iLobby");
      yield K.sleep(sec * 1e3);
      rg.stop();
    });
  }
  function oneGame(K, s, tx, g, total, lastImps) {
    return __async(this, null, function* () {
      const mode = modeOf(s);
      const ps = K.alive().slice();
      if (ps.length < 3) {
        const scr2 = screen(K, TPL.peek[0], "need");
        setT(scr2, "title", tx("title"));
        setT(scr2, "sub", tx("gameN", { n: K.num(g), total: K.num(total) }));
        setT(scr2, "line", tx("need3"));
        K.wait(tx("need3"));
        yield K.sleep(5e3);
        return null;
      }
      const look = nextLooks();
      const kids = mode === "kids";
      let cat, pi = 0, own = null;
      const ownL = !kids && s.words === "own" ? ownPairs(s) : [];
      if (K.free) {
        const k2 = ((g - 1) % K.freeN + K.freeN) % K.freeN;
        cat = CATS[k2 % CATS.length];
        pi = Math.floor(k2 / CATS.length);
      } else if (ownL.length >= 1) {
        cat = "own";
        pi = freshPick("own", ownL.length);
        own = ownL[pi];
      } else if (kids) {
        cat = "kids";
        pi = freshPick("kids", Math.max(1, pairsOf("kids").length));
      } else {
        cat = CATS.includes(s.words) ? s.words : CATS[(store.get("mix", rnd(CATS.length)) + 1 + rnd(CATS.length - 1)) % CATS.length];
        if (!CATS.includes(s.words)) store.set("mix", CATS.indexOf(cat));
        pi = freshPick(cat, Math.max(1, pairsOf(cat).length));
      }
      const fallback = ["Pizza", "Burger"];
      const wordFor = (code, j) => __async(this, null, function* () {
        if (cat === "own") return own[j] || own[0];
        const w = wordIn(code || K.lang, cat, pi, j);
        if (w) return w;
        const en = wordIn("en", cat, pi, j) || fallback[j];
        return code && code !== K.lang ? en : yield K.tr(en);
      });
      const catFor = (code) => __async(this, null, function* () {
        return cat === "own" ? yield K.trFor(code || K.lang, EN.youWord) : W() && (W()[code || K.lang] || W().en) ? catName(code || K.lang, cat) : yield K.tr(CAT_EN[cat] || cat);
      });
      const word = yield wordFor("", 0), close = yield wordFor("", 1);
      const catT = yield catFor("");
      const most = Math.max(1, Math.floor((ps.length - 1) / 2));
      let k = mode === "double" ? 2 : mode === "trust" ? Math.random() < 0.3 ? 0 : 1 : clamp(s.imps, 1, 10, 1);
      k = Math.min(k, most);
      const pool = P.shuffle(ps.filter((p) => !lastImps.has(p.id)));
      const imps = (pool.length >= k ? pool : P.shuffle(ps)).slice(0, k);
      const isImp = new Set(imps.map((p) => p.id));
      for (const p of ps) {
        const code = K.langOf(p.id) || K.lang;
        const imp = isImp.has(p.id);
        const sec = { k: "secret", g, imp: false, word: "", cat: "", kids, pic: kids };
        if (!imp) {
          sec.word = yield wordFor(code, 0);
          sec.cat = yield catFor(code);
        } else if (mode === "undercover") {
          sec.word = yield wordFor(code, 1);
          sec.cat = yield catFor(code);
        } else {
          sec.imp = true;
          sec.pic = false;
          sec.cat = mode === "blind" ? "" : yield catFor(code);
          if (mode === "double") sec.mates = imps.filter((x) => x.id !== p.id).map((x) => x.name);
        }
        K.box(p.id, sec);
      }
      const peekSec = clamp(s.peekSec, 5, 300, 30);
      let scr = screen(K, TPL.peek[look.peek], "peek");
      setT(scr, "title", "");
      titleNeon(scr, tx("title"));
      setT(scr, "sub", tx("gameN", { n: K.num(g), total: K.num(total) }));
      const cnt = document.createElement("span");
      cnt.className = "imp-cnt";
      const sub0 = $(scr, "sub")[0];
      if (sub0) sub0.after(cnt);
      rich($(scr, "line")[0], tx("peekLine"), { x: tx("hold") }, null);
      setT(scr, "ts", up(tx("topSecret"), K.lang));
      setT(scr, "sw", up(tx("secretWord"), K.lang));
      setT(scr, "hp", tx("hold"));
      K.snd.music("iPlay", { fadeOut: 1.4, fadeIn: 1.2 });
      const looked = /* @__PURE__ */ new Set();
      const showCnt = () => {
        cnt.textContent = "✓ " + tx("ready", { n: K.num(looked.size), total: K.num(ps.length) });
      };
      showCnt();
      K.on("peeked", (m, p) => {
        if (!looked.has(p.id) && ps.some((x) => x.id === p.id)) {
          looked.add(p.id);
          showCnt();
          K.snd.fx("pop", { vol: 0.7 });
        }
      });
      K.say({ k: "imp", t: "peek", d: look.pPeek, g, of: total });
      let goPeek = false;
      const nPeek = hostButton(K, tx("startClues"), () => {
        goPeek = true;
      });
      const t0 = Date.now();
      while (!K.over() && !goPeek && Date.now() - t0 < peekSec * 1e3) {
        if (looked.size >= ps.filter((p) => !p.away).length && Date.now() - t0 > 2500) {
          yield K.sleep(1800);
          break;
        }
        yield K.sleep(300);
      }
      nPeek();
      if (K.over()) return null;
      const rounds = clamp(s.rounds, 1, 10, 2), clueSec = clamp(s.clueSec, 3, 300, 15);
      const order = s.order === "joined" ? ps.slice() : P.shuffle(ps);
      const roundOrder = () => {
        const here = order.filter((p) => K.alive().some((x) => x.id === p.id));
        const f = here.findIndex((p) => !isImp.has(p.id));
        return f > 0 ? here.slice(f).concat(here.slice(0, f)) : here;
      };
      const said = [];
      const typed = s.clue === "type";
      for (let r = 1; r <= rounds && !K.over(); r++) {
        for (const p of roundOrder()) {
          if (K.over()) return null;
          if (!K.alive().some((x) => x.id === p.id)) continue;
          scr = screen(K, TPL.clue[look.clue], "clue");
          setT(scr, "title", tx("clues"));
          setT(scr, "sub", tx("roundN", { n: K.num(r), total: K.num(rounds) }));
          setT(scr, "name", p.name);
          for (const a of $(scr, "av")) face(K, a, p);
          const sayEl = $(scr, "say")[0];
          rich(sayEl, tx(typed ? "typeIt" : "sayIt", { name: "{name}" }), { name: p.name }, null);
          notes(scr, said);
          K.snd.fx("iNext", { duck: 0.45 });
          K.say({ k: "imp", t: "clue", id: p.id, name: p.name, r, of: rounds, sec: clueSec, typed });
          const rg = ring(K, scr, clueSec);
          if (typed) {
            const got = yield K.ask({ kind: "text", prompt: yield K.tr("One word about it"), sec: clueSec, who: [p.id], extra: { max: 24, imp: { clue: true } } });
            rg.stop();
            const a = got.get(p.id);
            const w = a ? P.safe(String(a.v).split(/\s+/).slice(0, 3).join(" "), 24, "***") : "...";
            said.push({ id: p.id, name: p.name, w });
            const st0 = (sayEl && sayEl.querySelector("span") ? sayEl.querySelector("span").getAttribute("style") : "") || "";
            const gold = /#ffc93c/i.test(st0);
            rich(sayEl, tx("said", { name: "{name}", word: '"{word}"' }), { name: p.name, word: w }, [st0, st0.replace(/color:[^;]+/, "color:" + (gold ? "#ff4d6a" : "#ffc93c"))]);
            K.say({ k: "imp", t: "clues", list: said.slice(-24).map((x) => [x.name, x.w]) });
            K.snd.fx("pop");
            yield K.sleep(2200);
          } else {
            let done = false;
            const off = K.on("done", (m, q) => {
              if (q.id === p.id || K.isHost(q.id)) done = true;
            });
            const tEnd = Date.now() + clueSec * 1e3;
            while (!done && !K.over() && Date.now() < tEnd) yield K.sleep(200);
            off();
            rg.stop();
            if (done) yield K.sleep(500);
          }
        }
      }
      if (K.over()) return null;
      const talkSec = clamp(s.talkSec, 0, 900, 90);
      scr = screen(K, TPL.who[look.who], "who");
      setT(scr, "title", tx("whoIsIt"));
      setT(scr, "sub", tx("talk"));
      setT(scr, "vote", up(tx("vote"), K.lang));
      const lineW = $(scr, "line")[0];
      const lineSt = lineW ? [...lineW.querySelectorAll("span")].map((x) => x.getAttribute("style") || "") : [];
      rich(lineW, tx("argue", { x: "{x}" }), { x: tx("voteOnPhone") }, lineSt);
      shrink(lineW, 0.6);
      const nSus = ps.length;
      rows(scr, "sus", ps, (row, p, i) => {
        setT(row, "no", K.num(i + 1));
        const sv = $(row, "sv")[0];
        if (sv) sv.style.animationDuration = (2 + i % 5 * 0.3).toFixed(1) + "s";
        if (nSus > 5) {
          const w = Math.max(70, Math.floor(1300 / nSus));
          row.style.width = w + "px";
          row.style.flex = "none";
          const svg = row.querySelector("svg");
          if (svg) {
            svg.setAttribute("width", String(Math.min(170, w)));
            svg.setAttribute("height", String(Math.round(Math.min(170, w) * 220 / 170)));
          }
        }
      });
      K.snd.music("iVote", { fadeOut: 1, fadeIn: 1.4 });
      if (talkSec > 0) {
        K.say({ k: "imp", t: "talk", sec: talkSec, list: said.slice(-24).map((x) => [x.name, x.w]) });
        const rg = ring(K, scr, talkSec);
        let go = false;
        const nb = hostButton(K, tx("startVote"), () => {
          go = true;
        });
        const tEnd = Date.now() + talkSec * 1e3;
        while (!go && !K.over() && Date.now() < tEnd) yield K.sleep(250);
        nb();
        rg.stop();
      }
      if (K.over()) return null;
      const voters = K.alive().filter((p) => ps.some((x) => x.id === p.id));
      const impsHere = imps.filter((p) => voters.some((v) => v.id === p.id));
      const voteSec = clamp(s.voteSec, 5, 300, 30);
      setT(scr, "sub", tx("votedN", { n: K.num(0), total: K.num(voters.length) }));
      rich(lineW, tx("voteNow", { x: "{x}" }), { x: tx("pickOnPhone") }, lineSt);
      shrink(lineW, 0.6);
      const rgV = ring(K, scr, voteSec);
      let nIn = 0;
      const pick = mode === "trust" ? 1 : Math.max(1, k);
      const votes = imps.length && !impsHere.length ? /* @__PURE__ */ new Map() : yield K.ask({
        kind: "players",
        prompt: yield K.tr("Who is the imposter?"),
        sec: voteSec,
        who: voters.map((p) => p.id),
        opts: voters.map((p) => ({ id: p.id, name: p.name, ph: !!p.photo, av: p.av })),
        extra: { imp: { d: look.pVote, pick, none: mode === "trust" } },
        onAns: () => {
          nIn++;
          setT(scr, "sub", tx("votedN", { n: K.num(nIn), total: K.num(voters.length) }));
          K.snd.fx("pop", { vol: 0.8 });
        }
      });
      rgV.stop();
      if (K.over()) return null;
      const det = voters.filter((p) => !isImp.has(p.id));
      const picks = /* @__PURE__ */ new Map();
      for (const p of voters) {
        const a = votes.get(p.id);
        let v = a ? a.v : null;
        if (v === "none") {
          picks.set(p.id, ["none"]);
          continue;
        }
        v = (Array.isArray(v) ? v : v != null ? [v] : []).map(String).filter((x, i, arr) => arr.indexOf(x) === i && x !== p.id && voters.some((q) => q.id === x)).slice(0, pick);
        picks.set(p.id, v);
      }
      const voted = det.filter((p) => (picks.get(p.id) || []).length);
      const base = voted.length;
      const on = (id) => det.filter((p) => (picks.get(p.id) || []).includes(id)).length;
      const caught = new Map(imps.map((p) => [p.id, on(p.id) > base / 2]));
      const noneRight = k === 0 ? det.filter((p) => (picks.get(p.id) || [])[0] === "none").length : 0;
      const res = { g, total, mode, cat, pi, catT, word, close, kids, ps, imps, isImp, caught, picks, det, voted, base, noneRight, k, stole: /* @__PURE__ */ new Set(), guesses: /* @__PURE__ */ new Map(), look, pts: /* @__PURE__ */ new Map(), left: imps.length > 0 && !impsHere.length };
      yield reveal(K, s, tx, res);
      if (K.over()) return null;
      const canGuess = s.last !== false && mode !== "undercover" && !res.left ? imps.filter((p) => caught.get(p.id) && K.alive().some((x) => x.id === p.id)) : [];
      if (canGuess.length) yield lastChance(K, s, tx, res, canGuess);
      if (K.over()) return null;
      score(K, s, res);
      return res;
    });
  }
  function titleNeon(scr, text) {
    const t = $(scr, "title")[0];
    if (!t) return;
    const span = TPL.neon || "";
    const i = text.lastIndexOf(" ");
    t.innerHTML = (i > 0 ? esc(text.slice(0, i + 1)) : "") + span.replace("{x}", esc(i > 0 ? text.slice(i + 1) : text));
  }
  function notes(scr, said) {
    const n1 = $(scr, "n1")[0], n2 = $(scr, "n2")[0];
    const last = said.slice(-2);
    for (const [elx, x] of [[n1, last[0]], [n2, last[1]]]) {
      if (!elx || !x) continue;
      elx.textContent = x.w;
      elx.style.fontSize = (x.w.length > 10 ? 30 : x.w.length > 6 ? 40 : 52) + "px";
      elx.style.padding = "0 14px";
      elx.style.textAlign = "center";
      elx.style.lineHeight = "1.05";
    }
  }
  let btnN = 0;
  function hostButton(K, label, fn) {
    const n = ++btnN + 1e3 * (Date.now() % 1e3);
    let on = true;
    const off = K.on("next", (m, p) => {
      if (on && +m.n === n && K.isHost(p.id)) {
        on = false;
        fn();
      }
    });
    K.hostWait(true);
    (() => __async(this, null, function* () {
      for (let k = 0; on && !K.over(); k++) {
        if (k % 8 === 0) {
          const h = K.players().find((p) => K.isHost(p.id));
          if (h) K.sayTo(h.id, { k: "nextq", n, label });
        }
        yield K.sleep(500);
      }
    }))();
    return () => {
      on = false;
      off();
      K.hostWait(false);
      K.say({ k: "imp", t: "nobtn" });
    };
  }
  function reveal(K, s, tx, res) {
    return __async(this, null, function* () {
      const scr = screen(K, TPL.unm[res.look.unm], "unm");
      scr.classList.add("imp-pre");
      setT(scr, "title", tx("unmasked"));
      const names = res.imps.map((p) => p.name);
      const nameJoin = names.join(" & ");
      const lineEl = $(scr, "line")[0], noteEl = $(scr, "note")[0];
      const lineSt = lineEl ? [...lineEl.querySelectorAll("span")].map((x) => x.getAttribute("style") || "") : [];
      lineEl.textContent = res.k === 0 || K.settings.mode === "trust" ? tx("anyImp") : tx(res.imps.length > 1 ? "impsAre" : "impIs");
      noteEl.textContent = "";
      setT(scr, "name", "???");
      setT(scr, "plate", up(tx("imposter"), K.lang));
      setT(scr, "wanted", up(tx("wanted"), K.lang));
      const first = res.imps[0];
      if (first) for (const a of $(scr, "av")) face(K, a, first);
      const allCaught = res.imps.length && res.imps.every((p) => res.caught.get(p.id));
      const someCaught = res.imps.some((p) => res.caught.get(p.id));
      for (const e of $(scr, "stamp")) {
        const was = [...(e.textContent || "").trim()].length || 6, t = up(res.k === 0 ? tx("noImp") : someCaught ? tx("caught") : tx("escaped"), K.lang);
        e.textContent = t;
        const n = [...t.replace(/\u200F/g, "")].length, fs = parseFloat(e.style.fontSize) || 0;
        if (fs && n > was + 2) e.style.fontSize = Math.round(fs * Math.max(0.55, (was + 2) / n)) + "px";
      }
      setT(scr, "tape", up(res.k === 0 ? tx("noImp") : allCaught ? tx("found") : tx("escapedT"), K.lang));
      if (res.k === 0) for (const a of [...$(scr, "jit"), ...$(scr, "mask"), ...$(scr, "name"), ...$(scr, "plate")]) a.style.visibility = "hidden";
      setT(scr, "word", res.word);
      for (const wi of $(scr, "wicon")) {
        const sp = document.createElement("span");
        sp.textContent = res.kids ? "🧸" : CAT_ICON[res.cat] || "🔎";
        sp.style.cssText = "font-size:50px;line-height:1;width:64px;text-align:center;flex:none";
        wi.replaceWith(sp);
      }
      K.say({ k: "imp", t: "reveal" });
      K.snd.music("iReveal", { fadeOut: 0.5, fadeIn: 0.05 });
      yield K.snd.at("iReveal", 8);
      if (K.over()) return;
      scr.classList.remove("imp-pre");
      scr.classList.add("imp-go");
      setT(scr, "name", first ? first.name : "");
      const wordQ = res.kids ? res.word : res.word;
      if (res.k === 0) rich(lineEl, tx("noneLine", { word: "{word}" }), { word: wordQ }, [lineSt[1] || lineSt[0]]);
      else rich(lineEl, tx(res.imps.length > 1 ? "werLine" : "wasLine", { name: "{name}", word: "{word}" }), { name: nameJoin, word: wordQ }, lineSt);
      shrink(lineEl, 0.55);
      const canSteal = K.settings.last !== false && res.mode !== "undercover";
      if (res.left) noteEl.textContent = tx("left");
      else if (res.k === 0) noteEl.textContent = tx("allSame");
      else if (res.mode === "undercover") noteEl.textContent = tx("hadWord", { name: nameJoin, word: res.close }) + " " + (allCaught ? tx("caught") : res.imps.length > 1 ? tx("gotAwayP") : tx("escaped"));
      else if (someCaught) {
        const cn = res.imps.filter((p) => res.caught.get(p.id));
        noteEl.textContent = canSteal ? tx(cn.length > 1 ? "canStealP" : "canSteal", { name: cn.map((p) => p.name).join(" & ") }) : tx(res.imps.length > 1 ? "caughtNoteP" : "caughtNote", { name: nameJoin });
      } else noteEl.textContent = res.imps.length > 1 ? tx("gotAwayP") : tx("gotAway", { name: nameJoin });
      shrink(noteEl, 0.6);
      K.say({ k: "imp", t: "unmask", names, word: res.word, caught: someCaught, none: res.k === 0 });
      for (let i = 1; i < res.imps.length && !K.over(); i++) {
        yield K.sleep(3200);
        const p = res.imps[i];
        for (const a of scr.querySelectorAll("img.imp-face")) {
          a.src = K.avatarUrl(p);
          a.classList.toggle("ph", !!p.photo);
        }
        setT(scr, "name", p.name);
        for (const e of scr.querySelectorAll('[data-k="mask"],[data-k="stamp"],[data-k="jit"]')) {
          e.style.animation = "none";
          void e.offsetWidth;
          e.style.animation = "";
        }
      }
      yield K.sleep(4200);
    });
  }
  function lastChance(K, s, tx, res, who) {
    return __async(this, null, function* () {
      const sec = clamp(s.guessSec, 5, 120, 20);
      const scr = K.stage.querySelector(".imp-cv > *");
      const noteEl = scr && $(scr, "note")[0];
      const own = res.cat === "own" ? ownPairs(s) : null;
      const n = own ? own.length : pairsOf(res.cat).length;
      const opts0 = [[res.cat, res.pi, 0]];
      const alike = own ? (own[res.pi] || [])[1] : wordIn("en", res.cat, res.pi, 1);
      if (alike) opts0.push([res.cat, res.pi, 1]);
      for (const i of P.shuffle([...Array(n).keys()].filter((i2) => i2 !== res.pi))) {
        if (opts0.length >= 6) break;
        opts0.push([res.cat, i, 0]);
      }
      for (const i of P.shuffle([...Array(pairsOf("food").length).keys()])) {
        if (opts0.length >= 6) break;
        if (!opts0.some((o) => o[0] === "food" && o[1] === i)) opts0.push(["food", i, 0]);
      }
      const order = P.shuffle(opts0);
      const one = (_0, _1) => __async(this, [_0, _1], function* (code, [c, i, j]) {
        return c === "own" ? (own[i] || [])[j] || "" : wordIn(code, c, i, j) || (yield K.tr(wordIn("en", c, i, j)));
      });
      const optIn = (code) => Promise.all(order.map((o) => one(code, o)));
      const opts = yield optIn(K.lang);
      const tr = {};
      for (const p of who) {
        const code = K.langOf(p.id);
        if (code && code !== K.lang && !tr[code]) tr[code] = { o: yield optIn(code) };
      }
      const answer = order.findIndex((o) => o[0] === res.cat && o[1] === res.pi && o[2] === 0);
      let left = sec;
      const names = who.map((p) => p.name).join(" & ");
      const gk = who.length > 1 ? "guessingP" : "guessing";
      if (noteEl) noteEl.textContent = tx(gk, { name: names, n: K.num(left) });
      const iv = setInterval(() => {
        if (K.paused && K.paused()) return;
        left = Math.max(0, left - 1);
        if (noteEl) noteEl.textContent = tx(gk, { name: names, n: K.num(left) });
        if (left > 0 && left <= 3) K.snd.fx("tick", { vol: 0.5 });
      }, 1e3);
      K.say({ k: "imp", t: "guessing", names: who.map((p) => p.name) });
      const got = yield K.ask({ kind: "choice", prompt: yield K.tr("Guess the secret word!"), opts, sec, who: who.map((p) => p.id), extra: { tr, imp: { guess: true, cat: res.catT, catTr: yield catsFor(K, who, res) } } });
      clearInterval(iv);
      for (const p of who) {
        const a = got.get(p.id);
        const v = a ? +a.v : -1;
        res.guesses.set(p.id, v);
        if (v === answer) res.stole.add(p.id);
      }
      const stoleAny = res.stole.size > 0;
      if (noteEl) {
        if (stoleAny) noteEl.textContent = tx("stolen", { name: who.filter((p) => res.stole.has(p.id)).map((p) => p.name).join(" & ") });
        else {
          const v = res.guesses.get(who[0].id);
          noteEl.textContent = v >= 0 && opts[v] ? tx("missed", { word: opts[v] }) : tx("noGuess");
        }
        noteEl.classList.remove("imp-flash");
        void noteEl.offsetWidth;
        noteEl.classList.add("imp-flash");
      }
      K.snd.fx(stoleAny ? "sparkle" : "stamp", { duck: 0.5 });
      yield K.sleep(3600);
    });
  }
  function catsFor(K, who, res) {
    return __async(this, null, function* () {
      const out = {};
      for (const p of who) {
        const code = K.langOf(p.id);
        if (code && code !== K.lang && !out[code]) out[code] = res.cat === "own" ? yield K.trFor(code, EN.youWord) : catName(code, res.cat);
      }
      return out;
    });
  }
  function score(K, s, res) {
    const pr = clamp(s.ptsRight, 0, 100, 1), pe = clamp(s.ptsEsc, 0, 100, 3), pst = clamp(s.ptsSteal, 0, 100, 3);
    const pts = res.pts;
    for (const p of res.ps) pts.set(p.id, 0);
    res.right = /* @__PURE__ */ new Map();
    for (const p of res.det) {
      const pk = res.picks.get(p.id) || [];
      const n = res.k === 0 ? pk[0] === "none" ? 1 : 0 : pk.filter((id) => res.isImp.has(id)).length;
      res.right.set(p.id, n);
      pts.set(p.id, n * pr);
    }
    res.status = /* @__PURE__ */ new Map();
    for (const p of res.imps) res.status.set(p.id, res.left ? "left" : res.stole.has(p.id) ? "stole" : res.caught.get(p.id) ? "caught" : "escaped");
    const impWon = !res.left && res.imps.some((p) => ["stole", "escaped"].includes(res.status.get(p.id)));
    for (const p of res.imps) {
      const st = res.status.get(p.id);
      let v = st === "escaped" ? pe : st === "stole" ? pst : 0;
      if (!v && res.mode === "double" && impWon) v = res.imps.some((x) => res.status.get(x.id) === "escaped") ? pe : pst;
      pts.set(p.id, v);
    }
    for (const p of res.ps) {
      const v = pts.get(p.id) || 0;
      p.score += v;
      if ((res.right.get(p.id) || 0) > 0) p.right = (p.right || 0) + 1;
    }
    if (res.left) res.winners = [];
    else if (res.k === 0) res.winners = res.det.filter((p) => res.right.get(p.id) > 0).map((p) => p.id);
    else if (impWon) res.winners = res.imps.filter((p) => res.mode === "double" || ["stole", "escaped"].includes(res.status.get(p.id))).map((p) => p.id);
    else res.winners = res.det.filter((p) => res.right.get(p.id) > 0).map((p) => p.id);
    res.impWon = impWon;
  }
  function rowsOf(res) {
    const W1 = new Set(res.winners);
    const list = res.ps.map((p) => ({ p, win: W1.has(p.id), imp: res.isImp.has(p.id), right: res.right.get(p.id) || 0, pts: res.pts.get(p.id) || 0, st: res.status.get(p.id) || "" }));
    const rank = (x) => x.win ? 0 : x.imp ? 3 : x.right ? 1 : 2;
    return list.sort((a, b) => rank(a) - rank(b) || b.pts - a.pts || a.p.name.localeCompare(b.p.name));
  }
  function winnersScreen(K, s, tx, res, when) {
    return __async(this, null, function* () {
      const scr = screen(K, TPL.win[res.look.win], "win");
      fillWinners(K, scr, tx, res, rowsOf(res), when);
      K.snd.fx(res.impWon ? "drumroll" : "sparkle", { vol: 0.8 });
      if (when === "end" || when === "final1") return;
    });
  }
  function fillWinners(K, scr, tx, res, list, when, final) {
    const L = K.lang;
    const winners = list.filter((x) => x.win);
    const pf = (n) => n === 1 ? tx("pt1", { n: K.num(n) }) : tx("pts", { n: K.num(n) });
    setT(scr, "tw", up(tx("theWinners"), L));
    const nm = $(scr, "names")[0];
    if (nm) {
      nm.textContent = winners.length ? winners.map((x) => x.p.name).join(" · ") : tx("nobody");
      shrink(nm, 0.45);
    }
    const imps = res.imps || [];
    const caughtAll = !final && imps.length > 0 && imps.every((p) => ["caught", "stole", "left"].includes(res.status.get(p.id)) && res.status.get(p.id) !== "stole");
    const red = final || res.k === 0 || caughtAll;
    ifs(scr, { caught: red, escaped: !red });
    const iNames = imps.map((p) => p.name).join(" & ");
    for (const b of [...$(scr, "bc"), ...$(scr, "be")]) {
      const st = [...b.querySelectorAll("span")].map((x) => x.getAttribute("style") || "");
      if (final) b.textContent = tx("finalK", { n: K.num(res.total) });
      else if (res.k === 0) b.textContent = tx("noImpBadge");
      else rich(b, tx(red ? "impCaught" : "impEscaped", { name: "{name}" }), { name: iNames }, st);
    }
    const wavT = scr.querySelector('[data-row="wav"]');
    const wavBox = wavT && wavT.parentNode;
    rows(scr, "wav", winners, (row, x) => {
      setT(row, "n", x.p.name);
      for (const a of $(row, "av")) face(K, a, x.p);
    });
    if (wavBox && winners.length > 6 && getComputedStyle(wavBox).display === "flex") {
      wavBox.style.flexWrap = "wrap";
      wavBox.style.justifyContent = "center";
      wavBox.style.rowGap = "18px";
      wavBox.style.maxWidth = "1500px";
    }
    const rightN = res.det ? res.det.filter((p) => (res.right.get(p.id) || 0) > 0).length : 0;
    setT(scr, "s1", K.num(winners.length));
    setT(scr, "s1l", up(tx("winners"), L));
    setT(scr, "s2", final ? K.num(res.total) : K.num(rightN) + "/" + K.num(res.det ? res.det.length : 0));
    setT(scr, "s2l", up(final ? tx("gamesL") : tx("votedRight"), L));
    setT(scr, "s3", K.num(list.length));
    setT(scr, "s3l", up(tx("players"), L));
    setT(scr, "sbt", tx("scoreboard"));
    setT(scr, "sbs", up(final ? tx("totalPts") : tx("whoVoted"), L));
    const proto = (k) => {
      const r = scr.querySelector('[data-row="' + k + '"] [data-k="b"]');
      return r ? r.cloneNode(true) : null;
    };
    const bRight = proto("rw"), bFooled = proto("rf");
    const groups = { rw: [], rf: [], ri: [] };
    const has = { rw: !!scr.querySelector('[data-row="rw"]'), ri: !!scr.querySelector('[data-row="ri"]'), wav: !!wavBox, mid: !!$(scr, "imp")[0] };
    for (const x of list) groups[rowKind(x, has, final)] && groups[rowKind(x, has, final)].push(x);
    const nW = winners.length;
    const made = [];
    for (const kd of ["rw", "rf", "ri"]) {
      rows(scr, kd, groups[kd], (row, x) => {
        made.push([row, x]);
        const gt = (row.style.gridTemplateColumns || "").trim();
        if (/\b\d+px$/.test(gt)) row.style.gridTemplateColumns = gt.replace(/(\d+px)$/, "minmax($1,max-content)");
        setT(row, "pl", x.win ? "♛" : K.num(nW + 1));
        setT(row, "n", x.p.name);
        for (const a of $(row, "av")) face(K, a, x.p);
        const pe = $(row, "p")[0];
        const val = final ? x.p.score : x.pts;
        if (pe) pe.textContent = /pt/.test(pe.textContent) ? pf(val) : K.num(val);
        const b = $(row, "b")[0];
        if (final) {
          if (b) {
            if (x.wins) b.textContent = "🏆 " + up(x.wins === 1 ? tx("win1") : tx("wins", { n: K.num(x.wins) }), L);
            else b.style.visibility = "hidden";
          }
        } else if (x.imp) {
          const st = x.st;
          ifs(row, { caught: st === "caught" || st === "left", escaped: st === "escaped" || st === "stole" });
          for (const e of row.querySelectorAll("bv-if")) {
            const t = [...e.querySelectorAll("span")].pop();
            if (!t) continue;
            const svg = t.querySelector("svg");
            t.textContent = up(st === "stole" ? tx("impStoleB") : st === "escaped" ? tx("impEscB") : tx("impCaughtB"), L);
            if (svg) t.prepend(svg);
          }
        } else if (b) {
          const want = x.right > 0 ? bRight : bFooled;
          const c = want ? want.cloneNode(true) : b;
          if (c !== b) b.replaceWith(c);
          c.textContent = x.right > 0 ? "✓ " + up(tx("rightB"), L) : "✗ " + up(tx("fooledB"), L);
        }
      });
    }
    for (const [row, x] of made) if (x.imp && x.win && row.parentNode) {
      const first = row.parentNode.querySelector(":scope > [data-x], :scope > div");
      row.parentNode.insertBefore(row, firstRowOf(row.parentNode, made));
    }
    setT(scr, "wc", K.num(groups.rw.length));
    setT(scr, "fc", K.num(groups.rf.length));
    const detWon = !final && (res.k === 0 || !res.impWon);
    const wh = $(scr, "wh")[0];
    if (wh) wh.textContent = " " + (final ? tx("winners") : detWon ? tx("winnersRight") : tx("votedRight")) + " ";
    const fh = $(scr, "fh")[0];
    if (fh) {
      fh.textContent = " " + (final ? tx("players") : tx("fooled")) + " ";
      if (final && fh.previousElementSibling && /✗/.test(fh.previousElementSibling.textContent)) fh.previousElementSibling.style.display = "none";
    }
    const impBox = $(scr, "imp")[0];
    if (impBox) {
      const ip = imps[0];
      if (final && winners.length) {
        const top = winners[0].p;
        setT(impBox, "in", winners.map((x) => x.p.name).join(" & "));
        for (const a of $(impBox, "av")) face(K, a, top);
        const glow = impBox.firstElementChild;
        if (glow && /radial-gradient/.test(glow.getAttribute("style") || "")) glow.style.background = "radial-gradient(circle,rgba(255,201,60,.38),transparent 70%)";
        ifs(impBox, { caught: false, escaped: true });
        for (const e of impBox.querySelectorAll("bv-if")) {
          const t = [...e.querySelectorAll("span")].pop() || e.firstElementChild;
          if (t) t.textContent = "♛ " + up(tx("champ"), L) + " ♛";
        }
        const nmE = $(impBox, "in")[0];
        if (nmE) shrink(nmE, 0.5);
      } else if (!ip || final) impBox.style.visibility = "hidden";
      else {
        setT(impBox, "in", imps.map((p) => p.name).join(" & "));
        for (const a of $(impBox, "av")) face(K, a, ip);
        const st = res.status.get(ip.id);
        ifs(impBox, { caught: st === "caught" || st === "left", escaped: st === "escaped" || st === "stole" });
        for (const e of impBox.querySelectorAll("bv-if")) {
          const t = [...e.querySelectorAll("span")].pop() || e.firstElementChild;
          if (!t) continue;
          const svg = t.querySelector("svg");
          t.textContent = up(st === "stole" ? tx("impStoleB") : st === "escaped" ? tx("impEscB") : tx("impCaughtB"), L);
          if (svg) t.prepend(svg);
        }
      }
    }
    const each = $(scr, "each")[0];
    if (each) {
      const pv = winners.length ? final ? winners[0].p.score : winners[0].pts : 0;
      const same = winners.every((x) => (final ? x.p.score : x.pts) === pv);
      const t = winners.length > 1 && same ? pv === 1 ? tx("each1") : tx("eachN", { n: K.num(pv) }) : winners.length === 1 ? pv === 1 ? tx("pt1L") : tx("ptsN", { n: K.num(pv) }) : "";
      each.textContent = t ? "♛ " + up(t, L) + " ♛" : "♛";
    }
    const cardRow = scr.querySelector('[data-row="rf"], [data-row="ri"]') ? null : null;
    for (const g2 of scr.querySelectorAll('div[style*="grid-template-columns:repeat(4,280px)"]')) {
      const n2 = g2.children.length;
      if (n2 > 4) {
        const c = Math.min(7, Math.ceil(n2 / 2));
        const w2 = Math.min(280, Math.floor((1700 - (c - 1) * 20) / c));
        g2.style.gridTemplateColumns = "repeat(" + c + "," + w2 + "px)";
      }
    }
    const grid = $(scr, "grid")[0];
    if (grid && /grid-auto-flow:column/.test(grid.getAttribute("style") || "")) grid.style.gridTemplateRows = "repeat(" + Math.max(1, Math.ceil(list.length / 2)) + ", auto)";
    for (const f of $(scr, "foot")) f.textContent = when === "next" ? K.settings.next === "auto" ? tx("nextIn", { n: K.num(clamp(K.settings.nextSec, 3, 300, 20)) }) : tx("hostNext") : tx("hostAgain");
    for (const part of [$(scr, "sb")[0], $(scr, "wl")[0], $(scr, "fl")[0], grid, wavBox && wavBox.parentNode].filter(Boolean)) fitIn(part);
    const main = scr.lastElementChild;
    if (main && main.lastElementChild && getComputedStyle(main).flexDirection === "column") {
      const sr = scr.getBoundingClientRect(), k = sr.height / 1080 || 1;
      const bottom = (main.lastElementChild.getBoundingClientRect().bottom - sr.top) / k;
      if (bottom < 860) main.style.justifyContent = "center";
    }
    for (const w of scr.querySelectorAll('[data-k="n"]')) shrinkLine(w);
  }
  function rowKind(x, has, final) {
    if (final) return x.win ? has.rw ? "rw" : has.wav ? "" : "rf" : "rf";
    if (x.imp) return has.ri ? "ri" : has.mid ? "" : "rf";
    if (has.mid) return x.right > 0 ? "rw" : "rf";
    if (x.win) return has.rw ? "rw" : has.wav ? "" : "rf";
    return "rf";
  }
  const firstRowOf = (par, made) => {
    for (const c of par.children) if (made.some((m) => m[0] === c)) return c;
    return par.firstChild;
  };
  function fitIn(part) {
    const scr = part.closest(".imp-cv > *");
    if (!scr) return;
    const sr = scr.getBoundingClientRect(), k = sr.height / 1080 || 1;
    const pr = part.getBoundingClientRect();
    const top = (pr.top - sr.top) / k;
    const h = Math.max(part.scrollHeight, pr.height / k);
    const foot = [...scr.querySelectorAll('[data-k="foot"]')].find((f2) => f2.getBoundingClientRect().top >= pr.top - 2);
    const footH = foot ? foot.getBoundingClientRect().height / k + 18 : 0;
    const room = 1080 - 40 - footH - top;
    if (h <= room + 2 || room < 120) return;
    const f = Math.max(0.38, room / h);
    part.style.flex = "none";
    part.style.height = h + "px";
    part.style.transformOrigin = "top center";
    part.style.transform = "scale(" + f.toFixed(3) + ")";
    part.style.marginBottom = (-(h * (1 - f))).toFixed(1) + "px";
  }
  const shrinkLine = (elx) => {
    if (elx.scrollWidth > elx.clientWidth + 1) {
      elx.style.overflow = "hidden";
      elx.style.textOverflow = "ellipsis";
      elx.style.whiteSpace = "nowrap";
    }
  };
  function finalScreen(K, s, tx, res, wins, total) {
    const scr = screen(K, TPL.win[res.look.win], "final");
    const list = res.ps.slice().concat(K.players().filter((p) => !res.ps.some((x) => x.id === p.id))).filter((p, i, a) => a.indexOf(p) === i);
    const top = Math.max(0, ...list.map((p) => p.score));
    const items = list.map((p) => ({ p, win: p.score === top && top > 0, imp: false, right: 0, pts: p.score, wins: wins.get(p.id) || 0, st: "" })).sort((a, b) => b.pts - a.pts || b.wins - a.wins || a.p.name.localeCompare(b.p.name));
    fillWinners(K, scr, tx, Object.assign({}, res, { total }), items, "end", true);
    K.snd.fx("sparkle");
  }
  function sendResult(K, res, isEnd) {
    const list = rowsOf(res).map((x) => ({ id: x.p.id, n: x.p.name, av: x.p.av, ph: !!x.p.photo, w: x.win ? 1 : 0, i: x.imp ? 1 : 0, r: x.right, p: x.pts, s: x.st, t: x.p.score }));
    const base = {
      k: "imp",
      t: "res",
      d: res.look.pWin,
      g: res.g,
      of: res.total,
      word: res.word,
      none: res.k === 0,
      imps: res.imps.map((p) => p.name),
      left: !!res.left,
      caught: res.k !== 0 && res.imps.length > 0 && res.imps.every((p) => ["caught", "stole"].includes(res.status.get(p.id))),
      list,
      end: !!isEnd
    };
    K.say(base);
  }
  function sendFinal(K, res, wins, total) {
    const ps = K.players().slice().sort((a, b) => b.score - a.score);
    const top = ps.length ? ps[0].score : 0;
    K.say({ k: "imp", t: "final", d: res.look.pWin, of: total, list: ps.map((p) => ({ id: p.id, n: p.name, av: p.av, ph: !!p.photo, w: p.score === top && top > 0 ? 1 : 0, p: p.score, g: wins.get(p.id) || 0 })) });
  }
  function between(K, s, tx, g) {
    return __async(this, null, function* () {
      if (s.next === "auto") {
        const sec = clamp(s.nextSec, 3, 300, 20);
        const t0 = Date.now();
        let go = false;
        const nb = hostButton(K, tx("nextGame"), () => {
          go = true;
        });
        while (!go && !K.over() && Date.now() - t0 < sec * 1e3) {
          const l = Math.ceil(sec - (Date.now() - t0) / 1e3);
          for (const f of K.stage.querySelectorAll('[data-k="foot"]')) f.textContent = tx("nextIn", { n: K.num(l) });
          yield K.sleep(250);
        }
        nb();
      } else {
        let go = false;
        const nb = hostButton(K, tx("nextGame"), () => {
          go = true;
        });
        while (!go && !K.over()) yield K.sleep(250);
        nb();
      }
    });
  }
})();
