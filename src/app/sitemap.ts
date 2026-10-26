import { AGENT_SITEMAP_PATHS } from '@/content/agent-surfaces.mjs'
import { EVENT_ARTICLE_SLUGS, eventArticlePath } from '@/content/event-articles.mjs'
import { LINKS, PRODUCTS, TOPICS } from '@/content/editorial.mjs'
import type { MetadataRoute } from 'next'
import { getResearchCatalog } from '@/lib/research'
import { getEnglishResearchCatalog } from '@/lib/english-research'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://ffcap.cn', changeFrequency: 'weekly', priority: 1 },
    { url: 'https://ffcap.cn/about', changeFrequency: 'monthly', priority: .6 },
    { url: 'https://ffcap.cn/contact', changeFrequency: 'monthly', priority: .55 },
    { url: 'https://ffcap.cn/research', changeFrequency: 'weekly', priority: .9 },
    { url: `https://ffcap.cn${LINKS.rankingsHub}`, changeFrequency: 'weekly', priority: .85 },
    { url: `https://ffcap.cn${LINKS.eventsAwardsHub}`, changeFrequency: 'weekly', priority: .82 },
    { url: 'https://ffcap.cn/research/latest.md', changeFrequency: 'daily', priority: .75 },
    { url: 'https://ffcap.cn/research/rss.xml', changeFrequency: 'daily', priority: .75 },
    { url: 'https://ffcap.cn/en/research', changeFrequency: 'weekly', priority: .7 },
    { url: 'https://ffcap.cn/en/research/rankings', changeFrequency: 'weekly', priority: .72 },
    { url: 'https://ffcap.cn/en/research/events-awards', changeFrequency: 'weekly', priority: .7 },
    { url: 'https://ffcap.cn/for-models', changeFrequency: 'monthly', priority: .5 },
    ...AGENT_SITEMAP_PATHS.map(path => ({
      url: `https://ffcap.cn${path}`,
      changeFrequency: path === '/llms-full.txt' ? 'weekly' as const : 'monthly' as const,
      priority: path === '/for-ai' ? .6 : .55,
    })),
    { url: 'https://ffcap.cn/faq', changeFrequency: 'monthly', priority: .5 },
    { url: 'https://ffcap.cn/world', changeFrequency: 'yearly', priority: .3 },
    { url: 'https://ffcap.cn/products', changeFrequency: 'monthly', priority: .65 },
    { url: 'https://ffcap.cn/topics', changeFrequency: 'monthly', priority: .75 },
    ...PRODUCTS.map(p => ({ url: `https://ffcap.cn/products/${p.id}`, priority: .6 })),
    ...TOPICS.map(t => ({ url: `https://ffcap.cn/topics/${t.id}`, priority: .8 })),
    ...EVENT_ARTICLE_SLUGS.map(slug => ({ url: `https://ffcap.cn${eventArticlePath(slug)}`, changeFrequency: 'weekly' as const, priority: .68 })),
    ...getResearchCatalog().filter(a => !a.sourceIncomplete).map(article => ({ url: `https://ffcap.cn/research/${article.slug}`, priority: .7 })),
    ...getEnglishResearchCatalog().map(article => ({ url: `https://ffcap.cn/en/research/${article.slug}`, priority: .6 })),
  ]
}
