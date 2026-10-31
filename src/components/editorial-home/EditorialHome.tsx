'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useDisplayedLang } from '@/hooks/useSwitchSiteLanguage'
import { EVENTS, LINKS, PRODUCTS, TOPICS, eventChromeTitle, eventScheduleLine, eventStatus, legacyTopicFromHash, productExternalHref, productPrimaryHref, productsHubPath, researchHubPath, uniqueBaseHref } from '@/content/editorial.mjs'
import { panelMotif } from './panel-motifs.mjs'
import { homePublicEvents } from '@/content/event-articles.mjs'
import { EditorialShell, OutLink } from './EditorialShell'

function ProductCard({ product, lang }: { product: (typeof PRODUCTS)[number]; lang: 'zh' | 'en' }) {
  const primary = productPrimaryHref(product, lang)
  const external = productExternalHref(product, lang)
  const secondary = typeof external === 'string' && external.startsWith('http') && external !== primary
  const motif = panelMotif(product.id)
  const panelProps = motif ? { 'data-motif': motif } : {}
  const body = (
    <>
      <div className="ed-product-top"><span>{product.audience[lang]}</span></div>
      <h3>{product.name[lang]}</h3>
      <p>{product.description[lang]}</p>
      <span className="ed-link">
        {secondary ? (lang === 'zh' ? '查看产品介绍' : 'Product details') : product.action[lang]}
        {primary.startsWith('/') ? <ArrowRight size={20}/> : <ArrowUpRight size={20}/>}
      </span>
    </>
  )
  if (!secondary) {
    return primary.startsWith('/')
      ? <Link href={primary} className="ed-product ed-panel" {...panelProps}>{body}</Link>
      : <OutLink href={primary} className="ed-product ed-panel" motif={motif}>{body}</OutLink>
  }
  return (
    <article className="ed-product ed-panel" {...panelProps}>
      <Link href={primary} className="ed-product-main">{body}</Link>
      <OutLink href={external} className="ed-product-external">{product.action[lang]}<ArrowUpRight size={14}/></OutLink>
    </article>
  )
}
import { DocumentTitle } from './DocumentTitle'
import { ResearchHighlights } from './ResearchHighlights'
import '@/app/research/research.css'
const statusLabels = {
  zh: { upcoming: '即将举行', live: '正在举行', past: '活动档案', publication: '正式发布', event: '活动' },
  en: { upcoming: 'Upcoming', live: 'Happening now', past: 'Past event', publication: 'Published', event: 'Event' },
}

export function EditorialHome({ hero, tail }: { hero: ReactNode; tail?: ReactNode }) {
  const lang = useDisplayedLang()
  const zh = lang === 'zh'
  const [topic, setTopic] = useState('all')
  const [now, setNow] = useState<number | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const homeEvents = homePublicEvents(EVENTS, 3) as typeof EVENTS

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
    <DocumentTitle zh="非凡产研 UniqueResearch · 非凡资本 | AI 融资、收入与产品数据研究" en="UniqueResearch · UniqueCapital | AI funding, revenue, and product research" />
    <main id="main-content" ref={mainRef}>
      {hero}
      <div className="ed-container ed-underworld ed-underworld-compact">
        <nav className="ed-topic-strip" aria-label={zh ? '选择研究方向' : 'Explore a research focus'}>
          {TOPICS.map((t, i) => <a href={`/topics/${t.id}`} key={t.id}><span className="ed-topic-number">0{i + 1}</span><span><strong>{t.name}</strong><small>{t.title[lang]}</small></span><ArrowRight size={22} strokeWidth={1.3}/></a>)}
        </nav>
      </div>

      <section id="research" className="ed-container ed-section ed-reveal">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">{zh ? '公开研究' : 'Published Research'}</p><h2>{zh ? '研究与洞察' : 'Ideas & perspectives'}</h2></div><Link href={zh ? '/research' : '/en/research'} className="ed-link">{zh ? '进入研究库' : 'Enter the research library'}<ArrowRight size={19}/></Link></div>
        {zh && <div className="ed-filters" role="group" aria-label="按研究方向筛选">{[{ id: 'all', name: '全部' }, ...TOPICS].map(t => <button key={t.id} aria-pressed={topic === t.id} onClick={() => setTopic(t.id)}>{t.name}</button>)}</div>}
        <div className="ed-research-layout">
          <div>
            {zh && topic !== 'all' && <div className="ed-topic-summary"><p className="ed-eyebrow">研究议题</p><h3>{TOPICS.find(t => t.id === topic)?.title[lang]}</h3><p>{TOPICS.find(t => t.id === topic)?.description[lang]}</p></div>}
            <ResearchHighlights topic={topic}/>
          </div>
          <aside className="ed-research-aside">
            <p className="ed-eyebrow">{zh ? '非凡产研' : 'UniqueResearch'}</p>
            <h3>{zh ? <>不止于观察，<br/>更走向现场。</> : <>Ideas meet<br/>the real world.</>}</h3>
            <p>{zh ? '从技术信号到商业实践，非凡产研持续关注 AI 创造真实价值的方式。' : 'From technical signals to commercial practice, we follow how AI creates real value.'}</p>
            <Link href={zh ? '/research' : '/en/research'} className="ed-aside-link"><span>{zh ? '研究与洞察' : 'Research'}</span><ArrowRight size={17}/></Link>
            <Link href={researchHubPath('rankings', lang)} className="ed-aside-link"><span>{zh ? '数据与榜单' : 'Data & Rankings'}</span><ArrowRight size={17}/></Link>
            <Link href={researchHubPath('events-awards', lang)} className="ed-aside-link"><span>{zh ? '活动与奖项' : 'Events & Awards'}</span><ArrowRight size={17}/></Link>
            <p className="ed-aside-note">
              {zh ? '文章与榜单在本站阅读；结构化查询请使用 ' : 'Read articles and rankings on this site. Query structured data on '}
              <a href={uniqueBaseHref(lang)} target="_blank" rel="noopener noreferrer">UniqueBase</a>
              {zh ? '。' : '.'}
            </p>
          </aside>
        </div>
      </section>

      <section id="ecosystem" className="ed-events ed-reveal"><div className="ed-container">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">{zh ? '与同路人' : 'In Good Company'}</p><h2>{zh ? '让连接，真实发生。' : 'Where ideas meet people.'}</h2></div><Link href={researchHubPath('events-awards', lang)} className="ed-link">{zh ? '活动与奖项' : 'Events & awards'}<ArrowRight size={19}/></Link></div>
        <p className="ed-section-intro">{zh ? '列表顺序与 UniqueBloom 公开活动一致；点击前往报名页。完整日历见 UniqueBloom。' : 'Listed in UniqueBloom public order; each row opens sign-up on UniqueBloom.'}</p>
        <div className="ed-event-list">{homeEvents.map(event => {
          const status = now === null ? 'event' : eventStatus(event, now)
          const signupHref = event.bloomHref ?? event.href
          return <OutLink key={event.id} href={signupHref} className="ed-event-row ed-event-row-main">
            <div className="ed-event-date"><strong>{event.date.slice(5).replace('-', '.')}</strong><span>{event.date.slice(0, 4)}</span></div>
            <div><span className="ed-eyebrow">{TOPICS.find(t => t.id === event.topic)?.name}</span><h3>{eventChromeTitle(event, lang)}</h3><p>{eventScheduleLine(event, lang)}</p></div>
            <span className={`ed-event-status ${status === 'upcoming' || status === 'live' ? 'ed-accent' : ''}`}>{statusLabels[lang][status]}</span>
            <ArrowUpRight size={26} strokeWidth={1.3}/>
          </OutLink>
        })}</div>
        <p className="ed-section-intro" style={{ marginTop: '1.5rem' }}>{zh ? '完整活动日历：' : 'Full event calendar: '}<OutLink href={LINKS.events} className="ed-link">{zh ? 'UniqueBloom ↗' : 'UniqueBloom ↗'}<ArrowUpRight size={16}/></OutLink></p>
      </div></section>

      <section id="products" className="ed-container ed-section ed-reveal">
        <div className="ed-section-heading"><div><p className="ed-eyebrow">{zh ? '为构建者而生' : 'Built for Builders'}</p><h2>{zh ? '从洞察，到行动。' : 'From insight to action.'}</h2></div><Link href={productsHubPath(lang)} className="ed-link">{zh ? '产品矩阵' : 'All products'}<ArrowRight size={19}/></Link></div>
        <div className="ed-products">{PRODUCTS.map(p => <ProductCard key={p.id} product={p} lang={lang} />)}</div>
      </section>

      {tail}

      <section className="ed-closing ed-reveal"><div className="ed-container"><p className="ed-eyebrow">{zh ? '未来是共同的事业' : 'The Future Is a Collective Effort'}</p><h2>{zh ? <>未来不是旁观席。<br/>一起，参与构建。</> : <>The future has no sidelines.<br/>Let’s build it together.</>}</h2><Link href="/about" className="ed-link">{zh ? '认识非凡资本' : 'Discover UniqueCapital'}<ArrowRight size={25}/></Link><Link href={LINKS.contact} className="ed-link" style={{ marginLeft: '1.5rem' }}>{zh ? '联系我们' : 'Contact us'}<ArrowRight size={25}/></Link></div></section>
    </main>
  </EditorialShell>
}
