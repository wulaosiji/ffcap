import type { Metadata } from 'next'
import { EnglishCuratedHub } from '@/components/editorial-home/EnglishCuratedHub'
import { getCuratedRankingArticles } from '@/content/rankings-curation.mjs'
import { getResearchCatalog } from '@/lib/research'

export const metadata: Metadata = {
  title: 'Data & Rankings | Unique Research · UniqueCapital',
  description: 'Curated funding, revenue, traffic, and top-100 data notes and ranking articles. Read them on ffcap.cn.',
  alternates: {
    canonical: 'https://ffcap.cn/en/research/rankings',
    languages: {
      en: 'https://ffcap.cn/en/research/rankings',
      'zh-CN': 'https://ffcap.cn/research/rankings',
    },
  },
}

export default function EnglishRankingsPage() {
  const articles = getCuratedRankingArticles(getResearchCatalog()) as ReturnType<typeof getResearchCatalog>
  return <EnglishCuratedHub kind="rankings" articles={articles} />
}
