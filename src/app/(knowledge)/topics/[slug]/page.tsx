import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EVENTS, TOPICS } from '@/content/editorial.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { getResearchCatalog } from '@/lib/research'
import { StructuredData } from '@/components/StructuredData'
import { TopicDetailView } from '@/components/editorial-home/LocalePages'

export const dynamic = 'force-dynamic'

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const topic = TOPICS.find(item => item.id === params.slug)
  return topic
    ? { title: `${topic.name} | 非凡资本研究方向`, description: topic.description.zh, alternates: { canonical: `${SITE_URL}/topics/${topic.id}` } }
    : { title: '研究方向未找到' }
}

export default function TopicPage({ params }: { params: { slug: string } }) {
  const topic = TOPICS.find(item => item.id === params.slug)
  if (!topic) notFound()
  const articles = getResearchCatalog()
    .filter(article => article.topics.includes(topic.id) && !article.sourceIncomplete)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 12)
    .map(article => ({ slug: article.slug, title: article.title, publishedAt: article.publishedAt }))
  const events = EVENTS.filter(event => event.topic === topic.id && event.articleHref).slice(0, 6)

  return (
    <>
      <StructuredData data={breadcrumbs([{ name: '研究方向', url: '/topics' }, { name: topic.name, url: `/topics/${topic.id}` }])} />
      <TopicDetailView id={topic.id} articles={articles} events={events} />
    </>
  )
}
