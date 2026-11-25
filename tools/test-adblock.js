// Checks the Blokvane Ad Blocker app (go/adblock.*) without a browser:
//   - every text the app shows has its words in each of the six other languages (go/lang/ab-<code>.js), with the
//     same {places} as the English text, and no language file holds words the app no longer uses
//   - the page loads the files it names, each with the version that the script itself carries
//   - nothing in the app is written with a long dash
//   node tools/test-adblock.js            checks, and says what is wrong (exit 1)
//   node tools/test-adblock.js --english  prints every English text, one per line (for a translator)
const fs = require('fs');
const path = require('path');
const GO = path.join(__dirname, '..', 'go');
const LANGS = ['es', 'fr', 'ar', 'hi', 'bn', 'zh'];
const read = f => fs.readFileSync(path.join(GO, f), 'utf8');
const js = read('adblock.js');

function english() {
  const out = [], seen = new Set();
  const re = /\bT\(\s*('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")/g;
  let m;
  while ((m = re.exec(js))) {
    const s = (0, eval)(m[1]);
    if (!seen.has(s)) { seen.add(s); out.push(s); }
  }
  return out;
}
function words(code) {
  const got = {};
  const BVAB = { add(c, w) { got[c] = w; } };
  try { new Function('BVAB', read('lang/ab-' + code + '.js'))(BVAB); } catch (e) { return null; }
  return got[code] || null;
}
const places = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
const stars = s => (s.match(/\*/g) || []).length;

if (process.argv.includes('--english')) { console.log(english().join('\n')); process.exit(0); }
const bad = [];
const en = english();
for (const code of LANGS) {
  const w = words(code);
  if (!w) { bad.push(code + ': go/lang/ab-' + code + '.js is missing or cannot be read'); continue; }
  for (const s of en) {
    if (typeof w[s] !== 'string' || !w[s].trim()) bad.push(code + ': no words for: ' + s);
    else {
      if (places(w[s]) !== places(s)) bad.push(code + ': other {places} than the English text: ' + s);
      if (stars(w[s]) !== stars(s)) bad.push(code + ': the *marked part* is missing or doubled: ' + s);
    }
  }
  for (const k of Object.keys(w)) if (!en.includes(k)) bad.push(code + ': words for a text the app no longer has: ' + k);
}
// the page and its files
const html = read('adblock.html');
const v = (/const V = '([^']+)'/.exec(js) || [])[1];
for (const f of ['adblock.css', 'adblock.js']) {
  const m = new RegExp(f.replace('.', '\\.') + '\\?v=([0-9a-z.]+)').exec(html);
  if (!m) bad.push('adblock.html does not load ' + f + ' with a version');
  else if (m[1] !== v) bad.push('adblock.html loads ' + f + '?v=' + m[1] + ', the script says version ' + v);
}
for (const f of ['adblock.webmanifest', 'ads-192.png', 'ads-512.png', 'ads-maskable-512.png', 'ads-apple-touch.png', 'qrcode.js', 'pass.js', 'sw.js']) if (!fs.existsSync(path.join(GO, f))) bad.push('missing file: go/' + f);
try { const m = JSON.parse(read('adblock.webmanifest')); if (m.start_url !== 'adblock.html' || m.scope !== 'adblock.html' || !m.icons || m.icons.length < 3) bad.push('adblock.webmanifest: start, scope or icons are not right'); } catch (e) { bad.push('adblock.webmanifest is not valid'); }
for (const f of ['adblock.js', 'adblock.css', 'adblock.html', 'adblock.webmanifest'].concat(LANGS.map(c => 'lang/ab-' + c + '.js'))) {
  if (fs.existsSync(path.join(GO, f)) && /[\u2014\u2013]/.test(read(f))) bad.push('a long dash in go/' + f);
}
if (bad.length) { console.log(bad.slice(0, 80).join('\n')); console.log(bad.length + ' problem(s).'); process.exit(1); }
console.log('The Ad Blocker app: ' + en.length + ' texts, each in ' + LANGS.length + ' more languages. All good.');
