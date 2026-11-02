// Blokvane on your phone: your paired computer's home screen. One big tile for each thing this phone may do there
// (the computer says which). Tapping a tile opens its page (m/remote.js, m/send.js, m/family.js, m/party.js). The "?"
// at the top says what every tile does, in plain words.
GO.def('home', (pair) => {
  const { el, icon, view, btn, toast, buzz, sheet, store } = GO;
  if (!pair) { location.hash = ''; GO.route(); return; }
  const pc = GO.computer(pair);
  const TILES = [
    { id: 'remote', perm: 'remote', icon: 'remote', tint: 'violet', name: 'Remote', hint: 'Pause, volume, next episode',
      help: 'Control whatever plays in Chrome on the computer: pause and play, the volume, skip the intro, the next episode.' },
    { id: 'party', perm: 'remote', icon: 'game', tint: 'pink', name: 'Party games', hint: 'Start a game on the TV. Everyone plays on their phone.', emoji: '🎉', row: '🧠🌍🎱',
      help: 'Pick one of 11 games and where it shows (the computer or a TV screen). This phone joins as the host; everyone else scans the code on the screen. No app, no account, in 7 languages.' },
    { id: 'slides', perm: 'remote', icon: 'slides', tint: 'violet', name: 'Slides clicker', hint: 'Google Slides, PowerPoint, TV slideshows',
      help: 'Move through a presentation open on the computer, or the slideshows on your TV screens: next, back, pause.' },
    { id: 'gameday', perm: 'remote', icon: 'sparkle', tint: 'pink', name: 'Game day and fun', hint: 'Celebrate, fireworks, messages on the TVs',
      help: 'Set off fireworks, confetti or emoji on your TV screens, or show a message on them right now.' },
    { id: 'send', perm: 'send', icon: 'send', tint: 'sky', name: 'Send', hint: 'Photos, files and links, both ways',
      help: 'Send photos, files and links from this phone to the computer, or from the computer to this phone. Nothing is uploaded anywhere.' },
    { id: 'here', perm: 'send', icon: 'phone', tint: 'sky', name: 'Continue here', hint: 'Open the computer\'s page on this phone',
      help: 'Opens on this phone the page the computer is showing, at the same spot (and a video at the same second).' },
    { id: 'clip', perm: 'clip', icon: 'clip', tint: 'mint', name: 'Clipboard', hint: 'Copy there, paste here',
      help: 'Something you copied on the computer shows up here to paste, and the other way around.' },
    { id: 'kid', perm: 'kid', icon: 'kid', tint: 'sun', name: 'Kid mode', hint: 'Requests, pause the internet, more time',
      help: 'When a child asks to open a site, you say yes or no here. You can also pause the internet or add time.' },
    { id: 'screens', perm: 'screens', icon: 'tv', tint: 'teal', name: 'Screen check', hint: 'What each TV shows right now',
      help: 'See which TV screens are on and what each one shows, from anywhere. Nothing is recorded on the TVs.' },
    { id: 'board', perm: 'board', icon: 'board', tint: 'teal', name: 'Family board and Now serving', hint: 'Post to the kitchen screen, move the line',
      help: 'Post a note, a list or a photo to the family board on a TV, or move the "Now serving" number forward.' },
    { id: 'camera', perm: 'camera', icon: 'camera', tint: 'teal', name: 'Camera on the TVs', hint: 'Show this phone\'s camera on every screen',
      help: 'Show this phone\'s camera live on your TV screens: a cooking demo, a close-up, the front door.' },
    { id: 'kv', perm: 'kv', icon: 'key', tint: 'gold', name: 'KeyVane', hint: 'Unlock by tapping Approve, look up a password',
      help: 'Unlock KeyVane on the computer by tapping Approve here, instead of typing the master password.' },
    { id: 'lost', perm: 'lost', icon: 'lock', tint: 'rose', name: 'Lost computer', hint: 'Lock it and sign it out of websites',
      help: 'Left the computer somewhere? Lock KeyVane on it and sign it out of every website, from here. The computer has to be on.' }
  ];
  const PARTS = { remote: 'remote', slides: 'remote', gameday: 'remote', send: 'send', clip: 'send', kid: 'family', screens: 'family', board: 'family', camera: 'family', kv: 'family', lost: 'family' };
  // (each tile's place: these two are always wide; if the rest don't pair up, the last one is wide too)
  const WIDE = new Set(['remote', 'party']);
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
    // the "?": what every tile does
    const hb = el('button', 'help', v.top);
    hb.type = 'button'; hb.title = 'What each button does'; hb.setAttribute('aria-label', 'What each button does');
    hb.appendChild(icon('help'));
    hb.onclick = () => helpSheet();
    const perms = pc.perms();
    const list = TILES.filter(t => !perms || perms.includes(t.perm));
    const normal = list.filter(t => !WIDE.has(t.id));
    const lastWide = normal.length % 2 ? normal[normal.length - 1].id : '';
    const grid = el('div', 'tiles', v.body);
    for (const t of list) {
      const wide = WIDE.has(t.id) || t.id === lastWide;
      const b = el('button', 'tile' + (wide ? ' wide' : '') + (t.id === 'party' ? ' party' : ''), grid);
      b.type = 'button';
      b.style.setProperty('--tint', `var(--${t.tint})`);
      const ic = el('span', 'ic', b);
      if (t.emoji) ic.textContent = t.emoji; else ic.appendChild(icon(t.icon));
      const tx = el('span', 'tx', b);
      el('b', '', tx, t.name);
      el('small', '', tx, t.hint);
      if (t.row && wide) el('span', 'row-e', b, t.row).setAttribute('aria-hidden', 'true');
      if (badge[t.id]) el('span', 'badge', b, String(badge[t.id]));
      b.onclick = () => open(t.id);
    }
    if (!perms) el('p', 'muted small center', v.body, 'Connecting to your computer...').style.marginTop = '14px';
    // (the computer's own word on what this phone may do comes with its hello: the tiles follow it)
    if (!perms) { const off = pc.onStatus(() => { if (pc.perms() && onHome) { off(); home(); } }); }
    // not on the home screen yet: one tap to make Blokvane an app icon
    if (GO.installCard) GO.installCard(v.body);
    const more = el('div', 'card', v.body); more.style.marginTop = '16px';
    el('h2', '', more, 'More');
    const row = el('div', 'grid2', more);
    btn('Rename this phone', { kind: 'ghost' }, row, () => rename());
    btn('Other computers', { kind: 'ghost' }, row, () => { GO.store.set('pick', 1); location.hash = ''; });
    // (the computer stopped answering: start the connection over; or connect again with a new code from the computer)
    btn('Reconnect to ' + pc.name, { kind: 'ghost', full: true, icon: 'refresh' }, more, () => { toast('Reconnecting...'); GO.reconnect(); }).style.marginTop = '10px';
    btn('Connect again with a new code', { kind: 'ghost', full: true, icon: 'phone' }, more, () => againSheet()).style.marginTop = '10px';
    btn('Join a game with a code', { kind: 'ghost', full: true, icon: 'game' }, more, async () => (await GO.need('party'))('code', [])).style.marginTop = '10px';
    btn('What each button does', { kind: 'ghost', full: true, icon: 'help' }, more, () => helpSheet()).style.marginTop = '10px';
    GO.foot();
  }
  function helpSheet() {
    sheet('What each button does', sh => {
      el('p', 'muted', sh, 'Your computer decides which of these this phone may use (in Blokvane on the computer: Connect, then Your phone).');
      const box = el('div', 'helps', sh);
      const perms = pc.perms();
      for (const t of TILES) {
        const h = el('div', 'h', box);
        h.style.setProperty('--tint', `var(--${t.tint})`);
        const ic = el('span', 'ic', h); if (t.emoji) ic.textContent = t.emoji; else ic.appendChild(icon(t.icon));
        const d = el('div', '', h);
        el('b', '', d, t.name + (perms && !perms.includes(t.perm) ? ' (off for this phone)' : ''));
        el('p', '', d, t.help);
      }
      el('p', 'muted small', sh, 'Something not working? Make sure the computer is on, with Chrome open. The dot at the top turns green when it answers.').style.marginTop = '14px';
    });
  }
  // when Reconnect isn't enough (the computer removed this phone, or was set up again): a new code from the computer
  function againSheet() {
    sheet('Connect again', sh => {
      el('p', '', sh, 'If Reconnect doesn\'t help, connect this phone again with a new code. It takes one scan:');
      const ol = el('ol', 'steps-pic', sh);
      for (const [ic, t, sub] of [['laptop', 'On your computer, open Blokvane', 'Then Connect, then Your phone.'], ['monitor', 'Click "Connect another phone"', 'It says "Connect your phone" if no phone is listed there. This phone won\'t be added twice.'], ['camera', 'Scan the code with this phone\'s camera', 'Tap the link that shows up. This phone connects by itself.']]) {
        const li = el('li', '', ol); const b = el('span', 'ic', li); b.appendChild(icon(ic)); const d = el('div', '', li); el('b', '', d, t); el('small', '', d, sub);
      }
      el('p', 'muted small', sh, 'Make sure Chrome is open on the computer, and that both have internet.').style.marginTop = '14px';
    });
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
    if (id === 'party') { (await GO.need('party'))('start', [], { pc, back: () => { history.replaceState(null, '', '#c1.' + pair.s + '.' + pair.cid); home(); } }); return; }
    if (id === 'here') {
      onHome = true;
      try { const d = await pc.ask('here', {}); const S = await GO.need('send'); S.continueCard(pc, d); }
      catch (e) { toast(e && e.message ? e.message : 'That didn\'t work. Try again.', 'bad'); }
      return;
    }
    const part = await GO.need(PARTS[id]);
    part.open(id, pc, home);
  }
  home();
});
