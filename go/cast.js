// Blokvane Games: "Cast to a TV" on the phone. A Chromecast or Google TV on the same Wi-Fi opens the game screen
// (play/cast.html, Blokvane's Cast receiver), and the phone joins that game by itself. It works in Chrome on Android
// and on computers (Google's Cast for web pages); other browsers show no Cast button. Google's own Cast script is
// loaded only when Blokvane's Cast app id is set (cast-config.js), and only on this page.
// Written the old way on purpose (no arrow functions, no async), like pass.js.
var BVCAST = (function () {
  var NS = 'urn:x-cast:com.blokvane.play';
  var id = typeof BV_CAST_APP_ID === 'string' && /^[A-Z0-9]{8}$/.test(BV_CAST_APP_ID) ? BV_CAST_APP_ID : '';
  var readyP = null;
  function ready() {
    if (readyP) return readyP;
    readyP = new Promise(function (res) {
      if (!id || !/Chrome\//.test(navigator.userAgent) || /iPhone|iPad|CriOS/.test(navigator.userAgent)) { res(false); return; }
      var t = setTimeout(function () { res(false); }, 8000);
      window.__onGCastApiAvailable = function (ok) {
        clearTimeout(t);
        if (!ok || !window.cast || !cast.framework) { res(false); return; }
        try {
          cast.framework.CastContext.getInstance().setOptions({ receiverApplicationId: id, autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED });
          res(true);
        } catch (e) { res(false); }
      };
      var s = document.createElement('script');
      s.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      s.onerror = function () { clearTimeout(t); res(false); };
      document.head.appendChild(s);
    });
    return readyP;
  }
  // Opens the game on the TV the person picks, and gives back the link to join it (or null).
  function start() {
    return ready().then(function (ok) {
      if (!ok) return null;
      var ctx = cast.framework.CastContext.getInstance();
      return ctx.requestSession().then(function () {
        var session = ctx.getCurrentSession();
        if (!session) return null;
        return new Promise(function (res) {
          var tries = 0, done = false;
          var finish = function (link) { if (done) return; done = true; try { session.removeMessageListener(NS, onMsg); } catch (e) {} res(link); };
          var onMsg = function (ns, text) {
            var m = null;
            try { m = typeof text === 'string' ? JSON.parse(text) : text; } catch (e) {}
            if (m && m.k === 'link' && typeof m.link === 'string' && /^https:\/\/app\.blokvane\.com\/go\/games\.html#game\.[A-Za-z0-9_-]+\.[0-9a-f]{16}(\.[a-z]{2})?$/.test(m.link)) finish(m.link);
          };
          session.addMessageListener(NS, onMsg);
          // (the TV needs a moment to start the game: asked again until it has the link, for up to half a minute)
          var ask = function () {
            if (done) return;
            if (++tries > 30) { finish(null); return; }
            session.sendMessage(NS, { k: 'link?' }).catch(function () {});
            setTimeout(ask, 1000);
          };
          ask();
        });
      }, function () { return null; });
    });
  }
  return { on: !!id, ready: ready, start: start };
})();
