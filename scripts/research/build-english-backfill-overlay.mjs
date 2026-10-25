#!/usr/bin/env node

/** Build an allowlisted overlay for site-authored English backfill imports. */
import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  BACKFILL_INGEST_SOURCE,
  digestHtml,
  isBackfillArticle,
  loadBackfillArticles,
} from './lib/english-ingest-shared.mjs';

function arg(name) {
  const index = process.argv.indexOf(name);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`${name} is required`);
  return path.resolve(process.argv[index + 1]);
}

const baseline = arg('--baseline-dir');
const staged = arg('--staged-dir');
const overlay = arg('--overlay-dir');
const manifestPath = arg('--manifest');
const prefix = 'src/content/research';
const validSlug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const baselineFile = (name) => path.join(baseline, prefix, name);
const stagedFile = (name) => path.join(staged, name);

const priorOverlay = await readdir(overlay).catch((error) => {
  if (error.code === 'ENOENT') return [];
  throw error;
});
if (priorOverlay.length) throw new Error('Backfill overlay directory must be fresh');

const oldManifest = await readJson(baselineFile('english-backfill.json'));
const nextManifest = await readJson(stagedFile('english-backfill.json'));
if (nextManifest.source !== BACKFILL_INGEST_SOURCE) throw new Error('Staged backfill manifest has unexpected source');

const oldCatalog = await readJson(baselineFile('english-catalog.json'));
const nextCatalog = await readJson(stagedFile('english-catalog.json'));
const oldMap = new Map(oldCatalog.map((row) => [row.slug, row]));
const nextMap = new Map(nextCatalog.map((row) => [row.slug, row]));
for (const slug of oldMap.keys()) {
  if (!nextMap.has(slug)) throw new Error(`Published English article disappeared: ${slug}`);
}

const { articles: stagedBackfill } = await loadBackfillArticles({
  manifestPath: stagedFile('english-backfill.json'),
  articlesDir: path.join(staged, 'english-articles'),
});

const added = [];
const revised = [];
const changedArticles = [];
for (const { manifest: row, article } of stagedBackfill) {
  if (!isBackfillArticle(article)) throw new Error(`Not a backfill article: ${article.slug}`);
  if (!article.contentComplete || !article.sourceAccessFree || article.text.length < 100) {
    throw new Error(`Incomplete backfill article: ${article.slug}`);
  }
  if (digestHtml(article.html) !== article.contentSha256) throw new Error(`HTML fingerprint mismatch: ${article.slug}`);
  const entry = nextMap.get(article.slug);
  if (!entry) throw new Error(`Backfill article missing from catalog: ${article.slug}`);
  for (const field of ['title', 'summary', 'publishedAt', 'sourceUrl', 'author', 'contentComplete', 'sourceAccessFree', 'imageCount']) {
    if (entry[field] !== article[field]) throw new Error(`Catalog differs from article ${article.slug}: ${field}`);
  }
  const oldRow = oldManifest.articles.find((item) => item.slug === article.slug);
  const oldArticlePath = baselineFile(`english-articles/${article.slug}.json`);
  const hadArticle = await readFile(oldArticlePath).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw error;
  });
  if (!hadArticle) {
    added.push(article.slug);
    changedArticles.push(article.slug);
    continue;
  }
  const before = JSON.parse(hadArticle);
  if (article.text.length < before.text.length * 0.7 || article.imageCount < before.imageCount) {
    throw new Error(`Backfill body or image regression: ${article.slug}`);
  }
  if (JSON.stringify(before) !== JSON.stringify(article) || JSON.stringify(oldRow) !== JSON.stringify(row)) {
    revised.push(article.slug);
    changedArticles.push(article.slug);
  }
}

if (!added.length && !revised.length) {
  const unchanged = { status: 'unchanged', ingestSource: BACKFILL_INGEST_SOURCE, added, revised, files: [] };
  await mkdir(path.dirname(manifestPath), { recursive: true });
  const pending = `${manifestPath}.pending-${process.pid}`;
  await writeFile(pending, `${JSON.stringify(unchanged, null, 2)}\n`);
  await rename(pending, manifestPath);
  console.log(JSON.stringify(unchanged));
  process.exit(0);
}

const changedFiles = [
  ...changedArticles.map((slug) => `english-articles/${slug}.json`),
  'english-backfill.json',
  'english-catalog.json',
  'english-highlights.json',
].sort();

const files = [];
await mkdir(overlay, { recursive: true });
for (const name of changedFiles) {
  const dest = path.join(overlay, prefix, name);
  const bytes = await readFile(stagedFile(name));
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

const manifest = {
  status: 'changed',
  ingestSource: BACKFILL_INGEST_SOURCE,
  catalogCount: nextCatalog.length,
  backfillCount: nextManifest.articles.length,
  added,
  revised,
  files,
};
await mkdir(path.dirname(manifestPath), { recursive: true });
const pending = `${manifestPath}.pending-${process.pid}`;
await writeFile(pending, `${JSON.stringify(manifest, null, 2)}\n`);
await rename(pending, manifestPath);
console.log(JSON.stringify(manifest));
