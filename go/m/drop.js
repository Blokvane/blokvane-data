// Blokvane on your phone: Blokvane Drop by QR code (files from a computer or another phone, or to one), and moving
// Blokvane to a new computer (this phone tells your old computer where the new one is).
(() => {
  const { el, view, btn, toast, buzz, hero, sheet } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('drop', async (kind, parts) => {
    if (kind === 'mv1') return move(parts);
    const [s, host, mode] = parts;
    if (!s || !L.okId(host)) { const v = view('Blokvane Drop'); hero(v.body, 'This code isn\'t complete', 'Scan it again.', { sleepy: true }); return; }
    return mode === 'r' ? giveFiles(s, host) : takeFiles(s, host);
  });
  async function roomFor(s, host, role, onMsg) {
    const R = await L.room({ secret: s, label: 'bvdrop', me: await C.newMember(), name: GO.deviceName(), role, owner: host, open: true, onMsg, onPipe: () => {} });
    return R;
  }
  // files offered by the computer (or phone) that showed the code
  async function takeFiles(s, host) {
    const v = view('Files for you', { tint: 'sky' });
    const h = hero(v.body, 'Getting the list...', 'Keep this page open.');
    const list = el('div', 'list', v.body);
    let R = null, files = null, from = '';
    R = await roomFor(s, host, 'phone', m => {
      if (m.f !== host) return;
      if (m.k === 'd-files' && Array.isArray(m.list) && !files) { files = m.list.slice(0, 40); from = L.clean(m.from, 40); draw(); }
    });
    R.onPipe = P => {
      let bar = null;
      P.onProgress = (got, size) => { if (!bar) { bar = el('div', 'bar', v.body); bar.appendChild(el('i')); } bar.firstChild.style.width = Math.round(100 * got / Math.max(1, size)) + '%'; };
      P.onFile = f => { if (bar) bar.remove(); bar = null; buzz('ok'); save(f.blob, f.meta.name || 'file'); };
    };
    let tries = 0;
    const hi = setInterval(() => { if (files || ++tries > 20) { clearInterval(hi); if (!files) { h.querySelector('h1').textContent = 'The files aren\'t there any more'; h.querySelector('p').textContent = 'Ask for a new code: the page that shared them was closed.'; } return; } R.send({ k: 'd-hi' }); }, 1500);
    R.send({ k: 'd-hi' }).catch(() => {});
    function draw() {
      h.querySelector('h1').textContent = `${files.length} file${files.length > 1 ? 's' : ''} from ${from || 'a computer'}`;
      h.querySelector('p').textContent = 'Tap one to get it. It comes straight from there, not through the internet\'s cloud.';
      for (const f of files) {
        const it = el('button', 'item', list); it.type = 'button'; it.style.border = '0'; it.style.textAlign = 'start';
        it.appendChild(GO.icon(/^image\//.test(f.type) ? 'photo' : 'file'));
        const t = el('span', 't', it); el('b', '', t, f.name); el('small', '', t, L.sizeText(f.size || 0));
        it.onclick = () => { R.send({ k: 'd-get', i: f.i }); toast('Getting ' + f.name + '...'); };
      }
      if (files.length > 1) btn('Get them all', { kind: 'go', full: true }, v.body, async () => { for (const f of files) { await R.send({ k: 'd-get', i: f.i }); await new Promise(r => setTimeout(r, 600)); } }).style.marginTop = '12px';
    }
  }
  function save(blob, name) {
    const url = URL.createObjectURL(GO.safeBlob(blob));
    sheet(name, (sh, close) => {
      if (/^image\//.test(blob.type)) { const im = el('img', 'photo', sh); im.src = url; im.alt = ''; el('p', 'muted small center', sh, 'Press and hold the picture to save it to your photos.'); }
      const a = el('a', 'btn go full', sh, 'Save'); a.href = url; a.download = name; a.style.marginTop = '10px';
      if (navigator.canShare) { const file = new File([blob], name, { type: blob.type }); if (navigator.canShare({ files: [file] })) btn('Share or save to Files', { full: true }, sh, () => navigator.share({ files: [file] }).catch(() => {})).style.marginTop = '8px'; }
      btn('Close', { kind: 'ghost', full: true }, sh, close).style.marginTop = '8px';
    });
  }
  // the computer that showed the code wants files from this phone
  async function giveFiles(s, host) {
    const v = view('Send files', { tint: 'sky' });
    hero(v.body, 'Pick what to send', 'It goes straight to the computer that showed the code.');
    const pick = el('input', '', v.body); pick.type = 'file'; pick.multiple = true; pick.hidden = true;
    const photos = el('input', '', v.body); photos.type = 'file'; photos.accept = 'image/*,video/*'; photos.multiple = true; photos.hidden = true;
    const row = el('div', 'grid2', v.body);
    btn('Photos', { kind: 'go', huge: true, icon: 'photo' }, row, () => photos.click());
    btn('Files', { huge: true, icon: 'file' }, row, () => pick.click());
    const st = el('p', 'muted center', v.body); st.style.marginTop = '12px';
    const bar = el('div', 'bar', v.body); bar.hidden = true; const fill = el('i', '', bar);
    const R = await roomFor(s, host, 'phone', () => {});
    const go = async files => {
      if (!files.length) return;
      st.textContent = 'Connecting...';
      try {
        const P = await R.pipe(host);
        bar.hidden = false;
        let i = 0;
        for (const f of files) { i++; st.textContent = `Sending ${i} of ${files.length}`; await P.file(f, { name: f.name, type: f.type }, (n, size) => { fill.style.width = Math.round(100 * n / Math.max(1, size)) + '%'; }); }
        buzz('ok'); st.textContent = 'Sent!';
      } catch (e) { st.textContent = 'Couldn\'t connect straight to that computer. Make sure its page is still open, and try again.'; }
    };
    pick.onchange = () => go([...pick.files]);
    photos.onchange = () => go([...photos.files]);
  }
  // moving to a new computer: this phone scanned the new computer's code
  async function move(parts) {
    const [s, newId] = parts;
    const v = view('Move to a new computer', { tint: 'violet' });
    const pairs = GO.pairs();
    if (!s || !L.okId(newId)) { hero(v.body, 'This code isn\'t complete', 'Scan it again on the new computer.', { sleepy: true }); return; }
    if (!pairs.length) { hero(v.body, 'This phone isn\'t connected to your old computer', 'On the old computer, open Blokvane, then Connect, then Your computers, then "Send to a new computer", and type the code the new computer shows.', { sleepy: true }); return; }
    hero(v.body, 'Which is your old computer?', 'Everything Blokvane has there copies straight to the new one.');
    for (const p of pairs) {
      btn(p.name, { full: true, huge: true, icon: 'laptop' }, v.body, async () => {
        const pc = GO.computer(p);
        await pc.ask('moveTo', { s }, { timeout: 15000 });
        buzz('ok');
        v.body.textContent = '';
        hero(v.body, 'Look at your old computer', 'Blokvane opened there: it copies everything to the new computer now. Keep both on until it says it\'s done.');
      }).style.marginBottom = '10px';
    }
  }
})();
