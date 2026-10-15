"use client"
import { useLang } from '@/context/LangContext'
export default function Submit() {
  const { lang } = useLang()

  const texts = {
    zh: {
      title: "提交您的 AI 应用",
      description: "如果您有符合条件的 AI 应用，欢迎提交至榜单。请发送应用信息至",
      email: "tips@leanaileaderboard.com",
      thanks: "感谢您的支持！"
    },
    en: {
      title: "Submit Your AI Application",
      description: "If you have a qualified AI application, welcome to submit to our leaderboard. Please send application information to",
      email: "tips@leanaileaderboard.com",
      thanks: "Thank you for your support!"
    }
  }

  const currentTexts = texts[lang]

  return (
    <div className={`max-w-2xl mx-auto py-12`}>
      <h2 className={`text-2xl font-bold mb-4`}>{currentTexts.title}</h2>
      <p className={`text-gray-700 mb-4`}>
        {currentTexts.description} <a href={`mailto:${currentTexts.email}`} className="text-primary underline">{currentTexts.email}</a>，我们会尽快审核。
      </p>
      <p className={`text-gray-700`}>{currentTexts.thanks}</p>
    </div>
  )
} 