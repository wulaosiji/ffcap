/**
 * Curated on-site ranking articles for /research/rankings (P0).
 * Extend FEATURED_RANKING_SLUGS with catalog slugs; order here is display priority.
 * Noisy auto-tag filters are intentionally avoided for the hub list.
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

/** @param {ReadonlyArray<Record<string, unknown> & { slug: string, publishedAt: string }>} catalog */
export function getCuratedRankingArticles(catalog) {
  const bySlug = new Map(catalog.map(entry => [entry.slug, entry]))
  return FEATURED_RANKING_SLUGS
    .map(slug => bySlug.get(slug))
    .filter(Boolean)
    .sort((a, b) => {
      const order = (SLUG_ORDER.get(a.slug) ?? 0) - (SLUG_ORDER.get(b.slug) ?? 0)
      if (order !== 0) return order
      return b.publishedAt.localeCompare(a.publishedAt)
    })
}
