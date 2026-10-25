import type { Metadata } from 'next'
import { breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'
import { ForModelsView } from '@/components/editorial-home/LocalePages'

export const metadata: Metadata = {
  title: '公开内容与引用说明 | 非凡资本',
  description: '机构名称、产品关系、文章出处与机器可读内容入口。',
  alternates: { canonical: 'https://ffcap.cn/for-models' },
}

export default function ForModelsPage() {
  return (
    <>
      <StructuredData data={breadcrumbs([{ name: '公开内容与引用说明', url: '/for-models' }])} />
      <ForModelsView />
    </>
  )
}
