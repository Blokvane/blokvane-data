// Blokvane on your phone: this phone's camera on the TV screens (a cooking demo, a close-up, the front door), and the
// pet or baby monitor (this phone is the camera, or you watch the camera from here, with a buzz when it gets loud).
(() => {
  const { el, view, btn, toast, buzz, hero } = GO;
  const L = BVLIVE, C = BVWT_CORE;
  GO.def('camera', async (kind, parts) => {
    if (kind === 'monv') return watch(parts);
    if (kind === 'mon') return monitor(parts);
    return tvCam(parts);
  });
  const wake = async () => { try { if (navigator.wakeLock) return await navigator.wakeLock.request('screen'); } catch (e) {} return null; };
  async function cameraStream(facing, audio) {
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: !!audio });
  }
  // ---------- for a slide on the TVs ----------
  async function tvCam(parts) {
    const [s] = parts;
    const v = view('Camera for the TV', { tint: 'teal' });
    if (!s) { hero(v.body, 'This code isn\'t complete', 'Scan it again.', { sleepy: true }); return; }
    const vid = el('video', 'photo', v.body); vid.muted = true; vid.playsInline = true; vid.autoplay = true; vid.style.aspectRatio = '16/9'; vid.style.objectFit = 'cover';
    const st = el('p', 'lead center', v.body, 'This phone\'s camera shows on the TV screens that have this camera on a slide.');
    let facing = 'environment', stream = null, lock = null;
    const R = await L.room({ secret: s, label: 'bvcam', me: await GO.member('cam:' + s.slice(0, 10)), name: GO.deviceName(), role: 'camera', open: true, onPipe: () => {},
      onPeers: list => { const n = list.filter(p => p.role === 'tv').length; if (stream) st.textContent = n ? `Live on ${n} screen${n > 1 ? 's' : ''}. Keep this page open.` : 'Live. The screens connect in a moment.'; } });
    R.mediaFor = async () => stream;
    const row = el('div', 'grid2', v.body);
    const go = btn('Start the camera', { kind: 'go', icon: 'camera' }, row, async () => {
      stream = await cameraStream(facing, false);
      vid.srcObject = stream;
      lock = await wake();
      // (screens waiting for this camera hear it's on)
      R.send({ k: 'cam-on' });
      st.textContent = 'Live. The screens connect in a moment. Keep this page open.';
      go.hidden = true; buzz('ok');
    });
    btn('Flip camera', { icon: 'refresh' }, row, async () => {
      facing = facing === 'environment' ? 'user' : 'environment';
      if (!stream) return;
      const old = stream;
      stream = await cameraStream(facing, false);
      vid.srcObject = stream;
      old.getTracks().forEach(t => t.stop());
      // (each screen connects again, to get the new camera)
      for (const p of R.list()) { const P = R.pipeTo(p.id); if (P) P.close(); }
      R.send({ k: 'cam-on' });
    });
    addEventListener('pagehide', () => { if (stream) stream.getTracks().forEach(t => t.stop()); if (lock) lock.release().catch(() => {}); R.close(); });
  }

  // ---------- the monitor: this phone is the camera ----------
  async function monitor(parts) {
    const [s] = parts;
    const v = view('Monitor camera', { tint: 'teal' });
    if (!s) { hero(v.body, 'This code isn\'t complete', 'Scan it again.', { sleepy: true }); return; }
    const vid = el('video', 'photo', v.body); vid.muted = true; vid.playsInline = true; vid.autoplay = true; vid.style.aspectRatio = '4/3'; vid.style.objectFit = 'cover';
    const st = el('p', 'lead center', v.body, 'Put this phone where it can see the room, plugged in. Then watch it from your own phone.');
    let stream = null, lock = null, stopAlarm = () => {};
    const R = await L.room({ secret: s, label: 'bvmon', me: await GO.member('mon:' + s.slice(0, 10)), name: GO.deviceName(), role: 'camera', open: true, onPipe: () => {},
      onPeers: list => { const n = list.filter(p => p.role === 'viewer').length; if (stream) st.textContent = n ? `${n} phone${n > 1 ? 's are' : ' is'} watching.` : 'On. Nobody is watching right now.'; } });
    R.mediaFor = async () => stream;
    const startBtn = btn('Start the camera', { kind: 'go', full: true, huge: true, icon: 'camera' }, v.body, async () => {
      stream = await cameraStream('environment', true);
      vid.srcObject = stream;
      lock = await wake();
      stopAlarm = soundAlarm(stream, level => R.send({ k: 'loud', level, at: Date.now() }));
      startBtn.hidden = true;
      st.textContent = 'On. Now scan this with the phone you\'ll watch from:';
      GO.qr(L.GO + '#monv.' + s + '.' + R.id, v.body);
      el('p', 'muted small center', v.body, 'Tip: dim this phone\'s screen, but keep this page open.');
    });
    addEventListener('pagehide', () => { stopAlarm(); if (stream) stream.getTracks().forEach(t => t.stop()); if (lock) lock.release().catch(() => {}); R.close(); });
  }
  function soundAlarm(stream, onLoud) {
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      const an = a.createAnalyser(); an.fftSize = 1024;
      a.createMediaStreamSource(stream).connect(an);
      const buf = new Float32Array(an.fftSize);
      let since = 0, last = 0;
      const t = setInterval(() => {
        an.getFloatTimeDomainData(buf);
        let sum = 0; for (const x of buf) sum += x * x;
        const rms = Math.sqrt(sum / buf.length);
        if (rms > 0.08) { if (!since) since = Date.now(); if (Date.now() - since > 1500 && Date.now() - last > 60000) { last = Date.now(); onLoud(Math.round(rms * 100)); } } else since = 0;
      }, 250);
      return () => { clearInterval(t); a.close(); };
    } catch (e) { return () => {}; }
  }

  // ---------- the monitor: watching ----------
  async function watch(parts) {
    const [s, camId] = parts;
    const v = view('Monitor', { tint: 'teal' });
    if (!s) { hero(v.body, 'This code isn\'t complete', 'Scan it again.', { sleepy: true }); return; }
    const vid = el('video', 'photo', v.body); vid.playsInline = true; vid.autoplay = true; vid.muted = true; vid.style.aspectRatio = '4/3'; vid.style.objectFit = 'cover';
    const st = el('p', 'lead center', v.body, 'Looking for the camera...');
    let P = null, lock = null;
    const R = await L.room({ secret: s, label: 'bvmon', me: await GO.member('monv:' + s.slice(0, 10)), name: GO.deviceName(), role: 'viewer', open: true, onMsg: m => {
      if (m.k === 'loud') { buzz('long'); toast('It\'s loud at the camera!', 'bad'); try { if (Notification.permission === 'granted') new Notification('Blokvane monitor', { body: 'It\'s loud at the camera.' }); } catch (e) {} }
    } });
    const row = el('div', 'grid2', v.body);
    const sound = btn('Turn the sound on', { icon: 'volUp' }, row, () => { vid.muted = !vid.muted; sound.querySelector('span').textContent = vid.muted ? 'Turn the sound on' : 'Turn the sound off'; vid.play().catch(() => {}); });
    btn('Alerts on this phone', { icon: 'bell' }, row, async () => { try { const p = await Notification.requestPermission(); toast(p === 'granted' ? 'You\'ll get an alert when it\'s loud (keep this page open).' : 'This phone buzzes when it\'s loud (keep this page open).', 'ok'); } catch (e) { toast('This phone buzzes when it\'s loud (keep this page open).'); } });
    lock = await wake();
    const connect = async () => {
      const cam = (camId && L.okId(camId) ? camId : '') || (R.list().find(p => p.role === 'camera') || {}).id;
      if (!cam) { st.textContent = 'The camera isn\'t on. Start it on the other phone or computer.'; return; }
      try {
        st.textContent = 'Connecting...';
        P = await R.pipe(cam, { recv: 'both' });
        P.onStream = stream => { vid.srcObject = stream; vid.play().catch(() => {}); st.textContent = 'Live.'; };
        if (P.stream) { vid.srcObject = P.stream; st.textContent = 'Live.'; }
        P.onClose = () => { st.textContent = 'The camera went away. Trying again...'; setTimeout(connect, 4000); };
      } catch (e) { st.textContent = 'Couldn\'t connect to the camera. Trying again...'; setTimeout(connect, 5000); }
    };
    setTimeout(connect, 2500);
    addEventListener('pagehide', () => { if (lock) lock.release().catch(() => {}); R.close(); });
  }
})();
