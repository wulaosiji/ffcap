'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLang } from '@/context/LangContext'
import { researchRouteLang, siteLanguageCounterpart } from '@/content/editorial.mjs'
import { englishSlugForChinese, relatedChineseSlug } from '@/content/research/english-related.mjs'

export function useDisplayedLang() {
  const { lang } = useLang()
  const pathname = usePathname()
  return researchRouteLang(pathname) || lang
}

export function useSwitchSiteLanguage() {
  const { setLang } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const displayed = useDisplayedLang()
  const zh = displayed !== 'en'

  const switchLanguage = () => {
    const next = displayed === 'zh' ? 'en' : 'zh'
    try { localStorage.setItem('lang', next) } catch {}
    const paired = siteLanguageCounterpart(pathname, next)
    if (paired) {
      setLang(next)
      router.push(paired)
      return
    }
    if (pathname.startsWith('/en/research/') && next === 'zh') {
      const englishSlug = pathname.slice('/en/research/'.length).split('/')[0]
      const chineseSlug = relatedChineseSlug(`https://uniqueresearch.substack.com/p/${englishSlug}`)
      setLang('zh')
      router.push(chineseSlug ? `/research/${chineseSlug}` : '/research')
      return
    }
    if (pathname.startsWith('/research/') && next === 'en') {
      const chineseSlug = pathname.slice('/research/'.length).split('/')[0]
      const englishSlug = englishSlugForChinese(chineseSlug)
      setLang('en')
      router.push(englishSlug ? `/en/research/${englishSlug}` : `/en/research?related=${encodeURIComponent(chineseSlug)}`)
      return
    }
    setLang(next)
  }

  return { displayed, zh, switchLanguage }
}
