// Blokvane party games: the scripts, in this order. A browser that can't read an async function (see async.js) gets
// the copies of the ones that use them, made for it: name.old.js beside name.js (tools/old-js.js). Written the old way
// on purpose, since it is the file that decides.
(function () {
  var old = !window.BV_ASYNC;
  var hasOld = { 'wt-core': 1, 'wt-net': 1, 'live-kit': 1, 'i18n': 1, 'common': 1, 'sound': 1, 'play': 1, 'games': 1, 'boowho-game': 1, 'world-game': 1, 'gir-game': 1, 'imp-game': 1, 'emoji-game': 1, 'dom-core': 1, 'dom-game': 1, 'cfa-game': 1 };
  // (tvlite.js comes first: on a TV's own browser it makes the drawing light before any game draws. See that file.)
  var list = ['tvlite.js?v=1',
    '../go/compat.js?v=15',
    '../go/wt-core.js?v=15',
    '../go/wt-net.js?v=19',
    '../go/live-kit.js?v=20',
    '../go/qrcode.js?v=11',
    '../go/pass.js?v=5',
    'watch-boo.js?v=11',
    'i18n.js?v=30',
    'common.js?v=20',
    'sound.js?v=21',
    'packs.js?v=19',
    'map.js?v=18',
    'play.js?v=32',
    'q/index.js?v=12',
    'wheel.js?v=15',
    'games.js?v=21',
    'boowho-tpl.js?v=18',
    'boowho-game.js?v=20',
    'world-tpl.js?v=17',
    'world-game.js?v=20',
    'gir-game.js?v=18',
    'imp-tpl.js?v=15',
    'imp-words.js?v=14',
    'imp-game.js?v=18',
    'emoji-tpl.js?v=16',
    'emoji-game.js?v=18',
    'dom-core.js?v=8',
    'dom-game.js?v=6',
    'cfa-game.js?v=1'];
  for (var i = 0; i < list.length; i++) {
    var src = list[i], name = src.split('?')[0].split('/').pop().replace(/\.js$/, '');
    if (old && hasOld[name]) src = src.replace(/\.js\?/, '.old.js?');
    document.write('<script src="' + src + '"><\/script>');
  }
})();
