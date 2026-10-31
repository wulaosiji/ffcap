import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { LINKS, uniqueBaseHref } from '@/content/editorial.mjs'
import { getCuratedRankingArticles } from '@/content/rankings-curation.mjs'
import { DIRECTIONS } from '@/content/research/taxonomy.mjs'
import { getResearchCatalog } from '@/lib/research'

export const metadata: Metadata = {
  title: '数据与榜单 · 非凡产研 | 非凡资本',
  description: '融资、收入、流量与百强等数据观察与榜单文章精选，站内阅读完整研究与数据解读。',
  alternates: {
    canonical: 'https://ffcap.cn/research/rankings',
    languages: {
      'zh-CN': 'https://ffcap.cn/research/rankings',
      en: 'https://ffcap.cn/en/research/rankings',
    },
  },
}

export default function ResearchRankingsHubPage() {
  const articles = getCuratedRankingArticles(getResearchCatalog()) as ReturnType<typeof getResearchCatalog>

  return (
    <main id="main-content" className="ed-container rs-library">
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">非凡产研</p>
          <h1>数据与榜单</h1>
          <p>融资、订阅收入、流量与百强等数据文章与榜单解读。在 ffcap.cn 阅读全文与引用说明。</p>
          <p>
            <Link href="/research">研究与洞察</Link>
            {' · '}
            <Link href={LINKS.eventsAwardsHub}>活动与奖项</Link>
            {' · '}
            <a href={uniqueBaseHref('zh')} target="_blank" rel="noopener noreferrer">UniqueBase 查库 ↗</a>
            {' · '}
            <Link href="/products/uniquebase">UniqueBase 产品介绍</Link>
          </p>
        </div>
        <div className="rs-total">
          <strong>{articles.length}</strong>
          <span>篇数据与榜单相关文章</span>
        </div>
      </div>

      <div className="rs-grid">
        {articles.map(article => (
          <article key={article.id} className="rs-card">
            <div className="rs-meta">
              <span>{DIRECTIONS.find(d => d.id === article.topic)?.name ?? '综合'}</span>
              <span>数据与榜单</span>
            </div>
            <Link href={`/research/${article.slug}`} className="rs-card-link">
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
            </Link>
            <div className="rs-card-bottom">
              <time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10).replaceAll('-', '.')}</time>
              <span>{article.readingMinutes} 分钟阅读</span>
              <Link href={`/research/${article.slug}`} aria-label={`阅读：${article.title}`}>↗</Link>
            </div>
          </article>
        ))}
      </div>

      <p className="rs-source-note">
        历史静态入口 rankings.html 仍保留，但本站默认从此页进入榜单阅读。公司事实见
        <Link href="/products/uniquebase"> UniqueBase 产品介绍</Link>
        。
      </p>
    </main>
  )
}
