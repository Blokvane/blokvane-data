// Made from wt-core.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change wt-core.js and run node tools/old-js.js again.
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
var BVWT_CORE = (() => {
  "use strict";
  const subtle = crypto.subtle;
  const te = new TextEncoder(), td = new TextDecoder();
  const rand = (n) => crypto.getRandomValues(new Uint8Array(n));
  const isBytes = (b) => ArrayBuffer.isView(b) && b.BYTES_PER_ELEMENT === 1;
  const hex = (u) => Array.from(u, (b) => b.toString(16).padStart(2, "0")).join("");
  const unhex = (s) => {
    const u = new Uint8Array(s.length >> 1);
    for (let i = 0; i < u.length; i++) u[i] = parseInt(s.substr(i * 2, 2), 16);
    return u;
  };
  function b64(u) {
    let s = "";
    for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode.apply(null, u.subarray(i, i + 32768));
    return btoa(s);
  }
  function unb64(s) {
    const b = atob(s);
    const u = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
    return u;
  }
  function concat(...parts) {
    let n = 0;
    for (const p of parts) n += p.length;
    const out = new Uint8Array(n);
    let o = 0;
    for (const p of parts) {
      out.set(p, o);
      o += p.length;
    }
    return out;
  }
  const sha256 = (u) => __async(this, null, function* () {
    return new Uint8Array(yield subtle.digest("SHA-256", u));
  });
  function hkdf(ikm, salt, info, bits) {
    return __async(this, null, function* () {
      try {
        const k = yield subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
        return new Uint8Array(yield subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, bits));
      } catch (e) {
        const hmac = (key, data) => __async(this, null, function* () {
          return new Uint8Array(yield subtle.sign("HMAC", yield subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]), data));
        });
        const prk = yield hmac(salt, new Uint8Array(ikm.buffer || ikm));
        const out = new Uint8Array(bits / 8);
        let t = new Uint8Array(0);
        for (let i = 1, o = 0; o < out.length; i++, o += 32) {
          t = yield hmac(prk, concat(t, info, Uint8Array.of(i)));
          out.set(t.subarray(0, Math.min(32, out.length - o)), o);
        }
        return out;
      }
    });
  }
  const ALPHA = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const newCode = () => Array.from(rand(12), (b) => ALPHA[b & 31]).join("");
  function normCode(s) {
    const t = String(s || "").toUpperCase().replace(/[\s\-_.]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
    return /^[0-9A-HJKMNP-TV-Z]{12}$/.test(t) ? t : "";
  }
  const prettyCode = (c) => (normCode(c).match(/.{4}/g) || []).join("-");
  const INVITE_BASE = "https://blokvane.com/watch";
  const inviteLink = (code) => normCode(code) ? INVITE_BASE + "#" + prettyCode(code) : "";
  function invitePage(url) {
    let u, b;
    try {
      u = new URL(url);
      b = new URL(INVITE_BASE);
    } catch (e) {
      return false;
    }
    return /^https?:$/.test(u.protocol) && !u.port && !u.username && !u.password && u.hostname.replace(/^www\./, "") === b.hostname && u.pathname.replace(/\/+$/, "") === b.pathname;
  }
  function inviteCode(url) {
    if (!invitePage(url)) return "";
    const i = String(url).indexOf("#");
    let h = i < 0 ? "" : String(url).slice(i + 1);
    try {
      h = decodeURIComponent(h);
    } catch (e) {
    }
    const m = /(?:^|&)bvwatch=([^&]*)/.exec(h);
    return normCode(m ? m[1] : h);
  }
  const SALT = te.encode("blokvane-watch-together-v1");
  function roomKeys(code) {
    return __async(this, null, function* () {
      const c = normCode(code);
      if (!c) throw new Error("That party code is not complete.");
      const base = yield subtle.importKey("raw", te.encode(c), "PBKDF2", false, ["deriveBits"]);
      const root = yield subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: SALT, iterations: 21e4 }, base, 256);
      const salt = new Uint8Array(32);
      const topic = hex(yield hkdf(root, salt, te.encode("bvwatch topic"), 160));
      const key = yield subtle.importKey("raw", yield hkdf(root, salt, te.encode("bvwatch aes-gcm"), 256), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
      return { code: c, topic, key };
    });
  }
  function secretKeys(secret, label) {
    return __async(this, null, function* () {
      if (!isBytes(secret) || secret.length < 16) throw new Error("That link is not complete.");
      const salt = te.encode("blokvane-" + label + "-v1");
      const topic = hex(yield hkdf(secret, salt, te.encode(label + " topic"), 160));
      const key = yield subtle.importKey("raw", yield hkdf(secret, salt, te.encode(label + " aes-gcm"), 256), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
      return { topic, key };
    });
  }
  const b64url = (u) => b64(u).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  function unb64url(s) {
    if (typeof s !== "string" || !/^[A-Za-z0-9_-]*$/.test(s)) throw new Error("not base64url");
    const t = s.replace(/-/g, "+").replace(/_/g, "/");
    return unb64(t + "=".repeat((4 - t.length % 4) % 4));
  }
  const MAX_PLAIN = 6e3;
  const PK = 65, SIG = 64;
  const aad = (ver, topic) => te.encode("bvw" + ver + ":" + topic);
  function encrypt(key, topic, ver, plain) {
    return __async(this, null, function* () {
      const iv = rand(12);
      const ct = new Uint8Array(yield subtle.encrypt({ name: "AES-GCM", iv, additionalData: aad(ver, topic) }, key, plain));
      return concat(Uint8Array.of(ver), iv, ct);
    });
  }
  function decrypt(key, topic, ver, bytes, max) {
    return __async(this, null, function* () {
      if (!isBytes(bytes) || bytes.length < 29 || bytes.length > max + 29 || bytes[0] !== ver) return null;
      try {
        return new Uint8Array(yield subtle.decrypt({ name: "AES-GCM", iv: bytes.subarray(1, 13), additionalData: aad(ver, topic) }, key, bytes.subarray(13)));
      } catch (e) {
        return null;
      }
    });
  }
  const json = (b) => {
    try {
      const o = JSON.parse(td.decode(b));
      return o && typeof o === "object" && !Array.isArray(o) ? o : null;
    } catch (e) {
      return null;
    }
  };
  function seal(key, topic, obj) {
    return __async(this, null, function* () {
      const plain = te.encode(JSON.stringify(obj));
      if (plain.length > MAX_PLAIN) throw new Error("message too big");
      return encrypt(key, topic, 1, plain);
    });
  }
  function open(key, topic, bytes) {
    return __async(this, null, function* () {
      const p = yield decrypt(key, topic, 1, bytes, MAX_PLAIN);
      return p ? json(p) : null;
    });
  }
  const EC = { name: "ECDSA", namedCurve: "P-256" }, ECSIG = { name: "ECDSA", hash: "SHA-256" };
  const memberId = (pk) => __async(this, null, function* () {
    return hex((yield sha256(pk)).subarray(0, 8));
  });
  const signed = (topic, body) => concat(te.encode("bvw-sig1:" + topic + ":"), body);
  function newMember(jwk) {
    return __async(this, null, function* () {
      let priv, pub;
      if (jwk) {
        if (typeof jwk !== "object" || jwk.kty !== "EC" || jwk.crv !== "P-256" || typeof jwk.d !== "string") throw new Error("not a party key");
        priv = yield subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, d: jwk.d, ext: true }, EC, true, ["sign"]);
        pub = yield subtle.importKey("jwk", { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, ext: true }, EC, true, ["verify"]);
      } else {
        const kp = yield subtle.generateKey(EC, true, ["sign", "verify"]);
        priv = kp.privateKey;
        pub = kp.publicKey;
        jwk = yield subtle.exportKey("jwk", priv);
      }
      const pk = new Uint8Array(yield subtle.exportKey("raw", pub));
      return { id: yield memberId(pk), pk, priv, jwk: { kty: "EC", crv: "P-256", x: jwk.x, y: jwk.y, d: jwk.d } };
    });
  }
  function sealSigned(key, topic, obj, member) {
    return __async(this, null, function* () {
      const body = te.encode(JSON.stringify(obj));
      if (body.length > MAX_PLAIN) throw new Error("message too big");
      const sig = new Uint8Array(yield subtle.sign(ECSIG, member.priv, signed(topic, body)));
      return encrypt(key, topic, 2, concat(member.pk, sig, body));
    });
  }
  function openSigned(key, topic, bytes) {
    return __async(this, null, function* () {
      const p = yield decrypt(key, topic, 2, bytes, MAX_PLAIN + PK + SIG);
      if (!p || p.length < PK + SIG + 2 || p[0] !== 4) return null;
      const m = json(p.subarray(PK + SIG));
      return m ? { m, pk: p.slice(0, PK), sig: p.slice(PK, PK + SIG), body: p.slice(PK + SIG) } : null;
    });
  }
  function verifier() {
    const keys = /* @__PURE__ */ new Map();
    return (topic, o) => __async(this, null, function* () {
      if (!o || !o.m || !isBytes(o.pk) || o.pk.length !== PK || !isBytes(o.sig) || o.sig.length !== SIG) return "";
      const id = yield memberId(o.pk);
      if (o.m.f !== id) return "";
      const pkh = hex(o.pk);
      let k = keys.get(id);
      const known = !!k && k.pk === pkh;
      if (!known) {
        try {
          k = { pk: pkh, key: yield subtle.importKey("raw", o.pk, EC, false, ["verify"]) };
        } catch (e) {
          return "";
        }
      }
      let ok = false;
      try {
        ok = yield subtle.verify(ECSIG, k.key, o.sig, signed(topic, o.body));
      } catch (e) {
      }
      if (!ok) return "";
      if (!known) {
        if (keys.size >= 256) keys.delete(keys.keys().next().value);
        keys.set(id, k);
      }
      return id;
    });
  }
  const BI = typeof BigInt === "function" ? BigInt : null;
  const canSign = !!BI;
  const n0 = BI ? BI(0) : 0, n1 = BI ? BI(1) : 1, n2 = BI ? BI(2) : 2, n3 = BI ? BI(3) : 3, n4 = BI ? BI(4) : 4, n8 = BI ? BI(8) : 8;
  const P = BI ? BI("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F") : 0;
  const N = BI ? BI("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141") : 0;
  const G = BI ? [BI("0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798"), BI("0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8"), n1] : null;
  const INF = [n0, n1, n0];
  const md = (a, m = P) => {
    a %= m;
    return a < n0 ? a + m : a;
  };
  function inv(a, m = P) {
    let lm = n1, hm = n0, low = md(a, m), high = m;
    while (low > n1) {
      const r = high / low;
      const nm = hm - lm * r, nw = high - low * r;
      hm = lm;
      high = low;
      lm = nm;
      low = nw;
    }
    return md(lm, m);
  }
  function dbl(p) {
    const [X, Y, Z] = p;
    if (Z === n0 || Y === n0) return INF;
    const YY = md(Y * Y), S = md(n4 * X * YY), M = md(n3 * X * X);
    const X3 = md(M * M - n2 * S);
    return [X3, md(M * (S - X3) - n8 * YY * YY), md(n2 * Y * Z)];
  }
  function add(p, q) {
    const [X1, Y1, Z1] = p, [X2, Y2, Z2] = q;
    if (Z1 === n0) return q;
    if (Z2 === n0) return p;
    const Z1Z1 = md(Z1 * Z1), Z2Z2 = md(Z2 * Z2);
    const U1 = md(X1 * Z2Z2), U2 = md(X2 * Z1Z1), S1 = md(Y1 * Z2 * Z2Z2), S2 = md(Y2 * Z1 * Z1Z1);
    if (U1 === U2) return S1 === S2 ? dbl(p) : INF;
    const H = md(U2 - U1), R = md(S2 - S1), HH = md(H * H), HHH = md(H * HH);
    const X3 = md(R * R - HHH - n2 * U1 * HH);
    return [X3, md(R * (U1 * HH - X3) - S1 * HHH), md(H * Z1 * Z2)];
  }
  function mul(k, p = G) {
    let r = INF, a = p;
    while (k > n0) {
      if (k & n1) r = add(r, a);
      a = dbl(a);
      k >>= n1;
    }
    return r;
  }
  function affine(p) {
    const zi = inv(p[2]), z2 = md(zi * zi);
    return [md(p[0] * z2), md(p[1] * z2 * zi)];
  }
  const toInt = (u) => BI("0x" + (hex(u) || "0"));
  const toBytes32 = (n) => unhex(n.toString(16).padStart(64, "0"));
  const tagHashes = {};
  function tagged(tag, msg) {
    return __async(this, null, function* () {
      const t = tagHashes[tag] || (tagHashes[tag] = yield sha256(te.encode(tag)));
      return sha256(concat(t, t, msg));
    });
  }
  function newSigner(secret) {
    if (!BI) throw new Error("This browser has no BigInt: Nostr relays are skipped, MQTT carries the messages.");
    let d = secret ? toInt(secret) % N : n0;
    while (d === n0) d = toInt(rand(32)) % N;
    const [px, py] = affine(mul(d));
    if (py & n1) d = N - d;
    const pxb = toBytes32(px);
    return { d, db: toBytes32(d), px: pxb, pub: hex(pxb) };
  }
  function schnorr(_0, _1) {
    return __async(this, arguments, function* (msg, s, aux = rand(32)) {
      const ah = yield tagged("BIP0340/aux", aux);
      const t = s.db.map((b, i) => b ^ ah[i]);
      const k0 = toInt(yield tagged("BIP0340/nonce", concat(t, s.px, msg))) % N;
      if (k0 === n0) throw new Error("bad nonce");
      const [rx, ry] = affine(mul(k0));
      const k = ry & n1 ? N - k0 : k0;
      const rb = toBytes32(rx);
      const e = toInt(yield tagged("BIP0340/challenge", concat(rb, s.px, msg))) % N;
      return concat(rb, toBytes32(md(k + e * s.d, N)));
    });
  }
  const nostrKind = (topic) => 2e4 + parseInt(topic.slice(0, 6), 16) % 1e4;
  function nostrEvent(s, topic, content) {
    return __async(this, null, function* () {
      const ev = { pubkey: s.pub, created_at: Math.floor(Date.now() / 1e3), kind: nostrKind(topic), tags: [["x", topic]], content };
      const id = yield sha256(te.encode(JSON.stringify([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content])));
      ev.id = hex(id);
      ev.sig = hex(yield schnorr(id, s));
      return ev;
    });
  }
  const MQ = {
    len(n) {
      const o = [];
      do {
        let b = n % 128;
        n = Math.floor(n / 128);
        if (n > 0) b |= 128;
        o.push(b);
      } while (n > 0);
      return o;
    },
    s(str) {
      const b = te.encode(str);
      return concat(Uint8Array.of(b.length >> 8, b.length & 255), b);
    },
    pkt(type, body) {
      return concat(Uint8Array.from([type, ...MQ.len(body.length)]), body);
    },
    connect(id, user, pass, keep = 60) {
      const parts = [MQ.s("MQTT"), Uint8Array.of(4, 2 | (user ? 128 : 0) | (pass ? 64 : 0), keep >> 8, keep & 255), MQ.s(id)];
      if (user) parts.push(MQ.s(user));
      if (pass) parts.push(MQ.s(pass));
      return MQ.pkt(16, concat(...parts));
    },
    subscribe(pid, topic) {
      return MQ.pkt(130, concat(Uint8Array.of(pid >> 8, pid & 255), MQ.s(topic), Uint8Array.of(0)));
    },
    unsubscribe(pid, topic) {
      return MQ.pkt(162, concat(Uint8Array.of(pid >> 8, pid & 255), MQ.s(topic)));
    },
    publish(topic, payload) {
      return MQ.pkt(48, concat(MQ.s(topic), payload));
    },
    ping: () => Uint8Array.of(192, 0),
    bye: () => Uint8Array.of(224, 0),
    // whole packets from a byte buffer: { list: [{ type, flags, body }], rest } (rest waits for more bytes)
    read(buf) {
      const list = [];
      let i = 0;
      for (; ; ) {
        if (buf.length - i < 2) break;
        let len = 0, mult = 1, j = i + 1, b, n = 0, short = false;
        do {
          if (j >= buf.length) {
            short = true;
            break;
          }
          b = buf[j++];
          len += (b & 127) * mult;
          mult *= 128;
          if (++n > 4) throw new Error("bad packet length");
        } while (b & 128);
        if (short || buf.length - j < len) break;
        list.push({ type: buf[i] >> 4, flags: buf[i] & 15, body: buf.subarray(j, j + len) });
        i = j + len;
      }
      return { list, rest: buf.slice(i) };
    },
    publishParts(flags, body) {
      const tl = body[0] << 8 | body[1];
      let o = 2 + tl;
      if (flags >> 1 & 3) o += 2;
      return { topic: td.decode(body.subarray(2, 2 + tl)), payload: body.subarray(o) };
    }
  };
  return {
    rand,
    hex,
    unhex,
    b64,
    unb64,
    concat,
    sha256,
    newCode,
    normCode,
    prettyCode,
    INVITE_BASE,
    inviteLink,
    invitePage,
    inviteCode,
    roomKeys,
    secretKeys,
    hkdf,
    canSign,
    b64url,
    unb64url,
    seal,
    open,
    newMember,
    memberId,
    sealSigned,
    openSigned,
    verifier,
    MAX_PLAIN,
    newSigner,
    schnorr,
    nostrEvent,
    nostrKind,
    MQ,
    _ec: { mul, affine, G, N, P, toInt, toBytes32 }
  };
})();
if (typeof module !== "undefined" && module.exports) module.exports = BVWT_CORE;
