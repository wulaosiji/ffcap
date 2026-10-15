import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StructuredData } from '@/components/StructuredData'
import { relatedChineseSlug } from '@/content/research/english-related.mjs'
import { breadcrumbs } from '@/content/site-identity.mjs'
import { englishResearchUrl, getEnglishResearchArticle } from '@/lib/english-research'
import { ChineseArticleLink } from '../SetResearchLanguage'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = getEnglishResearchArticle(params.slug)
  if (!article) return { title: 'Article not found | Unique Research' }
  const canonical = `https://ffcap.cn${englishResearchUrl(article.slug)}`
  return {
    title: `${article.title} | Unique Research`,
    description: article.summary,
    authors: [{ name: article.author }],
    alternates: { canonical, types: { 'text/markdown': `${canonical}/markdown` } },
    openGraph: { type: 'article', title: article.title, description: article.summary, publishedTime: article.publishedAt, authors: [article.author], url: canonical },
  }
}

export default function EnglishArticlePage({ params }: { params: { slug: string } }) {
  const article = getEnglishResearchArticle(params.slug)
  if (!article) notFound()
  const relatedChinese = relatedChineseSlug(article.sourceUrl)
  const canonical = `https://ffcap.cn${englishResearchUrl(article.slug)}`
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })
  const readingMinutes = Math.max(1, Math.ceil(article.text.trim().split(/\s+/).length / 220))
  const structured = {
    '@context': 'https://schema.org', '@type': 'Article', inLanguage: 'en',
    url: canonical, headline: article.title, description: article.summary,
    datePublished: article.publishedAt,
    author: { '@type': article.author === 'Unique Research' ? 'Organization' : 'Person', name: article.author },
    publisher: { '@id': 'https://ffcap.cn/#organization' },
    mainEntityOfPage: canonical, isBasedOn: article.sourceUrl,
  }

  return <main id="main-content" className="ed-container rs-detail" lang="en">
    <StructuredData data={structured}/>
    <StructuredData data={breadcrumbs([{ name: 'English research', url: '/en/research' }, { name: article.title, url: englishResearchUrl(article.slug) }])}/>
    <nav className="rs-breadcrumb" aria-label="Breadcrumb"><Link href="/en/research">English research articles</Link><span>/</span><span>Article</span></nav>
    <header className="rs-article-header">
      <p className="ed-eyebrow">UNIQUE RESEARCH / ENGLISH ARTICLE</p>
      <h1>{article.title}</h1>
      <div className="rs-byline">
        <span>By {article.author}</span>
        <time dateTime={article.publishedAt}>{publishedDate}</time>
        <span>{readingMinutes} min read</span>
        <a href={`${englishResearchUrl(article.slug)}/markdown`}>Markdown</a>
        {relatedChinese && <ChineseArticleLink href={`/research/${relatedChinese}`}>Related Chinese article →</ChineseArticleLink>}
      </div>
    </header>
    {article.missingSourceImageCount ? <p className="rs-media-note">Some images are already unavailable in the public original and are omitted here; the readable article text is preserved.</p> : null}
    <article className="rs-prose" lang="en" dangerouslySetInnerHTML={{ __html: article.html }}/>
    <div className="rs-attribution"><p>Originally published by {article.author} on Unique Research Substack on {publishedDate}. This page preserves the public article for reading on UniqueCapital.</p><a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">View the original publication ↗</a></div>
    <Link href="/en/research" className="rs-back">← Back to English research</Link>
  </main>
}
