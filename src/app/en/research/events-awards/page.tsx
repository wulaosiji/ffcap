import type { Metadata } from 'next'
import { EnglishCuratedHub } from '@/components/editorial-home/EnglishCuratedHub'
import { getCuratedEventsAwardsArticles } from '@/content/events-awards-curation.mjs'
import { getResearchCatalog } from '@/lib/research'

export const metadata: Metadata = {
  title: 'Events & Awards | Unique Research · UniqueCapital',
  description: 'Award results, event news, and public conversations. Read the articles on ffcap.cn; registration and schedules follow UniqueBloom.',
  alternates: {
    canonical: 'https://ffcap.cn/en/research/events-awards',
    languages: {
      en: 'https://ffcap.cn/en/research/events-awards',
      'zh-CN': 'https://ffcap.cn/research/events-awards',
    },
  },
}

export default function EnglishEventsAwardsPage() {
  const articles = getCuratedEventsAwardsArticles(getResearchCatalog()) as ReturnType<typeof getResearchCatalog>
  return <EnglishCuratedHub kind="events-awards" articles={articles} />
}
