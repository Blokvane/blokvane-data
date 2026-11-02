// Blokvane on your phone: the small helper that lets a browser offer "Install" (an app icon on the home screen) for
// this page. It keeps nothing and changes nothing: every page still comes straight from the internet, and only when
// the phone is offline does it answer with a short "you're offline" page instead of the browser's error.
const OFFLINE = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blokvane</title>' +
  '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f17;color:#f3f5fa;font:18px/1.5 system-ui,sans-serif;text-align:center;padding:24px">' +
  '<div><div style="font-size:64px">👻</div><h1 style="font-size:24px;margin:8px 0">You\'re offline</h1><p style="color:#9ca8bb">Blokvane needs the internet to reach your computer. Connect, then try again.</p>' +
  '<button onclick="location.reload()" style="margin-top:12px;font:700 17px system-ui;padding:14px 22px;border:0;border-radius:16px;background:#ff6b5e;color:#fff">Try again</button></div></body>';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
