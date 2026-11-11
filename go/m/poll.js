// Blokvane on your phone: vote in a live poll on a TV screen (one vote per phone), or follow "Now serving" (with a buzz
// when your number is close).
(() => {
  const { el, view, btn, toast, buzz, hero, input, store } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('poll', async (kind, parts) => kind === 'q1' ? follow(parts) : vote(parts));
  // One vote per phone. The phone keeps its own key for this poll's room (the same one every time it opens), signs its
  // vote with it, and the screens count one vote for each key: the first one, which can't be changed. The phone shows
  // the results once it voted. (A screen with an older Blokvane counts votes in a shared list: the phone uses that
  // there, and still votes only once.)
  let styled = false;
  function css() {
    if (styled) return;
    styled = true;
    const st = document.createElement('style');
    st.textContent = `
      .pv-chip { display: inline-block; padding: 6px 12px; border-radius: 99px; background: rgba(255,122,200,.14); color: var(--pink); font: 700 13px var(--round); margin: 0 0 14px; }
      .pv-opt { position: relative; display: flex; align-items: center; width: 100%; min-height: 64px; padding: 12px 16px; border: 2px solid var(--line); border-radius: 20px; background: var(--raise2); color: var(--text); font: 650 18px/1.2 var(--round); text-align: left; cursor: pointer; }
      .pv-opt + .pv-opt { margin-top: 10px; }
      .pv-opt .dot { flex: none; width: 26px; height: 26px; margin-right: 12px; border-radius: 50%; border: 2px solid var(--dim); position: relative; }
      .pv-opt[aria-pressed="true"] { border-color: var(--pink); background: rgba(255,122,200,.12); }
      .pv-opt[aria-pressed="true"] .dot { border-color: var(--pink); background: var(--pink); }
      .pv-opt[aria-pressed="true"] .dot:after { content: ""; position: absolute; left: 7px; top: 4px; width: 6px; height: 11px; border: solid #fff; border-width: 0 3px 3px 0; transform: rotate(45deg); }
      .pv-res { position: relative; display: flex; align-items: center; justify-content: space-between; min-height: 58px; padding: 10px 16px; border-radius: 18px; background: var(--raise2); overflow: hidden; font: 650 17px/1.2 var(--round); }
      .pv-res + .pv-res { margin-top: 10px; }
      .pv-res i { position: absolute; top: 0; bottom: 0; left: 0; width: 0; background: rgba(255,255,255,.08); transition: width .6s cubic-bezier(.2,.9,.3,1); }
      .pv-res.mine i { background: linear-gradient(90deg, rgba(255,122,200,.5), rgba(255,107,94,.38)); }
      .pv-res span, .pv-res b { position: relative; }
      .pv-res .you { display: inline-block; margin-left: 8px; padding: 3px 8px; border-radius: 99px; background: var(--pink); color: #2a0b1f; font: 800 12px var(--round); vertical-align: 2px; }
      .pv-note { display: flex; align-items: center; padding: 14px 16px; border-radius: 20px; margin: 0 0 14px; font: 650 16px/1.35 var(--round); }
      .pv-note .ic { flex: none; width: 34px; height: 34px; margin-right: 12px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; }
      .pv-note.ok { background: rgba(54,214,165,.14); }
      .pv-note.ok .ic { background: var(--mint); color: #08261d; }
      .pv-note.wait { background: rgba(255,196,81,.13); }
      .pv-note.wait .ic { background: var(--sun); color: #2b1d00; }
      .pv-note.off { background: var(--raise); color: var(--dim); }
      .pv-note.off .ic { background: var(--line); color: var(--text); }
      .pv-send { margin-top: 16px; }`;
    document.head.appendChild(st);
  }
  async function vote(parts) {
    const [s] = parts;
    const v = view('Live poll', { tint: 'pink' });
    if (!s) { hero(v.body, 'This code isn\'t complete', 'Scan it again on the screen.', { sleepy: true }); return; }
    css();
    const wait = hero(v.body, 'Getting the question...', 'One moment while this phone finds the screen.');
    const me = await GO.member('poll:' + s.slice(0, 12));
    const pk = C.b64url(me.pk), te = new TextEncoder();
    // poll: what the screen asks; mine: this phone's vote in it ({ v, at, sig, ok }, kept on the phone);
    // counts: the totals the screens say
    let poll = null, mine = null, counts = null, pick = -1, retryT = 0, tries = 0, votes = null;
    let built = false, head, chip, note, list, send;
    const keyOf = () => 'pollv:' + poll.id + ':' + poll.round;
    const fit = arr => poll.opts.map((_, i) => Math.max(0, Math.min(1e6, Math.floor(+(arr || [])[i] || 0))));
    const R = await L.room({ secret: s, label: 'bvpoll', me, name: '', role: 'voter', open: true, onMsg: m => {
      if (m.k === 'poll' && typeof m.q === 'string' && Array.isArray(m.opts) && m.opts.length >= 2) { if (votes) takePoll(m); return; }
      if (!poll || poll.old || !votes || m.id !== poll.id || +m.round !== poll.round) return;
      if (m.k === 'counts' && Array.isArray(m.counts)) { counts = fit(m.counts); draw(); }
      if (m.k === 'voted') {
        if (Array.isArray(m.counts)) counts = fit(m.counts);
        if (m.closed) poll.closed = true;
        // (the screen has this phone's vote: maybe one from before, and the first one is the one that counts)
        if (Number.isInteger(m.v) && m.v >= 0 && m.v < poll.opts.length) {
          const fresh = !mine || !mine.ok;
          mine = Object.assign(mine || { at: 0, sig: '' }, { v: m.v, ok: true });
          store.set(keyOf(), mine);
          clearTimeout(retryT);
          if (fresh && tries) { buzz('ok'); GO.confetti(); }
        }
        draw();
      }
    } });
    // (a screen with an older Blokvane)
    votes = R.shared('votes', { own: true, onChange: () => { if (poll && poll.old) draw(); } });
    // the screen's poll: the first one, a newer round of it (it started over), or the next day's
    function takePoll(m) {
      const next = { id: String(m.id || '').slice(0, 40), q: L.clean(m.q, 100), opts: m.opts.slice(0, 6).map(o => L.clean(String(o), 40)), closed: !!m.closed, round: Number.isInteger(m.round) ? m.round : 0, old: !('round' in m) };
      if (poll && poll.id === next.id && poll.round === next.round) {
        if (next.closed && !poll.closed) poll.closed = true;
        if (Array.isArray(m.counts) && !poll.old) counts = fit(m.counts);
        if (Number.isInteger(m.mine) && m.mine >= 0 && m.mine < poll.opts.length && !(mine && mine.ok)) { mine = Object.assign(mine || { at: 0, sig: '' }, { v: m.mine, ok: true }); store.set(keyOf(), mine); }
        draw();
        return;
      }
      // (an older round, or an older day, from a screen that hasn't caught up: the newer one stays)
      const base = x => x.split('-')[0];
      if (poll && base(poll.id) === base(next.id) && (next.id < poll.id || (next.id === poll.id && next.round < poll.round))) return;
      const had = poll && mine;
      poll = next;
      counts = Array.isArray(m.counts) && !poll.old ? fit(m.counts) : null;
      pick = -1; tries = 0;
      clearTimeout(retryT);
      const kept = poll.old ? null : store.get(keyOf(), null);
      mine = kept && Number.isInteger(kept.v) && kept.v >= 0 && kept.v < poll.opts.length ? kept : null;
      if (Number.isInteger(m.mine) && m.mine >= 0 && m.mine < poll.opts.length) { mine = Object.assign(mine || { at: 0, sig: '' }, { v: m.mine, ok: true }); store.set(keyOf(), mine); }
      if (had && !mine && !poll.closed) toast('New votes started. You can vote again.', 'ok');
      built = false;
      draw();
      // (a vote that didn't reach a screen before: it goes again)
      if (mine && !mine.ok && mine.sig) sendVote();
    }
    // asking until a screen answers (the relays may take a moment)
    let asks = 0;
    const hi = setInterval(() => {
      if (poll) { clearInterval(hi); return; }
      if (++asks > 20) { clearInterval(hi); wait.querySelector('h1').textContent = 'The poll isn\'t on any screen right now'; wait.querySelector('p').textContent = 'Ask whoever runs it to show it again, then scan the code again.'; return; }
      R.send({ k: 'poll?' }).catch(() => {});
    }, 1500);
    R.send({ k: 'poll?' }).catch(() => {});

    async function sendMine() {
      if (!poll || poll.closed || pick < 0 || mine) return;
      if (poll.old) { votes.set(me.id, pick); buzz('ok'); GO.confetti(); draw(); return; }
      const at = Date.now(), vv = pick;
      const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, me.priv, te.encode('bvpoll1|' + poll.id + '|' + poll.round + '|' + vv + '|' + at)));
      mine = { v: vv, at, sig: C.b64url(sig), ok: false };
      store.set(keyOf(), mine);
      buzz('tap');
      sendVote();
    }
    function sendVote() {
      clearTimeout(retryT);
      if (!poll || !mine || mine.ok || !mine.sig || poll.old) return;
      // (t: when it was signed; the room puts its own "at" on every message)
      R.send({ k: 'vote', id: poll.id, round: poll.round, v: mine.v, t: mine.at, pk, sig: mine.sig }).catch(() => {});
      tries++;
      // (no screen answered yet: again in a few seconds, as long as this page is open)
      retryT = setTimeout(sendVote, tries < 4 ? 2500 : 8000);
      draw();
    }

    function draw() {
      if (!poll) return;
      if (!built) {
        built = true;
        v.body.textContent = '';
        head = el('h1', 'big-title', v.body);
        chip = el('div', 'pv-chip', v.body, 'One vote per phone');
        note = el('div', 'pv-note', v.body);
        list = el('div', '', v.body);
        send = btn('Send my vote', { kind: 'go', full: true, huge: true }, v.body, () => sendMine());
        send.classList.add('pv-send');
      }
      head.textContent = poll.q;
      const myVote = poll.old ? (Number.isInteger(votes.get(me.id)) ? votes.get(me.id) : null) : mine ? mine.v : null;
      const cs = poll.old ? (() => { const c = poll.opts.map(() => 0); for (const [, val] of votes.entries()) if (Number.isInteger(val) && val >= 0 && val < c.length) c[val]++; return c; })() : counts || poll.opts.map((_, i) => (myVote === i ? 1 : 0));
      const total = cs.reduce((x, y) => x + y, 0);
      list.textContent = '';
      // before voting: the answers to tap; after: the results, with this phone's vote marked
      if (myVote == null && !poll.closed) {
        poll.opts.forEach((o, i) => {
          const b = el('button', 'pv-opt', list);
          b.type = 'button';
          b.setAttribute('aria-pressed', String(pick === i));
          el('span', 'dot', b);
          el('span', '', b, o);
          b.onclick = () => { pick = i; buzz('tap'); draw(); };
        });
      } else {
        poll.opts.forEach((o, i) => {
          const r = el('div', 'pv-res' + (myVote === i ? ' mine' : ''), list);
          const bar = el('i', '', r);
          const t = el('span', '', r, o);
          if (myVote === i) el('span', 'you', t, 'Your vote');
          el('b', '', r, total ? Math.round(100 * cs[i] / total) + '%' : '0%');
          requestAnimationFrame(() => { bar.style.width = (total ? Math.round(100 * cs[i] / total) : 0) + '%'; });
        });
      }
      send.hidden = myVote != null || poll.closed || pick < 0;
      if (!send.hidden) send.querySelector('span').textContent = 'Send my vote: ' + poll.opts[pick];
      const n = (cls, ic, text) => { note.className = 'pv-note ' + cls; note.textContent = ''; el('span', 'ic', note, ic); el('span', '', note, text); note.hidden = false; };
      chip.hidden = myVote != null || poll.closed;
      if (poll.closed) n('off', '■', myVote != null ? `The poll is closed. Your vote for ${poll.opts[myVote]} counted.` : 'This poll is closed. Here are the results.');
      else if (myVote != null && !poll.old && mine && !mine.ok) n('wait', '…', tries > 3 ? 'Still sending your vote. Keep this page open, and make sure the screen with the poll is on.' : 'Sending your vote...');
      else if (myVote != null) n('ok', '✓', `Thanks! Your vote is in. ${total} vote${total === 1 ? '' : 's'} so far: the results move live on the screen.`);
      else if (pick >= 0) note.hidden = true;
      else n('off', '?', 'Tap your answer, then tap Send. You can vote once, so pick carefully.');
    }
  }
  // "Now serving": the number, live, and a buzz when yours is close
  async function follow(parts) {
    const [s, cid] = parts;
    const v = view('Now serving', { tint: 'teal' });
    if (!s || !L.okId(cid)) { hero(v.body, 'This code isn\'t complete', 'Scan it again.', { sleepy: true }); return; }
    const box = el('div', 'card center', v.body);
    const label = el('p', 'lead', box, 'Now serving');
    const num = el('div', 'code', box, '...'); num.style.fontSize = '84px';
    const next = el('p', 'muted', box, '');
    const mine = el('div', 'card', v.body);
    el('h2', '', mine, 'Your number');
    el('p', '', mine, 'Type the number on your ticket, and this phone buzzes when you\'re nearly up (keep this page open).');
    const my = input({ placeholder: 'For example A042', max: 8 });
    my.value = store.get('qmine:' + s.slice(0, 10), '');
    mine.appendChild(my);
    my.oninput = () => store.set('qmine:' + s.slice(0, 10), my.value);
    let names = [], last = -1, which = '';
    const R = await L.room({ secret: s, label: 'bvqueue', me: await C.newMember(), name: '', role: 'customer', owner: cid, open: false, onMsg: m => {
      if (m.f !== cid || m.k !== 'q' || !m.q) return;
      if (Array.isArray(m.names)) names = m.names;
      const n0 = which || Object.keys(m.q)[0];
      if (!which) which = n0;
      const q = m.q[which];
      if (!q) return;
      const info = names.find(x => x.name === which) || { prefix: '', digits: 3, start: 0 };
      const fmt = n => (info.prefix || '') + String((info.start || 0) + n).padStart(Math.max(1, info.digits || 3), '0');
      if (info.label) label.textContent = info.label;
      num.textContent = fmt(q.n);
      next.textContent = 'Next: ' + fmt(q.n + 1) + ', ' + fmt(q.n + 2);
      if (q.n !== last && last >= 0) num.animate([{ transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'ease-out' });
      last = q.n;
      // is it you?
      const want = parseInt(String(my.value).replace(/\D/g, ''), 10);
      if (want >= 0 && !isNaN(want)) {
        const cur = (info.start || 0) + q.n;
        if (cur === want) { buzz('long'); toast('It\'s your turn!', 'ok'); }
        else if (want - cur > 0 && want - cur <= 2) { buzz('ok'); toast(`Almost: ${want - cur} to go.`, 'ok'); }
      }
    } });
    void R;
  }
})();
