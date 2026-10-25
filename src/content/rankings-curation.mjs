/**
 * Curated + discovered data/ranking articles for /research/rankings (数据与榜单).
 * FEATURED_RANKING_SLUGS set display priority; additional matches come from the catalog.
 */
export const FEATURED_RANKING_SLUGS = [
  '20261014a0cmpf00',
  '20261014a0ckus00',
  '20260922a08ehj00',
  '20260918a05hcr00',
  '20260818a09oei00',
  '20260716a064py00',
  '20260522a0beao00',
  '20260415a06nmq00',
  '20260204a05bkd00',
  '20251219a060uq00',
  '20251202a05y0r00',
  '20251125a071i700',
  '20260807a0f17z00',
  '20260622a0ev2l00',
]

const SLUG_ORDER = new Map(FEATURED_RANKING_SLUGS.map((slug, index) => [slug, index]))

const RANKING_TEXT_RE =
  /收入榜|订阅收入|Top\s*100|流量榜|融资榜|百强榜|行业榜|AI\s*100|Global\s*AI\s*100|CHINA\s*AI\s*100|Creators\s*100|出海AI榜|流量榜单|产品流量榜单|上市公司.*榜单|年度榜单|Go Global AI 100/

/** @param {{ title?: string, excerpt?: string, tags?: string[] }} entry */
export function isRankingDataArticle(entry) {
  const title = entry.title || ''
  const hay = `${title} ${entry.excerpt || ''} ${(entry.tags || []).join(' ')}`
  if (RANKING_TEXT_RE.test(hay)) return true
  return /榜/.test(title) && /AI|出海|全球|订阅|流量|融资|文娱|应用|数字化/.test(title)
}

/** @param {ReadonlyArray<Record<string, unknown> & { slug: string, publishedAt: string, sourceIncomplete?: boolean }>} catalog */
export function getCuratedRankingArticles(catalog) {
  const bySlug = new Map(catalog.map(entry => [entry.slug, entry]))
  const featured = FEATURED_RANKING_SLUGS.map(slug => bySlug.get(slug)).filter(Boolean)
  const seen = new Set(featured.map(entry => entry.slug))

  const discovered = catalog
    .filter(
      entry =>
        !seen.has(entry.slug) &&
        !entry.sourceIncomplete &&
        isRankingDataArticle(entry),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))

  return [...featured, ...discovered]
}

/** @deprecated use getCuratedRankingArticles — kept for tests that assert featured prefix */
export function sortFeaturedRankingArticles(articles) {
  return [...articles].sort((a, b) => {
    const order = (SLUG_ORDER.get(a.slug) ?? 999) - (SLUG_ORDER.get(b.slug) ?? 999)
    if (order !== 0) return order
    return b.publishedAt.localeCompare(a.publishedAt)
  })
}
