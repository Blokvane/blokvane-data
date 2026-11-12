// Blokvane Live: rooms on the free public relays, shared by everything that connects two or more devices (your phone
// and your computer, your computers, friends, TV screens and party games). There is no Blokvane server in between:
// - A room is made from a random secret (in a QR code or a link, after the # so it is never sent to any website).
//   Every message is sealed with a key made from that secret and signed with the sender's own key (lib/wt-core.js),
//   and goes out through several relays at once (lib/wt-net.js). The relays only ever see sealed bytes.
// - Who is in the room: everyone says hello now and then (with a name and what they are), and is gone after a while
//   without a word.
// - Long messages are cut in parts and put back together; a message for one device only can be sealed for it alone
//   (box), so nobody else in the room can open it, not even with the room's secret.
// - Big things (files, photos, a camera or a tab) go straight between two devices (WebRTC, encrypted by the browser),
//   set up through the room. A pipe carries messages and files in order, with back-pressure.
// - A shared clock (each device learns how far its clock is from the host's), and a shared list where the newest
//   change of each entry wins (votes, a queue number, posts on a board).
// Plain script for pages: defines BVLIVE (needs BVWT_CORE and BVWT_NET). Runs in Blokvane's own pages, the hidden page,
// the phone pages and the TV pages.
var BVLIVE = (() => {
  'use strict';
  const C = BVWT_CORE, NET = BVWT_NET;
  const te = new TextEncoder(), td = new TextDecoder();
  const subtle = crypto.subtle;
  const ICE = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: ['stun:stun.cloudflare.com:3478'] }];
  const GO = 'https://app.blokvane.com/go/';
  const PLAY = 'https://app.blokvane.com/play/';
  const TV = 'https://app.blokvane.com/tv/';
  const PART = 4200;                 // bytes of a long message in each part (sealed, it stays under the 6 KB limit)
  const MAX_LONG = 96 * 1024;        // the longest message the relays carry (anything bigger goes through a pipe)
  const HELLO_EVERY = 25000, GONE_AFTER = 75000;
  const CHUNK = 64 * 1024, HIGH = 2 * 1024 * 1024, LOW = 512 * 1024;
  const now = () => Date.now();
  const okId = id => typeof id === 'string' && /^[0-9a-f]{16}$/.test(id);
  const clean = (v, max) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 80);

  // ---------- secrets, codes and links ----------
  const newSecret = () => C.b64url(C.rand(16));
  // a code people can read and type (no 0/O, 1/I/L): 6 letters for a TV, a room or a help session
  const LETTERS = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const DIGITS = '23456789';
  function shortCode(n = 6, kind) {
    const set = kind === 'digits' ? DIGITS : LETTERS;
    const r = C.rand(n);
    let s = '';
    for (let i = 0; i < n; i++) s += set[r[i] % set.length];
    return s;
  }
  const normShort = (s, n) => { const t = String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); return n ? (t.length === n ? t : '') : t; };
  // a room from a short code: the code is stretched (so trying codes is slow), used only for things that last a few minutes
  async function codeSecret(code, label) {
    const c = normShort(code);
    if (c.length < 4) throw new Error('That code is not complete.');
    const base = await subtle.importKey('raw', te.encode(c), 'PBKDF2', false, ['deriveBits']);
    const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: te.encode('blokvane-code-' + (label || 'room') + '-v1'), iterations: 120000 }, base, 128);
    return new Uint8Array(bits);
  }
  // links: the page, then after the # the kind and its parts joined by dots (nothing after the # reaches any website)
  const link = (kind, ...parts) => GO + '#' + [kind, ...parts].join('.');
  function parse(hash) {
    const h = String(hash || '').replace(/^#/, '').trim();
    if (!/^[a-z][a-z0-9]{0,11}(\.[A-Za-z0-9_-]{1,96}){0,6}$/.test(h)) return null;
    const p = h.split('.');
    return { kind: p[0], parts: p.slice(1) };
  }

  // ---------- one set of relay connections for the whole page ----------
  const handlers = new Map();        // topic -> function(bytes)
  let shared = null;
  function localMemory(key) {
    return { load: () => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } },
      save: h => { try { localStorage.setItem(key, JSON.stringify(h)); } catch (e) {} } };
  }
  function relays(o = {}) {
    if (shared) return shared;
    shared = NET.create({
      onMessage: (topic, bytes) => { const h = handlers.get(topic); if (h) { try { h(bytes); } catch (e) {} } },
      onChange: () => { for (const fn of watchers) { try { fn(); } catch (e) {} } },
      memory: o.memory || localMemory('bvlive:relays'), relays: o.relays || undefined
    });
    return shared;
  }
  const watchers = new Set();
  // (every room that's open here: a phone back from its pocket says hello again in each)
  const openRooms = new Set();
  // A phone back from the background (another app, the screen locked) or back online: the relays are tried again at
  // once, and everyone in each room hears this device again, so it's back in the game within a second or two.
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && window.addEventListener) {
    let hidAt = 0;
    const wake = () => {
      if (shared && shared.wake) { try { shared.wake(); } catch (e) {} }
      for (const R of openRooms) { setTimeout(() => { if (!R.closed()) R.hello(true); }, 1200); setTimeout(() => { if (!R.closed()) R.hello(true); }, 3500); }
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) hidAt = Date.now(); else if (hidAt && Date.now() - hidAt > 2500) wake(); });
    window.addEventListener('online', wake);
    window.addEventListener('pageshow', e => { if (e.persisted) wake(); });
  }

  // ---------- boxes: a message only one device can open (ECDH P-256 + AES-GCM) ----------
  const ECDH = { name: 'ECDH', namedCurve: 'P-256' };
  async function boxKeys() {
    const kp = await subtle.generateKey(ECDH, false, ['deriveBits']);
    return { priv: kp.privateKey, pub: C.b64url(new Uint8Array(await subtle.exportKey('raw', kp.publicKey))) };
  }
  async function boxKey(myPriv, theirPub, topic) {
    const pub = await subtle.importKey('raw', C.unb64url(theirPub), ECDH, false, []);
    const bits = await subtle.deriveBits({ name: 'ECDH', public: pub }, myPriv, 256);
    // (C.hkdf: the browser's own HKDF, or the same made from HMAC where an older browser has none)
    return subtle.importKey('raw', await C.hkdf(bits, te.encode('bvlive-box-v1'), te.encode(topic), 256), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  }

  // ---------- a room ----------
  // o: { secret (bytes or base64url), label (keeps uses apart), me (from BVWT_CORE.newMember) or jwk, name, role,
  //      info (a small object everyone sees), owner (an id that is always let in: the host), open (true: anyone with the
  //      secret may talk; false: only the owner and the ids allow(id) says yes to), allow(id), quiet (no hellos),
  //      onMsg(m, from), onPeers(peers), onPipe(pipe), memory }
  async function room(o) {
    const secret = typeof o.secret === 'string' ? C.unb64url(o.secret) : o.secret;
    const keys = await C.secretKeys(secret, o.label || 'bvlive');
    const me = o.me || await C.newMember(o.jwk || undefined);
    const bx = await boxKeys();
    const net = relays({ memory: o.memory });
    const topic = keys.topic;
    const peers = new Map();         // id -> { id, name, role, info, at, bx (their box key) }
    const parts = new Map();         // long message id -> { n, got: [], at, size }
    const pipes = new Map();         // peer id -> pipe
    const lists = new Map();         // name -> shared list
    let closed = false, helloT = 0, sweepT = 0;
    const R = {
      id: me.id, me, topic, peers, name: clean(o.name, 40), role: clean(o.role, 20), info: o.info || null,
      owner: o.owner || '', closed: () => closed,
      onMsg: o.onMsg || null, onPeers: o.onPeers || null, onPipe: o.onPipe || null, mediaFor: o.mediaFor || null
    };
    const trusted = id => id === R.owner || id === me.id || (o.allow ? !!o.allow(id) : false);
    const may = id => o.open !== false || trusted(id);
    const gate = NET.gate({ key: keys.key, topic, check: C.verifier(), known: id => peers.has(id) || trusted(id) });

    async function publish(m) {
      if (closed) return 0;
      m.f = me.id; m.at = now();
      return net.publish(topic, await C.sealSigned(keys.key, topic, m, me));
    }
    // send: a message for everyone (or for one device: to), cut in parts when it is long
    async function send(m, to) {
      if (closed || !m || typeof m.k !== 'string') return 0;
      if (to) m.to = to;
      const body = te.encode(JSON.stringify(m));
      if (body.length <= PART + 600) return publish(m);
      if (body.length > MAX_LONG) throw new Error('too big for the relays');
      const id = C.hex(C.rand(6)), n = Math.ceil(body.length / PART);
      let sent = 0;
      for (let i = 0; i < n; i++) {
        sent = await publish({ k: '~p', id, i, n, to: to || undefined, d: C.b64url(body.subarray(i * PART, (i + 1) * PART)) });
        // (a small gap so the relays don't see a burst)
        if (n > 3 && i < n - 1) await new Promise(r => setTimeout(r, 40));
      }
      return sent;
    }
    // box: a message only the device `to` can open (it must have said hello)
    async function box(to, m) {
      const p = peers.get(to);
      if (!p || !p.bx) throw new Error('not here');
      const k = await boxKey(bx.priv, p.bx, topic + ':' + [me.id, to].sort().join(':'));
      const iv = C.rand(12);
      const ct = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, k, te.encode(JSON.stringify(m))));
      return send({ k: '~box', d: C.b64url(C.concat(iv, ct)) }, to);
    }
    async function unbox(m) {
      const p = peers.get(m.f);
      if (!p || !p.bx || typeof m.d !== 'string') return null;
      try {
        const k = await boxKey(bx.priv, p.bx, topic + ':' + [me.id, m.f].sort().join(':'));
        const b = C.unb64url(m.d);
        const plain = await subtle.decrypt({ name: 'AES-GCM', iv: b.subarray(0, 12) }, k, b.subarray(12));
        const x = JSON.parse(td.decode(plain));
        return x && typeof x === 'object' && !Array.isArray(x) ? x : null;
      } catch (e) { return null; }
    }

    // ---------- who is here ----------
    function hello(ask) {
      if (closed || o.quiet) return;
      publish({ k: '~hi', n: R.name, r: R.role, i: R.info || undefined, bx: bx.pub, ask: ask ? 1 : undefined }).catch(() => {});
    }
    function seen(m) {
      const id = m.f;
      let p = peers.get(id);
      const isNew = !p;
      if (!p) {
        if (peers.size >= 300) return null;
        p = { id, name: '', role: '', info: null, at: 0, bx: '' };
        peers.set(id, p);
      }
      p.at = now();
      if (m.k === '~hi' || m.k === '~here') {
        p.name = clean(m.n, 40); p.role = clean(m.r, 20);
        p.info = m.i && typeof m.i === 'object' && !Array.isArray(m.i) ? m.i : null;
        if (typeof m.bx === 'string' && /^[A-Za-z0-9_-]{80,100}$/.test(m.bx)) p.bx = m.bx;
      }
      if (isNew || m.k === '~hi' || m.k === '~here') changed();
      return p;
    }
    let changeT = 0;
    function changed() {
      if (changeT) return;
      changeT = setTimeout(() => { changeT = 0; if (R.onPeers && !closed) { try { R.onPeers(list()); } catch (e) {} } }, 60);
    }
    const list = () => [...peers.values()].filter(p => p.name || p.role || p.bx);
    function sweep() {
      const t = now();
      let gone = false;
      for (const [id, p] of peers) if (t - p.at > GONE_AFTER && !pipeOpen(id)) { peers.delete(id); gone = true; }
      for (const [id, x] of parts) if (t - x.at > 30000) parts.delete(id);
      if (gone) changed();
    }
    const pipeOpen = id => { const p = pipes.get(id); return !!(p && p.open()); };

    // ---------- what comes in ----------
    const onBytes = bytes => { take(bytes).catch(() => {}); };
    handlers.set(topic, onBytes);
    async function take(bytes) {
      if (closed) return;
      const m = await gate(bytes);
      if (!m || !okId(m.f) || m.f === me.id || typeof m.k !== 'string') return;
      if (m.to && m.to !== me.id) { if (peers.has(m.f)) peers.get(m.f).at = now(); return; }
      if (!may(m.f)) return;
      await handle(m);
    }
    async function handle(m) {
      const p = seen(m);
      if (!p) return;
      switch (m.k) {
        case '~hi':
          if (m.ask || m.to) publish({ k: '~here', to: m.f, n: R.name, r: R.role, i: R.info || undefined, bx: bx.pub }).catch(() => {});
          return;
        case '~here': return;
        case '~bye': peers.delete(m.f); closePipe(m.f); changed(); return;
        case '~p': return part(m);
        case '~box': { const x = await unbox(m); if (x && typeof x.k === 'string' && x.k[0] !== '~') { x.f = m.f; x.at = m.at; x.boxed = true; deliver(x, p); } return; }
        case '~ro': case '~ra': return rtcSignal(m);
        case '~t?': publish({ k: '~t!', to: m.f, t0: m.t0, t1: now() }).catch(() => {}); return;
        case '~t!': return clockReply(m);
        case '~s': { const L = lists.get(m.n); if (L) L.got(m); return; }
        default: if (m.k[0] !== '~') deliver(m, p);
      }
    }
    function deliver(m, p) { if (R.onMsg) { try { R.onMsg(m, p); } catch (e) {} } }
    function part(m) {
      if (typeof m.id !== 'string' || !/^[0-9a-f]{12}$/.test(m.id) || !(m.n > 1 && m.n <= 32) || !(m.i >= 0 && m.i < m.n) || typeof m.d !== 'string') return;
      let x = parts.get(m.id);
      if (!x) { if (parts.size > 60) parts.delete(parts.keys().next().value); x = { n: m.n, got: new Array(m.n), have: 0, at: now(), f: m.f }; parts.set(m.id, x); }
      if (x.f !== m.f || x.n !== m.n || x.got[m.i]) return;
      try { x.got[m.i] = C.unb64url(m.d); } catch (e) { return; }
      x.have++;
      if (x.have < x.n) return;
      parts.delete(m.id);
      let whole;
      try { whole = JSON.parse(td.decode(C.concat(...x.got))); } catch (e) { return; }
      if (!whole || typeof whole !== 'object' || typeof whole.k !== 'string' || whole.k === '~p') return;
      whole.f = m.f; whole.at = m.at;
      if (whole.to && whole.to !== me.id) return;
      handle(whole).catch(() => {});
    }

    // ---------- the shared clock ----------
    // offset: add it to Date.now() to get the host's time. Several tries, the quickest round trip wins.
    let offset = 0, bestRtt = Infinity, clockFrom = '';
    const tries = new Map();
    function clockReply(m) {
      if (m.f !== clockFrom || !tries.has(m.t0)) return;
      tries.delete(m.t0);
      const t2 = now(), rtt = t2 - m.t0;
      if (rtt < 0 || rtt > 20000) return;
      if (rtt <= bestRtt * 1.15 || bestRtt === Infinity) { bestRtt = Math.min(bestRtt, rtt); offset = m.t1 - (m.t0 + t2) / 2; }
    }
    async function syncClock(host, n = 6) {
      clockFrom = host || R.owner;
      if (!clockFrom || clockFrom === me.id) { offset = 0; bestRtt = 0; return 0; }
      for (let i = 0; i < n && !closed; i++) {
        const t0 = now();
        tries.set(t0, 1);
        // (through a pipe when there is one: much quicker and steadier than the relays)
        const pp = pipes.get(clockFrom);
        if (pp && pp.open()) pp.send({ k: '~t?', t0 }); else publish({ k: '~t?', to: clockFrom, t0 }).catch(() => {});
        await new Promise(r => setTimeout(r, 350));
      }
      return offset;
    }
    const clock = () => now() + offset;

    // ---------- pipes: straight to one device ----------
    const gathered = pc => new Promise(res => {
      if (pc.iceGatheringState === 'complete') { res(); return; }
      const done = () => { clearTimeout(t); pc.removeEventListener('icegatheringstatechange', ch); res(); };
      const ch = () => { if (pc.iceGatheringState === 'complete') done(); };
      const t = setTimeout(done, 2500);
      pc.addEventListener('icegatheringstatechange', ch);
    });
    const trim = sdp => { let n = 0; return String(sdp || '').split('\r\n').filter(l => !l.startsWith('a=candidate') || (!/ tcp /i.test(l) && ++n <= 12)).join('\r\n'); };
    function closePipe(id) { const p = pipes.get(id); if (p) p.close(); }
    // connect to `to` (o: { stream (camera, screen or tab to send), recv: 'video' | 'audio' | 'both' (to receive without sending) })
    async function pipe(to, po = {}) {
      if (!window.RTCPeerConnection) throw new Error('This browser can\'t connect straight to other devices.');
      const old = pipes.get(to);
      if (old && old.open() && !po.stream && !po.recv) return old;
      if (old) old.close();
      const pc = new RTCPeerConnection({ iceServers: ICE });
      const P = makePipe(to, pc, C.hex(C.rand(6)));
      if (po.stream) for (const tr of po.stream.getTracks()) pc.addTrack(tr, po.stream);
      if (po.recv === 'video' || po.recv === 'both') pc.addTransceiver('video', { direction: 'recvonly' });
      if (po.recv === 'audio' || po.recv === 'both') pc.addTransceiver('audio', { direction: 'recvonly' });
      P.bind(pc.createDataChannel('bv', { ordered: true }));
      try {
        await pc.setLocalDescription(await pc.createOffer());
        await gathered(pc);
        if (P.gone) throw new Error('closed');
        await send({ k: '~ro', sid: P.sid, sdp: trim(pc.localDescription.sdp) }, to);
      } catch (e) { P.close(); throw e; }
      P.timer = setTimeout(() => { if (!P.open()) P.fail('timeout'); }, 25000);
      return P.ready;
    }
    async function rtcSignal(m) {
      if (typeof m.sid !== 'string' || !/^[0-9a-f]{12}$/.test(m.sid) || typeof m.sdp !== 'string' || m.sdp.length > 60000) return;
      if (m.k === '~ra') {
        const P = pipes.get(m.f);
        if (!P || P.sid !== m.sid || P.pc.signalingState !== 'have-local-offer') return;
        P.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }).catch(() => P.fail('answer'));
        return;
      }
      // an offer: only when this page takes pipes
      if (!R.onPipe || !window.RTCPeerConnection) return;
      const old = pipes.get(m.f);
      if (old) old.close();
      const pc = new RTCPeerConnection({ iceServers: ICE });
      const P = makePipe(m.f, pc, m.sid);
      pc.ondatachannel = e => { if (e.channel.label === 'bv') P.bind(e.channel); else e.channel.close(); };
      try {
        await pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
        // (a device that offers to receive video gets this side's stream when the page has one ready)
        if (P.wantsMedia() && R.mediaFor) {
          const st = await R.mediaFor(m.f);
          if (st) {
            for (const tr of st.getTracks()) {
              const tc = pc.getTransceivers().find(t => t.receiver && t.receiver.track && t.receiver.track.kind === tr.kind && !t.sender.track);
              if (tc) { tc.direction = 'sendonly'; await tc.sender.replaceTrack(tr); tc.sender.setStreams && tc.sender.setStreams(st); }
            }
          }
        }
        await pc.setLocalDescription(await pc.createAnswer());
        await gathered(pc);
        if (P.gone) return;
        await send({ k: '~ra', sid: m.sid, sdp: trim(pc.localDescription.sdp) }, m.f);
      } catch (e) { P.close(); return; }
      P.timer = setTimeout(() => { if (!P.open()) P.fail('timeout'); }, 25000);
      P.ready.then(() => { try { R.onPipe(P); } catch (e) {} }, () => {});
    }
    function makePipe(to, pc, sid) {
      let ch = null, resolve, reject;
      const ready = new Promise((a, b) => { resolve = a; reject = b; });
      ready.catch(() => {});
      const inFiles = new Map();
      const P = {
        id: to, sid, pc, gone: false, ready, timer: 0,
        onMsg: null, onFile: null, onProgress: null, onStream: null, onClose: null,
        open: () => !!(ch && ch.readyState === 'open' && !P.gone),
        wantsMedia: () => /m=(video|audio)/.test((pc.remoteDescription && pc.remoteDescription.sdp) || ''),
        bind(c) {
          ch = c; ch.binaryType = 'arraybuffer';
          ch.onopen = () => { clearTimeout(P.timer); resolve(P); };
          ch.onclose = () => P.close();
          ch.onmessage = e => onData(e.data);
          // (a channel the other side opened can already be open when it arrives)
          if (ch.readyState === 'open') setTimeout(() => { clearTimeout(P.timer); resolve(P); }, 0);
        },
        send(obj) { try { if (P.open()) { ch.send(JSON.stringify(obj)); return true; } } catch (e) {} return false; },
        // a file (or any Blob): a header, then the bytes in 64 KB pieces, then the end. meta: { name, type, ...anything small }
        async file(blob, meta = {}, progress) {
          if (!P.open()) throw new Error('not connected');
          const id = C.hex(C.rand(6));
          ch.send(JSON.stringify({ k: '~f', id, size: blob.size, meta: Object.assign({}, meta, { name: clean(meta.name || 'file', 120), type: String(meta.type || blob.type || '').slice(0, 100) }) }));
          for (let at = 0; at < blob.size; at += CHUNK) {
            if (!P.open()) throw new Error('closed');
            if (ch.bufferedAmount > HIGH) await drained();
            const buf = await blob.slice(at, at + CHUNK).arrayBuffer();
            // each piece starts with the file's id (6 bytes), so pieces of two files never mix
            const out = new Uint8Array(6 + buf.byteLength);
            out.set(C.unhex(id), 0); out.set(new Uint8Array(buf), 6);
            ch.send(out);
            if (progress) { try { progress(Math.min(blob.size, at + CHUNK), blob.size); } catch (e) {} }
          }
          ch.send(JSON.stringify({ k: '~fe', id }));
          return id;
        },
        close() {
          if (P.gone) return;
          P.gone = true;
          clearTimeout(P.timer);
          try { if (ch) ch.close(); } catch (e) {}
          try { pc.close(); } catch (e) {}
          if (pipes.get(to) === P) pipes.delete(to);
          reject(new Error('closed'));
          if (P.onClose) { try { P.onClose(); } catch (e) {} }
        },
        fail(why) { P.close(); reject(new Error(why || 'failed')); }
      };
      const drained = () => new Promise(res => {
        ch.bufferedAmountLowThreshold = LOW;
        const t = setTimeout(done, 20000);
        function done() { clearTimeout(t); ch.removeEventListener('bufferedamountlow', done); res(); }
        ch.addEventListener('bufferedamountlow', done);
      });
      function onData(d) {
        if (typeof d === 'string') {
          if (d.length > 65536) return;
          let m;
          try { m = JSON.parse(d); } catch (e) { return; }
          if (!m || typeof m.k !== 'string') return;
          if (m.k === '~f') {
            if (!(m.size >= 0 && m.size <= 4 * 1024 * 1024 * 1024) || typeof m.id !== 'string' || !/^[0-9a-f]{12}$/.test(m.id)) return;
            if (inFiles.size >= 8) return;
            inFiles.set(m.id, { meta: m.meta && typeof m.meta === 'object' ? m.meta : {}, size: m.size, got: 0, parts: [] });
            return;
          }
          if (m.k === '~fe') {
            const f = inFiles.get(m.id);
            if (!f) return;
            inFiles.delete(m.id);
            const meta = f.meta;
            const blob = new Blob(f.parts, { type: String(meta.type || '') });
            if (P.onFile) { try { P.onFile({ meta, blob, id: m.id }); } catch (e) {} }
            return;
          }
          if (m.k === '~t?') { P.send({ k: '~t!', t0: m.t0, t1: now() }); return; }
          if (m.k === '~t!') { clockReply({ f: to, t0: m.t0, t1: m.t1 }); return; }
          m.f = to;
          if (P.onMsg) { try { P.onMsg(m); } catch (e) {} }
          return;
        }
        const u = new Uint8Array(d);
        if (u.length < 7) return;
        const f = inFiles.get(C.hex(u.subarray(0, 6)));
        if (!f) return;
        f.parts.push(u.subarray(6));
        f.got += u.length - 6;
        if (f.got > f.size) { inFiles.delete(C.hex(u.subarray(0, 6))); return; }
        if (P.onProgress) { try { P.onProgress(f.got, f.size, f.meta); } catch (e) {} }
      }
      pc.ontrack = e => { const st = e.streams && e.streams[0] ? e.streams[0] : new MediaStream([e.track]); if (P.onStream) { try { P.onStream(st, e.track); } catch (er) {} } P.stream = st; };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') P.fail(pc.connectionState);
        else if (pc.connectionState === 'disconnected') setTimeout(() => { if (pc.connectionState !== 'connected' && !P.gone) P.fail('lost'); }, 9000);
      };
      pipes.set(to, P);
      return P;
    }

    // ---------- a shared list: every entry's newest change wins ----------
    // name: which list; lo: { own: true (only the owner may change anyone's entry; others only their own: key = their id),
    // hostOnly: true (only the owner may change it), max: entries kept, onChange(map) }
    function shared(name, lo = {}) {
      if (lists.has(name)) return lists.get(name);
      const map = new Map();   // key -> { v, at, by }
      let changeT2 = 0;
      const fire = () => { if (changeT2) return; changeT2 = setTimeout(() => { changeT2 = 0; if (L.onChange) { try { L.onChange(map); } catch (e) {} } }, 30); };
      const allowed = (by, key) => by === R.owner || (!lo.hostOnly && (!lo.own || key === by));
      function apply(key, v, at, by) {
        if (typeof key !== 'string' || key.length > 64 || !(at > 0)) return false;
        if (!allowed(by, key)) return false;
        const old = map.get(key);
        if (old && (old.at > at || (old.at === at && old.by >= by))) return false;
        if (!old && map.size >= (lo.max || 500)) return false;
        map.set(key, { v, at, by });
        return true;
      }
      const L = {
        map, onChange: lo.onChange || null,
        get: k => { const x = map.get(k); return x && x.v !== null ? x.v : undefined; },
        entries: () => [...map.entries()].filter(([, x]) => x.v !== null).map(([k, x]) => [k, x.v, x.at, x.by]),
        set(key, v) {
          const at = Math.max(now(), ((map.get(key) || {}).at || 0) + 1);
          if (!apply(key, v, at, me.id)) return false;
          fire();
          send({ k: '~s', n: name, e: [[key, v, at]] }).catch(() => {});
          return true;
        },
        del(key) { return L.set(key, null); },
        // everything at once (a device that just came in), in parts of 40 entries
        async push(to) {
          const all = [...map.entries()];
          for (let i = 0; i < all.length; i += 40) await send({ k: '~s', n: name, e: all.slice(i, i + 40).map(([k, x]) => [k, x.v, x.at, x.by]) }, to).catch(() => {});
        },
        ask() { send({ k: '~s', n: name, ask: 1, e: [] }).catch(() => {}); },
        got(m) {
          if (!Array.isArray(m.e) || m.e.length > 60) return;
          let any = false;
          for (const x of m.e) {
            if (!Array.isArray(x)) continue;
            // (an entry another device passes on keeps who made it; it only counts when that one may change it)
            const by = typeof x[3] === 'string' && okId(x[3]) && (m.f === R.owner || x[3] === m.f) ? x[3] : m.f;
            if (apply(x[0], x[1], +x[2], by)) any = true;
          }
          if (any) fire();
          // someone new asks: the owner answers (or, with no owner here, the device with the lowest id)
          if (m.ask && map.size && (me.id === R.owner || (!peers.has(R.owner) && [...peers.keys(), me.id].sort()[0] === me.id))) L.push(m.f);
        }
      };
      lists.set(name, L);
      // (asked twice: the relays may not be connected yet the first time)
      setTimeout(() => L.ask(), 1500);
      setTimeout(() => { if (!map.size && !closed) L.ask(); }, 6000);
      return L;
    }

    net.join(topic);
    openRooms.add(R);
    // (the relays need a moment to connect: hello right after, then now and then)
    setTimeout(() => hello(true), 1000);
    setTimeout(() => hello(true), 4000);
    helloT = setInterval(() => hello(false), HELLO_EVERY);
    sweepT = setInterval(sweep, 10000);

    return Object.assign(R, {
      send, box, publish, hello, pipe, shared, syncClock, clock,
      offset: () => offset, rtt: () => bestRtt,
      list, peer: id => peers.get(id) || null,
      here: id => { const p = peers.get(id); return !!(p && now() - p.at < GONE_AFTER); },
      pipeTo: id => pipes.get(id) || null,
      stats: () => net.stats(topic),
      setInfo(info) { R.info = info; hello(false); },
      setName(n) { R.name = clean(n, 40); hello(false); },
      close() {
        if (closed) return;
        publish({ k: '~bye' }).catch(() => {});
        closed = true;
        openRooms.delete(R);
        clearInterval(helloT); clearInterval(sweepT);
        for (const p of [...pipes.values()]) p.close();
        // (unless a new room took this topic meanwhile, like joining again right away to reconnect: then it stays)
        setTimeout(() => { if (handlers.get(topic) === onBytes) { handlers.delete(topic); net.leave(topic); } }, 400);
      }
    });
  }

  // ---------- TVs nearby: a phone on the same Wi-Fi as a TV finds it without typing a code ----------
  // The devices on one home network go out to the internet with the same public address (IPv4). Each one asks the free
  // STUN servers what it is (the same question WebRTC asks to connect two devices) and makes a room from it: the address
  // itself never leaves the device, only a hash of it does (the room's sealed topic). A TV tells that room what it
  // shows (the game and its code); a phone lists the TVs it hears. On another network (mobile data, say) a phone simply
  // finds none, and types the code.
  function publicIp(ms) {
    return new Promise(res => {
      let pc = null, done = false;
      const fin = v => { if (done) return; done = true; try { if (pc) pc.close(); } catch (e) {} res(v || ''); };
      try {
        pc = new RTCPeerConnection({ iceServers: ICE });
        pc.createDataChannel('ip');
        pc.onicecandidate = e => {
          if (!e.candidate) { fin(''); return; }
          const c = String(e.candidate.candidate || '');
          const m = / typ srflx/.test(c) && c.match(/ ((?:\d{1,3}\.){3}\d{1,3}) \d+ typ srflx/);
          if (m && !/^(10|127|169\.254|192\.168)\./.test(m[1])) fin(m[1]);
        };
        pc.createOffer().then(o => pc.setLocalDescription(o)).catch(() => fin(''));
        setTimeout(() => fin(''), ms || 5000);
      } catch (e) { fin(''); }
    });
  }
  // o: { role ('tv' or 'phone'), name, info, onPeers(peers) }: the room, or null when this network has no address to share
  async function nearby(o = {}) {
    const ip = await publicIp(o.wait || 4500);
    if (!ip) return null;
    const secret = new Uint8Array(await subtle.digest('SHA-256', te.encode('blokvane-nearby-v1|' + ip))).slice(0, 16);
    return room({ secret, label: 'bvnear', name: o.name || '', role: o.role || 'phone', info: o.info || null, open: true, memory: o.memory, onPeers: o.onPeers || null });
  }

  // ---------- small things many features need ----------
  // a picture made smaller (for sending over the relays or showing on a TV): a JPEG data address, at most max px wide
  async function shrink(file, max = 512, quality = 0.82) {
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      return cv.toDataURL('image/jpeg', quality);
    } finally { URL.revokeObjectURL(url); }
  }
  // a picture small enough to go over the relays in one message: smaller and smaller until it fits (or '' if it never does)
  async function fit(file, maxChars = 80000, max = 900) {
    let px = max, q = 0.8;
    for (let i = 0; i < 8; i++) {
      const d = await shrink(file, px, q);
      if (d.length <= maxChars) return d;
      px = Math.max(160, Math.round(px * 0.78)); q = Math.max(0.45, q - 0.06);
    }
    return '';
  }
  const okPicture = s => typeof s === 'string' && s.length < 90000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s);
  const sizeText = n => n < 1024 ? n + ' bytes' : n < 1048576 ? Math.round(n / 1024) + ' KB' : (n / 1048576).toFixed(n < 10485760 ? 1 : 0) + ' MB';

  return { ICE, GO, PLAY, TV, newSecret, shortCode, normShort, codeSecret, link, parse, relays, room, nearby, publicIp, shrink, fit, okPicture, okId, clean, sizeText,
    onRelays: fn => { watchers.add(fn); return () => watchers.delete(fn); }, localMemory, MAX_LONG };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = BVLIVE;
