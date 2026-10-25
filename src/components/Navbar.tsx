"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { LangToggle } from '@/components/LangToggle'
import { ViewToggle } from '@/components/ViewToggle'
import { Logo } from '@/components/Logo'
import { useLang } from '@/context/LangContext'
import { useViewMode } from '@/context/ViewModeContext'
import { useSubdomain, getNavHref } from '@/hooks/useSubdomain'
import { SITE_LINKS } from '@/components/narrative-home/linkMap.mjs'
import { primaryNavItems } from '@/content/editorial.mjs'

export default function Navbar() {
  const { lang } = useLang()
  const { viewMode, setViewMode } = useViewMode()
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const subdomainInfo = useSubdomain()

  const rawNavItems = [
    { id: 'home', href: '/', label: lang === 'zh' ? '首页' : 'Home' },
    ...primaryNavItems(lang).map((item, index) => ({
      id: ['research', 'rankings', 'eventsAwards', 'products', 'forAi', 'contact', 'about'][index],
      href: item.href,
      label: item.label,
    })),
  ]

  // 根据子域名状态调整链接
  const navItems = rawNavItems.map(item => {
    if ('external' in item && item.external) return item
    const nav = getNavHref(item.href, subdomainInfo)
    return { ...item, href: nav.href, external: nav.isExternal }
  })

  const isActive = (href: string, itemId: string) => {
    if (href === '/') return pathname === '/'
    if (itemId === 'about') return pathname.startsWith('/about')
    return pathname.startsWith(href)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Logo />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => {
            const active = !item.external && isActive(item.href, item.id)
            const className = `transition-colors ${
              active
                ? 'text-foreground font-semibold'
                : 'text-foreground/60 hover:text-foreground/80'
            }`

            return item.external ? (
              <a
                key={`d-${item.id}`}
                href={item.href}
                {...(item.href.startsWith('http') && !item.href.includes('ffcap.cn')
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="transition-colors text-foreground/60 hover:text-foreground/80"
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={`d-${item.id}`}
                href={item.href}
                className={className}
              >
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          <ThemeToggle />
          <LangToggle />

          {/* Mobile Menu Trigger */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden p-0 h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="flex flex-col space-y-6 mt-6">
                <div className="space-y-4">
                  {navItems.map((item) => {
                    const active = !item.external && isActive(item.href, item.id)
                    return item.external ? (
                      <a
                        key={`m-${item.id}`}
                        href={item.href}
                        {...(item.href.startsWith('http') && !item.href.includes('ffcap.cn')
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="text-base font-medium transition-colors hover:text-primary py-2 block"
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={`m-${item.id}`}
                        href={item.href}
                        className={`text-base font-medium transition-colors py-2 block ${
                          active ? 'text-primary' : 'hover:text-primary'
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    )
                  })}
                </div>

                <div className="pt-6 border-t border-border/50">
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {lang === 'zh' ? '设置' : 'Settings'}
                    </h3>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">{lang === 'zh' ? '视图模式' : 'View Mode'}</span>
                      <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">{lang === 'zh' ? '主题模式' : 'Theme Mode'}</span>
                      <ThemeToggle />
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-foreground">{lang === 'zh' ? '语言设置' : 'Language'}</span>
                      <LangToggle />
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
