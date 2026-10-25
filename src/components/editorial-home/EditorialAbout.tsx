'use client'

import { IDENTITY } from '@/content/site-identity.mjs'

import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { LINKS, PRODUCTS, TOPICS, productExternalHref, productPrimaryHref } from '@/content/editorial.mjs'
import { EditorialShell } from './EditorialShell'

const copy = {
  zh: {
    eyebrow: '关于非凡资本',
    title: '研究下一步，连接创造下一步的人。',
    intro: IDENTITY.description,
    detail: '从研究与榜单，到主题活动与协作产品，我们关注同一个问题：新的技术，如何进入真实的业务与生活。',
    pillars: [
      ['01 / RESEARCH', '建立理解', '研究前沿技术、产品与产业变化。通过趋势研究、榜单与产业观察，把值得关注的问题带入讨论。'],
      ['02 / CONNECT', '组织连接', '围绕具体议题组织活动、研学与社群交流，让创业者、投资人和产业伙伴找到彼此。'],
      ['03 / BUILD', '支持协作', '围绕项目展示、活动现场与投融资对接开发产品，让一次连接有继续发生的入口。'],
    ],
    directionsEyebrow: '研究方向',
    directionsTitle: '持续追踪 AI 的三条演进路径。',
    directionsIntro: '三个方向共享技术基础，也在不同的产品、场景和商业模式中接受检验。',
    related: '相关活动',
    productsEyebrow: '产品',
    productsTitle: '让连接有一个具体的起点。',
    ecosystemEyebrow: '活动与生态',
    ecosystemTitle: '从共同关注的问题，走向真实的交流。',
    ecosystemBody: '通过主题大会、开放日、研学与社群交流，我们把研究议题带到现场。你可以查看公开研究、关注近期活动，或提交项目参与 AI 榜单。',
    reports: '阅读研究与榜单',
    events: '查看活动日历',
    apply: '申报 AI 榜单',
    contact: '联系我们',
  },
  en: {
    eyebrow: 'About UniqueCapital',
    title: 'Research what comes next. Connect the people building it.',
    intro: 'Grounded in UniqueResearch, UniqueCapital connects AI founders, investors, and industry partners through research into technology and business practice.',
    detail: 'Across research, rankings, focused events, and collaboration tools, we ask one question: how does new technology become part of real work and everyday life?',
    pillars: [
      ['01 / RESEARCH', 'Build understanding', 'Study changes in frontier technology, products, and industries. Bring questions that matter into the conversation through research, rankings, and industry observations.'],
      ['02 / CONNECT', 'Bring people together', 'Organize focused events, learning programs, and community conversations where founders, investors, and industry partners can meet.'],
      ['03 / BUILD', 'Support collaboration', 'Build tools for project presentation, onsite events, and founder-investor connections, giving each introduction a practical next step.'],
    ],
    directionsEyebrow: 'Research focus',
    directionsTitle: 'Three paths in the evolution of AI.',
    directionsIntro: 'These fields share technical foundations while taking shape in different products, use cases, and business models.',
    related: 'Related event',
    productsEyebrow: 'Products',
    productsTitle: 'A practical starting point for each connection.',
    ecosystemEyebrow: 'Events & ecosystem',
    ecosystemTitle: 'Turn shared questions into real conversations.',
    ecosystemBody: 'Through conferences, open days, learning programs, and community conversations, we bring research topics into the room. Explore our public research, find an upcoming event, or submit a project for the AI rankings.',
    reports: 'Read research and rankings',
    events: 'Explore the event calendar',
    apply: 'Apply for AI rankings',
    contact: 'Contact us',
  },
}

export function EditorialAbout() {
  const { lang } = useLang()
  const text = copy[lang]

  return (
    <EditorialShell>
      <main className="ed-about" id="main-content">
        <section className="ed-container ed-about-intro" id="top" aria-labelledby="about-title">
          <p className="ed-eyebrow">{text.eyebrow}</p>
          <h1 id="about-title">{text.title}</h1>
          <div>
            <p>{text.intro}</p>
            <p>{text.detail}</p>
            <p>{lang === 'zh' ? IDENTITY.research : 'UniqueResearch is the publication name used for this research archive. Its product entry provides public AI rankings; the article archive and rankings are separate destinations.'}</p>
          </div>
        </section>

        <section className="ed-container ed-about-grid" aria-label={text.eyebrow}>
          {text.pillars.map(([code, title, description]) => (
            <article className="ed-about-pillar" key={code}>
              <p className="ed-eyebrow">{code}</p>
              <h2>{title}</h2>
              <p>{description}</p>
            </article>
          ))}
        </section>

        <section className="ed-container ed-about-directions" aria-labelledby="about-directions-title">
          <div className="ed-section-heading">
            <div>
              <p className="ed-eyebrow">{text.directionsEyebrow}</p>
              <h2 id="about-directions-title">{text.directionsTitle}</h2>
            </div>
            <p>{text.directionsIntro}</p>
          </div>
          <div className="ed-about-grid">
            {TOPICS.map((topic) => (
              <article className="ed-about-pillar" key={topic.id}>
                <p className="ed-eyebrow">{topic.name}</p>
                <h3>{topic.title[lang]}</h3>
                <p>{topic.description[lang]}</p>
                <a className="ed-link" href={topic.href} target="_blank" rel="noopener noreferrer">
                  {text.related}<ArrowUpRight size={18} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="ed-container ed-about-directions" aria-labelledby="about-products-title">
          <div className="ed-section-heading">
            <div>
              <p className="ed-eyebrow">{text.productsEyebrow}</p>
              <h2 id="about-products-title">{text.productsTitle}</h2>
            </div>
          </div>
          <div className="ed-about-grid">
            {PRODUCTS.map((product) => {
              const primary = productPrimaryHref(product, lang)
              const external = productExternalHref(product, lang)
              const secondary = typeof external === 'string' && external.startsWith('http') && external !== primary
              const primaryExternal = primary.startsWith('http')
              return (
              <article className="ed-about-pillar" key={product.id}>
                <p className="ed-eyebrow">{product.audience[lang]}</p>
                <h3>{product.name[lang]}</h3>
                <p>{product.description[lang]}</p>
                {primaryExternal ? (
                  <a className="ed-link" href={primary} target="_blank" rel="noopener noreferrer">
                    {product.action[lang]}<ArrowUpRight size={18} aria-hidden="true" />
                  </a>
                ) : (
                  <Link className="ed-link" href={primary}>
                    {lang === 'zh' ? '查看产品介绍' : 'Product details'}<ArrowRight size={18} aria-hidden="true" />
                  </Link>
                )}
                {secondary && (
                  <a className="ed-link ed-product-external" href={external} target="_blank" rel="noopener noreferrer">
                    {product.action[lang]}<ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                )}
              </article>
            )})}
          </div>
        </section>

        <section className="ed-container ed-about-ecosystem" id="ecosystem" aria-labelledby="about-ecosystem-title">
          <p className="ed-eyebrow">{text.ecosystemEyebrow}</p>
          <h2 id="about-ecosystem-title">{text.ecosystemTitle}</h2>
          <p>{text.ecosystemBody}</p>
          <div>
            <a className="ed-link" href={LINKS.events} target="_blank" rel="noopener noreferrer">
              {text.events}<ArrowRight size={18} aria-hidden="true" />
            </a>
            <Link className="ed-link" href={lang === 'zh' ? '/research' : '/en/research'}>
              {text.reports}<ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="ed-link" href={LINKS.rankingsHub}>
              {lang === 'zh' ? 'AI 榜单精选' : 'Curated rankings'}<ArrowRight size={18} aria-hidden="true" />
            </Link>
            <Link className="ed-link" href={LINKS.contact}>
              {text.contact}<ArrowRight size={18} aria-hidden="true" />
            </Link>
            <a className="ed-link" href={LINKS.rankingApplication} target="_blank" rel="noopener noreferrer">
              {text.apply}<ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </section>
      </main>
    </EditorialShell>
  )
}
