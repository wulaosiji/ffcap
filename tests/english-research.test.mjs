import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import { ENGLISH_RELATED, relatedChineseSlug, relatedEnglishArticle } from '../src/content/research/english-related.mjs'
import { englishArticleMarkdown } from '../src/lib/english-research-formats.mjs'

const archive = JSON.parse(fs.readFileSync(new URL('../src/content/research/english-substack.json', import.meta.url), 'utf8'))
const catalog = JSON.parse(fs.readFileSync(new URL('../src/content/research/english-catalog.json', import.meta.url), 'utf8'))
const highlights = JSON.parse(fs.readFileSync(new URL('../src/content/research/english-highlights.json', import.meta.url), 'utf8'))
const chinese = JSON.parse(fs.readFileSync(new URL('../src/content/research/catalog.json', import.meta.url), 'utf8'))
const archivedUrls = new Set(archive.articles.map(article => article.url))

function fullArticle(slug) {
  return JSON.parse(fs.readFileSync(new URL(`../src/content/research/english-articles/${slug}.json`, import.meta.url), 'utf8'))
}

test('the English reading catalog contains only complete public articles from the source archive', () => {
  assert.equal(new Set(archive.articles.map(article => article.url)).size, archive.articles.length)
  assert.ok(catalog.length >= 300)
  assert.ok(catalog.length <= archive.articles.length)
  assert.equal(new Set(catalog.map(article => article.slug)).size, catalog.length)
  assert.deepEqual(highlights.map(article => article.slug), catalog.slice(0, highlights.length).map(article => article.slug))
  for (const entry of catalog) {
    assert.ok(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.slug), entry.slug)
    assert.equal(new URL(entry.sourceUrl).origin, 'https://uniqueresearch.substack.com')
    assert.ok(archivedUrls.has(entry.sourceUrl), entry.sourceUrl)
    assert.ok(entry.contentComplete)
    assert.equal(entry.sourceAccessFree, true, entry.slug)
    assert.ok(Number.isFinite(Date.parse(entry.publishedAt)))
    const article = fullArticle(entry.slug)
    assert.equal(article.slug, entry.slug)
    assert.equal(article.title, entry.title)
    assert.equal(article.publishedAt, entry.publishedAt)
    assert.equal(article.sourceUrl, entry.sourceUrl)
    assert.equal(article.author, entry.author)
    assert.ok(article.contentComplete)
    assert.equal(article.sourceAccessFree, true, entry.slug)
    assert.ok(article.text.trim().length >= 100)
    assert.ok(article.html.trim().length >= 100)
    assert.equal(article.contentSha256, createHash('sha256').update(article.html).digest('hex'), entry.slug)
    assert.ok(!/<(?:script|style|iframe|form|button|input|textarea|select|svg|object|embed|canvas|video|audio)\b/i.test(article.html), entry.slug)
    assert.ok(!/\son[a-z]+\s*=/i.test(article.html), entry.slug)
    assert.ok(!/\b(?:src|href)\s*=\s*["'](?:javascript|data):/i.test(article.html), entry.slug)
    assert.ok(!article.html.includes('/img/missing-image.png'), entry.slug)
  }
})

test('all verified Chinese relationships lead to complete on-site English text', () => {
  assert.equal(Object.keys(ENGLISH_RELATED).length, 5)
  for (const [chineseSlug, url] of Object.entries(ENGLISH_RELATED)) {
    assert.ok(chinese.some(article => article.slug === chineseSlug), chineseSlug)
    const english = relatedEnglishArticle(catalog, chineseSlug)
    assert.equal(english?.sourceUrl, url)
    assert.equal(relatedChineseSlug(url), chineseSlug)
    assert.ok(fullArticle(english.slug).text.length > english.summary.length)
  }
  assert.equal(relatedEnglishArticle(catalog, '20230914a063pr00'), undefined)
  const byteDance = relatedEnglishArticle(catalog, '20250926a084iw00')
  assert.equal(byteDance.publishedAt.slice(0, 10), '2025-09-23')
  assert.notEqual(byteDance.publishedAt.slice(0, 10), chinese.find(article => article.slug === '20250926a084iw00').publishedAt.slice(0, 10))
})

test('English Markdown comes from the same on-site full article and preserves attribution', () => {
  const article = fullArticle('selling-ai-toys-in-the-united-states')
  const markdown = englishArticleMarkdown(article)
  assert.ok(markdown.includes(`title: ${JSON.stringify(article.title)}`))
  assert.ok(markdown.includes(`author: ${JSON.stringify(article.author)}`))
  assert.ok(markdown.includes('sourcePublication: "Unique Research Substack"'))
  assert.ok(!markdown.includes('publicationAccount:'))
  assert.ok(markdown.includes(`originalPublishedAt: ${JSON.stringify(article.publishedAt)}`))
  assert.ok(markdown.includes(article.sourceUrl))
  assert.ok(markdown.includes('language: "en"'))
  assert.ok(markdown.length > article.summary.length + 1000)
  const withMissingImage = englishArticleMarkdown({ ...article, missingSourceImageCount: 1 })
  assert.ok(withMissingImage.includes('images are already unavailable in the public original'))
})
