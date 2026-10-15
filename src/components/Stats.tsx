import { useLang } from '@/context/LangContext'
export function Stats() {
  const { lang } = useLang()
  const stats = [
    { value: '24h', label: lang === 'zh' ? '极速匹配' : 'Fast Matching' },
    { value: '$80k', label: lang === 'zh' ? '每人年均节省' : 'Annual Savings per Person' },
    { value: '20h', label: lang === 'zh' ? '免费试用' : 'Free Trial' },
  ]
  return (
    <section className="w-full flex flex-col md:flex-row justify-center items-center gap-12 py-14 bg-background">
      {stats.map(stat => (
        <div key={stat.label} className="flex flex-col items-center">
          <div className={`text-5xl md:text-6xl font-extrabold text-black mb-3 tracking-tight`}>{stat.value}</div>
          <div className={`text-gray-500 text-lg font-medium`}>{stat.label}</div>
        </div>
      ))}
    </section>
  )
} 