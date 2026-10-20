'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import {
  HOME_SEARCH_TABS,
  homeSearchDestination,
  previewArticleMatches,
} from '@/content/home-hero-search.mjs'
type IndexArticle = {
  slug: string
  title: string
  excerpt?: string
  tags?: string[]
}

export function ResearchHeroSearch({
  agentLinks,
}: {
  agentLinks: { label: string; href: string }[]
}) {
  const [tab, setTab] = useState('articles')
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
    if (tab !== 'articles' || !indexArticles || query.trim().length < 2) return []
    return previewArticleMatches(indexArticles, query, 3)
  }, [tab, indexArticles, query])

  const showEmptyPreview =
    tab === 'articles' && query.trim().length >= 2 && indexArticles && previews.length === 0

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      if (tab === 'articles') return
      event.preventDefault()
      window.location.href = homeSearchDestination(tab, query)
    },
    [tab, query],
  )

  const activeTab = HOME_SEARCH_TABS.find(t => t.id === tab) || HOME_SEARCH_TABS[0]

  return (
    <div className="ed-research-hero__tools">
      <form
        className="ed-research-hero__search-wrap"
        action="/research"
        method="get"
        role="search"
        onSubmit={onSubmit}
      >
        <div className="ed-research-hero__search">
          <label className="sr-only" htmlFor="home-research-q">问非凡产研</label>
          <input
            id="home-research-q"
            name={tab === 'articles' ? 'q' : undefined}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="问非凡产研：例如「9 月 AI 订阅收入榜」「办公智能体」"
            autoComplete="off"
            aria-describedby="home-search-tab-hint"
          />
          <button type="submit" aria-label={`搜索：${activeTab.label}`}>
            <ArrowRight size={20} strokeWidth={1.6} />
          </button>
        </div>

        <div className="ed-research-hero__tabs" role="tablist" aria-label="搜索范围">
          {HOME_SEARCH_TABS.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className="ed-research-hero__tab"
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p id="home-search-tab-hint" className="ed-research-hero__tab-hint">
          {tab === 'articles'
            ? '回车或点击箭头将在研究库中搜索文章。'
            : `将打开${activeTab.label}入口：${homeSearchDestination(tab, query).replace(/^https?:\/\/[^/]+/, '')}`}
        </p>

        {tab === 'articles' && previews.length > 0 && (
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
        {tab === 'articles' && indexError && query.trim().length >= 2 && (
          <p className="ed-research-hero__preview-empty" role="status">
            预览暂不可用，仍可提交搜索在研究库中查找。
          </p>
        )}
      </form>

      <div className="ed-research-hero__ctas">
        <Link className="ed-research-hero__cta ed-research-hero__cta-primary" href="/research">
          进入研究库
        </Link>
      </div>

      <p className="ed-research-hero__agents">
        <span>给 AI：</span>
        {agentLinks.map((link, i) => (
          <span key={link.href}>
            {i > 0 && ' · '}
            <Link href={link.href}>{link.label}</Link>
          </span>
        ))}
      </p>
    </div>
  )
}
