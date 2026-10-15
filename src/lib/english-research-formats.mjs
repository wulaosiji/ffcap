import TurndownService from 'turndown'
import { gfm } from 'turndown-plugin-gfm'

export function englishArticleMarkdown(article) {
  const converter = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-' })
  converter.use(gfm)
  converter.remove(['script', 'style', 'iframe', 'form'])
  converter.addRule('complex-table', { filter: node => node.nodeName === 'TABLE' && (!node.querySelector('th') || !!node.querySelector('[colspan], [rowspan]')), replacement: (_content, node) => `\n\n${node.outerHTML}\n\n` })
  const canonical = `https://ffcap.cn/en/research/${article.slug}`
  const metadata = { title: article.title, author: article.author, sourcePublication: 'Unique Research Substack', originalPublishedAt: article.publishedAt, canonical, source: article.sourceUrl, language: 'en' }
  const frontmatter = Object.entries(metadata).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n')
  const imageNote = article.missingSourceImageCount ? 'Note: Some images are already unavailable in the public original and are omitted here; the readable article text is preserved.\n\n' : ''
  return `---\n${frontmatter}\n---\n\n# ${article.title.replace(/[\r\n]+/g, ' ')}\n\n${imageNote}${converter.turndown(article.html)}\n\n---\n\nOriginal publication: ${article.sourceUrl}\nOn-site reading page: ${canonical}\n`
}
