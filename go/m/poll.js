// Blokvane on your phone: vote in a live poll on a TV screen, or follow "Now serving" (with a buzz when your number
// is close).
(() => {
  const { el, view, btn, toast, buzz, hero, input, store } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('poll', async (kind, parts) => kind === 'q1' ? follow(parts) : vote(parts));
  async function vote(parts) {
    const [s, host] = parts;
    const v = view('Live poll', { tint: 'pink' });
    if (!s) { hero(v.body, 'This code isn\'t complete', 'Scan it again on the screen.', { sleepy: true }); return; }
    const wait = hero(v.body, 'Getting the question...', '');
    // (one vote per phone: this phone keeps its own key for this poll, so a vote can be changed but not doubled)
    const me = await GO.member('poll:' + s.slice(0, 12));
    let poll = null, mine = null;
    const R = await L.room({ secret: s, label: 'bvpoll', me, name: '', role: 'voter', open: true, onMsg: m => { if (m.k === 'poll' && typeof m.q === 'string' && Array.isArray(m.opts) && (!poll || m.id !== poll.id || m.closed !== poll.closed)) { poll = { id: m.id, q: L.clean(m.q, 100), opts: m.opts.slice(0, 6).map(o => L.clean(o, 40)), closed: !!m.closed }; draw(); } } });
    const votes = R.shared('votes', { own: true, onChange: () => draw() });
    let tries = 0;
    const hi = setInterval(() => { if (poll || ++tries > 20) { clearInterval(hi); if (!poll) { wait.querySelector('h1').textContent = 'The poll isn\'t on any screen right now'; wait.querySelector('p').textContent = 'Ask whoever runs it to show it again.'; } return; } R.send({ k: 'poll?' }); }, 1500);
    R.send({ k: 'poll?' }).catch(() => {});
    let list = null;
    function draw() {
      if (!poll) return;
      mine = votes.get(me.id);
      if (!list) { v.body.textContent = ''; el('h1', 'big-title', v.body, poll.q); list = el('div', 'stack', v.body); }
      list.textContent = '';
      const counts = poll.opts.map(() => 0);
      for (const [, val] of votes.entries()) if (Number.isInteger(val) && val >= 0 && val < counts.length) counts[val]++;
      const total = counts.reduce((a, b) => a + b, 0) || 1;
      poll.opts.forEach((o, i) => {
        const b = el('button', 'btn full', list);
        b.type = 'button';
        b.style.cssText += ';justify-content:space-between;min-height:70px;position:relative;overflow:hidden';
        const bar = el('i', '', b); bar.style.cssText = `position:absolute;inset:0 auto 0 0;width:${Math.round(100 * counts[i] / total)}%;background:${mine === i ? 'rgba(255,107,94,.35)' : 'rgba(255,255,255,.06)'};transition:width .5s`;
        const t = el('span', '', b, (mine === i ? '✓ ' : '') + o); t.style.position = 'relative';
        const n = el('span', '', b, mine != null ? Math.round(100 * counts[i] / total) + '%' : ''); n.style.position = 'relative';
        b.onclick = () => { if (poll.closed) { toast('This poll is closed.'); return; } votes.set(me.id, i); buzz('ok'); draw(); };
      });
      el('p', 'muted small center', list, poll.closed ? 'The poll is closed.' : mine != null ? 'You voted. Tap another answer to change it.' : 'Tap your answer. The results move live on the screen.');
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
