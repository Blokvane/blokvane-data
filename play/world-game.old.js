// Made from world-game.js by tools/old-js.js for older TV browsers (async functions written the older way).
// Do not edit this copy: change world-game.js and run node tools/old-js.js again.
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
(() => {
  "use strict";
  const P = BVPLAYC, PK = BVPACKS, M = BVMAP;
  const BASE = (document.currentScript && document.currentScript.src || "").replace(/[^/]*$/, "");
  const VER = ((document.currentScript && document.currentScript.src || "").match(/[?&]v=(\w+)/) || [])[1] || "1";
  const LANGS = ["en", "es", "fr", "hi", "bn", "zh", "ar"];
  const sleepRaw = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => P.shuffle(a.slice());
  let dataP = null;
  function loadData() {
    if (window.BVWD) return Promise.resolve(window.BVWD);
    if (!dataP) {
      dataP = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = BASE + "world-data.js?v=" + VER;
        s.onload = () => window.BVWD ? res(window.BVWD) : rej(new Error("data"));
        s.onerror = () => {
          dataP = null;
          rej(new Error("data"));
        };
        document.head.appendChild(s);
      });
    }
    return dataP;
  }
  const AREAS = {
    world: [-180, -60, 180, 80],
    europe: [-25, 34, 45, 71.5],
    asia: [25, -11, 150, 60],
    africa: [-20, -36, 55, 38],
    americas: [-170, -56, -30, 72],
    oceania: [110, -50, 180, 0],
    me: [24, 11, 64, 43],
    us: [-170, 17, -64, 72]
  };
  const ME = /* @__PURE__ */ new Set(["tr", "cy", "lb", "sy", "il", "ps", "jo", "iq", "ir", "sa", "ye", "om", "ae", "qa", "bh", "kw", "eg"]);
  const CONT = { af: "Africa", as: "Asia", eu: "Europe", na: "North America", sa: "South America", oc: "Oceania" };
  const AREA_CONT = { europe: ["eu"], asia: ["as"], africa: ["af"], americas: ["na", "sa"], oceania: ["oc"] };
  const US_REGION = { California: "W", Texas: "S", Florida: "S", "New York": "NE", Alaska: "W", Hawaii: "W", Washington: "W", Colorado: "W", Arizona: "W", Nevada: "W", Utah: "W", Oregon: "W", Illinois: "MW", Michigan: "MW", Ohio: "MW", Georgia: "S", Maine: "NE", Louisiana: "S", Tennessee: "S", Montana: "W", Minnesota: "MW", "North Carolina": "S", Pennsylvania: "NE", Massachusetts: "NE", Wyoming: "W" };
  const US_HINT = { W: "It's in the West.", MW: "It's in the Midwest.", S: "It's in the South.", NE: "It's in the Northeast." };
  const inBox = (b, lon, lat) => lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3];
  function allItems(D, K) {
    const SAME = /* @__PURE__ */ new Set(["bv", "sj", "mf", "um", "hm"]);
    const flags = D.flags.map((f) => ({ kind: "flag", same: SAME.has(f[0]), id: f[0], key: "f:" + f[0], cc: f[0], lon: +f[1], lat: +f[2], lv: +f[3] || 3, cont: f[4], names: f[5], me: ME.has(f[0]) }));
    const contOf = {};
    for (const f of flags) contOf[f.cc] = f.cont;
    const pic = (k) => {
      const p = D.photos && D.photos[k];
      return p ? { file: p[0], fx: typeof p[1] === "number" ? p[1] : null } : null;
    };
    const cities = D.cities.map((c) => ({ kind: "city", id: c[0], key: "c:" + c[0], lon: +c[1], lat: +c[2], lv: +c[3] || 2, cc: c[4], iata: c[5], wiki: c[6], names: c[7], me: c[8] === "me", cont: contOf[c[4]], photo: pic("c:" + c[0]) }));
    const sights = D.sights.map((c) => ({ kind: "sight", id: c[0], key: "s:" + c[0], lon: +c[1], lat: +c[2], lv: +c[3] || 2, cc: c[4], emoji: c[5], wiki: c[6], names: c[7], me: c[8] === "me", cont: contOf[c[4]], photo: pic("s:" + c[0]) }));
    const LP = K.packs;
    const states = PK.places.states.map((x, i) => ({ kind: "state", id: x[0], key: "u:" + x[0], lon: x[1], lat: x[2], lv: i < 9 ? 1 : i < 17 ? 2 : 3, names: LANGS.map((lg, j) => j === 0 ? x[0] : lg === K.lang && LP && LP.places && LP.places.states && LP.places.states[i] || x[0]), region: US_REGION[x[0]] }));
    return { flags: flags.filter((f) => !f.same), allFlags: flags, cities, sights, states, contOf };
  }
  const PLURAL = {
    en: ["easter-island", "petronas-towers", "kuwait-towers", "sundarbans"],
    es: ["easter-island", "niagara-falls", "victoria-falls", "iguazu-falls", "petronas-towers", "kuwait-towers", "sundarbans"],
    fr: ["easter-island", "niagara-falls", "victoria-falls", "iguazu-falls", "petronas-towers", "kuwait-towers", "sundarbans", "meteora"]
  };
  const plural = (it, lg) => !!(PLURAL[lg] && PLURAL[lg].includes(it.id));
  const NOCOUNTRY = /* @__PURE__ */ new Set(["jerusalem", "dome-of-the-rock"]);
  const nameIn = (it, lg) => it.names && it.names[LANGS.indexOf(lg)] || it.names && it.names[0] || it.id;
  const cap = (t) => {
    const s = String(t || "");
    return s ? s[0].toLocaleUpperCase() + s.slice(1) : s;
  };
  const SEEN = "bvplay:world:seen";
  const seenList = () => {
    try {
      return JSON.parse(localStorage.getItem(SEEN) || "[]");
    } catch (e) {
      return [];
    }
  };
  function markSeen(keys) {
    try {
      const l = seenList().filter((k) => !keys.includes(k));
      localStorage.setItem(SEEN, JSON.stringify(l.concat(keys).slice(-900)));
    } catch (e) {
    }
  }
  function choose(pool, n, level) {
    const seen = seenList(), age = new Map(seen.map((k, i) => [k, i + 1]));
    const fresh = (x) => (age.get(x.key) || 0) + Math.random() * 40;
    const byLv = (l) => shuffle(pool.filter((x) => x.lv === l)).sort((a, b) => fresh(a) - fresh(b));
    const lv = [byLv(1), byLv(2), byLv(3)];
    const want = [];
    if (level === "easy") want.push(...Array(n).fill(0));
    else if (level === "medium") want.push(...Array(n).fill(1));
    else if (level === "hard") want.push(...Array(n).fill(2));
    else {
      const e = Math.ceil(n * 0.4), h = Math.floor(n * 0.25);
      for (let i = 0; i < n; i++) want.push(i < e ? 0 : i < n - h ? 1 : 2);
    }
    const out = [];
    for (const w of want) {
      const order = [w, w + 1, w - 1, w + 2, w - 2].filter((x) => x >= 0 && x <= 2);
      for (const l of order) {
        if (lv[l].length) {
          out.push(lv[l].shift());
          break;
        }
      }
    }
    return out;
  }
  function interleave(lists, n) {
    const out = [];
    const left = lists.map((l) => l.slice());
    while (out.length < n && left.some((l) => l.length)) {
      const ok = left.map((l, i) => i).filter((i) => left[i].length && !(out.length >= 2 && out[out.length - 1].kind === left[i][0].kind && out[out.length - 2].kind === left[i][0].kind));
      const from = ok.length ? ok : left.map((l, i) => i).filter((i) => left[i].length);
      out.push(left[pick(from)].shift());
    }
    return out;
  }
  const WIKI = "https://en.wikipedia.org/w/api.php";
  const PHOTO = "bvplay:world:photos2";
  try {
    localStorage.removeItem("bvplay:world:photos");
  } catch (e) {
  }
  function photoCache() {
    try {
      return JSON.parse(localStorage.getItem(PHOTO) || "{}");
    } catch (e) {
      return {};
    }
  }
  function savePhoto(file, v) {
    try {
      const c = photoCache();
      c[file] = Object.assign({ t: Date.now() }, v);
      const keys = Object.keys(c);
      if (keys.length > 400) for (const k of keys.sort((a, b) => c[a].t - c[b].t).slice(0, keys.length - 400)) delete c[k];
      localStorage.setItem(PHOTO, JSON.stringify(c));
    } catch (e) {
    }
  }
  function wapi(params) {
    return __async(this, null, function* () {
      const u = new URL(WIKI);
      for (const [k, v] of Object.entries(Object.assign({ action: "query", format: "json", formatversion: "2", origin: "*" }, params))) u.searchParams.set(k, v);
      const ac = window.AbortController ? new AbortController() : null;
      const t = setTimeout(() => {
        if (ac) ac.abort();
      }, 7e3);
      try {
        const r = yield fetch(u.href, { credentials: "omit", referrerPolicy: "no-referrer", signal: ac ? ac.signal : void 0 });
        if (!r.ok) throw new Error("wiki");
        return yield r.json();
      } finally {
        clearTimeout(t);
      }
    });
  }
  const strip = (h) => (new DOMParser().parseFromString("<body>" + String(h || ""), "text/html").body.textContent || "").replace(/\s+/g, " ").trim();
  function byWho(a) {
    let s = String(a || "").replace(/\s+/g, " ").trim();
    const tb = s.match(/taken by ([^.,;]+)/i);
    if (tb) s = tb[1];
    s = s.split(/\s*derivative work\s*:?/i)[0];
    s = s.replace(/^(?:file:)?[^:]*\.(?:jpe?g|png|tiff?|webp)\s*:\s*/i, "");
    s = s.replace(/^(?:photo|photograph|original|author|image)\s*(?:by)?\s*:\s*/i, "").replace(/^photo by\s+/i, "");
    s = s.replace(/\s*-?\s*https?:\/\/\S+/gi, "").replace(/\s*\((?:flickr|more photos|[^)]*\.(?:com|org|net|de)[^)]*)\)/gi, "");
    s = s.replace(/,\s*on\s+\S+$/i, "").replace(/\s+from\s+[^,]+(?:,\s*[^,]+)*$/i, "");
    s = s.replace(/[\s.,;:]+$/, "").trim();
    if (s.length > 44) {
      const cut = s.slice(0, 44);
      s = cut.slice(0, cut.lastIndexOf(" ") > 24 ? cut.lastIndexOf(" ") : 44).trim();
    }
    return s;
  }
  function fileInfo(names) {
    return __async(this, null, function* () {
      const out = /* @__PURE__ */ new Map();
      for (let i = 0; i < names.length; i += 40) {
        const part = names.slice(i, i + 40);
        const j = yield wapi({ prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: "1280", iiextmetadatafilter: "LicenseShortName|Artist|NonFree", titles: part.map((n) => "File:" + n).join("|") });
        const asked = /* @__PURE__ */ new Map();
        for (const r of j.query && j.query.normalized || []) asked.set(r.to, r.from);
        for (const pg of j.query && j.query.pages || []) {
          const ii = pg.imageinfo && pg.imageinfo[0];
          if (!ii || pg.imagerepository !== "shared" && pg.imagerepository !== "local") continue;
          const md = ii.extmetadata || {};
          if (md.NonFree && String(md.NonFree.value) === "true") continue;
          const lic = strip(md.LicenseShortName && md.LicenseShortName.value);
          if (!/^(cc|public domain|pd|gfdl|attribution)/i.test(lic)) continue;
          const who = byWho(strip(md.Artist && md.Artist.value));
          const v = { src: ii.thumburl || ii.url, w: ii.width, h: ii.height, credit: (who ? who + ", " : "") + lic + (pg.imagerepository === "shared" ? ", Wikimedia Commons" : ", Wikipedia") };
          const t = String(pg.title || "");
          out.set(t.replace(/^File:/, ""), v);
          if (asked.has(t)) out.set(asked.get(t).replace(/^File:/, ""), v);
        }
      }
      return out;
    });
  }
  const withFx = (v, it) => it.photo.fx != null ? Object.assign({}, v, { fx: it.photo.fx }) : v;
  function photosFor(items) {
    return __async(this, null, function* () {
      const cache = photoCache(), out = /* @__PURE__ */ new Map(), todo = [];
      for (const it of items) {
        if (!it.photo) continue;
        const c = cache[it.photo.file];
        if (c && c.src && Date.now() - c.t < 20 * 864e5) out.set(it.key, withFx(c, it));
        else todo.push(it);
      }
      if (!todo.length) return out;
      try {
        const info = yield fileInfo([...new Set(todo.map((it) => it.photo.file))]);
        for (const it of todo) {
          const v = info.get(it.photo.file);
          if (v) {
            savePhoto(it.photo.file, v);
            out.set(it.key, withFx(v, it));
          }
        }
      } catch (e) {
      }
      return out;
    });
  }
  const loaded = /* @__PURE__ */ new Map();
  function preload(src) {
    if (!src) return Promise.resolve(false);
    if (!loaded.has(src)) loaded.set(src, new Promise((res) => {
      const im = new Image();
      im.referrerPolicy = "no-referrer";
      im.decoding = "async";
      im.onload = () => res(true);
      im.onerror = () => res(false);
      im.src = src;
    }));
    return loaded.get(src);
  }
  const flagSize = /* @__PURE__ */ new Map();
  function flagImg(cc) {
    const src = BASE + "flags/" + cc + ".png";
    if (!flagSize.has(cc)) flagSize.set(cc, new Promise((res) => {
      const im = new Image();
      im.onload = () => res([im.naturalWidth || 640, im.naturalHeight || 427]);
      im.onerror = () => res([640, 427]);
      im.src = src;
    }));
    return { src, size: flagSize.get(cc) };
  }
  window.BVWORLD = { plural, NOCOUNTRY, loadData, allItems, nameIn, cap, choose, interleave, markSeen, photosFor, preload, flagImg, AREAS, ME, CONT, AREA_CONT, US_HINT, inBox, LANGS, BASE, pick, shuffle, sleepRaw };
})();
(() => {
  "use strict";
  const W = BVWORLD, M = BVMAP;
  const div = (cls, at, html) => {
    const e = document.createElement("div");
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (at) at.appendChild(e);
    return e;
  };
  const boo = (cls, at) => div("boo-f" + (cls ? " " + cls : ""), at, M.BOO);
  const pinEl = (at, o) => {
    const w = div("pinw", at);
    const b = div("bob", w);
    const p = M.pin(o || {});
    b.appendChild(p);
    return w;
  };
  const img = (src, at, cls) => {
    const i = document.createElement("img");
    i.src = src;
    i.alt = "";
    i.decoding = "async";
    i.referrerPolicy = "no-referrer";
    if (cls) i.className = cls;
    at.appendChild(i);
    return i;
  };
  const photo = (c, at, cls) => {
    const p = div("ph" + (cls ? " " + cls : ""), at);
    const i = img(c.photo.src, p);
    if (c.photo.fx != null) i.style.objectPosition = c.photo.fx * 100 + "% 50%";
    return p;
  };
  const flagEl = (c, at) => img(c.flag.src, at, "fl");
  const PU = (c) => c.U;
  const PLACE = {
    pin(h, c) {
      const r = div("rings", h, "<i></i><i></i><i></i>");
      const st = div("stack", r);
      pinEl(st, { size: 12.5 * PU(c) });
      div("shadow", st);
      c.fx("whoosh");
      return { color: "#ffc83d" };
    },
    radar(h, c) {
      const s = div("scope", h);
      div("grid", s);
      div("sweep", s);
      for (const [x, y, col, d] of [[22, 30, "#3d8bff", 0.35], [70, 26, "#2fd59a", 0.9], [74, 70, "#ffc83d", 1.7], [26, 72, "#b9a8ff", 2.5]]) {
        const b = div("blip", s);
        b.style.cssText = `--x:${x}%;--y:${y}%;--c:${col};--d:${d}s`;
      }
      pinEl(s, { size: 10 * PU(c) });
      c.fx("ping", 250);
      c.fx("ping", 3450, { vol: 0.5 });
      return { color: "#2fd59a" };
    },
    postcard(h, c) {
      const k = div("card", h);
      div("div", k);
      div("ln", k);
      div("ln", k);
      div("ln", k);
      pinEl(k, { size: 10 * PU(c) });
      const st = div("stamp", k);
      boo("", st);
      c.fx("whoosh");
      c.fx("stamp", 650);
      return { color: "#ff8a65" };
    },
    globe(h, c) {
      const w = div("wrap", h);
      pinEl(w, { size: 10 * PU(c) });
      div("shadow", w);
      const b = div("ball", w);
      const t = div("tex", b);
      t.style.setProperty("--map", `url(${M.BASE}z0.jpg)`);
      div("grid", b, '<svg viewBox="0 0 100 100"><g fill="none" stroke="rgba(190,220,255,.35)" stroke-width=".6"><ellipse cx="50" cy="50" rx="49" ry="49"/><ellipse cx="50" cy="50" rx="34" ry="49"/><ellipse cx="50" cy="50" rx="17" ry="49"/><path d="M50 1V99M1 50H99M6 27H94M6 73H94"/></g></svg>');
      div("shade", b);
      c.fx("globe", 100);
      return { color: "#ffc83d" };
    },
    path(h, c) {
      const box = div("box", h), id = "wqm" + Math.random().toString(36).slice(2, 8);
      const D = "M70 290C170 120 290 140 360 210S520 300 560 92";
      box.innerHTML = `<svg viewBox="0 0 680 360"><defs><mask id="${id}" maskUnits="userSpaceOnUse"><path class="rev" d="${D}" stroke="#fff" stroke-width="34" fill="none" stroke-linecap="round"/></mask></defs><path class="trail" mask="url(#${id})" d="${D}"/><circle class="start" cx="70" cy="290" r="11"/><g class="x" transform="translate(520 300)"><path d="M-16 -16L16 16M16 -16L-16 16"/></g></svg>`;
      const rev = box.querySelector(".rev"), svg = box.querySelector("svg");
      const walker = div("walker", box);
      walker.appendChild(M.pin({ size: 9 * PU(c) }));
      const len = rev.getTotalLength();
      rev.style.strokeDasharray = len + " " + len;
      rev.style.strokeDashoffset = String(len);
      const toBox = (x, y) => {
        const k = (svg.clientWidth || 680) / 680;
        return [x * k, y * k];
      };
      const t0 = performance.now(), dur = 1800;
      const step = (t) => {
        if (!box.isConnected) return;
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 2), d = len * e;
        const p = rev.getPointAtLength(d), [x, y] = toBox(p.x, p.y);
        rev.style.strokeDashoffset = String(len - d);
        walker.style.transform = `translate(${x}px,${y - Math.abs(Math.sin(e * Math.PI * 6)) * 1.8 * PU(c)}px)`;
        if (k < 1) {
          requestAnimationFrame(step);
          return;
        }
        const [ex, ey] = toBox(520, 300);
        walker.animate([{ transform: `translate(${x}px,${y}px)` }, { transform: `translate(${(x + ex) / 2}px,${Math.min(y, ey) - 8 * PU(c)}px)` }, { transform: `translate(${ex}px,${ey}px)` }], { duration: 700, easing: "ease-in-out", fill: "forwards" });
        c.fx("pop", 650, { rate: 1.35 });
      };
      requestAnimationFrame(step);
      for (let i = 0; i < 6; i++) c.fx("pop", 150 + i * 280, { rate: 0.85 + i * 0.07, vol: 0.45 });
      return { color: "#ffc83d" };
    },
    neon(h, c) {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      s.setAttribute("viewBox", "0 0 120 150");
      s.setAttribute("class", "sign");
      s.innerHTML = '<path d="M60 146C60 146 12 92 12 56A48 48 0 1 1 108 56C108 92 60 146 60 146Z"/><path d="M60 26C46 26 38 37 38 51V80q4.5-5 9 0t8.5 0t8.5 0t8.5 0t9.5 0V51C82 37 74 26 60 26Z"/><ellipse class="eye" cx="51.5" cy="52" rx="3.6" ry="5"/><ellipse class="eye" cx="68.5" cy="52" rx="3.6" ry="5"/>';
      h.appendChild(s);
      setTimeout(() => s.classList.add("hum"), 1400);
      c.fx("neon", 50);
      return { color: "#8ff4ff", neon: true, stage: "dark" };
    },
    ticket(h, c) {
      const t = div("tk", h);
      const m = div("main", t);
      const r = div("route", m);
      const from = document.createElement("b");
      from.textContent = "???";
      r.appendChild(from);
      div("ar", r);
      const to = document.createElement("b");
      to.className = "to";
      r.appendChild(to);
      div("bar", m);
      const stub = div("stub", t);
      stub.appendChild(M.pin({ size: 7.5 * PU(c), color: "#ffc83d" }));
      const code = String(c.it.iata || c.it.cc || "???").toUpperCase().slice(0, 3);
      const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let n = 0;
      const iv = setInterval(() => {
        n++;
        to.textContent = [...code].map((ch, i) => n > 6 + i * 3 ? ch : A[Math.floor(Math.random() * 26)]).join("");
        if (n > 6 + code.length * 3) clearInterval(iv);
      }, 70);
      c.fx("print", 150);
      return { color: "#ff5a6e" };
    },
    spot(h, c) {
      div("beam", h);
      div("floor", h);
      pinEl(h, { size: 11 * PU(c) });
      c.fx("spot", 80);
      c.fx("sparkle", 900, { vol: 0.6 });
      return { color: "#ffc83d", stage: "dark" };
    }
  };
  const FLAG = {
    frame(h, c) {
      const f = div("fr", h);
      flagEl(c, f);
      div("sheen", f);
      boo("peek", f);
      c.fx("whoosh");
      c.fx("sparkle", 700, { vol: 0.5 });
      return {};
    },
    pole(h, c) {
      const w = div("wrap", h);
      div("pole", w);
      const cl = div("cloth", w);
      cl.style.setProperty("--img", `url(${c.flag.src})`);
      const N = 16;
      for (let i = 0; i < N; i++) {
        const s = document.createElement("i");
        s.style.setProperty("--px", `calc(var(--fh) * var(--ar) * ${-i / N})`);
        s.style.setProperty("--d", `${-i * 0.11}s`);
        cl.appendChild(s);
      }
      boo("base", w);
      c.fx("flutter", 150);
      return {};
    },
    polaroid(h, c) {
      const p = div("pol", h);
      div("tape", p);
      flagEl(c, p);
      const cap = div("cap", p);
      cap.textContent = "???";
      boo("peek", p);
      const fl = div("wq-flash", c.stage);
      setTimeout(() => fl.remove(), 900);
      c.fx("shutter");
      return {};
    },
    passport(h, c) {
      const pp = div("pp", h);
      const cv = div("cover", pp);
      const e = div("emb", cv);
      boo("", e);
      const b = document.createElement("b");
      b.textContent = "PASSPORT";
      cv.appendChild(b);
      const pg = div("page", pp);
      const fw = div("fw", pg);
      flagEl(c, fw);
      const s = div("seal", pg);
      s.textContent = "?";
      c.fx("flip", 100);
      c.fx("stamp", 950);
      return {};
    },
    tv(h, c) {
      const w = div("tvw", h);
      const set = div("set", w);
      const scr = div("scr", set);
      flagEl(c, scr);
      div("scan", scr);
      const nz = div("noise", scr);
      nz.style.setProperty("--noise", `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.4 -.2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E")`);
      div("live", scr, "<i></i>LIVE");
      div("stand", w);
      c.fx("static", 50);
      return { stage: "dark" };
    },
    museum(h, c) {
      div("lamp", h);
      const a = div("art", h);
      const f = div("frm", a);
      const m = div("mat", f);
      flagEl(c, m);
      const pl = div("plaque", a);
      boo("", pl);
      const t = document.createElement("span");
      t.textContent = c.untitled + ", ????";
      pl.appendChild(t);
      c.fx("sparkle", 200);
      return {};
    },
    cards(h, c) {
      const d = div("deck", h);
      div("back", d);
      const f = div("front", d);
      flagEl(c, f);
      const coin = div("coin", d);
      coin.textContent = "?";
      boo("peek", d);
      c.fx("flip", 250);
      c.fx("coin", 900);
      return {};
    },
    stage(h, c) {
      div("beam", h);
      div("disc", h);
      const f = div("float", h);
      flagEl(c, f);
      boo("side", h);
      c.fx("spot", 60);
      c.fx("sparkle", 900, { vol: 0.5 });
      return { stage: "dark" };
    }
  };
  const PHOTO = {
    badge(h, c) {
      const f = div("fr", h);
      photo(c, f);
      const q = div("coin", f);
      q.textContent = "?";
      c.fx("whoosh");
      c.fx("coin", 750);
      return { color: "#ffc83d" };
    },
    postcard(h, c) {
      const k = div("card", h);
      photo(c, k);
      const st = div("stamp", k);
      boo("", st);
      c.fx("whoosh");
      c.fx("stamp", 650);
      return { color: "#ffc83d" };
    },
    stack(h, c) {
      const p = div("pile", h);
      div("bk a", p);
      div("bk b", p);
      const pol = div("pol", p);
      photo(c, pol);
      const cap = div("cap", pol);
      cap.textContent = "???";
      c.fx("shutter", 100);
      return { color: "#ffc83d" };
    },
    bino(h, c) {
      const b = div("bino", h);
      const l = div("lens", b);
      photo(c, l);
      boo("top", b);
      c.fx("focus", 200);
      return { color: "#ffc83d", stage: "blue" };
    },
    arch(h, c) {
      const a = div("arch", h);
      photo(c, a);
      c.fx("sparkle", 150);
      return { color: "#ffc83d", side: true };
    },
    window(h, c) {
      const w = div("win", h);
      const p = photo(c, w);
      div("cloud a", p);
      div("cloud b", p);
      div("shade", w);
      boo("wing", w);
      c.fx("plane", 0, { vol: 0.55 });
      return { color: "#8fd3ff" };
    },
    phone(h, c) {
      const d = div("dev", h);
      photo(c, d);
      div("bar", d);
      const loc = div("loc", d);
      loc.textContent = "📍 ???";
      const ht = div("heart", d);
      ht.textContent = "❤️";
      boo("side", d);
      c.fx("shutter", 300);
      return { color: "#ff8fb1" };
    },
    film(h, c) {
      const s = div("strip", h);
      photo(c, s, "dim");
      photo(c, s, "mid");
      photo(c, s, "dim");
      c.fx("print", 100);
      return { color: "#ffc83d" };
    },
    mag(h, c) {
      const b = div("base", h);
      photo(c, b, "dim");
      const lit = photo(c, b, "lit");
      const g = div("glass", b);
      const pts = [[30, 40], [64, 32], [52, 66], [74, 58], [50, 50]];
      let i = 0;
      const t0 = performance.now();
      const step = (t) => {
        if (!b.isConnected) return;
        const k = (t - t0) / 1100;
        i = Math.min(pts.length - 1, Math.floor(k));
        const f = Math.min(1, k - i);
        const a = pts[i], z = pts[Math.min(pts.length - 1, i + 1)];
        const e = f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2;
        b.style.setProperty("--mx", a[0] + (z[0] - a[0]) * e + "%");
        b.style.setProperty("--my", a[1] + (z[1] - a[1]) * e + "%");
        if (k < pts.length - 1) requestAnimationFrame(step);
      };
      b.style.setProperty("--mx", "30%");
      b.style.setProperty("--my", "40%");
      requestAnimationFrame(step);
      c.fx("focus", 300);
      return { color: "#ffc83d" };
    },
    journal(h, c) {
      const p = div("page", h);
      photo(c, p);
      div("tp a", p);
      div("tp b", p);
      div("ring", p);
      const d = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      d.setAttribute("viewBox", "0 0 200 120");
      d.setAttribute("class", "doodle");
      d.innerHTML = '<path d="M10 110C40 40 110 100 150 40"/><path class="plane" d="M150 40l34-16-12 30-8-10z"/>';
      p.appendChild(d);
      c.fx("stamp", 300);
      return { color: "#ffc83d" };
    }
  };
  function deck(names) {
    let q = [];
    let last = "";
    return () => {
      if (!q.length) {
        q = W.shuffle(names);
        if (q[0] === last && q.length > 1) q.push(q.shift());
      }
      last = q.shift();
      return last;
    };
  }
  window.BVWORLD_SCENES = { PLACE, FLAG, PHOTO, deck, div, boo, img };
})();
(() => {
  "use strict";
  const P = BVPLAYC, M = BVMAP, W = BVWORLD, SC = BVWORLD_SCENES;
  const LANGS = W.LANGS;
  const { div } = SC;
  const KM_MI = 0.621371;
  const CONT_ORDER = ["af", "as", "eu", "na", "sa", "oc"];
  const SAY = {
    top: [["Bullseye!", "boo:hero"], ["Nailed it!", "boo:legend"], ["Human GPS!", "boo:cool"], ["Spot on!", "boo:party"], ["Right on the dot!", "boo:hero"], ["Are you a pilot?", "boo:legend"]],
    close: [["So close!", "boo:wow"], ["Almost there!", "boo:love"], ["You could walk there!", "boo:cool"], ["Great eye!", "boo:wow"], ["Just around the corner!", "boo:love"]],
    mid: [["Not bad!", "boo:hi"], ["Warm!", "boo:cool"], ["In the neighborhood!", "boo:hi"], ["Pretty good!", "boo:party"]],
    far: [["A bit off!", "boo:laugh"], ["Wrong neighborhood!", "boo:mind"], ["Lukewarm...", "boo:boring"], ["Close-ish?", "boo:laugh"]],
    lost: [["Wrong continent!", "boo:laugh"], ["Did you get lost?", "boo:mind"], ["Boo's map is upside down too!", "boo:laugh"], ["That's a long swim!", "boo:ugh"], ["Other side of the world!", "boo:boring"], ["Need a passport for that one?", "boo:laugh"]]
  };
  const tierOf = (d, scale) => d <= scale * 0.012 ? "top" : d <= scale * 0.16 ? "close" : d <= scale * 0.8 ? "mid" : d <= scale * 2.8 ? "far" : "lost";
  const AREA_OPTS = [
    ["world", "The whole world", "Every country, city and sight on Earth."],
    ["europe", "Europe"],
    ["asia", "Asia"],
    ["africa", "Africa"],
    ["americas", "The Americas"],
    ["oceania", "Oceania"],
    ["me", "The Middle East", "From Egypt and Turkey to Iran and the Gulf."],
    ["us", "US states", "The states, on a map of the US."]
  ];
  const WHAT = [["mix", "A mix", "Flags, cities and famous sights."], ["flags", "Flags"], ["cities", "Cities"], ["landmarks", "Famous sights"]];
  const stageOf = (i, n) => {
    const e = Math.ceil(n / 3), h = Math.floor(n / 3);
    return i < e ? "easy" : i < n - h ? "medium" : "hard";
  };
  function uPx() {
    const t = document.createElement("div");
    t.style.cssText = "position:absolute;visibility:hidden;height:calc(100 * var(--u))";
    document.body.appendChild(t);
    const v = t.offsetHeight / 100;
    t.remove();
    return v || 8;
  }
  const trIn = (K, lg, text, vars) => !lg || lg === K.lang ? K.tr(text, vars) : K.trFor(lg, text, vars);
  const ringCache = /* @__PURE__ */ new Map();
  function rings(D2, cc) {
    if (ringCache.has(cc)) return ringCache.get(cc);
    const d = D2.shapes && D2.shapes[cc];
    const out = [];
    if (d) {
      let cur = null, x = 0, y = 0;
      const tok = String(d).match(/[MmLlZz]|-?\d+(?:\.\d+)?/g) || [];
      let cmd = "M";
      for (let i = 0; i < tok.length; ) {
        const t = tok[i];
        if (/[MmLlZz]/.test(t)) {
          cmd = t;
          i++;
          if (cmd === "Z" || cmd === "z") {
            cur = null;
          }
          continue;
        }
        const a = +tok[i], b = +tok[i + 1];
        i += 2;
        if (cmd === "M") {
          x = a;
          y = b;
          cur = [[x, y]];
          out.push(cur);
          cmd = "L";
        } else if (cmd === "m") {
          x += a;
          y += b;
          cur = [[x, y]];
          out.push(cur);
          cmd = "l";
        } else if (cmd === "L") {
          x = a;
          y = b;
          if (cur) cur.push([x, y]);
        } else {
          x += a;
          y += b;
          if (cur) cur.push([x, y]);
        }
      }
    }
    ringCache.set(cc, out);
    return out;
  }
  function inside(rs, X, Y) {
    let c = false;
    for (const r of rs) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > Y !== yj > Y && X < (xj - xi) * (Y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function distance(D2, it, lon, lat) {
    if (it.kind === "flag") {
      const rs = rings(D2, it.cc);
      if (rs.length) {
        const X = (lon + 180) * 10, Y = (90 - lat) * 10;
        if (inside(rs, X, Y)) return 0;
        let best = Infinity;
        for (const r of rs) for (const [x, y] of r) {
          const dd = P.km([lon, lat], [x / 10 - 180, 90 - y / 10]);
          if (dd < best) best = dd;
        }
        return Math.min(best, P.km([lon, lat], [it.lon, it.lat]));
      }
    }
    return P.km([lon, lat], [it.lon, it.lat]);
  }
  function clock(parent, sec, fx, isPaused) {
    const r = div("wq-clock", parent);
    r.innerHTML = '<svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><b></b>';
    const fg = r.querySelector(".fg"), n = r.querySelector("b");
    let left = sec, t = 0;
    if (!(sec > 0)) {
      n.textContent = "∞";
      n.classList.add("inf");
      return { node: r, go() {
      }, stop() {
        r.classList.add("off");
      }, left: () => Infinity };
    }
    n.textContent = String(sec);
    const tick = () => {
      if (!r.isConnected) {
        clearInterval(t);
        return;
      }
      if (isPaused && isPaused()) return;
      left--;
      n.textContent = String(Math.max(0, left));
      fg.style.strokeDashoffset = String(276.5 * (1 - Math.max(0, left) / sec));
      if (left <= 5 && left > 0) {
        r.classList.add("hurry");
        fx("tick");
      }
      if (left <= 0) {
        clearInterval(t);
        r.classList.remove("hurry");
      }
    };
    return { node: r, go() {
      if (!t) t = setInterval(tick, 1e3);
    }, stop() {
      clearInterval(t);
      r.classList.remove("hurry");
      r.classList.add("off");
    }, left: () => left };
  }
  function board(K, side, teamOf) {
    return __async(this, null, function* () {
      const hd = div("wq-bh", side);
      div("dot", hd);
      const t = document.createElement("b");
      t.textContent = yield K.tr("Scoreboard");
      hd.appendChild(t);
      const cnt = document.createElement("span");
      hd.appendChild(cnt);
      const list = div("wq-rows", side);
      const NOTE = { knockout: "Each round, the farthest pin is out", bullseye: "Only the closest pin scores: 100 points", lightning: "The faster you pin, the more bonus points", zoom: "Pin early for up to 50 bonus points", kids: "Every right answer earns a star" };
      const note = div("wq-note", side);
      note.textContent = yield K.tr(NOTE[modeOf(K.settings || {})] || "The closest pin wins the round.");
      const W2 = { wait: yield K.tr("pinning..."), in: yield K.tr("Pinned!"), away: yield K.tr("Away"), out: yield K.tr("Out") };
      const rows = /* @__PURE__ */ new Map(), shown = /* @__PURE__ */ new Map();
      const pinned = /* @__PURE__ */ new Set();
      let total = 0, marked = false;
      const row = (p) => {
        let r = rows.get(p.id);
        if (r) return r;
        r = div("wq-p", list);
        const av = div("av", r);
        av.style.setProperty("--pc", teamOf(p) || p.color || "#ff6b5e");
        const im = document.createElement("img");
        im.src = K.avatarUrl(p);
        im.alt = "";
        av.appendChild(im);
        const nm = div("nm", r);
        const b = document.createElement("b");
        b.textContent = p.name;
        nm.appendChild(b);
        r._st = document.createElement("small");
        nm.appendChild(r._st);
        r._pts = div("pts", r);
        rows.set(p.id, r);
        shown.set(p.id, p.score);
        return r;
      };
      const draw = () => {
        const ps = K.players().slice().sort((a, b) => b.score - a.score);
        for (const [id, r] of rows) if (!ps.some((p) => p.id === id)) {
          r.remove();
          rows.delete(id);
        }
        list.classList.toggle("many", ps.length > 6);
        list.classList.toggle("two", ps.length > 11);
        for (const p of ps.filter((x) => !x.out).concat(ps.filter((x) => x.out))) {
          const r = row(p);
          list.appendChild(r);
          r.classList.toggle("away", !!p.away);
          if (p.out) {
            r.classList.add("out");
            r._st.textContent = "💥 " + W2.out;
          } else if (!marked) {
            r.classList.remove("ok", "no");
            r.classList.toggle("in", pinned.has(p.id));
            r._st.textContent = p.away ? W2.away : pinned.has(p.id) ? "✓ " + W2.in : W2.wait;
          }
          r._pts.textContent = K.num(shown.get(p.id) != null ? shown.get(p.id) : p.score);
        }
        if (total) cnt.textContent = K.f("{n} of {total} pinned", { n: K.num([...pinned].length), total: K.num(total) });
      };
      const tr2 = () => __async(this, null, function* () {
        const x = yield K.tr("{n} of {total} pinned", { n: K.num(pinned.size), total: K.num(total) });
        cnt.textContent = x;
      });
      return {
        draw,
        start(n) {
          total = n;
          pinned.clear();
          marked = false;
          draw();
          tr2();
        },
        pin(id) {
          pinned.add(id);
          draw();
          tr2();
          const r = rows.get(id);
          if (r) r.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], { duration: 360 });
        },
        done() {
          cnt.textContent = "";
          for (const r of rows.values()) if (!r.classList.contains("ok") && !r.classList.contains("no") && !r.classList.contains("out")) r._st.textContent = "";
        },
        // (after the answer: ✓ or ✗ beside each name, with how far the pin was)
        mark(p, ok, text) {
          marked = true;
          const r = row(p);
          r.classList.remove("in");
          r.classList.toggle("ok", !!ok);
          r.classList.toggle("no", !ok);
          r._st.textContent = (ok ? "✓ " : "✗ ") + (text || "");
        },
        // (Knockout: out of the game)
        out(p) {
          const r = row(p);
          r.classList.remove("ok", "no", "in");
          r.classList.add("out");
          r._st.textContent = "💥 " + W2.out;
        },
        best(id) {
          for (const [k, r] of rows) r.classList.toggle("best", k === id);
        },
        // (the points go up on the board, counting)
        add(p, pts) {
          const r = row(p);
          const from = shown.get(p.id) || 0, to = p.score;
          if (pts > 0) {
            const pl = div("plus", r);
            pl.textContent = "+" + K.num(pts);
            setTimeout(() => pl.remove(), 2400);
          }
          const t0 = performance.now();
          const step = (t2) => {
            const k = Math.min(1, (t2 - t0) / 900);
            const v = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
            shown.set(p.id, v);
            r._pts.textContent = K.num(v);
            if (k < 1) requestAnimationFrame(step);
            else {
              shown.set(p.id, to);
              setTimeout(draw, 300);
            }
          };
          requestAnimationFrame(step);
        }
      };
    });
  }
  const PLANE_KINDS = ["jet", "banner", "paper", "route"];
  const PLANE_T = { jet: [2700, 1500], banner: [3300, 2e3], paper: [3400, 2100], route: [3600, 2600] };
  const PLANES = /* @__PURE__ */ (() => {
    let uid = 0;
    const esc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const BOO = (x, y, s, eye, extra) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-10 8V-2C-10-9-5.5-13 0-13S10-9 10-2V8C8 10 7 7 5 9S2 8 0 10-3 11-5 9-8 10-10 8Z" fill="#fff"/><ellipse cx="-3.6" cy="-3" rx="1.7" ry="2.3" fill="${eye}"/><ellipse cx="3.6" cy="-3" rx="1.7" ry="2.3" fill="${eye}"/>${extra || ""}</g>`;
    const FONT = `font-family="'BV Fun', ui-rounded, 'Segoe UI Rounded', sans-serif" font-weight="700"`;
    const lens = {};
    function lenOf(d) {
      if (lens[d]) return lens[d];
      let L = 0;
      try {
        const NS = "http://www.w3.org/2000/svg", s = document.createElementNS(NS, "svg"), p = document.createElementNS(NS, "path");
        s.setAttribute("width", "0");
        s.setAttribute("height", "0");
        s.style.position = "absolute";
        p.setAttribute("d", d);
        s.appendChild(p);
        document.body.appendChild(s);
        L = p.getTotalLength();
        s.remove();
      } catch (e) {
      }
      return lens[d] = L > 0 ? Math.ceil(L) : 4e3;
    }
    function jet() {
      const k = "wj" + ++uid;
      let win = "";
      for (let i = 0; i < 14; i++) {
        const x = 156 + i * 12.6;
        win += `<rect x="${(x - 2.6).toFixed(1)}" y="65.5" width="5.2" height="7.4" rx="2.6" fill="#1f2b52"/><rect x="${(x - 1.4).toFixed(1)}" y="66.4" width="1.5" height="2.6" rx=".75" fill="#9db4e6"/>`;
      }
      return `<svg viewBox="0 0 420 150" overflow="visible" xmlns="http://www.w3.org/2000/svg"><defs>
<linearGradient id="${k}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#f3f5fa"/><stop offset="1" stop-color="#c2cadd"/></linearGradient>
<linearGradient id="${k}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8b6bff"/><stop offset="1" stop-color="#4f31d8"/></linearGradient>
<linearGradient id="${k}t" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7a59ff"/><stop offset="1" stop-color="#4a2bd0"/></linearGradient>
<linearGradient id="${k}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6f8fc"/><stop offset="1" stop-color="#a9b3cb"/></linearGradient>
<linearGradient id="${k}e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdfdff"/><stop offset=".55" stop-color="#d6dbe8"/><stop offset="1" stop-color="#8c97b3"/></linearGradient>
<linearGradient id="${k}c" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".3" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
<linearGradient id="${k}n" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".55"/></linearGradient>
</defs>
<g class="wpl-trail"><rect x="-820" y="116.5" width="1022" height="4.4" rx="2.2" fill="url(#${k}c)"/><rect x="-760" y="108.5" width="952" height="3.2" rx="1.6" fill="url(#${k}c)" opacity=".6"/></g>
<path d="M136 59C112 44 90 26 70 11c-6-4-14-5-20-4l-6 1c-3 1-4 4-3 7l7 47z" fill="url(#${k}t)"/>
<path d="M136 59C112 44 90 26 70 11c-4-3-9-4-13-4 14 12 40 34 66 52z" fill="#fff" opacity=".13"/>
${BOO(78, 38, 1.05, "#4f31d8")}
<path d="M120 58h225c27 0 47 8 56 22-7 12-29 18-56 18H150c-40 0-78-10-108-26l-6-3 6-3c20-4 50-8 78-8z" fill="url(#${k}b)"/>
<path d="M398 86c-28 5-58 5-98 4l-60-1c-35-1-60-5-80-12-12-5-20-12-24-18h-16c-28 0-58 4-78 8l-6 3 6 3c30 16 68 26 108 26h195c23 0 41-4 53-12z" fill="url(#${k}v)"/>
<path d="M398 85c-28 5-58 5-98 4l-60-1c-35-1-60-5-80-12-12-5-20-12-24-18" fill="none" stroke="#ffc83d" stroke-width="1.8"/>
<path d="M150 98h195c24 0 42-4 54-12-10 10-30 13-54 13H150c-36 0-72-9-102-24 30 14 66 23 102 23z" fill="#1e1442" opacity=".25"/>
<path d="M152 59.6h190" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>
${win}
<rect x="337" y="62" width="9" height="21" rx="2.6" fill="none" stroke="#c4cbdc" stroke-width="1.2"/>
<path d="M367 66l18 4c3 1 5 3 4 5l-20-1z" fill="#18213f"/><path d="M370 67.6l12 2.6" stroke="#8aa6e0" stroke-width="1.2" stroke-linecap="round"/>
<path d="M98 76 58 78 22 92c-4 2-2 5 2 5h12z" fill="url(#${k}w)" stroke="#8f9ab6" stroke-width=".8"/>
<path d="M262 94 186 138c-4 3-10 4-14 2l-4-2 34-42z" fill="url(#${k}w)" stroke="#8f9ab6" stroke-width=".8"/>
<path d="M262 94 186 138" stroke="#fff" stroke-width="1.4" opacity=".8"/>
<path d="M170 139l-10-12c-1-2 1-3 3-2l13 12z" fill="#ffc83d"/>
<path d="M238 110l6-7h18l-6 7z" fill="#bcc4d7"/>
<path d="M222 108h46c9 0 15 4 15 10s-6 10-15 10h-46c-6 0-10-4-10-10s4-10 10-10z" fill="url(#${k}e)" stroke="#8c97b3" stroke-width=".8"/>
<rect x="246" y="108.4" width="7" height="19.2" fill="#6b4cff" opacity=".9"/>
<path d="M212 111l-12 3v8l12 3z" fill="#69738f"/>
<ellipse cx="282.4" cy="118" rx="3" ry="9.6" fill="#1b2442"/><path d="M272 111.5h8" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>
<path d="M345 58c27 0 47 8 56 22-4-6-16-14-40-17z" fill="url(#${k}n)"/>
</svg>`;
    }
    function banner(label, rtl) {
      const k = "wb" + ++uid;
      const cloth = (a, b) => `M-40 ${64 + a}C-120 ${56 - a} -200 ${72 + a} -280 ${64 - a}C-340 ${58 + a} -392 ${68 - a} -420 ${64 + b}L-429 ${73 + b}-420 ${82 + b}-429 ${91 + b}-420 ${100 + b}-429 ${109 + b}-420 ${118 + b}-428 ${124 + b}C-392 ${128 - a} -340 ${118 + a} -280 ${124 - a}C-200 ${132 + a} -120 ${118 - a} -40 ${124 + a}Z`;
      const mid = (a) => rtl ? `M50 ${101 + a * 0.3}C90 ${106 - a * 0.4} 150 ${97 + a * 0.4} 205 ${102 - a * 0.4}C270 ${108 + a * 0.5} 340 ${97 - a * 0.5} 404 ${103 + a * 0.4}` : `M-404 ${103 + a * 0.4}C-340 ${97 - a * 0.5} -270 ${108 + a * 0.5} -205 ${102 - a * 0.4}C-150 ${97 + a * 0.4} -90 ${106 - a * 0.4} -50 ${101 + a * 0.3}`;
      const W2 = (a, b) => `${cloth(0, 0)};${cloth(a, b)};${cloth(-a * 0.8, -b * 0.7)};${cloth(0, 0)}`;
      const anim = `<animate attributeName="d" values="${W2(5, 3)}" dur="1.3s" repeatCount="indefinite"/>`;
      const scarf = ["M116 60c-12-1-22-8-36-7-9 1-16-4-23-3l2 6c9-1 15 4 24 3 12-1 22 6 33 6z", "M116 60c-12-3-22-4-36-7-9-2-16 1-23-2l2 6c9 2 15 0 24 3 12 3 22 3 33 5z", "M116 60c-12 0-22-10-36-9-9 0-16-2-23-1l2 6c9 0 15 2 24 1 12 0 22 8 33 8z"];
      return `<svg viewBox="${rtl ? "-300" : "-440"} 0 740 170" overflow="visible" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs>
<linearGradient id="${k}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf7"/><stop offset=".55" stop-color="#f6e6c4"/><stop offset="1" stop-color="#e0bf88"/></linearGradient>
<linearGradient id="${k}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff7684"/><stop offset="1" stop-color="#cc2a40"/></linearGradient>
<linearGradient id="${k}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#d9dde6"/><stop offset="1" stop-color="#8f96a8"/></linearGradient>
<linearGradient id="${k}f" x1="0" y1="0" x2="1" y2="0" spreadMethod="repeat"><stop offset="0" stop-color="#4a2a10" stop-opacity=".1"/><stop offset=".25" stop-color="#4a2a10" stop-opacity="0"/><stop offset=".55" stop-color="#4a2a10" stop-opacity=".08"/><stop offset=".8" stop-color="#4a2a10" stop-opacity="0"/><stop offset="1" stop-color="#4a2a10" stop-opacity=".1"/>
<animateTransform attributeName="gradientTransform" type="translate" values="0 0;.3 0;0 0" dur="1.3s" repeatCount="indefinite"/></linearGradient>
<path id="${k}m" d="${mid(0)}"><animate attributeName="d" values="${mid(0)};${mid(5)};${mid(-4)};${mid(0)}" dur="1.3s" repeatCount="indefinite"/></path>
</defs><g${rtl ? ' transform="scale(-1 1)"' : ""}>
<path d="M38 92c-28 12-52 12-70 4" fill="none" stroke="#f3e6cf" stroke-width="1.8"/>
<path d="M-32 96-36 64M-32 96l-4 26" stroke="#f3e6cf" stroke-width="1.2"/>
<path d="${cloth(0, 0)}" fill="#fffaf0">${anim}</path>
<path d="${cloth(0, 0)}" fill="url(#${k}f)">${anim}</path>
<path d="${cloth(0, 0)}" fill="none" stroke="#e8434f" stroke-width="5">${anim}</path>
<path d="M-36 60v66" stroke="#6b4a2b" stroke-width="5" stroke-linecap="round"/>
<path d="M54 84 38 46c-1-5 4-8 9-6l43 34z" fill="url(#${k}r)"/><path d="M44 50l32 24" stroke="#fff" stroke-width="3.4" opacity=".9"/>
<path d="M228 58c12 0 18 10 18 28s-6 28-18 28l-88-2c-40-2-74-12-100-20l-4-10c26-8 64-18 104-20z" fill="url(#${k}c)"/>
<path d="M246 92c-16 3-76 6-106 6-36 0-70-6-102-12v4c32 6 66 12 102 12 30 0 90-3 105-6z" fill="#e8434f"/>
<path d="M200 66v44M160 64v46M118 68v38M84 74v26" stroke="#d6b984" stroke-width="1"/>
<g fill="#c4a06a"><circle cx="196" cy="70" r="1.2"/><circle cx="196" cy="106" r="1.2"/><circle cx="156" cy="69" r="1.2"/><circle cx="156" cy="106" r="1.2"/><circle cx="114" cy="72" r="1.2"/><circle cx="114" cy="103" r="1.2"/></g>
<circle cx="178" cy="81" r="11.5" fill="#6b4cff" stroke="#fff" stroke-width="2.6"/>${BOO(178, 82, 0.62, "#6b4cff")}
<path d="M52 92 20 103c-4 2-2 6 3 5l65-10z" fill="url(#${k}r)"/>
<ellipse cx="129" cy="62" rx="19" ry="4.2" fill="#4a2e1a"/>
<path d="${scarf[0]}" fill="#ffc83d"><animate attributeName="d" values="${scarf[0]};${scarf[1]};${scarf[2]};${scarf[0]}" dur=".7s" repeatCount="indefinite"/></path>
<path d="M113 64c0-18 7-28 16-28s16 10 16 28z" fill="#fff"/>
<path d="M139 40c4 5 6 13 6 24h-6c0-10-1-18 0-24z" fill="#e6e1f5" opacity=".7"/>
<ellipse cx="113.5" cy="51" rx="3.2" ry="5.5" fill="#7a4c28"/><ellipse cx="144.5" cy="51" rx="3.2" ry="5.5" fill="#7a4c28"/>
<path d="M112 50c1-12 8-19 17-19s16 7 17 18c-6-5-28-5-34 1z" fill="#8a5a33"/>
<path d="M114 44c6-3 24-3 30 0" stroke="#5a3a24" stroke-width="2.2" fill="none"/>
<circle cx="123" cy="42.5" r="4.8" fill="#a9e6ff" stroke="#5a3a24" stroke-width="2.2"/><circle cx="135" cy="42.5" r="4.8" fill="#a9e6ff" stroke="#5a3a24" stroke-width="2.2"/>
<circle cx="121.8" cy="41.2" r="1.4" fill="#fff"/><circle cx="133.8" cy="41.2" r="1.4" fill="#fff"/>
<ellipse cx="124" cy="52.5" rx="2" ry="2.6" fill="#2a1d55"/><ellipse cx="134" cy="52.5" rx="2" ry="2.6" fill="#2a1d55"/>
<ellipse cx="119" cy="57.5" rx="2.8" ry="1.6" fill="#ff9fb8" opacity=".75"/><ellipse cx="139" cy="57.5" rx="2.8" ry="1.6" fill="#ff9fb8" opacity=".75"/>
<path d="M126 57.5c1.6 1.8 4.4 1.8 6 0" fill="none" stroke="#2a1d55" stroke-width="1.6" stroke-linecap="round"/>
<path d="M146 63l8-12c1-2 4-2 4 1l-2 11z" fill="#d6f0ff" stroke="#fff" stroke-width="1" opacity=".9"/>
<path d="M172 50l8 14M236 50l-10 12M172 50l54 12" stroke="#9c2a38" stroke-width="2.4" stroke-linecap="round"/>
<path d="M150 44c25-10 86-10 106 0-2 6-78 8-106 6z" fill="url(#${k}r)"/>
<path d="M156 41.5c28-6 76-6 96 0" stroke="#fff" stroke-width="1.6" opacity=".65" fill="none"/>
<path d="M228 58c24 0 38 12 38 28s-14 28-38 28c-6-12-8-20-8-28s2-16 8-28z" fill="url(#${k}r)"/>
<path d="M232 60c18 2 30 12 32 24" stroke="#fff" stroke-width="2" opacity=".35" fill="none"/>
<path d="M226 104h13M225 99h12" stroke="#5c1b25" stroke-width="2.2" stroke-linecap="round"/>
<path d="M266 77c14 2 20 7 20 9s-6 7-20 9z" fill="url(#${k}s)"/>
<g class="wpl-prop"><ellipse cx="286" cy="86" rx="5.5" ry="46" fill="#fff" opacity=".14"/><rect x="283.4" y="40" width="5.2" height="92" rx="2.6" fill="#2f3140"/></g>
<path d="M206 112l6 14M218 112l-6 14" stroke="#7f8494" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="212" cy="131" r="11" fill="#2b2c36"/><circle cx="212" cy="131" r="4" fill="#c9ccd6"/>
<path d="M198 128c0-9 10-12 20-10 9 2 10 11 4 15h-20c-3-1-4-3-4-5z" fill="url(#${k}c)" stroke="#e8434f" stroke-width="1.6"/>
<circle cx="46" cy="97" r="4" fill="#2b2c36"/>
</g>
<text ${FONT} font-size="34" fill="#2a1d55" text-anchor="middle"><textPath href="#${k}m" xlink:href="#${k}m" startOffset="50%">${esc(label)}</textPath></text>
</svg>`;
    }
    const R3 = "M-180 790C140 720 400 560 640 540C830 524 960 450 930 340C902 240 770 222 720 296C670 370 750 470 920 470C1170 470 1520 330 2120 230";
    function paper() {
      const k = "wp" + ++uid, L = lenOf(R3);
      const dur = "3s", kt = "0;.12;.3;.667;.85;1", kp = "0;.08;.3;.6;.82;1", off = [1, 0.92, 0.7, 0.4, 0.18, 0].map((f) => Math.round(f * L)).join(";");
      let grid = "";
      for (let x = -72; x <= 92; x += 13) grid += `<path d="M${x} -42V42"/>`;
      for (let y = -36; y <= 36; y += 10) grid += `<path d="M-80 ${y}H96"/>`;
      const spark = (x, y, t, s) => `<g transform="translate(${x} ${y}) scale(${s})" opacity="0"><path d="M0-12C1-3 3-1 12 0 3 1 1 3 0 12-1 3-3 1-12 0-3-1-1-3 0-12z" fill="#ffe08a"/><animate attributeName="opacity" values="0;1;0" begin="${t}s" dur=".7s" fill="freeze"/><animateTransform attributeName="transform" type="scale" additive="sum" values=".3;1.2;.5" begin="${t}s" dur=".7s" fill="freeze"/></g>`;
      return `<svg class="wpl-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>
<mask id="${k}m" maskUnits="userSpaceOnUse" x="-300" y="-100" width="2600" height="1300"><path d="${R3}" fill="none" stroke="#fff" stroke-width="44" stroke-dasharray="${L} ${L}" stroke-dashoffset="${L}">
<animate attributeName="stroke-dashoffset" values="${off}" keyTimes="${kt}" dur="${dur}" fill="freeze" calcMode="linear"/></path></mask>
<clipPath id="${k}w"><path d="M92 0-70-38-48-6zM92 0-78 36-44 8z"/></clipPath>
<filter id="${k}d" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="7"/><feOffset dy="12"/><feComponentTransfer><feFuncA type="linear" slope=".38"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g class="wpl-fade"><path d="${R3}" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-dasharray=".1 19" opacity=".85" mask="url(#${k}m)"/>
${spark(990, 300, 1, 1)}${spark(800, 196, 1.35, 1.25)}${spark(680, 330, 1.7, 0.9)}</g>
<g filter="url(#${k}d)"><g><animateMotion dur="${dur}" path="${R3}" rotate="auto" fill="freeze" keyPoints="${kp}" keyTimes="${kt}" calcMode="linear"/>
<g transform="scale(1.9)">
<path d="M92 0-70-38-48-6z" fill="#ece3cb"/>
<path d="M92 0-46 8-58 24z" fill="#c9b78f"/>
<path d="M92 0-78 36-44 8z" fill="#fffaf0"/>
<g clip-path="url(#${k}w)"><g stroke="#5f93d0" stroke-width=".8" opacity=".5" fill="none">${grid}</g>
<path d="M-40-26c9-7 25-5 30 3s-5 14-16 13-21-9-14-16zM2 12c11-3 27 2 29 10s-11 9-20 6-16-14-9-16zM38-8c7-3 16-1 17 4s-7 7-12 5-8-6-5-9zM-58 22c6-3 14 0 14 5s-8 5-12 3-5-6-2-8z" fill="#86c79b" stroke="#5aa477" stroke-width=".7" opacity=".85"/>
<path d="M-50 28C-20 14 14 12 48 5" fill="none" stroke="#e8434f" stroke-width="1.8" stroke-dasharray="3.5 3"/><circle cx="50" cy="4.6" r="2.6" fill="#e8434f" stroke="#fff" stroke-width="1"/></g>
<path d="M92 0H-48" stroke="#b8a57c" stroke-width="1.3"/>
<path d="M92 0-78 36M92 0-70-38" stroke="#fff" stroke-width="1.3" opacity=".85"/>
<g transform="translate(-16 -15) rotate(6)">${BOO(0, 0, 1.15, "#2a1d55", '<ellipse cx="-6" cy="2" rx="2" ry="1.2" fill="#ff9fb8" opacity=".8"/><ellipse cx="6" cy="2" rx="2" ry="1.2" fill="#ff9fb8" opacity=".8"/>')}<path d="M9-3c4-6 9-9 13-8" stroke="#fff" stroke-width="3.6" stroke-linecap="round" fill="none"/></g>
</g></g></g>
</svg>`;
    }
    const R4 = "M240 840C540 380 920 230 1180 330";
    function route(label, rtl) {
      const k = "wr" + ++uid, t = esc(label), L = lenOf(R4);
      const fly = 2.3, ease = 'keyTimes="0;1" keySplines=".45 .05 .35 1" calcMode="spline"';
      const pin = "M0-48c-16 0-28 12-28 27 0 19 28 43 28 43s28-24 28-43c0-15-12-27-28-27z";
      const draw = `stroke-dasharray="${L} ${L}" stroke-dashoffset="${L}"><animate attributeName="stroke-dashoffset" from="${L}" to="0" dur="${fly}s" fill="freeze" ${ease}/>`;
      return `<svg class="wpl-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>
<linearGradient id="${k}g" gradientUnits="userSpaceOnUse" x1="240" y1="840" x2="1180" y2="330"><stop offset="0" stop-color="#9b7bff"/><stop offset=".55" stop-color="#ff7ab6"/><stop offset="1" stop-color="#ffc83d"/></linearGradient>
<filter id="${k}b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="9"/></filter>
<filter id="${k}p" x="-80%" y="-80%" width="260%" height="260%"><feFlood flood-color="#ffc83d" flood-opacity=".8"/><feComposite operator="in" in2="SourceAlpha"/><feGaussianBlur stdDeviation="6"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="${k}s" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dy="6"/><feComponentTransfer><feFuncA type="linear" slope=".4"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<g class="wpl-fade">
<path d="${R4}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="10 14" opacity=".22"/>
<path d="${R4}" fill="none" stroke="url(#${k}g)" stroke-width="18" stroke-linecap="round" opacity=".5" filter="url(#${k}b)" ${draw}</path>
<path d="${R4}" fill="none" stroke="url(#${k}g)" stroke-width="6" stroke-linecap="round" ${draw}</path>
<g transform="translate(240 840)"><circle r="12" fill="none" stroke="#9b7bff" stroke-width="3"><animate attributeName="r" values="12;48" dur="1.3s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.3s" repeatCount="indefinite"/></circle><circle r="11" fill="#9b7bff" stroke="#fff" stroke-width="4"/></g>
<g transform="translate(1180 330)"><g opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${(fly - 0.2).toFixed(2)}s" dur=".2s" fill="freeze"/>
<ellipse cx="0" cy="24" rx="22" ry="7" fill="#000" opacity=".3"/>
<circle cy="24" r="10" fill="none" stroke="#ffc83d" stroke-width="3" opacity="0"><animate attributeName="r" values="10;64" begin="${(fly + 0.25).toFixed(2)}s" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" begin="${(fly + 0.25).toFixed(2)}s" dur="1.1s" repeatCount="indefinite"/></circle>
<g filter="url(#${k}s)"><animateTransform attributeName="transform" type="translate" values="0 -70;0 0;0 -10;0 0" keyTimes="0;.55;.8;1" begin="${(fly - 0.2).toFixed(2)}s" dur=".6s" fill="freeze"/>
<path d="${pin}" fill="#ffc83d" stroke="#fff" stroke-width="4"/><circle cy="-21" r="10" fill="#fff"/>
${t ? `<g class="wpl-label" transform="translate(0 -100)${rtl ? " scale(-1 1)" : ""}"><rect x="-75" y="-28" width="150" height="56" rx="28" fill="#fff"/><text y="10" text-anchor="middle" ${FONT} font-size="30" fill="#2a1d55">${t}</text></g>` : ""}
</g></g></g>
</g>
<g filter="url(#${k}p)"><g><animateMotion dur="${fly}s" path="${R4}" rotate="auto" fill="freeze" keyPoints="0;1" ${ease}/>
<animate attributeName="opacity" values="1;0" begin="${(fly - 0.25).toFixed(2)}s" dur=".3s" fill="freeze"/>
<g><animateTransform attributeName="transform" type="scale" values=".9;1.35;.7" keyTimes="0;.5;1" dur="${fly}s" fill="freeze"/>
<path d="M50 0c0-4-4-7-11-7L-36-6c-8 0-14 3-14 6s6 6 14 6l75 1c7 0 11-3 11-7z" fill="#fff"/>
<path d="M14-5-12-50c-1-2-4-3-6-3h-6l10 48zM14 5-12 50c-1 2-4 3-6 3h-6l10-48z" fill="#fff"/>
<path d="M-30-4-42-22c-1-1-2-2-4-2h-4l6 20zM-30 4-42 22c-1 1-2 2-4 2h-4l6-20z" fill="#fff"/>
<rect x="-6" y="-27" width="15" height="6" rx="3" fill="#ffc83d"/><rect x="-6" y="21" width="15" height="6" rx="3" fill="#ffc83d"/>
<path d="M38-3.5h6" stroke="#5a3ce6" stroke-width="2.4" stroke-linecap="round"/>
</g></g></g>
</svg>`;
    }
    return { jet, banner, paper, route };
  })();
  const PLANE_FX = { jet: [["plane", 0]], banner: [["plane", 0], ["flutter", 700]], paper: [["whoosh", 0], ["sparkle", 1150]], route: [["whoosh", 0], ["ping", 2150]] };
  function plane(ctx, kind, label) {
    for (const [nm, d] of PLANE_FX[kind]) ctx.fx(nm, d);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return 700;
    const rtl = document.body.classList.contains("rtl");
    const wrap = div("wpl wpl-" + kind + (rtl ? " rtl" : ""), document.body, PLANES[kind](label, rtl));
    const lab = wrap.querySelector(".wpl-label");
    if (lab) {
      try {
        const w = Math.max(150, Math.ceil(lab.querySelector("text").getComputedTextLength()) + 60), r = lab.querySelector("rect");
        r.setAttribute("x", String(-w / 2));
        r.setAttribute("width", String(w));
      } catch (e) {
      }
    }
    setTimeout(() => wrap.remove(), PLANE_T[kind][0]);
    return PLANE_T[kind][1];
  }
  function screen(K, ctx, it, i, n, ph, decks, o) {
    return __async(this, null, function* () {
      o = o || {};
      const body = K.view(null);
      body.classList.add("wq");
      const top = div("wq-top", body);
      const pill = div("wq-pill", top);
      const ic = document.createElement("img");
      ic.src = "icons/world.webp";
      ic.alt = "";
      pill.appendChild(ic);
      const rt = yield K.tr("Round {n} / {total}", { n: "", total: K.num(n) });
      const [ra, rb] = rt.split("");
      const lab = document.createElement("span");
      lab.append(ra || "");
      const em = document.createElement("em");
      em.textContent = K.num(i + 1);
      lab.appendChild(em);
      const of = document.createElement("span");
      of.className = "of";
      of.textContent = rb || "";
      lab.appendChild(of);
      pill.appendChild(lab);
      const segs = div("wq-segs", top);
      for (let k = 0; k < n; k++) {
        const s = document.createElement("i");
        if (k < i) s.className = "done";
        if (k === i) s.className = "now";
        segs.appendChild(s);
      }
      const ck = clock(top, ctx.sec, (nm) => ctx.fx(nm), () => !!(K.paused && K.paused()));
      if (o.dbl) {
        const x2 = div("wq-x2", top);
        x2.textContent = "×2 " + (yield K.tr("Double points!"));
      }
      const mid = div("wq-mid", body);
      const stage = div("wq-stage", mid);
      const side = div("wq-side", mid);
      const bd = yield board(K, side, ctx.teamOf);
      const host = div("sc", stage);
      const c = { K, it, photo: ph, flag: it.kind === "flag" ? W.flagImg(it.cc) : null, fx: (nm, d, o2) => ctx.fx(nm, d, o2), U: ctx.U, stage, untitled: ctx.untitled };
      let kind, name;
      if (it.kind === "flag") {
        kind = "FLAG";
        name = decks.flag();
        const [w, h] = yield c.flag.size;
        host.style.setProperty("--ar", String(Math.max(0.9, Math.min(2.2, w / h))));
      } else if (ph && (it.kind === "sight" || Math.random() < 0.72)) {
        kind = "PHOTO";
        name = decks.photo();
      } else {
        kind = "PLACE";
        name = it.kind === "sight" ? decks.drawnSight() : decks.place();
      }
      host.classList.add({ FLAG: "sf-", PHOTO: "sp-", PLACE: "sc-" }[kind] + name);
      const look = SC[kind][name](host, c) || {};
      if (look.stage) stage.classList.add(look.stage);
      if (look.side) stage.classList.add("side");
      const q = div("wq-q", stage);
      if (look.neon) q.classList.add("neon");
      if (look.color) q.style.setProperty("--qc", look.color);
      if (it.kind === "flag") q.textContent = yield K.tr("Where is this flag's country?");
      else {
        const t = yield K.tr(W.plural(it, K.lang) ? "Where are {place}?" : "Where is {place}?", { place: "" });
        const nm = t.startsWith("") ? W.cap(W.nameIn(it, K.lang)) : W.nameIn(it, K.lang);
        const [a, b] = t.split("");
        q.append(a || "");
        const e = document.createElement("em");
        e.textContent = nm + (/^[\s?؟？!।]*$/.test(b || "") ? b || "" : "");
        q.appendChild(e);
        if (!/^[\s?؟？!।]*$/.test(b || "")) q.append(b);
        const len = [...(a || "") + nm + (b || "")].length;
        if (len > 34) q.classList.add("xlong");
        else if (len > 22) q.classList.add("long");
      }
      q.dir = "auto";
      if (it.kind === "flag") {
        stage.classList.add("flagq");
        stage.insertBefore(q, host);
        const tip = div("wq-tip", stage, '<svg viewBox="0 0 64 84"><path d="M32 83C32 83 5 53 5 31.5A27 27 0 1 1 59 31.5C59 53 32 83 32 83Z" fill="#ff5a6e"/><circle cx="32" cy="31" r="11" fill="#fff"/></svg>');
        tip.append(yield K.tr("Drop a pin on the map on your phone"));
      }
      if (ph && kind === "PHOTO") {
        const cr = div("wq-credit", stage);
        cr.textContent = "📷 " + ph.credit;
      }
      if (o.zoom) {
        host.classList.add("zoomq");
        host.style.setProperty("--zt", Math.max(5, ctx.sec || 30) + "s");
        const fx = ph && ph.fx != null ? ph.fx : 0.5;
        host.style.setProperty("--zx", (fx * 100).toFixed(0) + "%");
      }
      const hints = div("wq-hints", stage);
      return { body, stage, host, q, hints, board: bd, clock: ck, segs };
    });
  }
  function hintsFor(K, ctx, it, lg) {
    return __async(this, null, function* () {
      const out = [];
      const nm = (n2) => W.cap(n2);
      if (it.kind === "state") {
        const reg = { W: "West", MW: "Midwest", S: "South", NE: "Northeast" }[it.region];
        if (reg) out.push({ icon: "🧭", text: yield trIn(K, lg, "Region: {place}", { place: yield trIn(K, lg, reg) }) });
        return out;
      }
      const cont = it.cont && W.CONT[it.cont];
      if (cont) {
        const lp = lg && lg !== K.lang ? window.BVI18N && BVI18N.packs(lg) : K.packs;
        const i = BVPACKS.continents.findIndex((c) => c[0] === cont);
        const cn = lp && lp.continents && lp.continents[i] || (yield trIn(K, lg, cont));
        out.push({ icon: "🌍", text: yield trIn(K, lg, "Continent: {place}", { place: cn }) });
      }
      if (it.kind === "flag") {
        const near = ctx.D.near && ctx.D.near[it.cc] || [];
        const nb = near.length ? ctx.byCode.get(W.pick(near)) : null;
        if (nb) out.push({ icon: "🤝", flag: W.flagImg(nb.cc).src, text: yield trIn(K, lg, "Neighbor: {place}", { place: nm(W.nameIn(nb, lg || K.lang)) }) });
        const own = String(W.nameIn(it, lg || K.lang)).replace((lg || K.lang) === "ar" ? /^ال/ : /^$/, "");
        let first = own;
        try {
          if (window.Intl && Intl.Segmenter) for (const g of new Intl.Segmenter(void 0, { granularity: "grapheme" }).segment(own)) {
            first = g.segment;
            break;
          }
          else first = [...own][0];
        } catch (e) {
          first = [...own][0];
        }
        out.push({ icon: "🔤", text: yield trIn(K, lg, "First letter: {c}", { c: W.cap(first) }) });
      } else if (it.cc && ctx.byCode.get(it.cc) && !W.NOCOUNTRY.has(it.id)) {
        const co = ctx.byCode.get(it.cc);
        out.push({ icon: "📍", flag: W.flagImg(co.cc).src, text: yield trIn(K, lg, "Country: {place}", { place: nm(W.nameIn(co, lg || K.lang)) }) });
      }
      return out;
    });
  }
  function showHint(v, h) {
    const tip = v.stage.querySelector(".wq-tip");
    if (tip) tip.classList.add("gone");
    const c = div("wq-hint", v.hints);
    if (h.flag) {
      const im = document.createElement("img");
      im.src = h.flag;
      im.alt = "";
      c.appendChild(im);
    } else {
      const i = document.createElement("i");
      i.textContent = h.icon;
      c.appendChild(i);
    }
    const t = document.createElement("span");
    t.textContent = h.text;
    t.dir = "auto";
    c.appendChild(t);
  }
  function reveal(K, ctx, it, got, v, rd) {
    return __async(this, null, function* () {
      const s = K.settings, U = ctx.U;
      const D2 = ctx.D;
      v.stage.textContent = "";
      v.stage.className = "wq-stage map";
      const wrap = div("wq-map", v.stage);
      const map = M.create(wrap, { maxS: 2.3 });
      const box = ctx.areaBox;
      map.fit(box, { pad: U * 2 });
      const [ax, ay] = M.xy(it.lon, it.lat);
      const scale = ctx.us ? 450 : s.map === "world" ? 1900 : 900;
      const pins = [];
      for (const [id, a] of got) {
        const p = K.player(id);
        if (!p || !Array.isArray(a.v)) continue;
        const lon = +a.v[0], lat = +a.v[1];
        if (!(Math.abs(lon) <= 180 && Math.abs(lat) <= 90)) continue;
        const d = distance(D2, it, lon, lat);
        pins.push({ p, lon, lat, d, xy: M.xy(lon, lat), ms: a.ms || 0, marks: [] });
      }
      pins.sort((a, b) => a.d - b.d || a.ms - b.ms);
      const best = pins.length ? pins[0].d : Infinity;
      for (const x of pins) {
        x.tier = tierOf(x.d, scale);
        x.ok = it.kind === "flag" ? x.d <= 25 : x.d <= ctx.rightKm;
        x.base = ctx.mode === "bullseye" ? x.d <= best + 0.5 ? 100 : 0 : Math.round(100 * Math.exp(-x.d / scale));
        x.fast = ctx.speed && ctx.sec > 0 ? Math.round(50 * Math.max(0, 1 - x.ms / (ctx.sec * 1e3)) * x.base / 100) : 0;
        x.p.streak = x.ok ? (x.p.streak || 0) + 1 : 0;
        x.hot = ctx.streak && x.ok && x.p.streak >= 3 ? 50 : 0;
        x.pts = (x.base + x.fast + x.hot) * (rd.dbl ? 2 : 1);
      }
      for (const p of K.players()) if (!pins.some((x) => x.p === p)) p.streak = 0;
      const units = s.units === "km" ? "km" : "mi";
      const distTxt = (d, lg) => trIn(K, lg, units === "km" ? "{n} km" : "{n} mi", { n: K.num(Math.round(units === "km" ? d : d * KM_MI)) });
      let showAns = false;
      const place = (x, mx, my) => {
        x.dxy = [mx, my];
        for (const m of x.marks) m.move(mx, my);
        const far = Math.hypot(mx - x.xy[0], my - x.xy[1]) * map.view.s > U * 0.6;
        if (x.lead) {
          x.lead.setAttribute("x2", mx);
          x.lead.setAttribute("y2", my);
          x.lead.style.opacity = far ? "" : "0";
        }
        if (x.dot) x.dot.node.style.opacity = far ? "" : "0";
      };
      const glide = (x, mx, my, ms) => {
        const [fx, fy] = x.dxy || x.xy;
        if (!ms || Math.hypot(mx - fx, my - fy) * map.view.s < 1) {
          place(x, mx, my);
          return;
        }
        const t0 = performance.now();
        const step = (t) => {
          if (!wrap.isConnected) return;
          const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3);
          place(x, fx + (mx - fx) * e, fy + (my - fy) * e);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      };
      const layout = (ms) => {
        if (!pins.length || !wrap.isConnected) return;
        const [bw, bh] = map.size(), gap = U * 0.5, edge = U * 1.2;
        const items = pins.map((x, i) => {
          const [sx, sy] = map.toScreen(x.xy[0], x.xy[1]);
          const pw = 5.6 * U, ph = 7.4 * U;
          let l = -pw / 2, r = pw / 2, t = -ph, b = 0;
          if (x.tag) {
            const tw = x.tag.offsetWidth, th = x.tag.offsetHeight;
            l = Math.min(l, -tw / 2);
            r = Math.max(r, tw / 2);
            b = 0.8 * U + th;
          }
          if (x.crown) t = -11.8 * U;
          if (x.say) {
            const sw = x.say.offsetWidth;
            t = (x.crown ? -19.6 : -16.8) * U;
            l = Math.min(l, -sw / 2);
            r = Math.max(r, sw / 2);
          }
          const a = i * 2.39996, k = i ? U * 0.4 * Math.sqrt(i) : 0;
          return { x, sx, sy, px: sx + Math.cos(a) * k, py: sy + Math.sin(a) * k, l, r, t, b, off: sx < 0 || sx > bw || sy < 0 || sy > bh };
        });
        const vis = items.filter((A) => !A.off);
        for (const A of items) if (A.off) {
          A.px = A.sx;
          A.py = A.sy;
        }
        const wr = wrap.getBoundingClientRect(), obst = [];
        for (const e of v.stage.querySelectorAll(".wq-sum, .wq-next, .wq-out")) {
          const r = e.getBoundingClientRect();
          if (r.width) obst.push([r.left - wr.left, r.top - wr.top, r.right - wr.left, r.bottom - wr.top]);
        }
        let ab = null;
        if (showAns) {
          const [qx, qy] = map.toScreen(ax, ay);
          ab = [qx - 6 * U, qy - 16 * U, qx + 6 * U, qy + U];
          const tg = wrap.querySelector(".wq-tag");
          if (tg) {
            const tw = tg.offsetWidth / 2;
            ab[0] = Math.min(ab[0], qx - tw);
            ab[2] = Math.max(ab[2], qx + tw);
          }
        }
        const apart = (rounds) => {
          for (let n = 0; n < rounds; n++) {
            let moved = false;
            for (let i = 0; i < vis.length; i++) {
              const A = vis[i];
              for (let j = i + 1; j < vis.length; j++) {
                const B = vis[j];
                const ox = Math.min(A.px + A.r, B.px + B.r) - Math.max(A.px + A.l, B.px + B.l) + gap;
                const oy = Math.min(A.py + A.b, B.py + B.b) - Math.max(A.py + A.t, B.py + B.t) + gap;
                if (ox <= 0 || oy <= 0) continue;
                moved = true;
                if (ox < oy) {
                  const d = ox / 2 * (Math.sign(A.px - B.px) || (j % 2 ? 1 : -1));
                  A.px += d;
                  B.px -= d;
                } else {
                  const d = oy / 2 * (Math.sign(A.py - B.py) || (j % 2 ? 1 : -1));
                  A.py += d;
                  B.py -= d;
                }
              }
              for (const o of ab ? obst.concat([ab]) : obst) {
                const ox = Math.min(A.px + A.r, o[2]) - Math.max(A.px + A.l, o[0]) + gap, oy = Math.min(A.py + A.b, o[3]) - Math.max(A.py + A.t, o[1]) + gap;
                if (ox > 0 && oy > 0) {
                  moved = true;
                  if (ox < oy) A.px += ox * (A.px >= (o[0] + o[2]) / 2 ? 1 : -1);
                  else A.py += oy * (A.py >= (o[1] + o[3]) / 2 ? 1 : -1);
                }
              }
            }
            for (const A of vis) {
              A.px = Math.max(edge - A.l, Math.min(bw - edge - A.r, A.px));
              A.py = Math.max(edge - A.t, Math.min(bh - edge - A.b, A.py));
            }
            if (!moved) return true;
          }
          return false;
        };
        apart(500);
        for (let k = 0; k < 24; k++) {
          for (const A of vis) {
            A.px += (A.sx - A.px) * 0.12;
            A.py += (A.sy - A.py) * 0.12;
          }
          apart(60);
        }
        apart(800);
        for (const A of items) {
          const [mx, my] = map.toMap(A.px, A.py);
          glide(A.x, mx, my, ms == null ? 450 : ms);
        }
      };
      yield K.sleep(500);
      const order = W.shuffle(pins);
      for (const x of order) {
        if (K.over()) return pins;
        const col = ctx.teamOf(x.p) || x.p.color;
        x.lead = map.line(x.xy[0], x.xy[1], x.xy[0], x.xy[1], { stroke: "#fff", "stroke-width": String(Math.max(1.5, U * 0.22)), opacity: ".75" });
        const dt = div("wq-dot");
        dt.style.setProperty("--pc", col);
        x.dot = map.add(dt, x.xy[0], x.xy[1]);
        x.dot.node.style.opacity = "0";
        const el = M.pin({ color: col, img: K.avatarUrl(x.p), cls: "wq-pin wq-drop" });
        x.pin = el;
        x.marks.push(map.add(el, x.xy[0], x.xy[1]));
        x.dxy = x.xy.slice();
        ctx.fx("pop", 0, { rate: 0.85 + Math.random() * 0.5 });
        yield K.sleep(Math.max(90, 520 / Math.max(1, pins.length)));
      }
      layout(380);
      ctx.fx("drumroll");
      yield K.sleep(1750);
      if (K.over()) return pins;
      ctx.fx("land");
      if (it.kind === "flag" && D2.shapes && D2.shapes[it.cc]) {
        const g = map.shape(D2.shapes[it.cc], { fill: "rgba(255,200,61,.42)", stroke: "#ffd166", "stroke-width": String(Math.max(2, U * 0.35)), "stroke-linejoin": "round" });
        g.style.filter = "drop-shadow(0 0 " + U * 1.2 + "px rgba(255,200,61,.9))";
        g.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0.65 }, { opacity: 1 }], { duration: 1600, fill: "forwards" });
      }
      for (const k of ["", " b"]) map.add(div("wq-wave" + k), ax, ay);
      const ans = M.pin({ color: "#ff5a6e", cls: "" });
      const aw = div("wq-ans");
      aw.appendChild(ans);
      map.add(aw, ax, ay);
      const tag = div("wq-tag");
      tag.style.setProperty("--off", "10.6");
      if (it.kind === "flag" || it.cc && ctx.byCode.get(it.cc) && !W.NOCOUNTRY.has(it.id)) {
        const im = document.createElement("img");
        im.src = W.flagImg(it.cc).src;
        im.alt = "";
        tag.appendChild(im);
      } else if (it.emoji) tag.append(it.emoji + " ");
      const tn = document.createElement("span");
      tn.textContent = W.cap(W.nameIn(it, K.lang));
      tn.dir = "auto";
      tag.appendChild(tn);
      if (it.kind !== "flag" && it.cc && ctx.byCode.get(it.cc) && !W.NOCOUNTRY.has(it.id)) {
        const sm = document.createElement("small");
        sm.textContent = W.cap(W.nameIn(ctx.byCode.get(it.cc), K.lang));
        tag.appendChild(sm);
      }
      map.add(tag, ax, ay);
      showAns = true;
      setTimeout(() => keepIn(wrap), 50);
      K.boo(pins.length && pins[0].tier === "top" ? "wow" : "hi");
      yield K.sleep(900);
      const span = (xs, ys, minW, minH) => {
        let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        if (x1 - x0 < minW) {
          const c = (x0 + x1) / 2;
          x0 = c - minW / 2;
          x1 = c + minW / 2;
        }
        if (y1 - y0 < minH) {
          const c = (y0 + y1) / 2;
          y0 = c - minH / 2;
          y1 = c + minH / 2;
        }
        return [x0, y0, x1, y1];
      };
      const K1 = M.K;
      const allBox = span([ax, ...pins.map((x) => x.xy[0])], [ay, ...pins.map((x) => x.xy[1])], 26 * K1, 14 * K1);
      yield map.fit(allBox, { pad: U * 6, top: U * 13, ms: 1500 });
      keepIn(wrap);
      layout();
      if (K.over()) return pins;
      for (const x of pins) {
        const ln = map.line(x.xy[0], x.xy[1], x.xy[0], x.xy[1], { stroke: ctx.teamOf(x.p) || x.p.color, "stroke-width": String(Math.max(2, U * 0.42)), "stroke-dasharray": U * 1.3 + " " + U * 0.9, opacity: ".95" });
        const t0 = performance.now(), dur = 650;
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
          ln.setAttribute("x2", x.xy[0] + (ax - x.xy[0]) * e);
          ln.setAttribute("y2", x.xy[1] + (ay - x.xy[1]) * e);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      if (pins.length) ctx.fx("zip");
      yield K.sleep(750);
      for (const x of pins) {
        const dd = div("wq-dist " + (x.ok ? "ok" : "no"));
        dd.style.setProperty("--pc", ctx.teamOf(x.p) || x.p.color);
        const b = document.createElement("b");
        b.textContent = (x.ok ? "✓ " : "✗ ") + (x.d === 0 ? x.p.name : x.p.name + " · " + (yield distTxt(x.d)));
        b.dir = "auto";
        dd.appendChild(b);
        if (x.pts > 0) {
          const pt = document.createElement("i");
          pt.textContent = "+" + K.num(x.pts) + (x.hot ? " 🔥" : "");
          dd.appendChild(pt);
        }
        x.tag = dd;
        x.marks.push(map.add(dd, x.dxy[0], x.dxy[1]));
        x.pin.classList.add(x.ok ? "ok" : "no");
        const mk2 = document.createElement("b");
        mk2.className = "wq-mk";
        mk2.textContent = x.ok ? "✓" : "✗";
        x.pin.appendChild(mk2);
      }
      layout();
      const nOk = pins.filter((x) => x.ok).length, nNo = Math.max(pins.length, K.alive().filter((p) => !p.away || pins.some((x) => x.p === p)).length) - nOk;
      const sum = div("wq-sum", v.stage);
      sum.append(yield K.tr("{n} right", { n: K.num(nOk) }));
      const sb = document.createElement("b");
      sb.textContent = yield K.tr("{n} wrong", { n: K.num(Math.max(0, nNo)) });
      sum.appendChild(sb);
      if (rd.dbl) {
        const dx = document.createElement("i");
        dx.textContent = "×2";
        sum.appendChild(dx);
      }
      const used = ctx.used;
      const say = (x, lg) => __async(this, null, function* () {
        const opts = SAY[x.tier].filter((l2) => !used.has(l2[0]));
        const l = W.pick(opts.length ? opts : SAY[x.tier]);
        used.add(l[0]);
        return [yield trIn(K, lg, l[0]), l[1]];
      });
      if (pins.length) {
        const top = pins.filter((x) => x.d <= best + 0.5);
        if (top.length <= 3) for (const x of top) {
          const cr = div("wq-crown");
          cr.textContent = "👑";
          x.crown = cr;
          x.marks.push(map.add(cr, x.dxy[0], x.dxy[1]));
        }
        v.board.best(top[0].p.id);
        ctx.fx(nOk ? top[0].tier === "top" ? "bull" : "sparkle" : "pop");
        if (!nOk) K.snd.sting("wvWrong", { duck: 0.4 });
        if (top[0].tier === "top" || top[0].tier === "close") try {
          P.confetti(top[0].tier === "top" ? 160 : 70);
        } catch (e) {
        }
      } else K.snd.sting("wvWrong", { duck: 0.4 });
      const pickSay = pins.length <= 3 ? pins : pins[pins.length - 1].tier !== pins[0].tier ? [pins[0], pins[pins.length - 1]] : [pins[0]];
      for (const x of [...new Set(pickSay)]) {
        const [line, face2] = yield say(x, K.lang);
        x.line = line;
        x.face = face2;
        const sb2 = div("wq-say " + x.tier + (x.crown ? " cr" : ""));
        const im = document.createElement("img");
        im.src = P.booUri(face2);
        im.alt = "";
        sb2.appendChild(im);
        const sp = document.createElement("span");
        sp.textContent = line;
        sp.dir = "auto";
        sb2.appendChild(sp);
        x.say = sb2;
        x.marks.push(map.add(sb2, x.dxy[0], x.dxy[1]));
        yield K.sleep(220);
      }
      layout();
      setTimeout(() => keepIn(wrap), 700);
      for (const x of pins) {
        x.p.score += x.pts;
        v.board.add(x.p, x.pts);
        v.board.mark(x.p, x.ok, x.d === 0 ? yield K.tr("Right inside it!") : yield distTxt(x.d));
        const lg = K.langOf(x.p.id) || K.lang;
        let line = x.line, face2 = x.face;
        if (!line || lg !== K.lang) {
          const r = yield say(x, lg);
          line = r[0];
          face2 = face2 || r[1];
        }
        const extra = [x.fast ? yield trIn(K, lg, "Speed bonus: +{n}", { n: K.num(x.fast * (rd.dbl ? 2 : 1)) }) : "", x.hot ? yield trIn(K, lg, "{n} right in a row: +{m}", { n: K.num(x.p.streak), m: K.num(x.hot * (rd.dbl ? 2 : 1)) }) : "", rd.dbl ? yield trIn(K, lg, "Double points!") : ""].filter(Boolean).join(" · ");
        const note = (x.d === 0 ? yield trIn(K, lg, "Right inside it!") : yield distTxt(x.d, lg)) + (extra ? " · " + extra : "");
        K.result(x.p.id, { ok: x.ok, vd: x.ok ? 1 : 0, first: x === pins[0] && pins.length > 1, pts: x.pts, score: x.p.score, note, title: line, boo: face2 });
      }
      for (const p of K.alive()) if (!pins.some((x) => x.p.id === p.id) && !p.away) {
        v.board.mark(p, false, yield K.tr("No pin this time!"));
        K.result(p.id, { ok: false, vd: 0, pts: 0, score: p.score, title: yield trIn(K, K.langOf(p.id) || K.lang, "No pin this time!"), boo: "boo:sad" });
      }
      yield K.sleep(1300);
      if (pins.length) {
        const near = pins.filter((x) => x.d <= Math.max(best * 2.2, best + 150)).slice(0, 4);
        const nb = span([ax, ...near.map((x) => x.xy[0])], [ay, ...near.map((x) => x.xy[1])], 16 * K1, 9 * K1);
        if (nb[2] - nb[0] < (allBox[2] - allBox[0]) * 0.7) {
          yield map.fit(nb, { pad: U * 8, top: U * 13, ms: 1400 });
          keepIn(wrap);
          layout();
        }
      }
      v.board.done();
      if (/[?&]debug\b/.test(location.search)) window.__wqPins = () => pins.map((x) => {
        const r = x.pin.getBoundingClientRect(), t = x.say && x.say.getBoundingClientRect();
        return [x.p.name, Math.round(x.d), x.tier, !!x.crown, Math.round(r.left), Math.round(r.top), t ? [Math.round(t.left), Math.round(t.top), Math.round(t.width)] : null];
      });
      return pins;
    });
  }
  function knockOut(K, ctx, pins, v) {
    return __async(this, null, function* () {
      const alive = K.alive().filter((p) => !p.away || pins.some((x) => x.p === p));
      if (alive.length <= 1) return [];
      const none = alive.filter((p) => !pins.some((x) => x.p === p));
      let out = none;
      if (!out.length) {
        const ap = pins.filter((x) => alive.includes(x.p));
        const far = Math.max(...ap.map((x) => x.d));
        out = ap.filter((x) => x.d >= far - 0.5).map((x) => x.p);
      }
      if (out.length >= alive.length) return [];
      for (const p of out) {
        p.out = true;
        const x = pins.find((y) => y.p === p);
        if (x && x.pin) {
          x.pin.classList.add("ko");
          const bm = document.createElement("i");
          bm.className = "wq-ko";
          bm.textContent = "💥";
          x.pin.appendChild(bm);
        }
        v.board.out(p);
        const lg = K.langOf(p.id) || K.lang;
        K.result(p.id, { ok: false, vd: 0, out: true, pts: 0, score: p.score, title: yield trIn(K, lg, "You are out!"), note: yield trIn(K, lg, "The farthest pin goes out. Watch who wins!"), boo: "boo:sad" });
      }
      ctx.fx("pop", 0, { rate: 0.7 });
      const msg = div("wq-out", v.stage);
      msg.textContent = "💥 " + (yield K.tr(out.length > 1 ? "{name} and {n} more are out!" : "{name} is out!", { name: out[0].name, n: K.num(out.length - 1) }));
      yield K.sleep(1800);
      return out;
    });
  }
  function keepIn(box) {
    const R = box.getBoundingClientRect(), m = 10;
    for (const t of box.querySelectorAll(".wq-tag")) {
      t.style.setProperty("--dx", "0px");
      const r = t.getBoundingClientRect();
      let dx = 0;
      if (r.left < R.left + m) dx = R.left + m - r.left;
      else if (r.right > R.right - m) dx = R.right - m - r.right;
      t.style.setProperty("--dx", Math.round(dx) + "px");
      if (t.classList.contains("wq-tag")) {
        t.classList.remove("below");
        if (t.getBoundingClientRect().top < R.top + m) t.classList.add("below");
      }
    }
  }
  function nextIn(K, v, secs) {
    return __async(this, null, function* () {
      const pill = div("wq-next", v.stage);
      for (let n = secs; n > 0 && !K.over(); n--) {
        pill.textContent = "⏭️ " + (yield K.tr("Next round in {n}", { n: K.num(n) }));
        yield K.sleep(1e3);
      }
    });
  }
  function hostNext(K, v, n) {
    return __async(this, null, function* () {
      const pill = div("wq-next", v.stage);
      pill.textContent = "⏸️ " + (yield K.tr("Waiting for the host to start the next round"));
      const label = yield K.tr("Next round");
      let go = false;
      const off = K.on("next", (m, p) => {
        if (+m.n === n && K.isHost(p.id)) go = true;
      });
      K.hostWait(true);
      for (let k = 0; !go && !K.over(); k++) {
        if (k % 8 === 0) {
          const h = K.players().find((p) => K.isHost(p.id));
          if (h) K.sayTo(h.id, { k: "nextq", n, label });
        }
        yield K.sleep(500);
      }
      K.hostWait(false);
      off();
    });
  }
  function hostReveal(K, n) {
    let on = true;
    (() => __async(this, null, function* () {
      const label = yield K.tr("Show the answer");
      const off = K.on("reveal", (m, p) => {
        if (+m.n === n && K.isHost(p.id)) K.close(n);
      });
      for (let k = 0; on && !K.over(); k++) {
        if (k % 8 === 0) {
          const h = K.players().find((p) => K.isHost(p.id));
          if (h) K.sayTo(h.id, { k: "revealq", n, label });
        }
        yield K.sleep(500);
      }
      off();
    }))();
    return () => {
      on = false;
    };
  }
  const W_LOOKS = ["maproom", "orbit", "passport", "atlas"], W_WINS = ["arrivals", "balloons", "maproom", "treasure"];
  const lsGet = (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v == null ? d : v;
    } catch (e) {
      return d;
    }
  };
  const lsSet = (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
    }
  };
  const urlPick = (k, list) => {
    const m = new RegExp("[?&]" + k + "=([a-z]+)").exec(location.search);
    return m && list.includes(m[1]) ? m[1] : "";
  };
  let wLook = "", wSet = null;
  function lookNow(s) {
    const forced = urlPick("wlook", W_LOOKS);
    if (forced) return forced;
    if (s && W_LOOKS.includes(s.look)) return s.look;
    if (!wLook) {
      const i = ((+lsGet("bvplay:wlook", "-1") || 0) + 1 + W_LOOKS.length) % W_LOOKS.length;
      lsSet("bvplay:wlook", String(i));
      wLook = W_LOOKS[i];
    }
    return wLook;
  }
  function winNow(s) {
    const forced = urlPick("wwin", W_WINS);
    if (forced) return forced;
    if (s && W_WINS.includes(s.win)) return s.win;
    const i = ((+lsGet("bvplay:wwin", "-1") || 0) + 1 + W_WINS.length) % W_WINS.length;
    lsSet("bvplay:wwin", String(i));
    return W_WINS[i];
  }
  const mk = (tag, cls, parent, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  const pc = (v, of) => (v / of * 100).toFixed(3) + "%";
  const ROUTE = "M260 640C560 260 980 260 1180 470S1600 640 1720 330";
  const PING = (x, y, c, d) => {
    const sp = ' calcMode="spline" keyTimes="0;1" keySplines="0 0 .58 1" dur="2.4s" begin="' + d + 's" repeatCount="indefinite"';
    return '<circle cx="' + x + '" cy="' + y + '" r="13" fill="none" stroke="' + c + '" stroke-width="2" opacity="0"><animate attributeName="r" values="7.8;31.2"' + sp + '/><animate attributeName="stroke-width" values="1.2;4.8"' + sp + '/><animate attributeName="opacity" values=".9;0"' + sp + '/></circle><circle cx="' + x + '" cy="' + y + '" r="9" fill="' + c + '" opacity=".55" filter="url(#wl-gl)"/><circle cx="' + x + '" cy="' + y + '" r="6" fill="' + c + '"/>';
  };
  const SVG_ROUTE = '<svg class="full route" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><filter id="wl-gl" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="5"/></filter><filter id="wl-sh" x="-1" y="-1" width="3" height="3"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dy="6"/><feComponentTransfer><feFuncA type="linear" slope=".5"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path class="dash" d="' + ROUTE + '" fill="none" stroke="#5ad1ff" stroke-opacity=".35" stroke-width="3" stroke-dasharray="4 16" stroke-linecap="round"/>' + PING(260, 640, "#ff5a8a", 0) + PING(1180, 470, "#ffc93c", 0.8) + PING(1720, 330, "#34d399", 1.6) + '<g filter="url(#wl-sh)"><g><animateMotion dur="14s" repeatCount="indefinite" rotate="auto" path="' + ROUTE + '"/><text transform="rotate(45)" font-size="44" text-anchor="middle" dominant-baseline="central">✈️</text></g></g></svg>';
  const SVG_ROSE = (() => {
    let p = "";
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, long = i % 2 === 0, r = long ? i % 4 === 0 ? 150 : 110 : 70, w = 8;
      const tx = Math.cos(a) * r, ty = Math.sin(a) * r, sx = Math.cos(a + Math.PI / 2) * w * (long ? 1 : 1), sy = Math.sin(a + Math.PI / 2) * w;
      p += '<path d="M0 0L' + sx.toFixed(1) + " " + sy.toFixed(1) + "L" + tx.toFixed(1) + " " + ty.toFixed(1) + 'Z" fill="' + (i % 2 ? "#c9a46a" : "#8a5a2e") + '"/>';
    }
    return '<svg class="rose" viewBox="-170 -170 340 340" aria-hidden="true"><circle r="160" fill="none" stroke="#8a5a2e" stroke-width="3"/><circle r="140" fill="none" stroke="#8a5a2e" stroke-width="1" stroke-dasharray="3 6"/>' + p + "</svg>";
  })();
  const STAMPS = [[1500, 640, "#ff5a8a", -14, "PARIS"], [1700, 860, "#5ad1ff", 10, "TOKYO"], [1320, 900, "#e8c36a", -6, "CAIRO"], [80, 880, "#34d399", 12, "RIO"]];
  const D = (v) => "calc(" + (v / 10.8).toFixed(4) + " * var(--u))";
  function lobbyDress(stage, s) {
    const lk = lookNow(s);
    wSet = s;
    document.body.dataset.wlook = lk;
    const d = mk("div", "wl-deco");
    d.setAttribute("aria-hidden", "true");
    if (lk === "maproom" || lk === "atlas") {
      const im = mk("img", "wl-map", d);
      im.src = "icons/wmap.svg";
      im.alt = "";
      mk("i", "full grid", d);
    }
    if (lk === "maproom") {
      d.insertAdjacentHTML("beforeend", SVG_ROUTE);
      mk("i", "full vig", d);
    } else if (lk === "atlas") {
      d.insertAdjacentHTML("beforeend", SVG_ROSE);
      mk("i", "full frame", d);
      mk("i", "full vig", d);
    } else if (lk === "orbit") {
      for (let i = 0; i < 70; i++) {
        const st = mk("i", "st" + (i % 5 === 0 ? " b" : ""), d);
        st.style.left = pc(i * 137 % 1920, 1920);
        st.style.top = pc(i * 263 % 1080, 1080);
        st.style.animationDuration = 2 + i % 4 + "s";
        st.style.animationDelay = (-(i % 7) * 0.4).toFixed(1) + "s";
      }
      const e = mk("div", "earth", d);
      const im = mk("img", "", e);
      im.src = "icons/wmap.svg";
      im.alt = "";
      mk("span", "", mk("div", "ring", d), "🛰️");
    } else {
      mk("i", "full guil", d);
      for (const [x, y, c, r, t] of STAMPS) {
        const st = mk("div", "stamp", d, t);
        st.style.left = D(x);
        st.style.top = D(y);
        st.style.setProperty("--c", c);
        st.style.transform = "rotate(" + r + "deg)";
      }
      mk("i", "full frame", d);
    }
    stage.insertBefore(d, stage.firstChild);
    const sp = stage.querySelector(".spot"), ic = sp && sp.querySelector(".spot-ic");
    if (sp && (lk === "maproom" || lk === "passport")) sp.insertBefore(mk("i", "wl-stamp", null, lk === "passport" ? "APPROVED" : null), sp.firstChild).setAttribute("aria-hidden", "true");
    if (ic) {
      const e = ic.textContent.trim();
      ic.textContent = "";
      mk("span", "", ic, lk === "atlas" && e === "🌍" ? "🧭" : e);
      if (lk === "orbit") mk("i", "wl-orb", ic);
    }
    const top = stage.querySelector(".lob-top"), h1 = top && top.querySelector("h1");
    if (h1) {
      const fit = () => {
        h1.style.fontSize = "";
        const logo = top.querySelector(".logo"), deco = top.querySelector(".deco"), cs = getComputedStyle(top);
        const room = top.clientWidth - (logo ? logo.offsetWidth : 0) - (deco ? deco.offsetWidth : 0) - 2 * (parseFloat(cs.columnGap || cs.gap) || 0) - 4;
        const base = parseFloat(getComputedStyle(h1).fontSize) || 80;
        for (let k = 1, i = 0; i < 12 && h1.scrollWidth > room && k > 0.55; i++) {
          k -= 0.05;
          h1.style.fontSize = (base * k).toFixed(1) + "px";
        }
      };
      fit();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
        if (h1.isConnected) fit();
      }).catch(() => {
      });
    }
  }
  let hostEl = null;
  function fitNow() {
    if (!hostEl || !hostEl.isConnected) return;
    const cv = hostEl.firstElementChild, w = hostEl.clientWidth, h = hostEl.clientHeight;
    const s = Math.min(w / 1920, h / 1080);
    cv.style.transform = "translate(" + ((w - 1920 * s) / 2).toFixed(1) + "px," + ((h - 1080 * s) / 2).toFixed(1) + "px) scale(" + s.toFixed(5) + ")";
  }
  addEventListener("resize", () => requestAnimationFrame(fitNow));
  const $k = (root, k) => [...root.querySelectorAll('[data-k="' + k + '"]')];
  const $1 = (root, k) => root.querySelector('[data-k="' + k + '"]');
  const setT = (root, k, t) => {
    for (const e of $k(root, k)) e.textContent = t;
  };
  const ifs = (root, vals) => {
    for (const e of root.querySelectorAll("bv-if")) if (e.dataset.if in vals) e.hidden = !vals[e.dataset.if];
  };
  function shrink(e, minK) {
    if (!e) return;
    e.style.whiteSpace = "nowrap";
    const base = parseFloat(getComputedStyle(e).fontSize) || 40;
    for (let k = 1, i = 0; i < 16 && e.scrollWidth > e.clientWidth + 2 && k > (minK || 0.4); i++) {
      k -= 0.05;
      e.style.fontSize = (base * k).toFixed(1) + "px";
    }
  }
  function face(K, at, x) {
    if (!at || !x) return;
    const isSvg = at.tagName.toLowerCase() === "svg";
    const w = isSvg ? +at.getAttribute("width") : at.clientWidth * 0.62, h = isSvg ? +at.getAttribute("height") : w;
    const im = document.createElement("img");
    im.alt = "";
    im.className = "wv-face" + (x.photo ? " ph" : "");
    im.src = x.team ? P.booUri("boo:party") : K.avatarUrl(x);
    const sz = x.photo ? Math.round(w * 1.12) : Math.round(h * 1.04);
    im.style.width = sz + "px";
    im.style.height = sz + "px";
    if (x.team) {
      im.style.borderRadius = "50%";
      im.style.background = x.color;
      im.style.padding = Math.round(sz * 0.08) + "px";
      im.style.boxSizing = "border-box";
    }
    if (isSvg) at.replaceWith(im);
    else {
      at.textContent = "";
      at.style.display = "grid";
      at.style.placeItems = "center";
      at.appendChild(im);
    }
  }
  const BOARD = /^[A-Za-z0-9À-ɏ .'-]+$/;
  const upper = (t, lg) => {
    try {
      return String(t).toLocaleUpperCase(lg);
    } catch (e) {
      return String(t).toUpperCase();
    }
  };
  function tiles(box, text, n, lg) {
    if (!box) return;
    const tpl = box.querySelector("[data-row]");
    if (!tpl) return;
    tpl.remove();
    tpl.removeAttribute("data-row");
    const t = String(text || "");
    const chars = !t ? [] : BOARD.test(t) ? [...upper(t, lg)] : [t];
    const count = Math.max(n, chars.length);
    for (let i = 0; i < count; i++) {
      const c = tpl.cloneNode(true);
      const tn = [...c.childNodes].find((x) => x.nodeType === 3);
      const ch = chars[i] || "";
      if (tn) tn.data = ch === " " ? "" : ch;
      else c.insertBefore(document.createTextNode(ch), c.firstChild);
      c.style.animationDuration = [3, 3.8, 4.2, 3.4][(i * 3 + n) % 4] + "s";
      if (ch.length > 1) {
        c.style.width = "auto";
        c.style.minWidth = 62 * 4 + 18 + "px";
        c.style.padding = "0 22px";
        c.style.fontSize = "44px";
        c.style.whiteSpace = "nowrap";
      }
      box.appendChild(c);
    }
    const room = box.parentElement ? box.clientWidth : 0;
    if (room && box.scrollWidth > room + 2 && chars.length > 1) {
      const k = Math.max(0.45, (room - 6 * (count - 1)) / (62 * count));
      for (const c of box.children) {
        c.style.width = Math.floor(62 * k) + "px";
        c.style.fontSize = Math.round(52 * Math.min(1, k * 1.15)) + "px";
      }
    }
  }
  let wWinLast = "";
  function winners(K, top, teams) {
    return __async(this, null, function* () {
      const look = winNow(K.settings), idx = Math.max(0, W_WINS.indexOf(look));
      wWinLast = look;
      const tx = yield P.trAll(Object.fromEntries(["The winner", "The winning team", "The host can play again, or pick another game.", "Arrivals", "Landed"].map((t) => [t, t])));
      K.view(null);
      const host = K.el("div", "wv-host wv-" + look, K.stage);
      const cv = K.el("div", "wv-cv", host);
      cv.innerHTML = BVWIWT.win[idx];
      hostEl = host;
      fitNow();
      const [w1, w2, w3] = top;
      const pts = (x) => __async(this, null, function* () {
        return K.tr("Points: {n}", { n: K.num(x.score) });
      });
      setT(cv, "wk", teams ? tx["The winning team"] : tx["The winner"]);
      setT(cv, "foot", tx["The host can play again, or pick another game."]);
      const wn = $1(cv, "wname");
      if (wn) {
        wn.textContent = w1 ? w1.name : "...";
        wn.dir = "auto";
        wn.style.maxWidth = look === "arrivals" ? "900px" : "1300px";
        shrink(wn, 0.45);
      }
      const fill = (x, k) => __async(this, null, function* () {
        for (const a of $k(cv, "av" + k)) face(K, a, x);
        for (const e of $k(cv, "nm" + k)) {
          e.textContent = x.name;
          e.dir = "auto";
          e.style.maxWidth = k === 1 ? "560px" : "380px";
          e.style.overflow = "hidden";
          shrink(e, 0.4);
        }
        const pt = yield pts(x);
        for (const e of $k(cv, "pt" + k)) {
          e.textContent = pt;
          e.dir = "auto";
        }
      });
      if (look === "arrivals") {
        tiles($1(cv, "arr"), tx["Arrivals"], 8, K.lang);
        const landed = upper(tx["Landed"], K.lang);
        for (const [x, k] of [[w1, 1], [w2, 2], [w3, 3]]) {
          tiles($1(cv, "nt" + k), x ? x.name : "", 6, K.lang);
          const bd = $1(cv, "bd" + k);
          if (x) {
            yield fill(x, k);
            if (bd) bd.textContent = (k === 1 ? "✓ " : "") + landed;
            if (k === 3 && bd) {
              bd.style.background = "#8a96b4";
              const a = $1(cv, "av3");
              if (a) a.style.borderColor = "#8a96b4";
            }
          } else {
            for (const a of $k(cv, "av" + k)) if (a.tagName.toLowerCase() === "svg") a.remove();
            setT(cv, "pt" + k, "");
            if (bd) bd.textContent = "-";
          }
        }
      } else {
        if (w1) yield fill(w1, 1);
        if (w2) yield fill(w2, 2);
        else for (const k of ["av2", "nm2", "pt2"]) for (const e of $k(cv, k)) e.style.visibility = "hidden";
        ifs(cv, { p3: !!w3, p3none: !w3 });
        if (w3) {
          yield fill(w3, 3);
          const p3 = $1(cv, "p3");
          if (p3) p3.style.opacity = "1";
        }
      }
      K.snd.music("wvWin", { fadeOut: 0.6, fadeIn: 0.3 });
      try {
        P.confetti(180);
      } catch (e) {
      }
      K.boo(false);
      yield K.sleep(1200);
    });
  }
  function seatDress(grid) {
    const lk = document.body.dataset.wlook;
    for (const seat of grid.querySelectorAll(".seat")) {
      seat.classList.toggle("open", seat.classList.contains("empty") && !!seat.querySelector("span"));
      if (lk === "maproom" && !seat.querySelector(".wl-tag")) mk("i", "wl-tag", seat).setAttribute("aria-hidden", "true");
    }
  }
  const MODES = [
    ["classic", "Classic", "The closer your pin, the more points: up to 100 a round."],
    ["bullseye", "Bullseye", "Only the closest pin scores each round. Be the closest!"],
    ["lightning", "Lightning", "Only a few seconds a round. The faster your pin, the more bonus points."],
    ["zoom", "Close-up", "The picture starts zoomed in close and slowly shows more. Pin early for bonus points!"],
    ["knockout", "Knockout", "Each round, the farthest pin is out. The last explorer standing wins."],
    ["kids", "Kids", "Big pictures, big buttons: tap the right continent and win a star!"]
  ];
  const MODE_IC = { classic: "🌍", bullseye: "🎯", lightning: "⚡", zoom: "🔍", knockout: "🥊", kids: "🧸" };
  const modeOf = (s) => MODES.some((m) => m[0] === s.mode) ? s.mode : s.kids ? "kids" : "classic";
  const clampN = (v, a, b, d) => {
    const n = Math.round(+v);
    return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d;
  };
  const secOf = (s, mode) => mode === "kids" ? clampN(s.kidSec, 0, 300, 0) : mode === "lightning" ? clampN(s.fast, 3, 60, 10) : mode === "zoom" ? clampN(s.sec, 10, 300, 30) || 30 : clampN(s.sec, 0, 300, 30);
  const KIDS = { Africa: ["🦁", "#ffb020"], Asia: ["🐼", "#ff5a8a"], Europe: ["🦊", "#4c8dff"], "North America": ["🦅", "#34d399"], "South America": ["🦜", "#b46bff"], Oceania: ["🦘", "#ff8a3c"] };
  BVPLAY.game({
    id: "world",
    name: "Where in the World?",
    emoji: "🌍",
    sub: "Drop a pin on the map. The closest pin wins.",
    teams: true,
    teamsWin: true,
    mlang: true,
    // its looks: the lobby in one of four designs, the winners in one of four (wlook.css, world-tpl.js)
    lobbyDone: (stage, el, s) => lobbyDress(stage, s),
    seated: (grid) => seatDress(grid),
    seatGap: 18 / 10.8,
    seatRatioCard: 196 / 186,
    step: ["Drop your pin", "Pinch the map on your phone and tap where it is."],
    deco: "🌍📍🧭✈️",
    rules: (s) => modeOf(s || {}) === "kids" ? ["The TV shows a big picture of a place.", "Tap the continent where it is, on your phone.", "Every right answer earns a star."] : ["The TV shows a flag, a city or a famous sight.", "Drop your pin on the map on your phone (pinch to zoom).", "The closer your pin, the more points you get."],
    credit: "Flags: flagcdn.com (public domain). Photos: Wikimedia Commons.",
    // its own music: the lobby tune, three tunes taking turns all game long, the winner's song; and its stings
    music: { lobby: "wvLobby", again: "wvLobby" },
    sounds: ["wvNext", "wvTimesup", "wvWrong", "whoosh", "plane", "ping", "stamp", "shutter", "static", "neon", "print", "spot", "sparkle", "flip", "flutter", "pop", "tick", "hint", "drumroll", "land", "zip", "bull", "globe", "focus", "coin"],
    // (the game draws its own last screen: the winners, in one of its four designs)
    ownEnd: true,
    endLook: () => wWinLast,
    // (a race against the others is everyone for themselves)
    teamsOn: (s) => modeOf(s) !== "knockout",
    // (the places start loading in the lobby, while people join; and the winner screens' fonts)
    prep: () => {
      W.loadData().catch(() => {
      });
      const im = new Image();
      im.src = M.BASE + "z0.jpg";
      try {
        for (const f of ['700 40px "WV Fredoka"', '800 30px "WV Nunito"', '900 30px "WV Cairo"', '700 30px "WV Mono"']) document.fonts.load(f).catch(() => {
        });
      } catch (e) {
      }
    },
    steps: [
      { t: "Game mode", s: "Mode", keys: ["lang", "mode"] },
      { t: "The map", s: "Map", keys: ["map", "what", "level"] },
      { t: "Rounds and time", s: "Time", keys: ["rounds", "sec", "fast", "kidSec", "next", "wait"] },
      { t: "Points", keys: ["rightKm", "speed", "streak", "double", "hints", "units"] },
      { t: "Extras", keys: ["photos", "teams", "teamN", "look", "win"] }
    ],
    spot: (s) => {
      const mode = modeOf(s), m = MODES.find((x) => x[0] === mode);
      const area = AREA_OPTS.find((x) => x[0] === s.map) || AREA_OPTS[0];
      const what = s.map === "us" ? ["us", "US states", "The states, on a map of the US."] : WHAT.find((x) => x[0] === s.what) || WHAT[0];
      const sec = secOf(s, mode), wIc = { mix: "🌍", flags: "🏳️", cities: "🏙️", landmarks: "🗿", us: "🇺🇸" }[what[0]] || "🌍";
      const hint = s.hints !== false ? ["💡", "Hints show up as the clock runs down"] : ["🧠", "No hints: just you and the map"];
      const pic = s.photos !== false && s.map !== "us" ? ["📸", "Real photos of the cities and sights"] : ["🎨", "A new picture every round"];
      const B = {
        classic: [["📍", "The closest pin wins the round"], hint, pic],
        bullseye: [["🎯", "Only the closest pin scores: 100 points"], ["🤝", "A tie? Everyone that close scores"], hint],
        lightning: [["⚡", "Only {n} seconds a round"], ["🚀", "The faster you pin, the more bonus points"], ["📍", "The closer your pin, the more points"]],
        zoom: [["🔍", "The picture starts zoomed in close"], ["⏳", "It shows more as the clock runs down"], ["🚀", "Pin early for up to 50 bonus points"]],
        knockout: [["🥊", "Each round, the farthest pin is out"], ["🏆", "The last explorer standing wins"], ["🛟", "No pin counts as the farthest"]],
        kids: [["⭐", "Every right answer earns a star"], ["🗺️", "Then the map shows where it really is"], sec ? ["⏱️", "{n} seconds to answer, and nobody loses"] : ["🎉", "No clock, and nobody loses"]]
      }[mode];
      const facts = [["🗺️", area[1]], ["🔁", "{n} rounds", { n: clampN(s.rounds, 1, 60, 10) }], sec ? ["⏱️", "{n} s", { n: sec }] : ["⏳", "No timer"]];
      if (s.teams && mode !== "knockout") facts.push(["👥", "Teams"]);
      if (mode === "classic") return { key: "classic|" + what[0], icon: wIc, label: "What to find", name: what[1], desc: what[2] || "Drop a pin on the map. The closest pin wins.", bullets: B, facts, vars: { n: sec } };
      facts.splice(1, 0, [wIc, what[1]]);
      return { key: mode + "|" + what[0], icon: MODE_IC[mode], label: "Game mode", name: m[1], desc: m[2], bullets: B, facts: facts.slice(0, 4), vars: { n: sec } };
    },
    settings: [
      { key: "mode", label: "Game mode", type: "seg", look: "list", options: MODES, default: "classic" },
      { key: "map", label: "Map", type: "seg", look: "list", options: AREA_OPTS, default: "world" },
      { key: "what", label: "What to find", type: "seg", options: WHAT, default: "mix", when: ["map", "!us"] },
      { key: "level", label: "Difficulty", type: "seg", options: [["mix", "Easy to hard", "Starts with famous places and gets harder."], ["easy", "Easy", "Only famous places. Great with kids."], ["medium", "Medium", "Places most people have heard of."], ["hard", "Hard", "Tricky places, for map fans."]], default: "mix", when: ["mode", "!kids"] },
      { key: "rounds", label: "Rounds", type: "number", min: 1, max: 60, quick: [5, 10, 15, 20], unit: "rounds", default: 10, desc: "In Knockout, the game ends sooner when only one player is left." },
      { key: "sec", label: "Time to pin", type: "number", min: 0, max: 300, quick: [15, 20, 30, 45, 60], unit: "seconds", default: 30, when: ["mode", ["classic", "bullseye", "zoom", "knockout"]], desc: "0: no clock. Each round waits until everyone pins, and the host can show the answer any time." },
      { key: "fast", label: "Time to pin", type: "number", min: 3, max: 60, quick: [5, 8, 10, 15], unit: "seconds", default: 10, when: ["mode", "lightning"] },
      { key: "kidSec", label: "Time to answer", type: "number", min: 0, max: 300, quick: [0, 20, 30, 60], unit: "seconds", default: 0, when: ["mode", "kids"], desc: "0: no clock. Each round waits until everyone answers." },
      { key: "next", label: "Next round", type: "seg", options: [["auto", "Automatic", "The next round starts by itself after a short wait."], ["host", "The host starts it", "The host taps Next round on their phone when everyone is ready."]], default: "auto" },
      { key: "wait", label: "Wait before the next round", type: "number", min: 1, max: 120, quick: [5, 8, 12, 20], unit: "seconds", default: 8, when: ["next", "auto"] },
      { key: "rightKm", label: "Counts as right within", type: "number", min: 5, max: 5e3, quick: [100, 300, 500, 1e3], unit: "km", default: 300, when: ["mode", "!kids"], desc: "A pin this close to a city or sight gets a ✓. A flag gets one when the pin is inside its country." },
      { key: "speed", label: "Speed bonus", type: "toggle", default: false, desc: "A fast pin earns up to 50 more points. Lightning and Close-up always have it.", when: ["mode", ["classic", "knockout"]] },
      { key: "streak", label: "Streak bonus", type: "toggle", default: true, desc: "Three right in a row, or more: 50 extra points each time.", when: ["mode", ["classic", "bullseye", "lightning", "zoom"]] },
      { key: "double", label: "Last round counts double", type: "toggle", default: true, desc: "The last round is worth twice the points, so anyone can still win.", when: ["mode", ["classic", "bullseye", "lightning", "zoom"]] },
      { key: "hints", label: "Hints", type: "toggle", default: true, desc: "Clues show up as the clock runs down: the continent, then more.", when: ["mode", "!kids"] },
      { key: "units", label: "Units", type: "seg", options: [["mi", "Miles"], ["km", "Kilometers"]], default: "mi", when: ["mode", "!kids"] },
      { key: "photos", label: "Real photos", type: "toggle", default: true, desc: "Photos of the cities and sights, from Wikipedia.", when: ["map", "!us"] },
      { key: "teams", label: "Teams", type: "toggle", default: false, desc: "Phones join a color team, and each team's points are added up.", when: ["mode", "!knockout"] },
      { key: "teamN", label: "How many teams", type: "seg", options: [[2, "2"], [3, "3"], [4, "4"]], default: 2, when: [["teams", true], ["mode", "!knockout"]] },
      { key: "look", label: "Lobby look", type: "seg", options: [["mix", "All four, in turns", "A different look every game."], ["maproom", "Map Room"], ["orbit", "Orbit"], ["passport", "Passport"], ["atlas", "Vintage Atlas"]], default: "mix" },
      { key: "win", label: "Winner screen", type: "seg", options: [["mix", "All four, in turns", "A different one every game."], ["arrivals", "Arrivals board"], ["balloons", "Balloon race"], ["maproom", "Map room"], ["treasure", "Treasure map"]], default: "mix" }
    ],
    tv(K) {
      return __async(this, null, function* () {
        const s = K.settings;
        let D2 = null;
        try {
          D2 = yield W.loadData();
        } catch (e) {
        }
        if (!D2) {
          const v = K.view(yield K.tr("Where in the World?"));
          K.el("p", "question", v, yield K.tr("The map didn't load. Check the internet and start again."));
          yield K.sleep(6e3);
          return K.players().slice();
        }
        const mode = modeOf(s), kids = mode === "kids", ko = mode === "knockout", us = s.map === "us";
        const teams = K.teamsOn();
        const area = W.AREAS[s.map] || W.AREAS.world;
        const all = W.allItems(D2, K);
        const byCode = new Map(all.allFlags.map((f) => [f.cc, f]));
        let pools;
        if (us) pools = [all.states];
        else {
          const conts = W.AREA_CONT[s.map];
          const inArea = (it) => s.map === "world" ? true : s.map === "me" ? it.kind === "flag" ? it.me : it.me || W.ME.has(it.cc) : it.kind === "flag" ? (conts || []).includes(it.cont) : W.inBox(area, it.lon, it.lat);
          const what = WHAT.some((x) => x[0] === s.what) ? s.what : "mix";
          pools = [];
          if (what === "mix" || what === "flags") pools.push(all.flags.filter(inArea));
          if (what === "mix" || what === "cities") pools.push(all.cities.filter(inArea));
          if (what === "mix" || what === "landmarks") pools.push(all.sights.filter(inArea));
          pools = pools.filter((p) => p.length);
          if (kids) pools = pools.map((p) => p.filter((it) => it.kind === "state" || W.CONT[it.cont])).filter((p) => p.length);
        }
        const n = clampN(s.rounds, 1, 60, 10);
        const level = kids ? "easy" : s.level;
        const rounds = pools.length === 1 ? W.choose(pools[0], n, level) : W.interleave(pools.map((p) => W.choose(p, n, level)), n);
        W.markSeen(rounds.map((r) => r.key));
        const photoP = s.photos !== false && !us ? W.photosFor(rounds.filter((r) => r.photo)) : Promise.resolve(/* @__PURE__ */ new Map());
        const ahead = (m, i) => {
          for (const r of rounds.slice(i, i + 2)) {
            const v = m.get(r.key);
            if (v) W.preload(v.src);
          }
        };
        photoP.then((m) => ahead(m, 0)).catch(() => {
        });
        for (const r of rounds) if (r.kind === "flag") W.flagImg(r.cc);
        const U = uPx();
        const teamOf = (p) => teams && p.team ? (P.TEAMS.find((t) => t[0] === p.team) || [])[2] || "" : "";
        const sec = secOf(s, mode);
        const ctx = {
          D: D2,
          byCode,
          U,
          kids,
          us,
          mode,
          sec,
          teamOf,
          used: /* @__PURE__ */ new Set(),
          untitled: yield K.tr("Untitled"),
          rightKm: clampN(s.rightKm, 5, 5e3, 300),
          speed: mode === "lightning" || mode === "zoom" || !!s.speed && (mode === "classic" || ko),
          streak: s.streak !== false && ["classic", "bullseye", "lightning", "zoom"].includes(mode),
          areaBox: M.box(us ? W.AREAS.us : area),
          fx: (nm, d, o) => {
            const go = () => {
              if (!K.over()) K.snd.fx(nm, o || {});
            };
            if (d) K.after(d, go);
            else go();
          }
        };
        if (/[?&]wwintest\b/.test(location.search) && /[?&]debug\b/.test(location.search)) {
          K.players().forEach((p, i) => {
            p.score = [316, 166, 120, 90, 40][i] || 10;
          });
          return end();
        }
        K.snd.music(kids ? "wvPlayB" : mode === "lightning" ? "wvPlayC" : W.pick(["wvPlayA", "wvPlayB", "wvPlayC"]), { fadeOut: 1.4, fadeIn: 1.6 });
        const decks = {
          flag: SC.deck(Object.keys(SC.FLAG)),
          photo: SC.deck(Object.keys(SC.PHOTO)),
          place: SC.deck(Object.keys(SC.PLACE)),
          drawnSight: SC.deck(["pin", "radar", "postcard", "globe", "spot", "neon", "path"]),
          // (the flight between rounds: one of the four planes, in turns; ?wplane=paper in the address for checking one)
          plane: urlPick("wplane", PLANE_KINDS) ? () => urlPick("wplane", PLANE_KINDS) : SC.deck(PLANE_KINDS)
        };
        for (let i = 0; i < rounds.length; i++) {
          if (K.over()) break;
          if (ko && K.players().length > 1 && K.alive().length <= 1) break;
          const it = rounds[i];
          const last = i >= rounds.length - 1;
          const dbl = s.double !== false && last && rounds.length > 2 && ["classic", "bullseye", "lightning", "zoom"].includes(mode);
          if (i > 0) yield K.sleep(plane(ctx, decks.plane(), yield K.tr("Round {n} / {total}", { n: K.num(i + 1), total: K.num(rounds.length) })));
          K.wait();
          const photos = (yield Promise.race([photoP, W.sleepRaw(1500).then(() => null)])) || /* @__PURE__ */ new Map();
          ahead(photos, i + 1);
          let ph = photos.get(it.key) || null;
          if (ph && !(yield Promise.race([W.preload(ph.src), W.sleepRaw(2200).then(() => false)]))) ph = null;
          if (K.over()) break;
          if (/[?&]debug\b/.test(location.search)) window.__wq = { lon: it.lon, lat: it.lat, kind: it.kind, name: it.names && it.names[0] };
          const v = yield screen(K, ctx, it, i, rounds.length, ph, decks, { dbl, zoom: mode === "zoom" });
          K.snd.sting("wvNext", { duck: 0.45 });
          v.board.draw();
          yield K.sleep(1700);
          if (K.over()) break;
          if (kids) yield kidsRound(K, ctx, it, v);
          else {
            const live = K.alive().filter((p) => !p.away);
            v.board.start(live.length);
            v.clock.go();
            if (mode === "zoom") v.host.classList.add("zooming");
            const langs = [...new Set(K.players().map((p) => K.langOf(p.id)).filter((l) => l && l !== K.lang))];
            const qIn = (lg) => __async(this, null, function* () {
              if (it.kind === "flag") return trIn(K, lg, "Where is this flag's country?");
              const t = yield trIn(K, lg, W.plural(it, lg) ? "Where are {place}?" : "Where is {place}?", { place: "" });
              const nm = W.nameIn(it, lg);
              return t.replace("", t.startsWith("") ? W.cap(nm) : nm);
            });
            const tr = {};
            for (const lg of langs) tr[lg] = { q: yield qIn(lg) };
            const hintsTV = s.hints !== false ? yield hintsFor(K, ctx, it, K.lang) : [];
            const hintsLg = {};
            if (hintsTV.length) for (const lg of langs) hintsLg[lg] = yield hintsFor(K, ctx, it, lg);
            const extra = { map: us ? "us" : "world", area: ctx.areaBox.map(Math.round), tv: 1, q: yield qIn(K.lang), flag: it.kind === "flag" ? "flags/" + it.cc + ".png" : "", mode, x2: dbl ? 1 : 0 };
            if (langs.length) extra.tr = tr;
            let popN = 0, closed = false;
            const pinned = /* @__PURE__ */ new Set();
            const asking = K.ask({ kind: "pin", prompt: yield K.tr("Drop your pin"), sec, open: !sec, extra, onAns: (id) => {
              pinned.add(id);
              v.board.pin(id);
              ctx.fx("pop", 0, { rate: 1 + Math.min(0.7, popN++ * 0.08) });
            } });
            const qn = K.qn();
            const stopReveal = !sec ? hostReveal(K, qn) : null;
            const at = sec ? [0.34, 0.58, 0.8].map((f) => f * sec * 1e3) : [12e3, 24e3, 36e3];
            const timers = hintsTV.map((h, j) => K.after(at[j], () => {
              if (closed || K.over()) return;
              showHint(v, h);
              ctx.fx("hint");
              const trh = {};
              for (const lg of langs) if (hintsLg[lg] && hintsLg[lg][j]) trh[lg] = hintsLg[lg][j].text;
              K.say({ k: "hint", n: qn, i: j, text: h.text, icon: h.icon, flag: h.flag ? h.flag.replace(W.BASE, "") : "", tr: trh });
            }));
            const tuT = sec ? K.after(sec * 1e3, () => {
              if (closed || K.over() || pinned.size >= live.length) return;
              K.snd.sting("wvTimesup", { duck: 0.35 });
            }) : 0;
            const got = yield asking;
            closed = true;
            if (tuT) tuT();
            for (const t of timers) t();
            if (stopReveal) stopReveal();
            v.clock.stop();
            const pins = yield reveal(K, ctx, it, got, v, { dbl });
            if (ko && !K.over()) yield knockOut(K, ctx, pins || [], v);
          }
          K.boo(["happy", "wow", "laugh", "cool"][Math.floor(Math.random() * 4)]);
          const lastNow = last || ko && K.players().length > 1 && K.alive().length <= 1;
          if (lastNow) yield K.sleep(4500);
          else if (s.next === "host") yield hostNext(K, v, K.qn());
          else yield nextIn(K, v, clampN(s.wait, 1, 120, 8));
        }
        return end();
        function end() {
          return __async(this, null, function* () {
            if (K.over()) return [];
            let ps = K.players().slice().sort((a, b) => b.score - a.score);
            if (ko) ps = K.players().slice().sort((a, b) => (a.out ? 1 : 0) - (b.out ? 1 : 0) || b.score - a.score);
            let top = ps.map((p) => ({ id: p.id, name: p.name, score: p.score, photo: p.photo, av: p.av, color: p.color }));
            if (teams) top = P.TEAMS.slice(0, Math.min(4, +s.teamN || 2)).map((t) => ({ team: t[0], id: "team-" + t[0], color: t[2], name: P.f(t[1] + " team"), score: K.players().filter((p) => p.team === t[0]).reduce((a, p) => a + p.score, 0) })).sort((a, b) => b.score - a.score);
            for (const x of top) if (!x.team) {
              const p = K.player(x.id);
              if (p) Object.assign(x, { photo: p.photo, av: p.av });
            }
            yield winners(K, top.slice(0, 3), teams);
            ps.own = true;
            return ps;
          });
        }
      });
    }
  });
  function kidsRound(K, ctx, it, v) {
    return __async(this, null, function* () {
      const right = it.kind === "state" ? "North America" : W.CONT[it.cont] || "Europe";
      const others = P.shuffle(Object.keys(KIDS).filter((c) => c !== right)).slice(0, 3);
      const opts = P.shuffle([right, ...others]);
      const nameIn = (o, lg) => __async(this, null, function* () {
        const lp = !lg || lg === K.lang ? K.packs : window.BVI18N && BVI18N.packs(lg);
        const i2 = BVPACKS.continents.findIndex((c) => c[0] === o);
        return lp && lp.continents && lp.continents[i2] || trIn(K, lg, o);
      });
      const tOpts = yield Promise.all(opts.map((o) => nameIn(o, K.lang)));
      const langs = [...new Set(K.players().map((p) => K.langOf(p.id)).filter((l) => l && l !== K.lang))];
      const tr = {};
      for (const lg of langs) tr[lg] = { o: yield Promise.all(opts.map((o) => nameIn(o, lg))), p: yield trIn(K, lg, "Which continent?") };
      const grid = K.el("div", "answers wq-kids", v.stage);
      const cells = tOpts.map((t, j) => {
        const a = K.el("div", "ans kc", grid);
        a.style.setProperty("--kc", KIDS[opts[j]][1]);
        K.el("span", "em", a, KIDS[opts[j]][0]);
        K.el("span", "", a, t);
        return a;
      });
      v.board.start(K.alive().filter((p) => !p.away).length);
      v.clock.go();
      const extra = { kidsc: opts.map((o) => KIDS[o][0]), kcol: opts.map((o) => KIDS[o][1]), tv: 0 };
      if (langs.length) extra.tr = tr;
      const got = yield K.ask({ kind: "choice", prompt: yield K.tr("Which continent?"), opts: tOpts, sec: ctx.sec, extra, onAns: (id) => {
        v.board.pin(id);
        ctx.fx("pop");
      } });
      v.clock.stop();
      const ok = opts.indexOf(right);
      const anyRight = [...got.values()].some((a) => +a.v === ok);
      ctx.fx(anyRight ? "bull" : "sparkle");
      cells.forEach((c, j) => c.classList.add(j === ok ? "right" : "dim"));
      if (anyRight) try {
        P.confetti(140);
      } catch (e) {
      }
      for (const [id, a] of got) {
        const p = K.player(id);
        if (!p) continue;
        const good = +a.v === ok;
        if (good) p.score += 100;
        v.board.add(p, good ? 100 : 0);
        v.board.mark(p, good, good ? "⭐" : tOpts[+a.v] || "");
        const lg = K.langOf(id) || K.lang;
        K.result(id, { ok: good, vd: good ? 1 : 0, pts: good ? 100 : 0, score: p.score, title: yield trIn(K, lg, good ? "Yay! You got a star!" : "Nice try!"), note: yield trIn(K, lg, "It's in {place}!", { place: yield nameIn(right, lg) }), boo: good ? "boo:party" : "boo:love" });
      }
      yield K.sleep(2200);
      if (K.over()) return;
      v.stage.textContent = "";
      v.stage.className = "wq-stage map";
      const wrap = div("wq-map", v.stage);
      const map = M.create(wrap, { maxS: 2.3 });
      map.fit(ctx.areaBox, { pad: ctx.U * 2 });
      const [ax, ay] = M.xy(it.lon, it.lat);
      const aw = div("wq-ans");
      aw.appendChild(M.pin({ color: "#ff5a6e" }));
      map.add(aw, ax, ay);
      for (const k of ["", " b"]) map.add(div("wq-wave" + k), ax, ay);
      const tag = div("wq-tag");
      tag.style.setProperty("--off", "10.6");
      const tn = document.createElement("span");
      tn.textContent = KIDS[right][0] + " " + tOpts[ok];
      tag.appendChild(tn);
      map.add(tag, ax, ay);
      ctx.fx("land");
      const K1 = M.K;
      yield map.fit([ax - 30 * K1, ay - 16 * K1, ax + 30 * K1, ay + 16 * K1], { pad: ctx.U * 4, top: ctx.U * 10, ms: 1500 });
      keepIn(wrap);
      v.board.done();
      yield K.sleep(1600);
    });
  }
  try {
    const m = BVPLAY.games;
    if (m && m.has("world") && m.has("boowho")) {
      const e = [...m.entries()], w = e.find((x) => x[0] === "world");
      const rest = e.filter((x) => x[0] !== "world");
      const at = rest.findIndex((x) => x[0] === "boowho") + 1;
      rest.splice(at, 0, w);
      m.clear();
      for (const [k, v] of rest) m.set(k, v);
    }
  } catch (e) {
  }
})();
