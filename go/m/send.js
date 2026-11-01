// Blokvane on your phone: sending (photos, files, links and words, both ways, straight between this phone and your
// computer), the shared clipboard, and "Continue on another device".
(() => {
  const { el, icon, view, btn, toast, buzz, sheet, input } = GO;
  const got = [];   // what came from the computer while this page is open: { kind, name, url, blob, text, at }
  GO.def('send', {
    open(id, pc, back) { return id === 'clip' ? clip(pc, back) : send(pc, back); },
    // the computer sent something
    incoming(pc, d) {
      if (!d) return;
      buzz('ok');
      got.unshift({ kind: d.kind, url: d.url, title: d.title, text: d.text, at: Date.now() });
      if (d.kind === 'link') { const u = GO.webUrl(d.url); card('Link from ' + pc.name, d.title || d.url, u ? [['Open', () => { location.href = u; }], ['Copy', () => copy(u)]] : [['Copy', () => copy(String(d.url || ''))]]); }
      else card('Words from ' + pc.name, String(d.text || '').slice(0, 300), [['Copy', () => copy(d.text || '')]]);
    },
    continueCard(pc, d) {
      buzz('ok');
      let url = d.url;
      // (the same spot on the page: a link that scrolls to the words that were at the top)
      if (d.words && !/#/.test(url) && d.words.split(' ').length >= 3) url += '#:~:text=' + encodeURIComponent(d.words);
      url = GO.webUrl(url);
      if (!url) return;
      card('Continue from ' + pc.name, (d.title || d.url) + (d.t > 3 ? ` (at ${Math.floor(d.t / 60)}:${String(Math.floor(d.t % 60)).padStart(2, '0')})` : ''), [['Open it here', () => { location.href = url; }]]);
    },
    clipCard(pc, d) { card('Copied on ' + pc.name, String(d.text || '').slice(0, 300), [['Copy here', () => copy(d.text || '')]]); },
    // a straight connection from the computer: a file
    pipeIn(pc, P) {
      let note = null;
      P.onProgress = (gotN, size, meta) => { if (!note) note = progressCard('Getting ' + ((meta && meta.name) || 'a file') + ' from ' + pc.name); note.set(gotN / Math.max(1, size)); };
      P.onFile = f => {
        if (note) note.close();
        note = null;
        if (f.meta.kind === 'kv') { GO.need('family').then(F => F.kvStore(pc, f.blob)); return; }
        buzz('ok');
        const item = { kind: 'file', name: f.meta.name || 'file', blob: f.blob, at: Date.now() };
        got.unshift(item);
        fileCard(pc, item);
      };
    }
  });
  async function copy(text) { try { await navigator.clipboard.writeText(text); toast('Copied.', 'ok'); } catch (e) { sheet('Copy this', sh => { const t = el('textarea', 'input', sh); t.value = text; t.readOnly = true; setTimeout(() => t.select(), 50); el('p', 'muted small', sh, 'Press and hold, then Copy.'); }); } }
  // a card at the bottom that says what came in
  function card(title, text, actions) {
    sheet(title, (sh, close) => {
      el('p', 'lead', sh, text);
      const row = el('div', 'stack', sh);
      for (const [name, fn] of actions) btn(name, { kind: row.children.length ? '' : 'go', full: true }, row, () => { fn(); close(); });
      btn('Close', { kind: 'ghost', full: true }, row, close);
    });
  }
  function progressCard(title) {
    let close = () => {};
    let fill = null;
    sheet(title, (sh, c) => { close = c; const b = el('div', 'bar', sh); fill = el('i', '', b); }, { dismiss: false });
    return { set: k => { if (fill) fill.style.width = Math.round(k * 100) + '%'; }, close: () => close() };
  }
  function fileCard(pc, item) {
    sheet(item.name, (sh, close) => {
      const url = URL.createObjectURL(GO.safeBlob(item.blob));
      if (/^image\//.test(item.blob.type)) { const im = el('img', 'photo', sh); im.src = url; im.alt = ''; el('p', 'muted small center', sh, 'Press and hold the picture to save it to your photos.'); }
      else el('p', 'lead', sh, `${BVLIVE.sizeText(item.blob.size)} from ${pc.name}`);
      const row = el('div', 'stack', sh); row.style.marginTop = '12px';
      const a = el('a', 'btn go full', row, 'Save'); a.href = url; a.download = item.name;
      if (navigator.canShare) {
        const file = new File([item.blob], item.name, { type: item.blob.type });
        if (navigator.canShare({ files: [file] })) btn('Share or save to Files', { full: true }, row, () => navigator.share({ files: [file] }).catch(() => {}));
      }
      btn('Close', { kind: 'ghost', full: true }, row, close);
    });
  }

  // ---------- Send ----------
  function send(pc, back) {
    const v = view('Send', { back, tint: 'sky', live: true });
    const c = el('div', 'card', v.body);
    el('h2', '', c, 'To ' + pc.name);
    el('p', '', c, 'Photos, videos and files go straight to your computer. Nothing is uploaded anywhere.');
    const pick = el('input', '', c); pick.type = 'file'; pick.multiple = true; pick.hidden = true;
    const photos = el('input', '', c); photos.type = 'file'; photos.accept = 'image/*,video/*'; photos.multiple = true; photos.hidden = true;
    const row = el('div', 'grid2', c);
    btn('Photos', { kind: 'go', icon: 'photo', huge: true }, row, () => photos.click());
    btn('Files', { icon: 'file', huge: true }, row, () => pick.click());
    const st = el('p', 'muted small', c); st.style.marginTop = '10px';
    const bar = el('div', 'bar', c); bar.hidden = true; const fill = el('i', '', bar);
    const go = async files => {
      if (!files.length) return;
      await pc.ready;
      bar.hidden = false;
      try {
        st.textContent = 'Connecting straight to your computer...';
        const P = await pc.room.pipe(pc.cid);
        let i = 0;
        for (const f of files) {
          i++;
          st.textContent = files.length > 1 ? `Sending ${i} of ${files.length}: ${f.name}` : 'Sending ' + f.name;
          await P.file(f, { name: f.name, type: f.type }, (n, size) => { fill.style.width = Math.round(100 * n / Math.max(1, size)) + '%'; });
        }
        buzz('ok');
        st.textContent = files.length > 1 ? `Sent ${files.length} files.` : 'Sent.';
        toast('On your computer now.', 'ok');
      } catch (e) {
        st.textContent = /closed|timeout|failed|lost/.test(e.message) ? 'Couldn\'t connect straight to your computer. Try again, or on the same Wi-Fi.' : e.message;
      }
      setTimeout(() => { bar.hidden = true; fill.style.width = '0'; }, 1500);
    };
    pick.onchange = () => { go([...pick.files]); pick.value = ''; };
    photos.onchange = () => { go([...photos.files]); photos.value = ''; };
    // links and words
    const l = el('div', 'card', v.body);
    el('h2', '', l, 'A link or some words');
    const t = input({ multi: true, placeholder: 'Paste a link, an address, a note...', max: 20000 });
    l.appendChild(t);
    const r2 = el('div', 'grid2', l); r2.style.marginTop = '10px';
    btn('Paste', { icon: 'clip' }, r2, async () => { try { t.value = await navigator.clipboard.readText(); } catch (e) { toast('Press and hold in the box, then Paste.'); } });
    btn('Send', { kind: 'go', icon: 'send' }, r2, async () => {
      const x = t.value.trim();
      if (!x) { t.focus(); return; }
      if (/^https?:\/\/\S+$/.test(x)) { const r = await pc.ask('open', { url: x }); toast(r.opened ? 'Opened on your computer.' : 'Sent. It\'s waiting on your computer.', 'ok'); }
      else { await pc.ask('text', { text: x }); toast('Sent.', 'ok'); }
      buzz('ok'); t.value = '';
    });
    // the other way
    const h = el('div', 'card', v.body);
    el('h2', '', h, 'What\'s open on the computer');
    el('p', '', h, 'Carry on here with the page or video that\'s open on your computer.');
    btn('Get it', { full: true, icon: 'phone' }, h, async () => { const d = await pc.ask('here', {}); GO.need('send').then(S => S.continueCard(pc, d)); });
    const k = el('div', 'card', v.body);
    el('h2', '', k, 'From the computer');
    if (!got.length) el('p', '', k, 'In Chrome on your computer, right-click a link, a picture or a page and pick "Send to my phone". It shows up here while this page is open.');
    for (const g of got.slice(0, 10)) {
      const it = el('div', 'item', k);
      it.appendChild(icon(g.kind === 'file' ? 'file' : g.kind === 'link' ? 'link' : 'clip'));
      const tt = el('div', 't', it);
      el('b', '', tt, g.name || g.title || g.url || String(g.text || '').slice(0, 60));
      el('small', '', tt, new Date(g.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      it.onclick = () => { if (g.kind === 'file') fileCard(pc, g); else if (g.kind === 'link') { const u = GO.webUrl(g.url); if (u) location.href = u; else copy(String(g.url || '')); } else copy(g.text || ''); };
    }
  }

  // ---------- the clipboard ----------
  function clip(pc, back) {
    const v = view('Clipboard', { back, tint: 'mint', live: true });
    const a = el('div', 'card', v.body);
    el('h2', '', a, 'Copied on ' + pc.name);
    const shown = el('p', 'lead', a, 'Tap below to get what you copied there.');
    const r1 = el('div', 'grid2', a);
    let last = '';
    btn('Get it', { kind: 'go', icon: 'refresh' }, r1, async () => {
      const r = await pc.ask('clip', { op: 'get' });
      if (!r.text) { shown.textContent = r.why || 'Nothing copied yet.'; return; }
      last = r.text;
      shown.textContent = r.text.length > 400 ? r.text.slice(0, 400) + '...' : r.text;
      buzz('ok');
    });
    btn('Copy here', { icon: 'copy' }, r1, () => last ? copy(last) : toast('Get it first.'));
    const b = el('div', 'card', v.body);
    el('h2', '', b, 'Copy to ' + pc.name);
    const t = input({ multi: true, placeholder: 'Paste or type here', max: 20000 });
    b.appendChild(t);
    const r2 = el('div', 'grid2', b); r2.style.marginTop = '10px';
    btn('Paste', { icon: 'clip' }, r2, async () => { try { t.value = await navigator.clipboard.readText(); } catch (e) { toast('Press and hold in the box, then Paste.'); } });
    btn('Copy there', { kind: 'go', icon: 'send' }, r2, async () => {
      if (!t.value) { t.focus(); return; }
      const r = await pc.ask('clip', { op: 'set', text: t.value });
      buzz('ok');
      toast(r.copied ? 'Copied on your computer: paste it there.' : 'Sent. It\'s in Blokvane Connect on the computer (turn on the clipboard there to copy right away).', 'ok');
    });
  }
})();
