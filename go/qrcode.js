// Blokvane: makes QR codes on this computer (for links, Wi-Fi, "follow us" cards and screen addresses).
// Standard QR (ISO 18004), byte mode, versions 1 to 40, all four error correction levels.
var BVQR = (() => {
  const ECC_PER_BLOCK = [
    [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
    [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
    [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]
  ];
  const BLOCKS = [
    [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
    [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
    [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
    [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81]
  ];
  const LEVELS = { L: 0, M: 1, Q: 2, H: 3 };
  const FORMAT_BITS = [1, 0, 3, 2];
  const bit = (x, i) => ((x >>> i) & 1) !== 0;
  function rawModules(ver) {
    let r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) { const n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
    return r;
  }
  const dataCodewords = (ver, e) => Math.floor(rawModules(ver) / 8) - ECC_PER_BLOCK[e][ver] * BLOCKS[e][ver];
  function mul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z & 0xff; }
  function divisor(deg) {
    const r = new Array(deg).fill(0);
    r[deg - 1] = 1;
    let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = mul(root, 2);
    }
    return r;
  }
  function remainder(data, div) {
    const r = div.map(() => 0);
    for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= mul(c, f); }); }
    return r;
  }
  function utf8(s) { return Array.from(new TextEncoder().encode(String(s))); }

  // text -> { size, dark(x, y) }
  function make(text, level = 'M') {
    const bytes = utf8(text);
    let e = LEVELS[level] != null ? LEVELS[level] : 1;
    let ver = 0;
    for (let v = 1; v <= 40; v++) {
      const bits = 4 + (v < 10 ? 8 : 16) + bytes.length * 8;
      if (bits <= dataCodewords(v, e) * 8) { ver = v; break; }
    }
    if (!ver) throw new Error('That is too long for a QR code.');
    // a bigger safety margin when it fits in the same size
    for (let up = e + 1; up <= 3; up++) { const bits = 4 + (ver < 10 ? 8 : 16) + bytes.length * 8; if (bits <= dataCodewords(ver, up) * 8) e = up; else break; }
    // the bits: byte mode, length, data, end, padding
    const bb = [];
    const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
    push(4, 4);
    push(bytes.length, ver < 10 ? 8 : 16);
    for (const b of bytes) push(b, 8);
    const cap = dataCodewords(ver, e) * 8;
    push(0, Math.min(4, cap - bb.length));
    push(0, (8 - bb.length % 8) % 8);
    for (let pad = 0xec; bb.length < cap; pad ^= 0xec ^ 0x11) push(pad, 8);
    const data = [];
    for (let i = 0; i < bb.length; i += 8) data.push(parseInt(bb.slice(i, i + 8).join(''), 2));
    // error correction, interleaved
    const nb = BLOCKS[e][ver], el = ECC_PER_BLOCK[e][ver], raw = Math.floor(rawModules(ver) / 8);
    const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb);
    const div = divisor(el);
    const blocks = [];
    for (let i = 0, k = 0; i < nb; i++) {
      const d = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1));
      k += d.length;
      const ecc = remainder(d, div);
      if (i < nShort) d.push(0);
      blocks.push(d.concat(ecc));
    }
    const all = [];
    for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= nShort) all.push(b[i]); });

    const size = ver * 4 + 17;
    const m = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const x = cx + dx, y = cy + dy; if (x >= 0 && x < size && y >= 0 && y < size) { const dist = Math.max(Math.abs(dx), Math.abs(dy)); set(x, y, dist !== 2 && dist !== 4); } } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const align = [];
    if (ver > 1) {
      const n = Math.floor(ver / 7) + 2;
      const step = ver === 32 ? 26 : Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2;
      align.push(6);
      for (let pos = size - 7; align.length < n; pos -= step) align.splice(1, 0, pos);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(align[i] + dx, align[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
    const format = mask => {
      const d = FORMAT_BITS[e] << 3 | mask;
      let rem = d;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const bits = (d << 10 | rem) ^ 0x5412;
      for (let i = 0; i <= 5; i++) set(8, i, bit(bits, i));
      set(8, 7, bit(bits, 6)); set(8, 8, bit(bits, 7)); set(7, 8, bit(bits, 8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, bit(bits, i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(bits, i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(bits, i));
      set(8, size - 8, true);
    };
    format(0);
    if (ver >= 7) {
      let rem = ver;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
      const bits = ver << 12 | rem;
      for (let i = 0; i < 18; i++) { const b = bit(bits, i), a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, b); set(c, a, b); }
    }
    // the data in the zigzag
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!fn[y][x] && i < all.length * 8) { m[y][x] = bit(all[i >>> 3], 7 - (i & 7)); i++; }
      }
    }
    const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0, (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
      (x, y) => x * y % 2 + x * y % 3 === 0, (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const apply = k => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && MASKS[k](x, y)) m[y][x] = !m[y][x]; };
    const penalty = () => {
      let r = 0;
      const lines = (get) => {
        for (let a = 0; a < size; a++) {
          let color = false, run = 0;
          const hist = [0, 0, 0, 0, 0, 0, 0];
          const addHist = len => { if (hist[0] === 0) len += size; hist.pop(); hist.unshift(len); };
          const count = () => { const n = hist[1]; const core = n > 0 && hist[2] === n && hist[3] === n * 3 && hist[4] === n && hist[5] === n; return (core && hist[0] >= n * 4 && hist[6] >= n ? 1 : 0) + (core && hist[6] >= n * 4 && hist[0] >= n ? 1 : 0); };
          for (let b = 0; b < size; b++) {
            if (get(a, b) === color) { run++; if (run === 5) r += 3; else if (run > 5) r++; }
            else { addHist(run); if (!color) r += count() * 40; color = get(a, b); run = 1; }
          }
          if (color) { addHist(run); run = 0; }
          run += size; addHist(run); r += count() * 40;
        }
      };
      lines((a, b) => m[a][b]);
      lines((a, b) => m[b][a]);
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = m[y][x]; if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) r += 3; }
      let dark = 0;
      for (const row of m) for (const c of row) if (c) dark++;
      const total = size * size;
      r += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return r;
    };
    let best = 0, bestScore = Infinity;
    for (let k = 0; k < 8; k++) {
      apply(k); format(k);
      const s = penalty();
      if (s < bestScore) { bestScore = s; best = k; }
      apply(k);
    }
    apply(best); format(best);
    return { size, version: ver, dark: (x, y) => x >= 0 && y >= 0 && x < size && y < size && m[y][x] };
  }
  // an <svg> with the code (border: empty modules around it, which phones need to read it)
  function svgOf(text, o = {}) {
    const q = make(text, o.level || 'M');
    const border = o.border == null ? 4 : o.border, n = q.size + border * 2;
    let d = '';
    for (let y = 0; y < q.size; y++) {
      let x = 0;
      while (x < q.size) {
        if (!q.dark(x, y)) { x++; continue; }
        let w = 1;
        while (x + w < q.size && q.dark(x + w, y)) w++;
        d += `M${x + border} ${y + border}h${w}v1h-${w}z`;
        x += w;
      }
    }
    const NS = 'http://www.w3.org/2000/svg';
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', `0 0 ${n} ${n}`);
    s.setAttribute('shape-rendering', 'crispEdges');
    if (o.cls) s.setAttribute('class', o.cls);
    const bg = document.createElementNS(NS, 'rect');
    bg.setAttribute('width', n); bg.setAttribute('height', n); bg.setAttribute('fill', o.light || '#ffffff');
    s.appendChild(bg);
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', d); p.setAttribute('fill', o.dark || '#000000');
    s.appendChild(p);
    return s;
  }
  // Wi-Fi joining code (the format phones read)
  const wifi = (ssid, pass, type = 'WPA', hidden = false) => {
    const esc = v => String(v || '').replace(/([\\;,:"])/g, '\\$1');
    return `WIFI:T:${pass ? type : 'nopass'};S:${esc(ssid)};${pass ? `P:${esc(pass)};` : ''}${hidden ? 'H:true;' : ''};`;
  };
  return { make, svgOf, wifi };
})();
if (typeof module !== 'undefined') module.exports = BVQR;
