#!/usr/bin/env node

/** Build an allowlisted English-content overlay from a complete public discovery and isolated import. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

function arg(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return path.resolve(process.argv[index + 1]);
}
const baseline = arg('--baseline-dir');
const staged = arg('--staged-dir');
const discoveryPath = arg('--discovery');
const overlay = arg('--overlay-dir');
const manifestPath = arg('--manifest');
const priorOverlay = await readdir(overlay).catch((error) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
if (priorOverlay.length) throw new Error('English overlay directory must be fresh');
const prefix = 'src/content/research';
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const baselineFile = (name) => path.join(baseline, prefix, name);
const stagedFile = (name) => path.join(staged, name);
const sourceSlug = (url) => {
  const value = new URL(url);
  if (value.origin !== 'https://uniqueresearch.substack.com') throw new Error('Unexpected English source origin');
  const match = /^\/p\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(value.pathname);
  if (!match || value.search || value.hash) throw new Error('Invalid source article URL');
  return match[1];
};
const index = (rows, kind, slugOf) => {
  if (!Array.isArray(rows)) throw new Error(`${kind} is not an array`);
  const map = new Map();
  for (const row of rows) {
    const slug = slugOf(row);
    if (!validSlug.test(slug) || map.has(slug)) throw new Error(`${kind} has duplicate or invalid slug: ${slug}`);
    map.set(slug, row);
  }
  return map;
};
const oldArchive = await readJson(baselineFile('english-substack.json'));
const discovery = await readJson(discoveryPath);
if (discovery.complete !== true || discovery.source !== oldArchive.source) throw new Error('English source discovery is incomplete or changed origin');
const oldSource = index(oldArchive.articles, 'baseline source', (row) => sourceSlug(row.url));
const newSource = index(discovery.articles, 'discovery', (row) => sourceSlug(row.url));
if (newSource.size < oldSource.size || newSource.size < Math.floor(oldSource.size * 0.9)) throw new Error('English source count declined');
for (const [slug, row] of oldSource) {
  if (!newSource.has(slug) || newSource.get(slug).url !== row.url) throw new Error(`Missing or changed source slug: ${slug}`);
}

const oldCatalog = index(await readJson(baselineFile('english-catalog.json')), 'baseline catalog', (row) => row.slug);
const nextCatalog = index(await readJson(stagedFile('english-catalog.json')), 'staged catalog', (row) => row.slug);
for (const slug of oldCatalog.keys()) if (!nextCatalog.has(slug)) throw new Error(`Published English article disappeared: ${slug}`);
const newSlugs = [...newSource.keys()].filter((slug) => !oldSource.has(slug));
for (const slug of newSlugs) if (!nextCatalog.has(slug)) throw new Error(`New source article has no verified full text: ${slug}`);

const oldArticle = async (slug) => readJson(baselineFile(`english-articles/${slug}.json`));
const nextArticle = async (slug) => readJson(stagedFile(`english-articles/${slug}.json`));
const added = [];
const revised = [];
const changedArticles = [];
for (const [slug, entry] of nextCatalog) {
  const article = await nextArticle(slug);
  if (!article.contentComplete || article.sourceAccessFree !== true || article.slug !== slug || article.sourceUrl !== newSource.get(slug)?.url) {
    throw new Error(`English source proof failed: ${slug}`);
  }
  if (!article.title || !article.publishedAt || !article.author || article.text?.length < 100 || !article.html) throw new Error(`Incomplete English full text: ${slug}`);
  if (digest(article.html) !== article.contentSha256) throw new Error(`HTML fingerprint mismatch: ${slug}`);
  if (!oldCatalog.has(slug) && article.missingSourceImageCount > 0) throw new Error(`New English article has missing source images: ${slug}`);
  for (const field of ['title', 'summary', 'publishedAt', 'sourceUrl', 'author', 'contentComplete', 'sourceAccessFree', 'imageCount']) {
    if (entry[field] !== article[field]) throw new Error(`Catalog differs from article ${slug}: ${field}`);
  }
  if (!oldCatalog.has(slug)) {
    added.push(slug);
    changedArticles.push(slug);
    continue;
  }
  const before = await oldArticle(slug);
  if (article.text.length < before.text.length * 0.7 || article.imageCount < before.imageCount) throw new Error(`English body or image regression: ${slug}`);
  if (JSON.stringify(before) !== JSON.stringify(article)) {
    revised.push(slug);
    changedArticles.push(slug);
  } else if (JSON.stringify(oldCatalog.get(slug)) !== JSON.stringify(entry)) {
    throw new Error(`Catalog-only change lacks verified article revision: ${slug}`);
  }
}
for (const [slug, row] of oldSource) {
  const next = newSource.get(slug);
  const equivalent = (before, after) => before === after || (typeof before === 'string' && before.endsWith('…') && after.startsWith(before.slice(0, -1)));
  const meaningful = ['title', 'url', 'summary', 'publishedAt'].some((key) => !equivalent(row[key], next[key]));
  if (meaningful && oldCatalog.has(slug) && !revised.includes(slug)) throw new Error(`Source metadata changed without refreshed body: ${slug}`);
}
const expectedHighlights = [...nextCatalog.values()].slice(0, 12);
if (JSON.stringify(await readJson(stagedFile('english-highlights.json'))) !== JSON.stringify(expectedHighlights)) throw new Error('English highlights do not match catalog');
if (!added.length && !revised.length) {
  const unchanged = { status: 'unchanged', sourceCount: newSource.size, catalogCount: nextCatalog.size, added, revised, files: [] };
  await mkdir(path.dirname(manifestPath), { recursive: true });
  const pending = `${manifestPath}.pending-${process.pid}`;
  await writeFile(pending, `${JSON.stringify(unchanged, null, 2)}\n`);
  await rename(pending, manifestPath);
  console.log(JSON.stringify(unchanged));
  process.exit(0);
}

const changed = [
  ...changedArticles.map((slug) => `english-articles/${slug}.json`),
  'english-catalog.json', 'english-highlights.json', 'english-substack.json',
].sort();
const files = [];
await mkdir(overlay, { recursive: true });
for (const name of changed) {
  const dest = path.join(overlay, prefix, name);
  const source = name === 'english-substack.json' ? discoveryPath : stagedFile(name);
  const bytes = await readFile(source);
  const prior = await readFile(baselineFile(name)).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (prior && digest(prior) === digest(bytes)) continue;
  await mkdir(path.dirname(dest), { recursive: true });
  const pending = `${dest}.pending-${process.pid}`;
  await writeFile(pending, bytes);
  await rename(pending, dest);
  files.push({ path: `${prefix}/${name}`, sha256: digest(bytes), baselineSha256: prior ? digest(prior) : null });
}
const manifest = { status: 'changed', source: discovery.source, sourceCapturedAt: discovery.capturedAt, sourceCount: newSource.size, catalogCount: nextCatalog.size, added, revised, files };
await mkdir(path.dirname(manifestPath), { recursive: true });
const pending = `${manifestPath}.pending-${process.pid}`;
await writeFile(pending, `${JSON.stringify(manifest, null, 2)}\n`);
await rename(pending, manifestPath);
console.log(JSON.stringify(manifest));
