import { homeLlmsDataPoints } from '@/content/home-llms-points.mjs'
import { buildLlmsFull } from '@/lib/llms-documents.mjs'

export function GET() {
  const body = buildLlmsFull({ highlights: homeLlmsDataPoints() })
  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
