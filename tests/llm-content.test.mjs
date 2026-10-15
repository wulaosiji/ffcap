import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { articleMarkdown, publicResearchEntry, articleWarnings } from '../src/lib/research-formats.mjs'
import { organizationGraph, serializeStructuredData, breadcrumbs } from '../src/content/site-identity.mjs'
const sample = JSON.parse(fs.readFileSync(new URL('../src/content/research/articles/20260903a098sq00.json', import.meta.url), 'utf8'))
test('Markdown preserves the archived interview, account, date and source without inventing personal authors', () => {
  const md = articleMarkdown(sample)
  assert.ok(md.includes(sample.sourceUrl))
  assert.ok(md.includes(sample.publishedAt))
  assert.ok(md.includes('publicationAccount: "非凡产研"'))
  for (const name of ['Tim', '叶杰', '刘岱轩', '主持人']) assert.ok(md.includes(name), name)
  assert.ok(!md.includes('dateModified:'))
  assert.ok(md.includes('不代表已核实个人执笔作者'))
})
test('conversion preserves headings, lists, links, images, quotes and both kinds of table', () => {
  const md = articleMarkdown({ ...sample, html: '<h2>段落标题</h2><ul><li>项目一</li></ul><blockquote>引文</blockquote><p><a href="https://example.com/source">出处</a><img src="https://example.com/image.png" alt="原始图表"></p><table><tr><th>公司</th><th>数据</th></tr><tr><td>A</td><td>10</td></tr></table><table><tr><td colspan="2">不可遗漏</td></tr></table><script>alert(1)</script>' })
  for (const part of ['## 段落标题', '项目一', '> 引文', '[出处](https://example.com/source)', '![原始图表](https://example.com/image.png)', '| 公司 | 数据 |', '不可遗漏']) assert.ok(md.includes(part), part)
  assert.ok(!md.includes('alert(1)'))
})
test('public index uses an explicit field allowlist and surfaces source limitations', () => {
  const article = { ...sample, sourceIncomplete: true, imageArticle: true, hasVideo: true, missingImages: ['a'], internalSecret: 'never publish' }
  const entry = publicResearchEntry(article)
  assert.equal(entry.warnings.length, 4)
  assert.ok(!('text' in entry || 'html' in entry || 'internalSecret' in entry))
  for (const warning of articleWarnings(article)) assert.ok(articleMarkdown(article).includes(warning))
})
test('identity links only the company account and structured JSON cannot terminate its script', () => {
  assert.deepEqual(organizationGraph()['@graph'][0].sameAs, ['https://www.linkedin.com/company/uniquecapital'])
  const value = { headline: '</script><script>alert(1)</script>' }
  const serialized = serializeStructuredData(value)
  assert.ok(!serialized.includes('<'))
  assert.deepEqual(JSON.parse(serialized), value)
  assert.equal(breadcrumbs([{ name: '研究', url: '/research' }]).itemListElement[1].item, 'https://ffcap.cn/research')
})
