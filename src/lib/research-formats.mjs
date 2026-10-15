import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'
import { CITATION_NOTE, SITE_URL } from '../content/site-identity.mjs'

export function articleWarnings(article) {
  return [article.sourceIncomplete && '原始来源未提供完整正文；不可把此页视为全文。', article.imageArticle && '此文以图片为主，图片内文字未转录；Markdown 不包含图片内全文。', article.hasVideo && '原文包含视频，请前往原始发布页观看；此处不含视频转写。', article.missingImages?.length > 0 && '部分原始图片缺失，请核对来源。'].filter(Boolean)
}
export function publicResearchEntry(article) {
  return { id: article.id, slug: article.slug, title: article.title, publicationAccount: article.author, originalPublishedAt: article.publishedAt, sourceUrl: article.sourceUrl, sourceAuthorUrl: article.sourceAuthorUrl, url: `${SITE_URL}/research/${article.slug}`, markdownUrl: `${SITE_URL}/research/${article.slug}/markdown`, excerpt: article.excerpt, topics: article.topics, tags: article.tags, type: article.type, warnings: articleWarnings(article) }
}
export function articleMarkdown(article) {
  const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })
  converter.use(gfm)
  converter.remove(['script', 'style', 'iframe'])
  // Preserve complex or headerless source tables as HTML rather than lose their cells.
  converter.addRule('complex-table', { filter: node => node.nodeName === 'TABLE' && (!node.querySelector('th') || !!node.querySelector('[colspan], [rowspan]')), replacement: (_content, node) => `\n\n${node.outerHTML}\n\n` })
  const entry = publicResearchEntry(article)
  const metadata = { title: entry.title, id: entry.id, publicationAccount: entry.publicationAccount, originalPublishedAt: entry.originalPublishedAt, canonical: entry.url, source: entry.sourceUrl, sourceAccount: entry.sourceAuthorUrl, language: 'zh-CN', tags: entry.tags }
  // JSON values are valid YAML scalars and prevent title/source text escaping the front matter.
  const frontmatter = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')
  return `---\n${frontmatter}\n---\n\n# ${article.title.replace(/[\r\n]+/g, ' ')}\n\n${CITATION_NOTE}\n\n${entry.warnings.map(note => `> ${note}\n\n`).join('')}${converter.turndown(article.html)}\n\n---\n\n原始发布版本：${article.sourceUrl}\n\n本站阅读页：${entry.url}\n`
}
