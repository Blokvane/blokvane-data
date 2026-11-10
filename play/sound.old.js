// Made from sound.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change sound.js and run node tools/old-js.js again.
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
var BVSOUND = (() => {
  "use strict";
  const BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "") + "sounds/";
  const FILES = {
    theme: ["theme.mp3", 0.42, "loop"],
    easy: ["q-easy.mp3", 0.46, "loop"],
    medium: ["q-medium.mp3", 0.5, { skip: 0.62, tail: 0.25, xf: 1.6 }],
    hard: ["q-hard.mp3", 0.5, { skip: 0.38, tail: 0.25, xf: 1.6 }],
    last2: ["last2.mp3", 0.8, { skip: 0, tail: 0.3, xf: 2 }],
    between: ["between.mp3", 0.4, { skip: 0.1, tail: 0.3, xf: 0.9 }],
    next: ["next.mp3", 0.61],
    every5: ["every5.mp3", 0.86],
    correct: ["correct.mp3", 0.66],
    wrong: ["wrong.mp3", 0.69],
    timesup: ["times-up.mp3", 0.85],
    win: ["win.mp3", 0.7],
    // Where in the World?'s own effects (several can sound at once: see fx below)
    whoosh: ["w-whoosh.mp3", 0.46],
    plane: ["w-plane.mp3", 0.6],
    ping: ["w-ping.mp3", 0.55],
    stamp: ["w-stamp.mp3", 0.9],
    shutter: ["w-shutter.mp3", 0.94],
    static: ["w-static.mp3", 0.62],
    neon: ["w-neon.mp3", 0.67],
    print: ["w-print.mp3", 0.68],
    spot: ["w-spot.mp3", 0.85],
    sparkle: ["w-sparkle.mp3", 0.51],
    flip: ["w-flip.mp3", 0.85],
    flutter: ["w-flutter.mp3", 0.56],
    pop: ["w-pop.mp3", 0.6],
    tick: ["w-tick.mp3", 0.9],
    hint: ["w-hint.mp3", 0.5],
    drumroll: ["w-drumroll.mp3", 0.57],
    land: ["w-land.mp3", 0.65],
    zip: ["w-zip.mp3", 0.53],
    bull: ["w-bull.mp3", 0.6],
    globe: ["w-globe.mp3", 0.63],
    focus: ["w-focus.mp3", 0.6],
    coin: ["w-coin.mp3", 0.66],
    // Guess It Right!: its tunes are a few minutes long each, so they stream (an <audio> element feeding the same mixer)
    // instead of sitting in memory whole. tail: the quiet seconds at the end; xf: how long one fades into the next. Its
    // game tune is a list: the Staircase of the Golden Snake and the Chambers of the Silent King, one after the other,
    // round and round, each fading into the next.
    gTheme: ["g-theme.mp3", 0.28, { stream: true, tail: 1.9, xf: 4 }],
    gAfter: ["g-after.mp3", 0.31, { stream: true, tail: 1.2, xf: 4 }],
    gSnake: ["g-snake.mp3", 0.285, { stream: true, tail: 0.3, xf: 4 }],
    gPlay: ["", 1, { list: ["gSnake", "gAfter"], xf: 6 }],
    // (its moments sit just above the tune, all equally loud (about 2 dB over it), so the tune never has to drop far)
    gNext: ["g-next.mp3", 0.42],
    gEvery5: ["g-every5.mp3", 0.52],
    gCorrect: ["g-correct.mp3", 0.56],
    gWrong: ["g-wrong.mp3", 0.59],
    gTimesup: ["g-timesup.mp3", 0.65],
    gWin: ["g-win.mp3", 0.88],
    gSpin: ["g-spin.mp3", 1],
    gLand: ["g-land.mp3", 1],
    gTick: ["g-tick.mp3", 0.9],
    // Who's the Imposter?: its lobby tune (also after the reveal, until the next game starts), two game tunes that take
    // turns while everyone peeks and gives clues, the tune for talking it over and voting, "next player" before each
    // clue, and The Mask Falls for the reveal: it plays once, the imposter shows exactly 8 seconds in (at() below), and
    // the lobby tune comes back when it ends.
    iLobby: ["i-lobby.mp3", 0.3, { stream: true, tail: 0.6, xf: 3 }],
    iAlibi: ["i-alibi.mp3", 0.28, { stream: true, tail: 0.6, xf: 4 }],
    iHeart: ["i-heart.mp3", 0.28, { stream: true, tail: 0.6, xf: 4 }],
    iPlay: ["", 1, { list: ["iAlibi", "iHeart"], xf: 5 }],
    iVote: ["i-vote.mp3", 0.3, { stream: true, tail: 0.6, xf: 3 }],
    iReveal: ["i-reveal.mp3", 0.62, { stream: true, once: true, then: "iLobby", tail: 0.4 }],
    iNext: ["i-next.mp3", 0.75],
    // Trivia's category wheel: the clicks and the little fanfare of its design, timed to its spin (play/wheel.js)
    tSpin: ["t-spin.mp3", 1],
    // Emoji Riddles: the Marimba Gambit in the lobby; three game tunes that take turns, each game starting with a
    // different one (Between the Moves, Solving for Smiles, The Quick Answer); the Winning Wink for the winners, then the
    // lobby tune again. The tunes all sit at the same level, under the room's voices; the moments ("next riddle", "every
    // 5 questions", "correct", "wrong", "time's up") come 2 dB over them, so the tune only dips a little under them.
    eLobby: ["e-lobby.mp3", 0.309, { stream: true, tail: 0.8, xf: 3 }],
    eP1: ["e-play1.mp3", 0.295, { stream: true, tail: 0.8, xf: 4 }],
    eP2: ["e-play2.mp3", 0.295, { stream: true, tail: 0.8, xf: 4 }],
    eP3: ["e-play3.mp3", 0.305, { stream: true, tail: 0.8, xf: 4 }],
    ePlayA: ["", 1, { list: ["eP1", "eP2", "eP3"], xf: 5 }],
    ePlayB: ["", 1, { list: ["eP2", "eP3", "eP1"], xf: 5 }],
    ePlayC: ["", 1, { list: ["eP3", "eP1", "eP2"], xf: 5 }],
    eWin: ["e-win.mp3", 0.389, { stream: true, once: true, then: "eLobby", tail: 0.8 }],
    eNext: ["e-next.mp3", 0.422],
    eEvery5: ["e-every5.mp3", 0.372],
    eCorrect: ["e-correct.mp3", 0.394],
    eWrong: ["e-wrong.mp3", 0.389],
    eTimesup: ["e-timesup.mp3", 0.582],
    // Where in the World?'s own: the lobby tune, three tunes for the rounds (a different order each game), the winner's,
    // and its next round, time's up and a pin that's far away (each as loud as the others, measured)
    wvLobby: ["wv-lobby.mp3", 0.313, { stream: true, tail: 0.8, xf: 3 }],
    wvP1: ["wv-play1.mp3", 0.292, { stream: true, tail: 0.8, xf: 4 }],
    wvP2: ["wv-play2.mp3", 0.299, { stream: true, tail: 0.8, xf: 4 }],
    wvP3: ["wv-play3.mp3", 0.272, { stream: true, tail: 0.8, xf: 4 }],
    wvPlayA: ["", 1, { list: ["wvP1", "wvP2", "wvP3"], xf: 5 }],
    wvPlayB: ["", 1, { list: ["wvP2", "wvP3", "wvP1"], xf: 5 }],
    wvPlayC: ["", 1, { list: ["wvP3", "wvP1", "wvP2"], xf: 5 }],
    wvWin: ["wv-win.mp3", 0.389, { stream: true, once: true, then: "wvLobby", tail: 0.8 }],
    wvNext: ["wv-next.mp3", 0.343],
    wvTimesup: ["wv-timesup.mp3", 0.596],
    wvWrong: ["wv-wrong.mp3", 0.442],
    // Boo Who?'s own: Ready for Round One in the lobby; One Clue Too Many, Tiptoeing Through Trophies and Winning Hand
    // taking turns all game long (a different one first each game); the High Score Confetti theme for the winners, then
    // the lobby tune again; and its next question, every 5 questions and time's up. Measured, so each sits where the
    // other games' do: the tunes under the room's voices, the moments 2 dB over them.
    bwLobby: ["bw-lobby.mp3", 0.302, { stream: true, tail: 1.6, xf: 3 }],
    bwP1: ["bw-play1.mp3", 0.339, { stream: true, tail: 1.8, xf: 4 }],
    bwP2: ["bw-play2.mp3", 0.324, { stream: true, tail: 2.2, xf: 4 }],
    bwP3: ["bw-play3.mp3", 0.327, { stream: true, tail: 1.5, xf: 4 }],
    bwPlayA: ["", 1, { list: ["bwP1", "bwP2", "bwP3"], xf: 5 }],
    bwPlayB: ["", 1, { list: ["bwP2", "bwP3", "bwP1"], xf: 5 }],
    bwPlayC: ["", 1, { list: ["bwP3", "bwP1", "bwP2"], xf: 5 }],
    bwWin: ["bw-win.mp3", 0.389, { stream: true, once: true, then: "bwLobby", tail: 2.6 }],
    bwNext: ["bw-next.mp3", 0.442],
    bwEvery5: ["bw-every5.mp3", 0.367],
    bwTimesup: ["bw-timesup.mp3", 0.556]
  };
  const isStream = (f) => !!(f && f[2] && typeof f[2] === "object" && (f[2].stream || f[2].list));
  const KIND = {
    next: "next",
    eNext: "next",
    gNext: "next",
    iNext: "next",
    every5: "every5",
    eEvery5: "every5",
    gEvery5: "every5",
    correct: "correct",
    eCorrect: "correct",
    gCorrect: "correct",
    wrong: "wrong",
    eWrong: "wrong",
    gWrong: "wrong",
    timesup: "timesup",
    eTimesup: "timesup",
    gTimesup: "timesup",
    tick: "tick",
    gTick: "tick",
    win: "win",
    eWin: "win",
    gWin: "win",
    wvNext: "next",
    wvTimesup: "timesup",
    wvWrong: "wrong",
    wvWin: "win",
    bwNext: "next",
    bwEvery5: "every5",
    bwTimesup: "timesup",
    bwWin: "win"
  };
  const kindOf = (name) => KIND[name] || (FILES[name] && FILES[name][2] ? "music" : "fx");
  let offKinds = /* @__PURE__ */ new Set(), wantReal = null;
  try {
    const v = JSON.parse(localStorage.getItem("bvplay:soundoff") || "[]");
    if (Array.isArray(v)) offKinds = new Set(v.filter((x) => typeof x === "string"));
  } catch (e) {
  }
  const isOff = (name) => offKinds.has(kindOf(name));
  let ac = null, master = null, on = true, bed = null, want = null, wantOpts = {};
  let musicBus = null, fxBus = null, vols = { music: 1, fx: 1 }, pausedNow = false, held = [];
  try {
    const v = JSON.parse(localStorage.getItem("bvplay:vol") || "null");
    if (v) {
      for (const k of ["music", "fx"]) if (+v[k] >= 0 && +v[k] <= 1) vols[k] = +v[k];
    }
  } catch (e) {
  }
  const bufs = /* @__PURE__ */ new Map(), loading = /* @__PURE__ */ new Map(), stings = /* @__PURE__ */ new Set(), subs = /* @__PURE__ */ new Set();
  try {
    on = localStorage.getItem("bvplay:sound") !== "off";
  } catch (e) {
  }
  const changed = () => {
    for (const f of subs) {
      try {
        f();
      } catch (e) {
      }
    }
  };
  function ctx() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ac = new AC();
      master = ac.createGain();
      master.gain.value = on ? 1 : 0;
      master.connect(ac.destination);
      musicBus = ac.createGain();
      musicBus.gain.value = vols.music;
      musicBus.connect(master);
      fxBus = ac.createGain();
      fxBus.gain.value = vols.fx;
      fxBus.connect(master);
      ac.onstatechange = () => {
        changed();
        if (ac.state === "running" && want && !bed) startBed();
      };
    } catch (e) {
      ac = null;
    }
    return ac;
  }
  const ready = () => !!(ac && ac.state === "running" && !pausedNow);
  function load(name) {
    if (bufs.has(name)) return Promise.resolve(bufs.get(name));
    if (loading.has(name)) return loading.get(name);
    const c = ctx(), f = FILES[name];
    if (!c || !f || isStream(f)) return Promise.resolve(null);
    const p = fetch(BASE + f[0], { credentials: "omit" }).then((r) => r.ok ? r.arrayBuffer() : Promise.reject(new Error("load"))).then((ab) => new Promise((res, rej) => {
      const d = c.decodeAudioData(ab, res, rej);
      if (d && d.then) d.then(res, rej);
    })).then((b) => {
      bufs.set(name, b);
      return b;
    }).catch(() => {
      loading.delete(name);
      return null;
    });
    loading.set(name, p);
    return p;
  }
  function preload(names) {
    for (const n of [].concat(names || [])) if (FILES[n]) load(n);
  }
  function unlock() {
    if (pausedNow) return;
    const c = ctx();
    if (c && c.state !== "running") c.resume().then(changed, () => {
    });
    prime();
  }
  const onGesture = (e) => {
    const t = e && e.target;
    if (t && t.closest && t.closest("[data-snd]")) return;
    unlock();
  };
  for (const e of ["pointerdown", "keydown", "touchstart"]) addEventListener(e, onGesture, { passive: true, capture: true });
  setTimeout(unlock, 0);
  function fadeStop(node, t) {
    node.dead = true;
    clearTimeout(node.timer);
    if (!ac) return;
    const now = ac.currentTime, d = Math.max(0.03, t);
    try {
      node.g.gain.cancelScheduledValues(now);
      node.g.gain.setValueAtTime(node.g.gain.value, now);
      node.g.gain.linearRampToValueAtTime(0, now + d);
    } catch (e) {
    }
    for (const s of node.srcs) {
      try {
        s.stop(now + d + 0.05);
      } catch (e) {
      }
    }
    setTimeout(() => {
      if (node.els) for (const e of node.els) freeEl(e);
      try {
        node.g.disconnect();
      } catch (e) {
      }
    }, (d + 0.4) * 1e3);
  }
  const pool = [];
  function poolEl() {
    let e = pool.find((x) => !x.busy);
    if (!e) {
      if (pool.length >= 4 || !ac) return null;
      const a = new Audio();
      a.preload = "auto";
      let src = null;
      try {
        src = ac.createMediaElementSource(a);
      } catch (er) {
        return null;
      }
      const g = ac.createGain();
      src.connect(g);
      e = { a, src, g, busy: false };
      pool.push(e);
    }
    e.busy = true;
    return e;
  }
  function freeEl(e) {
    if (!e.busy) return;
    e.busy = false;
    try {
      e.a.pause();
    } catch (er) {
    }
    try {
      e.g.disconnect();
    } catch (er) {
    }
  }
  const HUSH = "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";
  function prime() {
    if (!ac || pool.length >= 4) return;
    const mine = [];
    while (pool.length < 4) {
      const e = poolEl();
      if (!e) break;
      mine.push(e);
    }
    for (const e of mine) {
      try {
        e.a.src = HUSH;
        const p = e.a.play();
        if (p && p.catch) p.catch(() => {
        });
      } catch (er) {
      }
      freeEl(e);
    }
  }
  function startStream(name, o) {
    const L = FILES[name][2], order = L.list || [name];
    const g = ac.createGain();
    g.connect(musicBus || master);
    const vol = o.vol != null ? o.vol : 1;
    const now = ac.currentTime, t0 = now + (o.delay || 0) + 0.03, fin = o.fadeIn != null ? o.fadeIn : 0.8;
    g.gain.setValueAtTime(0, now);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + Math.max(0.03, fin));
    const node = { name, g, srcs: /* @__PURE__ */ new Set(), els: /* @__PURE__ */ new Set(), timer: 0, dead: false, full: vol };
    let k = 0;
    const one = (fadeIn) => {
      if (node.dead) return;
      const key = order[k % order.length];
      k++;
      const tf = FILES[key];
      const e = tf && poolEl();
      if (!e) return;
      node.els.add(e);
      e.g.connect(g);
      const xf = L.xf || tf[2].xf || 3, lv = tf[1], tail = tf[2].tail || 0;
      const t = ac.currentTime;
      e.g.gain.cancelScheduledValues(t);
      e.g.gain.setValueAtTime(fadeIn ? 0 : lv, t);
      if (fadeIn) e.g.gain.linearRampToValueAtTime(lv, t + xf);
      try {
        e.a.src = BASE + tf[0];
        e.a.currentTime = 0;
      } catch (er) {
      }
      const p = e.a.play();
      if (p && p.catch) p.catch(() => {
      });
      let handed = false;
      const hand = () => {
        if (handed) return;
        handed = true;
        if (L.once) {
          done();
          return;
        }
        one(true);
      };
      const done = () => {
        const mine = bed === node;
        fadeStop(node, 1.2);
        if (mine) {
          bed = null;
          if (L.then && want === name) music(L.then, { fadeIn: 2.5 });
        }
      };
      node.el = e;
      const watch = () => {
        if (node.dead || !e.busy || !node.els.has(e)) return;
        const d = e.a.duration;
        if (L.once) {
          if (e.a.ended || e.a.error || isFinite(d) && d > 2 && e.a.currentTime >= d - tail) {
            hand();
            return;
          }
          node.timer = setTimeout(watch, 200);
          return;
        }
        if (isFinite(d) && d > xf + tail + 1 && e.a.currentTime >= d - tail - xf) {
          hand();
          const t2 = ac.currentTime;
          e.g.gain.cancelScheduledValues(t2);
          e.g.gain.setValueAtTime(e.g.gain.value, t2);
          e.g.gain.linearRampToValueAtTime(0, t2 + xf);
          setTimeout(() => {
            node.els.delete(e);
            freeEl(e);
          }, (xf + 0.4) * 1e3);
          return;
        }
        if (e.a.ended || e.a.error) {
          node.els.delete(e);
          freeEl(e);
          hand();
          return;
        }
        node.timer = setTimeout(watch, 200);
      };
      node.timer = setTimeout(watch, 300);
    };
    if (o.delay > 0) node.timer = setTimeout(() => one(false), o.delay * 1e3);
    else one(false);
    bed = node;
  }
  function at(name, sec) {
    const t0 = performance.now();
    return new Promise((res) => {
      let seen = false;
      const tick = () => {
        const e = bed && bed.name === name && bed.el;
        const a = e && e.busy ? e.a : null;
        if (a && !a.paused && a.currentTime > 0) {
          seen = true;
          if (a.currentTime >= sec) return res();
        } else if (!seen && performance.now() - t0 > sec * 1e3 + 1200) return res();
        else if (seen && !(bed && bed.name === name)) return res();
        setTimeout(tick, 25);
      };
      tick();
    });
  }
  function duck(node, lv, dur) {
    if (!node || node.dead || !ac) return;
    const g = node.g.gain, now = ac.currentTime, full = node.full != null ? node.full : g.value;
    try {
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(full * lv, now + 0.18);
      g.setValueAtTime(full * lv, now + Math.max(0.2, dur - 0.35));
      g.linearRampToValueAtTime(full, now + Math.max(0.2, dur - 0.35) + 0.9);
    } catch (e) {
    }
  }
  function music(name, o = {}) {
    wantReal = FILES[name] ? name : null;
    let n = wantReal;
    if (n && isOff(n)) {
      const f = FILES[n][2];
      n = f && f.then && !isOff(f.then) ? f.then : null;
    }
    want = n;
    wantOpts = o;
    if (bed && bed.name === want) return;
    if (bed) {
      fadeStop(bed, o.fadeOut != null ? o.fadeOut : 0.8);
      bed = null;
    }
    if (want) startBed();
  }
  function startBed() {
    return __async(this, null, function* () {
      const name = want, o = wantOpts || {};
      if (!name || !ready()) return;
      if (isStream(FILES[name])) {
        if (!(bed && bed.name === name)) startStream(name, o);
        return;
      }
      const b = yield load(name);
      if (!b || want !== name || bed && bed.name === name || !ready()) return;
      const f = FILES[name];
      const g = ac.createGain();
      g.connect(musicBus || master);
      const now = ac.currentTime, t0 = now + (o.delay || 0) + 0.03, fin = o.fadeIn != null ? o.fadeIn : 0.8;
      g.gain.setValueAtTime(0, now);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(f[1] * (o.vol != null ? o.vol : 1), t0 + Math.max(0.03, fin));
      const node = { name, g, srcs: /* @__PURE__ */ new Set(), timer: 0, dead: false, full: f[1] * (o.vol != null ? o.vol : 1) };
      if (f[2] === "loop") {
        const s = ac.createBufferSource();
        s.buffer = b;
        s.loop = true;
        s.connect(g);
        s.start(t0);
        node.srcs.add(s);
      } else {
        const L = f[2], len = b.duration - L.skip - L.tail;
        let at2 = t0, first = true;
        const pass = () => {
          if (node.dead) return;
          const ig = ac.createGain();
          ig.connect(g);
          const s = ac.createBufferSource();
          s.buffer = b;
          s.connect(ig);
          if (!first) {
            ig.gain.setValueAtTime(0, at2);
            ig.gain.linearRampToValueAtTime(1, at2 + L.xf);
          }
          const end = at2 + len;
          ig.gain.setValueAtTime(1, end - L.xf);
          ig.gain.linearRampToValueAtTime(0, end);
          s.start(at2, L.skip, len + 0.02);
          node.srcs.add(s);
          s.onended = () => {
            node.srcs.delete(s);
            try {
              ig.disconnect();
            } catch (e) {
            }
          };
          first = false;
          at2 = end - L.xf;
          node.timer = setTimeout(pass, Math.max(0, (at2 - ac.currentTime - 1.5) * 1e3));
        };
        pass();
      }
      bed = node;
    });
  }
  function sting(name, o = {}) {
    if (!FILES[name] || !ready() || isOff(name)) return;
    const b = bufs.get(name);
    if (!b) {
      load(name);
      return;
    }
    for (const x of stings) fadeStop(x, 0.3);
    stings.clear();
    if (o.duck && bed) duck(bed, o.duck, b.duration + (o.delay || 0));
    const g = ac.createGain();
    g.gain.value = FILES[name][1] * (o.vol != null ? o.vol : 1);
    g.connect(fxBus || master);
    const s = ac.createBufferSource();
    s.buffer = b;
    s.connect(g);
    const node = { name, g, srcs: /* @__PURE__ */ new Set([s]), timer: 0, dead: false };
    s.onended = () => {
      stings.delete(node);
      try {
        g.disconnect();
      } catch (e) {
      }
    };
    s.start(ac.currentTime + (o.delay || 0));
    stings.add(node);
  }
  const fxs = /* @__PURE__ */ new Set();
  function fx(name, o = {}) {
    if (!FILES[name] || !ready() || isOff(name)) return;
    const b = bufs.get(name);
    if (!b) {
      load(name);
      return;
    }
    if (fxs.size > 10) return;
    if (o.duck && bed) duck(bed, o.duck, b.duration + (o.delay || 0));
    const g = ac.createGain();
    g.gain.value = FILES[name][1] * (o.vol != null ? o.vol : 1);
    g.connect(fxBus || master);
    const s = ac.createBufferSource();
    s.buffer = b;
    s.connect(g);
    if (o.rate) s.playbackRate.value = Math.max(0.5, Math.min(2, +o.rate || 1));
    fxs.add(s);
    s.onended = () => {
      fxs.delete(s);
      try {
        g.disconnect();
      } catch (e) {
      }
    };
    s.start(ac.currentTime + (o.delay || 0));
  }
  function setOn(v) {
    on = !!v;
    try {
      localStorage.setItem("bvplay:sound", on ? "on" : "off");
    } catch (e) {
    }
    if (master && ac) {
      const now = ac.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(on ? 1 : 0, now + 0.3);
    }
    if (on && want && !bed) startBed();
    changed();
  }
  function setOff(list) {
    offKinds = new Set([].concat(list || []).filter((x) => typeof x === "string"));
    try {
      localStorage.setItem("bvplay:soundoff", JSON.stringify([...offKinds]));
    } catch (e) {
    }
    if (wantReal) {
      const w = wantReal, o = wantOpts;
      if (bed && isOff(bed.name)) {
        fadeStop(bed, 0.6);
        bed = null;
      }
      want = null;
      music(w, Object.assign({}, o, { delay: 0, fadeIn: 1 }));
    }
  }
  function setVol(kind, v) {
    if (!(kind in vols)) return;
    vols[kind] = Math.max(0, Math.min(1, +v || 0));
    try {
      localStorage.setItem("bvplay:vol", JSON.stringify(vols));
    } catch (e) {
    }
    const bus = kind === "music" ? musicBus : fxBus;
    if (bus && ac) {
      const now = ac.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(vols[kind], now + 0.25);
    }
  }
  function pause() {
    if (pausedNow) return;
    pausedNow = true;
    held = pool.filter((e) => e.busy && !e.a.paused);
    for (const e of held) {
      try {
        e.a.pause();
      } catch (er) {
      }
    }
    try {
      if (ac && ac.state === "running") ac.suspend().catch(() => {
      });
    } catch (e) {
    }
  }
  function resume() {
    if (!pausedNow) return;
    pausedNow = false;
    try {
      if (ac && ac.state !== "running") ac.resume().then(changed, () => {
      });
    } catch (e) {
    }
    for (const e of held) {
      if (!e.busy) continue;
      try {
        const p = e.a.play();
        if (p && p.catch) p.catch(() => {
        });
      } catch (er) {
      }
    }
    held = [];
  }
  const state = () => !ctx() ? "none" : !on ? "off" : ready() || pausedNow ? "on" : "locked";
  return {
    preload,
    music,
    sting,
    fx,
    at,
    unlock,
    setOn,
    enabled: () => on,
    state,
    onChange: (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    setOff,
    offKinds: () => [...offKinds],
    kindOf,
    kindOff: (k) => offKinds.has(k),
    setVol,
    vol: (k) => k in vols ? vols[k] : 1,
    pause,
    resume,
    isPaused: () => pausedNow
  };
})();
