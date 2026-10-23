import { homeLlmsDataPoints } from '@/content/home-llms-points.mjs'
import { buildLlmsTxt } from '@/lib/llms-documents.mjs'

export function GET() {
  const body = buildLlmsTxt({ dataPoints: homeLlmsDataPoints() })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
