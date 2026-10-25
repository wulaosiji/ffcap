'use client'

import { useCallback, useState } from 'react'

function CopyBlock({ label, text, lang = 'zh' }: { label: string; text: string; lang?: 'zh' | 'en' }) {
  const [copied, setCopied] = useState(false)

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [text])

  return (
    <div className="ed-agent-copy">
      <div className="ed-agent-copy__head">
        <span className="ed-agent-copy__label">{label}</span>
        <button type="button" className="ed-agent-copy__btn" onClick={onCopy}>
          {copied ? (lang === 'en' ? 'Copied' : '已复制') : (lang === 'en' ? 'Copy' : '复制')}
        </button>
      </div>
      <pre className="ed-agent-copy__text">{text}</pre>
    </div>
  )
}

export function AgentCopyBlocks({
  promptText,
  curlLlms,
  curlLatest,
  curlArticle,
  lang = 'zh',
}: {
  promptText: string
  curlLlms?: string
  curlLatest?: string
  curlArticle?: string
  lang?: 'zh' | 'en'
}) {
  const en = lang === 'en'
  return (
    <div className="ed-agent-copy-stack" aria-label={en ? 'Copyable instructions for AI' : '给 AI 可复制指令'}>
      <CopyBlock lang={lang} label={en ? 'Agent prompt' : '助手提示词'} text={promptText} />
      {curlLlms ? <CopyBlock lang={lang} label="curl llms.txt" text={curlLlms} /> : null}
      {curlLatest ? <CopyBlock lang={lang} label="curl latest.md" text={curlLatest} /> : null}
      {curlArticle ? <CopyBlock lang={lang} label={en ? 'curl one Markdown article' : '单篇 Markdown'} text={curlArticle} /> : null}
    </div>
  )
}
