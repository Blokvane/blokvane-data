// Blokvane party games: what the TV (play.js) and the phones (../go/m/party.js) both use. The words people type go
// through a bad-word filter before anyone sees them. The games speak seven languages fully (i18n.js: their own words,
// written for each language); any other language uses Chrome's own built-in translator, on a computer, when it has one
// (nothing is sent anywhere for that).
var BVPLAYC = (() => {
  'use strict';
  const I18N = BVI18N;
  // (whole words and the usual ways around them: 4 for a, 1 or ! for i, 0 for o, 3 for e, $ for s, and repeats)
  const BAD = ['fuck', 'shit', 'bitch', 'cunt', 'dick', 'cock', 'pussy', 'fag', 'faggot', 'nigger', 'nigga', 'slut', 'whore', 'retard', 'bastard', 'asshole', 'arsehole', 'wanker', 'twat', 'prick', 'boob', 'tits', 'penis', 'vagina', 'porn', 'sex', 'rape', 'nazi', 'hitler', 'kill yourself', 'kys',
    'puta', 'mierda', 'pendejo', 'cabron', 'coño', 'joder', 'merde', 'putain', 'salope', 'connard', 'scheisse', 'scheiße', 'arschloch', 'fotze', 'cazzo', 'stronzo', 'vaffanculo', 'caralho', 'porra', 'buceta', 'kurwa', 'blyat', 'suka', 'sharmouta', 'kos', 'zebi', 'kalb',
    // (more in the seven game languages, in their own letters and the way people type them in Latin letters)
    'gilipollas', 'maricon', 'culero', 'chingar', 'chingada', 'verga', 'encule', 'enculer', 'nique', 'batard', 'pute', 'couille',
    'chutiya', 'chutiye', 'bhosdi', 'bhosdike', 'madarchod', 'behenchod', 'bhenchod', 'gandu', 'khanki', 'bokachoda',
    'شرموطة', 'شرموط', 'منيوك', 'قحبة', 'عاهرة', 'خول', 'طيز', 'زب', 'كس',
    'चूतिया', 'चुतिया', 'भोसड़ी', 'भोसडी', 'मादरचोद', 'बहनचोद', 'भेनचोद', 'रंडी', 'गांडू', 'गाँडू', 'लौड़ा', 'लौडा',
    'খানকি', 'মাগী', 'মাগি', 'চুদি', 'চোদা', 'বোকাচোদা', 'বেশ্যা'];
  // (in Chinese there are no spaces between words: these are found anywhere in what was typed)
  const BAD_ZH = ['傻逼', '傻b', '傻比', '操你', '肏', '他妈的', '婊子', '鸡巴', '王八蛋', '贱人', '草泥马', '屌'];
  const norm = s => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[4@]/g, 'a').replace(/[1!|]/g, 'i').replace(/0/g, 'o').replace(/3/g, 'e').replace(/[5$]/g, 's').replace(/7/g, 't').replace(/(.)\1{2,}/g, '$1$1');
  // (letters said twice or more count once, and s p a c e d out letters read as one word)
  const once = x => x.replace(/(.)\1+/g, '$1');
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // (a word ends where letters of any alphabet end: "كس" is caught, the word "كسل" is not)
  const EDGE_A = '(^|[^\\p{L}\\p{M}])', EDGE_B = '($|[^\\p{L}\\p{M}])';
  const WORDS = BAD.map(w => { const a = norm(w), b = once(a); return { a: new RegExp(EDGE_A + esc(a) + EDGE_B, 'u'), b: new RegExp(EDGE_A + esc(b) + EDGE_B, 'u'), flat: /^[a-z ]+$/.test(b) ? b.replace(/\s+/g, '') : '' }; });
  function bad(s) {
    const t = norm(s);
    const forms = [t, once(t)];
    let run = '';
    for (const k of t.split(/[^\p{L}\p{M}]+/u).filter(Boolean).concat([''])) { if ([...k].length === 1) run += k; else { if ([...run].length > 2) forms.push(run, once(run)); run = ''; } }
    const flat = once(t.replace(/[^a-z]+/g, ''));
    if (BAD_ZH.some(w => t.replace(/\s+/g, '').includes(w))) return true;
    return WORDS.some(w => forms.some(f => w.a.test(f) || w.b.test(f)) || (w.flat.length >= 5 && flat.includes(w.flat)));
  }
  const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 40);
  const safe = (v, max, fallback) => { const c = clean(v, max); return c && !bad(c) ? c : (fallback || ''); };
  // a name for the TV: cleaned, and a friendly stand-in when it has a bad word in it
  const NICE = ['Happy Ghost', 'Lucky Star', 'Brave Bear', 'Clever Fox', 'Sunny Day', 'Jolly Panda', 'Quick Cat', 'Kind Owl'];
  const name = v => safe(v, 16) || I18N.t(tLang, NICE[Math.floor(Math.random() * NICE.length)]);

  // ---------- chance ----------
  function rng(seed) { let a = (seed >>> 0) || 1; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function shuffle(a, r = Math.random) { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; }
  const pick = (a, r = Math.random) => a[Math.floor(r() * a.length)];
  // how far apart two places are (km)
  function km(a, b) { const R = 6371, t = x => x * Math.PI / 180; const dl = t(b[0] - a[0]), dp = t(b[1] - a[1]); const h = Math.sin(dp / 2) ** 2 + Math.cos(t(a[1])) * Math.cos(t(b[1])) * Math.sin(dl / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(h))); }
  // close enough, for a typed answer (small typos still count). Works in every alphabet: accents and Arabic vowel
  // marks don't matter, the little words in front ("the", "el", "le", "ال"...) don't either, and in Chinese a short
  // answer must be exact while a longer one may be one character off.
  const ARTICLES = /(^| )(the|a|an|el|la|los|las|un|una|unos|unas|le|les|l|une|des|du|de)(?= )/g;
  function matchForm(s) {
    let x = String(s == null ? '' : s).toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/ß/g, 'ss').normalize('NFKD').replace(/\p{M}/gu, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي').replace(/ـ/g, '')
      .replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
    x = (' ' + x + ' ').replace(ARTICLES, '$1').trim();
    x = x.split(' ').map(w => (w.length > 3 && w.startsWith('ال') ? w.slice(2) : w)).join('');
    return [...x];
  }
  function close(a, b) {
    const x = matchForm(a), y = matchForm(b);
    if (!x.length || !y.length) return false;
    if (x.join('') === y.join('')) return true;
    const d = (s, t) => { const m = s.length, n = t.length; const dp = Array.from({ length: m + 1 }, (_, i) => [i]); for (let j = 1; j <= n; j++) dp[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (s[i - 1] === t[j - 1] ? 0 : 1)); return dp[m][n]; };
    const han = y.some(c => /\p{Script=Han}/u.test(c));
    const allow = han ? (y.length >= 4 ? 1 : 0) : Math.max(1, Math.floor(y.length / 5));
    return d(x, y) <= allow;
  }

  // ---------- looks ----------
  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const SHAPES = ['▲', '◆', '●', '■', '★', '♥'];
  const COLORS = ['#ff5f57', '#3d8bff', '#ffbf3c', '#2fd59a', '#a46bff', '#ff7ac8', '#38d3e6', '#ff9a3c', '#8bd450', '#f5f5f5', '#c084fc', '#fb7185'];
  const TEAMS = [['red', 'Red', '#ff5f57'], ['blue', 'Blue', '#3d8bff'], ['gold', 'Gold', '#ffbf3c'], ['green', 'Green', '#2fd59a']];
  const AVATARS = ['boo:hi', 'boo:laugh', 'boo:cool', 'boo:love', 'boo:wow', 'boo:party', 'boo:hero', 'boo:legend', 'boo:peek', 'boo:mind', 'boo:scary', 'boo:boo'];
  const booUri = id => (typeof BVWATCH_BOO !== 'undefined' && BVWATCH_BOO.get(id)) ? BVWATCH_BOO.uri(id) : '';

  // ---------- the words on the phones (the TV translates them for everyone) ----------
  const STR = {
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
  // The game's language. The seven full languages use their own words (i18n.js, lang/*.js); any other language uses
  // Chrome's built-in translator on a computer: one translator per language, every text once.
  const cache = new Map();
  let translator = null, tLang = 'en';
  const fill = (s, vars) => (vars ? String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m)) : String(s));
  async function useLang(lang) {
    tLang = lang || 'en';
    translator = null;
    if (tLang === 'en') return true;
    if (I18N.FULL.has(tLang)) return I18N.load(tLang, true);
    try {
      const T = self.Translator || (self.ai && self.ai.translator);
      if (!T) return false;
      const ok = T.availability ? await T.availability({ sourceLanguage: 'en', targetLanguage: tLang }) : 'available';
      if (ok === 'unavailable' || ok === 'no') return false;
      translator = T.create ? await T.create({ sourceLanguage: 'en', targetLanguage: tLang }) : await T.createTranslator({ sourceLanguage: 'en', targetLanguage: tLang });
      return true;
    } catch (e) { translator = null; return false; }
  }
  // a line in the game's language, with its {parts} filled in
  async function tr(text, vars) {
    if (text == null || text === '') return text;
    if (tLang === 'en' || I18N.FULL.has(tLang)) return I18N.t(tLang, text, vars);
    const s = fill(text, vars);
    if (!translator) return s;
    const k = tLang + '|' + s;
    if (cache.has(k)) return cache.get(k);
    let out = s;
    try { out = await translator.translate(s); } catch (e) {}
    cache.set(k, out);
    return out;
  }
  // the same, right away (a line Chrome hasn't translated yet stays English for now)
  function f(text, vars) {
    if (tLang === 'en' || I18N.FULL.has(tLang)) return I18N.t(tLang, text, vars);
    const s = fill(text, vars);
    return cache.get(tLang + '|' + s) || s;
  }
  async function trAll(obj) { const out = {}; for (const [k, v] of Object.entries(obj)) out[k] = await tr(v); return out; }
  const RTL = I18N.RTL;

  // ---------- sounds (made here, nothing to download) ----------
  let ac = null, muted = false;
  const mute = on => { muted = !!on; };
  function sfx(kind) {
    if (muted || (window.BVSOUND && !BVSOUND.enabled())) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const notes = { right: [[660, 0], [880, .1], [1320, .2]], wrong: [[300, 0], [220, .16]], tick: [[880, 0]], join: [[520, 0], [780, .09]], win: [[523, 0], [659, .15], [784, .3], [1047, .45]], pop: [[700, 0]], sneeze: [[180, 0], [120, .2]], drum: [[110, 0], [110, .08], [110, .16]] }[kind] || [[600, 0]];
      for (const [f, at] of notes) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = kind === 'wrong' || kind === 'sneeze' ? 'sawtooth' : kind === 'drum' ? 'square' : 'triangle';
        o.frequency.value = f; o.connect(g); g.connect(ac.destination);
        const t = ac.currentTime + at, len = kind === 'tick' ? 0.08 : 0.3;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === 'tick' ? 0.08 : 0.18, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.start(t); o.stop(t + len + 0.05);
      }
    } catch (e) {}
  }
  // out loud in the game's language, with a voice for it (a TV with no voice for that language stays quiet: false)
  function speak(text, lang) {
    const code = lang || 'en';
    if (code === 'en' || I18N.FULL.has(code)) return I18N.speak(text, code);
    try { if (!window.speechSynthesis || !text) return false; const u = new SpeechSynthesisUtterance(text); u.lang = code; u.rate = 0.95; speechSynthesis.cancel(); speechSynthesis.speak(u); return true; } catch (e) { return false; }
  }
  function confetti(n = 220) {
    if (muted) return;
    try { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    const cv = document.createElement('canvas');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60';
    document.body.appendChild(cv);
    const W = cv.width = innerWidth, H = cv.height = innerHeight, g = cv.getContext('2d');
    const bits = Array.from({ length: n }, (_, i) => ({ x: W * Math.random(), y: -20 - Math.random() * H * .5, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, r: 5 + Math.random() * 7, c: COLORS[i % 8], a: Math.random() * 6, va: (Math.random() - .5) * .3 }));
    const t0 = performance.now();
    (function f(t) { g.clearRect(0, 0, W, H); for (const b of bits) { b.vy += .03; b.x += b.vx + Math.sin(t / 300 + b.a); b.y += b.vy; b.a += b.va; g.save(); g.translate(b.x, b.y); g.rotate(b.a); g.fillStyle = b.c; g.fillRect(-b.r, -b.r / 3, b.r * 2, b.r * .66); g.restore(); } if (t - t0 < 5000) requestAnimationFrame(f); else cv.remove(); })(t0);
  }
  return { bad, clean, safe, name, rng, shuffle, pick, km, close, LETTERS, SHAPES, COLORS, TEAMS, AVATARS, booUri, STR, useLang, tr, f, trAll, RTL, sfx, mute, speak, confetti, norm, get lang() { return tLang; } };
})();
