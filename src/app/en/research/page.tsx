import type { Metadata } from 'next'
import Link from 'next/link'
import { ArticleCoverImage } from '@/components/editorial-home/ArticleCover'
import archive from '@/content/research/english-substack.json'
import { firstSubstackImage } from '@/content/research/cover-image.mjs'
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
  return <main id="main-content" className="ed-container rs-library ed-topo-hub" lang="en">
    <div className="rs-intro"><div><p className="ed-eyebrow">UniqueResearch</p><h1>English research articles</h1><p>Read the complete English articles here on UniqueCapital. Each article also credits its original publication on Substack.</p><p>Archive snapshot: {archive.capturedAt.slice(0, 10)}. Visit the <a href={archive.source} target="_blank" rel="noopener noreferrer">original archive ↗</a> for newer additions.</p></div><div className="rs-total"><strong>{catalog.length}</strong><span>Full articles</span></div></div>
    {related && <div className="rs-media-note">{relatedArticle ? <>Related English article: <Link href={englishResearchUrl(relatedArticle.slug)}>{relatedArticle.title} →</Link>. This may be an edited English edition, not a line-by-line translation.</> : <>A verified full English counterpart for that Chinese article is not yet available here. Browse the English articles below.</>}</div>}
    <form action="/en/research" method="get" className="rs-search" role="search"><label className="rs-query">Search English articles<input name="q" defaultValue={query} placeholder="Search article text…" maxLength={200}/></label><button type="submit">Search ↗</button></form>
    <div className="rs-result-bar"><p role="status">{query ? `${articles.length} matching articles` : `${articles.length} articles`}</p>{query && <Link href="/en/research">Clear search ×</Link>}<span>Page {page} of {totalPages}</span></div>
    {visible.length ? <div className="rs-grid">{visible.map(article => {
      const full = getEnglishResearchArticle(article.slug)
      const cnSlug = full ? relatedChineseSlugForArticle(full) : null
      const cover = full ? firstSubstackImage(full.html) : null
      return <article key={article.slug} className="rs-card" lang="en"><div className="rs-meta"><span>Unique research</span><span>English article</span></div><Link className="rs-card-link" href={englishResearchUrl(article.slug)}>{cover ? <ArticleCoverImage src={cover} variant="card" /> : null}<h2>{article.title}</h2>{article.summary && <p>{article.summary}</p>}</Link><div className="rs-card-bottom"><time dateTime={article.publishedAt}>{new Date(article.publishedAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })}</time><Link href={englishResearchUrl(article.slug)} aria-label={`Read article: ${article.title}`}>Read article →</Link></div>{cnSlug ? <ChineseArticleLink className="rs-translation-link" href={`/research/${cnSlug}`}>Related Chinese article →</ChineseArticleLink> : null}</article>
    })}</div> : <div className="rs-empty"><h2>No matching articles</h2><p>Try fewer or shorter words.</p><Link href="/en/research">View all English articles →</Link></div>}
    <nav className="rs-pagination" aria-label="Article pages">{page > 1 && <Link href={path(page - 1)}>← Previous</Link>}<span>{page} / {totalPages}</span>{page < totalPages && <Link href={path(page + 1)}>Next →</Link>}</nav>
    <p className="rs-source-note">These full articles preserve the public original text. Each article identifies its original Substack source and publication date; check the source for later updates. <ChineseArticleLink className="rs-chinese-link" href="/research">Browse the Chinese article archive →</ChineseArticleLink></p>
  </main>
}
