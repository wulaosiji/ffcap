// Read-only HTTP verification. Pass a local preview URL or the approved public origin.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { PRODUCTS, TOPICS } from '../../src/content/editorial.mjs'
const origin = process.argv[2] || 'http://127.0.0.1:4381'
const catalog = JSON.parse(fs.readFileSync(new URL('../../src/content/research/catalog.json', import.meta.url), 'utf8'))
const checks = []
async function read(path, status = 200) {
  const response = await fetch(new URL(path, origin))
  assert.equal(response.status, status, path)
  return { response, body: await response.text() }
}
const sample = '/research/20260903a098sq00'
for (const path of ['/', '/about', '/research', '/for-models', '/for-ai', '/products', '/topics', '/research/events-awards', '/events/cd2026', sample, ...PRODUCTS.map(p => `/products/${p.id}`), ...TOPICS.map(t => `/topics/${t.id}`)]) {
  const { body } = await read(path)
  assert.match(body, /<html[^>]+lang="zh-CN"/, path)
  const canonical = [...body.matchAll(/<link rel="canonical" href="([^"]+)"/g)]
  assert.equal(canonical.length, 1, `${path} canonical count`)
  assert.equal(new URL(canonical[0][1]).href, new URL(path, 'https://ffcap.cn').href)
  const json = [...body.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(match => JSON.parse(match[1]))
  assert.ok(json.some(data => data['@graph']?.some(node => node['@type'] === 'Organization')), `${path} organization`)
  if (path === sample) {
    const article = json.find(node => node['@type'] === 'Article')
    assert.equal(article.author.name, '非凡产研')
    assert.equal(article.datePublished, catalog.find(a => a.slug === '20260903a098sq00').publishedAt)
    assert.equal(article.dateModified, undefined)
    assert.ok(json.some(node => node['@type'] === 'BreadcrumbList'))
    assert.match(body, /rel="alternate" type="text\/markdown"/)
  }
  if (path === '/for-ai') assert.match(body, /给 AI 的读取接口/)
  checks.push({ path, status: 200, canonical: canonical[0][1], structuredData: json.length })
}
const { body: indexBody, response: indexResponse } = await read('/research/index.json')
assert.match(indexResponse.headers.get('content-type'), /application\/json/)
const index = JSON.parse(indexBody)
assert.equal(index.count, catalog.length)
assert.equal(index.articles.length, catalog.length)
assert.ok(index.articles.every(a => !('text' in a || 'html' in a)))
const sampleEntries = [index.articles.find(a => a.slug === '20260903a098sq00'), index.articles.find(a => a.warnings.some(w => w.includes('完整正文'))), index.articles.find(a => a.warnings.some(w => w.includes('图片为主')))]
for (const a of sampleEntries) {
  const path = new URL(a.markdownUrl).pathname
  const { body, response } = await read(path)
  assert.match(response.headers.get('content-type'), /text\/markdown; charset=utf-8/)
  assert.equal(response.headers.get('link'), `<${a.url}>; rel="canonical"`)
  assert.ok(body.includes(a.sourceUrl))
  assert.ok(body.includes(a.originalPublishedAt))
  for (const warning of a.warnings) assert.ok(body.includes(warning))
  checks.push({ path, status: 200, warnings: a.warnings.length })
}
for (const path of ['/research/notfound/markdown', '/research/notfound.md', '/products/notfound', '/topics/notfound']) await read(path, 404)
const eventsList = await fetch(new URL('/events', origin), { redirect: 'manual' })
assert.ok([301, 308].includes(eventsList.status), `expected /events redirect, got ${eventsList.status}`)
assert.match(eventsList.headers.get('location') || '', /\/research\/events-awards\/?$/)
const { body: llms } = await read('/llms.txt')
assert.ok(llms.includes('/events/cd2026'))
assert.ok(llms.includes('/open.html'))
assert.ok(llms.includes('/for-ai'))
assert.ok(llms.includes('/llms-full.txt'))
assert.ok(llms.includes('/research/{slug}.md'))
assert.ok(!llms.includes('postify.cc'))
const { body: llmsFull } = await read('/llms-full.txt')
assert.match(llmsFull, /不是全库正文/)
assert.ok(llmsFull.includes('/for-ai') && llmsFull.includes('/research/index.json'))
assert.ok(!llmsFull.includes('去年国内出货量30万台'))
const { response: articlePage } = await read(sample)
assert.match(articlePage.headers.get('link') || '', /<https:\/\/ffcap\.cn\/research\/20260903a098sq00\/markdown>; rel="alternate"; type="text\/markdown"/)
const { response: aliasResponse, body: aliasBody } = await read(`${sample}.md`)
assert.match(aliasResponse.headers.get('content-type') || '', /text\/markdown/)
assert.ok(aliasBody.includes('publicationAccount: "非凡产研"'))
const { response: latestResponse, body: latest } = await read('/research/latest.md')
assert.match(latestResponse.headers.get('content-type') || '', /text\/markdown/)
assert.match(latest, /^# 非凡产研最新研究/)
const { body: robots } = await read('/robots.txt')
assert.ok(robots.includes('Sitemap: https://ffcap.cn/sitemap.xml'))
const { body: sitemap } = await read('/sitemap.xml')
for (const path of ['/for-models', '/for-ai', '/llms-full.txt', ...PRODUCTS.map(p => `/products/${p.id}`), ...TOPICS.map(t => `/topics/${t.id}`)]) assert.ok(sitemap.includes(`https://ffcap.cn${path}`))
assert.ok(!sitemap.includes('<lastmod>'), 'Do not invent update dates from publication dates')
console.log(JSON.stringify({ origin, passed: true, indexCount: index.count, checks, discovery: ['llms.txt', 'robots.txt', 'sitemap.xml'], invalidRoutes: '404' }, null, 2))
