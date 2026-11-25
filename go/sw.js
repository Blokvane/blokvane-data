// Blokvane on your phone: the small helper that lets a browser offer "Install" (an app icon on the home screen) for
// this page. It keeps nothing and changes nothing: every page still comes straight from the internet, and only when
// the phone is offline does it answer with a short "you're offline" page instead of the browser's error.
const OFFLINE = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blokvane</title>' +
  '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#0b0f17;color:#f3f5fa;font:18px/1.5 system-ui,sans-serif;text-align:center;padding:24px">' +
  '<div><svg viewBox="10 0 40 52" width="72" height="94" aria-hidden="true"><path d="M14 22C14 3 46 3 46 22V46.8Q46 50 42.5 50Q39 50 39 46.8A3.25 2.8 0 0 0 32.5 46.8Q32.5 50 29.25 50Q26 50 26 46.8A2.75 2.8 0 0 0 20.5 46.8Q20.5 50 17.25 50Q14 50 14 46.8Z" fill="#fff"/><ellipse cx="23.6" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><ellipse cx="35.4" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><circle cx="24.4" cy="22.6" r="1.2" fill="#fff"/><circle cx="36.2" cy="22.6" r="1.2" fill="#fff"/></svg><h1 style="font-size:24px;margin:8px 0">You\'re offline</h1><p style="color:#9ca8bb">Blokvane needs the internet to reach your computer. Connect, then try again.</p>' +
  '<button onclick="location.reload()" style="margin-top:12px;font:700 17px system-ui;padding:14px 22px;border:0;border-radius:16px;background:#ff6b5e;color:#fff">Try again</button></div></body>';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
// (the Ad Blocker app has its own look and nothing to do with a computer: its "you're offline" page says so)
const OFFLINE_AD = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blokvane Ad Blocker</title>' +
  '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#f5efe3;color:#1f1b16;font:18px/1.5 system-ui,sans-serif;text-align:center;padding:24px">' +
  '<div><img src="ads-192.png" alt="" width="84" height="84" style="border-radius:20px"><h1 style="font:700 30px Georgia,serif;margin:14px 0 6px">You\'re offline</h1><p style="color:#5d554a;margin:0">This app needs the internet to look at this phone. Connect, then try again.</p>' +
  '<button onclick="location.reload()" style="margin-top:18px;font:700 17px system-ui;padding:14px 24px;border:0;border-radius:999px;background:#1f1b16;color:#fff;box-shadow:0 6px 0 #d94c42">Try again</button></div></body>';
self.addEventListener('fetch', e => {
  if (e.request.mode !== 'navigate') return;
  const page = /\/adblock\.html(?:$|[?#])/.test(e.request.url) ? OFFLINE_AD : OFFLINE;
  e.respondWith(fetch(e.request).catch(() => new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
