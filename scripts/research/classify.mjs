import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyArticle } from '../../src/content/research/taxonomy.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/content/research')
const overridesFile = path.join(root, 'overrides.json')
const overrides = fs.existsSync(overridesFile) ? JSON.parse(fs.readFileSync(overridesFile, 'utf8')) : {}
const source = JSON.parse(fs.readFileSync(path.join(root, 'catalog.json'), 'utf8'))
const catalog = source.map(item => {
  const file = path.join(root, 'articles', `${item.slug}.json`)
  const article = JSON.parse(fs.readFileSync(file, 'utf8'))
  const result = { ...article, ...classifyArticle(article), ...overrides[article.id] }
  if (overrides[article.id]) result.classification = { ...result.classification, needsReview: false, reviewed: true }
  fs.writeFileSync(file, JSON.stringify(result) + '\n')
  const { html, ...index } = result
  return index
})
fs.writeFileSync(path.join(root, 'catalog.json'), JSON.stringify(catalog) + '\n')
const highlights = ['agentic', 'physical', 'entertainment', 'industry'].flatMap(topic => catalog.filter(a => a.topic === topic && !['event', 'recap'].includes(a.type) && !a.sourceIncomplete).slice(0, 4)).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map(({ id, slug, title, excerpt, topic, type, tags, publishedAt }) => ({ id, slug, title, excerpt, topic, type, tags, publishedAt }))
fs.writeFileSync(path.join(root, 'highlights.json'), JSON.stringify(highlights) + '\n')
const count = field => Object.fromEntries([...new Set(catalog.map(a => a[field]))].map(key => [key, catalog.filter(a => a[field] === key).length]))
console.log(JSON.stringify({ total: catalog.length, directions: count('topic'), types: count('type'), review: catalog.filter(a => a.classification.needsReview).length, manualOverrides: Object.keys(overrides).length }, null, 2))
