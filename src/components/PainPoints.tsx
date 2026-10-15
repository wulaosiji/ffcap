import { useLang } from "@/context/LangContext"
export function PainPoints() {
  const { lang } = useLang()
  return (
    <section className={`w-full text-center py-20 bg-background`}>
      <p className={`text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-medium`}>
        {lang === 'zh' 
          ? '全球招聘顶级工程师很难：面试成本高、搜索无果、合规复杂。我们让流程安全、快速、简单。'
          : 'Hiring top engineers globally is difficult: high interview costs, fruitless searches, complex compliance. We make the process safe, fast, and simple.'
        }
      </p>
    </section>
  )
} 