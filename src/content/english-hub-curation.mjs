/**
 * English-only curation for /en/research/rankings and /en/research/events-awards.
 * Classifies English catalog rows (title + summary). Chinese hubs keep their own files.
 */
export const FEATURED_RANKING_EN_SLUGS = [
  '74-are-born-global-one-company-makes',
  'src-20260522-01html',
  'src-20251121-01html',
  'global-ai-revenue-rankings-updated',
  '20250120a05u8300',
]

export const FEATURED_EVENTS_AWARDS_EN_SLUGS = [
  'src-20260716-01html',
  'src-20260715-01html',
  '20240618a0ae0d00',
  '20231113a0a2s500',
  '20240723a06ev100',
]

const RANKING_TEXT_RE =
  /subscription revenue|Top\s*100|AI\s*100|Global\s*AI\s*100|Entertainment\s*AI\s*100|CHINA\s*AI\s*100|Creators\s*100|AIGC\s*100|traffic rankings|revenue rankings|traffic report|investment report|funding report|ranking boards?|industry boards|industry rankings|application traffic|product traffic|Go Global AI 100/i

const EVENTS_AWARDS_TEXT_RE =
  /unique awards?|extraordinary awards?|call for entries|registration open|signup open|attendee guide|open day|\bsummit\b|\bconference\b|\bawards?\b|nominat|event recap|concludes successfully/i

/** @param {{ title?: string, summary?: string, excerpt?: string }} entry */
export function isEnglishRankingArticle(entry) {
  return RANKING_TEXT_RE.test(englishHay(entry))
}

/** @param {{ title?: string, summary?: string, excerpt?: string }} entry */
export function isEnglishEventsAwardsArticle(entry) {
  return EVENTS_AWARDS_TEXT_RE.test(englishHay(entry))
}

/** @param {ReadonlyArray<Record<string, unknown> & { slug: string, publishedAt?: string }>} catalog */
export function getCuratedEnglishRankingArticles(catalog) {
  return curate(catalog, FEATURED_RANKING_EN_SLUGS, isEnglishRankingArticle)
}

/** @param {ReadonlyArray<Record<string, unknown> & { slug: string, publishedAt?: string }>} catalog */
export function getCuratedEnglishEventsAwardsArticles(catalog) {
  return curate(catalog, FEATURED_EVENTS_AWARDS_EN_SLUGS, entry => (
    isEnglishEventsAwardsArticle(entry) && !isEnglishRankingOnlyNoise(entry)
  ))
}

function englishHay(entry) {
  return `${entry?.title || ''} ${entry?.summary || entry?.excerpt || ''}`
}

/** Monthly ranking roundups stay on the data hub. */
function isEnglishRankingOnlyNoise(entry) {
  const title = entry?.title || ''
  const rankingish = /top 100|ai 100|traffic rankings|revenue rankings|traffic report|investment report|funding report|ranking boards?|industry boards|industry rankings|application traffic|product traffic/i.test(title)
  const eventish = /unique awards?|extraordinary awards?|summit|conference|open day|call for entries|registration|attendee guide|recap|nominat/i.test(title)
  return rankingish && !eventish
}

function isListed(entry) {
  if (entry.contentComplete === false) return false
  if (entry.sourceAccessFree === false) return false
  return true
}

function curate(catalog, featuredSlugs, predicate) {
  const rows = catalog.filter(isListed)
  const bySlug = new Map(rows.map(entry => [entry.slug, entry]))
  const featured = featuredSlugs.map(slug => bySlug.get(slug)).filter(Boolean)
  const seen = new Set(featured.map(entry => entry.slug))
  const discovered = rows
    .filter(entry => !seen.has(entry.slug) && predicate(entry))
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
  return [...featured, ...discovered].map(toEnglishHubArticle)
}

function toEnglishHubArticle(entry) {
  return {
    id: entry.slug,
    slug: entry.slug,
    title: entry.title || '',
    excerpt: entry.summary || entry.excerpt || '',
    publishedAt: entry.publishedAt || '',
    ...(Number.isFinite(entry.readingMinutes) ? { readingMinutes: entry.readingMinutes } : {}),
    ...(entry.topic ? { topic: entry.topic } : {}),
  }
}
