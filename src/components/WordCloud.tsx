"use client"
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, TrendingUp, Users, Zap } from 'lucide-react'

interface WordCloudProps {
  words: Array<{
    text: string
    value: number
    color: string
  }>
  className?: string
}

export default function WordCloud({ words, className = "" }: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const containerRef = useRef<HTMLDivElement>(null)

  // 按价值分组投资机构
  const categories = {
    all: { label: '全部', icon: Building2, color: 'bg-blue-500' },
    top: { label: '顶级', icon: TrendingUp, color: 'bg-purple-500' },
    growth: { label: '成长', icon: Zap, color: 'bg-green-500' },
    emerging: { label: '新兴', icon: Users, color: 'bg-orange-500' }
  }

  const getCategory = (value: number) => {
    if (value >= 8) return 'top'
    if (value >= 5) return 'growth'
    return 'emerging'
  }

  const filteredWords = selectedCategory === 'all' 
    ? words 
    : words.filter(word => getCategory(word.value) === selectedCategory)

  const getRandomPosition = () => ({
    x: Math.random() * 70 - 35, // -35 to 35
    y: Math.random() * 70 - 35, // -35 to 35
    rotation: Math.random() * 60 - 30, // -30 to 30 degrees
  })

  const getFontSize = (value: number) => {
    const minSize = 14
    const maxSize = 52
    return Math.max(minSize, Math.min(maxSize, value * 2.5 + 18))
  }

  const getOpacity = (value: number) => {
    return Math.max(0.6, Math.min(1, value / 10))
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {Object.entries(categories).map(([key, category]) => {
          const Icon = category.icon
          const isActive = selectedCategory === key
          const count = key === 'all' 
            ? words.length 
            : words.filter(word => getCategory(word.value) === key).length

          return (
            <motion.button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200 ${
                isActive 
                  ? `${category.color} text-white border-transparent shadow-lg` 
                  : 'bg-background border-border hover:border-primary/50 hover:bg-primary/5'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{category.label}</span>
              <span className="text-xs opacity-75">({count})</span>
            </motion.button>
          )
        })}
      </div>

      {/* Word Cloud Container */}
      <div 
        ref={containerRef}
        className="relative w-full h-[500px] bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900/50 dark:via-blue-950/20 dark:to-purple-950/20 rounded-2xl border border-border/50 overflow-hidden shadow-lg"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[length:20px_20px]" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full h-full">
            <AnimatePresence mode="wait">
              {filteredWords.map((word, index) => {
                const position = getRandomPosition()
                const fontSize = getFontSize(word.value)
                const opacity = getOpacity(word.value)
                const category = getCategory(word.value)
                
                return (
                  <motion.div
                    key={`${word.text}-${selectedCategory}`}
                    className="absolute cursor-pointer select-none"
                    style={{
                      left: `${50 + position.x}%`,
                      top: `${50 + position.y}%`,
                      transform: `translate(-50%, -50%) rotate(${position.rotation}deg)`,
                    }}
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ 
                      opacity: opacity, 
                      scale: 1,
                      y: 0,
                      transition: { 
                        delay: index * 0.05,
                        duration: 0.6,
                        ease: "easeOut"
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0,
                      transition: { duration: 0.3 }
                    }}
                    whileHover={{ 
                      scale: 1.3, 
                      zIndex: 10,
                      transition: { duration: 0.2 }
                    }}
                    onHoverStart={() => setHoveredWord(word.text)}
                    onHoverEnd={() => setHoveredWord(null)}
                  >
                    <motion.span
                      className="font-semibold transition-all duration-300"
                      style={{
                        fontSize: `${fontSize}px`,
                        color: hoveredWord === word.text ? '#3b82f6' : word.color,
                        textShadow: hoveredWord === word.text 
                          ? '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)' 
                          : `0 2px 4px rgba(0,0,0,0.1)`,
                        filter: hoveredWord === word.text ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 'none',
                      }}
                      whileHover={{
                        textShadow: '0 0 20px rgba(59, 130, 246, 0.8), 0 0 40px rgba(59, 130, 246, 0.4)',
                      }}
                    >
                      {word.text}
                    </motion.span>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Hover Info */}
        <AnimatePresence>
          {hoveredWord && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl px-6 py-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {hoveredWord}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {categories[getCategory(words.find(w => w.text === hoveredWord)?.value || 0)]?.label}级投资机构
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full" />
          <span>顶级机构 (8-10分)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span>成长机构 (5-7分)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded-full" />
          <span>新兴机构 (2-4分)</span>
        </div>
      </div>
    </div>
  )
}
