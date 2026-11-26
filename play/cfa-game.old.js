// Made from cfa-game.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change cfa-game.js and run node tools/old-js.js again.
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
  const ME = document.currentScript && document.currentScript.src || "";
  const HERE = ME.replace(/[^/?#]*([?#].*)?$/, "");
  const VER = (ME.match(/[?&]v=(\d+)/) || [0, "1"])[1];
  const OLD = !window.BV_ASYNC;
  const ORANGE = "#ff8a1f", GOLD = "#ffd23f", GREEN = "#3ddc84", RED = "#e53935";
  const TEAM_IX = { blue: 0, red: 1, gold: 2, green: 3 };
  const TEAM_COL = ["#4aa3ff", "#e53935", "#ffd23f", "#3ddc84"];
  const MODES = [
    ["last", "Last Standing", "Push everyone off. The last car on the arena wins.", "Fall off and you are out. The arena gets smaller as the match goes on.", "🏁"],
    ["score", "Knockout Battle", "Cars come back after a knockout. Most knockouts when the time is up wins.", "Knock a car off the arena to score. Fall off and you are back in a moment.", "💥"],
    ["hill", "King of the Hill", "Hold the glowing zone alone to score. First to 60 wins.", "Only a car alone in the zone scores. Push the others out.", "⛰️"],
    ["team", "Team Battle", "Each team in its own color. Knock out every car of the other teams.", "Pick your team on your phone. The last team on the arena wins.", "🤝"],
    ["survival", "Survival", "Computer cars come in waves. Stay on the arena as long as you can.", "Every player plays together against the waves.", "🛡️"],
    ["bomb", "Bomb Tag", "One car has a bomb with a short fuse. Bump someone to pass it on before it goes off.", "The car holding the bomb when it goes off is out. The last car left wins.", "💣"],
    ["crown", "Crown Chase", "Grab the crown and keep it to score. Bump the holder to steal it. First to 60 wins.", "The crown holder scores every second. Everyone else hunts them.", "👑"]
  ];
  const ARENAS = [["lava", "Lava", "🌋"], ["industrial", "Industrial", "🏭"], ["ice", "Ice", "🧊"], ["island", "Sky Island", "🏝️"]];
  const VIEWS = [
    ["auto", "Automatic", "One player: behind your car. More players: the whole arena."],
    ["arena", "Arena", "The whole fight, from the side of the arena."],
    ["top", "From above", "The whole arena, seen from the sky."],
    ["action", "Action", "A camera that flies around the fight."],
    ["chase", "Chase", "Behind the car in the lead."],
    ["split", "Split screen", "Each player gets a part of the TV (2 to 4 players)."]
  ];
  const WORDS = {
    pick: "Pick your car",
    ready: "Ready",
    how: "How to drive",
    steer: "Drive and steer",
    boost: "Boost",
    jump: "Jump",
    fire: "Fire",
    swap: "Change weapon",
    waitAll: "Pick a car on your phone, then tap Ready.",
    allReady: "Everyone is ready!",
    hostGo: "The host starts the match.",
    startIn: "Starting in {n}",
    loading: "Getting the arena ready...",
    cars: "Getting the cars ready...",
    nextRound: "Next round",
    nextIn: "Next round in {n}",
    hostNext: "The host starts the next round.",
    hostAgain: "The host can play again, or pick another game.",
    noLoad: "The game didn't load. Check the internet, then start it again.",
    speed: "SPEED",
    accel: "ACCEL",
    weight: "WEIGHT",
    handling: "HANDLING"
  };
  const h = (tag, cls, parent, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  const hashId = (s) => {
    let x = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) {
      x ^= s.charCodeAt(i);
      x = Math.imul(x, 16777619);
    }
    return x >>> 0;
  };
  const escX = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function stickArt(words) {
    const t = escX(String(words || "").toUpperCase()), fs = Math.max(9, Math.min(15, 190 / Math.max(1, t.length * 0.74)));
    const ar = "M100 8l11 13H89zM100 192l11-13H89zM8 100l13-11v22zM192 100l-13-11v22z";
    const tx = (cls, dy) => '<text class="' + cls + '" font-size="' + fs.toFixed(1) + '"' + (dy ? ' dy="' + dy + '"' : "") + '><textPath href="#cfaArc" xlink:href="#cfaArc" startOffset="50%" text-anchor="middle">' + t + "</textPath></text>";
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="cfaArc" d="M28 100a72 72 0 0 0 144 0"/></defs><path class="sd" transform="translate(0 -1.2)" d="' + ar + '"/><path class="hl" transform="translate(0 1.8)" d="' + ar + '"/><path class="cv" d="' + ar + '"/>' + tx("sd", -1.2) + tx("hl", 1.8) + tx("cv") + "</svg>";
  }
  const clampI = (v, a, b, d) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d;
  };
  const LIBS = [["cfa/three.min.js", "cfa/three.min.old.js"], ["cfa/GLTFLoader.js"], ["cfa/BufferGeometryUtils.js"], ["cfa/weapons-v2.js"], ["cfa-engine.js"]];
  let libsP = null;
  const script = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = res;
    s.onerror = () => rej(new Error("load " + src));
    document.head.appendChild(s);
  });
  function loadLibs() {
    if (window.CFAEngine && window.THREE && THREE.GLTFLoader && THREE.BufferGeometryUtils && window.CCWeapons) return Promise.resolve(true);
    if (!libsP) {
      libsP = (() => __async(this, null, function* () {
        if (!window.THREE) yield script(HERE + (OLD ? LIBS[0][1] : LIBS[0][0]) + "?v=" + VER);
        if (!THREE.GLTFLoader) yield script(HERE + LIBS[1][0] + "?v=" + VER);
        if (!THREE.BufferGeometryUtils) yield script(HERE + LIBS[2][0] + "?v=" + VER);
        if (!window.CCWeapons) yield script(HERE + LIBS[3][0] + "?v=" + VER);
        if (!window.CFAEngine) yield script(HERE + LIBS[4][0] + "?v=" + VER);
        return true;
      }))();
      libsP.catch(() => {
        libsP = null;
      });
    }
    return libsP;
  }
  const fontsP = () => document.fonts && document.fonts.load ? Promise.all(['400 16px "Chakra Petch"', '600 16px "Chakra Petch"', '700 44px "Chakra Petch"'].map((f) => document.fonts.load(f))).catch(() => {
  }) : Promise.resolve();
  const LAT = "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD";
  const LATX = "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF";
  const face = (w, f, r) => `@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:${w};font-display:swap;src:url(${HERE}fonts/${f}) format('woff2');unicode-range:${r}}`;
  const CSS = [
    face(400, "cfa-chakra-latin-400.woff2", LAT),
    face(600, "cfa-chakra-latin-600.woff2", LAT),
    face(700, "cfa-chakra-latin-700.woff2", LAT),
    face(700, "cfa-chakra-latin-ext-700.woff2", LATX),
    // the lobby, in the game's colors: the night over the arena, the lava's glow, the panels of its menus
    'body[data-game="cfa"]{background:radial-gradient(110vw 55vh at 50% 118%,rgba(255,90,26,.42),transparent 70%),radial-gradient(70vw 50vh at 0% -10%,rgba(74,163,255,.16),transparent 70%),linear-gradient(180deg,#0b111e 0%,#10172a 55%,#1c0d08 100%)}',
    'body[data-game="cfa"] .lob-top h1,body[data-game="cfa"] .ph h2,body[data-game="cfa"] .stp b,body[data-game="cfa"] .spot-t b{font-family:"Chakra Petch",var(--fun);letter-spacing:.02em}',
    'body[data-game="cfa"] .lob-top h1{text-transform:uppercase;font-weight:700;letter-spacing:.05em;text-shadow:0 .3vh .8vh rgba(0,0,0,.6)}',
    'body[data-game="cfa"] .lob-top h1 .cfa-hot{color:' + ORANGE + "}",
    'body[data-game="cfa"] .lob-top .sub{color:#c9d2e6}',
    'body[data-game="cfa"] .lob .card,body[data-game="cfa"] .spot{background:rgba(19,27,46,.88);border-color:#26324f}',
    'body[data-game="cfa"] .stp .n{background:' + ORANGE + ";box-shadow:0 0 0 calc(.5*var(--u)) rgba(255,138,31,.25)}",
    'body[data-game="cfa"] .stp-c p,body[data-game="cfa"] .lob-x .lbl{color:#c9d2e6}',
    'body[data-game="cfa"] .seat{background:rgba(19,27,46,.9);border-color:#26324f}',
    'body[data-game="cfa"] .seat.empty{background:transparent;border-color:rgba(201,210,230,.18)}',
    'body[data-game="cfa"] .seat.empty span{color:rgba(201,210,230,.5)}',
    'body[data-game="cfa"] .ph .pill{background:rgba(255,138,31,.16)}',
    'body[data-game="cfa"] .codetiles span{background:rgba(19,27,46,.9);border-color:#33415f;font-family:"Chakra Petch",var(--fun)}',
    'body[data-game="cfa"] .spot-ic{background:rgba(255,138,31,.18)}',
    // (the lobby's top wears three of the game's cars instead of the letters)
    ".cfa-deco{display:flex;align-items:flex-end}",
    ".cfa-deco img{display:block;height:calc(12*var(--u));width:auto;margin:0 calc(-3.4*var(--u));filter:drop-shadow(0 calc(.8*var(--u)) calc(.8*var(--u)) rgba(0,0,0,.55))}",
    // ---------- the game, full screen ----------
    "body.cfa-on{background:#000}",
    '.cfa{position:fixed;left:0;top:0;right:0;bottom:0;z-index:9;overflow:hidden;background:#000;color:#fff;font-family:"Chakra Petch",ui-rounded,system-ui,sans-serif;direction:ltr;-webkit-user-select:none;user-select:none}',
    ".cfa *{box-sizing:border-box}",
    ".cfa [hidden]{display:none!important}",
    ".cfa-m{position:absolute;left:0;top:0;right:0;bottom:0}",
    ".cfa-m canvas{display:block}",
    ".cfa-vig{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 58%,rgba(0,0,0,.42) 100%)}",
    ".cfa-spd{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;opacity:0;background:repeating-conic-gradient(from 0deg at 50% 46%,rgba(255,255,255,0) 0deg 4deg,rgba(255,255,255,.2) 4.4deg 4.8deg,rgba(255,255,255,0) 5.2deg 9deg);-webkit-mask-image:radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 40%,#000 90%);mask-image:radial-gradient(ellipse at 50% 46%,rgba(0,0,0,0) 40%,#000 90%)}",
    ".cfa-hit{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;opacity:0;box-shadow:inset 0 0 calc(19*var(--u)) calc(4*var(--u)) rgba(229,57,53,.75)}",
    ".cfa-pop{position:absolute;left:0;right:0;top:22%;height:0;pointer-events:none}",
    ".cfa-pnl{background:rgba(19,27,46,.85);border-radius:calc(2*var(--u))}",
    ".cfa-lb{font-size:calc(1.9*var(--u));letter-spacing:.18em;color:#c9d2e6}",
    // the corners during a match (the game's own boxes)
    ".cfa-hud{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none}",
    ".cfa-box{position:absolute;top:calc(2.4*var(--u));left:calc(2.6*var(--u));padding:calc(1.4*var(--u)) calc(2.4*var(--u));max-width:40%}",
    ".cfa-box .v{font-size:calc(4.5*var(--u));font-weight:700;line-height:1}",
    ".cfa-box .v small{font-size:calc(2.6*var(--u));color:#c9d2e6}",
    ".cfa-box .cfa-sc{margin-top:calc(1*var(--u));font-size:calc(1.9*var(--u));letter-spacing:.18em;color:#c9d2e6}",
    ".cfa-box .cfa-sc b{color:" + GOLD + ";font-size:calc(2.6*var(--u))}",
    ".cfa-mid{position:absolute;top:calc(2.4*var(--u));left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center}",
    ".cfa-mid > * + *{margin-top:calc(1*var(--u))}",
    ".cfa-clock{padding:calc(1*var(--u)) calc(3*var(--u));font-size:calc(4.2*var(--u));font-weight:700;letter-spacing:.08em;display:flex;align-items:baseline;white-space:nowrap}",
    ".cfa-clock i{font-style:normal;font-size:calc(2.1*var(--u));color:" + GOLD + ";margin-right:calc(1.7*var(--u))}",
    ".cfa-clock i:empty{display:none}",
    ".cfa-ser{padding:calc(.5*var(--u)) calc(2*var(--u));font-size:calc(1.9*var(--u));font-weight:700;letter-spacing:.14em;color:" + GOLD + ";white-space:nowrap}",
    ".cfa-shr{background:" + RED + ";border-radius:calc(1.4*var(--u));padding:calc(.5*var(--u)) calc(2.1*var(--u));font-size:calc(2.1*var(--u));font-weight:700;letter-spacing:.14em}",
    ".cfa-toast{background:rgba(0,0,0,.75);border:1px solid " + RED + ";border-radius:calc(1.4*var(--u));padding:calc(.9*var(--u)) calc(2.4*var(--u));font-size:calc(2.6*var(--u));font-weight:700;letter-spacing:.14em;white-space:nowrap}",
    ".cfa-list{position:absolute;top:calc(2.4*var(--u));right:calc(2.6*var(--u));padding:calc(1.4*var(--u)) calc(2.1*var(--u));min-width:calc(26*var(--u))}",
    ".cfa-list .r{display:flex;align-items:center;font-size:calc(2.25*var(--u));font-weight:600;letter-spacing:.06em;line-height:1.5;white-space:nowrap}",
    ".cfa-list .d{flex:none;width:calc(1.7*var(--u));height:calc(1.7*var(--u));border-radius:50%;margin-right:calc(1.4*var(--u))}",
    ".cfa-list .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}",
    ".cfa-list .s{flex:none;font-size:calc(1.9*var(--u));margin-left:calc(1.4*var(--u))}",
    ".cfa-list .p{flex:none;width:calc(2.6*var(--u));height:calc(2.6*var(--u));border-radius:50%;object-fit:cover;margin-right:calc(1*var(--u));background:#26324f}",
    ".cfa-list .r.me .n{color:#fff;font-weight:700}",
    '.cfa-list .r.ld .n::after{content:" \\2605";color:' + GOLD + "}",
    ".cfa-count{position:absolute;top:38%;left:50%;transform:translate(-50%,-50%);font-size:calc(26*var(--u));font-weight:700;color:#fff;text-shadow:0 calc(1*var(--u)) 0 " + RED + ";pointer-events:none;line-height:1}",
    ".cfa-spec{position:absolute;left:50%;bottom:calc(4*var(--u));transform:translateX(-50%);background:rgba(19,27,46,.92);border:1px solid " + RED + ";border-radius:calc(2*var(--u));padding:calc(1.7*var(--u)) calc(3.4*var(--u));font-weight:700;letter-spacing:.14em;font-size:calc(2.6*var(--u));white-space:nowrap}",
    ".cfa-busy{position:absolute;left:50%;bottom:calc(6*var(--u));transform:translateX(-50%);padding:calc(1.4*var(--u)) calc(3*var(--u));font-size:calc(2.4*var(--u));font-weight:700;letter-spacing:.1em;color:#c9d2e6;white-space:nowrap}",
    // the winner (the game's own big words over the winner's drift) and the replay of the final knockout
    ".cfa-vic{position:absolute;top:8%;left:0;right:0;text-align:center;pointer-events:none;text-shadow:0 calc(.5*var(--u)) calc(1.7*var(--u)) #000,0 0 calc(3.4*var(--u)) rgba(0,0,0,.8)}",
    ".cfa-vic .hd{font-size:calc(2.4*var(--u));letter-spacing:.3em;color:" + ORANGE + ";font-weight:700}",
    ".cfa-vic .tt{font-size:calc(17*var(--u));font-weight:700;line-height:1}",
    ".cfa-vic .nm{font-size:calc(5.6*var(--u));font-weight:700;letter-spacing:.08em}",
    ".cfa-rep{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none}",
    ".cfa-rep .bar{position:absolute;left:0;right:0;height:11%;background:#000}",
    ".cfa-rep .tg{position:absolute;left:calc(4*var(--u));top:calc(11% + 2.4*var(--u));display:flex;align-items:center;font-weight:700;letter-spacing:.2em;font-size:calc(2.8*var(--u));text-shadow:0 calc(.3*var(--u)) calc(1*var(--u)) #000}",
    ".cfa-rep .tg span{width:calc(2*var(--u));height:calc(2*var(--u));border-radius:50%;background:" + RED + ";margin-right:calc(1.7*var(--u));animation:cfaBlink 1s steps(2) infinite}",
    "@keyframes cfaBlink{50%{opacity:.2}}",
    // the results card (the game's own: the mode, the winner, the car, the championship, every car's place)
    ".cfa-over{position:absolute;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding:calc(3*var(--u));background:rgba(0,0,0,.45)}",
    ".cfa-card{background:rgba(19,27,46,.94);border:1px solid #26324f;border-radius:calc(3.8*var(--u));padding:calc(3.4*var(--u)) calc(4.4*var(--u));width:calc(76*var(--u));max-width:100%;max-height:100%;display:flex;flex-direction:column;overflow:hidden}",
    ".cfa-card > * + *{margin-top:calc(2*var(--u))}",
    ".cfa-card .hd{text-align:center;font-size:calc(2.4*var(--u));letter-spacing:.24em;color:" + ORANGE + ";font-weight:700}",
    ".cfa-card .tt{text-align:center;font-size:calc(8*var(--u));font-weight:700;line-height:1.05;margin-top:calc(.4*var(--u))}",
    ".cfa-card .nm{text-align:center;font-size:calc(4.1*var(--u));font-weight:700;letter-spacing:.06em;margin-top:0}",
    ".cfa-card .cr{text-align:center;font-size:calc(2.2*var(--u));letter-spacing:.16em;color:#c9d2e6;margin-top:0}",
    ".cfa-card .se{text-align:center;font-size:calc(2.2*var(--u));letter-spacing:.16em;color:" + GOLD + ";font-weight:700;margin-top:calc(1*var(--u))}",
    ".cfa-card .bd{display:flex;flex-direction:column;min-height:0;overflow:hidden}",
    ".cfa-card .bd > * + *{margin-top:calc(.7*var(--u))}",
    ".cfa-card .rw{display:flex;align-items:center;font-size:calc(2.6*var(--u));font-weight:600;padding:calc(.8*var(--u)) calc(1.7*var(--u));background:#1b2540;border-radius:calc(1.4*var(--u));white-space:nowrap}",
    ".cfa-card .rw.w{box-shadow:inset 0 0 0 calc(.25*var(--u)) " + GOLD + "}",
    ".cfa-card .rw .ps{width:calc(3.4*var(--u));color:#c9d2e6;flex:none}",
    ".cfa-card .rw .d{width:calc(1.7*var(--u));height:calc(1.7*var(--u));border-radius:50%;flex:none;margin-right:calc(1.4*var(--u))}",
    ".cfa-card .rw img{width:calc(3.6*var(--u));height:calc(3.6*var(--u));border-radius:50%;object-fit:cover;flex:none;margin-right:calc(1.2*var(--u));background:#26324f}",
    ".cfa-card .rw .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}",
    ".cfa-card .rw .c{font-size:calc(1.9*var(--u));letter-spacing:.08em;color:#c9d2e6;flex:none;margin-left:calc(1.4*var(--u))}",
    ".cfa-card .rw .pt{min-width:calc(9*var(--u));text-align:right;font-size:calc(2.1*var(--u));font-weight:700;color:" + GOLD + ";flex:none}",
    ".cfa-card .ft{text-align:center;font-size:calc(2.4*var(--u));font-weight:700;letter-spacing:.06em;color:#c9d2e6}",
    ".cfa-card .ft b{display:block;font-size:calc(3.2*var(--u));letter-spacing:.14em;color:#0b1a10;background:" + GREEN + ";border-radius:calc(2*var(--u));padding:calc(1.4*var(--u));margin-bottom:calc(1*var(--u))}",
    // the garage: everyone picks a car on their phone, and their cars stand on the arena
    ".cfa-g{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none;display:flex;flex-direction:column;justify-content:space-between;padding:calc(3.4*var(--u)) calc(3.4*var(--u)) calc(3*var(--u))}",
    ".cfa-gt{display:flex;align-items:flex-start;justify-content:space-between}",
    ".cfa-gh{text-shadow:0 calc(.3*var(--u)) calc(1*var(--u)) #000,0 0 calc(2.4*var(--u)) rgba(0,0,0,.8)}",
    ".cfa-gh h1{margin:0;font-size:calc(7.6*var(--u));font-weight:700;letter-spacing:.06em;line-height:1;text-transform:uppercase}",
    ".cfa-gh h1 span{color:" + ORANGE + "}",
    ".cfa-gh p{margin:calc(1.2*var(--u)) 0 0;font-size:calc(2.6*var(--u));font-weight:700;letter-spacing:.16em;color:#fff}",
    ".cfa-gh p i{font-style:normal;color:" + GOLD + "}",
    // (how to drive: the phone's controller drawn as a phone held sideways, a real thumbstick on the left with
    // "Drive and steer" carved into its ring, and the four raised buttons on the right with their words carved into
    // their tops. Each button stands in its socket on a wall of its own colour; pressing it slides its top down the
    // wall. Only transforms move, so the drawing costs the TV next to nothing.)
    ".cfa-how{padding:calc(1.4*var(--u)) calc(2*var(--u)) calc(1.8*var(--u));display:flex;flex-direction:column}",
    ".cfa-how .lb2{font-size:calc(1.7*var(--u));letter-spacing:.2em;color:#c9d2e6;font-weight:700;margin-bottom:calc(1.1*var(--u))}",
    ".cfa-phn{position:relative;display:flex;align-items:center;justify-content:space-between;width:calc(46*var(--u));height:calc(19*var(--u));padding:0 calc(2.4*var(--u)) 0 calc(3.4*var(--u));border-radius:calc(3.6*var(--u));background:linear-gradient(160deg,#1a2440 0%,#0c1220 52%,#080c16 100%);box-shadow:inset 0 0 0 calc(.35*var(--u)) #2e3a5c,inset 0 0 0 calc(.85*var(--u)) #070b14,inset 0 calc(.9*var(--u)) calc(1.6*var(--u)) rgba(255,255,255,.05),0 calc(.9*var(--u)) calc(2.2*var(--u)) rgba(0,0,0,.6)}",
    '.cfa-phn::before{content:"";position:absolute;left:calc(1.25*var(--u));top:50%;width:calc(.8*var(--u));height:calc(3.4*var(--u));margin-top:calc(-1.7*var(--u));border-radius:99px;background:#03050a;box-shadow:inset 0 0 0 calc(.12*var(--u)) #222c48}',
    // the stick: a ridged bowl with arrows and words carved in, and a domed rubber knob with a dished top
    ".cfa-jy{position:relative;flex:none;width:calc(14.6*var(--u));height:calc(14.6*var(--u));border-radius:50%;background:radial-gradient(circle closest-side,#04070d 0 49%,#1b2440 50.5% 52.5%,rgba(0,0,0,0) 54%),linear-gradient(180deg,#33406a 0%,#26304f 52%,#1b2339 100%);box-shadow:inset 0 calc(.5*var(--u)) calc(1*var(--u)) rgba(0,0,0,.55),inset 0 calc(-.2*var(--u)) calc(.3*var(--u)) rgba(255,255,255,.08),0 0 0 calc(.35*var(--u)) #11182a,0 calc(.3*var(--u)) 0 calc(.35*var(--u)) #0a0f1b,0 calc(.9*var(--u)) calc(1.6*var(--u)) rgba(0,0,0,.5)}",
    ".cfa-jy svg{position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible}",
    ".cfa-jy .kn{position:absolute;left:50%;top:50%;width:46%;height:46%;margin:-23% 0 0 -23%;border-radius:50%;background:radial-gradient(circle at 50% 28%,#7182ad 0%,#4a5880 36%,#2d3758 70%,#1c2440 100%);box-shadow:inset 0 calc(.2*var(--u)) calc(.12*var(--u)) rgba(255,255,255,.38),inset 0 calc(-.45*var(--u)) calc(.7*var(--u)) rgba(0,0,0,.55),0 calc(.6*var(--u)) 0 #10172a,0 calc(.85*var(--u)) calc(.4*var(--u)) rgba(0,0,0,.55),0 calc(1.5*var(--u)) calc(2*var(--u)) rgba(0,0,0,.55);animation:cfaJoy 3.6s ease-in-out infinite}",
    '.cfa-jy .kn::before{content:"";position:absolute;left:20%;top:18%;width:60%;height:60%;border-radius:50%;background:radial-gradient(ellipse 70% 40% at 50% 22%,rgba(255,255,255,.32),rgba(255,255,255,0) 70%),radial-gradient(circle at 50% 74%,#5a6993,#2c3554 74%);box-shadow:inset 0 calc(.35*var(--u)) calc(.55*var(--u)) rgba(0,0,0,.65),0 calc(.12*var(--u)) 0 rgba(255,255,255,.22)}',
    '.cfa-jy .kn::after{content:"";position:absolute;left:4%;top:4%;width:92%;height:92%;border-radius:50%;background:repeating-conic-gradient(rgba(255,255,255,.09) 0 5deg,rgba(0,0,0,.16) 5deg 10deg);-webkit-mask:radial-gradient(circle,transparent 0 63%,#000 66% 100%);mask:radial-gradient(circle,transparent 0 63%,#000 66% 100%)}',
    "@keyframes cfaJoy{0%,100%{transform:translate(0,0)}22%{transform:translate(0,-2.4vh)}48%{transform:translate(2.4vh,-1.2vh)}74%{transform:translate(-2.4vh,-1.2vh)}}",
    // (carved: a light edge under each groove, a dark one over it, and the groove itself darker than what it is cut in)
    ".cfa-jy .sd{fill:rgba(0,0,0,.55)}",
    ".cfa-jy .hl{fill:rgba(255,255,255,.22)}",
    ".cfa-jy .cv{fill:#0a0f1c}",
    ".cfa-jy text{font-weight:700;letter-spacing:.12em}",
    // the buttons: a socket, the button's wall in a darker shade, and its top
    ".cfa-bt{position:relative;flex:none;width:calc(18.6*var(--u));height:calc(16.6*var(--u))}",
    ".cfa-bt .sk{position:absolute;border-radius:50%;background:radial-gradient(circle at 50% 42%,#020409 0 58%,#0a0f1c 74%,#18213a 100%);box-shadow:inset 0 calc(.45*var(--u)) calc(.8*var(--u)) rgba(0,0,0,.9),0 calc(.12*var(--u)) 0 rgba(255,255,255,.07)}",
    ".cfa-bt .wl,.cfa-bt .cap{position:absolute;left:7%;width:86%;height:86%;border-radius:50%}",
    ".cfa-bt .wl{top:11%;background:linear-gradient(180deg,var(--sd),var(--lo));box-shadow:0 calc(.3*var(--u)) calc(.35*var(--u)) rgba(0,0,0,.55),0 calc(1*var(--u)) calc(1.6*var(--u)) rgba(0,0,0,.5)}",
    ".cfa-bt .cap{top:3%;display:flex;align-items:center;justify-content:center;text-align:center;background:radial-gradient(circle at 36% 26%,var(--hi) 0%,var(--c) 46%,var(--lo) 100%);box-shadow:inset 0 calc(.22*var(--u)) calc(.12*var(--u)) rgba(255,255,255,.7),inset 0 0 0 calc(.1*var(--u)) rgba(255,255,255,.22),inset 0 calc(-.5*var(--u)) calc(.8*var(--u)) rgba(0,0,0,.22),inset 0 calc(-1.2*var(--u)) calc(1.4*var(--u)) calc(-.6*var(--u)) var(--hi);animation:cfaTap 6s ease-in-out infinite}",
    '.cfa-bt .cap::before{content:"";position:absolute;left:15%;top:5%;width:70%;height:46%;border-radius:50% 50% 46% 46%/64% 64% 36% 36%;background:linear-gradient(180deg,rgba(255,255,255,.78) 0%,rgba(255,255,255,.28) 46%,rgba(255,255,255,0) 100%)}',
    '.cfa-bt .cap::after{content:"";position:absolute;left:22%;bottom:5%;width:56%;height:22%;border-radius:50%;background:radial-gradient(ellipse at 50% 100%,rgba(255,255,255,.55),rgba(255,255,255,0) 70%)}',
    ".cfa-bt .cap b{display:block;max-width:86%;font-weight:700;line-height:1.04;letter-spacing:.05em;text-transform:uppercase;color:var(--ink);text-shadow:0 calc(.13*var(--u)) 0 rgba(255,255,255,.45),0 calc(-.1*var(--u)) 0 rgba(0,0,0,.4)}",
    ".cfa-bt .fire{--c:#e53935;--hi:#ff9a90;--lo:#a51f1b;--sd:#7a1411;--ink:#5a0d0b}",
    ".cfa-bt .boost{--c:#ff8a1f;--hi:#ffc98a;--lo:#cc6106;--sd:#984502;--ink:#6a2f00}",
    ".cfa-bt .jump{--c:#4aa3ff;--hi:#b2d8ff;--lo:#2070d2;--sd:#15519c;--ink:#0d3a73}",
    ".cfa-bt .swap{--c:#2fb36a;--hi:#93efbc;--lo:#1d8149;--sd:#135c34;--ink:#0b4425}",
    ".cfa-bt .fire b{font-size:calc(1.75*var(--u))}",
    ".cfa-bt .boost b,.cfa-bt .jump b{font-size:calc(1.3*var(--u))}",
    ".cfa-bt .swap b{font-size:calc(.95*var(--u));letter-spacing:.02em}",
    // (one button after another goes down, the way a thumb plays: Fire, Boost, Jump, Change weapon)
    "@keyframes cfaTap{0%,10%,100%{transform:translateY(0)}3%,7%{transform:translateY(7%)}}",
    ".cfa-bt .boost .cap{animation-delay:1.5s}",
    ".cfa-bt .jump .cap{animation-delay:3s}",
    ".cfa-bt .swap .cap{animation-delay:4.5s}",
    ".cfa-gb{display:flex;flex-direction:column;align-items:center}",
    ".cfa-gs{align-self:center;padding:calc(1.4*var(--u)) calc(3.4*var(--u));font-size:calc(3*var(--u));font-weight:700;letter-spacing:.06em;text-align:center;margin-bottom:calc(1.7*var(--u))}",
    ".cfa-gs.go{background:" + GREEN + ";color:#0b1a10}",
    ".cfa-gc{display:flex;justify-content:center;flex-wrap:wrap}",
    ".cfa-pc{width:calc(31*var(--u));margin:calc(.7*var(--u));padding:calc(1.2*var(--u)) calc(1.4*var(--u)) calc(1.4*var(--u));border-radius:calc(2*var(--u));background:rgba(11,17,30,.9);border:calc(.3*var(--u)) solid #26324f;position:relative}",
    ".cfa-pc.rd{border-color:" + GREEN + "}",
    ".cfa-pc .who{display:flex;align-items:center}",
    ".cfa-pc .who img{width:calc(4.6*var(--u));height:calc(4.6*var(--u));border-radius:50%;object-fit:cover;flex:none;box-shadow:0 0 0 calc(.35*var(--u)) var(--pc,#33415f);background:#26324f}",
    ".cfa-pc .who b{flex:1;min-width:0;margin-left:calc(1.2*var(--u));font-size:calc(2.5*var(--u));font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".cfa-pc .ok{flex:none;width:calc(3.6*var(--u));height:calc(3.6*var(--u));border-radius:50%;background:" + GREEN + ";color:#0b1a10;display:flex;align-items:center;justify-content:center;margin-left:calc(.8*var(--u))}",
    ".cfa-pc .ok svg{width:70%;height:70%}",
    ".cfa-pc .cn{margin-top:calc(.8*var(--u));font-size:calc(1.9*var(--u));font-weight:700;letter-spacing:.1em;color:" + ORANGE + ";white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".cfa-pc .st{display:grid;grid-template-columns:auto 1fr;grid-gap:calc(.5*var(--u)) calc(1*var(--u));gap:calc(.5*var(--u)) calc(1*var(--u));align-items:center;margin-top:calc(.7*var(--u))}",
    ".cfa-pc .st span{font-size:calc(1.4*var(--u));font-weight:700;letter-spacing:.06em;color:#c9d2e6}",
    ".cfa-pc .st i{display:block;height:calc(.7*var(--u));border-radius:calc(.35*var(--u));background:#26324f;overflow:hidden}",
    ".cfa-pc .st i b{display:block;height:100%;border-radius:calc(.35*var(--u));background:" + ORANGE + ";transition:width .4s}",
    ".cfa-pc.later{opacity:.55}",
    // (several players: smaller cards, so ten of them fit in one or two rows)
    ".cfa-gc.many .cfa-pc{width:calc(25*var(--u))}",
    ".cfa-gc.many .cfa-pc .st{display:none}",
    // split screen: each player's part of the TV, framed in their color, with their name and their own bars
    ".cfa-sp{position:absolute;left:0;top:0;right:0;bottom:0;pointer-events:none}",
    ".cfa.split .cfa-list{display:none}",
    // (two players, one above the other: the clock at the top in the middle, the count in the top right corner)
    ".cfa.split.n2 .cfa-mid{top:calc(1.4*var(--u))}",
    ".cfa.split.n2 .cfa-box{left:auto;right:calc(1.4*var(--u));top:calc(1.4*var(--u));text-align:right}",
    // (three players: the clock and the count go to the corner that shows the whole arena)
    ".cfa.split.n3 .cfa-mid{left:75%;top:calc(50% + 1.4*var(--u))}",
    ".cfa.split.n3 .cfa-box{left:auto;right:calc(1.4*var(--u));top:auto;bottom:calc(1.4*var(--u));text-align:right}",
    // (four players: the clock and the count meet in the middle; the names on the right go to the outer corners, and
    // the top two bars leave the middle free)
    ".cfa.split.n4 .cfa-mid{top:50%;transform:translate(-50%,-100%)}",
    ".cfa.split.n4 .cfa-box{left:50%;top:50%;transform:translate(-50%,calc(1*var(--u)));text-align:center;max-width:none}",
    ".cfa.split.n4 .cfa-ser{display:none}",
    ".cfa.split.n3 .cfa-vw.q2 .tag,.cfa.split.n4 .cfa-vw.q2 .tag,.cfa.split.n4 .cfa-vw.q4 .tag{left:auto;right:calc(1.4*var(--u))}",
    ".cfa.split.n4 .cfa-vw.q1 .bars{right:calc(11*var(--u))}",
    ".cfa.split.n4 .cfa-vw.q2 .bars{left:calc(11*var(--u))}",
    ".cfa-vw{position:absolute;overflow:hidden;box-shadow:inset 0 0 0 calc(.4*var(--u)) var(--pc,#33415f)}",
    ".cfa-vw .tag{position:absolute;left:calc(1.4*var(--u));top:calc(1.4*var(--u));display:flex;align-items:center;padding:calc(.5*var(--u)) calc(1.6*var(--u)) calc(.5*var(--u)) calc(.5*var(--u));border-radius:99px;background:rgba(19,27,46,.88);font-size:calc(2.2*var(--u));font-weight:700;letter-spacing:.06em;white-space:nowrap}",
    ".cfa-vw .tag img{width:calc(3.4*var(--u));height:calc(3.4*var(--u));border-radius:50%;object-fit:cover;margin-right:calc(1*var(--u));box-shadow:0 0 0 calc(.3*var(--u)) var(--pc,#33415f)}",
    ".cfa-vw .bars{position:absolute;left:calc(1.4*var(--u));right:calc(1.4*var(--u));bottom:calc(1.4*var(--u));display:flex;align-items:center;padding:calc(.8*var(--u)) calc(1.4*var(--u));border-radius:calc(1.4*var(--u));background:rgba(19,27,46,.85);font-size:calc(1.5*var(--u));font-weight:700;letter-spacing:.1em;color:#c9d2e6}",
    ".cfa-vw .bars i{flex:1;height:calc(.9*var(--u));border-radius:calc(.45*var(--u));background:#26324f;overflow:hidden;margin:0 calc(1.4*var(--u)) 0 calc(.8*var(--u))}",
    ".cfa-vw .bars i b{display:block;height:100%}",
    ".cfa-vw .hitv{position:absolute;left:0;top:0;right:0;bottom:0;opacity:0;box-shadow:inset 0 0 calc(10*var(--u)) calc(2*var(--u)) rgba(229,57,53,.75)}",
    ".cfa-vw .out{position:absolute;left:0;top:0;right:0;bottom:0;opacity:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5);font-size:calc(6*var(--u));font-weight:700;letter-spacing:.2em;color:" + RED + ";transition:opacity .3s}",
    ".cfa-vw .pops{position:absolute;left:0;right:0;top:24%;height:0}",
    ".cfa-vw.cfa-vmap .tag{padding-left:calc(1.6*var(--u))}",
    // loading
    ".cfa-load{position:absolute;left:0;top:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(90vw 60vh at 50% 120%,rgba(255,90,26,.35),transparent 70%),linear-gradient(180deg,#0b111e,#10172a)}",
    ".cfa-load img{width:calc(22*var(--u));height:calc(22*var(--u));border-radius:22%;box-shadow:0 calc(1.4*var(--u)) calc(4*var(--u)) rgba(0,0,0,.5)}",
    ".cfa-load h2{margin:calc(3*var(--u)) 0 0;font-size:calc(6*var(--u));font-weight:700;letter-spacing:.06em;text-transform:uppercase}",
    ".cfa-load h2 span{color:" + ORANGE + "}",
    ".cfa-load p{margin:calc(1.4*var(--u)) 0 0;font-size:calc(2.6*var(--u));color:#c9d2e6;letter-spacing:.06em}",
    ".cfa-load .bar{width:calc(40*var(--u));height:calc(.9*var(--u));border-radius:calc(.45*var(--u));background:#26324f;margin-top:calc(2.4*var(--u));overflow:hidden}",
    ".cfa-load .bar b{display:block;height:100%;width:30%;background:" + ORANGE + ";border-radius:inherit;animation:cfaLoad 1.3s ease-in-out infinite}",
    "@keyframes cfaLoad{0%{transform:translateX(-100%)}100%{transform:translateX(340%)}}",
    "html.calm .cfa *,body.calm .cfa *{animation:none!important}"
  ].join("\n");
  function css() {
    if (document.getElementById("cfa-css")) return;
    const st = document.createElement("style");
    st.id = "cfa-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  function hotTitle(el, text) {
    el.textContent = "";
    const t = String(text || "").trim(), i = t.lastIndexOf(" ");
    if (i < 1 || /[֐-ࣿऀ-෿　-鿿]/.test(t)) {
      el.textContent = t;
      return;
    }
    el.appendChild(document.createTextNode(t.slice(0, i + 1)));
    h("span", "cfa-hot", el, t.slice(i + 1));
  }
  const OK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 12.6l4.1 4.1 8.7-9.2" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let ENG = null, MOUNT = null, dropT = 0;
  function dropEngine() {
    clearTimeout(dropT);
    dropT = 0;
    if (!ENG) return;
    try {
      ENG.destroy();
    } catch (e) {
    }
    ENG = null;
    if (MOUNT) {
      MOUNT.remove();
      MOUNT = null;
    }
  }
  function parked() {
    if (!ENG) return;
    ENG.hold = true;
    try {
      ENG.applyVol(0);
    } catch (e) {
    }
    clearTimeout(dropT);
    dropT = setTimeout(() => {
      if (ENG && ENG.hold && document.body.dataset.game !== "cfa") dropEngine();
      else if (ENG && ENG.hold) parked();
    }, 8e3);
  }
  const carPic = (i) => HERE + "cfa/ph/car" + String(i + 1).padStart(2, "0") + ".webp";
  const picCache = /* @__PURE__ */ new Map();
  function avatarCanvas(url) {
    if (!url) return Promise.resolve(null);
    if (picCache.has(url)) return picCache.get(url);
    const p = new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = c.height = 96;
          const g = c.getContext("2d");
          g.drawImage(im, 0, 0, 96, 96);
          g.getImageData(0, 0, 1, 1);
          res(c);
        } catch (e) {
          res(null);
        }
      };
      im.onerror = () => res(null);
      im.src = url;
    });
    picCache.set(url, p);
    if (picCache.size > 60) picCache.delete(picCache.keys().next().value);
    return p;
  }
  if (/[?&]debug\b/.test(location.search)) window.__cfa = { get E() {
    return ENG;
  } };
  BVPLAY.game({
    id: "cfa",
    name: "Car Fighting Arena",
    emoji: "🏎️",
    sub: "Drive your car from your phone. Push everyone off the arena.",
    teams: true,
    teamsForce: (s) => s.mode === "team",
    // (the garage and the game's own countdown: no 3, 2, 1 before it; the winners' screen is the game's own; every
    // phone drives through a straight line to the TV when it can)
    ownStart: true,
    ownEnd: true,
    pipes: true,
    endLook: () => "cfa",
    step: ["Pick your car", "Your phone is your steering wheel. Pick a car, then tap Ready."],
    // (some of the game's engine and tire sounds are made from recordings shared under CC BY: their makers, as the
    // license asks. All of it is in cfa/CREDITS.txt.)
    credit: "Some sounds: audible-edge, qubodup, enginemusic and iainmccurdy (CC BY), changed for the game.",
    sounds: [],
    music: { lobby: "cLobby", again: "cLobby", after: "cLobby" },
    // the free games: Last Standing on the Lava arena, one match at a time (the host's phone marks the others Pro)
    free: { mode: "last", arena: "lava", champ: false },
    freeNote: "Free games: Last Standing on the Lava arena. With Blokvane Pro, the host picks any mode and arena, and plays championships.",
    // (the game's files start loading as soon as it is picked: they are big, and everyone is still joining)
    prep: () => {
      css();
      loadLibs().catch(() => {
      });
    },
    deco: "🏎️",
    lobbyTop: (t) => {
      try {
        css();
        const h1 = t.querySelector("h1");
        if (h1) hotTitle(h1, h1.textContent);
        const d = t.querySelector(".deco");
        if (!d) return;
        d.textContent = "";
        d.classList.add("cfa-deco");
        [0, 2, 12].forEach((i, k) => {
          const im = h("img", "", d);
          im.src = carPic(i);
          im.alt = "";
          im.style.transform = "rotate(" + [-6, 0, 6][k] + "deg)";
          if (k === 1) im.style.height = "calc(14*var(--u))";
        });
      } catch (e) {
      }
    },
    steps: [
      { t: "Game mode", s: "Mode", keys: ["lang", "mode"] },
      { t: "The arena", s: "Arena", keys: ["arena", "hazards", "ramps", "shrink"] },
      { t: "The cars", s: "Cars", keys: ["bots", "level", "teamN", "koMin", "champ", "autoNext", "autoGo", "haptics", "drive"] },
      { t: "The TV", s: "TV", keys: ["view", "quality"] }
    ],
    spot: (s) => {
      const m = MODES.find((x) => x[0] === s.mode) || MODES[0], ar = ARENAS.find((x) => x[0] === s.arena) || ARENAS[0];
      const bullets = [["🕹️", "Your phone is your steering wheel: drive on the left, boost, jump and fire on the right."], ["🏎️", "Pick a car on your phone. It drops onto the arena on the TV."], [m[4], m[3]]];
      const facts = [[ar[2], ar[1]], m[0] === "survival" ? ["🌊", "Waves of computer cars"] : ["🤖", "Computer cars: {n}", { n: clampI(s.bots, 0, 9, 5) }]];
      if (s.champ && m[0] !== "survival") facts.push(["🏆", "Best of 5"]);
      else if (m[0] === "score" || m[0] === "crown") facts.push(["⏱️", "{n} min", { n: clampI(s.koMin, 2, 5, 2) }]);
      return { key: m[0], icon: m[4], label: "Game mode", name: m[1], desc: m[2], bullets, facts };
    },
    settings: [
      { key: "mode", label: "Game mode", type: "seg", look: "list", options: MODES.map((m) => [m[0], m[1], m[2]]), default: "last" },
      { key: "arena", label: "Arena", type: "seg", options: ARENAS.map((a) => [a[0], a[1]]), default: "lava" },
      { key: "hazards", label: "Hazards", type: "toggle", default: true, desc: "Each arena's own traps." },
      { key: "ramps", label: "Ramps", type: "toggle", default: true },
      { key: "shrink", label: "Shrinking arena", type: "toggle", default: true, desc: "In Last Standing and Team Battle the arena gets smaller after a while.", when: ["mode", ["last", "team"]] },
      {
        key: "bots",
        label: "Computer cars",
        type: "seg",
        options: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [n, String(n)]),
        default: 5,
        desc: "How many cars the computer drives. With one player, how many cars you play against. There are never more than 10 cars.",
        when: ["mode", "!survival"]
      },
      { key: "level", label: "Computer level", type: "seg", options: [["easy", "Easy"], ["normal", "Normal"], ["hard", "Hard"]], default: "normal" },
      { key: "teamN", label: "How many teams", type: "seg", options: [[2, "2"], [3, "3"], [4, "4"]], default: 2, desc: "Each team drives in its own color.", when: ["mode", "team"] },
      { key: "koMin", label: "Match length", type: "seg", options: [[2, "2 min"], [3, "3 min"], [5, "5 min"]], default: 2, when: ["mode", ["score", "crown"]] },
      { key: "champ", label: "Championship: best of 5", type: "toggle", default: false, desc: "The first to win 3 rounds is the champion.", when: ["mode", "!survival"] },
      { key: "autoNext", label: "Next round starts by itself", tag: "Next round", type: "seg", options: [[0, "Off"], [10, "10 s"], [20, "20 s"]], default: 10, desc: "Off: the host starts each round from their phone.", when: [["champ", true], ["mode", "!survival"]] },
      { key: "autoGo", label: "Start when everyone is ready", type: "toggle", default: true, desc: "The match starts by itself when every player has tapped Ready. Off: the host starts it." },
      { key: "haptics", label: "Phone vibration", type: "toggle", default: true, live: 1, desc: "Phones buzz when you fire, boost, jump, get hit or fall off. Off: no phone buzzes." },
      {
        key: "drive",
        label: "Driving on phones",
        type: "seg",
        options: [["pick", "Each player picks"], ["stick", "Stick"], ["tilt", "Tilting"]],
        default: "pick",
        live: 1,
        desc: "Stick: the stick on the screen. Tilting: turn the phone like a steering wheel and lean it to drive and brake. Each player picks: the stick, and anyone can switch to tilting on their phone."
      },
      { key: "view", label: "TV view", type: "seg", look: "list", options: VIEWS, default: "auto", live: 1 },
      { key: "quality", label: "Picture quality", type: "seg", options: [["AUTO", "Automatic"], ["LOW", "Low"], ["HIGH", "High"]], default: "AUTO", live: 1, desc: "Automatic starts lower on a TV, and goes lower by itself when the TV can't keep up." }
    ],
    tv(K) {
      return __async(this, null, function* () {
        css();
        const s = K.settings;
        const mode = MODES.some((x) => x[0] === s.mode) ? s.mode : "last";
        const arena = ARENAS.some((x) => x[0] === s.arena) ? s.arena : "lava";
        const level = ["easy", "normal", "hard"].includes(s.level) ? s.level : "normal";
        const champ = !!s.champ && mode !== "survival";
        const nT = mode === "team" ? clampI(s.teamN, 2, 4, 2) : 0;
        const W = {};
        for (const k of Object.keys(WORDS)) W[k] = yield K.tr(WORDS[k]);
        const modeName = (MODES.find((x) => x[0] === mode) || MODES[0])[1].toUpperCase(), arenaName = (ARENAS.find((x) => x[0] === arena) || ARENAS[0])[1].toUpperCase();
        const body = K.view(null);
        K.boo(false);
        document.body.classList.add("cfa-on");
        const root = h("div", "cfa", body);
        const load = h("div", "cfa-load", root);
        const li = h("img", "", load);
        li.src = HERE + "icons/cfa.webp";
        li.alt = "";
        hotTitle(h("h2", "", load), yield K.tr("Car Fighting Arena"));
        const lp = h("p", "", load, W.loading);
        h("b", "", h("div", "bar", load));
        try {
          yield Promise.all([loadLibs(), fontsP()]);
        } catch (e) {
          lp.textContent = W.noLoad;
          console.warn("cfa", e);
          while (!K.over()) yield K.sleep(1e3);
          return null;
        }
        if (K.over()) return null;
        if (!MOUNT) {
          MOUNT = h("div", "cfa-m");
        }
        root.insertBefore(MOUNT, load);
        h("div", "cfa-vig", root, null);
        const spd = h("div", "cfa-spd", root), hitEl = h("div", "cfa-hit", root);
        const sp = h("div", "cfa-sp", root);
        const pop = h("div", "cfa-pop", root);
        const hud = h("div", "cfa-hud", root);
        hud.hidden = true;
        const box = h("div", "cfa-box cfa-pnl", hud), boxL = h("div", "cfa-lb", box), boxV = h("div", "v", box), boxS = h("div", "cfa-sc", box);
        const mid = h("div", "cfa-mid", hud), clock = h("div", "cfa-clock cfa-pnl", mid), clR = h("i", "", clock), clT = h("span", "", clock);
        const ser = h("div", "cfa-ser cfa-pnl", mid), shr = h("div", "cfa-shr", mid, "ARENA SHRINKING"), tst = h("div", "cfa-toast", mid);
        const lst = h("div", "cfa-list cfa-pnl", hud);
        const count = h("div", "cfa-count", root), spec = h("div", "cfa-spec", root), busy = h("div", "cfa-busy cfa-pnl", root, W.cars);
        const vic = h("div", "cfa-vic", root), vicH = h("div", "hd", vic), vicT = h("div", "tt", vic), vicN = h("div", "nm", vic);
        const rep = h("div", "cfa-rep", root);
        h("div", "bar", rep).style.top = "0";
        h("div", "bar", rep).style.bottom = "0";
        const repT = h("div", "tg", rep);
        h("span", "", repT);
        repT.appendChild(document.createTextNode("REPLAY · FINAL KNOCKOUT"));
        const over = h("div", "cfa-over", root);
        const gar = h("div", "cfa-g", root);
        for (const x of [spec, busy, vic, rep, over, gar, ser, shr, tst]) x.hidden = true;
        let dirty = true, lastPh = "", nextAt = 0, overDrawn = false, roundRes = null, ftEl = null;
        let phase = "garage", gv = 0, sayT = 0, goAt = 0, goT = 0, tick = 0;
        const quality = ["AUTO", "LOW", "HIGH"].includes(s.quality) ? s.quality : "AUTO";
        const st0 = { mode, arena, diff: level, champ, hazards: s.hazards !== false, ramps: s.ramps !== false, quality, vol: 3 };
        const hooks = { state: () => {
          dirty = true;
        }, ev: (k, c, a, b) => onEv(k, c, a, b) };
        let E = ENG, fresh = false;
        clearTimeout(dropT);
        dropT = 0;
        if (E && !E.dead) {
          E.hooks = hooks;
          E.hold = false;
          Object.assign(E.state, st0);
          if (E.size) E.size();
        } else {
          fresh = true;
          E = ENG = new window.CFAEngine({ base: HERE + "cfa/", quality0: K.tv || K.slow ? 0 : 2, props: { bots: 5, shrinkArena: true, camera: "Chase", engineVol: 1, rivalEngines: 1 }, state: st0, hooks });
        }
        E.props.shrinkArena = s.shrink !== false;
        E.teamN = nT || 2;
        E.koTime = clampI(s.koMin, 2, 5, 2) * 60;
        E.popRef.current = pop;
        E.speedRef.current = spd;
        E.hitRef.current = hitEl;
        E.view = "";
        let readyRes = null;
        const readyP = new Promise((r) => {
          readyRes = r;
        });
        if (fresh) E.mount(MOUNT);
        else readyRes();
        const SND = window.BVSOUND;
        let volNow = -1;
        const bridge = () => {
          if (E.dead) return;
          const lv = SND && SND.fxLevel ? SND.fxLevel() : 1, v = root.isConnected ? 3 * lv : 0;
          if (Math.abs(v - volNow) > 0.01) {
            volNow = v;
            try {
              E.applyVol(v);
            } catch (e) {
            }
          }
          if (E.ac && E.ac.state === "suspended" && !E.paused && !K.paused() && lv > 0 && root.isConnected) {
            try {
              E.ac.resume();
            } catch (e) {
            }
          }
        };
        const watch = setInterval(() => {
          if (!root.isConnected) {
            clearInterval(watch);
            clearInterval(tick);
            document.body.classList.remove("cfa-on");
            if (ENG === E) parked();
            else {
              try {
                E.destroy();
              } catch (e) {
              }
            }
            return;
          }
          bridge();
        }, 500);
        yield Promise.race([readyP, (() => __async(this, null, function* () {
          while (!K.over() && !E.scene) yield K.sleep(200);
        }))()]);
        if (K.over()) return null;
        load.hidden = true;
        E.applyQ(quality);
        bridge();
        const setView = (v) => {
          const w = VIEWS.some((x) => x[0] === v) ? v : "auto";
          E.setView(w === "auto" ? "" : w);
        };
        setView(s.view);
        K.onSet((key, v) => {
          if (key === "view") setView(v);
          else if (key === "quality" && ["AUTO", "LOW", "HIGH"].includes(v)) {
            E.state.quality = v;
            E.applyQ(v);
          } else if (key === "haptics") {
            s.haptics = v;
            try {
              sayGarage();
              sayMatch();
            } catch (e) {
            }
          } else if (key === "drive") {
            s.drive = v;
            try {
              sayGarage();
              sayMatch();
            } catch (e) {
            }
          }
        });
        K.onPause((p) => {
          try {
            E.togglePause(!!p);
          } catch (e) {
          }
          if (!p) bridge();
        });
        const picks = /* @__PURE__ */ new Map(), rdy = /* @__PURE__ */ new Set(), later = /* @__PURE__ */ new Set(), avatars = /* @__PURE__ */ new Map();
        const here = () => K.players().filter((p) => !p.away && !later.has(p.id));
        const carOf = (id) => picks.has(id) ? picks.get(id) : hashId(id) % 16;
        const teamOf = (p) => nT ? Math.max(0, Math.min(nT - 1, TEAM_IX[p.team] != null ? TEAM_IX[p.team] : 0)) : 0;
        const colorOf = (p) => nT ? TEAM_COL[teamOf(p)] : p.color || ORANGE;
        const nameOf = (p) => String(p.name || "").slice(0, 16);
        function avatar(p) {
          const url = K.avatarUrl(p);
          const a = avatars.get(p.id);
          if (a && a.url === url) return a.pic;
          const rec = { url, pic: null };
          avatars.set(p.id, rec);
          avatarCanvas(url).then((c) => {
            rec.pic = c;
            if (phase === "garage") garageSet();
          });
          return null;
        }
        const gh = h("div", "cfa-gt", gar);
        const ghl = h("div", "cfa-gh", gh);
        h("h1", "", ghl, W.pick);
        const ghp = h("p", "", ghl);
        ghp.textContent = modeName + " · " + arenaName;
        if (champ) {
          const i = h("i", "", ghp, " · BEST OF 5");
        }
        const how = h("div", "cfa-how cfa-pnl", gh);
        h("div", "lb2", how, W.how.toUpperCase());
        const phn = h("div", "cfa-phn", how);
        const jy = h("div", "cfa-jy", phn);
        jy.innerHTML = stickArt(W.steer);
        h("div", "kn", jy);
        const bt = h("div", "cfa-bt", phn);
        [["fire", W.fire, 14.2, 12.2, 8.8], ["boost", W.boost, 4.34, 12.73, 6.4], ["jump", W.jump, 6.63, 4.63, 6.4], ["swap", W.swap, 14.55, 3.4, 5.9]].forEach(([k, t, x, y, d]) => {
          const sk = h("div", "sk " + k, bt);
          sk.style.cssText = "left:calc(" + (x - d / 2) + "*var(--u));top:calc(" + (y - d / 2) + "*var(--u));width:calc(" + d + "*var(--u));height:calc(" + d + "*var(--u))";
          h("div", "wl", sk);
          h("b", "", h("div", "cap", sk), t);
        });
        const gb = h("div", "cfa-gb", gar);
        const gs = h("div", "cfa-gs cfa-pnl", gb);
        const gc = h("div", "cfa-gc", gb);
        const cards = /* @__PURE__ */ new Map();
        function garageCards() {
          const ps = K.players().filter((p) => !p.away);
          gc.classList.toggle("many", ps.length > 5);
          const seen = /* @__PURE__ */ new Set();
          ps.forEach((p, i) => {
            seen.add(p.id);
            let c = cards.get(p.id);
            if (!c) {
              const el = h("div", "cfa-pc", gc), who = h("div", "who", el), im = h("img", "", who);
              im.alt = "";
              const nm = h("b", "", who), ok = h("span", "ok", who);
              ok.innerHTML = OK_SVG;
              const cn = h("div", "cn", el), stg = h("div", "st", el), bars = [];
              [W.speed, W.accel, W.weight, W.handling].forEach((t) => {
                h("span", "", stg, t);
                bars.push(h("b", "", h("i", "", stg)));
              });
              c = { el, im, nm, ok, cn, bars, url: "" };
              cards.set(p.id, c);
            }
            if (c.el.parentNode !== gc || gc.children[i] !== c.el) gc.insertBefore(c.el, gc.children[i] || null);
            const url = K.avatarUrl(p);
            if (c.url !== url) {
              c.url = url;
              c.im.src = url;
            }
            c.el.style.setProperty("--pc", colorOf(p));
            c.nm.textContent = nameOf(p);
            const ci = carOf(p.id), def = E.CARS[ci] || E.CARS[0];
            c.cn.textContent = def.name;
            def.st.forEach((v, k) => {
              c.bars[k].style.width = v + "%";
            });
            const r = rdy.has(p.id);
            c.el.classList.toggle("rd", r);
            c.ok.hidden = !r;
            c.el.classList.toggle("later", later.has(p.id));
          });
          for (const [id, c] of cards) if (!seen.has(id)) {
            c.el.remove();
            cards.delete(id);
          }
        }
        function garageSay() {
          const ps = here(), all = ps.length > 0 && ps.every((p) => rdy.has(p.id));
          gs.classList.toggle("go", !!goAt);
          if (goAt) gs.textContent = K.f(WORDS.startIn, { n: Math.max(1, Math.ceil((goAt - K.now()) / 1e3)) });
          else if (all) gs.textContent = W.allReady + " " + (s.autoGo === false ? W.hostGo : "");
          else gs.textContent = W.waitAll;
        }
        function garageSet() {
          if (phase !== "garage") return;
          const ps = K.players().filter((p) => !p.away);
          E.gSet(ps.map((p) => ({ key: p.id, carIdx: carOf(p.id), name: nameOf(p), color: colorOf(p), hum: true, pic: avatar(p), ready: rdy.has(p.id) })));
          garageCards();
          garageSay();
        }
        function driveOf() {
          return s.drive === "stick" || s.drive === "tilt" ? s.drive : "pick";
        }
        function garageMsg() {
          const cars2 = {};
          for (const p of K.players()) cars2[p.id] = [carOf(p.id), rdy.has(p.id) ? 1 : 0, later.has(p.id) ? 1 : 0];
          return { k: "cfa", t: "g", v: gv, ph: phase, mode, arena, champ: champ ? 1 : 0, nT, cars: cars2, go: goAt ? Math.max(1, Math.ceil((goAt - K.now()) / 1e3)) : 0, solo: here().length <= 1 ? 1 : 0, auto: s.autoGo === false ? 0 : 1, hap: s.haptics === false ? 0 : 1, drv: driveOf() };
        }
        function sayGarage(now) {
          gv++;
          clearTimeout(sayT);
          const go = () => {
            sayT = 0;
            K.say(garageMsg());
          };
          if (now) go();
          else sayT = setTimeout(go, 150);
        }
        function checkGo() {
          const ps = here(), all = ps.length > 0 && ps.every((p) => rdy.has(p.id));
          if (all && s.autoGo !== false && !goAt && phase === "garage") {
            goAt = K.now() + 3e3;
            const step = () => {
              if (!goAt || phase !== "garage" || K.over()) return;
              if (K.now() >= goAt) {
                goAt = 0;
                startMatch();
                return;
              }
              garageSay();
              sayGarage(true);
              goT = K.after(500, step);
            };
            step();
          } else if (!all && goAt) {
            goAt = 0;
            if (goT) goT();
            garageSay();
            sayGarage();
          }
        }
        let roster = [], startRes = null, nextRes = null;
        const startP = new Promise((r) => {
          startRes = r;
        });
        function buildRoster() {
          const hs = here();
          const hum = hs.map((p) => ({ key: p.id, pid: p.id, name: nameOf(p), hum: true, carIdx: carOf(p.id), color: colorOf(p), team: teamOf(p), pic: avatar(p) }));
          const out = hum.slice();
          if (mode === "survival") return out;
          let nb = Math.max(0, Math.min(clampI(s.bots, 0, 9, 5), 10 - hum.length));
          if (hum.length + nb < 2) nb = 2 - hum.length;
          if (nT) {
            const size = new Array(nT).fill(0);
            for (const x of hum) size[x.team]++;
            let need = 0;
            for (let t = 0; t < nT; t++) if (!size[t]) need++;
            nb = Math.max(nb, need);
            nb = Math.min(nb, 10 - hum.length);
            for (let i = 0; i < nb; i++) {
              let t = 0;
              for (let k = 1; k < nT; k++) if (size[k] < size[t]) t = k;
              size[t]++;
              out.push({ key: "bot" + (i + 1), name: "", hum: false, team: t });
            }
          } else for (let i = 0; i < nb; i++) out.push({ key: "bot" + (i + 1), name: "BOT " + (i + 1), hum: false, team: 0 });
          return out;
        }
        function startMatch() {
          if (phase !== "garage") return;
          goAt = 0;
          phase = "match";
          startRes();
        }
        K.on("cfa", (m, pl, viaPipe) => {
          if (!m || typeof m.a !== "string") return;
          const id = pl.id;
          if (m.a === "in") {
            if (phase !== "match") return;
            const c = E.carOf(id);
            if (!c) return;
            c.slowPad = !viaPipe;
            E.input(id, { steer: clampI(m.s, -100, 100, 0) / 100, gas: clampI(m.g, 0, 100, 0) / 100, brake: m.b ? 1 : 0, boost: m.o ? 1 : 0 });
            if (c.auto && !pl.away) c.auto = false;
            return;
          }
          if (m.a === "fire" || m.a === "jump" || m.a === "swap") {
            if (phase === "match") E.press(id, m.a);
            return;
          }
          if (m.a === "sync") {
            syncOne(id);
            return;
          }
          if (m.a === "pick") {
            const i = clampI(m.i, 0, 15, -1);
            if (i < 0) return;
            if (picks.get(id) === i) return;
            picks.set(id, i);
            rdy.delete(id);
            if (phase === "garage") {
              garageSet();
              checkGo();
            }
            sayGarage();
            return;
          }
          if (m.a === "ready") {
            if (m.on) {
              rdy.add(id);
              if (!picks.has(id)) picks.set(id, carOf(id));
            } else rdy.delete(id);
            if (phase === "garage") {
              garageSet();
              checkGo();
            }
            sayGarage();
            return;
          }
          if (!K.isHost(id)) return;
          if (m.a === "go" && phase === "garage") startMatch();
          else if (m.a === "next" && nextRes) {
            const r = nextRes;
            nextRes = null;
            r();
          } else if (m.a === "skip" && E.rp) E.rp.skip = true;
        });
        K.onPlayers(() => {
          for (const c of E.cars || []) if (c.hum) {
            const p = K.player(c.key);
            c.auto = !p || !!p.away;
            if (!c.auto && !c.padAt) c.padAt = performance.now();
          }
          if (phase === "garage") {
            garageSet();
            checkGo();
          } else for (const p of K.players()) if (!p.away && !(E.cars || []).some((c) => c.key === p.id)) later.add(p.id);
          sayGarage();
        });
        K.pipes.on((id, open) => {
          const c = E.carOf && E.carOf(id);
          if (c) c.slowPad = !open;
          if (open) syncOne(id);
        });
        const evQ = /* @__PURE__ */ new Map();
        function onEv(kind, c, a, b) {
          if (kind === "ready") {
            if (readyRes) readyRes();
            return;
          }
          if (kind === "views" || kind === "layout") {
            splitUi();
            return;
          }
          if (kind === "end") return;
          if (phase !== "match") return;
          const to = (car, e, x, col) => {
            if (!car || !car.hum) return;
            const m = { k: "cfa", t: "e", e, x: x == null ? void 0 : String(x).slice(0, 60), c: col };
            if (!K.pipes.to(car.key, m)) {
              const q = evQ.get(car.key) || [];
              if (q.length < 3 && e !== "hit") {
                q.push(m);
                evQ.set(car.key, q);
              }
            }
          };
          if (kind === "tell") to(c, "tell", a);
          else if (kind === "pop") to(c, "pop", a, typeof b === "string" ? b : void 0);
          else if (kind === "out") to(c, "out");
          else if (kind === "back") to(c, "back");
          else if (kind === "fell") {
            to(c, "fell", a && a.name);
            if (a && a.hum) to(a, "ko", c.name);
          } else if (kind === "hit") to(c, "hit", Math.round(Math.max(0, Math.min(9, +a || 0))));
          else if (kind === "pick") to(c, "pick", a);
          else if (kind === "emp") to(c, "emp");
        }
        const flushEv = () => {
          for (const [id, q] of evQ) {
            if (q.length) K.sayTo(id, q.shift());
            if (!q.length) evQ.delete(id);
          }
        };
        function matchInfo() {
          const S2 = E.state, hd = S2.hud || {};
          return {
            ph: E.phase,
            mode,
            t: hd.time || "",
            r: hd.round || "",
            ser: serLine(),
            cnt: S2.count || "",
            box: hd.box || "",
            bv: hd.boxVal || "",
            bs: hd.boxSub || "",
            solo: E.solo ? 1 : 0,
            busy: S2.busy ? 1 : 0,
            hap: s.haptics === false ? 0 : 1,
            drv: driveOf(),
            res: E.phase === "over" || E.phase === "victory" ? { h: (S2.result || {}).head || "", t: (S2.result || {}).title || "", n: (S2.result || {}).name || "", s: (S2.result || {}).series || "", more: champ && E.series && !E.series.done ? 1 : 0, auto: nextAt ? Math.max(0, Math.ceil((nextAt - K.now()) / 1e3)) : 0 } : null
          };
        }
        const statusOf = (c) => {
          const x = E.status(c);
          x.nw = x.n;
          x.pl = placeOf(c);
          x.n = (E.cars || []).length;
          x.team = c.team;
          x.col = c.color;
          x.auto = c.auto ? 1 : 0;
          return x;
        };
        function placeOf(c) {
          const all = (E.cars || []).slice(), v = (o) => mode === "hill" || mode === "crown" ? o.pts : o.kos * 1e4 + o.score;
          all.sort((a, b) => (a.elim && !E.respawns ? 1 : 0) - (b.elim && !E.respawns ? 1 : 0) || v(b) - v(a));
          return all.indexOf(c) + 1;
        }
        function serLine() {
          const S2 = E.series;
          if (!champ || !S2) return "";
          const ks = Object.keys(S2.wins || {}).sort((a, b) => S2.wins[b] - S2.wins[a]).slice(0, 4);
          return "BEST OF 5" + (ks.length ? " · " + ks.map((k) => k + " " + S2.wins[k]).join(" · ") : "");
        }
        let fast = 0;
        function sayMatch() {
          if (phase !== "match" || !E.cars) return;
          fast++;
          const info = matchInfo();
          const relay = {};
          for (const c of E.cars) {
            if (!c.hum) continue;
            const st = statusOf(c);
            if (!K.pipes.to(c.key, { k: "cfa", t: "s", s: st, m: info })) relay[c.key] = st;
          }
          if (fast % 3 === 0) {
            K.say({ k: "cfa", t: "m", m: info, st: relay });
            flushEv();
          }
          keepScores();
        }
        function syncOne(id) {
          if (phase === "garage" || !E.cars) {
            K.sayTo(id, garageMsg());
            return;
          }
          const c = E.carOf(id), info = matchInfo();
          K.sayTo(id, garageMsg());
          K.sayTo(id, { k: "cfa", t: "m", m: info, st: c ? { [id]: statusOf(c) } : {} });
        }
        function keepScores() {
          for (const c of E.cars || []) {
            if (!c.hum) continue;
            const p = K.player(c.key);
            if (p) p.score = mode === "hill" || mode === "crown" ? Math.floor(c.pts || 0) : c.score || 0;
          }
        }
        const show = (el, on) => {
          if (el.hidden === !on) return;
          el.hidden = !on;
        };
        const txt = (el, t) => {
          t = t == null ? "" : String(t);
          if (el.textContent !== t) el.textContent = t;
        };
        let listSig = "";
        function draw() {
          if (!dirty) return;
          dirty = false;
          const S2 = E.state, ph = E.phase, hd = S2.hud || {}, match = ph === "countdown" || ph === "playing";
          if (ph !== lastPh) {
            lastPh = ph;
            phaseChanged(ph);
          }
          show(gar, ph === "garage");
          if (ph === "garage") {
            show(hud, false);
            show(busy, !!S2.busy);
            return;
          }
          show(busy, !!S2.busy);
          show(hud, match);
          txt(boxL, hd.box);
          boxV.textContent = String(hd.boxVal == null ? "" : hd.boxVal);
          if (hd.boxSub) h("small", "", boxV, hd.boxSub);
          show(boxS, E.solo);
          if (E.solo) {
            boxS.textContent = "SCORE ";
            h("b", "", boxS, String(hd.score || 0));
          }
          txt(clR, hd.round);
          txt(clT, hd.time);
          const sl = serLine();
          show(ser, !!sl);
          txt(ser, sl);
          show(shr, !!hd.shrinking);
          show(tst, !!S2.toast && match);
          txt(tst, S2.toast);
          const ls = hd.list || [], sig = JSON.stringify(ls) + "|" + (hd.lead || "");
          if (sig !== listSig) {
            listSig = sig;
            lst.textContent = "";
            for (const p of ls) {
              const r = h("div", "r" + (p.hum && !E.solo ? " me" : "") + (hd.lead === p.key && !E.solo ? " ld" : ""), lst);
              r.style.opacity = p.op;
              h("span", "d", r).style.background = p.color;
              if (p.hum && !E.solo) {
                const pl = K.player(p.key);
                if (pl) {
                  const im = h("img", "p", r);
                  im.src = K.avatarUrl(pl);
                  im.alt = "";
                }
              }
              h("span", "n", r, (p.crown ? "👑 " : "") + (p.bomb ? "💣 " : "") + p.name);
              const s2 = h("span", "s", r, p.status);
              s2.style.color = p.sc;
            }
          }
          show(count, !!S2.count && match);
          txt(count, S2.count);
          show(spec, ph === "playing" && E.solo && !!hd.dead);
          txt(spec, hd.deadText);
          const R2 = S2.result || {};
          show(vic, ph === "victory");
          if (ph === "victory") {
            txt(vicH, R2.head);
            txt(vicT, R2.title);
            txt(vicN, R2.name);
          }
          show(rep, ph === "replay");
          show(over, ph === "over");
        }
        let playAt = 0;
        const quiet = () => {
          if (E.phase !== "playing") {
            playAt = 0;
            return;
          }
          const t = performance.now();
          if (!playAt) playAt = t;
          for (const c of E.cars || []) if (c.hum && !c.auto && t - (c.padAt || playAt) > 8e3) c.auto = true;
        };
        tick = setInterval(() => {
          if (!root.isConnected) return;
          draw();
          if (phase === "match") {
            sayMatch();
            quiet();
          }
        }, 100);
        function phaseChanged(ph) {
          if (ph === "countdown") {
            K.snd.music(["cPlayA", "cPlayB", "cPlayC", "cPlayD"][Math.floor(Math.random() * 4)], { fadeIn: 1.5, fadeOut: 1 });
          }
          if (ph === "victory") {
            const last = !champ || !E.series || E.series.done;
            K.snd.music(last ? Math.random() < 0.5 ? "cWin1" : "cWin2" : Math.random() < 0.5 ? "cPreA" : "cPreB", { fadeOut: 1, fadeIn: last ? 0.3 : 1.2 });
          }
          if (ph === "victory" || ph === "over" && !overDrawn) {
            overCard();
          }
          if (ph === "over" && roundRes) {
            const r = roundRes;
            roundRes = null;
            r();
          }
          if (phase === "match") sayMatch();
        }
        function overCard() {
          overDrawn = true;
          const R2 = E.state.result || {};
          over.textContent = "";
          const cd = h("div", "cfa-card", over);
          h("div", "hd", cd, R2.head);
          h("div", "tt", cd, R2.title);
          h("div", "nm", cd, R2.name);
          if (R2.car) h("div", "cr", cd, R2.car);
          if (R2.series) h("div", "se", cd, R2.series);
          if (E.solo) {
            const sc = h("div", "cr", cd, "YOUR SCORE ");
            const b2 = h("b", "", sc, String(R2.score || 0));
            b2.style.color = GOLD;
          }
          const bd = h("div", "bd", cd);
          const rows = (R2.board || []).slice(0, 10);
          rows.forEach((r, i) => {
            const rw = h("div", "rw" + (i === 0 ? " w" : ""), bd);
            h("span", "ps", rw, String(r.pos));
            const pl = r.hum ? K.player(r.key) : null;
            if (pl) {
              const im = h("img", "", rw);
              im.src = K.avatarUrl(pl);
              im.alt = "";
              im.style.boxShadow = "0 0 0 .3vh " + r.color;
            } else h("span", "d", rw).style.background = r.color;
            h("span", "n", rw, r.name);
            h("span", "c", rw, r.car);
            h("span", "pt", rw, r.pts);
          });
          ftEl = h("div", "ft", cd);
          footLine();
        }
        function footLine() {
          if (!ftEl) return;
          ftEl.textContent = "";
          const more = champ && E.series && !E.series.done;
          if (more) {
            h("b", "", ftEl, (nextAt ? K.f(WORDS.nextIn, { n: Math.max(1, Math.ceil((nextAt - K.now()) / 1e3)) }) : W.nextRound).toUpperCase());
            if (!nextAt) ftEl.appendChild(document.createTextNode(W.hostNext));
          } else ftEl.textContent = W.hostAgain;
        }
        const avImg = (p) => {
          const im = document.createElement("img");
          im.src = K.avatarUrl(p);
          im.alt = "";
          return im;
        };
        function splitUi() {
          sp.textContent = "";
          root.classList.toggle("split", !!(E.views && E.views.length));
          const vs = E.views || [], W0 = E.W0 || 1, H0 = E.H0 || 1;
          for (const k of ["n2", "n3", "n4"]) root.classList.toggle(k, vs.length === +k[1]);
          for (const w of vs) {
            const c = w.c, q = w.rect, el = h("div", "cfa-vw q" + (vs.indexOf(w) + 1), sp);
            el.style.cssText = "left:" + q[0] / W0 * 100 + "%;top:" + (H0 - q[1] - q[3]) / H0 * 100 + "%;width:" + q[2] / W0 * 100 + "%;height:" + q[3] / H0 * 100 + "%";
            el.style.setProperty("--pc", c.color);
            const tag = h("div", "tag", el), pl = K.player(c.key);
            if (pl) tag.appendChild(avImg(pl));
            tag.appendChild(document.createTextNode(c.name));
            const hitv = h("div", "hitv", el), out = h("div", "out", el, "OUT"), pops = h("div", "pops", el);
            const bars = h("div", "bars", el);
            bars.appendChild(document.createTextNode("BOOST"));
            const bb = h("b", "", h("i", "", bars));
            bb.style.background = ORANGE;
            bars.appendChild(document.createTextNode("DAMAGE"));
            const db = h("b", "", h("i", "", bars));
            db.style.background = RED;
            w.ui = { boost: bb, dmg: db, hit: hitv, out };
            w.popEl = pops;
          }
          if (E.mapRect) {
            const q = E.mapRect, el = h("div", "cfa-vw cfa-vmap", sp);
            el.style.cssText = "left:" + q[0] / W0 * 100 + "%;top:" + (H0 - q[1] - q[3]) / H0 * 100 + "%;width:" + q[2] / W0 * 100 + "%;height:" + q[3] / H0 * 100 + "%";
            h("div", "tag", el, "ARENA");
          }
        }
        for (const p of K.players()) {
          if (!picks.has(p.id)) {
            const used = new Set(picks.values());
            let i = hashId(p.id) % 16;
            for (let k = 0; k < 16 && used.has(i); k++) i = (i + 1) % 16;
            picks.set(p.id, i);
          }
        }
        K.snd.music(Math.random() < 0.5 ? "cPreA" : "cPreB", { fadeIn: 1.2, fadeOut: 1.2 });
        if (E.phase === "garage" || E.phase === "select" || !E.phase) E.gOpen(arena);
        else E.toGarage(arena);
        lastPh = "";
        garageSet();
        sayGarage(true);
        dirty = true;
        K.after(5e3, () => {
          if (E.busy || E.nextPool) return;
          const pool = E.CARS.slice().sort(() => Math.random() - 0.5).slice(0, 3);
          E.nextPool = pool;
          for (const d of pool) {
            try {
              Promise.resolve(E.loadCar(d)).catch(() => {
              });
              Promise.resolve(E.loadEngine(d)).catch(() => {
              });
            } catch (e) {
            }
          }
        });
        yield Promise.race([startP, (() => __async(this, null, function* () {
          while (!K.over()) yield K.sleep(400);
        }))()]);
        if (K.over()) return null;
        roster = buildRoster();
        E.roster = null;
        show(gar, false);
        sayGarage(true);
        let first = true;
        for (; ; ) {
          overDrawn = false;
          ftEl = null;
          nextAt = 0;
          const roundP = new Promise((r) => {
            roundRes = r;
          });
          if (first) {
            E.start(roster);
            first = false;
          } else {
            const now = new Set(roster.filter((x) => x.hum).map((x) => x.key));
            for (const p of K.players().filter((q) => !q.away)) if (!now.has(p.id) && roster.length) {
              const bi = roster.findIndex((x) => !x.hum);
              const nx = { key: p.id, pid: p.id, name: nameOf(p), hum: true, carIdx: carOf(p.id), color: colorOf(p), team: teamOf(p), pic: avatar(p) };
              if (bi >= 0) roster.splice(bi, 1, nx);
              else if (roster.length < 10) roster.push(nx);
              else continue;
              later.delete(p.id);
            }
            for (const x of roster) if (x.hum) {
              const p = K.player(x.key);
              x.away = !p || !!p.away;
            }
            E.roster = roster;
            try {
              yield Promise.all(roster.filter((x) => x.hum).map((x) => {
                const d = E.CARS[x.carIdx] || E.CARS[0];
                return Promise.all([E.loadCar(d), E.loadEngine(d)]);
              }));
            } catch (e) {
            }
            if (K.over()) return null;
            E.again();
          }
          later.clear();
          sayGarage(true);
          sayMatch();
          yield Promise.race([roundP, (() => __async(this, null, function* () {
            while (!K.over()) yield K.sleep(500);
          }))()]);
          if (K.over()) return null;
          const done = !champ || !E.series || E.series.done || mode === "survival";
          if (done) break;
          const autoN = clampI(s.autoNext, 0, 20, 10);
          const nxP = new Promise((r) => {
            nextRes = r;
          });
          K.hostWait(true);
          if (autoN) {
            nextAt = K.now() + autoN * 1e3;
            (() => __async(this, null, function* () {
              while (nextAt && !K.over() && nextRes) {
                footLine();
                sayMatch();
                if (K.now() >= nextAt) {
                  const r = nextRes;
                  nextRes = null;
                  if (r) r();
                  break;
                }
                yield K.sleep(500);
              }
            }))();
          } else footLine();
          sayMatch();
          yield Promise.race([nxP, (() => __async(this, null, function* () {
            while (!K.over()) yield K.sleep(500);
          }))()]);
          K.hostWait(false);
          nextAt = 0;
          if (K.over()) return null;
        }
        footLine();
        sayMatch();
        keepScores();
        const R = E.state.result || {};
        const board = R.board || [];
        const S = E.series || { wins: {} };
        let order = board.slice();
        if (champ) {
          const winsOf = (x) => (S.wins || {})[mode === "team" ? (E.TEAMS[x.team] || "") + " TEAM" : x.name] || 0;
          order = board.slice().sort((a, b) => winsOf(b) - winsOf(a) || a.pos - b.pos);
        }
        const rank = [];
        rank.places = /* @__PURE__ */ new Map();
        const cars = E.cars || [], fin = {};
        const winTeam = mode === "team" && order[0] ? order[0].team : -1;
        const ptsOf = (c) => c ? mode === "hill" || mode === "crown" ? Math.floor(c.pts || 0) : c.score || 0 : 0;
        order.forEach((x, i) => {
          const place = mode === "team" ? x.team === winTeam ? 1 : i + 1 : i + 1;
          const c = cars.find((o) => o.key === x.key), ci = c ? E.CARS.indexOf(c.def) : -1;
          if (x.hum) {
            const p = K.player(x.key);
            if (!p) return;
            p.score = ptsOf(c);
            rank.push(p);
            rank.places.set(p.id, place);
            fin[p.id] = ci;
          } else {
            const id = "cfa-" + x.key;
            rank.push({ id, name: x.name, score: ptsOf(c), av: "boo:cool" });
            rank.places.set(id, place);
            fin[id] = ci;
          }
        });
        rank.of = Math.max(1, order.length);
        for (const p of K.players()) if (!rank.includes(p)) {
          p.score = p.score || 0;
          rank.push(p);
          rank.places.set(p.id, rank.of);
        }
        K.say({ k: "cfa", t: "fin", cars: fin });
        rank.own = true;
        phase = "end";
        return rank;
      });
    }
  });
})();
