import re, sys, collections
log = open('/tmp/tsc.log').read()
# join multi-line messages: error lines start with path(
entries = []
cur = None
for line in log.split('\n'):
    m = re.match(r'(src/[^(]+)\((\d+),(\d+)\): error (TS\d+): (.*)', line)
    if m:
        cur = list(m.groups()); entries.append(cur)
    elif cur is not None and line.startswith(' '):
        cur[4] += '\n' + line
by_file = collections.defaultdict(list)
for f, ln, col, code, msg in entries:
    by_file[f].append((int(ln), int(col), code, msg))

def arg_end(s, i):
    depth = 0; q = None
    while i < len(s):
        c = s[i]
        if q:
            if c == '\\': i += 2; continue
            if c == q: q = None
        elif c in '\'"`': q = c
        elif c in '([{': depth += 1
        elif c in ')]}':
            if depth == 0: return i
            depth -= 1
        elif c == ',' and depth == 0: return i
        elif c == ';' and depth == 0: return i
        elif c == '\n' and depth == 0 and s[i-1] not in '(,': return i
        i += 1
    return i

def simple_expr_end(s, i):
    m = re.match(r'[\w$.?!\[\]\'"]+', s[i:])
    e = i + len(m.group(0)) if m else i
    # strip trailing ?. or .
    while e > i and s[e-1] in '.?': e -= 1
    return e

stats = collections.Counter()
for f, errs in by_file.items():
    src = open(f).read()
    lines = src.split('\n')
    offs = [0]
    for l in lines: offs.append(offs[-1] + len(l) + 1)
    edits = []  # (start, end, replacement)
    seen = set()
    for ln, col, code, msg in errs:
        pos = offs[ln-1] + col - 1
        if (pos, code) in seen: continue
        seen.add((pos, code))
        if code == 'TS4114':
            edits.append((pos, pos, 'override ')); stats['override'] += 1; continue
        if code == 'TS2345':
            m = re.search(r"parameter of type 'SetStateAction<(.+?)>'", msg)
            if m and '\n' not in m.group(1):
                e = arg_end(src, pos)
                expr = src[pos:e].rstrip()
                edits.append((pos, pos + len(expr), f'({expr}) as {m.group(1)}')); stats['setstate'] += 1; continue
            if re.match(r"Argument of type '(string|number) \| (undefined|null)' is not assignable to parameter of type '(string|number)'", msg):
                e = arg_end(src, pos); expr = src[pos:e].rstrip()
                fb = "''" if msg.split("'")[1].startswith('string') else '0'
                edits.append((pos, pos + len(expr), f'{expr} ?? {fb}')); stats['nullish-arg'] += 1; continue
            m = re.match(r"Argument of type '\((string|number) \| null\)\[\]' is not assignable to parameter of type 'readonly (string|number)\[\]'", msg)
            if m:
                e = arg_end(src, pos); expr = src[pos:e].rstrip()
                t = m.group(1)
                edits.append((pos, pos + len(expr), f'{expr}.filter((v): v is {t} => v !== null)')); stats['filter'] += 1; continue
        if code == 'TS2769' and src[pos:pos+9] == 'new Date(':
            s = pos + 9; e = arg_end(src, s); expr = src[s:e]
            edits.append((s, e, f'{expr} ?? 0')); stats['date'] += 1; continue
        if code == 'TS2769':
            # error reported at the argument inside new Date(...)
            before = src[max(0, pos-9):pos]
            if before.endswith('new Date('):
                e = arg_end(src, pos); expr = src[pos:e]
                edits.append((pos, e, f'{expr} ?? 0')); stats['date'] += 1; continue
        if code == 'TS2322' and re.match(r"Type 'boolean \| null' is not assignable to type 'boolean'", msg):
            line = lines[ln-1]
            m2 = re.match(r'(\s*\w+:\s*)(.+?)(,?)\s*$', line)
            if m2 and ':' in line:
                s = offs[ln-1] + len(m2.group(1)); expr = m2.group(2)
                edits.append((s, s + len(expr), f'{expr} ?? false')); stats['bool'] += 1; continue
        if code == 'TS18047' and re.match(r"'[\w.]+' is possibly 'null'", msg):
            name = msg.split("'")[1]
            if src[pos:pos+len(name)] == name:
                nxt = src[pos+len(name):pos+len(name)+1]
                if nxt != '.':
                    edits.append((pos, pos+len(name), f'({name} ?? 0)')); stats['num-null'] += 1; continue
        stats['skipped'] += 1
    # apply bottom-up, drop overlaps
    edits.sort(key=lambda x: (x[0], x[1]), reverse=True)
    last = None
    for s, e, r in edits:
        if last is not None and e > last: stats['overlap'] += 1; continue
        src = src[:s] + r + src[e:]
        last = s
    open(f, 'w').write(src)
print(dict(stats))
