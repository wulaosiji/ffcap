import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { HOME_H1, HOME_LEAD } from '@/content/site-identity.mjs'
import { AGENT_CURL_LATEST, AGENT_CURL_LLMS, AGENT_PROMPT_TEXT } from '@/content/home-agent-kit.mjs'
import { homeAgentLinks, homeDataCards, homeLatestAnnouncement } from '@/content/home-public.mjs'
import { ResearchHeroSearch } from './ResearchHeroSearch'

export function ResearchHero() {
  const announcement = homeLatestAnnouncement()
  const cards = homeDataCards()

  return (
    <section id="top" className="ed-research-hero" aria-labelledby="home-h1">
      {announcement && (
        <div className="ed-container ed-research-hero__announce">
          <span className="ed-eyebrow">最新研究</span>
          <Link href={announcement.href} className="ed-research-hero__announce-link">
            <span className="ed-research-hero__announce-title">{announcement.title}</span>
            {(announcement.stat || announcement.summary) && (
              <span className="ed-research-hero__announce-meta">
                {announcement.stat && <strong>{announcement.stat}</strong>}
                {announcement.stat && announcement.summary ? ' · ' : ''}
                {announcement.summary}
              </span>
            )}
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
          <div className="ed-machine-cta" aria-label="机器读取入口">
            <Link className="ed-research-hero__cta ed-research-hero__cta-primary" href="/for-ai">给 AI 接口</Link>
            <div className="ed-machine-cta__cmds">
              <a className="ed-machine-cta__cmd" href="/llms.txt"><code>{AGENT_CURL_LLMS}</code></a>
              <a className="ed-machine-cta__cmd" href="/research/latest.md"><code>{AGENT_CURL_LATEST}</code></a>
            </div>
          </div>
        </header>

        <ResearchHeroSearch
          agentLinks={homeAgentLinks()}
          agentPromptText={AGENT_PROMPT_TEXT}
          agentCurlLlms={AGENT_CURL_LLMS}
        />
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
