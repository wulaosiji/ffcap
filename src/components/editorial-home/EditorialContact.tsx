'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/context/LangContext'
import { CONTACT } from '@/content/contact.mjs'
import { LINKS } from '@/content/editorial.mjs'
import { EditorialShell, OutLink } from './EditorialShell'

const copy = {
  zh: {
    eyebrow: '联系我们',
    title: '与非凡资本取得联系。',
    intro: '商务合作、媒体与研究相关问题，请通过下方公开联系方式与我们沟通。',
    emailLabel: '邮箱',
    addressLabel: '办公室（城市）',
    research: '阅读研究与洞察',
    rankings: '浏览 AI 榜单文章',
    uniqueBase: '在 UniqueBase 查询公开数据',
  },
  en: {
    eyebrow: 'Contact',
    title: 'Get in touch with UniqueCapital.',
    intro: 'For partnerships, press, and research inquiries, use the public contact details below.',
    emailLabel: 'Email',
    addressLabel: 'Offices (cities)',
    research: 'Read research & insights',
    rankings: 'Browse ranking articles',
    uniqueBase: 'Query public data on UniqueBase',
  },
}

export function EditorialContact() {
  const { lang } = useLang()
  const text = copy[lang]
  const uniqueBase = lang === 'en' ? LINKS.uniqueBaseEn : LINKS.uniqueBaseZh

  return (
    <EditorialShell>
      <main className="ed-about" id="main-content">
        <section className="ed-container ed-about-intro" aria-labelledby="contact-title">
          <p className="ed-eyebrow">{text.eyebrow}</p>
          <h1 id="contact-title">{text.title}</h1>
          <div>
            <p>{text.intro}</p>
            <dl className="ed-contact-card">
              <div>
                <dt className="ed-eyebrow">{lang === 'zh' ? '联系人' : 'Contact'}</dt>
                <dd><strong>{CONTACT.name[lang]}</strong></dd>
              </div>
              <div>
                <dt className="ed-eyebrow">{text.emailLabel}</dt>
                <dd><a className="ed-link" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></dd>
              </div>
              <div>
                <dt className="ed-eyebrow">{text.addressLabel}</dt>
                <dd>{CONTACT.officeCities[lang]}</dd>
                <dd className="ed-muted" style={{ marginTop: '0.75rem', fontSize: '14px' }}>{CONTACT.officeDetailPlaceholder[lang]}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="ed-container ed-about-ecosystem" aria-labelledby="contact-links-title">
          <p className="ed-eyebrow">{lang === 'zh' ? '研究 · 榜单 · 数据' : 'RESEARCH · RANKINGS · DATA'}</p>
          <h2 id="contact-links-title">{lang === 'zh' ? '站内阅读与数据入口' : 'On-site reading & data'}</h2>
          <p>{lang === 'zh' ? '研究报告与榜单文章在本站阅读；需要结构化公司事实时可使用 UniqueBase。' : 'Read reports and ranking articles on ffcap.cn; use UniqueBase when you need structured company facts.'}</p>
          <div>
            <Link className="ed-link" href={lang === 'zh' ? '/research' : '/en/research'}>{text.research}<ArrowUpRight size={18} aria-hidden="true" /></Link>
            <Link className="ed-link" href={LINKS.rankingsHub}>{text.rankings}<ArrowUpRight size={18} aria-hidden="true" /></Link>
            <OutLink className="ed-link" href={uniqueBase}>{text.uniqueBase}<ArrowUpRight size={18} aria-hidden="true" /></OutLink>
            <Link className="ed-link" href="/products/uniquebase">{lang === 'zh' ? 'UniqueBase 产品介绍' : 'UniqueBase product details'}<ArrowUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
    </EditorialShell>
  )
}
