import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { firstSubstackImage } from './cover-image.mjs'
import { englishSlugForChinese } from './english-related.mjs'

const researchDir = path.join(path.dirname(fileURLToPath(import.meta.url)))
const articlesDir = path.join(researchDir, 'english-articles')

let listedSlugs = null

function publishedEnglishSlugs() {
  if (listedSlugs) return listedSlugs
  const catalog = JSON.parse(fs.readFileSync(path.join(researchDir, 'english-catalog.json'), 'utf8'))
  listedSlugs = new Set(
    catalog
      .filter(article => article?.contentComplete && article?.sourceAccessFree && article.slug)
      .map(article => article.slug),
  )
  return listedSlugs
}

/** First Substack image of a published English article, or null. */
export function coverForEnglishSlug(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  if (!publishedEnglishSlugs().has(slug)) return null
  const file = path.join(articlesDir, `${slug}.json`)
  let article
  try {
    article = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
  if (article.slug !== slug || !article.contentComplete || !article.sourceAccessFree) return null
  return firstSubstackImage(article.html)
}

/**
 * Chinese articles reuse an English cover only when ENGLISH_RELATED already
 * records that pair. Unmapped articles stay as they are.
 */
export function coverForChineseSlug(slug) {
  const englishSlug = englishSlugForChinese(slug)
  if (!englishSlug) return null
  return coverForEnglishSlug(englishSlug)
}
