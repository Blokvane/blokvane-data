// Blokvane on your phone: this phone on a license, your devices, ad blocking for the whole phone, and "play it on the
// computer" for the TV.
//
// A phone has no browser extension, so it is protected one level lower. Every app and browser first asks "where does
// this site live?" (a name lookup). With ad blocking on, the phone asks Blokvane, and for ad and tracking companies
// Blokvane answers "nowhere", so their ads never load. iPhones and iPads get one small settings profile; Android takes
// a name in "Private DNS" (the whole phone) or an address in Chrome (the browser).
//
// This is the one part of the phone app that needs a sign-in (an email and the code sent to it, like hosting a
// game): the phone takes one of your licenses, exactly like a computer. One license, one device.
// What Blokvane's server keeps about it: that this phone has a license, when its address was made and when it was
// last used. Never which sites or apps the phone opened.
GO.def('shield', (kind, parts) => {
  const { el, icon, view, btn, toast, buzz, sheet, store, hero, input, field, plat, pass, foot } = GO;
  const API = BVPASS.api, SITE = 'https://blokvane.com';
  const OFFLINE = 'Can\'t reach Blokvane right now. Check the internet and try again.';
  const back = () => { history.replaceState(null, '', location.pathname); GO.route(); };

  // one request to Blokvane's server, as the signed-in person: { ok, status, data }
  function ask(path, body) {
    const a = pass.get();
    const headers = { 'Content-Type': 'application/json' };
    if (a) headers.Authorization = 'Bearer ' + a.session;
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    return fetch(API + path, { method: 'POST', headers, body: JSON.stringify(Object.assign({ device_id: pass.device() }, body || {})), credentials: 'omit', cache: 'no-store', signal: ctl.signal })
      .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d && typeof d === 'object' ? d : {} }), () => ({ ok: false, status: r.status, data: {} })))
      .then(x => { clearTimeout(t); return x; }, () => { clearTimeout(t); return { ok: false, status: 0, data: {} }; });
  }
  const why = r => (r.status ? r.data.message || 'That didn\'t work. Try again in a minute.' : OFFLINE);
  async function copy(text, done) {
    try { await navigator.clipboard.writeText(text); toast(done || 'Copied.', 'ok'); buzz('tap'); }
    catch (e) { toast('Press and hold the text to copy it.'); }
  }
  // a line of text with a Copy button
  function copyBox(parent, text, label) {
    const box = el('div', 'sh-copy', parent);
    const code = el('code', '', box, text);
    code.setAttribute('aria-label', label);
    btn('Copy', { icon: 'copy' }, box, () => copy(text, label + ' copied.'));
    return box;
  }
  // numbered steps, each with a small picture
  function steps(parent, list) {
    const ol = el('ol', 'steps-pic', parent);
    for (const [ic, t, sub] of list) {
      const li = el('li', '', ol);
      el('span', 'ic', li).appendChild(icon(ic));
      const d = el('div', '', li);
      el('b', '', d, t);
      if (sub) el('small', '', d, sub);
    }
    return ol;
  }
  const ago = sec => { const m = Math.round((Date.now() / 1000 - sec) / 60); return m < 2 ? 'just now' : m < 90 ? m + ' minutes ago' : m < 2880 ? Math.round(m / 60) + ' hours ago' : Math.round(m / 1440) + ' days ago'; };

  // ---------------------------------------------------------------- signing in (an email, then the code sent to it)
  function signIn(after) {
    const v = view('Sign in', { tint: 'mint', back });
    hero(v.body, 'Sign in to Blokvane', 'Use the email your Blokvane license is on. Blokvane sends a code to it: no password.');
    const card = el('div', 'card', v.body);
    const email = field('Your email', input({ type: 'email', placeholder: 'you@example.com', mode: 'email', max: 320 }), card);
    email.autocomplete = 'email'; email.autocapitalize = 'none';
    const err = el('p', 'sh-err', card); err.hidden = true;
    btn('Email me a code', { kind: 'go', full: true, huge: true }, card, async () => {
      err.hidden = true;
      const r = await BVPASS.start(email.value);
      if (r.error) { err.textContent = r.error; err.hidden = false; buzz('bad'); return; }
      codeStep(r);
    });
    function codeStep(s) {
      card.textContent = '';
      el('h2', '', card, 'Check your email');
      el('p', '', card, 'Blokvane sent 8 numbers to ' + s.email + '. Type them here. They work for 15 minutes.');
      const code = field('The code', input({ placeholder: '1234 5678', mode: 'numeric', max: 12 }), card);
      code.autocomplete = 'one-time-code';
      const e2 = el('p', 'sh-err', card); e2.hidden = true;
      btn('Sign in', { kind: 'go', full: true, huge: true }, card, async () => {
        e2.hidden = true;
        const r = await BVPASS.finish(s.id, s.poll, code.value, pass.device());
        if (r.error) { e2.textContent = r.error; e2.hidden = false; buzz('bad'); return; }
        const old = pass.get();
        pass.set({ session: r.session, email: r.email, plan: old && old.email === r.email ? old.plan || '' : '' });
        buzz('ok'); toast('Signed in.', 'ok');
        after();
      });
      btn('Use another email', { kind: 'ghost', full: true }, card, () => signIn(after)).style.marginTop = '10px';
      setTimeout(() => code.focus(), 50);
    }
    el('p', 'muted small center', v.body, 'No license yet? Get Blokvane at blokvane.com. One license covers one device: a computer, a phone or a tablet.');
    foot();
  }

  // ---------------------------------------------------------------- this phone
  async function phone() {
    if (!pass.get()) return signIn(phone);
    const v = view('This phone', { tint: 'mint', back, status: 'Checking...' });
    const [st, mine] = await Promise.all([ask('/v1/phone/dns/state'), ask('/v1/license/devices')]);
    if (st.status === 401 || mine.status === 401) { store.del('games:acct'); return signIn(phone); }
    if (!st.ok || !mine.ok) {
      v.setStatus('Not connected', 'off');
      hero(v.body, 'Blokvane didn\'t answer', why(st.ok ? mine : st), { sleepy: true });
      btn('Try again', { kind: 'go', full: true }, v.body, () => phone());
      return;
    }
    const S = st.data, M = mine.data;
    const me = (M.devices || []).find(d => d.this);
    v.setStatus(pass.get().email, me ? 'on' : 'wait');
    licenseCard(v.body, M, me);
    adsCard(v.body, S, !!me);
    devicesCard(v.body, M);
    const tv = el('div', 'card', v.body);
    el('h2', '', tv, 'YouTube on the TV, without the ads');
    el('p', '', tv, 'Send a video from this phone to your computer, where Blokvane removes YouTube\'s ads, and watch it on the TV.');
    btn('Play on the computer', { kind: 'tint', full: true, icon: 'tv' }, tv, () => { location.hash = '#tvplay'; });
    const out = el('div', 'card', v.body);
    el('p', 'muted small', out, 'Signed in as ' + pass.get().email + '. Signing out here does not take this phone off its license: remove it under "Your devices" first if you want that.');
    btn('Sign out', { kind: 'ghost', full: true }, out, () => { pass.clear(); toast('Signed out.'); back(); });
    foot();
  }

  // the license this phone is on, or how to get it on one
  function licenseCard(parent, M, me) {
    const c = el('div', 'card', parent);
    if (me) {
      el('span', 'pill ok', c, 'On a license');
      el('h2', '', c, 'This phone is covered');
      const from = me.source === 'org' ? 'It uses a license from ' + me.from + '.' : me.source === 'given' ? 'It uses a license ' + me.from + ' gave you.' : me.source === 'gift' ? 'It uses a license Blokvane gave you.' : 'It uses one of your own licenses.';
      el('p', '', c, from + ' One license covers one device at a time.');
      return;
    }
    const total = +M.licenses || 0, free = +M.free || 0;
    if (!total) {
      el('span', 'pill warn', c, 'No license');
      el('h2', '', c, 'This email has no license yet');
      el('p', '', c, 'A license covers one device: a computer, a phone or a tablet. Get one at blokvane.com with this same email, or ask the person who manages Blokvane where you work.');
      const a = el('a', 'btn go full', c, 'See the plans'); a.href = SITE + '/pricing'; a.target = '_blank'; a.rel = 'noopener';
      btn('Check again', { kind: 'ghost', full: true }, c, () => phone()).style.marginTop = '10px';
      return;
    }
    if (free > 0) {
      el('span', 'pill', c, free + ' of ' + total + (total === 1 ? ' license' : ' licenses') + ' free');
      el('h2', '', c, 'Put this phone on a license');
      el('p', '', c, 'It takes one of your licenses, like a computer does. You can take it off again at any time.');
      btn('Use a license on this phone', { kind: 'go', full: true, huge: true, icon: 'shield' }, c, () => takeLicense());
      return;
    }
    // every license is in use: remove a device, ask for one more, or get one
    el('span', 'pill bad', c, 'All ' + total + ' in use');
    el('h2', '', c, 'Every license is in use');
    el('p', '', c, 'Each license covers one device at a time. Take a device off below and this phone can use its license, or get one more.');
    const asks = (M.can_ask || []);
    for (const o of asks) {
      const b = btn(o.asked ? 'Asked ' + o.name + '. Waiting for an answer' : 'Ask ' + o.name + ' for one more', { kind: 'tint', full: true }, c, async () => {
        const r = await ask('/v1/license/request', { org: o.id, device: GO.deviceName(), note: '' });
        if (!r.ok) { toast(why(r), 'bad'); return; }
        toast('Asked. Your administrator gets a message.', 'ok'); phone();
      });
      b.style.marginTop = '8px'; if (o.asked) b.disabled = true;
    }
    const a = el('a', 'btn ghost full', c, M.has_own ? 'Add a license of your own' : 'Get a license of your own'); a.href = SITE + '/account#buy'; a.target = '_blank'; a.rel = 'noopener'; a.style.marginTop = '8px';
  }
  async function takeLicense() {
    const r = await ask('/v1/license/activate', { browser: 'phone', name: GO.deviceName(), caps: ['feat'] });
    if (!r.ok) { toast(why(r), 'bad'); buzz('bad'); }
    else { buzz('ok'); toast('This phone is on a license.', 'ok'); }
    phone();
  }

  // every device this sign-in is on
  function devicesCard(parent, M) {
    const c = el('div', 'card', parent);
    el('h2', '', c, 'Your devices');
    const total = +M.licenses || 0, used = +M.in_use || 0;
    el('p', '', c, total ? used + ' of ' + total + (total === 1 ? ' license' : ' licenses') + ' in use. Removing a device frees its license for another one.' : 'Nothing here yet.');
    const ls = el('div', 'list sh-devs', c);
    for (const d of (M.devices || [])) {
      const it = el('div', 'item', ls);
      it.appendChild(icon(d.browser === 'phone' ? 'phone' : 'laptop'));
      const t = el('span', 't', it);
      el('b', '', t, d.name + (d.this ? ' (this phone)' : ''));
      el('small', '', t, (d.source === 'org' ? d.from : d.source === 'given' ? 'From ' + d.from : d.source === 'gift' ? 'A gift' : 'Your own license') + ', used ' + ago(d.last_seen));
      const rm = el('button', 'sh-x', it); rm.type = 'button'; rm.setAttribute('aria-label', 'Remove ' + d.name); rm.appendChild(icon('trash'));
      rm.onclick = () => sheet('Remove ' + d.name + '?', (sh, close) => {
        el('p', 'muted', sh, d.this ? 'This phone goes off its license. Ad blocking stops; the internet keeps working. Remove the settings profile or the Private DNS name afterwards (the steps are under "Switch it off").'
          : 'Blokvane on that device goes back to free, and it is signed out. Its license is free for another device right away.');
        btn('Remove', { kind: 'bad', full: true }, sh, async () => {
          const r = await ask('/v1/license/devices/remove', { id: d.id });
          close();
          if (!r.ok) toast(why(r), 'bad'); else toast('Removed.', 'ok');
          phone();
        });
        btn('Keep it', { kind: 'ghost', full: true }, sh, close).style.marginTop = '8px';
      });
    }
    const a = el('a', 'btn ghost full', c, 'Manage on blokvane.com'); a.href = SITE + '/account'; a.target = '_blank'; a.rel = 'noopener'; a.style.marginTop = '10px';
    if (M.manages) { const t = el('a', 'btn ghost full', c, 'Your organization\'s licenses'); t.href = SITE + '/team'; t.target = '_blank'; t.rel = 'noopener'; t.style.marginTop = '8px'; }
  }

  // ---------------------------------------------------------------- ad blocking for the whole phone
  function adsCard(parent, S, covered) {
    const c = el('div', 'card sh-ads', parent);
    const urls = store.get('shield:dns', null);
    const have = urls && typeof urls.token === 'string' && /^[a-f0-9]{32}$/.test(urls.token) ? urls : null;
    if (!S.available) {
      el('span', 'pill', c, 'Coming soon');
      el('h2', '', c, 'Block ads on this phone');
      el('p', '', c, 'Ad and tracker blocking for every app on a phone is not switched on yet. Blokvane on your computer blocks them today.');
      return;
    }
    if (S.on && S.blocking && S.working) {
      el('span', 'pill ok', c, 'Working');
      el('h2', '', c, 'Ads and trackers are blocked on this phone');
      el('p', '', c, 'This phone asked Blokvane ' + ago(S.last_used) + '. Blokvane leaves out ' + Number(S.names).toLocaleString('en-US') + ' ad and tracking servers, in every app and browser.');
    } else if (S.on && !S.blocking) {
      el('span', 'pill bad', c, 'Not blocking');
      el('h2', '', c, 'Blocking is off');
      el('p', '', c, S.why === 'org' ? 'Your organization did not include ad blocking on phones in your license. Ask your administrator to switch it on for you.'
        : 'This phone is not on a license any more, so nothing is blocked. The internet keeps working. Put the phone on a license above to block again, or switch it off below.');
    } else if (S.on) {
      el('span', 'pill warn', c, 'Almost there');
      el('h2', '', c, 'Finish the steps on this phone');
      el('p', '', c, 'The address for this phone is made. Blokvane has not heard from the phone yet: do the steps below, then tap "Check now".');
    } else {
      el('h2', '', c, 'Block ads on this phone');
      el('p', '', c, 'In every app and every browser, not just one. It takes about a minute to set up, once.');
      if (!covered) { el('p', 'muted small', c, 'First put this phone on a license (above).'); return; }
      if (!S.licensed) { el('p', 'muted small', c, S.why === 'org' ? 'Your organization did not include ad blocking on phones in your license. Ask your administrator.' : 'This phone needs a license first.'); return; }
      btn('Switch on ad blocking', { kind: 'go', full: true, huge: true, icon: 'shield' }, c, () => make());
      limits(c);
      return;
    }
    if (S.on && have) {
      if (S.blocking && S.working) { const d = el('details', 'sh-again', c); el('summary', '', d, 'Show the steps again'); setup(d, have, S); }
      else setup(c, have, S);
    }
    else if (S.on) {
      el('p', 'muted small', c, 'This app no longer has this phone\'s address (its storage was cleared). Make a new one and do the steps again; the old one stops working.');
      btn('Make a new address', { kind: 'tint', full: true }, c, () => make());
    }
    const r = el('div', 'grid2', c); r.style.marginTop = '12px';
    btn('Check now', { icon: 'refresh' }, r, () => phone());
    btn('Switch it off', { kind: 'ghost' }, r, () => offSheet(have));
    limits(c);
  }
  async function make() {
    const r = await ask('/v1/phone/dns');
    if (!r.ok) { toast(why(r), 'bad'); buzz('bad'); return phone(); }
    store.set('shield:dns', { token: r.data.token, doh: r.data.doh, profile: r.data.profile, hostname: r.data.hostname || '' });
    buzz('ok');
    phone();
  }
  // the steps for this kind of phone
  function setup(c, u, S) {
    const p = plat();
    const box = el('div', 'sh-setup', c);
    if (p === 'ios' || p === 'desktop' && /Mac/.test(navigator.userAgent)) {
      el('h3', '', box, p === 'ios' ? 'iPhone and iPad' : 'Mac');
      const a = el('a', 'btn go full huge', box); a.href = u.profile; a.target = '_blank'; a.rel = 'noopener';
      a.appendChild(icon('shield')); el('span', '', a, 'Install the profile');
      steps(box, p === 'ios' ? [
        ['shield', 'Tap "Install the profile"', 'Safari asks whether to allow the download: tap Allow.'],
        ['gear', 'Open the Settings app', 'At the top, tap "Profile Downloaded".'],
        ['check', 'Tap Install, three times', 'It asks for the phone\'s passcode. "Not Signed" in red is normal for a profile that is not from a company\'s device management.'],
        ['refresh', 'Come back here', 'Tap "Check now". It says "Working" within a minute.']
      ] : [
        ['shield', 'Click "Install the profile"', 'It downloads a small file.'],
        ['gear', 'Open System Settings', 'Privacy and Security, then Profiles. Double-click "Blokvane ad blocking" and click Install.'],
        ['refresh', 'Come back here', 'Click "Check now".']
      ]);
      return;
    }
    if (p === 'android') {
      if (S.android && u.hostname) {
        el('h3', '', box, 'The whole phone');
        copyBox(box, u.hostname, 'This phone\'s name');
        steps(box, [
          ['copy', 'Copy the name above', 'It is this phone\'s own. Don\'t share it.'],
          ['gear', 'Open Settings, then Network and internet', 'On a Samsung: Connections, then More connection settings.'],
          ['lock', 'Tap Private DNS', 'Pick "Private DNS provider hostname", paste the name, and tap Save.'],
          ['refresh', 'Come back here', 'Tap "Check now". It says "Working" within a minute.']
        ]);
        el('h3', '', box, 'Or only in Chrome');
      } else {
        el('h3', '', box, 'In Chrome');
        el('p', 'muted small', box, 'Blocking in every app on Android is being added. Until then, this covers everything you open in Chrome.');
      }
      chromeSteps(box, u);
      return;
    }
    el('h3', '', box, 'In Chrome or Edge on this computer');
    el('p', 'muted small', box, 'Open this page on the phone to set the phone up. On a computer, Blokvane\'s extension blocks far more than this can.');
    chromeSteps(box, u);
  }
  function chromeSteps(box, u) {
    copyBox(box, u.doh, 'This phone\'s address');
    steps(box, [
      ['copy', 'Copy the address above', 'It is this phone\'s own. Don\'t share it.'],
      ['dots', 'In Chrome, tap the three dots, then Settings', 'Then Privacy and security.'],
      ['lock', 'Tap "Use secure DNS"', 'Pick "Choose another provider", then "Custom", and paste the address.'],
      ['refresh', 'Come back here', 'Tap "Check now".']
    ]);
  }
  function offSheet(u) {
    sheet('Switch off ad blocking', (sh, close) => {
      el('p', 'muted', sh, 'Do this on the phone first, so it goes back to its normal lookups:');
      const p = plat();
      steps(sh, p === 'ios' ? [
        ['gear', 'Open Settings, then General', 'Then "VPN and Device Management".'],
        ['trash', 'Tap "Blokvane ad blocking"', 'Then "Remove Profile".']
      ] : p === 'android' ? [
        ['gear', 'Open Settings, then Network and internet', 'Then Private DNS.'],
        ['check', 'Pick "Automatic"', 'In Chrome: Settings, Privacy and security, Use secure DNS, and pick the first choice again.']
      ] : [
        ['gear', 'Open the browser\'s settings', 'Privacy and security, then "Use secure DNS".'],
        ['check', 'Pick the first choice again', 'Or remove the profile under Profiles on a Mac.']
      ]);
      btn('I did that. Switch it off', { kind: 'bad', full: true }, sh, async () => {
        const r = await ask('/v1/phone/dns/off');
        close();
        if (!r.ok) { toast(why(r), 'bad'); return; }
        store.del('shield:dns'); toast('Switched off.', 'ok'); phone();
      }).style.marginTop = '14px';
      btn('Keep it on', { kind: 'ghost', full: true }, sh, close).style.marginTop = '8px';
    });
  }
  // what it can and cannot do, said plainly
  function limits(c) {
    const d = el('details', 'sh-more', c);
    el('summary', '', d, 'What it blocks, and what it can\'t');
    const ul = el('ul', '', d);
    for (const t of [
      'It blocks ads and trackers that come from ad and tracking companies\' own servers: in apps, games, news sites and browsers.',
      'It cannot remove the ads inside YouTube, or in other apps that send their ads from the same servers as their videos. For YouTube without ads, play it on your computer (below).',
      'Where an ad was, an empty space can stay. A sponsored link at the top of search results may not open: use the normal result under it.',
      'This phone\'s lookups go to Blokvane, encrypted. Blokvane answers them and keeps none of them: no list of sites or apps.',
      'If the phone ever has no internet right after a change, switch this off with the steps under "Switch it off". Everything is back at once.'
    ]) el('li', '', ul, t);
  }

  // ---------------------------------------------------------------- a video from this phone, on the computer (and the TV)
  function tidy(text) {
    const m = /https?:\/\/[^\s<>"']+/i.exec(String(text || ''));
    const u = GO.webUrl(m ? m[0] : '');
    if (!u) return '';
    try { const x = new URL(u); if (x.hostname === 'm.youtube.com') x.hostname = 'www.youtube.com'; return x.href; } catch (e) { return ''; }
  }
  function playOn() {
    const v = view('Play on the computer', { tint: 'teal', back });
    const list = GO.pairs();
    let shared = '';
    try { shared = sessionStorage.getItem('bvgo:shared') || ''; sessionStorage.removeItem('bvgo:shared'); } catch (e) {}
    hero(v.body, 'YouTube on the TV, without the ads', 'Send the video to your computer. Blokvane there removes YouTube\'s ads, and this phone is the remote.', { node: (() => { const s = el('span', 'sh-big'); s.appendChild(icon('tv')); return s; })() });
    const c = el('div', 'card', v.body);
    if (!list.length) {
      el('h2', '', c, 'First, connect this phone to your computer');
      steps(c, [
        ['laptop', 'On your computer, open Blokvane', 'Click the Blokvane icon in Chrome or Edge, then Connect.'],
        ['phone', 'Click "Connect your phone"', 'A QR code shows.'],
        ['camera', 'Point this phone\'s camera at it', 'Tap the link. From then on this phone knows your computer.']
      ]);
    } else {
      el('h2', '', c, 'The video\'s link');
      const t = input({ placeholder: 'Paste a YouTube link', max: 2000, value: shared });
      c.appendChild(t);
      const r = el('div', 'grid2', c); r.style.marginTop = '10px';
      btn('Paste', { icon: 'clip' }, r, async () => { try { t.value = tidy(await navigator.clipboard.readText()) || t.value; } catch (e) { toast('Press and hold in the box, then Paste.'); } });
      let pick = list[0];
      const go = btn('Play on ' + pick.name, { kind: 'go', icon: 'play' }, r, async () => {
        const u = tidy(t.value);
        if (!u) { toast('Paste the video\'s link first.', 'bad'); t.focus(); return; }
        const pc = GO.computer(pick);
        const a = await pc.ask('open', { url: u });
        buzz('ok');
        toast(a && a.opened ? 'Playing on ' + pick.name + '.' : 'Sent. It opens when the computer is on.', 'ok');
        done.hidden = false;
      });
      if (list.length > 1) {
        const s = el('div', 'list', c); s.style.marginTop = '10px';
        for (const p of list) {
          const it = el('button', 'item', s); it.type = 'button'; it.style.border = '0'; it.style.textAlign = 'start';
          it.appendChild(icon('laptop')); const tx = el('span', 't', it); el('b', '', tx, p.name);
          it.onclick = () => { pick = p; go.querySelector('span').textContent = 'Play on ' + p.name; for (const x of s.children) x.classList.toggle('on', x === it); };
          if (p === pick) it.classList.add('on');
        }
      }
      const done = el('div', '', c); done.hidden = true; done.style.marginTop = '10px';
      btn('Open the remote', { kind: 'tint', full: true, icon: 'remote' }, done, () => { location.hash = '#c1.' + pick.s + '.' + pick.cid; });
      el('p', 'muted small', c, GO.standalone() && plat() === 'android' ? 'Quicker: in YouTube, tap Share, then Blokvane. The link lands here by itself.'
        : plat() === 'android' ? 'Quicker: add Blokvane to the home screen. Then YouTube\'s Share button lists Blokvane, and the link lands here by itself.'
          : 'In YouTube, tap Share, then Copy link. Then tap Paste here.').style.marginTop = '12px';
    }
    const how = el('div', 'card', v.body);
    el('h2', '', how, 'Getting it onto the TV');
    steps(how, [
      ['laptop', 'A cable is the simplest', 'Plug the computer into the TV (HDMI). What the computer plays, the TV shows, without the ads.'],
      ['cast', 'Chromecast or Google TV', 'On the computer, open Chrome\'s menu (the three dots), then "Cast, save and share", then "Cast", and pick "Cast tab". The TV shows the computer\'s tab, so the ads stay gone.'],
      ['tv', 'Apple TV or a smart TV', 'Mirror the computer\'s screen (AirPlay on a Mac, "Cast" or "Connect to a wireless display" on Windows).']
    ]);
    const no = el('div', 'card', v.body);
    el('h2', '', no, 'What can\'t work');
    el('p', '', no, 'The Cast button inside YouTube hands the video to the TV\'s own YouTube app. That app belongs to the TV: it shows its ads, and nothing on a phone or a computer can reach into it. That is why the video has to play on the computer.');
    foot();
  }

  if (kind === 'tvplay') return playOn();
  return phone();
});
