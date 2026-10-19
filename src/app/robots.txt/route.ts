import { ROBOTS_TXT } from '@/content/robots-txt.mjs'

export function GET() {
  return new Response(ROBOTS_TXT, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
