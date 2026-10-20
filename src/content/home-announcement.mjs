import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const researchDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'research')

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(researchDir, name), 'utf8'))
}

function announcementKeyStat(title, excerpt) {
  const hay = `${title} ${excerpt || ''}`
  const match =
    hay.match(/\d+(?:\.\d+)?\s*亿(?:美元)?(?:\s*\/\s*月)?/) ||
    hay.match(/\d+\s*起/) ||
    hay.match(/\d+(?:\.\d+)?\s*%/) ||
    hay.match(/\d+\s*万/)
  return match ? match[0].replace(/\s+/g, '') : null
}

function announcementSummary(excerpt) {
  const text = (excerpt || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const first = text.split(/[。！？!?]/)[0]?.trim() || text
  return first.length > 72 ? `${first.slice(0, 71)}…` : first
}

/** SSR announcement — highlights[0], else newest catalog entry by publishedAt. */
export function homeLatestAnnouncement() {
  const highlights = readJson('highlights.json')
  const catalog = readJson('catalog.json')
  const latest =
    highlights[0] ||
    catalog.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id))[0]
  if (!latest) return null
  return {
    title: latest.title,
    date: latest.publishedAt.slice(0, 10),
    href: `/research/${latest.slug}`,
    stat: announcementKeyStat(latest.title, latest.excerpt),
    summary: announcementSummary(latest.excerpt),
    source: highlights[0]?.slug === latest.slug ? 'highlights' : 'catalog',
  }
}
