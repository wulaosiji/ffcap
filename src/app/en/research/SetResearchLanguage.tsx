'use client'
import type { ReactNode } from 'react'
import Link from 'next/link'

export function ChineseArticleLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return <Link href={href} className={className} onClick={() => { try { localStorage.setItem('lang', 'zh') } catch {} }}>{children}</Link>
}
