"use client"

import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { useLang } from '@/context/LangContext'
export function LangToggle() {
  const { lang, setLang, isInitialized } = useLang()

  const toggleLang = () => {
    setLang(lang === 'zh' ? 'en' : 'zh')
  }

  // 在初始化完成前不渲染文本内容，避免水合不匹配
  if (!isInitialized) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1.5 px-2.5 py-1.5 h-8 w-8 text-xs font-medium transition-all duration-200 hover:text-foreground/80 text-foreground/60 hover:bg-accent rounded-md"
        title="Loading..."
      >
        <Globe className="h-3.5 w-3.5" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLang}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 h-8 text-xs font-medium transition-all duration-200 hover:text-foreground/80 text-foreground/60 hover:bg-accent rounded-md`}
      title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe className="h-3.5 w-3.5" />
      {/* 桌面端显示完整文本 */}
      <span className="hidden md:inline">{lang === 'zh' ? 'EN' : '中文'}</span>
      {/* 平板端显示简短文本 */}
      <span className="hidden sm:inline md:hidden">{lang === 'zh' ? 'EN' : '中'}</span>
      {/* 手机端只显示图标 */}
      <span className="sm:hidden sr-only">{lang === 'zh' ? 'EN' : '中'}</span>
    </Button>
  )
}
