'use client'

import Link from 'next/link'
import { useLang } from '@/context/LangContext'
import { AgentCopyBlocks } from './AgentCopyBlocks'
import { DocumentTitle } from './DocumentTitle'
import { LINKS, PRODUCTS, TOPICS, eventChromeTitle, eventScheduleLine, researchHubPath } from '@/content/editorial.mjs'
import { AGENT_CURL_ARTICLE, AGENT_CURL_LATEST, AGENT_CURL_LLMS, AGENT_PROMPT_TEXT, AGENT_PROMPT_TEXT_EN } from '@/content/home-agent-kit.mjs'
import { AGENT_READ_ORDER, AGENT_SURFACES, absoluteAgentUrl } from '@/content/agent-surfaces.mjs'

const READ_ORDER_EN: Record<string, string> = {
  '/for-ai': 'Start on this page to see which URLs exist and how to fetch one Markdown article.',
  '/llms.txt': 'Read the short guide and the latest three data points.',
  '/llms-full.txt': 'Read this when you need bounded context. It is not the full archive.',
  '/for-models': 'Read the citation rules before quoting.',
  '/research/index.json': 'Choose an article by title, date, and tags, then use its markdownUrl.',
  '/research/latest.md': 'Read the rolling summary for recent updates, or use rss.xml.',
}

const SURFACE_EN: Record<string, string> = {
  '/for-ai': 'Directory of machine URLs and the suggested read order.',
  '/llms.txt': 'Short guide: who we are, read steps, three latest data points, and product links.',
  '/llms-full.txt': 'Bounded context: definitions, citation rules, latest points, and archive pointers. No article bodies.',
  '/for-models': 'Citation rules: keep the UniqueResearch byline, original date, and source link. Do not infer an individual author.',
  '/research/index.json': 'Chinese article metadata: title, date, byline, source, markdownUrl, and content gaps. No bodies.',
  '/research/latest.md': 'Recent titles, dates, on-site links, and a one-line summary.',
  '/research/rss.xml': 'RSS 2.0 for the same rolling window as latest.md.',
  '/sitemap.xml': 'Public page list, including article HTML, interface pages, and llms-full.txt.',
  '/robots.txt': 'Crawl rules. Content-Signal allows search, ai-input, and ai-train.',
}

const eventStatusLabel = {
  zh: { upcoming: '即将举行', live: '正在举行', past: '活动档案', ended: '活动档案', event: '活动' },
  en: { upcoming: 'Upcoming', live: 'Happening now', past: 'Archive', ended: 'Archive', event: 'Event' },
} as const

export type TopicCard = {
  id: string
  count: number
}

export function TopicsHubView({ topics }: { topics: TopicCard[] }) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const byId = new Map(TOPICS.map(topic => [topic.id, topic]))

  return (
    <main id="main-content" className="ed-container rs-library" lang={zh ? 'zh-CN' : 'en'}>
      <DocumentTitle zh="研究方向 · 非凡资本" en="Research directions · UniqueCapital" />
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">{zh ? '研究方向' : 'Research directions'}</p>
          <h1>{zh ? '研究方向' : 'Research directions'}</h1>
          <p>{zh ? '三个长期关注议题：智能体与企业应用、物理世界与智能硬件、内容创作与文娱。' : 'Three ongoing fields: agents in business, hardware and embodied intelligence, and content and entertainment.'}</p>
          <p>
            <Link href={zh ? '/research' : '/en/research'}>{zh ? '进入研究文章库' : 'Research library'}</Link>
            {' · '}
            <Link href={researchHubPath('events-awards', lang)}>{zh ? '活动与奖项' : 'Events & Awards'}</Link>
          </p>
        </div>
      </div>
      <div className="rs-grid">
        {topics.map(item => {
          const topic = byId.get(item.id)
          if (!topic) return null
          return (
            <article key={topic.id} className="rs-card">
              <div className="rs-meta">
                <span>{topic.name}</span>
                <span>{zh ? `${item.count} 篇相关研究` : `${item.count} related articles`}</span>
              </div>
              <Link href={`/topics/${topic.id}`} className="rs-card-link">
                <h2>{topic.title[lang]}</h2>
                <p>{topic.description[lang]}</p>
              </Link>
              <div className="rs-card-bottom">
                <Link href={zh ? `/research?topic=${topic.id}` : '/en/research'}>{zh ? '浏览文章 →' : 'Browse articles →'}</Link>
                <Link href={`/topics/${topic.id}`} aria-label={zh ? `${topic.name} 导读` : `${topic.name} overview`}>↗</Link>
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}

export type TopicArticle = { slug: string; title: string; publishedAt: string }
export type TopicEvent = {
  id: string
  title: { zh: string; en: string }
  subtitle?: string
  date: string
  city?: string
  bloomHref: string
  articleHref: string | null
}

export function TopicDetailView({
  id,
  articles,
  events,
}: {
  id: string
  articles: TopicArticle[]
  events: TopicEvent[]
}) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const topic = TOPICS.find(item => item.id === id)
  if (!topic) return null
  const others = TOPICS.filter(item => item.id !== topic.id)

  return (
    <main id="main-content" className="ed-container rs-detail" lang={zh ? 'zh-CN' : 'en'}>
      <DocumentTitle zh={`${topic.name} | 非凡资本研究方向`} en={`${topic.name} | UniqueCapital`} />
      <header className="rs-article-header">
        <p className="ed-eyebrow">{zh ? '研究方向' : 'Research direction'}</p>
        <h1>{topic.name}</h1>
      </header>
      <article className="rs-prose">
        <h2>{topic.title[lang]}</h2>
        <p>{topic.description[lang]}</p>
        <h2>{zh ? '近期文章' : 'Recent articles'}</h2>
        <p>{zh ? '按原始发表日期排列。下列标题为中文文章档案。' : 'Ordered by original publication date. Titles below are from the Chinese archive.'}</p>
        <ul>
          {articles.map(article => (
            <li key={article.slug}>
              <Link href={`/research/${article.slug}`}>{article.title}</Link>
              {' — '}
              <time dateTime={article.publishedAt}>{article.publishedAt.slice(0, 10)}</time>
            </li>
          ))}
        </ul>
        <p><Link href={zh ? `/research?topic=${topic.id}` : '/en/research'}>{zh ? '浏览此方向全部文章 →' : 'Browse English articles →'}</Link></p>
        <h2>{zh ? '相关活动' : 'Related events'}</h2>
        {events.length ? (
          <ul>
            {events.map(event => (
              <li key={event.id}>
                {event.articleHref ? <Link href={event.articleHref}>{eventChromeTitle(event, lang)}</Link> : eventChromeTitle(event, lang)}
                {' — '}
                <time dateTime={event.date}>{event.date}</time>
                {' · '}
                <a href={event.bloomHref} target="_blank" rel="noopener noreferrer">{zh ? '报名 ↗' : 'Sign up ↗'}</a>
              </li>
            ))}
          </ul>
        ) : <p>{zh ? '暂无此方向的站内活动导读。' : 'No on-site event brief for this direction yet.'}</p>}
        <p><Link href={researchHubPath('events-awards', lang)}>{zh ? '浏览活动与奖项 →' : 'Events & awards →'}</Link></p>
        <h2>{zh ? '其他研究方向' : 'Other directions'}</h2>
        <ul>{others.map(other => <li key={other.id}><Link href={`/topics/${other.id}`}>{other.name}</Link></li>)}</ul>
        <p><Link href="/topics">{zh ? '返回研究方向' : 'Back to research directions'}</Link></p>
      </article>
    </main>
  )
}

export type HubEvent = TopicEvent & {
  topic?: string
  location?: { zh?: string; en?: string }
  timeText?: string
  description?: { zh?: string; en?: string }
  status?: string
}

export function EventsHubView({ events }: { events: HubEvent[] }) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const labels = eventStatusLabel[lang]

  return (
    <main id="main-content" className="ed-container rs-library" lang={zh ? 'zh-CN' : 'en'}>
      <DocumentTitle zh="活动文章 · 非凡资本" en="Event briefs · UniqueCapital" />
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">{zh ? '活动文章' : 'Event briefs'}</p>
          <h1>{zh ? '活动文章' : 'Event briefs'}</h1>
          <p>{zh ? '把公开活动的时间、地点与议题留在本站，便于阅读与引用；报名与现场信息以 UniqueBloom 为准。' : 'Time, place, and topic stay on this site for reading and citation. Sign-up and on-site details stay on UniqueBloom.'}</p>
          <p>
            <Link href={zh ? '/research' : '/en/research'}>{zh ? '研究与洞察' : 'Research'}</Link>
            {!zh && <>
              {' · '}
              <Link href="/en/research/rankings">Data & Rankings</Link>
              {' · '}
              <Link href="/en/research/events-awards">Events & Awards</Link>
            </>}
            {' · '}
            <a href={LINKS.events} target="_blank" rel="noopener noreferrer">{zh ? 'UniqueBloom 活动日历 ↗' : 'UniqueBloom calendar ↗'}</a>
          </p>
        </div>
        <div className="rs-total">
          <strong>{events.length}</strong>
          <span>{zh ? '篇活动导读' : 'event briefs'}</span>
        </div>
      </div>
      <div className="rs-grid">
        {events.map(event => {
          const status = (event.status && event.status in labels ? event.status : 'past') as keyof typeof labels
          const topicName = TOPICS.find(topic => topic.id === event.topic)?.name ?? (zh ? '活动' : 'Event')
          return (
            <article key={event.id} className="rs-card">
              <div className="rs-meta">
                <span>{topicName}</span>
                <span>{labels[status] ?? labels.past}</span>
              </div>
              <Link href={event.articleHref || researchHubPath('events-awards', lang)} className="rs-card-link">
                <h2>{eventChromeTitle(event, lang)}</h2>
                <p>{zh ? event.description?.zh : eventScheduleLine(event, 'en')}</p>
              </Link>
              <div className="rs-card-bottom">
                <time dateTime={event.date}>{event.date.replaceAll('-', '.')}</time>
                <span>{event.location?.zh}</span>
                <Link href={event.articleHref || researchHubPath('events-awards', lang)} aria-label={zh ? `阅读：${eventChromeTitle(event, 'zh')}` : `Read: ${eventChromeTitle(event, 'en')}`}>↗</Link>
              </div>
              <p>
                <a href={event.bloomHref} target="_blank" rel="noopener noreferrer">{zh ? '报名/详情 ↗' : 'Sign up ↗'}</a>
              </p>
            </article>
          )
        })}
      </div>
      <p className="rs-source-note">
        {zh ? '完整活动列表与报名：' : 'Full calendar and sign-up: '}
        <a href={LINKS.events} target="_blank" rel="noopener noreferrer">UniqueBloom ↗</a>
      </p>
    </main>
  )
}

export function EventArticleView({
  event,
  topicName,
  topicHref,
  html,
  related,
}: {
  event: HubEvent
  topicName?: string
  topicHref?: string
  html: string
  related: TopicArticle[]
}) {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const title = eventChromeTitle(event, lang)

  return (
    <main id="main-content" className="ed-container rs-detail" lang={zh ? 'zh-CN' : 'en'}>
      <DocumentTitle zh={`${eventChromeTitle(event, 'zh')} | 非凡资本活动`} en={`${eventChromeTitle(event, 'en')} | UniqueCapital`} />
      <nav className="rs-breadcrumb" aria-label={zh ? '当前位置' : 'Breadcrumb'}>
        <Link href={researchHubPath('events-awards', lang)}>{zh ? '活动与奖项' : 'Events & Awards'}</Link>
        <span>/</span>
        {topicHref ? <Link href={topicHref}>{topicName}</Link> : <span>{zh ? '活动' : 'Event'}</span>}
      </nav>
      <header className="rs-article-header">
        <p className="ed-eyebrow">{zh ? '活动导读' : 'Event brief'}</p>
        <h1>{title}</h1>
        <div className="rs-byline">
          {event.city && <span>{event.location?.zh || event.city}</span>}
          <time dateTime={event.date}>{event.date.replaceAll('-', '.')}</time>
          {zh && event.timeText ? <span>{event.timeText}</span> : null}
          <a href={event.bloomHref} target="_blank" rel="noopener noreferrer">{zh ? 'UniqueBloom 活动页 ↗' : 'UniqueBloom event page ↗'}</a>
        </div>
      </header>
      {!zh && <p className="rs-media-note">The brief below is the Chinese on-site write-up. Sign-up and the agenda stay on UniqueBloom.</p>}
      <article className="rs-prose" lang="zh-CN" dangerouslySetInnerHTML={{ __html: html }} />
      <section className="rs-related">
        <p className="ed-eyebrow">{zh ? '报名' : 'Sign up'}</p>
        <h2>{zh ? '报名与详情' : 'Sign-up and details'}</h2>
        <p>
          <a href={event.bloomHref} target="_blank" rel="noopener noreferrer" className="ed-link">
            {zh ? '在 UniqueBloom 查看报名与议程 ↗' : 'Sign up and view the agenda on UniqueBloom ↗'}
          </a>
        </p>
        <p className="ed-muted">{zh ? '完整日程、嘉宾与票务以活动页实时信息为准。' : 'The live agenda, speakers, and tickets are on the event page.'}</p>
      </section>
      {related.length > 0 && (
        <section className="rs-related">
          <p className="ed-eyebrow">{zh ? '相关研究' : 'Related research'}</p>
          <h2>{zh ? '相关研究文章' : 'Related research'}</h2>
          {!zh && <p className="ed-muted">Titles below are from the Chinese archive.</p>}
          <div>
            {related.map(article => (
              <Link key={article.slug} href={`/research/${article.slug}`}>
                <time>{article.publishedAt.slice(0, 10)}</time>
                <h3>{article.title}</h3>
                <span>{zh ? '阅读全文 ↗' : 'Read ↗'}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <p className="ed-muted">
        {zh ? '更多公开活动见 ' : 'More public events: '}
        <a href={LINKS.events} target="_blank" rel="noopener noreferrer">{zh ? 'UniqueBloom 活动日历 ↗' : 'UniqueBloom calendar ↗'}</a>
      </p>
      <Link href={researchHubPath('events-awards', lang)} className="rs-back">{zh ? '← 返回活动与奖项' : '← Back to events & awards'}</Link>
    </main>
  )
}

export function ForAiView({ sampleDate, sampleMarkdown, sampleAlias }: { sampleDate?: string; sampleMarkdown: string; sampleAlias: string }) {
  const { lang } = useLang()
  const zh = lang === 'zh'

  return (
    <main id="main-content" className="ed-container rs-library ed-secondary" lang={zh ? 'zh-CN' : 'en'}>
      <DocumentTitle zh="给 AI 的读取接口 | 非凡资本" en="For AI | UniqueCapital" />
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">{zh ? '机器接口 / 非凡产研' : 'Machine interface / UniqueResearch'}</p>
          <h1>{zh ? '给 AI 的读取接口' : 'For AI'}</h1>
          <p>
            {zh ? (
              <>本页列出机器入口与建议读取顺序。中文为主要语言。人类读者可以继续去<Link href="/research">研究文章库</Link>。模型请按顺序读取，再按需取单篇 Markdown。</>
            ) : (
              <>Machine entry points and a suggested read order. Chinese is the primary archive. People can keep reading in the <Link href="/en/research">English research library</Link>, the <Link href="/en/research/rankings">data and rankings list</Link>, or the <Link href="/en/research/events-awards">events and awards list</Link>. Models should follow the order, then fetch one Markdown article.</>
            )}
          </p>
        </div>
      </div>
      <article className="rs-prose">
        <h2>{zh ? '建议读取顺序' : 'Suggested order'}</h2>
        <ol className="ed-agent-order">
          {AGENT_READ_ORDER.map(item => (
            <li key={item.path}>
              <a href={item.path}><code>{item.path}</code></a>
              <span>{zh ? item.step : READ_ORDER_EN[item.path]}</span>
            </li>
          ))}
        </ol>
        <h2>{zh ? '机器 URL' : 'Machine URLs'}</h2>
        <table className="ed-agent-index">
          <caption>{zh ? '公开机器入口。正文不在这些索引文件里。' : 'Public machine entry points. Article bodies are not in these index files.'}</caption>
          <thead>
            <tr><th scope="col">{zh ? '地址' : 'URL'}</th><th scope="col">{zh ? '用途' : 'Purpose'}</th></tr>
          </thead>
          <tbody>
            {AGENT_SURFACES.map(item => (
              <tr key={item.path}>
                <td><a href={absoluteAgentUrl(item.path)}><code>{item.path}</code></a></td>
                <td>{zh ? item.purpose : SURFACE_EN[item.path]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <h2>{zh ? '取一篇文章的 Markdown' : 'Fetch one Markdown article'}</h2>
        {zh ? (
          <>
            <p>网页与 Markdown 由同一份存档正文生成。Markdown 响应为 <code>text/markdown; charset=utf-8</code>，含 YAML frontmatter。图片和视频没有文字转写。</p>
            <ul>
              <li>规范地址：<code>{'/research/{slug}/markdown'}</code>，英文 <code>{'/en/research/{slug}/markdown'}</code>。<code>index.json</code> 的 <code>markdownUrl</code> 指向这里。</li>
              <li>别名：<code>{'/research/{slug}.md'}</code> 与 <code>{'/en/research/{slug}.md'}</code>，返回同一份正文。<code>/research/latest.md</code> 仍是滚动摘要，不是文章别名。</li>
              <li>文章 HTML 含 <code>{'<link rel="alternate" type="text/markdown">'}</code>，并带 HTTP 头 <code>{`Link: <${sampleMarkdown}>; rel="alternate"; type="text/markdown"`}</code>。</li>
              <li>同一篇文章 URL 不按 <code>Accept: text/markdown</code> 切换，浏览器始终得到 HTML。</li>
            </ul>
          </>
        ) : (
          <>
            <p>The HTML page and the Markdown file are generated from the same archived text. The Markdown response is <code>text/markdown; charset=utf-8</code> with YAML frontmatter. Images and video have no transcript.</p>
            <ul>
              <li>Canonical path: <code>{'/research/{slug}/markdown'}</code>, English <code>{'/en/research/{slug}/markdown'}</code>. <code>markdownUrl</code> in <code>index.json</code> points here.</li>
              <li>Alias: <code>{'/research/{slug}.md'}</code> and <code>{'/en/research/{slug}.md'}</code> return the same text. <code>/research/latest.md</code> stays a rolling summary.</li>
              <li>Article HTML includes <code>{'<link rel="alternate" type="text/markdown">'}</code> and the HTTP header <code>{`Link: <${sampleMarkdown}>; rel="alternate"; type="text/markdown"`}</code>.</li>
              <li>The article URL does not switch on <code>Accept: text/markdown</code>. Browsers always receive HTML.</li>
            </ul>
          </>
        )}
        {sampleDate && (
          <p>
            {zh ? `当前一条示例（${sampleDate}）：` : `One current example (${sampleDate}): `}
            <a href={sampleMarkdown}><code>{sampleMarkdown}</code></a>
            {zh ? ' 或 ' : ' or '}
            <a href={sampleAlias}><code>{sampleAlias}</code></a>
          </p>
        )}
        <h2>{zh ? '可复制提示词' : 'Copyable prompt'}</h2>
        <AgentCopyBlocks
          lang={lang}
          promptText={zh ? AGENT_PROMPT_TEXT : AGENT_PROMPT_TEXT_EN}
          curlLlms={AGENT_CURL_LLMS}
          curlLatest={AGENT_CURL_LATEST}
          curlArticle={AGENT_CURL_ARTICLE}
        />
        <p>
          {zh ? <>引用细则见 <Link href="/for-models">公开内容与引用说明</Link>。本页不授予额外内容许可。</> : <>Citation rules are on <Link href="/for-models">the citation page</Link>. This page does not grant extra content rights.</>}
        </p>
      </article>
    </main>
  )
}

export function ForModelsView() {
  const { lang } = useLang()
  const zh = lang === 'zh'

  return (
    <main id="main-content" className="ed-container rs-detail" lang={zh ? 'zh-CN' : 'en'}>
      <DocumentTitle zh="公开内容与引用说明 | 非凡资本" en="Citation notes | UniqueCapital" />
      <header className="rs-article-header">
        <p className="ed-eyebrow">{zh ? '引用说明' : 'Citation'}</p>
        <h1>{zh ? '公开内容与引用说明' : 'Public content and citation'}</h1>
      </header>
      <article className="rs-prose">
        <h2>{zh ? '非凡资本是谁' : 'Who UniqueCapital is'}</h2>
        {zh ? (
          <>
            <p>非凡资本（UniqueCapital）是一家以 AI 研究为基础的产业资本与生态机构；其研究品牌非凡产研（UniqueResearch）持续跟踪全球 AI 融资、订阅收入与产品流量数据。</p>
            <p>非凡产研（UniqueResearch）是本站研究内容使用的名称与发布署名。文章库与榜单是不同的内容入口。</p>
          </>
        ) : (
          <>
            <p>UniqueCapital is an industry capital and ecosystem organization built on AI research. UniqueResearch is its research brand and tracks AI funding, subscription revenue, and product traffic.</p>
            <p>UniqueResearch is the byline on this archive. The article library and the rankings are separate destinations.</p>
          </>
        )}
        <h2>{zh ? '如何引用文章' : 'How to cite'}</h2>
        {zh ? (
          <>
            <p>文章中的“非凡产研”是原始发布账号署名，不代表已核实个人执笔作者。引用访谈或圆桌观点时，应按正文标明具体发言人及当时身份；无法确认时不要推断。日期为原始发表日期。</p>
            <p>建议引用格式：文章标题，非凡产研（发布账号），原始发表日期，原文链接；若引用具体发言，另列正文中的发言人。本站保存的原文片段和人物身份均应放回当时语境中理解。</p>
            <p>主题和标签是站内检索分类。缺少正文、图片或视频转写的页面会标注内容缺口；不可据此补写不存在的全文。本站未提供个人作者或更新日期时，请勿推断。</p>
          </>
        ) : (
          <>
            <p>The byline UniqueResearch is the publication account, not a verified individual author. Attribute interview remarks to the speaker and the role given in the text. Do not infer a speaker or an update date. Dates are original publication dates.</p>
            <p>Suggested citation: article title, UniqueResearch (publication account), original publication date, source link. Quoted remarks should name the speaker in the text. Read excerpts in their original context.</p>
            <p>Topics and tags are on-site categories. Pages with missing text, images, or video transcripts say so. Do not fill those gaps.</p>
          </>
        )}
        <h2>{zh ? '研究方向' : 'Research directions'}</h2>
        <ul>{TOPICS.map(topic => <li key={topic.id}><Link href={`/topics/${topic.id}`}>{topic.name}</Link>{zh ? '：' : ': '}{topic.description[lang]}</li>)}</ul>
        <h2>{zh ? '产品与入口' : 'Products'}</h2>
        <ul>{PRODUCTS.map(product => <li key={product.id}><Link href={`/products/${product.id}`}>{product.name[lang]}</Link>{zh ? '：' : ': '}{product.description[lang]}</li>)}</ul>
        <h2>{zh ? '公开数据格式' : 'Public data formats'}</h2>
        <ul>
          <li><Link href="/for-ai">{zh ? '给 AI 的读取接口' : 'For AI'}</Link>{zh ? '：机器 URL 目录与单篇 Markdown 取法。' : ': machine URLs and how to fetch one Markdown article.'}</li>
          <li><Link href="/en/research">{zh ? '英文研究文章' : 'English research articles'}</Link>{zh ? '：可在本站阅读全文，每篇保留原始发布链接与 Markdown。' : ': full text on this site, with the original publication link and Markdown.'}</li>
          {!zh && <li><Link href="/en/research/rankings">Data & Rankings</Link>: English funding, revenue, traffic, and ranking articles.</li>}
          {!zh && <li><Link href="/en/research/events-awards">Events & Awards</Link>: English award results and event articles. Registration stays on UniqueBloom.</li>}
          <li><Link href="/research">{zh ? '研究文章库' : 'Chinese research archive'}</Link>{zh ? '：可直接读取的网页正文，每篇文章提供 Markdown 链接。' : ': on-site article text, each with a Markdown link. Titles and bodies are Chinese.'}</li>
          <li><a href="/research/index.json">{zh ? '文章索引 JSON' : 'Article index JSON'}</a>{zh ? '：标题、发布账号、原始日期、来源、标签和正文地址。' : ': titles, byline, original dates, sources, tags, and body URLs.'}</li>
          <li><a href="/llms.txt">llms.txt</a>{zh ? '：简明站点导航。' : ': short site guide.'}</li>
          <li><a href="/llms-full.txt">llms-full.txt</a>{zh ? '：有界上下文，不含全部文章正文。' : ': bounded context, without every article body.'}</li>
          <li><a href="/sitemap.xml">sitemap.xml</a>{zh ? '：公开页面目录。' : ': public page list.'}</li>
        </ul>
        <p>{zh ? 'Markdown 与网页由同一份存档正文生成。原文与本站存档不一致时，请核对原始发布版本；活动事实以 UniqueBloom 公开活动页为准。公开读取入口不授予额外内容许可。' : 'Markdown and HTML come from the same archived text. If they differ from the original publication, check that source. Event facts follow the public UniqueBloom page. These entry points do not grant extra content rights.'}</p>
      </article>
    </main>
  )
}
