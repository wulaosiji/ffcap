import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getResearchArticle, getResearchCatalog, researchUrl } from '@/lib/research'
import { ARTICLE_TYPES, DIRECTIONS } from '@/content/research/taxonomy.mjs'

import { StructuredData } from '@/components/StructuredData'
import { englishResearchUrl, getEnglishResearchCatalog } from '@/lib/english-research'
import { relatedEnglishArticle } from '@/content/research/english-related.mjs'
import { CITATION_NOTE, breadcrumbs } from '@/content/site-identity.mjs'

export const dynamic = 'force-dynamic'
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = getResearchArticle(params.slug)
  if (!article) return { title: '文章未找到 | 非凡产研' }
  return { title: `${article.title} | 非凡产研`, description: article.excerpt, keywords: article.tags, authors: [{ name: article.author }], alternates: { canonical: `https://ffcap.cn/research/${article.slug}`, types: { 'text/markdown': `https://ffcap.cn/research/${article.slug}/markdown` } }, openGraph: { type: 'article', title: article.title, description: article.excerpt, publishedTime: article.publishedAt, authors: [article.author], url: `https://ffcap.cn/research/${article.slug}` } }
}
export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getResearchArticle(params.slug)
  if (!article) notFound()
  const english = relatedEnglishArticle(getEnglishResearchCatalog(), article.slug)
  const related = getResearchCatalog().filter(a => a.id !== article.id).map(a => ({ article: a, score: a.tags.filter(t => article.tags.includes(t)).length + (a.topic === article.topic ? 2 : 0) })).filter(a => a.score > 0).sort((a, b) => b.score - a.score || b.article.publishedAt.localeCompare(a.article.publishedAt)).slice(0, 4)
  const structured = { '@context': 'https://schema.org', '@type': 'Article', inLanguage: 'zh-CN', url: `https://ffcap.cn/research/${article.slug}`, headline: article.title, datePublished: article.publishedAt, author: { '@type': 'Organization', name: article.author, url: article.sourceAuthorUrl }, publisher: { '@id': 'https://ffcap.cn/#organization' }, mainEntityOfPage: `https://ffcap.cn/research/${article.slug}`, isBasedOn: article.sourceUrl, keywords: article.tags.join(', ') }
  return <main id="main-content" className="ed-container rs-detail">
    <StructuredData data={structured}/>
    <StructuredData data={breadcrumbs([{ name: '研究与洞察', url: '/research' }, { name: article.title, url: `/research/${article.slug}` }])}/>
    <nav className="rs-breadcrumb" aria-label="当前位置"><Link href="/research">研究与洞察</Link><span>/</span><Link href={researchUrl({ topic: article.topic })}>{DIRECTIONS.find(d => d.id === article.topic)?.name}</Link></nav>
    <header className="rs-article-header"><p className="ed-eyebrow">{ARTICLE_TYPES.find(t => t.id === article.type)?.label} / 非凡产研</p><h1>{article.title}</h1><div className="rs-byline"><span>发布账号：{article.author}</span><time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10).replaceAll('-', '.')}</time><span>{article.readingMinutes} 分钟阅读</span><a href={`/research/${article.slug}/markdown`}>Markdown</a>{english && <Link href={englishResearchUrl(english.slug)}>站内阅读相关英文文章 →</Link>}<a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">腾讯新闻原文 ↗</a></div><div className="rs-tags">{article.tags.map(tag => <Link key={tag} href={researchUrl({ tag })}>{tag}</Link>)}</div></header>
    {article.hasVideo && <p className="rs-media-note">原文包含视频，可前往<a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">腾讯新闻原文观看 ↗</a>。</p>}
    {article.imageArticle && <p className="rs-media-note">这篇内容以原始图片呈现，可按标题和主题标签检索；图片内文字暂不参与全文搜索。</p>}
    {article.sourceIncomplete && <p className="rs-media-note">原始发布页面目前未提供完整正文。这里保留标题、发布时间、署名及来源链接，待补充原稿。</p>}
    {article.missingImages?.length > 0 && <p className="rs-media-note">部分原始图片缺失，请核对原始发布版本。</p>}
    <article className="rs-prose" lang="zh-CN" dangerouslySetInnerHTML={{ __html: article.html }}/>
    <div className="rs-attribution"><p>来源：非凡产研 · 腾讯新闻。{CITATION_NOTE}</p><a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">阅读原始发布版本 ↗</a></div>
    <section className="rs-related"><p className="ed-eyebrow">继续阅读</p><h2>继续探索</h2><div>{related.map(({ article: a }) => <Link key={a.id} href={`/research/${a.slug}`}><time>{a.publishedAt.slice(0, 10)}</time><h3>{a.title}</h3><span>阅读全文 ↗</span></Link>)}</div></section>
    <Link href="/research" className="rs-back">← 返回研究文章库</Link>
  </main>
}
