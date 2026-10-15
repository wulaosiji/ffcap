import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { cache } from 'react'

export type ResearchArticle = {
  id: string; slug: string; title: string; author: string; publishedAt: string;
  sourceUrl: string; sourceAuthorUrl: string; excerpt: string; html: string; text: string;
  topic: string; topics: string[]; type: string; tags: string[]; readingMinutes: number;
  imageCount: number; hasVideo: boolean; imageArticle: boolean; sourceIncomplete: boolean; missingImages: string[];
}
export type ResearchEntry = Omit<ResearchArticle, 'html'>
let catalogVersion = -1
let catalogCache: ResearchEntry[] = []
export const getResearchCatalog = cache((): ResearchEntry[] => {
  const file = path.join(process.cwd(), 'src/content/research/catalog.json')
  const version = fs.statSync(file).mtimeMs
  if (version !== catalogVersion) {
    catalogCache = JSON.parse(fs.readFileSync(file, 'utf8'))
    catalogVersion = version
  }
  return catalogCache
})
export const getResearchArticle = cache((slug: string): ResearchArticle | null => {
  if (!/^[a-z0-9]+$/.test(slug) || !getResearchCatalog().some(a => a.slug === slug)) return null
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/content/research/articles', `${slug}.json`), 'utf8'))
})
export function researchUrl(values: Record<string, string | undefined>) {
  const query = new URLSearchParams(Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])))
  return `/research${query.size ? `?${query}` : ''}`
}
