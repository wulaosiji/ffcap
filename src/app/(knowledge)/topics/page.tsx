import type { Metadata } from 'next'
import Link from 'next/link'
import { TOPICS } from '@/content/editorial.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { getResearchCatalog } from '@/lib/research'
import { StructuredData } from '@/components/StructuredData'

export const metadata: Metadata = {
  title: '研究方向 · 非凡资本',
  description: 'Agentic AI、Physical AI 与 Entertainment AI：站内研究文章与活动导读按方向聚合。',
  alternates: { canonical: `${SITE_URL}/topics` },
}

export default function TopicsHubPage() {
  const catalog = getResearchCatalog()

  return (
    <main id="main-content" className="ed-container rs-library" lang="zh-CN">
      <StructuredData data={breadcrumbs([{ name: '研究方向', url: '/topics' }])} />
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">RESEARCH DIRECTIONS</p>
          <h1>研究方向</h1>
          <p>三个长期关注议题：智能体与企业应用、物理世界与智能硬件、内容创作与文娱。</p>
          <p><Link href="/research">进入研究文章库</Link> · <Link href="/events">活动文章</Link></p>
        </div>
      </div>
      <div className="rs-grid">
        {TOPICS.map(topic => {
          const count = catalog.filter(
            article => !article.sourceIncomplete && article.topics?.includes(topic.id),
          ).length
          return (
            <article key={topic.id} className="rs-card">
              <div className="rs-meta">
                <span>{topic.name}</span>
                <span>{count} 篇相关研究</span>
              </div>
              <Link href={`/topics/${topic.id}`} className="rs-card-link">
                <h2>{topic.title.zh}</h2>
                <p>{topic.description.zh}</p>
              </Link>
              <div className="rs-card-bottom">
                <Link href={`/research?topic=${topic.id}`}>浏览文章 →</Link>
                <Link href={`/topics/${topic.id}`} aria-label={`${topic.name} 导读`}>↗</Link>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
