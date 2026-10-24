import type { Metadata } from "next"
import "./globals.css"
import ClientLayout from "@/components/ClientLayout"
import { StructuredData } from "@/components/StructuredData"
import { IDENTITY, organizationGraph } from "@/content/site-identity.mjs"
import PerformanceMonitor from "@/components/PerformanceMonitor"
import GoogleAnalytics from "@/components/GoogleAnalytics"

export const metadata: Metadata = {
  metadataBase: new URL("https://ffcap.cn"),
  title: "非凡资本 UniqueCapital | AI 研究、资本与生态",
  description: IDENTITY.description,
  verification: {
    other: {
      "baidu-site-verification": "codeva-AwRpx0YzMV",
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen">
        <StructuredData data={organizationGraph()} />
        <ClientLayout>{children}</ClientLayout>
        <GoogleAnalytics measurementId={"G-JP9FNSTQYM"} />
        <PerformanceMonitor />
      </body>
    </html>
  )
}
