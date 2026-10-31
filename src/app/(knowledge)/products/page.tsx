import type { Metadata } from 'next'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'
import { ProductsHub } from '@/components/editorial-home/ProductsHub'

export const metadata: Metadata = {
  title: '产品矩阵 · 非凡资本',
  description:
    'UniqueResearch、UniqueBase、UniqueBloom 与有好项目：问卷与报告查阅、全球数据与活动网页产品，以及投资人项目对接。',
  alternates: {
    canonical: `${SITE_URL}/products`,
    languages: { 'zh-CN': `${SITE_URL}/products`, en: `${SITE_URL}/en/products` },
  },
}

export default function ProductsHubPage() {
  return (
    <>
      <StructuredData data={breadcrumbs([{ name: '产品矩阵', url: '/products' }])} />
      <ProductsHub />
    </>
  )
}
