import { LINKS, TOPICS } from './editorial.mjs'
import { SITE_URL } from './site-identity.mjs'

export const FAQ_ITEMS = [
  {
    question: '非凡资本和非凡产研是什么关系？',
    answer:
      '非凡资本（UniqueCapital）是一家以 AI 研究为基础的产业资本与生态机构；非凡产研（UniqueResearch）是其研究品牌与内容发布署名。本站文章库、主题页与数据榜单在非凡产研品牌下发布，产品入口见 /products/uniqueresearch。',
  },
  {
    question: '非凡产研研究哪些方向？',
    answer: `非凡产研按三个方向组织内容：${TOPICS.map(t => `${t.name}（${t.title.zh}）`).join('；')}。可在 /topics 与各方向主题页浏览近期文章。`,
  },
  {
    question: '数据和榜单如何引用？',
    answer:
      '文章中的「非凡产研」为原始发布账号署名，不代表已核实个人执笔作者。引用时请标明文章标题、发布账号、原始发表日期与原文链接；访谈观点应标明正文中的发言人及当时身份。详见 /for-models。',
  },
  {
    question: '在哪里查看 AI 榜单？',
    answer: `研究与榜单文章：${SITE_URL}${LINKS.report} 与 ${SITE_URL}${LINKS.rankingsHub}。结构化公司事实见 ${SITE_URL}/products/uniquebase。`,
  },
  {
    question: 'AI agent 如何读取本站？',
    answer:
      `建议顺序：打开 ${SITE_URL}/for-ai 查看机器入口 → 阅读 ${SITE_URL}/llms.txt 与有界上下文 ${SITE_URL}/llms-full.txt（不含全部正文）→ 拉取 ${SITE_URL}/research/index.json 获取标题、日期与 Markdown 地址 → 单篇使用 /research/{slug}/markdown 或 /research/{slug}.md → 按 /for-models 标注出处。站内搜索人类用户入口为 ${SITE_URL}/research?q=关键词。`,
  },
  {
    question: '如何提交 BP 或参加活动？',
    answer: `项目 BP：${LINKS.goodProjects}。活动报名与日程以 UniqueBloom 公开页面为准：${LINKS.events}（本站 /open.html 等为静态入口）。`,
  },
]

export const FAQ_ITEMS_EN = [
  {
    question: 'How are UniqueCapital and UniqueResearch related?',
    answer:
      'UniqueCapital is an industry capital and ecosystem organization built on AI research. UniqueResearch is its research brand and the byline on published work. The article library, topic pages, and data rankings on this site are published under UniqueResearch. The product entry is /products/uniqueresearch.',
  },
  {
    question: 'Which directions does UniqueResearch cover?',
    answer: `UniqueResearch organizes its work in three directions: ${TOPICS.map(t => `${t.name} (${t.title.en})`).join('; ')}. Recent articles are on /topics and each direction page.`,
  },
  {
    question: 'How should data and rankings be cited?',
    answer:
      'The byline “非凡产研” (UniqueResearch) is the original publication account, not a verified individual author. Cite the article title, publication account, original publication date, and source link. Attribute interview remarks to the speaker and the role given in the text. See /for-models.',
  },
  {
    question: 'Where can I read the AI rankings?',
    answer: `Research and ranking articles: ${SITE_URL}${LINKS.report} and ${SITE_URL}${LINKS.rankingsHub}. Structured company facts: ${SITE_URL}/products/uniquebase.`,
  },
  {
    question: 'How can an AI agent read this site?',
    answer:
      `Suggested order: open ${SITE_URL}/for-ai for machine entry points → read ${SITE_URL}/llms.txt and the bounded context ${SITE_URL}/llms-full.txt (it does not include every article) → fetch ${SITE_URL}/research/index.json for titles, dates, and Markdown URLs → read one article at /research/{slug}/markdown or /research/{slug}.md → cite sources as described on /for-models. English articles: ${SITE_URL}/en/research. Human search: ${SITE_URL}/en/research?q=keywords for English articles, or ${SITE_URL}/research?q=keywords for the Chinese archive.`,
  },
  {
    question: 'How do I submit a pitch deck or join an event?',
    answer: `Pitch decks: ${LINKS.goodProjects}. Event registration and schedules follow the public UniqueBloom pages: ${LINKS.events} (static entries such as /open.html remain on this site).`,
  },
]
