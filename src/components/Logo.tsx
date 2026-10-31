"use client"

import { BrandMark } from '@/components/BrandMark'
import { useLang } from '@/context/LangContext'
import { useSubdomain } from '@/hooks/useSubdomain'

export function Logo({ size = 32, animated = true }: { size?: number; animated?: boolean }) {
  const { lang } = useLang()
  const { isSubdomain, mainSiteUrl } = useSubdomain()

  const homeUrl = isSubdomain ? mainSiteUrl : '/'
  const brandName = lang === 'zh' ? '非凡资本' : 'UniqueCapital'
  const homeLabel = lang === 'zh' ? '非凡资本首页' : 'UniqueCapital homepage'

  return (
    <a
      href={homeUrl}
      aria-label={homeLabel}
      className="inline-flex items-center gap-2 select-none transition-opacity hover:opacity-80"
    >
      <BrandMark size={size} animated={animated} className="brand-logo-mark" />
      <span
        className="brand-wordmark whitespace-nowrap text-lg font-semibold leading-none tracking-normal [font-family:inherit]"
        suppressHydrationWarning
      >
        {brandName}
      </span>
    </a>
  )
}
