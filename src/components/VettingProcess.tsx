/**
 * 人才筛选流程区块，展示平台筛选开发者的四步流程。
 * 卡片采用圆角、阴影、hover动画，图标居中，风格极简。
 */
import { useLang } from "@/context/LangContext"
export function VettingProcess() {
  const { lang } = useLang()
  const steps = [
    { 
      num: 1, 
      title: lang === 'zh' ? '初筛' : 'Initial Screening', 
      desc: lang === 'zh' ? '简历与经验评估' : 'Resume and experience evaluation' 
    },
    { 
      num: 2, 
      title: lang === 'zh' ? '技术评测' : 'Technical Assessment', 
      desc: lang === 'zh' ? '编程任务与现场考核' : 'Programming tasks and on-site assessment' 
    },
    { 
      num: 3, 
      title: lang === 'zh' ? '深度验证' : 'Deep Verification', 
      desc: lang === 'zh' ? '法律、文化与创业契合度' : 'Legal, cultural, and startup fit' 
    },
    { 
      num: 4, 
      title: lang === 'zh' ? '精英甄选' : 'Elite Selection', 
      desc: lang === 'zh' ? '最终仅1%通过' : 'Only 1% pass final selection' 
    },
  ]
  return (
    <section className={`w-full py-10 bg-background`}>
      <h2 className={`text-2xl font-bold text-primary text-center mb-8`}>
        {lang === 'zh' ? '人才筛选流程' : 'Talent Vetting Process'}
      </h2>
      <div className="flex flex-col md:flex-row justify-center items-center gap-8">
        {steps.map(step => (
          <div key={step.num} className="flex flex-col items-center bg-white rounded-xl shadow-card p-6 w-64 transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-1 hover:scale-105">
            <div className="w-14 h-14 flex items-center justify-center rounded-full bg-accent text-white font-bold text-2xl mb-4 shadow-btn">{step.num}</div>
            <div className={`font-bold text-primary mb-1`}>{step.title}</div>
            <div className={`text-gray-500 text-base text-center`}>{step.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
} 