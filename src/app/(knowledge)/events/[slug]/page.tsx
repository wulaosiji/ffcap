import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EVENTS, LINKS, TOPICS } from '@/content/editorial.mjs'
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
    <main id="main-content" className="ed-container rs-detail" lang="zh-CN">
      <StructuredData data={structured} />
      <StructuredData
        data={breadcrumbs([
          { name: '活动文章', url: '/events' },
          { name: record.title, url: eventArticlePath(params.slug) },
        ])}
      />
      <nav className="rs-breadcrumb" aria-label="当前位置">
        <Link href="/events">活动文章</Link>
        <span>/</span>
        {topicMeta && topic !== 'all' ? (
          <Link href={`/topics/${topic}`}>{topicMeta.name}</Link>
        ) : (
          <span>活动</span>
        )}
      </nav>
      <header className="rs-article-header">
        <p className="ed-eyebrow">UNIQUEBLOOM / ON-SITE BRIEF</p>
        <h1>{record.title}</h1>
        <div className="rs-byline">
          <span>{record.city}</span>
          <time dateTime={record.date}>{record.date.replaceAll('-', '.')}</time>
          {record.timeText && <span>{record.timeText}</span>}
          <a href={record.href} target="_blank" rel="noopener noreferrer">UniqueBloom 活动页 ↗</a>
        </div>
        <div className="rs-tags">
          {(record.tags ?? []).map(tag => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </header>
      <article className="rs-prose" lang="zh-CN" dangerouslySetInnerHTML={{ __html: html }} />
      <section className="rs-related">
        <p className="ed-eyebrow">SIGN UP</p>
        <h2>报名与详情</h2>
        <p>
          <a href={record.href} target="_blank" rel="noopener noreferrer" className="ed-link">
            在 UniqueBloom 查看报名与议程 ↗
          </a>
        </p>
        <p className="ed-muted">完整日程、嘉宾与票务以活动页实时信息为准。</p>
      </section>
      {related.length > 0 && (
        <section className="rs-related">
          <p className="ed-eyebrow">RELATED RESEARCH</p>
          <h2>相关研究文章</h2>
          <div>
            {related.map(article => (
              <Link key={article.slug} href={`/research/${article.slug}`}>
                <time>{article.publishedAt.slice(0, 10)}</time>
                <h3>{article.title}</h3>
                <span>阅读全文 ↗</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <p className="ed-muted">
        更多公开活动见{' '}
        <a href={LINKS.events} target="_blank" rel="noopener noreferrer">UniqueBloom 活动日历 ↗</a>
        。
      </p>
      <Link href="/events" className="rs-back">← 返回活动文章列表</Link>
    </main>
  )
}
