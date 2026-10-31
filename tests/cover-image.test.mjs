import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { coverForChineseSlug, coverForEnglishSlug } from '../src/content/research/article-cover.mjs'
import { coverImageSrc, firstSubstackImage, substackVariant, withoutLeadingCover } from '../src/content/research/cover-image.mjs'
import { homeLatestAnnouncement, homeLatestEnglishAnnouncement } from '../src/content/home-announcement.mjs'

const zhCoverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/editorial/covers/zh')
const enCoverDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public/editorial/covers/en')
const TINY_JPG = Buffer.from('/9j/4AAQSkZJRgABAgAAAQABAAD//gAQTGF2YzYwLjMxLjEwMgD/2wBDAAgEBAQEBAUFBQUFBQYGBgYGBgYGBgYGBgYHBwcICAgHBwcGBgcHCAgICAkJCQgICAgJCQoKCgwMCwsODg4RERT/xABLAAEBAAAAAAAAAAAAAAAAAAAABwEBAAAAAAAAAAAAAAAAAAAAABABAAAAAAAAAAAAAAAAAAAAABEBAAAAAAAAAAAAAAAAAAAAAP/AABEIAAIAAgMBIgACEQADEQD/2gAMAwEAAhEDEQA/AL+AD//Z', 'base64')
const TINY_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAABAAAAAQBPJcTWAAAADklEQVR4nGP4DwYMEAoAU7oL9ZisIGcAAAAASUVORK5CYII=', 'base64')

const SAMPLE = 'https://substackcdn.com/image/fetch/$s_!EPjj!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Ff4306d51-ea86-4e58-99c7-bdd2fb3cfacc_2730x1536.jpeg'

test('substack width variants stay on the same CDN asset', () => {
  assert.equal(substackVariant(SAMPLE, 640), SAMPLE.replace('w_1456', 'w_640'))
  assert.match(substackVariant(SAMPLE, 960), /w_960/)
  assert.equal(substackVariant('https://example.com/a.jpg', 640), null)
  assert.equal(substackVariant(SAMPLE, 2048), null)
  assert.equal(substackVariant(`${SAMPLE}?x=1`, 640), null)
  assert.match(coverImageSrc(SAMPLE, 640), /w_640/)
  assert.equal(coverImageSrc('/editorial/covers/zh/zhcoverlocalfixture.webp', 640), '/editorial/covers/zh/zhcoverlocalfixture.webp')
  assert.equal(coverImageSrc('/editorial/covers/zh/zhcoverjpgfixture.jpg', 640), '/editorial/covers/zh/zhcoverjpgfixture.jpg')
  assert.equal(coverImageSrc('/editorial/covers/zh/zhcoverpngfixture.png', 960), '/editorial/covers/zh/zhcoverpngfixture.png')
  assert.equal(coverImageSrc('/editorial/covers/en/encoverlocalfixture.webp', 640), '/editorial/covers/en/encoverlocalfixture.webp')
  assert.equal(coverImageSrc('/editorial/covers/en/only-45-of-americans-pay-for-ai-these.webp', 960), '/editorial/covers/en/only-45-of-americans-pay-for-ai-these.webp')
  assert.equal(coverImageSrc('/editorial/covers/en/20240318a08dcj00.jpg', 640), '/editorial/covers/en/20240318a08dcj00.jpg')
  assert.equal(coverImageSrc('/editorial/covers/zh/zhcoverjpgfixture.jpeg', 640), null)
  assert.equal(coverImageSrc('/editorial/covers/en/encover.jpg.jpeg', 640), null)
  assert.equal(coverImageSrc('/editorial/covers/zh/../secret.webp', 640), null)
  assert.equal(coverImageSrc('/editorial/covers/en/../secret.webp', 640), null)
  assert.equal(coverImageSrc('https://example.com/a.webp', 640), null)
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

test.describe('chinese cover resolution', { concurrency: 1 }, () => {
  test('chinese cards reuse a cover only for a verified english pair', () => {
    assert.equal(coverForChineseSlug('20261014a0cmpf00'), null)
    assert.match(coverForChineseSlug('20260830a09nqd00'), /^https:\/\/substackcdn\.com\/image\/fetch\//)
    assert.match(coverForEnglishSlug('only-45-of-americans-pay-for-ai-these'), /^https:\/\/substackcdn\.com\/image\/fetch\//)
    assert.equal(coverForEnglishSlug('../package'), null)
    assert.equal(coverForChineseSlug('../package'), null)
  })

  test('a local zh file wins over a related english substack cover', () => {
    const fixture = path.join(zhCoverDir, 'zhcoverlocalfixture.webp')
    assert.equal(fs.statSync(fixture).isFile(), true)
    assert.equal(coverForChineseSlug('zhcoverlocalfixture'), '/editorial/covers/zh/zhcoverlocalfixture.webp')

    const mapped = path.join(zhCoverDir, '20260830a09nqd00.webp')
    const jpgOnly = path.join(zhCoverDir, 'zhcoverjpgfixture.jpg')
    const pngOnly = path.join(zhCoverDir, 'zhcoverpngfixture.png')
    const bothWebp = path.join(zhCoverDir, 'zhcoverbothfixture.webp')
    const bothJpg = path.join(zhCoverDir, 'zhcoverbothfixture.jpg')
    fs.copyFileSync(fixture, mapped)
    fs.writeFileSync(jpgOnly, TINY_JPG)
    fs.writeFileSync(pngOnly, TINY_PNG)
    fs.copyFileSync(fixture, bothWebp)
    fs.writeFileSync(bothJpg, TINY_JPG)
    try {
      assert.equal(coverForChineseSlug('20260830a09nqd00'), '/editorial/covers/zh/20260830a09nqd00.webp')
      assert.equal(coverForChineseSlug('zhcoverjpgfixture'), '/editorial/covers/zh/zhcoverjpgfixture.jpg')
      assert.equal(coverForChineseSlug('zhcoverpngfixture'), '/editorial/covers/zh/zhcoverpngfixture.png')
      assert.equal(coverForChineseSlug('zhcoverbothfixture'), '/editorial/covers/zh/zhcoverbothfixture.webp')
    } finally {
      for (const file of [mapped, jpgOnly, pngOnly, bothWebp, bothJpg]) fs.rmSync(file, { force: true })
    }
    assert.match(coverForChineseSlug('20260830a09nqd00'), /^https:\/\/substackcdn\.com\/image\/fetch\//)
  })
})

test.describe('english cover resolution', { concurrency: 1 }, () => {
  test('english cards reuse a substack cover when no local file exists', () => {
    assert.equal(coverForEnglishSlug('encoverlocalfixture'), '/editorial/covers/en/encoverlocalfixture.webp')
    assert.match(coverForEnglishSlug('only-45-of-americans-pay-for-ai-these'), /^https:\/\/substackcdn\.com\/image\/fetch\//)
    assert.equal(coverForEnglishSlug('20240318a08dcj00'), null)
    assert.equal(coverForEnglishSlug('../package'), null)
    assert.equal(coverForEnglishSlug('en/../secret'), null)
  })

  test('a local en file wins over a substack first image', () => {
    const fixture = path.join(enCoverDir, 'encoverlocalfixture.webp')
    assert.equal(fs.statSync(fixture).isFile(), true)

    const mapped = path.join(enCoverDir, 'only-45-of-americans-pay-for-ai-these.webp')
    const backfill = path.join(enCoverDir, '20240318a08dcj00.webp')
    const jpgOnly = path.join(enCoverDir, 'encoverjpgfixture.jpg')
    const pngOnly = path.join(enCoverDir, 'encoverpngfixture.png')
    const bothWebp = path.join(enCoverDir, 'encoverbothfixture.webp')
    const bothJpg = path.join(enCoverDir, 'encoverbothfixture.jpg')
    fs.copyFileSync(fixture, mapped)
    fs.copyFileSync(fixture, backfill)
    fs.writeFileSync(jpgOnly, TINY_JPG)
    fs.writeFileSync(pngOnly, TINY_PNG)
    fs.copyFileSync(fixture, bothWebp)
    fs.writeFileSync(bothJpg, TINY_JPG)
    try {
      assert.equal(
        coverForEnglishSlug('only-45-of-americans-pay-for-ai-these'),
        '/editorial/covers/en/only-45-of-americans-pay-for-ai-these.webp',
      )
      assert.equal(coverForEnglishSlug('20240318a08dcj00'), '/editorial/covers/en/20240318a08dcj00.webp')
      assert.equal(coverForEnglishSlug('encoverjpgfixture'), '/editorial/covers/en/encoverjpgfixture.jpg')
      assert.equal(coverForEnglishSlug('encoverpngfixture'), '/editorial/covers/en/encoverpngfixture.png')
      assert.equal(coverForEnglishSlug('encoverbothfixture'), '/editorial/covers/en/encoverbothfixture.webp')
    } finally {
      for (const file of [mapped, backfill, jpgOnly, pngOnly, bothWebp, bothJpg]) fs.rmSync(file, { force: true })
    }
    assert.match(coverForEnglishSlug('only-45-of-americans-pay-for-ai-these'), /^https:\/\/substackcdn\.com\/image\/fetch\//)
    assert.equal(coverForEnglishSlug('20240318a08dcj00'), null)
  })
})

test('english list and detail resolve covers through coverForEnglishSlug', async () => {
  const list = await readFile(new URL('../src/app/en/research/page.tsx', import.meta.url), 'utf8')
  const detail = await readFile(new URL('../src/app/en/research/[slug]/page.tsx', import.meta.url), 'utf8')
  const hub = await readFile(new URL('../src/components/editorial-home/EnglishCuratedHub.tsx', import.meta.url), 'utf8')
  assert.match(list, /coverForEnglishSlug/)
  assert.match(detail, /coverForEnglishSlug/)
  assert.match(hub, /coverForEnglishSlug/)
  assert.doesNotMatch(list, /firstSubstackImage/)
  assert.match(detail, /withoutLeadingCover/)
})

test('home announcements expose a cover only when one already exists', () => {
  const en = homeLatestEnglishAnnouncement()
  const zh = homeLatestAnnouncement()
  assert.ok(en.coverSrc)
  if (en.coverSrc.startsWith('https://substackcdn.com/image/fetch/')) {
    assert.equal(substackVariant(en.coverSrc, 640) !== en.coverSrc, true)
  } else {
    assert.match(en.coverSrc, /^\/editorial\/covers\/en\/[a-z0-9]+(?:-[a-z0-9]+)*\.(webp|jpg|png)$/)
  }
  assert.ok(
    zh.coverSrc === null ||
    zh.coverSrc.startsWith('https://substackcdn.com/image/fetch/') ||
    /^\/editorial\/covers\/(?:zh\/[a-z0-9]+|en\/[a-z0-9]+(?:-[a-z0-9]+)*)\.(webp|jpg|png)$/.test(zh.coverSrc),
  )
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
