import type { Metadata } from 'next'
import { TOPICS } from '@/content/editorial.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { getResearchCatalog } from '@/lib/research'
import { StructuredData } from '@/components/StructuredData'
import { TopicsHubView } from '@/components/editorial-home/LocalePages'

export const metadata: Metadata = {
  title: '研究方向 · 非凡资本',
  description: 'Agentic AI、Physical AI 与 Entertainment AI：站内研究文章与活动导读按方向聚合。',
  alternates: { canonical: `${SITE_URL}/topics` },
}

export default function TopicsHubPage() {
  const catalog = getResearchCatalog()
  const topics = TOPICS.map(topic => ({
    id: topic.id,
    count: catalog.filter(article => !article.sourceIncomplete && article.topics?.includes(topic.id)).length,
  }))

  return (
    <>
      <StructuredData data={breadcrumbs([{ name: '研究方向', url: '/topics' }])} />
      <TopicsHubView topics={topics} />
    </>
  )
}
