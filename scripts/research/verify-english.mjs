import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { isBackfillArticle, isSubstackArticle, SUBSTACK_ORIGIN } from './lib/english-ingest-shared.mjs'

const origin = process.argv[2] || 'http://127.0.0.1:4382'
const option = (name) => {
  const index = process.argv.indexOf(name)
  return index < 0 ? null : process.argv[index + 1]
}
const contentDir = option('--content-dir') || new URL('../../src/content/research/', import.meta.url)
const contentFile = (name) => typeof contentDir === 'string' ? path.join(contentDir, name) : new URL(name, contentDir)
const changed = (option('--changed-slugs') || '').split(',').filter(Boolean)
const catalog = JSON.parse(fs.readFileSync(contentFile('english-catalog.json'), 'utf8'))
async function page(path, expected = 200) {
  const response = await fetch(new URL(path, origin))
  assert.equal(response.status, expected, path)
  return { response, body: await response.text() }
}

const { body: list } = await page('/en/research')
assert.match(list, /<main[^>]*lang="en"/)
assert.match(list, /English research articles/)
assert.ok(list.includes(`<strong>${catalog.length}</strong>`))
assert.equal([...list.matchAll(/<link rel="canonical" href="([^"]+)"/g)].length, 1)
assert.match(list, /https:\/\/ffcap.cn\/en\/research/)
for (const entry of catalog.slice(0, 18)) assert.ok(list.includes(`href="/en/research/${entry.slug}"`), entry.slug)
assert.ok(!list.includes('Read on Substack'))

const sample = catalog.find(article => article.slug === 'selling-ai-toys-in-the-united-states')
assert.ok(sample)
const full = JSON.parse(fs.readFileSync(contentFile(`english-articles/${sample.slug}.json`), 'utf8'))
const { body: articleHtml } = await page(`/en/research/${sample.slug}`)
assert.ok(articleHtml.includes(full.title))
assert.match(articleHtml, /<article[^>]*class="rs-prose"[^>]*lang="en"/)
assert.ok(articleHtml.includes(full.sourceUrl))
assert.ok(articleHtml.includes('datePublished'))
assert.ok(articleHtml.length > full.summary.length + 10000)

const markdown = await page(`/en/research/${sample.slug}/markdown`)
assert.match(markdown.response.headers.get('content-type') || '', /text\/markdown/)
assert.ok(markdown.body.includes(full.title))
assert.ok(markdown.body.includes(full.sourceUrl))
assert.ok(markdown.body.length > full.summary.length + 1000)

const related = await page('/en/research?related=20260903a098sq00')
assert.ok(related.body.includes(`href="/en/research/${sample.slug}"`))
const chinese = await page('/research/20260903a098sq00')
assert.ok(chinese.body.includes(`href="/en/research/${sample.slug}"`))
const unmatched = await page('/en/research?related=20230914a063pr00')
assert.match(unmatched.body, /not yet available here/)
await page('/en/research/there-is-no-such-article', 404)

const sitemap = await page('/sitemap.xml')
assert.ok(sitemap.body.includes(`https://ffcap.cn/en/research/${sample.slug}`))
const llms = await page('/llms.txt')
assert.match(llms.body, /English article archive/)

for (const slug of changed) {
  const entry = catalog.find((item) => item.slug === slug)
  assert.ok(entry, `Missing changed English article in catalog: ${slug}`)
  const article = JSON.parse(fs.readFileSync(contentFile(`english-articles/${slug}.json`), 'utf8'))
  assert.equal(article.slug, slug)
  assert.equal(article.contentComplete, true)
  assert.equal(article.sourceAccessFree, true)
  if (isSubstackArticle(article)) {
    assert.equal(new URL(article.sourceUrl).origin, SUBSTACK_ORIGIN)
  } else if (isBackfillArticle(article)) {
    assert.equal(article.ingestSource, 'unique-research-backfill')
    assert.ok(article.sourceUrl.startsWith('https://ffcap.cn/en/research/'))
  } else {
    assert.fail(`Unknown English ingest source: ${slug}`)
  }
  const articlePath = `/en/research/${slug}`
  const { body: html } = await page(articlePath)
  const { response: markdownResponse, body: markdown } = await page(`${articlePath}/markdown`)
  assert.match(markdownResponse.headers.get('content-type') || '', /text\/markdown/)
  assert.ok(html.includes(article.sourceUrl) && html.includes(article.author) && html.includes(article.publishedAt), slug)
  assert.ok(html.includes(`href="https://ffcap.cn${articlePath}"`), `Missing canonical: ${slug}`)
  assert.ok(markdown.includes(article.title) && markdown.includes(article.sourceUrl) && markdown.includes(article.author), slug)
  assert.ok(markdown.length > article.text.length * 0.5, `Truncated Markdown: ${slug}`)
  assert.ok(sitemap.body.includes(`https://ffcap.cn${articlePath}`), `Missing sitemap entry: ${slug}`)
  const query = encodeURIComponent(article.title.slice(0, 40))
  const { body: result } = await page(`/en/research?q=${query}`)
  assert.ok(result.includes(`href="${articlePath}"`), `Missing English search result: ${slug}`)
  const imageUrls = [...article.html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1].replaceAll('&amp;', '&'))
  assert.equal(imageUrls.length, article.imageCount, `Image count changed: ${slug}`)
  for (const imageUrl of imageUrls) {
    assert.equal(new URL(imageUrl).protocol, 'https:', `Non-HTTPS image: ${slug}`)
    if (isBackfillArticle(article) && imageUrl.startsWith('https://ffcap.cn/')) continue
    const image = await fetch(imageUrl, { headers: { Range: 'bytes=0-127' }, signal: AbortSignal.timeout(15_000) })
    assert.ok(image.ok && (image.headers.get('content-type') || '').startsWith('image/'), `Image unavailable: ${imageUrl}`)
    await image.body?.cancel()
  }
}
console.log(JSON.stringify({ origin, fullArticleCount: catalog.length, changedSlugs: changed, checked: ['internal list links', 'full article', 'Markdown', 'Chinese relationship', 'not found', 'sitemap', 'llms.txt', ...(changed.length ? ['changed article page, metadata, search, source, images'] : [])], passed: true }, null, 2))
