// Blokvane party games: the music and sound effects on the TV (Trivia's game-show sounds: the lobby tune, a tune for
// easy, medium and hard questions, "next question", "time's up" and the winner). They play with the Web Audio API, so
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
    next: ['next.mp3', 0.78],
    timesup: ['times-up.mp3', 0.85],
    win: ['win.mp3', 0.7]
  };
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
    if (!c || !f) return Promise.resolve(null);
    const p = fetch(BASE + f[0], { credentials: 'omit' })
      .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('load'))))
      .then(ab => new Promise((res, rej) => { const d = c.decodeAudioData(ab, res, rej); if (d && d.then) d.then(res, rej); }))
      .then(b => { bufs.set(name, b); return b; })
      .catch(() => { loading.delete(name); return null; });
    loading.set(name, p);
    return p;
  }
  function preload(names) { for (const n of [].concat(names || [])) if (FILES[n]) load(n); }
  // (the first click or key press on this page lets it play sound; a TV remote's OK button counts too)
  function unlock() { const c = ctx(); if (c && c.state !== 'running') c.resume().then(changed, () => {}); }
  for (const e of ['pointerdown', 'keydown', 'touchstart']) addEventListener(e, unlock, { passive: true, capture: true });

  function fadeStop(node, t) {
    node.dead = true;
    clearTimeout(node.timer);
    if (!ac) return;
    const now = ac.currentTime, d = Math.max(0.03, t);
    try { node.g.gain.cancelScheduledValues(now); node.g.gain.setValueAtTime(node.g.gain.value, now); node.g.gain.linearRampToValueAtTime(0, now + d); } catch (e) {}
    for (const s of node.srcs) { try { s.stop(now + d + 0.05); } catch (e) {} }
    setTimeout(() => { try { node.g.disconnect(); } catch (e) {} }, (d + 0.4) * 1000);
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
    const b = await load(name);
    if (!b || want !== name || (bed && bed.name === name) || !ready()) return;
    const f = FILES[name];
    const g = ac.createGain();
    g.connect(master);
    const now = ac.currentTime, t0 = now + (o.delay || 0) + 0.03, fin = o.fadeIn != null ? o.fadeIn : 0.8;
    g.gain.setValueAtTime(0, now);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(f[1] * (o.vol != null ? o.vol : 1), t0 + Math.max(0.03, fin));
    const node = { name, g, srcs: new Set(), timer: 0, dead: false };
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
  // hasn't loaded yet is skipped rather than played late. o: { delay (s), vol (0..1) }
  function sting(name, o = {}) {
    if (!FILES[name] || !ready()) return;
    const b = bufs.get(name);
    if (!b) { load(name); return; }
    for (const x of stings) fadeStop(x, 0.3);
    stings.clear();
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
  return { preload, music, sting, unlock, setOn, enabled: () => on, state, onChange: f => { subs.add(f); return () => subs.delete(f); } };
})();
