// Blokvane on your phone: a web page on a computer asked for a file or a signature. Pick a photo or a file (or sign
// with your finger here), and it goes straight into that page's upload box or signature pad.
(() => {
  const { el, view, btn, toast, buzz, hero } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('pagehelp', async (kind, parts) => {
    const [s, cid] = parts;
    const sign = kind === 'sg1';
    const v = view(sign ? 'Sign with your finger' : 'Upload from your phone', { tint: sign ? 'violet' : 'sky' });
    if (!s || !L.okId(cid)) { hero(v.body, 'This code isn\'t complete', 'Scan it again on the computer.', { sleepy: true }); return; }
    let info = null;
    const R = await L.room({ secret: s, label: 'bvup', me: await C.newMember(), name: GO.deviceName(), role: 'phone', owner: cid, open: false, onPipe: () => {},
      onPeers: () => { const p = R.peer(cid); if (p && p.info && !info) { info = p.info; ready(); } } });
    setTimeout(() => R.send({ k: 'hello' }).catch(() => {}), 1200);
    const wait = hero(v.body, 'Connecting to the computer...', 'Keep this page open.');
    setTimeout(() => { if (!info) ready(); }, 6000);
    function ready() {
      if (ready.done) return; ready.done = true;
      wait.remove();
      if (sign) pad(R, cid, v.body, info || {}); else upload(R, cid, v.body, info || {});
    }
  });
  function upload(R, cid, body, info) {
    hero(body, 'Pick what to put in', info.site ? 'It goes into the upload box on ' + info.site + '.' : 'It goes into the upload box on the computer.');
    const accept = String(info.accept || '');
    const cam = el('input', '', body); cam.type = 'file'; cam.accept = 'image/*'; cam.capture = 'environment'; cam.hidden = true;
    const pics = el('input', '', body); pics.type = 'file'; pics.accept = accept || 'image/*,application/pdf'; pics.hidden = true; pics.multiple = !!info.multiple;
    const files = el('input', '', body); files.type = 'file'; if (accept) files.accept = accept; files.hidden = true; files.multiple = !!info.multiple;
    const g = el('div', 'stack', body);
    btn('Take a photo', { kind: 'go', huge: true, full: true, icon: 'camera' }, g, () => cam.click());
    btn('Pick a photo', { huge: true, full: true, icon: 'photo' }, g, () => pics.click());
    btn('Pick a file', { full: true, icon: 'file' }, g, () => files.click());
    const st = el('p', 'muted center', body); st.style.marginTop = '12px';
    const bar = el('div', 'bar', body); bar.hidden = true; const fill = el('i', '', bar);
    const go = async list => {
      if (!list.length) return;
      try {
        st.textContent = 'Connecting straight to the computer...';
        const P = await R.pipe(cid);
        bar.hidden = false;
        for (const f of list) {
          // (a big photo is made smaller first: upload boxes often take only a few MB)
          let blob = f, name = f.name;
          if (/^image\/(jpeg|png|heic|heif|webp)$/i.test(f.type) && f.size > 4 * 1024 * 1024) { const d = await L.shrink(f, 2400, 0.86); blob = await (await fetch(d)).blob(); name = name.replace(/\.\w+$/, '') + '.jpg'; }
          st.textContent = 'Sending ' + name;
          await P.file(blob, { name, type: blob.type, kind: 'upload' }, (n, size) => { fill.style.width = Math.round(100 * n / Math.max(1, size)) + '%'; });
        }
        buzz('ok'); st.textContent = 'Done! Check the page on the computer.'; bar.hidden = true;
      } catch (e) { st.textContent = 'Couldn\'t connect to the computer. Make sure the QR code is still showing there, and try again.'; }
    };
    for (const i of [cam, pics, files]) i.onchange = () => go([...i.files]);
  }
  // the signature pad: strokes in the shape of the page's own pad, sent as strokes (so the page draws them) and a picture
  function pad(R, cid, body, info) {
    el('p', 'lead center', body, 'Sign in the box with your finger.');
    const w0 = +info.w || 600, h0 = +info.h || 200;
    const ratio = Math.max(1.6, Math.min(5, w0 / h0));
    const wrap = el('div', '', body);
    wrap.style.cssText = `position:relative;width:100%;aspect-ratio:${ratio};background:#fff;border-radius:20px;overflow:hidden;touch-action:none;box-shadow:inset 0 0 0 2px #2a3446`;
    const cv = el('canvas', '', wrap); cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none';
    const line = el('div', '', wrap); line.style.cssText = 'position:absolute;left:8%;right:8%;bottom:24%;border-bottom:2px dashed #c8ceda;pointer-events:none';
    const x = el('span', '', wrap, '✕'); x.style.cssText = 'position:absolute;left:5%;bottom:26%;color:#9ca8bb;font:700 22px system-ui;pointer-events:none';
    const g = cv.getContext('2d');
    let strokes = [], cur = null, dpr = Math.min(3, devicePixelRatio || 1);
    const size = () => { const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; redraw(); };
    const redraw = () => { g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.strokeStyle = '#111827'; g.lineWidth = 3.2; g.lineCap = 'round'; g.lineJoin = 'round'; const r = cv.getBoundingClientRect(); for (const s of strokes) { g.beginPath(); s.forEach(([a, b], i) => { if (i) g.lineTo(a * r.width, b * r.height); else g.moveTo(a * r.width, b * r.height); }); g.stroke(); } };
    const at = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); cur = [at(e)]; strokes.push(cur); redraw(); });
    cv.addEventListener('pointermove', e => { if (!cur) return; cur.push(at(e)); redraw(); });
    const end = () => { cur = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    requestAnimationFrame(size);
    addEventListener('resize', size);
    const row = el('div', 'grid2', body); row.style.marginTop = '14px';
    btn('Start over', { icon: 'refresh' }, row, () => { strokes = []; redraw(); });
    btn('Done', { kind: 'go', icon: 'check' }, row, async () => {
      if (!strokes.length) { toast('Sign in the box first.'); return; }
      // the strokes in the page pad's own size, and a picture (for pages with an upload box instead)
      const pts = strokes.map(s => s.filter((p, i) => i % 2 === 0 || i === s.length - 1).map(([a, b]) => [Math.round(a * w0 * 10) / 10, Math.round(b * h0 * 10) / 10]));
      const out = document.createElement('canvas'); out.width = w0; out.height = h0;
      const o = out.getContext('2d'); o.strokeStyle = '#111827'; o.lineWidth = Math.max(2, w0 / 200); o.lineCap = 'round'; o.lineJoin = 'round';
      for (const s of pts) { o.beginPath(); s.forEach(([a, b], i) => { if (i) o.lineTo(a, b); else o.moveTo(a, b); }); o.stroke(); }
      const png = out.toDataURL('image/png');
      await R.send({ k: 'strokes', s: pts, w: w0, h: h0, png: png.length < 300000 ? png : '' });
      buzz('ok');
      body.textContent = '';
      hero(body, 'Signed!', 'Your signature is on the page on the computer. Check it there before you send the form.');
    });
  }
})();
