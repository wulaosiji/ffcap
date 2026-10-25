'use client'

import Link from 'next/link'
import { useLang } from '@/context/LangContext'
import { SectionIndex } from './SectionIndex'
import { HOME_SECTION_INDEX } from '@/content/home-sections.mjs'
import { DocumentTitle } from './DocumentTitle'
import { EditorialShell } from './EditorialShell'

export type FaqItem = { question: string; answer: string }

function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <dl className="ed-home-faq__list">
      {items.map(item => (
        <div key={item.question} className="ed-home-faq__item">
          <dt>{item.question}</dt>
          <dd>{item.answer}</dd>
        </div>
      ))}
    </dl>
  )
}

export function HomeFaq({ zhItems, enItems }: { zhItems: FaqItem[]; enItems: FaqItem[] }) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const items = (zh ? zhItems : enItems).slice(0, 6)

  return (
    <section id="faq" className="ed-container ed-section ed-home-faq" aria-labelledby="home-faq-title">
      <div className="ed-section-heading">
        <div>
          <p className="ed-eyebrow">{zh ? '问答' : 'FAQ'} <SectionIndex index={HOME_SECTION_INDEX.faq} /></p>
          <h2 id="home-faq-title">{zh ? '常见问题' : 'Frequently asked questions'}</h2>
        </div>
        <Link href="/faq" className="ed-link">
          {zh ? '查看全部问题' : 'View all FAQ'}
          <ArrowRightIcon />
        </Link>
      </div>
      <FaqList items={items} />
    </section>
  )
}

export function EditorialFaq({ zhItems, enItems }: { zhItems: FaqItem[]; enItems: FaqItem[] }) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const items = zh ? zhItems : enItems

  return (
    <EditorialShell>
      <DocumentTitle zh="常见问题 | 非凡资本" en="FAQ | UniqueCapital" />
      <main id="main-content">
        <div className="ed-container rs-detail ed-section">
          <header className="rs-article-header">
            <p className="ed-eyebrow">{zh ? '问答' : 'FAQ'}</p>
            <h1>{zh ? '常见问题' : 'Frequently asked questions'}</h1>
            <p className="ed-muted" style={{ marginTop: '1rem', maxWidth: '42rem' }}>
              {zh
                ? '关于非凡资本、非凡产研、引用方式与 AI 读取入口的说明。与首页 FAQ 区块内容一致。'
                : 'How UniqueCapital and UniqueResearch fit together, how to cite, and how AI systems can read the site. Same answers as the homepage FAQ.'}
            </p>
          </header>
          <div className="ed-faq-page">
            <FaqList items={items} />
          </div>
          <p style={{ marginTop: '2.5rem' }}>
            <Link href="/for-ai" className="ed-link">{zh ? '给 AI 的读取接口' : 'For AI'} →</Link>
            {' · '}
            <Link href="/for-models" className="ed-link">{zh ? '公开内容与引用说明' : 'Citation notes'} →</Link>
            {' · '}
            <Link href="/about" className="ed-link">{zh ? '关于非凡资本' : 'About UniqueCapital'} →</Link>
          </p>
        </div>
      </main>
    </EditorialShell>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
