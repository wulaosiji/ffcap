import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { FEATURED_RANKING_SLUGS, getCuratedRankingArticles } from '../src/content/rankings-curation.mjs'

const catalog = JSON.parse(fs.readFileSync(new URL('../src/content/research/catalog.json', import.meta.url), 'utf8'))

test('curated ranking slugs resolve to catalog entries in display order', () => {
  const curated = getCuratedRankingArticles(catalog)
  assert.equal(curated.length, FEATURED_RANKING_SLUGS.length)
  assert.deepEqual(curated.map(a => a.slug), FEATURED_RANKING_SLUGS)
  for (const slug of FEATURED_RANKING_SLUGS) {
    assert.ok(catalog.some(entry => entry.slug === slug), `missing catalog slug: ${slug}`)
  }
})
