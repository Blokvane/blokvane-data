// Blokvane party games: Dominoes 151 on a phone (../go/m/party.js loads this with dom-core.js when the game is on).
// The table is on the TV only: a phone never shows the chain. The phone holds its player's own tiles, in the game's own
// look, as big as they fit (upright or on its side), and plays them: a tap, or a drag up out of the hand. A tile that
// fits both ends asks which one: "Play on 6" or "Play on 0", to tap or to drop the tile on (only this player sees them).
// Above the tiles: the score with everyone's names and pictures, how many tiles each player holds, the round, and whose
// turn it is ("Your turn" in gold when it is yours), with the time left when the host set one, and quick reactions.
// The host's phone has more: the table's look with a live preview (also in the middle of a match), the computer
// players' names, colors and faces, the moves of the round in order, and Next round. Each phone shows all of it in its
// own language.
var BVDOMP = (() => {
  'use strict';
  const D = BVDOM, h = D.h, px = D.px, GOLD = D.GOLD, CREAM = D.CREAM, INK = D.INK, KUFI = D.KUFI, PLEX = D.PLEX;
  const T = (t, v) => D.t(t, v);
  let A = null;   // what party.js lends: el, send, G, view, buzz, toast, sheet, booUri, myPic, clean, setCtl, btn
  const X = { pub: null, me: null, sel: null, sent: null, drag: null, pv: 'look', lk: {}, ui: null, turnKey: '', syncAt: 0, rxAt: 0, logOpen: null, botT: 0, tiles: null, faceKey: '', k: 1 };
  const LOOK_KEYS = ['table', 'tiles', 'dealFx', 'endFx', 'lockFx', 'border'];
  const CSS = `
html.g-dom.pt-dark, html.g-dom.pt-dark body { background: #081717; }
html.g-dom.pt-dark .sw-sky { display: none; }
html.g-dom.pt-dark { --sw-sheet: #0a2b2d; --sw-cardline: rgba(243,234,214,.14); --sw-ghost: rgba(243,234,214,.06); --sw-ghostline: rgba(243,234,214,.2); --sw-card1: rgba(243,234,214,.08); --sw-card2: rgba(243,234,214,.03); --sw-field: rgba(0,0,0,.3); --sw-link: #deb866;
  --panel: #0d3033; --raise: #113a3d; --raise2: #17484b; --line: rgba(243,234,214,.14); --dk: rgba(243,234,214,.06); --dim: #bbd7d9; --faint: #86a9ab; --lav: #e6cf99; --sw-sub: #bbd7d9; }
html.g-dom.dmp-on .app { max-width: none; padding-bottom: calc(10px + var(--safe-b, 0px)); }
html.g-dom.dmp-on .pt-top { padding-bottom: 8px; }
html.g-dom.dmp-on .pt-top .who h1 { font-family: 'Reem Kufi', sans-serif; color: #deb866; }
@keyframes dmpTurn { 50% { box-shadow: 0 0 0 5px rgba(222,184,102,.3), 0 0 14px rgba(222,184,102,.6); } }
@keyframes dmpGlow { 50% { box-shadow: inset 0 0 0 2px #deb866, 0 0 30px rgba(222,184,102,.42); } }
@keyframes dmpNope { 0%, 100% { transform: none; } 20% { transform: translateX(-6px) rotate(-2deg); } 40% { transform: translateX(5px) rotate(2deg); } 60% { transform: translateX(-4px); } 80% { transform: translateX(3px); } }
@keyframes dmpIn { from { opacity: 0; transform: translateY(8px); } }
@keyframes dmpNudge { 30% { transform: scale(1.09); color: #deb866; } }
.dmp { position: relative; display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; max-width: 640px; margin: 0 auto; direction: ltr; font-family: 'IBM Plex Sans Arabic', sans-serif; color: #f3ead6; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
.dmp * { box-sizing: border-box; }
.dmp.land { flex-direction: row; max-width: 1180px; }
.dmp-l { flex: 1 1 0; min-width: 0; display: flex; flex-direction: column; justify-content: center; }
.dmp-r { flex: none; width: 54%; margin-left: 14px; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
.dmp .tb { flex: none; display: block; width: 9px; height: 16px; border-radius: 2.5px; background: linear-gradient(145deg, #fbf6ea, #efe5cd 55%, #d9cba9); box-shadow: inset 0 0 0 .5px rgba(150,125,80,.4), 0 1px 0 #a3916a, 0 2px 3px rgba(0,0,0,.5); }
.dmp-sb { flex: none; display: flex; align-items: stretch; }
.dmp-sb .sd { flex: 1 1 0; min-width: 0; border-radius: 16px; background: rgba(0,0,0,.3); box-shadow: inset 0 0 0 1px rgba(243,234,214,.16); padding: 6px 6px 8px; }
.dmp-sb .sd + .sd { margin-left: 8px; }
.dmp-sb .pl { display: flex; align-items: center; height: 36px; padding: 0 8px 0 4px; border-radius: 18px; }
.dmp-sb .pl + .pl { margin-top: 2px; }
.dmp-sb .pl.on { background: rgba(222,184,102,.2); box-shadow: inset 0 0 0 1.5px #deb866; }
.dmp-sb .av { box-shadow: 0 0 0 2px var(--rg, #2f7377); }
.dmp-sb .on > .av { box-shadow: 0 0 0 2.5px #deb866; animation: dmpTurn 1.1s ease-in-out infinite; }
.dmp-sb .x { flex: 1 1 auto; min-width: 0; margin: 0 8px; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; }
.dmp-sb .me .x { color: #deb866; }
.dmp-sb .away { opacity: .55; }
.dmp-sb .ps { flex: none; margin: 0 5px; padding: 0 6px; border-radius: 8px; background: #f3ead6; color: #1d1b18; font-weight: 600; font-size: 11px; line-height: 17px; white-space: nowrap; }
.dmp-sb .c { flex: none; display: flex; align-items: center; font-weight: 700; font-size: 13.5px; }
.dmp-sb .c .tb { margin-right: 5px; }
.dmp-sb .sc { display: flex; align-items: center; margin: 6px 6px 0; }
.dmp-sb .sc b { flex: none; font-family: 'Reem Kufi', sans-serif; font-weight: 700; font-size: 27px; line-height: 1; }
.dmp-sb .sc small { flex: none; margin: 5px 9px 0 5px; font-size: 12px; color: #bbd7d9; white-space: nowrap; }
.dmp-sb .bar { flex: 1; display: block; height: 5px; border-radius: 3px; background: #12484b; overflow: hidden; }
.dmp-sb .bar span { display: block; height: 5px; border-radius: 3px; transition: width .5s; }
.dmp-sb.col .sd { display: flex; flex-direction: column; align-items: center; padding: 9px 4px 8px; }
.dmp-sb.col .sd + .sd { margin-left: 6px; }
.dmp-sb.col .sd.on { background: rgba(222,184,102,.2); box-shadow: inset 0 0 0 1.5px #deb866; }
.dmp-sb.col .x { flex: none; max-width: 100%; margin: 6px 0 0; font-size: 13px; text-align: center; }
.dmp-sb.col .row { display: flex; align-items: center; justify-content: center; margin-top: 4px; min-height: 18px; }
.dmp-sb.col .sc { margin: 4px 0 0; flex-direction: column; align-self: stretch; }
.dmp-sb.col .sc b { font-size: 23px; }
.dmp-sb.col .bar { flex: none; width: 76%; margin-top: 5px; }
.dmp-rl { flex: none; display: flex; align-items: center; justify-content: space-between; min-height: 22px; margin-top: 7px; padding: 0 6px; font-size: 12.5px; color: #bbd7d9; }
.dmp-rl .pile { display: flex; align-items: center; color: #f3ead6; font-weight: 600; }
.dmp-rl .pile .tb { margin-right: 6px; }
.dmp-stage { position: relative; flex: 1 1 0; min-height: 96px; max-height: 430px; margin: 6px 0 8px; border-radius: 18px; background: rgba(0,0,0,.28); box-shadow: inset 0 0 0 1px rgba(243,234,214,.14); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 10px 12px 14px; overflow: hidden; }
.dmp-stage.mine { background: radial-gradient(ellipse at 50% 42%, rgba(222,184,102,.26), rgba(222,184,102,.07) 72%); box-shadow: inset 0 0 0 2px #deb866, 0 0 16px rgba(222,184,102,.2); animation: dmpGlow 1.6s ease-in-out infinite; }
.dmp-stage.new > * { animation: dmpIn .22s both; }
.dmp-stage .av { margin-bottom: 9px; box-shadow: 0 0 0 3px #deb866; animation: dmpTurn 1.1s ease-in-out infinite; }
.dmp-stage .k { font-size: 14px; color: #e6eeee; max-width: 100%; }
.dmp-stage .t { font-family: 'Reem Kufi', sans-serif; font-weight: 700; font-size: 22px; line-height: 1.25; max-width: 100%; }
.dmp-stage .t.nudge { animation: dmpNudge .45s; }
.dmp-stage.mine .t { font-size: 34px; color: #deb866; text-shadow: 0 2px 10px rgba(0,0,0,.45); }
.dmp-stage.res .t { font-size: 28px; color: #deb866; margin: 2px 0; }
.dmp-stage .d { margin-top: 4px; font-size: 14px; line-height: 1.35; color: #bbd7d9; max-width: 340px; }
.dmp-stage .c { margin-top: 2px; font-size: 14px; direction: ltr; }
.dmp-stage .dmp-btn { margin-top: 12px; }
.dmp-stage .dmp-note { margin-top: 10px; }
.dmp-stage.lg .t { font-size: 27px; }
.dmp-stage.lg.mine .t { font-size: 44px; }
.dmp-stage.lg.res .t { font-size: 36px; }
.dmp-stage.lg .d, .dmp-stage.lg .k, .dmp-stage.lg .c { font-size: 16px; }
.dmp-stage.lg .av { margin-bottom: 12px; }
.dmp-stage.sm { padding: 6px 10px 12px; }
.dmp-stage.sm .av { margin-bottom: 4px; }
.dmp-stage.sm .t { font-size: 19px; }
.dmp-stage.sm.mine .t { font-size: 25px; }
.dmp-stage.sm.res .t { font-size: 22px; }
.dmp-stage.sm .d, .dmp-stage.sm .k, .dmp-stage.sm .c { font-size: 13px; margin-top: 1px; }
.dmp-stage.sm .dmp-btn { margin-top: 6px; height: 38px; }
.dmp-stage.sm .dmp-note { margin-top: 4px; }
.dmp-stage.tg { padding: 10px 10px 14px; background: rgba(222,184,102,.07); box-shadow: inset 0 0 0 1px rgba(222,184,102,.45); }
.dmp-stage.win { box-shadow: inset 0 0 0 2px #deb866, 0 0 18px rgba(222,184,102,.25); background: radial-gradient(ellipse at 50% 42%, rgba(222,184,102,.2), rgba(222,184,102,.05) 72%); }
.dmp-tgs { flex: 1 1 0; min-height: 0; align-self: stretch; display: flex; align-items: center; justify-content: center; margin-top: 8px; }
.dmp-tg { flex: 1 1 0; min-width: 0; max-width: 210px; height: 100%; max-height: 176px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 6px; border-radius: 18px; border: 2px dashed rgba(222,184,102,.75); background: rgba(0,0,0,.26); color: #f3ead6; font: 600 16px 'IBM Plex Sans Arabic', sans-serif; transition: transform .12s, background .12s, border-color .12s, box-shadow .12s; -webkit-tap-highlight-color: transparent; }
.dmp-tg + .dmp-tg { margin-left: 12px; }
.dmp-tg > span { margin-top: 9px; }
.dmp-tg.row { flex-direction: row; max-width: 280px; max-height: 110px; }
.dmp-tg.row > span { margin: 0 0 0 12px; }
.dmp-tg.hot, .dmp-tg:active { border-style: solid; border-color: #deb866; background: rgba(222,184,102,.26); box-shadow: 0 0 0 4px rgba(222,184,102,.22), 0 0 26px rgba(222,184,102,.4); transform: scale(1.04); }
.dmp-tm { flex: none; height: 5px; border-radius: 3px; background: rgba(243,234,214,.16); overflow: hidden; }
.dmp-stage .dmp-tm { position: absolute; left: 14px; right: 14px; bottom: 6px; animation: none; }
.dmp-tm i { display: block; height: 5px; border-radius: 3px; background: #fff3bf; transform-origin: 0 50%; }
.dmp-btn { height: 46px; padding: 0 24px; border-radius: 23px; border: 0; background: #deb866; color: #1d1b18; font: 600 16px 'IBM Plex Sans Arabic', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,.45); }
.dmp-btn + .dmp-btn { margin-left: 12px; }
.dmp-btn:active { background: #f3ead6; }
.dmp-btn.ghost { background: transparent; color: #f3ead6; box-shadow: inset 0 0 0 1px rgba(243,234,214,.4); }
.dmp-note { font-size: 14px; color: #bbd7d9; text-align: center; }
.dmp-hd { position: relative; flex: none; margin-top: auto; touch-action: none; }
.dmp-tl { position: absolute; padding: 0; border: 0; background: none; touch-action: none; -webkit-tap-highlight-color: transparent; transition: left .26s cubic-bezier(.2,.8,.2,1), top .26s cubic-bezier(.2,.8,.2,1), transform .15s, opacity .15s; will-change: transform; }
.dmp-tl.drag { transition: none; z-index: 30; }
.dmp-tl.drag { -webkit-filter: drop-shadow(0 16px 12px rgba(0,0,0,.5)); filter: drop-shadow(0 16px 12px rgba(0,0,0,.5)); }
.dmp-tl.out { transition: transform .2s ease-in, opacity .2s ease-in; pointer-events: none; z-index: 20; }
.dmp-tl .ring { position: absolute; left: -4px; top: -4px; right: -4px; bottom: -4px; border: 2px solid #deb866; pointer-events: none; }
.dmp-tl.nope > div { animation: dmpNope .34s; }
.dmp-rx { flex: none; display: flex; overflow-x: auto; margin-top: 6px; padding: 2px 0 4px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.dmp-rx:empty { display: none; }
.dmp-rx::-webkit-scrollbar { display: none; }
.dmp-rx button { flex: none; width: 44px; height: 40px; margin-right: 6px; border-radius: 12px; border: 0; background: rgba(243,234,214,.1); font-size: 21px; line-height: 1; }
.dmp-rx button:active { background: rgba(222,184,102,.35); }
.dmp-rx.off button { opacity: .4; }
.dmp.land .dmp-hd { margin-top: 0; }
.dmp.land .dmp-rx { justify-content: center; flex-wrap: wrap; overflow: visible; }
.dmp.land .dmp-rx button { margin-bottom: 6px; }
.dmp-card { background: #f3ead6; color: #1d1b18; border-radius: 18px; padding: 16px 18px 18px; font-family: 'IBM Plex Sans Arabic', sans-serif; text-align: start; }
.dmp-card h3 { font: 700 22px 'Reem Kufi', sans-serif; margin: 0 0 10px; }
.dmp-pv { position: relative; height: 150px; direction: ltr; }
.dmp-pv .cap { position: absolute; left: 10px; bottom: 6px; font-size: 11px; color: #f3ead6; background: rgba(0,0,0,.5); padding: 2px 8px; border-radius: 9px; }
.dmp-pvs { position: -webkit-sticky; position: sticky; top: 0; z-index: 3; background: #f3ead6; padding: 6px 0 12px; }
.dmp-row { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 7px 0; border-top: 1px solid rgba(29,27,24,.2); }
.dmp-row > span { font-size: 15px; margin: 2px 12px 2px 0; }
.dmp-seg { display: flex; flex-wrap: wrap; background: rgba(29,27,24,.1); padding: 3px; border-radius: 21px; }
.dmp-seg button { height: 36px; min-width: 50px; padding: 0 12px; border: 0; border-radius: 18px; background: transparent; color: #1d1b18; font: 500 14px 'IBM Plex Sans Arabic', sans-serif; }
.dmp-seg button[aria-pressed="true"] { background: #12484b; color: #f3ead6; }
.dmp-sw { display: flex; align-items: center; }
.dmp-sw button { width: 28px; height: 28px; padding: 0; margin-left: 10px; border-radius: 50%; border: 2px solid rgba(0,0,0,.5); }
.dmp-sw button[aria-pressed="true"] { box-shadow: 0 0 0 2px #f3ead6, 0 0 0 4px #deb866; }
.dmp-bot { display: flex; flex-wrap: wrap; align-items: center; padding: 10px 0; border-top: 1px solid rgba(29,27,24,.2); }
.dmp-bot .av { width: 42px; height: 42px; flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 18px; color: #f3ead6; box-shadow: 0 2px 5px rgba(0,0,0,.35); overflow: hidden; }
.dmp-bot .av img { width: 100%; height: 100%; object-fit: cover; }
.dmp-bot .f { flex: 1; min-width: 130px; margin: 0 12px; }
.dmp-bot .f small { display: block; font-size: 12px; margin-bottom: 3px; }
.dmp-bot input { width: 100%; height: 42px; padding: 0 10px; border: 1px solid rgba(29,27,24,.35); border-radius: 10px; background: #fffdf7; color: #1d1b18; font: 15px 'IBM Plex Sans Arabic', sans-serif; }
.dmp-bot .cols { display: flex; flex-wrap: wrap; width: 100%; margin-top: 8px; }
.dmp-bot .cols button { width: 28px; height: 28px; padding: 0; margin: 0 7px 6px 0; border-radius: 50%; border: 2px solid rgba(0,0,0,.4); overflow: hidden; background-size: cover; background-position: center; }
.dmp-bot .cols button[aria-pressed="true"] { box-shadow: 0 0 0 2px #f3ead6, 0 0 0 4px #12484b; }
.dmp-bot .cols button img { display: block; width: 100%; height: 100%; object-fit: cover; pointer-events: none; }
.dmp-log { display: flex; align-items: center; padding: 8px 0; border-top: 1px solid rgba(29,27,24,.2); }
.dmp-log .n { width: 24px; flex: none; font-size: 13px; }
.dmp-log .av { width: 34px; height: 34px; flex: none; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; color: #f3ead6; box-shadow: 0 2px 5px rgba(0,0,0,.35); overflow: hidden; }
.dmp-log .av img { width: 100%; height: 100%; object-fit: cover; }
.dmp-log b { width: 92px; flex: none; margin: 0 12px; font-size: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dmp-log .w { display: flex; align-items: center; min-height: 36px; border-radius: 10px; font-size: 14px; direction: ltr; }
.dmp-fin { margin-top: 14px; border-radius: 18px; padding: 14px 16px; background: rgba(0,0,0,.3); box-shadow: inset 0 0 0 1px rgba(222,184,102,.4); font-family: 'IBM Plex Sans Arabic', sans-serif; color: #f3ead6; }
.dmp-fin .r { display: flex; align-items: center; padding: 8px 0; }
.dmp-fin .r + .r { border-top: 1px solid rgba(243,234,214,.16); }
.dmp-fin .r b { flex: 1; min-width: 0; font-size: 16px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dmp-fin .r span { font: 700 24px 'Reem Kufi', sans-serif; margin-inline-start: 12px; }
.dmp-fin .r.w b, .dmp-fin .r.w span { color: #deb866; }
`;
  function css() { D.css(); if (document.getElementById('dmp-css')) return; const st = document.createElement('style'); st.id = 'dmp-css'; st.textContent = CSS; document.head.appendChild(st); }
  function init(api) { A = api; css(); D.words(); }
  function reset() { X.pub = null; X.me = null; X.sel = null; X.sent = null; X.drag = null; X.turnKey = ''; X.lk = {}; if (X.logOpen) { try { X.logOpen(); } catch (e) {} X.logOpen = null; } }
  const lang = () => { D.setLang(A && A.G.lang === 'ar' ? 'ar' : 'en'); D.words(); };
  const rtl = () => D.lang === 'ar';
  const dir = e => { if (rtl()) e.style.direction = 'rtl'; return e; };

  // ---------- what the TV says ----------
  function askSync() { const t = Date.now(); if (t - X.syncAt < 1500) return; X.syncAt = t; A.send({ k: 'dom', a: 'sync' }); }
  function onMsg(m) {
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'pub') {
      if (!Array.isArray(m.seats) || !Array.isArray(m.chain) || !Array.isArray(m.sc)) return;
      if (X.pub && m.v < X.pub.v) return;
      const was = X.pub;
      X.pub = m; X.pubAt = performance.now();
      // (the table moved on: the tile this phone sent has landed, or wasn't taken; either way it is the table's word now)
      if (X.sent && (!was || was.mv !== m.mv || was.r !== m.r || was.turn !== m.turn || was.bone !== m.bone)) X.sent = null;
      if (was && (was.r !== m.r || was.turn !== m.turn || was.mv !== m.mv)) X.sel = null;
      const p = myP();
      if (p >= 0 && Array.isArray(m.hv) && X.me && m.hv[p] !== X.me.hv) setTimeout(() => { const q = myP(); if (X.pub && X.me && q >= 0 && X.pub.hv[q] !== X.me.hv) askSync(); }, 900);
      if (!X.me) setTimeout(() => { if (!X.me) askSync(); }, 900);
      return draw();
    }
    if (m.t === 'me') {
      if (!Array.isArray(m.hand)) return;
      if (X.me && m.r === X.me.r && m.hv < X.me.hv) return;
      X.me = { p: Number.isInteger(m.p) ? m.p : -1, hv: +m.hv || 0, r: m.r, hand: m.hand.filter(t => Array.isArray(t) && t.length === 2).map(t => [t[0] | 0, t[1] | 0]) };
      X.sent = null;
      return draw();
    }
    if (m.t === 'hb') {
      const p = myP();
      if (!X.pub || m.v > X.pub.v || !X.me || (p >= 0 && Array.isArray(m.hv) && m.hv[p] !== X.me.hv)) askSync();
      return;
    }
    if (m.t === 'log') { X.log = m; if (X.logOpen) logFill(); }
  }
  const myP = () => (X.me ? X.me.p : -1);
  const isHost = () => !!(A && A.G.host);
  const playing = () => !!X.pub && X.pub.ph === 'play';
  const myTurn = () => playing() && myP() >= 0 && X.pub.turn === myP();
  const hand = () => (X.me ? X.me.hand.filter(t => !(X.sent && X.sent.t && X.sent.t[0] === t[0] && X.sent.t[1] === t[1])) : []);
  const sidesOf = t => (myTurn() ? D.sidesFor(X.pub.chain, X.pub.must, t) : []);
  const nameOf = p => { const s = X.pub.seats[p]; return s ? String(s.nm) : ''; };
  const teamName = team => (X.pub.tm ? [team, team + 2].map(nameOf).join(' & ') : nameOf(team));
  const lookNow = () => Object.assign({}, X.pub ? X.pub.look : {}, X.lk);
  const send = m => A.send(Object.assign({ k: 'dom', r: X.pub ? X.pub.r : 0 }, m));

  // ---------- pictures: a seat's face is their Boo (only the TV has the photos), mine is my own picture ----------
  function face(p, size, fs) {
    const s = X.pub.seats[p] || {}, c = D.colOf(!!X.pub.tm, p);
    const e = h('span', 'width:' + size + 'px;height:' + size + 'px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:' + fs + 'px;color:' + CREAM + ';overflow:hidden;background:' + (s.col != null && D.PAL[s.col] ? D.grad(s.col) : D.AV[c]));
    const u = s.bot ? (s.av ? A.booUri(s.av) : '') : (s.id === A.G.id ? A.myPic() : A.booUri(s.av || 'boo:hi'));
    if (u) { const im = h('img', 'width:100%;height:100%;object-fit:cover;display:block', e); im.alt = ''; im.src = u; }
    else e.textContent = (String(s.nm || '?').trim()[0] || '?').toUpperCase();
    return e;
  }

  // ---------- the screen ----------
  // The table itself is on the TV only: a phone never shows the chain. It shows the score (every side with its players'
  // pictures, how many tiles each one holds, and whose turn it is), the round, a stage that says whose turn it is in
  // big letters ("Your turn" in gold when it is this player's), and this player's own tiles, as big as they fit.
  // Each part is drawn again only when what it shows has changed, so a tile being held is never pulled away and the
  // tiles slide to their new places when one is played.
  const same = (k, v) => { const ui = X.ui, s = JSON.stringify(v); if (ui.sig[k] === s) return true; ui.sig[k] = s; return false; };
  function draw() {
    if (!A || !X.pub) return;
    if (A.G.phase !== 'play') return;
    if (X.drag) { X.redraw = true; return; }
    lang();
    let ui = X.ui;
    if (!ui || !ui.root.isConnected) {
      const v = A.view();
      v.body.style.display = 'flex'; v.body.style.flexDirection = 'column'; v.body.style.flex = '1'; v.body.style.minHeight = '0';
      const root = A.el('div', 'dmp', v.body);
      ui = X.ui = { v, root, land: null, sig: {} };
      document.documentElement.classList.add('dmp-on');
      if (!X.wired) {
        X.wired = true;
        addEventListener('resize', () => { if (X.ui && X.ui.root.isConnected) draw(); });
      }
    }
    const root = ui.root, P = X.pub;
    // (the screen fits the phone whole, upright or on its side: nothing to scroll while playing)
    const top = root.getBoundingClientRect().top, H = Math.max(300, innerHeight - top - 14);
    root.style.height = H + 'px'; root.style.flex = 'none';
    const land = innerWidth > H * 1.25 && innerWidth >= 560;
    if (ui.land !== land) {
      ui.land = land; ui.sig = {};
      root.className = 'dmp' + (land ? ' land' : '');
      root.textContent = '';
      const L = land ? A.el('div', 'dmp-l', root) : root, R = land ? A.el('div', 'dmp-r', root) : root;
      ui.sb = A.el('div', 'dmp-sb', L); ui.rl = A.el('div', 'dmp-rl', L); ui.st = A.el('div', 'dmp-stage', L);
      ui.hd = A.el('div', 'dmp-hd', R); ui.rx = A.el('div', 'dmp-rx', R);
      ui.R = R;
      X.tiles = new Map(); X.faceKey = '';
    }
    scoreboard(); roundLine(); reactions();
    // (the tiles get the room: all of the side column on a phone lying down; upright, up to half of the screen, and the
    // stage always keeps enough to say whose turn it is)
    const Wd = (land ? ui.R.clientWidth : root.clientWidth) || Math.min(640, innerWidth - 32);
    const rxH = ui.rx.offsetHeight ? ui.rx.offsetHeight + 6 : 0;
    const maxH = land ? H - rxH - 10 : Math.min(H * 0.5, H - ui.sb.offsetHeight - ui.rl.offsetHeight - 21 - rxH - (H < 560 ? 100 : 136));
    handDraw(handPlan(Wd, Math.max(92, maxH)));
    stage();
    // (my turn just came: a little buzz, once)
    const key = P.r + '|' + P.mv + '|' + P.turn + '|' + P.ph;
    if (key !== X.turnKey) { X.turnKey = key; if (myTurn()) A.buzz('ok'); }
  }
  const ringOf = q => { const s = X.pub.seats[q] || {}; return s.col != null && D.PAL[s.col] ? D.PAL[s.col][1] : D.RING[D.colOf(!!X.pub.tm, q)]; };
  const picKey = () => { try { const u = String(A.myPic() || ''); return u.length + u.slice(-16); } catch (e) { return ''; } };
  // the score: each side with its players. A team is one card with its two players and the team's points ("86 / 151");
  // players who play alone get a card each. Every player shows their picture, their name, how many tiles they hold and
  // "Pass" when they just passed; the one whose turn it is wears gold.
  function scoreboard() {
    const P = X.pub, e = X.ui.sb, p = myP(), col = P.sc.length > 2, on = P.ph === 'play' ? P.turn : -1;
    if (same('sb', [P.seats.map(s => [s.nm, s.bot, s.av, s.col, s.c, s.away, P.ph === 'play' && s.said, s.id]), P.sc, P.tg, on, p, P.tm, D.lang, picKey()])) return;
    e.className = 'dmp-sb' + (col ? ' col' : '');
    e.textContent = '';
    const lead = Math.max.apply(null, P.sc);
    const pic = (q, size, fs) => { const a = face(q, size, fs); a.className = 'av'; a.style.setProperty('--rg', ringOf(q)); return a; };
    const tiles = (parent, s) => { const c = A.el('span', 'c', parent); A.el('span', 'tb', c); c.appendChild(document.createTextNode(String(s.c))); c.setAttribute('aria-label', T(s.c === 1 ? '1 tile' : '{n} tiles', { n: s.c })); };
    const passed = (parent, s) => { if (s.said && P.ph === 'play') dir(A.el('span', 'ps', parent, T('Pass'))); };
    P.sc.forEach((sc, i) => {
      const ps = P.tm ? [i, i + 2] : [i];
      const sd = A.el('div', 'sd', e);
      if (col) {
        const s = P.seats[i] || {};
        if (on === i) sd.classList.add('on');
        if (i === p) sd.classList.add('me');
        if (s.away) sd.classList.add('away');
        sd.appendChild(pic(i, 36, 15));
        dir(A.el('span', 'x', sd, s.nm));
        const row = A.el('div', 'row', sd);
        tiles(row, s); passed(row, s);
      } else {
        for (const q of ps) {
          const s = P.seats[q] || {};
          const pl = A.el('div', 'pl' + (on === q ? ' on' : '') + (q === p ? ' me' : '') + (s.away ? ' away' : ''), sd);
          pl.appendChild(pic(q, 28, 12));
          dir(A.el('span', 'x', pl, s.nm));
          passed(pl, s); tiles(pl, s);
        }
      }
      const scv = A.el('div', 'sc', sd);
      const b = A.el('b', '', scv, String(sc)); b.style.color = sc === lead && sc > 0 ? GOLD : CREAM;
      if (!col) A.el('small', '', scv, '/ ' + P.tg);
      const bar = A.el('span', 'bar', scv), u = A.el('span', '', bar);
      u.style.width = Math.min(100, sc / P.tg * 100) + '%'; u.style.background = (P.tm ? i : 0) ? CREAM : GOLD;
    });
  }
  // the round, the pile when there is one (two or three players), and what the match is played to
  function roundLine() {
    const P = X.pub, e = X.ui.rl;
    if (same('rl', [P.r, P.tg, P.n < 4 ? P.bone : -1, D.lang])) return;
    e.textContent = '';
    dir(A.el('span', '', e, T('Round {n}', { n: P.r })));
    if (P.n < 4) { const c = A.el('span', 'pile', e); A.el('span', 'tb', c); dir(A.el('span', '', c, T('Pile · {n}', { n: P.bone }))); }
    dir(A.el('span', '', e, T('First to {n}', { n: P.tg })));
  }
  // what the stage says: whose turn it is, and what this player can do
  function statusWords() {
    const P = X.pub, p = myP(), watch = p < 0 ? T('You are watching this round. You get a seat when one is free.') : '';
    if (P.ph === 'deal') return { t: T('Dealing…'), d: watch || T('The table is on the TV. Your tiles are here.') };
    if (P.ph === 'misdeal') return { t: T('Dealing again…'), d: watch };
    if (P.ph === 'match' || P.ph === 'final') return { t: T('Match over'), d: '' };
    if (P.ph !== 'play') return { t: T('Round over'), d: '' };
    const s = P.seats[P.turn] || {};
    if (P.turn === p) {
      if (X.sent) return { t: T('Your turn'), mine: 1, d: '' };
      if (!P.chain.length) return { t: T('Your turn'), mine: 1, d: P.must != null ? T('You hold the {a}–{a}. Play it to start.', { a: P.must }) : T('You start. Play any tile.') };
      if (hand().some(t => sidesOf(t).length)) return { t: T('Your turn'), mine: 1, d: T('Tap a tile to play it, or drag it up here.') };
      if (P.bone) return { t: T('Your turn'), mine: 1, d: T('No tile to play. Draw from the pile.') };
      return { t: T('Your turn'), mine: 1, d: P.opt.ap ? T('No legal move, passing…') : T('No legal move') };
    }
    if (!P.chain.length) return { t: P.must != null ? T('{name} holds the {a}–{a} and starts.', { name: s.nm, a: P.must }) : T('{name} starts.', { name: s.nm }), d: watch };
    if (s.bot) return { t: T('{name} is thinking…', { name: s.nm }), d: watch };
    if (s.away) return { t: T('{name} is away: the computer plays', { name: s.nm }), d: watch };
    return { t: T('{name}\'s turn', { name: s.nm }), d: watch };
  }
  const endL = () => X.pub.chain[0][0], endR = () => X.pub.chain[X.pub.chain.length - 1][1];
  const heldTile = () => (X.drag ? X.drag.t : X.sel && X.tiles && X.tiles.get(X.sel) ? X.tiles.get(X.sel).t : null);
  // The stage: whose turn it is. When this player holds or picked a tile, it turns into the place to play it: one end
  // to drop it on, or the two ends to choose from ("Play on 6", "Play on 0"; only this player sees them). When the
  // round is over it says how it ended.
  function stage() {
    const ui = X.ui, P = X.pub, p = myP(), e = ui.st, L = lookNow();
    const held = myTurn() && !X.sent ? heldTile() : null, sides = held ? sidesOf(held) : [];
    const mode = sides.length && (X.drag || sides.length > 1) ? 'tg' : P.res && (P.ph === 'round' || P.ph === 'match' || P.ph === 'lock') ? 'res' : 'turn';
    const w = statusWords(), s = P.seats[P.turn] || {}, small = e.clientHeight > 0 && e.clientHeight < 168, big = e.clientHeight >= 330;
    const nudge = isHost() && P.ph === 'play' && !myTurn() && !s.bot && !!s.away;
    const fresh = [mode, P.ph, P.r, mode === 'turn' ? P.turn : -1, !!w.mine].join('|');
    if (same('st', [fresh, held, sides, P.mv, p, !!X.sent, P.res, P.cnt, P.tl ? [P.tl.p, P.tl.sec] : 0, w, P.bone, P.opt.ap, isHost(), nudge, [s.nm, s.av, s.col, s.bot], D.lang, L.tiles, small, big, mode === 'turn' && P.turn === p ? picKey() : 0])) return;
    e.className = 'dmp-stage' + (small ? ' sm' : big ? ' lg' : '') + (X.stKey !== fresh ? ' new' : '');
    X.stKey = fresh;
    e.textContent = '';
    const B = (t, fn, cls) => { const b = A.el('button', 'dmp-btn' + (cls ? ' ' + cls : ''), e, t); b.type = 'button'; dir(b); b.onclick = () => { A.buzz('tap'); fn(); }; return b; };
    // (the time left for the turn, when the host set one: a bar that runs out along the bottom of the stage)
    const timeBar = () => {
      if (!P.tl || P.ph !== 'play') return;
      const bar = A.el('div', 'dmp-tm', e), i = A.el('i', '', bar);
      const gone = Math.max(0, P.tl.sec * 1000 - P.tl.left) + (performance.now() - (X.pubAt || performance.now()));
      i.style.animation = 'dmBar ' + P.tl.sec + 's linear ' + (-gone / 1000).toFixed(2) + 's both';
      if (P.tl.p === myP()) i.style.background = GOLD;
    };
    if (mode === 'tg') {
      e.classList.add('tg');
      const two = sides.length > 1;
      dir(A.el('div', 'k', e, two ? T('Choose which end to play on') : T('Drop it here to play')));
      const row = A.el('div', 'dmp-tgs', e), hk = Math.max(0.7, Math.min(1.5, (e.clientHeight - 96) / 42));
      for (const side of sides) {
        const n = P.chain.length ? (side === 'L' ? endL() : endR()) : null;
        const b = A.el('button', 'dmp-tg' + (X.drag && X.drag.side === side ? ' hot' : '') + (small || !two ? ' row' : ''), row);
        b.type = 'button'; b.dataset.side = side;
        // (the end's own number, as half a tile of the set on the table)
        if (n != null) b.appendChild(D.half(n, { set: L.tiles, size: 'menu', k: small || !two ? Math.min(1, hk) : hk }));
        dir(A.el('span', '', b, n != null ? T('Play on {n}', { n }) : T('Play it')));
        b.onclick = () => { const t = heldTile(); if (t) play(t, side); };
      }
      timeBar();
      return;
    }
    if (mode === 'res') {
      e.classList.add('res');
      const w2 = D.resultWords(P.res, { teams: !!P.tm, me: p, name: nameOf, teamName, over: P.ph === 'match' });
      const tie = P.res.team < 0, mineW = p >= 0 && (P.tm ? p % 2 === P.res.team : p === P.res.team);
      if (mineW) e.classList.add('win');
      dir(A.el('div', 'k', e, w2.title));
      const who = tie ? T('Tie') : mineW ? (P.tm ? T('Your team') : T('You')) : teamName(P.res.team);
      dir(A.el('div', 't', e, tie ? T('Tie') + '  ' + D.plus(0) : who + '  ' + D.plus(P.res.points)));
      const calc = tie ? T('No points this round') : D.calcOf(P.res.hands, P.res.team, !!P.tm);
      if (calc) A.el('div', 'c', e, calc);
      if (p >= 0 && P.res.hands[p]) dir(A.el('div', 'd', e, P.res.hands[p].length ? T('You have {n} points left in your hand.', { n: D.pts(P.res.hands[p]) }) : T('You have no tiles left.')));
      if (P.ph === 'round') {
        if (isHost()) B(P.cnt != null ? T('Next round ({n})', { n: P.cnt }) : T('Next round'), () => send({ a: 'next' }));
        else dir(A.el('div', 'dmp-note', e, P.cnt != null ? T('Next round ({n})', { n: P.cnt }) : T('The host starts the next round.')));
      } else if (P.ph === 'match') dir(A.el('div', 'dmp-note', e, T('Match over')));
      return;
    }
    if (w.mine) e.classList.add('mine');
    if (P.ph === 'play') { const a = face(P.turn, small ? 38 : big ? 82 : 58, small ? 16 : big ? 34 : 24); a.className = 'av'; e.appendChild(a); }
    dir(A.el('div', 't', e, w.t));
    if (w.d) dir(A.el('div', 'd', e, w.d));
    if (myTurn() && !X.sent && P.chain.length && !hand().some(t => sidesOf(t).length)) {
      if (P.bone) B(T('Draw a tile'), drawTile);
      else if (!P.opt.ap) B(T('Pass'), () => { X.sent = { pass: 1 }; send({ a: 'pass' }); draw(); });
    }
    // (the host can move a player who went away along)
    if (nudge) B(T('Play this turn for {name}', { name: nameOf(P.turn) }), () => send({ a: 'nudge' }), 'ghost');
    timeBar();
  }
  function drawTile() { if (X.sent) return; X.sent = { draw: 1 }; send({ a: 'draw' }); A.buzz('tap'); draw(); setTimeout(() => { if (X.sent && X.sent.draw) { X.sent = null; askSync(); draw(); } }, 3500); }
  function play(t, side, how) {
    if (!t || X.sent) return;
    // (the tile leaves the hand toward the table: up from where it sits, or from where it was dropped)
    const o = X.tiles && X.tiles.get(t[0] + '-' + t[1]);
    if (o) o.out = how || 'translateY(-' + Math.round(90 * (X.k || 1)) + 'px) scale(.7)';
    X.sent = { t: [t[0], t[1]], side }; X.sel = null;
    send({ a: 'play', t: [t[0], t[1]], side });
    A.buzz('tap');
    draw();
    // (no word back: said once more, then the table is asked how things stand)
    const mine = X.sent;
    setTimeout(() => { if (X.sent === mine) send({ a: 'play', t: mine.t, side: mine.side }); }, 1800);
    setTimeout(() => { if (X.sent === mine) { X.sent = null; askSync(); draw(); } }, 4500);
  }
  // ----- my tiles: as big as they fit, in one, two or three rows -----
  function handPlan(W, maxH) {
    const n = Math.max(1, hand().length), gap = 8, tw = 54, th = 110, lift = 16;
    // (a big screen shows them bigger; one row while they stay a good size to hold, then two rows, then three)
    const top = W >= 560 ? 1.6 : 1.18;
    let best = null;
    for (let rows = 1; rows <= 3; rows++) {
      const per = Math.ceil(n / rows);
      const k = Math.max(0.3, Math.min(top, (W - (per - 1) * gap) / (per * tw), (maxH - lift - (rows - 1) * 10) / (rows * th)));
      if (!best || k > best.k + 0.04) best = { rows, per, k };
      if (k >= top * 0.9) break;
    }
    best.gap = gap; best.h = Math.ceil(best.rows * th * best.k + (best.rows - 1) * 10 + lift); best.W = W;
    return best;
  }
  const restTf = o => (o.sel ? 'translateY(' + (-14 * (X.k || 1)).toFixed(1) + 'px)' : o.up ? 'translateY(' + (-6 * (X.k || 1)).toFixed(1) + 'px)' : 'none');
  function handDraw(pl) {
    const P = X.pub, e = X.ui.hd, hd = hand(), L = lookNow(), mine = myTurn() && !X.sent, hints = !!P.opt.hints;
    X.k = pl.k;
    if (myP() < 0) { e.style.height = '0px'; e.textContent = ''; X.tiles = new Map(); return; }
    e.style.transition = pl.h < (parseFloat(e.style.height) || 0) ? 'height .26s cubic-bezier(.2,.8,.2,1)' : 'none';
    e.style.height = pl.h + 'px';
    const hr = X.me ? X.me.r : -1;
    const tw = 54 * pl.k, th = 110 * pl.k, faceKey = L.tiles + '|' + pl.k.toFixed(3);
    // (another set of tiles or another size: every tile is drawn again; otherwise each one stays and only moves)
    const again = X.faceKey !== faceKey;
    if (again) { for (const o of X.tiles.values()) o.b.remove(); X.tiles = new Map(); X.faceKey = faceKey; }
    const seen = new Set();
    hd.forEach((t, i) => {
      const key = t[0] + '-' + t[1];
      seen.add(key);
      const row = Math.floor(i / pl.per), inRow = Math.min(pl.per, hd.length - row * pl.per), col = i % pl.per;
      const rowW = inRow * tw + (inRow - 1) * pl.gap, x = (pl.W - rowW) / 2 + col * (tw + pl.gap), y = 16 + row * (th + 10);
      let o = X.tiles.get(key);
      if (!o) {
        const b = A.el('button', 'dmp-tl', e); b.type = 'button';
        b.setAttribute('aria-label', t[0] + '–' + t[1]);
        const tl = D.tile(t, { set: L.tiles, size: 'hand', vert: true, k: pl.k });
        b.appendChild(tl);
        o = { b, tl, t, key };
        b.addEventListener('pointerdown', ev => dragStart(o, ev));
        b.addEventListener('click', () => tap(o));
        b.addEventListener('contextmenu', ev => ev.preventDefault());
        X.tiles.set(key, o);
        // (a tile that just came from the pile pops in; a whole new hand simply is there)
        if (X.handR === hr && !again && X.handN) tl.style.animation = 'dmFxPop .3s both';
        b.style.left = x + 'px'; b.style.top = y + 'px';
      }
      const can = mine && sidesOf(t).length > 0;
      o.sel = X.sel === key; o.up = mine && hints && can;
      o.b.style.left = x + 'px'; o.b.style.top = y + 'px';
      o.b.style.opacity = mine && hints && !can ? '0.45' : '1';
      o.b.style.transform = restTf(o);
      const ring = o.b.querySelector('.ring');
      if (o.sel && !ring) { const r = A.el('span', 'ring', o.b); r.style.borderRadius = (10 * pl.k + 4) + 'px'; }
      else if (!o.sel && ring) ring.remove();
    });
    // (a tile that left: the one this player just played flies off toward the table; the rest are a new round's)
    for (const [key, o] of Array.from(X.tiles)) {
      if (seen.has(key)) continue;
      X.tiles.delete(key);
      if (o.out && X.handR === hr) { o.b.classList.remove('drag'); o.b.classList.add('out'); const b = o.b; requestAnimationFrame(() => { b.style.transform = o.out; b.style.opacity = '0'; }); setTimeout(() => b.remove(), 260); }
      else o.b.remove();
    }
    X.handR = hr; X.handN = hd.length;
  }
  // (a tile that cannot be played says no with a little shake)
  function nope(o) { A.buzz('bad'); o.b.classList.remove('nope'); void o.b.offsetWidth; o.b.classList.add('nope'); setTimeout(() => o.b.classList.remove('nope'), 380); }
  function tap(o) {
    if (X.justDragged) return;
    if (!myTurn()) { const t = X.ui && X.ui.st.querySelector('.t'); if (t && playing()) { t.classList.remove('nudge'); void t.offsetWidth; t.classList.add('nudge'); } return; }
    if (X.sent) return;
    const sides = sidesOf(o.t);
    if (!sides.length) return nope(o);
    // (one end it fits, or the last tile: it goes; two ends: the stage asks which one)
    if (sides.length === 1 || hand().length === 1) return play(o.t, sides[0]);
    X.sel = X.sel === o.key ? null : o.key;
    A.buzz('tap');
    draw();
  }
  // where a held tile would land if it were let go now: by the end it is nearest to, once it has left the hand
  function sideAt(x, y) {
    const ui = X.ui, d = X.drag; if (!ui || !d) return null;
    const sr = ui.st.getBoundingClientRect(), over = x >= sr.left - 14 && x <= sr.right + 14 && y >= sr.top - 40 && y <= sr.bottom + 10;
    // (not on the stage: it counts once the tile has been carried a good way toward it; let go nearer, it goes back)
    if (!over) { const vx = sr.left + sr.width / 2 - d.sx, vy = sr.top + sr.height / 2 - d.sy, vl = Math.hypot(vx, vy) || 1; if (((x - d.sx) * vx + (y - d.sy) * vy) / vl < 52) return null; }
    const tg = [].slice.call(ui.st.querySelectorAll('.dmp-tg'));
    if (!tg.length) return null;
    let best = tg[0], bd = 1e9;
    for (const b of tg) { const q = b.getBoundingClientRect(), dd = Math.hypot(x - (q.left + q.width / 2), y - (q.top + q.height / 2)); if (dd < bd) { bd = dd; best = b; } }
    return best.dataset.side;
  }
  // a tile held and moved: it follows the finger, the stage shows where it can go, and letting go plays it there
  // (back over the hand, it returns to its place)
  function dragStart(o, ev) {
    if (ev.button != null && ev.button > 0) return;
    if (!myTurn() || X.sent || X.drag) return;
    const b = o.b, t = o.t, sides = sidesOf(t), sx = ev.clientX, sy = ev.clientY, pid = ev.pointerId;
    let moved = false, dead = false, raf = 0, lx = sx, ly = sy;
    try { b.setPointerCapture(pid); } catch (e) {}
    const paint = () => {
      raf = 0;
      if (!X.drag) return;
      b.style.transform = 'translate3d(' + (lx - sx) + 'px,' + (ly - sy) + 'px,0) scale(1.06)';
      const sd = sideAt(lx, ly);
      if (sd !== X.drag.side) {
        X.drag.side = sd;
        for (const g of [].slice.call(X.ui.st.querySelectorAll('.dmp-tg'))) g.classList.toggle('hot', g.dataset.side === sd);
        if (sd) A.buzz('tap');
      }
    };
    const move = e2 => {
      if (e2.pointerId !== pid || dead) return;
      lx = e2.clientX; ly = e2.clientY;
      if (!moved) {
        if (Math.hypot(lx - sx, ly - sy) < 8) return;
        moved = true;
        if (!sides.length) { dead = true; nope(o); return; }
        X.drag = { t, side: null, sx, sy }; X.sel = null;
        for (const q of X.tiles.values()) { const r = q.b.querySelector('.ring'); if (r) r.remove(); if (q !== o && q.sel) { q.sel = false; q.b.style.transform = restTf(q); } }
        b.classList.add('drag'); b.style.opacity = '1';
        stage();
      }
      if (e2.cancelable) e2.preventDefault();
      if (!raf) raf = requestAnimationFrame(paint);
    };
    const up = e2 => {
      if (e2.pointerId !== pid) return;
      b.removeEventListener('pointermove', move); b.removeEventListener('pointerup', up); b.removeEventListener('pointercancel', up);
      try { b.releasePointerCapture(pid); } catch (e) {}
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (!moved || dead || !X.drag) return;
      X.justDragged = true; setTimeout(() => { X.justDragged = false; }, 160);
      const side = e2.type === 'pointerup' ? sideAt(e2.clientX, e2.clientY) : null;
      X.drag = null; X.redraw = false;
      // (the table may have moved on while the tile was in the air: then it simply goes back)
      if (side && myTurn() && !X.sent && sidesOf(t).includes(side)) return play(t, side, 'translate3d(' + (e2.clientX - sx) + 'px,' + (e2.clientY - sy - 30) + 'px,0) scale(.6)');
      b.classList.remove('drag');
      draw();
    };
    b.addEventListener('pointermove', move); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  }
  // ----- quick reactions: a bubble by my seat on the TV -----
  const rxOn = () => !!X.pub && !!X.pub.opt.rx && myP() >= 0;
  function reactions() {
    const e = X.ui.rx;
    if (same('rx', [rxOn(), D.lang])) return;
    e.textContent = '';
    if (!rxOn()) return;
    D.REACTS.forEach((r, i) => {
      const b = A.el('button', '', e, r[0]); b.type = 'button'; b.title = T(r[1]); b.setAttribute('aria-label', T(r[1]));
      b.onclick = () => {
        const t0 = Date.now();
        if (t0 - X.rxAt < 1600) return;
        X.rxAt = t0; send({ a: 'react', i }); A.buzz('tap');
        A.toast(r[0] + ' ' + T(r[1]), 'ok');
        e.classList.add('off'); setTimeout(() => e.classList.remove('off'), 1600);
      };
    });
  }

  // =====================================================================
  // The host's extras
  // =====================================================================
  // the table's look, with a small table that shows each change as it is made (the game's own Settings preview)
  function preview(parent, look, key) {
    D.css(); css(); lang();
    const L = Object.assign({ table: 'teal', tiles: 'classic', dealFx: 'line', endFx: 'sweep', lockFx: 'padlock', border: 'wood' }, look);
    const k = key || 'look';
    const dealOn = k === 'dealFx', lockOn = k === 'lockFx' && L.lockFx !== 'off', endOn = (k === 'endFx' && L.endFx !== 'panel') || lockOn;
    const cap = ({ table: T('Table'), tiles: T('Tiles'), border: T('Table border'), dealFx: L.dealFx === 'off' ? T('Deal animation: off, tiles appear at once') : T('Deal animation'), endFx: L.endFx === 'panel' ? T('Round end: pop-up panel') : T('Round end'), lockFx: L.lockFx === 'off' ? T('Lock animation: off') : L.lockFx === 'gates' ? T('Lock animation: gates') : T('Lock animation') })[k] || T('Preview');
    const out = A.el('div', 'dmp-pv dmn-felt', parent);
    out.dataset.table = L.table;
    const e = D.clip(out);
    D.rim(out, L.border, false);
    if (!dealOn && !endOn) {
      const row = h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;padding-bottom:8px', e);
      [[6, 5], [5, 5], [3, 1]].forEach((t, i) => { const x = D.tile(t, { set: L.tiles, size: 'menu' }); if (i) x.style.marginLeft = '6px'; row.appendChild(x); });
    }
    if (dealOn) {
      const pd = D.previewDeal(L.dealFx, 'dmpPd');
      D.keyframes('dmp-deal-kf', pd.css);
      const box = h('div', 'position:absolute;left:50%;top:50%;width:380px;height:100px;margin:-50px 0 0 -190px', e);
      for (const d of pd.tiles) h('div', 'position:absolute;left:' + d.x + 'px;top:' + d.y + 'px;width:' + d.w + 'px;height:' + d.h + 'px;border-radius:3px;background:' + D.DEAL_BG + ';box-shadow:0 0 0 1px #b9a77f,0 0 6px rgba(0,0,0,.6);animation:' + d.an, box);
    }
    if (endOn) {
      h('div', 'position:absolute;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,.55)', e);
      const st = h('div', 'position:absolute;left:50%;top:50%;width:440px;height:' + (lockOn ? 214 : 150) + 'px;margin:' + (lockOn ? '-107px 0 0 -220px' : '-75px 0 0 -220px') + ';transform:scale(' + (lockOn ? 0.56 : 0.72) + ')' + (rtl() ? ';direction:rtl' : ''), e);
      const nm = 'Karim';
      if (lockOn) D.drawScene(st, D.lockScene({ kind: L.lockFx, name: nm, ini: 'K', av: D.AV[1], t: { locked: T('Locked'), closedBy: T('{name} closed the game', { name: nm }), lockedBy: T('{name} locked the game', { name: nm }), counting: T('Nobody can play. Counting the hands…') } }));
      else D.drawScene(st, D.fxScene({ kind: L.endFx, tie: false, points: 22, title: T('Blocked'), who: T('Your team'), parts: [13, 9], calc: '13 + 9 = 22', scoreLine: T('Us') + ' 83   ·   ' + T('Them') + ' 0', upper: !rtl(), t: { tie: T('Tie'), noPoints: T('no points') } }));
    }
    dir(A.el('div', 'cap', e, cap));
    return out;
  }
  // (the host picked a look somewhere: the preview shows it right away, before the TV says so)
  function onSet(key, v) {
    if (!LOOK_KEYS.includes(key)) return;
    X.lk[key] = v; X.pv = key;
    for (const box of [].slice.call(document.querySelectorAll('[data-dmp-pv]'))) { box.textContent = ''; preview(box, lookFrom(), key); }
    setTimeout(() => { delete X.lk[key]; }, 4000);
  }
  const lookFrom = () => { const l = (A.G.lobby || {}).settings || {}; const o = {}; for (const k of LOOK_KEYS) if (l[k] != null) o[k] = l[k]; return Object.assign(o, X.pub ? X.pub.look : {}, X.lk); };
  function previewBox(parent) { const b = A.el('div', '', parent); b.dataset.dmpPv = '1'; preview(b, lookFrom(), X.pv); return b; }
  // the look, during a match: the same choices as in the setup, with the preview on top
  function lookSheet() {
    lang();
    X.pv = 'look';
    A.sheet('', sh => {
      const card = A.el('div', 'dmp-card', sh);
      dir(card);
      A.el('h3', '', card, T('The table\'s look'));
      const st = A.el('div', 'dmp-pvs', card);
      previewBox(st);
      const l = A.G.lobby || {}, schema = Array.isArray(l.schema) ? l.schema : [], cur = lookFrom();
      for (const key of LOOK_KEYS) {
        const f = schema.find(x => x && x.key === key);
        if (!f || !Array.isArray(f.options)) continue;
        const row = A.el('div', 'dmp-row', card);
        A.el('span', '', row, A.clean(f.label, 60));
        if (key === 'table') {
          const sw = A.el('div', 'dmp-sw', row);
          for (const o of f.options) { const tb = D.TABLES.find(x => x[0] === o[0]); const b = A.el('button', '', sw); b.type = 'button'; b.title = A.clean(o[1], 40); b.setAttribute('aria-label', b.title); b.style.background = tb ? tb[2] : '#0a625e'; b.setAttribute('aria-pressed', String(o[0] === cur[key])); b.onclick = () => { for (const x of sw.children) x.setAttribute('aria-pressed', String(x === b)); A.send({ k: 'set', key, v: o[0] }); A.buzz('tap'); }; }
          continue;
        }
        const sg = A.el('div', 'dmp-seg', row);
        for (const o of f.options) { const b = A.el('button', '', sg, A.clean(o[1], 30)); b.type = 'button'; b.setAttribute('aria-pressed', String(o[0] === cur[key])); b.onclick = () => { for (const x of sg.children) x.setAttribute('aria-pressed', String(x === b)); A.send({ k: 'set', key, v: o[0] }); A.buzz('tap'); }; }
      }
    });
  }
  // the computer players: a name, a color and a picture for each (their seats, in order)
  function botsSheet() {
    lang();
    const l = A.G.lobby || {}, lines = String((l.settings || {}).bots || '').split('\n').map(x => x.split('|'));
    const seats = X.pub && A.G.phase === 'play' ? X.pub.seats.filter(s => s.bot) : null;
    const n = seats ? seats.length : 3;
    const rows = [];
    for (let i = 0; i < n; i++) rows.push({ name: (lines[i] && lines[i][0]) || '', col: lines[i] && lines[i][1] !== '' && lines[i][1] != null && D.PAL[+lines[i][1]] ? +lines[i][1] : null, av: (lines[i] && lines[i][2]) || '', shown: seats ? seats[i].nm : '' });
    const push = () => { clearTimeout(X.botT); X.botT = setTimeout(() => A.send({ k: 'set', key: 'bots', v: rows.map(r => [String(r.name).replace(/[|\n]/g, ' ').trim().slice(0, 12), r.col == null ? '' : r.col, r.av || ''].join('|')).join('\n') }), 450); };
    A.sheet('', sh => {
      const card = A.el('div', 'dmp-card', sh);
      dir(card);
      A.el('h3', '', card, T('Computer players'));
      if (!n) { A.el('p', '', card, T('Every seat has a player: no computer players in this match.')); return; }
      A.el('p', '', card, T('Give each one a name, a color and a face. Leave a name empty and it gets an everyday American one.')).style.cssText = 'font-size:14px;margin:0 0 6px';
      rows.forEach((r, i) => {
        const row = A.el('div', 'dmp-bot', card);
        const av = A.el('span', 'av', row);
        const paint = () => { av.textContent = ''; av.style.background = r.col != null ? D.grad(r.col) : D.AV[i % 2]; if (r.av) { const im = A.el('img', '', av); im.alt = ''; im.src = A.booUri(r.av); } else av.textContent = (String(r.name || r.shown || '?').trim()[0] || '?').toUpperCase(); };
        const f = A.el('div', 'f', row);
        A.el('small', '', f, T('Computer player {n}', { n: i + 1 }));
        const inp = A.el('input', '', f); inp.type = 'text'; inp.maxLength = 12; inp.value = r.name; inp.placeholder = r.shown || T('A name'); inp.autocomplete = 'off';
        inp.oninput = () => { r.name = inp.value; paint(); push(); };
        const cols = A.el('div', 'cols', row);
        const mk = (title, bg, on, fn) => { const b = A.el('button', '', cols); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.style.background = bg; b.setAttribute('aria-pressed', String(on)); b.onclick = () => { fn(); for (const x of cols.children) x.setAttribute('aria-pressed', 'false'); marks(); paint(); push(); A.buzz('tap'); }; return b; };
        const colBtns = [mk(T('Team color'), 'conic-gradient(#2f7377 0,#2f7377 50%,#8a443b 0)', false, () => { r.col = null; })].concat(D.PAL.map((c, k) => mk(T(c[0]), D.grad(k), false, () => { r.col = k; })));
        const avBtns = [mk(T('Its letter'), '#fffdf7', false, () => { r.av = ''; })].concat(A.AVATARS.slice(0, 8).map(id => { const b = mk(T('A Boo'), '#12484b', false, () => { r.av = id; }); const im = A.el('img', '', b); im.alt = ''; im.src = A.booUri(id); return b; }));
        avBtns[0].textContent = 'A'; avBtns[0].style.cssText += ';font:600 13px sans-serif;color:#1d1b18';
        const marks = () => { colBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === 0 ? r.col == null : r.col === k - 1))); avBtns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === 0 ? !r.av : r.av === A.AVATARS[k - 1]))); };
        h('span', 'flex-basis:100%;height:0', cols); cols.insertBefore(cols.lastChild, avBtns[0]);
        marks(); paint();
      });
    });
  }
  // the moves of this round, in order (the host's phone only): who played what, who drew, who passed
  function logSheet() {
    if (!isHost() || !X.pub) return;
    lang();
    send({ a: 'log' });
    X.logOpen = A.sheet('', sh => {
      const card = A.el('div', 'dmp-card', sh);
      dir(card);
      A.el('h3', '', card, T('Moves this round'));
      X.logBox = A.el('div', '', card);
      A.el('div', '', X.logBox, '…');
    }, { onClose: () => { X.logOpen = null; X.logBox = null; } });
    if (X.log && X.log.r === X.pub.r) logFill();
  }
  function logFill() {
    const box = X.logBox; if (!box || !box.isConnected || !X.log || !X.pub) return;
    box.textContent = '';
    const list = Array.isArray(X.log.log) ? X.log.log : [], L = lookNow();
    if (!list.length) { A.el('div', '', box, T('No moves yet this round.')).style.fontSize = '15px'; return; }
    list.forEach((e, i) => {
      const row = A.el('div', 'dmp-log', box);
      A.el('span', 'n', row, String(i + 1));
      const a = face(e.p, 34, 15); a.className = 'av'; row.appendChild(a);
      A.el('b', '', row, nameOf(e.p));
      const w = A.el('div', 'w', row);
      if (Array.isArray(e.t)) { w.style.background = '#0a3537'; w.style.padding = '8px 12px 14px'; w.appendChild(D.tile(e.t, { set: L.tiles, size: 'menu' })); }
      else { const s = A.el('span', '', w, e.x ? T('Passed') : e.d > 1 ? T('Drew {n} tiles', { n: e.d }) : T('Drew 1 tile')); dir(s); }
    });
  }
  // (what the ⋯ menu gets on the host's phone while Dominoes is the game)
  function menu(sh, close, btn) {
    if (!isHost()) return;
    lang();
    const play = A.G.phase === 'play';
    btn('🎨 ' + T('The table\'s look'), () => { close(); lookSheet(); });
    btn('🤖 ' + T('Computer players'), () => { close(); botsSheet(); });
    if (play && X.pub) btn('📜 ' + T('Moves this round'), () => { close(); logSheet(); });
  }

  // =====================================================================
  // The end of the match
  // =====================================================================
  // the final score with everyone's names, under the kit's own "your place" (the computer players are in it too)
  function endList(parent) {
    const P = X.pub; if (!P || !P.win) return false;
    lang();
    const w = P.win, e = A.el('div', 'dmp-fin', parent);
    for (const i of w.order) { const r = A.el('div', 'r' + (i === w.side ? ' w' : ''), e); dir(A.el('b', '', r, (i === w.side ? '🏆 ' : '') + String(w.names[i]))); A.el('span', '', r, String(w.sc[i])); }
    return true;
  }
  const winName = () => (X.pub && X.pub.win ? String(X.pub.win.names[X.pub.win.side]) : '');
  // the picture to share: the table, the winners in gold, the score in ivory pips and a few tiles (1080 x 1920)
  async function share(g, o) {
    const P = X.pub, w = P && P.win; if (!w) return false;
    lang();
    const W = 1080, H = 1920, L = P.look || {};
    try { await Promise.all(['700 80px "Reem Kufi"', '600 40px "IBM Plex Sans Arabic"'].map(f => document.fonts.load(f))); } catch (e) {}
    const felt = { teal: ['#156864', '#003336'], green: ['#21763c', '#003616'], burgundy: ['#892931', '#3d090e'], walnut: ['#8c5d34', '#5a3a1f'] }[L.table] || ['#156864', '#003336'];
    g.fillStyle = '#081717'; g.fillRect(0, 0, W, H);
    const rr = (x, y, w2, h2, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w2, y, x + w2, y + h2, r); g.arcTo(x + w2, y + h2, x, y + h2, r); g.arcTo(x, y + h2, x, y, r); g.arcTo(x, y, x + w2, y, r); g.closePath(); };
    // the table and its border, the one the table wears: wood, a light line, floating with none, or stitched leather
    const bd = L.border || 'wood', fx = bd === 'leather' ? 104 : bd === 'float' ? 62 : 76, fr = bd === 'leather' ? 64 : bd === 'float' ? 70 : 46;
    if (bd === 'wood') {
      rr(40, 40, W - 80, H - 80, 70); g.fillStyle = '#5b3a1f'; g.fill();
      rr(46, 46, W - 92, H - 92, 66); g.strokeStyle = '#2a180b'; g.lineWidth = 6; g.stroke();
    } else if (bd === 'light') {
      rr(40, 40, W - 80, H - 80, 70); g.fillStyle = '#0d0e11'; g.fill();
    } else if (bd === 'leather') {
      const lg = g.createLinearGradient(0, 40, 0, H - 40); lg.addColorStop(0, '#6f4329'); lg.addColorStop(0.5, '#4a2a18'); lg.addColorStop(1, '#2e190d');
      rr(40, 40, W - 80, H - 80, 110); g.fillStyle = lg; g.fill();
      rr(43, 43, W - 86, H - 86, 108); g.strokeStyle = '#1c0e06'; g.lineWidth = 6; g.stroke();
    }
    const gr = g.createRadialGradient(W / 2, H * 0.4, 60, W / 2, H * 0.4, H * 0.75); gr.addColorStop(0, felt[0]); gr.addColorStop(1, felt[1]);
    g.save(); if (bd === 'float') { g.shadowColor = 'rgba(0,0,0,.75)'; g.shadowBlur = 70; g.shadowOffsetY = 34; }
    rr(fx, fx, W - 2 * fx, H - 2 * fx, fr); g.fillStyle = gr; g.fill(); g.restore();
    g.save(); rr(fx, fx, W - 2 * fx, H - 2 * fx, fr); g.clip(); const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.62); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); g.restore();
    if (bd === 'light') { g.save(); g.shadowColor = 'rgba(255,200,90,.85)'; g.shadowBlur = 36; rr(fx + 3, fx + 3, W - 2 * fx - 6, H - 2 * fx - 6, fr - 3); g.strokeStyle = '#ffd978'; g.lineWidth = 6; g.stroke(); g.restore(); }
    else if (bd === 'float') { rr(fx + 1.5, fx + 1.5, W - 2 * fx - 3, H - 2 * fx - 3, fr - 1); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = 3; g.stroke(); }
    else if (bd === 'leather') {
      rr(fx - 4, fx - 4, W - 2 * fx + 8, H - 2 * fx + 8, fr + 4); g.strokeStyle = '#1c0e06'; g.lineWidth = 8; g.stroke();
      g.save(); g.setLineDash([24, 15]); rr(70, 70, W - 140, H - 140, 88); g.strokeStyle = 'rgba(235,205,160,.7)'; g.lineWidth = 5; g.stroke(); g.restore();
    }
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const fit = (text, maxW, px0, min, f) => { let s = px0; g.font = f(s); while (g.measureText(text).width > maxW && s > min) { s -= 4; g.font = f(s); } return s; };
    const kufi = s => '700 ' + s + 'px "Reem Kufi", sans-serif', plex = (s, wt) => (wt || 500) + ' ' + s + 'px "IBM Plex Sans Arabic", sans-serif';
    g.fillStyle = '#deb866'; g.font = kufi(84); g.fillText(T('Dominoes 151'), W / 2, 250);
    // a tile, drawn in the set the table wears: ivory, color dots, bone, ebony or maple
    const SK = {
      classic: { body: ['#fffdf7', '#f4ecd9', '#e0d3b6'], pip: () => ['#55504a', '#0d0c0b'], line: 'rgba(70,52,22,.55)', pin: 1 },
      color: { body: ['#ffffff', '#f7f8fa', '#dde1e7'], pip: n => [D.HUE_W45[n], D.HUE[n]], line: '#16181c', bar: 1 },
      boneColor: { body: ['#fffdf7', '#f1e8d2', '#dccfae'], pip: n => [D.HUE_W45[n], D.HUE[n]], line: 'rgba(70,52,22,.6)', pin: 1, edge: '#121214' },
      ebony: { body: ['#3d4046', '#1c1e21', '#0a0b0c'], pip: () => ['#ffffff', '#e4d9bd'], line: 'rgba(255,255,255,.2)', pin: 1 },
      maple: { body: ['#ecc68c', '#d9a868', '#c18e52'], pip: () => ['#4a2e16', '#1c0f05'], line: 'rgba(70,35,10,.7)' }
    };
    const sk = SK[L.tiles] || SK.classic;
    const tile = (cx, cy, a, b, s, rot) => {
      g.save(); g.translate(cx, cy); g.rotate(rot || 0);
      const w2 = s, h2 = s * 2 + 4;
      g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 26; g.shadowOffsetY = 16;
      if (sk.edge) { rr(-w2 / 2, -h2 / 2 + 7, w2, h2, s * 0.2); g.fillStyle = sk.edge; g.fill(); g.shadowColor = 'transparent'; }
      rr(-w2 / 2, -h2 / 2, w2, h2, s * 0.2); const tg = g.createLinearGradient(-w2 / 2, -h2 / 2, w2 / 2, h2 / 2); tg.addColorStop(0, sk.body[0]); tg.addColorStop(0.5, sk.body[1]); tg.addColorStop(1, sk.body[2]); g.fillStyle = tg; g.fill();
      g.shadowColor = 'transparent';
      g.fillStyle = sk.line; if (sk.bar) g.fillRect(-s * 0.42, -3, s * 0.84, 6); else g.fillRect(-s * 0.39, -1.5, s * 0.78, 3);
      if (sk.pin) { const pg = g.createRadialGradient(-2, -3, 1, 0, 0, s * 0.1); pg.addColorStop(0, '#f6e3a1'); pg.addColorStop(1, '#a67c2e'); g.fillStyle = pg; g.beginPath(); g.arc(0, 0, s * 0.075, 0, 6.3); g.fill(); }
      const half = (n, oy) => { const pad = s * 0.14, tr = (s - 2 * pad) / 3, pc = sk.pip(n); for (const c of D.cells(n, false)) { const x = -s / 2 + pad + tr * (c % 3 + 0.5), y = oy + pad + tr * (Math.floor(c / 3) + 0.5), r = s * 0.1; const pg = g.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r); pg.addColorStop(0, pc[0]); pg.addColorStop(0.7, pc[1]); pg.addColorStop(1, pc[1]); g.fillStyle = pg; g.beginPath(); g.arc(x, y, r, 0, 6.3); g.fill(); } };
      half(a, -h2 / 2); half(b, 2);
      g.restore();
    };
    // the winners
    g.fillStyle = '#f3ead6'; g.font = plex(44, 500); g.fillText(T('The winners'), W / 2, 420);
    const name = String(w.names[w.side]);
    fit(name, W - 2 * fx - 110, 120, 52, kufi); g.fillStyle = '#deb866';
    g.save(); g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 24; g.shadowOffsetY = 8; g.fillText(name, W / 2, 570); g.restore();
    // the winning score, in pips
    const F = { 0: ['.##.', '#..#', '#..#', '#..#', '.##.'], 1: ['..#.', '.##.', '..#.', '..#.', '.###'], 2: ['###.', '...#', '.##.', '#...', '####'], 3: ['###.', '...#', '.##.', '...#', '###.'], 4: ['#..#', '#..#', '####', '...#', '...#'], 5: ['####', '#...', '###.', '...#', '###.'], 6: ['.##.', '#...', '###.', '#..#', '.##.'], 7: ['####', '...#', '..#.', '.#..', '.#..'], 8: ['.##.', '#..#', '.##.', '#..#', '.##.'], 9: ['.##.', '#..#', '.###', '...#', '.##.'] };
    const digits = String(w.sc[w.side]).split(''), cell = 52, dw = 4 * cell, gapD = 56, tot = digits.length * dw + (digits.length - 1) * gapD - 16;
    digits.forEach((dg, k) => F[dg].forEach((row, rr2) => row.split('').forEach((chh, c) => { if (chh !== '#') return; const x = W / 2 - tot / 2 + k * (dw + gapD) + c * cell + 18, y = 700 + rr2 * cell; const pg = g.createRadialGradient(x - 5, y - 6, 2, x, y, 20); pg.addColorStop(0, '#fffdf7'); pg.addColorStop(1, '#d9cba9'); g.save(); g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 8; g.shadowOffsetY = 4; g.fillStyle = pg; g.beginPath(); g.arc(x, y, 19, 0, 6.3); g.fill(); g.restore(); })));
    // everyone else
    let y = 1080;
    for (const i of w.order) {
      if (i === w.side) continue;
      rr(170, y - 62, W - 340, 96, 48); g.fillStyle = 'rgba(0,0,0,.32)'; g.fill();
      g.textAlign = o.rtl ? 'right' : 'left'; const nm = String(w.names[i]); fit(nm, 520, 44, 26, s => plex(s, 600)); g.fillStyle = '#f3ead6'; g.fillText(nm, o.rtl ? W - 220 : 220, y);
      g.textAlign = o.rtl ? 'left' : 'right'; g.font = kufi(56); g.fillText(String(w.sc[i]), o.rtl ? 220 : W - 220, y + 6);
      y += 118;
    }
    g.textAlign = 'center';
    g.fillStyle = '#bbd7d9'; g.font = plex(36, 500); g.fillText(T(w.rounds === 1 ? 'In 1 round' : 'In {n} rounds', { n: w.rounds }) + '  ·  ' + T('First to {n}', { n: P.tg }), W / 2, Math.max(y + 30, 1360));
    // a few tiles, the double six among them
    tile(250, 1560, 6, 6, 120, -0.2); tile(430, 1590, 5, 1, 120, 0.08); tile(650, 1590, 1, 1, 120, -0.06); tile(830, 1560, 6, 5, 120, 0.2);
    g.fillStyle = '#deb866'; g.font = plex(40, 600); g.fillText('blokvane.com', W / 2, H - 120);
    return true;
  }

  return { init, reset, onMsg, draw, css, preview, previewBox, onSet, lookSheet, botsSheet, logSheet, menu, endList, winName, share, LOOK_KEYS, get pub() { return X.pub; }, get on() { return !!X.pub; },
    left() { document.documentElement.classList.remove('dmp-on'); X.ui = null; } };
})();
