import type { Metadata } from 'next'
import '../editorial-home.css'
import { EditorialContact } from '@/components/editorial-home/EditorialContact'
import { StructuredData } from '@/components/StructuredData'
import { breadcrumbs, contactPageGraph } from '@/content/site-identity.mjs'

export const metadata: Metadata = {
  title: '联系我们 · 非凡资本 UniqueCapital',
  description: '非凡资本公开联系方式：吴畏Delta，delta.wu@ffcap.cn。办公室城市：上海、北京、杭州、广州。',
  alternates: { canonical: 'https://ffcap.cn/contact' },
}

export default function ContactPage() {
  return (
    <>
      <StructuredData data={breadcrumbs([{ name: '联系我们', url: '/contact' }])} />
      <StructuredData data={contactPageGraph()} />
      <EditorialContact />
    </>
  )
}
