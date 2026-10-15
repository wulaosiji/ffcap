"use client"

import Image from 'next/image'
import logoMark from '@/assets/ffcap-logo-mark.png'
import { useLang } from '@/context/LangContext'
import { useSubdomain } from '@/hooks/useSubdomain'

export function Logo({ size = 32 }: { size?: number }) {
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
      <Image
        src={logoMark}
        alt=""
        width={Math.round(size * (logoMark.width / logoMark.height))}
        height={size}
        className="brand-logo-mark shrink-0"
        style={{ height: size, width: 'auto' }}
        aria-hidden="true"
        priority
      />
      <span
        className="brand-wordmark whitespace-nowrap text-lg font-semibold leading-none tracking-normal [font-family:inherit]"
        suppressHydrationWarning
      >
        {brandName}
      </span>
    </a>
  )
}
