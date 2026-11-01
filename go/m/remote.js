// Blokvane on your phone: the couch remote (whatever plays in Chrome on your computer), the slides clicker, and game
// day with fun for every TV screen.
(() => {
GO.def('remote', {
  open(id, pc, back) {
    if (id === 'slides') return slides(pc, back);
    if (id === 'gameday') return gameday(pc, back);
    return remote(pc, back);
  }
});
function remote(pc, back) {
  const { el, icon, view, btn, toast, buzz } = GO;
  const v = view('Remote', { back, tint: 'violet', live: true });
  const now = el('div', 'now', v.body);
  const fav = el('div', 'fav', now); fav.appendChild(icon('play'));
  const t = el('div', 't', now);
  const title = el('b', '', t, 'Looking at what plays...');
  const sub = el('small', '', t, '');
  const bar = el('div', 'bar', v.body); bar.style.margin = '-6px 4px 16px'; const fill = el('i', '', bar);
  const pad = el('div', 'pad', v.body);
  const key = (cls, ic, label, cmd, val) => { const b = el('button', cls, pad); b.type = 'button'; b.setAttribute('aria-label', label); b.appendChild(icon(ic)); b.onclick = () => send(cmd, val, b); return b; };
  key('p-up', 'volUp', 'Louder', 'vol', 0.1);
  key('p-down', 'volDown', 'Quieter', 'vol', -0.1);
  key('p-left', 'back10', 'Back 10 seconds', 'back', 10);
  key('p-right', 'fwd10', 'Forward 10 seconds', 'fwd', 10);
  const mid = key('p-mid', 'pause', 'Play or pause', 'toggle');
  const row = el('div', 'grid3', v.body);
  btn('Skip intro', { icon: 'skip' }, row, () => send('skip'));
  btn('Next episode', { icon: 'next' }, row, () => send('next'));
  btn('Mute', { icon: 'mute' }, row, () => send('mute'));
  el('p', 'muted small center', v.body, 'Works for what plays in Chrome on your computer: YouTube, Netflix, Prime Video, Disney+, and any site with a video.').style.marginTop = '16px';
  let st = null, busy = false, timer = 0;
  function show(s) {
    st = s;
    if (!s || !s.has) { title.textContent = s && s.why ? s.why : 'Nothing is playing in Chrome right now.'; sub.textContent = s && s.site ? s.site : ''; fill.style.width = '0'; mid.textContent = ''; mid.appendChild(icon('play')); return; }
    title.textContent = s.title || s.site;
    sub.textContent = `${s.site}${s.d ? ' · ' + clock(s.t) + ' of ' + clock(s.d) : ''} · volume ${Math.round((s.muted ? 0 : s.vol) * 100)}%`;
    fill.style.width = s.d ? Math.min(100, 100 * s.t / s.d) + '%' : '0';
    mid.textContent = ''; mid.appendChild(icon(s.playing ? 'pause' : 'play'));
  }
  const clock = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  async function send(cmd, val, b) {
    if (busy && cmd === 'state') return;
    busy = true;
    try {
      const s = await pc.ask('media', { cmd, v: val }, { timeout: 9000 });
      show(s);
      if (cmd !== 'state') {
        buzz('tap');
        if (cmd === 'skip') toast(s.did === 'skip' ? 'Skipped.' : s.did === 'jump' ? 'No skip button there: jumped ahead 85 seconds.' : 'There\'s nothing to skip right now.', s.did ? 'ok' : '');
        if (cmd === 'next') toast(s.did ? 'Next one.' : 'There\'s no next episode button right now.', s.did ? 'ok' : '');
      }
    } catch (e) { if (cmd !== 'state') toast(e.message, 'bad'); else title.textContent = e.message; }
    finally { busy = false; }
  }
  const loop = () => { clearTimeout(timer); if (!document.body.contains(pad)) return; if (!document.hidden) send('state'); timer = setTimeout(loop, 3000); };
  loop();
}
function slides(pc, back) {
  const { el, view, btn, toast, buzz, seg } = GO;
  const v = view('Slides clicker', { back, tint: 'violet', live: true });
  const info = el('div', 'card', v.body);
  const h = el('h2', '', info, 'Looking for a presentation...');
  const p = el('p', '', info, '');
  let where = 'auto';
  pc.ask('slidesWhere', {}).then(w => {
    if (w.web) { h.textContent = w.web.title || 'Presentation'; p.textContent = 'Open in Chrome on your computer (' + w.web.site + ').'; }
    else { h.textContent = 'Blokvane slideshows'; p.textContent = w.tvs ? `On this computer and ${w.tvs} TV screen${w.tvs > 1 ? 's' : ''}.` : 'On this computer\'s Player and your TV screens.'; }
    if (w.web && w.tvs) { const s = seg([['auto', 'Presentation'], ['tv', 'TV slideshows']], 'auto', x => { where = x; }, info); s.node.style.marginTop = '8px'; }
  }).catch(e => { h.textContent = e.message; });
  const big = el('div', 'grid2', v.body);
  const go = async (cmd, label) => { try { const r = await pc.ask('slides', { cmd, where }); buzz('tap'); if (r.why) toast(r.why, 'bad'); else if (label) toast(label, 'ok'); } catch (e) { toast(e.message, 'bad'); } };
  const prev = btn('Back', { huge: true, icon: 'prev' }, big, () => go('prev'));
  const next = btn('Next', { huge: true, kind: 'go', icon: 'next' }, big, () => go('next'));
  prev.style.minHeight = next.style.minHeight = '42vh';
  const row = el('div', 'grid3', v.body); row.style.marginTop = '12px';
  btn('First slide', {}, row, () => go('first', 'Back to the start.'));
  btn('Pause', {}, row, () => go('pause', 'Paused.'));
  btn('Play', {}, row, () => go('play', 'Playing.'));
  el('p', 'muted small center', v.body, 'Tip: the volume buttons don\'t work from a web page, so tap the big buttons. Keep this page open while you present.').style.marginTop = '14px';
}
function gameday(pc, back) {
  const { el, view, btn, toast, buzz, input } = GO;
  const v = view('Game day and fun', { back, tint: 'pink', live: true });
  const fx = (kind, extra) => pc.ask('fx', Object.assign({ kind, from: GO.deviceName() }, extra || {})).then(r => { buzz('ok'); toast(r.tvs ? `On ${r.tvs} screen${r.tvs > 1 ? 's' : ''}!` : 'Sent to the screens.', 'ok'); }).catch(e => toast(e.message, 'bad'));
  // fun on every screen
  const c1 = el('div', 'card', v.body);
  el('h2', '', c1, 'On every screen');
  const fun = el('div', 'fun', c1);
  for (const [kind, e, name] of [['fireworks', '🎆', 'Fireworks'], ['confetti', '🎊', 'Confetti'], ['hearts', '💖', 'Hearts'], ['balloons', '🎈', 'Balloons'], ['stars', '⭐', 'Stars'], ['boo', '👻', 'Boo!'], ['cheer', '📣', 'Cheer']]) {
    const b = el('button', '', fun); b.type = 'button'; b.append(e); el('small', '', b, name);
    b.onclick = () => fx(kind);
  }
  const em = el('div', 'chips', c1); em.style.marginTop = '12px';
  for (const e of ['🎉', '🔥', '😂', '👏', '🏈', '🏆', '❤️', '🥳', '😱', '🙌']) { const b = el('button', 'chip', em, e); b.type = 'button'; b.style.fontSize = '22px'; b.onclick = () => fx('emoji', { e }); }
  const say = el('div', 'card', v.body);
  el('h2', '', say, 'A message on the screens');
  const i = input({ placeholder: 'Pizza is here!', max: 80 });
  say.appendChild(i);
  const quick = el('div', 'chips', say); quick.style.margin = '10px 0';
  for (const q of ['Food is ready!', 'Halftime!', 'Kickoff in 5 minutes', 'Happy birthday!', 'Last call']) { const b = el('button', 'chip', quick, q); b.type = 'button'; b.onclick = () => { i.value = q; }; }
  btn('Show it on every screen', { kind: 'go', full: true }, say, () => { const text = i.value.trim(); if (!text) { i.focus(); return; } return fx('msg', { text, sec: 20 }).then(() => { i.value = ''; }); });
  // the game
  const g = el('div', 'card', v.body);
  el('h2', '', g, 'Celebrate now');
  el('p', '', g, 'Like the big plays on game day: on every screen, with the sound if it\'s on.');
  const cel = el('div', 'grid2', g);
  const gd = (cmd, val) => pc.ask('gameday', { cmd, v: val }).then(() => { buzz('ok'); toast('On the screens.', 'ok'); }).catch(e => toast(e.message, 'bad'));
  for (const [k, t] of [['td', '🏈 Touchdown'], ['fg', '🥅 Field goal'], ['int', '🛡️ Interception'], ['fumble', '💥 Fumble'], ['sack', '💪 Sack'], ['win', '🏆 We won!']]) btn(t, {}, cel, () => gd('celebrate', k));
  const opt = el('div', 'grid2', g); opt.style.marginTop = '10px';
  btn('Sound on', {}, opt, () => gd('sound', true));
  btn('Sound off', {}, opt, () => gd('sound', false));
  btn('Hide the score', {}, opt, () => gd('spoiler', true));
  btn('Show the score', {}, opt, () => gd('spoiler', false));
  const sync = el('div', 'card', v.body);
  el('h2', '', sync, 'Match your TV');
  el('p', '', sync, 'Is the TV broadcast behind the screens? Nudge them so nothing is spoiled.');
  const nr = el('div', 'grid3', sync);
  btn('-5 s', {}, nr, () => gd('nudge', -5));
  btn('Tap at the snap', { kind: 'go' }, nr, () => gd('tap'));
  btn('+5 s', {}, nr, () => gd('nudge', 5));
  const demo = el('div', 'grid2', v.body); demo.style.marginTop = '4px';
  btn('Start the demo game', { kind: 'ghost' }, demo, () => gd('demo', true));
  btn('Stop the demo', { kind: 'ghost' }, demo, () => gd('demo', false));
}
})();
