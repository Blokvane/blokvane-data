// Blokvane: the shared whiteboard. Everyone with the link draws on the same board (phones, computers, and the TV
// that shows it on a slide). Each stroke is one entry on a shared list, so a board that comes in late gets them all.
(() => {
  const { el, view, btn, toast, hero } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('board', async (kind, parts) => {
    const [s] = parts;
    const v = view('Whiteboard', { tint: 'teal' });
    if (!s) { hero(v.body, 'This link isn\'t complete', 'Scan it again.', { sleepy: true }); return; }
    const me = await GO.member('wb:' + s.slice(0, 10));
    const R = await L.room({ secret: s, label: 'bvwb', me, name: GO.deviceName(), role: 'drawer', open: true });
    const strokes = R.shared('strokes', { max: 3000, onChange: () => redraw() });
    const wrap = el('div', '', v.body);
    wrap.style.cssText = 'position:relative;width:100%;aspect-ratio:16/9;background:#f7f8fb;border-radius:18px;overflow:hidden;touch-action:none;box-shadow:inset 0 0 0 2px #2a3446';
    const cv = el('canvas', '', wrap); cv.style.cssText = 'width:100%;height:100%;display:block;touch-action:none';
    const g = cv.getContext('2d');
    const dpr = Math.min(3, devicePixelRatio || 1);
    let color = '#111827', width = 4, cur = null, curId = '', n = 0;
    function size() { const r = cv.getBoundingClientRect(); cv.width = r.width * dpr; cv.height = r.height * dpr; redraw(); }
    function path(st) {
      const r = cv.getBoundingClientRect();
      if (!st || !Array.isArray(st.p) || !st.p.length) return;
      g.strokeStyle = /^#[0-9a-f]{6}$/i.test(st.c) ? st.c : '#111827';
      g.lineWidth = Math.max(1, Math.min(40, +st.w || 4)) * r.width / 640;
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath();
      st.p.forEach((q, i) => { const x = q[0] * r.width, y = q[1] * r.height; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
      if (st.p.length === 1) g.lineTo(st.p[0][0] * r.width + 0.1, st.p[0][1] * r.height);
      g.stroke();
    }
    function redraw() {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, cv.width, cv.height);
      const all = strokes.entries().sort((a, b) => a[2] - b[2]);
      // (a "clear" entry wipes everything drawn before it)
      const clearAt = Math.max(0, ...all.filter(e => e[1] && e[1].clear).map(e => e[2]));
      for (const [, st, at] of all) if (st && !st.clear && at > clearAt) path(st);
      if (cur) path(cur);
    }
    const at = e => { const r = cv.getBoundingClientRect(); return [Math.round((e.clientX - r.left) / r.width * 1000) / 1000, Math.round((e.clientY - r.top) / r.height * 1000) / 1000]; };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); cv.setPointerCapture(e.pointerId); curId = me.id.slice(0, 6) + (++n).toString(36) + Date.now().toString(36).slice(-4); cur = { c: color, w: width, p: [at(e)] }; redraw(); });
    cv.addEventListener('pointermove', e => { if (!cur) return; const p = at(e); const l = cur.p[cur.p.length - 1]; if (Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) < 0.003) return; cur.p.push(p); if (cur.p.length > 400) { done(); cur = { c: color, w: width, p: [p] }; curId = me.id.slice(0, 6) + (++n).toString(36); } redraw(); });
    const done = () => { if (!cur) return; strokes.set(curId, cur); cur = null; };
    cv.addEventListener('pointerup', done); cv.addEventListener('pointercancel', done);
    requestAnimationFrame(size);
    addEventListener('resize', size);
    const tools = el('div', 'chips', v.body); tools.style.marginTop = '12px';
    for (const c of ['#111827', '#ff6b5e', '#2b7fff', '#18a957', '#f2a900', '#9a5cff']) { const b = el('button', 'chip', tools); b.type = 'button'; b.style.cssText += `;width:44px;background:${c};border:3px solid ${c === color ? '#fff' : 'transparent'}`; b.setAttribute('aria-label', 'Color'); b.onclick = () => { color = c; width = 4; for (const x of tools.children) x.style.borderColor = 'transparent'; b.style.borderColor = '#fff'; }; }
    const row = el('div', 'grid3', v.body); row.style.marginTop = '10px';
    btn('Thick', {}, row, () => { width = width === 4 ? 12 : 4; });
    btn('Eraser', {}, row, () => { color = '#f7f8fb'; width = 22; });
    btn('Clear all', { kind: 'bad' }, row, () => { if (confirm('Clear the whole board for everyone?')) strokes.set('clear-' + me.id.slice(0, 6) + Date.now().toString(36), { clear: 1 }); });
    el('p', 'muted small center', v.body, 'Everyone with this link draws on the same board. Share it: ').style.marginTop = '12px';
    GO.qr(location.href.split('#')[0] + '#wb.' + s, v.body).style.width = '160px';
    R.onPeers = list => { const k = list.length; v.setStatus(k ? `${k + 1} drawing together` : 'Only you so far', k ? 'on' : 'wait'); };
    void toast; void C;
  });
})();
