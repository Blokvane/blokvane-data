// Blokvane's three phone apps (BV Ad Block, BV Games, BV Remote) know about each other through this small file: which
// of them are on this phone's home screen already, so a page offers "Get" only for an app that is not there yet.
//
// How a web page can know: an app says "I am here" when it runs from its own icon, or right after it was added. That
// is kept on this phone (the three apps share one memory in the same browser). An iPhone gives a home-screen app a
// memory of its own, apart from Safari's: there the person's account fills the gap. Signed in, a page tells Blokvane
// which apps this kind of phone has and hears back what the other apps said (server: /v1/phone/apps). "Kind of phone"
// is what a page can tell about a phone: iPhone or Android, and the size of its screen.
// (Written the old way, like theme.js, so it also runs on old phones.)
(function () {
  var KEY = 'bvgo:apps', SRV = 'bvgo:apps:acct';
  var FILES = { ads: 'adblock.html', games: 'games.html', remote: 'index.html' };
  var ua = navigator.userAgent || '';
  var IPAD = /iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  function plat() { return /iPhone|iPod/.test(ua) || IPAD ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop'; }
  function read(k) { try { var v = JSON.parse(localStorage.getItem(k) || 'null'); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function standalone() { try { return matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone === true; } catch (e) { return false; } }
  var me = /adblock\.html/.test(location.pathname) ? 'ads' : document.documentElement.hasAttribute('data-games') || /games\.html/.test(location.pathname) ? 'games' : 'remote';
  function acct() { var p = read('bvgo:games:acct'); return p && typeof p.session === 'string' && p.session && typeof p.email === 'string' ? p : null; }
  // what kind of phone this is, the same from Safari and from a home-screen app: "ios-390x844@3"
  function kind() {
    var p = plat();
    if (p === 'desktop') return '';
    var w = Math.min(screen.width, screen.height) || 0, h = Math.max(screen.width, screen.height) || 0, d = Math.round((window.devicePixelRatio || 1) * 100) / 100;
    return w >= 10 && h >= 10 && w < 10000 && h < 10000 && d >= 1 && d < 10 ? p + '-' + w + 'x' + h + '@' + d : '';
  }
  function local() { var x = read(KEY) || {}, out = {}; for (var k in FILES) if (x[k]) out[k] = 1; return out; }
  function fromAccount() { var a = acct(), x = read(SRV), out = {}; if (a && x && x.email === a.email && x.kind === kind() && x.have && x.have.length) for (var i = 0; i < x.have.length; i++) if (FILES[x.have[i]]) out[x.have[i]] = 1; return out; }
  function has(app) { return !!(local()[app] || fromAccount()[app]); }
  function list() { var out = []; for (var k in FILES) if (has(k)) out.push(k); return out; }
  var heard = [];
  function changed() { for (var i = 0; i < heard.length; i++) try { heard[i](); } catch (e) {} }
  function mark(app) {
    if (!FILES[app]) return;
    var x = read(KEY) || {};
    if (x[app]) return;
    x[app] = Date.now(); write(KEY, x);
    changed(); sync();
  }
  // signed in: tell Blokvane what this phone has, and hear what its other apps said (at most every few hours, or
  // right away when there is something new to tell)
  var asking = false;
  function sync(force) {
    var a = acct(), k = kind();
    if (!a || !k || asking || typeof fetch !== 'function') return;
    var have = []; var l = local(); for (var n in l) have.push(n);
    var last = read(SRV) || {};
    var same = last.email === a.email && last.kind === k && have.every(function (h) { return (last.have || []).indexOf(h) >= 0; });
    if (!force && same && Date.now() - (+last.at || 0) < 6 * 3600e3) return;
    asking = true;
    var api = window.BV_TEST && typeof window.BV_TEST.api === 'string' ? window.BV_TEST.api.replace(/\/$/, '') : 'https://blokvane.com';
    fetch(api + '/v1/phone/apps', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + a.session }, credentials: 'omit', cache: 'no-store',
      body: JSON.stringify({ kind: k, have: have }) })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        asking = false;
        if (!d || !d.have || !d.have.filter) return;
        var before = list().join();
        write(SRV, { email: a.email, kind: k, have: d.have.filter(function (x) { return !!FILES[x]; }), at: Date.now() });
        if (list().join() !== before) changed();
      }, function () { asking = false; });
  }
  // this page runs from its own icon: the app is on this phone
  if (standalone() && plat() !== 'desktop') mark(me);
  try { window.addEventListener('appinstalled', function () { mark(me); }); } catch (e) {}
  try {
    if (navigator.getInstalledRelatedApps) navigator.getInstalledRelatedApps().then(function (a) {
      var mine = me === 'ads' ? /adblock\.webmanifest/ : me === 'games' ? /games\.webmanifest/ : /manifest\.json/;
      if (a && a.some(function (x) { return mine.test(x.url || ''); })) mark(me);
    }, function () {});
  } catch (e) {}
  // (the marks the apps kept before this file was there)
  try {
    if (localStorage.getItem('bvgo:appAdded') && localStorage.getItem('bvgo:appAdded') !== '0') mark('remote');
    if (localStorage.getItem('bvgo:gamesAdded') && localStorage.getItem('bvgo:gamesAdded') !== '0') mark('games');
    if (localStorage.getItem('bvab:added') && localStorage.getItem('bvab:added') !== '0') mark('ads');
  } catch (e) {}
  try { window.addEventListener('storage', function (e) { if (e.key === KEY || e.key === SRV) changed(); }); } catch (e) {}
  // a page that came here to add the app: "...?get=1" (from another app's "Get", or from blokvane.com)
  var wantsGet = /[?&]get=1\b/.test(location.search || '');
  if (wantsGet) { try { history.replaceState(history.state, '', location.pathname + location.hash); } catch (e) {} }
  var here = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  window.BVAPPS = {
    me: me, plat: plat, kind: kind, has: has, list: list, mark: mark, sync: sync, standalone: standalone,
    wantsGet: function () { var w = wantsGet; wantsGet = false; return w; },
    onchange: function (fn) { heard.push(fn); },
    // where an app lives; get: straight to "add it to the home screen"
    url: function (app, get) { return here + FILES[app] + (get ? '?get=1' : ''); },
    // Where "Get" leads. From inside a home-screen app, another app's page would open in a small browser that cannot
    // add anything to the home screen: there it is handed to the phone's real browser (Safari on an iPhone, Chrome on
    // Android; an Android phone without Chrome opens it the normal way).
    getUrl: function (app) {
      var u = here + FILES[app] + '?get=1';
      if (!standalone() || !/^https:\/\//.test(u)) return u;
      if (plat() === 'ios') return 'x-safari-' + u;
      if (plat() === 'android') return 'intent://' + u.slice(8) + '#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=' + encodeURIComponent(u) + ';end';
      return u;
    }
  };
  sync();
})();
