import assert from 'node:assert/strict'
import test from 'node:test'
import { homeLatestAnnouncement } from '../src/content/home-announcement.mjs'
import {
  HOME_SEARCH_TABS,
  homeSearchDestination,
  homeSearchImplicitSubmitNavigates,
  previewArticleMatches,
} from '../src/content/home-hero-search.mjs'
import { readFile } from 'node:fs/promises'
import { formatSectionIndex, HOME_SECTION_TOTAL } from '../src/content/home-sections.mjs'

test('announcement uses highlights first and exposes summary fields', () => {
  const item = homeLatestAnnouncement()
  assert.ok(item)
  assert.match(item.href, /^\/research\/[a-z0-9]+$/)
  assert.ok(item.title.length > 4)
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(item.date))
  assert.ok(item.summary || item.stat)
  assert.ok(['highlights', 'catalog'].includes(item.source))
})

test('implicit Enter submit navigates only on articles tab', () => {
  assert.equal(homeSearchImplicitSubmitNavigates('articles'), true)
  assert.equal(homeSearchImplicitSubmitNavigates('rankings'), false)
  assert.equal(homeSearchImplicitSubmitNavigates('events'), false)
  assert.equal(homeSearchImplicitSubmitNavigates('bp'), false)
})

test('search tabs route to research, rankings, events and BP', () => {
  assert.equal(HOME_SEARCH_TABS.length, 4)
  assert.equal(homeSearchDestination('articles', '办公'), '/research?q=%E5%8A%9E%E5%85%AC')
  assert.equal(homeSearchDestination('rankings', ''), '/research/rankings')
  assert.equal(homeSearchDestination('events', ''), 'https://uniquebloom.cn/')
  assert.equal(homeSearchDestination('bp', ''), 'https://ffcap.cn/bp.html')
})

test('preview search matches index-shaped articles', () => {
  const sample = [
    { slug: 'a', title: '9 月 AI 订阅收入榜', excerpt: 'Top100 合计 61 亿美元', tags: ['榜单'] },
    { slug: 'b', title: '无关标题', excerpt: '其他', tags: [] },
  ]
  const hits = previewArticleMatches(sample, '订阅收入')
  assert.equal(hits.length, 1)
  assert.equal(hits[0].slug, 'a')
})

test('homepage drops decorative section indexes and keeps three direction hubs', async () => {
  assert.equal(formatSectionIndex(1, HOME_SECTION_TOTAL), '[01 / 05]')
  const home = await readFile(new URL('../src/components/editorial-home/EditorialHome.tsx', import.meta.url), 'utf8')
  const faq = await readFile(new URL('../src/components/editorial-home/HomeFaq.tsx', import.meta.url), 'utf8')
  const world = await readFile(new URL('../src/components/editorial-home/WorldTeaser.tsx', import.meta.url), 'utf8')
  const hero = await readFile(new URL('../src/components/editorial-home/ResearchHero.tsx', import.meta.url), 'utf8')
  const highlights = await readFile(new URL('../src/components/editorial-home/ResearchHighlights.tsx', import.meta.url), 'utf8')
  assert.doesNotMatch(home, /SectionIndex|HOME_SECTION_INDEX|\[01 \/ 05\]/)
  assert.doesNotMatch(faq, /SectionIndex|HOME_SECTION_INDEX/)
  assert.doesNotMatch(world, /SectionIndex|HOME_SECTION_INDEX/)
  assert.doesNotMatch(hero, /ed-research-hero__pill|withEmphasis|<em>/)
  assert.doesNotMatch(highlights, /ed-research-dense__index|padStart\(2/)
  assert.match(home, /ed-topic-number/)
})

test('English homepage route reuses the shared home view', async () => {
  const page = await readFile(new URL('../src/app/en/page.tsx', import.meta.url), 'utf8')
  const zh = await readFile(new URL('../src/app/page.tsx', import.meta.url), 'utf8')
  assert.match(page, /HomeView/)
  assert.match(page, /https:\/\/ffcap\.cn\/en/)
  assert.match(zh, /HomeView/)
  assert.match(zh, /https:\/\/ffcap\.cn\/en/)
})
