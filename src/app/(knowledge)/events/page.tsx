import type { Metadata } from 'next'
import Link from 'next/link'
import { EVENTS, LINKS, TOPICS, eventStatus } from '@/content/editorial.mjs'
import { EVENT_ARTICLE_SLUGS } from '@/content/event-articles.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'

export const metadata: Metadata = {
  title: '活动文章 · 非凡资本',
  description: '非凡资本公开活动的站内导读：时间地点、议题看点与相关研究；报名与详情以 UniqueBloom 为准。',
  alternates: { canonical: `${SITE_URL}/events` },
}

const statusLabels: Record<string, string> = {
  upcoming: '即将举行',
  live: '正在举行',
  past: '活动档案',
  ended: '活动档案',
}

export default function EventsHubPage() {
  const articles = EVENT_ARTICLE_SLUGS
    .map(slug => EVENTS.find(event => event.slug === slug))
    .filter((event): event is (typeof EVENTS)[number] => Boolean(event))
  const now = Date.now()

  return (
    <main id="main-content" className="ed-container rs-library" lang="zh-CN">
      <StructuredData data={breadcrumbs([{ name: '活动文章', url: '/events' }])} />
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">UNIQUEBLOOM / ON-SITE</p>
          <h1>活动文章</h1>
          <p>把公开活动的时间、地点与议题留在本站，便于阅读与引用；报名与现场信息以 UniqueBloom 为准。</p>
          <p>
            <Link href="/research">研究与洞察</Link>
            {' · '}
            <a href={LINKS.events} target="_blank" rel="noopener noreferrer">UniqueBloom 活动日历 ↗</a>
          </p>
        </div>
        <div className="rs-total">
          <strong>{articles.length}</strong>
          <span>篇活动导读</span>
        </div>
      </div>
      <div className="rs-grid">
        {articles.map(event => {
          const status = eventStatus(event, now)
          const label = statusLabels[status] ?? statusLabels.past
          const topicName = TOPICS.find(t => t.id === event.topic)?.name ?? '活动'
          return (
            <article key={event.id} className="rs-card">
              <div className="rs-meta">
                <span>{topicName}</span>
                <span>{label}</span>
              </div>
              <Link href={event.articleHref!} className="rs-card-link">
                <h2>{event.title.zh}</h2>
                <p>{event.description.zh}</p>
              </Link>
              <div className="rs-card-bottom">
                <time dateTime={event.date}>{event.date.replaceAll('-', '.')}</time>
                <span>{event.location?.zh}</span>
                <Link href={event.articleHref!} aria-label={`阅读：${event.title.zh}`}>↗</Link>
              </div>
              <p>
                <a href={event.bloomHref} target="_blank" rel="noopener noreferrer">
                  报名/详情 ↗
                </a>
              </p>
            </article>
          )
        })}
      </div>
      <p className="rs-source-note">
        完整活动列表与报名：
        <a href={LINKS.events} target="_blank" rel="noopener noreferrer">
          UniqueBloom ↗
        </a>
      </p>
    </main>
  )
}
