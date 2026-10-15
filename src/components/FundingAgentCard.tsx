"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Star, TrendingUp, DollarSign, Building } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { translateTag } from '@/lib/tagTranslations'

interface FundingAgent {
  id: string
  名称: string
  描述: string
  '描述-EN'?: string
  'Teaser-EN'?: string
  类型: string
  状态: string
  联系方式: string
  地区: string
  投资阶段: string
  投资金额: string
  成功率: string
  评分: string
  标签: string
  备注: string
  创建时间: string
  更新时间: string
  公司介绍?: string
  项目亮点?: string
  融资计划?: string
  完整融资信息?: string
  原始Teaser?: string
  '公司介绍-EN'?: string
  '项目亮点-EN'?: string
  '融资计划-EN'?: string
  sourceTableId?: string
}

interface FundingAgentCardProps {
  agent: FundingAgent
  onContact?: (agent: FundingAgent) => void
}

export function FundingAgentCard({ agent, onContact }: FundingAgentCardProps) {
  const { lang } = useLang()
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div className="relative w-full h-[28rem] perspective-1000">
      <div
        className={`relative w-full h-full transition-all duration-500 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front */}
        <Card className={`absolute w-full h-full backface-hidden ${
          isFlipped ? 'opacity-0' : 'opacity-100'
        } transition-opacity duration-300 cursor-pointer hover:shadow-xl hover:shadow-brand-purple/10 hover:scale-[1.02] transition-all duration-500 shadow-lg rounded-2xl border border-border/50 bg-card`} onClick={handleFlip}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-bold mb-2">
                  {agent.名称}
                </CardTitle>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="capitalize">
                    {agent.类型}
                  </Badge>
                  <Badge variant={agent.状态 === '活跃' ? 'default' : 'outline'}>
                    {agent.状态}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {lang === 'zh' ? agent.描述 : (agent['描述-EN'] || agent.描述)}
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {lang === 'zh' ? '投资阶段' : 'Stage'}: {lang === 'zh' ? agent.投资阶段 : (agent.投资阶段?.replace(/轮/g, ' Round') || agent.投资阶段)}
                </span>
              </div>
              {agent.投资金额 && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {lang === 'zh' ? '融资需求' : 'Funding Need'}: {agent.投资金额}
                  </span>
                </div>
              )}
            </div>
            
            {agent.标签 && (
              <div className="flex flex-wrap gap-2">
                {agent.标签.split(',').map((tag, index) => {
                  const trimmedTag = tag.trim()
                  if (!trimmedTag) return null
                  return (
                    <Badge key={index} variant="outline" className="text-xs">
                      {translateTag(trimmedTag, lang)}
                    </Badge>
                  )
                })}
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full hover:border-primary/50"
                onClick={(e) => {
                  e.stopPropagation()
                  const isNewTable = agent.sourceTableId === 'tblbYjT2XBIhU11g'
                  const contactUrl = isNewTable 
                    ? 'https://uniquecapital.feishu.cn/share/base/form/shrcniP7FHLoRe2jAD89w3YdoOf'
                    : 'https://uniquecapital.feishu.cn/share/base/form/shrcnvAg3etDn79jFPh9aK6Yn6b'
                  window.open(contactUrl, '_blank')
                }}
              >
                {agent.sourceTableId === 'tblbYjT2XBIhU11g' 
                  ? (lang === 'zh' ? '联系创始人' : 'Contact Founder')
                  : (lang === 'zh' ? '联系代理' : 'Contact Agent')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back */}
        <Card className={`absolute w-full h-full backface-hidden rotate-y-180 ${
          isFlipped ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-300 cursor-pointer hover:shadow-xl transition-all duration-300 shadow-md rounded-xl border border-border bg-card overflow-hidden`} onClick={handleFlip}>
          <div className="h-full flex flex-col">
            {/* Company Introduction */}
            <div className="bg-primary/5 p-4 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-lg font-bold text-primary mb-3 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  {lang === 'zh' ? '公司介绍' : 'Company Introduction'}
                </h4>
                <div className="max-h-32 overflow-y-auto custom-scrollbar">
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {lang === 'zh' ? (agent.公司介绍 || "暂无公司介绍") : (agent['公司介绍-EN'] || agent.公司介绍 || "No company introduction available")}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Highlights */}
            <div className="flex-1 bg-accent/5 p-4 relative overflow-hidden">
              <div className="relative z-10 h-full flex flex-col">
                <h4 className="text-lg font-bold text-accent mb-3 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  {lang === 'zh' ? '项目亮点' : 'Project Highlights'}
                </h4>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="space-y-1">
                    {(lang === 'zh' ? agent.项目亮点 : agent['项目亮点-EN']) ? (lang === 'zh' ? agent.项目亮点 : agent['项目亮点-EN'])!.split('\n').map((line, index) => {
                      const numberedMatch = line.match(/^(\d+)[.、]\s*(.+)$/)
                      if (numberedMatch) {
                        return (
                          <div key={index} className="flex items-start p-1.5 bg-background/50 rounded-md">
                            <span className="font-bold text-primary mr-2 flex-shrink-0 text-xs">
                              {numberedMatch[1]}.
                            </span>
                            <span className="text-xs text-foreground/80 flex-1 leading-relaxed">
                              {numberedMatch[2]}
                            </span>
                          </div>
                        )
                      }
                      const bulletMatch = line.match(/^[•\-*]\s*(.+)$/)
                      if (bulletMatch) {
                        return (
                          <div key={index} className="flex items-start p-1.5 bg-background/50 rounded-md">
                            <span className="font-bold text-primary mr-2 flex-shrink-0 text-xs">•</span>
                            <span className="text-xs text-foreground/80 flex-1 leading-relaxed">
                              {bulletMatch[1]}
                            </span>
                          </div>
                        )
                      }
                      if (line.trim()) {
                        return (
                          <div key={index} className="p-1.5 bg-background/50 rounded-md">
                            <p className="text-xs text-foreground/80 leading-relaxed">{line}</p>
                          </div>
                        )
                      }
                      return null
                    }) : (
                      <p className="text-xs text-foreground/60">
                        {lang === 'zh' ? '暂无项目亮点' : 'No project highlights available'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
