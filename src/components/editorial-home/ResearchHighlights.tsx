'use client'
import Link from 'next/link'
import articles from '@/content/research/highlights.json'
import englishArticles from '@/content/research/english-highlights.json'
import { useLang } from '@/context/LangContext'
import { ARTICLE_TYPES, DIRECTIONS } from '@/content/research/taxonomy.mjs'

export function ResearchHighlights({ topic }: { topic: string }) {
  const { lang } = useLang()
  if (lang === 'en') return <div className="rs-highlights">
    <p className="ed-result-count">UNIQUE RESEARCH · RECENT ENGLISH ARTICLES</p>
    <div className="rs-grid">{englishArticles.slice(0, 6).map(article => <article key={article.slug} className="rs-card" lang="en">
      <div className="rs-meta"><span>UNIQUE RESEARCH</span><span>ENGLISH ARTICLE</span></div>
      <Link className="rs-card-link" href={`/en/research/${article.slug}`}><h2>{article.title}</h2><p>{article.summary}</p></Link>
      <div className="rs-card-bottom"><time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time><Link href={`/en/research/${article.slug}`} aria-label={`Read article: ${article.title}`}>Read article →</Link></div>
    </article>)}</div>
    <Link className="ed-link" href="/en/research">Explore all English articles →</Link>
  </div>
  const selected = articles.filter(a => topic === 'all' || a.topic === topic).slice(0, 6)
  return <div className="rs-highlights"><p className="ed-result-count">{lang === 'zh' ? '非凡产研 · 最新文章' : 'UNIQUERESEARCH · RECENT ARTICLES'}</p><div className="rs-grid">{selected.map(article => <article key={article.id} className="rs-card"><div className="rs-meta"><span>{DIRECTIONS.find(d => d.id === article.topic)?.name}</span><span>{ARTICLE_TYPES.find(t => t.id === article.type)?.label}</span></div><Link className="rs-card-link" href={`/research/${article.slug}`}><h2>{article.title}</h2><p>{article.excerpt}</p></Link><div className="rs-tags">{article.tags.slice(0, 3).map(tag => <Link key={tag} href={`/research?tag=${encodeURIComponent(tag)}`}>{tag}</Link>)}</div><div className="rs-card-bottom"><time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10).replaceAll('-', '.')}</time><Link href={`/research/${article.slug}`} aria-label={`${lang === 'zh' ? '阅读' : 'Read'}: ${article.title}`}>↗</Link></div></article>)}</div><Link className="ed-link" href={`/research${topic === 'all' ? '' : `?topic=${topic}`}`}>{lang === 'zh' ? '查看这个方向的全部文章' : 'Explore all articles'} →</Link></div>
}
