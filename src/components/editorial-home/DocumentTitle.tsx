'use client'

import { useEffect } from 'react'
import { useDisplayedLang } from '@/hooks/useSwitchSiteLanguage'

export function DocumentTitle({ zh, en }: { zh: string; en: string }) {
  const lang = useDisplayedLang()
  useEffect(() => {
    document.title = lang === 'en' ? en : zh
  }, [lang, zh, en])
  return null
}
