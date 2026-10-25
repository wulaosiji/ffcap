import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import {
  FEATURED_EVENTS_AWARDS_SLUGS,
  getCuratedEventsAwardsArticles,
} from '../src/content/events-awards-curation.mjs'

const catalog = JSON.parse(fs.readFileSync(new URL('../src/content/research/catalog.json', import.meta.url), 'utf8'))

test('events and awards hub lists featured slugs first with additional matches', () => {
  const curated = getCuratedEventsAwardsArticles(catalog)
  assert.ok(curated.length >= FEATURED_EVENTS_AWARDS_SLUGS.length)
  const prefix = curated.slice(0, FEATURED_EVENTS_AWARDS_SLUGS.length).map(a => a.slug)
  assert.deepEqual(prefix, FEATURED_EVENTS_AWARDS_SLUGS)
})
