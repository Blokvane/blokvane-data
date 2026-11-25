#!/usr/bin/env node
// Draws the home-screen icons of Blokvane's three phone apps, all with the same Boo and each with its own colour and
// word, so nobody mixes them up on a home screen:
//   BV Remote    blue,  "REMOTE"   icon-192.png  icon-512.png  icon-maskable-512.png  apple-touch-icon.png
//   BV Games     green, "GAMES"    games-...     (drawn before this tool; left as they are unless --games is given)
//   BV Ad Block  coral, "AD"       ads-192.png   ads-512.png   ads-maskable-512.png   ads-apple-touch.png
// (the Ad Blocker's icon is Blokvane's own icon, the one the browser extension has: Boo with the AD tag)
//
//   node tools/app-icons.js            needs the "playwright" package (a browser draws the pictures)
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const GO = path.join(__dirname, '..', 'go');
// (the letters: Nunito, the font the party games use, read from this repo and handed to the browser inside the page)
const FONT = 'data:font/woff2;base64,' + fs.readFileSync(path.join(__dirname, '..', 'play', 'fonts', 'imp-nunito-latin.woff2')).toString('base64');
// Boo, exactly as everywhere else in Blokvane (go.js, sw.js): the body, two eyes, two glints
const BOO = '<path d="M14 22C14 3 46 3 46 22V46.8Q46 50 42.5 50Q39 50 39 46.8A3.25 2.8 0 0 0 32.5 46.8Q32.5 50 29.25 50Q26 50 26 46.8A2.75 2.8 0 0 0 20.5 46.8Q20.5 50 17.25 50Q14 50 14 46.8Z" fill="#fff"/>' +
  '<ellipse cx="23.6" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><ellipse cx="35.4" cy="24" rx="3" ry="3.7" fill="#2a0f3a"/><circle cx="24.4" cy="22.6" r="1.2" fill="#fff"/><circle cx="36.2" cy="22.6" r="1.2" fill="#fff"/>';
const LOOKS = {
  remote: { from: '#5cbcff', to: '#2c6cf0', word: 'REMOTE', files: ['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'] },
  games: { from: '#3bdc99', to: '#12ad70', word: 'GAMES', files: ['games-192.png', 'games-512.png', 'games-maskable-512.png', 'games-apple-touch.png'] },
  ads: { from: '#ff9463', to: '#ff6263', word: 'AD', files: ['ads-192.png', 'ads-512.png', 'ads-maskable-512.png', 'ads-apple-touch.png'] }
};
// one icon as a drawing, 512 units wide. round: with round corners and nothing outside them (the "any" kind);
// k: how much of the square the picture fills (a "maskable" icon keeps clear of the edge, which a phone may cut off)
function svg(look, round, k) {
  const L = LOOKS[look];
  const tag = L.word === 'AD'
    // Blokvane's own icon: a big Boo with the AD tag on its side
    ? `<g transform="translate(256 256) scale(${k}) translate(-256 -256)"><g transform="translate(70 62) scale(7.6) translate(-10 0)"><g filter="url(#sh)">${BOO}</g></g>` +
      `<rect x="318" y="226" width="150" height="96" rx="20" fill="#1a083b"/><text x="393" y="297" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="68" fill="#ffd451" letter-spacing="1">AD</text></g>`
    // Boo with the app's word under it
    : `<g transform="translate(256 256) scale(${k}) translate(-256 -256)"><g transform="translate(138 52) scale(5.9) translate(-10 0)"><g filter="url(#sh)">${BOO}</g></g>` +
      `<rect x="${256 - (L.word.length * 27 + 34)}" y="372" width="${L.word.length * 54 + 68}" height="88" rx="20" fill="#28143c"/><text x="256" y="436" text-anchor="middle" font-family="Nunito" font-weight="900" font-size="62" fill="#ffd451" letter-spacing="2">${L.word}</text></g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${L.from}"/><stop offset="1" stop-color="${L.to}"/></linearGradient>` +
    `<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="1.1" stdDeviation="1.1" flood-color="#000" flood-opacity=".16"/></filter></defs>` +
    `<rect width="512" height="512" rx="${round ? 114 : 0}" fill="url(#g)"/>${tag}</svg>`;
}
(async () => {
  const which = process.argv.includes('--games') ? ['remote', 'games', 'ads'] : ['remote', 'ads'];
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });
  for (const look of which) {
    const [f192, f512, fmask, fapple] = LOOKS[look].files;
    for (const [file, size, round, k] of [[f192, 192, true, 1], [f512, 512, true, 1], [fmask, 512, false, 0.78], [fapple, 180, false, 0.9]]) {
      await page.setViewportSize({ width: size, height: size });
      await page.setContent(`<style>@font-face{font-family:Nunito;font-weight:900;src:url("${FONT}")}html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg(look, round, k)}`);
      await page.evaluate(() => document.fonts.load('900 60px Nunito').then(() => document.fonts.ready));
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(GO, file), omitBackground: round, clip: { x: 0, y: 0, width: size, height: size } });
      console.log('drew', file);
    }
  }
  await browser.close();
})();
