import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import highlights from './research/highlights.json'
import catalog from './research/catalog.json'
import { EVENT_DIRECTORY } from './editorial.events.mjs'
import { LINKS, TOPICS } from './editorial.mjs'
import { HOME_H1, HOME_LEAD, SITE_URL } from './site-identity.mjs'

const researchDir = path.dirname(fileURLToPath(import.meta.url)) + '/research'

function readLocalHeroStats() {
  try {
    const raw = fs.readFileSync(path.join(researchDir, 'home-hero-stats.local.json'), 'utf8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export { HOME_H1, HOME_LEAD }

export const HOME_TITLE = '非凡产研 UniqueResearch · 非凡资本 | AI 融资、收入与产品数据研究'

export const HOME_META_DESCRIPTION =
  `${HOME_LEAD} 已公开 ${catalog.length}+ 篇中文研究与英文精选文章，每周更新榜单与行业观察。`

export const HOME_OG_IMAGE = '/world/blender/cloud-courtyard-v2-poster-desktop.jpg'

export const FAQ_ITEMS = [
  {
    question: '非凡资本和非凡产研是什么关系？',
    answer:
      '非凡资本（UniqueCapital）是一家以 AI 研究为基础的产业资本与生态机构；非凡产研（UniqueResearch）是其研究品牌与内容发布署名。本站文章库、主题页与数据榜单在非凡产研品牌下发布，产品入口见 /products/uniqueresearch。',
  },
  {
    question: '非凡产研研究哪些方向？',
    answer: `非凡产研按三个方向组织内容：${TOPICS.map(t => `${t.name}（${t.title.zh}）`).join('；')}。可在 /topics 与各方向主题页浏览近期文章。`,
  },
  {
    question: '数据和榜单如何引用？',
    answer:
      '文章中的「非凡产研」为原始发布账号署名，不代表已核实个人执笔作者。引用时请标明文章标题、发布账号、原始发表日期与原文链接；访谈观点应标明正文中的发言人及当时身份。详见 /for-models。',
  },
  {
    question: '在哪里查看 AI 榜单或申报？',
    answer: `公开 AI 产品榜单与报告入口：${LINKS.report} 与 ${LINKS.uniqueResearch}。申报榜单见运营提供的表单入口（站内链至 ${LINKS.rankingApplication}）。`,
  },
  {
    question: 'AI agent 如何读取本站？',
    answer:
      `建议顺序：打开 ${SITE_URL}/for-ai 查看机器入口 → 阅读 ${SITE_URL}/llms.txt 与有界上下文 ${SITE_URL}/llms-full.txt（不含全部正文）→ 拉取 ${SITE_URL}/research/index.json 获取标题、日期与 Markdown 地址 → 单篇使用 /research/{slug}/markdown 或 /research/{slug}.md → 按 /for-models 标注出处。站内搜索人类用户入口为 ${SITE_URL}/research?q=关键词。`,
  },
  {
    question: '如何提交 BP 或参加活动？',
    answer: `项目 BP：${LINKS.goodProjects}。活动报名与日程以 UniqueBloom 公开页面为准：${LINKS.events}（本站 /open.html 等为静态入口）。`,
  },
]

const FINANCING_CARD_SLUG = '20261016a0disr00'

function pickHighlight(slug) {
  return highlights.find(a => a.slug === slug)
}

function pickCatalog(slug) {
  return catalog.find(a => a.slug === slug)
}

export { homeLlmsDataPoints } from './home-llms-points.mjs'

/** Hero data cards — dates from catalog/highlights; stats from gitignored local file on weekly host when present. */
export function homeDataCards() {
  const local = readLocalHeroStats()
  const financing = pickHighlight(FINANCING_CARD_SLUG) || pickCatalog(FINANCING_CARD_SLUG)
  const sub = pickHighlight('20261014a0cmpf00')
  const upcoming = EVENT_DIRECTORY.find(e => e.status === 'upcoming' && e.date >= '2026-10-01') || EVENT_DIRECTORY[0]
  const cards = []
  cards.push({
    kind: 'research',
    stat: local?.financing?.stat || '542 起',
    label: local?.financing?.label || '2026 年 9 月全球 AI 融资事件（非凡产研盘点）',
    date: (local?.financing?.publishedAt || financing?.publishedAt)?.slice(0, 10) || '2026-10-16',
    href: `/research/${FINANCING_CARD_SLUG}`,
  })
  if (sub) {
    cards.push({
      kind: 'research',
      stat: local?.subscription?.stat || '61 亿美元/月',
      label: local?.subscription?.label || '9 月全球 AI 订阅收入榜 Top100 预估合计',
      date: (local?.subscription?.publishedAt || sub.publishedAt).slice(0, 10),
      href: `/research/${sub.slug}`,
    })
  }
  cards.push({
    kind: 'library',
    stat: `${catalog.length}+ 篇`,
    label: '已公开中文研究文章（站内存档）',
    date: highlights[0]?.publishedAt?.slice(0, 10) || '2026-10-14',
    href: '/research',
  })
  if (upcoming) {
    cards.push({
      kind: 'event',
      stat: upcoming.date.replaceAll('-', '.'),
      label: upcoming.title,
      date: upcoming.date,
      href: upcoming.href.startsWith('http') ? upcoming.href : `${SITE_URL}${upcoming.href}`,
      external: upcoming.href.startsWith('http'),
    })
  }
  return cards
}

export { homeLatestAnnouncement } from './home-announcement.mjs'

export function homeItemListGraph() {
  const items = highlights.slice(0, 6).map((article, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url: `${SITE_URL}/research/${article.slug}`,
    name: article.title,
  }))
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '非凡产研最新研究',
    itemListElement: items,
  }
}

export function homeFaqGraph() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}

export { homeAgentLinks } from './agent-surfaces.mjs'
