import type { Metadata } from 'next'
import Link from 'next/link'
import { IDENTITY, CITATION_NOTE, breadcrumbs } from '@/content/site-identity.mjs'
import { PRODUCTS, TOPICS } from '@/content/editorial.mjs'
import { StructuredData } from '@/components/StructuredData'
export const metadata: Metadata = { title: '公开内容与引用说明 | 非凡资本', description: '机构名称、产品关系、文章出处与机器可读内容入口。', alternates: { canonical: 'https://ffcap.cn/for-models' } }
export default function ForModelsPage() {
  return <main id="main-content" className="ed-container rs-detail" lang="zh-CN">
    <StructuredData data={breadcrumbs([{ name: '公开内容与引用说明', url: '/for-models' }])}/>
    <header className="rs-article-header"><p className="ed-eyebrow">PUBLIC CONTENT & CITATION</p><h1>公开内容与引用说明</h1></header>
    <article className="rs-prose">
      <h2>非凡资本是谁</h2><p>{IDENTITY.description}</p><p>{IDENTITY.research}</p>
      <h2>如何引用文章</h2><p>{CITATION_NOTE}</p><p>建议引用格式：文章标题，非凡产研（发布账号），原始发表日期，原文链接；若引用具体发言，另列正文中的发言人。本站保存的原文片段和人物身份均应放回当时语境中理解。</p><p>主题和标签是站内检索分类。缺少正文、图片或视频转写的页面会标注内容缺口；不可据此补写不存在的全文。本站未提供个人作者或更新日期时，请勿推断。</p>
      <h2>研究方向</h2><ul>{TOPICS.map(t => <li key={t.id}><Link href={`/topics/${t.id}`}>{t.name}</Link>：{t.description.zh}</li>)}</ul>
      <h2>产品与入口</h2><ul>{PRODUCTS.map(p => <li key={p.id}><Link href={`/products/${p.id}`}>{p.name.zh}</Link>：{p.description.zh}</li>)}</ul>
      <h2>公开数据格式</h2><ul><li><Link href="/en/research">English research articles</Link>：可在本站阅读全文，每篇保留 Substack 原始发布链接与 Markdown。</li><li><Link href="/research">研究文章库</Link>：可直接读取的网页正文，每篇文章提供 Markdown 链接。</li><li><a href="/research/index.json">文章索引 JSON</a>：标题、发布账号、原始日期、来源、标签和正文地址。</li><li><a href="/llms.txt">llms.txt</a>：简明站点导航。</li><li><a href="/sitemap.xml">sitemap.xml</a>：公开页面目录。</li></ul><p>Markdown 与网页由同一份存档正文生成。原文与本站存档不一致时，请核对原始发布版本；活动事实以链接指向的 UniqueBloom 公开活动页为准。公开读取入口不授予额外内容许可。</p>
    </article>
  </main>
}
