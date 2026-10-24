'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import { ArrowRight, ArrowUpRight, Menu, Search, X } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import logo from '@/assets/ffcap-logo-mark.png'
import { CONTENT, LINKS, PRODUCTS, filterContent, filterProducts } from '@/content/editorial.mjs'
import { englishSlugForChinese, relatedChineseSlug } from '@/content/research/english-related.mjs'
import { SocialLinks } from './SocialLinks'
import { IcpFilingLink } from '@/components/IcpFilingLink'

export function OutLink({ href, children, className, onClick }: { href: string; children: ReactNode; className?: string; onClick?: () => void }) {
  return <a href={href} className={className} target="_blank" rel="noopener noreferrer" onClick={onClick}>{children}</a>
}

export function EditorialShell({ children, cinematic = false }: { children: ReactNode; cinematic?: boolean }) {
  const { lang, setLang } = useLang()
  const pathname = usePathname()
  const router = useRouter()
  const zh = lang === 'zh'
  const switchLanguage = () => {
    const next = lang === 'zh' ? 'en' : 'zh'
    try { localStorage.setItem('lang', next) } catch {}
    if (pathname === '/en/research' && next === 'zh') { router.push('/research'); return }
    if (pathname.startsWith('/en/research/') && next === 'zh') {
      const englishSlug = pathname.slice('/en/research/'.length).split('/')[0]
      const chineseSlug = relatedChineseSlug(`https://uniqueresearch.substack.com/p/${englishSlug}`)
      router.push(chineseSlug ? `/research/${chineseSlug}` : '/research')
      return
    }
    if (pathname === '/research' && next === 'en') { router.push('/en/research'); return }
    if (pathname.startsWith('/research/') && next === 'en') {
      const chineseSlug = pathname.slice('/research/'.length).split('/')[0]
      const englishSlug = englishSlugForChinese(chineseSlug)
      router.push(englishSlug ? `/en/research/${englishSlug}` : `/en/research?related=${encodeURIComponent(chineseSlug)}`)
      return
    }
    setLang(next)
  }
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchInput = useRef<HTMLInputElement>(null)
  const [pastHero, setPastHero] = useState(false)
  useEffect(() => {
    if (!cinematic) return
    const updateHeader = () => setPastHero(window.scrollY > window.innerHeight * 0.8)
    updateHeader()
    window.addEventListener('scroll', updateHeader, { passive: true })
    return () => window.removeEventListener('scroll', updateHeader)
  }, [cinematic])
  const nav = [
    { label: zh ? '研究与洞察' : 'Research', href: zh ? '/research' : '/en/research' },
    { label: zh ? 'AI 榜单' : 'Rankings', href: LINKS.uniqueResearch, external: true },
    { label: zh ? '活动与生态' : 'Events', href: '/#ecosystem' },
    { label: zh ? '产品' : 'Products', href: '/#products' },
    { label: zh ? '给 AI' : 'For AI', href: '/for-ai' },
    { label: zh ? '关于我们' : 'About', href: '/about' },
  ]
  const results = filterContent(CONTENT, 'all', query, lang)
  const productResults = filterProducts(PRODUCTS, query, lang)
  const count = results.length + productResults.length

  return <div className={`ed-site ${cinematic ? 'ed-cinematic' : ''} ${pastHero ? 'ed-past-hero' : ''}`} lang={lang}>
    <a className="ed-skip" href="#main-content">{zh ? '跳到正文' : 'Skip to content'}</a>
    <header className="ed-header">
      <Link className="ed-brand" href="/" aria-label={zh ? '非凡资本首页' : 'UniqueCapital home'}>
        <Image src={logo} alt="" width={58} height={33} priority />
        <span>{zh ? '非凡资本' : 'UniqueCapital'}</span>
      </Link>
      <nav className="ed-desktop-nav" aria-label={zh ? '主导航' : 'Main navigation'}>
        {nav.map(n => n.external ? <OutLink key={n.href} href={n.href}>{n.label}</OutLink> : <Link key={n.href} href={n.href}>{n.label}</Link>)}
      </nav>
      <div className="ed-header-actions">
        <button className="ed-icon-button ed-language" onClick={switchLanguage} aria-label={zh ? 'Switch to English' : '切换为中文'}>{zh ? 'EN' : '中'}</button>
        <Dialog.Root open={searchOpen} onOpenChange={setSearchOpen}>
          <Dialog.Trigger asChild><button className="ed-icon-button ed-search-trigger" aria-label={zh ? '搜索内容' : 'Search content'}><Search size={20} strokeWidth={1.5} /></button></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="ed-overlay" />
            <Dialog.Content className="ed-dialog ed-search-dialog" lang={lang} onOpenAutoFocus={e => { e.preventDefault(); searchInput.current?.focus() }}>
              <div className="ed-dialog-top">
                <Dialog.Title>{zh ? '探索非凡' : 'Explore UniqueCapital'}</Dialog.Title>
                <Dialog.Close className="ed-icon-button" aria-label={zh ? '关闭搜索' : 'Close search'}><X size={23} strokeWidth={1.5}/></Dialog.Close>
              </div>
              <Dialog.Description className="ed-muted">{zh ? '搜索研究方向、活动和产品。' : 'Find research topics, events, and products.'}</Dialog.Description>
              <div className="ed-search-field"><Search size={23} strokeWidth={1.5}/><input ref={searchInput} aria-label={zh ? '搜索关键词' : 'Search keywords'} placeholder={zh ? '试试「智能体」或 UniqueBase' : 'Try “agents” or UniqueBase'} value={query} onChange={e => setQuery(e.target.value)} />{query && <button className="ed-icon-button" onClick={() => { setQuery(''); searchInput.current?.focus() }} aria-label={zh ? '清空搜索' : 'Clear search'}><X size={18}/></button>}</div>
              <p className="ed-eyebrow" role="status">{query ? (zh ? `文章库入口 · ${count} 条相关精选与产品` : `Article search · ${count} featured items & products`) : (zh ? '研究文章、精选内容与产品' : 'Articles, featured content & products')}</p>
              <div className="ed-search-results">
                <Link href={`${zh ? '/research' : '/en/research'}${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`} className="ed-search-result" onClick={() => setSearchOpen(false)}><span><small>{zh ? '站内文章 · 全文检索' : 'ENGLISH ARTICLES · FULL-TEXT SEARCH'}</small><strong>{query.trim() ? (zh ? `搜索研究文章：“${query.trim()}”` : `Search articles: “${query.trim()}”`) : (zh ? '浏览非凡产研全部文章' : 'Browse English research articles')}</strong></span><ArrowRight size={20}/></Link>
                {results.map(item => <OutLink key={item.id} href={item.href} className="ed-search-result"><span><small>{item.kind === 'event' ? (zh ? '活动' : 'EVENT') : (zh ? '发布' : 'PUBLICATION')} / {item.date}</small><strong>{item.title[lang]}</strong></span><ArrowUpRight size={20}/></OutLink>)}
                {productResults.map(p => <OutLink key={p.id} href={p.href} className="ed-search-result"><span><small>{p.audience[lang]}</small><strong>{p.name[lang]}</strong></span><ArrowUpRight size={20}/></OutLink>)}
                {!count && <p className="ed-muted">{zh ? '精选活动与产品中暂无匹配，点击上方入口继续检索全部研究文章。' : 'No featured events or products match. Continue with the full article search above.'}</p>}
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger asChild><button className="ed-icon-button ed-menu-trigger" aria-label={zh ? '打开导航菜单' : 'Open navigation menu'}><Menu size={24} strokeWidth={1.4}/></button></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="ed-overlay"/>
            <Dialog.Content className={`ed-dialog ed-menu-dialog ${cinematic ? 'ed-menu-from-left' : ''}`} lang={lang}>
              <div className="ed-dialog-top"><Dialog.Title>{zh ? '非凡资本' : 'UniqueCapital'}</Dialog.Title><Dialog.Close className="ed-icon-button" aria-label={zh ? '关闭导航菜单' : 'Close navigation menu'}><X size={24} strokeWidth={1.4}/></Dialog.Close></div>
              <Dialog.Description className="ed-eyebrow">RESEARCH. CONNECT. BUILD.</Dialog.Description>
              <nav aria-label={zh ? '完整导航' : 'Full navigation'}>{nav.map((n, i) => n.external ? <OutLink key={n.href} href={n.href} onClick={() => setMenuOpen(false)}><span className="ed-menu-index">0{i+1}</span>{n.label}<ArrowUpRight size={23}/></OutLink> : <Link key={n.href} href={n.href} onClick={() => setMenuOpen(false)}><span className="ed-menu-index">0{i+1}</span>{n.label}<ArrowRight size={23}/></Link>)}</nav>
              <div className="ed-menu-bottom"><p>{zh ? '让研究进入真实世界。' : 'Bring research into the real world.'}</p><Link href={zh ? "/research" : "/en/research"} className="ed-link" onClick={() => setMenuOpen(false)}>{zh ? '非凡产研 · 文章库' : 'UniqueResearch articles'}<ArrowRight size={17}/></Link><OutLink href={LINKS.events} className="ed-link">{zh ? '活动日历' : 'Event calendar'}<ArrowUpRight size={17}/></OutLink></div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </header>
    {children}
    <footer className="ed-footer">
      <div className="ed-container ed-footer-main">
        <div><Link href="/" className="ed-brand"><Image src={logo} alt="" width={58} height={33}/><span>{zh ? '非凡资本' : 'UniqueCapital'}</span></Link><p>{zh ? '研究 AI 的下一步，连接创造下一步的人。' : 'Research what comes next. Connect the people building it.'}</p><SocialLinks lang={lang} /></div>
        <div className="ed-footer-links"><span className="ed-eyebrow">{zh ? '探索' : 'EXPLORE'}</span>{nav.map(n => n.external ? <OutLink key={n.href} href={n.href}>{n.label}</OutLink> : <Link key={n.href} href={n.href}>{n.label}</Link>)}<Link href="/llms.txt">llms.txt</Link><Link href="/llms-full.txt">llms-full.txt</Link><Link href="/research/index.json">{zh ? '文章索引 JSON' : 'Article index JSON'}</Link><Link href="/for-models">{zh ? '引用说明' : 'Citation'}</Link><Link href="/faq">{zh ? '常见问题' : 'FAQ'}</Link></div>
        <div className="ed-footer-links"><span className="ed-eyebrow">{zh ? '进入产品' : 'OUR PRODUCTS'}</span>{PRODUCTS.map(p => <Link href={`/products/${p.id}`} key={p.id}>{p.name[lang]}<ArrowRight size={13}/></Link>)}</div>
      </div>
      <div className="ed-container ed-footer-bottom"><div className="ed-footer-meta"><span>© {new Date().getFullYear()} UniqueCapital. {zh ? '非凡资本' : 'All rights reserved.'}</span><IcpFilingLink className="ed-footer-icp" /></div><span>{zh ? '独立思考 · 长期连接' : 'Independent thinking. Lasting connections.'}</span><a href="#top" className="ed-link">{zh ? '回到顶部' : 'Back to top'}<ArrowUpRight size={16}/></a></div>
    </footer>
  </div>
}
