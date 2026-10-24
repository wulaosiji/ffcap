import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildLatestMarkdown,
  buildResearchRss,
  latestFeedArticles,
  LATEST_FEED_LIMIT,
} from '../src/lib/research-latest-feed.mjs'

const sample = [
  {
    id: 'B',
    slug: 'b',
    title: '第二篇',
    excerpt: '摘要二。',
    publishedAt: '2026-10-10T09:00:00+08:00',
    sourceIncomplete: false,
  },
  {
    id: 'A',
    slug: 'a',
    title: '第一篇',
    excerpt: '摘要一。',
    publishedAt: '2026-10-14T09:00:00+08:00',
    sourceIncomplete: false,
  },
]

test('latest feed sorts by date and skips incomplete sources', () => {
  const mixed = [...sample, { id: 'X', slug: 'x', title: '缺', excerpt: '', publishedAt: '2026-10-20T09:00:00+08:00', sourceIncomplete: true }]
  const picked = latestFeedArticles(mixed, 5)
  assert.equal(picked.length, 2)
  assert.equal(picked[0].slug, 'a')
})

test('latest markdown lists title date link and summary', () => {
  const md = buildLatestMarkdown(latestFeedArticles(sample, LATEST_FEED_LIMIT), 'https://ffcap.cn')
  assert.match(md, /^# 非凡产研最新研究/)
  assert.match(md, /\[第一篇\]\(https:\/\/ffcap\.cn\/research\/a\)/)
  assert.match(md, /\*\*2026-10-14\*\*/)
  assert.match(md, /摘要一/)
  assert.match(md, /https:\/\/ffcap\.cn\/for-ai/)
})

test('rss is valid 2.0 with channel and items', () => {
  const xml = buildResearchRss(latestFeedArticles(sample, 2), 'https://ffcap.cn')
  assert.match(xml, /<rss version="2.0">/)
  assert.match(xml, /<title>第一篇<\/title>/)
  assert.match(xml, /<link>https:\/\/ffcap\.cn\/research\/a<\/link>/)
})
