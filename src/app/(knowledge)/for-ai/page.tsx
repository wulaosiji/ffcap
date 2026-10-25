import type { Metadata } from 'next'
import { StructuredData } from '@/components/StructuredData'
import { ForAiView } from '@/components/editorial-home/LocalePages'
import { homeLlmsDataPoints } from '@/content/home-llms-points.mjs'
import { breadcrumbs, SITE_URL } from '@/content/site-identity.mjs'

export const metadata: Metadata = {
  title: '给 AI 的读取接口 | 非凡资本',
  description: '非凡产研机器可读入口：建议读取顺序、llms.txt、llms-full.txt、文章索引、单篇 Markdown 与引用规则。',
  alternates: { canonical: `${SITE_URL}/for-ai` },
}

export default function ForAiPage() {
  const sample = homeLlmsDataPoints()[0]
  const sampleSlug = sample?.href.split('/').pop()
  const sampleMarkdown = sampleSlug ? `${SITE_URL}/research/${sampleSlug}/markdown` : `${SITE_URL}/research/{slug}/markdown`
  const sampleAlias = sampleSlug ? `${SITE_URL}/research/${sampleSlug}.md` : `${SITE_URL}/research/{slug}.md`

  return (
    <>
      <StructuredData data={breadcrumbs([{ name: '给 AI 的读取接口', url: '/for-ai' }])} />
      <ForAiView sampleDate={sample?.date} sampleMarkdown={sampleMarkdown} sampleAlias={sampleAlias} />
    </>
  )
}
