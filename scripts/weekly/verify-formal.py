#!/usr/bin/env python3
"""Formal post-release read-back for ffcap.cn weekly content updates (read-only HTTP GETs).

python3 scripts/weekly/verify-formal.py --base https://ffcap.cn \
  --content-dir <candidate>/src/content --cn-slugs a,b --en-slugs x,y \
  [--ga4-id G-XXXX] --out .local/private/weekly-YYYYMMDD/formal-readback.json

Checks home, /research, /en/research, /api/health, events entry, sitemap, search,
research/index.json, four static entry pages, GA4 snippet, and for every changed
article: page 200, <title>, description/og meta, canonical, source link, full text,
images (and fetches the first one), Markdown. Full text is compared after removing all
whitespace on both sides, in 20-char chunks, because paragraph breaks in the stored
text render as HTML tags (a raw substring probe gives false failures).
Exit code 0 only if every check passes; any failure means: roll back and verify recovery.
"""
import argparse, html as H, json, re, sys, urllib.error, urllib.parse, urllib.request
from pathlib import Path

cli = argparse.ArgumentParser()
cli.add_argument('--base', default='https://ffcap.cn')
cli.add_argument('--content-dir', required=True, type=Path)
cli.add_argument('--cn-slugs', default='')
cli.add_argument('--en-slugs', default='')
cli.add_argument('--ga4-id', default='')
cli.add_argument('--out', type=Path)
args = cli.parse_args()
B = args.base.rstrip('/')
results = []

def get(url, timeout=40):
    req = urllib.request.Request(url if url.startswith('http') else B + url, headers={'User-Agent': 'Mozilla/5.0 FFCAP-verify'})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception as e:
        return None, str(e)

def rec(name, ok, detail=''):
    results.append({'check': name, 'ok': bool(ok), 'detail': detail})
    print(('OK  ' if ok else 'FAIL'), name, detail, flush=True)

norm = lambda s: re.sub(r'\s+', '', s)
cn = [s for s in args.cn_slugs.split(',') if s]
en = [s for s in args.en_slugs.split(',') if s]

s, home = get('/')
rec('home 200', s == 200, str(s))
if args.ga4_id:
    rec(f'GA4 {args.ga4_id} on home', args.ga4_id in home)
rec('events entry (UniqueBloom link on home)', 'uniquebloom.cn' in home)
for path, slug in (('/research', cn[:1]), ('/en/research', en[:1])):
    s, b = get(path)
    rec(f'{path} 200', s == 200, str(s))
    if slug:
        rec(f'{path} lists {slug[0]}', slug[0] in b)
s, b = get('/api/health')
rec('health', s == 200 and '"ok"' in b, str(s))
for p in ('/report.html', '/bp.html', '/open.html', '/rankings.html'):
    s, _ = get(p)
    rec(f'static entry {p}', s == 200, str(s))
s, sitemap = get('/sitemap.xml')
rec('sitemap 200', s == 200, str(s))
s, index = get('/research/index.json')
rec('research/index.json 200', s == 200, str(s))

articles = []
for lang, slugs in (('zh', cn), ('en', en)):
    for slug in slugs:
        folder = 'articles' if lang == 'zh' else 'english-articles'
        d = json.loads((args.content_dir / 'research' / folder / f'{slug}.json').read_text())
        path = f'/research/{slug}' if lang == 'zh' else f'/en/research/{slug}'
        imgs = [H.unescape(x) for x in re.findall(r'<img[^>]+src="([^"]+)"', d['html'])]
        rec(f'sitemap {slug}', path in sitemap)
        if lang == 'zh':
            rec(f'index.json {slug}', slug in index)
        s, b = get(path)
        bt = H.unescape(b)
        rec(f'{slug} page 200', s == 200, str(s))
        m = re.search(r'<title>([^<]*)</title>', b)
        title = H.unescape(m.group(1)) if m else ''
        rec(f'{slug} <title>', d['title'][:12] in title, title[:60])
        rec(f'{slug} description/og meta', 'og:title' in b and 'name="description"' in b)
        m = re.search(r'<link rel="canonical" href="([^"]+)"', b)
        rec(f'{slug} canonical', bool(m) and m.group(1).rstrip('/') == B + path, m.group(1) if m else 'none')
        rec(f'{slug} source link', d['sourceUrl'] in bt, d['sourceUrl'])
        pt, tx = norm(H.unescape(re.sub(r'<[^>]+>', '', b))), norm(d['text'])
        chunks = [tx[i:i + 20] for i in range(0, max(1, len(tx) - 20), 60)] + [tx[-20:]]
        miss = [c for c in chunks if c not in pt]
        rec(f'{slug} full text', not miss, f'{len(chunks) - len(miss)}/{len(chunks)} chunks')
        found = sum(1 for i in imgs if i in bt)
        rec(f'{slug} images {found}/{len(imgs)}', found == len(imgs))
        if imgs:
            si, _ = get(imgs[0])
            rec(f'{slug} first image fetch', si == 200, str(si))
        s, md = get(path + '/markdown')
        rec(f'{slug} markdown', s == 200 and d['title'][:12] in md and d['sourceUrl'] in md, str(s))
        articles.append({'lang': lang, 'slug': slug, 'title': d['title'], 'url': B + path})
    if slugs and lang == 'zh':
        d = json.loads((args.content_dir / 'research/articles' / f'{slugs[0]}.json').read_text())
        s, b = get('/research?q=' + urllib.parse.quote(d['title'][:8]))
        rec('search CN', s == 200 and slugs[0] in b, str(s))

out = {'base': B, 'checks': results, 'all_ok': all(r['ok'] for r in results), 'articles': articles}
if args.out:
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out, ensure_ascii=False, indent=2) + '\n')
print('TOTAL', len(results), 'FAILED', sum(not r['ok'] for r in results), 'ALL_OK', out['all_ok'])
sys.exit(0 if out['all_ok'] else 1)
