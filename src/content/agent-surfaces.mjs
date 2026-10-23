import { SITE_URL } from './site-identity.mjs'

/** Machine-readable surfaces. Purposes stay short so llms.txt and /for-ai stay aligned. */
export const AGENT_SURFACES = [
  {
    path: '/for-ai',
    label: '给 AI',
    purpose: '接口目录：建议读取顺序，以及下面每一个机器 URL 的用途。',
  },
  {
    path: '/llms.txt',
    label: 'llms.txt',
    purpose: '短导航：机构定义、读取步骤、3 个最新数据点、产品与功能入口。',
  },
  {
    path: '/llms-full.txt',
    label: 'llms-full.txt',
    purpose: '有界上下文：定义、引用规则、最新要点与全库指针。不含文章正文。',
  },
  {
    path: '/for-models',
    label: '引用说明',
    purpose: '引用规则：保留发布账号「非凡产研」、原始发表日期与原文链接；勿推断个人作者。',
  },
  {
    path: '/research/index.json',
    label: 'index.json',
    purpose: '全量中文文章元数据：标题、日期、发布账号、出处、markdownUrl、内容缺口。不含正文。',
  },
  {
    path: '/research/latest.md',
    label: 'latest.md',
    purpose: '最近文章的标题、日期、站内链接与一句摘要。',
  },
  {
    path: '/research/rss.xml',
    label: 'rss.xml',
    purpose: '与 latest.md 同一滚动窗口的 RSS 2.0。',
  },
  {
    path: '/sitemap.xml',
    label: 'sitemap.xml',
    purpose: '公开页面目录，含文章 HTML、接口页与 llms-full.txt。',
  },
  {
    path: '/robots.txt',
    label: 'robots.txt',
    purpose: '抓取规则。Content-Signal：search、ai-input、ai-train 均为 yes。',
  },
]

export const AGENT_READ_ORDER = [
  { path: '/for-ai', step: '先看本页，确认有哪些 URL，以及单篇 Markdown 怎么取。' },
  { path: '/llms.txt', step: '读短导航和最新 3 个数据点。' },
  { path: '/llms-full.txt', step: '需要放进上下文的说明时再读。它不是全库全文。' },
  { path: '/for-models', step: '引用或摘录前读规则。' },
  { path: '/research/index.json', step: '按标题、日期和标签选文章，使用每条 markdownUrl。' },
  { path: '/research/latest.md', step: '要最近更新时读滚动摘要，或改用 rss.xml。' },
]

export const AGENT_SITEMAP_PATHS = ['/for-ai', '/llms-full.txt']

export function absoluteAgentUrl(path) {
  return new URL(path, SITE_URL).href
}

export function homeAgentLinks() {
  return [
    { label: '给 AI', href: '/for-ai' },
    { label: 'llms.txt', href: '/llms.txt' },
    { label: 'llms-full.txt', href: '/llms-full.txt' },
    { label: 'latest.md', href: '/research/latest.md' },
    { label: 'index.json', href: '/research/index.json' },
    { label: '引用说明', href: '/for-models' },
  ]
}
