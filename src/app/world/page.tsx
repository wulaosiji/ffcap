import type { Metadata } from 'next'
import { SettlementHero } from '@/components/editorial-home/SettlementHero'
import { EditorialShell } from '@/components/editorial-home/EditorialShell'
import '../editorial-home.css'
import '../settlement.css'
import '../infinite-world.css'

export const metadata: Metadata = {
  title: '云上的聚落 | 非凡资本',
  description: '非凡资本三维导览体验：云岛庭院、协作书院与物理/文娱主题空间。需主动进入后加载 3D 场景。',
  alternates: { canonical: 'https://ffcap.cn/world' },
  robots: { index: true, follow: true },
}

export default function WorldPage() {
  return (
    <EditorialShell cinematic>
      <main id="main-content">
        <SettlementHero />
      </main>
    </EditorialShell>
  )
}
