// Blokvane Games: who may host a party game. Each game needs one Blokvane member as its host; everyone else in that
// game plays for free, without signing in.
//
// The host signs in on their phone with their email: Blokvane's server emails a code, the phone sends the code back,
// and from then on the phone can ask the server for a pass. A pass is made for one phone in one game (it names that
// phone's own id in the game), lasts a few hours, and carries the server's signature. The phone shows it to the TV
// with "join"; the TV checks the signature with the server's public key (written below), and that the pass names the
// phone that sent it. So nobody can make a pass of their own, and a pass copied out of a game is no use to anyone
// else. The server gives a pass to everyone signed in: 'free' (the free games: 15 questions, the same ones each time)
// or the full games ('pro', 'guest'); joining a game needs none.
//
// Written the old way on purpose (no arrow functions, no async): smart TVs from 2018 read this very file.
var BVPASS = (function () {
  var te = new TextEncoder();
  // Blokvane's server, and the public half of the key it signs with (https://blokvane.com/v1/public-key). A test on
  // this computer may name a made-up server and key (window.BV_TEST), believed only on this computer's own address.
  var LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname || '');
  var TEST = LOCAL && window.BV_TEST && typeof window.BV_TEST === 'object' ? window.BV_TEST : null;
  var API = TEST && typeof TEST.api === 'string' ? TEST.api.replace(/\/$/, '') : 'https://blokvane.com';
  var SPKI = TEST && typeof TEST.spki === 'string' ? TEST.spki : 'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEkUicMjRqK135ItvE9hQQgws5a+LFrWEFt4F6LAVo4zNIM/9mgPtZiqzogXGKtGBfiDIN35/Af0dZFutEjIpyxA==';
  var DAY = 864e5;
  var subtle = window.crypto && crypto.subtle;
  var norm = function (e) { return String(e || '').trim().toLowerCase(); };
  var unb64 = function (s) { var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  var unb64url = function (s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return unb64(s); };
  var keyP = null;
  function key() {
    if (!keyP) keyP = subtle.importKey('spki', unb64(SPKI), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return keyP;
  }
  // what a pass says, or null when it isn't one (its shape only: ok() below checks the signature)
  function read(pass) {
    try {
      if (typeof pass !== 'string' || pass.length > 1200) return null;
      var parts = pass.split('.');
      if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{86}$/.test(parts[1])) return null;
      var p = JSON.parse(new TextDecoder().decode(unb64url(parts[0])));
      return p && typeof p === 'object' && !Array.isArray(p) ? p : null;
    } catch (e) { return null; }
  }
  // Is this a pass that lets the device `mid` host? Signed by Blokvane's server, made for hosting (never a browser's
  // Pro license), for that very device, and not run out. (A TV's clock can be off by a day: a pass that ended less than
  // two days ago still counts here, since it is no use to any other device anyway.)
  function ok(pass, mid) {
    try {
      var p = read(pass);
      if (!subtle || !p || p.v !== 1 || p.typ !== 'host' || typeof p.mid !== 'string' || !/^[0-9a-f]{16}$/.test(p.mid) || p.mid !== mid) return Promise.resolve(false);
      if (!(p.exp * 1000 > Date.now() - 2 * DAY) || !(p.exp * 1000 < Date.now() + 30 * DAY)) return Promise.resolve(false);
      var parts = pass.split('.');
      return key().then(function (k) {
        return subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, unb64url(parts[1]), te.encode(parts[0]));
      }).then(function (good) { return good === true; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  // one request to Blokvane's server: { ok, status, data } (data.message is in plain words when it's a "no")
  function ask(path, body, session) {
    var headers = { 'Content-Type': 'application/json' };
    if (session) headers.Authorization = 'Bearer ' + session;
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
    return fetch(API + path, { method: 'POST', headers: headers, body: JSON.stringify(body || {}), credentials: 'omit', cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, data: d && typeof d === 'object' ? d : {} }; }, function () { return { ok: false, status: r.status, data: {} }; }); })
      .then(function (x) { clearTimeout(t); return x; }, function () { clearTimeout(t); return { ok: false, status: 0, data: {} }; });
  }
  var OFFLINE = 'Can\'t reach Blokvane right now. Check the internet and try again.';
  // 1. the email: the server sends a code to it. -> { id, poll } or { error }
  function start(email) {
    var e = norm(email);
    if (!e) return Promise.resolve({ error: 'Type your email.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return Promise.resolve({ error: 'That doesn\'t look like an email address.' });
    return ask('/v1/auth/start', { email: e, via: 'ext', purpose: 'login' }).then(function (r) {
      if (r.ok && typeof r.data.id === 'string' && typeof r.data.poll === 'string') return { id: r.data.id, poll: r.data.poll, email: e };
      return { error: r.status ? (r.data.message || 'That didn\'t work. Try again in a minute.') : OFFLINE, code: r.data.error || '' };
    });
  }
  // 2. the code from the email. -> { session, email } or { error }
  function finish(id, poll, code, device) {
    var c = String(code || '').replace(/[^0-9]/g, '');
    if (c.length !== 8) return Promise.resolve({ error: 'Type the 8 numbers from the email.' });
    return ask('/v1/auth/code', { id: id, poll: poll, code: c, device_id: device || undefined }).then(function (r) {
      if (r.ok && typeof r.data.session === 'string') return { session: r.data.session, email: norm(r.data.email) };
      return { error: r.status ? (r.data.message || 'That code is not right. Check the email and try again.') : OFFLINE, code: r.data.error || '' };
    });
  }
  // 3. a pass for this device in one game. -> { pass, exp, plan }, or { error, code } ('no_plan': signed in, but
  //    this email has no Blokvane Pro and no running trial; 'signed_out': sign in again)
  function forGame(session, mid) {
    if (!session) return Promise.resolve({ error: 'Sign in first.', code: 'signed_out' });
    return ask('/v1/games/pass', { mid: mid }, session).then(function (r) {
      if (r.ok && typeof r.data.pass === 'string') return { pass: r.data.pass, exp: +r.data.exp || 0, plan: String(r.data.plan || '') };
      return { error: r.status ? (r.data.message || 'That didn\'t work. Try again in a minute.') : OFFLINE, code: r.status ? (r.data.error || 'error') : 'offline' };
    });
  }
  function signOut(session) { return session ? ask('/v1/auth/logout', {}, session).then(function () { return true; }) : Promise.resolve(true); }
  return { start: start, finish: finish, forGame: forGame, signOut: signOut, ok: ok, read: read, norm: norm, api: API };
})();
