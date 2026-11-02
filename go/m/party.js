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
    needMore: 'This game needs more players', endGame: 'End the game', endSure: 'End the game now? The scores so far count.', keepPlaying: 'Keep playing', hostAgain: 'The host can play again or pick another game.', rolling: 'Rolling...', mine: 'That one is yours', imposterSays: 'Category:', helpers1: 'Each helper works once.'
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
.pt-map{position:relative;border-radius:22px;overflow:hidden;background:radial-gradient(circle at 50% 40%,#21507f,#123355);touch-action:none;height:min(58vh,520px);border:1px solid var(--line);user-select:none;-webkit-user-select:none}
.pt-map svg{width:100%;height:100%;display:block}
.pt-map .land{fill:#6fa36b;stroke:#3c6b44;stroke-width:.35;vector-effect:non-scaling-stroke}
.pt-map .zm{position:absolute;inset-inline-end:10px;bottom:10px;display:flex;flex-direction:column;gap:8px}
.pt-map .zm button{width:48px;height:48px;border-radius:50%;border:0;background:rgba(11,15,23,.75);color:#fff;font:800 24px var(--sans)}
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
@media (prefers-reduced-motion:reduce){.pt-res,.pt-wait .boo{animation:none}}`;
  }

  // ---------- the game, as this phone sees it ----------
  const G = { R: null, s: '', tv: '', me: null, id: '', name: '', av: 'boo:hi', photo: '', joined: false, host: false, color: '', team: '', ready: false, lobby: null, phase: 'join',
    q: null, qAt: 0, answered: false, locked: false, res: null, endRes: null, ranking: null, score: 0, lives: null, out: false, used: new Set(), secret: null, bingo: null, paper: null,
    S: Object.assign({}, STR0), lastHeard: 0, timers: [], stops: [], ui: {}, tries: 0, lang: 'en', tvStrings: null };
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
  const loadI18n = () => GO.script('../play/i18n.js').catch(() => {});
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
  async function memberFor(key) {
    const jwk = tabStore.get(key);
    let me = null;
    try { me = await C.newMember(jwk || undefined); } catch (e) { me = null; }
    if (!me || !jwk) { me = me || await C.newMember(); tabStore.set(key, me.jwk); }
    return me;
  }
  async function start(parts) {
    css();
    await loadI18n();
    const [s, tv, lg] = parts;
    await useLang(I() && I().ok(lg) ? lg : I() ? I().pick() : 'en');
    GO.say = T;
    if (!s || !/^[A-Za-z0-9_-]{16,64}$/.test(s) || !L.okId(tv)) {
      const v = view(T('Party games'), { tint: 'pink' });
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
    const last = tabStore.get('party:in');
    if (last && last.s === s.slice(0, 10) && Date.now() - last.at < 4 * 3600e3 && G.name) return connect();
    if (G.autoJoin && G.autoJoin === s.slice(0, 10) && G.name) { G.autoJoin = ''; return connect(); }
    joinScreen();
  }

  // ---------- joining ----------
  function joinScreen(editing) {
    const v = view(editing ? S().changeName : T('Party games'), { tint: 'pink', back: editing ? () => showLobby() : null });
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
      if (editing) { if (changed) { send({ k: 'join', name, av }); if (photo) sendPhoto(); } showLobby(); return; }
      await connect();
    });
    go.style.marginTop = '6px';
    ni.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
    if (!G.name) setTimeout(() => ni.focus(), 300);
  }
  async function connect() {
    const v = view(gameName(), { tint: 'pink' });
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
      send({ k: 'join', name: G.name, av: G.av });
      if (G.tries === 6) { const p = h.querySelector('p'); if (p) p.textContent = T('Still looking. Is the game open on the TV?'); }
      setTimeout(hi, G.tries < 4 ? 1500 : 3000);
    };
    hi();
    keepAwake();
  }
  function notFound() {
    tabStore.del('party:in');
    const v = view(T('Party games'), { tint: 'pink' });
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
  document.addEventListener('visibilitychange', () => { if (!document.hidden && G.R && G.joined) { send({ k: 'sync' }); keepAwake(); } });
  setInterval(() => {
    if (!G.R || !G.joined) return;
    const quiet = Date.now() - G.lastHeard;
    if (quiet > 20000) send({ k: 'sync' });
    // (the TV went quiet for a minute: say so, once a minute, instead of a screen that just waits)
    if (quiet > 60000 && Date.now() - (G.warned || 0) > 60000) { G.warned = Date.now(); toast(T('Can\'t reach the TV. Is the game still open on it?'), 'bad'); }
  }, 10000);

  // ---------- what the TV says ----------
  function take(m) {
    G.lastHeard = Date.now();
    switch (m.k) {
      case 'you': {
        if (m.id !== G.id) return;
        const first = !G.joined;
        G.joined = true; G.color = typeof m.color === 'string' ? m.color : ''; G.host = !!m.host;
        if (first) { tabStore.set('party:in', { s: G.s.slice(0, 10), at: Date.now() }); if (G.photo) sendPhoto(); buzz('ok'); }
        if (G.phase === 'join') { G.phase = 'lobby'; if (G.lobby) onLobby(G.lobby, true); else showLobby(); }
        return;
      }
      case 'full': if (!G.joined) { G.tries = 99; const v = view(T('Party games'), { tint: 'pink' }); hero(v.body, T('This game is full'), T('It already has 40 players. Ask for a new game on the TV.'), { sleepy: true }); } return;
      case 'lobby': return onLobby(m);
      case 'q': return onQ(m);
      case 'nextq': return onNextQ(m);
      case 'revealq': return onRevealQ(m);
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
    const lg = typeof m.lang === 'string' && /^[a-z]{2}$/.test(m.lang) ? m.lang : 'en';
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
    if (m.phase === 'play') {
      if (was !== 'play') { G.phase = 'play'; G.used.clear(); G.secret = null; G.bingo = null; G.paper = null; G.res = null; G.endRes = null; G.ranking = null; G.endFx = false; G.q = null; showWait(S().look, 'boo:hi'); }
      else updMe();
    } else if (m.phase === 'end') {
      if (was !== 'end' || force) { G.phase = 'end'; G.q = null; stopQ(); showEnd(); }
      else if (prev && prev.host !== m.host) showEnd();
    } else {
      const big = force || was !== 'lobby' || !prev || prev.game !== m.game || prev.host !== m.host || prev.lang !== m.lang || visSig(prev) !== visSig(m) || !!(prev.settings && prev.settings.teams) !== !!(m.settings && m.settings.teams);
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
  function gameView() {
    const v = view(gameName(), { tint: 'pink' });
    // (the host can end a game early: the scores so far count)
    if (G.host && G.phase === 'play') {
      const x = el('button', 'icon-btn', v.top);
      x.type = 'button'; x.title = S().endGame; x.setAttribute('aria-label', S().endGame);
      x.appendChild(GO.icon('x'));
      x.onclick = () => sheet(S().endGame, (sh, close) => {
        el('p', '', sh, S().endSure);
        const row = el('div', 'grid2', sh); row.style.marginTop = '12px';
        btn(S().endGame, { kind: 'bad' }, row, () => { send({ k: 'stop' }); close(); });
        btn(S().keepPlaying, { kind: 'ghost' }, row, () => close());
      });
    }
    meRow(v.body);
    return v;
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

  // the lobby: pick the game (the host), get ready (everyone)
  function showLobby() {
    stopQ();
    G.ui = {};
    const l = G.lobby || {};
    const v = view(l.gname || T('Party games'), { tint: 'pink' });
    meRow(v.body);
    const games = Array.isArray(l.games) ? l.games : [];
    if (!l.game) {
      if (G.host) {
        el('p', 'lead', v.body, T('You\'re the host. Pick a game:'));
        gameList(v.body, games, '');
      } else {
        const w = el('div', 'pt-wait', v.body);
        w.appendChild(booPic('boo:mind'));
        el('h1', '', w, S().picking);
      }
    } else {
      const g = games.find(x => x.id === l.game) || { e: '🎲', name: l.gname || '', sub: '' };
      const gc = el('div', 'pt-game', v.body);
      gc.setAttribute('aria-pressed', 'true');
      el('span', 'e', gc, g.e || '🎲');
      const t = el('span', '', gc); el('b', '', t, g.name); el('small', '', t, g.sub || '');
      gc.style.marginBottom = '14px';
      if (G.host) settingsForm(v.body, l);
      else { const w = el('p', 'pt-note', v.body, S().hostWait); w.style.margin = '6px 0 14px'; }
      if (l.settings && l.settings.teams && (l.schema || []).some(f => f.key === 'teams')) {
        const box = el('div', 'card', v.body);
        el('h2', '', box, S().team);
        const n = Math.min(4, +(l.settings.teamN) || 2);
        G.ui.team = seg(TEAMS.slice(0, n).map(t2 => [t2[0], S()[t2[1]] || t2[1]]), G.team, team => { send({ k: 'team', team }); G.team = team; buzz('tap'); }, box);
      }
      if (MOTION_GAMES.includes(l.game) && motion.needsAsk() && !motion.ok) {
        const box = el('div', 'card', v.body);
        el('p', '', box, S().motionWhy);
        btn(S().motion, { kind: 'tint', full: true, icon: 'phone' }, box, async () => { const ok = await motion.ask(); toast(ok ? '✓' : T('Motion is off. You can still play with taps.'), ok ? 'ok' : 'bad'); if (ok) box.remove(); });
      }
      if (!G.host) G.ui.ready = btn(G.ready ? '✓ ' + S().ready : S().ready, { kind: G.ready ? 'tint' : 'go', huge: true, full: true }, v.body, () => { G.ready = !G.ready; send({ k: 'ready', on: G.ready }); paintReady(); buzz('tap'); });
      if (G.host) {
        const st = btn(S().start, { kind: 'go', huge: true, full: true, icon: 'play' }, v.body, () => { send({ k: 'start' }); buzz('ok'); });
        G.ui.start = st;
        G.ui.need = el('p', 'pt-note', v.body, '');
        const og = btn(S().otherGame, { kind: 'ghost', full: true }, v.body, () => pickGameSheet(games));
        og.style.marginTop = '10px';
      }
    }
    const pc = el('div', 'card', v.body);
    pc.style.marginTop = '16px';
    G.ui.pHead = el('h2', '', pc, S().players);
    G.ui.players = el('div', 'pt-players', pc);
    const ch = btn(S().changeName, { kind: 'ghost', full: true }, v.body, () => joinScreen(true));
    ch.style.marginTop = '12px';
    updLobby();
  }
  function paintReady() {
    const b = G.ui.ready;
    if (!b || !b.isConnected) return;
    b.className = 'btn huge full ' + (G.ready ? 'tint' : 'go');
    b.querySelector('span').textContent = G.ready ? '✓ ' + S().ready : S().ready;
  }
  function updLobby() {
    const l = G.lobby || {};
    paintReady();
    updMe();
    const ps = Array.isArray(l.players) ? l.players : [];
    if (G.ui.pHead) G.ui.pHead.textContent = T('Players ({n})', { n: ps.length });
    if (G.ui.players) {
      G.ui.players.textContent = '';
      for (const p of ps) {
        const c = el('div', 'pt-pl', G.ui.players);
        if (p.id === l.host) el('span', 'cr', c, '👑');
        if (p.ready) el('span', 'ok', c, '✓');
        const im = el('img', '', c); im.src = booUri(AVATARS.includes(p.av) ? p.av : 'boo:hi'); im.alt = '';
        if (p.color) im.style.boxShadow = '0 0 0 3px ' + p.color;
        el('b', '', c, p.id === G.id ? S().you : L.clean(p.name, 16));
      }
    }
    if (G.ui.team && G.team) G.ui.team.set(G.team);
    if (G.ui.need) {
      const min = { imposter: 3, boowho: 2, hotboo: 2, fakeout: 2 }[l.game] || 1;
      G.ui.need.textContent = ps.length < min ? S().needMore + ` (${ps.length}/${min})` : `${ps.filter(p => p.ready).length} / ${ps.length} ✓`;
    }
    // (the settings the host sees follow what the TV kept)
    for (const [key, ctl] of Object.entries(G.ui.sets || {})) {
      const val = l.settings ? l.settings[key] : undefined;
      if (ctl.set) ctl.set(val);
      else if (ctl.type === 'checkbox') ctl.checked = !!val;
      else if (document.activeElement !== ctl && ctl.dataset.dirty !== '1') ctl.value = val == null ? '' : String(val);
    }
  }
  function gameList(parent, games, current) {
    const ls = el('div', 'pt-games', parent);
    for (const g of games) {
      const b = el('button', 'pt-game', ls);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(g.id === current));
      el('span', 'e', b, g.e || '🎲');
      const t = el('span', '', b); el('b', '', t, L.clean(g.name, 40)); el('small', '', t, L.clean(g.sub, 120));
      b.onclick = () => { send({ k: 'game', id: g.id }); buzz('tap'); for (const x of ls.children) x.setAttribute('aria-pressed', String(x === b)); };
    }
    return ls;
  }
  function pickGameSheet(games) {
    sheet(S().pickGame, (sh, close) => { const ls = gameList(sh, games, (G.lobby || {}).game); ls.addEventListener('click', () => setTimeout(close, 150)); });
  }
  // (a setting that only matters for one choice shows only with that choice: "Race to" with the race mode)
  // (when: [key, value] shows it with that value; [key, '!value'] with any other)
  const shown = (f, set) => !Array.isArray(f.when) || (set && (typeof f.when[1] === 'string' && f.when[1][0] === '!' ? set[f.when[0]] !== f.when[1].slice(1) : set[f.when[0]] === f.when[1]));
  const visSig = l => (l && Array.isArray(l.schema) ? l.schema.filter(f => f && shown(f, l.settings)).map(f => f.key + ':' + f.label).join('|') : '');
  function settingsForm(parent, l) {
    const box = el('div', 'card pt-set', parent);
    el('h2', '', box, S().settings);
    G.ui.sets = {};
    for (const f of (l.schema || [])) {
      if (!f || typeof f.key !== 'string' || !shown(f, l.settings)) continue;
      const row = el('div', '', box);
      const cur = l.settings ? l.settings[f.key] : f.default;
      if (f.type === 'toggle') {
        G.ui.sets[f.key] = toggle(L.clean(f.label, 80), cur, on => send({ k: 'set', key: f.key, v: on }), row);
        if (typeof f.desc === 'string' && f.desc) el('p', 'pt-desc', row, L.clean(f.desc, 160));
      } else if (f.type === 'text') {
        el('label', 'lbl', row, L.clean(f.label, 80));
        const t = input({ multi: true, max: 1500, value: cur || '' });
        row.appendChild(t);
        let tm = 0;
        t.oninput = () => { t.dataset.dirty = '1'; clearTimeout(tm); tm = setTimeout(() => { send({ k: 'set', key: f.key, v: t.value }); t.dataset.dirty = ''; }, 700); };
        G.ui.sets[f.key] = t;
      } else if (f.type === 'number') {
        // (type any number, or tap one of the quick ones)
        el('label', 'lbl', row, L.clean(f.label, 80));
        const wrap = el('div', 'pt-num', row);
        const t = el('input', 'input', wrap);
        t.type = 'number'; t.inputMode = 'numeric'; t.step = '1';
        const lo = Number.isFinite(+f.min) ? +f.min : 0, hi = Number.isFinite(+f.max) ? +f.max : 999;
        t.min = String(lo); t.max = String(hi);
        t.value = String(cur != null ? cur : f.default);
        if (f.unit) el('span', 'u', wrap, L.clean(f.unit, 20));
        let tm = 0;
        const push = () => { const n = Math.round(+t.value); if (!Number.isFinite(n) || t.value === '') return; const c = Math.max(lo, Math.min(hi, n)); send({ k: 'set', key: f.key, v: c }); t.dataset.dirty = ''; };
        t.oninput = () => { t.dataset.dirty = '1'; clearTimeout(tm); tm = setTimeout(push, 700); };
        t.onchange = () => { clearTimeout(tm); push(); };
        t.onblur = () => { const n = Math.round(+t.value); t.value = String(Number.isFinite(n) && t.value !== '' ? Math.max(lo, Math.min(hi, n)) : (cur != null ? cur : f.default)); };
        if (Array.isArray(f.quick) && f.quick.length) {
          const qk = el('div', 'chips pt-quick', row);
          for (const n of f.quick.slice(0, 6)) { if (!Number.isFinite(+n)) continue; const c = el('button', 'chip', qk, String(+n)); c.type = 'button'; c.onclick = () => { t.value = String(+n); clearTimeout(tm); push(); buzz('tap'); }; }
        }
        G.ui.sets[f.key] = t;
      } else if (Array.isArray(f.options)) {
        el('label', 'lbl', row, L.clean(f.label, 80));
        // (a choice with a short explanation: one quiet line under the buttons says what the picked one does)
        const descs = f.options.some(o => Array.isArray(o) && o[2]) ? new Map(f.options.map(o => [String(o[0]), o[2] ? L.clean(o[2], 160) : ''])) : null;
        let dEl = null, shownFor = null;
        const showDesc = val => {
          if (!dEl || String(val) === shownFor) return;
          shownFor = String(val);
          const t = descs.get(String(val)) || '';
          dEl.textContent = t; dEl.hidden = !t;
          dEl.style.animation = 'none'; void dEl.offsetWidth; dEl.style.animation = '';
        };
        const ctl = seg(f.options.map(o => [o[0], L.clean(o[1], 40)]), cur, val => { send({ k: 'set', key: f.key, v: val }); buzz('tap'); showDesc(val); }, row);
        if (descs) { dEl = el('p', 'pt-desc', row); showDesc(cur); const set0 = ctl.set; ctl.set = val => { set0(val); showDesc(val); }; }
        if (typeof f.desc === 'string' && f.desc) el('p', 'pt-desc', row, L.clean(f.desc, 160));
        G.ui.sets[f.key] = ctl;
      }
    }
    // the language of the whole game, on the TV and every phone: seven languages fully, and more that Chrome
    // translates when the game runs in Chrome on a computer
    const lr = el('div', '', box);
    el('label', 'lbl', lr, S().lang);
    const sel = el('select', 'input', lr);
    for (const [code, name] of langsFull()) { const o = el('option', '', sel, name); o.value = code; }
    if (langsMore().length) { const og = el('optgroup', '', sel); og.label = T('More languages (translated by Chrome on a computer)'); for (const [code, name] of langsMore()) { const o = el('option', '', og, name); o.value = code; } }
    sel.value = [...langsFull(), ...langsMore()].some(x => x[0] === l.lang) ? l.lang : 'en';
    sel.onchange = () => { send({ k: 'set', key: 'lang', v: sel.value }); buzz('tap'); };
  }

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
    const prompt = L.clean(q.prompt, 300);
    if (prompt && q.kind !== 'pin') { const p = el('div', 'pt-q', b, prompt); if (/^[\p{Extended_Pictographic}‍️\s]+$/u.test(prompt)) p.classList.add('emoji'); }
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
  function choiceQ(b, q) {
    const ex = q.extra || {};
    const opts = (Array.isArray(q.opts) ? q.opts : []).slice(0, 6).map(o => L.clean(o, 140));
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

  // drop a pin on the map (Where in the World?)
  async function pinQ(b, q) {
    const ex = q.extra || {};
    el('div', 'pt-q', b, L.clean(q.prompt, 120) || S().dropPin);
    const box = el('div', 'pt-map', b);
    const wait = el('div', 'spin', box); wait.style.cssText = 'position:absolute;left:50%;top:50%;margin:-13px';
    try { await GO.script('../play/world.js'); } catch (e) { box.textContent = T('The map didn\'t load. Check the internet.'); return; }
    if (G.q !== q || !box.isConnected) return;
    wait.remove();
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    box.appendChild(svg);
    const land = document.createElementNS(NS, 'path'); land.setAttribute('d', BV_WORLD.d); land.setAttribute('class', 'land'); svg.appendChild(land);
    const pin = document.createElementNS(NS, 'g'); pin.style.display = 'none'; svg.appendChild(pin);
    const ring = document.createElementNS(NS, 'circle'); ring.setAttribute('fill', G.color || '#ff6b5e'); ring.setAttribute('stroke', '#fff'); pin.appendChild(ring);
    const us = ex.map === 'us';
    // (the whole area it can show, from the TV: the world, one continent or the US; the view keeps the shape of the
    // box, so the map always fills it)
    const okArea = a => a && Array.isArray(a.full) && a.full.length === 4 && a.full.every(n => isFinite(n)) && Array.isArray(a.start) && a.start.length === 3 && a.start.every(n => isFinite(n));
    const ar = okArea(ex.area) ? ex.area : null;
    const full = ar ? ar.full.map(Number) : us ? [60, 50, 330, 170] : [0, 0, 1000, 500];
    const asp = () => Math.max(0.4, Math.min(2.5, (box.clientHeight || 320) / (box.clientWidth || 320)));
    const w0 = ar ? Math.max(20, Math.min(1000, +ar.start[2])) : us ? 190 : 1000, c0 = ar ? [+ar.start[0], +ar.start[1]] : us ? [238, 146] : [500, 245];
    let vb = [c0[0] - w0 / 2, c0[1] - w0 * asp() / 2, w0, w0 * asp()];
    let at = null;
    const set = () => { svg.setAttribute('viewBox', vb.join(' ')); if (at) { ring.setAttribute('cx', at[0]); ring.setAttribute('cy', at[1]); ring.setAttribute('r', String(vb[2] / 60)); ring.setAttribute('stroke-width', String(vb[2] / 280)); } };
    const clamp = () => {
      const cx = vb[0] + vb[2] / 2, cy = vb[1] + vb[3] / 2;
      const w = Math.max(full[2] / 16, Math.min(ar || us ? full[2] * 1.15 : 1000, vb[2]));
      const h = w * asp();
      const nx = Math.max(full[0], Math.min(full[0] + full[2], cx)), ny = Math.max(full[1], Math.min(full[1] + full[3], cy));
      vb = [nx - w / 2, ny - h / 2, w, h];
    };
    clamp(); set();
    addEventListener('resize', () => { if (box.isConnected) { clamp(); set(); } });
    const toSvg = (x, y, inv) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(inv || svg.getScreenCTM().inverse()); };
    const zoomAt = (k, cx, cy, from, inv) => { const m = toSvg(cx, cy, inv); const o = from || vb; vb = [m.x - (m.x - o[0]) * k, m.y - (m.y - o[1]) * k, o[2] * k, o[3] * k]; clamp(); set(); };
    const pts = new Map();
    let start = null, moved = false, pinch = null;
    box.addEventListener('pointerdown', e => {
      if (e.target.closest('.zm')) return;
      try { box.setPointerCapture(e.pointerId); } catch (er) {}
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) { start = { x: e.clientX, y: e.clientY, vb: vb.slice(), inv: svg.getScreenCTM().inverse() }; moved = false; }
      else if (pts.size === 2) { const [a, c] = [...pts.values()]; pinch = { d: Math.hypot(a.x - c.x, a.y - c.y) || 1, vb: vb.slice(), cx: (a.x + c.x) / 2, cy: (a.y + c.y) / 2, inv: svg.getScreenCTM().inverse() }; moved = true; }
    });
    box.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2 && pinch) { const [a, c] = [...pts.values()]; const d = Math.hypot(a.x - c.x, a.y - c.y) || 1; zoomAt(pinch.d / d, pinch.cx, pinch.cy, pinch.vb, pinch.inv); }
      else if (pts.size === 1 && start) {
        if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 9) moved = true;
        if (moved) { const a = toSvg(start.x, start.y, start.inv), c = toSvg(e.clientX, e.clientY, start.inv); vb = [start.vb[0] - (c.x - a.x), start.vb[1] - (c.y - a.y), start.vb[2], start.vb[3]]; clamp(); set(); }
      }
    });
    const up = e => {
      const tap = pts.size === 1 && !moved && start && e.type === 'pointerup';
      pts.delete(e.pointerId);
      if (pts.size < 2) pinch = null;
      if (pts.size === 1) { const [p] = [...pts.values()]; start = { x: p.x, y: p.y, vb: vb.slice(), inv: svg.getScreenCTM().inverse() }; }
      if (!pts.size) start = null;
      if (tap && !G.answered && !G.locked) { const p = toSvg(e.clientX, e.clientY); at = [Math.max(0, Math.min(1000, p.x)), Math.max(0, Math.min(500, p.y))]; pin.style.display = ''; set(); lock.disabled = false; buzz('tap'); }
    };
    box.addEventListener('pointerup', up);
    box.addEventListener('pointercancel', up);
    box.addEventListener('wheel', e => { e.preventDefault(); zoomAt(e.deltaY > 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY); }, { passive: false });
    // (big + and - for anyone who'd rather not pinch)
    const zm = el('div', 'zm', box);
    for (const [t, k] of [['+', 1 / 1.6], ['−', 1.6]]) { const z = el('button', '', zm, t); z.type = 'button'; z.setAttribute('aria-label', T(t === '+' ? 'Zoom in' : 'Zoom out')); z.onclick = () => { const r = box.getBoundingClientRect(); zoomAt(k, r.left + r.width / 2, r.top + r.height / 2); }; }
    el('p', 'muted small center', b, S().zoom).style.margin = '8px 0';
    const lock = btn(S().lockPin, { kind: 'go', huge: true, full: true, icon: 'check' }, b, () => {
      if (!at) return;
      const lon = Math.round((at[0] / 1000 * 360 - 180) * 1000) / 1000, lat = Math.round((90 - at[1] / 500 * 180) * 1000) / 1000;
      answer([lon, lat]);
    });
    lock.disabled = true;
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
    box.appendChild(booPic(ok ? (m.first ? 'boo:hero' : 'boo:party') : m.out ? 'boo:boo' : some ? 'boo:hi' : 'boo:sad'));
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
      const og = btn(S().otherGame, { kind: 'ghost', full: true }, v.body, () => pickGameSheet((G.lobby || {}).games || []));
      og.style.marginTop = '10px';
    } else el('p', 'pt-note', v.body, S().hostAgain);
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
    const v = view('Party games', { tint: 'pink', back });
    hero(v.body, 'Start a party game', 'Pick a game and where it shows. Everyone else joins by scanning the code on that screen: no app, no account.', { node: booPic('boo:party', 'float') });
    // 1. the game
    const c1 = el('div', 'card', v.body);
    el('h2', '', c1, '1. Pick a game');
    const ls = el('div', 'pt-games', c1);
    const gameBtns = [];
    for (const [id, e, name, sub] of GAME_LIST) {
      const b = el('button', 'pt-game', ls);
      b.type = 'button';
      el('span', 'e', b, e);
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
      const w = view('Party games', { tint: 'pink' });
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
    const v = view(T('Join a game'), { tint: 'pink', back: () => { history.replaceState(null, '', location.pathname); GO.route(); } });
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
