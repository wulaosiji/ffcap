import { SITE_URL } from './site-identity.mjs'

export const AGENT_PROMPT_TEXT = `你是阅读非凡产研公开内容的助手。请先阅读 ${SITE_URL}/llms.txt，再拉取 ${SITE_URL}/research/index.json 获取标题、日期与 Markdown 地址。回答或摘录时按 ${SITE_URL}/for-models 标注出处：保留发布账号「非凡产研」、原始发表日期与原文链接，勿推断个人作者。`

export const AGENT_CURL_LLMS = `curl -sL ${SITE_URL}/llms.txt`

export const AGENT_CURL_LATEST = `curl -sL ${SITE_URL}/research/latest.md`
