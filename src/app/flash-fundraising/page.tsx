"use client"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Brain, Target, TrendingUp, FileText, Users2, MessageSquare, CheckCircle } from "lucide-react"
import { useLang } from "@/context/LangContext"
import { PageHero } from "@/components/PageHero"

export default function FlashFundraisingPage() {
  const { lang } = useLang()

  const texts = {
    zh: {
      hero: {
        title: "极速融资",
        subtitle: "AI驱动的融资代理，让您的融资过程从马拉松变成冲刺",
        mainButton: "开始极速融资",
        badge: "AI融资代理"
      },
      stats: {
        successRate: "匹配成功率",
        avgTime: "持续服务",
        vcPartners: "VC合作伙伴",
        dealsClosed: "历史交易"
      },
      features: {
        title: "为什么选择极速融资？",
        subtitle: "我们不只是创建路演材料，我们连接您与真正重要的投资者"
      }
    },
    en: {
      hero: {
        title: "Flash Fundraising",
        subtitle: "AI-powered fundraising agent that turns your fundraising marathon into a sprint",
        mainButton: "Start Flash Fundraising",
        badge: "AI Fundraising Agent"
      },
      stats: {
        successRate: "Match Success Rate",
        avgTime: "Continuous Service",
        vcPartners: "VC Partners",
        dealsClosed: "Historical Deals"
      },
      features: {
        title: "Why Choose Flash Fundraising?",
        subtitle: "We don't just create pitch decks—we connect you to the investors who matter for your stage and sector"
      }
    }
  }

  const currentTexts = texts[lang]

  const features = [
    {
      icon: Brain,
      titleZh: 'AI记忆系统', titleEn: 'AI Memory System',
      descZh: '整合您的Deck、新闻、DataRoom等关键信息', descEn: 'Ingests your Deck, news, DataRoom, and other critical inputs',
      items: [
        { zh: '自动数据整合', en: 'Automatic data integration' },
        { zh: '智能信息提取', en: 'Smart information extraction' },
        { zh: '实时同步更新', en: 'Real-time sync updates' },
      ]
    },
    {
      icon: Target,
      titleZh: '智能上下文构建', titleEn: 'Context Building',
      descZh: '从分散信息创建全面的商业叙述', descEn: 'Creates comprehensive business narrative from scattered information',
      items: [
        { zh: '商业故事构建', en: 'Business story building' },
        { zh: '数据驱动叙述', en: 'Data-driven narrative' },
        { zh: '投资者视角优化', en: 'Investor perspective optimization' },
      ]
    },
    {
      icon: TrendingUp,
      titleZh: '持续学习', titleEn: 'Continuous Learning',
      descZh: '随业务发展更新理解', descEn: 'Updates understanding as your business evolves',
      items: [
        { zh: '自适应学习', en: 'Adaptive learning' },
        { zh: '业务发展跟踪', en: 'Business evolution tracking' },
        { zh: '动态策略调整', en: 'Dynamic strategy adjustment' },
      ]
    },
    {
      icon: FileText,
      titleZh: '0→1路演生成', titleEn: '0→1 Deck Generation',
      descZh: '从实际业务上下文创建真实路演', descEn: 'Creates authentic pitch decks from your actual business context',
      items: [
        { zh: 'AI优化分析', en: 'AI optimization analysis' },
        { zh: '最佳实践应用', en: 'Best practices application' },
        { zh: '多格式导出', en: 'Multi-format export' },
      ]
    },
    {
      icon: Users2,
      titleZh: '精选网络', titleEn: 'Curated Network',
      descZh: '直接访问3000+精选VC合作伙伴', descEn: 'Direct access to our 3000+ hand-picked VC partners',
      items: [
        { zh: '精选VC网络', en: 'Curated VC network' },
        { zh: '温暖介绍', en: 'Warm introductions' },
        { zh: '战略指导', en: 'Strategic guidance' },
      ]
    },
    {
      icon: MessageSquare,
      titleZh: '路演练习', titleEn: 'Pitch Practice',
      descZh: 'AI驱动的排练，提供投资者特定的谈话要点', descEn: 'AI-powered rehearsal with investor-specific talking points',
      items: [
        { zh: 'AI驱动排练', en: 'AI-powered rehearsal' },
        { zh: '投资者洞察', en: 'Investor insights' },
        { zh: '专家支持', en: 'Expert support' },
      ]
    },
  ]

  const workflow = [
    { titleZh: '数据整合', titleEn: 'Data Integration', descZh: 'AI自动整合Deck、DataRoom等业务数据', descEn: 'AI automatically integrates business data from Deck, DataRoom, etc.' },
    { titleZh: '故事构建', titleEn: 'Story Building', descZh: '从分散信息创建引人入胜的商业叙述', descEn: 'Create compelling business narrative from scattered information' },
    { titleZh: '路演生成', titleEn: 'Deck Generation', descZh: 'AI生成专业路演材料，优化投资者视角', descEn: 'AI generates professional pitch materials optimized for investor perspective' },
    { titleZh: '成功融资', titleEn: 'Successful Funding', descZh: '连接精选VC网络，完成融资交易', descEn: 'Connect with curated VC network to close funding deals' },
  ]

  const partners = [
    '红杉资本', '高瓴资本', '腾讯投资', '阿里巴巴', '百度战投',
    '字节跳动', '美团龙珠', '蚂蚁集团', '京东科技', '小米集团',
    '经纬创投', '启明创投', '金沙江创投', 'IDG资本', '创新工场',
    '真格基金', '顺为资本', '源码资本', '光速中国', 'GGV纪源资本',
    '华兴资本', '深创投', '达晨创投', '君联资本', '德同资本',
    '险峰长青', '梅花创投', '青松基金', '元禾原点', '靖亚资本',
    '零一创投', '云启资本', '华映资本', '蓝驰创投', '北极光创投',
    '复星锐正', '金鼎资本', '华山资本', '凯泰资本', '万物资本'
  ]

  return (
    <>
      <PageHero
        title={currentTexts.hero.title}
        subtitle={currentTexts.hero.subtitle}
        badgeText={currentTexts.hero.badge}
        showButton={true}
        buttonText={currentTexts.hero.mainButton}
        buttonHref="https://uniquecapital.feishu.cn/share/base/form/shrcnoBvrDgExyUr3e4YMlmnxBd"
        showStats={true}
        statsType="funding"
      />

      {/* Stats Section */}
      <section className="border-y bg-muted/50 w-full">
        <div className="container py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold gradient-brand">100%</div>
              <div className="text-sm text-muted-foreground">{currentTexts.stats.successRate}</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-brand">365天</div>
              <div className="text-sm text-muted-foreground">{currentTexts.stats.avgTime}</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-brand">3000+</div>
              <div className="text-sm text-muted-foreground">{currentTexts.stats.vcPartners}</div>
            </div>
            <div>
              <div className="text-3xl font-bold gradient-brand">100+</div>
              <div className="text-sm text-muted-foreground">{currentTexts.stats.dealsClosed}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{currentTexts.features.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {currentTexts.features.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <Card key={idx} className="group hover:shadow-lg hover:shadow-brand-purple/10 transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className="w-12 h-12 gradient-brand-bg rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">{lang === 'zh' ? feature.titleZh : feature.titleEn}</CardTitle>
                    <CardDescription>
                      {lang === 'zh' ? feature.descZh : feature.descEn}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {feature.items.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {lang === 'zh' ? item.zh : item.en}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              {lang === 'zh' ? '极速融资工作流程' : 'Flash Fundraising Workflow'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {lang === 'zh' ? '从数据整合到成功融资，AI全程护航' : 'From data integration to successful fundraising, AI guides every step'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflow.map((step, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 gradient-brand-bg rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-white font-bold text-xl">{idx + 1}</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">{lang === 'zh' ? step.titleZh : step.titleEn}</h3>
                <p className="text-sm text-muted-foreground">
                  {lang === 'zh' ? step.descZh : step.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              {lang === 'zh' ? '合作伙伴网络' : 'Partner Network'}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {lang === 'zh' ? '与顶级VC和投资机构建立战略合作关系' : 'Strategic partnerships with top VCs and investment institutions'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {partners.map((partner) => (
              <div key={partner} className="group">
                <div className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:shadow-brand-purple/5 hover:-translate-y-0.5 hover:border-primary/20">
                  <div className="p-4 text-center">
                    <h3 className="text-sm font-semibold">{partner}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 w-full gradient-brand-bg">
        <div className="container text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-white">
            {lang === 'zh' ? '准备开始您的极速融资之旅？' : 'Ready to start your flash fundraising journey?'}
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            {lang === 'zh' ? '让AI成为您的融资代理，专注于业务发展' : 'Let AI be your fundraising agent while you focus on building'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
            <a href="https://uniquecapital.feishu.cn/share/base/form/shrcnoBvrDgExyUr3e4YMlmnxBd" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                className="h-12 px-8 font-semibold bg-white text-brand-purple hover:bg-white/90 group"
              >
                {lang === 'zh' ? '开始免费试用' : 'Start Free Trial'}
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </a>
            <a href="https://uniquecapital.feishu.cn/share/base/form/shrcnoBvrDgExyUr3e4YMlmnxBd" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="ghost"
                className="h-12 px-8 font-semibold border border-white/30 text-white bg-transparent hover:bg-white/10 hover:text-white"
              >
                {lang === 'zh' ? '预约演示' : 'Schedule Demo'}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
