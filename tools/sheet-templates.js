#!/usr/bin/env node
// Contact sheets: pictures of many templates at once, drawn by Blokvane itself, to look over before you push.
//
//   node tools/sheet-templates.js [path to the extension folder] [--src] [--shape=wide|tall|both] [--filter=word]
//     [--prefix=id-start] [--recipe=name] [--ids=id,id] [--out=folder]
//
//   (default)      the list as it will go live: templates/index.json and its packs
//   --src          the specs in templates/src, built fresh (no need to run the builder first)
//   --shape        wide, tall or both (default both)
//   --filter       only templates whose id, name or category has this word anywhere (several: --filter=sale,menu)
//   --prefix       only templates whose id starts with this (several: --prefix=food-,shop-)
//   --recipe       only templates made with this layout (several: --recipe=receipt,menu); it reads the specs, so it
//                  works like --src
//   --ids          only these templates, by their exact ids (several: --ids=food-tacos,food-brunch)
//   --out          where the pictures go (default: blokvane-template-sheets in your temp folder)
//   (the choices add up: --prefix=food- --recipe=menu is the menus among the food- templates)
//
// Each shape is drawn in its own page, and a sheet whose drawing fails (the browser can run out of memory or crash
// on a busy computer) is drawn again, up to three times, in a new page (and a new browser when the old one is gone).
// Needs Playwright with its Chromium (once: npm install playwright, then npx playwright install chromium).
// The browser it starts can't reach the internet: every address is blocked, so nothing is downloaded or sent.
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { TPL, findExt, load, readSpecs } = require('./kit');

const args = process.argv.slice(2);
const opt = k => { const a = args.find(x => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : ''; };
const many = k => opt(k).split(',').map(s => s.trim()).filter(Boolean);
const ext = findExt(args.find(a => !a.startsWith('--')));
const shapes = { wide: ['wide'], tall: ['tall'], both: ['wide', 'tall'] }[opt('shape') || 'both'] || ['wide', 'tall'];
const words = many('filter').map(w => w.toLowerCase());
const prefixes = many('prefix'), recipes = many('recipe'), ids = new Set(many('ids'));
const out = path.resolve(opt('out') || path.join(os.tmpdir(), 'blokvane-template-sheets'));

// the templates to draw (recipeOf: the layout each one is made with, when it comes from a spec)
let list;
const recipeOf = new Map();
if (args.includes('--src') || recipes.length) {
  const { K } = load(ext);
  const read = readSpecs(K);
  read.errors.forEach(e => console.error(e.message));
  list = read.specs.map(({ spec, where }) => {
    try { const t = K.templateOf(spec); recipeOf.set(t.id, spec.recipe); return t; } catch (e) { console.error(`${where}: ${e.message}`); return null; }
  }).filter(Boolean);
} else {
  const index = JSON.parse(fs.readFileSync(path.join(TPL, 'index.json'), 'utf8'));
  list = [...(index.templates || [])];
  for (const p of index.packs || []) {
    const url = typeof p === 'string' ? p : p.url;
    const file = path.join(TPL, url);
    if (fs.existsSync(file)) list.push(...(JSON.parse(fs.readFileSync(file, 'utf8')).templates || []));
  }
}
if (words.length) list = list.filter(t => words.some(w => `${t.id} ${t.name} ${t.cat}`.toLowerCase().includes(w)));
if (prefixes.length) list = list.filter(t => prefixes.some(p => String(t.id).startsWith(p)));
if (recipes.length) list = list.filter(t => recipes.includes(recipeOf.get(t.id)));
if (ids.size) list = list.filter(t => ids.has(t.id));
if (!list.length) { console.log('No templates to draw.'); process.exit(0); }

// one sheet, drawn in the page (runs in the browser): the cells, then the templates in them
async function drawInPage({ chunk, shape }) {
  const B = BVSign, bad = [];
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;background:#1e293b;font:13px system-ui,sans-serif;color:#e2e8f0';
  const wrap = document.createElement('div');
  wrap.id = 'sheet';
  // (minmax(0, 1fr): a long label is cut short with "...", it never makes its column wider than the others)
  wrap.style.cssText = `display:grid;grid-template-columns:repeat(${shape === 'wide' ? 3 : 6},minmax(0,1fr));gap:14px;padding:14px;width:1530px;box-sizing:border-box`;
  document.body.appendChild(wrap);
  for (const raw of chunk) {
    const cell = document.createElement('div'), pv = document.createElement('div'), lab = document.createElement('div');
    const w = shape === 'wide' ? 490 : 236;
    pv.className = 'sg-stage';
    pv.style.cssText = `position:relative;width:${w}px;aspect-ratio:${shape === 'wide' ? '16/9' : '9/16'};overflow:hidden;border-radius:6px;background:#000`;
    lab.textContent = `${raw.id}  (${raw.cat})`;
    lab.style.cssText = 'margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
    cell.style.minWidth = '0';
    cell.append(pv, lab);
    wrap.appendChild(cell);
    const k = w / B.designW(shape === 'wide' ? '16:9' : '9:16');
    pv.style.setProperty('--k', String(k));
    // (exactly what Blokvane shows: the template after its checks)
    const t = B.cleanTemplate(raw);
    if (!t) { bad.push(raw.id + ': not taken'); continue; }
    try { B.renderSlide(pv, t.build(shape), { settings: { background: '#000000' } }, { mode: 'thumb', still: true, sample: true, scale: () => k }); }
    catch (e) { bad.push(raw.id + ': ' + e.message); }
  }
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 900));
  return bad;
}

(async () => {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright is needed: npm install playwright, then npx playwright install chromium'); process.exit(1); }
  fs.mkdirSync(out, { recursive: true });
  const user = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-sheets-'));
  let ctx = null, id = '', page = null;
  // the browser, with Blokvane in it (again, when the one before is gone)
  const browser = async () => {
    if (ctx) return;
    ctx = await chromium.launchPersistentContext(user, {
      headless: true, channel: 'chromium', viewport: { width: 1560, height: 1000 },
      args: ['--headless=new', '--no-proxy-server', `--disable-extensions-except=${ext}`, `--load-extension=${ext}`,
        // every host name fails: nothing outside this computer can be reached
        '--host-resolver-rules=MAP * ~NOTFOUND']
    });
    const mine = ctx;
    mine.on('close', () => { if (ctx === mine) { ctx = null; page = null; } });
    let sw = mine.serviceWorkers()[0];
    if (!sw) sw = await mine.waitForEvent('serviceworker', { timeout: 20000 });
    id = sw.url().split('/')[2];
  };
  // a page with Blokvane's Signage code, ready to draw
  const errors = [];
  const fresh = async () => {
    if (page) { await page.close().catch(() => {}); page = null; }
    await browser();
    page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`chrome-extension://${id}/signage.html`);
    await page.waitForFunction(() => window.BVSign && BVSign.renderSlide && BVSign.cleanTemplate, null, { timeout: 20000 });
  };
  const done = async () => { if (ctx) await ctx.close().catch(() => {}); fs.rmSync(user, { recursive: true, force: true }); };
  try {
    const files = [];
    let again = 0;
    for (const shape of shapes) {
      // (each shape in a page of its own)
      await fresh();
      const per = 12;
      for (let p = 0; p * per < list.length; p++) {
        const chunk = list.slice(p * per, p * per + per);
        const file = path.join(out, `templates-${shape}-${String(p + 1).padStart(2, '0')}.png`);
        let problems = null;
        for (let tries = 1; problems === null; tries++) {
          try {
            if (!page) await fresh();
            problems = await page.evaluate(drawInPage, { chunk, shape });
            await (await page.$('#sheet')).screenshot({ path: file });
          } catch (e) {
            problems = null;
            if (tries >= 3) throw new Error(`${path.basename(file)} could not be drawn: ${e.message}`);
            again++;
            console.log(`${path.basename(file)}: drawn again in a new page (${String(e.message || e).split('\n')[0].slice(0, 120)})`);
            await fresh().catch(() => { page = null; });
          }
        }
        files.push(file);
        problems.forEach(m => console.log('problem ' + m));
      }
    }
    if (errors.length) console.log('page errors:\n  ' + errors.join('\n  '));
    console.log(`${list.length} template${list.length === 1 ? '' : 's'} on ${files.length} sheet${files.length === 1 ? '' : 's'} in ${out}${again ? ` (${again} drawn again)` : ''}`);
  } finally { await done(); }
})().catch(e => { console.error(e.message || e); process.exit(1); });
