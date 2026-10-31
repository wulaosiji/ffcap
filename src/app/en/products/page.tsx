import type { Metadata } from 'next'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'
import { ProductsHub } from '@/components/editorial-home/ProductsHub'

export const metadata: Metadata = {
  title: 'Products · UniqueCapital',
  description:
    'UniqueResearch, UniqueBase, UniqueBloom, and Good Projects: in-mini-program surveys and research lookup, global web data and events, and investor project matching.',
  alternates: {
    canonical: `${SITE_URL}/en/products`,
    languages: { 'zh-CN': `${SITE_URL}/products`, en: `${SITE_URL}/en/products` },
  },
}

export default function EnglishProductsHubPage() {
  return (
    <>
      <StructuredData data={breadcrumbs([{ name: 'Products', url: '/en/products' }])} />
      <ProductsHub />
    </>
  )
}
