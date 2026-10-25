import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

const isBackfillArticle = (article) => article.ingestSource === 'unique-research-backfill'
  || (typeof article.sourceUrl === 'string' && article.sourceUrl.startsWith('https://ffcap.cn/en/research/'))

export function englishArticleMarkdown(article) {
  const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })
  converter.use(gfm)
  converter.remove(['script', 'style', 'iframe', 'form'])
  converter.addRule('complex-table', { filter: node => node.nodeName === 'TABLE' && (!node.querySelector('th') || !!node.querySelector('[colspan], [rowspan]')), replacement: (_content, node) => `\n\n${node.outerHTML}\n\n` })
  const canonical = `https://ffcap.cn/en/research/${article.slug}`
  const sourcePublication = isBackfillArticle(article) ? 'Unique Research (FFCAP English library)' : 'Unique Research Substack'
  const metadata = { title: article.title, author: article.author, sourcePublication, originalPublishedAt: article.publishedAt, canonical, source: article.sourceUrl, language: 'en' }
  if (article.cnSourceUrl) metadata.cnSourceUrl = article.cnSourceUrl
  const frontmatter = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')
  const imageNote = article.missingSourceImageCount ? 'Note: Some images are already unavailable in the public original and are omitted here; the readable article text is preserved.\n\n' : ''
  const attribution = isBackfillArticle(article)
    ? `Editorial English edition published on UniqueCapital: ${canonical}`
    : `Original publication: ${article.sourceUrl}`
  return `---\n${frontmatter}\n---\n\n# ${article.title.replace(/[\r\n]+/g, ' ')}\n\n${imageNote}${converter.turndown(article.html)}\n\n---\n\n${attribution}\nOn-site reading page: ${canonical}\n`
}
