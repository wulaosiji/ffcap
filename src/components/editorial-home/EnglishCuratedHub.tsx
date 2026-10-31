import Link from 'next/link'
import { ArticleCoverImage } from '@/components/editorial-home/ArticleCover'
import { LINKS, researchHubPath, uniqueBaseHref } from '@/content/editorial.mjs'
import { coverForEnglishSlug } from '@/content/research/article-cover.mjs'

const CJK = /[\u3400-\u9fff]/

const TOPIC_EN: Record<string, string> = {
  agentic: 'Agentic AI',
  physical: 'Physical AI',
  entertainment: 'Entertainment AI',
  industry: 'Industry',
}

export type EnglishHubArticle = {
  id: string
  slug: string
  title: string
  excerpt: string
  publishedAt: string
  readingMinutes?: number
  topic?: string
}

function storedLang(text: string) {
  return CJK.test(text || '') ? 'zh-CN' : undefined
}

function formatHubDate(publishedAt: string) {
  const day = publishedAt.slice(0, 10)
  const [year, month, date] = day.split('-').map(Number)
  if (!year || !month || !date) return day
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function topicLabel(topic: string) {
  return TOPIC_EN[topic] || 'General'
}

export function EnglishCuratedHub({
  kind,
  articles,
}: {
  kind: 'rankings' | 'events-awards'
  articles: EnglishHubArticle[]
}) {
  const rankings = kind === 'rankings'
  const countLabel = rankings
    ? (articles.length === 1 ? 'data and ranking article' : 'data and ranking articles')
    : (articles.length === 1 ? 'events and awards article' : 'events and awards articles')
  const badge = rankings ? 'Data & rankings' : 'Events & awards'

  return (
    <main id="main-content" className="ed-container rs-library ed-topo-hub" lang="en">
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">Unique research</p>
          <h1>{rankings ? 'Data & Rankings' : 'Events & Awards'}</h1>
          <p>
            {rankings
              ? 'Funding, subscription revenue, traffic, and top-100 notes, with the English ranking articles that explain them. Read the full pieces on ffcap.cn.'
              : 'Award results, event news, and public conversations in English. Read the articles here; registration and schedules follow UniqueBloom.'}
          </p>
          <p>
            <Link href="/en/research">Research</Link>
            {' · '}
            {rankings ? (
              <Link href={researchHubPath('events-awards', 'en')}>Events & Awards</Link>
            ) : (
              <Link href={researchHubPath('rankings', 'en')}>Data & Rankings</Link>
            )}
            {' · '}
            {rankings ? (
              <>
                <a href={uniqueBaseHref('en')} target="_blank" rel="noopener noreferrer">Query UniqueBase ↗</a>
                {' · '}
                <Link href="/en/products/uniquebase">UniqueBase product</Link>
              </>
            ) : (
              <a href={LINKS.events} target="_blank" rel="noopener noreferrer">UniqueBloom event calendar ↗</a>
            )}
          </p>
        </div>
        <div className="rs-total">
          <strong>{articles.length}</strong>
          <span>{countLabel}</span>
        </div>
      </div>

      {articles.length ? (
        <div className="rs-grid">
          {articles.map(article => {
            const cover = coverForEnglishSlug(article.slug)
            return (
            <article key={article.id} className="rs-card">
              <div className="rs-meta">
                {article.topic ? <span>{topicLabel(article.topic)}</span> : null}
                <span>{badge}</span>
              </div>
              <Link href={`/en/research/${article.slug}`} className="rs-card-link">
                {cover ? <ArticleCoverImage src={cover} variant="card" /> : null}
                <h2 lang={storedLang(article.title)}>{article.title}</h2>
                {article.excerpt ? <p lang={storedLang(article.excerpt)}>{article.excerpt}</p> : null}
              </Link>
              <div className="rs-card-bottom">
                <time dateTime={article.publishedAt}>{formatHubDate(article.publishedAt)}</time>
                {article.readingMinutes ? <span>{article.readingMinutes} min read</span> : null}
                <Link className="rs-card-read" href={`/en/research/${article.slug}`} aria-label={`Read article: ${article.title}`}>Read →</Link>
              </div>
            </article>
            )
          })}
        </div>
      ) : (
        <div className="rs-empty">
          <h2>No articles yet</h2>
          <p>This curated list is empty. Browse the research library instead.</p>
          <Link href="/en/research">Browse English articles →</Link>
        </div>
      )}

      {rankings ? (
        <p className="rs-source-note">
          The legacy static entry rankings.html remains available. This page is the default place to read ranking articles. Company facts are on the
          <Link href="/en/products/uniquebase"> UniqueBase product page</Link>
          .
        </p>
      ) : (
        <p className="rs-source-note">
          For registration and the full calendar, visit
          <a href={LINKS.events} target="_blank" rel="noopener noreferrer"> UniqueBloom ↗</a>
          . The English articles on this page stay on ffcap.cn.
        </p>
      )}
    </main>
  )
}
