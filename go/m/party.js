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
    helpers: 'Helpers', fifty: 'Remove two', hint: 'Hint', auto: 'Answer it for me', ask: 'Ask everyone', peek: 'Hold to peek', imposter: 'You\'re the imposter!', vote: 'Vote', roll: 'Roll', shake: 'Shake or tap Roll', bingo: 'BINGO!',
    yourTurn: 'Your turn!', pass: 'Pass Boo!', toWho: 'Pass to who?', anyone: 'Anyone', waitTurn: 'Wait for your turn', motion: 'Allow motion', tapsOnly: 'Taps only', team: 'Team', guess: 'Your guess', dropPin: 'Drop your pin', zoom: 'Pinch to zoom, tap to drop the pin',
    lockPin: 'Lock in my pin', giveFake: 'Give me a fake', yourEmoji: 'Your emoji', theAnswer: 'The answer', print: 'Print the paper cards', checkPaper: 'Check a paper card', cardNo: 'Card number', check: 'Check',
    booElse: 'Boo is on someone else\'s phone. Get ready!', holdTip: 'Hold it down to see your word. Let go to hide it.', category: 'Category', word: 'Your secret word', noWord: 'You get no word. Listen, and blend in!',
    marks: 'The numbers mark themselves', tapNums: 'Tap the numbers the TV calls', stop: 'STOP!', tapFast: 'Tap as fast as you can!', taps: 'taps', lang: 'Language', players: 'Players', pickGame: 'Pick a game',
    picking: 'The host is picking a game', timeUp: 'Time\'s up!', theRight: 'The right answer:', yourPlace: 'Your place', of: 'of', first: 'You were the fastest!', youPicked: 'You picked',
    shakeIt: 'Shake', flipIt: 'Flip', tiltIt: 'Tilt', red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow', gold: 'Gold', motionWhy: 'Some games use shaking and tilting your phone.', changeName: 'Change my name or Boo',
    needMore: 'This game needs more players', endGame: 'End the game', endSure: 'End the game now? The scores so far count.', keepPlaying: 'Keep playing', hostAgain: 'The host can play again or pick another game.', rolling: 'Rolling...', mine: 'That one is yours', imposterSays: 'Category:', helpers1: 'Each helper works once.',
    next: 'Next', back: 'Back', stepOf: '{n} of {total}', allSet: 'All set', readyQ: 'Ready to play?', editSet: 'Edit settings', none: 'None', hostBadge: 'Host', readyN: '{n} / {total} ready',
    myLang: 'Your language', sameTv: 'Same as the TV: {lang}', langFollow: 'The questions and answers show on the TV in {lang}. Pick another language to see them on your phone too.',
    langMine: 'Your phone shows each question and its answers in {lang}. The TV stays in {tv}.', removed: 'You\'re out of this game', removedWhy: 'The host took you out of the game. You can join again if you like.',
    joinAgain: 'Join again', hostTools: 'Host tools', showCode: 'Show the join code on the TV', hideCode: 'Hide the join code', codeOn: 'The join code is on the TV. New players scan it to join.',
    makeHost: 'Make host', remove: 'Remove', tapAgain: 'Tap again to be sure', newHost: '{name} is the host now.', tvSize: 'TV size', autoSize: 'Auto', more: 'More', youHost: 'You\'re the host now.',
    leaveQ: 'Leave the game?', leaveWhy: 'Your score stays, and you can come back while the game is on.', leaveHost: 'You\'re the host. If you leave, someone else becomes the host.',
    stay: 'Stay', leave: 'Leave', closedT: 'The game was closed on the TV', thanks: 'Thanks for playing!'
  };
  const AVATARS = ['boo:hi', 'boo:laugh', 'boo:cool', 'boo:love', 'boo:wow', 'boo:party', 'boo:hero', 'boo:legend', 'boo:peek', 'boo:mind', 'boo:scary', 'boo:boo'];
  const ACOL = ['#ff5f57', '#3d8bff', '#ffbf3c', '#2fd59a', '#a46bff', '#ff7ac8'];
  const SHAPES = ['▲', '◆', '●', '■', '★', '♥'];
  const TEAMS = [['red', 'red', '#ff5f57'], ['blue', 'blue', '#3d8bff'], ['gold', 'gold', '#ffbf3c'], ['green', 'green', '#2fd59a']];
  // the languages (loaded with ../play/i18n.js): the seven full ones first, then the ones Chrome translates
  const I = () => window.BVI18N || null;
  const langsFull = () => (I() ? I().LANGS : [['en', 'English']]);
  const langsMore = () => (I() ? I().MORE : []);
  const MOTION_GAMES = ['boosays', 'party'];
  const booUri = id => (window.BVWATCH_BOO && BVWATCH_BOO.get(id)) ? BVWATCH_BOO.uri(id) : '';
  // each game's own icon (the TV's pictures, in ../play/icons: the same ones as on the TV and in Blokvane)
  const ICONS = new Set(['trivia', 'boowho', 'world', 'fakeout', 'hotboo', 'boosays', 'emoji', 'higher', 'party', 'bingo', 'imposter']);
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
.pt-me{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:18px;background:var(--panel);border:1px solid var(--line);margin-bottom:14px}
.pt-num{display:flex;align-items:center;gap:10px}
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
.pt-avs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:10px 0 14px}
.pt-av{aspect-ratio:1;border-radius:20px;border:2px solid var(--line);background:var(--raise);padding:6px;display:grid;place-items:center;transition:transform .12s}
.pt-av[aria-pressed=true]{border-color:var(--tint);background:color-mix(in srgb,var(--tint) 22%,var(--raise));transform:scale(1.05)}
.pt-av img{width:100%;height:100%;object-fit:contain}
.pt-selfie{display:flex;align-items:center;gap:12px}
.pt-selfie img{width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--tint)}
.pt-q{font:800 22px/1.25 var(--round);text-align:center;margin:4px 4px 14px;overflow-wrap:anywhere}
.pt-q.emoji{font-size:54px;line-height:1.15}
.pt-look{font:800 17px/1.3 var(--round);text-align:center;margin:2px 4px 12px;color:var(--dim)}
.pt-ans{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pt-ans.one{grid-template-columns:1fr}
.pt-a{position:relative;min-height:100px;border:0;border-radius:22px;color:#fff;font:800 19px/1.2 var(--round);padding:14px 14px 14px 60px;text-align:start;box-shadow:0 6px 0 rgba(0,0,0,.3);background:var(--c);transition:transform .12s,opacity .25s,filter .25s;overflow-wrap:anywhere}
[dir=rtl] .pt-a{padding:14px 60px 14px 14px}
.pt-a.dark{color:#1d1530}
.pt-a:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.3)}
.pt-a .l{position:absolute;inset-inline-start:12px;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:12px;background:rgba(0,0,0,.2);display:grid;place-items:center;font-size:18px}
.pt-a.big{font-size:44px;padding:14px;text-align:center;justify-content:center}
.pt-a.big .l{top:12px;transform:none;width:28px;height:28px;font-size:13px}
.pt-a.gone{opacity:.14;filter:grayscale(1);pointer-events:none}
.pt-a.dim{opacity:.35;filter:grayscale(.6)}
.pt-a.mine{box-shadow:0 0 0 5px #fff,0 6px 0 rgba(0,0,0,.3);transform:scale(1.02)}
.pt-a .tally{position:absolute;inset-inline-end:10px;top:8px;font:800 14px var(--sans);background:rgba(0,0,0,.35);color:#fff;padding:3px 9px;border-radius:10px}
.pt-a small{display:block;font:600 12px var(--sans);opacity:.85;margin-top:4px}
.pt-timer{height:10px;border-radius:5px;background:var(--raise);overflow:hidden;margin:0 0 14px}
.pt-timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,var(--bad),var(--sun) 30%,var(--ok));transform-origin:left center}
[dir=rtl] .pt-timer i{transform-origin:right center}
.pt-helpers{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}
.pt-helpers button{border:1px solid var(--line);background:var(--raise);color:var(--text);border-radius:14px;min-height:62px;font:700 12.5px/1.15 var(--sans);padding:6px 4px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px}
.pt-helpers button span{font-size:20px}
.pt-helpers button:disabled{opacity:.3}
.pt-note{margin-top:14px;text-align:center;color:var(--dim);font-weight:600}
.pt-hint{margin-top:14px;border-radius:16px;padding:12px 14px;background:color-mix(in srgb,var(--sun) 16%,var(--raise));border:1px solid color-mix(in srgb,var(--sun) 40%,var(--line));font-weight:600}
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
.pt-players{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.pt-pl{position:relative;border:2px solid var(--line);background:var(--raise);border-radius:18px;padding:10px 6px;display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--text);font:700 14px var(--sans);min-width:0}
.pt-pl b{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pt-pl img{width:54px;height:54px;border-radius:50%;object-fit:cover;background:#fff}
.pt-pl .ok{position:absolute;top:6px;inset-inline-end:8px;color:var(--ok);font-weight:900}
.pt-pl .cr{position:absolute;top:2px;inset-inline-start:6px}
.pt-pl[aria-pressed=true]{border-color:var(--tint);background:color-mix(in srgb,var(--tint) 20%,var(--raise))}
button.pt-pl:active{transform:scale(.97)}
.pt-map{position:relative;border-radius:22px;overflow:hidden;background:#0b2043;touch-action:none;height:clamp(300px,46vh,430px);border:1px solid rgba(255,255,255,.12);user-select:none;-webkit-user-select:none;box-shadow:0 14px 30px -18px rgba(0,0,0,.8),inset 0 0 0 1px rgba(255,255,255,.04)}
.pt-map .bvmap{border-radius:inherit}
.pt-mypin{--pw:38px}
.pt-trow{display:flex;align-items:center;gap:10px;margin:0 0 12px}
.pt-trow .pt-timer{flex:1;margin:0}
.pt-trow b{font:700 17px/1 var(--fun,var(--round));color:var(--sun);min-width:24px;text-align:end}
.pt-trow b.low{color:var(--bad)}
.pt-flag{display:block;max-width:150px;max-height:84px;margin:0 auto 8px;border-radius:8px;box-shadow:0 8px 18px -8px rgba(0,0,0,.7),0 0 0 1px rgba(255,255,255,.15)}
.pt-wq{font:700 18px/1.25 var(--fun,var(--round));text-align:center;color:var(--dim);margin:0 6px 4px;overflow-wrap:anywhere}
.pt-drop{font:700 25px/1.15 var(--fun,var(--round));text-align:center;margin:2px 0 12px}
.pt-hints{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:-4px 0 10px}
.pt-hints:empty{display:none}
.pt-hint{display:inline-flex;align-items:center;gap:7px;padding:6px 12px 6px 9px;border-radius:999px;background:rgba(255,201,60,.14);border:1px solid rgba(255,201,60,.45);color:#ffeab0;font:700 14px/1.2 var(--round);animation:pt-pop .45s cubic-bezier(.2,1.4,.4,1)}
.pt-hint i{font-style:normal}
.pt-hint img{height:16px;border-radius:3px}
.btn .pt-lockpin{width:22px;height:29px;display:inline-block;margin-inline-end:8px;vertical-align:middle;filter:drop-shadow(0 3px 4px rgba(0,0,0,.25))}
.btn .pt-lockpin svg{width:100%;height:100%}
.pt-map .zm{position:absolute;inset-inline-end:10px;bottom:10px;display:flex;flex-direction:column;gap:8px;z-index:3}
.pt-map .zm button{width:46px;height:46px;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(18,12,44,.82);color:#fff;font:700 24px/1 var(--fun,var(--round));box-shadow:0 6px 14px -6px rgba(0,0,0,.6);backdrop-filter:blur(4px)}
.pt-map .zm button:active{transform:scale(.94)}
.pt-slider{width:100%;height:56px;accent-color:var(--tint);margin:6px 0}
.pt-colors{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.pt-colors button{min-height:118px;border:0;border-radius:24px;font:800 22px var(--round);color:#fff;box-shadow:0 6px 0 rgba(0,0,0,.3);text-shadow:0 1px 2px rgba(0,0,0,.35)}
.pt-colors button:active{transform:translateY(4px);box-shadow:0 2px 0 rgba(0,0,0,.3)}
.pt-moves{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.pt-moves button{min-height:70px;border:1px solid var(--line);background:var(--raise);color:var(--text);border-radius:16px;font:700 15px var(--sans)}
.pt-tap{width:min(72vw,300px);aspect-ratio:1;border-radius:50%;border:0;margin:10px auto;display:grid;place-items:center;font:900 54px var(--round);color:#fff;background:radial-gradient(circle at 35% 30%,var(--coral2),var(--coral));box-shadow:0 12px 0 rgba(0,0,0,.3);touch-action:manipulation;user-select:none;-webkit-user-select:none}
.pt-tap:active{transform:translateY(6px);box-shadow:0 6px 0 rgba(0,0,0,.3)}
.pt-bar{position:relative;height:80px;border-radius:22px;background:linear-gradient(90deg,var(--bad),var(--sun) 38%,var(--ok) 47%,var(--ok) 53%,var(--sun) 62%,var(--bad));overflow:hidden;margin:10px 0 18px}
.pt-bar i{position:absolute;top:0;bottom:0;width:10px;margin-left:-5px;background:#fff;border-radius:5px;box-shadow:0 0 14px #fff}
.pt-peek{min-height:190px;border-radius:26px;border:2px dashed var(--line);display:grid;place-items:center;text-align:center;padding:20px;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;touch-action:none;margin-top:14px;background:var(--panel)}
.pt-peek.on{border-style:solid;border-color:var(--tint);background:color-mix(in srgb,var(--tint) 14%,var(--panel))}
.pt-peek b{display:block;font:900 36px/1.15 var(--round);margin:6px 0}
.pt-peek .pic{font-size:90px;line-height:1}
.pt-peek small{color:var(--dim);font-size:15px}
.pt-bingo{display:grid;gap:5px;direction:ltr}
.pt-bingo button{aspect-ratio:1;border:0;border-radius:11px;background:var(--raise2);color:var(--text);font:800 18px var(--sans);padding:0;min-width:0}
.pt-bingo.n90 button{font-size:14px;border-radius:8px}
.pt-bingo button.hd{background:transparent;color:var(--sun);font:900 22px var(--round)}
.pt-bingo button.on{background:var(--coral);color:#fff;box-shadow:inset 0 0 0 3px rgba(255,255,255,.45)}
.pt-bingo button.called:not(.on){box-shadow:inset 0 0 0 2px var(--sun)}
.pt-bingo button.blank{background:transparent}
.pt-bingo.big button{font-size:24px}
.pt-bingo.big.n90 button{font-size:18px}
.pt-call{font:900 64px/1 var(--round);text-align:center;color:var(--sun);margin:4px 0 6px}
.pt-games{display:grid;gap:10px}
.pt-game{display:flex;gap:14px;align-items:center;text-align:start;border:1px solid var(--line);background:var(--raise);border-radius:20px;padding:14px 16px;color:var(--text);width:100%}
.pt-game .e{font-size:36px;flex:none;width:46px;text-align:center}
.pt-game b{display:block;font:800 18px var(--round)}
.pt-game small{color:var(--dim);font-size:14px;line-height:1.35}
.pt-game[aria-pressed=true]{border-color:var(--tint);background:color-mix(in srgb,var(--tint) 18%,var(--raise))}
.pt-game:disabled{opacity:.45}
.pt-where{display:grid;gap:10px;margin-top:4px}
.pt-games .pt-game,.pt-where .pt-game{transition:transform .12s}
.pt-game:active{transform:scale(.98)}
.pt-set{display:grid;gap:14px}
.pt-set .seg{flex-wrap:wrap}
.pt-set .seg button{flex:1 0 28%}
.pt-set label.lbl{display:block;color:var(--dim);font-size:15px;font-weight:600;margin-bottom:7px}
.pt-desc{display:flex;gap:8px;align-items:flex-start;margin:8px 2px 0;padding:9px 12px;border-radius:12px;background:color-mix(in srgb,var(--tint) 9%,var(--raise));border-inline-start:3px solid color-mix(in srgb,var(--tint) 65%,transparent);color:var(--dim);font-size:14px;line-height:1.4;animation:pt-fade .28s ease}
.pt-desc::before{content:"💡";font-size:13px;line-height:1.5;flex:none}
@keyframes pt-fade{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}
.pt-list{display:grid;gap:8px}
.pt-list .r{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:16px;background:var(--raise)}
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
.pt-top{gap:10px;padding:2px 0 12px}
.pt-top .pt-home{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:rgba(255,255,255,.07);flex:none;color:#fff}
.pt-top .pt-home svg{width:19px;height:19px}
.pt-top .who h1{font-size:20px}
.pt-chip{display:inline-flex;align-items:center;gap:7px;padding:4px 7px 4px 4px;border-radius:99px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);font:700 13px/1 var(--round);max-width:48%;flex:none}
.pt-chip img{width:26px;height:26px;border-radius:50%;object-fit:cover;background:#fff;flex:none}
.pt-chip b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.pt-chip i{font-style:normal;padding:3px 6px;border-radius:6px;background:var(--sun);color:#2a1d00;font:800 10px/1 var(--round);letter-spacing:.06em;text-transform:uppercase;flex:none}
.pt-more{width:40px;height:40px;border-radius:12px;border:0;background:rgba(255,255,255,.08);color:#fff;display:grid;place-items:center;flex:none}
.pt-more svg{width:22px;height:22px}
/* the host's setup, one step at a time */
.pt-wz{display:flex;flex-direction:column;min-height:calc(100dvh - 92px - var(--safe-t))}
.pt-prog{display:flex;gap:5px;margin:0 0 16px}
.pt-prog i{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.12)}
.pt-prog i.on{background:var(--c)}
.pt-wh{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:0 0 4px}
.pt-wh h1{font-size:28px;line-height:1.1;margin:0}
.pt-wh span{color:var(--dim);font:700 13px var(--round);white-space:nowrap}
.pt-lbl{display:block;margin:16px 2px 8px;color:var(--dim);font:800 12px/1.2 var(--round);letter-spacing:.09em;text-transform:uppercase}
.pt-list2{display:grid;gap:8px;margin-top:10px}
.pt-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:start;padding:11px 14px;border-radius:14px;border:1.5px solid rgba(255,255,255,.08);background:var(--panel);color:var(--text);transition:border-color .15s,background .15s}
.pt-opt b{display:block;font:700 16px/1.2 var(--fun)}
.pt-opt small{display:block;color:var(--dim);font-size:13px;line-height:1.35;margin-top:2px}
.pt-opt .ck{margin-inline-start:auto;flex:none;width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.25);display:grid;place-items:center;font:900 13px/1 var(--round);color:transparent}
.pt-opt[aria-pressed=true]{border-color:var(--sun);background:linear-gradient(180deg,rgba(255,201,60,.14),rgba(255,201,60,.04)),var(--panel)}
.pt-opt[aria-pressed=true] .ck{background:var(--sun);border-color:var(--sun);color:#2a1d00}
.pt-grid{display:grid;gap:8px}
.pt-box{min-height:52px;padding:8px 6px;border-radius:12px;border:1.5px solid rgba(255,255,255,.08);background:var(--panel);color:var(--text);font:700 15px/1.2 var(--fun);display:grid;place-items:center;text-align:center;overflow-wrap:anywhere;transition:border-color .15s,background .15s}
.pt-box.num{font-size:22px;min-height:58px}
.pt-grid.many .pt-box{min-height:46px;font-size:13.5px;padding:6px 4px}
.pt-box[aria-pressed=true]{border-color:var(--sun);background:linear-gradient(180deg,rgba(255,201,60,.17),rgba(255,201,60,.05)),var(--panel);color:#fff}
.pt-info{display:flex;gap:10px;align-items:flex-start;margin:10px 0 0;padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);color:var(--dim);font-size:13.5px;line-height:1.4}
.pt-info::before{content:"i";flex:none;width:18px;height:18px;border-radius:50%;background:var(--sun);color:#2a1d00;font:900 12px/18px var(--round);text-align:center;margin-top:1px}
.pt-info[hidden]{display:none}
.pt-tg{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08);margin-top:10px;cursor:pointer}
.pt-tg b{display:block;font:700 16px/1.2 var(--fun)}
.pt-tg small{display:block;color:var(--dim);font-size:13px;margin-top:3px;line-height:1.35}
.pt-tg input{appearance:none;-webkit-appearance:none;margin-inline-start:auto;width:50px;height:30px;border-radius:15px;background:rgba(255,255,255,.16);position:relative;flex:none;transition:background .15s}
.pt-tg input::after{content:"";position:absolute;top:3px;inset-inline-start:3px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .15s}
.pt-tg input:checked{background:var(--sun)}
.pt-tg input:checked::after{transform:translateX(20px)}
[dir=rtl] .pt-tg input:checked::after{transform:translateX(-20px)}
.pt-step{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px;border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08)}
.pt-step button{width:50px;height:46px;border-radius:11px;border:0;background:var(--raise);color:#fff;font:700 24px/1 var(--round);touch-action:manipulation;user-select:none;-webkit-user-select:none}
.pt-step button:active{background:var(--raise2)}
.pt-step span{display:flex;align-items:baseline;gap:6px}
.pt-step b{font:700 26px/1 var(--fun)}
.pt-step small{color:var(--dim);font-size:14px}
.pt-text{min-height:120px;font-size:16px}
.pt-langrow{display:flex;align-items:center;gap:12px;margin:10px 0 0;padding:6px 6px 6px 14px;border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08)}
[dir=rtl] .pt-langrow{padding:6px 14px 6px 6px}
.pt-langrow>span:first-child{font:700 15px var(--fun);white-space:nowrap}
.pt-langrow .pt-sel{flex:1;min-width:0}
.pt-sel{position:relative;display:block}
.pt-sel select{appearance:none;-webkit-appearance:none;width:100%;min-height:46px;padding:0 40px 0 12px;border-radius:11px;border:1.5px solid rgba(255,255,255,.1);background:var(--raise);color:var(--text);font:700 15px var(--fun)}
[dir=rtl] .pt-sel select{padding:0 12px 0 40px}
.pt-sel::after{content:"";position:absolute;inset-inline-end:16px;top:50%;width:8px;height:8px;border:solid var(--dim);border-width:0 2px 2px 0;transform:translateY(-70%) rotate(45deg);pointer-events:none}
.pt-nav{position:sticky;bottom:0;display:flex;gap:10px;padding:14px 0 calc(4px + var(--safe-b));margin-top:auto;background:linear-gradient(180deg,transparent,rgba(20,13,46,.92) 32%)}
.pt-nav .bk{flex:0 0 31%;min-height:54px;border-radius:12px;border:0;background:var(--dk);color:#fff;font:700 16px var(--fun)}
.pt-nav .bk.sp{opacity:.5}
.pt-nav .nx{flex:1;min-height:54px;border:0;background:var(--sun);color:#2a1d00;font:700 17px var(--fun);clip-path:polygon(16px 0,calc(100% - 16px) 0,100% 50%,calc(100% - 16px) 100%,16px 100%,0 50%)}
.pt-nav .nx:active,.pt-nav .bk:active{transform:scale(.98)}
/* the last step: everything at a glance, then Start */
.pt-ready{text-align:center;margin:6px 0 14px}
.pt-ready small{display:block;color:var(--sun);font:800 12px var(--round);letter-spacing:.12em;text-transform:uppercase}
.pt-ready h1{font-size:30px;line-height:1.15;margin:4px 0 0}
.pt-sum{border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08);padding:2px 14px}
.pt-sum div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,.07);font-size:14px}
.pt-sum div:last-child{border-bottom:0}
.pt-sum span{color:var(--dim);flex:none}
.pt-sum b{font:700 14px/1.3 var(--fun);text-align:end;min-width:0}
.pt-edit{display:block;margin:10px auto 0;padding:6px 10px;border:0;background:none;color:var(--lav);font:700 14px var(--fun);text-decoration:underline;text-underline-offset:3px}
.pt-ph{display:flex;align-items:baseline;justify-content:space-between;gap:10px;margin:18px 2px 10px}
.pt-ph h2{font-size:18px;margin:0}
.pt-ph span{color:var(--ok);font:700 13px var(--round);white-space:nowrap}
.pt-pl small.lg{position:absolute;top:6px;inset-inline-start:6px;padding:2px 5px;border-radius:6px;background:var(--violet);color:#fff;font:800 10px/1 var(--round)}
.pt-pl .cr~small.lg{top:auto;bottom:6px}
.pt-tv{display:flex;align-items:center;gap:10px;margin:14px 0 0;padding:8px 8px 8px 14px;border-radius:14px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08)}
[dir=rtl] .pt-tv{padding:8px 14px 8px 8px}
.pt-tv>span:first-child{font:700 15px var(--fun);flex:1;min-width:0}
.pt-tv small{color:var(--dim);font:700 12px var(--round)}
.pt-tvb{display:flex;gap:6px}
.pt-tvb button{min-width:46px;height:40px;padding:0 10px;border-radius:10px;border:0;background:var(--raise);color:#fff;font:800 14px var(--round)}
.pt-start{position:relative;display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:64px;margin-top:16px;border:3px solid transparent;border-radius:18px;color:#2a1d00;font:700 20px var(--fun);
  background:linear-gradient(var(--sun),var(--sun)) padding-box,linear-gradient(90deg,#ff5f7e,#b46bff 30%,#4f8bff 55%,#2fd59a 80%,#ffc93c) border-box;box-shadow:0 10px 30px -10px rgba(255,201,60,.6)}
.pt-start:active{transform:scale(.98)}
.pt-start svg{width:22px;height:22px;flex:none}
.pt-startbar{position:sticky;bottom:0;z-index:5;padding:12px 0 calc(4px + var(--safe-b));margin-top:4px;background:linear-gradient(180deg,transparent,rgba(20,13,46,.94) 30%)}
.pt-startbar .pt-start{margin-top:0}
.pt-players.many{grid-template-columns:repeat(5,1fr);gap:6px}
.pt-players.many .pt-pl{padding:7px 2px 6px;border-radius:12px;gap:4px;font-size:11px;border-width:1.5px}
.pt-players.many .pt-pl img{width:34px;height:34px}
.pt-players.many .pt-pl .cr{font-size:11px;top:1px;inset-inline-start:3px}
.pt-players.many .pt-pl .ok{font-size:11px;top:2px;inset-inline-end:4px}
.pt-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}
.pt-pair.one{grid-template-columns:1fr}
.pt-dk{min-height:52px;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:var(--dk);color:#fff;font:700 15px/1.2 var(--fun);padding:8px 10px}
.pt-dk:active{transform:scale(.98)}
.pt-dk.bad{color:#ff8f8a}
/* the players' lobby: the game, your language, Ready */
.pt-gcard{display:flex;gap:14px;align-items:center;padding:14px 16px;border-radius:16px;background:var(--panel);border:1.5px solid rgba(255,255,255,.08);margin-bottom:12px}
.pt-gcard .e{font-size:36px;flex:none;width:46px;text-align:center}
.pt-gcard b{display:block;font:700 19px var(--fun)}
.pt-gcard small{color:var(--dim);font-size:14px;line-height:1.35}
.pt-lang{padding:14px}
.pt-lang h2{font-size:17px;margin:0 0 10px}
.pt-adm{display:grid;gap:8px}
.pt-adm .r{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:var(--panel);border:1px solid rgba(255,255,255,.07)}
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
  const ownLang = l => (!G.host && l && l.mlang && G.plang && G.plang !== tvLangOf(l) && I() && I().FULL.has(G.plang) ? G.plang : '');
  const effLang = l => ownLang(l) || tvLangOf(l);
  const langName = c => ([...langsFull(), ...langsMore()].find(x => x[0] === c) || [c, c])[1];
  const numFmt = n => { try { return Number(n).toLocaleString(G.lang + '-u-nu-latn'); } catch (e) { return String(n); } };
  const send = m => (G.R ? G.R.send(m).catch(() => {}) : Promise.resolve());
  const gameName = () => (G.lobby && G.lobby.gname) || T('Party games');
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
    pick.onclick = () => {
      const f = document.createElement('input');
      f.type = 'file'; f.accept = 'image/*'; f.setAttribute('capture', 'user');
      f.onchange = async () => {
        const file = f.files && f.files[0];
        if (!file) return;
        try { photo = await L.shrink(file, 200, 0.72); if (photo.length > 58000) photo = await L.shrink(file, 140, 0.6); sImg.src = photo; selfieRow.hidden = false; mark(); }
        catch (e) { toast(T('That picture didn\'t work. Try another.'), 'bad'); }
      };
      f.click();
    };
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
      case 'end': G.ranking = Array.isArray(m.ranking) ? m.ranking.slice(0, 10) : null; if (G.phase === 'end') showEnd(); return;
      case 'helped': return onHelped(m);
      case 'secret': if (m.boxed) { G.secret = m; if (G.phase === 'play' && G.q && (G.q.kind === 'wait' || !G.q.who.includes(G.id))) showQ(); } return;
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
      if (was !== 'play') { G.phase = 'play'; G.used.clear(); G.secret = null; G.bingo = null; G.paper = null; G.res = null; G.endRes = null; G.ranking = null; G.endFx = false; G.q = null; showWait(S().look, 'boo:hi'); }
      else updMe();
    } else if (m.phase === 'end') {
      if (was !== 'end' || force) { G.phase = 'end'; G.q = null; stopQ(); showEnd(); }
      else if (prev && prev.host !== m.host) showEnd();
    } else {
      const big = force || was !== 'lobby' || !prev || prev.game !== m.game || prev.host !== m.host || prev.lang !== m.lang || visSig(prev) !== visSig(m) || teamsOn(prev) !== teamsOn(m) || !!prev.mlang !== !!m.mlang;
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
    // (behind the ⋯: the host's tools, or your own language)
    const l = G.lobby || {};
    if (G.host || l.mlang) {
      const x = el('button', 'pt-more', v.top);
      x.type = 'button'; x.title = S().more; x.setAttribute('aria-label', G.host ? S().hostTools : S().myLang);
      x.appendChild(GO.icon('dots'));
      x.onclick = () => toolsSheet();
    }
    meRow(v.body);
    return v;
  }
  // the host's tools during a game: let more people join (the join code on the TV again), the players (make one the
  // host, or take one out), the TV's size, end the game. A player: their own language.
  function toolsSheet() {
    const l = G.lobby || {};
    sheet(G.host ? S().hostTools : S().myLang, (sh, close) => {
      if (G.host) {
        const on = !!l.joinOn;
        btn(on ? S().hideCode : S().showCode, { kind: on ? 'ghost' : 'go', full: true, icon: 'phone' }, sh, () => { send({ k: 'showjoin', on: !on }); if (!on) toast(S().codeOn, 'ok'); close(); });
        el('label', 'pt-lbl', sh, S().players);
        const adm = el('div', 'pt-adm', sh);
        for (const p of Array.isArray(l.players) ? l.players : []) {
          const r = el('div', 'r', adm);
          const im = el('img', '', r); im.src = booUri(AVATARS.includes(p.av) ? p.av : 'boo:hi'); im.alt = '';
          el('b', '', r, p.id === G.id ? S().you : L.clean(p.name, 16));
          if (p.id === l.host) { el('i', '', r, S().hostBadge); continue; }
          const mk = el('button', '', r); mk.type = 'button'; el('span', '', mk, '👑 ' + S().makeHost);
          twice(mk, () => { send({ k: 'makehost', id: p.id }); close(); toast(T(STR0.newHost, { name: L.clean(p.name, 16) }), 'ok'); });
          const rm = el('button', 'bad', r); rm.type = 'button'; el('span', '', rm, S().remove);
          twice(rm, () => { send({ k: 'kick', id: p.id }); r.remove(); });
        }
        tvSizeRow(sh, l);
      }
      if (l.mlang && !G.host) langCard(sh, l, close);
      if (G.host && G.phase === 'play') {
        const eb = el('button', 'pt-dk bad', sh); eb.type = 'button'; el('span', '', eb, S().endGame);
        eb.style.cssText = 'width:100%;margin-top:16px';
        twice(eb, () => { send({ k: 'stop' }); close(); });
      }
    });
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
    const im = el('img', '', r); im.src = G.photo || booUri(G.av) || booUri('boo:hi'); im.alt = '';
    if (G.color) im.style.boxShadow = '0 0 0 3px ' + G.color;
    el('b', '', r, G.name);
    const tm = TEAMS.find(t => t[0] === G.team);
    if (tm && G.lobby && G.lobby.settings && G.lobby.settings.teams) { const p = el('span', 'pill', r, S()[tm[1]] || tm[1]); p.style.background = tm[2]; }
    const hearts = el('span', 'pt-hearts', r);
    const sc = el('span', 'pt-score', r);
    G.ui.me = { sc, hearts };
    updMe();
  }
  function usesLives() { const l = G.lobby || {}; return l.game === 'hotboo' || (l.game === 'trivia' && l.settings && l.settings.mode === 'lives'); }
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
    if (teamsOn(l)) {
      const box = el('div', 'card', v.body);
      el('h2', '', box, S().team);
      const n = Math.min(4, +(l.settings && l.settings.teamN) || 2);
      G.ui.team = seg(TEAMS.slice(0, n).map(t2 => [t2[0], S()[t2[1]] || t2[1]]), G.team, team => { send({ k: 'team', team }); G.team = team; buzz('tap'); }, box);
    }
    if (MOTION_GAMES.includes(l.game) && motion.needsAsk() && !motion.ok) {
      const box = el('div', 'card', v.body);
      el('p', '', box, S().motionWhy);
      btn(S().motion, { kind: 'tint', full: true, icon: 'phone' }, box, async () => { const ok = await motion.ask(); toast(ok ? '✓' : T('Motion is off. You can still play with taps.'), ok ? 'ok' : 'bad'); if (ok) box.remove(); });
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
    const min = { imposter: 3, boowho: 2, hotboo: 2, fakeout: 2 }[l.game] || 1;
    if (admin && ps.length < min) el('p', 'pt-note', box, S().needMore + ` (${ps.length}/${min})`);
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
    for (const [code, nm] of langsFull()) { if (code === tv) continue; const o = el('option', '', sel, nm); o.value = code; }
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
    for (const [code, name] of langsFull()) { const o = el('option', '', sel, name); o.value = code; }
    if (langsMore().length) { const og = el('optgroup', '', sel); og.label = T('More languages (translated by Chrome on a computer)'); for (const [code, name] of langsMore()) { const o = el('option', '', og, name); o.value = code; } }
    sel.value = [...langsFull(), ...langsMore()].some(x => x[0] === l.lang) ? l.lang : 'en';
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
      const row = el('div', 'pt-step', parent);
      const minus = el('button', '', row, '−'); minus.type = 'button'; minus.setAttribute('aria-label', '−');
      const mid = el('span', '', row); const vb = el('b', '', mid, String(val)); if (f.unit) el('small', '', mid, L.clean(f.unit, 20));
      const plus = el('button', '', row, '+'); plus.type = 'button'; plus.setAttribute('aria-label', '+');
      let tm = 0;
      const step = d => { const nv = Math.max(lo, Math.min(hi, val + d)); if (nv === val) return; val = nv; vb.textContent = String(val); clearTimeout(tm); tm = setTimeout(() => send({ k: 'set', key: f.key, v: val }), 400); buzz('tap'); };
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
  const shown = (f, set) => !f || !Array.isArray(f.when) || (Array.isArray(f.when[0]) ? f.when.every(c => cond(c, set)) : cond(f.when, set));
  const visSig = l => (l && Array.isArray(l.schema) ? l.schema.filter(f => f && shown(f, l.settings)).map(f => f.key + ':' + f.label).join('|') : '');

  // a question
  function showQ() {
    stopQ();
    const q = G.q;
    if (!q) return showWait();
    if (G.bingo) return showBingo();
    const ex = q.extra || {};
    const inIt = q.who.includes(G.id);
    const imp = G.secret && (G.lobby || {}).game === 'imposter';
    if (!inIt || q.kind === 'wait') {
      const v = showWait(q.kind === 'wait' ? (L.clean(q.prompt, 160) || S().look) : ex.hot ? S().booElse : G.out ? S().out : S().look, ex.hot ? 'boo:peek' : G.out ? 'boo:sad' : ex.peek ? 'boo:peek' : 'boo:hi');
      if (imp) peekBox(v.body);
      return;
    }
    const v = gameView();
    const b = v.body;
    if (q.sec > 0 && !ex.hot) timerBar(b, q.sec);
    if (ex.hot) { const h = el('div', 'pill warn', b, '🤧 ' + S().yourTurn); h.style.cssText = 'display:block;text-align:center;font-size:18px;margin:0 auto 12px;width:max-content'; buzz('long'); }
    // (Trivia: the question is only on the TV, so everyone looks up and the phone has the answers; a player who picked
    // another language gets the question and its answers here, in theirs)
    const mine = trOf(q);
    const prompt = L.clean(mine && mine.p ? mine.p : q.prompt, 300);
    if (prompt && q.kind !== 'pin') { const p = el('div', 'pt-q', b, prompt); if (/^[\p{Extended_Pictographic}‍️\s]+$/u.test(prompt)) p.classList.add('emoji'); }
    else if (ex.tv && mine && mine.q && q.kind !== 'pin') el('div', 'pt-q', b, L.clean(mine.q, 300));
    else if (ex.tv && q.kind !== 'pin') el('div', 'pt-look', b, '📺 ' + S().look);
    G.ui.body = b;
    switch (q.kind) {
      case 'choice': choiceQ(b, q); break;
      case 'players': playersQ(b, q); break;
      case 'text': textQ(b, q); break;
      case 'number': numberQ(b, q); break;
      case 'pin': pinQ(b, q); break;
      case 'move': moveQ(b, q); break;
      case 'roll': rollQ(b, q); break;
      case 'tap': tapQ(b, q); break;
      case 'bar': barQ(b, q); break;
      case 'emojimake': emojiMakeQ(b, q); break;
      default: el('p', 'pt-note', b, S().look);
    }
    if (imp) peekBox(b);
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
      for (const x of G.ui.body.querySelectorAll('input, textarea, .pt-colors button, .pt-moves button, .btn.go')) x.disabled = true;
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
      for (const [h, e] of [['fifty', '✂️'], ['hint', '💡'], ['auto', '🪄'], ['ask', '👥']]) {
        const x = el('button', '', hp);
        G.ui.help[h] = x;
        x.type = 'button';
        el('span', '', x, e);
        x.append(S()[h]);
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
      if (!/\p{Extended_Pictographic}/u.test(e)) { toast(S().yourEmoji + '?', 'bad'); e1.focus(); return; }
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

  // Boo Says: shake, flip, tilt or tap a color
  const motion = {
    ok: false, seen: false, on: null, listening: false,
    needsAsk: () => !!((window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') || (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function')),
    async ask() {
      try {
        const asks = [];
        if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') asks.push(DeviceMotionEvent.requestPermission());
        if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') asks.push(DeviceOrientationEvent.requestPermission());
        const r = await Promise.all(asks);
        motion.ok = r.every(x => x === 'granted');
      } catch (e) { motion.ok = false; }
      if (motion.ok) motion.listen();
      return motion.ok;
    },
    listen() {
      if (motion.listening) return;
      motion.listening = true;
      addEventListener('devicemotion', e => {
        const a = e.accelerationIncludingGravity;
        if (!a || a.x == null) return;
        motion.seen = true;
        const b = e.acceleration;
        const lin = b && b.x != null ? Math.hypot(b.x, b.y, b.z) : Math.abs(Math.hypot(a.x, a.y, a.z) - 9.81);
        if (motion.on) motion.on('m', { lin, z: a.z });
      });
      addEventListener('deviceorientation', e => { if (e.beta == null) return; motion.seen = true; if (motion.on) motion.on('o', { beta: e.beta, gamma: e.gamma }); });
    },
    // the first move this phone makes: 'shake', 'flip' or 'tilt'
    watch(cb, only) {
      const t0 = performance.now();
      let z0 = null, b0 = null, g0 = null, peaks = 0, lastPeak = 0, tiltT = 0, done = false;
      const fire = k => { if (done) return; if (only && k !== only) { tiltT = 0; return; } done = true; clearTimeout(tiltT); motion.on = null; cb(k); };
      motion.on = (kind, d) => {
        const t = performance.now();
        if (kind === 'm') {
          if (z0 == null || t - t0 < 250) { z0 = d.z; return; }
          if (d.lin > 15 && t - lastPeak > 80) { peaks++; lastPeak = t; if (peaks >= 3) return fire('shake'); }
          if (Math.abs(z0) > 6 && Math.sign(d.z) !== Math.sign(z0) && Math.abs(d.z) > 6) return fire('flip');
        } else {
          if (b0 == null || t - t0 < 250) { b0 = d.beta; g0 = d.gamma; return; }
          const db = Math.abs(d.beta - b0), dg = Math.abs(d.gamma - g0);
          // (a flip passes through a tilt on the way: a tilt only counts if it isn't a flip a moment later)
          if (!tiltT && ((db > 35 && db < 140) || (dg > 35 && dg < 140))) tiltT = setTimeout(() => fire('tilt'), 450);
        }
      };
      return () => { done = true; clearTimeout(tiltT); motion.on = null; };
    }
  };
  if (!motion.needsAsk()) motion.listen();
  function moveQ(b, q) {
    const ex = q.extra || {};
    const grid = el('div', 'pt-colors', b);
    for (const [id, col, word] of [['tap:red', '#ff5f57', 'red'], ['tap:blue', '#3d8bff', 'blue'], ['tap:green', '#2fd59a', 'green'], ['tap:yellow', '#ffbf3c', 'yellow']]) {
      const x = el('button', '', grid, S()[word]);
      x.type = 'button'; x.style.background = col;
      if (word === 'yellow' || word === 'green') x.style.color = '#1d1530';
      x.onclick = () => { if (answer(id, S()[word])) { x.style.boxShadow = '0 0 0 5px #fff'; } };
    }
    if (ex.taps) return;
    const moves = [['shake', '📳', 'shakeIt'], ['flip', '🔄', 'flipIt'], ['tilt', '↗️', 'tiltIt']];
    // (phones without motion, or where it's off, get the moves as buttons)
    if (!motion.seen) {
      const mv = el('div', 'pt-moves', b);
      for (const [id, e, word] of moves) { const x = el('button', '', mv, e + ' ' + S()[word]); x.type = 'button'; x.onclick = () => answer(id, S()[word]); }
    }
    G.stops.push(motion.watch(k => { const w = moves.find(m => m[0] === k); answer(k, w ? w[1] + ' ' + S()[w[2]] : k); }));
  }
  function rollQ(b, q) {
    void q;
    const x = el('button', 'pt-tap', b, '🎲');
    x.type = 'button';
    el('p', 'pt-note', b, S().shake);
    const go = () => { if (answer('roll')) { x.textContent = '⏳'; el('p', 'pt-note', b, S().rolling); } };
    x.onclick = go;
    G.stops.push(motion.watch(() => go(), 'shake'));
  }
  function tapQ(b, q) {
    let n = 0;
    el('p', 'pt-note', b, S().tapFast);
    const x = el('button', 'pt-tap', b, '0');
    x.type = 'button';
    x.addEventListener('pointerdown', e => { e.preventDefault(); if (G.answered || G.locked) return; n++; x.textContent = String(n); if (n % 10 === 0) buzz('tap'); });
    // (the count goes in just before time's up)
    after(Math.max(600, (q.sec || 10) * 1000 - 450), () => { answer(n, T('{n} taps', { n })); });
  }
  function barQ(b, q) {
    void q;
    const bar = el('div', 'pt-bar', b);
    const mk = el('i', '', bar);
    let pos = 0, stopped = false;
    const t0 = performance.now();
    (function f(t) { if (stopped || !bar.isConnected) return; const k = (t - t0) / 1000; pos = (Math.sin(k * (2.4 + k * 0.35)) + 1) / 2; mk.style.left = (pos * 100) + '%'; requestAnimationFrame(f); })(t0);
    const go = btn(S().stop, { kind: 'go', huge: true, full: true }, b, () => { if (stopped) return; stopped = true; answer(Math.round(pos * 1000) / 1000, Math.round(100 - Math.abs(pos - 0.5) * 200) + '%'); });
    go.style.minHeight = '96px';
    G.stops.push(() => { stopped = true; });
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

  // a result
  function showRes(m) {
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
    ['boowho', '👻', 'Boo Who?', '"Who is most likely to..." Vote for each other. No right answers, just laughs.'],
    ['world', '🌍', 'Where in the World?', 'Drop a pin on the map. The closest pin wins.'],
    ['fakeout', '🎭', 'Fake Out', 'Make up a fake answer, then spot the real one.'],
    ['hotboo', '🤧', 'Hot Boo', 'Pass Boo on before he sneezes on you.'],
    ['boosays', '🙋', 'Boo Says', 'Simon Says with your phone: shake it, flip it, tap it.'],
    ['emoji', '🦁', 'Emoji Riddles', 'Guess the movie, food or saying from a row of emoji.'],
    ['higher', '⚖️', 'Higher or Lower', 'Which one is bigger? Two cards, one tap.'],
    ['party', '🏚️', 'Boo Party', 'A board game around a haunted house, with mini games.'],
    ['bingo', '🎱', 'Bingo Night', 'The TV calls the numbers; every phone is a bingo card.'],
    ['imposter', '🕵️', 'Who\'s the Imposter?', 'Everyone has the same secret word, except one.']
  ];
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
    const mark = () => { for (const [id, b] of gameBtns) b.setAttribute('aria-pressed', String(id === gameId)); };
    mark();
    // 2. the language (the whole game: the screen and every phone)
    const c2 = el('div', 'card', v.body);
    el('h2', '', c2, '2. Language');
    el('p', 'muted small', c2, 'The whole game shows in it: the screen and every phone. The host can change it later.');
    const sel = el('select', 'input', c2);
    for (const [code, name] of langsFull()) { const op = el('option', '', sel, name); op.value = code; }
    if (langsMore().length) { const og = el('optgroup', '', sel); og.label = 'More languages (translated by Chrome on a computer)'; for (const [code, name] of langsMore()) { const op = el('option', '', og, name); op.value = code; } }
    sel.value = lang;
    sel.onchange = () => { lang = sel.value; };
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
