import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { SectionIndex } from './SectionIndex'
import { HOME_SECTION_INDEX } from '@/content/home-sections.mjs'

export function WorldTeaser() {
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
          <p className="ed-eyebrow">THE CLOUD SETTLEMENT <SectionIndex index={HOME_SECTION_INDEX.world} /></p>
          <h2 id="world-teaser-title">云上的聚落</h2>
          <p>
            三维导览庭院与协作书院仍保留为可选体验。仅在您主动进入时加载 WebGL 场景，不影响首页阅读与搜索性能。
          </p>
          <Link href="/world" className="ed-link">
            进入云上的聚落
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
