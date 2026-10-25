import type { Metadata } from 'next'
import { EVENTS, eventStatus } from '@/content/editorial.mjs'
import { EVENT_ARTICLE_SLUGS } from '@/content/event-articles.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'
import { EventsHubView } from '@/components/editorial-home/LocalePages'

export const metadata: Metadata = {
  title: '活动文章 · 非凡资本',
  description: '非凡资本公开活动的站内导读：时间地点、议题看点与相关研究；报名与详情以 UniqueBloom 为准。',
  alternates: { canonical: `${SITE_URL}/events` },
}

export default function EventsHubPage() {
  const now = Date.now()
  const events = EVENT_ARTICLE_SLUGS
    .map(slug => EVENTS.find(event => event.slug === slug))
    .filter((event): event is (typeof EVENTS)[number] => Boolean(event))
    .map(event => ({ ...event, status: eventStatus(event, now) }))

  return (
    <>
      <StructuredData data={breadcrumbs([{ name: '活动文章', url: '/events' }])} />
      <EventsHubView events={events} />
    </>
  )
}
