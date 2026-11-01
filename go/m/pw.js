// Blokvane: a password or Wi-Fi code someone sent you with a link that works only a few times. The page asks the
// sender's computer for the locked copy (with the PIN, if they set one), and unlocks it here with the key that is in
// the link. Nothing is kept on this phone.
(() => {
  const { el, view, btn, toast, buzz, hero, input } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('pw', async (kind, parts) => {
    const [s, cid, k] = parts;
    const v = view('A password for you', { tint: 'gold' });
    if (!s || !L.okId(cid) || !k) { hero(v.body, 'This link isn\'t complete', 'Ask the person who sent it for the whole link.', { sleepy: true }); return; }
    // (the key leaves the address, so it isn't in this browser's history)
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    const h = hero(v.body, 'Asking for it...', 'This comes straight from the sender\'s computer. It has to be on.');
    let info = null, done = false, waitPin = null;
    const R = await L.room({ secret: s, label: 'bvpw', me: await C.newMember(), name: GO.deviceName(), role: 'guest', owner: cid, open: false, onMsg: async m => {
      if (m.f !== cid || done) return;
      if (m.k === 'pw-info' && !info) { info = m; ready(); }
      else if (m.k === 'pw-no') { if (waitPin) { waitPin(m.why); return; } h.querySelector('h1').textContent = 'This link doesn\'t work any more'; h.querySelector('p').textContent = L.clean(m.why, 120); }
      else if (m.k === 'pw-data') { done = true; await show(m); R.close(); }
    } });
    let tries = 0;
    const hi = setInterval(() => { if (info || done || ++tries > 25) { clearInterval(hi); if (!info && !done) { h.querySelector('h1').textContent = 'The sender\'s computer isn\'t answering'; h.querySelector('p').textContent = 'It has to be on, with Chrome open. Try again in a little while.'; } return; } R.send({ k: 'pw-hi' }); }, 1500);
    R.send({ k: 'pw-hi' }).catch(() => {});
    function ready() {
      v.body.textContent = '';
      const hh = hero(v.body, (info.from ? info.from + ' sent you ' : 'You got ') + (info.kind === 'wifi' ? 'a Wi-Fi password' : 'a password'), `"${info.label}". The link works ${info.left > 1 ? info.left + ' more times' : 'one more time'}, until ${new Date(info.until).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' })}.`);
      void hh;
      const c = el('div', 'card', v.body);
      let pin = null;
      if (info.pin) { el('h2', '', c, 'PIN or password'); el('p', '', c, 'The sender gave you a PIN or password for this. Ask them if you don\'t have it.'); pin = input({ type: 'password', placeholder: 'PIN or password' }); c.appendChild(pin); }
      const st = el('p', 'muted small', c);
      btn('Show it', { kind: 'go', full: true, huge: true }, c, async () => {
        if (pin && !pin.value) { pin.focus(); return; }
        st.textContent = '';
        if (pin) {
          const why = await new Promise(res => { waitPin = res; R.box(cid, { k: 'pw-get', pin: pin.value }).catch(e => res(e.message)); setTimeout(() => res(''), 12000); });
          waitPin = null;
          if (why && !done) { st.textContent = why; buzz('bad'); }
        } else await R.send({ k: 'pw-get' });
      }).style.marginTop = '10px';
    }
    async function show(m) {
      let x;
      try {
        const key = await crypto.subtle.importKey('raw', C.unb64url(k), 'AES-GCM', false, ['decrypt']);
        x = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: C.unb64url(m.iv) }, key, C.unb64url(m.ct))));
      } catch (e) { v.body.textContent = ''; hero(v.body, 'This link isn\'t complete', 'The key part of the link is missing or changed. Ask for the whole link again.', { sleepy: true }); return; }
      buzz('ok');
      v.body.textContent = '';
      hero(v.body, x.label || (x.kind === 'wifi' ? 'Wi-Fi' : 'Your password'), m.left > 0 ? `This link works ${m.left} more time${m.left > 1 ? 's' : ''}.` : 'This link doesn\'t work any more after this. Save it somewhere safe now.');
      const c = el('div', 'card', v.body);
      if (x.kind === 'wifi' && x.ssid) { el('p', 'muted small', c, 'Network'); el('h2', '', c, x.ssid); }
      if (x.user) { el('p', 'muted small', c, 'Username'); el('h2', '', c, x.user); }
      el('p', 'muted small', c, x.kind === 'wifi' ? 'Password' : 'Password');
      const code = el('div', 'code', c, x.secret); code.style.fontSize = x.secret.length > 16 ? '22px' : '30px'; code.style.wordBreak = 'break-all'; code.style.letterSpacing = '.04em';
      btn('Copy it', { kind: 'go', full: true, icon: 'copy' }, c, async () => { try { await navigator.clipboard.writeText(x.secret); toast('Copied.', 'ok'); } catch (e) { toast('Press and hold the password to copy it.'); } });
      if (x.kind === 'wifi' && x.ssid) {
        el('p', 'muted small center', v.body, 'Other phones can join by scanning this:').style.marginTop = '14px';
        GO.qr(BVQR.wifi(x.ssid, x.secret, 'WPA', false), v.body);
      }
    }
  });
})();
