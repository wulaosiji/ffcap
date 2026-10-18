#!/usr/bin/env python3
"""Import the public UniqueResearch Tencent archive. No login or credentials.

python3 scripts/research/import_qq.py --workspace /path/to/private/import
Raw source/checkpoints stay in --workspace; reviewed, sanitized content is emitted
by --publish-local only. This never deploys, commits or schedules anything.
"""
import argparse
import concurrent.futures
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import time
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
AUTHOR = '21759984'
SUID = '8QIf3n9a7ocVuTfZ5ws='
SOURCE = f'https://news.qq.com/omn/author/{AUTHOR}'
# Verified against rendered public pages on 2026-09-06, not parser failures.
KNOWN_EMPTY = {'20230914A063PR00', '20230911A0AWUE00', '20230621A08GEM00', '20221212A07IO300'}
KNOWN_MISSING_IMAGES = {'20230111A0223Q00', '20221228A078AF00', '20221222A07FKZ00', '20221122A05MS200'}


def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html,application/json'}), timeout=30) as res:
                return res.read().decode('utf-8')
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.part')
    temporary.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    temporary.replace(path)


def safe_url(value, image=False):
    value = html.unescape(value or '').strip()
    if value.startswith('//'):
        value = 'https:' + value
    if value.startswith('http://'):
        value = 'https://' + value[7:]
    parsed = urlparse(value)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password:
        return ''
    if image and not any(parsed.hostname == h or parsed.hostname.endswith('.' + h) for h in ['gtimg.com', 'gtimg.cn', 'qpic.cn', 'qq.com']):
        return ''
    return value


class ArticleHTML(HTMLParser):
    """Rebuild a small HTML allowlist; discard all source styling and scripts."""
    allowed = {'p', 'div', 'h2', 'h3', 'h4', 'strong', 'em', 'b', 'i', 'u', 's', 'blockquote', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'figure', 'figcaption', 'a', 'br', 'hr', 'img'}
    dropped = {'script', 'style', 'iframe', 'object', 'embed', 'svg', 'form', 'button', 'noscript'}
    blocks = {'p', 'div', 'section', 'h1', 'h2', 'h3', 'h4', 'li', 'tr', 'br', 'blockquote'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.output, self.plain, self.stack, self.skip = [], [], [], []
        self.images = 0

    def handle_starttag(self, tag, attrs):
        if self.skip:
            if tag in self.dropped:
                self.skip.append(tag)
            return
        if tag in self.dropped:
            self.skip.append(tag)
            return
        attrs = dict(attrs)
        if tag in self.blocks:
            self.plain.append('\n')
        tag = {'section': 'div', 'h1': 'h2'}.get(tag, tag)
        if tag not in self.allowed:
            return
        extra = ''
        if tag == 'img':
            if 'we-emoji' in attrs.get('class', '') and attrs.get('alt'):
                self.output.append(html.escape(attrs['alt']))
                self.plain.append(attrs['alt'])
                return
            src = safe_url(attrs.get('src'), image=True) or safe_url(attrs.get('data-src'), image=True)
            if not src:
                return
            self.images += 1
            extra = f' src="{html.escape(src, quote=True)}" alt="{html.escape(attrs.get("alt", ""), quote=True)}" loading="lazy" decoding="async" referrerpolicy="no-referrer"'
            for dimension in ['width', 'height']:
                if str(attrs.get(dimension, '')).isdigit() and 0 < int(attrs[dimension]) <= 100000:
                    extra += f' {dimension}="{attrs[dimension]}"'
        if tag == 'a':
            href = safe_url(attrs.get('href'))
            if href:
                extra = f' href="{html.escape(href, quote=True)}" target="_blank" rel="noopener noreferrer"'
        if tag in {'td', 'th'}:
            for key in ['colspan', 'rowspan']:
                if str(attrs.get(key, '')).isdigit() and 0 < int(attrs[key]) <= 30:
                    extra += f' {key}="{attrs[key]}"'
        self.output.append(f'<{tag}{extra}>')
        if tag not in {'br', 'hr', 'img'}:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if self.skip:
            if tag == self.skip[-1]:
                self.skip.pop()
            return
        if tag in self.blocks:
            self.plain.append('\n')
        tag = {'section': 'div', 'h1': 'h2'}.get(tag, tag)
        if tag in self.stack:
            while self.stack:
                current = self.stack.pop()
                self.output.append(f'</{current}>')
                if current == tag:
                    break

    def handle_data(self, data):
        if not self.skip:
            self.output.append(html.escape(data))
            self.plain.append(data)

    def result(self):
        output = ''.join(self.output) + ''.join(f'</{tag}>' for tag in reversed(self.stack))
        text = '\n'.join(re.sub(r'\s+', ' ', line).strip() for line in ''.join(self.plain).splitlines())
        return output, re.sub(r'\n{3,}', '\n\n', text).strip()


def get_inventory(workspace):
    records, seen, pages, offset = [], set(), [], ''
    for number in range(1, 501):
        url = 'https://i.news.qq.com/getSubNewsMixedList?' + urlencode({'offset_info': offset, 'guestSuid': SUID, 'tabId': 'om_index', 'caller': 1, 'from_scene': 103})
        payload = json.loads(fetch(url))
        if payload.get('ret') != 0:
            raise ValueError(f'List failed: {payload.get("errmsg")}')
        save(workspace / 'list-pages' / f'{number:03}.json', payload)
        items = payload.get('newslist') or []
        new = 0
        for item in items:
            if str(item.get('chlid')) != AUTHOR:
                raise ValueError('Unexpected author in archive')
            if item['id'] not in seen:
                seen.add(item['id'])
                records.append({key: item.get(key) for key in ['id', 'title', 'time', 'url', 'abstract', 'articletype', 'chlid']})
                new += 1
        pages.append({'page': number, 'count': len(items), 'new': new, 'hasNext': payload.get('hasNext'), 'total': payload.get('total')})
        print(f'List page {number}: {len(records)} unique articles; hasNext={payload.get("hasNext")}', flush=True)
        save(workspace / 'inventory.json', {'source': SOURCE, 'complete': not bool(payload.get('hasNext')), 'pages': pages, 'articles': records})
        if not payload.get('hasNext'):
            return records
        next_offset = payload.get('offsetInfo')
        if not new or not next_offset or next_offset == offset:
            raise ValueError('Pagination stalled before confirmed end')
        offset = next_offset
        time.sleep(.15)
    raise ValueError('Pagination safety limit exceeded')


def get_article(item, workspace):
    article_id = item['id']
    if not re.fullmatch(r'[A-Za-z0-9]+', article_id):
        raise ValueError('Invalid article ID')
    path = workspace / 'html' / f'{article_id}.html'
    if not path.exists():
        source = fetch(item['url'])
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(source)
    else:
        source = path.read_text()
    match = re.search(r'window\.DATA\s*=\s*', source)
    if not match:
        # Older public articles render their body directly instead of window.DATA.
        legacy = re.search(r'<section class="article rich-media-content[^\"]*">([\s\S]*?)<div class="" id="VoteContainer"', source)
        author = re.search(r'<span class="author">([^<]+)</span>', source)
        if not legacy or not author or html.unescape(author.group(1)) != '非凡产研':
            raise ValueError('Missing verified legacy article body')
        data = {'media_id': AUTHOR, 'article_id': article_id, 'title': item['title'], 'media': '非凡产研', 'pubtime': item['time'], 'url': item['url'], 'originContent': {'text': legacy.group(1)}, 'atype': item['articletype']}
    else:
        data = json.JSONDecoder().raw_decode(source[match.end():])[0]
    if str(data.get('media_id')) != AUTHOR or data.get('article_id') != article_id:
        raise ValueError('Article identity mismatch')
    if (data.get('payment_info') or {}).get('need_pay') or data.get('article_is_pay'):
        raise ValueError('Paid content excluded')
    original = data.get('originContent') or {}
    body = original.get('text', '')
    attributes = data.get('originAttribute') or {}
    missing_images = []
    def expand(match):
        key = match.group(1)
        value = attributes.get(key) or {}
        if key.startswith('IMG_'):
            url = safe_url(value.get('imgurl1000') or value.get('origUrl') or value.get('url'), image=True)
            if not url:
                if article_id not in KNOWN_MISSING_IMAGES:
                    raise ValueError(f'Missing image source: {key}')
                missing_images.append(key)
                return '<p>〔原文此处图片缺少可用地址〕</p>'
            dimensions = ''.join(f' {key}="{value[key]}"' for key in ['width', 'height'] if str(value.get(key, '')).isdigit())
            alt = value.get('desc') or f'{data["title"]} · 原文图片 {int(key.split("_")[-1]) + 1}'
            return f'<img src="{html.escape(url, quote=True)}" alt="{html.escape(alt, quote=True)}"{dimensions}>'
        if key.startswith('SECURE_LINK_BEGIN_'):
            url = safe_url(value.get('url'))
            return f'<a href="{html.escape(url, quote=True)}">'
        if key.startswith('SECURE_LINK_END_'):
            return '</a>'
        if key.startswith('LINK_'):
            url = safe_url(value.get('url'))
            return f'<a href="{html.escape(url, quote=True)}">{html.escape(value.get("showTitle") or value.get("title", ""))}</a>'
        if key.startswith('VIDEO_'):
            url = safe_url(value.get('playurl')) or safe_url(data['url'])
            return f'<p><a href="{html.escape(url, quote=True)}">观看原文视频：{html.escape(value.get("title") or data["title"])}</a></p>'
        return ''
    expanded = re.sub(r'<!--\s*([A-Z_]+\d+)\s*-->', expand, body)
    parser = ArticleHTML()
    parser.feed(expanded)
    clean_html, plain = parser.result()
    source_incomplete = len(plain) < 80 and not parser.images and article_id in KNOWN_EMPTY
    if len(plain) < 80 and not parser.images and not source_incomplete:
        raise ValueError(f'Insufficient text: {len(plain)}; type={data.get("atype")}')
    published = data.get('pubtime') or item['time']
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}', published):
        raise ValueError('Invalid publication timestamp')
    title = data['title']
    image_article = len(plain) < 80 and parser.images > 0
    excerpt = f'{title}。原文以图片呈现，点击查看完整图文。' if image_article else re.sub(r'\s+', ' ', plain)[:180] + ('…' if len(plain) > 180 else '')
    if source_incomplete:
        excerpt = '原始发布页面目前未提供完整正文，已保留标题、发布时间及来源链接，待补充原稿。'
    return {'id': article_id, 'slug': article_id.lower(), 'title': title, 'author': data['media'], 'publishedAt': published.replace(' ', 'T') + '+08:00', 'sourceUrl': safe_url(data['url']), 'sourceAuthorUrl': SOURCE, 'excerpt': excerpt, 'html': clean_html, 'text': plain, 'imageCount': parser.images, 'missingImages': missing_images, 'sourceIncomplete': source_incomplete, 'sourceSha256': hashlib.sha256(body.encode()).hexdigest(), 'sourceType': data.get('atype'), 'hasVideo': bool(data.get('videoArr')) or any(k.startswith('VIDEO_') for k in attributes), 'imageArticle': image_article, 'readingMinutes': max(1, round(len(plain) / 500))}


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument('--workspace', type=Path, required=True)
    cli.add_argument('--reuse-inventory', action='store_true')
    cli.add_argument('--publish-local', action='store_true')
    args = cli.parse_args()
    if args.reuse_inventory:
        inventory = json.loads((args.workspace / 'inventory.json').read_text())
        if not inventory['complete']:
            raise ValueError('Cannot reuse incomplete inventory')
        items = inventory['articles']
    else:
        items = get_inventory(args.workspace)
    articles, failures = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        pending = {pool.submit(get_article, item, args.workspace): item for item in items}
        for future in concurrent.futures.as_completed(pending):
            item = pending[future]
            try:
                article = future.result()
                save(args.workspace / 'normalized' / f'{article["id"]}.json', article)
                articles.append(article)
            except Exception as error:
                failures.append({'id': item['id'], 'title': item['title'], 'url': item['url'], 'reason': str(error)})
            if (len(articles) + len(failures)) % 20 == 0:
                print(f'Article bodies: {len(articles)} OK, {len(failures)} exceptions / {len(items)}', flush=True)
    articles.sort(key=lambda a: (a['publishedAt'], a['id']), reverse=True)
    report = {'source': SOURCE, 'fetchedAt': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'listed': len(items), 'converted': len(articles), 'failures': failures, 'oldest': articles[-1]['publishedAt'] if articles else None, 'newest': articles[0]['publishedAt'] if articles else None, 'videoArticles': [a['id'] for a in articles if a['hasVideo']], 'complete': not failures}
    report.update({'sourceIncomplete': [a['id'] for a in articles if a['sourceIncomplete']], 'missingImageArticles': [{'id': a['id'], 'images': a['missingImages']} for a in articles if a['missingImages']], 'imageArticles': [a['id'] for a in articles if a['imageArticle']]})
    report['fullContentComplete'] = not failures and not report['sourceIncomplete'] and not report['missingImageArticles']
    save(args.workspace / 'report.json', report)
    if args.publish_local:
        if failures:
            raise ValueError('Resolve exceptions before publishing local catalog')
        destination = ROOT / 'src/content/research'
        for article in articles:
            save(destination / 'articles' / f'{article["slug"]}.json', article)
        save(destination / 'catalog.json', [{k: v for k, v in a.items() if k != 'html'} for a in articles])
        save(destination / 'import-report.json', report)
    print(json.dumps(report, ensure_ascii=False, indent=2), flush=True)


if __name__ == '__main__':
    main()
