// Blokvane on your phone: party games. Join the game on the TV (scan its QR code, or type the 6 letters under it),
// pick a name and a Boo (or take a selfie: it only ever goes to that TV, which never saves it), and play. Each
// question shows here the way its game needs it: big colored buttons, typing, a map to drop a pin on, a bingo card,
// shaking or tilting the phone. The first phone in is the host: it picks the game, its settings and the language.
// Everything goes sealed and signed through the same free public relays as the rest of Blokvane; there is no server.
(() => {
  'use strict';
  const { el, view, btn, toast, buzz, hero, input, store, seg, toggle, sheet, confetti } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('party', async (kind, parts, o) => (kind === 'code' ? codeScreen() : kind === 'start' ? startScreen(o || {}) : start(parts)));

  // The words. The seven game languages have their own (../play/i18n.js and ../play/lang/*.js, the same words the TV
  // uses); for any other language the TV sends these translated by Chrome on a computer.
  const STR0 = {
    join: 'Join the game', name: 'Your name', pickBoo: 'Pick your Boo', selfie: 'Take a selfie', ready: 'I\'m ready!', notReady: 'Not ready yet', host: 'You\'re the host', hostWait: 'Waiting for the host to start',
    start: 'Start the game', settings: 'Game settings', look: 'Look at the TV!', answered: 'Got it! Waiting for the others...', right: 'Right!', wrong: 'Not this time', out: 'You\'re out, but you can still help!',
    again: 'Play again', otherGame: 'Pick another game', you: 'You', points: 'points', place: 'place', send: 'Send', typeHere: 'Type here', skip: 'Skip', done: 'Done',
    helpers: 'Helpers', fifty: 'Remove two', hint: 'Hint', auto: 'Answer it for me', ask: 'Ask everyone', peek: 'Hold to peek', imposter: 'You\'re the imposter!', vote: 'Vote', bingo: 'BINGO!',
    yourTurn: 'Your turn!', team: 'Team', guess: 'Your guess', dropPin: 'Drop your pin', zoom: 'Pinch to zoom, tap to drop the pin',
    lockPin: 'Lock in my pin', giveFake: 'Give me a fake', yourEmoji: 'Your emoji', theAnswer: 'The answer', print: 'Print the paper cards', checkPaper: 'Check a paper card', cardNo: 'Card number', check: 'Check',
    holdTip: 'Hold it down to see your word. Let go to hide it.', category: 'Category', word: 'Your secret word', noWord: 'You get no word. Listen, and blend in!',
    marks: 'The numbers mark themselves', tapNums: 'Tap the numbers the TV calls', lang: 'Language', players: 'Players', pickGame: 'Pick a game',
    picking: 'The host is picking a game', timeUp: 'Time\'s up!', theRight: 'The right answer:', yourPlace: 'Your place', of: 'of', first: 'You were the fastest!', youPicked: 'You picked',
    red: 'Red', blue: 'Blue', green: 'Green', gold: 'Gold', changeName: 'Change my name or Boo',
    needMore: 'This game needs more players', endGame: 'End the game', endSure: 'End the game now? The scores so far count.', keepPlaying: 'Keep playing', hostAgain: 'The host can play again or pick another game.', mine: 'That one is yours', imposterSays: 'Category:', helpers1: 'Each helper works once.',
    next: 'Next', back: 'Back', stepOf: '{n} of {total}', allSet: 'All set', readyQ: 'Ready to play?', editSet: 'Edit settings', none: 'None', hostBadge: 'Host', readyN: '{n} / {total} ready',
    myLang: 'Your language', sameTv: 'Same as the TV: {lang}', langFollow: 'The questions and answers show on the TV in {lang}. Pick another language to see them on your phone too.',
    langMine: 'Your phone shows each question and its answers in {lang}. The TV stays in {tv}.', removed: 'You\'re out of this game', removedWhy: 'The host took you out of the game. You can join again if you like.',
    joinAgain: 'Join again', hostTools: 'Host tools', showCode: 'Show the join code on the TV', hideCode: 'Hide the join code', codeOn: 'The join code is on the TV. New players scan it to join.',
    makeHost: 'Make host', remove: 'Remove', tapAgain: 'Tap again to be sure', newHost: '{name} is the host now.', tvSize: 'TV size', autoSize: 'Auto', more: 'More', youHost: 'You\'re the host now.',
    leaveQ: 'Leave the game?', leaveWhy: 'Your score stays, and you can come back while the game is on.', leaveHost: 'You\'re the host. If you leave, someone else becomes the host.',
    stay: 'Stay', leave: 'Leave', closedT: 'The game was closed on the TV', thanks: 'Thanks for playing!',
    menu: 'Game menu', changePic: 'Change my picture', leaveGame: 'Leave the game', picDone: 'Picture changed'
  };
  const AVATARS = ['boo:hi', 'boo:laugh', 'boo:cool', 'boo:love', 'boo:wow', 'boo:party', 'boo:hero', 'boo:legend', 'boo:peek', 'boo:mind', 'boo:scary', 'boo:boo'];
  const ACOL = ['#ff5f57', '#3d8bff', '#ffbf3c', '#2fd59a', '#a46bff', '#ff7ac8'];
  const SHAPES = ['▲', '◆', '●', '■', '★', '♥'];
  const TEAMS = [['red', 'red', '#ff5f57'], ['blue', 'blue', '#3d8bff'], ['gold', 'gold', '#ffbf3c'], ['green', 'green', '#2fd59a']];
  // the languages (loaded with ../play/i18n.js): the seven full ones first, then the ones Chrome translates
  const I = () => window.BVI18N || null;
  const langsFull = () => (I() ? I().LANGS : [['en', 'English']]);
  const langsMore = () => (I() ? I().MORE : []);
  const booUri = id => (window.BVWATCH_BOO && BVWATCH_BOO.get(id)) ? BVWATCH_BOO.uri(id) : '';
  // each game's own icon (the TV's pictures, in ../play/icons: the same ones as on the TV and in Blokvane)
  const ICONS = new Set(['trivia', 'gir', 'boowho', 'world', 'fakeout', 'emoji', 'higher', 'bingo', 'imposter']);
  function gameIcon(id, e) {
    if (ICONS.has(id)) { const im = el('img', 'gi'); im.src = '../play/icons/' + id + '.webp'; im.alt = ''; return im; }
    return el('span', 'e', null, e || '🎲');
  }
  function booPic(id, cls) {
    const d = el('div', 'boo' + (cls ? ' ' + cls : ''));
    const src = booUri(id);
    if (src) { const im = el('img', '', d); im.src = src; im.alt = ''; } else d.innerHTML = GO.BOO_SVG;
    return d;
  }

  // ---------- the look (only these pages use it) ----------
  function css() {
    if (document.getElementById('pt-css')) return;
    const s = el('style', '', document.head);
    s.id = 'pt-css';
    s.textContent = `
.pt-me{display:flex;align-items:center;grid-gap: 12px;gap:12px;padding:10px 14px;border-radius:18px;background:var(--panel);border:1px solid var(--line);margin-bottom:14px}
html.no-flexgap .pt-me > * + * { margin-left: 12px; }
html.no-flexgap[dir="rtl"] .pt-me > * + * { margin-left: 0; margin-right: 12px; }
.pt-num{display:flex;align-items:center;grid-gap: 10px;gap:10px}
html.no-flexgap .pt-num > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-num > * + * { margin-left: 0; margin-right: 10px; }
.pt-num .input{max-width:130px;font:800 22px/1 var(--round);text-align:center}
.pt-num .u{color:var(--dim);font-weight:700}
.pt-quick{margin-top:10px}
.pt-next{position:fixed;left:16px;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:60;max-width:528px;margin:0 auto;animation:ptNext .4s cubic-bezier(.2,1.4,.4,1) both;filter:drop-shadow(0 10px 24px rgba(0,0,0,.45))}
@keyframes ptNext{from{transform:translateY(120%);opacity:0}}
.pt-me img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:#fff;flex:none}
.pt-me b{flex:1;font-size:17px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pt-me .pt-score{font:800 22px/1 var(--round);color:var(--sun)}
.pt-me .pt-hearts{font-size:15px;letter-spacing:1px}
.pt-me .pill{color:#0b0f17}
.pt-avs{display:grid;grid-template-columns:repeat(4,1fr);grid-gap: 10px;gap:10px;margin:10px 0 14px}
.pt-av{aspect-ratio:1;border-radius:20px;border:2px solid var(--line);background:var(--raise);padding:6px;display:grid;align-items: center; justify-items: center;place-items:center;transition:transform .12s}
.pt-av[aria-pressed=true]{border-color:var(--tint);background: var(--raise);background:color-mix(in srgb,var(--tint) 22%,var(--raise));transform:scale(1.05)}
.pt-av img{width:100%;height:100%;object-fit:contain}
.pt-selfie{display:flex;align-items:center;grid-gap: 12px;gap:12px}
html.no-flexgap .pt-selfie > * + * { margin-left: 12px; }
html.no-flexgap[dir="rtl"] .pt-selfie > * + * { margin-left: 0; margin-right: 12px; }
.pt-selfie img{width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--tint)}
.pt-q{font:800 22px/1.25 var(--round);text-align:center;margin:4px 4px 14px;overflow-wrap:anywhere}
.pt-q.emoji{font-size:54px;line-height:1.15}
.pt-look{font:800 17px/1.3 var(--round);text-align:center;margin:2px 4px 12px;color:var(--dim)}
.pt-ans{display:grid;grid-template-columns:1fr 1fr;grid-gap: 12px;gap:12px}
.pt-ans.one{grid-template-columns:1fr}
.pt-a{position:relative;min-height:100px;border:0;border-radius:22px;color:#fff;font:800 19px/1.2 var(--round);padding:14px 14px 14px 60px;text-align:start;box-shadow:0 6px 0 rgba(0,0,0,.3);background:var(--c);transition:transform .12s,opacity .25s,filter .25s;overflow-wrap:anywhere}
[dir=rtl] .pt-a{padding:14px 60px 14px 14px}
.pt-a.dark{color:#1d1530}
.pt-a:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.3)}
.pt-a .l{position:absolute;inset-inline-start:12px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:12px;background:rgba(0,0,0,.2);display:grid;align-items: center; justify-items: center;place-items:center;font-size:18px}
@supports not (inset-inline-start: 0) {
  .pt-a .l { left: 12px; }
  html[dir="rtl"] .pt-a .l { right: 12px; }
}
.pt-a.big{font-size:44px;padding:14px;text-align:center;justify-content:center}
.pt-a.big .l{top:12px;transform:none;width:28px;height:28px;font-size:13px}
.pt-a.gone{opacity:.14;filter:grayscale(1);pointer-events:none}
.pt-a.dim{opacity:.35;filter:grayscale(.6)}
.pt-a.mine{box-shadow:0 0 0 5px #fff,0 6px 0 rgba(0,0,0,.3);transform:scale(1.02)}
.pt-a .tally{position:absolute;inset-inline-end:10px;top:8px;font:800 14px var(--sans);background:rgba(0,0,0,.35);color:#fff;padding:3px 9px;border-radius:10px}
@supports not (inset-inline-end: 0) {
  .pt-a .tally { right: 10px; }
  html[dir="rtl"] .pt-a .tally { left: 10px; }
}
.pt-a small{display:block;font:600 12px var(--sans);opacity:.85;margin-top:4px}
.pt-timer{height:10px;border-radius:5px;background:var(--raise);overflow:hidden;margin:0 0 14px}
.pt-timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--bad),var(--sun) 30%,var(--ok));transform-origin:left center}
[dir=rtl] .pt-timer i{transform-origin:right center}
.pt-helpers{display:grid;grid-template-columns:repeat(4,1fr);grid-gap: 8px;gap:8px;margin-top:14px}
.pt-helpers button{border:1px solid var(--line);background:var(--raise);color:var(--text);border-radius:14px;min-height:62px;font:700 12.5px/1.15 var(--sans);padding:6px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;grid-gap: 4px;gap:4px}
html.no-flexgap .pt-helpers button > * + * { margin-top: 4px; }
.pt-helpers button span{font-size:20px}
.pt-helpers button:disabled{opacity:.3}
.pt-note{margin-top:14px;text-align:center;color:var(--dim);font-weight:600}
.pt-hint{margin-top:14px;border-radius:16px;padding:12px 14px;background: var(--raise);background:color-mix(in srgb,var(--sun) 16%,var(--raise));border: 1px solid var(--line);border:1px solid color-mix(in srgb,var(--sun) 40%,var(--line));font-weight:600}
.pt-res{text-align:center;padding:26px 16px;border-radius:28px;margin-top:6px;animation:pt-pop .45s cubic-bezier(.2,1.4,.4,1)}
.pt-res.ok{background:linear-gradient(180deg,rgba(54,214,165,.28),rgba(54,214,165,.05));border:1px solid rgba(54,214,165,.35)}
.pt-res.bad{background:linear-gradient(180deg,rgba(255,111,125,.24),rgba(255,111,125,.05));border:1px solid rgba(255,111,125,.3)}
.pt-res.mid{background:linear-gradient(180deg,rgba(255,196,81,.24),rgba(255,196,81,.05));border:1px solid rgba(255,196,81,.3)}
.pt-res .boo{width:120px;height:120px;margin:0 auto 6px}
.pt-res h1{margin:6px 0;font-size:32px}
.pt-res p{margin:6px 0;color:var(--dim);font-size:17px}
.pt-res .pts{font:900 30px var(--round);color:var(--sun)}
@keyframes pt-pop{0%{transform:scale(.85);opacity:0}100%{transform:none;opacity:1}}
.pt-wait{text-align:center;padding:26px 10px}
.pt-wait .boo{width:130px;height:130px;margin:0 auto 12px;animation:pt-float 3s ease-in-out infinite}
.pt-wait h1{font-size:26px}
.pt-wait p{color:var(--dim)}
@keyframes pt-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.pt-players{display:grid;grid-template-columns:repeat(3,1fr);grid-gap: 10px;gap:10px}
.pt-pl{position:relative;border:2px solid var(--line);background:var(--raise);border-radius:18px;padding:10px 6px;display:flex;flex-direction:column;align-items:center;grid-gap: 6px;gap:6px;color:var(--text);font:700 14px var(--sans);min-width:0}
html.no-flexgap .pt-pl > * + * { margin-top: 6px; }
.pt-pl b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pt-pl img{width:54px;height:54px;border-radius:50%;object-fit:cover;background:#fff}
.pt-pl .ok{position:absolute;top:6px;inset-inline-end:8px;color:var(--ok);font-weight:900}
@supports not (inset-inline-end: 0) {
  .pt-pl .ok { right: 8px; }
  html[dir="rtl"] .pt-pl .ok { left: 8px; }
}
.pt-pl .cr{position:absolute;top:2px;inset-inline-start:6px}
@supports not (inset-inline-start: 0) {
  .pt-pl .cr { left: 6px; }
  html[dir="rtl"] .pt-pl .cr { right: 6px; }
}
.pt-pl[aria-pressed=true]{border-color:var(--tint);background: var(--raise);background:color-mix(in srgb,var(--tint) 20%,var(--raise))}
button.pt-pl:active{transform:scale(.97)}
.pt-map{position:relative;border-radius:22px;overflow:hidden;background:#0b2043;touch-action:none;height: 46vh;height:clamp(300px,46vh,430px);border:1px solid rgba(255,255,255,.12);user-select:none;-webkit-user-select:none;box-shadow:0 14px 30px -18px rgba(0,0,0,.8),inset 0 0 0 1px rgba(255,255,255,.04)}
.pt-map .bvmap{border-radius:inherit}
.pt-mypin{--pw:38px}
.pt-trow{display:flex;align-items:center;grid-gap: 10px;gap:10px;margin:0 0 12px}
html.no-flexgap .pt-trow > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-trow > * + * { margin-left: 0; margin-right: 10px; }
.pt-trow .pt-timer{flex:1;margin:0}
.pt-trow b{font:700 17px/1 var(--fun,var(--round));color:var(--sun);min-width:24px;text-align:end}
.pt-trow b.low{color:var(--bad)}
.pt-flag{display:block;max-width:150px;max-height:84px;margin:0 auto 8px;border-radius:8px;box-shadow:0 8px 18px -8px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.15)}
.pt-wq{font:700 18px/1.25 var(--fun,var(--round));text-align:center;color:var(--dim);margin:0 6px 4px;overflow-wrap:anywhere}
.pt-drop{font:700 25px/1.15 var(--fun,var(--round));text-align:center;margin:2px 0 12px}
.pt-hints{display:flex;flex-wrap:wrap;grid-gap: 6px;gap:6px;justify-content:center;margin:-4px 0 10px}
html.no-flexgap .pt-hints > * { margin: 0 6px 6px 0; }
.pt-hints:empty{display:none}
.pt-hint{display:inline-flex;align-items:center;grid-gap: 7px;gap:7px;padding:6px 12px 6px 9px;border-radius:999px;background:rgba(255,201,60,.14);border:1px solid rgba(255,201,60,.45);color:#ffeab0;font:700 14px/1.2 var(--round);animation:pt-pop .45s cubic-bezier(.2,1.4,.4,1)}
html.no-flexgap .pt-hint > * + * { margin-left: 7px; }
html.no-flexgap[dir="rtl"] .pt-hint > * + * { margin-left: 0; margin-right: 7px; }
.pt-hint i{font-style:normal}
.pt-hint img{height:16px;border-radius:3px}
.btn .pt-lockpin{width:22px;height:29px;display:inline-block;margin-inline-end:8px;vertical-align:middle;filter:drop-shadow(0 3px 4px rgba(0,0,0,.25))}
@supports not (margin-inline-end: 0) {
  .btn .pt-lockpin { margin-right: 8px; }
  html[dir="rtl"] .btn .pt-lockpin { margin-left: 8px; }
}
.btn .pt-lockpin svg{width:100%;height:100%}
.pt-map .zm{position:absolute;inset-inline-end:10px;bottom:10px;display:flex;flex-direction:column;grid-gap: 8px;gap:8px;z-index:3}
@supports not (inset-inline-end: 0) {
  .pt-map .zm { right: 10px; }
  html[dir="rtl"] .pt-map .zm { left: 10px; }
}
html.no-flexgap .pt-map .zm > * + * { margin-top: 8px; }
.pt-map .zm button{width:46px;height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(18,12,44,.82);color:#fff;font:700 24px/1 var(--fun,var(--round));box-shadow:0 6px 14px -6px rgba(0,0,0,.6);backdrop-filter:blur(4px)}
.pt-map .zm button:active{transform:scale(.94)}
.pt-slider{width:100%;height:56px;accent-color:var(--tint);margin:6px 0}
.pt-peek{min-height:190px;border-radius:26px;border:2px dashed var(--line);display:grid;align-items: center; justify-items: center;place-items:center;text-align:center;padding:20px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none;margin-top:14px;background:var(--panel)}
.pt-peek.on{border-style:solid;border-color:var(--tint);background: var(--panel);background:color-mix(in srgb,var(--tint) 14%,var(--panel))}
.pt-peek b{display:block;font:900 36px/1.15 var(--round);margin:6px 0}
.pt-peek .pic{font-size:90px;line-height:1}
.pt-peek small{color:var(--dim);font-size:15px}
.pt-bingo{display:grid;grid-gap: 5px;gap:5px;direction:ltr}
.pt-bingo button{aspect-ratio:1;border:0;border-radius:11px;background:var(--raise2);color:var(--text);font:800 18px var(--sans);padding:0;min-width:0}
.pt-bingo.n90 button{font-size:14px;border-radius:8px}
.pt-bingo button.hd{background:transparent;color:var(--sun);font:900 22px var(--round)}
.pt-bingo button.on{background:var(--coral);color:#fff;box-shadow:inset 0 0 0 3px rgba(255,255,255,.45)}
.pt-bingo button.called:not(.on){box-shadow:inset 0 0 0 2px var(--sun)}
.pt-bingo button.blank{background:transparent}
.pt-bingo.big button{font-size:24px}
.pt-bingo.big.n90 button{font-size:18px}
.pt-call{font:900 64px/1 var(--round);text-align:center;color:var(--sun);margin:4px 0 6px}
.pt-games{display:grid;grid-gap: 10px;gap:10px}
.pt-game{display:flex;grid-gap: 14px;gap:14px;align-items:center;text-align:start;border:1px solid var(--line);background:var(--raise);border-radius:20px;padding:14px 16px;color:var(--text);width:100%}
html.no-flexgap .pt-game > * + * { margin-left: 14px; }
html.no-flexgap[dir="rtl"] .pt-game > * + * { margin-left: 0; margin-right: 14px; }
.pt-game .e{font-size:36px;flex:none;width:46px;text-align:center}
.pt-game b{display:block;font:800 18px var(--round)}
.pt-game small{color:var(--dim);font-size:14px;line-height:1.35}
.pt-game[aria-pressed=true]{border-color:var(--tint);background: var(--raise);background:color-mix(in srgb,var(--tint) 18%,var(--raise))}
.pt-game:disabled{opacity:.45}
.pt-where{display:grid;grid-gap: 10px;gap:10px;margin-top:4px}
.pt-games .pt-game,.pt-where .pt-game{transition:transform .12s}
.pt-game:active{transform:scale(.98)}
.pt-set{display:grid;grid-gap: 14px;gap:14px}
.pt-set .seg{flex-wrap:wrap}
.pt-set .seg button{flex:1 0 28%}
.pt-set label.lbl{display:block;color:var(--dim);font-size:15px;font-weight:600;margin-bottom:7px}
.pt-desc{display:flex;grid-gap: 8px;gap:8px;align-items:flex-start;margin:8px 2px 0;padding:9px 12px;border-radius:12px;background: var(--raise);background:color-mix(in srgb,var(--tint) 9%,var(--raise));border-inline-start: 3px solid var(--tint);border-inline-start:3px solid color-mix(in srgb,var(--tint) 65%,transparent);color:var(--dim);font-size:14px;line-height:1.4;animation:pt-fade .28s ease}
@supports not (border-inline-start: 0) {
  .pt-desc { border-left: 3px solid var(--tint); }
  html[dir="rtl"] .pt-desc { border-right: 3px solid var(--tint); }
}
html.no-flexgap .pt-desc > * + * { margin-left: 8px; }
html.no-flexgap[dir="rtl"] .pt-desc > * + * { margin-left: 0; margin-right: 8px; }
.pt-desc::before{content:"💡";font-size:13px;line-height:1.5;flex:none}
@keyframes pt-fade{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
.pt-list{display:grid;grid-gap: 8px;gap:8px}
.pt-list .r{display:flex;align-items:center;grid-gap: 12px;gap:12px;padding:10px 14px;border-radius:16px;background:var(--raise)}
html.no-flexgap .pt-list .r > * + * { margin-left: 12px; }
html.no-flexgap[dir="rtl"] .pt-list .r > * + * { margin-left: 0; margin-right: 12px; }
.pt-list .r b{flex:1}
.pt-list .r .n{font:900 18px var(--round);color:var(--sun)}
.pt-list .r.me{outline:2px solid var(--tint)}
.pt-print{display:none}
@media print{body>*:not(.pt-print){display:none!important}.pt-print{display:block!important;color:#000;background:#fff;font-family:system-ui,sans-serif}
.pt-print .c{display:inline-block;margin:8px;page-break-inside:avoid;vertical-align:top}.pt-print table{border-collapse:collapse}
.pt-print td{width:46px;height:46px;border:2px solid #222;text-align:center;font:700 19px system-ui}.pt-print th{font:900 22px system-ui;height:34px}.pt-print small{display:block;margin-top:4px;font-size:12px}}
@keyframes pt-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
@media (prefers-reduced-motion:reduce){.pt-res,.pt-wait .boo{animation:none}}
/* ---------- the party games' night look (the same as the TV's): deep indigo, one warm yellow for what you pick ---------- */
@font-face{font-family:'BV Fun';font-style:normal;font-weight:300 700;font-display:swap;src:url(../play/fonts/fredoka.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2212}
html.pt-night{--ink:#140d2e;--panel:#1f1745;--raise:#291f55;--raise2:#352a6b;--line:rgba(255,255,255,.11);--text:#f7f4ff;--dim:#b6add8;--faint:#8077aa;--sun:#ffc93c;--warn:#ffc93c;--lav:#cbbcff;--dk:#2a2150;--fun:'BV Fun',var(--round)}
html.pt-night body{background:radial-gradient(120% 55% at 0% -5%,rgba(124,92,255,.28),transparent 62%),radial-gradient(90% 45% at 100% 105%,rgba(255,107,150,.13),transparent 70%),linear-gradient(175deg,#221447 0%,#170f33 52%,#110b26 100%) fixed}
html.pt-night h1,html.pt-night h2,html.pt-night .top .who h1{font-family:var(--fun);font-weight:700}
html.pt-night .card{background:var(--panel);border-color:rgba(255,255,255,.08)}
html.pt-night .btn.go{background:var(--sun);color:#2a1d00;box-shadow:0 10px 24px -12px rgba(255,201,60,.75);font-family:var(--fun);font-weight:700}
html.pt-night .btn.ghost{background:var(--dk);border-color:rgba(255,255,255,.08)}
html.pt-night .btn.tint{background:var(--sun);color:#2a1d00}
html.pt-night .sheet{background:#1c143f}
html.pt-night .seg{background:var(--raise)}
html.pt-night .seg button[aria-pressed=true]{background:rgba(255,201,60,.16);color:#fff;box-shadow:0 0 0 1.5px var(--sun)}
html.pt-night .switch input:checked{background:var(--sun)}
html.pt-night .input{background:var(--panel);border-color:rgba(255,255,255,.12)}
/* the top: the house and the game on the left, you on the right */
.pt-top{grid-gap: 10px;gap:10px;padding:2px 0 12px}
.pt-top .pt-home{width:36px;height:36px;border-radius:11px;display:grid;align-items: center; justify-items: center;place-items:center;background:rgba(255,255,255,.07);flex:none;color:#fff}
.pt-top .pt-home svg{width:19px;height:19px}
.pt-top .who h1{font-size:20px}
.pt-chip{display:inline-flex;align-items:center;grid-gap: 7px;gap:7px;padding:4px 7px 4px 4px;border-radius:99px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);font:700 13px/1 var(--round);max-width:48%;flex:none}
html.no-flexgap .pt-chip > * + * { margin-left: 7px; }
html.no-flexgap[dir="rtl"] .pt-chip > * + * { margin-left: 0; margin-right: 7px; }
.pt-chip img{width:26px;height:26px;border-radius:50%;object-fit:cover;background:#fff;flex:none}
.pt-chip b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.pt-chip i{font-style:normal;padding:3px 6px;border-radius:6px;background:var(--sun);color:#2a1d00;font:800 10px/1 var(--round);letter-spacing:.06em;text-transform:uppercase;flex:none}
.pt-more{width:40px;height:40px;border-radius:12px;border:0;background:rgba(255,255,255,.08);color:#fff;display:grid;align-items: center; justify-items: center;place-items:center;flex:none}
.pt-more svg{width:22px;height:22px}
/* Trivia's category wheel: the TV's wheel (../play/wheel.js draws it), and the round's categories in its colors */
.pt-tws{display:flex;flex-direction:column;align-items:center;text-align:center}
.pt-tws h1{margin:0 0 4px;font:700 26px/1.1 var(--fun,var(--round));color:#ffc93c}
.pt-tw{width:82vw;width:min(300px,82vw);margin:14px auto 6px}
.pt-twst{min-height:30px;margin:10px 0 6px;font:700 17px/1.3 var(--round);color:#efe8ff}
.pt-twst.res{font:700 26px/1.15 var(--fun,var(--round));color:var(--cc)}
.pt-twleg{display:grid;grid-template-columns:1fr 1fr;grid-gap: 8px;gap:8px;width:100%;max-width:420px}
.pt-twleg .c{display:flex;align-items:center;grid-gap: 8px;gap:8px;padding:8px 10px;border-radius:12px;background:rgba(10,5,30,.45);border:1.5px solid rgba(255,255,255,.08);font:700 13.5px/1.2 var(--round);text-align:start;transition:opacity .4s,transform .4s}
html.no-flexgap .pt-twleg .c > * + * { margin-left: 8px; }
html.no-flexgap[dir="rtl"] .pt-twleg .c > * + * { margin-left: 0; margin-right: 8px; }
.pt-twleg .c i{flex:none;width:14px;height:14px;border-radius:50%;background:var(--cc);box-shadow:0 0 8px var(--cc)}
.pt-twleg .c.off{opacity:.32}
.pt-twleg .c.win{border-color:var(--cc);background:rgba(255,255,255,.1);transform:scale(1.04)}
/* the ⋯ menu during a game */
.pt-mehead{display:flex;align-items:center;grid-gap: 12px;gap:12px;margin:0 0 14px}
html.no-flexgap .pt-mehead > * + * { margin-left: 12px; }
html.no-flexgap[dir="rtl"] .pt-mehead > * + * { margin-left: 0; margin-right: 12px; }
.pt-mehead img{width:56px;height:56px;border-radius:50%;object-fit:cover;background:#fff;flex:none}
.pt-mehead span{flex:1;min-width:0}
.pt-mehead b{display:block;font:700 21px/1.2 var(--fun);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pt-mehead i{display:inline-block;margin-top:5px;font-style:normal;padding:3px 7px;border-radius:6px;background:var(--sun);color:#2a1d00;font:800 10px/1 var(--round);letter-spacing:.06em;text-transform:uppercase}
.pt-menu .pt-lang{margin-top:14px}
.sheet h2.pt-sub{font:700 15px var(--round);color:var(--dim);margin:2px 0 0}
/* the host's setup, one step at a time */
.pt-wz{display:flex;flex-direction:column;min-height: calc(100vh - 92px - var(--safe-t));min-height:calc(100dvh - 92px - var(--safe-t))}
.pt-prog{display:flex;grid-gap: 5px;gap:5px;margin:0 0 16px}
html.no-flexgap .pt-prog > * + * { margin-left: 5px; }
html.no-flexgap[dir="rtl"] .pt-prog > * + * { margin-left: 0; margin-right: 5px; }
.pt-prog i{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.12)}
.pt-prog i.on{background:var(--c)}
.pt-wh{display:flex;align-items:baseline;justify-content:space-between;grid-gap: 10px;gap:10px;margin:0 0 4px}
html.no-flexgap .pt-wh > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-wh > * + * { margin-left: 0; margin-right: 10px; }
.pt-wh h1{font-size:28px;line-height:1.1;margin:0}
.pt-wh span{color:var(--dim);font:700 13px var(--round);white-space:nowrap}
.pt-lbl{display:block;margin:16px 2px 8px;color:var(--dim);font:800 12px/1.2 var(--round);letter-spacing:.09em;text-transform:uppercase}
.pt-list2{display:grid;grid-gap: 8px;gap:8px;margin-top:10px}
.pt-opt{display:flex;align-items:center;grid-gap: 12px;gap:12px;width:100%;text-align:start;padding:11px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.08);background:var(--panel);color:var(--text);transition:border-color .15s,background .15s}
html.no-flexgap .pt-opt > * + * { margin-left: 12px; }
html.no-flexgap[dir="rtl"] .pt-opt > * + * { margin-left: 0; margin-right: 12px; }
.pt-opt b{display:block;font:700 16px/1.2 var(--fun)}
.pt-opt small{display:block;color:var(--dim);font-size:13px;line-height:1.35;margin-top:2px}
.pt-opt .ck{margin-inline-start:auto;flex:none;width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.25);display:grid;align-items: center; justify-items: center;place-items:center;font:900 13px/1 var(--round);color:transparent}
@supports not (margin-inline-start: 0) {
  .pt-opt .ck { margin-left: auto; }
  html[dir="rtl"] .pt-opt .ck { margin-right: auto; }
}
.pt-opt[aria-pressed=true]{border-color:var(--sun);background:linear-gradient(180deg,rgba(255,201,60,.14),rgba(255,201,60,.04)),var(--panel)}
.pt-opt[aria-pressed=true] .ck{background:var(--sun);border-color:var(--sun);color:#2a1d00}
.pt-grid{display:grid;grid-gap: 8px;gap:8px}
.pt-box{min-height:52px;padding:8px 6px;border-radius:12px;border:1.5px solid rgba(255,255,255,.08);background:var(--panel);color:var(--text);font:700 15px/1.2 var(--fun);display:grid;align-items: center; justify-items: center;place-items:center;text-align:center;overflow-wrap:anywhere;transition:border-color .15s,background .15s}
.pt-box.num{font-size:22px;min-height:58px}
.pt-grid.many .pt-box{min-height:46px;font-size:13.5px;padding:6px 4px}
.pt-box[aria-pressed=true]{border-color:var(--sun);background:linear-gradient(180deg,rgba(255,201,60,.17),rgba(255,201,60,.05)),var(--panel);color:#fff}
.pt-info{display:flex;grid-gap: 10px;gap:10px;align-items:flex-start;margin:10px 0 0;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);color:var(--dim);font-size:13.5px;line-height:1.4}
html.no-flexgap .pt-info > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-info > * + * { margin-left: 0; margin-right: 10px; }
.pt-info::before{content:"i";flex:none;width:18px;height:18px;border-radius:50%;background:var(--sun);color:#2a1d00;font:900 12px/18px var(--round);text-align:center;margin-top:1px}
.pt-info[hidden]{display:none}
.pt-tg{display:flex;align-items:center;grid-gap: 12px;gap:12px;padding:13px 14px;border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08);margin-top:10px;cursor:pointer}
html.no-flexgap .pt-tg > * + * { margin-left: 12px; }
html.no-flexgap[dir="rtl"] .pt-tg > * + * { margin-left: 0; margin-right: 12px; }
.pt-tg b{display:block;font:700 16px/1.2 var(--fun)}
.pt-tg small{display:block;color:var(--dim);font-size:13px;margin-top:3px;line-height:1.35}
.pt-tg input{appearance:none;-webkit-appearance:none;margin-inline-start:auto;width:50px;height:30px;border-radius:15px;background:rgba(255,255,255,.16);position:relative;flex:none;transition:background .15s}
@supports not (margin-inline-start: 0) {
  .pt-tg input { margin-left: auto; }
  html[dir="rtl"] .pt-tg input { margin-right: auto; }
}
.pt-tg input::after{content:"";position:absolute;top:3px;inset-inline-start:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .15s}
@supports not (inset-inline-start: 0) {
  .pt-tg input::after { left: 3px; }
  html[dir="rtl"] .pt-tg input::after { right: 3px; }
}
.pt-tg input:checked{background:var(--sun)}
.pt-tg input:checked::after{transform:translateX(20px)}
[dir=rtl] .pt-tg input:checked::after{transform:translateX(-20px)}
.pt-step{display:flex;align-items:center;justify-content:space-between;grid-gap: 10px;gap:10px;padding:7px;border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08)}
html.no-flexgap .pt-step > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-step > * + * { margin-left: 0; margin-right: 10px; }
.pt-step button{width:50px;height:46px;border-radius:11px;border:0;background:var(--raise);color:#fff;font:700 24px/1 var(--round);touch-action:manipulation;user-select:none;-webkit-user-select:none}
.pt-step button:active{background:var(--raise2)}
.pt-step span{display:flex;align-items:baseline;grid-gap: 6px;gap:6px}
html.no-flexgap .pt-step span > * + * { margin-left: 6px; }
html.no-flexgap[dir="rtl"] .pt-step span > * + * { margin-left: 0; margin-right: 6px; }
.pt-step b{font:700 26px/1 var(--fun)}
.pt-step .pt-num{width:3.2em;min-width:0;padding:4px 2px;border:0;border-bottom:2px dashed rgba(255,255,255,.25);background:transparent;color:inherit;font:700 26px/1 var(--fun);text-align:center;outline:none;border-radius:0}
.pt-step .pt-num:focus{border-bottom-color:var(--sun)}
.pt-quick0{margin-bottom:8px}
.pt-step small{color:var(--dim);font-size:14px}
.pt-text{min-height:120px;font-size:16px}
.pt-langrow{display:flex;align-items:center;grid-gap: 12px;gap:12px;margin:10px 0 0;padding:6px 6px 6px 14px;border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08)}
html.no-flexgap .pt-langrow > * + * { margin-left: 12px; }
html.no-flexgap[dir="rtl"] .pt-langrow > * + * { margin-left: 0; margin-right: 12px; }
[dir=rtl] .pt-langrow{padding:6px 14px 6px 6px}
.pt-langrow>span:first-child{font:700 15px var(--fun);white-space:nowrap}
.pt-langrow .pt-sel{flex:1;min-width:0}
.pt-sel{position:relative;display:block}
.pt-sel select{appearance:none;-webkit-appearance:none;width:100%;min-height:46px;padding:0 40px 0 12px;border-radius:11px;border:1.5px solid rgba(255,255,255,.1);background:var(--raise);color:var(--text);font:700 15px var(--fun)}
[dir=rtl] .pt-sel select{padding:0 12px 0 40px}
.pt-sel::after{content:"";position:absolute;inset-inline-end:16px;top:50%;width:8px;height:8px;border:solid var(--dim);border-width:0 2px 2px 0;transform:translateY(-70%) rotate(45deg);pointer-events:none}
@supports not (inset-inline-end: 0) {
  .pt-sel::after { right: 16px; }
  html[dir="rtl"] .pt-sel::after { left: 16px; }
}
.pt-nav{position:sticky;bottom:0;display:flex;grid-gap: 10px;gap:10px;padding:14px 0 calc(4px + var(--safe-b));margin-top:auto;background:linear-gradient(180deg,transparent,rgba(20,13,46,.92) 32%)}
html.no-flexgap .pt-nav > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-nav > * + * { margin-left: 0; margin-right: 10px; }
.pt-nav .bk{flex:0 0 31%;min-height:54px;border-radius:12px;border:0;background:var(--dk);color:#fff;font:700 16px var(--fun)}
.pt-nav .bk.sp{opacity:.5}
.pt-nav .nx{flex:1;min-height:54px;border:0;background:var(--sun);color:#2a1d00;font:700 17px var(--fun);clip-path:polygon(16px 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,16px 100%,0 50%)}
.pt-nav .nx:active,.pt-nav .bk:active{transform:scale(.98)}
/* the last step: everything at a glance, then Start */
.pt-ready{text-align:center;margin:6px 0 14px}
.pt-ready small{display:block;color:var(--sun);font:800 12px var(--round);letter-spacing:.12em;text-transform:uppercase}
.pt-ready h1{font-size:30px;line-height:1.15;margin:4px 0 0}
.pt-sum{border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08);padding:2px 14px}
.pt-sum div{display:flex;justify-content:space-between;align-items:baseline;grid-gap: 12px;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:14px}
html.no-flexgap .pt-sum div > * + * { margin-left: 12px; }
html.no-flexgap[dir="rtl"] .pt-sum div > * + * { margin-left: 0; margin-right: 12px; }
.pt-sum div:last-child{border-bottom:0}
.pt-sum span{color:var(--dim);flex:none}
.pt-sum b{font:700 14px/1.3 var(--fun);text-align:end;min-width:0}
.pt-edit{display:block;margin:10px auto 0;padding:6px 10px;border:0;background:none;color:var(--lav);font:700 14px var(--fun);text-decoration:underline;text-underline-offset:3px}
.pt-ph{display:flex;align-items:baseline;justify-content:space-between;grid-gap: 10px;gap:10px;margin:18px 2px 10px}
html.no-flexgap .pt-ph > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-ph > * + * { margin-left: 0; margin-right: 10px; }
.pt-ph h2{font-size:18px;margin:0}
.pt-ph span{color:var(--ok);font:700 13px var(--round);white-space:nowrap}
.pt-pl small.lg{position:absolute;top:6px;inset-inline-start:6px;padding:2px 5px;border-radius:6px;background:var(--violet);color:#fff;font:800 10px/1 var(--round)}
@supports not (inset-inline-start: 0) {
  .pt-pl small.lg { left: 6px; }
  html[dir="rtl"] .pt-pl small.lg { right: 6px; }
}
.pt-pl .cr~small.lg{top:auto;bottom:6px}
.pt-tv{display:flex;align-items:center;grid-gap: 10px;gap:10px;margin:14px 0 0;padding:8px 8px 8px 14px;border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08)}
html.no-flexgap .pt-tv > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-tv > * + * { margin-left: 0; margin-right: 10px; }
[dir=rtl] .pt-tv{padding:8px 14px 8px 8px}
.pt-tv>span:first-child{font:700 15px var(--fun);flex:1;min-width:0}
.pt-tv small{color:var(--dim);font:700 12px var(--round)}
.pt-tvb{display:flex;grid-gap: 6px;gap:6px}
html.no-flexgap .pt-tvb > * + * { margin-left: 6px; }
html.no-flexgap[dir="rtl"] .pt-tvb > * + * { margin-left: 0; margin-right: 6px; }
.pt-tvb button{min-width:46px;height:40px;padding:0 10px;border-radius:10px;border:0;background:var(--raise);color:#fff;font:800 14px var(--round)}
.pt-start{position:relative;display:flex;align-items:center;justify-content:center;grid-gap: 10px;gap:10px;width:100%;min-height:64px;margin-top:16px;border:3px solid transparent;border-radius:18px;color:#2a1d00;font:700 20px var(--fun);
  background:linear-gradient(var(--sun),var(--sun)) padding-box,linear-gradient(90deg,#ff5f7e,#b46bff 30%,#4f8bff 55%,#2fd59a 80%,#ffc93c) border-box;box-shadow:0 10px 30px -10px rgba(255,201,60,.6)}
html.no-flexgap .pt-start > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-start > * + * { margin-left: 0; margin-right: 10px; }
.pt-start:active{transform:scale(.98)}
.pt-start svg{width:22px;height:22px;flex:none}
.pt-startbar{position:sticky;bottom:0;z-index:5;padding:12px 0 calc(4px + var(--safe-b));margin-top:4px;background:linear-gradient(180deg,transparent,rgba(20,13,46,.94) 30%)}
.pt-startbar .pt-start{margin-top:0}
.pt-players.many{grid-template-columns:repeat(5,1fr);grid-gap: 6px;gap:6px}
.pt-players.many .pt-pl{padding:7px 2px 6px;border-radius:12px;grid-gap: 4px;gap:4px;font-size:11px;border-width:1.5px}
.pt-players.many .pt-pl img{width:34px;height:34px}
.pt-players.many .pt-pl .cr{font-size:11px;top:1px;inset-inline-start:3px}
@supports not (inset-inline-start: 0) {
  .pt-players.many .pt-pl .cr { left: 3px; }
  html[dir="rtl"] .pt-players.many .pt-pl .cr { right: 3px; }
}
.pt-players.many .pt-pl .ok{font-size:11px;top:2px;inset-inline-end:4px}
@supports not (inset-inline-end: 0) {
  .pt-players.many .pt-pl .ok { right: 4px; }
  html[dir="rtl"] .pt-players.many .pt-pl .ok { left: 4px; }
}
.pt-pair{display:grid;grid-template-columns:1fr 1fr;grid-gap: 10px;gap:10px;margin-top:12px}
.pt-pair.one{grid-template-columns:1fr}
.pt-dk{min-height:52px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:var(--dk);color:#fff;font:700 15px/1.2 var(--fun);padding:8px 10px}
.pt-dk:active{transform:scale(.98)}
.pt-dk.bad{color:#ff8f8a}
/* the players' lobby: the game, your language, Ready */
.pt-gcard{display:flex;grid-gap: 14px;gap:14px;align-items:center;padding:14px 16px;border-radius:16px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08);margin-bottom:12px}
html.no-flexgap .pt-gcard > * + * { margin-left: 14px; }
html.no-flexgap[dir="rtl"] .pt-gcard > * + * { margin-left: 0; margin-right: 14px; }
.pt-gcard .e{font-size:36px;flex:none;width:46px;text-align:center}
.pt-gcard b{display:block;font:700 19px var(--fun)}
.pt-gcard small{color:var(--dim);font-size:14px;line-height:1.35}
.pt-lang{padding:14px}
.pt-lang h2{font-size:17px;margin:0 0 10px}
.pt-adm{display:grid;grid-gap: 8px;gap:8px}
.pt-adm .r{display:flex;align-items:center;grid-gap: 10px;gap:10px;padding:8px 10px;border-radius:14px;background:var(--panel);border:1px solid rgba(255,255,255,.07)}
html.no-flexgap .pt-adm .r > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-adm .r > * + * { margin-left: 0; margin-right: 10px; }
.pt-adm .r img{width:38px;height:38px;border-radius:50%;object-fit:cover;background:#fff;flex:none}
.pt-adm .r b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:700 15px var(--fun)}
.pt-adm .r button{min-height:38px;padding:0 10px;border-radius:10px;border:0;background:var(--raise);color:#fff;font:700 13px var(--round);flex:none}
.pt-adm .r button.bad{color:#ff8f8a}
.pt-adm .r i{font-style:normal;padding:3px 6px;border-radius:6px;background:var(--sun);color:#2a1d00;font:800 10px/1 var(--round);text-transform:uppercase}
.pt-h{font-size:26px;margin:4px 0 6px}
/* each game's own icon: in the game lists, the lobby's game card and the top left of a game */
.pt-game .gi,.pt-gcard .gi{width:52px;height:52px;flex:none;filter:drop-shadow(0 6px 10px rgba(0,0,0,.35))}
.pt-top .pt-home.gi{width:40px;height:40px;padding:0;border-radius:0;background:none;filter:drop-shadow(0 4px 8px rgba(0,0,0,.35))}
/* "Leave the game?" (the phone's Back button during a game) */
.pt-leave{text-align:center;padding-top:18px}
.pt-leave .boo{width:92px;height:92px;margin:0 auto 6px}
.pt-leave h2{font:700 26px/1.15 var(--fun);margin:0 0 8px}
.pt-leave-p{color:var(--dim);font-size:16px;line-height:1.45;max-width:30em;margin:0 auto 18px}
.pt-leave .pt-pair{margin-top:10px}
.pt-clues{list-style:none;margin:-4px 0 14px;padding:0;display:grid;grid-gap: 8px;gap:8px}
.pt-clues li{display:flex;align-items:center;grid-gap: 10px;gap:10px;padding:10px 12px;border-radius:14px;background:var(--raise);border:1px solid var(--line);font:700 15px/1.35 var(--round)}
html.no-flexgap .pt-clues li > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-clues li > * + * { margin-left: 0; margin-right: 10px; }
.pt-clues li.new{animation:pt-pop .45s cubic-bezier(.2,1.4,.4,1)}
.pt-clues li b{flex:none;width:28px;height:28px;border-radius:8px;display:grid;align-items: center; justify-items: center;place-items:center;font:800 14px/1 var(--round);color:#1d1050;background:#ffc93c}
.pt-clues li:nth-child(2) b{background:#4c8dff;color:#fff}.pt-clues li:nth-child(3) b{background:#34d399}.pt-clues li:nth-child(4) b{background:#ff8a9a}
.pt-worth{width:max-content;max-width:100%;margin:0 auto 12px;padding:7px 16px;border-radius:999px;background:linear-gradient(180deg,#ffe08a,#ffc93c);color:#3a2400;font:800 15px/1.1 var(--round);box-shadow:0 3px 0 #a86a0a}
.pt-worth.bump{animation:pt-pop .45s cubic-bezier(.2,1.4,.4,1)}
.pt-spin{display:flex;flex-direction:column;align-items:center;grid-gap: 14px;gap:14px;width:100%;margin:6px auto 4px;padding:0;border:0;background:none;color:#fff;font:800 22px/1 var(--round);cursor:pointer;-webkit-tap-highlight-color:transparent}
html.no-flexgap .pt-spin > * + * { margin-top: 14px; }
.pt-wheel{position:relative;width: 82vw;width:min(300px,82vw);aspect-ratio:1;margin-top:4%}
.pt-wheel>*{position:absolute}
.pt-wheel .pw-glow{top: -8%; right: -8%; bottom: -8%; left: -8%;inset:-8%;border-radius:50%;background:radial-gradient(circle,rgba(255,201,60,.3),rgba(124,92,255,.12) 45%,transparent 66%);animation:pwGlow 3s ease-in-out infinite}
.pt-wheel .pw-turn,.pt-wheel .pw-rim{top: 0; right: 0; bottom: 0; left: 0;inset:0;width:100%;height:100%}
.pt-wheel .pw-turn svg{width:100%;height:100%;display:block}
.pt-wheel .pw-rim{pointer-events:none;filter:drop-shadow(0 8px 14px rgba(0,0,0,.5))}
.pt-wheel .pw-hub{left:38.9%;top:38.9%;width:22.2%;height:22.2%;filter:drop-shadow(0 3px 6px rgba(0,0,0,.5))}
.pt-wheel .pw-boo{left:44%;top:44%;width:12%;height:12%;animation:pwBob 2.4s ease-in-out infinite}
.pt-wheel .pw-pin{left:50%;top:-3.5%;width:12%;height:auto;z-index:2;transform:translateX(-50%);transform-origin:50% 30%;filter:drop-shadow(0 4px 6px rgba(0,0,0,.55))}
.pt-wheel .bulb .l,.pt-wheel .bulb .h{animation:pwBlink 1.2s steps(1,end) infinite}
.pt-wheel .bulb.b1 .l,.pt-wheel .bulb.b1 .h{animation-delay:-.6s}
.pt-spin.go .pt-wheel .bulb .l,.pt-spin.go .pt-wheel .bulb .h{animation-duration:.24s}
.pt-spin.go .pt-wheel .bulb.b1 .l,.pt-spin.go .pt-wheel .bulb.b1 .h{animation-delay:-.12s}
.pt-spin.go .pw-pin{animation:pwTick .13s ease-in-out infinite alternate}
.pt-spin.done .pw-pin{animation:pwLand .7s cubic-bezier(.2,1.6,.4,1)}
.pt-spin>b{padding:12px 34px;border-radius:999px;background:linear-gradient(180deg,#ffe684,#ffcd45 48%,#ffb825);color:#1b1240;font:800 22px/1 var(--round);box-shadow:0 4px 0 #b37a12,0 8px 18px rgba(0,0,0,.35);animation:ptSpinP 1.6s ease-in-out infinite}
.pt-spin:disabled>b{animation:none;opacity:.55}
@keyframes ptSpinP{50%{transform:scale(1.06)}}
@keyframes pwGlow{50%{opacity:.55;transform:scale(.97)}}
@keyframes pwBob{50%{transform:translateY(-6%)}}
@keyframes pwBlink{0%{opacity:1}50%{opacity:.3}}
@keyframes pwTick{from{transform:translateX(-50%) rotate(-7deg)}to{transform:translateX(-50%) rotate(5deg)}}
@keyframes pwLand{0%{transform:translateX(-50%) rotate(-12deg)}60%{transform:translateX(-50%) rotate(6deg)}100%{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.pt-wheel .pw-glow,.pt-wheel .pw-boo,.pt-wheel .bulb .l,.pt-wheel .bulb .h,.pt-spin>b{animation:none}}
.pt-helpers button.on:disabled{opacity:1;background:rgba(255,201,60,.18);border-color:#ffc93c}
.pt-howto h2{margin:0 0 6px}
.pt-howto .r{display:flex;align-items:flex-start;grid-gap: 10px;gap:10px;padding:9px 0;border-top:1px solid var(--line);font:600 15px/1.42 var(--round)}
html.no-flexgap .pt-howto .r > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .pt-howto .r > * + * { margin-left: 0; margin-right: 10px; }
.pt-howto h2+.r{border-top:0}
.pt-howto .r i{flex:none;width:26px;font-style:normal;font-size:19px;line-height:1.15;text-align:center}
.g-gir .pt-howto,.g-gir .pt-lang{border-color:rgba(255,201,60,.45)}
html.g-emo.pt-night{--ink:#170812;--panel:#2a0f22;--raise:#3a1430;--raise2:#4a1a3c;--dk:#331022;--line:rgba(255,201,60,.14);--dim:#d9c2cc;--faint:#a88c9a}
html.g-emo.pt-night body{background:radial-gradient(110% 50% at 50% -8%,rgba(255,154,60,.22),transparent 65%),linear-gradient(180deg,#22091f 0%,#160714 55%,#0c0410 100%) fixed}
html.g-emo.pt-night body::before{content:'';position:fixed;left:0;right:0;top:0;height:7px;z-index:80;pointer-events:none;background:repeating-linear-gradient(90deg,#7a1230 0 22px,#5a0c22 22px 44px);box-shadow:0 3px 10px rgba(0,0,0,.45)}
html.g-emo .pt-howto,html.g-emo .pt-lang{border-color:rgba(255,201,60,.4)}
.emo-mq{position:relative;margin:2px 0 14px;padding:18px 14px 20px;border-radius:24px;background:linear-gradient(180deg,#3b1530,#1e0a1c);border:3px solid #ffc93c;box-shadow:0 0 0 5px #1a0c16,0 0 34px rgba(255,201,60,.3);text-align:center}
.emo-mq::before,.emo-mq::after{content:'';position:absolute;left:12px;right:12px;height:10px;background:radial-gradient(circle,#fff8d6 0,#ffc93c 2.6px,rgba(255,201,60,0) 4.4px) 0 50%/18px 10px repeat-x;animation:emoBulb 1.2s steps(1) infinite;pointer-events:none}
.emo-mq::before{top:-7px}
.emo-mq::after{bottom:-7px;animation-delay:.6s}
@keyframes emoBulb{0%,100%{opacity:1}50%{opacity:.45}}
.emo-mq .h{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;grid-gap:6px 8px;gap:6px 8px;font:700 15px/1.25 var(--fun);color:#ffd9a8;margin-bottom:10px}
html.no-flexgap .emo-mq .h > * + * { margin-left: 8px; }
.emo-mq .h b{color:#fff3d6;text-shadow:0 0 10px rgba(255,201,60,.7)}
.emo-mq .gold{padding:3px 10px;border-radius:999px;background:linear-gradient(180deg,#fff2b0,#ffc93c 55%,#e0880b);color:#2a1700;font:800 13px/1.2 var(--round);box-shadow:0 0 14px rgba(255,201,60,.7)}
.emo-ems{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;grid-gap:4px 12px;gap:4px 12px;direction:ltr;font-size:52px;line-height:1.15;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
html.no-flexgap .emo-ems > * { margin: 0 6px 4px; }
.emo-ems span{display:inline-block;animation:emoPop .55s cubic-bezier(.2,1.5,.4,1) both}
.emo-ems span.q{opacity:.28;filter:grayscale(1)}
@keyframes emoPop{from{transform:scale(.3) rotate(-12deg);opacity:0}}
.emo-hint{margin:-4px 0 12px;padding:10px 14px;border-radius:16px;background:rgba(125,249,255,.08);border:1.5px solid rgba(125,249,255,.5);color:#e8fdff;font:700 17px/1.35 var(--round);text-align:center;letter-spacing:.04em;overflow-wrap:anywhere}
.emo-ans{display:grid;grid-template-columns:1fr 1fr;grid-gap:12px;gap:12px}
.emo-a{position:relative;display:flex;align-items:center;grid-gap:10px;gap:10px;min-height:96px;padding:12px;border:0;border-radius:22px;color:var(--t);background:linear-gradient(160deg,var(--c1),var(--c2));box-shadow:0 7px 0 rgba(0,0,0,.35),0 12px 22px rgba(0,0,0,.3);font:700 18px/1.15 var(--fun);text-align:start;overflow:hidden;overflow-wrap:anywhere;transition:transform .12s,opacity .25s,filter .25s,box-shadow .25s}
html.no-flexgap .emo-a > * + * { margin-left: 10px; }
html.no-flexgap[dir="rtl"] .emo-a > * + * { margin-left: 0; margin-right: 10px; }
.emo-a::before{content:'';position:absolute;top:0;right:0;bottom:0;left:0;background:linear-gradient(180deg,rgba(255,255,255,.22),transparent 50%);pointer-events:none}
.emo-a .l{position:relative;flex:none;width:40px;height:40px;border-radius:12px;background:rgba(0,0,0,.18);display:grid;align-items:center;justify-items:center;place-items:center;font:700 20px/1 var(--fun)}
.emo-a span:last-child{position:relative;flex:1;min-width:0}
.emo-a:active{transform:translateY(4px);box-shadow:0 3px 0 rgba(0,0,0,.35)}
.emo-a.mine{box-shadow:0 0 0 4px #fff,0 0 26px rgba(255,255,255,.5);transform:scale(1.03)}
.emo-a.dim{opacity:.38;filter:grayscale(.55)}
.emo-kids .emo-a{min-height:118px;font-size:21px}
.emo-kids .emo-a .l{width:52px;height:52px;font-size:28px;border-radius:16px}
.emo-kids .emo-ems{font-size:64px}
.emo-ph .pt-note.sent{margin-top:14px;text-align:center;font:700 16px/1.35 var(--round);color:#ffd9a8}
.emo-ph .input{border-color:rgba(255,201,60,.4)}
.emo-res{position:relative;text-align:center;padding:22px 16px 20px;border-radius:28px;margin-top:4px;animation:pt-pop .45s cubic-bezier(.2,1.4,.4,1)}
.emo-res.ok{background:linear-gradient(180deg,rgba(52,211,153,.3),rgba(52,211,153,.06));border:2px solid rgba(52,211,153,.6);box-shadow:0 0 34px rgba(52,211,153,.25)}
.emo-res.bad{background:linear-gradient(180deg,rgba(255,77,106,.28),rgba(255,77,106,.05));border:2px solid rgba(255,77,106,.55);box-shadow:0 0 30px rgba(255,77,106,.2)}
.emo-res.kid{background:linear-gradient(180deg,rgba(255,201,60,.26),rgba(255,201,60,.05));border:2px solid rgba(255,201,60,.55)}
.emo-res .big{width:96px;height:96px;margin:0 auto 10px;border-radius:50%;display:grid;align-items:center;justify-items:center;place-items:center;font:700 58px/1 var(--fun);color:#fff;animation:emoBadge .55s .1s cubic-bezier(.2,1.6,.4,1) both}
.emo-res.ok .big{background:radial-gradient(circle at 35% 30%,#6ff0c0,#17a673 70%);box-shadow:0 0 0 5px #fff,0 0 40px rgba(52,211,153,.9)}
.emo-res.bad .big{background:radial-gradient(circle at 35% 30%,#ff8aa0,#c8213f 70%);box-shadow:0 0 0 5px #fff,0 0 40px rgba(255,77,106,.85)}
.emo-res.kid .big{background:radial-gradient(circle at 35% 30%,#fff2b0,#e0880b 70%);box-shadow:0 0 0 5px #fff,0 0 40px rgba(255,201,60,.85);font-size:50px}
@keyframes emoBadge{from{transform:scale(0) rotate(-40deg);opacity:0}}
.emo-res h1{margin:4px 0 6px;font-size:32px}
.emo-res .pts{font:700 30px/1.2 var(--fun);color:#ffc93c}
.emo-res .tags{display:flex;flex-wrap:wrap;justify-content:center;grid-gap:8px;gap:8px;margin:10px 0 4px}
html.no-flexgap .emo-res .tags > * { margin: 0 4px 8px; }
.emo-res .tags span{padding:5px 12px;border-radius:999px;background:rgba(0,0,0,.25);border:1px solid rgba(255,255,255,.14);font:800 14px/1.25 var(--round)}
.emo-res p{margin:8px 0 0;color:var(--dim);font-size:16px}
.emo-res .ans{margin:12px auto 0;max-width:420px;padding:12px 14px;border-radius:18px;background:rgba(10,4,18,.45);border:1.5px solid rgba(255,201,60,.3)}
.emo-res .ans .e{font-size:34px;line-height:1.15;direction:ltr}
.emo-res .ans small{display:block;margin-top:6px;color:var(--dim);font:700 13px/1.2 var(--round)}
.emo-res .ans b{display:block;font:700 22px/1.25 var(--fun);color:#fff3d6;margin-top:2px;overflow-wrap:anywhere}
.emo-res .place{margin-top:12px;color:var(--dim);font:700 15px/1.3 var(--round)}
.emo-wait{text-align:center;padding:18px 10px 10px}
.emo-wait .e{font-size:56px;line-height:1.15;animation:emoBob 2.6s ease-in-out infinite}
@keyframes emoBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.emo-wait h2{margin:8px 0 6px;font-size:26px;color:#fff3d6;text-shadow:0 0 12px rgba(255,201,60,.6)}
.emo-wait p{margin:0;color:var(--dim);font:700 16px/1.45 var(--round)}
.emo-ph .pt-howto{margin-top:12px}
.emo-poster{position:relative;margin:4px 0 14px;padding:22px 16px 18px;border-radius:24px;border:5px solid #f3e2b8;background:radial-gradient(ellipse at 50% 30%,#5b2a8a,#2a1050 60%,#160a2e);overflow:hidden;text-align:center;box-shadow:0 18px 40px rgba(0,0,0,.5)}
.emo-poster::before{content:'';position:absolute;left:50%;top:38%;width:900px;height:900px;margin:-450px 0 0 -450px;background:repeating-conic-gradient(rgba(255,201,60,.09) 0 8deg,transparent 8deg 16deg);animation:emoSpin 40s linear infinite;pointer-events:none}
@keyframes emoSpin{to{transform:rotate(360deg)}}
.emo-poster>*{position:relative}
.emo-poster .pr{font:900 11px/1.2 var(--round);letter-spacing:.42em;color:#f3e2b8}
.emo-poster .wk{margin-top:6px;font:700 22px/1.2 var(--fun);color:#ffc93c}
.emo-poster .av{position:relative;width:118px;height:118px;margin:34px auto 10px;border-radius:50%;background:radial-gradient(circle at 40% 30%,#3a2870,#1a1236);box-shadow:0 0 0 5px #ffc93c,0 0 34px rgba(255,201,60,.6);display:grid;align-items:center;justify-items:center;place-items:center}
.emo-poster .av img{width:80%;height:80%;object-fit:contain}
.emo-poster .av img.ph{width:100%;height:100%;border-radius:50%;object-fit:cover}
.emo-poster .av::before{content:'👑';position:absolute;top:-38px;left:50%;transform:translateX(-50%);font-size:36px}
.emo-poster .lf{position:absolute;top:50%;width:36px;height:92px;margin-top:-50px}
.emo-poster .lf svg{display:block;width:100%;height:100%}
.emo-poster .lf.l{left:-46px}
.emo-poster .lf.r{right:-46px;transform:scaleX(-1)}
.emo-poster .nm{font:700 44px/1.05 var(--fun);background:linear-gradient(180deg,#fff8d6,#ffc93c 50%,#ff9a3c);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 3px 0 rgba(0,0,0,.35));overflow-wrap:anywhere}
.emo-poster .pt{margin-top:4px;font:800 18px/1.2 var(--round);color:#fff}
.emo-poster .rest{display:flex;justify-content:center;grid-gap:18px;gap:18px;margin-top:14px;padding-top:12px;border-top:2px solid rgba(243,226,184,.3)}
html.no-flexgap .emo-poster .rest > * + * { margin-left: 18px; }
.emo-poster .rest>div{display:flex;align-items:center;grid-gap:8px;gap:8px;min-width:0}
html.no-flexgap .emo-poster .rest > div > * + * { margin-left: 8px; }
.emo-poster .rest .a2{flex:none;width:42px;height:42px;border-radius:50%;background:#1a1236;display:grid;align-items:center;justify-items:center;place-items:center;box-shadow:0 0 0 3px var(--rc)}
.emo-poster .rest .a2 img{width:78%;height:78%;object-fit:contain}
.emo-poster .rest .a2 img.ph{width:100%;height:100%;border-radius:50%;object-fit:cover}
.emo-poster .rest span{min-width:0}
.emo-poster .rest small{display:block;font:900 11px/1 var(--round);letter-spacing:.15em;color:var(--rc);text-align:start}
.emo-poster .rest b{display:block;font:700 17px/1.15 var(--fun);color:#fff;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:start}
.emo-poster .rest i{display:block;font:800 12px/1.2 var(--round);font-style:normal;color:var(--rc);text-align:start}
.emo-me{margin:0 0 12px;text-align:center;font:700 20px/1.3 var(--fun);color:#ffc93c}
.emo-share{display:flex;flex-direction:column;grid-gap:8px;gap:8px;margin:0 0 16px}
html.no-flexgap .emo-share > * + * { margin-top: 8px; }
.emo-share .go{width:100%;min-height:58px;border:0;border-radius:18px;background:linear-gradient(180deg,#fff2b0,#ffc93c 55%,#e0880b);color:#2a1700;font:700 19px/1.2 var(--fun);box-shadow:0 8px 0 rgba(0,0,0,.3),0 0 26px rgba(255,201,60,.35)}
.emo-share .go:active{transform:translateY(3px);box-shadow:0 4px 0 rgba(0,0,0,.3)}
.emo-share small{text-align:center;color:var(--dim);font:700 13px/1.3 var(--round)}
.emo-share .ch{display:grid;grid-template-columns:1fr 1fr;grid-gap:8px;gap:8px}
.emo-share .ch button{min-height:46px;border-radius:14px;border:1px solid rgba(255,201,60,.35);background:rgba(255,255,255,.05);color:var(--text);font:800 15px/1.2 var(--round)}
.emo-share button:disabled{opacity:.55}
.emo-rxbar{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-gap:6px;gap:6px;margin:16px 0 4px;padding:8px;border-radius:20px;background:rgba(10,4,18,.4);border:1px solid rgba(255,201,60,.22)}
.emo-rxbar button{height:52px;border:0;border-radius:14px;background:rgba(255,255,255,.06);font-size:30px;line-height:1;font-family:"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif}
.emo-rxbar button:active{background:rgba(255,201,60,.22)}
@media (prefers-reduced-motion:reduce){.emo-mq::before,.emo-mq::after,.emo-poster::before,.emo-wait .e{animation:none}}
`;
  }

  // ---------- the game, as this phone sees it ----------
  const G = { R: null, s: '', tv: '', me: null, id: '', name: '', av: 'boo:hi', photo: '', joined: false, host: false, color: '', team: '', ready: false, lobby: null, phase: 'join',
    q: null, qAt: 0, answered: false, locked: false, res: null, endRes: null, ranking: null, score: 0, lives: null, out: false, used: new Set(), secret: null, bingo: null, paper: null,
    S: Object.assign({}, STR0), lastHeard: 0, timers: [], stops: [], ui: {}, tries: 0, lang: 'en', tvStrings: null,
    wiz: 0, wizGame: '', plang: '', plangSent: '', kicked: false, key: '', again: false, closed: false };
  const S = () => G.S;
  // a line in the game's language, with its {parts} filled in
  function T(text, vars) {
    const i = I();
    if (i && (G.lang === 'en' || i.FULL.has(G.lang))) return i.t(G.lang, text, vars);
    return vars ? String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m)) : String(text);
  }
  // the words for the game's language (the full ones load their file once; the others use what the TV sent)
  async function useLang(code) {
    const i = I();
    const c = i && i.ok(code) ? code : 'en';
    if (i && i.FULL.has(c) && c !== 'en') await i.load(c, false);
    G.lang = c;
    const full = !i || c === 'en' || i.FULL.has(c);
    const t = Object.assign({}, STR0);
    for (const k of Object.keys(STR0)) {
      if (full) t[k] = i ? i.t(c, STR0[k]) : STR0[k];
      else if (G.tvStrings && typeof G.tvStrings[k] === 'string' && G.tvStrings[k]) t[k] = L.clean(G.tvStrings[k], 140);
    }
    G.S = t;
    document.documentElement.lang = c;
    document.documentElement.dir = i && i.RTL.has(c) ? 'rtl' : 'ltr';
  }
  const loadI18n = () => GO.script('../play/i18n.js?v=' + GO.VERSION).catch(() => {});
  // The language this phone shows: the game's (the host picks it), or, in a game that has it (Trivia), the player's own
  // pick: then their phone shows each question and its answers in it, while the TV stays in the game's language. The
  // host's phone always follows the game.
  const tvLangOf = l => (l && typeof l.lang === 'string' && /^[a-z]{2}$/.test(l.lang) ? l.lang : 'en');
  const ownLang = l => (!G.host && l && l.mlang && G.plang && G.plang !== tvLangOf(l) && I() && I().FULL.has(G.plang) && (!Array.isArray(l.langs) || l.langs.includes(G.plang)) ? G.plang : '');
  const gameLangs = l => (l && Array.isArray(l.langs) ? l.langs : null);
  const effLang = l => ownLang(l) || tvLangOf(l);
  const langName = c => ([...langsFull(), ...langsMore()].find(x => x[0] === c) || [c, c])[1];
  const numFmt = n => { try { return Number(n).toLocaleString(G.lang + '-u-nu-latn'); } catch (e) { return String(n); } };
  const send = m => (G.R ? G.R.send(m).catch(() => {}) : Promise.resolve());
  // (a player who picked their own language sees the game's name in it too, not in the TV's)
  const gameName = () => { const l = G.lobby || {}; return (ownLang(l) && typeof l.gen === 'string' && l.gen ? T(L.clean(l.gen, 60)) : l.gname) || T('Party games'); };
  const after = (ms, fn) => { const t = setTimeout(fn, ms); G.timers.push(t); return t; };
  function stopQ() { for (const t of G.timers) clearTimeout(t); G.timers = []; for (const f of G.stops) { try { f(); } catch (e) {} } G.stops = []; }

  // who you are in this game: kept by this tab only (two tabs or two people on one computer are two players), and
  // still there after a reload, so you come back as yourself
  const tabStore = {
    get(k) { try { return JSON.parse(sessionStorage.getItem('bvgo:' + k) || 'null'); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem('bvgo:' + k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { sessionStorage.removeItem('bvgo:' + k); } catch (e) {} }
  };
  // (and on this phone too, for 4 hours: a page closed by mistake, opened again, is the same player with the same score.
  // A tab that's open says so every few seconds, so a second tab of the same game is a second player.)
  const LIVE = k => 'party:live:' + k;
  const claimMe = () => { if (G.key) store.set(LIVE(G.key), Date.now()); };
  const releaseMe = () => { if (G.key) store.del(LIVE(G.key)); };
  setInterval(() => { if (G.key && G.R && G.joined && !document.hidden) claimMe(); }, 4000);
  function forgetOld() {
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i) || '';
        if (k.startsWith('bvgo:party:me:')) { const v = JSON.parse(localStorage.getItem(k) || 'null'); if (!v || !(Date.now() - v.at < 4 * 3600e3)) localStorage.removeItem(k); }
        else if (k.startsWith('bvgo:party:live:') && !(Date.now() - (+localStorage.getItem(k) || 0) < 60000)) localStorage.removeItem(k);
      }
    } catch (e) {}
  }
  async function memberFor(key) {
    G.key = key;
    let jwk = tabStore.get(key);
    if (!jwk) {
      const kept = store.get('party:me:' + key, null);
      const busy = Date.now() - (+store.get(LIVE(key), 0) || 0) < 10000;
      if (kept && kept.jwk && Date.now() - kept.at < 4 * 3600e3 && !busy) jwk = kept.jwk;
    }
    let me = null;
    try { me = await C.newMember(jwk || undefined); } catch (e) { me = null; }
    if (!me) me = await C.newMember();
    tabStore.set(key, me.jwk);
    store.set('party:me:' + key, { jwk: me.jwk, at: Date.now() });
    claimMe();
    return me;
  }
  // the game this phone is in, for "Back to the game" on Blokvane's first page (until 3 hours after it was last here)
  function keepBack() { if (G.s && G.tv) store.set('party:back', { s: G.s, tv: G.tv, lg: tvLangOf(G.lobby), name: gameName(), at: Date.now() }); }
  const dropBack = () => { const b = store.get('party:back', null); if (b && b.s === G.s) store.del('party:back'); };
  async function start(parts) {
    css();
    await loadI18n();
    const [s, tv, lg] = parts;
    forgetOld();
    G.plang = I() && I().FULL.has(store.get('party:plang', '')) ? store.get('party:plang', '') : '';
    await useLang(I() && I().ok(lg) ? lg : I() ? I().pick() : 'en');
    GO.say = T;
    if (!s || !/^[A-Za-z0-9_-]{16,64}$/.test(s) || !L.okId(tv)) {
      const v = view(T('Party games'), { tint: 'sun', night: true });
      hero(v.body, T('This code isn\'t complete'), T('Scan the QR code on the TV again, or type the 6 letters under it.'), { sleepy: true });
      btn(T('Type the code'), { kind: 'go', full: true }, v.body, () => codeScreen());
      return;
    }
    await GO.script('watch-boo.js').catch(() => {});
    G.s = s; G.tv = tv;
    G.name = store.get('party:name', '');
    G.av = AVATARS.includes(store.get('party:av', '')) ? store.get('party:av', '') : 'boo:hi';
    // (back in the same game after a reload or a dead battery: straight in, as yourself. A game this phone just started
    // from Blokvane: straight in too, so this phone is the first one there, the host.)
    const last = tabStore.get('party:in'), back = store.get('party:back', null);
    if (G.name && ((last && last.s === s.slice(0, 10) && Date.now() - last.at < 4 * 3600e3) || (back && back.s === s && Date.now() - back.at < 3 * 3600e3))) return connect();
    if (G.autoJoin && G.autoJoin === s.slice(0, 10) && G.name) { G.autoJoin = ''; return connect(); }
    joinScreen();
  }

  // ---------- joining ----------
  function joinScreen(editing) {
    const v = view(editing ? S().changeName : T('Party games'), { tint: 'sun', night: true, back: editing ? () => backToNow() : null });
    if (!editing) hero(v.body, S().join, T('Pick a name and a Boo. The game itself is on the TV.'), { node: booPic('boo:party', 'float') });
    const card = el('div', 'card', v.body);
    const ni = input({ value: G.name, placeholder: S().name, max: 16 });
    ni.autocapitalize = 'words';
    GO.field(S().name, ni, card);
    el('h2', '', card, S().pickBoo);
    const avs = el('div', 'pt-avs', card);
    let av = G.av, photo = G.photo;
    const mark = () => { for (const b of avs.children) b.setAttribute('aria-pressed', String(!photo && b.dataset.id === av)); };
    for (const id of AVATARS) {
      const b = el('button', 'pt-av', avs);
      b.type = 'button'; b.dataset.id = id;
      b.setAttribute('aria-label', T('Pick this Boo'));
      const im = el('img', '', b); im.src = booUri(id); im.alt = '';
      b.onclick = () => { av = id; photo = ''; mark(); selfieRow.hidden = true; buzz('tap'); };
    }
    mark();
    // a selfie: shrunk on this phone, sealed for the TV alone, never saved
    const pick = el('button', 'btn ghost full', card);
    pick.type = 'button';
    pick.appendChild(GO.icon('camera'));
    el('span', '', pick, S().selfie);
    const selfieRow = el('div', 'pt-selfie', card);
    selfieRow.style.marginTop = '12px';
    const sImg = el('img', '', selfieRow); sImg.alt = '';
    el('small', 'muted', selfieRow, T('Your selfie only goes to the TV, for this game. It is never saved.'));
    selfieRow.hidden = !photo;
    if (photo) sImg.src = photo;
    pick.onclick = () => takeSelfie(d => { photo = d; sImg.src = photo; selfieRow.hidden = false; mark(); });
    const go = btn(editing ? S().done : S().join, { kind: 'go', huge: true, full: true }, v.body, async () => {
      const name = L.clean(ni.value, 16);
      if (!name) { toast(T('Type your name first.'), 'bad'); ni.focus(); return; }
      const changed = name !== G.name || av !== G.av || photo !== G.photo;
      G.name = name; G.av = av; G.photo = photo;
      store.set('party:name', name); store.set('party:av', av);
      if (editing) { if (changed) { send({ k: 'join', name, av, cap: 2, lg: ownLang(G.lobby) }); if (photo) sendPhoto(); } backToNow(); return; }
      await connect();
    });
    go.style.marginTop = '6px';
    ni.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
    if (!G.name) setTimeout(() => ni.focus(), 300);
  }
  // a selfie: the camera (or a picture on the phone), shrunk here, for the TV alone
  function takeSelfie(done) {
    const f = document.createElement('input');
    f.type = 'file'; f.accept = 'image/*'; f.setAttribute('capture', 'user');
    f.style.display = 'none';
    document.body.appendChild(f);
    f.onchange = async () => {
      const file = f.files && f.files[0];
      f.remove();
      if (!file) return;
      try { let d = await L.shrink(file, 200, 0.72); if (d.length > 58000) d = await L.shrink(file, 140, 0.6); done(d); }
      catch (e) { toast(T('That picture didn\'t work. Try another.'), 'bad'); }
    };
    f.click();
  }
  async function connect(o) {
    G.again = !!(o && o.again);
    G.kicked = false; G.closed = false;
    const v = view(gameName(), { tint: 'sun', night: true });
    const h = hero(v.body, T('Joining the game...'), T('Finding the TV. Keep this page open.'), { node: booPic('boo:hi', 'float') });
    const sp = el('div', 'spin', h); sp.style.margin = '14px auto 0';
    G.me = await memberFor('g:' + G.s.slice(0, 10));
    G.id = G.me.id;
    if (G.R) { try { G.R.close(); } catch (e) {} }
    G.R = await L.room({ secret: G.s, label: 'bvplay', me: G.me, name: G.name, role: 'player', owner: G.tv, open: false, onMsg: m => { if (m.f === G.tv) take(m); } });
    G.phase = 'join'; G.joined = false; G.tries = 0;
    const hi = () => {
      if (G.joined) return;
      if (++G.tries > 30) { notFound(); return; }
      send({ k: 'join', name: G.name, av: G.av, cap: 2, lg: G.plang || '', again: G.again || undefined });
      if (G.tries === 6) { const p = h.querySelector('p'); if (p) p.textContent = T('Still looking. Is the game open on the TV?'); }
      setTimeout(hi, G.tries < 4 ? 1500 : 3000);
    };
    hi();
    keepAwake();
  }
  // (back to whatever this phone was showing: the lobby, the question, or the end)
  function backToNow() { if (G.phase === 'end') showEnd(); else if (G.phase === 'play' && G.q) showQ(); else if (G.phase === 'play') showWait(S().look); else showLobby(); }
  function notFound() {
    tabStore.del('party:in');
    dropBack();
    const v = view(T('Party games'), { tint: 'sun', night: true });
    hero(v.body, T('Can\'t find the game'), T('Check that the game is open on the TV, and that this phone is online. Then try again.'), { sleepy: true });
    btn(T('Try again'), { kind: 'go', full: true, huge: true }, v.body, () => connect());
    btn(T('Type the code instead'), { kind: 'ghost', full: true }, v.body, () => codeScreen()).style.marginTop = '10px';
  }
  async function sendPhoto() {
    if (!G.photo || !L.okPicture(G.photo)) return;
    for (let i = 0; i < 12; i++) {
      try { await G.R.box(G.tv, { k: 'photo', d: G.photo }); return; } catch (e) { await new Promise(r => setTimeout(r, 1000)); }
    }
  }
  let wl = null;
  function keepAwake() {
    try { if (navigator.wakeLock && !wl) navigator.wakeLock.request('screen').then(x => { wl = x; x.addEventListener('release', () => { wl = null; }); }).catch(() => {}); } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden && G.R && G.joined) { send({ k: 'sync' }); keepAwake(); claimMe(); } });
  // (the page is closing: the TV takes this phone off a question that waits for it; if the page comes back, so does it)
  addEventListener('pagehide', () => { if (G.R && G.joined) { try { G.R.send({ k: 'bye' }).catch(() => {}); } catch (e) {} } releaseMe(); });
  addEventListener('pageshow', e => { if (e.persisted && G.R && G.joined) { claimMe(); send({ k: 'sync' }); } });

  // ---------- the phone's Back button (or a back swipe) during a game asks first ----------
  // Back would close this page and drop you out of the game, so while you're in one it asks "Leave the game?": Stay
  // keeps playing, Leave says goodbye to the TV (your score stays, and you can come back) and goes back. Back again
  // while it asks leaves too. (A browser only keeps the extra step that makes this work when a tap added it, so it's
  // added at a tap.)
  const trap = { on: false, ask: null, going: false, popping: false };
  const inGame = () => !!(G.R && G.joined && !G.kicked && !G.closed);
  function armBack() {
    if (trap.on || trap.going || !inGame()) return;
    if (history.state && history.state.bvBack) { trap.on = true; return; }
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;
    try { history.pushState({ bvBack: 1 }, '', location.href); trap.on = true; } catch (e) {}
  }
  // (out of the game another way, like the TV closing it: the extra step goes, so the next Back isn't lost on it)
  function disarmBack() {
    if (!trap.on) return;
    trap.on = false;
    if (history.state && history.state.bvBack) { trap.popping = true; history.back(); }
  }
  for (const ev of ['pointerup', 'keydown', 'click']) addEventListener(ev, armBack, true);
  addEventListener('popstate', e => {
    if (trap.popping) { trap.popping = false; return; }
    if (e.state && e.state.bvBack) { trap.on = true; return; }
    if (!trap.on) return;
    trap.on = false;
    if (trap.going) return;
    if (inGame()) askLeave(); else history.back();
  });
  function askLeave() {
    if (trap.ask) return;
    buzz('tap');
    let leaving = false;
    trap.ask = sheet(S().leaveQ, (sh, close) => {
      sh.classList.add('pt-leave');
      sh.insertBefore(booPic('boo:sad', 'float'), sh.querySelector('h2'));
      el('p', 'pt-leave-p', sh, G.host ? S().leaveHost : S().leaveWhy);
      btn(S().stay, { kind: 'go', full: true, huge: true }, sh, () => close());
      pair(sh, [[S().leave, () => { leaving = true; close(); leaveNow(); }, 'bad']]);
    }, { onClose: () => { trap.ask = null; if (!leaving) armBack(); } });
  }
  // Leave: goodbye to the TV, then where Back was going (the Blokvane home when this game was the first page here)
  function leaveNow() {
    trap.going = true;
    quitParty();
    const here = location.href;
    try { history.back(); } catch (e) {}
    setTimeout(() => {
      trap.going = false;
      if (location.href === here) { history.replaceState(null, '', location.pathname); GO.route(); }
    }, 500);
  }
  // out of this game: the TV hears goodbye (unless it's the one that closed), and this phone stops listening
  function quitParty(quiet) {
    const r = G.R;
    if (!r) return;
    if (!quiet && G.joined) { try { r.send({ k: 'bye' }).catch(() => {}); } catch (e) {} }
    G.R = null; G.joined = false; G.phase = 'join';
    stopQ(); hideNext();
    tabStore.del('party:in'); releaseMe();
    if (trap.ask) { const c = trap.ask; trap.ask = null; c(); }
    if (wl) { try { wl.release(); } catch (e) {} wl = null; }
    setTimeout(() => { try { r.close(); } catch (e) {} }, 1500);
  }
  // (another page here, like the Blokvane home after a second Back, or another game: out of this one)
  addEventListener('hashchange', () => { if (G.R && G.s && location.hash.indexOf('#game.' + G.s) !== 0) quitParty(); });
  // the TV closed the game (someone left it there, or closed its page): say so, and offer another game
  function closedScreen() {
    if (G.closed) return;
    G.closed = true;
    disarmBack();
    quitParty(true);
    dropBack();
    const v = view(gameName(), { tint: 'sun', night: true, back: () => { history.replaceState(null, '', location.pathname); GO.route(); } });
    hero(v.body, S().closedT, S().thanks, { node: booPic('boo:love', 'float') });
    btn(T('Join a game'), { kind: 'go', huge: true, full: true }, v.body, () => codeScreen());
  }
  setInterval(() => {
    if (!G.R || !G.joined) return;
    const quiet = Date.now() - G.lastHeard;
    if (quiet > 20000) send({ k: 'sync' });
    // (still here: "Back to the game" keeps pointing at this game)
    if (Date.now() - (G.backAt || 0) > 60000) { G.backAt = Date.now(); keepBack(); }
    // (the TV went quiet for a minute: say so, once a minute, instead of a screen that just waits)
    if (quiet > 60000 && Date.now() - (G.warned || 0) > 60000) { G.warned = Date.now(); toast(T('Can\'t reach the TV. Is the game still open on it?'), 'bad'); }
  }, 10000);

  // ---------- what the TV says ----------
  function take(m) {
    if (!G.R) return;
    G.lastHeard = Date.now();
    switch (m.k) {
      case 'you': {
        if (m.id !== G.id) return;
        const first = !G.joined;
        G.joined = true; G.color = typeof m.color === 'string' ? m.color : ''; G.host = !!m.host;
        if (first) { tabStore.set('party:in', { s: G.s.slice(0, 10), at: Date.now() }); G.backAt = Date.now(); keepBack(); if (G.photo) sendPhoto(); buzz('ok'); armBack(); }
        if (G.phase === 'join') { G.phase = 'lobby'; if (G.lobby) onLobby(G.lobby, true); else showLobby(); }
        return;
      }
      // ("still there?" from the TV, while a question with no clock waits for this phone)
      case 'ping': send({ k: 'pong' }); return;
      case 'kicked': return kickedScreen();
      case 'closed': return closedScreen();
      case 'full': if (!G.joined) { G.tries = 99; const v = view(T('Party games'), { tint: 'sun', night: true }); hero(v.body, T('This game is full'), T('It already has 40 players. Ask for a new game on the TV.'), { sleepy: true }); } return;
      case 'lobby': return onLobby(m);
      case 'q': return onQ(m);
      case 'nextq': return onNextQ(m);
      case 'revealq': return onRevealQ(m);
      case 'hint': return onHint(m);
      case 'res': return onRes(m);
      case 'imp': return isImpGame() ? onImp(m) : undefined;
      case 'emo': return isEmo() ? onEmo(m) : undefined;
      case 'end': G.ranking = Array.isArray(m.ranking) ? m.ranking.slice(0, 10) : null; if (G.phase === 'end') showEnd(); return;
      case 'helped': return onHelped(m);
      case 'gclue': return onClue(m);
      case 'secret': if (m.boxed) { G.secret = m; if (isImpGame()) { if (G.imp && ['peek', 'clue', 'talk'].includes(G.imp.t) && !G.impQ) impDraw(); return; } if (G.phase === 'play' && G.q && (G.q.kind === 'wait' || !G.q.who.includes(G.id))) showQ(); } return;
      case 'bingo-cards':
        if (m.boxed && Array.isArray(m.cards)) {
          G.bingo = { style: m.style === '90' ? '90' : '75', cards: m.cards.slice(0, 3).filter(c => c && Number.isInteger(c.no) && Array.isArray(c.cells)), auto: !!m.auto, big: !!m.big, pattern: String(m.pattern || 'line'), called: new Set(), marks: new Set(), last: 0, wait: 0 };
          G.phase = 'play'; showBingo();
        }
        return;
      case 'bingo-call':
        if (G.bingo && Number.isInteger(m.n)) {
          for (const n of (Array.isArray(m.called) ? m.called : [m.n])) if (Number.isInteger(n)) G.bingo.called.add(n);
          G.bingo.last = m.n;
          if (G.bingo.auto) for (const n of G.bingo.called) G.bingo.marks.add(n);
          paintBingo(true);
          // (a TV that can't speak: the host's phone reads the numbers out instead)
          if (G.host && m.spoke === false && I()) I().speak((G.bingo.style === '75' && ['en', 'es', 'fr'].includes(G.lang) ? 'BINGO'[Math.min(4, Math.floor((m.n - 1) / 15))] + ' ' : '') + m.n, G.lang);
        }
        return;
      case 'bingo-paper': if (m.boxed && Array.isArray(m.cards)) { G.paper = m; if (G.bingo) showBingo(); } return;
      default:
    }
  }
  function onLobby(m, force) {
    const prev = G.lobby, was = G.phase;
    G.lobby = m;
    if (m.strings && typeof m.strings === 'object') G.tvStrings = m.strings;
    G.host = m.host === G.id;
    const lg = effLang(m);
    // (a new language: its words load first, then this screen shows again in it)
    if (lg !== G.lang) return useLang(lg).then(() => { if (G.lobby === m) onLobbyNow(m, prev, G.phase, true); });
    // (a language Chrome translates on the TV: its words may have just come in)
    if (I() && lg !== 'en' && !I().FULL.has(lg)) useLang(lg);
    return onLobbyNow(m, prev, was, force);
  }
  function onLobbyNow(m, prev, was, force) {
    G.host = m.host === G.id;
    document.documentElement.classList.toggle('g-gir', m.game === 'gir');
    document.documentElement.classList.toggle('g-imp', m.game === 'imposter');
    document.documentElement.classList.toggle('g-emo', m.game === 'emoji');
    if (m.game === 'imposter') impLoad();
    if (m.phase !== 'play' || !G.host) hideNext();
    const mine = Array.isArray(m.players) ? m.players.find(p => p && p.id === G.id) : null;
    if (mine) { G.score = +mine.score || 0; G.lives = typeof mine.lives === 'number' ? mine.lives : null; G.out = !!mine.out; G.team = mine.team || ''; G.ready = !!mine.ready; }
    if (!G.joined) return;
    // (this phone's own language, the way the TV should have it: said again whenever the TV has it wrong)
    if (mine) { const want = ownLang(m), tag = want + '|' + tvLangOf(m); if ((mine.lg || '') !== want && G.plangSent !== tag) { G.plangSent = tag; send({ k: 'plang', v: want }); } }
    if (prev && prev.host !== m.host && G.host) { toast(S().youHost, 'ok'); buzz('ok'); }
    // ("Back to the game" says which game)
    if (!prev || prev.gname !== m.gname) keepBack();
    // (after a game, "Play again": the host's phone opens on the last step, everything as it was, ready to start)
    if (G.host && m.phase === 'lobby' && was === 'end') G.wiz = 99;
    if (m.phase === 'play') {
      if (was !== 'play') { G.phase = 'play'; G.used.clear(); G.secret = null; G.bingo = null; G.paper = null; G.res = null; G.endRes = null; G.ranking = null; G.endFx = false; G.q = null; G.imp = null; G.impQ = null; G.impRes = null; G.impFinal = null; G.impClues = []; G.emoWin = null; showWait(S().look, 'boo:hi'); }
      else updMe();
    } else if (m.phase === 'end') {
      if (was !== 'end' || force) { G.phase = 'end'; G.q = null; stopQ(); showEnd(); }
      else if (prev && prev.host !== m.host) showEnd();
    } else {
      const big = force || was !== 'lobby' || !prev || prev.game !== m.game || prev.host !== m.host || prev.lang !== m.lang || visSig(prev) !== visSig(m) || teamsOn(prev) !== teamsOn(m) || !!prev.mlang !== !!m.mlang || JSON.stringify(prev.howto || null) !== JSON.stringify(m.howto || null);
      G.phase = 'lobby'; G.q = null;
      if (big) { stopQ(); showLobby(); } else updLobby();
    }
  }
  // the TV waits for the host: one big button on the host's phone, over whatever it shows (Next question, or Show the
  // answer when a question has no time limit)
  function hostBar(kind, n, label, icon) {
    const key = kind + ':' + n;
    if (G.barDone === key || (G.ui.next && G.ui.next.isConnected && G.ui.next._key === key)) return;
    hideNext();
    const bar = el('div', 'pt-next', document.body);
    bar._key = key;
    btn(icon + ' ' + label, { kind: 'go', huge: true, full: true }, bar, () => { G.barDone = key; send({ k: kind, n }); buzz('tap'); hideNext(); });
    G.ui.next = bar;
    buzz('tap');
  }
  const label = (m, fb) => (typeof m.label === 'string' && L.clean(m.label, 40) ? L.clean(m.label, 40) : T(fb));
  function onNextQ(m) {
    if (!G.host || G.phase !== 'play' || !Number.isInteger(m.n)) return;
    hostBar('next', m.n, label(m, 'Next question'), '⏭️');
  }
  // (the host answers first; then the button shows)
  function onRevealQ(m) {
    if (!G.host || G.phase !== 'play' || !Number.isInteger(m.n) || !G.q || G.q.n !== m.n || G.res) return;
    G.revealQ = { n: m.n, label: label(m, 'Show the answer') };
    if (G.answered) hostBar('reveal', m.n, G.revealQ.label, '👀');
  }
  function hideNext() { if (G.ui.next) { G.ui.next.remove(); G.ui.next = null; } }
  function onQ(m) {
    if (!m || !Number.isInteger(m.n) || !Array.isArray(m.who) || typeof m.kind !== 'string') return;
    if (G.q && m.n <= G.q.n) return;
    hideNext();
    const inIt = m.who.includes(G.id);
    if (m.extra && m.extra.helpOnly && !inIt) return;
    if (G.bingo && m.kind === 'wait') return;
    G.phase = 'play';
    G.q = m; G.qAt = performance.now(); G.answered = false; G.locked = false; G.res = null;
    showQ();
  }
  function onRes(m) {
    if (m.end) { G.endRes = m; if (typeof m.score === 'number') G.score = m.score; if (G.phase === 'end') showEnd(); return; }
    if (typeof m.score === 'number') G.score = m.score;
    if (typeof m.lives === 'number') G.lives = m.lives;
    if (m.out) G.out = true;
    // (a quick word in the middle of a turn, like "try another one" or "not yet")
    if (m.ok === false && m.pts == null && m.right == null && !m.out && m.note) { toast(L.clean(m.note, 140), 'bad'); buzz('bad'); return; }
    if (G.bingo) { updMe(); return; }
    // (the answer is out: no more "Show the answer")
    G.revealQ = null;
    if (G.ui.next && String(G.ui.next._key).startsWith('reveal:')) hideNext();
    G.res = m;
    showRes(m);
  }

  // ---------- the screens ----------
  // the top of every game page: the house and the game on the left, you (with a Host badge on the host's phone) on the
  // right; during a game, the ⋯ instead
  function partyView(title, o) {
    o = o || {};
    const v = view(title, { tint: 'sun', night: true, back: o.back || null });
    v.top.classList.add('pt-top');
    // (top left: the game's own icon once the host picked one, a little house before)
    if (!o.back) {
      const b = v.top.querySelector('.boo'); if (b) b.remove();
      const gid = G.lobby && G.lobby.game;
      let h;
      if (ICONS.has(gid)) { h = gameIcon(gid); h.classList.add('pt-home'); } else { h = el('span', 'pt-home'); h.appendChild(GO.icon('home')); }
      v.top.insertBefore(h, v.top.firstChild);
    }
    if (G.joined && o.chip !== false) v.top.appendChild(chip());
    return v;
  }
  function chip() {
    const c = el('span', 'pt-chip');
    const im = el('img', '', c); im.src = G.photo || booUri(G.av) || booUri('boo:hi'); im.alt = '';
    el('b', '', c, G.name);
    if (G.host) el('i', '', c, S().hostBadge);
    return c;
  }
  function gameView() {
    const v = partyView(gameName(), { chip: false });
    // (the ⋯ on every phone: your picture, your language, leaving; the host's tools too)
    if (G.joined) {
      const x = el('button', 'pt-more', v.top);
      x.type = 'button'; x.title = S().menu; x.setAttribute('aria-label', S().menu);
      x.appendChild(GO.icon('dots'));
      x.onclick = () => { buzz('tap'); menuSheet(); };
    }
    meRow(v.body);
    return v;
  }
  const myPic = () => G.photo || booUri(G.av) || booUri('boo:hi');
  // the ⋯ during a game, on every phone: you, with a new picture (a Boo or a selfie) and leaving the game, and your own
  // language in a game that has it. The host also has the host's tools: the players (make one the host, or take one
  // out), the join code on the TV again, the TV's size, and ending the game.
  function menuSheet() {
    const l = G.lobby || {};
    sheet('', (sh, close) => {
      sh.classList.add('pt-menu');
      const me = el('div', 'pt-mehead', sh);
      const im = el('img', '', me); im.src = myPic(); im.alt = '';
      if (G.color) im.style.boxShadow = '0 0 0 3px ' + G.color;
      const t = el('span', '', me);
      el('b', '', t, G.name);
      if (G.host) el('i', '', t, S().hostBadge);
      pair(sh, [['🖼️ ' + S().changePic, () => { close(); picSheet(); }], ['🚪 ' + S().leaveGame, () => { close(); askLeave(); }, 'bad']]);
      if (l.mlang && !G.host) langCard(sh, l, close);
      if (G.host) {
        el('label', 'pt-lbl', sh, S().players);
        const adm = el('div', 'pt-adm', sh);
        for (const p of Array.isArray(l.players) ? l.players : []) {
          const r = el('div', 'r', adm);
          const pi = el('img', '', r); pi.src = p.id === G.id ? myPic() : booUri(AVATARS.includes(p.av) ? p.av : 'boo:hi'); pi.alt = '';
          el('b', '', r, p.id === G.id ? S().you : L.clean(p.name, 16));
          if (p.id === l.host) { el('i', '', r, S().hostBadge); continue; }
          const mk = el('button', '', r); mk.type = 'button'; el('span', '', mk, '👑 ' + S().makeHost);
          twice(mk, () => { send({ k: 'makehost', id: p.id }); close(); toast(T(STR0.newHost, { name: L.clean(p.name, 16) }), 'ok'); });
          const rm = el('button', 'bad', r); rm.type = 'button'; el('span', '', rm, S().remove);
          twice(rm, () => { send({ k: 'kick', id: p.id }); r.remove(); });
        }
        const on = !!l.joinOn;
        const jc = btn(on ? S().hideCode : S().showCode, { kind: on ? 'ghost' : 'tint', full: true, icon: 'phone' }, sh, () => { send({ k: 'showjoin', on: !on }); if (!on) toast(S().codeOn, 'ok'); close(); });
        jc.style.marginTop = '14px';
        tvSizeRow(sh, l);
        if (G.phase === 'play') {
          const eb = el('button', 'pt-dk bad', sh); eb.type = 'button'; el('span', '', eb, S().endGame);
          eb.style.cssText = 'width:100%;margin-top:16px';
          twice(eb, () => { send({ k: 'stop' }); close(); });
        }
      }
    });
  }
  // a new picture, in the middle of a game: one of the Boos, or a selfie (it only goes to the TV, and isn't kept)
  function picSheet() {
    sheet(S().changePic, (sh, close) => {
      el('h2', 'pt-sub', sh, S().pickBoo);
      const avs = el('div', 'pt-avs', sh);
      for (const id of AVATARS) {
        const b = el('button', 'pt-av', avs);
        b.type = 'button';
        b.setAttribute('aria-label', T('Pick this Boo'));
        b.setAttribute('aria-pressed', String(!G.photo && id === G.av));
        const im = el('img', '', b); im.src = booUri(id); im.alt = '';
        b.onclick = () => { close(); setPic(id, ''); };
      }
      btn(S().selfie, { kind: 'ghost', full: true, icon: 'camera' }, sh, () => takeSelfie(d => { close(); setPic(G.av, d); }));
      el('p', 'pt-note', sh, T('Your selfie only goes to the TV, for this game. It is never saved.'));
    });
  }
  function setPic(av, photo) {
    photo = photo || '';
    if (av === G.av && photo === (G.photo || '')) return;
    G.av = av; G.photo = photo;
    store.set('party:av', av);
    // (the TV hears it the way it hears a name change; a Boo instead of a selfie drops the selfie there too)
    send({ k: 'join', name: G.name, av, cap: 2, lg: ownLang(G.lobby), nophoto: photo ? undefined : 1 });
    if (photo) sendPhoto();
    const u = G.ui.me;
    if (u && u.im && u.im.isConnected) u.im.src = myPic();
    toast(S().picDone, 'ok'); buzz('ok');
  }
  // taken out of the game by the host: say so, and offer to join again
  function kickedScreen() {
    if (G.kicked) return;
    G.kicked = true; G.joined = false; G.tries = 99;
    disarmBack();
    stopQ(); hideNext();
    tabStore.del('party:in'); dropBack(); releaseMe();
    const v = view(gameName(), { tint: 'sun', night: true });
    hero(v.body, S().removed, S().removedWhy, { sleepy: true });
    btn(S().joinAgain, { kind: 'go', huge: true, full: true }, v.body, () => connect({ again: true }));
  }
  function meRow(parent) {
    const r = el('div', 'pt-me', parent);
    const im = el('img', '', r); im.src = myPic(); im.alt = '';
    if (G.color) im.style.boxShadow = '0 0 0 3px ' + G.color;
    el('b', '', r, G.name);
    const tm = TEAMS.find(t => t[0] === G.team);
    if (tm && G.lobby && teamsOn(G.lobby)) { const p = el('span', 'pill', r, S()[tm[1]] || tm[1]); p.style.background = tm[2]; }
    const hearts = el('span', 'pt-hearts', r);
    const sc = el('span', 'pt-score', r);
    G.ui.me = { sc, hearts, im };
    updMe();
  }
  function usesLives() { const l = G.lobby || {}; return (l.game === 'trivia' || l.game === 'gir') && !!l.settings && l.settings.mode === 'lives'; }
  function updMe() {
    const u = G.ui.me;
    if (!u || !u.sc.isConnected) return;
    u.sc.textContent = String(G.score || 0);
    u.hearts.textContent = usesLives() && G.lives != null ? '❤️'.repeat(Math.max(0, Math.min(5, G.lives))) || '💀' : '';
  }
  function showWait(text, boo, sub) {
    stopQ();
    const v = gameView();
    const w = el('div', 'pt-wait', v.body);
    w.appendChild(booPic(boo || 'boo:hi'));
    el('h1', '', w, text || S().look);
    if (sub) el('p', '', w, sub);
    return v;
  }

  // the lobby: the host sets the game up (in steps), everyone else picks their language and gets ready
  function showLobby() {
    stopQ();
    const l = G.lobby || {};
    if (G.host && l.game) return wizard(l);
    G.ui = {};
    const v = partyView(l.gname || T('Party games'));
    const games = Array.isArray(l.games) ? l.games : [];
    if (!l.game) {
      if (G.host) {
        el('h1', 'pt-h', v.body, S().pickGame);
        el('p', 'lead', v.body, T('You\'re the host. Pick a game:'));
        gameList(v.body, games, '');
      } else {
        const w = el('div', 'pt-wait', v.body);
        w.appendChild(booPic('boo:mind'));
        el('h1', '', w, S().picking);
      }
      pair(v.body, [[S().changeName, () => joinScreen(true)]]);
      return;
    }
    const g = games.find(x => x.id === l.game) || { e: '🎲', name: l.gname || '', sub: '' };
    const gc = el('div', 'pt-gcard', v.body);
    gc.appendChild(gameIcon(l.game, g.e));
    const t = el('span', '', gc); el('b', '', t, g.name); el('small', '', t, S().hostWait);
    // your own language (Trivia: the questions and answers on your phone in it)
    if (l.mlang) langCard(v.body, l);
    howtoCard(v.body, l);
    if (teamsOn(l)) {
      const box = el('div', 'card', v.body);
      el('h2', '', box, S().team);
      const n = Math.min(4, +(l.settings && l.settings.teamN) || 2);
      G.ui.team = seg(TEAMS.slice(0, n).map(t2 => [t2[0], S()[t2[1]] || t2[1]]), G.team, team => { send({ k: 'team', team }); G.team = team; buzz('tap'); }, box);
    }
    G.ui.ready = btn(G.ready ? '✓ ' + S().ready : S().ready, { kind: G.ready ? 'tint' : 'go', huge: true, full: true }, v.body, () => { G.ready = !G.ready; send({ k: 'ready', on: G.ready }); paintReady(); buzz('tap'); });
    G.ui.pb = el('div', '', v.body);
    fillPlayers(G.ui.pb, l, false);
    pair(v.body, [[S().changeName, () => joinScreen(true)]]);
  }
  function paintReady() {
    const b = G.ui.ready;
    if (!b || !b.isConnected) return;
    b.className = 'btn huge full ' + (G.ready ? 'tint' : 'go');
    b.querySelector('span').textContent = G.ready ? '✓ ' + S().ready : S().ready;
  }
  function updLobby() {
    const l = G.lobby || {};
    // (the host's steps show again as they are now, unless the host is typing in one)
    if (G.ui.wiz) {
      const a = document.activeElement;
      if (a && a.closest && a.closest('.pt-wz') && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.type !== 'checkbox') return;
      wizard(l, true);
      return;
    }
    paintReady();
    updMe();
    if (G.ui.pb && G.ui.pb.isConnected) fillPlayers(G.ui.pb, l, false);
    if (G.ui.team && G.team) G.ui.team.set(G.team);
  }
  const teamsOn = l => !!l && (typeof l.teams === 'boolean' ? l.teams : !!(l.settings && l.settings.teams && (l.schema || []).some(f => f && f.key === 'teams')));
  // the players: who's in, who's ready (the host taps one to make them the host or take them out)
  function fillPlayers(box, l, admin) {
    box.textContent = '';
    const ps = Array.isArray(l.players) ? l.players : [];
    const hd = el('div', 'pt-ph', box);
    el('h2', '', hd, T('Players ({n})', { n: ps.length }));
    el('span', '', hd, T(STR0.readyN, { n: ps.filter(p => p.ready).length, total: ps.length }) + ' ✓');
    // (a full room: smaller tiles, five in a row)
    const g = el('div', 'pt-players' + (ps.length > 9 ? ' many' : ''), box);
    for (const p of ps) {
      const c = el(admin && p.id !== G.id ? 'button' : 'div', 'pt-pl', g);
      if (c.tagName === 'BUTTON') { c.type = 'button'; c.onclick = () => playerSheet(p); }
      if (p.id === l.host) el('span', 'cr', c, '👑');
      if (p.ready) el('span', 'ok', c, '✓');
      const im = el('img', '', c); im.src = booUri(AVATARS.includes(p.av) ? p.av : 'boo:hi'); im.alt = '';
      if (p.color) im.style.boxShadow = '0 0 0 3px ' + p.color;
      el('b', '', c, p.id === G.id ? S().you : L.clean(p.name, 16));
      if (p.lg && l.mlang) el('small', 'lg', c, String(p.lg).toUpperCase().slice(0, 2));
    }
    const min = { imposter: 3, boowho: 2, fakeout: 2 }[l.game] || 1;
    if (admin && ps.length < min) el('p', 'pt-note', box, S().needMore + ` (${ps.length}/${min})`);
  }
  // how to play: a game's own rules for the settings the host picked (Guess It Right!), in this phone's language
  function howtoCard(parent, l) {
    if (!Array.isArray(l.howto) || !l.howto.length) return null;
    const box = el('div', 'card pt-howto', parent);
    el('h2', '', box, T('How to play'));
    for (const r of l.howto.slice(0, 8)) { if (!Array.isArray(r) || typeof r[1] !== 'string') continue; const d = el('div', 'r', box); el('i', '', d, L.clean(String(r[0] || ''), 6)); el('span', '', d, L.clean(T(r[1]), 240)); }
    return box;
  }
  // two buttons side by side (or one), for the things you might also want to do
  function pair(parent, items) {
    const row = el('div', 'pt-pair' + (items.length === 1 ? ' one' : ''), parent);
    for (const [t, fn, cls] of items) { const b = el('button', 'pt-dk' + (cls ? ' ' + cls : ''), row, t); b.type = 'button'; b.onclick = () => { buzz('tap'); fn(); }; }
    return row;
  }
  // (a button that needs a second tap, for what can't be undone)
  function twice(b, fn) {
    const sp = b.querySelector('span') || b, label = sp.textContent;
    let armed = 0;
    b.onclick = () => {
      if (Date.now() - armed < 3500) { armed = 0; fn(); return; }
      armed = Date.now(); sp.textContent = S().tapAgain; buzz('tap');
      setTimeout(() => { if (sp.isConnected && Date.now() - armed >= 3400) sp.textContent = label; }, 3500);
    };
  }
  // the host taps a player: make them the host, or take them out of the game
  function playerSheet(p) {
    sheet(L.clean(p.name, 16), (sh, close) => {
      const row = el('div', 'pt-pair', sh);
      const mk = el('button', 'pt-dk', row); mk.type = 'button'; el('span', '', mk, '👑 ' + S().makeHost);
      twice(mk, () => { send({ k: 'makehost', id: p.id }); close(); toast(T(STR0.newHost, { name: L.clean(p.name, 16) }), 'ok'); });
      const rm = el('button', 'pt-dk bad', row); rm.type = 'button'; el('span', '', rm, S().remove);
      twice(rm, () => { send({ k: 'kick', id: p.id }); close(); });
    });
  }
  // the TV's size, for a TV nobody can click on: smaller, bigger, or back to fitting by itself
  function tvSizeRow(parent, l) {
    const r = el('div', 'pt-tv', parent);
    el('span', '', r, '📺 ' + S().tvSize);
    if (l.zoom) el('small', '', r, l.zoom + '%');
    const g = el('span', 'pt-tvb', r);
    for (const [t, d] of [['A−', -1], [S().autoSize, 0], ['A+', 1]]) { const b = el('button', '', g, t); b.type = 'button'; b.onclick = () => { send({ k: 'zoom', d }); buzz('tap'); }; }
    return r;
  }
  // your own language, for a game that has it: the TV stays in the game's language, your phone shows each question and
  // its answers in yours
  function langCard(parent, l, after) {
    const tv = tvLangOf(l), mine = ownLang(l);
    const box = el('div', 'card pt-lang', parent);
    el('h2', '', box, '🌐 ' + S().myLang);
    const w = el('span', 'pt-sel', box);
    const sel = el('select', '', w);
    const o0 = el('option', '', sel, T(STR0.sameTv, { lang: langName(tv) })); o0.value = '';
    for (const [code, nm] of langsFull()) { if (code === tv || (gameLangs(l) && !gameLangs(l).includes(code))) continue; const o = el('option', '', sel, nm); o.value = code; }
    sel.value = mine;
    el('p', 'pt-info', box, mine ? T(STR0.langMine, { lang: langName(mine), tv: langName(tv) }) : T(STR0.langFollow, { lang: langName(tv) }));
    sel.onchange = async () => {
      G.plang = sel.value;
      store.set('party:plang', G.plang);
      G.plangSent = G.plang + '|' + tv;
      send({ k: 'plang', v: G.plang });
      buzz('tap');
      await useLang(effLang(G.lobby || l));
      if (after) after();
      backToNow();
    };
    return box;
  }

  // ---------- the host sets the game up: one thing at a time, then everything at a glance, and Start ----------
  const WZC = ['#ff5f57', '#3d8bff', '#ffbf3c', '#2fd59a', '#a46bff', '#ff7ac8', '#33d1c4', '#ff9f43'];
  function wizSteps(l) {
    const schema = (Array.isArray(l.schema) ? l.schema : []).filter(f => f && typeof f.key === 'string');
    const keys = schema.map(f => f.key);
    let steps = Array.isArray(l.steps) ? l.steps.filter(x => x && Array.isArray(x.keys)).map(x => ({ t: L.clean(x.t, 40), s: L.clean(x.s || x.t, 30), keys: x.keys.filter(k => k === 'lang' || keys.includes(k)) })) : [];
    // (a game without steps of its own: its settings, about three to a page, the language on the first; each page's row
    // on the last step is named after its first setting)
    if (!steps.length) {
      const pages = [];
      let cur = ['lang'], w = 1;
      for (const f of schema) {
        const cost = f.type === 'toggle' ? 0.5 : f.type === 'text' ? 1.5 : Array.isArray(f.options) && f.options.length > 6 ? 2 : 1;
        if (w + cost > 3.01 && cur.length) { pages.push(cur); cur = []; w = 0; }
        cur.push(f.key); w += cost;
      }
      if (cur.length) pages.push(cur);
      steps = pages.map(ks => { const f = schema.find(x => x.key === ks.find(k => k !== 'lang')); return { t: S().settings, s: f ? L.clean(f.label, 30) : S().lang, keys: ks }; });
    }
    // (a setting no step names goes on the last one; the language goes on the first)
    const named = new Set(steps.flatMap(x => x.keys));
    for (const k of keys) if (!named.has(k)) steps[steps.length - 1].keys.push(k);
    if (!named.has('lang')) steps[0].keys.unshift('lang');
    const on = k => k === 'lang' || shown(schema.find(f => f.key === k), l.settings);
    return steps.map(x => Object.assign({}, x, { keys: x.keys.filter(on) })).filter(x => x.keys.length);
  }
  function wizard(l, keep) {
    stopQ();
    const steps = wizSteps(l);
    if (G.wizGame !== l.game) { G.wizGame = l.game; G.wiz = 0; }
    G.wiz = Math.max(0, Math.min(steps.length, G.wiz | 0));
    const k = G.wiz, last = k === steps.length, N = steps.length + 1;
    const y = keep ? window.scrollY : 0;
    G.ui = { wiz: true };
    const v = partyView(l.gname || T('Party games'));
    const wz = el('div', 'pt-wz', v.body);
    const pr = el('div', 'pt-prog', wz);
    pr.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < N; i++) { const x = el('i', i <= k ? 'on' : '', pr); x.style.setProperty('--c', WZC[i % WZC.length]); }
    const go = n => { G.wiz = n; buzz('tap'); wizard(G.lobby || l); window.scrollTo(0, 0); };
    if (!last) {
      const st = steps[k];
      const hd = el('div', 'pt-wh', wz);
      el('h1', '', hd, st.t);
      el('span', '', hd, T(STR0.stepOf, { n: k + 1, total: N }));
      for (const key of st.keys) {
        if (key === 'lang') langRow(wz, l);
        else setCtl(wz, l.schema.find(f => f.key === key), l);
      }
      const nav = el('div', 'pt-nav', wz);
      if (k > 0) { const b = el('button', 'bk', nav, S().back); b.type = 'button'; b.onclick = () => go(k - 1); }
      else { const b = el('button', 'bk sp', nav, S().back); b.type = 'button'; b.disabled = true; }
      const n = el('button', 'nx', nav, S().next); n.type = 'button'; n.onclick = () => go(k + 1);
    } else readyPage(wz, l, steps, () => go(0));
    if (keep) window.scrollTo(0, y);
  }
  // the game's language, for the TV and every phone (the host picks it on the first step)
  function langRow(parent, l) {
    const row = el('div', 'pt-langrow', parent);
    el('span', '', row, '🌐 ' + S().lang);
    const w = el('span', 'pt-sel', row);
    const sel = el('select', '', w);
    const only = gameLangs(l);
    for (const [code, name] of langsFull()) { if (only && !only.includes(code)) continue; const o = el('option', '', sel, name); o.value = code; }
    if (!only && langsMore().length) { const og = el('optgroup', '', sel); og.label = T('More languages (translated by Chrome on a computer)'); for (const [code, name] of langsMore()) { const o = el('option', '', og, name); o.value = code; } }
    sel.value = [...langsFull(), ...langsMore()].some(x => x[0] === l.lang) && (!only || only.includes(l.lang)) ? l.lang : (only ? only[0] : 'en');
    sel.onchange = () => { send({ k: 'set', key: 'lang', v: sel.value }); buzz('tap'); sel.blur(); };
  }
  // one setting, the way the design shows it
  function setCtl(parent, f, l) {
    if (!f) return;
    const cur = l.settings && f.key in l.settings ? l.settings[f.key] : f.default;
    const put = v => { send({ k: 'set', key: f.key, v }); buzz('tap'); };
    const desc = typeof f.desc === 'string' && f.desc ? L.clean(f.desc, 200) : '';
    const label = L.clean(f.label, 80);
    if (f.type === 'toggle') {
      const row = el('label', 'pt-tg', parent);
      const t = el('span', '', row); el('b', '', t, label); if (desc) el('small', '', t, desc);
      const i = el('input', '', row); i.type = 'checkbox'; i.checked = !!cur;
      i.onchange = () => put(i.checked);
      return;
    }
    if (f.look !== 'list') el('label', 'pt-lbl', parent, label);
    if (f.type === 'number') {
      const lo = Number.isFinite(+f.min) ? +f.min : 0, hi = Number.isFinite(+f.max) ? +f.max : 999;
      let val = Math.max(lo, Math.min(hi, Math.round(+(cur != null ? cur : f.default)) || lo));
      // (a few ready-made choices to tap, and under them any number: type it, or step it with − and +)
      const quick = Array.isArray(f.quick) ? f.quick.map(Number).filter(x => Number.isFinite(x) && x >= lo && x <= hi).slice(0, 6) : [];
      let qb = [];
      if (quick.length) {
        const g = el('div', 'pt-grid pt-quick0', parent);
        g.style.gridTemplateColumns = 'repeat(' + quick.length + ', minmax(0, 1fr))';
        qb = quick.map(x => { const b = el('button', 'pt-box num', g, String(x)); b.type = 'button'; b.onclick = () => setVal(x, true); return [x, b]; });
      }
      const row = el('div', 'pt-step', parent);
      const minus = el('button', '', row, '−'); minus.type = 'button'; minus.setAttribute('aria-label', '−');
      const mid = el('span', '', row);
      const vb = el('input', 'pt-num', mid); vb.type = 'text'; vb.inputMode = 'numeric'; vb.value = String(val); vb.setAttribute('aria-label', label); vb.maxLength = 4;
      if (f.unit) el('small', '', mid, L.clean(f.unit, 20));
      const plus = el('button', '', row, '+'); plus.type = 'button'; plus.setAttribute('aria-label', '+');
      let tm = 0;
      const paintQ = () => { for (const [x, b] of qb) b.setAttribute('aria-pressed', String(x === val)); };
      function setVal(nv, now) { nv = Math.max(lo, Math.min(hi, Math.round(nv))); if (!Number.isFinite(nv)) return; const same = nv === val; val = nv; vb.value = String(val); paintQ(); clearTimeout(tm); if (!same || now) tm = setTimeout(() => send({ k: 'set', key: f.key, v: val }), now ? 0 : 400); buzz('tap'); }
      paintQ();
      vb.addEventListener('focus', () => { try { vb.select(); } catch (e) {} });
      vb.addEventListener('input', () => { vb.value = vb.value.replace(/[^0-9]/g, '').slice(0, 4); });
      const typed = () => { const n = parseInt(vb.value, 10); if (Number.isFinite(n)) setVal(n, true); else vb.value = String(val); };
      vb.addEventListener('change', typed);
      vb.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); typed(); vb.blur(); } });
      const step = d => { const nv = Math.max(lo, Math.min(hi, val + d)); if (nv === val) return; val = nv; vb.value = String(val); paintQ(); clearTimeout(tm); tm = setTimeout(() => send({ k: 'set', key: f.key, v: val }), 400); buzz('tap'); };
      // (hold to keep going, faster and faster)
      for (const [b, d] of [[minus, -1], [plus, 1]]) {
        let rt = 0, n = 0;
        const stop = () => { clearTimeout(rt); rt = 0; };
        const run = () => { step(d); n++; rt = setTimeout(run, n < 4 ? 320 : n < 12 ? 140 : 60); };
        b.addEventListener('pointerdown', e => { e.preventDefault(); n = 0; stop(); run(); });
        for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, stop);
        b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); step(d); } });
      }
      if (desc) el('p', 'pt-info', parent, desc);
      return;
    }
    if (f.type === 'text') {
      const t = input({ multi: true, max: 1500, value: cur || '' });
      t.classList.add('pt-text');
      parent.appendChild(t);
      let tm = 0;
      t.oninput = () => { t.dataset.dirty = '1'; clearTimeout(tm); tm = setTimeout(() => { send({ k: 'set', key: f.key, v: t.value }); t.dataset.dirty = ''; }, 700); };
      if (desc) el('p', 'pt-info', parent, desc);
      return;
    }
    if (!Array.isArray(f.options)) return;
    const opts = f.options.filter(o => Array.isArray(o)).map(o => [o[0], L.clean(o[1], 48), o[2] ? L.clean(o[2], 200) : '']);
    // a choice with a line about each (a game mode): cards, the picked one with a check
    if (f.look === 'list') {
      const ls = el('div', 'pt-list2', parent);
      for (const [v, t, d] of opts) {
        const b = el('button', 'pt-opt', ls); b.type = 'button';
        b.setAttribute('aria-pressed', String(String(v) === String(cur)));
        const tx = el('span', '', b); el('b', '', tx, t); if (d) el('small', '', tx, d);
        el('span', 'ck', b, '✓');
        b.onclick = () => { for (const x of ls.children) x.setAttribute('aria-pressed', String(x === b)); put(v); };
      }
      if (desc) el('p', 'pt-info', parent, desc);
      return;
    }
    // the others: boxes (up to four short ones in a row; two or four longer ones two by two; more in rows of three), and
    // a line under them that says what the picked one does
    const short = opts.every(o => [...o[1]].length <= 9);
    const cols = opts.length <= 4 && short ? opts.length : (opts.length === 2 || opts.length === 4) ? 2 : 3;
    const g = el('div', 'pt-grid' + (opts.length > 9 ? ' many' : ''), parent);
    g.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';
    const info = opts.some(o => o[2]) ? el('p', 'pt-info', null) : null;
    const showInfo = v => { if (!info) return; const o = opts.find(x => String(x[0]) === String(v)); info.textContent = o && o[2] ? o[2] : ''; info.hidden = !info.textContent; };
    for (const [v, t] of opts) {
      const b = el('button', 'pt-box' + (/^\d+$/.test(t) ? ' num' : ''), g, t); b.type = 'button';
      b.setAttribute('aria-pressed', String(String(v) === String(cur)));
      b.onclick = () => { for (const x of g.children) x.setAttribute('aria-pressed', String(x === b)); showInfo(v); put(v); };
    }
    if (info) { parent.appendChild(info); showInfo(cur); }
    if (desc) el('p', 'pt-info', parent, desc);
  }
  // the last step: everything at a glance, who's in, the TV's size, and Start
  function readyPage(wz, l, steps, edit) {
    const hd = el('div', 'pt-ready', wz);
    el('small', '', hd, S().allSet);
    el('h1', '', hd, S().readyQ);
    const sum = el('div', 'pt-sum', wz);
    for (const st of steps) {
      const vals = [];
      let toggles = 0, lang = '';
      for (const key of st.keys) {
        if (key === 'lang') { lang = langName(l.lang || 'en'); continue; }
        const f = l.schema.find(y => y.key === key);
        if (!f) continue;
        const v = l.settings && key in l.settings ? l.settings[key] : f.default;
        if (f.type === 'toggle') { toggles++; if (v) vals.push(L.clean(f.label, 40)); }
        else if (f.type === 'number') vals.push(v + (f.unit ? ' ' + L.clean(f.unit, 20) : ''));
        else if (f.type === 'text') { const n = String(v || '').split('\n').filter(Boolean).length; if (n) vals.push('✍️ ' + n); }
        else if (Array.isArray(f.options)) { const o = f.options.find(o2 => Array.isArray(o2) && String(o2[0]) === String(v)); if (o) vals.push(L.clean(o[1], 40)); }
      }
      if (!vals.length && toggles) vals.push(S().none);
      if (lang) vals.push(lang);
      const r = el('div', '', sum); el('span', '', r, st.s || st.t); el('b', '', r, vals.join(' · ') || '·');
    }
    const ed = el('button', 'pt-edit', wz, S().editSet); ed.type = 'button'; ed.onclick = edit;
    howtoCard(wz, l);
    tvSizeRow(wz, l);
    G.ui.pb = el('div', '', wz);
    fillPlayers(G.ui.pb, l, true);
    // (Start stays at the bottom of the screen while the players scroll by)
    const bar = el('div', 'pt-startbar', wz);
    const st = el('button', 'pt-start', bar); st.type = 'button';
    st.appendChild(GO.icon('play'));
    el('span', '', st, S().start);
    st.onclick = () => { send({ k: 'start' }); buzz('ok'); };
    pair(wz, [[S().otherGame, () => pickGameSheet(Array.isArray(l.games) ? l.games : [])], [S().changeName, () => joinScreen(true)]]);
  }

  function gameList(parent, games, current) {
    const ls = el('div', 'pt-games', parent);
    for (const g of games) {
      const b = el('button', 'pt-game', ls);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(g.id === current));
      b.appendChild(gameIcon(g.id, g.e));
      const t = el('span', '', b); el('b', '', t, L.clean(g.name, 40)); el('small', '', t, L.clean(g.sub, 120));
      b.onclick = () => { send({ k: 'game', id: g.id }); buzz('tap'); for (const x of ls.children) x.setAttribute('aria-pressed', String(x === b)); };
    }
    return ls;
  }
  function pickGameSheet(games) {
    sheet(S().pickGame, (sh, close) => { const ls = gameList(sh, games, (G.lobby || {}).game); ls.addEventListener('click', () => setTimeout(close, 150)); });
  }
  // (a setting that only matters for some choices shows only with them: "Race to" with the race mode. when: [key, value]
  // shows it with that value, [key, '!value'] with any other, [key, [a, b]] with one of those; a list of them, all)
  const cond = (c, set) => {
    if (!Array.isArray(c) || typeof c[0] !== 'string') return true;
    const v = set ? set[c[0]] : undefined, w = c[1];
    if (Array.isArray(w)) return w.some(x => String(x) === String(v));
    if (typeof w === 'string' && w[0] === '!') return String(v) !== w.slice(1);
    return v === w;
  };
  const all = (w, set) => (Array.isArray(w[0]) ? w.every(c => cond(c, set)) : cond(w, set));
  const shown = (f, set) => !f || !f.when || (Array.isArray(f.when) ? all(f.when, set) : Array.isArray(f.when.any) ? f.when.any.some(w => Array.isArray(w) && all(w, set)) : true);
  const visSig = l => (l && Array.isArray(l.schema) ? l.schema.filter(f => f && shown(f, l.settings)).map(f => f.key + ':' + f.label).join('|') : '');

  // a question
  function showQ() {
    stopQ();
    const q = G.q;
    if (!q) return showWait();
    if (G.bingo) return showBingo();
    if (isImpGame()) { if (q.kind !== 'wait' && Array.isArray(q.who) && q.who.includes(G.id)) G.impQ = q; return impDraw(); }
    if (isEmo() && ((q.extra && q.extra.emo) || q.kind === 'emojimake')) return emoQ(q);
    const ex = q.extra || {};
    if (q.kind === 'wait' && ex.tw && typeof ex.tw === 'object') return twScreen(q);
    const inIt = q.who.includes(G.id);
    const imp = G.secret && (G.lobby || {}).game === 'imposter';
    G.ui.clues = null; G.ui.worth = null;
    if (!inIt || q.kind === 'wait') {
      const v = showWait(q.kind === 'wait' ? (L.clean(q.prompt, 160) || S().look) : G.out ? S().out : waitLine(ex) || S().look, G.out ? 'boo:sad' : ex.peek ? 'boo:peek' : 'boo:hi');
      if (imp) peekBox(v.body);
      return;
    }
    const v = gameView();
    const b = v.body;
    if (q.sec > 0) timerBar(b, q.sec);
    // (Trivia: the question is only on the TV, so everyone looks up and the phone has the answers; a player who picked
    // another language gets the question and its answers here, in theirs)
    const mine = trOf(q);
    const prompt = L.clean(mine && mine.p ? mine.p : q.prompt, 300);
    if (prompt && q.kind !== 'pin') { const p = el('div', 'pt-q', b, prompt); if (BVRX.emojiOnly().test(prompt)) p.classList.add('emoji'); }
    else if (ex.tv && mine && mine.q && q.kind !== 'pin') { el('div', 'pt-q', b, L.clean(mine.q, 300)); if (Array.isArray(mine.c)) clueList(b, mine.c, q); }
    else if (ex.tv && q.kind !== 'pin') el('div', 'pt-look', b, '📺 ' + S().look);
    // (Guess It Right!, clue by clue: what a right answer is worth now)
    if (ex.gir && ex.clues && q.kind === 'choice') G.ui.worth = el('div', 'pt-worth', b, worthLine(q));
    G.ui.body = b;
    switch (q.kind) {
      case 'choice': choiceQ(b, q); break;
      case 'players': playersQ(b, q); break;
      case 'text': textQ(b, q); break;
      case 'number': numberQ(b, q); break;
      case 'pin': pinQ(b, q); break;
      case 'emojimake': emojiMakeQ(b, q); break;
      case 'spin': spinQ(b, q); break;
      default: el('p', 'pt-note', b, S().look);
    }
    if (imp) peekBox(b);
  }
  // (Guess It Right!'s team turns: whose turn it is, while the other teams watch)
  const waitLine = ex => (Array.isArray(ex.wt) && typeof ex.wt[0] === 'string' ? L.clean(T(ex.wt[0], { team: T(String(ex.wt[1] || '')) }), 160) : '');
  const worthLine = q => { const ex = q.extra || {}; return L.clean(T(String(ex.wl || '{n} points'), { n: numFmt(+q.w || +ex.w || 100) }), 60); };
  // (Guess It Right!: the four clues, for a player who reads another language than the TV's; clue by clue, only the
  // ones the TV shows so far)
  function clueList(b, cs, q) {
    const ex = q.extra || {};
    const ol = el('ol', 'pt-clues', b);
    G.ui.clues = cs.slice(0, 4).map((c, i) => { const li = el('li', '', ol); el('b', '', li, numFmt(i + 1)); el('span', '', li, L.clean(c, 260)); if (ex.clues && i >= (+q.cn || 1)) li.hidden = true; return li; });
  }
  function onClue(m) {
    const q = G.q;
    if (!q || m.n !== q.n || !Number.isInteger(m.c)) return;
    q.cn = m.c; if (Number.isFinite(+m.w)) q.w = +m.w;
    if (G.ui.clues) G.ui.clues.forEach((li, i) => { if (i < m.c && li.hidden) { li.hidden = false; li.classList.add('new'); } });
    if (G.ui.worth && G.ui.worth.isConnected) { G.ui.worth.textContent = worthLine(q); G.ui.worth.classList.remove('bump'); void G.ui.worth.offsetWidth; G.ui.worth.classList.add('bump'); }
  }
  // (Guess It Right!: the wheel, drawn like the TV's: four colors, a gold rim with lights, Boo in the middle, the pin
  // on top. A tap spins it here, and the TV shows where it lands)
  const pwStar = (cx, cy, r1, r2) => { const p = []; for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i * Math.PI / 8, r = i % 2 ? r2 : r1; p.push((cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2)); } return 'M' + p.join('L') + 'Z'; };
  function girWheel() {
    const CAT = [['#ff5a6e', '#c22a40'], ['#4c8dff', '#1d4fc4'], ['#34d399', '#109466'], ['#ffc93c', '#d08f12']];
    let defs = '', body = '';
    CAT.forEach(([col, deep], i) => {
      const a0 = (-135 + i * 90) * Math.PI / 180, a1 = (-45 + i * 90) * Math.PI / 180, r = 360;
      const x0 = 450 + r * Math.cos(a0), y0 = 450 + r * Math.sin(a0), x1 = 450 + r * Math.cos(a1), y1 = 450 + r * Math.sin(a1);
      const mid = (-90 + i * 90) * Math.PI / 180, fx = 450 + 180 * Math.cos(mid), fy = 450 + 180 * Math.sin(mid);
      const sx = 450 + 230.4 * Math.cos(mid), sy = 450 + 230.4 * Math.sin(mid);
      defs += '<radialGradient id="pws' + i + '" gradientUnits="userSpaceOnUse" cx="450" cy="450" r="360" fx="' + fx.toFixed(1) + '" fy="' + fy.toFixed(1) + '"><stop offset="0" stop-color="' + col + '"/><stop offset=".75" stop-color="' + col + '"/><stop offset="1" stop-color="' + deep + '"/></radialGradient>';
      body += '<path d="M450 450L' + x0.toFixed(2) + ' ' + y0.toFixed(2) + 'A360 360 0 0 1 ' + x1.toFixed(2) + ' ' + y1.toFixed(2) + 'Z" fill="url(#pws' + i + ')"/>' +
        '<path d="' + pwStar(sx, sy, 46, 26) + '" fill="#fff" fill-opacity=".2" stroke="#fff" stroke-opacity=".6" stroke-width="2"/><path d="' + pwStar(sx, sy, 26, 17) + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/><circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="7" fill="#fff" fill-opacity=".65"/>' +
        [-0.38, 0, 0.38].map(k => { const a = mid + k * 0.42, rr = k ? 312 : 324; return '<circle cx="' + (450 + rr * Math.cos(a)).toFixed(1) + '" cy="' + (450 + rr * Math.sin(a)).toFixed(1) + '" r="4.5" fill="#fff" fill-opacity=".45"/>'; }).join('');
    });
    let rays = '';
    for (const a of [-135, -45, 45, 135]) { const t = a * Math.PI / 180, x = 450 + 360 * Math.cos(t), y = 450 + 360 * Math.sin(t); rays += '<path d="M450 450L' + x.toFixed(2) + ' ' + y.toFixed(2) + '" stroke="#1a0e3e" stroke-width="8" stroke-opacity=".5"/><path d="M450 450L' + x.toFixed(2) + ' ' + y.toFixed(2) + '" stroke="url(#pwg)" stroke-width="4"/>'; }
    let bulbs = '';
    for (let i = 0; i < 32; i++) { const t = i * Math.PI / 16, x = (450 + 398 * Math.cos(t)).toFixed(2), y = (450 + 398 * Math.sin(t)).toFixed(2); bulbs += '<g class="bulb ' + (i % 2 ? 'b1' : 'b0') + '"><circle cx="' + x + '" cy="' + y + '" r="14" fill="url(#pwhalo)" class="h"/><circle cx="' + x + '" cy="' + y + '" r="7.5" fill="#5a3a08"/><circle cx="' + x + '" cy="' + y + '" r="6" fill="url(#pwbulb)" class="l"/></g>'; }
    const grads = '<linearGradient id="pwg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4c4"/><stop offset=".35" stop-color="#ffc93c"/><stop offset=".7" stop-color="#b9771a"/><stop offset="1" stop-color="#ffe08a"/></linearGradient>' +
      '<linearGradient id="pwg2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4c4"/><stop offset=".5" stop-color="#d89a2a"/><stop offset="1" stop-color="#8a5410"/></linearGradient>' +
      '<radialGradient id="pwshine" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset=".92" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>' +
      '<linearGradient id="pwgloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<radialGradient id="pwbulb"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#fff3c0"/><stop offset="1" stop-color="#ffb31f"/></radialGradient>' +
      '<radialGradient id="pwhalo"><stop offset="0" stop-color="#ffe08a" stop-opacity=".9"/><stop offset="1" stop-color="#ffc93c" stop-opacity="0"/></radialGradient>';
    const hub = '<svg class="pw-hub" viewBox="0 0 200 200" aria-hidden="true"><path d="' + pwStar(100, 100, 85, 66) + '" fill="url(#pwg)" stroke="#5a3a08" stroke-width="2"/><path d="' + pwStar(100, 100, 72, 58) + '" fill="none" stroke="#fff4c4" stroke-opacity=".7" stroke-width="1.5"/><circle cx="100" cy="100" r="58" fill="#1d1050" stroke="url(#pwg2)" stroke-width="6"/><circle cx="100" cy="100" r="48" fill="none" stroke="#ffc93c" stroke-opacity=".5" stroke-width="1" stroke-dasharray="2 4"/></svg>' +
      '<svg class="pw-boo" viewBox="0 0 60 60" aria-hidden="true"><path d="M14 22C14 3 46 3 46 22V46.8Q46 50 42.5 50Q39 50 39 46.8A3.25 2.8 0 0 0 32.5 46.8Q32.5 50 29.25 50Q26 50 26 46.8A2.75 2.8 0 0 0 20.5 46.8Q20.5 50 17.25 50Q14 50 14 46.8Z" fill="#fff"/><ellipse cx="23.6" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><ellipse cx="35.4" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><circle cx="23.9" cy="22.6" r="1.3" fill="#fff"/><circle cx="35.7" cy="22.6" r="1.3" fill="#fff"/></svg>';
    const pin = '<svg class="pw-pin" viewBox="0 0 110 140" aria-hidden="true"><path d="M55 136C40 100 14 80 14 50C14 22 32 6 55 6C78 6 96 22 96 50C96 80 70 100 55 136Z" fill="url(#pwg)" stroke="#5a3a08" stroke-width="2.5"/><path d="M55 116C44 92 26 76 26 52C26 30 39 18 55 18C71 18 84 30 84 52C84 76 66 92 55 116Z" fill="#c2306e"/><path d="' + pwStar(55, 50, 18, 9.5) + '" fill="url(#pwg)"/><circle cx="55" cy="50" r="5" fill="#c2306e"/></svg>';
    return '<div class="pw-glow"></div><div class="pw-turn"><svg viewBox="0 0 900 900" aria-hidden="true"><defs>' + grads + defs + '</defs>' + body + '<circle cx="450" cy="450" r="360" fill="url(#pwshine)"/>' + rays + '</svg></div>' +
      '<svg class="pw-rim" viewBox="0 0 900 900" aria-hidden="true"><circle cx="450" cy="450" r="420" fill="none" stroke="#0a0620" stroke-width="10" stroke-opacity=".6"/><circle cx="450" cy="450" r="398" fill="none" stroke="url(#pwg2)" stroke-width="44"/><circle cx="450" cy="450" r="398" fill="none" stroke="#2a1660" stroke-width="30"/><circle cx="450" cy="450" r="419" fill="none" stroke="url(#pwg)" stroke-width="3"/><circle cx="450" cy="450" r="377" fill="none" stroke="url(#pwg)" stroke-width="3"/><circle cx="450" cy="450" r="366" fill="none" stroke="url(#pwg2)" stroke-width="12"/><circle cx="450" cy="450" r="360" fill="none" stroke="#1a0e3e" stroke-width="2"/>' + bulbs + '<path d="M90 450A360 360 0 0 1 810 450A432 324 0 0 0 90 450Z" fill="url(#pwgloss)" opacity=".7"/></svg>' + hub + pin;
  }
  function spinQ(b, q) {
    const ex = q.extra || {};
    el('p', 'pt-note', b, L.clean(T(String(ex.sl || 'Spin the wheel!')), 60)).style.marginTop = '0';
    const x = el('button', 'pt-spin', b);
    x.type = 'button';
    const w = el('div', 'pt-wheel', x);
    w.innerHTML = girWheel();
    el('b', '', x, T('Spin!'));
    x.onclick = () => {
      if (!answer(1, '')) return;
      x.disabled = true; x.classList.add('go'); buzz('long');
      // (it turns a few times and slows down, like the TV's)
      const turn = w.querySelector('.pw-turn'), calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const deg = (calm ? 360 : 360 * 4) + Math.random() * 360;
      try { turn.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(' + deg + 'deg)' }], { duration: calm ? 900 : 3400, easing: 'cubic-bezier(.12,.72,.08,1)', fill: 'forwards' }); } catch (e) {}
      setTimeout(() => { x.classList.remove('go'); x.classList.add('done'); }, calm ? 900 : 3400);
    };
  }
  // Trivia's category wheel: the TV's wheel (the very same drawing, ../play/wheel.js), standing where the TV's stands
  // and turning with it, and the round's categories in its colors
  const TWG = { p: null };
  const twLoad = () => (window.BVWHEEL ? Promise.resolve(true) : TWG.p || (TWG.p = GO.script('../play/wheel.js?v=' + GO.VERSION).then(() => !!window.BVWHEEL, () => { TWG.p = null; return false; })));
  async function twScreen(q) {
    stopQ();
    const tw = q.extra.tw;
    const v = gameView();
    const w = el('div', 'pt-tws', v.body);
    el('h1', '', w, T('Category wheel'));
    const box = el('div', 'pt-tw', w);
    const st = el('p', 'pt-twst', w, T('Spinning for the next round...'));
    const leg = el('div', 'pt-twleg', w);
    if (!(await twLoad()) || G.q !== q || !box.isConnected) return;
    const W = window.BVWHEEL;
    // (in the TV's language, or in this phone's own when it picked one)
    const own = !!ownLang(G.lobby), en = (Array.isArray(tw.c) ? tw.c : []).slice(0, 8).map(String);
    const names = en.map((c, i) => L.clean(own || !Array.isArray(tw.t) || typeof tw.t[i] !== 'string' ? T(c) : tw.t[i], 40));
    const chips = names.map((nm, i) => { const x = el('div', 'c', leg); x.style.setProperty('--cc', W.COLORS[i]); el('i', '', x); el('span', '', x, nm).dir = 'auto'; return x; });
    const wh = W.make(box);
    G.stops.push(() => wh.stop());
    wh.at(+tw.s || 0);
    if (!tw.go) return;
    const pick = Math.max(0, Math.min(7, Math.round(+tw.p) || 0));
    buzz('tap');
    await wh.spin(matchMedia('(prefers-reduced-motion: reduce)').matches);
    if (G.q !== q || !box.isConnected) return;
    chips.forEach((c, i) => c.classList.add(en[i] === en[pick] ? 'win' : 'off'));
    st.textContent = names[pick] || '';
    st.classList.add('res'); st.style.setProperty('--cc', W.COLORS[pick]);
    buzz('ok');
  }
  function answer(v, shown) {
    const q = G.q;
    if (!q || G.answered || G.locked || !q.who.includes(G.id)) return false;
    G.answered = true;
    if (G.host && G.revealQ && G.revealQ.n === q.n) setTimeout(() => { if (G.q === q && !G.res && G.revealQ) hostBar('reveal', q.n, G.revealQ.label, '👀'); }, 400);
    const ms = Math.round(performance.now() - G.qAt);
    const m = { k: 'ans', n: q.n, v, ms };
    send(m);
    // (once more a moment later, in case a relay dropped it: the TV counts it once)
    setTimeout(() => { if (G.q === q) send(m); }, 1300);
    buzz('tap');
    if (G.ui.body && G.ui.body.isConnected) {
      let n = G.ui.body.querySelector('.pt-note.sent');
      if (!n) { n = el('p', 'pt-note sent', G.ui.body); }
      n.textContent = (shown ? T('You picked: {x}.', { x: shown }) + ' ' : '') + S().answered;
      for (const x of G.ui.body.querySelectorAll('input, textarea, .btn.go')) x.disabled = true;
    }
    return true;
  }
  function timerBar(parent, sec) {
    const t = el('div', 'pt-timer', parent);
    const i = el('i', '', t);
    try { i.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: sec * 1000, fill: 'forwards', easing: 'linear' }); } catch (e) {}
    after(sec * 1000, () => {
      if (G.answered) return;
      G.locked = true;
      buzz('bad');
      if (G.ui.body && G.ui.body.isConnected) {
        el('p', 'pt-note', G.ui.body, '⏰ ' + S().timeUp);
        for (const x of G.ui.body.querySelectorAll('button, input, textarea')) x.disabled = true;
      }
    });
  }
  // (the question in this phone's own language, when the TV sent it: { q, o: answers, p: prompt })
  function trOf(q) {
    const ex = (q && q.extra) || {};
    if (!ex.tr || typeof ex.tr !== 'object' || G.lang === tvLangOf(G.lobby)) return null;
    const t = ex.tr[G.lang];
    return t && typeof t === 'object' ? t : null;
  }
  function choiceQ(b, q) {
    const ex = q.extra || {};
    const mine = trOf(q);
    const src = mine && Array.isArray(mine.o) && Array.isArray(q.opts) && mine.o.length === q.opts.length ? mine.o : q.opts;
    const opts = (Array.isArray(src) ? src : []).slice(0, 6).map(o => L.clean(o, 140));
    const short = opts.every(o => [...o].length <= 4);
    const grid = el('div', 'pt-ans' + (ex.two || (opts.length <= 2 && !short) ? ' one' : ''), b);
    const own = ex.own && typeof ex.own === 'object' ? ex.own[G.id] : undefined;
    // (the same letters as on the TV, in the game's language: A B C D, أ ب ج د, क ख ग घ, ক খ গ ঘ)
    const LETS = I() ? I().letters(G.lang) : ['A', 'B', 'C', 'D', 'E', 'F'];
    G.ui.ans = opts.map((o, i) => {
      const a = el('button', 'pt-a' + (i === 2 || i === 3 ? ' dark' : '') + (short ? ' big' : ''), grid);
      a.type = 'button';
      a.style.setProperty('--c', ACOL[i]);
      el('span', 'l', a, LETS[i] || SHAPES[i]);
      el('span', '', a, o);
      if (own === i) { a.classList.add('gone'); el('small', '', a, S().mine); }
      a.onclick = () => { if (answer(i, ex.letters ? (LETS[i] || SHAPES[i]) : '')) { a.classList.add('mine'); for (const x of G.ui.ans) if (x !== a) x.classList.add('dim'); } };
      return a;
    });
    // Trivia's helpers: each works once per game
    if (ex.helpers && !G.out) {
      const hp = el('div', 'pt-helpers', b);
      G.ui.help = {};
      const HS = Array.isArray(ex.helpers) ? ex.helpers.filter(h => Array.isArray(h) && /^[a-z]{2,8}$/.test(h[0])).slice(0, 4) : [['fifty', '✂️'], ['hint', '💡'], ['auto', '🪄'], ['ask', '👥']];
      const lab = ex.hlab && typeof ex.hlab === 'object' ? ex.hlab : {};
      for (const [h, e] of HS) {
        const x = el('button', '', hp);
        G.ui.help[h] = x;
        x.type = 'button';
        el('span', '', x, L.clean(String(e || ''), 6));
        x.append(typeof lab[h] === 'string' ? L.clean(T(lab[h]), 30) : S()[h] || h);
        x.disabled = G.used.has(h);
        x.onclick = () => { if (G.answered || G.locked || G.used.has(h)) return; G.used.add(h); x.disabled = true; send({ k: 'help', n: q.n, h }); buzz('tap'); };
      }
      el('p', 'muted small center', b, S().helpers1).style.marginTop = '6px';
    }
  }
  function onHelped(m) {
    const q = G.q;
    if (!q || m.n !== q.n || !G.ui.ans) return;
    if (m.no) { G.used.delete(m.h); const x = G.ui.help && G.ui.help[m.h]; if (x && !G.answered && !G.locked) x.disabled = false; if (m.note) toast(L.clean(m.note, 140)); return; }
    if (m.h === 'fifty' && Array.isArray(m.hide)) { for (const i of m.hide) if (G.ui.ans[i]) G.ui.ans[i].classList.add('gone'); buzz('ok'); }
    else if (m.h === 'hint' && typeof m.text === 'string') { const h = el('div', 'pt-hint', G.ui.body, '💡 ' + L.clean(m.text, 200)); h.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); buzz('ok'); }
    else if (m.h === 'auto' && Number.isInteger(m.pick) && G.ui.ans[m.pick]) { G.ui.ans[m.pick].click(); }
    else if (m.h === 'boost') { const x = G.ui.help && G.ui.help.boost; if (x) x.classList.add('on'); if (typeof m.note === 'string' && m.note) toast(L.clean(m.note, 140), 'ok'); buzz('ok'); }
    else if (m.h === 'ask' && Array.isArray(m.tally)) {
      const total = m.tally.reduce((a, x) => a + (+x || 0), 0) || 1;
      m.tally.forEach((n, i) => { const a = G.ui.ans[i]; if (!a) return; let t = a.querySelector('.tally'); if (!t) t = el('span', 'tally', a); t.textContent = Math.round(100 * (+n || 0) / total) + '%'; });
      buzz('ok');
    }
  }
  function playersQ(b, q) {
    const grid = el('div', 'pt-players', b);
    const btns = [];
    for (const p of (Array.isArray(q.opts) ? q.opts : []).slice(0, 40)) {
      if (!p || !L.okId(p.id)) continue;
      const x = el('button', 'pt-pl', grid);
      x.type = 'button';
      const im = el('img', '', x); im.src = booUri(AVATARS.includes(p.av) ? p.av : 'boo:hi'); im.alt = '';
      el('b', '', x, p.id === G.id ? S().you : L.clean(p.name, 16));
      x.onclick = () => { if (answer(p.id, L.clean(p.name, 16))) { x.setAttribute('aria-pressed', 'true'); for (const y of btns) if (y !== x) y.style.opacity = '.4'; } };
      btns.push(x);
    }
  }
  function textQ(b, q) {
    const ex = q.extra || {};
    const max = Math.min(80, +ex.max || 40);
    const i = input({ placeholder: L.clean(ex.place, 60) || S().typeHere, max });
    i.autocapitalize = 'sentences';
    b.appendChild(i);
    const row = el('div', 'grid2', b); row.style.marginTop = '12px';
    const sug = Array.isArray(ex.suggest) ? ex.suggest.map(x => L.clean(x, max)).filter(Boolean) : [];
    if (sug.length) btn(S().giveFake, { kind: 'ghost', icon: 'sparkle' }, row, () => { i.value = sug[Math.floor(Math.random() * sug.length)]; i.focus(); buzz('tap'); });
    const go = btn(S().send, { kind: 'go', icon: 'send' }, row, () => { const t = L.clean(i.value, max); if (!t) { toast(S().typeHere, 'bad'); i.focus(); return; } answer(t, t); });
    if (!sug.length) go.style.gridColumn = '1 / -1';
    i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
    setTimeout(() => { try { i.focus(); } catch (e) {} }, 250);
  }
  function numberQ(b, q) {
    const ex = q.extra || {};
    if (ex.slider && isFinite(+ex.min) && isFinite(+ex.max) && +ex.max > +ex.min) return sliderQ(b, q, ex);
    const i = input({ placeholder: S().guess, max: 14, mode: 'decimal' });
    i.style.cssText = 'font:800 30px var(--round);text-align:center';
    b.appendChild(i);
    const go = btn(S().send, { kind: 'go', huge: true, full: true, icon: 'send' }, b, () => {
      const n = parseFloat(String(i.value).replace(/[\s,]/g, '').replace(/[^\d.-]/g, ''));
      if (!isFinite(n)) { toast(S().guess, 'bad'); i.focus(); return; }
      const v = Math.max(isFinite(+ex.min) ? +ex.min : -1e12, Math.min(isFinite(+ex.max) ? +ex.max : 1e12, n));
      answer(v, numFmt(v));
    });
    go.style.marginTop = '12px';
    i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
    setTimeout(() => { try { i.focus(); } catch (e) {} }, 250);
  }
  // a guess on a slider (big, easy to drag), with the number shown large
  function sliderQ(b, q, ex) {
    const min = +ex.min, max = +ex.max, unit = L.clean(ex.unit, 12);
    const show = el('div', 'pt-call', b, '');
    const r = el('input', 'pt-slider', b);
    r.type = 'range'; r.min = String(min); r.max = String(max); r.step = String(Math.max(1, Math.round((max - min) / 400)));
    r.value = String(Math.round((min + max) / 2));
    const paint = () => { show.textContent = numFmt(r.value) + (unit ? ' ' + unit : ''); };
    r.oninput = () => { paint(); if (+r.value % 10 === 0) buzz('tap'); };
    paint();
    const row = el('div', 'grid2', b); row.style.marginTop = '12px';
    btn('−', { kind: 'ghost' }, row, () => { r.value = String(Math.max(min, +r.value - +r.step)); paint(); });
    btn('+', { kind: 'ghost' }, row, () => { r.value = String(Math.min(max, +r.value + +r.step)); paint(); });
    btn(S().send, { kind: 'go', huge: true, full: true, icon: 'send' }, b, () => answer(+r.value, show.textContent)).style.marginTop = '12px';
  }
  function emojiMakeQ(b, q) {
    const ex = q.extra || {};
    const e1 = input({ placeholder: '🦁👑', max: 24 });
    e1.style.cssText = 'font-size:34px;text-align:center';
    GO.field(S().yourEmoji, e1, b);
    const a1 = input({ placeholder: L.clean(ex.place, 40) || S().theAnswer, max: 50 });
    GO.field(S().theAnswer, a1, b);
    btn(S().send, { kind: 'go', huge: true, full: true, icon: 'send' }, b, () => {
      const e = String(e1.value || '').trim().slice(0, 24), a = L.clean(a1.value, 50);
      if (!BVRX.picto().test(e)) { toast(S().yourEmoji + '?', 'bad'); e1.focus(); return; }
      if (!a) { toast(S().theAnswer + '?', 'bad'); a1.focus(); return; }
      answer({ e, a }, e);
    });
  }

  // drop a pin on the map (Where in the World?): the question (with the flag), the clock, the hints as the TV sends
  // them, and the world map (../play/map.js: pinch, drag, + and -). The map starts on the part of the world the host
  // picked and fills its box.
  async function pinQ(b, q) {
    const ex = q.extra || {};
    const mine = trOf(q);
    // (the clock: the bar, and the seconds beside it)
    const tm = b.querySelector('.pt-timer');
    if (tm && q.sec > 0) {
      const row = el('div', 'pt-trow'); tm.replaceWith(row); row.appendChild(tm);
      const num = el('b', '', row, String(q.sec));
      const t0 = Date.now();
      const iv = setInterval(() => { if (!num.isConnected) { clearInterval(iv); return; } const left = Math.max(0, q.sec - Math.floor((Date.now() - t0) / 1000)); num.textContent = String(left); num.classList.toggle('low', left <= 5); if (!left) clearInterval(iv); }, 250);
    }
    if (typeof ex.flag === 'string' && /^flags\/[a-z-]{2,6}\.png$/.test(ex.flag)) { const f = el('img', 'pt-flag', b); f.src = '../play/' + ex.flag; f.alt = ''; }
    const qt = L.clean((mine && mine.q) || ex.q || '', 160);
    if (qt) el('div', 'pt-wq', b, qt).dir = 'auto';
    el('h2', 'pt-drop', b, S().dropPin);
    G.ui.hints = el('div', 'pt-hints', b);
    G.ui.hintN = q.n;
    const box = el('div', 'pt-map', b);
    const wait = el('div', 'spin', box); wait.style.cssText = 'position:absolute;left:50%;top:50%;margin:-13px';
    try { if (!window.BVMAP) await GO.script('../play/map.js'); } catch (e) { box.textContent = T('The map didn\'t load. Check the internet.'); return; }
    if (G.q !== q || !box.isConnected) return;
    wait.remove();
    const M = window.BVMAP;
    const ok = a => Array.isArray(a) && a.length === 4 && a.every(n => Number.isFinite(+n));
    const area = ok(ex.area) ? ex.area.map(Number) : [0, 0, M.W, M.H];
    // (it can move a little past the host's area, never off the map)
    const w = area[2] - area[0], h = area[3] - area[1];
    const lim = [Math.max(0, area[0] - w * 0.35), Math.max(0, area[1] - h * 0.35), Math.min(M.W, area[2] + w * 0.35), Math.min(M.H, area[3] + h * 0.35)];
    let at = null, mk = null;
    const lock = btn(S().lockPin, { kind: 'go', huge: true, full: true }, null, () => {
      if (!at) return;
      const [lon, lat] = M.ll(at[0], at[1]);
      answer([Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000]);
    });
    const map = M.create(box, {
      touch: true, bounds: lim, maxS: 2.6, out: 1,
      onTap: (x, y) => {
        if (G.answered || G.locked) return;
        at = [x, y];
        if (mk) mk.move(x, y);
        else mk = map.add(M.pin({ color: G.color || '#ff5a6e', cls: 'pt-mypin' }), x, y);
        try { mk.node.animate([{ transform: 'translate(-50%,-100%) translateY(-18px) scale(.8)' }, { transform: 'translate(-50%,-100%)' }], { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' }); } catch (e) {}
        lock.disabled = false;
        buzz('tap');
      }
    });
    map.fit(area, { pad: 4 });
    // (big + and - for anyone who'd rather not pinch)
    const zm = el('div', 'zm', box);
    for (const [t, k] of [['+', 1.7], ['\u2212', 1 / 1.7]]) { const z = el('button', '', zm, t); z.type = 'button'; z.setAttribute('aria-label', T(t === '+' ? 'Zoom in' : 'Zoom out')); z.onclick = () => map.zoomBy(k, null, null, 260); }
    el('p', 'muted small center', b, S().zoom).style.margin = '8px 0 10px';
    b.appendChild(lock);
    // (Boo's pin on the button)
    const pi = document.createElement('span'); pi.className = 'pt-lockpin'; pi.innerHTML = '<svg viewBox="0 0 64 84"><path d="M32 83C32 83 5 53 5 31.5A27 27 0 1 1 59 31.5C59 53 32 83 32 83Z" fill="#ff5a6e" stroke="#fff" stroke-width="4"/><path d="M32 14c-8 0-12 6-12 13v20q2.6-3 5.3 0t5.3 0t5.3 0t5.3 0t2.8 0V27c0-7-4-13-12-13z" fill="#fff"/><circle cx="27.5" cy="29" r="2.4" fill="#24164a"/><circle cx="36.5" cy="29" r="2.4" fill="#24164a"/></svg>';
    lock.insertBefore(pi, lock.firstChild);
    lock.disabled = true;
  }
  // a hint from the TV, in this phone's language when it sent one
  function onHint(m) {
    const hb = G.ui && G.ui.hints;
    if (!hb || !hb.isConnected || !G.q || G.q.n !== m.n || !Number.isInteger(m.i) || hb.querySelector('[data-i="' + m.i + '"]')) return;
    const text = L.clean((m.tr && typeof m.tr === 'object' && typeof m.tr[G.lang] === 'string' ? m.tr[G.lang] : m.text) || '', 120);
    if (!text) return;
    const c = el('div', 'pt-hint', hb); c.dataset.i = String(m.i);
    if (typeof m.flag === 'string' && /^flags\/[a-z-]{2,6}\.png$/.test(m.flag)) { const im = el('img', '', c); im.src = '../play/' + m.flag; im.alt = ''; }
    else el('i', '', c, typeof m.icon === 'string' ? m.icon.slice(0, 4) : '💡');
    el('span', '', c, text).dir = 'auto';
    buzz('tap');
  }

  // the imposter's secret: only while a finger holds it down
  function peekBox(parent) {
    const s = G.secret;
    if (!s) return;
    const box = el('div', 'pt-peek', parent);
    const hidden = () => { box.className = 'pt-peek'; box.textContent = ''; el('div', '', box, '🙈'); el('b', '', box, S().peek); el('small', '', box, S().holdTip); };
    const shown = () => {
      box.className = 'pt-peek on'; box.textContent = '';
      if (s.imp) { el('div', 'pic', box, s.kids ? '❓' : '🕵️'); el('b', '', box, S().imposter); el('small', '', box, s.cat ? T('Category: {x}', { x: L.clean(s.cat, 40) }) : S().noWord); }
      else { if (s.pic) { el('div', 'pic', box, L.clean(s.word, 12)); } else { el('small', '', box, S().word); el('b', '', box, L.clean(s.word, 40)); } if (s.cat) el('small', '', box, T('Category: {x}', { x: L.clean(s.cat, 40) })); }
      buzz('tap');
    };
    hidden();
    box.addEventListener('pointerdown', e => { e.preventDefault(); try { box.setPointerCapture(e.pointerId); } catch (er) {} shown(); });
    for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) box.addEventListener(ev, hidden);
    box.addEventListener('contextmenu', e => e.preventDefault());
    box.tabIndex = 0;
    box.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); shown(); } });
    box.addEventListener('keyup', hidden);
    box.addEventListener('blur', hidden);
  }

  // ---------- Who's the Imposter?: its screens, as the game's design has them (../play/imp-ph.js) ----------
  // The TV says which part of the game it is ({k:'imp', t: 'peek' | 'clue' | 'talk' | 'reveal' | 'unmask' | 'guessing' |
  // 'res' | 'final' | 'rules'}) and which of the designs to use, the same one on every phone. A question for this phone
  // (the vote, a typed clue, the last-chance guess) shows until the TV moves on to the next part.
  const IMPG = { p: null };
  const isImpGame = () => (G.lobby || {}).game === 'imposter';
  function impLoad() {
    if (window.BVIMPP) { impCss(); return Promise.resolve(true); }
    if (!IMPG.p) IMPG.p = GO.script('../play/imp-ph.js?v=' + GO.VERSION).then(() => { impCss(); return !!window.BVIMPP; }, () => { IMPG.p = null; return false; });
    return IMPG.p;
  }
  function impCss() {
    if (!window.BVIMPP || document.getElementById('imp-css')) return;
    const st = el('style', '', document.head); st.id = 'imp-css'; st.textContent = BVIMPP.css;
  }
  const iesc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }[c]));
  const iup = x => { try { return String(x).toLocaleUpperCase(G.lang); } catch (e) { return String(x).toUpperCase(); } };
  // (a right-to-left language: the design mirrored, so it reads from the right like the lobby does. Left and right swap
  // in every style, rows and columns run the other way; pieces centered with "left: 50%" stay where they are.)
  const SWAP_LR = { left: 'right', right: 'left' };
  function mirrorStyle(st) {
    const centered = /(^|;)\s*(left|right)\s*:\s*50%/.test(st);
    return st.split(';').map(d => {
      const i = d.indexOf(':');
      if (i < 0) return d;
      const p = d.slice(0, i).trim().toLowerCase(), v = d.slice(i + 1).trim();
      if (centered && /^(left|right|margin-left|margin-right)$/.test(p)) return d;
      let np = p, nv = v;
      if (p === 'left' || p === 'right') np = SWAP_LR[p];
      else if (/^(margin|padding|border)-(left|right)(-[a-z]+)?$/.test(p)) np = p.replace(/-(left|right)/, (m, s) => '-' + SWAP_LR[s]);
      else if (/^border-(top|bottom)-(left|right)-radius$/.test(p)) np = p.replace(/-(left|right)-radius$/, (m, s) => '-' + SWAP_LR[s] + '-radius');
      else if (p === 'text-align' || p === 'float') nv = v.replace(/\b(left|right)\b/, s => SWAP_LR[s]);
      else if (/^(margin|padding|inset|border-width|border-style|border-color)$/.test(p)) { const t = v.split(/\s+/); if (t.length === 4) nv = [t[0], t[3], t[2], t[1]].join(' '); }
      else if (p === 'border-radius' && !v.includes('/')) { const t = v.split(/\s+/); nv = t.length === 2 ? [t[1], t[0]].join(' ') : t.length === 3 ? [t[1], t[0], t[1], t[2]].join(' ') : t.length === 4 ? [t[1], t[0], t[3], t[2]].join(' ') : v; }
      return np === p && nv === v ? d : np + ':' + nv;
    }).join(';');
  }
  const mirrorHtml = h => String(h).replace(/style="([^"]*)"/g, (m, st) => 'style="' + mirrorStyle(st) + '"');
  const ihtml = h => (document.documentElement.dir === 'rtl' ? mirrorHtml(h) : h);
  const iq = (root, k) => [...root.querySelectorAll('[data-k="' + k + '"]')];
  const iset = (root, k, t) => { for (const e of iq(root, k)) e.textContent = t; };
  const iifs = (root, vals) => { for (const e of root.querySelectorAll('bv-if')) if (e.dataset.if in vals) e.hidden = !vals[e.dataset.if]; };
  // a line with parts in the design's colors (the quotes around a word and a name's "!" go with them)
  function irich(elx, text, parts, styles) {
    if (!elx) return;
    const st = styles || [...elx.querySelectorAll('span,b')].map(x => x.getAttribute('style') || '');
    const segs = []; const re = /\{(\w+)\}/g; let m, last = 0;
    while ((m = re.exec(text))) { segs.push([text.slice(last, m.index), m[1]]); last = m.index + m[0].length; }
    segs.push([text.slice(last), null]);
    let html = '', n = 0;
    const QL = '"“„«「『', QR = '"”»」』', AFTER = '!！:：';
    for (let i = 0; i < segs.length; i++) {
      let [before, key] = segs[i];
      if (!key) { html += iesc(before); break; }
      let open = '', close = '', tail = '';
      if (before && QL.includes(before.slice(-1))) { open = before.slice(-1); before = before.slice(0, -1); }
      let next = segs[i + 1] ? segs[i + 1][0] : '';
      if (open && next && QR.includes(next[0])) { close = next[0]; next = next.slice(1); }
      if (next && AFTER.includes(next[0])) { tail = next[0]; next = next.slice(1); }
      if (segs[i + 1]) segs[i + 1][0] = next;
      html += iesc(before) + '<span style="' + iesc(st[Math.min(n, st.length - 1)] || '') + '">' + iesc(open + (parts[key] == null ? '' : parts[key]) + close + tail) + '</span>';
      n++;
    }
    elx.innerHTML = html;
  }
  // a player's picture where the design has a ghost (their Boo; only the TV has the photos)
  function iface(svg, av, photo) {
    if (!svg) return;
    const w = +svg.getAttribute('width') || 40, h = +svg.getAttribute('height') || 52;
    const im = document.createElement('img'); im.alt = '';
    im.src = photo || booUri(AVATARS.includes(av) ? av : 'boo:hi');
    im.className = 'imp-face' + (photo ? ' ph' : '');
    const sz = photo ? Math.min(w, h) : Math.round(Math.max(w, h) * 1.15);
    im.style.width = sz + 'px'; im.style.height = sz + 'px';
    svg.replaceWith(im);
  }
  function irows(root, name, items, fn) {
    for (const t of [...root.querySelectorAll('[data-row="' + name + '"]')]) {
      items.forEach((x, i) => { const c = t.cloneNode(true); c.removeAttribute('data-row'); t.parentNode.insertBefore(c, t); fn(c, x, i); });
      t.remove();
    }
  }
  // a screen of the game: the app's top (restyled), then the design's parts
  function impView(sec) {
    stopQ();
    const v = gameView();
    if (sec > 0) timerBar(v.body, sec);
    const w = el('div', 'imp-ph', v.body);
    v.body.style.display = 'flex'; v.body.style.flexDirection = 'column'; v.body.style.flex = '1';
    return { v, w };
  }
  const ihead = (w, title, sub) => { const h = el('div', 'imp-h', w); h.textContent = title; if (sub) el('div', 'imp-s', w, sub); return h; };
  const iclues = w => { const c = Array.isArray(G.impClues) ? G.impClues : []; if (!c.length) return; const b = el('div', 'imp-clues', w); for (const [n, x] of c.slice(-12)) { const s2 = el('span', '', b); el('b', '', s2, L.clean(n, 16) + ': '); s2.append(L.clean(x, 24)); } };

  // the secret, in the design of the game (the same one on every phone): hold the box down to see it
  function impPeek(parent, d, mode, titleFn) {
    const s = G.secret;
    const tmp = el('div'); tmp.innerHTML = ihtml(BVIMPP.peek[(+d || 0) % BVIMPP.peek.length]);
    const title = iq(tmp, 'title')[0];
    if (titleFn) titleFn(title); else irich(title, T('Who is the {x}', { x: '{x}' }), { x: T('imposter?') });
    iset(tmp, 'hp', T('Hold to peek'));
    iset(tmp, 'ht', s ? S().holdTip : T('You join in at the next game.'));
    iset(tmp, 'sr', iup(T('Secret role')));
    iset(tmp, 'yi', S().imposter);
    iset(tmp, 'ysw', iup(T('Your secret word')));
    iset(tmp, 'fw', mode === 'undercover' ? T('Find who has a different word.') : mode === 'trust' ? T('Find the imposter, if there is one.') : T('Find who doesn\'t know it.'));
    if (s) {
      iset(tmp, 'w', L.clean(s.word, 40));
      const wEl = iq(tmp, 'w')[0];
      if (wEl && s.pic) { wEl.style.fontSize = '84px'; wEl.style.lineHeight = '1'; }
      else if (wEl && [...String(s.word || '')].length > 12) wEl.style.fontSize = ([...String(s.word)].length > 18 ? 34 : 44) + 'px';
      for (const c of iq(tmp, 'cat')) {
        const bst = (c.querySelector('b') || {}).getAttribute ? c.querySelector('b').getAttribute('style') : 'color:#fff';
        if (s.cat) { const t = T('Category: {x}', { x: '\u0000' }).split('\u0000'); c.innerHTML = iesc(t[0]) + '<b style="' + iesc(bst) + '">' + iesc(L.clean(s.cat, 40)) + '</b>' + iesc(t[1] || ''); }
        else c.textContent = s.imp ? T('No category: listen closely!') : '';
        if (!s.cat && !s.imp) c.hidden = true;
      }
      if (s.imp && Array.isArray(s.mates) && s.mates.length) {
        const yi = iq(tmp, 'yi')[0];
        if (yi) { const mt = el('div', 'imp-mates', null, '🤝 ' + T('Your partner: {x}', { x: s.mates.map(x => L.clean(x, 16)).join(' & ') })); yi.after(mt); }
      }
    }
    iifs(tmp, { hidden: true, imp: false, word: false });
    const box = iq(tmp, 'box')[0];
    const parts = [...tmp.childNodes];
    for (const x of parts) parent.appendChild(x);
    if (!box || !s) return;
    const show = on => { iifs(box, { hidden: !on, imp: on && !!s.imp, word: on && !s.imp }); };
    // (a finger still down from the screen before, when the next turn redrew it, keeps the word showing until it lets go)
    const up = () => { G.impHold = false; show(false); };
    G.impRelease = up;
    if (!G.impHoldW) {
      G.impHoldW = true;
      const rel = () => { if (G.impHold && G.impRelease) G.impRelease(); };
      for (const ev of ['pointerup', 'pointercancel', 'blur']) addEventListener(ev, rel);
      document.addEventListener('visibilitychange', () => { if (document.hidden) rel(); });
    }
    if (G.impHold) show(true);
    const down = e => {
      e.preventDefault();
      try { box.setPointerCapture(e.pointerId); } catch (er) {}
      G.impHold = true; show(true); buzz('tap');
      if (G.impPeeked !== G.secret) { G.impPeeked = G.secret; send({ k: 'peeked' }); }
    };
    box.addEventListener('pointerdown', down);
    for (const ev of ['pointerup', 'pointercancel']) box.addEventListener(ev, up);
    box.addEventListener('lostpointercapture', () => { if (box.isConnected) up(); });
    box.addEventListener('contextmenu', e => e.preventDefault());
    box.tabIndex = 0;
    box.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); show(true); if (G.impPeeked !== G.secret) { G.impPeeked = G.secret; send({ k: 'peeked' }); } } });
    box.addEventListener('keyup', () => show(false));
    box.addEventListener('blur', () => show(false));
  }

  function onImp(m) {
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'nobtn') { hideNext(); return; }
    if (m.t === 'clues') { G.impClues = Array.isArray(m.list) ? m.list.slice(-24) : []; if (G.imp && ['clue', 'talk'].includes(G.imp.t) && !G.impQ) impDraw(); return; }
    if (m.t === 'peek') { G.impD = +m.d || 0; G.impMode = (G.lobby && G.lobby.settings && G.lobby.settings.mode) || 'classic'; G.impClues = []; G.impRes = null; G.impFinal = null; }
    if (m.t === 'talk' && Array.isArray(m.list)) G.impClues = m.list;
    if (m.t === 'res') { G.impRes = m; const me = (m.list || []).find(x => x && x.id === G.id); if (me && typeof me.t === 'number') { G.score = me.t; updMe(); } }
    if (m.t === 'final') G.impFinal = m;
    G.imp = m; G.impQ = null;
    if (G.phase !== 'end') G.phase = 'play';
    impLoad().then(ok => { if (ok && G.imp === m) impDraw(); });
  }
  function impDraw() {
    if (!window.BVIMPP) { impLoad().then(ok => { if (ok) impDraw(); }); return; }
    const q = G.impQ;
    if (q && Array.isArray(q.who) && q.who.includes(G.id)) {
      const ex = (q.extra && q.extra.imp) || {};
      if (q.kind === 'players') return impVote(q, ex);
      if (q.kind === 'choice' && ex.guess) return impGuess(q, ex);
      if (q.kind === 'text') return impTyped(q);
    }
    const m = G.imp || {};
    switch (m.t) {
      case 'rules': return impRules(m);
      case 'peek': return impPeekScreen(m);
      case 'clue': return impClue(m);
      case 'talk': return impTalk(m);
      case 'reveal': case 'unmask': return impReveal(m);
      case 'guessing': return impGuessing(m);
      case 'res': return impWin(G.impRes, false);
      case 'final': return impWin(G.impFinal, true);
      default: if (q && q.kind === 'wait' && q.prompt) return showWait(L.clean(q.prompt, 160)); return showWait(S().look);
    }
  }
  function impRules(m) {
    const { w } = impView(+m.sec || 0);
    ihead(w, T('How to play'), '');
    const ls = el('div', 'imp-rules', w);
    for (const r of Array.isArray((G.lobby || {}).howto) ? G.lobby.howto : []) { const d = el('div', '', ls); el('i', '', d, L.clean(r[0], 8)); d.append(T(L.clean(r[1], 300))); }
  }
  function impPeekScreen(m) {
    const { w } = impView(0);
    impPeek(w, m.d, G.impMode);
    el('div', 'imp-s', w, T('Game {n} / {total}', { n: numFmt(+m.g || 1), total: numFmt(+m.of || 1) }));
  }
  function impClue(m) {
    const mine = m.id === G.id;
    const { w } = impView(+m.sec || 0);
    impPeek(w, G.impD, G.impMode, t => {
      if (mine) { t.textContent = S().yourTurn; buzz('long'); }
      else irich(t, T('{name}\'s turn', { name: '{name}' }), { name: L.clean(m.name, 20) });
    });
    el('div', 'imp-s', w, mine ? (m.typed ? T('Type one word about it.') : T('Say one word about it, out loud.')) : T('Listen closely, and look out for the imposter.'));
    iclues(w);
    if (mine && !m.typed) { const b = el('button', 'imp-btn gold', w, '✓ ' + T('Done')); b.type = 'button'; b.onclick = () => { send({ k: 'done' }); b.disabled = true; buzz('ok'); }; }
    else if (G.host && !m.typed) { const b = el('button', 'imp-btn ghost', w, '⏭️ ' + T('Next player')); b.type = 'button'; b.style.marginTop = 'auto'; b.onclick = () => { send({ k: 'done' }); b.disabled = true; buzz('tap'); }; }
  }
  function impTyped(q) {
    const { v, w } = impView(+q.sec || 0);
    impPeek(w, G.impD, G.impMode, t => { t.textContent = S().yourTurn; });
    el('div', 'imp-s', w, T('Type one word about it.'));
    G.ui.body = v.body;
    const b2 = el('div', '', w);
    textQ(b2, q);
  }
  function impTalk(m) {
    const { w } = impView(+m.sec || 0);
    impPeek(w, G.impD, G.impMode, t => { t.textContent = T('Talk it over!'); });
    el('div', 'imp-s', w, T('Who doesn\'t know the word? The vote comes next.'));
    iclues(w);
  }
  function impReveal(m) {
    const { w } = impView(0);
    const h = ihead(w, T('Look at the TV!'), '');
    void h;
    el('div', 'imp-tv', w, '📺');
    const line = el('div', 'imp-big', w);
    if (m.t === 'unmask') {
      if (m.none) irich(line, T('There was no imposter! The word was "{word}".', { word: '{word}' }), { word: L.clean(m.word, 40) }, ['color:#ffc93c']);
      else irich(line, T((m.names || []).length > 1 ? 'The imposters were {name}! The word was "{word}".' : 'The imposter was {name}! The word was "{word}".', { name: '{name}', word: '{word}' }), { name: (m.names || []).map(x => L.clean(x, 16)).join(' & '), word: L.clean(m.word, 40) }, ['color:#ff4d6a', 'color:#ffc93c']);
      buzz('long');
    } else line.textContent = T('The imposter is about to be unmasked...');
  }
  function impGuessing(m) {
    const { w } = impView(0);
    const h = el('div', 'imp-h', w);
    irich(h, T('{name} is guessing the word...', { name: '{name}' }), { name: (m.names || []).map(x => L.clean(x, 16)).join(' & ') }, ['color:#ff4d6a']);
    el('div', 'imp-s', w, T('If they get it right, they steal the win!'));
    el('div', 'imp-tv', w, '🎯');
  }

  // the vote, in one of the game's three designs (big cards, a list, big circles): pick, then lock it in
  function impVote(q, ex) {
    const { v, w } = impView(+q.sec || 0);
    G.ui.body = v.body;
    const tmp = el('div'); tmp.innerHTML = ihtml(BVIMPP.vote[(+ex.d || 0) % BVIMPP.vote.length]);
    const pick = Math.max(1, Math.min(5, +ex.pick || 1));
    const title = iq(tmp, 'title')[0];
    if (pick > 1) { const st = [...title.querySelectorAll('span')].map(x => x.getAttribute('style') || ''); irich(title, T('Pick {n} {x}', { n: numFmt(pick), x: '{x}' }), { x: T('imposters') }, st); }
    else irich(title, T('Who is the {x}', { x: '{x}' }), { x: T('imposter?') });
    iset(tmp, 'sub', pick > 1 ? T('Tap the {n} players you think it is.', { n: numFmt(pick) }) : T('Tap who you think it is.'));
    const opts = (Array.isArray(q.opts) ? q.opts : []).filter(p => p && L.okId(p.id)).slice(0, 40).map(p => ({ id: p.id, name: p.id === G.id ? S().you : L.clean(p.name, 16), av: p.av }));
    if (ex.none) opts.push({ id: 'none', name: T('No imposter'), av: 'boo:love' });
    const picked = [];
    let locked = false;
    const btnEl = iq(tmp, 'btn')[0];
    const ON = { bg: 'rgba(255,77,106,.16)', bd: '#ff4d6a', sh: '0 0 22px rgba(255,77,106,.5)', dot: '#ff4d6a', sc: '1.12' };
    const OFF = { bg: 'rgba(255,255,255,.05)', bd: 'rgba(255,255,255,.14)', sh: 'none', dot: 'transparent', sc: '1' };
    const rowsEl = [];
    const paint = () => {
      for (const [r, o] of rowsEl) { const on = picked.includes(o.id); for (const [k2, val] of Object.entries(on ? ON : OFF)) r.style.setProperty('--' + k2, val); iifs(r, { sel: on }); r.setAttribute('aria-pressed', String(on)); }
      const has = picked.length === pick || picked[0] === 'none';
      btnEl.style.setProperty('--btnBg', locked ? '#34d399' : '#ff4d6a');
      btnEl.style.setProperty('--btnFg', locked ? '#06281b' : '#fff');
      btnEl.style.setProperty('--btnOp', has || locked ? '1' : '.4');
      btnEl.style.setProperty('--btnSh', has ? (locked ? '0 0 24px rgba(52,211,153,.5)' : '0 0 24px rgba(255,77,106,.5)') : 'none');
      btnEl.textContent = locked ? '✓ ' + T('Vote locked') : T('Lock in vote');
    };
    irows(tmp, 'opt', opts, (r, o) => {
      iset(r, 'n', o.name);
      for (const a of iq(r, 'av')) iface(a, o.av, '');
      r.setAttribute('role', 'button'); r.tabIndex = 0;
      if (o.id === G.id) { r.classList.add('opt-off'); r.setAttribute('aria-disabled', 'true'); }
      const tap = () => {
        if (locked || G.locked || o.id === G.id) return;
        const i = picked.indexOf(o.id);
        if (i >= 0) picked.splice(i, 1);
        else if (o.id === 'none') { picked.length = 0; picked.push('none'); }
        else { if (picked[0] === 'none') picked.length = 0; if (picked.length >= pick) picked.shift(); picked.push(o.id); }
        buzz('tap'); paint();
      };
      r.onclick = tap;
      r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });
      rowsEl.push([r, o]);
    });
    btnEl.setAttribute('role', 'button'); btnEl.tabIndex = 0;
    btnEl.onclick = () => {
      if (locked || G.locked) return;
      if (!(picked.length === pick || picked[0] === 'none')) { buzz('bad'); return; }
      const val = picked[0] === 'none' ? 'none' : pick === 1 ? picked[0] : picked.slice();
      const names = picked.map(id => (opts.find(o => o.id === id) || {}).name).join(', ');
      if (answer(val, names)) { locked = true; paint(); buzz('ok'); }
    };
    paint();
    for (const x of [...tmp.childNodes]) w.appendChild(x);
    if (G.answered) { locked = true; paint(); }
  }

  // the last chance: the caught imposter picks the secret word from six
  function impGuess(q, ex) {
    const { v, w } = impView(+q.sec || 0);
    G.ui.body = v.body;
    const tmp = el('div'); tmp.innerHTML = ihtml(BVIMPP.guess[0]);
    for (const a of iq(tmp, 'av')) iface(a, G.av, G.photo);
    irich(iq(tmp, 'title')[0], T('Guess the {x}', { x: '{x}' }), { x: T('secret word!') });
    const cat = (ex.catTr && ex.catTr[G.lang]) || ex.cat || '';
    const ce = iq(tmp, 'cat')[0];
    if (ce) { const bst = ce.querySelector('b') ? ce.querySelector('b').getAttribute('style') : 'color:#fff'; const t = T('Category: {x}', { x: '\u0000' }).split('\u0000'); ce.innerHTML = cat ? iesc(t[0]) + '<b style="' + iesc(bst) + '">' + iesc(L.clean(cat, 40)) + '</b>' + iesc(t[1] || '') : ''; if (!cat) ce.hidden = true; }
    const mine = trOf(q);
    const src = mine && Array.isArray(mine.o) && Array.isArray(q.opts) && mine.o.length === q.opts.length ? mine.o : q.opts;
    const words = (Array.isArray(src) ? src : []).slice(0, 6).map(x => L.clean(x, 40));
    const SEL = ['linear-gradient(160deg,#ff5a6e,#c8213f)', 'linear-gradient(160deg,#4c8dff,#2253c9)', 'linear-gradient(160deg,#ffc93c,#c98a12)', 'linear-gradient(160deg,#34d399,#17a673)', 'linear-gradient(160deg,#a77bff,#7a4fe0)', 'linear-gradient(160deg,#ff7ac6,#d84a9c)'];
    const tiles = [...tmp.querySelectorAll('[data-row="o"]')];
    let pickI = -1, locked = false;
    const btnEl = iq(tmp, 'btn')[0];
    const paint = () => {
      tiles.forEach((t, i) => {
        const on = pickI === i;
        t.style.setProperty('--bg', on ? SEL[i] : 'linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.02))');
        t.style.setProperty('--sh', on ? '0 0 0 3px #fff,0 0 30px rgba(255,255,255,.35)' : 'none');
        t.style.setProperty('--op', pickI >= 0 && !on ? '.45' : '1');
        t.style.setProperty('--sc', on ? '1.03' : '1');
        iifs(t, { sel: on });
      });
      const has = pickI >= 0;
      btnEl.style.setProperty('--btnBg', locked ? '#34d399' : '#ffc93c');
      btnEl.style.setProperty('--btnFg', '#1a1033');
      btnEl.style.setProperty('--btnOp', has || locked ? '1' : '.4');
      btnEl.style.setProperty('--btnSh', has ? (locked ? '0 0 24px rgba(52,211,153,.5)' : '0 0 24px rgba(255,201,60,.5)') : 'none');
      btnEl.textContent = locked ? '✓ ' + T('Answer locked') : T('Lock in answer');
    };
    tiles.forEach((t, i) => {
      t.removeAttribute('data-row');
      if (i >= words.length) { t.hidden = true; return; }
      iset(t, 'w', words[i]);
      t.setAttribute('role', 'button'); t.tabIndex = 0;
      const tap = () => { if (locked || G.locked) return; pickI = pickI === i ? -1 : i; buzz('tap'); paint(); };
      t.onclick = tap;
      t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } });
    });
    btnEl.setAttribute('role', 'button'); btnEl.tabIndex = 0;
    btnEl.onclick = () => { if (locked || G.locked || pickI < 0) { if (pickI < 0) buzz('bad'); return; } if (answer(pickI, words[pickI])) { locked = true; paint(); } };
    paint();
    for (const x of [...tmp.childNodes]) w.appendChild(x);
  }

  // the winners, in one of the game's four designs (and, after the last game, the whole night), with sharing
  function impWin(r, final, endCtl) {
    if (!r) return showWait(S().look);
    const { v, w } = impView(0);
    const box = el('div', 'imp-win', w);
    box.innerHTML = ihtml(BVIMPP.win[(+r.d || 0) % BVIMPP.win.length]);
    const list = (Array.isArray(r.list) ? r.list : []).filter(x => x && L.okId(x.id));
    const winners = list.filter(x => x.w);
    const caught = !final && (r.none || r.caught);
    box.style.setProperty('--banBg', caught || final ? 'rgba(255,77,106,.14)' : 'rgba(255,201,60,.12)');
    box.style.setProperty('--banBd', caught || final ? '#ff4d6a' : '#ffc93c');
    iset(box, 'tw', iup(T('The winners')));
    const ban = iq(box, 'ban')[0];
    if (ban) {
      const st = [...ban.querySelectorAll('span')].map(x => x.getAttribute('style') || '');
      if (final) ban.textContent = winners.length ? winners.map(x => L.clean(x.n, 16)).join(' · ') + ' · ' + T('After {n} games', { n: numFmt(+r.of || 1) }) : T('After {n} games', { n: numFmt(+r.of || 1) });
      else if (r.none) ban.textContent = T('No imposter this time!');
      else irich(ban, T(caught ? 'Imposter caught! {name} was the imposter' : 'Imposter escaped! {name} was the imposter', { name: '{name}' }), { name: (r.imps || []).map(x => L.clean(x, 16)).join(' & ') }, st);
    }
    irows(box, 'wav', winners, (row, x) => { iset(row, 'n', x.id === G.id ? S().you : L.clean(x.n, 14)); for (const a of iq(row, 'av')) iface(a, x.av, ''); });
    iset(box, 'sbt', T('Scoreboard')); iset(box, 'sbs', iup(final ? T('Points') : T('Who voted right')));
    const pt = n => numFmt(n);
    const ptsT = n => (n === 1 ? T('{n} pt', { n: numFmt(n) }) : T('{n} pts', { n: numFmt(n) }));
    // (which row each player gets: winners, the others, the imposters)
    // (a design that shows the winners as crowned faces doesn't list them again; Winners vs Fooled keeps the imposter in
    // the middle, and its first list is everyone who voted right)
    const groups = { rw: [], rf: [], ri: [] };
    const has = { rw: !!box.querySelector('[data-row="rw"]'), ri: !!box.querySelector('[data-row="ri"]'), wav: !!box.querySelector('[data-k="wavs"]'), mid: !!iq(box, 'imp')[0] };
    const kindOf = x => {
      if (final) return x.w ? (has.rw ? 'rw' : has.wav ? '' : 'rf') : 'rf';
      if (x.i) return has.ri ? 'ri' : has.mid ? '' : 'rf';
      if (has.mid) return x.r > 0 ? 'rw' : 'rf';
      if (x.w) return has.rw ? 'rw' : has.wav ? '' : 'rf';
      return 'rf';
    };
    for (const x of list) { const kd = kindOf(x); if (kd && groups[kd]) groups[kd].push(x); }
    let place = 0;
    const proto = k => { const e2 = box.querySelector('[data-row="' + k + '"] [data-k="b"]'); return e2 ? e2.cloneNode(true) : null; };
    const bRight = proto('rw'), bFooled = proto('rf');
    for (const kd of ['rw', 'rf', 'ri']) {
      irows(box, kd, groups[kd], (row, x) => {
        place++;
        iset(row, 'pl', x.w ? '♛' : pt(place));
        const nEl = iq(row, 'n')[0];
        if (nEl) { nEl.textContent = L.clean(x.n, 16); if (x.id === G.id) { const y = el('span', '', nEl, ' (' + S().you + ')'); y.style.cssText = 'font-size:11px;color:#c8bde6'; } }
        for (const a of iq(row, 'av')) iface(a, x.av, '');
        const pEl = iq(row, 'p')[0];
        if (pEl) pEl.textContent = /pt/.test(pEl.textContent) ? ptsT(final ? +x.p || 0 : +x.p || 0) : pt(+x.p || 0);
        const b = iq(row, 'b')[0];
        if (final) { if (b) { if (+x.g > 0) b.textContent = '🏆 ' + numFmt(+x.g); else b.style.visibility = 'hidden'; } }
        else if (x.i) {
          const lab = x.s === 'stole' ? T('Stole it') : x.s === 'escaped' ? T('Escaped') : T('Caught');
          row.style.setProperty('--impBg', x.s === 'caught' || x.s === 'left' ? '#ff4d6a' : '#ffc93c');
          row.style.setProperty('--impFg', x.s === 'caught' || x.s === 'left' ? '#fff' : '#1a1033');
          if (b) { const svg = b.querySelector('svg'); b.textContent = iup(lab); if (svg) b.prepend(svg); }
          if (x.w) iset(row, 'pl', '♛');
        } else if (b) {
          const want = x.r > 0 ? bRight : bFooled;
          if (want && want !== b) { const c = want.cloneNode(true); b.replaceWith(c); c.textContent = x.r > 0 ? '✓ ' + iup(T('Right')) : '✗ ' + iup(T('Fooled')); }
          else b.textContent = x.r > 0 ? '✓ ' + iup(T('Right')) : '✗ ' + iup(T('Fooled'));
        }
        if (x.id === G.id) row.style.boxShadow = '0 0 0 2px #fff inset';
      });
    }
    const wh = iq(box, 'wh')[0]; if (wh) wh.textContent = '♛ ' + (final ? T('Winners') : (r.none || caught || !winners.some(x => x.i)) ? T('Winners · voted right') : T('Voted right'));
    const fh = iq(box, 'fh')[0]; if (fh) fh.textContent = '✗ ' + T('Fooled');
    const impBox = iq(box, 'imp')[0];
    if (impBox) {
      const ip = list.find(x => x.i);
      if (!ip || final) impBox.style.display = 'none';
      else { iset(impBox, 'n', list.filter(x => x.i).map(x => L.clean(x.n, 16)).join(' & ')); for (const a of iq(impBox, 'av')) iface(a, ip.av, ''); iset(impBox, 'b', iup(ip.s === 'stole' ? T('Stole it') : ip.s === 'escaped' ? T('Escaped') : T('Caught'))); }
    }
    const each = iq(box, 'each')[0];
    if (each) { const pv = winners.length ? +winners[0].p || 0 : 0; each.textContent = '♛ ' + iup(winners.length > 1 && winners.every(x => +x.p === pv) ? (pv === 1 ? T('1 point each') : T('{n} points each', { n: numFmt(pv) })) : pv === 1 ? T('1 point') : T('{n} points', { n: numFmt(pv) })) + ' ♛'; }
    iset(box, 'kw', '♛ ' + T('Winner')); iset(box, 'ki', '■ ' + T('Imposter'));
    // (the stage's cards: four in a row, as many rows as it takes)
    const cg = iq(box, 'grid')[0];
    if (cg && /repeat\(4,1fr\)/.test(cg.getAttribute('style') || '')) cg.style.gridTemplateColumns = 'repeat(4,minmax(0,1fr))';
    // (the two-column list: one full-width column for up to five players, and as many rows as it takes for more than ten)
    if (cg && /grid-auto-flow:\s*column/.test(cg.getAttribute('style') || '')) {
      const n = cg.children.length;
      if (n <= 5) { cg.style.gridTemplateColumns = 'minmax(0,1fr)'; cg.style.gridAutoFlow = 'row'; cg.style.gridTemplateRows = 'none'; }
      else { cg.style.gridTemplateColumns = 'repeat(2,minmax(0,1fr))'; cg.style.gridTemplateRows = 'repeat(' + Math.ceil(n / 2) + ',auto)'; }
    }
    for (const f of iq(box, 'foot')) f.textContent = final || r.end ? (G.host ? '' : S().hostAgain) : T('The next game starts soon.');
    // share this screen: a picture of it, for Instagram, TikTok, Facebook, WhatsApp, Messages or anywhere
    const sh = el('div', 'imp-share', w);
    const sb = el('button', 'imp-btn gold', sh, '📤 ' + T('Share the winners')); sb.type = 'button';
    el('div', 'imp-s', sh, T('Instagram, TikTok, Facebook, WhatsApp and more'));
    const chips = el('div', 'imp-chips', sh);
    const save = el('button', '', chips, '💾 ' + T('Save the picture')); save.type = 'button';
    const copy = el('button', '', chips, '📋 ' + T('Copy the text')); copy.type = 'button';
    sb.onclick = () => impShare(r, final, 'share', sb);
    save.onclick = () => impShare(r, final, 'save', save);
    copy.onclick = () => impShare(r, final, 'copy', copy);
    if (endCtl) endCtl(v.body);
    if (!G.impFx || G.impFx !== r) { G.impFx = r; const me = list.find(x => x.id === G.id); if (me && me.w) { confetti(); buzz('long'); } else buzz('ok'); }
  }
  function impEnd() {
    impWin(G.impFinal || G.impRes, !!G.impFinal, body => {
      if (G.host) {
        const again = btn(S().again, { kind: 'go', huge: true, full: true, icon: 'refresh' }, body, () => { send({ k: 'again' }); buzz('ok'); });
        again.style.marginTop = '16px';
        pair(body, [[S().otherGame, () => pickGameSheet((G.lobby || {}).games || [])], [S().changeName, () => joinScreen(true)]]);
      } else pair(body, [[S().changeName, () => joinScreen(true)]]);
    });
  }
  // the picture to share: the night's winners in the game's look, as a tall story picture (1080 x 1920)
  async function impCard(r, final) {
    const W2 = 1080, H2 = 1920;
    const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2;
    const g = cv.getContext('2d');
    const rtl = document.documentElement.dir === 'rtl';
    try { g.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
    try { await Promise.all(['700 80px "IMP Fredoka"', '800 40px "IMP Nunito"'].map(f => document.fonts.load(f))); } catch (e) {}
    const F = (w2, px) => w2 + ' ' + px + 'px "IMP Fredoka", "IMP Nunito", sans-serif';
    const N = (w2, px) => w2 + ' ' + px + 'px "IMP Nunito", sans-serif';
    const bg = g.createLinearGradient(0, 0, 0, H2); bg.addColorStop(0, '#1b1033'); bg.addColorStop(1, '#0e0920');
    g.fillStyle = bg; g.fillRect(0, 0, W2, H2);
    const glow = (x, y, rr, c) => { const rg = g.createRadialGradient(x, y, 0, x, y, rr); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, W2, H2); };
    glow(540, 0, 900, 'rgba(124,92,255,.35)'); glow(540, 1500, 700, 'rgba(255,77,106,.18)'); glow(150, 120, 500, 'rgba(58,31,92,.8)');
    // (the light rays turning behind the winners, frozen)
    g.save(); g.translate(540, 760); for (let i = 0; i < 24; i++) { g.rotate(Math.PI / 12); g.fillStyle = i % 2 ? 'rgba(255,201,60,.05)' : 'rgba(255,77,106,.04)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, -1400); g.lineTo(90, -1400); g.closePath(); g.fill(); } g.restore();
    g.fillStyle = 'rgba(255,255,255,.025)'; for (let y = 0; y < H2; y += 6) g.fillRect(0, y, W2, 2);
    const img = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    const icon = await img('../play/icons/imposter.webp');
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    if (icon) { g.save(); g.shadowColor = 'rgba(255,77,106,.5)'; g.shadowBlur = 30; g.drawImage(icon, 540 - 80, 90, 160, 160); g.restore(); }
    const title = T('Who\'s the Imposter?');
    g.font = F(700, 78); g.fillStyle = '#ffe3e8'; g.save(); g.shadowColor = '#ff4d6a'; g.shadowBlur = 34; g.fillText(title, 540, 345, 980); g.restore(); g.fillText(title, 540, 345, 980);
    g.font = N(800, 30); g.fillStyle = '#ff4d6a';
    const sp = s2 => /[\u0590-\u08ff\u0900-\u0dff\u0e00-\u0fff\u1000-\u109f]/.test(s2) ? s2 : [...s2].join(String.fromCharCode(8202));
    g.fillText(sp(iup(T('The winners'))), 540, 440);
    const list = (Array.isArray(r.list) ? r.list : []).filter(x => x && L.okId(x.id));
    const winners = list.filter(x => x.w);
    // the winners' names, as big as fits
    const names = winners.length ? winners.map(x => L.clean(x.n, 16)).join(' · ') : T('Nobody this time');
    const lines = []; { g.font = F(700, 70); let cur = ''; for (const wd of names.split(' · ')) { const t2 = cur ? cur + ' · ' + wd : wd; if (g.measureText(t2).width > 960 && cur) { lines.push(cur); cur = wd; } else cur = t2; } if (cur) lines.push(cur); }
    g.fillStyle = '#fff3d6'; g.save(); g.shadowColor = 'rgba(255,201,60,.55)'; g.shadowBlur = 26;
    lines.slice(0, 3).forEach((l2, i) => g.fillText(l2, 540, 530 + i * 82, 1000)); g.restore();
    let y = 530 + Math.min(3, lines.length) * 82 + 10;
    // the line: caught, or got away
    const caught = !final && (r.none || r.caught);
    const pill = final ? T('After {n} games', { n: numFmt(+r.of || 1) }) : r.none ? T('No imposter this time!') : T(caught ? 'Imposter caught! {name} was the imposter' : 'Imposter escaped! {name} was the imposter', { name: (r.imps || []).join(' & ') });
    g.font = N(800, 34); const pw = Math.min(1000, g.measureText(pill).width + 80);
    g.fillStyle = caught || final ? 'rgba(255,77,106,.16)' : 'rgba(255,201,60,.14)'; g.strokeStyle = caught || final ? '#ff4d6a' : '#ffc93c'; g.lineWidth = 3;
    const rr2 = (x, y2, w2, h2, rad) => { g.beginPath(); g.moveTo(x + rad, y2); g.arcTo(x + w2, y2, x + w2, y2 + h2, rad); g.arcTo(x + w2, y2 + h2, x, y2 + h2, rad); g.arcTo(x, y2 + h2, x, y2, rad); g.arcTo(x, y2, x + w2, y2, rad); g.closePath(); };
    rr2(540 - pw / 2, y, pw, 70, 35); g.fill(); g.stroke();
    g.fillStyle = '#fff'; g.fillText(pill, 540, y + 47, 960);
    y += 120;
    // the winners' faces, with their crowns
    const faces = winners.slice(0, 6);
    const fw = faces.length > 5 ? 128 : 150, gap = faces.length > 5 ? 20 : 26, tw = faces.length * fw + (faces.length - 1) * gap;
    for (let i = 0; i < faces.length; i++) {
      const x = 540 - tw / 2 + i * (fw + gap) + fw / 2;
      const rad = fw / 2 - 4;
      g.save(); g.beginPath(); g.arc(x, y + 100, rad, 0, Math.PI * 2); g.fillStyle = '#1d1238'; g.fill(); g.lineWidth = 7; g.strokeStyle = '#ffc93c'; g.stroke(); g.restore();
      const im2 = await img(booUri(AVATARS.includes(faces[i].av) ? faces[i].av : 'boo:hi'));
      if (im2) g.drawImage(im2, x - rad * 0.86, y + 100 - rad * 0.86, rad * 1.72, rad * 1.72);
      g.font = '54px sans-serif'; g.fillText('👑', x, y + 30);
      g.font = F(700, 30); g.fillStyle = '#fff'; g.fillText(L.clean(faces[i].n, 12), x, y + 222, fw + 20);
    }
    if (faces.length) y += 270;
    // what happened to me
    const me = list.find(x => x.id === G.id);
    if (me) {
      const said = final ? T('I scored {n} points!', { n: numFmt(+me.p || 0) }) : me.i ? (me.s === 'escaped' ? T('I was the imposter, and I got away!') : me.s === 'stole' ? T('I was the imposter, and I stole the win!') : T('I was the imposter, and they caught me!')) : me.r > 0 ? T('I found the imposter!') : T('The imposter fooled me!');
      g.font = F(700, 52); g.fillStyle = '#ffc93c'; g.fillText(said, 540, y + 30, 1000);
      y += 90;
    }
    // the scoreboard: as many rows as fit above the bottom lines (this phone's own row always among them)
    const fit = Math.max(3, Math.floor((H2 - 250 - y) / 92));
    let top = list.slice(0, fit);
    const meRow = list.find(x => x.id === G.id);
    if (meRow && !top.includes(meRow)) top = top.slice(0, fit - 1).concat(meRow);
    for (let i = 0; i < top.length; i++) {
      const x = top[i], yy = y + i * 92;
      g.fillStyle = x.w ? 'rgba(255,201,60,.12)' : x.i ? 'rgba(255,77,106,.14)' : 'rgba(255,255,255,.05)';
      g.strokeStyle = x.w ? 'rgba(255,201,60,.55)' : x.i ? 'rgba(255,77,106,.6)' : 'rgba(255,255,255,.12)'; g.lineWidth = 3;
      rr2(90, yy, 900, 76, 22); g.fill(); g.stroke();
      if (x.id === G.id) { g.strokeStyle = '#fff'; g.lineWidth = 4; rr2(90, yy, 900, 76, 22); g.stroke(); }
      const X = v2 => rtl ? W2 - v2 : v2, A = a2 => rtl ? (a2 === 'left' ? 'right' : 'left') : a2;
      g.textAlign = A('left'); g.font = F(700, 34); g.fillStyle = x.w ? '#ffc93c' : '#8a7fb0'; g.fillText(x.w ? '♛' : numFmt(list.indexOf(x) + 1), X(120), yy + 50);
      g.fillStyle = '#fff'; g.fillText(L.clean(x.n, 16), X(190), yy + 50, final ? 600 : 470);
      g.textAlign = A('right'); g.font = F(700, 34); g.fillStyle = x.w ? '#ffc93c' : '#c8bde6'; g.fillText(numFmt(+x.p || 0), X(960), yy + 50);
      if (!final) { g.font = N(900, 22); g.fillStyle = x.i ? '#ff8aa0' : x.r > 0 ? '#34d399' : '#a99bd0'; g.fillText(iup(x.i ? T('Imposter') : x.r > 0 ? T('Right') : T('Fooled')), X(880), yy + 47, 200); }
      g.textAlign = 'center';
    }
    y += top.length * 92 + 30;
    if (r.word && !final) { g.font = N(800, 34); g.fillStyle = '#c8bde6'; g.fillText(T('The word was "{word}".', { word: L.clean(r.word, 40) }), 540, Math.max(y + 30, H2 - 150), 1000); }
    g.font = F(700, 34); g.fillStyle = '#ffe3e8'; g.fillText(T('Play it free at blokvane.com'), 540, H2 - 70, 1000);
    return new Promise(res => cv.toBlob(b => res(b), 'image/png'));
  }
  async function impShare(r, final, how, b) {
    const list = (Array.isArray(r.list) ? r.list : []);
    const winners = list.filter(x => x.w).map(x => L.clean(x.n, 16));
    const text = T('We played Who\'s the Imposter? The winners: {names}. Play it free at blokvane.com', { names: winners.join(', ') || T('Nobody this time') });
    if (how === 'copy') { try { await navigator.clipboard.writeText(text); toast(T('Copied!'), 'ok'); } catch (e) { toast(text, ''); } return; }
    b.disabled = true;
    try {
      const blob = await impCard(r, final);
      if (!blob) throw new Error('no picture');
      const file = new File([blob], 'whos-the-imposter.png', { type: 'image/png' });
      if (how === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text, title: T('Who\'s the Imposter?') }); return; } catch (e) { if (!e || e.name === 'AbortError') return; toast(T('Sharing didn\'t work here. The picture was saved instead.'), ''); }
      } else if (how === 'share' && navigator.share) { try { await navigator.share({ text, title: T('Who\'s the Imposter?') }); } catch (e) {} }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'whos-the-imposter.png'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      toast(T('The picture is saved.'), 'ok');
    } catch (e) { toast(T('That didn\'t work. Try again.'), 'bad'); }
    finally { b.disabled = false; }
  }

  // ---------- Emoji Riddles: its screens in the game's look (the TV's marquee, its four colored answer cards) ----------
  // The TV sends each riddle's emoji with the question (extra.emo), so this phone shows them too, and the answers in this
  // phone's language. After each riddle: a big green check or a red cross, the points, the right answer. At the end: the
  // winners as a movie poster, with a picture of it to share (Instagram, TikTok, Facebook, WhatsApp, Messages...).
  const isEmo = () => (G.lobby || {}).game === 'emoji';
  const ECOL = [['#ff5a6e', '#c8213f', '#fff'], ['#4c8dff', '#2253c9', '#fff'], ['#ffc93c', '#d99a14', '#2a1700'], ['#34d399', '#17a673', '#06281b']];
  const ESEG = (() => { try { return new Intl.Segmenter(undefined, { granularity: 'grapheme' }); } catch (e) { return null; } })();
  function emoSplit(s) {
    const t = String(s || '').replace(/\s+/g, '').slice(0, 64);
    if (!t) return [];
    if (ESEG) return [...ESEG.segment(t)].map(x => x.segment).slice(0, 12);
    return (t.match(/\uD83C[\uDDE6-\uDDFF]\uD83C[\uDDE6-\uDDFF]|[0-9#*]️?⃣|(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[ -⯿　-〿])(?:️|\uD83C[\uDFFB-\uDFFF])*(?:‍(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[ -⯿])(?:️|\uD83C[\uDFFB-\uDFFF])*)*/g) || [t]).slice(0, 12);
  }
  function emoView() {
    const v = gameView();
    v.body.classList.add('emo-ph');
    return v;
  }
  // the marquee with the riddle: which one it is, its category, and its emoji (Slow reveal: the ones out so far)
  function emoCard(parent, q, e) {
    const mine = trOf(q);
    const box = el('div', 'emo-mq', parent);
    const h = el('div', 'h', box);
    if (e.made) { h.append('✍️ '); el('b', '', h, T('A riddle by {name}', { name: L.clean(e.made, 16) })); }
    else if (e.n) { el('b', '', h, T('Riddle {n} / {total}', { n: numFmt(+e.n || 1), total: numFmt(+e.of || 1) })); const c = L.clean((mine && mine.cat) || e.cat || '', 40); if (c) h.append('· ' + c); }
    if (e.gold) el('span', 'gold', h, '⭐ ×2');
    G.ui.emo = { row: el('div', 'emo-ems', box), list: emoSplit(e.e), shown: +e.shown || 0, was: null };
    emoPaint();
    return box;
  }
  function emoPaint() {
    const u = G.ui.emo;
    if (!u || !u.row) return;
    const n = u.shown > 0 ? Math.min(u.shown, u.list.length) : u.list.length;
    u.row.textContent = '';
    u.list.forEach((x, i) => {
      const sp = el('span', i < n ? '' : 'q', u.row, i < n ? x : '❔');
      // (only the new ones pop in)
      if (u.was != null && i < u.was) sp.style.animation = 'none'; else sp.style.animationDelay = (u.was == null ? i * 0.12 : 0) + 's';
    });
    u.was = n;
    if (u.list.length > 4) u.row.style.fontSize = Math.max(30, 52 - (u.list.length - 4) * 5) + 'px';
  }
  // a riddle on this phone: the emoji, then the four answers (or a box to type it), with the clock
  function emoQ(q) {
    const ex = q.extra || {};
    const e = ex.emo || {};
    if (q.kind === 'wait') return emoWait(e, q);
    if (!q.who.includes(G.id)) return emoWait({ t: G.out ? 'out' : e.made ? 'mine' : 'look' }, q);
    const v = emoView();
    const b = v.body;
    if (e.kids) b.classList.add('emo-kids');
    G.ui.body = b;
    if (q.kind === 'emojimake') {
      if (q.sec > 0) timerBar(b, q.sec);
      const w = el('div', 'emo-wait', b);
      el('div', 'e', w, '✍️🤔💡');
      el('h2', '', w, T('Make your own riddle!'));
      el('p', '', w, T('A few emoji, and what they mean. Not too easy: if everyone gets it, you get nothing!'));
      emojiMakeQ(b, q);
      return;
    }
    if (q.sec > 0) timerBar(b, q.sec);
    emoCard(b, q, e);
    // (Type it, the second try: the hint, in this phone's language)
    const ht = e.hints && typeof e.hints === 'object' && typeof e.hints[G.lang] === 'string' ? e.hints[G.lang] : e.hint;
    if (ht) el('div', 'emo-hint', b, '💡 ' + T('Hint: {x}', { x: L.clean(ht, 80) }));
    if (q.kind === 'text') return textQ(b, q);
    const mine = trOf(q);
    const src = mine && Array.isArray(mine.o) && Array.isArray(q.opts) && mine.o.length === q.opts.length ? mine.o : q.opts;
    const opts = (Array.isArray(src) ? src : []).slice(0, 4).map(o => L.clean(o, 140));
    const LETS = I() ? I().letters(G.lang) : ['A', 'B', 'C', 'D'];
    const grid = el('div', 'emo-ans', b);
    G.ui.ans = opts.map((o, i) => {
      const a = el('button', 'emo-a', grid);
      a.type = 'button';
      const c = ECOL[i % 4];
      a.style.setProperty('--c1', c[0]); a.style.setProperty('--c2', c[1]); a.style.setProperty('--t', c[2]);
      el('span', 'l', a, LETS[i] || SHAPES[i]);
      el('span', '', a, o);
      a.onclick = () => { if (answer(i, LETS[i] || SHAPES[i])) { a.classList.add('mine'); for (const x of G.ui.ans) if (x !== a) x.classList.add('dim'); emoReact(b); } };
      return a;
    });
  }
  // reactions for the TV: tap one and it floats up the big screen with your face (one a second at most)
  const EMO_RX = ['😂', '😮', '🔥', '👏', '😭', '🤯'];
  function emoReact(parent) {
    const bar = el('div', 'emo-rxbar', parent);
    for (const x of EMO_RX) {
      const b = el('button', '', bar, x);
      b.type = 'button';
      b.onclick = () => {
        const t = Date.now();
        if (t - (G.rxAt || 0) < 1100) return;
        G.rxAt = t;
        send({ k: 'react', e: x });
        buzz('tap');
        try { b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35) translateY(-6px)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.2,1.4,.4,1)' }); } catch (er) {}
      };
    }
    return bar;
  }
  // the moments in between: how to play, get ready, look at the TV
  function emoWait(e, q) {
    stopQ();
    const v = emoView();
    const b = v.body;
    const w = el('div', 'emo-wait', b);
    if (e.t === 'rules') {
      el('div', 'e', w, '🎬🍕🦁');
      el('h2', '', w, T('How to play'));
      el('p', '', w, T('The first riddle starts soon. Look at the TV!'));
      if (+e.sec > 0) { const t = el('div', 'pt-timer', b); const i = el('i', '', t); try { i.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: +e.sec * 1000, fill: 'forwards', easing: 'linear' }); } catch (er) {} }
      howtoCard(b, G.lobby || {});
    } else if (e.t === 'out') { el('div', 'e', w, '👻'); el('h2', '', w, S().out); el('p', '', w, S().look); }
    else if (e.t === 'mine') { el('div', 'e', w, '✍️'); el('h2', '', w, T('This one is your riddle!')); el('p', '', w, T('Watch the others guess it on the TV.')); }
    else {
      el('div', 'e', w, e.gold ? '⭐' : '📺');
      el('h2', '', w, e.gold ? T('Golden riddle: double points!') : S().look);
      if (e.n) el('p', '', w, T('Riddle {n} / {total}', { n: numFmt(+e.n || 1), total: numFmt(+e.of || 1) }));
      else if (q && q.prompt) el('p', '', w, L.clean(q.prompt, 160));
    }
    if (e.t !== 'rules') emoReact(b);
  }
  // the TV's news in the middle of a riddle: one more emoji (Slow reveal), and the winners at the end
  function onEmo(m) {
    if (m.t === 'more') { if (G.q && G.q.n === m.n && G.ui.emo && G.ui.emo.row && G.ui.emo.row.isConnected) { G.ui.emo.shown = Math.max(G.ui.emo.shown, +m.shown || 0); emoPaint(); buzz('tap'); } return; }
    if (m.t === 'win') { G.emoWin = m; if (G.phase === 'end') showEnd(); }
  }
  // right or not: a big green check or a red cross, the points, a streak, the right answer, your place
  function emoRes(m) {
    stopQ();
    const e = m.emo || {};
    const v = emoView();
    const b = v.body;
    const ok = !!m.ok, kid = !!e.kids && !ok;
    const box = el('div', 'emo-res ' + (ok ? 'ok' : kid ? 'kid' : 'bad'), b);
    el('div', 'big', box, ok ? '✓' : kid ? '🌈' : '✗');
    const title = typeof m.title === 'string' && m.title ? L.clean(m.title, 60) : e.maker ? (ok ? T('Your riddle scored!') : T('Nobody scored with your riddle')) : ok ? (e.first ? S().first : S().right) : kid ? T('So close! Let\'s try the next one!') : e.none ? S().timeUp : S().wrong;
    el('h1', '', box, title);
    if (m.pts) el('div', 'pts', box, T('+{n} points', { n: numFmt(m.pts) }));
    const tags = el('div', 'tags', box);
    if (e.gold && ok) el('span', '', tags, '⭐ ' + T('Golden riddle: double points!'));
    if (e.streak >= 2) el('span', '', tags, '🔥 ' + T('{n} in a row!', { n: numFmt(e.streak) }));
    if (e.late && ok) el('span', '', tags, '💡 ' + T('Half points, with the hint'));
    if (typeof m.lives === 'number' && !m.out) el('span', '', tags, m.lives > 0 ? '❤️'.repeat(Math.max(0, Math.min(10, m.lives))) : '💀');
    if (e.spare) el('span', '', tags, '🛡️ ' + T('Everyone missed, so nobody loses a life.'));
    if (!tags.children.length) tags.remove();
    if (m.out) el('p', '', box, S().out);
    if (m.right != null && m.right !== '' && !e.maker) {
      const a = el('div', 'ans', box);
      if (e.e) el('div', 'e', a, emoSplit(e.e).join(''));
      el('small', '', a, S().theRight);
      el('b', '', a, L.clean(m.right, 140));
    }
    if (e.place && e.of > 1) el('div', 'place', box, S().yourPlace + ': ' + T('{a} of {b}', { a: numFmt(e.place), b: numFmt(e.of) }));
    emoReact(b);
    buzz(ok ? 'ok' : 'bad');
    if (ok && (e.first || e.kids || e.streak >= 3)) confetti();
  }
  // the end: the winners as a movie poster (the TV's Movie Poster look), your place, sharing it, and what's next
  // (a gold laurel branch: six leaves along a curve)
  const EMO_LAUREL = '<svg viewBox="0 0 40 100" aria-hidden="true"><path d="M30 96C14 76 10 46 22 6" fill="none" stroke="#ffc93c" stroke-width="3" stroke-linecap="round"/>' +
    [[23, 12, -35], [17, 26, -20], [14, 41, -8], [14, 56, 6], [17, 71, 20], [22, 85, 34]].map(([x, y, r]) => '<ellipse cx="' + (x + 7) + '" cy="' + y + '" rx="8" ry="4.2" transform="rotate(' + r + ' ' + (x + 7) + ' ' + y + ')" fill="#ffc93c"/><ellipse cx="' + (x - 6) + '" cy="' + (y + 3) + '" rx="8" ry="4.2" transform="rotate(' + (-r - 30) + ' ' + (x - 6) + ' ' + (y + 3) + ')" fill="#f5b52a"/>').join('') + '</svg>';
  const emoFace = (x, mine) => (mine && G.photo ? G.photo : booUri(AVATARS.includes(x.av) ? x.av : 'boo:party') || booUri('boo:hi'));
  function emoEnd() {
    const r = G.emoWin || {};
    const v = emoView();
    const b = v.body;
    const list = (Array.isArray(r.list) ? r.list : []).filter(x => x && typeof x.n === 'string').slice(0, 10);
    const w1 = list[0];
    const card = el('div', 'emo-poster', b);
    el('div', 'pr', card, iup(T('Emoji Riddles presents')));
    el('div', 'wk', card, r.team ? T('The winning team') : T('The winner'));
    if (w1) {
      const av = el('div', 'av', card);
      const im = el('img', w1.id === G.id && G.photo ? 'ph' : '', av); im.src = emoFace(w1, w1.id === G.id); im.alt = '';
      for (const k of ['l', 'r']) { const lf = el('i', 'lf ' + k, av); lf.innerHTML = EMO_LAUREL; }
      el('div', 'nm', card, L.clean(w1.n, 20));
      el('div', 'pt', card, T('Points: {n}', { n: numFmt(+w1.s || 0) }));
      const rest = list.slice(1, 3);
      if (rest.length) {
        const rw = el('div', 'rest', card);
        rest.forEach((x, i) => {
          const d = el('div', '', rw); d.style.setProperty('--rc', i ? '#d9ccf2' : '#9fc4ff');
          const a2 = el('span', 'a2', d); const im2 = el('img', x.id === G.id && G.photo ? 'ph' : '', a2); im2.src = emoFace(x, x.id === G.id); im2.alt = '';
          const t = el('span', '', d); el('small', '', t, '#' + numFmt(i + 2)); el('b', '', t, L.clean(x.n, 16)); el('i', '', t, T('Points: {n}', { n: numFmt(+x.s || 0) }));
        });
      }
    }
    // (you: your place)
    const me = G.endRes;
    if (me && me.place) el('div', 'emo-me', b, (me.place === 1 ? '🏆 ' : me.place === 2 ? '🥈 ' : me.place === 3 ? '🥉 ' : '') + S().yourPlace + ': ' + T('{a} of {b}', { a: numFmt(me.place), b: numFmt(me.of || list.length) }) + ' · ' + T('{n} points', { n: numFmt(+me.score || 0) }));
    // share the winners: a picture of the poster, for Instagram, TikTok, Facebook, WhatsApp, Messages or anywhere
    const sh = el('div', 'emo-share', b);
    const sb = el('button', 'go', sh, '📤 ' + T('Share the winners')); sb.type = 'button';
    el('small', '', sh, T('Instagram, TikTok, Facebook, WhatsApp and more'));
    const ch = el('div', 'ch', sh);
    const save = el('button', '', ch, '💾 ' + T('Save the picture')); save.type = 'button';
    const copy = el('button', '', ch, '📋 ' + T('Copy the text')); copy.type = 'button';
    sb.onclick = () => emoShare(r, 'share', sb);
    save.onclick = () => emoShare(r, 'save', save);
    copy.onclick = () => emoShare(r, 'copy', copy);
    // the table
    if (list.length > 1) {
      const ls = el('div', 'pt-list', b);
      list.forEach((x, i) => { const row = el('div', 'r' + (x.id === G.id ? ' me' : ''), ls); el('span', 'n', row, numFmt(i + 1)); el('b', '', row, x.id === G.id ? S().you : L.clean(x.n, 20)); el('span', '', row, numFmt(+x.s || 0)); });
    }
    if (G.host) {
      const again = btn(S().again, { kind: 'go', huge: true, full: true, icon: 'refresh' }, b, () => { send({ k: 'again' }); buzz('ok'); });
      again.style.marginTop = '16px';
      pair(b, [[S().otherGame, () => pickGameSheet((G.lobby || {}).games || [])], [S().changeName, () => joinScreen(true)]]);
    } else { el('p', 'pt-note', b, S().hostAgain); pair(b, [[S().changeName, () => joinScreen(true)]]); }
    if (!G.endFx) { G.endFx = true; if (me && me.place === 1) { confetti(); buzz('long'); } else buzz('ok'); }
  }
  // the picture to share: the winners as a movie poster between two film strips (a tall story picture, 1080 x 1920)
  async function emoPic(r) {
    const W2 = 1080, H2 = 1920;
    const cv = document.createElement('canvas'); cv.width = W2; cv.height = H2;
    const g = cv.getContext('2d');
    const rtl = document.documentElement.dir === 'rtl';
    try { g.direction = rtl ? 'rtl' : 'ltr'; } catch (e) {}
    try { await Promise.all(['700 80px "BV Fun"', '800 40px Nunito'].map(f => document.fonts.load(f))); } catch (e) {}
    const F = (w2, px) => w2 + ' ' + px + 'px "BV Fun", ui-rounded, "Nunito", system-ui, sans-serif';
    const N = (w2, px) => w2 + ' ' + px + 'px ui-rounded, "Nunito", system-ui, sans-serif';
    const EM = px => px + 'px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
    const rr = (x, y, w2, h2, rad) => { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + w2, y, x + w2, y + h2, rad); g.arcTo(x + w2, y + h2, x, y + h2, rad); g.arcTo(x, y + h2, x, y, rad); g.arcTo(x, y, x + w2, y, rad); g.closePath(); };
    const img = src => new Promise(res => { if (!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
    // the night, and two film strips full of emoji
    g.fillStyle = '#0c0410'; g.fillRect(0, 0, W2, H2);
    const glow = g.createRadialGradient(540, 960, 0, 540, 960, 900); glow.addColorStop(0, 'rgba(91,42,138,.55)'); glow.addColorStop(1, 'rgba(12,4,16,0)'); g.fillStyle = glow; g.fillRect(0, 0, W2, H2);
    const strip = (y, rot, ems) => {
      g.save(); g.translate(540, y); g.rotate(rot);
      g.fillStyle = '#1b1030'; g.fillRect(-700, -95, 1400, 190);
      g.fillStyle = '#c8bde6'; for (let x = -690; x < 700; x += 44) { g.globalAlpha = 0.55; g.fillRect(x, -82, 22, 14); g.fillRect(x, 68, 22, 14); }
      g.globalAlpha = 1;
      g.font = EM(84); g.textAlign = 'center'; g.textBaseline = 'middle';
      for (let i = 0; i < 6; i++) { const x = -625 + i * 250; g.fillStyle = '#2a1846'; g.fillRect(x - 105, -58, 210, 116); g.fillText(ems[i % ems.length], x, 4); }
      g.restore();
    };
    strip(150, -0.035, ['🍕', '🦁', '💬', '🍿', '⭐', '🎬']);
    strip(1780, 0.03, ['🍿', '⭐', '🎬', '🍕', '🦁', '💬']);
    // the poster
    const X0 = 110, Y0 = 300, PW = 860, PH = 1300;
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 50; rr(X0, Y0, PW, PH, 46); g.fillStyle = '#f3e2b8'; g.fill(); g.restore();
    rr(X0 + 16, Y0 + 16, PW - 32, PH - 32, 34);
    const bg = g.createRadialGradient(540, Y0 + 480, 40, 540, Y0 + 480, 900); bg.addColorStop(0, '#5b2a8a'); bg.addColorStop(0.55, '#2a1050'); bg.addColorStop(1, '#160a2e');
    g.fillStyle = bg; g.fill();
    g.save(); rr(X0 + 16, Y0 + 16, PW - 32, PH - 32, 34); g.clip();
    g.translate(540, Y0 + 470); for (let i = 0; i < 24; i++) { g.rotate(Math.PI / 12); g.fillStyle = 'rgba(255,201,60,.07)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-110, -1300); g.lineTo(110, -1300); g.closePath(); g.fill(); }
    g.restore();
    g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const list = (Array.isArray(r.list) ? r.list : []).filter(x => x && typeof x.n === 'string');
    const w1 = list[0];
    const sp = s2 => (/[֐-ࣿऀ-෿฀-࿿က-႟　-鿿]/.test(s2) ? s2 : [...s2].join(String.fromCharCode(8202, 8202)));
    g.font = N(900, 28); g.fillStyle = '#f3e2b8'; g.fillText(sp(iup(T('Emoji Riddles presents'))), 540, Y0 + 110, PW - 80);
    g.font = F(700, 62); g.fillStyle = '#ffc93c'; g.fillText(r.team ? T('The winning team') : T('The winner'), 540, Y0 + 195, PW - 80);
    if (w1) {
      const cy = Y0 + 470;
      // (laurel leaves on both sides, the crown on top)
      g.fillStyle = '#ffc93c';
      for (const sd of [-1, 1]) for (let k = 0; k < 6; k++) { g.save(); g.translate(540 + sd * (215 - k * 3), cy + 90 - k * 42); g.rotate(sd * (0.5 + k * 0.08)); g.beginPath(); g.ellipse(0, 0, 34, 16, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      g.save(); g.shadowColor = 'rgba(255,201,60,.7)'; g.shadowBlur = 50; g.beginPath(); g.arc(540, cy, 170, 0, Math.PI * 2); g.fillStyle = '#1d1238'; g.fill(); g.restore();
      g.beginPath(); g.arc(540, cy, 170, 0, Math.PI * 2); g.lineWidth = 14; g.strokeStyle = '#ffc93c'; g.stroke();
      const mine = w1.id === G.id;
      const face = await img(emoFace(w1, mine));
      if (face) { g.save(); g.beginPath(); g.arc(540, cy, 163, 0, Math.PI * 2); g.clip(); if (mine && G.photo) g.drawImage(face, 540 - 163, cy - 163, 326, 326); else g.drawImage(face, 540 - 120, cy - 120, 240, 240); g.restore(); }
      g.font = EM(110); g.textBaseline = 'middle'; g.fillText('👑', 540, cy - 205); g.textBaseline = 'alphabetic';
      // the name, in gold
      let fs = 132; g.font = F(700, fs); const nm = L.clean(w1.n, 20);
      while (g.measureText(nm).width > PW - 110 && fs > 60) { fs -= 6; g.font = F(700, fs); }
      const gr = g.createLinearGradient(0, cy + 220, 0, cy + 360); gr.addColorStop(0, '#fff8d6'); gr.addColorStop(0.5, '#ffc93c'); gr.addColorStop(1, '#ff9a3c');
      g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowOffsetY = 8; g.fillStyle = gr; g.fillText(nm, 540, cy + 340, PW - 80); g.restore();
      g.font = N(900, 46); g.fillStyle = '#fff'; g.fillText(T('Points: {n}', { n: numFmt(+w1.s || 0) }), 540, cy + 420, PW - 80);
      // second and third
      const rest = list.slice(1, 3);
      if (rest.length) {
        const y = cy + 470;
        g.strokeStyle = 'rgba(243,226,184,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(X0 + 70, y); g.lineTo(X0 + PW - 70, y); g.stroke();
        const colW = rest.length === 1 ? 0 : 380;
        for (let i = 0; i < rest.length; i++) {
          const x = rest[i], cx = 540 + (rest.length === 1 ? 0 : (i ? 1 : -1) * colW / 2), yy = y + 120;
          const col = i ? '#d9ccf2' : '#9fc4ff';
          g.beginPath(); g.arc(cx - 110, yy, 54, 0, Math.PI * 2); g.fillStyle = '#1a1236'; g.fill(); g.lineWidth = 8; g.strokeStyle = col; g.stroke();
          const f2 = await img(emoFace(x, x.id === G.id));
          if (f2) { g.save(); g.beginPath(); g.arc(cx - 110, yy, 50, 0, Math.PI * 2); g.clip(); if (x.id === G.id && G.photo) g.drawImage(f2, cx - 160, yy - 50, 100, 100); else g.drawImage(f2, cx - 148, yy - 38, 76, 76); g.restore(); }
          g.textAlign = 'left';
          g.font = N(900, 26); g.fillStyle = col; g.fillText('#' + numFmt(i + 2), cx - 40, yy - 22);
          g.font = F(700, 42); g.fillStyle = '#fff'; g.fillText(L.clean(x.n, 12), cx - 40, yy + 22, 230);
          g.font = N(800, 24); g.fillStyle = col; g.fillText(T('Points: {n}', { n: numFmt(+x.s || 0) }), cx - 40, yy + 58, 230);
          g.textAlign = 'center';
        }
      }
    }
    // (my own place, when I'm not the winner)
    const me = G.endRes;
    const meRow = list.find(x => x.id === G.id);
    if (me && me.place > 1 && meRow) { g.font = F(700, 44); g.fillStyle = '#ffc93c'; g.fillText(T('I came {n}!', { n: '#' + numFmt(me.place) }) + '  ' + T('{n} points', { n: numFmt(+me.score || 0) }), 540, Y0 + PH - 70, PW - 80); }
    else if (me && me.place === 1) { g.font = F(700, 44); g.fillStyle = '#ffc93c'; g.fillText('🏆 ' + T('I won Emoji Riddles!'), 540, Y0 + PH - 70, PW - 80); }
    g.font = F(700, 38); g.fillStyle = '#fff3d6'; g.fillText(T('Play it free at blokvane.com'), 540, 1648, 1000);
    return new Promise(res => cv.toBlob(b2 => res(b2), 'image/png'));
  }
  async function emoShare(r, how, b) {
    const list = (Array.isArray(r.list) ? r.list : []);
    const w1 = list[0];
    const text = T('We played Emoji Riddles! The winner: {name}. Play it free at blokvane.com', { name: w1 ? L.clean(w1.n, 20) : '?' });
    if (how === 'copy') { try { await navigator.clipboard.writeText(text); toast(T('Copied!'), 'ok'); } catch (e) { toast(text, ''); } return; }
    b.disabled = true;
    try {
      const blob = await emoPic(r);
      if (!blob) throw new Error('no picture');
      const file = new File([blob], 'emoji-riddles.png', { type: 'image/png' });
      if (how === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file], text, title: T('Emoji Riddles') }); return; } catch (e) { if (!e || e.name === 'AbortError') return; toast(T('Sharing didn\'t work here. The picture was saved instead.'), ''); }
      } else if (how === 'share' && navigator.share) { try { await navigator.share({ text, title: T('Emoji Riddles') }); } catch (e) {} }
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'emoji-riddles.png'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
      toast(T('The picture is saved.'), 'ok');
    } catch (e) { toast(T('That didn\'t work. Try again.'), 'bad'); }
    finally { b.disabled = false; }
  }

  // a result
  function showRes(m) {
    if (m && m.emo && isEmo()) return emoRes(m);
    stopQ();
    const v = gameView();
    const ok = !!m.ok;
    // (not right, but some points anyway, like a pin that was close: a friendlier screen)
    const some = !ok && +m.pts > 0 && !m.out;
    const box = el('div', 'pt-res ' + (ok ? 'ok' : some ? 'mid' : 'bad'), v.body);
    box.appendChild(booPic(typeof m.boo === 'string' && /^boo:[a-z]{2,12}$/.test(m.boo) ? m.boo : ok ? (m.first ? 'boo:hero' : 'boo:party') : m.out ? 'boo:boo' : some ? 'boo:hi' : 'boo:sad'));
    el('h1', '', box, typeof m.title === 'string' && m.title ? L.clean(m.title, 60) : ok ? (m.first ? S().first : S().right) : m.out ? S().out : S().wrong);
    if (m.pts) el('div', 'pts', box, T('+{n} points', { n: m.pts }));
    if (m.right != null && m.right !== '') el('p', '', box, T('The right answer: {x}', { x: L.clean(m.right, 140) }));
    if (m.note) el('p', '', box, L.clean(m.note, 160));
    el('p', 'muted small', box, S().look).style.marginTop = '14px';
    buzz(ok ? 'ok' : 'bad');
    if (ok && m.first) confetti();
  }
  // the end: your place, the top of the table, and what's next
  function showEnd() {
    stopQ();
    if (isImpGame() && (G.impFinal || G.impRes)) return impEnd();
    if (isEmo() && G.emoWin) return emoEnd();
    const v = gameView();
    const r = G.endRes;
    const box = el('div', 'pt-res ' + (r && r.place === 1 ? 'ok' : ''), v.body);
    box.appendChild(booPic(r && r.place === 1 ? 'boo:legend' : r && r.place <= 3 ? 'boo:party' : 'boo:love'));
    if (r && r.place) { el('p', '', box, S().yourPlace); const h = el('h1', '', box, `${r.place === 1 ? '🏆 ' : r.place === 2 ? '🥈 ' : r.place === 3 ? '🥉 ' : ''}` + T('{a} of {b}', { a: r.place, b: r.of })); h.style.fontSize = '40px'; el('div', 'pts', box, T('{n} points', { n: r.score || 0 })); }
    else el('h1', '', box, S().look);
    if (r && r.place === 1 && !G.endFx) { G.endFx = true; confetti(); buzz('long'); }
    if (Array.isArray(G.ranking) && G.ranking.length) {
      const ls = el('div', 'pt-list', v.body); ls.style.marginTop = '16px';
      for (const x of G.ranking) {
        const row = el('div', 'r' + (x.id === G.id ? ' me' : ''), ls);
        el('span', 'n', row, String(x.place));
        el('b', '', row, x.id === G.id ? S().you : L.clean(x.name, 20));
        el('span', '', row, String(x.score));
      }
    }
    if (G.host) {
      const again = btn(S().again, { kind: 'go', huge: true, full: true, icon: 'refresh' }, v.body, () => { send({ k: 'again' }); buzz('ok'); });
      again.style.marginTop = '16px';
      pair(v.body, [[S().otherGame, () => pickGameSheet((G.lobby || {}).games || [])], [S().changeName, () => joinScreen(true)]]);
    } else { el('p', 'pt-note', v.body, S().hostAgain); pair(v.body, [[S().changeName, () => joinScreen(true)]]); }
  }

  // Bingo Night: this phone's card(s)
  function showBingo() {
    stopQ();
    const b = G.bingo;
    if (!b) return;
    const v = gameView();
    G.ui.call = el('div', 'pt-call', v.body, '...');
    el('p', 'muted small center', v.body, b.auto ? S().marks : S().tapNums).style.margin = '0 0 10px';
    G.ui.cells = [];
    const cols = b.style === '90' ? 9 : 5;
    for (const c of b.cards) {
      const card = el('div', 'card', v.body);
      const grid = el('div', 'pt-bingo' + (b.big ? ' big' : '') + (b.style === '90' ? ' n90' : ''), card);
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      if (b.style === '75') for (const ch of 'BINGO') { const h = el('button', 'hd', grid, ch); h.type = 'button'; h.tabIndex = -1; h.setAttribute('aria-hidden', 'true'); }
      for (const n of c.cells.slice(0, cols === 5 ? 25 : 27)) {
        const x = el('button', n < 0 ? 'blank' : '', grid, n === 0 ? '★' : n < 0 ? '' : String(n));
        x.type = 'button';
        if (n < 0) { x.tabIndex = -1; x.setAttribute('aria-hidden', 'true'); continue; }
        if (n > 0) x.onclick = () => {
          if (b.auto) return;
          if (!b.called.has(n)) { buzz('bad'); x.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 220 }); return; }
          if (b.marks.has(n)) b.marks.delete(n); else b.marks.add(n);
          buzz('tap'); paintBingo();
        };
        G.ui.cells.push([n, x]);
      }
      el('small', 'muted', card, T('Card {no}', { no: c.no })).style.cssText = 'display:block;margin-top:8px;text-align:center';
    }
    const bb = btn(S().bingo, { kind: 'go', huge: true, full: true }, v.body, () => {
      if (b.wait > Date.now()) return;
      b.wait = Date.now() + 3000;
      const have = new Set([0, ...(b.auto ? b.called : b.marks)]);
      const best = b.cards.find(c => wins(c.cells, have, b.pattern, b.style)) || b.cards[0];
      if (best) send({ k: 'bingo', no: best.no });
      buzz('long');
    });
    bb.style.cssText += ';margin-top:14px;min-height:96px;font-size:28px';
    G.ui.bingoBtn = bb;
    if (G.host && G.paper) paperCard(v.body);
    paintBingo();
  }
  function paintBingo(fresh) {
    const b = G.bingo;
    if (!b || !G.ui.cells) return;
    if (G.ui.call && G.ui.call.isConnected) {
      G.ui.call.textContent = b.last ? (b.style === '75' ? 'BINGO'[Math.min(4, Math.floor((b.last - 1) / 15))] + ' ' + b.last : String(b.last)) : '...';
      if (fresh) try { G.ui.call.animate([{ transform: 'scale(.6)', opacity: .3 }, { transform: 'scale(1.08)' }, { transform: 'none', opacity: 1 }], { duration: 450 }); } catch (e) {}
    }
    let hit = false;
    for (const [n, x] of G.ui.cells) {
      const on = n === 0 || b.marks.has(n);
      x.classList.toggle('on', on);
      x.classList.toggle('called', b.called.has(n));
      if (fresh && n === b.last) hit = true;
    }
    if (hit) buzz('ok');
    const have = new Set([0, ...(b.auto ? b.called : b.marks)]);
    const ready = b.cards.some(c => wins(c.cells, have, b.pattern, b.style));
    if (G.ui.bingoBtn && !matchMedia('(prefers-reduced-motion: reduce)').matches) G.ui.bingoBtn.style.animation = ready ? 'pt-pulse 1s ease-in-out infinite' : '';
  }
  function wins(card, have, pattern, style) {
    const h = n => n === 0 || have.has(n);
    if (style === '90') { const rows = [0, 1, 2].map(r => card.slice(r * 9, r * 9 + 9).filter(n => n > 0)); const full = rows.map(rw => rw.length > 0 && rw.every(h)); return pattern === 'full' ? full.every(Boolean) : full.some(Boolean); }
    const at = (r, c) => card[r * 5 + c], I = [0, 1, 2, 3, 4];
    if (pattern === 'corners') return [at(0, 0), at(0, 4), at(4, 0), at(4, 4)].every(h);
    if (pattern === 'x') return I.every(i => h(at(i, i)) && h(at(i, 4 - i)));
    if (pattern === 'full') return card.every(h);
    return I.some(r => I.every(c => h(at(r, c)))) || I.some(c => I.every(r => h(at(r, c)))) || I.every(i => h(at(i, i))) || I.every(i => h(at(i, 4 - i)));
  }
  // paper cards (the host's phone prints them, and checks a card by its number)
  function paperCard(parent) {
    const p = G.paper;
    const box = el('div', 'card', parent);
    box.style.marginTop = '14px';
    el('h2', '', box, `${S().print} (${p.cards.length})`);
    btn(S().print, { kind: 'tint', full: true, icon: 'file' }, box, () => printPaper());
    const row = el('div', 'grid2', box); row.style.marginTop = '12px';
    const i = input({ placeholder: S().cardNo, max: 4, mode: 'numeric' });
    row.appendChild(i);
    btn(S().check, { kind: 'go' }, row, () => { const no = parseInt(i.value, 10); if (no > 0) { send({ k: 'paper', no }); buzz('tap'); } });
  }
  function printPaper() {
    const p = G.paper;
    let area = document.getElementById('pt-print');
    if (area) area.remove();
    area = el('div', 'pt-print', document.body);
    area.id = 'pt-print';
    const style = p.style === '90' ? '90' : '75', cols = style === '90' ? 9 : 5;
    for (const c of p.cards) {
      if (!c || !Array.isArray(c.cells)) continue;
      const box = el('div', 'c', area);
      const t = el('table', '', box); t.dir = 'ltr';
      if (style === '75') { const hr = el('tr', '', t); for (const ch of 'BINGO') el('th', '', hr, ch); }
      for (let r = 0; r < c.cells.length / cols; r++) { const tr = el('tr', '', t); for (let k = 0; k < cols; k++) { const n = c.cells[r * cols + k]; el('td', '', tr, n === 0 ? T('FREE') : n < 0 ? '' : String(n)); } }
      el('small', '', box, T('Card {no} · Blokvane Bingo Night', { no: c.no }));
    }
    addEventListener('afterprint', () => { const a = document.getElementById('pt-print'); if (a) a.remove(); }, { once: true });
    setTimeout(() => { try { window.print(); } catch (e) {} }, 60);
  }

  // ---------- starting a game from this phone (your computer's page here: Party games) ----------
  // Pick a game, its language and where it shows: on the computer, or on one of its TV screens. The computer opens it
  // there with a join code this phone made, and this phone joins it by itself, as the host. Everyone else scans the
  // code on that screen.
  const GAME_LIST = [
    ['trivia', '🧠', 'Trivia', 'Questions on the TV, answers on the phones. Knockout, teams, family mode and more.'],
    ['gir', '❓', 'Guess It Right!', 'Four clues from the Stories of the Prophets, in English and Arabic. Guess on your phone.'],
    ['boowho', '👻', 'Boo Who?', '"Who is most likely to..." Vote for each other. No right answers, just laughs.'],
    ['world', '🌍', 'Where in the World?', 'Drop a pin on the map. The closest pin wins.'],
    ['fakeout', '🎭', 'Fake Out', 'Make up a fake answer, then spot the real one.'],
    ['emoji', '🦁', 'Emoji Riddles', 'Guess the movie, food or saying from a row of emoji.'],
    ['higher', '⚖️', 'Higher or Lower', 'Which one is bigger? Two cards, one tap.'],
    ['bingo', '🎱', 'Bingo Night', 'The TV calls the numbers; every phone is a bingo card.'],
    ['imposter', '🕵️', 'Who\'s the Imposter?', 'Everyone has the same secret word, except one.']
  ];
  const GAME_LANGS = { gir: ['en', 'ar'] };
  async function startScreen(o) {
    css();
    await loadI18n();
    const pc = o.pc, back = o.back || (() => GO.route());
    if (!pc) { codeScreen(); return; }
    const i18 = I();
    let gameId = GAME_LIST.some(g => g[0] === store.get('party:last', '')) ? store.get('party:last', '') : 'trivia';
    let lang = (i18 && i18.ok(store.get('party:lang', ''))) ? store.get('party:lang', '') : (i18 ? i18.pick() : 'en');
    let where = store.get('party:where', 'here');
    document.documentElement.dir = 'ltr'; document.documentElement.lang = 'en';
    const v = view('Party games', { tint: 'sun', night: true, back });
    hero(v.body, 'Start a party game', 'Pick a game and where it shows. Everyone else joins by scanning the code on that screen: no app, no account.', { node: booPic('boo:party', 'float') });
    // 1. the game
    const c1 = el('div', 'card', v.body);
    el('h2', '', c1, '1. Pick a game');
    const ls = el('div', 'pt-games', c1);
    const gameBtns = [];
    for (const [id, e, name, sub] of GAME_LIST) {
      const b = el('button', 'pt-game', ls);
      b.type = 'button';
      b.appendChild(gameIcon(id, e));
      const t = el('span', '', b); el('b', '', t, name); el('small', '', t, sub);
      b.onclick = () => { gameId = id; mark(); buzz('tap'); };
      gameBtns.push([id, b]);
    }
    const mark = () => { for (const [id, b] of gameBtns) b.setAttribute('aria-pressed', String(id === gameId)); fillLangs(); };
    // 2. the language (the whole game: the screen and every phone)
    const c2 = el('div', 'card', v.body);
    el('h2', '', c2, '2. Language');
    el('p', 'muted small', c2, 'The whole game shows in it: the screen and every phone. The host can change it later.');
    const sel = el('select', 'input', c2);
    // (a game written in only some languages offers only those)
    function fillLangs() {
      const only = GAME_LANGS[gameId] || null;
      sel.textContent = '';
      for (const [code, name] of langsFull()) { if (only && !only.includes(code)) continue; const op = el('option', '', sel, name); op.value = code; }
      if (!only && langsMore().length) { const og = el('optgroup', '', sel); og.label = 'More languages (translated by Chrome on a computer)'; for (const [code, name] of langsMore()) { const op = el('option', '', og, name); op.value = code; } }
      if (only && !only.includes(lang)) { const pk0 = i18 ? i18.pick() : 'en'; lang = only.includes(pk0) ? pk0 : only[0]; }
      sel.value = lang;
    }
    sel.onchange = () => { lang = sel.value; };
    mark();
    // 3. where it shows: the computer, or one of its TV screens (the ones that are on right now)
    const c3 = el('div', 'card', v.body);
    el('h2', '', c3, '3. Where should it show?');
    const wl = el('div', 'pt-where', c3);
    const choices = [['here', '💻', pc.name || 'Your computer', 'In its own window. Put that window on a TV or a big screen if you like.', true]];
    const paint = () => {
      wl.textContent = '';
      for (const [id, e, name, sub, on] of choices) {
        const b = el('button', 'pt-game', wl);
        b.type = 'button';
        b.disabled = !on;
        b.setAttribute('aria-pressed', String(id === where));
        el('span', 'e', b, e);
        const t = el('span', '', b); el('b', '', t, name); el('small', '', t, sub);
        b.onclick = () => { where = id; paint(); buzz('tap'); };
      }
    };
    paint();
    const looking = el('p', 'muted small', c3, 'Looking for your TV screens...');
    pc.ask('screens', {}).then(list => {
      looking.remove();
      for (const sc of (Array.isArray(list) ? list : []).slice(0, 20)) choices.push([sc.id, '📺', L.clean(sc.name, 40) || 'A TV screen', sc.on ? 'On right now' + (sc.show ? ': ' + L.clean(sc.show, 40) : '') : 'Off right now', !!sc.on]);
      if (!choices.some(c => c[0] === where && c[4])) where = 'here';
      paint();
    }).catch(() => { looking.textContent = 'TV screens: allow Screen check for this phone on the computer (Connect, then Your phone) to start games on them from here.'; });
    // start
    const go = btn('Start the game', { kind: 'go', huge: true, full: true, icon: 'play' }, v.body, async () => {
      store.set('party:last', gameId); store.set('party:lang', lang); store.set('party:where', where);
      const code = L.shortCode(6);
      const r = await pc.ask('partyOpen', { game: gameId, lang, where, code }, { timeout: 20000 });
      const w = view('Party games', { tint: 'sun', night: true });
      const h = hero(w.body, 'Opening the game...', where === 'here' ? 'It opens on ' + (pc.name || 'your computer') + '. This phone joins by itself in a moment.' : 'It opens on ' + (r && r.where ? r.where : 'the TV') + '. This phone joins by itself in a moment.', { node: booPic('boo:party', 'float') });
      const sp = el('div', 'spin', h); sp.style.margin = '14px auto 0';
      try {
        const link = await byCode(code, 24);
        buzz('ok');
        G.autoJoin = link.s.slice(0, 10);
        location.hash = '#game.' + link.s + '.' + link.tv + (link.lang ? '.' + link.lang : '');
      } catch (e) {
        sp.remove();
        hero((w.body.textContent = '', w.body), 'The game didn\'t answer', 'It may still be opening. Scan the code on the screen with this phone, or type the 6 letters under it.', { sleepy: true });
        btn('Type the code', { kind: 'go', full: true, huge: true }, w.body, () => codeScreen());
        btn('Back', { kind: 'ghost', full: true }, w.body, () => back()).style.marginTop = '10px';
      }
    });
    go.style.marginTop = '6px';
  }

  // ---------- joining with the 6 letters on the TV ----------
  async function codeScreen() {
    css();
    await loadI18n();
    if (G.lang === 'en' && I()) await useLang(I().pick());
    GO.say = T;
    const v = view(T('Join a game'), { tint: 'sun', night: true, back: () => { history.replaceState(null, '', location.pathname); GO.route(); } });
    hero(v.body, T('Type the code on the TV'), T('The 6 letters under the QR code.'), { node: booPic('boo:party', 'float') });
    const card = el('div', 'card', v.body);
    const ci = input({ placeholder: 'ABC DEF', max: 7 });
    ci.autocapitalize = 'characters';
    ci.style.cssText = 'font:800 34px/1 var(--round);letter-spacing:.18em;text-align:center;text-transform:uppercase';
    card.appendChild(ci);
    ci.oninput = () => { const t = ci.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6); const show = t.length > 3 ? t.slice(0, 3) + ' ' + t.slice(3) : t; if (ci.value !== show) ci.value = show; };
    const go = btn(T('Join'), { kind: 'go', huge: true, full: true }, v.body, async () => {
      const c = L.normShort(ci.value, 6);
      if (!c) { toast(T('Type all 6 letters from the TV.'), 'bad'); ci.focus(); return; }
      const sp = el('div', 'spin', card); sp.style.margin = '14px auto 0';
      try { const link = await byCode(c); location.hash = '#game.' + link.s + '.' + link.tv + (link.lang ? '.' + link.lang : ''); }
      finally { sp.remove(); }
    });
    go.style.marginTop = '6px';
    ci.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
    setTimeout(() => { try { ci.focus(); } catch (e) {} }, 300);
  }
  // the game a code belongs to (tries: how many times to ask; a game that is still opening needs a little longer)
  async function byCode(c, tries) {
    const me = await C.newMember();
    let done = false, t = 0, R2 = null;
    const found = new Promise(res => {
      L.codeSecret(c, 'play').then(sec => L.room({ secret: sec, label: 'bvplaycode', me, name: '', role: 'player', open: true, onMsg: m => {
        if (done || m.k !== 'link' || typeof m.s !== 'string' || !/^[A-Za-z0-9_-]{16,64}$/.test(m.s) || !L.okId(m.tv)) return;
        done = true; res({ s: m.s, tv: m.tv, lang: typeof m.lang === 'string' && /^[a-z]{2}$/.test(m.lang) && m.lang !== 'en' ? m.lang : '' });
      } })).then(r => {
        R2 = r;
        let n = 0;
        const ask = () => { if (done) return; if (++n > (tries || 9)) { done = true; res(null); return; } r.send({ k: 'link?' }).catch(() => {}); t = setTimeout(ask, 1500); };
        ask();
      }).catch(() => { done = true; res(null); });
    });
    const link = await found;
    clearTimeout(t);
    if (R2) setTimeout(() => R2.close(), 500);
    if (!link) throw new Error(T('No game with that code right now. Check the letters on the TV.'));
    return link;
  }
})();
