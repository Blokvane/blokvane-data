// Blokvane Watch Together: the building blocks that never touch a web page.
// Party codes and invite links, the keys made from a code, sealing every message (AES-GCM) so the public relays
// only ever carry noise, each member's own signing key (so nobody in a party can speak for someone else), signing
// Nostr relay events (BIP-340 Schnorr signatures on secp256k1), and reading and writing MQTT packets.
// Used by the service worker (bg-watch.js) and the Watch Together page (watch.js).
// Plain script: defines BVWT_CORE. Needs only the browser's built-in crypto (also runs in Node 19+ for checks).
var BVWT_CORE = (() => {
  'use strict';
  const subtle = crypto.subtle;
  const te = new TextEncoder(), td = new TextDecoder();
  const rand = n => crypto.getRandomValues(new Uint8Array(n));
  const isBytes = b => ArrayBuffer.isView(b) && b.BYTES_PER_ELEMENT === 1;
  const hex = u => Array.from(u, b => b.toString(16).padStart(2, '0')).join('');
  const unhex = s => { const u = new Uint8Array(s.length >> 1); for (let i = 0; i < u.length; i++) u[i] = parseInt(s.substr(i * 2, 2), 16); return u; };
  function b64(u) { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); }
  function unb64(s) { const b = atob(s); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function concat(...parts) { let n = 0; for (const p of parts) n += p.length; const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; }
  const sha256 = async u => new Uint8Array(await subtle.digest('SHA-256', u));

  // ---------- party codes ----------
  // 12 characters from Crockford's base32 (no I, L, O or U, so nothing looks alike): 60 random bits.
  // The same code is the invite link's secret and the code people can type. It is stretched below
  // (PBKDF2, 210,000 rounds), so guessing codes is far too slow to be worth trying.
  const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const newCode = () => Array.from(rand(12), b => ALPHA[b & 31]).join('');
  // accepts "h7km-q2xp 9rtd", reads O as 0 and I or L as 1; anything else that isn't 12 good characters is ''
  function normCode(s) {
    const t = String(s || '').toUpperCase().replace(/[\s\-_.]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1');
    return /^[0-9A-HJKMNP-TV-Z]{12}$/.test(t) ? t : '';
  }
  const prettyCode = c => (normCode(c).match(/.{4}/g) || []).join('-');

  // ---------- invite links ----------
  // An invite link never points at a video site: it is Blokvane's own page with the code after the "#" (which
  // browsers never send anywhere). Blokvane catches the link before it loads and takes the tab to its own Watch
  // together page, so no website ever has the code in its address or its history of addresses.
  // (features/watchparty.js has the same address for the case where the page loads anyway; a check keeps them equal.)
  const INVITE_BASE = 'https://blokvane.com/watch';
  const inviteLink = code => (normCode(code) ? INVITE_BASE + '#' + prettyCode(code) : '');
  // the invite page itself: https or http, with or without www and a / at the end, on the usual port
  function invitePage(url) {
    let u, b;
    try { u = new URL(url); b = new URL(INVITE_BASE); } catch (e) { return false; }
    return /^https?:$/.test(u.protocol) && !u.port && !u.username && !u.password && u.hostname.replace(/^www\./, '') === b.hostname &&
      u.pathname.replace(/\/+$/, '') === b.pathname;
  }
  // the code in an invite link: "#H7KM-Q2XP-9RTD", "#H7KMQ2XP9RTD" or "#bvwatch=H7KMQ2XP9RTD" ('' when it isn't one)
  function inviteCode(url) {
    if (!invitePage(url)) return '';
    const i = String(url).indexOf('#');
    let h = i < 0 ? '' : String(url).slice(i + 1);
    try { h = decodeURIComponent(h); } catch (e) {}
    const m = /(?:^|&)bvwatch=([^&]*)/.exec(h);
    return normCode(m ? m[1] : h);
  }

  // ---------- keys ----------
  // From one code: the relay topic (a meaningless name both sides can find) and the AES-GCM key.
  const SALT = te.encode('blokvane-watch-together-v1');
  async function roomKeys(code) {
    const c = normCode(code);
    if (!c) throw new Error('That party code is not complete.');
    const base = await subtle.importKey('raw', te.encode(c), 'PBKDF2', false, ['deriveBits']);
    const root = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: SALT, iterations: 210000 }, base, 256);
    const hk = await subtle.importKey('raw', root, 'HKDF', false, ['deriveBits', 'deriveKey']);
    const salt = new Uint8Array(32);
    const topic = hex(new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode('bvwatch topic') }, hk, 160)));
    const key = await subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode('bvwatch aes-gcm') }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { code: c, topic, key };
  }

  // From a long random secret (the private link of a TV screen "anywhere", 16 random bytes): the same two things,
  // with no slow stretching (a random secret can't be guessed the way a typed code can). label keeps uses apart.
  async function secretKeys(secret, label) {
    if (!isBytes(secret) || secret.length < 16) throw new Error('That link is not complete.');
    const hk = await subtle.importKey('raw', secret, 'HKDF', false, ['deriveBits', 'deriveKey']);
    const salt = te.encode('blokvane-' + label + '-v1');
    const topic = hex(new Uint8Array(await subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode(label + ' topic') }, hk, 160)));
    const key = await subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: te.encode(label + ' aes-gcm') }, hk, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    return { topic, key };
  }
  // base64 for addresses (no + / = that a link would mangle)
  const b64url = u => b64(u).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  function unb64url(s) {
    if (typeof s !== 'string' || !/^[A-Za-z0-9_-]*$/.test(s)) throw new Error('not base64url');
    const t = s.replace(/-/g, '+').replace(/_/g, '/');
    return unb64(t + '='.repeat((4 - t.length % 4) % 4));
  }

  // ---------- sealed messages ----------
  // [version] [12 random bytes (the IV)] [encrypted content + 16 byte tag]. The version and the topic are bound in as
  // extra authenticated data, so a message can't be moved to another party. Anything that fails to open is dropped.
  //   version 1: the content is JSON (only the party key behind it: anyone with the code can make one)
  //   version 2: the content is [the sender's public key (65 bytes)] [its signature (64 bytes)] [JSON], what parties
  //              send. The signature covers the topic and the JSON, and the sender's id is made from its public key.
  const MAX_PLAIN = 6000;
  const PK = 65, SIG = 64;
  const aad = (ver, topic) => te.encode('bvw' + ver + ':' + topic);
  async function encrypt(key, topic, ver, plain) {
    const iv = rand(12);
    const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(ver, topic) }, key, plain));
    return concat(Uint8Array.of(ver), iv, ct);
  }
  async function decrypt(key, topic, ver, bytes, max) {
    if (!isBytes(bytes) || bytes.length < 29 || bytes.length > max + 29 || bytes[0] !== ver) return null;
    try { return new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: bytes.subarray(1, 13), additionalData: aad(ver, topic) }, key, bytes.subarray(13))); } catch (e) { return null; }
  }
  const json = b => { try { const o = JSON.parse(td.decode(b)); return o && typeof o === 'object' && !Array.isArray(o) ? o : null; } catch (e) { return null; } };
  async function seal(key, topic, obj) {
    const plain = te.encode(JSON.stringify(obj));
    if (plain.length > MAX_PLAIN) throw new Error('message too big');
    return encrypt(key, topic, 1, plain);
  }
  async function open(key, topic, bytes) { const p = await decrypt(key, topic, 1, bytes, MAX_PLAIN); return p ? json(p) : null; }

  // ---------- each member's own key (ECDSA P-256, built into every browser) ----------
  // Made fresh for every party you join, so it says nothing about you. Your id in the party is made from it, so
  // nobody can send a message as you, take your place, or say goodbye for you.
  const EC = { name: 'ECDSA', namedCurve: 'P-256' }, ECSIG = { name: 'ECDSA', hash: 'SHA-256' };
  const memberId = async pk => hex((await sha256(pk)).subarray(0, 8));
  const signed = (topic, body) => concat(te.encode('bvw-sig1:' + topic + ':'), body);
  // jwk: a key saved earlier (to pick up the same party after the browser restarts the background)
  async function newMember(jwk) {
    let priv, pub;
    if (jwk) {
      if (typeof jwk !== 'object' || jwk.kty !== 'EC' || jwk.crv !== 'P-256' || typeof jwk.d !== 'string') throw new Error('not a party key');
      priv = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, d: jwk.d, ext: true }, EC, true, ['sign']);
      pub = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, ext: true }, EC, true, ['verify']);
    } else {
      const kp = await subtle.generateKey(EC, true, ['sign', 'verify']);
      priv = kp.privateKey; pub = kp.publicKey;
      jwk = await subtle.exportKey('jwk', priv);
    }
    const pk = new Uint8Array(await subtle.exportKey('raw', pub));
    return { id: await memberId(pk), pk, priv, jwk: { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y, d: jwk.d } };
  }
  async function sealSigned(key, topic, obj, member) {
    const body = te.encode(JSON.stringify(obj));
    if (body.length > MAX_PLAIN) throw new Error('message too big');
    const sig = new Uint8Array(await subtle.sign(ECSIG, member.priv, signed(topic, body)));
    return encrypt(key, topic, 2, concat(member.pk, sig, body));
  }
  // opened, not yet checked: { m, pk, sig, body } or null (check it with a verifier before believing it)
  async function openSigned(key, topic, bytes) {
    const p = await decrypt(key, topic, 2, bytes, MAX_PLAIN + PK + SIG);
    if (!p || p.length < PK + SIG + 2 || p[0] !== 4) return null;
    const m = json(p.subarray(PK + SIG));
    return m ? { m, pk: p.slice(0, PK), sig: p.slice(PK, PK + SIG), body: p.slice(PK + SIG) } : null;
  }
  // checks opened messages: the signature must be right and the sender (m.f) must be the id made from the key that
  // signed. Returns that id, or '' to drop the message. Each member's key is read once and remembered.
  function verifier() {
    const keys = new Map(); // id -> { pk (hex), key }
    return async (topic, o) => {
      if (!o || !o.m || !isBytes(o.pk) || o.pk.length !== PK || !isBytes(o.sig) || o.sig.length !== SIG) return '';
      const id = await memberId(o.pk);
      if (o.m.f !== id) return '';
      const pkh = hex(o.pk);
      let k = keys.get(id);
      const known = !!k && k.pk === pkh;
      if (!known) { try { k = { pk: pkh, key: await subtle.importKey('raw', o.pk, EC, false, ['verify']) }; } catch (e) { return ''; } }
      let ok = false;
      try { ok = await subtle.verify(ECSIG, k.key, o.sig, signed(topic, o.body)); } catch (e) {}
      if (!ok) return '';
      if (!known) { if (keys.size >= 256) keys.delete(keys.keys().next().value); keys.set(id, k); }
      return id;
    };
  }

  // ---------- secp256k1 Schnorr signatures (BIP-340), only for signing Nostr relay events ----------
  // Every Nostr event must carry a valid signature or relays refuse it. The key is random, made fresh each
  // time the background starts, and says nothing about you. (Relay event signatures aren't checked on arrival:
  // what counts is the member's own signature inside the sealed message, checked by verifier() above.)
  const P = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2Fn;
  const N = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;
  const G = [0x79BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798n, 0x483ADA7726A3C4655DA4FBFC0E1108A8FD17B448A68554199C47D08FFB10D4B8n, 1n];
  const INF = [0n, 1n, 0n];
  const md = (a, m = P) => { a %= m; return a < 0n ? a + m : a; };
  function inv(a, m = P) {
    let lm = 1n, hm = 0n, low = md(a, m), high = m;
    while (low > 1n) { const r = high / low; const nm = hm - lm * r, nw = high - low * r; hm = lm; high = low; lm = nm; low = nw; }
    return md(lm, m);
  }
  // points in Jacobian form [X, Y, Z]: x = X/Z^2, y = Y/Z^3
  function dbl(p) {
    const [X, Y, Z] = p;
    if (Z === 0n || Y === 0n) return INF;
    const YY = md(Y * Y), S = md(4n * X * YY), M = md(3n * X * X);
    const X3 = md(M * M - 2n * S);
    return [X3, md(M * (S - X3) - 8n * YY * YY), md(2n * Y * Z)];
  }
  function add(p, q) {
    const [X1, Y1, Z1] = p, [X2, Y2, Z2] = q;
    if (Z1 === 0n) return q;
    if (Z2 === 0n) return p;
    const Z1Z1 = md(Z1 * Z1), Z2Z2 = md(Z2 * Z2);
    const U1 = md(X1 * Z2Z2), U2 = md(X2 * Z1Z1), S1 = md(Y1 * Z2 * Z2Z2), S2 = md(Y2 * Z1 * Z1Z1);
    if (U1 === U2) return S1 === S2 ? dbl(p) : INF;
    const H = md(U2 - U1), R = md(S2 - S1), HH = md(H * H), HHH = md(H * HH);
    const X3 = md(R * R - HHH - 2n * U1 * HH);
    return [X3, md(R * (U1 * HH - X3) - S1 * HHH), md(H * Z1 * Z2)];
  }
  function mul(k, p = G) { let r = INF, a = p; while (k > 0n) { if (k & 1n) r = add(r, a); a = dbl(a); k >>= 1n; } return r; }
  function affine(p) { const zi = inv(p[2]), z2 = md(zi * zi); return [md(p[0] * z2), md(p[1] * z2 * zi)]; }
  const toInt = u => BigInt('0x' + (hex(u) || '0'));
  const toBytes32 = n => unhex(n.toString(16).padStart(64, '0'));
  const tagHashes = {};
  async function tagged(tag, msg) { const t = tagHashes[tag] || (tagHashes[tag] = await sha256(te.encode(tag))); return sha256(concat(t, t, msg)); }
  // a fresh signing key; d is already flipped so its public point has an even y (BIP-340)
  function newSigner(secret) {
    let d = secret ? toInt(secret) % N : 0n;
    while (d === 0n) d = toInt(rand(32)) % N;
    const [px, py] = affine(mul(d));
    if (py & 1n) d = N - d;
    const pxb = toBytes32(px);
    return { d, db: toBytes32(d), px: pxb, pub: hex(pxb) };
  }
  async function schnorr(msg, s, aux = rand(32)) {
    const ah = await tagged('BIP0340/aux', aux);
    const t = s.db.map((b, i) => b ^ ah[i]);
    const k0 = toInt(await tagged('BIP0340/nonce', concat(t, s.px, msg))) % N;
    if (k0 === 0n) throw new Error('bad nonce');
    const [rx, ry] = affine(mul(k0));
    const k = ry & 1n ? N - k0 : k0;
    const rb = toBytes32(rx);
    const e = toInt(await tagged('BIP0340/challenge', concat(rb, s.px, msg))) % N;
    return concat(rb, toBytes32(md(k + e * s.d, N)));
  }

  // ---------- Nostr events ----------
  // Ephemeral kinds (20000-29999) are passed along to listeners and never stored by relays.
  const nostrKind = topic => 20000 + (parseInt(topic.slice(0, 6), 16) % 10000);
  async function nostrEvent(s, topic, content) {
    const ev = { pubkey: s.pub, created_at: Math.floor(Date.now() / 1000), kind: nostrKind(topic), tags: [['x', topic]], content };
    const id = await sha256(te.encode(JSON.stringify([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content])));
    ev.id = hex(id);
    ev.sig = hex(await schnorr(id, s));
    return ev;
  }

  // ---------- MQTT 3.1.1 packets (only what a listener and QoS 0 sender needs) ----------
  const MQ = {
    len(n) { const o = []; do { let b = n % 128; n = Math.floor(n / 128); if (n > 0) b |= 128; o.push(b); } while (n > 0); return o; },
    s(str) { const b = te.encode(str); return concat(Uint8Array.of(b.length >> 8, b.length & 255), b); },
    pkt(type, body) { return concat(Uint8Array.from([type, ...MQ.len(body.length)]), body); },
    connect(id, user, pass, keep = 60) {
      const parts = [MQ.s('MQTT'), Uint8Array.of(4, 0x02 | (user ? 0x80 : 0) | (pass ? 0x40 : 0), keep >> 8, keep & 255), MQ.s(id)];
      if (user) parts.push(MQ.s(user));
      if (pass) parts.push(MQ.s(pass));
      return MQ.pkt(0x10, concat(...parts));
    },
    subscribe(pid, topic) { return MQ.pkt(0x82, concat(Uint8Array.of(pid >> 8, pid & 255), MQ.s(topic), Uint8Array.of(0))); },
    unsubscribe(pid, topic) { return MQ.pkt(0xA2, concat(Uint8Array.of(pid >> 8, pid & 255), MQ.s(topic))); },
    publish(topic, payload) { return MQ.pkt(0x30, concat(MQ.s(topic), payload)); },
    ping: () => Uint8Array.of(0xC0, 0),
    bye: () => Uint8Array.of(0xE0, 0),
    // whole packets from a byte buffer: { list: [{ type, flags, body }], rest } (rest waits for more bytes)
    read(buf) {
      const list = [];
      let i = 0;
      for (;;) {
        if (buf.length - i < 2) break;
        let len = 0, mult = 1, j = i + 1, b, n = 0, short = false;
        do {
          if (j >= buf.length) { short = true; break; }
          b = buf[j++];
          len += (b & 127) * mult;
          mult *= 128;
          if (++n > 4) throw new Error('bad packet length');
        } while (b & 128);
        if (short || buf.length - j < len) break;
        list.push({ type: buf[i] >> 4, flags: buf[i] & 15, body: buf.subarray(j, j + len) });
        i = j + len;
      }
      return { list, rest: buf.slice(i) };
    },
    publishParts(flags, body) {
      const tl = (body[0] << 8) | body[1];
      let o = 2 + tl;
      if ((flags >> 1) & 3) o += 2;
      return { topic: td.decode(body.subarray(2, 2 + tl)), payload: body.subarray(o) };
    }
  };

  return { rand, hex, unhex, b64, unb64, concat, sha256, newCode, normCode, prettyCode, INVITE_BASE, inviteLink, invitePage, inviteCode,
    roomKeys, secretKeys, b64url, unb64url, seal, open, newMember, memberId, sealSigned, openSigned, verifier, MAX_PLAIN,
    newSigner, schnorr, nostrEvent, nostrKind, MQ, _ec: { mul, affine, G, N, P, toInt, toBytes32 } };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BVWT_CORE;
