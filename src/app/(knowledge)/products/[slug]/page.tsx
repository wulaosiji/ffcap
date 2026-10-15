import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PRODUCTS } from '@/content/editorial.mjs'
import { IDENTITY, SITE_URL, breadcrumbs } from '@/content/site-identity.mjs'
import { StructuredData } from '@/components/StructuredData'
export function generateStaticParams() { return PRODUCTS.map(p => ({ slug: p.id })) }
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = PRODUCTS.find(p => p.id === params.slug)
  return product ? { title: `${product.name.zh} | 非凡资本产品`, description: product.description.zh, alternates: { canonical: `${SITE_URL}/products/${product.id}` } } : { title: '产品未找到' }
}
export default function ProductPage({ params }: { params: { slug: string } }) {
  const p = PRODUCTS.find(p => p.id === params.slug)
  if (!p) notFound()
  return <main id="main-content" className="ed-container rs-detail" lang="zh-CN"><StructuredData data={breadcrumbs([{ name: p.name.zh, url: `/products/${p.id}` }])}/><header className="rs-article-header"><p className="ed-eyebrow">PRODUCT / {p.audience.zh}</p><h1>{p.name.zh}</h1></header><article className="rs-prose"><p>{p.description.zh}</p>{p.id === 'uniqueresearch' && <><p>{IDENTITY.research}</p><p><Link href="/research">阅读非凡产研文章</Link> · <a href="/report.html">查看报告入口</a></p></>}<p><a href={p.href} target="_blank" rel="noopener noreferrer">{p.action.zh} ↗</a></p><h2>其他产品</h2><ul>{PRODUCTS.filter(other => other.id !== p.id).map(other => <li key={other.id}><Link href={`/products/${other.id}`}>{other.name.zh}</Link>：{other.description.zh}</li>)}</ul><p><Link href="/about">了解非凡资本</Link> · <Link href="/for-models">公开内容与引用说明</Link></p></article></main>
}
