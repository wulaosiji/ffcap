'use client'

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/ThemeProvider"
import Navbar from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { LangProvider, useLang } from "@/context/LangContext"
import { ViewModeProvider } from "@/context/ViewModeContext"

function LanguageSetter() {
  const pathname = usePathname()
  const { lang, setLang, isInitialized } = useLang()

  useEffect(() => {
    if (!isInitialized) return
    const routeLang = pathname === '/en/research' || pathname.startsWith('/en/research/') ? 'en' : pathname === '/research' || pathname.startsWith('/research/') ? 'zh' : null
    if (routeLang && routeLang !== lang) {
      setLang(routeLang)
      try { localStorage.setItem('lang', routeLang) } catch {}
    }
    document.documentElement.lang = routeLang || lang
  }, [pathname, lang, setLang, isInitialized])

  return null
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const immersiveHome = pathname === '/' || pathname === '/about' || pathname === '/world' || pathname === '/faq' || pathname === '/research' || pathname.startsWith('/research/') || pathname.startsWith('/products/') || pathname.startsWith('/topics/') || pathname === '/for-models' || pathname === '/for-ai' || pathname === '/en/research' || pathname.startsWith('/en/research/')

  return (
    <LangProvider>
      <ViewModeProvider>
        <LanguageSetter />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {!immersiveHome && <Navbar />}
          {children}
          {!immersiveHome && <Footer />}
        </ThemeProvider>
      </ViewModeProvider>
    </LangProvider>
  )
}
