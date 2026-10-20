import { LINKS } from './editorial.mjs'

export const HOME_SEARCH_TABS = [
  { id: 'articles', label: '文章', description: '站内研究文章库全文检索' },
  { id: 'rankings', label: '榜单', description: 'AI 产品榜单与研究报告' },
  { id: 'events', label: '活动', description: 'UniqueBloom 公开活动日历' },
  { id: 'bp', label: 'BP', description: '项目 BP 提交入口' },
]

export function homeSearchDestination(tabId, query) {
  const q = (query || '').trim()
  switch (tabId) {
    case 'articles':
      return q ? `/research?q=${encodeURIComponent(q.slice(0, 200))}` : '/research'
    case 'rankings':
      return LINKS.uniqueResearch
    case 'events':
      return LINKS.uniqueBloom
    case 'bp':
      return LINKS.goodProjects
    default:
      return '/research'
  }
}

/** Lightweight client preview — same token rules as server search, index.json fields only. */
export function previewArticleMatches(articles, query, limit = 3) {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8)
  if (!terms.length) return []
  return articles
    .filter(entry => {
      const hay = `${entry.title} ${entry.excerpt || ''} ${(entry.tags || []).join(' ')}`.toLowerCase()
      return terms.every(term => hay.includes(term))
    })
    .slice(0, limit)
}
