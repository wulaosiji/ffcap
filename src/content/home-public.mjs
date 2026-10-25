import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import highlights from './research/highlights.json'
import catalog from './research/catalog.json'
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
    answer: `研究与榜单文章：${SITE_URL}${LINKS.report} 与 ${SITE_URL}${LINKS.rankingsHub}。申报榜单见运营提供的表单入口（${LINKS.rankingApplication}）。`,
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

export { homeLlmsDataPoints } from './home-llms-points.mjs'

/** Hero copy scale line — article count only (no duplicate data-news cards). */
export function homeLibraryStatLabel() {
  const local = readLocalHeroStats()
  return local?.library?.stat || `${catalog.length}+ 篇`
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
