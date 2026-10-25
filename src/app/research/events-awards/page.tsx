import type { Metadata } from 'next'
import Link from 'next/link'
import { LINKS } from '@/content/editorial.mjs'
import { getCuratedEventsAwardsArticles } from '@/content/events-awards-curation.mjs'
import { DIRECTIONS } from '@/content/research/taxonomy.mjs'
import { getResearchCatalog } from '@/lib/research'

export const metadata: Metadata = {
  title: '活动与奖项 · 非凡产研 | 非凡资本',
  description:
    '奖项结果、活动资讯与公开交流相关文章精选；在 ffcap.cn 阅读全文，现场报名与日程以 UniqueBloom 为准。',
  alternates: { canonical: 'https://ffcap.cn/research/events-awards' },
}

export default function ResearchEventsAwardsHubPage() {
  const articles = getCuratedEventsAwardsArticles(getResearchCatalog()) as ReturnType<typeof getResearchCatalog>

  return (
    <main id="main-content" className="ed-container rs-library">
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">UNIQUERESEARCH / EVENTS & AWARDS</p>
          <h1>活动与奖项</h1>
          <p>
            汇集奖项结果披露，以及大会、峰会与开放日等活动资讯。文章在本站阅读；现场报名与日程以 UniqueBloom 为准。
          </p>
          <p>
            <Link href="/research">研究与洞察</Link>
            {' · '}
            <Link href={LINKS.rankingsHub}>数据与榜单</Link>
            {' · '}
            <a href={LINKS.events} target="_blank" rel="noopener noreferrer">UniqueBloom 活动日历 ↗</a>
          </p>
        </div>
        <div className="rs-total">
          <strong>{articles.length}</strong>
          <span>篇活动与奖项相关文章</span>
        </div>
      </div>

      <div className="rs-grid">
        {articles.map(article => (
          <article key={article.id} className="rs-card">
            <div className="rs-meta">
              <span>{DIRECTIONS.find(d => d.id === article.topic)?.name ?? '综合'}</span>
              <span>活动与奖项</span>
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
        活动报名与完整列表请访问
        <a href={LINKS.events} target="_blank" rel="noopener noreferrer"> UniqueBloom ↗</a>
        。站内活动导读页仍保留在
        <Link href="/events"> /events</Link>
        。
      </p>
    </main>
  )
}
