// Blokvane Watch Together: getting sealed messages between friends with no server of our own.
// Every message goes out through several free public relays at once (Nostr relays and MQTT brokers), and the
// first copy to arrive wins. If one relay is down, slow or refuses us, the others carry on, and a better one is
// picked. A relay counts as working only when our own messages come back through it, byte for byte.
// Copies are told apart by a hash of the whole message, so a relay that sends a changed copy first can't make the
// real one look like a repeat. What a party does with a message is in gate(): only messages that open with the party
// key count against any allowance (each member's own, and one that everyone the party doesn't count in yet shares),
// so neither someone who only sees the public topic nor a crowd of self-made member keys can push the party's own
// messages out by flooding it. The relays only ever see sealed bytes on a random-looking topic:
// never names, chat, videos or the party code. Plain script for the service worker: defines BVWT_NET (needs BVWT_CORE).
var BVWT_NET = (() => {
  'use strict';
  const C = BVWT_CORE;
  // Nostr relays that pass along short-lived (ephemeral) events, from the list the Trystero project keeps
  // tested (October 2026). Each party uses 4 of them, picked the same way by everyone in it.
  const NOSTR = ['0x-nostr-relay.fly.dev', 'cdn.satellite.earth', 'nos.lol', 'nostr.chaima.info', 'nostr.christiansass.de', 'nostr.rblb.it',
    'nostr.red5d.dev', 'nostr.robosats.org', 'nostr.stakey.net', 'nostrcity-club.fly.dev', 'relay-dev.gulugulu.moe', 'relay.aarpia.com', 'relay.agentry.com',
    'relay.bitmacro.cloud', 'relay.bullishbounty.com', 'relay.degmods.com', 'relay.flashapp.me', 'relay.grigic.org', 'relay.hackshed.dev', 'relay.kaleidoswap.com',
    'relay.layer.systems', 'relay.nostr.blockhenge.com', 'relay.nostr.dev.br', 'relay.nostrmap.net', 'relay.novospes.com', 'relay.piazza.today', 'relay.routstr.com',
    'testr.nymble.world'].map(h => 'wss://' + h);
  // Public MQTT brokers. All of them call themselves test services with no promise they stay up, which is
  // why they're used together with the Nostr relays and never alone. (test.mosquitto.org was dropped: its secure
  // websocket mostly turns connections away.)
  const MQTT = [{ url: 'wss://broker.emqx.io:8084/mqtt' }, { url: 'wss://broker.hivemq.com:8884/mqtt' },
    { url: 'wss://public.cloud.shiftr.io', user: 'public', pass: 'public' }];
  const NOSTR_PER_ROOM = 4;
  const ECHO_WAIT = 8000;            // our own message should be back by then
  const MISSES_BAD = 3;              // this many missing in a row: try another relay
  const RETRY = [1000, 3000, 8000, 20000, 45000, 90000, 180000];
  const MAX_BAD = 6 * 3600000;       // a relay that has never worked here is left alone for up to 6 hours
  const MAX_OWN = 8;                 // a relay list from settings uses at most this many of each kind
  // allowances, counted only for messages that open with the party key (in one burst, then each second)
  const PER_SENDER = 20, PER_SENDER_BURST = 40;    // each member the party counts in: their own, shared with nobody
  const CHECKS = 40, CHECKS_BURST = 80;            // signature checks for messages that say they're from one such member
  const NEW = 40, NEW_BURST = 80;                  // everyone else (someone new, or made-up members), all together

  // a relay address we may use: secure websockets, or plain ones on this computer (for checks)
  function okUrl(u) {
    try { const x = new URL(u); return x.protocol === 'wss:' || (x.protocol === 'ws:' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(x.hostname)); } catch (e) { return false; }
  }
  // A relay list from settings (bvWatchRelays: { nostr: [urls], mqtt: [{ url, user, pass }] }): checked, repeats
  // removed and cut to 8 of each kind. A kind that isn't given keeps the built-in list; an empty list means none of
  // that kind. null when the list is missing, or would leave no relay at all (then the built-in ones stay).
  function relaysFrom(x) {
    if (!x || typeof x !== 'object' || !(Array.isArray(x.nostr) || Array.isArray(x.mqtt))) return null;
    const nostr = Array.isArray(x.nostr) ? [...new Set(x.nostr.filter(u => typeof u === 'string' && u.length < 300 && okUrl(u)))].slice(0, MAX_OWN) : NOSTR;
    const seen = new Set(), s = v => (typeof v === 'string' && v.length < 200 ? v : undefined);
    const mqtt = Array.isArray(x.mqtt) ? x.mqtt.filter(m => m && typeof m.url === 'string' && m.url.length < 300 && okUrl(m.url) && !seen.has(m.url) && seen.add(m.url))
      .slice(0, MAX_OWN).map(m => ({ url: m.url, user: s(m.user), pass: s(m.pass) })) : MQTT;
    return nostr.length || mqtt.length ? { nostr, mqtt } : null;
  }
  // everyone in a party shuffles the relay list the same way (seeded by the topic), so they meet on the same ones
  function shuffled(list, topic) {
    let a = parseInt(topic.slice(0, 8), 16) >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }

  // o: { onMessage(topic, bytes, url, at) (may return a promise: messages are handed over one at a time, in order),
  //      onChange(), relays: { nostr: [urls], mqtt: [{ url, user, pass }] } (optional), now(), WebSocket,
  //      memory: { load(), save(obj) } (optional: what was learned about the relays, kept between restarts) }
  function create(o) {
    const now = o.now || (() => Date.now());
    const WS = o.WebSocket || WebSocket;
    const nostrList = ((o.relays && o.relays.nostr) || NOSTR).filter(okUrl);
    const mqttList = ((o.relays && o.relays.mqtt) || MQTT).filter(m => m && okUrl(m.url));
    const conns = new Map();   // url -> connection
    const rooms = new Map();   // topic -> { topic, order }
    const health = new Map();  // url -> { badUntil, strikes }
    const pending = new Map(); // hash of my own message -> { at, urls }
    const seen = new Map();    // hash of a whole message -> time (the first copy wins)
    let signer = null, timer = 0, inbox = Promise.resolve();
    const echoWait = o.echoWait || ECHO_WAIT, perRoom = o.perRoom || NOSTR_PER_ROOM;
    const changed = () => { try { o.onChange && o.onChange(); } catch (e) {} };
    const isBad = url => { const h = health.get(url); return !!(h && h.badUntil > now()); };
    // Every try at a relay that is down shows up as an error in the browser, so a relay that keeps failing is left
    // alone for longer and longer: one that has worked here before for 2 minutes, then up to 30; one that never has
    // for 10 minutes, then up to 6 hours. With o.memory that is kept between restarts too.
    let saveT = 0;
    function remember() {
      if (!o.memory || saveT) return;
      saveT = setTimeout(() => {
        saveT = 0;
        const out = {}, t = now();
        for (const [url, h] of health) if (h.badUntil > t || h.ok) out[url] = { badUntil: h.badUntil, strikes: h.strikes, ok: !!h.ok };
        try { o.memory.save(out); } catch (e) {}
      }, 1500);
    }
    function strike(url, why) {
      const h = health.get(url) || { badUntil: 0, strikes: 0, ok: false };
      h.strikes++;
      if (h.strikes >= 5) h.ok = false;
      h.badUntil = now() + (h.ok ? Math.min(30 * 60000, 120000 * 2 ** Math.min(h.strikes - 1, 4)) : Math.min(MAX_BAD, 600000 * 3 ** Math.min(h.strikes - 1, 4)));
      h.why = why;
      health.set(url, h);
      remember();
      const c = conns.get(url);
      if (c) c.close();
      rebalance();
    }

    // (no allowance here: nothing is known about a message until it's opened, so none is charged before that)
    function deliver(topic, bytes, url) {
      if (!rooms.has(topic) || !bytes || bytes.length < 29 || bytes.length > 16384) return;
      const at = now();
      const c = conns.get(url);
      if (c) c.lastIn = at;
      inbox = inbox.then(async () => {
        const id = C.hex(await C.sha256(bytes));
        const p = pending.get(id);
        if (p) {                                 // our own message came back, unchanged: that relay works
          const cc = conns.get(url);
          if (cc) {
            cc.misses = 0; cc.oks++; cc.lastEcho = now();
            const h = health.get(url);
            if (!h) { health.set(url, { badUntil: 0, strikes: 0, ok: true }); remember(); } else if (!h.ok || h.strikes) { h.ok = true; h.strikes = 0; remember(); }
          }
          p.urls.delete(url);
          return;
        }
        if (seen.has(id) || !rooms.has(topic)) return;
        seen.set(id, now());
        if (seen.size > 3000) { const cut = [...seen.keys()].slice(0, 1000); for (const k of cut) seen.delete(k); }
        await o.onMessage(topic, bytes, url, at);
      }).catch(() => {});
    }

    // ---------- one connection ----------
    function base(url, type) {
      return { url, type, ws: null, state: 'idle', topics: new Set(), tries: 0, retryAt: 0, misses: 0, oks: 0, lastIn: 0, lastEcho: 0, slowUntil: 0, opened: 0,
        close() { this.state = 'closed'; clearTimeout(this.t1); clearInterval(this.t2); try { if (this.ws) { this.ws.onclose = this.ws.onerror = this.ws.onmessage = this.ws.onopen = null; this.ws.close(); } } catch (e) {} this.ws = null; },
        failed() {
          const was = this.state;
          this.close();
          this.state = 'retry';
          if (!this.opened || now() - this.opened < 30000) this.tries++;
          this.opened = 0;
          if (this.tries >= 3) { this.tries = 0; strike(this.url, 'cannot connect'); return; }
          this.retryAt = now() + RETRY[Math.min(this.tries, RETRY.length - 1)] * (0.75 + Math.random() * 0.5);
          if (was === 'open') changed();
        } };
    }
    function nostrConn(url) {
      const c = base(url, 'nostr');
      const subId = topic => 'bvw' + topic.slice(0, 13);
      const req = topic => JSON.stringify(['REQ', subId(topic), { kinds: [C.nostrKind(topic)], '#x': [topic], since: Math.floor(now() / 1000) - 5 }]);
      c.open = () => {
        c.state = 'connecting';
        let ws;
        try { ws = c.ws = new WS(url); } catch (e) { c.failed(); return; }
        c.t1 = setTimeout(() => { if (c.state === 'connecting') c.failed(); }, 10000);
        ws.onopen = () => { clearTimeout(c.t1); c.state = 'open'; c.opened = now(); c.tries = 0; for (const t of c.topics) ws.send(req(t)); changed(); };
        ws.onclose = ws.onerror = () => { if (c.state !== 'closed') c.failed(); };
        ws.onmessage = ev => {
          let m;
          try { m = JSON.parse(typeof ev.data === 'string' ? ev.data : ''); } catch (e) { return; }
          if (!Array.isArray(m)) return;
          if (m[0] === 'EVENT' && m[2] && typeof m[2].content === 'string' && Array.isArray(m[2].tags)) {
            const tag = m[2].tags.find(t => Array.isArray(t) && t[0] === 'x');
            if (!tag || !c.topics.has(tag[1]) || m[1] !== subId(tag[1]) || m[2].content.length > 12000) return;
            let bytes;
            try { bytes = C.unb64(m[2].content); } catch (e) { return; }
            deliver(tag[1], bytes, url);
          } else if (m[0] === 'OK' && m[2] === false) {
            const why = String(m[3] || '');
            if (/^rate-limited/i.test(why)) c.slowUntil = now() + 30000;
            else if (/^(blocked|restricted|auth-required|pow|invalid)/i.test(why)) strike(url, why.slice(0, 80));
          } else if (m[0] === 'CLOSED' && typeof m[2] === 'string' && /^(blocked|restricted|auth-required|pow|error)/i.test(m[2])) strike(url, m[2].slice(0, 80));
        };
      };
      c.sub = t => { if (c.state === 'open') c.ws.send(req(t)); };
      c.unsub = t => { if (c.state === 'open') c.ws.send(JSON.stringify(['CLOSE', subId(t)])); };
      c.publish = (t, ev) => { if (c.state === 'open' && c.ws.readyState === 1 && now() >= c.slowUntil) { c.ws.send(ev); return true; } return false; };
      return c;
    }
    function mqttConn(cfg) {
      const c = base(cfg.url, 'mqtt');
      let buf = new Uint8Array(0), pid = 1;
      const mt = t => 'bvwatch/' + t;
      c.open = () => {
        c.state = 'connecting';
        let ws;
        try { ws = c.ws = new WS(cfg.url, 'mqtt'); ws.binaryType = 'arraybuffer'; } catch (e) { c.failed(); return; }
        c.t1 = setTimeout(() => { if (c.state === 'connecting') c.failed(); }, 10000);
        ws.onopen = () => { try { ws.send(C.MQ.connect('bvw' + C.hex(C.rand(8)), cfg.user, cfg.pass, 60)); } catch (e) { c.failed(); } };
        ws.onclose = ws.onerror = () => { if (c.state !== 'closed') c.failed(); };
        ws.onmessage = ev => {
          if (!(ev.data instanceof ArrayBuffer)) return;
          buf = buf.length ? C.concat(buf, new Uint8Array(ev.data)) : new Uint8Array(ev.data);
          let r;
          try { r = C.MQ.read(buf); } catch (e) { c.failed(); return; }
          buf = r.rest;
          if (buf.length > 65536) { c.failed(); return; }
          for (const p of r.list) {
            if (p.type === 2) {                                   // CONNACK
              if (p.body[1] !== 0) { strike(cfg.url, 'refused ' + p.body[1]); return; }
              clearTimeout(c.t1);
              c.state = 'open'; c.opened = now(); c.tries = 0;
              for (const t of c.topics) c.sub(t);
              c.lastPong = now();
              c.t2 = setInterval(() => {
                if (now() - c.lastPong > 70000) { c.failed(); return; }
                try { if (ws.readyState === 1) ws.send(C.MQ.ping()); } catch (e) {}
              }, 25000);
              changed();
            } else if (p.type === 3) {                            // PUBLISH
              const { topic, payload } = C.MQ.publishParts(p.flags, p.body);
              if (topic.startsWith('bvwatch/')) { const t = topic.slice(8); if (c.topics.has(t)) deliver(t, payload.slice(), cfg.url); }
            } else if (p.type === 9) {                            // SUBACK
              if (p.body[2] === 0x80) strike(cfg.url, 'subscribe refused');
            } else if (p.type === 13) c.lastPong = now();         // PINGRESP
          }
        };
      };
      c.sub = t => { if (c.state === 'open') { pid = pid % 65535 + 1; c.ws.send(C.MQ.subscribe(pid, mt(t))); } };
      c.unsub = t => { if (c.state === 'open') { pid = pid % 65535 + 1; c.ws.send(C.MQ.unsubscribe(pid, mt(t))); } };
      c.publish = (t, bytes) => { if (c.state === 'open' && c.ws.readyState === 1) { c.ws.send(C.MQ.publish(mt(t), bytes)); return true; } return false; };
      const close0 = c.close;
      c.close = function () { try { if (this.ws && this.ws.readyState === 1) this.ws.send(C.MQ.bye()); } catch (e) {} buf = new Uint8Array(0); close0.call(this); };
      return c;
    }

    // ---------- which relays each party uses ----------
    function wanted() {
      const want = new Map(); // url -> Set(topics)
      for (const r of rooms.values()) {
        let n = 0;
        for (const url of r.order) { if (n >= perRoom) break; if (isBad(url)) continue; n++; (want.get(url) || want.set(url, new Set()).get(url)).add(r.topic); }
        for (const m of mqttList) if (!isBad(m.url)) (want.get(m.url) || want.set(m.url, new Set()).get(m.url)).add(r.topic);
      }
      return want;
    }
    function rebalance() {
      const want = wanted();
      for (const [url, c] of conns) {
        if (!want.has(url)) { for (const t of c.topics) c.unsub(t); c.close(); conns.delete(url); continue; }
        const ts = want.get(url);
        for (const t of [...c.topics]) if (!ts.has(t)) { c.topics.delete(t); c.unsub(t); }
        for (const t of ts) if (!c.topics.has(t)) { c.topics.add(t); c.sub(t); }
      }
      for (const [url, ts] of want) {
        if (conns.has(url)) continue;
        const cfg = mqttList.find(m => m.url === url);
        const c = cfg ? mqttConn(cfg) : nostrConn(url);
        c.topics = new Set(ts);
        conns.set(url, c);
        c.open();
      }
      if (rooms.size && !timer) timer = setInterval(maintain, Math.min(2000, echoWait / 2));
      if (!rooms.size && timer) { clearInterval(timer); timer = 0; }
      changed();
    }
    // (what was learned before a restart: relays that were failing stay left alone)
    if (o.memory) {
      Promise.resolve().then(() => o.memory.load()).then(saved => {
        if (!saved || typeof saved !== 'object') return;
        const t = now();
        for (const [url, h] of Object.entries(saved)) {
          if (!h || typeof h !== 'object' || health.has(url) || typeof url !== 'string' || url.length > 300) continue;
          health.set(url, { badUntil: Math.min(+h.badUntil || 0, t + MAX_BAD), strikes: Math.max(0, Math.min(+h.strikes || 0, 8)), ok: !!h.ok });
        }
        if (rooms.size) rebalance();
      }).catch(() => {});
    }
    function maintain() {
      const t = now();
      for (const c of conns.values()) if (c.state === 'retry' && t >= c.retryAt) c.open();
      for (const [id, p] of pending) {
        if (t - p.at < echoWait) continue;
        pending.delete(id);
        for (const url of p.urls) { const c = conns.get(url); if (c && c.state === 'open' && ++c.misses >= MISSES_BAD) strike(url, 'messages not coming back'); }
      }
      for (const [k, at] of seen) { if (t - at > 120000) seen.delete(k); else break; }
    }

    async function publish(topic, bytes) {
      if (!rooms.has(topic)) return 0;
      const id = C.hex(await C.sha256(bytes));
      const targets = [...conns.values()].filter(c => c.state === 'open' && c.topics.has(topic));
      const p = { at: now(), urls: new Set() };
      pending.set(id, p);
      let sent = 0;
      for (const c of targets) if (c.type === 'mqtt' && c.publish(topic, bytes)) { p.urls.add(c.url); sent++; }
      const ns = targets.filter(c => c.type === 'nostr');
      if (ns.length) {
        try {
          signer = signer || C.newSigner();
          const ev = JSON.stringify(['EVENT', await C.nostrEvent(signer, topic, C.b64(bytes))]);
          for (const c of ns) if (c.publish(topic, ev)) { p.urls.add(c.url); sent++; }
        } catch (e) {}
      }
      return sent;
    }
    function join(topic) {
      if (!/^[0-9a-f]{40}$/.test(topic) || rooms.has(topic)) return;
      rooms.set(topic, { topic, order: shuffled(nostrList, topic) });
      rebalance();
    }
    function leave(topic) { if (rooms.delete(topic)) rebalance(); }
    function stats(topic) {
      const list = [...conns.values()].filter(c => !topic || c.topics.has(topic));
      const t = now();
      const good = list.filter(c => c.state === 'open' && (c.lastEcho > t - 60000 || (c.opened > t - 20000 && !c.misses)));
      return { open: list.filter(c => c.state === 'open').length, good: good.length, total: list.length,
        relays: list.map(c => ({ host: (() => { try { return new URL(c.url).host; } catch (e) { return c.url; } })(), type: c.type, state: c.state, ok: good.includes(c) })) };
    }
    function close() { for (const c of conns.values()) c.close(); conns.clear(); rooms.clear(); if (timer) clearInterval(timer); timer = 0; }
    return { join, leave, publish, stats, close, _conns: conns, _health: health };
  }
  // an allowance: up to `burst` at once, then `rate` more each second
  function bucket(rate, burst, now) {
    let n = burst, at = now();
    return () => { const t = now(); n = Math.min(burst, n + Math.max(0, t - at) * rate / 1000); at = t; if (n < 1) return false; n -= 1; return true; };
  }
  // What a party does with each new message (repeats are already gone). Returns the message, or null to drop it.
  // 1. Open it with the party key. Junk from someone who only knows the public topic stops here, and never counts
  //    against any allowance (opening is cheap, and real messages must never wait behind junk).
  // 2. Who it says it's from: the id made from the key in it. Anyone with the party code can make as many keys as they
  //    like, so allowances go by who the party already counts in (o.known(id): the people here, the host, and the
  //    people the host says are here). Each of them has allowances of their own that nobody else can use up: CHECKS
  //    signature checks a second, then PER_SENDER messages a second. (Someone who copies their key into fake messages
  //    only spends that person's checks, and has to send more than CHECKS a second to get in their way.)
  // 3. Everyone else shares one allowance, NEW signature checks a second: a crowd of self-made keys can only slow down
  //    new people joining, never the people already in the party.
  // o: { key, topic, check (from BVWT_CORE.verifier()), known(id), now, and the allowances to use instead of the usual ones }
  function gate(o) {
    const now = o.now || (() => Date.now());
    const known = typeof o.known === 'function' ? o.known : () => false;
    const fresh = bucket(o.fresh || NEW, o.freshBurst || NEW_BURST, now);
    const checks = new Map(), sends = new Map();
    const own = (map, id, rate, burst) => {
      let b = map.get(id);
      if (!b) { if (map.size >= 200) map.delete(map.keys().next().value); b = bucket(rate, burst, now); map.set(id, b); }
      return b();
    };
    return async bytes => {
      const m = await C.openSigned(o.key, o.topic, bytes);
      if (!m || !m.m || typeof m.m.f !== 'string') return null;
      const said = await C.memberId(m.pk);   // (the signature check makes sure of it; here it only picks the allowance)
      if (said !== m.m.f) return null;
      const member = !!known(said);
      if (member ? !own(checks, said, o.checks || CHECKS, o.checksBurst || CHECKS_BURST) : !fresh()) return null;
      const id = await o.check(o.topic, m);
      if (!id) return null;
      if (member && !own(sends, id, o.perSender || PER_SENDER, o.perSenderBurst || PER_SENDER_BURST)) return null;
      return m.m;
    };
  }
  return { create, gate, bucket, NOSTR, MQTT, shuffled, okUrl, relaysFrom, MAX_OWN, PER_SENDER, PER_SENDER_BURST, CHECKS, CHECKS_BURST, NEW, NEW_BURST };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BVWT_NET;
