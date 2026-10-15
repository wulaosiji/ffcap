"use client"

import { useEffect, useState } from "react"
import { FundingAgentCard } from "@/components/FundingAgentCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { homeTexts } from "@/content/homeTexts"
import { useLang } from "@/context/LangContext"
import { useViewMode } from '@/context/ViewModeContext'
import { PageHero } from '@/components/PageHero'

interface FundingAgent {
  id: string
  名称: string
  描述: string
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

export default function FundingAgentPage() {
  const { lang } = useLang()
  const { viewMode } = useViewMode()
  const texts = homeTexts[lang]
  const [data, setData] = useState<FundingAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])

  const truncateText = (text: string | undefined, maxLength: number) => {
    if (!text) return ''
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
  }

  const fetchFundingAgents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      })
      
      if (selectedTags.length > 0) {
        params.append('type', selectedTags.join(','))
      }
      
      const res = await fetch(`/api/funding-agents?${params}`)
      if (!res.ok) {
        throw new Error(`API响应错误: ${res.status} ${res.statusText}`)
      }
      
      const data = await res.json()
      
      // 检测 API 返回的业务错误
      if (data.error) {
        throw new Error(data.error)
      }
      
      setData(data.fundingAgents)
      
      const allTags = new Set<string>()
      data.fundingAgents.forEach((agent: FundingAgent) => {
        if (agent.标签) {
          agent.标签.split(',').forEach(tag => {
            const trimmedTag = tag.trim()
            if (trimmedTag) {
              allTags.add(trimmedTag)
            }
          })
        }
      })
      setAvailableTags(Array.from(allTags).sort())
    } catch (error) {
      console.error('Error fetching funding agents:', error)
      setError(homeTexts[lang].fundingAgent.error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFundingAgents()
  }, [selectedTags])

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const clearAllTags = () => {
    setSelectedTags([])
  }

  const handleContact = (agent: FundingAgent) => {
    console.log('联系Funding Agent:', agent)
    alert(`${lang === 'zh' ? '联系' : 'Contact'} ${agent.名称}...`)
  }

  const heroSection = (
    <PageHero 
      title={homeTexts[lang].fundingAgent.title}
      subtitle={homeTexts[lang].fundingAgent.subtitle}
      showBadge={true}
      badgeText={lang === 'zh' ? '专业服务' : 'Professional Service'}
      showStats={true}
      statsType="funding-agent"
      showContactButton={true}
    />
  )

  if (loading) {
    return (
      <div>
        {heroSection}
        <div className="container py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[28rem]">
                <Skeleton className="h-full w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {heroSection}
        <div className="container py-12">
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">{error}</div>
            <p className="text-sm text-muted-foreground">{lang === 'zh' ? '请检查网络连接或稍后重试' : 'Please check your network connection or try again later'}</p>
            <Button
              className="mt-4"
              onClick={fetchFundingAgents}
            >
              {homeTexts[lang].fundingAgent.retry}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {heroSection}
      
      <div className="container py-12">

      {/* Tag Filter */}
      <div className="mb-8">
        <div className="text-center mb-4">
          {selectedTags.length > 0 && (
            <div className="mb-3">
              <span className="text-sm text-muted-foreground mr-2">{lang === 'zh' ? '已选择:' : 'Selected:'}</span>
              {selectedTags.map(tag => (
                <Button 
                  key={tag} 
                  variant="secondary" 
                  size="sm"
                  className="mr-2 mb-2 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => handleTagClick(tag)}
                >
                  {tag} ×
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearAllTags}
                className="ml-2"
              >
                {lang === 'zh' ? '清除全部' : 'Clear All'}
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {availableTags.map(tag => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "outline"}
              size="sm"
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedTags.includes(tag) 
                  ? 'gradient-brand-bg text-white border-0' 
                  : 'hover:border-primary/50'
              }`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {data.map((agent) => (
          <FundingAgentCard
            key={agent.id}
            agent={agent}
            onContact={handleContact}
          />
        ))}
      </div>
      ) : (
        <div className="space-y-4 mb-8">
          {data.map((agent, index) => (
            <Card key={agent.id} className="relative bg-card border border-border/50 shadow-sm hover:shadow-md hover:shadow-brand-purple/5 transition-all duration-200">
              <div className="flex flex-col md:flex-row items-start md:items-center p-4 md:p-6 gap-4">
                <div className="flex-1 w-full">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base md:text-lg font-semibold">{index + 1}. {agent.名称}</div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-2 md:line-clamp-1">{agent.描述 || (lang === 'zh' ? '暂无描述' : 'No description')}</div>
                    </div>
                    <Badge className="md:hidden whitespace-nowrap">{agent.状态}</Badge>
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-1.5 md:w-72 lg:w-80">
                  <div className="flex flex-wrap gap-1">
                    {agent.类型 && (
                      <Badge className="bg-primary/10 text-primary text-xs px-2 py-0.5">
                        {truncateText(agent.类型, 6)}
                      </Badge>
                    )}
                    {agent.状态 && (
                      <Badge className="bg-accent/10 text-accent text-xs px-2 py-0.5">
                        {truncateText(agent.状态, 5)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="hidden sm:flex flex-wrap gap-1">
                    {agent.地区 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        📍 {truncateText(agent.地区, 8)}
                      </Badge>
                    )}
                    {agent.投资阶段 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5">
                        🎯 {truncateText(agent.投资阶段, 6)}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="hidden lg:flex flex-wrap gap-1">
                    {agent.投资金额 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 border-primary/30 text-primary">
                        💰 {truncateText(agent.投资金额, 5)}
                      </Badge>
                    )}
                    {agent.成功率 && (
                      <Badge variant="outline" className="text-xs px-2 py-0.5 border-accent/30 text-accent">
                        📈 {truncateText(agent.成功率, 4)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {data.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">{lang === 'zh' ? '暂无符合条件的Funding Agent' : 'No matching Funding Agents found'}</div>
          <p className="text-sm text-muted-foreground">{lang === 'zh' ? '请尝试调整筛选条件或稍后再来' : 'Please try adjusting the filters or check back later'}</p>
          {selectedTags.length > 0 && (
            <Button 
              variant="outline" 
              onClick={clearAllTags}
              className="mt-4"
            >
              {lang === 'zh' ? '清除所有筛选条件' : 'Clear All Filters'}
            </Button>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
