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
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png" }],
  },
  verification: {
    other: {
      "baidu-site-verification": "codeva-0YLvK3GiMy",
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
