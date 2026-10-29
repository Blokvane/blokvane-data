#!/usr/bin/env node
// Pictures of the lists, made in a browser (Playwright with Chromium).
//
//   node sheet.js review --ext <the extension's blokvane folder> [--out <folder>]
//       contact sheets of every tab (stickers by group, emoji, words, moving backgrounds, shapes and a sample of
//       the icons) to look over before publishing. They go to tools/review (not part of the list).
//   node sheet.js previews --ext <...>
//       the emoji preview sheets (boobox/emoji/sheets): the first picture of every animated emoji, so Boo Box can
//       show them all at once and only animate what can be seen.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const TOOLS = __dirname;
const BOO = path.resolve(TOOLS, '..');
const DATA = path.resolve(BOO, '..');
const args = process.argv.slice(2);
const arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : ''; };
const mode = args[0];
const fileUrl = p => 'file://' + path.resolve(p).split(path.sep).join('/').replace(/^\/?([A-Za-z]:)/, '/$1');
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'));

async function browser() {
  let pw;
  try { pw = require('playwright'); } catch (e) { console.error('This needs Playwright: run "npm install" in this folder (and "npx playwright install chromium" once).'); process.exit(2); }
  return pw.chromium.launch({ args: ['--allow-file-access-from-files'] });
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const PAGE_CSS = `body{margin:0;font:12px system-ui,sans-serif;background:#fff;color:#1d232b}
h1{font:700 20px system-ui,sans-serif;margin:16px 20px 4px}p.sub{margin:0 20px 12px;color:#5f6b78}
.grid{display:grid;grid-template-columns:repeat(var(--cols),var(--w));gap:10px;padding:0 20px 20px}
.t{display:flex;flex-direction:column;gap:4px}.pic{width:var(--w);height:var(--h);border-radius:10px;position:relative;overflow:hidden;
background:repeating-conic-gradient(#eef0f3 0 25%,#f8f9fa 0 50%) 0 0/20px 20px;display:grid;place-items:center}
.pic.dark{background:#1d2433}.pic img{width:88%;height:88%;object-fit:contain}.l{font-size:10.5px;color:#5f6b78;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:var(--w)}`;

// ---------------------------------------------------------------- review sheets
async function review() {
  const ext = path.resolve(arg('--ext') || '');
  if (!fs.existsSync(path.join(ext, 'lib', 'boo-core.js'))) { console.error('Point --ext at the extension\'s blokvane folder.'); process.exit(2); }
  const out = path.resolve(arg('--out') || path.join(TOOLS, 'review'));
  fs.mkdirSync(out, { recursive: true });
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-sheet-'));
  const b = await browser();
  const page = await b.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const scripts = ['lib/signage-core.js', 'lib/qrcode.js', 'lib/signage-look.js', 'lib/signage-data.js', 'lib/signage-items.js', 'lib/signage-widgets.js', 'lib/signage-weather.js',
    'lib/signage-widgets2.js', 'lib/signage-apps.js', 'lib/signage-art.js', 'lib/lottie_light.min.js', 'lib/boo-core.js', 'lib/signage-boo.js'];
  const styles = ['lib/signage.css', 'lib/signage-widgets.css', 'lib/signage-fonts.css', 'lib/signage-boo.css'];
  const shell = (title, body, cols, w, h, extraHead = '') => `<!doctype html><html><head><meta charset="utf-8">${styles.map(s => `<link rel="stylesheet" href="${fileUrl(path.join(ext, s))}">`).join('')}
<style>${PAGE_CSS}</style><script>window.chrome={storage:{local:{get:async()=>({}),set:async()=>{}},onChanged:{addListener(){}}},runtime:{id:'review'}};</script>
${scripts.map(s => `<script src="${fileUrl(path.join(ext, s))}"></script>`).join('')}${extraHead}</head><body style="--cols:${cols};--w:${w}px;--h:${h}px"><h1>${esc(title)}</h1>${body}</body></html>`;
  const shot = async (name, html, wait = 1200) => {
    const f = path.join(tmp, name + '.html');
    fs.writeFileSync(f, html);
    await page.goto(fileUrl(f));
    await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(out, name + '.png'), fullPage: true });
    console.log('  ' + path.join(out, name + '.png'));
  };
  const made = [];
  // stickers, a sheet per group
  const idx = readJson(path.join(BOO, 'index.json'));
  const BVc = require('./build').core();
  for (const p of idx.tabs.stickers.packs) {
    const list = readJson(path.join(BOO, p)).stickers;
    const tiles = list.map(st => `<div class="t"><div class="pic"><img src="${BVc.svgUri(BVc.stickerSvg(st))}"></div><div class="l">${esc(st.id)}</div></div>`).join('');
    const name = 'stickers-' + path.basename(p, '.json');
    await shot(name, shell(`Stickers: ${list[0].cat} (${list.length})`, `<p class="sub">Each is shown moving; light squares show where it is see-through.</p><div class="grid">${tiles}</div>`, 8, 130, 130));
    made.push(name);
  }
  // words and moving backgrounds, drawn by the real widgets
  const widgetSheet = async (name, title, items, kind, w, h, still) => {
    const data = JSON.stringify(items.map(x => ({ id: x.id, k: x.k || kind, cfg: x.cfg, tile: x.tile || '' })));
    const body = `<div class="grid" id="g"></div><script>
      const items = ${data};
      const g = document.getElementById('g');
      for (const it of items) {
        const t = document.createElement('div'); t.className = 't';
        const p = document.createElement('div'); p.className = 'pic dark'; if (it.tile) p.style.background = it.tile;
        const root = document.createElement('div'); root.className = 'sg-widget'; root.style.cssText = 'position:absolute;inset:${kind === 'wordart' ? '8% 6%' : '0'}';
        p.appendChild(root); t.appendChild(p);
        const l = document.createElement('div'); l.className = 'l'; l.textContent = it.id; t.appendChild(l); g.appendChild(t);
        const def = BVSign.widgets.get(it.k);
        try { def.render(root, Object.assign({}, def.defaults, it.cfg), { mode: 'thumb', still: ${still ? 'true' : 'false'}, scale: () => 1 }); } catch (e) { l.textContent = 'ERROR ' + e.message; }
      }</script>`;
    await shot(name, shell(title, body, Math.floor(1160 / (w + 10)), w, h), 2500);
    made.push(name);
  };
  const words = readJson(path.join(BOO, 'words/words.json')).words;
  for (let i = 0; i < words.length; i += 96) await widgetSheet('words-' + (i / 96 + 1), `Words ${i + 1} to ${Math.min(words.length, i + 96)} of ${words.length}`, words.slice(i, i + 96), 'wordart', 180, 112, false);
  const scenes = readJson(path.join(BOO, 'scenes/scenes.json')).scenes;
  for (let i = 0; i < scenes.length; i += 60) await widgetSheet('scenes-' + (i / 60 + 1), `Moving backgrounds ${i + 1} to ${Math.min(scenes.length, i + 60)} of ${scenes.length}`, scenes.slice(i, i + 60), 'scene', 180, 101, false);
  // shapes (made by the extension's own code)
  {
    const body = `<div class="grid" id="g"></div><script>
      const g = document.getElementById('g');
      for (const s of BVBoo.SHAPES.values()) {
        const t = document.createElement('div'); t.className = 't';
        const p = document.createElement('div'); p.className = 'pic'; p.style.padding = '14px';
        t.appendChild(p); BVSign.drawShape(p, s.id, { fill: '#ff6b5e', fill2: s.id.length % 3 ? '' : '#845ef7', round: s.round ? 14 : 0, line: s.id.length % 4 ? 0 : 4, lineColor: '#2b2346' }, 'x');
        p.querySelector('svg').style.cssText = 'width:100%;height:100%';
        const l = document.createElement('div'); l.className = 'l'; l.textContent = s.group + ': ' + s.name; t.appendChild(l); g.appendChild(t);
      }</script>`;
    await shot('shapes', shell('Shapes (some with a second color and an outline, as people can set them)', body, 10, 104, 104), 800);
    made.push('shapes');
  }
  // icons: a sample from every group
  const eIdx = path.join(DATA, 'elements', 'index.json');
  if (fs.existsSync(eIdx)) {
    const ei = readJson(eIdx);
    const all = [];
    for (const p of ei.icons.packs) all.push(...readJson(path.join(DATA, 'elements', p)).icons);
    const byCat = new Map();
    for (const ic of all) { if (!byCat.has(ic.c)) byCat.set(ic.c, []); byCat.get(ic.c).push(ic); }
    const sample = [];
    for (const [c, list] of byCat) sample.push(...list.filter((x, i) => i % Math.max(1, Math.floor(list.length / 12)) === 0).slice(0, 12));
    const tiles = sample.map(ic => { const s = BVc.iconSvg(ic.o, { color: '#1d232b', stroke: 1.75 }); const f = ic.f ? BVc.iconSvg(ic.f, { color: '#ff6b5e', filled: true }) : ''; return `<div class="t"><div class="pic" style="display:flex;gap:6px;justify-content:center">${s ? `<img style="width:38%;height:38%" src="${BVc.svgUri(s)}">` : 'BAD'}${f ? `<img style="width:38%;height:38%" src="${BVc.svgUri(f)}">` : ''}</div><div class="l">${esc(ic.c + ': ' + ic.n)}</div></div>`; }).join('');
    await shot('icons-sample', shell(`Icons: a sample of ${sample.length} from ${all.length} (outline, and filled where there is one)`, `<div class="grid">${tiles}</div>`, 10, 104, 80), 600);
    made.push('icons-sample');
  }
  // emoji: the preview sheets as they are
  const eList = path.join(BOO, 'emoji', 'list.json');
  if (fs.existsSync(eList)) {
    const j = readJson(eList);
    const sheets = j.sheets;
    const tiles = j.emoji.map(e => {
      if (!e.s) return `<div class="t"><div class="pic">?</div><div class="l">${esc(e.id)}</div></div>`;
      const n = e.s[1], col = n % sheets.cols, row = Math.floor(n / sheets.cols);
      const url = fileUrl(path.join(BOO, sheets.base[e.s[0]]));
      return `<div class="t"><div class="pic"><div style="width:72%;height:72%;background:url('${url}') ${(col / (sheets.cols - 1) * 100)}% ${(row / (sheets.rows - 1) * 100)}%/${sheets.cols * 100}% ${sheets.rows * 100}% no-repeat"></div></div><div class="l">${esc(e.cat + ': ' + e.id)}</div></div>`;
    });
    for (let i = 0; i < tiles.length; i += 140) {
      const name = 'emoji-' + (i / 140 + 1);
      await shot(name, shell(`Emoji ${i + 1} to ${Math.min(tiles.length, i + 140)} of ${tiles.length} (the still picture of each)`, `<div class="grid">${tiles.slice(i, i + 140).join('')}</div>`, 14, 76, 76), 800);
      made.push(name);
    }
  }
  await b.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  if (errors.length) { console.log('Page errors:', errors.slice(0, 10)); process.exitCode = 1; }
  console.log(`${made.length} sheets in ${out}`);
}

// ---------------------------------------------------------------- emoji preview sheets
// (the browser itself turns each sheet into a WebP picture, so nothing else needs to be installed)
async function previews() {
  const ext = path.resolve(arg('--ext') || '');
  const lottieJs = path.join(ext, 'lib', 'lottie_light.min.js');
  if (!fs.existsSync(lottieJs)) { console.error('Point --ext at the extension\'s blokvane folder (it has lib/lottie_light.min.js).'); process.exit(2); }
  const list = readJson(path.join(BOO, 'emoji', 'list.json'));
  const { cols, rows, size } = list.sheets;
  const per = cols * rows;
  const b = await browser();
  const page = await b.newPage({ viewport: { width: cols * size, height: rows * size }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:transparent}#g{display:grid;grid-template-columns:repeat(${cols},${size}px);grid-auto-rows:${size}px}#g div{width:${size}px;height:${size}px;padding:4px;box-sizing:border-box}#g svg{width:100%!important;height:100%!important}</style></head><body><div id="g"></div></body></html>`);
  await page.addScriptTag({ path: lottieJs });
  // The still picture of each emoji: a little before the middle, when most of them are in full swing, unless the
  // emoji is small or away then (a shark swimming past): then the picture where it shows most. The choice goes into
  // list.json ("f", part of the way through), so a still emoji on a slide shows the same picture.
  console.log('  choosing the still picture of each emoji...');
  const FRACS = [0.45, 0, 0.15, 0.3, 0.6, 0.75, 0.9];
  for (const e of list.emoji) {
    const data = readJson(path.join(BOO, 'emoji', 'a', e.id + '.json'));
    const cover = await page.evaluate(async ({ data, fracs }) => {
      const box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:-200px;top:0;width:48px;height:48px';
      document.body.appendChild(box);
      const a = lottie.loadAnimation({ container: box, renderer: 'svg', loop: false, autoplay: false, animationData: data });
      const c = document.createElement('canvas');
      c.width = c.height = 48;
      const g = c.getContext('2d');
      const out = [];
      for (const f of fracs) {
        a.goToAndStop(Math.round((data.op - data.ip) * f), true);
        const svg = box.querySelector('svg').cloneNode(true);
        svg.setAttribute('width', '48'); svg.setAttribute('height', '48');
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(svg));
        try { await img.decode(); } catch (err) { out.push(0); continue; }
        g.clearRect(0, 0, 48, 48);
        g.drawImage(img, 0, 0, 48, 48);
        const d = g.getImageData(0, 0, 48, 48).data;
        let n = 0;
        for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++;
        out.push(n);
      }
      a.destroy();
      box.remove();
      return out;
    }, { data, fracs: FRACS });
    const best = Math.max(...cover);
    const pick = cover[0] >= best * 0.6 ? 0 : cover.indexOf(best);
    if (pick) e.f = FRACS[pick]; else delete e.f;
  }
  fs.writeFileSync(path.join(BOO, 'emoji', 'list.json'), `{"v":${list.v || 1},"sheets":${JSON.stringify(list.sheets)},"emoji":[\n` + list.emoji.map(x => JSON.stringify(x)).join(',\n') + '\n]}\n');
  console.log('  ' + list.emoji.filter(e => e.f != null).length + ' emoji show another picture than the usual one');
  const still = new Map(list.emoji.map(e => [e.id, e.f == null ? 0.45 : e.f]));
  let total = 0;
  const draw = async (files, file) => {
    const data = files.map(f => f ? { ...readJson(path.join(BOO, 'emoji', 'a', f)), bvStill: still.get(f.replace(/(--[a-z-]+)?\.json$/, '')) } : null);
    await page.evaluate(({ data, per }) => {
      const g = document.getElementById('g');
      g.textContent = '';
      for (let i = 0; i < per; i++) {
        const d = document.createElement('div');
        g.appendChild(d);
        const one = data[i];
        if (!one) continue;
        const a = lottie.loadAnimation({ container: d, renderer: 'svg', loop: false, autoplay: false, animationData: one });
        a.goToAndStop(Math.round((one.op - one.ip) * one.bvStill), true);
      }
    }, { data, per });
    await page.waitForTimeout(400);
    const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: cols * size, height: rows * size } });
    const webp = await page.evaluate(async b64 => {
      const img = new Image();
      img.src = 'data:image/png;base64,' + b64;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', 0.86).split(',')[1];
    }, png.toString('base64'));
    const out = path.join(BOO, file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, Buffer.from(webp, 'base64'));
    total += fs.statSync(out).size;
    console.log('  ' + file, fs.statSync(out).size, 'bytes');
  };
  for (let s = 0; s < list.sheets.base.length; s++) {
    const files = new Array(per).fill('');
    for (const e of list.emoji) if (e.s && e.s[0] === s) files[e.s[1]] = e.id + '.json';
    await draw(files, list.sheets.base[s]);
  }
  for (const [tone, sheets] of Object.entries(list.sheets.tones)) {
    for (let s = 0; s < sheets.length; s++) {
      const files = new Array(per).fill('');
      for (const e of list.emoji) if (e.st && e.st[0] === s && e.tones.includes(tone)) files[e.st[1]] = e.id + '--' + tone + '.json';
      await draw(files, sheets[s]);
    }
  }
  await b.close();
  console.log('Preview sheets:', Math.round(total / 1024) + ' KB');
}

(async () => {
  if (mode === 'review') await review();
  else if (mode === 'previews') await previews();
  else { console.log('Usage: node sheet.js review --ext <blokvane folder> [--out <folder>]\n       node sheet.js previews --ext <blokvane folder>'); process.exitCode = 2; }
})().catch(e => { console.error(e); process.exit(1); });
