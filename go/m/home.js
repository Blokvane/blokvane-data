// Blokvane on your phone: your paired computer's home screen. One big tile for each thing this phone may do there
// (the computer says which). Tapping a tile opens its page (m/remote.js, m/send.js, m/family.js).
GO.def('home', (pair) => {
  const { el, icon, view, btn, toast, buzz, sheet, store } = GO;
  if (!pair) { location.hash = ''; GO.route(); return; }
  const pc = GO.computer(pair);
  const TILES = [
    { id: 'remote', perm: 'remote', icon: 'remote', tint: 'violet', name: 'Remote', hint: 'Pause, volume, next episode' },
    { id: 'slides', perm: 'remote', icon: 'slides', tint: 'violet', name: 'Slides clicker', hint: 'Google Slides, PowerPoint, TV slideshows' },
    { id: 'gameday', perm: 'remote', icon: 'sparkle', tint: 'pink', name: 'Game day and fun', hint: 'Celebrate, fireworks, messages on the TVs' },
    { id: 'send', perm: 'send', icon: 'send', tint: 'sky', name: 'Send', hint: 'Photos, files and links, both ways' },
    { id: 'clip', perm: 'clip', icon: 'clip', tint: 'mint', name: 'Clipboard', hint: 'Copy there, paste here' },
    { id: 'kid', perm: 'kid', icon: 'kid', tint: 'sun', name: 'Kid mode', hint: 'Requests, pause the internet, more time' },
    { id: 'screens', perm: 'screens', icon: 'tv', tint: 'teal', name: 'Screen check', hint: 'What each TV shows right now' },
    { id: 'board', perm: 'board', icon: 'board', tint: 'teal', name: 'Family board and Now serving', hint: 'Post to the kitchen screen, move the line' },
    { id: 'camera', perm: 'camera', icon: 'camera', tint: 'teal', name: 'Camera on the TVs', hint: 'Show this phone\'s camera on every screen' },
    { id: 'kv', perm: 'kv', icon: 'key', tint: 'gold', name: 'KeyVane', hint: 'Unlock by tapping Approve, look up a password' },
    { id: 'lost', perm: 'lost', icon: 'lock', tint: 'rose', name: 'Lost computer', hint: 'Lock it and sign it out of websites' }
  ];
  const PARTS = { remote: 'remote', slides: 'remote', gameday: 'remote', send: 'send', clip: 'send', kid: 'family', screens: 'family', board: 'family', camera: 'family', kv: 'family', lost: 'family' };
  // what the computer says by itself, wherever you are in the app
  if (!pc.__homeWired) {
    pc.__homeWired = true;
    pc.on('kidAsk', a => { buzz('long'); toast(`${a.host} needs a yes or no`, 'ok'); badge.kid = (badge.kid || 0) + 1; if (onHome) home(); });
    pc.on('kvAsk', a => { GO.need('family').then(F => F.kvPrompt(pc, a)); });
    pc.on('drop', d => { GO.need('send').then(S => S.incoming(pc, d)); });
    pc.on('continue', d => { GO.need('send').then(S => S.continueCard(pc, d)); });
    pc.on('clip', d => { GO.need('send').then(S => S.clipCard(pc, d)); });
    // (a file can arrive before that part of the page has loaded: it waits)
    pc.on('pipe', P => { const q = []; P.onFile = f => q.push(f); GO.need('send').then(S => { S.pipeIn(pc, P); for (const f of q) P.onFile(f); }); });
    // (the parts most likely to be needed load now, so a tap opens them at once)
    setTimeout(() => { GO.need('remote').catch(() => {}); GO.need('send').catch(() => {}); GO.need('family').catch(() => {}); }, 400);
  }
  const badge = {};
  let onHome = false;
  function home() {
    onHome = true;
    const v = view(pc.name, { live: true });
    const perms = pc.perms();
    const list = TILES.filter(t => !perms || perms.includes(t.perm));
    const grid = el('div', 'tiles', v.body);
    for (const t of list) {
      const b = el('button', 'tile' + (t.id === 'remote' && list.length % 2 ? ' wide' : ''), grid);
      b.type = 'button';
      b.style.setProperty('--tint', `var(--${t.tint})`);
      const ic = el('span', 'ic', b); ic.appendChild(icon(t.icon));
      el('b', '', b, t.name);
      el('small', '', b, t.hint);
      if (badge[t.id]) el('span', 'badge', b, String(badge[t.id]));
      b.onclick = () => open(t.id);
    }
    if (!perms) el('p', 'muted small center', v.body, 'Connecting to your computer...').style.marginTop = '14px';
    // (the computer's own word on what this phone may do comes with its hello: the tiles follow it)
    if (!perms) { const off = pc.onStatus(() => { if (pc.perms() && onHome) { off(); home(); } }); }
    const more = el('div', 'card', v.body); more.style.marginTop = '16px';
    el('h2', '', more, 'More');
    const row = el('div', 'grid2', more);
    btn('Rename this phone', { kind: 'ghost' }, row, () => rename());
    btn('Other computers', { kind: 'ghost' }, row, () => { GO.store.set('pick', 1); location.hash = ''; });
    btn('Join a game with a code', { kind: 'ghost', full: true, icon: 'game' }, more, async () => (await GO.need('party'))('code', [])).style.marginTop = '10px';
    GO.foot();
  }
  function rename() {
    sheet('This phone\'s name', (sh, close) => {
      const i = GO.input({ value: GO.deviceName(), max: 30 });
      sh.appendChild(i);
      btn('Save', { kind: 'go', full: true }, sh, () => { const n = BVLIVE.clean(i.value, 30); if (n) { store.set('name', n); if (pc.room) pc.room.setName(n); } close(); toast('Saved.'); }).style.marginTop = '12px';
    });
  }
  async function open(id) {
    onHome = false;
    badge[id] = 0;
    const part = await GO.need(PARTS[id]);
    part.open(id, pc, home);
  }
  home();
});
