// Blokvane: what older browsers lack, filled in, so the party games (and the rest of this site) run on smart TV browsers
// and older phones too. Loaded before everything else. Each piece is added only where the browser has no own version.
// BVRX gives regular expressions that use Unicode classes (\p{...}): the browser's own where it has them, else the same
// class written out in a form every browser reads (made with regexpu-core, from the same Unicode data).
(function () {
  'use strict';
  var def = function (o, name, fn) { if (o && !o[name]) { try { Object.defineProperty(o, name, { value: fn, configurable: true, writable: true }); } catch (e) { o[name] = fn; } } };
  var AP = Array.prototype, SP = String.prototype;
  def(Object, 'values', function (o) { return Object.keys(o).map(function (k) { return o[k]; }); });
  def(Object, 'entries', function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); });
  def(Object, 'fromEntries', function (it) { var o = {}; Array.from(it, function (kv) { o[kv[0]] = kv[1]; }); return o; });
  def(Object, 'hasOwn', function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); });
  var pad = function (s, n, f, start) {
    s = String(s); n = n >> 0; f = f === undefined ? ' ' : String(f);
    if (s.length >= n || !f) return s;
    var add = n - s.length; while (f.length < add) f += f;
    return start ? f.slice(0, add) + s : s + f.slice(0, add);
  };
  def(SP, 'padStart', function (n, f) { return pad(this, n, f, true); });
  def(SP, 'padEnd', function (n, f) { return pad(this, n, f, false); });
  def(SP, 'trimStart', function () { return String(this).replace(/^\s+/, ''); });
  def(SP, 'trimEnd', function () { return String(this).replace(/\s+$/, ''); });
  def(SP, 'replaceAll', function (a, b) { return a instanceof RegExp ? String(this).replace(a, b) : String(this).split(String(a)).join(typeof b === 'function' ? b(String(a)) : String(b)); });
  def(SP, 'at', function (i) { var s = String(this); i = Math.trunc(i) || 0; if (i < 0) i += s.length; return i < 0 || i >= s.length ? undefined : s.charAt(i); });
  def(SP, 'matchAll', function (re) {
    var r = new RegExp(re.source, re.flags.indexOf('g') < 0 ? re.flags + 'g' : re.flags), s = String(this), out = [], m;
    while ((m = r.exec(s))) { out.push(m); if (m[0] === '') r.lastIndex++; }
    return out[Symbol.iterator]();
  });
  def(AP, 'at', function (i) { i = Math.trunc(i) || 0; if (i < 0) i += this.length; return i < 0 || i >= this.length ? undefined : this[i]; });
  def(AP, 'flat', function (d) {
    d = d === undefined ? 1 : Math.trunc(d) || 0;
    var out = [];
    (function go(a, lv) { for (var i = 0; i < a.length; i++) { if (!(i in a)) continue; if (Array.isArray(a[i]) && lv > 0) go(a[i], lv - 1); else out.push(a[i]); } })(this, d);
    return out;
  });
  def(AP, 'flatMap', function (fn, self) { return AP.map.call(this, fn, self).flat(1); });
  def(AP, 'findLast', function (fn, self) { for (var i = this.length - 1; i >= 0; i--) if (fn.call(self, this[i], i, this)) return this[i]; return undefined; });
  def(AP, 'findLastIndex', function (fn, self) { for (var i = this.length - 1; i >= 0; i--) if (fn.call(self, this[i], i, this)) return i; return -1; });
  def(AP, 'includes', function (x, from) { for (var i = from >> 0 || 0; i < this.length; i++) if (this[i] === x || (x !== x && this[i] !== this[i])) return true; return false; });
  if (window.Promise) {
    def(Promise.prototype, 'finally', function (fn) { var P = this.constructor || Promise; return this.then(function (v) { return P.resolve(fn()).then(function () { return v; }); }, function (e) { return P.resolve(fn()).then(function () { throw e; }); }); });
    def(Promise, 'allSettled', function (list) { return Promise.all(Array.from(list, function (p) { return Promise.resolve(p).then(function (v) { return { status: 'fulfilled', value: v }; }, function (e) { return { status: 'rejected', reason: e }; }); })); });
    def(Promise, 'any', function (list) { return new Promise(function (ok, no) { var a = Array.from(list), n = a.length, errs = []; if (!n) no(new Error('All promises were rejected')); a.forEach(function (p, i) { Promise.resolve(p).then(ok, function (e) { errs[i] = e; if (--n === 0) no(new Error('All promises were rejected')); }); }); }); });
  }
  if (typeof window.globalThis === 'undefined') window.globalThis = window;
  def(window, 'queueMicrotask', function (fn) { Promise.resolve().then(fn).catch(function (e) { setTimeout(function () { throw e; }); }); });
  // the page's own elements
  var EP = window.Element && Element.prototype;
  if (EP) {
    def(EP, 'matches', EP.msMatchesSelector || EP.webkitMatchesSelector);
    def(EP, 'closest', function (sel) { var e = this; while (e && e.nodeType === 1) { if (e.matches(sel)) return e; e = e.parentElement; } return null; });
    def(EP, 'toggleAttribute', function (n, force) { var has = this.hasAttribute(n); if (force === undefined ? has : !force) { this.removeAttribute(n); return false; } this.setAttribute(n, ''); return true; });
    var node = function (x) { return x instanceof Node ? x : document.createTextNode(String(x)); };
    var frag = function (args) { var f = document.createDocumentFragment(); for (var i = 0; i < args.length; i++) f.appendChild(node(args[i])); return f; };
    [EP, window.CharacterData && CharacterData.prototype, window.DocumentType && DocumentType.prototype].forEach(function (p) {
      if (!p) return;
      def(p, 'remove', function () { if (this.parentNode) this.parentNode.removeChild(this); });
      def(p, 'before', function () { if (this.parentNode) this.parentNode.insertBefore(frag(arguments), this); });
      def(p, 'after', function () { if (this.parentNode) this.parentNode.insertBefore(frag(arguments), this.nextSibling); });
      def(p, 'replaceWith', function () { if (this.parentNode) this.parentNode.replaceChild(frag(arguments), this); });
    });
    [EP, window.Document && Document.prototype, window.DocumentFragment && DocumentFragment.prototype].forEach(function (p) {
      if (!p) return;
      def(p, 'append', function () { this.appendChild(frag(arguments)); });
      def(p, 'prepend', function () { this.insertBefore(frag(arguments), this.firstChild); });
      def(p, 'replaceChildren', function () { while (this.lastChild) this.removeChild(this.lastChild); this.appendChild(frag(arguments)); });
    });
  }
  if (window.NodeList) def(NodeList.prototype, 'forEach', AP.forEach);
  // pointer events (iPhones before iOS 13 have only touch and mouse events): pointerdown, pointerup and pointercancel
  // made from them, on the same element, so holding a button down (Hold to peek...) works there too
  if (!window.PointerEvent && document.addEventListener) {
    var lastTouch = 0;
    var fire = function (type, e, p, kind) {
      var ev = document.createEvent('Event');
      ev.initEvent(type, true, true);
      ev.pointerId = 1; ev.pointerType = kind; ev.isPrimary = true; ev.button = 0;
      ev.clientX = p ? p.clientX : 0; ev.clientY = p ? p.clientY : 0;
      if (e.target && e.target.dispatchEvent && !e.target.dispatchEvent(ev) && e.cancelable) e.preventDefault();
    };
    var on = function (from, to, kind) {
      document.addEventListener(from, function (e) {
        if (kind === 'touch') lastTouch = Date.now();
        else if (Date.now() - lastTouch < 800) return;   // (the mouse events a phone sends after a touch)
        fire(to, e, kind === 'touch' ? e.changedTouches && e.changedTouches[0] : e, kind);
      }, { capture: true, passive: false });
    };
    on('touchstart', 'pointerdown', 'touch'); on('touchend', 'pointerup', 'touch'); on('touchcancel', 'pointercancel', 'touch');
    on('mousedown', 'pointerdown', 'mouse'); on('mouseup', 'pointerup', 'mouse');
    if (EP) { def(EP, 'setPointerCapture', function () {}); def(EP, 'releasePointerCapture', function () {}); }
  }
  if (window.Blob) {
    var read = function (b, how) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = function () { no(r.error); }; r[how](b); }); };
    def(Blob.prototype, 'arrayBuffer', function () { return read(this, 'readAsArrayBuffer'); });
    def(Blob.prototype, 'text', function () { return read(this, 'readAsText'); });
  }
})();

// What the page's look needs, in browsers that lack it:
//  - gap between the items of a flex box (Chrome before 84): html.no-flexgap tells the stylesheets to space them with
//    margins instead (their fallback rules, added by tools/old-css.py), and the designed screens' own flex boxes get
//    the same here (tools/old-css.py --inline marks each one with a class and its gaps)
//  - min() in CSS (Chrome before 79): the party games' TV sizes everything from --sh, the height of a 16:9 stage that
//    fits the screen (play.css says min(100vh, 56.25vw)); here it is worked out in pixels instead, on every resize
(function () {
  'use strict';
  var root = document.documentElement;
  try {
    var f = document.createElement('div');
    f.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden;pointer-events:none';
    f.appendChild(document.createElement('div')); f.appendChild(document.createElement('div'));
    root.appendChild(f);
    var flexGap = f.scrollHeight === 1;
    root.removeChild(f);
    if (!flexGap) {
      root.classList.add('no-flexgap');
      var st = document.createElement('style');
      st.textContent = 'html.no-flexgap .bvfg-r>*+*{margin-left:var(--fgc)}html.no-flexgap[dir="rtl"] .bvfg-r>*+*{margin-left:0;margin-right:var(--fgc)}' +
        'html.no-flexgap .bvfg-c>*+*{margin-top:var(--fgr)}html.no-flexgap .bvfg-w>*{margin:0 var(--fgc) var(--fgr) 0}';
      (document.head || root).appendChild(st);
    }
  } catch (e) {}
  var hasMin = false;
  try { hasMin = !!(window.CSS && CSS.supports && CSS.supports('width', 'min(1px, 2px)')); } catch (e) {}
  if (!hasMin) {
    var size = function () { root.style.setProperty('--sh', Math.min(window.innerHeight, window.innerWidth * 0.5625) + 'px'); };
    size();
    window.addEventListener('resize', size);
    window.addEventListener('orientationchange', size);
  }
})();

var BVRX = (function () {
  'use strict';
  // \p{Extended_Pictographic} (emoji and pictographs), written out
  var PICTO = '(?:[\\xA9\\xAE\\u203C\\u2049\\u2122\\u2139\\u2194-\\u2199\\u21A9\\u21AA\\u231A\\u231B\\u2328\\u23CF\\u23E9-\\u23F3\\u23F8-\\u23FA\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE\\u2600-\\u2604\\u260E\\u2611\\u2614\\u2615\\u2618\\u261D\\u2620\\u2622\\u2623\\u2626\\u262A\\u262E\\u262F\\u2638-\\u263A\\u2640\\u2642\\u2648-\\u2653\\u265F\\u2660\\u2663\\u2665\\u2666\\u2668\\u267B\\u267E\\u267F\\u2692-\\u2697\\u2699\\u269B\\u269C\\u26A0\\u26A1\\u26A7\\u26AA\\u26AB\\u26B0\\u26B1\\u26BD\\u26BE\\u26C4\\u26C5\\u26C8\\u26CE\\u26CF\\u26D1\\u26D3\\u26D4\\u26E9\\u26EA\\u26F0-\\u26F5\\u26F7-\\u26FA\\u26FD\\u2702\\u2705\\u2708-\\u270D\\u270F\\u2712\\u2714\\u2716\\u271D\\u2721\\u2728\\u2733\\u2734\\u2744\\u2747\\u274C\\u274E\\u2753-\\u2755\\u2757\\u2763\\u2764\\u2795-\\u2797\\u27A1\\u27B0\\u27BF\\u2934\\u2935\\u2B05-\\u2B07\\u2B1B\\u2B1C\\u2B50\\u2B55\\u3030\\u303D\\u3297\\u3299]|\\uD83C[\\uDC04\\uDC2C-\\uDC2F\\uDC94-\\uDC9F\\uDCAF\\uDCB0\\uDCC0\\uDCCF\\uDCD0\\uDCF6-\\uDCFF\\uDD70\\uDD71\\uDD7E\\uDD7F\\uDD8E\\uDD91-\\uDD9A\\uDDAF-\\uDDE5\\uDE01-\\uDE0F\\uDE1A\\uDE2F\\uDE32-\\uDE3A\\uDE3C-\\uDE3F\\uDE49-\\uDE5F\\uDE66-\\uDF21\\uDF24-\\uDF93\\uDF96\\uDF97\\uDF99-\\uDF9B\\uDF9E-\\uDFF0\\uDFF3-\\uDFF5\\uDFF7-\\uDFFA]|\\uD83D[\\uDC00-\\uDCFD\\uDCFF-\\uDD3D\\uDD49-\\uDD4E\\uDD50-\\uDD67\\uDD6F\\uDD70\\uDD73-\\uDD7A\\uDD87\\uDD8A-\\uDD8D\\uDD90\\uDD95\\uDD96\\uDDA4\\uDDA5\\uDDA8\\uDDB1\\uDDB2\\uDDBC\\uDDC2-\\uDDC4\\uDDD1-\\uDDD3\\uDDDC-\\uDDDE\\uDDE1\\uDDE3\\uDDE8\\uDDEF\\uDDF3\\uDDFA-\\uDE4F\\uDE80-\\uDEC5\\uDECB-\\uDED2\\uDED5-\\uDEE5\\uDEE9\\uDEEB-\\uDEF0\\uDEF3-\\uDEFF\\uDFDC-\\uDFF0]|\\uD83E[\\uDC0C-\\uDC0F\\uDC48-\\uDC4F\\uDC5A-\\uDC5F\\uDC88-\\uDC8F\\uDCAE\\uDCAF\\uDCBC-\\uDCBF\\uDCC2-\\uDCCF\\uDCD9-\\uDCFF\\uDD0C-\\uDD3A\\uDD3C-\\uDD45\\uDD47-\\uDDFF\\uDE58-\\uDE5F\\uDE6E-\\uDEFF]|\\uD83F[\\uDC00-\\uDFFD])';
  var made = {};
  // the browser's own regular expression where it reads it, else the written-out one (without the u flag)
  function rx(src, flags, es5) {
    var key = src + '/' + flags;
    if (made[key]) return made[key];
    var r;
    try { r = new RegExp(src, flags); } catch (e) { r = new RegExp(es5, flags.replace('u', '')); }
    return (made[key] = r);
  }
  return {
    rx: rx,
    // one emoji or pictograph
    picto: function (flags) { return rx('\\p{Extended_Pictographic}', (flags || '') + 'u', PICTO); },
    // one emoji with what joins to it (people, families, flags of work...): pictographs joined by a zero-width joiner, and
    // the emoji style selector
    pictoSeq: function (flags) { return rx('\\p{Extended_Pictographic}(?:\\u200D\\p{Extended_Pictographic}|\\uFE0F)*', (flags || '') + 'u', PICTO + '(?:\\u200D' + PICTO + '|\\uFE0F)*'); },
    // nothing but emoji, joiners, style selectors and spaces
    emojiOnly: function () { return rx('^[\\p{Extended_Pictographic}\\u200D\\uFE0F\\s]+$', 'u', '^(?:' + PICTO + '|[\\u200D\\uFE0F\\s])+$'); }
  };
})();
