// Blokvane's Cast receiver: this page on a Chromecast or Google TV is the game screen (the same game as play/index.html).
// A phone that cast it asks for the game's link and joins by itself. Google's Cast receiver script runs the TV side.
// Written the old way on purpose, like the rest of what a TV reads.
(function () {
  if (!window.cast || !cast.framework) return;
  var NS = 'urn:x-cast:com.blokvane.play';
  var ctx = cast.framework.CastReceiverContext.getInstance();
  ctx.addCustomMessageListener(NS, function (ev) {
    var d = ev && ev.data;
    if (!d || d.k !== 'link?') return;
    var link = typeof window.bvJoinLink === 'function' ? window.bvJoinLink() : '';
    if (link) ctx.sendCustomMessage(NS, ev.senderId, { k: 'link', link: link });
  });
  var o = new cast.framework.CastReceiverOptions();
  // (a party game runs for a long time with nothing playing in Cast's own sense: the TV keeps it open)
  o.disableIdleTimeout = true;
  o.customNamespaces = {};
  o.customNamespaces[NS] = cast.framework.system.MessageType.JSON;
  ctx.start(o);
})();
