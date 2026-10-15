import { getResearchArticle } from '@/lib/research'
import { articleMarkdown } from '@/lib/research-formats.mjs'
export const dynamic = 'force-dynamic'
export function GET(_request: Request, { params }: { params: { slug: string } }) {
  const article = getResearchArticle(params.slug)
  if (!article) return new Response('Article not found', { status: 404 })
  return new Response(articleMarkdown(article), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Link': `<https://ffcap.cn/research/${article.slug}>; rel="canonical"` } })
}
