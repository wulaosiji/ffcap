"use client"

import { useState, useEffect } from 'react'

interface SubdomainInfo {
  isSubdomain: boolean
  currentSubdomain: string | null  // 'ff' | 'fa' | null
  mainSiteUrl: string
}

/**
 * 检测当前是否在子域名访问，用于导航链接的域名感知
 * 返回值在客户端 hydration 后才会更新，避免 SSR/CSR 不匹配
 */
export function useSubdomain(): SubdomainInfo {
  const [info, setInfo] = useState<SubdomainInfo>({
    isSubdomain: false,
    currentSubdomain: null,
    mainSiteUrl: '/',
  })

  useEffect(() => {
    const hostname = window.location.hostname
    const protocol = window.location.protocol

    if (hostname.startsWith('ff.')) {
      const baseDomain = hostname.replace('ff.', '')
      setInfo({
        isSubdomain: true,
        currentSubdomain: 'ff',
        mainSiteUrl: `${protocol}//${baseDomain}`,
      })
    } else if (hostname.startsWith('fa.')) {
      const baseDomain = hostname.replace('fa.', '')
      setInfo({
        isSubdomain: true,
        currentSubdomain: 'fa',
        mainSiteUrl: `${protocol}//${baseDomain}`,
      })
    }
  }, [])

  return info
}

// 子域名映射表
const SUBDOMAIN_ROUTES: Record<string, string> = {
  '/funding-agent': 'fa',
  '/flash-fundraising': 'ff',
}

/**
 * 根据子域名状态获取正确的导航 href
 * - 主站上：返回原始相对路径
 * - 子域名上：如果目标是另一个子域名页面，返回完整 URL
 */
export function getNavHref(href: string, info: SubdomainInfo): { href: string; isExternal: boolean } {
  if (!info.isSubdomain) {
    return { href, isExternal: false }
  }

  // 首页链接 → 主站
  if (href === '/') {
    return { href: info.mainSiteUrl, isExternal: true }
  }

  // 检查是否是子域名映射的路径
  const targetSubdomain = SUBDOMAIN_ROUTES[href]
  if (targetSubdomain) {
    if (targetSubdomain === info.currentSubdomain) {
      // 当前子域名的页面，用根路径
      return { href: '/', isExternal: false }
    }
    // 另一个子域名的页面
    const baseDomain = info.mainSiteUrl.replace(/https?:\/\//, '')
    return { href: `${window.location.protocol}//${targetSubdomain}.${baseDomain}`, isExternal: true }
  }

  // 其他路径 → 主站对应路径
  return { href: `${info.mainSiteUrl}${href}`, isExternal: true }
}
