import { IDENTITY, CITATION_NOTE, SITE_URL } from '@/content/site-identity.mjs'
import { PRODUCTS, TOPICS } from '@/content/editorial.mjs'
export function GET() {
  const body = `# 非凡资本 UniqueCapital\n\n> ${IDENTITY.description}\n\n${IDENTITY.research}\n\n## 机构与引用\n\n- [关于我们](${SITE_URL}/about)\n- [公开内容与引用说明](${SITE_URL}/for-models)\n\n${CITATION_NOTE}\n\n## 研究\n\n- [中文文章库](${SITE_URL}/research)
- [English article archive](${SITE_URL}/en/research)：可在本站阅读全文并获取 Markdown，保留 Unique Research Substack 原始来源。\n- [公开文章索引 JSON](${SITE_URL}/research/index.json)：含标题、原始日期、发布账号、出处、正文 Markdown 地址及内容缺口。\n${TOPICS.map(topic => `- [${topic.name}](${SITE_URL}/topics/${topic.id})：${topic.description.zh}`).join('\n')}\n\n## 产品\n\n${PRODUCTS.map(product => `- [${product.name.zh}](${SITE_URL}/products/${product.id})：${product.description.zh}`).join('\n')}\n\n## 功能入口\n\n- [报告](${SITE_URL}/report.html)\n- [BP](${SITE_URL}/bp.html)\n- [活动](${SITE_URL}/open.html)\n- [成都活动](${SITE_URL}/open.html?slug=cd2026)\n- [榜单](${SITE_URL}/rankings.html)\n\n活动事实以所链接的 UniqueBloom 公开活动页为准；原文与本站不一致时，请核对原始来源。Markdown 与网页使用同一份存档正文，不包含图片或视频的文字转写。本索引不授予额外内容许可。\n`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
