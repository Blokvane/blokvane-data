#!/usr/bin/env python3
"""Dominoes 151: makes the small sticker files the game uses from the big pictures they were drawn as.

    python3 tools/stickers.py "<folder with the PNG files>" ar          writes play/stickers/ar/01.webp ... 79.webp
                                                                        (but not the numbers taken out: see GONE)
    python3 tools/stickers.py "<folder with the PNG files>" ar --list   only prints the sizes (for play/dom-core.js)

The pictures themselves are never redrawn: nothing is recolored, sharpened or retouched. Each one is only
  1. trimmed: the empty see-through room around the drawing is cut away (the drawings came on canvases of very
     different sizes, some filling theirs and some sitting small in the middle);
  2. brought to the same visual size: every sticker is scaled so that its drawing covers the same amount of
     screen (the same number of drawn dots), so on the TV none looks big next to one that looks small;
  3. saved as WebP, which keeps the see-through edge and is a small fraction of the PNG's size. Two things no eye
     can see are tidied on the way, because they made the files much bigger for nothing: a drawing that was 99%
     solid all over (the mark of the tool that cut it out) is made fully solid, and specks under 2% solid that
     float in the empty room are made empty.

The numbers are the stickers' names in the game (a phone says "sticker 17" to the TV), so a number never moves to
another picture: new pictures get new numbers at the end of ORDER, and a sticker that is taken out leaves its number
empty (GONE below, and `gone` in STICKERS in play/dom-core.js).
"""
import os
import re
import sys

from PIL import Image

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
GONE = {'ar': {6: '06.png'}}


def order_ar(names):
    """The Arabic pack: Hasan's files, in the order of their names, numbered 1 to 79. A number that was taken out
    comes back as None (78 pictures today: number 6 is gone)."""
    def key(n):
        for i, pat in enumerate([r'^(\d\d)\.png$', r'^01-1 \((\d+)\)\.png$', r'^01-2 \((\d+)\)\.png$', r'^02-1 \((\d+)\)\.png$', r'^sticker_(\d+)\.png$']):
            m = re.match(pat, n)
            if m:
                return (i, int(m.group(1)))
        raise SystemExit('A file this pack does not know: ' + n)
    out = sorted((n for n in names if n.lower().endswith('.png')), key=key)
    for number, name in sorted(GONE['ar'].items()):
        if name in out:
            if out.index(name) != number - 1:
                raise SystemExit('%s should be picture number %d of this folder, and is not: a picture is missing or added before it.' % (name, number))
            out[number - 1] = None
        else:
            out.insert(number - 1, None)
    if len(out) != 79:
        raise SystemExit('The Arabic pack is 79 numbers (%d pictures, %d taken out); this folder gives %d.' % (79 - len(GONE['ar']), len(GONE['ar']), len(out)))
    return out


PACKS = {'ar': order_ar}


def make(src, number, out_dir, write=True):
    im = Image.open(src)
    im.load()
    if im.mode != 'RGBA':
        im = im.convert('RGBA')
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
    folder, pack, only_list = sys.argv[1], sys.argv[2], '--list' in sys.argv[3:]
    names = PACKS[pack](os.listdir(folder))
    out_dir = os.path.join(ROOT, 'play', 'stickers', pack)
    sizes, total = [], 0
    for i, n in enumerate(names, 1):
        if n is None:
            # (taken out: no file is made, and its place in the list of sizes stays, as 0,0)
            sizes.append((0, 0))
            if not only_list:
                print('%02d  taken out' % i)
            continue
        w, h, scale, cover = make(os.path.join(folder, n), i, out_dir, write=not only_list)
        sizes.append((w, h))
        if not only_list:
            b = os.path.getsize(os.path.join(out_dir, '%02d.webp' % i))
            total += b
            print('%02d  %-16s -> %3d x %3d  %6.1f KB   (from %.1f MB, scale %.3f, covers %.2f)' % (i, n, w, h, b / 1024, os.path.getsize(os.path.join(folder, n)) / 1048576, scale, cover))
    if not only_list:
        print('%d stickers, %.2f MB in all' % (sum(1 for n in names if n), total / 1048576))
    # (for STICKERS in play/dom-core.js: the width and the height of each one, in the order of the numbers)
    print('sizes: ' + ' '.join('%d,%d' % s for s in sizes))


if __name__ == '__main__':
    main()
