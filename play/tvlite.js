// Blokvane party games on a TV's own browser (a smart TV, a streaming stick's browser, a game console): the same
// screens, drawn in a way a TV's small processor can keep up with.
//
// What costs a TV the most is drawing soft shadows and glows: every one is a blur the TV works out again each time
// something near it changes, and a game table has dozens. Measured on Dominoes 151, they were about six sevenths of
// all the drawing work. So on a TV, and only there:
//   - a box's soft shadow is left out (a crisp one, like a tile's edge or a thin line around it, stays, and a colored
//     glow becomes a thin ring of that color, so what it marks stays marked);
//   - a drop shadow made with "filter" is left out, and so is a blurred backdrop behind a panel;
//   - a grain texture worked out by the browser (feTurbulence) is left out of a background.
// Letters keep their shadows, and soft lights keep their blur.
// Nothing else changes: the same pages, the same moves, the same rules.
//
// It is NOT used on a computer or a phone, and not when one of them casts to the TV (a cast shows the computer's or the
// phone's own drawing, and a Chromecast says "CrKey"). To try it on a computer: add ?tvlite=1 to the address. To switch
// it off on a TV: ?tvlite=0.
//
// This file is read first, by every browser, so it is written the old way on purpose.
(function () {
  'use strict';
  var ua = navigator.userAgent || '', q = location.search || '';
  var tv = /SMART-TV|SmartTV|Tizen|Web0S|webOS|NetCast|BRAVIA|AFT[A-Z]|Android TV|GoogleTV|HbbTV|VIDAA|PhilipsTV|Roku|Viera|TV Safari|PlayStation|Xbox|Nintendo/i.test(ua);
  // (an Android TV box whose browser does not say "TV": Android, not a phone, and no touch screen)
  try { if (!tv && /Android/i.test(ua) && !/Mobile/i.test(ua) && !(navigator.maxTouchPoints > 0) && !('ontouchstart' in window)) tv = true; } catch (e) {}
  if (/CrKey/i.test(ua)) tv = false;
  var on = /[?&]tvlite=1(&|$)/.test(q) || (tv && !/[?&]tvlite=0(&|$)/.test(q));
  window.BV_TVLITE = on;
  if (!on) return;
  try { document.documentElement.className += ' tvlite'; } catch (e) {}

  // ---------- the values ----------
  // a list split at its own commas (never the ones inside rgba( ), calc( ) or url( ), or inside quotes)
  function split(v, at) {
    var out = [], depth = 0, quote = '', start = 0, i, c;
    for (i = 0; i < v.length; i++) {
      c = v.charAt(i);
      if (quote) { if (c === '\\') i++; else if (c === quote) quote = ''; continue; }
      if (c === '"' || c === "'") quote = c;
      else if (c === '(') depth++;
      else if (c === ')') { if (depth) depth--; }
      else if (c === at && !depth) { out.push(v.slice(start, i)); start = i + 1; }
    }
    out.push(v.slice(start));
    return out;
  }
  var LEN = /^[-+]?(\d+\.?\d*|\.\d+)([a-z%]*)$/i, ZERO = /^[-+]?(0+\.?0*|\.0+)([a-z%]*)$/i;
  // is this color dark (a shadow) and not a color of its own (a glow)?
  function dark(c) {
    var m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(c);
    if (m) return (+m[1]) + (+m[2]) + (+m[3]) < 150;
    m = /^#([0-9a-f]{3,8})$/i.exec(c);
    if (m) { var h = m[1], k = h.length < 6 ? 1 : 2, v = function (i) { var x = parseInt(h.substr(i * k, k), 16); return k === 1 ? x * 17 : x; }; return v(0) + v(1) + v(2) < 150; }
    return /^(black|transparent)$/i.test(c) || !c;
  }
  // One shadow, made light. Its lengths are: across, down, then the blur, then the spread.
  //   - it does not blur: kept as it is (a tile's edge, a thin line around something);
  //   - a dark one that blurs (a soft shadow): left out;
  //   - a colored one that blurs and sits right behind its box (a glow, often how a thing is marked): a thin crisp ring
  //     of that color, so what it marks stays marked.
  function one(sh) {
    var words = split(sh.replace(/^\s+|\s+$/g, ''), ' '), lens = [], rest = [], inset = '', i, w;
    for (i = 0; i < words.length; i++) {
      w = words[i];
      if (!w) continue;
      if (/^inset$/i.test(w)) inset = 'inset ';
      else if (LEN.test(w) || /^calc\(/i.test(w)) lens.push(w);
      else rest.push(w);
    }
    if (lens.length < 3 || ZERO.test(lens[2])) return sh;
    var color = rest.join(' ');
    if (ZERO.test(lens[0]) && ZERO.test(lens[1]) && !dark(color)) return inset + '0 0 0 2px ' + color;
    return null;
  }
  function tail(v) { var m = /\s*!important\s*$/i.exec(v); return m ? [v.slice(0, m.index), ' !important'] : [v, '']; }
  function liteShadow(v) {
    if (typeof v !== 'string' || v.indexOf(' ') < 0) return v;
    var t = tail(v), list = split(t[0], ','), keep = [], same = true, i, x;
    for (i = 0; i < list.length; i++) { x = one(list[i]); if (x !== list[i]) same = false; if (x != null) keep.push(x); }
    if (same) return v;
    return (keep.length ? keep.join(',') : 'none') + t[1];
  }
  // (a blur made with "filter" is left alone: it is how a soft light is drawn, and without it the light would be a
  // hard shape. A drop shadow only adds a shadow, so it can go.)
  function liteFilter(v) {
    if (typeof v !== 'string' || !/drop-shadow\(/i.test(v)) return v;
    var t = tail(v), words = split(t[0].replace(/^\s+|\s+$/g, ''), ' '), keep = [], i;
    for (i = 0; i < words.length; i++) if (words[i] && !/^drop-shadow\(/i.test(words[i])) keep.push(words[i]);
    return (keep.length ? keep.join(' ') : 'none') + t[1];
  }
  function liteBack(v) {
    if (typeof v !== 'string' || v.indexOf('feTurbulence') < 0) return v;
    var t = tail(v), list = split(t[0], ','), i;
    for (i = 0; i < list.length; i++) if (list[i].indexOf('feTurbulence') >= 0) list[i] = (i ? ' ' : '') + 'none';
    return list.join(',') + t[1];
  }
  function none(v) { return typeof v === 'string' && v && v !== 'none' ? 'none' : v; }
  var RULES = {
    'box-shadow': liteShadow, '-webkit-box-shadow': liteShadow,
    'filter': liteFilter, '-webkit-filter': liteFilter,
    'backdrop-filter': none, '-webkit-backdrop-filter': none,
    'background': liteBack, 'background-image': liteBack
  };
  var WORTH = /shadow|filter|feTurbulence/i;
  // a whole style ("left:0;box-shadow:...") with its costly parts made light
  function liteCss(css) {
    if (typeof css !== 'string' || !WORTH.test(css)) return css;
    var list = split(css, ';'), changed = false, i, d, k, name, f, val, x;
    for (i = 0; i < list.length; i++) {
      d = list[i]; k = d.indexOf(':');
      if (k < 0) continue;
      name = d.slice(0, k).replace(/^\s+|\s+$/g, '').toLowerCase();
      f = RULES[name];
      if (!f) continue;
      val = d.slice(k + 1); x = f(val);
      if (x !== val) { list[i] = d.slice(0, k + 1) + x; changed = true; }
    }
    return changed ? list.join(';') : css;
  }
  window.BVTV = { css: liteCss, shadow: liteShadow, filter: liteFilter };

  // ---------- where styles are set by the pages' own code ----------
  var P = window.CSSStyleDeclaration && window.CSSStyleDeclaration.prototype;
  var setProp = P && P.setProperty;
  function wrap(prop, f) {
    try {
      var d = Object.getOwnPropertyDescriptor(P, prop);
      if (!d || !d.set || !d.configurable) return;
      Object.defineProperty(P, prop, { configurable: true, enumerable: d.enumerable, get: d.get, set: function (v) { var x = v; try { x = f(v); } catch (e) {} return d.set.call(this, x); } });
    } catch (e) {}
  }
  // (style.boxShadow = "..." and its like. Where the browser keeps such a name on every style itself and not on the
  // family of all styles, a name put on the family is the one that gets used: it hands the light value on.)
  function named(prop, css, f) {
    try {
      if (Object.getOwnPropertyDescriptor(P, prop)) { wrap(prop, f); return; }
      Object.defineProperty(P, prop, { configurable: true, enumerable: true,
        get: function () { return this.getPropertyValue(css); },
        set: function (v) { var x = v == null ? '' : String(v); try { x = f(x); } catch (e) {} setProp.call(this, css, x); } });
    } catch (e) {}
  }
  if (P) {
    wrap('cssText', liteCss);
    if (setProp) {
      named('boxShadow', 'box-shadow', liteShadow); named('webkitBoxShadow', '-webkit-box-shadow', liteShadow);
      named('filter', 'filter', liteFilter); named('webkitFilter', '-webkit-filter', liteFilter);
      named('backdropFilter', 'backdrop-filter', none); named('webkitBackdropFilter', '-webkit-backdrop-filter', none);
      named('background', 'background', liteBack); named('backgroundImage', 'background-image', liteBack);
    }
    try {
      if (setProp) P.setProperty = function (name, value, priority) {
        var f = RULES[String(name).toLowerCase()], x = value;
        try { if (f) x = f(value); } catch (e) {}
        return arguments.length > 2 ? setProp.call(this, name, x, priority) : setProp.call(this, name, x);
      };
    } catch (e) {}
  }
  try {
    var setAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (name === 'style' && typeof value === 'string') { try { value = liteCss(value); } catch (e) {} }
      return setAttr.call(this, name, value);
    };
  } catch (e) {}

  // ---------- the style sheets (the games' own files, and the ones a game writes while it runs) ----------
  function fix(style) {
    if (!style || !style.length) return;
    var todo = [], i, name;
    for (i = 0; i < style.length; i++) { name = style[i]; if (RULES[name]) todo.push(name); }
    for (i = 0; i < todo.length; i++) {
      try {
        var v = style.getPropertyValue(todo[i]), x = RULES[todo[i]](v);
        if (x !== v) setProp.call(style, todo[i], x, style.getPropertyPriority(todo[i]));
      } catch (e) {}
    }
  }
  function walk(rules) {
    if (!rules) return;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      try { if (r.style) fix(r.style); if (r.cssRules) walk(r.cssRules); } catch (e) {}
    }
  }
  function sheet(s) { var rules = null; try { rules = s && s.cssRules; } catch (e) {} if (rules) walk(rules); }
  function all() { try { for (var i = 0; i < document.styleSheets.length; i++) sheet(document.styleSheets[i]); } catch (e) {} }
  if (setProp) {
    all();
    try { document.addEventListener('DOMContentLoaded', all); } catch (e) {}
    // (a sheet added later, or a game's own <style> whose text changes. Only the page's head is watched: the games
    // put their sheets there, and what a game draws on the screen never wakes this up.)
    try {
      var later = function (node) {
        if (!node || node.nodeType !== 1) return;
        if (node.tagName === 'STYLE') sheet(node.sheet);
        else if (node.tagName === 'LINK') { if (node.sheet) sheet(node.sheet); node.addEventListener('load', function () { sheet(node.sheet); }); }
      };
      new MutationObserver(function (list) {
        for (var i = 0; i < list.length; i++) {
          var m = list[i], j;
          if (m.target && m.target.tagName === 'STYLE') { later(m.target); continue; }
          for (j = 0; j < m.addedNodes.length; j++) later(m.addedNodes[j]);
        }
      }).observe(document.head || document.documentElement, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  }
})();
