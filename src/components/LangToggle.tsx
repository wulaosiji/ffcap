"use client"

import { useSwitchSiteLanguage } from '@/hooks/useSwitchSiteLanguage'

export function LangToggle({ className = 'ed-icon-button ed-language lang-toggle' }: { className?: string }) {
  const { zh, switchLanguage } = useSwitchSiteLanguage()

  return (
    <button
      type="button"
      className={className}
      onClick={switchLanguage}
      aria-label={zh ? 'Switch to English' : '切换为中文'}
    >
      {zh ? 'EN' : '中'}
    </button>
  )
}
