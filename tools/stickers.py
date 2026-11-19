#!/usr/bin/env python3
"""Dominoes 151: makes the small sticker files the game uses from the big pictures they were drawn as.

    python3 tools/stickers.py "<folder with the PNG files>" ar            writes play/stickers/ar/01.webp ... 80.webp
                                                                          (but not the numbers taken out: see GONE)
    python3 tools/stickers.py "<folder with the PNG files>" en            writes play/stickers/en/01.webp ... 59.webp
    python3 tools/stickers.py "<folder with the PNG files>" ar --list     only prints the sizes (for play/dom-core.js)
    python3 tools/stickers.py "<folder with the PNG files>" ar --only 80  makes only that number (a new picture: the
                                                                          others are not opened and not written again;
                                                                          several numbers go as 80,81)

The pictures themselves are never redrawn: nothing is recolored, sharpened or retouched. Each one is only
  1. trimmed: the empty see-through room around the drawing is cut away (the drawings came on canvases of very
     different sizes, some filling theirs and some sitting small in the middle);
  2. brought to the same visual size: every sticker is scaled so that its drawing covers the same amount of
     screen (the same number of drawn dots), so on the TV none looks big next to one that looks small;
  3. saved as WebP, which keeps the see-through edge and is a small fraction of the PNG's size. Two things no eye
     can see are tidied on the way, because they made the files much bigger for nothing: a drawing that was 99%
     solid all over (the mark of the tool that cut it out) is made fully solid, and specks under 2% solid that
     float in the empty room are made empty.
  4. only in a pack named in TIDY (the English one): freed of leftovers before all that. Those drawings were cut
     out of bigger sheets, and many still carry a sliver of the drawing that sat next to them.
       - A piece that is not joined to the drawing is dropped when it lies outside the drawing's box or right on
         the box's rim, or when it is dust. A loose piece inside the box (a spark, a ray) is part of the drawing
         and stays.
       - A piece that hangs on the drawing only by dots softer than the drawing itself (the seam the cutting tool
         left between two neighbours) is dropped when the edge of the cut-out cuts it straight: a neighbour's
         sliver always is, a part of the drawing is not. The soft dots between the two go to the nearer one.
       - A leftover that is joined to the drawing by solid dots cannot be told from it by a rule. The few of those
         are pointed out by hand, as boxes in CUT: inside such a box only the drawing stays, that is its inked
         parts (the ones that reach out of the box) and the white rim around them.

The numbers are the stickers' names in the game (a phone says "sticker 17" to the TV), so a number never moves to
another picture: new pictures get new numbers at the end (MORE_AR and ORDER_EN below), and a sticker that is taken out
leaves its number empty (GONE below, and `gone` in STICKERS in play/dom-core.js).
"""
import os
import re
import sys

from PIL import Image, ImageChops, ImageFilter

RUN = re.compile(b'\x01+')

Image.MAX_IMAGE_PIXELS = None

# One sticker "unit": a drawing that fills a square of this many dots on each side is saved at this size. The TV and
# the phones show a sticker by this unit (see STICKERS in play/dom-core.js), never by its file's own width.
UNIT = 384
# Of that square, the part a typical drawing really covers (the rest is the see-through room between its bumps).
COVER = 0.75
LONGEST = 480          # no side is saved longer than this
EDGE = 0.012           # a little see-through room kept around the drawing, so its soft shadow is not cut
QUALITY = 70

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# Numbers taken out of a pack, each with the name of the drawing it was. Such a number is never made again and never
# given to another picture. The drawing may still be in the folder (it is skipped) or not (its place stays empty).
GONE = {'ar': {6: '06.png'}, 'en': {}}


# Packs whose drawings are freed of loose bits first (see point 4 at the top, and drop_loose below).
TIDY = {'en'}
RIM = 3                # a loose piece this close to the rim of the drawing's box is a leftover, not a spark
DUST = 0.0002          # a loose piece smaller than this part of the drawing is dust
SOFT = 8               # a dot this much less solid than the drawing usually is belongs to a seam, not to the drawing
STRAIGHT = 1 / 3       # a piece is "cut straight" by an edge when this much of its length along the edge lies on it
# Leftovers joined to their drawing by solid dots: boxes (left, top, right, bottom, in the dots of the original
# picture) drawn by hand around each one. See cut_box below for what happens inside a box.
CUT = {'en': {
    10: [(256, 320, 279, 632)],                         # a purple sleeve on its left
    23: [(256, 180, 292, 600), (746, 395, 766, 690)],   # a gold hook and a red sleeve on its left, a grey braid on its right
    25: [(736, 205, 766, 400), (748, 455, 766, 565)],   # curls of smoke and a dark sliver on its right
    40: [(250, 831, 490, 880)],                         # the top of a black hat under it
}}
WHITE = 200            # a dot whose weakest color is at least this is white (the rim of a sticker), not ink
OUTLINE = 0.014        # how wide the white rim around a drawing is, as a part of the picture's longer side
ROOM = 40              # how far around a box the tool looks for the drawing's inked parts
THIN = 2               # lines of ink up to twice this wide do not count as an inked part

# The English pack: Hasan's 59 files, numbered 1 to 59 in this order. The list is written out, so that a number can
# never move: a new picture is added at the end, whatever its name.
ORDER_EN = [
    '01_I_M_THE_DOMINO_KING.png', '01_SIT_DOWN__ROOKIE.png', '01_WHAT_WAS_THAT.png', '02_BRO_ARE_YOU_SERIOUS.png',
    '02_SOMEBODY_CALL_THE_PRESS.png', '02_YOU_JUST_GOT_DESTROYED.png', '03_NICE_TRY_GENIUS.png',
    '03_WHERE_S_MY_TROPHY.png', '04_MY_GRANDMA_PLAYS_BETTER.png', '04_THAT_S_HOW_IT_S_DONE.png', '04_UNBEATABLE.png',
    '05_I_WAS_BORN_FOR_THIS.png', '05_TOO_EASY.png', '05_WHAT_A_DISASTER.png', '06_DID_YOU_EVEN_THINK.png',
    '06_STAY_IN_YOUR_LANE.png', '06_THAT_S_MY_SUPERPOWER.png', '07_I_OWN_THIS_TABLE.png',
    '07_THATS_EMBARRASSING.png', '07_WHAT_A_COMEBACK.png', '08_IM_DONE_WITH_YOU.png', '08_LUCKY__NO__LEGENDARY.png',
    '08_YOU_RE_NOT_READY.png', '09_BRO_NEEDS_A_TUTORIAL.png', '09_GO_PRACTICE.png', '09_I_CAN_T_BELIEVE_I_WON.png',
    '10_DON_T_HATE_THE_PLAYER.png', '10_THAT_S_A_SKILL_ISSUE.png', '10_WHAT_IS_THIS_GAME.png',
    '11_EVEN_THE_DOMINOES_ARE_CONFUSED.png', '11_I_M_TOO_GOOD.png', '11_NICE_HAND_NOT.png', '12_PLEASE_STOP.png',
    '12_THE_KING_HAS_ARRIVED.png', '12_YOU_FELL_FOR_IT.png', '13_CHECKMATE_BUDDY.png', '13_REMATCH__RIGHT_NOW.png',
    '13_THAT_WAS_PAINFUL_TO_WATCH.png', '14_GAME_OVER_CHAMP.png', '14_I_NEED_A_MOMENT.png',
    '14_YOU_CALL_THAT_A_MOVE.png', '15_DONT_BLINK.png', '15_IVE_SEEN_BETTER.png', '15_MY_HEART_CAN_T_TAKE_THIS.png',
    '16_I_SAW_THAT_COMING.png', '16_THIS_IS_PERSONAL.png', '16_WHO_INVITED_THIS_GUY.png',
    '17_I_M_NEVER_PLAYING_AGAIN.png', '17_THE_TABLE_DESERVES_BETTER.png', '17_YOU_WALKED_RIGHT_INTO_IT.png',
    '18_BRO_IS_PLAYING_BLIND.png', '18_WHO_S_NEXT.png', '18_ZERO_CHANCE.png', '19_DONT_CRY_NOW.png',
    '19_EASY_MONEY.png', '19_SOMEBODY_HELP_HIM.png', '20_GOOD_GAME____NOT_REALLY.png', '20_IM_CRYING.png',
    '20_THANKS_FOR_THE_EASY_WIN.png'
]


def order_en(names):
    """The English pack: the files of ORDER_EN, numbered in that order. A number that was taken out comes back as None."""
    have = set(n for n in names if n.lower().endswith('.png'))
    gone = set(GONE['en'].values())
    missing = [n for n in ORDER_EN if n not in have and n not in gone]
    extra = sorted(have - set(ORDER_EN))
    if missing:
        raise SystemExit('The English pack misses %d of its pictures, the first one: %s' % (len(missing), missing[0]))
    if extra:
        raise SystemExit('A picture the English pack does not know (add it at the end of ORDER_EN): ' + extra[0])
    return [None if (i + 1) in GONE['en'] else n for i, n in enumerate(ORDER_EN)]


# The Arabic pack began as 79 files that are numbered by their names (see order_ar). Pictures added after them are
# written out here and get the numbers 80, 81 and so on, in this order, whatever their names.
FIRST_AR = 79
MORE_AR = ['Shocked_Comic_Sticker_with_Arabic_Text.png']


def order_ar(names):
    """The Arabic pack: Hasan's first 79 files in the order of their names (numbers 1 to 79), then the pictures of
    MORE_AR (number 80 and on). A number that was taken out comes back as None (number 6 is gone)."""
    def key(n):
        for i, pat in enumerate([r'^(\d\d)\.png$', r'^01-1 \((\d+)\)\.png$', r'^01-2 \((\d+)\)\.png$', r'^02-1 \((\d+)\)\.png$', r'^sticker_(\d+)\.png$']):
            m = re.match(pat, n)
            if m:
                return (i, int(m.group(1)))
        raise SystemExit('A file this pack does not know: ' + n)
    out = sorted((n for n in names if n.lower().endswith('.png') and n not in MORE_AR), key=key)
    for number, name in sorted(GONE['ar'].items()):
        if number > FIRST_AR:
            continue
        if name in out:
            if out.index(name) != number - 1:
                raise SystemExit('%s should be picture number %d of this folder, and is not: a picture is missing or added before it.' % (name, number))
            out[number - 1] = None
        else:
            out.insert(number - 1, None)
    if len(out) != FIRST_AR:
        raise SystemExit('The first %d numbers of the Arabic pack come from the first pictures of this folder; it gives %d (a new picture goes at the end of MORE_AR).' % (FIRST_AR, len(out)))
    for i, name in enumerate(MORE_AR):
        number = FIRST_AR + 1 + i
        if number in GONE['ar']:
            out.append(None)
        elif name in names:
            out.append(name)
        else:
            raise SystemExit('The Arabic pack misses its picture number %d: %s' % (number, name))
    return out


PACKS = {'ar': order_ar, 'en': order_en}


def pieces(data, w, h, table):
    """The dots that `table` lets through, as pieces (dots that touch, corners count, are one piece). Returns every
    row as its runs (first dot, last dot, a name), the function that turns a name into its piece, and each piece's
    number of dots and box."""
    parent = []

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    # every row as its runs of dots; a run joins the runs it touches in the row above
    rows, prev = [], []
    for y in range(h):
        cur = []
        for m in RUN.finditer(data[y * w:(y + 1) * w].translate(table)):
            x0, x1 = m.start(), m.end() - 1
            lab = -1
            for p in prev:
                if p[0] <= x1 + 1 and p[1] >= x0 - 1:
                    r = find(p[2])
                    if lab < 0:
                        lab = r
                    elif r != lab:
                        parent[r] = lab
            if lab < 0:
                lab = len(parent)
                parent.append(lab)
            cur.append((x0, x1, lab))
        rows.append(cur)
        prev = cur
    area, box = {}, {}
    for y, cur in enumerate(rows):
        for x0, x1, lab in cur:
            r = find(lab)
            area[r] = area.get(r, 0) + x1 - x0 + 1
            b = box.get(r)
            box[r] = (x0, y, x1, y) if b is None else (min(b[0], x0), b[1], max(b[2], x1), y)
    return rows, find, area, box


def spread(own, free, w, h, reach=None):
    """`own` marks the dots of pieces (1: a piece that stays, 2: one that goes), `free` the dots that belong to none
    yet (1). Every free dot gets the mark of the piece nearest to it: ring by ring outwards from the pieces, for
    `reach` rings (or until none is left). A dot as near to a piece that stays as to one that goes, stays."""
    mid = (-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1)
    first = (-w, -w + 1, 1, w, w + 1)       # the dots in the first column have no neighbour to the left
    last = (-w - 1, -w, -1, w - 1, w)       # and those in the last column none to the right
    n = w * h

    def around(i):
        x = i % w
        return first if x == 0 else last if x == w - 1 else mid

    ring = []
    for y in range(h):
        for m in RUN.finditer(bytes(free[y * w:(y + 1) * w])):
            for i in range(y * w + m.start(), y * w + m.end()):
                o = 0
                for d in around(i):
                    j = i + d
                    if 0 <= j < n and own[j]:
                        if own[j] == 1:
                            o = 1
                            break
                        o = 2
                if o:
                    ring.append((i, o))
    while ring and (reach is None or reach > 0):
        for i, o in ring:
            own[i] = o
            free[i] = 0
        nxt = {}
        for i, o in ring:
            for d in around(i):
                j = i + d
                if 0 <= j < n and free[j] and nxt.get(j) != 1:
                    nxt[j] = o
        ring = list(nxt.items())
        if reach is not None:
            reach -= 1


def take(alpha, w, h, rows, find, drop, level):
    """Empties the pieces named in `drop`. Of the softer dots around the pieces (drawn, but under `level`), those
    that lie nearer to a piece that goes than to one that stays go with it. Returns the new picture of the alpha."""
    own = bytearray(w * h)
    for y, cur in enumerate(rows):
        for x0, x1, lab in cur:
            own[y * w + x0:y * w + x1 + 1] = (b'\x02' if find(lab) in drop else b'\x01') * (x1 - x0 + 1)
    if level > 9:
        spread(own, bytearray(alpha.tobytes().translate(bytes(1 if 8 < v < level else 0 for v in range(256)))), w, h)
    keep = Image.frombytes('L', (w, h), bytes(own).translate(bytes(0 if v == 2 else 255 for v in range(256))))
    return ImageChops.darker(alpha, keep)


def cut_box(im, alpha, box):
    """A leftover that is joined to the drawing by solid dots, in a box drawn around it by hand. Inside the box only
    the drawing stays: its inked parts, which are the ones that reach out of the box, and the white rim around them
    (as wide as OUTLINE; where a leftover's ink is nearer, the rim ends halfway). An inked piece that lies wholly
    inside the box is the leftover. Nothing outside the box is touched. Returns the new picture of the alpha."""
    w, h = im.size
    win = (max(0, box[0] - ROOM), max(0, box[1] - ROOM), min(w, box[2] + 1 + ROOM), min(h, box[3] + 1 + ROOM))
    sub, sa = im.crop(win), alpha.crop(win)
    sw, sh = sub.size
    r, g, b = sub.split()[:3]
    weakest = ImageChops.darker(ImageChops.darker(r, g), b)
    ink = ImageChops.darker(sa.point(lambda v: 255 if v >= 128 else 0), weakest.point(lambda v: 255 if v < WHITE else 0))
    # (thinned by THIN dots: the faint grey line that the rim of every sticker ends in is not ink to steer by)
    ink = ink.filter(ImageFilter.MinFilter(2 * THIN + 1))
    rows, find, area, pbox = pieces(ink.tobytes(), sw, sh, bytes(1 if v else 0 for v in range(256)))
    bx = (box[0] - win[0], box[1] - win[1], box[2] - win[0], box[3] - win[1])
    own = bytearray(sw * sh)
    for y, cur in enumerate(rows):
        for x0, x1, lab in cur:
            p = find(lab)
            q = pbox[p]
            if area[p] < 12:
                continue
            if q[0] >= bx[0] and q[1] >= bx[1] and q[2] <= bx[2] and q[3] <= bx[3]:
                if area[p] < 300:
                    continue        # (a small bit inside the box: neither the drawing nor a leftover to steer by)
                mark = b'\x02'
            else:
                mark = b'\x01'
            own[y * sw + x0:y * sw + x1 + 1] = mark * (x1 - x0 + 1)
    drawn = sa.tobytes().translate(bytes(1 if v > 8 else 0 for v in range(256)))
    free = bytearray(1 if d and not o else 0 for d, o in zip(drawn, own))
    spread(own, free, sw, sh, reach=max(4, round(OUTLINE * max(w, h))) + THIN)
    keep = bytearray(b'\xff' * (sw * sh))
    for y in range(max(0, bx[1]), min(sh, bx[3] + 1)):
        for x in range(max(0, bx[0]), min(sw, bx[2] + 1)):
            if own[y * sw + x] != 1:
                keep[y * sw + x] = 0
    alpha = alpha.copy()
    alpha.paste(ImageChops.darker(sa, Image.frombytes('L', (sw, sh), bytes(keep))), win[:2])
    return alpha


def drop_loose(im, cuts=()):
    """The drawing without its leftovers (point 4 at the top). Returns the picture and how many pieces were dropped."""
    w, h = im.size
    alpha = im.getchannel('A')
    for c in cuts:
        alpha = cut_box(im, alpha, c)
    dropped = len(cuts)
    drawn = bytes(1 if v > 8 else 0 for v in range(256))

    # 1. the pieces that are not joined to the drawing
    rows, find, area, box = pieces(alpha.tobytes(), w, h, drawn)
    if not area:
        return im, 0
    # (the cut-out: the box of everything that was drawn here, the leftovers too. Its edges are where the sheet was cut.)
    cut = (min(b[0] for b in box.values()), min(b[1] for b in box.values()), max(b[2] for b in box.values()), max(b[3] for b in box.values()))
    main = max(area, key=area.get)
    mb = box[main]
    drop = set()
    for r, b in box.items():
        if r == main:
            continue
        cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        outside = cx < mb[0] or cx > mb[2] or cy < mb[1] or cy > mb[3]
        on_rim = b[0] <= mb[0] + RIM or b[2] >= mb[2] - RIM or b[1] <= mb[1] + RIM or b[3] >= mb[3] - RIM
        if outside or on_rim or area[r] < DUST * area[main]:
            drop.add(r)
    if drop:
        alpha = take(alpha, w, h, rows, find, drop, 0)
        dropped += len(drop)

    # 2. the pieces that hang on the drawing only by softer dots: first by dots under half solid, then by dots that
    #    are less solid than the drawing usually is
    hist = alpha.histogram()
    half = sum(hist[128:]) / 2
    usual = 255
    while usual > 128 and sum(hist[usual:]) < half:
        usual -= 1
    for level in (128, usual - SOFT):
        if level < 128:
            continue
        rows, find, area, box = pieces(alpha.tobytes(), w, h, bytes(1 if v >= level else 0 for v in range(256)))
        if len(area) < 2:
            continue
        body = max(area, key=area.get)
        # how much of each piece lies on an edge of the cut-out: its columns on the top and the bottom edge, its rows
        # on the left and the right one
        on = {}
        for y, cur in enumerate(rows):
            for x0, x1, lab in cur:
                r = find(lab)
                if r == body:
                    continue
                if y <= cut[1] + RIM:
                    on.setdefault((r, 0), set()).update(range(x0, x1 + 1))
                if y >= cut[3] - RIM:
                    on.setdefault((r, 1), set()).update(range(x0, x1 + 1))
                if x0 <= cut[0] + RIM:
                    on.setdefault((r, 2), set()).add(y)
                if x1 >= cut[2] - RIM:
                    on.setdefault((r, 3), set()).add(y)
        drop = set()
        for (r, edge), dots in on.items():
            b = box[r]
            length = b[2] - b[0] + 1 if edge < 2 else b[3] - b[1] + 1
            if area[r] >= 12 and len(dots) >= max(6, STRAIGHT * length):
                drop.add(r)
        if drop:
            alpha = take(alpha, w, h, rows, find, drop, level)
            dropped += len(drop)
    if not dropped:
        return im, 0
    im = im.copy()
    im.putalpha(alpha)
    return im, dropped


def make(src, number, out_dir, write=True, tidy=False, cuts=()):
    im = Image.open(src)
    im.load()
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
    if tidy:
        im, _ = drop_loose(im, cuts)
    a = im.getchannel('A')
    # the drawing: every dot that is more than a trace (a trace: under 3% solid, which no eye sees)
    box = a.point(lambda v: 255 if v > 8 else 0).getbbox()
    if not box:
        raise SystemExit('An empty picture: ' + src)
    bw, bh = box[2] - box[0], box[3] - box[1]
    # how much of it is really drawn (dots at least half solid)
    ink = a.crop(box).point(lambda v: 255 if v >= 128 else 0).histogram()[255]
    scale = (COVER * UNIT * UNIT / ink) ** 0.5
    pad = round(max(bw, bh) * EDGE)
    crop = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
    cw, ch = crop[2] - crop[0], crop[3] - crop[1]
    scale = min(scale, LONGEST / max(cw, ch), 1.0)
    w, h = max(1, round(cw * scale)), max(1, round(ch * scale))
    if write:
        # (the colors are scaled together with how solid they are, so no dark or light rim grows on the edge)
        small = im.crop(crop).convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
        # (nearly solid becomes solid, a speck becomes empty: see the top of this file)
        small.putalpha(small.getchannel('A').point(lambda v: 255 if v >= 250 else (0 if v < 4 else v)))
        os.makedirs(out_dir, exist_ok=True)
        small.save(os.path.join(out_dir, '%02d.webp' % number), 'WEBP', quality=QUALITY, method=6, alpha_quality=100, exact=False, use_sharp_yuv=True)
    return w, h, round(scale, 4), round(ink / (bw * bh), 3)


def main():
    if len(sys.argv) < 3 or sys.argv[2] not in PACKS:
        raise SystemExit(__doc__)
    folder, pack, rest = sys.argv[1], sys.argv[2], sys.argv[3:]
    only_list, only = '--list' in rest, None
    if '--only' in rest:
        try:
            only = set(int(x) for x in rest[rest.index('--only') + 1].split(','))
        except (IndexError, ValueError):
            raise SystemExit('--only wants the numbers to make, like --only 80 or --only 80,81')
    names = PACKS[pack](os.listdir(folder))
    if only is not None:
        bad = sorted(i for i in only if not (1 <= i <= len(names)) or names[i - 1] is None)
        if bad:
            raise SystemExit('The %s pack has no picture number %d.' % (pack, bad[0]))
    out_dir = os.path.join(ROOT, 'play', 'stickers', pack)
    sizes, total, made = [], 0, 0
    for i, n in enumerate(names, 1):
        if only is not None and i not in only:
            continue
        if n is None:
            # (taken out: no file is made, and its place in the list of sizes stays, as 0,0)
            sizes.append((i, 0, 0))
            if not only_list:
                print('%02d  taken out' % i)
            continue
        w, h, scale, cover = make(os.path.join(folder, n), i, out_dir, write=not only_list, tidy=pack in TIDY, cuts=CUT.get(pack, {}).get(i, ()))
        sizes.append((i, w, h))
        if not only_list:
            b = os.path.getsize(os.path.join(out_dir, '%02d.webp' % i))
            total += b
            made += 1
            print('%02d  %-16s -> %3d x %3d  %6.1f KB   (from %.1f MB, scale %.3f, covers %.2f)' % (i, n, w, h, b / 1024, os.path.getsize(os.path.join(folder, n)) / 1048576, scale, cover))
    if not only_list:
        print('%d stickers, %.2f MB in all' % (made, total / 1048576))
    # (for STICKERS in play/dom-core.js: the width and the height of each one, in the order of the numbers)
    if only is None:
        print('sizes: ' + ' '.join('%d,%d' % (w, h) for _, w, h in sizes))
    else:
        print('sizes: ' + ' '.join('number %d is %d,%d' % s for s in sizes))


if __name__ == '__main__':
    main()
