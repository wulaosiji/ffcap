'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { EVENTS, LINKS, PRODUCTS, TOPICS, eventStatus, legacyTopicFromHash } from '@/content/editorial.mjs'
import { EditorialShell, OutLink } from './EditorialShell'
import { ResearchHighlights } from './ResearchHighlights'
import { SectionIndex } from './SectionIndex'
import { HOME_SECTION_INDEX } from '@/content/home-sections.mjs'
import '@/app/research/research.css'
const statusLabels = {
  zh: { upcoming: '即将举行', live: '正在举行', past: '活动档案', publication: '正式发布', event: '活动' },
  en: { upcoming: 'UPCOMING', live: 'HAPPENING NOW', past: 'PAST EVENT', publication: 'PUBLISHED', event: 'EVENT' },
}

export function EditorialHome({ hero, tail }: { hero: ReactNode; tail?: ReactNode }) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const [topic, setTopic] = useState('all')
  const [showAllEvents, setShowAllEvents] = useState(false)
  const [now, setNow] = useState<number | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const featured = EVENTS.find(event => event.isFlagship) || EVENTS[0]
  const visibleEvents = showAllEvents ? EVENTS : EVENTS.slice(0, 6)
  const featuredStatus = now === null ? 'event' : eventStatus(featured, now)

  useEffect(() => {
    setNow(Date.now())
    const followLegacyHash = () => {
      const legacyTopic = legacyTopicFromHash(window.location.hash)
      if (legacyTopic) {
        setTopic(legacyTopic)
        document.getElementById('research')?.scrollIntoView()
      }
    }
    followLegacyHash()
    window.addEventListener('hashchange', followLegacyHash)
    const timer = window.setInterval(() => setNow(Date.now()), 60000)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let observer: IntersectionObserver | undefined
    if (!reduced && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(entries => entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('ed-visible'); observer?.unobserve(entry.target) }
      }), { threshold: 0.08 })
      mainRef.current?.querySelectorAll('.ed-reveal').forEach(el => {
        if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('ed-will-reveal'); observer?.observe(el) }
      })
    }
    return () => { window.clearInterval(timer); observer?.disconnect(); window.removeEventListener('hashchange', followLegacyHash) }
  }, [])

  return <EditorialShell>
    <main id="main-content" ref={mainRef}>
      {hero}
      <div className="ed-container ed-underworld ed-underworld-compact">
        <nav className="ed-topic-strip" aria-label={zh ? '选择研究方向' : 'Explore a research focus'}>
          {TOPICS.map((t, i) => <a href={`/topics/${t.id}`} key={t.id}><span className="ed-topic-number">0{i + 1}</span><span><strong>{t.name}</strong><small>{t.title[lang]}</small></span><ArrowRight size={22} strokeWidth={1.3}/></a>)}
        </nav>
        <div className="ed-feature-announcement"><span className="ed-eyebrow">{statusLabels[lang][featuredStatus]}</span><p>{featured.title[lang]} · {featured.date}{featured.endDate && featured.endDate !== featured.date ? ` — ${featured.endDate}` : ''}</p><OutLink href={featured.href} className="ed-link">{zh ? '了解大会' : 'Explore the event'}<ArrowUpRight size={18}/></OutLink></div>
      </div>

      <section id="research" className="ed-container ed-section ed-reveal">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">OUR PERSPECTIVE {zh && <SectionIndex index={HOME_SECTION_INDEX.research} />}</p><h2>{zh ? '研究与洞察' : 'Ideas & perspectives'}</h2></div><Link href={zh ? '/research' : '/en/research'} className="ed-link">{zh ? '进入完整研究库' : 'Explore the research library'}<ArrowRight size={19}/></Link></div>
        {zh && <div className="ed-filters" role="group" aria-label="按研究方向筛选">{[{ id: 'all', name: '全部' }, ...TOPICS].map(t => <button key={t.id} aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>{t.name}</button>)}</div>}
        <div className="ed-research-layout">
          <div>
            {zh && topic !== 'all' && <div className="ed-topic-summary"><p className="ed-eyebrow">研究议题</p><h3>{TOPICS.find(t => t.id === topic)?.title[lang]}</h3><p>{TOPICS.find(t => t.id === topic)?.description[lang]}</p></div>}
            <ResearchHighlights topic={topic}/>
          </div>
          <aside className="ed-research-aside"><p className="ed-eyebrow">UNIQUERESEARCH</p><h3>{zh ? <>不止于观察，<br/>更走向现场。</> : <>Ideas meet<br/>the real world.</>}</h3><p>{zh ? '从技术信号到商业实践，非凡产研持续关注 AI 创造真实价值的方式。' : 'From technical signals to commercial practice, we follow how AI creates real value.'}</p><OutLink href={LINKS.report} className="ed-aside-link"><span>{zh ? '研究报告与榜单' : 'Research & rankings'}</span><ArrowUpRight size={17}/></OutLink><OutLink href={LINKS.rankingApplication} className="ed-aside-link"><span>{zh ? '申报 AI 榜单' : 'Apply for AI rankings'}</span><ArrowUpRight size={17}/></OutLink><OutLink href={LINKS.events} className="ed-aside-link"><span>{zh ? '活动与公开交流' : 'Events & conversations'}</span><ArrowUpRight size={17}/></OutLink><p className="ed-aside-note">{zh ? '研究入口将打开非凡产研；可选择浏览器版或微信小程序。' : 'The research portal offers web and WeChat access.'}</p></aside>
        </div>
      </section>

      <section id="ecosystem" className="ed-events ed-reveal"><div className="ed-container">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">IN GOOD COMPANY {zh && <SectionIndex index={HOME_SECTION_INDEX.events} />}</p><h2>{zh ? '让连接，真实发生。' : 'Where ideas meet people.'}</h2></div><OutLink href={LINKS.events} className="ed-link">{zh ? '查看活动日历' : 'View the event calendar'}<ArrowUpRight size={19}/></OutLink></div>
        <p className="ed-section-intro">{zh ? '与创业者、创作者和产业伙伴相遇，在现场讨论 AI 的下一步。' : 'Meet founders, creators, and industry partners. Move the conversation forward, together.'}</p>
        <div className="ed-event-list">{visibleEvents.map(event => {
          const status = now === null ? 'event' : eventStatus(event, now)
          return <OutLink href={event.href} key={event.id} className="ed-event-row"><div className="ed-event-date"><strong>{event.date.slice(5).replace('-', '.')}</strong><span>{event.date.slice(0, 4)}</span></div><div><span className="ed-eyebrow">{TOPICS.find(t => t.id === event.topic)?.name}</span><h3>{event.title[lang]}</h3><p>{event.location?.[lang]}{event.timeText ? ` · ${event.timeText}` : ''}</p></div><span className={`ed-event-status ${status === 'upcoming' || status === 'live' ? 'ed-accent' : ''}`}>{statusLabels[lang][status]}</span><ArrowUpRight size={26} strokeWidth={1.3}/></OutLink>
        })}</div>
        {EVENTS.length > 6 && <button type="button" className="ed-link" aria-expanded={showAllEvents} onClick={() => setShowAllEvents(value => !value)}>{showAllEvents ? (zh ? '收起历史活动' : 'Show fewer events') : (zh ? `查看全部 ${EVENTS.length} 场活动` : `View all ${EVENTS.length} events`)}<ArrowRight size={19}/></button>}
      </div></section>

      <section id="products" className="ed-container ed-section ed-reveal">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">BUILT FOR BUILDERS {zh && <SectionIndex index={HOME_SECTION_INDEX.products} />}</p><h2>{zh ? '从洞察，到行动。' : 'From insight to action.'}</h2></div><p className="ed-heading-note">{zh ? `${PRODUCTS.length} 款产品，为真实协作而生。` : `${PRODUCTS.length} products. Real collaboration.`}</p></div>
        <div className="ed-products">{PRODUCTS.map((p, i) => <OutLink href={p.href} key={p.id} className="ed-product"><div className="ed-product-top"><span>0{i+1}</span><span>{p.audience[lang]}</span></div><h3>{p.name[lang]}</h3><p>{p.description[lang]}</p><span className="ed-link">{p.action[lang]}<ArrowUpRight size={20}/></span></OutLink>)}</div>
      </section>

      {tail}

      <section className="ed-closing ed-reveal"><div className="ed-container"><p className="ed-eyebrow">THE FUTURE IS A COLLECTIVE EFFORT.</p><h2>{zh ? <>未来不是旁观席。<br/>一起，参与构建。</> : <>The future has no sidelines.<br/>Let’s build it together.</>}</h2><Link href="/about" className="ed-link">{zh ? '认识非凡资本' : 'Discover UniqueCapital'}<ArrowRight size={25}/></Link></div></section>
    </main>
  </EditorialShell>
}
