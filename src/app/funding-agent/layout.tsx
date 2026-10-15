import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '融资代理 - 非凡资本 UniqueCapital',
  description: '专业的AI融资代理服务，连接优质投资人',
}

export default function FundingAgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
