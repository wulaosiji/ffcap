import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TOPICS } from '@/content/editorial.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { getResearchCatalog } from '@/lib/research'
import { StructuredData } from '@/components/StructuredData'
export const dynamic = 'force-dynamic'
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const t = TOPICS.find(t => t.id === params.slug)
  return t ? { title: `${t.name} | 非凡资本研究方向`, description: t.description.zh, alternates: { canonical: `${SITE_URL}/topics/${t.id}` } } : { title: '研究方向未找到' }
}
export default function TopicPage({ params }: { params: { slug: string } }) {
  const t = TOPICS.find(t => t.id === params.slug)
  if (!t) notFound()
  const articles = getResearchCatalog().filter(a => a.topics.includes(t.id) && !a.sourceIncomplete).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 12)
  return <main id="main-content" className="ed-container rs-detail" lang="zh-CN"><StructuredData data={breadcrumbs([{ name: t.name, url: `/topics/${t.id}` }])}/><header className="rs-article-header"><p className="ed-eyebrow">RESEARCH DIRECTION</p><h1>{t.name}</h1></header><article className="rs-prose"><h2>{t.title.zh}</h2><p>{t.description.zh}</p><h2>近期文章</h2><p>按原始发表日期排列，主题为站内分类。</p><ul>{articles.map(a => <li key={a.id}><Link href={`/research/${a.slug}`}>{a.title}</Link> — <time dateTime={a.publishedAt}>{a.publishedAt.slice(0, 10)}</time></li>)}</ul><p><Link href={`/research?topic=${t.id}`}>浏览此方向全部文章 →</Link></p><h2>相关活动</h2><p><a href={t.href} target="_blank" rel="noopener noreferrer">查看相关活动原始页面 ↗</a>（日期与报名状态以活动页面为准）</p><h2>其他研究方向</h2><ul>{TOPICS.filter(other => other.id !== t.id).map(other => <li key={other.id}><Link href={`/topics/${other.id}`}>{other.name}</Link></li>)}</ul></article></main>
}
