// Identity wording is grounded in the existing About page and editorial product catalog.
export const SITE_URL = 'https://ffcap.cn'
export const IDENTITY = {
  name: '非凡资本',
  alternateName: 'UniqueCapital',
  description: '非凡资本（UniqueCapital）以非凡产研（UniqueResearch）为研究基础，围绕 AI 的技术演进与商业实践，连接创业者、投资人和产业伙伴。',
  research: '非凡产研（UniqueResearch）是本站研究内容使用的名称与发布署名；UniqueResearch 产品入口提供公开 AI 榜单。文章库与榜单是不同的内容入口。',
}
export const CITATION_NOTE = '文章中的“非凡产研”是原始发布账号署名，不代表已核实个人执笔作者。引用访谈或圆桌观点时，应按正文标明具体发言人及当时身份；无法确认时不要推断。日期为原始发表日期，历史信息以发布时点为准。'
export function organizationGraph() {
  return { '@context': 'https://schema.org', '@graph': [
    { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: IDENTITY.name, alternateName: IDENTITY.alternateName, url: SITE_URL, description: IDENTITY.description, sameAs: ['https://www.linkedin.com/company/uniquecapital'] },
    { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: SITE_URL, name: '非凡资本 UniqueCapital', inLanguage: 'zh-CN', publisher: { '@id': `${SITE_URL}/#organization` } },
  ] }
}
export function breadcrumbs(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: '首页', url: '/' }, ...items].map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: new URL(item.url, SITE_URL).href })) }
}
export function serializeStructuredData(value) { return JSON.stringify(value).replaceAll('<', '\\u003c') }
