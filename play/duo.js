// Blokvane party games, "Play here too" (duo.html): the game and one player's own panel on the same screen. This makes
// the game's 6 letters, opens the game with them on one side (index.html#<game>.<language>.<letters>) and the panel on
// the other (../go/games.html#join.<letters>), which then joins that game by itself. The round button hides the panel
// and brings it back. Written the old way on purpose: it should open wherever the game itself opens.
(function () {
  'use strict';
  var LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  function code() {
    var out = '', r = new Uint8Array(6), i;
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(r); else for (i = 0; i < 6; i++) r[i] = Math.floor(Math.random() * 256);
    for (i = 0; i < 6; i++) out += LETTERS.charAt(r[i] % LETTERS.length);
    return out;
  }
  // what to open: #<game>.<language> (both may be missing: then the game list, in the screen's own language)
  var h = location.hash.replace(/^#/, '').split('.');
  var game = /^[a-z]{2,12}$/.test(h[0] || '') ? h[0] : '';
  var lang = /^[a-z]{2}$/.test(h[1] || '') ? h[1] : '';
  var c = code();
  var tv = document.getElementById('tv'), me = document.getElementById('me'), tog = document.getElementById('tog');
  if (lang === 'ar' || lang === 'he' || lang === 'fa' || lang === 'ur') document.documentElement.dir = 'rtl';
  tv.src = 'index.html#' + game + '.' + lang + '.' + c;
  // (the panel a moment later, so the game is there to answer it)
  setTimeout(function () { me.src = '../go/games.html#join.' + c; }, 600);
  tog.onclick = function () {
    var wide = !document.body.classList.contains('wide');
    document.body.classList.toggle('wide', wide);
    tog.setAttribute('aria-pressed', String(!wide));
  };
})();
