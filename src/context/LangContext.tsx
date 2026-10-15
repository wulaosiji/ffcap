"use client"
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Lang = 'zh' | 'en'

interface LangContextProps {
  lang: Lang
  setLang: (lang: Lang) => void
  isInitialized: boolean
}

const LangContext = createContext<LangContextProps | undefined>(undefined)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window === 'undefined') return
    
    try {
      // 客户端初始化时从localStorage读取语言设置
      const saved = localStorage.getItem('lang') as Lang | null
      if (saved === 'zh' || saved === 'en') {
        setLang(saved)
      } else {
        // 根据浏览器语言设置默认语言
        const navLang = navigator.language || navigator.languages[0] || 'zh'
        const defaultLang: Lang = navLang.startsWith('en') ? 'en' : 'zh'
        setLang(defaultLang)
        localStorage.setItem('lang', defaultLang)
      }
    } catch (error) {
      console.warn('Failed to load language from localStorage:', error)
      // 如果localStorage失败，使用默认语言
      setLang('zh')
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      try {
        localStorage.setItem('lang', lang)
      } catch (error) {
        console.warn('Failed to save language to localStorage:', error)
      }
    }
  }, [lang, isInitialized])

  return (
    <LangContext.Provider value={{ lang, setLang, isInitialized }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within a LangProvider')
  return ctx
} 