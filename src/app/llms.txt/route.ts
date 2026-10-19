import { IDENTITY, CITATION_NOTE, HOME_H1, HOME_LEAD, SITE_URL } from '@/content/site-identity.mjs'
import { homeAgentLinks, homeDataCards } from '@/content/home-public.mjs'
import { PRODUCTS, TOPICS } from '@/content/editorial.mjs'

export function GET() {
  const cards = homeDataCards()
  const agentLinks = homeAgentLinks()
  const dataLines = cards
    .filter(card => card.kind === 'research')
    .map(card => {
      const path = card.href.startsWith('http') ? card.href.replace(SITE_URL, '') : card.href
      return `- ${card.stat}：${card.label}（${card.date}，${SITE_URL}${path}）`
    })
    .join('\n')

  const body = `# 非凡资本 UniqueCapital

> ${HOME_H1}

${HOME_LEAD}

${IDENTITY.research}

## 给 AI agent 的使用说明

1. 先读本文件与 [公开内容与引用说明](${SITE_URL}/for-models)。
2. 拉取 [公开文章索引 JSON](${SITE_URL}/research/index.json)：含标题、原始日期、发布账号、出处、正文 Markdown 地址及内容缺口标记。
3. 人类用户站内搜索：\`${SITE_URL}/research?q={关键词}\`（GET，服务端检索）。
4. 引用时请保留发布账号「非凡产研」、原始发表日期与原文链接；勿推断个人作者。
5. 快捷入口：${agentLinks.map(l => `[${l.label}](${SITE_URL}${l.href})`).join(' · ')}

## 近期数据点（摘自站内研究，口径待内容侧核对）

${dataLines}

## 机构与引用

- [关于我们](${SITE_URL}/about)
- [常见问题](${SITE_URL}/faq)
- [公开内容与引用说明](${SITE_URL}/for-models)

${CITATION_NOTE}

## 研究

- [中文文章库](${SITE_URL}/research)
- [English article archive](${SITE_URL}/en/research)：可在本站阅读全文并获取 Markdown，保留 Unique Research Substack 原始来源。
- [公开文章索引 JSON](${SITE_URL}/research/index.json)：含标题、原始日期、发布账号、出处、正文 Markdown 地址及内容缺口。
${TOPICS.map(topic => `- [${topic.name}](${SITE_URL}/topics/${topic.id})：${topic.description.zh}`).join('\n')}

## 产品

${PRODUCTS.map(product => `- [${product.name.zh}](${SITE_URL}/products/${product.id})：${product.description.zh}`).join('\n')}

## 功能入口

- [报告](${SITE_URL}/report.html)
- [BP](${SITE_URL}/bp.html)
- [活动](${SITE_URL}/open.html)
- [成都活动](${SITE_URL}/open.html?slug=cd2026)
- [榜单](${SITE_URL}/rankings.html)
- [三维体验「云上的聚落」](${SITE_URL}/world)（需主动进入后加载 WebGL）

活动事实以所链接的 UniqueBloom 公开活动页为准；原文与本站不一致时，请核对原始来源。Markdown 与网页使用同一份存档正文，不包含图片或视频的文字转写。本索引不授予额外内容许可。
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
