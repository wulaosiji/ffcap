// Identity wording is grounded in the existing About page and editorial product catalog.
export const SITE_URL = 'https://ffcap.cn'

export const HOME_H1 = '非凡产研：以 AI 研究为基础的产业资本与生态机构'

export const HOME_LEAD =
  '非凡资本（UniqueCapital）是一家以 AI 研究为基础的产业资本与生态机构；其研究品牌非凡产研（UniqueResearch）持续跟踪全球 AI 融资、订阅收入与产品流量数据，覆盖 Agentic AI、Physical AI 与 Entertainment AI 三个方向。'

export const IDENTITY = {
  name: '非凡资本',
  alternateName: 'UniqueCapital',
  description: HOME_LEAD,
  research: '非凡产研（UniqueResearch）是本站研究内容使用的名称与发布署名；UniqueResearch 产品入口提供公开 AI 榜单。文章库与榜单是不同的内容入口。',
}
export const CITATION_NOTE = '文章中的“非凡产研”是原始发布账号署名，不代表已核实个人执笔作者。引用访谈或圆桌观点时，应按正文标明具体发言人及当时身份；无法确认时不要推断。日期为原始发表日期，历史信息以发布时点为准。'

/** Official profiles linked from the site footer (SocialLinks) or product catalog; HTTP 200 verified 2026-10-19. */
export const VERIFIED_SAME_AS = [
  'https://www.linkedin.com/company/uniquecapital',
  'https://uniqueresearch.substack.com/',
  'https://luma.com/unique',
  'https://uniquebase.ai/',
]

export function organizationGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: IDENTITY.name,
        alternateName: IDENTITY.alternateName,
        url: SITE_URL,
        description: IDENTITY.description,
        logo: `${SITE_URL}/globe.svg`,
        brand: { '@type': 'Brand', name: '非凡产研', alternateName: 'UniqueResearch' },
        sameAs: [...VERIFIED_SAME_AS],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: '非凡资本 UniqueCapital',
        inLanguage: 'zh-CN',
        publisher: { '@id': `${SITE_URL}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/research?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}
export function breadcrumbs(items) {
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ name: '首页', url: '/' }, ...items].map((item, i) => ({ '@type': 'ListItem', position: i + 1, name: item.name, item: new URL(item.url, SITE_URL).href })) }
}

export function contactPageGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@id': `${SITE_URL}/#organization` },
      {
        '@type': 'ContactPage',
        '@id': `${SITE_URL}/contact#webpage`,
        url: `${SITE_URL}/contact`,
        name: '联系我们 · UniqueCapital',
        inLanguage: ['zh-CN', 'en'],
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntity: {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            email: 'delta.wu@ffcap.cn',
            availableLanguage: ['Chinese', 'English'],
          },
        },
      },
    ],
  }
}
export function serializeStructuredData(value) { return JSON.stringify(value).replaceAll('<', '\\u003c') }
