'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { SectionIndex } from './SectionIndex'
import { HOME_SECTION_INDEX } from '@/content/home-sections.mjs'

export function WorldTeaser() {
  const { lang } = useLang()
  const zh = lang === 'zh'

  return (
    <section className="ed-container ed-section ed-world-teaser" aria-labelledby="world-teaser-title">
      <div className="ed-world-teaser__card">
        <div className="ed-world-teaser__visual">
          <Image
            src="/world/blender/cloud-courtyard-v2-poster-desktop.jpg"
            alt=""
            fill
            sizes="(max-width: 760px) 100vw, 360px"
            className="ed-world-teaser__poster"
          />
        </div>
        <div className="ed-world-teaser__copy">
          <p className="ed-eyebrow">{zh ? '可选体验' : 'THE CLOUD SETTLEMENT'} <SectionIndex index={HOME_SECTION_INDEX.world} /></p>
          <h2 id="world-teaser-title">{zh ? '云上的聚落' : 'The cloud settlement'}</h2>
          <p>
            {zh
              ? '三维导览庭院与协作书院仍保留为可选体验。仅在您主动进入时加载三维场景，不影响首页阅读与搜索性能。'
              : 'The 3D guide courtyard and collaborative academy remain an optional visit. The WebGL scene loads only after you choose to enter, and does not affect reading or search on this page.'}
          </p>
          <Link href="/world" className="ed-link">
            {zh ? '进入云上的聚落' : 'Enter the cloud settlement'}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
