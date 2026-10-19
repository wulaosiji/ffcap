import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { HOME_H1, HOME_LEAD } from '@/content/site-identity.mjs'
import { homeAgentLinks, homeDataCards, homeLatestAnnouncement } from '@/content/home-public.mjs'
import { LINKS } from '@/content/editorial.mjs'

export function ResearchHero() {
  const announcement = homeLatestAnnouncement()
  const cards = homeDataCards()
  const agentLinks = homeAgentLinks()

  return (
    <section id="top" className="ed-research-hero" aria-labelledby="home-h1">
      {announcement && (
        <div className="ed-container ed-research-hero__announce">
          <span className="ed-eyebrow">最新研究</span>
          <Link href={announcement.href} className="ed-research-hero__announce-link">
            <span>{announcement.title}</span>
            <time dateTime={announcement.date}>{announcement.date}</time>
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      )}

      <div className="ed-container ed-research-hero__main">
        <header className="ed-research-hero__copy">
          <h1 id="home-h1">{HOME_H1}</h1>
          <p className="ed-research-hero__lead">{HOME_LEAD}</p>
          <p className="ed-research-hero__scale">
            已公开 <strong>{cards.find(c => c.kind === 'library')?.stat || '1,300+ 篇'}</strong> 研究与观察，每周更新融资、收入与流量榜单。
          </p>
        </header>

        <div className="ed-research-hero__tools">
          <form className="ed-research-hero__search" action="/research" method="get" role="search">
            <label className="sr-only" htmlFor="home-research-q">搜索非凡产研文章</label>
            <input
              id="home-research-q"
              name="q"
              type="search"
              placeholder="问非凡产研：例如「9 月 AI 订阅收入榜」「办公智能体」"
              autoComplete="off"
            />
            <button type="submit" aria-label="搜索研究库">
              <ArrowRight size={20} strokeWidth={1.6} />
            </button>
          </form>
          <nav className="ed-research-hero__scopes" aria-label="快捷入口">
            <Link href="/research">文章库</Link>
            <a href={LINKS.uniqueResearch}>AI 榜单</a>
            <a href={LINKS.events} target="_blank" rel="noopener noreferrer">活动</a>
            <a href={LINKS.goodProjects}>项目 BP</a>
          </nav>

          <div className="ed-research-hero__ctas">
            <Link className="ed-research-hero__cta ed-research-hero__cta-primary" href="/research">
              进入研究库
            </Link>
            <a className="ed-research-hero__cta" href={LINKS.uniqueResearch}>
              查看 AI 榜单
              <ArrowUpRight size={17} />
            </a>
          </div>

          <p className="ed-research-hero__agents">
            <span>给 AI：</span>
            {agentLinks.map((link, i) => (
              <span key={link.href}>
                {i > 0 && ' · '}
                <Link href={link.href}>{link.label}</Link>
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="ed-container ed-research-hero__cards" aria-label="最新数据与活动">
        {cards.map(card => {
          const inner = (
            <>
              <p className="ed-research-hero__card-stat">{card.stat}</p>
              <p className="ed-research-hero__card-label">{card.label}</p>
              <time dateTime={card.date}>{card.date}</time>
            </>
          )
          const className = `ed-research-hero__card ed-research-hero__card-${card.kind}`
          if (card.external) {
            return (
              <a key={card.label} href={card.href} className={className} target="_blank" rel="noopener noreferrer">
                {inner}
                <ArrowUpRight size={16} className="ed-research-hero__card-arrow" aria-hidden />
              </a>
            )
          }
          return (
            <Link key={card.label} href={card.href} className={className}>
              {inner}
              <ArrowRight size={16} className="ed-research-hero__card-arrow" aria-hidden />
            </Link>
          )
        })}
      </div>
    </section>
  )
}
