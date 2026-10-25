import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HOME_H1, HOME_LEAD } from '@/content/site-identity.mjs'
import { AGENT_CURL_LLMS, AGENT_PROMPT_TEXT } from '@/content/home-agent-kit.mjs'
import { homeAgentLinks, homeLatestAnnouncement, homeLibraryStatLabel } from '@/content/home-public.mjs'
import { ResearchHeroSearch } from './ResearchHeroSearch'

export function ResearchHero() {
  const announcement = homeLatestAnnouncement()
  const libraryStat = homeLibraryStatLabel()

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
            已公开 <strong>{libraryStat}</strong> 研究与观察，每周更新融资、收入与流量榜单。
          </p>
          <div className="ed-machine-cta" aria-label="机器读取入口">
            <Link className="ed-research-hero__cta ed-research-hero__cta-primary" href="/for-ai">给 AI 接口</Link>
          </div>
        </header>

        <ResearchHeroSearch
          agentLinks={homeAgentLinks()}
          agentPromptText={AGENT_PROMPT_TEXT}
          agentCurlLlms={AGENT_CURL_LLMS}
        />
      </div>
    </section>
  )
}
