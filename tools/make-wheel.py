# Makes play/wheel.js, Trivia's category wheel, from its design (the "Spin Wheel.dc.html" in the design's export, in
# Games/Trivia/Trivia lobby screen options/spin-wheel-export/source). The wheel's drawing is taken as it is: the eight
# colors with their stars, the gold rim with its 24 lights, the hub with Boo, and the pin. Only the drawing's ids get a
# "tw" in front (so they can't clash with another drawing on the same page), the lights get classes instead of the
# design's blinking values, and each part gets a class instead of its place in pixels (play/wheel.js places them in
# percent, so the wheel can be any size: the TV's and the phone's are the same drawing).
#   python3 tools/make-wheel.py "<the export>/source/Spin Wheel.dc.html" > play/wheel.js
import re, sys, json

src = open(sys.argv[1], encoding='utf-8').read()
start = src.index('onClick="{{ spin }}"')
part = src[start:src.index('</x-dc>')]

def svg_at(i):
    # the whole <svg>...</svg> that starts at i (svgs don't nest in this design)
    j = part.index('</svg>', i) + len('</svg>')
    return part[i:j], j

# the five drawings, in order: the turning wheel, the rim with its lights, the hub, Boo, the pin
svgs, pos = [], 0
for _ in range(5):
    i = part.index('<svg', pos)
    s, pos = svg_at(i)
    svgs.append(s)
turn, rim, hub, boo, pin = svgs

def head(s, cls):
    m = re.match(r'<svg\b[^>]*?viewBox="([^"]+)"[^>]*>', s)
    assert m, s[:120]
    return '<svg' + (' class="' + cls + '"' if cls else '') + ' viewBox="' + m.group(1) + '" aria-hidden="true">' + s[m.end():]

turn, rim, hub, boo, pin = head(turn, ''), head(rim, 'tw-rim'), head(hub, 'tw-hub'), head(boo, 'tw-boo'), head(pin, 'tw-pin')

# the ids: tw in front
ids = sorted(set(re.findall(r'\bid="([^"]+)"', turn)), key=len, reverse=True)
def ren(s):
    for x in ids:
        s = s.replace('id="' + x + '"', 'id="tw' + x + '"').replace('url(#' + x + ')', 'url(#tw' + x + ')')
    return s
turn, rim, hub, boo, pin = (ren(x) for x in (turn, rim, hub, boo, pin))

# the lights: the design blinks them with these values; here they're classes (the CSS below has the same values)
rim = rim.replace('opacity="{{ i0 }}"', 'class="h0"').replace('opacity="{{ i1 }}"', 'class="h1"')
rim = rim.replace('opacity="{{ b0 }}"', 'class="l0"').replace('opacity="{{ b1 }}"', 'class="l1"')
for x in (turn, rim, hub, boo, pin):
    assert '{{' not in x, x[:200]

# the eight colors (each one's bright middle), top first, then clockwise
cols = []
for k in range(8):
    m = re.search(r'id="tws' + str(k) + r'"[^>]*>(.*?)</linearGradient>', turn)
    stops = re.findall(r'stop-color="(#[0-9a-fA-F]{6})"', m.group(1))
    cols.append(stops[1])

# the parts' places, from the design's pixels (its wheel is 900 by 900), in percent of the wheel
def pct(v): return ('%.3f' % (100 * v / 900)).rstrip('0').rstrip('.') + '%'
glow = re.search(r'<div style="position:absolute;inset:(-?\d+)px;border-radius:50%;background:([^"]+)"', part)
gi, gbg = int(glow.group(1)), glow.group(2)
place = {}
for name, s in (('hub', svgs[2]), ('boo', svgs[3]), ('pin', svgs[4])):
    w = int(re.search(r'width="(\d+)"', s).group(1)); h = int(re.search(r'height="(\d+)"', s).group(1))
    l = int(re.search(r'left:(-?\d+)px', s).group(1)); t = int(re.search(r'top:(-?\d+)px', s).group(1))
    f = re.search(r'filter:(drop-shadow\([^;"]*\))', s)
    place[name] = (l, t, w, h, f.group(1) if f else '')
trans = re.search(r"trans: '([^']+)'", src).group(1)
add_turns = re.search(r'const add = 360 \* (\d+) \+', src).group(1)

css = ('.tw{position:relative;width:100%;height:0;padding-top:100%;direction:ltr}'
       '.tw>*{position:absolute}'
       '.tw-glow{left:' + pct(gi) + ';top:' + pct(gi) + ';width:' + pct(900 - 2 * gi) + ';height:' + pct(900 - 2 * gi) + ';border-radius:50%;background:' + gbg + '}'
       '.tw-turn{left:0;top:0;width:100%;height:100%}'
       '.tw-turn svg{display:block;width:100%;height:100%}'
       '.tw-rim{left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none}')
for name, (l, t, w, h, f) in place.items():
    css += '.tw-' + name + '{left:' + pct(l) + ';top:' + pct(t) + ';width:' + pct(w) + ';height:' + pct(h) + '}'
css += '.tw .h1,.tw.alt .h0{opacity:0}.tw .l1,.tw.alt .l0{opacity:.35}.tw.alt .h1,.tw.alt .l1{opacity:1}'

shadows = {n: v[4] for n, v in place.items() if v[4]}
out = '''// Blokvane party games: Trivia's category wheel, drawn exactly as its design (the spin-wheel export in
// Games/Trivia/Trivia lobby screen options): eight colors with a star each, a gold rim with 24 lights that take turns,
// the hub with Boo, and the pin on top. The TV (games.js) and the phones (../go/m/party.js) both draw it from here, so
// it is the same wheel on both, at any size. Made from the design by tools/make-wheel.py (don't change it by hand).
// One spin is always the design's own: %(turns)s turns and two colors more in 6 seconds, slowing down the same way (so the
// clicks in its sound, sounds/t-spin.mp3, fall right on the lines); where it lands depends on where it starts.
var BVWHEEL = (function () {
  'use strict';
  var TURN = %(turn)s;
  var RIM = %(rim)s;
  var HUB = %(hub)s;
  var BOO = %(boo)s;
  var PIN = %(pin)s;
  var CSS = %(css)s;
  // (the shadows under the hub and the pin, in the design's pixels: they grow and shrink with the wheel)
  var SHADOW = %(shadows)s;
  var COLORS = %(cols)s;
  var ADD = 360 * %(turns)s + 90, MS = 6000, MOVE = 'transform 6s %(ease)s';
  function css() {
    if (document.getElementById('tw-css')) return;
    var s = document.createElement('style');
    s.id = 'tw-css';
    s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  // where the wheel starts, so that a spin ends with color seg (0 is the pink one, on top at the start) under the pin
  function startFor(seg) { return 45 * (((6 - seg) %% 8 + 8) %% 8); }
  function make(parent) {
    css();
    var el = document.createElement('div');
    el.className = 'tw';
    el.innerHTML = '<div class="tw-glow"></div><div class="tw-turn">' + TURN + '</div>' + RIM + HUB + BOO + PIN;
    parent.appendChild(el);
    var turn = el.querySelector('.tw-turn'), blink = 0, done = 0, deg = 0;
    // the lights take turns: every 0.6 seconds, and fast while it spins
    function lights(ms) {
      clearInterval(blink);
      blink = setInterval(function () { if (!el.parentNode) { clearInterval(blink); return; } el.classList.toggle('alt'); }, ms);
    }
    lights(600);
    function shade() {
      var k = el.offsetWidth / 900;
      if (!k) return;
      for (var n in SHADOW) {
        var x = el.querySelector('.tw-' + n);
        if (!x) continue;
        var f = SHADOW[n].replace(/(-?[\\d.]+)px/g, function (m, v) { return (+v * k).toFixed(2) + 'px'; });
        x.style.webkitFilter = f; x.style.filter = f;
      }
    }
    setTimeout(shade, 0);
    function at(d) { deg = d; turn.style.transition = 'none'; turn.style.webkitTransform = turn.style.transform = 'rotate(' + d + 'deg)'; }
    return {
      el: el,
      // the wheel turned to d degrees, standing still
      at: at,
      // ready to land on color seg: turned to where that spin starts
      ready: function (seg) { at(startFor(seg)); },
      // the spin (calm: a short one for people who asked for less motion). Resolves once it has landed.
      spin: function (calm) {
        // (the short one turns once and a quarter, so it lands on the same color)
        var to = deg + (calm ? 360 + ADD %% 360 : ADD), ms = calm ? 1200 : MS;
        void turn.offsetWidth;
        turn.style.transition = calm ? 'transform 1.2s ease-out' : MOVE;
        turn.style.webkitTransform = turn.style.transform = 'rotate(' + to + 'deg)';
        deg = to;
        lights(120);
        el.classList.add('tw-spin');
        return new Promise(function (res) {
          clearTimeout(done);
          done = setTimeout(function () { lights(600); el.classList.remove('tw-spin'); el.classList.add('tw-landed'); res(); }, ms + 50);
        });
      },
      stop: function () { clearInterval(blink); clearTimeout(done); }
    };
  }
  return { COLORS: COLORS, ADD: ADD, MS: MS, startFor: startFor, make: make };
})();
''' % {'turn': json.dumps(turn), 'rim': json.dumps(rim), 'hub': json.dumps(hub), 'boo': json.dumps(boo), 'pin': json.dumps(pin),
       'css': json.dumps(css), 'shadows': json.dumps(shadows), 'cols': json.dumps(cols), 'turns': add_turns,
       'ease': trans.split(' ', 2)[2] if trans.startswith('transform 6s ') else 'cubic-bezier(.12,.72,.08,1)'}
sys.stdout.write(out)
