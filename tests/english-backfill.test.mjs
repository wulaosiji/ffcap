import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, cp, rm } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  BACKFILL_INGEST_SOURCE,
  isBackfillArticle,
  isSubstackArticle,
  rebuildEnglishCatalog,
  validateBackfillPackagePayload,
} from '../scripts/research/lib/english-ingest-shared.mjs'
import { englishArticleMarkdown } from '../src/lib/english-research-formats.mjs'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixturePackage = path.join(repo, 'scripts/research/fixtures/english-backfill-pilot/en-backfill-fixture-sample')

test('backfill package validation accepts the pilot fixture', async () => {
  const payload = JSON.parse(await readFile(path.join(fixturePackage, 'article.json'), 'utf8'))
  const article = validateBackfillPackagePayload(payload, { slugFromDir: 'en-backfill-fixture-sample' })
  assert.equal(article.ingestSource, BACKFILL_INGEST_SOURCE)
  assert.ok(isBackfillArticle(article))
  assert.ok(!isSubstackArticle(article))
  assert.ok(article.text.length >= 100)
})

test('import-english-backfill dry-run merges one article into an isolated catalog', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'ffcap-en-backfill-'))
  const articlesDir = path.join(temp, 'english-articles')
  const manifestPath = path.join(temp, 'english-backfill.json')
  const catalogPath = path.join(temp, 'english-catalog.json')
  const highlightsPath = path.join(temp, 'english-highlights.json')
  const packagesDir = path.join(temp, 'packages')
  await mkdir(articlesDir, { recursive: true })
  await cp(path.join(repo, 'src/content/research/english-substack.json'), path.join(temp, 'english-substack.json'))
  await cp(path.join(repo, 'src/content/research/english-backfill.json'), manifestPath)
  await cp(path.join(repo, 'src/content/research/english-catalog.json'), catalogPath)
  await cp(path.join(repo, 'src/content/research/english-highlights.json'), highlightsPath)
  await cp(path.join(repo, 'src/content/research/english-articles'), articlesDir, { recursive: true })
  await cp(path.join(repo, 'scripts/research/fixtures/english-backfill-pilot'), packagesDir, { recursive: true })

  const result = spawnSync(process.execPath, [
    path.join(repo, 'scripts/research/import-english-backfill.mjs'),
    '--packages', packagesDir,
    '--articles-dir', articlesDir,
    '--manifest-path', manifestPath,
    '--archive-path', path.join(temp, 'english-substack.json'),
    '--catalog-path', catalogPath,
    '--highlights-path', highlightsPath,
    '--report-path', path.join(temp, 'report.json'),
  ], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr || result.stdout)

  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
  assert.ok(catalog.some((entry) => entry.slug === 'en-backfill-fixture-sample'))
  const article = JSON.parse(await readFile(path.join(articlesDir, 'en-backfill-fixture-sample.json'), 'utf8'))
  assert.equal(article.ingestSource, BACKFILL_INGEST_SOURCE)
  const markdown = englishArticleMarkdown(article)
  assert.ok(markdown.includes('Unique Research (FFCAP English library)'))
  assert.ok(markdown.includes(article.cnSourceUrl))

  const merged = await rebuildEnglishCatalog({
    archivePath: path.join(temp, 'english-substack.json'),
    manifestPath,
    articlesDir,
    catalogPath,
    highlightsPath,
  })
  assert.ok(merged.backfillCount >= 1)
  await rm(temp, { recursive: true, force: true })
})

test('weekly substack catalog entries still require Substack archive identity', async () => {
  const archive = JSON.parse(await readFile(path.join(repo, 'src/content/research/english-substack.json'), 'utf8'))
  const catalog = JSON.parse(await readFile(path.join(repo, 'src/content/research/english-catalog.json'), 'utf8'))
  const archivedUrls = new Set(archive.articles.map((article) => article.url))
  for (const entry of catalog) {
    if (entry.slug === 'en-backfill-fixture-sample') continue
    assert.equal(new URL(entry.sourceUrl).origin, 'https://uniqueresearch.substack.com')
    assert.ok(archivedUrls.has(entry.sourceUrl), entry.sourceUrl)
  }
})
