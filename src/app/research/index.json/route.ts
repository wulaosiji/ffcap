import { getResearchCatalog } from '@/lib/research'
import { publicResearchEntry } from '@/lib/research-formats.mjs'
import { CITATION_NOTE } from '@/content/site-identity.mjs'
export const dynamic = 'force-dynamic'
export function GET() {
  const articles = getResearchCatalog().map(publicResearchEntry)
  return Response.json({ version: 1, description: '非凡产研公开文章元数据索引；正文见各条 markdownUrl。主题与标签为站内分类，不代表原文作者判断。', citationNote: CITATION_NOTE, count: articles.length, articles })
}
