import type { Metadata } from 'next'
import Link from 'next/link'
import { AgentCopyBlocks } from '@/components/editorial-home/AgentCopyBlocks'
import { StructuredData } from '@/components/StructuredData'
import { AGENT_CURL_ARTICLE, AGENT_CURL_LATEST, AGENT_CURL_LLMS, AGENT_PROMPT_TEXT } from '@/content/home-agent-kit.mjs'
import { homeLlmsDataPoints } from '@/content/home-llms-points.mjs'
import { AGENT_READ_ORDER, AGENT_SURFACES, absoluteAgentUrl } from '@/content/agent-surfaces.mjs'
import { breadcrumbs, SITE_URL } from '@/content/site-identity.mjs'

export const metadata: Metadata = {
  title: '给 AI 的读取接口 | 非凡资本',
  description: '非凡产研机器可读入口：建议读取顺序、llms.txt、llms-full.txt、文章索引、单篇 Markdown 与引用规则。',
  alternates: { canonical: `${SITE_URL}/for-ai` },
}

export default function ForAiPage() {
  const sample = homeLlmsDataPoints()[0]
  const sampleSlug = sample?.href.split('/').pop()
  const sampleMarkdown = sampleSlug ? `${SITE_URL}/research/${sampleSlug}/markdown` : `${SITE_URL}/research/{slug}/markdown`
  const sampleAlias = sampleSlug ? `${SITE_URL}/research/${sampleSlug}.md` : `${SITE_URL}/research/{slug}.md`

  return (
    <main id="main-content" className="ed-container rs-detail" lang="zh-CN">
      <StructuredData data={breadcrumbs([{ name: '给 AI 的读取接口', url: '/for-ai' }])} />
      <header className="rs-article-header">
        <p className="ed-eyebrow">AGENT INTERFACE / 非凡产研</p>
        <h1>给 AI 的读取接口</h1>
        <p>本页列出机器入口与建议读取顺序。中文为主要语言。人类读者可以继续去<Link href="/research">研究文章库</Link>。模型请按顺序读取，再按需取单篇 Markdown。</p>
      </header>
      <article className="rs-prose">
        <h2>建议读取顺序</h2>
        <ol className="ed-agent-order">
          {AGENT_READ_ORDER.map(item => (
            <li key={item.path}>
              <a href={item.path}><code>{item.path}</code></a>
              <span>{item.step}</span>
            </li>
          ))}
        </ol>

        <h2>机器 URL</h2>
        <table className="ed-agent-index">
          <caption>公开机器入口。正文不在这些索引文件里。</caption>
          <thead>
            <tr><th scope="col">URL</th><th scope="col">用途</th></tr>
          </thead>
          <tbody>
            {AGENT_SURFACES.map(item => (
              <tr key={item.path}>
                <td><a href={absoluteAgentUrl(item.path)}><code>{item.path}</code></a></td>
                <td>{item.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>取一篇文章的 Markdown</h2>
        <p>网页与 Markdown 由同一份存档正文生成。Markdown 响应为 <code>text/markdown; charset=utf-8</code>，含 YAML frontmatter。图片和视频没有文字转写。</p>
        <ul>
          <li>规范地址：<code>{'/research/{slug}/markdown'}</code>，英文 <code>{'/en/research/{slug}/markdown'}</code>。<code>index.json</code> 的 <code>markdownUrl</code> 指向这里。</li>
          <li>别名：<code>{'/research/{slug}.md'}</code> 与 <code>{'/en/research/{slug}.md'}</code>，返回同一份正文。<code>/research/latest.md</code> 仍是滚动摘要，不是文章别名。</li>
          <li>文章 HTML 含 <code>{'<link rel="alternate" type="text/markdown">'}</code>，并带 HTTP 头 <code>{`Link: <${sampleMarkdown}>; rel="alternate"; type="text/markdown"`}</code>。</li>
          <li>同一篇文章 URL 不按 <code>Accept: text/markdown</code> 切换，浏览器始终得到 HTML。</li>
        </ul>
        {sample && (
          <p>
            当前一条示例（{sample.date}）：
            {' '}<a href={sampleMarkdown}><code>{sampleMarkdown}</code></a>
            {' '}或 <a href={sampleAlias}><code>{sampleAlias}</code></a>
          </p>
        )}

        <h2>可复制提示词</h2>
        <AgentCopyBlocks
          promptText={AGENT_PROMPT_TEXT}
          curlLlms={AGENT_CURL_LLMS}
          curlLatest={AGENT_CURL_LATEST}
          curlArticle={AGENT_CURL_ARTICLE}
        />
        <p>引用细则见 <Link href="/for-models">公开内容与引用说明</Link>。本页不授予额外内容许可。</p>
      </article>
    </main>
  )
}
