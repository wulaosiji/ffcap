'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, Search } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { AGENT_PROMPT_TEXT, AGENT_PROMPT_TEXT_EN } from '@/content/home-agent-kit.mjs'
import { previewArticleMatches } from '@/content/home-hero-search.mjs'
import { AgentCopyBlocks } from './AgentCopyBlocks'

type IndexArticle = {
  slug: string
  title: string
  excerpt?: string
  tags?: string[]
}

const SEARCH_HINT_ID = 'home-research-search-hint'

export function ResearchHeroSearch() {
  const { lang } = useLang()
  const zh = lang === 'zh'
  const [query, setQuery] = useState('')
  const [indexArticles, setIndexArticles] = useState<IndexArticle[] | null>(null)
  const [indexError, setIndexError] = useState(false)

  useEffect(() => {
    if (!zh) {
      setIndexArticles(null)
      setIndexError(false)
      return
    }
    let cancelled = false
    fetch('/research/index.json')
      .then(res => {
        if (!res.ok) throw new Error('index')
        return res.json()
      })
      .then(body => {
        if (!cancelled) setIndexArticles(body.articles || [])
      })
      .catch(() => {
        if (!cancelled) setIndexError(true)
      })
    return () => {
      cancelled = true
    }
  }, [zh])

  const previews = useMemo(() => {
    if (!zh || !indexArticles || query.trim().length < 2) return []
    return previewArticleMatches(indexArticles, query, 3)
  }, [zh, indexArticles, query])

  const showEmptyPreview =
    zh && query.trim().length >= 2 && indexArticles && previews.length === 0

  return (
    <div className="ed-research-hero__tools">
      <form
        className="ed-research-hero__search-wrap"
        action={zh ? '/research' : '/en/research'}
        method="get"
        role="search"
      >
        <div className="ed-research-hero__suggest">
          <div className="ed-research-hero__search">
            <Search className="ed-research-hero__search-icon" size={16} strokeWidth={1.7} aria-hidden />
            <label className="sr-only" htmlFor="home-research-q">{zh ? '问非凡产研' : 'Ask UniqueResearch'}</label>
            <input
              id="home-research-q"
              name="q"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={zh ? '问非凡产研：例如「9 月 AI 订阅收入榜」「办公智能体」' : 'Ask UniqueResearch: try “agents” or “subscription revenue”'}
              autoComplete="off"
              aria-describedby={SEARCH_HINT_ID}
            />
            <button type="submit" aria-label={zh ? '在研究库中搜索文章' : 'Search the research library'}>
              {zh ? '搜索' : 'Search'}
              <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden />
            </button>
          </div>
          <p id={SEARCH_HINT_ID} className="ed-research-hero__tab-hint">
            {zh ? '回车或点击搜索，将在研究库中查找文章。' : 'Press Enter or Search to look through English articles.'}
          </p>

          {previews.length > 0 && (
            <ul className="ed-research-hero__preview" aria-label={zh ? '匹配文章预览' : 'Matching article preview'}>
              {previews.map((item: IndexArticle) => (
                <li key={item.slug}>
                  <Link href={`/research/${item.slug}`}>{item.title}</Link>
                </li>
              ))}
            </ul>
          )}
          {showEmptyPreview && (
            <div className="ed-research-hero__preview-empty" role="status">
              <p>暂未找到匹配文章</p>
              <p>试试更短的关键词，或按回车查看研究库完整结果。</p>
            </div>
          )}
          {zh && indexError && query.trim().length >= 2 && (
            <p className="ed-research-hero__preview-empty" role="status">
              预览暂不可用，仍可提交搜索在研究库中查找。
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

export function ResearchHeroAgents() {
  const { lang } = useLang()
  const zh = lang === 'zh'

  return (
    <div className="ed-research-hero__agents-wrap">
      <p className="ed-research-hero__agents ed-research-hero__agents-intro">
        <span className="ed-research-hero__agents-label">{zh ? '给 AI' : 'For AI'}</span>
        {zh ? (
          <>
            复制下方提示词给助手使用；索引与引用规范见{' '}
            <Link href="/for-ai">/for-ai</Link>
            。
          </>
        ) : (
          <>
            Copy the prompt below for an assistant. Index and citation rules are on{' '}
            <Link href="/for-ai">/for-ai</Link>
            .
          </>
        )}
      </p>
      <AgentCopyBlocks promptText={zh ? AGENT_PROMPT_TEXT : AGENT_PROMPT_TEXT_EN} lang={lang} />
    </div>
  )
}
