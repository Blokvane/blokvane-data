// Blokvane on your phone: this phone's own pages.
//
//   #me      Account. Who is signed in on this phone, the licenses that email has and the devices on them: rename
//            one, remove one, put this phone on a license or take it off.
//   #ads     Block ads on this phone, in three numbered steps: sign in, put this phone on a license, switch it on.
//
// A phone has no browser extension, so it is protected one level lower. Every app and browser first asks "where does
// this site live?" (a name lookup). With ad blocking on, the phone asks Blokvane, and for ad and tracking companies
// Blokvane answers "nowhere", so their ads never load. iPhones and iPads get one small settings profile; Android takes
// a name in "Private DNS" (the whole phone) or an address in Chrome (the browser).
//
// These pages are the one part of the phone app that needs a sign-in (an email and the code sent to it, like hosting
// a game): the phone takes one of your licenses, exactly like a computer. One license, one device.
// What Blokvane's server keeps about it: that this phone has a license, when its address was made and when it was
// last used. Never which sites or apps the phone opened.
// Paying, changing a plan and giving a license to someone stay on blokvane.com: this phone's sign-in may look at
// licenses and devices, never at billing.
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
  const many = (n, one, more) => n + ' ' + (n === 1 ? one : more || one + 's');
  // (an email address reads left to right inside any sentence, and stays in one piece unless a line is too short for it)
  const mail = (parent, email) => {
    const b = el('bdi', 'sh-mail', parent, String(email)); b.dir = 'ltr';
    return b;
  };
  // a link that looks like a button, to blokvane.com (it opens in the browser)
  function site(parent, text, path, kind) {
    const a = el('a', 'btn full ' + (kind || 'ghost'), parent);
    a.href = SITE + path; a.target = '_blank'; a.rel = 'noopener';
    el('span', '', a, text);
    return a;
  }
  // the top of a page: one picture, what the page is for, one line under it
  function head(parent, ic, title, text, tone) {
    const h = el('div', 'sh-head' + (tone ? ' ' + tone : ''), parent);
    el('span', 'sh-ic', h).appendChild(icon(ic));
    el('h1', '', h, title);
    const p = el('p', '', h);
    if (text) p.textContent = text;
    return { h, p };
  }
  // Is ad blocking for phones open? Asked without a sign-in, and remembered for a few hours.
  //   'all' for everyone on a license, 'some' while Blokvane tries it out with a few people, 'none' not yet,
  //   '' when the server didn't say (then the pages ask it once you are signed in)
  const INFO_HOURS = 3;
  function infoNow() {
    const i = store.get('shield:info', null);
    return i && typeof i === 'object' && typeof i.open === 'string' && Date.now() - (+i.at || 0) < 7 * 864e5 ? i : { open: '', android: false, at: 0 };
  }
  function infoFresh() {
    const have = infoNow();
    if (have.at && Date.now() - have.at < INFO_HOURS * 3600e3) return Promise.resolve(false);
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 8000);
    return fetch(API + '/v1/phone/dns/info', { credentials: 'omit', signal: ctl.signal }).then(r => (r.ok ? r.json() : null)).then(d => {
      clearTimeout(t);
      if (!d || !/^(all|some|none)$/.test(d.open)) return false;
      const next = { open: d.open, android: !!d.android, at: Date.now() };
      store.set('shield:info', next);
      return next.open !== have.open || next.android !== have.android;
    }, () => { clearTimeout(t); return false; });
  }
  // what the home screen says about this phone under "This phone", kept from the last look
  function remember(a, M, S) {
    if (!a) { store.del('shield:sum'); return; }
    const sum = { email: a.email, at: Date.now() };
    if (M) { sum.total = +M.licenses || 0; sum.used = +M.in_use || 0; sum.on = (M.devices || []).some(d => d.this); }
    if (S) sum.ads = !S.available ? 'closed' : S.on && S.blocking && S.working ? 'working' : S.on && S.licensed ? 'steps'
      : (M && M.phone_any === false && (+M.licenses || 0) > 0) || S.why === 'org' ? 'left-out' : 'off';
    const old = store.get('shield:sum', null);
    store.set('shield:sum', Object.assign(old && old.email === a.email ? old : {}, sum));
  }
  // the server said this sign-in is over (it was signed out somewhere, or this phone was removed)
  function signedOut() { store.del('games:acct'); store.del('games:passes'); store.del('games:pass'); store.del('shield:sum'); }

  // ---------------------------------------------------------------- signing in (an email, then the code sent to it)
  function signInForm(parent, after) {
    const box = el('div', 'sh-sign', parent);
    function emailStep(keep) {
      box.textContent = '';
      const email = field('Your email', input({ type: 'email', placeholder: 'you@example.com', mode: 'email', max: 320, value: keep || '' }), box);
      email.autocomplete = 'email'; email.autocapitalize = 'none'; email.dir = 'ltr';
      el('p', 'muted small', box, 'Use the email your Blokvane plan is on. Blokvane emails you a code: there is no password.');
      const err = el('p', 'sh-err', box); err.hidden = true;
      const go = btn('Email me a code', { kind: 'go', full: true, icon: 'key' }, box, async () => {
        err.hidden = true;
        const r = await BVPASS.start(email.value);
        if (r.error) { err.textContent = r.error; err.hidden = false; buzz('bad'); return; }
        codeStep(r);
      });
      email.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
    }
    function codeStep(s) {
      box.textContent = '';
      const p = el('p', '', box);
      p.append('Blokvane sent 8 numbers to '); mail(p, s.email); p.append('. Type them here. They work for 15 minutes.');
      const code = field('The code', input({ placeholder: '1234 5678', mode: 'numeric', max: 9 }), box);
      code.autocomplete = 'one-time-code'; code.dir = 'ltr'; code.classList.add('sh-code');
      el('p', 'muted small', box, 'It can take a minute to arrive. Look in Spam too.');
      const err = el('p', 'sh-err', box); err.hidden = true;
      let busy = false;
      const go = btn('Sign in', { kind: 'go', full: true, icon: 'key' }, box, async () => {
        if (busy) return;
        busy = true; err.hidden = true;
        const r = await BVPASS.finish(s.id, s.poll, code.value, pass.device());
        busy = false;
        if (r.error) {
          err.textContent = r.error; err.hidden = false; buzz('bad');
          // (too many wrong codes, or the code ran out: a new one is the way on)
          if (/^(too_many_tries|expired_code|claimed|not_found)$/.test(r.code || '')) code.disabled = true; else code.select();
          return;
        }
        const old = pass.get(), email = r.email || s.email;
        pass.set({ session: r.session, email, plan: old && old.email === email ? old.plan || '' : '' });
        store.del('shield:sum');
        buzz('ok'); toast('Signed in.', 'ok');
        after();
      });
      code.oninput = () => { const t = code.value.replace(/[^0-9]/g, '').slice(0, 8); const show = t.length > 4 ? t.slice(0, 4) + ' ' + t.slice(4) : t; if (code.value !== show) code.value = show; if (t.length === 8) go.click(); };
      code.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } });
      const r2 = el('div', 'grid2', box); r2.style.marginTop = '10px';
      const re = btn('Send a new code', { kind: 'ghost' }, r2, async () => {
        const r = await BVPASS.start(s.email);
        if (r.error) { err.textContent = r.error; err.hidden = false; buzz('bad'); return; }
        toast('A new code is on its way.', 'ok');
        codeStep(r);
      });
      re.classList.add('sh-sm');
      btn('Use another email', { kind: 'ghost' }, r2, () => emailStep(s.email)).classList.add('sh-sm');
      setTimeout(() => { try { code.focus(); } catch (e) {} }, 60);
    }
    emailStep();
    return box;
  }
  // signing out asks first, and says what it does not do
  function signOutSheet(after, covered) {
    const a = pass.get();
    sheet('Sign out on this phone?', (sh, close) => {
      const p = el('p', 'muted', sh);
      p.append('You are signed in as '); mail(p, a ? a.email : ''); p.append('.');
      el('p', 'muted', sh, covered ? 'Signing out does not take this phone off its license, and ad blocking stays as it is. To free the license, remove this phone under "Your licenses" first.'
        : 'Your computers and your plan stay as they are. You can sign in again at any time.');
      btn('Sign out', { kind: 'bad', full: true }, sh, () => { pass.clear(); store.del('shield:sum'); close(); toast('Signed out.'); after(); });
      btn('Stay signed in', { kind: 'ghost', full: true }, sh, close).style.marginTop = '8px';
    });
  }

  // ---------------------------------------------------------------- licenses and the devices on them
  const fromWhere = d => (d.source === 'org' ? 'A license from ' + d.from : d.source === 'given' ? 'A license ' + d.from + ' gave you' : d.source === 'gift' ? 'A license Blokvane gave you' : 'Your own license');
  async function takeLicense(again) {
    const r = await ask('/v1/license/activate', { browser: 'phone', name: GO.deviceName(), caps: ['feat'] });
    if (!r.ok) { toast(why(r), 'bad'); buzz('bad'); }
    else { buzz('ok'); toast('This phone is on a license.', 'ok'); }
    again();
  }
  // removing a device asks first, and says what it means for that device
  function removeSheet(d, again) {
    sheet('Remove ' + d.name + '?', (sh, close) => {
      el('p', 'muted', sh, d.this ? 'This phone goes off its license and is signed out here. Ad blocking stops; the internet keeps working. If ad blocking was on, switch it off on the phone too (the steps are under "Switch it off").'
        : 'Blokvane on that device goes back to free, and it is signed out. Its license is free for another device right away.');
      btn(d.this ? 'Take this phone off' : 'Remove it', { kind: 'bad', full: true }, sh, async () => {
        const r = await ask('/v1/license/devices/remove', { id: d.id });
        close();
        if (!r.ok) toast(why(r), 'bad'); else toast('Removed. Its license is free.', 'ok');
        again();
      });
      btn('Keep it', { kind: 'ghost', full: true }, sh, close).style.marginTop = '8px';
    });
  }
  // a name of your own for a device ("Dad's laptop"): it shows here, on blokvane.com and in Blokvane on that device
  function renameSheet(d, again) {
    sheet('Name this device', (sh, close) => {
      el('p', 'muted', sh, 'Give it a name you will know it by, like "Kitchen laptop". It shows here, on blokvane.com and in Blokvane on that device.');
      const i = input({ value: d.name, max: 40 });
      sh.appendChild(i);
      const err = el('p', 'sh-err', sh); err.hidden = true; err.style.marginTop = '10px';
      const save = btn('Save the name', { kind: 'go', full: true }, sh, async () => {
        const name = i.value.trim();
        if (!name) { err.textContent = 'Type a name first.'; err.hidden = false; return; }
        if (name === d.name) return close();
        const r = await ask('/v1/license/devices/rename', { id: d.id, name });
        if (!r.ok) { err.textContent = why(r); err.hidden = false; buzz('bad'); return; }
        close(); toast('Saved.', 'ok'); again();
      });
      save.style.marginTop = '12px';
      i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); save.click(); } });
      btn('Cancel', { kind: 'ghost', full: true }, sh, close).style.marginTop = '8px';
      setTimeout(() => { try { i.focus(); i.select(); } catch (e) {} }, 60);
    });
  }
  // how many licenses are in use, as a bar
  function meter(parent, used, total) {
    const m = el('div', 'sh-meter', parent);
    m.setAttribute('role', 'img'); m.setAttribute('aria-label', used + ' of ' + many(total, 'license') + ' in use');
    const bar = el('span', '', m);
    el('i', '', bar).style.width = (total ? Math.min(100, Math.round(used / total * 100)) : 0) + '%';
    el('b', '', m, used + ' of ' + total + ' in use');
    return m;
  }
  // one device on a license: its name, where its license comes from, when it was last used, and what you can do
  function deviceRow(ls, d, again, o = {}) {
    const it = el('div', 'item sh-dev' + (d.this ? ' me' : ''), ls);
    it.appendChild(icon(d.browser === 'phone' ? 'phone' : 'laptop'));
    const t = el('span', 't', it);
    const b = el('b', '', t, d.name);
    if (d.this) el('span', 'sh-chip', b, 'This phone');
    el('small', '', t, fromWhere(d) + ', used ' + ago(d.last_seen));
    if (!o.plain) {
      const rn = el('button', 'sh-x', it); rn.type = 'button'; rn.setAttribute('aria-label', 'Rename ' + d.name); rn.appendChild(icon('draw'));
      rn.onclick = () => renameSheet(d, again);
    }
    // (where taking a device off is the thing to do, the button says so in a word; elsewhere a small bin is enough)
    if (o.plain) { const rm = btn('Remove', { kind: 'bad' }, it, () => removeSheet(d, again)); rm.classList.add('sh-sm'); rm.setAttribute('aria-label', 'Remove ' + d.name); return it; }
    const rm = el('button', 'sh-x bad', it); rm.type = 'button'; rm.setAttribute('aria-label', 'Remove ' + d.name); rm.appendChild(icon('trash'));
    rm.onclick = () => removeSheet(d, again);
    return it;
  }
  // "every license is in use": ask the organization for one more, or get one on the website
  function moreLicenses(parent, M, again) {
    for (const o of (M.can_ask || [])) {
      const b = btn(o.asked ? 'Asked ' + o.name + '. Waiting for an answer' : 'Ask ' + o.name + ' for one more', { kind: 'tint', full: true }, parent, async () => {
        const r = await ask('/v1/license/request', { org: o.id, device: GO.deviceName(), note: '' });
        if (!r.ok) { toast(why(r), 'bad'); return; }
        toast('Asked. Your administrator gets a message.', 'ok'); again();
      });
      b.style.marginTop = '8px'; if (o.asked) b.disabled = true;
    }
    site(parent, M.has_own ? 'Get one more license' : +M.licenses ? 'Get a license of your own' : 'See the plans', M.has_own ? '/account#buy' : '/pricing').style.marginTop = '8px';
  }

  // ---------------------------------------------------------------- Account: who is signed in, licenses, devices
  async function me() {
    const a = pass.get();
    if (!a) {
      const v = view('Account', { tint: 'sky', back });
      head(v.body, 'kid', 'Sign in to Blokvane', 'For your licenses, ad blocking on this phone, and hosting party games.');
      signInForm(el('div', 'card', v.body), me);
      const g = el('div', 'card', v.body);
      el('h2', '', g, 'No plan yet?');
      el('p', '', g, 'Get Blokvane on your computer first. One license covers one device: a computer, a phone or a tablet.');
      site(g, 'See the plans', '/pricing');
      el('p', 'muted small center', v.body, 'The rest of this app needs no sign-in: the remote, sending files, and joining a game.');
      foot();
      return;
    }
    const v = view('Account', { tint: 'sky', back, status: 'Checking...' });
    const mine = await ask('/v1/license/devices');
    if (!v.body.isConnected) return;
    if (mine.status === 401) { signedOut(); return me(); }
    // who is signed in
    const who = el('div', 'card sh-who', v.body);
    el('span', 'sh-av', who, (a.email[0] || '?').toUpperCase());
    const wt = el('div', 't', who);
    mail(el('b', '', wt), a.email);
    const line = el('small', '', wt, 'Signed in on this phone');
    if (!mine.ok) {
      v.setStatus('Not connected', 'off');
      hero(v.body, 'Blokvane didn\'t answer', why(mine), { sleepy: true });
      btn('Try again', { kind: 'go', full: true }, v.body, () => me());
      btn('Sign out', { kind: 'ghost', full: true }, v.body, () => signOutSheet(me, false)).style.marginTop = '10px';
      foot();
      return;
    }
    const M = mine.data, total = +M.licenses || 0, used = +M.in_use || 0, free = +M.free || 0;
    const mineDev = (M.devices || []).find(d => d.this);
    remember(a, M, null);
    v.setStatus(a.email, total ? 'on' : 'wait');
    line.textContent = total ? many(total, 'license') + ', ' + used + ' in use' : 'No license on this email yet';

    // the licenses, and the devices on them
    const c = el('div', 'card', v.body);
    el('h2', '', c, 'Your licenses');
    if (!total && !(M.devices || []).length) {
      const p = el('p', '', c);
      p.append('There is no license on '); mail(p, a.email); p.append(' yet. A license covers one device: a computer, a phone or a tablet.');
      site(c, 'See the plans', '/pricing', 'go');
      btn('Check again', { kind: 'ghost', full: true }, c, () => me()).style.marginTop = '8px';
      el('p', 'muted small', c, 'Is your plan on another email? Sign out, then sign in with that one.').style.marginTop = '12px';
    } else {
      el('p', '', c, 'One license covers one device at a time. Removing a device frees its license for another one.');
      meter(c, used, total);
      const ls = el('div', 'list sh-devs', c);
      for (const d of (M.devices || [])) deviceRow(ls, d, me);
      for (let i = 0; i < free; i++) {
        const it = el('div', 'item sh-dev free', ls);
        it.appendChild(icon('plus'));
        const t = el('span', 't', it);
        el('b', '', t, 'A free license');
        // (a phone can use a free license only when it includes ad blocking on phones)
        const here = !mineDev && (typeof M.phone_any !== 'boolean' || (+M.phone_free || 0) > 0);
        el('small', '', t, mineDev ? 'Sign in on another device to use it' : here ? 'Ready for this phone or another device' : 'Ready for a computer: it does not include phones');
        // (one button is enough: the first free one)
        if (here && i === 0) { const u = btn('Use it here', { kind: 'tint' }, it, () => takeLicense(me)); u.classList.add('sh-sm'); }
      }
      if (!mineDev && !free && total) el('p', 'muted small', c, 'Every license is in use. Remove a device above and this phone can use its license, or get one more.').style.marginTop = '12px';
      const more = el('div', 'sh-more-lic', c);
      moreLicenses(more, M, me);
      if (M.manages) site(more, 'Your organization\'s licenses', '/team').style.marginTop = '8px';
    }

    // this phone
    const ph = el('div', 'card', v.body);
    el('h2', '', ph, 'This phone');
    const ls2 = el('div', 'list own-list', ph);
    GO.ownRow(ls2, 'shield', 'mint', 'Block ads on this phone', mineDev ? 'This phone is on a license'
      : M.phone_any === false && (+M.licenses || 0) > 0 ? 'Not part of your license' : 'It needs one of your licenses', '#ads');
    // what stays on the website, and why
    const web = el('div', 'card', v.body);
    el('h2', '', web, 'On blokvane.com');
    el('p', '', web, 'Change or cancel your plan, give a license to someone, and see your invoices on your account page. It asks you to sign in there once more: paying is only ever done on the website.');
    site(web, 'Open my account', '/account');
    btn('Sign out', { kind: 'ghost', full: true, icon: 'x' }, v.body, () => signOutSheet(me, !!mineDev)).classList.add('sh-out');
    foot();
  }

  // ---------------------------------------------------------------- Block ads on this phone, in three steps
  // one step of the three: a number (or a tick), what it is, and under it what to do
  function step(list, n, state, title, note) {
    const li = el('li', 'sh-step s-' + state, list);
    const hd = el('div', 'sh-step-h', li);
    const num = el('span', 'sh-num', hd);
    if (state === 'done') num.appendChild(icon('check')); else num.textContent = String(n);
    const t = el('div', 't', hd);
    el('b', '', t, title);
    const sm = el('small', '', t);
    if (note instanceof Node) sm.appendChild(note); else if (note) sm.textContent = note; else sm.hidden = true;
    const body = el('div', 'sh-step-b', li);
    if (state === 'todo') body.hidden = true;
    return { li, hd, body, note: sm };
  }
  function progress(parent, done) {
    const p = el('div', 'sh-prog', parent);
    p.setAttribute('role', 'img'); p.setAttribute('aria-label', done + ' of 3 steps done');
    const bar = el('span', '', p);
    for (let i = 0; i < 3; i++) el('i', i < done ? 'on' : '', bar);
    el('b', '', p, done === 3 ? 'All 3 steps done' : done + ' of 3 done');
    return p;
  }
  // does this phone get the whole phone covered, or only Chrome? (an iPhone: always the whole phone)
  const whole = android => { const p = plat(); return p === 'ios' || (p === 'android' && !!android); };
  const lead = android => (whole(android) ? 'In every app and every browser. Three steps, about a minute, once.'
    : plat() === 'android' ? 'In Chrome on this phone. Three steps, about a minute, once.'
      : 'This page is made for a phone or a tablet. On a computer, Blokvane in Chrome or Edge blocks far more.');
  // (what the top of the page says while ad blocking is not open here: what it is, and no promise)
  const QUIET = 'Ads and trackers are stopped before they load, by Blokvane answering the phone\'s lookups.';
  // ad blocking for phones is not open (yet) for this person
  function closedCard(parent, some, again) {
    const c = el('div', 'card sh-closed', parent);
    el('span', 'pill warn', c, 'Not open yet');
    el('h2', '', c, some ? 'Not open for this email yet' : 'Ad blocking for phones is not switched on yet');
    el('p', '', c, some ? 'Blokvane is trying ad blocking for phones out with a few people before it opens for everyone. Nothing was changed on this phone or on your licenses.'
      : 'It opens here as soon as it is ready. Nothing was changed on this phone or on your licenses.');
    el('p', '', c, 'Blokvane on your computer blocks ads today.');
    if (again) btn('Check again', { kind: 'ghost', full: true, icon: 'refresh' }, c, again).style.marginTop = '4px';
    return c;
  }
  async function ads() {
    const a = pass.get(), p = plat();
    const info = infoNow();
    // (asked again in the background; the page is drawn anew only when the answer changed what it says)
    const here = () => /^#ads\b/.test(location.hash);
    infoFresh().then(changed => { if (changed && here() && !pass.get()) ads(); });
    if (!a) {
      const v = view('Block ads', { tint: 'mint', back });
      head(v.body, 'shield', 'Block ads on this phone', info.open === 'none' ? QUIET : lead(info.android));
      if (info.open === 'none') { closedCard(v.body, false, null); foot(); return; }
      progress(v.body, 0);
      const ol = el('ol', 'sh-steps', v.body);
      const s1 = step(ol, 1, 'now', 'Sign in', 'With the email your Blokvane plan is on');
      if (info.open === 'some') el('p', 'sh-note', s1.body, 'Blokvane is trying this out with a few people first. Sign in to see if it is open for your email.');
      signInForm(s1.body, ads);
      step(ol, 2, 'todo', 'Put this phone on a license', 'It takes one of your licenses, like a computer');
      step(ol, 3, 'todo', 'Switch it on', p === 'ios' ? 'One small settings profile' : whole(info.android) ? 'One name to paste into the phone\'s settings' : 'One address to paste into Chrome');
      limits(v.body, whole(info.android));
      foot();
      return;
    }
    const v = view('Block ads', { tint: 'mint', back, status: 'Checking...' });
    const [st, mine] = await Promise.all([ask('/v1/phone/dns/state'), ask('/v1/license/devices')]);
    if (!v.body.isConnected) return;
    if (st.status === 401 || mine.status === 401) { signedOut(); return ads(); }
    if (!st.ok || !mine.ok) {
      v.setStatus('Not connected', 'off');
      hero(v.body, 'Blokvane didn\'t answer', why(st.ok ? mine : st), { sleepy: true });
      btn('Try again', { kind: 'go', full: true }, v.body, () => ads());
      foot();
      return;
    }
    const S = st.data, M = mine.data;
    const mineDev = (M.devices || []).find(d => d.this);
    store.set('shield:info', Object.assign(infoNow(), { android: !!S.android }));
    remember(a, M, S);
    const all = whole(S.android);
    const working = !!(S.available && mineDev && S.on && S.blocking && S.working);
    const done = 1 + (S.available && mineDev ? 1 : 0) + (working ? 1 : 0);
    v.setStatus(a.email, working ? 'on' : 'wait');
    const names = Number(S.names || 0).toLocaleString('en-US');
    if (working) head(v.body, 'check', 'Ads are blocked on this phone', 'This phone asked Blokvane ' + ago(S.last_used) + '. ' + names + ' ad and tracking servers are left out.', 'ok');
    else head(v.body, 'shield', 'Block ads on this phone', S.available ? lead(S.android) : QUIET);
    if (!S.available) {
      // (not open for this person: said before anything is taken from a license)
      const ol = el('ol', 'sh-steps', v.body);
      const s1 = step(ol, 1, 'done', 'Signed in', mail(null, a.email));
      btn('Change', { kind: 'ghost' }, s1.hd, () => { location.hash = '#me'; }).classList.add('sh-sm');
      s1.body.hidden = true;
      closedCard(v.body, true, () => ads());
      if (S.on) offCard(v.body);
      foot();
      return;
    }
    progress(v.body, done);
    const ol = el('ol', 'sh-steps', v.body);
    // 1. signed in
    const s1 = step(ol, 1, 'done', 'Signed in', mail(null, a.email));
    btn('Change', { kind: 'ghost' }, s1.hd, () => { location.hash = '#me'; }).classList.add('sh-sm');
    s1.body.hidden = true;
    // 2. this phone on a license
    const total = +M.licenses || 0, any = +M.free || 0;
    // (a newer server also says which licenses include ad blocking on phones: an organization can leave it out. A phone
    // only ever takes one that includes it, and is told so here before anything is used.)
    const knows = typeof M.phone_any === 'boolean', free = knows ? (+M.phone_free || 0) : any, leftOut = knows && total > 0 && !M.phone_any;
    if (mineDev) {
      const s2 = step(ol, 2, 'done', 'This phone is on a license', fromWhere(mineDev));
      s2.body.hidden = true;
    } else {
      const s2 = step(ol, 2, 'now', 'Put this phone on a license', leftOut ? 'Not part of your license' : !total ? 'This email has no license'
        : free ? many(free, 'license') + ' free' : any ? 'None free for a phone' : 'All ' + total + ' in use');
      if (leftOut) {
        el('p', '', s2.body, 'Your organization did not include ad blocking on phones in your license. Ask your administrator to switch it on for you. Nothing was changed on this phone or on your licenses.');
        btn('Check again', { kind: 'ghost', full: true, icon: 'refresh' }, s2.body, () => ads());
        if (!M.has_own) site(s2.body, 'Get a license of your own', '/pricing', 'ghost').style.marginTop = '8px';
      } else if (free > 0) {
        el('p', '', s2.body, 'This phone takes one of your licenses, like a computer does. You can take it off again at any time.');
        btn('Use a license on this phone', { kind: 'go', full: true, icon: 'shield' }, s2.body, () => takeLicense(ads));
      } else if (!total) {
        const t = el('p', '', s2.body);
        t.append('There is no license on '); mail(t, a.email); t.append('. A license covers one device: a computer, a phone or a tablet.');
        site(s2.body, 'See the plans', '/pricing', 'go');
        const r = el('div', 'grid2', s2.body); r.style.marginTop = '8px';
        btn('Check again', { kind: 'ghost' }, r, () => ads()).classList.add('sh-sm');
        btn('Use another email', { kind: 'ghost' }, r, () => signOutSheet(ads, false)).classList.add('sh-sm');
      } else {
        // every license is in use: take a device off, ask for one more, or get one
        el('p', '', s2.body, any ? 'The licenses that include ad blocking on phones are all in use. Take a device off one of them and this phone can use it:'
          : 'Each license covers one device at a time. Take a device off and this phone can use its license:');
        const ls = el('div', 'list sh-devs', s2.body);
        for (const d of (M.devices || [])) deviceRow(ls, d, ads, { plain: true });
        moreLicenses(s2.body, M, ads);
      }
    }
    // 3. switched on, on the phone itself
    const urls = store.get('shield:dns', null);
    const have = urls && typeof urls.token === 'string' && /^[a-f0-9]{32}$/.test(urls.token) && (!urls.email || urls.email === a.email) ? urls : null;
    if (!mineDev) {
      step(ol, 3, 'todo', 'Switch it on', p === 'ios' ? 'One small settings profile' : all ? 'One name to paste into the phone\'s settings' : 'One address to paste into Chrome');
      // (it was on before, and the license went: nothing is blocked now, and the phone's settings still point here)
      if (S.on) {
        const c = el('div', 'card', v.body);
        el('span', 'pill bad', c, 'Not blocking');
        el('h2', '', c, 'Nothing is blocked right now');
        el('p', '', c, 'This phone is not on a license any more. The internet keeps working. Put the phone on a license above to block again, or switch ad blocking off.');
        btn('Switch it off', { kind: 'ghost', full: true }, c, () => offSheet(have));
      }
    } else if (!S.licensed) {
      const s3 = step(ol, 3, 'now', 'Switch it on', 'Not included in your license');
      el('p', '', s3.body, S.why === 'org' ? 'Your organization did not include ad blocking on phones in your license. Ask your administrator to switch it on for you.' : 'This license does not include ad blocking on phones.');
      btn('Check again', { kind: 'ghost', full: true, icon: 'refresh' }, s3.body, () => ads());
      // (this phone holds a license it can do nothing with: one tap gives it back)
      btn('Take this phone off its license', { kind: 'ghost', full: true }, s3.body, () => removeSheet(mineDev, ads)).style.marginTop = '8px';
      if (S.on) btn('Switch it off', { kind: 'ghost', full: true }, s3.body, () => offSheet(have)).style.marginTop = '8px';
    } else if (!S.on) {
      const s3 = step(ol, 3, 'now', 'Switch it on', p === 'ios' ? 'One small settings profile' : all ? 'One name to paste into the phone\'s settings' : 'One address to paste into Chrome');
      el('p', '', s3.body, p === 'ios' ? 'Blokvane makes a small settings profile for this ' + (/iPad/.test(navigator.userAgent) ? 'iPad' : 'iPhone') + '. The next screen shows the four taps to install it.'
        : 'Blokvane makes an address that is only for this phone. The next screen shows where to paste it.');
      btn('Switch on ad blocking', { kind: 'go', full: true, huge: true, icon: 'shield' }, s3.body, () => make());
    } else if (!working) {
      const s3 = step(ol, 3, 'now', 'Finish it on this phone', have ? 'Blokvane has not heard from this phone yet' : 'This phone needs a new address');
      if (have) {
        setup(s3.body, have, S);
        const r = el('div', 'grid2 sh-pair', s3.body); r.style.marginTop = '12px';
        btn('Check now', { kind: 'go', icon: 'refresh' }, r, async () => { if (!(await ads())) toast('Not yet. Do the steps above, then check again.'); });
        btn('Switch it off', { kind: 'ghost' }, r, () => offSheet(have));
        el('p', 'muted small', s3.body, 'It says "Working" here within a minute after the last step.').style.marginTop = '10px';
      } else {
        el('p', '', s3.body, 'This app no longer has this phone\'s address (its storage was cleared). Make a new one and do the steps again: the old one stops working.');
        btn('Make a new address', { kind: 'go', full: true }, s3.body, () => make());
        btn('Switch it off', { kind: 'ghost', full: true }, s3.body, () => offSheet(null)).style.marginTop = '8px';
      }
    } else {
      const s3 = step(ol, 3, 'done', 'Switched on', 'Working: asked Blokvane ' + ago(S.last_used));
      const r = el('div', 'grid2 sh-pair', s3.body);
      btn('Check again', { icon: 'refresh' }, r, () => ads());
      btn('Switch it off', { kind: 'ghost' }, r, () => offSheet(have));
      if (have) { const d = el('details', 'sh-again', s3.body); el('summary', '', d, 'Show the steps again'); setup(d, have, S); }
    }
    limits(v.body, all);
    foot();
    return working;
  }
  async function make() {
    const r = await ask('/v1/phone/dns');
    if (!r.ok) { toast(why(r), 'bad'); buzz('bad'); return ads(); }
    const a = pass.get();
    store.set('shield:dns', { token: r.data.token, doh: r.data.doh, profile: r.data.profile, hostname: r.data.hostname || '', email: a ? a.email : '' });
    buzz('ok');
    ads();
  }
  // the steps for this kind of phone
  function setup(c, u, S) {
    const p = plat();
    const box = el('div', 'sh-setup', c);
    if (p === 'ios' || p === 'desktop' && /Mac/.test(navigator.userAgent)) {
      const a = el('a', 'btn go full huge', box); a.href = u.profile; a.target = '_blank'; a.rel = 'noopener';
      a.appendChild(icon('shield')); el('span', '', a, 'Install the profile');
      steps(box, p === 'ios' ? [
        ['shield', 'Tap "Install the profile"', 'Safari asks whether to allow the download: tap Allow.'],
        ['gear', 'Open the Settings app', 'Tap "Profile Downloaded" near the top. Not there? Tap General, then "VPN & Device Management", then "Blokvane ad blocking".'],
        ['check', 'Tap Install, three times', 'It asks for the phone\'s passcode. "Not Signed" in red is normal for a profile that is not from a company\'s device management.'],
        ['refresh', 'Come back here', 'Tap "Check now".']
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
          ['refresh', 'Come back here', 'Tap "Check now".']
        ]);
        const d = el('details', 'sh-again', box);
        el('summary', '', d, 'Or only in Chrome');
        chromeSteps(d, u);
      } else {
        chromeSteps(box, u);
        el('p', 'muted small', box, 'This covers what you open in Chrome. Blocking in every app on Android is being added.').style.marginTop = '10px';
      }
      return;
    }
    el('p', 'muted small', box, 'Open this page on the phone to set the phone up. On a computer, Blokvane\'s extension blocks far more than this can.');
    chromeSteps(box, u);
  }
  function chromeSteps(box, u) {
    copyBox(box, u.doh, 'This phone\'s address');
    steps(box, [
      ['copy', 'Copy the address above', 'It is this phone\'s own. Don\'t share it.'],
      ['dots', 'Open Chrome\'s settings', 'In the Chrome app, tap the three dots at the top, then Settings, then "Privacy and security".'],
      ['lock', 'Tap "Use secure DNS"', 'Pick "Choose another provider". In the list pick "Custom", then paste the address.'],
      ['refresh', 'Come back here', 'Tap "Check now".']
    ]);
  }
  // how to take it off the phone again
  function offSteps(parent) {
    const p = plat();
    steps(parent, p === 'ios' ? [
      ['gear', 'Open Settings, then General', 'Then "VPN and Device Management".'],
      ['trash', 'Tap "Blokvane ad blocking"', 'Then "Remove Profile".']
    ] : p === 'android' ? [
      ['dots', 'In Chrome: Settings, then "Privacy and security"', 'Tap "Use secure DNS" and pick the first choice again.'],
      ['gear', 'If you used Private DNS', 'Open Settings, then Network and internet, then Private DNS, and pick "Automatic".']
    ] : [
      ['gear', 'Open the browser\'s settings', 'Privacy and security, then "Use secure DNS".'],
      ['check', 'Pick the first choice again', 'Or remove the profile under Profiles on a Mac.']
    ]);
  }
  function offSheet(u) {
    sheet('Switch off ad blocking', (sh, close) => {
      el('p', 'muted', sh, 'Do this on the phone first, so it goes back to its normal lookups:');
      offSteps(sh);
      btn('I did that. Switch it off', { kind: 'bad', full: true }, sh, async () => {
        const r = await ask('/v1/phone/dns/off');
        close();
        if (!r.ok) { toast(why(r), 'bad'); return; }
        store.del('shield:dns'); toast('Switched off.', 'ok'); ads();
      }).style.marginTop = '14px';
      btn('Keep it on', { kind: 'ghost', full: true }, sh, close).style.marginTop = '8px';
    });
  }
  // (it was on, and is not open for this person any more: how to take it off the phone)
  function offCard(parent) {
    const c = el('div', 'card', parent);
    el('h2', '', c, 'This phone still asks Blokvane');
    el('p', '', c, 'Ad blocking was switched on here before. Nothing is blocked now, and the internet keeps working. To put the phone back the way it was:');
    btn('Switch it off', { kind: 'ghost', full: true }, c, () => offSheet(null));
  }
  // what it can and cannot do, said plainly
  function limits(parent, all) {
    const d = el('details', 'sh-limits', parent);
    el('summary', '', d, 'What it blocks, and what it can\'t');
    const ul = el('ul', '', d);
    for (const t of [
      all ? 'It blocks ads and trackers that come from ad and tracking companies\' own servers: in apps, games, news sites and browsers.'
        : 'It blocks ads and trackers that come from ad and tracking companies\' own servers, on the sites you open in Chrome.',
      'It cannot remove the ads inside YouTube, or in other apps that send their ads from the same servers as their videos. For YouTube without ads, watch it on your computer, where Blokvane takes them out.',
      'Where an ad was, an empty space can stay. A sponsored link at the top of search results may not open: use the normal result under it.',
      'This phone\'s lookups go to Blokvane, encrypted. Blokvane answers them and keeps none of them: no list of sites or apps.',
      'If the phone ever has no internet right after a change, switch this off with the steps under "Switch it off". Everything is back at once.'
    ]) el('li', '', ul, t);
  }

  if (kind === 'me') return me();
  return ads();
});
