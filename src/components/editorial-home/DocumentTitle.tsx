'use client'

import { useEffect } from 'react'
import { useLang } from '@/context/LangContext'

export function DocumentTitle({ zh, en }: { zh: string; en: string }) {
  const { lang } = useLang()
  useEffect(() => {
    document.title = lang === 'en' ? en : zh
  }, [lang, zh, en])
  return null
}
