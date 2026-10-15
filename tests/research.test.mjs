import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import { classifyArticle, searchArticles, DIRECTIONS, ARTICLE_TYPES } from '../src/content/research/taxonomy.mjs'
const root = new URL('../src/content/research/', import.meta.url)
const catalog = JSON.parse(fs.readFileSync(new URL('catalog.json', root)))
const report = JSON.parse(fs.readFileSync(new URL('import-report.json', root)))

test('archive accounts for every unique source item and exposes source gaps', () => {
  assert.equal(catalog.length, report.listed)
  assert.equal(new Set(catalog.map(a => a.id)).size, catalog.length)
  assert.equal(report.failures.length, 0)
  assert.deepEqual(catalog.filter(a => a.sourceIncomplete).map(a => a.id), report.sourceIncomplete)
  assert.equal(report.fullContentComplete, false)
  for (const a of catalog) {
    assert.ok(a.title && a.author === '非凡产研' && a.sourceUrl.startsWith('https://'))
    assert.equal(a.slug, a.id.toLowerCase())
    assert.ok(Number.isFinite(Date.parse(a.publishedAt)))
    assert.ok(DIRECTIONS.some(d => d.id === a.topic))
    assert.ok(ARTICLE_TYPES.some(t => t.id === a.type))
    assert.ok(a.tags.length > 0 && a.tags.length <= 8)
    assert.ok(a.sourceIncomplete || a.imageArticle || a.text.length >= 80)
  }
})
test('all article bodies retain images and use only sanitized markup', () => {
  for (const a of catalog) {
    const body = JSON.parse(fs.readFileSync(new URL(`articles/${a.slug}.json`, root)))
    assert.equal(body.id, a.id)
    assert.equal((body.html.match(/<img\b/g) || []).length, body.imageCount)
    assert.doesNotMatch(body.html, /<(script|iframe|object|embed|svg|form)\b|\son\w+\s*=|(?:href|src)="(?:javascript|data):|<!--IMG_/i, a.id)
    if (body.imageArticle) assert.ok(body.imageCount > 0)
  }
})
test('classification distinguishes announcements, reports, funding and research directions', () => {
  assert.equal(classifyArticle({ title: '报名开启｜成都 AI 文娱大会', text: '' }).type, 'event')
  assert.equal(classifyArticle({ title: 'AI 全球收入榜单正式发布', text: '' }).type, 'ranking')
  assert.equal(classifyArticle({ title: '公司完成天使轮融资', text: '' }).type, 'company')
  assert.equal(classifyArticle({ title: '机器人与机器狗的商业化', text: '' }).topic, 'physical')
  assert.equal(classifyArticle({ title: 'AI 视频生成与短剧', text: '' }).topic, 'entertainment')
  assert.equal(classifyArticle({ title: '企业 AI Agent 工作流', text: '' }).topic, 'agentic')
  assert.equal(classifyArticle({ title: '客户体验管理', text: '' }).topic, 'industry')
})
test('full-text search combines filters, handles normalization and leaves data unchanged', () => {
  const snapshot = catalog.map(a => a.id).join(',')
  const result = searchArticles(catalog, { q: ' ＡＩ ', topic: 'physical', year: '2026', tag: '智能硬件' })
  assert.ok(result.length > 0)
  assert.ok(result.every(a => a.topics.includes('physical') && a.publishedAt.startsWith('2026') && a.tags.includes('智能硬件')))
  assert.equal(searchArticles(catalog, { q: '不存在的检索词zzx987654' }).length, 0)
  const a = catalog.find(a => a.id === '20260903A098SQ00')
  assert.ok(!a.title.includes('叶杰') && a.text.includes('叶杰'))
  assert.ok(searchArticles(catalog, { q: '叶杰' }).some(item => item.id === a.id))
  assert.ok(searchArticles(catalog, { q: '叶杰 不存在zzxx' }).length === 0)
  assert.equal(catalog.map(a => a.id).join(','), snapshot)
  const oldest = searchArticles(catalog, { sort: 'oldest' })
  assert.ok(oldest[0].publishedAt <= oldest.at(-1).publishedAt)
})
test('classifier is deterministic and homepage imports only short public summaries', () => {
  const a = catalog[0]
  assert.deepEqual(classifyArticle(a), classifyArticle(a))
  const highlights = JSON.parse(fs.readFileSync(new URL('highlights.json', root)))
  assert.ok(highlights.length <= 16)
  assert.ok(highlights.every(a => !('text' in a) && !('html' in a) && catalog.some(b => b.id === a.id)))
})
