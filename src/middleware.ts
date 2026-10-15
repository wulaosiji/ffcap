import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 子域名 → 路径映射
const SUBDOMAIN_MAP: Record<string, string> = {
  'ff.': '/flash-fundraising',
  'fa.': '/funding-agent',
}

// 反向映射：路径 → 子域名
const PATH_TO_SUBDOMAIN: Record<string, string> = {
  '/flash-fundraising': 'ff',
  '/funding-agent': 'fa',
}

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const { pathname } = request.nextUrl

  // 检测当前子域名前缀
  const subdomainPrefix = Object.keys(SUBDOMAIN_MAP).find(prefix => hostname.startsWith(prefix))

  if (subdomainPrefix) {
    const targetPath = SUBDOMAIN_MAP[subdomainPrefix]

    // 根路径 → 重写到对应页面
    if (pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = targetPath
      return NextResponse.rewrite(url)
    }

    // 如果访问的是另一个子域名对应的路径，重定向到那个子域名
    const matchedSubdomain = PATH_TO_SUBDOMAIN[pathname]
    if (matchedSubdomain && !hostname.startsWith(`${matchedSubdomain}.`)) {
      const baseDomain = hostname.replace(subdomainPrefix, '')
      return NextResponse.redirect(`https://${matchedSubdomain}.${baseDomain}`)
    }

    // 如果访问的是首页路径，重定向到主站
    if (pathname === '/home') {
      const baseDomain = hostname.replace(subdomainPrefix, '')
      return NextResponse.redirect(`https://${baseDomain}`)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
