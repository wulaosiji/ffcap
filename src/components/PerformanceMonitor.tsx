"use client"
import { useEffect } from 'react'

export default function PerformanceMonitor() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            console.log('页面性能指标:', {
              'DNS查询时间': navEntry.domainLookupEnd - navEntry.domainLookupStart,
              'TCP连接时间': navEntry.connectEnd - navEntry.connectStart,
              '首字节时间': navEntry.responseStart - navEntry.requestStart,
              'DOM解析时间': navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              '页面完全加载时间': navEntry.loadEventEnd - navEntry.loadEventStart,
              '总加载时间': navEntry.loadEventEnd - navEntry.fetchStart,
            })
          }
        }
      })
      
      observer.observe({ entryTypes: ['navigation'] })
      
      return () => observer.disconnect()
    }
  }, [])

  return null
}
