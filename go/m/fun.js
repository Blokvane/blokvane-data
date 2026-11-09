// Blokvane on your phone: cheers and emoji for the big screen (fan reactions), the phone light show, and a big reveal.
(() => {
  const { el, view, btn, toast, buzz, hero, input, confetti } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('fun', async (kind, parts) => {
    if (kind === 'light') return light(parts);
    if (kind === 'rev') return reveal(parts);
    return fans(parts);
  });
  const wake = async () => { try { if (navigator.wakeLock) return await navigator.wakeLock.request('screen'); } catch (e) {} return null; };

  // ---------- fan reactions: tap, and it shows on the big screen (the screen sets the limits) ----------
  async function fans(parts) {
    const [s, host] = parts;
    const v = view('Cheer on the big screen', { tint: 'pink' });
    if (!s) { hero(v.body, 'This code isn\'t complete', 'Scan it again on the screen.', { sleepy: true }); return; }
    const name = el('div', 'card', v.body);
    el('h2', '', name, 'Your name on the screen');
    const ni = input({ value: GO.store.get('fanName', ''), placeholder: 'Your first name', max: 16 });
    name.appendChild(ni);
    ni.onchange = () => GO.store.set('fanName', L.clean(ni.value, 16));
    const R = await L.room({ secret: s, label: 'bvfan', me: await GO.member('fan:' + s.slice(0, 10)), name: '', role: 'fan', owner: host || '', open: true, onMsg: m => { if (m.k === 'fan-cfg') cfg = m; if (m.k === 'fan-slow') toast('Easy! The screen takes a few at a time.'); } });
    let cfg = { words: true }, last = 0;
    const send = async (e, text) => {
      const t = Date.now();
      if (t - last < 1500) { toast('One moment...'); return; }
      last = t;
      await R.send({ k: 'react', e, text: text || '', n: L.clean(ni.value, 16) });
      buzz('tap');
    };
    const fun = el('div', 'fun', v.body); fun.style.marginTop = '6px';
    for (const e of ['🎉', '🔥', '👏', '😂', '😱', '❤️', '🏈', '🏆', '🙌', '💪', '👻', '🥳']) { const b = el('button', '', fun, e); b.type = 'button'; b.onclick = () => send(e); }
    const say = el('div', 'card', v.body); say.style.marginTop = '12px';
    el('h2', '', say, 'A cheer');
    const chips = el('div', 'chips', say);
    for (const w of ['Let\'s go!', 'Defense!', 'What a play!', 'Touchdown!', 'We love you!']) { const b = el('button', 'chip', chips, w); b.type = 'button'; b.onclick = () => send('📣', w); }
    el('p', 'muted small', v.body, 'Words go through a filter before they show. The screen may take only a few cheers a minute from each phone.').style.marginTop = '10px';
  }

  // ---------- the phone light show ----------
  // Every phone glows in time with the others: the colors come from the same clock (the host's), and each phone's
  // place in the room (its seat) makes waves go across. Changes are smooth and never faster than about twice a second.
  async function light(parts) {
    const [s, host] = parts;
    const v = view('Light show', { tint: 'pink' });
    if (!s || !L.okId(host)) { hero(v.body, 'This code isn\'t complete', 'Scan it again.', { sleepy: true }); return; }
    // (the light show's own icon, the same as in Blokvane)
    const ic = el('div', 'boo float'); const im = el('img', '', ic); im.src = '../play/icons/lightshow.webp'; im.alt = '';
    ic.style.filter = 'drop-shadow(0 10px 16px rgba(236,74,106,.45))';
    hero(v.body, 'Ready to glow?', 'Turn your screen brightness all the way up, then tap Start. Hold your phone up with the screen facing out.', { node: ic });
    let show = { p: 'glow', sp: 1, c: ['#ff6b5e', '#ffc451', '#36d6a5', '#5bb8ff', '#9a8cff'], t0: 0 }, seat = Math.floor(Math.random() * 20), seats = 20;
    const R = await L.room({ secret: s, label: 'bvlight', me: await C.newMember(), name: '', role: 'phone', owner: host, open: false, onMsg: m => {
      if (m.f !== host) return;
      if (m.k === 'ls') show = { p: String(m.p || 'glow'), sp: Math.max(0.3, Math.min(1.6, +m.sp || 1)), c: (Array.isArray(m.c) ? m.c : show.c).filter(x => /^#[0-9a-f]{6}$/i.test(x)).slice(0, 8), t0: +m.t0 || 0 };
      if (m.k === 'seat') { seat = +m.i || 0; seats = Math.max(1, +m.n || 1); }
    } });
    R.syncClock(host).catch(() => {});
    setInterval(() => R.syncClock(host, 3).catch(() => {}), 30000);
    btn('Start', { kind: 'go', huge: true, full: true }, v.body, async () => {
      const lock = await wake();
      const f = el('div', '', document.body);
      f.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;inset:0;z-index:80;background:#000;transition:background-color .35s linear';
      try { await (document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen() : Promise.resolve()); } catch (e) {}
      const hint = el('div', '', f, 'Tap to stop'); hint.style.cssText = 'position:absolute;bottom:20px;left:0;right:0;text-align:center;color:rgba(255,255,255,.5);font:600 14px system-ui';
      setTimeout(() => hint.remove(), 3000);
      const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
      const mix = (a, b, k) => a.map((x, i) => Math.round(x + (b[i] - x) * k));
      let on = true;
      const tick = () => {
        if (!on) return;
        const t = (R.clock() - show.t0) / 1000 * show.sp;
        const cs = show.c.length ? show.c.map(hex) : [[255, 107, 94]];
        let rgb = [0, 0, 0];
        const place = seat / Math.max(1, seats);
        switch (show.p) {
          case 'off': rgb = [0, 0, 0]; break;
          case 'wave': { const x = (t * 0.5 - place) % 1; const k = (x + 1) % 1 * cs.length; rgb = mix(cs[Math.floor(k) % cs.length], cs[(Math.floor(k) + 1) % cs.length], k % 1); break; }
          case 'pulse': { const k = (Math.sin(t * Math.PI * 1.2) + 1) / 2; rgb = mix([0, 0, 0], cs[Math.floor(t / 4) % cs.length], 0.25 + k * 0.75); break; }
          case 'sparkle': { const r = Math.sin(seat * 12.9898 + Math.floor(t * 2) * 78.233) * 43758.5453; const k = r - Math.floor(r); rgb = k > 0.75 ? [255, 255, 255] : mix([0, 0, 0], cs[Math.floor(k * 10) % cs.length], 0.6); break; }
          case 'team': { const k = (Math.sin(t * 1.5 + place * 6.28) + 1) / 2; rgb = mix(cs[0], cs[1 % cs.length], k); break; }
          case 'hearts': { const beat = (t * 1.1) % 1; const k = beat < 0.15 ? beat / 0.15 : beat < 0.3 ? 1 - (beat - 0.15) / 0.15 * 0.6 : beat < 0.45 ? 0.4 + (beat - 0.3) / 0.15 * 0.6 : Math.max(0.15, 1 - (beat - 0.45) * 1.6); rgb = mix([20, 0, 8], cs[0], k); break; }
          default: { const k = (Math.sin(t * 0.6 + place * 3) + 1) / 2; rgb = mix(cs[Math.floor(t / 6) % cs.length], cs[(Math.floor(t / 6) + 1) % cs.length], k); }
        }
        f.style.backgroundColor = `rgb(${rgb.join(',')})`;
        setTimeout(tick, 120);
      };
      tick();
      f.onclick = () => { on = false; f.remove(); if (lock) lock.release().catch(() => {}); try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} };
    });
  }

  // ---------- a big reveal ----------
  async function reveal(parts) {
    const [s, host] = parts;
    const v = view('Big reveal', { tint: 'pink' });
    if (!s || !L.okId(host)) { hero(v.body, 'This code isn\'t complete', 'Scan it again.', { sleepy: true }); return; }
    const h = hero(v.body, 'Something big is coming', 'Keep this page open. It shows here at the same second as everyone else.');
    const left = el('div', 'code', v.body, '...'); left.style.fontSize = '64px';
    let at = 0, content = null;
    const R = await L.room({ secret: s, label: 'bvrev', me: await C.newMember(), name: GO.deviceName(), role: 'guest', owner: host, open: false, onMsg: m => {
      if (m.f !== host) return;
      if (m.k === 'rev-when') at = +m.at || at;
      if (m.k === 'rev-show') { content = m; at = +m.at || at; }
    } });
    R.send({ k: 'rev-hi2' }).catch(() => {});
    setTimeout(() => R.send({ k: 'rev-hi2' }).catch(() => {}), 3000);
    R.syncClock(host).catch(() => {});
    const lock = await wake();
    const t = setInterval(() => {
      if (!at) return;
      const sec = Math.ceil((at - R.clock()) / 1000);
      left.textContent = sec > 90 ? new Date(at - R.offset()).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : sec > 0 ? String(sec) : '';
      if (sec <= 0 && content) {
        clearInterval(t);
        v.body.textContent = '';
        const box = el('div', 'hero', v.body);
        const e = el('div', '', box, content.e || '🎉'); e.style.fontSize = '110px';
        if (content.img && L.okPicture(content.img)) { const im = el('img', 'photo', box); im.src = content.img; im.alt = ''; }
        el('h1', '', box, L.clean(content.title, 80) || 'Surprise!').style.fontSize = '34px';
        if (content.text) el('p', '', box, L.clean(content.text, 140));
        confetti();
        buzz('long');
        if (lock) setTimeout(() => lock.release().catch(() => {}), 60000);
      }
    }, 150);
    void h;
  }
})();
