// Blokvane party games: Car Fighting Arena on a phone (../go/m/party.js loads this when the game is on). Music only
// ever plays on the TV; the phone has the game's own car sounds and nothing else.
// - The garage: the player picks one of the game's 16 cars. It drops onto its stand the way the game drops a car, with
//   the car's own engine starting as it lands (and the last one's turning off as it goes), its speed, acceleration,
//   weight and handling, and Ready. The TV shows everyone's car on the arena, each dropping in as it is picked.
// - The match: the phone is the controller, like the game's own touch pad: on the left one stick to drive (up to go,
//   down to brake and back up, the sides to steer), on the right four round buttons (Fire, Boost, Jump, Change weapon),
//   placed for a right thumb. Above them the car's boost, damage, weapon, place and the clock. Sideways is best; it
//   works upright too.
// The moves go through a straight line to the TV when the phone gets one (many times a second), and through the relays
// otherwise. No emoji in the controller: the buttons wear the game's own marks.
var BVCFAP = (() => {
  'use strict';
  const ME = (document.currentScript && document.currentScript.src) || '';
  const HERE = ME.replace(/[^/?#]*([?#].*)?$/, '');
  const ORANGE = '#ff8a1f', GOLD = '#ffd23f', GREEN = '#3ddc84', RED = '#e53935', BLUE = '#4aa3ff';
  // the game's 16 cars: their names and their four numbers, as the game has them (speed, acceleration, weight, handling)
  const CARS = [['RED STRIPES', [88, 82, 52, 76]], ['BLUE MONSTER', [68, 55, 90, 52]], ['YELLOW SUPERCAR', [100, 90, 42, 84]], ['GREEN ARMOR', [60, 48, 100, 45]],
    ['PURPLE EXOTIC', [94, 96, 45, 90]], ['POLICE', [88, 80, 62, 78]], ['ORANGE MUSCLE', [84, 88, 68, 66]], ['TURQUOISE BUGGY', [84, 92, 40, 86]],
    ['PINK HEART', [92, 90, 40, 94]], ['CHARCOAL RALLY', [74, 62, 86, 60]], ['LIME BUGGY', [82, 88, 46, 82]], ['BLUE ICE', [100, 92, 42, 86]],
    ['ORANGE SKULL', [70, 60, 92, 54]], ['TURQUOISE CLASSIC', [82, 74, 70, 62]], ['PURPLE HOTROD', [90, 94, 60, 66]], ['PATROL SUV', [76, 62, 88, 58]]];
  const nn = i => String(i + 1).padStart(2, '0');
  const picOf = i => HERE + 'cfa/ph/car' + nn(i) + '.webp', shOf = i => HERE + 'cfa/ph/sh' + nn(i) + '.webp';
  const SCENE = 640 / 449;   // (the shape of those pictures)
  // (the game's own marks on its buttons)
  const ICON = {
    boost: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    jump: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l7-7 7 7M5 19l7-7 7 7"/></svg>',
    fire: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z"/></svg>',
    swap: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    ok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5.6 12.6l4.1 4.1 8.7-9.2" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="#fff"><circle cx="5" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="19" cy="12" r="2.2"/></svg>'
  };
  const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
  const face = (w, f) => `@font-face{font-family:'Chakra Petch';font-style:normal;font-weight:${w};font-display:swap;src:url(${HERE}fonts/${f}) format('woff2');unicode-range:${LAT}}`;
  const CSS = [face(600, 'cfa-chakra-latin-600.woff2'), face(700, 'cfa-chakra-latin-700.woff2'), `
html.g-cfa.pt-dark, html.g-cfa.pt-dark body { background: #0b111e; }
html.g-cfa.pt-dark .sw-sky { display: none; }
html.g-cfa.cfp-pick .app { max-width: none; }
.cfp-g { display: flex; flex-direction: column; flex: 1; min-height: 0; width: 100%; max-width: 560px; margin: 0 auto; color: #fff; font-family: 'Chakra Petch', ui-rounded, system-ui, sans-serif; -webkit-user-select: none; user-select: none; }
.cfp-g * { box-sizing: border-box; }
.cfp-g [hidden], .cfp [hidden] { display: none !important; }
.cfp-g .stage { position: relative; height: 36vh; min-height: 180px; max-height: 320px; touch-action: pan-y; direction: ltr; display: flex; align-items: center; justify-content: center; }
/* (the stand, the car's shadow and the car: three pictures from one camera, laid exactly on top of each other, so the
   car's wheels land on the stand. The scene keeps the pictures' shape: 640 by 449.) */
.cfp-g .scene { position: relative; flex: none; }
.cfp-g .scene > * { position: absolute; left: 0; top: 0; width: 100%; height: 100%; pointer-events: none; }
.cfp-g .scene img { display: block; width: 100%; height: 100%; }
.cfp-g .car, .cfp-g .sh { transform-origin: 50% 64%; }
.cfp-g .car.drop { animation: cfpDrop .95s cubic-bezier(.3,0,.4,1) both; }
.cfp-g .car.away { animation: cfpAway .38s ease-in both; }
.cfp-g .sh.drop { animation: cfpShade .95s ease-out both; }
.cfp-g .sh.away { animation: cfpFade .3s ease-in both; }
@keyframes cfpDrop { 0% { transform: translateY(-130%); opacity: 0; } 10% { opacity: 1; } 50% { transform: translateY(0) scale(1.04,.93); } 63% { transform: translateY(-6%) scale(.99,1.02); } 76% { transform: translateY(0) scale(1.015,.98); } 88% { transform: translateY(-1.2%) scale(1); } 100% { transform: translateY(0) scale(1); } }
@keyframes cfpAway { to { transform: translateY(-150%) rotate(-5deg); opacity: 0; } }
@keyframes cfpShade { 0% { opacity: 0; transform: scale(.5); } 50% { opacity: 1; transform: scale(1); } 63% { opacity: .8; transform: scale(.95); } 76% { opacity: 1; transform: scale(1); } 100% { opacity: 1; transform: scale(1); } }
@keyframes cfpFade { to { opacity: 0; } }
.cfp-g .dust { left: 16%; top: 46%; width: 68%; height: 36%; border-radius: 50%; background: radial-gradient(ellipse, rgba(214,206,190,.55), rgba(214,206,190,0) 70%); opacity: 0; }
.cfp-g .dust.on { animation: cfpDust .9s ease-out both; }
@keyframes cfpDust { 0% { opacity: 0; transform: scale(.4,.6); } 20% { opacity: 1; } 100% { opacity: 0; transform: scale(1.35,1.1); } }
.cfp-g .arr { position: absolute; top: 40%; width: 48px; height: 48px; margin-top: -24px; border: 0; border-radius: 50%; background: rgba(19,27,46,.92); box-shadow: inset 0 0 0 2px #33415f; display: flex; align-items: center; justify-content: center; padding: 0; }
.cfp-g .arr svg { width: 24px; height: 24px; }
.cfp-g .arr:active { transform: scale(.92); background: #26324f; }
.cfp-g .arr.l { left: 2px; } .cfp-g .arr.r { right: 2px; }
.cfp-g .info { padding: 2px 4px 0; }
.cfp-g .nm { text-align: center; font-size: 24px; font-weight: 700; letter-spacing: .08em; line-height: 1.1; }
.cfp-g .nb { text-align: center; font-size: 12px; font-weight: 700; letter-spacing: .14em; color: #c9d2e6; margin-top: 2px; }
.cfp-g .stats { display: grid; grid-template-columns: auto 1fr auto; grid-gap: 6px 10px; gap: 6px 10px; align-items: center; margin: 12px 6px 0; }
.cfp-g .stats span { font-size: 12px; font-weight: 700; letter-spacing: .1em; color: #c9d2e6; }
.cfp-g .stats i { display: block; height: 8px; border-radius: 4px; background: #26324f; overflow: hidden; }
.cfp-g .stats i b { display: block; height: 100%; border-radius: 4px; background: ${ORANGE}; transition: width .45s cubic-bezier(.2,1,.3,1); }
.cfp-g .stats em { font-style: normal; font-size: 13px; font-weight: 700; min-width: 28px; text-align: right; }
.cfp-g .thumbs { display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch; margin: 14px -4px 0; padding: 4px 4px 8px; scrollbar-width: none; direction: ltr; }
.cfp-g .thumbs::-webkit-scrollbar { display: none; }
.cfp-g .thumbs button { flex: none; width: 86px; height: 58px; margin-right: 8px; border-radius: 12px; border: 2px solid #26324f; background: #0f1626; padding: 2px; }
.cfp-g .thumbs button { overflow: hidden; }
.cfp-g .thumbs button img { width: 100%; height: 100%; object-fit: cover; object-position: 52% 40%; transform: scale(1.3); transform-origin: 52% 40%; display: block; }
.cfp-g .thumbs button.on { border-color: ${ORANGE}; background: #1b2540; }
.cfp-g .say { margin: 10px 4px 0; text-align: center; font-size: 14px; font-weight: 700; color: #c9d2e6; letter-spacing: .04em; min-height: 20px; }
.cfp-g .say.go { color: ${GREEN}; }
.cfp-g .rdy { margin-top: 12px; width: 100%; min-height: 58px; border: 0; border-radius: 16px; background: #26324f; color: #fff; font: 700 19px/1 'Chakra Petch', ui-rounded, system-ui, sans-serif; letter-spacing: .08em; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 0 rgba(0,0,0,.3); }
.cfp-g .rdy svg { width: 26px; height: 26px; margin-right: 8px; }
.cfp-g .rdy.on { background: ${GREEN}; color: #0b1a10; }
.cfp-g .rdy:active { transform: translateY(3px); box-shadow: 0 3px 0 rgba(0,0,0,.3); }
.cfp-g .hostgo { margin-top: 10px; width: 100%; min-height: 50px; border: 0; border-radius: 14px; background: ${ORANGE}; color: #1b0f00; font: 700 17px/1 'Chakra Petch', ui-rounded, system-ui, sans-serif; letter-spacing: .08em; }
.cfp-g .late { margin: 10px 4px 0; padding: 10px 12px; border-radius: 12px; background: rgba(255,138,31,.14); color: #ffd7ad; font-size: 14px; font-weight: 700; text-align: center; }
@media (orientation: landscape) and (max-height: 560px) {
  .cfp-g { flex-direction: row; max-width: 920px; align-items: stretch; }
  .cfp-g .stage { flex: 1 1 54%; height: auto; max-height: none; min-height: 0; }
  .cfp-g .info { flex: 1 1 46%; min-width: 0; display: flex; flex-direction: column; justify-content: center; padding-left: 10px; }
  .cfp-g .nm { font-size: 20px; }
  .cfp-g .nb { display: none; }
  .cfp-g .stats { margin-top: 6px; grid-gap: 3px 10px; gap: 3px 10px; }
  .cfp-g .thumbs { margin-top: 6px; padding-bottom: 4px; }
  .cfp-g .thumbs button { width: 66px; height: 44px; }
  .cfp-g .say { margin-top: 4px; min-height: 0; font-size: 13px; }
  .cfp-g .rdy { min-height: 46px; margin-top: 6px; font-size: 17px; }
  .cfp-g .hostgo { min-height: 42px; margin-top: 6px; }
}
/* ---------- the controller: the whole screen ---------- */
html.cfp-on, html.cfp-on body { overflow: hidden; overscroll-behavior: none; }
.cfp { position: fixed; left: 0; top: 0; right: 0; bottom: 0; z-index: 30; direction: ltr; color: #fff; font-family: 'Chakra Petch', ui-rounded, system-ui, sans-serif; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: none;
  background: radial-gradient(70vmax 50vmax at 50% 120%, rgba(255,90,26,.22), transparent 70%), linear-gradient(180deg, #0b111e, #10172a); overflow: hidden; }
.cfp * { box-sizing: border-box; }
.cfp .top { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; padding: calc(8px + env(safe-area-inset-top, 0px)) calc(12px + env(safe-area-inset-right, 0px)) 0 calc(12px + env(safe-area-inset-left, 0px)); }
.cfp .me { display: flex; align-items: center; min-width: 0; flex: 1 1 0; }
.cfp .me img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex: none; box-shadow: 0 0 0 3px var(--pc, #33415f); background: #26324f; }
.cfp .me b { margin-left: 9px; font-size: 16px; font-weight: 700; letter-spacing: .04em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cfp .clk { flex: none; display: flex; align-items: baseline; padding: 4px 14px; border-radius: 10px; background: rgba(19,27,46,.85); font-size: 20px; font-weight: 700; letter-spacing: .08em; }
.cfp .clk i { font-style: normal; font-size: 11px; color: ${GOLD}; margin-right: 8px; letter-spacing: .1em; }
.cfp .clk i:empty { display: none; }
.cfp .rt { flex: 1 1 0; display: flex; justify-content: flex-end; align-items: center; min-width: 0; }
.cfp .pl { font-size: 15px; font-weight: 700; letter-spacing: .06em; margin-right: 10px; white-space: nowrap; color: #c9d2e6; }
.cfp .pl b { color: #fff; font-size: 20px; }
.cfp .more { width: 40px; height: 40px; border-radius: 12px; border: 0; background: rgba(19,27,46,.85); display: flex; align-items: center; justify-content: center; padding: 0; flex: none; }
.cfp .more svg { width: 22px; height: 22px; }
.cfp .bars { position: absolute; left: 50%; top: calc(54px + env(safe-area-inset-top, 0px)); transform: translateX(-50%); width: min(460px, 56vw); display: flex; align-items: center; padding: 7px 12px; border-radius: 12px; background: rgba(19,27,46,.85); font-size: 10px; font-weight: 700; letter-spacing: .1em; color: #c9d2e6; }
.cfp .bars i { flex: 1; height: 7px; border-radius: 4px; background: #26324f; overflow: hidden; margin: 0 12px 0 7px; }
.cfp .bars i:last-child { margin-right: 0; }
.cfp .bars i b { display: block; height: 100%; border-radius: 4px; transition: width .15s linear; }
.cfp .chips { position: absolute; left: 50%; top: calc(92px + env(safe-area-inset-top, 0px)); transform: translateX(-50%); display: flex; align-items: center; white-space: nowrap; font-size: 13px; font-weight: 700; letter-spacing: .08em; }
.cfp .chips span { padding: 4px 10px; border-radius: 9px; background: rgba(19,27,46,.85); margin: 0 3px; }
.cfp .chips span b { color: ${GOLD}; }
.cfp .chips span:empty { display: none; }
.cfp .warn { position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%); padding: 12px 22px; border-radius: 16px; font-size: 22px; font-weight: 700; letter-spacing: .1em; text-align: center; white-space: nowrap; pointer-events: none; }
.cfp .warn.bomb { background: ${RED}; animation: cfpPulse .5s ease-in-out infinite alternate; }
.cfp .warn.crown { background: rgba(255,210,63,.92); color: #2a1d00; }
@keyframes cfpPulse { to { transform: translate(-50%, -50%) scale(1.07); } }
/* (the stick: anywhere on the left half; it starts where the thumb goes down. A ridged bowl with arrows and
   "Drive and steer" carved into it, and a domed rubber knob with a dished top) */
.cfp .lz { position: absolute; left: 0; top: 0; bottom: 0; width: 50%; touch-action: none; }
.cfp .joy { position: absolute; width: var(--jd); height: var(--jd); margin: calc(var(--jd) / -2) 0 0 calc(var(--jd) / -2); border-radius: 50%; pointer-events: none;
  background: radial-gradient(circle closest-side, #04070d 0 49%, #1b2440 50.5% 52.5%, rgba(0,0,0,0) 54%), linear-gradient(180deg, #33406a 0%, #26304f 52%, #1b2339 100%);
  box-shadow: inset 0 5px 10px rgba(0,0,0,.55), inset 0 -2px 3px rgba(255,255,255,.08), 0 0 0 3px #11182a, 0 3px 0 3px #0a0f1b, 0 12px 26px rgba(0,0,0,.5); transition: box-shadow .15s; }
.cfp .joy svg { position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: visible; }
.cfp .joy .sd { fill: rgba(0,0,0,.55); }
.cfp .joy .hl { fill: rgba(255,255,255,.22); }
.cfp .joy .cv { fill: #0a0f1c; }
.cfp .joy text { font-weight: 700; letter-spacing: .12em; }
.cfp .joy .kn { position: absolute; left: 50%; top: 50%; width: 46%; height: 46%; margin: -23% 0 0 -23%; border-radius: 50%;
  background: radial-gradient(circle at 50% 28%, #7182ad 0%, #4a5880 36%, #2d3758 70%, #1c2440 100%);
  box-shadow: inset 0 2px 1px rgba(255,255,255,.38), inset 0 -5px 8px rgba(0,0,0,.55), 0 6px 0 #10172a, 0 9px 4px rgba(0,0,0,.55), 0 16px 22px rgba(0,0,0,.55); }
.cfp .joy .kn::before { content: ''; position: absolute; left: 20%; top: 18%; width: 60%; height: 60%; border-radius: 50%; background: radial-gradient(ellipse 70% 40% at 50% 22%, rgba(255,255,255,.32), rgba(255,255,255,0) 70%), radial-gradient(circle at 50% 74%, #5a6993, #2c3554 74%); box-shadow: inset 0 4px 6px rgba(0,0,0,.65), 0 1px 0 rgba(255,255,255,.22); }
.cfp .joy .kn::after { content: ''; position: absolute; left: 4%; top: 4%; width: 92%; height: 92%; border-radius: 50%; background: repeating-conic-gradient(rgba(255,255,255,.09) 0 5deg, rgba(0,0,0,.16) 5deg 10deg); -webkit-mask: radial-gradient(circle, transparent 0 63%, #000 66% 100%); mask: radial-gradient(circle, transparent 0 63%, #000 66% 100%); }
.cfp .joy.on { box-shadow: inset 0 5px 10px rgba(0,0,0,.55), inset 0 -2px 3px rgba(255,255,255,.08), 0 0 0 3px #ff8a1f, 0 3px 0 3px #8a4a12, 0 0 26px rgba(255,138,31,.45); }
/* (the four buttons: the right thumb rests on Fire in the corner, with Boost, Jump and Change weapon around it.
   Each one is a real button: a socket, a wall in a darker shade of its colour, and a domed top with its icon and
   word carved in. Pressed, the top slides down its wall into the socket) */
.cfp .rz { position: absolute; right: 0; bottom: 0; width: var(--rw); height: var(--rh); }
.cfp .b { position: absolute; border-radius: 50%; touch-action: none; background: radial-gradient(circle at 50% 42%, #020409 0 58%, #0a0f1c 74%, #18213a 100%); box-shadow: inset 0 4px 8px rgba(0,0,0,.9), 0 1px 0 rgba(255,255,255,.07); transition: opacity .2s; }
.cfp .b .wl, .cfp .b .cap { position: absolute; left: 7%; width: 86%; height: 86%; border-radius: 50%; pointer-events: none; }
.cfp .b .wl { top: 11%; background: linear-gradient(180deg, var(--sd), var(--lo)); box-shadow: 0 3px 4px rgba(0,0,0,.55), 0 10px 18px rgba(0,0,0,.5); }
.cfp .b .cap { top: 3%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle at 36% 26%, var(--hi) 0%, var(--c) 46%, var(--lo) 100%); box-shadow: inset 0 2px 1px rgba(255,255,255,.7), inset 0 0 0 1px rgba(255,255,255,.22), inset 0 -6px 10px rgba(0,0,0,.22), inset 0 -14px 18px -8px var(--hi); transition: transform .05s ease-out, filter .05s; }
/* (glass: a bright reflection over the top of the dome, and light coming through at the bottom) */
.cfp .b .cap::before { content: ''; position: absolute; left: 15%; top: 5%; width: 70%; height: 46%; border-radius: 50% 50% 46% 46% / 64% 64% 36% 36%; background: linear-gradient(180deg, rgba(255,255,255,.78) 0%, rgba(255,255,255,.28) 46%, rgba(255,255,255,0) 100%); pointer-events: none; }
.cfp .b .cap::after { content: ''; position: absolute; left: 22%; bottom: 5%; width: 56%; height: 22%; border-radius: 50%; background: radial-gradient(ellipse at 50% 100%, rgba(255,255,255,.55), rgba(255,255,255,0) 70%); pointer-events: none; }
.cfp .b.dn .cap::before { opacity: .8; }
.cfp .b.dn .cap { transform: translateY(7%); filter: brightness(1.06); }
.cfp .b .cap svg { width: 36%; height: 36%; filter: drop-shadow(0 1px 0 rgba(255,255,255,.45)); }
.cfp .b.fire .cap svg, .cfp .b.boost .cap svg { fill: var(--ink); }
.cfp .b.jump .cap svg, .cfp .b.swap .cap svg { stroke: var(--ink); }
.cfp .b .cap span, .cfp .b .cap small { font-weight: 700; color: var(--ink); text-shadow: 0 1px 0 rgba(255,255,255,.45), 0 -1px 0 rgba(0,0,0,.4); text-align: center; }
.cfp .b .cap span { font-size: 11px; letter-spacing: .08em; margin-top: 2px; max-width: 86%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cfp .b .cap small { font-size: 10px; }
/* (a button that can't do anything right now keeps its color, a little dimmer) */
.cfp .b.off .cap, .cfp .b.off .wl { filter: saturate(.88) brightness(.8); }
/* (Fire stays red even before there is a weapon to fire: its word says FIRE until one is picked up) */
.cfp .b.fire.off .cap, .cfp .b.fire.off .wl { filter: none; }
.cfp .b.fire { --c: #e53935; --hi: #ff9a90; --lo: #a51f1b; --sd: #7a1411; --ink: #5a0d0b; }
.cfp .b.boost { --c: #ff8a1f; --hi: #ffc98a; --lo: #cc6106; --sd: #984502; --ink: #6a2f00; }
.cfp .b.jump { --c: #4aa3ff; --hi: #b2d8ff; --lo: #2070d2; --sd: #15519c; --ink: #0d3a73; }
.cfp .b.swap { --c: #2fb36a; --hi: #93efbc; --lo: #1d8149; --sd: #135c34; --ink: #0b4425; }
.cfp .b.swap .cap span { white-space: normal; font-size: 9px; line-height: 1.05; letter-spacing: .04em; }
.cfp .msg { position: absolute; left: 50%; top: 52%; transform: translate(-50%, -50%); text-align: center; pointer-events: none; }
.cfp .msg b { display: block; font-size: 46px; font-weight: 700; letter-spacing: .06em; line-height: 1; text-shadow: 0 4px 0 ${RED}; }
.cfp .msg span { display: block; font-size: 16px; font-weight: 700; letter-spacing: .1em; color: #c9d2e6; margin-top: 8px; }
.cfp .msg:empty { display: none; }
.cfp .pop { position: absolute; left: 50%; top: 30%; transform: translateX(-50%); font-size: 22px; font-weight: 700; letter-spacing: .08em; white-space: nowrap; pointer-events: none; text-shadow: 0 2px 8px #000; }
.cfp .pop.go { animation: cfpPop 1.5s ease-out both; }
@keyframes cfpPop { 0% { opacity: 0; transform: translate(-50%, 24px) scale(.6); } 15% { opacity: 1; transform: translate(-50%, 0) scale(1.15); } 70% { opacity: 1; transform: translate(-50%, 0) scale(1); } 100% { opacity: 0; transform: translate(-50%, -30px); } }
.cfp .hit { position: absolute; left: 0; top: 0; right: 0; bottom: 0; pointer-events: none; opacity: 0; box-shadow: inset 0 0 90px 20px rgba(229,57,53,.7); transition: opacity .35s; }
.cfp .hit.on { opacity: 1; transition: none; }
.cfp .res { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: min(520px, 86vw); padding: 18px 20px; border-radius: 22px; background: rgba(19,27,46,.95); border: 1px solid #26324f; text-align: center; }
.cfp .res .hd { font-size: 12px; letter-spacing: .24em; color: ${ORANGE}; font-weight: 700; }
.cfp .res .tt { font-size: 40px; font-weight: 700; line-height: 1.05; margin-top: 4px; }
.cfp .res .nm { font-size: 20px; font-weight: 700; letter-spacing: .06em; margin-top: 2px; }
.cfp .res .se { font-size: 12px; letter-spacing: .14em; color: ${GOLD}; font-weight: 700; margin-top: 8px; }
.cfp .res .ft { font-size: 14px; font-weight: 700; color: #c9d2e6; margin-top: 12px; }
.cfp .res button { margin-top: 12px; width: 100%; min-height: 52px; border: 0; border-radius: 14px; background: ${GREEN}; color: #0b1a10; font: 700 18px/1 'Chakra Petch', ui-rounded, system-ui, sans-serif; letter-spacing: .1em; }
.cfp .skipb { position: absolute; left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); min-height: 46px; padding: 0 22px; border: 0; border-radius: 14px; background: rgba(19,27,46,.92); box-shadow: inset 0 0 0 2px #33415f; color: #fff; font: 700 15px/1 'Chakra Petch', ui-rounded, system-ui, sans-serif; letter-spacing: .08em; }
.cfp .turn { position: absolute; left: 50%; top: calc(128px + env(safe-area-inset-top, 0px)); transform: translateX(-50%); display: none; align-items: center; padding: 8px 14px; border-radius: 12px; background: rgba(255,138,31,.16); color: #ffd7ad; font-size: 13px; font-weight: 700; white-space: nowrap; }
.cfp .turn svg { width: 22px; height: 22px; margin-right: 8px; animation: cfpTurn 2.4s ease-in-out infinite; }
@keyframes cfpTurn { 0%, 30% { transform: rotate(0); } 60%, 100% { transform: rotate(-90deg); } }
@media (orientation: portrait) {
  .cfp .turn { display: flex; }
  .cfp .bars { width: calc(100vw - 24px); }
  .cfp .lz { top: 40%; width: 52%; }
  .cfp .rz { bottom: calc(8px + env(safe-area-inset-bottom, 0px)); }
  .cfp .msg { top: 34%; }
  .cfp .warn { top: 30%; }
}
@media (orientation: landscape) and (max-height: 380px) {
  .cfp .chips { top: calc(84px + env(safe-area-inset-top, 0px)); font-size: 12px; }
  .cfp .bars { top: calc(50px + env(safe-area-inset-top, 0px)); }
}
@media (prefers-reduced-motion: reduce) { .cfp-g .car.drop, .cfp-g .car.away, .cfp-g .sh.drop, .cfp-g .sh.away, .cfp .pop.go, .cfp .warn.bomb, .cfp .turn svg { animation-duration: .01s; } }
`].join('\n');

  // the thumbstick's carving: four arrows and the words along the bottom of the ring, each cut three times (a dark
  // edge above, a light edge below, then the groove itself), in a 200 by 200 box (the TV's drawing of the phone carves the same)
  const escX = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function stickArt(words) {
    const t = escX(String(words || '').toUpperCase()), fs = Math.max(9, Math.min(15, 190 / Math.max(1, t.length * 0.74)));
    const ar = 'M100 8l11 13H89zM100 192l11-13H89zM8 100l13-11v22zM192 100l-13-11v22z';
    const tx = (cls, dy) => '<text class="' + cls + '" font-size="' + fs.toFixed(1) + '"' + (dy ? ' dy="' + dy + '"' : '') + '><textPath href="#cfpArc" xlink:href="#cfpArc" startOffset="50%" text-anchor="middle">' + t + '</textPath></text>';
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><defs><path id="cfpArc" d="M28 100a72 72 0 0 0 144 0"/></defs>' +
      '<path class="sd" transform="translate(0 -1.2)" d="' + ar + '"/><path class="hl" transform="translate(0 1.8)" d="' + ar + '"/><path class="cv" d="' + ar + '"/>' +
      tx('sd', -1.2) + tx('hl', 1.8) + tx('cv') + '</svg>';
  }

  // ---------- the phone answers what the car does: a buzz for each thing, in its own rhythm ----------
  // (Android phones play each pattern on their vibration motor. iPhones: Safari lets a page buzz only one way, the
  // light tick of a switch (iOS 18 and later), so an iPhone ticks where an Android phone plays the pattern. The host
  // can turn it off for everyone with Phone vibration. Never more than about 15 buzzes a second.)
  const HAP = { tap: [8], stick: [6], edge: [5], fire: [24], dry: [6], boost: [18], rumble: [9], jump: [12, 45, 24], swap: [7, 35, 7],
    pick: [10, 40, 18], ko: [30, 50, 70], fell: [140, 60, 220], out: [280], back: [20, 60, 20], emp: [50, 40, 50, 40, 50], go: [45], win: [40, 70, 40, 70, 180], ready: [14] };
  let hapAt = 0, hapSw = null;
  const hapOn = () => !((X.g && X.g.hap === 0) || (X.m && X.m.hap === 0));
  function hap(kind, k) {
    if (!hapOn()) return;
    const t = Date.now(), big = kind === 'fell' || kind === 'out' || kind === 'win' || kind === 'ko';
    if (!big && t - hapAt < 65) return;
    hapAt = t;
    // (a harder knock buzzes longer)
    const pat = kind === 'hit' ? [Math.round(12 + Math.max(0, Math.min(9, +k || 0)) * 6)] : HAP[kind] || HAP.tap;
    try { if (navigator.vibrate && navigator.vibrate(pat)) return; } catch (e) {}
    tick();
  }
  function tick() {
    try {
      if (hapSw === null) {
        const i = document.createElement('input');
        if (!('switch' in i)) { hapSw = false; return; }
        const l = document.createElement('label');
        l.setAttribute('aria-hidden', 'true');
        l.style.cssText = 'position:fixed;left:-50px;top:0;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none';
        i.type = 'checkbox'; i.setAttribute('switch', ''); i.tabIndex = -1;
        l.appendChild(i); l.addEventListener('click', e => e.stopPropagation());
        document.body.appendChild(l); hapSw = l;
      }
      if (hapSw) hapSw.click();
    } catch (e) {}
  }

  let A = null;   // what party.js lends: el, send, G, view, buzz, toast, sheet, btn, myPic, T, more, pipe, numFmt
  const X = { g: null, m: null, st: null, stAt: 0, ui: null, ctl: null, pick: -1, shown: -1, sendT: 0, sent: -1, wantReady: false, pipe: null, pipeTry: 0, pipeAt: 0, lastSig: '', lastAt: 0,
    J: { id: null, x0: 0, y0: 0, steer: 0, gas: 0, brake: 0 }, boost: false, ac: null, bufs: new Map(), loop: 0, syncAt: 0, mode: '', popT: 0, hitT: 0 };
  const T = (t, v) => (A && A.T ? A.T(t, v) : t);
  function css() { if (document.getElementById('cfp-css')) return; const st = document.createElement('style'); st.id = 'cfp-css'; st.textContent = CSS; document.head.appendChild(st); }
  function init(api) { A = api; css(); }
  const myId = () => (A && A.G ? A.G.id : '');
  const saved = () => { try { const t = localStorage.getItem('cfa:car'); const v = t == null || t === '' ? -1 : +t; return v >= 0 && v < 16 && Number.isInteger(v) ? v : -1; } catch (e) { return -1; } };
  const keep = i => { try { localStorage.setItem('cfa:car', String(i)); } catch (e) {} };
  // (what the TV last said about this phone's car in the garage: [car, ready, waiting for the next round])
  const mine = () => (X.g && X.g.cars && Array.isArray(X.g.cars[myId()]) ? X.g.cars[myId()] : null);
  const inMatch = () => !!(X.g && X.g.ph === 'match' && mine() && !mine()[2]);

  // ---------- the car sounds: the game's own engine starting and turning off (no music here) ----------
  function ac() {
    if (X.ac) return X.ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { X.ac = new AC(); } catch (e) { X.ac = null; }
    return X.ac;
  }
  function unlock() { const a = ac(); if (a && a.state !== 'running') { try { a.resume(); } catch (e) {} } }
  function buf(name) {
    if (X.bufs.has(name)) return X.bufs.get(name);
    const a = ac();
    if (!a) return Promise.resolve(null);
    const p = fetch(HERE + 'cfa/ph/' + name + '.mp3', { credentials: 'omit' }).then(r => (r.ok ? r.arrayBuffer() : null))
      .then(ab => (ab ? new Promise(res => { const d = a.decodeAudioData(ab, res, () => res(null)); if (d && d.then) d.then(res, () => res(null)); }) : null)).catch(() => null);
    X.bufs.set(name, p);
    return p;
  }
  // (the game's own levels: the start 0.85, the turning off 0.75, under the phone's own volume)
  function play(name, gain, at) {
    const a = ac();
    if (!a || a.state !== 'running') return;
    buf(name).then(b => {
      if (!b || !X.ac) return;
      const s = a.createBufferSource(), g = a.createGain();
      s.buffer = b; g.gain.value = gain; s.connect(g); g.connect(a.destination);
      try { s.start(a.currentTime + Math.max(0, at || 0)); } catch (e) {}
    });
  }

  // ---------- messages from the TV ----------
  function onMsg(m) {
    if (!m || m.k !== 'cfa' || typeof m.t !== 'string') return;
    if (m.t === 'g') {
      if (X.g && typeof m.v === 'number' && typeof X.g.v === 'number' && m.v < X.g.v && m.ph === X.g.ph) return;
      const was = inMatch();
      X.g = m;
      const my = mine();
      // (this phone's car, as the TV has it; a car this phone picked a moment ago wins until the TV has it too)
      if (my && X.sent < 0 && X.pick < 0) {
        const sv = saved();
        if (sv >= 0 && sv !== my[0] && m.ph === 'garage') pickCar(sv, true); else X.pick = my[0];
      } else if (my && X.sent >= 0 && my[0] === X.sent) X.sent = -1;
      if (X.wantReady && my && !my[1] && m.ph === 'garage' && X.sent < 0) X.wantReady = false;
      pipeUp();
      if (inMatch() !== was) draw(); else if (!inMatch()) garageUpd(); else ctlUpd();
      return;
    }
    if (m.t === 'm' || m.t === 's') {
      X.m = m.m || X.m;
      const st = m.t === 's' ? m.s : m.st && m.st[myId()];
      if (st && typeof st === 'object') { X.st = st; X.stAt = Date.now(); }
      if (!X.g || X.g.ph !== 'match') { askSync(); return; }
      if (inMatch()) { if (!X.ctl) draw(); else ctlUpd(); } else garageUpd();
      return;
    }
    if (m.t === 'e') return onEvent(m);
    // (the end: which car each one drove, for the picture the phone shares)
    if (m.t === 'fin' && m.cars && typeof m.cars === 'object') X.fin = m.cars;
  }
  function askSync() { const t = Date.now(); if (t - X.syncAt < 1500) return; X.syncAt = t; send1('sync'); }
  // (something that was this player's alone: a knockout, out, back in, a pickup)
  function onEvent(m) {
    if (!X.ctl) return;
    const x = typeof m.x === 'string' ? A.clean(m.x, 60) : '';
    if (m.e === 'hit') { flashHit(0.6); hap('hit', m.x); return; }
    if (m.e === 'ko') { popText(T('Knockout! {name} is off', { name: x }), GREEN); hap('ko'); return; }
    if (m.e === 'fell') { popText(x ? T('{name} knocked you off', { name: x }) : T('You fell off!'), RED); flashHit(1); hap('fell'); return; }
    if (m.e === 'out') { hap('out'); return; }
    if (m.e === 'back') { popText(T('Back in!'), GREEN); hap('back'); return; }
    if (m.e === 'pop' || m.e === 'tell') { popText(x, typeof m.c === 'string' && /^#[0-9a-f]{3,8}$/i.test(m.c) ? m.c : '#fff'); return; }
    if (m.e === 'emp') { popText('EMP', BLUE); hap('emp'); }
    if (m.e === 'pick') hap('pick');
  }

  // ---------- the straight line to the TV (a pipe): many times a second, when the networks allow it ----------
  function pipeUp() {
    if (!A || !A.pipe || !X.g || (X.pipe && !X.pipe.gone)) return;
    const t = Date.now();
    if (X.pipeTry >= 6 || t - X.pipeAt < (X.pipeTry ? 8000 * X.pipeTry : 0)) return;
    X.pipeTry++; X.pipeAt = t;
    let p;
    try { p = A.pipe(); } catch (e) { return; }
    if (!p || !p.then) return;
    p.then(pp => {
      if (!pp) return;
      X.pipe = pp;
      pp.onMsg = m => onMsg(m);
      pp.onClose = () => { if (X.pipe === pp) X.pipe = null; };
      X.pipeTry = 0;
    }, () => {});
  }
  const pipeOpen = () => !!(X.pipe && X.pipe.open && X.pipe.open());
  function send1(a, more) {
    const m = Object.assign({ k: 'cfa', a }, more || {});
    if (pipeOpen() && a !== 'pick' && a !== 'ready' && a !== 'go' && a !== 'next') { if (X.pipe.send(m)) return; }
    A.send(m);
  }

  // ---------- the garage ----------
  function draw() {
    if (!A) return;
    if (inMatch()) return controller();
    closeCtl();
    garage();
  }
  function closeCtl() {
    if (!X.ctl) return;
    clearInterval(X.loop); X.loop = 0; clearInterval(X.rumble);
    if (X.ctl.root.isConnected) X.ctl.root.remove();
    X.ctl = null;
    X.J.id = null; X.boost = false;
    document.documentElement.classList.remove('cfp-on');
    sendPad(true);
  }
  function pickCar(i, quiet) {
    i = ((i % 16) + 16) % 16;
    const old = X.pick;
    X.pick = i; keep(i);
    if (!quiet) unlock();
    if (X.ui && X.ui.stage) showCar(old, i);
    // (the TV drops the car the player stops on: flipping through quickly drops only the last one)
    clearTimeout(X.sendT);
    X.sendT = setTimeout(() => { X.sent = i; send1('pick', { i }); }, quiet ? 0 : 350);
    X.wantReady = false;
    garageUpd();
  }
  function showCar(old, i) {
    const u = X.ui;
    if (!u || !u.stage.isConnected) return;
    if (u.car && old >= 0 && old !== i) {
      for (const gone of [u.car, u.sh]) { gone.classList.remove('drop'); void gone.offsetWidth; gone.classList.add('away'); setTimeout(() => gone.remove(), 420); }
      play('stop' + nn(old), 0.75 * 0.8);
    } else if (u.car) { u.car.remove(); u.sh.remove(); }
    // (its shadow lands with it, under its wheels)
    const sh = A.el('div', 'sh drop', u.scene); A.el('img', '', sh).src = shOf(i);
    const c = A.el('div', 'car drop', u.scene); const im = A.el('img', '', c); im.src = picOf(i); im.alt = CARS[i][0];
    u.car = c; u.sh = sh;
    u.scene.appendChild(u.dust);
    // (the landing: the dust, a little bump, and the engine starting the way the game starts it)
    clearTimeout(u.landT);
    u.landT = setTimeout(() => { u.dust.classList.remove('on'); void u.dust.offsetWidth; u.dust.classList.add('on'); try { if (navigator.vibrate) navigator.vibrate(18); } catch (e) {} play('start' + nn(i), 0.85 * 0.8); }, 470);
    // (the next car's pictures and sounds, ready before they are needed)
    for (const k of [i + 1, i + 15]) { const j = k % 16; for (const src of [picOf(j), shOf(j)]) { const p = new Image(); p.src = src; } }
    buf('start' + nn(i)); buf('stop' + nn(i));
  }
  function garage() {
    const v = A.view();
    document.documentElement.classList.add('cfp-pick');
    const w = A.el('div', 'cfp-g', v.body);
    const stage = A.el('div', 'stage', w);
    const scene = A.el('div', 'scene', stage);
    A.el('img', 'disc', A.el('div', '', scene)).src = HERE + 'cfa/ph/disc.webp';
    const dust = A.el('div', 'dust', scene);
    // (the scene as big as the stage lets it be, in the pictures' own shape)
    const fit = () => { if (!scene.isConnected) { window.removeEventListener('resize', fit); return; } const W = stage.clientWidth || 1, H = stage.clientHeight || 1, w = Math.min(W, H * SCENE); scene.style.width = Math.round(w) + 'px'; scene.style.height = Math.round(w / SCENE) + 'px'; };
    window.addEventListener('resize', fit);
    const l = A.el('button', 'arr l', stage); l.type = 'button'; l.innerHTML = ICON.prev; l.setAttribute('aria-label', T('Previous car'));
    const r = A.el('button', 'arr r', stage); r.type = 'button'; r.innerHTML = ICON.next; r.setAttribute('aria-label', T('Next car'));
    l.onclick = () => { hap('tap'); pickCar(X.pick - 1); };
    r.onclick = () => { hap('tap'); pickCar(X.pick + 1); };
    // (a swipe on the car flips to the next one too)
    let sx = null;
    stage.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; sx = e.clientX; });
    stage.addEventListener('pointerup', e => { if (sx == null) return; const d = e.clientX - sx; sx = null; if (Math.abs(d) > 40) { hap('tap'); pickCar(X.pick + (d < 0 ? 1 : -1)); } });
    stage.addEventListener('pointercancel', () => { sx = null; });
    const info = A.el('div', 'info', w);
    const nm = A.el('div', 'nm', info), nb = A.el('div', 'nb', info);
    const sts = A.el('div', 'stats', info), bars = [];
    [T('SPEED'), T('ACCEL'), T('WEIGHT'), T('HANDLING')].forEach(t => { A.el('span', '', sts, t); const b = A.el('b', '', A.el('i', '', sts)); bars.push([b, A.el('em', '', sts)]); });
    const th = A.el('div', 'thumbs', info);
    const tb = CARS.map((c, i) => { const b = A.el('button', '', th); b.type = 'button'; b.setAttribute('aria-label', c[0]); const im = A.el('img', '', b); im.loading = 'lazy'; im.src = picOf(i); im.alt = ''; b.onclick = () => { hap('tap'); if (i !== X.pick) pickCar(i); }; return b; });
    const late = A.el('div', 'late', info, T('You play from the next round. Pick your car now.'));
    const say = A.el('div', 'say', info);
    const rdy = A.el('button', 'rdy', info); rdy.type = 'button';
    rdy.onclick = () => { unlock(); const on = !(mine() && mine()[1]) && !X.wantReady; X.wantReady = on; if (X.sendT) { clearTimeout(X.sendT); X.sendT = 0; X.sent = X.pick; send1('pick', { i: X.pick }); } send1('ready', { on }); hap(on ? 'ready' : 'tap'); garageUpd(); };
    const go = A.el('button', 'hostgo', info, T('Start the match')); go.type = 'button';
    go.onclick = () => { hap('go'); send1('go'); };
    X.ui = { stage, scene, dust, car: null, sh: null, nm, nb, bars, tb, late, say, rdy, go, landT: 0 };
    fit(); requestAnimationFrame(fit);
    if (X.pick < 0) { const my = mine(); X.pick = my ? my[0] : saved() >= 0 ? saved() : 0; }
    showCar(-1, X.pick);
    garageUpd();
  }
  function garageUpd() {
    const u = X.ui;
    if (!u || !u.stage.isConnected) { if (A && A.G && A.G.phase === 'play' && !inMatch()) draw(); return; }
    const i = X.pick < 0 ? 0 : X.pick, c = CARS[i], my = mine(), g = X.g || {};
    if (u.nm.textContent !== c[0]) u.nm.textContent = c[0];
    u.nb.textContent = (i + 1) + ' / 16';
    c[1].forEach((v, k) => { u.bars[k][0].style.width = v + '%'; u.bars[k][1].textContent = String(v); });
    u.tb.forEach((b, k) => b.classList.toggle('on', k === i));
    const on = u.tb[i]; if (on && on.scrollIntoView && u.lastOn !== i) { u.lastOn = i; try { on.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); } catch (e) {} }
    const waiting = !!(g.ph === 'match' && (!my || my[2]));
    u.late.hidden = !waiting;
    const ready = !!(my && my[1]) || X.wantReady;
    u.rdy.classList.toggle('on', ready);
    u.rdy.innerHTML = '';
    if (ready) u.rdy.insertAdjacentHTML('afterbegin', ICON.ok);
    u.rdy.appendChild(document.createTextNode(ready ? T('Ready!') : T('I\'m ready!')));
    u.rdy.hidden = waiting;
    u.go.hidden = !(A.G.host && g.ph === 'garage');
    const ids = Object.keys(g.cars || {}), n = ids.filter(k => !(g.cars[k] || [])[2]).length, r = ids.filter(k => (g.cars[k] || [])[1] && !(g.cars[k] || [])[2]).length;
    u.say.classList.toggle('go', !!g.go);
    u.say.textContent = g.ph !== 'garage' ? '' : g.go ? T('Starting in {n}', { n: g.go }) : n > 1 ? T('Ready: {a} of {b}', { a: r, b: n }) : '';
  }

  // ---------- the controller ----------
  const PAD = { steer: 0, gas: 0, brake: 0 };
  function controller() {
    if (X.ctl && X.ctl.root.isConnected) { ctlUpd(); return; }
    X.ui = null;
    document.documentElement.classList.remove('cfp-pick');
    document.documentElement.classList.add('cfp-on');
    const root = A.el('div', 'cfp', document.body);
    root.addEventListener('contextmenu', e => e.preventDefault());
    const top = A.el('div', 'top', root);
    const me = A.el('div', 'me', top), im = A.el('img', '', me); im.src = A.myPic(); im.alt = ''; A.el('b', '', me, A.G.name || '');
    const clk = A.el('div', 'clk', top), clR = A.el('i', '', clk), clT = A.el('span', '', clk);
    const rt = A.el('div', 'rt', top), pl = A.el('div', 'pl', rt);
    const more = A.el('button', 'more', rt); more.type = 'button'; more.innerHTML = ICON.dots; more.setAttribute('aria-label', T('Menu'));
    more.onclick = () => { hap('tap'); A.more(); };
    const bars = A.el('div', 'bars', root);
    bars.appendChild(document.createTextNode('BOOST')); const bb = A.el('b', '', A.el('i', '', bars)); bb.style.background = ORANGE;
    bars.appendChild(document.createTextNode('DAMAGE')); const db = A.el('b', '', A.el('i', '', bars)); db.style.background = RED;
    const chips = A.el('div', 'chips', root), chK = A.el('span', '', chips), chS = A.el('span', '', chips);
    const turn = A.el('div', 'turn', root); turn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="#ffd7ad" stroke-width="2"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>';
    turn.appendChild(document.createTextNode(T('Turn your phone sideways to drive.')));
    const warn = A.el('div', 'warn', root); warn.hidden = true;
    const hit = A.el('div', 'hit', root);
    const pop = A.el('div', 'pop', root);
    const msg = A.el('div', 'msg', root);
    // the stick
    const lz = A.el('div', 'lz', root);
    const joy = A.el('div', 'joy', root);
    joy.innerHTML = stickArt(T('Drive and steer'));
    const kn = A.el('div', 'kn', joy);
    // the buttons
    const rz = A.el('div', 'rz', root);
    const mk = (cls, label) => { const b = A.el('div', 'b ' + cls, rz); A.el('div', 'wl', b); const cap = A.el('div', 'cap', b); cap.innerHTML = ICON[cls]; const s = A.el('span', '', cap, label); return { b, s, cap }; };
    const fire = mk('fire', T('Fire').toUpperCase()), boost = mk('boost', T('Boost').toUpperCase()), jump = mk('jump', T('Jump').toUpperCase()), swap = mk('swap', T('Change weapon').toUpperCase());
    const fireN = A.el('small', '', fire.cap);
    const res = A.el('div', 'res', root); res.hidden = true;
    // (the host can skip the replay of the final knockout)
    const skipB = A.el('button', 'skipb', root, T('Skip the replay')); skipB.type = 'button'; skipB.hidden = true;
    skipB.onclick = () => { hap('tap'); send1('skip'); skipB.hidden = true; };
    X.ctl = { root, im, clR, clT, pl, bb, db, chK, chS, warn, hit, pop, msg, lz, joy, kn, rz, fire, boost, jump, swap, fireN, res, turn, skipB, sig: '' };
    layout();
    // (the stick: the thumb goes down anywhere on the left half, and the stick is there)
    const J = X.J;
    const jmove = e => {
      const c = X.ctl; if (!c) return;
      const R = c.jr || 60;
      let dx = e.clientX - J.x0, dy = e.clientY - J.y0;
      const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d; }
      if (d >= R * 0.97) { if (!J.edge) { J.edge = true; hap('edge'); } } else if (d < R * 0.8) J.edge = false;
      c.kn.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      // (the game's own: a little play in the middle, up from a fifth of the way is the gas, down past a third the brake)
      const nx = dx / R, ny = dy / R;
      PAD.steer = Math.abs(nx) < 0.12 ? 0 : nx;
      PAD.gas = -ny > 0.2 ? Math.min(1, (-ny - 0.1) / 0.6) : 0;
      PAD.brake = ny > 0.35 ? 1 : 0;
    };
    lz.addEventListener('pointerdown', e => {
      e.preventDefault(); unlock();
      if (J.id != null) return;
      J.id = e.pointerId; J.edge = false; hap('stick');
      try { lz.setPointerCapture(e.pointerId); } catch (er) {}
      const c = X.ctl, box = c.root.getBoundingClientRect();
      // (the stick stays on the screen even when the thumb comes down close to the edge)
      const R = c.jd / 2;
      J.x0 = Math.max(box.left + R + 6, Math.min(box.left + box.width / 2 - R, e.clientX));
      J.y0 = Math.max(box.top + R + 40, Math.min(box.bottom - R - 6, e.clientY));
      c.joy.style.left = (J.x0 - box.left) + 'px'; c.joy.style.top = (J.y0 - box.top) + 'px';
      c.joy.classList.add('on');
      jmove(e);
      sendPad();
    });
    lz.addEventListener('pointermove', e => { if (e.pointerId !== J.id) return; e.preventDefault(); jmove(e); });
    const jup = e => {
      if (e.pointerId !== J.id) return;
      J.id = null; PAD.steer = 0; PAD.gas = 0; PAD.brake = 0;
      const c = X.ctl; if (!c) return;
      c.kn.style.transform = ''; c.joy.classList.remove('on');
      c.joy.style.left = c.jx + 'px'; c.joy.style.top = c.jy + 'px';
      sendPad();
    };
    lz.addEventListener('pointerup', jup); lz.addEventListener('pointercancel', jup); lz.addEventListener('lostpointercapture', jup);
    // (Fire, Jump and Change weapon act once on each press; Boost works while it is held)
    const once = (o, a) => {
      o.b.addEventListener('pointerdown', e => { e.preventDefault(); unlock(); o.b.classList.add('dn'); try { o.b.setPointerCapture(e.pointerId); } catch (er) {} send1(a); hap(o.b.classList.contains('off') ? 'dry' : a); });
      const up = () => o.b.classList.remove('dn');
      o.b.addEventListener('pointerup', up); o.b.addEventListener('pointercancel', up); o.b.addEventListener('lostpointercapture', up);
    };
    once(fire, 'fire'); once(jump, 'jump'); once(swap, 'swap');
    // (Boost: a push, then a low rumble for as long as it is held)
    boost.b.addEventListener('pointerdown', e => { e.preventDefault(); unlock(); boost.b.classList.add('dn'); try { boost.b.setPointerCapture(e.pointerId); } catch (er) {} X.boost = true; sendPad(); hap('boost'); clearInterval(X.rumble); X.rumble = setInterval(() => { if (X.boost) hap('rumble'); else clearInterval(X.rumble); }, 160); });
    const bup = () => { boost.b.classList.remove('dn'); clearInterval(X.rumble); if (X.boost) { X.boost = false; sendPad(); } };
    boost.b.addEventListener('pointerup', bup); boost.b.addEventListener('pointercancel', bup); boost.b.addEventListener('lostpointercapture', bup);
    window.addEventListener('resize', layout);
    // (sideways is best: on a phone in full screen, the screen turns and stays that way)
    try { if (document.fullscreenElement && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); } catch (e) {}
    clearInterval(X.loop);
    X.loop = setInterval(() => sendPad(), 33);
    ctlUpd();
  }
  // (the sizes follow the screen: the stick and the buttons as big as a thumb can use, on any phone, either way up)
  function layout() {
    const c = X.ctl;
    if (!c || !c.root.isConnected) { window.removeEventListener('resize', layout); return; }
    const W = c.root.clientWidth || innerWidth, H = c.root.clientHeight || innerHeight, land = W > H, m = Math.min(W, H);
    const jd = Math.round(land ? Math.max(120, Math.min(m * 0.5, 220)) : Math.max(110, Math.min(W * 0.36, 180)));
    c.jd = jd; c.jr = jd * 0.36;
    c.root.style.setProperty('--jd', jd + 'px');
    c.jx = Math.round(land ? Math.max(jd / 2 + 24, W * 0.2) : jd / 2 + 14);
    c.jy = Math.round(land ? H - jd / 2 - Math.max(22, H * 0.1) : H - jd / 2 - 40);
    if (X.J.id == null) { c.joy.style.left = c.jx + 'px'; c.joy.style.top = c.jy + 'px'; }
    // the four buttons around the corner: Fire biggest, then Boost to its left, Jump up and to the left, Change
    // weapon above it (an arc a right thumb sweeps across)
    const f = Math.round(land ? Math.max(84, Math.min(m * 0.36, 150)) : Math.max(72, Math.min(W * 0.24, 120)));
    const s2 = Math.round(f * 0.72), s3 = Math.round(f * 0.6);
    const rw = Math.round(f * 2.55), rh = Math.round(f * 2.45);
    c.root.style.setProperty('--rw', rw + 'px'); c.root.style.setProperty('--rh', rh + 'px');
    const put = (o, size, cx, cy) => { const b = o.b; b.style.width = b.style.height = size + 'px'; b.style.left = (cx - size / 2) + 'px'; b.style.top = (cy - size / 2) + 'px'; };
    const fx = rw - f / 2 - (land ? 26 : 14), fy = rh - f / 2 - (land ? 22 : 14);
    put(c.fire, f, fx, fy);
    put(c.boost, s2, fx - f * 1.12, fy + f * 0.06);
    put(c.jump, s2, fx - f * 0.86, fy - f * 0.86);
    put(c.swap, s3, fx + f * 0.04, fy - f * 1.08);
    c.fire.s.style.fontSize = Math.round(f * 0.1) + 'px';
  }
  // the moves: through the pipe up to 30 times a second (and a "still here" 4 times a second); through the relays at
  // most about 6 a second, once a second while something is held (the TV lets go of a car after 3 quiet seconds), and
  // a "still here" every 3 seconds (after 8 quiet seconds the computer drives the car until the phone is back)
  function sendPad(force) {
    const pad = { s: Math.round(PAD.steer * 100), g: Math.round(PAD.gas * 100), b: PAD.brake ? 1 : 0, o: X.boost ? 1 : 0 };
    const sig = pad.s + ',' + pad.g + ',' + pad.b + ',' + pad.o, t = performance.now(), zero = !pad.s && !pad.g && !pad.b && !pad.o;
    if (!X.ctl && !force) return;
    if (pipeOpen()) {
      if (sig !== X.lastSig || t - X.lastAt > 250 || force) { if (X.pipe.send(Object.assign({ k: 'cfa', a: 'in' }, pad))) { X.lastSig = sig; X.lastAt = t; return; } }
      else return;
    }
    if (force || (sig !== X.lastSig && t - X.lastAt > 160) || (!zero && t - X.lastAt > 1000) || t - X.lastAt > 3000) { A.send(Object.assign({ k: 'cfa', a: 'in' }, pad)); X.lastSig = sig; X.lastAt = t; }
  }
  function popText(t, col) {
    const c = X.ctl;
    if (!c || !t) return;
    c.pop.textContent = t; c.pop.style.color = col || '#fff';
    c.pop.classList.remove('go'); void c.pop.offsetWidth; c.pop.classList.add('go');
  }
  function flashHit(v) {
    const c = X.ctl;
    if (!c) return;
    c.hit.style.opacity = String(v);
    c.hit.classList.add('on');
    clearTimeout(X.hitT);
    X.hitT = setTimeout(() => { if (X.ctl) { X.ctl.hit.classList.remove('on'); X.ctl.hit.style.opacity = ''; } }, 90);
  }
  function ctlUpd() {
    const c = X.ctl;
    if (!c) { if (inMatch()) controller(); return; }
    const s = X.st || {}, m = X.m || {};
    if (s.col) c.root.style.setProperty('--pc', s.col);
    if (c.clR.textContent !== (m.r || '')) c.clR.textContent = m.r || '';
    if (c.clT.textContent !== (m.t || '')) c.clT.textContent = m.t || '';
    c.pl.innerHTML = '';
    if (s.pl && s.n) { const b = document.createElement('b'); b.textContent = String(s.pl); c.pl.appendChild(b); c.pl.appendChild(document.createTextNode(' / ' + s.n)); }
    c.bb.style.width = Math.max(0, Math.min(100, +s.b || 0)) + '%';
    c.db.style.width = Math.max(0, Math.min(100, +s.d || 0)) + '%';
    const md = m.mode || (X.g && X.g.mode) || '';
    c.chK.innerHTML = ''; c.chS.innerHTML = '';
    const chip = (el, k, v) => { el.appendChild(document.createTextNode(k + ' ')); const b = document.createElement('b'); b.textContent = String(v); el.appendChild(b); };
    if (md === 'hill' || md === 'crown') chip(c.chK, 'PTS', Math.floor(+s.pts || 0)); else chip(c.chK, 'KO', +s.kos || 0);
    chip(c.chS, 'SCORE', +s.sc || 0);
    // (the weapon on the Fire button, the game's own way: its name, how many are left, and how many more it holds)
    const w = typeof s.w === 'string' ? s.w : '';
    c.fire.s.textContent = w ? w : T('Fire').toUpperCase();
    c.fireN.textContent = w ? '×' + (+s.a || 0) : '';
    c.fire.b.classList.toggle('off', !w);
    c.swap.b.classList.toggle('off', !(+s.n > 1));
    c.jump.b.classList.toggle('off', !s.j);
    // (the bomb, the crown)
    if (+s.bomb > 0) { c.warn.hidden = false; c.warn.className = 'warn bomb'; c.warn.textContent = T('Pass the bomb! {n}', { n: s.bomb }); }
    else if (s.crown) { c.warn.hidden = false; c.warn.className = 'warn crown'; c.warn.textContent = T('You have the crown!'); }
    else c.warn.hidden = true;
    // (the moments in the middle: the countdown, out, back in a moment, the end of a round)
    const ph = m.ph || '';
    let big = '', small = '';
    if (m.busy) small = T('Getting the cars ready...');
    else if (ph === 'countdown' && m.cnt) big = m.cnt;
    else if (ph === 'playing' && m.cnt === 'GO!') big = 'GO!';
    else if (ph === 'playing' && s.out) { big = 'OUT'; small = T('Watch the TV. You are back in the next round.'); }
    else if (ph === 'playing' && s.rsp) { big = ''; small = T('Knocked out. Back in a moment!'); }
    else if (ph === 'replay') small = T('Replay of the final knockout');
    const sig = big + '|' + small;
    if (c.sig !== sig) {
      c.sig = sig; c.msg.textContent = '';
      if (big) A.el('b', '', c.msg, big);
      if (small) A.el('span', '', c.msg, small);
      if (big === 'GO!') hap('go');
    }
    // (the results of a round, and the host's Next round)
    const R = m.res;
    if ((ph === 'victory' || ph === 'over') && R) {
      c.res.hidden = false;
      const rs = JSON.stringify(R) + (A.G.host ? 1 : 0);
      if (c.resSig !== rs) {
        if (!c.resSig && X.st && X.st.pl === 1) hap('win');
        c.resSig = rs; c.res.textContent = '';
        A.el('div', 'hd', c.res, R.h || '');
        A.el('div', 'tt', c.res, R.t || '');
        A.el('div', 'nm', c.res, R.n || '');
        if (R.s) A.el('div', 'se', c.res, R.s);
        if (R.more) {
          A.el('div', 'ft', c.res, R.auto ? T('Next round in {n}', { n: R.auto }) : A.G.host ? '' : T('The host starts the next round.'));
          if (A.G.host) { const b = A.el('button', '', c.res, T('Next round')); b.type = 'button'; b.onclick = () => { hap('go'); send1('next'); }; }
        } else A.el('div', 'ft', c.res, T('Look at the TV!'));
      }
    } else { c.res.hidden = true; c.resSig = ''; }
    c.skipB.hidden = !(ph === 'replay' && A.G.host);
  }
  // (the host's own buttons in the ⋯ menu: the TV's view, the next round, the replay)
  const VIEWS = [['auto', 'Automatic'], ['arena', 'Arena'], ['top', 'From above'], ['action', 'Action'], ['chase', 'Chase'], ['split', 'Split screen']];
  function menu(sh, close, mkBtn) {
    if (!A || !A.G.host) return;
    const l = A.G.lobby || {}, cur = (l.settings || {}).view || 'auto';
    A.el('label', 'pt-lbl', sh, T('TV view'));
    const box = A.el('div', '', sh);
    box.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;grid-gap:8px;gap:8px;margin-top:6px';
    for (const [k, t] of VIEWS) {
      const b = A.el('button', '', box, T(t)); b.type = 'button';
      b.style.cssText = 'min-height:46px;border-radius:14px;border:1px solid ' + (k === cur ? ORANGE : 'rgba(255,255,255,.16)') + ';background:' + (k === cur ? 'rgba(255,138,31,.18)' : 'rgba(255,255,255,.05)') + ';color:inherit;font:700 15px/1.2 inherit';
      b.onclick = () => { A.send({ k: 'set', key: 'view', v: k }); hap('tap'); close(); };
    }
    const m = X.m || {};
    if (X.g && X.g.ph === 'garage') mkBtn(T('Start the match'), () => { send1('go'); close(); });
    if (m.res && m.res.more) mkBtn(T('Next round'), () => { send1('next'); close(); });
    if (m.ph === 'replay') mkBtn(T('Skip the replay'), () => { send1('skip'); close(); });
  }
  function reset() { closeCtl(); X.g = null; X.m = null; X.st = null; X.fin = null; X.ui = null; X.sent = -1; X.wantReady = false; X.pick = -1; X.pipeTry = 0; if (X.pipe) { try { X.pipe.close(); } catch (e) {} X.pipe = null; } document.documentElement.classList.remove('cfp-pick'); }
  function left() { closeCtl(); X.ui = null; document.documentElement.classList.remove('cfp-pick'); if (X.pipe) { try { X.pipe.close(); } catch (e) {} X.pipe = null; } X.pipeTry = 0; }
  // (the car someone drove: the TV says it at the end, and in the garage)
  function carOf(id) { const f = X.fin && X.fin[id]; if (Number.isInteger(f) && f >= 0 && f < 16) return f; const g = X.g && X.g.cars && X.g.cars[id]; return Array.isArray(g) && Number.isInteger(g[0]) ? g[0] : -1; }
  return { init, onMsg, draw, reset, left, menu, css, CARS, carOf, get on() { return !!X.g; }, get inMatch() { return inMatch(); } };
})();
