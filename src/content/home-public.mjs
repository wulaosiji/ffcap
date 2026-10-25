import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import highlights from './research/highlights.json'
import catalog from './research/catalog.json'
import { FAQ_ITEMS, FAQ_ITEMS_EN } from './home-faq.mjs'
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

export { FAQ_ITEMS, FAQ_ITEMS_EN }

export { homeLlmsDataPoints } from './home-llms-points.mjs'

/** Hero copy scale line — article count only (no duplicate data-news cards). */
export function homeLibraryStatLabel() {
  const local = readLocalHeroStats()
  return local?.library?.stat || `${catalog.length}+ 篇`
}

export function homeLibraryCount() {
  const local = readLocalHeroStats()
  const raw = local?.library?.count
  if (Number.isFinite(raw)) return raw
  const parsed = String(local?.library?.stat ?? '').replace(/,/g, '').match(/(\d+)/)
  if (parsed) return Number(parsed[1])
  return catalog.length
}

export { homeLatestAnnouncement, homeLatestEnglishAnnouncement } from './home-announcement.mjs'

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
