import assert from 'node:assert/strict'
import fs from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { primaryNavItems, researchHubPath, researchLanguageCounterpart, researchRouteLang, siteLanguageCounterpart } from '../src/content/editorial.mjs'
import {
  getCuratedEnglishEventsAwardsArticles,
  getCuratedEnglishRankingArticles,
  isEnglishRankingArticle,
} from '../src/content/english-hub-curation.mjs'
import { articleMarkdownLinkHeader } from '../src/lib/agent-markdown-routes.mjs'
import { buildLlmsFull, buildLlmsTxt } from '../src/lib/llms-documents.mjs'

test('research hubs switch as exact language pairs', () => {
  assert.equal(researchHubPath('rankings', 'zh'), '/research/rankings')
  assert.equal(researchHubPath('rankings', 'en'), '/en/research/rankings')
  assert.equal(researchHubPath('events-awards', 'zh'), '/research/events-awards')
  assert.equal(researchHubPath('events-awards', 'en'), '/en/research/events-awards')
  assert.equal(researchLanguageCounterpart('/research/rankings', 'en'), '/en/research/rankings')
  assert.equal(researchLanguageCounterpart('/en/research/rankings', 'zh'), '/research/rankings')
  assert.equal(researchLanguageCounterpart('/research/events-awards/', 'en'), '/en/research/events-awards')
  assert.equal(researchLanguageCounterpart('/en/research/events-awards', 'zh'), '/research/events-awards')
  assert.equal(researchLanguageCounterpart('/en/research/rankings/markdown', 'zh'), '/research/rankings')
  assert.equal(researchLanguageCounterpart('/research', 'en'), '/en/research')
  assert.equal(researchLanguageCounterpart('/en/research', 'zh'), '/research')
  assert.equal(researchLanguageCounterpart('/research/20261014a0cmpf00', 'en'), null)
  assert.equal(researchLanguageCounterpart('/en/research/some-english-slug', 'zh'), null)
  assert.equal(researchRouteLang('/'), 'zh')
  assert.equal(researchRouteLang('/en'), 'en')
  assert.equal(researchRouteLang('/en/'), 'en')
  assert.equal(siteLanguageCounterpart('/', 'en'), '/en')
  assert.equal(siteLanguageCounterpart('/en', 'zh'), '/')
  assert.equal(siteLanguageCounterpart('/en/', 'zh'), '/')
  assert.equal(researchRouteLang('/en/research/rankings'), 'en')
  assert.equal(researchRouteLang('/en/research/events-awards'), 'en')
  assert.equal(researchRouteLang('/research/rankings'), 'zh')
  assert.equal(researchRouteLang('/research/events-awards'), 'zh')
  assert.equal(researchRouteLang('/about'), null)
  assert.equal(researchRouteLang('/products'), 'zh')
  assert.equal(researchRouteLang('/products/uniquebase'), 'zh')
  assert.equal(researchRouteLang('/en/products'), 'en')
  assert.equal(researchRouteLang('/en/products/uniquebase'), 'en')
  assert.equal(siteLanguageCounterpart('/products', 'en'), '/en/products')
  assert.equal(siteLanguageCounterpart('/en/products', 'zh'), '/products')
  assert.equal(siteLanguageCounterpart('/products/uniquebase', 'en'), '/en/products/uniquebase')
  assert.equal(siteLanguageCounterpart('/en/products/uniquebase', 'zh'), '/products/uniquebase')
  assert.equal(siteLanguageCounterpart('/en/products/uniquebase/', 'en'), '/en/products/uniquebase')
})

test('english nav hubs stay on english routes and chinese nav stays put', () => {
  const en = primaryNavItems('en')
  assert.equal(en.find(item => item.label === 'Data & Rankings').href, '/en/research/rankings')
  assert.equal(en.find(item => item.label === 'Events & Awards').href, '/en/research/events-awards')
  assert.equal(en.find(item => item.label === 'Products & Services').href, '/en/products')
  const zh = primaryNavItems('zh')
  assert.equal(zh.find(item => item.label === '数据与榜单').href, '/research/rankings')
  assert.equal(zh.find(item => item.label === '活动与奖项').href, '/research/events-awards')
})

test('curated list pages are not advertised as markdown articles', () => {
  assert.equal(articleMarkdownLinkHeader('/en/research/rankings'), null)
  assert.equal(articleMarkdownLinkHeader('/en/research/events-awards'), null)
  assert.equal(articleMarkdownLinkHeader('/research/rankings'), null)
  assert.equal(
    articleMarkdownLinkHeader('/research/20260903a098sq00'),
    '<https://ffcap.cn/research/20260903a098sq00/markdown>; rel="alternate"; type="text/markdown"',
  )
  assert.equal(
    articleMarkdownLinkHeader('/en/research/the-tob-veteran-who-fastest-hit-100m'),
    '<https://ffcap.cn/en/research/the-tob-veteran-who-fastest-hit-100m/markdown>; rel="alternate"; type="text/markdown"',
  )
})

test('english hub pages are locale-pure and reuse the curated lists', async () => {
  const rankings = await readFile(new URL('../src/app/en/research/rankings/page.tsx', import.meta.url), 'utf8')
  const events = await readFile(new URL('../src/app/en/research/events-awards/page.tsx', import.meta.url), 'utf8')
  const hub = await readFile(new URL('../src/components/editorial-home/EnglishCuratedHub.tsx', import.meta.url), 'utf8')
  const shell = await readFile(new URL('../src/components/editorial-home/EditorialShell.tsx', import.meta.url), 'utf8')
  const chineseRankings = await readFile(new URL('../src/app/research/rankings/page.tsx', import.meta.url), 'utf8')
  const chineseEvents = await readFile(new URL('../src/app/research/events-awards/page.tsx', import.meta.url), 'utf8')
  for (const [name, src] of [['rankings', rankings], ['events', events], ['hub', hub]]) {
    assert.doesNotMatch(src, /[\u3400-\u9fff]/, name)
  }
  assert.match(rankings, /getEnglishResearchCatalog/)
  assert.match(rankings, /getCuratedEnglishRankingArticles/)
  assert.match(events, /getEnglishResearchCatalog/)
  assert.match(events, /getCuratedEnglishEventsAwardsArticles/)
  assert.doesNotMatch(rankings, /@\/lib\/research['"]/)
  assert.doesNotMatch(events, /@\/lib\/research['"]/)
  assert.doesNotMatch(rankings, /rankings-curation/)
  assert.doesNotMatch(events, /events-awards-curation/)
  assert.match(hub, /article\.title/)
  assert.match(hub, /No articles yet/)
  assert.match(hub, /Read article:/)
  assert.match(hub, /Read →/)
  assert.match(hub, /rs-card-read/)
  assert.match(hub, /Data & Rankings/)
  assert.match(hub, /Events & Awards/)
  assert.match(hub, /href=\{`\/en\/research\/\$\{article\.slug\}`\}/)
  assert.doesNotMatch(hub, /href=\{`\/research\/\$\{article\.slug\}`\}/)
  assert.doesNotMatch(hub, /href="\/events"/)
  assert.doesNotMatch(hub, /Titles stay in the language/)
  assert.match(hub, /Unique research/)
  assert.doesNotMatch(hub, /UNIQUE RESEARCH|DATA & RANKINGS|EVENTS & AWARDS/)
  assert.match(hub, /href="\/en\/products\/uniquebase"/)
  assert.match(chineseRankings, /getResearchCatalog/)
  assert.match(chineseRankings, /getCuratedRankingArticles/)
  assert.match(chineseEvents, /getResearchCatalog/)
  assert.match(chineseEvents, /getCuratedEventsAwardsArticles/)
  assert.doesNotMatch(chineseRankings, /getEnglishResearchCatalog/)
  assert.doesNotMatch(chineseEvents, /getEnglishResearchCatalog/)
  assert.match(chineseRankings, /数据与榜单/)
  assert.match(chineseEvents, /活动与奖项/)
  assert.doesNotMatch(chineseRankings, /Data & Rankings/)
  assert.doesNotMatch(chineseEvents, /Events & Awards/)
  assert.doesNotMatch(chineseEvents, /href="\/events"/)
  const hook = await readFile(new URL('../src/hooks/useSwitchSiteLanguage.ts', import.meta.url), 'utf8')
  const toggle = hook.slice(hook.indexOf('const switchLanguage'), hook.indexOf('return { displayed'))
  assert.match(hook, /researchRouteLang\(pathname\) \|\| lang/)
  assert.match(shell, /useSwitchSiteLanguage/)
  assert.match(shell, /<LangToggle/)
  assert.ok(toggle.includes('siteLanguageCounterpart'))
  assert.ok(toggle.indexOf('siteLanguageCounterpart') < toggle.indexOf("startsWith('/en/research/')"))
  assert.ok(toggle.indexOf('siteLanguageCounterpart') < toggle.indexOf("startsWith('/research/')"))
})

test('sitemap and llms documents list the english hubs', async () => {
  const sitemap = await readFile(new URL('../src/app/sitemap.ts', import.meta.url), 'utf8')
  assert.match(sitemap, /https:\/\/ffcap\.cn\/en'/)
  assert.match(sitemap, /https:\/\/ffcap\.cn\/en\/research\/rankings/)
  assert.match(sitemap, /https:\/\/ffcap\.cn\/en\/research\/events-awards/)
  assert.match(sitemap, /https:\/\/ffcap\.cn\/en\/products/)
  assert.match(sitemap, /https:\/\/ffcap\.cn\/en\/products\/\$\{p\.id\}/)
  assert.doesNotMatch(sitemap, /url: 'https:\/\/ffcap\.cn\/events'/)
  const llms = buildLlmsTxt()
  const full = buildLlmsFull()
  assert.match(llms, /https:\/\/ffcap\.cn\/en\/research\/rankings/)
  assert.match(llms, /https:\/\/ffcap\.cn\/en\/research\/events-awards/)
  assert.match(full, /https:\/\/ffcap\.cn\/en\/research\/rankings/)
  assert.match(full, /https:\/\/ffcap\.cn\/en\/research\/events-awards/)
  assert.match(llms, /https:\/\/ffcap\.cn\/research\/events-awards/)
  assert.doesNotMatch(llms, /https:\/\/ffcap\.cn\/events\)/)
  assert.match(llms, /https:\/\/ffcap\.cn\/events\/cd2026/)
})

test('english hubs curate english catalog titles, not the chinese archive', () => {
  const catalog = JSON.parse(fs.readFileSync(new URL('../src/content/research/english-catalog.json', import.meta.url), 'utf8'))
  const rankings = getCuratedEnglishRankingArticles(catalog)
  const events = getCuratedEnglishEventsAwardsArticles(catalog)
  assert.ok(rankings.length > 5)
  assert.ok(events.length > 5)
  assert.ok(rankings.some(article => /Entertainment AI 100/i.test(article.title)))
  assert.ok(rankings.some(article => /Global AI 100/i.test(article.title)))
  assert.ok(rankings.some(article => /CHINA AI 100/i.test(article.title)))
  assert.equal(isEnglishRankingArticle({ title: 'September subscription revenue ranking', summary: '' }), true)
  assert.ok(events.some(article => /Unique Awards/i.test(article.title)))
  assert.ok(events.some(article => /Registration Open|Call for Entries/i.test(article.title)))
  for (const article of [...rankings, ...events]) {
    assert.equal(article.excerpt, catalog.find(entry => entry.slug === article.slug).summary)
    assert.equal(typeof article.title, 'string')
  }
  const chinese = JSON.parse(fs.readFileSync(new URL('../src/content/research/catalog.json', import.meta.url), 'utf8'))
  const chineseSlugs = new Set(chinese.map(entry => entry.slug))
  assert.equal(rankings.some(article => chineseSlugs.has(article.slug) && /[\u3400-\u9fff]/.test(article.title)), false)
})
