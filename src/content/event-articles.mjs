import { EVENT_DIRECTORY } from './editorial.events.mjs'

/** Event slugs with on-site write-ups (P1). Order is hub display priority. */
export const EVENT_ARTICLE_SLUGS = [
  '2026bj',
  'token2026',
  'cd2026',
  'szopenday2026',
  'sh2026',
  'agenticnow03',
]

const SLUG_SET = new Set(EVENT_ARTICLE_SLUGS)

/** @param {string} slug */
export function hasEventArticle(slug) {
  return SLUG_SET.has(slug)
}

/** @param {string} slug */
export function eventArticlePath(slug) {
  return `/events/${slug}`
}

/**
 * Editorial key points and intro overrides where the synced summary is truncated.
 * Wording is taken from UniqueBloom public summaries; no invented speakers or quotes.
 */
const ARTICLE_OVERRIDES = {
  '2026bj': {
    intro:
      '北京站聚焦创作者经济、一人公司与多模态应用，把研究议题带到现场，与创业者和产业伙伴讨论 AI 的下一步。',
    keyPoints: [
      '议题方向：创作者经济、一人公司与多模态应用',
      '面向创业者、创作者与产业伙伴的公开交流场景',
      '报名与议程以 UniqueBloom 活动页实时信息为准',
    ],
  },
  token2026: {
    keyPoints: [
      'TOKEN2049 期间在新加坡留出属于华人创业者的交流夜晚',
      '用普通话讨论 AI、Web3 与全球化创业的真实变化',
      '连接创始团队、全球化从业者、投资人与生态伙伴',
    ],
  },
  cd2026: {
    keyPoints: [
      '两日公开论坛，含 SeaArt 平行分论坛，可多选场次',
      '议题覆盖短剧、漫剧、影视、动画、游戏、音乐、虚拟人与互动内容',
      '关注 AI 文娱从单点生成工具走向完整产业链与全球发行',
    ],
  },
  szopenday2026: {
    keyPoints: [
      '从 AI 硬件到具身智能机器人，聚焦真实产品、交付与全球经营',
      '讨论高频任务、稳定生产、规模交付与正向单位经济',
      '连接产业伙伴，把 Physical AI 议题带回现场',
    ],
  },
  sh2026: {
    keyPoints: [
      '企业 AI 从“能不能用”走向核心业务流程与可验证结果',
      '关注 Deployment、Workflow、Governance、Human in the loop 与 Agent 交付',
      '两日公开论坛，面向 Enterprise AI 与智能体商业闭环',
    ],
  },
  agenticnow03: {
    keyPoints: [
      '主办：加密厨房 × 非凡产研 × 云赛空间',
      '主题：Agent 进入真实行业后的第一仗',
      '讨论 Agent 走出 demo，进入真实行业、生意与经济系统所面临的门槛与惯性',
    ],
  },
}

function sentencesFromSummary(summary) {
  return String(summary ?? '')
    .replace(/\s+/g, ' ')
    .split(/[。！？\n]/)
    .map(s => s.trim())
    .filter(s => s.length >= 14 && !/^时间[：:]/.test(s) && !/^地点[：:]/.test(s) && !/…$/.test(s))
}

function defaultKeyPoints(event) {
  const fromSummary = sentencesFromSummary(event.summary).slice(0, 4)
  if (fromSummary.length >= 2) return fromSummary
  const tagLine = event.tags?.length ? `标签：${event.tags.slice(0, 6).join('、')}` : ''
  return [event.subtitle, tagLine, event.summary].filter(Boolean)
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function formatDateRange(event) {
  const start = event.date
  const end = event.endDate && event.endDate !== event.date ? ` — ${event.endDate}` : ''
  const time = event.timeText ? ` · ${event.timeText}` : ''
  return `${start}${end}${time}`
}

/**
 * @param {typeof EVENT_DIRECTORY[number] & { topic?: string }} event
 */
export function buildEventArticleBody(event) {
  const override = ARTICLE_OVERRIDES[event.slug] ?? {}
  const intro = override.intro ?? sentencesFromSummary(event.summary)[0] ?? event.summary
  const keyPoints = override.keyPoints ?? defaultKeyPoints(event)
  const detailParagraphs = sentencesFromSummary(event.summary).slice(0, 6)

  const pointsHtml = keyPoints
    .map(point => `<li>${escapeHtml(point)}</li>`)
    .join('')

  const detailHtml = detailParagraphs
    .map(p => `<p>${escapeHtml(p)}。</p>`)
    .join('')

  const tagsHtml = (event.tags ?? [])
    .map(tag => `<li>${escapeHtml(tag)}</li>`)
    .join('')

  return `
<h2>活动概览</h2>
<p>${escapeHtml(intro)}</p>
${event.subtitle ? `<p><em>${escapeHtml(event.subtitle)}</em></p>` : ''}
<h2>时间与地点</h2>
<ul>
<li><strong>日期</strong>：${escapeHtml(formatDateRange(event))}</li>
<li><strong>地点</strong>：${escapeHtml(event.location)}（${escapeHtml(event.city)}）</li>
</ul>
<h2>议题与看点</h2>
<ul>${pointsHtml}</ul>
${tagsHtml ? `<h2>主题标签</h2><ul>${tagsHtml}</ul>` : ''}
${detailHtml ? `<h2>活动简介</h2>${detailHtml}` : ''}
<p>报名、日程与现场信息以 <a href="${escapeHtml(event.href)}" rel="noopener noreferrer">UniqueBloom 活动页</a> 为准；与本站存档不一致时请核对原始页面。</p>
`.trim()
}

/** @param {string} slug */
export function getEventDirectoryRecord(slug) {
  return EVENT_DIRECTORY.find(event => event.slug === slug) ?? null
}

/**
 * @param {ReadonlyArray<{ slug: string, title: string, publishedAt: string, topics?: string[], topic?: string, sourceIncomplete?: boolean }>} catalog
 * @param {{ slug: string, topic?: string, tags?: string[] }} event
 * @param {number} [limit]
 */
export function relatedResearchForEvent(catalog, event, limit = 4) {
  const topic = event.topic
  if (!topic || topic === 'all') return []
  return catalog
    .filter(
      article =>
        !article.sourceIncomplete &&
        (article.topics?.includes(topic) || article.topic === topic),
    )
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, limit)
}

/** Homepage events: preserve UniqueBloom directory order (sync `order by date desc`). */
export function homePublicEvents(events, limit = 3) {
  return events.slice(0, limit)
}

/** @param {ReadonlyArray<{ slug: string }>} events */
export function listEventArticles(events) {
  return EVENT_ARTICLE_SLUGS
    .map(slug => events.find(event => event.slug === slug))
    .filter(Boolean)
}
