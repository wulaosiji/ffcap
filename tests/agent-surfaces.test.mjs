import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { AGENT_PROMPT_TEXT } from '../src/content/home-agent-kit.mjs'
import { AGENT_READ_ORDER, AGENT_SITEMAP_PATHS, AGENT_SURFACES, homeAgentLinks } from '../src/content/agent-surfaces.mjs'
import { homeLlmsDataPoints } from '../src/content/home-llms-points.mjs'
import { articleMarkdownLinkHeader, markdownAliasRewrite } from '../src/lib/agent-markdown-routes.mjs'
import { buildLlmsFull, buildLlmsTxt } from '../src/lib/llms-documents.mjs'

const REQUIRED_PATHS = [
  '/for-ai',
  '/llms.txt',
  '/llms-full.txt',
  '/for-models',
  '/research/index.json',
  '/research/latest.md',
  '/research/rss.xml',
  '/sitemap.xml',
  '/robots.txt',
]

test('agent surfaces list every machine URL with a purpose', () => {
  assert.deepEqual(AGENT_SURFACES.map(item => item.path), REQUIRED_PATHS)
  assert.ok(AGENT_SURFACES.every(item => item.purpose.length > 8 && item.label))
  assert.deepEqual(AGENT_READ_ORDER.map(item => item.path), [
    '/for-ai',
    '/llms.txt',
    '/llms-full.txt',
    '/for-models',
    '/research/index.json',
    '/research/latest.md',
  ])
  assert.deepEqual(AGENT_SITEMAP_PATHS, ['/for-ai', '/llms-full.txt'])
  assert.equal(homeAgentLinks()[0].href, '/for-ai')
  assert.ok(AGENT_PROMPT_TEXT.includes('https://ffcap.cn/for-ai'))
  assert.ok(AGENT_PROMPT_TEXT.includes('https://ffcap.cn/llms-full.txt'))
  assert.ok(AGENT_PROMPT_TEXT.includes('/research/{slug}.md'))
})

test('markdown alias rewrites article slugs and keeps latest.md', () => {
  assert.equal(markdownAliasRewrite('/research/20260903a098sq00.md'), '/research/20260903a098sq00/markdown')
  assert.equal(markdownAliasRewrite('/research/latest.md'), null)
  assert.equal(markdownAliasRewrite('/research/index.json'), null)
  assert.equal(markdownAliasRewrite('/research/20260903a098sq00'), null)
  assert.equal(
    markdownAliasRewrite('/en/research/the-tob-veteran-who-fastest-hit-100m.md'),
    '/en/research/the-tob-veteran-who-fastest-hit-100m/markdown',
  )
  assert.equal(markdownAliasRewrite('/research/NOT-A-SLUG.md'), null)
  assert.equal(
    articleMarkdownLinkHeader('/research/20260903a098sq00'),
    '<https://ffcap.cn/research/20260903a098sq00/markdown>; rel="alternate"; type="text/markdown"',
  )
  assert.equal(
    articleMarkdownLinkHeader('/en/research/the-tob-veteran-who-fastest-hit-100m'),
    '<https://ffcap.cn/en/research/the-tob-veteran-who-fastest-hit-100m/markdown>; rel="alternate"; type="text/markdown"',
  )
  assert.equal(articleMarkdownLinkHeader('/research'), null)
  assert.equal(articleMarkdownLinkHeader('/research/latest.md'), null)
  const middleware = fs.readFileSync(new URL('../src/middleware.ts', import.meta.url), 'utf8')
  assert.match(middleware, /articleMarkdownLinkHeader/)
  assert.doesNotMatch(middleware, /markdownAliasRewrite/)
  const nextConfig = fs.readFileSync(new URL('../next.config.js', import.meta.url), 'utf8')
  assert.match(nextConfig, /source: '\/research\/:slug\.md', destination: '\/research\/:slug\/markdown'/)
  assert.match(nextConfig, /source: '\/en\/research\/:slug\.md', destination: '\/en\/research\/:slug\/markdown'/)
  assert.doesNotMatch(nextConfig, /beforeFiles/)
  const articlePage = fs.readFileSync(new URL('../src/app/research/[slug]/page.tsx', import.meta.url), 'utf8')
  const englishPage = fs.readFileSync(new URL('../src/app/en/research/[slug]/page.tsx', import.meta.url), 'utf8')
  assert.match(articlePage, /'text\/markdown':/)
  assert.match(englishPage, /'text\/markdown':/)
})

test('llms.txt points at the hub, llms-full, and the markdown alias', () => {
  const body = buildLlmsTxt({ dataPoints: homeLlmsDataPoints() })
  assert.match(body, /https:\/\/ffcap\.cn\/for-ai/)
  assert.match(body, /https:\/\/ffcap\.cn\/llms-full\.txt/)
  assert.match(body, /\/research\/\{slug\}\.md/)
  assert.match(body, /rel="alternate" type="text\/markdown"/)
  assert.match(body, /HTTP `Link` 头/)
  assert.match(body, /\/events\/cd2026/)
  assert.match(body, /https:\/\/ffcap\.cn\/research\/events-awards/)
  assert.doesNotMatch(body, /https:\/\/ffcap\.cn\/events\)/)
  assert.match(body, /\/open\.html/)
  assert.doesNotMatch(body, /postify\.cc/)
  assert.equal(homeLlmsDataPoints().length, 3)
})

test('llms-full is a bounded context pack and does not embed article bodies', () => {
  const highlights = homeLlmsDataPoints()
  const body = buildLlmsFull({ highlights })
  assert.match(body, /不是全库正文/)
  assert.match(body, /非凡资本（UniqueCapital）是一家以 AI 研究为基础的产业资本与生态机构/)
  assert.match(body, /不代表已核实个人执笔作者/)
  assert.match(body, /https:\/\/ffcap\.cn\/research\/index\.json/)
  assert.match(body, /https:\/\/ffcap\.cn\/for-ai/)
  assert.match(body, /Accept: text\/markdown/)
  for (const point of highlights) assert.match(body, new RegExp(point.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.ok(body.length < 12000, `llms-full is ${body.length} chars`)
  for (const line of body.split('\n')) assert.ok(line.length < 500, line.slice(0, 120))
  assert.doesNotMatch(body, /去年国内出货量30万台/)
  assert.doesNotMatch(body, /sourceSha256|internalSecret|<div/)
})
