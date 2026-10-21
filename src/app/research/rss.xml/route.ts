import { getResearchCatalog } from '@/lib/research'
import { buildResearchRss, latestFeedArticles } from '@/lib/research-latest-feed.mjs'

export const dynamic = 'force-dynamic'

export function GET() {
  const body = buildResearchRss(latestFeedArticles(getResearchCatalog()))
  return new Response(body, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
  })
}
