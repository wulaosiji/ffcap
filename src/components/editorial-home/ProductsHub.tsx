'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { PRODUCTS, productExternalHref, productPrimaryHref } from '@/content/editorial.mjs'

const copy = {
  zh: {
    eyebrow: '为构建者而生',
    title: '产品矩阵',
    intro: '从洞察到行动：小程序内的问卷与报告查阅、全球 Web 数据与活动，以及投资人项目对接。',
    count: '款产品',
    details: '查看介绍',
  },
  en: {
    eyebrow: 'BUILT FOR BUILDERS',
    title: 'Products',
    intro: 'From insight to action: in-mini-program surveys and research lookup, global web data and events, and investor project matching.',
    count: 'products',
    details: 'Product details',
  },
}

export function ProductsHub() {
  const { lang } = useLang()
  const text = copy[lang]

  return (
    <main id="main-content" className="ed-container rs-library" lang={lang === 'en' ? 'en' : 'zh-CN'}>
      <div className="rs-intro">
        <div>
          <p className="ed-eyebrow">{text.eyebrow}</p>
          <h1>{text.title}</h1>
          <p>{text.intro}</p>
        </div>
        <div className="rs-total">
          <strong>{PRODUCTS.length}</strong>
          <span>{text.count}</span>
        </div>
      </div>
      <div className="rs-grid">
        {PRODUCTS.map(product => {
          const primary = productPrimaryHref(product, lang)
          const external = productExternalHref(product, lang)
          const primaryExternal = primary.startsWith('http')
          const secondary = typeof external === 'string' && external.startsWith('http') && external !== primary
          const title = (
            <>
              <h2>{product.name[lang]}</h2>
              <div className="rs-product-desc">
                <p>{product.description[lang]}</p>
              </div>
            </>
          )
          return (
            <article key={product.id} className="rs-card rs-product-card">
              <div className="rs-meta">
                <span>{product.audience[lang]}</span>
              </div>
              {primaryExternal ? (
                <a href={primary} className="rs-card-link" target="_blank" rel="noopener noreferrer">
                  {title}
                </a>
              ) : (
                <Link href={primary} className="rs-card-link">
                  {title}
                </Link>
              )}
              <div className="rs-card-bottom">
                {primaryExternal ? (
                  <a href={primary} target="_blank" rel="noopener noreferrer">
                    {product.action[lang]} <ArrowUpRight size={14} />
                  </a>
                ) : (
                  <Link href={primary}>{text.details} →</Link>
                )}
                {secondary && (
                  <a className="rs-card-external" href={external} target="_blank" rel="noopener noreferrer">
                    {product.action[lang]} <ArrowUpRight size={14} />
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
