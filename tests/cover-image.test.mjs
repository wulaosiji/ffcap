import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { coverForChineseSlug, coverForEnglishSlug } from '../src/content/research/article-cover.mjs'
import { firstSubstackImage, substackVariant, withoutLeadingCover } from '../src/content/research/cover-image.mjs'
import { homeLatestAnnouncement, homeLatestEnglishAnnouncement } from '../src/content/home-announcement.mjs'

const SAMPLE = 'https://substackcdn.com/image/fetch/$s_!EPjj!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff4306d51-ea86-4e58-99c7-bdd2fb3cfacc_2730x1536.jpeg'

test('substack width variants stay on the same CDN asset', () => {
  assert.equal(substackVariant(SAMPLE, 640), SAMPLE.replace('w_1456', 'w_640'))
  assert.match(substackVariant(SAMPLE, 960), /w_960/)
  assert.equal(substackVariant('https://example.com/a.jpg', 640), null)
  assert.equal(substackVariant(SAMPLE, 2048), null)
  assert.equal(substackVariant(`${SAMPLE}?x=1`, 640), null)
})

test('leading cover figure is removed once and body text stays', () => {
  const html = `<p>Editor note</p><figure><a href="${SAMPLE}"><img src="${SAMPLE}" alt="cover"></a></figure><p>The argument continues.</p>`
  const cover = firstSubstackImage(html)
  assert.equal(cover, SAMPLE)
  const stripped = withoutLeadingCover(html, cover)
  assert.match(stripped, /Editor note/)
  assert.match(stripped, /The argument continues/)
  assert.doesNotMatch(stripped, /substackcdn/)
  assert.equal(withoutLeadingCover('<p><img src="https://inews.gtimg.com/a.jpg"></p>', SAMPLE), '<p><img src="https://inews.gtimg.com/a.jpg"></p>')
})

test('chinese cards reuse a cover only for a verified english pair', () => {
  assert.equal(coverForChineseSlug('20261014a0cmpf00'), null)
  assert.match(coverForChineseSlug('20260830a09nqd00'), /^https:\/\/substackcdn\.com\/image\/fetch\//)
  assert.match(coverForEnglishSlug('only-45-of-americans-pay-for-ai-these'), /^https:\/\/substackcdn\.com\/image\/fetch\//)
  assert.equal(coverForEnglishSlug('../package'), null)
})

test('home announcements expose a cover only when one already exists', () => {
  const en = homeLatestEnglishAnnouncement()
  const zh = homeLatestAnnouncement()
  assert.match(en.coverSrc, /^https:\/\/substackcdn\.com\/image\/fetch\//)
  assert.equal(substackVariant(en.coverSrc, 640) !== en.coverSrc, true)
  assert.ok(zh.coverSrc === null || zh.coverSrc.startsWith('https://substackcdn.com/image/fetch/'))
})

test('topo chrome stays faint and does not blur covers into the page', async () => {
  const home = await readFile(new URL('../src/app/editorial-home.css', import.meta.url), 'utf8')
  const research = await readFile(new URL('../src/app/research/research.css', import.meta.url), 'utf8')
  assert.match(home, /\/editorial\/topo-contour\.svg/)
  assert.match(home, /\.ed-topo-hub:before\{[^}]*opacity:\.16/)
  assert.match(home, /\.ed-topo-quiet:before\{[^}]*opacity:\.09/)
  assert.match(home, /\.ed-research-hero:before\{[^}]*opacity:\.15/)
  assert.match(research, /\.rs-prose,\.rs-article-header\{background:var\(--ed-paper\)/)
  assert.doesNotMatch(home, /filter:[^;}]*blur/)
  assert.doesNotMatch(research, /filter:[^;}]*blur/)
  assert.doesNotMatch(`${home}\n${research}`, /terracotta|purple|#8b5cf6/i)
})
