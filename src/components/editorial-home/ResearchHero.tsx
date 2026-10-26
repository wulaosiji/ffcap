'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLang } from '@/context/LangContext'
import { primaryNavItems } from '@/content/editorial.mjs'
import { HOME_H1, HOME_LEAD } from '@/content/site-identity.mjs'
import { ResearchHeroAgents, ResearchHeroSearch } from './ResearchHeroSearch'

export type HomeAnnouncement = {
  title: string
  date: string
  href: string
  stat?: string | null
  summary?: string
} | null

const heroCopy = {
  zh: {
    latest: '最新研究',
    kicker: '非凡产研 · 公开研究库',
    h1: HOME_H1,
    emphasis: 'AI 研究',
    lead: HOME_LEAD,
    shortcuts: '快速入口',
  },
  en: {
    latest: 'Latest research',
    kicker: 'UniqueResearch · Public research library',
    h1: 'An industry capital and ecosystem built on AI research',
    emphasis: 'AI research',
    lead: 'UniqueCapital is an industry capital and ecosystem organization built on AI research. Its research brand, UniqueResearch, tracks global AI funding, subscription revenue, and product traffic across Agentic AI, Physical AI, and Entertainment AI.',
    shortcuts: 'Shortcuts',
  },
}

function withEmphasis(source: string, phrase: string): ReactNode {
  const index = source.indexOf(phrase)
  if (index < 0) return source
  return (
    <>
      {source.slice(0, index)}
      <em>{phrase}</em>
      {source.slice(index + phrase.length)}
    </>
  )
}

export function ResearchHero({
  announcementZh,
  announcementEn,
  libraryStatZh,
  libraryCount,
}: {
  announcementZh: HomeAnnouncement
  announcementEn: HomeAnnouncement
  libraryStatZh: string
  libraryCount: number
}) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const text = heroCopy[lang]
  const announcement = zh ? announcementZh : announcementEn
  const pills = primaryNavItems(lang)

  return (
    <section id="top" className="ed-research-hero" aria-labelledby="home-h1">
      <div className="ed-container ed-research-hero__main">
        <header className="ed-research-hero__copy">
          <p className="ed-research-hero__kicker">
            <span className="ed-research-hero__dot" aria-hidden />
            {text.kicker}
          </p>
          <h1 id="home-h1">{withEmphasis(text.h1, text.emphasis)}</h1>
          <p className="ed-research-hero__lead">{text.lead}</p>
          <p className="ed-research-hero__scale">
            {zh ? (
              <>
                已公开 <strong>{libraryStatZh}</strong> 研究与观察，每周更新融资、收入与流量榜单。
              </>
            ) : (
              <>
                More than <strong>{libraryCount.toLocaleString('en-US')}</strong> published studies and observations, updated weekly with funding, revenue, and traffic rankings.
              </>
            )}
          </p>
        </header>

        <ResearchHeroSearch />

        {announcement && (
          <div className="ed-research-hero__status">
            <Link href={announcement.href} className="ed-research-hero__announce-link">
              <span className="ed-research-hero__dot" aria-hidden />
              <span className="ed-research-hero__status-kicker">{text.latest}</span>
              <span className="ed-research-hero__announce-title">{announcement.title}</span>
              {(announcement.stat || announcement.summary) && (
                <span className="ed-research-hero__announce-meta">
                  {announcement.stat && <strong>{announcement.stat}</strong>}
                  {announcement.stat && announcement.summary ? ' · ' : ''}
                  {announcement.summary}
                </span>
              )}
              <time dateTime={announcement.date}>{announcement.date}</time>
              <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
        )}

        <nav className="ed-research-hero__pills" aria-label={text.shortcuts}>
          {pills.map((item) => (
            <Link key={item.href} href={item.href} className="ed-research-hero__pill">
              {item.label}
            </Link>
          ))}
        </nav>

        <ResearchHeroAgents />
      </div>
    </section>
  )
}
