// Made from wt-net.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change wt-net.js and run node tools/old-js.js again.
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var BVWT_NET = (() => {
  "use strict";
  const C = BVWT_CORE;
  const NOSTR = [
    "0x-nostr-relay.fly.dev",
    "cdn.satellite.earth",
    "nos.lol",
    "nostr.chaima.info",
    "nostr.christiansass.de",
    "nostr.rblb.it",
    "nostr.red5d.dev",
    "nostr.robosats.org",
    "nostr.stakey.net",
    "nostrcity-club.fly.dev",
    "relay-dev.gulugulu.moe",
    "relay.aarpia.com",
    "relay.agentry.com",
    "relay.bitmacro.cloud",
    "relay.bullishbounty.com",
    "relay.degmods.com",
    "relay.flashapp.me",
    "relay.grigic.org",
    "relay.hackshed.dev",
    "relay.kaleidoswap.com",
    "relay.layer.systems",
    "relay.nostr.blockhenge.com",
    "relay.nostr.dev.br",
    "relay.nostrmap.net",
    "relay.novospes.com",
    "relay.piazza.today",
    "relay.routstr.com",
    "testr.nymble.world"
  ].map((h) => "wss://" + h);
  const MQTT = [
    { url: "wss://broker.emqx.io:8084/mqtt" },
    { url: "wss://broker.hivemq.com:8884/mqtt" },
    { url: "wss://public.cloud.shiftr.io", user: "public", pass: "public" }
  ];
  const NOSTR_PER_ROOM = 4;
  const ECHO_WAIT = 8e3;
  const MISSES_BAD = 3;
  const RETRY = [1e3, 3e3, 8e3, 2e4, 45e3, 9e4, 18e4];
  const MAX_BAD = 6 * 36e5;
  const MAX_OWN = 8;
  const PER_SENDER = 20, PER_SENDER_BURST = 40;
  const CHECKS = 40, CHECKS_BURST = 80;
  const NEW = 40, NEW_BURST = 80;
  function okUrl(u) {
    try {
      const x = new URL(u);
      return x.protocol === "wss:" || x.protocol === "ws:" && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(x.hostname);
    } catch (e) {
      return false;
    }
  }
  function relaysFrom(x) {
    if (!x || typeof x !== "object" || !(Array.isArray(x.nostr) || Array.isArray(x.mqtt))) return null;
    const nostr = Array.isArray(x.nostr) ? [...new Set(x.nostr.filter((u) => typeof u === "string" && u.length < 300 && okUrl(u)))].slice(0, MAX_OWN) : NOSTR;
    const seen = /* @__PURE__ */ new Set(), s = (v) => typeof v === "string" && v.length < 200 ? v : void 0;
    const mqtt = Array.isArray(x.mqtt) ? x.mqtt.filter((m) => m && typeof m.url === "string" && m.url.length < 300 && okUrl(m.url) && !seen.has(m.url) && seen.add(m.url)).slice(0, MAX_OWN).map((m) => ({ url: m.url, user: s(m.user), pass: s(m.pass) })) : MQTT;
    return nostr.length || mqtt.length ? { nostr, mqtt } : null;
  }
  function shuffled(list, topic) {
    let a = parseInt(topic.slice(0, 8), 16) >>> 0;
    const rnd = () => {
      a = a + 1831565813 >>> 0;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function create(o) {
    const now = o.now || (() => Date.now());
    const WS = o.WebSocket || WebSocket;
    const nostrList = C.canSign === false ? [] : (o.relays && o.relays.nostr || NOSTR).filter(okUrl);
    const mqttList = (o.relays && o.relays.mqtt || MQTT).filter((m) => m && okUrl(m.url));
    const conns = /* @__PURE__ */ new Map();
    const rooms = /* @__PURE__ */ new Map();
    const health = /* @__PURE__ */ new Map();
    const pending = /* @__PURE__ */ new Map();
    const seen = /* @__PURE__ */ new Map();
    let signer = null, timer = 0, inbox = Promise.resolve();
    const echoWait = o.echoWait || ECHO_WAIT, perRoom = o.perRoom || NOSTR_PER_ROOM;
    const changed = () => {
      try {
        o.onChange && o.onChange();
      } catch (e) {
      }
    };
    const isBad = (url) => {
      const h = health.get(url);
      return !!(h && h.badUntil > now());
    };
    let saveT = 0;
    function remember() {
      if (!o.memory || saveT) return;
      saveT = setTimeout(() => {
        saveT = 0;
        const out = {}, t = now();
        for (const [url, h] of health) if (h.badUntil > t || h.ok) out[url] = { badUntil: h.badUntil, strikes: h.strikes, ok: !!h.ok };
        try {
          o.memory.save(out);
        } catch (e) {
        }
      }, 1500);
    }
    function strike(url, why) {
      const h = health.get(url) || { badUntil: 0, strikes: 0, ok: false };
      h.strikes++;
      if (h.strikes >= 5) h.ok = false;
      h.badUntil = now() + (h.ok ? Math.min(30 * 6e4, 12e4 * 2 ** Math.min(h.strikes - 1, 4)) : Math.min(MAX_BAD, 6e5 * 3 ** Math.min(h.strikes - 1, 4)));
      h.why = why;
      health.set(url, h);
      remember();
      const c = conns.get(url);
      if (c) c.close();
      rebalance();
    }
    function deliver(topic, bytes, url) {
      if (!rooms.has(topic) || !bytes || bytes.length < 29 || bytes.length > 16384) return;
      const at = now();
      const c = conns.get(url);
      if (c) c.lastIn = at;
      inbox = inbox.then(() => __async(this, null, function* () {
        const id = C.hex(yield C.sha256(bytes));
        const p = pending.get(id);
        if (p) {
          const cc = conns.get(url);
          if (cc) {
            cc.misses = 0;
            cc.oks++;
            cc.lastEcho = now();
            const h = health.get(url);
            if (!h) {
              health.set(url, { badUntil: 0, strikes: 0, ok: true });
              remember();
            } else if (!h.ok || h.strikes) {
              h.ok = true;
              h.strikes = 0;
              remember();
            }
          }
          p.urls.delete(url);
          return;
        }
        if (seen.has(id) || !rooms.has(topic)) return;
        seen.set(id, now());
        if (seen.size > 3e3) {
          const cut = [...seen.keys()].slice(0, 1e3);
          for (const k of cut) seen.delete(k);
        }
        yield o.onMessage(topic, bytes, url, at);
      })).catch(() => {
      });
    }
    function base(url, type) {
      return {
        url,
        type,
        ws: null,
        state: "idle",
        topics: /* @__PURE__ */ new Set(),
        tries: 0,
        retryAt: 0,
        misses: 0,
        oks: 0,
        lastIn: 0,
        lastEcho: 0,
        slowUntil: 0,
        opened: 0,
        close() {
          this.state = "closed";
          clearTimeout(this.t1);
          clearInterval(this.t2);
          try {
            if (this.ws) {
              this.ws.onclose = this.ws.onerror = this.ws.onmessage = this.ws.onopen = null;
              this.ws.close();
            }
          } catch (e) {
          }
          this.ws = null;
        },
        failed() {
          const was = this.state;
          this.close();
          this.state = "retry";
          if (!this.opened || now() - this.opened < 3e4) this.tries++;
          this.opened = 0;
          if (this.tries >= 3) {
            this.tries = 0;
            strike(this.url, "cannot connect");
            return;
          }
          this.retryAt = now() + RETRY[Math.min(this.tries, RETRY.length - 1)] * (0.75 + Math.random() * 0.5);
          if (was === "open") changed();
        }
      };
    }
    function nostrConn(url) {
      const c = base(url, "nostr");
      const subId = (topic) => "bvw" + topic.slice(0, 13);
      const req = (topic) => JSON.stringify(["REQ", subId(topic), { kinds: [C.nostrKind(topic)], "#x": [topic], since: Math.floor(now() / 1e3) - 5 }]);
      c.open = () => {
        c.state = "connecting";
        let ws;
        try {
          ws = c.ws = new WS(url);
        } catch (e) {
          c.failed();
          return;
        }
        c.t1 = setTimeout(() => {
          if (c.state === "connecting") c.failed();
        }, 1e4);
        ws.onopen = () => {
          clearTimeout(c.t1);
          c.state = "open";
          c.opened = now();
          c.tries = 0;
          for (const t of c.topics) ws.send(req(t));
          changed();
        };
        ws.onclose = ws.onerror = () => {
          if (c.state !== "closed") c.failed();
        };
        ws.onmessage = (ev) => {
          let m;
          try {
            m = JSON.parse(typeof ev.data === "string" ? ev.data : "");
          } catch (e) {
            return;
          }
          if (!Array.isArray(m)) return;
          if (m[0] === "EVENT" && m[2] && typeof m[2].content === "string" && Array.isArray(m[2].tags)) {
            const tag = m[2].tags.find((t) => Array.isArray(t) && t[0] === "x");
            if (!tag || !c.topics.has(tag[1]) || m[1] !== subId(tag[1]) || m[2].content.length > 12e3) return;
            let bytes;
            try {
              bytes = C.unb64(m[2].content);
            } catch (e) {
              return;
            }
            deliver(tag[1], bytes, url);
          } else if (m[0] === "OK" && m[2] === false) {
            const why = String(m[3] || "");
            if (/^rate-limited/i.test(why)) c.slowUntil = now() + 3e4;
            else if (/^(blocked|restricted|auth-required|pow|invalid)/i.test(why)) strike(url, why.slice(0, 80));
          } else if (m[0] === "CLOSED" && typeof m[2] === "string" && /^(blocked|restricted|auth-required|pow|error)/i.test(m[2])) strike(url, m[2].slice(0, 80));
        };
      };
      c.sub = (t) => {
        if (c.state === "open") c.ws.send(req(t));
      };
      c.unsub = (t) => {
        if (c.state === "open") c.ws.send(JSON.stringify(["CLOSE", subId(t)]));
      };
      c.publish = (t, ev) => {
        if (c.state === "open" && c.ws.readyState === 1 && now() >= c.slowUntil) {
          c.ws.send(ev);
          return true;
        }
        return false;
      };
      return c;
    }
    function mqttConn(cfg) {
      const c = base(cfg.url, "mqtt");
      let buf = new Uint8Array(0), pid = 1;
      const mt = (t) => "bvwatch/" + t;
      c.open = () => {
        c.state = "connecting";
        let ws;
        try {
          ws = c.ws = new WS(cfg.url, "mqtt");
          ws.binaryType = "arraybuffer";
        } catch (e) {
          c.failed();
          return;
        }
        c.t1 = setTimeout(() => {
          if (c.state === "connecting") c.failed();
        }, 1e4);
        ws.onopen = () => {
          try {
            ws.send(C.MQ.connect("bvw" + C.hex(C.rand(8)), cfg.user, cfg.pass, 60));
          } catch (e) {
            c.failed();
          }
        };
        ws.onclose = ws.onerror = () => {
          if (c.state !== "closed") c.failed();
        };
        ws.onmessage = (ev) => {
          if (!(ev.data instanceof ArrayBuffer)) return;
          buf = buf.length ? C.concat(buf, new Uint8Array(ev.data)) : new Uint8Array(ev.data);
          let r;
          try {
            r = C.MQ.read(buf);
          } catch (e) {
            c.failed();
            return;
          }
          buf = r.rest;
          if (buf.length > 65536) {
            c.failed();
            return;
          }
          for (const p of r.list) {
            if (p.type === 2) {
              if (p.body[1] !== 0) {
                strike(cfg.url, "refused " + p.body[1]);
                return;
              }
              clearTimeout(c.t1);
              c.state = "open";
              c.opened = now();
              c.tries = 0;
              for (const t of c.topics) c.sub(t);
              c.lastPong = now();
              c.t2 = setInterval(() => {
                if (now() - c.lastPong > 7e4) {
                  c.failed();
                  return;
                }
                try {
                  if (ws.readyState === 1) ws.send(C.MQ.ping());
                } catch (e) {
                }
              }, 25e3);
              changed();
            } else if (p.type === 3) {
              const { topic, payload } = C.MQ.publishParts(p.flags, p.body);
              if (topic.startsWith("bvwatch/")) {
                const t = topic.slice(8);
                if (c.topics.has(t)) deliver(t, payload.slice(), cfg.url);
              }
            } else if (p.type === 9) {
              if (p.body[2] === 128) strike(cfg.url, "subscribe refused");
            } else if (p.type === 13) c.lastPong = now();
          }
        };
      };
      c.sub = (t) => {
        if (c.state === "open") {
          pid = pid % 65535 + 1;
          c.ws.send(C.MQ.subscribe(pid, mt(t)));
        }
      };
      c.unsub = (t) => {
        if (c.state === "open") {
          pid = pid % 65535 + 1;
          c.ws.send(C.MQ.unsubscribe(pid, mt(t)));
        }
      };
      c.publish = (t, bytes) => {
        if (c.state === "open" && c.ws.readyState === 1) {
          c.ws.send(C.MQ.publish(mt(t), bytes));
          return true;
        }
        return false;
      };
      const close0 = c.close;
      c.close = function() {
        try {
          if (this.ws && this.ws.readyState === 1) this.ws.send(C.MQ.bye());
        } catch (e) {
        }
        buf = new Uint8Array(0);
        close0.call(this);
      };
      return c;
    }
    function wanted() {
      const want = /* @__PURE__ */ new Map();
      for (const r of rooms.values()) {
        let n = 0;
        for (const url of r.order) {
          if (n >= perRoom) break;
          if (isBad(url)) continue;
          n++;
          (want.get(url) || want.set(url, /* @__PURE__ */ new Set()).get(url)).add(r.topic);
        }
        for (const m of mqttList) if (!isBad(m.url)) (want.get(m.url) || want.set(m.url, /* @__PURE__ */ new Set()).get(m.url)).add(r.topic);
      }
      return want;
    }
    function rebalance() {
      const want = wanted();
      for (const [url, c] of conns) {
        if (!want.has(url)) {
          for (const t of c.topics) c.unsub(t);
          c.close();
          conns.delete(url);
          continue;
        }
        const ts = want.get(url);
        for (const t of [...c.topics]) if (!ts.has(t)) {
          c.topics.delete(t);
          c.unsub(t);
        }
        for (const t of ts) if (!c.topics.has(t)) {
          c.topics.add(t);
          c.sub(t);
        }
      }
      for (const [url, ts] of want) {
        if (conns.has(url)) continue;
        const cfg = mqttList.find((m) => m.url === url);
        const c = cfg ? mqttConn(cfg) : nostrConn(url);
        c.topics = new Set(ts);
        conns.set(url, c);
        c.open();
      }
      if (rooms.size && !timer) timer = setInterval(maintain, Math.min(2e3, echoWait / 2));
      if (!rooms.size && timer) {
        clearInterval(timer);
        timer = 0;
      }
      changed();
    }
    if (o.memory) {
      Promise.resolve().then(() => o.memory.load()).then((saved) => {
        if (!saved || typeof saved !== "object") return;
        const t = now();
        for (const [url, h] of Object.entries(saved)) {
          if (!h || typeof h !== "object" || health.has(url) || typeof url !== "string" || url.length > 300) continue;
          health.set(url, { badUntil: Math.min(+h.badUntil || 0, t + MAX_BAD), strikes: Math.max(0, Math.min(+h.strikes || 0, 8)), ok: !!h.ok });
        }
        if (rooms.size) rebalance();
      }).catch(() => {
      });
    }
    function maintain() {
      const t = now();
      for (const c of conns.values()) if (c.state === "retry" && t >= c.retryAt) c.open();
      for (const [id, p] of pending) {
        if (t - p.at < echoWait) continue;
        pending.delete(id);
        for (const url of p.urls) {
          const c = conns.get(url);
          if (c && c.state === "open" && ++c.misses >= MISSES_BAD) strike(url, "messages not coming back");
        }
      }
      for (const [k, at] of seen) {
        if (t - at > 12e4) seen.delete(k);
        else break;
      }
    }
    function publish(topic, bytes) {
      return __async(this, null, function* () {
        if (!rooms.has(topic)) return 0;
        const id = C.hex(yield C.sha256(bytes));
        const targets = [...conns.values()].filter((c) => c.state === "open" && c.topics.has(topic));
        const p = { at: now(), urls: /* @__PURE__ */ new Set() };
        pending.set(id, p);
        let sent = 0;
        for (const c of targets) if (c.type === "mqtt" && c.publish(topic, bytes)) {
          p.urls.add(c.url);
          sent++;
        }
        const ns = targets.filter((c) => c.type === "nostr");
        if (ns.length) {
          try {
            signer = signer || C.newSigner();
            const ev = JSON.stringify(["EVENT", yield C.nostrEvent(signer, topic, C.b64(bytes))]);
            for (const c of ns) if (c.publish(topic, ev)) {
              p.urls.add(c.url);
              sent++;
            }
          } catch (e) {
          }
        }
        return sent;
      });
    }
    function join(topic) {
      if (!/^[0-9a-f]{40}$/.test(topic) || rooms.has(topic)) return;
      rooms.set(topic, { topic, order: shuffled(nostrList, topic) });
      rebalance();
    }
    function leave(topic) {
      if (rooms.delete(topic)) rebalance();
    }
    function stats(topic) {
      const list = [...conns.values()].filter((c) => !topic || c.topics.has(topic));
      const t = now();
      const good = list.filter((c) => c.state === "open" && (c.lastEcho > t - 6e4 || c.opened > t - 2e4 && !c.misses));
      return {
        open: list.filter((c) => c.state === "open").length,
        good: good.length,
        total: list.length,
        relays: list.map((c) => ({ host: (() => {
          try {
            return new URL(c.url).host;
          } catch (e) {
            return c.url;
          }
        })(), type: c.type, state: c.state, ok: good.includes(c) }))
      };
    }
    function close() {
      for (const c of conns.values()) c.close();
      conns.clear();
      rooms.clear();
      if (timer) clearInterval(timer);
      timer = 0;
    }
    return { join, leave, publish, stats, close, _conns: conns, _health: health };
  }
  function bucket(rate, burst, now) {
    let n = burst, at = now();
    return () => {
      const t = now();
      n = Math.min(burst, n + Math.max(0, t - at) * rate / 1e3);
      at = t;
      if (n < 1) return false;
      n -= 1;
      return true;
    };
  }
  function gate(o) {
    const now = o.now || (() => Date.now());
    const known = typeof o.known === "function" ? o.known : () => false;
    const fresh = bucket(o.fresh || NEW, o.freshBurst || NEW_BURST, now);
    const checks = /* @__PURE__ */ new Map(), sends = /* @__PURE__ */ new Map();
    const own = (map, id, rate, burst) => {
      let b = map.get(id);
      if (!b) {
        if (map.size >= 200) map.delete(map.keys().next().value);
        b = bucket(rate, burst, now);
        map.set(id, b);
      }
      return b();
    };
    return (bytes) => __async(this, null, function* () {
      const m = yield C.openSigned(o.key, o.topic, bytes);
      if (!m || !m.m || typeof m.m.f !== "string") return null;
      const said = yield C.memberId(m.pk);
      if (said !== m.m.f) return null;
      const member = !!known(said);
      if (member ? !own(checks, said, o.checks || CHECKS, o.checksBurst || CHECKS_BURST) : !fresh()) return null;
      const id = yield o.check(o.topic, m);
      if (!id) return null;
      if (member && !own(sends, id, o.perSender || PER_SENDER, o.perSenderBurst || PER_SENDER_BURST)) return null;
      return m.m;
    });
  }
  return { create, gate, bucket, NOSTR, MQTT, shuffled, okUrl, relaysFrom, MAX_OWN, PER_SENDER, PER_SENDER_BURST, CHECKS, CHECKS_BURST, NEW, NEW_BURST };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BVWT_NET;
