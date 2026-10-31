'use client'

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { ThemeProvider } from "@/components/ThemeProvider"
import Navbar from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { LangProvider, useLang } from "@/context/LangContext"
import { ViewModeProvider } from "@/context/ViewModeContext"
import { researchRouteLang } from "@/content/editorial.mjs"
import { usesEditorialShell } from "@/lib/uses-editorial-shell.mjs"

function LanguageSetter() {
  const pathname = usePathname()
  const { lang, setLang, isInitialized } = useLang()

  useEffect(() => {
    if (!isInitialized) return
    const routeLang = researchRouteLang(pathname)
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
  const immersiveHome = usesEditorialShell(pathname)

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
