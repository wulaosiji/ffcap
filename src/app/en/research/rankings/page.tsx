import type { Metadata } from 'next'
import { EnglishCuratedHub } from '@/components/editorial-home/EnglishCuratedHub'
import { getCuratedEnglishRankingArticles } from '@/content/english-hub-curation.mjs'
import { getEnglishResearchCatalog } from '@/lib/english-research'

export const metadata: Metadata = {
  title: 'Data & Rankings | Unique Research · UniqueCapital',
  description: 'English articles on funding, subscription revenue, traffic, and top-100 rankings. Read them on ffcap.cn.',
  alternates: {
    canonical: 'https://ffcap.cn/en/research/rankings',
    languages: {
      en: 'https://ffcap.cn/en/research/rankings',
      'zh-CN': 'https://ffcap.cn/research/rankings',
    },
  },
}

export default function EnglishRankingsPage() {
  const articles = getCuratedEnglishRankingArticles(getEnglishResearchCatalog())
  return <EnglishCuratedHub kind="rankings" articles={articles} />
}
