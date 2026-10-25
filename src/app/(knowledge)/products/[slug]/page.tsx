import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PRODUCTS, productExternalHref } from '@/content/editorial.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'
import { ProductBilingualCopy } from '@/components/ProductBilingualCopy'

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

function productCtaHref(p: (typeof PRODUCTS)[number]) {
  return productExternalHref(p, 'zh')
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = PRODUCTS.find(item => item.id === params.slug)
  if (!p) notFound()

  const ctaHref = productCtaHref(p)
  const external = ctaHref.startsWith('http')
  const detailExtra = 'detailExtra' in p ? p.detailExtra : undefined

  return (
    <main id="main-content" className="ed-container rs-detail" lang="zh-CN">
      <StructuredData data={breadcrumbs([{ name: p.name.zh, url: `/products/${p.id}` }])} />
      <header className="rs-article-header">
        <p className="ed-eyebrow">PRODUCT / {p.audience.zh}</p>
        <p className="ed-eyebrow" lang="en">{p.audience.en}</p>
        <h1>{p.name.zh}</h1>
      </header>
      <article className="rs-prose">
        <ProductBilingualCopy description={p.description} />
        {detailExtra && <ProductBilingualCopy description={detailExtra} />}
        {p.id === 'uniqueresearch' && (
          <p>
            <Link href="/research">阅读非凡产研文章</Link> · <Link href="/research/rankings">AI 榜单精选</Link>
            <span lang="en">
              {' '}
              · <Link href="/research">Read articles</Link> · <Link href="/research/rankings">Curated rankings</Link>
            </span>
          </p>
        )}
        <p>
          {external ? (
            <a href={ctaHref} target="_blank" rel="noopener noreferrer">
              {p.action.zh} ↗ <span lang="en">({p.action.en})</span>
            </a>
          ) : (
            <Link href={ctaHref}>
              {p.action.zh} → <span lang="en">({p.action.en})</span>
            </Link>
          )}
        </p>
        <h2>其他产品</h2>
        <ul>
          {PRODUCTS.filter(other => other.id !== p.id).map(other => (
            <li key={other.id}>
              <Link href={`/products/${other.id}`}>{other.name.zh}</Link>：{other.description.zh}
            </li>
          ))}
        </ul>
        <p>
          <Link href="/about">了解非凡资本</Link> · <Link href="/for-models">公开内容与引用说明</Link>
        </p>
      </article>
    </main>
  )
}
