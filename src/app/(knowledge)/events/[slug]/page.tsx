import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EVENTS, TOPICS } from '@/content/editorial.mjs'
import {
  buildEventArticleBody,
  eventArticlePath,
  EVENT_ARTICLE_SLUGS,
  getEventDirectoryRecord,
  hasEventArticle,
  relatedResearchForEvent,
} from '@/content/event-articles.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { DIRECTIONS } from '@/content/research/taxonomy.mjs'
import { getResearchCatalog } from '@/lib/research'
import { StructuredData } from '@/components/StructuredData'
import { EventArticleView } from '@/components/editorial-home/LocalePages'

export function generateStaticParams() {
  return EVENT_ARTICLE_SLUGS.map(slug => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const record = getEventDirectoryRecord(params.slug)
  if (!record || !hasEventArticle(params.slug)) return { title: '活动未找到 | 非凡资本' }
  return {
    title: `${record.title} | 非凡资本活动`,
    description: record.summary.slice(0, 160),
    alternates: { canonical: `${SITE_URL}${eventArticlePath(params.slug)}` },
    openGraph: {
      type: 'article',
      title: record.title,
      description: record.summary.slice(0, 200),
      url: `${SITE_URL}${eventArticlePath(params.slug)}`,
    },
  }
}

export default function EventArticlePage({ params }: { params: { slug: string } }) {
  const record = getEventDirectoryRecord(params.slug)
  if (!record || !hasEventArticle(params.slug)) notFound()

  const editorial = EVENTS.find(event => event.slug === params.slug)
  const topic = editorial?.topic ?? 'all'
  const topicMeta = TOPICS.find(t => t.id === topic) ?? DIRECTIONS.find(d => d.id === topic)
  const related = relatedResearchForEvent(getResearchCatalog(), { slug: params.slug, topic, tags: record.tags })
  const html = buildEventArticleBody(record)

  const structured = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: record.title,
    startDate: record.date,
    endDate: record.endDate || record.date,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: record.status === 'ended' ? 'https://schema.org/EventScheduled' : 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: record.location,
      address: { '@type': 'PostalAddress', addressLocality: record.city },
    },
    description: record.summary,
    url: `${SITE_URL}${eventArticlePath(params.slug)}`,
    organizer: { '@type': 'Organization', name: '非凡资本', url: SITE_URL },
  }

  return (
    <>
      <StructuredData data={structured} />
      <StructuredData
        data={breadcrumbs([
          { name: '活动文章', url: '/events' },
          { name: record.title, url: eventArticlePath(params.slug) },
        ])}
      />
      <EventArticleView
        event={{
          id: params.slug,
          title: { zh: record.title, en: record.title },
          subtitle: record.subtitle,
          date: record.date,
          city: record.city,
          location: { zh: record.location },
          timeText: record.timeText,
          bloomHref: record.href,
          articleHref: eventArticlePath(params.slug),
        }}
        topicName={topicMeta?.name}
        topicHref={topic !== 'all' ? `/topics/${topic}` : undefined}
        html={html}
        related={related.map(article => ({ slug: article.slug, title: article.title, publishedAt: article.publishedAt }))}
      />
    </>
  )
}
