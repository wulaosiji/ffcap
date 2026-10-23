import type { Metadata } from 'next'
import Link from 'next/link'
import { StructuredData } from '@/components/StructuredData'
import { FAQ_ITEMS, HOME_META_DESCRIPTION, homeFaqGraph } from '@/content/home-public.mjs'
import '../editorial-home.css'

export const metadata: Metadata = {
  title: '常见问题 | 非凡资本',
  description: HOME_META_DESCRIPTION,
  alternates: { canonical: 'https://ffcap.cn/faq' },
}

export default function FaqPage() {
  return (
    <main id="main-content" className="ed-site" lang="zh-CN">
      <StructuredData data={homeFaqGraph()} />
      <div className="ed-container rs-detail ed-section">
        <header className="rs-article-header">
          <p className="ed-eyebrow">FAQ</p>
          <h1>常见问题</h1>
          <p className="ed-muted" style={{ marginTop: '1rem', maxWidth: '42rem' }}>
            关于非凡资本、非凡产研、引用方式与 AI 读取入口的说明。与首页 FAQ 区块内容一致。
          </p>
        </header>
        <dl className="ed-home-faq__list ed-faq-page">
          {FAQ_ITEMS.map(item => (
            <div key={item.question} className="ed-home-faq__item">
              <dt>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
        <p style={{ marginTop: '2.5rem' }}>
          <Link href="/for-ai" className="ed-link">给 AI 的读取接口 →</Link>
          {' · '}
          <Link href="/for-models" className="ed-link">公开内容与引用说明 →</Link>
          {' · '}
          <Link href="/about" className="ed-link">关于非凡资本 →</Link>
        </p>
      </div>
    </main>
  )
}
