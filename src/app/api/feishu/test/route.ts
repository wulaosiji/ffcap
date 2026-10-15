import { NextResponse } from 'next/server'
import FeishuDataService from '@/services/feishuDataService'

const feishuService = new FeishuDataService()

export async function GET() {
  try {
    console.log('🔍 测试飞书API连接...')
    
    const result = await feishuService.testConnection()
    
    if (result.success) {
      console.log('✅ 飞书API连接测试成功')
      return NextResponse.json({
        success: true,
        message: '飞书API连接正常',
        data: result.data
      })
    } else {
      console.log('❌ 飞书API连接测试失败:', result.error)
      return NextResponse.json({
        success: false,
        message: '飞书API连接失败',
        error: result.error
      }, { status: 500 })
    }
  } catch (error) {
    console.error('飞书API连接测试异常:', error)
    return NextResponse.json({
      success: false,
      message: '飞书API连接测试异常',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 