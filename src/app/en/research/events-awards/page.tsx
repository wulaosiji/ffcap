import type { Metadata } from 'next'
import { EnglishCuratedHub } from '@/components/editorial-home/EnglishCuratedHub'
import { getCuratedEnglishEventsAwardsArticles } from '@/content/english-hub-curation.mjs'
import { getEnglishResearchCatalog } from '@/lib/english-research'

export const metadata: Metadata = {
  title: 'Events & Awards | Unique Research · UniqueCapital',
  description: 'English articles on award results, event news, and public conversations. Registration and schedules follow UniqueBloom.',
  alternates: {
    canonical: 'https://ffcap.cn/en/research/events-awards',
    languages: {
      en: 'https://ffcap.cn/en/research/events-awards',
      'zh-CN': 'https://ffcap.cn/research/events-awards',
    },
  },
}

export default function EnglishEventsAwardsPage() {
  const articles = getCuratedEnglishEventsAwardsArticles(getEnglishResearchCatalog())
  return <EnglishCuratedHub kind="events-awards" articles={articles} />
}
