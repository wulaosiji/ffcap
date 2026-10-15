"use client"

/**
 * 客户评价区块，展示用户对平台的真实评价。
 * 卡片采用圆角、阴影、hover动画，风格极简。
 */
import { homeTexts } from "@/content/homeTexts"
import { useLang } from "@/context/LangContext"
import "@/styles/glassmorphism.css"

export function Testimonials() {
  const { lang } = useLang() // 或用props传入lang
  const items: { name: string; role: string; text: string }[] = homeTexts[lang].testimonials.items
  console.log('Testimonials lang:', lang, items)
  return (
    <section className="relative py-20">
      {/* 背景装饰层 */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white via-neutral-100 to-white dark:from-[#232946] dark:via-[#16161a] dark:to-[#0f172a]" />
      <div className={`container relative z-10`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {items.map((item) => (
            <div key={item.name} className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center gap-3 transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-1 hover:scale-105">
              <div className={`font-bold text-primary text-lg mb-1`}>{item.name}</div>
              <div className={`text-xs text-gray-400 mb-2`}>{item.role}</div>
              <div className={`text-gray-600 text-base`}>{item.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
} 