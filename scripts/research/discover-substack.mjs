#!/usr/bin/env node

/**
 * Discover public English posts without changing the site or its source archive.
 *
 * Run locally with an output path inside the project's private directory:
 *   node scripts/research/discover-substack.mjs \
 *     --output .local/private/weekly-YYYYMMDD/english-discovery.json
 *   (override the private root with FFCAP_PRIVATE_DIR)
 *
 * The public archive is paginated to its end. RSS is a cross-check only: it
 * contains just the newest posts and cannot establish complete coverage.
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Private snapshots must stay outside Git: default is the ignored repo/.local/private.
const privateRoot = path.resolve(process.env.FFCAP_PRIVATE_DIR || path.join(repo, '.local/private'));
const cliPath = (name, fallback) => {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  if (!process.argv[index + 1]) throw new Error(`${name} requires a path`);
  return path.resolve(process.argv[index + 1]);
};
const sourceArchive = cliPath('--previous-archive', path.join(repo, 'src/content/research/english-substack.json'));
const sourceCatalog = cliPath('--published-catalog', path.join(repo, 'src/content/research/english-catalog.json'));
const origin = 'https://uniqueresearch.substack.com';
const pageSize = 12;
const maxPages = 200;

// Python's standard HTTP client honors this machine's configured proxy. Node's
// built-in fetch does not reliably reach the publication from this workspace.
const fetchPublicSource = String.raw`
import json, sys, urllib.request, xml.etree.ElementTree as ET
url, kind = sys.argv[1:3]
request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; FFCAP content audit)', 'Accept': 'application/json, application/xml;q=0.9, */*;q=0.8'})
with urllib.request.urlopen(request, timeout=25) as response:
    data = response.read(12 * 1024 * 1024 + 1)
    if len(data) > 12 * 1024 * 1024:
        raise ValueError('source response too large')
if kind == 'archive':
    rows = json.loads(data)
    if not isinstance(rows, list):
        raise ValueError('archive response is not a list')
    result = [{'url': row.get('canonical_url'), 'title': row.get('title'), 'summary': row.get('description') or row.get('subtitle') or '', 'publishedAt': row.get('post_date')} for row in rows]
else:
    root = ET.fromstring(data)
    result = [item.findtext('link') for item in root.findall('./channel/item')]
print(json.dumps(result, ensure_ascii=False))
`;

function publicFetch(url, kind) {
  const result = spawnSync('python3', ['-c', fetchPublicSource, url, kind], {
    encoding: 'utf8', timeout: 35_000, maxBuffer: 4 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`${kind} source request failed: ${result.error?.message || result.stderr?.trim().split('\n').at(-1) || 'unknown error'}`);
  }
  return JSON.parse(result.stdout);
}

function articleIdentity(item) {
  if (typeof item?.url !== 'string') throw new Error('source item missing URL');
  let url;
  try { url = new URL(item.url); } catch { throw new Error(`invalid source URL: ${item.url}`); }
  const match = url.pathname.match(/^\/p\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/);
  if (url.origin !== origin || url.search || url.hash || !match) throw new Error(`invalid source URL: ${item.url}`);
  return { slug: match[1], url: `${origin}/p/${match[1]}` };
}

function normalizeArticle(item) {
  const id = articleIdentity(item);
  if (typeof item.title !== 'string' || !item.title.trim()) throw new Error(`source title missing: ${id.slug}`);
  if (typeof item.publishedAt !== 'string' || !Number.isFinite(Date.parse(item.publishedAt))) {
    throw new Error(`source date missing or invalid: ${id.slug}`);
  }
  return {
    slug: id.slug,
    url: id.url,
    title: item.title.trim(),
    summary: typeof item.summary === 'string' ? item.summary.trim() : '',
    publishedAt: item.publishedAt,
  };
}

function knownRows(rows, label) {
  if (!Array.isArray(rows)) throw new Error(`${label} must be an array`);
  const bySlug = new Map();
  for (const raw of rows) {
    const row = normalizeArticle({
      url: raw.url || raw.sourceUrl,
      title: raw.title,
      summary: raw.summary,
      publishedAt: raw.publishedAt,
    });
    if (bySlug.has(row.slug)) throw new Error(`duplicate ${label} slug: ${row.slug}`);
    bySlug.set(row.slug, row);
  }
  return bySlug;
}

export async function discoverSubstack({ previousArchive, publishedCatalog, getPage, getRss, checkedAt = new Date().toISOString() }) {
  const previous = knownRows(previousArchive.articles, 'previous archive');
  const published = knownRows(publishedCatalog, 'published catalog');
  const fetched = [];
  const seen = new Set();
  let firstPage = null;
  let pageCount = 0;
  for (let offset = 0; pageCount < maxPages; offset += pageSize) {
    const page = await getPage(offset, pageSize);
    if (!Array.isArray(page) || page.length > pageSize) throw new Error(`invalid archive page at offset ${offset}`);
    pageCount += 1;
    const normalized = page.map(normalizeArticle);
    if (offset === 0) firstPage = normalized.map((row) => row.slug);
    for (const row of normalized) {
      if (seen.has(row.slug)) throw new Error(`duplicate source slug across pages: ${row.slug}`);
      seen.add(row.slug);
      fetched.push(row);
    }
    if (page.length < pageSize) break;
  }
  if (pageCount >= maxPages) throw new Error(`archive pagination exceeded ${maxPages} pages`);
  if (fetched.length < previous.size) {
    throw new Error(`archive count dropped from ${previous.size} to ${fetched.length}`);
  }
  const missingPreviouslyListed = [...previous.keys()].filter((slug) => !seen.has(slug));
  const missingPublished = [...published.keys()].filter((slug) => !seen.has(slug));
  if (missingPreviouslyListed.length || missingPublished.length) {
    throw new Error(`archive missing ${missingPreviouslyListed.length} previously listed and ${missingPublished.length} published slugs`);
  }
  const firstPageAgain = (await getPage(0, pageSize)).map(normalizeArticle).map((row) => row.slug);
  if (JSON.stringify(firstPageAgain) !== JSON.stringify(firstPage)) {
    throw new Error('archive first page changed while paginating');
  }

  const discovered = fetched.filter((row) => !previous.has(row.slug));
  const metadataEquivalent = (oldValue, newValue) => oldValue === newValue
    || (typeof oldValue === 'string' && oldValue.endsWith('…') && newValue.startsWith(oldValue.slice(0, -1)));
  const metadataExpandedFromTruncated = fetched.filter((row) => {
    const old = previous.get(row.slug);
    return old && ['title', 'summary'].some((field) => old[field] !== row[field] && metadataEquivalent(old[field], row[field]));
  }).map((row) => row.slug);
  const metadataChanged = fetched.filter((row) => {
    const old = previous.get(row.slug);
    return old && ['url', 'title', 'summary', 'publishedAt'].some((field) => !metadataEquivalent(old[field], row[field]));
  }).map((row) => ({ slug: row.slug, previous: previous.get(row.slug), current: row }));

  let rss = { status: 'unavailable', count: null, missingFromArchive: [] };
  if (getRss) {
    try {
      const links = await getRss();
      if (!Array.isArray(links) || links.length === 0) throw new Error('RSS was empty or invalid');
      const slugs = links.map((url) => articleIdentity({ url }).slug);
      rss = { status: 'ok', count: slugs.length, missingFromArchive: slugs.filter((slug) => !seen.has(slug)) };
      if (rss.missingFromArchive.length) throw new Error(`RSS lists ${rss.missingFromArchive.length} posts absent from full archive`);
    } catch (error) {
      if (rss.missingFromArchive.length) throw error;
      rss = { status: 'unavailable', count: null, missingFromArchive: [], warning: error.message };
    }
  }

  return {
    status: 'complete', complete: true, source: `${origin}/archive`, capturedAt: checkedAt, checkedAt,
    pageSize, pageCount, sourceCount: fetched.length,
    previousArchiveCount: previous.size, publishedCount: published.size,
    newCount: discovered.length, metadataChangedCount: metadataChanged.length,
    metadataExpandedFromTruncatedCount: metadataExpandedFromTruncated.length,
    listedButNotPublishedCount: fetched.filter((row) => !published.has(row.slug)).length,
    rss, newArticles: discovered, metadataChanged, metadataExpandedFromTruncated, articles: fetched,
  };
}

async function atomicJson(pathname, value) {
  await mkdir(path.dirname(pathname), { recursive: true });
  const tmp = `${pathname}.${randomUUID()}.tmp`;
  try {
    await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await rename(tmp, pathname);
  } finally {
    await rm(tmp, { force: true });
  }
}

async function main() {
  const flag = process.argv.indexOf('--output');
  if (flag < 0 || !process.argv[flag + 1]) throw new Error('usage: discover-substack.mjs --output PRIVATE_PATH');
  const output = path.resolve(process.argv[flag + 1]);
  const relative = path.relative(privateRoot, output);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`output must be inside ${privateRoot}`);
  }
  const previousArchive = JSON.parse(await readFile(sourceArchive, 'utf8'));
  const publishedCatalog = JSON.parse(await readFile(sourceCatalog, 'utf8'));
  const getPage = (offset, limit) => publicFetch(`${origin}/api/v1/archive?sort=new&search=&offset=${offset}&limit=${limit}`, 'archive');
  const getRss = () => publicFetch(`${origin}/feed`, 'rss');
  try {
    const result = await discoverSubstack({ previousArchive, publishedCatalog, getPage, getRss });
    await atomicJson(output, result);
    process.stdout.write(`${JSON.stringify({ status: result.status, sourceCount: result.sourceCount, newCount: result.newCount, metadataChangedCount: result.metadataChangedCount, rss: result.rss.status, output })}\n`);
  } catch (error) {
    await atomicJson(output, { status: 'blocked', complete: false, source: `${origin}/archive`, capturedAt: new Date().toISOString(), reason: error.message });
    throw error;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
