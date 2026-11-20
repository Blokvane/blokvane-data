// Blokvane party games: Dominoes 151 on a phone (../go/m/party.js loads this with dom-core.js when the game is on).
// The table is on the TV only: a phone never shows the chain. The phone holds its player's own tiles, in the game's own
// look, as big as they fit (upright or on its side), and plays them: a tap, or a drag up out of the hand. A tile that
// fits both ends asks which one: "Play on 6" or "Play on 0", to tap or to drop the tile on (only this player sees them).
// Above the tiles: the score with everyone's names and pictures, how many tiles each player holds, the round, and whose
// turn it is ("Your turn" in gold when it is yours), with the time left when the host set one, and one button that
// opens the game's stickers: a tap sends one to the TV (one every four seconds at the most). No emoji anywhere.
// The host's phone has more: the table's look with a live preview (also in the middle of a match), the computer
// players' names, colors and faces, the moves of the round in order, and Next round. Each phone shows all of it in its
// own language.
var BVDOMP = (() => {
  'use strict';
  const D = BVDOM, h = D.h, px = D.px, GOLD = D.GOLD, CREAM = D.CREAM, INK = D.INK, KUFI = D.KUFI, PLEX = D.PLEX;
  const T = (t, v) => D.t(t, v);
  let A = null;   // what party.js lends: el, send, G, view, buzz, toast, sheet, booUri, myPic, clean, setCtl, btn
  const X = { pub: null, me: null, sel: null, sent: null, drag: null, pv: 'look', lk: {}, ui: null, turnKey: '', syncAt: 0, logOpen: null, botT: 0, tiles: null, faceKey: '', k: 1, skAt: 0, skLast: 0, skT: 0, skClose: null, skUi: null, skWarm: false };
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
.dmp-rx { flex: none; display: flex; justify-content: center; margin-top: 8px; }
.dmp-rx:empty { display: none; }
.dmp-skb { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; max-width: 420px; height: 44px; padding: 0 14px; border: 0; border-radius: 22px; background: rgba(243,234,214,.09); box-shadow: inset 0 0 0 1px rgba(243,234,214,.2); color: #f3ead6; font: 600 15px 'IBM Plex Sans Arabic', sans-serif; overflow: hidden; -webkit-tap-highlight-color: transparent; }
.dmp-skb:active { background: rgba(222,184,102,.3); }
.dmp-skb svg { position: relative; flex: none; width: 22px; height: 22px; color: #deb866; }
.dmp-skb .tx { position: relative; margin: 0 9px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dmp-skb .th { position: relative; flex: none; height: 36px; width: auto; }
.dmp-skb .fill { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: rgba(222,184,102,.24); transform-origin: 0 50%; transform: scaleX(0); pointer-events: none; }
.dmp-skb.wait { color: #e6cf99; }
.dmp-skb.wait .fill { animation: dmpCool linear both; }
@keyframes dmpCool { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@keyframes dmpSkIn { from { opacity: 0; transform: scale(.86); } }
html.g-dom .sheet.dmp-sks { display: flex; flex-direction: column; max-width: 900px; height: 86vh; height: 86dvh; max-height: 780px; padding: 14px 0 0; overflow: hidden; font-family: 'IBM Plex Sans Arabic', sans-serif; color: #f3ead6; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
html.g-dom .sheet.dmp-sks.low { height: 96vh; height: 96dvh; padding-top: 8px; margin-bottom: 0; }
.dmp-sks.low .grab { display: none; }
.dmp-sks.low .dmp-skh { padding-bottom: 4px; }
.dmp-sks.low .dmp-skh p { display: none; }
.dmp-sks.low .dmp-skh h3 { font-size: 19px; }
.dmp-sks.low .dmp-skh .x { width: 34px; height: 34px; padding: 8px; }
.dmp-sks.low .dmp-skh .x svg { width: 18px; height: 18px; }
.dmp-sks.low .dmp-skt { padding-bottom: 6px; }
.dmp-sks.low .dmp-skt button { height: 30px; }
.dmp-sks.low .dmp-skl h4 { margin-top: 6px; }
html.g-dom .sheet.dmp-sks .grab { flex: none; margin: -4px auto 8px; }
.dmp-skh { flex: none; display: flex; align-items: center; padding: 0 14px 8px; }
.dmp-skh .t { flex: 1 1 auto; min-width: 0; }
.dmp-skh h3 { margin: 0; font: 700 22px/1.25 'Reem Kufi', sans-serif; color: #deb866; }
.dmp-skh p { margin: 1px 0 0; font-size: 13px; line-height: 1.35; color: #bbd7d9; }
.dmp-skh .turn { flex: none; margin: 0 8px; padding: 3px 11px; border-radius: 12px; background: #deb866; color: #1d1b18; font-weight: 700; font-size: 13px; white-space: nowrap; }
.dmp-skh .x { flex: none; width: 40px; height: 40px; padding: 10px; border: 0; border-radius: 50%; background: rgba(243,234,214,.1); color: #f3ead6; }
.dmp-skh .x svg { display: block; width: 20px; height: 20px; }
.dmp-skt { flex: none; display: flex; overflow-x: auto; padding: 2px 10px 10px; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.dmp-skt::-webkit-scrollbar { display: none; }
.dmp-skt button { flex: none; height: 34px; padding: 0 15px; margin: 0 3px; border: 0; border-radius: 17px; background: rgba(243,234,214,.1); color: #f3ead6; font: 600 14px 'IBM Plex Sans Arabic', sans-serif; white-space: nowrap; transition: background .15s, color .15s; }
.dmp-skt button[aria-pressed="true"] { background: #deb866; color: #1d1b18; }
.dmp-skw { position: relative; flex: none; display: none; align-items: center; justify-content: center; height: 34px; margin: 0 13px 8px; border-radius: 17px; background: rgba(0,0,0,.35); overflow: hidden; font-size: 14px; font-weight: 600; color: #e6cf99; }
.dmp-sks.wait .dmp-skw { display: flex; }
.dmp-skw i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; background: rgba(222,184,102,.26); transform-origin: 0 50%; animation: dmpCool linear both; }
.dmp-skw span { position: relative; }
.dmp-skw.nudge { animation: dmpNope .34s; }
.dmp-skl { flex: 1 1 0; min-height: 0; overflow-x: hidden; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; padding: 0 9px calc(18px + var(--safe-b, 0px)); }
.dmp-skl h4 { display: flex; align-items: center; margin: 12px 6px 4px; font: 600 15px/1.3 'IBM Plex Sans Arabic', sans-serif; color: #deb866; }
.dmp-skl h4::after { content: ''; flex: 1; height: 1px; margin: 0 10px; background: rgba(222,184,102,.3); }
.dmp-skl h4:first-child { margin-top: 2px; }
.dmp-skg { display: flex; flex-wrap: wrap; }
.dmp-skg.one { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
.dmp-skg.one::-webkit-scrollbar { display: none; }
.dmp-sk { flex: none; display: flex; align-items: center; justify-content: center; margin: 4px; padding: 0; border: 0; border-radius: 16px; background: rgba(0,0,0,.24); box-shadow: inset 0 0 0 1px rgba(243,234,214,.08); transition: transform .12s, background .12s, opacity .2s; -webkit-tap-highlight-color: transparent; }
.dmp-sk img { opacity: 0; transition: opacity .18s; }
.dmp-sk img.in { opacity: 1; }
.dmp-sk:active { transform: scale(.94); background: rgba(222,184,102,.28); box-shadow: inset 0 0 0 2px #deb866; }
.dmp-sks.wait .dmp-sk, .dmp-sks.wait .dmp-say { opacity: .42; }
.dmp-says { display: flex; flex-wrap: wrap; justify-content: center; padding-top: 4px; }
.dmp-say { flex: 1 1 42%; min-height: 52px; margin: 5px; padding: 8px 14px; border: 0; border-radius: 18px 18px 18px 5px; background: #fffdf7; color: #1d1b18; font: 600 15px/1.3 'IBM Plex Sans Arabic', sans-serif; text-align: center; box-shadow: 0 3px 8px rgba(0,0,0,.35); transition: transform .12s, opacity .2s; -webkit-tap-highlight-color: transparent; }
.dmp-say:active { transform: scale(.96); background: #deb866; }
.dmp.land .dmp-hd { margin-top: 0; }
.dmp.land .dmp-rx { margin-top: 10px; }
html.g-dom .pt-howto small { color: #deb866; font-family: 'IBM Plex Sans Arabic', sans-serif; font-weight: 600; }
html.g-dom .pt-howto h1 { font-family: 'Reem Kufi', sans-serif; color: #deb866; }
html.g-dom .pt-howto li { align-items: center; font: 600 15px/1.38 'IBM Plex Sans Arabic', sans-serif; color: #f3ead6; border-color: rgba(243,234,214,.14); }
html.g-dom .pt-howto li.mode { border-color: rgba(222,184,102,.6); background: rgba(222,184,102,.1); }
html.g-dom .pt-howto .pt-timer i { background: linear-gradient(90deg, #deb866, #f6e3a1); }
html.g-dom .pt-howto li i { width: 26px; height: 26px; font-size: 0; border-radius: 6px; background-color: #fffdf7; background-repeat: no-repeat; box-shadow: inset 0 1px 0 rgba(255,255,255,.95), 0 2px 0 #a3916a, 0 3px 5px rgba(0,0,0,.4); }
html.g-dom .pt-howto li:nth-child(1) i { background-image: radial-gradient(circle at 50% 50%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px); }
html.g-dom .pt-howto li:nth-child(2) i { background-image: radial-gradient(circle at 29% 29%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 71% 71%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px); }
html.g-dom .pt-howto li:nth-child(3) i { background-image: radial-gradient(circle at 26% 26%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 50% 50%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 74% 74%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px); }
html.g-dom .pt-howto li:nth-child(4) i { background-image: radial-gradient(circle at 29% 29%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 71% 29%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 29% 71%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 71% 71%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px); }
html.g-dom .pt-howto li:nth-child(5) i { background-image: radial-gradient(circle at 27% 27%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 73% 27%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 50% 50%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 27% 73%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 73% 73%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px); }
html.g-dom .pt-howto li:nth-child(n+6) i { background-image: radial-gradient(circle at 30% 24%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 70% 24%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 30% 50%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 70% 50%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 30% 76%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px), radial-gradient(circle at 70% 76%, #2b2824 0, #0d0c0b 2.4px, rgba(13,12,11,0) 3.1px); }
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
.dmp-fin .r .cr { flex: none; margin: 0 8px 2px 0; }
[dir="rtl"] .dmp-fin .r .cr { margin: 0 0 2px 8px; }
`;
  function css() { D.css(); if (document.getElementById('dmp-css')) return; const st = document.createElement('style'); st.id = 'dmp-css'; st.textContent = CSS; document.head.appendChild(st); }
  function init(api) { A = api; css(); D.words(); }
  function reset() { X.pub = null; X.me = null; X.sel = null; X.sent = null; X.drag = null; X.turnKey = ''; X.lk = {}; if (X.logOpen) { try { X.logOpen(); } catch (e) {} X.logOpen = null; } if (X.skClose) { try { X.skClose(); } catch (e) {} } }
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
    const rxH = ui.rx.offsetHeight ? ui.rx.offsetHeight + 10 : 0;
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
  // ----- a sticker for the TV -----
  // One button under the tiles opens all of the game's stickers: big enough to read (each one has its words on it), in
  // groups with a row of names on top to jump to one, and the last ones this player sent first. A tap sends it: it
  // shows on the TV, by this player's seat, and nowhere else. One every four seconds at the most (the button fills up
  // again while the player waits; the TV holds to it too). The stickers are the pack of the game's language: Arabic
  // or English. A game in a language that has no pack sends a short line in a bubble instead, the same way.
  const COOL = 4000;
  const SVG = (d, more) => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d.split('|').map(x => '<path d="' + x + '"/>').join('') + (more || '') + '</svg>';
  const IC = {
    sticker: SVG('M20 12.5V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h5.5z|M12.5 20c.2-4.4 3.1-7.3 7.5-7.5|M8.6 9.6h.01|M14.4 9.6h.01|M8.6 13.4c1.2 1.3 2.9 1.6 4.3.9'),
    say: SVG('M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-6.5L8 21v-4H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z|M8 10h8|M8 13h5'),
    ok: SVG('M5 12.5l4.5 4.5L19 7.5'), x: SVG('M6 6l12 12|M18 6L6 18')
  };
  const rxOn = () => !!X.pub && !!X.pub.opt.rx && myP() >= 0;
  const packNow = () => (X.pub ? D.stickerPack(X.pub.opt.sk || '') : '');
  const coolLeft = () => Math.max(0, COOL - (Date.now() - (X.skAt || 0)));
  // (the last ones a player sent: ten of them, kept apart for each pack, the Arabic one and the English one)
  const RECENT = 10;
  const recentKey = pack => 'bv-dom-stk-' + pack;
  function recents(pack) { try { const a = JSON.parse(localStorage.getItem(recentKey(pack)) || '[]'); return Array.isArray(a) ? a.filter(n => D.stickerOf(pack, n)).slice(0, RECENT) : []; } catch (e) { return []; } }
  function remember(pack, n) { try { localStorage.setItem(recentKey(pack), JSON.stringify([n].concat(recents(pack).filter(x => x !== n)).slice(0, RECENT))); } catch (e) {} }
  function reactions() {
    const e = X.ui.rx, pack = packNow(), on = rxOn(), cool = coolLeft() > 0;
    if (!on && X.skClose) { try { X.skClose(); } catch (er) {} }
    if (X.skUi && X.skUi.turn.isConnected) X.skUi.turn.style.display = myTurn() ? '' : 'none';
    if (same('rx', [on, D.lang, pack, cool, cool ? X.skLast : 0])) return;
    e.textContent = '';
    if (!on) return;
    const b = A.el('button', 'dmp-skb' + (cool ? ' wait' : ''), e); b.type = 'button';
    dir(b);
    const fill = A.el('span', 'fill', b);
    if (cool) {
      // (just sent: what went to the TV, while the four seconds run out)
      fill.style.animationDuration = COOL + 'ms'; fill.style.animationDelay = (coolLeft() - COOL) + 'ms';
      if (rtl()) fill.style.transformOrigin = '100% 50%';
      const o = pack && X.skLast ? D.stickerOf(pack, X.skLast) : null;
      if (o) { const im = A.el('img', 'th', b); im.alt = ''; im.src = o.src; im.style.width = Math.round(36 * o.w / o.h) + 'px'; } else b.insertAdjacentHTML('beforeend', IC.ok);
      A.el('span', 'tx', b, T('Sent to the TV'));
    } else {
      b.insertAdjacentHTML('beforeend', pack ? IC.sticker : IC.say);
      A.el('span', 'tx', b, pack ? T('Send a sticker to the TV') : T('Say something on the TV'));
    }
    b.onclick = () => { A.buzz('tap'); stickerSheet(); };
    // (the first pictures the sheet shows are fetched ahead, once, so it opens with its stickers already there)
    if (pack && !X.skWarm) {
      X.skWarm = true;
      setTimeout(() => { try { const K = D.STICKERS[pack]; for (const n of recents(pack).concat(K.groups[0][1].slice(0, 6))) { const o = D.stickerOf(pack, n); if (o) { const im = new Image(); im.decoding = 'async'; im.src = o.src; } } } catch (e) {} }, 2500);
    }
  }
  // (the four seconds: the button under the tiles and the open sheet both show them, and both come back by themselves)
  function coolNow() {
    clearTimeout(X.skT);
    if (X.ui && X.ui.root.isConnected) reactions();
    const u = X.skUi, left = coolLeft();
    if (u && u.sh.isConnected) {
      u.sh.classList.toggle('wait', left > 0);
      if (left > 0) { u.bar.style.animationDuration = COOL + 'ms'; u.bar.style.animationDelay = (left - COOL) + 'ms'; }
    }
    if (left > 0) X.skT = setTimeout(coolNow, left + 40);
  }
  // (what went to the TV; false while the four seconds are not over)
  function sendOne(m, n) {
    if (!rxOn() || coolLeft() > 0) return false;
    X.skAt = Date.now(); X.skLast = n || 0;
    send(m);
    coolNow();
    return true;
  }
  function stickerSheet() {
    if (!rxOn()) return;
    if (X.skClose) { try { X.skClose(); } catch (e) {} }
    lang();
    const pack = packNow(), K = pack ? D.STICKERS[pack] : null;
    let io = null, onSize = null;
    X.skClose = A.sheet('', (sh, close) => {
      sh.classList.add('dmp-sks');
      if (innerHeight < 520) sh.classList.add('low');
      // the top: what this is, "your turn" when it is, and a way out
      const hd = A.el('div', 'dmp-skh', sh); dir(hd);
      const t = A.el('div', 't', hd);
      A.el('h3', '', t, pack ? T('Stickers') : T('Say something'));
      A.el('p', '', t, pack ? T('Tap one and it shows on the TV.') : T('Tap a line and it shows by your name on the TV.'));
      const turn = A.el('span', 'turn', hd, T('It is your turn')); turn.style.display = myTurn() ? '' : 'none';
      const x = A.el('button', 'x', hd); x.type = 'button'; x.innerHTML = IC.x; x.setAttribute('aria-label', T('Close')); x.onclick = () => close();
      const tabs = K ? A.el('div', 'dmp-skt', sh) : null;
      const wait = A.el('div', 'dmp-skw', sh); const bar = A.el('i', '', wait); dir(A.el('span', '', wait, T('Wait a moment…')));
      if (rtl()) bar.style.transformOrigin = '100% 50%';
      const list = A.el('div', 'dmp-skl', sh);
      X.skUi = { sh, turn, bar };
      const tooSoon = () => { wait.classList.remove('nudge'); void wait.offsetWidth; wait.classList.add('nudge'); A.buzz('tap'); };
      if (!K) {
        // (no stickers in this game's language yet: short lines, words only)
        const box = A.el('div', 'dmp-says', list); dir(box);
        D.REACTS.forEach((line, i) => { const b = A.el('button', 'dmp-say', box, T(line)); b.type = 'button'; dir(b); b.onclick = () => { if (!sendOne({ a: 'react', i }, 0)) return tooSoon(); close(); }; });
        coolNow();
        return;
      }
      // (the pack reads from the right when it is the Arabic one, whatever the phone's own language)
      const rl = pack === 'ar';
      if (rl) { tabs.style.direction = 'rtl'; list.style.direction = 'rtl'; }
      const cells = [], heads = [];
      const cell = (parent, n, small) => {
        const o = D.stickerOf(pack, n); if (!o) return;
        const b = A.el('button', 'dmp-sk', parent); b.type = 'button'; b.setAttribute('aria-label', o.text);
        const im = A.el('img', '', b); im.alt = ''; im.draggable = false; im.decoding = 'async'; im.dataset.src = o.src;
        im.onload = () => im.classList.add('in');
        b.onclick = () => {
          if (!sendOne({ a: 'stk', i: n }, n)) return tooSoon();
          remember(pack, n);
          close();
        };
        cells.push({ b, im, o, small: !!small });
      };
      const rec = recents(pack);
      if (rec.length) {
        dir(A.el('h4', '', list, T('The last ones you sent')));
        const row = A.el('div', 'dmp-skg one', list);
        for (const n of rec) cell(row, n, true);
      }
      K.groups.forEach(g => {
        const hh = A.el('h4', '', list, g[0]); heads.push(hh);
        const grid = A.el('div', 'dmp-skg', list);
        for (const n of g[1]) cell(grid, n, false);
        const tb = A.el('button', '', tabs, g[0]); tb.type = 'button'; tb.setAttribute('aria-pressed', 'false');
        tb.onclick = () => { list.scrollTop = hh.offsetTop - list.offsetTop - 2; mark(); A.buzz('tap'); };
      });
      // every sticker the same size: `u` screen dots to the pack's unit, as many across as fit while the words stay easy
      // to read (two on a phone held upright; more on a tablet, or on a phone lying down)
      const mw = Math.max.apply(null, K.sizes.map(z => z[0])) / K.unit, mh = Math.max.apply(null, K.sizes.map(z => z[1])) / K.unit;
      const size = () => {
        const W = list.clientWidth - 18, H = list.clientHeight;
        if (W < 80) return;
        const want = Math.min(176, Math.max(118, H / 1.8)), cols = Math.max(2, Math.min(7, Math.floor(W / want))), cw = Math.floor(W / cols) - 8;
        const u = (cw - 10) / mw, ch = Math.round(u * mh + 10);
        for (const c of cells) {
          const k = c.small ? 0.72 : 1, uu = u * k / K.unit;
          c.b.style.width = Math.round(cw * k) + 'px'; c.b.style.height = Math.round(ch * k) + 'px';
          c.im.style.width = (c.o.w * uu).toFixed(1) + 'px'; c.im.style.height = (c.o.h * uu).toFixed(1) + 'px';
        }
      };
      size();
      onSize = () => { if (sh.isConnected) size(); };
      addEventListener('resize', onSize);
      // (a picture is fetched when its part of the list comes near: opening the sheet costs a few pictures, not 79)
      const load = im => { if (im.dataset.src) { im.src = im.dataset.src; delete im.dataset.src; } };
      try {
        io = new IntersectionObserver(es => { for (const en of es) if (en.isIntersecting) { load(en.target); io.unobserve(en.target); } }, { root: list, rootMargin: '500px 0px' });
        for (const c of cells) io.observe(c.im);
      } catch (e) { io = null; for (const c of cells) load(c.im); }
      // (the name on top that matches the part of the list in sight)
      const mark = () => {
        const y = list.scrollTop + 40;
        let at = 0;
        heads.forEach((hh, i) => { if (hh.offsetTop - list.offsetTop <= y) at = i; });
        if (list.scrollTop + list.clientHeight >= list.scrollHeight - 4) at = heads.length - 1;
        [].forEach.call(tabs.children, (tb, i) => { const on = i === at; if ((tb.getAttribute('aria-pressed') === 'true') !== on) { tb.setAttribute('aria-pressed', String(on)); if (on) { try { tabs.scrollTo({ left: tb.offsetLeft - tabs.clientWidth / 2 + tb.offsetWidth / 2, behavior: 'smooth' }); } catch (e) {} } } });
      };
      list.addEventListener('scroll', mark, { passive: true });
      mark();
      coolNow();
    }, { onClose: () => { X.skClose = null; X.skUi = null; if (io) { try { io.disconnect(); } catch (e) {} } if (onSize) removeEventListener('resize', onSize); } });
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
    // (each with one of the kit's drawn icons: this game shows no emoji)
    btn(T('The table\'s look'), () => { close(); lookSheet(); }, 'draw');
    btn(T('Computer players'), () => { close(); botsSheet(); }, 'ghost');
    if (play && X.pub) btn(T('Moves this round'), () => { close(); logSheet(); }, 'queue');
  }

  // =====================================================================
  // The end of the match
  // =====================================================================
  // the final score with everyone's names, under the kit's own "your place" (the computer players are in it too)
  function endList(parent) {
    const P = X.pub; if (!P || !P.win) return false;
    lang();
    const w = P.win, e = A.el('div', 'dmp-fin', parent);
    for (const i of w.order) {
      const r = A.el('div', 'r' + (i === w.side ? ' w' : ''), e);
      // (the winners wear the game's little crown)
      if (i === w.side) { const c = A.el('i', 'cr', r); c.appendChild(D.crown(24)); }
      dir(A.el('b', '', r, String(w.names[i]))); A.el('span', '', r, String(w.sc[i]));
    }
    return true;
  }
  const winName = () => (X.pub && X.pub.win ? String(X.pub.win.names[X.pub.win.side]) : '');
  // What the winners' screen says. The TV sends it (win.w); a TV page from before the five designs sends only the
  // names and the points, and then the picture is the trophy with what is known.
  function winOf(P) {
    const w = P.win, o1 = w.order[1], plus = v => String(v).split(' & ');
    const W = w.w && Array.isArray(w.w.who) ? w.w : { fx: 'trophy', who: plus(w.names[w.side]), target: P.tg, sa: w.sc[w.side], sb: o1 == null ? 0 : w.sc[o1], won: null, rounds: w.rounds, big: null, runners: o1 == null ? '' : plus(w.names[o1]).join(' + '), many: !!P.tm };
    return Object.assign({}, W, { who: W.who.map(x => String(x)), runners: String(W.runners || ''), rtl: rtl() });
  }
  // the picture to share (1080 x 1920): the winners' screen the host picked, stood upright for a phone, in this
  // phone's own language, with Blokvane's mark at the foot. dom-core.js draws it, with the very drawings of the TV's.
  async function share(g) {
    const P = X.pub; if (!P || !P.win) return false;
    lang();
    const W = winOf(P);
    try { await D.winFonts(W.fx, W.who.join('') + W.runners + D.t('Dominoes 151') + D.t('Champion')); } catch (e) {}
    // (a picture gets a moment and no longer: the poster is made without it if it does not come)
    const load = src => new Promise(res => { if (!src) return res(null); const im = new Image(); let done = false; const end = v => { if (!done) { done = true; res(v); } }; im.onload = () => end(im); im.onerror = () => end(null); setTimeout(() => end(null), 2500); im.src = src; });
    // the winners' faces, as this phone knows them: their Boo, and this player's own photo (only the TV has the others')
    const side = P.win.side, faces = (P.tm ? [side, side + 2] : [side]).map(p => { const s = P.seats[p] || {}; return s.bot ? A.booUri(s.av || D.botBoo(s.nm)) : (s.id === A.G.id ? A.myPic() : A.booUri(s.av || 'boo:hi')); });
    const got = await Promise.all([load(D.BRAND)].concat(faces.map(load)));
    W.pics = got.slice(1);
    D.winPoster(g, W, got[0]);
    return true;
  }

  return { init, reset, onMsg, draw, css, preview, previewBox, onSet, lookSheet, botsSheet, logSheet, menu, endList, winName, share, LOOK_KEYS, get pub() { return X.pub; }, get on() { return !!X.pub; },
    left() { document.documentElement.classList.remove('dmp-on'); X.ui = null; if (X.skClose) { try { X.skClose(); } catch (e) {} } } };
})();
