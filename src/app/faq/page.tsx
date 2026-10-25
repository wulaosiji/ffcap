import type { Metadata } from 'next'
import { StructuredData } from '@/components/StructuredData'
import { EditorialFaq } from '@/components/editorial-home/HomeFaq'
import { FAQ_ITEMS, FAQ_ITEMS_EN, HOME_META_DESCRIPTION, homeFaqGraph } from '@/content/home-public.mjs'
import '../editorial-home.css'

export const metadata: Metadata = {
  title: '常见问题 | 非凡资本',
  description: HOME_META_DESCRIPTION,
  alternates: { canonical: 'https://ffcap.cn/faq' },
}

export default function FaqPage() {
  return (
    <>
      <StructuredData data={homeFaqGraph()} />
      <EditorialFaq zhItems={FAQ_ITEMS} enItems={FAQ_ITEMS_EN} />
    </>
  )
}
