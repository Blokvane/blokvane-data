// Tests for the template tools (run: node --test tools/test-tools.js; BLOKVANE_EXT can name the extension folder).
// They work in a folder of their own in the temp folder: nothing in this repo is changed.
//   TOOLS_DIR    another copy of these tools to test (default: this folder)
//   README_FILE  the spec guide to check (default: templates/src/README.md)
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const TOOLS = path.resolve(process.env.TOOLS_DIR || __dirname);
const README = path.resolve(process.env.README_FILE || path.join(__dirname, '..', 'templates', 'src', 'README.md'));
const kit = require(path.join(TOOLS, 'kit.js'));
const EXT = process.env.BLOKVANE_EXT ? path.resolve(process.env.BLOKVANE_EXT) : kit.findExt();
const { B, K } = kit.load(EXT);
const copy = o => JSON.parse(JSON.stringify(o));

// a good template, as the builder makes it
const SPEC = { id: 'tools-test-board', name: 'Test board', cat: 'Retail', color: 'red', tags: 'test,board,shop', recipe: 'hero', palette: 'ruby',
  o: { kick: 'Welcome to', title: 'Test board', sub: 'Made up for a test', art: [['star']] } };
const GOOD = K.templateOf(SPEC);
const problems = t => kit.checkTemplate(B, K, t, {}).errors;

// a folder with these tools and a small templates folder, to run them in
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-tools-'));
  fs.mkdirSync(path.join(dir, 'tools'));
  for (const f of fs.readdirSync(TOOLS)) if (f.endsWith('.js')) fs.copyFileSync(path.join(TOOLS, f), path.join(dir, 'tools', f));
  fs.mkdirSync(path.join(dir, 'templates', 'src'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'templates', 'packs'));
  return dir;
}
const run = (dir, tool) => spawnSync(process.execPath, [path.join(dir, 'tools', tool), EXT], { cwd: dir, encoding: 'utf8', timeout: 120000 });

test('the checker passes a good template', () => {
  assert.deepStrictEqual(problems(GOOD), []);
});

test('the checker stops on every value Blokvane would change, a slide with days of its own, and a slide that is not an object', () => {
  const wa = t => t.wide.items.find(i => i.type === 'widget' && i.widget.kind === 'wordart');
  const cases = {
    'a color written as a name': t => { wa(t).widget.cfg.c1 = 'red'; },
    'a box outside the slide': t => { wa(t).x = 400; },
    'a setting with a dash': t => { wa(t).widget.cfg['font-size'] = '40px'; },
    'a background written as CSS': t => { t.wide.background = 'linear-gradient(90deg, #000, #fff)'; },
    'a rule without its hours': t => { t.when = { kind: 'year', month: 3, day: 14, span: 1, label: 'Pi Day' }; },
    'a rule label of 80 letters': t => { t.when = { kind: 'year', month: 3, day: 14, span: 1, start: '00:00', end: '00:00', label: 'x'.repeat(80) }; },
    'a tall slide given as words': t => { t.tall = 'see the wide one'; },
    'a slide with days of its own': t => { t.wide.when = { on: true, rules: [{ kind: 'week', days: [1, 2, 3, 4, 5], start: '08:00', end: '18:00' }] }; },
    'a slide switched off': t => { t.wide.enabled = false; }
  };
  const passed = [];
  for (const [name, change] of Object.entries(cases)) {
    const t = copy(GOOD);
    change(t);
    if (!problems(t).length) passed.push(name);
  }
  assert.deepStrictEqual(passed, [], 'each one is stopped');
});

test('the checker stops on a list bigger than Blokvane reads in one update (24 MB)', () => {
  const dir = sandbox();
  try {
    // 13 packs of about 1.95 MB each (each under the 2 MB a pack may have): 25 MB together
    const pad = 'x'.repeat(1.95 * 1024 * 1024);
    const packs = [];
    for (let i = 0; i < 13; i++) {
      const t = { ...copy(GOOD), id: `tools-test-board-${i}` };
      fs.writeFileSync(path.join(dir, 'templates', 'packs', `p${i}.json`), `{"cat":"Retail","templates":[${JSON.stringify(t)}],"pad":"${pad}"}\n`);
      packs.push({ url: `packs/p${i}.json`, cat: 'Retail', count: 1 });
    }
    fs.writeFileSync(path.join(dir, 'templates', 'index.json'), JSON.stringify({ templates: [], packs }));
    const r = run(dir, 'check-templates.js');
    assert.notStrictEqual(r.status, 0, 'it does not pass');
    assert.match(r.stderr + r.stdout, /24 MB/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the builder never writes through a link (a pack that links to a file somewhere else)', () => {
  const dir = sandbox();
  const outside = path.join(dir, 'outside.txt');
  try {
    fs.writeFileSync(outside, 'not to be changed\n');
    fs.writeFileSync(path.join(dir, 'templates', 'index.json'), JSON.stringify({ templates: [] }));
    fs.writeFileSync(path.join(dir, 'templates', 'src', 'one.js'), `module.exports = [${JSON.stringify(SPEC)}];\n`);
    fs.symlinkSync(outside, path.join(dir, 'templates', 'packs', 'retail.json'));
    const r = run(dir, 'build-templates.js');
    assert.notStrictEqual(r.status, 0, 'it stops');
    assert.match(r.stderr + r.stdout, /link/);
    assert.strictEqual(fs.readFileSync(outside, 'utf8'), 'not to be changed\n', 'the file it links to is not changed');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// Fix (audit): Git on Windows can check the packs out with Windows line endings; their versions were then read as
// wrong and every pack failed the check. The tools from before this fix fail this test (TOOLS_DIR: a copy of them).
test('Fix (audit): a pack with Windows line endings keeps its version, and the checker sees each pack asked for with it', () => {
  const dir = sandbox();
  try {
    fs.writeFileSync(path.join(dir, 'templates', 'index.json'), JSON.stringify({ templates: [] }));
    fs.writeFileSync(path.join(dir, 'templates', 'src', 'one.js'), `module.exports = [${JSON.stringify(SPEC)}];\n`);
    const b = run(dir, 'build-templates.js');
    assert.strictEqual(b.status, 0, b.stderr + b.stdout);
    const packs = fs.readdirSync(path.join(dir, 'templates', 'packs'));
    assert.ok(packs.length > 0, 'a pack was built');
    for (const f of packs) { const file = path.join(dir, 'templates', 'packs', f); fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace(/\n/g, '\r\n')); }
    const r = run(dir, 'check-templates.js');
    assert.strictEqual(r.status, 0, r.stderr + r.stdout);
    assert.match(r.stdout, /Loaded like Blokvane does/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the spec guide says spec files are code, to be read before building', () => {
  const text = fs.readFileSync(README, 'utf8');
  assert.match(text, /## Spec files are code/);
  assert.match(text, /read every spec file you did not write yourself/i);
  assert.match(text, /never writes through a link/);
});

// ---------- contact sheets (sheet-templates.js) ----------
const runWith = (dir, tool, extra, env = {}) => spawnSync(process.execPath, [path.join(dir, 'tools', tool), EXT, ...extra], { cwd: dir, encoding: 'utf8', timeout: 240000, env: { ...process.env, ...env } });
const spec = (id, more = {}) => ({ id, name: 'Sheet ' + id, cat: 'Retail', color: 'red', tags: 'test,sheet,board', recipe: 'hero', palette: 'ruby',
  o: { kick: 'Welcome to', title: 'Sheet test', sub: 'Made up for a test' }, ...more });
const specsIn = (dir, list) => fs.writeFileSync(path.join(dir, 'templates', 'src', 'sheet.js'), `module.exports = ${JSON.stringify(list)};\n`);
// the lengths of the runs of picture (anything but the sheet's own background) along one line of a sheet
async function runsOnLine(file, y) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    return await page.evaluate(async ({ src, y }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, y, img.width, 1).data;
      const runs = [];
      let n = 0;
      for (let x = 0; x < img.width; x++) {
        const [r, gg, b] = [d[x * 4], d[x * 4 + 1], d[x * 4 + 2]];
        // (the sheet's background is #1e293b)
        const bg = Math.abs(r - 30) < 4 && Math.abs(gg - 41) < 4 && Math.abs(b - 59) < 4;
        if (!bg) n++; else { if (n) runs.push(n); n = 0; }
      }
      if (n) runs.push(n);
      return runs;
    }, { src: 'data:image/png;base64,' + fs.readFileSync(file).toString('base64'), y });
  } finally { await browser.close(); }
}

test('tall sheets keep all six columns when a label is long (the label is cut short, the column is not widened)', async () => {
  const dir = sandbox();
  try {
    // six templates with long ids and a long category name: long labels under every picture
    specsIn(dir, Array.from({ length: 6 }, (_, i) => spec(`a-long-template-id-for-the-sheet-test-${i}`, { cat: 'Marketing and social' })));
    const r = runWith(dir, 'sheet-templates.js', ['--src', '--shape=tall', '--out=' + path.join(dir, 'out')]);
    assert.strictEqual(r.status, 0, r.stderr + r.stdout);
    const runs = (await runsOnLine(path.join(dir, 'out', 'templates-tall-01.png'), 80)).filter(n => n >= 100);
    assert.strictEqual(runs.length, 6, `pictures across the first row: ${runs.join(', ')}`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('sheets can be drawn for the ids that start with some words (--prefix), for one layout (--recipe) or for some ids (--ids)', () => {
  const dir = sandbox();
  try {
    specsIn(dir, [spec('food-tacos'), spec('cel-food-truck'), spec('shop-sale', { recipe: 'banner', o: { kick: 'Big', title: 'Sale', sub: 'This week' } })]);
    fs.writeFileSync(path.join(dir, 'templates', 'index.json'), JSON.stringify({ templates: [] }));
    const said = extra => { const r = runWith(dir, 'sheet-templates.js', [...extra, '--shape=wide', '--out=' + path.join(dir, 'out')]); return (r.stdout + r.stderr).trim().split('\n').pop(); };
    // (--filter=food- also finds cel-food-truck: any part of the id)
    assert.match(said(['--src', '--prefix=food-']), /^1 template on 1 sheet /);
    assert.match(said(['--recipe=banner']), /^1 template on 1 sheet /);
    assert.match(said(['--src', '--ids=cel-food-truck,shop-sale']), /^2 templates on 1 sheet /);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a sheet whose drawing fails (a browser that crashed) is drawn again, and the run still ends with every sheet', () => {
  const dir = sandbox();
  try {
    specsIn(dir, [spec('crash-one'), spec('crash-two')]);
    // a stand-in for Playwright that makes the second drawing of a sheet fail once, as a crashed page does
    fs.mkdirSync(path.join(dir, 'node_modules', 'playwright'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'node_modules', 'playwright', 'index.js'), `
      const real = require(${JSON.stringify(require.resolve('playwright'))});
      let n = 0;
      const wrap = page => { const ev = page.evaluate.bind(page); page.evaluate = async (...a) => { if (++n === 2) throw new Error('Target crashed (made up by the test)'); return ev(...a); }; return page; };
      module.exports = { ...real, chromium: { launch: (...a) => real.chromium.launch(...a), launchPersistentContext: async (...a) => {
        const ctx = await real.chromium.launchPersistentContext(...a);
        const np = ctx.newPage.bind(ctx);
        ctx.newPage = async (...b) => wrap(await np(...b));
        return ctx;
      } } };`);
    const r = runWith(dir, 'sheet-templates.js', ['--src', '--shape=both', '--out=' + path.join(dir, 'out')]);
    assert.strictEqual(r.status, 0, 'the run ends well: ' + r.stderr + r.stdout);
    assert.match(r.stdout, /drawn again/);
    assert.deepStrictEqual(fs.readdirSync(path.join(dir, 'out')).sort(), ['templates-tall-01.png', 'templates-wide-01.png']);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
