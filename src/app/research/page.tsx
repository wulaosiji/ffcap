import type { Metadata } from 'next'
import Link from 'next/link'
import { DIRECTIONS, ARTICLE_TYPES, searchArticles } from '@/content/research/taxonomy.mjs'
import { getResearchCatalog, researchUrl, type ResearchEntry } from '@/lib/research'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: '研究与洞察 · 非凡产研 | 非凡资本',
  description: '非凡产研文章库：探索 AI 智能体、物理 AI、文娱 AI 与产业趋势，按方向、内容类型、年份和标签检索全文。',
  alternates: { canonical: 'https://ffcap.cn/research' },
}
type Params = Record<string, string | string[] | undefined>
export default function ResearchPage({ searchParams }: { searchParams: Params }) {
  const value = (key: string) => typeof searchParams[key] === 'string' ? (searchParams[key] as string).slice(0, 200) : ''
  const catalog = getResearchCatalog()
  const q = value('q'), topic = value('topic'), type = value('type'), tag = value('tag'), year = value('year'), sort = value('sort') === 'oldest' ? 'oldest' : 'newest'
  const filters = { q, topic, type, tag, year, sort }
  const matches = searchArticles(catalog, filters) as ResearchEntry[]
  const totalPages = Math.max(1, Math.ceil(matches.length / 18))
  const page = Math.min(totalPages, Math.max(1, Number.parseInt(value('page'), 10) || 1))
  const articles = matches.slice((page - 1) * 18, page * 18)
  const years = Array.from(new Set(catalog.map(a => a.publishedAt.slice(0, 4)))).sort().reverse()
  const tagCounts = new Map<string, number>()
  for (const article of catalog) for (const item of article.tags) tagCounts.set(item, (tagCounts.get(item) || 0) + 1)
  const tags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1])
  const active = Boolean(q || topic || type || tag || year)
  return <main id="main-content" className="ed-container rs-library">
    <div className="rs-intro"><div><p className="ed-eyebrow">非凡产研 / 文章库</p><h1>研究与洞察</h1><p>把分散的行业信号，放回同一张图景。</p><p><Link href="/for-ai">给 AI</Link> · <Link href="/for-models">引用说明</Link> · <a href="/research/index.json">公开文章索引 JSON</a></p></div><div className="rs-total"><strong>{catalog.length.toLocaleString('zh-CN')}</strong><span>篇文章 · 非凡产研</span></div></div>
    <nav className="rs-directions" aria-label="研究方向">
      <Link href={researchUrl({ ...filters, topic: '' })} aria-current={!topic ? 'page' : undefined}>全部方向<span>{catalog.length}</span></Link>
      {DIRECTIONS.map(d => <Link key={d.id} href={researchUrl({ ...filters, topic: d.id })} aria-current={topic === d.id ? 'page' : undefined}>{d.name}<small>{d.label}</small></Link>)}
    </nav>
    <form action="/research" method="get" className="rs-search" role="search">
      {topic && <input type="hidden" name="topic" value={topic}/>}
      <label className="rs-query">搜索文章<input name="q" defaultValue={q} placeholder="搜索标题、正文、公司或主题…" maxLength={200}/></label>
      <label>内容类型<select name="type" defaultValue={type}><option value="">全部类型</option>{ARTICLE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
      <label>年份<select name="year" defaultValue={year}><option value="">全部年份</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></label>
      <label>主题标签<select name="tag" defaultValue={tag}><option value="">全部标签</option>{tags.map(([t, n]) => <option key={t} value={t}>{t} ({n})</option>)}</select></label>
      <label>排序<select name="sort" defaultValue={sort}><option value="newest">最新发布</option><option value="oldest">最早发布</option></select></label>
      <button type="submit">检索文章 ↗</button>
    </form>
    <div className="rs-result-bar"><p role="status">{active ? `找到 ${matches.length} 篇文章` : `全部 ${matches.length} 篇文章`}{tag ? ` · ${tag}` : ''}{q ? ` · “${q}”` : ''}</p>{active && <Link href="/research">清除筛选 ×</Link>}<span>第 {page} / {totalPages} 页</span></div>
    {articles.length ? <div className="rs-grid">{articles.map(article => <article key={article.id} className="rs-card">
      <div className="rs-meta"><span>{DIRECTIONS.find(d => d.id === article.topic)?.name}</span><span>{ARTICLE_TYPES.find(t => t.id === article.type)?.label}</span></div>
      <Link href={`/research/${article.slug}`} className="rs-card-link"><h2>{article.title}</h2><p>{article.excerpt}</p></Link>
      <div className="rs-tags">{article.tags.slice(0, 4).map(t => <Link key={t} href={researchUrl({ tag: t })}>{t}</Link>)}</div>
      <div className="rs-card-bottom"><time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10).replaceAll('-', '.')}</time><span>{article.readingMinutes} 分钟阅读</span><Link href={`/research/${article.slug}`} aria-label={`阅读：${article.title}`}>↗</Link></div>
    </article>)}</div> : <div className="rs-empty"><h2>暂未找到匹配文章</h2><p>试试更短的关键词，或减少筛选条件。</p><Link href="/research">查看全部文章 ↗</Link></div>}
    <nav className="rs-pagination" aria-label="文章分页">{page > 1 && <Link href={researchUrl({ ...filters, page: String(page - 1) })}>← 上一页</Link>}<span>{page} / {totalPages}</span>{page < totalPages && <Link href={researchUrl({ ...filters, page: String(page + 1) })}>下一页 →</Link>}</nav>
    <p className="rs-source-note">本文库收录非凡产研腾讯新闻账号公开文章，保留原文内容、署名和发布时间。历史活动与数据以原文日期为准。<a href="https://news.qq.com/omn/author/21759984" target="_blank" rel="noopener noreferrer">查看来源 ↗</a></p>
  </main>
}
