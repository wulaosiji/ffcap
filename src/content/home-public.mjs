import highlights from './research/highlights.json'
import catalog from './research/catalog.json'
import { EVENT_DIRECTORY } from './editorial.events.mjs'
import { LINKS, TOPICS } from './editorial.mjs'
import { HOME_H1, HOME_LEAD, SITE_URL } from './site-identity.mjs'

export { HOME_H1, HOME_LEAD }

export const HOME_TITLE = '非凡产研 UniqueResearch · 非凡资本 | AI 融资、收入与产品数据研究'

export const HOME_META_DESCRIPTION =
  `${HOME_LEAD} 已公开 ${catalog.length}+ 篇中文研究与英文精选文章，每周更新榜单与行业观察。`

export const HOME_OG_IMAGE = '/world/blender/cloud-courtyard-v2-poster-desktop.jpg'

export const FAQ_ITEMS = [
  {
    question: '非凡资本和非凡产研是什么关系？',
    answer:
      '非凡资本（UniqueCapital）是机构主体；非凡产研（UniqueResearch）是其研究内容使用的品牌与发布署名。本站文章库、主题页与数据榜单均在此品牌下发布，产品入口见 /products/uniqueresearch。',
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
      `建议顺序：阅读 ${SITE_URL}/llms.txt → 拉取 ${SITE_URL}/research/index.json 获取标题、日期与 Markdown 地址 → 按 /for-models 的引用说明标注出处。站内搜索人类用户入口为 ${SITE_URL}/research?q=关键词。`,
  },
  {
    question: '如何提交 BP 或参加活动？',
    answer: `项目 BP：${LINKS.goodProjects}。活动报名与日程以 UniqueBloom 公开页面为准：${LINKS.events}（本站 /open.html 等为静态入口）。`,
  },
]

function pickHighlight(slug) {
  return highlights.find(a => a.slug === slug)
}

/** Hero data cards — figures from linked articles; 口径待内容侧核对. */
export function homeDataCards() {
  const sub = pickHighlight('20261014a0cmpf00')
  const traffic = pickHighlight('20261013a0cesd00')
  const upcoming = EVENT_DIRECTORY.find(e => e.status === 'upcoming' && e.date >= '2026-10-01') || EVENT_DIRECTORY[0]
  const cards = []
  if (sub) {
    cards.push({
      kind: 'research',
      stat: '61 亿美元/月',
      label: '9 月全球 AI 订阅收入榜 Top100 预估合计',
      date: sub.publishedAt.slice(0, 10),
      href: `/research/${sub.slug}`,
    })
  }
  if (traffic) {
    cards.push({
      kind: 'research',
      stat: '932 万月活',
      label: '商汤小浣熊 9 月移动端月活（办公智能体观察）',
      date: traffic.publishedAt.slice(0, 10),
      href: `/research/${traffic.slug}`,
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

export function homeLatestAnnouncement() {
  const latest = highlights[0]
  if (!latest) return null
  return {
    title: latest.title,
    date: latest.publishedAt.slice(0, 10),
    href: `/research/${latest.slug}`,
  }
}

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

export function homeAgentLinks() {
  return [
    { label: 'llms.txt', href: '/llms.txt' },
    { label: 'research/index.json', href: '/research/index.json' },
    { label: '引用说明', href: '/for-models' },
  ]
}
