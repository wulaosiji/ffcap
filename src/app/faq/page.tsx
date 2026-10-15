"use client";

import React, { useState } from 'react'
import { useLang } from '@/context/LangContext'
export default function FAQ() {
  const { lang } = useLang()
  const [open, setOpen] = useState<number | null>(null)
  
  const faqs = [
    {
      question: lang === 'zh' ? 'DevSignal 是什么？' : 'What is DevSignal?',
      answer: lang === 'zh' 
        ? 'DevSignal 是一个帮助企业快速雇佣全球顶级开发者的平台，所有开发者都经过严格筛选和技术评测。'
        : 'DevSignal is a platform that helps companies quickly hire top global developers, all of whom have undergone strict screening and technical assessment.'
    },
    {
      question: lang === 'zh' ? '雇佣开发者需要多长时间？' : 'How long does it take to hire developers?',
      answer: lang === 'zh'
        ? '平均 24 小时内即可匹配到合适的开发者，远快于传统招聘流程。'
        : 'On average, suitable developers can be matched within 24 hours, much faster than traditional recruitment processes.'
    },
    {
      question: lang === 'zh' ? '可以免费试用吗？' : 'Can I try for free?',
      answer: lang === 'zh'
        ? '支持 20 小时免费试用，满意后再正式合作，无风险。'
        : 'We offer a 20-hour free trial, and you can proceed with formal cooperation after satisfaction, with no risk.'
    },
    {
      question: lang === 'zh' ? '如何保障合规和薪酬？' : 'How do you ensure compliance and compensation?',
      answer: lang === 'zh'
        ? '平台全程托管合同、合规和薪酬，企业只需专注业务本身。'
        : 'The platform manages contracts, compliance, and compensation throughout the process, allowing companies to focus on their core business.'
    },
  ]

  return (
    <section id="faq" className={`max-w-2xl mx-auto my-20`}>
      <h2 className={`text-2xl font-bold text-black mb-10 text-center`}>
        {lang === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
      </h2>
      <div className="space-y-5">
        {faqs.map((item, idx) => (
          <div key={item.question} className="bg-white rounded-2xl shadow-lg">
            <button
              className={`w-full flex justify-between items-center px-8 py-6 text-lg font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black rounded-2xl transition`}
              onClick={() => setOpen(open === idx ? null : idx)}
              aria-expanded={open === idx}
            >
              {item.question}
              <span className={`ml-2 transition-transform ${open === idx ? 'rotate-90' : ''}`}>▶</span>
            </button>
            {open === idx && (
              <div className={`px-8 pb-6 text-gray-600 text-base animate-fade-in`}>
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

// 动画可选：在 globals.css 添加
// @keyframes fade-in { from { opacity: 0; transform: translateY(-8px);} to { opacity: 1; transform: none;} }
// .animate-fade-in { animation: fade-in 0.2s ease; } 