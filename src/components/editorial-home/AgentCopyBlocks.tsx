'use client'

import { useCallback, useState } from 'react'

function CopyBlock({ label, text }: { label: string; text: string }) {
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
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre className="ed-agent-copy__text">{text}</pre>
    </div>
  )
}

export function AgentCopyBlocks({ promptText, curlLlms }: { promptText: string; curlLlms: string }) {
  return (
    <div className="ed-agent-copy-stack" aria-label="给 AI 可复制指令">
      <CopyBlock label="Agent 提示词" text={promptText} />
      <CopyBlock label="终端示例" text={curlLlms} />
    </div>
  )
}
