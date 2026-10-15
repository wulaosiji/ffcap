'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { getAnalytics } from '@/lib/analytics-runtime'

export default function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()

  useEffect(() => {
    // A new committed path is a page view. Search and fragment changes are not.
    // Scheduling permits the page title to settle and cancels StrictMode's first effect.
    const timer = window.setTimeout(() => {
      try {
        getAnalytics(measurementId)?.track(pathname, document.title)
      } catch {
        // Measurement must never interrupt navigation or page rendering.
      }
    }, 0)
    return () => window.clearTimeout(timer)
  }, [measurementId, pathname])

  return null
}
