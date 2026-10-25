import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { AGENT_PROMPT_TEXT, AGENT_PROMPT_TEXT_EN } from '../src/content/home-agent-kit.mjs'
import { EVENTS, eventChromeTitle, eventScheduleLine } from '../src/content/editorial.mjs'
import { FAQ_ITEMS, FAQ_ITEMS_EN } from '../src/content/home-faq.mjs'
import { homeLatestAnnouncement, homeLatestEnglishAnnouncement } from '../src/content/home-announcement.mjs'

test('product pages no longer ship a bilingual copy component', () => {
  assert.equal(existsSync(new URL('../src/components/ProductBilingualCopy.tsx', import.meta.url)), false)
})

test('english event titles use a latin subtitle or the public name', () => {
  const night = EVENTS.find(event => event.slug === 'token2026')
  const google = EVENTS.find(event => event.slug === '2026google')
  const beijing = EVENTS.find(event => event.slug === '2026bj')
  const chengdu = EVENTS.find(event => event.slug === 'cd2026')
  assert.equal(night.title.zh, '华语之夜：AI 与 Token 时代的华人出海局')
  assert.equal(night.title.en, 'Chinese Night: AI & Token Era for Chinese Founders Going Global')
  assert.equal(google.title.en, 'Next in AI: Empowering Global Chinese Innovators with Google')
  assert.equal(beijing.title.en, beijing.title.zh)
  assert.equal(chengdu.title.en, chengdu.title.zh)
  for (const event of EVENTS) {
    if (event.title.en !== event.title.zh) {
      assert.doesNotMatch(event.title.en, /[\u3400-\u9fff]/, event.slug)
    }
  }
})

test('english event chrome titles do not fall back to Chinese', () => {
  for (const event of EVENTS) {
    assert.doesNotMatch(eventChromeTitle(event, 'en'), /[\u3400-\u9fff]/, event.slug || event.title.zh)
  }
  const beijing = EVENTS.find(event => event.slug === '2026bj')
  assert.match(eventChromeTitle(beijing, 'zh'), /非凡大赏/)
  assert.match(eventChromeTitle(beijing, 'en'), /Beijing/)
  assert.doesNotMatch(eventChromeTitle(beijing, 'en'), /非凡/)
})

test('english event schedule drops Chinese date words and keeps the venue', () => {
  const beijing = EVENTS.find(event => event.slug === '2026bj')
  const zh = eventScheduleLine(beijing, 'zh')
  const en = eventScheduleLine(beijing, 'en')
  assert.match(zh, /2026年/)
  assert.match(en, /2026-11-20/)
  assert.match(en, /9:30–17:00/)
  assert.match(en, /北京维景国际酒店/)
  assert.doesNotMatch(en, /年|月|日/)
})

test('homepage faq has a separate english set and schema stays chinese', () => {
  assert.equal(FAQ_ITEMS_EN.length, FAQ_ITEMS.length)
  assert.equal(FAQ_ITEMS.length, 6)
  for (const item of FAQ_ITEMS_EN) {
    assert.doesNotMatch(item.question, /[\u3400-\u9fff]/)
    assert.ok(item.answer.length > 40)
  }
  assert.match(FAQ_ITEMS[0].question, /非凡资本/)
})

test('english homepage announcement does not reuse the chinese archive', () => {
  const zh = homeLatestAnnouncement()
  const en = homeLatestEnglishAnnouncement()
  assert.match(zh.href, /^\/research\/[a-z0-9]+$/)
  assert.match(en.href, /^\/en\/research\/[a-z0-9-]+$/)
  assert.doesNotMatch(en.title, /[\u3400-\u9fff]/)
  assert.notEqual(en.href, zh.href)
})

test('english agent prompt is separate from the chinese prompt', () => {
  assert.match(AGENT_PROMPT_TEXT, /请先阅读/)
  assert.match(AGENT_PROMPT_TEXT_EN, /https:\/\/ffcap\.cn\/for-ai/)
  assert.match(AGENT_PROMPT_TEXT_EN, /https:\/\/ffcap\.cn\/en\/research/)
  assert.doesNotMatch(AGENT_PROMPT_TEXT_EN, /请先阅读/)
})

test('home and product chrome render one language at a time', async () => {
  const files = {
    hub: '../src/components/editorial-home/ProductsHub.tsx',
    detail: '../src/components/editorial-home/ProductDetail.tsx',
    home: '../src/components/editorial-home/EditorialHome.tsx',
    hero: '../src/components/editorial-home/ResearchHero.tsx',
    search: '../src/components/editorial-home/ResearchHeroSearch.tsx',
    faq: '../src/components/editorial-home/HomeFaq.tsx',
    world: '../src/components/editorial-home/WorldTeaser.tsx',
    contact: '../src/components/editorial-home/EditorialContact.tsx',
    shell: '../src/components/editorial-home/EditorialShell.tsx',
  }
  const src = Object.fromEntries(await Promise.all(Object.entries(files).map(async ([name, file]) => [
    name,
    await readFile(new URL(file, import.meta.url), 'utf8'),
  ])))
  for (const name of ['hub', 'detail', 'hero', 'search', 'faq', 'world']) {
    assert.match(src[name], /useLang/, name)
  }
  assert.match(src.hub, /productPrimaryHref\(product, lang\)/)
  assert.match(src.hub, /description\[lang\]/)
  assert.doesNotMatch(src.hub, /audience\.en|description\.en|action\.zh/)
  assert.match(src.detail, /productExternalHref\(product, lang\)/)
  assert.match(src.detail, /action\[lang\]/)
  assert.doesNotMatch(src.detail, /action\.zh|action\.en|lang="en"/)
  assert.match(src.home, /研究视角/)
  assert.match(src.home, /与同路人/)
  assert.match(src.home, /为构建者而生/)
  assert.match(src.home, /未来是共同的事业/)
  assert.match(src.home, /eventScheduleLine\(event, lang\)/)
  assert.doesNotMatch(src.home, /ed-eyebrow">OUR PERSPECTIVE/)
  assert.doesNotMatch(src.home, /ed-eyebrow">THE FUTURE IS A COLLECTIVE EFFORT/)
  assert.match(src.hero, /Latest research/)
  assert.match(src.hero, /最新研究/)
  assert.match(src.search, /AGENT_PROMPT_TEXT_EN/)
  assert.match(src.search, /\/en\/research/)
  assert.match(src.faq, /Frequently asked questions/)
  assert.match(src.faq, /查看全部问题/)
  assert.match(src.world, /Enter the cloud settlement/)
  assert.match(src.world, /进入云上的聚落/)
  assert.match(src.contact, /研究 · 榜单 · 数据/)
  assert.match(src.shell, /研究。连接。构建。/)
})
