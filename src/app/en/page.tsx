import type { Metadata } from 'next'
import { HomeView } from '@/components/editorial-home/HomeView'
import { HOME_OG_IMAGE } from '@/content/home-public.mjs'
import '../editorial-home.css'

const TITLE = 'UniqueResearch · UniqueCapital | AI funding, revenue, and product research'
const DESCRIPTION =
  'UniqueCapital is an industry capital and ecosystem organization built on AI research. UniqueResearch publishes funding, subscription revenue, and product traffic studies across Agentic AI, Physical AI, and Entertainment AI.'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://ffcap.cn/en',
    languages: { 'zh-CN': 'https://ffcap.cn/', en: 'https://ffcap.cn/en' },
  },
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://ffcap.cn/en',
    siteName: 'UniqueCapital',
    locale: 'en_US',
    type: 'website',
    images: [{ url: HOME_OG_IMAGE, width: 1920, height: 1080, alt: 'UniqueResearch · UniqueCapital' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [HOME_OG_IMAGE],
  },
}

export default function EnglishHomePage() {
  return <HomeView />
}
