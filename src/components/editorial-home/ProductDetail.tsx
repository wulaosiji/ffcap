'use client'

import Link from 'next/link'
import { useLang } from '@/context/LangContext'
import { PRODUCTS, productExternalHref } from '@/content/editorial.mjs'
import { DocumentTitle } from './DocumentTitle'

const copy = {
  zh: {
    kicker: '产品',
    read: '阅读非凡产研文章',
    rankings: 'AI 榜单精选',
    other: '其他产品',
    about: '了解非凡资本',
    citation: '公开内容与引用说明',
    researchHref: '/research',
  },
  en: {
    kicker: 'Product',
    read: 'Read articles',
    rankings: 'Curated rankings',
    other: 'Other products',
    about: 'About UniqueCapital',
    citation: 'Citation notes',
    researchHref: '/en/research',
  },
}

export function ProductDetail({ slug }: { slug: string }) {
  const { lang } = useLang()
  const text = copy[lang]
  const product = PRODUCTS.find(item => item.id === slug)
  if (!product) return null

  const ctaHref = productExternalHref(product, lang)
  const external = ctaHref.startsWith('http')
  const detailExtra = 'detailExtra' in product ? product.detailExtra : undefined

  return (
    <main id="main-content" className="ed-container rs-detail" lang={lang === 'en' ? 'en' : 'zh-CN'}>
      <DocumentTitle zh={`${product.name.zh} · 产品 | 非凡资本`} en={`${product.name.en} · Product | UniqueCapital`} />
      <header className="rs-article-header">
        <p className="ed-eyebrow">{text.kicker} / {product.audience[lang]}</p>
        <h1>{product.name[lang]}</h1>
      </header>
      <article className="rs-prose">
        <div className="rs-product-desc">
          <p>{product.description[lang]}</p>
        </div>
        {detailExtra ? (
          <div className="rs-product-desc">
            <p>{detailExtra[lang]}</p>
          </div>
        ) : null}
        {product.id === 'uniqueresearch' && (
          <p>
            <Link href={text.researchHref}>{text.read}</Link>
            {' · '}
            <Link href="/research/rankings">{text.rankings}</Link>
          </p>
        )}
        <p>
          {external ? (
            <a href={ctaHref} target="_blank" rel="noopener noreferrer">
              {product.action[lang]} ↗
            </a>
          ) : (
            <Link href={ctaHref}>
              {product.action[lang]} →
            </Link>
          )}
        </p>
        <h2>{text.other}</h2>
        <ul>
          {PRODUCTS.filter(other => other.id !== product.id).map(other => (
            <li key={other.id}>
              <Link href={`/products/${other.id}`}>{other.name[lang]}</Link>
              {lang === 'zh' ? '：' : ': '}
              {other.description[lang]}
            </li>
          ))}
        </ul>
        <p>
          <Link href="/about">{text.about}</Link>
          {' · '}
          <Link href="/for-models">{text.citation}</Link>
        </p>
      </article>
    </main>
  )
}
