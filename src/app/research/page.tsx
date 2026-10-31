import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleCoverImage } from '@/components/editorial-home/ArticleCover'
import { coverForChineseSlug } from '@/content/research/article-cover.mjs'
import { DIRECTIONS, ARTICLE_TYPES, searchArticles } from '@/content/research/taxonomy.mjs'
import { getResearchCatalog, researchUrl, type ResearchEntry } from '@/lib/research'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '研究与洞察 · 非凡产研 | 非凡资本',
  description: '非凡产研文章库：探索 AI 智能体、物理 AI、文娱 AI 与产业趋势，站内阅读全文。',
  alternates: { canonical: 'https://ffcap.cn/research' },
}

type Params = Record<string, string | string[] | undefined>

export default function ResearchPage({ searchParams }: { searchParams: Params }) {
  const value = (key: string) => typeof searchParams[key] === 'string' ? (searchParams[key] as string).slice(0, 200) : ''
  const catalog = getResearchCatalog()
  const q = value('q')
  const topic = value('topic')
  const type = value('type')
  const tag = value('tag')
  const year = value('year')
  const sort = value('sort') === 'oldest' ? 'oldest' : 'newest'
  const filters = { q, topic, type, tag, year, sort }
  const matches = searchArticles(catalog, filters) as ResearchEntry[]
  const totalPages = Math.max(1, Math.ceil(matches.length / 18))
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(value('page'), 10) || 1))
  const articles = matches.slice((page - 1) * 18, page * 18)
  const active = Boolean(q || topic || type || tag || year)
  const topicName = DIRECTIONS.find(direction => direction.id === topic)?.name

  return (
    <main id="main-content" className="ed-container rs-library ed-secondary ed-topo-quiet">
      <section className="rs-intro" id="top" aria-labelledby="research-title">
        <div>
          <p className="ed-eyebrow">非凡产研</p>
          <h1 id="research-title">把分散的行业信号，放回同一张图景。</h1>
          <p>非凡产研公开文章库。按发表时间阅读全文，原文出处仍保留在每篇文章里。</p>
          <p>
            <Link href="/for-ai">给 AI</Link>
            {' · '}
            <Link href="/for-models">引用说明</Link>
            {' · '}
            <a href="/research/index.json">公开文章索引 JSON</a>
          </p>
        </div>
        <div className="rs-total">
          <strong>{catalog.length.toLocaleString('zh-CN')}</strong>
          <span>篇文章</span>
        </div>
      </section>

      {active && (
        <div className="rs-result-bar">
          <p role="status">
            找到 {matches.length} 篇文章
            {topicName ? ` · ${topicName}` : ''}
            {tag ? ` · ${tag}` : ''}
            {q ? ` · “${q}”` : ''}
          </p>
          <Link href="/research">查看全部文章</Link>
        </div>
      )}

      {articles.length ? (
        <div className="rs-feed">
          {articles.map(article => {
            const cover = coverForChineseSlug(article.slug)
            return (
              <article key={article.id} className="rs-row">
                <Link href={`/research/${article.slug}`} className="rs-row-link">
                  {cover ? <ArticleCoverImage src={cover} variant="card" /> : null}
                  <div className="rs-row-copy">
                    <div className="rs-meta">
                      <span>{DIRECTIONS.find(direction => direction.id === article.topic)?.name}</span>
                      <span>{ARTICLE_TYPES.find(item => item.id === article.type)?.label}</span>
                    </div>
                    <h2>{article.title}</h2>
                    <div className="rs-card-bottom">
                      <time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10).replaceAll('-', '.')}</time>
                      <span>{article.readingMinutes} 分钟阅读</span>
                    </div>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rs-empty">
          <h2>暂未找到匹配文章</h2>
          <p>试试更短的关键词，或从全部文章重新看起。</p>
          <Link href="/research">查看全部文章 ↗</Link>
        </div>
      )}

      <nav className="rs-pagination" aria-label="文章分页">
        {page > 1 && <Link href={researchUrl({ ...filters, page: String(page - 1) })}>← 上一页</Link>}
        <span>{page} / {totalPages}</span>
        {page < totalPages && <Link href={researchUrl({ ...filters, page: String(page + 1) })}>下一页 →</Link>}
      </nav>

      <p className="rs-source-note">
        本文库收录非凡产研腾讯新闻账号公开文章，保留原文内容、署名和发布时间。历史活动与数据以原文日期为准。
        <a href="https://news.qq.com/omn/author/21759984" target="_blank" rel="noopener noreferrer">查看来源 ↗</a>
      </p>
    </main>
  )
}
