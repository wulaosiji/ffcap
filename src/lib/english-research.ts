import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { cache } from 'react'

export type EnglishResearchEntry = {
  slug: string
  title: string
  summary: string
  publishedAt: string
  sourceUrl: string
  author: string
  contentComplete: boolean
  sourceAccessFree: boolean
  imageCount: number
}

export type EnglishResearchArticle = EnglishResearchEntry & {
  html: string
  text: string
  missingSourceImageCount?: number
  contentSha256?: string
  ingestSource?: 'unique-research-backfill'
  backfillFromCnId?: string
  cnSourceUrl?: string
  relatedCnSlug?: string
}

const contentDir = path.join(process.cwd(), 'src/content/research')
let catalogVersion = -1
let catalogCache: EnglishResearchEntry[] = []

export const getEnglishResearchCatalog = cache((): EnglishResearchEntry[] => {
  const file = path.join(contentDir, 'english-catalog.json')
  const version = fs.statSync(file).mtimeMs
  if (version !== catalogVersion) {
    catalogCache = (JSON.parse(fs.readFileSync(file, 'utf8')) as EnglishResearchEntry[]).filter(article => article.contentComplete && article.sourceAccessFree)
    catalogVersion = version
  }
  return catalogCache
})

export const getEnglishResearchArticle = cache((slug: string): EnglishResearchArticle | null => {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  if (!getEnglishResearchCatalog().some(article => article.slug === slug)) return null
  const file = path.join(contentDir, 'english-articles', `${slug}.json`)
  const article = JSON.parse(fs.readFileSync(file, 'utf8')) as EnglishResearchArticle
  return article.contentComplete && article.sourceAccessFree && article.slug === slug ? article : null
})

export function englishResearchUrl(slug: string) {
  return `/en/research/${slug}`
}

export function englishSlugFromSourceUrl(sourceUrl: string): string | null {
  try {
    const url = new URL(sourceUrl)
    if (url.origin !== 'https://uniqueresearch.substack.com') return null
    const match = /^\/p\/([a-z0-9]+(?:-[a-z0-9]+)*)\/?$/.exec(url.pathname)
    return match?.[1] || null
  } catch {
    return null
  }
}
