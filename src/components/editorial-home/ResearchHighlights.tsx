'use client'
import Link from 'next/link'
import articles from '@/content/research/highlights.json'
import englishArticles from '@/content/research/english-highlights.json'
import { useDisplayedLang } from '@/hooks/useSwitchSiteLanguage'
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
}: {
  items: typeof articles
  lang: 'zh' | 'en'
  topic: string
}) {
  const zh = lang === 'zh'
  const listHref = zh ? `/research${topic === 'all' ? '' : `?topic=${topic}`}` : '/en/research'

  return (
    <div className="ed-research-dense">
      <p className="ed-result-count">{zh ? '非凡产研 · 研究精选' : 'UniqueResearch · featured'}</p>
      <ol className="ed-research-dense__list">
        {items.map((article) => {
          const direction =
            lang === 'en' && article.topic === 'english'
              ? 'Unique Research · English'
              : DIRECTIONS.find(d => d.id === article.topic)?.name || article.topic
          const typeLabel = ARTICLE_TYPES.find(t => t.id === article.type)?.label
          const href = lang === 'zh' ? `/research/${article.slug}` : `/en/research/${article.slug}`
          const line = dataLine(article.excerpt)
          return (
            <li key={article.id} className="ed-research-dense__row">
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
        {zh ? '进入研究库' : 'Enter the research library'} →
      </Link>
    </div>
  )
}

export function ResearchHighlights({ topic }: { topic: string }) {
  const lang = useDisplayedLang()

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
    return <DenseResearchList items={mapped} lang="en" topic={topic} />
  }

  const filtered = articles.filter(a => topic === 'all' || a.topic === topic)
  const selected = filtered.slice(0, 6)
  return <DenseResearchList items={selected} lang="zh" topic={topic} />
}
