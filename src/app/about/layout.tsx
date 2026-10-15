import { Metadata } from 'next'

export const metadata: Metadata = {
  alternates: { canonical: "https://ffcap.cn/about" },
  title: '关于我们 - 非凡资本 UniqueCapital',
  description: '了解非凡资本的研究方向、产品矩阵、活动与生态。',
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 
