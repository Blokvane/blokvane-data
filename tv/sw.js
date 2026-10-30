// Blokvane Screens anywhere: the helper behind the slideshow player on a TV. The player was made for Blokvane Screens on
// a computer in your home or office, which hands out its files and answers a few questions (/api/wait: "anything new?",
// /proxy: "read this website for me"). Here this helper does the same from the copies tv.js keeps in this browser:
// - the player's own files, this screen's slideshows (d/state.json), and their pictures and videos (m/...), with the
//   parts of a video the browser asks for (so videos can loop and jump);
// - /api/wait answers as soon as tv.js has copied a change (or after 25 seconds of nothing new);
// - /proxy asks tv.js, which asks your computer (for websites a TV can't read directly).
// It only answers for the player of a link (pages at run/<link's box>/...), and only from that link's own copies.
'use strict';
const SCOPE = new URL(self.registration.scope);
const RUN = SCOPE.pathname + 'run/';
const boxes = new Map();   // link's box -> { v, waiters: Set }

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

const keyOf = (ns, p) => new URL('/__bvtv/' + ns + '/' + p, self.location.origin).href;
function nsOf(url) {
  try {
    const u = new URL(url);
    if (u.origin !== self.location.origin || !u.pathname.startsWith(RUN)) return '';
    const m = /^([0-9a-f]{16})\//.exec(u.pathname.slice(RUN.length));
    return m ? m[1] : '';
  } catch (e) { return ''; }
}
async function box(ns) {
  let b = boxes.get(ns);
  if (b) return b;
  b = { v: 0, waiters: new Set() };
  boxes.set(ns, b);
  try {
    const r = await (await caches.open('bvtv-' + ns)).match(keyOf(ns, '__man.json'));
    if (r) b.v = +(await r.json()).v || 0;
  } catch (e) {}
  return b;
}

// tv.js: a change is all copied
self.addEventListener('message', async e => {
  const m = e.data;
  if (!m || m.op !== 'v' || !/^[0-9a-f]{16}$/.test(m.ns || '')) return;
  const b = await box(m.ns);
  b.v = +m.v || 0;
  for (const w of [...b.waiters]) w();
});

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const tell = async (m, transfer) => {
  const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const w of wins) if (nsOf(w.url) === '') { try { w.postMessage(m, transfer || []); } catch (e) {} }
};

self.addEventListener('fetch', e => {
  const req = e.request;
  let url;
  try { url = new URL(req.url); } catch (er) { return; }
  // other websites: the player's widgets reach them directly, as usual
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    const ns = nsOf(req.url);
    if (ns) e.respondWith(page(ns));
    return;
  }
  e.respondWith((async () => {
    const client = e.clientId ? await self.clients.get(e.clientId) : null;
    const ns = client ? nsOf(client.url) : '';
    if (!ns) return fetch(req);
    return serve(ns, url, req).catch(() => new Response('', { status: 500 }));
  })());
});

// the player's page, with a note that it plays from a link (so it leaves out what only works on your network)
async function page(ns) {
  const r = await (await caches.open('bvtv-' + ns)).match(keyOf(ns, 'screen.html'));
  if (!r) return new Response('<!doctype html><meta charset="utf-8"><body style="background:#000"></body>', { headers: { 'Content-Type': 'text/html' } });
  const html = (await r.text()).replace(/<head>/i, '<head>\n<meta name="bv-anywhere" content="1">');
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

async function serve(ns, url, req) {
  const path = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  // "anything new?": answers when tv.js has copied a change, or after 25 seconds
  if (path === 'api/wait') {
    const b = await box(ns);
    const v = +url.searchParams.get('v') || 0;
    if (url.searchParams.has('s')) tell({ op: 'report', ns, p: url.searchParams.get('p') || '', d: url.searchParams.get('d') || '' });
    // (the player keeps the number it was given and asks again with it: it waits here until there's a new one)
    if (v && v === (b.v || 1)) {
      await new Promise(res => { const done = () => { clearTimeout(t); b.waiters.delete(done); res(); }; const t = setTimeout(done, 25000); b.waiters.add(done); });
    }
    return json({ v: b.v || 1 });
  }
  // a website the TV can't read directly: your computer reads it (through tv.js)
  if (path === 'proxy') {
    const target = url.searchParams.get('url') || '';
    const ch = new MessageChannel();
    const answer = new Promise(res => { const t = setTimeout(() => res({ status: 504 }), 20000); ch.port1.onmessage = ev => { clearTimeout(t); res(ev.data || { status: 502 }); }; });
    await tell({ op: 'proxy', ns, url: target, accept: req.headers.get('Accept') || '' }, [ch.port2]);
    const a = await answer;
    if (!a.body) return new Response('', { status: a.status || 502 });
    return new Response(a.body, { status: a.status || 200, headers: { 'Content-Type': a.type || 'application/octet-stream', 'Cache-Control': 'no-store' } });
  }
  // (the phone remote and the rest of Blokvane Screens' questions only work on your network)
  if (path.startsWith('api/') || path === 'remote.html') return json({ error: 'not here' }, 404);
  const c = await caches.open('bvtv-' + ns);
  const hit = await c.match(keyOf(ns, path));
  if (!hit) return new Response('', { status: 404 });
  const tag = hit.headers.get('X-BV-Etag') || '';
  const type = hit.headers.get('Content-Type') || 'application/octet-stream';
  if (tag && req.headers.get('If-None-Match') === tag) return new Response(null, { status: 304, headers: { ETag: tag } });
  const blob = await hit.blob();
  const head = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': path.startsWith('d/') ? 'no-store' : 'no-cache' };
  if (tag) head.ETag = tag;
  // part of a file (videos and sounds ask for the part they play)
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('Range') || '');
  if (range && blob.size) {
    let start = range[1] === '' ? NaN : +range[1], end = range[2] === '' ? NaN : +range[2];
    if (isNaN(start)) { start = Math.max(0, blob.size - (isNaN(end) ? 0 : end)); end = blob.size - 1; }
    if (isNaN(end) || end >= blob.size) end = blob.size - 1;
    if (start > end || start >= blob.size) return new Response('', { status: 416, headers: { 'Content-Range': `bytes */${blob.size}` } });
    return new Response(blob.slice(start, end + 1, type), { status: 206, headers: Object.assign(head, { 'Content-Range': `bytes ${start}-${end}/${blob.size}`, 'Content-Length': String(end - start + 1) }) });
  }
  head['Content-Length'] = String(blob.size);
  return new Response(blob, { headers: head });
}
