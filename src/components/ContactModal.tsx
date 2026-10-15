'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useLang } from '@/context/LangContext'
interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

const ContactModal = ({ isOpen, onClose }: ContactModalProps) => {
  const { lang } = useLang()
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className={`bg-white dark:bg-gray-800 rounded-xl p-8 max-w-sm w-full mx-4 relative`}>
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 标题 */}
        <h3 className={`text-xl font-semibold text-gray-900 dark:text-white mb-4`}>
          {lang === 'zh' ? '加入AI智库交流群' : 'Join AI ThinkTank Community'}
        </h3>

        {/* 二维码 */}
        <div className="relative w-48 h-48 mx-auto mb-4">
          <Image
            src="/qrcode.png"
            alt={lang === 'zh' ? 'AI智库交流群二维码' : 'AI ThinkTank Community QR Code'}
            fill
            className="object-contain"
          />
        </div>

        {/* 说明文字 */}
        <p className={`text-sm text-gray-600 dark:text-gray-300 text-center`}>
          {lang === 'zh' 
            ? '扫描上方二维码，加入AI智库交流群'
            : 'Scan the QR code above to join the AI ThinkTank community'
          }
        </p>
      </div>
    </div>
  )
}

export default ContactModal 