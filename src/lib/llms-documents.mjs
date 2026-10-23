import { AGENT_READ_ORDER, AGENT_SURFACES, homeAgentLinks } from '../content/agent-surfaces.mjs'
import { PRODUCTS, TOPICS } from '../content/editorial.mjs'
import { CITATION_NOTE, HOME_H1, HOME_LEAD, IDENTITY, SITE_URL } from '../content/site-identity.mjs'

function surfaceLines(siteUrl = SITE_URL) {
  return AGENT_SURFACES.map(item => `- [${item.label}](${new URL(item.path, siteUrl).href})：${item.purpose}`).join('\n')
}

export function buildLlmsTxt({
  siteUrl = SITE_URL,
  dataPoints = [],
} = {}) {
  const agentLinks = homeAgentLinks()
  const dataLines = dataPoints
    .map(point => `- ${point.date} · ${point.direction} · ${point.title} · ${point.line}（${siteUrl}${point.href}）`)
    .join('\n')

  return `# 非凡资本 UniqueCapital

> ${HOME_H1}

${HOME_LEAD}

${IDENTITY.research}

## 给 AI agent 的使用说明

1. 接口目录：[给 AI](${siteUrl}/for-ai)。有界上下文（定义、引用规则、最新要点与全库指针，不含文章正文）：[llms-full.txt](${siteUrl}/llms-full.txt)。
2. 先读本文件与 [公开内容与引用说明](${siteUrl}/for-models)。
3. 拉取 [公开文章索引 JSON](${siteUrl}/research/index.json)：含标题、原始日期、发布账号、出处、正文 Markdown 地址及内容缺口标记。
4. 订阅出口：[最新研究 Markdown](${siteUrl}/research/latest.md)（最近文章标题/日期/链接/一句摘要）、[RSS 2.0](${siteUrl}/research/rss.xml)。
5. 单篇 Markdown：规范地址 \`${siteUrl}/research/{slug}/markdown\`（英文 \`${siteUrl}/en/research/{slug}/markdown\`）。别名 \`${siteUrl}/research/{slug}.md\`（英文同理）返回同一份 text/markdown，含 YAML frontmatter。文章 HTML 含 \`<link rel="alternate" type="text/markdown">\`，HTTP \`Link\` 头指向规范地址。原文 URL 不按 Accept 切换，浏览器始终得到 HTML。
6. 人类用户站内搜索：\`${siteUrl}/research?q={关键词}\`（GET，服务端检索）。
7. 引用时请保留发布账号「非凡产研」、原始发表日期与原文链接；勿推断个人作者。
8. 快捷入口：${agentLinks.map(link => `[${link.label}](${siteUrl}${link.href})`).join(' · ')}

## 最新 3 个数据点（按 highlights.json 排序，周更 classify 后自动变化）

${dataLines}

## 机构与引用

- [关于我们](${siteUrl}/about)
- [常见问题](${siteUrl}/faq)
- [给 AI 的读取接口](${siteUrl}/for-ai)
- [有界上下文 llms-full.txt](${siteUrl}/llms-full.txt)
- [公开内容与引用说明](${siteUrl}/for-models)

${CITATION_NOTE}

## 研究

- [中文文章库](${siteUrl}/research)
- [English article archive](${siteUrl}/en/research)：可在本站阅读全文并获取 Markdown，保留 Unique Research Substack 原始来源。
- [公开文章索引 JSON](${siteUrl}/research/index.json)：含标题、原始日期、发布账号、出处、正文 Markdown 地址及内容缺口。
- [最新研究 Markdown](${siteUrl}/research/latest.md)、[RSS 2.0](${siteUrl}/research/rss.xml)
${TOPICS.map(topic => `- [${topic.name}](${siteUrl}/topics/${topic.id})：${topic.description.zh}`).join('\n')}

## 产品

${PRODUCTS.map(product => `- [${product.name.zh}](${siteUrl}/products/${product.id})：${product.description.zh}`).join('\n')}

## 功能入口

- [报告](${siteUrl}/report.html)
- [BP](${siteUrl}/bp.html)
- [活动](${siteUrl}/open.html)
- [成都活动](${siteUrl}/open.html?slug=cd2026)
- [榜单](${siteUrl}/rankings.html)
- [三维体验「云上的聚落」](${siteUrl}/world)（需主动进入后加载 WebGL）

活动事实以所链接的 UniqueBloom 公开活动页为准；原文与本站不一致时，请核对原始来源。Markdown 与网页使用同一份存档正文，不包含图片或视频的文字转写。本索引不授予额外内容许可。
`
}

export function buildLlmsFull({
  siteUrl = SITE_URL,
  highlights = [],
} = {}) {
  const highlightLines = highlights
    .map(point => `- ${point.date} · ${point.direction} · [${point.title}](${siteUrl}${point.href}) · ${point.line}`)
    .join('\n')
  const readOrder = AGENT_READ_ORDER
    .map((item, index) => `${index + 1}. [${item.path}](${new URL(item.path, siteUrl).href}) — ${item.step}`)
    .join('\n')

  return `# 非凡资本 UniqueCapital — 有界上下文

> 这是给模型的短上下文，不是全库正文。本文件不收录研究文章正文。全文只在单篇 Markdown。需要目录时读 ${siteUrl}/research/index.json 的 count 与 articles。

## 定义

${HOME_H1}

${HOME_LEAD}

${IDENTITY.research}

非凡资本（UniqueCapital）运营本站。非凡产研（UniqueResearch）是研究品牌与文章发布账号署名。

## 引用规则

${CITATION_NOTE}

建议格式：文章标题，非凡产研（发布账号），原始发表日期，原文链接。访谈或圆桌观点另列正文中的发言人及当时身份。主题和标签是站内检索分类。索引 warnings 或 Markdown 中标出的内容缺口（缺正文、缺图片或视频转写）不可用来补写全文。未提供个人作者或更新日期时，不要推断。

活动事实以所链接的 UniqueBloom 公开活动页为准。原文与本站存档不一致时，核对原始发布版本。公开读取入口不授予额外内容许可。

## 建议读取顺序

${readOrder}

## 机器 URL

${surfaceLines(siteUrl)}

## 如何取一篇 Markdown

- 中文规范地址：\`${siteUrl}/research/{slug}/markdown\`
- 中文别名：\`${siteUrl}/research/{slug}.md\`（与规范地址同一份正文；\`/research/latest.md\` 不是文章别名）
- 英文规范地址：\`${siteUrl}/en/research/{slug}/markdown\`
- 英文别名：\`${siteUrl}/en/research/{slug}.md\`
- \`index.json\` 每条 \`markdownUrl\` 即规范地址。响应为 \`text/markdown; charset=utf-8\`，含 YAML frontmatter。
- 文章 HTML 含 \`<link rel="alternate" type="text/markdown" href="…/markdown">\`。
- 文章 HTML 的 HTTP 头：\`Link: <${siteUrl}/research/{slug}/markdown>; rel="alternate"; type="text/markdown"\`（英文路径同理）。
- 同一篇文章 URL 不按 \`Accept: text/markdown\` 切换。请使用上面的地址，浏览器始终得到 HTML。

## 最新要点

以下为站内 highlights 的前几条，每条只有一句摘要，不是正文。

${highlightLines}

滚动窗口（标题、日期、链接、一句摘要）见 ${siteUrl}/research/latest.md 与 ${siteUrl}/research/rss.xml。

## 全库指针

- 元数据全量：${siteUrl}/research/index.json。字段含 title、originalPublishedAt、publicationAccount、sourceUrl、markdownUrl、warnings。不含 html 或 text。
- 英文全文目录：${siteUrl}/en/research。每篇另有 Markdown。
- 本文件到此结束。不要把未出现的段落当成原文。
`
}
