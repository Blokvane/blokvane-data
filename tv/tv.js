// Blokvane Screens anywhere: the page a TV (or any web browser) opens with a screen's private link from Blokvane, like
// https://blokvane.github.io/blokvane-data/tv/#s1.<secret>.<owner>. There is no Blokvane server behind it:
// 1. It finds the computer with your slideshows through free public relays, the same ones Watch together uses. Every
//    message is sealed with the link's secret and signed, and only messages signed by your computer's own key (its
//    id is the last part of the link) are believed. The secret is after the # in the address: browsers never send
//    that part to any website, so it stays on this screen.
// 2. It connects straight to that computer (WebRTC, encrypted by the browser) and copies the slideshow player, this
//    screen's slideshows, and their pictures and videos into this browser.
// 3. A small helper (sw.js) hands those copies to the player as if they came from a website. So the screen keeps
//    playing what it has when the computer is off or the internet drops, and a change made in Blokvane shows up here
//    a moment later (only what changed is copied again).
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const boot = $('boot'), frame = $('player');
  const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: ['stun:stun.cloudflare.com:3478'] }];
  const LINK = 'bvtv:link';
  const okPath = p => typeof p === 'string' && /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,95}(\/[A-Za-z0-9_][A-Za-z0-9_.-]{0,95}){0,5}$/.test(p) && !p.includes('..');
  const mb = n => (n / 1048576).toFixed(n < 10485760 ? 1 : 0);

  // ---------- what the screen says while it sets up ----------
  function say(title, text, o = {}) {
    boot.classList.remove('gone');
    boot.classList.toggle('still', !!o.still);
    boot.classList.toggle('bad', !!o.bad);
    $('t').textContent = title;
    $('p').textContent = text || '';
    $('s').textContent = o.small || '';
    $('bar').hidden = o.progress == null;
    if (o.progress != null) $('fill').style.width = Math.max(2, Math.min(100, o.progress * 100)).toFixed(1) + '%';
  }
  let chipT = 0;
  function chip(text) {
    const c = $('chip');
    clearTimeout(chipT);
    if (!text) { c.classList.add('off'); chipT = setTimeout(() => { c.hidden = true; }, 600); return; }
    $('chipT').textContent = text;
    c.hidden = false;
    requestAnimationFrame(() => c.classList.remove('off'));
  }

  // ---------- the link ----------
  function parse(h) {
    const m = /^#?s1\.([A-Za-z0-9_-]{22,64})\.([0-9a-f]{16})$/.exec(String(h || '').trim());
    return m ? { s: m[1], owner: m[2], hash: '#s1.' + m[1] + '.' + m[2] } : null;
  }
  let link = parse(location.hash);
  // (the plain address, without the link: the last screen opened in this browser plays again)
  if (!link) { try { link = parse(localStorage.getItem(LINK)); } catch (e) {} if (link) { try { history.replaceState(null, '', link.hash); } catch (e) {} } }
  if (!link) {
    say('Open your screen\'s link here', 'In Blokvane on your computer, open Slideshows and screens, then TV screens, and copy the link of this screen (or scan its QR code).', { still: true });
    return;
  }
  try { localStorage.setItem(LINK, link.hash); } catch (e) {}
  if (!('serviceWorker' in navigator) || !window.RTCPeerConnection || !window.caches || !(window.crypto && crypto.subtle) || typeof BigInt !== 'function') {
    say('This browser can\'t play Blokvane screens', 'Open the link in Chrome or Edge, or on a Fire TV, a Google TV, or a newer Samsung or LG TV.', { bad: true });
    return;
  }
  addEventListener('hashchange', () => { if (parse(location.hash) && parse(location.hash).hash !== link.hash) location.reload(); });

  const C = BVWT_CORE, NET = BVWT_NET;
  const base = new URL('./', location.href);
  let ns = '', cache = null, haveMan = null, code = '', started = false, keys = null, me = null, net = null, gate = null;

  // ---------- this screen's copies (the browser's own storage, one box per link) ----------
  const keyOf = p => new URL('/__bvtv/' + ns + '/' + p, location.origin).href;
  async function savedMan() {
    const r = await cache.match(keyOf('__man.json'));
    if (!r) return null;
    try { const m = await r.json(); return m && m.files && typeof m.files === 'object' ? m : null; } catch (e) { return null; }
  }
  async function toSw(m) {
    const reg = await navigator.serviceWorker.ready;
    const sw = reg.active || navigator.serviceWorker.controller;
    if (sw) sw.postMessage(m);
  }
  function start(c) {
    code = c;
    started = true;
    const url = new URL('run/' + ns + '/' + encodeURIComponent(c || 'tv'), base).href;
    if (frame.src !== url) frame.src = url;
    frame.hidden = false;
    boot.classList.add('gone');
    setTimeout(() => { try { frame.focus(); } catch (e) {} }, 300);
  }

  // ---------- talking through the relays (only your computer's own messages count) ----------
  async function send(m) {
    if (!net || !me) return;
    m.f = me.id;
    m.at = Date.now();
    try { await net.publish(keys.topic, await C.sealSigned(keys.key, keys.topic, m, me)); } catch (e) {}
  }
  let lastOwner = 0, haveV = 0;
  async function onRelay(topic, bytes) {
    if (topic !== keys.topic) return;
    const m = await gate(bytes);
    if (!m || m.f !== link.owner) return;
    lastOwner = Date.now();
    if (m.k === 'v') {
      if (m.to && m.to !== me.id) return;
      // your computer is there: connect (or, connected, copy what changed)
      if (open()) { if (+m.v !== haveV) sync(); }
      else connect();
    } else if (m.k === 'answer') {
      if (m.to !== me.id || !pc || m.sid !== pc.sid || pc.signalingState !== 'have-local-offer' || typeof m.sdp !== 'string') return;
      pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }).catch(() => drop(true));
    }
  }
  // "hello": until connected, now and then (your computer answers if Blokvane is on there)
  let helloT = 0, helloN = 0;
  function hello() {
    clearTimeout(helloT);
    if (open() || away) return;
    send({ k: 'hi', v: haveV });
    helloN++;
    helloT = setTimeout(hello, helloN < 5 ? 2000 * helloN : 15000);
    // the first time, with nothing to play yet: say what to do when the computer doesn't answer
    if (!started && helloN === 6) say('Waiting for your computer', 'Turn on the computer with your slideshows and open Chrome there (Blokvane needs to be on). This screen connects by itself.', { small: 'Still looking. You can leave this screen on.' });
  }

  // ---------- the direct connection ----------
  let pc = null, F = null, N = null, answerT = 0, retryN = 0, retryT = 0, pingT = 0, lastPong = 0;
  const open = () => !!(F && F.ready() && pc && pc.connectionState === 'connected');
  const gathered = p => new Promise(res => {
    if (p.iceGatheringState === 'complete') { res(); return; }
    const done = () => { clearTimeout(t); p.removeEventListener('icegatheringstatechange', ch); res(); };
    const ch = () => { if (p.iceGatheringState === 'complete') done(); };
    const t = setTimeout(done, 2500);
    p.addEventListener('icegatheringstatechange', ch);
  });
  const trim = sdp => { let n = 0; return String(sdp || '').split('\r\n').filter(l => !l.startsWith('a=candidate') || (!/ tcp /i.test(l) && ++n <= 10)).join('\r\n'); };
  function drop(retry) {
    clearTimeout(answerT); clearInterval(pingT);
    const p = pc;
    pc = null; F = null; N = null;
    if (p) { try { p.close(); } catch (e) {} }
    if (retry) {
      retryN++;
      clearTimeout(retryT);
      retryT = setTimeout(() => { helloN = 0; hello(); }, Math.min(30000, 1500 * retryN));
    }
  }
  async function connect() {
    if (pc && ['new', 'connecting', 'connected'].includes(pc.connectionState)) return;
    drop(false);
    const p = pc = new RTCPeerConnection({ iceServers: ICE });
    p.sid = C.hex(C.rand(6));
    const f = p.createDataChannel('files', { ordered: true });
    const n = p.createDataChannel('net', { ordered: true });
    f.onopen = () => { if (pc !== p) return; F = channel(f); retryN = 0; sync(); };
    n.onopen = () => {
      if (pc !== p) return;
      N = channel(n);
      report(true);
      lastPong = Date.now();
      pingT = setInterval(() => {
        if (!N) return;
        // (no answer for a minute: the connection is gone even if the browser hasn't noticed)
        if (Date.now() - lastPong > 60000) { drop(true); return; }
        N.send({ op: 'ping' });
      }, 20000);
    };
    p.onconnectionstatechange = () => {
      if (pc !== p) return;
      if (p.connectionState === 'failed' || p.connectionState === 'closed') drop(true);
      else if (p.connectionState === 'disconnected') setTimeout(() => { if (pc === p && p.connectionState !== 'connected') drop(true); }, 8000);
    };
    try {
      await p.setLocalDescription(await p.createOffer());
      await gathered(p);
      if (pc !== p) return;
      await send({ k: 'offer', sid: p.sid, sdp: trim(p.localDescription.sdp) });
      answerT = setTimeout(() => { if (pc === p && p.connectionState !== 'connected') drop(true); }, 20000);
    } catch (e) { if (pc === p) drop(true); }
  }
  // One request at a time on a channel. An answer is a short header (JSON), then the file itself in pieces.
  function channel(ch) {
    ch.binaryType = 'arraybuffer';
    const q = [];
    let cur = null, stall = 0;
    const arm = () => { clearTimeout(stall); stall = setTimeout(() => fail(new Error('too slow')), 30000); };
    function next() {
      if (cur || !q.length || ch.readyState !== 'open') return;
      cur = q.shift();
      arm();
      try { ch.send(JSON.stringify(cur.msg)); } catch (e) { fail(e); }
    }
    function done() { clearTimeout(stall); const c = cur; cur = null; c.res({ head: c.head, blob: new Blob(c.parts, { type: c.head.type || '' }) }); next(); }
    function fail(err) { clearTimeout(stall); const c = cur; cur = null; if (c) c.rej(err); next(); }
    ch.onmessage = e => {
      if (typeof e.data === 'string') {
        let m;
        try { m = JSON.parse(e.data); } catch (er) { return; }
        if (!m || typeof m !== 'object') return;
        lastPong = Date.now();
        // (said by your computer on its own: something changed)
        if (m.op === 'v') { if (+m.v !== haveV) sync(); return; }
        if (m.op === 'pong') return;
        if (!cur) return;
        if (m.op === 'file' || m.op === 'proxied') {
          cur.head = m; cur.parts = []; cur.got = 0;
          if (!(m.size > 0)) done(); else arm();
        } else if (m.op === 'nofile' || m.op === 'error') fail(new Error(m.op));
      } else if (cur && cur.head) {
        cur.parts.push(e.data);
        cur.got += e.data.byteLength;
        lastPong = Date.now();
        if (cur.progress) cur.progress(cur.got);
        if (cur.got >= cur.head.size) done(); else arm();
      }
    };
    ch.onclose = () => { clearTimeout(stall); if (cur) { const c = cur; cur = null; c.rej(new Error('closed')); } for (const x of q.splice(0)) x.rej(new Error('closed')); };
    return {
      ready: () => ch.readyState === 'open',
      ask: (msg, progress) => new Promise((res, rej) => { q.push({ msg, res, rej, progress }); next(); }),
      send: m => { try { if (ch.readyState === 'open') ch.send(JSON.stringify(m)); } catch (e) {} }
    };
  }

  // ---------- copying what changed ----------
  let syncing = false, again = false, cleanT = 0;
  async function sync() {
    if (syncing) { again = true; return; }
    syncing = true;
    try {
      do { again = false; await syncOnce(); } while (again && open());
    } catch (e) {
      if (!started) say('Getting your slideshow', 'The connection to your computer was interrupted. Trying again.', { small: 'This screen keeps trying by itself.' });
      else chip('');
      if (open()) setTimeout(sync, 5000);
    } finally { syncing = false; }
  }
  async function syncOnce() {
    if (!F) throw new Error('not connected');
    const r = await F.ask({ op: 'man' });
    const man = JSON.parse(await r.blob.text());
    if (!man || typeof man !== 'object' || !man.files || typeof man.files !== 'object') throw new Error('no list');
    const have = haveMan;
    const todo = [];
    for (const [p, info] of Object.entries(man.files)) {
      if (!okPath(p) || !Array.isArray(info)) continue;
      const old = have && have.files[p];
      if (old && old[0] === info[0] && old[1] === info[1] && await cache.match(keyOf(p))) continue;
      todo.push([p, +info[0] || 0, String(info[1] || '')]);
    }
    // pictures and videos first, the slideshows last: a new slide never shows before its pictures are here
    const rank = p => p.startsWith('m/') ? 0 : p.startsWith('d/') ? 2 : 1;
    todo.sort((a, b) => rank(a[0]) - rank(b[0]));
    const total = todo.reduce((n, x) => n + x[1], 0);
    let doneBytes = 0;
    const show = got => {
      const at = doneBytes + got;
      // (while a slideshow plays, changes come in quietly: nothing shows on the screen)
      if (!started) say('Getting your slideshow', 'This takes a moment the first time. After that the screen plays even when your computer is off.', { progress: total ? at / total : 1, small: total > 524288 ? `${mb(at)} of ${mb(total)} MB` : '' });
    };
    if (todo.length) show(0);
    for (const [p, size, etag] of todo) {
      const x = await F.ask({ op: 'get', path: p }, got => show(got));
      await cache.put(keyOf(p), new Response(x.blob, { headers: { 'Content-Type': x.head.type || x.blob.type || 'application/octet-stream', 'X-BV-Etag': etag } }));
      doneBytes += size || x.blob.size;
    }
    await cache.put(keyOf('__man.json'), new Response(JSON.stringify(man), { headers: { 'Content-Type': 'application/json' } }));
    haveMan = man;
    haveV = +man.v || 0;
    await toSw({ op: 'v', ns, v: haveV });
    chip('');
    if (!started || (man.code && man.code !== code)) start(man.code || code);
    report(true);
    // copies this screen doesn't use any more go a little later (the player may still show them for a moment)
    clearTimeout(cleanT);
    cleanT = setTimeout(async () => {
      const keep = new Set([...Object.keys((haveMan || man).files), '__man.json'].map(keyOf));
      for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req).catch(() => {});
    }, 90000);
  }

  // ---------- what the screen shows, told to your computer (for its TV screens page) ----------
  let lastReport = { p: '', d: '' }, reportAt = 0, reportT = 0;
  function report(force) {
    const t = Date.now();
    if (!force && t - reportAt < 30000) return;
    reportAt = t;
    const m = { p: lastReport.p, d: lastReport.d || `${screen.width}x${screen.height}`, v: haveV, ua: /Tizen/i.test(navigator.userAgent) ? 'Samsung TV' : /Web0S|webOS/i.test(navigator.userAgent) ? 'LG TV' : /AFT|Silk/i.test(navigator.userAgent) ? 'Fire TV' : /CrKey|GoogleTV|Android TV/i.test(navigator.userAgent) ? 'Google TV' : '' };
    if (N) N.send(Object.assign({ op: 'st' }, m));
    else send(Object.assign({ k: 'st' }, m));
  }
  clearInterval(reportT);
  reportT = setInterval(() => report(false), 30000);

  // ---------- the helper (sw.js) asks: a website that a TV can't read directly, and what plays ----------
  navigator.serviceWorker.addEventListener('message', async e => {
    const m = e.data;
    if (!m || m.ns !== ns) return;
    if (m.op === 'report') {
      const p = String(m.p || '').slice(0, 40), d = /^\d{2,5}x\d{2,5}$/.test(m.d || '') ? m.d : '';
      const changed = p !== lastReport.p || d !== lastReport.d;
      lastReport = { p, d };
      if (changed) report(true);
    } else if (m.op === 'proxy' && e.ports && e.ports[0]) {
      const port = e.ports[0];
      if (!N) { port.postMessage({ status: 503 }); return; }
      try {
        const x = await N.ask({ op: 'proxy', url: String(m.url || ''), accept: String(m.accept || '') });
        const body = await x.blob.arrayBuffer();
        port.postMessage({ status: +x.head.status || 502, type: x.head.type || '', body }, [body]);
      } catch (er) { port.postMessage({ status: 502 }); }
    }
  });
  try { navigator.serviceWorker.startMessages(); } catch (e) {}

  // ---------- theater mode on a computer moved this screen to a window of its own: this tab steps aside ----------
  // (the new window is this same page; only one of them may talk to your computer)
  let away = false;
  addEventListener('message', e => {
    if (away || e.origin !== location.origin || e.source !== frame.contentWindow || !e.data || e.data.bvtv !== 'moved') return;
    away = true;
    clearTimeout(helloT); clearTimeout(retryT); clearInterval(reportT); clearTimeout(cleanT);
    drop(false);
    try { if (net) net.close(); } catch (er) {}
    net = null;
    frame.hidden = true;
    frame.src = 'about:blank';
    say('This screen opened in its own window', 'You can close this tab.', { still: true });
    try { window.close(); } catch (er) {}
  });

  // ---------- off we go ----------
  (async () => {
    say('Setting up this screen', 'Looking for your computer.');
    let secret;
    try { secret = C.unb64url(link.s); } catch (e) { secret = null; }
    if (!secret || secret.length < 16) { say('This link isn\'t complete', 'Copy it again from Blokvane: Slideshows and screens, then TV screens.', { still: true }); return; }
    ns = C.hex((await C.sha256(secret)).subarray(0, 8));
    try { await navigator.serviceWorker.register('sw.js', { scope: './' }); await navigator.serviceWorker.ready; }
    catch (e) { say('This browser can\'t play Blokvane screens', 'It doesn\'t let pages keep a copy of the slideshow. Try Chrome or Edge.', { bad: true }); return; }
    cache = await caches.open('bvtv-' + ns);
    haveMan = await savedMan();
    haveV = haveMan ? +haveMan.v || 0 : 0;
    // what this screen has already plays right away (even with the computer off)
    if (haveMan) { await toSw({ op: 'v', ns, v: haveV }); start(haveMan.code || ''); }
    keys = await C.secretKeys(secret, 'bvtv');
    let jwk = null;
    try { jwk = JSON.parse(localStorage.getItem('bvtv:me:' + ns) || 'null'); } catch (e) {}
    try { me = await C.newMember(jwk || undefined); } catch (e) { me = await C.newMember(); }
    try { localStorage.setItem('bvtv:me:' + ns, JSON.stringify(me.jwk)); } catch (e) {}
    gate = NET.gate({ key: keys.key, topic: keys.topic, check: C.verifier(), known: id => id === link.owner });
    net = NET.create({ onMessage: onRelay });
    net.join(keys.topic);
    // (the relays need a moment to connect)
    setTimeout(hello, 1200);
    // back online after the network dropped: look for your computer again
    addEventListener('online', () => { if (!open()) { helloN = 0; hello(); } });
  })().catch(() => say('Something went wrong', 'Reload this page to try again.', { bad: true }));
})();
