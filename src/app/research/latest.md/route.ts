import { getResearchCatalog } from '@/lib/research'
import { buildLatestMarkdown, latestFeedArticles } from '@/lib/research-latest-feed.mjs'

export const dynamic = 'force-dynamic'

export function GET() {
  const body = buildLatestMarkdown(latestFeedArticles(getResearchCatalog()))
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
  })
}
