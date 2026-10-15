/**
 * "为什么选择我们"区块，展示平台核心优势。
 * 卡片采用圆角、阴影、hover动画，图标居中，风格极简。
 */
import { useLang } from "@/context/LangContext"
export function WhyChooseUs() {
  const { lang } = useLang()
  const items = [
    { 
      icon: '⚡️', 
      title: lang === 'zh' ? '极速匹配' : 'Fast Matching', 
      desc: lang === 'zh' ? '24小时内匹配顶级开发者' : 'Match top developers within 24 hours' 
    },
    { 
      icon: '💰', 
      title: lang === 'zh' ? '高性价比' : 'Cost Effective', 
      desc: lang === 'zh' ? '节省60%用人成本' : 'Save 60% on hiring costs' 
    },
    { 
      icon: '🛡️', 
      title: lang === 'zh' ? '合规保障' : 'Compliance', 
      desc: lang === 'zh' ? '合同、合规、薪酬全托管' : 'Contract, compliance, and payroll management' 
    },
    { 
      icon: '🌍', 
      title: lang === 'zh' ? '全球顶尖' : 'Global Elite', 
      desc: lang === 'zh' ? '全球1%精英开发者' : 'Top 1% global developers' 
    },
  ]
  return (
    <section className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 bg-white rounded-2xl shadow-lg p-12`}>
      {items.map(item => (
        <div key={item.title} className="flex flex-col items-center text-center gap-2 bg-white rounded-2xl transition-all duration-300 ease-out shadow-lg hover:shadow-xl hover:-translate-y-1 hover:scale-105 p-8">
          <div className="text-5xl mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-gray-100">{item.icon}</div>
          <div className={`font-bold text-lg text-primary mb-1`}>{item.title}</div>
          <div className={`text-gray-500 text-base`}>{item.desc}</div>
        </div>
      ))}
    </section>
  )
} 