import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PRODUCTS } from '@/content/editorial.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'
import { ProductDetail } from '@/components/editorial-home/ProductDetail'

export function generateStaticParams() {
  return PRODUCTS.map(p => ({ slug: p.id }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = PRODUCTS.find(p => p.id === params.slug)
  return product
    ? {
        title: `${product.name.zh} | 非凡资本产品`,
        description: product.description.zh,
        alternates: { canonical: `${SITE_URL}/products/${product.id}` },
      }
    : { title: '产品未找到' }
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = PRODUCTS.find(item => item.id === params.slug)
  if (!product) notFound()

  return (
    <>
      <StructuredData data={breadcrumbs([{ name: product.name.zh, url: `/products/${product.id}` }])} />
      <ProductDetail slug={product.id} />
    </>
  )
}
