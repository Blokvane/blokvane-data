// Blokvane Games: light or dark. Runs first, before the page draws, so it never flashes the wrong colors.
//   Auto  (the start): like the phone, and it follows when the phone changes
//   Light / Dark: always, whatever the phone says (picked in the Games' "Look", saved on this phone only)
// It puts html.bv-day on for the light look (go.css draws the Games from it) and tells the browser which colors the
// page uses (color-scheme), so form fields, scroll bars and the phone's top bar match.
// (Written the old way, so it also runs on old phones and TVs.)
(function () {
  var KEY = 'bvTheme';
  var mq = null;
  try { mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null; } catch (e) {}
  function get() {
    var v = '';
    try { v = localStorage.getItem(KEY) || ''; } catch (e) {}
    return v === 'light' || v === 'dark' ? v : 'auto';
  }
  function phoneLight() { return !!(mq && mq.matches); }
  function isDay() { var t = get(); return t === 'light' || (t === 'auto' && phoneLight()); }
  function meta(name) {
    var m = document.querySelector('meta[name="' + name + '"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute('name', name); (document.head || document.documentElement).appendChild(m); }
    return m;
  }
  function apply() {
    var h = document.documentElement, day = isDay(), t = get();
    if (day) h.classList.add('bv-day'); else h.classList.remove('bv-day');
    h.setAttribute('data-theme', t);
    // (a page that says it is only dark, or only light, is left alone by the browser's own "make it dark")
    if (h.getAttribute('data-games') === '1') meta('color-scheme').setAttribute('content', day ? 'light' : 'dark');
    try { if (window.BVTHEME && BVTHEME.onchange) BVTHEME.onchange(day); } catch (e) {}
  }
  function set(t) {
    try { if (t === 'light' || t === 'dark') localStorage.setItem(KEY, t); else localStorage.removeItem(KEY); } catch (e) {}
    apply();
  }
  window.BVTHEME = { get: get, set: set, isDay: isDay, phoneLight: phoneLight, apply: apply, onchange: null,
    // (Samsung Internet repaints every website when its own dark mode is on, and no website can stop it)
    samsung: /SamsungBrowser/i.test(navigator.userAgent || '') };
  apply();
  if (mq) {
    var on = function () { if (get() === 'auto') apply(); };
    if (mq.addEventListener) mq.addEventListener('change', on); else if (mq.addListener) mq.addListener(on);
  }
  // (another tab of the Games changed it)
  try { window.addEventListener('storage', function (e) { if (e.key === KEY) apply(); }); } catch (e) {}
})();
