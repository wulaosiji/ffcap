import { getEnglishResearchArticle } from '@/lib/english-research'
import { englishArticleMarkdown } from '@/lib/english-research-formats.mjs'

export const dynamic = 'force-dynamic'

export function GET(_request: Request, { params }: { params: { slug: string } }) {
  const article = getEnglishResearchArticle(params.slug)
  if (!article) return new Response('Article not found', { status: 404 })
  return new Response(englishArticleMarkdown(article), { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'X-Content-Type-Options': 'nosniff', 'Link': `<https://ffcap.cn/en/research/${article.slug}>; rel="canonical"` } })
}
