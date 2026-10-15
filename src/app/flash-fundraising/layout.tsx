import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '极速融资 - 非凡资本 UniqueCapital',
  description: 'AI驱动的融资代理，让您的融资过程从马拉松变成冲刺',
}

export default function FlashFundraisingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
