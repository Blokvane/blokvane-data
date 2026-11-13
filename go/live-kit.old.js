// Made from live-kit.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change live-kit.js and run node tools/old-js.js again.
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
var BVLIVE = (() => {
  "use strict";
  const C = BVWT_CORE, NET = BVWT_NET;
  const te = new TextEncoder(), td = new TextDecoder();
  const subtle = crypto.subtle;
  const ICE = [{ urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] }, { urls: ["stun:stun.cloudflare.com:3478"] }];
  const GO = "https://app.blokvane.com/go/";
  const PLAY = "https://app.blokvane.com/play/";
  const TV = "https://app.blokvane.com/tv/";
  const LOCAL = typeof location !== "undefined" && /^(127\.0\.0\.1|localhost)$/.test(location.hostname || "");
  const TEST = LOCAL && typeof window !== "undefined" && window.BV_TEST && typeof window.BV_TEST === "object" ? window.BV_TEST : null;
  const SITE = TEST && typeof TEST.api === "string" ? TEST.api.replace(/\/$/, "") : "https://blokvane.com";
  const HOME = ["wss://blokvane.com/relay"];
  const PART = 4200;
  const MAX_LONG = 96 * 1024;
  const HELLO_EVERY = 25e3, GONE_AFTER = 75e3;
  const CHUNK = 64 * 1024, HIGH = 2 * 1024 * 1024, LOW = 512 * 1024;
  const now = () => Date.now();
  const okId = (id) => typeof id === "string" && /^[0-9a-f]{16}$/.test(id);
  const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, " ").replace(/\s+/g, " ").trim().slice(0, max || 80);
  const newSecret = () => C.b64url(C.rand(16));
  const LETTERS = "ABCDEFGHJKMNPQRSTUVWXYZ";
  const DIGITS = "23456789";
  function shortCode(n = 6, kind) {
    const set = kind === "digits" ? DIGITS : LETTERS;
    const r = C.rand(n);
    let s = "";
    for (let i = 0; i < n; i++) s += set[r[i] % set.length];
    return s;
  }
  const normShort = (s, n) => {
    const t = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    return n ? t.length === n ? t : "" : t;
  };
  function codeSecret(code, label) {
    return __async(this, null, function* () {
      const c = normShort(code);
      if (c.length < 4) throw new Error("That code is not complete.");
      const base = yield subtle.importKey("raw", te.encode(c), "PBKDF2", false, ["deriveBits"]);
      const bits = yield subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: te.encode("blokvane-code-" + (label || "room") + "-v1"), iterations: 12e4 }, base, 128);
      return new Uint8Array(bits);
    });
  }
  const link = (kind, ...parts) => GO + "#" + [kind, ...parts].join(".");
  function parse(hash) {
    const h = String(hash || "").replace(/^#/, "").trim();
    if (!/^[a-z][a-z0-9]{0,11}(\.[A-Za-z0-9_-]{1,96}){0,6}$/.test(h)) return null;
    const p = h.split(".");
    return { kind: p[0], parts: p.slice(1) };
  }
  const handlers = /* @__PURE__ */ new Map();
  let shared = null;
  function localMemory(key) {
    return {
      load: () => {
        try {
          return JSON.parse(localStorage.getItem(key) || "null");
        } catch (e) {
          return null;
        }
      },
      save: (h) => {
        try {
          localStorage.setItem(key, JSON.stringify(h));
        } catch (e) {
        }
      }
    };
  }
  function relays(o = {}) {
    if (shared) return shared;
    shared = NET.create({
      onMessage: (topic, bytes) => {
        const h = handlers.get(topic);
        if (h) {
          try {
            h(bytes);
          } catch (e) {
          }
        }
      },
      onChange: () => {
        for (const fn of watchers) {
          try {
            fn();
          } catch (e) {
          }
        }
      },
      // (Blokvane's own relay, for the rooms that ask for it, unless a relay list of one's own says otherwise: a
      // test's list names none)
      memory: o.memory || localMemory("bvlive:relays"),
      relays: o.relays || void 0,
      home: HOME
    });
    return shared;
  }
  const watchers = /* @__PURE__ */ new Set();
  const openRooms = /* @__PURE__ */ new Set();
  if (typeof window !== "undefined" && typeof document !== "undefined" && window.addEventListener) {
    let hidAt = 0;
    const wake = () => {
      if (shared && shared.wake) {
        try {
          shared.wake();
        } catch (e) {
        }
      }
      for (const R of openRooms) {
        setTimeout(() => {
          if (!R.closed()) R.hello(true);
        }, 1200);
        setTimeout(() => {
          if (!R.closed()) R.hello(true);
        }, 3500);
      }
    };
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hidAt = Date.now();
      else if (hidAt && Date.now() - hidAt > 2500) wake();
    });
    window.addEventListener("online", wake);
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) wake();
    });
  }
  const ECDH = { name: "ECDH", namedCurve: "P-256" };
  function boxKeys() {
    return __async(this, null, function* () {
      const kp = yield subtle.generateKey(ECDH, false, ["deriveBits"]);
      return { priv: kp.privateKey, pub: C.b64url(new Uint8Array(yield subtle.exportKey("raw", kp.publicKey))) };
    });
  }
  function boxKey(myPriv, theirPub, topic) {
    return __async(this, null, function* () {
      const pub = yield subtle.importKey("raw", C.unb64url(theirPub), ECDH, false, []);
      const bits = yield subtle.deriveBits({ name: "ECDH", public: pub }, myPriv, 256);
      return subtle.importKey("raw", yield C.hkdf(bits, te.encode("bvlive-box-v1"), te.encode(topic), 256), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
    });
  }
  function room(o) {
    return __async(this, null, function* () {
      const secret = typeof o.secret === "string" ? C.unb64url(o.secret) : o.secret;
      const keys = yield C.secretKeys(secret, o.label || "bvlive");
      const me = o.me || (yield C.newMember(o.jwk || void 0));
      const bx = yield boxKeys();
      const net = relays({ memory: o.memory });
      const topic = keys.topic;
      const inboxOf = (id) => __async(this, null, function* () {
        return C.hex(yield C.sha256(te.encode(topic + ":inbox:" + id))).slice(0, 40);
      });
      const myInbox = o.inbox ? yield inboxOf(me.id) : "";
      const ownerInbox = o.toOwner && o.owner ? yield inboxOf(o.owner) : "";
      const peers = /* @__PURE__ */ new Map();
      const parts = /* @__PURE__ */ new Map();
      const pipes = /* @__PURE__ */ new Map();
      const lists = /* @__PURE__ */ new Map();
      let closed = false, helloT = 0, sweepT = 0;
      const R = {
        id: me.id,
        me,
        topic,
        peers,
        name: clean(o.name, 40),
        role: clean(o.role, 20),
        info: o.info || null,
        owner: o.owner || "",
        closed: () => closed,
        onMsg: o.onMsg || null,
        onPeers: o.onPeers || null,
        onPipe: o.onPipe || null,
        mediaFor: o.mediaFor || null
      };
      const trusted = (id) => id === R.owner || id === me.id || (o.allow ? !!o.allow(id) : false);
      const may = (id) => o.open !== false || trusted(id);
      const gate = NET.gate({ key: keys.key, topic, check: C.verifier(), known: (id) => peers.has(id) || trusted(id) });
      const inGate = myInbox ? NET.gate({ key: keys.key, topic: myInbox, check: C.verifier(), known: (id) => peers.has(id) || trusted(id) }) : null;
      function publish(m, tp) {
        return __async(this, null, function* () {
          if (closed) return 0;
          m.f = me.id;
          m.at = now();
          tp = tp || topic;
          return net.publish(tp, yield C.sealSigned(keys.key, tp, m, me));
        });
      }
      function send(m, to) {
        return __async(this, null, function* () {
          if (closed || !m || typeof m.k !== "string") return 0;
          if (to) m.to = to;
          const tp = ownerInbox && (!to || to === R.owner) ? ownerInbox : topic;
          const body = te.encode(JSON.stringify(m));
          if (body.length <= PART + 600) return publish(m, tp);
          if (body.length > MAX_LONG) throw new Error("too big for the relays");
          const id = C.hex(C.rand(6)), n = Math.ceil(body.length / PART);
          let sent = 0;
          for (let i = 0; i < n; i++) {
            sent = yield publish({ k: "~p", id, i, n, to: to || void 0, d: C.b64url(body.subarray(i * PART, (i + 1) * PART)) }, tp);
            if (n > 3 && i < n - 1) yield new Promise((r) => setTimeout(r, 40));
          }
          return sent;
        });
      }
      function box(to, m) {
        return __async(this, null, function* () {
          const p = peers.get(to);
          if (!p || !p.bx) throw new Error("not here");
          const k = yield boxKey(bx.priv, p.bx, topic + ":" + [me.id, to].sort().join(":"));
          const iv = C.rand(12);
          const ct = new Uint8Array(yield subtle.encrypt({ name: "AES-GCM", iv }, k, te.encode(JSON.stringify(m))));
          return send({ k: "~box", d: C.b64url(C.concat(iv, ct)) }, to);
        });
      }
      function unbox(m) {
        return __async(this, null, function* () {
          const p = peers.get(m.f);
          if (!p || !p.bx || typeof m.d !== "string") return null;
          try {
            const k = yield boxKey(bx.priv, p.bx, topic + ":" + [me.id, m.f].sort().join(":"));
            const b = C.unb64url(m.d);
            const plain = yield subtle.decrypt({ name: "AES-GCM", iv: b.subarray(0, 12) }, k, b.subarray(12));
            const x = JSON.parse(td.decode(plain));
            return x && typeof x === "object" && !Array.isArray(x) ? x : null;
          } catch (e) {
            return null;
          }
        });
      }
      function hello(ask) {
        if (closed || o.quiet) return;
        publish({ k: "~hi", n: R.name, r: R.role, i: R.info || void 0, bx: bx.pub, ask: ask ? 1 : void 0 }).catch(() => {
        });
      }
      function seen(m) {
        const id = m.f;
        let p = peers.get(id);
        const isNew = !p;
        if (!p) {
          if (peers.size >= 300) return null;
          p = { id, name: "", role: "", info: null, at: 0, bx: "" };
          peers.set(id, p);
        }
        p.at = now();
        if (m.k === "~hi" || m.k === "~here") {
          p.name = clean(m.n, 40);
          p.role = clean(m.r, 20);
          p.info = m.i && typeof m.i === "object" && !Array.isArray(m.i) ? m.i : null;
          if (typeof m.bx === "string" && /^[A-Za-z0-9_-]{80,100}$/.test(m.bx)) p.bx = m.bx;
        }
        if (isNew || m.k === "~hi" || m.k === "~here") changed();
        return p;
      }
      let changeT = 0;
      function changed() {
        if (changeT) return;
        changeT = setTimeout(() => {
          changeT = 0;
          if (R.onPeers && !closed) {
            try {
              R.onPeers(list());
            } catch (e) {
            }
          }
        }, 60);
      }
      const list = () => [...peers.values()].filter((p) => p.name || p.role || p.bx);
      function sweep() {
        const t = now();
        let gone = false;
        for (const [id, p] of peers) if (t - p.at > GONE_AFTER && !pipeOpen(id)) {
          peers.delete(id);
          gone = true;
        }
        for (const [id, x] of parts) if (t - x.at > 3e4) parts.delete(id);
        if (gone) changed();
      }
      const pipeOpen = (id) => {
        const p = pipes.get(id);
        return !!(p && p.open());
      };
      const onBytes = (bytes) => {
        take(bytes).catch(() => {
        });
      };
      handlers.set(topic, onBytes);
      function take(bytes, g) {
        return __async(this, null, function* () {
          if (closed) return;
          const m = yield (g || gate)(bytes);
          if (!m || !okId(m.f) || m.f === me.id || typeof m.k !== "string") return;
          if (m.to && m.to !== me.id) {
            if (peers.has(m.f)) peers.get(m.f).at = now();
            return;
          }
          if (!may(m.f)) return;
          yield handle(m);
        });
      }
      function handle(m) {
        return __async(this, null, function* () {
          const p = seen(m);
          if (!p) return;
          switch (m.k) {
            case "~hi":
              if (m.ask || m.to) publish({ k: "~here", to: m.f, n: R.name, r: R.role, i: R.info || void 0, bx: bx.pub }).catch(() => {
              });
              return;
            case "~here":
              return;
            case "~bye":
              peers.delete(m.f);
              closePipe(m.f);
              changed();
              return;
            case "~p":
              return part(m);
            case "~box": {
              const x = yield unbox(m);
              if (x && typeof x.k === "string" && x.k[0] !== "~") {
                x.f = m.f;
                x.at = m.at;
                x.boxed = true;
                deliver(x, p);
              }
              return;
            }
            case "~ro":
            case "~ra":
              return rtcSignal(m);
            case "~t?":
              publish({ k: "~t!", to: m.f, t0: m.t0, t1: now() }).catch(() => {
              });
              return;
            case "~t!":
              return clockReply(m);
            case "~s": {
              const L = lists.get(m.n);
              if (L) L.got(m);
              return;
            }
            default:
              if (m.k[0] !== "~") deliver(m, p);
          }
        });
      }
      function deliver(m, p) {
        if (R.onMsg) {
          try {
            R.onMsg(m, p);
          } catch (e) {
          }
        }
      }
      function part(m) {
        if (typeof m.id !== "string" || !/^[0-9a-f]{12}$/.test(m.id) || !(m.n > 1 && m.n <= 32) || !(m.i >= 0 && m.i < m.n) || typeof m.d !== "string") return;
        let x = parts.get(m.id);
        if (!x) {
          if (parts.size > 60) parts.delete(parts.keys().next().value);
          x = { n: m.n, got: new Array(m.n), have: 0, at: now(), f: m.f };
          parts.set(m.id, x);
        }
        if (x.f !== m.f || x.n !== m.n || x.got[m.i]) return;
        try {
          x.got[m.i] = C.unb64url(m.d);
        } catch (e) {
          return;
        }
        x.have++;
        if (x.have < x.n) return;
        parts.delete(m.id);
        let whole;
        try {
          whole = JSON.parse(td.decode(C.concat(...x.got)));
        } catch (e) {
          return;
        }
        if (!whole || typeof whole !== "object" || typeof whole.k !== "string" || whole.k === "~p") return;
        whole.f = m.f;
        whole.at = m.at;
        if (whole.to && whole.to !== me.id) return;
        handle(whole).catch(() => {
        });
      }
      let offset = 0, bestRtt = Infinity, clockFrom = "";
      const tries = /* @__PURE__ */ new Map();
      function clockReply(m) {
        if (m.f !== clockFrom || !tries.has(m.t0)) return;
        tries.delete(m.t0);
        const t2 = now(), rtt = t2 - m.t0;
        if (rtt < 0 || rtt > 2e4) return;
        if (rtt <= bestRtt * 1.15 || bestRtt === Infinity) {
          bestRtt = Math.min(bestRtt, rtt);
          offset = m.t1 - (m.t0 + t2) / 2;
        }
      }
      function syncClock(host, n = 6) {
        return __async(this, null, function* () {
          clockFrom = host || R.owner;
          if (!clockFrom || clockFrom === me.id) {
            offset = 0;
            bestRtt = 0;
            return 0;
          }
          for (let i = 0; i < n && !closed; i++) {
            const t0 = now();
            tries.set(t0, 1);
            const pp = pipes.get(clockFrom);
            if (pp && pp.open()) pp.send({ k: "~t?", t0 });
            else publish({ k: "~t?", to: clockFrom, t0 }).catch(() => {
            });
            yield new Promise((r) => setTimeout(r, 350));
          }
          return offset;
        });
      }
      const clock = () => now() + offset;
      const gathered = (pc) => new Promise((res) => {
        if (pc.iceGatheringState === "complete") {
          res();
          return;
        }
        const done = () => {
          clearTimeout(t);
          pc.removeEventListener("icegatheringstatechange", ch);
          res();
        };
        const ch = () => {
          if (pc.iceGatheringState === "complete") done();
        };
        const t = setTimeout(done, 2500);
        pc.addEventListener("icegatheringstatechange", ch);
      });
      const trim = (sdp) => {
        let n = 0;
        return String(sdp || "").split("\r\n").filter((l) => !l.startsWith("a=candidate") || !/ tcp /i.test(l) && ++n <= 12).join("\r\n");
      };
      function closePipe(id) {
        const p = pipes.get(id);
        if (p) p.close();
      }
      function pipe(_0) {
        return __async(this, arguments, function* (to, po = {}) {
          if (!window.RTCPeerConnection) throw new Error("This browser can't connect straight to other devices.");
          const old = pipes.get(to);
          if (old && old.open() && !po.stream && !po.recv) return old;
          if (old) old.close();
          const pc = new RTCPeerConnection({ iceServers: ICE });
          const P = makePipe(to, pc, C.hex(C.rand(6)));
          if (po.stream) for (const tr of po.stream.getTracks()) pc.addTrack(tr, po.stream);
          if (po.recv === "video" || po.recv === "both") pc.addTransceiver("video", { direction: "recvonly" });
          if (po.recv === "audio" || po.recv === "both") pc.addTransceiver("audio", { direction: "recvonly" });
          P.bind(pc.createDataChannel("bv", { ordered: true }));
          try {
            yield pc.setLocalDescription(yield pc.createOffer());
            yield gathered(pc);
            if (P.gone) throw new Error("closed");
            yield send({ k: "~ro", sid: P.sid, sdp: trim(pc.localDescription.sdp) }, to);
          } catch (e) {
            P.close();
            throw e;
          }
          P.timer = setTimeout(() => {
            if (!P.open()) P.fail("timeout");
          }, 25e3);
          return P.ready;
        });
      }
      function rtcSignal(m) {
        return __async(this, null, function* () {
          if (typeof m.sid !== "string" || !/^[0-9a-f]{12}$/.test(m.sid) || typeof m.sdp !== "string" || m.sdp.length > 6e4) return;
          if (m.k === "~ra") {
            const P2 = pipes.get(m.f);
            if (!P2 || P2.sid !== m.sid || P2.pc.signalingState !== "have-local-offer") return;
            P2.pc.setRemoteDescription({ type: "answer", sdp: m.sdp }).catch(() => P2.fail("answer"));
            return;
          }
          if (!R.onPipe || !window.RTCPeerConnection) return;
          const old = pipes.get(m.f);
          if (old) old.close();
          const pc = new RTCPeerConnection({ iceServers: ICE });
          const P = makePipe(m.f, pc, m.sid);
          pc.ondatachannel = (e) => {
            if (e.channel.label === "bv") P.bind(e.channel);
            else e.channel.close();
          };
          try {
            yield pc.setRemoteDescription({ type: "offer", sdp: m.sdp });
            if (P.wantsMedia() && R.mediaFor) {
              const st = yield R.mediaFor(m.f);
              if (st) {
                for (const tr of st.getTracks()) {
                  const tc = pc.getTransceivers().find((t) => t.receiver && t.receiver.track && t.receiver.track.kind === tr.kind && !t.sender.track);
                  if (tc) {
                    tc.direction = sendsToo(pc, tc) ? "sendrecv" : "sendonly";
                    yield tc.sender.replaceTrack(tr);
                    tc.sender.setStreams && tc.sender.setStreams(st);
                  }
                }
              }
            }
            yield pc.setLocalDescription(yield pc.createAnswer());
            yield gathered(pc);
            if (P.gone) return;
            yield send({ k: "~ra", sid: m.sid, sdp: trim(pc.localDescription.sdp) }, m.f);
          } catch (e) {
            P.close();
            return;
          }
          P.timer = setTimeout(() => {
            if (!P.open()) P.fail("timeout");
          }, 25e3);
          P.ready.then(() => {
            try {
              R.onPipe(P);
            } catch (e) {
            }
          }, () => {
          });
        });
      }
      function sendsToo(pc, tc) {
        const sdp = pc.remoteDescription && pc.remoteDescription.sdp || "";
        const part2 = sdp.split(/\r?\nm=/).find((x) => tc.mid != null && new RegExp("\\r?\\na=mid:" + String(tc.mid).replace(/[^\w-]/g, "") + "(\\r|\\n|$)").test("\n" + x));
        return !!part2 && /\r?\na=(sendrecv|sendonly)/.test("\n" + part2);
      }
      function makePipe(to, pc, sid) {
        let ch = null, resolve, reject;
        const ready = new Promise((a, b) => {
          resolve = a;
          reject = b;
        });
        ready.catch(() => {
        });
        const inFiles = /* @__PURE__ */ new Map();
        const P = {
          id: to,
          sid,
          pc,
          gone: false,
          ready,
          timer: 0,
          onMsg: null,
          onFile: null,
          onProgress: null,
          onStream: null,
          onClose: null,
          open: () => !!(ch && ch.readyState === "open" && !P.gone),
          wantsMedia: () => /m=(video|audio)/.test(pc.remoteDescription && pc.remoteDescription.sdp || ""),
          bind(c) {
            ch = c;
            ch.binaryType = "arraybuffer";
            ch.onopen = () => {
              clearTimeout(P.timer);
              resolve(P);
            };
            ch.onclose = () => P.close();
            ch.onmessage = (e) => onData(e.data);
            if (ch.readyState === "open") setTimeout(() => {
              clearTimeout(P.timer);
              resolve(P);
            }, 0);
          },
          send(obj) {
            try {
              if (P.open()) {
                ch.send(JSON.stringify(obj));
                return true;
              }
            } catch (e) {
            }
            return false;
          },
          // a file (or any Blob): a header, then the bytes in 64 KB pieces, then the end. meta: { name, type, ...anything small }
          file(_0) {
            return __async(this, arguments, function* (blob, meta = {}, progress) {
              if (!P.open()) throw new Error("not connected");
              const id = C.hex(C.rand(6));
              ch.send(JSON.stringify({ k: "~f", id, size: blob.size, meta: Object.assign({}, meta, { name: clean(meta.name || "file", 120), type: String(meta.type || blob.type || "").slice(0, 100) }) }));
              for (let at = 0; at < blob.size; at += CHUNK) {
                if (!P.open()) throw new Error("closed");
                if (ch.bufferedAmount > HIGH) yield drained();
                const buf = yield blob.slice(at, at + CHUNK).arrayBuffer();
                const out = new Uint8Array(6 + buf.byteLength);
                out.set(C.unhex(id), 0);
                out.set(new Uint8Array(buf), 6);
                ch.send(out);
                if (progress) {
                  try {
                    progress(Math.min(blob.size, at + CHUNK), blob.size);
                  } catch (e) {
                  }
                }
              }
              ch.send(JSON.stringify({ k: "~fe", id }));
              return id;
            });
          },
          close() {
            if (P.gone) return;
            P.gone = true;
            clearTimeout(P.timer);
            try {
              if (ch) ch.close();
            } catch (e) {
            }
            try {
              pc.close();
            } catch (e) {
            }
            if (pipes.get(to) === P) pipes.delete(to);
            reject(new Error("closed"));
            if (P.onClose) {
              try {
                P.onClose();
              } catch (e) {
              }
            }
          },
          fail(why) {
            P.close();
            reject(new Error(why || "failed"));
          }
        };
        const drained = () => new Promise((res) => {
          ch.bufferedAmountLowThreshold = LOW;
          const t = setTimeout(done, 2e4);
          function done() {
            clearTimeout(t);
            ch.removeEventListener("bufferedamountlow", done);
            res();
          }
          ch.addEventListener("bufferedamountlow", done);
        });
        function onData(d) {
          if (typeof d === "string") {
            if (d.length > 65536) return;
            let m;
            try {
              m = JSON.parse(d);
            } catch (e) {
              return;
            }
            if (!m || typeof m.k !== "string") return;
            if (m.k === "~f") {
              if (!(m.size >= 0 && m.size <= 4 * 1024 * 1024 * 1024) || typeof m.id !== "string" || !/^[0-9a-f]{12}$/.test(m.id)) return;
              if (inFiles.size >= 8) return;
              inFiles.set(m.id, { meta: m.meta && typeof m.meta === "object" ? m.meta : {}, size: m.size, got: 0, parts: [] });
              return;
            }
            if (m.k === "~fe") {
              const f2 = inFiles.get(m.id);
              if (!f2) return;
              inFiles.delete(m.id);
              const meta = f2.meta;
              const blob = new Blob(f2.parts, { type: String(meta.type || "") });
              if (P.onFile) {
                try {
                  P.onFile({ meta, blob, id: m.id });
                } catch (e) {
                }
              }
              return;
            }
            if (m.k === "~t?") {
              P.send({ k: "~t!", t0: m.t0, t1: now() });
              return;
            }
            if (m.k === "~t!") {
              clockReply({ f: to, t0: m.t0, t1: m.t1 });
              return;
            }
            m.f = to;
            if (P.onMsg) {
              try {
                P.onMsg(m);
              } catch (e) {
              }
            }
            return;
          }
          const u = new Uint8Array(d);
          if (u.length < 7) return;
          const f = inFiles.get(C.hex(u.subarray(0, 6)));
          if (!f) return;
          f.parts.push(u.subarray(6));
          f.got += u.length - 6;
          if (f.got > f.size) {
            inFiles.delete(C.hex(u.subarray(0, 6)));
            return;
          }
          if (P.onProgress) {
            try {
              P.onProgress(f.got, f.size, f.meta);
            } catch (e) {
            }
          }
        }
        pc.ontrack = (e) => {
          const st = e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]);
          if (P.onStream) {
            try {
              P.onStream(st, e.track);
            } catch (er) {
            }
          }
          P.stream = st;
        };
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === "failed" || pc.connectionState === "closed") P.fail(pc.connectionState);
          else if (pc.connectionState === "disconnected") setTimeout(() => {
            if (pc.connectionState !== "connected" && !P.gone) P.fail("lost");
          }, 9e3);
        };
        pipes.set(to, P);
        return P;
      }
      function shared2(name, lo = {}) {
        if (lists.has(name)) return lists.get(name);
        const map = /* @__PURE__ */ new Map();
        let changeT2 = 0;
        const fire = () => {
          if (changeT2) return;
          changeT2 = setTimeout(() => {
            changeT2 = 0;
            if (L.onChange) {
              try {
                L.onChange(map);
              } catch (e) {
              }
            }
          }, 30);
        };
        const allowed = (by, key) => by === R.owner || !lo.hostOnly && (!lo.own || key === by);
        function apply(key, v, at, by) {
          if (typeof key !== "string" || key.length > 64 || !(at > 0)) return false;
          if (!allowed(by, key)) return false;
          const old = map.get(key);
          if (old && (old.at > at || old.at === at && old.by >= by)) return false;
          if (!old && map.size >= (lo.max || 500)) return false;
          map.set(key, { v, at, by });
          return true;
        }
        const L = {
          map,
          onChange: lo.onChange || null,
          get: (k) => {
            const x = map.get(k);
            return x && x.v !== null ? x.v : void 0;
          },
          entries: () => [...map.entries()].filter(([, x]) => x.v !== null).map(([k, x]) => [k, x.v, x.at, x.by]),
          set(key, v) {
            const at = Math.max(now(), ((map.get(key) || {}).at || 0) + 1);
            if (!apply(key, v, at, me.id)) return false;
            fire();
            send({ k: "~s", n: name, e: [[key, v, at]] }).catch(() => {
            });
            return true;
          },
          del(key) {
            return L.set(key, null);
          },
          // what this device kept from last time (entries as all() gives them), without sending anything
          seed(list2) {
            let any = false;
            for (const x of Array.isArray(list2) ? list2 : []) if (Array.isArray(x) && apply(x[0], x[1], +x[2], typeof x[3] === "string" && x[3] ? x[3] : me.id)) any = true;
            if (any) fire();
            return any;
          },
          // every entry, the removed ones too (to keep, and seed() next time)
          all: () => [...map.entries()].map(([k, x]) => [k, x.v, x.at, x.by]),
          // everything at once (a device that just came in), in parts of 40 entries
          push(to) {
            return __async(this, null, function* () {
              const all = [...map.entries()];
              for (let i = 0; i < all.length; i += 40) yield send({ k: "~s", n: name, e: all.slice(i, i + 40).map(([k, x]) => [k, x.v, x.at, x.by]) }, to).catch(() => {
              });
            });
          },
          ask() {
            send({ k: "~s", n: name, ask: 1, e: [] }).catch(() => {
            });
          },
          got(m) {
            if (!Array.isArray(m.e) || m.e.length > 60) return;
            let any = false;
            for (const x of m.e) {
              if (!Array.isArray(x)) continue;
              const by = typeof x[3] === "string" && okId(x[3]) && (m.f === R.owner || x[3] === m.f) ? x[3] : m.f;
              if (apply(x[0], x[1], +x[2], by)) any = true;
            }
            if (any) fire();
            if (m.ask && map.size && (me.id === R.owner || !peers.has(R.owner) && [...peers.keys(), me.id].sort()[0] === me.id)) L.push(m.f);
          }
        };
        lists.set(name, L);
        setTimeout(() => L.ask(), 1500);
        setTimeout(() => {
          if (!map.size && !closed) L.ask();
        }, 6e3);
        return L;
      }
      const kind = o.home === true ? o.label === "bvnear" ? "near" : "game" : "", role = o.role === "tv" ? "tv" : "phone";
      net.join(topic, { home: o.home === true, idle: o.idle === true, kind, role });
      let onInbox = null;
      if (myInbox) {
        onInbox = (bytes) => {
          take(bytes, inGate).catch(() => {
          });
        };
        handlers.set(myInbox, onInbox);
        net.join(myInbox, { home: o.home === true, kind, role });
      }
      if (ownerInbox) net.join(ownerInbox, { home: o.home === true, speak: true, via: topic });
      openRooms.add(R);
      hello(true);
      setTimeout(() => hello(true), 1e3);
      setTimeout(() => hello(true), 4e3);
      helloT = setInterval(() => hello(false), HELLO_EVERY);
      sweepT = setInterval(sweep, 1e4);
      return Object.assign(R, {
        send,
        box,
        publish,
        hello,
        pipe,
        shared: shared2,
        syncClock,
        clock,
        offset: () => offset,
        rtt: () => bestRtt,
        list,
        peer: (id) => peers.get(id) || null,
        here: (id) => {
          const p = peers.get(id);
          return !!(p && now() - p.at < GONE_AFTER);
        },
        pipeTo: (id) => pipes.get(id) || null,
        stats: () => net.stats(topic),
        setInfo(info) {
          R.info = info;
          hello(false);
        },
        setName(n) {
          R.name = clean(n, 40);
          hello(false);
        },
        close() {
          if (closed) return;
          publish({ k: "~bye" }).catch(() => {
          });
          closed = true;
          openRooms.delete(R);
          clearInterval(helloT);
          clearInterval(sweepT);
          for (const p of [...pipes.values()]) p.close();
          setTimeout(() => {
            if (handlers.get(topic) === onBytes) {
              handlers.delete(topic);
              net.leave(topic);
            }
            if (myInbox && handlers.get(myInbox) === onInbox) {
              handlers.delete(myInbox);
              net.leave(myInbox);
            }
            if (ownerInbox && !handlers.has(topic)) net.leave(ownerInbox);
          }, 400);
        }
      });
    });
  }
  function publicIp(ms) {
    return new Promise((res) => {
      let pc = null, done = false;
      const fin = (v) => {
        if (done) return;
        done = true;
        try {
          if (pc) pc.close();
        } catch (e) {
        }
        res(v || "");
      };
      try {
        pc = new RTCPeerConnection({ iceServers: ICE });
        pc.createDataChannel("ip");
        pc.onicecandidate = (e) => {
          if (!e.candidate) {
            fin("");
            return;
          }
          const c = String(e.candidate.candidate || "");
          const m = / typ srflx/.test(c) && c.match(/ ((?:\d{1,3}\.){3}\d{1,3}) \d+ typ srflx/);
          if (m && !/^(10|127|169\.254|192\.168)\./.test(m[1])) fin(m[1]);
        };
        pc.createOffer().then((o) => pc.setLocalDescription(o)).catch(() => fin(""));
        setTimeout(() => fin(""), ms || 5e3);
      } catch (e) {
        fin("");
      }
    });
  }
  function serverNear(ms) {
    return __async(this, null, function* () {
      if (typeof fetch !== "function") return null;
      try {
        const ctl = typeof AbortController === "function" ? new AbortController() : null;
        const t = setTimeout(() => {
          if (ctl) ctl.abort();
        }, ms || 4e3);
        const r = yield fetch(SITE + "/v1/near", { cache: "no-store", credentials: "omit", signal: ctl ? ctl.signal : void 0 });
        clearTimeout(t);
        if (!r.ok) return null;
        const j = yield r.json();
        if (!j || typeof j.room !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(j.room)) return null;
        return C.unb64url(j.room);
      } catch (e) {
        return null;
      }
    });
  }
  function nearby() {
    return __async(this, arguments, function* (o = {}) {
      const me = yield C.newMember();
      const made = [];
      let closed = false, t = 0;
      const seenMsg = /* @__PURE__ */ new Map();
      const merged = () => {
        const by = /* @__PURE__ */ new Map();
        for (const r of made) for (const p of r.list()) {
          const old = by.get(p.id);
          if (!old || p.at > old.at) by.set(p.id, p);
        }
        return [...by.values()];
      };
      const tell = () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (!closed && o.onPeers) {
            try {
              o.onPeers(merged());
            } catch (e) {
            }
          }
        }, 80);
      };
      const onMsg = (m, p) => {
        if (!o.onMsg || closed) return;
        const key = typeof m.i === "string" && m.i ? m.f + "|" + m.k + "|" + m.i + "|" + (m.n || 0) : m.f + "|" + m.k + "|" + m.at;
        if (seenMsg.has(key)) return;
        seenMsg.set(key, 1);
        if (seenMsg.size > 400) {
          for (const k of [...seenMsg.keys()].slice(0, 200)) seenMsg.delete(k);
        }
        try {
          o.onMsg(m, p);
        } catch (e) {
        }
      };
      const open = (secret) => __async(this, null, function* () {
        if (!secret || closed) return;
        const r = yield room({ secret, label: "bvnear", me, name: o.name || "", role: o.role || "phone", info: o.info || null, open: true, home: true, memory: o.memory, onPeers: tell, onMsg });
        if (closed) {
          r.close();
          return;
        }
        made.push(r);
        tell();
      });
      const ways = [
        serverNear(o.wait || 4e3).then(open).catch(() => {
        }),
        (typeof RTCPeerConnection === "function" ? publicIp(o.wait || 4500) : Promise.resolve("")).then((ip) => __async(this, null, function* () {
          if (ip) yield open(new Uint8Array(yield subtle.digest("SHA-256", te.encode("blokvane-nearby-v1|" + ip))).slice(0, 16));
        })).catch(() => {
        })
      ];
      yield Promise.race([Promise.all(ways), new Promise((res) => {
        const iv = setInterval(() => {
          if (made.length || closed) {
            clearInterval(iv);
            res();
          }
        }, 60);
        setTimeout(() => {
          clearInterval(iv);
          res();
        }, (o.wait || 4500) + 600);
      })]);
      if (!made.length) {
        yield Promise.all(ways);
        if (!made.length) {
          closed = true;
          return null;
        }
      }
      const each = (fn) => {
        let any = false;
        for (const r of made) {
          try {
            fn(r);
            any = true;
          } catch (e) {
          }
        }
        return any;
      };
      return {
        id: me.id,
        me,
        list: merged,
        setInfo(info) {
          o.info = info;
          each((r) => r.setInfo(info));
        },
        // (to one device: through every room it is in; boxed, so only that device can open it)
        box(to, m) {
          return __async(this, null, function* () {
            let sent = 0, err = null;
            for (const r of made) {
              if (!r.peer(to)) continue;
              try {
                yield r.box(to, m);
                sent++;
              } catch (e) {
                err = e;
              }
            }
            if (!sent) throw err || new Error("not here");
            return sent;
          });
        },
        send(m, to) {
          return Promise.all(made.map((r) => to && !r.peer(to) ? 0 : r.send(Object.assign({}, m), to).catch(() => 0)));
        },
        hello() {
          each((r) => r.hello(true));
        },
        close() {
          closed = true;
          clearTimeout(t);
          each((r) => r.close());
        }
      };
    });
  }
  function shrink(file, max = 512, quality = 0.82) {
    return __async(this, null, function* () {
      const url = URL.createObjectURL(file);
      try {
        const img = yield new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = url;
        });
        const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
        const cv = document.createElement("canvas");
        cv.width = w;
        cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        return cv.toDataURL("image/jpeg", quality);
      } finally {
        URL.revokeObjectURL(url);
      }
    });
  }
  function fit(file, maxChars = 8e4, max = 900) {
    return __async(this, null, function* () {
      let px = max, q = 0.8;
      for (let i = 0; i < 8; i++) {
        const d = yield shrink(file, px, q);
        if (d.length <= maxChars) return d;
        px = Math.max(160, Math.round(px * 0.78));
        q = Math.max(0.45, q - 0.06);
      }
      return "";
    });
  }
  const okPicture = (s) => typeof s === "string" && s.length < 9e4 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
  const sizeText = (n) => n < 1024 ? n + " bytes" : n < 1048576 ? Math.round(n / 1024) + " KB" : (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + " MB";
  const canCast = () => {
    try {
      return typeof PresentationRequest === "function" && !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    } catch (e) {
      return false;
    }
  };
  function castReq(url) {
    try {
      return canCast() && /^https:\/\//.test(String(url)) ? new PresentationRequest([String(url)]) : null;
    } catch (e) {
      return null;
    }
  }
  function castWatch(url, fn) {
    let off = false, av = null;
    const tell = (v) => {
      if (!off) {
        try {
          fn(!!v);
        } catch (e) {
        }
      }
    };
    const r = castReq(url);
    if (!r) {
      tell(false);
      return () => {
        off = true;
      };
    }
    try {
      r.getAvailability().then((a) => {
        if (off) return;
        av = a;
        tell(a.value);
        a.onchange = () => tell(a.value);
      }, () => tell(true));
    } catch (e) {
      tell(true);
    }
    return () => {
      off = true;
      if (av) av.onchange = null;
    };
  }
  function cast(url) {
    return __async(this, null, function* () {
      const r = castReq(url);
      if (!r) throw new Error("This browser can't cast. Try Chrome or Edge on a computer.");
      try {
        return yield r.start();
      } catch (e) {
        if (e && (e.name === "NotAllowedError" || e.name === "AbortError")) return null;
        if (e && e.name === "NotFoundError") throw new Error("No TV or second screen found. Check that it is on, and on the same Wi-Fi as this computer.");
        throw new Error("Casting didn't start. Try again.");
      }
    });
  }
  return {
    ICE,
    GO,
    PLAY,
    TV,
    SITE,
    HOME,
    newSecret,
    shortCode,
    normShort,
    codeSecret,
    link,
    parse,
    relays,
    room,
    nearby,
    publicIp,
    canCast,
    castWatch,
    cast,
    shrink,
    fit,
    okPicture,
    okId,
    clean,
    sizeText,
    onRelays: (fn) => {
      watchers.add(fn);
      return () => watchers.delete(fn);
    },
    localMemory,
    MAX_LONG
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BVLIVE;
