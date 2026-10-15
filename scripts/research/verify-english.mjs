import assert from 'node:assert/strict'
import fs from 'node:fs'

const origin = process.argv[2] || 'http://127.0.0.1:4382'
const catalog = JSON.parse(fs.readFileSync(new URL('../../src/content/research/english-catalog.json', import.meta.url), 'utf8'))
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
const full = JSON.parse(fs.readFileSync(new URL(`../../src/content/research/english-articles/${sample.slug}.json`, import.meta.url), 'utf8'))
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
console.log(JSON.stringify({ origin, fullArticleCount: catalog.length, checked: ['internal list links', 'full article', 'Markdown', 'Chinese relationship', 'not found', 'sitemap', 'llms.txt'], passed: true }, null, 2))
