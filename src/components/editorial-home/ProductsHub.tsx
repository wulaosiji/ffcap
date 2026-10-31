'use client'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useDisplayedLang } from '@/hooks/useSwitchSiteLanguage'
import { PRODUCTS, productExternalHref, productPrimaryHref } from '@/content/editorial.mjs'
import { DocumentTitle } from './DocumentTitle'
import { OutLink } from './EditorialShell'
import { panelMotif } from './panel-motifs.mjs'

const copy = {
  zh: {
    eyebrow: '为构建者而生',
    title: '产品矩阵',
    intro: '从洞察到行动：小程序内的问卷与报告查阅、全球网页数据与活动，以及投资人项目对接。',
    count: '款产品',
    details: '查看介绍',
  },
  en: {
    eyebrow: 'Built for builders',
    title: 'Products',
    intro: 'From insight to action: in-mini-program surveys and research lookup, global web data and events, and investor project matching.',
    count: 'products',
    details: 'Product details',
  },
}

export function ProductsHub() {
  const lang = useDisplayedLang()
  const text = copy[lang]

  return (
    <main id="main-content" className="ed-container rs-library ed-topo-quiet" lang={lang === 'en' ? 'en' : 'zh-CN'}>
      <DocumentTitle zh="产品矩阵 · 非凡资本" en="Products · UniqueCapital" />
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
      <div className="ed-products">
        {PRODUCTS.map(product => {
          const primary = productPrimaryHref(product, lang)
          const external = productExternalHref(product, lang)
          const primaryExternal = primary.startsWith('http')
          const secondary = typeof external === 'string' && external.startsWith('http') && external !== primary
          const motif = panelMotif(product.id)
          const body = (
            <>
              <div className="ed-product-top"><span>{product.audience[lang]}</span></div>
              <h2>{product.name[lang]}</h2>
              <p>{product.description[lang]}</p>
              <span className="ed-link">
                {secondary || !primaryExternal ? text.details : product.action[lang]}
                {primary.startsWith('/') ? <ArrowRight size={20} /> : <ArrowUpRight size={20} />}
              </span>
            </>
          )
          if (!secondary) {
            return primaryExternal ? (
              <OutLink key={product.id} href={primary} className="ed-product ed-panel" motif={motif}>{body}</OutLink>
            ) : (
              <Link key={product.id} href={primary} className="ed-product ed-panel" {...(motif ? { 'data-motif': motif } : {})}>{body}</Link>
            )
          }
          return (
            <article key={product.id} className="ed-product ed-panel" {...(motif ? { 'data-motif': motif } : {})}>
              {primaryExternal ? (
                <OutLink href={primary} className="ed-product-main">{body}</OutLink>
              ) : (
                <Link href={primary} className="ed-product-main">{body}</Link>
              )}
              <OutLink href={external} className="ed-product-external">{product.action[lang]}<ArrowUpRight size={14} /></OutLink>
            </article>
          )
        })}
      </div>
    </main>
  )
}
