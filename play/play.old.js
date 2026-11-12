// Made from play.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change play.js and run node tools/old-js.js again.
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
var BVPLAY = (() => {
  "use strict";
  const L = BVLIVE, C = BVWT_CORE, P = BVPLAYC;
  const GO = L.GO;
  const stage = document.getElementById("stage");
  const games = /* @__PURE__ */ new Map();
  const players = /* @__PURE__ */ new Map();
  let R = null, CR = null, code = "", host = "", game = null, settings = {}, phase = "lobby", lang = "en", strings = Object.assign({}, P.STR), round = 0, secret = "";
  const I18N = BVI18N;
  const handlers = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Map();
  const kicked = /* @__PURE__ */ new Set();
  const ended = /* @__PURE__ */ new Set();
  const waitNext = /* @__PURE__ */ new Map();
  const playerSubs = /* @__PURE__ */ new Set();
  let waitHost = false;
  function el(tag, cls, parent2, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent2) parent2.appendChild(e);
    return e;
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const EMBEDDED = (() => {
    try {
      return window.parent !== window;
    } catch (e) {
      return true;
    }
  })();
  const IN_EXT = EMBEDDED && (() => {
    try {
      const a = location.ancestorOrigins;
      return !!(a && a.length === 1 && /^(chrome|moz|safari-web)-extension:\/\//.test(a[0]));
    } catch (e) {
      return false;
    }
  })();
  const IS_TV = /SMART-TV|SmartTV|Tizen|Web0S|webOS|NetCast|BRAVIA|AFT[A-Z]|Android TV|GoogleTV|CrKey|HbbTV|VIDAA|PhilipsTV|Roku|Viera|TV Safari|PlayStation|Xbox|Nintendo/i.test(navigator.userAgent || "");
  const SLOW_SCREEN = (() => {
    try {
      if (IS_TV) return true;
      if (!window.BV_ASYNC) return true;
      if (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 2) return true;
      if (navigator.deviceMemory > 0 && navigator.deviceMemory <= 1) return true;
    } catch (e) {
    }
    return false;
  })();
  let paused = false, pausedAt = 0, pausedAll = 0, pauseEl = null;
  const gnow = () => Date.now() - pausedAll - (paused ? Date.now() - pausedAt : 0);
  const ptimers = /* @__PURE__ */ new Set(), pauseSubs = /* @__PURE__ */ new Set();
  function pafter(fn, ms) {
    const x = { due: gnow() + Math.max(0, +ms || 0), t: 0, fn };
    x.arm = () => {
      clearTimeout(x.t);
      x.t = setTimeout(() => {
        ptimers.delete(x);
        fn();
      }, Math.max(0, x.due - gnow()));
    };
    ptimers.add(x);
    if (!paused) x.arm();
    return () => {
      clearTimeout(x.t);
      ptimers.delete(x);
    };
  }
  const psleep = (ms) => new Promise((r) => pafter(r, ms));
  const ICONS = /* @__PURE__ */ new Set(["trivia", "boowho", "world", "emoji", "imposter", "gir"]);
  const iconOf = (id) => "icons/" + id + ".webp";
  const list = () => [...players.values()].filter((p) => !p.away);
  const alive = () => list().filter((p) => !p.out);
  const avatarUrl = (p) => p.photo || P.booUri(p.av) || P.booUri("boo:hi");
  const pub = (p) => ({ id: p.id, name: p.name, av: p.av, ph: !!p.photo, color: p.color, team: p.team, ready: !!p.ready || p.id === host, score: p.score, lives: p.lives, out: !!p.out, lg: p.lang || "" });
  function open(given) {
    return __async(this, null, function* () {
      const me = yield C.newMember();
      const s = secret = L.newSecret();
      R = yield L.room({ secret: s, label: "bvplay", me, name: "TV", role: "tv", open: true, home: true, onMsg: (m, p) => take(m, p), onPeers: () => sweep() });
      code = given || L.shortCode(6);
      CR = yield L.room({ secret: yield L.codeSecret(code, "play"), label: "bvplaycode", me, name: "TV", role: "tv", open: true, home: true, onMsg: (m) => {
        if (m.k === "link?") CR.send({ k: "link", s, tv: R.id, lang }, m.f).catch(() => {
        });
      } });
      setInterval(() => {
        if (phase !== "end" && !allLean()) sayLobby(null, true);
      }, 12e3);
      setInterval(beat, 2500);
      nearOn();
    });
  }
  let beatN = 0;
  function beat() {
    if (!R || phase === "closed") return;
    beatN++;
    if (phase !== "play" && beatN % 2) return;
    say({ k: "hb", ph: phase, lv: lobbyV, sv: setupV, qn: phase === "play" && cur.q ? cur.q.n : 0, rn: phase === "play" ? resN : 0, gr: run, pa: phase === "play" && paused ? 1 : 0 });
  }
  let near = null, nearBusy = false, nearSig = "";
  const nearInfo = () => ({ v: 2, g: game ? game.id : "", p: list().length, ph: phase === "lobby" ? 0 : 1, h: players.get(host) ? 1 : 0 });
  const knocks = /* @__PURE__ */ new Map();
  function nearMsg(m) {
    if (!near || !m || m.k !== "knock" || !m.boxed || !L.okId(m.f) || phase === "closed" || settings.k_near === false) return;
    const t = Date.now(), last = knocks.get(m.f) || 0;
    if (t - last < 700) return;
    if (knocks.size > 200) knocks.clear();
    knocks.set(m.f, t);
    const answer = (x) => {
      if (near) near.box(m.f, Object.assign({ k: "door", i: typeof m.i === "string" ? m.i.slice(0, 16) : "" }, x)).catch(() => {
      });
    };
    if (typeof m.pass !== "string" || typeof BVPASS === "undefined") {
      answer({ no: "pass" });
      return;
    }
    BVPASS.ok(m.pass, m.f).then((ok) => {
      if (ok && R && phase !== "closed") answer({ s: secret, tv: R.id, lang });
      else answer({ no: "pass" });
    }, () => answer({ no: "pass" }));
  }
  const screenName = (() => {
    const ua = navigator.userAgent || "";
    if (/Tizen|SMART-TV.*Samsung/i.test(ua)) return "Samsung TV";
    if (/Web0S|webOS|NetCast/i.test(ua)) return "LG TV";
    if (/AFT[A-Z]|\bSilk\//.test(ua)) return "Fire TV";
    if (/CrKey/.test(ua)) return "Chromecast";
    if (/Android TV|AndroidTV|GoogleTV|BRAVIA/i.test(ua)) return "Android TV";
    if (/VIDAA|Hisense/i.test(ua)) return "Hisense TV";
    if (/Roku/i.test(ua)) return "Roku TV";
    if (/PlayStation/i.test(ua)) return "PlayStation";
    if (/Xbox/i.test(ua)) return "Xbox";
    if (/iPad/.test(ua) || /Macintosh/.test(ua) && navigator.maxTouchPoints > 1) return "iPad";
    if (/Android/.test(ua)) return "Android tablet";
    if (/CrOS/.test(ua)) return "Chromebook";
    if (/Macintosh/.test(ua)) return "Mac";
    if (/Windows/.test(ua)) return "Windows computer";
    return "TV";
  })();
  function nearOn() {
    return __async(this, null, function* () {
      const want = settings.k_near !== false && phase !== "closed" && !!code && !!L.nearby;
      if (!want) {
        if (near) {
          near.close();
          near = null;
          nearSig = "";
        }
        return;
      }
      if (near) {
        const i = nearInfo(), sg = JSON.stringify(i);
        if (sg !== nearSig) {
          nearSig = sg;
          near.setInfo(i);
        }
        return;
      }
      if (nearBusy) return;
      nearBusy = true;
      try {
        const i = nearInfo();
        near = yield L.nearby({ role: "tv", name: screenName, info: i, onMsg: nearMsg });
        nearSig = JSON.stringify(i);
      } catch (e) {
        near = null;
      }
      nearBusy = false;
      if (near && (settings.k_near === false || phase === "closed")) {
        near.close();
        near = null;
      } else if (near) {
        const i2 = nearInfo(), sg2 = JSON.stringify(i2);
        if (sg2 !== nearSig) {
          nearSig = sg2;
          near.setInfo(i2);
        }
      }
    });
  }
  const linkNow = () => GO + "games.html#game." + secret + "." + R.id + (lang !== "en" ? "." + lang : "");
  function setLang(v) {
    return __async(this, null, function* () {
      lang = v;
      for (const p of players.values()) if (p.lang === lang) p.lang = "";
      yield P.useLang(lang);
      strings = yield P.trAll(P.STR);
      document.documentElement.lang = lang;
      document.documentElement.dir = P.RTL.has(lang) ? "rtl" : "ltr";
      document.body.classList.toggle("rtl", P.RTL.has(lang));
      document.title = P.f("Blokvane party games");
      if (game) {
        const h = "#" + game.id + (lang !== "en" ? "." + lang : "");
        if (location.hash !== h) {
          try {
            history.replaceState(history.state, "", h);
          } catch (e) {
          }
        }
      }
      if (game && game.langOptions) for (const [key, fn] of Object.entries(game.langOptions)) {
        const f = game.settings.find((x) => x.key === key);
        if (f && !fn(lang, f.options).some((o) => String(o[0]) === String(settings[key]))) settings[key] = f.default;
      }
    });
  }
  function sweep() {
    let changed = false;
    for (const p of players.values()) {
      const away = !!p.gone || !R.here(p.id);
      if (!!p.away !== away) {
        p.away = away;
        if (away) p.awayAt = Date.now();
        changed = true;
      }
    }
    if (changed) peopleChanged();
  }
  function peopleChanged() {
    for (const w of pending.values()) fixWho(w);
    pickHost();
    if (phase === "lobby") lobby();
    sayLobby();
    for (const f of playerSubs) {
      try {
        f();
      } catch (e) {
      }
    }
  }
  function fixWho(w) {
    if (w.done) return;
    for (const id of w.all) {
      const p = players.get(id);
      const here = !!p && !p.away;
      if (here && !w.who.has(id)) w.who.add(id);
      else if (!here && w.who.has(id) && !w.got.has(id)) w.who.delete(id);
    }
    if (w.got.size >= w.who.size) w.finish();
  }
  let trueHost = "", hostT = 0;
  const hostHere = () => [...players.values()].some((x) => x.paid && !x.away && !x.left);
  const passed = /* @__PURE__ */ new WeakSet();
  function pickHost() {
    const was = host;
    const th = players.get(trueHost);
    if (th && th.paid && !th.away && host !== trueHost) host = trueHost;
    const h = players.get(host);
    const grace = waitHost ? 15e3 : 9e4;
    clearTimeout(hostT);
    if (!h || !h.paid || h.away && (h.left || !(Date.now() - (h.awayAt || 0) < grace))) {
      const next = list().find((x) => x.paid);
      host = next ? next.id : "";
      if (!th || th.left) trueHost = host;
    } else if (h.away) hostT = setTimeout(() => {
      pickHost();
      if (phase === "lobby") lobby();
      sayLobby();
    }, grace + 500 - (Date.now() - (h.awayAt || 0)));
    if (!trueHost || !players.has(trueHost)) trueHost = host;
    if (was !== host) for (const id of [was, host]) {
      const x = players.get(id);
      if (x && !x.away) sayTo(id, { k: "you", id, host: host === id, color: x.color });
    }
    if (was && !host && players.size && phase !== "closed") setTimeout(hostGone, 0);
  }
  function hostGone() {
    return __async(this, null, function* () {
      if (host || hostHere() || !players.size || phase === "closed") return;
      abortGame();
      say({ k: "hostgone" });
      for (const id of players.keys()) ended.add(id);
      players.clear();
      waitNext.clear();
      seen.clear();
      host = "";
      trueHost = "";
      clearTimeout(hostT);
      phase = "lobby";
      const my = ++lobbyRun;
      const t = yield Promise.all(["The host left", "This game is over. A Blokvane member can scan the code to start a new one."].map((x) => P.tr(x)));
      if (my !== lobbyRun || phase !== "lobby") return;
      SND.music(null, { fadeOut: 1 });
      if (booEl) booEl.hidden = true;
      stage.textContent = "";
      const cv = el("div", "cover closed", stage);
      const box2 = el("div", "cl-box", cv);
      const im = el("img", "cl-boo", box2);
      im.src = P.booUri("boo:sad") || P.booUri("boo:hi");
      im.alt = "";
      el("h1", "", box2, t[0]);
      el("p", "", box2, t[1]);
      setTimeout(() => {
        if (my === lobbyRun && phase === "lobby") {
          if (booEl) booEl.hidden = false;
          lobby();
        }
      }, 9e3);
    });
  }
  function removePlayer(id) {
    if (!players.has(id)) return;
    players.delete(id);
    kicked.add(id);
    sayTo(id, { k: "kicked" });
    for (const w of pending.values()) {
      if (w.done) continue;
      w.all.delete(id);
      if (!w.got.has(id)) w.who.delete(id);
      if (w.got.size >= w.who.size) w.finish();
    }
    peopleChanged();
  }
  setInterval(() => {
    if (phase !== "play" || !R || paused) return;
    const t = Date.now(), want = /* @__PURE__ */ new Set();
    for (const w of pending.values()) if (!w.done && !w.sec && t - w.at > 8e3) {
      for (const id of w.who) if (!w.got.has(id)) want.add(id);
    }
    if (waitHost && host) want.add(host);
    let gone = false;
    for (const id of want) {
      const p = players.get(id);
      if (!p || p.away || !p.cap) continue;
      if (p.pingAt && p.heard < p.pingAt && t - p.pingAt > 7e3) {
        p.gone = true;
        p.pingAt = 0;
        gone = true;
        continue;
      }
      if (!p.pingAt || p.heard >= p.pingAt && t - p.pingAt > 6e3) {
        p.pingAt = t;
        sayTo(id, { k: "ping" });
      }
    }
    if (gone) sweep();
  }, 2e3);
  setInterval(() => {
    if (phase !== "play" || !R || paused) return;
    const t = Date.now();
    for (const w of pending.values()) {
      if (w.done || !w.q || t - (w.sent || w.at) < (w.sent ? 3e3 : 1500)) continue;
      const left = [...w.all].filter((id) => !w.got.has(id) && !(w.ack && w.ack.has(id)) && players.has(id) && !players.get(id).away);
      if (!left.length) continue;
      w.sent = t;
      if (w.q.extra && w.q.extra.helpOnly || left.length <= 3) {
        for (const id of left) sayTo(id, w.q);
      } else if (cur.q === w.q) say(w.q);
    }
  }, 500);
  let joinEl = null, joinT = 0;
  function showJoin(on2, keep) {
    return __async(this, null, function* () {
      clearTimeout(joinT);
      if (!on2) {
        if (joinEl) {
          joinEl.remove();
          joinEl = null;
        }
        sayLobby();
        return;
      }
      if (!joinEl) {
        const box2 = el("div", "join-ov");
        const q = el("div", "qr", box2);
        try {
          q.appendChild(BVQR.svgOf(linkNow(), { border: 1 }));
        } catch (e) {
        }
        el("b", "", box2, yield P.tr("Join the game"));
        el("div", "muted", box2, (yield P.tr("Scan with your camera")) + " · " + (yield P.tr("or open Blokvane and type")));
        const ct = el("div", "codetiles", box2);
        ct.setAttribute("aria-label", code);
        for (const ch of code) el("span", "", ct, ch);
        if (joinEl) return;
        joinEl = box2;
        document.body.appendChild(box2);
      }
      if (keep || settings.k_code) joinEl.dataset.keep = "1";
      else {
        delete joinEl.dataset.keep;
        joinT = setTimeout(() => showJoin(false), 12e4);
      }
      sayLobby();
    });
  }
  const okLang = (v) => typeof v === "string" && I18N.FULL.has(v) && v !== lang && (!game || !game.langs || game.langs.includes(v)) ? v : "";
  function setPlayerLang(p, v) {
    const lg = okLang(v);
    if ((p.lang || "") === lg) return false;
    p.lang = lg;
    if (lg) {
      I18N.load(lg, false);
      if (game && game.langPrep) {
        try {
          game.langPrep(lg);
        } catch (e) {
        }
      }
    }
    return true;
  }
  function take(m, peer) {
    if (!m || typeof m.k !== "string" || !L.okId(m.f)) return;
    if (phase === "closed") {
      if (m.k === "join" || m.k === "sync") sayTo(m.f, { k: "closed" });
      return;
    }
    const p = players.get(m.f);
    if (p) {
      p.heard = Date.now();
      if (p.gone) {
        p.gone = false;
        setTimeout(sweep, 0);
      }
    }
    switch (m.k) {
      case "join": {
        const paid = passed.has(m);
        if (m.pass && !paid && !(p && p.paid) && typeof BVPASS !== "undefined") {
          const ps = m.pass;
          delete m.pass;
          BVPASS.ok(ps, m.f).then((ok) => {
            if (ok) passed.add(m);
            take(m, peer);
          }, () => take(m, peer));
          return;
        }
        if (kicked.has(m.f)) {
          if (!m.again) {
            sayTo(m.f, { k: "kicked" });
            return;
          }
          kicked.delete(m.f);
        }
        if (!p && !paid && !hostHere()) {
          sayTo(m.f, { k: "needhost" });
          return;
        }
        if (!p && players.size >= 40) {
          R.send({ k: "full" }, m.f).catch(() => {
          });
          return;
        }
        if (!p && phase === "play" && settings.k_late === false) {
          if (waitNext.size < 40) waitNext.set(m.f, m);
          sayTo(m.f, { k: "waitnext" });
          return;
        }
        const pl = p || { id: m.f, score: 0, right: 0, lives: +settings.lives || 3, out: false, streak: 0, helpers: {}, color: P.COLORS[players.size % P.COLORS.length], team: "" };
        if (paid) pl.paid = true;
        pl.name = P.name(m.name);
        pl.av = P.AVATARS.includes(m.av) ? m.av : "boo:hi";
        pl.gone = false;
        pl.left = false;
        pl.at = Date.now();
        pl.heard = Date.now();
        if (m.nophoto) pl.photo = "";
        if (!p) pl.away = false;
        pl.cap = +m.cap || 0;
        pl.sv = typeof m.sv === "string" ? m.sv.slice(0, 24) : "";
        if ("lg" in m) setPlayerLang(pl, m.lg);
        if (teamsOn() && !pl.team) pl.team = P.TEAMS[players.size % Math.min(4, +settings.teamN || 2)][0];
        const isNew = !p;
        ended.delete(m.f);
        players.set(m.f, pl);
        pickHost();
        if (isNew) P.sfx("join");
        R.send({ k: "you", id: m.f, host: host === m.f, color: pl.color }, m.f).catch(() => {
        });
        if (isNew) {
          for (const w of pending.values()) fixWho(w);
          for (const f of playerSubs) {
            try {
              f();
            } catch (e) {
            }
          }
        } else sweep();
        if (phase === "lobby") lobby();
        if (leanPhone(pl)) sayLobby(m.f);
        sayLobby();
        if (phase === "play") sayNow(m.f);
        return;
      }
      case "photo":
        if (p && m.boxed && L.okPicture(m.d) && m.d.length < 6e4) {
          p.photo = m.d;
          if (phase === "lobby") lobby();
        }
        return;
      case "ready":
        if (p) {
          p.ready = !!m.on;
          if (phase === "lobby") lobby();
          sayLobby();
        }
        return;
      case "team":
        if (p && P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).some((t) => t[0] === m.team)) {
          p.team = m.team;
          if (phase === "lobby") lobby();
          sayLobby();
        }
        return;
      case "plang":
        if (p && setPlayerLang(p, m.v)) {
          if (phase === "lobby") lobby();
          sayLobby();
        }
        return;
      case "set":
        if (p && m.f === host && (phase === "lobby" || /^(snd_[a-z0-9]+|vol_(music|fx)|k_(code|calm|late))$/.test(String(m.key)))) setOne(m.key, m.v);
        return;
      case "game":
        if (p && m.f === host && (phase === "lobby" || phase === "end" || phase === "play") && games.has(m.id)) {
          abortGame();
          choose(m.id);
        }
        return;
      case "start":
        if (p && m.f === host && phase === "lobby" && game) start();
        return;
      case "stop":
        if (p && m.f === host && phase === "play") stopGame();
        return;
      // the host, from any screen of a game: pause it and go on, start the same game over, go back to its setup (another
      // mode, other settings), or pick another game (above: 'game'). Everyone stays in, with nothing to do.
      case "pause":
        if (p && m.f === host && phase === "play") setPause(!!m.on);
        return;
      case "restart":
        if (p && m.f === host && game && (phase === "play" || phase === "end")) {
          abortGame();
          for (const x of players.values()) x.ready = true;
          phase = "lobby";
          start();
        }
        return;
      case "tolobby":
        if (p && m.f === host && game && (phase === "play" || phase === "end")) {
          abortGame();
          phase = "lobby";
          for (const x of players.values()) x.ready = true;
          letWaitersIn();
          lobby();
          sayLobby();
        }
        return;
      case "again":
        if (p && m.f === host && phase === "end") {
          phase = "lobby";
          for (const x of players.values()) {
            x.ready = true;
          }
          if (joinEl) showJoin(false);
          lobby();
          sayLobby();
        }
        return;
      // the host's phone: take someone out, hand the host to someone else, show the join code on the TV again
      case "kick":
        if (p && m.f === host && typeof m.id === "string" && m.id !== host) removePlayer(m.id);
        return;
      case "makehost": {
        const to = players.get(m.id);
        if (!p || m.f !== host || !to || to.away || to.id === host) return;
        if (!to.paid) {
          sayTo(m.f, { k: "needpass", name: to.name });
          return;
        }
        host = to.id;
        trueHost = to.id;
        for (const x of [p, to]) sayTo(x.id, { k: "you", id: x.id, host: host === x.id, color: x.color });
        if (phase === "lobby") lobby();
        sayLobby();
        return;
      }
      case "showjoin":
        if (p && m.f === host) showJoin(!!m.on);
        return;
      // (the TV's size from the host's phone, for a TV nobody can click on: bigger, smaller, or back to fitting by itself)
      case "zoom":
        if (p && m.f === host) {
          const d = +m.d;
          zoomBy(d > 0 ? 1 : d < 0 ? -1 : 0);
          sayLobby();
        }
        return;
      case "ping":
        return;
      case "pong":
        return;
      case "bye":
        if (p) {
          p.gone = true;
          if (m.left) p.left = true;
          sweep();
        }
        return;
      // a phone asks what's on: everything (who it is, the lobby, the question), or only the question and its own result
      // (only: 'q') when that is all it missed
      case "sync":
        if (p) {
          if (typeof m.sv === "string") p.sv = m.sv.slice(0, 24);
          if (m.only !== "q") {
            R.send({ k: "you", id: m.f, host: host === m.f, color: p.color }, m.f).catch(() => {
            });
            sayLobby(m.f);
          }
          if (phase === "play") sayNow(m.f);
        } else if (kicked.has(m.f)) sayTo(m.f, { k: "kicked" });
        else if (ended.has(m.f)) sayTo(m.f, { k: "hostgone" });
        return;
      // (a phone has the question: no need to send it again)
      case "got": {
        const w = pending.get(+m.n);
        if (w && p && !w.done) (w.ack || (w.ack = /* @__PURE__ */ new Set())).add(m.f);
        return;
      }
      case "ans": {
        const w = pending.get(+m.n);
        if (!w || !p || w.done || w.got.has(m.f)) return;
        if (!w.who.has(m.f)) {
          if (!w.all.has(m.f)) return;
          w.who.add(m.f);
        }
        w.got.set(m.f, { v: m.v, ms: Math.max(0, Math.min(6e5, +m.ms || 0)), at: Date.now() });
        if (w.onAns) {
          try {
            w.onAns(m.f, w.got.get(m.f));
          } catch (e) {
          }
        }
        if (w.got.size >= w.who.size) w.finish();
        return;
      }
      default: {
        const h = handlers.get(m.k);
        if (h && p) {
          try {
            h(m, p);
          } catch (e) {
            console.warn("Blokvane play", e);
          }
        }
      }
    }
  }
  const say = (m) => R.send(m).catch(() => {
  });
  const sayTo = (id, m) => R.send(m, id).catch(() => {
  });
  function box(id, m) {
    return __async(this, null, function* () {
      if (m && m.gr == null) m.gr = run;
      for (let i = 0; i < 6; i++) {
        try {
          yield R.box(id, m);
          return true;
        } catch (e) {
          yield sleep(800);
        }
      }
      if (m.k !== "secret") {
        R.send(m, id).catch(() => {
        });
        return true;
      }
      return false;
    });
  }
  const teamsOn = () => !!(game && game.teams && (settings.teams || game.teamsForce && game.teamsForce(settings)) && (!game.teamsOn || game.teamsOn(settings)));
  function balanceTeams() {
    if (!teamsOn()) return;
    const ids = P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).map((t) => t[0]);
    const size = (t) => list().filter((p) => p.team === t).length;
    for (const p of list()) if (!ids.includes(p.team)) {
      p.team = "";
    }
    for (const p of list()) if (!p.team) p.team = ids.slice().sort((a, b) => size(a) - size(b))[0];
  }
  const ORDER = ["trivia", "gir"];
  const gameList = () => [...games.values()].map((g, i) => [g, ORDER.includes(g.id) ? ORDER.indexOf(g.id) - 99 : i]).sort((a, b) => a[1] - b[1]).map((x) => x[0]);
  let setupSig = "", setupV = "", setupSent = "", lobbyV = 0, lobbySig = "", lobbySent = -1;
  const fnv = (t) => {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(36);
  };
  const leanPhone = (p) => !!p && p.cap >= 3;
  const allLean = () => {
    for (const p of players.values()) if (!leanPhone(p)) return false;
    return true;
  };
  function lobbyParts() {
    const tt = tx.key === (game ? game.id : "") + "|" + lang ? tx : null;
    const setup = {
      gname: game ? tt ? tt.name : P.f(game.name) : "",
      gen: game ? game.name : "",
      games: tx.lang === lang && tx.games && tx.games.length && tx.games || gameList().map((g) => ({ id: g.id, name: P.f(g.name), e: g.emoji, sub: P.f(g.sub) })),
      schema: game ? tt ? tt.schema : fieldsOf(game) : [],
      strings,
      // (the host's phone sets the game up in steps; players can pick their own language when the game has it)
      steps: game ? tt && tt.steps || stepsOf(game) : null,
      // (a game written in only some languages, like Guess It Right! in English and Arabic: the phones offer only those)
      langs: game && game.langs ? game.langs : null,
      // (a game's own rules for the settings picked, like Guess It Right!'s: each phone shows them in its language)
      howto: game && game.howto ? game.howto(settings) : null
    };
    const sj = JSON.stringify(setup);
    if (sj !== setupSig) {
      setupSig = sj;
      setupV = fnv(sj) + "." + sj.length.toString(36);
    }
    const dyn = {
      k: "lobby",
      phase,
      game: game ? game.id : "",
      players: list().map(pub),
      host,
      settings,
      lang,
      rtl: P.RTL.has(lang),
      mlang: !!(game && game.mlang),
      joinOn: !!joinEl,
      zoom: Math.round(zoom * 100),
      teams: teamsOn(),
      // (the question that's on: a phone that doesn't have it asks for it again)
      qn: phase === "play" && cur.q ? cur.q.n : 0,
      paused: phase === "play" && paused,
      gr: run,
      // (the join code: the host's phone sends it with "Invite players")
      code,
      sv: setupV
    };
    return { setup, dyn };
  }
  function sayLobby(to, again) {
    if (phase === "closed") {
      nearOn();
      return;
    }
    if (!to) nearOn();
    const { setup, dyn } = lobbyParts();
    const dj = JSON.stringify(dyn);
    if (dj !== lobbySig) {
      lobbySig = dj;
      lobbyV++;
    }
    dyn.lv = lobbyV;
    if (to) {
      const p = players.get(to);
      if (!leanPhone(p)) {
        sayTo(to, Object.assign({}, setup, dyn));
        return;
      }
      if (p.sv !== setupV) {
        p.sv = setupV;
        sayTo(to, { k: "setup", sv: setupV, d: setup });
      }
      sayTo(to, dyn);
      return;
    }
    if (!allLean()) {
      setupSent = setupV;
      lobbySent = lobbyV;
      for (const p of players.values()) p.sv = setupV;
      say(Object.assign({}, setup, dyn));
      return;
    }
    if (setupSent !== setupV) {
      setupSent = setupV;
      for (const p of players.values()) p.sv = setupV;
      say({ k: "setup", sv: setupV, d: setup });
    }
    if (lobbySent === lobbyV && !again) return;
    lobbySent = lobbyV;
    say(dyn);
  }
  const lastRes = /* @__PURE__ */ new Map();
  let resN = 0;
  function sayNow(id) {
    if (phase !== "play") return;
    if (cur.q) R.send(cur.q, id).catch(() => {
    });
    const lr = lastRes.get(id);
    if (lr && cur.q && lr.n === cur.q.n) sayTo(id, lr);
  }
  const SND_KINDS = [
    ["music", "Music", "The tunes in the lobby and during the game."],
    ["next", "Next question sound"],
    ["every5", "Every 5 questions sound"],
    ["correct", "Right answer sound"],
    ["wrong", "Wrong answer sound"],
    ["timesup", "Time's up sound"],
    ["tick", "Clock ticks"],
    ["win", "Winner sound"],
    ["fx", "Other sounds"]
  ];
  function sndFields(g) {
    if (!g || !SND.kindOf) return [];
    const have = /* @__PURE__ */ new Set(["tick", "win", "fx"]);
    if (g.sounds) {
      have.add("music");
      for (const n of g.sounds) have.add(SND.kindOf(n));
    }
    if (g.music) {
      for (const v of Object.values(g.music)) if (typeof v === "string") have.add(SND.kindOf(v));
    }
    const VOL = [[1, "Loud"], [0.6, "Medium"], [0.3, "Soft"]];
    const vols = (have.has("music") ? [{ key: "vol_music", label: "Music volume", type: "seg", options: VOL, default: 1, vol: "music" }] : []).concat([{ key: "vol_fx", label: "Sounds volume", type: "seg", options: VOL, default: 1, vol: "fx", desc: "Everything that isn't music: right, wrong, the clock and the rest." }]);
    return vols.concat(SND_KINDS.filter((k) => have.has(k[0])).map(([k, label, desc]) => ({ key: "snd_" + k, label, type: "toggle", default: true, desc, snd: k })));
  }
  const KIT0 = { k_rules: true, k_rulesSec: 12, k_late: true, k_code: false, k_near: true, k_calm: SLOW_SCREEN };
  const kitSaved = () => {
    try {
      const v = JSON.parse(localStorage.getItem("bvplay:kit") || "null");
      if (!v || typeof v !== "object") return {};
      if (v.calmBy !== "host" && v.calmBy !== "auto") delete v.k_calm;
      return v;
    } catch (e) {
      return {};
    }
  };
  let calmBy = (() => {
    try {
      const v = JSON.parse(localStorage.getItem("bvplay:kit") || "null");
      return v && (v.calmBy === "host" || v.calmBy === "auto") ? v.calmBy : "";
    } catch (e) {
      return "";
    }
  })();
  function kitFields(g) {
    if (!g) return [];
    const rl0 = typeof g.rules === "function" ? g.rules(settings || {}) : g.rules;
    const own = (g.settings || []).some((f) => f.key === "rules") || !Array.isArray(rl0) || !rl0.length;
    const out = own ? [] : [
      { key: "k_rules", label: "How to play, first", type: "toggle", default: true, kit: 1, desc: "Before the first question the TV shows how to play, and so does every phone." },
      { key: "k_rulesSec", label: "How long it shows", type: "number", min: 5, max: 120, quick: [8, 12, 20, 30], unit: "seconds", default: 12, kit: 1, when: ["k_rules", true] }
    ];
    return out.concat([
      { key: "k_late", label: "Late players can join", type: "toggle", default: true, kit: 1, desc: "Someone who comes in after the start plays from the next question. Off: they play the next game." },
      { key: "k_code", label: "Show the join code during the game", type: "toggle", default: false, kit: 1, desc: "The QR code and the code stay in a corner of the TV the whole game." },
      { key: "k_near", label: "Phones nearby can find this TV", type: "toggle", default: true, kit: 1, desc: "Phones on the same Wi-Fi see this TV in their list and join with one tap, without typing the code." },
      { key: "k_calm", label: "Calm screen", type: "toggle", default: KIT0.k_calm, kit: 1, desc: "Fewer flashing and moving lights on the TV. Easier on the eyes." }
    ]);
  }
  function applyKit() {
    const calm = !!settings.k_calm;
    if (document.body.classList.contains("calm") !== calm) {
      document.body.classList.toggle("calm", calm);
      document.documentElement.classList.toggle("calm", calm);
      P.still(calm);
    }
    nearOn();
    try {
      const o = {};
      for (const k of Object.keys(KIT0)) if (k in settings) o[k] = settings[k];
      if (calmBy) o.calmBy = calmBy;
      localStorage.setItem("bvplay:kit", JSON.stringify(Object.assign(kitSaved(), o)));
    } catch (e) {
    }
    if (phase === "play") {
      if (settings.k_code) showJoin(true, true);
      else if (joinEl && joinEl.dataset.keep) showJoin(false);
    }
  }
  const fieldsOf = (g) => g ? g.settings.concat(kitFields(g), sndFields(g)) : [];
  function watchSpeed() {
    if (calmBy || settings.k_calm || !window.requestAnimationFrame || document.hidden) return;
    const times = [];
    let last = 0, n = 0;
    const frame = (t) => {
      if (calmBy || settings.k_calm || phase !== "lobby" || document.hidden) return;
      if (last) times.push(t - last);
      last = t;
      if (++n < 150 && t < start2 + 6e3) {
        requestAnimationFrame(frame);
        return;
      }
      if (times.length < 20) return;
      const slow = times.filter((x) => x > 42).length;
      if (slow / times.length > 0.5) {
        calmBy = "auto";
        settings.k_calm = true;
        applyKit();
        if (phase === "lobby") lobby();
        sayLobby();
      }
    };
    let start2 = 0;
    setTimeout(() => {
      if (phase !== "lobby") return;
      requestAnimationFrame((t) => {
        start2 = t;
        last = 0;
        requestAnimationFrame(frame);
      });
    }, 2500);
  }
  function stepsOf(g) {
    if (!g) return null;
    let st = g.steps;
    if (!st) {
      const pages = [];
      let cur2 = ["lang"], w = 1;
      for (const f of g.settings) {
        const cost = f.type === "toggle" ? 0.5 : f.type === "text" ? 1.5 : Array.isArray(f.options) && f.options.length > 6 ? 2 : 1;
        if (w + cost > 3.01 && cur2.length) {
          pages.push(cur2);
          cur2 = [];
          w = 0;
        }
        cur2.push(f.key);
        w += cost;
      }
      if (cur2.length) pages.push(cur2);
      st = pages.map((ks) => {
        const f = g.settings.find((x) => x.key === ks.find((k) => k !== "lang"));
        return { t: "Settings", s: f ? f.label : "Language", keys: ks };
      });
    }
    const kit2 = kitFields(g).map((f) => f.key), snd = sndFields(g).map((f) => f.key);
    return st.concat(kit2.length ? [{ t: "Screen and players", s: "More", keys: kit2 }] : [], snd.length ? [{ t: "Sounds", keys: snd }] : []);
  }
  function applySounds() {
    if (!game || !SND.setOff) return;
    const off = new Set(SND.offKinds());
    for (const f of sndFields(game)) {
      if (settings[f.key] === false) off.add(f.snd);
      else off.delete(f.snd);
    }
    SND.setOff([...off]);
  }
  const tx = { key: "", lang: "", games: null, name: "", schema: null, steps: null };
  function retranslate() {
    return __async(this, null, function* () {
      const want = (game ? game.id : "") + "|" + lang;
      const gl = yield Promise.all(gameList().map((g) => __async(this, null, function* () {
        return { id: g.id, name: yield P.tr(g.name), e: g.emoji, sub: yield P.tr(g.sub) };
      })));
      const optsOf = (f) => game.langOptions && game.langOptions[f.key] ? game.langOptions[f.key](lang, f.options) : f.options;
      const schema = game ? yield Promise.all(fieldsOf(game).map((f) => __async(this, null, function* () {
        return Object.assign({}, f, {
          label: yield P.tr(f.label),
          desc: f.desc ? yield P.tr(f.desc) : void 0,
          unit: f.unit ? yield P.tr(f.unit) : void 0,
          options: f.options ? yield Promise.all(optsOf(f).map((o) => __async(this, null, function* () {
            return o[2] ? [o[0], yield optLabel(o[1]), yield P.tr(o[2])] : [o[0], yield optLabel(o[1])];
          }))) : void 0
        });
      }))) : null;
      const name = game ? yield P.tr(game.name) : "";
      const steps = game ? yield Promise.all(stepsOf(game).map((s) => __async(this, null, function* () {
        return { t: yield P.tr(s.t), s: yield P.tr(s.s || s.t), keys: s.keys };
      }))) : null;
      if (want !== (game ? game.id : "") + "|" + lang) return;
      Object.assign(tx, { key: want, lang, games: gl, name, schema, steps });
      sayLobby();
    });
  }
  function setOne(key, v) {
    return __async(this, null, function* () {
      if (key === "lang") {
        if (I18N.ok(v) && (!game || !game.langs || game.langs.includes(v))) yield setLang(v);
        lobby();
        sayLobby();
        retranslate();
        return;
      }
      const f = game && fieldsOf(game).find((x) => x.key === key);
      if (!f) return;
      if (f.snd) {
        settings[key] = !!v;
        applySounds();
        sayLobby();
        return;
      }
      if (f.vol) {
        const o = f.options.find((x) => String(x[0]) === String(v));
        if (!o) return;
        settings[key] = o[0];
        if (SND.setVol) SND.setVol(f.vol, o[0]);
        sayLobby();
        return;
      }
      if (f.kit) {
        settings[key] = f.type === "toggle" ? !!v : Math.max(f.min || 0, Math.min(f.max || 999, Math.round(+v) || f.default));
        if (key === "k_calm") calmBy = "host";
        applyKit();
        if (phase === "lobby") lobby();
        sayLobby();
        return;
      }
      if (f.type === "toggle") settings[key] = !!v;
      else if (f.type === "multi") {
        const want = (Array.isArray(v) ? v : [v]).map(String);
        const ok = (f.options || []).filter((o) => want.includes(String(o[0]))).map((o) => o[0]);
        if (!ok.length) return;
        settings[key] = ok;
      } else if (f.options && f.options.some((o) => String(o[0]) === String(v))) settings[key] = f.options.find((o) => String(o[0]) === String(v))[0];
      else if (f.type === "text") settings[key] = String(v == null ? "" : v).split(/\n/).map((x) => P.safe(x, 90)).filter(Boolean).join("\n").slice(0, 1500);
      else if (f.type === "number") {
        const n = Math.round(Number(v));
        if (!Number.isFinite(n)) return;
        settings[key] = Math.max(f.min || 0, Math.min(f.max || 999, n));
      }
      if (key === "teams" || key === "teamN" || key === "mode" && game.teamsForce) balanceTeams();
      lobby();
      sayLobby();
    });
  }
  function choose(id) {
    game = games.get(id);
    settings = {};
    for (const f of game.settings) settings[f.key] = f.default;
    for (const f of sndFields(game)) settings[f.key] = f.vol ? SND.vol ? SND.vol(f.vol) : 1 : !SND.kindOff(f.snd);
    const ks = kitSaved();
    for (const f of kitFields(game)) settings[f.key] = f.key in ks ? ks[f.key] : f.default;
    applyKit();
    phase = "lobby";
    if (game.langs && !game.langs.includes(lang)) {
      const to = game.langs.includes("en") ? "en" : game.langs[0];
      for (const p of players.values()) if (p.lang && !game.langs.includes(p.lang)) p.lang = "";
      setLang(to).then(() => {
        if (game && game.id === id) {
          lobby();
          sayLobby();
          retranslate();
        }
      }).catch(() => {
      });
    }
    if (game.langs) {
      for (const p of players.values()) if (p.lang && !game.langs.includes(p.lang)) p.lang = "";
    }
    try {
      history.replaceState(history.state, "", "#" + id + (lang !== "en" ? "." + lang : ""));
    } catch (e) {
    }
    lobby();
    sayLobby();
    retranslate();
  }
  function top(parent2, title, sub, right) {
    const t = el("header", "top", parent2);
    const lg = el("div", "logo", t);
    const im = el("img", "", lg);
    im.alt = "";
    if (game && ICONS.has(game.id)) {
      im.src = iconOf(game.id);
      lg.classList.add("gi");
    } else im.src = P.booUri("boo:party");
    const d = el("div", "grow", t);
    el("h1", "", d, title);
    if (sub) el("div", "sub", d, sub);
    if (right) for (const r of [].concat(right)) t.appendChild(r);
    return t;
  }
  const ZK = "bvplay:zoom", ZMIN = 0.6, ZMAX = 1.5;
  let zoom = 1, zoomTip = null, zoomT = 0;
  const zoomSubs = /* @__PURE__ */ new Set();
  try {
    const z = +localStorage.getItem(ZK);
    if (z) zoom = z;
  } catch (e) {
  }
  function setZoom(z, show) {
    zoom = Math.round(Math.min(ZMAX, Math.max(ZMIN, z)) * 10) / 10;
    document.documentElement.style.setProperty("--z", String(zoom));
    document.documentElement.classList.toggle("zoomed", zoom > 1);
    try {
      localStorage.setItem(ZK, String(zoom));
    } catch (e) {
    }
    for (const f of zoomSubs) {
      try {
        f();
      } catch (e) {
      }
    }
    if (show) {
      if (!zoomTip) zoomTip = el("div", "zm-tip", document.body);
      zoomTip.textContent = "🔍 " + Math.round(zoom * 100) + "%";
      zoomTip.classList.add("on");
      clearTimeout(zoomT);
      zoomT = setTimeout(() => zoomTip.classList.remove("on"), 1400);
    }
  }
  const zoomBy = (d) => setZoom(d ? zoom + d * 0.1 : 1, true);
  setZoom(zoom, false);
  addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      zoomBy(1);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      zoomBy(-1);
    } else if (e.key === "0") {
      e.preventDefault();
      zoomBy(0);
    }
  }, true);
  let wheelSum = 0;
  addEventListener("wheel", (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    wheelSum += e.deltaY;
    if (Math.abs(wheelSum) >= 60) {
      zoomBy(wheelSum < 0 ? 1 : -1);
      wheelSum = 0;
    }
  }, { passive: false });
  addEventListener("message", (e) => {
    const m = e.data;
    if (e.source === parent && parent !== window && m && typeof m.bvZoom === "number") zoomBy(Math.sign(m.bvZoom));
  });
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;
  const canFs = () => !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  let fsPaint = null;
  function fullScreen(on2) {
    try {
      if (on2 === void 0) on2 = !fsEl();
      const d = document.documentElement;
      if (on2 && !fsEl()) {
        const p = d.requestFullscreen ? d.requestFullscreen({ navigationUI: "hide" }) : d.webkitRequestFullscreen ? d.webkitRequestFullscreen() : null;
        if (p && p.catch) p.catch(() => {
        });
      } else if (!on2 && fsEl()) {
        const p = document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen ? document.webkitExitFullscreen() : null;
        if (p && p.catch) p.catch(() => {
        });
      }
    } catch (e) {
    }
  }
  if (IS_TV) {
    const first = () => {
      removeEventListener("pointerdown", first, true);
      removeEventListener("keydown", first, true);
      fullScreen(true);
    };
    addEventListener("pointerdown", first, true);
    addEventListener("keydown", first, true);
    fullScreen(true);
  }
  addEventListener("dblclick", (e) => {
    if (e.target && e.target.closest && e.target.closest("button, a, input, select")) return;
    fullScreen();
  });
  addEventListener("keydown", (e) => {
    if ((e.key === "f" || e.key === "F") && !e.ctrlKey && !e.metaKey && !e.altKey && !(e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))) fullScreen();
  });
  for (const ev of ["fullscreenchange", "webkitfullscreenchange"]) document.addEventListener(ev, () => {
    if (fsPaint) fsPaint();
    requestAnimationFrame(() => fitLobby());
  });
  const back = { on: false, dlg: null, going: false, said: false, t: 0 };
  const busy = () => !!R && phase !== "closed" && (phase === "play" || list().length > 0);
  function armBack() {
    if (back.on || back.going || phase === "closed") return;
    if (history.state && history.state.bvBack) {
      back.on = true;
      return;
    }
    const ua = navigator.userActivation;
    if (ua && !ua.hasBeenActive) return;
    try {
      history.pushState({ bvBack: 1 }, "", location.href);
      back.on = true;
    } catch (e) {
    }
  }
  for (const ev of ["pointerup", "keydown", "click"]) addEventListener(ev, armBack, true);
  addEventListener("popstate", (e) => {
    if (e.state && e.state.bvBack) {
      back.on = true;
      return;
    }
    if (!back.on) return;
    back.on = false;
    if (back.going) return;
    if (game) {
      const h = "#" + game.id + (lang !== "en" ? "." + lang : "");
      if (location.hash !== h) {
        try {
          history.replaceState(history.state, "", h);
        } catch (e2) {
        }
      }
    }
    if (busy()) askLeave();
    else history.back();
  });
  function askLeave() {
    return __async(this, null, function* () {
      if (back.dlg) return;
      const t = yield Promise.all(["Leave the game?", "If you leave, the game closes for everyone.", "Keep playing", "Leave"].map((x) => P.tr(x)));
      if (back.dlg || back.going) return;
      if (!busy()) {
        history.back();
        return;
      }
      const ov = el("div", "leave-ov", document.body);
      ov.setAttribute("role", "dialog");
      ov.setAttribute("aria-modal", "true");
      ov.setAttribute("aria-label", t[0]);
      const card = el("div", "leave-card", ov);
      const im = el("img", "leave-boo", card);
      im.src = P.booUri("boo:sad") || P.booUri("boo:hi");
      im.alt = "";
      el("h2", "", card, t[0]);
      el("p", "", card, t[1]);
      const row = el("div", "leave-row", card);
      const stay = el("button", "leave-btn stay", row, t[2]);
      stay.type = "button";
      const go = el("button", "leave-btn go", row, t[3]);
      go.type = "button";
      back.dlg = ov;
      const close = () => {
        clearTimeout(back.t);
        removeEventListener("keydown", keys, true);
        ov.remove();
        if (back.dlg === ov) back.dlg = null;
      };
      const keys = (e) => {
        const k = e.key, c = e.keyCode;
        if (/^Arrow/.test(k) || k === "Tab") {
          e.preventDefault();
          e.stopPropagation();
          (document.activeElement === stay ? go : stay).focus();
        } else if (k === "Escape" || k === "Backspace" || k === "GoBack" || k === "BrowserBack" || k === "XF86Back" || c === 461 || c === 10009) {
          e.preventDefault();
          e.stopPropagation();
          close();
          armBack();
        }
      };
      addEventListener("keydown", keys, true);
      stay.onclick = () => {
        close();
        armBack();
      };
      go.onclick = () => {
        close();
        leaveNow();
      };
      ov.addEventListener("click", (e) => {
        if (e.target === ov) stay.onclick();
      });
      stay.focus();
      back.t = setTimeout(() => {
        if (back.dlg === ov) stay.onclick();
      }, 3e4);
    });
  }
  function leaveNow() {
    return __async(this, null, function* () {
      back.going = true;
      if (R && !back.said) {
        back.said = true;
        try {
          yield Promise.race([R.send({ k: "closed" }), sleep(900)]);
        } catch (e) {
        }
      }
      const here = location.href;
      try {
        history.back();
      } catch (e) {
      }
      setTimeout(() => {
        if (location.href === here && document.visibilityState !== "hidden") closedScreen();
      }, 700);
    });
  }
  function castFromHere(gid) {
    return __async(this, null, function* () {
      const c = L.shortCode(6);
      const url = L.PLAY + "#" + (gid || "trivia") + "." + lang + "." + c;
      let conn = null;
      try {
        conn = yield L.cast(url);
      } catch (e) {
        const t = el("div", "zm-tip on", document.body, "📡 " + (yield P.tr(e && e.message ? e.message : "Casting didn't start. Try again.")));
        setTimeout(() => t.remove(), 5e3);
        return;
      }
      if (!conn) return;
      back.going = true;
      if (R && !back.said) {
        back.said = true;
        try {
          R.send({ k: "closed" }).catch(() => {
          });
        } catch (e) {
        }
      }
      yield closedScreen();
      const ov = el("div", "cast-ov", document.body);
      const bar = el("div", "cast-bar", ov);
      el("b", "", bar, "📡 " + (yield P.tr("The game is on your TV. Play here:")));
      const stop = el("button", "leave-btn", bar, yield P.tr("Stop casting"));
      stop.type = "button";
      const f = el("iframe", "cast-phone", ov);
      f.title = "Blokvane Games";
      f.allow = "camera; clipboard-write; screen-wake-lock; web-share";
      f.src = GO + "games.html#join." + c;
      const end = () => {
        try {
          conn.terminate();
        } catch (e) {
        }
        location.reload();
      };
      stop.onclick = end;
      try {
        conn.onterminate = () => location.reload();
      } catch (e) {
      }
    });
  }
  function closedScreen() {
    return __async(this, null, function* () {
      run++;
      lobbyRun++;
      unpause();
      abandonTimers();
      phase = "closed";
      nearOn();
      handlers.clear();
      playerSubs.clear();
      pauseSubs.clear();
      for (const w of [...pending.values()]) w.finish();
      cur.q = null;
      waitHost = false;
      if (joinEl) {
        joinEl.remove();
        joinEl = null;
      }
      if (hintEl) hintEl.hidden = true;
      if (booEl) booEl.hidden = true;
      SND.music(null, { fadeOut: 1 });
      P.mute(true);
      document.body.dataset.game = "";
      delete document.body.dataset.tlook;
      delete document.body.dataset.wlook;
      delete document.body.dataset.bwlook;
      document.body.classList.remove("tw-on");
      const t = yield Promise.all(["The game is closed", "Thanks for playing!", "Start a new game"].map((x) => P.tr(x)));
      stage.textContent = "";
      const cv = el("div", "cover closed", stage);
      const box2 = el("div", "cl-box", cv);
      const im = el("img", "cl-boo", box2);
      im.src = P.booUri("boo:love") || P.booUri("boo:hi");
      im.alt = "";
      el("h1", "", box2, t[0]);
      el("p", "", box2, t[1]);
      const b = el("button", "leave-btn stay", box2, t[2]);
      b.type = "button";
      b.onclick = () => {
        back.going = true;
        location.reload();
      };
      b.focus();
    });
  }
  addEventListener("pagehide", (e) => {
    if (!e.persisted && R && !back.said && phase !== "closed") {
      back.said = true;
      try {
        R.send({ k: "closed" }).catch(() => {
        });
      } catch (e2) {
      }
    }
  });
  addEventListener("beforeunload", (e) => {
    if (back.going || back.dlg || !busy()) return;
    e.preventDefault();
    e.returnValue = "";
  });
  const SND = window.BVSOUND || { preload() {
  }, music() {
  }, sting() {
  }, fx() {
  }, unlock() {
  }, setOn() {
  }, enabled: () => false, state: () => "none", onChange: () => () => {
  } };
  let sndOff = null;
  let hintEl = null, hintRun = 0;
  function soundHint() {
    return __async(this, null, function* () {
      const my = ++hintRun;
      const show = !!(game && game.sounds) && SND.state() === "locked" && phase !== "end";
      if (!show) {
        if (hintEl) hintEl.hidden = true;
        return;
      }
      const text = "🔈 " + (yield P.tr("Click anywhere on this screen to turn on the sound"));
      if (my !== hintRun) return;
      if (!hintEl) {
        hintEl = el("button", "snd-hint", document.body);
        hintEl.type = "button";
        hintEl.dataset.snd = "1";
        hintEl.onclick = () => SND.unlock();
      }
      hintEl.textContent = text;
      hintEl.hidden = false;
    });
  }
  SND.onChange(() => soundHint());
  let lobbyRun = 0, lastSpot = "", played = false;
  const seen = /* @__PURE__ */ new Set();
  function lobby() {
    return __async(this, null, function* () {
      const my = ++lobbyRun;
      const page = document.createElement("div");
      const g = game;
      const T = (t2, v) => P.tr(t2, v);
      const LET = I18N.letters(lang);
      const t = top(page, yield T(g ? g.name : "Party games"), yield T(g ? g.sub : "Scan the code to join. The host scans first and picks the game."));
      t.classList.add("lob-top");
      const deco = el("div", "deco", t);
      const dk = g && g.deco ? g.deco : "letters";
      if (dk === "letters") LET.slice(0, 4).forEach((x, i) => {
        const d = el("span", "tile-l " + "ABCD"[i], deco, x);
      });
      else for (const x of (dk.match(BVRX.pictoSeq("g")) || []).slice(0, 4)) el("span", "tile-e", deco, x);
      if (g && g.lobbyTop) {
        try {
          g.lobbyTop(t, el);
        } catch (e) {
        }
      }
      const body = el("div", "body lob", page);
      const crowd = list().length > 8;
      body.classList.toggle("crowd", crowd);
      const left = el("div", "col lob-l", body);
      const jc = el("div", "card join", left);
      const q = el("div", "qr", jc);
      try {
        q.appendChild(BVQR.svgOf(linkNow(), { border: 1 }));
      } catch (e) {
      }
      const jt = el("div", "jt", jc);
      const s1 = el("div", "stp", jt);
      el("span", "n", s1, "1");
      el("b", "", s1, yield T("Scan with your camera"));
      el("div", "muted or", jt, yield T("or open Blokvane and type"));
      const ct = el("div", "codetiles", jt);
      ct.setAttribute("aria-label", code);
      for (const ch of code) el("span", "", ct, ch);
      const two = el("div", "steps2", crowd ? null : left);
      const st2 = el("div", "card stp-c", two);
      const s2 = el("div", "stp", st2);
      el("span", "n", s2, "2");
      el("b", "", s2, yield T("Name + selfie"));
      el("p", "", st2, yield T("Take a photo or pick a Boo, then tap Ready."));
      const st3 = el("div", "card stp-c", two);
      const step = g && g.step ? g.step : ["Pick a game", "A Blokvane member scans first: they host and pick the game."];
      const s3 = el("div", "stp", st3);
      el("span", "n", s3, "3");
      el("b", "", s3, yield T(step[0], { letters: LET.slice(0, 4).join(" ") }));
      el("p", "", st3, yield T(step[1]));
      const right = el("div", "col grow lob-r", body);
      const ps = list();
      const head = el("div", "ph", right);
      el("h2", "", head, ps.length ? yield T(ps.length === 1 ? "1 player" : "{n} players", { n: ps.length }) : yield T("Waiting for players..."));
      const hp = players.get(host);
      if (hp) el("div", "pill", head, "⭐ " + (yield T("Host: {name}", { name: hp.name })));
      else el("div", "pill wait-host", head, yield T("The host signs in with Blokvane on their phone. Everyone else just joins."));
      const grid = el("div", "slots fit", right);
      for (const p of ps) {
        const c2 = el("div", "seat" + (seen.has(p.id) ? " still" : ""), grid);
        seen.add(p.id);
        c2.style.setProperty("--pc", p.color);
        const av = el("div", "av", c2);
        const im = el("img", "", av);
        im.src = avatarUrl(p);
        im.alt = "";
        if (p.ready || p.id === host) {
          el("span", "ok", av, "✓");
          c2.classList.add("rd");
        }
        if (p.lang && g && g.mlang) {
          const lg = el("span", "lg", av, p.lang.toUpperCase());
          lg.title = (I18N.LANGS.find((x) => x[0] === p.lang) || [0, ""])[1];
        }
        el("b", "", c2, p.name);
        if (p.team && teamsOn()) {
          const tm = P.TEAMS.find((x) => x[0] === p.team);
          if (tm) {
            const tb = el("small", "team", c2, yield T(tm[1]));
            tb.style.color = tm[2];
            c2.style.setProperty("--tc", tm[2]);
            c2.classList.add("tm");
          }
        }
      }
      const joinWord = yield T("join");
      for (let i = 0; i < 12; i++) {
        const e = el("div", "seat empty", grid);
        if (i < 2) el("span", "", e, joinWord);
      }
      if (g && g.lobbyCard === false) {
      } else if (g && g.spot) {
        body.classList.add("has-spot");
        yield spotCard(crowd ? left : right, g.spot(settings));
      } else if (g) {
        const ex = el("div", "lob-x", crowd ? left : right);
        if (g.helpers) {
          el("div", "lbl", ex, yield T("4 helpers · each works once"));
          const chips = el("div", "chips", ex);
          for (const h of g.helpers) el("span", "chip", chips, yield T(h));
        } else if (g.rules && (typeof g.rules === "function" || g.rules.length)) {
          const rl = typeof g.rules === "function" ? g.rules(settings) : g.rules;
          el("div", "lbl", ex, yield T("How to play"));
          const ol = el("ol", "howto2", ex);
          for (const r of rl) el("li", "", ol, yield T(r));
        }
      }
      const ft = el("div", "lob-foot", page);
      const fl = el("div", "lf", ft);
      el("b", "", fl, g ? yield T(hp ? "The host starts the game from their phone." : "Waiting for the host.") : yield T("Made by Blokvane. Nothing to install: everyone plays from their own phone."));
      const sw = { locked: "🔈 " + (yield T("Click for sound")), on: "🔊 " + (yield T("Sound on")), off: "🔇 " + (yield T("Sound off")) };
      const sb = el("button", "snd", fl);
      sb.type = "button";
      sb.dataset.snd = "1";
      const paint = () => {
        const st = SND.state();
        sb.hidden = st === "none";
        sb.textContent = sw[st] || "";
        sb.classList.toggle("off", st !== "on");
      };
      sb.onclick = () => {
        const st = SND.state();
        if (st === "locked") SND.unlock();
        else SND.setOn(st !== "on");
      };
      paint();
      const zs = el("span", "zm", fl);
      zs.title = yield T("Screen size");
      const zb = (t2, lab, d) => __async(this, null, function* () {
        const b = el("button", "", zs, t2);
        b.type = "button";
        b.setAttribute("aria-label", yield T(lab));
        b.onclick = () => zoomBy(d);
      });
      yield zb("A−", "Smaller", -1);
      const zv = el("span", "zv", zs);
      yield zb("A+", "Bigger", 1);
      const zpaint = () => {
        zv.textContent = Math.round(zoom * 100) + "%";
      };
      zpaint();
      zoomSubs.clear();
      zoomSubs.add(zpaint);
      zoomSubs.add(() => requestAnimationFrame(fitLobby));
      const fsb = el("button", "fs", fl);
      fsb.type = "button";
      const fsT = { on: "⛶ " + (yield T("Exit full screen")), off: "⛶ " + (yield T("Full screen")) };
      fsb.onclick = () => fullScreen();
      const fpaint = () => {
        if (!fsb.isConnected && fsb.parentNode !== fl) return;
        fsb.hidden = !canFs();
        fsb.textContent = fsEl() ? fsT.on : fsT.off;
      };
      fpaint();
      fsPaint = fpaint;
      if (!IS_TV && (!EMBEDDED || IN_EXT) && !list().length) {
        const gid = g ? g.id : "";
        const here = gid + "." + lang;
        if (!EMBEDDED && L.canCast && L.canCast()) {
          const cb = el("button", "fs cast", fl, "📡 " + (yield T("Cast to a TV")));
          cb.type = "button";
          cb.onclick = () => castFromHere(gid);
        }
        const db = el("button", "fs duo", fl, "🎮 " + (yield T("Play here too")));
        db.type = "button";
        db.title = yield T("The game and your own answers, side by side on this screen.");
        db.onclick = () => {
          back.going = true;
          back.said = true;
          try {
            R.send({ k: "closed" }).catch(() => {
            });
          } catch (e) {
          }
          location.href = "duo.html#" + here;
        };
      }
      const c = g && (typeof g.credit === "function" ? g.credit(lang) : g.credit);
      if (c) el("small", "", ft, P.f(c));
      if (my !== lobbyRun || phase === "play") return;
      stage.textContent = "";
      document.body.dataset.game = g ? g.id : "";
      delete document.body.dataset.tlook;
      delete document.body.dataset.wlook;
      delete document.body.dataset.bwlook;
      document.body.classList.remove("tw-on");
      stage.append(...page.childNodes);
      if (g && g.lobbyDone) {
        try {
          g.lobbyDone(stage, el, settings);
        } catch (e) {
          console.warn("Blokvane play", e);
        }
      }
      if (sndOff) sndOff();
      sndOff = SND.onChange(paint);
      soundHint();
      if (g && g.sounds) {
        SND.preload(g.sounds);
        SND.music(g.music ? played ? g.music.again : g.music.lobby : "theme", { fadeIn: 1.5 });
      } else SND.music(null);
      if (g && g.prep) {
        try {
          g.prep(lang);
        } catch (e) {
        }
      }
      fitLobby();
      requestAnimationFrame(fitLobby);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLobby).catch(() => {
      });
      if (!speedSeen) {
        speedSeen = true;
        watchSpeed();
      }
    });
  }
  let speedSeen = false;
  function inner(g2) {
    const cs = getComputedStyle(g2), n = (v) => parseFloat(v) || 0;
    return [g2.clientWidth - n(cs.paddingLeft) - n(cs.paddingRight), g2.clientHeight - n(cs.paddingTop) - n(cs.paddingBottom)];
  }
  function fitLobby() {
    const grid = stage.querySelector(".slots.fit");
    if (!grid || !grid.isConnected || phase === "play") return;
    if (stage.querySelector(".body.lob.crowd")) return fitCrowd(grid);
    const card = stage.querySelector(".spot");
    const seats = [...grid.children], n = seats.filter((s2) => !s2.classList.contains("empty")).length;
    const empties = seats.filter((s2) => s2.classList.contains("empty"));
    const want = Math.max(n < 40 ? n + 1 : n, card ? 4 : 8);
    const u = stage.clientHeight / 100 * zoom, gap = (game && game.seatGap || 1.6) * u, ratio = card ? game && game.seatRatioCard || 0.92 : game && game.seatRatio || 1.05;
    const LV = ["s1", "s2", "s3", "s4"];
    if (card) card.classList.remove(...LV);
    grid.style.cssText = "";
    for (const e of empties) e.hidden = true;
    let best = null;
    for (let lv = 0; ; lv++) {
      const [W, H] = inner(grid);
      best = null;
      for (let c = 2; c <= 10; c++) {
        const r = Math.ceil(want / c);
        const cw = (W - (c - 1) * gap) / c, ch = (H - (r - 1) * gap) / r;
        const s2 = Math.min(cw, ch / ratio);
        if (!best || s2 > best.s + 0.5) best = { c, r, s: s2, ch };
      }
      if (!card || best.s >= 8 * u || lv >= LV.length) break;
      card.classList.add(LV[lv]);
    }
    const s = Math.max(3.5 * u, Math.floor(best.s + 0.01));
    grid.style.setProperty("--ss", s + "px");
    grid.style.gridTemplateColumns = "repeat(" + best.c + ", " + s + "px)";
    grid.style.gridAutoRows = Math.max(3.5 * u, Math.floor(Math.min(best.ch, s * ratio) + 0.01)) + "px";
    grid.style.gap = gap + "px";
    const free = Math.max(0, best.c * Math.ceil(want / best.c) - n);
    empties.forEach((e, i) => {
      e.hidden = i >= free;
      e.classList.toggle("r2", n + i >= best.c);
    });
    seated(grid);
  }
  function fitCrowd(grid) {
    const card = stage.querySelector(".lob-l > .spot, .lob-l > .lob-x");
    const LV = ["s1", "s2", "s3", "s4"];
    if (card) {
      card.classList.remove(...LV);
      const col = card.parentElement;
      for (const k of LV) {
        if (col.scrollHeight <= col.clientHeight + 1) break;
        card.classList.add(k);
      }
    }
    const seats = [...grid.children], n = seats.filter((x) => !x.classList.contains("empty")).length;
    const empties = seats.filter((x) => x.classList.contains("empty"));
    const want = n < 40 ? n + 1 : n;
    const u = stage.clientHeight / 100 * zoom, gap = 1.4 * u, ratio = 1.05;
    grid.style.cssText = "";
    grid.classList.remove("chips");
    for (const e of empties) e.hidden = true;
    const [W, H] = inner(grid);
    let best = null;
    for (let c = 2; c <= 10; c++) {
      const r = Math.ceil(want / c), cw = (W - (c - 1) * gap) / c, ch = (H - (r - 1) * gap) / r, sz = Math.min(cw, ch / ratio);
      if (!best || sz > best.s + 0.5) best = { c, r, s: sz, ch };
    }
    let cols, rowH, free;
    if (best.s >= 11 * u) {
      const sz = Math.floor(best.s);
      grid.style.setProperty("--ss", sz + "px");
      cols = "repeat(" + best.c + ", " + sz + "px)";
      rowH = Math.floor(Math.min(best.ch, sz * ratio));
      free = best.c * Math.ceil(want / best.c) - n;
    } else {
      let pick = null;
      for (let c = 2; c <= 6; c++) {
        const r = Math.ceil(want / c), w = (W - (c - 1) * gap) / c, h = Math.min(7.5 * u, (H - (r - 1) * gap) / r);
        const q = Math.min(h, (w - 1.3 * h) / 3.2);
        if (!pick || q > pick.q + 0.5) pick = { c, r, h, w, q };
      }
      grid.classList.add("chips");
      grid.style.setProperty("--ch", Math.floor(pick.h) + "px");
      cols = "repeat(" + pick.c + ", minmax(0, 1fr))";
      rowH = Math.floor(pick.h);
      free = Math.min(1, 40 - n);
    }
    grid.style.gridTemplateColumns = cols;
    grid.style.gridAutoRows = Math.max(3 * u, rowH) + "px";
    grid.style.gap = gap + "px";
    empties.forEach((e, i) => {
      e.hidden = i >= free;
    });
    seated(grid);
  }
  function seated(grid) {
    if (game && game.seated) {
      try {
        game.seated(grid);
      } catch (e) {
      }
    }
  }
  addEventListener("resize", () => {
    if (phase !== "play") requestAnimationFrame(fitLobby);
  });
  function spotCard(parent2, sp) {
    return __async(this, null, function* () {
      const T = (t, v) => P.tr(t, v);
      const c = el("div", "spot", parent2);
      const key = game.id + "|" + sp.key;
      if (key !== lastSpot) c.classList.add("fresh");
      lastSpot = key;
      const hd = el("div", "spot-top", c);
      el("div", "spot-ic", hd, sp.icon).setAttribute("aria-hidden", "true");
      const tx2 = el("div", "spot-t", hd);
      el("span", "caps", tx2, yield T(sp.label));
      el("b", "", tx2, yield T(sp.name));
      el("p", "", tx2, yield T(sp.desc));
      const facts = el("div", "spot-f", c);
      for (const [ic, t2, v] of sp.facts) el("span", "", facts, ic + " " + (yield optLabel2(t2, v)));
      const bl = el("div", "spot-b", c);
      for (const [ic, t2] of sp.bullets) {
        const d = el("div", "", bl);
        el("i", "", d, ic).setAttribute("aria-hidden", "true");
        el("span", "", d, yield T(t2, sp.vars));
      }
    });
  }
  const optLabel2 = (t, v) => v ? P.tr(t, v) : optLabel(t);
  function credit(g) {
    const c = g && (typeof g.credit === "function" ? g.credit(lang) : g.credit);
    if (c) el("div", "credit", stage, P.f(c));
  }
  function optLabel(t) {
    const x = String(t);
    let m = /^(\d+(?:\.\d+)?) s$/.exec(x);
    if (m) return P.tr("{n} s", { n: m[1] });
    m = /^(\d+(?:\.\d+)?) min$/.exec(x);
    if (m) return P.tr("{n} min", { n: m[1] });
    m = /^(\S+) (.+)$/.exec(x);
    if (m && !/[A-Za-z0-9]/.test(m[1]) && /[\u2190-\u2bff\ud83c-\ud83e]/.test(m[1])) return P.tr(m[2]).then((t2) => m[1] + " " + t2);
    return P.tr(x);
  }
  function board(parent2, o = {}) {
    const b = el("div", "board", parent2);
    el("h2", "", b, o.title || P.f("Scoreboard"));
    const rows = /* @__PURE__ */ new Map();
    const draw = (answered) => {
      const ps = list().slice().sort((a, b2) => b2.score - a.score || a.out - b2.out);
      const max = Math.max(1, ...ps.map((p) => p.score));
      ps.forEach((p, i) => {
        let r = rows.get(p.id);
        if (!r) {
          r = el("div", "row", b);
          const bar = el("i", "bar", r);
          const im = el("img", "", r);
          im.alt = "";
          const nm = el("b", "", r);
          const h = el("span", "hearts", r);
          const pts = el("span", "pts", r);
          r._bar = bar;
          r._pts = pts;
          r._h = h;
          r._im = im;
          r._nm = nm;
          rows.set(p.id, r);
        }
        const pic = avatarUrl(p);
        if (r._pic !== pic) {
          r._pic = pic;
          r._im.src = pic;
        }
        if (r._nm.textContent !== p.name) r._nm.textContent = p.name;
        r.style.order = String(i);
        r._bar.style.width = 100 * p.score / max + "%";
        r._pts.textContent = String(p.score);
        r._h.textContent = o.lives ? "❤️".repeat(Math.max(0, p.lives)) : "";
        r.classList.toggle("out", !!p.out);
        r.classList.toggle("answered", !!(answered && answered.has(p.id)));
      });
      b.style.display = "flex";
    };
    draw();
    return { node: b, draw };
  }
  function ring(parent2, sec, idle) {
    const r = el("div", "ring", parent2);
    r.innerHTML = '<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><span></span>';
    const fg = r.querySelector(".fg"), n = r.querySelector("span");
    let left = sec, t = 0, stopped = false;
    const tick = () => {
      if (left < sec && !r.isConnected) {
        clearInterval(t);
        return;
      }
      if (paused) return;
      n.textContent = String(Math.max(0, left));
      fg.style.strokeDashoffset = String(276.5 * (1 - Math.max(0, left) / sec));
      if (left <= 3 && left > 0) P.sfx("tick");
      left--;
      if (left < -1) clearInterval(t);
    };
    const go = () => {
      if (t || stopped || !(sec > 0)) return;
      tick();
      t = setInterval(tick, 1e3);
    };
    if (!(sec > 0)) r.hidden = true;
    else if (idle) n.textContent = String(sec);
    else go();
    return { node: r, go, stop: () => {
      stopped = true;
      clearInterval(t);
      r.classList.add("done");
    } };
  }
  let booEl = null;
  function boo(mood) {
    if (mood === false) {
      if (booEl) booEl.hidden = true;
      return;
    }
    if (!booEl || !booEl.isConnected) {
      booEl = el("div", "boo", document.body);
      el("img", "", booEl).alt = "";
    }
    const slot = stage.querySelector(".boo-slot");
    if (slot) {
      const r = slot.getBoundingClientRect(), z = Math.round(r.width * 0.92);
      booEl.style.cssText = "left:" + Math.round(r.left + (r.width - z) / 2) + "px;top:" + Math.round(r.top + (r.height - z) / 2) + "px;width:" + z + "px;height:" + z + "px;right:auto;bottom:auto";
      booEl.dataset.slot = "1";
    } else if (booEl.dataset.slot) {
      booEl.style.cssText = "";
      delete booEl.dataset.slot;
    }
    booEl.hidden = false;
    const id = { happy: "boo:party", sad: "boo:sad", wow: "boo:wow", laugh: "boo:laugh", scary: "boo:scary", cool: "boo:cool", hi: "boo:hi", love: "boo:love", mind: "boo:mind" }[mood] || "boo:hi";
    booEl.firstChild.src = P.booUri(id);
    booEl.animate([{ transform: "scale(.6) translateY(18%)" }, { transform: "scale(1.1)" }, { transform: "scale(1)" }], { duration: 600, easing: "cubic-bezier(.2,1.4,.4,1)" });
  }
  const cur = { q: null };
  function ask(o) {
    const n = ++round;
    const all = new Set((o.who || [...players.values()].filter((p) => !p.out).map((p) => p.id)).filter((id) => players.has(id)));
    const who = new Set([...all].filter((id) => !players.get(id).away));
    const q = { k: "q", n, gr: run, kind: o.kind || "choice", prompt: o.prompt || "", opts: o.opts || [], sec: o.sec || 0, extra: o.extra || null, who: [...all] };
    if (o.extra && o.extra.helpOnly) {
      for (const id of who) sayTo(id, q);
    } else {
      cur.q = q;
      say(q);
    }
    return new Promise((res) => {
      const w = { who, all, got: /* @__PURE__ */ new Map(), done: false, onAns: o.onAns, sec: o.sec || 0, at: Date.now(), q };
      let cancel = () => {
      };
      w.finish = () => {
        if (w.done) return;
        w.done = true;
        cancel();
        pending.delete(n);
        res(w.got);
      };
      pending.set(n, w);
      cancel = o.sec ? pafter(w.finish, o.sec * 1e3 + 1500) : o.open ? () => {
      } : pafter(w.finish, 12e4);
      if (!who.size) w.finish();
    });
  }
  function wait(text, extra) {
    const m = { k: "q", n: ++round, gr: run, kind: "wait", prompt: text || strings.look, extra: extra || null, who: [] };
    cur.q = m;
    say(m);
  }
  function result(id, r) {
    const m = Object.assign({ k: "res", n: round }, r);
    if (!r.end) {
      lastRes.set(id, m);
      resN = round;
    }
    sayTo(id, m);
  }
  const on = (k, fn) => {
    handlers.set(k, fn);
    return () => handlers.delete(k);
  };
  let run = 0;
  function start() {
    return __async(this, null, function* () {
      const my = ++run;
      lastRes.clear();
      resN = 0;
      P.mute(false);
      phase = "play";
      played = true;
      document.body.dataset.game = game.id;
      delete document.body.dataset.tlook;
      delete document.body.dataset.wlook;
      delete document.body.dataset.bwlook;
      document.body.classList.remove("tw-on");
      for (const p of players.values()) {
        p.score = 0;
        p.right = 0;
        p.lives = +settings.lives || 3;
        p.out = false;
        p.streak = 0;
        p.helpers = {};
      }
      balanceTeams();
      sayLobby();
      if (!game.sounds) SND.music(null, { fadeOut: 2 });
      stage.textContent = "";
      const cv = el("div", "cover", stage);
      const cd = el("div", "cd", cv);
      if (ICONS.has(game.id)) {
        const gi = el("img", "cd-gi", cd);
        gi.src = iconOf(game.id);
        gi.alt = "";
      }
      const n = el("div", "big", cd, "3");
      for (const x of ["3", "2", "1"]) {
        n.textContent = x;
        P.sfx("tick");
        yield sleep(800);
        if (my !== run) return;
      }
      if (settings.k_code) showJoin(true, true);
      if (settings.k_rules && kitFields(game).some((f) => f.key === "k_rules")) {
        yield kitRules(my);
        if (my !== run) return;
      }
      handlers.clear();
      playerSubs.clear();
      pauseSubs.clear();
      let ranking = null;
      try {
        ranking = yield game.tv(kit(my));
      } catch (e) {
        console.warn("Blokvane play", e);
      }
      if (my !== run) return;
      unpause();
      handlers.clear();
      playerSubs.clear();
      pauseSubs.clear();
      finish(ranking);
    });
  }
  function stopGame() {
    if (phase !== "play") return;
    run++;
    unpause();
    handlers.clear();
    playerSubs.clear();
    pauseSubs.clear();
    for (const w of [...pending.values()]) w.finish();
    finish(null);
    P.mute(true);
  }
  function kitRules(my) {
    return __async(this, null, function* () {
      const secs = Math.max(5, Math.min(120, Math.round(+settings.k_rulesSec) || 12));
      const sp = game.spot ? game.spot(settings) : null;
      const lines = [];
      const all = (typeof game.rules === "function" ? game.rules(settings) : game.rules) || [];
      const rl = sp && Array.isArray(sp.bullets) && sp.bullets.length ? all.slice(0, 2) : all.slice(0, 6);
      if (sp && sp.name) lines.push(["🎮", P.f(sp.name) + (sp.desc ? ": " + P.f(sp.desc) : "")]);
      for (const t2 of rl) lines.push(["•", P.f(t2)]);
      if (sp && Array.isArray(sp.bullets)) for (const [ic, t2] of sp.bullets.slice(0, 3)) lines.push([ic, P.f(t2, sp.vars)]);
      stage.textContent = "";
      const cv = el("div", "cover howto", stage);
      const box2 = el("div", "howto-box", cv);
      const hd = el("div", "howto-hd", box2);
      if (ICONS.has(game.id)) {
        const gi = el("img", "howto-gi", hd);
        gi.src = iconOf(game.id);
        gi.alt = "";
      }
      const t = el("div", "", hd);
      el("small", "", t, P.f("How to play"));
      el("h1", "", t, P.f(game.name));
      const ol = el("ul", "howto-list", box2);
      for (const [ic, tx2] of lines) {
        const li = el("li", "", ol);
        el("i", "", li, ic);
        el("span", "", li, tx2);
      }
      const bar = el("div", "howto-bar", box2);
      const fill = el("i", "", bar);
      fill.style.animationDuration = secs + "s";
      boo("mind");
      const m = { k: "q", n: ++round, gr: run, kind: "wait", prompt: P.f("How to play"), extra: { rules: rl, sp: sp ? { name: sp.name, desc: sp.desc, bullets: (sp.bullets || []).slice(0, 3).map((b) => b[0] + " " + b[1]), vars: sp.vars || null } : null, secs }, who: [] };
      cur.q = m;
      say(m);
      yield psleep(secs * 1e3);
    });
  }
  function setPause(on2) {
    on2 = !!on2;
    if (on2 === paused || on2 && phase !== "play") return;
    if (on2) {
      paused = true;
      pausedAt = Date.now();
      for (const x of ptimers) clearTimeout(x.t);
      document.body.classList.add("paused");
      if (SND.pause) SND.pause();
      if (pauseEl) pauseEl.remove();
      pauseEl = el("div", "pause-ov", document.body);
      const b = el("div", "pause-box", pauseEl);
      const im = el("img", "pause-boo", b);
      im.src = P.booUri("boo:peek");
      im.alt = "";
      el("h1", "", b, P.f("Paused"));
      el("p", "", b, P.f("The host paused the game. It goes on from right here when they tap Resume."));
    } else unpause();
    for (const f of pauseSubs) {
      try {
        f(paused);
      } catch (e) {
      }
    }
    say({ k: "pause", on: paused });
    sayLobby();
  }
  function unpause() {
    if (!paused) return;
    pausedAll += Date.now() - pausedAt;
    paused = false;
    document.body.classList.remove("paused");
    if (pauseEl) {
      pauseEl.remove();
      pauseEl = null;
    }
    for (const x of [...ptimers]) x.arm();
    if (SND.resume) SND.resume();
    for (const f of pauseSubs) {
      try {
        f(false);
      } catch (e) {
      }
    }
  }
  function abandonTimers() {
    for (const x of [...ptimers]) {
      clearTimeout(x.t);
      ptimers.delete(x);
      try {
        x.fn();
      } catch (e) {
      }
    }
  }
  function abortGame() {
    if (phase !== "play" && phase !== "end") return;
    run++;
    unpause();
    handlers.clear();
    playerSubs.clear();
    pauseSubs.clear();
    for (const w of [...pending.values()]) w.finish();
    abandonTimers();
    cur.q = null;
    waitHost = false;
    if (joinEl) showJoin(false);
  }
  function finish(ranking) {
    return __async(this, null, function* () {
      phase = "end";
      soundHint();
      cur.q = null;
      waitHost = false;
      if (joinEl) showJoin(false);
      let ps = (ranking || list().slice().sort((a, b) => b.score - a.score)).filter(Boolean);
      const teamMode = !!(game.teamsWin && teamsOn());
      let teamPlace = null;
      if (teamMode) {
        const tsc = game.teamScore ? game.teamScore() : null;
        ps = P.TEAMS.slice(0, Math.min(4, +settings.teamN || 2)).map((t) => ({ id: "team-" + t[0], team: t[0], name: P.f(t[1] + " team"), av: "boo:party", photo: "", score: tsc && t[0] in tsc ? tsc[t[0]] : list().filter((p) => p.team === t[0]).reduce((n2, p) => n2 + p.score, 0) })).sort((a, b) => b.score - a.score);
        teamPlace = new Map(ps.map((t, i) => [t.team, i + 1]));
      }
      const own = !!(ranking && ranking.own && game.ownEnd);
      if (!own) yield podium(ps, teamMode);
      const rk = ps.map((p, i) => ({ id: p.id, name: p.name, score: p.score, place: i + 1, av: typeof p.av === "string" && p.av.length < 40 ? p.av : void 0 }));
      for (const p of list()) result(p.id, { end: true, place: teamMode ? teamPlace.get(p.team) || 0 : rk.findIndex((x) => x.id === p.id) + 1, of: rk.length, score: p.score, team: teamMode ? p.team : void 0 });
      let look = "";
      try {
        look = game.endLook ? String(game.endLook() || "").slice(0, 20) : "";
      } catch (e) {
      }
      say({ k: "end", ranking: rk.slice(0, 10), look, team: teamMode ? 1 : 0 });
      sayLobby();
      letWaitersIn();
    });
  }
  function letWaitersIn() {
    const w = [...waitNext.values()];
    waitNext.clear();
    for (const m of w) take(m);
  }
  function podium(ps, teamMode) {
    return __async(this, null, function* () {
      const w = ps[0];
      const k = yield P.tr(game.winK ? game.winK(teamMode) : teamMode ? "The winning team" : "The winner"), foot = yield P.tr("The host can play again, or pick another game.");
      const byRight = game.id === "trivia" && !settings.speed && settings.mode !== "first" && !teamMode;
      const unit = byRight ? "{n} correct" : "{n} points";
      const line = (p) => game.winLine ? game.winLine(p) : [unit, { n: p.score }];
      for (const p of ps.slice(0, 3)) {
        const [t2, v2] = line(p);
        yield P.tr(t2, v2);
      }
      stage.textContent = "";
      const cv = el("div", "cover win", stage);
      el("div", "rays", cv);
      el("div", "beam l", cv);
      el("div", "beam r", cv);
      confettiRain(cv);
      const box2 = el("div", "win-box", cv);
      el("div", "win-k caps", box2, k);
      el("h1", "win-n", box2, w ? w.name : "...");
      const pod = el("div", "podium2", box2);
      [[ps[1], 2, "two"], [ps[0], 1, "one"], [ps[2], 3, "three"]].forEach(([p, place, cls]) => {
        const col = el("div", "pc " + cls + (p ? "" : " empty"), pod);
        const who = el("div", "who", col);
        if (p) {
          if (place === 1) el("div", "crown", who, "👑").setAttribute("aria-hidden", "true");
          const av = el("div", "av", who);
          const im = el("img", "", av);
          im.src = avatarUrl(p);
          im.alt = "";
          el("div", "nm", who, p.name);
          el("div", "sc", who, P.f(...line(p)));
        }
        el("div", "blk", col, String(place));
      });
      el("p", "win-foot", cv, foot);
      if (game.winDeco) {
        try {
          game.winDeco(cv, el);
        } catch (e) {
        }
      }
      boo("happy");
      if (game.sounds) {
        const gm = game.music;
        if (!gm || gm.win) {
          SND.music(gm ? gm.after : "theme", { delay: gm ? gm.afterDelay : 7, fadeIn: gm ? 3 : 2.5, fadeOut: gm ? 1 : 0.4 });
          SND.sting(gm ? gm.win : "win");
        }
      } else {
        SND.music(null);
        P.sfx("win");
      }
    });
  }
  function confettiRain(parent2) {
    try {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches || settings.k_calm) return;
    } catch (e) {
    }
    const cv = el("canvas", "rain", parent2);
    const g = cv.getContext && cv.getContext("2d");
    if (!g) return;
    const dpr = Math.min(2, devicePixelRatio || 1);
    let W = 0, H = 0, k = 1;
    const size = () => {
      W = cv.clientWidth || innerWidth;
      H = cv.clientHeight || innerHeight;
      k = Math.max(0.6, H / 720);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const COLS = ["#ffd166", "#ff5f7e", "#4f8bff", "#2fd59a", "#b46bff", "#ffffff", "#ff9f43"];
    const bit = (y) => ({
      x: Math.random() * W,
      y: y != null ? y : -20 - Math.random() * 60,
      w: (6 + Math.random() * 7) * k,
      h: (3 + Math.random() * 4) * k,
      vy: (0.7 + Math.random() * 1.3) * k,
      vx: (Math.random() - 0.5) * 0.6,
      a: Math.random() * 6.28,
      va: (Math.random() - 0.5) * 0.12,
      f: Math.random() * 6.28,
      vf: 0.05 + Math.random() * 0.1,
      c: COLS[Math.random() * COLS.length | 0]
    });
    const bits = Array.from({ length: 160 }, () => bit(-Math.random() * H * 1.1));
    const t0 = performance.now();
    let last = t0;
    (function frame(t) {
      if (!cv.isConnected) return;
      const dt = Math.min(3, (t - last) / 16.7);
      last = t;
      if (Math.abs(cv.clientWidth - W) > 1) size();
      g.clearRect(0, 0, W, H);
      const calm = t - t0 > 7e3;
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.y += b.vy * dt * 1.5;
        b.x += (b.vx + Math.sin(b.f) * 0.5) * dt;
        b.a += b.va * dt;
        b.f += b.vf * dt;
        if (b.y > H + 20) {
          if (calm && bits.length > 70) {
            bits.splice(i, 1);
            continue;
          }
          Object.assign(b, bit());
        }
        g.save();
        g.translate(b.x, b.y);
        g.rotate(b.a);
        g.scale(1, Math.cos(b.f));
        g.fillStyle = b.c;
        g.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
        g.restore();
      }
      requestAnimationFrame(frame);
    })(t0);
  }
  function kit(my) {
    const live = () => my === run && phase === "play";
    const nop = () => {
    };
    return {
      players: list,
      alive,
      get settings() {
        return settings;
      },
      lang,
      tr: P.tr,
      f: P.f,
      P,
      el,
      strings,
      top,
      stage,
      avatarUrl,
      // the game's own questions, words and places, written for its language (null: English, the packs in packs.js)
      packs: lang === "en" ? null : I18N.packs(lang),
      sleep: (ms) => live() ? psleep(ms) : Promise.resolve(),
      // the game's own clock (it stands still while the host has the game paused), whether it's paused now, fn(paused)
      // when that changes (gives back its off function), and fn after ms of the game's time (gives back a cancel)
      now: gnow,
      paused: () => paused,
      onPause(fn) {
        if (!live()) return nop;
        pauseSubs.add(fn);
        return () => pauseSubs.delete(fn);
      },
      after: (ms, fn) => live() ? pafter(() => {
        if (live()) fn();
      }, ms) : nop,
      say: (m) => live() ? say(m) : nop(),
      sayTo: (id, m) => live() ? sayTo(id, m) : nop(),
      box: (id, m) => live() ? box(id, m) : Promise.resolve(false),
      ask: (o) => live() ? ask(o) : Promise.resolve(/* @__PURE__ */ new Map()),
      wait: (t, x) => live() ? wait(t, x) : nop(),
      result: (id, r) => live() ? result(id, r) : nop(),
      on: (k, fn) => live() ? on(k, fn) : nop,
      boo: (mood) => live() ? boo(mood) : nop(),
      ring: (parent2, sec, idle) => live() ? ring(parent2, sec, idle) : { node: el("div"), stop: nop, go: nop },
      board: (parent2, o) => board(live() ? parent2 : el("div"), o),
      // (no title: a screen that makes its own top, like Trivia's questions)
      view(title, sub, right) {
        if (!live()) return el("div");
        stage.textContent = "";
        if (booEl && booEl.dataset.slot) booEl.hidden = true;
        if (title != null) top(stage, title, sub, right);
        const b = el("div", "body", stage);
        credit(game);
        return b;
      },
      player: (id) => players.get(id),
      // someone left, came back, joined or was taken out: fn() runs (until the off function it gives back is called)
      onPlayers(fn) {
        if (!live()) return nop;
        playerSubs.add(fn);
        return () => playerSubs.delete(fn);
      },
      // a player's own language ('' when they follow the game's), and a line in it
      langOf: (id) => {
        const p = players.get(id);
        return p && p.lang || "";
      },
      trFor: (code2, text, vars) => code2 && code2 !== lang && I18N.FULL.has(code2) && I18N.has(code2) ? I18N.t(code2, text, vars) : P.tr(text, vars),
      // the game waits for the host's phone (Next question): if it's gone, the host passes to someone who's here
      hostWait: (on2) => {
        waitHost = !!on2 && live();
      },
      teamsOn: () => teamsOn(),
      qn: () => cur.q ? cur.q.n : 0,
      // (closes a question now: everyone who answered counts)
      close: (n) => {
        const w = pending.get(n);
        if (w && live()) w.finish();
      },
      isHost: (id) => id === host,
      hostId: () => host,
      // points with the game's mode: speed points (faster is more), first right gets a bonus
      award(p, base, ms, secs) {
        const speed = settings.speed ? Math.round(base * (0.5 + 0.5 * Math.max(0, 1 - (ms || 0) / ((secs || 20) * 1e3)))) : base;
        p.score += speed;
        return speed;
      },
      speak: (t) => live() ? P.speak(t, lang) : false,
      snd: {
        music: (n, o) => live() ? SND.music(n, o) : null,
        sting: (n, o) => live() ? SND.sting(n, o) : null,
        fx: (n, o) => live() && SND.fx ? SND.fx(n, o) : null,
        on: () => SND.state() === "on",
        // (the moment a tune reaches a second of it: the reveal lands on the music's beat)
        at: (n, sec) => live() ? SND.at ? SND.at(n, sec) : sleep(sec * 1e3) : Promise.resolve()
      },
      num: (n) => {
        try {
          return Number(n).toLocaleString(lang + "-u-nu-latn");
        } catch (e) {
          return String(n);
        }
      },
      over: () => !live()
    };
  }
  function game0(def) {
    games.set(def.id, def);
  }
  function boot() {
    return __async(this, null, function* () {
      stage.textContent = "";
      const c = el("div", "cover", stage);
      const h = location.hash.replace(/^#/, "").split(".");
      const want = I18N.ok(h[1]) ? h[1] : I18N.pick();
      yield setLang(want).catch(() => {
      });
      const t1 = el("h1", "", c, P.f("Blokvane party games"));
      el("p", "", c, P.f("Getting the room ready..."));
      if (!(window.crypto && crypto.subtle) || !window.WebSocket) {
        c.lastChild.textContent = P.f("This browser is too old for party games. Try Chrome, Edge, Safari or a newer TV.");
        return;
      }
      const given = h[2] && /^[A-Z]{6}$/.test(h[2]) ? L.normShort(h[2], 6) : "";
      yield open(given || "");
      if (games.has(h[0])) choose(h[0]);
      else {
        lobby();
        retranslate();
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(boot, 0), { once: true });
  else setTimeout(boot, 0);
  try {
    if (navigator.wakeLock) navigator.wakeLock.request("screen").catch(() => {
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && navigator.wakeLock) navigator.wakeLock.request("screen").catch(() => {
      });
    });
  } catch (e) {
  }
  if (/[?&]debug\b/.test(location.search)) window.__bvplay = {
    players,
    pending,
    get host() {
      return host;
    },
    get phase() {
      return phase;
    },
    // (for checking the screens on this computer: made-up players join and get ready, and the winners show straight away)
    fake(names) {
      names.forEach((nm, i) => {
        const f = ("aaaaaaaaaaaaaaaa" + (i + 1).toString(16)).slice(-16);
        take({ k: "join", f, name: nm, av: P.AVATARS[i % P.AVATARS.length] });
        take({ k: "ready", f, on: true });
      });
    },
    testWin(scores) {
      let i = 0;
      for (const p of players.values()) p.score = scores[i++] || 0;
      finish(null);
    },
    // (and the game starts with whoever is in, as if the host had tapped Start)
    go() {
      if (phase !== "play") start();
    },
    // (a made-up player answers the question that's on: fake player i, 1 to 16)
    answer(i, v, ms) {
      const f = ("aaaaaaaaaaaaaaaa" + i.toString(16)).slice(-16);
      if (cur.q) take({ k: "ans", f, n: cur.q.n, v, ms: ms || 1500 });
    },
    get q() {
      return cur.q;
    },
    // (a message of the test's own making, to everyone or to one phone: a late result, say)
    say(m, to) {
      return to ? sayTo(to, m) : say(m);
    },
    get calm() {
      return !!settings.k_calm;
    },
    // (the host's settings, set from here)
    set(o) {
      Object.assign(settings, o);
    }
  };
  return { game: game0, get games() {
    return games;
  } };
})();
