import re, collections
log = open('/tmp/tsc.log').read()
entries=[]
for line in log.split('\n'):
    m = re.match(r'(src/[^(]+)\((\d+),(\d+)\): error (TS\d+): (.*)', line)
    if m: entries.append(m.groups())
by=collections.defaultdict(list)
for f,ln,c,code,msg in entries: by[f].append((int(ln),int(c),code,msg))
st=collections.Counter()
for f,errs in by.items():
    lines=open(f).read().split('\n')
    for ln,c,code,msg in sorted(errs,reverse=True):
        L=lines[ln-1]
        if code=='TS2322' and re.match(r"Type '(\w+ \| )?null' is not assignable to type '[\w ]+\| undefined'",msg):
            m=re.match(r'^(\s*\w+:\s*.*?)\bnull(\s*,?\s*)$',L)
            if m: lines[ln-1]=m.group(1)+'undefined'+m.group(2); st['null->undef']+=1; continue
        if code=='TS2322' and re.match(r"Type '(string|number) \| null' is not assignable to type '(string|number)'\.?$",msg):
            m=re.match(r'^(\s*\w+:\s*)(.+?)(,?)\s*$',L)
            if m:
                fb="''" if msg.startswith("Type 'string") else '0'
                lines[ln-1]=f'{m.group(1)}{m.group(2)} ?? {fb}{m.group(3)}'; st['nn-field']+=1; continue
        if code=='TS2322' and msg.startswith("Type 'string | undefined' is not assignable to type 'string'."):
            m=re.match(r'^(\s*\w+:\s*)(.+?)(,?)\s*$',L)
            if m: lines[ln-1]=f'{m.group(1)}{m.group(2)} as string{m.group(3)}'; st['uid']+=1; continue
        if code=='TS2322' and "'string | null' is not assignable to type 'string | undefined'" in msg and 'src={' in L:
            lines[ln-1]=re.sub(r'src=\{([^}]+)\}',r'src={\1 ?? undefined}',L); st['src']+=1; continue
        st['skip']+=1
    open(f,'w').write('\n'.join(lines))
print(dict(st))
