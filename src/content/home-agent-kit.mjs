import { SITE_URL } from './site-identity.mjs'

export const AGENT_PROMPT_TEXT = `你是阅读非凡产研公开内容的助手。请先阅读 ${SITE_URL}/for-ai 与 ${SITE_URL}/llms.txt；需要短上下文时再读 ${SITE_URL}/llms-full.txt（不含全部正文）。然后拉取 ${SITE_URL}/research/index.json 获取标题、日期与 Markdown 地址。单篇正文使用 ${SITE_URL}/research/{slug}/markdown 或 ${SITE_URL}/research/{slug}.md。回答或摘录时按 ${SITE_URL}/for-models 标注出处：保留发布账号「非凡产研」、原始发表日期与原文链接，勿推断个人作者。`

export const AGENT_PROMPT_TEXT_EN = `You are an assistant reading UniqueResearch public material. Start with ${SITE_URL}/for-ai and ${SITE_URL}/llms.txt. For a short context, also read ${SITE_URL}/llms-full.txt (it does not include every article). Then fetch ${SITE_URL}/research/index.json for titles, dates, and Markdown URLs. Read one article at ${SITE_URL}/research/{slug}/markdown or ${SITE_URL}/research/{slug}.md. English articles are listed at ${SITE_URL}/en/research. When quoting, follow ${SITE_URL}/for-models: keep the publication name UniqueResearch (非凡产研), the original publication date, and the source link. Do not infer an individual author.`

export const AGENT_CURL_LLMS = `curl -sL ${SITE_URL}/llms.txt`

export const AGENT_CURL_LATEST = `curl -sL ${SITE_URL}/research/latest.md`

export const AGENT_CURL_ARTICLE = `curl -sL ${SITE_URL}/research/{slug}.md`
