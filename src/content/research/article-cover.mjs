import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { firstSubstackImage } from './cover-image.mjs'
import { englishSlugForChinese } from './english-related.mjs'

const researchDir = path.join(path.dirname(fileURLToPath(import.meta.url)))
const articlesDir = path.join(researchDir, 'english-articles')
const zhCoverDir = path.join(researchDir, '../../../public/editorial/covers/zh')
const ZH_COVER_EXTS = ['.webp', '.jpg', '.png']

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
 * Local Chinese cover. Primary file is `<slug>.webp`. `.jpg` and `.png` are
 * used only when the earlier extension is missing. Missing files and a missing
 * directory are normal and return null.
 */
function localChineseCoverUrl(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+$/.test(slug)) return null
  for (const ext of ZH_COVER_EXTS) {
    try {
      if (!fs.statSync(path.join(zhCoverDir, `${slug}${ext}`)).isFile()) continue
    } catch {
      continue
    }
    return `/editorial/covers/zh/${slug}${ext}`
  }
  return null
}

/**
 * Chinese cover resolution:
 * 1. `public/editorial/covers/zh/<slug>.webp` (else `.jpg`, else `.png`)
 * 2. related English Substack cover when ENGLISH_RELATED records that pair
 * 3. null
 */
export function coverForChineseSlug(slug) {
  const local = localChineseCoverUrl(slug)
  if (local) return local
  const englishSlug = englishSlugForChinese(slug)
  if (!englishSlug) return null
  return coverForEnglishSlug(englishSlug)
}
