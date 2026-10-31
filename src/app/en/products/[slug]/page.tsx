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
        title: `${product.name.en} | UniqueCapital products`,
        description: product.description.en,
        alternates: {
          canonical: `${SITE_URL}/en/products/${product.id}`,
          languages: {
            'zh-CN': `${SITE_URL}/products/${product.id}`,
            en: `${SITE_URL}/en/products/${product.id}`,
          },
        },
      }
    : { title: 'Product not found' }
}

export default function EnglishProductPage({ params }: { params: { slug: string } }) {
  const product = PRODUCTS.find(item => item.id === params.slug)
  if (!product) notFound()

  return (
    <>
      <StructuredData data={breadcrumbs([{ name: product.name.en, url: `/en/products/${product.id}` }])} />
      <ProductDetail slug={product.id} />
    </>
  )
}
