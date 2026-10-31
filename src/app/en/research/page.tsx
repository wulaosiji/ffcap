import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleCoverImage } from '@/components/editorial-home/ArticleCover'
import archive from '@/content/research/english-substack.json'
import { coverForEnglishSlug } from '@/content/research/article-cover.mjs'
import { englishResearchUrl, getEnglishResearchArticle, getEnglishResearchCatalog } from '@/lib/english-research'
import { relatedChineseSlugForArticle, relatedEnglishArticle } from '@/content/research/english-related.mjs'
import { ChineseArticleLink } from './SetResearchLanguage'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'English Research Articles | Unique Research · UniqueCapital',
  description: 'Read complete English research articles from Unique Research on UniqueCapital, with clear links to their original publication.',
  alternates: { canonical: 'https://ffcap.cn/en/research' },
}

type Params = Record<string, string | string[] | undefined>
export default function EnglishResearchPage({ searchParams }: { searchParams: Params }) {
  const value = (key: string) => typeof searchParams[key] === 'string' ? (searchParams[key] as string).slice(0, 200) : ''
  const query = value('q').trim()
  const related = value('related').toLowerCase()
  const terms = query.toLocaleLowerCase('en').split(/\s+/).filter(Boolean)
  const catalog = getEnglishResearchCatalog()
  const articles = terms.length ? catalog.filter(article => {
    const searchable = `${article.title} ${article.summary} ${getEnglishResearchArticle(article.slug)?.text || ''}`.toLocaleLowerCase('en')
    return terms.every(term => searchable.includes(term))
  }) : catalog
  const totalPages = Math.max(1, Math.ceil(articles.length / 18))
  const requestedPage = Number.parseInt(value('page'), 10)
  const page = Number.isFinite(requestedPage) ? Math.min(totalPages, Math.max(1, requestedPage)) : 1
  const visible = articles.slice((page - 1) * 18, page * 18)
  const relatedArticle = relatedEnglishArticle(catalog, related)
  const path = (n: number) => `/en/research?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(related ? { related } : {}), page: String(n) })}`

  return (
    <main id="main-content" className="ed-container rs-library ed-secondary ed-topo-quiet" lang="en">
      <section className="rs-intro" id="top" aria-labelledby="research-title">
        <div>
          <p className="ed-eyebrow">UniqueResearch</p>
          <h1 id="research-title">Read the English research articles in full.</h1>
          <p>Each article credits its original Unique Research publication. Newer pieces may appear first on the source archive.</p>
          <p>
            Archive snapshot: {archive.capturedAt.slice(0, 10)}. Visit the{' '}
            <a href={archive.source} target="_blank" rel="noopener noreferrer">original archive ↗</a>
            {' '}for newer additions.
          </p>
        </div>
        <div className="rs-total">
          <strong>{catalog.length}</strong>
          <span>Full articles</span>
        </div>
      </section>

      {related && (
        <div className="rs-media-note">
          {relatedArticle ? (
            <>Related English article: <Link href={englishResearchUrl(relatedArticle.slug)}>{relatedArticle.title} →</Link>. This may be an edited English edition, not a line-by-line translation.</>
          ) : (
            <>A verified full English counterpart for that Chinese article is not yet available here. Browse the English articles below.</>
          )}
        </div>
      )}

      {query && (
        <div className="rs-result-bar">
          <p role="status">{articles.length} matching articles</p>
          <Link href="/en/research">View all English articles</Link>
        </div>
      )}

      {visible.length ? (
        <div className="rs-feed">
          {visible.map(article => {
            const full = getEnglishResearchArticle(article.slug)
            const cnSlug = full ? relatedChineseSlugForArticle(full) : null
            const cover = coverForEnglishSlug(article.slug)
            return (
              <article key={article.slug} className="rs-row" lang="en">
                <Link className="rs-row-link" href={englishResearchUrl(article.slug)}>
                  {cover ? <ArticleCoverImage src={cover} variant="card" /> : null}
                  <div className="rs-row-copy">
                    <div className="rs-meta">
                      <span>Unique research</span>
                      <span>English article</span>
                    </div>
                    <h2>{article.title}</h2>
                    <div className="rs-card-bottom">
                      <time dateTime={article.publishedAt}>
                        {new Date(article.publishedAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}
                      </time>
                    </div>
                  </div>
                </Link>
                {cnSlug ? (
                  <ChineseArticleLink className="rs-translation-link" href={`/research/${cnSlug}`}>
                    Related Chinese article →
                  </ChineseArticleLink>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <div className="rs-empty">
          <h2>No matching articles</h2>
          <p>Try fewer or shorter words.</p>
          <Link href="/en/research">View all English articles →</Link>
        </div>
      )}

      <nav className="rs-pagination" aria-label="Article pages">
        {page > 1 && <Link href={path(page - 1)}>← Previous</Link>}
        <span>{page} / {totalPages}</span>
        {page < totalPages && <Link href={path(page + 1)}>Next →</Link>}
      </nav>

      <p className="rs-source-note">
        These full articles preserve the public original text. Each article identifies its original Substack source and publication date; check the source for later updates.{' '}
        <ChineseArticleLink className="rs-chinese-link" href="/research">Browse the Chinese article archive →</ChineseArticleLink>
      </p>
    </main>
  )
}
