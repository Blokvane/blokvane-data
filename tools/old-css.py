# Adds fallbacks for older browsers (smart TVs, older phones) to the party games' stylesheets, without changing what
# newer browsers do. Run it after changing a stylesheet:   python3 tools/old-css.py play/play.css play/imp.css play/gir.css play/world.css go/go.css
#  - inset, inset-inline/block, margin-inline/block and padding-inline/block with one value, place-items/content/self:
#    the old physical properties written just before (the newer one, after them, still wins where it's known)
#  - min(), max(), clamp() in a normal property: a plain value just before (the last argument: the scaled one)
#  - 100dvh/svh/lvh: the same in vh just before
#  - color-mix(): the color it is mostly made of, just before
#  - gap, row-gap, column-gap: grid-gap and the like just before (what grids had before gap, Chrome 57 to 65)
#  - logical properties with two different sides (margin-inline-start...), and gap in a flex box: rules just after,
#    for browsers that don't know them (@supports not, and html.no-flexgap that ../go/compat.js sets)
# Idempotent: a declaration that already has its fallbacks right before it is left alone.
# With --inline: the style="..." of the screens in a template file (play/imp-tpl.js, play/imp-ph.js: the designs' own
# styles, written on each part) get the same fallbacks, and a flex box with a gap gets a class (bvfg-r, bvfg-c or bvfg-w)
# and its gaps (--fgr, --fgc): ../go/compat.js spaces its items with margins where flex gap is unknown. The file's
# stylesheet ("css"), if it has one, gets the stylesheet's fallbacks. Run it after the templates are made again:
#   python3 tools/old-css.py --inline play/imp-tpl.js play/imp-ph.js
import re, sys, json

def split_top(v, sep=None):
    out, depth, cur = [], 0, ''
    for ch in v:
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if depth == 0 and ((sep is None and ch.isspace()) or (sep is not None and ch == sep)):
            if cur.strip(): out.append(cur.strip())
            cur = ''
        else: cur += ch
    if cur.strip(): out.append(cur.strip())
    return out

def plain(v):
    # min(a, b) / max(a, b) / clamp(a, b, c): the last argument (or clamp's middle), until none is left
    for _ in range(12):
        m = re.search(r'\b(min|max|clamp)\(', v)
        if not m: return v
        i = m.end(); depth = 1; j = i
        while j < len(v) and depth:
            if v[j] == '(': depth += 1
            elif v[j] == ')': depth -= 1
            j += 1
        args = split_top(v[i:j - 1], ',')
        pick = args[1] if m.group(1) == 'clamp' and len(args) == 3 else args[-1]
        if not pick.startswith('calc(') and re.search(r'[*/+-]\s', pick): pick = 'calc(' + pick + ')'
        v = v[:m.start()] + pick + v[j:]
    return v

def unmix(v):
    # color-mix(in srgb, A 30%, B): the color with the bigger share (B here), innermost first
    for _ in range(12):
        m = None
        for mm in re.finditer(r'\bcolor-mix\(', v): m = mm
        if not m: return v
        i = m.end(); depth = 1; j = i
        while j < len(v) and depth:
            if v[j] == '(': depth += 1
            elif v[j] == ')': depth -= 1
            j += 1
        args = split_top(v[i:j - 1], ',')
        if len(args) != 3: return v
        pct = lambda a: re.search(r'(?<![\w.(-])(\d*\.?\d+)%\s*$', a)
        pa, pb = pct(args[1]), pct(args[2])
        share = float(pa.group(1)) if pa else (100 - float(pb.group(1)) if pb else 50)
        pick = args[1] if share >= 50 else args[2]
        pm = pct(pick)
        if pm: pick = pick[:pm.start()].strip()
        v = v[:m.start()] + pick + v[j:]
    return v

FOUR = {'inset': ('top', 'right', 'bottom', 'left')}
SYM = {'inset-inline': ('left', 'right'), 'inset-block': ('top', 'bottom'), 'margin-inline': ('margin-left', 'margin-right'),
       'margin-block': ('margin-top', 'margin-bottom'), 'padding-inline': ('padding-left', 'padding-right'), 'padding-block': ('padding-top', 'padding-bottom')}
PLACE = {'place-items': ('align-items', 'justify-items'), 'place-content': ('align-content', 'justify-content'), 'place-self': ('align-self', 'justify-self')}
# one side, by direction: [ltr property, rtl property]
SIDE = {'inset-inline-start': ('left', 'right'), 'inset-inline-end': ('right', 'left'), 'margin-inline-start': ('margin-left', 'margin-right'),
        'margin-inline-end': ('margin-right', 'margin-left'), 'padding-inline-start': ('padding-left', 'padding-right'), 'padding-inline-end': ('padding-right', 'padding-left'),
        'border-inline-start': ('border-left', 'border-right'), 'border-inline-end': ('border-right', 'border-left')}

def fix_decls(body, sel, after, stats):
    decls = []
    # split declarations on ; outside parentheses and quotes
    cur, depth, q = '', 0, ''
    for ch in body:
        if q:
            cur += ch
            if ch == q: q = ''
            continue
        if ch in '"\'': q = ch
        if ch == '(': depth += 1
        elif ch == ')': depth -= 1
        if ch == ';' and depth == 0: decls.append(cur); cur = ''
        else: cur += ch
    decls.append(cur)
    out = []
    names = []
    for d in decls:
        m = re.match(r'(\s*)([-a-zA-Z]+)\s*:\s*(.*?)\s*$', d, re.S)
        if not m: out.append(d); continue
        lead, prop, val = m.group(1), m.group(2).lower(), m.group(3)
        imp = ''
        if val.endswith('!important'): val, imp = val[:-10].rstrip(), ' !important'
        names.append((prop, val))
        prev = out[-1].strip() if out else ''
        add = []
        if prop.startswith('--'):
            out.append(d); continue
        if prop in FOUR:
            p = split_top(val)
            if len(p) == 1: p = p * 4
            elif len(p) == 2: p = [p[0], p[1], p[0], p[1]]
            elif len(p) == 3: p = [p[0], p[1], p[2], p[1]]
            add = [f'{n}: {plain(x)}{imp}' for n, x in zip(FOUR[prop], p)]
        elif prop in SYM:
            p = split_top(val)
            if len(p) == 1 or (len(p) == 2 and p[0] == p[1]): add = [f'{n}: {plain(p[0])}{imp}' for n in SYM[prop]]
            elif len(p) == 2:
                lp, rp = SYM[prop]
                if prop.endswith('block'): add = [f'{lp}: {plain(p[0])}{imp}', f'{rp}: {plain(p[1])}{imp}']
                else: after.append(('@supports not (' + prop + ': 0)', f'{sel} {{ {lp}: {unmix(plain(p[0]))}{imp}; {rp}: {unmix(plain(p[1]))}{imp}; }}\n  html[dir="rtl"] {rtl_sel(sel)} {{ {lp}: {unmix(plain(p[1]))}{imp}; {rp}: {unmix(plain(p[0]))}{imp}; }}'))
        elif prop in PLACE:
            p = split_top(val)
            a, b = (p[0], p[1]) if len(p) == 2 else (p[0], p[0])
            add = [f'{PLACE[prop][0]}: {a}{imp}', f'{PLACE[prop][1]}: {b}{imp}']
        elif prop in SIDE:
            lt, rt = SIDE[prop]
            after.append(('@supports not (' + prop + ': 0)', f'{sel} {{ {lt}: {unmix(plain(val))}{imp}; }}\n  html[dir="rtl"] {rtl_sel(sel)} {{ {rt}: {unmix(plain(val))}{imp}; }}'))
        if re.search(r'\b(min|max|clamp)\(', val) and prop not in FOUR and prop not in SYM and prop not in PLACE:
            add.append(f'{prop}: {plain(val)}{imp}')
        if re.search(r'\b\d*\.?\d+[dsl]vh\b', val):
            add.append(f'{prop}: {re.sub(r"(\d*\.?\d+)[dsl]vh", r"\1vh", plain(val))}{imp}')
        if 'color-mix(' in val and prop not in FOUR and prop not in SYM and prop not in PLACE:
            add.append(f'{prop}: {unmix(re.sub(r"(\d*\.?\d+)[dsl]vh", r"\1vh", plain(val)))}{imp}')
        if prop in ('gap', 'row-gap', 'column-gap'):
            add.append(f'grid-{prop}: {re.sub(r"(\d*\.?\d+)[dsl]vh", r"\1vh", plain(val))}{imp}')
        # (already there from an earlier run: the declarations just before it)
        if add:
            near = [x.strip().replace(' ', '') for x in out[-(len(add) + 3):]]
            add = [a for a in add if a.replace(' ', '') not in near]
        for a in add:
            out.append(lead + a); stats['in'] += 1
            lead = ' ' if lead.strip() == '' and '\n' not in lead else lead
        out.append(d)
    # gap in a flex box: margins between the children where flex gap is unknown
    disp = [v for p, v in names if p == 'display']
    gapv = [v for p, v in names if p in ('gap', 'column-gap', 'row-gap')]
    if disp and disp[-1].strip() in ('flex', 'inline-flex') and gapv:
        g = {p: v for p, v in names if p in ('gap', 'column-gap', 'row-gap')}
        parts = split_top(g.get('gap', '')) if 'gap' in g else []
        rg = g.get('row-gap', parts[0] if parts else '0')
        cg = g.get('column-gap', parts[1] if len(parts) > 1 else (parts[0] if parts else '0'))
        fd = ([v for p, v in names if p in ('flex-direction', 'flex-flow')] or ['row'])[-1]
        wrap = any(p in ('flex-wrap', 'flex-flow') and 'wrap' in v and 'nowrap' not in v for p, v in names)
        col = 'column' in fd
        rules = []
        if col and rg not in ('0', '0px'): rules.append(f'html.no-flexgap {child_sel(sel, "+")} {{ margin-top: {plain(rg)}; }}')
        elif not col and cg not in ('0', '0px') and not wrap:
            rules.append(f'html.no-flexgap {child_sel(sel, "+")} {{ margin-left: {plain(cg)}; }}')
            rules.append(f'html.no-flexgap[dir="rtl"] {child_sel(sel, "+")} {{ margin-left: 0; margin-right: {plain(cg)}; }}')
        elif not col and wrap:
            rules.append(f'html.no-flexgap {child_sel(sel, "")} {{ margin: 0 {plain(cg)} {plain(rg)} 0; }}')
        if rules: after.append(('', '\n'.join(rules)))
    return ';'.join(out)

def rtl_sel(sel):
    return ', html[dir="rtl"] '.join(s.strip() for s in split_top(sel, ','))

def child_sel(sel, plus):
    return ', '.join(('html.no-flexgap ' if i else '') + s.strip() + (' > * + *' if plus else ' > *') for i, s in enumerate(split_top(sel, ',')))

def process(css):
    stats = {'in': 0, 'after': 0}
    out, i, n = [], 0, len(css)
    stack = []  # 'rule' or 'at:<name>'
    buf_start = 0
    pending_after = {}
    def walk(s, i, depth_kind):
        res = []
        start = i
        while i < len(s):
            if s.startswith('/*', i):
                j = s.index('*/', i) + 2; res.append(s[i:j]); i = j; continue
            c = s[i]
            if c == '}':
                return ''.join(res), i
            # read a prelude up to { or ;
            j = i; q = ''
            while j < len(s):
                if s.startswith('/*', j): j = s.index('*/', j) + 2; continue
                ch = s[j]
                if q:
                    if ch == q: q = ''
                elif ch in '"\'': q = ch
                elif ch in '{;}': break
                j += 1
            if j >= len(s): res.append(s[i:]); return ''.join(res), len(s)
            if s[j] == ';':
                res.append(s[i:j + 1]); i = j + 1; continue
            if s[j] == '}':
                res.append(s[i:j]); i = j; continue
            prelude = s[i:j]
            pt = prelude.strip()
            if pt.startswith('@media') or pt.startswith('@supports') or pt.startswith('@layer') or pt.startswith('@container'):
                inner, k = walk(s, j + 1, 'at')
                res.append(prelude + '{' + inner + '}'); i = k + 1; continue
            if pt.startswith('@'):
                # @keyframes, @font-face...: as they are
                depth = 0; k = j
                while k < len(s):
                    if s[k] == '{': depth += 1
                    elif s[k] == '}':
                        depth -= 1
                        if depth == 0: break
                    k += 1
                res.append(s[i:k + 1]); i = k + 1; continue
            # a normal rule
            k = j + 1; depth = 1; q = ''
            while k < len(s) and depth:
                if s.startswith('/*', k): k = s.index('*/', k) + 2; continue
                ch = s[k]
                if q:
                    if ch == q: q = ''
                elif ch in '"\'': q = ch
                elif ch == '{': depth += 1
                elif ch == '}': depth -= 1
                k += 1
            body = s[j + 1:k - 1]
            after = []
            sel = ' '.join(re.sub(r'/\*.*?\*/', ' ', pt, flags=re.S).split())
            nb = fix_decls(body, sel, after, stats)
            res.append(prelude + '{' + nb + '}')
            for cond, rules in after:
                txt = ('\n' + cond + ' {\n  ' + rules + '\n}') if cond else ('\n' + rules)
                # (already there from an earlier run)
                if txt.strip() in s[k:k + 4000]: continue
                res.append(txt); stats['after'] += 1
            i = k
        return ''.join(res), i
    text, _ = walk(css, 0, 'top')
    return text, stats

# ---------- the style="..." on the parts of a designed screen ----------
def decls_of(st):
    out = []
    for d in split_top(st, ';'):
        m = re.match(r'\s*([-a-zA-Z]+)\s*:\s*(.*?)\s*$', d, re.S)
        if m: out.append((m.group(1).lower(), m.group(2)))
    return out

def fix_style(st, stats):
    nb = fix_decls(st, '.x', [], stats)
    names = decls_of(st)
    disp = [v for p, v in names if p == 'display']
    g = {p: v for p, v in names if p in ('gap', 'row-gap', 'column-gap')}
    if not (disp and disp[-1].strip() in ('flex', 'inline-flex') and g) or '--fgr' in st:
        return nb, ''
    parts = split_top(plain(g['gap'])) if 'gap' in g else []
    rg = plain(g.get('row-gap', parts[0] if parts else '0'))
    cg = plain(g.get('column-gap', parts[1] if len(parts) > 1 else (parts[0] if parts else '0')))
    fd = ([v for p, v in names if p in ('flex-direction', 'flex-flow')] or ['row'])[-1]
    wrap = any(p in ('flex-wrap', 'flex-flow') and 'wrap' in v and 'nowrap' not in v for p, v in names)
    cls = 'bvfg-c' if 'column' in fd else 'bvfg-w' if wrap else 'bvfg-r'
    stats['flex'] = stats.get('flex', 0) + 1
    return nb.rstrip().rstrip(';') + ';--fgr:' + rg + ';--fgc:' + cg, cls

TAG = re.compile(r'<([a-zA-Z][\w:-]*)((?:\s+[^\s=<>"]+(?:="[^"]*")?)*)\s*(/?)>')
def fix_html(h, stats):
    def one(m):
        tag, attrs, sl = m.group(1), m.group(2) or '', m.group(3)
        sm = re.search(r'\sstyle="([^"]*)"', attrs)
        if not sm: return m.group(0)
        st, cls = fix_style(sm.group(1), stats)
        a2 = attrs[:sm.start(1)] + st + attrs[sm.end(1):]
        if cls:
            cm = re.search(r'\sclass="([^"]*)"', a2)
            if cm:
                if cls not in cm.group(1).split(): a2 = a2[:cm.end(1)] + ' ' + cls + a2[cm.end(1):]
            else: a2 = ' class="' + cls + '"' + a2
        return '<' + tag + a2 + (' /' if sl else '') + '>'
    return TAG.sub(one, h)

def fix_templates(p):
    src = open(p, encoding='utf-8').read()
    m = re.search(r'\bvar (\w+) = ', src)
    a = m.end()
    obj, end = json.JSONDecoder().raw_decode(src[a:])
    stats = {'in': 0, 'after': 0}
    def walk(x, key=''):
        if isinstance(x, dict): return {k: walk(v, k) for k, v in x.items()}
        if isinstance(x, list): return [walk(v, key) for v in x]
        if isinstance(x, str):
            if key == 'css':
                t, st = process(x)
                stats['in'] += st['in']; stats['after'] += st['after']
                return t
            return fix_html(x, stats) if '<' in x else x
        return x
    obj = walk(obj)
    new = src[:a] + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + src[a + end:]
    open(p, 'w', encoding='utf-8').write(new)
    print(p, 'fallbacks in place:', stats['in'], 'rules after:', stats['after'], 'flex boxes with a gap:', stats.get('flex', 0))

if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--inline':
        for p in args[1:]: fix_templates(p)
    else:
        for p in args:
            src = open(p, encoding='utf-8').read()
            new, st = process(src)
            open(p, 'w', encoding='utf-8').write(new)
            print(p, 'fallbacks in place:', st['in'], 'rules after:', st['after'])
