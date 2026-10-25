'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { EVENTS, LINKS, PRODUCTS, TOPICS, eventStatus, legacyTopicFromHash, uniqueBaseHref } from '@/content/editorial.mjs'
import { homeFeaturedEvents } from '@/content/event-articles.mjs'
import { EditorialShell, OutLink } from './EditorialShell'

function productHref(product: (typeof PRODUCTS)[number], lang: 'zh' | 'en') {
  if (product.id === 'uniquebase') return uniqueBaseHref(lang)
  return product.href
}

function ProductCard({ product, lang, index }: { product: (typeof PRODUCTS)[number]; lang: 'zh' | 'en'; index: number }) {
  const href = productHref(product, lang)
  const className = 'ed-product'
  const body = (
    <>
      <div className="ed-product-top"><span>0{index + 1}</span><span>{product.audience[lang]}</span></div>
      <h3>{product.name[lang]}</h3>
      <p>{product.description[lang]}</p>
      <span className="ed-link">{product.action[lang]}<ArrowUpRight size={20}/></span>
    </>
  )
  if (href.startsWith('/')) {
    return <Link href={href} className={className}>{body}</Link>
  }
  return <OutLink href={href} className={className}>{body}</OutLink>
}
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
  const [now, setNow] = useState<number | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const featured = EVENTS.find(event => event.isFlagship && event.articleHref) || EVENTS.find(event => event.articleHref) || EVENTS[0]
  const homeEvents = homeFeaturedEvents(
    EVENTS.filter(event => event.slug) as ReadonlyArray<{ slug: string; date: string; status?: string; isFlagship?: boolean }>,
    3,
  ) as typeof EVENTS
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
        <div className="ed-feature-announcement"><span className="ed-eyebrow">{statusLabels[lang][featuredStatus]}</span><p>{featured.title[lang]} · {featured.date}{featured.endDate && featured.endDate !== featured.date ? ` — ${featured.endDate}` : ''}</p>{featured.articleHref ? <Link href={featured.articleHref} className="ed-link">{zh ? '阅读活动文章' : 'Read event brief'}<ArrowRight size={18}/></Link> : <OutLink href={featured.bloomHref ?? featured.href} className="ed-link">{zh ? '了解大会' : 'Explore the event'}<ArrowUpRight size={18}/></OutLink>}</div>
      </div>

      <section id="research" className="ed-container ed-section ed-reveal">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">OUR PERSPECTIVE {zh && <SectionIndex index={HOME_SECTION_INDEX.research} />}</p><h2>{zh ? '研究与洞察' : 'Ideas & perspectives'}</h2></div><Link href={zh ? '/research' : '/en/research'} className="ed-link">{zh ? '进入完整研究库' : 'Explore the research library'}<ArrowRight size={19}/></Link></div>
        {zh && <div className="ed-filters" role="group" aria-label="按研究方向筛选">{[{ id: 'all', name: '全部' }, ...TOPICS].map(t => <button key={t.id} aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>{t.name}</button>)}</div>}
        <div className="ed-research-layout">
          <div>
            {zh && topic !== 'all' && <div className="ed-topic-summary"><p className="ed-eyebrow">研究议题</p><h3>{TOPICS.find(t => t.id === topic)?.title[lang]}</h3><p>{TOPICS.find(t => t.id === topic)?.description[lang]}</p></div>}
            <ResearchHighlights topic={topic}/>
          </div>
          <aside className="ed-research-aside"><p className="ed-eyebrow">UNIQUERESEARCH</p><h3>{zh ? <>不止于观察，<br/>更走向现场。</> : <>Ideas meet<br/>the real world.</>}</h3><p>{zh ? '从技术信号到商业实践，非凡产研持续关注 AI 创造真实价值的方式。' : 'From technical signals to commercial practice, we follow how AI creates real value.'}</p><Link href={zh ? '/research' : '/en/research'} className="ed-aside-link"><span>{zh ? '研究与洞察文章库' : 'Research article library'}</span><ArrowRight size={17}/></Link><Link href={LINKS.rankingsHub} className="ed-aside-link"><span>{zh ? 'AI 榜单精选' : 'Curated rankings'}</span><ArrowRight size={17}/></Link><OutLink href={LINKS.rankingApplication} className="ed-aside-link"><span>{zh ? '申报 AI 榜单' : 'Apply for AI rankings'}</span><ArrowUpRight size={17}/></OutLink><OutLink href={LINKS.events} className="ed-aside-link"><span>{zh ? '活动与公开交流' : 'Events & conversations'}</span><ArrowUpRight size={17}/></OutLink><p className="ed-aside-note">{zh ? '文章与榜单在本站阅读；查库请使用 UniqueBase。' : 'Read articles and rankings on ffcap.cn; use UniqueBase to query structured data.'}</p></aside>
        </div>
      </section>

      <section id="ecosystem" className="ed-events ed-reveal"><div className="ed-container">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">IN GOOD COMPANY {zh && <SectionIndex index={HOME_SECTION_INDEX.events} />}</p><h2>{zh ? '让连接，真实发生。' : 'Where ideas meet people.'}</h2></div><Link href="/events" className="ed-link">{zh ? '更多活动文章' : 'More event briefs'}<ArrowRight size={19}/></Link></div>
        <p className="ed-section-intro">{zh ? '精选公开活动导读在本站阅读；报名与完整日历见 UniqueBloom。' : 'Read curated event briefs on-site; sign-up and the full calendar live on UniqueBloom.'}</p>
        <div className="ed-event-list">{homeEvents.map(event => {
          const status = now === null ? 'event' : eventStatus(event, now)
          const articleHref = event.articleHref ?? event.href
          return <div key={event.id} className="ed-event-row ed-event-row-split">
            <Link href={articleHref} className="ed-event-row-main">
              <div className="ed-event-date"><strong>{event.date.slice(5).replace('-', '.')}</strong><span>{event.date.slice(0, 4)}</span></div>
              <div><span className="ed-eyebrow">{TOPICS.find(t => t.id === event.topic)?.name}</span><h3>{event.title[lang]}</h3><p>{event.location?.[lang]}{event.timeText ? ` · ${event.timeText}` : ''}</p></div>
              <span className={`ed-event-status ${status === 'upcoming' || status === 'live' ? 'ed-accent' : ''}`}>{statusLabels[lang][status]}</span>
              <ArrowRight size={26} strokeWidth={1.3}/>
            </Link>
            <OutLink href={event.bloomHref ?? event.href} className="ed-event-signup">{zh ? '报名/详情' : 'Sign up'}<ArrowUpRight size={18}/></OutLink>
          </div>
        })}</div>
        <p className="ed-section-intro" style={{ marginTop: '1.5rem' }}>{zh ? '完整活动日历：' : 'Full event calendar: '}<OutLink href={LINKS.events} className="ed-link">{zh ? 'UniqueBloom ↗' : 'UniqueBloom ↗'}<ArrowUpRight size={16}/></OutLink></p>
      </div></section>

      <section id="products" className="ed-container ed-section ed-reveal">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">BUILT FOR BUILDERS {zh && <SectionIndex index={HOME_SECTION_INDEX.products} />}</p><h2>{zh ? '从洞察，到行动。' : 'From insight to action.'}</h2></div><Link href="/products" className="ed-link">{zh ? '产品矩阵' : 'All products'}<ArrowRight size={19}/></Link></div>
        <div className="ed-products">{PRODUCTS.map((p, i) => <ProductCard key={p.id} product={p} lang={lang} index={i} />)}</div>
      </section>

      {tail}

      <section className="ed-closing ed-reveal"><div className="ed-container"><p className="ed-eyebrow">THE FUTURE IS A COLLECTIVE EFFORT.</p><h2>{zh ? <>未来不是旁观席。<br/>一起，参与构建。</> : <>The future has no sidelines.<br/>Let’s build it together.</>}</h2><Link href="/about" className="ed-link">{zh ? '认识非凡资本' : 'Discover UniqueCapital'}<ArrowRight size={25}/></Link><Link href={LINKS.contact} className="ed-link" style={{ marginLeft: '1.5rem' }}>{zh ? '联系我们' : 'Contact us'}<ArrowRight size={25}/></Link></div></section>
    </main>
  </EditorialShell>
}
