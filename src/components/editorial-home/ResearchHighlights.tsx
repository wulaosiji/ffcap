'use client'
import Link from 'next/link'
import articles from '@/content/research/highlights.json'
import englishArticles from '@/content/research/english-highlights.json'
import { useLang } from '@/context/LangContext'
import { ARTICLE_TYPES, DIRECTIONS } from '@/content/research/taxonomy.mjs'
function formatDate(iso: string, lang: 'zh' | 'en') {
  if (lang === 'en') {
    return new Date(iso).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })
  }
  return iso.slice(0, 10).replaceAll('-', '.')
}

function dataLine(excerpt: string) {
  const text = (excerpt || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const first = text.split(/[。！？!?]/)[0]?.trim() || text
  return first.length > 88 ? `${first.slice(0, 87)}…` : first
}

function DenseResearchList({
  items,
  lang,
  topic,
  total,
}: {
  items: typeof articles
  lang: 'zh' | 'en'
  topic: string
  total: number
}) {
  const zh = lang === 'zh'
  const listHref = zh ? `/research${topic === 'all' ? '' : `?topic=${topic}`}` : '/en/research'

  return (
    <div className="ed-research-dense">
      <p className="ed-result-count">
        {zh ? '非凡产研 · 研究精选' : 'UNIQUERESEARCH · FEATURED'}
        <span className="ed-research-dense__count">[{String(total).padStart(2, '0')}]</span>
      </p>
      <ol className="ed-research-dense__list">
        {items.map((article, index) => {
          const direction =
            lang === 'en' && article.topic === 'english'
              ? 'UNIQUE RESEARCH · ENGLISH'
              : DIRECTIONS.find(d => d.id === article.topic)?.name || article.topic
          const typeLabel = ARTICLE_TYPES.find(t => t.id === article.type)?.label
          const href = lang === 'zh' ? `/research/${article.slug}` : `/en/research/${article.slug}`
          const line = dataLine(article.excerpt)
          return (
            <li key={article.id} className="ed-research-dense__row">
              <span className="ed-research-dense__index" aria-hidden>
                [{String(index + 1).padStart(2, '0')}/{String(total).padStart(2, '0')}]
              </span>
              <time className="ed-research-dense__date" dateTime={article.publishedAt}>
                {formatDate(article.publishedAt, lang)}
              </time>
              <span className="ed-research-dense__direction">
                {direction}
                {typeLabel && zh ? ` · ${typeLabel}` : ''}
              </span>
              <div className="ed-research-dense__main">
                <Link href={href} className="ed-research-dense__title">
                  <h3>{article.title}</h3>
                </Link>
                {line ? <p className="ed-research-dense__line">{line}</p> : null}
              </div>
              <Link href={href} className="ed-research-dense__arrow" aria-label={zh ? `阅读：${article.title}` : `Read: ${article.title}`}>
                ↗
              </Link>
            </li>
          )
        })}
      </ol>
      <Link className="ed-link" href={listHref}>
        {zh ? '进入完整研究库' : 'Explore all articles'} →
      </Link>
    </div>
  )
}

export function ResearchHighlights({ topic }: { topic: string }) {
  const { lang } = useLang()

  if (lang === 'en') {
    const selected = englishArticles.slice(0, 6)
    const mapped = selected.map(a => ({
      id: a.slug,
      slug: a.slug,
      title: a.title,
      excerpt: a.summary || '',
      topic: 'english',
      type: 'article',
      tags: [] as string[],
      publishedAt: a.publishedAt,
    }))
    return <DenseResearchList items={mapped} lang="en" topic={topic} total={selected.length} />
  }

  const filtered = articles.filter(a => topic === 'all' || a.topic === topic)
  const selected = filtered.slice(0, 6)
  const total = selected.length
  return <DenseResearchList items={selected} lang="zh" topic={topic} total={total} />
}
