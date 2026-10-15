import { NextResponse } from 'next/server'
import FeishuDataService from '@/services/feishuDataService'

const feishuService = new FeishuDataService()

// 强制动态渲染
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log('API: 开始处理Funding Agent数据请求...')
    
    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || '正在融资'  // 默认只显示正在融资的项目
    const region = searchParams.get('region') || ''
    const stage = searchParams.get('stage') || ''
    const sortBy = searchParams.get('sortBy') || '名称'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    console.log('API: 查询参数:', {
      type, status, region, stage, sortBy, sortOrder, page, limit
    })
    
    // 从飞书获取数据
    const fundingAgents = await feishuService.getAllFundingAgents()
    
    // 数据过滤
    let filteredData = fundingAgents.filter((agent: any) => {
      // 类型过滤（支持多个标签）
      if (type) {
        const typeTags = type.split(',').map(t => t.trim().toLowerCase())
        const agentTags = agent.标签 ? agent.标签.split(',').map((t: string) => t.trim().toLowerCase()) : []
        
        // 改进匹配逻辑：支持部分匹配
        const hasMatchingTag = typeTags.some(typeTag => 
          agentTags.some((agentTag: string) => 
            agentTag.includes(typeTag) || typeTag.includes(agentTag)
          )
        )
        
        if (!hasMatchingTag) {
          return false
        }
      }
      
      // 状态过滤（status=all 时显示全部）
      if (status && status !== 'all' && agent.状态 !== status) {
        return false
      }
      
      // 地区过滤
      if (region && agent.地区 !== region) {
        return false
      }
      
      // 投资阶段过滤
      if (stage && agent.投资阶段 !== stage) {
        return false
      }
      
      return true
    })
    
    // 数据排序
    filteredData.sort((a: any, b: any) => {
      let aValue = (a as any)[sortBy] || 0
      let bValue = (b as any)[sortBy] || 0
      
      // 确保数值比较
      if (typeof aValue === 'string') aValue = parseFloat(aValue) || 0
      if (typeof bValue === 'string') bValue = parseFloat(bValue) || 0
      
      if (sortOrder === 'asc') {
        return aValue - bValue
      } else {
        return bValue - aValue
      }
    })
    
    // 分页
    const total = filteredData.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = filteredData.slice(startIndex, endIndex)
    
    // 获取可用的过滤选项
    const availableTypes = [...new Set(fundingAgents.filter((a: any) => a.类型).map((a: any) => a.类型))]
    const availableStatuses = [...new Set(fundingAgents.filter((a: any) => a.状态).map((a: any) => a.状态))]
    const availableRegions = [...new Set(fundingAgents.filter((a: any) => a.地区).map((a: any) => a.地区))]
    const availableStages = [...new Set(fundingAgents.filter((a: any) => a.投资阶段).map((a: any) => a.投资阶段))]
    
    const response = {
      fundingAgents: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        type,
        status,
        region,
        stage,
        sortBy,
        sortOrder
      },
      availableFilters: {
        types: availableTypes,
        statuses: availableStatuses,
        regions: availableRegions,
        stages: availableStages
      }
    }
    
    console.log(`API: 返回${paginatedData.length}条Funding Agent数据，总计${total}条`)
    console.log(`API: 筛选参数 - type: "${type}", status: "${status}", region: "${region}", stage: "${stage}"`)
    if (type) {
      console.log(`API: 筛选标签: ${type.split(',').map(t => t.trim())}`)
    }
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('获取Funding Agent数据失败:', error)
    // 返回空数据而不是错误，避免前端崩溃
    return NextResponse.json({
      fundingAgents: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      filters: {
        type: '',
        status: '',
        region: '',
        stage: '',
        sortBy: '评分',
        sortOrder: 'desc'
      },
      availableFilters: { types: [], statuses: [], regions: [], stages: [] },
      error: error instanceof Error ? error.message : '未知错误'
    })
  }
} 