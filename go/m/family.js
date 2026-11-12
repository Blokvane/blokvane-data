// Blokvane on your phone: Kid mode for a parent, the screen check, the family board and "Now serving", this phone's
// camera on the TVs, KeyVane (unlock by tapping Approve, and a locked copy to look up a password), and the lost
// computer button.
(() => {
  const { el, icon, view, btn, toast, buzz, sheet, input, seg, store, toggle } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('family', {
    open(id, pc, back) { return ({ kid, screens, board, camera, kv, lost })[id](pc, back); },
    kvPrompt, kvStore
  });
  const timeOf = t => new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  // =====================================================================
  // Kid mode
  // =====================================================================
  function kid(pc, back) {
    const v = view('Kid mode', { back, tint: 'sun', live: true });
    const asks = el('div', '', v.body);
    const pause = el('div', 'card', v.body);
    const limits = el('div', '', v.body);
    let alive = true;
    const offs = [pc.on('kidAsk', () => load()), pc.on('kidDone', () => load())];
    v.top.querySelector('.back').addEventListener('click', () => { alive = false; offs.forEach(f => f()); });
    async function load() {
      if (!alive) return;
      let st;
      try { st = await pc.ask('kid', { op: 'state' }); } catch (e) { asks.textContent = ''; el('div', 'card', asks, e.message); return; }
      asks.textContent = '';
      if (!st.on) el('div', 'card', asks, 'Kid mode is off on ' + pc.name + '. Turn it on in Blokvane\'s settings there.');
      const waiting = (st.asks || []).filter(a => a.state === 'wait');
      if (!waiting.length) { const c = el('div', 'card', asks); el('h2', '', c, 'No requests right now'); el('p', '', c, 'When your child taps "Ask a parent" on a blocked site, it shows up here and this phone buzzes (keep this page open, or add it to your home screen).'); }
      for (const a of waiting) {
        const c = el('div', 'card', asks);
        el('h2', '', c, a.host);
        el('p', '', c, ({ adult: 'Blocked by Kid mode as an adult site.', limit: 'Today\'s time on this site is up.', schedule: 'Blocked during focus hours.', blocked: 'On the blocked sites list.' })[a.reason] || 'Blocked.');
        if (a.note) el('p', 'lead', c, '"' + a.note + '"');
        el('p', 'muted small', c, 'Asked at ' + timeOf(a.at));
        let min = 60;
        const s = seg(a.reason === 'limit' ? [[15, '+15 min'], [30, '+30 min'], [60, '+1 hour']] : [[15, '15 min'], [60, '1 hour'], [1440, 'Today']], 60, x => { min = +x; }, c);
        s.node.style.margin = '6px 0 10px';
        const r = el('div', 'grid2', c);
        btn('Allow', { kind: 'go', icon: 'check' }, r, async () => { await pc.ask('kid', { op: 'answer', id: a.id, allow: true, min }); buzz('ok'); toast('Allowed. It opens on the computer now.', 'ok'); load(); });
        btn('Deny', { kind: 'bad', icon: 'x' }, r, async () => { await pc.ask('kid', { op: 'answer', id: a.id, allow: false }); toast('Said no.'); load(); });
      }
      const done = (st.asks || []).filter(a => a.state !== 'wait').slice(0, 5);
      if (done.length) { const c = el('div', 'card', asks); el('h2', '', c, 'Earlier'); for (const a of done) { const it = el('div', 'item', c); const t = el('div', 't', it); el('b', '', t, a.host); el('small', '', t, (a.state === 'allowed' ? 'Allowed until ' + timeOf(a.until) : 'Denied') + ' · ' + timeOf(a.at)); } }
      // the pause
      pause.textContent = '';
      el('h2', '', pause, st.paused ? 'The internet is paused' : 'Pause the internet');
      el('p', '', pause, st.paused ? 'On ' + pc.name + ' until ' + timeOf(st.paused) + '.' : 'Every website stops on ' + pc.name + ' for a while. Blokvane itself keeps working, so you can unpause from here.');
      if (st.paused) btn('Unpause now', { kind: 'go', full: true }, pause, async () => { await pc.ask('kid', { op: 'pause', min: 0 }); toast('The internet is back.', 'ok'); load(); });
      else { const g = el('div', 'grid4', pause); for (const [m, t] of [[15, '15 min'], [30, '30 min'], [60, '1 hour'], [120, '2 hours']]) btn(t, {}, g, async () => { await pc.ask('kid', { op: 'pause', min: m }); buzz('ok'); toast('Paused for ' + t + '.', 'ok'); load(); }); }
      // time limits
      limits.textContent = '';
      if ((st.limits || []).length) {
        const c = el('div', 'card', limits);
        el('h2', '', c, 'Daily time limits');
        for (const l of st.limits) {
          const it = el('div', 'item', c);
          const t = el('div', 't', it); el('b', '', t, l.host); el('small', '', t, `${l.used} of ${l.min} minutes used today`);
          const add = el('button', 'chip', it, '+15 min'); add.type = 'button';
          add.onclick = async () => { await pc.ask('kid', { op: 'time', host: l.host, min: 15 }); toast('15 more minutes on ' + l.host + '.', 'ok'); load(); };
        }
      }
      if ((st.allowed || []).length) {
        const c = el('div', 'card', limits);
        el('h2', '', c, 'Allowed for now');
        for (const a of st.allowed) { const it = el('div', 'item', c); const t = el('div', 't', it); el('b', '', t, a.host); el('small', '', t, 'Until ' + timeOf(a.until)); const x = el('button', 'chip', it, 'Stop'); x.type = 'button'; x.onclick = async () => { await pc.ask('kid', { op: 'unallow', host: a.host }); load(); }; }
      }
    }
    load();
    const t = setInterval(() => { if (!document.body.contains(asks)) { clearInterval(t); return; } if (!document.hidden) load(); }, 20000);
  }

  // =====================================================================
  // The screen check
  // =====================================================================
  function screens(pc, back) {
    const v = view('Screen check', { back, tint: 'teal', live: true });
    const list = el('div', 'list', v.body);
    el('p', 'muted small center', v.body, 'The pictures are drawn by your computer from your slideshows. Nothing is recorded on the TVs.').style.marginTop = '14px';
    async function load() {
      let all;
      try { all = await pc.ask('screens', {}); } catch (e) { list.textContent = e.message; return; }
      list.textContent = '';
      if (!all.length) { el('div', 'empty', list, 'No TV screens yet. Add them in Blokvane on the computer: Slideshows, then TV screens.'); return; }
      for (const s of all) {
        const c = el('div', 'card', list); c.style.padding = '12px';
        const img = el('img', 'photo', c); img.alt = ''; img.style.aspectRatio = '16/9'; img.style.objectFit = 'cover';
        pc.ask('screenPreview', { id: s.id }).then(p => { if (p && GO.okImage(p.img)) img.src = p.img; }).catch(() => {});
        const row = el('div', 'row', c); row.style.marginTop = '10px';
        el('i', 'dot ' + (s.on ? 'on' : 'off'), row);
        const t = el('div', 'grow', row);
        el('b', '', t, s.name);
        el('div', 'muted small', t, s.on ? `On${s.show ? ': ' + s.show : ''}${s.slide ? ', slide ' + s.slide + ' of ' + s.slides : ''}` : 'Off or not answering' + (s.seen ? ' since ' + timeOf(s.seen) : ''));
      }
    }
    load();
    btn('Check again', { full: true, icon: 'refresh' }, v.body, load).style.marginTop = '10px';
  }

  // =====================================================================
  // The family board and "Now serving"
  // =====================================================================
  function board(pc, back) {
    const v = view('Board and line', { back, tint: 'teal', live: true });
    const q = el('div', '', v.body);
    pc.ask('queue', { op: 'list' }).then(list => {
      for (const x of list.slice(0, 4)) {
        const c = el('div', 'card', q);
        el('h2', '', c, x.label || (x.name === 'main' ? 'Now serving' : x.name));
        const fmt = n => (x.prefix || '') + String((x.start || 0) + n).padStart(Math.max(1, x.digits || 3), '0');
        const num = el('div', 'code', c, fmt(x.n)); num.style.fontSize = '58px';
        const r = el('div', 'grid2', c);
        const step = async op => { const res = await pc.ask('queue', { op, name: x.name }); num.textContent = fmt(res.n); buzz('tap'); };
        btn('Back', { icon: 'prev' }, r, () => step('back'));
        btn('Next', { kind: 'go', icon: 'next', huge: true }, r, () => step('next'));
        btn('Start over', { kind: 'ghost', full: true }, c, () => { if (confirm('Start the line over?')) return step('reset'); }).style.marginTop = '8px';
      }
    }).catch(() => {});
    const post = el('div', 'card', v.body);
    el('h2', '', post, 'Post on the family board');
    let kind = 'note', img = '';
    const t = input({ multi: true, placeholder: 'Dinner at 7!', max: 280 });
    seg([['note', 'Message'], ['list', 'List'], ['photo', 'Photo']], 'note', x => { kind = x; t.placeholder = x === 'list' ? 'One thing on each line' : x === 'photo' ? 'A few words with the photo' : 'Dinner at 7!'; if (x === 'photo') ph.click(); }, post);
    post.appendChild(t); t.style.marginTop = '10px';
    const ph = el('input', '', post); ph.type = 'file'; ph.accept = 'image/*'; ph.hidden = true;
    ph.onchange = async () => { if (ph.files[0]) { img = await L.fit(ph.files[0], 80000, 720); toast(img ? 'Photo added.' : 'That photo didn\'t work. Try another.', img ? 'ok' : 'bad'); } };
    btn('Post it', { kind: 'go', full: true }, post, async () => {
      const d = { kind, text: kind === 'list' ? '' : t.value };
      if (kind === 'list') d.items = t.value.split('\n').map(x => ({ t: x.trim() })).filter(x => x.t);
      if (kind === 'photo') { if (!img) { ph.click(); return; } d.img = img; }
      await pc.ask('board', d);
      buzz('ok'); toast('On the kitchen screen.', 'ok'); t.value = ''; img = '';
      show();
    }).style.marginTop = '10px';
    const mine = el('div', '', v.body);
    async function show() {
      const posts = await pc.ask('board', { op: 'list' }).catch(() => []);
      mine.textContent = '';
      for (const p of posts.slice(0, 12)) {
        const c = el('div', 'card', mine);
        if (GO.okImage(p.img)) { const im = el('img', 'photo', c); im.src = p.img; im.alt = ''; }
        if (p.text) el('p', 'lead', c, p.text);
        if (p.items) for (let i = 0; i < p.items.length; i++) { const it = p.items[i]; const r = toggle(it.t, it.done, async () => { await pc.ask('board', { op: 'tick', id: p.id, i }); }, c); r.parentElement.style.marginBottom = '6px'; }
        const r = el('div', 'row', c);
        el('span', 'muted small grow', r, (p.by ? p.by + ', ' : '') + timeOf(p.at));
        const x = el('button', 'chip', r, 'Take down'); x.type = 'button'; x.onclick = async () => { await pc.ask('board', { op: 'del', id: p.id }); show(); };
      }
    }
    show();
  }

  // =====================================================================
  // This phone's camera on every TV
  // =====================================================================
  async function camera(pc, back) {
    const v = view('Camera on the TVs', { back, tint: 'teal', live: true });
    const vid = el('video', 'photo', v.body); vid.muted = true; vid.playsInline = true; vid.autoplay = true; vid.style.aspectRatio = '16/9'; vid.style.objectFit = 'cover';
    const st = el('p', 'lead center', v.body, 'For a cooking demo, a close-up, or the front door.');
    let facing = 'environment', stream = null, R = null, id = '';
    const start = async () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      vid.srcObject = stream;
      if (R) { for (const p of R.list()) { const P = R.pipeTo(p.id); if (P) P.close(); } }
    };
    const row = el('div', 'grid2', v.body);
    const go = btn('Show it on the TVs', { kind: 'go', icon: 'tv' }, row, async () => {
      await start();
      const s = L.newSecret();
      R = await L.room({ secret: s, label: 'bvcam', me: await C.newMember(), name: GO.deviceName(), role: 'camera', open: true, onPipe: () => {} });
      R.mediaFor = async () => stream;
      id = C.hex(C.rand(6));
      const r = await pc.ask('tvCam', { s, host: R.id, id });
      st.textContent = r.tvs ? `Live on ${r.tvs} screen${r.tvs > 1 ? 's' : ''}. Keep this page open.` : 'The screens connect in a moment. Keep this page open.';
      R.onPeers = list => { const n = list.filter(p => p.role === 'tv').length; if (n) st.textContent = `Live on ${n} screen${n > 1 ? 's' : ''}. Keep this page open.`; };
      go.hidden = true; stop.hidden = false;
      buzz('ok');
    });
    btn('Flip camera', { icon: 'refresh' }, row, async () => { facing = facing === 'environment' ? 'user' : 'environment'; if (stream) await start(); });
    const stop = btn('Stop', { kind: 'bad', full: true }, v.body, async () => { await pc.ask('tvCam', { stop: true, id }).catch(() => {}); if (R) R.close(); R = null; if (stream) stream.getTracks().forEach(t => t.stop()); stream = null; vid.srcObject = null; st.textContent = 'Stopped.'; stop.hidden = true; go.hidden = false; });
    stop.hidden = true; stop.style.marginTop = '10px';
    v.top.querySelector('.back').addEventListener('click', () => { if (R) { pc.ask('tvCam', { stop: true, id }).catch(() => {}); R.close(); } if (stream) stream.getTracks().forEach(t => t.stop()); });
  }

  // =====================================================================
  // KeyVane
  // =====================================================================
  const kvKey = pc => 'kv:' + pc.cid;
  function kv(pc, back) {
    const v = view('KeyVane', { back, tint: 'gold', live: true });
    const set = store.get(kvKey(pc), null);
    const a = el('div', 'card', v.body);
    el('h2', '', a, 'Unlock with this phone');
    if (set && set.w) {
      el('p', '', a, 'Set up. When KeyVane on ' + pc.name + ' asks, this phone shows Approve. You confirm it\'s you with Face ID, a fingerprint or this phone\'s screen lock.');
      btn('Turn it off on this phone', { kind: 'ghost', full: true }, a, () => { store.del(kvKey(pc)); toast('Turned off.'); kv(pc, back); });
    } else {
      el('p', '', a, 'Tap Approve here instead of typing your master password there. First unlock KeyVane on ' + pc.name + ' once, then set it up here.');
      btn('Set it up', { kind: 'go', full: true, icon: 'key' }, a, () => kvSetup(pc).then(() => kv(pc, back)));
    }
    const b = el('div', 'card', v.body);
    el('h2', '', b, 'Look up a password on this phone');
    const copy = store.get('kvcopy:' + pc.cid, null);
    el('p', '', b, copy ? `A locked copy from ${copy.from}, ${new Date(copy.at).toLocaleDateString()}. It opens here with your master password.` : 'Keep a copy of your vault on this phone, still locked with your master password. Nothing can open it without that password.');
    const r = el('div', 'grid2', b);
    if (copy) btn('Open it', { kind: 'go', icon: 'lock' }, r, () => kvOpen(pc));
    btn(copy ? 'Get a fresh copy' : 'Get a copy', {}, r, async () => { await pc.ask('kvCopy', {}); toast('Getting it straight from your computer...'); });
  }
  // the passkey: made on this phone (Face ID, a fingerprint or the screen lock); only its public half goes to the computer
  async function kvSetup(pc) {
    if (!window.PublicKeyCredential || !navigator.credentials) throw new Error('This phone\'s browser can\'t make a passkey.');
    const cred = await navigator.credentials.create({ publicKey: {
      challenge: C.rand(32), rp: { name: 'Blokvane', id: 'blokvane.com' },
      user: { id: C.rand(16), name: 'KeyVane on ' + pc.name, displayName: 'KeyVane on ' + pc.name },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }], timeout: 60000,
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' }, attestation: 'none'
    } });
    if (!cred) throw new Error('No passkey was made.');
    const jwk = await publicJwk(cred.response);
    const r = await pc.ask('kvSetup', { cred: { id: C.b64url(new Uint8Array(cred.rawId)), jwk } }, { timeout: 30000 });
    store.set(kvKey(pc), { w: r.w, cred: r.credId, at: Date.now() });
    buzz('ok');
    toast('Set up. Next time, unlock KeyVane with this phone.', 'ok');
  }
  // the passkey's public key, as a JWK (from getPublicKey() where the browser has it, or read from the attestation)
  async function publicJwk(resp) {
    if (resp.getPublicKey) {
      const spki = resp.getPublicKey();
      if (spki) { const k = await crypto.subtle.importKey('spki', spki, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']); const j = await crypto.subtle.exportKey('jwk', k); return { kty: 'EC', crv: 'P-256', x: j.x, y: j.y }; }
    }
    // a tiny CBOR reader, just enough for the attestation's authData and the COSE key in it
    const cbor = (u, at) => {
      let i = at;
      const rd = () => {
        const b = u[i++], mt = b >> 5, ai = b & 31;
        let n = ai;
        if (ai === 24) n = u[i++]; else if (ai === 25) { n = (u[i] << 8) | u[i + 1]; i += 2; } else if (ai === 26) { n = ((u[i] << 24) | (u[i + 1] << 16) | (u[i + 2] << 8) | u[i + 3]) >>> 0; i += 4; }
        if (mt === 0) return n;
        if (mt === 1) return -1 - n;
        if (mt === 2) { const x = u.slice(i, i + n); i += n; return x; }
        if (mt === 3) { const x = new TextDecoder().decode(u.slice(i, i + n)); i += n; return x; }
        if (mt === 4) { const a = []; for (let k = 0; k < n; k++) a.push(rd()); return a; }
        if (mt === 5) { const m = new Map(); for (let k = 0; k < n; k++) { const key = rd(); m.set(key, rd()); } return m; }
        return null;
      };
      return rd();
    };
    const att = cbor(new Uint8Array(resp.attestationObject), 0);
    const ad = att.get('authData');
    // rpIdHash (32), flags (1), counter (4), AAGUID (16), credential id length (2), the id, then the key
    const idLen = (ad[53] << 8) | ad[54];
    const key = cbor(ad, 55 + idLen);
    return { kty: 'EC', crv: 'P-256', x: C.b64url(key.get(-2)), y: C.b64url(key.get(-3)) };
  }
  // the computer asks: unlock KeyVane there?
  function kvPrompt(pc, a) {
    const set = store.get(kvKey(pc), null);
    if (!set || !set.w) return;
    buzz('long');
    sheet('Unlock KeyVane?', (sh, close) => {
      el('p', 'lead', sh, `KeyVane on ${a.computer || pc.name} asks to unlock. Only approve if you just asked for it there.`);
      const r = el('div', 'stack', sh);
      btn('Approve', { kind: 'go', huge: true, full: true, icon: 'check' }, r, async () => {
        const assertion = await navigator.credentials.get({ publicKey: { challenge: C.unb64url(a.challenge), rpId: 'blokvane.com', allowCredentials: [{ type: 'public-key', id: C.unb64url(a.credId || set.cred) }], userVerification: 'required', timeout: 60000 } });
        const res = assertion.response;
        await pc.ask('kvAnswer', { challenge: a.challenge, w: set.w, a: { cd: C.b64url(new Uint8Array(res.clientDataJSON)), ad: C.b64url(new Uint8Array(res.authenticatorData)), sig: C.b64url(new Uint8Array(res.signature)) } }, { timeout: 20000 });
        close(); buzz('ok'); toast('KeyVane is unlocked on ' + pc.name + '.', 'ok');
      });
      btn('Deny', { kind: 'bad', full: true }, r, async () => { await pc.ask('kvAnswer', { challenge: a.challenge, deny: true }).catch(() => {}); close(); toast('Denied.'); });
    }, { dismiss: false });
  }
  // a locked copy of the vault came in (it stays locked here)
  async function kvStore(pc, blob) {
    try {
      const x = JSON.parse(await blob.text());
      if (!x || !x.vault || !x.vault.kdf || !x.items) throw new Error('bad');
      store.set('kvcopy:' + pc.cid, { vault: x.vault, items: x.items, from: x.from || pc.name, at: x.at || Date.now() });
      buzz('ok'); toast(`KeyVane copy saved here (${Object.keys(x.items).length} items), still locked.`, 'ok');
    } catch (e) { toast('That KeyVane copy didn\'t come through. Try again.', 'bad'); }
  }
  const te = new TextEncoder(), td = new TextDecoder();
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function kvOpen(pc) {
    const copy = store.get('kvcopy:' + pc.cid, null);
    if (!copy) return;
    sheet('Your master password', (sh, close) => {
      el('p', 'muted', sh, 'It opens the copy on this phone only. It\'s never sent anywhere.');
      const i = input({ type: 'password', placeholder: 'Master password' });
      sh.appendChild(i);
      const st = el('p', 'muted small', sh);
      btn('Open', { kind: 'go', full: true }, sh, async () => {
        st.textContent = 'Opening...';
        try {
          const h = copy.vault;
          const base = await crypto.subtle.importKey('raw', te.encode(String(i.value).normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
          const kek = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(h.kdf.salt), iterations: h.kdf.iterations }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
          const raw = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(h.key.iv), additionalData: te.encode('keyvane-vault-key-v1'), tagLength: 128 }, kek, unb64(h.key.ct)));
          const vk = await crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
          raw.fill(0);
          const items = [];
          for (const [id, box] of Object.entries(copy.items)) {
            try { items.push(JSON.parse(td.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv), additionalData: te.encode('item:' + id), tagLength: 128 }, vk, unb64(box.ct))))); } catch (e) {}
          }
          close();
          vaultView(items);
        } catch (e) { st.textContent = 'That master password isn\'t right.'; buzz('bad'); }
      }).style.marginTop = '10px';
      setTimeout(() => i.focus(), 100);
    });
  }
  function vaultView(items) {
    const v = view('KeyVane', { back: () => GO.route(), tint: 'gold' });
    const q = input({ placeholder: 'Search' });
    v.body.appendChild(q);
    const list = el('div', 'list', v.body); list.style.marginTop = '12px';
    const draw = () => {
      list.textContent = '';
      const f = q.value.toLowerCase();
      for (const it of items.filter(x => !f || JSON.stringify([x.name, x.url, x.username]).toLowerCase().includes(f)).slice(0, 80)) {
        const row = el('button', 'item', list); row.type = 'button'; row.style.border = '0'; row.style.textAlign = 'start';
        row.appendChild(icon(it.type === 'card' ? 'file' : it.type === 'note' ? 'clip' : 'key'));
        const t = el('span', 't', row); el('b', '', t, it.name || it.url || 'Item'); el('small', '', t, it.username || it.url || '');
        row.onclick = () => sheet(it.name || 'Item', sh => {
          const show = (label, val, secret) => { if (!val) return; const c = el('div', 'item', sh); const t2 = el('div', 't', c); el('small', '', t2, label); const b = el('b', '', t2, secret ? '••••••••' : val); const x = el('button', 'chip', c, secret ? 'Show' : 'Copy'); x.type = 'button'; x.onclick = async () => { if (secret && b.textContent.startsWith('•')) { b.textContent = val; x.textContent = 'Copy'; return; } try { await navigator.clipboard.writeText(val); toast('Copied.', 'ok'); } catch (e) {} }; c.style.marginBottom = '8px'; };
          show('Username', it.username); show('Password', it.password, true); show('Website', it.url); show('Note', it.notes || it.note);
          if (it.type === 'card') { show('Card number', it.number, true); show('Name on card', it.cardName || it.holder); show('Expires', it.expiry || it.exp); }
        });
      }
    };
    q.oninput = draw;
    draw();
    el('p', 'muted small center', v.body, 'This stays open only on this page. Leave it, and it locks again.').style.marginTop = '14px';
  }

  // =====================================================================
  // The lost computer button
  // =====================================================================
  function lost(pc, back) {
    const v = view('Lost computer', { back, tint: 'rose', live: true });
    const c = el('div', 'card', v.body);
    el('h2', '', c, 'Left ' + pc.name + ' somewhere?');
    el('p', '', c, 'Lock it from here. The computer has to be on, with Chrome open.');
    let cookies = true, tabs = false;
    toggle('Lock KeyVane', true, () => {}, c).disabled = true;
    toggle('Sign out of every website (clears its cookies)', true, x => { cookies = x; }, c).parentElement.style.marginTop = '8px';
    toggle('Close all its tabs', false, x => { tabs = x; }, c).parentElement.style.marginTop = '8px';
    btn('Lock ' + pc.name + ' now', { kind: 'bad', huge: true, full: true, icon: 'lock' }, c, async () => {
      if (!confirm('Lock ' + pc.name + ' now?' + (cookies ? ' You\'ll have to sign in to websites again there.' : ''))) return;
      const r = await pc.ask('lost', { kv: true, cookies, tabs }, { timeout: 20000 });
      buzz('ok');
      toast('Done at ' + timeOf(r.at) + '.', 'ok');
    }).style.marginTop = '14px';
  }
})();
