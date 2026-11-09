// Makes the copies of the party games' TV scripts that older TV browsers run: <name>.old.js beside each <name>.js.
// Smart TVs from 2018 and 2019 (LG webOS 4, with Chrome 53 inside) can't read async functions; these copies say the same
// thing in the older way (esbuild turns async functions into generators). play/index.html loads them only in a browser
// that can't read an async function, so newer browsers never see them.
// Run it after changing any of the scripts below:   npm i esbuild@0.24.0 (once), then   node tools/old-js.js
// Check that every copy is up to date (nothing is written):   node tools/old-js.js --check
const fs = require('fs'), path = require('path');
const esbuild = require('esbuild');
const ROOT = path.join(__dirname, '..');
// the TV's scripts that use async functions (the others, and the data files lang/*.js, gir-data.js and world-data.js, are
// old JavaScript already: play/index.html loads them as they are; go/compat.js is written for every browser)
const FILES = ['go/wt-core.js', 'go/wt-net.js', 'go/live-kit.js', 'play/i18n.js', 'play/common.js', 'play/sound.js', 'play/play.js', 'play/games.js',
  'play/world-game.js', 'play/gir-game.js', 'play/imp-game.js', 'play/emoji-game.js'];
const TARGET = ['chrome53'];
const check = process.argv.includes('--check');
let stale = 0;
for (const f of FILES) {
  const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const out = f.replace(/\.js$/, '.old.js');
  const head = '// Made from ' + path.basename(f) + ' by tools/old-js.js for older TV browsers (async functions written the older way).\n' +
    '// Do not edit this copy: change ' + path.basename(f) + ' and run node tools/old-js.js again.\n';
  const r = esbuild.transformSync(src, { loader: 'js', target: TARGET, charset: 'utf8', legalComments: 'none', format: undefined });
  const text = head + r.code;
  const cur = fs.existsSync(path.join(ROOT, out)) ? fs.readFileSync(path.join(ROOT, out), 'utf8') : '';
  if (cur === text) continue;
  stale++;
  if (check) console.log('out of date: ' + out);
  else { fs.writeFileSync(path.join(ROOT, out), text); console.log('wrote ' + out); }
}
if (check) { console.log(stale ? stale + ' copies out of date: run node tools/old-js.js' : 'all copies up to date'); process.exit(stale ? 1 : 0); }
