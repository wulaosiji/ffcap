'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { previewArticleMatches } from '@/content/home-hero-search.mjs'
import { AgentCopyBlocks } from './AgentCopyBlocks'

type IndexArticle = {
  slug: string
  title: string
  excerpt?: string
  tags?: string[]
}

const SEARCH_HINT_ID = 'home-research-search-hint'

export function ResearchHeroSearch({ agentPromptText }: { agentPromptText: string }) {
  const [query, setQuery] = useState('')
  const [indexArticles, setIndexArticles] = useState<IndexArticle[] | null>(null)
  const [indexError, setIndexError] = useState(false)

  useEffect(() => {
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
  }, [])

  const previews = useMemo(() => {
    if (!indexArticles || query.trim().length < 2) return []
    return previewArticleMatches(indexArticles, query, 3)
  }, [indexArticles, query])

  const showEmptyPreview =
    query.trim().length >= 2 && indexArticles && previews.length === 0

  return (
    <div className="ed-research-hero__tools">
      <form
        className="ed-research-hero__search-wrap"
        action="/research"
        method="get"
        role="search"
      >
        <div className="ed-research-hero__search">
          <label className="sr-only" htmlFor="home-research-q">问非凡产研</label>
          <input
            id="home-research-q"
            name="q"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="问非凡产研：例如「9 月 AI 订阅收入榜」「办公智能体」"
            autoComplete="off"
            aria-describedby={SEARCH_HINT_ID}
          />
          <button type="submit" aria-label="在研究库中搜索文章">
            <ArrowRight size={20} strokeWidth={1.6} />
          </button>
        </div>
        <p id={SEARCH_HINT_ID} className="ed-research-hero__tab-hint">
          回车或点击箭头将在研究库中搜索文章。
        </p>

        {previews.length > 0 && (
          <ul className="ed-research-hero__preview" aria-label="匹配文章预览">
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
        {indexError && query.trim().length >= 2 && (
          <p className="ed-research-hero__preview-empty" role="status">
            预览暂不可用，仍可提交搜索在研究库中查找。
          </p>
        )}
      </form>

      <div className="ed-research-hero__agents-wrap">
        <p className="ed-research-hero__agents ed-research-hero__agents-intro">
          <span className="ed-research-hero__agents-label">给 AI</span>
          复制下方提示词给助手使用；索引与引用规范见{' '}
          <Link href="/for-ai">/for-ai</Link>
          。
        </p>
        <AgentCopyBlocks promptText={agentPromptText} />
      </div>
    </div>
  )
}
