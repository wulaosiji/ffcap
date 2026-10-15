/**
 * 四步流程区块，展示用户合作流程。
 * 卡片采用圆角、阴影、hover动画，图标居中，风格极简。
 */
import { useLang } from "@/context/LangContext"
export function Steps() {
  const { lang } = useLang()
  const steps = [
    { 
      num: 1, 
      title: lang === 'zh' ? '提交需求' : 'Submit Requirements', 
      desc: lang === 'zh' ? '告诉我们你的技术需求' : 'Tell us your technical requirements' 
    },
    { 
      num: 2, 
      title: lang === 'zh' ? '极速匹配' : 'Fast Matching', 
      desc: lang === 'zh' ? '24小时内推荐合适开发者' : 'Recommend suitable developers within 24 hours' 
    },
    { 
      num: 3, 
      title: lang === 'zh' ? '试用体验' : 'Free Trial', 
      desc: lang === 'zh' ? '免费试用，满意后再合作' : 'Free trial, cooperate after satisfaction' 
    },
    { 
      num: 4, 
      title: lang === 'zh' ? '正式合作' : 'Formal Cooperation', 
      desc: lang === 'zh' ? '签约、合规、薪酬全托管' : 'Contract, compliance, and payroll management' 
    },
  ]
  return (
    <section id="how-to-hire" className={`bg-white rounded-2xl shadow-lg p-12`}>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8">
        {steps.map((step, i) => (
          <div key={step.num} className="flex flex-col items-center flex-1 gap-3 transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:scale-105 bg-white rounded-2xl p-8">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-black text-white font-bold text-2xl mb-4 shadow-btn">{step.num}</div>
            <div className={`font-bold text-primary text-lg mb-1`}>{step.title}</div>
            <div className={`text-gray-500 text-base text-center`}>{step.desc}</div>
            {i < steps.length - 1 && (
              <div className="hidden md:block h-1 w-full bg-gray-200 my-4" />
            )}
          </div>
        ))}
      </div>
    </section>
  )
} 