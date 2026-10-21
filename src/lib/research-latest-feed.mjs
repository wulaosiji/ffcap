import { SITE_URL } from '../content/site-identity.mjs'

export const LATEST_FEED_LIMIT = 20

function oneLineSummary(excerpt) {
  const text = (excerpt || '').replace(/\s+/g, ' ').trim()
  if (!text) return ''
  const first = text.split(/[。！？!?]/)[0]?.trim() || text
  return first.length > 120 ? `${first.slice(0, 119)}…` : first
}

export function latestFeedArticles(catalog, limit = LATEST_FEED_LIMIT) {
  return catalog
    .filter(a => !a.sourceIncomplete)
    .slice()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id))
    .slice(0, limit)
}

export function buildLatestMarkdown(articles, siteUrl = SITE_URL) {
  const lines = [
    '# 非凡产研最新研究',
    '',
    `> 机器可读摘要：最近 ${articles.length} 篇中文公开研究。完整索引见 ${siteUrl}/research/index.json；引用规则见 ${siteUrl}/for-models。`,
    '',
  ]
  for (const article of articles) {
    const date = article.publishedAt.slice(0, 10)
    const url = `${siteUrl}/research/${article.slug}`
    const summary = oneLineSummary(article.excerpt)
    lines.push(`- **${date}** [${article.title}](${url})${summary ? ` — ${summary}` : ''}`)
  }
  lines.push('')
  return `${lines.join('\n')}`
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function buildResearchRss(articles, siteUrl = SITE_URL) {
  const items = articles
    .map(article => {
      const link = `${siteUrl}/research/${article.slug}`
      const pub = new Date(article.publishedAt).toUTCString()
      const desc = escapeXml(oneLineSummary(article.excerpt))
      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pub}</pubDate>
      <description>${desc}</description>
    </item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>非凡产研 · 最新研究</title>
    <link>${siteUrl}/research</link>
    <description>非凡产研公开中文研究文章（${articles.length} 篇滚动窗口）</description>
    <language>zh-CN</language>
    <lastBuildDate>${articles[0] ? new Date(articles[0].publishedAt).toUTCString() : new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`
}
