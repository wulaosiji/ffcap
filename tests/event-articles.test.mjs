import assert from 'node:assert/strict'
import test from 'node:test'
import { EVENTS, TOPICS } from '../src/content/editorial.mjs'
import {
  EVENT_ARTICLE_SLUGS,
  buildEventArticleBody,
  eventArticlePath,
  getEventDirectoryRecord,
  hasEventArticle,
  homeFeaturedEvents,
  listEventArticles,
  relatedResearchForEvent,
} from '../src/content/event-articles.mjs'
import fs from 'node:fs'
const catalog = JSON.parse(fs.readFileSync(new URL('../src/content/research/catalog.json', import.meta.url), 'utf8'))

test('seeded event articles map to on-site paths and UniqueBloom signup', () => {
  assert.equal(EVENT_ARTICLE_SLUGS.length, 6)
  for (const slug of EVENT_ARTICLE_SLUGS) {
    assert.ok(hasEventArticle(slug))
    assert.equal(eventArticlePath(slug), `/events/${slug}`)
    const record = getEventDirectoryRecord(slug)
    assert.ok(record?.href.startsWith('https://uniquebloom.cn/'))
    const editorial = EVENTS.find(event => event.slug === slug)
    assert.equal(editorial?.articleHref, `/events/${slug}`)
    assert.equal(editorial?.bloomHref, record.href)
    assert.equal(editorial?.href, `/events/${slug}`)
  }
})

test('event article HTML is substantive and links to UniqueBloom', () => {
  const record = getEventDirectoryRecord('cd2026')
  const html = buildEventArticleBody(record)
  assert.match(html, /活动概览/)
  assert.match(html, /议题与看点/)
  assert.ok(html.includes(record.href))
  assert.ok(html.length > 400)
})

test('topic hubs use on-site URLs instead of UniqueBloom venue pages', () => {
  for (const topic of TOPICS) {
    assert.equal(topic.href, `/topics/${topic.id}`)
  }
})

test('home featured events prefer flagship and upcoming article slugs', () => {
  const featured = homeFeaturedEvents(EVENTS, 3)
  assert.equal(featured.length, 3)
  assert.ok(featured.every(event => hasEventArticle(event.slug)))
  assert.ok(featured.some(event => event.slug === '2026bj'))
})

test('list and related research helpers stay within catalog', () => {
  const listed = listEventArticles(EVENTS)
  assert.equal(listed.length, EVENT_ARTICLE_SLUGS.length)
  const related = relatedResearchForEvent(catalog, { slug: 'cd2026', topic: 'entertainment' })
  assert.ok(related.length > 0)
  assert.ok(related.every(article => article.slug && article.title))
})
