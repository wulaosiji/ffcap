import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { PRODUCTS, productExternalHref, productPrimaryHref } from '@/content/editorial.mjs'
import { SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'
import { ProductBilingualCopy } from '@/components/ProductBilingualCopy'

export const metadata: Metadata = {
  title: '产品矩阵 · 非凡资本',
  description:
    'UniqueResearch、UniqueBase、UniqueBloom 与有好项目：问卷与报告查阅、全球数据与活动 Web 产品，以及投资人项目对接。',
  alternates: { canonical: `${SITE_URL}/products` },
}

export default function ProductsHubPage() {
  return (
    <main id="main-content" className="ed-container rs-library" lang="zh-CN">
      <StructuredData data={breadcrumbs([{ name: '产品矩阵', url: '/products' }])} />
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">BUILT FOR BUILDERS</p>
          <h1>产品矩阵</h1>
          <p>从洞察到行动：小程序内的问卷与报告查阅、全球 Web 数据与活动，以及投资人项目对接。</p>
          <p lang="en">
            From insight to action: in-mini-program surveys and research lookup, global web data and events, and investor
            project matching.
          </p>
        </div>
        <div className="rs-total">
          <strong>{PRODUCTS.length}</strong>
          <span>款产品</span>
        </div>
      </div>
      <div className="rs-grid">
        {PRODUCTS.map(product => {
          const primary = productPrimaryHref(product, 'zh')
          const external = productExternalHref(product, 'zh')
          const primaryExternal = primary.startsWith('http')
          const secondary = typeof external === 'string' && external.startsWith('http') && external !== primary
          return (
            <article key={product.id} className="rs-card rs-product-card">
              <div className="rs-meta">
                <span>{product.audience.zh}</span>
                <span lang="en">{product.audience.en}</span>
              </div>
              {primaryExternal ? (
                <a href={primary} className="rs-card-link" target="_blank" rel="noopener noreferrer">
                  <h2>{product.name.zh}</h2>
                  <ProductBilingualCopy description={product.description} />
                </a>
              ) : (
                <Link href={primary} className="rs-card-link">
                  <h2>{product.name.zh}</h2>
                  <ProductBilingualCopy description={product.description} />
                </Link>
              )}
              <div className="rs-card-bottom">
                {primaryExternal ? (
                  <a href={primary} target="_blank" rel="noopener noreferrer">
                    {product.action.zh} <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <Link href={primary}>查看介绍 →</Link>
                )}
                {secondary && (
                  <a className="rs-card-external" href={external} target="_blank" rel="noopener noreferrer">
                    {product.action.zh} <ArrowUpRight size={14} />
                  </a>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </main>
  )
}
