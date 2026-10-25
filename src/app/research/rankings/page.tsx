import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { LINKS, uniqueBaseHref } from '@/content/editorial.mjs'
import { getCuratedRankingArticles } from '@/content/rankings-curation.mjs'
import { DIRECTIONS } from '@/content/research/taxonomy.mjs'
import { getResearchCatalog } from '@/lib/research'

export const metadata: Metadata = {
  title: 'AI 榜单与排名文章 · 非凡产研 | 非凡资本',
  description: '非凡产研历史榜单、百强与订阅收入观察文章精选，站内阅读完整研究与数据解读。',
  alternates: { canonical: 'https://ffcap.cn/research/rankings' },
}

export default function ResearchRankingsHubPage() {
  const articles = getCuratedRankingArticles(getResearchCatalog()) as ReturnType<typeof getResearchCatalog>

  return (
    <main id="main-content" className="ed-container rs-library">
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">UNIQUERESEARCH / RANKINGS</p>
          <h1>AI 榜单与排名文章</h1>
          <p>精选站内已发布的榜单、百强与收入观察文章。在 ffcap.cn 阅读全文与引用说明。</p>
          <p>
            <Link href="/research">全部研究文章</Link>
            {' · '}
            <a href={uniqueBaseHref('zh')} target="_blank" rel="noopener noreferrer">UniqueBase 查库 ↗</a>
            {' · '}
            <a href={LINKS.rankingApplication} target="_blank" rel="noopener noreferrer">申报 AI 榜单 ↗</a>
          </p>
        </div>
        <div className="rs-total">
          <strong>{articles.length}</strong>
          <span>篇精选榜单相关文章</span>
        </div>
      </div>

      <div className="rs-grid">
        {articles.map(article => (
          <article key={article.id} className="rs-card">
            <div className="rs-meta">
              <span>{DIRECTIONS.find(d => d.id === article.topic)?.name ?? '综合'}</span>
              <span>榜单精选</span>
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
        需要申报下一期榜单？请使用
        <a href={LINKS.rankingApplication} target="_blank" rel="noopener noreferrer">官方申报表单 ↗</a>
        。历史静态入口 rankings.html 仍保留，但本站默认从此页进入榜单阅读。
      </p>
    </main>
  )
}
