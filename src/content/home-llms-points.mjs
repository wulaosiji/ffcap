import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TOPICS } from './editorial.mjs'

const highlights = JSON.parse(
  fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'research/highlights.json'), 'utf8'),
)

function researchDataLine(excerpt) {
  const text = (excerpt || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const first = text.split(/[。！？!?]/)[0]?.trim() || text
  return first.length > 80 ? `${first.slice(0, 79)}…` : first
}

/** Top research lines for llms.txt — follows highlights order after weekly classify. */
export function homeLlmsDataPoints() {
  return highlights.slice(0, 3).map(article => ({
    date: article.publishedAt.slice(0, 10),
    direction: TOPICS.find(t => t.id === article.topic)?.name || article.topic,
    title: article.title,
    line: researchDataLine(article.excerpt),
    href: `/research/${article.slug}`,
  }))
}
