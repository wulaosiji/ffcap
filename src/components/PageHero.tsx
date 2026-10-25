import Link from 'next/link'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { ArrowRight, Zap } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { LINKS } from '@/content/editorial.mjs'

interface PageHeroProps {
  title: string
  subtitle: string
  showButton?: boolean
  buttonText?: string
  buttonHref?: string
  showBadge?: boolean
  badgeText?: string
  showStats?: boolean
  statsType?: 'default' | 'revenue' | 'funding' | 'funding-agent' | 'lean' | 'unicorn'
  showExploreButton?: boolean
  showContactButton?: boolean
}

const STATS_CONFIG: Record<string, { items: Array<{ icon: string; textZh: string; textEn: string }>; colors: string[] }> = {
  revenue: {
    items: [
      { icon: '📊', textZh: '实时数据追踪', textEn: 'Live Data Tracking' },
      { icon: '🌍', textZh: '全球覆盖', textEn: 'Global Coverage' },
      { icon: '📈', textZh: '专业分析', textEn: 'Professional Analytics' },
    ],
    colors: ['bg-brand-purple', 'bg-green-500', 'bg-brand-pink'],
  },
  funding: {
    items: [
      { icon: '⚡', textZh: '快速响应', textEn: 'Quick Response' },
      { icon: '💰', textZh: '零佣金', textEn: 'Zero Commission' },
      { icon: '🤝', textZh: '专业指导', textEn: 'Professional Guidance' },
    ],
    colors: ['bg-brand-purple', 'bg-green-500', 'bg-brand-pink'],
  },
  'funding-agent': {
    items: [
      { icon: '🔍', textZh: '精选项目', textEn: 'Curated Projects' },
      { icon: '📊', textZh: '数据驱动', textEn: 'Data-Driven' },
      { icon: '🎯', textZh: '精准匹配', textEn: 'Precise Matching' },
    ],
    colors: ['bg-brand-pink', 'bg-brand-purple', 'bg-green-500'],
  },
  lean: {
    items: [
      { icon: '📊', textZh: '人效分析', textEn: 'Efficiency Analysis' },
      { icon: '⚡', textZh: '精益运营', textEn: 'Lean Operations' },
      { icon: '🎯', textZh: '精准评估', textEn: 'Precise Evaluation' },
    ],
    colors: ['bg-green-500', 'bg-brand-purple', 'bg-brand-pink'],
  },
  unicorn: {
    items: [
      { icon: '🦄', textZh: '独角兽追踪', textEn: 'Unicorn Tracking' },
      { icon: '💎', textZh: '价值评估', textEn: 'Value Assessment' },
      { icon: '🚀', textZh: '增长潜力', textEn: 'Growth Potential' },
    ],
    colors: ['bg-brand-purple', 'bg-brand-pink', 'bg-orange-500'],
  },
  default: {
    items: [
      { icon: '🟢', textZh: '开源免费', textEn: 'Open Source & Free' },
      { icon: '🛡️', textZh: '独立第三方', textEn: 'Independent Third Party' },
      { icon: '⏰', textZh: '绝对中立', textEn: 'Absolutely Neutral' },
    ],
    colors: ['bg-green-500', 'bg-brand-purple', 'bg-brand-pink'],
  },
}

export function PageHero({ 
  title, 
  subtitle, 
  showButton = false, 
  buttonText,
  buttonHref = "/research/rankings",
  showBadge = true,
  badgeText,
  showStats = true,
  statsType = 'default',
  showExploreButton = false,
  showContactButton = false
}: PageHeroProps) {
  const { lang } = useLang()
  const config = STATS_CONFIG[statsType] || STATS_CONFIG.default
  const resolvedButtonText = buttonText ?? (lang === 'zh' ? '查看数据与榜单' : 'View data and rankings')
  const resolvedBadge = badgeText ?? (lang === 'zh' ? '现已上线' : 'Available now')

  return (
    <section className="relative py-20 md:py-32 overflow-hidden w-full bg-background">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.07] blur-3xl gradient-brand-bg pointer-events-none" />
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        {showBadge && (
          <Badge variant="secondary" className="mb-8 inline-flex items-center justify-center border-primary/20">
            <Zap className="w-3 h-3 mr-1 text-primary" />
            {resolvedBadge}
          </Badge>
        )}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-brand animate-fade-in">
          {title}
        </h1>
        <p className="text-xl text-muted-foreground mb-12 animate-fade-in">
          {subtitle}
        </p>
        {showButton && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in">
            <a href={buttonHref} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="group h-12 px-8 gradient-brand-bg text-white border-0 hover:opacity-90">
                {resolvedButtonText}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>
        )}
        {showExploreButton && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in">
            <Link href={LINKS.contact}>
              <Button size="lg" className="group h-12 px-8 gradient-brand-bg text-white border-0 hover:opacity-90">
                {lang === 'zh' ? '联系我们' : 'Contact Us'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
        {showContactButton && (
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 animate-fade-in">
            <a href="https://uniquecapital.feishu.cn/share/base/form/shrcnvAg3etDn79jFPh9aK6Yn6b" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="group h-12 px-8 gradient-brand-bg text-white border-0 hover:opacity-90">
                {lang === 'zh' ? '联系代理' : 'Contact Agent'}
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
          </div>
        )}
        {showStats && (
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground flex-wrap">
            {config.items.map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${config.colors[index]} ${index === 0 ? 'animate-pulse' : ''}`} />
                <span>{lang === 'zh' ? stat.textZh : stat.textEn}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
