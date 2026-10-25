/**
 * Events, awards, applications and disclosure articles for /research/events-awards (活动与奖项).
 */
export const FEATURED_EVENTS_AWARDS_SLUGS = [
  '20260716a064py00',
  '20260622a0ev2l00',
  '20260415a06nmq00',
  '20260807a0f17z00',
  '20260915a0az4q00',
  '20260713a09ryc00',
  '20250928a06ev600',
  '20251121a03u3h00',
  '20251121a03u3k00',
]

const SLUG_ORDER = new Map(FEATURED_EVENTS_AWARDS_SLUGS.map((slug, index) => [slug, index]))

const EVENTS_AWARDS_TEXT_RE =
  /申报|非凡奖|奖项|报名｜|报名开启|报名启动|参会指南|活动回顾|圆满落幕|圆满收官|大赏|峰会|大会|开放日|披露|提名开启|申报通道|申报倒计时/

/** @param {{ title?: string, excerpt?: string, tags?: string[] }} entry */
export function isEventsAwardsArticle(entry) {
  const title = entry.title || ''
  const hay = `${title} ${entry.excerpt || ''} ${(entry.tags || []).join(' ')}`
  if (EVENTS_AWARDS_TEXT_RE.test(hay)) return true
  return /非凡大赏|环球非凡大赏/.test(title)
}

/** @param {ReadonlyArray<Record<string, unknown> & { slug: string, publishedAt: string, sourceIncomplete?: boolean }>} catalog */
export function getCuratedEventsAwardsArticles(catalog) {
  const bySlug = new Map(catalog.map(entry => [entry.slug, entry]))
  const featured = FEATURED_EVENTS_AWARDS_SLUGS.map(slug => bySlug.get(slug)).filter(Boolean)
  const seen = new Set(featured.map(entry => entry.slug))

  const discovered = catalog
    .filter(
      entry =>
        !seen.has(entry.slug) &&
        !entry.sourceIncomplete &&
        isEventsAwardsArticle(entry) &&
        !isRankingOnlyNoise(entry),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return [...featured, ...discovered]
}

/** Keep monthly ranking roundups in the data hub, not events hub. */
function isRankingOnlyNoise(entry) {
  return /月.*百强榜|月.*收入榜|月.*流量榜/.test(entry.title || '')
}
