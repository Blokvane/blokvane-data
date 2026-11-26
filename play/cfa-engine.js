// Blokvane party games: Car Fighting Arena, the game itself. This is the game's own code, from the game as it was made
// ("Car Fighting Arena.dc.html", the part inside <script data-dc-script>), kept as it was: the 16 cars and how each one
// drives, the four arenas and everything in them, the 19 weapons, the hazards and ramps, the damage (dents, parts that
// tear off, wheels that come off, an engine on fire), the computer drivers, the camera, the replay of the final
// knockout and the winner's drift, and every sound (each car's recorded engine with its gear changes, the crashes, the
// weapons). A member that is not marked is exactly the game's own.
// What changed, and why (each change is marked "Blokvane" where it is):
// - The game drew its screens with a page builder (React); here cfa-game.js draws the TV's screens from the same
//   values (setState below keeps them), and the players drive from their phones instead of the keys and a pad on the
//   screen. The game's settings come from the host's phone, not from a saved menu.
// - Up to 10 cars: everyone with a phone drives their own car, and computer cars fill the rest. With one player the
//   game is exactly the one it was made as. With several, "your car" (the louder own sounds, the bonus lines and
//   points, the messages) belongs to every player's car, and the sounds are heard from the middle of what the TV shows.
// - The TV's views (the game's arena and chase cameras, the whole arena from above, a camera that circles the fight,
//   and split screen for 2 to 4 players), the garage where everyone picks a car before a match, survival played
//   together, teams of 2 to 4 sides, and two more ways to play: Bomb Tag and Crown Chase.
// - Its files (cars, sounds) come from Blokvane's own pages (base), and the drawing starts at the quality the screen can
//   take.
// Needs three.js r147 with its GLTFLoader and BufferGeometryUtils, and the game's weapon models (cfa/weapons-v2.js).
class CFAEngine {
  // o: { base: where the game's own files are ('cfa/'), props: the game's own switches as it had them, state: what the
  // host picked, hooks: { state(changed): something the screen shows changed; ev(kind, car, a, b): something happened
  // that a player's phone or the screen around the game wants to know } }
  constructor(o) {
    o = o || {};
    this.base = o.base || '';
    this.hooks = o.hooks || {};
    // (the game's own switches, with the values it shipped with)
    this.props = Object.assign({ bots: 5, shrinkArena: true, camera: 'Chase', engineVol: 1, rivalEngines: 1 }, o.props || {});
    // ----- the game's own fields, exactly as it had them -----
    this.state = { phase: 'select', arena: 'lava', carIdx: 0, count: '', toast: '', mode: 'last', diff: 'normal', champ: false, hazards: true, ramps: true, paused: false, vol: 3, quality: 'AUTO', cam: null,
      result: { title: '', head: '', name: '', car: '', series: '', nextLabel: 'REMATCH', score: 0, board: [] },
      hud: { box: '', boxVal: '', boxSub: '', score: 0, round: '', time: '0:00', weapon: '', list: [], shrinking: false, dead: false, deadText: '', keepPad: false } };
    this.jumpRef = { current: null }; this.mountRef = { current: null }; this.knobRef = { current: null }; this.boostRef = { current: null }; this.dmgRef = { current: null }; this.popRef = { current: null }; this.speedRef = { current: null }; this.hitRef = { current: null };
    this.phase = 'select';
    this.touch = { steer: 0, gas: 0, brake: 0, boost: 0 };
    this.keys = {};
    this.CARS = [
      { name: 'RED STRIPES', gltf: 'assets/cars/01_red_stripes.glb', snd: ['CC45', 0.98], wr: 0.51, speed: 17, accel: 12, mass: 1.2, steer: 2.1, r: 1.75, w: 2.1, l: 4.4, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [88, 82, 52, 76], eng: { b: 34, r: 72, f: 260, q: 1.5, lv: [0.5, 0.3, 0.25], n: 0.4 } },
      { name: 'BLUE MONSTER', gltf: 'assets/cars/02_blue_monster.glb', snd: ['CC47', 0.9], wr: 0.73, speed: 14, accel: 9, mass: 1.9, steer: 1.8, r: 1.95, w: 2.5, l: 4.7, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [68, 55, 90, 52], eng: { b: 21, r: 40, f: 170, q: 2.5, lv: [0.35, 0.6, 0.08], n: 0.8 } },
      { name: 'YELLOW SUPERCAR', gltf: 'assets/cars/03_yellow_supercar.glb', snd: ['02', 1], wr: 0.51, speed: 19, accel: 13, mass: 1.05, steer: 2.3, r: 1.7, w: 2.1, l: 4.3, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [100, 90, 42, 84], eng: { b: 44, r: 100, f: 360, q: 3, lv: [0.55, 0.15, 0.4], n: 0.3 } },
      { name: 'GREEN ARMOR', gltf: 'assets/cars/04_green_armor.glb', snd: ['08', 0.85], wr: 0.73, speed: 13, accel: 8, mass: 2.2, steer: 1.6, r: 2.05, w: 2.5, l: 5.05, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [60, 48, 100, 45], eng: { b: 18, r: 34, f: 150, q: 3, lv: [0.3, 0.7, 0.05], n: 0.9 } },
      { name: 'PURPLE EXOTIC', gltf: 'assets/cars/05_purple_exotic.glb', snd: ['03', 1], wr: 0.53, speed: 18, accel: 14, mass: 1.1, steer: 2.4, r: 1.7, w: 2.1, l: 4.3, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [94, 96, 45, 90], eng: { b: 40, r: 88, f: 320, q: 4, lv: [0.6, 0.2, 0.35], n: 0.35 } },
      { name: 'POLICE', gltf: 'assets/cars/06_police_coupe.glb', snd: ['07', 1], wr: 0.53, speed: 17, accel: 12, mass: 1.35, steer: 2.2, r: 1.8, w: 2.1, l: 4.55, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [88, 80, 62, 78], eng: { b: 30, r: 68, f: 230, q: 2, lv: [0.45, 0.45, 0.2], n: 0.5 } },
      { name: 'ORANGE MUSCLE', gltf: 'assets/cars/07_orange_muscle.glb', snd: ['CC46', 1], wr: 0.54, speed: 16, accel: 13, mass: 1.45, steer: 2, r: 1.8, w: 2.2, l: 4.5, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [84, 88, 68, 66], eng: { b: 26, r: 55, f: 200, q: 2.5, lv: [0.45, 0.55, 0.15], n: 0.6 } },
      { name: 'TURQUOISE BUGGY', gltf: 'assets/cars/08_turquoise_buggy.glb', snd: ['CC48', 1.08], wr: 0.65, speed: 16, accel: 14, mass: 1, steer: 2.4, r: 1.75, w: 2.1, l: 4.2, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [84, 92, 40, 86], eng: { b: 46, r: 95, f: 380, q: 4, lv: [0.6, 0.12, 0.4], n: 0.3 } },
      { name: 'PINK HEART', gltf: 'assets/cars/09_pink_heart_coupe.glb', snd: ['09', 1], wr: 0.5, speed: 18, accel: 13, mass: 1, steer: 2.5, r: 1.65, w: 2.1, l: 4.1, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [92, 90, 40, 94], eng: { b: 42, r: 92, f: 340, q: 3.5, lv: [0.55, 0.15, 0.38], n: 0.3 } },
      { name: 'CHARCOAL RALLY', gltf: 'assets/cars/10_charcoal_rally.glb', snd: ['10', 0.9], wr: 0.73, speed: 15, accel: 10, mass: 1.8, steer: 1.9, r: 1.95, w: 2.5, l: 4.7, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [74, 62, 86, 60], eng: { b: 24, r: 46, f: 190, q: 2.5, lv: [0.4, 0.55, 0.1], n: 0.75 } },
      { name: 'LIME BUGGY', gltf: 'assets/cars/11_lime_buggy.glb', snd: ['06', 1], wr: 0.65, speed: 16, accel: 13, mass: 1.1, steer: 2.3, r: 1.8, w: 2.1, l: 4.5, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [82, 88, 46, 82], eng: { b: 48, r: 90, f: 400, q: 5, lv: [0.6, 0.1, 0.45], n: 0.3 } },
      { name: 'BLUE ICE', gltf: 'assets/cars/12_blue_ice_supercar.glb', snd: ['04', 1], wr: 0.53, speed: 19, accel: 13, mass: 1.05, steer: 2.3, r: 1.75, w: 2.15, l: 4.5, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [100, 92, 42, 86], eng: { b: 45, r: 105, f: 370, q: 3, lv: [0.55, 0.12, 0.42], n: 0.28 } },
      { name: 'ORANGE SKULL', gltf: 'assets/cars/13_orange_skull.glb', snd: ['CC47', 1.05], wr: 0.73, speed: 14, accel: 10, mass: 1.95, steer: 1.8, r: 1.95, w: 2.5, l: 4.7, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [70, 60, 92, 54], eng: { b: 22, r: 42, f: 175, q: 3, lv: [0.38, 0.6, 0.1], n: 0.85 } },
      { name: 'TURQUOISE CLASSIC', gltf: 'assets/cars/14_turquoise_classic.glb', snd: ['CC46', 0.86], wr: 0.54, speed: 16, accel: 11, mass: 1.5, steer: 1.9, r: 1.85, w: 2.2, l: 4.65, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [82, 74, 70, 62], eng: { b: 27, r: 52, f: 210, q: 2, lv: [0.45, 0.5, 0.12], n: 0.6 } },
      { name: 'PURPLE HOTROD', gltf: 'assets/cars/15_purple_hotrod.glb', snd: ['05', 1], wr: 0.67, speed: 17, accel: 14, mass: 1.3, steer: 2, r: 1.8, w: 2.2, l: 4.45, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [90, 94, 60, 66], eng: { b: 28, r: 62, f: 240, q: 4, lv: [0.6, 0.45, 0.25], n: 0.7 } },
      { name: 'PATROL SUV', gltf: 'assets/cars/16_patrol_suv.glb', snd: ['08', 1.1], wr: 0.73, speed: 15, accel: 10, mass: 1.85, steer: 1.9, r: 1.95, w: 2.5, l: 4.7, bh: 0.6, ch: 0.5, cl: 1.8, cz: -0.2, st: [76, 62, 88, 58], eng: { b: 25, r: 48, f: 195, q: 2.5, lv: [0.4, 0.5, 0.12], n: 0.7 } }
    ];
    this.MODES = { last: ['LAST STANDING', 'Push everyone off. Last car on the arena wins.'], score: ['KNOCKOUT BATTLE', 'Two minutes. Cars respawn. Most knockouts wins.'], hill: ['KING OF THE HILL', 'Hold the glowing zone alone to score. First to 60 wins.'],
      team: ['TEAM BATTLE', '3 vs 3. Knock out the whole red team.'], survival: ['SURVIVAL', 'Bots arrive in waves. Stay on as long as you can.'] };
    this.DIFFS = { easy: { gas: 0.6, st: 1.6, wd: 2.5, bt: 2, pb: 1.5 }, normal: { gas: 0.8, st: 2.2, wd: 0.6, bt: 0.4, pb: 1 }, hard: { gas: 0.95, st: 3, wd: 0, bt: 0.2, pb: 0.7 } };
    this.COLORS = ['#ff8a1f', '#4aa3ff', '#3ddc84', '#ffd23f', '#c77dff', '#ffffff', '#ff6fb5', '#35e0d0'];
    this.W = { rocketpod: ['ROCKETS', 0, 0, 'aim', 26, 0.12], missilerack: ['MISSILES', 6, 0.18, 'aim', 30, 0.6], minigun: ['MINIGUN', 34, 0.07, 'aim', 22, 0.15], cannon: ['CANNON', 0, 0, 'aim', 28, 0.1], flamer: ['FLAMER', 26, 0.1, 'aim', 7, 0.4],
      tesla: ['TESLA', 0, 0, 'aim', 7, 3.2], minerack: ['MINE', 0, 0, 'behind', 9, 2.4], railgun: ['RAILGUN', 0, 0, 'aim', 40, 0.07], mortar: ['MORTAR', 0, 0, 'aim', 30, 3.2],
      saw: ['SAW', 80, 0.1, 'aim', 10, 0.5], magnet: ['MAGNET', 22, 0.1, 'aim', 16, 3.2], hammer: ['HAMMER', 0, 0, 'aim', 6, 0.5], oil: ['OIL', 0, 0, 'behind', 10, 2.4], emp: ['EMP', 0, 0, 'aim', 11, 3.2],
      harpoon: ['HARPOON', 0, 0, 'aim', 22, 0.4], glove: ['FIST', 0, 0, 'aim', 8, 0.3], drone: ['DRONE', 0, 0, 'aim', 40, 3.2], sonic: ['SONIC', 0, 0, 'aim', 10, 0.7], laser: ['LASER', 26, 0.1, 'aim', 30, 0.12] };
    this.WNAMES = Object.fromEntries(Object.entries(this.W).map(e => [e[0], e[1][0]]));
  
    this.ARENAS = {
      lava: { name: 'LAVA', bg: 0x160503, fog: 0x3a0c04, fn: 70, ff: 240, hemi: [0xffd9b8, 0xff4a10, 0.45], sun: [0xfff0dc, 1.5], up: [0xff5a1a, 0.7], env: [0xfff2e0, 0xff5a10, 0x8fa8c8, 0x1a0a06], top: [0.82, 0.12, 0.7, 0.5], side: 0x2a2520, ring: 0xffc23a, post: 0xffb040, grip: 1, floor: -8.5 },
      industrial: { name: 'INDUSTRIAL', bg: 0x07090f, fog: 0x0d1420, fn: 60, ff: 260, hemi: [0x9fb4e0, 0x4a3018, 0.4], sun: [0xcfe0ff, 1.1], up: [0xff7a20, 0.5], env: [0xcfd8ff, 0x6a3010, 0xffb060, 0x0a0c12], top: [0.5, 0.75, 0.6, 0.7], side: 0x23282f, ring: 0xffd23f, post: 0xff3b30, grip: 1, floor: -24 },
      ice: { name: 'ICE', bg: 0x061226, fog: 0x16304f, fn: 90, ff: 300, hemi: [0xbfe6ff, 0x24507a, 0.75], sun: [0xdff0ff, 1.2], up: [0x2fd0a0, 0.3], env: [0xdff3ff, 0x1a3550, 0x9fd8ff, 0x2a4a70], top: [0.12, 0.1, 0.3, 0], side: 0x9fd4ee, ring: 0x7fe9ff, post: 0x7fe9ff, grip: 0.35, floor: -5.5 },
      island: { name: 'SKY ISLAND', bg: 0x7ec8ff, fog: 0xc4e6ff, fn: 140, ff: 430, hemi: [0xffffff, 0x6fa85a, 0.5], sun: [0xfff4d6, 1.25], up: [0xffffff, 0.15], env: [0xbfd8f0, 0x4f7a40, 0x8fb8e0, 0x4a80c0], top: [0.9, 0, 1, 0], side: 0x6b4a2e, ring: 0xffffff, post: 0xfff2b0, grip: 1, floor: -45 } };
    this.ENG = ['01_red_stripes', '02_blue_monster', '03_yellow_supercar', '04_green_armor', '05_purple_exotic', '06_police_coupe', '07_orange_muscle', '08_turquoise_buggy', '09_pink_heart', '10_charcoal_rally', '11_lime_buggy', '12_blue_ice', '13_orange_skull', '14_turquoise_classic', '15_purple_hotrod', '16_patrol_suv'];
    this.EB = ['idle_loop', 'low_rpm_loop', 'mid_rpm_loop', 'high_rpm_loop']; this.EC = [0, 0.25, 0.6, 1]; this.EGB = [0.65, 0.75, 0.87, 0.98]; this.EGL = [0, 0.28, 0.55, 1.1];
    this.EG = { startup: 0.85, shutdown: 0.75, upshift: 0.85, downshift: 0.85, deceleration: 0.78 };
    this.EOV = { '03_yellow_supercar': { idle_loop: 'V12_idle_loop.wav', low_rpm_loop: 'V12_low_rpm_loop.wav', mid_rpm_loop: 'V12_mid_rpm_loop.wav', high_rpm_loop: 'V12_high_rpm_loop.wav', startup: 'V12_startup.wav', upshift: 'V12_upshift.wav', deceleration: 'V12_deceleration.wav', pull: 'V12_pull.wav', sl: 0.65, pullAt: [0, 3.2, 6.5] } };
    this.CCS = '1001101001101010';
    this.CCP = [1.02, 0.85, 1.07, 0.81, 1.04, 0.98, 0.94, 1.12, 1.08, 0.9, 1.04, 1.1, 0.91, 0.93, 1, 0.94];
    // (Blokvane: two more ways to play, and the names of the four teams)
    this.MODES.bomb = ['BOMB TAG', 'One car has a bomb with a short fuse. Bump someone to pass it on before it goes off.'];
    this.MODES.crown = ['CROWN CHASE', 'Grab the crown and keep it to score. Hit the holder to steal it. First to 60 wins.'];
    this.TEAMS = ['BLUE', 'RED', 'GOLD', 'GREEN']; this.teamN = 2;
    // ----- Blokvane: what several players on one screen need -----
    Object.assign(this.state, o.state || {});
    this.solo = true;          // one player with a phone: the game is the one it was made as (their car, their camera)
    this.view = '';            // the TV's view: '' (the game's own), 'arena', 'top', 'action', 'chase' or 'split'
    this.lis = { x: 0, z: 0 }; // the middle of what the TV shows (where the sounds are heard from)
    this.views = [];           // split screen: one view for each player
    this.gar = [];             // the garage: the cars standing on the arena while everyone picks
    this.q0 = o.quality0 == null ? 2 : o.quality0;   // how good the drawing starts (2: the game's own start)
    this.koTime = 120;         // Knockout Battle and Crown Chase: how long a match lasts (the game's own: two minutes)
    this.aimT = 0; this.crown = null; this.bomb = null;
  }
  // (the game's screen used to be drawn by a page builder from these; on the TV, cfa-game.js draws it from them)
  setState(p) { if (typeof p === 'function') p = p(this.state); this.state = Object.assign({}, this.state, p); const h = this.hooks.state; if (h) { try { h(p || {}, this); } catch (e) { console.warn('cfa', e); } } }
  forceUpdate() { const h = this.hooks.state; if (h) { try { h({}, this); } catch (e) { console.warn('cfa', e); } } }
  // Blokvane: the game starts in the element el (the whole TV). No keys and no saved settings here: the host's phone
  // sets the game up, and everyone drives from their own phone.
  mount(el) {
    this.mountRef.current = el;
    this.wait = setInterval(() => { if (window.THREE && THREE.GLTFLoader && THREE.BufferGeometryUtils && window.CCWeapons && this.mountRef.current) { clearInterval(this.wait); this.init(); } }, 50);
  }
  // everything the game made goes: its drawing (the whole WebGL context, so a TV gets its memory back for the next
  // game), its sounds and its timers
  destroy() {
    this.dead = true;
    clearInterval(this.wait); cancelAnimationFrame(this.raf); clearTimeout(this.toastT);
    if (this.ro) this.ro.disconnect(); if (this.onRs) window.removeEventListener('resize', this.onRs);
    if (this.renderer) { try { this.renderer.dispose(); this.renderer.forceContextLoss(); } catch (e) {} this.renderer.domElement.remove(); }
    if (this.ac) { try { this.ac.close(); } catch (e) {} }
    this.scene = null; this.cars = []; this.gar = []; this.views = []; this.gcars = null; this.gp = {};
  }
  setPhase(p) { this.phase = p; this.setState({ phase: p }); }

  // ---------- Blokvane: several players on one screen ----------
  // me(c): the car gets "your car" treatment (its sounds louder, its bonus lines and points, its messages). With one
  // player that is their car alone, exactly as the game was made; with several, every car a phone drives.
  me(c) { return !!c && (this.solo ? c === this.player : !!c.hum); }
  // how loud "your car" sounds are: full with one player; with several, by how near the car is to what the TV shows,
  // so ten players' cars never sound ten times as loud
  mv(c) { return this.solo ? 1 : Math.max(0.35, this.near(c.x, c.z)) * 0.8; }
  // where the TV listens from: the player's car with one player (the game's own), else the middle of what it shows
  lisP() { return this.solo ? this.player : this.lis; }
  // a few words for one player ("CAR REPAIRED"): on the TV with one player, as the game had them; on that player's
  // own phone with several
  tell(c, text) { if (this.solo) { if (c === this.player) this.toast(text); return; } if (c && c.hum) this.emit('tell', c, text); }
  emit(kind, c, a, b) { const h = this.hooks.ev; if (h) { try { h(kind, c, a, b); } catch (e) { console.warn('cfa', e); } } }
  // the screen shakes for "your car": with one player as the game did; with several, that player's own view in split
  // screen, or a little for everyone's shared view
  shk(c, v) { if (this.solo) { if (c === this.player) this.shake = Math.max(this.shake, v); return; } const w = this.viewOf(c); if (w) w.shake = Math.max(w.shake, v); else if (!this.views.length) this.shake = Math.max(this.shake, v * 0.35); }
  viewOf(c) { for (const w of this.views) if (w.c === c) return w; return null; }
  // the players' cars, and the ones still in
  humans() { return this.cars.filter(c => c.hum); }
  // a player's phone: the joystick and the buttons as they are now (pad: { steer -1..1, gas 0..1, brake 0/1, boost 0/1 })
  input(key, pad) { const c = this.carOf(key); if (!c) return; c.pad = pad; c.padAt = performance.now(); }
  // a button that does something once (fire, jump, change weapon): the same as the keys and buttons of the game
  press(key, what) { const c = this.carOf(key); if (!c || this.paused) return; c.padAt = performance.now(); if (this.phase !== 'playing') return; if (what === 'fire') this.fire(c); else if (what === 'jump') this.jump(c); else if (what === 'swap') this.swap(c); }
  carOf(key) { for (const c of this.cars) if (c.key === key) return c; return null; }
  // what a player's phone shows of their own car (the game's own pad showed the same: boost, damage, the weapon)
  status(c) {
    const nw = c.slots.filter(q => q).length, jok = !c.air && !c.falling && !c.elim && this.time - (c.jT || -9) >= 1.1;
    return { b: Math.round(c.boost * 100), d: Math.round(c.dmg * 100), w: c.weapon ? this.WNAMES[c.weapon] : '', a: c.weapon ? c.ammo : 0, n: nw, j: jok ? 1 : 0, out: c.elim && !this.respawns ? 1 : 0, rsp: c.elim && this.respawns ? 1 : 0, fall: c.falling ? 1 : 0,
      kos: c.kos, pts: Math.floor(c.pts || 0), sc: c.score, bomb: this.bomb && this.bomb.c === c ? Math.max(0, Math.ceil(this.bomb.t)) : 0, crown: this.crown && this.crown.c === c ? 1 : 0, sh: c.shield > 0 ? 1 : 0 };
  }
  tex(size, draw, rep) {
    const T = THREE, c = document.createElement('canvas'); c.width = c.height = size; draw(c.getContext('2d'), size);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep, rep); } return t;
  }
  lavaDraw(g, s) {
      g.fillStyle = '#c62a00'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 70; i++) { const x = Math.random() * s, y = Math.random() * s, rr = 8 + Math.random() * 30, hot = Math.random() < 0.6;
        for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) { const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rr);
          gr.addColorStop(0, hot ? 'rgba(255,200,40,.9)' : 'rgba(40,8,2,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x + ox - rr, y + oy - rr, rr * 2, rr * 2); } }
  }
  steelDraw(g, s, ind) {
      g.fillStyle = ind ? '#2b3038' : '#3a3d44'; g.fillRect(0, 0, s, s); const n = 10, p = s / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = (ind ? 36 : 52) + Math.random() * 16; g.fillStyle = 'rgb(' + v + ',' + (v + (ind ? 6 : 2)) + ',' + (v + (ind ? 14 : 8)) + ')'; g.fillRect(i * p + 2, j * p + 2, p - 4, p - 4);
        g.fillStyle = 'rgba(0,0,0,.45)'; for (const [a, b] of [[8, 8], [p - 8, 8], [8, p - 8], [p - 8, p - 8]]) { g.beginPath(); g.arc(i * p + a, j * p + b, 2.5, 0, 7); g.fill(); } }
      for (let i = 0; i < 500; i++) { g.strokeStyle = 'rgba(' + (Math.random() < 0.5 ? '0,0,0' : '255,255,255') + ',.06)'; g.lineWidth = 1; const x = Math.random() * s, y = Math.random() * s, a = Math.random() * 6.28, l = 10 + Math.random() * 50; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      g.save(); g.translate(s / 2, s / 2); const ro = s * 0.5, ri = s * 0.465;
      for (let i = 0; i < 120; i++) { g.fillStyle = i % 2 ? '#15161a' : '#e0a81e'; g.beginPath(); const a0 = i / 120 * 6.2832, a1 = (i + 1) / 120 * 6.2832; g.arc(0, 0, ro, a0, a1); g.arc(0, 0, ri, a1 + 0.03, a0 + 0.03, true); g.fill(); }
      g.strokeStyle = '#e0a81e'; g.lineWidth = 6; g.beginPath(); g.arc(0, 0, s * 0.1, 0, 7); g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 4; g.setLineDash([30, 20]); g.beginPath(); g.arc(0, 0, s * 0.3, 0, 7); g.stroke(); g.setLineDash([]); if (ind) { g.strokeStyle = '#e0a81e'; g.lineWidth = 12; g.beginPath(); g.arc(0, 0, s * 0.1, 0, 7); g.stroke(); g.fillStyle = '#e0a81e'; g.fillRect(-46, -52, 18, 104); g.fillRect(28, -52, 18, 104); g.fillRect(-46, -9, 92, 18);
        g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 5; g.setLineDash([26, 20]); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; g.beginPath(); g.moveTo(Math.cos(a) * s * 0.14, Math.sin(a) * s * 0.14); g.lineTo(Math.cos(a) * s * 0.44, Math.sin(a) * s * 0.44); g.stroke(); } } g.restore();
  }
  topTex(k) { return this.tex(1024, (g, s) => { const R = () => Math.random(), c = s / 2;
    if (k === 'ice') { const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, '#d9f1fb'); gr.addColorStop(1, '#a9d6ec'); g.fillStyle = gr; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 40; i++) { const x = R() * s, y = R() * s, rr = 30 + R() * 90, q = g.createRadialGradient(x, y, 0, x, y, rr); q.addColorStop(0, R() < 0.5 ? 'rgba(255,255,255,.7)' : 'rgba(70,140,190,.35)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
      for (let i = 0; i < 70; i++) { let x = R() * s, y = R() * s, a = R() * 6.28; g.strokeStyle = 'rgba(255,255,255,' + (0.4 + R() * 0.5) + ')'; g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 6; j++) { a += (R() - 0.5) * 1.2; x += Math.cos(a) * (20 + R() * 40); y += Math.sin(a) * (20 + R() * 40); g.lineTo(x, y); } g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 26; g.beginPath(); g.arc(c, c, c - 13, 0, 7); g.stroke(); g.strokeStyle = 'rgba(60,150,200,.5)'; g.lineWidth = 5; g.beginPath(); g.arc(c, c, s * 0.3, 0, 7); g.stroke(); g.beginPath(); g.arc(c, c, s * 0.1, 0, 7); g.stroke(); }
    else if (k === 'island') { g.fillStyle = '#3a7a22'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 500; i++) { g.fillStyle = ['rgba(120,180,60,.25)', 'rgba(40,100,30,.25)', 'rgba(160,200,80,.18)'][i % 3]; g.beginPath(); g.arc(R() * s, R() * s, 10 + R() * 40, 0, 7); g.fill(); }
      g.strokeStyle = '#8a6a42'; g.lineWidth = 34; g.beginPath(); g.arc(c, c, s * 0.3, 0, 7); g.stroke(); g.strokeStyle = 'rgba(60,40,20,.35)'; g.lineWidth = 3; g.setLineDash([14, 22]); g.beginPath(); g.arc(c, c, s * 0.3 - 8, 0, 7); g.stroke(); g.beginPath(); g.arc(c, c, s * 0.3 + 8, 0, 7); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#8d9096'; g.beginPath(); g.arc(c, c, s * 0.1, 0, 7); g.fill(); g.strokeStyle = '#5f6268'; g.lineWidth = 3; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.cos(a) * s * 0.1, c + Math.sin(a) * s * 0.1); g.stroke(); } g.beginPath(); g.arc(c, c, s * 0.05, 0, 7); g.stroke();
      for (let i = 0; i < 900; i++) { g.fillStyle = ['#ffffff', '#ffe066', '#ff9ecb'][i % 3]; g.fillRect(R() * s, R() * s, 3, 3); }
      g.strokeStyle = '#6b4a2e'; g.lineWidth = 30; g.beginPath(); g.arc(c, c, c - 15, 0, 7); g.stroke(); g.strokeStyle = '#8a6a42'; g.lineWidth = 6; g.beginPath(); g.arc(c, c, c - 32, 0, 7); g.stroke(); }
    else if (k === 'lava') this.rockDraw(g, s); else this.steelDraw(g, s, true); this.floorFx(g, s, k); }); }
  walk(s, n, lo, hi) { const R = Math.random, p = [[R() * s, R() * s]]; let a = R() * 6.28; for (let j = 0; j < n; j++) { a += (R() - 0.5) * 1.3; const l = lo + R() * (hi - lo), q = p[p.length - 1]; p.push([q[0] + Math.cos(a) * l, q[1] + Math.sin(a) * l]); } return p; }
  poly(g, p, wrap) { const offs = wrap ? [-wrap, 0, wrap] : [0]; for (const ox of offs) for (const oy of offs) { g.beginPath(); p.forEach((q, i) => i ? g.lineTo(q[0] + ox, q[1] + oy) : g.moveTo(q[0] + ox, q[1] + oy)); g.stroke(); } }
  blot(g, x, y, r, col) { const q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(' + col + ')'); q.addColorStop(1, 'rgba(' + col.replace(/[^,]+$/, '0') + ')'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); }
  rockDraw(g, s) { const R = Math.random, c = s / 2; g.fillStyle = '#3b3532'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < 260; i++) this.blot(g, R() * s, R() * s, 20 + R() * 80, ['20,16,14,.35', '90,78,70,.22', '60,40,30,.3'][i % 3]);
    g.lineCap = g.lineJoin = 'round'; for (let i = 0; i < 34; i++) { const p = this.walk(s, 9, 30, 90); g.strokeStyle = 'rgba(8,5,4,.75)'; g.lineWidth = 2 + R() * 4; this.poly(g, p); g.strokeStyle = 'rgba(255,110,20,.35)'; g.lineWidth = 1; this.poly(g, p); }
    for (let i = 0; i < 16; i++) this.blot(g, R() * s, R() * s, 30 + R() * 60, '0,0,0,.45');
    const h = g.createRadialGradient(c, c, c * 0.78, c, c, c); h.addColorStop(0, 'rgba(255,90,10,0)'); h.addColorStop(1, 'rgba(255,90,10,.6)'); g.fillStyle = h; g.fillRect(0, 0, s, s);
    g.strokeStyle = '#ffb020'; g.lineWidth = 12; g.setLineDash([40, 24]); g.beginPath(); g.arc(c, c, c - 10, 0, 7); g.stroke(); g.strokeStyle = 'rgba(255,190,90,.45)'; g.lineWidth = 4; g.setLineDash([30, 20]); g.beginPath(); g.arc(c, c, s * 0.3, 0, 7); g.stroke(); g.setLineDash([]); g.lineWidth = 6; g.strokeStyle = 'rgba(255,170,60,.7)'; g.beginPath(); g.arc(c, c, s * 0.1, 0, 7); g.stroke(); }
  floorFx(g, s, k) { const R = Math.random, c = s / 2, pt = () => { const a = R() * 6.28, d = Math.sqrt(R()) * c * 0.9; return [c + Math.cos(a) * d, c + Math.sin(a) * d]; };
    if (k === 'industrial') { for (let i = 0; i < 46; i++) { const p = pt(); this.blot(g, p[0], p[1], 20 + R() * 60, '150,72,22,.22'); } for (let i = 0; i < 16; i++) { const p = pt(); this.blot(g, p[0], p[1], 14 + R() * 40, '0,0,0,.5'); } }
    if (k === 'island') { g.save(); g.beginPath(); g.arc(c, c, c - 34, 0, 7); g.arc(c, c, s * 0.3 + 18, 0, 7, true); g.clip(); for (let x = 0; x < s; x += 44) { g.fillStyle = (x / 44) % 2 ? 'rgba(255,255,200,.07)' : 'rgba(0,30,0,.1)'; g.fillRect(x, 0, 44, s); } g.restore(); for (let i = 0; i < 14; i++) { const p = pt(); this.blot(g, p[0], p[1], 16 + R() * 36, '120,90,50,.4'); } }
    if (k === 'ice') { for (let i = 0; i < 16; i++) { const p = pt(); this.blot(g, p[0], p[1], 60 + R() * 120, '20,80,150,.28'); } const f = g.createRadialGradient(c, c, c * 0.7, c, c, c); f.addColorStop(0, 'rgba(255,255,255,0)'); f.addColorStop(1, 'rgba(255,255,255,.4)'); g.fillStyle = f; g.fillRect(0, 0, s, s); }
    if (k !== 'ice') { g.lineCap = 'round'; for (let i = 0; i < (k === 'island' ? 10 : 26); i++) { const p = pt(), r = 30 + R() * 120, a0 = R() * 6.28, a1 = a0 + 0.5 + R() * 1.6; g.strokeStyle = k === 'island' ? 'rgba(70,50,25,.3)' : 'rgba(0,0,0,.3)'; g.lineWidth = 4; g.beginPath(); g.arc(p[0], p[1], r, a0, a1); g.stroke(); g.beginPath(); g.arc(p[0], p[1], r + 13, a0, a1); g.stroke(); } }
    if (k === 'industrial' || k === 'island') { const v = g.createRadialGradient(c, c, c * 0.8, c, c, c); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = v; g.fillRect(0, 0, s, s); } }
  detailDraw(g, s, k) { const R = Math.random; g.fillStyle = k === 'industrial' ? '#d6d6d6' : '#efefef'; g.fillRect(0, 0, s, s); g.lineCap = g.lineJoin = 'round';
    for (let i = 0; i < 5000; i++) { g.fillStyle = R() < 0.5 ? 'rgba(0,0,0,' + (0.04 + R() * 0.1) + ')' : 'rgba(255,255,255,' + (0.1 + R() * 0.3) + ')'; g.fillRect(R() * s, R() * s, 1 + R() * 2, 1 + R() * 2); }
    if (k === 'industrial') { const p = 32; for (let i = 0; i < s / p; i++) for (let j = 0; j < s / p; j++) { g.save(); g.translate(i * p + p / 2, j * p + p / 2); g.rotate((i + j) % 2 ? 0.785 : -0.785); g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.5)'; g.beginPath(); g.moveTo(-8, 2.5); g.lineTo(8, 2.5); g.stroke(); g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(-8, 0); g.lineTo(8, 0); g.stroke(); g.restore(); }
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, s, 3); g.fillRect(0, 0, 3, s); g.fillRect(s / 2, 0, 2, s); g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 3, s, 1.5); g.fillRect(3, 0, 1.5, s); }
    else if (k === 'lava') { for (let i = 0; i < 28; i++) { g.strokeStyle = 'rgba(0,0,0,' + (0.3 + R() * 0.35) + ')'; g.lineWidth = 0.8 + R() * 2; this.poly(g, this.walk(s, 7, 14, 42), s); } for (let i = 0; i < 130; i++) { const x = R() * s, y = R() * s, r = 2 + R() * 6; g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0.4, 2.2); g.stroke(); } }
    else if (k === 'ice') { for (let i = 0; i < 110; i++) { const x = R() * s, y = R() * s, a = R() * 6.28, l = 60 + R() * 240, b = (R() - 0.5) * 60; g.strokeStyle = R() < 0.5 ? 'rgba(30,90,140,.2)' : 'rgba(255,255,255,.7)'; g.lineWidth = 0.6 + R() * 1.2; for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + Math.cos(a) * l / 2 - Math.sin(a) * b, y + oy + Math.sin(a) * l / 2 + Math.cos(a) * b, x + ox + Math.cos(a) * l, y + oy + Math.sin(a) * l); g.stroke(); } }
      for (let i = 0; i < 70; i++) { g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 1; g.beginPath(); g.arc(R() * s, R() * s, 1.5 + R() * 5, 0, 7); g.stroke(); } }
    else { for (let i = 0; i < 60; i++) this.blot(g, R() * s, R() * s, 14 + R() * 30, '0,40,0,.2'); for (let i = 0; i < 6000; i++) { const x = R() * s, y = R() * s, a = -1.57 + (R() - 0.5) * 1.3, l = 5 + R() * 8; g.strokeStyle = R() < 0.55 ? 'rgba(0,45,0,.3)' : 'rgba(255,255,190,.45)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); } } }
  glowDraw(g, s) { const R = Math.random; g.fillStyle = '#000'; g.fillRect(0, 0, s, s); g.lineCap = g.lineJoin = 'round'; for (let i = 0; i < 11; i++) { const p = this.walk(s, 8, 24, 70); g.shadowColor = '#ff4a00'; g.shadowBlur = 14; g.strokeStyle = '#ff8a1a'; g.lineWidth = 2 + R() * 3; this.poly(g, p, s); g.shadowBlur = 0; g.strokeStyle = '#ffe9a0'; g.lineWidth = 1; this.poly(g, p, s); } }
  buildArena(k) {
    const T = THREE, sc = this.scene; if (this.arenaG) { sc.remove(this.arenaG); this.arenaG.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) [].concat(n.material).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); }); }
    const G = this.arenaG = new T.Group(); sc.add(G); this.arena = k; this.scroll = null; this.anim = []; this.vats = []; this.stacks = [];
    const A = this.ARENAS[k], R = () => Math.random(), TAU = Math.PI * 2; this.dustC = { lava: 0x6a5a50, industrial: 0x777f88, ice: 0xffffff, island: 0xc9b48a }[k]; this.scenery(G, A, k);
    const std = (c, r, m, flat) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m, flatShading: !!flat }), bas = (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c }, o || {}));
    const add = (geo, mat, x, y, z, p) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); (p || G).add(m); return m; };
    const glowTex = c => this.tex(128, (g, s) => { const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(' + c + ',.75)'); gr.addColorStop(1, 'rgba(' + c + ',0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
    const glowM = c => bas(0xffffff, { map: glowTex(c), transparent: true, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false, fog: false });
    sc.background = new T.Color(A.bg); sc.fog = new T.Fog(A.fog, A.fn, A.ff); this.hemi.color.set(A.hemi[0]); this.hemi.groundColor.set(A.hemi[1]); this.hemi.intensity = A.hemi[2]; this.dl.color.set(A.sun[0]); this.dl.intensity = A.sun[1]; this.up.color.set(A.up[0]); this.up.intensity = A.up[1];
    const es = new T.Scene(); es.background = new T.Color(A.env[3]); [[A.env[0], 0, 30, 0, 40, 1, 40], [A.env[1], 0, -20, 0, 80, 1, 80], [A.env[2], 40, 8, 0, 1, 14, 50], [A.env[2], -40, 8, 0, 1, 14, 50]].forEach(e => { const m = new T.Mesh(new T.BoxGeometry(e[4], e[5], e[6]), bas(e[0])); m.position.set(e[1], e[2], e[3]); es.add(m); });
    const pm = new T.PMREMGenerator(this.renderer); if (sc.environment) sc.environment.dispose(); sc.environment = pm.fromScene(es).texture; pm.dispose();
    const pmats = this.platform.material; if (pmats[1].map) pmats[1].map.dispose(); pmats[1].map = this.topTex(k); pmats[1].roughness = A.top[0]; pmats[1].metalness = A.top[1]; pmats[1].needsUpdate = true; pmats[0].color.set(A.side); pmats[0].roughness = A.top[2]; pmats[0].metalness = A.top[3];
    this.ring.material.color.set(A.ring); this.posts[0].material.color.set(A.post); this.grip = A.grip; this.floorY = A.floor;
    { const lay = (tx, o, y, ro, tile) => { const m = add(new T.CircleGeometry(1, 64), bas(0xffffff, Object.assign({ map: tx, transparent: true, depthWrite: false, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -0.5 }, o)), 0, y, 0); m.rotation.x = -Math.PI / 2; m.renderOrder = ro; m.userData.tile = tile; return m; };
      this.floorL = [lay(this.tex(512, (g, s) => this.detailDraw(g, s, k), 1), { blending: T.MultiplyBlending, premultipliedAlpha: true }, 0.005, -3, k === 'island' ? 5 : 6)];
      if (k === 'lava') { const gm = lay(this.tex(512, (g, s) => this.glowDraw(g, s), 1), { blending: T.AdditiveBlending }, 0.008, -2, 11); this.floorL.push(gm); this.anim.push(t => { gm.material.opacity = 0.55 + Math.sin(t * 1.7) * 0.3 + Math.sin(t * 4.3) * 0.08; }); }
      if (this.R) this.setR(); }
    if (k === 'lava') {
      const lt = this.scroll = this.tex(256, (g, s) => this.lavaDraw(g, s), 10); add(new T.PlaneGeometry(500, 500), bas(0xffffff, { map: lt, toneMapped: false }), 0, -9, 0).rotation.x = -Math.PI / 2;
      add(new T.CylinderGeometry(3.2, 4.5, 8, 16), std(0x2a2520, 0.7, 0.5), 0, -6, 0); add(new T.CylinderGeometry(95, 95, 18, 32, 1, true), glowM('255,110,20'), 0, 0, 0);
      const rk = std(0x1a1210, 1, 0); for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + R() * 0.3, d = 77 + R() * 20, h = 8 + R() * 26; add(new T.ConeGeometry(3 + R() * 6, h, 6), rk, Math.sin(a) * d, -9 + h / 2, Math.cos(a) * d); }
    } else if (k === 'industrial') {
      const steel = std(0x2a3038, 0.6, 0.7), dark = std(0x14171c, 0.8, 0.4), rust = std(0x6a3d22, 0.9, 0.3), yel = std(0xe0a81e, 0.5, 0.4), vat = std(0x1c1f25, 0.7, 0.6); vat.side = T.DoubleSide;
      add(new T.CylinderGeometry(3, 3.8, 26, 16), steel, 0, -14, 0); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; add(new T.BoxGeometry(0.5, 0.7, 5), steel, Math.sin(a) * 3.2, -2.9, Math.cos(a) * 3.2).rotation.y = a; }
      const ft = this.tex(512, (g, s) => { g.fillStyle = '#15181d'; g.fillRect(0, 0, s, s); g.strokeStyle = '#3a3320'; g.lineWidth = 6; g.strokeRect(3, 3, s - 6, s - 6); g.strokeStyle = '#a07c14'; g.lineWidth = 4; g.setLineDash([24, 18]); g.beginPath(); g.moveTo(s / 2, 0); g.lineTo(s / 2, s); g.stroke(); for (let i = 0; i < 12; i++) { g.fillStyle = 'rgba(0,0,0,.4)'; g.beginPath(); g.arc(R() * s, R() * s, 10 + R() * 40, 0, 7); g.fill(); } }, 24);
      add(new T.PlaneGeometry(600, 600), new T.MeshStandardMaterial({ map: ft, roughness: 0.85, metalness: 0.3 }), 0, -27, 0).rotation.x = -Math.PI / 2;
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5, x = Math.sin(a) * 19, z = Math.cos(a) * 19; add(new T.CylinderGeometry(8, 6.5, 5, 24, 1, true), vat, x, -24.5, z); add(new T.CircleGeometry(7.6, 24), bas(0xff7a18, { toneMapped: false, fog: false }), x, -22.6, z).rotation.x = -Math.PI / 2; add(new T.CylinderGeometry(7.6, 9.5, 9, 20, 1, true), glowM('255,120,30'), x, -18, z); this.vats.push([x, z]); }
      const wt = this.tex(256, (g, s) => { g.fillStyle = '#0b0e14'; g.fillRect(0, 0, s, s); for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) if (R() < 0.3) { g.fillStyle = R() < 0.8 ? '#ffc060' : '#9fd0ff'; g.fillRect(x * 16 + 4, y * 8 + 2, 8, 4); } });
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + R() * 0.3, d = 64 + R() * 40, w = 8 + R() * 10, h = 30 + R() * 55; add(new T.BoxGeometry(w, h, w), bas(0xffffff, { map: wt }), Math.sin(a) * d, -27 + h / 2, Math.cos(a) * d).rotation.y = a; }
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.8, x = Math.sin(a) * 54, z = Math.cos(a) * 54; add(new T.CylinderGeometry(1.8, 2.6, 75, 12), rust, x, 10.5, z); const l = add(new T.SphereGeometry(0.7, 8, 6), bas(0xff2020, { fog: false }), x, 49, z); this.anim.push(t => { l.visible = Math.sin(t * 3 + i * 1.7) > 0; }); this.stacks.push([x, z]); }
      add(new T.TorusGeometry(46, 1.2, 8, 48), rust, 0, -8, 0).rotation.x = Math.PI / 2; add(new T.TorusGeometry(51, 0.8, 8, 48), steel, 0, -14, 0).rotation.x = Math.PI / 2;
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; add(new T.BoxGeometry(1, 19, 1), dark, Math.sin(a) * 46, -17.5, Math.cos(a) * 46); }
      for (const sx of [-1, 1]) add(new T.BoxGeometry(3, 64, 3), steel, sx * 42, 5, 58); add(new T.BoxGeometry(90, 3, 4), steel, 0, 36, 58);
      const tr = add(new T.BoxGeometry(5, 2.5, 5), yel, 0, 33.5, 58), cb = add(new T.CylinderGeometry(0.12, 0.12, 14, 6), dark, 0, 25.5, 58), hk = add(new T.BoxGeometry(2, 2, 2), yel, 0, 18, 58); this.anim.push(t => { tr.position.x = cb.position.x = hk.position.x = Math.sin(t * 0.25) * 34; });
      for (let i = 0; i < 3; i++) { const a = i / 3 * TAU, g2 = new T.Group(), cg = new T.ConeGeometry(7, 70, 16, 1, true); cg.translate(0, -35, 0); g2.position.set(Math.sin(a) * 58, 32, Math.cos(a) * 58); G.add(g2);
        g2.add(new T.Mesh(cg, bas(0xbfd8ff, { transparent: true, opacity: 0.07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false }))); this.anim.push(t => { g2.rotation.z = Math.sin(t * 0.4 + i * 2) * 0.9; g2.rotation.x = Math.cos(t * 0.3 + i) * 0.9; }); }
    } else if (k === 'ice') {
      const ice = std(0xdff3ff, 0.3, 0, 1), berg = std(0xcfe8f7, 0.45, 0, 1), mt = std(0x9fc0dc, 0.9, 0, 1);
      add(new T.PlaneGeometry(700, 700), std(0x0a2a45, 0.1, 0.75), 0, -5.5, 0).rotation.x = -Math.PI / 2; add(new T.CylinderGeometry(6, 1.5, 12, 9), ice, 0, -8.4, 0);
      for (let i = 0; i < 18; i++) { const a = R() * TAU, d = 44 + R() * 90, r0 = 3 + R() * 8, m = add(new T.DodecahedronGeometry(r0, 0), berg, Math.sin(a) * d, -5.5 + r0 * 0.3, Math.cos(a) * d); m.scale.y = 0.6 + R() * 1.2; m.rotation.set(R(), R() * 6, R()); const by = m.position.y, ph = R() * 6; this.anim.push(t => { m.position.y = by + Math.sin(t * 0.6 + ph) * 0.35; }); }
      for (let i = 0; i < 16; i++) { const a = R() * TAU, d = 36 + R() * 70, r0 = 2 + R() * 5; add(new T.CylinderGeometry(r0, r0, 0.5, 7), ice, Math.sin(a) * d, -5.4, Math.cos(a) * d).rotation.y = R() * 6; }
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + R() * 0.2, d = 190 + R() * 50, h = 45 + R() * 60; add(new T.ConeGeometry(28 + R() * 22, h, 6), mt, Math.sin(a) * d, -6 + h / 2, Math.cos(a) * d).rotation.y = R() * 6; }
      const at = this.tex(128, (g, s) => { const gr = g.createLinearGradient(0, s, 0, 0); gr.addColorStop(0, 'rgba(60,255,160,0)'); gr.addColorStop(0.25, 'rgba(60,255,160,.9)'); gr.addColorStop(0.6, 'rgba(120,120,255,.5)'); gr.addColorStop(1, 'rgba(200,80,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, s, s); for (let x = 0; x < s; x += 3) { g.fillStyle = 'rgba(0,0,0,' + R() * 0.5 + ')'; g.fillRect(x, 0, 2, s); } });
      for (let i = 0; i < 4; i++) { const pg = new T.PlaneGeometry(260, 46, 40, 1), pa = pg.attributes.position, a = i / 4 * TAU + 0.6; for (let j = 0; j < pa.count; j++) pa.setZ(j, Math.sin(pa.getX(j) * 0.035 + i * 2) * 22 + Math.sin(pa.getX(j) * 0.011) * 30);
        const m = add(pg, bas(0xffffff, { map: at, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false, opacity: 0.6 }), Math.sin(a) * 150, 80 + i * 12, Math.cos(a) * 150); m.rotation.y = a + Math.PI; this.anim.push(t => { m.material.opacity = 0.4 + Math.sin(t * 0.5 + i * 1.3) * 0.25; }); }
      const sp = new Float32Array(900); for (let i = 0; i < 300; i++) { const a = R() * TAU, e = 0.15 + R() * 1.3; sp[i * 3] = Math.cos(a) * Math.cos(e) * 380; sp[i * 3 + 1] = Math.sin(e) * 380; sp[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 380; }
      const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); G.add(new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })));
    } else {
      const rock = std(0x6b5440, 1, 0, 1), grass = std(0x4f8f2f, 0.9, 0, 1), white = std(0xffffff, 1, 0), tree = std(0x2f6f2a, 0.9, 0, 1), trunk = std(0x5a3d22, 1, 0);
      const st = this.tex(256, (g, s) => { const gr = g.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#2a78e0'); gr.addColorStop(0.5, '#9fd4ff'); gr.addColorStop(0.62, '#e6f5ff'); gr.addColorStop(1, '#ffffff'); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      add(new T.SphereGeometry(400, 24, 16), bas(0xffffff, { map: st, side: T.BackSide, fog: false, depthWrite: false, toneMapped: false }), 0, 0, 0); add(new T.SphereGeometry(14, 16, 12), bas(0xfff6d0, { fog: false, toneMapped: false }), 170, 290, -100);
      add(new T.ConeGeometry(7.5, 30, 9), rock, 0, -17.2, 0).rotation.x = Math.PI; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, h = 8 + R() * 10; add(new T.ConeGeometry(2 + R() * 1.8, h, 6), rock, Math.sin(a) * 4.5, -2.2 - h / 2, Math.cos(a) * 4.5).rotation.x = Math.PI; }
      const ct = this.tex(512, (g, s) => { g.fillStyle = '#eaf4ff'; g.fillRect(0, 0, s, s); for (let i = 0; i < 160; i++) { const x = R() * s, y = R() * s, rr = 20 + R() * 60; for (const ox of [-s, 0, s]) for (const oy of [-s, 0, s]) { const q = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rr); q.addColorStop(0, i % 3 ? 'rgba(255,255,255,.9)' : 'rgba(150,190,230,.5)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(x + ox - rr, y + oy - rr, rr * 2, rr * 2); } } }, 8);
      add(new T.PlaneGeometry(1400, 1400), bas(0xffffff, { map: ct, toneMapped: false }), 0, -62, 0).rotation.x = -Math.PI / 2; this.anim.push((t, dt) => { ct.offset.x += dt * 0.004; });
      for (let i = 0; i < 30; i++) { const a = R() * TAU, d = 10 + R() * 150, s0 = 8 + R() * 10, m = add(new T.SphereGeometry(1, 10, 8), bas(0xffffff, { toneMapped: false }), Math.sin(a) * d, -58 + R() * 6, Math.cos(a) * d); m.scale.set(s0 * 1.6, s0 * 0.5, s0 * 1.2); }
      const sgeo = new T.SphereGeometry(1, 10, 8);
      for (let i = 0; i < 26; i++) { const cg = new T.Group(), a = R() * TAU, d = 55 + R() * 170, n = 4 + Math.floor(R() * 4), s0 = 4 + R() * 7, spd = 0.6 + R() * 1.2; cg.position.set(Math.sin(a) * d, -40 + R() * 80, Math.cos(a) * d); G.add(cg);
        for (let j = 0; j < n; j++) { const m = add(sgeo, white, (j - n / 2) * s0 * 0.9, R() * s0 * 0.3, R() * s0 * 0.6, cg); m.scale.set(s0 * (0.8 + R() * 0.5), s0 * 0.55, s0 * (0.7 + R() * 0.4)); }
        this.anim.push((t, dt) => { cg.position.x += spd * dt; if (cg.position.x > 240) cg.position.x = -240; }); }
      const wt = this.tex(64, (g, s) => { g.fillStyle = '#bfe6ff'; g.fillRect(0, 0, s, s); for (let i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + R() + ')'; g.fillRect(R() * s, R() * s, 2 + R() * 3, 6 + R() * 14); } }, 1); wt.repeat.set(1, 6); this.anim.push((t, dt) => { wt.offset.y += dt * 1.5; });
      for (let i = 0; i < 7; i++) { const ig = new T.Group(), a = i / 7 * TAU + R() * 0.4, d = 62 + R() * 60, r0 = 6 + R() * 8, nt = 3 + Math.floor(R() * 4); ig.position.set(Math.sin(a) * d, -14 + R() * 34, Math.cos(a) * d); G.add(ig);
        add(new T.CylinderGeometry(r0, r0 * 0.85, 2, 9), grass, 0, 0, 0, ig); add(new T.ConeGeometry(r0 * 0.85, r0 * 2.2, 8), rock, 0, -1 - r0 * 1.1, 0, ig).rotation.x = Math.PI;
        for (let j = 0; j < nt; j++) { const ta = R() * TAU, td = R() * r0 * 0.7, th = 3 + R() * 4; add(new T.CylinderGeometry(0.3, 0.4, 1.6, 6), trunk, Math.sin(ta) * td, 1.8, Math.cos(ta) * td, ig); add(new T.ConeGeometry(1.6 + R(), th, 7), tree, Math.sin(ta) * td, 2.6 + th / 2, Math.cos(ta) * td, ig); }
        if (i % 3 === 0) add(new T.PlaneGeometry(2.4, 40), bas(0xffffff, { map: wt, transparent: true, opacity: 0.85, side: T.DoubleSide }), 0, -19, r0 * 0.9, ig);
        const by = ig.position.y, ph = R() * 6; this.anim.push(t => { ig.position.y = by + Math.sin(t * 0.4 + ph) * 1.2; }); }
      [['#e53935', '#ffffff'], ['#ffd23f', '#2a78e0']].forEach((cs, i) => { const bt = this.tex(128, (g, s) => { for (let x = 0; x < 8; x++) { g.fillStyle = cs[x % 2]; g.fillRect(x * s / 8, 0, s / 8, s); } }), bg = new T.Group(); G.add(bg);
        add(new T.SphereGeometry(5, 16, 12), new T.MeshStandardMaterial({ map: bt, roughness: 0.8 }), 0, 0, 0, bg).scale.y = 1.2; add(new T.ConeGeometry(3.2, 4, 12, 1, true), new T.MeshStandardMaterial({ map: bt, roughness: 0.8, side: T.DoubleSide }), 0, -6.2, 0, bg).rotation.x = Math.PI; add(new T.BoxGeometry(1.6, 1.3, 1.6), trunk, 0, -10, 0, bg);
        this.anim.push(t => { const a = t * 0.05 + i * 3; bg.position.set(Math.sin(a) * (70 + i * 25), 22 + i * 14 + Math.sin(t * 0.3 + i) * 2, Math.cos(a) * (70 + i * 25)); }); });
    }
    this.surround(k, A, G, add, std, bas, TAU);
  }
  surround(k, A, G, add, std, bas, TAU) {
    const T = THREE, R = Math.random, fy = A.floor, col = '#' + new T.Color(A.ring).getHexString(), font = (g, px) => { g.font = 'bold ' + px + 'px "Chakra Petch", sans-serif'; }; this.standA = [];
    const glow = this.tex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.clearRect(0, 0, s, s); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
    if (k === 'lava') {
      const wg = new T.CylinderGeometry(118, 108, 72, 44, 6, true), wp = wg.attributes.position; for (let j = 0; j < wp.count; j++) { const x = wp.getX(j), y = wp.getY(j), z = wp.getZ(j), an = Math.atan2(x, z), f = 1 + Math.sin(an * 7 + y * 0.25) * 0.025 + Math.sin(an * 13 + 1 + y * 0.6) * 0.02 + Math.sin(an * 29 + y) * 0.012; wp.setXYZ(j, x * f, y + (y < 35 ? 0 : Math.sin(an * 9) * 7 + Math.sin(an * 23) * 4), z * f); } wg.computeVertexNormals();
      const wm = std(0x30221b, 1, 0, 1); wm.side = T.BackSide; add(wg, wm, 0, fy + 34, 0);
    } else if (k === 'ice') {
      add(new T.RingGeometry(76, 420, 48), std(0xeef6ff, 0.9, 0), 0, fy + 0.7, 0).rotation.x = -Math.PI / 2; const rim = std(0x9fd4ee, 0.3, 0); rim.side = T.BackSide; add(new T.CylinderGeometry(76, 76, 0.8, 48, 1, true), rim, 0, fy + 0.3, 0);
      const n = 90, tg = new T.ConeGeometry(1, 1, 6), pines = new T.InstancedMesh(tg, std(0x1f4a3a, 0.9, 0, 1), n), caps = new T.InstancedMesh(tg, std(0xf4faff, 0.9, 0, 1), n), o = new T.Object3D();
      for (let i = 0; i < n; i++) { const a = R() * TAU, d = 84 + R() * 100, h = 7 + R() * 7, w = 2 + R() * 1.6, x = Math.sin(a) * d, z = Math.cos(a) * d; o.position.set(x, fy + 0.7 + h / 2, z); o.scale.set(w, h, w); o.updateMatrix(); pines.setMatrixAt(i, o.matrix); o.position.y = fy + 0.7 + h * 0.76; o.scale.set(w * 0.56, h * 0.5, w * 0.56); o.updateMatrix(); caps.setMatrixAt(i, o.matrix); }
      G.add(pines, caps);
    } else if (k === 'island') {
      const hs = new T.Sprite(new T.SpriteMaterial({ map: glow, color: 0xfff2c0, transparent: true, opacity: 0.75, blending: T.AdditiveBlending, depthWrite: false, fog: false })); hs.position.set(170, 290, -100); hs.scale.set(170, 170, 1); G.add(hs);
      [0xff4040, 0xff9a30, 0xffe040, 0x50d060, 0x40a0ff, 0x9060ff].forEach((c, i) => { const m = add(new T.RingGeometry(214 - i * 3, 217 - i * 3, 48, 1, 0, Math.PI), bas(c, { transparent: true, opacity: 0.2, side: T.DoubleSide, fog: false, depthWrite: false }), -40, -70, 250); m.rotation.y = 0.3; });
      const wgeo = new T.PlaneGeometry(1.5, 0.5); wgeo.translate(0.75, 0, 0); wgeo.rotateX(-Math.PI / 2); const bmat = bas(0x2a2f38, { side: T.DoubleSide }), birds = [];
      for (let i = 0; i < 8; i++) { const b = new T.Group(), w1 = new T.Mesh(wgeo, bmat), w2 = new T.Mesh(wgeo, bmat); w2.scale.x = -1; b.add(w1, w2); G.add(b); birds.push([b, w1, w2, (i % 3) * 3 - 3, Math.floor(i / 3) * 2.5]); }
      this.anim.push(t => { for (let i = 0; i < 8; i++) { const q = birds[i], a = t * 0.16 + q[4] * 0.03, f = Math.sin(t * 7 + i) * 0.6; q[0].position.set(Math.sin(a) * (58 + q[3]), 24 + Math.sin(t * 0.5 + i) * 1.5 + q[4] * 0.3, Math.cos(a) * (58 + q[3])); q[0].rotation.y = a; q[1].rotation.z = f; q[2].rotation.z = -f; } });
      const bl = new T.Group(), red = std(0xe53935, 0.5, 0.1), wh = std(0xf4f4f4, 0.45, 0.1); G.add(bl); add(new T.SphereGeometry(1, 20, 14), wh, 0, 0, 0, bl).scale.set(12, 3.6, 3.6); add(new T.SphereGeometry(1, 20, 8, 0, TAU, 1.2, 0.74), red, 0, 0, 0, bl).scale.set(12.1, 3.7, 3.7);
      add(new T.BoxGeometry(3.4, 4.6, 0.3), red, -10, 0, 0, bl); add(new T.BoxGeometry(3.4, 0.3, 4.6), red, -10, 0, 0, bl); add(new T.BoxGeometry(3.4, 1.1, 1.3), std(0x23282f, 0.6, 0.5), 1, -3.9, 0, bl);
      this.anim.push(t => { const a = -t * 0.035 + 1; bl.position.set(Math.sin(a) * 125, 38 + Math.sin(t * 0.3) * 2, Math.cos(a) * 125); bl.rotation.y = a + Math.PI; });
    }
  }
  ambient() {
    const k = this.arena, R = Math.random, p = this.phase !== 'select' && this.lisP() ? this.lisP() : { x: 0, z: 0 };
    if (k === 'lava') { if (R() < 0.3) { const a = R() * 6.28, d = this.R + 3 + R() * 30; this.spawn(Math.sin(a) * d, -8.5, Math.cos(a) * d, R() - 0.5, 3 + R() * 4, R() - 0.5, 0xffa030, 0.18, 2.5, -0.5); } }
    else if (k === 'industrial') { if (R() < 0.15) { const a = R() * 6.28, d = R() * this.R; this.spawn(Math.sin(a) * d, 16, Math.cos(a) * d, R() - 0.5, -2, R() - 0.5, 0xffc060, 0.1, 1.6, 9); }
      if (R() < 0.12) { const v = this.vats[Math.floor(R() * 3)]; this.spawn(v[0] + (R() - 0.5) * 8, -21, v[1] + (R() - 0.5) * 8, 0, 3 + R() * 2, 0, 0xffa040, 0.25, 2, -0.5); }
      if (R() < 0.1) { const v = this.stacks[Math.floor(R() * 4)]; this.spawn(v[0], 48, v[1], 1.5, 3, 0.5, 0x555555, 2.5, 3, -0.5, 0.4); } }
    else if (k === 'ice') { if (R() < 0.6) this.spawn(p.x + (R() - 0.5) * 70, 16, p.z + (R() - 0.5) * 70, 1.5, -4 - R() * 2, 0.5, 0xffffff, 0.13, 4, 0); }
    else if (R() < 0.25) this.spawn(p.x + (R() - 0.5) * 70, 10 + R() * 6, p.z + (R() - 0.5) * 70, 2.5, -1.2, 0.8, [0xff9ecb, 0xffffff, 0x9be060][Math.floor(R() * 3)], 0.13, 5, 0);
  }
  init() {
    if (this.dead) return;
    const T = THREE, el = this.mountRef.current; if (T.ColorManagement) T.ColorManagement.legacyMode = false;
    const r = this.renderer = new T.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(devicePixelRatio, 1.5)); el.appendChild(r.domElement);
    r.domElement.style.display = 'block';
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.15; r.outputEncoding = T.sRGBEncoding;
    const sc = this.scene = new T.Scene(); sc.background = new T.Color(0x160503); sc.fog = new T.Fog(0x3a0c04, 70, 240);
    this.camera = new T.PerspectiveCamera(55, 1, 0.1, 500); this.camera.position.set(0, 4, -9);
    const size = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; r.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); this.W0 = w; this.H0 = h; };
    // (Blokvane: a TV browser without ResizeObserver follows the window's size instead)
    size(); this.size = size; if (window.ResizeObserver) { this.ro = new ResizeObserver(size); this.ro.observe(el); } else { this.onRs = size; window.addEventListener('resize', size); }
    this.hemi = new T.HemisphereLight(0xffffff, 0x444444, 0.5); sc.add(this.hemi);
    const dl = this.dl = new T.DirectionalLight(0xffffff, 1.5); dl.position.set(25, 45, -15); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024);
    const sc2 = dl.shadow.camera; sc2.left = -34; sc2.right = 34; sc2.top = 34; sc2.bottom = -34; sc2.near = 1; sc2.far = 130; dl.shadow.bias = -0.0008; sc.add(dl);
    this.up = new T.DirectionalLight(0xff5a1a, 0.7); this.up.position.set(0, -10, 0); sc.add(this.up);
    const side = new T.MeshStandardMaterial({ color: 0x2a2520, roughness: 0.7, metalness: 0.5 });
    this.platform = new T.Mesh(new T.CylinderGeometry(1, 0.94, 2.4, 72), [side, new T.MeshStandardMaterial({ roughness: 0.55, metalness: 0.6 }), side]);
    this.platform.position.y = -1.2; this.platform.receiveShadow = true; sc.add(this.platform);
    this.ring = new T.Mesh(new T.TorusGeometry(0.995, 0.008, 6, 96), new T.MeshBasicMaterial({ color: 0xffc23a })); this.ring.rotation.x = Math.PI / 2; this.ring.position.y = 0.02; sc.add(this.ring);
    this.posts = []; const pgeo = new T.CylinderGeometry(0.18, 0.22, 0.35, 8), pmat = new T.MeshBasicMaterial({ color: 0xffb040 });
    for (let i = 0; i < 24; i++) { const m = new T.Mesh(pgeo, pmat); sc.add(m); this.posts.push(m); }
    this.buildArena(this.state.arena);
    this.marks = []; this.tmInit(sc); this.skInit(sc);
    this.R = 30; this.setR();
    const pg = new T.BoxGeometry(1, 1, 1); this.parts = [];
    for (let i = 0; i < 400; i++) { const m = new T.Mesh(pg, new T.MeshBasicMaterial({ transparent: true })); m.visible = false; sc.add(m); this.parts.push({ m, life: 0 }); }
    const pt = this.tex(128, (g, s) => { g.clearRect(0, 0, s, s); for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, d = Math.random() * s * 0.24, x = s / 2 + Math.cos(a) * d, y = s / 2 + Math.sin(a) * d, r = s * (0.1 + Math.random() * 0.16), q = g.createRadialGradient(x, y, 0, x, y, r); q.addColorStop(0, 'rgba(255,255,255,.34)'); q.addColorStop(0.6, 'rgba(255,255,255,.12)'); q.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = q; g.fillRect(x - r, y - r, r * 2, r * 2); } }); this.puffs = []; this.smC = new T.Color(0x9a9a9a); this.fC = [[0xfff3c0, 0xff9a20, 0x8a1a00], [0xd8ecff, 0x5a9cff, 0xff7a18]].map(a => a.map(h => new T.Color(h)));
    for (let i = 0; i < 260; i++) { const m = new T.Sprite(new T.SpriteMaterial({ map: pt, transparent: true, depthWrite: false })); m.visible = false; sc.add(m); this.puffs.push({ m, life: 0, c0: new T.Color(), c1: new T.Color() }); }
    this.rings = []; const rg = new T.RingGeometry(0.88, 1, 48);
    for (let i = 0; i < 5; i++) { const m = new T.Mesh(rg, new T.MeshBasicMaterial({ color: 0x7fe9ff, transparent: true, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.visible = false; sc.add(m); this.rings.push({ m, t: 1 }); }
    // (Blokvane: the drawing starts at the quality this screen can take: a TV starts lower and the game's own AUTO
    // goes on from there)
    this.cars = []; this.pickups = []; this.rockets = []; this.mines = []; this.lobs = []; this.slicks = []; this.fxs = []; this.debris = []; this.ramps = []; this.vents = []; this.bumpers = []; this.crusher = null; this.zone = null; this.rec = []; this.fl = new T.PointLight(0xffa040, 0, 45, 2); sc.add(this.fl); this.autoQ = this.q0; this.applyQ(); this.shake = 0; this.camH = 0; this.orbit = 0;
    // (Blokvane: the cars come from Blokvane's own pages; a car that can't be fetched is tried once more, and if it still
    // can't, the game's own drawn car takes its place, so a match never waits for ever)
    this.gp = {}; this.loadCar = d => this.gp[d.name] || (this.gp[d.name] = new Promise(res => { let tries = 0; const go = () => new T.GLTFLoader().load(this.base + d.gltf, gl => { if (this.dead) return res(); const o = gl.scene, bx = new T.Box3().setFromObject(o), sz = bx.getSize(new T.Vector3()), c = bx.getCenter(new T.Vector3()), k = d.l / Math.max(sz.z, sz.x);
      o.scale.multiplyScalar(k); o.position.set(-c.x * k, -bx.min.y * k, -c.z * k); let body = null;
      o.traverse(n => { if (n.isMesh) for (const m of [].concat(n.material)) if (/Scarlet gloss|cobalt blue paint|Yellow striped supercar|\w+ textured body finish|Purple night coupe|Metallic \w+ paint|Turquoise metallic body|Pink heart coupe metallic|Lime green metallic|Blue ice supercar metallic/.test(m.name)) body = m; });
      body = body || new T.MeshStandardMaterial(); (this.gcars = this.gcars || {})[d.name] = { scene: o, k, wr: d.wr, body, base: body.color.clone(), rough: body.roughness }; res(); if (this.phase === 'select') this.showPreview(this.state.carIdx); }, undefined, () => { if (++tries < 2 && !this.dead) setTimeout(go, 1500); else res(); }); go(); }));
    this.frame = this.frame.bind(this); this.raf = requestAnimationFrame(this.frame);
    this.emit('ready');
  }
  setR() { if (this.floorL) for (const m of this.floorL) { const rp = this.R * 2 / m.userData.tile, mp = m.material.map; m.scale.set(this.R, this.R, 1); mp.repeat.set(rp, rp); mp.offset.set(0.5 - rp / 2, 0.5 - rp / 2); } if (this.decal) this.decal.scale.set(this.R, this.R, 1); this.platform.scale.set(this.R, 1, this.R); this.ring.scale.set(this.R, this.R, 1);
    for (let i = 0; i < this.posts.length; i++) { const a = i / this.posts.length * 6.2832; this.posts[i].position.set(Math.sin(a) * (this.R - 0.35), 0.17, Math.cos(a) * (this.R - 0.35)); } }

  makeCar(def, color) {
    const T = THREE, g = this.buildCar(def, color), wz = this.getStyle() === 'Battle' && def.name === 'PICKUP' && !def.glb && !def.gltf ? -0.3 : def.cz; g.updateMatrixWorld(true);
    const tu = g.userData.turret, ok = h => { let o = h.object; while (o) { if (o === tu) return false; o = o.parent; } return true; };
    const rcd = this.gcars && this.gcars[def.name]; if (rcd && rcd.mounts) { g.userData.mounts = rcd.mounts; g.userData.hm = rcd.hm; g.userData.top = rcd.top; g.userData.wz = wz; this.carExtras(g, def, color); return g; }
    const down = (x, z) => { const h = new T.Raycaster(new T.Vector3(x, 10, z), new T.Vector3(0, -1, 0)).intersectObject(g.userData.ch, true).find(ok); return h ? h.point.y : -99; };
    const pad = (z0, maxH) => { const y0 = down(0, z0); if (y0 < 0) return { x: 0, y: 1, z: z0, L: 0.7, W: 0.5, H: maxH, za: z0 - 0.2, zb: z0 + 0.2 }; let za = z0, zb = z0, xa = 0;
      for (let d = 0.2; d <= 1.21; d += 0.2) { if (Math.abs(down(0, z0 + d) - y0) < 0.16) zb = z0 + d; else break; } for (let d = 0.2; d <= 1.21; d += 0.2) { if (Math.abs(down(0, z0 - d) - y0) < 0.16) za = z0 - d; else break; }
      const zc = (za + zb) / 2; for (let d = 0.2; d <= 1.01; d += 0.2) { if (Math.abs(down(d, zc) - y0) < 0.16 && Math.abs(down(-d, zc) - y0) < 0.16) xa = d; else break; }
      return { x: 0, y: y0 - 0.02, z: zc, L: Math.max(0.7, zb - za + 0.2), W: Math.max(0.5, xa * 2 + 0.2), H: maxH, za, zb }; };
    const roof = pad(wz, 1.0), hood = pad(def.l * 0.3, 0.6), rear = pad(-def.l * 0.36, 0.7), hm = this.hmap(g, tu); roof.k = 'roof'; hood.k = 'hood'; rear.k = 'rear';
    const side = sx => ({ k: 'side', sx, x: 0, y: roof.y * 0.45, z: roof.z, L: 1.0, W: 0.45, H: 0.6 }), mounts = [roof, hood, rear, side(1), side(-1)];
    g.userData.mounts = mounts; g.userData.hm = hm; g.userData.top = roof.y + 0.02; g.userData.wz = wz; if (rcd) { rcd.mounts = mounts; rcd.hm = hm; rcd.top = roof.y + 0.02; } this.carExtras(g, def, color); return g;
  }
  triScan(geo, mw, C, put) { const P = geo.attributes.position, I = geo.index, n = I ? I.count : P.count, v = this._tv || (this._tv = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]);
    for (let t = 0; t + 2 < n; t += 3) { for (let q = 0; q < 3; q++) { v[q].fromBufferAttribute(P, I ? I.getX(t + q) : t + q); if (mw) v[q].applyMatrix4(mw); }
      const ax = v[0].x, ay = v[0].y, az = v[0].z, bx = v[1].x - ax, by = v[1].y - ay, bz = v[1].z - az, cx = v[2].x - ax, cy = v[2].y - ay, cz = v[2].z - az, e = Math.sqrt(Math.max(bx * bx + by * by + bz * bz, cx * cx + cy * cy + cz * cz, (bx - cx) ** 2 + (by - cy) ** 2 + (bz - cz) ** 2)), sN = Math.min(40, Math.ceil(e / C));
      if (sN <= 1) { put(ax, ay, az); put(ax + bx, ay + by, az + bz); put(ax + cx, ay + cy, az + cz); continue; }
      for (let i = 0; i <= sN; i++) for (let j = 0; i + j <= sN; j++) { const u = i / sN, w = j / sN; put(ax + bx * u + cx * w, ay + by * u + cy * w, az + bz * u + cz * w); } } }
  hmap(g, skip) {
    const T = THREE, ch = g.userData.ch, bb = new T.Box3(), ms = [], C = 0.06, YB = 0.08; g.updateMatrixWorld(true);
    ch.traverse(o => { if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return; let q = o; while (q && q !== skip) q = q.parent; if (!q) { ms.push(o); bb.expandByObject(o); } });
    if (!ms.length) return null;
    const x0 = bb.min.x - C, z0 = bb.min.z - C, nx = Math.ceil((bb.max.x - x0) / C) + 2, nz = Math.ceil((bb.max.z - z0) / C) + 2, ny = Math.ceil(Math.max(0.1, bb.max.y) / YB) + 2;
    const tp = new Float32Array(nx * nz).fill(-9), sR = new Float32Array(nz * ny).fill(-9), sL = new Float32Array(nz * ny).fill(9);
    const put = (x, y, z) => { const i = Math.floor((x - x0) / C), j = Math.floor((z - z0) / C); if (i < 0 || j < 0 || i >= nx || j >= nz) return; const t = j * nx + i; if (y > tp[t]) tp[t] = y; const q = j * ny + Math.max(0, Math.min(ny - 1, Math.floor(y / YB))); if (x > sR[q]) sR[q] = x; if (x < sL[q]) sL[q] = x; if (y > 0.3) { if (z < zmn) zmn = z; if (z > zmx) zmx = z; } }; let zmn = 9, zmx = -9;
    for (const o of ms) this.triScan(o.geometry, o.matrixWorld, C, put);
    const top = new Float32Array(nx * nz).fill(-9); for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { let mx = -9; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < nx && b < nz && tp[b * nx + a] > mx) mx = tp[b * nx + a]; } top[j * nx + i] = mx; }
    return { x0, z0, C, nx, nz, ny, YB, top, sR, sL, zmin: zmn, zmax: zmx }; }
  hTop(h, x, z) { const i = Math.floor((x - h.x0) / h.C), j = Math.floor((z - h.z0) / h.C); return i < 0 || j < 0 || i >= h.nx || j >= h.nz ? -9 : h.top[j * h.nx + i]; }
  hSide(h, sg, y0, y1, z0, z1) { let m = 0; const j0 = Math.max(0, Math.floor((z0 - h.z0) / h.C)), j1 = Math.min(h.nz - 1, Math.floor((z1 - h.z0) / h.C)), b0 = Math.max(0, Math.floor(y0 / h.YB)), b1 = Math.min(h.ny - 1, Math.floor(y1 / h.YB));
    for (let j = j0; j <= j1; j++) for (let b = b0; b <= b1; b++) { const v = sg > 0 ? h.sR[j * h.ny + b] : -h.sL[j * h.ny + b]; if (v > m) m = v; } return m; }
  makeWeapon(type) {
    const T = THREE, P = this.wPro || (this.wPro = {});
    if (!P[type]) { const w = window.CCWeapons && CCWeapons.byKey[type]; if (!w) return new T.Group();
      const m = w.build(T), b = new T.Box3().setFromObject(m), sz = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3()), C = 0.05;
      const x0 = b.min.x - c.x, z0 = b.min.z - c.z, nx = Math.ceil(sz.x / C) + 1, nz = Math.ceil(sz.z / C) + 1, a = new Float32Array(nx * nz).fill(99);
      const put = (x, y, z) => { const i = Math.floor((x - c.x - x0) / C), j = Math.floor((z - c.z - z0) / C); if (i >= 0 && j >= 0 && i < nx && j < nz && y < a[j * nx + i]) a[j * nx + i] = y; };
      m.updateMatrixWorld(true); m.traverse(o => { if (o.isMesh) this.triScan(o.geometry, o.matrixWorld, C, put); }); m.position.set(-c.x, 0, -c.z);
      P[type] = { m, sz, bt: { x0, z0, nx, nz, C, a } }; }
    const p = P[type], g = new T.Group(); g.add(p.m.clone()); g.userData = { sz: p.sz, bt: p.bt, shared: true }; return g;
  }
  pickSlot(c, type) { const ms = c.mesh.userData.mounts || [], W = this.W[type], pr = W && W[3] === 'behind' ? [2, 0, 1, 3, 4] : /^(mortar|drone|tesla|emp|sonic)$/.test(type) ? [0, 2, 1, 3, 4] : /^(saw|glove|hammer|harpoon|magnet|flamer)$/.test(type) ? [1, 3, 4, 0, 2] : [0, 1, 3, 4, 2];
    for (const i of pr) if (i < c.slots.length && ms[i] && !c.slots[i]) return i; return -1; }
  placeW(u, mt, wm, def) {
    const T = THREE, q = wm.userData.sz || { x: 1, y: 1, z: 1 }, B = wm.userData.bt, h = u.hm, sd = mt.k === 'side', D = window.CCWeapons && CCWeapons.mats ? CCWeapons.mats(T) : {}, l = def ? def.l : 4.4, w = def ? def.w : 2.1;
    const tg = { roof: [0.44, 0.6, 0.95], hood: [0.4, 0.55, 0.8], rear: [0.36, 0.55, 0.8], side: [0.3, 0.32, 0.62] }[mt.k] || [0.4, 0.5, 0.8];
    const s = Math.max(0.3, Math.min(tg[0] * l / q.z, tg[1] * w / q.x, tg[2] / q.y)), L = q.z * s, Wd = q.x * s, Hh = q.y * s; wm.scale.setScalar(s);
    const occ = u.occ || (u.occ = []), ovl = (x0, x1, y0, y1, z0, z1) => { let v = 0; for (const o of occ) { const ox = Math.min(x1, o.x1) - Math.max(x0, o.x0), oy = Math.min(y1, o.y1) - Math.max(y0, o.y0), oz = Math.min(z1, o.z1) - Math.max(z0, o.z0); if (ox > 0 && oy > 0 && oz > 0) v += ox * oy * oz; } return v / Math.max(1e-3, (x1 - x0) * (y1 - y0) * (z1 - z0)); };
    let x = mt.x, y = mt.y, z = mt.z, gap = 0, bg = null;
    const part = (sx, sy, sz, px, py, pz, mat) => { if (!bg) { bg = new T.Group(); bg.scale.setScalar(1 / s); wm.add(bg); } const me = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat || D.dark); me.position.set(px, py, pz); me.castShadow = me.receiveShadow = true; me.userData.own = true; bg.add(me); return me; };
    if (sd) {
      let best = null; for (let zc = mt.z - 0.5; zc <= mt.z + 0.5 + 1e-6; zc += 0.1) { const e = h ? this.hSide(h, mt.sx, y - 0.04, y + Hh, zc - L / 2, zc + L / 2) : 1.05, xc = mt.sx * (e + Wd / 2 + 0.05), sc = e + 0.3 * Math.abs(zc - mt.z) + 5 * ovl(xc - Wd / 2, xc + Wd / 2, y, y + Hh, zc - L / 2, zc + L / 2); if (!best || sc < best[0]) best = [sc, zc, xc]; }
      z = best[1]; x = best[2]; const eb = h ? Math.max(0.3, this.hSide(h, mt.sx, y - 0.34, y, z - 0.3, z + 0.3)) : 1.05, ix = mt.sx * eb - x, al = Math.min(0.55, L * 0.45);
      part(Math.abs(ix) + 0.05, 0.06, al, ix / 2, -0.03, 0, D.gun); part(0.04, 0.34, al + 0.12, ix + mt.sx * 0.02, -0.17, 0, D.armor);
      for (const dz of [-al * 0.35, al * 0.35]) { const x0 = ix + mt.sx * 0.03, y0 = -0.3, x1 = ix * 0.3, y1 = -0.05, st = part(Math.hypot(x1 - x0, y1 - y0), 0.04, 0.045, (x0 + x1) / 2, (y0 + y1) / 2, dz, D.steel); st.rotation.z = Math.atan2(y1 - y0, x1 - x0); }
    } else if (h && B) {
      const zr = mt.k === 'hood' ? [mt.za - 0.2, Math.max(mt.za - 0.2, h.zmax - L * 0.3)] : mt.k === 'rear' ? [Math.min(mt.zb + 0.2, h.zmin + L * 0.3), mt.zb + 0.2] : [mt.za - 0.3, mt.zb + 0.3];
      let best = null;
      for (let zc = zr[0]; zc <= zr[1] + 1e-6; zc += 0.04) { let m = -9, sup = -9;
        for (let j = 0; j < B.nz; j++) for (let i = 0; i < B.nx; i++) { const b = B.a[j * B.nx + i]; if (b > 50) continue; const t = this.hTop(h, x + (B.x0 + (i + 0.5) * B.C) * s, zc + (B.z0 + (j + 0.5) * B.C) * s); if (t < -5) continue; const d = t - b * s; if (d > m) m = d; if (b < 0.08 && t > sup) sup = t; }
        if (m < -5) continue; const gp = sup > -5 ? Math.max(0, m - sup) : 0.6, sc = m + 0.8 * gp + 0.25 * Math.abs(zc - mt.z) + 5 * ovl(x - Wd / 2, x + Wd / 2, m, m + Hh, zc - L / 2, zc + L / 2); if (!best || sc < best[0]) best = [sc, zc, m, gp]; }
      if (best) { z = best[1]; y = best[2] - 0.01; gap = best[3]; }
      if (gap > 0.025) { let bx0 = 9, bx1 = -9, bz0 = 9, bz1 = -9; for (let j = 0; j < B.nz; j++) for (let i = 0; i < B.nx; i++) if (B.a[j * B.nx + i] < 0.08) { const px = B.x0 + (i + 0.5) * B.C, pz = B.z0 + (j + 0.5) * B.C; bx0 = Math.min(bx0, px); bx1 = Math.max(bx1, px); bz0 = Math.min(bz0, pz); bz1 = Math.max(bz1, pz); }
        if (bx1 > bx0) part((bx1 - bx0) * s * 0.85, gap + 0.05, (bz1 - bz0) * s * 0.85, (bx0 + bx1) / 2 * s, -(gap + 0.05) / 2 + 0.01, (bz0 + bz1) / 2 * s, D.dark); }
    }
    wm.position.set(x, y, z); wm.userData.mk = mt.k; occ.push({ x0: x - Wd / 2, x1: x + Wd / 2, y0: y, y1: y + Hh, z0: z - L / 2, z1: z + L / 2, wm }); }
  jump(c) { if (!c || c.elim || c.falling || c.air || this.phase !== 'playing' || this.time - (c.jT || -9) < 1.1) return; c.air = true; c.airT = -9; c.vy = 12; c.jT = this.time; c.av *= 0.3; const R = Math.random;
    for (let q = 0; q < 8; q++) this.spawn(c.x + (R() - 0.5) * 2.5, 0.2, c.z + (R() - 0.5) * 2.5, (R() - 0.5) * 5, 1 + R() * 2, (R() - 0.5) * 5, this.dustC, 0.6 + R() * 0.4, 0.6, -0.5, 0.4); if (this.me(c)) this.sfx('CC43', 0.3 * this.mv(c), 1.15); }
  swap(c) { if (!c || c.burst || c.elim || c.falling) return; for (let j = 1; j <= c.slots.length; j++) { const i = (Math.max(0, c.cur) + j) % c.slots.length; if (c.slots[i]) { c.cur = i; break; } } this.syncWeapon(c); if (this.me(c)) { this.pushHud(); this.sv = this.mv(c); this.ws('2c_piston_retract', 0.18); this.sv = 1; } }
  syncWeapon(c) { const u = c.mesh.userData, i = c.slots[c.cur] ? c.cur : c.slots.findIndex(q => q); c.cur = i; c.weapon = i < 0 ? null : c.slots[i].type; c.ammo = i < 0 ? 0 : c.slots[i].ammo; if (u.turret) u.turret.visible = !c.slots[0] && !u.turLost; }
  addWeapon(c, type) { const u = c.mesh.userData, i = this.pickSlot(c, type); if (i < 0) return false; const wm = this.makeWeapon(type); this.placeW(u, u.mounts[i], wm, c.def); u.ch.add(wm);
    c.slots[i] = { type, ammo: 3, wm }; if (u.eng && u.eng.visible) this.hoodW(c, true); if (!c.burst) this.syncWeapon(c); else if (u.turret && i === 0) u.turret.visible = false; return true; }
  useAmmo(c) { c.burst = null; const q = c.slots[c.cur]; if (q && --q.ammo <= 0) { c.mesh.userData.ch.remove(q.wm); q.wm.traverse(n => { if (n.userData.own && n.geometry) n.geometry.dispose(); }); const u0 = c.mesh.userData; if (u0.occ) u0.occ = u0.occ.filter(o => o.wm !== q.wm); c.slots[c.cur] = null; } this.syncWeapon(c); if (this.me(c)) this.pushHud(); }
  repair(c, quiet) { const u = c.mesh.userData; c.dmg = 0; c.nLost = 0; c.pull = 0; c.rollOff = 0; c.pitchOff = 0; for (const w of u.wh) if (w.lost) { w.lost = false; w.n.visible = true; } u.turLost = false; if (u.turret) u.turret.visible = !c.slots[0];
    u.body.color.copy(u.base); u.body.roughness = u.shared ? u.rough : 0.28; u.ch.scale.set(1, 1, 1); u.ch.rotation.y = 0; if (c.dz) c.dz.fill(0); if (u.dU) { u.dU.uD.value.set(0, 0, 0, 0); u.dU.uK.value.set(0, 0, 0, 0); u.dU.uP.value.set(0, 0, 0, 0); u.dU.uB.value.set(0, 0); } for (const m of u.glassM || []) { m.color.copy(m.userData.c0); m.roughness = m.userData.r0; }
    for (let i = 0; i < 14; i++) this.spawn(c.x + (Math.random() - 0.5) * 3, 0.5 + Math.random() * 2, c.z + (Math.random() - 0.5) * 3, 0, 2 + Math.random() * 2, 0, 0x3ddc84, 0.22, 0.7, 0);
    if (this.me(c) && !quiet) { this.tell(c, 'CAR REPAIRED'); this.eShot(c.def, 'downshift', 0.5 * this.mv(c)); } }
  repairMesh() { const T = THREE, g = new T.Group(), gm = new T.MeshStandardMaterial({ color: 0x1f9d55, roughness: 0.4, metalness: 0.2 }), wm = new T.MeshBasicMaterial({ color: 0xffffff });
    g.add(new T.Mesh(new T.BoxGeometry(1.1, 1.1, 1.1), gm)); for (const d of [[0.8, 0.25, 1.14], [0.25, 0.8, 1.14], [1.14, 0.25, 0.8], [1.14, 0.8, 0.25]]) g.add(new T.Mesh(new T.BoxGeometry(d[0], d[1], d[2]), wm)); return g; }
  buildCar(def, color) {
    const T = THREE, g = new T.Group(), ch = new T.Group(), fw = [], wh = []; g.add(ch);
    const rc = def.gltf && this.gcars && this.gcars[def.name]; if (rc) { const o = rc.scene.clone(true); let tur = null; ch.add(o);
      const bm = rc.body.clone(); o.traverse(n => { if (n.isMesh) { n.castShadow = true; n.material = Array.isArray(n.material) ? n.material.map(m => m === rc.body ? bm : m) : n.material === rc.body ? bm : n.material; } if (n.name === 'Roof_Turret') tur = n; if (/^Wheel_F[LR]$/.test(n.name) && n.position.length() > 0.1) { n.userData.flip = Math.abs(n.rotation.x) > 1; fw.push(n); }
        if (/^Wheel_[FR][LR]$/.test(n.name)) wh.push({ n, sx: n.position.x, sz: n.position.z, o: n.children[0] || n, r: rc.wr * rc.k, s: Math.abs(n.rotation.x) > 1 || Math.abs(n.rotation.y) > 1 ? -1 : 1 }); });
      const ds = this.dmgSetup(g, ch, o, rc, bm); g.userData = { ch, fw, wh, body: bm, base: rc.base, rough: rc.rough, turret: tur, shared: true, dU: ds && ds.U, glassM: ds && ds.glass, dmats: ds && ds.mats, bodyM: ds && ds.body, paint: rc.paint }; return g; }
    if (def.glb && this.glbParts) { let bm = null; const wg = {}; for (const p of this.glbParts) { let m = p.mat; if (m.name === 'Glossy racing red') m = bm = bm || m.clone(); const me = new T.Mesh(p.geo, m); me.castShadow = true;
        if (p.wk) { if (!wg[p.wk]) { const pv = new T.Group(), sp = new T.Group(); pv.position.copy(p.c); pv.add(sp); ch.add(pv); wg[p.wk] = sp; wh.push({ o: sp, r: p.c.y, s: 1 }); if (p.c.z > 0) fw.push(pv); } wg[p.wk].add(me); } else ch.add(me); }
      bm = bm || new T.MeshStandardMaterial(); g.userData = { ch, fw, wh, body: bm, base: bm.color.clone() }; return g; }
    const body = new T.MeshStandardMaterial({ color, roughness: 0.28, metalness: 0.55 }), glass = new T.MeshStandardMaterial({ color: 0x0a1018, roughness: 0.08, metalness: 0.9 });
    const dark = new T.MeshStandardMaterial({ color: 0x15171c, roughness: 0.6, metalness: 0.3 }), tyre = new T.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.95 }), rim = new T.MeshStandardMaterial({ color: 0xc8ccd4, roughness: 0.25, metalness: 0.9 });
    const ext = (pts, w, mat, bv) => { if (bv === undefined) bv = 0.1; const sh = new T.Shape(); pts.forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
      const geo = new T.ExtrudeGeometry(sh, { depth: w - bv * 2, bevelEnabled: bv > 0, bevelSize: bv, bevelThickness: bv, bevelSegments: bv > 0.15 ? 4 : 2 }); geo.rotateY(-Math.PI / 2); geo.translate(w / 2 - bv, 0, 0);
      const m = new T.Mesh(geo, mat); ch.add(m); return m; };
    const box = (sx, sy, sz, mat, x, y, z) => { const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat); m.position.set(x, y, z); ch.add(m); return m; };
    const st = this.getStyle(), toy = st === 'Toy', low = st === 'Low-poly';
    const L = def.l / 2 - 0.1, y0 = 0.42, yb = 0.3 + def.bh, z0 = def.cz - def.cl / 2, z1 = def.cz + def.cl / 2, top = 0.3 + def.bh + def.ch;
    const hl = new T.MeshBasicMaterial({ color: 0xfff3c4 }), tl = new T.MeshBasicMaterial({ color: 0xff2a2a });
    let wr = 0.44, ww = 0.32, ws = 18, rs = 10, wz = def.l * 0.31, wx = def.w / 2 - 0.12;
    let wrF = 0, wrR = 0, noW = false;
    if (st === 'Battle') {
      body.roughness = 0.45; body.metalness = 0.3;
      const acc = body.clone(); acc.color.multiplyScalar(0.5);
      const metal = new T.MeshStandardMaterial({ color: 0x9aa1ab, roughness: 0.35, metalness: 0.85 }), brass = new T.MeshStandardMaterial({ color: 0xe0a83c, roughness: 0.35, metalness: 0.7 }), H = def.l / 2, W = def.w, n = def.name;
      const cyl = (rt, rb, h, sg, mat, x, y, z, ax) => { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, sg), mat); if (ax === 'z') m.rotation.x = Math.PI / 2; else if (ax === 'x') m.rotation.z = Math.PI / 2; m.position.set(x, y, z); ch.add(m); return m; };
      const taper = (m, kx, kz) => { const pa = m.geometry.attributes.position; for (let i = 0; i < pa.count; i++) if (pa.getY(i) > 0) { pa.setX(i, pa.getX(i) * kx); pa.setZ(i, pa.getZ(i) * kz); } m.geometry.computeVertexNormals(); return m; };
      const lt = (xf, yh, zh, yt, zt) => { for (const sx of [-1, 1]) { box(0.36, 0.14, 0.08, hl, sx * W * xf, yh, zh); box(0.36, 0.12, 0.08, tl, sx * W * xf, yt, zt); } };
      const tracks = (cnt) => { noW = true; for (const sx of [-1, 1]) { ext([[-H + 0.35, 0.2], [H - 0.35, 0.2], [H - 0.05, 0.6], [H - 0.3, 0.9], [-H + 0.3, 0.9], [-H + 0.05, 0.6]], 0.6, dark, 0.05).position.x = sx * (W / 2 - 0.3);
        for (let i = 0; i < cnt; i++) cyl(0.24, 0.24, 0.05, 10, metal, sx * (W / 2 + 0.01), 0.52, -H + 0.7 + i * (def.l - 1.4) / (cnt - 1), 'x'); } };
      ws = 14;
      if (n === 'ARMORED') {
        tracks(5);
        ext([[-H + 0.3, 0.55], [H - 0.5, 0.55], [H - 0.15, 0.85], [H - 0.9, 1.2], [-H + 0.3, 1.2]], W - 1.0, body, 0.1);
        box(W - 0.1, 0.1, def.l - 0.7, body, 0, 1.0, 0); box(0.5, 0.06, 0.7, acc, -0.3, 1.33, H - 1.7); box(0.4, 0.06, 0.5, acc, 0.35, 1.33, -H + 0.8);
        taper(box(W * 0.62, 0.5, 2.1, body, 0, 1.58, -0.3), 0.78, 0.8);
        cyl(0.28, 0.28, 0.12, 12, acc, 0.25, 1.88, -0.5); cyl(0.02, 0.02, 1.2, 4, dark, -0.45, 2.4, -1.1);
        lt(0.2, 1.02, H - 0.42, 0.9, -H + 0.2);
      } else if (n === 'COMPACT') {
        tracks(3);
        box(W - 0.7, 0.6, def.l - 0.9, brass, 0, 0.95, 0); taper(box(W - 0.5, 0.45, 1.3, body, 0, 1.45, -0.1), 0.85, 0.85);
        cyl(0.42, 0.42, 0.3, 12, metal, 0, 1.8, -0.1);
        const dome = new T.Mesh(new T.SphereGeometry(0.5, 14, 8, 0, 6.2832, 0, 1.5708), rim); dome.position.set(0, 1.95, -0.1); ch.add(dome);
        box(0.5, 0.14, 0.06, hl, 0, 2.12, 0.36); cyl(0.02, 0.02, 0.8, 4, dark, 0.25, 2.7, -0.3);
        for (const sx of [-1, 1]) box(0.3, 0.12, 0.08, tl, sx * 0.3, 1.0, -H + 0.42);
      } else if (n === 'SPORTS') {
        ext([[-H + 0.15, 0.6], [H - 0.15, 0.55], [H - 0.15, 0.8], [0.4, 1.05], [-H + 0.15, 1.1]], W * 0.72, body, 0.12);
        taper(box(W * 0.6, 0.45, 1.5, glass, 0, 1.4, -0.35), 0.75, 0.62); box(W * 0.46, 0.07, 0.95, body, 0, 1.66, -0.35);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.55, 0.1, 1.2, acc, sx * (W / 2 - 0.02), 1.24, sz * H * 0.6);
        box(W * 0.85, 0.12, 0.18, metal, 0, 0.7, H + 0.02);
        lt(0.22, 0.72, H, 0.88, -H); wr = 0.58; ww = 0.42; wx = W / 2 + 0.05; wz = H * 0.6;
      } else if (n === 'MUSCLE') {
        ext([[-L, y0], [L, y0], [L, y0 + (yb - y0) * 0.55], [L - 0.5, yb - 0.06], [z1 + 0.3, yb], [-L + 0.3, yb], [-L, yb - 0.12]], W, body);
        ext([[z0 - 0.25, yb + 0.05], [z1 + 0.45, yb + 0.05], [z1 - 0.25, top], [z0 + 0.15, top]], W * 0.84, glass);
        box(W * 0.8, 0.07, def.cl - 0.3, acc, 0, top + 0.11, def.cz - 0.05);
        for (const sx of [-1, 1]) { box(0.1, 0.4, def.l * 0.5, acc, sx * (W / 2 + 0.02), 0.75, -0.2); }
        box(0.7, 0.16, 0.9, acc, 0, yb + 0.14, 1.3); box(W + 0.2, 0.3, 0.14, metal, 0, 0.6, H + 0.05);
        lt(0.3, 0.42 + (def.bh - 0.1) * 0.4, H - 0.02, 0.36 + def.bh * 0.6, -H - 0.01); wr = 0.48; ww = 0.36;
      } else if (n === 'PICKUP') {
        ext([[-H + 0.15, 0.55], [H - 0.2, 0.55], [H - 0.2, 0.95], [-H + 0.15, 1.05]], W * 0.6, body, 0.12);
        box(W * 0.75, 0.55, 1.5, body, 0, 1.2, -H + 1.0); taper(box(W * 0.66, 0.6, 1.1, body, 0, 1.5, -0.3), 0.85, 0.8); box(W * 0.5, 0.3, 0.06, glass, 0, 1.55, 0.24);
        box(0.7, 0.4, 1.0, metal, 0, 1.25, 1.2); cyl(0.25, 0.3, 0.25, 10, brass, 0, 1.57, 1.2); box(0.8, 0.5, 0.1, dark, 0, 0.85, H - 0.1);
        for (const sx of [-1, 1]) { for (let i = 0; i < 3; i++) cyl(0.07, 0.07, 0.6, 6, brass, sx * 0.45, 1.4, 0.85 + i * 0.35);
          cyl(0.38, 0.38, 0.9, 12, brass, sx * 0.5, 1.9, -H + 0.8); cyl(0.3, 0.38, 0.2, 12, acc, sx * 0.5, 2.45, -H + 0.8); }
        cyl(0.2, 0.32, 0.5, 10, metal, 0, 1.0, -H - 0.1, 'z');
        lt(0.275, 0.8, H - 0.05, 0.85, -H); wrF = 0.46; wrR = 0.64; ww = 0.45; wx = W / 2 + 0.02;
      } else {
        ext([[-H, 0.5], [-H + 0.3, 0.4], [H - 0.4, 0.4], [H, 0.7], [H - 0.5, 1.25], [0.6, 1.35], [0.2, 1.75], [-H + 0.5, 1.75], [-H, 1.3]], W, body, 0.06);
        box(W * 0.7, 0.3, 0.05, glass, 0, 1.57, 0.44).rotation.x = -0.78;
        for (const sx of [-1, 1]) box(0.05, 0.2, 1.0, glass, sx * W / 2, 1.5, -0.6);
        cyl(0.5, 0.55, 0.12, 10, acc, 0, 1.84, -0.7);
        box(W + 0.1, 0.2, 0.15, dark, 0, 0.6, H);
        lt(0.32, 0.86, H - 0.1, 1.0, -H - 0.04); wr = 0.54; ww = 0.4; wx = W / 2 - 0.02;
      }
    } else if (low) {
      body.flatShading = true; body.roughness = 0.75; body.metalness = 0.05; glass.color.set(0x8fd0ff); glass.roughness = 0.4; glass.metalness = 0.1;
      const H = def.l / 2, t2 = 0.42 + def.bh, cl = def.cl + 0.5;
      ext([[-H, 0.5], [-H + 0.25, 0.36], [H - 0.3, 0.36], [H, 0.55], [H - 0.15, t2 - 0.22], [z1 + 0.5, t2], [-H + 0.2, t2 + 0.06], [-H, t2 - 0.15]], def.w, body, 0);
      const cb = box(def.w * 0.86, def.ch + 0.1, cl, glass, 0, t2 + (def.ch + 0.1) / 2, def.cz), pa = cb.geometry.attributes.position;
      for (let i = 0; i < pa.count; i++) if (pa.getY(i) > 0) { pa.setX(i, pa.getX(i) * 0.74); pa.setZ(i, pa.getZ(i) * 0.62 - 0.1); }
      cb.geometry.computeVertexNormals();
      box(def.w * 0.66, 0.08, cl * 0.64, body, 0, t2 + def.ch + 0.13, def.cz - 0.1);
      if (def.name === 'SPORTS' || def.name === 'MUSCLE') { box(def.w * 0.95, 0.07, 0.45, dark, 0, t2 + 0.4, -H + 0.3); for (const sx of [-1, 1]) box(0.08, 0.36, 0.2, dark, sx * def.w * 0.36, t2 + 0.2, -H + 0.3); }
      if (def.name === 'ARMORED') box(def.w + 0.3, 0.5, 0.3, dark, 0, 0.7, H + 0.1);
      for (const sx of [-1, 1]) { box(0.45, 0.16, 0.14, hl, sx * def.w * 0.3, 0.55 + (t2 - 0.77) * 0.5, H - 0.07); box(0.45, 0.14, 0.08, tl, sx * def.w * 0.3, t2 - 0.32, -H); }
      wr = 0.5; ws = 8; rs = 6;
    } else if (toy) {
      body.roughness = 0.2; body.metalness = 0; rim.color.set(0xf4f4f4); rim.metalness = 0; rim.roughness = 0.3;
      const H = def.l * 0.42, bt = 0.75 + def.bh, cz = def.cz * 0.8, c2 = def.cl * 0.42 + 0.1, ct = bt + def.ch + 0.25, wy = bt + (ct - bt) * 0.5;
      ext([[-H + 0.22, 0.6], [H - 0.22, 0.6], [H - 0.22, bt - 0.22], [-H + 0.22, bt - 0.22]], def.w, body, 0.22);
      ext([[cz - c2 + 0.18, bt + 0.1], [cz + c2 - 0.18, bt + 0.1], [cz + c2 - 0.18, ct - 0.18], [cz - c2 + 0.18, ct - 0.18]], def.w * 0.8, body, 0.18);
      box(def.w * 0.58, (ct - bt) * 0.5, 0.06, glass, 0, wy, cz + c2); box(def.w * 0.58, (ct - bt) * 0.5, 0.06, glass, 0, wy, cz - c2);
      for (const sx of [-1, 1]) { box(0.06, (ct - bt) * 0.5, c2 * 1.3, glass, sx * def.w * 0.4, wy, cz);
        const h = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.08, 14), hl); h.rotation.x = Math.PI / 2; h.position.set(sx * def.w * 0.28, 0.4 + (bt - 0.38) * 0.58, H); ch.add(h);
        box(0.36, 0.16, 0.08, tl, sx * def.w * 0.28, 0.4 + (bt - 0.38) * 0.58, -H); }
      const stud = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.14, 16), body); stud.position.set(0, ct + 0.07, cz); ch.add(stud);
      box(def.w * 0.9, 0.2, 0.16, dark, 0, 0.56, H + 0.02); box(def.w * 0.9, 0.2, 0.16, dark, 0, 0.56, -H - 0.02);
      wr = 0.56; ww = 0.44; ws = 20; rs = 14; wz = H * 0.62; wx = def.w / 2 - 0.02;
    } else {
      ext([[-L, y0], [L, y0], [L, y0 + (yb - y0) * 0.55], [L - 0.5, yb - 0.06], [Math.min(L - 0.6, z1 + 0.3), yb], [-L + 0.3, yb], [-L, yb - 0.12]], def.w, body);
      ext([[z0 - 0.25, yb + 0.05], [z1 + 0.45, yb + 0.05], [z1 - 0.25, top], [z0 + 0.15, top]], def.w * 0.84, glass);
      box(def.w * 0.8, 0.07, def.cl - 0.3, body, 0, top + 0.11, def.cz - 0.05);
      if (def.name === 'PICKUP') box(def.w * 0.78, 0.05, z0 + L - 0.5, dark, 0, yb + 0.11, (z0 - 0.3 - L) / 2);
      box(def.w + 0.02, 0.22, 0.2, dark, 0, 0.5, def.l / 2 - 0.04); box(def.w + 0.02, 0.22, 0.2, dark, 0, 0.5, -def.l / 2 + 0.04);
      for (const sx of [-1, 1]) { box(0.42, 0.14, 0.06, hl, sx * def.w * 0.3, 0.42 + (def.bh - 0.1) * 0.4, def.l / 2 + 0.01); box(0.42, 0.12, 0.06, tl, sx * def.w * 0.3, 0.36 + def.bh * 0.6, -def.l / 2 - 0.01); }
      if (def.name === 'ARMORED') box(def.w + 0.3, 0.5, 0.3, dark, 0, 0.7, def.l / 2 + 0.15);
    }
    if (!noW) { const mk = r0 => [new T.CylinderGeometry(r0, r0, ww, ws), new T.CylinderGeometry(r0 * 0.58, r0 * 0.58, ww + 0.03, rs)], rF = wrF || wr, rR = wrR || wr, gF = mk(rF), gR = mk(rR);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const gg = sz > 0 ? gF : gR, pv = new T.Group(); pv.position.set(sx * wx, sz > 0 ? rF : rR, sz * wz);
        const t = new T.Mesh(gg[0], tyre), r = new T.Mesh(gg[1], rim), sp = new T.Group(), rr = sz > 0 ? rF : rR; t.rotation.z = r.rotation.z = Math.PI / 2; sp.add(t); sp.add(r);
        for (let q = 0; q < 3; q++) { const k = new T.Mesh(new T.BoxGeometry(ww + 0.06, rr * 0.16, rr * 1.12), dark); k.rotation.x = q * Math.PI / 3; sp.add(k); }
        pv.add(sp); g.add(pv); wh.push({ o: sp, r: rr, s: 1 }); if (sz > 0) fw.push(pv); } }
    g.traverse(m => { if (m.isMesh) m.castShadow = true; });
    g.userData = { ch, fw, wh, body, base: new T.Color(color) };
    return g;
  }
  getStyle() { return this.carStyle || this.props.carStyle || 'Battle'; }
  cn(def) { return def.name; }
  detach(c, node, r, side, flip) {
    const T = THREE; c.mesh.updateMatrixWorld(true); const p = node.getWorldPosition(new T.Vector3()), m = node.clone(true); m.position.copy(p); m.scale.copy(node.getWorldScale(new T.Vector3())); m.rotation.set(0, c.h + (flip ? Math.PI : 0), 0); m.visible = true; m.userData.shared = true; this.scene.add(m); node.visible = false;
    const rx = Math.cos(c.h), rz = -Math.sin(c.h); this.debris.push({ mesh: m, x: p.x, y: p.y, z: p.z, vx: c.vx * 0.7 + rx * side * 7 + (Math.random() - 0.5) * 3, vy: 6, vz: c.vz * 0.7 + rz * side * 7 + (Math.random() - 0.5) * 3, r, life: 10 });
    for (let i = 0; i < 10; i++) this.spawn(p.x, p.y, p.z, (Math.random() - 0.5) * 10, 2 + Math.random() * 6, (Math.random() - 0.5) * 10, 0xffe08a, 0.13, 0.4, 20);
  }
  loseWheel(c, i) {
    const u = c.mesh.userData, w = u.wh[i]; if (!w || w.lost || !w.n) return; w.lost = true; this.detach(c, w.n, w.r, w.sx > 0 ? 1 : -1, w.s < 0);
    const L = u.wh.filter(q => q.lost); c.nLost = L.length; c.pull = 0; c.rollOff = 0; c.pitchOff = 0;
    for (const q of L) { c.pull += (q.sx > 0 ? -1 : 1) * (q.sz > 0 ? 0.35 : 0.15); c.rollOff -= Math.sign(q.sx) * 0.05; c.pitchOff += q.sz > 0 ? 0.035 : -0.035; }
    const nv = this.me(c) ? 0.6 * this.mv(c) : 0.2 * this.near(c.x, c.z); if (!this.sfx(this.nset(c) ? 'CC39' : 'tire_blowout', nv)) this.crash(0.8, nv); if (this.me(c)) this.cue('CC35', 0.3 * this.mv(c), 1, 1, 0.4); if (this.me(c)) { this.shk(c, 0.6); this.tell(c, 'YOU LOST A WHEEL'); }
  }
  dmgSetup(g, ch, o, rc, bm) { const T = THREE, isPart = n => { for (let p = n; p && p !== o; p = p.parent) if (/^Wheel_|Roof_Turret/.test(p.name)) return true; return false; }, body = []; o.traverse(n => { if (n.isMesh && !isPart(n)) body.push(n); }); if (!body.length) return null;
    if (!rc.dM) { g.updateMatrixWorld(true); const bx = new T.Box3().setFromObject(o); rc.dM = new T.Matrix4().copy(ch.matrixWorld).invert().multiply(body[0].matrixWorld); rc.dMi = rc.dM.clone().invert(); rc.dL = new T.Vector3(Math.max(-bx.min.x, bx.max.x), bx.max.y, Math.max(-bx.min.z, bx.max.z));
      try { const im = bm.map && bm.map.image; if (im) { const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cx = cv.getContext('2d'); cx.drawImage(im, 0, 0, 32, 32); const px = cx.getImageData(0, 0, 32, 32).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < px.length; i += 4) { r += px[i]; gg += px[i + 1]; b += px[i + 2]; } const n = px.length / 4 * 255; rc.paint = new T.Color(r / n, gg / n, b / n).convertSRGBToLinear().multiply(rc.base); } } catch (e) {} }
    const U = { uD: { value: new T.Vector4(0, 0, 0, 0) }, uK: { value: new T.Vector4(0, 0, 0, 0) }, uP: { value: new T.Vector4(0, 0, 0, 0) }, uB: { value: new T.Vector2() }, uQ: { value: new T.Vector4() }, uQB: { value: new T.Vector2() }, uPt: { value: 0 }, uBr: { value: new T.Vector2() }, uL: { value: rc.dL }, uM: { value: rc.dM }, uMi: { value: rc.dMi } }, map = new Map(), glass = [], mats = [];
    const VH = 'uniform vec4 uD; uniform vec3 uL; uniform mat4 uM; uniform mat4 uMi; varying vec3 vCp;\n', VS = 'vec3 d_p = (uM * vec4(transformed, 1.0)).xyz; vCp = d_p; float d_n1 = sin(d_p.x*6.3+d_p.y*4.1)*sin(d_p.y*7.7+d_p.z*5.2+1.3), d_n2 = sin(d_p.z*5.1+d_p.y*6.7+2.1)*sin(d_p.x*8.3+0.7); float d_zf = smoothstep(0.3,1.0,d_p.z/uL.z), d_zr = smoothstep(0.3,1.0,-d_p.z/uL.z), d_sm = 1.0-0.5*abs(d_p.z)/uL.z, d_hy = smoothstep(0.15,0.6,d_p.y/uL.y); float d_zl = smoothstep(0.45,1.0,d_p.x/uL.x)*d_sm, d_zt = smoothstep(0.45,1.0,-d_p.x/uL.x)*d_sm; d_p.z -= d_zf*uD.x*uL.z*0.3*(0.75+0.35*d_n1); d_p.z += d_zr*uD.y*uL.z*0.3*(0.75+0.35*d_n2); d_p.y += (d_zf*uD.x*d_n2+d_zr*uD.y*d_n1)*0.1 + d_zf*uD.x*d_hy*0.08*sin(d_p.z*9.0); d_p.x -= d_zl*uD.z*uL.x*0.3*(0.7+0.4*d_n1); d_p.x += d_zt*uD.w*uL.x*0.3*(0.7+0.4*d_n2); float d_c1 = sin(d_p.z*21.0+d_p.x*6.0)*sin(d_p.x*13.0+d_p.y*9.0), d_c2 = sin(d_p.y*17.0+d_p.z*11.0); d_p.y += (d_zf*uD.x+d_zr*uD.y)*0.035*d_c1; d_p.x += (d_zt*uD.w-d_zl*uD.z)*0.03*d_c2; d_p.z += (d_zr*uD.y-d_zf*uD.x)*0.025*d_c2; transformed = (uMi * vec4(d_p, 1.0)).xyz;';
    const FH = 'uniform vec4 uD; uniform vec4 uK; uniform vec4 uP; uniform vec2 uB; uniform vec4 uQ; uniform vec2 uQB; uniform float uPt; uniform vec3 uL; uniform float uT; uniform float uPa; uniform vec2 uBr; varying vec3 vCp;\nfloat dHole(vec4 P, vec2 B, vec3 q, float rg, float nx) { float dr = step(abs(q.z-0.02)+rg, 0.26)*step(0.28, q.y)*step(q.y, 0.62), du = step(abs(q.z-0.02)+rg*0.3, 0.26)*step(0.62, q.y)*step(q.y, 0.97)*step(0.55, nx); return min(1.0, P.x*step(0.42+rg, q.z)*step(q.z, 0.88)*step(abs(q.x), 0.62)*step(0.42, q.y) + P.y*step(0.42+rg, -q.z)*step(-q.z, 0.9)*step(abs(q.x), 0.62)*step(0.42, q.y) + P.z*max(step(0.6, q.x)*dr, step(0.18, q.x)*du) + P.w*max(step(0.6, -q.x)*dr, step(0.18, -q.x)*du) + B.x*step(0.88+rg*0.25, q.z)*step(q.y, 0.62) + B.y*step(0.9+rg*0.25, -q.z)*step(q.y, 0.62)); }\n', FS = 'vec3 d_q = vCp / uL; vec3 d_cn = cross(dFdx(vCp), dFdy(vCp)); float d_nx = abs(d_cn.x) / max(length(d_cn), 1e-6); float d_g = fract(sin(dot(floor(vCp*38.0), vec3(12.9898,78.233,37.719)))*43758.5453); float d_z = clamp(smoothstep(0.05,0.9,d_q.z)*uD.x + smoothstep(0.05,0.9,-d_q.z)*uD.y + smoothstep(0.1,0.9,d_q.x)*uD.z + smoothstep(0.1,0.9,-d_q.x)*uD.w, 0.0, 1.0); float d_pa = uPa * step(uT, 0.5); float d_pt = fract(sin(dot(floor(vCp*vec3(2.0,6.0,2.5)), vec3(12.9898,78.233,37.719)))*43758.5453), d_g2 = fract(sin(dot(floor(vCp*15.0), vec3(39.346,11.135,83.155)))*43758.5453); float d_l1 = fract(vCp.y*9.0 + 0.5*sin(vCp.z*2.1+vCp.x*1.7) + 0.2*sin(vCp.z*6.3)), d_l2 = fract(dot(vCp, vec3(4.0,11.0,3.0)) + 0.4*sin(vCp.x*3.1+vCp.z*1.3)); float d_sc = clamp(step(0.975, d_l1)*step(0.62, d_pt) + step(0.986, d_l2)*step(0.8, d_pt), 0.0, 1.0) * smoothstep(0.25, 0.7, d_z) * d_pa; float d_ch = step(0.988 - 0.02*d_z, d_g2) * smoothstep(0.4, 0.9, d_z) * d_pa; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.46,0.47,0.49), d_ch*0.85); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.76,0.77,0.79), d_sc*0.8); float d_m = 0.12*d_z*d_pa, d_mt = max(d_sc, d_ch*0.3); float d_lk = 1.0; if (uT > 0.5) { float d_sx = step(0.0, vCp.x); float d_kl = 1.0 - 0.93 * (uT < 1.5 ? mix(uK.y, uK.x, d_sx) : mix(uK.w, uK.z, d_sx)); diffuseColor.rgb *= d_kl; d_lk = d_kl; if (uT > 1.5) { d_lk *= 1.0 + 1.6*uBr.x; diffuseColor.rgb *= 1.0 + 0.25*uBr.x*d_kl; } } float d_rg = 0.04*sin(vCp.x*23.0+vCp.z*17.0); float d_h = dHole(uP, uB, d_q, d_rg, d_nx); bool d_in = abs(d_q.x) < 0.95 && abs(d_q.z) < 0.95 && d_q.y < 0.92; if (uPt > 0.5) { if (dHole(uQ, uQB, d_q, d_rg, d_nx) * (1.0 - d_h) < 0.5) discard; if (!gl_FrontFacing) { diffuseColor.rgb = vec3(0.07, 0.07, 0.075); d_m = 0.7; d_lk = 0.0; d_mt = 0.0; } } else { if (d_h > 0.5) discard; if (!gl_FrontFacing && d_in && dot(uP, vec4(1.0)) + uB.x + uB.y > 0.5) { diffuseColor.rgb = vec3(0.06, 0.06, 0.065); d_m = 0.75; d_lk = 0.0; d_mt = 0.0; } }';
    this.dSh = [VH, VS, FH, FS]; const conv = m => { if (!m || !m.isMeshStandardMaterial) return m; let c = map.get(m); if (c) return c; c = m === bm ? bm : m.clone(); const nm = m.name || '', ty = /rear|ruby|tail/i.test(nm) ? 2 : /headl|lamp|optic|spot l|\bLED\b|\blights?\b/i.test(nm) ? 1 : 0, uT = { value: ty }; if (!ty && /glaz|glass|windshield/i.test(nm)) { c.userData = { c0: c.color.clone(), r0: c.roughness }; glass.push(c); }
      const pa = !ty && (m === bm || /paint|gloss|livery|stripe|pearl|metallic|candy|enamel|body/i.test(nm)) && !/glass|glaz|tire|tyre|rubber|rim|wheel|chrome|alloy|carbon|recess|grille|light|lamp|interior/i.test(nm) ? 1 : 0; c.userData.pa = pa; c.onBeforeCompile = this.dInj(U, uT, { value: pa }); c.customProgramCacheKey = () => 'cdmg'; map.set(m, c); mats.push(c); return c; };
    for (const n of body) n.material = Array.isArray(n.material) ? n.material.map(conv) : conv(n.material); return { U, glass, mats, body }; }
  dInj(U, uT, uPa) { const [VH, VS, FH, FS] = this.dSh; return sh => { Object.assign(sh.uniforms, U, { uT, uPa: uPa || { value: 0 } }); sh.vertexShader = VH + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + VS); sh.fragmentShader = FH + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n' + FS).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 1.0, d_m); roughnessFactor = mix(roughnessFactor, 0.3, d_mt);').replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.95, d_mt);').replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\n{ float d_cr = clamp(d_z*1.6, 0.0, 0.85); if (d_cr > 0.02) { vec3 d_fn = normalize(cross(dFdx(vViewPosition), dFdy(vViewPosition))); normal = normalize(mix(normal, d_fn, d_cr)); } }').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= d_lk;'); }; }
  pCut(def, g) {
    const T = THREE, rc = this.gcars && this.gcars[def.name], B = g && g.userData.bodyM; if (!rc || !rc.dM || !B) return null; if (rc.cut) return rc.cut;
    const M = rc.dM, L = rc.dL, NM = new T.Matrix3().getNormalMatrix(M), v = new T.Vector3(), E = [[], [], [], [], [], []];
    const Z = [[-0.62, 0.62, 0.42, 9, 0.38, 0.88], [-0.62, 0.62, 0.42, 9, -0.9, -0.38], [0.6, 9, 0.28, 0.62, -0.28, 0.32], [-9, -0.6, 0.28, 0.62, -0.28, 0.32], [-9, 9, -9, 0.62, 0.86, 9], [-9, 9, -9, 0.62, -9, -0.88]];
    const N = [[-0.62, 0.62, 0.42, 9, 0.42, 0.88], [-0.62, 0.62, 0.42, 9, -0.9, -0.42], [0.6, 9, 0.28, 0.62, -0.24, 0.28], [-9, -0.6, 0.28, 0.62, -0.24, 0.28], [-9, 9, -9, 0.62, 0.88, 9], [-9, 9, -9, 0.62, -9, -0.9]];
    const ZU = [[0.15, 9, 0.6, 0.99, -0.3, 0.32], [-9, -0.15, 0.6, 0.99, -0.3, 0.32]], NU = [[0.15, 9, 0.62, 0.97, -0.26, 0.28], [-9, -0.15, 0.62, 0.97, -0.26, 0.28]];
    B.forEach((n, mi) => { if (Array.isArray(n.material)) return; const G = n.geometry, P = G.attributes.position, I = G.index, nv = P.count, q = new Float32Array(nv * 3), per = [null, null, null, null, null, null];
      for (let i = 0; i < nv; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); q[i * 3] = v.x / L.x; q[i * 3 + 1] = v.y / L.y; q[i * 3 + 2] = v.z / L.z; }
      const nt = Math.floor((I ? I.count : nv) / 3);
      for (let t = 0; t < nt; t++) { const a = I ? I.getX(t * 3) : t * 3, b = I ? I.getX(t * 3 + 1) : t * 3 + 1, e = I ? I.getX(t * 3 + 2) : t * 3 + 2, A = a * 3, Bq = b * 3, C = e * 3;
        const x0 = Math.min(q[A], q[Bq], q[C]), x1 = Math.max(q[A], q[Bq], q[C]), y0 = Math.min(q[A + 1], q[Bq + 1], q[C + 1]), y1 = Math.max(q[A + 1], q[Bq + 1], q[C + 1]), z0 = Math.min(q[A + 2], q[Bq + 2], q[C + 2]), z1 = Math.max(q[A + 2], q[Bq + 2], q[C + 2]);
        for (let k = 0; k < 6; k++) { const z = Z[k]; let hit = !(x1 < z[0] || x0 > z[1] || y1 < z[2] || y0 > z[3] || z1 < z[4] || z0 > z[5]);
          if (!hit && (k === 2 || k === 3)) { const w = ZU[k - 2]; if (!(x1 < w[0] || x0 > w[1] || y1 < w[2] || y0 > w[3] || z1 < w[4] || z0 > w[5])) { const ux = (q[Bq] - q[A]) * L.x, uy = (q[Bq + 1] - q[A + 1]) * L.y, uz = (q[Bq + 2] - q[A + 2]) * L.z, vx = (q[C] - q[A]) * L.x, vy = (q[C + 1] - q[A + 1]) * L.y, vz = (q[C + 2] - q[A + 2]) * L.z, nx = uy * vz - uz * vy, nl = Math.hypot(nx, uz * vx - ux * vz, ux * vy - uy * vx); hit = nl > 0 && Math.abs(nx) / nl > 0.42; } }
          if (hit) (per[k] || (per[k] = [])).push(a, b, e); } }
      per.forEach((l, k) => { if (l) E[k].push({ mi, l, q }); }); });
    rc.cut = E.map((ent, k) => { if (!ent.length) return null; const nb = N[k], bb = new T.Box3(), pts = [];
      for (const { l, q } of ent) { const seen = new Set(); for (const i of l) { if (seen.has(i)) continue; seen.add(i); const x = q[i * 3], y = q[i * 3 + 1], z = q[i * 3 + 2], ob = b => x < b[0] || x > b[1] || y < b[2] || y > b[3] || z < b[4] || z > b[5]; if (ob(nb) && !((k === 2 || k === 3) && !ob(NU[k - 2]))) continue; const p = new T.Vector3(x * L.x, y * L.y, z * L.z); bb.expandByPoint(p); pts.push(p); } }
      if (pts.length < 6) return null; const pv = bb.getCenter(new T.Vector3()), he = bb.getSize(new T.Vector3()).multiplyScalar(0.5).max(new T.Vector3(0.04, 0.04, 0.04)), sup = [];
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) { if (!dx && !dy && !dz) continue; let best = null, bd = -1e9; for (const p of pts) { const d = (p.x - pv.x) * dx / he.x + (p.y - pv.y) * dy / he.y + (p.z - pv.z) * dz / he.z; if (d > bd) { bd = d; best = p; } } if (best && sup.indexOf(best) < 0) sup.push(best); }
      const parts = ent.map(({ mi, l }) => { const G = B[mi].geometry, geo = new T.BufferGeometry(), n = l.length;
        for (const name in G.attributes) { const at = G.attributes[name], s = at.itemSize, o = new Float32Array(n * s);
          for (let j = 0; j < n; j++) { const i = l[j];
            if (name === 'position' || name === 'normal') { v.fromBufferAttribute(at, i); if (name === 'position') v.applyMatrix4(M).sub(pv); else v.applyMatrix3(NM).normalize(); o[j * 3] = v.x; o[j * 3 + 1] = v.y; o[j * 3 + 2] = v.z; }
            else for (let c = 0; c < s; c++) o[j * s + c] = c === 0 ? at.getX(i) : c === 1 ? at.getY(i) : c === 2 ? at.getZ(i) : at.getW(i); }
          geo.setAttribute(name, new T.BufferAttribute(o, s)); }
        geo.computeBoundingSphere(); return { mi, geo }; });
      return { pv, he, bb, sup: sup.map(p => p.clone().sub(pv)), parts, rad: Math.max(he.x, he.z) }; });
    return rc.cut; }
  tearPart(c, k, vol) {
    const T = THREE, u = c.mesh.userData, U = u.dU, cut = U && u.bodyM && this.pCut(c.def, c.mesh), Z = cut && cut[k]; if (!Z) return false;
    const R = Math.random, V = (x, y, z) => new T.Vector3(x, y, z), pv = Z.pv, bb = Z.bb, he = Z.he, P0 = U.uP.value.clone(), B0 = U.uB.value.clone(), q4 = new T.Vector4(), q2 = new T.Vector2();
    if (k < 4) { P0.setComponent(k, 0); q4.setComponent(k, 1); } else { B0.setComponent(k - 4, 0); q2.setComponent(k - 4, 1); }
    const U2 = { uD: { value: U.uD.value.clone() }, uK: { value: U.uK.value.clone() }, uP: { value: P0 }, uB: { value: B0 }, uQ: { value: q4 }, uQB: { value: q2 }, uPt: { value: 1 }, uBr: { value: new T.Vector2() }, uL: U.uL, uM: { value: new T.Matrix4().makeTranslation(pv.x, pv.y, pv.z) }, uMi: { value: new T.Matrix4().makeTranslation(-pv.x, -pv.y, -pv.z) } };
    const grp = new T.Group(), mats = [];
    for (const p of Z.parts) { const sn = u.bodyM[p.mi], src = sn && sn.material; if (!src || Array.isArray(src)) continue; const nm = src.name || '', m = src.clone(), ty = /rear|ruby|tail/i.test(nm) ? 2 : /headl|lamp|optic|spot l|\bLED\b|\blights?\b/i.test(nm) ? 1 : 0;
      m.side = T.DoubleSide; m.onBeforeCompile = this.dInj(U2, { value: ty }, { value: (src.userData && src.userData.pa) || 0 }); m.customProgramCacheKey = () => 'cdmg'; mats.push(m); const me = new T.Mesh(p.geo, m); me.castShadow = true; me.receiveShadow = sn.receiveShadow; grp.add(me); }
    if (!mats.length) return false; grp.userData = { shared: true, dmats: mats };
    if (k < 4) U.uP.value.setComponent(k, 1); else U.uB.value.setComponent(k - 4, 1);
    const sx = k === 2 ? 1 : -1, e = R() < 0.5 ? 1 : -1; let H, A, dir, amax, om, acc, kick;
    if (k === 0) { H = V(pv.x, bb.max.y, bb.min.z); A = V(1, 0, 0); dir = -1; amax = 1 + R() * 0.35; om = 5; acc = 45; kick = V((R() - 0.5) * 2, 3 + R() * 2, -1.5 - R() * 1.5); }
    else if (k === 1) { H = V(pv.x, bb.max.y, bb.max.z); A = V(1, 0, 0); dir = 1; amax = 0.9 + R() * 0.3; om = 4; acc = 40; kick = V((R() - 0.5) * 2, 2.5 + R() * 2, -2 - R() * 2); }
    else if (k < 4) { H = V(sx > 0 ? bb.max.x : bb.min.x, pv.y, bb.max.z); A = V(0, 1, 0); dir = -sx; amax = 0.8 + R() * 0.4; om = 4; acc = 38; kick = V(sx * (2 + R() * 2), 1.5 + R() * 1.5, (R() - 0.5) * 2); }
    else { H = V(e > 0 ? bb.max.x : bb.min.x, bb.max.y, pv.z); A = V(0, 0, 1); dir = e; amax = 0.35 + R() * 0.25; om = 2; acc = 22; kick = V(-e * (1.5 + R() * 2), 0.8 + R(), (k === 4 ? 1 : -1) * (0.5 + R())); }
    const hg = new T.Group(); hg.position.copy(H); u.ch.add(hg); grp.position.copy(pv).sub(H); hg.add(grp);
    const rb = { c, k, U, hg, A, dir, a: 0, om, acc, amax, t: 0, kick, p: V(0, 0, 0), q: new T.Quaternion(), v: V(0, 0, 0), w: V(0, 0, 0), sup: Z.sup, ii: V(3 / (he.y * he.y + he.z * he.z), 3 / (he.x * he.x + he.z * he.z), 3 / (he.x * he.x + he.y * he.y)), rad: Z.rad, th: he.x <= he.y && he.x <= he.z ? 0 : he.y <= he.z ? 1 : 2, age: 0, sl: 0, sleep: false, kT: -9, sT: -9, e: k > 3 ? 0.3 : 0.2, mu: k > 3 ? 0.55 : 0.42, metal: k < 4, gc: 0, imp: 0 };
    this.debris.push({ mesh: grp, rb, life: 40 });
    const fr = this.debris.filter(d => d.rb), cap = this.state.quality === 'LOW' ? 6 : 12; for (let i = 0; i < fr.length - cap; i++) fr[i].life = Math.min(fr[i].life, 1.2);
    const wp = grp.getWorldPosition(V(0, 0, 0)); for (let i = 0; i < 10; i++) this.spawn(wp.x, wp.y, wp.z, (R() - 0.5) * 9, 2 + R() * 5, (R() - 0.5) * 9, 0xffe08a, 0.12, 0.35, 20);
    this.sfx(this.nset(c) ? 'CC38' : 'debris_scatter', (vol || 0.3) * 0.8); return true; }
  rbFree(rb, g) { const T = THREE, R = Math.random, c = rb.c, hg = rb.hg, cq = hg.parent.getWorldQuaternion(new T.Quaternion()), hw = hg.getWorldPosition(new T.Vector3()), ww = rb.A.clone().multiplyScalar(rb.dir * rb.om).applyQuaternion(cq);
    this.scene.attach(g); hg.parent.remove(hg); rb.hg = null; rb.p.copy(g.position); rb.q.copy(g.quaternion);
    rb.v.crossVectors(ww, g.position.clone().sub(hw)).add(rb.kick.applyQuaternion(cq)); rb.v.x += c.vx || 0; rb.v.z += c.vz || 0; if (c.air) rb.v.y += c.vy || 0;
    rb.w.copy(ww); rb.w.x += (R() - 0.5) * 3; rb.w.y += (R() - 0.5) * 3; rb.w.z += (R() - 0.5) * 3; }
  rbUpd(d, dt) {
    const rb = d.rb, g = d.mesh, R = Math.random;
    if (rb.hg) { const c = rb.c, gone = !c.mesh.parent || c.elim || c.falling || !(rb.k < 4 ? rb.U.uP.value.getComponent(rb.k) : rb.U.uB.value.getComponent(rb.k - 4));
      rb.t += dt; rb.om += rb.acc * dt; rb.a = Math.min(rb.amax, rb.a + rb.om * dt); rb.hg.quaternion.setFromAxisAngle(rb.A, rb.a * rb.dir);
      if (gone || rb.a >= rb.amax || rb.t > 0.3) this.rbFree(rb, g); return false; }
    d.life -= dt; rb.age += dt; if (d.life < -6 || rb.p.y < this.floorY) return true;
    if (d.life < 1.2 && (rb.sleep || rb.gc)) { rb.sleep = true; rb.sk = (rb.sk || 0) + dt; rb.p.y -= dt * 0.45; g.position.copy(rb.p); return rb.sk > 1.2; }
    for (const o of this.cars) { if (o.elim || o.falling || o.y > 1.2 || (o === rb.c && rb.age < 0.7) || rb.p.y > 1.6 || rb.age - rb.kT < 0.25) continue; const dx = rb.p.x - o.x, dz = rb.p.z - o.z, dd = Math.hypot(dx, dz), sp = Math.hypot(o.vx, o.vz); if (sp < 2 || dd > o.def.r * 0.85 + rb.rad * 0.5) continue;
      rb.kT = rb.age; rb.sleep = false; rb.sl = 0; const nx = dd ? dx / dd : 0, nz = dd ? dz / dd : 0;
      rb.v.set(o.vx * 0.8 + nx * (2 + sp * 0.15), Math.max(rb.v.y, 1.5 + sp * 0.2), o.vz * 0.8 + nz * (2 + sp * 0.15)); rb.w.x += (R() - 0.5) * (4 + sp * 0.5); rb.w.y += (R() - 0.5) * (3 + sp * 0.3); rb.w.z += (R() - 0.5) * (4 + sp * 0.5);
      this.sfx(rb.metal ? 'hit_medium_03' : 'hit_light_01', Math.min(0.5, 0.12 + sp * 0.02) * this.near(rb.p.x, rb.p.z), 1.05 + R() * 0.2);
      for (let i = 0; i < 5; i++) this.spawn(rb.p.x, rb.p.y + 0.2, rb.p.z, (R() - 0.5) * 6, 1 + R() * 3, (R() - 0.5) * 6, 0xffe08a, 0.1, 0.3, 20); }
    if (rb.sleep) return false;
    this.rbStep(rb, dt); g.position.copy(rb.p); g.quaternion.copy(rb.q);
    if (rb.imp > 2.2 && rb.age - rb.sT > 0.09) { rb.sT = rb.age; const nv = this.near(rb.p.x, rb.p.z), s = Math.min(1, rb.imp / 13);
      this.sfx(rb.metal ? (rb.imp > 7 ? 'hit_medium_03' : 'hit_light_03') : (rb.imp > 7 ? 'hit_light_01' : 'hit_light_02'), (0.08 + 0.4 * s) * nv, (rb.metal ? 1.12 : 1.05) + R() * 0.2);
      if (rb.imp > 6) for (let i = 0; i < 6; i++) this.spawn(rb.p.x + (R() - 0.5) * rb.rad, 0.15, rb.p.z + (R() - 0.5) * rb.rad, (R() - 0.5) * 4, 0.6 + R(), (R() - 0.5) * 4, this.dustC, 0.45 + R() * 0.3, 0.55, -0.4, 0.35); }
    rb.imp = 0; const hs = Math.hypot(rb.v.x, rb.v.z);
    if (rb.gc && rb.lp && hs > 4.5 && rb.metal && R() < 0.6) this.sparks(rb.lp.x, 0.05, rb.lp.z, rb.v.x / hs, 0.35, rb.v.z / hs, 2, hs * 0.7, 0.5);
    if (rb.gc && hs > 6 && rb.age - (rb.scT || -9) > 1.2) { rb.scT = rb.age; this.sfx('scrape_sideswipe', 0.12 * this.near(rb.p.x, rb.p.z), 1.15); }
    return false; }
  rbStep(rb, dt) {
    const T = THREE, n = dt > 0.021 ? 2 : 1, h = dt / n, p = rb.p, v = rb.v, w = rb.w, q = rb.q, t = this._rbT || (this._rbT = { q: new T.Quaternion(), qi: new T.Quaternion(), a: new T.Vector3(), r: [], vp: new T.Vector3(), x: new T.Vector3(), y: new T.Vector3() });
    rb.gc = 0;
    for (let s = 0; s < n; s++) { v.y -= 28 * h; v.multiplyScalar(Math.exp(-0.25 * h)); w.multiplyScalar(Math.exp(-0.3 * h)); p.addScaledVector(v, h);
      const wl = w.length(); if (wl > 1e-5) { t.q.setFromAxisAngle(t.a.copy(w).divideScalar(wl), wl * h); q.premultiply(t.q).normalize(); }
      let cn = 0, pen = 0, ly = 9;
      for (const sp of rb.sup) { const r = t.r[cn] || (t.r[cn] = new T.Vector3()); r.copy(sp).applyQuaternion(q); const y = p.y + r.y; if (y < 0.015 && y > -1.5 && Math.hypot(p.x + r.x, p.z + r.z) < this.R) { pen = Math.max(pen, 0.015 - y); if (y < ly) { ly = y; (rb.lp || (rb.lp = new T.Vector3())).set(p.x + r.x, 0, p.z + r.z); } cn++; } }
      if (!cn) continue; p.y += Math.max(0, pen - 0.004); rb.gc = cn; t.qi.copy(q).invert();
      for (let it = 0; it < 3; it++) for (let i = 0; i < cn; i++) this.rbHit(rb, t.r[i], it === 0, t);
      w.multiplyScalar(Math.exp(-1.2 * h)); if (v.lengthSq() < 0.36) { v.multiplyScalar(Math.exp((cn >= 3 ? -6 : -5) * h)); w.multiplyScalar(Math.exp((cn >= 3 ? -10 : -5) * h)); } }
    if (rb.gc) { rb.gt = (rb.gt || 0) + dt; if (rb.gt < 1) { const a = t.a.set(rb.th === 0 ? 1 : 0, rb.th === 1 ? 1 : 0, rb.th === 2 ? 1 : 0).applyQuaternion(q), ay = a.y; if (Math.abs(ay) < 0.6) { const s = ay >= 0 ? 1 : -1, ax = -a.z * s, az = a.x * s, al = Math.hypot(ax, az) || 1, k = 16 * dt * (1 - Math.abs(ay)); w.x += ax / al * k; w.z += az / al * k; } } }
    if (rb.gc && v.lengthSq() < 0.08 && w.lengthSq() < 0.3) { if ((rb.sl += dt) > 0.35) { rb.sleep = true; v.set(0, 0, 0); w.set(0, 0, 0); } } else rb.sl = Math.max(0, rb.sl - dt * 2); }
  rbHit(rb, r, first, t) {
    const v = rb.v, w = rb.w, q = rb.q, ii = rb.ii, vp = t.vp, x = t.x, y = t.y, iw = o => o.applyQuaternion(t.qi).multiply(ii).applyQuaternion(q);
    vp.crossVectors(w, r).add(v); const vn = vp.y; if (vn >= 0) return;
    iw(x.set(-r.z, 0, r.x)); y.crossVectors(x, r); const e = first && vn < -2.5 ? rb.e : 0, j = -(1 + e) * vn / (1 + y.y);
    v.y += j; w.addScaledVector(x, j); if (first && -vn > rb.imp) rb.imp = -vn;
    vp.crossVectors(w, r).add(v); const ts = Math.hypot(vp.x, vp.z); if (ts < 1e-4) return; const ux = vp.x / ts, uz = vp.z / ts;
    iw(x.set(r.y * uz, r.z * ux - r.x * uz, -r.y * ux)); y.crossVectors(x, r); let jt = -ts / (1 + y.x * ux + y.z * uz); if (jt < -rb.mu * j) jt = -rb.mu * j;
    v.x += ux * jt; v.z += uz * jt; w.addScaledVector(x, jt); }
  zoneFx(c, zi, z0, z1, lx) { const T = THREE, u = c.mesh.userData, U = u.dU, me = this.me(c), vol = me ? 0.45 * this.mv(c) : 0.2 * this.near(c.x, c.z), sh = Math.sin(c.h), cs = Math.cos(c.h), d = c.def, R = Math.random, L = d.l / 2; if (U) U.uD.value.fromArray(c.dz);
    const cross = t => z0 < t && z1 >= t, at = (lxo, lzo) => [c.x + sh * lzo + cs * lxo, c.z + cs * lzo - sh * lxo], shards = (p, col) => { for (let i = 0; i < 9; i++) this.spawn(p[0], 0.9, p[1], (R() - 0.5) * 6, 1 + R() * 4, (R() - 0.5) * 6, col, 0.08, 0.5, 18); };
    const panel = (sx, sy, sz, p, y, mat) => { const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat); m.position.set(p[0], y, p[1]); m.rotation.y = c.h; this.scene.add(m); const ox = p[0] - c.x, oz = p[1] - c.z, n = Math.hypot(ox, oz) || 1; this.debris.push({ mesh: m, x: p[0], y, z: p[1], vx: c.vx * 0.6 + ox / n * 5 + (R() - 0.5) * 3, vy: 4 + R() * 4, vz: c.vz * 0.6 + oz / n * 5 + (R() - 0.5) * 3, r: 0.25, life: 8 }); for (let i = 0; i < 8; i++) this.spawn(p[0], y, p[1], (R() - 0.5) * 9, 2 + R() * 5, (R() - 0.5) * 9, 0xffe08a, 0.12, 0.35, 20); this.sfx(this.nset(c) ? 'CC38' : 'debris_scatter', vol * 0.8); };
    const dark = this.pnlM || (this.pnlM = new T.MeshStandardMaterial({ color: 0x17191d, roughness: 0.6, metalness: 0.5 })), paint = () => new T.MeshStandardMaterial({ color: u.paint || u.base || c.color, roughness: 0.5, metalness: 0.4 });
    if (zi < 2) { const sg = zi ? -1 : 1, lc = zi ? 0xff5a5a : 0xfff3c4;
      if (cross(0.3)) { const side = lx === undefined ? (R() < 0.5 ? 0 : 1) : lx > 0 ? 0 : 1; if (U) U.uK.value.setComponent(zi * 2 + side, 1); shards(at((side ? -1 : 1) * d.w * 0.35, sg * L), lc); this.sfx('glass_headlight', vol); }
      if (cross(0.6)) { if (U) { U.uK.value.setComponent(zi * 2, 1); U.uK.value.setComponent(zi * 2 + 1, 1); } shards(at(0, sg * L), lc); if (!this.tearPart(c, zi + 4, vol)) panel(d.w * 0.9, 0.22, 0.28, at(0, sg * (L + 0.1)), 0.5, dark); this.cue('CC37', vol, 0.3); if (me) this.tell(c, zi ? 'REAR BUMPER TORN OFF' : 'FRONT BUMPER TORN OFF'); }
      if (cross(0.85)) { if (!this.tearPart(c, zi, vol)) { if (U) U.uP.value.setComponent(zi, 1); panel(d.w * 0.7, 0.06, d.l * 0.24, at(0, sg * L * 0.62), 1.3, paint()); } if (!zi) { this.sfx(this.nset(c) ? 'CC36' : 'glass_windshield', vol); for (const m of u.glassM || []) { m.color.set(0x59636d); m.roughness = 0.7; } shards(at(0, L * 0.25), 0xd8ecff); } if (me) this.tell(c, zi ? 'TRUNK LID BLOWN OFF' : 'HOOD BLOWN OFF'); } }
    else { const sg = zi === 2 ? 1 : -1; if (cross(0.4)) { shards(at(sg * d.w / 2, 0), 0xd8ecff); this.sfx('scrape_sideswipe', vol); }
      if (cross(0.7)) { if (!this.tearPart(c, zi, vol)) { if (U) U.uP.value.setComponent(zi, 1); panel(0.08, 0.7, d.l * 0.24, at(sg * (d.w / 2 + 0.1), 0), 0.9, paint()); } this.sfx(this.nset(c) ? 'CC36' : 'glass_windshield', vol * 0.7); if (me) this.tell(c, 'DOOR RIPPED OFF'); } } }
  tmInit(sc) {
    const T = THREE, N = 1600, P = new Float32Array(N * 12), C = new Float32Array(N * 16), UV = new Float32Array(N * 8), I = new Uint32Array(N * 6);
    for (let i = 0; i < N; i++) { const v = i * 4; I.set([v, v + 2, v + 1, v + 1, v + 2, v + 3], i * 6); }
    const g = new T.BufferGeometry(), pa = new T.BufferAttribute(P, 3), ca = new T.BufferAttribute(C, 4), ua = new T.BufferAttribute(UV, 2); pa.setUsage(T.DynamicDrawUsage); ca.setUsage(T.DynamicDrawUsage); ua.setUsage(T.DynamicDrawUsage);
    g.setAttribute('position', pa); g.setAttribute('color', ca); g.setAttribute('uv', ua); g.setIndex(new T.BufferAttribute(I, 1));
    const tx = this.tex(64, (x, s) => { x.clearRect(0, 0, s, s); const gr = x.createLinearGradient(0, 0, s, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.16, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.84, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, s, s); x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,0.4)'; for (let k = 0; k < 8; k++) x.fillRect(0, k * s / 8, s, s / 28); x.fillStyle = 'rgba(0,0,0,0.3)'; for (let k = 0; k < 3; k++) x.fillRect(s * (0.33 + k * 0.17), 0, 2, s); x.globalCompositeOperation = 'source-over'; });
    tx.wrapS = T.ClampToEdgeWrapping; tx.wrapT = T.RepeatWrapping; tx.needsUpdate = true;
    const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0x0b0b0b, map: tx, vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 })); m.frustumCulled = false; m.renderOrder = 1; sc.add(m);
    this.tm = { m, g, P, C, UV, N, i: 0, life: new Float32Array(N), a0: new Float32Array(N), oil: new Uint8Array(N), cx: new Float32Array(N), cz: new Float32Array(N), chk: 0, pd: false, wasAny: false }; }
  tmSeg(st, x, z, a, w, oil) {
    const M = this.tm, t = this.time || 0; if (!M) return;
    if (!st.on || t - (st.t || -9) > 0.12) { st.on = true; st.x = x; st.z = z; st.v = 0; st.e = null; st.t = t; return; }
    st.t = t; const dx = x - st.x, dz = z - st.z, dl = Math.hypot(dx, dz); if (dl < 0.28) return; if (dl > 3) { st.x = x; st.z = z; st.e = null; return; }
    const hw = w / 2, nx = -dz / dl * hw, nz = dx / dl * hw, e0 = st.e || [st.x + nx, st.z + nz, st.x - nx, st.z - nz], e1 = [x + nx, z + nz, x - nx, z - nz], i = M.i = (M.i + 1) % M.N, y = 0.022;
    M.P.set([e0[0], y, e0[1], e0[2], y, e0[3], e1[0], y, e1[1], e1[2], y, e1[3]], i * 12);
    const v0 = st.v, v1 = v0 + dl / 1.3; st.v = v1 > 500 ? v1 - 500 : v1; M.UV.set([0, v0, 1, v0, 0, v1, 1, v1], i * 8);
    M.life[i] = oil ? 10 : 8; M.a0[i] = Math.min(0.92, a); M.oil[i] = oil ? 1 : 0; M.cx[i] = x; M.cz[i] = z; M.pd = true; st.x = x; st.z = z; st.e = e1; }
  tmUpd(dt) {
    const M = this.tm; if (!M) return; const C = M.C, chk = (M.chk -= dt) <= 0; if (chk) M.chk = 0.5; let any = false;
    for (let i = 0; i < M.N; i++) { if (M.life[i] <= 0) continue; any = true; M.life[i] -= dt; if (chk && Math.hypot(M.cx[i], M.cz[i]) > this.R + 0.5) M.life[i] = 0; const al = M.life[i] > 0 ? M.a0[i] * Math.min(1, M.life[i] / 3) : 0, k = M.oil[i] ? 0.55 : 1, o = i * 16;
      for (let q = 0; q < 4; q++) { C[o + q * 4] = k; C[o + q * 4 + 1] = k; C[o + q * 4 + 2] = k; C[o + q * 4 + 3] = al; } }
    if (any || M.wasAny) M.g.attributes.color.needsUpdate = true; M.wasAny = any;
    if (M.pd) { M.g.attributes.position.needsUpdate = true; M.g.attributes.uv.needsUpdate = true; M.pd = false; } }
  tmClear() { const M = this.tm; if (!M) return; M.life.fill(0); M.C.fill(0); M.g.attributes.color.needsUpdate = true; }
  kit() { const T = THREE, g = new T.Group(), add = (geo, mat, x, y, z, rx, ry, rz) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, rz || 0); g.add(m); return m; };
    return { g, box: (a, b, c, mat, x, y, z, rx, ry, rz) => add(new T.BoxGeometry(a, b, c), mat, x, y, z, rx, ry, rz), cyl: (r1, r2, h, mat, x, y, z, rx, ry, rz, sg) => add(new T.CylinderGeometry(r1, r2, h, sg || 16), mat, x, y, z, rx, ry, rz),
      sph: (r, mat, x, y, z, sx, sy, sz) => { const m = add(new T.SphereGeometry(r, 18, 12), mat, x, y, z); m.scale.set(sx || 1, sy || 1, sz || 1); return m; }, tor: (r, t, mat, x, y, z, rx, ry, rz) => add(new T.TorusGeometry(r, t, 8, 28), mat, x, y, z, rx, ry, rz),
      tube: (pts, r, mat) => add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))), 14, r, 7, false), mat, 0, 0, 0) }; }
  bakeG(g) { const T = THREE; g.updateMatrixWorld(true); const by = new Map();
    g.traverse(o => { if (!o.isMesh) return; const s = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); s.applyMatrix4(o.matrixWorld); if (!s.attributes.uv) s.setAttribute('uv', new T.BufferAttribute(new Float32Array(s.attributes.position.count * 2), 2)); if (!by.has(o.material)) by.set(o.material, []); by.get(o.material).push(s); o.geometry.dispose(); });
    const out = new T.Group(); by.forEach((list, mat) => { let n = 0; for (const q of list) n += q.attributes.position.count; const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let o = 0;
      for (const q of list) { const c = q.attributes.position.count; P.set(q.attributes.position.array, o * 3); N.set(q.attributes.normal.array, o * 3); U.set(q.attributes.uv.array, o * 2); o += c; q.dispose(); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('normal', new T.BufferAttribute(N, 3)); geo.setAttribute('uv', new T.BufferAttribute(U, 2)); geo.computeBoundingSphere(); const me = new T.Mesh(geo, mat); me.castShadow = !mat.isMeshBasicMaterial; me.receiveShadow = true; out.add(me); });
    return out; }
  carExtras(g, def, color) {
    const u = g.userData; if (!u.dU || !u.ch) return; const T = THREE, rc = this.gcars && this.gcars[def.name]; if (!rc || !rc.dL) return; const L = rc.dL;
    try {
      g.updateMatrixWorld(true);
      if (!rc.tl) { const inv = new T.Matrix4().copy(u.ch.matrixWorld).invert(), v = new T.Vector3(), mw = new T.Matrix4(), B = [[9, -9, 9, -9, 9, 0], [9, -9, 9, -9, 9, 0]];
        for (const n of u.bodyM || []) { const m = n.material; if (Array.isArray(m) || !/rear|ruby|tail/i.test(m.name || '')) continue; mw.multiplyMatrices(inv, n.matrixWorld); const P = n.geometry.attributes.position;
          for (let i = 0; i < P.count; i += 2) { v.fromBufferAttribute(P, i).applyMatrix4(mw); if (v.z > 0) continue; const b = B[v.x >= 0 ? 0 : 1]; b[0] = Math.min(b[0], v.x); b[1] = Math.max(b[1], v.x); b[2] = Math.min(b[2], v.y); b[3] = Math.max(b[3], v.y); b[4] = Math.min(b[4], v.z); b[5]++; } }
        rc.tl = B.map((b, sd) => b[5] > 3 ? { x: (b[0] + b[1]) / 2, y: (b[2] + b[3]) / 2, z: b[4], w: Math.max(0.12, b[1] - b[0]), ix: sd ? b[1] : b[0] } : { x: (sd ? -1 : 1) * L.x * 0.62, y: L.y * 0.5, z: -L.z * 0.97, w: 0.3, ix: (sd ? -1 : 1) * L.x * 0.42 }); }
      const gt = this.glowTx || (this.glowTx = this.tex(64, (x, sz) => { const gr = x.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, sz, sz); }));
      u.tlS = []; u.xm = [];
      rc.tl.forEach((p, sd) => { for (const k of ['b', 'r']) { const sm = new T.SpriteMaterial({ map: gt, color: k === 'b' ? 0xff2a14 : 0xf4f7ff, transparent: true, opacity: k === 'b' ? 0.14 : 0, blending: T.AdditiveBlending, depthWrite: false }), sp = new T.Sprite(sm);
        sp.scale.set(k === 'b' ? Math.min(1.3, p.w * 1.9 + 0.45) : 0.42, k === 'b' ? 0.62 : 0.36, 1); sp.position.set(k === 'b' ? p.x : p.ix, k === 'b' ? p.y : p.y - 0.03, p.z - 0.06); u.ch.add(sp); u.tlS.push({ s: sp, side: sd, k }); u.xm.push(sm); } });
      const gm = new T.MeshBasicMaterial({ map: gt, color: 0xffffff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false }), gp = new T.Mesh(this.glowPl || (this.glowPl = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), gm);
      gp.scale.set(2.4, 1, 1.8); gp.position.set(0, 0.035, -L.z - 0.8); gp.visible = false; g.add(gp); u.tlG = gp; u.xm.push(gm);
      this.bay(g, rc, color);
    } catch (e) { console.warn('carExtras', e); } }
  bay(g, rc, color) {
    const T = THREE, u = g.userData, L = rc.dL;
    if (!rc.bay) {
      const hm = u.hm, top = (x, z) => hm ? this.hTop(hm, x, z) : -9, S = (c, m, r) => new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r });
      const M = this.bayMats || (this.bayMats = { block: S(0x2b2d31, 0.75, 0.5), red: S(0x9a1c12, 0.35, 0.5), alloy: S(0xb9bec4, 0.9, 0.32), chrome: S(0xeef1f3, 1, 0.14), rubber: S(0x0f0f10, 0, 0.92), liner: S(0x151619, 0.35, 0.85), bat: S(0x1d1e20, 0.1, 0.7), white: S(0xdde2e6, 0, 0.4), fabric: S(0x1b1c1f, 0, 0.95), accent: S(0xb3261e, 0.1, 0.8), dash: S(0x111214, 0.2, 0.7), helmet: S(0xf2f3f5, 0.1, 0.25), visor: S(0x07090c, 0.9, 0.06), glove: S(0x161616, 0, 0.85), screen: new T.MeshBasicMaterial({ color: 0x3a8cff }), suit: S(0xffffff, 0, 0.8) });
      const E = this.kit(), z0 = 0.45 * L.z, z1 = 0.86 * L.z, D = z1 - z0, cz = (z0 + z1) / 2, xw = 0.55 * L.x, Wb = xw * 2, yb = Math.max(0.12, 0.18 * L.y);
      let ht = 9; for (let x = -xw * 0.8; x <= xw * 0.81; x += xw * 0.4) for (let z = z0; z <= z1 + 1e-6; z += D / 4) { const t = top(x, z); if (t > -5) ht = Math.min(ht, t); } if (ht > 8) ht = 0.62 * L.y;
      const yt = Math.max(yb + 0.22, ht - 0.05), H = yt - yb;
      E.box(Wb, 0.03, D, M.liner, 0, yb, cz); for (const sd of [-1, 1]) E.box(0.03, H * 0.95, D, M.liner, sd * xw, yb + H * 0.47, cz); E.box(Wb, H, 0.03, M.liner, 0, yb + H / 2, z0);
      E.box(Wb * 0.88, H * 0.8, 0.07, M.rubber, 0, yb + H * 0.45, z1 - 0.05); for (let i = 0; i < 7; i++) E.box(Wb * 0.86, 0.012, 0.075, M.alloy, 0, yb + H * (0.1 + i * 0.11), z1 - 0.05);
      const fr = Math.min(Wb, H) * 0.3; E.cyl(fr, fr, 0.05, M.rubber, 0, yb + H * 0.45, z1 - 0.13, Math.PI / 2); E.cyl(fr * 0.25, fr * 0.25, 0.08, M.alloy, 0, yb + H * 0.45, z1 - 0.15, Math.PI / 2);
      const bw = Wb * 0.4, bh = H * 0.55, bd = D * 0.52, bz = cz - D * 0.06; E.box(bw, bh, bd, M.block, 0, yb + bh / 2 + H * 0.05, bz);
      for (const sd of [-1, 1]) { E.box(Wb * 0.18, H * 0.15, bd * 0.95, M.red, sd * Wb * 0.16, yb + H * 0.68, bz, 0, 0, -sd * 0.5);
        for (let i = 0; i < 4; i++) { E.cyl(0.018, 0.018, 0.05, M.chrome, sd * Wb * 0.19, yb + H * 0.77, bz - bd * 0.38 + i * bd * 0.25, 0, 0, -sd * 0.5, 6); E.tube([[sd * Wb * 0.24, yb + H * 0.55, bz - bd * 0.33 + i * bd * 0.22], [sd * Wb * 0.33, yb + H * 0.36, bz - bd * 0.3 + i * bd * 0.2], [sd * Wb * 0.31, yb + H * 0.08, bz - bd * 0.45]], 0.022, M.chrome); } }
      E.box(Wb * 0.2, H * 0.14, bd * 0.85, M.alloy, 0, yb + H * 0.76, bz); for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) E.cyl(0.028, 0.028, Wb * 0.1, M.alloy, sd * Wb * 0.09, yb + H * 0.74, bz - bd * 0.33 + i * bd * 0.22, 0, 0, Math.PI / 2 + sd * 0.45, 8);
      const ar = Math.min(Wb * 0.14, D * 0.2); E.cyl(ar, ar, H * 0.1, M.rubber, 0, yt - H * 0.1, bz + bd * 0.1, 0, 0, 0, 20); E.cyl(ar * 1.04, ar * 1.04, 0.025, M.chrome, 0, yt - H * 0.04, bz + bd * 0.1, 0, 0, 0, 20); E.cyl(ar * 0.2, ar * 0.2, 0.04, M.chrome, 0, yt - H * 0.02, bz + bd * 0.1, 0, 0, 0, 8);
      for (const [x, y, r] of [[0, 0.55, 0.11], [Wb * 0.12, 0.3, 0.07], [-Wb * 0.12, 0.32, 0.08]]) E.cyl(r * H * 1.6, r * H * 1.6, 0.05, M.alloy, x, yb + H * y, bz + bd / 2 + 0.03, Math.PI / 2, 0, 0, 16);
      E.box(Wb * 0.17, H * 0.3, D * 0.2, M.bat, xw - Wb * 0.13, yb + H * 0.17, z1 - D * 0.33); E.cyl(0.025, 0.025, 0.04, M.accent, xw - Wb * 0.18, yb + H * 0.34, z1 - D * 0.33, 0, 0, 0, 8); E.cyl(0.025, 0.025, 0.04, M.rubber, xw - Wb * 0.08, yb + H * 0.34, z1 - D * 0.33, 0, 0, 0, 8);
      E.box(Wb * 0.12, H * 0.22, D * 0.16, M.white, -xw + Wb * 0.1, yb + H * 0.4, z0 + D * 0.25); E.cyl(0.035, 0.035, 0.03, M.rubber, -xw + Wb * 0.1, yb + H * 0.53, z0 + D * 0.25, 0, 0, 0, 10);
      E.tube([[0, yb + H * 0.78, z1 - 0.09], [0, yb + H * 0.8, bz + bd / 2 + 0.12], [0, yb + H * 0.7, bz + bd / 2]], 0.035, M.rubber); E.tube([[Wb * 0.25, yb + H * 0.2, z1 - 0.09], [Wb * 0.22, yb + H * 0.25, bz + bd / 2 + 0.1], [Wb * 0.1, yb + H * 0.3, bz + bd / 2]], 0.03, M.rubber);
      for (const sd of [-1, 1]) { E.cyl(0.08, 0.1, H * 0.75, M.liner, sd * (xw - 0.1), yb + H * 0.38, cz - D * 0.1, 0, 0, 0, 12); E.cyl(0.07, 0.07, 0.04, M.alloy, sd * (xw - 0.1), yb + H * 0.77, cz - D * 0.1, 0, 0, 0, 12); }
      const C = this.kit(), yf = Math.max(0.12, 0.2 * L.y), hr0 = top(0, 0.02 * L.z), hr = hr0 > -5 ? hr0 - 0.06 : L.y * 0.92, sz = -0.05, dx = Math.min(0.36, L.x * 0.34), dz = 0.34 * L.z, hd0 = top(dx, sz - 0.17), hd = Math.min(hr, hd0 > -5 ? hd0 - 0.07 : hr), sc = Math.max(0.5, Math.min(1.05, (hd - yf) / 1.15)), Y = v => yf + v * sc;
      C.box(L.x * 1.2, 0.03, L.z * 0.9, M.liner, 0, yf, 0.02 * L.z);
      for (const sd of [-1, 1]) { const x = sd * dx; C.box(0.5, 0.12 * sc, 0.52, M.fabric, x, Y(0.14), sz); C.box(0.52, 0.66 * sc, 0.12, M.fabric, x, Y(0.52), sz - 0.3, -0.22); C.box(0.3, 0.2 * sc, 0.12, M.fabric, x, Y(0.96), sz - 0.39, -0.22); for (const b of [-1, 1]) C.box(0.07, 0.5 * sc, 0.16, M.accent, x + b * 0.25, Y(0.5), sz - 0.28, -0.22); }
      C.box(0.22, 0.26 * sc, 0.75, M.dash, 0, Y(0.14), sz + 0.15); C.cyl(0.02, 0.02, 0.18 * sc, M.chrome, 0, Y(0.32), sz + 0.32, 0.3, 0, 0, 6); C.sph(0.04, M.rubber, 0, Y(0.41), sz + 0.35);
      C.box(L.x * 1.2, 0.24 * sc, 0.42, M.dash, 0, Y(0.66), dz); C.box(0.34, 0.12 * sc, 0.03, M.screen, dx, Y(0.74), dz - 0.22); C.box(0.24, 0.1 * sc, 0.03, M.screen, 0, Y(0.68), dz - 0.22);
      const cz2 = sz - 0.48, rx = L.x * 0.5; let hh = hr; for (const q of [-rx, 0, rx]) { const t = top(q * 0.9, cz2); if (t > -5) hh = Math.min(hh, t - 0.1); } if (hh > yf + 0.5) C.tube([[-rx, yf, cz2], [-rx * 0.9, hh, cz2], [rx * 0.9, hh, cz2], [rx, yf, cz2]], 0.03, M.chrome);
      const x = dx, wz = dz - 0.32, wy = Y(0.72);
      C.box(0.4, 0.5 * sc, 0.24, M.suit, x, Y(0.55), sz - 0.17, -0.2); C.sph(0.12, M.suit, x, Y(0.8), sz - 0.2, 1.9, 0.7, 1.1); C.cyl(0.05, 0.06, 0.1 * sc, M.suit, x, Y(0.86), sz - 0.2);
      C.sph(0.15 * sc, M.helmet, x, Y(1.0), sz - 0.17); C.sph(0.12 * sc, M.visor, x, Y(1.0), sz - 0.17 + 0.1 * sc, 1.05, 0.5, 0.7); C.tor(0.15 * sc, 0.012, M.accent, x, Y(1.0), sz - 0.17, Math.PI / 2, 0, 0);
      for (const sd of [-1, 1]) { C.tube([[x + sd * 0.1, Y(0.22), sz - 0.02], [x + sd * 0.11, Y(0.3), sz + 0.42], [x + sd * 0.1, Y(0.06), sz + 0.68]], 0.07, M.suit); C.box(0.1, 0.08, 0.22, M.glove, x + sd * 0.1, Y(0.04), sz + 0.74);
        C.tube([[x + sd * 0.21, Y(0.76), sz - 0.2], [x + sd * 0.25, Y(0.55), sz + 0.05], [x + sd * 0.15, wy, wz - 0.04]], 0.05, M.suit); C.sph(0.05, M.glove, x + sd * 0.15, wy, wz - 0.02); }
      C.cyl(0.03, 0.03, 0.3, M.dash, x, wy + 0.05, wz + 0.15, Math.PI / 2 - 0.35, 0, 0, 8);
      const eG = this.bakeG(E.g), cG = this.bakeG(C.g), sw = new T.Group(), swi = new T.Group(); swi.name = 'swi'; sw.position.set(x, wy, wz); sw.rotation.x = 0.35; sw.add(swi);
      swi.add(new T.Mesh(new T.TorusGeometry(0.17, 0.022, 8, 28), M.rubber)); swi.add(new T.Mesh(new T.BoxGeometry(0.3, 0.035, 0.02), M.dash)); const sp2 = new T.Mesh(new T.BoxGeometry(0.035, 0.16, 0.02), M.dash); sp2.position.y = -0.08; swi.add(sp2); cG.add(sw);
      rc.bay = { eG, cG, engTop: yt, suit: M.suit }; }
    const B = rc.bay, eng = B.eG.clone(), cab = B.cG.clone(), suit = new T.MeshStandardMaterial({ color: new T.Color(color || '#888888'), roughness: 0.8, metalness: 0 });
    cab.traverse(n => { if (n.isMesh && n.material === B.suit) n.material = suit; }); eng.visible = cab.visible = false; u.ch.add(eng); u.ch.add(cab);
    u.eng = eng; u.cab = cab; u.sw = cab.getObjectByName('swi'); u.engTop = B.engTop; (u.xm || (u.xm = [])).push(suit); }
  carVis(c) { const u = c.mesh.userData; if (!u.dU) return; const P = u.dU.uP.value, Bq = u.dU.uB.value, K = u.dU.uK.value, br = c.brk || 0, rv = c.rev || 0; u.dU.uBr.value.set(br, rv);
    if (u.tlS) { const kl = Bq.y > 0.5 ? [0, 0] : [1 - K.z, 1 - K.w]; for (const t of u.tlS) t.s.material.opacity = (t.k === 'b' ? 0.14 + 0.86 * br : rv) * kl[t.side];
      if (u.tlG) { const m = u.tlG.material; m.opacity = Math.min(1, (br * 0.3 + rv * 0.55) * Math.max(kl[0], kl[1])); if (rv > br) m.color.setRGB(1, 0.95, 0.9); else m.color.setRGB(1, 0.2, 0.12); u.tlG.visible = m.opacity > 0.01; } }
    if (u.eng) { const o = P.x > 0.5; if (u.eng.visible !== o) { u.eng.visible = o; this.hoodW(c, o); } }
    if (u.cab) { const o = P.z > 0.5 || P.w > 0.5; u.cab.visible = o; if (o && u.sw) u.sw.rotation.z = (c.inp ? c.inp.steer : 0) * 1.5; } }
  hoodW(c, open) { const u = c.mesh.userData, t = u.turret; if (t && u.dU) { if (t.userData.y0 === undefined) t.userData.y0 = t.position.y; t.position.y = t.userData.y0; if (open) { c.mesh.updateMatrixWorld(true); const T = THREE, bb = new T.Box3().setFromObject(t), wp = u.ch.worldToLocal(bb.getCenter(new T.Vector3())); if (wp.z > 0.3 * u.dU.uL.value.z) { ws = t.parent.getWorldScale(new T.Vector3()).y || 1, lo = u.ch.worldToLocal(new T.Vector3(0, bb.min.y, 0).add(new T.Vector3(c.mesh.position.x, 0, c.mesh.position.z))).y; t.position.y = t.userData.y0 - Math.max(0, lo - ((u.engTop || 0.5) + 0.02)) / ws; } } } for (const q of c.slots || []) { if (!q || !q.wm || q.wm.userData.mk !== 'hood') continue; const w = q.wm; if (w.userData.y0 === undefined) w.userData.y0 = w.position.y; w.position.y = open ? Math.min(w.userData.y0, (u.engTop || 0.5) + 0.03) : w.userData.y0; } }
  dent(c, s, wx, wz) {
    if (c.shield > 0 || c.elim || c.falling) return; c.dmg = Math.min(1, c.dmg + s * 0.22); const u = c.mesh.userData; this.dk = this.dk || new THREE.Color(0x1a1a1a);
    { const z = c.dz || (c.dz = [0, 0, 0, 0]); let zi, lx; if (wx === undefined || (!wx && !wz)) zi = Math.floor(Math.random() * 4); else { const sh = Math.sin(c.h), cs = Math.cos(c.h), lz = wx * sh + wz * cs; lx = wx * cs - wz * sh; zi = Math.abs(lz) * 0.8 >= Math.abs(lx) ? (lz > 0 ? 0 : 1) : lx > 0 ? 2 : 3; } const z0 = z[zi]; for (let q = 0; q < 4; q++) if (q !== zi) z[q] = Math.min(1, z[q] + s * 0.15); z[zi] = Math.min(1, z0 + s * 0.8); this.zoneFx(c, zi, z0, z[zi], lx); }
    u.body.color.copy(u.base); u.body.roughness = Math.min(1, (u.shared ? u.rough : 0.28) + c.dmg * 0.06);
    if (!u.dU) u.ch.scale.set(1 + c.dmg * 0.05, 1 - c.dmg * 0.08, 1 - c.dmg * 0.1); u.ch.rotation.y = (c.i % 2 ? 1 : -1) * c.dmg * 0.05;
    if (u.turret && !u.turLost && c.dmg > 0.55) { u.turLost = true; if (u.turret.visible) this.detach(c, u.turret, 0.4, 0, 0); u.turret.visible = false; }
    if (!c.nLost && s > 0.5 && c.dmg > 0.85 && Math.random() < 0.3) { const left = u.wh.map((w, i) => i).filter(i => !u.wh[i].lost && u.wh[i].n); if (left.length) this.loseWheel(c, left[Math.floor(Math.random() * left.length)]); }
  }
  // (Blokvane: a player's name is longer than "P1": the label gets wider for it, at the same size of letters. pic: their
  // Boo or photo, drawn in a circle before the name, in the garage)
  label(text, color, pic) {
    const T = THREE, long = pic || text.length > 6, W = long ? 512 : 256, t = this.tex(256, (g) => { if (long) { g.canvas.width = W; g.canvas.height = 256; } g.clearRect(0, 0, W, 256); g.font = '700 44px "Chakra Petch",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      let txt = text; while (g.measureText(txt).width > W - 60 - (pic ? 64 : 0) && txt.length > 2) txt = txt.slice(0, -2) + '…';
      const ps = pic ? 64 : 0, w = g.measureText(txt).width + 36 + ps; g.fillStyle = 'rgba(10,14,26,.8)'; g.fillRect(W / 2 - w / 2, 98, w, 60); g.fillStyle = color; g.fillRect(W / 2 - w / 2, 152, w, 6); g.fillStyle = '#fff'; g.fillText(txt, W / 2 + ps / 2, 128);
      if (pic) { const x0 = W / 2 - w / 2 + 10; g.save(); g.beginPath(); g.arc(x0 + 26, 127, 24, 0, 7); g.fillStyle = '#fff'; g.fill(); g.clip(); try { if (pic.width) g.drawImage(pic, x0 + 2, 103, 48, 48); } catch (e) {} g.restore(); } });
    if (long) t.needsUpdate = true;
    const s = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(long ? 8.4 : 4.2, 4.2, 1); return s;
  }
  dispose(o) { this.scene.remove(o); if (o.userData.shared) { if (o.userData.body) o.userData.body.dispose(); if (o.userData.dmats) o.userData.dmats.forEach(m => m.dispose()); if (o.userData.xm) o.userData.xm.forEach(m => m.dispose()); return; } o.traverse(n => { if (n.geometry) n.geometry.dispose(); }); }
  clearWorld() {
    for (const c of this.cars) { this.eKill(c); this.dispose(c.mesh); }
    for (const a of [this.pickups, this.rockets, this.mines, this.lobs, this.slicks, this.fxs, this.debris]) for (const o of a) { this.dispose(o.mesh); if (o.sh) this.dispose(o.sh); }
    this.cars = []; this.pickups = []; this.rockets = []; this.mines = []; this.lobs = []; this.slicks = []; this.fxs = []; this.debris = [];
    if (this.propG) { this.dispose(this.propG); this.propG = null; } this.ramps = []; this.vents = []; this.bumpers = []; this.crusher = null; this.zone = null;
    for (const p of this.parts) { p.life = 0; p.m.visible = false; } for (const p of this.puffs || []) { p.life = 0; p.m.visible = false; }
    this.tmClear(); this.skClear();
  }
  showPreview(i) {
    if (!this.scene) return; if (this.preview) this.dispose(this.preview);
    this.preview = null; if (!this.gcars || !this.gcars[this.CARS[i].name]) return; this.preview = this.makeCar(this.CARS[i], this.COLORS[0]); this.scene.add(this.preview);
    const ch = this.preview.userData.ch; this.pvDef = this.CARS[i]; this.pvD = { y: 13, vy: 0, n: 0, t: 0, sq: 0, cy: ch ? ch.position.y : 0 }; this.preview.position.y = 13; if (this.pvCar && this.pvCar.en) { this.pvCar.en.on = false; this.pvCar.lnd = false; }
  }

  initAudio() {
    if (this.ac) { this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const a = this.ac = new AC(); const nb = this.nbuf = a.createBuffer(1, a.sampleRate, a.sampleRate), d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const out = this.out = a.createGain(), comp = a.createDynamicsCompressor(); out.gain.value = 0.6; out.connect(comp); comp.connect(a.destination);
    const rv = this.rev = a.createConvolver(), rl = Math.floor(a.sampleRate * 1.4), rb = a.createBuffer(2, rl, a.sampleRate); for (let ch = 0; ch < 2; ch++) { const dd = rb.getChannelData(ch); for (let i = 0; i < rl; i++) dd[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.5); }
    rv.buffer = rb; const rg = a.createGain(); rg.gain.value = 0.3; rv.connect(rg); rg.connect(out);
    const g = this.engG = a.createGain(), f = this.engF = a.createBiquadFilter(), ws = a.createWaveShaper(), cv = new Float32Array(256); for (let i = 0; i < 256; i++) cv[i] = Math.tanh((i / 127.5 - 1) * 3); ws.curve = cv;
    f.type = 'lowpass'; f.frequency.value = 300; f.Q.value = 1.5; g.gain.value = 0; ws.connect(f); f.connect(g); g.connect(out);
    this.engO = [['sawtooth', 1, 0.5], ['square', 0.5, 0.4], ['sawtooth', 2.02, 0.15]].map(([type, m, lv]) => { const o = a.createOscillator(), l = a.createGain(); o.type = type; o.frequency.value = 30 * m; o.m = m; o.l = l; l.gain.value = lv; o.connect(l); l.connect(ws); o.start(); return o; });
    const en = a.createBufferSource(), enf = a.createBiquadFilter(), eng = a.createGain(), am = a.createGain(); en.buffer = nb; en.loop = true; enf.type = 'bandpass'; enf.frequency.value = 220; enf.Q.value = 0.6; eng.gain.value = 0.5; am.gain.value = 0.5; this.engN = eng; this.smpG = a.createGain(); this.smpG.gain.value = 0; { const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1900; lp.Q.value = 0.5; this.smpG.connect(lp); lp.connect(out); } this.ebuf = {}; this.eB = {}; this.eBus = a.createGain(); { const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32; this.eBus.connect(hp); hp.connect(out); } this.sbuf = {}; this.loops = {}; this.sfxT = {}; this.wls = {}; this.nrm = {}; this.wsT = {};
    this.wsA = { rocket_fire: '1a_rocket_launch', rocket_impact: '1a_rocket_explosion', missile_fire: '1b_missile_salvo', missile_impact: '1b_missile_explosion', minigun_loop: '1c_minigun_fire_loop', minigun_spinup: '1c_minigun_spin_up', cannon_fire: '1d_cannon_fire', cannon_impact: '1d_cannon_impact', flame_loop: '1e_flame_loop', flame_ignite: '1e_flame_start', tesla_zap: '1f_tesla_shockwave', mine_deploy: '1g_mine_drop', mine_explosion: '1g_mine_explosion', railgun_fire: '1h_railgun_fire', mortar_fire: '1i_mortar_fire', mortar_whistle: '1i_mortar_whistle', mortar_impact: '1i_mortar_impact', saw_loop: '2a_saw_loop', saw_spinup: '2a_saw_spin_up', magnet_loop: '2b_magnet_hum_loop', magnet_power: '2b_magnet_power_on', hammer_strike: '2c_piston_slam', oil_splat: '2d_oil_spray_burst', emp_pulse: '2e_emp_blast', harpoon_launch: '2f_harpoon_fire', harpoon_hit: '2f_harpoon_hit', glove_punch: '2g_glove_launch', drone_deploy: '2h_drone_launch', drone_impact: '2h_bomb_explosion', sonic_wave: '2i_sonic_boom', laser_loop: '2j_laser_beam_loop', laser_start: '2j_laser_start' };
    this.wsGap = { '1b_missile_salvo': 1.2, '2a_saw_shred': 0.9, '2b_magnet_clamp': 1.5, '2d_oil_splat': 1, '1a_rocket_launch': 0.3 };
    this.wlEnd = { '1c_minigun_fire_loop': '1c_minigun_spin_down', '1e_flame_loop': '1e_flame_stop', '2j_laser_beam_loop': '2j_laser_stop' };
    ["1a_rocket_explosion","1a_rocket_launch","1b_missile_explosion","1b_missile_salvo","1c_minigun_fire_loop","1c_minigun_spin_down","1c_minigun_spin_up","1d_cannon_fire","1d_cannon_impact","1d_cannon_reload","1e_flame_loop","1e_flame_start","1e_flame_stop","1f_tesla_shockwave","1f_tesla_zap_hit","1g_mine_drop","1g_mine_explosion","1h_railgun_fire","1h_railgun_impact","1i_mortar_fire","1i_mortar_impact","1i_mortar_whistle","1j_freeze_fire","1j_freeze_hit","1j_ice_shatter","2a_saw_loop","2a_saw_shred","2a_saw_spin_up","2b_magnet_clamp","2b_magnet_hum_loop","2b_magnet_power_on","2c_piston_retract","2c_piston_slam","2d_oil_splat","2d_oil_spray_burst","2e_emp_blast","2e_engine_stall","2f_harpoon_fire","2f_harpoon_hit","2f_winch_reel_loop","2g_glove_launch","2g_glove_punch","2g_glove_retract","2h_bomb_explosion","2h_drone_flight_loop","2h_drone_launch","2i_sonic_boom","2j_laser_beam_loop","2j_laser_start","2j_laser_stop"].forEach(n => fetch(this.base + 'assets/wsfx2/' + n + '.wav').then(r => r.arrayBuffer()).then(b => new Promise((res, rej) => a.decodeAudioData(b, res, rej))).then(buf => { const d = buf.getChannelData(0); let pk = 0.01; for (let i = 0; i < d.length; i += 3) { const v = d[i] < 0 ? -d[i] : d[i]; if (v > pk) pk = v; } this.nrm[n] = Math.min(3, 0.85 / pk); this.sbuf[n] = buf; }).catch(() => {}));
    ["cannon_fire_1.ogg","cannon_fire_2.ogg","cannon_impact_1.ogg","cannon_impact_2.ogg","drone_deploy.ogg","drone_impact.ogg","emp_pulse_1.ogg","emp_pulse_2.ogg","flame_ignite.ogg","flame_loop.wav","glove_punch_1.ogg","glove_punch_2.ogg","hammer_strike_1.ogg","hammer_strike_2.ogg","harpoon_hit.ogg","harpoon_launch_1.ogg","harpoon_launch_2.ogg","laser_loop.wav","laser_start.ogg","magnet_loop.wav","magnet_power.ogg","mine_deploy.ogg","mine_explosion_1.ogg","mine_explosion_2.ogg","minigun_loop.wav","minigun_spinup.ogg","missile_fire_1.ogg","missile_fire_2.ogg","missile_impact_1.ogg","missile_impact_2.ogg","mortar_fire.ogg","mortar_impact_1.ogg","mortar_impact_2.ogg","mortar_whistle.ogg","oil_splat.ogg","railgun_fire_1.ogg","railgun_fire_2.ogg","rocket_fire_1.ogg","rocket_fire_2.ogg","rocket_impact_1.ogg","rocket_impact_2.ogg","saw_loop.wav","saw_spinup.ogg","sonic_wave_1.ogg","sonic_wave_2.ogg","tesla_zap_1.ogg","tesla_zap_2.ogg"].forEach(n => fetch(this.base + 'assets/wsfx/' + n).then(r => r.arrayBuffer()).then(b => new Promise((res, rej) => a.decodeAudioData(b, res, rej))).then(buf => { this.sbuf[n.replace(/\.\w+$/, '')] = buf; }).catch(() => {}));
    ["hit_heavy_01","hit_heavy_02","hit_heavy_03","hit_light_01","hit_light_02","hit_light_03","hit_medium_01","hit_medium_02","hit_medium_03","drift_end","drift_loop","drift_start","gravel_skid","handbrake_turn","skid_loop","car_explosion","tire_blowout","crash_guardrail","crash_head_on","crash_rear_end","crash_rollover","crash_side_tbone","crash_wall","brake_emergency","brake_hard_stop","brake_squeal","debris_scatter","glass_headlight","glass_windshield","scrape_grind_loop","scrape_sideswipe","wreck_settle"].forEach(n => fetch(this.base + 'assets/sfx/' + n + '.wav').then(r => r.arrayBuffer()).then(b => new Promise((res, rej) => a.decodeAudioData(b, res, rej))).then(buf => { this.sbuf[n] = buf;
      if (/_loop$/.test(n)) { const src = a.createBufferSource(), g = a.createGain(); src.buffer = buf; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(out); src.start(); this.loops[n] = g; } }).catch(() => {}));
    this.lsrc = {}; this.cueT = {}; for (let i = 1; i <= 50; i++) { if (i >= 45 && i <= 48) continue; const n = 'CC' + (i < 10 ? '0' : '') + i, lp = [24, 25, 30, 31, 32, 33, 34, 40, 41, 44].includes(i); fetch(this.base + 'assets/cc/' + n + (lp ? '.wav' : '.ogg')).then(r => r.arrayBuffer()).then(b => new Promise((res, rej) => a.decodeAudioData(b, res, rej))).then(buf => { this.sbuf[n] = buf;
      if (lp) { const src = a.createBufferSource(), g = a.createGain(); src.buffer = buf; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(out); src.start(); this.loops[n] = g; this.lsrc[n] = src; } }).catch(() => {}); }
    this.engO[0].connect(am); am.connect(eng.gain); en.connect(enf); enf.connect(eng); eng.connect(f); en.start();
    const sg = this.skG = a.createGain(), sf = this.skF = a.createBiquadFilter(), sq = a.createGain(); sg.gain.value = 0; sg.connect(out); sf.type = 'bandpass'; sf.frequency.value = 1200; sf.Q.value = 2.5; sq.gain.value = 0.6; sf.connect(sq); sq.connect(sg);
    this.skO = [1, 1.012, 2.03].map((m, i) => { const o = a.createOscillator(), l = a.createGain(); o.type = i < 2 ? 'sawtooth' : 'triangle'; o.frequency.value = 900 * m; o.m = m; l.gain.value = i < 2 ? 0.35 : 0.15; o.connect(l); l.connect(sf); o.start(); return o; });
    const lfo = a.createOscillator(), lg = a.createGain(); lfo.frequency.value = 7; lg.gain.value = 18; lfo.connect(lg); this.skO.forEach(o => lg.connect(o.frequency)); lfo.start();
    const rn = a.createBufferSource(), rf = a.createBiquadFilter(), rg2 = a.createGain(); rn.buffer = nb; rn.loop = true; rf.type = 'lowpass'; rf.frequency.value = 40; rg2.gain.value = 2.5; rn.connect(rf); rf.connect(rg2); rg2.connect(sq.gain); rn.start();
    const sc = a.createBufferSource(), scf = a.createBiquadFilter(), scg = a.createGain(); sc.buffer = nb; sc.loop = true; sc.playbackRate.value = 0.8; scf.type = 'bandpass'; scf.frequency.value = 650; scf.Q.value = 0.8; scg.gain.value = 0.45; sc.connect(scf); scf.connect(scg); scg.connect(sg); sc.start();
  }
  eVol() { return this.props.engineVol == null ? 1 : this.props.engineVol; }
  eBuf(def, ev) { const a = this.ac, s = this.ENG[this.CARS.indexOf(def)]; if (!a || !s || !this.ebuf) return Promise.resolve(null); const k = s + '/' + ev;
    return this.ebuf[k] || (this.ebuf[k] = fetch(this.base + 'assets/eng/' + s + '/' + ((this.EOV[s] || {})[ev] || 'CCA_Engine_' + s + '_' + ev + '.ogg')).then(r => { if (!r.ok) throw r.status; return r.arrayBuffer(); }).then(b => new Promise((res, rej) => a.decodeAudioData(b, res, rej))).then(b => (this.eB[k] = b)).catch(() => null)); }
  loadEngine(def) { const o = this.EOV[this.ENG[this.CARS.indexOf(def)]]; return Promise.all(this.EB.concat(Object.keys(this.EG), o && o.pull ? ['pull'] : []).map(ev => this.eBuf(def, ev))); }
  ePull(c, e, t, dt, th, sp, sn) { const k = this.ENG[this.CARS.indexOf(c.def)], o = this.EOV[k], b = o && this.eB[k + '/pull']; if (!b) return; const a = this.ac;
    e.acc = (e.acc || 0) + ((sp - (e.psp === undefined ? sp : e.psp)) / Math.max(dt, 0.001) - (e.acc || 0)) * Math.min(1, dt * 6); e.psp = sp; if (!th) e.plX = 0;
    if (!e.pl && !e.plX && th && !c.air && sn < 0.85 && t - (e.plT || -9) > 0.4 && (sp < 3 || e.acc > 2)) { const at = o.pullAt[sn < 0.25 ? 0 : sn < 0.5 ? 1 : 2] + Math.random() * 0.12, src = a.createBufferSource(), g = a.createGain(); src.buffer = b; g.gain.value = 0; src.connect(g); g.connect(this.eBus); src.start(t, at); e.pl = { src, g, t0: t, end: t + b.duration - at, lg: 0 }; }
    if (e.pl) { const stuck = t - e.pl.t0 > 0.6 && (sp < 2.5 || (e.acc < 0.8 && sn < 0.8)), done = t > e.pl.end - 0.3; if (!th || c.air || c.emp > 0 || stuck || done) { if (stuck) e.plX = 1; e.plT = t; this.ePullStop(e, t, done ? 0.15 : 0.07); } } }
  ePullStop(e, t, tc) { const p = e.pl; if (!p) return; e.pl = null; p.g.gain.cancelScheduledValues(t); p.g.gain.setTargetAtTime(0, t, tc); try { p.src.stop(t + tc * 8 + 0.05); } catch (_) {} }
  eShot(def, ev, g) { const a = this.ac, b = a && this.eB && this.eB[this.ENG[this.CARS.indexOf(def)] + '/' + ev]; if (!b || !(g > 0.003)) return null; const src = a.createBufferSource(), G = a.createGain(); src.buffer = b; G.gain.value = g * this.EG[ev] * this.eVol(); src.connect(G); G.connect(this.eBus); src.start(); return { src, g: G }; }
  eMake(c) {
    const a = this.ac; if (!a || !this.eBus) return; const out = a.createGain(), pan = (c.bot || c.pan) && a.createStereoPanner ? a.createStereoPanner() : null; out.gain.value = 0; if (pan) { out.connect(pan); pan.connect(this.eBus); } else out.connect(this.eBus);
    const e = c.en = { out, pan, sl: (this.EOV[this.ENG[this.CARS.indexOf(c.def)]] || {}).sl || 0.45, b: [], ok: false, al: false, on: false, emp: 0, wm: 0, wt: 0, gt: 0, rpm: 0, ld: 0.2, dk: 1, gear: 0, sT: -9, dT: -9, thT: 0, pth: 0, bt: Math.random() * 2, bl: 0, lv: 0, pv: 0 };
    this.loadEngine(c.def).then(bs => { if (c.en !== e) return; if (bs.slice(0, 4).some(b => !b)) { e.fail = true; return; } const t = a.currentTime + 0.03;
      e.b = bs.slice(0, 4).map(b => { const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; s.loop = true; g.gain.value = 0; s.connect(g); g.connect(out); s.start(t, Math.random() * b.duration); return { s, g, w: 0, r: 1 }; }); e.ok = true; });
  }
  eKill(c) { const e = c && c.en, a = this.ac; if (!e || !a) return; c.en = null; const t = a.currentTime; if (e.pl) this.ePullStop(e, t, 0.04); e.out.gain.cancelScheduledValues(t); e.out.gain.setTargetAtTime(0, t, 0.04); for (const v of e.b) { try { v.s.stop(t + 0.3); } catch (_) {} } setTimeout(() => { try { e.out.disconnect(); if (e.pan) e.pan.disconnect(); } catch (_) {} }, 600); }
  eStart(c, g) { const e = c.en, a = this.ac; if (!e || !a) return; const me = this.me(c), s = this.eShot(c.def, 'startup', g * (me ? 0.55 * this.mv(c) : 0.3)); e.on = true; e.wm = 0; e.wt = a.currentTime + (s ? 0.95 : me ? 0.05 : 0.2 + Math.random() * 0.9); }
  eOff(c, g) { const e = c && c.en; if (!e || !e.on) return; e.on = false; this.eShot(c.def, 'shutdown', g * (this.me(c) ? 0.45 * this.mv(c) : 0.3)); }
  ePrev(def) { this.initAudio(); this.applyVol(); const a = this.ac; if (!a || !this.eBus) return; if (this.pvS) { this.pvS.g.gain.setTargetAtTime(0, a.currentTime, 0.06); this.pvS = null; }
    if (!this.pvCar || this.pvCar.def !== def) { this.eKill(this.pvCar); this.pvCar = { def, bot: false, lnd: false }; this.eMake(this.pvCar); }
    const d = this.pvD; if (d && d.n >= 3 && this.pvDef === def && !(this.pvCar.en && this.pvCar.en.on)) this.pvCar.lnd = true; }
  pvStep(dt) { const p = this.preview, d = this.pvD; if (!p || !d) return; const ch = p.userData.ch;
    if (d.n < 3) { d.vy -= 46 * dt; d.y += d.vy * dt; if (d.y <= 0) { const v = -d.vy; d.y = 0; d.n++; d.vy = d.n < 3 && v > 5 ? v * 0.24 : 0; if (!d.vy) d.n = 3; this.pvLand(v, d.n >= 3); } }
    d.t += dt; const w = d.sq * Math.exp(-5 * d.t) * Math.cos(16 * d.t); p.position.y = d.y; if (ch) { ch.position.y = d.cy - 0.2 * w; ch.rotation.x = 0.05 * w; } }
  pvLand(v, done) { const d = this.pvD, k = Math.min(1, v / 30), R = Math.random, def = this.pvDef; if (v > 3) { d.sq = Math.max(0.25, k); d.t = 0; } this.shake = Math.max(this.shake || 0, 0.6 * k);
    for (let q = 0; q < 2 + 16 * k; q++) { const a = R() * 6.28, sp = 2 + R() * 5 * k; this.spawn(Math.sin(a) * 2, 0.2, Math.cos(a) * 2, Math.sin(a) * sp, 0.6 + R() * 2 * k, Math.cos(a) * sp, this.dustC, 0.6 + R() * 0.6, 0.8, -0.5, 0.4); }
    if (this.ac && def && v > 3) { const hv = def.mass >= 1.8; this.sfx('CC11', 0.15 + 0.4 * k, hv ? 0.8 : 1); this.sfx('CC43', 0.12 + 0.35 * k, hv ? 0.85 : 1); }
    if (done && this.pvCar && this.pvCar.def === def) this.pvCar.lnd = true; }
  pvEng(dt) { const pc = this.pvCar, e = pc && pc.en, a = this.ac; if (!e || !e.ok || !a) return; const t = a.currentTime;
    if (pc.lnd && !e.on) { pc.lnd = false; this.eShot(pc.def, 'startup', 0.55); e.on = true; e.wm = 0; e.wt = t + 0.95; e.st = t; e.bt = 2.5 + Math.random() * 2; e.bl = 0; }
    if (e.on && t - e.st > 60) { e.on = false; e.bl = 0; this.eShot(pc.def, 'shutdown', 0.45); }
    e.wm = e.on ? Math.max(0, Math.min(1, (t - e.wt) / 0.45)) : Math.max(0, e.wm - dt / 0.12);
    if (e.wm >= 1) { e.bt -= dt; if (e.bt <= 0) { e.bt = 3 + Math.random() * 4; e.bl = 0.2 + Math.random() * 0.3; e.rv = 0.45 + Math.random() * 0.3; } } e.bl -= dt;
    const th = e.bl > 0 ? 1 : 0, tr = th ? e.rv : 0.02, up = 0.035 + 0.045 * (pc.def.mass || 1.2);
    e.rpm += (tr - e.rpm) * (1 - Math.exp(-dt / (tr > e.rpm ? up : up * 2.5))); e.ld += ((th ? 1 : 0.2) - e.ld) * (1 - Math.exp(-dt / 0.09));
    const lv = 0.45 * this.eVol() * e.wm * (0.55 + 0.45 * e.ld); if (Math.abs(lv - e.lv) > 0.002 || (!lv && e.lv)) { e.out.gain.setTargetAtTime(lv, t, 0.05); e.lv = lv; } if (lv > 0.0005) this.eMix(e, t, 1); }
  eMix(e, t, rf) { const r = e.rpm, q = Math.max(0, Math.min(1, r)), C = this.EC; let i = 0; while (i < 2 && q > C[i + 1]) i++; const u = (q - C[i]) / (C[i + 1] - C[i]);
    for (let j = 0; j < 4; j++) { const v = e.b[j], w = (j === i ? Math.cos(u * 1.5708) : j === i + 1 ? Math.sin(u * 1.5708) : 0) * this.EGB[j], pr = Math.pow(2, (r - C[j]) * (e.sl || 0.45)) * rf;
      if (Math.abs(w - v.w) > 0.003) { v.g.gain.setTargetAtTime(w, t, 0.05); v.w = w; } if (Math.abs(pr - v.r) > 0.004) { v.s.playbackRate.setTargetAtTime(pr, t, 0.06); v.r = pr; } } }
  engines(dt) {
    if (!this.solo) return this.enginesMulti(dt);
    const a = this.ac; if (!a || !this.eBus || !this.cars || !this.cars.length) return; const t = a.currentTime, ph = this.phase, P = this.player, W = this.winner, k = this.keys, tc = this.touch || {}, V = this.eVol(), RV = this.props.rivalEngines == null ? 1 : this.props.rivalEngines,
      cm = this.camera.matrixWorld.elements, cx = this.camera.position.x, cz = this.camera.position.z, L = P && !P.elim;
    this.eSl = (this.eSl || 0) + ((ph === 'playing' && this.slow > 0 ? 1 : 0) - (this.eSl || 0)) * Math.min(1, dt * 5);
    for (const c of this.cars) { const e = c.en; if (!e || !e.ok) continue; const me = c === P, d = c.def, alive = !c.elim && !c.falling, nf = me ? 1 : L ? Math.pow(Math.max(0, 1 - Math.hypot(c.x - P.x, c.z - P.z) / 38), 1.5) : 0.5;
      if (!c.elim && !e.al) this.eStart(c, me ? 1 : ph === 'playing' ? nf * 0.6 : 0); if (c.elim && e.al) e.on = false; e.al = !c.elim;
      if (alive && ph === 'playing') { if (c.emp > 0.9 && !e.emp) { e.emp = 1; e.on = false; } else if (e.emp && !(c.emp > 0.9)) { e.emp = 0; this.eStart(c, me ? 1 : nf * 0.6); } }
      let th = 0, tr = 0.02;
      if (ph === 'countdown') { if (me) th = tc.gas || k.ArrowUp || k.KeyW || (c.pad && c.pad.gas > 0.2 && performance.now() - c.padAt < 900) ? 1 : 0; else { e.bt -= dt; e.bl -= dt; if (e.bt <= 0) { e.bt = 0.8 + Math.random() * 2.2; e.bl = 0.15 + Math.random() * 0.3; } th = e.bl > 0 && e.wm > 0.9 ? 1 : 0; } tr = th ? (me ? 0.8 : 0.55) : 0.02; }
      else if (ph === 'playing' && alive) { const i = c.inp, sp = Math.hypot(c.vx, c.vz), sn = sp / (d.speed * Math.max(0.3, 1 - 0.17 * (c.nLost || 0) - 0.2 * c.dmg)), GL = this.EGL;
        th = !(c.emp > 0) && (i.gas || i.boost || (i.brake && c.vx * Math.sin(c.h) + c.vz * Math.cos(c.h) < 0.5)) ? 1 : 0;
        if (e.gear < 3 && sn > GL[e.gear + 1]) { e.gear++; if (me && th && !c.air && !e.pl && t - e.sT > 0.35) { e.sT = t; this.eShot(d, 'upshift', 0.35); e.dk = 0.55; } }
        else if (e.gear > 0 && sn < GL[e.gear] - 0.08) { e.gear--; if (me && !th && sp > 4 && t - e.sT > 0.8) { e.sT = t; this.eShot(d, 'downshift', 0.3); e.dk = 0.8; } }
        const g = e.gear, u = Math.max(0, Math.min(1.1, (sn - GL[g]) / ((g < 3 ? GL[g + 1] : 1.5) - GL[g]))); tr = [0.06, 0.42, 0.48, 0.58][g] + u * [0.84, 0.5, 0.47, 0.42][g];
        if (c.air) tr = th ? Math.min(1.02, tr + 0.3) : tr * 0.9; else if (th) tr = Math.max(tr, 0.4); if (th && i.boost && c.boost > 0.02) tr = Math.min(1.04, tr + 0.06);
        if (me) this.ePull(c, e, t, dt, th, sp, sn); if (me) { if (th) { e.thT += dt; if (e.dS) { e.dS.g.gain.setTargetAtTime(0, t, 0.06); e.dS = null; } } else { if (e.pth && e.rpm > 0.62 && e.thT > 0.7 && !c.air && t - e.dT > 3.5) { e.dT = t; e.dS = this.eShot(d, 'deceleration', 0.3); e.dk = 0.65; } e.thT = 0; } e.pth = th; } }
      else if (ph === 'victory' && c === W) { if (e.emp) { e.emp = 0; this.eStart(c, 0); } th = 1; tr = 0.62 + Math.sin(this.vt * 4.5) * 0.24; }
      const gate = alive && (ph === 'countdown' || ph === 'playing' || (ph === 'victory' && c === W)) ? 1 : 0, up = 0.035 + 0.045 * (d.mass || 1.2);
      e.gt += (gate - e.gt) * (1 - Math.exp(-dt / (c.falling ? 0.45 : 0.08))); e.wm = e.on ? Math.max(0, Math.min(1, (t - e.wt) / 0.45)) : Math.max(0, e.wm - dt / 0.12);
      e.rpm += (tr - e.rpm) * (1 - Math.exp(-dt / (tr > e.rpm ? up : t - e.sT < 0.2 ? 0.05 : up * 2))); e.ld += ((th ? 1 : 0.2) - e.ld) * (1 - Math.exp(-dt / 0.09)); e.dk += (1 - e.dk) * (1 - Math.exp(-dt / 0.25));
      if (e.pl && !(ph === 'playing' && alive)) this.ePullStop(e, t, 0.08); e.pk = (e.pk || 0) + ((e.pl ? 1 : 0) - (e.pk || 0)) * (1 - Math.exp(-dt / 0.06));
      if (e.pl) { const pg = 0.5 * V * e.gt * e.wm * 0.92 * e.pk; if (Math.abs(pg - e.pl.lg) > 0.002) { e.pl.g.gain.setTargetAtTime(pg, t, 0.03); e.pl.lg = pg; } }
      const lv = (me ? 0.5 : ph === 'victory' ? 0.36 : 0.3 * nf * RV) * V * e.gt * e.wm * e.dk * (0.55 + 0.45 * e.ld) * (1 - 0.88 * e.pk);
      if (Math.abs(lv - e.lv) > 0.002 || (!lv && e.lv)) { e.out.gain.setTargetAtTime(lv, t, 0.04); e.lv = lv; }
      if (e.pan) { const dx = c.x - cx, dz = c.z - cz, pn = Math.max(-1, Math.min(1, (dx * cm[0] + dz * cm[2]) / (Math.hypot(dx, dz) || 1))) * 0.7; if (Math.abs(pn - e.pv) > 0.02) { e.pan.pan.setTargetAtTime(pn, t, 0.05); e.pv = pn; } }
      if (lv > 0.0005) this.eMix(e, t, 1 - 0.22 * this.eSl); }
  }
  // (Blokvane: the engines with several players. The game's own mix gave its one player's car the loud engine with the
  // gear changes, and the others by how near they were. Here every player's car has the gear changes and the pull,
  // as loud as it is near what the TV shows, and all the engines together are kept about as loud as the game's own.)
  enginesMulti(dt) {
    const a = this.ac; if (!a || !this.eBus || !this.cars || !this.cars.length) return; const t = a.currentTime, ph = this.phase, W = this.winner, V = this.eVol(), RV = this.props.rivalEngines == null ? 1 : this.props.rivalEngines,
      cm = this.camera.matrixWorld.elements, cx = this.camera.position.x, cz = this.camera.position.z, nAl = this.cars.filter(c => !c.elim).length, EN = Math.min(1, 2.2 / Math.sqrt(Math.max(1, nAl))), now = performance.now();
    this.eSl = (this.eSl || 0) + ((ph === 'playing' && this.slow > 0 ? 1 : 0) - (this.eSl || 0)) * Math.min(1, dt * 5);
    for (const c of this.cars) { const e = c.en; if (!e || !e.ok) continue; const me = !!c.hum, d = c.def, alive = !c.elim && !c.falling, nf = Math.pow(this.near(c.x, c.z), 1.5), mw = me ? this.mv(c) : 0;
      if (!c.elim && !e.al) this.eStart(c, me ? 1 : ph === 'playing' ? nf * 0.6 : 0); if (c.elim && e.al) e.on = false; e.al = !c.elim;
      if (alive && ph === 'playing') { if (c.emp > 0.9 && !e.emp) { e.emp = 1; e.on = false; } else if (e.emp && !(c.emp > 0.9)) { e.emp = 0; this.eStart(c, me ? 1 : nf * 0.6); } }
      let th = 0, tr = 0.02;
      if (ph === 'countdown') { if (me) th = c.pad && c.pad.gas > 0.2 && now - c.padAt < 900 ? 1 : 0; else { e.bt -= dt; e.bl -= dt; if (e.bt <= 0) { e.bt = 0.8 + Math.random() * 2.2; e.bl = 0.15 + Math.random() * 0.3; } th = e.bl > 0 && e.wm > 0.9 ? 1 : 0; } tr = th ? (me ? 0.8 : 0.55) : 0.02; }
      else if (ph === 'playing' && alive) { const i = c.inp, sp = Math.hypot(c.vx, c.vz), sn = sp / (d.speed * Math.max(0.3, 1 - 0.17 * (c.nLost || 0) - 0.2 * c.dmg)), GL = this.EGL;
        th = !(c.emp > 0) && (i.gas || i.boost || (i.brake && c.vx * Math.sin(c.h) + c.vz * Math.cos(c.h) < 0.5)) ? 1 : 0;
        if (e.gear < 3 && sn > GL[e.gear + 1]) { e.gear++; if (me && th && !c.air && !e.pl && t - e.sT > 0.35) { e.sT = t; this.eShot(d, 'upshift', 0.35 * mw); e.dk = 0.55; } }
        else if (e.gear > 0 && sn < GL[e.gear] - 0.08) { e.gear--; if (me && !th && sp > 4 && t - e.sT > 0.8) { e.sT = t; this.eShot(d, 'downshift', 0.3 * mw); e.dk = 0.8; } }
        const g = e.gear, u = Math.max(0, Math.min(1.1, (sn - GL[g]) / ((g < 3 ? GL[g + 1] : 1.5) - GL[g]))); tr = [0.06, 0.42, 0.48, 0.58][g] + u * [0.84, 0.5, 0.47, 0.42][g];
        if (c.air) tr = th ? Math.min(1.02, tr + 0.3) : tr * 0.9; else if (th) tr = Math.max(tr, 0.4); if (th && i.boost && c.boost > 0.02) tr = Math.min(1.04, tr + 0.06);
        if (me) this.ePull(c, e, t, dt, th, sp, sn); if (me) { if (th) { e.thT += dt; if (e.dS) { e.dS.g.gain.setTargetAtTime(0, t, 0.06); e.dS = null; } } else { if (e.pth && e.rpm > 0.62 && e.thT > 0.7 && !c.air && t - e.dT > 3.5) { e.dT = t; e.dS = this.eShot(d, 'deceleration', 0.3 * mw); e.dk = 0.65; } e.thT = 0; } e.pth = th; } }
      else if (ph === 'victory' && c === W) { if (e.emp) { e.emp = 0; this.eStart(c, 0); } th = 1; tr = 0.62 + Math.sin(this.vt * 4.5) * 0.24; }
      const gate = alive && (ph === 'countdown' || ph === 'playing' || (ph === 'victory' && c === W)) ? 1 : 0, up = 0.035 + 0.045 * (d.mass || 1.2);
      e.gt += (gate - e.gt) * (1 - Math.exp(-dt / (c.falling ? 0.45 : 0.08))); e.wm = e.on ? Math.max(0, Math.min(1, (t - e.wt) / 0.45)) : Math.max(0, e.wm - dt / 0.12);
      e.rpm += (tr - e.rpm) * (1 - Math.exp(-dt / (tr > e.rpm ? up : t - e.sT < 0.2 ? 0.05 : up * 2))); e.ld += ((th ? 1 : 0.2) - e.ld) * (1 - Math.exp(-dt / 0.09)); e.dk += (1 - e.dk) * (1 - Math.exp(-dt / 0.25));
      if (e.pl && !(ph === 'playing' && alive)) this.ePullStop(e, t, 0.08); e.pk = (e.pk || 0) + ((e.pl ? 1 : 0) - (e.pk || 0)) * (1 - Math.exp(-dt / 0.06));
      if (e.pl) { const pg = 0.5 * V * e.gt * e.wm * 0.92 * e.pk * mw; if (Math.abs(pg - e.pl.lg) > 0.002) { e.pl.g.gain.setTargetAtTime(pg, t, 0.03); e.pl.lg = pg; } }
      const lv = (me ? 0.5 * mw : ph === 'victory' ? 0.36 : 0.3 * nf * RV) * EN * V * e.gt * e.wm * e.dk * (0.55 + 0.45 * e.ld) * (1 - 0.88 * e.pk);
      if (Math.abs(lv - e.lv) > 0.002 || (!lv && e.lv)) { e.out.gain.setTargetAtTime(lv, t, 0.04); e.lv = lv; }
      if (e.pan) { const dx = c.x - cx, dz = c.z - cz, pn = Math.max(-1, Math.min(1, (dx * cm[0] + dz * cm[2]) / (Math.hypot(dx, dz) || 1))) * 0.7; if (Math.abs(pn - e.pv) > 0.02) { e.pan.pan.setTargetAtTime(pn, t, 0.05); e.pv = pn; } }
      if (lv > 0.0005) this.eMix(e, t, 1 - 0.22 * this.eSl); }
  }
  tone(f, d, type, g, f2, at) { const a = this.ac; if (!a) return; const o = a.createOscillator(), G = a.createGain(), t = a.currentTime + (at || 0);
    o.type = type || 'square'; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    G.gain.setValueAtTime(0.0001, t); G.gain.exponentialRampToValueAtTime(Math.max(0.0002, (g || 0.07) * (this.sv === undefined ? 1 : this.sv)), t + 0.005); G.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(G); G.connect(this.out); o.start(t); o.stop(t + d + 0.02); }
  nz(d, g, o) { o = o || {}; const a = this.ac; if (!a) return; const src = a.createBufferSource(), f = a.createBiquadFilter(), G = a.createGain(), t = a.currentTime + (o.at || 0);
    src.buffer = this.nbuf; src.loop = true; src.playbackRate.value = 0.7 + Math.random() * 0.6; f.type = o.type || 'lowpass'; f.Q.value = o.q || 0.7; f.frequency.setValueAtTime(o.f || 1500, t); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + d);
    G.gain.setValueAtTime(0.0001, t); G.gain.exponentialRampToValueAtTime(Math.max(0.0002, g * (this.sv === undefined ? 1 : this.sv)), t + (o.atk || 0.004)); G.gain.exponentialRampToValueAtTime(0.001, t + d); src.connect(f); f.connect(G); G.connect(this.out); if (o.rev) G.connect(this.rev);
    src.start(t, Math.random() * 0.5); src.stop(t + d + 0.02); }
  noise(d, g, fc) { this.nz(d, g, { f: fc, to: 80 }); }
  boom(k) { this.tone(95, 0.5 * k + 0.2, 'sine', 0.5 * k, 28); this.nz(0.9 * k + 0.3, 0.45 * k, { f: 900, to: 60, rev: 1 }); this.nz(0.06, 0.3 * k, { type: 'highpass', f: 2500 }); this.nz(0.5, 0.05 * k, { type: 'highpass', f: 4000, at: 0.12, rev: 1 }); }
  whoosh(d, g) { this.nz(d, g, { type: 'bandpass', f: 500, to: 2600, q: 1.2, atk: d * 0.3 }); }
  zap(d, g) { this.tone(95, d, 'sawtooth', g, 70); this.tone(1900, d * 0.5, 'square', g * 0.25, 300); for (let i = 0; i < 4; i++) this.nz(0.03, g, { type: 'highpass', f: 3000, at: i * d / 5 + Math.random() * 0.03 }); }
  sfx(name, vol, rate, at) { const a = this.ac, b = this.sbuf && this.sbuf[name]; if (!a || !b) return null; const now = a.currentTime; if (now - (this.sfxT[name] || -1) < 0.06) return {}; this.sfxT[name] = now;
    const src = a.createBufferSource(), g = a.createGain(); src.buffer = b; src.playbackRate.value = rate || 1; g.gain.value = (vol === undefined ? 1 : vol) * ((this.nrm && this.nrm[name]) || 1); src.connect(g); g.connect(this.out); src.start(now + (at || 0)); return { src, g }; }
  ws(n, vol, at, fade) { if (!this.sbuf) return null; const al = this.wsA && this.wsA[n]; if (al && this.sbuf[al]) n = al; const gp = this.wsGap && this.wsGap[n]; if (gp && this.ac) { const gk = n + (this.src ? this.src.i : ''), now = this.ac.currentTime; if (now - (this.wsT[gk] || -9) < gp) return {}; this.wsT[gk] = now; }
    if (fade) { const r = this.sfx(n, vol * (this.sv === undefined ? 1 : this.sv), 1, at); if (r && r.g) { const t = this.ac.currentTime + (at || 0) + fade; r.g.gain.setTargetAtTime(0, t, 0.12); r.src.stop(t + 0.8); } return r; }
    const k = this.sbuf[n] ? n : n + '_' + (1 + Math.floor(Math.random() * 2)); return this.sfx(k, vol * (this.sv === undefined ? 1 : this.sv), 0.96 + Math.random() * 0.08, at); }
  wl(c, name, vol, start) { const al = this.wsA && this.wsA[name]; if (al && this.sbuf && this.sbuf[al]) name = al; const a = this.ac, b = this.sbuf && this.sbuf[name]; if (!a || !b) return false; const k = c.i + name, t = a.currentTime; let L = this.wls[k];
    if (!L) { const src = a.createBufferSource(), g = a.createGain(); src.buffer = b; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(this.out); src.start(); L = this.wls[k] = { g, last: -9 }; }
    const fresh = t - L.last > 0.6, sv = this.sv === undefined ? 1 : this.sv, end = this.wlEnd && this.wlEnd[name]; if (fresh && start) this.ws(start, vol); L.last = t; L.g.gain.cancelScheduledValues(t); L.g.gain.setTargetAtTime(vol * sv * (this.nrm[name] || 1), t + (fresh && start ? 0.12 : 0), fresh ? 0.14 : 0.04); L.g.gain.setTargetAtTime(0, t + 0.3, 0.08);
    clearTimeout(L.to); if (end) L.to = setTimeout(() => { if (a.state !== 'running') return; this.sv = sv; this.ws(end, vol * 0.9); this.sv = 1; }, 320); return true; }
  // (Blokvane: with several players the TV listens from the middle of what it shows, and hears a little farther: the
  // whole arena is on the screen)
  near(x, z) {
    if (this.solo) { const p = this.player; return p ? Math.max(0.05, Math.min(1, 1 - Math.hypot(x - p.x, z - p.z) / 32)) : 0.4; }
    let d = Math.hypot(x - this.lis.x, z - this.lis.z), R = 55;
    if (this.views.length) { R = 32; for (const w of this.views) if (w.c && !w.c.elim) d = Math.min(d, Math.hypot(x - w.c.x, z - w.c.z)); }
    return Math.max(0.05, Math.min(1, 1 - d / R));
  }
  quietLoops() { if (!this.ac) return; for (const k in this.loops) this.loops[k].gain.setTargetAtTime(0, this.ac.currentTime, 0.08); for (const k in this.wls) { clearTimeout(this.wls[k].to); this.wls[k].g.gain.cancelScheduledValues(this.ac.currentTime); this.wls[k].g.gain.setTargetAtTime(0, this.ac.currentTime, 0.08); } if (this.brS && this.brS.g) { this.brS.g.gain.setTargetAtTime(0, this.ac.currentTime, 0.1); this.brS = null; } for (const h of [this.boS, this.skS]) if (h && h.g) h.g.gain.setTargetAtTime(0, this.ac.currentTime, 0.1); this.boS = this.skS = null; }
  nset(c) { return !!c && this.CCS[this.CARS.indexOf(c.def)] === '1'; }
  cue(n, vol, cd, rate, at) { const a = this.ac; if (!a || !this.cueT) return null; const t = a.currentTime; if (t - (this.cueT[n] || -99) < (cd || 0)) return null; const r = this.sfx(n, vol, rate, at); if (r) this.cueT[n] = t; return r; }
  crash(v, vol, c) { vol = vol === undefined ? 1 : vol; if (v < 0.12) return; const R = Math.random, n = 1 + Math.floor(R() * 3), now = this.ac ? this.ac.currentTime : 0, big = v > 0.9 && vol >= 1 && now - (this.lastBig || -99) > 10, pick = a => a[Math.floor(R() * a.length)];
    if (big) this.lastBig = now; const idx = c ? this.CARS.indexOf(c.def) : -1, nw = idx >= 0 ? this.CCS[idx] === '1' : R() < 0.5, pr = idx >= 0 ? this.CCP[idx] : 1, old = big ? pick(['crash_side_tbone', 'crash_rear_end', 'crash_guardrail']) : (v < 0.4 ? 'hit_light_0' : v < 0.75 ? 'hit_medium_0' : 'hit_heavy_0') + n;
    const neu = big ? (c && this.cars.filter(o => !o.elim && Math.hypot(o.x - c.x, o.z - c.z) < 9).length >= 3 ? 'CC17' : 'CC05') : v < 0.4 ? pick(['CC01', 'CC10', 'CC02']) : v < 0.75 ? pick(['CC03', 'CC04', 'CC09', 'CC06']) : c && c.def.mass >= 1.8 ? pick(/ARMOR|RALLY/.test(c.def.name) ? ['CC08', 'CC07'] : ['CC07', 'CC05']) : pick(['CC05', 'CC06', 'CC04']);
    const g = (0.25 + v * 0.4) * vol, rt = pr * (0.95 + R() * 0.1); if (!((nw && this.sfx(neu, g, rt)) || this.sfx(old, g, rt))) { this.sv = vol * 0.6; this.crashSynth(v); this.sv = 1; return; } if (v > 0.8 && vol >= 1) this.sfx(nw ? 'CC38' : 'debris_scatter', 0.22, 1, 0.08); }
  crashSynth(v) { this.nz(0.05 + v * 0.05, 0.3 + v * 0.3, { type: 'bandpass', f: 2200, q: 0.8 }); this.tone(120, 0.18 + v * 0.2, 'sine', 0.25 + v * 0.3, 45); this.nz(0.25 + v * 0.4, 0.12 + v * 0.2, { f: 1400, to: 150, rev: v > 0.4 });
    for (const f of [410, 730, 1190, 1870, 2650]) this.tone(f * (0.9 + Math.random() * 0.2), 0.12 + Math.random() * 0.25 * (0.5 + v), 'sine', 0.02 + v * 0.035);
    if (v > 0.5) for (let i = 0; i < 5; i++) this.nz(0.04, 0.06, { type: 'highpass', f: 5000, at: 0.08 + Math.random() * 0.4 }); }

  // A match: every car's model and engine sounds are fetched first (the players' own picks, and three models the
  // computer cars share, as the game did), then it begins. Blokvane: roster is everyone in this match, in order: the
  // players with their pick, name, color and team, then the computer cars ({ key, name, color, carIdx, hum, team, pic }).
  // (Blokvane: the computer cars' three models can be picked and loaded while everyone is still in the garage, so
  // the match starts without a wait: nextPool)
  start(roster) {
    if (!this.scene || this.busy) return; this.initAudio(); this.applyVol(); this.series = { wins: {}, round: 0, done: false }; const pool = this.nextPool && this.nextPool.length ? this.nextPool : this.CARS.slice().sort(() => Math.random() - 0.5).slice(0, 3); this.nextPool = null; this.botDefs = []; for (let i = 0; i < 9; i++) this.botDefs.push(pool[Math.floor(Math.random() * pool.length)]);
    if (roster) this.roster = roster;
    const defs = (this.roster || []).filter(x => x.carIdx != null).map(x => this.CARS[x.carIdx] || this.CARS[0]).concat(pool).filter((d, i, l) => l.indexOf(d) === i);
    this.busy = true; this.setState({ busy: true }); Promise.all(defs.map(d => Promise.all([this.loadCar(d), this.loadEngine(d)]))).then(() => { if (this.dead) return; this.busy = false; this.setState({ busy: false }); this.begin(); });
  }
  again() { if (this.state.champ && this.series && !this.series.done && this.mode !== 'survival' && this.botDefs) this.begin(); else this.start(); }
  begin() {
    this.clearWorld(); if (this.ac && this.ac.state === 'suspended') this.ac.resume();
    if (this.preview) { this.dispose(this.preview); this.preview = null; } this.eKill(this.pvCar); this.pvCar = null; this.gClose();
    const mode = this.mode = this.state.mode, team = mode === 'team', surv = mode === 'survival'; this.D = this.DIFFS[this.state.diff] || this.DIFFS.normal; this.respawns = mode === 'score' || mode === 'hill' || mode === 'crown';
    this.shrinks = (this.props.shrinkArena == null ? true : this.props.shrinkArena) && (mode === 'last' || team); if (!this.series) this.series = { wins: {}, round: 0, done: false };
    // (Blokvane: who drives. The players first, each with their own pick, then the computer cars; the game's own
    // numbers were one player and up to 7 computer cars, or 3 vs 3 in a team battle, or a wave of 6 in survival)
    const ros = this.roster || [{ key: 'p1', name: 'PLAYER 1', hum: true, carIdx: this.state.carIdx, team: 0 }], hums = ros.filter(x => x.hum), nb = ros.length - hums.length;
    const TC = ['#4aa3ff', '#e53935', '#ffd23f', '#3ddc84'], TN = this.TEAMS || ['BLUE', 'RED', 'GOLD', 'GREEN'], nT = team ? Math.max(2, Math.min(4, this.teamN || 2)) : 1;
    this.solo = hums.length <= 1;
    // (survival: up to 6 computer cars a wave, as the game had it, and never more than 10 cars on the arena)
    const sb = this.survN = Math.max(3, Math.min(6, 10 - hums.length)), n = surv ? hums.length + sb : ros.length;
    this.R = 30; this.setR(); this.time = 0; this.spawnT = 2; this.order = []; this.hudT = 0; this.cd = 0; this.cdN = 4; this.hitT = 0; this.winner = null;
    this.wave = 0; this.waveT = surv ? 0.6 : 0; this.wk = 1; this.rec = []; this.rp = null; this.finalKo = null; this.slow = 0; this.combo = 0; this.comboT = -99; this.src = null; this.qT = performance.now() + 4000; this.fa = 16;
    this.crown = null; this.bomb = null; this.bombN = 0;
    // (where each starts: around the ring; a team together on its own side; in survival the players in the middle)
    const byTeam = {}; for (let t = 0; t < nT; t++) byTeam[t] = [];
    const list = surv ? hums.concat(Array.from({ length: sb }, (_, j) => ({ key: 'bot' + (j + 1), name: 'BOT ' + (j + 1), hum: false, team: 1 }))) : ros, tOf = x => Math.max(0, Math.min(nT - 1, x.team | 0));
    list.forEach((x, i) => { if (team) byTeam[tOf(x)].push(i); });
    for (let i = 0; i < n; i++) {
      const x0 = list[i], hum = !!x0.hum, tm = team ? tOf(x0) : surv ? (hum ? 0 : 1) : i;
      let a, rad = 26;
      if (team) { const mates = byTeam[tm], k = mates.indexOf(i), m = mates.length, sp = Math.min(0.8, Math.PI * 2 / nT * 0.75 / Math.max(1, m - 1)); a = tm / nT * Math.PI * 2 + (k - (m - 1) / 2) * sp; }
      else if (surv) { if (hum) { const hk = hums.indexOf(x0); a = hk / Math.max(1, hums.length) * Math.PI * 2; rad = hums.length > 1 ? 4 : 0; } else { const bk = i - hums.length; a = bk / sb * Math.PI * 2; } }
      else a = i / n * Math.PI * 2;
      const x = Math.sin(a) * rad, z = Math.cos(a) * rad;
      const def = (x0.carIdx != null && this.CARS[x0.carIdx]) || (hum ? this.CARS[0] : this.botDefs[i % this.botDefs.length]);
      const color = team ? TC[tm] : surv ? (hum ? (x0.color || '#35e0d0') : '#e53935') : (x0.color || this.COLORS[i % this.COLORS.length]);
      const name = hum ? x0.name : surv ? 'BOT ' + (i - hums.length + 1) : team ? TN[tm] + ' BOT' : x0.name || 'BOT ' + (i + 1);
      const mesh = this.makeCar(def, color); setTimeout(() => { try { if (!this.dead) this.pCut(def, mesh); } catch (_) {} }, 400 + i * 150); if (!i) setTimeout(() => { if (!this.dead) this.warmPk(); }, 250); const lb = this.label(this.solo && hum ? 'P1' : name, color, hum && !this.solo ? x0.pic || null : null); lb.position.y = 3.4; mesh.add(lb);
      const sh = new THREE.Mesh(new THREE.SphereGeometry(def.r + 0.9, 16, 12), new THREE.MeshBasicMaterial({ color: 0x4aa3ff, transparent: true, opacity: 0.28 })); sh.position.y = 1; sh.visible = false; mesh.add(sh);
      // (Blokvane: with several players, a ring in each player's color under their car, so everyone finds theirs on
      // the shared screen; a team's cars wear the team's color)
      if (!this.solo && (hum || team)) { const rgm = new THREE.Mesh(new THREE.RingGeometry(def.r * 0.95, def.r * 1.18, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: hum ? 0.85 : 0.5, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); rgm.rotation.x = -Math.PI / 2; rgm.position.y = 0.06; rgm.renderOrder = 2; mesh.add(rgm); }
      this.scene.add(mesh);
      this.cars.push({ i, key: x0.key || 'c' + i, hum, pid: x0.pid || '', name, color, def, mesh, shieldMesh: sh, x, z, y: 0, vx: 0, vz: 0, vy: 0, h: Math.atan2(-x, -z), av: 0, boost: 1, weapon: null, slots: [null, null, null, null, null], cur: -1, ammo: 0, wcd: 0, emp: 0, frozen: 0, ram: 0, burst: null, shield: 0, slip: 0,
        roll: 0, pitch: 0, dmg: 0, pfs: 0, skid: 0, mkT: 0, falling: false, elim: false, bot: !hum, aiT: 0, tgt: null, inp: { steer: 0, gas: 0, brake: 0, boost: 0 },
        team: tm, kos: 0, pts: 0, score: 0, air: false, airT: 0, gvy: 0, lastBy: null, lastT: -99, rsp: 0, pan: !this.solo, pad: null, padAt: 0, auto: !!(hum && x0.away) });
      if (surv && !hum) { const c = this.cars[i]; c.elim = true; mesh.visible = false; }
    }
    this.buildProps();
    for (let i = 0; i < 3; i++) this.spawnPickup(); this.player = this.solo ? this.cars.find(c => c.hum) || this.cars[0] : null; this.camH = this.player ? this.player.h : 0; this.syncMeshes();
    if (this.pvS && this.ac) { this.pvS.g.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); this.pvS = null; } for (const c of this.cars) this.eMake(c);
    this.splitSet();
    this.paused = false; this.setState({ count: '', toast: '', paused: false }); this.pushHud(); this.setPhase('countdown');
  }
  // (Blokvane: the host pauses from their phone; on: true or false)
  togglePause(on) { if (this.phase === 'select' || !this.scene) return; this.paused = on === undefined ? !this.paused : !!on; this.keys = {}; this.setState({ paused: this.paused }); if (this.ac) { if (this.paused) this.ac.suspend(); else this.ac.resume(); } }
  save(o) {}
  setOpt(o) { this.setState(o); this.save(o); }
  applyVol(v) { if (this.out) this.out.gain.value = 0.2 * (v === undefined ? this.state.vol : v); }
  applyQ(q) { const r = this.renderer; if (!r) return; q = q || this.state.quality; const lvl = this.ql = q === 'LOW' ? 0 : q === 'HIGH' ? 3 : this.autoQ, dpr = Math.min(window.devicePixelRatio || 1, lvl === 3 ? 1.75 : 1.25);
    r.setPixelRatio(dpr * [0.6, 0.8, 1, 1][lvl]); this.pq = [0.5, 0.75, 1, 1][lvl]; const dl = this.dl, ms = lvl === 3 ? 2048 : 1024; dl.castShadow = lvl > 0;
    if (dl.shadow.mapSize.x !== ms) { dl.shadow.mapSize.set(ms, ms); if (dl.shadow.map) { dl.shadow.map.dispose(); dl.shadow.map = null; } } if (this.size) this.size(); }
  // (Blokvane: with several players, a line for one of them starts with their name in their color, and shows in their
  // own view in split screen; their phone shows it too)
  pop(t, col, big, c) { const w = c && !this.solo ? this.viewOf(c) : null, el = w ? w.popEl : this.popRef.current; if (c && !this.solo) this.emit('pop', c, t, col); if (!el || !el.animate) return; const d = document.createElement('div');
    if (c && !this.solo && !w) { const n = document.createElement('span'); n.textContent = c.name + '  '; n.style.color = c.color; d.appendChild(n); d.appendChild(document.createTextNode(t)); } else d.textContent = t;
    d.style.cssText = 'position:absolute;left:50%;top:0;white-space:nowrap;font-weight:700;letter-spacing:2px;font-size:' + (big ? (w ? 'clamp(18px,3vw,40px)' : 'clamp(26px,4.5vw,54px)') : (w ? 'clamp(14px,1.9vw,24px)' : 'clamp(18px,2.6vw,30px)')) + ';color:' + col + ';text-shadow:0 3px 0 rgba(0,0,0,.6),0 0 18px rgba(0,0,0,.7)'; el.appendChild(d);
    const off = (this.popN = ((this.popN || 0) + 1) % 4) * 40, tr = (y, sc) => 'translate(-50%,' + y + 'px) scale(' + sc + ')';
    d.animate([{ transform: tr(off + 30, 0.5), opacity: 0 }, { transform: tr(off, 1.15), opacity: 1, offset: 0.15 }, { transform: tr(off, 1), opacity: 1, offset: 0.7 }, { transform: tr(off - 40, 1), opacity: 0 }], { duration: 1500, easing: 'ease-out' }).onfinish = () => d.remove(); }
  popMe(c, t, col, big) { if (this.me(c)) this.pop(t, col, big, c); }
  wedge(w, l, h) { const g = new THREE.BufferGeometry(), a = -l / 2, b = l / 2, x = w / 2;
    g.setAttribute('position', new THREE.Float32BufferAttribute([-x, 0, a, x, h, b, x, 0, a, -x, 0, a, -x, h, b, x, h, b, -x, 0, b, x, h, b, -x, h, b, -x, 0, b, x, 0, b, x, h, b, -x, 0, a, -x, 0, b, -x, h, b, x, 0, a, x, h, b, x, 0, b], 3)); g.computeVertexNormals(); return g; }
  scenery(G, A, k) {
    const T = THREE; this.decal = null;
    if (k !== 'island') {
      const col = '#' + new T.Color(A.ring).getHexString(), tx = this.tex(1024, (g, s) => { g.clearRect(0, 0, s, s); const c = s / 2;
        const ring = (r, w, st, dash) => { g.beginPath(); g.arc(c, c, r * c, 0, 6.2832); g.lineWidth = w; g.strokeStyle = st; g.setLineDash(dash || []); g.stroke(); };
        ring(0.2, 10, 'rgba(255,255,255,.55)'); ring(0.222, 3, col); ring(0.55, 6, 'rgba(255,255,255,.3)', [40, 26]); ring(0.9, 22, col, [36, 36]); ring(0.935, 3, 'rgba(255,255,255,.4)');
        g.setLineDash([]); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 5; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; g.beginPath(); g.moveTo(c + Math.sin(a) * c * 0.24, c + Math.cos(a) * c * 0.24); g.lineTo(c + Math.sin(a) * c * 0.5, c + Math.cos(a) * c * 0.5); g.stroke(); }
        });
      const d = this.decal = new T.Mesh(new T.PlaneGeometry(2, 2), new T.MeshBasicMaterial({ map: tx, transparent: true, opacity: k === 'ice' ? 0.5 : 0.75, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 })); d.rotation.x = -Math.PI / 2; d.position.y = 0.012; d.scale.set(this.R || 30, this.R || 30, 1); G.add(d);
      const gl = this.tex(128, (g, s) => { const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.clearRect(0, 0, s, s); g.fillStyle = gr; g.fillRect(0, 0, s, s); });
      const pm = new T.MeshStandardMaterial({ color: 0x20242c, roughness: 0.6, metalness: 0.7 }), lm = new T.MeshBasicMaterial({ color: A.sun[0] }), fy = A.floor;
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.2832 + 0.785, x = Math.sin(a) * 47, z = Math.cos(a) * 47, H = 24 - fy, pole = new T.Mesh(new T.CylinderGeometry(0.45, 0.9, H, 8), pm); pole.position.set(x, fy + H / 2, z); G.add(pole);
        const head = new T.Mesh(new T.BoxGeometry(5, 2.2, 0.6), lm); head.position.set(x, 25, z); head.lookAt(0, 4, 0); G.add(head);
        const sp = new T.Sprite(new T.SpriteMaterial({ map: gl, color: A.sun[0], transparent: true, opacity: 0.85, blending: T.AdditiveBlending, depthWrite: false, fog: false })); sp.position.set(x * 0.985, 25, z * 0.985); sp.scale.set(16, 16, 1); G.add(sp); }
    }
    const dm = new T.MeshStandardMaterial({ color: 0x1a1d24, roughness: 0.5, metalness: 0.6 }), lt = new T.MeshBasicMaterial({ color: A.post });
    for (let i = 0; i < 4; i++) { const g = new T.Group(), b = new T.Mesh(new T.BoxGeometry(1.2, 0.35, 1.2), dm), l = new T.Mesh(new T.SphereGeometry(0.16, 8, 6), lt); l.position.y = -0.25; g.add(b, l);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const r = new T.Mesh(new T.CylinderGeometry(0.5, 0.5, 0.04, 10), dm); r.position.set(sx * 0.75, 0.2, sz * 0.75); g.add(r); }
      G.add(g); this.anim.push(t => { const a = t * 0.22 * (i % 2 ? 1 : -1) + i * 1.57, rr = 38 + i * 3; g.position.set(Math.sin(a) * rr, 9 + i * 2 + Math.sin(t * 1.3 + i) * 0.8, Math.cos(a) * rr); g.rotation.y = a + 1.57; l.visible = Math.sin(t * 6 + i) > 0; }); }
  }
  buildProps() {
    const T = THREE, A = this.ARENAS[this.arena], G = this.propG = new T.Group(); this.scene.add(G);
    const metal = new T.MeshStandardMaterial({ color: 0x3a4150, roughness: 0.45, metalness: 0.8, side: T.DoubleSide }), glow = new T.MeshBasicMaterial({ color: A.post }), warn = new T.MeshBasicMaterial({ color: 0xffd23f });
    if (this.state.ramps !== false) for (let i = 0; i < 3; i++) { const a = i / 3 * 6.2832 + 0.5, x = Math.sin(a) * 13, z = Math.cos(a) * 13, h = a + Math.PI / 2, m = new T.Mesh(this.wedge(4.6, 6.5, 1.7), metal); m.position.set(x, 0, z); m.rotation.y = h; m.castShadow = m.receiveShadow = true;
      for (const sx of [-1, 1]) { const e = new T.Mesh(new T.BoxGeometry(0.16, 0.1, 6.7), glow); e.position.set(sx * 2.2, 0.9, 0); e.rotation.x = -Math.atan2(1.7, 6.5); m.add(e); }
      G.add(m); this.ramps.push({ x, z, h, l: 6.5, w: 4.6, ht: 1.7, m }); }
    if (this.state.hazards) {
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.2832 + 0.2, x = Math.sin(a) * 20, z = Math.cos(a) * 20, m = new T.Mesh(new T.RingGeometry(0.7, 1.5, 24), new T.MeshBasicMaterial({ color: 0x30343c, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.045, z);
        const hole = new T.Mesh(new T.CircleGeometry(0.7, 16), new T.MeshBasicMaterial({ color: 0x050505 })); hole.position.z = 0.001; m.add(hole); G.add(m); this.vents.push({ x, z, o: i * 1.75, m, on: false }); }
      for (let i = 0; i < 2; i++) { const g = new T.Group(), b = new T.Mesh(new T.CylinderGeometry(1.1, 1.25, 1.5, 20), metal), t = new T.Mesh(new T.TorusGeometry(1.2, 0.13, 8, 24), glow), cap = new T.Mesh(new T.SphereGeometry(0.5, 12, 8), glow); b.position.y = 0.75; b.castShadow = true; t.rotation.x = Math.PI / 2; t.position.y = 0.95; cap.position.y = 1.5; g.add(b, t, cap); G.add(g);
        this.bumpers.push({ a: i * Math.PI, dir: 1, x: 0, z: 0, k: 0, m: g }); }
      const cm = new T.Group(), blk = new T.Mesh(new T.BoxGeometry(5, 5, 5), metal), rim = new T.Mesh(new T.BoxGeometry(5.15, 0.4, 5.15), warn), rod = new T.Mesh(new T.CylinderGeometry(0.8, 0.8, 40, 10), metal); blk.castShadow = true; rim.position.y = -2.25; rod.position.y = 22.5; cm.add(blk, rim, rod); cm.visible = false; G.add(cm);
      const cr = new T.Mesh(new T.RingGeometry(2.7, 3.5, 32), new T.MeshBasicMaterial({ color: 0xe53935, transparent: true, side: T.DoubleSide, depthWrite: false })); cr.rotation.x = -Math.PI / 2; cr.visible = false; G.add(cr);
      this.crusher = { m: cm, ring: cr, s: 0, t: 6, x: 0, z: 0 };
    }
    if (this.mode === 'hill') { const mat = new T.MeshBasicMaterial({ color: 0x3ddc84, transparent: true, opacity: 0.3, side: T.DoubleSide, depthWrite: false }), g = new T.Group(), wall = new T.Mesh(new T.CylinderGeometry(6, 6, 1.2, 40, 1, true), mat), fl = new T.Mesh(new T.RingGeometry(5.4, 6, 40), mat); wall.position.y = 0.6; fl.rotation.x = -Math.PI / 2; fl.position.y = 0.06; g.add(wall, fl); G.add(g);
      this.zone = { x: 0, z: 0, tx: 0, tz: 0, r: 6, t: 18, m: g, mat }; }
  }
  rampWall(c, solid) { for (const r of this.ramps) { if (!r.m.visible) continue; const dx = c.x - r.x, dz = c.z - r.z, sn = Math.sin(r.h), cs = Math.cos(r.h), rel = c.h - r.h, as = Math.abs(Math.sin(rel)), ac = Math.abs(Math.cos(rel)), hw = r.w / 2 + as * c.def.l / 2 + ac * c.def.w / 2, hl = r.l / 2 + ac * c.def.l / 2 + as * c.def.w / 2; let lz = dx * sn + dz * cs, lx = dx * cs - dz * sn; if (Math.abs(lx) >= hw || Math.abs(lz) >= hl) continue;
      const inX = Math.abs(lx) < r.w / 2, inZ = Math.abs(lz) < r.l / 2; if (!solid) { if (inX && inZ) continue; if (r.ht * (Math.max(-r.l / 2, Math.min(r.l / 2, lz)) + r.l / 2) / r.l <= c.y + 0.45) continue; }
      const px = hw - Math.abs(lx), pz = hl - Math.abs(lz), ax = inX === inZ ? (px < pz ? 0 : 1) : inX ? 1 : 0; let nx = 0, nz = 0; if (ax === 0) { nx = lx < 0 ? -1 : 1; lx = nx * hw; } else { nz = lz < 0 ? -1 : 1; lz = nz * hl; }
      c.x = r.x + lx * cs + lz * sn; c.z = r.z - lx * sn + lz * cs; const wx = nx * cs + nz * sn, wz = -nx * sn + nz * cs, vn = c.vx * wx + c.vz * wz; if (vn < 0) { c.vx -= wx * vn * 1.3; c.vz -= wz * vn * 1.3; if (!solid && vn < -5 && this.me(c)) this.cue('CC14', 0.25 * this.mv(c), 1.5); } } }
  supP(d) { const C = this.supC || (this.supC = {}); if (!C[d.name]) { const U = d.w * 0.46, V = d.l * 0.44, p = []; for (const u of [-1, -0.5, 0, 0.5, 1]) for (const v of [-1, -0.5, 0, 0.5, 1]) p.push(u * U, v * V); C[d.name] = { p: new Float64Array(p), r: Math.hypot(U, V) }; } return C[d.name]; }
  rNear(x, z, rr) { for (const r of this.ramps) if (r.m.visible && Math.hypot(x - r.x, z - r.z) < Math.hypot(r.w / 2, r.l / 2) + rr) return true; return false; }
  support(c, x, z, h) {
    const S = this.supP(c.def), P = S.p, n = P.length / 2; if (!this.rNear(x, z, S.r + 0.2)) return [0, 0, 0];
    const G = this.supG || (this.supG = new Float64Array(32)), sn = Math.sin(h), cs = Math.cos(h); let mx = 0;
    for (let i = 0; i < n; i++) { const u = P[2 * i], v = P[2 * i + 1]; G[i] = this.gy(x + u * cs + v * sn, z - u * sn + v * cs); if (G[i] > mx) mx = G[i]; }
    if (mx <= 0) return [0, 0, 0];
    const F = (b, k) => { let m = -1e9; for (let i = 0; i < n; i++) { const t = G[i] - b * P[2 * i] - k * P[2 * i + 1]; if (t > m) m = t; } return m + 0.003 * (b * b + k * k); };
    const inner = b => { let lo = -1.5, hi = 1.5; for (let it = 0; it < 16; it++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (F(b, m1) < F(b, m2)) hi = m2; else lo = m1; } return (lo + hi) / 2; };
    let lo = -1.5, hi = 1.5; for (let it = 0; it < 16; it++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (F(m1, inner(m1)) < F(m2, inner(m2))) hi = m2; else lo = m1; }
    const b = (lo + hi) / 2, k = inner(b); return [F(b, k) - 0.003 * (b * b + k * k), b, k]; }
  rBlock(c, x, z, h, y0, b0, k0) { const S = this.supP(c.def), P = S.p, n = P.length / 2; if (!this.rNear(x, z, S.r + 0.2)) return null; const sn = Math.sin(h), cs = Math.cos(h);
    for (let i = 0; i < n; i++) { const u = P[2 * i], v = P[2 * i + 1], px = x + u * cs + v * sn, pz = z - u * sn + v * cs, p = y0 + b0 * u + k0 * v;
      for (const r of this.ramps) { if (!r.m.visible) continue; const dx = px - r.x, dz = pz - r.z, rs = Math.sin(r.h), rc = Math.cos(r.h), lz = dx * rs + dz * rc, lx = dx * rc - dz * rs; if (Math.abs(lx) < r.w / 2 && Math.abs(lz) < r.l / 2 && r.ht * (lz + r.l / 2) / r.l > p + 0.45) return r; } }
    return null; }
  rNorm(r, x, z) { const dx = x - r.x, dz = z - r.z, rs = Math.sin(r.h), rc = Math.cos(r.h), lz = dx * rs + dz * rc, lx = dx * rc - dz * rs, hw = r.w / 2, hl = r.l / 2;
    let nx = lx - Math.max(-hw, Math.min(hw, lx)), nz = lz - Math.max(-hl, Math.min(hl, lz)); if (!nx && !nz) { if (hw - Math.abs(lx) < hl - Math.abs(lz)) nx = Math.sign(lx) || 1; else nz = Math.sign(lz) || 1; }
    const m = Math.hypot(nx, nz); nx /= m; nz /= m; return [nx * rc + nz * rs, -nx * rs + nz * rc]; }
  rampMove(c, ox, oz, oy, oh, dt) {
    const b0 = c.air ? Math.tan(c.tR || 0) : c.sb || 0, k0 = c.air ? -Math.tan(c.tP || 0) : c.sk || 0, bl = () => this.rBlock(c, c.x, c.z, c.h, oy, b0, k0), r = bl();
    if (r) { const n = this.rNorm(r, ox, oz), dn = (c.x - ox) * n[0] + (c.z - oz) * n[1]; if (dn < 0) { c.x -= n[0] * dn; c.z -= n[1] * dn; }
      if (bl()) { c.x = ox; c.z = oz; if (bl()) { c.h = oh; c.av = 0; if (bl()) { c.x += n[0] * 0.06; c.z += n[1] * 0.06; } } }
      const vn = c.vx * n[0] + c.vz * n[1]; if (vn < 0) { c.vx -= n[0] * vn * 1.35; c.vz -= n[1] * vn * 1.35; if (vn < -4) this.sparks(c.x - n[0] * c.def.r * 0.85, 0.5, c.z - n[1] * c.def.r * 0.85, n[0] * 0.3 - n[1], 0.4, n[1] * 0.3 + n[0], 3 - vn * 1.2, 4 - vn * 0.5, 0.6); if (vn < -4 && this.me(c)) this.cue(this.arena === 'island' ? 'CC15' : 'CC13', 0.28 * this.mv(c), 2); } }
    const S = this.support(c, c.x, c.z, c.h), a = S[0], sp = Math.hypot(c.vx, c.vz);
    if (c.air) { if (c.y <= a) { c.y = a; c.air = false; this.land(c); c.vy = 0; c.gvy = 0; c.gvs = 0; c.sb = S[1]; c.sk = S[2]; } }
    else { const yb = c.y + (c.gvs || 0) * dt - 13 * dt * dt, st = (c.sk || 0) > 0.12 && Math.abs(c.sb || 0) < 0.1;
      if (a < yb - 0.05 && (st && (c.gvs || 0) > 1.5 || a < c.y - 0.35)) { c.air = true; c.airT = 0; c.desc = false; const gv = Math.max(0, c.gvs || 0); c.vy = st ? gv * 1.5 + (gv > 1 ? 2.5 * Math.min(1, Math.max(0, (sp - 4) / 8)) : 0) : gv; c.sb = c.sk = 0; }
      else { if (a < yb) { c.desc = true; c.gvs = (c.gvs || 0) - 26 * dt; c.gvy = c.gvs; c.y = yb; }
        else { if (c.desc) { c.desc = false; if (c.gvs < -5) { c.vy = c.gvs; this.land(c); } c.gvs = 0; } const gv = (a - c.y) / dt; c.gvy = gv; c.gvs = (c.gvs || 0) + (Math.min(gv, sp * 0.35 + 0.5) - (c.gvs || 0)) * (1 - Math.exp(-dt / 0.06)); c.y = a; }
        c.sb = S[1]; c.sk = S[2];
      const b = S[1], k = S[2]; if (Math.abs(b) > 0.01 || Math.abs(k) > 0.01) { const pv = a > this.gy(c.x, c.z) + 0.03, fx = Math.sin(c.h), fz = Math.cos(c.h), q = 26 / (1 + b * b + k * k), au = -q * b * (pv ? 2 : 0.25), av = -q * k * (pv ? 1.2 : 0.85); c.vx += (au * fz + av * fx) * dt; c.vz += (-au * fx + av * fz) * dt; } } }
    const tk = 1 - Math.exp(-(c.air ? 2.5 : 12) * dt), tr = c.air ? 0 : Math.atan(c.sb || 0), tp = c.air ? 0 : -Math.atan(c.sk || 0); c.tR = (c.tR || 0) + (tr - (c.tR || 0)) * tk; c.tP = (c.tP || 0) + (tp - (c.tP || 0)) * tk; }
  gy(x, z) { let g = 0; for (const r of this.ramps) { if (!r.m.visible) continue; const dx = x - r.x, dz = z - r.z, sn = Math.sin(r.h), cs = Math.cos(r.h), lz = dx * sn + dz * cs, lx = dx * cs - dz * sn; if (Math.abs(lx) < r.w / 2 && Math.abs(lz) < r.l / 2) g = Math.max(g, r.ht * (lz + r.l / 2) / r.l); } return g; }
  hazards(dt) {
    const R = Math.random, cols = this.arena === 'ice' || this.arena === 'island' ? [0xffffff, 0xbfe6ff, 0x7fe9ff] : [0xffd23f, 0xff8a1f, 0xe53935], p = this.player; this.src = null;
    for (const r of this.ramps) r.m.visible = this.R > 23;
    for (const v of this.vents) { const ok = Math.hypot(v.x, v.z) < this.R - 2; v.m.visible = ok; if (!ok) continue; const ph = (this.time + v.o) % 7, act = ph >= 5.5, wn = ph > 4.3 && !act;
      v.m.material.color.setHex(act ? cols[1] : wn && Math.sin(this.time * 18) > 0 ? cols[0] : 0x30343c);
      if (!act) { v.on = false; continue; }
      for (let q = 0; q < 3; q++) this.spawn(v.x + (R() - 0.5), 0.3, v.z + (R() - 0.5), (R() - 0.5) * 2, 9 + R() * 8, (R() - 0.5) * 2, cols[Math.floor(R() * 3)], 0.5 + R() * 0.5, 0.5, 4);
      if (!v.on) { v.on = true; this.sv = 0.5 * this.near(v.x, v.z); this.ws('CC40', 0.5, 0, 0.7); this.sv = 1; }
      for (const c of this.cars) if (!c.elim && !c.falling && !c.air && Math.hypot(c.x - v.x, c.z - v.z) < c.def.r + 1.3) { c.air = true; c.airT = 0; c.vy = 9 / Math.sqrt(this.em(c)) + 5; c.av += (R() - 0.5) * 5; this.dent(c, 0.25); if (this.me(c)) { this.shk(c, 0.6); this.pop('LAUNCHED!', '#ff8a1f', 0, c); } } }
    for (const b of this.bumpers) { b.a += dt * 0.45; const rr = Math.min(9, this.R * 0.5); b.x = Math.sin(b.a) * rr; b.z = Math.cos(b.a) * rr; b.k = Math.max(0, b.k - dt * 4); b.m.position.set(b.x, 0, b.z); b.m.rotation.y += dt * 3; b.m.scale.setScalar(1 + b.k * 0.25);
      for (const c of this.cars) { if (c.elim || c.falling || c.y > 1.5) continue; let nx = c.x - b.x, nz = c.z - b.z; const d = Math.hypot(nx, nz), min = c.def.r + 1.2; if (d >= min || d === 0) continue; nx /= d; nz /= d; c.x = b.x + nx * min; c.z = b.z + nz * min;
        const vn = c.vx * nx + c.vz * nz, kick = 13 / Math.sqrt(this.em(c)); if (vn < 0) { c.vx -= nx * vn * 1.6; c.vz -= nz * vn * 1.6; } c.vx += nx * kick; c.vz += nz * kick; c.slip = Math.max(c.slip, 0.5); b.k = 1; if (vn < -3) this.sparks(b.x + nx * 1.25, 0.8, b.z + nz * 1.25, -nz, 0.4, nx, 6 - vn * 1.2, 5 - vn * 0.4, 0.8); this.cue('CC14', this.me(c) ? 0.35 * this.mv(c) : 0.12 * this.near(c.x, c.z), 1.2);
        for (let q = 0; q < 8; q++) this.spawn(c.x - nx * c.def.r, 0.9, c.z - nz * c.def.r, (R() - 0.5) * 12, 2 + R() * 6, (R() - 0.5) * 12, 0xffe08a, 0.14, 0.35, 20);
        if (this.hitT <= 0) { this.hitT = 0.3; this.sv = this.me(c) ? this.mv(c) : 0.4 * this.near(b.x, b.z); this.sfx('CC43', 0.4 * this.sv); this.sv = 1; } if (this.me(c)) this.shk(c, 0.4); } }
    const cr = this.crusher; if (cr) { cr.t -= dt;
      if (cr.s === 0) { if (cr.t <= 0 && this.R > 13) { const live = this.cars.filter(c => !c.elim && !c.falling), t = live.length && R() < 0.6 ? live[Math.floor(R() * live.length)] : null, a = R() * 6.28, d = Math.sqrt(R()) * (this.R - 8); cr.x = t ? t.x : Math.sin(a) * d; cr.z = t ? t.z : Math.cos(a) * d;
          const dd = Math.hypot(cr.x, cr.z), mx = this.R - 4; if (dd > mx) { cr.x *= mx / dd; cr.z *= mx / dd; } cr.s = 1; cr.t = 1.5; cr.ring.visible = true; cr.ring.position.set(cr.x, 0.07, cr.z); cr.m.visible = true; cr.m.position.set(cr.x, 22, cr.z); } }
      else if (cr.s === 1) { cr.ring.material.opacity = 0.55 + 0.45 * Math.sin(this.time * 16); cr.m.position.y = 14 + Math.max(0, cr.t) * 5; if (cr.t <= 0) { cr.s = 2; cr.t = 0.16; } }
      else if (cr.s === 2) { cr.m.position.y = 2.5 + Math.max(0, cr.t) / 0.16 * 11.5; if (cr.t <= 0) { cr.s = 3; cr.t = 0.7; cr.ring.visible = false; const nr = this.near(cr.x, cr.z); this.blast(cr.x, cr.z, 6.5, 30, null); this.cue('CC13', 0.12 + 0.4 * nr, 1);
          for (let q = 0; q < 16; q++) { const a = R() * 6.28; this.spawn(cr.x + Math.sin(a) * 3, 0.3, cr.z + Math.cos(a) * 3, Math.sin(a) * (4 + R() * 6), 1 + R() * 3, Math.cos(a) * (4 + R() * 6), this.dustC, 0.9 + R(), 0.9, -0.5, 0.45); }
          this.shake = Math.max(this.shake, 0.2 + 0.9 * nr); this.sfx('CC08', 0.1 + 0.4 * nr, 0.8); } }
      else if (cr.s === 3) { if (cr.t <= 0) { cr.s = 4; cr.t = 1.2; } }
      else { cr.m.position.y = 2.5 + (1 - Math.max(0, cr.t) / 1.2) * 20; if (cr.t <= 0) { cr.s = 0; cr.t = 6 + R() * 4; cr.m.visible = false; } } }
  }
  land(c) { const R = Math.random, hard = c.vy < -7; if (c.vy < -11) this.sparks(c.x, 0.08, c.z, 0, 0.5, 0, 6 + Math.min(20, -c.vy), 6, 1.5); for (let q = 0; q < (hard ? 10 : 4); q++) this.spawn(c.x + (R() - 0.5) * 2.5, 0.2, c.z + (R() - 0.5) * 2.5, (R() - 0.5) * 6, 1 + R() * 2, (R() - 0.5) * 6, this.dustC, 0.6 + R() * 0.5, 0.7, -0.5, 0.4);
    c.pitch = 0.1; if (!this.me(c)) return; const mv = this.mv(c); this.shk(c, hard ? 0.5 : 0.2); if (!(hard && this.sfx(c.vy < -12 ? 'CC12' : this.nset(c) ? 'CC43' : 'CC11', 0.4 * mv, this.CCP[this.CARS.indexOf(c.def)] || 1))) this.sfx('hit_light_0' + (1 + Math.floor(R() * 3)), 0.3 * mv);
    if (c.airT > 0.5) { const pts = Math.round(c.airT * 10) * 10; c.score += pts; c.boost = Math.min(1, c.boost + 0.3); this.pop('AIR TIME +' + pts, '#4aa3ff', 0, c); } }
  fell(c) { const by = c.lastBy && c.lastBy !== c && c.lastBy.team !== c.team && this.time - c.lastT < 6 ? c.lastBy : null;
    if (this.me(c)) { this.sfx('CC35', 0.35 * this.mv(c)); this.pushHud(); }
    this.emit('fell', c, by);
    // (Blokvane: a combo is each player's own; with one player it is the same as the game's)
    if (by) { by.kos++; if (this.me(by)) { by.combo = this.time - (by.comboT == null ? -99 : by.comboT) < 6 ? (by.combo || 0) + 1 : 1; by.comboT = this.time; const n = Math.min(by.combo, 4); by.score += 100 * n; by.boost = Math.min(1, by.boost + 0.5);
        this.pop(['KNOCKOUT!', 'DOUBLE KO!', 'TRIPLE KO!', 'MEGA KO!'][n - 1] + ' +' + 100 * n, n > 1 ? '#ffd23f' : '#3ddc84', 1, by); this.sfx('CC50', 0.3 * this.mv(by)); } }
    if (this.crown && this.crown.c === c) this.crownDrop(by && !by.elim && !by.falling ? by : null, true);
    if (!this.respawns && this.mode !== 'survival') { const teams = {}; let n = 0; for (const o of this.cars) if (!o.elim && !o.falling && !teams[o.team]) { teams[o.team] = 1; n++; } if (n <= 1) { this.finalKo = c; this.slow = 1.2; } } }
  respawn(c, x, z) { const a = Math.random() * 6.28, d = Math.random() * Math.max(2, this.R - 12); c.x = x === undefined ? Math.sin(a) * d : x; c.z = z === undefined ? Math.cos(a) * d : z; c.y = 9; c.vy = 0; c.vx = c.vz = 0; c.av = 0; c.air = true; c.airT = -9; c.falling = false; c.elim = false; c.rsp = 0;
    c.h = Math.atan2(-c.x, -c.z); c.shield = 2.5; c.emp = 0; c.slip = 0; c.oil = 0; c.lastBy = null; c.mesh.visible = true; c.mesh.rotation.x = 0; c.sb = c.sk = c.tR = c.tP = c.gvs = 0; c.desc = false; this.repair(c, true); if (this.me(c)) { if (c === this.player) this.camH = c.h; const w = this.viewOf(c); if (w) w.camH = c.h; this.pushHud(); this.emit('back', c); } }
  fanfare() { this.sfx('CC50', 0.4); this.sfx('CC19', 0.3, 1, 0.3); }
  revCount(n) { if (n === 3) return; for (const c of this.cars) if (c.en && !this.me(c)) c.en.bt = Math.random() * 0.15; if (n === 1) for (const c of this.cars) if (this.me(c)) this.eShot(c.def, 'downshift', 0.45 * this.mv(c)); if (n === 0) this.sfx('CC50', 0.32); }
  replay(dt) { const rp = this.rp, f = rp.f; rp.t += dt * 0.5; while (rp.i < f.length - 2 && f[rp.i + 1].t < rp.t) rp.i++; const a = f[rp.i], b = f[Math.min(f.length - 1, rp.i + 1)], k = Math.max(0, Math.min(1, (rp.t - a.t) / ((b.t - a.t) || 1)));
    this.cars.forEach((c, i) => { const p = a.c[i], q = b.c[i]; if (!p || !q) return; c.mesh.visible = p[5]; c.mesh.position.set(p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k); c.mesh.rotation.y = p[3] + Math.atan2(Math.sin(q[3] - p[3]), Math.cos(q[3] - p[3])) * k; c.mesh.rotation.x = p[4] + (q[4] - p[4]) * k; });
    if (rp.t >= f[f.length - 1].t || rp.skip) this.endReplay(); }
  endReplay() { for (const c of this.cars) { c.mesh.visible = !c.elim; c.mesh.rotation.x = 0; } this.rp = null; this.vt = 0; this.fanfare(); this.setPhase('victory'); }
  toSelect() { this.paused = false; this.rp = null; if (this.ac && this.ac.state === 'suspended') this.ac.resume(); this.setState({ paused: false }); this.clearWorld(); this.R = 30; this.setR(); this.showPreview(this.state.carIdx); this.ePrev(this.CARS[this.state.carIdx]); if (this.engG) { this.engG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); this.smpG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); this.quietLoops(); this.skG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); } this.setPhase('select'); }
  toast(t) { this.setState({ toast: t }); clearTimeout(this.toastT); this.toastT = setTimeout(() => this.setState({ toast: '' }), 2200); }

  flame(x, y, z, vx, vy, vz, size, life, kind) { if (!this.puffs || (this.pq < 1 && Math.random() > this.pq)) return; const p = this.puffs[this.pfi = ((this.pfi || 0) + 1) % this.puffs.length]; p.fire = kind || 1; p.m.material.blending = 2; p.m.position.set(x, y, z); p.size = size; p.m.scale.setScalar(size * 0.6); p.a = 0.95; p.m.material.rotation = Math.random() * 6.28; p.spin = (Math.random() - 0.5) * 3; p.m.material.opacity = 0; p.m.visible = true; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.grav = kind === 2 ? 0 : -4; }
  oilTex() { if (this.oilTx) return this.oilTx; return this.oilTx = this.tex(256, (g, s) => { const c = s / 2, R = Math.random, ph = [R() * 6, R() * 6, R() * 6], rad = a => c * 0.78 * (0.78 + 0.1 * Math.sin(a * 2 + ph[0]) + 0.07 * Math.sin(a * 3 + ph[1]) + 0.05 * Math.sin(a * 5 + ph[2])), path = () => { g.beginPath(); for (let a = 0; a <= 6.3; a += 0.1) { const r = rad(a); g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } g.closePath(); };
      g.clearRect(0, 0, s, s); path(); const gr = g.createRadialGradient(c, c, 0, c, c, c * 0.8); gr.addColorStop(0, 'rgba(3,3,5,.97)'); gr.addColorStop(0.8, 'rgba(7,7,9,.95)'); gr.addColorStop(1, 'rgba(22,17,10,.78)'); g.fillStyle = gr; g.fill();
      for (let i = 0; i < 16; i++) { const a = R() * 6.28, r = rad(a) * (1.04 + R() * 0.22); g.fillStyle = 'rgba(6,6,8,.9)'; g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 2 + R() * 7, 0, 7); g.fill(); }
      g.save(); path(); g.clip(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; const cols = ['190,60,255', '40,200,220', '255,200,60', '80,255,140', '255,90,160'];
      for (let i = 0; i < 12; i++) { const col = cols[i % 5], x = c + (R() - 0.5) * 70, y = c + (R() - 0.5) * 70, a0 = R() * 6.28; g.strokeStyle = 'rgba(' + col + ',.055)'; g.shadowColor = 'rgba(' + col + ',.16)'; g.shadowBlur = 20; g.lineWidth = 16 + R() * 26; g.beginPath(); g.arc(x, y, 18 + R() * 70, a0, a0 + 1 + R() * 2.4); g.stroke(); }
      g.shadowBlur = 6; g.shadowColor = 'rgba(255,255,255,.3)'; for (let i = 0; i < 2; i++) { const a0 = R() * 6.28; g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1.5 + R() * 2; g.beginPath(); g.arc(c + (R() - 0.5) * 50, c + (R() - 0.5) * 50, 25 + R() * 50, a0, a0 + 0.5 + R() * 0.9); g.stroke(); } g.restore(); }); }
  spawn(x, y, z, vx, vy, vz, color, size, life, grav, a) {
    if (this.pq < 1 && Math.random() > this.pq) return;
    if (a && a < 1 && this.puffs) { const p = this.puffs[this.pfi = ((this.pfi || 0) + 1) % this.puffs.length]; p.fire = 0; p.m.material.blending = 1; p.m.position.set(x, y, z); p.size = size * 1.9; p.m.scale.setScalar(p.size); p.c0.set(color); p.c1.copy(p.c0).lerp(this.smC, 0.55); p.a = Math.min(1, a * 1.5); p.m.material.rotation = Math.random() * 6.28; p.spin = (Math.random() - 0.5) * 1.2; p.m.material.opacity = 0; p.m.visible = true; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life * 1.5; p.grav = grav || 0; return; }
    const p = this.parts[this.pi = ((this.pi || 0) + 1) % this.parts.length];
    p.m.material.blending = typeof color === 'number' && (a || 1) >= 1 && (color >> 16 & 255) > 200 && (color >> 8 & 255) > 100 ? 2 : 1;
    p.m.position.set(x, y, z); p.m.scale.setScalar(size); p.m.material.color.set(color); p.a = a || 1; p.m.material.opacity = p.a; p.m.visible = true;
    p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.grav = grav || 0;
  }
  gTx() { return this.glowTx || (this.glowTx = this.tex(64, (x, sz) => { const gr = x.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, sz, sz); })); }
  skInit(sc) {
    const T = THREE, N = 700, P = new Float32Array(N * 6), C = new Float32Array(N * 6), g = new T.BufferGeometry(), pa = new T.BufferAttribute(P, 3), ca = new T.BufferAttribute(C, 3); pa.setUsage(T.DynamicDrawUsage); ca.setUsage(T.DynamicDrawUsage); g.setAttribute('position', pa); g.setAttribute('color', ca);
    const m = new T.LineSegments(g, new T.LineBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); m.frustumCulled = false; m.renderOrder = 3; sc.add(m); this.sk = { m, g, P, C, N, S: new Float32Array(N * 8), i: 0, on: 0 };
    const gt = this.gTx(); this.fls = []; for (let i = 0; i < 6; i++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: gt, color: 0xfff0c8, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })); sp.visible = false; sp.renderOrder = 4; sc.add(sp); this.fls.push({ sp, t: 1, s: 1 }); }
    const st = this.tex(128, (x, s) => { x.clearRect(0, 0, s, s); const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(8,6,5,0.9)'); gr.addColorStop(0.45, 'rgba(14,11,9,0.62)'); gr.addColorStop(0.8, 'rgba(20,16,12,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.fillRect(0, 0, s, s); for (let i = 0; i < 70; i++) { const a = Math.random() * 6.28, r = s * (0.18 + Math.random() * 0.3); x.fillStyle = 'rgba(0,0,0,' + (0.15 + Math.random() * 0.35) + ')'; x.beginPath(); x.ellipse(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, 1 + Math.random() * 5, 0.6 + Math.random() * 1.5, a, 0, 6.28); x.fill(); } });
    const sg = new T.PlaneGeometry(1, 1); sg.rotateX(-Math.PI / 2); this.scs = []; for (let i = 0; i < 10; i++) { const mm = new T.Mesh(sg, new T.MeshBasicMaterial({ map: st, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 })); mm.visible = false; mm.renderOrder = 1; sc.add(mm); this.scs.push({ m: mm, life: 0 }); } }
  sparks(x, y, z, nx, ny, nz, n, sp, cone) { const K = this.sk; if (!K) return; n = Math.round(n * (this.pq < 1 ? Math.max(0.4, this.pq) : 1)); const R = Math.random, S = K.S;
    for (let q = 0; q < n; q++) { const i = K.i = (K.i + 1) % K.N, o = i * 8, v = sp * (0.4 + R() * 0.9), dx = nx + (R() - 0.5) * cone * 2, dy = ny + (R() - 0.25) * cone * 1.4, dz = nz + (R() - 0.5) * cone * 2, dl = Math.hypot(dx, dy, dz) || 1;
      S[o] = x; S[o + 1] = y; S[o + 2] = z; S[o + 3] = dx / dl * v; S[o + 4] = dy / dl * v; S[o + 5] = dz / dl * v; S[o + 6] = S[o + 7] = 0.22 + R() * 0.45; } K.on = 1; }
  flash(x, y, z, s) { const f = this.fls && this.fls[this.fli = ((this.fli || 0) + 1) % this.fls.length]; if (!f) return; f.t = 0; f.s = s; f.sp.position.set(x, y, z); f.sp.visible = true; }
  skUpd(dt) { dt = Math.min(dt, 0.05); const K = this.sk;
    if (K && K.on) { const S = K.S, P = K.P, C = K.C; let any = 0;
      for (let i = 0; i < K.N; i++) { const o = i * 8, p6 = i * 6; if (S[o + 6] <= 0) { if (C[p6] || C[p6 + 3]) C.fill(0, p6, p6 + 6); continue; } any = 1;
        S[o + 6] -= dt; S[o + 4] -= 24 * dt; const dr = Math.exp(-1.6 * dt); S[o + 3] *= dr; S[o + 5] *= dr; S[o] += S[o + 3] * dt; S[o + 1] += S[o + 4] * dt; S[o + 2] += S[o + 5] * dt;
        if (S[o + 1] < 0.02 && S[o + 1] > -0.5 && Math.hypot(S[o], S[o + 2]) < this.R) { S[o + 1] = 0.02; if (S[o + 4] < 0) S[o + 4] *= -0.3; S[o + 3] *= 0.55; S[o + 5] *= 0.55; }
        const t = Math.max(0, S[o + 6] / S[o + 7]), L = 0.03 + 0.025 * t, k = Math.min(1, t * 1.7), g = 0.32 + 0.62 * t, b = 0.06 + 0.7 * t * t;
        P[p6] = S[o]; P[p6 + 1] = S[o + 1]; P[p6 + 2] = S[o + 2]; P[p6 + 3] = S[o] - S[o + 3] * L; P[p6 + 4] = S[o + 1] - S[o + 4] * L; P[p6 + 5] = S[o + 2] - S[o + 5] * L;
        C[p6] = k; C[p6 + 1] = g * k; C[p6 + 2] = b * k; C[p6 + 3] = k * 0.5; C[p6 + 4] = g * k * 0.3; C[p6 + 5] = b * k * 0.15; }
      K.g.attributes.position.needsUpdate = true; K.g.attributes.color.needsUpdate = true; if (!any) K.on = 0; }
    for (const f of this.fls || []) { if (f.t >= 0.22) continue; f.t += dt; const k = Math.min(1, f.t / 0.22); f.sp.scale.setScalar(f.s * (0.35 + 0.9 * Math.sqrt(k))); f.sp.material.opacity = Math.pow(1 - k, 1.5); if (k >= 1) f.sp.visible = false; }
    for (const o of this.scs || []) { if (o.life <= 0) continue; o.life -= dt; o.m.material.opacity = 0.85 * Math.max(0, Math.min(1, o.life / 4)); if (o.life <= 0 || Math.hypot(o.m.position.x, o.m.position.z) > this.R) { o.life = 0; o.m.visible = false; } } }
  skClear() { const K = this.sk; if (K) { K.S.fill(0); K.C.fill(0); K.g.attributes.color.needsUpdate = true; K.on = 0; } for (const f of this.fls || []) { f.t = 1; f.sp.visible = false; } for (const o of this.scs || []) { o.life = 0; o.m.visible = false; } }
  sawPt(c) { const q = c.slots && c.slots.find(s => s && s.type === 'saw' && s.wm); if (!q) return null; if (q.sp === undefined) q.sp = q.wm.getObjectByName('spin') || null; return (q.sp || q.wm).getWorldPosition(this._sv || (this._sv = new THREE.Vector3())); }
  wSpin(dt) { dt = Math.min(dt, 0.05); for (const c of this.cars) { if (c.elim || !c.slots) continue; if (c.mgS) c.mgS *= Math.exp(-2.2 * dt);
      for (const q of c.slots) { if (!q || !q.wm) continue; if (q.sp === undefined) q.sp = q.wm.getObjectByName('spin') || null; if (!q.sp) continue; const v = q.type === 'saw' ? (c.ram > 0 ? 48 : 16) : q.type === 'minigun' ? c.mgS || 0 : 6; q.sp.rotation[q.sp.userData.axis || 'y'] += v * dt; } } }
  vClr(x, z, w) { const L = w.def.l / 2 + 0.8; let m = this.R - 1.5 - L - Math.hypot(x, z);
    for (const r of this.ramps) { if (!r.m.visible) continue; const dx = x - r.x, dz = z - r.z, sn = Math.sin(r.h), cs = Math.cos(r.h), lz = dx * sn + dz * cs, lx = dx * cs - dz * sn, qx = Math.abs(lx) - r.w / 2, qz = Math.abs(lz) - r.l / 2, d = qx > 0 || qz > 0 ? Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) : Math.max(qx, qz); m = Math.min(m, d - L); }
    for (const b of this.bumpers) m = Math.min(m, Math.hypot(x - b.x, z - b.z) - 1.25 - L);
    for (const v of this.vents) m = Math.min(m, Math.hypot(x - v.x, z - v.z) - 1.5 - L);
    const cr = this.crusher; if (cr && (cr.s || cr.m.position.y < 7)) { const qx = Math.abs(x - cr.x) - 2.6, qz = Math.abs(z - cr.z) - 2.6; m = Math.min(m, (qx > 0 || qz > 0 ? Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) : Math.max(qx, qz)) - L); } return m; }
  crPush(w) { const cr = this.crusher; if (!cr || cr.m.position.y > 6.5) return; const h = 2.62, hl = w.def.l / 2, hw = w.def.w / 2;
    for (let it = 0; it < 3; it++) { const fx = Math.sin(w.h), fz = Math.cos(w.h), rx = Math.cos(w.h), rz = -Math.sin(w.h); let bx = 0, bz = 0, bd = 0;
      for (const [u, v] of [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [hl, 0], [-hl, 0], [0, hw], [0, -hw], [0, 0]]) { const px = w.x + fx * u + rx * v - cr.x, pz = w.z + fz * u + rz * v - cr.z, qx = h - Math.abs(px), qz = h - Math.abs(pz); if (qx <= 0 || qz <= 0) continue; if (qx < qz) { if (qx > bd) { bd = qx; bx = Math.sign(px) || 1; bz = 0; } } else if (qz > bd) { bd = qz; bx = 0; bz = Math.sign(pz) || 1; } }
      if (!bd) break; w.x += bx * bd; w.z += bz * bd; const vn = w.vx * bx + w.vz * bz; if (vn < 0) { w.vx -= bx * vn * 1.3; w.vz -= bz * vn * 1.3; } } }
  vPlan(w) { if (this.R >= 9) { const l = this.vClr(w.x + Math.sin(w.h + 0.8) * 4, w.z + Math.cos(w.h + 0.8) * 4, w), r = this.vClr(w.x + Math.sin(w.h - 0.8) * 4, w.z + Math.cos(w.h - 0.8) * 4, w); return { x: w.x, z: w.z, r: 1, dir: l >= r ? 1 : -1 }; } return { x: w.x, z: w.z, r: 0, dir: 1 }; }
  vPlanOld(w) { const fx = Math.sin(w.h), fz = Math.cos(w.h), lim = this.R - 1.5;
    for (const rc of [6.5, 5.6, 4.9]) { let best = null;
      for (let x = -lim; x <= lim; x += 1.2) for (let z = -lim; z <= lim; z += 1.2) { if (Math.hypot(x, z) > lim - rc) continue; let ok = true; for (let q = 0; q < 20 && ok; q++) { const a = q / 20 * 6.2832; if (this.vClr(x + Math.cos(a) * rc, z + Math.sin(a) * rc, w) < 0) ok = false; } if (!ok) continue;
        const sc = Math.abs(Math.hypot(w.x - x, w.z - z) - rc); if (!best || sc < best.sc) best = { x, z, r: rc, sc }; }
      if (best) { const d = Math.hypot(w.x - best.x, w.z - best.z) || 1, dx = (w.x - best.x) / d, dz = (w.z - best.z) / d; best.dir = -dz * fx + dx * fz >= 0 ? 1 : -1; return best; } }
    return { x: w.x, z: w.z, r: 0, dir: 1 }; }
  carBoom(c) { if (c.elim || c.falling) return; const R = Math.random, u = c.mesh.userData; c.fireT = 0; c.fw1 = c.fw2 = 0;
    this.explode(c.x, 1, c.z, true); this.blast(c.x, c.z, 7.5, 34, c); this.flash(c.x, 1.6, c.z, 14); this.sparks(c.x, 1, c.z, 0, 1, 0, 60, 18, 1.4);
    for (let i = 0; i < 22; i++) { const a = R() * 6.28, sp = 4 + R() * 10; this.flame(c.x + Math.cos(a) * 0.8, 1 + R(), c.z + Math.sin(a) * 0.8, Math.cos(a) * sp * 0.5, 3 + R() * 8, Math.sin(a) * sp * 0.5, 2 + R() * 2, 0.6 + R() * 0.5); }
    for (let i = 0; i < 9; i++) this.spawn(c.x + (R() - 0.5) * 2, 1.2, c.z + (R() - 0.5) * 2, (R() - 0.5) * 3, 3 + R() * 3, (R() - 0.5) * 3, 0x151515, 2.2 + R() * 1.6, 2.4 + R(), -0.8, 0.55);
    if (u.dU && u.bodyM) for (let k = 0; k < 6; k++) { if ((k < 4 ? u.dU.uP.value.getComponent(k) : u.dU.uB.value.getComponent(k - 4)) > 0.5) continue; if (this.tearPart(c, k, 0.5)) { const d = this.debris[this.debris.length - 1]; if (d && d.rb) { d.rb.kick.multiplyScalar(2.4); d.rb.kick.y += 7; } } }
    if (u.wh) u.wh.forEach((w, i) => { if (!w.lost && w.n) this.loseWheel(c, i); });
    if (this.solo) this.shake = Math.max(this.shake, 1.2 * (c === this.player ? 1 : 0.3 + 0.7 * this.near(c.x, c.z))); else { this.shk(c, 1.2); if (!this.views.length) this.shake = Math.max(this.shake, 1.2 * (0.3 + 0.5 * this.near(c.x, c.z))); }
    c.boomed = true; this.fell(c); this.eliminate(c); this.toast(c.name + ' BLEW UP!'); }
  explode(x, y, z, big, snd) {
    const cols = [0xffd23f, 0xff8a1f, 0xe53935, 0x333333]; this.sparks(x, y + 0.6, z, 0, 1, 0, big ? 70 : 34, big ? 17 : 12, 1.3); this.flash(x, y + 0.8, z, big ? 10 : 6.5);
    if (this.scs && y < 3 && Math.hypot(x, z) < this.R - 0.5) { const o = this.scs[this.sci = ((this.sci || 0) + 1) % this.scs.length]; o.life = 14; o.m.position.set(x, 0.03, z); o.m.rotation.y = Math.random() * 6.28; o.m.scale.setScalar(big ? 5.5 : 3.4); o.m.visible = true; o.m.material.opacity = 0.85; }
    for (let i = 0; i < (big ? 34 : 18); i++) { const a = Math.random() * 6.28, s = 3 + Math.random() * (big ? 16 : 9);
      this.spawn(x, y + 0.5, z, Math.cos(a) * s, 3 + Math.random() * 12, Math.sin(a) * s, cols[i % 4], 0.3 + Math.random() * 0.7, 0.5 + Math.random() * 0.7, 18); }
    const nr = this.near(x, z), Rn = () => Math.random() - 0.5; for (let i = 0; i < (big ? 7 : 3); i++) this.spawn(x + Rn() * 2, y + 0.6, z + Rn() * 2, Rn() * 3, 2 + Math.random() * 3, Rn() * 3, 0x1c1c1c, 1.5 + Math.random() * 1.5, 1.4 + Math.random(), -0.6, 0.5);
    for (let i = 0; i < (big ? 9 : 5); i++) this.flame(x + Rn() * 1.5, y + 0.7, z + Rn() * 1.5, Rn() * 7, 1 + Math.random() * 5, Rn() * 7, (big ? 2.2 : 1.5) + Math.random() * 1.4, 0.35 + Math.random() * 0.3);
    if (this.fl) { this.fl.position.set(x, y + 2.5, z); this.fl.intensity = big ? 5 : 3; }
    this.shake = Math.max(this.shake, (big ? 1 : 0.5) * (0.25 + 0.75 * nr)); this.sv = 0.25 + 0.6 * nr; if (snd !== 0 && !(snd && this.ws(snd, 0.55)) && !this.sfx('car_explosion', (big ? 0.45 : 0.3) * this.sv, big ? 1 : 1.2)) this.boom(big ? 0.8 : 0.5); this.sv = 1;
  }
  ringFx(x, z) { const r = this.rings.find(o => o.t >= 1) || this.rings[0]; r.t = 0; r.m.position.set(x, 0.3, z); r.m.visible = true; }
  blast(x, z, rad, J, owner) {
    for (const c of this.cars) { if (c === owner || c.elim || c.falling) continue; let dx = c.x - x, dz = c.z - z, d = Math.hypot(dx, dz);
      if (d < 0.3) { const a = Math.random() * 6.283; dx = Math.sin(a); dz = Math.cos(a); d = 1; }
      if (d < rad) { const by = owner || this.src; if (by && by !== c) { c.lastBy = by; c.lastT = this.time; } const k = J * (1 - d / rad * 0.7) / this.em(c), n = d || 1; c.vx += dx / n * k; c.vz += dz / n * k; const sp = Math.hypot(c.vx, c.vz), mx = c.def.speed * 1.7; if (sp > mx) { c.vx *= mx / sp; c.vz *= mx / sp; } c.slip = 0.6; this.dent(c, Math.min(1, k * this.em(c) / 30) * 0.5, -dx, -dz); c.av += (Math.random() - 0.5) * 6; } }
  }
  em(c) { return c.def.mass * (c.shield > 0 ? 2.5 : 1); }
  wrap(a) { return Math.atan2(Math.sin(a), Math.cos(a)); }
  nearest(o, range, ang, skip) { let best = null, bd = range; for (const c of this.cars) { if (c === o || c === skip || c.elim || c.falling || c.team === o.team || (skip && c.team === skip.team)) continue; const dx = c.x - o.x, dz = c.z - o.z, d = Math.hypot(dx, dz);
    if (d < bd && (!ang || Math.abs(this.wrap(Math.atan2(dx, dz) - o.h)) < ang)) { bd = d; best = c; } } return best; }
  push(c, nx, nz, J) { if (this.src && this.src !== c) { c.lastBy = this.src; c.lastT = this.time; } const k = J / this.em(c); c.vx += nx * k; c.vz += nz * k; const sp = Math.hypot(c.vx, c.vz), mx = c.def.speed * 1.7; if (sp > mx) { c.vx *= mx / sp; c.vz *= mx / sp; } c.slip = Math.max(c.slip, 0.5); if (J > 3 && this.src !== c) this.dent(c, Math.min(1, J / 40), -nx, -nz); }
  projMesh(kind, col) {
    const T = THREE, P = this.pjP || (this.pjP = {}), key = kind + ':' + (col || 0);
    if (!P[key]) {
      const S = (c, m, r) => new T.MeshStandardMaterial({ color: c, metalness: m, roughness: r }), A = (c, o) => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: T.AdditiveBlending, depthWrite: false });
      const M = this.pjM || (this.pjM = { olive: S(0x4f5734, 0.3, 0.65), white: S(0xe9ebed, 0.25, 0.4), red: S(0xb3231b, 0.3, 0.45), dark: S(0x1d1f22, 0.75, 0.45), steel: S(0x8f969c, 0.95, 0.3), brass: S(0xc9a04a, 1, 0.3), copper: S(0xb8693a, 1, 0.32), yel: S(0xe0b21e, 0.3, 0.5), rotor: new T.MeshBasicMaterial({ color: 0x222222, transparent: true, opacity: 0.35, depthWrite: false }), fl: A(0xff7a1e, 0.85), flc: A(0xfff0c2, 0.95), glow: A(0xff9a3a, 0.5), tr: A(0xfff3c4, 1), led: new T.MeshBasicMaterial({ color: 0xff2a1a }) });
      const gt = this.glowTx || (this.glowTx = this.tex(64, (x, sz) => { const gr = x.createRadialGradient(sz / 2, sz / 2, 0, sz / 2, sz / 2, sz / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, sz, sz); }));
      const g = new T.Group(), Z = Math.PI / 2, add = (geo, mat, x, y, z, rx, par) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (rx) m.rotation.x = rx; (par || g).add(m); return m; };
      const cyl = (r1, r2, h, mat, z, sg, par) => add(new T.CylinderGeometry(r1, r2, h, sg || 14), mat, 0, 0, z, Z, par), cone = (r, h, mat, z, back, par) => add(new T.ConeGeometry(r, h, 14), mat, 0, 0, z, back ? -Z : Z, par);
      const fins = (n, r, h, l, mat, z, rot) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + (rot || 0), f = add(new T.BoxGeometry(0.012, h, l), mat, Math.cos(a) * (r + h / 2), Math.sin(a) * (r + h / 2), z); f.rotation.z = a - Math.PI / 2; } };
      const flame = (z, len, w) => { const f = new T.Group(); f.name = 'fl'; f.position.z = z; g.add(f); cone(w, len, M.fl, -len / 2, 1, f); cone(w * 0.55, len * 0.55, M.flc, -len * 0.275, 1, f); const sp = new T.Sprite(new T.SpriteMaterial({ map: gt, color: 0xff9a3a, transparent: true, blending: T.AdditiveBlending, depthWrite: false })); sp.scale.setScalar(w * 11); f.add(sp); };
      if (kind === 'rocket') { cyl(0.085, 0.085, 0.8, M.olive, 0); cone(0.085, 0.26, M.dark, 0.53); cyl(0.087, 0.087, 0.05, M.yel, 0.33); cyl(0.087, 0.087, 0.03, M.yel, -0.05); fins(4, 0.085, 0.13, 0.2, M.olive, -0.3, Math.PI / 4); cyl(0.06, 0.075, 0.08, M.dark, -0.44); flame(-0.48, 0.6, 0.075); }
      else if (kind === 'missile') { cyl(0.07, 0.07, 1.0, M.white, 0); cone(0.07, 0.28, M.white, 0.64); cyl(0.072, 0.072, 0.06, M.red, 0.4); cyl(0.072, 0.072, 0.03, M.red, -0.2); fins(4, 0.07, 0.07, 0.12, M.white, 0.25); fins(4, 0.07, 0.14, 0.2, M.white, -0.38); cyl(0.05, 0.065, 0.07, M.dark, -0.535); flame(-0.57, 0.7, 0.065); }
      else if (kind === 'shell') { cyl(0.11, 0.11, 0.34, M.steel, 0); cone(0.11, 0.28, M.steel, 0.31); cyl(0.116, 0.116, 0.05, M.copper, -0.12); cyl(0.108, 0.1, 0.03, M.dark, -0.185); add(new T.SphereGeometry(0.08, 12, 8), M.flc, 0, 0, -0.2); cone(0.09, 1.3, M.glow, -0.86, 1); }
      else if (kind === 'drone') { add(new T.BoxGeometry(0.34, 0.1, 0.44), M.dark, 0, 0.06, 0); add(new T.BoxGeometry(0.22, 0.05, 0.26), M.olive, 0, 0.13, -0.02); add(new T.SphereGeometry(0.035, 10, 8), M.led, 0, 0.08, 0.23);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const ar = add(new T.BoxGeometry(0.03, 0.025, 0.36), M.dark, sx * 0.17, 0.07, sz * 0.17); ar.rotation.y = sx * sz * Math.PI / 4; add(new T.CylinderGeometry(0.025, 0.025, 0.06, 8), M.steel, sx * 0.3, 0.11, sz * 0.3); const ro = add(new T.CylinderGeometry(0.16, 0.16, 0.008, 20), M.rotor, sx * 0.3, 0.145, sz * 0.3); ro.name = 'rot'; }
        cyl(0.065, 0.065, 0.28, M.olive, 0.0).position.y = -0.04; cone(0.065, 0.1, M.dark, 0.19).position.y = -0.04; g.scale.setScalar(1.3); }
      else { const tc = col ? A(col, 1) : M.tr, tg = col ? A(col, 0.5) : M.glow; cyl(0.022, 0.022, 0.9, tc, 0, 6); cone(0.06, 1.8, tg, -0.45, 1); add(new T.SphereGeometry(0.045, 8, 6), tc, 0, 0, 0.45); }
      g.traverse(n => { if (n.isMesh) n.castShadow = !n.material.isMeshBasicMaterial; });
      P[key] = g; }
    const o = P[key].clone(); o.userData = { shared: true }; return o; }
  shoot(c, o) { const T = THREE, a = c.h + (o.spread || 0), fx = Math.sin(a), fz = Math.cos(a), kind = o.kind || (o.homing && (o.y || 0) > 2 ? 'drone' : o.homing ? 'missile' : o.smoke ? 'rocket' : (o.size || 0) >= 0.4 ? 'shell' : 'bullet'), m = this.projMesh(kind, kind === 'bullet' ? o.color || 0 : 0); this.scene.add(m);
    let y = o.y; if (!y) { y = 1.2; const q = c.slots && c.slots[c.cur], sz = q && q.wm && q.wm.parent && q.wm.userData.sz; if (sz) { q.wm.updateWorldMatrix(true, false); const p = q.wm.localToWorld((this._mv || (this._mv = new T.Vector3())).set(0, sz.y * 0.55, 0)); y = Math.max(0.7, Math.min(3, p.y)); } }
    const x0 = c.x + fx * (c.def.r + 0.8) + fz * (o.side || 0), z0 = c.z + fz * (c.def.r + 0.8) - fx * (o.side || 0), R = Math.random; m.position.set(x0, y, z0); m.rotation.y = a;
    if (kind === 'bullet' || kind === 'shell') { this.spawn(x0, y, z0, fx * 3, 0.4, fz * 3, 0xffd27a, kind === 'shell' ? 0.7 : 0.3, 0.06, 0); if (kind === 'shell') this.spawn(x0, y, z0, fx * 2, 0.6, fz * 2, 0x9a9a9a, 0.6, 0.9, -0.4, 0.5); }
    else if (kind !== 'drone') for (let q = 0; q < 2; q++) this.spawn(x0 - fx * 0.6, y, z0 - fz * 0.6, -fx * (1 + R() * 2) + (R() - 0.5), 0.3 + R() * 0.6, -fz * (1 + R() * 2) + (R() - 0.5), 0xc9c9c9, 0.4, 0.9, -0.4, 0.5);
    this.rockets.push({ mesh: m, fl: m.getObjectByName('fl'), rot: m.children.filter(n => n.name === 'rot'), x: x0, z: z0, y, vx: fx * o.speed, vz: fz * o.speed, h: a, snd: o.snd, owner: c, life: o.life || 1.6, rad: o.rad || 0, J: o.J, homing: o.homing || 0, fx: o.fx, smoke: o.smoke }); }
  cone(c, range, ang, J, fwd) { const fx = Math.sin(c.h), fz = Math.cos(c.h); for (const o of this.cars) { if (o === c || o.elim || o.falling) continue; const dx = o.x - c.x, dz = o.z - c.z, d = Math.hypot(dx, dz) || 1;
    if (d < range + o.def.r && Math.abs(this.wrap(Math.atan2(dx, dz) - c.h)) < ang) this.push(o, fwd ? fx : dx / d, fwd ? fz : dz / d, J * (1 - 0.4 * Math.min(1, d / range))); } }
  beam(x, z, h, len, color, thick, y) { const T = THREE, m = new T.Mesh(new T.BoxGeometry(thick, thick, 1), new T.MeshBasicMaterial({ color, transparent: true })); m.scale.z = len; m.rotation.y = h; m.position.set(x + Math.sin(h) * len / 2, y, z + Math.cos(h) * len / 2); this.scene.add(m); this.fxs.push({ mesh: m, life: 0.25 }); }
  line(c, range, w, J, color, thick) { const fx = Math.sin(c.h), fz = Math.cos(c.h); for (const o of this.cars) { if (o === c || o.elim || o.falling) continue; const dx = o.x - c.x, dz = o.z - c.z, t = dx * fx + dz * fz;
    if (t > 0 && t < range && Math.abs(dx * fz - dz * fx) < w + o.def.r) this.push(o, fx, fz, J); } this.beam(c.x + fx * 1.5, c.z + fz * 1.5, c.h, range, color, thick, c.mesh.userData.top + 0.4); }
  fire(c) {
    if (!c || c.elim || c.falling || !c.weapon || c.wcd > 0 || c.burst || this.phase !== 'playing') return; const k = c.weapon, d = this.W[k]; c.wcd = 0.6;
    if (d[1]) c.burst = { k, n: d[1], iv: d[2], t: 0 }; else { this.act(c, k); this.useAmmo(c); }
  }
  act(c, k) { this.sv = this.me(c) ? this.mv(c) : 0.3 * this.near(c.x, c.z); this.src = c; try { this.actRaw(c, k); } finally { this.sv = 1; this.src = null; } }
  actRaw(c, k) {
    const T = THREE, fx = Math.sin(c.h), fz = Math.cos(c.h), me = this.me(c), R = () => Math.random() - 0.5, sh = v => { if (this.solo) this.shake = Math.max(this.shake, me ? v : v * 0.3); else if (me) this.shk(c, v); else if (!this.views.length) this.shake = Math.max(this.shake, v * 0.3 * this.near(c.x, c.z)); };
    switch (k) {
      case 'rocketpod': for (const sd of [-0.35, 0.35]) this.shoot(c, { speed: 46, rad: 5, J: 18, side: sd, smoke: 1, snd: 'rocket_impact' }); if (!this.ws('rocket_fire', 0.45)) { this.whoosh(0.5, 0.3); this.tone(140, 0.15, 'sine', 0.25, 50); } break;
      case 'missilerack': this.shoot(c, { speed: 32, rad: 4, J: 9, homing: 4.5, life: 3, smoke: 1, spread: R() * 0.5, color: 0xff7a50, snd: 'missile_impact' }); if (!this.ws('missile_fire', 0.3)) this.whoosh(0.4, 0.22); break;
      case 'minigun': this.shoot(c, { speed: 65, J: 1.3, size: 0.12, life: 0.7, spread: R() * 0.1 }); c.mgS = 40; if (!this.wl(c, 'minigun_loop', 0.26, 'minigun_spinup') && (this.mgT = (this.mgT || 0) + 1) % 2) { this.nz(0.035, 0.12, { f: 3000, to: 600 }); this.tone(120, 0.04, 'sine', 0.08, 60); } break;
      case 'cannon': this.shoot(c, { speed: 60, rad: 5.5, J: 44, size: 0.45, len: 2, snd: 'cannon_impact' }); this.push(c, -fx, -fz, 7); if (!this.ws('cannon_fire', 0.55)) this.boom(1.1); if (me) this.ws('1d_cannon_reload', 0.28, 0.9); sh(0.7); break;
      case 'flamer': this.cone(c, 8, 0.45, 2.6, 0); for (let i = 0; i < 5; i++) { const a = c.h + R() * 0.7, v = 10 + Math.random() * 12; this.flame(c.x + fx * 2.2, 1.2, c.z + fz * 2.2, Math.sin(a) * v * 1.5 + c.vx, 0.5 + Math.random() * 1.5, Math.cos(a) * v * 1.5 + c.vz, 0.7 + Math.random() * 0.7, 0.35 + Math.random() * 0.15); }
        if (!this.wl(c, 'flame_loop', 0.28, 'flame_ignite')) this.nz(0.22, 0.05, { f: 600, to: 1000, atk: 0.06 }); break;
      case 'tesla': this.ringFx(c.x, c.z); this.blast(c.x, c.z, 10, 26, c); sh(0.6); if (this.nearest(c, 10)) this.ws('1f_tesla_zap_hit', 0.3, 0.18); if (!this.ws('tesla_zap', 0.5)) { this.zap(0.5, 0.16); this.tone(60, 0.5, 'sine', 0.3, 30); } break;
      case 'minerack': { const m = new T.Mesh(new T.CylinderGeometry(0.7, 0.8, 0.3, 12), new T.MeshBasicMaterial({ color: 0xffd23f })); this.scene.add(m); const x = c.x - fx * 3.2, z = c.z - fz * 3.2; m.position.set(x, 0.15, z); this.mines.push({ mesh: m, x, z, t: 0, by: c }); if (!this.ws('mine_deploy', 0.4)) this.tone(500, 0.1, 'square', 0.06, 250); } break;
      case 'railgun': if (this.nearest(c, 60, 0.06)) this.ws('1h_railgun_impact', 0.4, 0.06); this.line(c, 60, 0.7, 30, 0x6fd8ff, 0.3); if (!this.ws('railgun_fire', 0.5)) { this.tone(400, 0.12, 'sine', 0.12, 3200); this.nz(0.08, 0.5, { type: 'highpass', f: 1800, at: 0.1 }); this.nz(0.5, 0.25, { f: 2500, to: 200, at: 0.1, rev: 1 }); } sh(0.5); break;
      case 'mortar': { const t = this.nearest(c, 34), x = t ? t.x + t.vx * 0.9 : c.x + fx * 16, z = t ? t.z + t.vz * 0.9 : c.z + fz * 16, m = new T.Mesh(new T.RingGeometry(2.2, 2.6, 28), new T.MeshBasicMaterial({ color: 0xff3b30, side: T.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.06, z); this.scene.add(m);
        { const sh = this.projMesh('shell'); sh.scale.setScalar(1.6); sh.rotation.x = Math.PI / 2; sh.position.set(x, 26, z); this.scene.add(sh); this.lobs.push({ mesh: m, sh, x, z, t: 1.1, by: c }); } if (this.ws('mortar_fire', 0.45)) this.ws('mortar_whistle', 0.18, 0.15); else { this.tone(160, 0.14, 'sine', 0.4, 55); this.nz(0.1, 0.3, { f: 800 }); this.tone(1900, 1.0, 'sine', 0.04, 500, 0.1); } } break;
      case 'saw': c.ram = 0.2; if (!this.wl(c, 'saw_loop', 0.16, 'saw_spinup')) this.nz(0.12, 0.02, { type: 'bandpass', f: 2200, q: 2 }); { const sp = this.sawPt(c); if (sp) for (const o of this.cars) { if (o === c || o.elim || o.falling) continue; const dx = o.x - sp.x, dz = o.z - sp.z, dl = Math.hypot(dx, dz) || 1; if (dl < o.def.r + 0.9) { this.sparks(sp.x + dx / dl * 0.5, sp.y, sp.z + dz / dl * 0.5, -dz / dl, 0.4, dx / dl, 10, 11, 0.6); break; } } } break;
      case 'magnet': if (!this.wl(c, 'magnet_loop', 0.2, 'magnet_power')) this.tone(80, 0.12, 'sine', 0.05); for (const o of this.cars) { if (o === c || o.elim || o.falling) continue; const dx = c.x - o.x, dz = c.z - o.z, d = Math.hypot(dx, dz); if (d < 4.6) this.ws('2b_magnet_clamp', 0.4); if (d < 18 && d > 3) { this.push(o, dx / d, dz / d, 1.6); this.spawn(o.x, 1.5, o.z, dx / d * 14, 0, dz / d * 14, 0x6fd8ff, 0.2, 0.3, 0); } } break;
      case 'hammer': this.cone(c, 6.5, 0.6, 40, 1); for (let i = 0; i < 10; i++) this.spawn(c.x + fx * 3, 0.5, c.z + fz * 3, R() * 10, 2 + Math.random() * 4, R() * 10, 0x9a9a9a, 0.4, 0.5, 8, 0.6); this.ws('2c_piston_retract', 0.28, 0.55); if (!this.ws('hammer_strike', 0.55)) { this.crash(1); this.tone(70, 0.4, 'sine', 0.5, 28); } sh(0.8); break;
      case 'oil': { const m = new T.Mesh(new T.PlaneGeometry(9, 9), new T.MeshStandardMaterial({ map: this.oilTex(), transparent: true, opacity: 0.95, roughness: 0.08, metalness: 0.2, envMapIntensity: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 })); m.rotation.x = -Math.PI / 2; m.rotation.z = Math.random() * 6.28; m.scale.set(0.3, 0.3, 1); const x = c.x - fx * 4, z = c.z - fz * 4; m.position.set(x, 0.03, z); this.scene.add(m);
        this.slicks.push({ mesh: m, x, z, r: 3.5, life: 12 }); if (!this.ws('oil_splat', 0.4)) { this.nz(0.4, 0.15, { f: 300, to: 120, atk: 0.08 }); this.tone(180, 0.3, 'sine', 0.1, 70); } } break;
      case 'emp': this.ringFx(c.x, c.z); for (const o of this.cars) if (o !== c && !o.elim && !o.falling && Math.hypot(o.x - c.x, o.z - c.z) < 14) { o.emp = 3.5; if (this.me(o)) { this.cue('CC42', 0.4 * this.mv(o), 2); this.emit('emp', o); } } if (this.nearest(c, 14)) this.ws('2e_engine_stall', 0.32, 0.3); if (!this.ws('emp_pulse', 0.45)) { this.zap(0.6, 0.12); this.tone(1400, 0.7, 'sine', 0.1, 40); } break;
      case 'harpoon': { const t = this.nearest(c, 24, 0.5), y = c.mesh.userData.top + 0.4; if (t) { const dx = c.x - t.x, dz = c.z - t.z, d = Math.hypot(dx, dz) || 1; this.push(t, dx / d, dz / d, 26); this.beam(c.x, c.z, Math.atan2(-dx, -dz), d, 0xc9d2e6, 0.1, y); } else this.beam(c.x, c.z, c.h, 24, 0xc9d2e6, 0.1, y); if (this.ws('harpoon_launch', 0.4)) { if (t) { this.ws('harpoon_hit', 0.4, 0.12); this.ws('2f_winch_reel_loop', 0.22, 0.2, 0.8); } } else { this.nz(0.12, 0.3, { type: 'bandpass', f: 3000, to: 600, q: 2 }); this.tone(900, 0.25, 'sine', 0.06, 700); } } break;
      case 'glove': if (this.nearest(c, 9, 0.35)) this.ws('2g_glove_punch', 0.55, 0.1); this.ws('2g_glove_retract', 0.28, 0.5); this.cone(c, 9, 0.35, 30, 1); this.beam(c.x + fx * 1.5, c.z + fz * 1.5, c.h, 7, 0xe53935, 0.8, 1.2); if (!this.ws('glove_punch', 0.5)) { this.tone(110, 0.2, 'sine', 0.45, 40); this.nz(0.12, 0.35, { f: 900, to: 150 }); this.tone(320, 0.5, 'sine', 0.05, 520); } sh(0.5); break;
      case 'drone': this.shoot(c, { speed: 23, rad: 5, J: 26, homing: 5, life: 7, y: 3.2, size: 0.5, len: 1, color: 0x9aa1ab, snd: 'drone_impact' }); this.ws('2h_drone_flight_loop', 0.16, 0.7, 2.6); if (!this.ws('drone_deploy', 0.4)) { this.tone(170, 0.6, 'sawtooth', 0.06, 290); this.tone(343, 0.6, 'sawtooth', 0.04, 585); } break;
      case 'sonic': this.cone(c, 12, 0.9, 28, 0); this.ringFx(c.x + fx * 3, c.z + fz * 3); if (!this.ws('sonic_wave', 0.5)) { this.tone(85, 0.8, 'sine', 0.6, 26); this.tone(170, 0.5, 'triangle', 0.2, 50); this.nz(0.6, 0.15, { f: 400, to: 80, rev: 1 }); } sh(0.6); break;
      case 'laser': this.line(c, 40, 0.5, 1.2, 0xff3b30, 0.14); if (!this.wl(c, 'laser_loop', 0.16, 'laser_start')) this.tone(620, 0.14, 'sine', 0.03); break;
    }
  }
  warmPk() { if (this.pkWarm || !this.renderer) return; this.pkWarm = true; try { const w = ['boost', 'shield', 'repair'].map(t => { const m = this.pickupMesh(t); m.position.set(0, -300, 0); this.scene.add(m); return m; }); for (const t of Object.keys(this.W)) { try { const m = this.makeWeapon(t); m.position.set(0, -300, 0); this.scene.add(m); w.push(m); } catch (e) { console.warn('weapon', t, e); } } this.renderer.compile(this.scene, this.camera); for (const m of w) this.scene.remove(m); } catch (_) {} }
  pkHalo(g, col, k) { const T = THREE, C = this.pkHC || (this.pkHC = {});
    if (!C[col]) { const gt = this.pkGlow || (this.pkGlow = this.tex(128, (x, s) => { const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, s, s); }));
      C[col] = [new T.Mesh(new T.RingGeometry(0.95, 1.18, 48), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false })), new T.Mesh(new T.CircleGeometry(1.25, 40), new T.MeshBasicMaterial({ color: col, map: gt, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }))]; }
    C[col].forEach((p, i) => { const m = p.clone(); m.rotation.x = -Math.PI / 2; m.scale.setScalar(1 / k); m.userData.gy = i ? 0.04 : 0.05; m.onBeforeRender = function () { this.matrixWorld.elements[13] = this.userData.gy; }; g.add(m); }); }
  pickupMesh(type) {
    const T = THREE, P = this.pkP || (this.pkP = {});
    if (!P[type]) {
      const g = new T.Group(), b = new T.Group(), col = { boost: 0xff8a1f, shield: 0x4aa3ff, repair: 0x3ddc84 }[type] || 0xffc23a; g.add(b);
      const chrome = this.pkChrome || (this.pkChrome = new T.MeshStandardMaterial({ color: 0xdfe6ee, metalness: 1, roughness: 0.16 }));
      const add = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; b.add(m); return m; };
      const ctex = (w, h, draw) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h); const t = new T.CanvasTexture(cv); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; };
      if (type === 'boost') {
        const paint = new T.MeshPhysicalMaterial({ color: 0xff5a14, metalness: 0.45, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.06, emissive: 0x2a0a00 }), brass = new T.MeshStandardMaterial({ color: 0xd4a63a, metalness: 1, roughness: 0.3 }), red = new T.MeshStandardMaterial({ color: 0xc81e1e, metalness: 0.2, roughness: 0.45 });
        const lt = ctex(512, 200, (x, w, h) => { x.fillStyle = '#f2efe8'; x.fillRect(0, 0, w, h); x.fillStyle = '#161a24'; x.fillRect(0, 0, w, 18); x.fillRect(0, h - 18, w, 18); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '900 84px Arial Black, Impact, sans-serif'; x.fillText('NITROUS', w / 2, 88); x.fillStyle = '#c81e1e'; x.font = 'bold 34px Arial, sans-serif'; x.fillText('N\u2082O  BOOST', w / 2, 150); });
        lt.wrapS = T.RepeatWrapping; lt.repeat.set(2, 1);
        add(new T.CylinderGeometry(0.3, 0.3, 0.95, 40), paint, 0, 0, 0);
        add(new T.SphereGeometry(0.3, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), paint, 0, 0.475, 0);
        add(new T.SphereGeometry(0.3, 40, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), paint, 0, -0.475, 0).scale.y = 0.45;
        add(new T.CylinderGeometry(0.304, 0.304, 0.42, 40, 1, true), new T.MeshStandardMaterial({ map: lt, roughness: 0.4, metalness: 0.1 }), 0, 0.02, 0);
        add(new T.CylinderGeometry(0.09, 0.13, 0.14, 20), chrome, 0, 0.82, 0); add(new T.CylinderGeometry(0.11, 0.11, 0.16, 20), brass, 0, 0.96, 0); add(new T.CylinderGeometry(0.15, 0.15, 0.05, 24), red, 0, 1.07, 0);
        add(new T.CylinderGeometry(0.04, 0.04, 0.22, 12), chrome, 0.15, 0.95, 0).rotation.z = Math.PI / 2; b.position.y = -0.3; b.rotation.z = 0.32;
      } else if (type === 'shield') {
        const blue = new T.MeshPhysicalMaterial({ color: 0x1d6ee8, metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0x05173a }), wht = new T.MeshStandardMaterial({ color: 0xf4f7fb, metalness: 0.25, roughness: 0.25, emissive: 0x1c232c });
        const hs = k => { const s = new T.Shape(), p = (x, y) => [x * k, -0.1 + (y + 0.1) * k]; s.moveTo(...p(-0.6, 0.6)); s.lineTo(...p(0.6, 0.6)); s.lineTo(...p(0.6, 0.05)); s.quadraticCurveTo(...p(0.58, -0.5), ...p(0, -0.82)); s.quadraticCurveTo(...p(-0.58, -0.5), ...p(-0.6, 0.05)); s.closePath(); return s; };
        const ex = (sh, d, bv) => { const geo = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: bv, bevelSize: bv, bevelSegments: 3, curveSegments: 24 }); geo.translate(0, 0.1, -d / 2); return geo; };
        add(ex(hs(1), 0.1, 0.035), chrome, 0, 0, 0); add(ex(hs(0.84), 0.16, 0.02), blue, 0, 0, 0);
        const st = new T.Shape(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.12 : 0.29, a = i / 10 * Math.PI * 2 + Math.PI / 2; if (i) st.lineTo(Math.cos(a) * r, Math.sin(a) * r); else st.moveTo(Math.cos(a) * r, Math.sin(a) * r); } st.closePath();
        add(ex(st, 0.2, 0.015), wht, 0, 0, 0);
      } else {
        const grn = new T.MeshPhysicalMaterial({ color: 0x17a352, metalness: 0.4, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x03200d }), lid = new T.MeshPhysicalMaterial({ color: 0x118a43, metalness: 0.4, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x021a0a }), blk = new T.MeshStandardMaterial({ color: 0x15181d, roughness: 0.7 });
        const wt = ctex(256, 256, (x, w) => { x.clearRect(0, 0, w, w); x.strokeStyle = '#fff'; x.lineWidth = 12; x.beginPath(); x.arc(128, 128, 116, 0, Math.PI * 2); x.stroke(); x.save(); x.translate(128, 128); x.rotate(-Math.PI / 4); x.fillStyle = '#fff'; x.fillRect(-14, -66, 28, 136); x.beginPath(); x.arc(0, -70, 34, 0, Math.PI * 2); x.fill(); x.beginPath(); x.arc(0, 74, 24, 0, Math.PI * 2); x.fill(); x.globalCompositeOperation = 'destination-out'; x.fillRect(-12, -112, 24, 42); x.beginPath(); x.arc(0, 74, 11, 0, Math.PI * 2); x.fill(); x.restore(); });
        const dm = new T.MeshStandardMaterial({ map: wt, transparent: true, roughness: 0.35, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 });
        add(new T.BoxGeometry(1.2, 0.5, 0.6), grn, 0, -0.12, 0); add(new T.BoxGeometry(1.24, 0.16, 0.64), lid, 0, 0.21, 0); add(new T.BoxGeometry(1.25, 0.025, 0.65), blk, 0, 0.13, 0);
        add(new T.TorusGeometry(0.24, 0.038, 10, 28, Math.PI), chrome, 0, 0.3, 0); for (const sx of [-0.24, 0.24]) add(new T.BoxGeometry(0.1, 0.05, 0.14), blk, sx, 0.305, 0);
        for (const sx of [-0.38, 0.38]) for (const sz of [-0.31, 0.31]) add(new T.BoxGeometry(0.12, 0.16, 0.04), chrome, sx, 0.12, sz);
        for (const sz of [0.302, -0.302]) { const d = add(new T.PlaneGeometry(0.4, 0.4), dm, 0, -0.1, sz); d.castShadow = false; if (sz < 0) d.rotation.y = Math.PI; }
        b.scale.setScalar(1.15);
      }
      const gt = this.pkGlow || (this.pkGlow = this.tex(128, (x, s) => { const gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.28)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, s, s); }));
      const ring = new T.Mesh(new T.RingGeometry(0.95, 1.18, 48), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.9, side: T.DoubleSide, depthWrite: false })), disc = new T.Mesh(new T.CircleGeometry(1.25, 40), new T.MeshBasicMaterial({ color: col, map: gt, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false }));
      for (const [m, y] of [[ring, 0.05], [disc, 0.04]]) { m.rotation.x = -Math.PI / 2; m.position.y = -1.25; m.userData.gy = y; g.add(m); }
      g.userData = { shared: true }; P[type] = g; }
    const m = P[type].clone(true); m.traverse(n => { if (n.userData.gy !== undefined) n.onBeforeRender = function () { this.matrixWorld.elements[13] = this.userData.gy; }; }); return m;
  }
  spawnPickup() {
    const T = THREE, types = Object.keys(this.W).concat(['boost', 'boost', 'shield', 'shield', 'repair', 'repair', 'repair']), type = types[Math.floor(Math.random() * types.length)];
    const col = { boost: 0xff8a1f, shield: 0x4aa3ff, repair: 0x3ddc84 }[type] || 0xffc23a;
    const a = Math.random() * 6.28, d = Math.sqrt(Math.random()) * this.R * 0.75, wp = !!this.WNAMES[type], m = wp ? this.makeWeapon(type) : this.pickupMesh(type);
    if (wp) { const q = m.userData.sz, k = q ? 1.7 / Math.max(q.z, q.x, q.y * 1.4) : 1; m.scale.setScalar(k); this.pkHalo(m, col, k); }
    const x = Math.sin(a) * d, z = Math.cos(a) * d; m.position.set(x, 1.3, z); this.scene.add(m); this.pickups.push({ mesh: m, x, z, type });
  }

  ai(c, dt) {
    if ((this.mode === 'bomb' || this.mode === 'crown') && this.aiMode(c, dt)) return;
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), d0 = Math.hypot(c.x, c.z), margin = Math.min(7, this.R * 0.35);
    c.aiT -= dt;
    if (c.aiT <= 0 || !c.tgt || c.tgt.elim || c.tgt.falling) { c.aiT = 0.6 + Math.random() * 1.2; let best = null, bd = 1e9;
      for (const o of this.cars) { if (o === c || o.elim || o.falling || o.team === c.team) continue; const d = Math.hypot(o.x - c.x, o.z - c.z) * (0.6 + Math.random() * 0.8) * (o.hum ? this.D.pb : 1); if (d < bd) { bd = d; best = o; } } c.tgt = best; }
    let tx = 0, tz = 0; const t = c.tgt;
    if (d0 > this.R - margin) { tx = 0; tz = 0; }
    else { let pk = null, pd = 14; if (!c.weapon || c.dmg > 0.5) for (const p of this.pickups) { if ((c.weapon && p.type !== 'repair') || (p.type === 'repair' && c.dmg < 0.3 && !c.nLost)) continue; const d = Math.hypot(p.x - c.x, p.z - c.z); if (d < pd) { pd = d; pk = p; } }
      if (pk) { tx = pk.x; tz = pk.z; } else if (this.zone && Math.hypot(c.x - this.zone.x, c.z - this.zone.z) > 3.5) { tx = this.zone.x; tz = this.zone.z; } else if (t) { const tl = Math.hypot(t.x, t.z) || 1; tx = t.x - t.x / tl * 1.5; tz = t.z - t.z / tl * 1.5; } }
    const diff = wrap(Math.atan2(tx - c.x, tz - c.z) - c.h);
    c.inp.steer = Math.max(-1, Math.min(1, -diff * this.D.st)); c.inp.gas = this.time < c.i * 0.35 ? 0 : Math.min(1, this.D.gas * (this.wk || 1)); c.inp.brake = 0; c.inp.boost = 0;
    if (t) { const dx = t.x - c.x, dz = t.z - c.z, d = Math.hypot(dx, dz), al = Math.abs(wrap(Math.atan2(dx, dz) - c.h));
      if (al < 0.3 && d < 13 && c.boost > this.D.bt && d0 < this.R - margin) c.inp.boost = 1; else if (c.inp.boostHold && c.boost > 0.05 && al < 0.5 && d < 13) c.inp.boost = 1;
      c.inp.boostHold = c.inp.boost;
      if (c.weapon && c.wcd <= 0 && !c.burst && this.time > 6) { const wd = this.W[c.weapon]; if (d < wd[4] && (wd[3] === 'behind' ? al > wd[5] : al < wd[5])) { this.fire(c); c.wcd += this.D.wd; } } }
  }
  drive(c, inp, dt) {
    const d = c.def, fx = Math.sin(c.h), fz = Math.cos(c.h); let fs = c.vx * fx + c.vz * fz, ls = c.vx * fz - c.vz * fx;
    const bo = inp.boost && c.boost > 0.02 && !(c.emp > 0), fzn = c.frozen > 0; c.boost = bo ? Math.max(0, c.boost - dt / 2.5) : Math.min(1, c.boost + dt / 9);
    const hp = Math.max(0.3, 1 - 0.17 * (c.nLost || 0) - 0.2 * c.dmg), max = d.speed * hp * (bo ? 1.45 : 1) * (fzn ? 0.4 : 1), acc = d.accel * hp * (bo ? 1.8 : 1) * (fzn ? 0.4 : 1), gas = c.emp > 0 ? 0 : bo ? Math.max(inp.gas, 1) : inp.gas;
    if (fzn && fs > max) fs *= Math.exp(-3 * dt);
    if (Math.abs(fs) > max * 1.05) fs -= (fs - Math.sign(fs) * max) * (1 - Math.exp(-2.2 * dt));
    if ((fzn || c.emp > 0) && Math.random() < 0.3) this.spawn(c.x + (Math.random() - 0.5) * 2, 1.6, c.z + (Math.random() - 0.5) * 2, 0, 1.5, 0, fzn ? 0xbfeaff : 0x6fd8ff, 0.22, 0.5, 0);
    if (gas && fs < max) fs += acc * gas * dt;
    if (inp.brake) { if (fs > 0.5) fs -= 32 * dt; else if (fs > -d.speed * 0.5) fs -= acc * 0.7 * dt; }
    { const gs = gas > 0.1, lf = gs && fs > -1.5 && fs < 5, lr = inp.brake && !gs && fs < 0.6 && fs > -3, tw = lf ? (bo ? 1 : 0.85) : lr ? 0.7 : 0; if (lf) c.wsd = 1; else if (lr) c.wsd = -1;
      c.ws = (c.ws || 0) + (tw * Math.max(0, 1 - Math.abs(fs) / 7) - (c.ws || 0)) * Math.min(1, dt * (tw ? 9 : 3));
      const bt = (inp.brake && fs > 0.4) || (gs && fs < -0.6) || (inp.brake && Math.abs(fs) <= 0.4) ? 1 : 0, rv = fs < -0.4 && !gs ? 1 : 0; c.brk = (c.brk || 0) + (bt - (c.brk || 0)) * Math.min(1, dt * 18); c.rev = (c.rev || 0) + (rv - (c.rev || 0)) * Math.min(1, dt * 14); }
    const sr = Math.min(1, Math.abs(fs) / d.speed), grip = (c.oil > 0 ? 0.3 : c.slip > 0 ? 1.2 : Math.max(1, 7 - 4.2 * Math.abs(inp.steer) * sr - (inp.brake && fs > 4 ? 2 : 0) - 1.1 * (c.nLost || 0))) * (this.grip || 1);
    fs *= Math.exp(-(gas || inp.brake ? 0.5 : 1.3) * dt); ls *= Math.exp(-grip * dt);
    c.h -= Math.max(-1, Math.min(1, inp.steer + (c.pull || 0))) * d.steer * Math.max(-1, Math.min(1, fs / 6)) * dt; c.av = Math.max(-4, Math.min(4, c.av)); c.h += c.av * dt; c.av *= Math.exp(-6 * dt); if (Math.abs(c.av) < 0.05) c.av = 0;
    c.vx = fx * fs + fz * ls; c.vz = fz * fs - fx * ls;
    const ud = c.mesh.userData, ac = (fs - c.pfs) / dt, kk = 1 - Math.exp(-8 * dt); c.pfs = fs;
    c.roll += (-inp.steer * sr * 0.1 - c.roll) * kk; c.pitch += (Math.max(-0.08, Math.min(0.08, -ac * 0.0035)) - c.pitch) * kk;
    ud.ch.rotation.z = c.roll + (c.rollOff || 0) + (c.tR || 0); ud.ch.rotation.x = c.pitch + (c.pitchOff || 0) + (c.tP || 0);
    if (c.dmg > 0.8) { if (this.phase === 'playing' && !c.elim && !c.falling) { c.fireT = (c.fireT || 0) + dt; const rem = 20 - c.fireT; if (this.me(c)) { if (!c.fw1 && rem < 10) { c.fw1 = 1; this.pop('ENGINE FIRE! GET A REPAIR', '#ff5a2a', 1, c); } if (!c.fw2 && rem < 3) { c.fw2 = 1; this.pop('ABOUT TO BLOW!', '#ff2a1a', 1, c); } } if (rem <= 0) c.boomNow = true; }
      const kf = Math.min(1, (c.fireT || 0) / 20), rr = c.dz && c.dz[1] > c.dz[0] + 0.15 ? -1 : 1, Rf = Math.random, ex = c.x + fx * d.l * 0.34 * rr, ez = c.z + fz * d.l * 0.34 * rr;
      if (Rf() < 0.6 + 0.4 * kf) this.flame(ex + (Rf() - 0.5) * 0.7, 1.05, ez + (Rf() - 0.5) * 0.7, c.vx * 0.35 + Rf() - 0.5, 1.2 + Rf() * 1.5 + kf * 1.5, c.vz * 0.35 + Rf() - 0.5, (0.9 + Rf() * 0.7) * (1 + kf * 0.9), 0.4 + Rf() * 0.2 + kf * 0.25);
      if (Rf() < 0.12 + 0.35 * kf) this.spawn(ex, 1.6, ez, c.vx * 0.2 + Rf() - 0.5, 1.5 + Rf(), c.vz * 0.2 + Rf() - 0.5, 0x1a1a1a, 0.9 + kf * 1.2, 1.4 + Rf(), -0.8, 0.5);
      if (kf > 0.85 && Rf() < 0.25) { this.sparks(ex, 1.1, ez, 0, 1, 0, 4, 5, 0.9); if (Rf() < 0.3) this.flash(ex, 1.2, ez, 1.6); } }
    else { c.fireT = 0; c.fw1 = c.fw2 = 0; }
    if (c.nLost && Math.abs(fs) > 3) for (const w of ud.wh) if (w.lost && Math.random() < 0.5) { const q = w.n.getWorldPosition(this.tv || (this.tv = new THREE.Vector3())); this.spawn(q.x, 0.15, q.z, -c.vx * 0.3 + (Math.random() - 0.5) * 4, 1 + Math.random() * 3, -c.vz * 0.3 + (Math.random() - 0.5) * 4, 0xffe08a, 0.1, 0.3, 15); } for (const w of ud.fw) w.rotation.y = (w.userData.flip ? 1 : -1) * inp.steer * 0.45; for (const w of ud.wh) { if (w.rr === undefined) w.rr = w.n && w.n.name ? /^Wheel_R/.test(w.n.name) : w.sz < 0; w.o.rotation.x += w.s * (fs + (w.rr ? (c.wsd || 1) * (c.ws || 0) * 26 : 0)) * dt / w.r; }
    c.skid = Math.abs(ls) > 3.2 ? Math.min(1, Math.abs(ls) / 9) : 0; c.mkT -= dt;
    { const ol = c.oil > 0 && Math.abs(fs) > 2, ma = Math.max(ol ? 0.85 : c.skid ? 0.25 + c.skid * 0.45 : 0, (c.ws || 0) > 0.3 ? c.ws * 0.62 : 0), R = Math.random, nv = this.me(c) ? 1 : this.near(c.x, c.z); c.ts = c.ts || [{}, {}];
      for (let q = 0; q < 2; q++) { const sx = q ? 1 : -1, st = c.ts[q], mx = c.x - fx * d.l * 0.31 + fz * sx * (d.w / 2 - 0.12), mz = c.z - fz * d.l * 0.31 - fx * sx * (d.w / 2 - 0.12);
        if (ma > 0.05) this.tmSeg(st, mx, mz, ma, 0.3, ol); else st.on = false;
        if (c.skid && R() < 0.22) this.spawn(mx, 0.3, mz, (R() - 0.5) * 2, 1.5 + R(), (R() - 0.5) * 2, 0xbfbfbf, 0.7 + R() * 0.6, 0.6, -1, 0.35);
        if ((c.ws || 0) > 0.18 && R() < c.ws * 0.9 * nv) { const k = c.wsd || 1; this.spawn(mx + (R() - 0.5) * 0.3, 0.22, mz + (R() - 0.5) * 0.3, -fx * k * (1 + R()) + (R() - 0.5) * 1.4, 0.5 + R() * 0.9, -fz * k * (1 + R()) + (R() - 0.5) * 1.4, 0xe2e2e2, 0.6 + R() * 0.6, 0.9 + R() * 0.5, -0.7, 0.22 + c.ws * 0.25); } } }
    if (Math.abs(fs) > 9 && Math.random() < 0.1) this.spawn(c.x - fx * d.l * 0.4, 0.2, c.z - fz * d.l * 0.4, (Math.random() - 0.5) * 2, 0.8, (Math.random() - 0.5) * 2, this.dustC || 0x777f88, 0.5, 0.7, -0.4, 0.2);
    if (c.dmg > 0.3) { const zz = c.dz || [1, 0, 0, 0], rr = zz[1] > zz[0] + 0.15 ? -1 : 1, hv = c.dmg, Rn = Math.random; if (Rn() < (hv > 0.8 ? 0.55 : hv > 0.5 ? 0.35 : 0.15)) this.spawn(c.x + fx * d.l * 0.36 * rr + (Rn() - 0.5) * 0.6, 1.15, c.z + fz * d.l * 0.36 * rr + (Rn() - 0.5) * 0.6, c.vx * 0.25 + (Rn() - 0.5) * 0.8, 1.6 + Rn() * 1.4 + hv, c.vz * 0.25 + (Rn() - 0.5) * 0.8, hv > 0.8 ? 0x0c0c0c : hv > 0.5 ? 0x2e2e2e : 0xb9bcc0, 0.35 + hv * 0.5, 1.1 + hv * 0.9, -0.7, hv > 0.5 ? 0.55 : 0.28); }
    if (bo) { const me = this.me(c), ex = d.w * 0.28, Rn = Math.random, bx = c.x - fx * (d.l / 2 + 0.1), bz = c.z - fz * (d.l / 2 + 0.1); for (const sx of me ? [-1, 1] : [0]) if (me || Rn() < 0.6) this.flame(bx + fz * sx * ex, 0.5, bz - fx * sx * ex, c.vx * 0.55 - fx * (7 + Rn() * 5), 0.2, c.vz * 0.55 - fz * (7 + Rn() * 5), 0.55 + Rn() * 0.3, 0.14 + Rn() * 0.1, 2);
      if (Rn() < 0.25) this.spawn(bx, 0.45, bz, c.vx * 0.4 - fx * 6 + (Rn() - 0.5) * 4, 1 + Rn() * 2, c.vz * 0.4 - fz * 6 + (Rn() - 0.5) * 4, 0xffd23f, 0.07, 0.35, 12);
      if (!c.wasBo) { for (let i = 0; i < 6; i++) this.flame(bx + (Rn() - 0.5) * 0.8, 0.55, bz + (Rn() - 0.5) * 0.8, c.vx * 0.4 - fx * (3 + Rn() * 5), 0.5 + Rn(), c.vz * 0.4 - fz * (3 + Rn() * 5), 0.9 + Rn() * 0.8, 0.22 + Rn() * 0.12, 1); this.spawn(bx, 0.5, bz, -fx * 2, 1, -fz * 2, 0x3a3a3a, 0.6, 0.6, -0.5, 0.4); } }
    c.wasBo = bo;
  }
  eliminate(c) {
    c.elim = true; c.mesh.visible = false; if (this.respawns) c.rsp = 2.2; else this.order.push(c); if (this.me(c)) { if (this.solo) this.quietLoops(); this.sfx(this.nset(c) ? 'CC18' : 'wreck_settle', 0.3 * this.mv(c), 1, 0.8); } const fy = this.floorY, ar = this.arena, Rn = () => Math.random() - 0.5;
    if (c.boomed) c.boomed = false; else if (ar === 'ice') { for (let i = 0; i < 26; i++) this.spawn(c.x + Rn() * 3, fy, c.z + Rn() * 3, Rn() * 9, 7 + Math.random() * 13, Rn() * 9, i % 2 ? 0xffffff : 0xbfe6ff, 0.45, 1.2, 22); { const k = this.me(c) ? 0.55 * this.mv(c) : 0.3 * this.near(c.x, c.z); this.sfx('CC05', k * 0.8); this.sfx('1j_ice_shatter', k); } this.shake = Math.max(this.shake, this.solo ? 0.6 : 0.6 * this.near(c.x, c.z)); }
    else if (ar === 'island') { for (let i = 0; i < 16; i++) this.spawn(c.x + Rn() * 8, fy + 3, c.z + Rn() * 8, Rn() * 3, 1 + Math.random() * 2, Rn() * 3, 0xffffff, 2.5, 1.8, 0, 0.6); { const k = this.me(c) ? 0.55 * this.mv(c) : 0.3 * this.near(c.x, c.z); this.sfx('2d_oil_splat', k, 0.6); this.sfx('CC11', k * 0.6); } }
    else { this.sfx('car_explosion', this.me(c) ? 0.55 * this.mv(c) : 0.3 * this.near(c.x, c.z)); this.explode(c.x, fy + 0.5, c.z, true, 0); for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28; this.spawn(c.x, fy, c.z, Math.cos(a) * 4, 10 + Math.random() * 10, Math.sin(a) * 4, 0xffa52a, 0.6, 1, 22); } }
    this.toast(c.name + (this.respawns ? ' KNOCKED OUT' : ' ELIMINATED')); if (ar === 'ice' || ar === 'island') this.eShot(c.def, 'shutdown', this.me(c) ? 0.45 * this.mv(c) : 0.3 * this.near(c.x, c.z));
    this.emit('out', c);
    if (this.bomb && this.bomb.c === c) this.bombGone();
    const md = this.mode;
    // (Blokvane: survival with several players is played together: the game is over when every player is out at the
    // same time; a cleared wave repairs everyone who is still in, and brings back everyone who isn't)
    if (md === 'survival') { const hs = this.humans(); if (c.hum) { if (hs.every(o => o.elim)) this.finish(c); } else if (!this.cars.some(o => o.bot && !o.elim)) { this.waveT = 2.5; for (const P of hs) { if (P.elim) continue; P.score += 150 * this.wave; if (!P.falling) this.repair(P, true); } this.pop('WAVE ' + this.wave + ' CLEARED +' + 150 * this.wave, '#3ddc84', 1); for (const P of hs) if (P.elim) this.respawn(P); } }
    else if (!this.respawns) { const left = this.cars.filter(o => !o.elim), teams = {}; let n = 0; for (const o of left) if (!teams[o.team]) { teams[o.team] = 1; n++; } if (n <= 1) this.finish(left.find(o => !o.bot) || left[0] || c); }
    this.pushHud();
  }
  victory(dt) {
    const w = this.winner, ok = w && !w.elim && !w.falling; this.vt += dt;
    if (ok) { if (!this.vc) this.vc = this.vPlan(w); const C = this.vc, sp = Math.hypot(w.vx, w.vz); w.emp = 0; w.frozen = 0;
      if (C.r > 0) { let best = null; const fx0 = Math.sin(w.h), fz0 = Math.cos(w.h), ahead = Math.min(this.vClr(w.x + fx0 * 2.5, w.z + fz0 * 2.5, w), this.vClr(w.x + fx0 * 5, w.z + fz0 * 5, w), this.vClr(w.x + fx0 * 7.5, w.z + fz0 * 7.5, w) + 1);
        for (let o = -Math.PI; o <= Math.PI + 1e-6; o += 0.262) { const a = w.h + o, sx = Math.sin(a), sz = Math.cos(a); let cl = 9; for (const [dd, bo] of [[2.5, 0], [5, 0.4], [7.5, 1]]) cl = Math.min(cl, this.vClr(w.x + sx * dd, w.z + sz * dd, w) + bo); const sc = Math.min(cl, 2.5) * 2 - Math.abs(o - C.dir * 0.6) * 0.8; if (!best || sc > best.sc) best = { a, sc, cl }; }
        const near = Math.min(this.vClr(w.x + fx0 * 2.5, w.z + fz0 * 2.5, w), this.vClr(w.x + fx0 * 4, w.z + fz0 * 4, w) + 0.3), tight = near < 0, vt = tight ? 3.2 : ahead < 0 ? 5.5 : 8.5; w.slip = tight ? 0.25 : 0.38; this.drive(w, { steer: Math.max(-1, Math.min(1, -this.wrap(best.a - w.h) * 2.6)), gas: sp < vt ? 1 : 0, brake: sp > vt + 1 ? 1 : 0, boost: 0 }, dt); }
      else { w.vx *= Math.exp(-5 * dt); w.vz *= Math.exp(-5 * dt); w.h += 2.8 * dt; const R = Math.random, fx = Math.sin(w.h), fz = Math.cos(w.h); if (R() < 0.7) this.spawn(w.x - fx * w.def.l * 0.31, 0.25, w.z - fz * w.def.l * 0.31, (R() - 0.5) * 2, 0.6 + R(), (R() - 0.5) * 2, 0xe2e2e2, 0.8 + R() * 0.5, 1 + R() * 0.5, -0.7, 0.4); }
      w.x += w.vx * dt; w.z += w.vz * dt; this.rampWall(w, true);
      this.crPush(w); for (const b of this.bumpers) { let nx = w.x - b.x, nz = w.z - b.z; const d = Math.hypot(nx, nz), mn = w.def.r + 1.2; if (d >= mn || !d) continue; nx /= d; nz /= d; w.x = b.x + nx * mn; w.z = b.z + nz * mn; const vn = w.vx * nx + w.vz * nz; if (vn < 0) { w.vx -= nx * vn * 1.2; w.vz -= nz * vn * 1.2; } }
      const d1 = Math.hypot(w.x, w.z), mx = this.R - 1.5; if (d1 > mx) { w.x *= mx / d1; w.z *= mx / d1; }
      if (this.skG) { const dl = this.loops && this.loops.drift_loop; (dl || this.skG).gain.setTargetAtTime(dl ? 0.25 : 0.06, this.ac.currentTime, 0.1); } }
    if (this.vt > (ok ? 5 : 1.5)) { if (ok) this.eOff(w, 1); if (this.skG) { this.skG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); this.smpG.gain.setTargetAtTime(0, this.ac.currentTime, 0.1); this.quietLoops(); } this.setPhase('over'); }
  }
  finish(w) {
    this.vc = null; this.winner = w; if (!w.elim && !w.falling) { w.y = 0; w.air = false; } for (const pl of this.cars) if (this.me(pl) && pl !== w && !pl.elim && !pl.falling) this.eOff(pl, 1); if (this.engG) { this.engG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); this.smpG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); this.quietLoops(); this.skG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); }
    this.bombOff(); this.crownOff();
    const m = this.mode, P = this.player, TN = this.TEAMS || ['BLUE', 'RED', 'GOLD', 'GREEN'], ko = c => c.kos + ' KO'; let all, title = 'WINNER!', name = w.name, pts = ko;
    if (m === 'last' || m === 'bomb') all = [w].concat(this.order.filter(o => o !== w).reverse());
    else if (m === 'team') { all = this.cars.slice().sort((a, b) => (a.team === w.team ? 0 : 1) - (b.team === w.team ? 0 : 1) || b.kos - a.kos); name = TN[w.team] + ' TEAM'; }
    else if (m === 'score') all = this.cars.slice().sort((a, b) => b.kos - a.kos || b.score - a.score);
    else if (m === 'hill' || m === 'crown') { all = this.cars.slice().sort((a, b) => b.pts - a.pts); pts = c => Math.floor(c.pts) + ' PTS'; }
    else { all = this.solo ? [P] : this.humans().sort((a, b) => b.kos - a.kos || b.score - a.score); title = 'GAME OVER'; name = 'SURVIVED ' + Math.max(0, this.wave - 1) + ' WAVES'; pts = c => c.kos + ' KO'; }
    let series = '', nextLabel = m === 'survival' ? 'TRY AGAIN' : 'REMATCH';
    if (this.state.champ && m !== 'survival') { const S = this.series, key = name; S.wins[key] = (S.wins[key] || 0) + 1; S.round++; const lead = Object.keys(S.wins).sort((a, b) => S.wins[b] - S.wins[a]).slice(0, 3);
      if (S.wins[key] >= 3) { title = 'CHAMPION!'; S.done = true; nextLabel = 'NEW CHAMPIONSHIP'; } else nextLabel = 'NEXT ROUND'; series = 'BEST OF 5 · ' + lead.map(k => k + ' ' + S.wins[k]).join(' · '); }
    this.setState({ result: { title, head: this.MODES[m][0], name, car: this.cn(w.def), series, nextLabel, score: P ? P.score : 0, board: all.map((c, i) => ({ pos: i + 1, key: c.key, name: c.name, color: c.color, car: this.cn(c.def), pts: pts(c), hum: !!c.hum, team: c.team })) } });
    for (const a of [this.rockets, this.lobs]) { for (const o of a) this.dispose(o.mesh); a.length = 0; } this.vt = 0; this.slow = 0;
    this.emit('end', w, all);
    const f = this.rec, v = this.finalKo, vi = v ? this.cars.indexOf(v) : -1;
    if (vi >= 0 && f.length > 12) { let j = f.length - 1; while (j > 0 && f[j].c[vi][1] < -0.05) j--; const ex = f[j].c[vi][0], ez = f[j].c[vi][2], l = Math.hypot(ex, ez) || 1, q = Math.max(0, l - 9) / l, t0 = Math.max(f[0].t, f[j].t - 1.6); let i0 = 0; while (i0 < f.length - 2 && f[i0 + 1].t < t0) i0++;
      this.rp = { f, i: i0, t: t0, v, e: [ex * q + ez / l * 5, ez * q - ex / l * 5], snap: true, skip: false }; this.rec = []; this.setPhase('replay'); }
    else { this.fanfare(); this.setPhase('victory'); }
  }
  pushHud() {
    // (Blokvane: with several players, the box in the corner tells everyone how the match stands, and the list has
    // everyone; with one player it is the game's own: their own numbers)
    const p = this.player, m = this.mode, t = Math.floor(m === 'score' || m === 'crown' ? Math.max(0, this.koTime - (this.time || 0)) : this.time || 0), shrinkOn = this.shrinks && this.time > 25 && this.R > 6.05, alive = this.cars.filter(c => !c.elim), nw = p ? p.slots.filter(q => q).length : 0, TN = this.TEAMS || ['BLUE', 'RED', 'GOLD', 'GREEN'];
    const top = this.leader(), nT = m === 'team' ? Math.max(2, Math.min(4, this.teamN || 2)) : 0, teams = [];
    for (let i = 0; i < nT; i++) teams.push({ name: TN[i], left: alive.filter(c => c.team === i).length, kos: this.cars.filter(c => c.team === i).reduce((s, c) => s + c.kos, 0) });
    let box = ['CARS LEFT', alive.length, ' / ' + this.cars.length];
    if (m === 'score') box = p ? ['KNOCKOUTS', p.kos, ''] : ['MOST KNOCKOUTS', top ? top.kos : 0, '']; else if (m === 'hill') box = p ? ['ZONE POINTS', Math.floor(p.pts), ' / 60'] : ['FIRST TO 60', top ? Math.floor(top.pts) : 0, ' / 60']; else if (m === 'crown') box = p ? ['CROWN POINTS', Math.floor(p.pts), ' / 60'] : ['FIRST TO 60', top ? Math.floor(top.pts) : 0, ' / 60'];
    else if (m === 'team') box = [teams.map(x => x.name).join(' · '), teams.map(x => x.left).join(' · '), '']; else if (m === 'survival') box = ['WAVE', this.wave, ''];
    this.setState({ hud: { box: box[0], boxVal: String(box[1]), boxSub: box[2], score: p ? p.score : 0, round: this.state.champ && m !== 'survival' ? 'ROUND ' + (this.series.round + 1) : '', time: Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'),
      weapon: p && p.weapon ? this.WNAMES[p.weapon] + ' ×' + p.ammo + (nw > 1 ? ' +' + (nw - 1) : '') : '', multi: nw > 1, shrinking: shrinkOn, dead: !!(p && (p.elim || p.falling)), keepPad: this.respawns, deadText: this.respawns ? 'KNOCKED OUT · RESPAWNING' : 'ELIMINATED · SPECTATING', teams, lead: top ? top.key : '',
      list: this.cars.filter(c => m !== 'survival' || !c.bot || !c.elim).map(c => { const out = c.elim && !this.respawns; return { key: c.key, hum: !!c.hum, team: c.team, name: c.name, color: c.color, status: out ? 'OUT' : m === 'hill' || m === 'crown' ? String(Math.floor(c.pts)) : c.kos ? c.kos + ' KO' : '', sc: out ? '#e53935' : '#ffd23f', op: out ? 0.45 : 1, crown: !!(this.crown && this.crown.c === c), bomb: !!(this.bomb && this.bomb.c === c) }; }) } });
  }
  // (Blokvane: who leads right now: the most points, knockouts or score for this mode, players before computer cars)
  leader() { const m = this.mode, v = c => m === 'hill' || m === 'crown' ? c.pts : m === 'score' ? c.kos * 1e4 + c.score : c.kos * 1e4 + c.score; let best = null; for (const c of this.cars) { if (!best || v(c) > v(best) || (v(c) === v(best) && c.hum && !best.hum)) best = c; } return best; }
  step(dt) {
    const p = this.player; this.time += dt;
    // (Blokvane: each player's car does what their phone's joystick and buttons say right now. A phone that has gone
    // quiet for a moment lets go of everything, so no car drives on by itself; a player who left is driven by the computer.)
    const now = performance.now(); for (const c of this.cars) { if (!c.hum || c.auto) continue; const q = c.pad, old = !q || now - c.padAt > (c.slowPad ? 3000 : 900); c.inp.steer = old ? 0 : q.steer || 0; c.inp.gas = old ? 0 : q.gas || 0; c.inp.brake = old ? 0 : q.brake || 0; c.inp.boost = old ? 0 : q.boost || 0; }
    if (this.shrinks && this.time > 25 && this.R > 6) { this.R = Math.max(6, this.R - 0.4 * dt); this.setR(); }
    this.spawnT -= dt; if (this.spawnT <= 0 && this.pickups.length < 5) { this.spawnT = 3; this.spawnPickup(); }
    this.hazards(dt); const md = this.mode;
    if (md === 'survival' && this.waveT > 0) { this.waveT -= dt; if (this.waveT <= 0) { this.wave++; this.wk = Math.min(1.6, 0.8 + this.wave * 0.08); const n = Math.min(this.survN || 6, 1 + this.wave + Math.max(0, this.humans().length - 1)); let q = 0;
        for (const c of this.cars) if (c.bot && q < n) { const a = q / n * 6.2832 + this.wave; this.respawn(c, Math.sin(a) * (this.R - 9), Math.cos(a) * (this.R - 9)); c.shield = 0; q++; } this.toast('WAVE ' + this.wave); this.pushHud(); } }
    if ((md === 'score' || md === 'crown') && this.time >= this.koTime) { this.finish(md === 'crown' ? this.cars.slice().sort((a, b) => b.pts - a.pts || b.kos - a.kos)[0] : this.cars.slice().sort((a, b) => b.kos - a.kos || b.score - a.score)[0]); return; }
    const zn = this.zone; if (zn) { zn.t -= dt; if (zn.t <= 0) { zn.t = 18; const a = Math.random() * 6.28, d = 4 + Math.random() * 11; zn.tx = Math.sin(a) * d; zn.tz = Math.cos(a) * d; this.toast('ZONE MOVING'); }
      const zk = Math.min(1, dt * 1.2); zn.x += (zn.tx - zn.x) * zk; zn.z += (zn.tz - zn.z) * zk; zn.m.position.set(zn.x, 0, zn.z); zn.m.rotation.y += dt * 0.5;
      const ins = this.cars.filter(c => !c.elim && !c.falling && Math.hypot(c.x - zn.x, c.z - zn.z) < zn.r); zn.mat.color.set(ins.length === 1 ? ins[0].color : ins.length ? '#e53935' : '#3ddc84');
      if (ins.length === 1) { const c = ins[0]; c.pts += dt * 4; if (c.pts >= 60) { c.pts = 60; this.finish(c); return; } } }
    if (this.bomb && this.bombStep(dt)) return; if (this.crown && this.crownStep(dt)) return;
    for (const c of this.cars) {
      if (c.elim) { if (c.rsp > 0) { c.rsp -= dt; if (c.rsp <= 0) this.respawn(c); } continue; }
      if (c.boomNow) { c.boomNow = false; this.carBoom(c); if (this.phase !== 'playing') return; continue; }
      if (c.falling) { c.vy -= 30 * dt; c.y += c.vy * dt; c.x += c.vx * dt; c.z += c.vz * dt; c.mesh.rotation.x += dt * 2.5; if (c.y < this.floorY) this.eliminate(c); if (this.phase !== 'playing') return; continue; }
      c.wcd -= dt; c.oil = (c.oil || 0) - dt; c.slip -= dt; c.shield -= dt; c.emp -= dt; if (c.frozen > 0 && c.frozen <= dt) { this.sv = this.me(c) ? this.mv(c) : 0.2 + 0.6 * this.near(c.x, c.z); this.ws('1j_ice_shatter', 0.4); this.sv = 1; } c.frozen -= dt; c.ram -= dt;
      if (c.burst) { c.burst.t -= dt; while (c.burst && c.burst.t <= 0) { const b = c.burst; this.act(c, b.k); b.t += b.iv; if (--b.n <= 0) this.useAmmo(c); } } c.shieldMesh.visible = c.shield > 0;
      if (c.bot || c.auto) this.ai(c, dt);
      const oy0 = c.y, oh0 = c.h; if (c.air) { const ud = c.mesh.userData; c.airT += dt; c.vy -= 26 * dt; c.y += c.vy * dt; c.av = Math.max(-3, Math.min(3, c.av)) * Math.exp(-2.5 * dt); c.h += c.av * dt; ud.ch.rotation.x = Math.max(-0.45, Math.min(0.45, -c.vy * 0.03)) + (c.tP || 0); ud.ch.rotation.z = (c.roll || 0) + (c.rollOff || 0) + (c.tR || 0); for (const w of ud.wh) w.o.rotation.x += w.s * 14 * dt; c.skid = 0; }
      else this.drive(c, c.inp, dt);
      const ox = c.x, oz = c.z; c.x += c.vx * dt; c.z += c.vz * dt; this.rampMove(c, ox, oz, oy0, oh0, dt);
      if (Math.hypot(c.x, c.z) > this.R + 0.3) { c.falling = true; if (!c.air) c.vy = 0; c.air = false; this.cue('CC16', this.me(c) ? 0.32 * this.mv(c) : 0.12 * this.near(c.x, c.z), 3); this.fell(c); }
    }
    this.hitT -= dt;
    for (let i = 0; i < this.cars.length; i++) for (let j = i + 1; j < this.cars.length; j++) {
      const a = this.cars[i], b = this.cars[j]; if (a.elim || b.elim || a.falling || b.falling) continue;
      let nx = b.x - a.x, nz = b.z - a.z; const d = Math.hypot(nx, nz), min = a.def.r + b.def.r; if (d >= min || d === 0 || Math.abs(a.y - b.y) > 1.3) continue;
      nx /= d; nz /= d; const ma = this.em(a), mb = this.em(b), ov = min - d;
      a.x -= nx * ov * mb / (ma + mb); a.z -= nz * ov * mb / (ma + mb); b.x += nx * ov * ma / (ma + mb); b.z += nz * ov * ma / (ma + mb);
      const cx0 = a.x + nx * a.def.r, cz0 = a.z + nz * a.def.r, tv = (b.vx - a.vx) * -nz + (b.vz - a.vz) * nx, R0 = Math.random;
      if (Math.abs(tv) > 3.5 && R0() < 0.55) { const sg = Math.sign(tv); this.sparks(cx0, 0.45 + R0() * 0.4, cz0, -nz * sg, 0.25, nx * sg, 2 + Math.abs(tv) * 0.3, 4 + Math.abs(tv) * 0.45, 0.45); if ((this.me(a) || this.me(b)) && this.time - (a.scT || -9) > 0.6) { a.scT = this.time; this.sfx('scrape_sideswipe', 0.16 * this.mv(this.me(a) ? a : b), 1.05); } }
      if (a.ram > 0 || b.ram > 0) { const sw = a.ram > 0 ? a : b, o2 = sw === a ? b : a, sp = this.sawPt(sw), ex = sp ? sp.x : cx0, ez = sp ? sp.z : cz0, ey = sp ? sp.y : 0.9, ddx = o2.x - ex, ddz = o2.z - ez, dl = Math.hypot(ddx, ddz) || 1; this.sparks(ex + ddx / dl * 0.5, ey, ez + ddz / dl * 0.5, -ddz / dl, 0.35, ddx / dl, 5, 11, 0.6); this.sparks(ex + ddx / dl * 0.5, ey, ez + ddz / dl * 0.5, ddz / dl, 0.35, -ddx / dl, 3, 9, 0.6); }
      const rel = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz; if (rel >= 0) continue;
      const J = -1.55 * rel / (1 / ma + 1 / mb); if (a.team !== b.team) { a.lastBy = b; b.lastBy = a; a.lastT = b.lastT = this.time; } a.vx -= nx * J / ma; a.vz -= nz * J / ma; b.vx += nx * J / mb; b.vz += nz * J / mb; if (a.ram > 0 || b.ram > 0) { this.sv = this.me(a) || this.me(b) ? this.mv(this.me(a) ? a : b) : 0.4 * this.near(a.x, a.z); this.ws('2a_saw_shred', 0.45); this.sv = 1; } if (a.ram > 0) this.push(b, nx, nz, 16); if (b.ram > 0) this.push(a, -nx, -nz, 16); if (this.bomb) this.bombTouch(a, b); if (this.crown) this.crownTouch(a, b, J);
      if (J > 6) { const s = Math.min(1, J / 30); a.slip = b.slip = 0.25 + s * 0.6; a.av += (Math.random() - 0.5) * s * 5 / ma; b.av += (Math.random() - 0.5) * s * 5 / mb;
        const cx = cx0, cz = cz0, tg = Math.sign(tv) || 1; this.sparks(cx, 0.7, cz, -nz * tg, 0.45, nx * tg, 8 + s * 34, 7 + s * 9, 0.7); this.sparks(cx, 0.7, cz, nz * tg, 0.45, -nx * tg, 4 + s * 16, 6 + s * 7, 0.7); this.spawn(cx, 0.8, cz, 0, 0, 0, 0xfff0c0, 0.35 + s * 0.6, 0.06, 0); if (s > 0.55) this.flash(cx, 0.9, cz, 2.5 + s * 3);
        if (s > 0.2) { for (let q = 0; q < s * 8; q++) this.spawn(cx, 0.8, cz, (Math.random() - 0.5) * 9, 3 + Math.random() * 6, (Math.random() - 0.5) * 9, q % 2 ? a.color : b.color, 0.12 + Math.random() * 0.2, 0.9, 22);
          this.dent(a, s * mb / (ma + mb), nx, nz); this.dent(b, s * ma / (ma + mb), -nx, -nz); a.pitch += 0.06 * s; b.pitch -= 0.06 * s; }
        if (this.hitT <= 0) { this.hitT = 0.3; const hp = this.me(a) ? a : this.me(b) ? b : null; this.crash(s, hp ? this.mv(hp) : 0.5 * this.near(a.x, a.z), hp || a); for (const q of [a, b]) { if (!this.me(q)) continue; this.shk(q, s * 0.8); const w = this.viewOf(q); if (this.solo) this.hitF = Math.max(this.hitF || 0, s * 0.8); else if (w) w.hitF = Math.max(w.hitF, s * 0.8); this.emit('hit', q, s); if (s > 0.7) { this.slow = Math.max(this.slow, 0.14); if (this.solo) this.fovK = 1; else if (w) w.fovK = 1; q.score += 25; this.pop('BIG HIT +25', '#ff8a1f', 0, q); } } } }
    }
    for (let i = this.pickups.length - 1; i >= 0; i--) { const pk = this.pickups[i]; pk.mesh.rotation.y += dt * 2; pk.mesh.position.y = 1.3 + Math.sin(this.time * 3 + i) * 0.2;
      let got = null; if (Math.hypot(pk.x, pk.z) > this.R) got = 1; else for (const c of this.cars) if (!c.elim && !c.falling && Math.hypot(c.x - pk.x, c.z - pk.z) < c.def.r + 1 && (!this.WNAMES[pk.type] || c.slots.some(q => !q)) && (pk.type !== 'repair' || c.dmg > 0.05 || c.nLost)) { got = c; break; }
      if (got) { if (got !== 1) { if (pk.type === 'boost') got.boost = 1; else if (pk.type === 'shield') got.shield = 6; else if (pk.type === 'repair') this.repair(got); else { this.addWeapon(got, pk.type); if (got.bot) got.wcd = Math.max(got.wcd, 1 + Math.random() * 3); } if (this.me(got)) { const mv = this.mv(got); if (pk.type === 'boost') this.eShot(got.def, 'downshift', 0.5 * mv); else if (pk.type !== 'repair') { this.sv = mv; this.ws('1d_cannon_reload', 0.3); this.sv = 1; } this.pushHud(); this.emit('pick', got, pk.type); } }
        this.dispose(pk.mesh); this.pickups.splice(i, 1); } }
    for (let i = this.rockets.length - 1; i >= 0; i--) { const r = this.rockets[i], sp = Math.hypot(r.vx, r.vz) || 1;
      if (r.homing) { const t = this.nearest(r, 60, 0, r.owner); if (t) { const dx = t.x - r.x, dz = t.z - r.z, d = Math.hypot(dx, dz) || 1, q = Math.min(1, r.homing * dt); r.vx += (dx / d * sp - r.vx) * q; r.vz += (dz / d * sp - r.vz) * q; const s2 = Math.hypot(r.vx, r.vz) || 1; r.vx *= sp / s2; r.vz *= sp / s2; } }
      r.x += r.vx * dt; r.z += r.vz * dt; r.life -= dt; r.mesh.position.set(r.x, r.y, r.z); r.mesh.rotation.y = Math.atan2(r.vx, r.vz); if (r.fl) { const k = 0.85 + Math.random() * 0.3; r.fl.scale.set(k, k, 0.7 + Math.random() * 0.6); } if (r.rot) for (const p of r.rot) p.rotation.y += dt * 55;
      if (r.smoke) for (let q = 0; q < 2; q++) { const Rn = Math.random, o = 0.7 + q * sp * dt * 0.5; this.spawn(r.x - r.vx / sp * o, r.y, r.z - r.vz / sp * o, (Rn() - 0.5) * 0.7, 0.2 + Rn() * 0.4, (Rn() - 0.5) * 0.7, 0xd0d0d0, 0.2 + Rn() * 0.1, 0.7 + Rn() * 0.5, -0.3, 0.5); }
      let hit = null; for (const c of this.cars) if (c !== r.owner && !c.elim && !c.falling && Math.hypot(c.x - r.x, c.z - r.z) < c.def.r + 0.6) hit = c;
      if (hit || r.life <= 0) { if (hit) { this.src = r.owner; if (r.rad) { this.explode(r.x, 1, r.z, r.rad > 4.5, r.snd); this.blast(r.x, r.z, r.rad, r.J, r.owner); } else { this.push(hit, r.vx / sp, r.vz / sp, r.J); this.sparks(r.x, r.y, r.z, -r.vx / sp, 0.35, -r.vz / sp, 9, 8, 0.75); this.spawn(r.x, r.y, r.z, 0, 0, 0, 0xfff0c0, 0.4, 0.05, 0); }
          if (r.fx === 'freeze') { hit.frozen = 3.5; for (let q = 0; q < 10; q++) this.spawn(hit.x, 1, hit.z, (Math.random() - 0.5) * 8, 2 + Math.random() * 5, (Math.random() - 0.5) * 8, 0xbfeaff, 0.3, 0.6, 12); this.sv = 0.25 + 0.75 * this.near(hit.x, hit.z); if (!this.ws('1j_freeze_hit', 0.45)) this.tone(2000, 0.25, 'sine', 0.06, 800); this.sv = 1; } }
        this.src = null; this.dispose(r.mesh); this.rockets.splice(i, 1); } }
    for (let i = this.debris.length - 1; i >= 0; i--) { const d = this.debris[i]; if (d.rb) { if (this.rbUpd(d, dt)) { this.dispose(d.mesh); this.debris.splice(i, 1); } continue; } d.life -= dt; d.vy -= 28 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
      if (d.y < d.r && d.y > -1 && Math.hypot(d.x, d.z) < this.R) { d.y = d.r; d.vy = d.vy < -2 ? d.vy * -0.45 : 0; d.vx *= 0.985; d.vz *= 0.985; }
      d.mesh.position.set(d.x, d.y, d.z); d.mesh.rotateX(Math.hypot(d.vx, d.vz) / Math.max(0.3, d.r) * dt); if (d.y < this.floorY || d.life <= 0) { this.dispose(d.mesh); this.debris.splice(i, 1); } }
    for (let i = this.lobs.length - 1; i >= 0; i--) { const l = this.lobs[i]; l.t -= dt; l.mesh.scale.setScalar(1 + Math.sin(l.t * 20) * 0.1); if (l.sh) l.sh.position.y = 0.5 + 23 * Math.max(0, l.t); if (l.t <= 0) { this.src = l.by; this.explode(l.x, 0.5, l.z, true, 'mortar_impact'); this.blast(l.x, l.z, 6.5, 28, null); this.src = null; this.dispose(l.mesh); if (l.sh) this.dispose(l.sh); this.lobs.splice(i, 1); } }
    for (let i = this.slicks.length - 1; i >= 0; i--) { const k = this.slicks[i]; k.life -= dt; if (k.life <= 0 || Math.hypot(k.x, k.z) > this.R) { this.dispose(k.mesh); this.slicks.splice(i, 1); continue; } k.mesh.material.opacity = 0.95 * Math.min(1, k.life / 2); { const gs = Math.min(1, 0.3 + (12 - k.life) * 1.6); k.mesh.scale.set(gs, gs, 1); }
      for (const c of this.cars) if (!c.elim && !c.falling && Math.hypot(c.x - k.x, c.z - k.z) < k.r) { if (!(c.oil > 0)) { if (this.me(c)) { this.sv = this.mv(c); this.ws('2d_oil_splat', 0.4); this.sv = 1; this.tell(c, 'OIL! TYRES SLIPPING'); } c.av += (Math.random() < 0.5 ? -1 : 1) * 1.6; for (let q = 0; q < 6; q++) this.spawn(c.x, 0.2, c.z, (Math.random() - 0.5) * 6, 1 + Math.random() * 2, (Math.random() - 0.5) * 6, 0x050505, 0.12, 0.4, 14); } c.oil = 3; c.slip = Math.max(c.slip, 0.25); } }
    for (let i = this.mines.length - 1; i >= 0; i--) { const m = this.mines[i]; m.t += dt; m.mesh.material.color.set(Math.sin(m.t * 10) > 0 ? 0xffd23f : 0xe53935);
      let hit = Math.hypot(m.x, m.z) > this.R ? 2 : 0; if (m.t > 0.7) for (const c of this.cars) if (!c.elim && !c.falling && Math.hypot(c.x - m.x, c.z - m.z) < c.def.r + 0.8) hit = 1;
      if (hit) { if (hit === 1) { this.src = m.by; this.explode(m.x, 0.3, m.z, true, 'mine_explosion'); this.blast(m.x, m.z, 6, 22, null); this.src = null; } this.dispose(m.mesh); this.mines.splice(i, 1); } }
    if (this.engG && !this.solo) this.loopsMulti(); else if (this.engG && p) { const t = this.ac.currentTime, sp = Math.hypot(p.vx, p.vz), on = !p.elim && !p.falling, gs = p.def.speed * 1.5 / 4, gear = Math.min(3, Math.floor(sp / gs)), rpm = Math.min(1, (sp - gear * gs) / gs), th = p.inp.gas || p.inp.boost ? 1 : 0, e = p.def.eng, fr = e.b + rpm * e.r + gear * 4; this.engF.Q.value = e.q; this.engN.gain.value = e.n; this.engO.forEach((o, i) => { o.l.gain.value = e.lv[i]; });
      for (const o of this.engO) o.frequency.setTargetAtTime(fr * o.m, t, 0.06); this.engF.frequency.setTargetAtTime(e.f + rpm * 500 + th * 650, t, 0.08); this.engG.gain.setTargetAtTime(on && p.en && p.en.fail ? 0.09 + th * 0.07 + rpm * 0.03 : 0, t, 0.08);
      const sb = 780 + p.skid * 260 + sp * 8; const LP = this.loops || {}, ci = this.CARS.indexOf(p.def), nwc = this.CCS[ci] === '1', cck = p.def.mass >= 1.4 ? 'CC25' : 'CC24', ccd = nwc && LP[cck], dl = ccd || (this.grip < 1 ? LP.skid_loop : LP.drift_loop); if (ccd && this.lsrc[cck]) this.lsrc[cck].playbackRate.value = this.CCP[ci] || 1; this.skG.gain.setTargetAtTime(on && !dl && sp > 6 ? Math.max(0, p.skid - 0.35) * 0.1 * (this.grip < 1 ? 0.3 : 1) : 0, t, 0.15);
      const dv = on && sp > 6 ? Math.max(0, p.skid - 0.35) / 0.65 : 0; for (const k of ['drift_loop', 'skid_loop', 'CC24', 'CC25']) if (LP[k]) LP[k].gain.setTargetAtTime(LP[k] === dl ? dv * (this.grip < 1 ? 0.1 : 0.3) : 0, t, dv ? 0.15 : 0.25);
      { const set = (k, v, tc) => { if (LP[k]) LP[k].gain.setTargetAtTime(v, t, tc || 0.2); }, spf = Math.min(1, sp / (p.def.speed * 1.2)), gnd = on && !p.air, pick = a => a[Math.floor(Math.random() * a.length)], fade = h => { if (h && h.g) h.g.gain.setTargetAtTime(0, t, 0.15); };
        const sck = nwc ? (this.arena === 'industrial' ? 'CC33' : 'CC34') : 'scrape_grind_loop', sc = gnd && p.nLost && sp > 4; for (const k of ['scrape_grind_loop', 'CC33', 'CC34']) set(k, sc && k === (LP[sck] ? sck : 'scrape_grind_loop') ? 0.12 : 0);
        const rk = this.arena === 'island' ? 'CC32' : 'CC31'; set('CC31', gnd && rk === 'CC31' ? spf * (this.grip < 1 ? 0.035 : 0.07) : 0, 0.3); set('CC32', gnd && rk === 'CC32' ? spf * 0.09 : 0, 0.3);
        const bo = on && p.inp.boost && p.boost > 0.02; set('CC30', bo && gnd && sp < p.def.speed * 0.55 ? 0.13 : 0, 0.12);
        set('CC40', on && p.dmg > 0.3 && p.dmg <= 0.65 ? 0.09 : 0, 0.5); set('CC41', on && p.dmg > 0.65 ? 0.12 : 0, 0.5); set('CC44', gnd && (p.nLost || p.dmg > 0.5) && sp > 3 ? 0.04 + spf * 0.06 : 0, 0.3);
        if (bo && !this.wasBo) this.boS = this.cue('CC49', 0.2, 3.5, this.CCP[ci] || 1); if (!bo && this.wasBo) { fade(this.boS); this.boS = null; if (sp > p.def.speed * 0.7 && Math.random() < 0.6) this.cue('CC50', 0.22, 4); } this.wasBo = bo;
        if (th && !this.wasTh && gnd && sp < 2) this.cue('CC19', 0.22, 2.5); this.wasTh = th;
        const sk = gnd && sp > 7 && p.skid > 0.6; if (sk && !this.wasSk && t - (this.skT || -99) > 5) { this.skT = t; this.skS = this.sfx(this.arena === 'island' ? pick(['CC28', 'CC26']) : this.grip < 1 ? 'CC27' : pick(['CC21', 'CC22', 'CC23']), 0.15, this.CCP[ci] || 1); } if (this.skS && (!gnd || p.skid < 0.3)) { fade(this.skS); this.skS = null; } this.wasSk = sk;
        if (gnd && sp > 4 && Math.abs(p.av) > 2.8) this.cue('CC29', 0.18, 7); }
      const br = on && p.inp.brake && sp > p.def.speed * 0.8; if (br && !this.wasBr && t - (this.lastBr || -99) > 8) { this.brS = this.sfx(nwc && this.sbuf.CC20 ? 'CC20' : Math.random() < 0.5 ? 'brake_squeal' : 'brake_hard_stop', 0.2); this.lastBr = t; }
      if (!p.inp.brake && this.brS && this.brS.g) { this.brS.g.gain.setTargetAtTime(0, t, 0.12); this.brS = null; } this.wasBr = br; for (const o of this.skO) o.frequency.setTargetAtTime(sb * o.m, t, 0.08); this.skF.frequency.setTargetAtTime(sb * 1.4, t, 0.08); }
    this.hudT -= dt; if (this.hudT <= 0) { this.hudT = 0.25; this.pushHud(); }
  }
  // (Blokvane: the sounds the game made for its one player's car (the tyres, the scraping of a lost wheel, the rumble of
  // the ground, the boost, a damaged engine, the brakes) come from every player's car, each as loud as it is near
  // what the TV shows. A loop the game has once plays as loud as the loudest car that needs it.)
  loopsMulti() {
    const t = this.ac.currentTime, LP = this.loops || {}, tg = {}, put = (k, v, tc) => { if (!tg[k] || v > tg[k][0]) tg[k] = [v, tc || 0.2]; }, pick = a => a[Math.floor(Math.random() * a.length)], fade = h => { if (h && h.g) h.g.gain.setTargetAtTime(0, t, 0.15); };
    for (const k of ['drift_loop', 'skid_loop', 'CC24', 'CC25', 'scrape_grind_loop', 'CC33', 'CC34', 'CC31', 'CC32', 'CC30', 'CC40', 'CC41', 'CC44']) put(k, 0, 0.25);
    let lead = null, lw = 0, sk0 = 0;
    for (const p of this.cars) {
      if (!p.hum) continue; const w = this.mv(p) / 0.8, on = !p.elim && !p.falling, sp = Math.hypot(p.vx, p.vz), L = p.lw || (p.lw = {}); if (on && w > lw) { lw = w; lead = p; }
      const ci = this.CARS.indexOf(p.def), nwc = this.CCS[ci] === '1', cck = p.def.mass >= 1.4 ? 'CC25' : 'CC24', dk = nwc && LP[cck] ? cck : LP[this.grip < 1 ? 'skid_loop' : 'drift_loop'] ? (this.grip < 1 ? 'skid_loop' : 'drift_loop') : '';
      const dv = on && sp > 6 ? Math.max(0, p.skid - 0.35) / 0.65 : 0; if (dk) { put(dk, dv * (this.grip < 1 ? 0.1 : 0.3) * w, dv ? 0.15 : 0.25); if (dv && this.lsrc[dk] && p === lead) this.lsrc[dk].playbackRate.value = this.CCP[ci] || 1; } else if (on && sp > 6) sk0 = Math.max(sk0, Math.max(0, p.skid - 0.35) * 0.1 * (this.grip < 1 ? 0.3 : 1) * w);
      const spf = Math.min(1, sp / (p.def.speed * 1.2)), gnd = on && !p.air, th = p.inp.gas || p.inp.boost ? 1 : 0;
      const sck = nwc ? (this.arena === 'industrial' ? 'CC33' : 'CC34') : 'scrape_grind_loop', sc = gnd && p.nLost && sp > 4; if (sc) put(LP[sck] ? sck : 'scrape_grind_loop', 0.12 * w);
      const rk = this.arena === 'island' ? 'CC32' : 'CC31'; if (gnd) put(rk, spf * (rk === 'CC32' ? 0.09 : this.grip < 1 ? 0.035 : 0.07) * w, 0.3);
      const bo = on && p.inp.boost && p.boost > 0.02; if (bo && gnd && sp < p.def.speed * 0.55) put('CC30', 0.13 * w, 0.12);
      if (on && p.dmg > 0.3 && p.dmg <= 0.65) put('CC40', 0.09 * w, 0.5); if (on && p.dmg > 0.65) put('CC41', 0.12 * w, 0.5); if (gnd && (p.nLost || p.dmg > 0.5) && sp > 3) put('CC44', (0.04 + spf * 0.06) * w, 0.3);
      if (bo && !L.wasBo) L.boS = this.cue('CC49', 0.2 * w, 3.5, this.CCP[ci] || 1); if (!bo && L.wasBo) { fade(L.boS); L.boS = null; if (sp > p.def.speed * 0.7 && Math.random() < 0.6) this.cue('CC50', 0.22 * w, 4); } L.wasBo = bo;
      if (th && !L.wasTh && gnd && sp < 2) this.cue('CC19', 0.22 * w, 2.5); L.wasTh = th;
      const sk = gnd && sp > 7 && p.skid > 0.6; if (sk && !L.wasSk && t - (L.skT || -99) > 5) { L.skT = t; L.skS = this.sfx(this.arena === 'island' ? pick(['CC28', 'CC26']) : this.grip < 1 ? 'CC27' : pick(['CC21', 'CC22', 'CC23']), 0.15 * w, this.CCP[ci] || 1); } if (L.skS && (!gnd || p.skid < 0.3)) { fade(L.skS); L.skS = null; } L.wasSk = sk;
      if (gnd && sp > 4 && Math.abs(p.av) > 2.8) this.cue('CC29', 0.18 * w, 7);
      const br = on && p.inp.brake && sp > p.def.speed * 0.8; if (br && !L.wasBr && t - (L.lastBr || -99) > 8) { L.brS = this.sfx(nwc && this.sbuf.CC20 ? 'CC20' : Math.random() < 0.5 ? 'brake_squeal' : 'brake_hard_stop', 0.2 * w); L.lastBr = t; }
      if (!p.inp.brake && L.brS && L.brS.g) { L.brS.g.gain.setTargetAtTime(0, t, 0.12); L.brS = null; } L.wasBr = br;
    }
    for (const k in tg) if (LP[k]) LP[k].gain.setTargetAtTime(tg[k][0], t, tg[k][1]);
    this.skG.gain.setTargetAtTime(sk0, t, 0.15);
    // (the game's own drawn engine sound, for a car whose recorded engine could not be fetched: the loudest player's)
    const p = lead; if (!p) { this.engG.gain.setTargetAtTime(0, t, 0.08); return; }
    const sp = Math.hypot(p.vx, p.vz), gs = p.def.speed * 1.5 / 4, gear = Math.min(3, Math.floor(sp / gs)), rpm = Math.min(1, (sp - gear * gs) / gs), th = p.inp.gas || p.inp.boost ? 1 : 0, e = p.def.eng, fr = e.b + rpm * e.r + gear * 4; this.engF.Q.value = e.q; this.engN.gain.value = e.n; this.engO.forEach((o, i) => { o.l.gain.value = e.lv[i]; });
    for (const o of this.engO) o.frequency.setTargetAtTime(fr * o.m, t, 0.06); this.engF.frequency.setTargetAtTime(e.f + rpm * 500 + th * 650, t, 0.08); this.engG.gain.setTargetAtTime(p.en && p.en.fail ? (0.09 + th * 0.07 + rpm * 0.03) * lw : 0, t, 0.08);
    const sb = 780 + p.skid * 260 + sp * 8; for (const o of this.skO) o.frequency.setTargetAtTime(sb * o.m, t, 0.08); this.skF.frequency.setTargetAtTime(sb * 1.4, t, 0.08);
  }
  syncMeshes() { for (const c of this.cars) { if (c.elim) continue; c.mesh.position.set(c.x, c.y, c.z); c.mesh.rotation.y = c.h; this.carVis(c); } }

  frame(t) {
    if (this.dead) return; this.raf = requestAnimationFrame(this.frame); if (this.hold) { this.last = undefined; return; } const now = performance.now(); if (this.last === undefined) this.last = now - 16; if (now - this.last < 2) return; const raw = now - this.last, dt = Math.min(0.033, raw / 1000); this.last = now;
    if (this.paused) { this.drawNow(); return; }
    this.fa = (this.fa || 16) * 0.97 + Math.min(100, raw) * 0.03; if (this.state.quality === 'AUTO' && this.phase === 'playing' && this.fa > 24 && this.autoQ > 0 && now - (this.qT || 0) > 3000) { this.autoQ--; this.qT = now; this.fa = 16; this.applyQ(); }
    if (this.phase === 'countdown') { this.cd += dt; const n = 3 - Math.floor(this.cd / 0.8);
      if (n !== this.cdN) { this.cdN = n; if (n > 0) { this.setState({ count: String(n) }); this.revCount(n); }
        else { this.setState({ count: 'GO!' }); this.revCount(0); this.setPhase('playing'); setTimeout(() => this.setState({ count: '' }), 800); } } }
    else if (this.phase === 'victory') this.victory(dt); else if (this.phase === 'replay') this.replay(dt); else if (this.phase === 'playing') { if (this.slow > 0) { this.slow -= dt; this.step(dt * 0.3); } else this.step(dt);
      if (this.phase === 'playing' && (this.rc = !this.rc)) { this.rec.push({ t: this.time, c: this.cars.map(c => [c.x, c.y, c.z, c.h, c.mesh.rotation.x, c.mesh.visible]) }); if (this.rec.length > 150) this.rec.shift(); } }
    if (this.phase !== 'replay') this.syncMeshes(); this.engines(dt); this.skUpd(dt); this.wSpin(dt); if (this.fl) this.fl.intensity *= Math.exp(-8 * dt);
    for (const p of this.parts) { if (p.life <= 0) continue; p.life -= dt; if (p.life <= 0) { p.m.visible = false; continue; } p.vy -= p.grav * dt; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.m.material.opacity = p.a * p.life / p.max; if (p.a < 1) p.m.scale.addScalar(dt * 1.6); }
    for (const p of this.puffs) { if (p.life <= 0) continue; p.life -= dt; if (p.life <= 0) { p.m.visible = false; continue; } const k = 1 - p.life / p.max, dr = Math.exp(-1.4 * dt);
      if (p.fire) { const F = this.fC[p.fire - 1], fd = Math.exp(-2.5 * dt); p.vy -= p.grav * dt; p.vx *= fd; p.vz *= fd; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt; p.m.scale.setScalar(p.size * (0.6 + 1.1 * k) * (1 - 0.45 * k * k)); p.m.material.opacity = p.a * Math.min(1, k * 12) * (1 - k); p.m.material.rotation += p.spin * dt; if (k < 0.4) p.m.material.color.copy(F[0]).lerp(F[1], k / 0.4); else p.m.material.color.copy(F[1]).lerp(F[2], (k - 0.4) / 0.6); continue; } p.vy = (p.vy - p.grav * dt) * Math.exp(-0.5 * dt); p.vx = p.vx * dr + 0.9 * dt; p.vz *= dr; p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
      p.m.scale.setScalar(p.size * (1 + k * 2.2)); p.m.material.opacity = p.a * Math.min(1, k * 8) * Math.pow(1 - k, 1.3); p.m.material.rotation += p.spin * dt; p.m.material.color.copy(p.c0).lerp(p.c1, k); }
    this.tmUpd(dt);
    this.ambient(); const tt = performance.now() / 1000; for (const f of this.anim) f(tt, dt);
    for (const r of this.rings) { if (r.t >= 1) continue; r.t += dt * 2.2; const s = 1 + r.t * 11; r.m.scale.set(s, s, 1); r.m.material.opacity = 1 - r.t; if (r.t >= 1) r.m.visible = false; }
    for (let i = this.fxs.length - 1; i >= 0; i--) { const f = this.fxs[i]; f.life -= dt; f.mesh.material.opacity = Math.max(0, f.life / 0.25); if (f.life <= 0) { this.dispose(f.mesh); this.fxs.splice(i, 1); } }
    if (this.scroll) { this.scroll.offset.x += dt * 0.012; this.scroll.offset.y += dt * 0.007; }
    if (this.jumpRef.current && this.player) { const p = this.player, jo = !p.air && !p.falling && !p.elim && this.time - (p.jT || -9) >= 1.1 ? '1' : '0.45'; if (jo !== this.joL) { this.jumpRef.current.style.opacity = jo; this.joL = jo; } }
    if (this.boostRef.current && this.player) this.boostRef.current.style.width = (this.player.boost * 100).toFixed(0) + '%'; if (this.dmgRef.current && this.player) this.dmgRef.current.style.width = (this.player.dmg * 100).toFixed(0) + '%';
    const P = this.player, on = P && this.phase === 'playing' && !P.elim && !P.falling, spT = on ? Math.max(0, Math.min(1, (Math.hypot(P.vx, P.vz) / P.def.speed - 0.9) * 2.2)) : 0; this.spK = (this.spK || 0) + (spT - (this.spK || 0)) * Math.min(1, dt * 6); this.hitF = (this.hitF || 0) * Math.exp(-5 * dt);
    const so = this.spK < 0.03 ? '0' : this.spK.toFixed(2), ho = this.hitF < 0.03 ? '0' : this.hitF.toFixed(2); if (this.speedRef.current && so !== this.soL) this.speedRef.current.style.opacity = this.soL = so; if (this.hitRef.current && ho !== this.hoL) this.hitRef.current.style.opacity = this.hoL = ho;
    if (this.splitOn()) this.splitRender(dt); else { this.cam(dt); this.renderer.render(this.scene, this.camera); } if (this.views.length) this.viewsUi(dt);
  }
  cam(dt) {
    const cam = this.camera, T = THREE, k = 1 - Math.exp(-5 * dt); this.orbit += dt * 0.35;
    let px, py, pz, lx, ly = 1, lz, fov = 55, snap = false; this.cs = 0;
    if (this.phase === 'select') { if (this.preview) this.preview.rotation.y += dt * 0.6; this.pvStep(dt); this.pvEng(dt); px = Math.sin(this.orbit * 0.3) * 9; py = 3.2; pz = -12; lx = 0; lz = 0; ly = -2.3; }
    else if (this.phase === 'garage') { this.gStep(dt); this.gEng(dt); const g = this.gView(); px = g[0]; py = g[1]; pz = g[2]; lx = g[3]; ly = g[4]; lz = g[5]; fov = g[6]; }
    else if (this.phase === 'replay' && this.rp) { const v = this.rp.v.mesh.position, e = this.rp.e; px = e[0]; pz = e[1]; py = 3; lx = v.x; lz = v.z; ly = Math.max(this.floorY + 1, v.y) + 0.8; fov = 38; snap = this.rp.snap; this.rp.snap = false; }
    else if ((this.phase === 'over' || this.phase === 'victory') && this.winner) { const w = this.winner; px = w.x + Math.sin(this.orbit) * 11; pz = w.z + Math.cos(this.orbit) * 11; py = 5; lx = w.x; lz = w.z;
      if (Math.random() < 0.5) this.spawn(w.x + (Math.random() - 0.5) * 8, 9, w.z + (Math.random() - 0.5) * 8, 0, -1, 0, this.COLORS[Math.floor(Math.random() * 8)], 0.25, 1.4, 6); }
    else { const v = this.camView(), p = v === 'chase' ? (this.solo ? this.player : this.follow()) : null, chase = p && !p.elim && !p.falling;
      if (chase) { this.camH += Math.atan2(Math.sin(p.h - this.camH), Math.cos(p.h - this.camH)) * (1 - Math.exp(-4 * dt)); const fx = Math.sin(this.camH), fz = Math.cos(this.camH);
        const sr = Math.min(1.5, Math.hypot(p.vx, p.vz) / p.def.speed), ds = 11 + sr * 2.5; px = p.x - fx * ds; pz = p.z - fz * ds; py = 6.5 + p.y * 0.7 + sr * 0.6; lx = p.x + fx * 5; lz = p.z + fz * 5; ly = 1 + p.y * 0.8; fov = 54 + sr * 9; this.cs = -p.inp.steer * 0.035 * Math.min(1, sr); }
      // (Blokvane: the whole arena from high above, a little behind: everyone at a glance, closer as the arena shrinks)
      else if (v === 'top') { const R = Math.max(10, this.R); px = 0; py = 16 + R * 1.7; pz = -(3 + R * 0.62); lx = 0; lz = R * 0.08; ly = 0; fov = 50; }
      // (Blokvane: the TV's own camera crew: it circles slowly around where the cars are, the players weighing more,
      // and comes in closer when they bunch up)
      else if (v === 'action') { const al = this.cars.filter(c => !c.elim && !c.falling); let cx = 0, cz = 0, ws = 0; for (const c of al) { const w = c.hum ? 2 : 1; cx += c.x * w; cz += c.z * w; ws += w; } cx /= ws || 1; cz /= ws || 1;
        let s = 6; for (const c of al) s = Math.max(s, Math.hypot(c.x - cx, c.z - cz)); const a = this.orbit * 0.32, r = 15 + s * 1.05; px = cx + Math.sin(a) * r; pz = cz + Math.cos(a) * r; py = 8 + s * 0.62; lx = cx; lz = cz; fov = 52; }
      // (the game's own camera with everyone in the picture; Blokvane: about a fifth closer, its aim a little nearer
      // the camera, so the cars are bigger on a TV and the nearest one still stays in the picture)
      else { const al = this.cars.filter(c => !c.elim); let cx = 0, cz = 0; for (const c of al) { cx += c.x; cz += c.z; } cx /= al.length || 1; cz /= al.length || 1;
        let s = 6; for (const c of al) s = Math.max(s, Math.hypot(c.x - cx, c.z - cz)); px = cx; py = 11 + s * 1.05; pz = cz - (11 + s * 0.9); lx = cx; lz = cz - s * 0.2; } }
    this.look = this.look || new T.Vector3(); if (snap) { cam.position.set(px, py, pz); this.look.set(lx, ly, lz); }
    cam.position.x += (px - cam.position.x) * k; cam.position.y += (py - cam.position.y) * k; cam.position.z += (pz - cam.position.z) * k;
    this.look = this.look || new T.Vector3(); this.look.x += (lx - this.look.x) * k * 1.6; this.look.y += (ly - this.look.y) * k; this.look.z += (lz - this.look.z) * k * 1.6;
    cam.lookAt(this.look.x + (Math.random() - 0.5) * this.shake, this.look.y + (Math.random() - 0.5) * this.shake, this.look.z); this.shake *= Math.exp(-6 * dt);
    this.cr = (this.cr || 0) + (this.cs - (this.cr || 0)) * k; cam.rotateZ(this.cr); this.fovK = (this.fovK || 0) * Math.exp(-4 * dt); const tf = fov - this.fovK * 7; if (Math.abs(cam.fov - tf) > 0.05) { cam.fov += (tf - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix(); }
    this.lis.x = this.look.x; this.lis.z = this.look.z;
  }
  // (Blokvane: which camera the TV uses right now: the host's pick, or the game's own: the chase camera with one player,
  // the arena camera with several)
  camView() { const v = this.view || (this.solo ? String(this.state.cam || this.props.camera || 'Chase').toLowerCase() : 'arena'); return v === 'split' ? 'arena' : v; }
  // (Blokvane: the chase camera with several players follows the one in the lead, and stays with them at least a few
  // seconds; when they are out it goes to another player)
  follow() { const now = this.time || 0, cur = this.fol; if (cur && cur.hum && !cur.elim && !cur.falling && now - (this.folT || 0) < 8) return cur;
    const ld = this.leader(), al = this.cars.filter(c => c.hum && !c.elim && !c.falling), nx = ld && ld.hum && !ld.elim && !ld.falling ? ld : al[0] || null;
    if (nx !== cur) { this.fol = nx; this.folT = now; this.setState({ follow: nx ? nx.key : '' }); } return nx; }
  // ---------- Blokvane: the TV's views ----------
  // v: 'arena' (the game's own, everyone in the picture), 'top' (the whole arena from above), 'action' (a camera that
  // circles the fight), 'chase' (the game's own chase camera: the player's car, or the leader's with several players),
  // 'split' (split screen, 2 to 4 players)
  setView(v) { this.view = v || ''; this.splitSet(); this.setState({ view: this.view }); }
  splitSet() {
    const hs = this.cars.filter(c => c.hum), on = this.view === 'split' && hs.length >= 2 && hs.length <= 4;
    if (!on) { if (this.views.length) { this.views = []; this.emit('views'); } return; }
    if (this.views.length === hs.length && this.views.every((w, i) => w.c === hs[i])) return;
    this.views = hs.map(c => ({ c, cam: new THREE.PerspectiveCamera(55, 1, 0.1, 500), camH: c.h, look: null, shake: 0, cr: 0, fovK: 0, hitF: 0, rect: [0, 0, 1, 1], popEl: null, ui: null }));
    this.splitLayout(); this.emit('views');
  }
  // (two players one above the other, three or four in the four corners; with three, the fourth shows the whole arena.
  // The rectangles are in the drawing's own pixels, counted from the bottom left, as WebGL counts them.)
  splitLayout() { const W = this.W0 || 1, H = this.H0 || 1, n = this.views.length, h2 = Math.floor(H / 2), w2 = Math.floor(W / 2);
    const R = n === 2 ? [[0, H - h2, W, h2], [0, 0, W, H - h2]] : [[0, H - h2, w2, h2], [w2, H - h2, W - w2, h2], [0, 0, w2, H - h2], [w2, 0, W - w2, H - h2]];
    this.views.forEach((w, i) => { w.rect = R[i]; w.cam.aspect = w.rect[2] / Math.max(1, w.rect[3]); w.cam.updateProjectionMatrix(); }); this.mapRect = n === 3 ? R[3] : null; this.emit('layout'); }
  splitOn() { return this.views.length > 0 && (this.phase === 'countdown' || this.phase === 'playing'); }
  // (each view drawn in its own part of the screen; the shadows are worked out once for all of them)
  splitRender(dt, still) {
    const r = this.renderer; if (!still) this.cam(dt);
    r.setScissorTest(true); r.shadowMap.autoUpdate = false; r.shadowMap.needsUpdate = true;
    for (const w of this.views) { if (!still) this.vCam(w, dt); const q = w.rect; r.setViewport(q[0], q[1], q[2], q[3]); r.setScissor(q[0], q[1], q[2], q[3]); r.render(this.scene, w.cam); }
    if (this.mapRect) { const q = this.mapRect, cam = this.mapCam || (this.mapCam = new THREE.PerspectiveCamera(50, 1, 0.1, 500)), R = Math.max(10, this.R); cam.aspect = q[2] / Math.max(1, q[3]); cam.fov = 50; cam.position.set(0, 16 + R * 1.7, -(3 + R * 0.62)); cam.lookAt(0, 0, R * 0.08); cam.updateProjectionMatrix(); r.setViewport(q[0], q[1], q[2], q[3]); r.setScissor(q[0], q[1], q[2], q[3]); r.render(this.scene, cam); }
    r.setScissorTest(false); r.setViewport(0, 0, this.W0 || 1, this.H0 || 1); r.shadowMap.autoUpdate = true;
  }
  // (a player's own view: the game's chase camera on their car; while their car is out, the arena camera)
  vCam(w, dt) {
    const cam = w.cam, p = w.c, k = 1 - Math.exp(-5 * dt); let px, py, pz, lx, ly = 1, lz, fov = 55, cs = 0;
    if (!p.elim && !p.falling) { w.camH += Math.atan2(Math.sin(p.h - w.camH), Math.cos(p.h - w.camH)) * (1 - Math.exp(-4 * dt)); const fx = Math.sin(w.camH), fz = Math.cos(w.camH);
      const sr = Math.min(1.5, Math.hypot(p.vx, p.vz) / p.def.speed), ds = 11 + sr * 2.5; px = p.x - fx * ds; pz = p.z - fz * ds; py = 6.5 + p.y * 0.7 + sr * 0.6; lx = p.x + fx * 5; lz = p.z + fz * 5; ly = 1 + p.y * 0.8; fov = 54 + sr * 9; cs = -p.inp.steer * 0.035 * Math.min(1, sr); }
    else { const al = this.cars.filter(c => !c.elim); let cx = 0, cz = 0; for (const c of al) { cx += c.x; cz += c.z; } cx /= al.length || 1; cz /= al.length || 1;
      let s = 6; for (const c of al) s = Math.max(s, Math.hypot(c.x - cx, c.z - cz)); px = cx; py = 14 + s * 1.15; pz = cz - (14 + s * 0.95); lx = cx; lz = cz; }
    if (!w.look) { w.look = new THREE.Vector3(lx, ly, lz); cam.position.set(px, py, pz); }
    cam.position.x += (px - cam.position.x) * k; cam.position.y += (py - cam.position.y) * k; cam.position.z += (pz - cam.position.z) * k;
    w.look.x += (lx - w.look.x) * k * 1.6; w.look.y += (ly - w.look.y) * k; w.look.z += (lz - w.look.z) * k * 1.6;
    const sh = Math.max(w.shake, this.shake * 0.6); cam.lookAt(w.look.x + (Math.random() - 0.5) * sh, w.look.y + (Math.random() - 0.5) * sh, w.look.z); w.shake *= Math.exp(-6 * dt);
    w.cr += (cs - w.cr) * k; cam.rotateZ(w.cr); w.fovK *= Math.exp(-4 * dt); const tf = fov - w.fovK * 7; if (Math.abs(cam.fov - tf) > 0.05) { cam.fov += (tf - cam.fov) * Math.min(1, dt * 4); cam.updateProjectionMatrix(); }
  }
  // (the bars, the red flash of a hit and "OUT" on each player's own view: what the game's pad showed its one player)
  viewsUi(dt) { for (const w of this.views) { const u = w.ui, c = w.c; if (!u) continue; w.hitF = (w.hitF || 0) * Math.exp(-5 * dt); const b = (c.boost * 100).toFixed(0) + '%', d = (c.dmg * 100).toFixed(0) + '%', h = w.hitF < 0.03 ? '0' : w.hitF.toFixed(2), o = c.elim && !this.respawns ? '1' : '0';
      if (u.b !== b) { u.boost.style.width = b; u.b = b; } if (u.d !== d) { u.dmg.style.width = d; u.d = d; } if (u.h !== h) { u.hit.style.opacity = h; u.h = h; } if (u.o !== o) { u.out.style.opacity = o; u.o = o; } } }
  // (paused: the picture stays as it is)
  drawNow() { if (this.splitOn()) this.splitRender(0, true); else this.renderer.render(this.scene, this.camera); }
  // ---------- Blokvane: the garage ----------
  // While everyone picks a car on their phone, the cars stand on the arena side by side, turning slowly like the game's
  // car picker turned its one car (each one its own way: from its own angle, at its own speed, one way or the other), each with its driver's name over it. A car that is picked drops in from above with
  // the game's own landing (the bounce, the dust, the thud) and starts its engine the way the car picker did.
  gOpen(arena) {
    if (!this.scene) return; this.bombOff(); this.crownOff(); this.clearWorld(); this.gClose(); this.R = 30; this.setR(); if (arena && arena !== this.arena) this.buildArena(arena); this.state.arena = this.arena;
    this.player = null; this.solo = true; if (this.views.length) { this.views = []; this.emit('views'); } this.initAudio(); this.applyVol(); this.setPhase('garage');
  }
  // list: every car of the garage, players first: [{ key, carIdx, name, color, hum, pic (an Image, loaded), ready }]
  gSet(list) {
    if (this.phase !== 'garage') return; const keep = new Set(list.map(x => x.key));
    for (const g of this.gar.slice()) if (!keep.has(g.key)) this.gDel(g);
    list.forEach((x, i) => { let g = null; for (const q of this.gar) if (q.key === x.key) g = q; if (!g) { g = { key: x.key, carIdx: -1 }; this.gar.push(g); }
      g.slot = i; g.name = x.name; g.color = x.color; g.hum = !!x.hum; g.ready = !!x.ready; g.pic = x.pic || null; });
    this.gar.sort((a, b) => a.slot - b.slot); this.gLay();
    list.forEach(x => { for (const g of this.gar) if (g.key === x.key) { if (g.carIdx !== x.carIdx) { g.carIdx = x.carIdx; g.def = this.CARS[x.carIdx] || this.CARS[0]; this.gDrop(g); } else this.gLabel(g); } });
  }
  // (the places: one row of up to five, two rows for more, the first ones in front; each car turned a little so it is
  // seen from its front corner, the way the game's pictures show them)
  gLay() { const n = this.gar.length, cols = n <= 5 ? n : Math.ceil(n / 2), sx = 5.6;
    this.gar.forEach((g, i) => { const row = i < cols ? 0 : 1, j = row ? i - cols : i, cnt = row ? n - cols : cols; g.x = ((cnt - 1) / 2 - j) * sx; g.z = row * 7.5; g.h = Math.PI + 0.55; if (g.mesh && g.d) g.mesh.position.set(g.x, g.d.y, g.z); if (g.ec) { g.ec.x = g.x; g.ec.z = g.z; } }); }
  // (the garage's camera: far enough back to see every car, swaying a little from side to side)
  gView() { const n = this.gar.length, cols = Math.max(1, n <= 5 ? n : Math.ceil(n / 2)), rows = n > 5 ? 2 : 1, halfW = (cols - 1) * 5.6 / 2 + 3.6, asp = this.camera.aspect || 1.78, hf = Math.atan(Math.tan(27.5 * Math.PI / 180) * asp), D = Math.max(10.5, halfW / Math.tan(hf) * 1.18 + (rows - 1) * 2.5), sw = Math.sin(this.orbit * 0.35) * Math.min(3, 1 + halfW * 0.2);
    return [sw, 2.8 + D * 0.24 + (rows - 1) * 2.4, -D, 0, rows > 1 ? 2.4 : 2.1, rows > 1 ? 3.6 : 0, 55]; }
  gDrop(g) {
    const n = (g.n = (g.n || 0) + 1), def = g.def, vol = this.gVol(g);
    if (g.mesh) { if (g.away) this.gDispose(g.away.m); g.away = { m: g.mesh, t: 0 }; g.mesh = null; g.lbl = null; g.lsig = ''; }
    if (g.ec) { const e = g.ec.en; if (e && e.on && this.ac) this.eShot(g.ec.def, 'shutdown', 0.45 * vol); this.eKill(g.ec); g.ec = null; }
    this.loadCar(def).then(() => { if (this.dead || g.n !== n || this.phase !== 'garage' || this.gar.indexOf(g) < 0) return; const m = this.makeCar(def, g.color); this.scene.add(m); g.mesh = m; const ch = m.userData.ch;
      g.d = { y: 13, vy: 0, n: 0, t: 0, sq: 0, cy: ch ? ch.position.y : 0 }; g.spin = Math.random() * Math.PI * 2; g.spinV = (0.38 + Math.random() * 0.4) * (Math.random() < 0.5 ? -1 : 1); m.position.set(g.x, 13, g.z); m.rotation.y = g.h; this.gLast = g; this.gLabel(g);
      if (this.ac && this.eBus) { g.ec = { def, bot: true, pan: true, lnd: false, x: g.x, z: g.z }; this.eMake(g.ec); } this.emit('dropped', g.key, g.carIdx); });
  }
  gLabel(g) { if (!g.mesh) return; const sig = g.name + '|' + g.color + '|' + (g.ready ? 1 : 0) + '|' + (g.pic ? 1 : 0); if (g.lsig === sig && g.lbl) return; g.lsig = sig;
    if (g.lbl) { g.mesh.remove(g.lbl); g.lbl.material.map.dispose(); g.lbl.material.dispose(); } const lb = g.lbl = this.label((g.ready ? '✓ ' : '') + g.name, g.ready ? '#3ddc84' : g.color, g.pic); lb.position.y = 3.6; g.mesh.add(lb); }
  gDispose(m) { m.traverse(n => { if (n.isSprite && n.material) { if (n.material.map) n.material.map.dispose(); n.material.dispose(); } }); this.dispose(m); }
  gDel(g) { const i = this.gar.indexOf(g); if (i >= 0) this.gar.splice(i, 1); if (g.mesh) this.gDispose(g.mesh); if (g.away) this.gDispose(g.away.m); if (g.ec) { const e = g.ec.en; if (e && e.on && this.ac) this.eShot(g.ec.def, 'shutdown', 0.3); this.eKill(g.ec); } if (this.gLast === g) this.gLast = null; }
  gClose() { for (const g of this.gar) { if (g.mesh) this.gDispose(g.mesh); if (g.away) this.gDispose(g.away.m); if (g.ec) this.eKill(g.ec); } this.gar = []; this.gLast = null; }
  // (the car picked last is heard as the game's car picker played its one car; the others idle quietly next to it)
  gVol(g) { return this.gar.length <= 1 || g === this.gLast ? 1 : 0.5 / Math.sqrt(this.gar.length); }
  gStep(dt) {
    for (const g of this.gar) {
      if (g.away) { g.away.t += dt; const m = g.away.m; m.position.y += dt * (12 + 70 * g.away.t); if (g.away.t > 0.42) { this.gDispose(m); g.away = null; } }
      const p = g.mesh, d = g.d; if (!p || !d) continue; const ch = p.userData.ch;
      if (d.n < 3) { d.vy -= 46 * dt; d.y += d.vy * dt; if (d.y <= 0) { const v = -d.vy; d.y = 0; d.n++; d.vy = d.n < 3 && v > 5 ? v * 0.24 : 0; if (!d.vy) d.n = 3; this.gLand(g, v, d.n >= 3); } }
      d.t += dt; const w = d.sq * Math.exp(-5 * d.t) * Math.cos(16 * d.t); g.spin += dt * (g.spinV || 0.6); p.position.set(g.x, d.y, g.z); p.rotation.y = g.h + g.spin; if (ch) { ch.position.y = d.cy - 0.2 * w; ch.rotation.x = 0.05 * w; } }
  }
  gLand(g, v, done) { const d = g.d, k = Math.min(1, v / 30), R = Math.random, def = g.def, vol = this.gVol(g); if (v > 3) { d.sq = Math.max(0.25, k); d.t = 0; } this.shake = Math.max(this.shake || 0, 0.6 * k * vol);
    for (let q = 0; q < 2 + 16 * k; q++) { const a = R() * 6.28, sp = 2 + R() * 5 * k; this.spawn(g.x + Math.sin(a) * 2, 0.2, g.z + Math.cos(a) * 2, Math.sin(a) * sp, 0.6 + R() * 2 * k, Math.cos(a) * sp, this.dustC, 0.6 + R() * 0.6, 0.8, -0.5, 0.4); }
    if (this.ac && def && v > 3) { const hv = def.mass >= 1.8; this.sfx('CC11', (0.15 + 0.4 * k) * vol, hv ? 0.8 : 1); this.sfx('CC43', (0.12 + 0.35 * k) * vol, hv ? 0.85 : 1); }
    if (done && g.ec) g.ec.lnd = true; }
  // (each car's engine in the garage, the way the game's car picker ran its one car: it starts once the car has landed,
  // idles, blips now and then, and turns off by itself after a minute)
  gEng(dt) { const a = this.ac; if (!a || !this.camera) return; const t = a.currentTime, cm = this.camera.matrixWorld.elements, cx = this.camera.position.x, cz = this.camera.position.z;
    for (const g of this.gar) { const pc = g.ec, e = pc && pc.en; if (!e || !e.ok) continue; const vol = this.gVol(g);
      if (pc.lnd && !e.on) { pc.lnd = false; this.eShot(pc.def, 'startup', 0.55 * vol); e.on = true; e.wm = 0; e.wt = t + 0.95; e.st = t; e.bt = 2.5 + Math.random() * 2; e.bl = 0; }
      if (e.on && t - e.st > 60) { e.on = false; e.bl = 0; this.eShot(pc.def, 'shutdown', 0.45 * vol); }
      e.wm = e.on ? Math.max(0, Math.min(1, (t - e.wt) / 0.45)) : Math.max(0, e.wm - dt / 0.12);
      if (e.wm >= 1) { e.bt -= dt; if (e.bt <= 0) { e.bt = 3 + Math.random() * 4; e.bl = 0.2 + Math.random() * 0.3; e.rv = 0.45 + Math.random() * 0.3; } } e.bl -= dt;
      const th = e.bl > 0 ? 1 : 0, tr = th ? e.rv : 0.02, up = 0.035 + 0.045 * (pc.def.mass || 1.2);
      e.rpm += (tr - e.rpm) * (1 - Math.exp(-dt / (tr > e.rpm ? up : up * 2.5))); e.ld += ((th ? 1 : 0.2) - e.ld) * (1 - Math.exp(-dt / 0.09));
      const lv = 0.45 * this.eVol() * e.wm * (0.55 + 0.45 * e.ld) * vol; if (Math.abs(lv - e.lv) > 0.002 || (!lv && e.lv)) { e.out.gain.setTargetAtTime(lv, t, 0.05); e.lv = lv; }
      if (e.pan) { const dx = g.x - cx, dz = g.z - cz, pn = Math.max(-1, Math.min(1, (dx * cm[0] + dz * cm[2]) / (Math.hypot(dx, dz) || 1))) * 0.7; if (Math.abs(pn - e.pv) > 0.02) { e.pan.pan.setTargetAtTime(pn, t, 0.05); e.pv = pn; } }
      if (lv > 0.0005) this.eMix(e, t, 1); } }
  // (back to the garage after a match: the arena is cleared and everyone's car comes back for picking)
  toGarage(arena) { this.paused = false; this.rp = null; if (this.ac && this.ac.state === 'suspended') this.ac.resume(); this.setState({ paused: false }); if (this.engG && this.ac) { this.engG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); this.smpG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); this.quietLoops(); this.skG.gain.setTargetAtTime(0, this.ac.currentTime, 0.05); } this.gOpen(arena); }
  // ---------- Blokvane: Bomb Tag ----------
  // One car carries a bomb with a short fuse, ticking louder at the end. Bump another car and it is theirs. When the
  // fuse runs out the bomb goes off with the game's own car explosion, and that car is out; a moment later someone new
  // has a fresh bomb. Falling off still counts. The last car on the arena wins.
  bombMesh() { const T = THREE, g = new T.Group(), body = new T.Mesh(new T.SphereGeometry(0.62, 20, 14), new T.MeshStandardMaterial({ color: 0x15161a, roughness: 0.35, metalness: 0.6 })), cap = new T.Mesh(new T.CylinderGeometry(0.2, 0.24, 0.22, 12), new T.MeshStandardMaterial({ color: 0x6a6f78, metalness: 0.9, roughness: 0.3 })), led = new T.Mesh(new T.SphereGeometry(0.12, 10, 8), new T.MeshBasicMaterial({ color: 0xff2a1a, toneMapped: false }));
    cap.position.y = 0.66; led.position.set(0.3, 0.42, -0.42); g.add(body, cap, led); g.userData.led = led; return g; }
  bombStep(dt) {
    const b = this.bomb; if (!b) return false;
    if (!b.c) { b.wait -= dt; if (b.wait > 0) return false; const al = this.cars.filter(c => !c.elim && !c.falling); if (al.length < 2) return false; this.bombGive(al[Math.floor(Math.random() * al.length)], null, Math.max(9, 6 + al.length * 1.6 + Math.random() * 5)); return false; }
    const c = b.c; b.t -= dt; b.imm -= dt; b.m.position.set(c.x, c.y + 2.55 + Math.sin(this.time * 9) * 0.06, c.z); b.m.rotation.y += dt * 2;
    b.m.userData.led.visible = b.t < 3 ? Math.sin(this.time * 30) > 0 : Math.sin(this.time * 12) > 0;
    if (Math.random() < 0.7) this.sparks(c.x, c.y + 3.25, c.z, 0, 1, 0, 1, 2.5, 0.6);
    const s = Math.ceil(b.t); if (s !== b.s) { b.s = s; if (s > 0) { this.sv = this.me(c) ? Math.max(0.6, this.mv(c)) : 0.35 + 0.5 * this.near(c.x, c.z); this.tone(s <= 3 ? 1320 : 880, 0.09, 'square', 0.07); if (s <= 3) this.tone(1320, 0.09, 'square', 0.07, 0, 0.18); this.sv = 1; this.pushHud(); } }
    if (b.t <= 0) { b.c = null; b.wait = 2.6; b.m.visible = false; this.carBoom(c); return this.phase !== 'playing'; }
    return false;
  }
  bombGive(c, from, fuse) { const b = this.bomb; if (!b.m) { b.m = this.bombMesh(); this.scene.add(b.m); } b.m.visible = true; b.prev = from; b.c = c; b.imm = 0.9; if (fuse) { b.t = fuse; b.s = 0; } this.pushHud(); this.emit('bomb', c, from);
    if (from) { this.sv = this.me(c) || this.me(from) ? 1 : 0.6 * this.near(c.x, c.z); this.ws('2g_glove_punch', 0.5); this.sv = 1; this.popMe(from, 'BOMB PASSED!', '#3ddc84'); } else this.toast(c.name + ' HAS THE BOMB');
    this.popMe(c, 'YOU HAVE THE BOMB!', '#ff5a2a', 1); }
  bombTouch(a, b) { const B = this.bomb; if (!B || !B.c || B.imm > 0) return; const h = B.c === a ? a : B.c === b ? b : null; if (!h) return; const o = h === a ? b : a; if (o.elim || o.falling || (o === B.prev && B.imm > -0.6)) return; this.bombGive(o, h, 0); }
  bombGone() { const b = this.bomb; if (!b || !b.c) return; b.c = null; b.wait = 2.6; if (b.m) b.m.visible = false; this.pushHud(); }
  bombOff() { const b = this.bomb; if (b && b.m && this.scene) { this.scene.remove(b.m); b.m.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) n.material.dispose(); }); } this.bomb = null; }
  // ---------- Blokvane: Crown Chase ----------
  // A gold crown waits in the middle. The car that grabs it scores 3 points a second while it keeps it; hit the holder
  // with your car to take it, or knock them off. Cars come back after a fall. First to 60, or the most when time runs out.
  crownMesh() { const T = THREE, g = new T.Group(), gold = new T.MeshStandardMaterial({ color: 0xffc23a, metalness: 1, roughness: 0.22, emissive: 0x3a2400, side: T.DoubleSide }), ring = new T.Mesh(new T.CylinderGeometry(0.62, 0.66, 0.34, 24, 1, true), gold); g.add(ring);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2, s = new T.Mesh(new T.ConeGeometry(0.16, 0.5, 8), gold); s.position.set(Math.sin(a) * 0.6, 0.4, Math.cos(a) * 0.6); g.add(s); const j = new T.Mesh(new T.SphereGeometry(0.08, 8, 6), new T.MeshBasicMaterial({ color: [0xff2a5a, 0x4aa3ff, 0x3ddc84, 0xc77dff, 0xffffff][i], toneMapped: false })); j.position.set(Math.sin(a) * 0.63, 0.05, Math.cos(a) * 0.63); g.add(j); }
    const glow = new T.Mesh(new T.RingGeometry(1.0, 1.6, 32), new T.MeshBasicMaterial({ color: 0xffc23a, transparent: true, opacity: 0.35, side: T.DoubleSide, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = -1.5; g.add(glow); g.userData.glow = glow; g.scale.setScalar(1.25); return g; }
  crownStart() { this.crown = { c: null, x: 0, z: 0, free: 1.5, gT: 0, m: this.crownMesh() }; this.scene.add(this.crown.m); }
  crownStep(dt) {
    const K = this.crown; if (!K) return false; const m = K.m;
    if (K.c) { const c = K.c; c.pts += dt * 3; K.gT -= dt; m.position.set(c.x, c.y + 2.75, c.z); m.rotation.y += dt * 2.5; m.userData.glow.visible = false; if (Math.random() < 0.35) this.spawn(c.x + (Math.random() - 0.5) * 1.2, c.y + 2.7, c.z + (Math.random() - 0.5) * 1.2, 0, 1.2, 0, 0xffd23f, 0.12, 0.7, 0); if (c.pts >= 60) { c.pts = 60; this.finish(c); return true; } }
    else { K.free -= dt; m.position.set(K.x, 1.6 + Math.sin(this.time * 3) * 0.25, K.z); m.rotation.y += dt * 1.5; m.userData.glow.visible = true; if (K.free <= 0) for (const c of this.cars) if (!c.elim && !c.falling && c.y < 2 && Math.hypot(c.x - K.x, c.z - K.z) < c.def.r + 1.1) { this.crownGive(c, null); break; } }
    return false;
  }
  crownGive(c, from) { const K = this.crown; K.c = c; K.gT = 1.2; this.pushHud(); this.emit('crown', c, from); this.sfx('CC50', 0.3 * (this.me(c) ? this.mv(c) : 0.4 + 0.5 * this.near(c.x, c.z)));
    if (from) { this.popMe(c, 'CROWN STOLEN!', '#ffd23f', 1); this.popMe(from, 'LOST THE CROWN!', '#e53935'); } else this.popMe(c, 'GOT THE CROWN!', '#ffd23f', 1); if (!this.me(c) || !this.solo) this.toast(c.name + (from ? ' STOLE THE CROWN' : ' HAS THE CROWN')); }
  crownTouch(a, b, J) { const K = this.crown; if (!K || !K.c || K.gT > 0 || J < 6) return; const h = K.c === a ? a : K.c === b ? b : null; if (!h) return; const o = h === a ? b : a; if (o.elim || o.falling) return; this.crownGive(o, h); }
  crownDrop(to) { const K = this.crown; if (!K) return; const c = K.c; if (to) { this.crownGive(to, c); return; } K.c = null; K.x = 0; K.z = 0; K.free = 1.5; this.pushHud(); }
  crownOff() { const K = this.crown; if (K && K.m && this.scene) { this.scene.remove(K.m); K.m.traverse(n => { if (n.geometry) n.geometry.dispose(); if (n.material) n.material.dispose(); }); } this.crown = null; }
  // (Blokvane: the computer cars of the two new modes: in Bomb Tag they run from the bomb, and the one with it hunts
  // like any computer car; in Crown Chase they go for the crown, chase whoever has it, and the holder runs)
  aiMode(c, dt) {
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), margin = Math.min(7, this.R * 0.35), d0 = Math.hypot(c.x, c.z); let tx = null, tz = null, flee = null;
    if (this.mode === 'bomb') { const h = this.bomb && this.bomb.c; if (!h || h === c) return false; flee = h; }
    else if (this.mode === 'crown' && this.crown) { const K = this.crown; if (K.c === c) { let n = null, nd = 1e9; for (const o of this.cars) { if (o === c || o.elim || o.falling) continue; const d = Math.hypot(o.x - c.x, o.z - c.z); if (d < nd) { nd = d; n = o; } } if (!n || nd > 16) return false; flee = n; }
      else if (K.c) { c.tgt = K.c; c.aiT = 0.5; return false; } else { tx = K.x; tz = K.z; } }
    else return false;
    if (flee) { const dx = c.x - flee.x, dz = c.z - flee.z, l = Math.hypot(dx, dz) || 1; if (l > 18) return false; tx = c.x + dx / l * 10; tz = c.z + dz / l * 10; const tl = Math.hypot(tx, tz), mx = this.R - margin - 2; if (tl > mx) { const a = Math.atan2(c.x, c.z) + (wrap(Math.atan2(dx, dz) - Math.atan2(c.x, c.z)) > 0 ? 1.1 : -1.1); tx = Math.sin(a) * mx * 0.7; tz = Math.cos(a) * mx * 0.7; } }
    if (d0 > this.R - margin) { tx = 0; tz = 0; }
    const diff = wrap(Math.atan2(tx - c.x, tz - c.z) - c.h);
    c.inp.steer = Math.max(-1, Math.min(1, -diff * this.D.st)); c.inp.gas = this.time < c.i * 0.35 ? 0 : Math.min(1, this.D.gas * (this.wk || 1)); c.inp.brake = 0; c.inp.boost = flee && Math.hypot(c.x - flee.x, c.z - flee.z) < 7 && c.boost > this.D.bt ? 1 : 0;
    if (c.weapon && c.wcd <= 0 && !c.burst && this.time > 6 && flee) { const wd = this.W[c.weapon], dx = flee.x - c.x, dz = flee.z - c.z, d = Math.hypot(dx, dz), al = Math.abs(wrap(Math.atan2(dx, dz) - c.h)); if (d < wd[4] && (wd[3] === 'behind' ? al > wd[5] : al < wd[5])) { this.fire(c); c.wcd += this.D.wd; } }
    return true;
  }
}
window.CFAEngine = CFAEngine;
