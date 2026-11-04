// Blokvane party games: the music and sound effects on the TV (Trivia's game-show sounds: the lobby tune, a tune for
// the first, middle and last third of the questions and one for the last two, a tune between questions, "next
// question" and "every 5 questions" before a question, "correct" and "wrong" before the answer shows, "time's up" and
// the winner). They play with the Web Audio API, so
// they fade in and out smoothly, loop without a gap and never pile up on each other. A browser keeps a page quiet
// until someone clicks or presses a key on it once: until then the lobby shows a "Click for sound" button, and the
// same button turns the sound off (or on again) on this screen. The phones stay quiet.
var BVSOUND = (() => {
  'use strict';
  const BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^/]*$/, '') + 'sounds/';
  // name: [file, volume, how it loops]. The volumes even out how loud each one was made: the tunes sit under the room's
  // voices, the moments come on top. Tunes made to loop just loop; the medium and hard ones fade in and out by
  // themselves, so each pass overlaps the next for a moment.
  const FILES = {
    theme: ['theme.mp3', 0.42, 'loop'],
    easy: ['q-easy.mp3', 0.46, 'loop'],
    medium: ['q-medium.mp3', 0.5, { skip: 0.62, tail: 0.25, xf: 1.6 }],
    hard: ['q-hard.mp3', 0.5, { skip: 0.38, tail: 0.25, xf: 1.6 }],
    last2: ['last2.mp3', 0.8, { skip: 0, tail: 0.3, xf: 2 }],
    between: ['between.mp3', 0.4, { skip: 0.1, tail: 0.3, xf: 0.9 }],
    next: ['next.mp3', 0.61],
    every5: ['every5.mp3', 0.86],
    correct: ['correct.mp3', 0.66],
    wrong: ['wrong.mp3', 0.69],
    timesup: ['times-up.mp3', 0.85],
    win: ['win.mp3', 0.7],
    // Where in the World?'s own effects (several can sound at once: see fx below)
    whoosh: ['w-whoosh.mp3', 0.46], plane: ['w-plane.mp3', 0.6], ping: ['w-ping.mp3', 0.55], stamp: ['w-stamp.mp3', 0.9], shutter: ['w-shutter.mp3', 0.94],
    static: ['w-static.mp3', 0.62], neon: ['w-neon.mp3', 0.67], print: ['w-print.mp3', 0.68], spot: ['w-spot.mp3', 0.85], sparkle: ['w-sparkle.mp3', 0.51],
    flip: ['w-flip.mp3', 0.85], flutter: ['w-flutter.mp3', 0.56], pop: ['w-pop.mp3', 0.6], tick: ['w-tick.mp3', 0.9], hint: ['w-hint.mp3', 0.5],
    drumroll: ['w-drumroll.mp3', 0.57], land: ['w-land.mp3', 0.65], zip: ['w-zip.mp3', 0.53], bull: ['w-bull.mp3', 0.6], globe: ['w-globe.mp3', 0.63],
    focus: ['w-focus.mp3', 0.6], coin: ['w-coin.mp3', 0.66],
    // Guess It Right!: its tunes are a few minutes long each, so they stream (an <audio> element feeding the same mixer)
    // instead of sitting in memory whole. tail: the quiet seconds at the end; xf: how long one fades into the next. Its
    // game tune is a list: the Staircase of the Golden Snake and the Chambers of the Silent King, one after the other,
    // round and round, each fading into the next.
    gTheme: ['g-theme.mp3', 0.28, { stream: true, tail: 1.9, xf: 4 }],
    gAfter: ['g-after.mp3', 0.31, { stream: true, tail: 1.2, xf: 4 }],
    gSnake: ['g-snake.mp3', 0.285, { stream: true, tail: 0.3, xf: 4 }],
    gPlay: ['', 1, { list: ['gSnake', 'gAfter'], xf: 6 }],
    gNext: ['g-next.mp3', 0.61], gEvery5: ['g-every5.mp3', 0.76], gCorrect: ['g-correct.mp3', 0.82], gWrong: ['g-wrong.mp3', 0.86],
    gTimesup: ['g-timesup.mp3', 0.79], gWin: ['g-win.mp3', 0.88], gSpin: ['g-spin.mp3', 1], gLand: ['g-land.mp3', 1], gTick: ['g-tick.mp3', 0.9]
  };
  const isStream = f => !!(f && f[2] && typeof f[2] === 'object' && (f[2].stream || f[2].list));
  let ac = null, master = null, on = true, bed = null, want = null, wantOpts = {};
  const bufs = new Map(), loading = new Map(), stings = new Set(), subs = new Set();
  try { on = localStorage.getItem('bvplay:sound') !== 'off'; } catch (e) {}
  const changed = () => { for (const f of subs) { try { f(); } catch (e) {} } };
  function ctx() {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ac = new AC();
      master = ac.createGain();
      master.gain.value = on ? 1 : 0;
      master.connect(ac.destination);
      ac.onstatechange = () => { changed(); if (ac.state === 'running' && want && !bed) startBed(); };
    } catch (e) { ac = null; }
    return ac;
  }
  const ready = () => !!(ac && ac.state === 'running');
  function load(name) {
    if (bufs.has(name)) return Promise.resolve(bufs.get(name));
    if (loading.has(name)) return loading.get(name);
    const c = ctx(), f = FILES[name];
    if (!c || !f || isStream(f)) return Promise.resolve(null);
    const p = fetch(BASE + f[0], { credentials: 'omit' })
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('load'))))
      .then(ab => new Promise((res, rej) => { const d = c.decodeAudioData(ab, res, rej); if (d && d.then) d.then(res, rej); }))
      .then(b => { bufs.set(name, b); return b; })
      .catch(() => { loading.delete(name); return null; });
    loading.set(name, p);
    return p;
  }
  function preload(names) { for (const n of [].concat(names || [])) if (FILES[n]) load(n); }
  // (the first click or key press on this page lets it play sound; a TV remote's OK button counts too. The sound
  // button itself is left to do its own job, so that first click doesn't turn the sound off again.)
  function unlock() { const c = ctx(); if (c && c.state !== 'running') c.resume().then(changed, () => {}); prime(); }
  const onGesture = e => { const t = e && e.target; if (t && t.closest && t.closest('[data-snd]')) return; unlock(); };
  for (const e of ['pointerdown', 'keydown', 'touchstart']) addEventListener(e, onGesture, { passive: true, capture: true });
  // (where sound is allowed right away, like the game opened from Blokvane on a computer, it simply starts)
  setTimeout(unlock, 0);

  function fadeStop(node, t) {
    node.dead = true;
    clearTimeout(node.timer);
    if (!ac) return;
    const now = ac.currentTime, d = Math.max(0.03, t);
    try { node.g.gain.cancelScheduledValues(now); node.g.gain.setValueAtTime(node.g.gain.value, now); node.g.gain.linearRampToValueAtTime(0, now + d); } catch (e) {}
    for (const s of node.srcs) { try { s.stop(now + d + 0.05); } catch (e) {} }
    setTimeout(() => { if (node.els) for (const e of node.els) freeEl(e); try { node.g.disconnect(); } catch (e) {} }, (d + 0.4) * 1000);
  }
  // ---------- the streamed tunes ----------
  // (a few <audio> players, each wired into the mixer once; two play at a time while one tune fades into the next)
  const pool = [];
  function poolEl() {
    let e = pool.find(x => !x.busy);
    if (!e) {
      if (pool.length >= 4 || !ac) return null;
      const a = new Audio();
      a.preload = 'auto';
      let src = null;
      try { src = ac.createMediaElementSource(a); } catch (er) { return null; }
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
    try { e.a.pause(); } catch (er) {}
    try { e.g.disconnect(); } catch (er) {}
  }
  // (during a first press: each player plays a moment of nothing, so it may play a tune later without one)
  const HUSH = 'data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA';
  function prime() {
    if (!ac || pool.length >= 4) return;
    const mine = [];
    while (pool.length < 4) { const e = poolEl(); if (!e) break; mine.push(e); }
    for (const e of mine) { try { e.a.src = HUSH; const p = e.a.play(); if (p && p.catch) p.catch(() => {}); } catch (er) {} freeEl(e); }
  }
  function startStream(name, o) {
    const L = FILES[name][2], order = L.list || [name];
    const g = ac.createGain();
    g.connect(master);
    const vol = o.vol != null ? o.vol : 1;
    const now = ac.currentTime, t0 = now + (o.delay || 0) + 0.03, fin = o.fadeIn != null ? o.fadeIn : 0.8;
    g.gain.setValueAtTime(0, now);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + Math.max(0.03, fin));
    const node = { name, g, srcs: new Set(), els: new Set(), timer: 0, dead: false, full: vol };
    let k = 0;
    // one tune of the list: it plays, and a few seconds before its end the next one fades in over it
    const one = fadeIn => {
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
      try { e.a.src = BASE + tf[0]; e.a.currentTime = 0; } catch (er) {}
      const p = e.a.play();
      if (p && p.catch) p.catch(() => {});
      let handed = false;
      const hand = () => { if (handed) return; handed = true; one(true); };
      const watch = () => {
        if (node.dead || !e.busy || !node.els.has(e)) return;
        const d = e.a.duration;
        if (isFinite(d) && d > xf + tail + 1 && e.a.currentTime >= d - tail - xf) {
          hand();
          const t2 = ac.currentTime;
          e.g.gain.cancelScheduledValues(t2); e.g.gain.setValueAtTime(e.g.gain.value, t2); e.g.gain.linearRampToValueAtTime(0, t2 + xf);
          setTimeout(() => { node.els.delete(e); freeEl(e); }, (xf + 0.4) * 1000);
          return;
        }
        // (a tune that stopped short, or couldn't load: the next one starts)
        if (e.a.ended || e.a.error) { node.els.delete(e); freeEl(e); hand(); return; }
        node.timer = setTimeout(watch, 200);
      };
      node.timer = setTimeout(watch, 300);
    };
    // (after a delay, like after the winner's fanfare: the tune starts from its beginning when it's heard)
    if (o.delay > 0) node.timer = setTimeout(() => one(false), o.delay * 1000); else one(false);
    bed = node;
  }
  // the tune steps back while a moment plays over it, then comes back up (lv: how loud it stays, 0..1)
  function duck(node, lv, dur) {
    if (!node || node.dead || !ac) return;
    const g = node.g.gain, now = ac.currentTime, full = node.full != null ? node.full : g.value;
    try {
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(full * lv, now + 0.18);
      g.setValueAtTime(full * lv, now + Math.max(0.2, dur - 0.35));
      g.linearRampToValueAtTime(full, now + Math.max(0.2, dur - 0.35) + 0.9);
    } catch (e) {}
  }
  // a tune that keeps playing until another one starts, or music(null) fades it out.
  // o: { delay (s), fadeIn (s), fadeOut (s, for the one it replaces), vol (0..1) }
  function music(name, o = {}) {
    want = FILES[name] ? name : null;
    wantOpts = o;
    if (bed && bed.name === want) return;
    if (bed) { fadeStop(bed, o.fadeOut != null ? o.fadeOut : 0.8); bed = null; }
    if (want) startBed();
  }
  async function startBed() {
    const name = want, o = wantOpts || {};
    if (!name || !ready()) return;
    if (isStream(FILES[name])) { if (!(bed && bed.name === name)) startStream(name, o); return; }
    const b = await load(name);
    if (!b || want !== name || (bed && bed.name === name) || !ready()) return;
    const f = FILES[name];
    const g = ac.createGain();
    g.connect(master);
    const now = ac.currentTime, t0 = now + (o.delay || 0) + 0.03, fin = o.fadeIn != null ? o.fadeIn : 0.8;
    g.gain.setValueAtTime(0, now);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(f[1] * (o.vol != null ? o.vol : 1), t0 + Math.max(0.03, fin));
    const node = { name, g, srcs: new Set(), timer: 0, dead: false, full: f[1] * (o.vol != null ? o.vol : 1) };
    if (f[2] === 'loop') {
      const s = ac.createBufferSource();
      s.buffer = b; s.loop = true; s.connect(g); s.start(t0);
      node.srcs.add(s);
    } else {
      // (each pass fades into the next one)
      const L = f[2], len = b.duration - L.skip - L.tail;
      let at = t0, first = true;
      const pass = () => {
        if (node.dead) return;
        const ig = ac.createGain();
        ig.connect(g);
        const s = ac.createBufferSource();
        s.buffer = b; s.connect(ig);
        if (!first) { ig.gain.setValueAtTime(0, at); ig.gain.linearRampToValueAtTime(1, at + L.xf); }
        const end = at + len;
        ig.gain.setValueAtTime(1, end - L.xf);
        ig.gain.linearRampToValueAtTime(0, end);
        s.start(at, L.skip, len + 0.02);
        node.srcs.add(s);
        s.onended = () => { node.srcs.delete(s); try { ig.disconnect(); } catch (e) {} };
        first = false;
        at = end - L.xf;
        node.timer = setTimeout(pass, Math.max(0, (at - ac.currentTime - 1.5) * 1000));
      };
      pass();
    }
    bed = node;
  }
  // a short moment (next question, time's up, the winner). The one before fades out, so they never pile up; one that
  // hasn't loaded yet is skipped rather than played late. o: { delay (s), vol (0..1), duck (0..1: the tune keeps
  // playing under it, this much softer, and comes back up after) }
  function sting(name, o = {}) {
    if (!FILES[name] || !ready()) return;
    const b = bufs.get(name);
    if (!b) { load(name); return; }
    for (const x of stings) fadeStop(x, 0.3);
    stings.clear();
    if (o.duck && bed) duck(bed, o.duck, b.duration + (o.delay || 0));
    const g = ac.createGain();
    g.gain.value = FILES[name][1] * (o.vol != null ? o.vol : 1);
    g.connect(master);
    const s = ac.createBufferSource();
    s.buffer = b; s.connect(g);
    const node = { name, g, srcs: new Set([s]), timer: 0, dead: false };
    s.onended = () => { stings.delete(node); try { g.disconnect(); } catch (e) {} };
    s.start(ac.currentTime + (o.delay || 0));
    stings.add(node);
  }
  // a little sound that may overlap others (a pin landing, a tick, a stamp): it doesn't stop what's playing.
  // o: { delay (s), vol (0..1), rate (speed: 1.2 is higher) }. One that hasn't loaded yet is skipped.
  const fxs = new Set();
  function fx(name, o = {}) {
    if (!FILES[name] || !ready()) return;
    const b = bufs.get(name);
    if (!b) { load(name); return; }
    if (fxs.size > 10) return;
    if (o.duck && bed) duck(bed, o.duck, b.duration + (o.delay || 0));
    const g = ac.createGain();
    g.gain.value = FILES[name][1] * (o.vol != null ? o.vol : 1);
    g.connect(master);
    const s = ac.createBufferSource();
    s.buffer = b; s.connect(g);
    if (o.rate) s.playbackRate.value = Math.max(0.5, Math.min(2, +o.rate || 1));
    fxs.add(s);
    s.onended = () => { fxs.delete(s); try { g.disconnect(); } catch (e) {} };
    s.start(ac.currentTime + (o.delay || 0));
  }
  // sound on or off on this screen (kept for next time)
  function setOn(v) {
    on = !!v;
    try { localStorage.setItem('bvplay:sound', on ? 'on' : 'off'); } catch (e) {}
    if (master && ac) { const now = ac.currentTime; master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now); master.gain.linearRampToValueAtTime(on ? 1 : 0, now + 0.3); }
    if (on && want && !bed) startBed();
    changed();
  }
  // 'on', 'off', 'locked' (waiting for a first click or key press) or 'none' (this browser can't play it)
  const state = () => (!ctx() ? 'none' : !on ? 'off' : ready() ? 'on' : 'locked');
  return { preload, music, sting, fx, unlock, setOn, enabled: () => on, state, onChange: f => { subs.add(f); return () => subs.delete(f); } };
})();
