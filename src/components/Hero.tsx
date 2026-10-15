import { Button } from './ui/button'
import { useLang } from '@/context/LangContext'
import { homeTexts } from '@/content/homeTexts'
export function Hero() {
  const { lang } = useLang()
  
  return (
    <section className="w-full text-center pt-28 pb-20 bg-background">
      <h1 className={`text-6xl md:text-7xl font-extrabold text-primary mb-8 tracking-tight leading-tight whitespace-nowrap`}>
        {homeTexts[lang].hero.title}
      </h1>
      <p className={`text-2xl md:text-3xl text-gray-500 mb-12 leading-relaxed whitespace-nowrap`}>
        {homeTexts[lang].hero.subtitle}
      </p>
      <a href="https://uniquecapital.feishu.cn/wiki/CqaNwCaePi9CMmkz6ZwcXKZ9nvf" target="_blank" rel="noopener noreferrer">
        <Button>{homeTexts[lang].hero.mainButton}</Button>
      </a>
      
      {/* 状态信息 */}
      <div className="flex flex-wrap justify-center items-center gap-8 mt-10 opacity-90 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span>{lang === 'zh' ? '开源免费' : 'Open Source & Free'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-blue-500 rounded-full" />
          <span>{lang === 'zh' ? '独立第三方' : 'Independent Third Party'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-purple-500 rounded-full" />
          <span>{lang === 'zh' ? '绝对中立' : 'Absolutely Neutral'}</span>
        </div>
      </div>
    </section>
  )
} 