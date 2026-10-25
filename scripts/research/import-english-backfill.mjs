#!/usr/bin/env node

/**
 * Import editor-authored English backfill packages into the on-site English library.
 *
 *   node scripts/research/import-english-backfill.mjs --packages /path/to/batch [--dry-run]
 *   node scripts/research/import-english-backfill.mjs --packages ./fixtures/english-backfill-pilot \
 *     --articles-dir .local/backfill-test/english-articles \
 *     --manifest-path .local/backfill-test/english-backfill.json \
 *     --archive-path src/content/research/english-substack.json \
 *     --catalog-path .local/backfill-test/english-catalog.json \
 *     --highlights-path .local/backfill-test/english-highlights.json
 */

import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BACKFILL_INGEST_SOURCE,
  readBackfillManifest,
  rebuildEnglishCatalog,
  validateBackfillPackagePayload,
} from './lib/english-ingest-shared.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const option = (name, fallback) => {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  if (!process.argv[index + 1]) throw new Error(`${name} requires a value`);
  return path.resolve(process.argv[index + 1]);
};
const packagesDir = option('--packages', null);
const dryRun = process.argv.includes('--dry-run');
const articlesDir = option('--articles-dir', path.join(repo, 'src/content/research/english-articles'));
const manifestPath = option('--manifest-path', path.join(repo, 'src/content/research/english-backfill.json'));
const archivePath = option('--archive-path', path.join(repo, 'src/content/research/english-substack.json'));
const catalogPath = option('--catalog-path', path.join(repo, 'src/content/research/english-catalog.json'));
const highlightsPath = option('--highlights-path', path.join(repo, 'src/content/research/english-highlights.json'));
const reportPath = option('--report-path', path.join(repo, '.local/reports/english-backfill-import-report.json'));

if (!packagesDir) throw new Error('--packages is required');

const atomicJson = async (target, value) => {
  if (dryRun) return;
  await mkdir(path.dirname(target), { recursive: true });
  const pending = `${target}.pending-${process.pid}`;
  await writeFile(pending, `${JSON.stringify(value, null, 2)}\n`);
  await rename(pending, target);
};

async function readPackage(dirName) {
  const payload = JSON.parse(await readFile(path.join(packagesDir, dirName, 'article.json'), 'utf8'));
  return validateBackfillPackagePayload(payload, { slugFromDir: dirName });
}

const packageNames = (await readdir(packagesDir)).filter((name) => !name.startsWith('.')).sort();
const imported = [];
const skipped = [];
for (const name of packageNames) {
  const article = await readPackage(name);
  const target = path.join(articlesDir, `${article.slug}.json`);
  let previous = null;
  try {
    previous = JSON.parse(await readFile(target, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (previous && JSON.stringify(previous) === JSON.stringify(article)) {
    skipped.push(article.slug);
    continue;
  }
  if (previous && previous.text.length > article.text.length * 1.3) {
    throw new Error(`Refusing body regression for ${article.slug}`);
  }
  if (!dryRun) await atomicJson(target, article);
  imported.push(article.slug);
}

const manifest = await readBackfillManifest(manifestPath);
const bySlug = new Map(manifest.articles.map((row) => [row.slug, row]));
const now = new Date().toISOString();
for (const name of packageNames) {
  const article = await readPackage(name);
  const payload = JSON.parse(await readFile(path.join(packagesDir, name, 'article.json'), 'utf8'));
  const row = {
    slug: article.slug,
    importedAt: bySlug.get(article.slug)?.importedAt || now,
    updatedAt: now,
    ...(payload.backfillFromCnId ? { backfillFromCnId: String(payload.backfillFromCnId) } : {}),
    ...(payload.cnSourceUrl ? { cnSourceUrl: String(payload.cnSourceUrl) } : {}),
    ...(payload.relatedCnSlug ? { relatedCnSlug: String(payload.relatedCnSlug) } : {}),
  };
  bySlug.set(article.slug, row);
}
const nextManifest = {
  source: BACKFILL_INGEST_SOURCE,
  updatedAt: now,
  articles: [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
};
await atomicJson(manifestPath, nextManifest);

const { catalog, highlights, substackCount, backfillCount } = await rebuildEnglishCatalog({
  archivePath,
  manifestPath,
  articlesDir,
  catalogPath,
  highlightsPath,
});
await atomicJson(catalogPath, catalog);
await atomicJson(highlightsPath, highlights);

const report = {
  ingestSource: BACKFILL_INGEST_SOURCE,
  dryRun,
  packagesDir,
  imported,
  skipped,
  catalogCount: catalog.length,
  substackCount,
  backfillCount,
  checkedAt: now,
};
await atomicJson(reportPath, report);
console.log(JSON.stringify(report, null, 2));
