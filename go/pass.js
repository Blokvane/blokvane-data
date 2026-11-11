// Blokvane Games: who may host a party game. Each game needs one Blokvane member as its host: they sign in on their
// phone (or with Blokvane on their computer), and everyone else in that game plays for free, without signing in.
// The phone sends its pass with "join"; the TV checks it, makes that phone the host, and only then lets the others in.
//
// For now this is a test sign-in with one test account, checked here on the phone and on the TV. It is a stand-in:
// the real sign-in will ask Blokvane's own server, which checks the plan and answers with a pass it signs with a key
// only the server has. Phones and TVs then check that signature (with the server's public key, written here), so
// nobody can make a pass of their own. Until then, someone who reads this code could make one.
var BVPASS = (function () {
  var te = new TextEncoder();
  var hex = function (b) { return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); };
  var unhex = function (h) { var u = new Uint8Array(h.length / 2); for (var i = 0; i < u.length; i++) u[i] = parseInt(h.substr(i * 2, 2), 16); return u; };
  // the test account: its email, and a fingerprint of its password (PBKDF2, 150,000 rounds), never the password itself
  var TEST = { email: 'hasan@blokvane.com', key: '279583f4c402c846ec5ac095a4fae1f8fb4dfb071b821c556309be11a9b69d45' };
  var DAY = 864e5;
  var norm = function (e) { return String(e || '').trim().toLowerCase(); };
  var line = function (p) { return [p.v, p.kind, p.email, p.plan, p.exp].join('|'); };
  function derive(email, password) {
    return crypto.subtle.importKey('raw', te.encode(String(password)), 'PBKDF2', false, ['deriveBits']).then(function (base) {
      return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: te.encode('blokvane-games-test-v1|' + email), iterations: 150000 }, base, 256);
    }).then(hex);
  }
  function hmac(keyHex, text) {
    return crypto.subtle.importKey('raw', unhex(keyHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']).then(function (k) {
      return crypto.subtle.sign('HMAC', k, te.encode(text));
    }).then(hex);
  }
  // signing in: { pass } or { error }
  function signIn(email, password) {
    var e = norm(email), pw = String(password || '');
    if (!e || !pw) return Promise.resolve({ error: 'Type your email and your password.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return Promise.resolve({ error: 'That doesn\'t look like an email address.' });
    if (!(window.crypto && crypto.subtle)) return Promise.resolve({ error: 'This browser is too old to sign in. Try Chrome or Safari.' });
    return derive(e, pw).then(function (k) {
      if (e !== TEST.email || k !== TEST.key) return { error: 'That email or password isn\'t right. Check them and try again.' };
      var pass = { v: 1, kind: 'test', email: e, plan: 'test', exp: Date.now() + 30 * DAY };
      return hmac(TEST.key, line(pass)).then(function (sig) { pass.sig = sig; return { pass: pass }; });
    });
  }
  // is this a pass that may host? (and not run out)
  function ok(pass) {
    try {
      if (!pass || typeof pass !== 'object' || pass.v !== 1 || !(pass.exp > Date.now()) || pass.exp > Date.now() + 400 * DAY || typeof pass.sig !== 'string') return Promise.resolve(false);
      if (pass.kind === 'test') {
        if (pass.email !== TEST.email || !(window.crypto && crypto.subtle)) return Promise.resolve(false);
        return hmac(TEST.key, line(pass)).then(function (sig) { return sig === pass.sig; }, function () { return false; });
      }
    } catch (e) {}
    // (passes Blokvane's server signs come here later)
    return Promise.resolve(false);
  }
  return { signIn: signIn, ok: ok, norm: norm, test: true };
})();
